// SEVEN ROOMS AND ONE CLOCK
// A masked ball winds through a suite of seven rooms laid out crookedly: a sharp turn at every doorway, so the eye takes
// in little more than one room at a time. No lamp or candle anywhere: each room is lit only by the two braziers that burn
// in the closed corridor behind its two tall stained windows, so each room is one colour of light, in the order blue,
// purple, green, orange, white, violet; the seventh is hung in black velvet and its panes are scarlet. Against its far
// wall stands the ebony clock (src/parts/seven-rooms-one-clock.js), the portal inside its open case.
// Built at twice life size. Every room is a THREE.Group whose own space is the room's: x across, z from 0 (the wall we
// came in by) to -L (the wall we leave by). All light is worked out in that space by the room shader of the part file;
// there are no three.js lights. A doorway is a short vaulted passage that bends at a mitre: its near half belongs to the
// room before and takes its colour, its far half to the room after, so two colours meet in every doorway; on the outer
// side of every bend an open tracery looks into the corridor, where a brazier burns on its tripod.
// The film goes by the metres flown (the one declared pacing: the revel turns as we advance). The dancers turn in pairs
// through six rooms; from the door out of the white room the clock strikes, one stroke for every stroke's length of
// route until the portal takes us: a dull pulse in every room's light, a ring of red light across the carpet of the
// seventh room. From that door every dancer stops mid-turn and looks to the last doorway; from the middle of the violet
// room they stir, and by the black door they turn again, behind us. On the clock: the pendulum, a small sway of the
// dancers while they dance, fires, sparks, haze and confetti.
import * as THREE from 'three';
import { makePath, makeRng, hashSeed, clamp, lerp, smoothstep } from '../kit/core.js';
import { buildHero, makeBatch, roomUniforms, roomMaterial, makeMasquers, pairParts, archWall, archReveal, archOutline, archTop, K, lin, HEADS, CLOCK, ROOM_GLSL } from '../parts/seven-rooms-one-clock.js';

const TAU = Math.PI * 2;
const SUITE = [
  { key: 'blue', hex: '#1f4fd8' }, { key: 'purple', hex: '#7a2bbf' }, { key: 'green', hex: '#1f9d4d' }, { key: 'orange', hex: '#f08a1c' },
  { key: 'white', hex: '#f4f1e8' }, { key: 'violet', hex: '#a06be0' }, { key: 'black', hex: '#b00f1e' },
];
const GOLD = [1, 0.72, 0.34], FIREC = lin('#ff9a3c'), STONE = [0.5, 0.49, 0.47];
const DOOR_HW = 4.7, DOOR_TOP = 12.5, DOOR_K = 1.56, WALL_T = 1.5, DURATION = 50;
const DOOR_YS = DOOR_TOP - archTop(0, DOOR_HW, 0, DOOR_K);
const mul = (c, k) => [c[0] * k, c[1] * k, c[2] * k];
const mix3 = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
// the pointed profile every vault of the suite shares: 1 at the crown, 0 at the springing
const KAP = 0.3, PHI0 = Math.sqrt((1 + KAP) ** 2 - KAP ** 2);
const phi = (s) => Math.sqrt(Math.max((1 + KAP) ** 2 - (Math.min(Math.abs(s), 1) + KAP) ** 2, 0)) / PHI0;

// ---------------------------------------------------------------------------------------------- the shell of one room
// R: { hw, L, wallH, crown, style (0 barrel, 1 rib vault, 2 timber), bays, win: { z, hw, sill, top }, doorA (x | null), doorB (x | null),
//      turnA, turnB (signed bend of the passage at each end), gA, gB (half lengths of the passages), velvet }
function ceilAt(R, x, z) {
  const rise = R.crown - R.wallH;
  if (R.style === 2) return R.wallH;
  const a = R.wallH + rise * phi(x / R.hw);
  if (R.style === 0) return a;
  const hb = R.L / R.bays / 2, zb = ((-z / (hb * 2)) % 1 + 1) % 1 * 2 - 1;
  return Math.max(a, R.wallH + rise * phi(zb));
}
function* shellInto(b, R, P) {
  const { hw, L, wallH, crown } = R, rise = crown - wallH, hb = L / R.bays / 2;
  const wallKind = () => (R.velvet ? b.col(P.velvet).surf(K.VELVET, 0.1, 0, 0.05) : b.col(P.stone).surf(K.STONE, 0.12, 0, 0));
  const gold = () => b.col(GOLD).surf(K.GOLD, 0.8, 1, 0);
  // floor
  if (R.velvet) b.col(P.carpet).surf(K.CARPET, 0.05, 0, 0); else b.col(P.floor).surf(K.FLOOR, 0.78, 0, 0);
  b.quad([-hw, 0, 0], [hw, 0, 0], [hw, 0, -L], [-hw, 0, -L]);
  // side walls with the window, end walls with the doors
  const win = { c: R.win.z, hw: R.win.hw, y0: R.win.sill, ys: R.win.top - 1.732 * R.win.hw, k: 2 };
  wallKind();
  for (const s of [-1, 1]) {
    archWall(b, { at: (u, y) => [s * hw, y, u], u0: -L, u1: 0, bottom: 0, top: (u) => ceilAt(R, s * hw, u), holes: [win], step: 2, flip: s > 0 });
    b.col(P.stone, 0.8).surf(K.STONE, 0.12, 0, 0);
    archReveal(b, { at3: (u, y, d) => [s * (hw + d), y, u] }, win, 0, WALL_T, 16);
    b.col([1, 1, 1]).surf(K.GLASS, 0.9, 0, 0);
    b.quad([s * (hw + WALL_T), win.y0, win.c - win.hw], [s * (hw + WALL_T), win.y0, win.c + win.hw], [s * (hw + WALL_T), R.win.top, win.c + win.hw], [s * (hw + WALL_T), R.win.top, win.c - win.hw]);
    gold(); b.tube(archOutline(win, 14).map((q) => [s * (hw - 0.12), q[1] + (q[1] > win.ys ? 0.25 : 0), win.c + (q[0] - win.c) * 1.07]), 0.16, 5);
    if (R.velvet) {                                                   // the scarlet windows stand in piers of bare stone, barred with iron: the glass is seen to be set in the wall
      b.col(P.stone, 1.2).surf(K.STONE, 0.12, 0, 0);
      archWall(b, { at: (u, y) => [s * (hw - 0.08), y, u], u0: win.c - win.hw - 2.7, u1: win.c + win.hw + 2.7, bottom: 0, top: () => R.win.top + 2.6, holes: [win], step: 2, flip: s > 0 });
      b.box(s * (hw - 0.5), win.y0 - 0.35, win.c, 1.0, 0.7, win.hw * 2 + 1.8);
      b.col([0.03, 0.03, 0.035]).surf(K.PLAIN, 0.3, 0, 0);
      for (let y = win.y0 + 5; y < win.ys; y += 5.5) b.box(s * (hw + WALL_T - 0.15), y, win.c, 0.12, 0.18, win.hw * 2);
    }
    wallKind();
    yield;
  }
  yield;
  const doorHole = (x) => ({ c: x, hw: DOOR_HW, y0: 0, ys: DOOR_YS, k: DOOR_K });
  const ends = [[0, R.doorA, 1, R.turnA, R.gA], [-L, R.doorB, -1, R.turnB, R.gB]];
  for (const [z, dx, dir, turn, g] of ends) {
    yield;
    wallKind();
    archWall(b, { at: (u, y) => [u, y, z], u0: -hw, u1: hw, bottom: 0, top: (u) => ceilAt(R, u, z + dir * -0.01), holes: dx === null ? [] : [doorHole(dx)], step: 2, flip: dir < 0 });
    if (dx === null) continue;
    // the passage: from the wall to the mitre where it meets the next room's half
    const t = Math.tan(turn / 2), zm = (x) => (dir > 0 ? g + (x - dx) * t : -L - g - (x - dx) * t);
    const out = archOutline(doorHole(dx), 14), so = turn > 0 ? 1 : -1, niche = dir > 0;
    b.col(P.stone, 0.9).surf(K.STONE, 0.15, 0, 0);
    for (let i = 0; i < out.length - 1; i++) {
      if (niche && i === (so > 0 ? out.length - 2 : 0)) continue;       // the outer jamb of the bend is built below, with its opening
      const a = out[i], c = out[i + 1];
      b.quad([a[0], a[1], z], [c[0], c[1], z], [c[0], c[1], zm(c[0])], [a[0], a[1], zm(a[0])]);
    }
    b.col(P.floor).surf(K.FLOOR, 0.78, 0, 0);
    b.quad([dx - DOOR_HW, 0, z], [dx + DOOR_HW, 0, z], [dx + DOOR_HW, 0, zm(dx + DOOR_HW)], [dx - DOOR_HW, 0, zm(dx - DOOR_HW)]);
    gold();
    b.tube(out.map((q) => [dx + (q[0] - dx) * 1.06, q[1] + (q[1] > DOOR_YS ? 0.3 : 0), z + dir * -0.15]), 0.24, 5);
    b.tube(out.map((q) => [dx + (q[0] - dx) * 1.2, q[1] + (q[1] > DOOR_YS ? 1.0 : 0), z + dir * -0.1]), 0.12, 4);
    for (const f of [0.19, 0.37, 0.55]) {                             // ribs across the passage vault, sprung from corbels above the hangings
      const zf = z + dir * g * f;
      b.tube(out.filter((q) => q[1] > DOOR_YS - 0.01).map((q) => [dx + (q[0] - dx) * 0.97, q[1] * 0.985, zf]), f > 0.5 ? 0.2 : 0.15, 5);
      for (const sg of [-1, 1]) b.box(dx + sg * (DOOR_HW * 0.97 - 0.05), DOOR_YS * 0.985 - 0.12, zf, 0.4, 0.42, 0.56);
    }
    for (const sg of [-1, 1]) {                                       // a hanging on every jamb of the passage long enough to take one
      if (niche && sg === so) continue;
      const xj = dx + sg * DOOR_HW, zE = zm(xj);
      if (Math.abs(zE - z) < 2.6) continue;
      const za = z + dir * 0.7, zb = zE - dir * 0.5, xh = xj - sg * 0.14, yh = DOOR_YS - 0.45;
      b.col(P.cloth2).surf(K.TAPESTRY, 0.1, 0, 0.03);
      b.quad([xh, 1.2, za], [xh, 1.2, zb], [xh, yh, zb], [xh, yh, za]);
      gold(); b.rod([xh, yh + 0.1, za], [xh, yh + 0.1, zb], 0.09, 0.09, 4); b.rod([xh, 1.14, za], [xh, 1.14, zb], 0.06, 0.06, 4);
    }
    if (!niche) continue;
    // on the outer side of the bend an open tracery looks into the closed corridor, where a brazier burns on its tripod
    const xw = dx + so * DOOR_HW, zEnd = zm(xw), nc = { c: zEnd * 0.5 + 0.2, hw: Math.min(2.3, zEnd / 2 - 0.9), y0: 1.0, ys: 4.4, k: 2 };
    const nTop = archTop(0, nc.hw, nc.ys, 2), cx = xw + so * 4.4, fy = 3.9;
    b.col(P.stone, 0.9).surf(K.STONE, 0.15, 0, 0);
    archWall(b, { at: (u, y) => [xw, y, u], u0: 0, u1: zEnd, bottom: 0, top: () => DOOR_YS, holes: [nc], step: 1.5 });
    archReveal(b, { at3: (u, y, d) => [xw + so * d, y, u] }, nc, 0, 0.8, 12);
    b.col(P.rib).surf(K.STONE, 0.3, 0, 0);
    b.box(xw + so * 0.4, (nc.y0 + nc.ys + 0.6) / 2, nc.c, 0.34, nc.ys + 0.6 - nc.y0, 0.26);
    for (const sz of [-1, 1]) b.tube([[xw + so * 0.4, nc.ys + 0.4, nc.c], [xw + so * 0.4, nc.ys + 1.5, nc.c + sz * nc.hw * 0.32], [xw + so * 0.4, archTop(nc.hw * 0.55, nc.hw, nc.ys, 2) + 0.1, nc.c + sz * nc.hw * 0.55]], 0.15, 4);
    b.box(xw + so * 0.4, nc.y0, nc.c, 0.7, 0.3, nc.hw * 2 + 0.3);
    gold(); b.tube(archOutline(nc, 10).map((q) => [xw - so * 0.1, q[1] + (q[1] > nc.ys ? 0.2 : 0), nc.c + (q[0] - nc.c) * 1.1]), 0.11, 4);
    const lit = (k0) => (x, y, zz, c) => { const d2 = (x - cx) ** 2 + (y - fy) ** 2 + (zz - nc.c) ** 2, k = k0 / (1 + d2 / 16); c[0] = FIREC[0] * k; c[1] = FIREC[1] * k; c[2] = FIREC[2] * k * 0.8; };
    b.shade(lit(1.5)).surf(K.FIRELIT, 0, 0, 0);
    const xb = xw + so * 9, za = nc.c - 5, zb = nc.c + 5, yc = 10.5;
    b.grid(5, 5, (u, v, o) => { o[0] = xb; o[1] = v * yc; o[2] = lerp(za, zb, u); });
    for (const zz of [za, zb]) b.grid(5, 5, (u, v, o) => { o[0] = lerp(xw + so * 0.8, xb, u); o[1] = v * yc; o[2] = zz; });
    b.grid(5, 5, (u, v, o) => { o[0] = lerp(xw + so * 0.8, xb, u); o[1] = 0; o[2] = lerp(za, zb, v); });
    b.grid(5, 5, (u, v, o) => { o[0] = lerp(xw + so * 0.8, xb, u); o[1] = yc; o[2] = lerp(za, zb, v); });
    b.shade(lit(0.22));
    for (let i = 0; i < 3; i++) { const a = i / 3 * TAU + 0.4; b.rod([cx + Math.cos(a) * 1.5, 0, nc.c + Math.sin(a) * 1.5], [cx + Math.cos(a) * 0.5, fy - 0.9, nc.c + Math.sin(a) * 0.5], 0.11, 0.09, 5); }
    b.grid(10, 3, (u, v, o) => { const a = u * TAU, r = [0.3, 1.0, 1.35, 1.3][Math.round(v * 3)]; o[0] = cx + Math.sin(a) * r; o[1] = fy - 0.95 + [0, 0.25, 0.75, 0.9][Math.round(v * 3)]; o[2] = nc.c + Math.cos(a) * r; });
    b.shade(null).col(FIREC, 1.2).surf(K.FIRE, 0, 0, 0);
    b.geo(new THREE.SphereGeometry(1, 10, 5), { p: [cx, fy - 0.05, nc.c], s: [1.2, 0.35, 1.2] });
    b.col(FIREC, 0.9).surf(K.FIRE, 0, 0, 0.16);
    for (let i = 0; i < 5; i++) { const a = i * 2.4, r = i ? 0.55 : 0, h = i ? 1.3 + 0.35 * i : 3.0; b.geo(new THREE.ConeGeometry(0.5 - 0.04 * i, h, 6), { p: [cx + Math.cos(a) * r, fy + h / 2, nc.c + Math.sin(a) * r] }); }
    R.fire = [cx, fy + 0.6, nc.c];
  }
}
// the ceiling of the room, its arches and the piers they stand on
function* roofInto(b, R, P) {
  const { hw, L, wallH, crown } = R, rise = crown - wallH, hb = L / R.bays / 2;
  const gold = () => b.col(GOLD).surf(K.GOLD, 0.8, 1, 0);
  const ceilKind = () => (R.velvet ? b.col(P.velvet).surf(K.VELVET, 0.1, 0, 0.08) : b.col(P.vault).surf(K.VAULT, 0.1, 0, 0));
  const rib = (pts, r, golden) => { if (golden) gold(); else b.col(P.rib).surf(K.STONE, 0.3, 0, 0); b.tube(pts, r, 5); };
  const o3 = [0, 0, 0];
  if (R.style === 1) {
    for (let k = 0; k < R.bays; k++) {
      yield;
      const zc = -(k * 2 + 1) * hb;
      ceilKind();
      for (const sx of [-1, 1]) {                                     // the two webs that run in from the side walls
        b.grid(12, 4, (u, v, o) => { const un = u * 2 - 1, xn = lerp(Math.abs(un), 1, v); o[0] = sx * xn * hw; o[1] = wallH + rise * phi(un); o[2] = zc + un * hb; }, sx > 0);
        b.grid(12, 4, (u, v, o) => { const un = u * 2 - 1, zn = lerp(Math.abs(un), 1, v); o[0] = un * hw; o[1] = wallH + rise * phi(un); o[2] = zc + sx * zn * hb; }, sx < 0);
      }
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) {           // diagonal ribs
        const pts = []; for (let i = 0; i <= 8; i++) { const t = i / 8; pts.push([sx * (1 - t) * hw, wallH + rise * phi(1 - t) - 0.25, zc + sz * (1 - t) * hb]); }
        rib(pts, 0.34, !R.velvet);
      }
      gold(); b.geo(new THREE.SphereGeometry(0.95, 8, 6), { p: [0, crown - 0.5, zc], s: [1, 0.7, 1] });
      b.geo(new THREE.ConeGeometry(0.45, 1.6, 6), { p: [0, crown - 1.6, zc], r: [Math.PI, 0, 0] });
    }
  } else if (R.style === 0) {
    ceilKind();
    b.grid(20, R.bays * 2, (u, v, o) => { const x = (u * 2 - 1) * hw; o[0] = x; o[1] = wallH + rise * phi(x / hw); o[2] = -v * L; }, false);
    for (const xn of [-0.55, 0, 0.55]) rib([[xn * hw, wallH + rise * phi(xn) - 0.2, 0], [xn * hw, wallH + rise * phi(xn) - 0.2, -L / 2], [xn * hw, wallH + rise * phi(xn) - 0.2, -L]], xn ? 0.22 : 0.3, true);
  } else {
    ceilKind();
    b.quad([-hw, wallH, -L], [hw, wallH, -L], [hw, wallH, 0], [-hw, wallH, 0]);
    b.col(P.wood).surf(K.WOOD, 0.5, 0, 0);
    for (let i = 1; i < R.bays * 3; i++) b.box(0, wallH - 0.35, -i * L / (R.bays * 3), hw * 2, 0.7, 0.5);
    for (const xn of [-0.6, -0.2, 0.2, 0.6]) b.box(xn * hw, wallH - 0.25, -L / 2, 0.45, 0.5, L);
    gold();
    for (let i = 1; i < R.bays * 3; i++) for (const xn of [-0.6, -0.2, 0.2, 0.6]) b.geo(new THREE.SphereGeometry(0.42, 6, 4), { p: [xn * hw, wallH - 0.75, -i * L / (R.bays * 3)], s: [1, 0.6, 1] });
  }
  yield;
  // transverse arches and the piers they stand on
  for (let k = 0; k <= R.bays; k++) {
    yield;
    const z = -k * 2 * hb, inset = k === 0 ? -0.5 : k === R.bays ? 0.5 : 0;
    if (R.style !== 2) {
      const pts = []; for (let i = 0; i <= 16; i++) { const xn = i / 8 - 1; pts.push([xn * (hw - 0.2), wallH + rise * phi(xn) - 0.35, z + inset]); }
      rib(pts, R.style === 0 ? 0.5 : 0.42, !R.velvet && (R.style === 0 || k % 2 === 0));
    } else {
      const pts = []; for (let i = 0; i <= 16; i++) { const xn = i / 8 - 1; pts.push([xn * (hw - 0.3), wallH - 5.2 + 4.6 * phi(xn), z + inset]); }
      b.col(P.wood).surf(K.WOOD, 0.5, 0, 0); b.tube(pts, 0.42, 5);
      b.box(0, wallH - 0.5, z + inset, hw * 2, 1, 0.8);
    }
    for (const s of [-1, 1]) {
      const x = s * (hw - 0.45), top = R.style === 2 ? wallH - 5.2 : wallH;
      if (R.velvet) b.col(P.velvet, 1.5).surf(K.VELVET, 0.1, 0, 0); else b.col(P.rib).surf(K.STONE, 0.3, 0, 0);
      b.geo(new THREE.CylinderGeometry(0.62, 0.7, top, 8, 1, true), { p: [x, top / 2, z + inset] });
      for (const dz of [-0.75, 0.75]) b.geo(new THREE.CylinderGeometry(0.36, 0.4, top, 6, 1, true), { p: [x + s * 0.2, top / 2, z + inset + dz] });
      gold();
      b.geo(new THREE.CylinderGeometry(1.25, 0.75, 1.1, 8), { p: [x, top - 0.1, z + inset], s: [1, 1, 1.5] });
      b.geo(new THREE.CylinderGeometry(0.8, 1.05, 0.7, 8), { p: [x, 0.35, z + inset], s: [1, 1, 1.5] });
      b.geo(new THREE.TorusGeometry(0.72, 0.1, 4, 8), { p: [x, top * 0.45, z + inset], r: [Math.PI / 2, 0, 0], s: [1, 1.4, 1] });
    }
  }
}

// ---------------------------------------------------------------------------------------------- shafts of coloured light
// Sheets that fan from the fire through the window: each carries the tracery of its own slice of the window.
const SHAFT_VERT = /* glsl */`
attribute vec3 aQ;         // across the window, above the sill, 0 at the glass .. 1 at the far end
attribute float aSide;
varying vec3 vQ, vP, vV, vN; varying float vSide;
void main(){
  vQ = aQ; vSide = aSide; vP = position; vN = normal;
  vec4 wp = modelMatrix * vec4(position, 1.);
  vV = (cameraPosition - wp.xyz) * mat3(modelMatrix);
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;
const SHAFT_FRAG = /* glsl */`
varying vec3 vQ, vP, vV, vN; varying float vSide;
uniform float uShaft;
${ROOM_GLSL}
void main(){
  vec3 g = lancetGlass(vQ.xy, uWin.z, uWin.w - uWin.y, uSrc.z, 0.16 + vQ.z * 0.4);
  float fl = vSide < 0. ? uFlick.x : uFlick.y;
  float d = length(vV);
  vec3 v = vV / max(d, 1e-3);
  float face = abs(dot(v, normalize(vN)));
  float haze = 0.55 + 0.9 * rNoise(vP.xy * 0.22 + vec2(uTime * 0.11, -uTime * 0.05) + vP.z * 0.13) * rNoise(vP.yz * 0.5 - uTime * 0.07);
  float rn = rNoise(vec2(vQ.y * 1.3, vQ.x * 4.5));
  float ray = mix(0.5 + rn, 2.4 * smoothstep(0.3, 0.85, rn), uLook.w);                  // brighter and darker rays, as the quarries let them through
  float a = g.x * fl * haze * ray * (1. - 0.8 * clamp(vQ.z, 0., 1.)) * smoothstep(0., 0.35, face) * smoothstep(4., 22., d) * smoothstep(0., 0.06, vQ.z);
  gl_FragColor = vec4(uRoomCol * (a * uShaft), 1.);
}`;
function shaftGeometry(R, src) {
  const P = [], N = [], Q = [], S = [], nSheet = 7, nRow = 6, ys = R.win.top - 1.732 * R.win.hw;
  for (const s of [-1, 1]) {
    const sx = s * (R.hw + src.back), sy = src.y, sz = R.win.z + src.z;
    for (let i = 0; i < nSheet; i++) {
      const qx = ((i + 0.5) / nSheet * 2 - 1) * R.win.hw * 0.9, wz = R.win.z + qx, yTop = Math.min(archTop(qx, R.win.hw, ys, 2), R.win.top) - 0.25;
      const row = [];
      for (let j = 0; j <= nRow; j++) {
        const y = lerp(R.win.sill + 0.25, yTop, j / nRow), dx = s * R.hw - sx, dy = y - sy, dz = wz - sz;
        let t = 1e9;                                                  // to the floor, the far wall or an end wall, whichever comes first
        if (dy < -1e-4) t = Math.min(t, (0 - y) / dy);
        t = Math.min(t, (-s * R.hw - s * R.hw) / dx);
        if (dz < -1e-4) t = Math.min(t, (-R.L - wz) / dz); else if (dz > 1e-4) t = Math.min(t, (0 - wz) / dz);
        row.push({ a: [s * R.hw, y, wz], b: [s * R.hw + dx * t, y + dy * t, wz + dz * t], q: [qx, y - R.win.sill] });
      }
      const e1 = [row[0].b[0] - row[0].a[0], row[0].b[1] - row[0].a[1], row[0].b[2] - row[0].a[2]], e2 = [0, 1, 0];
      const n = [e1[1] * e2[2] - e1[2] * e2[1], e1[2] * e2[0] - e1[0] * e2[2], e1[0] * e2[1] - e1[1] * e2[0]], nl = Math.hypot(n[0], n[1], n[2]) || 1;
      const put = (p, q, along) => { P.push(p[0], p[1], p[2]); N.push(n[0] / nl, n[1] / nl, n[2] / nl); Q.push(q[0], q[1], along); S.push(s); };
      for (let j = 0; j < nRow; j++) {
        const r0 = row[j], r1 = row[j + 1];
        put(r0.a, r0.q, 0); put(r0.b, r0.q, 1); put(r1.b, r1.q, 1); put(r0.a, r0.q, 0); put(r1.b, r1.q, 1); put(r1.a, r1.q, 0);
      }
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3));
  g.setAttribute('aQ', new THREE.Float32BufferAttribute(Q, 3)); g.setAttribute('aSide', new THREE.Float32BufferAttribute(S, 1));
  return g;
}

// ---------------------------------------------------------------------------------------------- confetti, feathers, sparks
const CONF_VERT = /* glsl */`
attribute vec4 iP;         // home in the room (x, y, z) and the scrap's own number
attribute vec3 iC;         // its colour
uniform vec4 uBox;         // height of the air it falls through; 0; 0; size
varying vec3 vCol;
${ROOM_GLSL}
void main(){
  float sd = iP.w;
  vec3 c = iP.xyz;
  float fall = 0.6 + 0.7 * fract(sd * 7.7);
  c.y = mod(iP.y - uTime * fall, uBox.x);
  c.x += 0.5 * sin(uTime * 0.7 + sd * 40.) + 0.25 * sin(uTime * 1.9 + sd * 17.);
  c.z += 0.5 * cos(uTime * 0.6 + sd * 23.);
  float a = uTime * (3. + 4. * fract(sd * 3.3)) + sd * 50.;
  vec3 ax = normalize(vec3(sin(sd * 90.), 0.45, cos(sd * 90.)));
  vec3 u1 = normalize(cross(ax, vec3(0., 1., 0.)) + vec3(1e-4, 0., 0.)), u2 = cross(ax, u1);
  vec3 e2 = u1 * cos(a) + u2 * sin(a);
  float edge = smoothstep(0., 0.5, c.y) * smoothstep(uBox.x, uBox.x - 1.5, c.y);
  vec3 cw = (modelMatrix * vec4(c, 1.)).xyz - cameraPosition;
  float nearK = smoothstep(1.2, 5.5, length(cw));
  vec2 sz = vec2(0.12, 0.08) * uBox.w * edge * nearK;
  vec3 p = c + ax * position.x * sz.x + e2 * position.y * sz.y;
  vec3 n = cross(ax, e2);
  vec4 wp = modelMatrix * vec4(p, 1.);
  vec3 v = normalize((cameraPosition - wp.xyz) * mat3(modelMatrix));
  if (dot(n, v) < 0.) n = -n;
  vec3 spec, beamL;
  vec3 L = roomLight(c, n, v, 0.5, spec, beamL);
  float lm = max(max(L.r, L.g), L.b) * 0.55 + dot(L, vec3(0.3, 0.5, 0.2)) * 0.45;
  vCol = iC * (mix(L, vec3(1., 0.93, 0.84) * lm, 0.6) * 0.9 + 0.14 * lm) + spec * 0.4;      // keyed whiter than the walls, so that its colours show
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;
const CONF_FRAG = /* glsl */`
varying vec3 vCol;
void main(){ gl_FragColor = vec4(vCol, 1.); }`;
const SPARK_VERT = /* glsl */`
attribute vec4 iP;         // the fire it rises from (x, y, z) and its own number
uniform float uTime;
varying vec2 vQ; varying float vA;
void main(){
  float sd = iP.w, g = fract(uTime * (0.22 + 0.3 * fract(sd * 9.1)) + sd * 13.);
  vec3 c = iP.xyz;
  c.y += g * (4.5 + 3. * fract(sd * 4.7));
  c.x += (sin(sd * 70. + uTime * 1.7) * 0.5 + (fract(sd * 21.3) - 0.5) * 2.2) * g;
  c.z += (cos(sd * 50. + uTime * 1.3) * 0.5 + (fract(sd * 33.7) - 0.5) * 2.2) * g;
  vA = (1. - g) * (1. - g) * smoothstep(0., 0.05, g) * (0.5 + 0.5 * sin(uTime * 17. + sd * 90.));
  vQ = position.xy;
  vec4 mv = viewMatrix * modelMatrix * vec4(c, 1.);
  mv.xy += position.xy * (0.05 + 0.07 * fract(sd * 3.9));
  gl_Position = projectionMatrix * mv;
}`;
const SPARK_FRAG = /* glsl */`
varying vec2 vQ; varying float vA;
void main(){ float d = dot(vQ, vQ); gl_FragColor = vec4(vec3(3.2, 1.3, 0.35) * vA * exp(-d * 2.5) * smoothstep(1., 0.6, d), 1.); }`;
const QUAD = new Float32Array([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, -1, 0, 1, 1, 0, -1, 1, 0]);


export default {
  id: 'seven-rooms-one-clock',
  name: 'Seven Rooms and One Clock',
  category: 'books',
  placeKind: 'interior',
  book: 'The Masque of the Red Death',
  author: 'Edgar Allan Poe, 1809 to 1849',
  media: ['interior'],
  weirdness: 0.55,
  async build(ctx) {
    const { rng } = ctx;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#020103');
    const vary = ctx.vary || {}, detail = ctx.quality ? ctx.quality.detail : 1;
    const density = vary.density ?? 1, wild = 0.75 + 0.5 * (vary.mood ?? 0.5), rare = !!vary.rare;
    const shared = { uTime: { value: 0 } };

    // Every seeded stream of the world, taken here, once, in this order. The first five fork from the visit's own stream;
    // the things that came after the first build have streams of their own, made from the seed and a name.
    const rv = rng.fork('plan'), rd = rng.fork('decor'), rm = rng.fork('masque'), rk = rng.fork('clock'), rc = rng.fork('confetti');
    const own = (name) => makeRng(hashSeed('seven-rooms-' + name + ':' + ctx.seed));
    const rph = own('fires'), rf = own('features'), rs = own('strewn'), rx = own('more-pairs'), rg = own('gutter');

    // ------------------------------------------------------------ the plan of the suite (seeded)
    const styles = rv.shuffle([0, 1, 2, 1, 0, 1]);
    for (let i = 1; i < 6; i++) if (styles[i] === styles[i - 1]) styles[i] = (styles[i] + 1) % 3;
    const firstTurn = rv.chance(0.5) ? 1 : -1;
    const rooms = [];
    for (let k = 0; k < 7; k++) {
      const last = k === 6, first = k === 0;
      const hw = last ? 23 : rv.range(13.6, 15.2), L = last ? 82 : first ? rv.range(54, 58) : rv.range(34, 39), style = last ? 1 : styles[k];
      const bays = last ? 5 : first ? 5 : 3;
      const wallH = last ? 30 : style === 2 ? rv.range(18.5, 20) : style === 0 ? rv.range(14.5, 16) : rv.range(11.5, 13);
      const crown = last ? 54 : style === 2 ? wallH : wallH + (style === 0 ? rv.range(9, 11) : rv.range(11, 13));
      const whw = last ? 4.3 : rv.range(2.7, 3.2), sill = last ? 4 : rv.range(2.4, 3.2);
      const wtop = last ? 40 : style === 1 ? wallH + (crown - wallH) * 0.5 : wallH - (style === 2 ? 5.6 : 1.2);
      const turnB = last ? 0 : (k % 2 ? -firstTurn : firstTurn) * (k === 5 ? rv.range(0.5, 0.6) : rv.range(0.6, 0.8));
      rooms.push({ k, hw, L, style, bays, wallH, crown, velvet: last, win: { z: -L / 2, hw: whw, sill, top: wtop }, doorA: first ? null : 0, doorB: last ? null : 0, turnA: 0, turnB, gA: 0, gB: 0,
        src: { back: last ? 11 : 9, y: last ? 38.4 : wtop + rv.range(2.5, 4.5), z: last ? 14.6 : 0 }, glassStyle: rv.int(0, 3), floorStyle: rv.int(0, 3), wallStyle: rv.int(0, 3), crowd: k === 5 ? 0.55 : last ? 0 : rv.range(0.85, 1.1) });
    }
    rooms[6].doorA = -Math.sign(rooms[5].turnB) * 3;                  // the last door stands off the axis of the black room, on the inside of the bend: as far as the room's first dozen metres can take back in an easy curve
    for (let k = 0; k < 6; k++) {
      const A = rooms[k], B = rooms[k + 1], th = Math.abs(A.turnB), inner = A.turnB > 0 ? -1 : 1;
      const eA = A.hw + WALL_T - inner * A.doorB, eB = B.hw + WALL_T - inner * B.doorA;
      const g = (Math.max(eA, eB) * Math.sin(th) + 1.4) / (1 + Math.cos(th));
      A.gB = g; B.gA = g; B.turnA = A.turnB;
    }
    // each room's place: origin at the middle of its entry wall, heading along its own -z
    const dirOf = (psi) => new THREE.Vector3(-Math.sin(psi), 0, -Math.cos(psi)), rightOf = (psi) => new THREE.Vector3(Math.cos(psi), 0, -Math.sin(psi));
    let psi = 0; const O = new THREE.Vector3(0, 0, 0);
    for (let k = 0; k < 7; k++) {
      const R = rooms[k];
      R.psi = psi; R.origin = O.clone();
      R.group = new THREE.Group(); R.group.position.copy(O); R.group.rotation.y = psi; R.group.updateMatrixWorld(true);
      R.inv = R.group.matrixWorld.clone().invert();
      R.toWorld = (x, y, z) => new THREE.Vector3(x, y, z).applyMatrix4(R.group.matrixWorld);
      scene.add(R.group);
      if (k < 6) {
        const J = O.clone().addScaledVector(dirOf(psi), R.L + R.gB).addScaledVector(rightOf(psi), R.doorB);
        R.joint = J;
        psi += R.turnB;
        O.copy(J).addScaledVector(dirOf(psi), rooms[k + 1].gA).addScaledVector(rightOf(psi), -rooms[k + 1].doorA);
      }
    }

    // ------------------------------------------------------------ the flight
    const passes = rv.shuffle([{ x: [-2.2, 2.6, -1], y: [4.6, 4.4, 4.7] }, { x: [1.5, 0, -1.5], y: [6.2, 10.5, 6.4] }, { x: [2.5, 5.2, 1.5], y: [5, 6.6, 5] }, { x: [-1.5, 0.5, 1.5], y: [5.6, 9.2, 6] }, { x: [-2.5, -5.2, -1.5], y: [4.8, 6.2, 4.9] }]);
    const C7 = rooms[6], zClock = -C7.L + 6.2, zPortal = zClock - 0.8, yPortal = CLOCK.doorSill + 5.8, GLIDE = 4.5 * Math.PI / 180, RUN = 60;
    // The passages: the flight goes through the middle of each doorway and round the bend on its outer half (the side of the
    // brazier), at a height and an offset that change from one passage to the next.
    const passY = (k) => [4.7, 6.3, 7.9][k % 3], passOut = (k) => [0.5, 1.4][k % 2];
    const through = (k) => {
      const A = rooms[k], B = rooms[k + 1], so = A.turnB > 0 ? 1 : -1, y = passY(k), off = so * passOut(k);
      return [A.toWorld(A.doorB + off * 0.5, y, -A.L + 0.5), A.toWorld(A.doorB + off, y, -A.L - A.gB), B.toWorld(B.doorA + off * 0.5, y, -0.5)];
    };
    const pts = [];
    {
      const R = rooms[0];
      pts.push(R.toWorld(0, 4.7, -(R.L / R.bays + 4.5)), R.toWorld(-0.6, 4.8, -R.L * 0.42), R.toWorld(-1.8, 5.4, -R.L * 0.62), R.toWorld(0.8, 5.0, -R.L * 0.82), ...through(0));
    }
    for (let k = 1; k < 6; k++) {
      const R = rooms[k], p = passes[k - 1];
      R.passX = p.x[1];
      pts.push(R.toWorld(p.x[0], p.y[0], -R.L * 0.2), R.toWorld(p.x[1], p.y[1], -R.L * 0.5), R.toWorld(p.x[2], p.y[2], -R.L * 0.8), ...through(k));
    }
    {
      // The black room: in by the door 3 m off its axis and up in one easy curve to the head of the glide; from there the last
      // RUN metres are one straight line in space, down at GLIDE to the middle of the clock's open door. GLIDE is what the
      // room allows: the flight comes through the last door 7.9 m up and has the room's first dozen metres to climb in, which
      // puts the head of the line 11 m up, far under the middle of the dial. The line is begun four metres early so that the
      // curve has settled onto it by the time the RUN begins.
      for (const d of [RUN + 4, RUN, RUN * 0.8, RUN * 0.6, RUN * 0.4, RUN * 0.2, 0]) pts.push(C7.toWorld(0, yPortal + d * Math.sin(GLIDE), zPortal + d * Math.cos(GLIDE)));
    }
    const path = makePath(pts);
    const uOf = (v) => path.nearestXZ(v.x, v.z).u;
    for (let k = 0; k < 6; k++) rooms[k].uOut = uOf(rooms[k].joint);
    rooms[6].uOut = 1;
    // The film's beats are places on the flown route, in metres from its start (the route is flown at an even pace):
    //   mStop0  the door out of the white room: the first stroke, the hands reach the hour, the dancers begin to stop;
    //   mStop1  the bend of the passage behind that door: every dancer stands;
    //   mGo0    the middle of the violet room, under its windows: the echo has died and the company stirs;
    //   mGo1    the black door at the violet room's far end: they dance again, behind us; from here to the portal the clock
    //           holds the eye (see the gaze below).
    const LEN = path.length, SEC = DURATION / LEN, mAt = (R, x, z) => uOf(R.toWorld(x, 0, z)) * LEN;
    const mStop0 = mAt(rooms[4], rooms[4].doorB, -rooms[4].L), mStop1 = rooms[4].uOut * LEN;
    const mGo0 = mAt(rooms[5], rooms[5].passX, -rooms[5].L / 2), mGo1 = mAt(rooms[5], rooms[5].doorB, -rooms[5].L);
    rooms.forEach((R, i) => { R.mIn = i ? rooms[i - 1].uOut * LEN : 0; R.mOut = R.uOut * LEN; });

    // ------------------------------------------------------------ colours and uniforms of the rooms
    for (const R of rooms) {
      R.phase = [rph.range(0, TAU), rph.range(0, TAU), rph.range(0, 40)];
      // the light of each room: the palette's colour at full strength; purple is pushed to the red side and violet to the blue so that the two never read as one,
      // and the white is the cool white of moonlight on frost
      const c0 = lin(SUITE[R.k].hex), mx = Math.max(c0[0], c0[1], c0[2]);
      const base = R.k === 1 ? [0.62, 0.035, 1] : R.k === 5 ? [0.34, 0.27, 1] : R.k === 4 ? [0.93, 0.96, 1] : R.k === 3 ? [1, 0.25, 0.01] : [c0[0] / mx, c0[1] / mx, c0[2] / mx];
      const luma = 0.2126 * base[0] + 0.7152 * base[1] + 0.0722 * base[2], kL = 1 / (0.4 + 0.6 * Math.sqrt(luma));
      R.base = base;
      R.kLum = Math.min(1, 1 / (0.4 + 1.6 * luma));                 // the luminous colours (green, white) need less to glow as much
      R.light = R.velvet ? [2.3, 0.07, 0.085] : mul(base, kL * (R.k === 1 ? 0.76 : R.k === 3 ? 0.8 : R.k === 5 ? 0.8 : R.k === 4 ? 0.8 : 1));
      const hueCloth = mix3(base, [1, 1, 1], 0.12);
      R.P = {
        stone: R.k === 4 ? [0.5, 0.52, 0.58] : STONE, rib: [0.6, 0.58, 0.54], floor: R.k === 4 ? [0.7, 0.7, 0.72] : [0.56, 0.55, 0.54], vault: [0.44, 0.44, 0.47], wood: [0.2, 0.11, 0.06],
        velvet: [0.085, 0.07, 0.075], carpet: [0.2, 0.15, 0.16], cloth: mul(hueCloth, 0.85), cloth2: mul(mix3(base, [1, 1, 1], 0.45), 0.9),
      };
      R.U = roomUniforms(shared, {
        color: R.light, glass: R.velvet ? [1.5, 0.04, 0.06] : mul(mix3(base, [luma, luma, luma], -0.15).map((v) => Math.max(v, 0)), 1.05 * R.kLum * (R.k === 1 ? 0.72 : 1)),
        hw: R.hw, L: R.L, wallH: R.wallH, crown: R.crown, winZ: R.win.z, sill: R.win.sill, winHw: R.win.hw, winTop: R.win.top,
        srcBack: R.src.back, srcY: R.src.y, srcZ: R.src.z, glassStyle: R.glassStyle, beam: R.velvet ? 4.2 : R.k === 4 ? 3.0 : 4.0, bounce: R.velvet ? 0.2 : 0.14, soft: R.velvet ? 2.7 : 1.8,
        haze: R.velvet ? 0.0018 : R.k === 4 ? 0.003 : 0.0048, hazeGain: R.velvet ? 0.05 : R.k === 4 ? 0.1 : R.k === 5 ? 0.18 : 0.24, floorStyle: R.floorStyle, wallStyle: R.wallStyle, vaultStyle: R.style === 2 ? 1 : 0, velvet: R.velvet ? 1 : 0,
        doorAx: R.doorA ?? 0, doorBx: R.doorB ?? 0, doorHw: DOOR_HW, doorTop: DOOR_TOP, phase: R.phase,
      });
      R.mat = roomMaterial(R.U, { roomInv: R.inv });
      R.level = [1, 1];
    }
    for (const R of rooms) {
      const A = rooms[R.k - 1], B = rooms[R.k + 1];
      if (A) R.U.uDoorA.value.set(A.light[0], A.light[1], A.light[2]);
      if (B) R.U.uDoorB.value.set(B.light[0], B.light[1], B.light[2]);
    }
    await ctx.yield();

    // ------------------------------------------------------------ shells, shafts
    for (const R of rooms) {
      const b = makeBatch(1 << 15);
      for (const part of [shellInto(b, R, R.P), roofInto(b, R, R.P)]) {       // each is built in pieces, the page breathing between them
        while (!part.next().done) await ctx.yield();
        await ctx.yield();
      }
      R.batch = b;
      const sm = new THREE.ShaderMaterial({ uniforms: { ...R.U, uShaft: { value: R.velvet ? 0.024 : 0.04 * R.kLum } }, vertexShader: SHAFT_VERT, fragmentShader: SHAFT_FRAG, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide });
      R.shafts = new THREE.Mesh(shaftGeometry(R, R.src), sm); R.shafts.frustumCulled = false; R.shafts.renderOrder = 2;
      R.group.add(R.shafts);
    }

    // the corridor fires light both halves of their passage
    const fires = [];
    for (let k = 1; k < 7; k++) {
      const R = rooms[k], A = rooms[k - 1]; if (!R.fire) continue;
      const w = R.toWorld(R.fire[0], R.fire[1], R.fire[2]), la = w.clone().applyMatrix4(A.inv);
      R.U.uNicheA.value.set(R.fire[0], R.fire[1], R.fire[2], 2.4); A.U.uNicheB.value.set(la.x, la.y, la.z, 2.4);
      fires.push(w);
    }

    // ------------------------------------------------------------ what stands and hangs in the rooms
    const M4 = new THREE.Matrix4();
    const at = (b, x, z, yaw, y = 0) => b.tr(M4.makeRotationY(yaw).setPosition(x, y, z));
    const goldK = (b) => b.col(GOLD).surf(K.GOLD, 0.8, 1, 0);
    const latheInto = (b, prof, seg = 10) => {
      const m = prof.length - 1;
      b.grid(seg, m, (u, v, o) => { const f = v * m, i = Math.min(m - 1, Math.floor(f)), t = f - i, r = lerp(prof[i][0], prof[i + 1][0], t), a = u * TAU; o[0] = Math.sin(a) * r; o[1] = lerp(prof[i][1], prof[i + 1][1], t); o[2] = Math.cos(a) * r; });
    };
    const plumes = (b, P, y, n, len) => {
      b.col(P.cloth2).surf(K.PLAIN, 0.1, 0, 0);
      for (let i = 0; i < n; i++) {
        const a = i / n * TAU, dx = Math.sin(a), dz = Math.cos(a);
        b.grid(1, 3, (u, v, o) => { const w = (u - 0.5) * 0.3 * (1 - 0.6 * v), r = 0.15 + 0.75 * v * v * len * 0.5; o[0] = dx * r - dz * w; o[1] = y + len * v * (1 - 0.3 * v); o[2] = dz * r + dx * w; }, false, (u, v) => 0.12 * v);
      }
    };
    const chair = (b, P) => {
      goldK(b); for (const [x, z] of [[-0.55, -0.5], [0.55, -0.5], [-0.55, 0.5], [0.55, 0.5]]) b.rod([x, 0, z], [x, 1, z], 0.07, 0.1, 4);
      b.tube([[-0.6, 1.1, -0.55], [-0.64, 2.3, -0.62], [0, 2.95, -0.66], [0.64, 2.3, -0.62], [0.6, 1.1, -0.55]], 0.075, 4);
      b.col(P.cloth).surf(K.TAPESTRY, 0.15, 0, 0); b.box(0, 1.1, 0, 1.35, 0.3, 1.25);
      b.quad([-0.5, 1.3, -0.6], [0.5, 1.3, -0.6], [0.5, 2.45, -0.64], [-0.5, 2.45, -0.64]);
    };
    const consoleTable = (b, P) => {
      b.col(P.wood).surf(K.WOOD, 0.7, 0, 0); b.box(0, 1.86, 0, 3.5, 0.2, 1.3);
      goldK(b); b.box(0, 1.72, 0, 3.6, 0.1, 1.4);
      for (const [x, z] of [[-1.55, -0.5], [1.55, -0.5], [-1.55, 0.5], [1.55, 0.5]]) { b.rod([x * 1.05, 0, z], [x * 0.9, 0.9, z], 0.07, 0.11, 4); b.rod([x * 0.9, 0.9, z], [x, 1.7, z], 0.11, 0.15, 4); }
      latheInto(b, [[0.1, 1.96], [0.34, 2.0], [0.2, 2.25], [0.56, 2.75], [0.62, 3.15], [0.34, 3.55], [0.44, 3.75]]);
      plumes(b, P, 3.7, 6, 2.2);
    };
    const screen = (b, P) => {
      for (let i = 0; i < 4; i++) {
        const x0 = -2.8 + i * 1.4, x1 = x0 + 1.4, z0 = i % 2 ? 0.45 : 0, z1 = i % 2 ? 0 : 0.45;
        b.col(P.cloth).surf(K.TAPESTRY, 0.15, 0, 0); b.quad([x0, 0.25, z0], [x1, 0.25, z1], [x1, 4.5, z1], [x0, 4.5, z0]);
        goldK(b); b.rod([x0, 0, z0], [x0, 4.75, z0], 0.07, 0.07, 4); b.rod([x0, 4.55, z0], [x1, 4.55, z1], 0.06, 0.06, 4);
        if (i === 3) b.rod([x1, 0, z1], [x1, 4.75, z1], 0.07, 0.07, 4);
      }
    };
    const settee = (b, P) => {
      goldK(b); for (const x of [-1.8, 0, 1.8]) for (const z of [-0.5, 0.5]) b.rod([x, 0, z], [x, 1, z], 0.07, 0.1, 4);
      b.tube([[-1.9, 1.1, -0.6], [-1.95, 2.2, -0.66], [0, 2.7, -0.7], [1.95, 2.2, -0.66], [1.9, 1.1, -0.6]], 0.08, 4);
      b.col(P.cloth).surf(K.TAPESTRY, 0.15, 0, 0); b.box(0, 1.1, 0, 3.9, 0.32, 1.3);
      b.quad([-1.8, 1.3, -0.62], [1.8, 1.3, -0.62], [1.8, 2.3, -0.68], [-1.8, 2.3, -0.68]);
    };
    const urn = (b, P) => {
      b.col(P.stone, 1.1).surf(K.STONE, 0.2, 0, 0); b.box(0, 1.1, 0, 1.4, 2.2, 1.4);
      goldK(b); b.box(0, 2.25, 0, 1.6, 0.14, 1.6);
      latheInto(b, [[0.2, 2.3], [0.5, 2.4], [0.28, 2.8], [0.8, 3.5], [0.85, 4.1], [0.45, 4.6], [0.6, 4.85]]);
      plumes(b, P, 4.8, 7, 3.2);
    };
    const decorInto = function* (b, R, rr) {
      const P = R.P, { hw, L } = R, hb = L / R.bays / 2, rise = R.crown - R.wallH;
      for (const s of [-1, 1]) for (let j = 0; j < R.bays; j++) {
        yield;
        const z0 = -j * 2 * hb, z1 = z0 - 2 * hb, hasWin = R.win.z < z0 && R.win.z > z1;
        // hangings: a tapestry in every bay (two narrow ones beside the window), or velvet in heavy folds
        const spans = hasWin ? [[z0 - 1.5, R.win.z + R.win.hw + 1.3], [R.win.z - R.win.hw - 1.3, z1 + 1.5]] : [[z0 - 1.6, z1 + 1.6]];
        for (const [za, zb] of spans) {
          if (za - zb < 1.6) continue;
          if (R.velvet) {
            b.col(P.velvet, 1.25).surf(K.VELVET, 0.1, 0, 0.05);
            const nf = Math.round((za - zb) / 2.4), yt = R.wallH * 0.86;
            b.grid(nf * 6, 5, (u, v, o) => { const fo = Math.cos(u * nf * TAU) * (0.25 + 0.5 * v) + 0.3 * Math.cos(u * nf * TAU * 0.5 + 1); o[0] = s * (hw - 1.3 - fo); o[1] = yt * (1 - v) + 0.02; o[2] = lerp(za, zb, u); }, s > 0, (u, v) => 0.07 * v);
            goldK(b); b.rod([s * (hw - 0.9), yt + 0.1, za + 0.3], [s * (hw - 0.9), yt + 0.1, zb - 0.3], 0.14, 0.14, 5);
          } else {
            const y1 = Math.min(R.wallH - 1.6, 11), y0 = 2.5;
            b.col(P.cloth).surf(K.TAPESTRY, 0.1, 0, 0);
            b.grid(4, 3, (u, v, o) => { o[0] = s * (hw - 0.4 - 0.12 * Math.sin(u * 9) * v); o[1] = lerp(y1, y0, v); o[2] = lerp(za, zb, u); }, s > 0, (u, v) => 0.1 * v);
            goldK(b); b.rod([s * (hw - 0.45), y1 + 0.12, za + 0.2], [s * (hw - 0.45), y1 + 0.12, zb - 0.2], 0.1, 0.1, 5);
            b.rod([s * (hw - 0.5), y0 - 0.05, za], [s * (hw - 0.5), y0 - 0.05, zb], 0.06, 0.06, 4);
          }
        }
        if (R.velvet) continue;
        // gilded furniture pushed to the wall
        const kind = rr.pick(['chairs', 'console', 'screen', 'settee', 'chairs', 'urns']), yaw = -s * Math.PI / 2, x = s * (hw - 1.9);
        const free = (z) => Math.abs(z - R.win.z) > R.win.hw + 1.6;
        const zc = (z0 + z1) / 2;
        if (kind === 'chairs') { for (let z = z0 - 2.4; z > z1 + 2.2; z -= 2.3) if (free(z)) { at(b, x, z, yaw + rr.range(-0.15, 0.15)); chair(b, P); } }
        else if (kind === 'console') { const z = hasWin ? z0 - 3.6 : zc; at(b, x, z, yaw); consoleTable(b, P); for (const dz of [-3.3, 3.3]) if (free(z + dz) && z + dz < z0 - 1.5 && z + dz > z1 + 1.5) { at(b, x, z + dz, yaw); chair(b, P); } }
        else if (kind === 'screen') { const z = hasWin ? z1 + 4.2 : zc; at(b, s * (hw - 1.6), z, yaw); screen(b, P); }
        else if (kind === 'settee') { const z = hasWin ? z0 - 3.8 : zc; at(b, x, z, yaw); settee(b, P); }
        else for (const z of [z0 - 2.6, z1 + 2.6]) { at(b, s * (hw - 2.1), z, yaw); urn(b, P); }
        b.tr(null);
      }
      if (R.velvet) return;
      yield;
      // tall hangings either side of each doorway, a gilt rose over it
      for (const [z, dx, dir] of [[0, R.doorA, 1], [-L, R.doorB, -1]]) {
        if (dx === null) continue;
        const zz = z - dir * 0.4;
        for (const sx of [-1, 1]) {
          const xa = dx + sx * (DOOR_HW * 1.2 + 1.5), xb = sx * (hw - 2.6); if ((xb - xa) * sx < 2) continue;
          const y1 = Math.min(ceilAt(R, xb, z + dir * -0.01) - 1.2, 12.5);
          b.col(P.cloth2).surf(K.TAPESTRY, 0.1, 0, 0);
          b.grid(4, 3, (u, v, o) => { o[0] = lerp(xa, xb, u); o[1] = lerp(y1, 2.4, v); o[2] = zz - dir * 0.1 * Math.sin(u * 9) * v; }, false, (u, v) => 0.1 * v);
          goldK(b); b.rod([xa - sx * 0.2, y1 + 0.12, zz], [xb + sx * 0.2, y1 + 0.12, zz], 0.1, 0.1, 5);
        }
        if (!(R.k === 0 && dir < 0) && ceilAt(R, dx, z + dir * -0.01) > DOOR_TOP + 6.2) {
          const ry = DOOR_TOP + 3.3; goldK(b);
          b.geo(new THREE.TorusGeometry(2.0, 0.17, 5, 20), { p: [dx, ry, zz] });
          for (let q = 0; q < 4; q++) b.geo(new THREE.TorusGeometry(0.85, 0.12, 4, 12), { p: [dx + Math.cos(q * Math.PI / 2) * 0.85, ry + Math.sin(q * Math.PI / 2) * 0.85, zz] });
          b.col(P.cloth).surf(K.TAPESTRY, 0.1, 0, 0); b.geo(new THREE.CircleGeometry(1.95, 20), { p: [dx, ry, zz + dir * 0.08], r: [0, dir > 0 ? Math.PI : 0, 0] });
        }
      }
      // curtains at the far doorway of some rooms: parted wide and tied back, so that they frame the next room
      if (R.curtain && R.doorB !== null) {
        const dx = R.doorB, yt = DOOR_TOP + 1.1, zz = -L + 0.7, yTie = 6.2, vT = (yt - yTie) / (yt - 0.15), xo = DOOR_HW + 3.1;
        const inner = (v) => (v < vT ? lerp(2.4, DOOR_HW + 1.0, Math.sin(v / vT * Math.PI / 2)) : lerp(DOOR_HW + 1.0, DOOR_HW + 0.7, (v - vT) / (1 - vT)));
        const outer = (v) => xo - Math.exp(-(((v - vT) / 0.13) ** 2));
        for (const sx of [-1, 1]) {
          b.col(P.cloth, 0.8).surf(K.VELVET, 0.1, 0, 0);
          b.grid(32, 10, (u, v, o) => {
            const gather = Math.exp(-(((v - vT) / 0.16) ** 2));
            o[0] = dx + sx * lerp(inner(v), outer(v), u); o[1] = yt - v * (yt - 0.15);
            o[2] = zz + 0.24 * Math.cos(u * 30) * (0.45 + 0.55 * Math.min(1, v / vT)) * (1 - 0.6 * gather) + 0.25 * gather;
          }, sx > 0, (u, v) => 0.14 * v * (1 - 0.5 * u));
          goldK(b);
          b.grid(1, 10, (u, v, o) => { o[0] = dx + sx * (inner(v) - 0.06 - 0.2 * u); o[1] = yt - v * (yt - 0.15); o[2] = zz + 0.32; }, sx > 0, (u, v) => 0.14 * v);
          b.box(dx + sx * (DOOR_HW + 1.55), yTie, zz + 0.3, 1.5, 0.3, 0.6);
          b.rod([dx + sx * (xo + 0.1), yTie, zz - 0.5], [dx + sx * (DOOR_HW + 2.3), yTie, zz + 0.3], 0.07, 0.07, 4);
        }
        goldK(b); b.rod([dx - xo - 0.5, yt + 0.1, zz], [dx + xo + 0.5, yt + 0.1, zz], 0.13, 0.13, 5);
        for (const sx of [-1, 1]) b.geo(new THREE.SphereGeometry(0.3, 6, 5), { p: [dx + sx * (xo + 0.6), yt + 0.1, zz] });
      }
      yield;
      // banners hung from the vault where the bays meet
      for (let j = 1; j < R.bays; j++) for (const s of [-1, 1]) {
        const z = -j * 2 * hb + 0.9, x = s * hw * 0.46, yt = (R.style === 2 ? R.wallH - 1.2 : R.wallH + rise * phi(0.46) - 1.1), len = R.style === 2 ? 5.2 : 7.4, w = 1.3;
        b.col(j % 2 ? P.cloth : P.cloth2).surf(K.TAPESTRY, 0.1, 0, 0);
        b.grid(2, 5, (u, v, o) => { o[0] = x + (u - 0.5) * 2 * w; o[1] = yt - len * v * (1 - 0.16 * (1 - Math.abs(u - 0.5) * 2) * (v > 0.99 ? 1 : 0)); o[2] = z + 0.25 * Math.sin(v * 2.4); }, false, (u, v) => 0.32 * v * v);
        goldK(b); b.rod([x - w - 0.2, yt, z], [x + w + 0.2, yt, z], 0.09, 0.09, 4);
      }
      // a runner down the middle in some rooms
      if (R.runner) {
        const w = 3.3;
        b.col(P.cloth, 0.75).surf(K.CARPET, 0.05, 0, 0); b.quad([-w, 0.03, -2], [w, 0.03, -2], [w, 0.03, -L + 2], [-w, 0.03, -L + 2]);
        goldK(b); for (const sx of [-1, 1]) b.quad([sx * w - 0.14, 0.045, -2], [sx * w + 0.14, 0.045, -2], [sx * w + 0.14, 0.045, -L + 2], [sx * w - 0.14, 0.045, -L + 2]);
      }
      // ribbons dropped in the dance, lying in loops on the floor and stirring as the skirts pass
      for (let i = 0, n = 2 + Math.round(3 * density); i < n; i++) {
        const x0 = rr.range(-hw + 4.5, hw - 4.5), z0 = rr.range(-L + 6, -6), a0 = rr.range(0, TAU), len = rr.range(3.5, 6.5), wig = rr.range(2.2, 4.2), ph = rr.range(0, TAU);
        const ca = Math.cos(a0), sa = Math.sin(a0);
        b.col(i % 2 ? [1, 0.72, 0.3] : P.cloth2).surf(K.PLAIN, 0.55, 0, 0);
        b.grid(1, 26, (u, v, o) => {
          const along = (v - 0.5) * len, off = 0.75 * Math.sin(v * wig * 2.2 + ph) + (u - 0.5) * 0.3;
          o[0] = x0 + ca * along - sa * off; o[1] = 0.05 + 0.16 * Math.abs(Math.sin(v * wig * 3.1 + ph)); o[2] = z0 + sa * along + ca * off;
        }, true, (u, v) => 0.05);
      }
      yield;
      // the first room: a gallery of musicians over the far doorway
      if (R.k === 0) {
        const gy = 13.7, gz = -L + 3.1, gw = 9.2;
        b.col(P.wood).surf(K.WOOD, 0.6, 0, 0); b.box(0, gy - 0.25, -L + 1.55, gw * 2, 0.5, 3.1);
        goldK(b); b.box(0, gy - 0.55, gz, gw * 2 + 0.2, 0.18, 0.2); b.rod([-gw, gy + 1.7, gz], [gw, gy + 1.7, gz], 0.1, 0.1, 5);
        for (let x = -gw; x <= gw + 0.01; x += 0.92) { b.rod([x, gy, gz], [x, gy + 1.7, gz], 0.06, 0.09, 4); }
        for (let i = 0; i < 6; i++) b.geo(new THREE.ConeGeometry(0.7, 1.7, 4), { p: [-gw + 1 + i * (gw * 2 - 2) / 5, gy - 1.35, -L + 0.9], r: [Math.PI, Math.PI / 4, 0] });
        for (let i = 0; i < 7; i++) {
          const x = -7.5 + i * 2.5, big = i === 3;
          b.col(i % 2 ? [0.06, 0.05, 0.06] : P.cloth2).surf(K.PLAIN, 0.2, 0, 0);
          at(b, x, -L + 1.6, 0, gy);
          latheInto(b, [[0.75, 0], [0.6, 1.1], [0.42, 1.9], [0.46, 2.4], [0.2, 2.75]], 8);
          b.col([0.04, 0.04, 0.05]).surf(K.PLAIN, 0.2, 0, 0); b.geo(new THREE.SphereGeometry(1, 8, 6), { p: [0, 3.05, 0], s: [0.26, 0.31, 0.27] });
          b.col([0.9, 0.86, 0.78]).surf(K.PLAIN, 0.7, 0, 0); b.geo(new THREE.SphereGeometry(1, 8, 6, 0, Math.PI), { p: [0, 3.04, 0.06], s: [0.25, 0.3, 0.25] });
          b.col(R.P.wood, 1.6).surf(K.WOOD, 0.8, 0, 0);
          if (big) { b.box(0.75, 1.5, 0.55, 0.9, 2.3, 0.4, [0.1, 0, -0.1]); b.rod([0.8, 2.6, 0.5], [0.95, 3.9, 0.45], 0.07, 0.05, 4); }
          else { b.box(-0.35, 2.3, 0.5, 0.42, 0.95, 0.2, [0.3, 0, 0.9]); b.rod([-0.6, 2.5, 0.5], [-1.15, 2.85, 0.55], 0.05, 0.04, 4); }
          b.col(GOLD).surf(K.GOLD, 0.9, 1, 0.3 + 0.1 * (i % 3));
          if (big) b.quad([-0.55, 1.75, 0.84], [1.35, 1.98, 0.84], [1.35, 2.06, 0.84], [-0.55, 1.83, 0.84]);
          else b.quad([-1.05, 2.9, 0.5], [0.45, 2.36, 0.9], [0.45, 2.44, 0.9], [-1.05, 2.98, 0.5]);
          b.tr(null);
        }
      }
    };
    // One thing in each room that the others lack. The blue room has its gallery of musicians; the purple a fountain running
    // with wine, the green the banquet table, the orange the chair of state under its canopy, the white a great armillary
    // sphere, the violet a great hourglass. Each stands in the middle of the room's length on the side the flight leaves free
    // (the chair of state on its dais beside the far door).
    const E3 = new THREE.Euler(), V3 = new THREE.Vector3();
    const featureInto = function* (b, R) {
      const F = R.feature, P = R.P; if (!F) return;
      const put = (ox = 0, oz = 0) => at(b, F.x + ox, F.z + oz, 0);
      put();
      if (R.k === 1) {
        goldK(b);
        latheInto(b, [[3.3, 0], [3.4, 1.15], [3.05, 1.25], [2.95, 0.7], [0.75, 0.55], [0.5, 2.7], [2.05, 3.55], [2.15, 3.85], [1.85, 3.9], [0.5, 3.3], [0.38, 5.2], [1.15, 5.8], [1.2, 6.05], [0.95, 6.1], [0.3, 5.7], [0.22, 6.9], [0.42, 7.2], [0, 7.7]], 16);
        b.col([0.55, 0.03, 0.16]).surf(K.PLAIN, 0.92, 0, 0.02);
        for (const [r, y] of [[3.0, 1.05], [1.9, 3.75], [1.0, 5.95]]) b.geo(new THREE.CircleGeometry(r, 20), { p: [0, y, 0], r: [-Math.PI / 2, 0, 0] });
        yield;
        for (const [r0, y0, r1, y1, n] of [[1.15, 6.0, 1.75, 3.8, 8], [2.1, 3.8, 2.75, 1.1, 12]]) for (let i = 0; i < n; i++) {
          const a = i / n * TAU, c = Math.cos(a), sn = Math.sin(a), rm = r0 + (r1 - r0) * 0.55;
          b.tube([[c * r0, y0, sn * r0], [c * rm, y0 + 0.12, sn * rm], [c * r1, lerp(y0, y1, 0.55), sn * r1], [c * (r1 + 0.1), y1, sn * (r1 + 0.1)]], 0.07, 4);
        }
      } else if (R.k === 2) {
        b.col([0.92, 0.9, 0.84]).surf(K.PLAIN, 0.15, 0, 0); b.box(0, 1.05, 0, 3.2, 2.1, 9);
        b.col(P.cloth).surf(K.TAPESTRY, 0.15, 0, 0); b.box(0, 2.13, 0, 1.5, 0.06, 9.3);
        goldK(b);
        latheInto(b, [[0.7, 2.16], [0.3, 2.3], [0.22, 3.0], [1.2, 3.35], [1.25, 3.5]], 10);
        for (const z of [-3.6, -1.9, 1.9, 3.6]) b.geo(new THREE.CylinderGeometry(0.72, 0.72, 0.07, 12), { p: [0, 2.2, z] });
        yield;
        const fruit = [[1, 0.5, 0.1], [0.75, 0.1, 0.14], [1, 0.8, 0.3]];
        let q = 0;
        for (const [n, y] of [[3, 3.78], [2, 4.28], [1, 4.78]]) for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
          b.col(fruit[q++ % 3]).surf(K.PLAIN, 0.5, 0, 0);
          b.geo(new THREE.SphereGeometry(0.33, 7, 5), { p: [(i - (n - 1) / 2) * 0.6, y, (j - (n - 1) / 2) * 0.6] });
        }
        b.col([0.85, 0.87, 0.92]).surf(K.PLAIN, 0.8, 0, 0);
        for (const z of [-3.6, -1.9, 1.9, 3.6]) b.geo(new THREE.SphereGeometry(0.55, 9, 5, 0, TAU, 0, Math.PI / 2), { p: [0, 2.24, z] });
        yield;
        for (let z = -3.9; z <= 3.91; z += 1.3) for (const sx of [-1, 1]) { put(sx * 1.15, z); goldK(b); latheInto(b, [[0.22, 2.16], [0.06, 2.22], [0.05, 2.6], [0.24, 2.76], [0.27, 3.1]], 6); }
        for (const z of [-2.8, 2.8]) { put(0, z); goldK(b); latheInto(b, [[0.3, 2.16], [0.46, 2.5], [0.2, 3.1], [0.12, 3.5], [0.26, 3.72]], 8); }
      } else if (R.k === 3) {
        b.col(P.cloth, 0.75).surf(K.CARPET, 0.05, 0, 0); b.box(0, 0.3, 0.3, 6.4, 0.6, 5); b.box(0, 0.85, 0, 5.2, 0.5, 3.8);
        goldK(b);
        for (const sx of [-1, 1]) for (const sz of [-1, 1]) { b.rod([sx * 2.4, 1.1, sz * 1.6], [sx * 2.4, 9.2, sz * 1.6], 0.16, 0.13, 6); b.geo(new THREE.SphereGeometry(0.32, 7, 5), { p: [sx * 2.4, 9.95, sz * 1.6] }); }
        b.box(0, 9.38, 0, 5.4, 0.36, 3.8);
        b.geo(new THREE.ConeGeometry(1.1, 1.6, 8), { p: [0, 10.35, 0] }); b.geo(new THREE.SphereGeometry(0.4, 8, 6), { p: [0, 11.4, 0] });
        b.col(P.cloth, 0.8).surf(K.VELVET, 0.1, 0, 0);
        b.grid(16, 4, (u, v, o) => { o[0] = (u - 0.5) * 5.0; o[1] = 9.2 - v * 8.1; o[2] = -1.7 + 0.14 * Math.cos(u * 26); }, false, (u, v) => 0.05 * v);
        b.col(P.cloth2).surf(K.TAPESTRY, 0.1, 0, 0);
        b.grid(10, 1, (u, v, o) => { o[0] = (u - 0.5) * 5.4; o[1] = 9.2 - v * (0.8 + 0.5 * Math.abs(Math.sin(u * 10 * Math.PI / 2))); o[2] = 1.92; }, false, (u, v) => 0.06 * v);
        yield;
        goldK(b); b.box(0, 1.75, -0.4, 2.1, 0.3, 1.8);
        for (const sx of [-1, 1]) {
          for (const sz of [-1.15, 0.35]) b.rod([sx * 0.92, 1.1, sz], [sx * 0.92, 1.75, sz], 0.1, 0.12, 5);
          b.box(sx * 1.0, 2.75, -0.35, 0.22, 0.22, 1.7); b.rod([sx * 1.0, 1.9, 0.4], [sx * 1.0, 2.75, 0.4], 0.09, 0.09, 5);
          b.geo(new THREE.SphereGeometry(0.2, 6, 5), { p: [sx * 1.0, 2.85, 0.52] });
        }
        b.tube([[-1.0, 1.9, -1.2], [-1.05, 5.2, -1.25], [0, 6.7, -1.25], [1.05, 5.2, -1.25], [1.0, 1.9, -1.2]], 0.14, 5);
        b.geo(new THREE.SphereGeometry(0.3, 7, 5), { p: [0, 7.0, -1.25] });
        b.col(P.cloth).surf(K.TAPESTRY, 0.15, 0, 0); b.box(0, 1.98, -0.35, 1.8, 0.25, 1.6);
        b.quad([-0.92, 2.0, -1.18], [0.92, 2.0, -1.18], [0.92, 5.3, -1.2], [-0.92, 5.3, -1.2]); b.tri([-0.92, 5.3, -1.2], [0.92, 5.3, -1.2], [0, 6.45, -1.2]);
      } else if (R.k === 4) {
        goldK(b);
        latheInto(b, [[1.9, 0], [2.0, 0.5], [1.2, 0.7], [0.5, 1.4], [0.35, 3.0], [0.7, 3.3], [0.3, 3.6]], 10);
        const cy = 6.6, rr = 3.0;
        for (const [rx, rz, r] of [[Math.PI / 2, 0, rr], [0, 0, rr], [0.41, 0, rr * 0.97], [Math.PI / 2 - 0.41, 0.5, rr * 0.9], [1.1, 1.3, rr * 0.82]]) b.geo(new THREE.TorusGeometry(r, 0.11, 5, 36), { p: [0, cy, 0], r: [rx, 0, rz] });
        b.rod([-1.35, cy - 3.2, 0], [1.35, cy + 3.2, 0], 0.07, 0.07, 5);
        b.col([0.82, 0.86, 0.95]).surf(K.PLAIN, 0.85, 0, 0); b.geo(new THREE.SphereGeometry(0.9, 14, 10), { p: [0, cy, 0] });
      } else if (R.k === 5) {
        goldK(b);
        for (const y of [0.3, 8.6]) b.geo(new THREE.CylinderGeometry(2.2, 2.2, 0.6, 16), { p: [0, y, 0] });
        for (let i = 0; i < 4; i++) { const a = i / 4 * TAU + 0.6, c = Math.cos(a) * 1.9, sn = Math.sin(a) * 1.9; b.rod([c, 0.6, sn], [c, 8.3, sn], 0.14, 0.14, 6); b.geo(new THREE.SphereGeometry(0.3, 7, 5), { p: [c, 4.45, sn] }); }
        b.geo(new THREE.TorusGeometry(0.3, 0.09, 5, 12), { p: [0, 4.45, 0], r: [Math.PI / 2, 0, 0] });
        yield;
        b.col([0.62, 0.68, 0.8]).surf(K.PLAIN, 0.95, 0, 0);
        latheInto(b, [[1.2, 0.62], [1.55, 1.4], [1.45, 2.7], [0.2, 4.35], [0.2, 4.55], [1.45, 6.2], [1.55, 7.5], [1.2, 8.28]], 16);
      }
      b.tr(null);
    };
    // What the masquers let fall when they fled the black room: masks, fans, cups, a chair thrown over. Nobody is here.
    // Each lies a few metres to one side of the line of the flight, the whole length of the carpet.
    const strewnInto = function* (b, R, rr) {
      const n = Math.round(16 * density), P = R.P;
      for (let i = 0; i < n; i++) {
        const z = -lerp(5, R.L - 14, (i + rr.range(0.1, 0.9)) / n), sd = i % 2 ? 1 : -1;
        const x = sd * rr.range(2.6, 8.5) + (R.doorA ?? 0) * Math.max(0, 1 + z / 18), yaw = rr.range(0, TAU), sc = rr.range(1.25, 1.7), tilt = rr.range(-0.2, 0.2), kind = i % 4;
        if (kind === 0) {
          b.tr(M4.makeRotationFromEuler(E3.set(-Math.PI / 2 + tilt, yaw, 0, 'YXZ')).scale(V3.set(sc, sc, sc)).setPosition(x, 0.04, z));
          b.col([0.92, 0.88, 0.8]).surf(K.PLAIN, 0.7, 0, 0); b.geo(new THREE.SphereGeometry(1, 10, 7, 0, Math.PI), { s: [0.42, 0.52, 0.24] });
          b.col([0.01, 0.01, 0.012]).surf(K.PLAIN, 0.1, 0, 0);
          for (const sx of [-1, 1]) b.geo(new THREE.SphereGeometry(1, 6, 4), { p: [sx * 0.17, 0.1, 0.225], s: [0.1, 0.055, 0.04] });
          goldK(b); b.geo(new THREE.TorusGeometry(0.47, 0.03, 4, 16), { s: [0.9, 1.1, 0.4] });
          b.col([1, 1, 1]).surf(K.PLAIN, 0.2, 0, 0);
          for (const sx of [-1, 1]) b.grid(1, 4, (u, v, o) => { o[0] = sx * (0.1 + 0.35 * v * v) + (u - 0.5) * 0.3 * (1 - 0.5 * v); o[1] = 0.48 + 1.25 * v; o[2] = 0.04 + 0.1 * Math.sin(v * 3); }, false, (u, v) => 0.04 * v);
        } else if (kind === 1) {
          b.tr(M4.makeRotationY(yaw).scale(V3.set(sc, sc, sc)).setPosition(x, 0.05, z));
          b.col(i % 8 < 4 ? [0.92, 0.88, 0.8] : P.cloth2).surf(K.TAPESTRY, 0.2, 0, 0);
          b.grid(14, 1, (u, v, o) => { const a = (u - 0.5) * 2.5, r = 0.3 + 1.0 * v; o[0] = Math.sin(a) * r; o[1] = 0.06 * (Math.round(u * 14) % 2) * v; o[2] = Math.cos(a) * r; });
          goldK(b);
          for (let q = 0; q <= 7; q++) { const a = (q / 7 - 0.5) * 2.5; b.rod([0, 0.03, 0], [Math.sin(a) * 1.32, 0.07, Math.cos(a) * 1.32], 0.025, 0.02, 4); }
        } else if (kind === 2) {
          b.tr(M4.makeRotationFromEuler(E3.set(0, yaw, Math.PI / 2 - 0.12, 'YXZ')).scale(V3.set(sc, sc, sc)).setPosition(x, 0.31 * sc, z));
          goldK(b); latheInto(b, [[0.26, 0], [0.07, 0.07], [0.06, 0.5], [0.28, 0.7], [0.31, 1.1]], 8);
        } else {
          b.tr(M4.makeRotationFromEuler(E3.set(-Math.PI / 2 + 0.08, yaw, 0, 'YXZ')).setPosition(x, 0.72, z));
          chair(b, P);
        }
        if (i % 4 === 3) yield;
      }
      b.tr(null);
    };
    for (const R of rooms) {
      const sg = rf.sign(), px = R.passX ?? 0, side = px > 0.3 ? -1 : px < -0.3 ? 1 : sg;
      if (R.velvet || R.k === 0) continue;
      R.feature = R.k === 3 ? { x: side * (R.hw - 3.7), z: -R.L + 2.7, rad: 3.4 } : { x: side * R.hw * 0.5, z: -R.L * 0.5, rad: R.k === 2 ? 4.4 : 3.4 };
      // clearance on this seed's own route: the set piece keeps its own radius and 2.5 m clear of the flown line, or stands nearer its wall
      const wf = R.toWorld(R.feature.x, 0, R.feature.z), need = R.feature.rad + 2.5, df = path.nearestXZ(wf.x, wf.z).dist;
      if (df < need) R.feature.x = side * Math.min(Math.abs(R.feature.x) + need - df, R.hw - R.feature.rad - 0.8);
    }
    for (const R of rooms) {
      R.runner = !R.velvet && rd.chance(0.45); R.curtain = !R.velvet && rd.chance(0.5);
      const decor = decorInto(R.batch, R, rd);
      while (!decor.next().done) await ctx.yield();
      await ctx.yield();
      const more = R.velvet ? strewnInto(R.batch, R, rs) : featureInto(R.batch, R);
      while (!more.next().done) await ctx.yield();
      await ctx.yield();
      const mesh = new THREE.Mesh(R.batch.build(), R.mat); mesh.frustumCulled = false; R.group.add(mesh);
      R.shellTris = R.batch.triangles; R.batch = null;
      await ctx.yield();
    }

    // ------------------------------------------------------------ the masquers
    const heads = rm.shuffle(HEADS.slice());
    const PALEC = [0.92, 0.9, 0.85], SILVER = [0.74, 0.77, 0.82], DARKC = [0.07, 0.06, 0.07], CREAM = [0.95, 0.74, 0.4];
    let pairTotal = 0;
    for (const R of rooms) {
      if (R.velvet) continue;
      const k = R.k, hue = mix3(R.base, [1, 1, 1], 0.2), deep = mul(R.base, 0.55), white = k === 4;
      const fashions = [0, 1].map((f) => ({
        lady: { head: heads[(k * 4 + f * 2) % heads.length], wide: rm.chance(0.5), ruff: rm.chance(0.5), mask: rm.pick([PALEC, [1, 0.72, 0.3], PALEC, SILVER]) },
        gent: { head: heads[(k * 4 + f * 2 + 1) % heads.length], long: rm.chance(0.5), ruff: rm.chance(0.4), mask: rm.pick([PALEC, [1, 0.72, 0.3], [0.05, 0.05, 0.06], PALEC]) },
      }));
      const pairs = [], sp = 5.3 / Math.sqrt(Math.min(density * R.crowd, 1)), xm = R.hw - 3.5, slow = k === 5 ? 0.6 : 1;
      const pairAt = (rr, x, z, r) => ({ x, z, r, size: rr.range(0.93, 1.08), turn: (rr.chance(0.8) ? 1 : -1) * rr.range(1.25, 1.9) * wild * slow, round: (rr.chance(0.5) ? 1 : -1) * rr.range(0.25, 0.5) * slow,
        phase: rr.range(0, TAU), seed: rr(), fashion: rr.chance(0.5) ? 0 : 1,
        a: white ? rr.pick([PALEC, SILVER, [0.84, 0.85, 0.88]]) : rr.pick([PALEC, PALEC, SILVER, hue, hue, CREAM]),
        b: white ? rr.pick([PALEC, SILVER, [0.5, 0.52, 0.56]]) : rr.pick([DARKC, DARKC, hue, PALEC, SILVER, deep]),
        c: white ? rr.pick([SILVER, [1, 1, 1]]) : rr.pick([CREAM, PALEC, hue, DARKC, CREAM]) });
      const fits = (x, z, r, lane) => {
        if (Math.abs(x) > xm + 0.4) return false;
        if (k === 0 && z > -9.5) return false;
        const w = R.toWorld(x, 0, z), n = path.nearestXZ(w.x, w.z);
        if (n.dist < lane + r && n.y < 8.8) return false;               // a clear lane round the flight line
        if (R.feature && Math.hypot(x - R.feature.x, z - R.feature.z) < R.feature.rad + 2.5 + r) return false;
        return !pairs.some((q) => Math.hypot(x - q.x, z - q.z) < 4.5 + r + q.r);      // no pair stands in another
      };
      for (let iz = 0; ; iz++) {
        const z0 = -3.4 - iz * sp * 0.866; if (z0 < -R.L + 3.4) break;
        if (iz % 3 === 2) await ctx.yield();
        for (let x0 = -xm + (iz % 2) * sp * 0.5; x0 <= xm; x0 += sp) {
          const x = x0 + rm.range(-0.14, 0.14), z = z0 + rm.range(-0.14, 0.14), r = rm.range(0.1, 0.24), pr = pairAt(rm, x, z, r);
          if (fits(x, z, r, 4.9)) pairs.push(pr);
        }
      }
      // A busier visit (density above 1) adds pairs: a grid of half the step (it holds the first grid's places too; the no-touch rule throws those out), tried in a seeded order under the
      // same rules but a pair's own width farther from the lane, until the room has density times its pairs or no place is left.
      if (density > 1) {
        const want = pairs.length + Math.round(pairs.length * (density - 1)), spots = [], h = sp * 0.5;
        for (let iz = 0; ; iz++) {
          const z0 = -3.4 - iz * h * 0.866; if (z0 < -R.L + 3.4) break;
          for (let x0 = -xm + (iz % 2) * h * 0.5; x0 <= xm; x0 += h) spots.push([x0, z0]);
        }
        rx.shuffle(spots);
        await ctx.yield();
        for (let i = 0; i < spots.length && pairs.length < want; i++) {
          const x = spots[i][0], z = spots[i][1], r = rx.range(0.1, 0.24), pr = pairAt(rx, x, z, r);
          if (fits(x, z, r, 4.9 + 2.2)) pairs.push(pr);
          if (i % 40 === 39) await ctx.yield();
        }
      }
      const toDoor = k < 6 ? [R.doorB ?? 0, -R.L] : [0, 0];
      await ctx.yield();
      const geometries = [];
      for (const f of fashions) {
        const parts = pairParts(f, rm); let r = parts.next();
        while (!r.done) { await ctx.yield(); r = parts.next(); }
        geometries.push(r.value);
        await ctx.yield();
      }
      R.masq = makeMasquers({ uniforms: R.U, pairs, fashions, geometries, rng: rm, wild, doorAt: toDoor });
      R.group.add(R.masq.object);
      pairTotal += pairs.length;
      await ctx.yield();
    }

    // ------------------------------------------------------------ the clock
    const hero = await buildHero(ctx, { shared, uniforms: C7.U, roomInv: C7.inv, uStrike: mStop0 / LEN, rng: rk });
    hero.object.position.set(0, 0, zClock); C7.group.add(hero.object); C7.group.updateMatrixWorld(true);
    // The gaze: from the black door to the portal the eye rests on the clock, by the clock's own measures. With more
    // route left to the portal than the clock is tall, the eye is on its middle; nearer, it sinks toward the open door and is on the door's middle by the
    // time no more route is left than the door is high. Worked out from u in the pull's own function.
    const dFar = CLOCK.H, dDoor = CLOCK.doorTop;
    const eyeMid = C7.toWorld(0, CLOCK.H / 2, zClock), eyeDoor = C7.toWorld(0, yPortal, zClock), eye = new THREE.Vector3();
    const clockEye = (time, u) => eye.lerpVectors(eyeDoor, eyeMid, smoothstep(dDoor, dFar, (1 - u) * LEN));
    await ctx.yield();

    // ------------------------------------------------------------ confetti and feathers in the wake of the dance; sparks of the corridor fires
    for (const R of rooms) {
      if (R.velvet) continue;
      // thrown by the handful: a few showers in each room, each a drift of coloured scraps tumbling down
      const nC = R.k === 0 ? 7 : 5, per = Math.round(64 * density * detail * (R.k === 5 ? 0.6 : 1)), n = nC * per, IP = new Float32Array(n * 4), IC = new Float32Array(n * 3), H = 11;
      const tones = R.k === 4 ? [[1, 0.72, 0.25], [1, 1, 1], [0.7, 0.75, 0.85]] : [[1, 0.72, 0.25], [1, 1, 1], mix3(R.base, [1, 1, 1], 0.25), [1, 0.35, 0.45], [0.25, 0.85, 0.8]];
      for (let c = 0; c < nC; c++) {
        const cx = rc.range(-R.hw + 5, R.hw - 5), cz = -R.L * (c + 0.5) / nC + rc.range(-2, 2);
        for (let j = 0; j < per; j++) {
          const i = c * per + j;
          IP.set([cx + (rc() + rc() - 1) * 2.6, rc.range(0, H), cz + (rc() + rc() - 1) * 2.6, rc()], i * 4);
          IC.set(rc.pick(tones), i * 3);
        }
      }
      const g = new THREE.InstancedBufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(QUAD, 3));
      g.setAttribute('iP', new THREE.InstancedBufferAttribute(IP, 4)); g.setAttribute('iC', new THREE.InstancedBufferAttribute(IC, 3)); g.instanceCount = n;
      const m = new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms: { ...R.U, uBox: { value: new THREE.Vector4(H, 0, 0, 1) } }, vertexShader: CONF_VERT, fragmentShader: CONF_FRAG, side: THREE.DoubleSide }));
      m.frustumCulled = false; R.group.add(m);
    }
    {
      const per = Math.round(46 * density * detail), n = fires.length * per, IP = new Float32Array(n * 4);
      for (let i = 0; i < n; i++) { const f = fires[Math.floor(i / per)]; IP.set([f.x + rc.range(-0.5, 0.5), f.y + rc.range(-0.3, 0.6), f.z + rc.range(-0.5, 0.5), rc()], i * 4); }
      const g = new THREE.InstancedBufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(QUAD, 3)); g.setAttribute('iP', new THREE.InstancedBufferAttribute(IP, 4)); g.instanceCount = n;
      const sparks = new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms: { uTime: shared.uTime }, vertexShader: SPARK_VERT, fragmentShader: SPARK_FRAG, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
      sparks.frustumCulled = false; sparks.renderOrder = 3; scene.add(sparks);
    }
    await ctx.yield();

    // ------------------------------------------------------------ the film
    // The revel goes by the metres flown and by nothing else: turnAt(m) is the integral along the route of (1 - stop), in
    // seconds at the film's pace; every pair turns by its own rate times it from its own start angle. So the dancers stand
    // where the stop is, at any pace of the viewer and any clock, and nothing is carried from frame to frame. (On the clock,
    // scaled by 1 - stop: the small sway and bob of each figure, in the part's shader.)
    const rampI = (a, b, m) => { const t = clamp((m - a) / (b - a), 0, 1); return (b - a) * (t * t * t - 0.5 * t * t * t * t) + Math.max(m - b, 0); };
    const stopAt = (m) => smoothstep(mStop0, mStop1, m) * (1 - smoothstep(mGo0, mGo1, m));
    const turnAt = (m) => SEC * (m - rampI(mStop0, mStop1, m) + rampI(mGo0, mGo1, m));
    // The strike too goes by the metres flown: the first stroke at the white room's door and one more every STROKE_M of
    // route (the pendulum's period at the film's pace) until the portal; no stroke is the last, the flight leaves while the
    // clock is still striking. Each stroke's ring and glow run their course over those metres, and at each stroke the
    // braziers duck and recover with the stroke's own envelope: deepest in the room we are in, half as deep one stroke's
    // length of route away. On a rare visit they duck deeper at every stroke, and one stroke (drawn) puts them nearly out.
    const STROKE_M = CLOCK.period / SEC, nOut = rg.int(0, Math.floor((LEN - mStop0) / STROKE_M));          // any one of this visit's strokes
    const portalColor = '#ff6a4a';
    return {
      scene, path, duration: DURATION,
      camera: { fov: 64, near: 0.3, far: 700, lookAhead: 15, sway: 0.5, bank: 0.35 },
      pois: [{ at: clockEye, from: mGo1 / LEN, to: 1, weight: 0.7, fade: 0.2 }],
      portal: { shape: 'arch', width: hero.anchors.portalWidth, height: hero.anchors.portalHeight, color: portalColor, glow: 0.7, revealDistance: 200 },
      post: { exposure: 1.0, bloom: { strength: 0.42, radius: 0.7, threshold: 0.95 }, grade: { saturation: 1.08, contrast: 1.05, tint: '#ffffff', shadowTint: '#040208', vignette: 0.36, grain: 0.02, aberration: 0 } },
      update(dt, time, camera, u) {
        shared.uTime.value = time;
        let cur = 0; while (cur < 6 && u > rooms[cur].uOut) cur++;
        const m = u * LEN, stop = stopAt(m), turn = turnAt(m);
        const sx = (m - mStop0) / STROKE_M, sn = Math.floor(sx);
        hero.setU(u); hero.setStrike(sx >= 0 ? 1 : 0, sx - sn); hero.update(dt, time, camera);
        const pulse = hero.state.pulse, duck = !rare ? 0.34 : sn === nOut ? 0.95 : 0.6;
        for (let i = 0; i < 7; i++) {
          const R = rooms[i], near = 1 - 0.5 * smoothstep(0, STROKE_M, Math.max(R.mIn - m, m - R.mOut, 0));
          for (let j = 0; j < 2; j++) {
            const ph = R.phase[j];
            const f = 0.86 + 0.1 * Math.sin(time * (5.1 + i * 0.37 + j * 1.3) + ph) * Math.sin(time * (2.3 + j * 0.7) + ph * 1.7) + 0.045 * Math.sin(time * 13.7 + ph * 2.9);
            R.level[j] = f * (1 - duck * near * pulse);
          }
        }
        for (let i = 0; i < 7; i++) {
          const R = rooms[i], A = rooms[i - 1], B = rooms[i + 1];
          R.U.uFlick.value.set(R.level[0], R.level[1], A ? 0.5 * (A.level[0] + A.level[1]) : 0, B ? 0.5 * (B.level[0] + B.level[1]) : 0);
          R.group.visible = i >= cur - 1 && i <= cur + 2;
          if (R.masq) { R.masq.uniforms.uDance.value = turn; R.masq.uniforms.uStop.value = stop; }
        }
      },
      dispose() { hero.dispose(); },
    };
  },
};
