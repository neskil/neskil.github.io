// GALIMOTO hero set piece: THE WIRE TOWN AND ITS SHADOW FRIEZE, with THE BUS WE RIDE.
//
// WHAT IT IS
//   A swept red-earth yard at 50 times life size with about forty toys of bent black fence wire
//   (a 34 m wheeled bicycle, a 70 m windmill, nine house fronts with sprung smoke spirals, buses and
//   cars circling on steering rods, hens with coiled-spring necks, a helicopter or an aeroplane, an ox
//   cart, a radio, wire trees, hoops, a guinea fowl, a chameleon on the wall top, pliers and a coil of
//   offcuts) and the whitewashed wall along x = 160 on which the low sun draws them all as ONE line
//   frieze. Every wire is drawn THICK (1.6) times its bent radius with a broad bright streak on its sunward side as
//   the eye sees it, a dull band and a dark far side, so that a toy reads as bright metal with a dark edge from either
//   side of the light. THE PARADE is ONE FILE of six toys (a big zebu cow, a goat, a bicycle, a lorry, a car, a cow) on
//   one lane, 60 m apart, placed by how far the eye has come along the rut: they wait (the cow broadside, grazing)
//   until we come under the bicycle, then the cow keeps 54 to 74 m ahead of the eye on the open side through the first
//   bend and down the short line (hero.lead is where it stands), and down the street we draw level with the file 60 m
//   and more off.
//   NOTHING ELSE STANDS WITHIN 45 M OF THE RUT on the open side: hens beside the opening straight and outside the
//   first bend, rings, ox cart, craft on sticks and the flyer's pad all lie beyond the lane. Two beasts graze at the
//   wall's foot between the fronts. THE STREET RUNS ON TO THE PORTAL: past the last of the seven fronts (z 435) the wall
//   has a hung aeroplane, a hung fish, a plank gate (ink in the wall shader, wire fittings), hung hoops, a bicycle, a
//   car and two ladders, and in front of them two more house fronts with turning smoke (drawn at z 449 and 580), two
//   wire trees bent flat against the wall (z 490 and 542, 54 to 58 m tall, trunks in the gaps between the hung things)
//   and, 74 m out on the open side, a big radio whose aerial is drawn 40 m and more up the whitewash; the earth has
//   stones and tufts, the wall older patches, cracks, a red splashed skirt along its whole length and two windows. The
//   windmill stands 85 m off the rut, left of the bicycle on the opening axis. The bus we ride (24 x 7 x 10 m, with
//   its 53 m steering rod of doubled wire and its handle ring) is part of the piece: update() carries it from the
//   camera along the rut.
//   THE GIANTS (inside the two bends, on the wall side): a WIRE GIRAFFE (39.5 m to its horn tips) browses the first
//   wire tree, walks out to its stand 37 m from the rut, stands side-on, its neck swaying, then turns away and goes
//   back; a WIRE ELEPHANT (34 m to the top of its ears) with a saddle cloth of crown caps stands inside the left-hand
//   bend with its flank to the eye, flaps its ears, lifts its coiled trunk as we come, lowers it and walks off
//   north-east. What sets each of these going is an EVENT OF THE YARD: the eye within a whole number of halves of the
//   animal's frame distance (its height over 2 tan 31 degrees) of its stand, or level with a stand; the numbers are
//   set out at THE TWO GIANTS in buildHero. The cow of the parade waits a little (rut s 205-282) so that it is clear
//   of a giant, and the third hen bolts as the elephant's trunk goes up. hero.giantAt(u) and hero.leadAt(u) give
//   where to look, hero.walkOut(u) the share of the giraffe's walk to its stand that is done, hero.events the arc
//   lengths of the rut at which the events fall (worked out in build from the rut and the animals, not written
//   down). THE GATE at z 520-540 is drawn in ink by the wall shader and has wire strap
//   hinges, a bolt, a ring latch and a wire lizard creeping on its planks; a wire bream with a small fish below it
//   hangs on the wall before it (z 495-514). Loose crown caps, spare axles and two more pairs of pliers lie beside
//   the bends.
//
// SPACE (local space IS the brief's yard space; add hero.object at the world origin, unrotated)
//   x east, z south, y up, earth at y 0. Yard x -260..160, z 0..650. Wall face at x = 160, 70 m high,
//   lit face toward -x. The rut (anchors.flyThrough, arc lengths in anchors.marks) keeps the brief's opening and
//   ending and puts an S between them: line 170 m at 20 degrees, right R92 to due south, a short line, LEFT R62 to
//   22 degrees (heading straight at the wall from about 100 m: the frieze face-on), 14 m, right R76 to 84 degrees,
//   a long line closing on the wall, right R200, line 80 m. `center` and `radius` only set up an orbit for the
//   set-piece viewer inside the yard (its u 0.4 looks back from the wall side); the true extent is
//   anchors.extent (the yard is about 420 x 650 m, the wall 70 m high).
//
// THE STYLE AND HOW IT IS DONE (for the world coder: match it for everything you add)
//   - Flat ShaderMaterials only, no lights, colours written exactly (use post flat 1, bloom 0).
//   - Wire: centre-line polylines swept into 5-sided tubes; the vertex shader widens every tube to at
//     least 2.5 px. Colour is palette[4]; the glint palette[5] is laid by a step() on dot(normal, h), where h is
//     the eye direction plus the sun's direction across the line of sight: a hard-edged streak a third of the wire wide.
//   - Shadows are geometry: the same centre lines as ribbons, drawn twice. Ground pass slides each
//     point along the sun to y = 0 and discards beyond the wall (colour palette[1]); wall pass slides
//     it to x = 160 and discards below the earth (colour palette[6]). Opaque, depthWrite off, drawn
//     after earth and wall (renderOrder 1; earth and wall 0; wire 2), so crossings never darken.
//   - Motion: every moving part has a row in one small float texture (a 4x4 matrix per part) that
//     update() rewrites; wire, shadows, twists and bottle tops all read it, so shadows follow.
//   - For your own things (swallows, the rare hen): hero.castGround(v, out) and hero.castWall(v, out)
//     give the shadow point of a local point; hero.glslCast is the same two functions in GLSL
//     (needs uniforms uSun, uWallX, uWallH from hero.uniforms). Draw such shadows flat, depthWrite
//     off, renderOrder 1, in palette[1] on earth and palette[6] on the wall.
//
// OPTS
//   palette   7 hex strings in brief order: [earth, earth mark and ground shadow, wall, sky (unused
//             here), wire, glint, wall shadow]
//   sun       [x, y, z] direction TO the sun (default -0.93, 0.26, -0.25). x must be < 0. The street is laid
//             out by where each shadow falls, so any sun works; with z > 0 (the world's choice) a shadow falls
//             north of its toy and is seen apart from it from the rut.
//   density   0.7..1.3 (ctx.vary.density): pebbles and the birds on the power line
//   keepLines true keeps the centre lines for an offline preview (debugLines)
//   blades    6 or 8 windmill blades (default by seed)
//   flyer     'helicopter' | 'aeroplane' (default by seed)        birds  'hens' | 'guinea' (by seed)
//   surfaces  false to omit the earth and the wall (default true)
//   wallTint  hex for the second whitewash tone, earthTint hex for the wall's splashed skirt
//
// API (besides the contract fields)
//   setProgress(u)   call every frame with path u BEFORE update(). Drives the bus (hidden at u 0, rolls in to
//                    u 0.07, goes over to the wall's foot past z 470; its front axle steers back across the rut from
//                    62 m to 14 m short of the portal, it is held to a stand with its axle 16.6 m short and is left
//                    behind), the flyer (spins up 0.50, lifts 0.60-0.72,
//                    then runs ahead of the eye above the wall top), the hoop that rolls to the portal
//                    (0.67-0.89) and the hens' turn.
//                    Until it is called the piece runs a parked demo (bus standing in the rut).
//   carried          the bus Object3D (hidden while u is 0).
//   pathAt(s)        {x, z, heading} of the rut centre line at arc length s (0..707).
//   events           arc lengths (m) of the rut at which the events of the yard fall that set the giants going (g8, g5,
//                    g3, gLevel; e8 to e3, eLevel), with each animal's height and frame distance
//   walkOut(u)       the share (0..1) of the giraffe's walk from its tree to its stand that is done
//   busLetGo         the eye's arc length (m) at which the bus stops being carried (its state `go` first falls below 1)
//   belt             the toys of the street's far end: [{ kind, x, z, height, drawnAtZ }]
//   busLat(s)        how far right of the centre line the bus runs at arc length s (it weaves, 5 m each way).
//   busPose          { x, z, dx, dz, wx, track, wall, gone, go }: where the bus stands this frame (centre, heading, half
//                    wheelbase, half track; wall 0..1 = how far it has gone over to the wall's foot; gone 0..1 = how far
//                    it has steered off to the right at the end; go 1..0 = rolling .. held to a stand; narrow 0..1 = how
//                    tall and narrow the frame is, for which the bus slides and weaves less). It slides (busYaw), so its wheels are not where busLat alone would put them.
//   setPalette(arr), setSun([x,y,z])   retint / re-aim without rebuilding (uniforms only).
//   uniforms         shared { uSun, uTime, ... } if you need them in your own shaders.
//
// ANCHORS (local = yard space)
//   flyThrough   ordered [x,y,z] points of the camera line (y 22, last 80 m at y 20), >= 6 m clear
//   portalSeat   { position [130.2,20,600.2], facing [0,0,-1], hoopRadius 20 }
//   entry        first point and heading          wallX 160, wallHeight 70
//   bicycle, windmill, hens, heliPad, townCentre, frieze: points for pois
//   marks        arc lengths where the rut's pieces begin: s1 first bend, sA short line, sB left bend, sC line at the
//                wall, sD bend away, sF long line, sG last bend, s4 last line; rutAngle: heading of the long line
//   extent       { min, max } of everything built
//
// THE STREET (what stands along the wall, by where its shadow falls)
//   Seven house fronts stand 13 to 46 m off the wall between z 86 and 435 (two more stand far out on the open
//   side of the yard, their drawings lying long across the earth), the tall ones furthest out and each one nearer the wall than
//   the last (so that from the face-on stretch a front stands in the white gap beside its own drawing); a power line of four poles
//   and three swags with wire birds on it runs over the roofs; two tall wire trees, a whirligig on a pole and
//   two grazing beasts stand in the gaps (the craft on its 52 m stick stands on the open side). Past z 470 the bus
//   we ride runs along the wall's foot, 15.5 m from it, in front of the toys that stand under the wall there, and its
//   own drawing lies among theirs. The wall's shadow ribbons are drawn 1.5 times the wire's width (WIDE_W) so the
//   frieze reads as an ink drawing; the bus we ride is bent from finer wire than the rest, and no wire of it is ever
//   drawn wider than 3.8 pixels however near the eye (its rod runs right under the lens). Far off (110 to 330 m) the
//   pixel floors of wire and ink fall to under half their near value, so the far end does not clot.
// COST  about 250k triangles, 16 draw calls (7 town, 7 bus, earth, wall), no lights, one 4 x 512
//       float texture rewritten each frame (about 200 part matrices), build about 150 ms of script.
// LIGHT It needs none and takes none. Viewer: bg=day with flat=1 and bloom=0.
import * as THREE from 'three';

const PALETTE = ['#B5432A', '#8C2F1F', '#F3EBDD', '#5B5FA8', '#1B1512', '#E08A3C', '#3A2E4F'];
const WALL_X = 160, WALL_H = 70, WIRE_R = 0.28, MAXPARTS = 512;
// every wire is drawn THICK times its bent radius (tubes, shadow ribbons, twists), and its pixel floor is as much heavier
const THICK = 1.6, TH = THICK.toFixed(2);
const D2R = Math.PI / 180;
// the yard gate in the last wall: centre along the wall, half width, height (the shader draws it, wire hangs on it)
const GATE = { z: 530, half: 10, h: 31 };
// shadow ribbons: (radius scale, pixel floor of the half width). The wall's ink line is drawn bolder than the wire.
const WIDE_G = new THREE.Vector2(1.1, 1.4), WIDE_W = new THREE.Vector2(1.2, 1.9);
// the bus we ride: the greatest half width, in pixels, at which any of its wire is drawn (see VS_TUBE, AXIAL).
// Decided by the pixel floor of VS_TUBE: far-off wire is never drawn under 1.3 to 1.8 px each side of its centre line
// (fine wire to heavy), and the bus's own wire, 45 m and more ahead, is drawn at that floor. 1.9 is a tenth of a pixel
// over the heaviest floor: the rod, which comes up to within 15 m of the lens, is drawn no heavier than the bus at the
// far end of it (3.8 px across), and the cap (a least-of-two) never cuts under the floor (a greatest-of-two).
const BUS_CAP = 1.9;

// ---------------------------------------------------------------- the rut
// The brief's opening (170 m at 20 degrees, straight at the wall) and its ending (a long straight closing on the
// wall, an easy curve, 80 m to the portal), with an S between them: right to due south, then LEFT to 22 degrees so
// that the eye and the bus head straight at the wall from about 95 m (the frieze face-on), then right again to
// run down the street. Segments are lines and arcs; LA and LF are solved so that the rut ends at END.
const A0 = 20 * D2R, AB = 22 * D2R, AF = 84 * D2R, A2 = 90 * D2R;
const PATH = (() => {
  const L1 = 170, R1 = 92, RB = 62, LC = 14, RD = 76, RG = 200, L3 = 80, END = [130.2, 600.2];
  const lay = (LA, LF) => {
    const segs = []; let x = -204, z = 52, h = A0, s = 0; const mark = {};
    const line = (len) => { segs.push({ s0: s, len, x, z, h }); x += Math.cos(h) * len; z += Math.sin(h) * len; s += len; };
    const arc = (R, h1) => { const dir = h1 > h ? 1 : -1, cx = x - dir * Math.sin(h) * R, cz = z + dir * Math.cos(h) * R, len = R * Math.abs(h1 - h);
      segs.push({ s0: s, len, cx, cz, R, h0: h, h1, dir }); x = cx + dir * Math.sin(h1) * R; z = cz - dir * Math.cos(h1) * R; h = h1; s += len; };
    line(L1); mark.s1 = s; arc(R1, A2); mark.sA = s; line(LA); mark.sB = s; arc(RB, AB); mark.sC = s; line(LC); mark.sD = s;
    arc(RD, AF); mark.sF = s; line(LF); mark.sG = s; arc(RG, A2); mark.s4 = s; line(L3);
    return { segs, ...mark, length: s, end: [x, z], R1 };
  };
  const t = lay(0, 0), LF = (END[0] - t.end[0]) / Math.cos(AF), LA = END[1] - t.end[1] - Math.sin(AF) * LF;
  return lay(LA, LF);
})();

function pathAt(s, out = {}) {
  const S = PATH.segs; let g = S[0];
  if (s > 0) { g = S[S.length - 1]; for (let i = 0; i < S.length; i++) if (s < S[i].s0 + S[i].len) { g = S[i]; break; } }
  const d = s - g.s0;
  if (g.R === undefined) { out.x = g.x + Math.cos(g.h) * d; out.z = g.z + Math.sin(g.h) * d; out.heading = g.h; }
  else { const h = g.h0 + g.dir * d / g.R; out.x = g.cx + g.dir * Math.sin(h) * g.R; out.z = g.cz - g.dir * Math.cos(h) * g.R; out.heading = h; }
  return out;
}
// the rut's centre line as GLSL: the least distance from p to every segment (the first and last lines run on)
const RUT_GLSL = PATH.segs.map((g, i) => {
  const v = (x, z) => `vec2(${x.toFixed(3)}, ${z.toFixed(3)})`;
  if (g.R === undefined) { const c = Math.cos(g.h), sn = Math.sin(g.h), back = i === 0 ? 160 : 0, len = g.len + (i === PATH.segs.length - 1 ? 200 : 0);
    return `d = min(d, sdSeg(p, ${v(g.x - c * back, g.z - sn * back)}, ${v(g.x + c * len, g.z + sn * len)}));`; }
  const rad = (h) => v(g.dir * Math.sin(h), -g.dir * Math.cos(h)), d0 = g.dir > 0 ? rad(g.h0) : rad(g.h1), d1 = g.dir > 0 ? rad(g.h1) : rad(g.h0);
  return `d = min(d, sdArc(p, ${v(g.cx, g.cz)}, ${g.R.toFixed(1)}, ${d0}, ${d1}));`;
}).join('\n  ');
const PATH_SAMPLES = (() => { const a = []; const o = {}; for (let s = -40; s <= PATH.length + 40; s += 3) { pathAt(s, o); a.push(s, o.x, o.z); } return a; })();
// nearest arc length and distance of (x, z) to the rut centre line
function pathNearest(x, z, out = {}) {
  let best = 1e9, bi = 0; const a = PATH_SAMPLES;
  for (let i = 0; i < a.length; i += 3) { const dx = a[i + 1] - x, dz = a[i + 2] - z, d = dx * dx + dz * dz; if (d < best) { best = d; bi = i; } }
  const o = pathAt(a[bi], {}), s = a[bi] + (x - o.x) * Math.cos(o.heading) + (z - o.z) * Math.sin(o.heading);
  out.s = s; out.dist = Math.sqrt(best); return out;
}

// ---------------------------------------------------------------- collecting wire: sinks and parts
// A sink gathers centre-line polylines (in the space of their part), twist joints and bottle tops.
function makeSink() { return { lines: [], twists: [], tops: [], segs: 0 }; }

// Parts: one matrix each. world = parent.world * local; local is rewritten by part.anim(m, t, u).
function makeParts() {
  const list = [];
  const add = (parent = null, anim = null) => {
    const p = { id: list.length, parent, anim, local: new THREE.Matrix4(), world: new THREE.Matrix4() };
    if (list.length >= MAXPARTS) return list[list.length - 1];
    list.push(p); return p;
  };
  return { list, add };
}
const _m1 = new THREE.Matrix4(), _m2 = new THREE.Matrix4(), _q = new THREE.Quaternion(), _v1 = new THREE.Vector3(), _v2 = new THREE.Vector3(), _v3 = new THREE.Vector3();
// local = rotation by `ang` about `axis` (unit Vector3) through pivot (px,py,pz)
function rotAbout(m, px, py, pz, axis, ang) {
  _q.setFromAxisAngle(axis, ang); m.makeRotationFromQuaternion(_q);
  _v1.set(px, py, pz).applyQuaternion(_q); m.setPosition(px - _v1.x, py - _v1.y, pz - _v1.z); return m;
}
const AX = new THREE.Vector3(1, 0, 0), AY = new THREE.Vector3(0, 1, 0), AZ = new THREE.Vector3(0, 0, 1);

// ---------------------------------------------------------------- the pen: how a toy is drawn
// Points are [x, y, z] in the toy's own space; the pen's current part says which matrix moves them.
function makePen(sink) {
  let part = 0;
  const pen = {
    setPart(p) { part = p.id; return pen; },
    // o.closed: a loop closed by a twist; o.r radius; o.tw twists (0 none, 1 start, 2 end, 3 both;
    // default 3 for open wire, 1 for loops); o.hook (1 start, 2 end, 3 both); o.bev corner length
    wire(src, o = {}) {
      const closed = !!o.closed, r = o.r ?? WIRE_R, bev = o.bev ?? 0.7;
      let pts = src;
      if (bev > 0 && pts.length > 2) {
        const out = [], n = pts.length;
        for (let i = 0; i < n; i++) {
          const p = pts[i];
          if (!closed && (i === 0 || i === n - 1)) { out.push(p); continue; }
          const a = pts[(i + n - 1) % n], b = pts[(i + 1) % n];
          const ax = p[0] - a[0], ay = p[1] - a[1], az = p[2] - a[2], bx = b[0] - p[0], by = b[1] - p[1], bz = b[2] - p[2];
          const la = Math.hypot(ax, ay, az) || 1, lb = Math.hypot(bx, by, bz) || 1;
          const c = (ax * bx + ay * by + az * bz) / (la * lb);
          if (c > 0.8) { out.push(p); continue; }
          const ka = Math.min(bev, la * 0.35) / la, kb = Math.min(bev, lb * 0.35) / lb;
          out.push([p[0] - ax * ka, p[1] - ay * ka, p[2] - az * ka], [p[0] + bx * kb, p[1] + by * kb, p[2] + bz * kb]);
        }
        pts = out;
      }
      const hook = o.hook ?? 0;
      if (!closed && hook) {
        pts = pts.slice();
        if (hook & 2) addHook(pts, pts[pts.length - 2], pts[pts.length - 1], false, o.hookR ?? 0.9);
        if (hook & 1) addHook(pts, pts[1], pts[0], true, o.hookR ?? 0.9);
      }
      const tw = o.tw ?? (closed ? 1 : 3) & ~hook;
      const n = pts.length;
      if (tw & 1) pen.twist(pts[0], pts[1], r);
      if (!closed && (tw & 2)) pen.twist(pts[n - 1], pts[n - 2], r);
      sink.lines.push({ pts, closed, r, part });
      sink.segs += closed ? n : n - 1;
      return pen;
    },
    // a three-turn twist at p, wound along the direction p -> q
    twist(p, q, r = WIRE_R) { sink.twists.push(p[0], p[1], p[2], q[0] - p[0], q[1] - p[1], q[2] - p[2], r / WIRE_R, part); return pen; },
    // a flattened crown cap: centre, axis (unit [x,y,z]), radius
    top(c, axis, rad = 1.5) { sink.tops.push(c[0], c[1], c[2], axis[0], axis[1], axis[2], rad, part); return pen; },
  };
  return pen;
}
function addHook(pts, a, e, atStart, R) {
  let tx = e[0] - a[0], ty = e[1] - a[1], tz = e[2] - a[2]; const l = Math.hypot(tx, ty, tz) || 1; tx /= l; ty /= l; tz /= l;
  // a perpendicular: prefer one that curls upward or sideways
  let nx = -ty * tx, ny = 1 - ty * ty, nz = -ty * tz; let nl = Math.hypot(nx, ny, nz);
  if (nl < 0.3) { nx = 1 - tx * tx; ny = -tx * ty; nz = -tx * tz; nl = Math.hypot(nx, ny, nz) || 1; }
  nx /= nl; ny /= nl; nz /= nl;
  for (let k = 1; k <= 4; k++) {
    const a2 = k * 58 * D2R, s = Math.sin(a2) * R, c = (1 - Math.cos(a2)) * R;
    const p = [e[0] + tx * s + nx * c, e[1] + ty * s + ny * c, e[2] + tz * s + nz * c];
    if (atStart) pts.unshift(p); else pts.push(p);
  }
}

// shape helpers (all return arrays of points)
// plane: 'xy' (axis z), 'zy' (axis x), 'xz' (axis y)
function pl(plane, c, u, v) { return plane === 'xy' ? [c[0] + u, c[1] + v, c[2]] : plane === 'zy' ? [c[0], c[1] + v, c[2] + u] : [c[0] + u, c[1], c[2] + v]; }
function ring(c, r, n, plane = 'xy', a0 = 0, ry = r) { const o = []; for (let i = 0; i < n; i++) { const a = a0 + (i / n) * Math.PI * 2; o.push(pl(plane, c, Math.cos(a) * r, Math.sin(a) * ry)); } return o; }
function arc(c, r, a0, a1, n, plane = 'xy', ry = r) { const o = []; for (let i = 0; i <= n; i++) { const a = a0 + (i / n) * (a1 - a0); o.push(pl(plane, c, Math.cos(a) * r, Math.sin(a) * ry)); } return o; }
// a coil from p0 to p1: radius r0 -> r1, `turns` turns, n points per turn
function spring(p0, p1, r0, r1, turns, n = 8, phase = 0) {
  const ax = [p1[0] - p0[0], p1[1] - p0[1], p1[2] - p0[2]], l = Math.hypot(ax[0], ax[1], ax[2]) || 1;
  const t = [ax[0] / l, ax[1] / l, ax[2] / l];
  let u = Math.abs(t[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
  let b = [t[1] * u[2] - t[2] * u[1], t[2] * u[0] - t[0] * u[2], t[0] * u[1] - t[1] * u[0]]; const bl = Math.hypot(b[0], b[1], b[2]) || 1; b = [b[0] / bl, b[1] / bl, b[2] / bl];
  u = [b[1] * t[2] - b[2] * t[1], b[2] * t[0] - b[0] * t[2], b[0] * t[1] - b[1] * t[0]];
  const N = Math.max(2, Math.round(turns * n)), o = [];
  for (let i = 0; i <= N; i++) {
    const f = i / N, a = phase + f * turns * Math.PI * 2, r = r0 + (r1 - r0) * f, c = Math.cos(a) * r, s = Math.sin(a) * r;
    o.push([p0[0] + ax[0] * f + u[0] * c + b[0] * s, p0[1] + ax[1] * f + u[1] * c + b[1] * s, p0[2] + ax[2] * f + u[2] * c + b[2] * s]);
  }
  return o;
}
const mv = (pts, dx, dy, dz) => pts.map((p) => [p[0] + dx, p[1] + dy, p[2] + dz]);
const flipZ = (pts, z0 = 0) => pts.map((p) => [p[0], p[1], 2 * z0 - p[2]]);

// ---------------------------------------------------------------- geometry from a sink
// Tubes: position = centre line, aN = (unit radial normal, radius), aPart. 5 sides.
// Ribbons: position = centre line, aT = (tangent, side * radius), aPart.
const SIDES = 5;
async function buildWireGeometry(sink, pause, withTan = false) {
  let nv = 0, nseg = 0;
  for (const L of sink.lines) { nv += L.pts.length; nseg += L.closed ? L.pts.length : L.pts.length - 1; }
  const tp = new Float32Array(nv * SIDES * 3), tn = new Float32Array(nv * SIDES * 4), tpart = new Float32Array(nv * SIDES);
  const ti = new Uint32Array(nseg * SIDES * 6), tt = withTan ? new Float32Array(nv * SIDES * 3) : null;
  const rp = new Float32Array(nv * 2 * 3), rt = new Float32Array(nv * 2 * 4), rpart = new Float32Array(nv * 2);
  const ri = new Uint32Array(nseg * 6);
  let v = 0, ii = 0, rv = 0, rii = 0;
  const t = [0, 0, 0], nrm = [0, 1, 0]; let li = 0;
  for (const L of sink.lines) {
    if (pause && (++li & 15) === 0) await pause();
    const P = L.pts, n = P.length, base = v, rbase = rv;
    for (let i = 0; i < n; i++) {
      const a = P[L.closed ? (i + n - 1) % n : Math.max(0, i - 1)], b = P[L.closed ? (i + 1) % n : Math.min(n - 1, i + 1)];
      let tx = b[0] - a[0], ty = b[1] - a[1], tz = b[2] - a[2]; const tl = Math.hypot(tx, ty, tz);
      if (tl > 1e-6) { t[0] = tx / tl; t[1] = ty / tl; t[2] = tz / tl; }
      else if (i === 0) { t[0] = 0; t[1] = 1; t[2] = 0; }
      // parallel transport of the normal
      if (i === 0) { if (Math.abs(t[1]) < 0.9) { nrm[0] = 0; nrm[1] = 1; nrm[2] = 0; } else { nrm[0] = 1; nrm[1] = 0; nrm[2] = 0; } }
      let d = nrm[0] * t[0] + nrm[1] * t[1] + nrm[2] * t[2];
      nrm[0] -= t[0] * d; nrm[1] -= t[1] * d; nrm[2] -= t[2] * d;
      let nl = Math.hypot(nrm[0], nrm[1], nrm[2]);
      if (nl < 1e-4) { nrm[0] = t[1]; nrm[1] = -t[0]; nrm[2] = 0; nl = Math.hypot(nrm[0], nrm[1]) || 1; }
      nrm[0] /= nl; nrm[1] /= nl; nrm[2] /= nl;
      const bx = t[1] * nrm[2] - t[2] * nrm[1], by = t[2] * nrm[0] - t[0] * nrm[2], bz = t[0] * nrm[1] - t[1] * nrm[0];
      const p = P[i];
      for (let k = 0; k < SIDES; k++) {
        const a2 = (k / SIDES) * Math.PI * 2, c = Math.cos(a2), s = Math.sin(a2);
        tp[v * 3] = p[0]; tp[v * 3 + 1] = p[1]; tp[v * 3 + 2] = p[2];
        tn[v * 4] = nrm[0] * c + bx * s; tn[v * 4 + 1] = nrm[1] * c + by * s; tn[v * 4 + 2] = nrm[2] * c + bz * s; tn[v * 4 + 3] = L.r;
        if (tt) { tt[v * 3] = t[0]; tt[v * 3 + 1] = t[1]; tt[v * 3 + 2] = t[2]; }
        tpart[v] = L.part; v++;
      }
      for (let k = 0; k < 2; k++) {
        rp[rv * 3] = p[0]; rp[rv * 3 + 1] = p[1]; rp[rv * 3 + 2] = p[2];
        rt[rv * 4] = t[0]; rt[rv * 4 + 1] = t[1]; rt[rv * 4 + 2] = t[2]; rt[rv * 4 + 3] = (k ? 1 : -1) * L.r;
        rpart[rv] = L.part; rv++;
      }
    }
    const segs = L.closed ? n : n - 1;
    for (let i = 0; i < segs; i++) {
      const r0 = base + i * SIDES, r1 = base + ((i + 1) % n) * SIDES;
      for (let k = 0; k < SIDES; k++) {
        const k1 = (k + 1) % SIDES;
        ti[ii++] = r0 + k; ti[ii++] = r1 + k; ti[ii++] = r0 + k1; ti[ii++] = r0 + k1; ti[ii++] = r1 + k; ti[ii++] = r1 + k1;
      }
      const q0 = rbase + i * 2, q1 = rbase + ((i + 1) % n) * 2;
      ri[rii++] = q0; ri[rii++] = q1; ri[rii++] = q0 + 1; ri[rii++] = q0 + 1; ri[rii++] = q1; ri[rii++] = q1 + 1;
    }
  }
  const tube = new THREE.BufferGeometry();
  tube.setAttribute('position', new THREE.BufferAttribute(tp, 3));
  tube.setAttribute('aN', new THREE.BufferAttribute(tn, 4));
  tube.setAttribute('aPart', new THREE.BufferAttribute(tpart, 1));
  if (tt) tube.setAttribute('aTan', new THREE.BufferAttribute(tt, 3));
  tube.setIndex(new THREE.BufferAttribute(ti, 1));
  const ribbon = new THREE.BufferGeometry();
  ribbon.setAttribute('position', new THREE.BufferAttribute(rp, 3));
  ribbon.setAttribute('aT', new THREE.BufferAttribute(rt, 4));
  ribbon.setAttribute('aPart', new THREE.BufferAttribute(rpart, 1));
  ribbon.setIndex(new THREE.BufferAttribute(ri, 1));
  return { tube, ribbon, tris: nseg * SIDES * 2 + nseg * 4 };
}

// instanced solids (twists, bottle tops): attributes position, normal, aFace; per instance iM (mat4), iPart
function instanced(base, mats, parts, count) {
  const g = new THREE.InstancedBufferGeometry();
  g.index = base.index; g.setAttribute('position', base.getAttribute('position'));
  g.setAttribute('normal', base.getAttribute('normal')); g.setAttribute('aFace', base.getAttribute('aFace'));
  g.setAttribute('iM', new THREE.InstancedBufferAttribute(mats, 16));
  g.setAttribute('iPart', new THREE.InstancedBufferAttribute(parts, 1));
  g.instanceCount = count; return g;
}
// one twist: three turns of wire round a wire, along +Y from 0, as a 3-sided tube with true normals
function twistBase() {
  const N = 26, S = 3, R = WIRE_R * 1.42, r = WIRE_R * 0.4, pos = [], nor = [], idx = [];
  for (let i = 0; i <= N; i++) {
    const f = i / N, a = f * 3 * Math.PI * 2, c = Math.cos(a), s = Math.sin(a), y = -0.2 + f * 2.0;
    const tx = -s * R * 18.85, ty = 2.0, tz = c * R * 18.85, tl = Math.hypot(tx, ty, tz);   // d/df
    const T = [tx / tl, ty / tl, tz / tl], Nn = [c, 0, s], B = [T[1] * Nn[2] - T[2] * Nn[1], T[2] * Nn[0] - T[0] * Nn[2], T[0] * Nn[1] - T[1] * Nn[0]];
    for (let k = 0; k < S; k++) {
      const b = (k / S) * Math.PI * 2, cb = Math.cos(b), sb = Math.sin(b);
      const nx = Nn[0] * cb + B[0] * sb, ny = Nn[1] * cb + B[1] * sb, nz = Nn[2] * cb + B[2] * sb;
      pos.push(c * R + nx * r, y + ny * r, s * R + nz * r); nor.push(nx, ny, nz);
    }
    if (i < N) for (let k = 0; k < S; k++) { const a0 = i * S + k, a1 = i * S + (k + 1) % S; idx.push(a0, a0 + S, a1, a1, a0 + S, a1 + S); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('aFace', new THREE.Float32BufferAttribute(new Float32Array(pos.length / 3), 1)); g.setIndex(idx);
  return g;
}
// one crown cap: unit radius, axis +Y, crimped rim of 14 teeth, two flat faces (aFace 1)
function topBase() {
  const N = 28, h = 0.07, pos = [], nor = [], face = [], idx = [];
  for (let s = 0; s < 2; s++) {                       // faces
    const y = s ? h : -h, c0 = pos.length / 3; pos.push(0, y, 0); nor.push(0, s ? 1 : -1, 0); face.push(1);
    for (let i = 0; i < N; i++) { const a = (i / N) * Math.PI * 2, r = i & 1 ? 1 : 0.9; pos.push(Math.cos(a) * r, y, Math.sin(a) * r); nor.push(0, s ? 1 : -1, 0); face.push(1); }
    for (let i = 0; i < N; i++) { const a = c0 + 1 + i, b = c0 + 1 + (i + 1) % N; if (s) idx.push(c0, b, a); else idx.push(c0, a, b); }
  }
  const r0 = pos.length / 3;                          // rim, flared like a flattened cap
  for (let i = 0; i < N; i++) {
    const a = (i / N) * Math.PI * 2, r = i & 1 ? 1 : 0.9, c = Math.cos(a), s = Math.sin(a);
    pos.push(c * r, -h * 2.2, s * r, c * r * 0.97, h * 2.2, s * r * 0.97); nor.push(c, 0, s, c, 0, s); face.push(0, 0);
  }
  for (let i = 0; i < N; i++) { const a = r0 + i * 2, b = r0 + ((i + 1) % N) * 2; idx.push(a, a + 1, b, b, a + 1, b + 1); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('aFace', new THREE.Float32BufferAttribute(face, 1)); g.setIndex(idx);
  return g;
}
// pack a sink's twists / tops into instance arrays. stride 8: p(3) dir-or-axis(3) scale part
function packInstances(arr, isTop, keepEvery = 1) {
  const n = arr.length / 8, mats = new Float32Array(n * 16), parts = new Float32Array(n); let c = 0;
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), d = new THREE.Vector3(), s = new THREE.Vector3(), p = new THREE.Vector3();
  for (let i = 0; i < n; i++) {
    if (keepEvery > 1 && i % keepEvery !== 0) continue;
    const o = i * 8; d.set(arr[o + 3], arr[o + 4], arr[o + 5]); if (d.lengthSq() < 1e-8) d.set(0, 1, 0); d.normalize();
    q.setFromUnitVectors(AY, d); p.set(arr[o], arr[o + 1], arr[o + 2]); const k = arr[o + 6];
    if (isTop) s.set(k, k, k); else s.set(k * THICK, 1 + 0.4 * (THICK - 1), k * THICK);
    m.compose(p, q, s); m.toArray(mats, c * 16); parts[c] = arr[o + 7]; c++;
  }
  return { mats, parts, count: c };
}

// ---------------------------------------------------------------- shaders
const GL_PARTS = /* glsl */`
uniform sampler2D uParts;
mat4 partM(float id) { int i = int(id + 0.5);
  return mat4(texelFetch(uParts, ivec2(0, i), 0), texelFetch(uParts, ivec2(1, i), 0), texelFetch(uParts, ivec2(2, i), 0), texelFetch(uParts, ivec2(3, i), 0)); }
`;
const GL_CAST = /* glsl */`
uniform vec3 uSun; uniform float uWallX; uniform float uWallH;
vec3 castG(vec3 p) { return p - uSun * (p.y / max(uSun.y, 0.02)); }
vec3 castW(vec3 p) { return p - uSun * ((p.x - uWallX) / min(uSun.x, -0.02)); }
`;
const VS_TUBE = /* glsl */`
attribute vec4 aN; attribute float aPart; uniform float uVH;
varying vec3 vN; varying vec3 vV; varying float vWide; varying vec3 vFace;
#ifdef AXIAL
attribute vec3 aTan; varying vec3 vT; uniform float uCap;
#endif
#include <fog_pars_vertex>
${GL_PARTS}
void main() {
  mat4 M = partM(aPart);
  vec4 wc = modelMatrix * (M * vec4(position, 1.));
  vec3 wn = mat3(modelMatrix) * (mat3(M) * aN.xyz);
  float depth = max(-(viewMatrix * wc).z, 0.);
  float px = depth * 2. / (projectionMatrix[1][1] * uVH);
  float rw = aN.w * ${TH};
  float r = max(rw * mix(1., 0.62, smoothstep(120., 340., depth)), px * mix(1.3, 1.8, clamp((aN.w - 0.16) / 0.10, 0., 1.)) * mix(1., 0.46, smoothstep(110., 330., depth)));
  r *= 1. - step(aN.w, 0.235) * smoothstep(170., 235., depth);
#ifdef AXIAL
  // the bus we ride: no wire of it, however near the eye, is drawn wider than uCap pixels each side of its centre
  // line, so the rod that rises to the eye keeps the weight of the bus's own wire
  r = min(r, px * uCap);
  vT = mat3(modelMatrix) * (mat3(M) * aTan);
#endif
  vec3 wp = wc.xyz + wn * r;
  vN = wn; vV = cameraPosition - wp; vWide = min(rw / max(r, 1e-4), 1.); vFace = vec3(aN.w, 0., 0.);
  vec4 mvPosition = viewMatrix * vec4(wp, 1.);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const VS_SOLID = /* glsl */`
attribute mat4 iM; attribute float iPart; attribute float aFace;
varying vec3 vN; varying vec3 vV; varying float vWide; varying vec3 vFace;
uniform vec3 uSunW;
#include <fog_pars_vertex>
${GL_PARTS}
void main() {
  mat4 M = modelMatrix * partM(iPart) * iM;
  vec4 wp = M * vec4(position, 1.);
  vec3 wn = mat3(M) * normal;
  vN = wn / max(length(wn), 1e-4); vV = cameraPosition - wp.xyz; vWide = 2.;
  // the sun in the cap's own turning frame, for the crescent that stays sunward
  vec3 ax = mat3(M) * vec3(1., 0., 0.), az = mat3(M) * vec3(0., 0., 1.);
  vec2 s2 = vec2(dot(uSunW, ax), dot(uSunW, az)) / max(length(ax), 1e-4);
  vFace = vec3(position.xz - s2 * 0.55, aFace);
  vec4 mvPosition = viewMatrix * wp;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const FS_WIRE = /* glsl */`
uniform vec3 uWire; uniform vec3 uGlint; uniform vec3 uSunW;
varying vec3 vN; varying vec3 vV; varying float vWide; varying vec3 vFace;
#ifdef AXIAL
varying vec3 vT;
#endif
#include <fog_pars_fragment>
void main() {
  vec3 n = vN / max(length(vN), 1e-4);
  vec3 v = vV / max(length(vV), 1e-4);
  // the bright side is the one toward the sun AS SEEN FROM THE EYE (the sun's direction across the line of sight, with a
  // little of the true sun): a toy seen against the light keeps its streak and does not go solid dark
  vec3 sp = uSunW - v * dot(uSunW, v); float sl = length(sp); sp = sl > 0.02 ? sp / sl : vec3(0., 1., 0.);
  vec3 h = v + mix(sp, uSunW, 0.35); h = h / max(length(h), 1e-4);
#ifdef AXIAL
  // the bus we ride: the streak is found ACROSS the wire (the bright direction with its part along the wire taken
  // out), so a wire seen almost end-on, as the rod is from its handle, keeps its streak and does not go solid dark
  vec3 tt = vT / max(length(vT), 1e-4);
  h = h - tt * dot(h, tt); h = h / max(length(h), 1e-4);
#endif
  // the highlight lies along the side that faces the sun and the eye (a third of the wire wide), a dull band of the
  // same metal beside it, and the underside stays dark
  float thr = mix(0.935, 0.86, smoothstep(0.3, 1., vWide)) - 0.04 * step(1.5, vWide) - 0.17 * step(0.53, vFace.x) * (1. - step(1.5, vWide));   // (the heaviest wire, the portal's hoop, carries a broader streak)
  float lit = dot(n, h);
  float g = step(thr, lit) * (1. - step(0.5, vFace.z));
  g = max(g, step(0.5, vFace.z) * step(length(vFace.xy), 0.3));
  float mid = step(thr - 0.075, lit) * (1. - step(0.5, vFace.z)) * smoothstep(0.45, 1., vWide);
  vec3 col = mix(uWire, mix(uWire, uGlint, 0.3), mid);
  gl_FragColor = vec4(mix(col, uGlint, g), 1.);
  #include <fog_fragment>
}`;
// shadows: RIBBON (wire centre lines) or SOLID (caps); WALLPASS or the ground
const VS_SHADOW = /* glsl */`
uniform float uVH; uniform vec2 uWide; varying vec2 vClip;
#ifdef RIBBON
attribute vec4 aT; attribute float aPart;
#else
attribute mat4 iM; attribute float iPart;
#endif
#include <fog_pars_vertex>
${GL_PARTS}
${GL_CAST}
void main() {
#ifdef RIBBON
  mat4 M = partM(aPart);
  vec3 c = (M * vec4(position, 1.)).xyz; vec3 t = mat3(M) * aT.xyz;
#else
  mat4 M = partM(iPart) * iM;
  vec3 c = (M * vec4(position, 1.)).xyz; vec3 t = vec3(0.);
#endif
#ifdef WALLPASS
  vec3 p = castW(c); vec3 q = castW(c + t * 0.5) - p; vec3 perp = vec3(0., q.z, -q.y);
  vClip = vec2(min(p.y, uWallX - c.x), uWallH - p.y);
#else
  vec3 p = castG(c); vec3 q = castG(c + t * 0.5) - p; vec3 perp = vec3(q.z, 0., -q.x);
  vClip = vec2(uWallX - p.x, c.y + 0.5);
#endif
#ifdef RIBBON
  perp = perp / max(length(perp), 1e-4);
  float depth = max(-(modelViewMatrix * vec4(p, 1.)).z, 0.);
  float px = depth * 2. / (projectionMatrix[1][1] * uVH);
  p += perp * max(abs(aT.w) * uWide.x * ${TH} * mix(1., 0.62, smoothstep(120., 340., depth)), uWide.y * 1.3 * px * mix(1., 0.48, smoothstep(110., 330., depth))) * sign(aT.w) * step(1e-6, dot(t, t))
    * (1. - step(abs(aT.w), 0.235) * smoothstep(170., 235., depth));
#endif
#ifdef WALLPASS
  p.x -= 0.06;
#else
  p.y += 0.06;
#endif
  vec4 mvPosition = modelViewMatrix * vec4(p, 1.);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const FS_SHADOW = /* glsl */`
uniform vec3 uCol; varying vec2 vClip;
#include <fog_pars_fragment>
void main() {
  if (min(vClip.x, vClip.y) < 0.) discard;
  gl_FragColor = vec4(uCol, 1.);
  #include <fog_fragment>
}`;
const VS_SURF = /* glsl */`
varying vec3 vP; varying vec3 vNl;
#include <fog_pars_vertex>
void main() {
  vP = position; vNl = normal;
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const GL_HASH = /* glsl */`
float h21(vec2 p) { p = fract(p * vec2(0.1031, 0.1030)); p += dot(p, p.yx + 33.33); return fract((p.x + p.y) * p.x); }
float sst(float a, float b, float x) { float t = clamp((x - a) / (b - a), 0., 1.); return t * t * (3. - 2. * t); }
float vnoise(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(h21(i), h21(i + vec2(1., 0.)), f.x), mix(h21(i + vec2(0., 1.)), h21(i + vec2(1., 1.)), f.x), f.y); }
`;
const FS_EARTH = /* glsl */`
uniform vec3 uEarth; uniform vec3 uMark; uniform vec3 uPale; uniform float uSeed; uniform float uDens;
varying vec3 vP; varying vec3 vNl;
#include <fog_pars_fragment>
${GL_HASH}
float sdSeg(vec2 p, vec2 a, vec2 b) { vec2 pa = p - a, ba = b - a; float h = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-4), 0., 1.); return length(pa - ba * h); }
float sdArc(vec2 p, vec2 c, float R, vec2 d0, vec2 d1) { vec2 q = p - c;
  float inside = min(d0.x * q.y - d0.y * q.x, q.x * d1.y - q.y * d1.x);
  return inside > 0. ? abs(length(q) - R) : 1e5; }
// one broom fan: x = distance from its pivot in fan radii, y = angle, z = id
vec3 fan(vec2 q, float row) {
  float odd = mod(row, 2.);
  float col = floor(q.x - 0.5 * odd + 0.5);
  vec2 id = vec2(col, row);
  vec2 c = vec2(col + 0.5 * odd, row * 0.5) + (vec2(h21(id + uSeed), h21(id + 7.7 + uSeed)) - 0.5) * 0.22;
  vec2 d = q - c; float R = 0.60 + 0.12 * h21(id + 3.1);
  return vec3(length(d) / R, atan(d.y, d.x + 1e-5), h21(id + 1.7 + uSeed));
}
void main() {
  vec2 p = vP.xz;
  float fw = max(fwidth(p.x), fwidth(p.y)) + 1e-4;                 // metres per pixel
  // the rut
  float d = 1e5;
  ${RUT_GLSL}
  // broom fans: scallops laid row over row, each streaked from its pivot
  vec2 q = vec2(p.x * 0.819 - p.y * 0.574, p.x * 0.574 + p.y * 0.819) / 23.;
  q += 0.16 * vec2(sin(q.y * 0.83 + 1.3), sin(q.x * 0.71 + 0.4));
  float row = floor(q.y * 2.);
  vec3 f = fan(q, row + 1.);
  vec3 f1 = fan(q, row); f = f.x < 1. ? f : f1;
  vec3 f2v = fan(q, row - 1.); f = f.x < 1. ? f : f2v;
  vec3 f3 = fan(q, row - 2.); f = f.x < 1. ? f : f3;
  float fwq = fw / 23.;
  float bands = 9. + floor(f.z * 6.);
  float ab = f.y * bands / 3.1416 + f.z * 9.;
  float bandId = floor(ab);
  float tone = step(0.52, h21(vec2(bandId, f.z * 91.)));
  float bandEdge = min(fract(ab), 1. - fract(ab));
  float aw = fwq * bands / (3.1416 * max(f.x * 0.6, 0.02));
  tone *= sst(0., aw * 1.5, bandEdge) * sst(0.10, 0.22, f.x);
  float ridge = sst(1., 1. - fwq * 2.5, f.x) * sst(0.90 - fwq * 2.5, 0.90, f.x);
  float fade = 1. - sst(0.25, 1.4, fw);                     // far away the marks settle to a mean
  float m = mix(0.2, tone * 0.46 + ridge * 0.62, fade);
  // pebbles
  vec2 pc = floor(p / 8.), pf = fract(p / 8.) * 8.;
  float pr = h21(pc + 5.5 + uSeed), ps = 0.25 + 0.45 * h21(pc + 9.1);
  float peb = step(1. - 0.3 * uDens, pr) * sst(ps + fw, ps - fw, length(pf - 1.5 - 5. * vec2(h21(pc + 2.), h21(pc + 4.))));
  m = max(m, peb * fade);
  // the pressed rut: clear of fans, two edges, two wheel lines of crimp marks
  float inRut = sst(10. + fw, 10. - fw, d);
  float crown = sst(2.6 + fw, 2.6 - fw, d);
  float rutTone = mix(0.3, 0.1, crown);
  float edge = sst(0.55 + fw, 0.55 - fw * 0.5, abs(d - 10.));
  float wl = sst(0.42 + fw, 0.42 - fw * 0.5, abs(d - 3.5));
  float crimp = sst(-0.2, 0.2, sin((p.x + p.y) * 2.1));
  wl *= mix(1., crimp, fade);
  m = mix(m, rutTone, inRut);
  m = max(m, max(edge * 0.62, wl * 0.8) * mix(0.6, 1., fade));
  vec3 col = mix(uEarth, uMark, m);
  // stones the broom left: a dark disc with a pale cap on its sunward side
  float keep = (1. - sst(0.5, 3.0, fw)) * (1. - sst(13. + fw, 13. - fw, d));
  vec3 pale = mix(uEarth, uPale, 0.42);
  vec2 sc2 = floor(p / 23.), so = (fract(p / 23.) * 23. - 4. - 15. * vec2(h21(sc2 + 12.), h21(sc2 + 14.))) * vec2(1., 1.25);
  float ss = 0.8 + 1.6 * h21(sc2 + 6.1);
  float stone = step(1. - 0.45 * uDens, h21(sc2 + 3.3 + uSeed)) * keep;
  col = mix(col, uMark, stone * sst(ss + fw, ss - fw, length(so)));
  col = mix(col, pale, stone * sst(ss * 0.6 + fw, ss * 0.6 - fw, length(so + vec2(0.34, 0.2) * ss)));
  // tufts of dry grass: a fan of thin pale blades from one root
  vec2 tc = floor(p / 37.), tf = fract(p / 37.) * 37. - 6. - 25. * vec2(h21(tc + 21.), h21(tc + 23.));
  float tr = max(length(tf), 0.05), tb = atan(tf.y, tf.x + 1e-5) * 2.55 + h21(tc) * 6.;
  float tl = 2.0 + 3.6 * h21(vec2(floor(tb), tc.x + tc.y * 7.));
  float bw = 0.5 * 2.55 * max(0.13, fw * 0.8) / tr, ba = fw * 2.55 / tr;
  float tuft = step(1. - 0.55 * uDens, h21(tc + 31. + uSeed)) * keep * sst(bw + ba, bw, abs(fract(tb) - 0.5)) * sst(tl + fw, tl - fw, tr) * sst(0.25, 0.5, tr);
  col = mix(col, pale, tuft);
  if (vNl.y < 0.5) col = uMark;
  gl_FragColor = vec4(col, 1.);
  #include <fog_fragment>
}`;
const FS_WALL = /* glsl */`
uniform vec3 uWall; uniform vec3 uWall2; uniform vec3 uInk; uniform vec3 uSkirt; uniform float uSeed; uniform vec4 uPatch; uniform vec3 uGate;
varying vec3 vP; varying vec3 vNl;
#include <fog_pars_fragment>
${GL_HASH}
float crack(vec2 p, float z0, float y0, float y1, float fw) {
  float wob = (vnoise(vec2(p.y * 0.21 + z0, z0)) - 0.5) * 9. + (vnoise(vec2(p.y * 1.3, z0 + 4.)) - 0.5) * 1.6;
  float w = max(0.10, fw * 1.1);
  return sst(w + fw * 0.5, w - fw * 0.5, abs(p.x - z0 - wob)) * sst(y0, y0 + 2., p.y) * sst(y1, y1 - 6., p.y);
}
void main() {
  vec3 col = uInk;
  vec2 p = vP.zy;
  float fw = max(fwidth(p.x), fwidth(p.y)) + 1e-4;
  if (vNl.x < -0.5) {
    // brushed whitewash in two whites
    float n = vnoise(vec2(p.x * 0.022 + uSeed, p.y * 0.17)) * 0.56 + vnoise(vec2(p.x * 0.07 + 7., p.y * 0.62 + uSeed)) * 0.26 + vnoise(vec2(p.x * 0.045 + 1., p.y * 2.9 + uSeed)) * 0.18;
    float e = clamp(fw * 0.05, 0.004, 0.2);
    float brush = sst(0.55 - e, 0.55 + e, n);
    // dry-brush streaks along the stroke
    float st = vnoise(vec2(p.x * 0.05 + 3., p.y * 2.6 + uSeed));
    brush = max(brush, sst(0.80 - e * 3., 0.80 + e * 3., st) * (1. - sst(0.5, 2.5, fw)));
    col = mix(uWall, uWall2, brush);
    // the one patched panel
    vec2 pd = abs(p - uPatch.xy) - uPatch.zw;
    float pin = sst(fw, -fw, max(pd.x, pd.y));
    float pl = sst(max(0.22, fw) + fw, max(0.22, fw), abs(max(pd.x, pd.y)));
    col = mix(col, uWall2, pin * 0.999);
    col = mix(col, mix(uWall, uInk, 0.3), pl);
    // older patches along the whole wall, one to every 105 m or so
    float pcell = floor(p.x / 105.);
    vec2 pc2 = vec2(pcell * 105. + 28. + 50. * h21(vec2(pcell, uSeed)), 30. + 26. * h21(vec2(pcell + 9., uSeed)));
    vec2 pd2 = abs(p - pc2) - vec2(7. + 6. * h21(vec2(pcell, 3.)), 5. + 4. * h21(vec2(pcell, 5.)));
    float pl2 = sst(max(0.22, fw) + fw, max(0.22, fw), abs(max(pd2.x, pd2.y)));
    col = mix(col, uWall2, sst(fw, -fw, max(pd2.x, pd2.y)) * 0.999);
    col = mix(col, mix(uWall, uInk, 0.3), pl2);
    // two small shuttered windows: a dark opening, a pale cross of bars, a sill
    for (int k = 0; k < 2; k++) {
      vec2 wc = k == 0 ? vec2(74., 40.) : vec2(446., 56.);
      vec2 wd = abs(p - wc) - vec2(6.5, 7.5);
      float wm = max(wd.x, wd.y), lw = max(0.5, fw);
      float win = sst(fw, -fw, wm);
      float bars = max(sst(lw + fw, lw, abs(p.x - wc.x)), sst(lw + fw, lw, abs(p.y - wc.y - 1.5)));
      col = mix(col, mix(uInk, uWall2, bars), win);
      col = mix(col, mix(uWall, uInk, 0.5), sst(lw + fw, lw, abs(wm - 0.6)));
      col = mix(col, mix(uWall, uInk, 0.5), sst(lw + fw, lw, abs(p.y - wc.y + 9.6)) * step(abs(p.x - wc.x), 9.));
    }
    // the yard gate, drawn in the same ink as the street: a frame, six planks, two ledges, a brace between them and
    // a nail head where each plank crosses a ledge (its hinges, latch and bolt are wire: see THE GATE in buildHero)
    vec2 gd = vec2(abs(p.x - uGate.x) - uGate.y, p.y - uGate.z);
    float gm = max(gd.x, gd.y), gin = sst(fw, -fw, gm), glw = max(0.33, fw * 0.95);
    float pw = uGate.y / 3., plank = (p.x - uGate.x) / pw, pe = (0.5 - abs(fract(plank) - 0.5)) * pw;
    vec3 gcol = mix(uWall, uInk, 0.035 + 0.075 * step(0.5, h21(vec2(floor(plank), 3. + uSeed))));
    float ly0 = 7.5, ly1 = uGate.z - 7.5, lh = 1.7;
    float ledge = min(abs(p.y - ly0), abs(p.y - ly1)) - lh;                     // < 0 inside a ledge
    vec2 ba = vec2(uGate.x - uGate.y + 2.6, ly0 + lh), bb = vec2(uGate.x + uGate.y - 2.6, ly1 - lh), bd = bb - ba;
    float bt = clamp(dot(p - ba, bd) / max(dot(bd, bd), 1e-4), 0., 1.), brace = length(p - ba - bd * bt) - 1.45;   // < 0 inside the brace
    float bar = min(ledge, brace);
    float gl = sst(glw * 0.75 + fw, glw * 0.75, pe) * sst(-fw, fw, bar - glw);                // plank joints, hidden behind the bars
    gl = max(gl, sst(glw + fw, glw, abs(ledge)));
    gl = max(gl, sst(glw + fw, glw, abs(brace)) * sst(-fw, fw, ledge - glw));
    gl = max(gl, sst(glw * 1.5 + fw, glw * 1.5, abs(gm + glw * 1.5)));                         // the frame
    float nlx = (fract(plank) - 0.5) * pw;
    gl = max(gl, sst(0.5 + fw, 0.5, length(vec2(nlx, min(abs(p.y - ly0), abs(p.y - ly1))))) * (1. - sst(0.3, 0.8, fw)));
    gcol = mix(gcol, uInk, gl);
    col = mix(col, gcol, gin);
    // hairline cracks
    float ck = max(max(crack(p, 96. + uSeed * 3., 6., 52., fw), crack(p, 251. - uSeed * 2., 20., 70., fw)), max(crack(p, 402. + uSeed, 0., 44., fw), crack(p, 548. + uSeed * 2., 14., 66., fw)));
    col = mix(col, mix(uWall, uInk, 0.42), ck);
    // rain-splashed skirt: earth red stippled up to 15 m
    float sn = vnoise(vec2(p.x * 0.21, p.y * 0.30 + uSeed)) * 0.55 + vnoise(vec2(p.x * 0.9 + 3., p.y * 0.8)) * 0.3 + vnoise(vec2(p.x * 3.1, p.y * 2.7)) * 0.15 * (1. - sst(0.3, 1.2, fw));
    float sk = 1.12 - p.y / 11.;
    float se = clamp(fw * 0.25, 0.01, 0.3);
    col = mix(col, uSkirt, sst(sn - se, sn + se, sk) * (1. - gin));     // (the gate's planks are wood, not whitewash)
  } else if (vNl.y > 0.5) col = uWall;
  gl_FragColor = vec4(col, 1.);
  #include <fog_fragment>
}`;

function makeMaterials(U) {
  const fogU = () => THREE.UniformsUtils.clone(THREE.UniformsLib.fog);
  const mk = (vs, fs, uniforms, defines, extra = {}) => new THREE.ShaderMaterial({
    vertexShader: vs, fragmentShader: fs, uniforms: { ...fogU(), ...uniforms }, defines, fog: true, ...extra });
  const wireU = { uParts: U.uParts, uVH: U.uVH, uWire: U.uWire, uGlint: U.uGlint, uSunW: U.uSun };
  const shU = (col, wide) => ({ uParts: U.uParts, uVH: U.uVH, uSun: U.uSun, uWallX: U.uWallX, uWallH: U.uWallH, uCol: col, uWide: { value: wide } });
  const sh = { depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4, side: THREE.DoubleSide };
  return {
    tube: mk(VS_TUBE, FS_WIRE, wireU, {}, { side: THREE.DoubleSide }),
    tubeBus: mk(VS_TUBE, FS_WIRE, { ...wireU, uCap: { value: BUS_CAP } }, { AXIAL: 1 }, { side: THREE.DoubleSide }),
    solid: mk(VS_SOLID, FS_WIRE, wireU, {}, { side: THREE.DoubleSide }),
    ribG: mk(VS_SHADOW, FS_SHADOW, shU(U.uMark, WIDE_G), { RIBBON: 1 }, sh),
    ribW: mk(VS_SHADOW, FS_SHADOW, shU(U.uInk, WIDE_W), { RIBBON: 1, WALLPASS: 1 }, sh),
    solG: mk(VS_SHADOW, FS_SHADOW, shU(U.uMark, WIDE_G), {}, sh),
    solW: mk(VS_SHADOW, FS_SHADOW, shU(U.uInk, WIDE_W), { WALLPASS: 1 }, sh),
    ribWBus: mk(VS_SHADOW, FS_SHADOW, shU(U.uInk, new THREE.Vector2(1.05, 1.5)), { RIBBON: 1, WALLPASS: 1 }, sh),
    earth: mk(VS_SURF, FS_EARTH, { uEarth: U.uEarth, uMark: U.uMark, uPale: U.uWall, uSeed: U.uSeed, uDens: U.uDens }, {}),
    wall: mk(VS_SURF, FS_WALL, { uWall: U.uWall, uWall2: U.uWall2, uInk: U.uInk, uSkirt: U.uSkirt, uSeed: U.uSeed, uPatch: U.uPatch, uGate: U.uGate }, {}),
  };
}

// meshes for one sink: wire tubes, its two shadow passes, twists, caps and the caps' shadows
async function sinkMeshes(sink, mats, bases, onBefore, twistEvery = 1, pause = null, withTan = false) {
  const group = new THREE.Group(); let tris = 0;
  const add = (geo, mat, order) => { const m = new THREE.Mesh(geo, mat); m.frustumCulled = false; m.renderOrder = order; m.onBeforeRender = onBefore; group.add(m); return m; };
  const w = await buildWireGeometry(sink, pause, withTan); tris += w.tris;
  if (pause) await pause();
  add(w.ribbon, mats.ribG, 1); add(w.ribbon, mats.ribW, 1); add(w.tube, mats.tube, 2);
  if (sink.twists.length) {
    const t = packInstances(sink.twists, false, twistEvery);
    add(instanced(bases.twist, t.mats, t.parts, t.count), mats.solid, 2); tris += t.count * 156;
  }
  if (sink.tops.length) {
    const t = packInstances(sink.tops, true), g = instanced(bases.top, t.mats, t.parts, t.count), gs = instanced(bases.disc, t.mats, t.parts, t.count);
    add(gs, mats.solG, 1); add(gs, mats.solW, 1); add(g, mats.solid, 2); tris += t.count * (112 + 28);
  }
  return { group, tris };
}

// ================================================================ THE TOYS
// Every toy is drawn in its own space (x forward, y up, z across, earth at y 0) under a root part
// whose matrix places it in the yard. Moving pieces get child parts that turn about a pivot.

// A wheel made of a crown cap on a wire axle. Returns nothing; draws into the current part.
function axle(pen, x, y, halfZ, capR, r = WIRE_R) {
  pen.wire([[x, y, -halfZ - 0.7], [x, y, halfZ + 0.7]], { tw: 0, hook: 3, hookR: 0.5, r });
  pen.top([x, y, -halfZ], [0, 0, 1], capR).top([x, y, halfZ], [0, 0, 1], capR);
  // a loop of wire round each cap's hub so the wheel reads as wire too
  pen.wire(ring([x, y, -halfZ - 0.25], capR * 0.42, 7, 'xy'), { closed: true, tw: 0, bev: 0 });
  pen.wire(ring([x, y, halfZ + 0.25], capR * 0.42, 7, 'xy'), { closed: true, tw: 0, bev: 0 });
}

// A bus (or with o.car a car). o: { len, wid, hgt, windows, hero, rodLen, rodRise, rng }
// S (state the driver writes): roll (rad), steer (rad), rodPitch (rad, hero), jig (0..1)
function drawVehicle(pen, P, root, o) {
  const rng = o.rng, L = o.len / 2, W = o.wid / 2, H = o.hgt, capR = o.capR ?? 1.5, y0 = capR + 0.3, S = { roll: 0, steer: 0, rodPitch: 0, t: 0, jig: 1 };
  const car = !!o.car, wx = L * (car ? 0.62 : 0.63);
  // the bus we ride is bent from finer wire than the rest, so that at 50 m its frames stay open and see-through
  const R0 = o.hero ? 0.19 : WIRE_R, R1 = o.hero ? 0.14 : WIRE_R;
  pen.setPart(root);
  for (const z of [-W, W]) {
    // side frame: one outline, closed by a twist
    const side = car
      ? [[-L, y0, z], [L, y0, z], [L, H * 0.5, z], [L * 0.52, H * 0.56, z], [L * 0.25, H, z], [-L * 0.5, H, z], [-L * 0.72, H * 0.56, z], [-L, H * 0.5, z]]
      : [[-L, y0, z], [L, y0, z], [L, H * 0.5, z], [L - H * 0.14, H, z], [-L, H, z]];
    pen.wire(side, { closed: true, r: R0 });
    // window loops
    const n = o.windows, x0 = car ? -L * 0.42 : -L + 1.0, x1 = car ? L * 0.34 : L - H * 0.14 - 1.2, gap = 0.5, ww = (x1 - x0 - gap * (n - 1)) / n;
    const wy0 = H * (car ? 0.60 : 0.55), wy1 = H * 0.92;
    for (let i = 0; i < n; i++) {
      const a = x0 + i * (ww + gap), b = a + ww, lean = !car && i === n - 1 ? 0.7 : 0;
      pen.wire([[a, wy0, z], [b + lean, wy0, z], [b, wy1, z], [a, wy1, z]], { closed: true, bev: 0.35, tw: o.hero ? 0 : i % 2, r: R1 });
    }
    // belt line under the windows, hooked over the frame
    pen.wire([[-L, H * 0.5, z], [L, H * 0.5, z]], { tw: o.hero ? 0 : 3, r: R1 });
  }
  // cross wires tying the two frames, and roof ribs
  const ties = car ? [[-L, y0], [L, y0], [L, H * 0.5], [-L, H * 0.5], [L * 0.25, H], [-L * 0.5, H]]
    : o.hero ? [[-L, y0], [L, y0], [L, H * 0.5], [L - H * 0.14, H], [-L, H]]
    : [[-L, y0], [L, y0], [L, H * 0.5], [L - H * 0.14, H], [-L, H], [-L * 0.35, H], [L * 0.3, H], [-L, H * 0.5]];
  for (const [x, y] of ties) pen.wire([[x, y, -W], [x, y, W]], { tw: 3, r: R0 });
  // headlamps: two small caps
  pen.top([L + 0.15, H * 0.33, -W * 0.6], [1, 0, 0], capR * 0.5).top([L + 0.15, H * 0.33, W * 0.6], [1, 0, 0], capR * 0.5);
  if (!car) {
    // ladder at the back, to one side so the rod can pass (the hero's is narrow and fine, with a rear window
    // loop and two tail-lamp caps beside it, so the back reads as the back of a bus)
    const lz0 = W * (o.hero ? 0.52 : 0.38), lz1 = W * 0.86, lx = -L - 0.5, lr = o.hero ? 0.13 : WIRE_R, nr = o.hero ? 4 : 6;
    pen.wire([[lx, y0 + 0.2, lz0], [lx, H + 0.9, lz0]], { hook: 2, tw: 1, r: lr }).wire([[lx, y0 + 0.2, lz1], [lx, H + 0.9, lz1]], { hook: 2, tw: 1, r: lr });
    for (let k = 0; k < nr; k++) { const y = y0 + 1.0 + k * (H - y0 - 0.6) / nr; pen.wire([[lx, y, lz0], [lx, y, lz1]], { tw: 0, r: lr }); }
    if (o.hero) {
      pen.wire([[-L, H * 0.58, -W * 0.8], [-L, H * 0.58, W * 0.34], [-L, H * 0.9, W * 0.34], [-L, H * 0.9, -W * 0.8]], { closed: true, bev: 0.4, tw: 1, r: R1 });
      pen.top([-L - 0.15, H * 0.36, -W * 0.66], [-1, 0, 0], 0.8).top([-L - 0.15, H * 0.36, W * 0.2], [-1, 0, 0], 0.8);
    }
    // roof rack: a rail on four posts
    const rx0 = -L * 0.82, rx1 = L * 0.62, rz = W * 0.84, ry = H + 0.95, rr = o.hero ? 0.13 : WIRE_R;
    pen.wire([[rx0, ry, -rz], [rx1, ry, -rz], [rx1, ry, rz], [rx0, ry, rz]], { closed: true, r: rr, tw: o.hero ? 0 : 1 });
    for (const [x, z] of [[rx0, -rz], [rx1, -rz], [rx1, rz], [rx0, rz]]) pen.wire([[x, H, z], [x, ry, z]], { tw: 0, r: rr });
    if (o.hero) {
      // three bundles of spare wire and a rolled reed mat, each jigging on its own
      for (let k = 0; k < 3; k++) {
        const bx = rx0 + 3.2 + k * 5.4, part = P.add(root, (m) => { const j = Math.sin(S.t * (9 + k * 2.3) + k * 2.1) * 0.5 + Math.sin(S.t * (17 + k)) * 0.5; m.makeRotationZ(j * 0.035).setPosition(0, Math.abs(j) * 0.22 * S.jig, 0); });
        pen.setPart(part);
        pen.wire(ring([bx, H + 1.5, -rz * 0.3], 1.5, 9, 'zy', k), { closed: true, bev: 0, tw: 0, r: 0.15 });           // a coil seen as a hoop
        pen.wire(ring([bx + 0.5, H + 1.5, -rz * 0.3], 1.25, 8, 'zy', k + 0.4), { closed: true, bev: 0, tw: 0, r: 0.12 });
        pen.wire([[bx + 0.3, H + 2.6, -rz * 0.3], [bx + 1.6 + k * 0.4, H + 3.4 + k * 0.3, -rz * 0.1 - k * 0.5]], { tw: 0, r: 0.18, hook: 2, hookR: 0.35 });   // a loose end
      }
      const mat = P.add(root, (m) => { m.makeTranslation(0, Math.abs(Math.sin(S.t * 13.0)) * 0.16 * S.jig, 0); });
      pen.setPart(mat);
      pen.wire(spring([rx0 + 1.5, H + 0.95, rz * 0.56], [rx1 - 1.5, H + 0.95, rz * 0.56], 0.7, 0.7, 5, 7), { tw: 0, bev: 0, r: 0.12 });
      // one loose wire end that whips at the back
      const whip = P.add(root, (m) => rotAbout(m, -L, H, -W, AZ, Math.sin(S.t * 6.3) * 0.22 * S.jig + Math.sin(S.t * 14.1) * 0.08 * S.jig));
      pen.setPart(whip);
      pen.wire([[-L, H, -W], [-L - 2.2, H + 1.6, -W - 0.3], [-L - 4.6, H + 1.9, -W - 0.2], [-L - 6.4, H + 1.2, -W + 0.2]], { tw: 1, bev: 0.9, hook: 2, hookR: 0.5, r: 0.2 });
    }
  }
  // axles: the front one steers, both roll
  const rear = P.add(root, (m) => rotAbout(m, -wx, capR, 0, AZ, -S.roll));
  const track = W + (o.hero ? 1.5 : 0.6);
  pen.setPart(rear); axle(pen, -wx, capR, track, capR, R0);
  const front = P.add(root, (m) => { rotAbout(m, wx, capR, 0, AY, -S.steer); rotAbout(_m1, wx, capR, 0, AZ, -S.roll); m.multiply(_m1); });
  pen.setPart(front); axle(pen, wx, capR, track, capR, R0);
  // the steering rod: doubled wire from the front axle, out through the open back, to a looped handle
  const rl = o.rodLen, rod = P.add(root, (m) => { rotAbout(m, wx, capR, 0, AZ, -(S.rodPitch || o.rodPitch)); rotAbout(_m1, wx, capR, 0, AY, S.rodYaw ?? -S.steer * 0.5); m.premultiply(_m1); });
  pen.setPart(rod);
  // authored lying along -x from the front axle; the part pitches it up
  const rz = o.hero ? 0.62 : 0.34, x0 = wx, xe = wx - rl, rw = o.hero ? 0.115 : WIRE_R, hr = o.hero ? 1.05 : 1.0;
  if (!o.hero) pen.wire([[x0, capR, rz], [xe, capR, rz]], { tw: 0, r: rw }).wire([[x0, capR, -rz], [xe, capR, -rz]], { tw: 0, r: rw });
  else {
    // the rod we hold is ONE wire doubled: two strands that run side by side, 1.2 m apart, with the light between them,
    // and are twisted round each other one and a half turns at four places along its length (so they change sides)
    const TW = [0.14, 0.38, 0.62, 0.86], half = 1.7;
    const strand = (th0) => { const pts = [], at = (x, th, rho) => pts.push([x, capR + Math.sin(th) * rho, Math.cos(th) * rho]); let th = th0;
      at(x0, th, rz);
      for (const f of TW) { const xc = x0 - f * rl; at(xc + half + 1.0, th, rz);
        for (let i = 0; i <= 18; i++) { const q = i / 18, b = Math.min(1, 5 * q * (1 - q)); at(xc + half - 2 * half * q, th + q * 3 * Math.PI, rz + (0.22 - rz) * b); }
        th += 3 * Math.PI; at(xc - half - 1.0, th, rz); }
      at(xe + 1.6, th, rz); at(xe + 0.9, th, rz * 0.5); at(xe, th, hr); return pts; };       // ... and open, at the end, to either side of the handle loop
    pen.wire(strand(0), { tw: 0, bev: 0, r: rw }).wire(strand(Math.PI), { tw: 0, bev: 0, r: rw });
    pen.wire(spring([xe + 1.9, capR, 0], [xe + 0.7, capR, 0], rz * 0.75, rz * 0.5, 3, 7), { bev: 0, tw: 0, r: 0.11 });   // the three turns that bind them there
  }
  pen.wire([[x0 + 0.2, capR, -1.4], [x0 + 0.2, capR, 1.4]], { tw: 3 });                 // yoke on the axle
  if (!o.hero) for (let k = 1; k < 6; k++) { const x = x0 - (k / 6) * rl; pen.twist([x - 0.9, capR, 0], [x + 0.9, capR, 0], 1.0); }
  // the handle loop. (Ours is a steering wheel: a ring square to the rod, so that the eye, which looks down the rod
  //  from behind and above, sees it as a whole ring and not as a bar)
  if (o.hero) { const b = []; for (let i = 0; i < 24; i++) { const a = (i / 24) * Math.PI * 2; b.push([xe, capR + Math.sin(a) * hr, Math.cos(a) * hr]); } pen.wire(b, { closed: true, bev: 0, r: 0.22, tw: 0 }); }
  else pen.wire(ring([xe - hr, capR, 0], hr, 16, 'xz', 0), { closed: true, bev: 0, r: 0.22, tw: 0 });
  if (!o.hero) pen.twist([xe + 1.6, capR, 0], [xe - 0.4, capR, 0], 1.2);
  if (o.hero) {                                                    // bound with a close wrap of fine wire round the top of the ring, where the hand holds it
    const b = [], N = 40; for (let i = 0; i <= N; i++) { const a = Math.PI * (0.36 + 0.28 * i / N), w = i * 1.9, q = hr + Math.cos(w) * 0.13; b.push([xe + Math.sin(w) * 0.13, capR + Math.sin(a) * q, Math.cos(a) * q]); }
    pen.wire(b, { bev: 0, r: 0.1, tw: 0 });
  }
  return S;
}

// A spoked wheel in the xy plane at (cx, cy): double rim, hub, crossed spokes bound where they cross
function drawWheel(pen, cx, cy, R, nSp, z = 0, rimN = 56) {
  pen.wire(ring([cx, cy, z], R, rimN, 'xy'), { closed: true, bev: 0 });
  pen.wire(ring([cx, cy, z], R - 1.5, Math.round(rimN * 0.75), 'xy', 0.05), { closed: true, bev: 0, r: 0.2 });
  const hr = R * 0.1;
  pen.wire(ring([cx, cy, z - 0.5], hr, 9, 'xy'), { closed: true, bev: 0 }).wire(ring([cx, cy, z + 0.5], hr, 9, 'xy', 0.3), { closed: true, bev: 0 });
  for (let i = 0; i < nSp; i++) {
    const a = (i / nSp) * Math.PI * 2, s = i & 1 ? 1 : -1, b = a + s * 0.62, zz = z + s * 0.5;
    const p0 = [cx + Math.cos(a) * hr, cy + Math.sin(a) * hr, zz], p1 = [cx + Math.cos(b) * (R - 1.5), cy + Math.sin(b) * (R - 1.5), z];
    pen.wire([p0, p1], { tw: 0, r: 0.22, hook: 2, hookR: 0.45 });
    if (s > 0 && (i & 3) === 1) { const f = 0.56; pen.twist([p0[0] + (p1[0] - p0[0]) * f, p0[1] + (p1[1] - p0[1]) * f, z - 0.4], [p0[0] + (p1[0] - p0[0]) * f, p0[1] + (p1[1] - p0[1]) * f, z + 1.2], 0.55); }
  }
  pen.top([cx, cy, z - 1.0], [0, 0, 1], hr * 0.8).top([cx, cy, z + 1.0], [0, 0, 1], hr * 0.8);   // hub caps
}

// The big bicycle. Rear wheel at -x (spinning on its stand), front at +x; the gap between the rims
// (x -12..12) under the trussed top tube is the fly-through.
function drawBicycle(pen, P, root, rng) {
  const R = 17, ax = -29, ay = 19, fx = 29, fy = 17, T = { t: 0 };
  pen.setPart(root);
  drawWheel(pen, fx, fy, R, 18);
  const sc = [-23, 42, 0], ht = [21, 43, 0], hb = [23, 36.5, 0];
  // seat stays and stand: a doubled frame either side of the wheel
  for (const z of [-2.2, 2.2]) {
    pen.wire([[ax, ay, z], [sc[0], sc[1], z * 0.3]], {});
    pen.wire([[ax, ay, z], [ax - 7, 0, z * 3.2], [ax - 9.5, 0, z * 3.2]], { tw: 1, hook: 2, hookR: 0.7 });
    pen.wire([[ax, ay, z], [ax + 6, 0, z * 3.2], [ax + 8.5, 0, z * 3.2]], { tw: 1, hook: 2, hookR: 0.7 });
    pen.wire([[fx, fy, z], [fx - 2.5, fy + 9, z], hb.slice(0, 2).concat(z * 0.4)], { bev: 2.5 });       // fork blade
  }
  pen.wire([[ax - 7.6, 3, -7], [ax - 7.6, 3, 7]], {}).wire([[ax + 6.6, 3, -7], [ax + 6.6, 3, 7]], {});   // stand ties
  // top tube and the lower tube with zigzag bracing between (the detail over the camera)
  const lo0 = [sc[0] + 1.5, 36, 0], lo1 = [hb[0], hb[1], 0];
  pen.wire([sc, ht], {}).wire([lo0, lo1], {}).wire([ht, hb, [hb[0] + 0.6, hb[1] - 2.2, 0]], { tw: 1 });
  const zig = []; for (let i = 0; i <= 10; i++) { const f = i / 10; zig.push(i & 1 ? [sc[0] + (ht[0] - sc[0]) * f, sc[1] + (ht[1] - sc[1]) * f, 0] : [lo0[0] + (lo1[0] - lo0[0]) * f, lo0[1] + (lo1[1] - lo0[1]) * f, 0]); }
  pen.wire(zig, { bev: 0.5, r: 0.22 });
  for (let i = 1; i < 10; i++) pen.twist(zig[i], zig[i + 1] ?? zig[i - 1], 0.8);
  pen.wire([[sc[0], sc[1], 0], [sc[0] - 0.5, sc[1] + 4, 0]], { tw: 1 });
  // saddle: one loop with a sprung underside
  pen.wire([[-28.5, 46.5, 0], [-27, 47.2, -2.2], [-20, 46.4, -0.7], [-18.5, 46.2, 0], [-20, 46.4, 0.7], [-27, 47.2, 2.2]], { closed: true, bev: 0.8 });
  pen.wire(spring([-26, 46.2, 0], [-23.5, 44.2, 0], 0.8, 0.8, 3, 7), { bev: 0, r: 0.2 });
  // handlebars with hooked grips and the bottle-top bell
  pen.wire([[ht[0], ht[1], 0], [ht[0] - 0.8, ht[1] + 4.5, 0]], { tw: 1 });
  pen.wire([[ht[0] - 5, ht[1] + 3.6, -9.5], [ht[0] - 1.4, ht[1] + 4.2, -8], [ht[0] - 0.8, ht[1] + 4.5, 0], [ht[0] - 1.4, ht[1] + 4.2, 8], [ht[0] - 5, ht[1] + 3.6, 9.5]], { bev: 1.6, hook: 3, tw: 0 });
  pen.top([ht[0] - 1.0, ht[1] + 5.3, 4.2], [0.15, 0.98, 0], 1.6);
  pen.wire([[ht[0] - 1.0, ht[1] + 4.4, 4.2], [ht[0] - 1.0, ht[1] + 5.2, 4.2], [ht[0] + 1.2, ht[1] + 5.9, 4.2]], { tw: 1, hook: 2, hookR: 0.4, r: 0.2 });
  // the rear wheel, spinning, with its cranks on the hub and pedals that stay level
  const spin = () => -T.t * 0.85;
  const rw = P.add(root, (m) => rotAbout(m, ax, ay, 0, AZ, spin()));
  pen.setPart(rw); drawWheel(pen, ax, ay, R, 18);
  for (const s of [-1, 1]) {
    const cz = s * 4.6, px = ax + s * 6.2;
    pen.wire([[ax, ay, s * 1.2], [ax, ay, cz], [px, ay, cz], [px, ay, cz + s * 3.4]], { bev: 0.6, tw: 0, hook: 2, hookR: 0.5 });
    const ped = P.add(rw, (m) => rotAbout(m, px, ay, 0, AZ, -spin()));
    pen.setPart(ped);
    pen.wire([[px - 1.7, ay - 0.5, cz + s * 0.5], [px + 1.7, ay - 0.5, cz + s * 0.5], [px + 1.7, ay - 0.5, cz + s * 3.2], [px - 1.7, ay - 0.5, cz + s * 3.2]], { closed: true, bev: 0.4 });
    pen.wire([[px, ay - 0.5, cz + s * 0.5], [px, ay - 0.5, cz + s * 3.2]], { tw: 0, r: 0.2 });
    pen.setPart(rw);
  }
  return T;
}

// The windmill: a braced tripod with a head that hunts and a rotor of petal blades tipped with caps.
// Local x is the rotor axis (the rotor faces +x ... seen as a disc from -x and +x).
function drawWindmill(pen, P, root, rng, blades) {
  const top = 78, Rg = 22, T = { t: 0 };
  pen.setPart(root);
  const leg = (k, y) => { const a = k * 2.094 + Math.PI, r = Rg * (1 - y / top); return [Math.cos(a) * r, y, Math.sin(a) * r]; };
  for (let k = 0; k < 3; k++) {
    pen.wire([[leg(k, 0)[0] * 1.08, 0, leg(k, 0)[2] * 1.08], leg(k, 0), leg(k, top - 1)], { tw: 2, hook: 1, hookR: 0.8, bev: 0.5 });
    const k1 = (k + 1) % 3;
    for (const y of [43, 57, 68]) pen.wire([leg(k, y), leg(k1, y)], {});
    pen.wire([leg(k, 43), leg(k1, 57)], { r: 0.24 }).wire([leg(k1, 43), leg(k, 57)], { r: 0.24 });
    pen.wire([leg(k, 57), leg(k1, 68)], { r: 0.24 });
  }
  pen.wire(spring([0, top - 1.5, 0], [0, top + 1.2, 0], 1.3, 1.0, 3, 7), { bev: 0, tw: 0 });      // the binding at the apex
  // head: hunts about the mast
  const head = P.add(root, (m) => rotAbout(m, 0, top, 0, AY, Math.sin(T.t * 0.37) * 0.16 + Math.sin(T.t * 0.9 + 1.0) * 0.05));
  pen.setPart(head);
  const hy = top + 2.2;
  pen.wire([[5.2, hy, 0], [-19, hy, 0]], { tw: 0 }).wire([[0, top - 1, 0], [0, hy, 0]], { tw: 2 });
  pen.wire([[-12, hy, 0], [-19, hy + 5.5, 0], [-27, hy + 5.5, 0], [-24.5, hy, 0], [-27, hy - 5.5, 0], [-19, hy - 5.5, 0]], { closed: true, bev: 0.8 });   // tail vane
  pen.wire([[-19, hy + 5.5, 0], [-19, hy - 5.5, 0]], { r: 0.2 });
  const rotor = P.add(head, (m) => rotAbout(m, 5.2, hy, 0, AX, T.t * 0.75));
  pen.setPart(rotor);
  const rx = 5.2, Rr = 15;
  pen.wire(ring([rx, hy, 0], 2.2, 9, 'zy'), { closed: true, bev: 0 });
  pen.wire(ring([rx + 0.5, hy, 0], Rr * 0.66, 36, 'zy'), { closed: true, bev: 0, r: 0.24 });
  pen.top([rx + 0.9, hy, 0], [1, 0, 0], 1.7);
  for (let i = 0; i < blades; i++) {
    const a = (i / blades) * Math.PI * 2, w = (Math.PI / blades) * 0.62;
    const pt = (r, da, dx) => [rx + dx, hy + Math.sin(a + da) * r, Math.cos(a + da) * r];
    pen.wire([pt(2.2, 0, 0), pt(Rr * 0.7, -w, -0.9), pt(Rr - 1.6, -w * 0.75, -0.9), pt(Rr - 1.6, w * 0.75, 0.9), pt(Rr * 0.7, w, 0.9)], { closed: true, bev: 0.6 });
    pen.wire([pt(2.2, 0, 0), pt(Rr - 1.6, 0, 0)], { tw: 0, r: 0.24 });
    pen.top(pt(Rr - 0.4, 0, 0), [1, 0, 0], 1.5);
  }
  return T;
}

// A house front: one outline in the xy plane (so its shadow on the wall is its true drawing), a door,
// window crosses, a chimney with a sprung smoke spiral that turns, and two props behind (-z).
function drawHouse(pen, P, root, rng, w, h, kind, prop = 0.42) {      // prop: how far back its two props reach, as a share of the eave height
  const T = { t: 0 }, hw = w / 2, eave = h * rng.range(0.52, 0.64), ov = rng.range(1.6, 2.6);
  pen.setPart(root);
  let roof;
  if (kind === 0) { const rx = rng.range(-0.18, 0.18) * w; roof = [[hw + ov, eave - 0.9, 0], [rx, h, 0], [-hw - ov, eave - 0.9, 0]]; }                 // gable
  else if (kind === 1) roof = [[hw + ov, eave - 0.9, 0], [hw * 0.45, h, 0], [-hw * 0.45, h, 0], [-hw - ov, eave - 0.9, 0]];                            // hipped
  else if (kind === 2) roof = [[hw + ov, eave - 0.6, 0], [hw + ov, eave + (h - eave) * 0.35, 0], [-hw - ov, h, 0], [-hw - ov, eave - 0.6, 0]];   // lean-to
  else { roof = arc([0, eave - 0.9, 0], hw + ov, 0, Math.PI, 9, 'xy', h - eave + 0.9); }                                                               // thatch dome
  pen.wire([[-hw, 0, 0], [hw, 0, 0], [hw, eave, 0], ...roof, [-hw, eave, 0]], { closed: true, bev: 0.8 });
  pen.wire([[-hw, eave, 0], [hw, eave, 0]], {});
  if (kind === 3) { pen.wire(spring([0, h - 0.6, 0], [0, h + 3.2, 0], 1.5, 0.3, 3.5, 7), { bev: 0, tw: 0, hook: 2, hookR: 0.5 }); pen.wire(arc([0, eave - 0.9, 0], (hw + ov) * 0.62, 0.15, Math.PI - 0.15, 7, 'xy', (h - eave) * 0.62), { r: 0.2 }); }
  // door
  const dx = rng.range(-0.25, 0.25) * w, dw = Math.min(3.4, w * 0.14), dh = Math.min(eave * 0.72, 13);
  if (rng.chance(0.4)) pen.wire([[dx - dw, 0, 0], [dx - dw, dh - dw, 0], ...arc([dx, dh - dw, 0], dw, Math.PI, 0, 5, 'xy').slice(1, -1), [dx + dw, dh - dw, 0], [dx + dw, 0, 0]], { tw: 3, bev: 0.3 });
  else pen.wire([[dx - dw, 0, 0], [dx - dw, dh, 0], [dx + dw, dh, 0], [dx + dw, 0, 0]], { tw: 3 });
  pen.wire(ring([dx + dw * 0.5, dh * 0.5, 0.3], 0.55, 5, 'xy'), { closed: true, bev: 0, tw: 0, r: 0.2 });       // the knob
  if (rng.chance(0.5)) pen.wire([[dx - dw, dh * 0.56, 0], [dx + dw, dh * 0.56, 0]], { r: 0.2, tw: 0 });
  // windows with crosses
  const slots = [-0.32, 0.32, 0].filter((s) => Math.abs(s * w - dx) > dw + w * 0.13);
  for (const s of slots) {
    const cx = s * w, ww = Math.min(w * 0.1, 3.0), wh = ww * rng.range(1.0, 1.35), cy = eave * rng.range(0.6, 0.68);
    pen.wire([[cx - ww, cy - wh, 0], [cx + ww, cy - wh, 0], [cx + ww, cy + wh, 0], [cx - ww, cy + wh, 0]], { closed: true, bev: 0.3 });
    pen.wire([[cx, cy - wh, 0], [cx, cy + wh, 0]], { r: 0.2, tw: 0 }).wire([[cx - ww, cy, 0], [cx + ww, cy, 0]], { r: 0.2, tw: 0 });
    if (rng.chance(0.35)) pen.wire([[cx - ww - 0.8, cy - wh - 0.8, 0], [cx + ww + 0.8, cy - wh - 0.8, 0]], { hook: 3, tw: 0, hookR: 0.4 });   // a sill
  }
  // gable light or attic ring
  if (kind < 2 && h - eave > 9) pen.wire(ring([kind === 0 ? roof[1][0] * 0.6 : 0, eave + (h - eave) * 0.36, 0], 1.7, 8, 'xy'), { closed: true, bev: 0 });
  // props behind
  for (const s of [-1, 1]) pen.wire([[s * hw, eave, 0], [s * hw, 0, -eave * prop], [s * hw, 0, -eave * prop - 2]], { tw: 1, bev: 0.5, hook: 2, hookR: 0.5 });
  // chimney and smoke
  const sx = (rng.chance(0.5) ? -1 : 1) * hw * rng.range(0.35, 0.6);
  let ry = eave;                                                    // roof height at sx
  if (kind === 0) { const rx = roof[1][0]; ry = sx > rx ? eave + (h - eave) * (1 - (sx - rx) / (hw + ov - rx)) : eave + (h - eave) * (1 - (rx - sx) / (rx + hw + ov)); }
  else if (kind === 1) ry = Math.min(h, eave + (h - eave) * (1 - (Math.abs(sx) - hw * 0.45) / (hw * 0.55 + ov)));
  else if (kind === 2) ry = eave + (h - eave) * (0.35 + 0.65 * (hw + ov - sx) / (2 * (hw + ov)));
  else ry = eave + (h - eave) * Math.sqrt(Math.max(0.05, 1 - (sx * sx) / ((hw + ov) * (hw + ov))));
  const cy = ry + 3.6;
  pen.wire([[sx - 1.3, ry - 0.8, 0], [sx - 1.3, cy, 0], [sx + 1.3, cy, 0], [sx + 1.3, ry - 0.8, 0]], { bev: 0.3, tw: 3 });
  const rate = rng.range(0.5, 0.9) * (rng.chance(0.5) ? 1 : -1), sh = rng.range(11, 17);
  const smoke = P.add(root, (m) => rotAbout(m, sx, 0, 0, AY, T.t * rate));
  pen.setPart(smoke);
  pen.wire(spring([sx, cy - 0.5, 0], [sx + rng.range(-2, 2), cy + sh, 0], 0.5, rng.range(3.2, 4.6), rng.range(3.5, 5), 9, rng.range(0, 6)), { bev: 0, tw: 0, hook: 2, hookR: 0.6, r: 0.24 });
  pen.setPart(root);
  return T;
}

// A wire tree: three strands twisted into a trunk, each opening into loops.
function drawTree(pen, P, root, rng, h, trunk = 0.5, spread = 1, r = WIRE_R, sway = 0.04) {
  const T = { t: 0 }, th = h * trunk;
  pen.setPart(root);
  const crown = P.add(root, (m) => rotAbout(m, 0, th, 0, AX, Math.sin(T.t * 0.7) * sway + Math.sin(T.t * 1.9) * sway * 0.3));
  for (let k = 0; k < 3; k++) {
    const ph = k * 2.094, foot = [Math.cos(ph) * 3.2, 0, Math.sin(ph) * 3.2];
    const trunk = spring([0, 1.5, 0], [0, th, 0], 1.0, 0.75, 2.2, 7, ph);
    pen.setPart(root).wire([[foot[0] * 1.5, 0, foot[2] * 1.5], foot, ...trunk], { bev: 0, tw: 0, hook: 1, hookR: 0.6, r });
    pen.setPart(crown);
    // each strand opens into two or three teardrop loops
    const n = 2 + (rng.chance(0.5) ? 1 : 0);
    for (let j = 0; j < n; j++) {
      const az = ph + 0.5 + j * 2.094 / n * 3 + rng.range(-0.3, 0.3), el = rng.range(spread < 1 ? 0.55 : 0.25, spread < 1 ? 1.35 : 1.15), len = (h - th) * rng.range(0.7, 1.05) * (spread < 1 ? 1.1 : 1), wd = len * rng.range(0.2, 0.3) * spread;
      const dir = [Math.cos(az) * Math.cos(el), Math.sin(el), Math.sin(az) * Math.cos(el)], side = [-Math.sin(az), 0, Math.cos(az)];
      const loop = [];
      for (let i = 0; i <= 12; i++) { const f = i / 12, a = f * Math.PI * 2, r = Math.sin(a * 0.5); const along = (1 - Math.cos(a)) * 0.5 * len, sw = Math.sin(a) * wd * r; loop.push([dir[0] * along + side[0] * sw, th + dir[1] * along, dir[2] * along + side[2] * sw]); }
      pen.wire(loop, { bev: 0, tw: 1, r });
    }
  }
  pen.setPart(root);
  return T;
}

// A wire tree bent FLAT, to stand close against a wall: three strands twisted into a trunk, its loops fanned out in
// the plane of local x and y (two feet along x, one forward along +z). The crown rocks in its own plane.
function drawFlatTree(pen, P, root, rng, h, trunk = 0.62, r = WIRE_R) {
  const T = { t: 0 }, th = h * trunk;
  pen.setPart(root);
  const crown = P.add(root, (m) => rotAbout(m, 0, th, 0, AZ, Math.sin(T.t * 0.6) * 0.022 + Math.sin(T.t * 1.7) * 0.008));
  const feet = [[5.4, 0, 0], [-5.4, 0, 0], [0, 0, 2.0]], n = [3, 2, 2];
  let j = 0;
  for (let k = 0; k < 3; k++) {
    const ph = k * 2.094, f = feet[k];
    pen.setPart(root).wire([[f[0] * 1.3, 0, f[2] * 1.3], f, ...spring([0, 1.5, 0], [0, th, 0], 0.9, 0.7, 2.2, 7, ph)], { bev: 0, tw: 0, hook: 1, hookR: 0.6, r });
    pen.setPart(crown);
    for (let i = 0; i < n[k]; i++, j++) {
      // seven teardrop loops fanned from one side to the other, the upright ones longest
      const el = 0.3 + (j * 3 % 7) / 6 * 2.54 + rng.range(-0.08, 0.08), len = (h - th) * (0.62 + 0.38 * Math.sin(el)) * rng.range(0.92, 1.04), wd = len * rng.range(0.2, 0.27);
      const c = Math.cos(el), sn = Math.sin(el), loop = [];
      for (let q = 0; q <= 12; q++) { const a = q / 12 * Math.PI * 2, along = (1 - Math.cos(a)) * 0.5 * len, sw = Math.sin(a) * wd * Math.sin(a * 0.5); loop.push([c * along - sn * sw, th + sn * along + c * sw, 0.5 * Math.sin(a + j)]); }
      pen.wire(loop, { bev: 0, tw: 1, r });
    }
  }
  pen.setPart(root);
  return T;
}

// A pole of the street's power line. Local x runs along the line; the two cross arms lie along it so that
// the pole's shadow on the wall is a pole with two bars. Returns [lean, height] of its top.
function drawPole(pen, root, h, rng) {
  pen.setPart(root);
  const lean = rng.range(-0.7, 0.7);
  pen.wire([[2.4, 0, 0], [0, 0, 0], [lean * 0.35, h * 0.5, 0], [lean, h, 0]], { bev: 0.6, tw: 0, hook: 1, hookR: 0.7 });
  for (const [dy, w] of [[-1.2, 4.8], [-7.2, 3.5]]) {
    const y = h + dy;
    pen.wire([[lean - w, y, 0], [lean + w, y, 0]], { tw: 0, hook: 3, hookR: 0.45 });
    pen.twist([lean, y - 0.9, 0], [lean, y + 0.9, 0], 1.1);
    for (const s of [-1, 1]) pen.wire(ring([lean + s * (w - 1.2), y + 0.95, 0], 0.85, 6, 'xy'), { closed: true, bev: 0, tw: 0, r: 0.2 });   // insulators
  }
  pen.wire([[lean * 0.6, h * 0.6, 0], [-10, 0, 0], [-12, 0, 0]], { tw: 1, bev: 0.5, hook: 2, hookR: 0.5, r: 0.22 });                    // a stay
  return [lean, h];
}

// A whirligig: a pole with a pinwheel of five petal loops in the xy plane (so its shadow on the wall is true)
function drawWhirl(pen, P, root, rng, h, R) {
  const T = { t: 0 };
  pen.setPart(root);
  pen.wire([[2.4, 0, 0], [0, 0, 0], [0.5, h * 0.45, 0], [0, h, 0]], { bev: 0.6, tw: 0, hook: 1, hookR: 0.7 });
  pen.wire(spring([0, h - 3.2, 0], [0, h - 0.6, 0], 1.0, 1.0, 3, 7), { bev: 0, tw: 0, r: 0.22 });
  pen.wire([[0, h * 0.5, 0], [9, 0, 0], [11, 0, 0]], { tw: 1, bev: 0.5, hook: 2, hookR: 0.5, r: 0.22 });
  const rotor = P.add(root, (m) => rotAbout(m, 0, h, 0, AZ, T.t * 1.15));
  pen.setPart(rotor);
  pen.wire(ring([0, h, 1.0], 1.6, 8, 'xy'), { closed: true, bev: 0, tw: 0 });
  pen.top([0, h, 1.3], [0, 0, 1], 1.3);
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2, q = (r, da) => [Math.cos(a + da) * r, h + Math.sin(a + da) * r, 1.0];
    pen.wire([q(1.6, 0), q(R * 0.55, 0.46), q(R, 0.2), q(R * 0.86, -0.06)], { closed: true, bev: 0.7 });
    pen.top(q(R - 0.3, 0.2), [0, 0, 1], 1.2);
  }
  pen.setPart(root);
  return T;
}

// A hen 12 m tall (or with `guinea` a rounder guinea fowl): one body outline, wing loops, a coiled
// spring neck, comb and beak; the body tips at the hip and the neck swings to peck.
// T.peck 0..1 is written by the driver.
function drawHen(pen, P, root, rng, guinea) {
  const T = { t: 0, peck: 0, step: 0 };
  pen.setPart(root);
  for (const z of [-1.3, 1.3]) {                                      // legs and three-toed feet
    pen.wire([[0.2, 5.2, z], [-0.5, 2.6, z], [0.3, 0.2, z]], { bev: 0.4, tw: 1 });
    pen.wire([[2.2, 0.2, z - 0.9], [0.3, 0.2, z], [2.4, 0.2, z + 0.6]], { bev: 0, tw: 0, r: 0.2 }).wire([[0.3, 0.2, z], [-1.3, 0.2, z]], { tw: 0, r: 0.2 });
  }
  const body = P.add(root, (m) => rotAbout(m, 0, 5.2, 0, AZ, -T.peck * 0.62));
  pen.setPart(body);
  const out = guinea
    ? [[-5.2, 6.0, 0], [-4.0, 8.6, 0], [-1.2, 10.0, 0], [1.8, 9.6, 0], [3.4, 7.6, 0], [3.0, 5.0, 0], [0.6, 3.6, 0], [-2.6, 3.9, 0], [-4.6, 5.0, 0]]
    : [[-6.4, 10.2, 0], [-4.6, 8.0, 0], [-1.6, 7.6, 0], [1.4, 8.2, 0], [3.0, 7.0, 0], [3.2, 5.2, 0], [1.2, 3.6, 0], [-2.2, 3.5, 0], [-4.4, 5.2, 0], [-5.4, 7.6, 0]];
  pen.wire(out, { closed: true, bev: 0.9 });
  if (!guinea) { pen.wire([[-5.4, 7.6, 0], [-7.6, 9.4, 0.5]], { tw: 1, hook: 2, hookR: 0.5 }).wire([[-5.0, 8.6, 0], [-7.0, 11.4, -0.5]], { tw: 1, hook: 2, hookR: 0.5 }); }   // tail feathers
  for (const z of [-1.5, 1.5]) pen.wire([[-3.4, 6.6, z], [-0.6, 7.4, z], [1.6, 6.4, z], [-0.4, 5.0, z]], { closed: true, bev: 0.7, r: 0.22 });       // wings
  pen.wire([[-0.6, 7.4, -1.5], [-0.6, 7.9, 0], [-0.6, 7.4, 1.5]], { tw: 0, r: 0.2, bev: 0.3 });
  const sx = guinea ? 2.6 : 2.4, sy = guinea ? 8.6 : 7.4, hx = guinea ? 4.6 : 4.4, hy = guinea ? 11.0 : 11.2;
  const neck = P.add(body, (m) => rotAbout(m, sx, sy, 0, AZ, -T.peck * 1.15 + Math.sin(T.t * 2.1) * 0.04));
  pen.setPart(neck);
  pen.wire(spring([sx, sy, 0], [hx, hy, 0], 0.85, 0.6, guinea ? 4 : 6, 7), { bev: 0, tw: 0 });
  pen.wire(ring([hx + 0.6, hy + 0.7, 0], 1.0, 7, 'xy'), { closed: true, bev: 0 });                    // head
  pen.wire([[hx + 1.4, hy + 1.0, 0], [hx + 2.9, hy + 0.3, 0], [hx + 1.5, hy + 0.2, 0]], { bev: 0, tw: 0, r: 0.22 });    // beak
  if (guinea) pen.wire([[hx + 0.2, hy + 1.6, 0], [hx - 0.2, hy + 2.8, 0], [hx - 1.2, hy + 2.2, 0]], { bev: 0.3, tw: 0, hook: 2, hookR: 0.4 });       // casque
  else pen.wire([[hx - 0.3, hy + 1.4, 0], [hx - 0.1, hy + 2.7, 0], [hx + 0.4, hy + 1.8, 0], [hx + 0.8, hy + 2.9, 0], [hx + 1.2, hy + 1.6, 0]], { bev: 0, tw: 0, r: 0.22 });   // comb
  pen.wire(spring([hx + 1.1, hy - 0.2, 0], [hx + 1.3, hy - 1.5, 0], 0.4, 0.3, 2, 6), { bev: 0, tw: 0, r: 0.16 });                                 // wattle
  pen.setPart(root);
  return T;
}

// A helicopter 22 m long. T.rot is the rotor angle (the driver integrates it).
function drawHelicopter(pen, P, root, rng) {
  const T = { t: 0, rot: 0 };
  pen.setPart(root);
  for (const z of [-2.7, 2.7]) {
    // cabin bubble: one outline each side, and the skid under it
    pen.wire([[-4.5, 2.6, z], [3.0, 2.2, z], [6.4, 3.6, z * 0.6], [7.2, 5.6, z * 0.4], [5.6, 8.0, z * 0.7], [1.5, 9.2, z], [-3.0, 8.6, z], [-5.2, 6.0, z]], { closed: true, bev: 1.0 });
    pen.wire([[-6.5, 0.3, z * 1.25], [5.0, 0.3, z * 1.25], [6.8, 1.6, z * 1.25]], { bev: 0.7, tw: 0, hook: 3, hookR: 0.5 });
    pen.wire([[-3.0, 2.6, z], [-3.4, 0.3, z * 1.25]], { r: 0.22 }).wire([[2.4, 2.3, z], [2.8, 0.3, z * 1.25]], { r: 0.22 });
    pen.wire([[-5.2, 6.0, z], [-14.5, 6.4, 0]], { tw: 1 });                                            // boom
    pen.wire([[0.6, 2.4, z], [0.9, 9.1, z]], { r: 0.2, tw: 0 });                                         // door post
  }
  for (const [x, y] of [[-4.5, 2.6], [3.0, 2.2], [1.5, 9.2], [-3.0, 8.6]]) pen.wire([[x, y, -2.7], [x, y, 2.7]], {});
  pen.wire([[-3.0, 8.6, 0], [-14.5, 6.4, 0], [-16.8, 9.8, 0], [-15.8, 5.6, 0], [-14.5, 4.4, 0]], { bev: 0.5, tw: 1, hook: 2, hookR: 0.4 });           // spine, fin and tail skid
  pen.wire([[-0.6, 9.0, -2.7], [-0.6, 10.9, 0], [-0.6, 9.0, 2.7]], { bev: 0.5 }).wire([[-0.6, 10.9, 0], [-0.6, 12.2, 0]], { tw: 0 });                 // mast
  const main = P.add(root, (m) => rotAbout(m, -0.6, 0, 0, AY, T.rot));
  pen.setPart(main);
  for (let k = 0; k < 2; k++) { const c = Math.cos(k * 1.5708), s = Math.sin(k * 1.5708); const q = (a, b) => [-0.6 + a * c - b * s, 12.2, a * s + b * c];
    pen.wire([q(-12.5, -0.7), q(12.5, -0.7), q(12.5, 0.7), q(-12.5, 0.7)], { closed: true, bev: 0.4, tw: 0, r: 0.24 }); }
  pen.top([-0.6, 12.5, 0], [0, 1, 0], 1.3);
  const tail = P.add(root, (m) => rotAbout(m, -16.3, 8.4, 0, AZ, T.rot * 1.7));
  pen.setPart(tail);
  pen.wire(ring([-16.3, 8.4, 0.9], 2.3, 7, 'xy'), { closed: true, bev: 0, r: 0.2 }).wire([[-18.6, 8.4, 0.9], [-14.0, 8.4, 0.9]], { tw: 0, r: 0.2 }).wire([[-16.3, 6.1, 0.9], [-16.3, 10.7, 0.9]], { tw: 0, r: 0.2 });
  pen.setPart(root);
  return T;
}

// An aeroplane (20 m span). T.rot turns the propeller.
function drawPlane(pen, P, root, rng) {
  const T = { t: 0, rot: 0 };
  pen.setPart(root);
  pen.wire([[9.5, 4.2, 0], [7.5, 6.0, 0], [2.0, 6.6, 0], [-8.5, 5.4, 0], [-11.5, 9.2, 0], [-12.2, 4.6, 0], [-8.5, 3.6, 0], [3.0, 2.4, 0], [8.0, 2.8, 0]], { closed: true, bev: 0.8 });   // fuselage
  pen.wire([[3.6, 4.4, -10.5], [5.2, 4.4, -10], [5.8, 4.4, 10], [4.2, 4.4, 10.5], [0.6, 4.4, 10], [0.2, 4.4, -10]], { closed: true, bev: 0.7 });                                      // wing
  pen.wire([[-9.2, 5.0, -4.2], [-8.2, 5.0, 4.2], [-11.4, 5.0, 4.0], [-11.8, 5.0, -4.0]], { closed: true, bev: 0.5, r: 0.22 });                                                        // tail plane
  pen.wire([[2.0, 6.6, 0], [3.2, 4.4, -3.4]], { r: 0.2 }).wire([[2.0, 6.6, 0], [3.2, 4.4, 3.4]], { r: 0.2 });
  for (const z of [-2.6, 2.6]) { pen.wire([[3.0, 2.4, 0], [4.0, 0.9, z]], { tw: 1, r: 0.22 }); pen.top([4.0, 0.9, z + Math.sign(z) * 0.3], [0, 0, 1], 0.9); }
  const prop = P.add(root, (m) => rotAbout(m, 0, 4.2, 0, AX, T.rot));
  pen.setPart(prop);
  pen.wire([[9.9, 4.2, 0], [9.9, 7.8, 0.6], [9.9, 8.0, -0.6]], { closed: true, bev: 0.3, tw: 0, r: 0.22 }).wire([[9.9, 4.2, 0], [9.9, 0.6, -0.6], [9.9, 0.4, 0.6]], { closed: true, bev: 0.3, tw: 0, r: 0.22 });
  pen.top([10.2, 4.2, 0], [1, 0, 0], 0.8);
  pen.setPart(root);
  return T;
}

// An ox cart: two spoked wheels, a railed bed, a pole, and two oxen drawn as outlines; heads nod.
function drawCart(pen, P, root, rng) {
  const T = { t: 0 };
  pen.setPart(root);
  for (const z of [-5.2, 5.2]) drawWheel(pen, -6, 7, 7, 8, z, 26);
  pen.wire([[-6, 7, -6.4], [-6, 7, 6.4]], { tw: 0, hook: 3, hookR: 0.5 });
  pen.wire([[-13, 8.2, -4], [1, 8.2, -4], [1, 8.2, 4], [-13, 8.2, 4]], { closed: true });
  pen.wire([[-13, 11.6, -4], [1, 11.6, -4]], { hook: 3, tw: 0 }).wire([[-13, 11.6, 4], [1, 11.6, 4]], { hook: 3, tw: 0 });
  for (const x of [-12.4, -6, 0.4]) for (const z of [-4, 4]) pen.wire([[x, 8.2, z], [x, 11.6, z]], { r: 0.22 });
  pen.wire([[1, 8.2, 0], [17, 8.6, 0]], {}).wire([[16.2, 8.9, -5.4], [16.2, 8.9, 5.4]], { hook: 3, tw: 0 });      // pole and yoke
  for (const z of [-3.2, 3.2]) {
    pen.wire([[6, 9.6, z], [9, 9.0, z], [13, 9.4, z], [15, 11.0, z], [16.5, 9.8, z], [16.2, 6.4, z], [15.6, 0.3, z], [14.6, 0.3, z], [14.4, 5.0, z], [8.6, 5.0, z], [8.2, 0.3, z], [7.2, 0.3, z], [6.6, 5.6, z]], { closed: true, bev: 0.5 });
    pen.wire([[6, 9.6, z], [5.2, 6.4, z + 0.4]], { tw: 1, hook: 2, hookR: 0.35, r: 0.2 });                        // tail
    const head = P.add(root, (m) => rotAbout(m, 16.4, 9.2, 0, AZ, Math.sin(T.t * 0.9 + z) * 0.12 - 0.05));
    pen.setPart(head);
    pen.wire([[16.4, 9.6, z], [19.6, 9.0, z], [20.6, 6.8, z], [19.4, 6.0, z], [17.0, 7.2, z]], { closed: true, bev: 0.5 });
    pen.wire([[17.6, 9.5, z], [17.2, 11.6, z - 1.6], [18.4, 12.6, z - 1.9]], { bev: 0.5, tw: 1, r: 0.22 }).wire([[17.6, 9.5, z], [17.2, 11.6, z + 1.6], [18.4, 12.6, z + 1.9]], { bev: 0.5, tw: 1, r: 0.22 });
    pen.setPart(root);
  }
  return T;
}

// A radio: a box of two frames, a spiral speaker, two cap knobs, a handle and a long aerial that sways.
function drawRadio(pen, P, root, rng) {
  const T = { t: 0 };
  pen.setPart(root);
  for (const z of [-2.4, 2.4]) pen.wire([[-8, 0.3, z], [8, 0.3, z], [8, 10, z], [-8, 10, z]], { closed: true });
  for (const [x, y] of [[-8, 0.3], [8, 0.3], [8, 10], [-8, 10]]) pen.wire([[x, y, -2.4], [x, y, 2.4]], { r: 0.22 });
  const sp = []; for (let i = 0; i <= 30; i++) { const a = i * 0.62, r = 0.5 + i * 0.105; sp.push([-3.4 + Math.cos(a) * r, 5.2 + Math.sin(a) * r, 2.4]); }
  pen.wire(sp, { bev: 0, tw: 2, r: 0.22 });
  pen.wire([[1.6, 7.4, 2.4], [6.6, 7.4, 2.4], [6.6, 5.4, 2.4], [1.6, 5.4, 2.4]], { closed: true, bev: 0.3, r: 0.22 }).wire([[3.4, 7.4, 2.4], [3.4, 5.4, 2.4]], { tw: 0, r: 0.18 });
  pen.top([2.6, 2.6, 2.6], [0, 0, 1], 1.1).top([5.6, 2.6, 2.6], [0, 0, 1], 1.1);
  pen.wire([[-5, 10, 0], [-4, 13, 0], [4, 13, 0], [5, 10, 0]], { bev: 0.9 });
  const aer = P.add(root, (m) => rotAbout(m, 7, 10, 0, AX, Math.sin(T.t * 1.3) * 0.045));
  pen.setPart(aer);
  pen.wire([[7, 10, 0], [10.5, 26, 0], [13.5, 41, 0]], { bev: 0, tw: 1, hook: 2, hookR: 0.8 });
  pen.twist([10.2, 24.6, 0], [10.6, 26.5, 0], 1.2);
  pen.setPart(root);
  return T;
}

// A hoop of radius R standing in the xy plane on the earth, closed by a long twist
function drawHoop(pen, part, R, n, r = WIRE_R) {
  pen.setPart(part);
  pen.wire(ring([0, R, 0], R, n, 'xy', -1.5708), { closed: true, bev: 0, tw: 0, r });
  // the joint sits high on the side toward the wall (never on the earth): the two ends lie side by side for a few
  // metres, bound with turns of fine wire, and each end is bent out into a hook
  const a0 = 0.5, sp = Math.max(0.11, 2.4 / R), q = (a, rr, z = 0) => [Math.cos(a) * rr, R + Math.sin(a) * rr, z];
  const coil = [], N = 46; for (let i = 0; i <= N; i++) { const f = i / N, a = a0 - sp + f * 2 * sp, w = f * 9 * 6.2832; coil.push(q(a, R + 0.35 + Math.cos(w) * 0.85, Math.sin(w) * 0.85)); }
  pen.wire(coil, { bev: 0, tw: 0, r: 0.2 });
  const lap = []; for (let i = 0; i <= 8; i++) lap.push(q(a0 - sp * 1.5 + (i / 8) * sp * 3, R + 0.7));
  pen.wire(lap, { bev: 0, tw: 0, r });
  pen.wire([q(a0 + sp * 1.5, R + 0.7), q(a0 + sp * 1.9, R + 2.4), q(a0 + sp * 1.6, R + 4.2)], { bev: 0.5, tw: 0, hook: 2, hookR: 0.8 });
  pen.wire([q(a0 - sp * 1.5, R + 0.7), q(a0 - sp * 2.0, R - 1.6), q(a0 - sp * 1.7, R - 3.2)], { bev: 0.5, tw: 0, hook: 2, hookR: 0.8 });
  pen.twist(q(a0 - sp * 1.2, R + 0.35), q(a0 - sp * 0.9, R + 0.35), 1.5).twist(q(a0 + sp * 0.9, R + 0.35), q(a0 + sp * 1.2, R + 0.35), 1.5);
}

// The chameleon on the wall top: outline in the xy plane (x along the wall), tail a spiral that swings.
function drawChameleon(pen, P, root, rng) {
  const T = { t: 0 };
  pen.setPart(root);
  pen.wire([[-6, 2.6, 0], [-3.5, 5.6, 0], [1.5, 6.4, 0], [5.4, 5.2, 0], [7.2, 7.2, 0], [9.6, 5.6, 0], [10.4, 3.6, 0], [8.2, 2.8, 0], [5.0, 2.2, 0], [-2.0, 1.8, 0]], { closed: true, bev: 0.8 });
  pen.wire(ring([8.2, 4.8, 0], 0.8, 6, 'xy'), { closed: true, bev: 0, r: 0.2, tw: 0 });
  for (const x of [-2.6, 4.4]) for (const z of [-1, 1]) pen.wire([[x, 2.4, 0], [x + 1.4, 1.2, z * 1.4], [x + 0.4, 0.2, z * 1.6], [x + 1.8, 0.2, z * 1.6]], { bev: 0.3, tw: 1, r: 0.22 });
  const tail = P.add(root, (m) => rotAbout(m, -6, 2.6, 0, AZ, Math.sin(T.t * 0.6) * 0.3 + 0.1));
  pen.setPart(tail);
  const sp = []; for (let i = 0; i <= 26; i++) { const a = 0.4 - i * 0.36, r = 3.6 - i * 0.12; sp.push([-9.4 + Math.cos(a) * r, 1.2 + Math.sin(a) * r, 0]); }
  pen.wire([[-6, 2.6, 0], ...sp], { bev: 0, tw: 0 });
  pen.setPart(root);
  return T;
}

// The maker's pliers and the coil of offcuts, lying on the earth
function drawPliers(pen, root, rng) {
  pen.setPart(root);
  const y = 0.5;
  pen.wire([[-9, y, -2.6], [-2, y, -1.0], [0, y, 0], [3.4, y, 0.9], [6.2, y, 0.5]], { bev: 0.8, r: 0.5, tw: 0 });
  pen.wire([[-9, y + 0.5, 2.6], [-2, y + 0.5, 1.0], [0, y + 0.5, 0], [3.4, y + 0.5, -0.9], [6.2, y + 0.5, -0.5]], { bev: 0.8, r: 0.5, tw: 0 });
  pen.top([0, y + 1.0, 0], [0, 1, 0], 1.0);
  const c = [15, 0.9, 6], N = 110, coil = [];
  for (let i = 0; i <= N; i++) { const a = (i / N) * Math.PI * 2 * 5.3, r = 4.6 + Math.sin(i * 0.9) * 0.35 + i * 0.006; coil.push([c[0] + Math.cos(a) * r, c[1] + (i / N) * 1.6 + Math.sin(i * 1.7) * 0.15, c[2] + Math.sin(a) * r]); }
  pen.wire(coil, { bev: 0, tw: 0, hook: 3, hookR: 0.6 });
  pen.wire(ring([c[0] + 4.7, c[1] + 0.8, c[2]], 1.3, 7, 'xy'), { closed: true, bev: 0, r: 0.18 });
  for (let k = 0; k < 5; k++) { const x = rng.range(-6, 26), z = rng.range(-12, -4), a = rng.range(0, 6.28), l = rng.range(1.5, 3.5);
    pen.wire([[x, 0.3, z], [x + Math.cos(a) * l, 0.3, z + Math.sin(a) * l], [x + Math.cos(a + 1.1) * l * 1.6, 0.3, z + Math.sin(a + 1.1) * l * 1.6]], { bev: 0.3, tw: 0, hook: 2, hookR: 0.4 }); }
}

// ================================================================ THE PARADE'S TOYS
// A lorry on its push rod: cab, staked bed with a load of wire coils that jig, three axles of crown caps.
// S.roll (rad) and S.t are written by the driver.
function drawLorry(pen, P, root, rng) {
  const S = { roll: 0, t: 0 }, L = 15, W = 4.2, H = 13.5, capR = 2.3, y0 = capR + 0.5, bed = y0 + 5.2, cab = 5.2;
  pen.setPart(root);
  for (const z of [-W, W]) {
    pen.wire([[-L, y0, z], [L, y0, z], [L, H * 0.56, z], [L - 2.4, H, z], [cab, H, z], [cab, bed, z], [-L, bed, z]], { closed: true, r: 0.32 });
    pen.wire([[cab + 1.3, H * 0.58, z], [L - 1.0, H * 0.58, z], [L - 2.7, H * 0.9, z], [cab + 1.3, H * 0.9, z]], { closed: true, bev: 0.4, tw: 0 });   // cab window
    pen.wire([[cab + 1.0, y0 + 0.8, z], [cab + 1.0, H * 0.5, z], [L - 1.6, H * 0.5, z]], { tw: 0, bev: 0.5, r: 0.2, hook: 2, hookR: 0.4 });                // door line
    for (const x of [-10, -5, 0]) pen.wire([[x, y0, z], [x, bed + 1.6, z]], { tw: 1, hook: 2, hookR: 0.4, r: 0.22 });                                        // stakes
    pen.wire([[-L, y0 + 2.7, z], [cab, y0 + 2.7, z]], { tw: 0, r: 0.2 });
  }
  for (const [x, y] of [[-L, y0], [-L, bed], [cab, bed], [cab, H], [L - 2.4, H], [L, H * 0.56], [L, y0], [cab, y0]]) pen.wire([[x, y, -W], [x, y, W]], { tw: 3 });
  pen.wire([[L, y0 + 0.4, -W], [L + 1.4, y0 + 0.4, -W - 0.6], [L + 1.4, y0 + 0.4, W + 0.6], [L, y0 + 0.4, W]], { bev: 0.5, tw: 3 });                         // bumper
  pen.top([L + 0.2, H * 0.36, -W * 0.62], [1, 0, 0], 1.2).top([L + 0.2, H * 0.36, W * 0.62], [1, 0, 0], 1.2);
  pen.wire(spring([L - 5.5, H, W * 0.5], [L - 5.5, H + 4.4, W * 0.5], 0.6, 0.25, 4, 6), { bev: 0, tw: 0, r: 0.16, hook: 2, hookR: 0.4 });                     // a sprung aerial
  // the load: coils of wire standing in the bed, a drum of caps, all jigging
  const load = P.add(root, (m) => { const j = Math.sin(S.t * 8.3) * 0.5 + Math.sin(S.t * 13.7) * 0.5; m.makeRotationZ(j * 0.02).setPosition(0, Math.abs(j) * 0.3, 0); });
  pen.setPart(load);
  for (let k = 0; k < 4; k++) { const x = -12.2 + k * 4.3, r = 3.6 + (k & 1) * 0.9;
    pen.wire(ring([x, y0 + r + 0.3, (k & 1 ? -0.6 : 0.6)], r, 11, 'zy', k * 0.7), { closed: true, bev: 0, tw: 1, r: 0.3 });
    pen.wire(ring([x + 0.9, y0 + r + 0.3, (k & 1 ? -0.6 : 0.6)], r * 0.72, 9, 'zy', k), { closed: true, bev: 0, tw: 0, r: 0.2 }); }
  pen.top([2.6, y0 + 3.0, 0], [1, 0, 0.2], 2.4).top([3.6, y0 + 3.0, 0], [1, 0, -0.2], 2.4);
  for (const x of [L * 0.62, -6.2, -11.4]) { const ax = P.add(root, (m) => rotAbout(m, x, capR, 0, AZ, -S.roll)); pen.setPart(ax); axle(pen, x, capR, W + 0.8, capR, 0.3); }
  // the push rod: doubled wire from the tail, bound twice, to a handle loop that sways
  // (it rises from the front axle through the coils of the load and ends 16 m behind the lorry's middle: on a turn
  //  no rod of the parade sweeps nearer the rut than 20 m)
  const rl = rng.range(28, 31), rx = L * 0.62, rod = P.add(root, (m) => rotAbout(m, rx, capR, 0, AZ, -0.62 - Math.sin(S.t * 2.2) * 0.012));
  pen.setPart(rod);
  pen.wire([[rx, capR, 0.45], [rx - rl, capR, 0.45]], { tw: 0 }).wire([[rx, capR, -0.45], [rx - rl, capR, -0.45]], { tw: 0 });
  for (const f of [0.5, 0.74, 0.96]) pen.twist([rx - f * rl - 0.9, capR, 0], [rx - f * rl + 0.9, capR, 0], 1.3);
  pen.wire(ring([rx - rl - 1.5, capR, 0], 1.5, 12, 'xz'), { closed: true, bev: 0, tw: 0 });
  pen.setPart(root);
  return S;
}

// A beast of bent wire that walks: a zebu cow (kind 0, 16 m at the hump) or a goat (kind 1). One body outline, two
// rib hoops the legs hang from, a head that nods, a tail that swishes. S.walk (rad) swings the legs; S.t.
function drawBeast(pen, P, root, rng, kind) {
  const S = { walk: 0, t: 0, graze: 0 }, goat = kind === 1;
  pen.setPart(root);
  const body = goat
    ? [[-11, 12.6, 0], [-4, 13.4, 0], [5, 13.2, 0], [9.5, 13.8, 0], [10.2, 9.5, 0], [7.5, 7.0, 0], [0, 6.2, 0], [-8, 7.2, 0], [-11.2, 9.6, 0]]
    : [[-11, 13.2, 0], [-4, 13.6, 0], [2.5, 14.2, 0], [5.2, 16.6, 0], [7.6, 14.4, 0], [9.6, 13.6, 0], [10.4, 9.2, 0], [8.2, 6.6, 0], [0, 5.8, 0], [-8, 6.8, 0], [-11.4, 9.6, 0]];
  pen.wire(body, { closed: true, bev: 1.0, r: 0.34 });
  for (const x of [7.4, -8.4]) pen.wire(ring([x, 10.2, 0], 2.7, 9, 'zy', 0.35, 3.6), { closed: true, bev: 0, tw: 1 });
  pen.wire([[-8.4, 12.6, 2.2], [7.4, 12.6, 2.2]], { tw: 3, r: 0.22 }).wire([[-8.4, 12.6, -2.2], [7.4, 12.6, -2.2]], { tw: 3, r: 0.22 });
  if (!goat) pen.wire(ring([-5.2, 5.6, 0], 1.3, 7, 'xy'), { closed: true, bev: 0, tw: 0, r: 0.2 });                                // udder
  let li = 0;
  for (const x of [7.4, -8.4]) for (const z of [-2.5, 2.5]) {
    const ph = (li === 0 || li === 3) ? 0 : Math.PI, fore = x > 0; li++;
    const leg = P.add(root, (m) => rotAbout(m, x, 7.4, 0, AZ, Math.sin(S.walk + ph) * 0.4));
    pen.setPart(leg);
    pen.wire([[x, 7.6, z], [x + (fore ? 0.3 : -0.9), 4.0, z], [x + (fore ? -0.1 : 0.3), 0.35, z], [x + 1.5, 0.35, z]], { bev: 0.4, tw: 1, r: 0.3 });
    pen.twist([x + (fore ? 0.3 : -0.9), 3.4, z], [x + (fore ? 0.3 : -0.9), 4.8, z], 1.0);
  }
  const head = P.add(root, (m) => rotAbout(m, 9.4, 12.6, 0, AZ, -S.graze * 0.95 + Math.sin(S.walk * 2) * 0.05 + Math.sin(S.t * 0.9) * 0.04));
  pen.setPart(head);
  if (goat) {
    pen.wire([[9.4, 13.6, 0], [11.8, 17.6, 0], [15.4, 17.2, 0], [17.4, 14.8, 0], [16.6, 13.6, 0], [13.2, 13.9, 0], [10.2, 10.4, 0]], { bev: 0.6, tw: 3, r: 0.3 });
    for (const z of [-1, 1]) pen.wire([[12.4, 17.6, z * 0.6], [10.2, 20.6, z * 1.6], [7.4, 21.0, z * 2.2], [6.2, 19.4, z * 2.2]], { bev: 0.8, tw: 1, r: 0.26 });     // horns swept back
    pen.wire(spring([15.6, 13.6, 0], [15.2, 11.2, 0], 0.5, 0.2, 2.5, 6), { bev: 0, tw: 0, r: 0.16 });                                                          // beard
  } else {
    pen.wire([[9.4, 13.8, 0], [13.6, 15.6, 0], [17.6, 13.6, 0], [18.8, 11.0, 0], [17.2, 9.8, 0], [13.6, 11.0, 0], [10.2, 9.6, 0]], { bev: 0.6, tw: 3, r: 0.32 });
    for (const z of [-1, 1]) pen.wire([[13.4, 15.5, z * 0.8], [13.0, 18.6, z * 3.6], [14.6, 21.4, z * 3.2]], { bev: 0.9, tw: 1, hook: 0, r: 0.3 });               // horns
    pen.wire(spring([11.0, 9.8, 0], [10.6, 7.6, 0], 0.7, 0.4, 2, 6), { bev: 0, tw: 0, r: 0.16 });                                                              // dewlap bell
    pen.top([10.6, 7.0, 0], [0, 0, 1], 0.8);
  }
  for (const z of [-1, 1]) pen.wire([[12.6, 15.0, z * 0.9], [11.2, 15.6, z * 3.0], [11.8, 14.4, z * 2.4]], { closed: true, bev: 0.3, tw: 0, r: 0.2 });           // ears
  pen.wire(ring([15.2, goat ? 15.6 : 13.2, 0.9], 0.55, 5, 'xy'), { closed: true, bev: 0, tw: 0, r: 0.18 });
  const tail = P.add(root, (m) => rotAbout(m, -11, 12.8, 0, AX, Math.sin(S.t * 2.1 + li) * 0.5));
  pen.setPart(tail);
  if (goat) pen.wire([[-11, 12.6, 0], [-12.6, 14.6, 0], [-12.2, 16.0, 0]], { bev: 0.4, tw: 1, hook: 2, hookR: 0.4, r: 0.24 });
  else { pen.wire([[-11, 13.0, 0], [-12.4, 11.6, 0], [-12.6, 6.4, 0]], { bev: 0.8, tw: 1, r: 0.24 }); pen.wire(spring([-12.6, 6.4, 0], [-12.6, 4.0, 0], 0.3, 0.8, 3, 6), { bev: 0, tw: 0, r: 0.16 }); }
  pen.setPart(root);
  return S;
}

// A bicycle that rolls on a push stick: both wheels turn, the cranks go round. S.roll, S.t.
function drawBike(pen, P, root, rng) {
  const S = { roll: 0, t: 0 }, R = 8.5, ax = -11.5, fx = 11.5, sc = [-4.2, 22.5, 0], ht = [7.6, 23.2, 0], hb = [8.6, 18.6, 0], bb = [-1.2, 9.4, 0];
  const rw = P.add(root, (m) => rotAbout(m, ax, R, 0, AZ, -S.roll)); pen.setPart(rw); drawWheel(pen, ax, R, R, 10, 0, 30);
  const fw = P.add(root, (m) => rotAbout(m, fx, R, 0, AZ, -S.roll)); pen.setPart(fw); drawWheel(pen, fx, R, R, 10, 0, 30);
  pen.setPart(root);
  for (const z of [-1.5, 1.5]) {
    pen.wire([[ax, R, z], [sc[0], sc[1], z * 0.2]], {}).wire([[ax, R, z], [bb[0], bb[1], z * 0.3]], {});
    pen.wire([[fx, R, z], [fx - 1.6, R + 5.5, z], [hb[0], hb[1], z * 0.3]], { bev: 1.6 });
  }
  pen.wire([sc, bb], {}).wire([sc, ht], {}).wire([bb, hb], {}).wire([[hb[0] + 0.2, hb[1] - 1, 0], hb, ht, [ht[0] - 0.6, ht[1] + 3.2, 0]], { bev: 0.3, tw: 1 });
  pen.wire([[ht[0] - 3.6, ht[1] + 2.4, -5.6], [ht[0] - 0.9, ht[1] + 3.0, -4.6], [ht[0] - 0.6, ht[1] + 3.2, 0], [ht[0] - 0.9, ht[1] + 3.0, 4.6], [ht[0] - 3.6, ht[1] + 2.4, 5.6]], { bev: 1.1, hook: 3, tw: 0 });
  pen.top([ht[0] - 0.6, ht[1] + 4.0, 2.6], [0.1, 1, 0], 1.1);                                                                                              // the bell
  pen.wire([[sc[0], sc[1], 0], [sc[0] - 0.4, sc[1] + 2.6, 0]], { tw: 1 });
  pen.wire([[-8.0, 25.4, 0], [-6.8, 25.9, -1.5], [-1.9, 25.3, -0.5], [-1.0, 25.1, 0], [-1.9, 25.3, 0.5], [-6.8, 25.9, 1.5]], { closed: true, bev: 0.5 });  // saddle
  pen.wire([[ax - 1, R + 9.2, -2.2], [ax + 4, R + 9.6, -2.2], [ax + 4, R + 9.6, 2.2], [ax - 1, R + 9.2, 2.2]], { closed: true, bev: 0.4, r: 0.22 });     // carrier
  pen.wire([[ax + 1.5, R + 9.4, 0], [sc[0], sc[1] - 2, 0]], { r: 0.22 });
  const crank = P.add(root, (m) => rotAbout(m, bb[0], bb[1], 0, AZ, -S.roll * 0.55));
  pen.setPart(crank);
  pen.wire(ring([bb[0], bb[1], 0.9], 2.1, 9, 'xy'), { closed: true, bev: 0, tw: 0, r: 0.22 });
  for (const s of [-1, 1]) pen.wire([[bb[0], bb[1], s * 0.6], [bb[0], bb[1], s * 2.2], [bb[0] + s * 3.4, bb[1], s * 2.2], [bb[0] + s * 3.4, bb[1], s * 4.4]], { bev: 0.4, tw: 0, hook: 2, hookR: 0.4, r: 0.24 });
  const stick = P.add(root, (m) => rotAbout(m, sc[0], sc[1], 0, AZ, Math.sin(S.t * 1.9) * 0.02));
  pen.setPart(stick);
  pen.wire([[sc[0] - 1, sc[1] - 1, 0.5], [-16, 33, 0.5]], { tw: 1 }).wire([[sc[0] - 1, sc[1] - 1, -0.5], [-16, 33, -0.5]], { tw: 1 });
  pen.wire(ring([-17.1, 33.6, 0], 1.4, 10, 'xz'), { closed: true, bev: 0, tw: 0 });
  pen.setPart(root);
  return S;
}

// ================================================================ THE TWO GIANTS
// A giraffe 46 m to its horns: one body outline with patch loops, two rib hoops the long legs hang from (each leg
// bends at a bound knee), a neck of two wires with a sprung mane and patches, a head with capped horns and ears that
// flick, a tail with a sprung tuft. S.walk (rad) swings the legs, S.browse (0..1) lifts the head to feed, S.t.
function drawGiraffe(pen, P, root, rng) {
  const S = { walk: 0, t: 0, browse: 0 };
  const body = P.add(root, (m) => { m.makeRotationZ(Math.sin(S.walk * 2) * 0.012).setPosition(0, Math.abs(Math.sin(S.walk)) * 0.5, 0); });
  pen.setPart(body);
  pen.wire([[-9.5, 25.5, 0], [-3, 26.6, 0], [4, 28.4, 0], [7.6, 30.2, 0], [9.8, 27.2, 0], [9.2, 21.6, 0], [4, 18.8, 0], [-4, 18.6, 0], [-9, 20.0, 0], [-10.6, 22.6, 0]], { closed: true, bev: 1.0, r: 0.36 });
  for (const x of [6.6, -7.6]) pen.wire(ring([x, 22.6, 0], 2.5, 9, 'zy', 0.35, 3.9), { closed: true, bev: 0, tw: 1 });
  for (const z of [-2.1, 2.1]) pen.wire([[-7.6, 25.6, z], [6.6, 26.0, z]], { tw: 3, r: 0.22 });
  // the patches: five-cornered loops of fine wire, each closed by a twist
  const patch = (cx, cy, r, z, n = 5) => { const a0 = rng.range(0, 6.28), o = []; for (let i = 0; i < n; i++) { const a = a0 + (i / n) * 6.2832, rr = r * (0.8 + 0.4 * rng()); o.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr, z]); } pen.wire(o, { closed: true, bev: 0.3, r: 0.2, tw: 0 }); };
  for (const [cx, cy, r] of [[-6.6, 23.2, 1.7], [-2.6, 24.4, 1.5], [-3.6, 21.0, 1.5], [1.2, 22.0, 1.8], [1.6, 25.8, 1.4], [5.4, 24.6, 1.6], [6.2, 21.4, 1.3]]) patch(cx, cy, r, 0);
  let li = 0;
  for (const x of [6.6, -7.6]) for (const z of [-2.4, 2.4]) {
    const ph = (li === 0 || li === 3) ? 0 : Math.PI, fore = x > 0; li++;
    const leg = P.add(body, (m) => rotAbout(m, x, 20.4, 0, AZ, Math.sin(S.walk + ph) * 0.3));
    pen.setPart(leg);
    pen.wire([[x, 20.6, z], [x + (fore ? 0.2 : -0.9), 10.6, z]], { tw: 1, r: 0.32 });
    const shin = P.add(leg, (m) => rotAbout(m, x + (fore ? 0.2 : -0.9), 10.6, 0, AZ, (fore ? -1 : 1) * Math.max(0, Math.sin(S.walk + ph + 1.2)) * 0.42));
    pen.setPart(shin);
    const kx = x + (fore ? 0.2 : -0.9);
    pen.wire([[kx, 10.6, z], [kx + (fore ? -0.3 : 0.5), 1.0, z], [kx + (fore ? 0.0 : 0.8), 0.35, z], [kx + 1.9, 0.35, z]], { bev: 0.3, tw: 0, hook: 2, hookR: 0.4, r: 0.3 });
    pen.wire(spring([kx, 9.8, z], [kx, 11.4, z], 0.62, 0.62, 3, 6), { bev: 0, tw: 0, r: 0.14 });                 // the bound knee
    pen.wire(ring([kx + 0.8, 0.9, z], 0.9, 6, 'xy'), { closed: true, bev: 0, tw: 0, r: 0.2 });                    // hoof
  }
  // the neck leans with the stride and rises to feed
  const neck = P.add(body, (m) => rotAbout(m, 7.6, 27.6, 0, AZ, 0.07 * Math.sin(S.walk * 2 + 0.6) * (1 - S.browse) + 0.2 * S.browse + 0.02 * Math.sin(S.t * 0.8)));
  pen.setPart(neck);
  pen.wire([[6.4, 29.6, 0], [9.6, 35.6, 0], [13.2, 42.6, 0]], { bev: 2.5, tw: 1, r: 0.34 });
  pen.wire([[9.8, 26.6, 0], [12.4, 33.4, 0], [15.2, 40.2, 0]], { bev: 2.5, tw: 1, r: 0.34 });
  pen.wire(spring([6.0, 30.0, 0], [12.6, 42.8, 0], 0.75, 0.55, 15, 6), { bev: 0, tw: 0, r: 0.15 });                // mane
  for (const [f, r] of [[0.14, 1.25], [0.36, 1.15], [0.58, 1.05], [0.8, 0.9]]) patch(8.2 + f * 6.0, 28.4 + f * 13.0, r, 0, 4);
  for (const f of [0.26, 0.5, 0.72]) pen.wire([[6.4 + f * 6.8, 29.6 + f * 13.0, 0], [9.8 + f * 5.4, 26.6 + f * 13.6, 0]], { tw: 3, r: 0.2 });   // ties across
  const head = P.add(neck, (m) => rotAbout(m, 14.0, 41.6, 0, AZ, -0.1 + 0.07 * Math.sin(S.walk * 2) * (1 - S.browse) + S.browse * (0.5 + 0.16 * Math.sin(S.t * 2.6)) + 0.03 * Math.sin(S.t * 1.3)));
  pen.setPart(head);
  pen.wire([[13.0, 42.6, 0], [14.8, 44.4, 0], [18.4, 43.4, 0], [21.2, 41.2, 0], [21.0, 39.9, 0], [17.6, 39.9, 0], [15.2, 40.2, 0]], { closed: true, bev: 0.6, r: 0.3 });
  for (const z of [-0.9, 0.9]) { pen.wire([[15.0, 44.2, z * 0.6], [14.5, 46.8, z]], { tw: 1, r: 0.24 }); pen.top([14.5, 47.0, z], [-0.15, 0.98, 0], 0.75); }      // horns with cap knobs
  pen.wire(ring([17.0, 42.4, 0.5], 0.6, 5, 'xy'), { closed: true, bev: 0, tw: 0, r: 0.18 });
  pen.wire(spring([20.9, 40.2, 0], [21.6, 38.4, 0], 0.3, 0.12, 2.5, 6), { bev: 0, tw: 0, r: 0.14, hook: 2, hookR: 0.3 });                                // tongue
  for (const z of [-1, 1]) { const ear = P.add(head, (m) => rotAbout(m, 13.8, 43.6, 0, AX, z * (0.25 + 0.3 * Math.max(0, Math.sin(S.t * 1.7 + z)))));
    pen.setPart(ear).wire([[13.8, 43.6, z * 0.5], [12.2, 44.8, z * 2.6], [12.0, 43.4, z * 2.2]], { closed: true, bev: 0.3, tw: 0, r: 0.2 }); }
  const tail = P.add(body, (m) => rotAbout(m, -10.6, 23.4, 0, AX, Math.sin(S.t * 2.1) * 0.45));
  pen.setPart(tail);
  pen.wire([[-10.6, 23.4, 0], [-12.2, 21.6, 0], [-12.8, 15.0, 0]], { bev: 0.8, tw: 1, r: 0.24 }).wire(spring([-12.8, 15.0, 0], [-12.8, 12.0, 0], 0.3, 0.9, 3.5, 6), { bev: 0, tw: 0, r: 0.16 });
  pen.setPart(root);
  return S;
}

// An elephant 26 m at the back: two side outlines tied by three rib hoops, four column legs with knee and foot
// rings and toenail loops, a head that nods, a ringed trunk of three sprung lengths that swings and lifts in salute
// (S.salute 0..1), two tusks, two great ear loops that flap, a scalloped saddle cloth hung with cap bells, a tail.
function drawElephant(pen, P, root, rng) {
  const S = { t: 0, salute: 0, sway: 1, walk: 0, go: 0 }, ZB = 4.6;
  const body = P.add(root, (m) => { rotAbout(m, 0, 0, 0, AX, Math.sin(S.t * 0.55) * 0.022 * S.sway * (1 - S.go) + Math.sin(S.walk) * 0.02 * S.go); });
  pen.setPart(body);
  for (const z of [-ZB, ZB]) {
    pen.wire([[-12.5, 20, z], [-11, 24.6, z * 0.9], [-4, 26.6, z * 0.8], [5, 26.2, z * 0.8], [11, 24, z * 0.9], [12.6, 19, z], [11.5, 12.6, z], [0, 11, z], [-10.5, 12.6, z]], { closed: true, bev: 1.2, r: 0.46 });
    // saddle cloth: a scalloped edge with a cap bell at every low point
    const sc = []; for (let i = 0; i <= 8; i++) sc.push([-6 + i * 1.5, i & 1 ? 18.4 : 20.6, z * 1.06]);
    pen.wire(sc, { bev: 0.2, tw: 3, r: 0.22 });
    pen.wire([[-6, 20.6, z * 1.06], [-6, 25.4, z * 0.86]], { tw: 0, r: 0.2 }).wire([[6, 20.6, z * 1.06], [6, 25.2, z * 0.86]], { tw: 0, r: 0.2 });
    for (let i = 1; i < 8; i += 2) pen.top([-6 + i * 1.5, 17.6, z * 1.1], [0, 0, 1], 0.8);
  }
  for (const x of [-6, 6]) pen.wire(ring([x, 18.9, 0], ZB + 0.25, 12, 'zy', 0.26, 7.5), { closed: true, bev: 0, tw: 1, r: 0.2 });
  pen.wire([[-12.4, 21.5, 0], [-10.6, 25.4, 0], [-4, 27.3, 0], [5, 26.9, 0], [11.4, 25.2, 0]], { bev: 1.2, tw: 3, r: 0.4 });                          // the line of the back
  pen.wire([[-6, 26.3, -3.4], [-6, 27.0, 0], [-6, 26.3, 3.4]], { bev: 1, tw: 3, r: 0.22 }).wire([[6, 26.0, -3.4], [6, 26.7, 0], [6, 26.0, 3.4]], { bev: 1, tw: 3, r: 0.22 });
  let li = 0;
  for (const x of [8.4, -8.6]) for (const z of [-3.5, 3.5]) {
    const ph = li * 1.57, wp = (li === 0 || li === 3) ? 0 : Math.PI, fore = x > 0; li++;
    const leg = P.add(body, (m) => rotAbout(m, x, 13.5, 0, AZ, Math.sin(S.walk + wp) * 0.2 * S.go + Math.sin(S.t * 0.55 + ph) * 0.045 * S.sway * (1 - S.go)));
    pen.setPart(leg);
    for (const dx of [-2.1, 2.1]) pen.wire([[x + dx, 13.4, z], [x + dx * 0.92, 7, z], [x + dx * 1.05, 0.5, z]], { bev: 0, tw: 1, r: 0.32 });
    pen.wire(ring([x, 0.5, z], 2.3, 9, 'xz'), { closed: true, bev: 0, tw: 0, r: 0.3 }).wire(ring([x, 7, z], 2.0, 8, 'xz', 0.3), { closed: true, bev: 0, tw: 0, r: 0.22 });
    for (const a of [-0.6, 0, 0.6]) pen.wire(arc([x + Math.cos(a) * 2.35, 0.4, z + Math.sin(a) * 2.35], 0.62, 0, Math.PI, 4, fore ? 'zy' : 'zy'), { bev: 0, tw: 0, r: 0.16 });   // toenails
  }
  const head = P.add(body, (m) => rotAbout(m, 12, 21, 0, AZ, Math.sin(S.t * 0.7) * 0.035 + 0.16 * S.salute));
  pen.setPart(head);
  for (const z of [-2.3, 2.3]) pen.wire([[11, 25.6, z], [15, 27.6, z * 0.9], [19.5, 25.6, z * 0.7], [21, 21, z * 0.6], [19.6, 16.6, z * 0.7], [15.5, 14.6, z], [12, 16, z]], { closed: true, bev: 0.9, r: 0.42 });
  for (const [x, y, k] of [[15, 27.6, 0.9], [21, 21, 0.6], [15.5, 14.6, 1]]) pen.wire([[x, y, -2.3 * k], [x, y, 2.3 * k]], { tw: 3, r: 0.24 });
  for (const z of [-1, 1]) pen.wire(ring([18.4, 23.2, z * 1.9], 0.7, 6, 'xy'), { closed: true, bev: 0, tw: 0, r: 0.2 });
  pen.top([21.2, 24.2, 0], [1, 0.2, 0], 1.3);                                                                     // a cap on the brow
  for (const z of [-1, 1]) pen.wire([[18.6, 16.8, z * 2.5], [22.6, 14.4, z * 3.5], [25.6, 15.6, z * 3.4], [27.0, 18.2, z * 3.0]], { bev: 1.4, tw: 1, hook: 2, hookR: 0.5, r: 0.36 });   // tusks
  // the trunk: three lengths of coil, each hinged on the last
  const tr = [[20.6, 18.2], [22.6, 11.6], [22.9, 5.6], [24.8, 1.6]], tw = [2.0, 1.5, 1.05, 0.7], lift = [2.35, 0.6, 0.8];
  let parent = head;
  for (let k = 0; k < 3; k++) {
    const a = tr[k], b = tr[k + 1], seg = P.add(parent, (m) => rotAbout(m, a[0], a[1], 0, AZ, lift[k] * S.salute + Math.sin(S.t * 0.9 - k * 0.8) * (0.07 + 0.05 * k) * (1 - 0.6 * S.salute) + (k === 2 ? 0.25 * Math.sin(S.t * 2.3) * S.salute : 0)));
    pen.setPart(seg);
    pen.wire(spring([a[0], a[1], 0], [b[0], b[1], 0], tw[k], tw[k + 1], 2.4, 8, k * 1.3), { bev: 0, tw: 0, r: 0.2 });
    for (const z of [-1, 1]) pen.wire([[a[0], a[1], z * tw[k] * 0.9], [b[0], b[1], z * tw[k + 1] * 0.9]], { tw: 0, r: 0.34, hook: k === 2 ? 2 : 0, hookR: 0.5 });
    parent = seg;
  }
  for (const z of [-1, 1]) {
    // the ear lies back along the neck (so that it is a great loop in the side view) and fans out and back
    const ear = P.add(head, (m) => rotAbout(m, 14.6, 21, z * 3.0, AY, z * (0.16 + 0.34 * (0.5 + 0.5 * Math.sin(S.t * 1.25 + (z > 0 ? 0 : 0.5))) + 0.3 * S.salute)));
    pen.setPart(ear);
    pen.wire([[14.6, 27.2, z * 3.0], [9.4, 30.6, z * 3.6], [4.2, 27.0, z * 4.0], [3.6, 20.0, z * 4.0], [8.0, 14.4, z * 3.6], [14.6, 15.6, z * 3.0]], { closed: true, bev: 2.2, r: 0.42 });
    for (const [x, y] of [[9.0, 28.6], [5.0, 23.6], [7.6, 16.6]]) pen.wire([[14.4, 21.4, z * 3.1], [x, y, z * 3.8]], { tw: 2, r: 0.2 });   // veins
    pen.wire(spring([6.4, 15.6, z * 3.8], [6.4, 13.2, z * 3.8], 0.5, 0.2, 2.5, 6), { bev: 0, tw: 0, r: 0.15 }); pen.top([6.4, 12.6, z * 3.8], [0, 0, 1], 0.8);   // an ear ring
  }
  const tail = P.add(body, (m) => rotAbout(m, -12.5, 21, 0, AX, Math.sin(S.t * 1.6) * 0.4));
  pen.setPart(tail);
  pen.wire([[-12.5, 21, 0], [-14.2, 18.4, 0], [-14.4, 10.4, 0]], { bev: 0.8, tw: 1, r: 0.26 }).wire(spring([-14.4, 10.4, 0], [-14.4, 7.4, 0], 0.3, 0.9, 3.5, 6), { bev: 0, tw: 0, r: 0.16 });
  pen.setPart(root);
  return S;
}

// A ladder lying in its own xy plane (x across, y up its length): two rails with hooked tops, bound rungs
function drawLadder(pen, part, len, wid, nr) {
  pen.setPart(part);
  for (const s of [-1, 1]) pen.wire([[s * wid * 0.56, 0, 0], [s * wid * 0.5, len * 0.5, 0], [s * wid * 0.46, len, 0]], { bev: 0, tw: 0, hook: 2, hookR: 0.9, r: 0.34 });
  for (let k = 0; k < nr; k++) { const f = (k + 0.7) / (nr + 0.4), w = wid * (0.555 - 0.09 * f) + 0.5, y = f * len + (k % 3 === 1 ? 0.5 : 0);
    pen.wire([[-w, y, 0], [w, y - (k % 4 === 2 ? 0.7 : 0), 0]], { tw: 3 }); }
}

// ================================================================ buildHero
const sstep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const _gq = {};
function setPlace(m, x, y, z, dx, dz, s = 1) {
  m.makeRotationY(Math.atan2(-dz, dx)); if (s !== 1) m.scale(_v2.set(s, s, s)); m.setPosition(x, y, z); return m;
}
const peckCurve = (x) => { x -= Math.floor(x); return sstep(0.08, 0.16, x) * (1 - sstep(0.5, 0.6, x)) * (0.84 + 0.16 * Math.sin(x * 57)); };

export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng.fork ? ctx.rng.fork('galimoto') : ctx.rng;
  const detail = ctx.quality?.detail ?? 1, dens = opts.density ?? 1;
  const pal = (opts.palette && opts.palette.length >= 7 ? opts.palette : PALETTE).map((h) => new THREE.Color(h));
  const sun = new THREE.Vector3().fromArray(opts.sun ?? [-0.93, 0.26, -0.25]);
  if (sun.x > -0.05) sun.x = -0.05; if (sun.y < 0.05) sun.y = 0.05; sun.normalize();
  const blades = opts.blades ?? (rng.chance(0.5) ? 8 : 6);
  const flyer = opts.flyer ?? (rng.chance(0.65) ? 'helicopter' : 'aeroplane');
  const birds = opts.birds ?? (rng.chance(0.7) ? 'hens' : 'guinea');

  const partData = new Float32Array(MAXPARTS * 16);
  const partTex = new THREE.DataTexture(partData, 4, MAXPARTS, THREE.RGBAFormat, THREE.FloatType);
  partTex.minFilter = partTex.magFilter = THREE.NearestFilter; partTex.generateMipmaps = false; partTex.needsUpdate = true;
  const U = {
    uParts: { value: partTex }, uVH: { value: 450 }, uSun: { value: sun }, uWallX: { value: WALL_X }, uWallH: { value: WALL_H },
    uEarth: { value: pal[0] }, uMark: { value: pal[1] }, uWall: { value: pal[2] }, uWire: { value: pal[4] }, uGlint: { value: pal[5] }, uInk: { value: pal[6] },
    uWall2: { value: opts.wallTint ? new THREE.Color(opts.wallTint) : pal[2].clone().lerp(pal[6], 0.085) },
    uSkirt: { value: opts.earthTint ? new THREE.Color(opts.earthTint) : pal[0].clone() },
    uSeed: { value: rng.range(0, 40) }, uDens: { value: dens }, uGate: { value: new THREE.Vector3(GATE.z, GATE.half, GATE.h) }, uPatch: { value: new THREE.Vector4(552 + (rng.range(96, 132) - 96) * 0.5, rng.range(36, 46), rng.range(9, 13), rng.range(6, 9)) },
  };
  const mats = makeMaterials(U);
  const bases = { twist: twistBase(), top: topBase(), disc: null };
  { const g = new THREE.CircleGeometry(1, 14); g.rotateX(-Math.PI / 2); g.setAttribute('aFace', new THREE.Float32BufferAttribute(new Float32Array(g.getAttribute('position').count).fill(1), 1)); bases.disc = g; }
  const _size = new THREE.Vector2();
  const onBefore = (renderer) => { const rt = renderer.getRenderTarget(); U.uVH.value = rt ? rt.height : renderer.getDrawingBufferSize(_size).y; };
  await ctx.yield();

  const P = makeParts(), town = makeSink(), busSink = makeSink();
  const pen = makePen(town), bpen = makePen(busSink);
  const drivers = [];                         // (t, dt, u) => void, run before the part matrices
  const fixed = (x, z, dx, dz, y = 0, s = 1) => { const p = P.add(null, null); setPlace(p.local, x, y, z, dx, dz, s); return p; };
  const po = {}, po2 = {};
  const offPath = (s, side, out = {}) => { pathAt(s, po); out.x = po.x - Math.sin(po.heading) * side; out.z = po.z + Math.cos(po.heading) * side; out.heading = po.heading; return out; };   // side > 0 = right
  const anchors = {};
  // EVENTS OF THE YARD. Nothing the two giants do is set going by a share of the flight, a clock or a count of metres
  // flown. An event is one of two kinds (a third, the eye level with a named thing of the yard, is not needed here):
  //   (a) the eye comes within a distance of an animal's stand, the distance being a WHOLE NUMBER OF HALVES of that
  //       animal's FRAME DISTANCE: the distance at which the animal, as it is built and scaled, is exactly as tall as
  //       the frame (its height over 2 tan 31 degrees: the world's frame is 62 degrees high). At n halves the animal
  //       at its stand is 2/n of the frame's height;
  //   (b) the eye draws LEVEL with a stand (the rut's nearest point to it).
  // Between two events a motion runs with the eye's own progress between them, eased at both ends: between().
  // eyeS(u) is how far the eye has come along the rut, in metres. reach(x, z, D) is the arc length at which the eye,
  // coming down the rut, is first within D metres of (x, z) (eyes at every half metre of the rut); level(x, z) the arc
  // length of the rut's nearest point to it. EV, the events, is filled in further down, once both animals are drawn
  // and measured (THE TWO GIANTS); everything that reads it runs later, in update().
  const eyeS = (u) => Math.min(1, Math.max(0, u || 0)) * PATH.length;
  const reach = (x, z, D) => { let pd = 1e9; for (let s = 0; s <= PATH.length; s += 0.5) { pathAt(s, po2); const d = Math.hypot(po2.x - x, po2.z - z);
    if (d <= D) return s > 0 ? s - 0.5 * (D - d) / Math.max(pd - d, 1e-6) : 0; pd = d; } return PATH.length; };
  const level = (x, z) => pathNearest(x, z, {}).s;
  const between = (a, b, s) => b > a ? sstep(a, b, s) : (s >= b ? 1 : 0);
  const frameDistance = (tall) => tall / (2 * Math.tan(31 * D2R));
  // how tall a toy stands as it is drawn: the top of its wire (centre line plus radius) among a sink's lines from l0 on
  const topOf = (sink, l0) => { let y = 0; for (let i = l0; i < sink.lines.length; i++) { const w = sink.lines[i]; for (const q of w.pts) y = Math.max(y, q[1] + w.r); } return y; };
  // where each giant stands
  const GIR = [53, 195], ELE = [65, 273], EV = {};

  // ---- the bus we ride (its own sink and group: `carried`)
  const busRoot = P.add(null, null);
  // THE ROD AND THE HAND THAT HOLDS IT (the design: a 62 m rod, its handle 4 m ahead of the eye and 5 m under it; the
  // site: 60 m, 5 m and 6.5 m). What decides each number here:
  //   HAND 13.5, DROP 7.2: the handle is held 13.5 m ahead of the eye and 7.2 m below it, 15.3 m from the lens and 28
  //     degrees under a level line of sight. The frame's foot is 31 degrees under it: the ring (hr, 1.05 m in radius)
  //     then stands whole just inside the foot of a level frame, its lower rim on the frame's edge (31.4 degrees),
  //     about 57 px across in a frame 450 px high. Nearer or lower (the design's and the site's places) it is under the frame.
  //   rodLen 53.25: with the handle held that much further ahead, a rod of this length keeps the bus as far ahead of
  //     the eye as the site's 60 m rod had it with its handle 5 m ahead: the bus's middle 57.6 m ahead (the site's:
  //     57.2 m), its near end 45 m. The length is taken from that, not from the design's 62 m.
  //   capR 1.8: the radius of its bottle-top wheels (the axle's height);  wx: half its wheelbase.
  const BUS = { rodLen: 53.25, hr: 1.05, capR: 1.8, wx: 12 * 0.63, HAND: 13.5, DROP: 7.2 };
  const busS = drawVehicle(bpen, P, busRoot, { len: 24, wid: 7, hgt: 10, windows: 7, hero: true, capR: BUS.capR, rodLen: BUS.rodLen, rodPitch: 0.25, rng });
  await ctx.yield();

  // ---- the big bicycle across the rut (rear wheel on the camera's right)
  {
    pathAt(153, po); const dx = Math.sin(po.heading), dz = -Math.cos(po.heading);
    const root = fixed(po.x + dx, po.z + dz, dx, dz), T = drawBicycle(pen, P, root, rng);
    drivers.push((t) => { T.t = t; });
    anchors.bicycle = [po.x, 26, po.z];
  }
  await ctx.yield();
  // ---- the windmill straddling the rut at the middle of the first curve
  {
    // it stands 85 m out on the outside of the first bend: a whole tower left of the bicycle on the opening axis,
    // and no leg of it comes nearer the eye than 60 m
    pathAt(PATH.s1 + PATH.R1 * (25 * D2R), po); const wx = po.x + Math.sin(po.heading) * 85, wz = po.z - Math.cos(po.heading) * 85;
    const root = fixed(wx, wz, -0.966, -0.259), T = drawWindmill(pen, P, root, rng, blades);
    drivers.push((t) => { T.t = t; });
    anchors.windmill = [wx, 80, wz];
  }
  await ctx.yield();
  // ---- THE STREET. Everything here is placed by where its SHADOW falls on the wall (zs, along the wall) and
  //      how far off the wall it stands (d). The sun slides a shadow kz * d along the wall and ky * d down it,
  //      so things that stand well off the wall are seen apart from their own drawing.
  const kz = sun.z / -sun.x, ky = sun.y / -sun.x;
  const street = (zs, d) => [WALL_X - d, zs + kz * d];
  // nine houses: the near ones stand far out and tall, the last three close in beside the final straight
  // (these seven are the street as far as z 435; its far end, to the portal, is built last, below. The two
  //  smallest houses stand far out on the open side of the yard, square to the sun, where their long drawings lie
  //  across the earth toward the rut; they stand so far off that even the long morning shadow of a smoke spiral
  //  does not reach the wall)
  const houseZ = [150, 244, 291, 338, 383, 420, 86, 0, 0], OUT = [[-150, 455], [-120, 610]];
  // (the fronts step in toward the wall down the street: seen from the stretch where the rut heads straight at the
  //  wall, each wire front then stands in the white gap beside its own ink drawing, not on its neighbour's)
  const houseD = [42, 46, 31, 19, 14.5, 13.5, 30, 12.5, 12.5], houseH = [44, 50, 42, 47, 42, 38, 34, 30, 34];
  const kinds = rng.shuffle([0, 0, 0, 1, 1, 2, 2, 3, 3]);
  for (let i = 0; i < 9; i++) {
    const d = houseD[i] + rng.range(-1.5, 1.5) * (i < 3 ? 1 : 0.5), h = houseH[i] + rng.range(-3, 3), w = rng.range(19, i > 5 ? 24 : 28);
    const zj = rng.range(-3, 3), [x, z] = i < 7 ? street(houseZ[i] + zj * (i > 4 ? 0.5 : 1), d) : [OUT[i - 7][0] + zj, OUT[i - 7][1] + zj * 2];
    const root = i < 7 ? fixed(x, z, 0, 1) : fixed(x, z, 0.26, 0.966), T = drawHouse(pen, P, root, rng, w, h, kinds[i]);
    drivers.push((t) => { T.t = t; });
    await ctx.yield();
  }
  // ---- the power line: four poles and three long swags over the roofs, with wire birds sitting on them
  {
    const poles = [[124, 24, 57], [222, 23, 61], [314, 22, 60], [404, 21, 59]].map(([zs, d, h]) => { const [x, z] = street(zs, d); const top = drawPole(pen, fixed(x, z, 0, 1), h + rng.range(-1.5, 1.5), rng); return [x, top[1], z + top[0]]; });
    for (let i = 0; i < 3; i++) for (let k = 0; k < 2; k++) {
      const A = poles[i], B = poles[i + 1], dy = k ? -6.3 : -0.3, a = [A[0], A[1] + dy, A[2]], b = [B[0], B[1] + dy, B[2]];
      const ax = new THREE.Vector3(b[0] - a[0], b[1] - a[1], b[2] - a[2]).normalize(), ph = i * 1.7 + k * 0.6;
      const part = P.add(null, (m, t) => rotAbout(m, a[0], a[1], a[2], ax, Math.sin(t * 0.9 + ph) * 0.06 + Math.sin(t * 2.3 + ph * 2) * 0.02));
      const at = (f, lift = 0) => [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f - (k ? 7.5 : 9) * 4 * f * (1 - f) + lift, a[2] + (b[2] - a[2]) * f];
      const pts = []; for (let j = 0; j <= 16; j++) pts.push(at(j / 16));
      pen.setPart(part).wire(pts, { bev: 0, tw: 0, r: 0.24 });
      if (k === 0) for (const f of [0.42, 0.62, 0.3, 0.74].slice(0, Math.round((i === 1 ? 3 : 2) * dens))) {           // a bird on the wire: one outline, facing along the line
        const c = at(f + rng.range(-0.03, 0.03), 0.2), s = rng.chance(0.5) ? 1 : -1, o = [[-2.6, 1.3], [-1.0, 1.9], [0.5, 1.7], [1.2, 2.7], [2.2, 2.9], [3.0, 2.4], [2.2, 2.2], [1.7, 1.0], [0.4, 0.1], [-1.0, 0.3], [-3.6, 0.2]];
        pen.wire(o.map((q) => [c[0], c[1] + q[1], c[2] + q[0] * s]), { closed: true, bev: 0.3, tw: 0, r: 0.22 });
      }
    }
  }
  await ctx.yield();
  // ---- wire trees: two tall ones in the street, one on the open side beyond the portal
  for (const [zs, d, h] of [[192, 40, rng.range(56, 62)], [267, 34, rng.range(52, 58)]]) {
    const [x, z] = street(zs, d), a = rng.range(0, 6.28), root = fixed(x, z, Math.cos(a), Math.sin(a)), T = drawTree(pen, P, root, rng, h, 0.58, 0.72);
    drivers.push((t) => { T.t = t; });
    await ctx.yield();
  }
  // (it stands beyond the portal's plane, well to the right: nearer, its crown would be drawn on the wall over our bus)
  { const a = rng.range(0, 6.28), root = fixed(62, 660, Math.cos(a), Math.sin(a)), T = drawTree(pen, P, root, rng, rng.range(36, 44), 0.5, 1); drivers.push((t) => { T.t = t; }); }
  // ---- a second bicycle wheel stands on a prop beside the entry, out of sight behind the eye, square to the sun: its
  //      rim and crossed spokes lie across the first foreground as one long, slowly turning line shadow
  { const R = 16, hs = Math.hypot(sun.x, sun.z), cx = -150 + (sun.x / sun.y) * (R + 2), cz = 76 + (sun.z / sun.y) * (R + 2);
    const root = fixed(cx, cz, -sun.z / hs, sun.x / hs), spin = P.add(root, (m, t) => rotAbout(m, 0, R + 2, 0, AZ, t * 0.22));
    pen.setPart(root).wire([[0, R + 2, -1.2], [-9, 0, -7], [-11, 0, -7]], { tw: 1, hook: 2, hookR: 0.6, r: 0.4 }).wire([[0, R + 2, -1.2], [9, 0, -7], [11, 0, -7]], { tw: 1, hook: 2, hookR: 0.6, r: 0.4 });
    pen.setPart(spin); pen.wire(ring([0, R + 2, 0], R, 44, 'xy'), { closed: true, bev: 0, r: 0.5 }).wire(ring([0, R + 2, 0], 1.8, 8, 'xy'), { closed: true, bev: 0, r: 0.4 });
    for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2, b = a + (i & 1 ? 0.5 : -0.5); pen.wire([[Math.cos(a) * 1.8, R + 2 + Math.sin(a) * 1.8, 0], [Math.cos(b) * R, R + 2 + Math.sin(b) * R, 0]], { tw: 0, r: 0.42 }); } }
  // ---- a whirligig on a pole: its turning shadow stands over the roofs
  { const [x, z] = street(361, 25), T = drawWhirl(pen, P, fixed(x, z, 0, 1), rng, 56, 10.5); drivers.push((t) => { T.t = t; }); }
  await ctx.yield();
  // ---- buses and cars circling on their rods
  // (a ring's rod trails behind its car and sweeps outside the ring: each is placed so that the handle stays 12 m or more from the rut)
  // (a bus turns north of the bends, two cars on the open ground outside the left-hand bend, and a bus and two cars
  //  keep to the open side of the street, where their long shadows reach toward the rut)
  const ringAt = (s, off, rc, car) => { const q = offPath(s, off, {}); return [q.x, q.z, rc, car]; };
  const rings = [[112, 106, 15, 0], [-98, 214, 13, 1], [-92, 318, 16, 1], ringAt(PATH.sF + 44, 134, 19, 0), ringAt(PATH.sF + 142, 116, 14, 1), [-8, 612, 13, 1]];
  for (const [cx0, cz0, rc, car] of rings) {
    const cx = cx0 + rng.range(-2, 2), cz = cz0 + rng.range(-2, 2);
    const root = P.add(null, null), dirn = rng.chance(0.5) ? 1 : -1, v = rng.range(3.2, 5.2), th0 = rng.range(0, 6.28), sc = car ? rng.range(0.8, 1.0) : rng.range(0.8, 0.92);
    const S = drawVehicle(pen, P, root, car
      ? { len: 15, wid: 6.4, hgt: 7.4, windows: 2, car: true, rodLen: rng.range(22, 30), rodPitch: rng.range(0.45, 0.62), rng }
      : { len: 24, wid: 7, hgt: 10, windows: 6, rodLen: rng.range(30, 38), rodPitch: rng.range(0.4, 0.5), rng });
    drivers.push((t) => {
      const th = th0 + dirn * (v / rc) * t, c = Math.cos(th), s = Math.sin(th);
      setPlace(root.local, cx + c * rc, 0, cz + s * rc, -s * dirn, c * dirn, sc);
      S.roll = (v * t) / (1.5 * sc); S.steer = dirn * 0.22; S.t = t; S.jig = 0.6;
    });
    await ctx.yield();
  }
  await ctx.yield();
  // ---- seven hens (or guinea fowl), pecking in turn. Three stand in a line inside the left-hand bend, broadside
  //      to the rut, well apart and 37 m in from it (nearer, the frame's foot would cut them), so that each is one
  //      clear outline against the far wall as we swing round them;
  //      four more scratch about on the open side, where the first bend ends.
  {
    anchors.hens = [66, 7, 197];
    const spots = [[64, 168, 2.2, 'abs'], [84, 186, -0.95, 'abs'], [62, 226, 2.3, 'abs'], [88, 52, 1], [104, 61, 0], [121, 50, 1], [136, 63, 0]];
    for (let i = 0; i < 7; i++) {
      const sp = spots[i], q = offPath(sp[0] + rng.range(-3, 3), sp[1] + rng.range(-2, 2), {}), abs = sp[3] === 'abs';
      const x = abs ? sp[0] : q.x, z = abs ? sp[1] : q.z, hd = (abs ? sp[2] : q.heading + (sp[2] ? Math.PI : 0)) + rng.range(-0.22, 0.22), root = P.add(null, null), sc = rng.range(0.94, 1.1) * (abs ? 1.25 : 1), ph = i / 7 + rng.range(-0.04, 0.04), rate = rng.range(0.2, 0.26);
      const T = drawHen(pen, P, root, rng, birds === 'guinea');
      drivers.push((t, dt, u) => {
        const cyc = t * rate + ph, k = Math.floor(cyc), f = cyc - k;
        const walk = (k % 5) * 0.9 + sstep(0.72, 0.98, f) * 0.9 - 2;           // a shuffle forward between pecks
        // the third hen bolts as the elephant's trunk goes up (three events of the elephant's, EV.e8 to EV.e6): it turns
        // about between the first and the second and runs 22 m in from the rut between the second and the third
        const sE = eyeS(u), run = i === 2 ? between(EV.e7, EV.e6, sE) : 0, h2 = hd + (i === 2 ? Math.PI * between(EV.e8, EV.e7, sE) : 0), mid = run * (1 - run) * 4;
        const hop = Math.abs(Math.sin(f * 25)) * 0.12 * sstep(0.72, 0.8, f) * (1 - sstep(0.9, 0.98, f)) + mid * Math.abs(Math.sin(t * 9)) * 1.1;
        setPlace(root.local, x + Math.cos(hd) * (walk - run * 22), hop, z + Math.sin(hd) * (walk - run * 22), Math.cos(h2), Math.sin(h2), sc);
        T.peck = peckCurve(cyc) * (1 - mid); T.t = t + i;
      });
      if (i & 1) await ctx.yield();
    }
  }
  await ctx.yield();
  // ---- the flyer on its pad (rises with u) and the other craft swinging on a stick
  const padQ = offPath(PATH.sF + 12, 45, {}), pad = [padQ.x, padQ.z], stickQ = offPath(PATH.sF + 62, 98, {}), stickAt = [stickQ.x, stickQ.z], SH = 52;
  anchors.heliPad = [pad[0], 6, pad[1]];
  const flyRoot = P.add(null, null), stickRoot = P.add(null, null), stickTop = P.add(stickRoot, null);
  const heliT = drawHelicopter(pen, P, flyer === 'helicopter' ? flyRoot : stickTop, rng);
  const planeT = drawPlane(pen, P, flyer === 'helicopter' ? stickTop : flyRoot, rng);
  pen.setPart(stickRoot).wire([[2.5, 0, 0], [0, 0, 0], [0.5, SH * 0.4, 0], [-0.3, SH * 0.78, 0], [0, SH, 0]], { bev: 0.6, tw: 0, hook: 1, hookR: 0.7 });
  pen.wire(spring([0, SH - 2.5, 0], [0, SH + 0.5, 0], 1.0, 1.0, 3, 7), { bev: 0, tw: 0 });
  // the craft on the stick is seen side-on from the wall; the aeroplane banks so that its wings are in its shadow too
  if (flyer === 'helicopter') stickTop.local.makeRotationX(-0.95).setPosition(0, SH - 1.5, 0); else stickTop.local.makeTranslation(0, SH - 0.2, 0);
  const fly = { u: 0, rot: 0 };
  drivers.push((t, dt, u) => {
    // it stands on the open side of the street, spins up as we turn in toward the wall, lifts straight up as we swing
    // back, then crosses high over the rut far ahead of the eye and runs down the street between the rut and the wall,
    // a little above the wall's top: whole in the upper quarter of the frame, its shadow on the whitewash just below it
    const spin = sstep(0.50, 0.58, u), rise = sstep(0.60, 0.72, u), go = sstep(0.59, 0.70, u), cross = sstep(0.63, 0.73, u);
    fly.rot += dt * (1.2 + 17 * spin);
    pathAt(Math.min(1, Math.max(0, u)) * PATH.length, po2); const ex = po2.x, ez = po2.z;
    const lead = Math.min(ez + 114, 676), z = pad[1] + (lead - pad[1]) * go;
    pathAt(PATH.sF, po2); const rutX = Math.min(PATH.end[0], po2.x + Math.max(0, z - po2.z) / Math.tan(AF));
    const x = pad[0] + (Math.min(144, rutX + 16) - pad[0]) * cross + Math.sin(t * 0.5) * 1.5 * rise;
    // never so high for its distance that the top of the frame cuts it
    const y = Math.min((62 - 17 * sstep(0.755, 0.82, u)) * rise, 4 + 0.52 * Math.hypot(x - ex, z - ez)) + Math.sin(t * 1.1) * 0.6 * rise;
    setPlace(flyRoot.local, x, y, z, 0.3, 0.954);
    _m2.makeRotationZ(flyer === 'helicopter' ? -0.12 * Math.sin(rise * Math.PI) : 0.3 * Math.sin(rise * Math.PI)); flyRoot.local.multiply(_m2);
    const fT = flyer === 'helicopter' ? heliT : planeT, sT = flyer === 'helicopter' ? planeT : heliT;
    fT.rot = fly.rot; sT.rot = t * 9; fT.t = sT.t = t;
    rotAbout(stickRoot.local, 0, 0, 0, AX, Math.sin(t * 0.8) * 0.045); _m2.makeRotationY(-1.5708 + Math.sin(t * 0.33) * 0.4); stickRoot.local.multiply(_m2);
    stickRoot.local.setPosition(stickAt[0], 0, stickAt[1]);
  });
  await ctx.yield();
  // ---- ox cart, radio, the maker's pliers and coil, a parked car, the guinea fowl on its string
  { const c = offPath(PATH.sF + 105, 100, {}); const T = drawCart(pen, P, fixed(c.x, c.z, 0.26, -0.966), rng); drivers.push((t) => { T.t = t; }); }
  { const c = offPath(96, -62, {}); const T = drawRadio(pen, P, fixed(c.x, c.z, 0.5, 0.866), rng); drivers.push((t) => { T.t = t; }); }
  { const c = offPath(44, 26, {}); drawPliers(pen, fixed(c.x, c.z, 0.8, 0.6, 0, 0.9), rng); }
  { const c = offPath(120, -42, {}); const root = fixed(c.x, c.z, 0.94, -0.34);
    drawVehicle(pen, P, root, { len: 15, wid: 6.4, hgt: 7.4, windows: 2, car: true, rodLen: 26, rodPitch: 0.02, rng }); }
  {
    const c = offPath(70, -31, {}), root = P.add(null, null), T = drawHen(pen, P, root, rng, birds !== 'guinea');
    pen.setPart(root).top([-1.5, 1.2, -2.4], [0, 0, 1], 1.2).top([-1.5, 1.2, 2.4], [0, 0, 1], 1.2).top([1.8, 1.2, -2.4], [0, 0, 1], 1.2).top([1.8, 1.2, 2.4], [0, 0, 1], 1.2);
    pen.wire([[-3, 1.2, -2.4], [3.2, 1.2, -2.4], [3.2, 1.2, 2.4], [-3, 1.2, 2.4]], { closed: true, bev: 0.4 });
    pen.wire([[3.2, 1.2, 0], [12, 0.3, 1.5], [19, 0.3, -1], [24, 0.3, 0.6]], { bev: 1.2, tw: 1, r: 0.18 }).wire(ring([25.2, 0.3, 0.6], 1.2, 8, 'xz'), { closed: true, bev: 0, r: 0.18 });
    drivers.push((t) => { const w = Math.sin(t * 0.5) * 1.2; setPlace(root.local, c.x - 0.03 * w, 1.1, c.z - w, 0.03, -1); T.peck = 0.25 + 0.25 * Math.sin(t * 2.4); T.t = t; });
  }
  await ctx.yield();
  // ---- the chameleon on the wall top
  { const T = drawChameleon(pen, P, fixed(WALL_X + 3, 322, 0, 1, WALL_H), rng); drivers.push((t) => { T.t = t; }); }
  // ---- three hoops: one bowling back and forth beside the rut, one leaning on the wall, and the
  //      big one that rolls in from the right and stands round the portal
  const PORTAL = [PATH.end[0], 20, PATH.end[1]], HOOP_R = 20;
  {
    const a = offPath(PATH.sF + 34, 46, {}), b = offPath(PATH.sF + 150, 46, {}), len = Math.hypot(b.x - a.x, b.z - a.z), dx = (b.x - a.x) / len, dz = (b.z - a.z) / len, R = 7;
    const root = P.add(null, null), spinP = P.add(root, null); drawHoop(pen, spinP, R, 30);
    drivers.push((t) => { const f = 0.5 - 0.5 * Math.cos(t * 0.11 + 1.2), d = f * len; setPlace(root.local, a.x + dx * d, 0, a.z + dz * d, dx, dz);
      _m2.makeRotationX(Math.sin(t * 1.7) * 0.07); root.local.multiply(_m2); rotAbout(spinP.local, 0, R, 0, AZ, -d / R); });
    const lean = P.add(null, null); setPlace(lean.local, WALL_X - 5, 0, 207, 0, 1); _m2.makeRotationX(-0.27); lean.local.multiply(_m2); drawHoop(pen, lean, 8.5, 30);
    const big = P.add(null, null), bigSpin = P.add(big, null); drawHoop(pen, bigSpin, HOOP_R, 80, 0.56);
    pen.wire(ring([0, HOOP_R, 0], HOOP_R - 2.3, 64, 'xy', 0.05), { closed: true, bev: 0, tw: 0, r: 0.3 });
    for (let k = 0; k < 12; k++) { const a = 0.9 + k / 12 * 6.2832, c = Math.cos(a), sn = Math.sin(a); pen.wire(spring([c * (HOOP_R - 2.6), HOOP_R + sn * (HOOP_R - 2.6), 0], [c * (HOOP_R + 0.4), HOOP_R + sn * (HOOP_R + 0.4), 0], 0.55, 0.55, 3, 6, k), { bev: 0, tw: 0, r: 0.15 }); }      // heavy wire: it is drawn with the weight of the toys beside it
    drivers.push((t, dt, u) => {
      const k = sstep(0.67, 0.885, u), x = 80 + (PORTAL[0] - 80) * k, settle = Math.exp(-Math.max(0, u - 0.885) * 34) * sstep(0.80, 0.885, u);
      big.local.makeRotationY(Math.sin(t * 2.3) * 0.20 * settle + (1 - k) * 0.12); _m2.makeRotationX(Math.sin(t * 2.3 + 1.4) * 0.07 * settle); big.local.multiply(_m2);
      big.local.setPosition(x, 0, PORTAL[2]); rotAbout(bigSpin.local, 0, HOOP_R, 0, AZ, -(x - PORTAL[0]) / HOOP_R);
    });
  }
  await ctx.yield();
  // ================================================================ THE PARADE
  // ONE FILE of six rolling, walking toys on ONE lane, each placed by how far the eye has come along the rut (so the
  // file is where it is for where we are, whatever the clock says). The lane runs 45 m inside the first bend and beside the short line, then swings
  // out to 60 m and more on the open side of the street and away past the portal's right. The file stands (the cow
  // grazing) until we come under the bicycle, then sets off: the last of it, a big zebu cow, keeps 90 to 64 m ahead of the
  // eye through the bend and down the short line (whole in the frame, right of the bus, clear earth round it), the
  // others ahead of it 60 m apart; where we turn in to the wall they go on, and down the street we draw level with
  // them one by one, 60 m and more off, never near the lens.
  const LANE = 45, LANE_S0 = 190, LANE_S1 = 330, GAP = 60;
  const lane = (() => { const pts = [], sig = [], q = {};
    for (let s = LANE_S0; s <= LANE_S1; s += 2.5) { offPath(s, LANE, q); pts.push([q.x, q.z]); sig.push(s); }
    const a = offPath(LANE_S1 - 10, LANE, {}), b = offPath(LANE_S1, LANE, {});
    const cv = new THREE.CatmullRomCurve3([[a.x, a.z], [b.x, b.z], [-28, 300], [-20, 345], [2, 386], [30, 420], [50, 452], [57, 490], [59, 560], [56, 625], [38, 695], [0, 765]].map((c) => new THREE.Vector3(c[0], 0, c[1])), false, 'centripetal');
    const sp = cv.getSpacedPoints(260), k0 = sp.findIndex((v) => v.distanceTo(sp[0]) > 9.9);
    for (let i = Math.max(1, k0); i < sp.length; i++) pts.push([sp[i].x, sp[i].z]);
    const n = pts.length, cum = [0]; for (let i = 1; i < n; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    for (let i = sig.length; i < n; i++) sig.push(sig[i - 1] + cum[i] - cum[i - 1]);                 // beyond the rut's side, sigma runs on as metres of lane
    const find = (arr, v) => { let lo = 0, hi = n - 1; while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (arr[mid] <= v) lo = mid; else hi = mid; } return lo; };
    return { pts, len: cum[n - 1],
      arc(sg) { const i = find(sig, sg), f = Math.min(1, Math.max(0, (sg - sig[i]) / Math.max(sig[i + 1] - sig[i], 1e-4))); return cum[i] + (cum[i + 1] - cum[i]) * f; },
      at(d, out) { d = Math.min(cum[n - 1], Math.max(0, d)); const i = find(cum, d), f = (d - cum[i]) / Math.max(cum[i + 1] - cum[i], 1e-4), p = pts[i], r = pts[i + 1]; out.x = p[0] + (r[0] - p[0]) * f; out.z = p[1] + (r[1] - p[1]) * f; return out; } }; })();
  // sigma of the last toy (the cow) by the eye's arc length s: it stands at 250 until we are under the bicycle, then
  // keeps ahead of the eye (90 m of rut through the bend, where the lane is the shorter way round, easing to 64 m down
  // the short line), and from s 344 on makes 0.72 of our speed
  const fileSig = (s) => { const lead = 90 - 34 * sstep(205, 250, s) + 8 * sstep(250, 282, s), a = 250, b = s + lead, w = 9, t = Math.min(1, Math.max(0, (s - 344) / 36));
    return w * Math.log(Math.exp((a - b) / w) + 1) + b - 0.28 * (36 * (t * t * t - 0.5 * t * t * t * t) + Math.max(0, s - 380)); };
  const qa = {}, qb = {}, lead = { x: 0, z: 0 }; let tagCow = 0;
  const filer = (i, kind, sc) => {
    const root = P.add(null, null); let S, capR = 1.5, half = 6;
    if (kind === 'lorry') { S = drawLorry(pen, P, root, rng); capR = 2.3; half = 9; }
    else if (kind === 'car') { S = drawVehicle(pen, P, root, { len: 15, wid: 6.4, hgt: 7.4, windows: 2, car: true, rodLen: rng.range(20, 22), rodPitch: rng.range(0.66, 0.74), rng }); }
    else if (kind === 'bike') { S = drawBike(pen, P, root, rng); capR = 8.5; half = 9; }
    else { S = drawBeast(pen, P, root, rng, kind === 'goat' ? 1 : 0); half = 7; }
    const ph = rng.range(0, 6.28); if (i === 0) tagCow = root.id;
    drivers.push((t, dt, u) => {
      const sE = Math.min(1, Math.max(0, u)) * PATH.length, d = lane.arc(fileSig(sE) + i * GAP), go = sstep(160, 196, sE);
      lane.at(d - half * sc, qa); lane.at(d + half * sc, qb);
      setPlace(root.local, (qa.x + qb.x) / 2, 0, (qa.z + qb.z) / 2, qb.x - qa.x, qb.z - qa.z, sc);
      // (while it waits, the cow stands broadside to the lane, grazing; it turns into the lane as it sets off)
      if (i === 0) { _m2.makeRotationY(1.1 * (1 - sstep(176, 214, sE))); root.local.multiply(_m2); }
      if (i === 0) { lead.x = (qa.x + qb.x) / 2; lead.z = (qa.z + qb.z) / 2; }
      S.roll = d / (capR * sc); S.t = t + ph; S.walk = d * 0.36 / sc + ph; S.steer = 0; S.jig = 0.8 * go;
      S.graze = (1 - go) * (0.6 + 0.4 * Math.sin(t * 0.45 + ph));                                  // the beasts graze until the file sets off
    });
  };
  { const file = [['cow', 1.4], ['goat', 1.0], ['bike', 1.0], ['lorry', 1.15], ['car', 1.3], ['cow', 1.05]];
    for (let i = 0; i < file.length; i++) { filer(i, file[i][0], file[i][1]); if (i & 1) await ctx.yield(); } }
  // ---- beasts that stand and graze where the rut heads straight at the wall, in front of the house drawings
  for (const [x, z, hd, kind, sc] of [[141, 290, 1.75, 'cow', 1.1], [139, 258, 1.4, 'goat', 0.9]]) {
    const root = fixed(x, z, Math.cos(hd), Math.sin(hd), 0, sc), S = drawBeast(pen, P, root, rng, kind === 'goat' ? 1 : 0), ph = rng.range(0, 6.28);
    drivers.push((t) => { S.t = t + ph; S.graze = 0.55 + 0.45 * Math.sin(t * 0.45 + ph); S.walk = 0.25 * Math.sin(t * 0.3 + ph); });
  }
  await ctx.yield();
  // ---- craft and whirligigs on tall sticks beside the rut: they stand above the eye as we pass, fill the sky half of
  //      the frame, and on the last stretch their drawings stand in a row on the wall
  const stickCraft = (s, off, h, kind, sc) => {
    const q = offPath(s, off, {}), ph = rng.range(0, 6.28);
    if (kind === 'whirl') { const T = drawWhirl(pen, P, fixed(q.x, q.z, -Math.sin(q.heading), Math.cos(q.heading), 0, sc), rng, h / sc, 10.5); drivers.push((t) => { T.t = t + ph; }); return; }
    const base = P.add(null, null), top = P.add(base, null), heli = kind === 'heli';
    pen.setPart(base).wire([[2.5, 0, 0], [0, 0, 0], [0.5, h * 0.4, 0], [-0.3, h * 0.78, 0], [0, h, 0]], { bev: 0.6, tw: 0, hook: 1, hookR: 0.7, r: 0.24 });
    pen.wire([[0.2, h * 0.5, 0], [-8, 0, 3], [-10, 0, 3]], { tw: 1, bev: 0.5, hook: 2, hookR: 0.5, r: 0.2 });
    pen.wire(spring([0, h - 2.5, 0], [0, h + 0.5, 0], 1.0, 1.0, 3, 7), { bev: 0, tw: 0 });
    const T = heli ? drawHelicopter(pen, P, top, rng) : drawPlane(pen, P, top, rng);
    if (heli) top.local.makeRotationZ(-0.1); else top.local.makeRotationX(0.42);
    top.local.scale(_v2.set(sc, sc, sc)).setPosition(0, h - (heli ? 0.2 : 3.4) * sc, 0);
    drivers.push((t) => { rotAbout(base.local, 0, 0, 0, AX, Math.sin(t * 0.8 + ph) * 0.04); _m2.makeRotationY(-q.heading + Math.sin(t * 0.33 + ph) * 0.55); base.local.multiply(_m2);
      base.local.setPosition(q.x, 0, q.z); T.rot = t * (heli ? 13 : 10) + ph; T.t = t; });
  };
  { const kinds = flyer === 'helicopter' ? ['plane', 'whirl', 'heli'] : ['heli', 'whirl', 'plane'];
    const spots = [[PATH.sF + 20, 92, 34, 1], [PATH.sF + 104, 128, 30, 2], [PATH.sF + 150, 90, 36, 1]];
    for (const [s, off, h, k] of spots) { stickCraft(s, off, h + rng.range(-1.5, 1.5), kinds[k], kinds[k] === 'whirl' ? 1 : 0.8); await ctx.yield(); } }
  // ---- THE LAST WALL: toys hang on nails along it and a ladder leans on it, each swinging a
  //      little, each with its ink drawing close beside it. They hang above the bus's own drawing (the lowest 8 m).
  {
    const hang = (z, y, sc, py, draw, rate = 0.6, amp = 0.035, off = 3.4) => { const root = P.add(null, null), ph = rng.range(0, 6.28), S = draw(root) || {};
      pen.setPart(root).wire([[0, py, 0], [0, py + 3.2 / sc, -(off - 0.4) / sc]], { tw: 1, hook: 2, hookR: 0.5 });                           // the nail it hangs on
      drivers.push((t) => { setPlace(root.local, WALL_X - off, y, z, 0, 1, sc); rotAbout(_m2, 0, py, 0, AZ, Math.sin(t * rate + ph) * amp); root.local.multiply(_m2);
        S.t = t; S.roll = t * 0.5 + ph; S.rot = t * 2.2 + ph; S.steer = 0.2 * Math.sin(t * 0.5 + ph); S.jig = 0; }); };
    hang(604, 7, 0.9, 27, (r) => drawBike(pen, P, r, rng), 0.6, 0.035, 7.2);
    // (the aeroplane hangs flat against the wall, seen from above: wings up and down it)
    hang(476, 12, 0.9, 21.5, (r) => { const c = P.add(r, null); c.local.makeRotationX(-Math.PI / 2).setPosition(0, 11, 7); return drawPlane(pen, P, c, rng); }, 0.8, 0.06, 3.6);
    hang(648, 18, 1.2, 8.5, (r) => drawVehicle(pen, P, r, { len: 15, wid: 6.4, hgt: 7.4, windows: 2, car: true, rodLen: 20, rodPitch: -0.5, rng }), 0.7, 0.05, 6.4);
    hang(552, 13, 1, 18, (r) => { drawHoop(pen, r, 8.5, 30); pen.wire(ring([1.5, 7, 0.8], 5.4, 22, 'xy'), { closed: true, bev: 0 }); return null; }, 0.9, 0.07);
    await ctx.yield();
    const lad = P.add(null, null); setPlace(lad.local, WALL_X - 7.2, 0, 626, 0, 1); _m2.makeRotationX(-0.1); lad.local.multiply(_m2); drawLadder(pen, lad, 40, 9, 9);
    const lad2 = P.add(null, null); setPlace(lad2.local, WALL_X - 5.5, 0, 672, 0, 1); _m2.makeRotationX(-0.085).multiply(_m1.makeRotationZ(0.05)); lad2.local.multiply(_m2); drawLadder(pen, lad2, 38, 8, 9);
  }
  await ctx.yield();
  // ================================================================ THE TWO GIANTS (the wall side of the rut, by the two bends)
  // A giraffe feeds in the crown of the first wire tree; it leaves the tree, walks to its stand beside the rut, stands
  // side-on and watches us come, turns away and goes back. An elephant stands inside the left-hand bend with its flank
  // turned to the eye wherever the eye is; it lifts its trunk as we come, lowers it, and walks off north-east. WHEN
  // each of these happens is an event of the yard (see EVENTS OF THE YARD, above): the eye within so many halves of the
  // animal's own frame distance of its stand, or level with a stand. The numbers of halves, and what the animal is
  // then (2/n of the frame's height at its stand):
  //   GIRAFFE   8 (a quarter of the frame): it leaves its tree.   5 (two fifths): it is at its stand, side-on.
  //             3 (two thirds, the last whole number the eye reaches: the rut passes 2.2 halves from the stand): it
  //             has stood and begins to turn away; LEVEL with its stand: it has turned, and goes back, and is back
  //             by the time the eye is LEVEL with the elephant's stand (all of that behind us).
  //   ELEPHANT  8 (a quarter of the frame) to 6 (a third): the trunk goes up.   5 (two fifths) to 4 (half): the trunk
  //             comes down and its legs gather.   4: it walks off, and is at the end of its way when the eye is LEVEL
  //             with its stand.   3 (two thirds: too large and too far abeam to be held whole): the gaze lets it go.
  // WHERE they go is a way through places of the yard, measured along its own length: the share of a way done is the
  // eye's eased progress between the way's two events, and no place of a way is tied to a place of the flight. A turn
  // or a gathering INSIDE a walk is measured on the animal's own way in its own strides (the ground one half turn of
  // its walk cycle covers).
  const grng = rng.fork ? rng.fork('giants') : rng, tags = { cow: tagCow };
  const way = (K) => {                                     // K: [x, z] places; at(d, o) the place d metres along it, dir(d) its heading there
    const cv = new THREE.CatmullRomCurve3(K.map((k) => new THREE.Vector3(k[0], 0, k[1])), false, 'centripetal'), N = 120, sp = cv.getSpacedPoints(N), len = cv.getLength(), qa = {}, qb = {};
    const at = (d, o) => { const f = Math.min(1, Math.max(0, d / len)) * N, i = Math.min(N - 1, Math.floor(f)), t = f - i; o.x = sp[i].x + (sp[i + 1].x - sp[i].x) * t; o.z = sp[i].z + (sp[i + 1].z - sp[i].z) * t; return o; };
    const dir = (d) => { const a = Math.min(Math.max(d, 1), Math.max(len - 1, 1)); at(a - 1, qa); at(a + 1, qb); return Math.atan2(qb.z - qa.z, qb.x - qa.x); };
    return { at, dir, len };
  };
  // the giraffe's three ways: from the tree out to its stand; one slow step while it stands; north, the way back
  const girOut = way([[105.5, 207], [80, 205], GIR]), girStep = way([GIR, [GIR[0] - 1, GIR[1] - 1]]), girBack = way([[GIR[0] - 1, GIR[1] - 1], [60, 180], [57, 148]]);
  // the elephant's: from its stand inside the bend, north-east
  const eleOff = way([ELE, [79, 246], [92, 224]]);
  const ga = {}, gb = {}, GS = 0.84, ES = 1.15;
  // (radians of its walk cycle per metre walked, and its stride: the ground half a turn of that cycle covers, 13.9 and 18.1 m)
  const GAIT_G = 0.19 / GS, GAIT_E = 0.2 / ES, STRIDE_G = Math.PI / GAIT_G, STRIDE_E = Math.PI / GAIT_E;
  const wrap = (x) => Math.atan2(Math.sin(x), Math.cos(x)), turn = (a, b, k) => a + wrap(b - a) * k;       // the short way round
  // how far along each of its three ways the giraffe is, by the eye's arc length
  const girWalk = (s) => between(EV.g8, EV.g5, s), girShift = (s) => between(EV.g5, EV.g3, s), girHome = (s) => between(EV.gLevel, EV.eLevel, s);
  const girPlace = (s, o) => { const c = girHome(s), b = girShift(s); return c > 0 ? girBack.at(c * girBack.len, o) : b > 0 ? girStep.at(b * girStep.len, o) : girOut.at(girWalk(s) * girOut.len, o); };
  const elePlace = (s, o) => eleOff.at(between(EV.e4, EV.eLevel, s) * eleOff.len, o);
  let girTall = 0, eleTall = 0;
  { const l0 = town.lines.length, root = P.add(null, null), S = drawGiraffe(pen, P, root, grng), ph = grng.range(0, 6.28); tags.giraffe = root.id;
    girTall = topOf(town, l0) * GS;
    // its facings: toward the tree it feeds in, side-on at its stand, and round to the tree again at the end of the way back
    const FACE_TREE = 0.1, FACE_SIDE = 2.75, FACE_HOME = 0.6;
    // (the line of the walk out, taken round from the tree's facing the same way at every step: the short way to the line at the walk's middle)
    const outMid = FACE_TREE + wrap(girOut.dir(girOut.len / 2) - FACE_TREE), lineOut = (d) => outMid + wrap(girOut.dir(d) - outMid);
    drivers.push((t, dt, u) => {
      const s = eyeS(u), a = girWalk(s) * girOut.len, b = girShift(s) * girStep.len, c = girHome(s) * girBack.len; girPlace(s, _gq);
      let hd = FACE_TREE + (lineOut(a) - FACE_TREE) * sstep(0, STRIDE_G, a);                    // from facing the tree to the line of its walk, over its first stride
      hd = turn(hd, FACE_SIDE, sstep(girOut.len - STRIDE_G, girOut.len, a));                   // side-on to the rut over the last stride to its stand
      hd = turn(hd, girBack.dir(c), between(EV.g3, EV.gLevel, s));                             // a turn of the body: away, to the line of the way back
      hd = turn(hd, FACE_HOME, sstep(girBack.len - STRIDE_G, girBack.len, c));                 // and round to its tree over the last stride of the way back
      setPlace(root.local, _gq.x, 0, _gq.z, Math.cos(hd), Math.sin(hd), GS);
      S.walk = (a + b + c) * GAIT_G + ph + (hd - FACE_TREE) * 2.2; S.t = t + ph; S.browse = 1 - sstep(0, STRIDE_G, a) + sstep(girBack.len - STRIDE_G, girBack.len, c);
    }); }
  await ctx.yield();
  { const l0 = town.lines.length, root = P.add(null, null), S = drawElephant(pen, P, root, grng), ph = grng.range(0, 6.28); tags.elephant = root.id;
    eleTall = topOf(town, l0) * ES;
    drivers.push((t, dt, u) => {
      const s = eyeS(u), d = between(EV.e4, EV.eLevel, s) * eleOff.len, hd = eleOff.dir(d); elePlace(s, _gq);
      // it turns on the spot to keep its flank to the eye (the side view a wire toy is made for) until it walks off; from
      // then its flank is to where the eye was at that event, and it comes round to the line of its way over its first stride
      pathAt(Math.min(s, EV.e4), po2);
      const eyeB = Math.atan2(po2.z - _gq.z, po2.x - _gq.x) + 1.35, face = turn(eyeB, hd, sstep(0, STRIDE_E, d));
      setPlace(root.local, _gq.x, 0, _gq.z, Math.cos(face), Math.sin(face), ES);
      const down = between(EV.e5, EV.e4, s);
      S.go = down * (1 - sstep(eleOff.len - STRIDE_E, eleOff.len, d)); S.walk = d * GAIT_E + ph; S.t = t + ph;
      S.salute = between(EV.e8, EV.e6, s) * (1 - down) * (0.9 + 0.1 * Math.sin(t * 1.9));
    }); }
  // THE EVENTS. Each animal's frame distance comes from its own wire as it is built and scaled (the giraffe stands
  // 39.5 m to its horn tips, frame distance 32.9 m; the elephant 34.3 m to the top of its ear loops, 28.5 m); the whole
  // numbers of halves are the ones set out above. Where each falls along the rut follows from the rut.
  { const FG = frameDistance(girTall), FE = frameDistance(eleTall);
    const within = (stand, F, halves) => reach(stand[0], stand[1], halves * F / 2);
    Object.assign(EV, { girTall, eleTall, girFrame: FG, eleFrame: FE,
      g8: within(GIR, FG, 8), g5: within(GIR, FG, 5), g3: within(GIR, FG, 3), gLevel: level(GIR[0], GIR[1]),
      e8: within(ELE, FE, 8), e7: within(ELE, FE, 7), e6: within(ELE, FE, 6), e5: within(ELE, FE, 5), e4: within(ELE, FE, 4), e3: within(ELE, FE, 3), eLevel: level(ELE[0], ELE[1]) }); }
  await ctx.yield();
  // ================================================================ THE GATE (the wall shader draws its planks in ink; this is its wire)
  // Two strap hinges with curled ends on the south post, a ring latch and a sliding bolt with a cap knob on the north
  // side, and a chameleon climbing the planks, its curled tail swinging. Gate space: x along the wall (south), y up,
  // z out from the wall.
  {
    const G = fixed(WALL_X - 0.9, GATE.z, 0, 1), W = GATE.half, y0 = 7.5, y1 = GATE.h - 7.5;
    pen.setPart(G);
    for (const y of [y0, y1]) {
      // the strap: a long flat loop along the ledge, nailed three times, ending in two curls
      pen.wire([[W + 0.6, y + 0.75, 0], [W - 9.5, y + 0.5, 0], [W - 10.6, y, 0], [W - 9.5, y - 0.5, 0], [W + 0.6, y - 0.75, 0]], { closed: true, bev: 0.3, r: 0.3 });
      for (const sg of [-1, 1]) { const c = []; for (let i = 0; i <= 12; i++) { const a = i * 0.5, r = 1.5 - i * 0.085; c.push([W - 10.6 - 1.2 + Math.cos(a) * r * 0.8 - 0.3, y + sg * (0.2 + Math.sin(a) * r), 0]); } pen.wire(c, { bev: 0, tw: 0, r: 0.24 }); }
      for (const dx of [2.2, 5.0, 7.8]) pen.top([W - dx, y, 0.25], [0, 0, 1], 0.62);
      pen.wire(spring([W + 1.3, y - 1.9, 0], [W + 1.3, y + 1.9, 0], 0.8, 0.8, 5, 7), { bev: 0, tw: 0, r: 0.22 });                      // the knuckle
      pen.wire([[W + 1.3, y - 2.8, 0], [W + 1.3, y + 2.8, 0]], { tw: 0, hook: 3, hookR: 0.4, r: 0.26 });                              // the pin
    }
    // the bolt: a bar through two staples, with a cap knob, sliding a little
    const bolt = P.add(G, (m, t) => m.makeTranslation(0.45 * Math.sin(t * 0.7), 0, 0));
    pen.setPart(G);
    for (const x of [-W + 1.6, -W + 5.4]) pen.wire([[x, 16.9, 0], [x, 18.4, 0.9], [x + 0.9, 18.4, 0.9], [x + 0.9, 16.9, 0]], { bev: 0.25, tw: 3, r: 0.22 });
    pen.wire([[-W - 2.4, 16.6, 0], [-W - 2.4, 18.2, 0.9], [-W - 1.5, 18.2, 0.9], [-W - 1.5, 16.6, 0]], { bev: 0.25, tw: 3, r: 0.22 });   // the keep on the wall
    pen.setPart(bolt).wire([[-W - 3.2, 17.6, 0.45], [-W + 7.2, 17.6, 0.45], [-W + 7.2, 19.4, 0.45]], { bev: 0.4, tw: 0, hook: 3, hookR: 0.4, r: 0.3 });
    pen.top([-W + 7.2, 19.9, 0.6], [0, 0, 1], 0.9);
    // the ring latch below it, swinging on its staple
    const ringP = P.add(G, (m, t) => rotAbout(m, -W + 3.4, 13.6, 0.4, AZ, Math.sin(t * 1.3) * 0.22));
    pen.setPart(ringP).wire(ring([-W + 3.4, 11.6, 0.4], 2.0, 14, 'xy', 1.5708), { closed: true, bev: 0, tw: 1, r: 0.3 });
    pen.setPart(G).wire([[-W + 2.9, 13.2, 0], [-W + 3.4, 14.2, 0.7], [-W + 3.9, 13.2, 0]], { bev: 0.3, tw: 3, r: 0.22 });
    // the climber: a wire lizard seen from above, one spine from snout to curled tail, a body loop, four legs that
    // reach in turn; it creeps up the planks and slips back
    const liz = P.add(G, (m, t) => { const c = t * 0.5; m.makeRotationZ(0.86 + 0.07 * Math.sin(t * 2.4)); m.setPosition(-2.6 + 1.3 * Math.sin(c), 13.4 + 1.5 * Math.sin(c), 1.6); });
    pen.setPart(liz);
    pen.wire([[9.6, 0, 0], [7.6, 1.5, 0], [5.4, 1.2, 0], [3.4, 1.9, 0], [-2.6, 1.7, 0], [-4.4, 0.6, 0], [-4.4, -0.6, 0], [-2.6, -1.7, 0], [3.4, -1.9, 0], [5.4, -1.2, 0], [7.6, -1.5, 0]], { closed: true, bev: 0.6, r: 0.32 });
    pen.wire([[7.4, 0, 0.3], [-4.4, 0, 0.3]], { tw: 0, r: 0.2 });
    for (const z of [-0.8, 0.8]) pen.top([8.0, z, 0.3], [0, 0, 1], 0.42);                                                   // eyes
    { const tl = [[-4.4, 0, 0]]; for (let i = 1; i <= 22; i++) { const f = i / 22, a = f * f * 5.6; tl.push([-4.4 - f * 7.2 + Math.sin(a) * 1.6 * f, -(1 - Math.cos(a)) * 1.5 * f - f * 1.2, 0]); }
      const tp = P.add(liz, (m, t) => rotAbout(m, -4.4, 0, 0, AZ, Math.sin(t * 2.4 + 1.5) * 0.2)); pen.setPart(tp).wire(tl, { bev: 0, tw: 1, r: 0.28 }); }
    let lk = 0;
    for (const [x, sd] of [[3.6, 1], [3.6, -1], [-2.4, 1], [-2.4, -1]]) {
      const ph = lk++ * 1.57, lg = P.add(liz, (m, t) => rotAbout(m, x, sd * 1.7, 0, AZ, sd * Math.sin(t * 2.4 + ph) * 0.3));
      pen.setPart(lg).wire([[x, sd * 1.7, 0], [x + 0.8, sd * 4.0, 0.5], [x + 2.6, sd * 5.4, 0]], { bev: 0.5, tw: 1, r: 0.28 });
      for (const da of [-0.55, 0, 0.55]) pen.wire([[x + 2.6, sd * 5.4, 0], [x + 2.6 + Math.cos(0.7 * sd + da) * 1.5, sd * 5.4 + Math.sin(0.7 * sd + da) * 1.5, 0]], { tw: 0, r: 0.18 });
    }
    tags.gate = G.id;
  }
  await ctx.yield();
  // ---- a wire bream hung on the wall before the gate, by two wires from one nail, swinging a
  // little: one outline from nose round the forked tail, a gill, a cap eye, scales, fins and a smaller fish below it
  {
    const F = fixed(WALL_X - 1.5, 504, 0, 1, 23, 0.86);
    pen.setPart(F).top([0, 13.6, -0.6], [0, 0, 1], 0.9);
    const sw = P.add(F, (m, t) => rotAbout(m, 0, 13.6, 0, AZ, Math.sin(t * 0.85) * 0.05));
    pen.setPart(sw);
    pen.wire([[-11, 0, 0], [-7, 3.7, 0], [-1, 4.7, 0], [5, 3.0, 0], [8.5, 0.9, 0], [12, 4.4, 0], [10.8, 0, 0], [12, -4.4, 0], [8.5, -0.9, 0], [5, -3.0, 0], [-1, -4.7, 0], [-7, -3.7, 0]], { closed: true, bev: 0.9, r: 0.42 });
    pen.wire([[-5.2, 3.9, 0], [0, 13.6, 0], [4.2, 3.2, 0]], { bev: 0.3, tw: 2, r: 0.2 });
    pen.wire([[-6.0, 3.0, 0], [-4.7, 0, 0], [-6.0, -3.0, 0]], { bev: 1.2, tw: 1, r: 0.26 });                                   // the gill
    pen.top([-8.2, 1.1, 0.35], [0, 0, 1], 0.85);
    pen.wire(ring([-8.2, 1.1, 0.2], 1.35, 9, 'xy'), { closed: true, bev: 0, tw: 0, r: 0.18 });
    pen.wire([[-10.4, -0.9, 0], [-8.8, -1.5, 0]], { tw: 0, r: 0.2 });                                                          // the mouth
    for (let i = 0; i < 4; i++) for (let j = -1; j <= 1; j++) {
      const x = -2.6 + i * 2.6 + (j ? 1.3 : 0), y = j * 2.0 * (1 - i * 0.12);
      pen.wire([[x, y + 1.0, 0], [x + 1.0, y, 0], [x, y - 1.0, 0]], { bev: 0.7, tw: 0, r: 0.2 });                             // scales
    }
    pen.wire([[-3.4, 4.6, 0], [-2.2, 7.0, 0], [-0.8, 5.2, 0], [0.6, 7.2, 0], [2.0, 4.9, 0], [3.2, 6.2, 0], [4.6, 3.3, 0]], { tw: 0, r: 0.24 });   // back fin
    pen.wire([[-2.4, -4.6, 0], [-0.6, -7.0, 0], [1.4, -4.3, 0]], { tw: 0, r: 0.24 });
    for (const sg of [-1, 1]) pen.wire([[9.2, sg * 0.5, 0], [11.2, sg * 2.6, 0]], { tw: 0, r: 0.18 });
    // the small one, on its own wire from the big one's belly
    const sm = P.add(sw, (m, t) => rotAbout(m, 1.4, -4.3, 0, AZ, Math.sin(t * 1.3 + 1) * 0.16));
    pen.setPart(sm);
    pen.wire([[1.4, -4.3, 0], [1.4, -9.0, 0]], { tw: 0, r: 0.16 });
    pen.wire([[-3.2, -11.2, 0], [-0.6, -9.2, 0], [2.8, -9.6, 0], [4.6, -10.8, 0], [6.4, -8.9, 0], [5.9, -11.2, 0], [6.4, -13.5, 0], [4.6, -11.6, 0], [2.8, -12.8, 0], [-0.6, -13.2, 0]], { closed: true, bev: 0.5, r: 0.3 });
    pen.top([-1.5, -10.7, 0.3], [0, 0, 1], 0.5);
    pen.wire([[-0.2, -9.8, 0], [0.5, -11.2, 0], [-0.2, -12.6, 0]], { bev: 0.6, tw: 0, r: 0.18 });
    tags.fish = F.id;
  }
  // ---- what the maker left on the swept earth beside the bends: spare wheels on their axle, loose crown caps, a
  //      second coil of offcuts with the pliers, a short ladder of rungs not yet bound
  {
    const lay = fixed(0, 0, 1, 0);
    for (const [x, z, r] of [[-4, 214, 2.0], [1, 236, 1.6], [-9, 240, 2.3], [-2, 262, 1.7], [30, 318, 2.2], [47, 330, 1.7], [36, 338, 1.9], [58, 318, 1.6]]) {
      pen.setPart(lay).top([x, 0.22, z], [grng.range(-0.05, 0.05), 1, grng.range(-0.05, 0.05)], r);
      pen.wire(ring([x, 0.3, z], r * 0.4, 7, 'xz'), { closed: true, bev: 0, tw: 0, r: 0.2 });
    }
    { const a = fixed(-6, 226, 0.45, 0.89, 0, 1.5); pen.setPart(a); axle(pen, 0, 1.55, 3.6, 1.5); }
    { const a = fixed(42, 312, 0.8, -0.6, 0, 1.7); pen.setPart(a); axle(pen, 0, 1.55, 3.6, 1.5); }
    drawPliers(pen, fixed(-10, 250, 0.3, 0.95, 0, 1.0), grng);
    drawPliers(pen, fixed(30, 334, 0.9, 0.44, 0, 1.15), grng);
  }
  await ctx.yield();
  // ================================================================ THE STREET'S FAR END (the wall from the last house front to the portal)
  // The street runs on to the portal: two more house fronts with turning smoke, two wire trees bent flat against the
  // wall (their trunks stand in the gaps between the hung things, their crowns above them) and, on the open side, a
  // big radio whose long aerial is drawn up the whitewash. The fronts and trees stand in the 12 m under the wall, so
  // the lane the bus takes along the wall's foot runs in front of them and the bus's own drawing lies among theirs;
  // nothing here stands within 19 m of the rut. All of it is dealt from its own stream, made after every other.
  const brng = rng.fork ? rng.fork('belt') : rng, belt = [];
  for (const [zs, d, w, h, prop] of [[449, 12, 22, 46, 0.3], [580, 9, 21, 44, 0.2]]) {
    const hh = h + brng.range(-2, 2), [x, z] = street(zs, d), root = fixed(x, z, 0, 1), T = drawHouse(pen, P, root, brng, w + brng.range(-1, 1.5), hh, brng.int ? brng.int(0, 2) : 0, prop);
    drivers.push((t) => { T.t = t; }); belt.push({ kind: 'house front', x, z, height: hh, drawnAtZ: zs });
    await ctx.yield();
  }
  for (const [zs, d, h] of [[490, 4, 58], [542, 4, 54]]) {
    const hh = h + brng.range(-1.5, 1.5), [x, z] = street(zs, d), root = fixed(x, z, 0, 1), T = drawFlatTree(pen, P, root, brng, hh);
    drivers.push((t) => { T.t = t; }); belt.push({ kind: 'flat wire tree', x, z, height: hh, drawnAtZ: zs });
    await ctx.yield();
  }
  { const sc = 1.5, x = 86, z = 553 + brng.range(-1.5, 1.5), T = drawRadio(pen, P, fixed(x, z, 0, -1, 0, sc), brng);        // its face to the rut, its aerial leaning north
    drivers.push((t) => { T.t = t; }); belt.push({ kind: 'radio', x, z, height: 41 * sc, drawnAtZ: z - 13.5 * sc - kz * (WALL_X - x) }); }
  await ctx.yield();
  // where the gaze should rest for the giants: the giraffe first; it passes over to the elephant between the giraffe's
  // beginning to turn away (EV.g3) and the eye's drawing level with the giraffe's stand
  const giantAt = (u, o) => { const s = eyeS(u); girPlace(s, ga); elePlace(s, gb); const k = between(EV.g3, EV.gLevel, s); o.x = ga.x + (gb.x - ga.x) * k; o.z = ga.z + (gb.z - ga.z) * k; return o; };
  // the share of the giraffe's walk from its tree to its stand that is done
  const walkOut = (u) => girWalk(eyeS(u));
  // where the cow that leads the parade stands, by u alone
  const leadAt = (u, o) => { const sE = Math.min(1, Math.max(0, u)) * PATH.length, d = lane.arc(fileSig(sE)); lane.at(d - 7 * 1.4, qa); lane.at(d + 7 * 1.4, qb); o.x = (qa.x + qb.x) / 2; o.z = (qa.z + qb.z) / 2; return o; };
  // ---- meshes
  const object = new THREE.Group(); object.name = 'galimoto-yard';
  const nTw = town.twists.length / 8, target = Math.round(560 * detail);
  const keepEvery = Math.max(1, Math.ceil(nTw / target));
  await ctx.yield();
  const townM = await sinkMeshes(town, mats, bases, onBefore, keepEvery, () => ctx.yield());
  await ctx.yield();
  const busM = await sinkMeshes(busSink, { ...mats, ribW: mats.ribWBus, tube: mats.tubeBus }, bases, onBefore, 1, () => ctx.yield(), true);
  const carried = busM.group; carried.name = 'galimoto-bus';
  object.add(townM.group, carried);
  let tris = townM.tris + busM.tris;
  if (opts.surfaces !== false) {
    const eg = new THREE.BufferGeometry();
    eg.setAttribute('position', new THREE.Float32BufferAttribute([-520, 0, -260, -520, 0, 920, 340, 0, 920, 340, 0, -260], 3));
    eg.setAttribute('normal', new THREE.Float32BufferAttribute([0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0], 3)); eg.setIndex([0, 1, 2, 0, 2, 3]);
    const earth = new THREE.Mesh(eg, mats.earth); earth.frustumCulled = false; earth.renderOrder = 0;
    const wg = new THREE.BoxGeometry(6, WALL_H, 720); wg.translate(WALL_X + 3, WALL_H / 2, 325);
    const wall = new THREE.Mesh(wg, mats.wall); wall.frustumCulled = false; wall.renderOrder = 0;
    object.add(earth, wall); tris += 14;
  }
  await ctx.yield();

  // ---- driving it
  let progress = -1;
  const camL = new THREE.Vector3(), inv = new THREE.Matrix4(), near = {}, pa = {}, pb = {};
  // The bus does not run dead straight: it weaves from side to side of the rut as the rod is twisted, and it slides:
  // its tail swings out and holds there for seconds at a time, nose toward the wall, so that we see one whole side
  // frame with its row of window loops and both bottle-top wheels as discs (a rear view of it is a cage of wire).
  const calm = (s) => 1 - 0.8 * sstep(112, 136, s) * (1 - sstep(176, 196, s)) - 0.5 * sstep(176, 196, s) * (1 - sstep(236, 262, s)) - 0.7 * sstep(PATH.s4 + 10, PATH.s4 + 50, s);   // straighter under the bicycle, between the windmill's legs and at the end
  const busLat = (s) => 5 * calm(s) * 0.6366 * Math.asin(0.97 * Math.sin(s * 0.0748 + 2.5));
  // the slide, radians, positive = nose to the left, by where the front axle is along the rut. Long holds, nose
  // toward the wall; a small one under the bicycle (12 m to the rims) and none between the windmill's legs; to the
  // right on the bend away from the wall, where the bus ahead is already turned right of the eye's line.
  const win = (a, b, c, d, s) => sstep(a, b, s) * (1 - sstep(c, d, s));
  const busYaw = (s) => 0.55 * (1 - sstep(122, 138, s)) + 0.2 * win(124, 140, 172, 190, s) + 0.42 * win(PATH.sA - 34, PATH.sA - 8, PATH.sC - 26, PATH.sC + 4, s)
    - 0.36 * win(PATH.sC - 26, PATH.sC + 4, PATH.sF + 6, PATH.sF + 36, s)
    + (0.42 - 0.66 * win(PATH.sF + 80, PATH.sF + 96, PATH.sF + 104, PATH.sF + 120, s)) * win(PATH.sF + 6, PATH.sF + 36, PATH.s4 + 30, PATH.s4 + 62, s);
  const pc = {}, pd = {}, pe = {}, busPose = { x: 0, z: 0, dx: 1, dz: 0, wx: BUS.wx, track: 5, wall: 0, narrow: 0, gone: 0, go: 1 };
  // THE LAST STRETCH: past the last house front the bus leaves the rut and runs along the foot of the wall, WALL_D from
  // it and almost parallel to it, in the lane in front of the last toys of the street (which stand close in under the
  // wall), so that the sun lays its whole side and the rod's long line on the whitewash AMONG the street's drawings.
  // `seek` is 0 in the rut, 1 at the wall, by where a point of the rut lies along the yard.
  // HOW IT LEAVES US (the design: "from u 0.90 the bus drifts right and falls behind ... it never crosses the portal
  // plane"). Its front axle steers right, off the wall's foot and over the rut, to stand to the right of the rut; it is
  // held to a stand short of the portal; held back like that, the handle is let go: it drops to the earth where it
  // was, the rod lies across the rut, and the eye flies on over it and past the bus on its right.
  // What each number is measured against (arc lengths are of the rut, short of the portal's plane at z 600):
  //   WALL_D 15.5: the lane's centre line, 15.5 m from the wall. The bus is 7 m wide and runs nose-in by 0.2 rad, so
  //     its wall side runs 11 to 16 m from the wall: outside the strip in which the street's last toys stand (the
  //     front drawn at z 449 stands 12 m out, the flat trees' forward feet 6.6 m, the front at z 580 9 m). (The site:
  //     14, with no toys there.)
  //   OUT0 62: the axle begins to turn out when it is 62 m short, at z 538: as it comes level with the south post of
  //     the gate (z 540), some 30 m before the last house front, which stands 9 m from the wall and in front of
  //     which the bus would otherwise run 2 m off.
  //   OUT1 14: the turn is complete when the axle is 14 m short: 2 m before the least it may ever be short, STOP.
  //   STOP 12, SOFT 7: the rod, laid straight along the rut, may bring the axle no nearer the portal's plane than 12 m
  //     (a smooth least-of-two with 7 m of give, the bus's own width: it slows to a stand while the eye flies about
  //     30 m). With the rod swung 24 m aside, as it is by then, the axle itself comes to rest 16.6 m short (z 583.6) and
  //     the bus's nose 13 m short: it never reaches the portal's plane nor the hoop that stands in it.
  //   OUT_LAT 22: where the axle stands, 22 m right of the rut's centre line: 2 m more than the radius of the hoop
  //     that stands across the rut round the portal (20 m), so that, seen from the rut, the front of the bus stands
  //     outside the ring through which the eye flies, under its lower right rim. The bus stands askew there (its
  //     middle 17 m right, its nearest corner 7.4 m right of the eye's line and 10 m and more below it) and the eye
  //     passes its middle 23 m short of the portal.
  const WALL_D = 15.5, seek = (z) => sstep(470, 506, z);
  const OUT0 = PATH.length - 62, OUT1 = PATH.length - 14, OUT_LAT = 22, STOP = PATH.length - 12, SOFT = 7;
  const leave = (s) => sstep(OUT0, OUT1, s);
  const latAt = (s, k, demo) => { pathAt(s, pe); if (demo) return busLat(s) * k; const w = seek(pe.z), o = leave(s);
    return (busLat(s) * k * (1 - w) - w * Math.max(0, WALL_X - WALL_D - pe.x)) * (1 - o) + OUT_LAT * o; };
  function driveBus(sCam, camY, u, time, demo, narrow) {
    // (as it swerves to the wall it loses ground: 12 m nearer to us, so that its drawing on the whitewash is seen large
    //  and less raking)
    const back = demo ? 0 : (1 - sstep(0.005, 0.07, u)) * 112 + 12 * sstep(0.74, 0.80, u), kN = 1 - 0.6 * narrow;
    const reach0 = Math.sqrt(Math.max(1, BUS.rodLen * BUS.rodLen - (camY - BUS.DROP - BUS.capR) * (camY - BUS.DROP - BUS.capR)));
    let sH = sCam + (demo ? 5 : BUS.HAND) - back;                                       // the handle, along the rut
    // the stand: however far the eye flies on, the front axle stays STOP short of the portal (a smooth least-of-two)
    const held = demo ? 0 : SOFT * Math.log(1 + Math.exp(Math.min((sH + reach0 - STOP) / SOFT, 30))), rel = sstep(3, 26, held);
    sH -= held;
    const hy = Math.max(6, camY - BUS.DROP) * (1 - rel) + 0.9 * rel + Math.sin(time * 1.7) * 0.1 * (1 - rel);
    const sp = Math.max(-0.2, Math.min(0.9, (hy - BUS.capR) / BUS.rodLen)), pitch = Math.asin(sp), Dh = BUS.rodLen * Math.cos(pitch);
    // (held, it sways a little under the eye; let go, it falls 2.5 m to the left of the rut)
    const hl = -2.5 * rel + (1 - rel) * (demo ? 0 : 0.45 * Math.sin(time * 0.83) + 0.2 * Math.sin(time * 2.1));
    let sA = sH + Dh, la = 0;                                                          // front axle: the rod's reach shortens as it swings out
    for (let k = 0; k < 2; k++) { la = latAt(sA, kN, demo) - hl; sA = sH + Math.sqrt(Math.max(Dh * Dh - la * la, Dh * Dh * 0.3)); }
    const sR = sA - 2 * BUS.wx;
    offPath(sH, hl, pa); offPath(sA, latAt(sA, kN, demo), pb); offPath(sR, latAt(sR, kN, demo), pc); offPath(sA + 5, latAt(sA + 5, kN, demo), pd);
    const gone = demo ? 0 : leave(sA), wWall = demo ? 0 : seek(pb.z) * (1 - gone); busPose.wall = wWall; busPose.narrow = narrow; busPose.gone = gone; busPose.go = 1 - sstep(4, 30, held);
    let dx = pb.x - pc.x, dz = pb.z - pc.z; const l = Math.hypot(dx, dz) || 1; dx /= l; dz /= l;
    const travel = Math.atan2(pd.z - pb.z, pd.x - pb.x);
    // the slide turns the body about its front axle (where the rod holds it); the front wheels keep to the line of travel
    const yaw = demo ? 0.3 : (busYaw(sA) * (1 - 0.7 * narrow) * (1 - wWall) * (1 - gone) + 0.2 * wWall) * sstep(0.03, 0.07, u), th = Math.atan2(dz, dx) - yaw; dx = Math.cos(th); dz = Math.sin(th);
    setPlace(busRoot.local, pb.x - dx * BUS.wx, 0, pb.z - dz * BUS.wx, dx, dz);
    busPose.x = pb.x - dx * BUS.wx; busPose.z = pb.z - dz * BUS.wx; busPose.dx = dx; busPose.dz = dz;
    let steer = travel - th; steer = Math.atan2(Math.sin(steer), Math.cos(steer));
    const bx = pa.x - pb.x, bz = pa.z - pb.z;
    busS.rodYaw = Math.atan2(-bx * dz + bz * dx, -(bx * dx + bz * dz));
    busS.steer = Math.max(-0.6, Math.min(0.6, steer)) + Math.sin(time * 3.1) * 0.02; busS.roll = sA / BUS.capR; busS.rodPitch = pitch; busS.t = time; busS.jig = busPose.go;
    // the rattle
    _m2.makeRotationX((Math.sin(time * 11.3) * 0.006 + Math.sin(time * 7.1) * 0.004) * busPose.go); busRoot.local.multiply(_m2);
  }
  function update(dt, time, camera) {
    const demo = progress < 0;
    const u = demo ? 0.52 + 0.37 * (0.5 - 0.5 * Math.cos(time * 0.2)) : progress;
    if (demo) driveBus(110 + ((time * 12) % 470), 22, 0.5, time, true, 0);
    else {
      object.updateWorldMatrix(true, false); inv.copy(object.matrixWorld).invert();
      camL.setFromMatrixPosition(camera.matrixWorld).applyMatrix4(inv);
      pathNearest(camL.x, camL.z, near);
      driveBus(near.s, camL.y, u, time, false, sstep(1.25, 0.7, camera.aspect > 0 ? camera.aspect : 1.78));
    }
    carried.visible = demo || u > 0;
    for (let i = 0; i < drivers.length; i++) drivers[i](time, dt, u);
    const L = P.list;
    for (let i = 0; i < L.length; i++) {
      const p = L[i];
      if (p.anim) p.anim(p.local, time, u);
      if (p.parent) p.world.multiplyMatrices(p.parent.world, p.local); else p.world.copy(p.local);
      partData.set(p.world.elements, i * 16);
    }
    partTex.needsUpdate = true;
  }
  // the height the eye flies at (22 m, easing to 20 over the first 40 m of the last line)
  const eyeY = (s) => s > PATH.s4 ? 22 - 2 * sstep(0, 40, s - PATH.s4) : 22;
  // WHERE THE BUS IS LET GO, by its own state: the eye's arc length at which `go` first falls below 1, that is, at which
  // the stand begins to hold the bus back and the handle begins to drop (eyes at every half metre of the rut, at the
  // rut's own height, in a wide frame)
  let busLetGo = PATH.length;
  for (let s = 0; s <= PATH.length; s += 0.5) { driveBus(s, eyeY(s), s / PATH.length, 0, false, 0); if (busPose.go < 1) { busLetGo = s; break; } }
  update(0, 0, null);

  for (let s = 0; s <= PATH.length + 0.01; s += PATH.length / 44) { pathAt(Math.min(s, PATH.length), po); (anchors.flyThrough ||= []).push([po.x, eyeY(s), po.z]); }
  Object.assign(anchors, {
    portalSeat: { position: PORTAL.slice(), facing: [0, 0, -1], hoopRadius: HOOP_R },
    entry: { position: [PATH.segs[0].x, 22, PATH.segs[0].z], heading: [Math.cos(A0), 0, Math.sin(A0)] },
    wallX: WALL_X, wallHeight: WALL_H, lane: lane.pts, townCentre: [100, 20, 330], frieze: [WALL_X, 24, 360],
    extent: { min: [-520, 0, -260], max: [340, 82, 920] }, pathLength: PATH.length,
    marks: { s1: PATH.s1, sA: PATH.sA, sB: PATH.sB, sC: PATH.sC, sD: PATH.sD, sF: PATH.sF, sG: PATH.sG, s4: PATH.s4 }, rutAngle: AF,
  });
  const cast = (v, out, wallPass) => { const k = wallPass ? (v.x - WALL_X) / sun.x : v.y / sun.y; return out.copy(v).addScaledVector(sun, -k); };
  return {
    object, radius: 34, height: 70, center: new THREE.Vector3(60, 14, 320), anchors, ground: false, groundY: 0,
    update, dispose() { partTex.dispose(); bases.twist.dispose(); bases.top.dispose(); bases.disc.dispose(); },
    setProgress(u) { progress = u; }, carried, pathAt, busLat, busPose, lead, leadAt, giantAt, walkOut, events: EV, busLetGo, belt, uniforms: U, glslCast: GL_CAST,
    castGround: (v, out = new THREE.Vector3()) => cast(v, out, false), castWall: (v, out = new THREE.Vector3()) => cast(v, out, true),
    setPalette(arr) { const c = arr.map((h) => new THREE.Color(h)); U.uEarth.value.copy(c[0]); U.uMark.value.copy(c[1]); U.uWall.value.copy(c[2]); U.uWire.value.copy(c[4]); U.uGlint.value.copy(c[5]); U.uInk.value.copy(c[6]); U.uWall2.value.copy(c[2]).lerp(c[6], 0.085); U.uSkirt.value.copy(c[0]); },
    setSun(a) { sun.fromArray(a); if (sun.x > -0.05) sun.x = -0.05; if (sun.y < 0.05) sun.y = 0.05; sun.normalize(); },
    info: { triangles: tris, parts: P.list.length, segments: town.segs + busSink.segs, twists: nTw, blades, flyer, birds },
    debugLines: opts.keepLines ? { town: town.lines, bus: busSink.lines, parts: P.list, tags, gate: U.uGate.value, wallWide: WIDE_W.x, wallFloor: WIDE_W.y, groundWide: WIDE_G.x, groundFloor: WIDE_G.y } : null,
  };
}
