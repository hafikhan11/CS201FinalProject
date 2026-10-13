package http;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;

import java.io.IOException;
import java.io.InputStream;
import java.net.InetSocketAddress;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.Executors;

/**
 * The parts of Express used by server.js, on top of the JDK's built-in HTTP server:
 * cors(), express.json(), express.urlencoded(), express.static(), app.use(path, router),
 * app.get(), app.listen(), and Express's default 404 / error responses.
 */
public class Express {
    /** An error carrying an HTTP status (like Express errors with err.status). */
    public static class HttpError extends RuntimeException {
        final int status;

        public HttpError(int status, String message) {
            super(message);
            this.status = status;
        }
    }

    private record Mount(String prefix, Router router) {}
    private record Static(String prefix, Path dir) {}

    private String corsOrigin;
    private boolean corsCredentials;
    private final List<Static> statics = new ArrayList<>();
    private final List<Mount> mounts = new ArrayList<>();
    private final Router appRoutes = new Router();

    // ── Configuration ───────────────────────────────────────────────────

    /** app.use(cors({ origin, credentials })) */
    public void cors(String origin, boolean credentials) {
        this.corsOrigin = origin;
        this.corsCredentials = credentials;
    }

    /** app.use(prefix, express.static(dir)) */
    public void useStatic(String prefix, Path dir) {
        statics.add(new Static(prefix, dir));
    }

    /** app.use(prefix, router) */
    public void use(String prefix, Router router) {
        mounts.add(new Mount(prefix, router));
    }

    /** app.get(path, handler) */
    public void get(String path, Router.Handler handler) {
        appRoutes.get(path, handler);
    }

    /** app.listen(port, callback) */
    public void listen(int port, Runnable callback) throws IOException {
        HttpServer server = HttpServer.create(new InetSocketAddress(port), 0);
        server.createContext("/", this::handle);
        server.setExecutor(Executors.newCachedThreadPool());
        server.start();
        callback.run();
    }

    // ── Request pipeline ────────────────────────────────────────────────

    private void handle(HttpExchange ex) {
        Request req = new Request(ex);
        Response res = new Response(ex);
        try {
            // cors()
            if (corsOrigin != null) {
                res.set("Access-Control-Allow-Origin", corsOrigin);
                if (corsCredentials) res.set("Access-Control-Allow-Credentials", "true");
                res.set("Vary", "Origin");
            }
            if (req.method.equals("OPTIONS")) {
                res.set("Access-Control-Allow-Methods", "GET,HEAD,PUT,PATCH,POST,DELETE");
                String reqHeaders = req.header("Access-Control-Request-Headers");
                if (reqHeaders != null) res.set("Access-Control-Allow-Headers", reqHeaders);
                res.status(204).send(new byte[0]);
                return;
            }

            // express.json() + express.urlencoded()
            parseBody(req);

            // express.static()
            if (req.method.equals("GET") || req.method.equals("HEAD")) {
                for (Static s : statics) {
                    if (!req.path.startsWith(s.prefix + "/")) continue;
                    String rel = URLDecoder.decode(req.path.substring(s.prefix.length() + 1), StandardCharsets.UTF_8);
                    Path file = s.dir.toAbsolutePath().normalize().resolve(rel).normalize();
                    if (file.startsWith(s.dir.toAbsolutePath().normalize()) && Files.isRegularFile(file)) {
                        res.sendFile(file, contentType(file.toString()));
                        return;
                    }
                }
            }

            // Routers
            for (Mount m : mounts) {
                if (req.path.equalsIgnoreCase(m.prefix) || req.path.toLowerCase().startsWith(m.prefix.toLowerCase() + "/")) {
                    if (m.router.dispatch(req.path.substring(m.prefix.length()), req, res)) return;
                }
            }
            if (appRoutes.dispatch(req.path, req, res)) return;

            // Express's default 404
            res.status(404).sendHtml(errorPage("Cannot " + req.method + " " + req.path));
        } catch (Throwable e) {
            // Express's default error handler
            int status = e instanceof HttpError he ? he.status : 500;
            System.err.println(e);
            if (!res.sent) {
                try {
                    res.status(status).sendHtml(errorPage(e instanceof HttpError ? e.getMessage() : "Error: " + e.getMessage()));
                } catch (IOException ignored) {
                }
            }
        } finally {
            ex.close();
        }
    }

    private static void parseBody(Request req) throws IOException {
        String ct = req.header("Content-Type");
        if (ct == null) return;
        String type = ct.toLowerCase();
        if (type.startsWith("multipart/form-data")) return; // left for multer
        byte[] raw;
        try (InputStream in = req.exchange.getRequestBody()) {
            raw = in.readNBytes(100 * 1024 + 1);
        }
        if (raw.length > 100 * 1024) throw new HttpError(413, "PayloadTooLargeError: request entity too large");
        String text = new String(raw, StandardCharsets.UTF_8);

        if (type.startsWith("application/json")) {
            if (text.isBlank()) return;
            Object parsed;
            try {
                parsed = Json.parse(text);
            } catch (IllegalArgumentException e) {
                throw new HttpError(400, "SyntaxError: " + e.getMessage());
            }
            if (!(parsed instanceof Map<?, ?> || parsed instanceof List<?>)) {
                throw new HttpError(400, "SyntaxError: Unexpected token in JSON");
            }
            if (parsed instanceof Map<?, ?> m) {
                @SuppressWarnings("unchecked")
                Map<String, Object> body = (Map<String, Object>) m;
                req.body = body;
            }
        } else if (type.startsWith("application/x-www-form-urlencoded")) {
            Map<String, Object> form = new LinkedHashMap<>();
            for (String pair : text.split("&")) {
                if (pair.isEmpty()) continue;
                int eq = pair.indexOf('=');
                String k = URLDecoder.decode(eq < 0 ? pair : pair.substring(0, eq), StandardCharsets.UTF_8);
                String v = eq < 0 ? "" : URLDecoder.decode(pair.substring(eq + 1), StandardCharsets.UTF_8);
                form.put(k, v);
            }
            req.body = form;
        }
    }

    private static String errorPage(String message) {
        String escaped = message.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;");
        return "<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n<meta charset=\"utf-8\">\n<title>Error</title>\n"
                + "</head>\n<body>\n<pre>" + escaped + "</pre>\n</body>\n</html>\n";
    }

    private static String contentType(String name) {
        String n = name.toLowerCase();
        if (n.endsWith(".jpg") || n.endsWith(".jpeg")) return "image/jpeg";
        if (n.endsWith(".png")) return "image/png";
        if (n.endsWith(".webp")) return "image/webp";
        if (n.endsWith(".svg")) return "image/svg+xml";
        if (n.endsWith(".gif")) return "image/gif";
        return "application/octet-stream";
    }
}
