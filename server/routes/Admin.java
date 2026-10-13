package routes;

import http.Multer;
import http.Router;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import static db.Database.db;
import static http.Json.truthy;

public class Admin {
    public static final Router router = new Router();

    static final Path IMAGES_DIR = Path.of("public", "images");

    static String extname(String filename) {
        String base = filename.substring(Math.max(filename.lastIndexOf('/'), filename.lastIndexOf('\\')) + 1);
        int dot = base.lastIndexOf('.');
        return dot > 0 ? base.substring(dot) : "";
    }

    static final Multer upload = new Multer(
            // destination
            (req, file) -> {
                if (!Files.exists(IMAGES_DIR)) {
                    Files.createDirectories(IMAGES_DIR);
                }
                return IMAGES_DIR;
            },
            // filename
            (req, file) -> {
                String ext = extname(file);
                String name = "round_" + System.currentTimeMillis() + ext;
                return name;
            },
            // fileFilter
            (req, file) -> {
                List<String> allowed = List.of(".jpg", ".jpeg", ".png", ".webp", ".svg");
                String ext = extname(file).toLowerCase();
                return allowed.contains(ext);
            },
            "Only image files are allowed",
            20L * 1024 * 1024 // 20MB
    );

    static {
        // GET /api/admin/rounds — list all rounds
        router.get("/rounds", (req, res) -> {
            var rounds = db.prepare("SELECT * FROM rounds ORDER BY created_at DESC").all();
            res.json(rounds);
        });

        // POST /api/admin/rounds — add a new round
        router.post("/rounds", upload.single("image"), (req, res) -> {
            Object building_name = req.body.get("building_name");
            Object floor = req.body.get("floor");
            Object hint = req.body.get("hint");

            if (req.file == null) {
                res.status(400).json(Map.of("error", "Image file is required"));
                return;
            }
            if (!truthy(building_name) || !truthy(floor)) {
                Files.delete(Path.of(req.file.path()));
                res.status(400).json(Map.of("error", "building_name and floor are required"));
                return;
            }

            String image_path = "/images/" + req.file.filename();
            var stmt = db.prepare(
                    "INSERT INTO rounds (image_path, building_name, floor, hint) VALUES (?, ?, ?, ?)");
            String trimmedHint = hint == null || ((String) hint).trim().isEmpty() ? null : ((String) hint).trim();
            var result = stmt.run(image_path, ((String) building_name).trim(), ((String) floor).trim(), trimmedHint);

            System.out.println("[Admin] Added round: " + building_name + " / " + floor + " (id: " + result.lastInsertRowid() + ")");
            Map<String, Object> out = new LinkedHashMap<>();
            out.put("id", result.lastInsertRowid());
            out.put("image_path", image_path);
            out.put("building_name", building_name);
            out.put("floor", floor);
            if (hint != null) out.put("hint", hint); // undefined is omitted by JSON.stringify
            res.json(out);
        });

        // PUT /api/admin/rounds/:id — edit a round's answer (building, floor, hint)
        router.put("/rounds/:id", (req, res) -> {
            Object building_name = req.body.get("building_name");
            Object floor = req.body.get("floor");
            Object hint = req.body.get("hint");

            var round = db.prepare("SELECT * FROM rounds WHERE id = ?").get(req.params.get("id"));
            if (round == null) {
                res.status(404).json(Map.of("error", "Round not found"));
                return;
            }
            if (!truthy(building_name) || !truthy(floor)) {
                res.status(400).json(Map.of("error", "building_name and floor are required"));
                return;
            }

            String trimmedHint = hint == null || ((String) hint).trim().isEmpty() ? null : ((String) hint).trim();
            db.prepare("UPDATE rounds SET building_name = ?, floor = ?, hint = ? WHERE id = ?")
                    .run(((String) building_name).trim(), ((String) floor).trim(), trimmedHint, req.params.get("id"));

            System.out.println("[Admin] Edited round " + req.params.get("id") + ": " + building_name + " / " + floor);
            res.json(db.prepare("SELECT * FROM rounds WHERE id = ?").get(req.params.get("id")));
        });

        // DELETE /api/admin/rounds/:id — delete a round
        router.delete("/rounds/:id", (req, res) -> {
            var round = db.prepare("SELECT * FROM rounds WHERE id = ?").get(req.params.get("id"));
            if (round == null) {
                res.status(404).json(Map.of("error", "Round not found"));
                return;
            }

            // Delete image file if it exists
            String imagePath = ((String) round.get("image_path")).replaceFirst("^/+", "");
            Path imgPath = Path.of("public").resolve(imagePath);
            if (Files.exists(imgPath)) {
                Files.delete(imgPath);
            }

            db.prepare("DELETE FROM rounds WHERE id = ?").run(req.params.get("id"));
            System.out.println("[Admin] Deleted round " + req.params.get("id"));
            res.json(Map.of("message", "Round deleted"));
        });
    }
}
