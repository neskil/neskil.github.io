// HERO SET PIECE for "pneumatic-emporium" (The Pneumatic Emporium): THE TUBE BUNDLE.
//
// Forty glass pneumatic tubes (1 m bore) leave the shop floor, run round an oval well as five glass
// shelves, leap the well on five slender glass bridges to the clock column, wind up it together as a
// transparent rope 17 m thick (about two turns round the swinging pendulum), then open like the pipes
// of an organ turned upside down into brass bell-mouths in the dark coffered belly of the cashier's
// nest. The piece contains: all forty tubes with their sliding highlight lines and running glints,
// brass collars, shelf and bridge glass with brass bearers, up to 100 brass capsules with felt noses
// racing along the tubes, the iron lattice clock column with four dials (ticks only, moving hands), the
// 30 m pendulum, the nest (mahogany and glass cabin, coffered belly, hanging rods) and the great horn:
// a 15 m brass bell-mouth under the nest's rim where the exit portal sits.
// The clock column is 65 m tall with an open crown (rail, four hips, brass finial), so the horn is seen over it; the horn's
// bell flares on to a 19.4 m fluted lip round the 14 m opening.
// It does NOT contain the balconies, the dome, lifts, goods or the camera's own capsule.
//
// LOCAL SPACE: origin = centre of the well on the shop floor (y = 0), +Y up, X = long axis of the
// oval, front = +Z. The well edge (balcony fronts) is the ellipse x = 55 cos t, z = 35 sin t.
// Balcony floors are expected at y = 13, 26, 39, 52, 65 (, 78); shelves hang 1.6 m under tiers 1-5
// on the balcony side of the edge (offsets +0.6 .. +7.8 m, seven tubes); the two "express" tubes (OURS
// and one neighbour 1.2 m outside it) climb as a helix just inside the well (offsets -2.6 / -1.4 m)
// from y 11.4 to 63.4 in about 2.4 anticlockwise laps (seen from above with +Z down the page; the
// well is on the camera's left). Each shelf rises from the floor as a diagonal row of seven vertical
// risers THROUGH the balcony slabs just beyond its bridge (anchors.risers gives the places).
//
// OUR TUBE (the camera's): anchors.flyThrough. Level lead-in 6 m under the floor, a 38 degree ramp up
// through the floor into the well, the helix, then it leaves the ring past the -X end on its own slim
// glass bridge, passes the rope 17.5 m to its left at y 64-69, makes one wide left turn (17 m radius)
// at the +X end above the tier-5 bridge and runs 44 m dead straight, 9 degrees above level, into the
// great horn (anchors.portalSeat). Feed anchors.flyThrough to makePath VERBATIM as the last points
// (prepend basement points on the line entry.position - entry.direction * t): the tube mesh is built
// on the same centripetal Catmull-Rom, so the camera stays on its axis.
//
// opts:
//   palette   7 hex strings in the brief's order [cream, brass, iron, peacock, daylight, red, bunting]
//   pane      hex colour of the dome's coloured panes: tints the glass edges (default palette[3]);
//             pass a mauve for jacaranda week, the daylight white for the white sale
//   capsules  number of everyday capsules (default 40, thinned by ctx.quality.detail above 24)
//   portalFill  true (default): a dim placeholder disc in the horn so the piece reads alone; pass false
//   light     { color, intensity, dir } of the zenith key used by the hero's own shaders
//   leadIn    metres of level lead-in before the ramp (default 36); the world passes its basement's length
//   rival     seven u values that script the white-nosed rival (approach, level, ahead, .., gone)
//   rivalAhead  (u) => metres the white-nosed rival is ahead of the camera (overrides rival)
// RETURN extras:
//   setProgress(u)  u in 0..1 along anchors.flyThrough (0 = entry, 1 = horn). Drives the scripted
//                   white-nosed rival in the neighbouring tube (level with the camera at u ~ 0.60,
//                   ahead at 0.66, taken back by 0.74) and three capsules that vanish into mouths
//                   beside the horn just before u = 1. Until called everything free-runs on time.
//   setVolley(v)    rare event: v 0..1 fades in 60 extra, larger capsules that stream up the rope's strands and round the
//                   shelves; from u 0.865 (setProgress) they close on their bell-mouths and arrive together at u 0.95-0.985.
//   setLight(colorHex, intensity, dirVec3)   key light for the hero's own shaders
//   ride            { length, at(s, pos, tan) } our tube's axis; tubes: baked tables of all forty.
//   uniforms        shared uniforms (uTime, uKey, uAmb, uPane, uLDir, uPix, uPortal, uGlow). uPortal thins glass and lattice
//                   where they cross the line of sight to the horn's mouth (driven in update); uGlow scales the horn's warm lining.
// anchors (local): portalSeat { position, normal, radius 7, pitch } ; flyThrough [Vector3] ;
//   entry { position, direction } ; wellEdge { a, b } ; tiers [y] ; shelfY [y] ; risers [{position, tier}] ;
//   bridges [{ from, to, y, width }] ; clock { base, top, dialsY, pendulumPivot } ;
//   nest { center, radius, floorY, bellyY, roofY, rodTops [Vector3] } ; viewpoints { wholeWell, bridge, horn }.
//
// SIZE radius 66, height 118 (rods), centre (0, 52, 0). COST about 120k triangles, 17 draw calls,
// no lights of its own. LIGHTING: wants a pale zenith key + hemisphere (the Standard materials use the
// scene's lights; the glass, lattice and dial shaders use setLight). Glass is drawn premultiplied, so
// it reads on pale stone (darker green edges) and on shadow (bright lines) alike.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { clamp, lerp, smoothstep } from '../kit/core.js';

const PALETTE = ['#EFE6D2', '#B88A3A', '#1C2B2A', '#1E8C7A', '#F4F8F6', '#B3202C', '#8FC1E3'];
const WA = 55, WB = 35, DEG = Math.PI / 180, TAU = Math.PI * 2;
const SHELF_Y = [11.4, 24.4, 37.4, 50.4, 63.4];
const RR = 8.6, RIN = 6.6, NSLOT = 39, YTOP = 76, YBASE = -6;
const TH0 = 63 * DEG, THL = 925 * DEG, THA = TH0 - 44 * DEG;
const MOUTH = [-12, 83, 16.5], TURN_X = 31, PITCH = 9 * DEG;
const NEST_R = 17, NEST_FLOOR = 92;
const bellyY = (r) => 83 + 9 * Math.min(1, (r / NEST_R) * (r / NEST_R));

// point on the well edge, moved outward by off (inward if negative)
function ell(th, off, y) {
  const c = Math.cos(th), s = Math.sin(th);
  let nx = WB * c, nz = WA * s; const l = Math.hypot(nx, nz); nx /= l; nz /= l;
  return [WA * c + nx * off, y, WB * s + nz * off];
}
const thetaOfAzimuth = (b) => Math.atan2(WA * Math.sin(b), WB * Math.cos(b));

// ---------- layout: every tube as a list of control points ----------
export async function planLayout(rng, leadIn = 36, pause = null) {       // pause: ctx.yield, so the planning is cut into short steps
  const turns = rng.range(1.75, 2.25);
  const tw = (TAU * turns) / (YTOP - SHELF_Y[0]);
  const gapA = rng.range(13, 20) * DEG;
  const ringPhase = rng.int(0, 2);
  // slots: tier k gets 7 neighbours (tier 5 gets 8), floor risers sit between the groups
  const slotBase = [0, 8, 16, 24, 31], riserSlots = [7, 15, 23];
  const mid5 = 34.5;
  const phi0 = -(TAU * mid5) / NSLOT;                       // tier-5 bridge arrives along +X
  const slotAz = (s, y) => phi0 + (TAU * s) / NSLOT + tw * (y - SHELF_Y[4]);

  // --- our tube ---
  const ride = []; let leaveIdx = 0;
  {
    const a0 = ell(THA, -2.6, YBASE), a1 = ell(THA + 0.01, -2.6, YBASE);
    let dx = a1[0] - a0[0], dz = a1[2] - a0[2]; const l = Math.hypot(dx, dz); dx /= l; dz /= l;
    for (let t = Math.max(36, Math.round(leadIn / 12) * 12); t >= 12; t -= 12) ride.push([a0[0] - dx * t, YBASE, a0[2] - dz * t]);
    const nr = 8;
    for (let i = 0; i < nr; i++) { const q = i / nr; ride.push(ell(lerp(THA, TH0, q), -2.6, YBASE + (SHELF_Y[0] - YBASE) * q * q * (3 - 2 * q))); }
    const nh = Math.round((THL - TH0) / (6 * DEG));
    for (let i = 0; i <= nh; i++) { const q = i / nh; ride.push(ell(lerp(TH0, THL, q), -2.6, lerp(SHELF_Y[0], SHELF_Y[4], q))); }
    const leave = ride.length;
    leaveIdx = leave - 1;
    const tail = [[-38, 0, -18.4], [-28, 0, -17.6], [-16, 0, -17.5], [-4, 0, -17.5], [8, 0, -17.5], [20, 0, -17.5]];
    for (let a = -90; a <= 90.01; a += 18) tail.push([TURN_X + 17 * Math.cos(a * DEG), 0, -0.5 + 17 * Math.sin(a * DEG)]);
    let S = 0; const cs = []; let p = ride[leave - 1];
    for (const q of tail) { S += Math.hypot(q[0] - p[0], q[2] - p[2]); cs.push(S); p = q; }
    const cp = Math.cos(PITCH), sp = Math.sin(PITCH);
    const tExit = (TURN_X - MOUTH[0]) / cp, yExit = MOUTH[1] - sp * tExit;
    // the bridge climbs early, so that from the clock onward the eye is level with the rope's crown and looks over it at the horn
    const m1 = Math.tan(PITCH) * S / (yExit - SHELF_Y[4]), m0 = 3.6;
    tail.forEach((q, i) => { const f = cs[i] / S, f2 = f * f, f3 = f2 * f; q[1] = SHELF_Y[4] + (yExit - SHELF_Y[4]) * (m0 * (f3 - 2 * f2 + f) + (3 * f2 - 2 * f3) + m1 * (f3 - f2)); ride.push(q); });
    for (const t of [33, 22, 11, 0]) ride.push([MOUTH[0] + cp * t, MOUTH[1] - sp * t, MOUTH[2]]);
  }
  const rideCurve = new THREE.CatmullRomCurve3(ride.map((p) => new THREE.Vector3(p[0], p[1], p[2])), false, 'centripetal', 0.5);
  rideCurve.arcLengthDivisions = ride.length * 8;
  const rideLen = rideCurve.getLength();
  const rideSamp = rideCurve.getSpacedPoints(Math.round(rideLen / 2));
  if (pause) await pause();

  // --- bridges: direction from the rope's twist, nudged until clear of our helix ---
  const bridges = [];
  for (let k = 0; k < 5; k++) {
    const n = k === 4 ? 8 : 7, y = SHELF_Y[k];
    const beta = slotAz(slotBase[k] + (n - 1) / 2, y);
    const J = [RR * Math.cos(beta), y, RR * Math.sin(beta)];
    let best = null;
    for (const d of [0, 7, -7, 14, -14, 21, -21, 28, -28, 35, -35]) {
      const thOut = thetaOfAzimuth(beta) + d * DEG, Q = ell(thOut, 0, y);
      let clear = 1e9;
      for (let i = 0; i <= 12; i++) {
        const f = i / 12, x = lerp(Q[0], J[0], f) , z = lerp(Q[2], J[2], f);
        for (let j = 0; j < rideSamp.length; j += 2) { const r = rideSamp[j]; const dd = Math.hypot(r.x - x, r.y - y, r.z - z); if (dd < clear) clear = dd; }
      }
      if (k === 4) clear = 99;                                // tier 5 is fixed on +X; our turn passes 8 m above it
      if (!best || clear > best.clear + 0.01) best = { thOut, Q, J, clear, n, y, beta, k };
      if (clear > 9.5) break;
    }
    const ul = Math.hypot(best.J[0] - best.Q[0], best.J[2] - best.Q[2]);
    best.u = [(best.J[0] - best.Q[0]) / ul, (best.J[2] - best.Q[2]) / ul]; best.len = ul;
    const e = ell(best.thOut + 0.01, 0, y);                   // lateral axis points the way of increasing angle
    let vx = -best.u[1], vz = best.u[0]; if (vx * (e[0] - best.Q[0]) + vz * (e[2] - best.Q[2]) < 0) { vx = -vx; vz = -vz; }
    best.v = [vx, vz];
    bridges.push(best);
    if (pause) await pause();
  }

  // --- bell-mouths in the belly: one per rope strand, kept out of the horn's corridor ---
  const cp = Math.cos(PITCH), sp = Math.sin(PITCH);
  const corridor = (x, y, z) => {
    const t = clamp((x - MOUTH[0]) * cp - (y - MOUTH[1]) * sp, -6, 48);
    return Math.hypot(x - (MOUTH[0] + cp * t), y - (MOUTH[1] - sp * t), z - MOUTH[2]);
  };
  const ringR = [14.0, 10.4, 6.6];
  const mouthOf = (s) => {
    const az0 = slotAz(s, YTOP) + tw * 4.5;
    let pick = null;
    for (let tryI = 0; tryI < 3; tryI++) {
      const r = ringR[(s + ringPhase + tryI) % 3], yb = bellyY(r);
      const c = corridor(r * Math.cos(az0), yb, r * Math.sin(az0));
      if (!pick || c > pick.c) pick = { r, yb, az: az0, c };
      if (c > 10.5) break;
    }
    return pick;
  };

  const tubes = [];
  const ropeUp = (pts, s, yFrom) => {
    const R = s % 2 ? RIN : RR;
    for (let y = yFrom; y < YTOP - 0.4; y += 1.6) { const a = slotAz(s, y); pts.push([R * Math.cos(a), y, R * Math.sin(a)]); }
    const a = slotAz(s, YTOP); pts.push([R * Math.cos(a), YTOP, R * Math.sin(a)]);
    const m = mouthOf(s), a1 = slotAz(s, YTOP) + tw * 2.4, r1 = R + (m.r - R) * 0.3;
    pts.push([r1 * Math.cos(a1), YTOP + 3.2, r1 * Math.sin(a1)]);
    const r2 = R + (m.r - R) * 0.86, a2 = m.az - tw * 0.4;
    pts.push([r2 * Math.cos(a2), m.yb - 3.4, r2 * Math.sin(a2)]);
    pts.push([m.r * Math.cos(m.az), m.yb - 1.3, m.r * Math.sin(m.az)]);
    pts.push([m.r * Math.cos(m.az), m.yb + 0.3, m.r * Math.sin(m.az)]);
    return m;
  };
  const risers = [];
  const bridgeLane = (pts, br, idx, off, thFrom) => {
    // ring from thFrom up to where this lane's line leaves, then the lane, then the rope
    const l = (idx - (br.n - 1) / 2) * 1.2, y = br.y;
    let th = br.thOut + 0.2, e = null, d = 0;
    for (let i = 0; i < 400; i++) { e = ell(th, off, y); d = (e[0] - br.Q[0]) * br.v[0] + (e[2] - br.Q[2]) * br.v[1] - l; if (d <= -3.6) break; th -= 0.004; }
    const nA = Math.max(2, Math.round((th - thFrom) / (5 * DEG)));
    for (let i = 1; i <= nA; i++) pts.push(ell(lerp(thFrom, th, i / nA), off, y));
    const tE = (e[0] - br.Q[0]) * br.u[0] + (e[2] - br.Q[2]) * br.u[1];
    const s = slotBase[br.k] + idx, a = slotAz(s, y);
    const Rp = (s % 2 ? RIN : RR) + 2.8, pre = [Rp * Math.cos(a), y, Rp * Math.sin(a)];
    const tPre = (pre[0] - br.Q[0]) * br.u[0] + (pre[2] - br.Q[2]) * br.u[1];
    const lPre = (pre[0] - br.Q[0]) * br.v[0] + (pre[2] - br.Q[2]) * br.v[1];
    const t0 = tE + 3.8, nS = Math.max(2, Math.round((tPre - 3 - t0) / 6));
    for (let i = 0; i <= nS; i++) {
      const f = i / nS, t = lerp(t0, tPre - 3, f), ll = lerp(l, lPre, f * f * (3 - 2 * f));
      pts.push([br.Q[0] + br.v[0] * ll + br.u[0] * t, y, br.Q[2] + br.v[1] * ll + br.u[1] * t]);
    }
    pts.push(pre);
    return ropeUp(pts, s, y + 0.9);
  };
  for (let k = 0; k < 5; k++) {
    const br = bridges[k], y = br.y;
    for (let j = 0; j < 7; j++) {
      const off = 0.6 + 1.2 * j, idx = k === 4 ? j + 1 : j;
      const thS = br.thOut - TAU + gapA + j * 0.036, dTh = (9.4 - off) * 0.018 + 0.05;
      const pts = [ell(thS, 9.4, YBASE), ell(thS, 9.4, y * 0.45 - 2), ell(thS, 9.4, y - 4.6),
        ell(thS + dTh * 0.4, lerp(9.4, off, 0.35), y - 0.8), ell(thS + dTh, off, y)];
      risers.push({ position: ell(thS, 9.4, 0), tier: k + 1 });
      const mouth = bridgeLane(pts, br, idx, off, thS + dTh);
      tubes.push({ pts, kind: 'shelf', tier: k, lane: j, mouth });
    }
    if (pause) await pause();
  }
  {                                                           // the neighbour: helix beside ours, then tier 5's ring and bridge
    const pts = [];
    const a0 = ell(THA, -1.4, YBASE), a1 = ell(THA + 0.01, -1.4, YBASE);
    let dx = a1[0] - a0[0], dz = a1[2] - a0[2]; const l = Math.hypot(dx, dz); dx /= l; dz /= l;
    for (let t = Math.max(36, Math.round(leadIn / 12) * 12); t >= 12; t -= 12) pts.push([a0[0] - dx * t, YBASE, a0[2] - dz * t]);
    const nr = 8;
    for (let i = 0; i < nr; i++) { const q = i / nr; pts.push(ell(lerp(THA, TH0, q), -1.4, YBASE + (SHELF_Y[0] - YBASE) * q * q * (3 - 2 * q))); }
    const nh = Math.round((THL - TH0) / (6 * DEG));
    for (let i = 0; i <= nh; i++) { const q = i / nh; pts.push(ell(lerp(TH0, THL, q), -1.4, lerp(SHELF_Y[0], SHELF_Y[4], q))); }
    const br = bridges[4];
    const mouth = bridgeLane(pts, { ...br, thOut: br.thOut + 3 * TAU }, 0, -1.4, THL);
    tubes.push({ pts, kind: 'neighbour', tier: 4, lane: -1, mouth });
  }
  for (const s of riserSlots) {                               // three strands straight from the floor
    const pts = []; const mouth = ropeUp(pts, s, YBASE);
    tubes.push({ pts, kind: 'floor', tier: -1, lane: 0, mouth });
  }
  return { turns, tw, slotAz, leave: leaveIdx, ride, rideCurve, rideLen, rideSamp, bridges, tubes, risers, corridor };
}

// ---------- shaders ----------
export const GLASS_VERT = /* glsl */`
attribute vec3 aTan; attribute vec2 aUv; attribute float aPh;
uniform float uPix;
varying vec3 vT; varying vec3 vW; varying vec3 vN; varying vec2 vUv; varying float vPh; varying float vWid;
#include <fog_pars_vertex>
void main() {
  vec3 wp = (modelMatrix * vec4(position, 1.0)).xyz;
  vec3 T = normalize(mat3(modelMatrix) * aTan + vec3(0.0, 1e-5, 0.0));
  #ifdef REAL
    vN = normalize(mat3(modelMatrix) * normal + vec3(0.0, 1e-6, 0.0)); vWid = 1.0;
  #else
    vec3 V = cameraPosition - wp; float d = max(length(V), 1e-3); V /= d;
    vec3 S = cross(T, V); float sl = length(S); S = sl > 1e-3 ? S / sl : vec3(1.0, 0.0, 0.0);
    float hw = max(0.5, d * uPix * 1.2);
    vWid = 0.5 / hw;
    wp += S * aUv.x * hw; vN = S;
  #endif
  vT = T; vW = wp; vUv = aUv; vPh = aPh;
  vec4 mvPosition = viewMatrix * vec4(wp, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
// glass and lattice thin out where they cross the line of sight to the horn's mouth, so the way out is never veiled
const PORTAL_CLEAR = /* glsl */`
uniform vec4 uPortal;
float portalClear(vec3 W) {
  vec3 pc = uPortal.xyz - cameraPosition; float pd = max(length(pc), 1e-3); vec3 ax = pc / pd;
  vec3 fd = W - cameraPosition; float t = dot(fd, ax);
  float lat = length(fd - ax * t) * pd / max(t, 1.0);
  float k = (1.0 - smoothstep(9.0, 16.0, lat)) * step(0.0, t) * (1.0 - smoothstep(pd - 7.0, pd - 2.0, t));
  return 1.0 - uPortal.w * k;
}
`;
export const GLASS_FRAG = PORTAL_CLEAR + /* glsl */`
uniform vec3 uKey; uniform vec3 uAmb; uniform vec3 uPane; uniform vec3 uLDir; uniform float uTime;
varying vec3 vT; varying vec3 vW; varying vec3 vN; varying vec2 vUv; varying float vPh; varying float vWid;
#include <fog_pars_fragment>
void main() {
  vec3 T = normalize(vT + vec3(0.0, 1e-5, 0.0));
  vec3 Vv = cameraPosition - vW; float dist = max(length(Vv), 1e-3); vec3 V = Vv / dist;
  vec3 Vp = V - T * dot(V, T); float vl = length(Vp); Vp = vl > 1e-3 ? Vp / vl : vec3(0.0, 1.0, 0.0);
  vec3 S = cross(T, Vp);
  #ifdef REAL
    float v = clamp(dot(normalize(vN + vec3(0.0, 1e-6, 0.0)), S), -1.0, 1.0);
    float edgeK = 0.45 * smoothstep(0.7, 5.0, dist);
  #else
    float v = vUv.x;
    float edgeK = mix(0.3, 1.0, vWid);
  #endif
  vec3 H = uLDir + V; H -= T * dot(H, T); float hl = length(H); H = hl > 1e-3 ? H / hl : Vp;
  float v1 = 0.78 * dot(H, S);
  float v2 = v1 > 0.0 ? v1 - 0.85 : v1 + 0.85;
  float w = max(0.022, 1.3 * fwidth(v));
  float rope = 1.0 - smoothstep(10.0, 15.0, length(vW.xz));    // forty strands overlap round the clock: each gives less
  float nearF = smoothstep(1.0, 9.0, dist);
  float gl = 0.5 + 0.5 * sin(vUv.y * 0.21 - uTime * 2.6 + vPh); gl *= gl; gl *= gl; gl *= gl;
  float l1 = 1.0 - smoothstep(w * 0.25, w, abs(v - v1));
  float l2 = (1.0 - smoothstep(w * 0.2, w * 0.8, abs(v - v2))) * 0.6 * (1.0 - 0.8 * rope);
  float gain = clamp(0.055 / w, 0.1, 1.0);
  float lines = (l1 + l2) * gain * (1.0 + 1.6 * gl) * (1.0 - 0.45 * rope * (1.0 - smoothstep(20.0, 60.0, dist)));
  #ifdef REAL
    lines *= 0.1 + 0.9 * smoothstep(1.5, 10.0, dist);
  #endif
  float e = min(abs(v), 1.0); float edge = e * e; edge = edge * edge * e * edgeK;      // min: multisampling extrapolates a varying past its range on thin ribbons
  #ifndef REAL
    lines *= (0.35 + 0.65 * nearF) * (0.2 + 0.8 * smoothstep(4.0, 28.0, dist)); edge *= (0.2 + 0.8 * nearF) * (1.0 - 0.5 * rope);
  #endif
  #ifdef BOLD
    // the rival's strand runs beside the eye for a long sweep: it shows as a tube of glass, by its two rims and one soft
    // sheen of daylight, not as a pair of white lines from one side of the picture to the other
    float nearB = 0.45 + 0.55 * smoothstep(1.5, 6.0, dist), ws = max(0.09, 2.0 * fwidth(v));
    lines = (1.0 - smoothstep(0.0, ws, abs(v - v1))) * 0.26 * (1.0 + 0.5 * gl) * nearB; float e2 = e * e; edge = e2 * e2 * e2 * nearB * 0.6;
  #else
  #ifndef RACK
    // daylight on the glass of the hall's tubes is a soft sheen: a room full of hard white lines reads as streaks, not as glass
    lines *= 0.35;
  #endif
  #endif
  #ifdef RACK
    float rk = smoothstep(3.0, 18.0, dist), same = 1.0 - smoothstep(0.45, 1.3, abs(vW.y - cameraPosition.y));
    same *= 1.0 - smoothstep(10.0, 36.0, dist);                                   // far down the room every row shows again
    lines *= rk * (1.0 - 0.85 * same) * (1.0 + 1.7 * smoothstep(14.0, 50.0, dist)); edge *= rk * 0.5 * (1.0 - 0.92 * same);   // the rack beside the eye: no veil, the lines gather ahead
  #endif
  vec3 lit = uKey + uAmb;
  // seen from underneath against the dome the shelves' lines would lie over one another as a web: there each tube gives less
  float below = smoothstep(0.3, 0.75, -V.y);
  lines *= 1.0 - 0.72 * below; edge *= 1.0 - 0.6 * below;
  vec3 col = uPane * lit * edge * 0.2 + vec3(1.0, 0.97, 0.9) * lit * lines * 0.4;       // two thin bright lines of daylight on each tube
  float a = clamp(edge * 0.2 + lines * 0.15, 0.0, 1.0);
  #ifdef BOLD
    // the rim: where the glass wall is seen edge on it takes the pane's own colour and covers what lies behind. Its ramp is
    // never thinner than two pixels and is thinned by as much as it is widened, and it falls to nothing over the last pixel
    // before the ribbon's own edge, so neither a far strand nor the strand's outline steps from pixel to pixel
    float pxB = max(fwidth(v), 1e-4), wr = max(0.11, 2.0 * pxB);
    float rimB = smoothstep(0.97 - wr, 0.97, e) * (0.085 / (0.03 + 0.5 * wr)) * clamp((1.0 - e) / pxB, 0.0, 1.0) * nearB * (1.0 - 0.6 * below);
    col += uPane * lit * rimB * 0.16; a = clamp(a + rimB * 0.6, 0.0, 1.0);
  #endif
  #ifdef USE_FOG
    #ifdef FOG_EXP2
      float ff = 1.0 - exp(-fogDensity * fogDensity * vFogDepth * vFogDepth);
    #else
      float ff = smoothstep(fogNear, fogFar, vFogDepth);
    #endif
    col *= 1.0 - 0.8 * ff; a *= 1.0 - 0.8 * ff;
  #endif
  float pcl = portalClear(vW); col *= pcl; a *= pcl;
  gl_FragColor = vec4(col, a);
}`;

export function premult(mat) {
  mat.transparent = true; mat.depthWrite = false; mat.blending = THREE.CustomBlending;
  mat.blendSrc = THREE.OneFactor; mat.blendDst = THREE.OneMinusSrcAlphaFactor;
  mat.blendSrcAlpha = THREE.OneFactor; mat.blendDstAlpha = THREE.OneMinusSrcAlphaFactor;
  return mat;
}
// lathe about +Y with per-ring colour; profile rows [r, y, shade]
function latheCol(profile, segs, base, tmp = new THREE.Color()) {
  const g = new THREE.LatheGeometry(profile.map((p) => new THREE.Vector2(Math.max(p[0], 1e-4), p[1])), segs);
  const n = g.attributes.position.count, col = new Float32Array(n * 3), rows = profile.length;
  for (let i = 0; i < n; i++) { const sh = profile[i % rows][2] ?? 1; tmp.copy(base).multiplyScalar(sh); col[i * 3] = tmp.r; col[i * 3 + 1] = tmp.g; col[i * 3 + 2] = tmp.b; }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  return g;
}
function paint(g, c, shade = 1) {
  const n = g.attributes.position.count, col = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { col[i * 3] = c.r * shade; col[i * 3 + 1] = c.g * shade; col[i * 3 + 2] = c.b * shade; }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  return g;
}
// a round bar from a to b (hexagonal, slightly swollen ends are added by callers as collars)
const _m4 = new THREE.Matrix4(), _q = new THREE.Quaternion(), _va = new THREE.Vector3(), _vb = new THREE.Vector3(), _vc = new THREE.Vector3(), _up = new THREE.Vector3(0, 1, 0), _one = new THREE.Vector3(1, 1, 1);
function bar(a, b, r, c, shade = 1, segs = 6, r2 = r) {
  _va.set(a[0], a[1], a[2]); _vb.set(b[0], b[1], b[2]);
  const len = Math.max(_va.distanceTo(_vb), 1e-3);
  const g = new THREE.CylinderGeometry(r2, r, len, segs, 1, true);
  _vc.subVectors(_vb, _va).divideScalar(len); _q.setFromUnitVectors(_up, _vc);
  _va.add(_vb).multiplyScalar(0.5);
  g.applyMatrix4(_m4.compose(_va, _q, _one));
  return paint(g, c, shade);
}
function sampleTable(tab, s, pos, tan) {
  const f = clamp(s / tab.step, 0, tab.n - 1e-4), i = Math.floor(f), t = f - i, p = tab.p, k = i * 3;
  pos.set(p[k] + (p[k + 3] - p[k]) * t, p[k + 1] + (p[k + 4] - p[k + 1]) * t, p[k + 2] + (p[k + 5] - p[k + 2]) * t);
  if (tan) tan.set(p[k + 3] - p[k], p[k + 4] - p[k + 1], p[k + 5] - p[k + 2]).normalize();
  return pos;
}

// ---------- the hero ----------
export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng.fork('pneumatic-hero');
  const detail = ctx.quality?.detail ?? 1;
  const pal = (opts.palette && opts.palette.length >= 7 ? opts.palette : PALETTE).map((h) => new THREE.Color(h));
  const [cCream, cBrass, cIron, cPeacock, cDay, cRed, cBunting] = pal;
  const cPane = opts.pane ? new THREE.Color(opts.pane) : cPeacock;
  const cWood = new THREE.Color('#5a2a17'), cWoodD = new THREE.Color('#2e150d');
  const lightO = opts.light || {};
  const U = {
    uTime: { value: 0 }, uPix: { value: 0.003 },
    uKey: { value: new THREE.Color(lightO.color || '#F4F8F6').multiplyScalar(lightO.intensity ?? 1.0) },
    uAmb: { value: new THREE.Color('#aebfc4').multiplyScalar(0.35) },
    uPane: { value: cPane.clone().lerp(cDay, 0.25) },
    uLDir: { value: new THREE.Vector3(0.12, 1, 0.08).normalize() },
    uPortal: { value: new THREE.Vector4(MOUTH[0], MOUTH[1], MOUTH[2], 0) }, uGlow: { value: 1 },
  };
  if (lightO.dir) U.uLDir.value.copy(lightO.dir).normalize();
  const root = new THREE.Group(); root.name = 'pneumatic-emporium-hero';
  const L = await planLayout(rng, opts.leadIn ?? 36, () => ctx.yield());
  await ctx.yield();

  // ----- bake every tube into a table of points 2 m apart -----
  const STEP = 2;
  const bake = (pts, curve) => {
    const c = curve || new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(p[0], p[1], p[2])), false, 'centripetal', 0.5);
    if (!curve) c.arcLengthDivisions = Math.max(200, pts.length * 5);
    const len = c.getLength(), n = Math.max(2, Math.round(len / STEP)), sp = c.getSpacedPoints(n), p = new Float32Array((n + 1) * 3);
    for (let i = 0; i <= n; i++) { p[i * 3] = sp[i].x; p[i * 3 + 1] = sp[i].y; p[i * 3 + 2] = sp[i].z; }
    return { p, n, len, step: len / n };
  };
  const rideTab = bake(null, L.rideCurve);
  await ctx.yield();
  const tabs = [];
  for (let i = 0; i < L.tubes.length; i++) { const t = bake(L.tubes[i].pts); t.info = L.tubes[i]; t.ph = rng() * TAU; tabs.push(t); await ctx.yield(); }
  rideTab.ph = 0; rideTab.info = { kind: 'ride' };
  const neighbourTab = tabs.find((t) => t.info.kind === 'neighbour');
  for (const t of tabs) {                                      // where each tube joins the rope (for the volley)
    let i = 0; while (i < t.n && Math.hypot(t.p[i * 3], t.p[i * 3 + 2]) > 12.5) i++;
    t.ropeS = i >= t.n ? t.len * 0.6 : i * t.step;
  }
  await ctx.yield();

  // ----- ribbons: every tube except ours and its neighbour -----
  const glassMat = (real) => premult(new THREE.ShaderMaterial({
    uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, {}]), vertexShader: GLASS_VERT, fragmentShader: GLASS_FRAG,
    fog: true, side: THREE.DoubleSide, defines: real ? { REAL: 1 } : {},
  }));
  const share = (m) => { for (const k in U) m.uniforms[k] = U[k]; return m; };
  {
    const rib = tabs.filter((t) => t !== neighbourTab);
    let nv = 0, ni = 0; for (const t of rib) { nv += (t.n + 1) * 2; ni += t.n * 6; }
    const pos = new Float32Array(nv * 3), tan = new Float32Array(nv * 3), uv = new Float32Array(nv * 2), ph = new Float32Array(nv), idx = new Uint32Array(ni);
    let v = 0, ii = 0;
    for (const t of rib) {
      const p = t.p;
      for (let i = 0; i <= t.n; i++) {
        const a = Math.max(0, i - 1) * 3, b = Math.min(t.n, i + 1) * 3;
        let tx = p[b] - p[a], ty = p[b + 1] - p[a + 1], tz = p[b + 2] - p[a + 2]; const l = Math.hypot(tx, ty, tz) || 1; tx /= l; ty /= l; tz /= l;
        for (let s = -1; s <= 1; s += 2) {
          pos[v * 3] = p[i * 3]; pos[v * 3 + 1] = p[i * 3 + 1]; pos[v * 3 + 2] = p[i * 3 + 2];
          tan[v * 3] = tx; tan[v * 3 + 1] = ty; tan[v * 3 + 2] = tz; uv[v * 2] = s; uv[v * 2 + 1] = i * t.step; ph[v] = t.ph; v++;
        }
        if (i < t.n) { const o = v - 2; idx[ii++] = o; idx[ii++] = o + 1; idx[ii++] = o + 2; idx[ii++] = o + 1; idx[ii++] = o + 3; idx[ii++] = o + 2; }
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('aTan', new THREE.BufferAttribute(tan, 3));
    g.setAttribute('aUv', new THREE.BufferAttribute(uv, 2)); g.setAttribute('aPh', new THREE.BufferAttribute(ph, 1));
    g.setIndex(new THREE.BufferAttribute(idx, 1));
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 50, 0), 110);
    const m = new THREE.Mesh(g, share(glassMat(false))); m.renderOrder = 2; m.name = 'tubes'; root.add(m);
  }
  await ctx.yield();

  // ----- our tube and its neighbour as real glass cylinders (the camera is inside one of them) -----
  {
    const two = [rideTab, neighbourTab], thin = (t) => { const k = Math.max(1, Math.round(3 / t.step)), n = Math.floor(t.n / k), p = new Float32Array((n + 1) * 3);
      for (let i = 0; i <= n; i++) { const j = i === n ? t.n : i * k; p[i * 3] = t.p[j * 3]; p[i * 3 + 1] = t.p[j * 3 + 1]; p[i * 3 + 2] = t.p[j * 3 + 2]; } return { p, n, step: t.step * k, ph: t.ph }; };
    const lite = two.map(thin), sides = [10, 6];
    let nv = 0, ni = 0; lite.forEach((t, k) => { nv += (t.n + 1) * (sides[k] + 1); ni += t.n * sides[k] * 6; });
    const pos = new Float32Array(nv * 3), nor = new Float32Array(nv * 3), tan = new Float32Array(nv * 3), uv = new Float32Array(nv * 2), ph = new Float32Array(nv), idx = new Uint32Array(ni);
    let v = 0, ii = 0; const T = new THREE.Vector3(), N = new THREE.Vector3(), B = new THREE.Vector3();
    for (let ti = 0; ti < lite.length; ti++) {
      const t = lite[ti], RS = sides[ti], p = t.p;
      for (let i = 0; i <= t.n; i++) {
        const a = Math.max(0, i - 1) * 3, b = Math.min(t.n, i + 1) * 3;
        T.set(p[b] - p[a], p[b + 1] - p[a + 1], p[b + 2] - p[a + 2]).normalize();
        if (Math.abs(T.y) > 0.985) N.set(1, 0, 0); else N.set(0, 1, 0);
        N.addScaledVector(T, -N.dot(T)).normalize(); B.crossVectors(T, N);
        for (let s = 0; s <= RS; s++) {
          const an = (s / RS) * TAU, c = Math.cos(an), sn = Math.sin(an);
          const nx = N.x * c + B.x * sn, ny = N.y * c + B.y * sn, nz = N.z * c + B.z * sn;
          pos[v * 3] = p[i * 3] + nx * 0.5; pos[v * 3 + 1] = p[i * 3 + 1] + ny * 0.5; pos[v * 3 + 2] = p[i * 3 + 2] + nz * 0.5;
          nor[v * 3] = nx; nor[v * 3 + 1] = ny; nor[v * 3 + 2] = nz; tan[v * 3] = T.x; tan[v * 3 + 1] = T.y; tan[v * 3 + 2] = T.z;
          uv[v * 2] = 0; uv[v * 2 + 1] = i * t.step; ph[v] = t.ph; v++;
        }
        if (i < t.n) {
          const o = v - (RS + 1);
          for (let s = 0; s < RS; s++) { idx[ii++] = o + s; idx[ii++] = o + s + 1; idx[ii++] = o + s + RS + 1; idx[ii++] = o + s + 1; idx[ii++] = o + s + RS + 2; idx[ii++] = o + s + RS + 1; }
        }
      }
      await ctx.yield();
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
    g.setAttribute('aTan', new THREE.BufferAttribute(tan, 3)); g.setAttribute('aUv', new THREE.BufferAttribute(uv, 2)); g.setAttribute('aPh', new THREE.BufferAttribute(ph, 1));
    g.setIndex(new THREE.BufferAttribute(idx, 1));
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 50, 0), 110);
    const m = new THREE.Mesh(g, share(glassMat(true))); m.renderOrder = 3; m.name = 'ourTube'; root.add(m);
  }
  await ctx.yield();

  // ----- materials for the solid parts -----
  const brassMat = new THREE.MeshStandardMaterial({ vertexColors: true, metalness: 0.3, roughness: 0.36, emissive: cBrass.clone().multiplyScalar(0.11) });
  const ironMat = new THREE.MeshStandardMaterial({ vertexColors: true, metalness: 0.25, roughness: 0.6 });
  const brass = [], iron = [];                                // geometries to merge
  const cBrassHi = cBrass.clone().lerp(cCream, 0.25), cBrassLo = cBrass.clone().multiplyScalar(0.62);
  const P = new THREE.Vector3(), T = new THREE.Vector3(), M4 = new THREE.Matrix4(), Q = new THREE.Quaternion(), S1 = new THREE.Vector3(1, 1, 1);

  // ----- brass collars every 18 m (instanced) -----
  {
    const g = latheCol([[0.515, -0.1, 0.75], [0.575, 0.0, 1.1], [0.515, 0.1, 0.75]], 8, cBrass);
    const list = [];
    const place = (t, every, first) => {
      for (let s = first; s < t.len - 4; s += every) {
        sampleTable(t, s, P, T);
        if (t !== rideTab && Math.hypot(P.x, P.z) < 12.5) continue;
        if (t === neighbourTab && P.y < -2) continue;                  // none beside the eye in the basement: at that range it is only a smear   // the rope and the organ are hooped instead
        Q.setFromUnitVectors(_up, T); list.push(M4.compose(P, Q, S1).clone());
      }
    };
    place(rideTab, 18, 9);                                    // (the neighbour's collars passed 1.2 m from the eye as smeared arcs: it has none)
    {                                                         // our own tube's collars are seen from inside: round ones
      const gr = latheCol([[0.506, -0.075, 0.7], [0.534, -0.04, 1.12], [0.528, 0.0, 0.9], [0.534, 0.04, 1.12], [0.506, 0.075, 0.7]], 20, cBrass);
      const imr = new THREE.InstancedMesh(gr, brassMat, list.length);
      list.forEach((m, i) => imr.setMatrixAt(i, m));
      imr.instanceMatrix.needsUpdate = true; imr.frustumCulled = false; imr.name = 'ourCollars'; root.add(imr);
      list.length = 0;
    }
    for (const t of tabs) if (t !== neighbourTab) place(t, 18, 5 + (t.info.lane + 1) * 1.5);
    const im = new THREE.InstancedMesh(g, brassMat, list.length);
    list.forEach((m, i) => im.setMatrixAt(i, m));
    im.instanceMatrix.needsUpdate = true; im.frustumCulled = false; im.name = 'collars'; root.add(im);
  }
  await ctx.yield();

  // ----- shelves: glass decks, brass bearers and hangers at the 24 bay lines (parametric angle 15 deg * i) -----
  const deckPos = [], deckUv = [], deckW = [], deckIdx = [], bridgeBrass = [[], [], [], [], []];
  const deckStrip = (pts, width) => {                         // pts: [[x,y,z, nx,nz]] centreline with a lateral unit vector
    const o = deckPos.length / 3; let s = 0;
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i]; if (i) s += Math.hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1], p[2] - pts[i - 1][2]);
      deckPos.push(p[0] - p[3] * width / 2, p[1], p[2] - p[4] * width / 2, p[0] + p[3] * width / 2, p[1], p[2] + p[4] * width / 2);
      deckUv.push(-1, s, 1, s); deckW.push(width, width);
      if (i) { const a = o + i * 2 - 2; deckIdx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
    }
  };
  const inGap = (th, br, gap) => { let d = (th - br.thOut) % TAU; if (d < 0) d += TAU; return d < gap || d > TAU - 0.05; };
  for (let k = 0; k < 5; k++) {
    const br = L.bridges[k], y = SHELF_Y[k];
    const pts = [];
    for (let a = 26; a <= 357; a += 3) {                      // the shelf runs from just past its risers round to its bridge
      const th = br.thOut - TAU + a * DEG, e0 = ell(th, 0, 0), e1 = ell(th, 1, 0);
      pts.push([e0[0] + (e1[0] - e0[0]) * 4.2, y - 0.58, e0[2] + (e1[2] - e0[2]) * 4.2, e1[0] - e0[0], e1[2] - e0[2]]);
    }
    deckStrip(pts, 8.6);
    for (let i = 0; i < 24; i++) {
      const th = i * 15 * DEG; if (inGap(th, br, 30 * DEG)) continue;
      const a = ell(th, -0.1, y - 0.66), b = ell(th, 8.7, y - 0.66);
      brass.push(bar(a, b, 0.06, cBrass, 0.9, 8));
      for (const o of [0.0, 4.2, 8.6]) {
        const h0 = ell(th, o, y - 0.66), h1 = ell(th, o, y + 1.55);
        brass.push(bar(h0, h1, 0.04, cBrass, 0.75, 5));
        if (o < 0.1) { const kn = new THREE.SphereGeometry(0.1, 7, 5); kn.translate(h0[0], h0[1] - 0.05, h0[2]); brass.push(paint(kn, cBrassHi)); }
      }
    }
    await ctx.yield();
    // bridge: deck, two arched ribs under it, posts and cross bearers
    const w = br.n * 1.2 + 1.0, len = br.len - 2.2, lat = (k === 4 ? -0.6 : 0);
    const at = (f, l, dy) => [br.Q[0] + br.u[0] * len * f + br.v[0] * (l + lat), y + dy, br.Q[2] + br.u[1] * len * f + br.v[1] * (l + lat)];
    const bp = []; for (let i = 0; i <= 8; i++) { const c = at(i / 8, 0, -0.58); bp.push([c[0], c[1], c[2], br.v[0], br.v[1]]); }
    deckStrip(bp, w);
    const NB = 10, bb = bridgeBrass[k];                       // each bridge's brass is its own mesh, so a world can fade one that hangs across the view
    for (const side of [-1, 1]) {
      for (let i = 0; i < NB; i++) {
        const f0 = i / NB, f1 = (i + 1) / NB, sag = (f) => -0.75 - 3.2 * Math.sin(Math.PI * f) * (len / 46);
        bb.push(bar(at(f0, side * w / 2, sag(f0)), at(f1, side * w / 2, sag(f1)), 0.16, cBrass, 0.85));
        if (i) bb.push(bar(at(f0, side * w / 2, -0.66), at(f0, side * w / 2, sag(f0)), 0.06, cBrass, 0.7, 5));
        bb.push(bar(at(f0, side * w / 2, -0.66), at(f1, side * w / 2, -0.66), 0.09, cBrassHi, 0.9, 5));
      }
    }
    for (let i = 1; i < NB; i++) bb.push(bar(at(i / NB, -w / 2, -0.66), at(i / NB, w / 2, -0.66), 0.09, cBrass, 0.8, 5));
    bb.centre = new THREE.Vector3(...at(0.5, 0, 0));
    await ctx.yield();
  }
  // arms that carry the two express tubes off the balcony fronts, one at every bay line they pass
  {
    const span = THL - TH0;
    for (let a = Math.ceil(TH0 / (15 * DEG)); a * 15 * DEG < THL; a++) {
      const th = a * 15 * DEG, y = lerp(SHELF_Y[0], SHELF_Y[4], (th - TH0) / span);
      const i0 = ell(th, -3.2, y - 0.78), i1 = ell(th, 0.35, y - 0.78), top = ell(th, 0.35, y + 1.3);
      brass.push(bar(i0, i1, 0.038, cBrass, 0.9, 8), bar(ell(th, -0.8, y - 0.78), top, 0.028, cBrass, 0.75, 6), bar(i1, top, 0.035, cBrass, 0.8, 6));
      const kn = new THREE.SphereGeometry(0.07, 7, 5); kn.translate(i0[0], i0[1], i0[2]); brass.push(paint(kn, cBrassHi));
    }
  }
  await ctx.yield();
  // our own slim glass bridge, from where the tube leaves the ring to just short of the horn
  let leaveS = 0;
  {
    const lp = L.ride[L.leave]; let best = 1e9;                // the last helix point
    for (let i = 0; i <= rideTab.n; i++) { const d = Math.hypot(rideTab.p[i * 3] - lp[0], rideTab.p[i * 3 + 1] - lp[1], rideTab.p[i * 3 + 2] - lp[2]); if (d < best) { best = d; leaveS = i * rideTab.step; } }
    const pts = [], T2 = new THREE.Vector3(); let n = 0;
    for (let s = leaveS + 4; s < rideTab.len - 9; s += 3) {
      sampleTable(rideTab, s, P, T); const l = Math.hypot(T.x, T.z) || 1;
      pts.push([P.x, P.y - 0.58, P.z, -T.z / l, T.x / l]);
      if (n % 3 === 0 && s < rideTab.len - 15) {
        sampleTable(rideTab, s + 9, _va, T2);
        const sag = (q) => -1.05 - 0.6 * Math.sin(Math.PI * q);
        for (let j = 0; j < 3; j++) {
          sampleTable(rideTab, s + j * 3, _vb, null); sampleTable(rideTab, s + j * 3 + 3, _vc, null);
          brass.push(bar([_vb.x, _vb.y + sag(j / 3), _vb.z], [_vc.x, _vc.y + sag((j + 1) / 3), _vc.z], 0.04, cBrass, 0.85, 8));
        }
        brass.push(bar([P.x - (-T.z / l) * 0.95, P.y - 1.0, P.z - (T.x / l) * 0.95], [P.x + (-T.z / l) * 0.95, P.y - 1.0, P.z + (T.x / l) * 0.95], 0.026, cBrass, 0.9, 8));
        for (const sd of [-0.95, 0.95]) brass.push(bar([P.x + (-T.z / l) * sd, P.y - 0.6, P.z + (T.x / l) * sd], [P.x + (-T.z / l) * sd, P.y - 1.0, P.z + (T.x / l) * sd], 0.02, cBrass, 0.8, 5));
      }
      n++;
    }
    deckStrip(pts, 2.3);
  }
  await ctx.yield();
  {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(deckPos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(deckUv, 2)); g.setAttribute('aW', new THREE.Float32BufferAttribute(deckW, 1));
    g.setIndex(deckIdx);
    const mat = share(premult(new THREE.ShaderMaterial({
      uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, {}]), fog: true, side: THREE.DoubleSide,
      vertexShader: /* glsl */`
        attribute float aW; varying vec2 vUv; varying vec3 vW; varying float vWd;
        #include <fog_pars_vertex>
        void main() { vUv = uv; vWd = aW; vec4 wp = modelMatrix * vec4(position, 1.0); vW = wp.xyz; vec4 mvPosition = viewMatrix * wp; gl_Position = projectionMatrix * mvPosition;
          #include <fog_vertex>
        }`,
      fragmentShader: /* glsl */`
        uniform vec3 uKey; uniform vec3 uAmb; uniform vec3 uPane; uniform float uTime;
        varying vec2 vUv; varying vec3 vW; varying float vWd;
        #include <fog_pars_fragment>
        void main() {
          vec3 Vv = cameraPosition - vW; float dist = max(length(Vv), 1e-3); vec3 V = Vv / dist;
          float fr = 1.0 - abs(V.y); fr = fr * fr * fr;
          float xe = (1.0 - abs(vUv.x)) * vWd * 0.5;
          float fx = fwidth(xe), fy = fwidth(vUv.y);
          float rim = 1.0 - smoothstep(0.10 + fx, 0.16 + 2.0 * fx, xe);
          float jy = abs(fract(vUv.y / 3.0) - 0.5) * 3.0;
          float joint = (1.0 - smoothstep(0.03, 0.03 + 1.5 * fy, jy)) * clamp(0.08 / max(fy, 1e-4), 0.0, 1.0);
          float sheen = 0.5 + 0.5 * sin(vUv.y * 0.11 + vUv.x * 0.6 - uTime * 0.35);
          vec3 lit = uKey + uAmb;
          float a = 0.045 + 0.1 * fr + 0.4 * rim + 0.18 * joint;
          vec3 col = uPane * lit * (0.03 + 0.12 * rim + 0.06 * joint) + vec3(0.97, 0.97, 0.92) * lit * (0.045 * fr * (0.6 + 0.4 * sheen) + 0.1 * rim);
          #ifdef USE_FOG
            #ifdef FOG_EXP2
              float ff = 1.0 - exp(-fogDensity * fogDensity * vFogDepth * vFogDepth);
            #else
              float ff = smoothstep(fogNear, fogFar, vFogDepth);
            #endif
            col *= 1.0 - 0.8 * ff; a *= 1.0 - 0.8 * ff;
          #endif
          gl_FragColor = vec4(col, clamp(a, 0.0, 1.0));
        }`,
    })));
    const m = new THREE.Mesh(g, mat); m.renderOrder = 1; m.name = 'glassDecks'; root.add(m);
  }
  await ctx.yield();

  // ----- capsules: brass bodies and felt noses, 100 instances (40 everyday, 60 for the volley) -----
  const NCAP = 100, nEvery = Math.min(40, Math.max(24, Math.round((opts.capsules ?? 40) * Math.min(1, detail + 0.0001))));
  const capBody = new THREE.InstancedMesh(latheCol([[0.02, -1.0, 0.75], [0.3, -1.0, 0.8], [0.385, -0.93, 1.0], [0.4, -0.82, 1.2], [0.4, -0.72, 1.0], [0.355, -0.68, 0.6],
    [0.355, 0.46, 0.95], [0.4, 0.5, 1.2], [0.4, 0.64, 1.0], [0.37, 0.7, 0.6]], 8, cBrass), brassMat, NCAP);
  const feltMat = new THREE.MeshStandardMaterial({ roughness: 1, metalness: 0 });
  const capNose = new THREE.InstancedMesh(new THREE.LatheGeometry([[0.37, 0.7], [0.398, 0.79], [0.36, 0.94], [0.22, 1.03], [0.02, 1.06]].map((p) => new THREE.Vector2(p[0], p[1])), 8), feltMat, NCAP);
  capBody.frustumCulled = false; capNose.frustumCulled = false; capBody.name = 'capsules'; capNose.name = 'capsuleNoses';
  root.add(capBody, capNose);
  const noseCols = [cRed, new THREE.Color('#1f5a3c'), cCream.clone().lerp(cDay, 0.5), cBunting];
  const caps = [];
  {
    const hornDist = (t) => { const p = t.p, k = t.n * 3; return Math.hypot(p[k] - MOUTH[0], p[k + 1] - MOUTH[1], p[k + 2] - MOUTH[2]); };
    const near3 = tabs.filter((t) => t !== neighbourTab).sort((a, b) => hornDist(a) - hornDist(b)).slice(0, 3);
    const order = [neighbourTab, ...near3, ...tabs.filter((t) => t !== neighbourTab && !near3.includes(t))];
    const crng = rng.fork('caps');
    for (let i = 0; i < NCAP; i++) {
      const tab = i < order.length ? order[i] : order[crng.int(4, order.length - 1)];
      const col = i === 0 ? noseCols[2] : noseCols[crng.int(0, 3)];
      caps.push({ tab, speed: crng.range(15, 40), off: crng() * tab.len, ph: crng(), arrive: i >= 1 && i <= 3 ? [0.972, 0.984, 0.962][i - 1] : 0 });
      capNose.setColorAt(i, i >= 40 ? (i % 3 === 0 ? cRed.clone().multiplyScalar(1.5) : i % 3 === 1 ? new THREE.Color(1.25, 1.25, 1.2) : cBunting.clone().multiplyScalar(1.3)) : col);
    }
    capNose.instanceColor.needsUpdate = true;
  }
  const ZERO = new THREE.Matrix4().makeScale(0, 0, 0), SV = new THREE.Vector3(1.5, 1.5, 1.5), SR = new THREE.Vector3(1.2, 1.2, 1.2);   // the volley's capsules are drawn larger so the event reads across the well
  const setCap = (i, tab, s) => {
    if (s < 0 || s > tab.len) { capBody.setMatrixAt(i, ZERO); capNose.setMatrixAt(i, ZERO); return; }
    sampleTable(tab, s, P, T); Q.setFromUnitVectors(_up, T);
    if (i >= 40) { const k = clamp(P.distanceTo(camP) / 26, 1.5, 2.5) * Math.max(volley, 0.001); SV.set(k, k, k); }   // the volley must read from across the well
    M4.compose(P, Q, i >= 40 ? SV : i === 0 ? SR : S1);
    capBody.setMatrixAt(i, M4); capNose.setMatrixAt(i, M4);
  };
  await ctx.yield();

  // ----- hoops round the rope, the bell-mouths, the great horn -----
  for (const y of [18, 31, 44, 57, 70]) {
    const g = new THREE.TorusGeometry(RR + 0.74, 0.15, 6, 44); g.rotateX(Math.PI / 2); g.translate(0, y, 0); brass.push(paint(g, cBrass, 0.9));
  }
  for (const t of tabs) {
    const m = t.info.mouth;
    const g = latheCol([[0.56, -1.95, 0.8], [0.68, -1.9, 1.15], [0.68, -1.62, 1.0], [0.6, -1.5, 0.6], [0.7, -1.0, 0.9], [1.0, -0.45, 1.0], [1.5, -0.08, 1.1], [1.64, 0.02, 1.2], [1.5, 0.14, 0.7]], 12, cBrass);
    g.translate(m.r * Math.cos(m.az), m.yb + 0.25, m.r * Math.sin(m.az)); brass.push(g);
  }
  await ctx.yield();
  const dHorn = new THREE.Vector3(-Math.cos(PITCH), Math.sin(PITCH), 0), vM = new THREE.Vector3(MOUTH[0], MOUTH[1], MOUTH[2]);
  {
    const p0 = vM.clone(), p1 = vM.clone().addScaledVector(dHorn, 10), p2 = new THREE.Vector3(-14.5, 90.2, 5.5);
    const NR = 16, NS = 28, pos = [], col = [], idx = [], C = new THREE.Vector3(), Tg = new THREE.Vector3(), N = new THREE.Vector3(), B = new THREE.Vector3(), c = new THREE.Color();
    // the bell flares on outside the opening (rings k < 0): a broad fluted brass lip round the way out, facing whoever flies at it
    const NF = 4;
    for (let k = -NF; k <= NR; k++) {
      const t = Math.max(0, k / NR), fz = k < 0 ? -k / NF : 0, a = (1 - t) * (1 - t), b = 2 * t * (1 - t), cc = t * t;
      C.set(0, 0, 0).addScaledVector(p0, a).addScaledVector(p1, b).addScaledVector(p2, cc).addScaledVector(dHorn, -1.15 * fz * fz);
      Tg.set(0, 0, 0).addScaledVector(p0, -2 * (1 - t)).addScaledVector(p1, 2 - 4 * t).addScaledVector(p2, 2 * t).normalize();
      N.set(0, 1, 0).addScaledVector(Tg, -Tg.y).normalize(); B.crossVectors(Tg, N);
      const r = 1.25 + 6.35 * Math.pow(1 - t, 2.3) + 2.1 * Math.pow(fz, 0.8);
      for (let s = 0; s <= NS; s++) {
        const an = (s / NS) * TAU, fl = 1 + 0.022 * Math.cos(an * 14) * (1 - t);
        pos.push(C.x + (N.x * Math.cos(an) + B.x * Math.sin(an)) * r * fl, C.y + (N.y * Math.cos(an) + B.y * Math.sin(an)) * r * fl, C.z + (N.z * Math.cos(an) + B.z * Math.sin(an)) * r * fl);
        const petal = (s % 2 ? 0.5 : 1.0) * lerp(1.0, 0.5, smoothstep(0.0, 0.8, t)) * (k > 0 && k % 3 === 0 ? 0.45 : 1) * (1 + 0.18 * fz);      // deep flutes and turned bands: a made horn from behind as well
        c.copy(cBrass).lerp(cBrassHi, 0.3 * (1 - t) + 0.25 * fz).multiplyScalar(petal); col.push(c.r, c.g, c.b);
      }
      if (k < NR) { const o = (k + NF) * (NS + 1); for (let s = 0; s < NS; s++) idx.push(o + s, o + s + NS + 1, o + s + 1, o + s + 1, o + s + NS + 1, o + s + NS + 2); }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.setIndex(idx); g.computeVertexNormals();
    const hornMat = brassMat.clone(); hornMat.side = THREE.DoubleSide;
    const horn = new THREE.Mesh(g, hornMat); horn.name = 'horn'; root.add(horn);
    await ctx.yield();
    const qz = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), dHorn);
    for (const [rr, tr, back, sh] of [[9.72, 0.27, -1.15, 1.25], [7.62, 0.34, 0, 1.15], [6.7, 0.13, 1.2, 0.85], [5.8, 0.11, 2.6, 0.7]]) {
      const lip = new THREE.TorusGeometry(rr, tr, 8, 48);
      lip.applyQuaternion(qz); lip.translate(vM.x + dHorn.x * back, vM.y + dHorn.y * back, vM.z); brass.push(paint(lip, cBrassHi, sh));
    }
    // rods that hang the horn from the nest's rim
    for (const [ax, lz] of [[-7.4, -5.5], [-9.4, 0], [-7.4, 5.5]]) iron.push(bar([ax + 0.5, NEST_FLOOR + 0.2, MOUTH[2] + lz * 0.35 - 1.5], [MOUTH[0] + 0.3, MOUTH[1] + Math.sqrt(Math.max(1, 58 - lz * lz)), MOUTH[2] + lz], 0.09, cIron, 2.2, 5));
    // the horn's inside: a warm lining that brightens toward the throat, a lit lip, a halo and a soft beam, so the
    // way out reads as a glowing mouth from the front, the side and through the rope
    {
      const lp = [], lt = [], lr = [], li = [];
      const ringAt = (Cc, Nn, Bb, r, t, rad) => {
        for (let s2 = 0; s2 <= NS; s2++) {
          const an = (s2 / NS) * TAU, cx = Nn.x * Math.cos(an) + Bb.x * Math.sin(an), cy = Nn.y * Math.cos(an) + Bb.y * Math.sin(an), cz = Nn.z * Math.cos(an) + Bb.z * Math.sin(an);
          lp.push(Cc.x + cx * r, Cc.y + cy * r, Cc.z + cz * r); lt.push(t, an); lr.push(cx * rad, cy * rad, cz * rad);
        }
      };
      for (let k = 0; k <= NR; k++) {
        const t = k / NR, a2 = (1 - t) * (1 - t), b2 = 2 * t * (1 - t), cc = t * t;
        C.set(0, 0, 0).addScaledVector(p0, a2).addScaledVector(p1, b2).addScaledVector(p2, cc);
        Tg.set(0, 0, 0).addScaledVector(p0, -2 * (1 - t)).addScaledVector(p1, 2 - 4 * t).addScaledVector(p2, 2 * t).normalize();
        N.set(0, 1, 0).addScaledVector(Tg, -Tg.y).normalize(); B.crossVectors(Tg, N);
        ringAt(C, N, B, (1.25 + 6.35 * Math.pow(1 - t, 2.3)) * 0.972, t, 1);
        if (k < NR) { const o = k * (NS + 1); for (let s2 = 0; s2 < NS; s2++) li.push(o + s2, o + s2 + NS + 1, o + s2 + 1, o + s2 + 1, o + s2 + NS + 1, o + s2 + NS + 2); }
      }
      {                                                         // the lit lip: a thin bright band just inside the rolled rim
        const o = lp.length / 3;
        Tg.copy(dHorn); N.set(0, 1, 0).addScaledVector(Tg, -Tg.y).normalize(); B.crossVectors(Tg, N);
        C.copy(vM).addScaledVector(dHorn, -0.3); ringAt(C, N, B, 7.36, 0.5, 0);
        C.copy(vM).addScaledVector(dHorn, 0.12); ringAt(C, N, B, 7.2, 0.5, 0);
        C.copy(vM).addScaledVector(dHorn, -0.37); ringAt(C, N, B, 7.78, 0.5, 0);     // and the rim's outer roll, seen from the side
        C.copy(vM); ringAt(C, N, B, 8.03, 0.5, 0);
        C.copy(vM).addScaledVector(dHorn, 0.37); ringAt(C, N, B, 7.78, 0.5, 0);
        for (const oo of [o, o + 2 * (NS + 1), o + 3 * (NS + 1)]) for (let s2 = 0; s2 < NS; s2++) li.push(oo + s2, oo + s2 + NS + 1, oo + s2 + 1, oo + s2 + 1, oo + s2 + NS + 1, oo + s2 + NS + 2);
      }
      const lg = new THREE.BufferGeometry();
      lg.setAttribute('position', new THREE.Float32BufferAttribute(lp, 3)); lg.setAttribute('aT', new THREE.Float32BufferAttribute(lt, 2)); lg.setAttribute('aR', new THREE.Float32BufferAttribute(lr, 3)); lg.setIndex(li);
      const lm = new THREE.Mesh(lg, new THREE.ShaderMaterial({
        uniforms: { uTime: U.uTime, uGlow: U.uGlow }, side: THREE.DoubleSide,
        vertexShader: /* glsl */`
          attribute vec2 aT; attribute vec3 aR; varying vec2 vT; varying vec3 vR; varying vec3 vW;
          void main() { vT = aT; vR = aR; vec4 w4 = modelMatrix * vec4(position, 1.0); vW = w4.xyz; gl_Position = projectionMatrix * viewMatrix * w4; }`,
        fragmentShader: /* glsl */`
          uniform float uTime; uniform float uGlow;
          varying vec2 vT; varying vec3 vR; varying vec3 vW;
          void main() {
            vec3 V = normalize(cameraPosition - vW + vec3(0.0, 1e-5, 0.0));
            float rl = length(vR);
            if (rl > 0.5 && dot(vR, V) > 0.0) discard;             // only the inside of the bell
            float flute = 0.8 + 0.2 * cos(vT.y * 14.0), ring = 0.93 + 0.07 * sin(vT.x * 70.0);
            float g = smoothstep(0.0, 0.7, vT.x);
            vec3 col = mix(vec3(0.5, 0.31, 0.12), vec3(1.2, 0.8, 0.4), g) * flute * ring;
            if (rl < 0.5) col = vec3(1.15, 0.86, 0.5);
            col *= uGlow * (0.94 + 0.06 * sin(uTime * 1.1));
            gl_FragColor = vec4(col, 1.0);
          }`,
      }));
      lm.name = 'hornGlow'; root.add(lm);
      await ctx.yield();
      const out = dHorn.clone().negate();
      const bg = new THREE.CylinderGeometry(10.5, 6.9, 16, 28, 1, true), bh = new Float32Array(bg.attributes.position.count);
      for (let i = 0; i < bh.length; i++) bh[i] = bg.attributes.position.getY(i) / 16 + 0.5;
      bg.setAttribute('aH', new THREE.BufferAttribute(bh, 1));
      bg.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(_up, out)); bg.translate(vM.x + out.x * 8, vM.y + out.y * 8, vM.z + out.z * 8);
      const beam = new THREE.Mesh(bg, new THREE.ShaderMaterial({
        uniforms: { uTime: U.uTime, uGlow: U.uGlow }, side: THREE.DoubleSide, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
        vertexShader: /* glsl */`
          attribute float aH; varying float vH; varying vec3 vN; varying vec3 vW;
          void main() { vH = aH; vec4 w4 = modelMatrix * vec4(position, 1.0); vW = w4.xyz; vN = normalize(mat3(modelMatrix) * normal + vec3(0.0, 1e-6, 0.0)); gl_Position = projectionMatrix * viewMatrix * w4; }`,
        fragmentShader: /* glsl */`
          uniform float uTime; uniform float uGlow;
          varying float vH; varying vec3 vN; varying vec3 vW;
          void main() {
            vec3 V = normalize(cameraPosition - vW + vec3(0.0, 1e-5, 0.0));
            float f = abs(dot(normalize(vN + vec3(0.0, 1e-6, 0.0)), V)); float k = 1.0 - clamp(vH, 0.0, 1.0);
            float a = (0.25 + 0.75 * f * f) * k * k * 0.5 * uGlow * (0.9 + 0.1 * sin(vH * 9.0 - uTime * 0.8));
            gl_FragColor = vec4(vec3(1.0, 0.72, 0.36) * a, 1.0);
          }`,
      }));
      beam.name = 'hornBeam'; beam.renderOrder = 4; root.add(beam);
      const halo = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({
        uniforms: { uGlow: U.uGlow }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
        vertexShader: /* glsl */`
          varying vec2 vP;
          void main() { vP = position.xy; vec4 mv = viewMatrix * modelMatrix * vec4(0.0, 0.0, 0.0, 1.0); mv.xy += position.xy * 15.0; gl_Position = projectionMatrix * mv; }`,
        fragmentShader: /* glsl */`
          uniform float uGlow; varying vec2 vP;
          void main() { float r2 = dot(vP, vP); float a = exp(-r2 * 4.5) * 0.5 * uGlow * (1.0 - smoothstep(0.8, 1.0, sqrt(r2))); gl_FragColor = vec4(vec3(1.0, 0.7, 0.34) * a, 1.0); }`,
      }));
      halo.position.copy(vM).addScaledVector(out, 1.5); halo.frustumCulled = false; halo.name = 'hornHalo'; halo.renderOrder = 4; root.add(halo);
    }
    if (opts.portalFill !== false) {
      const d = new THREE.Mesh(new THREE.CircleGeometry(7.25, 40), new THREE.MeshBasicMaterial({ color: new THREE.Color(0.5, 0.8, 0.95), fog: false }));
      d.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), dHorn.clone().negate()); d.position.copy(vM).addScaledVector(dHorn, 0.5); d.name = 'portalFill'; root.add(d);
    }
  }
  await ctx.yield();

  // ----- the clock column: four lattice faces drawn in the shader, real corner posts, dials, pendulum -----
  const COL_H = 65, COL_W = 4;
  {
    const pos = [], uv = [], idx = [];
    for (let f = 0; f < 4; f++) {
      const a = f * Math.PI / 2, cx = Math.cos(a), sx = Math.sin(a), o = pos.length / 3;
      for (const [u, v] of [[-1, 0], [1, 0], [1, 1], [-1, 1]]) { pos.push(cx * COL_W - sx * u * COL_W, v * COL_H, sx * COL_W + cx * u * COL_W); uv.push(u * COL_W, v * COL_H); }
      idx.push(o, o + 1, o + 2, o, o + 2, o + 3);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx);
    const mat = share(new THREE.ShaderMaterial({
      uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { uIron: { value: cIron.clone() } }]), fog: true, side: THREE.DoubleSide, alphaToCoverage: true,
      vertexShader: /* glsl */`
        varying vec2 vUv; varying vec3 vW;
        #include <fog_pars_vertex>
        void main() { vUv = uv; vW = (modelMatrix * vec4(position, 1.0)).xyz; vec4 mvPosition = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mvPosition;
          #include <fog_vertex>
        }`,
      fragmentShader: PORTAL_CLEAR + /* glsl */`
        uniform vec3 uKey; uniform vec3 uAmb; uniform vec3 uIron;
        varying vec2 vUv; varying vec3 vW;
        #include <fog_pars_fragment>
        void main() {
          float ph = 6.5;
          vec2 q = vec2(vUv.x, mod(vUv.y, ph) - ph * 0.5);
          float aa = max(0.7 * (fwidth(vUv.x) + fwidth(vUv.y)), 1e-3);
          float d = abs(abs(q.y) - ph * 0.5) - 0.1;                              // rails
          d = min(d, abs(abs(q.x) - 3.86) - 0.12);
          d = min(d, abs(q.x) - 0.05);
          d = min(d, abs(q.x * 3.25 - q.y * 4.0) / 5.154 - 0.05);                // the long braces
          d = min(d, abs(q.x * 3.25 + q.y * 4.0) / 5.154 - 0.05);
          d = min(d, abs(length(q) - 0.95) - 0.045);
          d = min(d, length(q) - 0.16);
          vec2 c = vec2(mod(vUv.x + 4.0, 2.0) - 1.0, mod(vUv.y, 1.625) - 0.8125); // small scrolls, four across and four to a panel
          float fine = abs(length(c) - 0.5) - 0.028;
          fine = min(fine, abs(length(vec2(abs(c.x) - 1.0, c.y)) - 0.34) - 0.024);
          fine = min(fine, abs(length(vec2(c.x, abs(c.y) - 0.8125)) - 0.22) - 0.022);
          fine = min(fine, length(c) - 0.075);
          d = min(d, fine + smoothstep(0.03, 0.12, aa) * 0.2);                    // the scrolls drop out with distance, the frame stays
          d = min(d, length(vec2(abs(q.x) - 3.86, abs(q.y) - ph * 0.5)) - 0.24);
          d += (1.0 - portalClear(vW)) * 0.1;                                     // only the frame's main bars stay, hair thin, across the way out
          d -= aa * 0.55;
          float a = 1.0 - smoothstep(-aa, aa, d);
          if (a < 0.5) discard;
          float hgt = clamp(vUv.y / 65.0, 0.0, 1.0);
          vec3 col = uIron * vec3(0.95, 1.3, 1.15) * (uAmb * 1.5 + uKey * 0.62) * mix(0.9, 1.6, hgt);
          col += uKey * vec3(0.035, 0.05, 0.045) * smoothstep(0.0, -0.12, d + 0.04);            // a lit line along every bar: lace, not a black mass
          gl_FragColor = vec4(col, a);
          #include <fog_fragment>
        }`,
    }));
    const m = new THREE.Mesh(g, mat); m.name = 'lattice'; root.add(m);
    await ctx.yield();
    for (let f = 0; f < 4; f++) {
      const a = f * Math.PI / 2 + Math.PI / 4, x = Math.cos(a) * COL_W * 1.414, z = Math.sin(a) * COL_W * 1.414;
      iron.push(bar([x, 0, z], [x, COL_H, z], 0.3, cIron, 1.6, 6, 0.24));
      for (let y = 0; y <= COL_H; y += 6.5) { const kn = new THREE.CylinderGeometry(0.4, 0.4, 0.34, 6); kn.translate(x, y, z); iron.push(paint(kn, cIron, 2.2)); }
    }
    for (const [y, r0, r1, h] of [[0, 6.6, 6.0, 1.2], [1.2, 6.0, 5.75, 0.5]]) {
      const pl = new THREE.CylinderGeometry(r1, r0, h, 4, 1, false); pl.rotateY(Math.PI / 4); pl.translate(0, y + h / 2, 0); iron.push(paint(pl, cIron, 1.8));
    }
    // the crown is open: a top rail, four hips and a ring, then a slim brass finial (no solid cap: we look over and through it at the horn)
    {
      const W = COL_W, yT = COL_H, yP = COL_H + 6.5, c4 = [[W, W], [-W, W], [-W, -W], [W, -W]];
      for (let f = 0; f < 4; f++) {
        const a = c4[f], b = c4[(f + 1) % 4];
        iron.push(bar([a[0], yT, a[1]], [b[0], yT, b[1]], 0.2, cIron, 2.0, 6));
        iron.push(bar([a[0], yT, a[1]], [0, yP, 0], 0.17, cIron, 2.1, 6, 0.09));
        iron.push(bar([a[0] * 0.5, yT + 3.25, a[1] * 0.5], [b[0] * 0.5, yT + 3.25, b[1] * 0.5], 0.09, cIron, 2.2, 5));
        const kn = new THREE.SphereGeometry(0.42, 7, 5); kn.translate(a[0], yT + 0.35, a[1]); brass.push(paint(kn, cBrass, 1));
      }
      const fin = latheCol([[0.02, 0, 1], [0.5, 0, 0.8], [0.44, 0.3, 1.1], [0.2, 0.6, 0.9], [0.14, 1.1, 1.1], [0.36, 1.5, 1.2], [0.3, 1.8, 1], [0.1, 2.2, 1], [0.05, 3.2, 0.9], [0.01, 3.6, 0.9]], 10, cBrass);
      fin.translate(0, yP - 0.2, 0); brass.push(fin);
    }
  }
  await ctx.yield();
  const DIAL_Y = 60, DIAL_R = 3.1, DIAL_D = RR + 2.2;
  const dialU = { uHands: { value: new THREE.Vector3() }, uFace: { value: cCream.clone().multiplyScalar(0.92) }, uInk: { value: cIron.clone() }, uRed: { value: cRed.clone() }, uBrass: { value: cBrass.clone() } };
  {
    const parts = [];
    for (let f = 0; f < 4; f++) {
      const a = f * Math.PI / 2;
      const g = new THREE.CircleGeometry(DIAL_R, 40); g.rotateY(a); g.translate(Math.sin(a) * DIAL_D, DIAL_Y, Math.cos(a) * DIAL_D); parts.push(g);
      const bz = new THREE.TorusGeometry(DIAL_R, 0.2, 6, 32); bz.rotateY(a); bz.translate(Math.sin(a) * DIAL_D, DIAL_Y, Math.cos(a) * DIAL_D); brass.push(paint(bz, cBrassHi));
      const back = new THREE.CylinderGeometry(DIAL_R, DIAL_R * 0.55, 0.9, 20, 1, false); back.rotateX(Math.PI / 2); back.rotateY(a); back.translate(Math.sin(a) * (DIAL_D - 0.47), DIAL_Y, Math.cos(a) * (DIAL_D - 0.47)); iron.push(paint(back, cIron, 1.7));
      for (const dy of [-2.2, 2.2]) iron.push(bar([Math.sin(a) * 5.2, DIAL_Y + dy * 1.5, Math.cos(a) * 5.2], [Math.sin(a) * (DIAL_D - 0.6), DIAL_Y + dy * 0.5, Math.cos(a) * (DIAL_D - 0.6)], 0.11, cIron, 1.8, 5));
    }
    const mat = share(new THREE.ShaderMaterial({
      uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, {}]), fog: true,
      vertexShader: /* glsl */`
        varying vec2 vUv;
        #include <fog_pars_vertex>
        void main() { vUv = uv; vec4 mvPosition = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mvPosition;
          #include <fog_vertex>
        }`,
      fragmentShader: /* glsl */`
        uniform vec3 uKey; uniform vec3 uAmb; uniform vec3 uHands; uniform vec3 uFace; uniform vec3 uInk; uniform vec3 uRed; uniform vec3 uBrass;
        varying vec2 vUv;
        #include <fog_pars_fragment>
        float hand(vec2 p, float ang, float len, float w, float aa) {
          vec2 d = vec2(sin(ang), cos(ang));
          float pr = dot(p, d), pe = abs(p.x * d.y - p.y * d.x);
          float ww = w * (1.0 - 0.55 * clamp(pr / len, 0.0, 1.0));
          return (1.0 - smoothstep(ww, ww + aa, pe)) * smoothstep(-0.14 - aa, -0.14, pr) * (1.0 - smoothstep(len, len + aa, pr));
        }
        void main() {
          vec2 p = (vUv - 0.5) * 2.0; float r = length(p);
          float aa = max(fwidth(p.x) + fwidth(p.y), 1e-4);
          float ang = r > 1e-3 ? atan(p.x, p.y) : 0.0;
          float t60 = abs(fract(ang / 6.2831853 * 60.0 + 0.5) - 0.5) / 60.0 * 6.2831853 * r;
          float t12 = abs(fract(ang / 6.2831853 * 12.0 + 0.5) - 0.5) / 12.0 * 6.2831853 * r;
          float tick = (1.0 - smoothstep(0.008, 0.008 + aa, t60)) * step(0.82, r) * step(r, 0.9);
          tick = max(tick, (1.0 - smoothstep(0.026, 0.026 + aa, t12)) * step(0.7, r) * step(r, 0.9));
          float ringI = 1.0 - smoothstep(0.012, 0.012 + aa, abs(r - 0.93));
          vec3 col = uFace * (0.9 + 0.1 * smoothstep(1.0, 0.2, r));
          col = mix(col, uInk, max(tick, ringI));
          float hh = max(hand(p, uHands.x, 0.5, 0.05, aa), hand(p, uHands.y, 0.78, 0.034, aa));
          col = mix(col, uInk, hh);
          col = mix(col, uRed, hand(p, uHands.z, 0.86, 0.014, aa));
          col = mix(col, uBrass, 1.0 - smoothstep(0.06, 0.06 + aa, r));
          col *= uKey * 0.8 + uAmb;
          gl_FragColor = vec4(col, 1.0);
          #include <fog_fragment>
        }`,
    }));
    for (const k in dialU) mat.uniforms[k] = dialU[k];
    const m = new THREE.Mesh(mergeGeometries(parts, false), mat); m.name = 'dials'; root.add(m);
    const hoop = new THREE.TorusGeometry(RR + 0.74, 0.2, 6, 44); hoop.rotateX(Math.PI / 2); hoop.translate(0, DIAL_Y, 0); iron.push(paint(hoop, cIron, 1.8));
  }
  await ctx.yield();
  const pendulum = new THREE.Group(); pendulum.position.set(0, 58, 0); pendulum.name = 'pendulum';
  {
    const parts = [bar([0, 0, 0], [0, -30, 0], 0.11, cBrass, 0.9, 6)];
    const bob = latheCol([[0.02, -0.5, 1.2], [0.4, -0.47, 1.0], [0.5, -0.42, 1.25], [0.95, -0.36, 1.25], [1.48, -0.14, 1.0], [1.62, 0, 0.8], [1.48, 0.14, 1.0], [0.95, 0.36, 1.25], [0.5, 0.42, 1.25], [0.4, 0.47, 1.0], [0.02, 0.5, 1.2]], 28, cBrassHi);   // a brass lens 3.2 m across: it reads from the galleries
    bob.rotateX(Math.PI / 2); bob.translate(0, -30, 0); parts.push(bob);
    const nut = new THREE.CylinderGeometry(0.3, 0.3, 0.5, 6); nut.translate(0, -31.95, 0); parts.push(paint(nut, cBrass));
    const anchor = new THREE.TorusGeometry(1.5, 0.12, 5, 12, Math.PI * 0.7); anchor.rotateZ(Math.PI * 0.15); anchor.translate(0, 0.2, 0); parts.push(paint(anchor, cBrass, 0.8));
    const block = new THREE.BoxGeometry(0.9, 0.5, 0.5); parts.push(paint(block, cBrassLo));
    const m = new THREE.Mesh(mergeGeometries(parts, false), brassMat); pendulum.add(m); root.add(pendulum);
    const wheel = new THREE.CylinderGeometry(1.25, 1.25, 0.16, 16); wheel.rotateX(Math.PI / 2); wheel.translate(0, 59.9, 0); iron.push(paint(wheel, cBrassLo, 1.0));
    iron.push(bar([-4, 58, 0], [4, 58, 0], 0.16, cIron, 1.8, 5));
  }
  await ctx.yield();

  // ----- the cashier's nest: coffered belly, mahogany and glass cabin, roof, hanging rods -----
  const rodTops = [];
  {
    const cv = document.createElement('canvas'); cv.width = 128; cv.height = 128;
    const g2 = cv.getContext('2d');
    const hex = (c, k = 1) => '#' + c.clone().multiplyScalar(k).getHexString();
    g2.fillStyle = hex(cWood, 1.25); g2.fillRect(0, 0, 128, 128);
    g2.fillStyle = hex(cWoodD, 1.0); g2.fillRect(9, 9, 110, 110);
    g2.fillStyle = hex(cWood, 0.9); g2.fillRect(15, 15, 98, 98);
    const gr = g2.createLinearGradient(0, 20, 0, 108); gr.addColorStop(0, '#12443e'); gr.addColorStop(1, '#1e7a6c');
    g2.fillStyle = gr; g2.fillRect(21, 21, 86, 86);
    g2.strokeStyle = hex(cBrass, 1.15); g2.lineWidth = 4; g2.strokeRect(27, 27, 74, 74);
    g2.fillStyle = hex(cBrass, 1.1); g2.beginPath(); g2.arc(64, 64, 7, 0, TAU); g2.fill();
    for (const [x, y] of [[4, 4], [124, 4], [4, 124], [124, 124]]) { g2.beginPath(); g2.arc(x, y, 3.5, 0, TAU); g2.fill(); }
    const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(24, 5); tex.anisotropy = 4;
    const prof = [];
    for (let i = 0; i <= 10; i++) { const r = Math.max(0.01, (i / 10) * NEST_R); prof.push(new THREE.Vector2(r, bellyY(r))); }
    const belly = new THREE.Mesh(new THREE.LatheGeometry(prof, 48), new THREE.MeshStandardMaterial({ map: tex, emissiveMap: tex, emissive: new THREE.Color(0.62, 0.56, 0.46), roughness: 0.62, metalness: 0.1, side: THREE.DoubleSide }));
    belly.name = 'nestBelly'; root.add(belly);
    await ctx.yield();
    brass.push(latheCol([[0.02, -3.0, 1.1], [0.35, -2.7, 1.2], [0.2, -2.2, 0.8], [0.7, -1.5, 1.1], [0.3, -0.9, 0.8], [1.5, -0.2, 1.0], [2.2, 0.15, 0.9]], 12, cBrass).translate(0, 83, 0));
    for (const [rr, y, tr] of [[NEST_R + 0.35, NEST_FLOOR, 0.3], [NEST_R * 0.62, bellyY(NEST_R * 0.62) - 0.05, 0.12]]) { const b = new THREE.TorusGeometry(rr, tr, 6, 64); b.rotateX(Math.PI / 2); b.translate(0, y, 0); brass.push(paint(b, cBrass, 0.95)); }

    const wood = [];
    const ringW = (r0, r1, y0, y1, c, sh) => { const g = new THREE.CylinderGeometry(r1, r0, y1 - y0, 48, 1, true); g.translate(0, (y0 + y1) / 2, 0); wood.push(paint(g, c, sh)); };
    ringW(NEST_R + 0.55, NEST_R + 0.55, NEST_FLOOR - 0.1, NEST_FLOOR + 0.5, cWoodD, 1.2);
    ringW(NEST_R, NEST_R, NEST_FLOOR + 0.5, NEST_FLOOR + 2.0, cWood, 1.0);
    ringW(NEST_R + 0.12, NEST_R + 0.12, NEST_FLOOR + 2.0, NEST_FLOOR + 2.3, cWood, 1.5);
    ringW(NEST_R + 0.12, NEST_R + 0.12, NEST_FLOOR + 5.3, NEST_FLOOR + 5.55, cWood, 1.4);
    ringW(NEST_R + 0.2, NEST_R + 0.75, NEST_FLOOR + 7.0, NEST_FLOOR + 7.7, cWood, 1.3);
    ringW(NEST_R + 0.75, NEST_R + 0.5, NEST_FLOOR + 7.7, NEST_FLOOR + 8.1, cWoodD, 1.4);
    await ctx.yield();
    const flo = new THREE.CircleGeometry(NEST_R + 0.5, 48); flo.rotateX(-Math.PI / 2); flo.translate(0, NEST_FLOOR + 0.5, 0); wood.push(paint(flo, cWoodD, 1.0));
    for (let i = 0; i < 72; i++) {
      const a = (i / 72) * TAU, post = i % 3 === 0, w = post ? 0.5 : 0.16;
      const b = new THREE.BoxGeometry(w, post ? 6.6 : 5.0, w * 1.2); b.rotateY(-a + Math.PI / 2);
      b.translate(Math.cos(a) * (NEST_R + 0.05), NEST_FLOOR + (post ? 3.8 : 4.5), Math.sin(a) * (NEST_R + 0.05)); wood.push(paint(b, post ? cWood : cWoodD, post ? 1.15 : 1.5));
      if (post) { const cp = new THREE.BoxGeometry(0.75, 0.4, 0.85); cp.rotateY(-a + Math.PI / 2); cp.translate(Math.cos(a) * (NEST_R + 0.1), NEST_FLOOR + 6.85, Math.sin(a) * (NEST_R + 0.1)); wood.push(paint(cp, cBrass, 0.8)); }
    }
    await ctx.yield();
    const wm = new THREE.Mesh(mergeGeometries(wood, false), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.5, metalness: 0.05 }));
    wm.name = 'nestWood'; root.add(wm);
    await ctx.yield();
    const pane = new THREE.CylinderGeometry(NEST_R - 0.02, NEST_R - 0.02, 4.7, 48, 1, true); pane.translate(0, NEST_FLOOR + 4.65, 0);
    const pm = new THREE.Mesh(pane, new THREE.MeshBasicMaterial({ color: cDay.clone().lerp(cPane, 0.18).multiplyScalar(0.8), transparent: true, opacity: 0.5, depthWrite: false, side: THREE.DoubleSide }));
    pm.name = 'nestGlass'; pm.renderOrder = 1; root.add(pm);
    await ctx.yield();
    // roof, lantern and finial in iron and brass
    iron.push(latheCol([[NEST_R + 0.6, NEST_FLOOR + 8.1, 1.6], [NEST_R + 0.9, NEST_FLOOR + 8.3, 2.2], [9.5, NEST_FLOOR + 11.0, 1.7], [3.4, NEST_FLOOR + 12.4, 1.9], [3.4, NEST_FLOOR + 14.2, 1.5], [3.9, NEST_FLOOR + 14.4, 2.2], [0.02, NEST_FLOOR + 16.2, 1.8]], 48, cIron));
    for (let i = 0; i < 24; i++) {
      const a = (i / 24) * TAU + TAU / 48, c = Math.cos(a), s = Math.sin(a);
      brass.push(bar([c * (NEST_R + 0.85), NEST_FLOOR + 8.36, s * (NEST_R + 0.85)], [c * 9.5, NEST_FLOOR + 11.06, s * 9.5], 0.09, cBrass, 0.9, 5));
    }
    brass.push(latheCol([[0.02, 0, 1], [0.5, 0.1, 1.1], [0.25, 0.7, 0.8], [0.8, 1.3, 1.2], [0.8, 1.7, 1.2], [0.2, 2.3, 0.9], [0.02, 3.6, 1.1]], 10, cBrassHi).translate(0, NEST_FLOOR + 16.1, 0));
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * TAU + TAU / 24, c = Math.cos(a), s = Math.sin(a);
      const lo = [c * (NEST_R + 0.6), NEST_FLOOR + 7.9, s * (NEST_R + 0.6)], hi = [c * 25, 118, s * 25];
      iron.push(bar(lo, hi, 0.11, cIron, 1.9, 5));
      const tb = new THREE.SphereGeometry(0.3, 6, 5); tb.scale(1, 2.2, 1); tb.translate(lerp(lo[0], hi[0], 0.45), lerp(lo[1], hi[1], 0.45), lerp(lo[2], hi[2], 0.45)); brass.push(paint(tb, cBrass));
      rodTops.push(new THREE.Vector3(hi[0], hi[1], hi[2]));
    }
  }
  await ctx.yield();
  {
    const mergeAll = async (list) => {                       // in batches, so no step holds the page for long
      const mid = [];
      for (let i = 0; i < list.length; i += 150) { mid.push(mergeGeometries(list.slice(i, i + 150), false)); await ctx.yield(); }
      const out = mid.length > 1 ? mergeGeometries(mid, false) : mid[0];
      await ctx.yield();
      for (const g of list) g.dispose(); if (mid.length > 1) for (const g of mid) g.dispose();
      return out;
    };
    const bm = new THREE.Mesh(await mergeAll(brass), brassMat); bm.name = 'brassWork'; root.add(bm);
    for (const bb of bridgeBrass) { const m = new THREE.Mesh(await mergeAll(bb), brassMat); m.name = 'bridgeBrass'; m.userData.centre = bb.centre; root.add(m); }
    await ctx.yield();
    const im = new THREE.Mesh(await mergeAll(iron), ironMat); im.name = 'ironWork'; root.add(im);
  }
  await ctx.yield();

  // ----- our capsule's place on the neighbour's tube, for the scripted rival -----
  const nMap = new Float32Array(rideTab.n + 1);
  {
    let j = 0; const np = neighbourTab.p, rp = rideTab.p;
    for (let i = 0; i <= rideTab.n; i++) {
      let best = 1e9, bj = j;
      for (let k = j; k < Math.min(neighbourTab.n, j + 8); k++) { const d = Math.hypot(np[k * 3] - rp[i * 3], np[k * 3 + 1] - rp[i * 3 + 1], np[k * 3 + 2] - rp[i * 3 + 2]); if (d < best) { best = d; bj = k; } }
      j = bj; nMap[i] = bj * neighbourTab.step;
    }
  }
  const leaveI = Math.round(leaveS / rideTab.step);
  const neighbourS = (s) => { const f = clamp(s / rideTab.step, 0, rideTab.n); return f <= leaveI ? lerp(nMap[Math.floor(f)], nMap[Math.min(rideTab.n, Math.floor(f) + 1)], f - Math.floor(f)) : nMap[leaveI] + (s - leaveS); };

  let prog = null, volley = 0;
  const hands0 = rng.range(2, 9);                              // minutes past eleven
  const size = new THREE.Vector2(), camP = new THREE.Vector3();
  const ss = smoothstep;
  function update(dt, time, camera) {
    U.uTime.value = time;
    if (camera && ctx.renderer) { ctx.renderer.getDrawingBufferSize(size); U.uPix.value = 2 / (Math.max(0.2, camera.projectionMatrix.elements[5]) * Math.max(64, size.y)); }
    if (camera) camP.setFromMatrixPosition(camera.matrixWorld);
    pendulum.rotation.z = 0.085 * Math.sin(time * TAU / 6);
    if (camera) { P.copy(camP).sub(vM); const dl = Math.max(P.length(), 1e-3); U.uPortal.value.w = 0.97 * ss(0.02, 0.3, -P.dot(dHorn) / dl) * ss(9, 20, dl); }
    const sec = Math.floor(time) + ss(0.0, 0.18, time - Math.floor(time)), min = hands0 + time / 60;
    dialU.uHands.value.set((11 + min / 60) / 12 * TAU, min / 60 * TAU, sec / 60 * TAU);
    const u = prog;
    for (let i = 0; i < NCAP; i++) {
      const c = caps[i], tab = c.tab; let s;
      if (i >= 40) {
        // the volley: half the extra capsules stream up the rope's strands, half round the shelves, for as long as the
        // sweep lasts; then every one of them closes on its bell-mouth and they arrive together (u 0.95 to 0.985)
        if (volley <= 0) s = -1;
        else {
          const onRope = i % 2 === 0, a = onRope ? tab.ropeS : Math.min(40, tab.ropeS * 0.2), b = onRope ? tab.len - 3 : Math.max(tab.ropeS, a + 20);
          s = a + ((c.ph * (b - a) + time * (onRope ? 0.45 : 0.7) * c.speed) % Math.max(b - a, 1));
          const uu = u === null ? 0 : u, k = ss(0.865, 0.905, uu);
          if (k > 0) s = lerp(s, tab.len - (0.95 + 0.035 * c.ph - uu) * rideTab.len * 0.75, k);
        }
      }
      else if (i >= nEvery) s = -1;
      else if (u !== null && i === 0) {
        const k = opts.rival || [0.555, 0.6, 0.655, 0.67, 0.735, 0.8, 0.9];
        const d = opts.rivalAhead ? opts.rivalAhead(u) : -16 + 16 * ss(k[0], k[1], u) + 4.5 * ss(k[1], k[2], u) - 4.5 * ss(k[3], k[4], u) - 14 * ss(k[4], k[5], u) - 40 * ss(k[5], k[6], u);
        s = neighbourS(u * rideTab.len) + d;
      } else if (u !== null && c.arrive && u > 0.9) { const k = ss(0.9, 0.93, u); s = lerp((c.off + c.speed * time) % tab.len, tab.len - (c.arrive - u) * rideTab.len * 1.15, k); }
      else s = (c.off + c.speed * time) % tab.len;
      setCap(i, tab, s);
    }
    const cnt = volley > 0 ? NCAP : 40; capBody.count = cnt; capNose.count = cnt;
    capBody.instanceMatrix.needsUpdate = true; capNose.instanceMatrix.needsUpdate = true;
  }
  update(0, 0, null);

  const V3 = (a) => new THREE.Vector3(a[0], a[1], a[2]);
  const flyThrough = L.ride.map(V3);
  const entryDir = flyThrough[1].clone().sub(flyThrough[0]).normalize();
  const anchors = {
    portalSeat: { position: vM.clone(), normal: dHorn.clone().negate(), direction: dHorn.clone(), radius: 7, pitch: PITCH, tilt: true },
    flyThrough, entry: { position: flyThrough[0].clone(), direction: entryDir },
    wellEdge: { a: WA, b: WB }, tiers: [13, 26, 39, 52, 65, 78], shelfY: SHELF_Y.slice(),
    risers: L.risers.map((r) => ({ position: V3(r.position), tier: r.tier })),
    bridges: L.bridges.map((b) => ({ from: V3(b.Q), to: V3(b.J), y: b.y, width: b.n * 1.2 + 1 })),
    clock: { base: new THREE.Vector3(0, 0, 0), top: new THREE.Vector3(0, COL_H, 0), dialsY: DIAL_Y, pendulumPivot: new THREE.Vector3(0, 58, 0), halfWidth: COL_W, ropeRadius: RR + 0.9 },
    nest: { center: new THREE.Vector3(0, NEST_FLOOR, 0), radius: NEST_R, floorY: NEST_FLOOR, bellyY: 83, roofY: NEST_FLOOR + 16.2, rodTops },
    leaveS, floorSlot: V3(ell(lerp(THA, TH0, 0.42), -2.0, 0)),
    viewpoints: {
      wholeWell: { position: V3(ell(270 * DEG, -2.6, 49)), target: new THREE.Vector3(0, 62, 0) },
      bridge: { position: new THREE.Vector3(-30, 64.5, -17.6), target: new THREE.Vector3(0, 70, 0) },
      horn: { position: vM.clone().addScaledVector(dHorn, -30), target: vM.clone() },
    },
  };
  return {
    object: root, radius: 66, height: 118, center: new THREE.Vector3(0, 52, 0), anchors,
    update, dispose() {}, ground: true, groundY: 0,
    setProgress(u) { prog = u === null || u === undefined ? null : clamp(u, 0, 1); },
    setVolley(v) { volley = clamp(v || 0, 0, 1); },
    setLight(color, intensity = 1, dir) { U.uKey.value.set(color).multiplyScalar(intensity); if (dir) U.uLDir.value.copy(dir).normalize(); },
    ride: { length: rideTab.len, at(s, pos, tan) { return sampleTable(rideTab, s, pos, tan); } },
    tubes: tabs, uniforms: U,
  };
}
