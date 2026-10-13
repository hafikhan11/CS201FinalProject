package http;

import com.sun.net.httpserver.HttpExchange;

import java.io.IOException;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;

/** Express's res: status(), json(), send(), sendFile(). */
public class Response {
    private final HttpExchange exchange;
    private int status = 200;
    boolean sent;

    Response(HttpExchange exchange) {
        this.exchange = exchange;
    }

    public Response status(int code) {
        this.status = code;
        return this;
    }

    public void set(String header, String value) {
        exchange.getResponseHeaders().set(header, value);
    }

    public void json(Object body) throws IOException {
        set("Content-Type", "application/json; charset=utf-8");
        send(Json.stringify(body).getBytes(StandardCharsets.UTF_8));
    }

    public void sendHtml(String html) throws IOException {
        set("Content-Type", "text/html; charset=utf-8");
        send(html.getBytes(StandardCharsets.UTF_8));
    }

    public void send(byte[] bytes) throws IOException {
        sent = true;
        exchange.sendResponseHeaders(status, bytes.length == 0 ? -1 : bytes.length);
        try (OutputStream out = exchange.getResponseBody()) {
            out.write(bytes);
        }
    }

    public void sendFile(Path file, String contentType) throws IOException {
        set("Content-Type", contentType);
        sent = true;
        exchange.sendResponseHeaders(status, Files.size(file));
        try (OutputStream out = exchange.getResponseBody()) {
            Files.copy(file, out);
        }
    }
}
