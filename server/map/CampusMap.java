package map;

import java.awt.*;
import java.awt.geom.*;
import java.util.*;
import java.util.List;

/** Map coordinates follow the reference: (0,0) is TOP LEFT, units are design pixels. */
public final class CampusMap {
    public static final int WIDTH = 1536, HEIGHT = 1024;
    public static final Color GRASS = new Color(165, 208, 145);
    public static final Color ROAD = new Color(243, 245, 244);
    public static final Color WATER = new Color(65, 191, 233);
    public static final Color ACADEMIC = new Color(181, 168, 247);
    public static final Color SERVICE = new Color(255, 204, 94);
    public static final Color HOUSING = new Color(219, 241, 142);
    public static final Color SPORT = new Color(129, 181, 95);
    public static final Color INK = new Color(20, 37, 62);

    public static final class Mark {
        public final Shape shape;
        public final Color fill, outline;
        Mark(Shape shape, Color fill, Color outline) {
            this.shape = shape; this.fill = fill; this.outline = outline;
        }
    }
    public static final class Label {
        public final String text;
        public final double x, y;
        public final int size;
        Label(String text, double x, double y, int size) {
            this.text = text; this.x = x; this.y = y; this.size = size;
        }
    }
    public static final class Building {
        public final String name, category;
        public final Area footprint;
        public final List<Point2D.Double> entrances = new ArrayList<>();
        public String description = "";
        Building(String name, String category, Shape footprint) {
            this.name = name; this.category = category; this.footprint = new Area(footprint);
        }
        public String title() { return name.replace('\n', ' '); }
    }

    // Ordered lists preserve painting order; map provides lookup by unique building name.
    // Later entries sit on top, so click lookup walks the map in reverse.
    public final List<Mark> marks = new ArrayList<>();
    public final List<Label> labels = new ArrayList<>();
    public final Map<String, Building> buildings = new LinkedHashMap<>();

    public CampusMap() {
        terrain();
        buildings();
        entrances();
        descriptions();
        furniture();
    }
    public static Shape rectangle(double x, double y, double w, double h) {
        return new Rectangle2D.Double(x, y, w, h);
    }
    public static Shape polygon(double... xy) {
        Path2D.Double path = new Path2D.Double();
        path.moveTo(xy[0], xy[1]);
        for (int i = 2; i < xy.length; i += 2) path.lineTo(xy[i], xy[i + 1]);
        path.closePath();
        return path;
    }
    private void mark(Shape s, Color color) { marks.add(new Mark(s, color, null)); }
    private void outlined(Shape s, Color color) { marks.add(new Mark(s, color, INK)); }
    private void label(String text, double x, double y, int size) {
        labels.add(new Label(text, x, y, size));
    }
    private void road(double width, double... xy) {
        for(int i=0;i+3<xy.length;i+=2) {
            Shape segment=new Line2D.Double(xy[i],xy[i+1],xy[i+2],xy[i+3]);
            Shape paved = new BasicStroke((float)width, BasicStroke.CAP_ROUND,
                    BasicStroke.JOIN_ROUND).createStrokedShape(segment);
            mark(paved,ROAD);
        }
    }
    private static String category(Color color) {
        return color==ACADEMIC?"Academic":color==SERVICE?"Services":color==HOUSING?"Housing":"Sports";
    }
    private Building add(String name, Shape shape, Color color, double x, double y, int size) {
        Building b = place(name, category(color), shape);
        outlined(shape, color);
        label(name, x, y, size);
        return b;
    }
    /** Registers a clickable area without drawing it; several shapes form one place. */
    private Building place(String name, String category, Shape... shapes) {
        Building b = new Building(name, category, shapes[0]);
        for (int i = 1; i < shapes.length; i++) b.footprint.add(new Area(shapes[i]));
        buildings.put(name, b);
        return b;
    }
    private void terrain() {
        mark(rectangle(0, 0, WIDTH, 920), GRASS);
        Shape lake=polygon(302,299,602,299,602,332,538,332,538,364,514,364,
                514,428,548,428,548,607,395,607,395,562,340,562,340,420,302,420);
        mark(lake,WATER); place("Lake","Landmark",lake);
        mark(polygon(79,328,96,340,118,469,95,590,120,708,116,821,85,824,75,736,80,575,95,457),WATER);
        mark(rectangle(615,283,137,339), new Color(224,221,215));
        mark(rectangle(565,447,100,135), new Color(224,221,215));
        road(18, 57,445, 48,200, 95,124, 525,124, 539,86, 600,86,
                600,54, 1414,54, 1487,140, 1487,821, 1425,882,
                103,882, 53,828, 53,445);
        road(14, 63,280, 305,280, 754,277);
        road(14, 279,132, 279,342, 316,342);
        road(14, 373,127, 373,160, 754,160, 1230,160);
        road(14, 634,162, 634,277);
        road(32, 771,55, 771,885);
        road(14, 1230,60, 1230,408);
        // One continuous avenue of equal width north of Community Center and Sports Complex.
        road(26, 771,409, 1479,409);
        road(28, 771,545, 1479,545);
        road(14, 1190,409, 1190,546);
        road(16, 920,159, 920,545);
        road(14, 1063,99, 1063,545);
        for (int y : new int[]{96,166,235,303}) road(12, 920,y, 1230,y);
        road(14, 129,444, 129,658, 175,815);
        road(14, 55,446, 128,446, 178,487);
        road(14, 56,523, 178,487);
        road(14, 178,487, 178,630, 754,630);
        road(14, 173,830, 754,830, 1479,830);
        road(14, 176,815, 122,867);
        road(14, 332,426, 332,570, 377,570, 377,630);
        road(14, 567,446, 567,630);
        road(14, 1135,545, 1135,830);
        road(14, 1258,545, 1258,830);
        road(12, 930,545, 930,685);
        road(12, 771,660, 930,660);
        road(12, 1090,629, 1258,629);
        road(12, 1120,709, 1479,709);
        road(12, 1258,644, 1286,644);
        road(12, 930,830, 930,891);
        Shape roundabout = new Ellipse2D.Double(148,456,60,60);
        mark(roundabout, ROAD); mark(new Ellipse2D.Double(162,470,32,32), GRASS);
        mark(new Ellipse2D.Double(145,785,60,60), ROAD);
        mark(new Ellipse2D.Double(159,799,32,32), GRASS);
        mark(rectangle(298,413,220,14),ROAD);
        mark(rectangle(409,278,14,179),ROAD);
        mark(rectangle(399,335,34,29),ROAD);
        // Garden: lawn is the default; only these paths are paved.
        road(10, 920,686,1114,686,1114,820,920,820,920,686);
        mark(new Ellipse2D.Double(939.5,699.5,160,105), ROAD);
        mark(new Ellipse2D.Double(948.5,708.5,142,87), GRASS);
        road(9, 938,687,1108,814);
        road(9, 1018,800,1018,820);
        place("Campus Square","Landmark",rectangle(920,686,194,134));
        label("Campus\nSquare", 1015,753,19);
        label("Lake",450,550,19);
        label("Academic Avenue",1130,545,18);
    }
    private void buildings() {
        add("Faculty\nHousing",polygon(98,207,124,207,124,175,247,175,247,261,98,261),HOUSING,177,220,18);
        add("Residence Hall",polygon(297,174,578,174,578,191,607,191,607,258,297,258),HOUSING,453,218,20);
        add("Service I",rectangle(615,81,128,53),SERVICE,679,110,18);
        add("Service II",rectangle(799,81,126,53),SERVICE,862,110,18);
        add("Graduate\nCenter",rectangle(802,310,97,77),HOUSING,850,350,18);
        add("Conference\nCenter",polygon(146,357,297,357,297,438,314,438,314,578,369,578,
                369,622,276,622,276,608,241,608,241,453,204,453,204,426,146,426),SERVICE,221,397,18);
        add("Academic\nBuilding",polygon(539,332,714,332,714,580,634,580,634,453,574,453,
                574,428,514,428,514,364,539,364),ACADEMIC,623,396,20);
        outlined(rectangle(406,447,29,29),SERVICE);
        place("Water Pavilion","Landmark",rectangle(406,447,29,29));
        label("Water Pavilion",423,494,16);
        add("Innovation Building",rectangle(231,663,505,122),ACADEMIC,483,733,21);
        add("WHU-DUKE\nResearch",rectangle(798,684,108,117),ACADEMIC,852,744,17);
        add("Library",polygon(937,583,1091,583,1091,669,959,669),ACADEMIC,1024,631,20);
        add("Admin",rectangle(1165,580,75,94),SERVICE,1203,630,17);
        add("Visitor\nCenter",rectangle(1165,732,75,87),SERVICE,1202,775,17);
        add("Community\nCenter W",rectangle(938,430,101,84),SERVICE,988,471,14);
        add("Community\nCenter E",rectangle(1085,430,93,84),SERVICE,1132,471,14);
        outlined(rectangle(1039,470,46,17),new Color(230,220,177));
        label("Skybridge",1062,452,9);
        for (int y=472;y<487;y+=6) mark(rectangle(1059,y,7,3),ROAD);
        String[][] dorms={{"15H","15D"},{"15G","15C"},{"15F","15B"},{"15E","15A"}};
        int[] ys={108,177,246,314};
        for(int row=0;row<4;row++) for(int col=0;col<2;col++) {
            int x=col==0?947:1085, h=row==3?63:51;
            add(dorms[row][col],rectangle(x,ys[row],112,h),HOUSING,x+56,ys[row]+h/2.0,18);
        }
        courtyard("Employee Center North",1286,580,169,98);
        courtyard("Employee Center South",1286,714,172,97);
        label("Employee Center",1370,699,19);
        add("Sports Complex",rectangle(1201,430,260,84),SPORT,1331,476,20);
        outlined(rectangle(1257,103,190,285),SPORT);
        place("Soccer Field","Sports",rectangle(1257,103,190,285));
        marks.add(new Mark(rectangle(1272,123,162,251),null,Color.WHITE));
        marks.add(new Mark(rectangle(1310,123,86,28),null,Color.WHITE));
        marks.add(new Mark(rectangle(1310,346,86,28),null,Color.WHITE));
        marks.add(new Mark(new Ellipse2D.Double(1322,203,61,61),null,Color.WHITE));
        mark(rectangle(1272,232,162,2),Color.WHITE);
        label("Soccer\nField",1352,298,20);
        tennis(1199,109); tennis(1199,307);
        place("Tennis Courts","Sports",rectangle(1199,109,36,79),rectangle(1199,307,36,79));
    }
    private void courtyard(String name,int x,int y,int w,int h) {
        Shape outer=rectangle(x,y,w,h), inner=rectangle(x+28,y+24,w-56,h-48);
        place(name,"Housing",outer);
        outlined(outer,HOUSING); outlined(inner,SPORT);
    }
    private void tennis(int x,int y) {
        outlined(rectangle(x,y,36,79),SPORT);
        marks.add(new Mark(rectangle(x+6,y+8,24,63),null,Color.WHITE));
        mark(rectangle(x+6,y+39,24,1.5),Color.WHITE);
        mark(rectangle(x+10,y+8,1,63),Color.WHITE);
        mark(rectangle(x+25,y+8,1,63),Color.WHITE);
        mark(rectangle(x+6,y+23,24,1),Color.WHITE);
        mark(rectangle(x+6,y+55,24,1),Color.WHITE);
        mark(rectangle(x+17,y+23,1,32),Color.WHITE);
    }
    private void door(String name,double x,double y,double tx,double ty) {
        road(12,x,y,tx,ty);
        boolean vertical=Math.abs(ty-y)>=Math.abs(tx-x);
        mark(rectangle(x-(vertical?7:3),y-(vertical?3:7),vertical?14:6,vertical?6:14),INK);
        Building b=buildings.get(name);
        if(b!=null) b.entrances.add(new Point2D.Double(x,y));
    }
    private void entrances() {
        door("Service I",681,134,681,160); door("Service II",858,134,858,160);
        door("Residence Hall",455,258,455,278);
        door("Graduate\nCenter",850,387,850,409);
        door("Conference\nCenter",299,419,317,419); door("Conference\nCenter",206,438,186,460);
        door("Academic\nBuilding",515,419,499,419); door("Academic\nBuilding",714,429,753,429);
        door("Academic\nBuilding",661,580,661,630);
        door("Water Pavilion",420,448,420,434);
        door("Innovation Building",378,663,378,632); door("Innovation Building",579,663,579,632);
        door("Innovation Building",576,785,576,829);
        door("WHU-DUKE\nResearch",851,684,851,660);
        door("Library",949,628,930,628); door("Library",1091,628,1135,628);
        door("Admin",1165,628,1135,628); door("Visitor\nCenter",1165,773,1135,773);
        door("Community\nCenter W",985,430,985,409); door("Community\nCenter W",985,514,985,545);
        door("Community\nCenter E",1132,430,1132,409); door("Community\nCenter E",1132,514,1132,545);
        door("Community\nCenter E",1178,462,1191,462);
        // Thresholds only: do not repaint the elevated bridge as a ground path.
        mark(rectangle(1036,472,6,13),INK); mark(rectangle(1082,472,6,13),INK);
        door("Sports Complex",1347,430,1347,409); door("Sports Complex",1329,514,1329,545);
        String[][] names={{"15H","15D"},{"15G","15C"},{"15F","15B"},{"15E","15A"}};
        int[] top={108,177,246,314}, north={96,166,235,303}, south={166,235,303,409};
        for(int r=0;r<4;r++) for(int c=0;c<2;c++) {
            int x=c==0?1003:1141, bottom=top[r]+(r==3?63:51);
            door(names[r][c],x,top[r],x,north[r]); door(names[r][c],x,bottom,x,south[r]);
        }
    }
    private void furniture() {
        label("N",1490,29,23);
        mark(polygon(1490,44,1478,73,1490,65,1502,73),INK);
        mark(rectangle(871,875,119,32),ROAD); label("South Gate",930,894,17);
        mark(rectangle(916,870,28,5),INK);
        mark(rectangle(0,920,1536,104),Color.WHITE);
        label("DKU CAMPUS | JAVA MAP",445,951,27);
        label("Click a building for details     Click empty ground: close     Esc: exit",445,982,16);
        Color[] colors={ACADEMIC,SERVICE,HOUSING,SPORT,WATER};
        String[] names={"Academic","Services","Housing","Sports","Water"};
        for(int i=0;i<5;i++) {
            mark(rectangle(935+i*119,945,18,18),colors[i]);
            label(names[i],987+i*119,955,12);
        }
        label("Schematic campus layout | Coordinates and shapes defined in Java",1214,985,12);
    }
    /** The topmost clickable place under a map point, or null over open ground. */
    public Building buildingAt(double x,double y) {
        List<Building> all=new ArrayList<>(buildings.values());
        for(int i=all.size()-1;i>=0;i--) if(all.get(i).footprint.contains(x,y)) return all.get(i);
        return null;
    }
    private void describe(String name,String text) { buildings.get(name).description=text; }
    private void descriptions() {
        describe("Lake","Central lake crossed by footbridges, with a platform and the Water Pavilion at its heart.");
        describe("Campus Square","Open lawn with looping paths between the Library and the South Gate.");
        describe("Faculty\nHousing","Residences for faculty members on the northwest edge of campus.");
        describe("Residence Hall","Student residence overlooking the north shore of the lake.");
        describe("Service I","Support building for campus services and operations.");
        describe("Service II","Support building for campus services and operations.");
        describe("Graduate\nCenter","Residence and common space for graduate students.");
        describe("Conference\nCenter","Venue for conferences, events and visiting guests, west of the lake.");
        describe("Academic\nBuilding","Main teaching building with classrooms and lecture halls, beside the lake.");
        describe("Water Pavilion","Small pavilion in the middle of the lake, reached by footbridge.");
        describe("Innovation Building","Large teaching and research building along the south of campus.");
        describe("WHU-DUKE\nResearch","Joint research institute building near Campus Square.");
        describe("Library","Campus library with study spaces and collections, north of Campus Square.");
        describe("Admin","Administrative offices on Academic Avenue.");
        describe("Visitor\nCenter","First stop for visitors, near the South Gate.");
        describe("Community\nCenter W","West wing of the Community Center, linked to the east wing by a skybridge.");
        describe("Community\nCenter E","East wing of the Community Center, linked to the west wing by a skybridge.");
        for(String dorm:new String[]{"15A","15B","15C","15D","15E","15F","15G","15H"})
            describe(dorm,"Undergraduate residence hall with entrances on its north and south sides.");
        describe("Employee Center North","North block of the Employee Center, built around an inner courtyard.");
        describe("Employee Center South","South block of the Employee Center, built around an inner courtyard.");
        describe("Sports Complex","Indoor sports facility on the east side of campus.");
        describe("Soccer Field","Full-size soccer pitch in the northeast corner of campus.");
        describe("Tennis Courts","Two outdoor tennis courts beside the soccer field.");
    }
}
