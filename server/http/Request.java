package http;

import com.sun.net.httpserver.HttpExchange;

import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.Map;

/** Express's req: method, path, route params, parsed body and (after multer) the uploaded file. */
public class Request {
    public final HttpExchange exchange;
    public final String method;
    public final String path;
    public Map<String, Object> body = new LinkedHashMap<>();
    public Map<String, String> params = new HashMap<>();
    public UploadedFile file;
    byte[] rawBody;

    /** Equivalent of multer's req.file. */
    public record UploadedFile(String fieldname, String originalname, String mimetype,
                               String destination, String filename, String path, long size) {}

    Request(HttpExchange exchange) {
        this.exchange = exchange;
        this.method = exchange.getRequestMethod().toUpperCase();
        this.path = exchange.getRequestURI().getPath();
    }

    public String header(String name) {
        return exchange.getRequestHeaders().getFirst(name);
    }
}
