// valley-inside-the-works: the numbers, the ground and the flown line that the world and its parts share (metres).
// Written by the designer; change a number only by the designer's word. Everything is built three times life size,
// so the lens is small: a door here is 6 m high, a stair tread 0.5 m, a daisy 0.4 m across.
// The river runs toward +z (downstream). The flight goes upstream, toward -z, the whole way.

export const SCALE = 3;

// THE SHED (inner faces of its brick walls) and its saw-tooth roof. Valley gutters run across the hall (along x) at
// z = 200 - 20 k, at SHED.roofValley, on the columns. In each 20 m tooth the slated slope climbs from the valley at
// z = v to the ridge at z = v - 16 (SHED.roofRidge), and the steep GLAZED face drops from that ridge to the next valley
// at z = v - 20. So the glass looks up the valley, the way the flight goes.
export const SHED = { x0: -80, x1: 80, zDown: 210, zHead: -230, bay: 20, roofValley: 52, roofRidge: 62, ridgeBack: 16, gallery: 30 };
// Cast-iron columns stand in four rows: x in COLUMN_X, z = columnZ(k), k = 0..21 (every 20 m), from the ground (or from
// a stone foot in the river) to the roof valleys, whose lattice girders they carry across the hall: a nave 28 m wide
// between the two middle rows, which the flight keeps to, and wide aisles either side.
// columnStands(x, z) is the rule that would leave one out (too near the flown line); on this route it leaves none out.
export const COLUMN_X = [-52, -14, 14, 52];
export function columnZ(k) { return 200 - 20 * k; }
// The direction TOWARD the light: it comes down through the glazed faces from up the valley and a little from the
// right (+x), 48 degrees high. So we fly toward the light; the left wall is sunlit and the right wall is in shade.
export const LIGHT_DIR = [0.428, 0.74, -0.519];

const smooth = (a, b, v) => { const t = Math.min(Math.max((v - a) / (b - a), 0), 1); return t * t * (3 - 2 * t); };
const bump = (t) => { const q = 1 - t * t; return q > 0 ? q * q : 0; };

// THE RIVER. Its lip (the fall) is at z = FALL_Z, 16 m wide, centred on x = 0; below it lies a wide pool (to 38 m wide
// at z = -22). The river begins at z = HEAD_Z, in a head pool 44 m wide at the foot of the terrace.
export const FALL_Z = -40;
export const HEAD_Z = -205;
let riverXAt = NaN, riverXIs = 0;                                  // (the last answer is kept: rows of the ground ask for one z many times)
export function riverX(z) {
  if (z === riverXAt) return riverXIs;
  const zz = Math.max(z, -198);
  const a = Math.sin((2 * Math.PI * (zz + 40)) / 200), b = Math.sin((2 * Math.PI * (zz + 40)) / 90);
  riverXAt = z;
  return (riverXIs = 24 * a * a * a + 9 * b * b * b);
}
export function riverHalfWidth(z) {
  if (z < HEAD_Z) return -1;                                      // no river behind the terrace's front
  if (z >= FALL_Z) return 8 + 11 * bump((z + 22) / 15);           // lower river 16 wide; the pool up to 38 wide
  return 6.5 + 15.5 * smooth(-184, -200, z);                      // upper river 13 wide; the head pool 44 wide
}
// Height of the river's surface. It steps 14 m at the fall.
export function riverY(z) {
  if (z >= FALL_Z) return 2 + 0.008 * (210 - z);                  // 2.0 at the downstream wall, 4.0 at the fall's foot
  return 18 + 0.0125 * (FALL_Z - z);                              // 18.0 at the lip, 20.1 at the head pool
}
// THE LIQUID LIES IN ITS BED: its drawn surface stands FREEBOARD under riverY(z) everywhere (river, pool, head pool).
// The bank line and the ground do not move: the ground at the bank line stays at riverY, so the bed's slope shows above
// the liquid as a low wet shore and the grass stands above the liquid. (Added 03:37 UTC on 9 Nov after the second fresh
// viewer: drawn 0.38 m over riverY, the river read as a slab standing on the grass.) Whatever stands in the liquid
// (a pipe's mouth, a column's foot, a reed) reaches under liquidY.
export const FREEBOARD = 0.45;
export function liquidY(z) { return riverY(z) - FREEBOARD; }
// The level of the valley floor beside the river: the same, but the step is a steep rock scar from z = -38 to z = -43.
export function floorLevel(z) {
  const lower = 2 + 0.008 * (210 - Math.max(z, -43)), upper = 18 + 0.0125 * (FALL_Z - Math.min(z, -38));
  return lower + (upper - lower) * smooth(-38, -43, z);
}
// Signed distance from the river's edge: negative in the river.
export function bankDistance(x, z) { return Math.abs(x - riverX(z)) - riverHalfWidth(z); }
// THE GROUND everywhere outside the river (inside it, this is the bed, 1.5 m under the surface). The terrace and the
// cream spring's basin stand on it and are built by their owners.
export function groundHeight(x, z) {
  const d = bankDistance(x, z);
  if (d <= 0) return Math.min(riverY(z), floorLevel(z)) - 1.5;
  const hum = 1.2 * Math.sin(0.071 * x + 1.7) * Math.sin(0.053 * z + 0.4) + 0.7 * Math.sin(0.13 * x - 0.8) * Math.sin(0.117 * z + 2.1);
  const side = 0.03 * Math.min(d, 25) + 0.16 * Math.min(Math.max(d - 25, 0), 40);   // the valley's sides rise toward the walls
  return floorLevel(z) + 0.5 * smooth(0, 1.5, d) + side + hum * smooth(2, 14, d);
}

// THE PIPES: a rank of seven glass pipes, 0.9 m across, 1.6 m apart, centred on x = 24, in the right-hand aisle beside
// the column row x = 14. They stand in the pool at z = PIPES.riseZ, rise to PIPES.run, turn, and run level up the
// valley to the head wall, where each passes through its own round port. At every column row from z = -20 to z = -220
// an iron cross-beam (top at PIPES.beam) carries them: it springs from the column at x = 14, runs out to x = PIPES.beamEnd,
// and is hung at its outer end from the roof's valley girder by a pair of rods.
export const PIPES = { count: 7, across: 0.9, step: 1.6, x: 24, riseZ: -22, run: 36, beam: 34.5, beamEnd: 31 };
export function pipeX(i) { return PIPES.x + (i - 3) * PIPES.step; }
// The level runs are STEPPED so the rank reads as seven pipes from the nave (not one bundle seen edge-on): pipe 0, nearest
// the nave, runs highest, each next one 0.8 m lower; pipe 6 keeps PIPES.run. The risers stay plumb; each bend ends at its
// own height; each pipe sits in its own saddle on a post of its own height on the cross-beam.
export function pipeRunY(i) { return PIPES.run + (PIPES.count - 1 - i) * 0.8; }
// WHERE EACH PIPE GOES THROUGH THE HEAD WALL: at its run height, but the outer three (4, 5, 6) dip through a swan neck
// after the last beam so that every port keeps a clear metre of brick from the round window's iron ring. The pipes part
// holds the same law (its pipePortY); the shed's seven collars stand at (pipeX(i), pipePortY(i)), each PIPE_COLLAR in radius.
export function pipePortY(i) { return pipeRunY(i) - (i > 3 ? 0.9 + 0.6 * (i - 3) : 0); }
export const PIPE_COLLAR = 0.85;

// THE HEAD OF THE VALLEY: a stone terrace against the head wall; the troughs on it spill over its front (z = HEAD_Z)
// into the head pool. TROUGH_X: the long troughs' centre lines (they run along z, between the columns on the terrace).
export const TERRACE = { x0: 4, x1: 58, z0: HEAD_Z, z1: -230, top: 24 };
export const TROUGH_X = [20.25, 28.75, 37.25, 45.75];
export const TROUGH = { width: 6, z0: -207, z1: -226, rim: 25.6, level: 25.1 };
// THE CREAM SPRING: a small round stone basin on the left bank, brimming with cream, pouring into the river.
export const CREAM = { x: -3.4, z: 70, r: 2.6 };   // the basin's inner radius; its rim (0.6 wide, 1 m high) touches the river's edge

export const ENTRY = { x: 4, y: 8, z: 150 };        // the flight begins here, level, heading -z, low over the river
export const EXIT = { x: 0, y: 43, z: -228.5 };     // the ring's centre, in a round iron window frame in the head wall
export const WINDOW = { radius: 7.6, y: 43, xs: [-66, -33, 0, 33, 66] };   // round windows in the head wall, one to a bay
// The way out is a disc of this radius in the middle window: the world file gives it to the engine as the opening's
// radius, and the shed's iron ring in that window meets it (the ring's inner edge at this radius, lapping it a little),
// so that no rim of open hole shows between the opening and the iron.
export const EXIT_RADIUS = 6.5;

// THE FLOWN LINE (the world file lays its path through these points, in this order, and adds none that leaves the line
// by more than a metre). The last 60 m are straight.
export const ROUTE = [
  [4, 8, 150], [4, 8, 138], [3, 9.4, 124], [0, 9.2, 108], [-1, 8.6, 94], [1, 8.3, 80], [3, 8.4, 66], [3, 8.6, 52], [3.5, 9, 38],
  [3.5, 10.5, 24], [4, 13.5, 10], [5.5, 17.5, -4], [7, 22.5, -20], [4, 28, -40], [1, 30.5, -60], [0, 31, -82], [0, 31, -106],
  [0, 32.2, -136], [0, 35.7, -168.9], [0, 43, -228.5],
];
// Distance from a point to the flown line (a little generous: straight pieces between the points), counting also the
// 60 m straight behind the entry, which must stay as clear as the line itself.
// (The pieces' ends and spans are laid once, at the first asking: a build asks these two some hundred thousand times.
// Each piece: its start, its span, and the span's squared length in space and in plan.)
let routePieces = null;
function pieces() {
  if (routePieces) return routePieces;
  const ends = [];
  for (let i = 0; i + 1 < ROUTE.length; i++) ends.push([ROUTE[i], ROUTE[i + 1]]);
  ends.push([[ENTRY.x, ENTRY.y, ENTRY.z], [ENTRY.x, ENTRY.y, ENTRY.z + 60]]);
  routePieces = ends.map(([a, b]) => {
    const dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2];
    return [a[0], a[1], a[2], dx, dy, dz, dx * dx + dy * dy + dz * dz, dx * dx + dz * dz];
  });
  return routePieces;
}
export function routeDistance(x, y, z) {
  const S = pieces();
  let best = 1e18;
  for (let i = 0; i < S.length; i++) {
    const s = S[i], ax = x - s[0], ay = y - s[1], az = z - s[2];
    let t = (ax * s[3] + ay * s[4] + az * s[5]) / s[6];
    t = t < 0 ? 0 : t > 1 ? 1 : t;
    const ex = ax - t * s[3], ey = ay - t * s[4], ez = az - t * s[5], d2 = ex * ex + ey * ey + ez * ez;
    if (d2 < best) best = d2;
  }
  return Math.sqrt(best);
}
// The same in plan only (for things that stand tall beside the line: columns, trees).
export function routeDistanceXZ(x, z) {
  const S = pieces();
  let best = 1e18;
  for (let i = 0; i < S.length; i++) {
    const s = S[i], ax = x - s[0], az = z - s[2];
    let t = (ax * s[3] + az * s[5]) / s[7];
    t = t < 0 ? 0 : t > 1 ? 1 : t;
    const ex = ax - t * s[3], ez = az - t * s[5], d2 = ex * ex + ez * ez;
    if (d2 < best) best = d2;
  }
  return Math.sqrt(best);
}
// A column stands unless it would be within 5 m of the flown line in plan or within 7 m of the straight behind the
// entry (no column stands in a trough: the troughs lie between the rows). Columns in the river stand on stone feet,
// and so does any column whose foot spans a step of the ground: the shed builds a square ashlar pier under it from
// below the lowest ground at its foot (the four on the fall's scar, and those at the river's very edge where the bank
// drops under one side of the foot).
export function columnStands(x, z) {
  if (z > ENTRY.z && Math.abs(x - ENTRY.x) < 7) return false;
  if (routeDistanceXZ(x, z) < 5) return false;
  return true;
}

// ---- ADDED 04:58 UTC ON 9 NOV: THE ROOM ITSELF, as a fan knows it, drawn in our own hand (no figure, nothing lettered).
// THE GREAT PIPE: one wide glass pipe comes down plumb from the roof into the lower river beside the flown line; its
// mouth stands GREAT_PIPE.under below liquidY(GREAT_PIPE.z) and the liquid climbs inside it. It goes out through the
// slated slope of the roof in a round collar, and an iron ring with two stay bars to the columns at (14, 60) and
// (14, 80) holds it at each height of GREAT_PIPE.stays. The pipes part builds it (glass, liquid, iron); the chocolate
// part draws the liquid's ring of froth round its foot; nothing is planted within GREAT_PIPE.clear of its axis.
export const GREAT_PIPE = { x: 11, z: 70, across: 3.4, under: 1.4, stays: [22, 40], clear: 4 };
// THE BOAT: a long rowing boat of rose boiled sugar lies moored against the right-hand (+x) bank of the lower river,
// bow upstream (toward -z), afloat: its waterline at liquidY(BOAT.z). Nobody is aboard. The shed's builder makes it.
// Its centre line lies at x = boatX(), 2.8 m inside the river's edge at BOAT.z, and runs straight along z.
export const BOAT = { z: 40, length: 13, beam: 3.6 };
export function boatX() { return riverX(BOAT.z) + riverHalfWidth(BOAT.z) - 2.8; }
// THE SWEETS AS PLANTS (the meadow's builder): candy canes, great lollipops, toadstools and gumdrops stand in the
// meadow as its tallest plants. A tall one (cane, lollipop) keeps SWEETS.tallClear from the flown line in plan; a low
// one (toadstool, gumdrop) keeps SWEETS.lowClear and its top stays 3 m under the line; none stands in the river or
// within SWEETS.bank of its edge, within SWEETS.thing of a column, the cream basin's rim or the boat's side, or within
// GREAT_PIPE.clear of the great pipe's axis; none on the terrace.
export const SWEETS = { tallClear: 7, lowClear: 4.5, bank: 1.2, thing: 2.5 };

// THE BARS OF LIGHT. Sunlight enters only through the roof's glazed faces, so the valley is crossed by bars of light
// about 11 m wide with 9 m of shade between, slanting down toward +z; and the right-hand wall (the sun is beyond it)
// lays a strip of shade along its own foot. lightBar(x, y, z) is 1 in a bar and 0 in shade (soft edges).
// Every part lays the SAME bars over its things:
//   - a three.js material lit by the scene's directional light (Standard, Physical, Lambert, Phong, Toon): pass it
//     once through barMaterial(material) when you make it; the sun's part is then multiplied by the bar, per pixel;
//   - a shader of your own: paste LIGHT_BAR_GLSL and multiply your sun term by lightBar(worldPosition).
export function lightBar(x, y, z) {
  const w = (((z + 0.7009 * y - 16.45) % 20) + 20) % 20;
  const wall = 1 - smooth(76, 81, x + 0.578 * (52 - y));
  return (smooth(0, 1.2, w) - smooth(11, 12.2, w)) * wall;
}
export const LIGHT_BAR_GLSL = 'float lightBar(vec3 p) { float w = mod(p.z + 0.7009 * p.y - 16.45, 20.0); float wall = 1.0 - smoothstep(76.0, 81.0, p.x + 0.578 * (52.0 - p.y)); return (smoothstep(0.0, 1.2, w) - smoothstep(11.0, 12.2, w)) * wall; }';
export function barMaterial(material) {
  if (material.userData.valleyBar) return material;
  material.userData.valleyBar = true;
  const before = material.onBeforeCompile, key = material.customProgramCacheKey;
  material.onBeforeCompile = function (shader, renderer) {
    if (before) before.call(this, shader, renderer);
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vValleyBar;')
      .replace('#include <project_vertex>', '#include <project_vertex>\n{ vec4 vb = vec4(transformed, 1.0);\n#ifdef USE_INSTANCING\nvb = instanceMatrix * vb;\n#endif\nvValleyBar = (modelMatrix * vb).xyz; }');
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vValleyBar;\n' + LIGHT_BAR_GLSL)
      .replace('#include <lights_fragment_begin>', '#include <lights_fragment_begin>\n{ float vbar = lightBar(vValleyBar); reflectedLight.directDiffuse *= vbar; reflectedLight.directSpecular *= vbar; }');
  };
  material.customProgramCacheKey = function () { return 'valley-bar:' + (key ? key.call(this) : ''); };
  return material;
}

// THE ROLLERS in the troughs: roller i (0..3) lies across its trough and travels along it; its centre line is at
// z = rollerZ(i, time), its axis at y = TROUGH.level + 0.6, its radius 1.5, its length TROUGH.width - 1.
export function rollerZ(i, time) { return -216.5 + 6.5 * Math.sin(0.33 * time + 1.7 * i); }
