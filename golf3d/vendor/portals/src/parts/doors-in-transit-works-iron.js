// doors-in-transit: THE WORKS' IRON (the works builder's part): a small builder of flat-sided bars, and with it the
// rails (riveted I-beams in the works' green paint), the slender rods that hang them from the roof's ribs as a real
// overhead conveyor is hung, the walkway gratings, the tower's mast, arms and level bend beams, and the spur on its
// plain posts. Nothing slopes through the air: no raking girder and no brace anywhere. All of it stands still.
// THE RULES OF ITS PLACES (kept here by rule, counted by the works): a rod keeps 12 m from the flown line and 1.5 m
// from every rail and every door's swept path but the rail it carries; a post keeps 1.5 m from every passing door
// and touches nothing it does not carry; on the tower every fixed bar keeps 0.3 m and more from all that moves.
// Each vertex carries aUV (metres along its bar, metres across the face, the face's width: for the rivets) and aOff
// (its offset from the bar's axis and, for a slender member, the bar's own width: the material widens a member that
// would be under a pixel and a half to that, a filter by the pixel's footprint and nothing else).
import { TIERS, STRAIGHT, tierRadius, tierRail, tierLength, tierPoint, TOWER, SPUR, SHED, DOOR, MARKED } from './doors-in-transit-plan.js';
import { SHED_SUN_GLSL, shedSunUniform, shedBarsUniform } from './doors-in-transit-shed-sun.js';      // the joiner's bars of sun and shade: one function for the whole hall

export function makeBars() {
  const P = [], N = [], I = [], UV = [], OF = [], axes = [];
  const quad = (a, b, c, d, uv, off) => {
    const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = d[0] - a[0], vy = d[1] - a[1], vz = d[2] - a[2];
    let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
    const base = P.length / 3;
    P.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2], d[0], d[1], d[2]);
    for (let i = 0; i < 4; i++) N.push(nx, ny, nz);
    if (uv) UV.push(...uv); else UV.push(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
    if (off) OF.push(...off); else OF.push(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
    I.push(base, base + 1, base + 2, base, base + 2, base + 3);
  };
  // a bar from p to q, w wide (across) and h high (along `up` as nearly as the bar allows); caps: close its two ends;
  // slim: a slender member (a rod, a strap) that the material may widen by the pixel's footprint
  const bar = (p, q, w, h, up = [0, 1, 0], caps = false, slim = false) => {
    let ax = q[0] - p[0], ay = q[1] - p[1], az = q[2] - p[2]; const al = Math.hypot(ax, ay, az) || 1; ax /= al; ay /= al; az /= al;
    axes.push([p[0], p[1], p[2], q[0], q[1], q[2], Math.hypot(w, h) / 2, w, h, up[0], up[1], up[2]]);      // for the count of clear air: its axis, the reach of its skin, its section
    let sx = ay * up[2] - az * up[1], sy = az * up[0] - ax * up[2], sz = ax * up[1] - ay * up[0]; let sl = Math.hypot(sx, sy, sz);
    if (sl < 1e-4) { sx = 1; sy = 0; sz = 0; sl = 1; }
    sx /= sl; sy /= sl; sz /= sl;
    const ux = sy * az - sz * ay, uy = sz * ax - sx * az, uz = sx * ay - sy * ax;      // the bar's own up: side x axis
    const o = (a, b) => [sx * a * w / 2 + ux * b * h / 2, sy * a * w / 2 + uy * b * h / 2, sz * a * w / 2 + uz * b * h / 2];
    const cs = [o(-1, -1), o(1, -1), o(1, 1), o(-1, 1)], w0 = slim ? Math.min(w, h) : 0;
    const P0 = cs.map((c) => [p[0] + c[0], p[1] + c[1], p[2] + c[2]]), Q0 = cs.map((c) => [q[0] + c[0], q[1] + c[1], q[2] + c[2]]);
    for (let i = 0; i < 4; i++) {
      const j = (i + 1) % 4, W = i % 2 === 0 ? w : h;
      quad(P0[i], Q0[i], Q0[j], P0[j], [0, -W / 2, W, al, -W / 2, W, al, W / 2, W, 0, W / 2, W],
        [...cs[i], w0, ...cs[i], w0, ...cs[j], w0, ...cs[j], w0]);
    }
    if (caps) { quad(P0[0], P0[1], P0[2], P0[3]); quad(Q0[1], Q0[0], Q0[3], Q0[2]); }
  };
  return {
    quad, bar, axes,
    triangles: () => I.length / 3,
    geometry(THREE) {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3));
      g.setAttribute('aUV', new THREE.Float32BufferAttribute(UV, 3)); g.setAttribute('aOff', new THREE.Float32BufferAttribute(OF, 4));
      g.setIndex(I); g.computeBoundingSphere(); return g;
    },
  };
}

// the works' paint on iron, lit by the scene's own lights: rivets where asked (rows along the edges of every wide
// face, a seam every six metres), each filtered by the pixel's footprint; slender members widened to a pixel and a half
export function ironMaterial(THREE, color, rivets, U) {
  const m = new THREE.MeshLambertMaterial({ color });
  // two programs, told apart by name: with the rivets (rails, the tower's steps) and without (all other iron)
  m.customProgramCacheKey = () => 'doors-in-transit-iron' + (rivets ? '-rivets' : '');
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uHeight = U.uHeight; sh.uniforms.uShedSun = shedSunUniform; sh.uniforms.uShedBars = shedBarsUniform;
    sh.vertexShader = 'attribute vec3 aUV; attribute vec4 aOff; uniform float uHeight; varying vec3 vUV; varying vec3 vWp; varying float vSlim;\n' + sh.vertexShader.replace('#include <project_vertex>', /* glsl */`#include <project_vertex>
      { vec4 wpI = vec4(transformed, 1.);
        #ifdef USE_INSTANCING
          wpI = instanceMatrix * wpI;
        #endif
        vWp = (modelMatrix * wpI).xyz; }`).replace('#include <begin_vertex>', /* glsl */`
      vec3 transformed = vec3(position);
      vUV = aUV; vSlim = step(1e-4, aOff.w);
      if (aOff.w > 0.) {
        vec4 axisP = vec4(position - aOff.xyz, 1.);
        #ifdef USE_INSTANCING
          axisP = instanceMatrix * axisP;
        #endif
        float dist = max(0., -(modelViewMatrix * axisP).z);
        float need = 1.6 * dist * 2. / (max(projectionMatrix[1][1], 0.05) * max(uHeight, 16.));
        transformed += aOff.xyz * (max(1., need / aOff.w) - 1.);
      }`);
    // the roof ribs' and the end screen's bars of light and shade lie over the iron as over the floor and the doors
    const out = sh.fragmentShader.includes('#include <opaque_fragment>') ? '#include <opaque_fragment>' : '#include <output_fragment>';
    // (a slender member, a rod or a strap, is a line a few pixels wide whose one lit face the eye cannot find: it
    // shows its own paint at the least, as a rail's lit face does, and never a black line against the glass)
    sh.fragmentShader = 'varying vec3 vUV; varying vec3 vWp; varying float vSlim; uniform vec3 uShedSun; uniform float uShedBars;\n' + SHED_SUN_GLSL + sh.fragmentShader.replace(out,
      'outgoingLight *= mix(1., 0.6 + 0.4 * shedSunShade(vWp, uShedSun), uShedBars);\noutgoingLight = max(outgoingLight, diffuseColor.rgb * (0.85 * vSlim));\n' + out);
    if (!rivets) return;
    sh.fragmentShader = sh.fragmentShader.replace('#include <color_fragment>', /* glsl */`#include <color_fragment>
      {
        float fw = max(fwidth(vUV.x), fwidth(vUV.y)) + 1e-4, wide = step(0.5, vUV.z);
        float row = abs(vUV.y) - (vUV.z * 0.5 - 0.12);
        vec2 g = vec2((fract(vUV.x / 0.56) - 0.5) * 0.56, row);
        float d = length(g), keep = wide * (1. - smoothstep(0.06, 0.2, fw));
        float head = (1. - smoothstep(0.05 - fw, 0.05 + fw, d)) * keep;
        float ring = (1. - smoothstep(0.075 - fw, 0.075 + fw, d)) * keep;
        float seam = (1. - smoothstep(0.03, 0.03 + fw, abs(fract(vUV.x / 6.) - 0.5) * 6.)) * (1. - smoothstep(0.1, 0.4, fw));
        diffuseColor.rgb *= 1. - 0.3 * (ring - head) - 0.35 * seam;
        diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * 1.5 + 0.03, head * (0.55 + 0.45 * clamp(g.y / 0.05, -1., 1.)));
      }`);
  };
  return m;
}
// ---- an I-beam along a run of points (each [x, y, z]): bottom flange at the points' height, web and top flange over it
export const BEAM = { w: 0.9, h: 0.85 };      // a rail's section: its flanges' width, its height
export function iBeam(B, pts, closed, w = BEAM.w, h = BEAM.h) {
  const n = pts.length, last = closed ? n : n - 1;
  for (let i = 0; i < last; i++) {
    const a = pts[i], b = pts[(i + 1) % n];
    B.bar([a[0], a[1] + 0.07, a[2]], [b[0], b[1] + 0.07, b[2]], w, 0.14);
    B.bar([a[0], a[1] + h / 2, a[2]], [b[0], b[1] + h / 2, b[2]], 0.16, h - 0.2);
    B.bar([a[0], a[1] + h - 0.07, a[2]], [b[0], b[1] + h - 0.07, b[2]], w, 0.14);
  }
}
// tier k's oval moved `off` metres outward and `dy` up, as a closed run of points: each straight in six pieces (so
// that rivets and seams run true), each half circle in `arc` steps
export function ovalRun(k, off = 0, dy = 0, arc = 40) {
  const R = tierRadius(k) + off, y = tierRail(k) + dy, out = [];
  for (let i = 0; i < 6; i++) out.push([R, y, -STRAIGHT + 20 * i]);
  for (let i = 0; i <= arc; i++) { const a = Math.PI * i / arc; out.push([R * Math.cos(a), y, STRAIGHT + R * Math.sin(a)]); }
  for (let i = 1; i < 6; i++) out.push([-R, y, STRAIGHT - 20 * i]);
  for (let i = 0; i < arc; i++) { const a = Math.PI * i / arc; out.push([-R * Math.cos(a), y, -STRAIGHT - R * Math.sin(a)]); }
  return out;
}
// the shed's ribs stand every ribStep metres from 10 m inside the -z wall
export const RIB_Z = []; for (let z = SHED.z0 + 10; z < SHED.z1; z += SHED.ribStep) RIB_Z.push(z);
// where tier k's rail passes under a rib: [[x, z], ...]
export function underRibs(k) {
  const R = tierRadius(k), out = [];
  for (const z of RIB_Z) {
    const dz = Math.abs(z) - STRAIGHT;
    if (dz <= 0) { out.push([R, z], [-R, z]); continue; }
    if (dz < R - 3) { const x = Math.sqrt(R * R - dz * dz); out.push([x, z], [-x, z]); }
  }
  return out;
}

// ---- the stands. NOTHING SLOPES HERE: rails are level and carry hangers and doors; what carries the rails is plumb
// rods from the roof's ribs and level arms. No raking girder, no brace across the air.
// B: the rails (riveted). F: everything that carries them. o.roofY(x): the roof's line; o.lineGap(x, y0, y1, z): how
// far a plumb rod standing there, from y0 to y1, keeps from the flown line at its nearest (the works count the
// lens's run-in through the entry with the line, so that no rod is ever moved into the tube behind the entry).
// THE RODS' RULE. No rod stands within LINE (12 m) of the flown line, anywhere along either. Under every rib a rod
// hangs over the rail where that holds. Where it does not, the rod hangs at the nearest place along the same rib,
// outward or inward (every half metre, as far as REACH), that keeps 12 m from the line and stands clear of the
// other streets (1.5 m from a higher street's rail, doors and walkway; not in its own walkway) and of the tower;
// a level arm carries the beam from it, the deeper the longer it is. Where the rib has no such place no rod hangs
// (counted in `left`), and the rail's beam is DOUBLED there, a second beam riveted on its top from the hanger
// before to the hanger after: the longer span's deeper beam.
const ROD = 0.12, LINE = 12, REACH = 11;      // a slender tie rod (drawn a pixel and a half wide at the least)
const outOf = (j, x, z) => (Math.abs(z) <= STRAIGHT ? Math.abs(x) : Math.hypot(x, Math.abs(z) - STRAIGHT)) - tierRadius(j);      // metres outward of street j's rail, in plan
const rodStands = (k, x, z) => {
  for (let j = k; j < TIERS; j++) { const d = outOf(j, x, z); if (j === k ? d > 1.1 && d < 2.9 : d > -1.5 && d < 4.2) return false; }
  return Math.hypot(x - TOWER.x, z - TOWER.z) > TOWER.radius + 2 && Math.abs(x) < SHED.x1 - 3;
};
// how far along street k's rail a place of it lies (the plan's own measure, tierPoint)
const railAt = (k, x, z) => { const R = tierRadius(k), S = STRAIGHT;
  return z > S ? 2 * S + R * Math.atan2(z - S, x) : z < -S ? 4 * S + Math.PI * R + R * Math.atan2(-(z + S), -x) : x > 0 ? z + S : 2 * S + Math.PI * R + S - z; };
export function standsIron(B, F, o, k0 = 0, k1 = TIERS) {      // tiers k0 to k1 - 1 (one tier a call lets the builder yield between)
  const count = { rods: 0, moved: 0, left: 0, near: Infinity };
  for (let k = k0; k < k1; k++) {
    iBeam(B, ovalRun(k), true);
    const walk = ovalRun(k, 2.0, 0.55), n = walk.length, y0 = tierRail(k) + 0.85, L = tierLength(k), hung = [], bare = [];
    for (let i = 0; i < n; i++) F.bar(walk[i], walk[(i + 1) % n], 1.4, 0.14);              // the walkway's grating
    for (const [x, z] of underRibs(k)) {
      const side = Math.sign(x) || 1, top = (q) => o.roofY(q) - 1.3; let rx = null, gap = o.lineGap(x, y0, top(x), z);
      if (gap >= LINE) rx = x;
      else for (let d = 0.5; d <= REACH && rx === null; d += 0.5) for (const sg of [1, -1]) {
        const q = x + side * sg * d; if (!rodStands(k, q, z)) continue;
        const g = o.lineGap(q, y0, top(q), z); if (g >= LINE) { rx = q; gap = g; break; }
      }
      const out = Math.hypot(x, Math.max(0, Math.abs(z) - STRAIGHT)) || 1, ux = x / out, uz = (Math.abs(z) > STRAIGHT ? (Math.abs(z) - STRAIGHT) * Math.sign(z) : 0) / out;
      F.bar([x + ux * 0.2, y0 - 0.3, z + uz * 0.2], [x + ux * 2.7, y0 - 0.3, z + uz * 2.7], 0.26, 0.26);   // the walkway's level arm
      if (rx === null) { count.left++; bare.push(railAt(k, x, z)); continue; }
      count.rods++; count.near = Math.min(count.near, gap); hung.push(railAt(k, x, z));
      F.bar([rx, y0, z], [rx, top(rx), z], ROD, ROD, [1, 0, 0], false, true);                 // the rod from the rib
      if (rx !== x) { const len = Math.abs(rx - x); count.moved++;                             // its level arm to the beam, and the rod's foot
        F.bar([rx, y0 + 0.25, z], [x, y0 + 0.25, z], 0.3, 0.4 + 0.03 * len); F.bar([rx, y0 - 0.1, z], [rx, y0 + 0.6, z], 0.5, 0.5, [1, 0, 0], true); }
      F.bar([x, y0 - 0.1, z], [x, y0 + 0.9, z], 0.5, 0.7, [1, 0, 0], true);                   // the clevis on the rail
    }
    // the doubled beam over every stretch that has lost a rod: from 0.6 m past the hanger before to 0.6 m short of the hanger after
    const done = new Set();
    for (const s of bare) {
      let a = -Infinity, b = Infinity; for (const h of hung) { const back = ((s - h) % L + L) % L, on = ((h - s) % L + L) % L; if (back < s - a) a = s - back; if (on < b - s) b = s + on; }
      const key = Math.round(a * 50); if (!hung.length || done.has(key)) continue; done.add(key);
      const m = Math.max(2, Math.round((b - a - 1.2) / 2));
      for (let i = 0; i < m; i++) { const p = tierPoint(k, a + 0.6 + (b - a - 1.2) * i / m), q = tierPoint(k, a + 0.6 + (b - a - 1.2) * (i + 1) / m); B.bar([p[0], y0 + 0.35, p[2]], [q[0], y0 + 0.35, q[2]], 0.5, 0.7); }
    }
  }
  return count;
}
// ---- the winding tower's iron: (B) the level beams of the two bends; (F) a slim lattice mast on the axis, a crown
// ring under the lantern's curb (y 99), and what carries the screw. On the screw itself and on the bends' ramps
// there is no fixed rail: every door rides its own short level step (the works draw those), so that no sloping
// track winds through the air.
// THE SCREW'S CARRIERS, by rule. Eight to a turn round each thread, a level arm from the mast ends 0.9 m inside the
// thread, level with a passing step: steps, carriers and doors go by its head and never under or over it. Where
// such an arm would cross what moves along the head's bend (whose doors hang inside the screw there; half a metre
// allowed), a plumb rod comes down from the crown ring instead, to a shoe 1.75 m over the thread; and a rod that
// would stand within 1.5 m of a bend's rail or of its doors' swept path is left out (the steps carry on past it).
// WHAT STANDS OVER THE PLAN'S HEAD. The threads end at the head. The head's bend climbs on from there to its level
// beam LIFT higher (the beam's top 0.85 m and its clevises 1.35 m over that); three plumb rods carry the beam from
// the crown ring, and the crown rods of the last half turns come down beside it; the mast's four corner bars and
// their level battens run on to the mast's top, with the crown ring and its eight spokes 0.9 m under it. Over the
// mast's top there is 1.4 m of air to the lantern's curb.
// THE TWO COUNTED DISTANCES (doors-in-transit-works-count.js, on every build, kept as works.towerAir).
// MOVING AGAINST MOVING: nothing that moves with one door comes nearer than 0.59 m to anything that moves with
// another, anywhere on the course, nor to an arm, a rod or a shoe that carries the other thread. The least is a
// lower door's step under the corner of an upper door's sill: the threads lie APART (12 m) and a door hangs 9.8 m,
// and the sill is level while the thread under it climbs, which is why the tower's carriers are small and stand
// close under the rail (…-works-tower.js, GEAR) and why the bends stand beyond the threads' ends (LIFT).
// MOVING AGAINST FIXED: 0.30 m, a carrier's wheel passing under a clevis on a bend's beam; a carrier's cheek passes
// the head of an arm at 0.33 m, a strap hangs 0.33 m under the beam its door runs in, a step passes a rod's shoe at
// 0.8 m, a leaf passes the mast at 1.1 m. (Not counted, being contact by nature: a carrier's wheels in the beam
// they run in, and a step sliding into the end of the beam that takes its door over.)
export function towerIron(B, F, T) {
  const { towerPoint, threadHeight, beamAt, TOWER_INFO, S_SMALL, APART, LIFT } = T, ax = TOWER.x, az = TOWER.z, R = TOWER.radius;
  // what stands where, for the tower's count: [what, the thread it carries or -1, the bend it is the beam of or -1, the list of bars, from, to]
  const marks = [], mark = (what, thread, bend, list, from) => marks.push([what, thread, bend, list.axes, from, list.axes.length]);
  // the only fixed rail: each bend's level stretch (onBeam), of the streets' own section, so that the carriers'
  // wheels run inside it; a point every metre or so
  for (let bend = 0; bend < 2; bend++) {
    const from = B.axes.length, n = Math.round(T.BEAM_LENGTH), run = [];
    for (let i = 0; i <= n; i++) { const q = beamAt(bend, i / n); run.push([q[0], q[1], q[2]]); }
    iBeam(B, run, false); mark('the beam of the ' + (bend ? 'foot' : 'head') + '\'s bend', -1, bend, B, from);
  }
  // the mast stands to 1.4 m under the lantern's curb (never higher), and never more than 17.6 m over the plan's head
  const top = Math.min(97.6, TOWER.head + 17.6), m = 1.0, f0 = F.axes.length;
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) F.bar([ax + sx * m, 0, az + sz * m], [ax + sx * m, top, az + sz * m], 0.32, 0.32, [1, 0, 0]);
  for (let y = 4; y < top - 0.1; y += 4) {                        // level battens only: nothing on the mast slopes
    F.bar([ax - m, y, az + m], [ax + m, y, az + m], 0.2, 0.2); F.bar([ax - m, y, az - m], [ax + m, y, az - m], 0.2, 0.2);
    F.bar([ax + m, y, az - m], [ax + m, y, az + m], 0.2, 0.2); F.bar([ax - m, y, az - m], [ax - m, y, az + m], 0.2, 0.2);
  }
  const ringY = top - 0.9;                       // the crown ring under the lantern, and its spokes
  for (let i = 0; i < 16; i++) {
    const a = Math.PI * 2 * i / 16, b = Math.PI * 2 * (i + 1) / 16;
    F.bar([ax + R * Math.cos(a), ringY, az + R * Math.sin(a)], [ax + R * Math.cos(b), ringY, az + R * Math.sin(b)], 0.4, 0.5);
    if (i % 2 === 0) F.bar([ax + m * Math.cos(a), ringY, az + m * Math.sin(a)], [ax + R * Math.cos(a), ringY, az + R * Math.sin(a)], 0.26, 0.4);
  }
  mark('the mast and the crown ring', -1, -1, F, f0);
  // the bends' rail lines in plan (every quarter metre), the heights between which each one's rail runs, and how far
  // to either side of its rail a bend's doors sweep
  const sLine = (s0) => { const out = []; for (let s = 0; s <= TOWER_INFO.LS; s += 0.25) { const q = towerPoint(s0 + s); out.push([q[0], q[2]]); } return out; };
  const bends = [{ y0: TOWER.head, y1: TOWER.head + LIFT, line: sLine(TOWER_INFO.LA) }, { y0: TOWER.foot - LIFT, y1: TOWER.foot, line: sLine(2 * TOWER_INFO.LA + TOWER_INFO.LS) }];
  const sweep = Math.hypot(S_SMALL, DOOR.frameW / 2) + DOOR.depth / 2 - S_SMALL, CLEAR = 0.5;
  const planGap = (line, x0, z0, x1, z1) => {      // the least distance in plan from the stretch (x0, z0)-(x1, z1) to a line of points
    const dx = x1 - x0, dz = z1 - z0, l2 = dx * dx + dz * dz || 1; let best = Infinity;
    for (const q of line) { const t = Math.min(1, Math.max(0, ((q[0] - x0) * dx + (q[1] - z0) * dz) / l2)); best = Math.min(best, Math.hypot(q[0] - x0 - dx * t, q[1] - z0 - dz * t)); }
    return best;
  };
  // a thread higher than `limit` has no thread over it (the threads lie APART; 0.2 m to spare), only a bend's ramp near its end
  const ARM_IN = 0.9, ARM_UP = 0.4, SHOE_UP = 1.75, limit = TOWER.head - APART - 0.2, gearTop = T.GEAR.stepTop;
  for (let thread = 0; thread < 2; thread++) for (let turn = 0; turn < TOWER.turns; turn++) for (let i = 0; i < 8; i++) {
    const a = Math.PI * 2 * i / 8 + 0.2, y = threadHeight(thread, a, turn), c = Math.cos(a), sn = Math.sin(a), from = F.axes.length;
    if (y >= TOWER.head - 1.5) continue;
    const x0 = ax + m * c, z0 = az + m * sn, x1 = ax + (R - ARM_IN) * c, z1 = az + (R - ARM_IN) * sn, ya = y + ARM_UP;
    // does the arm cross what moves along a bend (its doors below its rail, their carriers on it), CLEAR and its own half size allowed?
    const crosses = bends.some((b) => ya + 0.12 + CLEAR > b.y0 - DOOR.drop && ya - 0.12 - CLEAR < b.y1 + gearTop && planGap(b.line, x0, z0, x1, z1) < sweep + 0.14 + CLEAR);
    if (!crosses) { F.bar([x0, ya, z0], [x1, ya, z1], 0.28, 0.24); mark('an arm of thread ' + 'AB'[thread], thread, -1, F, from); continue; }
    const xr = ax + R * c, zr = az + R * sn;
    if (y <= limit || bends.some((b) => b.y1 > y && planGap(b.line, xr, zr, xr, zr) < sweep + 1.5)) continue;      // no rod through the thread above, none beside a bend
    F.bar([xr, y + SHOE_UP, zr], [xr, ringY, zr], 0.24, 0.24, [c, 0, sn], false, true);
    F.bar([xr, y + SHOE_UP, zr], [xr, y + SHOE_UP + 0.5, zr], 0.5, 0.5, [c, 0, sn], true);      // its shoe over the passing steps
    mark('a crown rod and its shoe over thread ' + 'AB'[thread], thread, -1, F, from);
  }
  // each bend's own hangers, three along its beam (its middle, and 14 hundredths in from either end, clear of the
  // steps that slide into the beam's ends): at the head plumb rods from the crown ring, at the foot short level
  // arms from the mast over the beam; each with a clevis on the beam's top
  const clevis = (q) => F.bar([q[0], q[1] + 0.75, q[2]], [q[0], q[1] + 1.35, q[2]], 0.5, 0.6, [1, 0, 0], true), f1 = F.axes.length;
  for (const k of [0.14, 0.5, 0.86]) {
    const h = beamAt(0, k), g = beamAt(1, k), l = Math.hypot(g[0] - ax, g[2] - az);
    F.bar([h[0], h[1] + 0.85, h[2]], [h[0], ringY, h[2]], 0.24, 0.24, [1, 0, 0], false, true); clevis(h);
    F.bar([ax + (g[0] - ax) / l * m, g[1] + 1.1, az + (g[2] - az) / l * m], [g[0], g[1] + 1.1, g[2]], 0.28, 0.24); clevis(g);
  }
  mark('a hanger of a bend\'s beam', -1, -1, F, f1);
  return marks;
}

// ---- the spur: the rail from the points to its buffer in the bay (B), on four plain posts across the arena floor (F)
export function spurRun(step = 2.2) {
  const out = [], n = Math.round(Math.PI / 2 * SPUR.r / step);
  for (let i = 0; i <= n; i++) { const a = Math.PI / 2 * i / n; out.push([SPUR.cx + SPUR.r * Math.cos(a), SPUR.rail, SPUR.cz - SPUR.r * Math.sin(a)]); }
  out.push([SPUR.bufferX, SPUR.rail, SPUR.endZ]);
  return out;
}
export function spurIron(B, F) {
  iBeam(B, spurRun(), false);
  // THE POSTS' RULE: four plain rail posts on the outer side of the curve, each an upright with a short level
  // bracket lying on the beam's top flange (the marked door's hangers run under the flange, 0.35 m below the bracket;
  // the post's top is flush with the bracket: no head, no arm beyond the rail). Every post stands far enough outside
  // the rail that it keeps 1.5 m from the marked door's far corner and hangers as they swing by. The first stands at
  // the first whole degree round the curve where it also keeps 1.5 m from the lowest street's passing doors and
  // hangers (their sway counted), which puts it clear of that street's beam and walkway too; the last stands 77
  // degrees round, 4 m short of the bay's wall; the other two evenly between. A post touches the floor and the
  // spur's beam and nothing else.
  const reach = 0.3, mHalf = MARKED.w / 2 + 0.4, skin = 0.6;      // a post's corner from its axis; the marked door's half width with its frame; what passes on a rail to either side of it (a door's half depth and sway, a hanger's yoke)
  const ro = Math.hypot(SPUR.r + skin, mHalf) + 1.5 + reach, R0 = tierRadius(0);
  const fromStreet = (deg) => { const a = deg * Math.PI / 180, x = SPUR.cx + ro * Math.cos(a), z = SPUR.cz - ro * Math.sin(a);
    return (z >= -STRAIGHT ? R0 - x : R0 - Math.hypot(x, z + STRAIGHT)) - skin - reach; };
  let first = 0; while (first < 60 && fromStreet(first) < 1.5) first++;
  for (let i = 0; i < 4; i++) {
    const a = (first + (77 - first) * i / 3) * Math.PI / 180, c = Math.cos(a), sn = Math.sin(a);
    const foot = [SPUR.cx + ro * c, 0, SPUR.cz - ro * sn], yb = SPUR.rail + 0.95;
    F.bar(foot, [foot[0], yb + 0.1, foot[2]], 0.42, 0.42, [c, 0, -sn]);                                 // the upright, flush with its bracket's top
    F.bar(foot, [foot[0], 0.4, foot[2]], 0.8, 0.8, [c, 0, -sn], true);                                  // its base plate
    F.bar([foot[0], yb, foot[2]], [SPUR.cx + SPUR.r * c, yb, SPUR.cz - SPUR.r * sn], 0.3, 0.2);          // the short bracket, lying on the beam's top flange
  }
  // the buffer: a stop block on the rail's end with two sprung heads
  F.bar([SPUR.bufferX - 0.2, SPUR.rail - 0.5, SPUR.endZ], [SPUR.bufferX - 0.2, SPUR.rail + 1.0, SPUR.endZ], 1.0, 0.5, [1, 0, 0], true);
  for (const dz of [-0.28, 0.28]) F.bar([SPUR.bufferX, SPUR.rail - 0.3, SPUR.endZ + dz], [SPUR.bufferX + 0.7, SPUR.rail - 0.3, SPUR.endZ + dz], 0.22, 0.22, [0, 1, 0], true);
}

