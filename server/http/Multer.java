package http;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * The parts of multer used by admin.js: diskStorage (destination + filename),
 * fileFilter, limits.fileSize and upload.single(field).
 */
public class Multer {
    public interface Destination { Path get(Request req, String originalname) throws IOException; }
    public interface Filename { String get(Request req, String originalname); }
    public interface FileFilter { boolean accept(Request req, String originalname); }

    private final Destination destination;
    private final Filename filename;
    private final FileFilter fileFilter;
    private final String filterError;
    private final long fileSizeLimit;

    /**
     * @param filterError message of the Error passed to cb() when the filter rejects a file
     */
    public Multer(Destination destination, Filename filename, FileFilter fileFilter,
                  String filterError, long fileSizeLimit) {
        this.destination = destination;
        this.filename = filename;
        this.fileFilter = fileFilter;
        this.filterError = filterError;
        this.fileSizeLimit = fileSizeLimit;
    }

    /** upload.single(field): parses multipart text fields into req.body and saves one file. */
    public Router.Handler single(String field) {
        return (req, res) -> {
            String ct = req.header("Content-Type");
            String boundary = boundary(ct);
            if (boundary == null) return; // not multipart: multer does nothing
            byte[] body;
            try (InputStream in = req.exchange.getRequestBody()) {
                body = in.readAllBytes();
            }
            Map<String, Object> fields = new LinkedHashMap<>();
            for (Part p : parse(body, boundary)) {
                if (p.filename == null) {
                    fields.put(p.name, new String(p.data, StandardCharsets.UTF_8));
                    continue;
                }
                if (!p.name.equals(field)) throw new Express.HttpError(500, "MulterError: Unexpected field");
                if (!fileFilter.accept(req, p.filename)) throw new RuntimeException(filterError);
                if (p.data.length > fileSizeLimit) throw new Express.HttpError(500, "MulterError: File too large");
                Path dir = destination.get(req, p.filename);
                String name = filename.get(req, p.filename);
                Path dest = dir.resolve(name);
                Files.write(dest, p.data);
                req.file = new Request.UploadedFile(p.name, p.filename, p.contentType,
                        dir.toString(), name, dest.toString(), p.data.length);
            }
            req.body = fields;
        };
    }

    // ── multipart/form-data parsing ─────────────────────────────────────

    private record Part(String name, String filename, String contentType, byte[] data) {}

    private static final Pattern BOUNDARY = Pattern.compile("boundary=(?:\"([^\"]+)\"|([^;\\s]+))");
    private static final Pattern NAME = Pattern.compile("[; ]name=\"([^\"]*)\"");
    private static final Pattern FILENAME = Pattern.compile("filename=\"([^\"]*)\"");

    private static String boundary(String contentType) {
        if (contentType == null || !contentType.toLowerCase().startsWith("multipart/form-data")) return null;
        Matcher m = BOUNDARY.matcher(contentType);
        if (!m.find()) return null;
        return m.group(1) != null ? m.group(1) : m.group(2);
    }

    private static List<Part> parse(byte[] body, String boundary) {
        List<Part> parts = new java.util.ArrayList<>();
        byte[] delimiter = ("--" + boundary).getBytes(StandardCharsets.ISO_8859_1);
        byte[] headerEnd = "\r\n\r\n".getBytes(StandardCharsets.ISO_8859_1);
        int pos = indexOf(body, delimiter, 0);
        while (pos >= 0) {
            int start = pos + delimiter.length;
            if (start + 1 < body.length && body[start] == '-' && body[start + 1] == '-') break;
            start += 2;
            int next = indexOf(body, delimiter, start);
            if (next < 0) break;
            int hdrEnd = indexOf(body, headerEnd, start);
            if (hdrEnd < 0 || hdrEnd > next) { pos = next; continue; }
            String headers = new String(body, start, hdrEnd - start, StandardCharsets.UTF_8);
            int dataStart = hdrEnd + headerEnd.length;
            int dataEnd = Math.max(dataStart, next - 2);
            byte[] data = java.util.Arrays.copyOfRange(body, dataStart, dataEnd);

            String disposition = null, contentType = null;
            for (String line : headers.split("\r\n")) {
                String lower = line.toLowerCase();
                if (lower.startsWith("content-disposition:")) disposition = line;
                else if (lower.startsWith("content-type:")) contentType = line.substring(13).trim();
            }
            if (disposition != null) {
                Matcher n = NAME.matcher(disposition);
                if (n.find()) {
                    Matcher f = FILENAME.matcher(disposition);
                    parts.add(new Part(n.group(1), f.find() ? f.group(1) : null, contentType, data));
                }
            }
            pos = next;
        }
        return parts;
    }

    private static int indexOf(byte[] haystack, byte[] needle, int from) {
        outer:
        for (int i = Math.max(0, from); i <= haystack.length - needle.length; i++) {
            for (int j = 0; j < needle.length; j++) {
                if (haystack[i + j] != needle[j]) continue outer;
            }
            return i;
        }
        return -1;
    }
}
