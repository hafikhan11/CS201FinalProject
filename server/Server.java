import http.Express;

import java.nio.file.Path;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.LinkedHashMap;
import java.util.Map;

public class Server {
    public static void main(String[] args) throws Exception {
        System.setProperty("java.awt.headless", "true"); // map geometry uses java.awt.geom only
        Express app = new Express();
        int PORT = System.getenv("PORT") != null ? Integer.parseInt(System.getenv("PORT")) : 3001;

        app.cors("http://localhost:5173", true);
        // express.json() and express.urlencoded() are applied to every request by Express.

        // Serve static images
        app.useStatic("/images", Path.of("public", "images"));

        // API routes
        app.use("/api/game", routes.Game.router);
        app.use("/api/leaderboard", routes.Leaderboard.router);
        app.use("/api/admin", routes.Admin.router);
        app.use("/api/map", routes.Campus.router);

        // Health check
        app.get("/api/health", (req, res) -> {
            Map<String, Object> out = new LinkedHashMap<>();
            out.put("status", "ok");
            out.put("time", Instant.now().truncatedTo(ChronoUnit.MILLIS).toString());
            res.json(out);
        });

        app.listen(PORT, () -> {
            System.out.println("\nDKU GeoGuesser server running on http://localhost:" + PORT);
            System.out.println("  API: http://localhost:" + PORT + "/api/health");
            System.out.println("  Tip: Add rounds at http://localhost:5173/admin\n");
        });
    }
}
