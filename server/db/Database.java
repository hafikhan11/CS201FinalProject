package db;

import java.nio.file.Files;
import java.nio.file.Path;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.ResultSetMetaData;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

// Uses SQLite through the sqlite-jdbc driver (server/lib/sqlite-jdbc.jar).
// Mirrors the node:sqlite DatabaseSync API used by the original: exec(), prepare().get/all/run().
public class Database {
    // Paths are relative to the project root (npm scripts run from there).
    static final Path DB_PATH = Path.of("server", "db", "game.db");
    static final Path SCHEMA_PATH = Path.of("server", "db", "schema.sql");

    public static final Database db = open();

    private final Connection conn;

    private Database(Connection conn) {
        this.conn = conn;
    }

    private static Database open() {
        try {
            Database db = new Database(DriverManager.getConnection("jdbc:sqlite:" + DB_PATH));

            // WAL mode for better concurrent read performance
            db.exec("PRAGMA journal_mode = WAL");

            String schema = Files.readString(SCHEMA_PATH);
            db.exec(schema);

            return db;
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    /** Runs one or more SQL statements separated by semicolons. */
    public synchronized void exec(String sql) throws SQLException {
        try (Statement st = conn.createStatement()) {
            for (String part : sql.split(";")) {
                if (!part.isBlank()) st.execute(part);
            }
        }
    }

    public Stmt prepare(String sql) {
        return new Stmt(sql);
    }

    /** Result of Stmt.run(): { changes, lastInsertRowid }. */
    public record RunResult(int changes, long lastInsertRowid) {}

    public class Stmt {
        private final String sql;

        Stmt(String sql) {
            this.sql = sql;
        }

        /** First row as a column→value map, or null (undefined) if there is none. */
        public Map<String, Object> get(Object... params) throws SQLException {
            List<Map<String, Object>> rows = all(params);
            return rows.isEmpty() ? null : rows.get(0);
        }

        /** All rows as column→value maps. */
        public List<Map<String, Object>> all(Object... params) throws SQLException {
            synchronized (Database.this) {
                try (PreparedStatement ps = conn.prepareStatement(sql)) {
                    bind(ps, params);
                    try (ResultSet rs = ps.executeQuery()) {
                        ResultSetMetaData md = rs.getMetaData();
                        List<Map<String, Object>> rows = new ArrayList<>();
                        while (rs.next()) {
                            Map<String, Object> row = new LinkedHashMap<>();
                            for (int i = 1; i <= md.getColumnCount(); i++) {
                                Object v = rs.getObject(i);
                                row.put(md.getColumnLabel(i), v instanceof Integer n ? Long.valueOf(n) : v);
                            }
                            rows.add(row);
                        }
                        return rows;
                    }
                }
            }
        }

        public RunResult run(Object... params) throws SQLException {
            synchronized (Database.this) {
                try (PreparedStatement ps = conn.prepareStatement(sql)) {
                    bind(ps, params);
                    int changes = ps.executeUpdate();
                    long rowid;
                    try (Statement st = conn.createStatement();
                         ResultSet rs = st.executeQuery("SELECT last_insert_rowid()")) {
                        rowid = rs.next() ? rs.getLong(1) : 0;
                    }
                    return new RunResult(changes, rowid);
                }
            }
        }

        private void bind(PreparedStatement ps, Object[] params) throws SQLException {
            for (int i = 0; i < params.length; i++) ps.setObject(i + 1, params[i]);
        }
    }
}
