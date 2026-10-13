package routes;

import http.Router;
import map.CampusMap;

import java.awt.Color;
import java.awt.Shape;
import java.awt.geom.PathIterator;
import java.awt.geom.Rectangle2D;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

/**
 * GET /api/map — the campus map from map/CampusMap.java (the java-map project),
 * converted to SVG path data so the React Map component can draw it.
 */
public class Campus {
    public static final Router router = new Router();

    // The java-map design area is 1536 × 1024; its bottom strip (y ≥ 920) holds the
    // standalone app's title and legend, so the game shows only the map itself.
    static final int MAP_AREA_HEIGHT = 920;

    static String svgPath(Shape shape) {
        StringBuilder d = new StringBuilder();
        double[] c = new double[6];
        for (PathIterator it = shape.getPathIterator(null); !it.isDone(); it.next()) {
            switch (it.currentSegment(c)) {
                case PathIterator.SEG_MOVETO -> d.append('M').append(num(c[0])).append(' ').append(num(c[1]));
                case PathIterator.SEG_LINETO -> d.append('L').append(num(c[0])).append(' ').append(num(c[1]));
                case PathIterator.SEG_QUADTO -> d.append('Q').append(num(c[0])).append(' ').append(num(c[1]))
                        .append(' ').append(num(c[2])).append(' ').append(num(c[3]));
                case PathIterator.SEG_CUBICTO -> d.append('C').append(num(c[0])).append(' ').append(num(c[1]))
                        .append(' ').append(num(c[2])).append(' ').append(num(c[3]))
                        .append(' ').append(num(c[4])).append(' ').append(num(c[5]));
                case PathIterator.SEG_CLOSE -> d.append('Z');
            }
        }
        return d.toString();
    }

    static String num(double v) {
        String s = String.format(Locale.ROOT, "%.1f", v);
        return s.endsWith(".0") ? s.substring(0, s.length() - 2) : s;
    }

    static String hex(Color c) {
        if (c == null) return null;
        String rgb = String.format("#%02x%02x%02x", c.getRed(), c.getGreen(), c.getBlue());
        return c.getAlpha() == 255 ? rgb : rgb + String.format("%02x", c.getAlpha());
    }

    static String fillRule(Shape shape) {
        return shape.getPathIterator(null).getWindingRule() == PathIterator.WIND_EVEN_ODD ? "evenodd" : "nonzero";
    }

    static Map<String, Object> buildMapJson() {
        CampusMap map = new CampusMap();

        List<Object> marks = new ArrayList<>();
        for (CampusMap.Mark m : map.marks) {
            if (m.shape.getBounds2D().getMinY() >= MAP_AREA_HEIGHT) continue;
            Map<String, Object> o = new LinkedHashMap<>();
            o.put("d", svgPath(m.shape));
            o.put("fill", hex(m.fill));
            o.put("stroke", hex(m.outline));
            o.put("fillRule", fillRule(m.shape));
            marks.add(o);
        }

        List<Object> labels = new ArrayList<>();
        for (CampusMap.Label l : map.labels) {
            if (l.y >= MAP_AREA_HEIGHT) continue;
            Map<String, Object> o = new LinkedHashMap<>();
            o.put("lines", List.of(l.text.split("\n")));
            o.put("x", l.x);
            o.put("y", l.y);
            o.put("size", l.size);
            labels.add(o);
        }

        List<Object> buildings = new ArrayList<>();
        for (CampusMap.Building b : map.buildings.values()) {
            Rectangle2D box = b.footprint.getBounds2D();
            Map<String, Object> o = new LinkedHashMap<>();
            o.put("name", b.title());
            o.put("category", b.category);
            o.put("description", b.description);
            o.put("d", svgPath(b.footprint));
            o.put("fillRule", fillRule(b.footprint));
            o.put("centerX", box.getCenterX());
            o.put("centerY", box.getCenterY());
            buildings.add(o);
        }

        List<Object> legend = new ArrayList<>();
        Object[][] categories = {
                {"Academic", CampusMap.ACADEMIC}, {"Services", CampusMap.SERVICE}, {"Housing", CampusMap.HOUSING},
                {"Sports", CampusMap.SPORT}, {"Water", CampusMap.WATER}};
        for (Object[] c : categories) legend.add(Map.of("name", c[0], "color", hex((Color) c[1])));

        Map<String, Object> out = new LinkedHashMap<>();
        out.put("width", CampusMap.WIDTH);
        out.put("height", MAP_AREA_HEIGHT);
        out.put("ink", hex(CampusMap.INK));
        out.put("marks", marks);
        out.put("labels", labels);
        out.put("buildings", buildings);
        out.put("legend", legend);
        return out;
    }

    static final Map<String, Object> MAP_JSON = buildMapJson();

    static {
        // GET /api/map — map geometry, labels and clickable places
        router.get("/", (req, res) -> res.json(MAP_JSON));
    }
}
