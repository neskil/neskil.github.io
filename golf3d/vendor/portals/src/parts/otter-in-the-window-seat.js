// Part file of the world otter-in-the-window-seat: the seated otter, its machines, the screens and one seat row.
//
// EVERYTHING HERE IS BUILT AT 20 TIMES LIFE. One unit is one metre; a sitting river otter is about 12 m high, a cabin
// window's opening 4.6 x 6.6 m, a seat row 15.6 m from the next. Nothing in this file reads a seed or a clock of
// the wall: geometry is the same on every visit, and every motion is a function of the uniforms uTime (the world's
// clock, idle life) and uSignal (metres flown, the wave that wakes the cabin) and of per-instance attributes.
// THE LENS IS READ FOR TWO THINGS ONLY, declared in the world's head: its place (uCamL: the view direction of
// gloss and rim, the thin fog) and the angle one pixel covers (uPix, set in makeCabinLight's update from the
// camera's field of view and the drawing buffer's height), by which a whisker keeps a floor of a pixel and a half
// of width and the outside part's ribbons their floor. No body is placed, hidden or faded by the lens; the one
// vertex law it touches is that width of a whisker (the count takes it off every animal's figure).
//
// CABIN SPACE (the space of the kit's light rig, INT.makeLightRig): the window wall's inner face stands at x = 0 at
// window height and the seats run to +x; the aisle lies beyond them, then the other block of three seats and the far
// wall at x = DIM.CABIN_W; y is up from the floor; the seats face -z, row k stands with the front face of its seat
// backs at z = k * PITCH. An otter is modelled facing +z in its own space and turned by its instance yaw (PI for a
// passenger); mirror: true turns it left for right, so that the far block's tails lie on the aisle side too.
//
// What the world uses:
//   DIM                              every measure in metres, and seatAt(row, seat, side) / trayAt(row, seat, side) for places
//   POSE                             the names of the poses (LAPTOP 0 .. BELLY 8)
//   makeCabinLight(rig, o)           the uniforms every shader of this file shares (they point at the rig's own); o.outside,
//                                    o.wind and o.fog are for the otters outside; hand it only the rows whose blinds are up
//   otterGeometry(tier, species, rnd)                 'near' | 'mid' | 'far', 'river' | 'sea'; rnd: the world's generator for the coat
//   otterGeometryAsync(tier, species, pause, rnd)     the same, resting between its steps (pause: the world's ctx.yield)
//   makeOtters(L, o)                 one instanced draw (o.geometry: a geometry already built): { tier, species, list: [{ position, yaw,
//                                    pose, tap, look, look2, nod, phase, scale, tint, station, hold, lean, glow, mirror, reach, reachArm,
//                                    outside, span, plain }] }; the fields are told above makeOtters
//   makeHeadphones(L, list)          a band and two cups for the river sitters of list (their own makeOtters entries), one draw
//   makeDevices(rig, list) / makeDevicesAsync(rig, list, pause)   laptops, phones and tablets as one merged kit-lit mesh; returns
//                                    the screens to draw and the openings left for the world (the hero's glass)
//   makeScreens(L, list)             every screen in one draw, painted by one shader from (kind, station)
//   makeGlow(L, o)                   the light that falls on things, one additive draw: screens' light on their seats' backs, the
//                                    standing arcs' blue on open seats, warm pools on trays, the ceiling's blue (setPulse)
//   lampLit(row, seat, side, row0)   which reading lamps are lit (the fur shader's own rule; makeCabinLight's o.lamps turns it on)
//   seatSink(dx, y, z)               how deep a place lies inside a seat's cushion or back (the count's: no otter passes through)
//   makeSeatRows(rig, o)             the row unit instanced: seats, armrests, headrest caps, carpet to the aisle's middle, the wall
//                                    with one oval window (blind: 'up' | 'half' | 'down'), the bin over the seats and half the
//                                    ceiling; side: 1 is the far block
//   makeBulkheads(rig, list)         the partitions that close a cabin's ends: in the aisle's doorway a lit galley's mouth, the
//                                    curtain drawn back in two gathered halves
//   makeTrays(rig, list) / makeTraysAsync(rig, list, pause)   fold-down trays, down or stowed; snack: true lays a napkin and three shells
//   makeTumblers(rig, L, list)       tumblers with a drink that slops
//   seatUnitAsync(o, pause)          ONE unit's geometry, built once and shared: hand it to makeSeatRows as o.geometry for both
//                                    blocks and every group of rows (near {}, far { detail: 'far' }, bay { seats: false });
//                                    o.material shares one prop material. makeBlinds(rig, [{ row, side, blind }]) then closes
//                                    the ovals row by row ('down' | 'half')
//   makeTrays' arm: true             a front row's tray on one stalk from its window-side armrest (no seat ahead)
//   makeDress(rig, o) / makeDressAsync(rig, o, pause)   the trolley, the crew otter's seat, a plain case (o.case: { box }) and nothing
//                                    else (no blanket, nothing hung); it returns the trolley's tumblers for the world's makeTumblers
//   WAITING: a makeOtters entry takes habit 0 | 1 | 2 (see the fur shader); hand the SAME entry (habit, phase, station,
//                                    scale, mirror) to machineFor: a habit 0 phone or tablet is then drawn, shell and glass,
//                                    by makeScreens and moves with its holder's paw. makeCabinLight's glowWait / glowWaitGain:
//                                    the blue a waiting glass throws on its sitter
//   otterPoseOwn(g, entry, t, awake, out, m)   the fur shader's place law in plain numbers, for counts made in node
// EVERY make... call takes one list in one unbroken step: hand at most six rows, twenty machines, twenty trays, twenty
// tumblers or one build of the animal to a call and rest (ctx.yield) between calls; the Async forms rest inside and give ONE mesh.
import * as THREE from 'three';
import * as INT from '../kit/interior.js';

const PI = Math.PI, TAU = Math.PI * 2;
const lin = (hex) => { const c = new THREE.Color(hex); return [c.r, c.g, c.b]; };
const mix3 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const sstep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const vsub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const vadd = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const vmul = (a, s) => [a[0] * s, a[1] * s, a[2] * s];
const vdot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const vcross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const vnorm = (a) => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
const vlerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

// ------------------------------------------------------------------------------------------------------------------
// measures (metres at 20 times life)
// ------------------------------------------------------------------------------------------------------------------
export const DIM = {
  SCALE: 20,
  PITCH: 15.6,                       // one row to the next (0.78 m)
  WIN_W: 4.6, WIN_H: 6.6, WIN_Y: 20, // the oval opening and the height of its middle
  WIN_Z: -5.6,                       // the window's middle, from the front face of its row's seat backs (beside the sitter's head)
  WIN_DEPTH: 1.6,                    // the reveal, out to the skin
  WALL_TOP: 38, WALL_R: 34,          // the wall is upright to window height, then curves in on this radius
  SEAT_W: 9, ARM_W: 1, SEAT_X0: 0.9, // first armrest from the wall; seat k's middle at SEAT_X0 + ARM_W + SEAT_W/2 + k*(SEAT_W + ARM_W)
  CUSHION_TOP: 9, CUSHION_T: 2.4, SEAT_D: 9.2,
  BACK_TOP: 23, BACK_T0: 1.9, BACK_T1: 1.25, RAKE: 0.14,   // back thickness at the cushion and at the top; rake in radians
  ARM_TOP: 13, ARM_LEN: 7.4,
  TRAY_Y: 13.9, TRAY_W: 8.6, TRAY_D: 6.0, TRAY_T: 0.36,
  LAP_W: 6.6, LAP_D: 4.5, LAP_T: 0.3, SCREEN_W: 6.2, SCREEN_H: 4.0, LID: 1.85,   // lid opened to 106 degrees: its top just clears the back of the seat ahead
  LID_FRONT: 2.36,                   // a front row's lid (no back ahead of it) stands open to 135 degrees: its top edge lies under its sitter's chin from the bay
  PHONE_W: 1.8, PHONE_H: 3.6, PHONE_T: 0.2, TABLET_W: 3.4, TABLET_H: 4.8, TABLET_T: 0.18,
  OTTER_H: 12.3, OTTER_SEAT_Z: -4.3, // a sitter's own origin (under its rump) from the front face of its seat back
  BLOCK_X1: 0.9 + 1 + 3 * (9 + 1),   // the aisle edge of a block of three seats
  AISLE: 9.0, CABIN_W: 72.8,         // AISLE: clear floor between the aisle edges of the two blocks, CABIN_W - 2 * BLOCK_X1 (the armrests'
                                     // outer faces; 0.45 m); CABIN_W: wall to wall at window height (3.64 m)
  BIN_Y: 33, BIN_X: 20.2,            // the underside of the bins over the seats (1.65 m) and how far it reaches from the wall
  CEIL_Y: 42.6,                      // the ceiling over the aisle (2.13 m)
};
// the seat backs lean back: the front face of a back at height y, measured in +z from the row's own z
export const backFront = (y) => Math.max(0, y - DIM.CUSHION_TOP) * Math.tan(DIM.RAKE);
export const backThick = (y) => DIM.BACK_T0 + (DIM.BACK_T1 - DIM.BACK_T0) * sstep(DIM.CUSHION_TOP, DIM.BACK_TOP, y);
export const seatX = (seat) => DIM.SEAT_X0 + DIM.ARM_W + DIM.SEAT_W / 2 + seat * (DIM.SEAT_W + DIM.ARM_W);
export const wallX = (y) => (y <= DIM.WIN_Y ? 0 : DIM.WALL_R - Math.sqrt(Math.max(0, DIM.WALL_R * DIM.WALL_R - (y - DIM.WIN_Y) * (y - DIM.WIN_Y))));
// where a passenger of (row, seat) sits: its own origin in cabin space and its yaw
// side 0: the block by the window wall x = 0; side 1: the block across the aisle, by the far wall (seat 0 is its window seat)
export const blockX = (x, side = 0) => (side ? DIM.CABIN_W - x : x);
export const seatAt = (row, seat, side = 0) => ({ position: [blockX(seatX(seat), side), DIM.CUSHION_TOP, row * DIM.PITCH + DIM.OTTER_SEAT_Z], yaw: PI });
// the tray that serves (row, seat) hangs on the back of the seat ahead: the middle of its top face when it is down
export const trayAt = (row, seat, side = 0) => {
  const z0 = (row - 1) * DIM.PITCH + backFront(DIM.TRAY_Y) + backThick(DIM.TRAY_Y) + 0.35;
  return { position: [blockX(seatX(seat), side), DIM.TRAY_Y, z0 + DIM.TRAY_D / 2], zBack: z0, zNear: z0 + DIM.TRAY_D };
};

// ------------------------------------------------------------------------------------------------------------------
// a small mesh builder for creatures: lofted tubes, blobs, ribbons and tufts with the attributes the fur shader reads
//   position, normal, color
//   aUv  = (metres round the limb, metres along it): the coat is combed along the second
//   aK   = (part id, own weight 0..1, fur 1 | bare 0, tip 0..1)
//   aW   = (head weight, arm weight signed by side, tail weight, gloss)
//   aAlt = (a second place x, y, z and the height of its ring's middle: the tail laid out straight; on a vertex of an
//           arm: THE MIDDLE OF ITS OWN RING; elsewhere the vertex's own place)
//   aAx  = on a vertex of an arm: the arm's own line at its ring, a step of the line for a step of t (nought elsewhere)
// part ids: 0 trunk, 1 head, 2 arm, 3 leg, 4 tail, 5 whisker, 6 ear, 7 eye and nose
// ------------------------------------------------------------------------------------------------------------------
// src: the caller's generator of numbers in 0..1 (the world hands ctx.core.makeRng(ctx.core.hashSeed('otter-coat')));
// this file keeps none of its own. Without one (a count made in node) the coat's tufts fall on a plain even sequence.
function makeGeo(src) {
  const P = [], N = [], C = [], UV = [], K = [], W = [], I = [], CB = [], ALT = [], AXC = [], AXT = [], tuftAs = [];
  let drawn = 0, even = 0.5;
  const next = src || (() => { even = (even + 0.6180339887498949) % 1; return even; });
  const rnd = () => { drawn++; return next(); };
  const vert = (p, c, uv, k, w, comb) => { P.push(p[0], p[1], p[2]); N.push(0, 0, 0); C.push(c[0], c[1], c[2]); UV.push(uv[0], uv[1]); K.push(k[0], k[1], k[2], k[3]); W.push(w[0], w[1], w[2], w[3]); CB.push(comb[0], comb[1], comb[2]); ALT.push(p[0], p[1], p[2], 0); AXC.push(0, 0, 0); AXT.push(0, 0, 0); return P.length / 3 - 1; };
  const smoothFrom = [];   // [first index, last index) ranges of triangles whose normals are averaged
  const G = {
    P, N, C, UV, K, W, I, ALT, rnd,
    // draw on until n values have been taken in all: every build takes the same number from the caller's generator
    settle(n) { while (drawn < n) rnd(); },
    get triangles() { return I.length / 3; },
    // A lofted tube. st: stations [{ c: [x,y,z], rx, ru, rd (half-widths: across, to the 'up' side, to the other), e (squareness) }].
    // up: the reference direction of the 'up' side. col(k, t, ca, sa, p) -> [r,g,b]; wt(t, p) -> [head, arm, tail, gloss];
    // own(t) -> own weight. comb: +1 the coat lies toward the last station, -1 toward the first. Returns surf(tk, a).
    loft(st, o) {
      const n = st.length, sides = o.sides, up = o.up || [0, 1, 0], seam = o.seam ?? -PI / 2, e0 = o.e ?? 1, part = o.part ?? 0, fur = o.fur ?? 1;
      const fr = []; let Rp = null;
      for (let k = 0; k < n; k++) {
        const T = vnorm(vsub(st[Math.min(n - 1, k + 1)].c, st[Math.max(0, k - 1)].c));
        // o.carry: the frame of one station is carried to the next (a tail that turns down over an edge must not twist)
        let R = o.carry && Rp ? vsub(Rp, vmul(T, vdot(Rp, T))) : vcross(T, up);
        if (Math.hypot(R[0], R[1], R[2]) < 0.05) R = vcross(T, up);
        if (Math.hypot(R[0], R[1], R[2]) < 0.05) R = vcross(T, [0.2, 0.3, 0.93]);
        R = vnorm(R); Rp = R;
        fr.push({ T, R, U: vnorm(vcross(R, T)) });
      }
      let run = 0; const along = [0];
      for (let k = 1; k < n; k++) { run += Math.hypot(...vsub(st[k].c, st[k - 1].c)); along.push(run); }
      const at = (k, a) => {
        const s = st[k], f = fr[k], ca = Math.cos(a), sa = Math.sin(a), e = s.e ?? e0;
        const cx = Math.sign(ca) * Math.pow(Math.abs(ca), e), sy = Math.sign(sa) * Math.pow(Math.abs(sa), e), rv = sy >= 0 ? s.ru : (s.rd ?? s.ru);
        return [s.c[0] + f.R[0] * s.rx * cx + f.U[0] * rv * sy, s.c[1] + f.R[1] * s.rx * cx + f.U[1] * rv * sy, s.c[2] + f.R[2] * s.rx * cx + f.U[2] * rv * sy];
      };
      const first = P.length / 3, t0 = I.length;
      for (let k = 0; k < n; k++) for (let i = 0; i <= sides; i++) {
        const a = seam + (i / sides) * TAU, p = at(k, a), t = o.tt ? o.tt[k] : k / (n - 1), s = st[k], girth = (s.rx + s.ru + (s.rd ?? s.ru)) / 3;
        const comb = vmul(fr[k].T, o.comb ?? 1);
        const v = vert(p, o.col(k, t, Math.cos(a), Math.sin(a), p), [(i / sides) * TAU * Math.max(s.ug ?? girth, 0.3), along[k] + (o.uv0 || 0)], [part, o.own ? o.own(t) : 0, fur, 0], o.wt ? o.wt(t, p) : [0, 0, 0, 0], comb);
        // o.tt (a limb the pose bends): every vertex keeps its ring's middle and the limb's own line there, a step of
        // the line for a step of t (AXC, AXT): the pose turns the ring to face down the line as it has bent it
        if (o.tt) { const k0 = Math.max(0, k - 1), k1 = Math.min(n - 1, k + 1), dt = o.tt[k1] - o.tt[k0], ct = dt > 1e-4 ? vmul(vsub(st[k1].c, st[k0].c), 1 / dt) : fr[k].T;
          for (let q = 0; q < 3; q++) { AXC[v * 3 + q] = s.c[q]; AXT[v * 3 + q] = ct[q]; } }
      }
      for (let k = 0; k < n - 1; k++) for (let i = 0; i < sides; i++) {
        const a = first + k * (sides + 1) + i, b = a + 1, c = a + sides + 1, d = c + 1;
        I.push(a, c, b, b, c, d);
      }
      smoothFrom.push([t0, I.length, first, sides, n]);
      if (o.tuftsAs != null) tuftAs.push([t0, I.length, o.tuftsAs]);   // this loft takes the coat's tufts as a skin of that many square metres would
      // o.alt: the same rings on a second line of stations (the tail laid out straight behind): kept in ALT (x, y, z, the
      // height of the ring's middle) for the poses that lie down
      if (o.alt) {
        const s2 = o.alt, f2 = s2.map((q, k) => { const T = vnorm(vsub(s2[Math.min(n - 1, k + 1)].c, s2[Math.max(0, k - 1)].c)), R = vnorm(vcross(T, up)); return { R, U: vnorm(vcross(R, T)) }; });
        for (let k = 0; k < n; k++) for (let i = 0; i <= sides; i++) {
          const a = seam + (i / sides) * TAU, q = s2[k], f = f2[k], ca = Math.cos(a), sa = Math.sin(a), rv = sa >= 0 ? q.ru : (q.rd ?? q.ru), v = (first + k * (sides + 1) + i) * 4;
          for (let c = 0; c < 3; c++) ALT[v + c] = q.c[c] + f.R[c] * q.rx * ca + f.U[c] * rv * sa;
          ALT[v + 3] = q.c[1];
        }
      }
      // a point of the surface and its outward direction, at station tk (may lie between two) and angle a
      return (tk, a) => {
        const k = Math.min(n - 2, Math.max(0, Math.floor(tk))), u = Math.min(1, Math.max(0, tk - k)), p = vlerp(at(k, a), at(k + 1, a), u), c = vlerp(st[k].c, st[k + 1].c, u);
        return { p, n: vnorm(vsub(p, c)), c, T: fr[k].T, R: fr[k].R, U: fr[k].U };
      };
    },
    // an ellipsoid; axes: optional [X, Y, Z] unit vectors of its own frame
    blob(c, r, o) {
      const ws = o.ws ?? 8, hs = o.hs ?? 6, ax = o.axes || [[1, 0, 0], [0, 1, 0], [0, 0, 1]], first = P.length / 3, t0 = I.length, part = o.part ?? 0, fur = o.fur ?? 1;
      for (let j = 0; j <= hs; j++) for (let i = 0; i <= ws; i++) {
        const th = (j / hs) * PI, ph = (i / ws) * TAU, u = [Math.sin(th) * Math.cos(ph), Math.cos(th), Math.sin(th) * Math.sin(ph)];
        const l = [u[0] * r[0], u[1] * r[1], u[2] * r[2]];
        const p = [c[0] + ax[0][0] * l[0] + ax[1][0] * l[1] + ax[2][0] * l[2], c[1] + ax[0][1] * l[0] + ax[1][1] * l[1] + ax[2][1] * l[2], c[2] + ax[0][2] * l[0] + ax[1][2] * l[1] + ax[2][2] * l[2]];
        vert(p, o.col(u, p), [ph * r[0], th * r[1]], [part, o.own ?? 0, fur, 0], o.wt ? (typeof o.wt === 'function' ? o.wt(p) : o.wt) : [0, 0, 0, 0], o.comb || [0, -1, 0]);
      }
      for (let j = 0; j < hs; j++) for (let i = 0; i < ws; i++) { const a = first + j * (ws + 1) + i, b = a + 1, d = a + ws + 1, e = d + 1; I.push(a, b, d, b, e, d); }
      smoothFrom.push([t0, I.length, first, ws, hs + 1, true]);
    },
    // a flat ribbon through pts with half-widths hw (two-sided in the shader); nrm: the ribbon's face normal
    ribbon(pts, hw, o) {
      const first = P.length / 3, n = pts.length;
      for (let k = 0; k < n; k++) {
        const T = vnorm(vsub(pts[Math.min(n - 1, k + 1)], pts[Math.max(0, k - 1)])), S = vnorm(vcross(T, o.nrm || [0, 1, 0])), t = k / (n - 1);
        for (const s of [-1, 1]) {
          const i = vert(vadd(pts[k], vmul(S, s * hw[k])), o.col(t), [s * hw[k], t], [o.part ?? 5, t, o.fur ?? 0, o.tip ? t : 0], o.wt || [1, 0, 0, 0], T);
          const nn = o.side ? vmul(S, s) : (o.nrm || [0, 1, 0]); N[i * 3] = nn[0]; N[i * 3 + 1] = nn[1]; N[i * 3 + 2] = nn[2];
        }
      }
      for (let k = 0; k < n - 1; k++) { const a = first + k * 2; I.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
    },
    // a ribbed, domed fan (a scallop's shell): hinge at c, opening along axes[1], its outside toward axes[2]
    fan(c, axes, R, o) {
      const [X, Y, Z] = axes, ribs = o.ribs ?? 6, cols = ribs * 2 + 1, fr = o.rings || [0.45, 1], part = o.part ?? 0, wt = o.wt || [0, 0, 0, 0], spread = o.spread ?? 1.0;
      const put = (p, nn, c2) => { const i = vert(p, c2, [p[0], p[1]], [part, o.own ?? 0, 0, 0], wt, [0, -1, 0]); N[i * 3] = nn[0]; N[i * 3 + 1] = nn[1]; N[i * 3 + 2] = nn[2]; return i; };
      const apex = put(c, vnorm(vadd(Z, vmul(Y, -0.4))), o.dark), first = P.length / 3;
      for (let j = 0; j < fr.length; j++) for (let i = 0; i < cols; i++) {
        const a = (i / (cols - 1) - 0.5) * 2 * spread, ridge = i % 2 === 0, f = fr[j], r = R * f * (ridge ? 1 : 0.9), rad = vadd(vmul(X, Math.sin(a)), vmul(Y, Math.cos(a)));
        const h = R * (0.3 * Math.sin(PI * Math.min(1, f * 0.85)) + (ridge ? 0.06 : 0) * f);
        put(vadd(vadd(c, vmul(rad, r)), vmul(Z, h)), vnorm(vadd(Z, vmul(rad, 0.55 * f))), ridge ? o.light : o.dark);
      }
      for (let i = 0; i < cols - 1; i++) I.push(apex, first + i, first + i + 1);
      for (let j = 0; j < fr.length - 1; j++) for (let i = 0; i < cols - 1; i++) { const a = first + j * cols + i, b = a + 1, d = a + cols, e = d + 1; I.push(a, d, b, b, d, e); }
    },
    // area-weighted smooth normals over everything lofted so far, the seams of the rings closed
    smooth() {
      for (const [t0, t1] of smoothFrom) for (let t = t0; t < t1; t += 3) {
        const a = I[t], b = I[t + 1], c = I[t + 2];
        const ab = [P[b * 3] - P[a * 3], P[b * 3 + 1] - P[a * 3 + 1], P[b * 3 + 2] - P[a * 3 + 2]], ac = [P[c * 3] - P[a * 3], P[c * 3 + 1] - P[a * 3 + 1], P[c * 3 + 2] - P[a * 3 + 2]], nn = vcross(ab, ac);
        for (const v of [a, b, c]) { N[v * 3] += nn[0]; N[v * 3 + 1] += nn[1]; N[v * 3 + 2] += nn[2]; }
      }
      for (const [, , first, sides, rings] of smoothFrom) for (let k = 0; k < rings; k++) {
        const a = first + k * (sides + 1), b = a + sides;
        for (let q = 0; q < 3; q++) { const s = N[a * 3 + q] + N[b * 3 + q]; N[a * 3 + q] = s; N[b * 3 + q] = s; }
      }
      // a blob's two poles are rings of one point: one normal there (no star of facets on a pad, a nose or an eye)
      for (const [, , first, sides, rings, ball] of smoothFrom) if (ball) for (const k of [0, rings - 1]) {
        const a = first + k * (sides + 1), s = [0, 0, 0];
        for (let i = 0; i <= sides; i++) for (let q = 0; q < 3; q++) s[q] += N[(a + i) * 3 + q];
        for (let i = 0; i <= sides; i++) for (let q = 0; q < 3; q++) N[(a + i) * 3 + q] = s[q];
      }
      for (const [, , first, sides, rings] of smoothFrom) for (let v = first; v < first + (sides + 1) * rings; v++) {
        const l = Math.hypot(N[v * 3], N[v * 3 + 1], N[v * 3 + 2]) || 1; N[v * 3] /= l; N[v * 3 + 1] /= l; N[v * 3 + 2] /= l;
      }
      G.furEnd = I.length;
    },
    // Tufts: single thin triangles rooted in the coat (anywhere fur is 1 and keep() agrees), lying along the comb and
    // standing off the skin. count over the whole coat, shared out by area. Each carries its root's weights, so it moves with it.
    tufts(count, o) {
      const end = G.furEnd ?? I.length, tris = []; let total = 0;
      // (a loft made with tuftsAs counts for that area whatever its own: a limb built finer takes the tufts its first
      // shape took, and no tuft elsewhere on the coat moves)
      const share = tuftAs.map(([t0, t1, as]) => [t0, t1, as / Math.max(G.area(t0, t1), 1e-6)]);
      for (let t = 0; t < end; t += 3) {
        const a = I[t], b = I[t + 1], c = I[t + 2];
        if (K[a * 4 + 2] < 0.5 || K[b * 4 + 2] < 0.5 || K[c * 4 + 2] < 0.5) continue;
        const ab = [P[b * 3] - P[a * 3], P[b * 3 + 1] - P[a * 3 + 1], P[b * 3 + 2] - P[a * 3 + 2]], ac = [P[c * 3] - P[a * 3], P[c * 3 + 1] - P[a * 3 + 1], P[c * 3 + 2] - P[a * 3 + 2]];
        const ar = 0.5 * Math.hypot(...vcross(ab, ac)); if (ar < 1e-5) continue;
        let f = 1; for (const [t0, t1, k] of share) if (t >= t0 && t < t1) f = k;
        total += ar * f; tris.push([t, total]);
      }
      const get = (arr, i, n) => { const o2 = []; for (let q = 0; q < n; q++) o2.push(arr[i * n + q]); return o2; };
      for (let j = 0; j < count; j++) {
        const pick = rnd() * total; let lo = 0, hi = tris.length - 1;
        while (lo < hi) { const m = (lo + hi) >> 1; if (tris[m][1] < pick) lo = m + 1; else hi = m; }
        const t = tris[lo][0], ia = I[t], ib = I[t + 1], ic = I[t + 2];
        let u = rnd(), v = rnd(); if (u + v > 1) { u = 1 - u; v = 1 - v; } const w = 1 - u - v;
        const bl = (arr, n) => { const A = get(arr, ia, n), B = get(arr, ib, n), Cc = get(arr, ic, n); return A.map((x, q) => x * w + B[q] * u + Cc[q] * v); };
        const p = bl(P, 3), n = vnorm(bl(N, 3)), col = bl(C, 3), uv = bl(UV, 2), k = bl(K, 4), wt = bl(W, 4), comb = vnorm(bl(CB, 3)), axc = bl(AXC, 3), axt = bl(AXT, 3);
        const r1 = rnd(), r2 = rnd(), r3 = rnd();
        if (o.keep && !o.keep(p, n, k)) continue;
        const len = (o.len[0] + (o.len[1] - o.len[0]) * r1) * (o.lenAt ? o.lenAt(p, k) : 1), wid = o.wid * (0.7 + 0.6 * r2), lift = o.lift ?? 0.55;
        const d = vnorm([n[0] * lift + comb[0] + (r3 - 0.5) * 0.5 * n[1], n[1] * lift + comb[1], n[2] * lift + comb[2] + (r2 - 0.5) * 0.5 * n[1]]);
        let s = vcross(d, n); if (Math.hypot(s[0], s[1], s[2]) < 0.05) s = vcross(d, [0.3, 0.2, 0.9]); s = vnorm(s);
        const q = vsub(p, vmul(n, 0.04)), root = vmul(col, o.root ?? 0.7), tipC = o.tipCol ? mix3(col, o.tipCol, o.tipMix ?? 0.5) : vmul(col, 1.25);
        const kk = [k[0], k[1], 2, 0], a = vert(vsub(q, vmul(s, wid / 2)), root, uv, kk, wt, comb), b = vert(vadd(q, vmul(s, wid / 2)), root, uv, kk, wt, comb);
        const c = vert(vadd(p, vmul(d, len)), tipC, [uv[0], uv[1] + len], [k[0], k[1], 2, 1], wt, comb);
        for (const [i, nn] of [[a, n], [b, n], [c, vnorm(vadd(n, vmul(d, 0.25)))]]) { N[i * 3] = nn[0]; N[i * 3 + 1] = nn[1]; N[i * 3 + 2] = nn[2]; }
        for (const i of [a, b, c]) for (let q2 = 0; q2 < 3; q2++) { AXC[i * 3 + q2] = axc[q2]; AXT[i * 3 + q2] = axt[q2]; }   // a tuft of a limb turns with its root
        I.push(a, b, c);
        // a tuft of the tail has no place on the straightened tail: there it closes to a point at its root
        if (k[0] > 3.5 && k[0] < 4.5) { const al = bl(ALT, 4); for (const i of [a, b, c]) for (let q2 = 0; q2 < 4; q2++) ALT[i * 4 + q2] = al[q2]; }
      }
    },
    // square metres of the triangles [t0, t1) of the index (the tufts' own measure)
    area(t0 = 0, t1 = I.length) {
      let sum = 0;
      for (let t = t0; t < t1; t += 3) { const a = I[t], b = I[t + 1], c = I[t + 2];
        const ar = 0.5 * Math.hypot(...vcross([P[b * 3] - P[a * 3], P[b * 3 + 1] - P[a * 3 + 1], P[b * 3 + 2] - P[a * 3 + 2]], [P[c * 3] - P[a * 3], P[c * 3 + 1] - P[a * 3 + 1], P[c * 3 + 2] - P[a * 3 + 2]])); if (ar >= 1e-5) sum += ar; }
      return sum;
    },
    // slide everything along z (the second places too, and the middles of the limbs' rings)
    slideZ(d) { for (let i = 2; i < P.length; i += 3) { P[i] += d; AXC[i] += d; } for (let i = 2; i < ALT.length; i += 4) ALT[i] += d; },
    // bend everything built so far: f(p) -> [pivot, angle about +x] or null (a slouch, a tuck of the chin)
    bendX(f) {
      for (let v = 0; v < P.length / 3; v++) {
        const p = [P[v * 3], P[v * 3 + 1], P[v * 3 + 2]], r = f(p); if (!r) continue;
        const [pv, ang] = r, c = Math.cos(ang), s = Math.sin(ang), dy = p[1] - pv[1], dz = p[2] - pv[2];
        P[v * 3 + 1] = pv[1] + dy * c - dz * s; P[v * 3 + 2] = pv[2] + dz * c + dy * s;
        for (const A of [N, CB, AXT]) { const y = A[v * 3 + 1], z = A[v * 3 + 2]; A[v * 3 + 1] = y * c - z * s; A[v * 3 + 2] = z * c + y * s; }
        { const ey = AXC[v * 3 + 1] - pv[1], ez = AXC[v * 3 + 2] - pv[2]; AXC[v * 3 + 1] = pv[1] + ey * c - ez * s; AXC[v * 3 + 2] = pv[2] + ez * c + ey * s; }   // its ring's middle goes with it
      }
    },
    build() {
      const g = new THREE.InstancedBufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3));
      g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3)); g.setAttribute('aUv', new THREE.Float32BufferAttribute(UV, 2));
      g.setAttribute('aK', new THREE.Float32BufferAttribute(K, 4)); g.setAttribute('aW', new THREE.Float32BufferAttribute(W, 4));
      // the second place is the vertex's own everywhere but on the tail (bends made after the lofts are followed here)
      // (a vertex of a limb the pose bends keeps there the middle of its own ring instead, and in aAx the limb's line: see loft, o.tt)
      for (let v = 0; v < P.length / 3; v++) if (!(K[v * 4] > 3.5 && K[v * 4] < 4.5)) { const A = AXT[v * 3] * AXT[v * 3] + AXT[v * 3 + 1] * AXT[v * 3 + 1] + AXT[v * 3 + 2] * AXT[v * 3 + 2] > 1e-6 ? AXC : P; ALT[v * 4] = A[v * 3]; ALT[v * 4 + 1] = A[v * 3 + 1]; ALT[v * 4 + 2] = A[v * 3 + 2]; }
      g.setAttribute('aAlt', new THREE.Float32BufferAttribute(ALT, 4)); g.setAttribute('aAx', new THREE.Float32BufferAttribute(AXT, 3));
      g.setIndex(I);
      return g;
    },
  };
  return G;
}

// ------------------------------------------------------------------------------------------------------------------
// THE OTTER. Own space: facing +z, y up, the origin on the seat under its rump; +x is its left.
// A river otter sits upright like a commuter: a long sleek trunk that runs into a neck as thick as its head, without
// a shoulder line; a flat broad head with a blunt muzzle, two pale whisker pads under a wide black nose, bead eyes set
// forward, small round ears low on the sides of the skull; a cream throat, chin and cheeks; short arms that grow out
// of the chest and end in dark webbed paws; haunches bunched at its sides with the flat hind feet out in front of
// them; and a thick tapering tail that lies round its right hip, runs forward along the cushion and hangs over the
// front edge of the seat, where its end stirs.
// The sea otter is the same animal made rounder and shaggier, dark in the body and pale in the head, slouched far
// back with a ribbed shell on its chest and a stone in its paw.
// ------------------------------------------------------------------------------------------------------------------
const TIERS = {
  // (the near arm: 11 rings shoulder to wrist where 7 stood; cap: 2 more that draw the shoulder in to a round cap, and
  // wrist: 1 that draws the wrist in inside the paw (each: how far beyond the end ring as a share of the cap's depth,
  // the ring's girth as a share of the end ring's). NO CAP ENDS IN A POINT: its last ring stays open, a quarter or a
  // third of the limb's girth, inside the trunk or the paw: a ring of a few centimetres made triangles under a tenth
  // of a pixel wide, and one sample in a frame came out hundreds of times too bright through the antialiasing.
  // armAs: the arm's first shape, by which it still takes its share of the coat's tufts; toes: sides round a river
  // otter's finger (4 made each a splinter))
  near: { trunk: [16, 16], head: [13, 16], arm: [11, 10], cap: [[1, 0.25], [0.6, 0.8]], wrist: [[1, 0.35]], armAs: [7, 10], toes: 6, leg: [4, 7], tail: [12, 10], blob: [6, 4], eye: [8, 6], tufts: 800, fingers: true, whiskers: 5, face: true },   // (the coat's tufts were 1180: a third of them went into rounder limbs, a finer head, brows and ears)
  mid: { trunk: [9, 10], head: [8, 10], arm: [4, 6], leg: [3, 5], tail: [7, 6], blob: [5, 3], eye: [5, 3], tufts: 80, fingers: false, whiskers: 3, face: true },
  far: { trunk: [5, 6], head: [5, 5], arm: [3, 4], leg: [2, 4], tail: [4, 4], blob: [3, 2], eye: [3, 2], tufts: 0, fingers: false, whiskers: 1, face: false },
};
const COAT_DRAWS = 6 * 1180;   // six values a tuft, by the near build's count
// n stations picked evenly from a longer table (the ends kept)
const pickSt = (st, n) => { const out = []; for (let i = 0; i < n; i++) { const f = (i / (n - 1)) * (st.length - 1), k = Math.min(st.length - 2, Math.floor(f)), u = f - k, a = st[k], b = st[k + 1], s = {}; for (const key of Object.keys(a)) s[key] = Array.isArray(a[key]) ? vlerp(a[key], b[key], u) : a[key] + (b[key] - a[key]) * u; out.push(s); } return out; };

const COAT = {
  river: { back: lin('#583724'), flank: lin('#7b5237'), cream: lin('#e6cfa4'), creamD: lin('#c4a57a'), paw: lin('#2c1d15'), tip: lin('#a47a52'), ear: lin('#3c271d'), brow: lin('#6a452d') },
  // the sea otter: a warm face (cream to buff), a brown body; its paws and hind feet are the coat's own dark brown, not black
  sea: { back: lin('#4a382c'), flank: lin('#65503f'), cream: lin('#dcb880'), creamD: lin('#b98a54'), paw: lin('#4a3628'), tip: lin('#b9a78c'), ear: lin('#8a6a4a'), brow: lin('#b48c5c') },
};
const HEAD_COCK = 0.3;    // rad: a seated rest's head, at the end where it looks at what it holds, is cocked this far over toward the side it turns to look round (the hero: toward the aisle), so that its eye and brow are seen from the row gap below it and not only its jaw
const FUR_FLOOR = 0.75;   // the fur's floor: the share of its lit strength the shade is held to (seen through the page's grade: a quarter of its lit colour at the least)
// THE SEA OTTER'S FACE, read from above at 18 to 40 m: the darker fur round its eyes and over them, its small dark ears
// (outside and in the hollow), its muzzle's pale pads and the mouth's line. Its head keeps the coat's own buff.
const SEA_FACE = { patch: lin('#54382a'), ear: lin('#4a3424'), earIn: lin('#2c1e16'), muzzle: lin('#f1dfba'), mouth: lin('#3a271d') };
const NOSE = lin('#241815'), EYE = lin('#0a0706'), WHISKER = [0.6, 0.56, 0.48], WHISKER_ROOT = [0.3, 0.26, 0.22], SEA_SLIDE = 2.6;

// The build runs as a list of short steps (a generator), so a world can rest between them and no step is long.
function* otterSteps(tier = 'near', species = 'river', rnd = null) {
  const Q = TIERS[tier] || TIERS.near, sea = species === 'sea', coat = COAT[sea ? 'sea' : 'river'];
  const G = makeGeo(typeof rnd === 'function' ? rnd : null);
  const fat = sea ? 1.16 : 1;
  // ---- the trunk, rump to the top of the neck: a pear at the hips, a long tube above, the neck craned to its work ---
  // (a seated otter is not a column: a rounded back behind the hips, a chest, SHOULDERS at y 7.5, and a neck that is
  // narrower than the head it carries, from every side)
  const TR = [
    { c: [0, 0.12, -0.2], rx: 0.7, ru: 0.7, rd: 0.7 }, { c: [0, 0.5, -0.2], rx: 1.9, ru: 2.0, rd: 1.85 }, { c: [0, 1.5, -0.18], rx: 2.2, ru: 2.36, rd: 2.05 },
    { c: [0, 2.8, -0.14], rx: 2.1, ru: 2.28, rd: 2.0 }, { c: [0, 4.2, -0.08], rx: 1.92, ru: 2.06, rd: 1.95 }, { c: [0, 5.5, 0.04], rx: 1.8, ru: 1.9, rd: 1.86 },
    { c: [0, 6.6, 0.22], rx: 1.82, ru: 1.86, rd: 1.72 }, { c: [0, 7.5, 0.46], rx: 1.9, ru: 1.7, rd: 1.56 }, { c: [0, 8.3, 0.74], rx: 1.62, ru: 1.4, rd: 1.36 },
    { c: [0, 9.1, 1.04], rx: 1.24, ru: 1.12, rd: 1.16 }, { c: [0, 9.9, 1.32], rx: 1.12, ru: 1.02, rd: 1.1 }, { c: [0, 10.7, 1.56], rx: 1.08, ru: 0.9, rd: 1.06 }, { c: [0, 11.3, 1.7], rx: 0.5, ru: 0.4, rd: 0.5 },
  ].map((s) => ({ ...s, rx: s.rx * fat, ru: s.ru * fat * (sea ? 1.05 : 1), rd: s.rd * fat }));
  const neck = [0, 8.7, 0.9];
  const blot = (p) => 0.07 * Math.sin(p[0] * 2.9 + p[1] * 1.7) * Math.sin(p[1] * 3.3 + 1.3);
  const trunkCol = (k, t, ca, sa, p) => {
    const y = p[1], base = mix3(coat.back, coat.flank, sstep(-0.25, 0.65, sa));
    // the bib: PALE FUR ON THE CHEST AND THE THROAT'S FRONT ONLY (a third of the way round at the most; from the side
    // and from behind an otter is brown), none on the belly
    const thr = 0.74 - 0.2 * sstep(5.8, 9.6, y), m = sstep(thr, thr + 0.22, sa + blot(p)) * sstep(sea ? 5.6 : 5.3, sea ? 7.4 : 6.9, y + blot(p) * 3);
    return mix3(base, mix3(coat.creamD, coat.cream, sstep(6.5, 10, y)), m);
  };
  G.loft(pickSt(TR, Q.trunk[0]), { sides: Q.trunk[1], up: [0, 0, 1], part: 0, comb: -1, col: trunkCol, wt: (t, p) => [sstep(8.2, 10.6, p[1]), 0, 0, 0] });

  // ---- the head: nose tip to the back of the skull, flat on top, broad at the cheeks, closed behind -----------------
  // (from the side: a blunt muzzle lower than the skull, a stop rising to the brow at a third of the way back, a round
  // skull higher than it is flat; the head is wider and deeper than the neck under it)
  const hs = 1.2, nose0 = [0, 10.6, 4.75 - (sea ? 0.45 : 0)], occ = [0, 11.5, 0.45], hAx = vsub(occ, nose0), hT = vnorm(hAx);
  const HD = (sea ? [
    [0, 0.42, 0.32, 0.3], [0.06, 0.96, 0.68, 0.62], [0.16, 1.22, 0.9, 0.8], [0.28, 1.36, 1.04, 0.9], [0.4, 1.52, 1.2, 0.98], [0.54, 1.7, 1.3, 1.06],
    [0.68, 1.76, 1.32, 1.1], [0.82, 1.66, 1.24, 1.1], [0.93, 1.42, 1.02, 1.0], [1.0, 0.96, 0.62, 0.7], [1.05, 0.08, 0.06, 0.06],
  ] : [
    [0, 0.5, 0.36, 0.34], [0.045, 0.94, 0.66, 0.62], [0.13, 1.1, 0.8, 0.76], [0.24, 1.16, 0.88, 0.84], [0.34, 1.3, 1.04, 0.9], [0.46, 1.46, 1.16, 0.96],
    [0.6, 1.56, 1.22, 1.0], [0.75, 1.54, 1.2, 1.02], [0.88, 1.38, 1.06, 0.98], [0.97, 0.98, 0.72, 0.74], [1.05, 0.08, 0.06, 0.06],
  ]).map(([t, hw, hu, hd]) => ({ c: vadd(nose0, vmul(hAx, t)), rx: hw * hs, ru: hu * hs, rd: hd * hs, tt: t }));
  const hst = pickSt(HD, Q.head[0]);
  const headCol = (k, t, ca, sa, p) => {
    // PALE ON THE MUZZLE (its sides and underside) AND UNDER THE CHIN ONLY: the nose's bridge, the brow, the cheeks
    // and the skull are brown. The sea otter's face is cream going to buff over the skull, brown at the nape.
    const tt = hst[k].tt, thr = tt < 0.26 ? 0.1 : 0.1 - 0.85 * sstep(0.26, 0.8, tt);
    const top = mix3(coat.flank, coat.back, sstep(0.2, 0.55, tt)), pale = mix3(coat.cream, coat.creamD, sstep(0.4, 0.95, tt) * 0.7);
    let c = mix3(top, pale, (1 - sstep(thr, thr + (sea ? 0.6 : 0.3), sa + blot(p))) * (1 - sstep(0.5, 0.8, tt)));   // none behind the cheeks: from behind the head is brown
    if (sea) c = mix3(c, mix3(coat.cream, coat.creamD, sstep(0.3, 0.8, tt)), 0.86 * (1 - sstep(0.72, 1.0, tt)));
    return c;
  };
  const headW = [1, 0, 0, 0];
  const hSurf = G.loft(hst, { sides: Q.head[1], up: [0, 1, 0], part: 1, comb: 1, e: 0.86, col: headCol, wt: () => headW });
  const hk = (t) => { let k = 0; while (k < hst.length - 2 && hst[k + 1].tt < t) k++; return k + (t - hst[k].tt) / Math.max(1e-6, hst[k + 1].tt - hst[k].tt); };   // head station index at t
  const bare = (gloss) => [1, 0, 0, gloss];

  // ears: small round flaps LOW on the sides of the skull, behind the eyes (a bear's stand on top; these do not)
  // (the sea otter's ears are small and DARK against its pale head: from above they are two of the marks a face is read by)
  const earOut = sea ? SEA_FACE.ear : coat.back, earIn = mix3(earOut, sea ? SEA_FACE.earIn : coat.ear, 0.7), fine = tier === 'near';
  for (const s of [-1, 1]) {
    const e = hSurf(hk(sea ? 0.78 : 0.74), PI / 2 - s * (sea ? 1.3 : 1.28)), X = e.T, Y = e.n, Z = vnorm(vcross(X, Y)), r = sea ? 0.4 : 0.31;
    G.blob(vadd(e.p, vmul(Y, r * 0.35)), [0.14, r * 0.85, r], { ws: fine ? 8 : Math.max(4, Q.blob[0]), hs: fine ? 5 : Q.blob[1], axes: [X, Y, Z], part: 6, own: 1, fur: 1, wt: headW, comb: Y,
      col: (u) => mix3(earOut, earIn, sstep(-0.2, 0.5, -u[0]) * (1 - sstep(0.35, 0.85, Math.hypot(u[1], u[2])))) });   // the coat's own colour; darker only in the hollow that faces forward
  }
  // eyes: small dark beads set INTO the side-front of the head a third of the way back from the nose, each under a low
  // furred brow (the fur's own colour) that covers its top third: an eye looks out from under its brow and is not a
  // ball stuck on top. The small light in each is drawn by the fragment law on the bead itself (gloss 1.2 marks an eye).
  for (const s of [-1, 1]) {
    const e = hSurf(hk(sea ? 0.38 : 0.36), PI / 2 - s * (sea ? 0.94 : 1.1)), r = (sea ? 0.27 : 0.2) * hs;
    G.blob(vsub(e.p, vmul(e.n, r * (sea ? 0.12 : 0.42))), [r, r, r], { ws: Q.eye[0], hs: Q.eye[1], part: 7, own: 0.5, fur: 0, wt: bare(1.2), col: () => EYE });   // own 0.5 marks an eye: the shader shuts it in sleep
    if (Q.face) { const up = vnorm(vsub([0, 1, 0], vmul(e.n, e.n[1])));
      G.blob(vadd(vadd(e.p, vmul(up, r * 1.45)), vmul(e.n, -0.06)), [0.5, 0.16, 0.2], { ws: 6, hs: 3, axes: [e.T, up, e.n], part: 1, fur: 1, wt: headW, comb: e.T, col: () => (sea ? SEA_FACE.patch : coat.brow) });
      // the sea otter: A PATCH OF DARKER FUR round each eye, lying in the coat (a low mound, darkest at the eye)
      if (sea) G.blob(vsub(e.p, vmul(e.n, 0.17)), [0.78, 0.62, 0.26], { ws: 8, hs: 4, axes: [e.T, up, e.n], part: 1, fur: 1, wt: headW, comb: e.T, col: (u) => mix3(SEA_FACE.patch, mix3(coat.cream, coat.creamD, 0.6), 0.85 * sstep(0.4, 1, Math.hypot(u[0], u[1]))) }); }
  }
  // the whisker pads: two pale cushions on the muzzle's end, under the nose (the broad otter muzzle)
  const pad = (s) => vadd(vadd(nose0, vmul(hT, 0.66)), [s * 0.52, -0.28, 0]);
  if (tier !== 'far') for (const s of [-1, 1])
    G.blob(sea ? vadd(pad(s), [s * 0.12, 0, 0.04]) : pad(s), sea ? [0.66 * hs, 0.5 * hs, 0.7 * hs] : [0.52 * hs, 0.43 * hs, 0.66 * hs], { ws: fine ? 10 : Q.blob[0], hs: fine ? 7 : Q.blob[1] + 1, part: 1, fur: 1, wt: headW, comb: [0, -0.3, 1],
      col: (u) => (sea ? mix3(SEA_FACE.muzzle, coat.cream, 0.5 - 0.5 * u[1]) : mix3(coat.cream, coat.creamD, 0.5 - 0.5 * u[1])) });
  // the sea otter's muzzle is DRAWN: a dark cleft from the nose down between its two pads, and the mouth's dark line under them
  if (sea && Q.face) { G.blob(vadd(nose0, vadd(vmul(hT, 0.3), [0, -0.42, 0.18])), [0.1 * hs, 0.34 * hs, 0.2 * hs], { ws: 6, hs: 3, part: 7, fur: 0, wt: bare(0.2), col: () => NOSE });
    G.blob(vadd(nose0, vadd(vmul(hT, 0.7), [0, -0.86, 0.1])), [0.66 * hs, 0.09 * hs, 0.4 * hs], { ws: 8, hs: 3, part: 7, fur: 0, wt: bare(0.2), col: () => SEA_FACE.mouth }); }
  // the nose pad: dark, on the top of the muzzle's end, half the muzzle's width (a nose, not a black ball)
  { const U = vnorm(vcross([1, 0, 0], hT));
    // (the sea otter's is BROAD: nearly the muzzle's own width, a dark pad that is seen from the gallery's distance)
    G.blob(vadd(vadd(nose0, vmul(hT, sea ? 0.24 : 0.18)), vmul(U, sea ? 0.22 : 0.27)), sea ? [0.58 * hs, 0.3 * hs, 0.36 * hs] : [0.36 * hs, 0.22 * hs, 0.27 * hs], { ws: Q.eye[0], hs: Q.eye[1], part: 7, fur: 0, wt: bare(0.8), col: () => NOSE }); }
  // whiskers: fine, fanned out and a little forward from the pads, with a gentle sweep; two short ones over each eye
  { const n = Q.whiskers;
    for (const s of [-1, 1]) {
      for (let i = 0; i < n; i++) {
        const f = n > 1 ? i / (n - 1) : 0.5, c0 = pad(s), root = [c0[0] + s * 0.42 * hs, c0[1] + (0.2 - 0.42 * f) * hs, c0[2] + 0.12 - 0.2 * ((i * 7) % 3) / 2];
        const d = vnorm([s * 1.0, 0.3 - 0.62 * f, 0.34]), len = (1.7 - 0.45 * Math.abs(f - 0.4)) * (sea ? 0.9 : 1), pts = [];
        // a hair, not a rod: thin at its root (under two centimetres across on the near build), drooping in a curve,
        // tapering to a tenth at its tip, dark at the root and pale along its length
        const nq = tier === 'far' ? 2 : fine ? 4 : 3; for (let q = 0; q <= nq; q++) { const u = q / nq; pts.push(vadd(vadd(root, vmul(d, len * u)), [0, -0.16 * u * u * len, -0.26 * u * u])); }
        const w0 = fine ? 0.009 : tier === 'mid' ? 0.03 : 0.06, wd = nq === 2 ? [1, 0.7, 0.2] : nq === 3 ? [1, 0.8, 0.55, 0.2] : [1, 0.85, 0.62, 0.36, 0.1];
        G.ribbon(pts, wd.map((x) => x * w0), { nrm: [0, 0.4, 0.9], side: true, part: 5, col: (t) => mix3(WHISKER_ROOT, WHISKER, sstep(0, 0.35, t)), wt: [1, 0, 0, s * (0.6 + 0.4 * f)] });
      }
      if (Q.face && fine) {
        const e = hSurf(hk(0.44), PI / 2 - s * 0.8), d = vnorm([s * 0.6, 1, -0.5]), pts = [];
        for (let q = 0; q <= 2; q++) pts.push(vadd(e.p, vmul(d, 0.5 * q / 2)));
        G.ribbon(pts, [0.008, 0.006, 0.002], { nrm: [0, 0.3, 1], side: true, part: 5, col: () => WHISKER, wt: [1, 0, 0, s * 0.5] });
      }
    }
  }

  yield;
  // ---- arms: they grow out of the chest (the shoulder lies inside the trunk), elbow, wrist; a broad dark paw ------
  // modelled with the paws on a keyboard at tray height; the vertex shader moves them to a phone, a tablet, the lap
  const AR = sea
    ? [{ c: [1.4, 6.5, 0.8], r: 0.98 }, { c: [2.1, 5.65, 1.7], r: 0.8 }, { c: [2.2, 4.95, 2.35], r: 0.68 }, { c: [1.7, 4.88, 2.85], r: 0.58 }, { c: [1.05, 5.0, 3.05], r: 0.5 }, { c: [0.8, 5.05, 3.1], r: 0.42 }]
    : [{ c: [1.45, 7.45, 0.5], r: 1.08 }, { c: [2.0, 6.45, 1.45], r: 0.86 }, { c: [2.05, 5.62, 2.45], r: 0.72 }, { c: [1.8, 5.5, 3.3], r: 0.6 }, { c: [1.44, 5.54, 3.95], r: 0.5 }, { c: [1.3, 5.54, 4.25], r: 0.42 }];   // the shoulder's cap stands out of the trunk; a forearm with some girth
  const pawAt = sea ? [0.72, 5.1, 3.25] : [1.26, 5.5, 4.55];
  // THE ARM AS THE POSE BENDS IT: t runs 0 at the shoulder's ring to 1 at the wrist, even over the table as it always did
  // (the pose's weights go by t: the line an arm takes to a place is what it was). The rings carry their t (tt) and
  // the builder keeps each ring's middle and the arm's line there, so that the fur shader can turn a ring to face down
  // the line as posed: a round limb stays round wherever its paw goes (it was sheared flat: a board).
  // Q.cap (the near build): rings more behind the shoulder's ring that draw the arm in to a ROUND CAP inside the trunk
  // (its open end stood out of the trunk as a cut edge); they have t 0 and never move. Q.wrist: the same at the wrist,
  // drawn in inside the paw (t 1: it goes with the paw); a paw turned toward us showed the arm's open end over it.
  const armRings = (s, n) => pickSt(AR.map((a) => ({ c: [a.c[0] * s, a.c[1], a.c[2]], rx: a.r, ru: a.r, rd: a.r })), n).map((q, k) => ({ ...q, tt: k / (n - 1) }));
  const armCap = (ring) => { const T = vnorm(vsub(ring[1].c, ring[0].c)), r = ring[0].rx, h = 0.55 * r;
    return (Q.cap || []).map(([d, k]) => ({ c: vsub(ring[0].c, vmul(T, h * d)), rx: r * k, ru: r * k, rd: r * k, tt: 0, ug: r })); };   // ug: the coat's strands keep the end ring's measure round the cap, and draw in with it
  const armEnd = (ring) => { const e = ring[ring.length - 1], T = vnorm(vsub(e.c, ring[ring.length - 2].c)), r = e.rx, h = 0.8 * r;
    return (Q.wrist || []).map(([d, k]) => ({ c: vadd(e.c, vmul(T, h * d)), rx: r * k, ru: r * k, rd: r * k, tt: 1, ug: r })); };
  for (const s of [-1, 1]) {
    const mir = (c) => [c[0] * s, c[1], c[2]], ring = armRings(s, Q.arm[0]), ast = [...armCap(ring), ...ring, ...armEnd(ring)];
    // (the arm takes the coat's tufts as its first shape did: Q.armAs rings by sides, measured here on a scratch build)
    let as = null; if (Q.armAs) { const H = makeGeo(() => 0); H.loft(armRings(s, Q.armAs[0]), { sides: Q.armAs[1], up: [0, 1, 0], col: () => [0, 0, 0] }); as = H.area(); }
    G.loft(ast, { sides: Q.arm[1], up: [0, 1, 0], part: 2, comb: 1, tt: ast.map((q) => q.tt), tuftsAs: as,
      col: (k, t) => mix3(coat.flank, coat.paw, sstep(0.8, 1, t) * 0.75), wt: (t) => [0, s * sstep(0.02, 0.9, t), 0, 0], own: (t) => t });
    G.blob(mir(pawAt), sea ? [0.56, 0.34, 0.56] : [0.6, 0.29, 0.68], { ws: Q.blob[0], hs: Q.blob[1], part: 2, own: 1, fur: 0, wt: [0, s, 0, 0.25], col: () => coat.paw });
    if (Q.fingers) for (let f = 0; f < 4; f++) {
      const a = (f - 1.5) * 0.4;
      G.blob(mir([pawAt[0] + Math.sin(a) * 0.54 * (sea ? 0.6 : 1), pawAt[1] - 0.06, pawAt[2] + 0.52 + Math.cos(a) * 0.2]), [0.15, 0.13, 0.3], { ws: sea ? 4 : Q.toes || 4, hs: 3, part: 2, own: 1, fur: 0, wt: [0, s, 0, 0.25], col: () => coat.paw });
    }
  }
  // ---- hind legs: haunches bunched against the body, the flat webbed feet on the cushion in front of them ---------
  for (const s of [-1, 1]) {
    const LG = [{ c: [1.55 * s, 1.5, -0.3], r: 1.2 }, { c: [2.1 * s, 1.25, 0.5], r: 1.05 }, { c: [2.4 * s, 0.85, 1.2], r: 0.7 }, { c: [2.48 * s, 0.5, 1.7], r: 0.45 }, { c: [2.5 * s, 0.34, 2.1], r: 0.26 }];
    G.loft(pickSt(LG.map((a) => ({ c: a.c, rx: a.r * fat, ru: a.r * fat, rd: Math.min(a.r * 0.9 * fat, a.c[1] - 0.04) })), Q.leg[0]), { sides: Q.leg[1], up: [0, 1, 0], part: 3, comb: 1, col: (k, t) => mix3(coat.flank, coat.back, 0.3 + 0.4 * t), wt: () => [0, 0, 0, 0] });
    const fr = sea ? 1.5 : 1, foot = mix3(coat.flank, coat.paw, 0.5), fz = sea ? 2.9 : 2.2;
    G.blob([(2.55 + (sea ? 0.35 : 0)) * s, 0.3, fz], [0.64 * fr, 0.27, 0.95 * fr], { ws: Q.blob[0], hs: Q.blob[1], part: 3, fur: 0, wt: [0, 0, 0, 0.2], col: (u) => mix3(foot, coat.paw, sstep(0.3, 0.9, u[2]) * 0.7) });
    if (Q.fingers) for (let f = 0; f < 3; f++)
      G.blob([(2.55 + (sea ? 0.35 : 0)) * s + (f - 1) * 0.38 * fr, 0.25, fz + 0.82 * fr - Math.abs(f - 1) * 0.1], [0.18 * fr, 0.15, 0.3 * fr], { ws: 4, hs: 2, part: 3, fur: 0, wt: [0, 0, 0, 0.2], col: () => mix3(foot, coat.paw, 0.7) });
  }
  // ---- the tail: thick at the root, tapering to a point; round the right hip, forward along the cushion, and over
  // the seat's front edge, where it hangs and its end stirs -------------------------------------------------------
  // (the sea otter is slid SEA_SLIDE forward on its cushion at the end of the build: its tail's table allows for that)
  { const TL = sea
      ? [[0, 1.0, -1.5], [-1.6, 0.95, -2.0], [-2.9, 0.85, -1.6], [-3.45, 0.75, -0.9], [-3.55, 0.68, -0.2], [-3.5, 0.62, 0.5], [-3.42, 0.56, 1.3], [-3.36, 0.3, 2.15], [-3.34, -0.6, 2.82], [-3.3, -1.8, 3.02], [-3.2, -2.9, 2.9], [-3.08, -3.8, 2.6]]
      : [[0, 1.0, -1.5], [-1.6, 0.95, -2.0], [-2.9, 0.85, -1.4], [-3.45, 0.75, -0.2], [-3.55, 0.68, 1.2], [-3.5, 0.62, 2.6], [-3.42, 0.56, 3.8], [-3.36, 0.3, 4.75], [-3.34, -0.6, 5.42], [-3.3, -1.8, 5.62], [-3.2, -2.9, 5.5], [-3.08, -3.8, 5.2]];
    const tl = TL.map((c, i) => { const t = i / (TL.length - 1), r = 1.22 * (1 - 0.9 * Math.pow(t, 1.15)) * (i === TL.length - 1 ? 0.35 : 1) * (sea ? 0.92 : 1); return { c, rx: r, ru: r * 0.8, rd: c[1] > 0.45 ? Math.min(r * 0.8, c[1] - 0.02) : r * 0.8 }; });
    // its second place: laid out straight behind on the ground, six tenths as long (a lying otter's tail is a third of it)
    let run = 0; const tlAlt = tl.map((q, i) => { if (i) run += Math.hypot(...vsub(TL[i], TL[i - 1])); const t = i / (TL.length - 1), cy = 1.0 + (q.rx * 0.8 + 0.02 - 1.0) * sstep(0, 0.3, t); return { c: [0, cy, -1.5 - run * 0.62], rx: q.rx, ru: q.rx * 0.8, rd: Math.min(q.rx * 0.8, cy - 0.02) }; });
    G.loft(pickSt(tl, Q.tail[0]), { sides: Q.tail[1], up: [0, 1, 0], carry: true, alt: pickSt(tlAlt, Q.tail[0]), part: 4, comb: 1, col: (k, t, ca, sa) => mix3(coat.back, coat.flank, 0.35 * sstep(-0.3, 0.5, sa)), wt: (t) => [0, 0, sstep(0.5, 1, t), 0], own: (t) => t }); }
  // ---- the sea otter's shell and stone: a ribbed fan held on the chest, a grey pebble in the right paw ------------
  if (sea) {
    G.fan([0.1, 3.9, 2.95], [[1, 0, 0], [0, 1, 0], [0, 0, 1]], 2.0, { ribs: tier === 'near' ? 7 : tier === 'mid' ? 4 : 3, rings: tier === 'near' ? [0.4, 0.75, 1] : tier === 'mid' ? [0.55, 1] : [1],
      part: 0, own: 0.75, wt: [0, 0, 0, 0.3], light: lin('#f6e3d2'), dark: lin('#b0705e') });   // own 0.75 marks the shell, gloss 0.1 the stone: a sitter may be dealt without them
    G.blob([-0.72, 5.8, 3.75], [0.72, 0.52, 0.6], { ws: tier === 'near' ? 6 : 4, hs: tier === 'near' ? 4 : 2, part: 2, own: 1, fur: 0, wt: [0, -1, 0, 0.1], col: (u) => vmul(lin('#8d8f93'), 0.75 + 0.3 * u[1]) });
  }
  yield;
  G.smooth();
  yield;
  // ---- fur: short tufts that lie along the coat and break its outline; none on the head, which stays sleek ---------
  if (Q.tufts) {
    const long = tier === 'near' ? 1 : 1.3, k = sea ? 1.25 : 1;
    G.tufts(Math.round(Q.tufts * (sea ? (tier === 'near' ? 0.97 : 0.8) : 1)), { len: [0.15 * long * k, 0.3 * long * k], wid: (tier === 'near' ? 0.11 : 0.2) * (sea ? 1.3 : 1), lift: sea ? 0.3 : 0.2, root: 0.8, tipCol: coat.tip, tipMix: sea ? 0.3 : 0.22,
      keep: (p, n, kk) => !(kk[0] > 0.5 && kk[0] < 1.5) && kk[0] < 5.5,
      lenAt: (p, kk) => (kk[0] > 1.5 && kk[0] < 2.5 ? 0.6 : kk[0] > 2.5 && kk[0] < 3.5 ? 0.7 : kk[0] > 3.5 ? 0.8 : 1) });
  }
  G.settle(COAT_DRAWS);   // the same number of values whatever the build's detail (the far build has no tufts and still takes them)
  yield;
  // ---- the sea otter lies back: the trunk leans from the hips, the chin tucks to look down its chest --------------
  // what the shader must know of this build: its neck and hip, where its left paw rests, the turn about the hip that
  // lays its trunk flat on its back, the colour of a shut eyelid
  const pts = { neck, dev: [0, 5.6, 4.9], hip: [0, 1.2, -0.3], paw: pawAt, lie: -PI / 2, lid: sea ? vmul(coat.cream, 0.82) : mix3(coat.flank, coat.back, 0.35) };
  if (sea) {
    const hip = [0, 1.3, -0.4], lean = -0.86, K = G.K, W = G.W;
    let v = 0; const leanOf = (p) => lean * sstep(0.9, 3.6, p[1]);
    G.bendX((p) => { const part = K[v * 4]; v++; if (part > 2.5 && part < 4.5) return null; return [hip, leanOf(p)]; });
    const bend = (p, pv, a) => { const c = Math.cos(a), s = Math.sin(a), dy = p[1] - pv[1], dz = p[2] - pv[2]; return [p[0], pv[1] + dy * c - dz * s, pv[2] + dz * c + dy * s]; };
    pts.neck = bend(neck, hip, leanOf(neck));
    v = 0; G.bendX(() => { const hw = W[v * 4]; v++; return hw > 0.001 ? [pts.neck, 0.72 * hw] : null; });
    // slouched: the whole animal slid forward on the cushion, so that its back lies on the seat's back and not in it
    G.slideZ(SEA_SLIDE);
    pts.neck = [pts.neck[0], pts.neck[1], pts.neck[2] + SEA_SLIDE]; pts.dev = [0, 6.2, 3.2 + SEA_SLIDE];
    const pw = bend(pawAt, hip, leanOf(pawAt)); pts.paw = [pw[0], pw[1], pw[2] + SEA_SLIDE]; pts.hip = [hip[0], hip[1], hip[2] + SEA_SLIDE]; pts.lie = -(PI / 2 + lean);
  }
  yield;
  const g = G.build();
  g.userData = { tier, species, triangles: G.triangles, ...pts };
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 4.5, 1), 10.5);
  return g;
}
export function otterGeometry(tier = 'near', species = 'river', rnd = null) { const it = otterSteps(tier, species, rnd); let r = it.next(); while (!r.done) r = it.next(); return r.value; }
// the same, resting between steps: pause is the world's ctx.yield; rnd the world's generator for the coat (0..1 a call)
export async function otterGeometryAsync(tier = 'near', species = 'river', pause = null, rnd = null) { const it = otterSteps(tier, species, rnd); let r = it.next(); while (!r.done) { if (pause) await pause(); r = it.next(); } return r.value; }

// ------------------------------------------------------------------------------------------------------------------
// THE CABIN'S LIGHT, as this file's own shaders read it. The hard surfaces (seats, wall, trays, machines) are lit by
// the kit's interior rig; fur, screens and drinks have shaders of their own, and these uniforms point at the rig's
// own objects so that both see one sun, one ambient and one clock. The sun enters through one periodic row of oval
// windows in the wall x = 0: makeCabinLight adds that row to the rig and keeps its measures for the fur's own test.
// Nothing here is changed after build but uniform values: call update(time, camera, renderer) each frame.
//   o: { row0: index of the first row, rows: how many, sky: colour of the sky in the windows, skyIntensity }
//      far: { sky, skyIntensity }: the far wall's row of windows as well (its sky lights the fur from that side)
//      outside: { sky, skyIntensity, ground, groundIntensity, sun }: the light on otters OUTSIDE (sun: the rig's sun there as a
//               share of its strength in the cabin, 0.55 when not given); wind: [x, y, z] its direction in cabin space,
//               windGain 0..1; fog: { color, density } the world's own exponential-squared fog, for the fur alone
//      rows: hand only the rows whose blinds are up (a row with its blind down takes no sun, sky light or shaft)
//      fill: { places: [[x, y, z, reach], [x, y, z, reach]], color, intensity, from: [x, y, z] }: ONE OR TWO PLACES where the
//               fur takes a soft light of its own from one side (see FILL in the fur's fragment shader): a sitter seen
//               from its shaded side, against the bright windows, that must still read as an otter
//      cove: { color, intensity, z, ramp }: the cove's lamps over the rows whose blinds are down, for the fur (the seats take
//               them from the rig): a soft light from the ceiling, full from cabin z on and coming in over `ramp` metres before it
// uSignal = (metres of signal come so far, metres over which one row wakes): a passenger or a screen whose station
// (metres) lies behind the front is awake. A world keys it to the metres it has flown.
// ------------------------------------------------------------------------------------------------------------------
export function makeCabinLight(rig, o = {}) {
  const row0 = o.row0 ?? 0, rows = o.rows ?? 1, sky = new THREE.Color(o.sky ?? '#ffd9a6'), skyI = o.skyIntensity ?? 6;
  const z0 = row0 * DIM.PITCH + DIM.WIN_Z;
  const row = rig.addWindowRow({ origin: [0.05, DIM.WIN_Y, z0], axis: [0, 0, 1], normal: [1, 0, 0], up: [0, 1, 0], width: DIM.WIN_W, height: DIM.WIN_H, spacing: DIM.PITCH, count: rows,
    arch: 1, mullions: [1, 1], bar: 0, sky, skyIntensity: skyI, maxReach: o.maxReach ?? 1e6 });
  if (row) row.noPane = true;   // the opening is a real hole in the wall: the sky outside is the world's own
  // o.far: { sky, skyIntensity }: the same row of windows in the far wall x = CABIN_W; no sun comes in on that side
  const far = o.far ? { sky: new THREE.Color(o.far.sky ?? '#a9bdf0'), k: o.far.skyIntensity ?? 5 } : null;
  if (far) { const r2 = rig.addWindowRow({ origin: [DIM.CABIN_W - 0.05, DIM.WIN_Y, z0], axis: [0, 0, 1], normal: [-1, 0, 0], up: [0, 1, 0], width: DIM.WIN_W, height: DIM.WIN_H, spacing: DIM.PITCH, count: rows,
    arch: 1, mullions: [1, 1], bar: 0, sky: far.sky, skyIntensity: far.k, sun: false }); if (r2) { r2.noPane = true; r2.noShaft = true; } }
  const u = rig.uniforms, glow = new THREE.Color(o.glow ?? '#9fd4ff'), glowW = new THREE.Color(o.glowWait ?? '#2f7dff');
  const uniforms = {
    uTime: u.uTime, uSunDir: u.uSunDir, uSunCol: u.uSunCol, uAmbSky: u.uAmbSky, uAmbGround: u.uAmbGround, uRigInv: u.uRigInv,
    uCamL: { value: new THREE.Vector3() }, uPix: { value: 0.0026 },
    uWin: { value: new THREE.Vector4(0, DIM.WIN_Y, z0, DIM.PITCH) }, uWinN: { value: new THREE.Vector4(rows, DIM.WIN_W / 2, DIM.WIN_H / 2, 2.7) },
    uWinSky: { value: new THREE.Vector3(sky.r * skyI, sky.g * skyI, sky.b * skyI) },
    uFarX: { value: far ? DIM.CABIN_W : 0 }, uWinSky2: { value: far ? new THREE.Vector3(far.sky.r * far.k, far.sky.g * far.k, far.sky.b * far.k) : new THREE.Vector3() },
    uSignal: { value: new THREE.Vector2(1e6, 12) }, uGlowCol: { value: new THREE.Vector3(glow.r, glow.g, glow.b).multiplyScalar(o.glowGain ?? 2.2) },
    uGlowWait: { value: new THREE.Vector3(glowW.r, glowW.g, glowW.b).multiplyScalar(o.glowWaitGain ?? 3.4) },   // a WAITING glass: the blue of its three arcs
    // for the otters OUTSIDE (makeOtters' outside: true): the open sky above and what lies below as two colours times
    // their strength, the wind (a direction in cabin space, and its strength 0..1), and the world's own thin fog
    uOutSky: { value: new THREE.Vector3(0.62, 0.72, 0.95).multiplyScalar(3.2) }, uOutGround: { value: new THREE.Vector3(0.95, 0.8, 0.62).multiplyScalar(1.6) },
    uCove: { value: new THREE.Vector3() }, uCoveZ: { value: new THREE.Vector2(1e6, 1) },
    uLamp: { value: new THREE.Vector2(1e6, 0) },                                   // the reading lamps: (the first row whose lamps are lit, their strength on fur)
    uFill: { value: new THREE.Vector4(0, 0, 0, 0) }, uFill2: { value: new THREE.Vector4(0, 0, 0, 0) }, uFillCol: { value: new THREE.Vector3() }, uFillDir: { value: new THREE.Vector3(1, 0, 0) },   // TWO PLACES (each with its reach; 0: none) where the fur takes a soft light of its own
    uWind: { value: new THREE.Vector4(0, 0, 1, 1) }, uFog: { value: new THREE.Vector4(1, 1, 1, 0) }, uOutSun: { value: 0.55 },   // uOutSun: the rig's sun outside, as a share of its strength in the cabin
  };
  const col3 = (v, c, k) => { const q = new THREE.Color(c); v.set(q.r * k, q.g * k, q.b * k); };
  if (o.outside) { const q = o.outside; col3(uniforms.uOutSky.value, q.sky ?? '#9eb8f2', q.skyIntensity ?? 3.2); col3(uniforms.uOutGround.value, q.ground ?? '#f2cc9e', q.groundIntensity ?? 1.6); if (q.sun != null) uniforms.uOutSun.value = q.sun; }
  if (o.lamps) uniforms.uLamp.value.set(o.lamps.row0 ?? 1e6, o.lamps.gain ?? LAMP.GAIN);
  if (o.cove) { const q = o.cove; col3(uniforms.uCove.value, q.color ?? '#7080e0', q.intensity ?? 2); uniforms.uCoveZ.value.set(q.z ?? 0, Math.max(1, q.ramp ?? 30)); }
  if (o.fill) { const q = o.fill, d = vnorm(q.from ?? [1, 0, 0]); uniforms.uFill.value.fromArray(q.places[0]); if (q.places[1]) uniforms.uFill2.value.fromArray(q.places[1]); col3(uniforms.uFillCol.value, q.color ?? '#ffe6c8', q.intensity ?? 2); uniforms.uFillDir.value.set(d[0], d[1], d[2]); }
  if (o.wind) { const d = vnorm(o.wind); uniforms.uWind.value.set(d[0], d[1], d[2], o.windGain ?? 1); }
  if (o.fog) { const q = new THREE.Color(o.fog.color ?? '#ffffff'); uniforms.uFog.value.set(q.r, q.g, q.b, o.fog.density ?? 0); }
  const size = new THREE.Vector2();
  return {
    uniforms, row, rig,
    setSignal(metres, ramp) { uniforms.uSignal.value.x = metres; if (ramp != null) uniforms.uSignal.value.y = ramp; },
    update(time, camera, renderer) {
      if (!camera) return;
      uniforms.uCamL.value.setFromMatrixPosition(camera.matrixWorld).applyMatrix4(u.uRigInv.value);
      if (renderer) { renderer.getDrawingBufferSize(size); const f = camera.isPerspectiveCamera ? Math.tan((camera.fov * PI) / 360) : 0.58; uniforms.uPix.value = (2 * f) / Math.max(1, size.y); }
    },
  };
}

const GLSL_CABIN = /* glsl */`
uniform vec3 uSunDir, uSunCol, uAmbSky, uAmbGround, uWinSky, uCamL; uniform vec4 uWin, uWinN; uniform float uTime;
float owHash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7)))*43758.5453); }
float owNoise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3. - 2.*f);
  return mix(mix(owHash(i), owHash(i + vec2(1., 0.)), f.x), mix(owHash(i + vec2(0., 1.)), owHash(i + vec2(1., 1.)), f.x), f.y); }
// the oval of a cabin window: 1 on its outline, under 1 inside
float owOval(vec2 p){ vec2 q = abs(p)/uWinN.yz; return pow(pow(q.x, uWinN.w) + pow(q.y, uWinN.w) + 1e-6, 1./uWinN.w); }
// how much of the sun reaches a point of the cabin through the row of windows in the wall x = uWin.x (0..1)
float owSun(vec3 P){
  float t = max(P.x - uWin.x, 0.)/max(-uSunDir.x, .05);
  vec2 h = P.zy + uSunDir.zy*t;
  float k = clamp(floor((h.x - uWin.z)/uWin.w + .5), 0., uWinN.x - 1.);
  float d = owOval(vec2(h.x - uWin.z - k*uWin.w, h.y - uWin.y)) - 1.;
  float soft = (.1 + t*.014)/uWinN.y;
  return clamp(.5 - d/(2.*soft), 0., 1.)*step(uWin.x, P.x);
}
// the sky's light from the row of windows: xyz = the direction it comes from, w = how much of it the point sees
vec4 owWindow(vec3 P){
  float dp = max(P.x - uWin.x, 0.), b = P.y - uWin.y, a = P.z - uWin.z, ext = (uWinN.x - 1.)*uWin.w, ae = a - clamp(a, 0., ext);
  float area = 4.*uWinN.y*uWinN.z, d2 = dp*dp + b*b + ae*ae, id = inversesqrt(d2 + 1e-4);
  return vec4(-vec3(dp, b, ae)*id, area*dp*id/(d2 + area)*min(1. + 1.25*dp/uWin.w, uWinN.x));
}
`;

// ------------------------------------------------------------------------------------------------------------------
// FUR. One program for every otter of every build.
// Per instance:  iPos  = x, y, z, yaw            iPose = (machine 0 laptop | 1 phone | 2 tablet | 3 paws in the lap | 4 lying back,
//                                                         tapping 0..1 (pose 5: its sideways bend in radians), head turn in radians, nodding 0..1)
//                iMisc = (phase 0..1, size (negative: the animal is mirrored left for right), lean in radians, how much its screen lights it)
//                iWake = (station in metres for uSignal, how long the head turn is held 0 glances .. 1 always (pose 5: metres it STANDS
//                         on its hind legs), waiting habit 0 | 1 | 2)   iTint = coat tint
//                iReach = (a place for one paw in the animal's own space before its lean, which arm: +1 its left, -1 its right)
//                iAux  = (the other end of the head's swing in radians, 1 OUTSIDE, metres the head stays up (belly pose) or metres
//                         the trunk is drawn up (pose 5 sat up or standing: its craning's little rise), 1 no shell and stone)
// The poses beside the first five (iPose.x):
//   5 REST    sat back, one paw out to iReach (it holds its machine turned), the other in the lap; the head goes round
//             to iPose.z and back to iAux.x (toward what it holds) by the clock (a period of 14 s), held a while at each end. The same at every
//             metre flown: nothing in it reads uSignal but the wake every sitter has. (OUTSIDE, with iWake.z metres
//             given: for those metres from its station the head is lifted and comes round with the eye, by uSignal.x.)
//   6 ASLEEP  never wakes; the head tipped iPose.z radians to a side and the trunk sagging the same way, the arm of
//             that side out on the armrest (5 m aside, 4.25 m up), the other in the lap, eyes shut, slow breath
//   7 AFLOAT  on its back, head toward +z of its own space (yaw turns it), the tail straight behind and the hind feet low
//             along the water. The forepaws are FOLDED ON THE CHEST (iAux.z metres higher: a pup lies under them); a
//             sea otter with its shell (iPose.y > 0) keeps its hold and taps; habit 0 (iWake.z) grooms its cheeks in
//             bouts by the clock; one paw goes out to iReach when a place is given (a neighbour's paw). The head
//             lifts as it turns to iPose.z, by the clock. It rides a swell of 0.3 m either way, a wave of the place.
//   8 BELLY   flat on its belly, chin down, paws spread ahead, tail straight behind (about 21 m nose to tail); the
//             instance's y is the ground. The head comes up and looks round (iPose.z: how far) for iAux.z metres from
//             its station by uSignal.x (a world's metres flown), or by the clock's glance when iAux.z is 0. WITH A WAY
//             (iReach.xyz in cabin space, iReach.w 1) it SLIDES down it and climbs back by the clock (owSlide).
// OUTSIDE (iAux.y): lit by the open sky (uOutSky, uOutGround) and the sun unmasked (no window test; uOutSun its share);
// the wind (uWind) streams the tufts' tips and the whiskers, lays the ears back and runs bands of light down the coat, by
// the clock; a sitting animal's tail lies straight behind it on the ground (no seat edge to hang over).
// The coat: strands are noise in the limb's own (round, along) coordinates; the outline is broken by letting the grazing
// edge of the coat go wherever a strand is thin; the rim takes the window's gold when we look toward the light.
// ------------------------------------------------------------------------------------------------------------------
// WAITING HABIT 0, shared by the fur and by the machine itself (makeScreens): a phone or a tablet held up high for a
// signal. owSeek gives how far its middle stands from its reading place (the holder's own space, metres at size 1) and
// how it tilts (x roll, y yaw, z pitch, radians), by the clock and the holder's phase; kind 1 a phone, 2 a tablet.
const GLSL_SEEK = /* glsl */`
void rotX(inout vec3 d, float a){ float c = cos(a), s = sin(a); d.yz = vec2(d.y*c - d.z*s, d.z*c + d.y*s); }
void rotY(inout vec3 d, float a){ float c = cos(a), s = sin(a); d.xz = vec2(d.x*c + d.z*s, d.z*c - d.x*s); }
void rotZ(inout vec3 d, float a){ float c = cos(a), s = sin(a); d.xy = vec2(d.x*c + d.y*s, d.y*c - d.x*s); }
vec3 owSeek(float kind, float ph, float t, out vec3 tilt){
  float k = kind > 1.5 ? .55 : 1.;
  tilt = vec3((.3*sin(t*.83 + ph*4.) + .1*sin(t*1.9 + ph))*k, .3*sin(t*.47 + ph*2.)*k, kind > 1.5 ? -.5 : -.3);
  return (kind > 1.5 ? vec3(1., 3.85, .55) : vec3(1.35, 4.2, .8)) + vec3(.3*sin(t*.5 + ph*3.), .25*sin(t*.37 + ph*2.), .2*sin(t*.61 + ph));
}
`;
// THE SLIDE's law in plain numbers (shares of one round): going down, climbing back, the two half turns
export const SLIDE = { PERIOD: 20, DOWN: [0.06, 0.24], UP: [0.46, 0.88], TURN: [0.3, 0.44, 0.88, 0.99], PIVOT: 2.5 };
const sm01 = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
// owSlide of the fur shader: [how far down its way, how far turned (radians), how much it climbs]
export function slideAt(t, phase) {
  const c = (((t / SLIDE.PERIOD + phase) % 1) + 1) % 1, S = SLIDE;
  return [sm01(S.DOWN[0], S.DOWN[1], c) - sm01(S.UP[0], S.UP[1], c), PI * (sm01(S.TURN[0], S.TURN[1], c) + sm01(S.TURN[2], S.TURN[3], c)), sm01(S.UP[0] - 0.02, S.UP[0] + 0.04, c) * (1 - sm01(S.UP[1] - 0.04, S.UP[1], c))];
}
// THE READING LAMPS of the dusk end: Z: a pool's middle from its row's z; R2: its fall-off (m squared); GAIN: its
// strength on fur. lampLit: which seats' lamps are lit (row0: the first lit row), the fur shader's own rule.
export const LAMP = { Z: -8.6, R2: 14, GAIN: 2.2 };
export const lampLit = (row, seat, side, row0) => row >= row0 && (row * 2 + seat + side) % 3 !== 0;
// THE STANDING LAW in plain numbers (a pose 5 with `stand` metres; the fur shader and otterPoseOwn read this one table).
// HIP, ANKLE: the haunch as built (own space, the left one; the right is its mirror). HIP_IN: how far the hip is
// drawn in under the body when the leg stands (a bunched haunch lies out beside the rump). FOOT: where the ankle stands
// when the animal is on its hind legs; TOE: how far the flat foot lies forward of that ankle. FREE: where a paw that
// holds nothing hangs before the belly (before the lift; the left one, the right its mirror): BOTH paws of an animal
// given no reach (the one stood up in its seat), the other paw of one that holds something (the bay's stander).
// TAIL_R: the round the tail lies in on the seat, behind and to the left;
// TAIL_DOWN: metres of tail over which it comes down from the rump to the seat. SHOULDER, WRIST, ARM, POLE: the HELD ARM
// of one that stands AND IS GIVEN A REACH (the bay's stander alone since round OF) is laid ring by ring on a line of its own from the risen shoulder to the wrist at the paw's place:
// straight when the place is an arm's length off, its elbow sagging toward POLE by what the arm has to spare when it is
// nearer (it was carried there by a weight on every ring, and came out a long bent pipe).
export const STAND_LAW = { HIP: [1.55, 1.5, -0.3], ANKLE: [2.5, 0.34, 2.1], HIP_IN: 0.35, FOOT: [1.6, 0.34, 0.0], TOE: 0.45, FREE: [1.9, 4.2, 2.4], TAIL_R: 2.6, TAIL_DOWN: 4.6,
  SHOULDER: [1.45, 7.45, 0.5], WRIST: [1.3, 5.54, 4.25], ARM: 4.8, POLE: [0, -0.2, 1] };   // the arm's own ends as built (the left one) and its length between them; POLE: the side its elbow sags to
const OTTER_VERT = /* glsl */`
attribute vec4 iPos, iPose, iMisc, iReach, iAux, aK, aW, aAlt; attribute vec3 iTint, color, iWake, aAx; attribute vec2 aUv;
uniform vec2 uSignal, uCoveZ; uniform vec3 uNeck, uDev, uHip, uPaw, uLid, uWinSky2, uOutSky, uCove; uniform vec4 uWind; uniform float uPix, uFarX, uLie, uSea;
varying vec3 vP, vN, vC, vCove, vRim, vGlow; varying vec2 vUv; varying vec4 vK, vWinA, vWinB;
${GLSL_CABIN}
${GLSL_SEEK}
// lying down: the whole animal turned about its hip by a; on its back it is turned end for end as well, so that the
// head of a lying animal is toward +z of its own space whichever way up it lies
vec3 owLie(vec3 q, float a, float flip){ vec3 d = q - uHip; rotX(d, a); if (flip > .5) d.xz = -d.xz; return uHip + d; }
// A LIMB'S RING TURNS WITH THE LIMB'S LINE. The pose carries an arm's paw to a place by sliding every ring of the arm
// some share of the way (its weight): the arm's LINE bends, and a ring left standing as it was built is then no longer
// across the line (slid far enough it lies along it, and the round arm is a flat board with last pose's normals on
// it). So each ring is turned about its own middle by the least turn that takes the line as built (a) to the line as
// posed (b), and its normal with it: r the vertex from its ring's middle, n its normal.
void owTurn(inout vec3 r, inout vec3 n, vec3 a, vec3 b){
  a *= inversesqrt(max(dot(a, a), 1e-8)); b *= inversesqrt(max(dot(b, b), 1e-8));
  vec3 k = cross(a, b); float c = dot(a, b), h = 1./max(1. + c, .02);
  r = r*c + cross(k, r) + k*(dot(k, r)*h); n = n*c + cross(k, n) + k*(dot(k, n)*h);
}
// THE SLIDE (a belly pose with a way given), by the clock and the animal's phase, one round every ${SLIDE.PERIOD} s with no jump:
// x = how far down its way it is (0 at the top .. 1), y = how far it is turned about (radians: half a turn at the
// foot, the other half at the top), z = how much it is climbing (0..1)
vec3 owSlide(float t, float ph){
  float c = fract(t/${SLIDE.PERIOD.toFixed(1)} + ph);
  return vec3(smoothstep(${SLIDE.DOWN[0]}, ${SLIDE.DOWN[1]}, c) - smoothstep(${SLIDE.UP[0]}, ${SLIDE.UP[1]}, c), 3.14159265*(smoothstep(${SLIDE.TURN[0]}, ${SLIDE.TURN[1]}, c) + smoothstep(${SLIDE.TURN[2]}, ${SLIDE.TURN[3]}, c)),
    smoothstep(${SLIDE.UP[0]} - .02, ${SLIDE.UP[0]} + .04, c)*(1. - smoothstep(${SLIDE.UP[1]} - .04, ${SLIDE.UP[1]}, c)));
}
void main(){
  vec3 p = position, n = normal;
  float part = aK.x, own = aK.y, hw = aW.x, aw = abs(aW.y), side = sign(aW.y + 1e-6), tw = aW.z, ph = iMisc.x*6.2832, t = uTime;
  float kind = iPose.x, awake = smoothstep(0., max(uSignal.y, .01), uSignal.x - iWake.x), outside = step(.5, iAux.y);
  bool rest = kind > 4.5 && kind < 5.5, asleep = kind > 5.5 && kind < 6.5, onBack = kind > 6.5 && kind < 7.5, onBelly = kind > 7.5, lying = kind > 6.5;
  bool tail = part > 3.5 && part < 4.5, leg = part > 2.5 && part < 3.5;
  vec3 slide = onBelly && iReach.w > .5 ? owSlide(t, iMisc.x) : vec3(0.); float pawHeld = 0., heldLine = 0.;
  if (asleep) awake = 0.;
  if (rest) awake = 1.;                                   // the hero: ONE state all flight, whatever the signal does
  // WAITING IS NOT SLEEPING. Until its station a sitter (poses 0 to 3) keeps one of three habits, by the clock:
  //   0 (a phone or a tablet) holds its machine up high in its window-side paw and tilts it about, looking up at it
  //   1 (a laptop) one claw of its aisle-side paw taps the deck's near edge, slowly; the other paw lies in its lap
  //   2 (any) its chin rests on its aisle-side paw; it looks to its window and back
  bool sit = kind < 3.5, hb0 = sit && iWake.z < .5 && kind > .5 && kind < 2.5, hb1 = sit && !hb0 && iWake.z < 1.5 && kind < .5, hb2 = sit && !hb0 && !hb1;
  float wait = sit ? 1. - awake : 0.;
  vec3 tilt = vec3(0.), held = (kind < 1.5 ? vec3(0., 6.85, 3.52) : vec3(0., 6.5, 3.9)) + owSeek(kind, ph, t, tilt);
  // where the head turns: down to its machine, now and then (or always) round to the window; a nod. Waiting, it looks
  // about by its habit and never hangs.
  float glance = mix(smoothstep(.5, .85, sin(t*.23 + ph*5.)), 1., iWake.y), glance2 = smoothstep(-.35, .35, sin(t*.31 + ph*5.));
  float yaw = iPose.z*glance*(sit ? 1. - .5*awake*(1. - iWake.y) : 1.) + .06*sin(t*.4 + ph*3.), roll = 0.;
  float pitch = (kind < .5 ? .26 : kind < 1.5 ? .36 : kind < 2.5 ? .46 : kind < 3.5 ? .2 : 0.)*(1. - .85*glance*step(.2, abs(iPose.z))) + iPose.w*.15*sin(t*2.2 + ph) + .02*sin(t*.63 + ph*2.);
  if (hb0){ yaw = mix(yaw, .4 + .14*sin(t*.5 + ph*3.), wait); pitch = mix(pitch, -.22 + .05*sin(t*.37 + ph*2.), wait); roll = -.12*wait; }
  if (hb1){ roll = wait*.17*sin(t*.7 + ph*2.); pitch -= wait*.1; }
  if (hb2){ yaw = mix(yaw, iPose.z*(.25 + .5*glance2), wait); pitch = mix(pitch, .12, wait); roll = -.07*wait; }
  // the chin, as the head carries it (for the paw that props it)
  vec3 chin = vec3(0., .85, 2.55); rotX(chin, pitch); rotY(chin, yaw); rotZ(chin, roll); chin += uNeck;
  // a sitter dealt without its shell and stone: they close to a point inside its chest
  if (iAux.w > .5 && ((part < .5 && own > .7) || (part > 1.5 && part < 2.5 && aW.w > .05 && aW.w < .15))){ p = uNeck - vec3(0., 3., 0.); aw = 0.; }
  // (a pose 5 sat up or stood: what its shoulders rise and sway by; the held paw stays down, so that arm's line takes it off)
  // STANDING (iWake.y metres, a pose 5 only): the animal is on its hind legs, its hips that far over where they sat.
  // The whole body goes up by it, UNSTRETCHED (standY); the trunk's own draw (iAux.z) stays a small thing. The craning
  // bob of one that stands is in its knees (standY), of one sat up in its trunk (riseV.y); the sway is from the hips.
  float stand = rest ? iWake.y : 0., crane = rest ? step(.5, iAux.z + stand)*(1. - iAux.y) : 0., bob = crane*(.3*sin(t*1.3 + ph*3.) + .14*sin(t*2.9 + ph));
  vec3 riseV = rest ? vec3(crane*.3*sin(t*.9 + ph*2.), iAux.z + (stand > .5 ? 0. : bob), 0.) : vec3(0.);
  float standY = stand > .5 ? stand + bob : 0.;
  // lying down, and sitting outside (no seat's edge to hang over), the tail takes its second place: straight behind on the ground
  if ((lying || outside > .5) && tail){ p = aAlt.xyz; n = normalize(vec3(p.x, p.y - aAlt.w, -.12) + vec3(0., 1e-4, 0.)); }
  // ONE THAT STANDS lays its tail on the seat in a round behind it and to its left: the straight tail's own rings, laid
  // along a circle of ${STAND_LAW.TAIL_R.toFixed(1)} m. Its root comes down from the risen rump over the first ${STAND_LAW.TAIL_DOWN.toFixed(1)} m of tail, and over
  // those metres it goes less far round by what the slope takes (cs), so that the tail is not drawn out by its fall
  if (stand > .5 && tail){
    float s = max(-1.5 - aAlt.z, 0.), u = clamp(s/${STAND_LAW.TAIL_DOWN.toFixed(1)}, 0., 1.), g = u*u*(3. - 2.*u), sl = stand/${STAND_LAW.TAIL_DOWN.toFixed(1)}, cs = .6*sl*sl + .03;
    float th = (s - cs*${STAND_LAW.TAIL_DOWN.toFixed(1)}*u*u*u*(10. - 15.*u + 6.*u*u))/${STAND_LAW.TAIL_R.toFixed(1)}, ct = cos(th), sn = sin(th);
    vec3 o = vec3(ct, 0., sn)*aAlt.x + vec3(0., aAlt.y - aAlt.w, 0.);
    p = vec3(${STAND_LAW.TAIL_R.toFixed(1)}*(1. - ct), aAlt.w + standY*(1. - g), -1.5 - ${STAND_LAW.TAIL_R.toFixed(1)}*sn) + o; n = normalize(o + vec3(0., 1e-4, 0.));
  }
  vec3 p0 = p;
  // the screen's light on the face and chest, worked out in the animal's own rest space
  // (a waiting glass lights it too, by its three arcs: vGlow.y tells the fragment which light it is; a machine held up
  // high lights the face from where it is held; no machine, no light: paws in the lap, lying back, asleep, the hero)
  // A GLASS LIGHTS WHAT IT FACES AND NOTHING UNDER ITS OWN DECK: a laptop's light stops at the tray it stands on (face,
  // throat, chest and the paws on the keys take it; belly, haunches, hind feet and tail do not: they were a fuzzy
  // blue-white under a gold head)
  { vec3 d = (hb0 ? mix(uDev, held, wait) : uDev) - p; float d2 = dot(d, d), has = kind < 2.5 ? iMisc.w : 0.;
    float cut = kind < .5 ? smoothstep(uDev.y - 1.3, uDev.y - .2, p.y) : smoothstep(uDev.y - 3.2, uDev.y - 1.2, p.y);
    vGlow = vec3(max(dot(n, d)*inversesqrt(d2 + 1e-4)*.8 + .2, 0.)/(1. + d2*.07)*has*cut*mix(.8, 1., awake), awake, outside); }
  // a waiting glass's light is not steady: the brightening that runs up its three arcs (the screens' own law: the same
  // clock and the sitter's own phase) lifts the blue on the face and chest and lets it fall again
  { vec3 run = (vec3(fract(t*.42 + iMisc.x)*4.6) - vec3(1., 2., 3.))*1.15; vGlow.x *= mix(1., .62 + .5*dot(exp(-run*run), vec3(1.)), wait); }
  // breathing (slower in sleep)
  float br = sin(t*(asleep ? 1.05 : 1.7) + ph);
  if (part < .5) p += n*(.11*br*smoothstep(1.2, 4.5, p0.y)*(1. - hw));
  p.y += .05*br*smoothstep(3., 7., p0.y);
  // a passenger's sway: the shoulders ride the aircraft a little
  if (!lying) p.x += .07*sin(t*.53 + ph*1.3)*smoothstep(2., 9., p0.y);
  // arms: from the keyboard to the machine in hand, to the lap, or out to a place; paws tap
  float w = aw*aw*(3. - 2.*aw);
  // (how fast that weight grows along the limb, a step of w for a step of t: the limb's line as posed is its own line
  // and this much of the paw's way. Taken over 0.15 of t either way and not at the point: where the paw is carried back
  // against the arm's own reach the line turns about within a ring's breadth, and the rings then come round over three
  // rings and do not flip between two. limb is 1 on a vertex that has a ring to turn)
  vec2 tu = clamp((vec2(own + .15, own - .15) - .02)/.88, 0., 1.); tu = tu*tu*(3. - 2.*tu); tu = tu*tu*(3. - 2.*tu);
  float wt = (tu.x - tu.y)/.3, limb = step(1e-6, dot(aAx, aAx));
  vec3 pawR = vec3(side*uPaw.x, uPaw.y, uPaw.z), lap = vec3(-side*.22, -1.85, -1.45);
  if (aw > 0. && !lying){
    vec3 off = kind < .5 ? vec3(0.) : kind < 1.5 ? vec3(-side*.26, .78, -1.2) : kind < 2.5 ? vec3(side*.5, -.05, -.5) : kind < 3.5 ? lap : vec3(0.);
    float tap = iPose.y*awake, rate = 6.5 + 3.*fract(iMisc.x*7.3);
    float beat = max(sin(t*rate + ph + side*1.7), 0.); beat *= beat;
    float lift = kind > 3.5 ? step(side, 0.)*.55*max(sin(t*4.2 + ph), 0.) : kind > .5 && kind < 1.5 ? .16*beat : .4*beat;
    if (sit && wait > 0.){
      vec3 offW = off;
      if (side > 0.){ if (hb0){ vec3 gr = vec3(0., kind < 1.5 ? -1.25 : -1.75, -.22); rotX(gr, tilt.z); rotY(gr, tilt.y); rotZ(gr, tilt.x); offW = held + gr - pawR; } else if (hb1) offW = lap; }
      else { if (hb0) offW = lap; else if (hb1) offW = vec3(.1, .03, -1.2); else offW = chin + vec3(.2, -.42, -.1) - pawR; }
      off = mix(off, offW, wait);
      if (hb1 && side < 0.) p.y += w*wait*.26*pow(max(sin(t*2.3 + ph), 0.), 3.);                       // one claw taps, slowly
    }
    if (rest){
      // the hero's rest: one paw out to the place given (it holds its machine turned); the other forearm lies on its
      // own thigh, well behind its machine (the paw's place is given as it stands AFTER the lean, and turned back
      // here); the held paw shifts its grip now and then, the other is still
      bool out_ = side*iReach.w > .5;
      vec3 th = vec3(side*1.5, 2.1, .4); rotX(th, -iMisc.z); th += vec3(0., 1.2, -.3);
      if (stand > .5) th = vec3(side*${STAND_LAW.FREE[0].toFixed(2)}, ${STAND_LAW.FREE[1].toFixed(2)}, ${STAND_LAW.FREE[2].toFixed(2)});          // one that stands: a paw that holds nothing hangs before its belly (both, when no reach is given: iReach.w is then 0)
      off = out_ ? iReach.xyz - pawR : th - pawR; tap = 0.;
      if (out_) p.y += w*.07*pow(max(sin(t*.8 + ph*3.), 0.), 6.);
    }
    if (asleep){ off = side*iPose.z > 0. ? vec3(side*5., 4.25, 1.5) - pawR : lap; tap = 0.; }   // one arm out along the armrest, on the side the head tips to
    vec3 mv = off + vec3(tap*.1*sin(t*rate*.23 + ph*3. + side), lift*tap, tap*.14*sin(t*rate*.31 + ph*2.)*(kind < .5 ? 1. : .2));
    if (rest && stand > .5 && side*iReach.w > .5 && limb > .5){
      // THE HELD ARM OF ONE THAT STANDS, on its own line (STAND_LAW): ring t stands f(t) of the way from the shoulder
      // to the wrist (f: the built arm's own share of its length at t), the elbow sagging by what the arm has to spare
      float f = 1. - pow(max(1. - own, 1e-4), 1.6), fp = 1.6*pow(max(1. - own, 1e-4), .6);
      vec3 S1 = vec3(side*${STAND_LAW.SHOULDER[0].toFixed(2)}, ${STAND_LAW.SHOULDER[1].toFixed(2)}, ${STAND_LAW.SHOULDER[2].toFixed(2)}) + riseV*.947 + vec3(0., standY, 0.), dv = vec3(side*${STAND_LAW.WRIST[0].toFixed(2)}, ${STAND_LAW.WRIST[1].toFixed(2)}, ${STAND_LAW.WRIST[2].toFixed(2)}) + off - S1;
      float d2 = max(dot(dv, dv), 1e-4), dl = sqrt(d2), sag = .6366*sqrt(max(dl*(${STAND_LAW.ARM.toFixed(2)} - dl), 0.));
      vec3 q = vec3(side*${STAND_LAW.POLE[0].toFixed(2)}, ${STAND_LAW.POLE[1].toFixed(2)}, ${STAND_LAW.POLE[2].toFixed(2)}), E = q - dv*(dot(q, dv)/d2); E *= inversesqrt(max(dot(E, E), 1e-6));
      vec3 C = S1 + dv*f + E*(sag*sin(3.14159265*f)), dC = (dv + E*(sag*3.14159265*cos(3.14159265*f)))*fp;
      vec3 r = position - aAlt.xyz; owTurn(r, n, aAx, dC); p += C + r - position; heldLine = 1.;
    } else {
    p += mv*w;
    if (limb > .5){
      // THE LINE AS POSED takes ALL that moves the arm: the paw's slide (mv, by the weight's growth) AND THE RISE. The
      // rise lifts a ring by its own built height (kc), so along a FREE arm the line turns by the rise's growth with
      // height times the line's own climb (it was left out: the free arm's rings lay along the arm, a flat paddle); a
      // HELD arm's paw stays down, so its line loses the whole lift (rise and standing) by the weight's growth
      vec3 ln = mv*wt;
      if (rest){ float hd = step(.5, side*iReach.w), u = clamp((aAlt.y - 1.)/7.5, 0., 1.), kc = u*u*(3. - 2.*u);
        ln += riseV*(.8*u*(1. - u)*aAx.y*(1. - w*hd)) - (riseV*kc + vec3(0., standY, 0.))*(wt*hd); }
      vec3 r = position - aAlt.xyz, r0 = r; owTurn(r, n, aAx, aAx + ln); p += r - r0;
    }
    }
  }
  // flat on the belly the forelegs are stout and the haunches lie low and close to the flanks (it is seen from near)
  if (onBelly){ if (part > 1.5 && part < 2.5) p += n*.18; if (leg){ p.x *= .9; p.y *= .82; } }
  // the tail's end stirs
  p.x += tw*tw*.3*sin(t*.9 + ph*2.); p.z += tw*tw*.2*sin(t*.6 + ph)*(lying ? 0. : 1.);
  // whiskers twitch in bursts; ears flick, and stand when the signal is back
  if (part > 4.5 && part < 5.5){ float burst = smoothstep(.25, .9, sin(t*.9 + ph*4.)); p.y += own*own*.14*burst*sin(t*11. + ph*9. + aW.w*2.); p.z += own*own*.08*burst*cos(t*9. + ph*5.); }
  if (part > 5.5 && part < 6.5){ float fl = pow(max(sin(t*.7 + ph*8. + position.x), 0.), 24.); p.y += own*(.1*awake - .05 + .12*fl); p.z -= own*.12*fl; }
  // the head, by the angles worked out above (the poses below have their own)
  if (hw > 0.){
    vec3 nk = uNeck;
    if (rest){
      // the hero's rest: the head goes round to iPose.z (the aisle, and us) and back to iAux.x (its own machine's glass) by the
      // clock, held a while at each end; it lifts and tips a little as it comes round to us
      float g = smoothstep(-.42, .42, sin(t*.45 + ph*5.));
      // OUTSIDE (the one sat up on the roof): for iWake.z metres from its station (a world's metres flown) its head
      // is lifted and comes round with the eye, from iPose.z to iAux.x; before and after, the clock's swing
      float m = uSignal.x - iWake.x, up = outside > .5 && iWake.z > .5 ? smoothstep(0., 7., m)*(1. - smoothstep(iWake.z - 7., iWake.z, m)) : 0.;
      g = mix(g, 1. - smoothstep(0., max(iWake.z, 1.), m), up);
      yaw = mix(iAux.x, iPose.z, g) + .05*sin(t*.4 + ph*3.); roll = .1*g*sign(iPose.z + 1e-6);
      // (seated upright indoors: at the iAux.x end the head is cocked over toward the side it looks round to; by the clock, with g)
      if (iAux.z + stand < .5 && outside < .5 && abs(iPose.y) < .01) roll -= ${HEAD_COCK.toFixed(2)}*(1. - g)*sign(iPose.z + 1e-6);
      // (seated, rise 0: at the iAux.x end it looks DOWN at what it holds; stood up it looks level)
      pitch = mix(iAux.z + stand > .5 ? .14 : .3, -.04, g) - .2*up + iPose.w*.1*sin(t*2.2 + ph) + .02*sin(t*.63 + ph*2.);
    }
    if (asleep){ yaw = .25*iPose.z; roll = iPose.z*(1. + .04*br); pitch = .04 + .04*br; }   // the head tipped to a side, riding the breath
    if (onBack){ yaw = iPose.z*glance + .05*sin(t*.4 + ph*3.); pitch = (uSea > .5 ? 0. : .45) + .34*glance + .05*sin(t*.5 + ph*2.); }   // afloat the head LIFTS as it turns to iPose.z, by the clock
    if (onBelly){
      // flat out, the chin down: the skull turned into the line of the trunk about its own back; the head comes up
      // and looks round for iAux.z metres from the station (a world's metres flown), or by the clock when that is 0
      float m = uSignal.x - iWake.x, up = iAux.z > .5 ? smoothstep(0., 7., m)*(1. - smoothstep(iAux.z - 7., iAux.z, m)) : glance;
      if (iReach.w > .5) up = mix(.5, .9, slide.z);                              // on its slide the head is held up: half way going down, high on the climb
      nk = uNeck + vec3(0., 2.3, .1);
      { vec3 d = p - uNeck; float a = (.13 - .9*up)*hw; rotX(d, a); p = uNeck + d; rotX(n, a); }   // the neck lies low, and rises
      pitch = -1.36 + .5*up + .03*sin(t*.63 + ph*2.); yaw = 0.; roll = -up*iPose.z*(.82 + .18*sin(t*.55 + ph*3.));   // it lifts its head and turns it iPose.z to one side, and holds it there
    }
    vec3 d = p - nk; rotX(d, pitch*hw); rotY(d, yaw*hw); rotZ(d, roll*hw); p = nk + d; rotX(n, pitch*hw); rotY(n, yaw*hw); rotZ(n, roll*hw);
  }
  // SAT UP (pose 5 with a rise, iAux.z metres): the haunches and the tail stay where they are and the trunk is drawn
  // up between hip and shoulder (a small thing: the plan gives no more than a tenth of the trunk to one that stands);
  // head, shoulders and the free paw rise whole, the held paw stays at its place (iReach; an animal given no reach has
  // no held paw, and both its paws rise with it). A rise of 0 changes nothing.
  // An INSIDE animal stood up CRANES by the clock: it bobs a little taller and shorter and sways from its hips, as an
  // otter stood to look does (the held paw stays at its place; the one on the roof, in the wind, does not).
  // STANDING (iWake.y metres): the whole body goes up by standY, as it is, and THE HIND LEGS STRAIGHTEN: each haunch is
  // turned about its hip from where it lay bunched on the seat to stand under the animal (the least turn, its fur and
  // normals with it), drawn along its own line to the length from the risen hip to the ankle on the seat (a folded leg
  // unfolds: it is longer straight than bunched), and the flat foot stays on the seat under it, its toes forward.
  if (rest && !leg && !tail){
    float free = (1. - w*step(.5, side*iReach.w))*(1. - heldLine), k = smoothstep(1., 8.5, p0.y);
    p += (riseV*k + vec3(0., standY, 0.))*free;
  }
  if (stand > .5 && leg){
    float sd = sign(p0.x + 1e-6);
    vec3 A = vec3(sd*${STAND_LAW.HIP[0].toFixed(2)}, ${STAND_LAW.HIP[1].toFixed(2)}, ${STAND_LAW.HIP[2].toFixed(2)}), B = vec3(sd*${STAND_LAW.ANKLE[0].toFixed(2)}, ${STAND_LAW.ANKLE[1].toFixed(2)}, ${STAND_LAW.ANKLE[2].toFixed(2)}), B1 = vec3(sd*${STAND_LAW.FOOT[0].toFixed(2)}, ${STAND_LAW.FOOT[1].toFixed(2)}, ${STAND_LAW.FOOT[2].toFixed(2)});
    if (aK.z < .5) p += B1 - B + vec3(0., 0., ${STAND_LAW.TOE.toFixed(2)});                             // the bare foot and its toes: flat on the seat
    else { vec3 A1 = A + vec3(-sd*${STAND_LAW.HIP_IN.toFixed(2)}, standY, 0.), d0 = B - A, d1 = B1 - A1, r = p - A; float l0 = length(d0), l1 = length(d1); vec3 e1 = d1/l1;
      owTurn(r, n, d0, d1); r += e1*(dot(r, e1)*(l1/l0 - 1.)); p = A1 + r; }
  }
  // shut eyes in sleep: the bead sinks to a lid of the coat's colour, a dark line left along its lower edge
  vec3 tint = color; float gloss = aW.w;
  if (asleep && part > 6.5 && own > .25){ p -= n*.07; gloss = 0.; tint = normal.y < -.25 && aW.w < 1.5 ? color : uLid; if (aW.w > 1.5) p -= n*.09; }
  if (!lying){
    // the whole animal leans from its hips
    // (one that stands leans from its risen hips; its legs and its tail stay on the seat as they stand)
    float lk = stand > .5 && (leg || tail) ? 0. : 1., a = lk*iMisc.z*smoothstep(.4, 5., p0.y); vec3 hip = vec3(0., 1.2 + stand, -.3), d = p - hip; rotX(d, a);
    // asleep it sags to the side its head tips to
    // (POSE.REST: iPose.y radians of BEND, the whole animal tipped sideways from its hips toward its own +x: a window
    // seat's sitter leaning to its window; a rest never taps, so the number is free)
    float az = asleep ? .34*iPose.z*smoothstep(1.5, 9., p0.y) : rest ? lk*iPose.y*smoothstep(.4, 5., p0.y) : 0.; rotZ(d, az); p = hip + d; rotX(n, a); rotZ(n, az);
  } else {
    // on the back: trunk, head, arms and legs turn over about the hip; on the belly the legs stay bunched on the
    // ground and the rest is lifted clear of it; the tail lies where its second place put it
    float a = onBack ? uLie : uLie + 3.14159265, flip = onBack ? 1. : 0., lift = onBack ? 0. : 1.3;
    // (a sea otter is built lying half back already: afloat its hind legs are turned DOWN, so that the feet lie low
    // along the water and do not stand up)
    float al = a + (onBack && leg ? .5*uSea : 0.);
    if (!tail && !(onBelly && leg)){ p = owLie(p, al, flip) + vec3(0., lift, 0.); vec3 q = n; rotX(q, al); if (flip > .5) q.xz = -q.xz; n = q; }
    if (tail) p.y += lift*(1. - smoothstep(0., .3, own));
    if (aw > 0.){
      float sx = onBack ? -side : side; vec3 to = owLie(pawR, a, flip) + vec3(0., lift, 0.), want = to;
      if (onBelly){
        // paws spread on the ground ahead; on the climb of its slide they step in turn
        float st = t*5.5 + side*1.5708;
        want = vec3(sx*3., .36 + slide.z*.5*max(sin(st), 0.), uHip.z + 8.5 + slide.z*1.1*cos(st));
      } else {
        // AFLOAT: THE FOREPAWS ARE FOLDED ON THE CHEST (iAux.z metres higher and twice that lower down the belly: a
        // pup lies under them). A sea otter
        // with its shell (iPose.y > 0) keeps its hold and taps. Habit 0 GROOMS: in bouts by the clock both paws go up
        // to the cheeks and rub. One paw goes out to iReach when a place is given (it holds a neighbour's paw there).
        if (iPose.y < .01 || uSea < .5) want = vec3(sx*(.75 + .3*uSea), 3.7 + .5*uSea + iAux.z, uHip.z + 4.9 + .15*sx - 2.*iAux.z);
        if (iPose.y < .01 && iWake.z < .5){
          float bout = smoothstep(.1, .5, sin(t*.31 + ph*3.)), rb = t*7. + side*2.;
          want = mix(want, owLie(uNeck + vec3(0., 1.9, 2.1), a, flip) + vec3(sx*1.5, .25 + .3*sin(rb), .25*cos(rb)), bout);
        }
        if (iReach.w > .5 && sx*iReach.x > 0.){ want = iReach.xyz; pawHeld = w; }
      }
      p += (want - to)*w;
      if (limb > .5){                                                                                 // the arm's rings turn with its line, lying too
        vec3 ax = aAx, r = position + (onBelly ? normal*.18 : vec3(0.)) - aAlt.xyz; rotX(ax, al); rotX(r, al); if (flip > .5){ ax.xz = -ax.xz; r.xz = -r.xz; }
        vec3 r0 = r; owTurn(r, n, ax, ax + (want - to)*wt); p += r - r0;
      }
      if (onBack && iPose.y > .01) p.y += w*step(side, 0.)*.5*max(sin(t*4.2 + ph), 0.)*iPose.y;      // the stone taps
    }
    // afloat: the body rolls a little (a held paw stays where it is held); the swell comes below, by the place
    if (onBack) p.y += .05*p.x*sin(t*.4 + ph*2.)*(1. - pawHeld);
    // on the climb of its slide the whole animal waddles
    if (slide.z > 0.){ rotY(p, .07*slide.z*sin(t*5.5)); p.y += .12*slide.z*abs(sin(t*5.5)); }
  }
  float sz = abs(iMisc.y), mir = iMisc.y < 0. ? -1. : 1.;
  p.x *= mir; n.x *= mir;
  p *= sz;
  // THE SLIDE: turned about its own middle (half a turn at the foot of its way, the other half at the top), then
  // carried down its way (iReach.xyz, cabin space) and back, the way bowed iPose.w metres at its middle
  if (iReach.w > .5 && onBelly){ p.z -= ${SLIDE.PIVOT.toFixed(1)}*sz; rotY(p, slide.y); p.z += ${SLIDE.PIVOT.toFixed(1)}*sz; rotY(n, slide.y); }
  rotY(p, iPos.w); rotY(n, iPos.w); p += iPos.xyz;
  if (iReach.w > .5 && onBelly) p += iReach.xyz*slide.x + vec3(0., iPose.w*4.*slide.x*(1. - slide.x), 0.);
  // AFLOAT: the swell is a wave of the PLACE (cabin space), 0.3 m either way: neighbours ride it one after another
  // and two paws held at one place stay together
  if (onBack) p.y += .3*sin(t*.55 + dot(p.xz, vec2(.05, .08)));
  // OUTSIDE: the wind takes the coat. Tuft tips stream downwind and flutter, whiskers and ears lie back with it,
  // the tail's end shivers; all by the clock and the place, in cabin space (uWind = direction, strength)
  if (outside > .5){
    vec3 wd = uWind.xyz; float k = uWind.w*sz, gust = .6 + .4*sin(t*1.3 + ph + dot(p, wd)*.35), flut = sin(t*13. + dot(p, vec3(3.1, 2.3, 2.7)) + ph*7.);
    if (aK.z > 1.5) p += (wd*(.24*gust + .09*flut) - normalize(n + vec3(1e-5))*.05)*(aK.w*k);
    if (part > 4.5 && part < 5.5) p += wd*(own*own*(.75*gust + .12*flut)*k);
    if (part > 5.5 && part < 6.5) p += wd*(own*(.1*gust + .04*flut)*k);
    p += wd*(tw*tw*.08*flut*k);
  }
  // whiskers hold a pixel and a half of width at any distance
  if (part > 4.5 && part < 5.5){ float dist = length(uCamL - p), half_ = abs(aUv.x)*sz; p += normalize(n + vec3(1e-5))*max(.75*uPix*min(dist, 90.) - half_, 0.); }
  vP = p; vN = n; vUv = aUv; vK = vec4(part, aK.z, aK.w, gloss);
  vC = tint*(aK.z > .5 ? iTint : vec3(1.));
  // THE WINDOWS' LIGHT BY PLACE: where it comes from and how much of it this place sees (vWinA the sun wall's row,
  // vWinB the far wall's, the same row seen in a mirror); the fragment turns it on its own smooth normal, so that no
  // face of a limb shows as a flat step of light. vRim: the same light whatever the normal (the rim, the floor).
  vec4 wl = owWindow(p); vWinA = wl; vRim = uWinSky*wl.w;
  { vec4 w2 = owWindow(vec3(uFarX - p.x, p.y, p.z)); w2.x = -w2.x; w2.w *= step(.5, uFarX); vWinB = w2; vRim += uWinSky2*w2.w; }
  // the cove's lamps over the rows whose blinds are down: a soft light from the ceiling, by the place along the cabin
  { vCove = uCove*smoothstep(uCoveZ.x - uCoveZ.y, uCoveZ.x, p.z); vRim += vCove*.4; }
  // in the rows whose windows are open the room is bright and a glass's light counts for less (by the place)
  vGlow.x *= 1. - .6*min(4.*wl.w, 1.);
  // outside no window lights it: the open sky is its rim, and its fill comes in the fragment's own hemisphere
  if (outside > .5){ vRim = uOutSky*.5; vWinA.w = 0.; vWinB.w = 0.; vCove = vec3(0.); }
  gl_Position = projectionMatrix*viewMatrix*modelMatrix*vec4(p, 1.);
}`;
const OTTER_FRAG = /* glsl */`
uniform vec3 uGlowCol, uGlowWait, uOutSky, uOutGround, uWinSky2; uniform vec3 uFillCol, uFillDir; uniform vec4 uWind, uFog, uFill, uFill2; uniform float uOutSun; uniform vec2 uLamp;
varying vec3 vP, vN, vC, vCove, vRim, vGlow; varying vec2 vUv; varying vec4 vK, vWinA, vWinB;
${GLSL_CABIN}
void main(){
  vec3 N = normalize(vN + vec3(0., 1e-5, 0.)), V = normalize(uCamL - vP + vec3(0., 1e-5, 0.));
  float part = vK.x, fur = clamp(vK.y, 0., 1.), tip = clamp(vK.z, 0., 1.), gloss = vK.w, outside = step(.5, vGlow.z);
  bool whisker = part > 4.5 && part < 5.5, tuft = vK.y > 1.5;
  if (!whisker && !tuft && dot(N, V) < 0.) N = -N;                                  // a closed body seen from either side (a mirrored animal too)
  float nv = whisker ? 1. : tuft ? max(dot(N, V), 0.) : abs(dot(N, V));
  // strands run along the limb, clumps across them; a broader streak under both, so that the coat reads from afar
  vec2 q = vUv*vec2(6.5, 1.05);
  float s1 = owNoise(q), s2 = owNoise(q*2.6 + 7.3), s3 = owNoise(vUv*vec2(2.3, .4) + 11.7), clump = owNoise(vUv*vec2(1.3, .5) + 3.1), strand = s1*.46 + s2*.3 + s3*.24;
  // the outline of the coat breaks into hair: the grazing edge goes where its strand is thin
  if (fur > .5 && !tuft && 1. - nv > .76 + .26*owNoise(vUv*vec2(9., 1.6) + 1.7)) discard;
  // tufts are for the outline: face on, the coat is sleek and its hair is the strand noise alone
  // (in the wind outside a few more of them are kept)
  if (tuft && nv > mix(.42, .56, outside) + .2*owNoise(vUv*vec2(5., 2.) + 4.3)) discard;
  float sf = (.5 + .95*strand)*(.8 + .4*clump);
  vec3 alb = vC*mix(1., sf, fur);
  alb *= mix(1., 1.12, tip*fur);
  // outside, the wind runs through the coat: bands of light and shade travel down it along the wind
  alb *= 1. + .17*outside*uWind.w*fur*sin(dot(vP, uWind.xyz)*1.6 - uTime*7. + 5.*strand + 3.*clump);
  float mask = mix(owSun(vP), 1., outside), nl = dot(N, uSunDir);                    // outside the sun is unmasked: no window stands between
  float key = mix(max(nl, 0.), smoothstep(-.35, .8, nl)*.9, fur);
  // THE FUR'S SHARE OF THE SUN: a coat is not a mirror of the sun's colour. Inside, fur takes 0.62 of the sun's
  // strength (outside uOutSun), its colour 0.4 of the way to white: a brown coat in the low sun stays brown and
  // does not go to one flat orange. Bare parts (nose, eyes, paws) take the sun as it is.
  // (the windows' gold sky likewise: on fur every warm light of the room is taken 0.4 of the way to white)
  vec3 sunF = mix(uSunCol, vec3(dot(uSunCol, vec3(.3, .5, .2))), .4*fur)*mix(mix(1., .62, fur), uOutSun, outside);
  vec3 winA = mix(uWinSky, vec3(dot(uWinSky, vec3(.3, .5, .2))), .4*fur)*vWinA.w, winB = mix(uWinSky2, vec3(dot(uWinSky2, vec3(.3, .5, .2))), .4*fur)*vWinB.w;
  vec3 sun = sunF*mask, hemi = mix(mix(uAmbGround, uAmbSky, N.y*.5 + .5), mix(uOutGround, uOutSky, N.y*.5 + .5), outside);
  // the windows' sky and the cove's lamps, turned on the fragment's own normal (their share by place comes from the vertex)
  vec3 irr = winA*max((.35 + dot(N, normalize(vWinA.xyz + vec3(1e-5, 0., 0.))))/1.35, 0.)
    + winB*max((.35 + dot(N, normalize(vWinB.xyz + vec3(1e-5, 0., 0.))))/1.35, 0.) + vCove*max((.45 + N.y)/1.45, 0.);
  // a pale coat (the cream throat and chest) is held down in direct sun and in the window's own light: it must not burn out white
  float pale = 1./(1. + 4.5*max(dot(alb, vec3(.3, .5, .2)) - .16, 0.));
  // FILL (uFill, uFill2: two places of the cabin, each with its reach; the world names the hero's window seat and the
  // seat of the one stood up): fur there is seen from its SHADED side, against the bright windows: by the hemisphere
  // alone it was a dark shape with a gold rim.
  // There it takes one soft light from uFillDir (the cabin's side: what the sunlit seats, tray and carpet throw back),
  // wrapped well round the body and held on a pale coat, so that the coat reads brown, the chest and muzzle cream and
  // the strands show. The sun, the window's light and the rim are as everywhere. A law of the place: the same at every metre flown.
  float fr = max(uFill.w, .001), fr2 = max(uFill2.w, .001);
  float fill = max(step(.002, uFill.w)*(1. - smoothstep(.75*fr, fr, distance(vP, uFill.xyz))), step(.002, uFill2.w)*(1. - smoothstep(.75*fr2, fr2, distance(vP, uFill2.xyz))));
  // the soft light is not steady: cloud passing the windows lets it rise and fall in broad slow bands that drift over
  // the coat (by the place and the world's clock; a sixth either way at the most)
  fill *= .84 + .32*smoothstep(-.6, .6, sin(dot(vP, vec3(.5, .9, .35)) - uTime*1.3)*sin(dot(vP, vec3(-.4, .3, .8)) + uTime*.9 + 1.7));
  vec3 lit = irr*mix(1., pale, .7) + sun*key*pale + uFillCol*(fill*max((.45 + dot(N, uFillDir))/1.45, 0.)*mix(1., pale, .5));
  // THE FLOOR (by the place, the same at every metre and from every side): no fur is SEEN under a quarter of its lit
  // colour. Its lit strength at a place is what the same coat takes turned to the light there: the room's ambient,
  // the windows' sky as this place sees it, the cove, and the fur's share of the sun wherever the windows stand
  // open (outside: the open sky and the sun). The page's grade lets the darks fall steeply (a quarter of the light
  // shows as far less than a quarter), so the law holds the shade to FLOOR (${FUR_FLOOR.toFixed(2)}) of that strength, in the cool of
  // the room's own ambient (outside: of the open sky), a little stronger from above so that the shaded side keeps
  // its form, and lets it go as the light itself comes up to it: lit fur is as it was. In the shade the coat's own
  // colour is duller (0.45 of the way to grey) and its strands are shallow, as diffuse light shows them. A sitter
  // seen from its shaded side against bright windows is a brown otter with a pale chest, not a black shape.
  // (the windows' own sky counts for no more than it gives an aisle seat: hard by a window the shade is not the brighter for it)
  vec3 wsk = winA + winB; wsk *= min(1., 1./max(dot(wsk, vec3(.3, .5, .2)), 1e-3));
  vec3 room = mix(mix(uAmbGround, uAmbSky, .6) + wsk + vCove + sunF*(.9*smoothstep(.01, .06, vWinA.w)), mix(uOutGround, uOutSky, .6) + sunF*.9, outside);
  vec3 cool = mix(mix(uAmbGround, uAmbSky, .6), mix(uOutGround, uOutSky, .6), outside); cool = mix(vec3(1.), cool/max(dot(cool, vec3(.3, .5, .2)), 1e-3), .4);
  vec3 E = hemi + lit; float Lf = ${FUR_FLOOR.toFixed(2)}*dot(room, vec3(.3, .5, .2))*mix(1., pale, fur)*(.8 + .2*N.y), kf = max(1. - .6*dot(E, vec3(.3, .5, .2))/max(Lf, 1e-3), 0.);
  vec3 albF = mix(vC, vec3(dot(vC, vec3(.3, .5, .2))), .45*fur)*mix(1., .7 + .3*sf, fur);
  vec3 col = .3183*(alb*E + albF*cool*(Lf*kf*kf));
  // the halo: hair edges and tuft tips catch the low sun and the window's own light when we look toward them
  float fres = 1. - nv; fres = fres*fres*(.4 + .6*fres);
  float back = smoothstep(-.25, .85, dot(-V, uSunDir));
  vec3 tipC = mix(alb*3., vec3(1., .78, .52), .45)/(1. + 2.4*dot(alb, vec3(.3, .5, .2)));   // a pale coat's halo is held down: it must not burn out
  float toSun = smoothstep(-.4, .3, nl);                                            // a tuft on the shaded side stays in the shade
  col += tipC*fur*.3183*(sun*(fres*(.06 + .8*back*back) + tip*toSun*(.03 + .3*back*back)) + vRim*(fres*.5 + tip*.08)*(.5 + .5*strand) + hemi*fres*.55);
  // sheen along a sleek coat; wet highlights on the eyes and the nose (the sun, and the window itself as a light)
  vec3 H = normalize(uSunDir + V + vec3(0., 1e-4, 0.)); float nh = max(dot(N, H), 0.);
  col += sun*fur*.012*pow(nh, 12.)*(.4 + strand);
  if (gloss > .01 && gloss < 1.5){
    vec4 wl = owWindow(vP); vec3 H2 = normalize(wl.xyz + V + vec3(0., 1e-4, 0.));
    float bead = step(.9, gloss);                                                    // eyes and nose: a tight glint, no pale ring round the bead
    col += (sun*.5*pow(nh, 70.) + uWinSky*min(wl.w*6., 1.)*mix(.3, .1, bead)*pow(max(dot(N, H2), 0.), mix(48., 110., bead)) + hemi*.1*pow(clamp(1. - nv, 0., 1.), 3.)*(1. - bead))*gloss;
  }
  // the small light in an eye: on the bead itself, up and toward the eye that looks at it, from every side (gloss 1.2 marks an eye)
  if (gloss > 1.1 && gloss < 1.5) col += vec3(1.1)*smoothstep(.966, .986, dot(N, normalize(V + vec3(-.2, .75, .1))));
  if (whisker) col = vC*.3183*(hemi*.7 + vRim*.3 + sun*.1);                        // whiskers are lit from every side, and softly
  // the machine's own light: a waiting glass lights its sitter a saturated blue (its three arcs), an awake one brighter and paler
  // (a quarter of it comes off the coat's sheen, whatever the coat's colour: a brown coat would swallow a blue light whole)
  // (a bare paw takes a third of the coat's flat sheen: paws on the keys are dark paws in a glass's light, not blue mitts)
  col += (alb*.75 + mix(.03, .1, fur))*mix(uGlowWait, uGlowCol, vGlow.y)*vGlow.x*mix(1., .6 + .5*strand, fur)*(whisker ? .08 : 1.);
  // THE READING LAMPS of the dusk end, by PLACE (lampLit below holds the same rule in plain numbers): from the row
  // uLamp.x on, two seats in three have their lamp lit; under a lit lamp the fur stands in a warm pool from above.
  // No light of the rig, nothing by the lens or the clock.
  { float ux = min(vP.x, ${DIM.CABIN_W.toFixed(1)} - vP.x), sd = step(${(DIM.CABIN_W / 2).toFixed(1)}, vP.x), st = clamp(floor((ux - 1.4)/10.), 0., 2.), row = floor((vP.z + 11.5)/${DIM.PITCH.toFixed(1)});
    float lit = step(.5, mod(row*2. + st + sd, 3.))*step(uLamp.x - .5, row)*(1. - outside);
    vec2 dl = vec2(ux - (6.4 + 10.*st), vP.z - (row*${DIM.PITCH.toFixed(1)} + (${LAMP.Z.toFixed(1)})));
    col += alb*vec3(1., .7, .4)*(uLamp.y*lit*exp(-dot(dl, dl)/${LAMP.R2.toFixed(1)})*max((.35 + N.y)/1.35, 0.)*smoothstep(8., 12., vP.y)); }
  // the world's own thin fog (uFog = colour, density; density 0 leaves it out)
  { vec3 dv = uCamL - vP; col = mix(uFog.rgb, col, exp(-min(uFog.w*uFog.w*dot(dv, dv), 60.))); }
  gl_FragColor = vec4(col, 1.);
}`;

const OTTER_DEFAULT = { yaw: PI, pose: 0, tap: 1, look: 0, nod: 0, phase: 0, scale: 1, lean: 0, glow: 1, station: -1e6, hold: 0, habit: 2, tint: [1, 1, 1], mirror: false,
  look2: 0, reach: null, reachArm: 0, outside: false, span: 0, plain: false, rise: 0, stand: 0, slide: null, bow: 0, bend: 0 };
export const POSE = { LAPTOP: 0, PHONE: 1, TABLET: 2, LAP: 3, LYING_BACK: 4, REST: 5, ASLEEP: 6, AFLOAT: 7, BELLY: 8 };
// a place of the cabin in a sitter's own space as it stands before its lean (what the fur shader's iReach wants)
function reachOwn(a, c) {
  const p = a.position || [0, 0, 0], sc = a.scale || 1, cy = Math.cos(a.yaw), sy = Math.sin(a.yaw), dx = (c[0] - p[0]) / sc, dy = (c[1] - p[1]) / sc, dz = (c[2] - p[2]) / sc;
  const x0 = (dx * cy - dz * sy) * (a.mirror ? -1 : 1), z = dz * cy + dx * sy, hy = 1.2 + (a.stand || 0), hz = -0.3, cl = Math.cos(-a.lean), sl = Math.sin(-a.lean), ez = z - hz;
  const cb = Math.cos(-(a.bend || 0)), sb = Math.sin(-(a.bend || 0)), x = x0 * cb + (dy - hy) * sb, ey = (dy - hy) * cb - x0 * sb;   // the sideways bend undone first (the shader bends last)
  return [x, hy + ey * cl - ez * sl, hz + ez * cl + ey * sl];
}
// One instanced draw of otters of one build. list: [{ position: [x,y,z], yaw, pose, tap, look, nod, phase, scale, lean, glow, station,
// hold, tint, mirror, and for the new poses:
//   look2      the other end of the head's swing (POSE.REST: the head goes between look and look2), radians, + is the animal's left
//   reach      [x, y, z] in CABIN space: where the middle of one paw rests (POSE.REST); turned here into the animal's own space.
//              Left out, a POSE.REST animal holds nothing: seated, each forearm lies on its own thigh; standing, both paws hang before its belly
//   reachArm   +1 its left arm, -1 its right; left out, the arm of the side the place lies on
//   habit      0 | 1 | 2: what a sitter of poses 0 to 3 does until its station (2 when left out; see WAITING in the shader)
//   outside    true: under the open sky and in the wind (see OUTSIDE above)
//   span       metres for which a POSE.BELLY head stays up after its station (0: it glances by the clock); POSE.REST
//              OUTSIDE: metres from its station for which the head is lifted and comes round with the eye, from look
//              to look2; POSE.AFLOAT: metres its folded paws lie higher (a pup lies under them)
//   reach      (POSE.AFLOAT) a place in CABIN space at the water line where one paw holds a neighbour's
//   habit      (POSE.AFLOAT, no shell) 0: it grooms its cheeks in bouts by the clock; else its paws stay folded
//   slide      (POSE.BELLY) [x, y, z] in CABIN space: it slides that far from its place on its belly and climbs back,
//              by the clock (SLIDE, slideAt); bow: metres its way rises at the middle
//   plain      true: a sea otter without its shell and stone
//   rise       metres a POSE.REST animal is SAT UP: its trunk drawn up, head and shoulders that much higher (0: seated)
//   stand      metres a POSE.REST animal STANDS on its hind legs: its hips that far over where they sat, the whole body
//              lifted unstretched, the haunches turned down and straightened under it, the feet flat on the seat, the
//              tail laid in a round on the seat (STAND_LAW); its lean is from the risen hips
//   bend       radians a POSE.REST animal is tipped SIDEWAYS from its hips toward its own left (a passenger's window side in
//              either block): a window seat's sitter leaning to its window, its paw (reach) on the window's rim }]
// lean is negative to sit back (the hero: -0.45). A mirrored sitter's look, look2 and reachArm are mirrored with it.
export function makeOtters(L, o = {}) {
  const list = o.list || [], n = list.length, g = o.geometry || otterGeometry(o.tier || 'near', o.species || 'river');
  const iPos = new Float32Array(n * 4), iPose = new Float32Array(n * 4), iMisc = new Float32Array(n * 4), iWake = new Float32Array(n * 3), iTint = new Float32Array(n * 3);
  const iReach = new Float32Array(n * 4), iAux = new Float32Array(n * 4), U = g.userData;
  list.forEach((it, i) => {
    const a = { ...OTTER_DEFAULT, ...it }, p = a.position || [0, 0, 0];
    iPos.set([p[0], p[1], p[2], a.yaw], i * 4); iPose.set([a.pose, a.pose === POSE.REST ? a.bend : a.tap, a.look, a.pose === POSE.BELLY ? a.bow : a.nod], i * 4); iMisc.set([a.phase, a.mirror ? -a.scale : a.scale, a.lean, a.glow], i * 4);
    iWake.set([a.station, a.pose === POSE.REST ? a.stand : a.hold, a.pose === POSE.REST && a.outside ? a.span : a.habit], i * 3); iTint.set(a.tint, i * 3);
    iAux.set([a.look2, a.outside ? 1 : 0, a.pose === POSE.REST ? a.rise : a.span, a.plain ? 1 : 0], i * 4);
    if (a.pose === POSE.BELLY) { if (a.slide) iReach.set([a.slide[0], a.slide[1], a.slide[2], 1], i * 4); }
    else if (a.reach) { const q = reachOwn(a, a.reach); iReach.set([q[0], q[1], q[2], a.pose === POSE.AFLOAT ? 1 : a.reachArm || (q[0] >= 0 ? 1 : -1)], i * 4); }
  });
  g.setAttribute('iPos', new THREE.InstancedBufferAttribute(iPos, 4)); g.setAttribute('iPose', new THREE.InstancedBufferAttribute(iPose, 4));
  g.setAttribute('iMisc', new THREE.InstancedBufferAttribute(iMisc, 4)); g.setAttribute('iWake', new THREE.InstancedBufferAttribute(iWake, 3));
  g.setAttribute('iTint', new THREE.InstancedBufferAttribute(iTint, 3)); g.instanceCount = n;
  g.setAttribute('iReach', new THREE.InstancedBufferAttribute(iReach, 4)); g.setAttribute('iAux', new THREE.InstancedBufferAttribute(iAux, 4));
  const material = new THREE.ShaderMaterial({
    uniforms: { ...L.uniforms, uNeck: { value: new THREE.Vector3(...U.neck) }, uDev: { value: new THREE.Vector3(...U.dev) }, uHip: { value: new THREE.Vector3(...U.hip) },
      uPaw: { value: new THREE.Vector3(...U.paw) }, uLid: { value: new THREE.Vector3(...U.lid) }, uLie: { value: U.lie }, uSea: { value: U.species === 'sea' ? 1 : 0 } },
    vertexShader: OTTER_VERT, fragmentShader: OTTER_FRAG, side: THREE.DoubleSide,
  });
  const mesh = new THREE.Mesh(g, material); mesh.frustumCulled = false; mesh.name = 'otters-' + (o.species || 'river') + '-' + (o.tier || 'near');
  return { mesh, material, count: n, triangles: g.userData.triangles * n, each: g.userData.triangles };
}

// THE FUR SHADER'S PLACE LAW AGAIN, IN PLAIN NUMBERS (for counts of clear air made in node; no picture reads it). Every
// vertex of geometry g for the makeOtters entry a at the world's clock t, awake 0..1 and m metres flown past its
// station (the belly pose's head): places in the animal's OWN space after size and mirror, before yaw and position, three
// numbers a vertex in out. a.reach (cabin space, with a.position) or a.reachOwn serves POSE.REST. Left out, as in the
// shader's own terms: the breathing swell along the normal (0.11 m), the whiskers' widening (0.18 m), the wind outside.
// Whoever changes OTTER_VERT changes this with it.
const mSm = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const mRx = (d, a) => { const c = Math.cos(a), s = Math.sin(a), y = d[1] * c - d[2] * s, z = d[2] * c + d[1] * s; d[1] = y; d[2] = z; };
const mRy = (d, a) => { const c = Math.cos(a), s = Math.sin(a), x = d[0] * c + d[2] * s, z = d[2] * c - d[0] * s; d[0] = x; d[2] = z; };
const mRz = (d, a) => { const c = Math.cos(a), s = Math.sin(a), x = d[0] * c + d[1] * s, y = d[1] * c - d[0] * s; d[0] = x; d[1] = y; };
// owTurn of the fur shader, for a place: r (from its ring's middle) turned as the limb's line a is turned to b
const mTurn = (r, a, b) => { a = vnorm(a); b = vnorm(b); const k = vcross(a, b), c = vdot(a, b), h = vdot(k, r) / Math.max(1 + c, 0.02), x = vcross(k, r); return [r[0] * c + x[0] + k[0] * h, r[1] * c + x[1] + k[1] * h, r[2] * c + x[2] + k[2] * h]; };
// owSeek of the shaders: [the rise, the tilt]
export function seekOf(kind, ph, t) {
  const k = kind > 1.5 ? 0.55 : 1, r = kind > 1.5 ? [1, 3.85, 0.55] : [1.35, 4.2, 0.8];
  return [[r[0] + 0.3 * Math.sin(t * 0.5 + ph * 3), r[1] + 0.25 * Math.sin(t * 0.37 + ph * 2), r[2] + 0.2 * Math.sin(t * 0.61 + ph)],
    [(0.3 * Math.sin(t * 0.83 + ph * 4) + 0.1 * Math.sin(t * 1.9 + ph)) * k, 0.3 * Math.sin(t * 0.47 + ph * 2) * k, kind > 1.5 ? -0.5 : -0.3]];
}
// THE BODY'S OWN LINES, for the count (one that stands must still be an otter: no part of it drawn out). Lists of rings
// (each a list of vertices) of a build: the trunk's body (the rings whose built middle lies under y 8.3), its neck
// (from the last of those up to the crown's ring) and each arm's own rings, shoulder to wrist (the caps at its two ends
// left out). lineLength: the length of the line through the rings' middles in a list of places (the built places when
// arr is null, or what otterPoseOwn wrote).
export function otterChains(g) {
  const P = g.attributes.position, K = g.attributes.aK, A = g.attributes.aAlt, X = g.attributes.aAx, T = TIERS[g.userData.tier], per = T.trunk[1] + 1, trunk = [], arms = { '-1': new Map(), 1: new Map() };
  for (let k = 0; k < T.trunk[0]; k++) trunk.push(Array.from({ length: per }, (_, i) => k * per + i));
  for (let i = 0; i < P.count; i++) { if (Math.round(K.getX(i)) !== 2 || K.getZ(i) > 1.5 || X.getX(i) ** 2 + X.getY(i) ** 2 + X.getZ(i) ** 2 < 1e-6) continue;
    const m = arms[A.getX(i) >= 0 ? 1 : -1], key = `${A.getX(i).toFixed(3)},${A.getY(i).toFixed(3)},${A.getZ(i).toFixed(3)}`; if (!m.has(key)) m.set(key, []); m.get(key).push(i); }
  const cap = (T.cap || []).length, arm = (s) => [...arms[s].values()].slice(cap, cap + T.arm[0]), midY = (r) => r.reduce((q, i) => q + P.getY(i), 0) / r.length, k0 = trunk.findIndex((r) => midY(r) >= 8.3);
  return { g, body: trunk.slice(0, k0), neck: trunk.slice(k0 - 1), arm: { '-1': arm(-1), 1: arm(1) } };
}
export function lineLength(g, rings, arr = null) {
  const P = g.attributes.position, at = (i, q) => (arr ? arr[i * 3 + q] : q === 0 ? P.getX(i) : q === 1 ? P.getY(i) : P.getZ(i)), mid = (r) => [0, 1, 2].map((q) => r.reduce((s, i) => s + at(i, q), 0) / r.length);
  let L = 0, a = mid(rings[0]); for (let k = 1; k < rings.length; k++) { const b = mid(rings[k]); L += Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]); a = b; } return L;
}
export function otterPoseOwn(g, a0, t, awake, out, m = 0) {
  const a = { ...OTTER_DEFAULT, ...a0 }, P = g.attributes.position, K = g.attributes.aK, W = g.attributes.aW, A = g.attributes.aAlt, U = g.userData, n = P.count;
  const neck = U.neck, hipU = U.hip, paw = U.paw, sea = U.species === 'sea' ? 1 : 0, lie = U.lie, sgn = (x) => (x > 0 ? 1 : x < 0 ? -1 : 0), S = Math.sin;
  const ph = a.phase * 6.2832, kind = a.pose, rest = kind === 5, asleep = kind === 6, onBack = kind === 7, onBelly = kind === 8, lying = kind > 6.5, sit = kind < 3.5;
  if (asleep) awake = 0; if (rest) awake = 1;
  const reach = a.reachOwn || (a.reach ? reachOwn(a, a.reach) : [0, 0, 0]), arm = a.reachOwn || a.reach ? a.reachArm || (reach[0] >= 0 ? 1 : -1) : 0;   // no place given: no held arm (the shader's iReach.w is then 0), both paws are free
  const hb0 = sit && a.habit < 0.5 && kind > 0.5 && kind < 2.5, hb1 = sit && !hb0 && a.habit < 1.5 && kind < 0.5, wait = sit ? 1 - awake : 0;
  const sl = onBelly && a.slide ? slideAt(t, a.phase) : [0, 0, 0];
  const [rise, tilt] = seekOf(kind, ph, t), rd = kind < 1.5 ? [0, 6.85, 3.52] : [0, 6.5, 3.9], held = vadd(rd, rise), mixf = (x, y, k) => x + (y - x) * k;
  const glance = mSm(0.5, 0.85, S(t * 0.23 + ph * 5)) * (1 - a.hold) + a.hold, glance2 = mSm(-0.35, 0.35, S(t * 0.31 + ph * 5));
  let yaw = a.look * glance * (sit ? 1 - 0.5 * awake * (1 - a.hold) : 1) + 0.06 * S(t * 0.4 + ph * 3), roll = 0;
  let pitch = (kind < 0.5 ? 0.26 : kind < 1.5 ? 0.36 : kind < 2.5 ? 0.46 : kind < 3.5 ? 0.2 : 0) * (1 - 0.85 * glance * (Math.abs(a.look) >= 0.2 ? 1 : 0)) + a.nod * 0.15 * S(t * 2.2 + ph) + 0.02 * S(t * 0.63 + ph * 2);
  if (hb0) { yaw = mixf(yaw, 0.4 + 0.14 * S(t * 0.5 + ph * 3), wait); pitch = mixf(pitch, -0.22 + 0.05 * S(t * 0.37 + ph * 2), wait); roll = -0.12 * wait; }
  else if (hb1) { roll = wait * 0.17 * S(t * 0.7 + ph * 2); pitch -= wait * 0.1; }
  else if (sit) { yaw = mixf(yaw, a.look * (0.25 + 0.5 * glance2), wait); pitch = mixf(pitch, 0.12, wait); roll = -0.07 * wait; }
  const chin = [0, 0.85, 2.55]; mRx(chin, pitch); mRy(chin, yaw); mRz(chin, roll); for (let q = 0; q < 3; q++) chin[q] += neck[q];
  const owLie = (q, an, flip) => { const d = vsub(q, hipU); mRx(d, an); if (flip) { d[0] = -d[0]; d[2] = -d[2]; } return vadd(hipU, d); };
  const AX = g.attributes.aAx, stand = rest ? a.stand || 0 : 0, crane = rest && a.rise + stand > 0.5 && !a.outside ? 1 : 0, bob = crane * (0.3 * S(t * 1.3 + ph * 3) + 0.14 * S(t * 2.9 + ph));
  const riseV = rest ? [crane * 0.3 * S(t * 0.9 + ph * 2), a.rise + (stand > 0.5 ? 0 : bob), 0] : [0, 0, 0], standY = stand > 0.5 ? stand + bob : 0, SL = STAND_LAW;   // standing: the bob is in the knees
  for (let i = 0; i < n; i++) {
    let p = [P.getX(i), P.getY(i), P.getZ(i)];
    const ax = AX ? [AX.getX(i), AX.getY(i), AX.getZ(i)] : [0, 0, 0], limb = vdot(ax, ax) > 1e-6, mid = [A.getX(i), A.getY(i), A.getZ(i)], rr = vsub(p, mid);   // the limb's line at its ring, the ring's middle
    const part = K.getX(i), own = K.getY(i), hw = W.getX(i), awS = W.getY(i), side = sgn(awS + 1e-6), tw = W.getZ(i), gl = W.getW(i);
    let aw = Math.abs(awS), heldLine = 0;
    const tail = part > 3.5 && part < 4.5, leg = part > 2.5 && part < 3.5;
    if (a.plain && ((part < 0.5 && own > 0.7) || (part > 1.5 && part < 2.5 && gl > 0.05 && gl < 0.15))) { p = [neck[0], neck[1] - 3, neck[2]]; aw = 0; }
    if ((lying || a.outside) && tail) p = [A.getX(i), A.getY(i), A.getZ(i)];
    if (stand > 0.5 && tail) {                                                                                         // one that stands: its tail in a round on the seat
      const s = Math.max(-1.5 - A.getZ(i), 0), u = Math.min(1, s / SL.TAIL_DOWN), g2 = u * u * (3 - 2 * u), q = stand / SL.TAIL_DOWN, cs = 0.6 * q * q + 0.03;
      const th = (s - cs * SL.TAIL_DOWN * u * u * u * (10 - 15 * u + 6 * u * u)) / SL.TAIL_R, ct = Math.cos(th), sn = Math.sin(th), ox = A.getX(i), oy = A.getY(i) - A.getW(i);
      p = [SL.TAIL_R * (1 - ct) + ct * ox, A.getW(i) + standY * (1 - g2) + oy, -1.5 - SL.TAIL_R * sn + sn * ox]; }
    const p0x = p[0], p0y = p[1], br = S(t * (asleep ? 1.05 : 1.7) + ph);
    p[1] += 0.05 * br * mSm(3, 7, p0y);
    if (!lying) p[0] += 0.07 * S(t * 0.53 + ph * 1.3) * mSm(2, 9, p0y);
    const w = aw * aw * (3 - 2 * aw), pawR = [side * paw[0], paw[1], paw[2]], lap = [-side * 0.22, -1.85, -1.45];
    const wAt = (x) => { const u = mSm(0.02, 0.9, x); return u * u * (3 - 2 * u); }, wt = (wAt(own + 0.15) - wAt(own - 0.15)) / 0.3;   // the weight's growth along the limb, over 0.15 of t either way
    if (aw > 0 && !lying) {
      let off = kind < 0.5 ? [0, 0, 0] : kind < 1.5 ? [-side * 0.26, 0.78, -1.2] : kind < 2.5 ? [side * 0.5, -0.05, -0.5] : kind < 3.5 ? lap : [0, 0, 0];
      let tap = a.tap * awake; const rate = 6.5 + 3 * ((a.phase * 7.3) % 1);
      let beat = Math.max(S(t * rate + ph + side * 1.7), 0); beat *= beat;
      const lift = kind > 3.5 ? (side <= 0 ? 1 : 0) * 0.55 * Math.max(S(t * 4.2 + ph), 0) : kind > 0.5 && kind < 1.5 ? 0.16 * beat : 0.4 * beat;
      if (sit && wait > 0) {
        let offW = off;
        if (side > 0) { if (hb0) { const gr = [0, kind < 1.5 ? -1.25 : -1.75, -0.22]; mRx(gr, tilt[2]); mRy(gr, tilt[1]); mRz(gr, tilt[0]); offW = vsub(vadd(held, gr), pawR); } else if (hb1) offW = lap; }
        else if (hb0) offW = lap; else if (hb1) offW = [0.1, 0.03, -1.2]; else offW = vsub(vadd(chin, [0.2, -0.42, -0.1]), pawR);
        off = vlerp(off, offW, wait);
        if (hb1 && side < 0) p[1] += w * wait * 0.26 * Math.pow(Math.max(S(t * 2.3 + ph), 0), 3);
      }
      if (rest) { const out_ = side * arm > 0.5; let th = [side * 1.5, 2.1, 0.4]; mRx(th, -a.lean); th[1] += 1.2; th[2] -= 0.3;
        if (stand > 0.5) th = [side * SL.FREE[0], SL.FREE[1], SL.FREE[2]];
        off = out_ ? vsub(reach, pawR) : vsub(th, pawR); tap = 0;
        if (out_) p[1] += w * 0.07 * Math.pow(Math.max(S(t * 0.8 + ph * 3), 0), 6); }
      if (asleep) { off = side * a.look > 0 ? [side * 5 - pawR[0], 4.25 - pawR[1], 1.5 - pawR[2]] : lap; tap = 0; }
      let mv = vadd(off, [tap * 0.1 * S(t * rate * 0.23 + ph * 3 + side), lift * tap, tap * 0.14 * S(t * rate * 0.31 + ph * 2) * (kind < 0.5 ? 1 : 0.2)]);
      if (rest && stand > 0.5 && side * arm > 0.5 && limb) {                                                           // the held arm of one that stands: on its own line
        const om = Math.max(1 - own, 1e-4), f = 1 - Math.pow(om, 1.6), fp = 1.6 * Math.pow(om, 0.6), S1 = [side * SL.SHOULDER[0] + riseV[0] * 0.947, SL.SHOULDER[1] + riseV[1] * 0.947 + standY, SL.SHOULDER[2]];
        const dv = vsub(vadd([side * SL.WRIST[0], SL.WRIST[1], SL.WRIST[2]], off), S1), d2 = Math.max(vdot(dv, dv), 1e-4), dl = Math.sqrt(d2), sag = 0.6366 * Math.sqrt(Math.max(dl * (SL.ARM - dl), 0));
        const q = [side * SL.POLE[0], SL.POLE[1], SL.POLE[2]], E = vnorm(vsub(q, vmul(dv, vdot(q, dv) / d2))), sf = sag * Math.sin(PI * f), cf = sag * PI * Math.cos(PI * f);
        const C = [S1[0] + dv[0] * f + E[0] * sf, S1[1] + dv[1] * f + E[1] * sf, S1[2] + dv[2] * f + E[2] * sf], dC = [(dv[0] + E[0] * cf) * fp, (dv[1] + E[1] * cf) * fp, (dv[2] + E[2] * cf) * fp];
        const r = mTurn(rr, ax, dC); p = [p[0] + C[0] + r[0] - P.getX(i), p[1] + C[1] + r[1] - P.getY(i), p[2] + C[2] + r[2] - P.getZ(i)]; heldLine = 1;
      } else {
      p = vadd(p, vmul(mv, w));
      if (limb) {                                                                                                      // the ring turns with the arm's line
        let ln = vmul(mv, wt);                                                                                         // the line as posed: the paw's slide and the rise
        if (rest) { const hd = side * arm > 0.5 ? 1 : 0, u = Math.min(1, Math.max(0, (mid[1] - 1) / 7.5)), kc = u * u * (3 - 2 * u), f1 = 0.8 * u * (1 - u) * ax[1] * (1 - w * hd), f2 = wt * hd;
          ln = [ln[0] + riseV[0] * f1 - riseV[0] * kc * f2, ln[1] + riseV[1] * f1 - (riseV[1] * kc + standY) * f2, ln[2]]; }
        p = vadd(p, vsub(mTurn(rr, ax, vadd(ax, ln)), rr));
      }
      }
    }
    if (onBelly) { if (part > 1.5 && part < 2.5) { const N = g.attributes.normal; p[0] += N.getX(i) * 0.18; p[1] += N.getY(i) * 0.18; p[2] += N.getZ(i) * 0.18; } if (leg) { p[0] *= 0.9; p[1] *= 0.82; } }
    p[0] += tw * tw * 0.3 * S(t * 0.9 + ph * 2); p[2] += tw * tw * 0.2 * S(t * 0.6 + ph) * (lying ? 0 : 1);
    if (part > 4.5 && part < 5.5) { const burst = mSm(0.25, 0.9, S(t * 0.9 + ph * 4)); p[1] += own * own * 0.14 * burst * S(t * 11 + ph * 9 + gl * 2); p[2] += own * own * 0.08 * burst * Math.cos(t * 9 + ph * 5); }
    if (part > 5.5 && part < 6.5) { const fl = Math.pow(Math.max(S(t * 0.7 + ph * 8 + P.getX(i)), 0), 24); p[1] += own * (0.1 * awake - 0.05 + 0.12 * fl); p[2] -= own * 0.12 * fl; }
    if (hw > 0) {
      let y = yaw, r = roll, pt = pitch, nk = neck;
      if (rest) { let g2 = mSm(-0.42, 0.42, S(t * 0.45 + ph * 5)); const spn = a.outside ? a.span : 0, up = spn > 0.5 ? mSm(0, 7, m) * (1 - mSm(spn - 7, spn, m)) : 0, dn = a.rise + stand > 0.5 ? 0.14 : 0.3;
        g2 += (1 - mSm(0, Math.max(spn, 1), m) - g2) * up;
        y = a.look2 + (a.look - a.look2) * g2 + 0.05 * S(t * 0.4 + ph * 3); r = 0.1 * g2 * sgn(a.look + 1e-6);
        if (!(a.rise + stand > 0.5) && !a.outside && Math.abs(a.bend) < 0.01) r -= HEAD_COCK * (1 - g2) * sgn(a.look + 1e-6);   // the seated rest's cocked head, as the shader has it
        pt = dn + (-0.04 - dn) * g2 - 0.2 * up + a.nod * 0.1 * S(t * 2.2 + ph) + 0.02 * S(t * 0.63 + ph * 2); }
      if (asleep) { y = 0.25 * a.look; r = a.look * (1 + 0.04 * br); pt = 0.04 + 0.04 * br; }
      if (onBack) { y = a.look * glance + 0.05 * S(t * 0.4 + ph * 3); pt = (sea ? 0 : 0.45) + 0.34 * glance + 0.05 * S(t * 0.5 + ph * 2); }
      if (onBelly) { const up = a.slide ? 0.5 + 0.4 * sl[2] : a.span > 0.5 ? mSm(0, 7, m) * (1 - mSm(a.span - 7, a.span, m)) : glance; nk = [neck[0], neck[1] + 2.3, neck[2] + 0.1];
        { const d = vsub(p, neck); mRx(d, (0.13 - 0.9 * up) * hw); p = vadd(neck, d); }
        pt = -1.36 + 0.5 * up + 0.03 * S(t * 0.63 + ph * 2); y = 0; r = -up * a.look * (0.82 + 0.18 * S(t * 0.55 + ph * 3)); }
      const d = vsub(p, nk); mRx(d, pt * hw); mRy(d, y * hw); mRz(d, r * hw); p = vadd(nk, d);
    }
    if (rest && (a.rise || stand) && !leg && !tail) {                                                                 // sat up or standing, and craning by the clock inside
      const free = (1 - w * (side * arm > 0.5 ? 1 : 0)) * (1 - heldLine), k = mSm(1, 8.5, p0y);
      p[1] += (riseV[1] * k + standY) * free; p[0] += riseV[0] * k * free; }
    if (stand > 0.5 && leg) {                                                                                          // standing: the haunch turned down and straightened, the foot flat
      const sd = p0x >= 0 ? 1 : -1, A0 = [sd * SL.HIP[0], SL.HIP[1], SL.HIP[2]], B0 = [sd * SL.ANKLE[0], SL.ANKLE[1], SL.ANKLE[2]], B1 = [sd * SL.FOOT[0], SL.FOOT[1], SL.FOOT[2]];
      if (K.getZ(i) < 0.5) p = [p[0] + B1[0] - B0[0], p[1] + B1[1] - B0[1], p[2] + B1[2] - B0[2] + SL.TOE];
      else { const A1 = [A0[0] - sd * SL.HIP_IN, A0[1] + standY, A0[2]], d0 = vsub(B0, A0), d1 = vsub(B1, A1), l1 = Math.hypot(d1[0], d1[1], d1[2]), e1 = vmul(d1, 1 / l1);
        let r = mTurn(vsub(p, A0), d0, d1); r = vadd(r, vmul(e1, vdot(r, e1) * (l1 / Math.hypot(d0[0], d0[1], d0[2]) - 1))); p = vadd(A1, r); } }
    if (!lying) { const lk = stand > 0.5 && (leg || tail) ? 0 : 1, hy = 1.2 + stand, an = lk * a.lean * mSm(0.4, 5, p0y), d = [p[0], p[1] - hy, p[2] + 0.3]; mRx(d, an); mRz(d, asleep ? 0.34 * a.look * mSm(1.5, 9, p0y) : rest ? lk * a.bend * mSm(0.4, 5, p0y) : 0); p = [d[0], hy + d[1], -0.3 + d[2]]; }
    else { const an = onBack ? lie : lie + PI, flip = onBack, lift = onBack ? 0 : 1.3, al = an + (onBack && leg ? 0.5 * sea : 0); let pawHeld = 0;
      if (!tail && !(onBelly && leg)) { p = owLie(p, al, flip); p[1] += lift; }
      if (tail) p[1] += lift * (1 - mSm(0, 0.3, own));
      if (aw > 0) { const sx = onBack ? -side : side, to = owLie(pawR, an, flip); to[1] += lift; let want = to;
        if (onBelly) { const st = t * 5.5 + side * 1.5708; want = [sx * 3, 0.36 + sl[2] * 0.5 * Math.max(S(st), 0), hipU[2] + 8.5 + sl[2] * 1.1 * Math.cos(st)]; }
        else {
          if (a.tap < 0.01 || !sea) want = [sx * (0.75 + 0.3 * sea), 3.7 + 0.5 * sea + a.span, hipU[2] + 4.9 + 0.15 * sx - 2 * a.span];
          if (a.tap < 0.01 && a.habit < 0.5) { const bout = mSm(0.1, 0.5, S(t * 0.31 + ph * 3)), rb = t * 7 + side * 2, hc = owLie(vadd(neck, [0, 1.9, 2.1]), an, flip);
            want = vlerp(want, [hc[0] + sx * 1.5, hc[1] + 0.25 + 0.3 * S(rb), hc[2] + 0.25 * Math.cos(rb)], bout); }
          if (a.reach && sx * reach[0] > 0) { want = reach; pawHeld = w; }
        }
        p[0] += (want[0] - to[0]) * w; p[1] += (want[1] - to[1]) * w; p[2] += (want[2] - to[2]) * w;
        if (limb) { const axl = [ax[0], ax[1], ax[2]], rl = onBelly ? vadd(rr, vmul([g.attributes.normal.getX(i), g.attributes.normal.getY(i), g.attributes.normal.getZ(i)], 0.18)) : [rr[0], rr[1], rr[2]];
          mRx(axl, al); mRx(rl, al); if (flip) { axl[0] = -axl[0]; axl[2] = -axl[2]; rl[0] = -rl[0]; rl[2] = -rl[2]; }
          p = vadd(p, vsub(mTurn(rl, axl, vadd(axl, vmul(vsub(want, to), wt))), rl)); }
        if (onBack && a.tap > 0.01) p[1] += w * (side <= 0 ? 1 : 0) * 0.5 * Math.max(S(t * 4.2 + ph), 0) * a.tap; }
      if (onBack) p[1] += 0.05 * p[0] * S(t * 0.4 + ph * 2) * (1 - pawHeld);
      if (sl[2] > 0) { mRy(p, 0.07 * sl[2] * S(t * 5.5)); p[1] += 0.12 * sl[2] * Math.abs(S(t * 5.5)); } }
    const sz = a.scale, mir = a.mirror ? -1 : 1; let X = p[0] * mir * sz, Y = p[1] * sz, Z = p[2] * sz;
    if (onBelly && a.slide) { const d = [X, Y, Z - SLIDE.PIVOT * sz]; mRy(d, sl[1]); X = d[0]; Z = d[2] + SLIDE.PIVOT * sz; }      // the slide's turn (its ride down its way is the caller's: slideAt)
    if (onBack) { const c = Math.cos(a.yaw), sn = Math.sin(a.yaw), q = a.position || [0, 0, 0]; Y += 0.3 * S(t * 0.55 + (q[0] + X * c + Z * sn) * 0.05 + (q[2] + Z * c - X * sn) * 0.08); }   // the swell, by the place
    out[i * 3] = X; out[i * 3 + 1] = Y; out[i * 3 + 2] = Z;
  }
  return n;
}

// ------------------------------------------------------------------------------------------------------------------
// HEADPHONES: a plain band over the head and two round cups over the ears, for river otters. They are drawn by the fur
// shader itself as bare parts of the head (head weight 1), one instanced draw, from THE SAME list entries as their
// wearers: so they ride the head's nod, turn, lean and size by the same law, the same uniforms and the same phase.
// list: the wearers' own entries of makeOtters' list. 256 triangles each. No mark, no lettering.
// ------------------------------------------------------------------------------------------------------------------
function headphoneGeometry() {
  const G = makeGeo(null), cup = lin('#3b3835'), pad = lin('#57524c'), band = lin('#4a4641'), bare = [1, 0, 0, 0.2];
  const cy = 11.45, cz = 1.5, st = [];
  for (let i = 0; i <= 8; i++) { const a = PI * (0.06 + 0.88 * (i / 8)); st.push({ c: [2.18 * Math.cos(a), cy + 1.5 * Math.sin(a), cz - 0.12 * Math.sin(a)], rx: 0.24, ru: 0.08, rd: 0.08 }); }
  G.loft(st, { sides: 6, up: [0, 0, 1], part: 1, fur: 0, comb: 1, col: () => band, wt: () => bare });
  for (const s of [-1, 1]) G.blob([s * 2.16, cy, cz], [0.78, 0.34, 0.78], { ws: 8, hs: 5, axes: [[0, 1, 0], [s, 0, 0], [0, 0, 1]], part: 1, fur: 0, wt: bare, col: (u) => (u[1] > 0.55 ? cup : pad) });
  G.smooth();
  const g = G.build();
  g.userData = { tier: 'near', species: 'river', triangles: G.triangles, neck: [0, 8.7, 0.9], dev: [0, 5.6, 4.9], hip: [0, 1.2, -0.3], paw: [1.26, 5.5, 4.55], lie: -PI / 2, lid: cup };
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 4.5, 1), 10.5);
  return g;
}
export function makeHeadphones(L, list = []) {
  const r = makeOtters(L, { list: list.map((it) => ({ ...it, tint: [1, 1, 1], glow: 0 })), geometry: headphoneGeometry() });
  r.mesh.name = 'headphones';
  return r;
}

// ------------------------------------------------------------------------------------------------------------------
// plain shapes for the hard things (position + normal; coloured and given a surface by the kit's builder)
// ------------------------------------------------------------------------------------------------------------------
const spow = (x, e) => Math.sign(x) * Math.pow(Math.abs(x), e);
// a grid of points rows[j][i] as a smooth surface; closed: the last column joins the first. flip turns the faces over.
function gridGeo(rows, closed = false, flip = false) {
  const nj = rows.length, ni = rows[0].length, P = [], I = [];
  for (const r of rows) for (const p of r) P.push(p[0], p[1], p[2]);
  const cols = closed ? ni : ni - 1;
  for (let j = 0; j < nj - 1; j++) for (let i = 0; i < cols; i++) {
    const a = j * ni + i, b = j * ni + (i + 1) % ni, c = a + ni, d = b + ni;
    if (flip) I.push(a, c, b, b, c, d); else I.push(a, b, c, b, d, c);
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setIndex(I); g.computeVertexNormals();
  return g;
}
// a fan closing a ring of points round their middle
function fanGeo(ring, flip = false) {
  const P = [], I = [], n = ring.length, c = [0, 0, 0];
  for (const p of ring) { P.push(p[0], p[1], p[2]); c[0] += p[0] / n; c[1] += p[1] / n; c[2] += p[2] / n; }
  P.push(c[0], c[1], c[2]);
  for (let i = 0; i < n; i++) { if (flip) I.push(n, (i + 1) % n, i); else I.push(n, i, (i + 1) % n); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setIndex(I); g.computeVertexNormals();
  return g;
}
// a box whose edges are bevelled and whose normals blend across the bevels (the kit's own recipe): 44 triangles
function bevelBox(w, h, d, r = 0.1) {
  const hh = [w / 2, h / 2, d / 2]; r = Math.min(r, hh[0] * 0.98, hh[1] * 0.98, hh[2] * 0.98);
  const P = [], N = [], I = [];
  const id = (ax, s, sj, sk) => ax * 8 + (s > 0 ? 4 : 0) + (sj > 0 ? 2 : 0) + (sk > 0 ? 1 : 0);
  for (let ax = 0; ax < 3; ax++) for (const s of [-1, 1]) for (const sj of [-1, 1]) for (const sk of [-1, 1]) {
    const j = (ax + 1) % 3, k = (ax + 2) % 3, p = [0, 0, 0], nn = [0, 0, 0];
    p[ax] = s * hh[ax]; p[j] = sj * (hh[j] - r); p[k] = sk * (hh[k] - r); nn[ax] = s;
    const o = id(ax, s, sj, sk) * 3; P[o] = p[0]; P[o + 1] = p[1]; P[o + 2] = p[2]; N[o] = nn[0]; N[o + 1] = nn[1]; N[o + 2] = nn[2];
  }
  const tri = (a, b, c) => {
    const ab = [P[b * 3] - P[a * 3], P[b * 3 + 1] - P[a * 3 + 1], P[b * 3 + 2] - P[a * 3 + 2]], ac = [P[c * 3] - P[a * 3], P[c * 3 + 1] - P[a * 3 + 1], P[c * 3 + 2] - P[a * 3 + 2]], n = vcross(ab, ac);
    const cx = P[a * 3] + P[b * 3] + P[c * 3], cy = P[a * 3 + 1] + P[b * 3 + 1] + P[c * 3 + 1], cz = P[a * 3 + 2] + P[b * 3 + 2] + P[c * 3 + 2];
    if (n[0] * cx + n[1] * cy + n[2] * cz >= 0) I.push(a, b, c); else I.push(a, c, b);
  };
  const quad = (a, b, c, d2) => { tri(a, b, c); tri(a, c, d2); };
  for (let ax = 0; ax < 3; ax++) for (const s of [-1, 1]) quad(id(ax, s, -1, -1), id(ax, s, 1, -1), id(ax, s, 1, 1), id(ax, s, -1, 1));
  for (let ax = 0; ax < 3; ax++) { const j = (ax + 1) % 3; for (const s of [-1, 1]) for (const sj of [-1, 1]) quad(id(ax, s, sj, -1), id(ax, s, sj, 1), id(j, sj, 1, s), id(j, sj, -1, s)); }
  for (const s0 of [-1, 1]) for (const s1 of [-1, 1]) for (const s2 of [-1, 1]) tri(id(0, s0, s1, s2), id(1, s1, s2, s0), id(2, s2, s0, s1));
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3)); g.setIndex(I);
  return g;
}
// a pillow: a superellipsoid, boxier as e falls under 1
function pillow(w, h, d, e = 0.5, seg = 8) {
  const rows = [];
  for (let r = 0; r <= seg; r++) { const th = (r / seg) * PI, st = Math.sin(th), ct = Math.cos(th), row = [];
    for (let c = 0; c < seg * 2; c++) { const ph = (c / (seg * 2)) * TAU; row.push([(w / 2) * spow(st, e) * spow(Math.cos(ph), e), (h / 2) * spow(ct, e), (d / 2) * spow(st, e) * spow(Math.sin(ph), e)]); }
    rows.push(row); }
  return gridGeo(rows, true, false);
}
const SURF = INT.SURF, sf = INT.surf;
const S_FABRIC = sf(SURF.FABRIC, 0.05), S_PLASTIC = sf(SURF.PLAIN, 0.42), S_MATTE = sf(SURF.PLAIN, 0.1), S_SHELL = sf(SURF.PLAIN, 0.3), S_METAL = sf(SURF.PLAIN, 0.62, 0.75), S_GLOSS = sf(SURF.PLAIN, 0.8), S_CARPET = sf(SURF.FABRIC, 0.02);
const S_LAMP = sf(SURF.PLAIN, 0.2, 0, 2.6), S_COVE = sf(SURF.PLAIN, 0.2, 0, 1.5), S_LID = sf(SURF.PLAIN, 0.74, 0.28), S_STICK = sf(SURF.PLAIN, 0.5);
const HUE = { seat: '#24386f', seatD: '#182a60', cloth: '#efe7d3', arm: '#8b9099', shell: '#7c8492', frame: '#565a66', wall: '#ece5d6', dado: '#b4bfd2', bezel: '#f6efdc', reveal: '#cfc4ab',
  carpet: '#3f4a6e', tray: '#c4c0b6', trayD: '#8a867e', trayLip: '#e2ded4', metal: '#aeb1b8', metalD: '#8c8f97', mach: '#8d877d', machPad: '#878177', machKey: '#6c675f', bezelD: '#0e0f12', legs: '#9a9fa8', lid: '#a3a6ab', paper: '#f4efe2', fish: '#e07a2a', fishD: '#1c2238', kelp: '#3f9a63', kelpD: '#226b48', boat: '#8f3a34', sail: '#e8683c', sailB: '#cf9a3a', wave: '#1f9fb4', waveD: '#0f5f86',
  bin: '#e4e3df', ceil: '#edebe6', seam: '#9da2ab', psu: '#cfd3d8', pocket: '#1b2a58', card: '#ebe5d2', panel: '#e0dacb', curtain: '#5468b8', galley: '#ffe3b4', galleyFloor: '#8a7a70', galleyCart: '#d9d2c4', galleyBox: '#c98a52', lamp: '#fff0d2', path: '#bcd2ff', blind: '#e6dfcd', napkin: '#f3efe4', shellA: '#2b2f45', shellB: '#e9dccb' };

// the oval of the window: a point of its outline at angle a (wall coordinates: along the cabin, up), scaled by k
const ovalAt = (a, k = 1) => { const e = 2 / 2.7; return [(DIM.WIN_W / 2) * k * spow(Math.cos(a), e), (DIM.WIN_H / 2) * k * spow(Math.sin(a), e)]; };

// ------------------------------------------------------------------------------------------------------------------
// ONE SEAT ROW: three dark blue seats with pale headrest caps and grey armrests, the carpet under them and out to the
// middle of the aisle, the cream side wall (upright to window height and curving in above, with ONE oval window), the
// bin that hangs over the seats and half of the ceiling over the aisle. Two of them face to face across the aisle
// (side: 1 is the mirror image) close the cabin's section: no sky shows but through the windows.
// Local space: the front face of the seat backs at z = 0 on the cushion, the seats facing -z, the wall at x = 0.
// The unit is exactly one pitch long (z from Z0 to Z0 + PITCH), so rows set one pitch apart join without a gap.
// o: { detail: 'far' (the same unit in fewer faces), seats: false (wall, bin, ceiling and carpet only: a doorway's bay),
//      blind: 'up' (the default) | 'half' | 'down': the window's blind. A row whose blind is down takes no sun: hand
//      makeCabinLight only the rows whose blinds are up (its row0 and rows) }
// ------------------------------------------------------------------------------------------------------------------
const UNIT_Z1 = 3.6, UNIT_Z0 = UNIT_Z1 - DIM.PITCH;
export const unitSpan = (row) => [row * DIM.PITCH + UNIT_Z0, row * DIM.PITCH + UNIT_Z1];
// THE SEAT'S TWO SOFT SOLIDS in plain numbers, the very ones the row is lofted from: the back's ring at a height
// (half width, front and rear in the row's own z; g grows it, as the headrest's cap is grown) and the cushion's pillow.
const backBulge = (y) => 0.28 * Math.exp(-Math.pow((y - 12.6) / 2.6, 2)) + 0.34 * sstep(19.2, 20.6, y);   // lumbar and headrest stand forward of the back
const backRing = (y, g = 0) => { const top = sstep(21.4, 23.0, y);
  return [(4.3 - 0.3 * sstep(9, 20, y)) * (1 - 0.2 * top * top) + g, backFront(y) - backBulge(y) - g, backFront(y) + backThick(y) * (1 - 0.45 * top * top) + g]; };
const CUSHION = { w: DIM.SEAT_W - 0.3, h: DIM.CUSHION_T + 0.5, d: DIM.SEAT_D, e: 0.42, y: DIM.CUSHION_TOP - DIM.CUSHION_T / 2 - 0.12, z: -DIM.SEAT_D / 2 + 0.1 };
// how deep a place lies INSIDE a seat's cushion or back, in metres (0: outside both). dx: from the seat's middle;
// y: the cabin's; z: the row's own (the back's front at 0 on the cushion, the seat facing -z). The depth is the least
// way out: up, forward or sideways out of the cushion; forward or rearward out of the back. [depth, 0 cushion | 1 back]
export function seatSink(dx, y, z) {
  const ax = Math.abs(dx); let deep = 0, what = 0;
  { const C = CUSHION, k = 2 / C.e, a = C.w / 2, b = C.h / 2, c = C.d / 2, u = ax / a, v = Math.abs(y - C.y) / b, w = Math.abs(z - C.z) / c;
    if (u < 1 && v < 1 && w < 1) { const fu = Math.pow(u, k), fv = Math.pow(v, k), fw = Math.pow(w, k);
      if (fu + fv + fw < 1) { const up = C.y + b * Math.pow(1 - fu - fw, 1 / k) - y, fore = (z - C.z) + c * Math.pow(1 - fu - fv, 1 / k), side = a * Math.pow(1 - fv - fw, 1 / k) - ax;
        deep = Math.min(up, fore, side); } } }
  if (y > 8.3 && y < 23.1) { const [hx, zf, zr] = backRing(Math.min(y, 23.0), y > 19.3 ? 0.1 : 0), u = ax / hx, mz = (zf + zr) / 2, hz = (zr - zf) / 2, w = Math.abs(z - mz) / hz;
    if (u < 1 && w < 1 && u * u * u * u + w * w * w * w < 1) { const reach = hz * Math.pow(1 - u * u * u * u, 0.25), d = Math.min(z - (mz - reach), mz + reach - z, hx * Math.pow(1 - w * w * w * w, 0.25) - ax);
      if (d > deep) { deep = d; what = 1; } } }
  return [deep, what];
}
function* seatRowSteps(o = {}) {
  const b = INT.makeBuilder(), D = DIM;
  const lite = o.detail === 'far', seats = o.seats !== false;   // lite: the same unit in fewer faces, for the rows a long way down the cabin
  const NS = lite ? 8 : 14, PS = lite ? 4 : 7, E = 0.5;
  const bulge = backBulge;
  const LV = lite ? [8.3, 10.2, 12.8, 16, 19.4, 20.6, 22.4, 23.0] : [8.3, 9.4, 11.2, 13.5, 16, 18.2, 19.4, 20.6, 21.7, 22.6, 23.0];
  // one ring of a seat back at height y, grown outward by g (the headrest cap is the same ring a hand larger)
  const ringAt = (cx, y, g = 0) => {
    const [hx, zf, zr] = backRing(y, g), row = [];
    for (let i = 0; i < NS; i++) { const a = (i / NS) * TAU, ca = spow(Math.cos(a), E), sa = spow(Math.sin(a), E); row.push([cx + hx * ca, y, (zf + zr) / 2 + ((zr - zf) / 2) * sa]); }
    return row;
  };
  const rear = (y) => backFront(y) + backThick(y) + 0.06;
  if (seats) for (let s = 0; s < 3; s++) {
    const cx = seatX(s);
    b.add(pillow(CUSHION.w, CUSHION.h, CUSHION.d, CUSHION.e, PS), { p: [cx, CUSHION.y, CUSHION.z], c: HUE.seat, surf: S_FABRIC, grad: [6.6, 9.2, 0.7, 1] });
    // the back: a slab lofted up its rake, rounded at the shoulders
    const rows = LV.map((y) => ringAt(cx, y));
    b.add(gridGeo(rows, true, true), { c: HUE.seat, surf: S_FABRIC, tint: (x, y, z, c) => { const k = (0.8 + 0.2 * sstep(9, 20, y)) * (0.72 + 0.28 * sstep(4.1, 3.0, Math.abs(x - cx))); c.multiplyScalar(k); } });
    b.add(fanGeo(rows[rows.length - 1], true), { c: HUE.seat, surf: S_FABRIC });
    // the pale headrest cap: ONE upholstered cover over the whole head of the seat, front, sides, top and back
    { const cap = LV.filter((y) => y >= 19.3 && y < 22.9).map((y) => ringAt(cx, y, 0.1)); cap.push(ringAt(cx, 23.0, 0.1).map((p) => [p[0], 23.1, p[2]]));
      b.add(gridGeo(cap, true, true), { c: HUE.cloth, surf: sf(SURF.FABRIC, 0.03) });
      b.add(fanGeo(cap[cap.length - 1], true), { c: HUE.cloth, surf: sf(SURF.FABRIC, 0.03) }); }
    // the hard shell on the back of the seat
    { const sh = []; for (const y of [10.2, 13, 16, 19, 21.4]) { const r = []; for (let i = 0; i <= 4; i++) { const x = cx - 3.7 + 7.4 * (i / 4); r.push([x, y, rear(y) - 0.12 * Math.pow(Math.abs(i - 2) / 2, 2)]); } sh.push(r); }
      b.add(gridGeo(sh, false, false), { c: HUE.shell, surf: S_SHELL }); }
    if (!lite) {
      // a stitched seam across the front of the back, and the pocket on its rear with a plain card standing in it
      { const y = 15.4; b.add(bevelBox(7.0, 0.16, 0.14, 0.05), { p: [cx, y, backFront(y) - bulge(y) - 0.02], c: HUE.seatD, surf: S_FABRIC }); }
      { const pk = []; for (const y of [9.9, 11.4, 13.1]) { const r = []; for (let i = 0; i <= 4; i++) { const u = i / 4 - 0.5; r.push([cx + u * 6.6, y, rear(y) + 0.08 + (0.22 + 0.2 * sstep(11, 13.1, y)) * (1 - 4 * u * u)]); } pk.push(r); }
        b.add(gridGeo(pk, false, false), { c: HUE.pocket, surf: S_FABRIC });
        b.add(bevelBox(2.4, 1.2, 0.08, 0.03), { p: [cx - 1.1, 13.3, rear(13.3) + 0.2], r: [D.RAKE, 0, 0.06], c: HUE.card, surf: S_MATTE }); }
    }
    yield;
  }
  if (seats) {
    // armrests: grey, on a short web; the two outer ones carry a side panel
    for (let k = 0; k < 4; k++) {
      const x = D.SEAT_X0 + D.ARM_W / 2 + k * (D.SEAT_W + D.ARM_W);
      b.add(bevelBox(D.ARM_W, 0.95, D.ARM_LEN, 0.3), { p: [x, D.ARM_TOP - 0.47, 0.5 - D.ARM_LEN / 2], c: HUE.arm, surf: S_PLASTIC });
      b.add(bevelBox(D.ARM_W * 0.55, D.ARM_TOP - 7.6, k === 0 || k === 3 ? D.ARM_LEN - 0.6 : 2.2, 0.12), { p: [x, (D.ARM_TOP + 6.6) / 2 - 0.4, k === 0 || k === 3 ? 0.3 - D.ARM_LEN / 2 : -0.6], c: k === 3 ? HUE.shell : HUE.frame, surf: S_SHELL });
    }
    // the frame under the seats, and A BASE THAT READS FROM THE AISLE AND FROM THE FRONT: two broad legs (each a fore
    // and an aft post on a long foot along the floor's rail), a bar across their fronts, and a shroud that closes the
    // row's aisle end from the armrest down to the carpet (a seat stands on legs and rails, never on one thin post)
    b.add(bevelBox(D.BLOCK_X1 - D.SEAT_X0 - 0.8, 2.2, 7.6, 0.3), { p: [(D.BLOCK_X1 + D.SEAT_X0) / 2, 5.6, -4.3], c: HUE.frame, surf: S_SHELL });
    const box = (w, h, d, p, c, s) => { const g = new THREE.BoxGeometry(w, h, d); g.deleteAttribute('uv'); b.add(g, { p, c, surf: s }); };
    for (const x of [seatX(0) + 1.5, seatX(2) - 1.5]) {
      box(3.0, 0.7, 7.4, [x, 0.35, -4.3], HUE.frame, S_METAL);                       // the foot on the rail
      box(2.4, 3.9, 1.3, [x, 2.6, -7.0], HUE.legs, S_METAL); if (!lite) box(2.4, 3.9, 1.3, [x, 2.6, -1.6], HUE.legs, S_METAL);
    }
    box(seatX(2) - seatX(0) - 3.0 - 2.4, 0.6, 0.6, [(seatX(0) + seatX(2)) / 2, 2.4, -7.3], HUE.legs, S_METAL);   // the bar between the legs
    b.add(bevelBox(0.8, 6.3, 7.0, 0.25), { p: [D.BLOCK_X1 - 0.9, 3.4, -4.1], c: HUE.shell, surf: S_SHELL });       // the aisle end's shroud
  }
  yield;
  // the carpet, out to the middle of the aisle
  b.quad([0, 0, UNIT_Z1 + 0.06], [D.CABIN_W / 2, 0, UNIT_Z1 + 0.06], [D.CABIN_W / 2, 0, UNIT_Z0 - 0.06], [0, 0, UNIT_Z0 - 0.06], HUE.carpet, S_CARPET);
  const ZA = UNIT_Z0 - 0.06, ZB = UNIT_Z1 + 0.06;   // a finger's lap over the next unit, so no light shows between two walls
  // the floor's own light along the aisle's edge (the path light at the foot of every block of seats): a low lit bar
  // the length of the row, a little short at either end. From above, in the rows whose blinds are down, the two
  // lines of bars run the length of the dusk and the carpet between them is no longer a blank
  if (seats) b.add(bevelBox(0.5, 0.14, D.PITCH - 3.2, 0.05), { p: [D.BLOCK_X1 + 0.5, 0.08, (UNIT_Z0 + UNIT_Z1) / 2], c: HUE.path, surf: S_COVE });
  const wallTint = (x, y, z, c) => { if (y < 13.4) c.set(HUE.dado); c.multiplyScalar(0.86 + 0.14 * sstep(34, 16, y)); };
  // the wall: rings from the oval's outline out to the edge of the unit, bent to the wall's curve
  { const NA = lite ? 28 : 56, NR = lite ? 3 : 6, cz = D.WIN_Z, cy = D.WIN_Y, rows = [];
    const edge = (a) => { const dz = Math.cos(a), dy = Math.sin(a), tz = dz > 1e-6 ? (ZB - cz) / dz : dz < -1e-6 ? (ZA - cz) / dz : 1e9, ty = dy > 1e-6 ? (D.WALL_TOP - cy) / dy : dy < -1e-6 ? (0 - cy) / dy : 1e9, t = Math.min(tz, ty); return [dz * t, dy * t]; };
    // angles that hit the four corners exactly, so the unit's edge is straight
    const angs = []; for (let i = 0; i < NA; i++) angs.push((i / NA) * TAU);
    for (const [z, y] of [[ZB, D.WALL_TOP], [ZA, D.WALL_TOP], [ZA, 0], [ZB, 0]]) { let a = Math.atan2(y - cy, z - cz); if (a < 0) a += TAU; let bi = 0; for (let i = 1; i < NA; i++) if (Math.abs(angs[i] - a) < Math.abs(angs[bi] - a)) bi = i; angs[bi] = a; }
    for (let j = 0; j <= NR; j++) { const s = Math.pow(j / NR, 1.6), row = [];
      for (const a of angs) { const o1 = ovalAt(a, 1.2), e = edge(a), l = [o1[0] + (e[0] - o1[0]) * s, o1[1] + (e[1] - o1[1]) * s]; row.push([wallX(cy + l[1]), cy + l[1], cz + l[0]]); }
      rows.push(row); }
    b.add(gridGeo(rows, true, false), { c: HUE.wall, surf: S_SHELL, tint: wallTint });
    // a strip of the wall's own colour a hand behind the joint with the next unit: two walls bent from different
    // points never meet to a hair, and what shows between them must be wall, not sky
    { const st = []; for (let j = 0; j <= 12; j++) { const y = (j / 12) * D.WALL_TOP, x = wallX(y) - 0.14; st.push([[x, y, UNIT_Z1 - 0.5], [x, y, UNIT_Z1 + 0.5]]); }
      b.add(gridGeo(st, false, true), { c: HUE.wall, surf: S_SHELL, tint: wallTint }); }
    // the panels' joints: a slim rib up the wall where one panel meets the next, another along it over the windows
    if (!lite) {
      const st = []; for (let j = 0; j <= 10; j++) { const y = 13.9 + (j / 10) * (D.BIN_Y - 13.9), x = wallX(y) + 0.07; st.push([[x, y, UNIT_Z1 - 0.3], [x, y, UNIT_Z1 - 0.06]]); }
      b.add(gridGeo(st, false, true), { c: HUE.seam, surf: S_MATTE });
      b.add(bevelBox(0.16, 0.26, D.PITCH - 0.4, 0.06), { p: [wallX(27.4) + 0.05, 27.4, (UNIT_Z0 + UNIT_Z1) / 2], c: HUE.seam, surf: S_MATTE });
    }
    // the window's surround: a soft dished bezel from the wall in to the opening, then the reveal out to the skin
    const ring = (k, x) => angs.map((a) => { const p = ovalAt(a, k); return [x + wallX(cy + p[1]), cy + p[1], cz + p[0]]; });
    b.add(gridGeo([ring(1.2, 0), ring(1.13, 0.16), ring(1.04, 0.1), ring(1.0, -0.12)], true, true), { c: HUE.bezel, surf: sf(SURF.PLAIN, 0.55) });
    b.add(gridGeo([ring(1.0, -0.12), ring(0.985, -D.WIN_DEPTH * 0.55), ring(0.97, -D.WIN_DEPTH)], true, true), { c: HUE.reveal, surf: S_MATTE });
    // the blind in the reveal. Pushed up (the default) it is a lip across the top of the opening; o.blind: 'half' draws
    // it down to the window's middle, 'down' closes the oval with a plain panel (seen as a panel from outside too)
    if (o.blind === 'down' || o.blind === 'half') {
      const N2 = lite ? 10 : 16, cap = [], low = [], half = o.blind === 'half';
      for (let i = 0; i <= N2; i++) { const a = PI * (i / N2), p = ovalAt(a, 0.99); cap.push([-0.5, cy + p[1], cz + p[0]]); low.push([-0.5, half ? cy - 0.15 : cy - p[1], cz + p[0]]); }
      b.add(gridGeo([cap, low], false, true), { c: HUE.blind, surf: S_PLASTIC });
      b.add(gridGeo([cap.map((p) => [p[0] - 0.08, p[1], p[2]]), low.map((p) => [p[0] - 0.08, p[1], p[2]])], false, false), { c: HUE.blind, surf: S_PLASTIC });
      if (half) b.add(bevelBox(0.2, 0.3, DIM.WIN_W * 0.97, 0.08), { p: [-0.42, cy - 0.15, cz], c: HUE.bezel, surf: S_PLASTIC });   // the blind's lower rail
    } else {
      const cap = []; for (let i = 0; i <= 12; i++) { const a = PI * (0.17 + 0.66 * (i / 12)), p = ovalAt(a, 0.99); cap.push([-0.5, cy + p[1], cz + p[0]]); }
      const chord = cap[0][1] - 0.02, low = cap.map((p) => [p[0], chord, p[2]]);
      b.add(gridGeo([cap, low], false, true), { c: HUE.bezel, surf: S_PLASTIC });
    }
    // a ledge along the wall at armrest height
    b.add(bevelBox(0.8, 0.9, D.PITCH, 0.25), { p: [0.3, 13.4, (UNIT_Z0 + UNIT_Z1) / 2], c: HUE.dado, surf: S_PLASTIC });
  }
  yield;
  // the bin over the seats (its flat underside, a round lip, the door's face leaning in), the lit cove at its top
  // and the ceiling out to the middle of the aisle: one section drawn the length of the unit
  { const span = (pts, c, s) => b.add(gridGeo([pts.map((p) => [p[0], p[1], ZA]), pts.map((p) => [p[0], p[1], ZB])], false, false), { c, surf: s });
    const face = [[D.BIN_X, D.BIN_Y], [D.BIN_X + 1.1, D.BIN_Y + 0.22], [D.BIN_X + 1.8, D.BIN_Y + 0.8], [D.BIN_X + 2.3, D.BIN_Y + 1.8], [D.BIN_X + 3.2, D.BIN_Y + 4.0], [D.BIN_X + 4.1, D.BIN_Y + 6.2], [D.BIN_X + 4.8, D.BIN_Y + 7.8], [D.BIN_X + 5.1, D.BIN_Y + 8.5]];
    span([[wallX(D.BIN_Y) - 0.5, D.BIN_Y], [8, D.BIN_Y], [14, D.BIN_Y], ...face], HUE.bin, S_SHELL);
    const top = face[face.length - 1], cove = [top[0] + 0.2, D.CEIL_Y - 0.3];
    span([top, cove], HUE.lamp, S_COVE);                                                     // the cove: a strip of light the length of the cabin
    span([cove, [cove[0] + 1.6, D.CEIL_Y], [31, D.CEIL_Y + 0.25], [D.CABIN_W / 2, D.CEIL_Y + 0.35]], HUE.ceil, S_SHELL);
    if (!lite) {
      // the joint between one bin door and the next, and a plain latch in the door's lower edge
      b.add(gridGeo([face.slice(2).map((p) => [p[0] + 0.05, p[1] - 0.03, UNIT_Z1 - 0.3]), face.slice(2).map((p) => [p[0] + 0.05, p[1] - 0.03, UNIT_Z1 - 0.08])], false, false), { c: HUE.seam, surf: S_MATTE });
      b.add(bevelBox(0.22, 0.62, 2.0, 0.08), { p: [D.BIN_X + 2.62, D.BIN_Y + 2.3, (UNIT_Z0 + UNIT_Z1) / 2], r: [0, 0, -0.39], c: HUE.seam, surf: S_PLASTIC });
      // under the bin: the service panel, a reading lamp and an air nozzle for each seat
      b.quad([7.5, D.BIN_Y - 0.03, ZA + 0.3], [19, D.BIN_Y - 0.03, ZA + 0.3], [19, D.BIN_Y - 0.03, ZB - 0.3], [7.5, D.BIN_Y - 0.03, ZB - 0.3], HUE.psu, S_PLASTIC);
      for (let s = 0; s < 3; s++) {
        const x = 9 + s * 4.2;
        b.add(bevelBox(0.9, 0.1, 0.9, 0.04), { p: [x, D.BIN_Y - 0.07, -6.4], c: HUE.lamp, surf: S_LAMP });
        b.add(bevelBox(0.66, 0.2, 0.66, 0.08), { p: [x, D.BIN_Y - 0.1, -8.2], c: HUE.frame, surf: S_PLASTIC });
      }
    }
  }
  yield;
  b.tessellate(lite ? 8.5 : 4.2, 0.12);
  yield;
  return b.build();
}
function seatRowGeometry(o = {}) { const it = seatRowSteps(o); let r = it.next(); while (!r.done) r = it.next(); return r.value; }

// rows: the indices of the rows to stand (row k at z = k * PITCH). One instanced draw, lit by the kit's rig.
// detail: 'far' builds the same unit in about a third of the faces, for the rows a long way off.
// side: 1 stands the rows as the far block (the unit mirrored in the cabin's middle); seats: false leaves the seats out;
// blind: 'half' | 'down' for every row of the call. makeSeatRows builds the unit's geometry in ONE unbroken step (about
// 50 ms for the near unit on a slow machine): a world uses makeSeatRowsAsync(rig, o, ctx.yield), which rests between
// the unit's pieces, and hands at most six rows to a call.
// BUILD A UNIT ONCE AND SHARE IT: seatUnitAsync(o, pause) gives the unit's geometry alone ({ detail, seats } as above;
// leave blind out: the pushed-up lip), resting between its seats, its wall and its bin. Hand it to makeSeatRows as
// o.geometry for BOTH blocks (side: 1 mirrors the mesh by its matrix; the renderer turns the winding with it) and as
// many calls as there are groups of rows: nothing is built again. o.material: one prop material shared the same way.
// Blinds then come from makeBlinds, row by row. Three geometries serve the whole cabin: near, far ({ detail: 'far' })
// and bay ({ seats: false }).
export function seatUnit(o = {}) { return seatRowGeometry(o); }
export async function seatUnitAsync(o = {}, pause = null) {
  const it = seatRowSteps(o); let r = it.next();
  while (!r.done) { if (pause) await pause(); r = it.next(); }
  return r.value;
}
export function makeSeatRows(rig, o = {}) { return seatRowMesh(rig, o, o.geometry || seatRowGeometry(o)); }
export async function makeSeatRowsAsync(rig, o = {}, pause = null) { return seatRowMesh(rig, o, o.geometry || await seatUnitAsync(o, pause)); }
function seatRowMesh(rig, o, geo) {
  const rows = o.rows || [0], material = o.material || INT.propMaterial({ rig });
  const mesh = new THREE.InstancedMesh(geo, material, rows.length), m = new THREE.Matrix4();
  rows.forEach((k, i) => mesh.setMatrixAt(i, m.makeTranslation(0, 0, k * DIM.PITCH)));
  if (o.side) { mesh.scale.x = -1; mesh.position.x = DIM.CABIN_W; }      // a mirrored mesh: the renderer turns its faces over for us
  mesh.instanceMatrix.needsUpdate = true; mesh.frustumCulled = false; mesh.name = 'seat-rows';
  const each = geo.index.count / 3;
  return { mesh, material, each, triangles: each * rows.length };
}
// BLINDS BY ROW, for units that share one geometry: list: [{ row, side, blind: 'down' | 'half' }]. 'down' closes the oval
// with a plain panel in the reveal (a panel from outside too); 'half' draws it to the window's middle, a rail along its
// lower edge. One merged mesh; a row with its blind down takes no sun (hand makeCabinLight only the rows left open).
export function makeBlinds(rig, list = [], o = {}) {
  const b = INT.makeBuilder(), W = DIM.CABIN_W, cy = DIM.WIN_Y;
  for (const it of list) {
    if (it.blind !== 'down' && it.blind !== 'half') continue;
    const side = it.side ? 1 : 0, cz = it.row * DIM.PITCH + DIM.WIN_Z, half = it.blind === 'half', N2 = 12, mx = (x) => (side ? W - x : x);
    const face = (x, flip) => { const cap = [], mid = [], low = [];
      for (let i = 0; i <= N2; i++) { const a = PI * (i / N2), p = ovalAt(a, 0.992), yl = half ? cy - 0.15 : cy - p[1]; cap.push([mx(x), cy + p[1], cz + p[0]]); mid.push([mx(x), (cy + p[1] + yl) / 2, cz + p[0]]); low.push([mx(x), yl, cz + p[0]]); }
      b.add(gridGeo([cap, mid, low], false, flip !== !!side), { c: HUE.blind, surf: S_PLASTIC }); };
    face(-0.44, true); face(-0.6, false);
    if (half) b.add(bevelBox(0.24, 0.34, DIM.WIN_W * 0.97, 0.08), { p: [mx(-0.4), cy - 0.15, cz], c: HUE.bezel, surf: S_PLASTIC });   // the blind's lower rail
  }
  if (!b.vertexCount) return { mesh: null, triangles: 0 };
  const geo = b.build(), mesh = new THREE.Mesh(geo, o.material || INT.propMaterial({ rig })); mesh.frustumCulled = false; mesh.name = 'blinds';
  return { mesh, triangles: geo.index.count / 3 };
}

// ------------------------------------------------------------------------------------------------------------------
// BULKHEADS: the partition that closes an end of the cabin, a plain panel from wall to wall and floor to ceiling,
// the aisle's doorway open on a lit galley's mouth, a blue curtain drawn back in two gathered halves (it sways from its rail).
// list: [{ z, face: 1 | -1 }]: face 1 when the cabin lies to +z of it.
// ------------------------------------------------------------------------------------------------------------------
export function makeBulkheads(rig, list = []) {
  const b = INT.makeBuilder(), D = DIM, W = D.CABIN_W, A0 = D.BLOCK_X1 - 0.6, A1 = W - A0, TOPY = D.CEIL_Y + 1.2, DOOR = 35;
  for (const it of list) {
    const z = it.z, f = it.face ?? 1;
    const q = (x0, x1, y0, y1, dz, c, s) => { const zz = z + dz * f; if (f > 0) b.quad([x0, y0, zz], [x1, y0, zz], [x1, y1, zz], [x0, y1, zz], c, s); else b.quad([x1, y0, zz], [x0, y0, zz], [x0, y1, zz], [x1, y1, zz], c, s); };
    // (at the join with the outside part: the panel is cut to the hull's own section, the plan's circle of
    // 38.4 m about (x 36.4, y 14) with its shoulder 36 to 69 degrees from the crown, so that no corner stands out through the skin)
    { const HW = (y) => { const dy = y - 14; if (dy <= 0) return W / 2 + 1; let hw = Math.sqrt(Math.max(0, 38.3 * 38.3 - dy * dy));
        for (let k = 0; k < 3; k++) { const fdeg = Math.atan2(hw, dy) * 180 / PI, r = 38.3 + 1.5 * sstep(36, 46, fdeg) * (1 - sstep(60, 69, fdeg)); hw = Math.sqrt(Math.max(0, r * r - dy * dy)); }
        return Math.min(W / 2 + 1, hw); };
      // the panel in bands, LEFT OPEN at the aisle's doorway (x A0 to A1, floor to DOOR): the doorway is a lit mouth
      const NB = 12, zz = z, cxp = W / 2, ys = [];
      for (let j = 0; j <= NB; j++) ys.push(-0.5 + (TOPY + 0.5) * (j / NB));
      ys.push(DOOR); ys.sort((u, v) => u - v);
      const band = (xa0, xa1, xb0, xb1, y0, y1) => { if (f > 0) b.quad([xa0, y0, zz], [xa1, y0, zz], [xb1, y1, zz], [xb0, y1, zz], HUE.panel, S_SHELL); else b.quad([xa1, y0, zz], [xa0, y0, zz], [xb0, y1, zz], [xb1, y1, zz], HUE.panel, S_SHELL); };
      for (let j = 0; j + 1 < ys.length; j++) { const y0 = ys[j], y1 = ys[j + 1], h0 = HW(y0), h1 = HW(y1); if (y1 - y0 < 1e-6) continue;
        if (y1 <= DOOR + 1e-6) { band(cxp - h0, A0, cxp - h1, A0, y0, y1); band(A1, cxp + h0, A1, cxp + h1, y0, y1); } else band(cxp - h0, cxp + h0, cxp - h1, cxp + h1, y0, y1); } }
    q(-1, A0, 0, 3.2, 0.06, HUE.dado, S_PLASTIC); q(A1, W + 1, 0, 3.2, 0.06, HUE.dado, S_PLASTIC);           // a kick strip
    q(A0 - 0.5, A1 + 0.5, DOOR, DOOR + 0.9, 0.3, HUE.seam, S_PLASTIC);                                          // the curtain's rail
    // THE GALLEY'S MOUTH beyond the doorway: a bay GAL metres deep whose own lamps are on (its faces carry their light:
    // no light of the scene), a counter across its back with canisters and a stack of boxes on it, a lit strip overhead
    { const GAL = 9, zb = z - f * GAL, zin = (d) => z - f * d, S_GAL = sf(SURF.PLAIN, 0.25, 0, 0.75), S_GALD = sf(SURF.PLAIN, 0.25, 0, 0.4), flip = f < 0;
      const wall = (pts, c, s2, fl, tint) => b.add(gridGeo(pts, false, fl), { c, surf: s2, tint });
      const warm = (x, y, zq, c) => { c.multiplyScalar(0.5 + 0.5 * sstep(0, DOOR, y)); };
      wall([[[A0, 0, zb], [A1, 0, zb]], [[A0, DOOR * 0.5, zb], [A1, DOOR * 0.5, zb]], [[A0, DOOR, zb], [A1, DOOR, zb]]], HUE.galley, S_GAL, flip, warm);                       // the back wall
      wall([[[A0, 0, z], [A0, 0, zb]], [[A0, DOOR, z], [A0, DOOR, zb]]], HUE.galley, S_GALD, flip, warm);                                                                      // the two sides
      wall([[[A1, 0, zb], [A1, 0, z]], [[A1, DOOR, zb], [A1, DOOR, z]]], HUE.galley, S_GALD, flip, warm);
      wall([[[A0, 0.02, z], [A1, 0.02, z]], [[A0, 0.02, zb], [A1, 0.02, zb]]], HUE.galleyFloor, S_GALD, flip);                                                                 // the floor
      wall([[[A0, DOOR, zb], [A1, DOOR, zb]], [[A0, DOOR, z], [A1, DOOR, z]]], HUE.galley, S_GALD, flip);                                                                      // the ceiling
      b.add(bevelBox(A1 - A0 - 1.6, 0.3, 1.2, 0.1), { p: [(A0 + A1) / 2, DOOR - 0.2, zin(GAL * 0.55)], c: HUE.lamp, surf: S_LAMP });                                           // its lamp
      b.add(bevelBox(A1 - A0 - 0.6, 12, 3.2, 0.3), { p: [(A0 + A1) / 2, 6, zin(GAL - 1.7)], c: HUE.galleyCart, surf: S_GALD });                                               // the counter
      for (const y of [4.1, 8.2]) b.add(bevelBox(A1 - A0 - 1.4, 0.16, 0.2, 0.05), { p: [(A0 + A1) / 2, y, zin(GAL - 3.36)], c: HUE.seam, surf: S_MATTE });
      for (const [dx, h, r] of [[-3.4, 3.4, 0.95], [-1.3, 2.6, 0.8], [0.6, 3.0, 0.9]]) { const g = new THREE.CylinderGeometry(r, r, h, 10); g.deleteAttribute('uv'); b.add(g, { p: [(A0 + A1) / 2 + dx, 12 + h / 2, zin(GAL - 1.7)], c: HUE.metal, surf: sf(SURF.PLAIN, 0.6, 0.3, 0.35) }); }
      b.add(bevelBox(2.6, 1.5, 2.2, 0.15), { p: [(A0 + A1) / 2 + 3.2, 12.75, zin(GAL - 1.8)], c: HUE.galleyBox, surf: S_GALD });
      b.add(bevelBox(2.2, 1.3, 1.9, 0.15), { p: [(A0 + A1) / 2 + 3.1, 14.15, zin(GAL - 1.8)], r: [0, 0.25, 0], c: HUE.napkin, surf: S_GALD });
      b.add(bevelBox(A1 - A0 - 0.6, 0.5, 2.4, 0.15), { p: [(A0 + A1) / 2, 23, zin(GAL - 1.3)], c: HUE.galleyCart, surf: S_GALD });                                             // a shelf
    }
    // THE CURTAIN, drawn back in two gathered halves either side of the mouth: deep folds, pinched where it is tied
    // back, its cloth's own soft light on it (it never stands as a black slab in the dusk); it sways from its rail
    const folds = 5, CW = 3.3;
    for (const sd of [0, 1]) { const rows = [];
      for (let j = 0; j <= 8; j++) { const y = 0.25 + (j / 8) * (DOOR - 0.25), tie = 1 - 0.5 * Math.exp(-Math.pow((y - 15) / 5, 2)), r = [];
        for (let i = 0; i <= folds * 2; i++) { const t = i / (folds * 2), x = sd ? A1 - CW * tie * t : A0 + CW * tie * t; r.push([x, y, z + f * (0.78 + 0.5 * Math.cos(i * PI) * (0.6 + 0.4 * (1 - j / 8)))]); }
        rows.push(r); }
      b.add(gridGeo(rows, false, (f < 0) !== !!sd), { c: HUE.curtain, surf: sf(SURF.FABRIC, 0.05, 0, 0.3), sway: [DOOR, 0, 0, 0.7], tint: (x, y, zq, c) => { c.multiplyScalar(0.7 + 0.5 * Math.abs(zq - z - f * 0.78) / 0.5); } }); }
  }
  if (!b.vertexCount) return { mesh: null, triangles: 0 };
  b.tessellate(6, 0.12);
  const geo = b.build(), mesh = new THREE.Mesh(geo, INT.propMaterial({ rig })); mesh.frustumCulled = false; mesh.name = 'bulkheads';
  return { mesh, triangles: geo.index.count / 3 };
}

// ------------------------------------------------------------------------------------------------------------------
// DRESS, the same on every visit, plain shapes of our own (no mark, no lettering, no card with pictures, no packet):
// the drinks trolley and the crew otter's fold-down seat in the bay, and the plain case the bay's stander stands on.
// NOTHING LIES ON A SEAT'S CUSHION AND NOTHING HANGS OVER A CAP OR AN ARMREST (round OF: the folded blanket, the blanket
// over a cap and the hung headphones are not built; nobody could name them).
// o: { trolley: { box: [x0, y0, z0, x1, y1, z1], cups: [[x, z], ...] } | false      (its top is the box's y1; a rail 0.6 m high round it)
//      crew: { seat: [box], back: [box] } | false      (the pad's top is the seat box's y1; the back pad lies in the back box)
//      case: { box }                        the case; left out, none is built
//      material: a prop material to share }
// Left out, the trolley and the crew's seat stand where the design puts them. Returns { mesh, triangles, tumblers: [{ position, phase }] }: the
// trolley's tumblers, for the world's own makeTumblers call (their feet stand on the trolley's top).
// ------------------------------------------------------------------------------------------------------------------
const DRESS = { trolley: { box: [47, 0, -46, 53, 20.6, -30], cups: [[48.6, -43], [51.4, -43], [48.6, -39.7], [51.4, -39.7], [48.6, -36.3], [51.4, -36.3], [48.6, -33], [51.4, -33]] },
  crew: { seat: [41.4, 0, -58.8, 50.6, 9, -50.2], back: [41.4, 9, -58.8, 50.6, 23.2, -57.4] } };
const HUE_D = { cart: '#c3c7cf', cartD: '#8f949e', drawer: '#aab6cc', wheel: '#2d2f36', caseC: '#4f7f86', caseD: '#2c4a55' };
function* dressSteps(o = {}) {
  const b = INT.makeBuilder(), tumblers = [], pick = (k) => (o[k] === false ? null : { ...DRESS[k], ...(o[k] || {}) });
  const tr = pick('trolley');
  if (tr) {
    const [x0, y0, z0, x1, y1, z1] = tr.box, cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, w = x1 - x0, len = z1 - z0, yb = y0 + 1.5;
    // four castors in forks; a body of drawers on both long sides; a top plate; a rail round the top; a push bar at each end
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const x = cx + sx * (w / 2 - 0.9), z = cz + sz * (len / 2 - 1.3);
      b.add(pillow(0.5, 1.3, 1.3, 0.9, 5), { p: [x, y0 + 0.65, z], c: HUE_D.wheel, surf: S_MATTE });
      b.add(bevelBox(0.8, 0.5, 1.0, 0.12), { p: [x, y0 + 1.3, z], c: HUE_D.cartD, surf: S_METAL }); }
    b.add(bevelBox(w - 0.4, y1 - 0.3 - yb, len - 1.0, 0.3), { p: [cx, (yb + y1 - 0.3) / 2, cz], c: HUE_D.cart, surf: S_SHELL });
    b.add(bevelBox(w, 0.34, len, 0.12), { p: [cx, y1 - 0.17, cz], c: HUE_D.cartD, surf: S_METAL });
    const rows = 2, cols = 3, ph = (y1 - 0.9 - yb - 0.6) / rows, pw = (len - 1.6) / cols;
    for (const sx of [-1, 1]) for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const y = yb + 0.5 + ph * (r + 0.5), z = z0 + 0.8 + pw * (c + 0.5), x = cx + sx * (w / 2 - 0.2);
      b.add(bevelBox(0.14, ph - 0.3, pw - 0.3, 0.06), { p: [x, y, z], c: HUE_D.drawer, surf: S_PLASTIC });
      b.add(bevelBox(0.16, 0.22, pw * 0.4, 0.06), { p: [x + sx * 0.08, y + ph * 0.28, z], c: HUE_D.cartD, surf: S_METAL });
    }
    for (const sz of [-1, 1]) b.add(bevelBox(w - 1.2, 0.36, 0.36, 0.14), { p: [cx, y1 - 2.0, cz + sz * (len / 2 - 0.22)], c: HUE_D.cartD, surf: S_METAL });
    const ry = y1 + 0.6 - 0.1;
    for (const sx of [-1, 1]) b.add(bevelBox(0.2, 0.2, len - 0.3, 0.07), { p: [cx + sx * (w / 2 - 0.15), ry, cz], c: HUE_D.cartD, surf: S_METAL });
    for (const sz of [-1, 1]) b.add(bevelBox(w - 0.3, 0.2, 0.2, 0.07), { p: [cx, ry, cz + sz * (len / 2 - 0.15)], c: HUE_D.cartD, surf: S_METAL });
    for (const sx of [-1, 1]) for (const f of [-1, 0, 1]) b.add(bevelBox(0.18, 0.5, 0.18, 0.05), { p: [cx + sx * (w / 2 - 0.15), y1 + 0.25, cz + f * (len / 2 - 0.15)], c: HUE_D.cartD, surf: S_METAL });
    (tr.cups || []).forEach(([x, z], i) => tumblers.push({ position: [x, y1, z], phase: (i * 0.37) % 1 }));
  }
  yield;
  const cr = pick('crew');
  if (cr) {
    // the crew otter's seat: a blue pad folded down from the partition on two struts, a back pad and a pale cap against the partition
    const [x0, , z0, x1, y1, z1] = cr.seat, cx = (x0 + x1) / 2, w = x1 - x0, bk = cr.back, bz = bk[2] + 0.75, bh = bk[4] - bk[1];
    b.add(pillow(w - 0.4, 2.2, z1 - z0 - 1.0, 0.42, 6), { p: [cx, y1 - 1.1, (z0 + z1) / 2 + 0.5], c: HUE.seat, surf: S_FABRIC });
    b.add(bevelBox(w - 0.2, 0.5, z1 - z0 - 0.6, 0.15), { p: [cx, y1 - 2.3, (z0 + z1) / 2 + 0.2], c: HUE.frame, surf: S_SHELL });
    for (const sx of [-1, 1]) { const zz = z1 - z0 - 1.6, hh = y1 - 3.2, len = Math.hypot(zz, hh), ang = Math.atan2(hh, zz);
      b.add(bevelBox(0.5, 0.5, len, 0.12), { p: [cx + sx * (w / 2 - 1), 0.6 + hh / 2, z0 + 0.4 + zz / 2], r: [-ang, 0, 0], c: HUE.metalD, surf: S_METAL }); }
    b.add(pillow(w - 1.0, bh - 3.6, 1.1, 0.42, 6), { p: [cx, bk[1] + (bh - 3.6) / 2 + 0.3, bz], c: HUE.seat, surf: S_FABRIC });
    b.add(pillow(w - 2.6, 3.4, 1.2, 0.5, 5), { p: [cx, bk[4] - 1.9, bz + 0.05], c: HUE.cloth, surf: sf(SURF.FABRIC, 0.03) });
  }
  if (o.case) {
    // a plain case in the bay (the plan's GLASS.STAND.CASE: the one stood at the door's window stands on it): a body
    // with rounded edges, two straps round it, a handle on its aisle end; no mark, no label
    const [x0, y0, z0, x1, y1, z1] = o.case.box, cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, w = x1 - x0, h = y1 - y0, d = z1 - z0;
    b.add(bevelBox(w, h - 0.06, d, 0.45), { p: [cx, y0 + (h - 0.06) / 2, cz], c: HUE_D.caseC, surf: S_SHELL });
    for (const sz of [-1, 1]) b.add(bevelBox(w + 0.1, h - 0.02, 0.7, 0.3), { p: [cx, y0 + (h - 0.02) / 2, cz + sz * d * 0.27], c: HUE_D.caseD, surf: S_FABRIC });
    b.add(bevelBox(0.3, 0.5, 2.4, 0.12), { p: [x1 + 0.25, y0 + h * 0.62, cz], c: HUE_D.caseD, surf: S_PLASTIC });
    for (const sz of [-1, 1]) b.add(bevelBox(0.5, 0.36, 0.36, 0.1), { p: [x1 + 0.1, y0 + h * 0.62, cz + sz * 1.2], c: HUE.metal, surf: S_METAL });
  }
  yield;
  if (!b.vertexCount) return { geo: null, tumblers };
  b.tessellate(7, 0.12);
  yield;
  return { geo: b.build(), tumblers };
}
export function makeDress(rig, o = {}) { const it = dressSteps(o); let r = it.next(); while (!r.done) r = it.next(); return dressMesh(rig, o, r.value); }
export async function makeDressAsync(rig, o = {}, pause = null) { const it = dressSteps(o); let r = it.next(); while (!r.done) { if (pause) await pause(); r = it.next(); } return dressMesh(rig, o, r.value); }
function dressMesh(rig, o, v) {
  if (!v.geo) return { mesh: null, triangles: 0, tumblers: v.tumblers };
  const mesh = new THREE.Mesh(v.geo, o.material || INT.propMaterial({ rig })); mesh.frustumCulled = false; mesh.name = 'dress';
  return { mesh, triangles: v.geo.index.count / 3, tumblers: v.tumblers };
}

// ------------------------------------------------------------------------------------------------------------------
// TRAYS. list: [{ row, seat, side, down, snack }]: the tray that serves the passenger of (row, seat), hung on the seat
// ahead. Down it is a table on two arms tucked under it; stowed it stands flat against the back of that seat under a
// latch. snack: true lays a napkin and three shells on a tray that is down (an otter's snack), toward its wall side.
// arm: true (a front row, which has no seat ahead): the same tray at the same place and height, down, carried on one
// plain stalk from the armrest on the seat's window side.
// ------------------------------------------------------------------------------------------------------------------
function trayBuilder() {
  const b = INT.makeBuilder(), D = DIM;
  const add = (it) => {
    const t = trayAt(it.row, it.seat, it.side || 0), x = t.position[0], zs = (it.row - 1) * D.PITCH;
    if (it.down) {
      // long: metres the table reaches further toward its sitter; lip: a raised rim all round, this high (the hero's
      // own tray: it shows past both ends of the machine turned on it, and reads as a tray, not as a base under the keys)
      const lg = it.long || 0, zc = t.position[2] + lg / 2, dp = D.TRAY_D + lg;
      b.add(bevelBox(D.TRAY_W, D.TRAY_T, dp, 0.14), { p: [x, D.TRAY_Y - D.TRAY_T / 2, zc], c: HUE.tray, surf: S_PLASTIC });
      b.add(bevelBox(D.TRAY_W - 0.9, 0.05, dp - 0.9, 0), { p: [x, D.TRAY_Y + 0.01, zc], c: HUE.trayD, surf: S_MATTE });   // the dished top, HARD-EDGED (no bevel): a bevel 0.02 wide on a plate this long made strips far thinner than a pixel from outside the hull, their two near corners of unlike normals, and a strip so thin drew one sample hundreds of times too bright through a window
      if (it.lip) { const h = it.lip, w = 0.28;
        for (const sg of [-1, 1]) { b.add(bevelBox(D.TRAY_W, h, w, 0.06), { p: [x, D.TRAY_Y + h / 2, zc + sg * (dp - w) / 2], c: HUE.trayLip, surf: S_PLASTIC });
          b.add(bevelBox(w, h, dp - 2 * w, 0.06), { p: [x + sg * (D.TRAY_W - w) / 2, D.TRAY_Y + h / 2, zc], c: HUE.trayLip, surf: S_PLASTIC }); } }
      if (it.arm) {
        // a front row's tray: no seat back ahead, so it folds out of its own armrest on ONE plain stalk, on the seat's
        // window side: a hinge on the armrest's front end, a bar forward from it, a bracket under the tray's edge
        const ws = it.side ? 1 : -1, xa = x + ws * 5, zr = it.row * D.PITCH;
        b.add(bevelBox(0.9, 0.9, 0.6, 0.2), { p: [xa, 12.7, zr - 6.95], c: HUE.metalD, surf: S_METAL });
        b.add(bevelBox(0.56, 0.5, 3.3, 0.12), { p: [xa - ws * 0.55, 13.05, zr - 8.6], c: HUE.metal, surf: S_METAL });
        b.add(bevelBox(1.26, 0.24, 2.2, 0.08), { p: [xa - ws * 0.75, 13.42, zr - 9.5], c: HUE.metalD, surf: S_METAL });
      } else for (const s of [-1, 1]) { const a = [x + s * (D.TRAY_W / 2 - 0.55), 11.2, zs + backFront(11.2) + backThick(11.2) * 0.6], c = [x + s * (D.TRAY_W / 2 - 0.55), D.TRAY_Y - 0.3, t.position[2] - 0.4];
        const len = Math.hypot(c[1] - a[1], c[2] - a[2]), ang = Math.atan2(c[1] - a[1], c[2] - a[2]);
        b.add(bevelBox(0.22, 0.42, len, 0.08), { p: [a[0], (a[1] + c[1]) / 2, (a[2] + c[2]) / 2], r: [-ang, 0, 0], c: HUE.metalD, surf: S_METAL }); }
      if (it.snack) {
        const sx = x + (it.snackX ?? 1.9), sz = t.position[2] + 0.2, y = D.TRAY_Y + 0.03;
        b.add(bevelBox(3.2, 0.05, 3.2, 0.02), { p: [sx, y + 0.02, sz], r: [0, 0.3, 0], c: HUE.napkin, surf: sf(SURF.FABRIC, 0.02) });
        b.add(pillow(1.5, 0.62, 1.05, 0.9, 4), { p: [sx - 0.5, y + 0.36, sz - 0.45], r: [0, 0.5, 0], c: HUE.shellA, surf: S_GLOSS });
        b.add(pillow(1.35, 0.56, 0.95, 0.9, 4), { p: [sx + 0.7, y + 0.33, sz + 0.15], r: [0, -0.8, 0], c: HUE.shellA, surf: S_GLOSS });
        b.add(pillow(1.4, 0.34, 1.0, 0.9, 4), { p: [sx - 0.25, y + 0.2, sz + 0.85], r: [0, 2.1, 0], c: HUE.shellB, surf: sf(SURF.PLAIN, 0.6) });
      }
    } else {
      const y = 16.6, z = zs + backFront(y) + backThick(y) + 0.24;
      b.add(bevelBox(D.TRAY_W - 1.2, D.TRAY_D - 0.4, D.TRAY_T, 0.14), { p: [x, y, z], r: [D.RAKE, 0, 0], c: HUE.tray, surf: S_PLASTIC });   // it leans WITH its seat back's rake
      b.add(bevelBox(0.9, 0.5, 0.3, 0.1), { p: [x, y + (D.TRAY_D - 0.4) / 2 + 0.2, z + 0.5 * Math.tan(D.RAKE) * D.TRAY_D + 0.05], c: HUE.frame, surf: S_PLASTIC });
    }
  };
  const done = (rig) => {
    if (!b.vertexCount) return { mesh: null, triangles: 0 };
    const geo = b.build(), mesh = new THREE.Mesh(geo, INT.propMaterial({ rig })); mesh.frustumCulled = false; mesh.name = 'trays';
    return { mesh, triangles: geo.index.count / 3 };
  };
  return { add, done };
}
// one list in one unbroken call: hand at most twenty trays to a call, or use the resting form (ONE mesh)
export function makeTrays(rig, list = []) { const k = trayBuilder(); for (const it of list) k.add(it); return k.done(rig); }
export async function makeTraysAsync(rig, list = [], pause = null, every = 8) {
  const k = trayBuilder(); let i = 0;
  for (const it of list) { k.add(it); if (pause && ++i % every === 0) await pause(); }
  if (pause) await pause();
  return k.done(rig);
}

// ------------------------------------------------------------------------------------------------------------------
// THE MACHINES: an open laptop, a phone, a tablet. Plain: no mark, no lettering. All of them one merged mesh lit by
// the kit's rig; each returns its screen (a quad in cabin space) for makeScreens.
// list: [{ kind: 'laptop' | 'phone' | 'tablet', position, yaw, tilt, picture: 0 water | 1 a swimming otter | 2 the same otter at its
//          machine again, station (metres, for uSignal), seed }]
// A laptop's position is the middle of its underside; yaw 0 turns its keys toward +z (a passenger facing -z).
// A phone's or tablet's position is its middle; yaw 0 turns its screen toward +z, tilt leans its top away.
// Shell, deck and pad are one warm grey of one finish, the keys a shade darker and matte; phones and tablets the same
// grey with a plain back. A laptop entry also takes:
//   lid: the opening angle in radians (DIM.LID, 106 degrees, when not given; PI / 2 stands the lid upright)
//   glass: [width, height] of its screen (DIM.SCREEN_W x DIM.SCREEN_H when not given); the lid grows to hold it
//   screen: false   no screen is returned for it: its glass comes back in `openings` instead ({ centre, right, up,
//                   normal, width, height } in cabin space), for a world that stands something of its own there
// The hero's machine: yaw PI / 2 (keys toward +x), lid PI / 2, glass [6.2, 5.0], screen: false.
// Returns { mesh, screens, openings, triangles }. One list in one unbroken call: hand at most twenty machines to a
// call and rest between calls (makeDevicesAsync does that and gives ONE mesh).
// ------------------------------------------------------------------------------------------------------------------
// a flat shape in a lid's own plane, facing its back (-z): pts: [[x, y], ...] an outline seen whole from the mean of its points, fanned from there
function flatFan(pts, z) {
  const P = [], I = [], n = pts.length; let cx = 0, cy = 0;
  for (const q of pts) { P.push(q[0], q[1], z); cx += q[0] / n; cy += q[1] / n; }
  P.push(cx, cy, z);
  const ccw = pts.reduce((a, q, i) => a + (q[0] - cx) * (pts[(i + 1) % n][1] - cy) - (q[1] - cy) * (pts[(i + 1) % n][0] - cx), 0) > 0;
  for (let i = 0; i < n; i++) { if (ccw) I.push(n, (i + 1) % n, i); else I.push(n, i, (i + 1) % n); }   // wound to face -z
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(new Array(P.length).fill(0).map((v, i) => (i % 3 === 2 ? -1 : 0)), 3)); g.setIndex(I);
  return g;
}
// THE STICKER on a lid's back: a small PICTURE on a paper label with rounded corners, never a single bold mark on a
// round (a reader who follows the field took the first set, a fish, a ribbed shell and a wave each alone on a round
// of paper, for makers' marks): kind 0 an orange fish over a wave, 1 two strands of kelp, 2 a sailing boat on two
// waves. seed turns and places it a little. Seen from behind the lid, x runs to the viewer's left. Every outline is
// seen whole from its own middle (flatFan). Returns [[geometry, colour, surface], ...].
function stickerGeos(kind, seed) {
  const ox = -1.75 + 0.5 * ((seed * 7.3) % 1), oy = -0.75 + 0.4 * ((seed * 3.7) % 1), tw = -0.35 + 0.7 * ((seed * 5.1) % 1), ct = Math.cos(tw), st = Math.sin(tw);
  const at = (x, y) => [ox + x * ct - y * st, oy + y * ct + x * st], ring = (rx, ry, n, x0 = 0, y0 = 0) => Array.from({ length: n }, (_, i) => at(x0 + rx * Math.cos((i / n) * TAU), y0 + ry * Math.sin((i / n) * TAU)));
  const label = Array.from({ length: 16 }, (_, i) => { const c = Math.cos((i / 16) * TAU), sn = Math.sin((i / 16) * TAU); return at(1.02 * Math.sign(c) * Math.sqrt(Math.abs(c)), 0.86 * Math.sign(sn) * Math.sqrt(Math.abs(sn))); });
  const out = [[flatFan(label, -0.095), HUE.paper, S_STICK]], put = (pts, c, z = -0.11) => out.push([flatFan(pts, z), c, S_STICK]);
  // a wavy band along x (six short quads), and one up y (a strand)
  const band = (y0, amp, c, x0 = -0.69, dx = 0.23) => { for (let i = 0; i < 6; i++) { const a = x0 + dx * i, b = a + dx, f = (x) => y0 + amp * Math.sin((x - x0) * 4.6); put([at(a, f(a) - 0.09), at(b, f(b) - 0.09), at(b, f(b) + 0.09), at(a, f(a) + 0.09)], c); } };
  const strand = (x0, y0, n, amp, c) => { const f = (y) => x0 + amp * Math.sin((y - y0) * 4.2);
    for (let i = 0; i < n; i++) { const a = y0 + 0.25 * i, b = a + 0.25; put([at(f(a) - 0.06, a), at(f(a) + 0.06, a), at(f(b) + 0.06, b), at(f(b) - 0.06, b)], c);
      const sd = i % 2 ? -1 : 1, lx = f(b) + sd * 0.2, ly = b + 0.04;                             // a blade at each joint, by turns to either hand
      put([at(f(b), b - 0.05), at(lx, ly - 0.09), at(lx + sd * 0.2, ly + 0.07), at(lx - sd * 0.02, ly + 0.1)], c, -0.118); } };
  if (kind === 0) {
    put(ring(0.44, 0.21, 10, 0.1, 0.24), HUE.fish);                                           // the body
    put([at(-0.28, 0.24), at(-0.7, 0.54), at(-0.57, 0.24), at(-0.7, -0.06)], HUE.fish);        // the tail
    put([at(0.02, 0.42), at(0.2, 0.42), at(0.02, 0.62)], HUE.fish);                           // the back fin
    out.push([flatFan(ring(0.055, 0.055, 5, 0.36, 0.3), -0.12), HUE.fishD, S_STICK]);        // the eye
    band(-0.4, 0.11, HUE.wave);
  } else if (kind === 1) {
    strand(-0.2, -0.66, 5, 0.1, HUE.kelp); strand(0.34, -0.66, 3, -0.08, HUE.kelpD);
  } else {
    band(-0.22, 0.1, HUE.wave); band(-0.52, 0.09, HUE.waveD);
    put([at(-0.44, 0.2), at(0.44, 0.2), at(0.3, -0.12), at(-0.3, -0.12)], HUE.boat, -0.103);   // the hull, behind the nearer wave: it sits in its water
    put([at(-0.035, 0.2), at(0.035, 0.2), at(0.035, 0.78), at(-0.035, 0.78)], HUE.boat);      // the mast
    put([at(0.07, 0.25), at(0.46, 0.25), at(0.07, 0.74)], HUE.sail);                          // the mainsail
    put([at(-0.07, 0.25), at(-0.07, 0.66), at(-0.36, 0.25)], HUE.sailB);                      // the jib
  }
  return out;
}
function deviceBuilder() {
  const b = INT.makeBuilder(), D = DIM, screens = [], openings = [], M = new THREE.Matrix4(), R = new THREE.Matrix4(), v = new THREE.Vector3();
  const pt = (x, y, z) => { v.set(x, y, z).applyMatrix4(M); return [v.x, v.y, v.z]; };
  const dir = (x, y, z) => { v.set(x, y, z).transformDirection(M); return [v.x, v.y, v.z]; };
  const top = (x0, x1, z0, z1, y, c, s) => b.quad(pt(x0, y, z1), pt(x1, y, z1), pt(x1, y, z0), pt(x0, y, z0), c, s);
  const add = (it) => {
    const p = it.position, yaw = it.yaw ?? 0;
    M.makeTranslation(p[0], p[1], p[2]).multiply(R.makeRotationY(yaw));
    const pre = M.clone(), scr = { picture: it.picture ?? 0, station: it.station ?? -1e6, seed: it.seed ?? 0 };
    if (it.kind === 'laptop') {
      const gl = it.glass || [D.SCREEN_W, D.SCREEN_H], hz = -D.LAP_D / 2 + 0.15, a = it.lid ?? D.LID, u = [0, Math.sin(a), Math.cos(a)], n = [0, -Math.cos(a), Math.sin(a)], H = gl[1] + 0.4, hy = D.LAP_T;
      b.add(bevelBox(D.LAP_W, D.LAP_T, D.LAP_D, 0.09), { p: [0, D.LAP_T / 2, 0], pre, c: HUE.mach, surf: S_SHELL });
      // the keys: four rows and a long bar, a shade darker than the deck and matte; a pad below them, of the deck's own finish
      for (let r = 0; r < 4; r++) for (let k = 0; k < 12; k++) top(-2.85 + k * 0.478, -2.85 + k * 0.478 + 0.4, -1.74 + r * 0.5, -1.74 + r * 0.5 + 0.41, hy + 0.03, HUE.machKey, S_MATTE);
      top(-1.5, 1.5, 0.27, 0.66, hy + 0.03, HUE.machKey, S_MATTE);
      for (const s of [-1, 1]) top(s > 0 ? 1.62 : -2.85, s > 0 ? 2.85 : -1.62, 0.27, 0.66, hy + 0.03, HUE.machKey, S_MATTE);
      top(-1.1, 1.1, 0.95, 2.0, hy + 0.008, HUE.machPad, S_SHELL);
      // the lid, and a dark surround for the screen on its inner face
      const lc = [0, hy + u[1] * H / 2, hz + u[2] * H / 2];
      b.add(bevelBox(D.LAP_W, H, 0.16, 0.07), { p: lc, r: [-(a - PI / 2), 0, 0], pre, c: HUE.lid, surf: S_LID, grad: [p[1] + hy, p[1] + hy + H, 0.86, 1.1] });
      // ONE PLAIN STICKER OF OUR OWN on the lid's back, off its middle and a little askew (a fish over a wave, kelp or a boat by
      // the machine's own seed; no letter, no mark): flat shapes a hair proud of the lid, on a paper label with rounded corners
      if (it.screen !== false) for (const [g, c, sfc] of stickerGeos(Math.floor(((it.seed ?? 0) * 3) % 3), it.seed ?? 0)) b.add(g, { p: lc, r: [-(a - PI / 2), 0, 0], pre, c, surf: sfc });
      const q = (sx, sy, off) => pt(sx * (D.LAP_W / 2 - 0.05), lc[1] + u[1] * sy * (H / 2 - 0.05) + n[1] * off, lc[2] + u[2] * sy * (H / 2 - 0.05) + n[2] * off);
      b.quad(q(-1, -1, 0.09), q(1, -1, 0.09), q(1, 1, 0.09), q(-1, 1, 0.09), HUE.bezelD, S_GLOSS);
      // the glass: a screen to paint, or (screen: false) an opening the world fills itself; its inner face then carries the dark surround alone
      const glass = { ...scr, centre: pt(0, lc[1] + n[1] * 0.115, lc[2] + n[2] * 0.115), right: dir(1, 0, 0), up: dir(u[0], u[1], u[2]), normal: dir(n[0], n[1], n[2]), width: gl[0], height: gl[1] };
      if (it.screen === false) openings.push(glass); else screens.push(glass);
    } else {
      const phone = it.kind === 'phone', w = phone ? D.PHONE_W : D.TABLET_W, h = phone ? D.PHONE_H : D.TABLET_H, t = phone ? D.PHONE_T : D.TABLET_T;
      M.multiply(R.makeRotationX(it.tilt ?? 0)); pre.copy(M);
      const glass = { ...scr, centre: pt(0, 0, t / 2 + 0.03), right: dir(1, 0, 0), up: dir(0, 1, 0), normal: dir(0, 0, 1), width: w - (phone ? 0.2 : 0.4), height: h - (phone ? 0.3 : 0.5) };
      if (it.held) {
        // a machine its holder lifts and tilts while it waits (habit 0): it cannot stand in the still mesh. Its shell goes
        // with its screen into makeScreens' mesh, which moves both by the fur shader's own law (owSeek).
        const hd = it.held; glass.shell = { middle: pt(0, 0, 0), w, h, t };
        glass.held = { sgn: hd.mirror ? 1 : -1, scale: hd.scale ?? 1, phase: hd.phase ?? 0, station: hd.station ?? scr.station, kind: phone ? 1 : 2 };
      } else {
        b.add(bevelBox(w, h, t, phone ? 0.09 : 0.1), { pre, c: HUE.mach, surf: S_SHELL });                    // the same warm grey shell as the laptops; a plain back, nothing on it
        b.quad(pt(-w / 2 + 0.04, -h / 2 + 0.04, t / 2 + 0.008), pt(w / 2 - 0.04, -h / 2 + 0.04, t / 2 + 0.008), pt(w / 2 - 0.04, h / 2 - 0.04, t / 2 + 0.008), pt(-w / 2 + 0.04, h / 2 - 0.04, t / 2 + 0.008), HUE.bezelD, S_GLOSS);
      }
      screens.push(glass);
    }
  };
  const done = (rig) => {
    if (!b.vertexCount) { const none = screens.length ? new THREE.Group() : null; if (none) none.name = 'machines'; return { mesh: none, screens, openings, triangles: 0 }; }   // every machine of the list held up: nothing stands in the still mesh
    const geo = b.build(), mesh = new THREE.Mesh(geo, INT.propMaterial({ rig })); mesh.frustumCulled = false; mesh.name = 'machines';
    return { mesh, screens, openings, triangles: geo.index.count / 3 };
  };
  return { add, done };
}
export function makeDevices(rig, list = []) { const k = deviceBuilder(); for (const it of list) k.add(it); return k.done(rig); }
// the same as ONE mesh, resting between machines (pause: the world's ctx.yield; every: machines between two rests)
export async function makeDevicesAsync(rig, list = [], pause = null, every = 4) {
  const k = deviceBuilder(); let i = 0;
  for (const it of list) { k.add(it); if (pause && ++i % every === 0) await pause(); }
  if (pause) await pause();
  return k.done(rig);
}

// ------------------------------------------------------------------------------------------------------------------
// THE SCREENS: every one a quad in ONE mesh, painted by ONE shader from a per-screen (picture, station, seed, shape).
// Waiting (the signal has not reached its station) a screen shows three plain arcs, wide, ALL THREE lit at full strength,
// a brightening running up them (no point). A screen with held (a phone or tablet its holder lifts while it waits: see
// deviceBuilder) carries its machine's shell in this mesh too and moves by the fur shader's own law.
// Awake it shows its picture: open water under a low sun; a big dark otter swimming over bright shallows; or this
// same otter at its machine again, in profile, whose screen shows the same again, four deep.
// No word, no mark, nothing of any real program.
// ------------------------------------------------------------------------------------------------------------------
const SCREEN_FRAG = /* glsl */`
uniform vec2 uSignal;
varying vec2 vUv; flat varying vec4 vScr; varying vec3 vP, vN;
const vec3 MACH_GREY = vec3(${lin(HUE.mach).map((v) => v.toFixed(4)).join(', ')});
${GLSL_CABIN}
float sHash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7)))*43758.5453); }
float sNoise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3. - 2.*f);
  return mix(mix(sHash(i), sHash(i + vec2(1., 0.)), f.x), mix(sHash(i + vec2(0., 1.)), sHash(i + vec2(1., 1.)), f.x), f.y); }
// the plain sign of a signal waited for: THREE PLAIN ARCS ALONE, one above another, widest at the top, ALL THREE lit at
// full strength at every moment, a brightening running up them by the clock. No point under them, and no arc is ever
// drawn alone. hv: the glass's half width and half height in q's units. The widest arc spans 0.9 of the glass's width
// (or as much as its height lets it) and the three stand in the middle of its height.
vec3 waiting(vec2 q, float seed, vec2 hv){
  float R = min(.9*hv.x/.669, 1.7*hv.y/(1. - .743/3.)), th = R*.088;
  vec2 c = q - vec2(0., -.5*(R + R*.743/3.)); float r = length(c), wedge = smoothstep(.7, .655, abs(c.x)/max(r, 1e-3))*step(0., c.y);
  float ph = fract(uTime*.42 + seed)*4.6, sum = 0., soft = 0.;
  for (int i = 1; i <= 3; i++){ float fi = float(i), x = (ph - fi)*1.15, run = exp(-x*x), d = abs(r - fi*R/3.);
    sum += smoothstep(th, th*.55, d)*wedge*(1. + .9*run); soft += exp(-d*d/(th*th*9.))*wedge*(.5 + .5*run); }
  return vec3(.008, .02, .06) + vec3(.03, .1, .3)*soft + vec3(.2, .5, 1.3)*sum;
}
// open water under a low sun: dark troughs and pale crests in bands that close up toward a clear horizon
vec3 water(vec2 q, float t, float seed){
  float hor = .34; vec2 sunAt = vec2(.35, hor + .2);
  vec3 sky = mix(vec3(1.3, .78, .38), vec3(.22, .42, .9), smoothstep(hor, 1.1, q.y)) + vec3(1.6, 1.1, .6)*exp(-dot(q - sunAt, q - sunAt)*16.);
  float d = 1./max(hor - q.y + .12, 1e-3); vec2 w = vec2(q.x*d, d);
  float wv = sin(w.y*3.4 - t*1.5 + 2.6*sNoise(w*vec2(.45, 1.1) + vec2(seed*9., t*.2))), crest = smoothstep(.35, .95, wv);
  vec3 sea = mix(vec3(0., .07, .2), vec3(.02, .34, .46), sNoise(w*.5 + vec2(t*.1, seed)));
  float sx = (q.x - sunAt.x)*d*.5;
  sea = mix(sea, vec3(.5, .78, .8), crest*.55) + vec3(1.5, 1., .5)*crest*exp(-min(sx*sx, 60.));
  sea = mix(sea, vec3(.8, .55, .36), smoothstep(4., 8.3, d)*.6);
  return mix(sea, sky, smoothstep(hor - .012, hor + .012, q.y));
}
// a big dark otter swimming over bright turquoise shallows: a long body, a round head with a pale chin, a tapering
// tail, a wake; it swims a figure of eight that never leaves the glass
vec3 swimming(vec2 q, float t, float seed, vec2 hv){
  float n = sNoise(q*2.2 + vec2(t*.22, seed*7.));
  float c = abs(sin((q.x + n*.7)*3.6 + t*.8)*sin((q.y + n*.6)*4.2 - t*.6));
  vec3 col = mix(vec3(.03, .4, .5), vec3(.12, .68, .7), n) + vec3(.6, .9, .85)*smoothstep(.16, 0., c)*.5;
  float w = t*.42 + seed*6.3; vec2 amp = hv*vec2(.24, .14);
  vec2 dv = amp*vec2(cos(w), 2.*cos(2.*w)); float hd = atan(dv.y, dv.x + 1e-4*step(abs(dv.x), 1e-4));
  vec2 l = (q - amp*vec2(sin(w), sin(2.*w))); l = vec2(l.x*cos(hd) + l.y*sin(hd), l.y*cos(hd) - l.x*sin(hd));
  l.y += .045*sin(l.x*7.5 - t*5.2)*smoothstep(.3, -.6, l.x);
  l /= 1.75;                                                                      // it is BIG on its glass
  float body = length(l/vec2(.36, .125)), head = length((l - vec2(.4, 0.))/vec2(.16, .135));
  float tw = .09*clamp(1. - (-l.x - .26)/.62, 0., 1.);
  float tail = step(l.x, -.26)*step(-.86, l.x)*smoothstep(tw + .012, tw, abs(l.y));
  float wake = step(l.x, .3)*smoothstep(.035, .0, abs(abs(l.y) - (.3 - l.x)*.42))*exp((l.x - .3)*1.3);
  col += vec3(.7, .9, .88)*wake*.6;
  float m = max(max(smoothstep(1.06, .94, body), smoothstep(1.06, .94, head)), tail);
  vec3 fur = mix(vec3(.13, .07, .035), vec3(.27, .15, .075), smoothstep(.1, -.08, l.y));
  fur = mix(fur, vec3(.85, .72, .5), smoothstep(.44, .52, l.x)*smoothstep(1.06, .94, head));
  fur = mix(fur, vec3(.02), smoothstep(.034, .02, length(vec2(l.x - .43, abs(l.y) - .065))));
  return mix(col, fur, m);
}
// one layer of "the same otter at its machine": the wall and its window, the dark seat with its pale cap, and the
// otter in profile, brown with a cream throat, its paw on the keys of a laptop whose screen is the next layer
vec3 selfLayer(vec2 q, float asp, out vec4 rect){
  // THE OTTER FILLS THE GLASS (0.9 of its width from the seat's back to the lid's far edge); the picture inside is small
  vec3 col = mix(vec3(.5, .43, .32), vec3(.74, .66, .52), smoothstep(-1., 1., q.y));
  vec2 wq = (q - vec2(.04*asp, .5))/vec2(.2, .32); float win = pow(pow(abs(wq.x), 2.7) + pow(abs(wq.y), 2.7) + 1e-5, .37);
  col = mix(col, vec3(.98, .93, .8), smoothstep(1.3, 1.16, win));
  col = mix(col, mix(vec3(1.9, 1.15, .45), vec3(.45, .68, 1.2), smoothstep(-.4, .7, wq.y)), smoothstep(1.04, .96, win));
  vec2 sq = q - vec2(-.82*asp, -.15); float seat = max(abs(sq.x) - .15*asp, abs(sq.y) - .92);
  col = mix(col, mix(vec3(.035, .07, .24), vec3(.92, .88, .76), step(.62, sq.y)), smoothstep(.02, -.02, seat));
  rect = vec4(.56*asp, -.08, .3, 0.);                                             // the inner screen: middle and half height
  vec2 r = (q - rect.xy)/rect.z;
  float lid = max(abs(r.x) - asp, abs(r.y) - 1.);
  col = mix(col, vec3(.5, .47, .43), smoothstep(.2, .14, lid));                    // the lid's rim, the machines' own warm grey
  float deckY = rect.y - rect.z - .07;                                             // the keys' deck under it, toward the otter
  col = mix(col, vec3(.44, .41, .38), step(abs(q.x - rect.x + .14*asp) - (asp*rect.z + .16*asp), 0.)*step(q.y, deckY)*step(deckY - .15, q.y));
  vec2 b = q - vec2(-.5*asp, -.5); b.x -= b.y*.2;                                  // the trunk leans to its work
  float trunk = length(b/vec2(.25*asp, .8));
  vec2 hq = q - vec2(-.25*asp, .38); float head = length(hq/vec2(.25*asp, .25));
  float muz = length((q - vec2(-.04*asp, .3))/vec2(.14*asp, .15));
  float ear = length((q - vec2(-.4*asp, .56))/vec2(.055*asp, .08));
  vec2 a0 = vec2(-.42*asp, -.12), a1 = vec2(.2*asp, deckY + .04), pa = q - a0, ba = a1 - a0; float hh = clamp(dot(pa, ba)/dot(ba, ba), 0., 1.), arm = length(pa - ba*hh) - .095;
  float face = max(smoothstep(1.05, .95, head), smoothstep(1.05, .95, muz));
  float m = max(max(smoothstep(1.04, .96, trunk), face), max(smoothstep(1.1, .9, ear), smoothstep(.015, -.015, arm)));
  vec3 fur = mix(vec3(.1, .05, .025), vec3(.3, .16, .07), smoothstep(-.6, .5, q.y));
  float cream = max(smoothstep(.09*asp, .2*asp, b.x)*smoothstep(-.4, 0., b.y)*smoothstep(1.04, .96, trunk), smoothstep(0., -.07, hq.y + .05)*face);
  fur = mix(fur, vec3(.95, .84, .62), cream);
  fur = mix(fur, vec3(1.5, .9, .4), smoothstep(.72, 1.04, trunk)*smoothstep(0., -.14*asp, b.x)*.7);   // the window's gold down its back
  fur = mix(fur, vec3(.02), max(smoothstep(.062, .04, length(q - vec2(.085*asp, .34))), smoothstep(.045, .028, length(q - vec2(-.16*asp, .45)))));   // nose, eye
  fur = mix(fur, vec3(.06, .04, .03), smoothstep(.76, 1., hh)*smoothstep(.015, -.015, arm));           // the paw on the keys
  return mix(col, fur, m);
}
vec3 selfPicture(vec2 q, float asp, float t){
  vec3 col = vec3(0.); float k = 1., open = 1.;
  for (int i = 0; i < 4; i++){
    vec4 rect; vec3 c = selfLayer(q, asp, rect);
    col = mix(col, c*k, open);
    vec2 r = (q - rect.xy)/rect.z; float inside = step(abs(r.x), asp)*step(abs(r.y), 1.);
    open *= inside; q = r; k *= 1.12;
  }
  return mix(col, vec3(.5, .8, 1.1)*(.8 + .2*sin(t*2.)), open);                  // the innermost screen is only light
}
void main(){
  float kind = vScr.x, seed = vScr.z, asp = vScr.w;
  if (kind < -.5){
    // the shell of a machine held up high (makeScreens draws it): the machines' own warm grey, lit by the cabin
    vec3 N = normalize(vN + vec3(0., 1e-5, 0.)); if (!gl_FrontFacing) N = -N;
    vec3 alb = kind < -1.5 ? vec3(.006) : MACH_GREY; vec4 wl = owWindow(vP);
    vec3 lit = mix(uAmbGround, uAmbSky, N.y*.5 + .5) + uWinSky*wl.w*max((.35 + dot(N, wl.xyz))/1.35, 0.) + uSunCol*owSun(vP)*max(dot(N, uSunDir), 0.);
    gl_FragColor = vec4(alb*.3183*lit, 1.); return;
  }
  vec2 q = (vUv - .5)*2.*vec2(asp, 1.)/min(asp, 1.); float fa = asp/min(asp, 1.);
  float awake = smoothstep(0., max(uSignal.y, .01), uSignal.x - vScr.y), t = uTime + seed*17.;
  vec3 pic = kind < .5 ? water(q, t, seed) : kind < 1.5 ? swimming(q, t, seed, vec2(asp, 1.)/min(asp, 1.)) : selfPicture(q, fa, t);
  vec3 col = mix(waiting(q, seed, vec2(asp, 1.)/min(asp, 1.)), pic*1.15, awake);
  vec2 e = abs(vUv - .5)*2.; col *= .55 + .45*smoothstep(1., .9, max(e.x, e.y));  // a dark edge to the glass
  gl_FragColor = vec4(col, 1.);
}`;
export function makeScreens(L, list = []) {
  const P = [], NR = [], UV = [], SC = [], HD = [], H2 = [], I = []; let n = 0;
  // one quad: middle c, half-width hw along r, half-height hh along u; kind: a picture (0, 1, 2), -1 shell, -2 dark surround
  const quad = (c, r, u, hw, hh, sc, hd, h2) => {
    const nn = vcross(r, u);
    for (const [a, b] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
      P.push(c[0] + r[0] * a * hw + u[0] * b * hh, c[1] + r[1] * a * hw + u[1] * b * hh, c[2] + r[2] * a * hw + u[2] * b * hh);
      NR.push(nn[0], nn[1], nn[2]); UV.push(a * 0.5 + 0.5, b * 0.5 + 0.5); SC.push(sc[0], sc[1], sc[2], sc[3]); HD.push(hd[0], hd[1], hd[2], hd[3]); H2.push(h2[0], h2[1], h2[2]);
    }
    I.push(n, n + 1, n + 2, n, n + 2, n + 3); n += 4;
  };
  for (const s of list) {
    const kind = s.picture ?? 0, st = s.station ?? -1e6, h = s.held, sh = s.shell;
    const hd = h && sh ? [sh.middle[0], sh.middle[1], sh.middle[2], h.sgn * h.scale] : [0, 0, 0, 0], h2 = h ? [h.kind, h.phase, h.station] : [0, 0, -1e6];
    quad(s.centre, s.right, s.up, s.width / 2, s.height / 2, [kind, st, s.seed ?? 0, s.width / s.height], hd, h2);
    if (h && sh) {
      // the held machine's own shell: a plain back, four edges and the dark surround of its glass
      const R = s.right, U = s.up, N = s.normal || vcross(R, U), m = sh.middle, w = sh.w / 2, hh = sh.h / 2, t = sh.t / 2, gy = [-1, 0, 0, 1], dk = [-2, 0, 0, 1];
      quad(vadd(m, vmul(N, -t)), vmul(R, -1), U, w, hh, gy, hd, h2);
      quad(vadd(m, vmul(N, t + 0.008)), R, U, w, hh, dk, hd, h2);
      for (const sg of [-1, 1]) { quad(vadd(m, vmul(R, sg * w)), vmul(N, -sg), U, t, hh, gy, hd, h2); quad(vadd(m, vmul(U, sg * hh)), R, vmul(N, -sg), w, t, gy, hd, h2); }
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(NR, 3)); g.setAttribute('aUv', new THREE.Float32BufferAttribute(UV, 2));
  g.setAttribute('aScr', new THREE.Float32BufferAttribute(SC, 4)); g.setAttribute('aHeld', new THREE.Float32BufferAttribute(HD, 4)); g.setAttribute('aHold2', new THREE.Float32BufferAttribute(H2, 3)); g.setIndex(I);
  const material = new THREE.ShaderMaterial({
    uniforms: { ...L.uniforms },
    // aHeld = (the machine's middle in cabin space, +-its holder's size: the sign is where the holder's own +x lies along x;
    // 0: the machine stands still); aHold2 = (1 phone | 2 tablet, the holder's phase, the holder's station)
    vertexShader: /* glsl */`attribute vec2 aUv; attribute vec4 aScr, aHeld; attribute vec3 aHold2; uniform vec2 uSignal; uniform float uTime;
      varying vec2 vUv; flat varying vec4 vScr; varying vec3 vP, vN;
      ${GLSL_SEEK}
      void main(){ vec3 p = position, n = normal;
        if (abs(aHeld.w) > 0.){
          float sg = aHeld.w > 0. ? 1. : -1., wait = 1. - smoothstep(0., max(uSignal.y, .01), uSignal.x - aHold2.z); vec3 tilt = vec3(0.);
          vec3 rise = owSeek(aHold2.x, aHold2.y*6.2832, uTime, tilt)*abs(aHeld.w)*wait; tilt *= wait;
          vec3 d = p - aHeld.xyz; rotX(d, -tilt.z); rotY(d, -tilt.y*sg); rotZ(d, tilt.x*sg); rotX(n, -tilt.z); rotY(n, -tilt.y*sg); rotZ(n, tilt.x*sg);
          p = aHeld.xyz + d + vec3(sg*rise.x, rise.y, -rise.z);
        }
        vUv = aUv; vScr = aScr; vP = p; vN = n; gl_Position = projectionMatrix*modelViewMatrix*vec4(p, 1.); }`,
    fragmentShader: SCREEN_FRAG, side: THREE.DoubleSide,
  });
  const mesh = new THREE.Mesh(g, material); mesh.frustumCulled = false; mesh.name = 'screens';
  return { mesh, material, count: list.length, triangles: I.length / 3 };
}

// ------------------------------------------------------------------------------------------------------------------
// LIGHT THAT FALLS ON THINGS, as ONE additive mesh (one draw call, no light of the rig, nothing written to depth):
//   seats   (open: true: an EMPTY seat in the light of three standing arcs on its wall side, by their own clock)
//           the light of each lit screen on the front of its own seat's back, round its sitter: a waiting glass's deep
//           blue with the arcs' own running brightening, a woken picture's colour stirring by the clock (the screen's
//           own station and the wave's uniform decide which, as on the glass itself)
//   pools   a warm pool under a lit reading lamp, lying on a tray (it does not change)
//   bars    the ceiling's two light bars and the ceiling beside them, and the aisle's carpet under them, the length of
//           the cabin: a soft blue brightening
//           where a pulse of three arcs stands (uPulse: the world writes each live pulse's place and strength from the
//           metres flown, the very numbers of the arcs' frames), the arcs' own running brightening in it by the clock
// o: { seats: [{ row, seat, side, station, seed, picture, size }], pools: [{ position: [x, y, z], r, gain }], bars: [z0, z1] }
// Returns { mesh, triangles, setPulse(q, z, ahead, strength) }: z where the pulse stands along the cabin, ahead the z of
// the way it runs (-1..1; the brightening reaches BAR_REACH[1] m that way, the light thrown on before it, BAR_REACH[0] behind).
// ------------------------------------------------------------------------------------------------------------------
export const GLOW = { SEAT: 0.11, POOL: 0.5, BAR: 0.85, BAR_MOST: 0.7, BAR_REACH: [12, 60], FLOOR: 0.5 };   // BAR_REACH: metres behind the pulse, metres ahead of it
export function makeGlow(L, o = {}) {
  const P = [], G = [], S = [], I = []; let n = 0;
  const grid = (rows, g, s, open = 0) => { const first = n, nx = rows[0].length;
    for (const r of rows) for (const v of r) { P.push(v[0], v[1], v[2]); G.push(g, v[3], v[4], s[3]); S.push(s[0], s[1], s[2], open); n++; }
    for (let j = 0; j + 1 < rows.length; j++) for (let i = 0; i + 1 < nx; i++) { const a = first + j * nx + i; I.push(a, a + 1, a + nx, a + 1, a + nx + 1, a + nx); } };
  // seats: a sheet 0.05 m off the back's own front face (the ring the back is lofted from), 0.82 of its width
  for (const it of o.seats || []) { const cx = seatX(it.seat), z0 = it.row * DIM.PITCH, NX = 4, NY = 7, rows = [];
    for (let j = 0; j <= NY; j++) { const y = 9.7 + (j / NY) * 13.1, [hx, zf, zr] = backRing(y, y > 19.3 ? 0.1 : 0), r = [];
      for (let i = 0; i <= NX; i++) { const u = (i / NX) * 2 - 1, q = u * 0.82, x = cx + q * hx, z = (zf + zr) / 2 - ((zr - zf) / 2) * Math.pow(1 - q * q * q * q, 0.25) - 0.05;
        r.push([it.side ? DIM.CABIN_W - x : x, y, z0 + z, u, j / NY]); }
      rows.push(r); }
    grid(rows, 0, [it.station ?? -1e6, it.picture ?? 0, it.size ?? 1, it.seed ?? 0], it.open ? 1 : 0); }
  // pools: a flat square on the tray, its light falling off to nothing inside it
  for (const it of o.pools || []) { const [x, y, z] = it.position, r = it.r ?? 3.6;
    grid([[[x - r, y, z - r, -1, -1], [x + r, y, z - r, 1, -1]], [[x - r, y, z + r, -1, 1], [x + r, y, z + r, 1, 1]]], 1, [0, 0, it.gain ?? 1, 0]); }
  // bars: across, the cove's strip (full) and the ceiling out to the middle of the aisle (falling off); along, 3.9 m steps
  if (o.bars) { const [za, zb] = o.bars, nz = Math.max(1, Math.ceil((zb - za) / 3.9)), bx = DIM.BIN_X + 5.1, by = DIM.BIN_Y + 8.5;
    const prof = [[bx + 0.07, by, 0], [bx + 0.27, DIM.CEIL_Y - 0.32, 0], [bx + 1.8, DIM.CEIL_Y - 0.06, 0.3], [31, DIM.CEIL_Y + 0.19, 0.75], [DIM.CABIN_W / 2, DIM.CEIL_Y + 0.29, 1]];
    for (const side of [0, 1]) { const rows = [];
      for (let k = 0; k <= nz; k++) { const z = za + (zb - za) * (k / nz); rows.push(prof.map(([x, y, u]) => [side ? DIM.CABIN_W - x : x, y, z, u, 0])); }
      grid(rows, 2, [0, 0, 1, 0]); }
    // (and the aisle's carpet under them, where the same blue falls: a sheet 0.08 m over it between the two blocks)
    { const rows = [], x0 = DIM.BLOCK_X1 + 0.3, x1 = DIM.CABIN_W - x0;
      for (let k = 0; k <= nz; k++) { const z = za + (zb - za) * (k / nz); rows.push([[x0, 0.08, z, 1, 0], [DIM.CABIN_W / 2, 0.08, z, 0, 0], [x1, 0.08, z, 1, 0]]); }
      grid(rows, 3, [0, 0, 1, 0]); } }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('aG', new THREE.Float32BufferAttribute(G, 4)); g.setAttribute('aS', new THREE.Float32BufferAttribute(S, 4)); g.setIndex(I);
  const uPulse = { value: [new THREE.Vector4(0, 0, 0, 0), new THREE.Vector4(0, 0, 0, 0)] };
  const material = new THREE.ShaderMaterial({
    uniforms: { ...L.uniforms, uPulse },
    // aG = (0 seat | 1 pool | 2 bars | 3 the aisle's carpet, across, along, the screen's seed); aS = (the screen's station, its picture, gain, 1: an open seat lit from its wall side)
    vertexShader: /* glsl */`attribute vec4 aG, aS; varying vec4 vG, vS; varying vec3 vP;
      void main(){ vG = aG; vS = aS; vP = position; gl_Position = projectionMatrix*modelViewMatrix*vec4(position, 1.); }`,
    fragmentShader: /* glsl */`uniform vec2 uSignal; uniform float uTime; uniform vec4 uPulse[2];   // (z, the z of its heading, -, strength)
      varying vec4 vG, vS; varying vec3 vP;
      void main(){
        vec3 col = vec3(0.); float over = 0.;
        if (vG.x < .5){
          // a screen's light on its seat: waiting, the three arcs' blue and their running brightening (the glass's own
          // law and clock); awake, its picture's colour, stirring by the clock and running slowly up the back
          float awake = smoothstep(0., max(uSignal.y, .01), uSignal.x - vS.x), seed = vG.w, t = uTime + seed*17.;
          vec3 run = (vec3(fract(uTime*.42 + seed)*4.6) - vec3(1., 2., 3.))*1.15;
          float iw = .3 + .55*dot(exp(-run*run), vec3(1.));
          float ia = .7 + .13*sin(t*2.1) + .09*sin(t*3.37 + 1.3) + .15*sin(vG.z*7. - t*2.3);
          vec3 pic = vS.y < .5 ? vec3(.75, .62, .6) : vS.y < 1.5 ? vec3(.2, .75, .8) : vec3(.8, .62, .5);
          // (its sitter stands between the glass and the back: the middle of the sheet lies in the sitter's own shade
          // and the light shows round it, widest at the shoulders)
          float h = (vG.z - .42)/.34, k = (vG.z - .3)/.42, shade = 1. - .8*exp(-vG.y*vG.y*5.5 - k*k);
          float shape = exp(-vG.y*vG.y*1.1)*smoothstep(0., .1, vG.z)*(1. - smoothstep(.6, 1., vG.z))*(.3 + .7*exp(-h*h))*shade;
          // (an OPEN seat, nobody in it, lit by three standing arcs on its wall side: no shade, brighter toward them, and
          // the arcs' own brightening running up it by their own clock)
          if (vS.w > .5){ shape = smoothstep(0., .1, vG.z)*(1. - smoothstep(.7, 1., vG.z))*(1. - smoothstep(.75, 1., abs(vG.y)))*mix(1., .6, vG.y*.5 + .5); iw = .62 + .38*sin(uTime*1.5 - 1.25 - vG.z*2.5); }
          col = mix(vec3(.22, .5, 1.5)*iw, pic*ia, awake)*(shape*vS.z*${GLOW.SEAT.toFixed(3)});
        } else if (vG.x < 1.5){
          float d2 = dot(vG.yz, vG.yz); col = vec3(1., .7, .4)*(vS.z*${GLOW.POOL.toFixed(3)}*exp(-d2*3.)*(1. - smoothstep(.7, 1., d2)));
        } else {
          float b = 0.;
          for (int q = 0; q < 2; q++){ float dz = vP.z - uPulse[q].x, e = dz/mix(${GLOW.BAR_REACH[0].toFixed(1)}, ${GLOW.BAR_REACH[1].toFixed(1)}, smoothstep(-4., 4., dz*uPulse[q].y)); b += uPulse[q].w*exp(-e*e)*(.64 + .36*sin(dz*.45 - uTime*2.64)); }
          // (the ceiling is lit near white, where added blue would not show: here the sheet lies OVER it, turning it
          // toward the arcs' blue by the pulse's strength, never past BAR_MOST)
          if (vG.x < 2.5){ over = min(b*(1. - vG.y*vG.y)*${GLOW.BAR.toFixed(3)}, ${GLOW.BAR_MOST.toFixed(3)}); col = vec3(.3, .62, 1.7)*over; }
          else col = vec3(.16, .4, 1.25)*(b*(1. - vG.y*vG.y)*${GLOW.FLOOR.toFixed(3)});   // on the dark carpet the light is added
        }
        gl_FragColor = vec4(col, over);
      }`,
    // (what is behind is kept whole and the light added, but under the bars' sheet, where it is kept by 1 - over)
    transparent: true, blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor, depthWrite: false, side: THREE.DoubleSide,
  });
  const mesh = new THREE.Mesh(g, material); mesh.frustumCulled = false; mesh.renderOrder = 3; mesh.name = 'glow';
  return { mesh, material, triangles: I.length / 3, setPulse(q, z, ahead, strength) { uPulse.value[q].set(z, ahead, 0, strength); } };
}

// ------------------------------------------------------------------------------------------------------------------
// TUMBLERS: a plain glass (the kit's glass) and the drink in it, whose surface tips and slops gently as the cabin rides.
// list: [{ position: [x, y, z] (the middle of its foot), phase }]
// ------------------------------------------------------------------------------------------------------------------
export function makeTumblers(rig, L, list = []) {
  const SIDES = 14, H = 2.1, FILL = 1.3, rAt = (y) => 0.68 + 0.17 * (y / H);
  const gb = INT.makeBuilder(), P = [], N = [], A = [], I = []; let n = 0;
  for (const it of list) {
    const p = it.position, rows = [], inner = [];
    for (const y of [0, 0.12, H * 0.5, H]) rows.push(Array.from({ length: SIDES }, (_, i) => { const a = (i / SIDES) * TAU, r = rAt(y) * (y === 0 ? 0.9 : 1); return [p[0] + Math.cos(a) * r, p[1] + y, p[2] + Math.sin(a) * r]; }));
    for (const y of [H, 0.16]) inner.push(Array.from({ length: SIDES }, (_, i) => { const a = (i / SIDES) * TAU, r = rAt(y) - 0.07; return [p[0] + Math.cos(a) * r, p[1] + y, p[2] + Math.sin(a) * r]; }));
    gb.add(gridGeo(rows, true, true)); gb.add(gridGeo(inner, true, false)); gb.add(fanGeo(rows[0], false));
    // the drink: a wall and a lid; the lid's vertices carry aTop = 1 and are tipped in the shader
    const first = n;
    for (const [y, tp] of [[0.18, 0], [FILL, 1]]) for (let i = 0; i < SIDES; i++) { const a = (i / SIDES) * TAU, r = rAt(y) - 0.09; P.push(p[0] + Math.cos(a) * r, p[1] + y, p[2] + Math.sin(a) * r); N.push(Math.cos(a), 0, Math.sin(a)); A.push(p[0], p[2], tp, it.phase ?? 0); n++; }
    for (let i = 0; i < SIDES; i++) { const a = first + i, c = first + (i + 1) % SIDES; I.push(a, a + SIDES, c, c, a + SIDES, c + SIDES); }
    const lid = n;
    for (let i = 0; i < SIDES; i++) { const a = (i / SIDES) * TAU, r = rAt(FILL) - 0.09; P.push(p[0] + Math.cos(a) * r, p[1] + FILL, p[2] + Math.sin(a) * r); N.push(0, 1, 0); A.push(p[0], p[2], 1, it.phase ?? 0); n++; }
    P.push(p[0], p[1] + FILL, p[2]); N.push(0, 1, 0); A.push(p[0], p[2], 1, it.phase ?? 0); n++;
    for (let i = 0; i < SIDES; i++) I.push(lid + SIDES, lid + (i + 1) % SIDES, lid + i);
  }
  if (!n) return { object: null, triangles: 0 };
  const glassGeo = gb.build(), glass = new THREE.Mesh(glassGeo, INT.glassMaterial({ rig, color: '#dfeef2', opacity: 0.2 })); glass.frustumCulled = false; glass.renderOrder = 2; glass.name = 'tumblers';
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3)); g.setAttribute('aC', new THREE.Float32BufferAttribute(A, 4)); g.setIndex(I);
  const material = new THREE.ShaderMaterial({
    uniforms: { ...L.uniforms },
    vertexShader: /* glsl */`attribute vec4 aC; varying vec3 vP, vN, vIrr; varying float vTop;
      ${GLSL_CABIN}
      void main(){ vec3 p = position; vec2 l = p.xz - aC.xy; float ph = aC.w*6.2832;
        vec2 tip = vec2(sin(uTime*1.9 + ph) + .4*sin(uTime*3.1 + ph*2.), cos(uTime*1.4 + ph*1.7) + .4*sin(uTime*2.6 + ph))*.085;
        p.y += aC.z*(dot(l, tip) + .012*sin(uTime*7. + l.x*9. + l.y*7.));
        vP = p; vN = aC.z > .5 && normal.y > .5 ? normalize(vec3(-tip.x, 1., -tip.y)) : normal; vTop = aC.z;
        vec4 wl = owWindow(p); vIrr = uWinSky*wl.w*max((.35 + dot(vN, wl.xyz))/1.35, 0.);
        gl_Position = projectionMatrix*modelViewMatrix*vec4(p, 1.); }`,
    fragmentShader: /* glsl */`varying vec3 vP, vN, vIrr; varying float vTop;
      ${GLSL_CABIN}
      void main(){ vec3 N = normalize(vN + vec3(0., 1e-5, 0.)), V = normalize(uCamL - vP + vec3(0., 1e-5, 0.));
        vec3 amber = mix(vec3(.42, .15, .02), vec3(.86, .46, .08), vTop*.6 + .3);
        float mask = owSun(vP); vec3 sun = uSunCol*mask, hemi = mix(uAmbGround, uAmbSky, N.y*.5 + .5);
        vec3 col = amber*.3183*(hemi + vIrr + sun*(max(dot(N, uSunDir), 0.) + .45));          // the sun goes through it: it glows from within
        vec3 H = normalize(uSunDir + V + vec3(0., 1e-4, 0.)); col += sun*.25*pow(max(dot(N, H), 0.), 60.)*step(.5, N.y);
        gl_FragColor = vec4(col, 1.); }`,
  });
  const drink = new THREE.Mesh(g, material); drink.frustumCulled = false; drink.name = 'drinks';
  const object = new THREE.Group(); object.add(drink, glass);
  return { object, glass, drink, triangles: glassGeo.index.count / 3 + I.length / 3 };
}

// Where a machine goes for a sitter. it: the otter's own list entry ({ position, scale }), facing -z (yaw PI).
// Returns the entry for makeDevices (kind, position, yaw, tilt); back: true turns a phone the wrong way round.
export function machineFor(it, kind, o = {}) {
  const p = it.position, s = it.scale ?? 1, at = (x, y, z) => [p[0] - x * s, p[1] + y * s, p[2] - z * s];
  const held = it.habit === 0 && !o.back && (it.yaw ?? PI) === PI ? { held: { mirror: !!it.mirror, scale: s, phase: it.phase ?? 0, station: it.station ?? -1e6 } } : null;
  if (kind === 'phone') return { kind, position: at(0, 6.85, 3.52), yaw: o.back ? PI : 0, tilt: o.back ? 0.38 : -0.38, ...held, ...o };
  if (kind === 'tablet') return { kind, position: at(0, 6.5, 3.9), yaw: 0, tilt: -0.62, ...held, ...o };
  return { kind: 'laptop', position: [p[0], DIM.TRAY_Y, p[2] - 4.95 * s], yaw: 0, ...o };
}
