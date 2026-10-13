package http;

import java.util.ArrayList;
import java.util.List;

/** express.Router(): routes like router.get('/rounds/:id', ...) with middleware chains. */
public class Router {
    @FunctionalInterface
    public interface Handler {
        void handle(Request req, Response res) throws Exception;
    }

    private record Route(String method, String[] parts, Handler[] handlers) {}

    private final List<Route> routes = new ArrayList<>();

    public void get(String path, Handler... handlers) { add("GET", path, handlers); }
    public void post(String path, Handler... handlers) { add("POST", path, handlers); }
    public void put(String path, Handler... handlers) { add("PUT", path, handlers); }
    public void delete(String path, Handler... handlers) { add("DELETE", path, handlers); }

    private void add(String method, String path, Handler[] handlers) {
        routes.add(new Route(method, split(path), handlers));
    }

    private static String[] split(String path) {
        String p = path.replaceAll("^/+|/+$", "");
        return p.isEmpty() ? new String[0] : p.split("/");
    }

    /** Runs the matching route for a path relative to the mount point. Returns false if none matched. */
    boolean dispatch(String subPath, Request req, Response res) throws Exception {
        String[] parts = split(subPath);
        for (Route r : routes) {
            if (!r.method.equals(req.method) || r.parts.length != parts.length) continue;
            boolean match = true;
            for (int i = 0; i < parts.length && match; i++) {
                if (r.parts[i].startsWith(":")) {
                    req.params.put(r.parts[i].substring(1), java.net.URLDecoder.decode(parts[i], "UTF-8"));
                } else if (!r.parts[i].equalsIgnoreCase(parts[i])) {
                    match = false;
                }
            }
            if (!match) continue;
            for (Handler h : r.handlers) {
                h.handle(req, res);
                if (res.sent) break;
            }
            return true;
        }
        return false;
    }
}
