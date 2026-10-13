package routes;

import http.Router;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import static db.Database.db;
import static http.Json.truthy;

public class Game {
    public static final Router router = new Router();

    // Building floor definitions (names match the places on map/CampusMap.java)
    static final Map<String, List<String>> BUILDING_FLOORS = new LinkedHashMap<>();
    static {
        BUILDING_FLOORS.put("Academic Building", List.of("B1", "1F", "2F", "3F", "4F", "Rooftop"));
        BUILDING_FLOORS.put("Innovation Building", List.of("1F", "2F", "3F", "4F"));
        BUILDING_FLOORS.put("WHU-DUKE Research", List.of("1F", "2F", "3F"));
        BUILDING_FLOORS.put("Library", List.of("B1", "1F", "2F", "3F"));
        BUILDING_FLOORS.put("Conference Center", List.of("B1", "1F", "2F", "3F"));
        BUILDING_FLOORS.put("Water Pavilion", List.of("1F"));
        BUILDING_FLOORS.put("Admin", List.of("1F", "2F", "3F"));
        BUILDING_FLOORS.put("Sports Complex", List.of("1F", "2F"));
        BUILDING_FLOORS.put("Residence Hall", List.of("1F", "2F", "3F", "4F", "5F", "6F"));
        BUILDING_FLOORS.put("Service I", List.of("1F", "2F"));
        BUILDING_FLOORS.put("Service II", List.of("1F", "2F"));
        BUILDING_FLOORS.put("Community Center W", List.of("1F", "2F", "3F"));
        BUILDING_FLOORS.put("Community Center E", List.of("1F", "2F", "3F"));
        BUILDING_FLOORS.put("Graduate Center", List.of("1F", "2F", "3F"));
        BUILDING_FLOORS.put("Faculty Housing", List.of("1F", "2F", "3F", "4F", "5F"));
        BUILDING_FLOORS.put("Employee Center North", List.of("1F", "2F"));
        BUILDING_FLOORS.put("Employee Center South", List.of("1F", "2F"));
        BUILDING_FLOORS.put("Visitor Center", List.of("1F", "2F"));
        BUILDING_FLOORS.put("Lake", List.of("1F"));
        BUILDING_FLOORS.put("Campus Square", List.of("1F"));
        BUILDING_FLOORS.put("Soccer Field", List.of("1F"));
        BUILDING_FLOORS.put("Tennis Courts", List.of("1F"));
        // Dorms 15A–15H use the default floors below (1F–3F).
    }

    static {
        // GET /api/game/start — returns 10 random rounds (no answers)
        router.get("/start", (req, res) -> {
            List<Map<String, Object>> rounds = db.prepare("""
                    SELECT id, image_path, hint
                    FROM rounds
                    ORDER BY RANDOM()
                    LIMIT 10
                    """).all();

            if (rounds.isEmpty()) {
                res.status(404).json(Map.of("error", "No rounds available. Add rounds in the Admin Panel."));
                return;
            }

            System.out.println("[Game] Starting new game with " + rounds.size() + " rounds");
            res.json(Map.of("rounds", rounds));
        });

        // POST /api/game/guess — submit building guess
        router.post("/guess", (req, res) -> {
            Object roundId = req.body.get("roundId");
            Object buildingGuess = req.body.get("buildingGuess");

            if (!truthy(roundId) || !truthy(buildingGuess)) {
                res.status(400).json(Map.of("error", "Missing roundId or buildingGuess"));
                return;
            }

            Map<String, Object> round = db.prepare("SELECT * FROM rounds WHERE id = ?").get(roundId);
            if (round == null) {
                res.status(404).json(Map.of("error", "Round not found"));
                return;
            }

            String buildingName = (String) round.get("building_name");
            boolean correct = buildingName.toLowerCase().equals(((String) buildingGuess).toLowerCase());
            System.out.println("[Guess] Round " + roundId + ": guessed \"" + buildingGuess + "\", correct is \""
                    + buildingName + "\" — " + (correct ? "CORRECT" : "WRONG"));

            if (!correct) {
                Map<String, Object> out = new LinkedHashMap<>();
                out.put("correct", false);
                out.put("correctBuilding", buildingName);
                out.put("points", 0);
                out.put("floors", null);
                res.json(out);
                return;
            }

            List<String> floors = BUILDING_FLOORS.getOrDefault(buildingName, List.of("1F", "2F", "3F"));

            Map<String, Object> out = new LinkedHashMap<>();
            out.put("correct", true);
            out.put("correctBuilding", buildingName);
            out.put("points", 300);
            out.put("floors", floors);
            res.json(out);
        });

        // POST /api/game/guess-floor — submit floor guess (only after correct building)
        router.post("/guess-floor", (req, res) -> {
            Object roundId = req.body.get("roundId");
            Object floorGuess = req.body.get("floorGuess");

            if (!truthy(roundId) || !truthy(floorGuess)) {
                res.status(400).json(Map.of("error", "Missing roundId or floorGuess"));
                return;
            }

            Map<String, Object> round = db.prepare("SELECT * FROM rounds WHERE id = ?").get(roundId);
            if (round == null) {
                res.status(404).json(Map.of("error", "Round not found"));
                return;
            }

            String floor = (String) round.get("floor");
            boolean correct = floor.toLowerCase().equals(((String) floorGuess).toLowerCase());
            System.out.println("[Floor] Round " + roundId + ": guessed \"" + floorGuess + "\", correct is \""
                    + floor + "\" — " + (correct ? "CORRECT" : "WRONG"));

            Map<String, Object> out = new LinkedHashMap<>();
            out.put("correct", correct);
            out.put("correctFloor", floor);
            out.put("points", correct ? 500 : 300);
            res.json(out);
        });
    }
}
