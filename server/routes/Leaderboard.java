package routes;

import http.Json;
import http.Router;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import static db.Database.db;
import static http.Json.truthy;

public class Leaderboard {
    public static final Router router = new Router();

    static {
        // GET /api/leaderboard — top 20 scores
        router.get("/", (req, res) -> {
            List<Map<String, Object>> scores = db.prepare("""
                    SELECT id, player_name, total_score, round_details, created_at
                    FROM scores
                    ORDER BY total_score DESC, created_at ASC
                    LIMIT 20
                    """).all();

            List<Map<String, Object>> parsed = new ArrayList<>();
            for (Map<String, Object> s : scores) {
                Map<String, Object> row = new LinkedHashMap<>(s);
                row.put("round_details", Json.parse((String) s.get("round_details")));
                parsed.add(row);
            }

            res.json(parsed);
        });

        // POST /api/leaderboard — submit a score
        router.post("/", (req, res) -> {
            Object playerName = req.body.get("playerName");
            Object totalScore = req.body.get("totalScore");
            Object roundDetails = req.body.get("roundDetails");

            if (!truthy(playerName) || !req.body.containsKey("totalScore") || !truthy(roundDetails)) {
                res.status(400).json(Map.of("error", "Missing playerName, totalScore, or roundDetails"));
                return;
            }

            var stmt = db.prepare(
                    "INSERT INTO scores (player_name, total_score, round_details) VALUES (?, ?, ?)");

            var result = stmt.run(((String) playerName).trim(), totalScore, Json.stringify(roundDetails));
            System.out.println("[Leaderboard] New score: " + playerName + " — " + Json.stringify(totalScore)
                    + " pts (id: " + result.lastInsertRowid() + ")");

            Map<String, Object> out = new LinkedHashMap<>();
            out.put("id", result.lastInsertRowid());
            out.put("message", "Score saved");
            res.json(out);
        });
    }
}
