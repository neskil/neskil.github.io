// The towers of the dusk city. Ninety clock towers of pale stone, glazed tile and dark iron, from the rows of the data
// file: shafts, belfries and caps in ONE merged geometry under the stone's one shader, ninety faces with their own dials and
// turning hands (one instanced quad), ninety dark bells that swing in their open belfries (one instanced turned shape), and
// each tower's lamps on its ledges (one instanced point; sixteen on a tower that has all its ledges, 1,388 in all).
//
// WHAT STANDS, said as states of the place:
//   the dusk is always the same clear dusk; one key out of the west lights every west side alike and no lamp or face comes on;
//   each tower's bell keeps its own interval and its own start on the place's one clock, and nothing here knows where the lens is;
//   towers and caps never move: only bells swing, hands turn and faces brighten softly at their own bell's stroke.
//
// WHAT A TOWER IS MADE OF: a square shaft with courses, four corner piers, five ledges (a ledge that would stand under 12 m
// is left unbuilt), two or three bands of glazed tile, twelve blind recesses with round heads in the one storey nearest the
// height the route has beside it (two towers have no such storey and carry none), and a ring of stone round its dial; an open belfry of eight piers and round heads (a parapet of stone, or rails and fans of iron), a frieze
// of tile and a cornice of two courses, the upper one the level its rings of light leave from; a cap of the same stone,
// spired, stepped, domed or an open-work crown. A tower whose walls stand within 40 m of the route's line carries the finer
// stone a near wall is read by (recess surrounds, imposts, brackets, string courses): that is where a thing stands, never where the
// lens is.
//
// The place's main file drives the one clock (the uniform this part hands out) and sets the rings of light from the same data.
import * as THREE from 'three';
import { TOWERS, KNOTS, COLOURS, CREAM, UNIT, SOUND, DIAL, GROUND_Y, dirOf } from './dial-towers-at-dusk-data.js';

export { TOWERS };
const lin = (hex) => { const c = new THREE.Color(hex); return [c.r, c.g, c.b]; };
const v3 = (hex, k = 1) => { const c = lin(hex); return `vec3(${(c[0] * k).toFixed(6)}, ${(c[1] * k).toFixed(6)}, ${(c[2] * k).toFixed(6)})`; };
const lumOf = (hex) => { const c = lin(hex); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };
// a colour of the given hue at so many units of lit stone
export const atUnits = (hex, units) => { const c = lin(hex), k = units * UNIT / lumOf(hex); return [c[0] * k, c[1] * k, c[2] * k]; };

// THE LAW OF LIGHT, for every shader of the place (the place's main file takes it too): the key out of the west, 9 degrees up;
// the west's share of a bearing; the far fade toward the dusk sky's own colour at that bearing, from 350 m of the lens on.
export const LIGHT_GLSL = /* glsl */`
const vec3 KEY = vec3(-0.988, 0.156, 0.0);
const vec3 FADE_W = ${v3(COLOURS.fadeWest)}, FADE_H = ${v3(COLOURS.fadeHalf)}, FADE_A = ${v3(COLOURS.fadeAway)};
float westShare(vec2 dxz) {
  float l = max(length(dxz), 1e-5);
  float a = degrees(acos(clamp(-dxz.x / l, -1., 1.)));
  float x = clamp((a - 50.) / 60., 0., 1.);
  return 1. - x * x * (3. - 2. * x);
}
vec3 byShare(float w, vec3 west, vec3 halfw, vec3 away) { return w >= .5 ? mix(halfw, west, 2. * w - 1.) : mix(away, halfw, 2. * w); }
vec3 farFade(vec3 col, vec3 wp, vec3 eye, float rate) {
  vec3 d = wp - eye;
  float k = rate * .8 * clamp((length(d) - 350.) / 750., 0., 1.);
  return mix(col, byShare(westShare(d.xz), FADE_W, FADE_H, FADE_A), k);
}
float smooth01(float x) { x = clamp(x, 0., 1.); return x * x * (3. - 2. * x); }
`;
// the place's one clock, in seconds: one uniform object, shared by bells, faces and (in the place's main file) the rings
export const makeClock = () => ({ value: 0 });

// ---------------------------------------------------------------- the merged stone: a buffer of quads
// per vertex: position, normal, aLoc (the tower's own frame: along its turn, height, across), aFace (the face's frame in
// dial radii: across, up, out of the wall), aTw (half width, lowest lamp ledge, step to the next lamp ledge, belfry floor),
// aK (kind: 0 stone, 1 tile, 2 iron; shade: 1, or less under a ledge and in a recess; 1 where the quad looks the face's way)
function makeBuf() { return { pos: [], nor: [], loc: [], face: [], tw: [], k: [], idx: [], n: 0, T: null }; }
// begin a tower: its frame and what its vertices carry
function setTower(B, t, at) {
  const [nx, nz] = dirOf(t.rot), hw = t.w / 2;
  const k = Math.round((((t.facing - t.rot) % 360) + 360) % 360 / 90) % 4;
  const fa = [1, 0, -1, 0][k], fb = [0, 1, 0, -1][k];
  B.T = { t, cx: at ? at[0] : t.x, cz: at ? at[1] : t.z, nx, nz, hw, fa, fb, R: t.face / 2, tw: [hw, 0, 0, t.belfry] };
}
function vert(B, p, n, kind, shade) {
  const T = B.T, a = p[0], y = p[1], b = p[2];
  B.pos.push(T.cx + a * T.nx - b * T.nz, y, T.cz + a * T.nz + b * T.nx);
  B.nor.push(n[0] * T.nx - n[2] * T.nz, n[1], n[0] * T.nz + n[2] * T.nx);
  B.loc.push(a, y, b);
  const da = a - T.fa * T.hw, db = b - T.fb * T.hw;
  B.face.push((-da * T.fb + db * T.fa) / T.R, (y - T.t.faceY) / T.R, (da * T.fa + db * T.fb) / T.R);
  B.tw.push(T.tw[0], T.tw[1], T.tw[2], T.tw[3]);
  B.k.push(kind, shade, B.wash || n[0] * T.fa + n[2] * T.fb > 0.7 ? 1 : 0);
  return B.n++;
}
// one quad p0 p1 p2 p3 (in the tower's frame), turned so that it looks away from the point `inside`
function quad(B, p0, p1, p2, p3, inside, kind = 0, shade = 1) {
  const ux = p1[0] - p0[0], uy = p1[1] - p0[1], uz = p1[2] - p0[2], vx = p3[0] - p0[0], vy = p3[1] - p0[1], vz = p3[2] - p0[2];
  let n = [uy * vz - uz * vy, uz * vx - ux * vz, ux * vy - uy * vx];
  const l = Math.hypot(n[0], n[1], n[2]) || 1; n = [n[0] / l, n[1] / l, n[2] / l];
  const out = n[0] * (p0[0] - inside[0]) + n[1] * (p0[1] - inside[1]) + n[2] * (p0[2] - inside[2]) >= 0;
  if (!out) n = [-n[0], -n[1], -n[2]];
  // a quad of glazed tile carries its height up the band in the shade slot: 1 at its lower edge, 2 at its upper edge
  const lo = Math.min(p0[1], p1[1], p2[1], p3[1]), hi = Math.max(p0[1], p1[1], p2[1], p3[1]), sh = (p) => (kind === 1 ? 1 + (p[1] - lo) / (hi - lo || 1) : shade);
  const i0 = vert(B, p0, n, kind, sh(p0)), i1 = vert(B, p1, n, kind, sh(p1)), i2 = vert(B, p2, n, kind, sh(p2)), i3 = vert(B, p3, n, kind, sh(p3));
  if (out) B.idx.push(i0, i1, i2, i0, i2, i3); else B.idx.push(i0, i2, i1, i0, i3, i2);
}
// a box a0..a1, y0..y1, b0..b1; faces: which of its six sides are laid (a-, a+, y-, y+, b-, b+)
function box(B, a0, a1, y0, y1, b0, b1, kind = 0, shade = 1, faces = 63) {
  const c = [(a0 + a1) / 2, (y0 + y1) / 2, (b0 + b1) / 2];
  if (faces & 1) quad(B, [a0, y0, b0], [a0, y0, b1], [a0, y1, b1], [a0, y1, b0], c, kind, shade);
  if (faces & 2) quad(B, [a1, y0, b0], [a1, y0, b1], [a1, y1, b1], [a1, y1, b0], c, kind, shade);
  if (faces & 4) quad(B, [a0, y0, b0], [a1, y0, b0], [a1, y0, b1], [a0, y0, b1], c, kind, shade);
  if (faces & 8) quad(B, [a0, y1, b0], [a1, y1, b0], [a1, y1, b1], [a0, y1, b1], c, kind, shade);
  if (faces & 16) quad(B, [a0, y0, b0], [a1, y0, b0], [a1, y1, b0], [a0, y1, b0], c, kind, shade);
  if (faces & 32) quad(B, [a0, y0, b1], [a1, y0, b1], [a1, y1, b1], [a0, y1, b1], c, kind, shade);
}
// a square slab about the tower's axis (a ledge, a floor, a cornice course)
const slab = (B, half, y0, y1, kind = 0, shade = 1) => box(B, -half, half, y0, y1, -half, half, kind, shade);
async function toGeometry(B, yieldFn) {
  const g = new THREE.BufferGeometry(), rest = async () => { if (yieldFn) await yieldFn(); };
  // each list is turned into its typed array in a step of its own, so that no step of the build is long
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(B.pos), 3)); await rest();
  g.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(B.nor), 3)); await rest();
  g.setAttribute('aLoc', new THREE.BufferAttribute(new Float32Array(B.loc), 3)); await rest();
  g.setAttribute('aFace', new THREE.BufferAttribute(new Float32Array(B.face), 3)); await rest();
  g.setAttribute('aTw', new THREE.BufferAttribute(new Float32Array(B.tw), 4)); await rest();
  g.setAttribute('aK', new THREE.BufferAttribute(new Float32Array(B.k), 3)); await rest();
  g.setIndex(new THREE.BufferAttribute(B.n > 65535 ? new Uint32Array(B.idx) : new Uint16Array(B.idx), 1)); await rest();
  g.computeBoundingSphere();
  return g;
}

// ---------------------------------------------------------------- one tower's stone, tile and iron
const frac = (x) => x - Math.floor(x);
// where a tower's ledges stand: the first right under its dial, the others below it at one spacing of 9 to 12 m by its
// bell's rank; with room above the dial one or two more stand over it (five in all). Lamps stand on the upper three below the dial.
export function ledgesOf(t) {
  const R = t.face / 2, s = 9 + 3 * frac(0.618 * (t.rank + 1)), yA = t.faceY - R - 1.5, top = t.faceY + R + 1.5;
  const up = Math.max(0, Math.min(2, Math.floor((t.belfry - 0.6 - top - 2) / s) + 1)), ys = [];
  for (let j = up - 1; j >= 0; j--) ys.push(top + 0.6 + j * s);
  for (let k = 0; k < 5 - up; k++) ys.push(yA - k * s);
  const got = ys.filter((y) => y > GROUND_Y + 6 && y < t.belfry - 2.5);
  // the ONE storey that carries the blind recesses: of the storeys between two ledges (the dial's own left out) the one whose
  // middle lies nearest the height the route has beside this tower; a recess stands 0.9 m over the lower ledge and is 5 m high
  const yRoute = routeBy(t).y, tops = [t.belfry - 0.6].concat(got);
  let rec = null, best = 1e9;
  for (let i = 0; i + 1 < tops.length; i++) {
    const hi = tops[i] - (i ? 0.6 : 0), lo = tops[i + 1];
    if (lo < t.faceY + R && hi > t.faceY - R) continue;
    if (hi - lo < 8.2) continue;
    const d = Math.abs((hi + lo) / 2 - yRoute);
    if (d < best) { best = d; rec = { y0: lo + 0.9, y1: lo + 5.9 }; }
  }
  return { s, yA, ys: got, rec, dialTop: up >= 1 ? top : null };
}
// a point of a side of the tower: c metres along the side, `out` metres from the axis; side 0..3 looks along +a, +b, -a, -b
const SIDE = [[1, 0], [0, 1], [-1, 0], [0, -1]];
const sp = (side, c, out, y) => { const [da, db] = SIDE[side]; return [da * out - db * c, y, db * out + da * c]; };
// a round-headed opening's stone above it, on one side: from c0 to c1, springing so that its crown stands at yCrown
function roundHead(B, side, c0, c1, yFloor, yCrown, yTop, hw, th) {
  const N = 6, cm = (c0 + c1) / 2, r = (c1 - c0) / 2, rise = Math.min(r, yCrown - yFloor - 2), ys = yCrown - rise, inside = sp(side, cm, hw - th / 2, yTop + 5);
  for (let i = 0; i < N; i++) {
    const a0 = Math.PI * i / N, a1 = Math.PI * (i + 1) / N;
    const ca = cm - r * Math.cos(a0), cb = cm - r * Math.cos(a1), ya = ys + rise * Math.sin(a0), yb = ys + rise * Math.sin(a1);
    quad(B, sp(side, ca, hw, ya), sp(side, cb, hw, yb), sp(side, cb, hw, yTop), sp(side, ca, hw, yTop), sp(side, cm, 0, yTop), 0, 1);
    quad(B, sp(side, ca, hw - th, ya), sp(side, cb, hw - th, yb), sp(side, cb, hw - th, yTop), sp(side, ca, hw - th, yTop), sp(side, cm, hw + 9, yTop), 0, 1);
    quad(B, sp(side, ca, hw, ya), sp(side, cb, hw, yb), sp(side, cb, hw - th, yb), sp(side, ca, hw - th, ya), inside, 0, 1);
  }
}
// an upright post or pier on a side, c0..c1 along it, from `out - th` to `out` from the axis
function post(B, side, c0, c1, out, th, y0, y1, kind, shade = 1, caps = 0) {
  const p = (c, o, y) => sp(side, c, o, y), mid = sp(side, (c0 + c1) / 2, out - th / 2, (y0 + y1) / 2);
  quad(B, p(c0, out, y0), p(c1, out, y0), p(c1, out, y1), p(c0, out, y1), mid, kind, shade);
  quad(B, p(c0, out - th, y0), p(c1, out - th, y0), p(c1, out - th, y1), p(c0, out - th, y1), mid, kind, shade);
  quad(B, p(c0, out, y0), p(c0, out - th, y0), p(c0, out - th, y1), p(c0, out, y1), mid, kind, shade);
  quad(B, p(c1, out, y0), p(c1, out - th, y0), p(c1, out - th, y1), p(c1, out, y1), mid, kind, shade);
  // caps: 1 lays its top, 2 its underside
  if (caps & 1) quad(B, p(c0, out, y1), p(c1, out, y1), p(c1, out - th, y1), p(c0, out - th, y1), mid, kind, shade);
  if (caps & 2) quad(B, p(c0, out, y0), p(c1, out, y0), p(c1, out - th, y0), p(c0, out - th, y0), mid, kind, shade);
}
function recessWall(B, side, hw, y0, yTop, near) {
  const N = near ? 6 : 4, clear = 2 * (hw - 1.2), rw = Math.min(1.6, (clear - 2.2) / 3), gap = (clear - 3 * rw) / 4, dp = 0.5, r = rw / 2;
  const yCrown = yTop - 0.3, ys = yCrown - r, p = (c, o, y) => sp(side, c, o, y), ax = p(0, 0, (y0 + yTop) / 2);
  let c = -hw;
  for (let j = 0; j < 3; j++) {
    const cL = -hw + 1.2 + gap + j * (rw + gap), cR = cL + rw, cm = (cL + cR) / 2;
    // the wall beside the recess, and over its round head
    quad(B, p(c, hw, y0), p(cL, hw, y0), p(cL, hw, yTop), p(c, hw, yTop), ax, 0, 1);
    for (let i = 0; i < N; i++) {
      const a0 = Math.PI * i / N, a1 = Math.PI * (i + 1) / N, ca = cm - r * Math.cos(a0), cb = cm - r * Math.cos(a1), ya = ys + r * Math.sin(a0), yb = ys + r * Math.sin(a1);
      quad(B, p(ca, hw, ya), p(cb, hw, yb), p(cb, hw, yTop), p(ca, hw, yTop), ax, 0, 1);
      // the head's soffit
      const mx = (ca + cb) / 2, my = (ya + yb) / 2, out = p(cm + (mx - cm) * 3, hw - dp / 2, ys + (my - ys) * 3);
      quad(B, p(ca, hw, ya), p(cb, hw, yb), p(cb, hw - dp, yb), p(ca, hw - dp, ya), out, 0, 0.6);
    }
    // its back, its two jambs and its sill
    quad(B, p(cL, hw - dp, y0), p(cR, hw - dp, y0), p(cR, hw - dp, yCrown), p(cL, hw - dp, yCrown), ax, 0, 0.6);
    quad(B, p(cL, hw, y0), p(cL, hw - dp, y0), p(cL, hw - dp, ys), p(cL, hw, ys), p(cL - 1, hw - dp / 2, y0), 0, 0.6);
    quad(B, p(cR, hw, y0), p(cR, hw - dp, y0), p(cR, hw - dp, ys), p(cR, hw, ys), p(cR + 1, hw - dp / 2, y0), 0, 0.6);
    quad(B, p(cL, hw, y0), p(cR, hw, y0), p(cR, hw - dp, y0), p(cL, hw - dp, y0), p(cm, hw - dp / 2, y0 - 1), 0, 0.8);
    if (near) {
      // a frame of stone a hand proud round the recess: up both jambs and over the head, with a sill under it
      const o = hw + 0.1, wd = 0.2, fr = (a, k, oo) => p(cm - (r + k) * Math.cos(a), oo, ys + (r + k) * Math.sin(a));
      for (let i = 0; i < N; i++) {
        const a0 = Math.PI * i / N, a1 = Math.PI * (i + 1) / N;
        quad(B, fr(a0, 0, o), fr(a1, 0, o), fr(a1, wd, o), fr(a0, wd, o), ax, 0, 1);
      }
      for (const [e, d] of [[cL, -1], [cR, 1]]) quad(B, p(e, o, y0), p(e + d * wd, o, y0), p(e + d * wd, o, ys), p(e, o, ys), ax, 0, 1);
      post(B, side, cL - 0.32, cR + 0.32, hw + 0.2, 0.2, y0 - 0.25, y0, 0, 1, 3);
    }
    c = cR;
  }
  quad(B, p(c, hw, y0), p(hw, hw, y0), p(hw, hw, yTop), p(c, hw, yTop), ax, 0, 1);
}
function layShaft(B, t, L) {
  const hw = t.w / 2, y0 = GROUND_Y - 2, yT = t.belfry - 0.6;
  // the walls, cut where a band of glazed tile lies: under the first and the third ledge below the dial, and on every
  // second tower under the belfry's floor
  const bands = [];
  const below = L.ys.filter((y) => y <= L.yA + 0.01);
  for (const k of [0, 2]) if (below[k] !== undefined) bands.push([below[k] - 0.6 - 1.5, below[k] - 0.6]);
  if (t.rank % 2 === 0) bands.push([yT - 1.5, yT]);
  const cuts = [y0, yT], rec = L.rec;
  for (const [b0, b1] of bands) if (b0 > y0 + 1 && b1 <= yT) cuts.push(b0, b1);
  if (rec) cuts.push(rec.y0, rec.y1 + 0.3);
  cuts.sort((a, b) => a - b);
  for (let i = 0; i + 1 < cuts.length; i++) {
    const a = cuts[i], b = cuts[i + 1]; if (b - a < 0.01) continue;
    const tile = bands.some(([b0, b1]) => a >= b0 - 0.01 && b <= b1 + 0.01) ? 1 : 0;
    if (rec && a >= rec.y0 - 0.01 && b <= rec.y1 + 0.31) { for (let side = 0; side < 4; side++) recessWall(B, side, hw, a, b, B.near); continue; }
    box(B, -hw, hw, a, b, -hw, hw, tile, 1, 51);
  }
  // the four corner piers, 1.2 m wide and 0.4 m proud. In the dial's own storey none stands across the dial: the two at the
  // face's corners are proud only on the sides beside it, so the face's wall is one panel there
  const kf = Math.round((((t.facing - t.rot) % 360) + 360) % 360 / 90) % 4, [fda, fdb] = SIDE[kf];
  const yD0 = Math.min(L.yA - 0.6, yT), yD1 = L.dialTop !== null ? L.dialTop + 0.6 : yT;
  for (const [sa, sb] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) {
    const pier = (p0, p1, ea, eb) => {
      if (p1 - p0 < 0.5) return;
      const a0 = sa * (hw - 1.2), a1 = sa * (hw + ea), b0 = sb * (hw - 1.2), b1 = sb * (hw + eb);
      box(B, Math.min(a0, a1), Math.max(a0, a1), p0, p1, Math.min(b0, b1), Math.max(b0, b1), 0, 1, 51);
    };
    pier(y0, yD0, 0.4, 0.4);
    pier(yD0, yD1, fda === sa ? -0.02 : 0.4, fdb === sb ? -0.02 : 0.4);
    pier(yD1, yT, 0.4, 0.4);
  }
  // the stone moulding round the dial: a ring a hand's breadth out of the wall, its inner side turned to the dial's light
  {
    const k = Math.round((((t.facing - t.rot) % 360) + 360) % 360 / 90) % 4, R = t.face / 2, N = B.near ? 40 : 16;
    const ri = R + 0.02, ro = Math.min(R + 0.42, hw - 0.03), pr = 0.24, ax = sp(k, 0, 0, t.faceY);
    const at = (i, r, o) => { const a = 2 * Math.PI * i / N; return sp(k, r * Math.cos(a), hw + o, t.faceY + r * Math.sin(a)); };
    for (let i = 0; i < N; i++) {
      quad(B, at(i, ri, pr), at(i + 1, ri, pr), at(i + 1, ro, pr), at(i, ro, pr), ax, 0, 1);
      B.wash = 1;
      quad(B, at(i, ri, pr), at(i + 1, ri, pr), at(i + 1, ri, 0), at(i, ri, 0), at(i + 0.5, ri + 1, pr / 2), 0, 1);
      B.wash = 0;
      if (B.near) quad(B, at(i, ro, pr), at(i + 1, ro, pr), at(i + 1, ro, 0), at(i, ro, 0), ax, 0, 1);
    }
  }
  if (B.near) {
    // string courses: one under every band of glazed tile, one over the recesses' heads
    const at = bands.filter(([b0]) => b0 > y0 + 2).map(([b0]) => b0 - 0.25);
    if (rec && !at.some((y) => Math.abs(y - rec.y1 - 0.5) < 0.7)) at.push(rec.y1 + 0.5);
    for (const y of at) for (let side = 0; side < 4; side++) post(B, side, -hw + 1.2, hw - 1.2, hw + 0.14, 0.14, y, y + 0.25, 0, 1, 3);
    // and two across the dial's storey on the three sides that carry no dial
    for (const y of [t.faceY - 0.45 * t.face / 2, t.faceY + 0.45 * t.face / 2]) for (let side = 0; side < 4; side++) if (side !== kf) post(B, side, -hw + 1.2, hw - 1.2, hw + 0.14, 0.14, y, y + 0.25, 0, 1, 3);
    // a bracket under the ledge below each lamp
    for (let j = 0; j < 3; j++) { const y = L.yA - j * L.s - 0.6; if (L.ys.some((v) => Math.abs(v - 0.6 - y) < 0.01)) for (let side = 0; side < 4; side++) post(B, side, -0.3, 0.3, hw + 0.42, 0.42, y - 0.5, y, 0, 0.85, 2); }
  }
  // the ledges: 0.5 m out, 0.6 m high
  for (const y of L.ys) slab(B, hw + 0.5, y - 0.6, y);
}
// how a bell hangs in its own belfry: `p` is the height of its headstock's axis over the belfry's floor and `k` how tall
// the bell is cast (1 is the full 0.82 of its width). A bell with room hangs with its middle 4 m over the floor; a wide bell in
// a low belfry is cast squatter and hung so that its lip clears the floor at the end of its swing and its headstock stays
// inside the cornice's stone
export function bellFit(t) {
  const b = t.bell, Hb = t.ring - t.belfry, sw = SOUND.swing * Math.PI / 180, cs = Math.cos(sw), sn = Math.sin(sw);
  const dip = (k) => (BELL_TALL * k * cs + 0.5 * sn) * b, head = (k) => (0.225 * k * cs + 0.13 * sn) * b + 0.05;
  const k = Math.max(0.6, Math.min(1, (Hb + 0.75 - 0.63 * sn * b) / ((BELL_TALL + 0.225) * cs * b)));
  const lo = 0.1 + dip(k), hi = Hb + 0.9 - head(k);
  return { k, p: Math.max(lo, Math.min(hi, 4 + 0.5 * BELL_TALL * b * k)), lo, hi };
}
// the band of stone that follows a round head on the wall's outer side (near towers)
function headBand(B, side, c0, c1, yCrown, yFloor, hw) {
  const N = 6, cm = (c0 + c1) / 2, r = (c1 - c0) / 2, rise = Math.min(r, yCrown - yFloor - 2), ys = yCrown - rise, o = hw + 0.14, wd = 0.38;
  const at = (a, k, out) => sp(side, cm - (r + k) * Math.cos(a), out, ys + (rise + k) * Math.sin(a));
  for (let i = 0; i < N; i++) {
    const a0 = Math.PI * i / N, a1 = Math.PI * (i + 1) / N, mid = sp(side, cm, hw - 1, ys);
    quad(B, at(a0, 0, o), at(a1, 0, o), at(a1, wd, o), at(a0, wd, o), mid, 0, 1);
    quad(B, at(a0, wd, o), at(a1, wd, o), at(a1, wd, hw), at(a0, wd, hw), mid, 0, 1);
  }
}
// the iron in a round head: a tie across its springing and three bars that fan from the tie's middle to the head
function ironFan(B, side, c0, c1, yCrown, yFloor, hw) {
  const cm = (c0 + c1) / 2, r = (c1 - c0) / 2, rise = Math.min(r, yCrown - yFloor - 2), ys = yCrown - rise, o = hw - 0.34, w = 0.07;
  post(B, side, c0, c1, o, 0.14, ys - 0.07, ys + 0.07, 2);
  for (const deg of [45, 90, 135]) {
    const a = deg * Math.PI / 180, ca = Math.cos(a), sa = Math.sin(a), e = [cm - r * ca, ys + rise * sa], m = sp(side, cm, o - 0.07, ys + rise);
    const pt = (c, y, out) => sp(side, c, out, y);
    quad(B, pt(cm - w * sa, ys - w * ca, o), pt(cm + w * sa, ys + w * ca, o), pt(e[0] + w * sa, e[1] + w * ca, o), pt(e[0] - w * sa, e[1] - w * ca, o), m, 2, 1);
    quad(B, pt(cm - w * sa, ys - w * ca, o - 0.14), pt(cm + w * sa, ys + w * ca, o - 0.14), pt(e[0] + w * sa, e[1] + w * ca, o - 0.14), pt(e[0] - w * sa, e[1] - w * ca, o - 0.14), m, 2, 1);
  }
}
function layBelfry(B, t, near) {
  const hw = t.w / 2, yF = t.belfry, yR = t.ring, P = Math.max(1.2, Math.min(2, 0.16 * t.w)), th = 0.9;
  const yFrieze = yR - 2.3, yCrown = yFrieze - 0.4, iron = t.frame === 'iron';
  const k = Math.round((((t.facing - t.rot) % 360) + 360) % 360 / 90) % 4;
  slab(B, hw + 0.5, yF - 0.6, yF);
  const fit = bellFit(t), yHead = yF + fit.p + 0.01 * t.bell * fit.k;
  for (let side = 0; side < 4; side++) {
    // the corner pier at this side's left end (it serves both sides it stands on)
    post(B, side, -hw, -hw + P, hw, P, yF, yFrieze, 0);
    const swingSide = (side - k + 4) % 2 === 1, mp = iron ? 0.3 : 0.9;
    // this side's openings: one wide round head on the two sides the bell swings toward, two on the others
    const opens = swingSide ? [[-hw + P, hw - P]] : [[-hw + P, -mp / 2], [mp / 2, hw - P]];
    for (const [c0, c1] of opens) {
      roundHead(B, side, c0, c1, yF, yCrown, yFrieze, hw, th);
      const r = (c1 - c0) / 2, ySp = yCrown - Math.min(r, yCrown - yF - 2);
      if (iron) {
        // iron rails across the opening, and an iron fan in the head where no bell swings
        for (const yy of [yF + 0.55, yF + 1.05]) post(B, side, c0, c1, hw - 0.3, 0.14, yy, yy + 0.14, 2);
        if (!swingSide) ironFan(B, side, c0, c1, yCrown, yF, hw);
      } else {
        // a low parapet of stone across the opening
        post(B, side, c0, c1, hw - 0.15, 0.4, yF, yF + 1.0, 0, 1, 1);
      }
      if (near) {
        headBand(B, side, c0, c1, yCrown, yF, hw);
        // the imposts the head springs from
        post(B, side, c0 - 0.4, c0 + 0.06, hw + 0.14, th + 0.28, ySp - 0.32, ySp, 0, 1, 3);
        post(B, side, c1 - 0.06, c1 + 0.4, hw + 0.14, th + 0.28, ySp - 0.32, ySp, 0, 1, 3);
      }
    }
    if (!swingSide) {
      const half = (hw - P - mp / 2) / 2, spring = yCrown - Math.min(half, yCrown - yF - 2);
      post(B, side, -mp / 2, mp / 2, iron ? hw - 0.25 : hw, iron ? 0.34 : th, yF, spring + 0.05, iron ? 2 : 0);
      // the bracket that carries this end of the bell's headstock, where the headstock hangs below the heads' crowns
      const inner = hw - th, end = 0.5 * HEAD_LONG * t.bell;
      if (yHead + 0.21 * t.bell * fit.k < yFrieze - 0.1 && end - 0.35 < inner) {
        const q = order(sideBox(side, -0.3, 0.3, end - 0.4, inner + 0.05));
        const yB = yHead - 0.055 * t.bell * fit.k;
        box(B, q[0], q[1], yB - 0.5, yB, q[2], q[3], iron ? 2 : 0, 1);
      }
    }
  }
  // the frieze of glazed tile under the cornice, then the cornice's two courses: the upper one is the ring's level
  slab(B, hw + 0.06, yFrieze, yR - 0.8, 1);
  slab(B, hw + 0.3, yR - 0.8, yR - 0.2);
  slab(B, hw + 0.6, yR - 0.2, yR + 1);
  if (near) {
    // brackets under the cornice's upper course, and a thin lip to the lower one
    const n = Math.max(4, Math.round(t.w / 1.7));
    for (let side = 0; side < 4; side++) for (let i = 0; i < n; i++) {
      const c = -hw + (i + 0.5) * (2 * hw / n);
      post(B, side, c - 0.22, c + 0.22, hw + 0.56, 0.3, yR - 0.62, yR - 0.2, 0, 0.85, 2);
    }
  }
}
// a box on a side given along the side (c0..c1) and from the axis (o0..o1), as the a and b ranges that box() takes
function sideBox(side, c0, c1, o0, o1) { const p = sp(side, c0, o0, 0), q = sp(side, c1, o1, 0); return [p[0], q[0], p[2], q[2]]; }
const order = ([a0, a1, b0, b1]) => [Math.min(a0, a1), Math.max(a0, a1)].concat([Math.min(b0, b1), Math.max(b0, b1)]);
// a three-cornered face (a spire's side, a dome's crown)
function tri(B, p0, p1, p2, inside, kind = 0, shade = 1) {
  const ux = p1[0] - p0[0], uy = p1[1] - p0[1], uz = p1[2] - p0[2], vx = p2[0] - p0[0], vy = p2[1] - p0[1], vz = p2[2] - p0[2];
  let n = [uy * vz - uz * vy, uz * vx - ux * vz, ux * vy - uy * vx];
  const l = Math.hypot(n[0], n[1], n[2]) || 1; n = [n[0] / l, n[1] / l, n[2] / l];
  const out = n[0] * (p0[0] - inside[0]) + n[1] * (p0[1] - inside[1]) + n[2] * (p0[2] - inside[2]) >= 0;
  if (!out) n = [-n[0], -n[1], -n[2]];
  const i0 = vert(B, p0, n, kind, shade), i1 = vert(B, p1, n, kind, shade), i2 = vert(B, p2, n, kind, shade);
  if (out) B.idx.push(i0, i1, i2); else B.idx.push(i0, i2, i1);
}
// a four-sided spire from a square of half width `half` at y0 to a point at y1
function spire(B, half, y0, y1, ca = 0, cb = 0) {
  const c = [ca, y0, cb], top = [ca, y1, cb], q = [[1, 1], [-1, 1], [-1, -1], [1, -1]];
  for (let i = 0; i < 4; i++) { const a = q[i], b = q[(i + 1) % 4]; tri(B, [ca + a[0] * half, y0, cb + a[1] * half], [ca + b[0] * half, y0, cb + b[1] * half], top, c); }
}
// a course whose four sides lean in from a square of half width h0 at y0 to one of h1 at y1
function lean(B, h0, y0, h1, y1) {
  const q = [[1, 1], [-1, 1], [-1, -1], [1, -1]], c = [0, (y0 + y1) / 2, 0];
  for (let i = 0; i < 4; i++) { const a = q[i], b = q[(i + 1) % 4]; quad(B, [a[0] * h0, y0, a[1] * h0], [b[0] * h0, y0, b[1] * h0], [b[0] * h1, y1, b[1] * h1], [a[0] * h1, y1, a[1] * h1], c); }
}
// a small eight-faced ball of stone on a cap's point
function ball(B, y, r) {
  const c = [0, y, 0], e = [[r, 0], [0, r], [-r, 0], [0, -r]];
  for (let i = 0; i < 4; i++) { const a = e[i], b = e[(i + 1) % 4]; tri(B, [a[0], y, a[1]], [b[0], y, b[1]], [0, y + r * 1.2, 0], c); tri(B, [a[0], y, a[1]], [b[0], y, b[1]], [0, y - r * 1.2, 0], c); }
}
// the cap, from 1 m over the ring level to the tower's height: of the same pale stone as the shaft. Each of the four shapes
// is drawn in two or three ways by the bell's rank, so that neighbours of one shape are not alike
function layCap(B, t) {
  const hw = t.w / 2, y0 = t.ring + 1, H = t.h - y0, v = t.rank % 3;
  if (t.shape === 'spired') {
    // a low square drum with a lip, then the spire with a ball on its point
    const d = Math.min(2.2, H * 0.14), yS = y0 + d, h = hw - 0.3, top = t.h - 0.8, c = [0, yS, 0];
    box(B, -hw + 0.5, hw - 0.5, y0, yS, -hw + 0.5, hw - 0.5, 0, 1, 51);
    slab(B, hw - 0.2, yS - 0.3, yS);
    if (v === 0) {
      // four-sided, flaring at its base
      const yk = yS + (top - yS) * 0.14;
      lean(B, h, yS, h * 0.66, yk); spire(B, h * 0.66, yk, top);
    } else if (v === 1) {
      // in two stages: a steep lower stage that leans in to a lipped collar, and a slimmer point over it
      const yk = yS + (top - yS) * 0.4;
      lean(B, h, yS, h * 0.56, yk);
      box(B, -h * 0.56 - 0.22, h * 0.56 + 0.22, yk, yk + 0.4, -h * 0.56 - 0.22, h * 0.56 + 0.22, 0, 1, 63);
      spire(B, h * 0.5, yk + 0.4, top);
    } else {
      // four-sided, with a small gable at the base of each side
      spire(B, h, yS, top);
      const g = h * 0.42, yp = yS + 1.5 * g, back = h * (1 - 1.5 * g / (top - yS));
      for (let side = 0; side < 4; side++) {
        const L = sp(side, -g, h + 0.02, yS), R2 = sp(side, g, h + 0.02, yS), K = sp(side, 0, h + 0.02, yp), E = sp(side, 0, back - 0.05, yp);
        tri(B, L, R2, K, c); tri(B, L, K, E, [0, yS - 9, 0]); tri(B, R2, K, E, [0, yS - 9, 0]);
      }
    }
    ball(B, top + 0.25, 0.45);
    // a tall four-sided spire carries two belts of stone, a shade darker than its slopes
    const hb = v === 0 ? h * 0.66 : h, yb = v === 0 ? yS + (top - yS) * 0.14 : yS, Hs = top - yb;
    const ringAt = (f, e) => { const r = hb * (1 - f) + e, y = yb + Hs * f; return [[r, y, r], [-r, y, r], [-r, y, -r], [r, y, -r]]; };
    if (Hs > 9 && v !== 1) for (const f of [0.36, 0.68]) {
      const lo = ringAt(f, 0.13), hi = ringAt(f + 0.38 / Hs, 0.13), ins = ringAt(f + 0.38 / Hs, 0);
      for (let i = 0; i < 4; i++) { const j = (i + 1) % 4; quad(B, lo[i], lo[j], hi[j], hi[i], [0, yb + Hs * f, 0], 0, 0.78); quad(B, hi[i], hi[j], ins[j], ins[i], [0, yb, 0], 0, 0.78); }
    }
  } else if (t.shape === 'stepped') {
    // courses that step in, one to each 4 m of its height, four at the least; each has a lip, and a low point ends the last
    const n = Math.max(4, Math.ceil(H / 4)), taper = 0.72 + 0.05 * v, Hs = H - 0.9;
    let half = hw;
    for (let i = 0; i < n; i++) {
      half = hw * (1 - taper * i / n) - 0.15;
      const ya = y0 + Hs * i / n, yb = y0 + Hs * (i + 1) / n;
      // every second step carries a band of glazed tile under its lip, as the shaft carries its bands
      const band = i % 2 === v % 2 && yb - 0.3 - ya > 2 ? 0.9 : 0;
      box(B, -half, half, ya, yb - 0.3 - band, -half, half, 0, 1, 51);
      if (band) box(B, -half, half, yb - 0.3 - band, yb - 0.3, -half, half, 1, 1, 51);
      box(B, -half - 0.2, half + 0.2, yb - 0.3, yb, -half - 0.2, half + 0.2, 0, 1, 63);
    }
    spire(B, half + 0.2, y0 + Hs, t.h);
  } else if (t.shape === 'domed') {
    // a plain low round cap on a low square course with a lip: no bulge beyond the shaft and no point
    const r = hw - 0.3, LAT = 5, LON = 16, c = [0, y0, 0], yb = y0 + 0.8, Hd = H - 0.8;
    box(B, -hw + 0.1, hw - 0.1, y0, yb, -hw + 0.1, hw - 0.1, 0, 1, 59);
    const pt = (j, i) => { const ph = (j / LAT) * Math.PI / 2, a = (i / LON) * Math.PI * 2; return [r * Math.cos(ph) * Math.cos(a), yb + Hd * Math.sin(ph), r * Math.cos(ph) * Math.sin(a)]; };
    for (let j = 0; j < LAT; j++) for (let i = 0; i < LON; i++) {
      if (j === LAT - 1) tri(B, pt(j, i), pt(j, i + 1), [0, t.h, 0], c); else quad(B, pt(j, i), pt(j, i + 1), pt(j + 1, i + 1), pt(j + 1, i), c);
    }
  } else {
    // an open-work crown in stone: a tier of round-headed openings with the sky through them, a tier of slender piers
    // over it, a slab on each, and a short spire with its ball
    const h1 = H * 0.52, h2 = H * 0.8, a1 = hw - 0.5, a2 = hw * 0.48, o = a1 + 0.5, th = 0.8, yTop = y0 + h1 - 0.1, heads = v === 1 ? 3 : 2, mp = 0.5;
    for (const [sa, sb] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) {
      box(B, sa * a1 - 0.5, sa * a1 + 0.5, y0, yTop, sb * a1 - 0.5, sb * a1 + 0.5, 0, 1, 51);
      box(B, sa * a2 - 0.4, sa * a2 + 0.4, y0 + h1, y0 + h2, sb * a2 - 0.4, sb * a2 + 0.4, 0, 1, 51);
    }
    const span = 2 * (a1 - 0.5), w1 = (span - (heads - 1) * mp) / heads;
    for (let side = 0; side < 4; side++) for (let j = 0; j < heads; j++) {
      const c0 = -a1 + 0.5 + j * (w1 + mp), c1 = c0 + w1, yCrown = yTop - 0.5;
      roundHead(B, side, c0, c1, y0, yCrown, yTop, o, th);
      if (j) post(B, side, c0 - mp, c0, o, th, y0, yCrown - Math.min(w1 / 2, yCrown - y0 - 2) + 0.05, 0);
    }
    slab(B, a1 + 0.7, yTop, y0 + h1 + 0.5);
    slab(B, a2 + 0.5, y0 + h2 - 0.1, y0 + h2 + 0.4);
    spire(B, a2 + 0.2, y0 + h2 + 0.4, t.h - 0.8);
    ball(B, t.h - 0.55, 0.42);
  }
}
// how far a tower's axis stands from the route's line in plan (the knots joined straight), in metres, and the height the
// route has there; a tower whose walls stand within 40 m of the line carries the finer stone a near wall is read by
export function routeBy(t) {
  let best = 1e9, y = 0;
  for (let i = 0; i + 1 < KNOTS.length; i++) {
    const a = KNOTS[i], b = KNOTS[i + 1], dx = b[0] - a[0], dz = b[2] - a[2], l2 = dx * dx + dz * dz || 1;
    const u = Math.max(0, Math.min(1, ((t.x - a[0]) * dx + (t.z - a[2]) * dz) / l2)), d = Math.hypot(t.x - a[0] - u * dx, t.z - a[2] - u * dz);
    if (d < best) { best = d; y = a[1] + u * (b[1] - a[1]); }
  }
  return { dist: best, y };
}
export const isNear = (t) => routeBy(t).dist - t.w / 2 <= 40;
// one tower whole, laid into the buffer; `at` sets it at another place (the part shown alone)
export function layTower(B, t, at) {
  setTower(B, t, at);
  const L = ledgesOf(t);
  B.near = isNear(t);
  B.T.tw = [t.w / 2, L.yA, L.s, t.belfry];
  layShaft(B, t, L); layBelfry(B, t, B.near); layCap(B, t);
}

// ---------------------------------------------------------------- the stone's one shader
// lit and unlit by the key alone; courses and blocks painted; the steady wash of the face's cream on the face's own wall;
// the steady pools of the tower's own lamps; the tile's gloss and glint line; the far fade. Nothing in it reads the clock.
export function makeStoneMaterial() {
  return new THREE.ShaderMaterial({
    vertexShader: /* glsl */`
      attribute vec3 aLoc, aFace, aK; attribute vec4 aTw;
      varying vec3 vN, vWp, vLoc, vFace, vK; varying vec4 vTw;
      void main() {
        vec4 wp = modelMatrix * vec4(position, 1.);
        vWp = wp.xyz; vN = normalize(mat3(modelMatrix) * normal); vLoc = aLoc; vFace = aFace; vK = aK; vTw = aTw;
        gl_Position = projectionMatrix * viewMatrix * wp;
      }`,
    fragmentShader: /* glsl */`
      ${LIGHT_GLSL}
      varying vec3 vN, vWp, vLoc, vFace, vK; varying vec4 vTw;
      const vec3 STONE_L = ${v3(COLOURS.stoneLit)}, STONE_U = ${v3(COLOURS.stoneUnlit)};
      const vec3 TILE_L = ${v3(COLOURS.tileLit)}, TILE_U = ${v3(COLOURS.tileUnlit)}, GLINT = ${v3(COLOURS.tileGlint)};
      const vec3 IRON_L = ${v3(COLOURS.ironLit)}, IRON_U = ${v3(COLOURS.iron)};
      const vec3 CREAM1 = ${v3(CREAM, 1 / 3.4)}, LAMP1 = ${v3(COLOURS.lamp)};
      float hash12(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * .1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
      float vnoise(vec2 p) {
        vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
        return mix(mix(hash12(i), hash12(i + vec2(1., 0.)), f.x), mix(hash12(i + vec2(0., 1.)), hash12(i + vec2(1., 1.)), f.x), f.y);
      }
      void main() {
        vec3 N = normalize(vN);
        float s = max(0., dot(N, KEY)), kind = vK.x, wall = step(abs(N.y), .5);
        vec3 unlit = kind < .5 ? STONE_U : (kind < 1.5 ? TILE_U : IRON_U), lit = kind < .5 ? STONE_L : (kind < 1.5 ? TILE_L : IRON_L);
        unlit *= 1. + .38 * N.y;
        // an unlit wall stands under the open sky: lighter toward the tower's top, darker down between the house blocks
        unlit *= mix(1., mix(.8, 1.5, smooth01(vLoc.y / 110.)), wall);
        // stone in recess: inside the belfry, and whatever the buffer marks
        float hw = vTw.x, inner = step(max(abs(vLoc.x), abs(vLoc.z)), hw - .05) * step(vTw.w - .01, vLoc.y);
        float shade = (kind > .5 && kind < 1.5 ? 1. : vK.y) * mix(1., .6, inner);
        // the stone under a ledge is darkened to 0.6 of itself, easing out a metre below it: under the dial's ledge, the
        // three ledges below it and the belfry's floor (the ledges stand one spacing apart from the dial's own)
        float under = (vTw.y - .6) - vLoc.y, dl = under >= 0. && under < 3.5 * vTw.z ? mod(under, max(vTw.z, 1.)) : 9.;
        float ub = (vTw.w - .6) - vLoc.y;
        dl = ub >= 0. ? min(dl, ub) : dl;
        shade *= mix(.6, 1., smooth01(dl / 1.1));
        // each tower's stone is a little of its own tone (a twelfth lighter or darker at the most), read from its own measures
        float own = 1. + .16 * (hash12(vec2(vTw.y * 1.37, vTw.z * 7.1 + vTw.x)) - .5);
        vec3 col = mix(unlit, lit, s) * shade * (kind < .5 ? own : 1.);
        // derivatives are taken here, before any branch
        float cy = vLoc.y / .6, fw = max(fwidth(cy), 1e-4), row = floor(cy);
        float along0 = (vWp.x * -N.z + vWp.z * N.x) / 1.4, fa = max(fwidth(along0), 1e-4);
        vec2 sq = vLoc.xz / 1.2; float fsq = max(max(fwidth(sq.x), fwidth(sq.y)), 1e-4);
        if (kind < .5) {
          // courses 0.6 m high, their joints 12 in 100 darker; blocks of 1.4 m, each a little of its own tone
          float along = along0 + .5 * mod(row, 2.), blk = floor(along);
          float jy = smoothstep(.5 - .06 - fw, .5 - .06, abs(fract(cy) - .5));
          float jx = smoothstep(.5 - .025 - fa, .5 - .025, abs(fract(along) - .5));
          float fine = 1. - smooth01((fw - .3) / .6);
          float tone = (hash12(vec2(blk, row)) - .5) * .16 + (hash12(vec2(row, 7.)) - .5) * .06;
          // in the shade the courses are drawn stronger, so an unlit wall still reads as laid stone
          float amp = mix(2.4, 1., smooth01(s * 3.));
          col *= 1. + wall * fine * amp * (tone - .12 * max(jy, jx * .8)) - wall * (1. - fine) * .02;
          // the stone's relief: each course's upper edge catches a little light under its joint
          float edge = smoothstep(.28, .36, fract(cy) - .5) * (1. - jy);
          col *= 1. + wall * fine * .07 * edge;
          // weather: broad slow stains down and along the wall, so no wall is one flat tone
          col *= 1. + wall * (.16 * (vnoise(vec2(along0 * .35, cy * .12)) - .5) + .08 * (vnoise(vec2(along0 * 1.3 + 7., cy * .5)) - .5));
          // what looks up (ledges, steps, cornices) is laid in slabs of 1.2 m with dark joints
          vec2 sf = abs(fract(sq) - .5);
          float sj = max(smoothstep(.45 - fsq, .45, sf.x), smoothstep(.45 - fsq, .45, sf.y));
          col *= 1. + step(.5, N.y) * (1. - smooth01((fsq - .3) / .6)) * ((hash12(floor(sq) + 31.) - .5) * .2 - .2 * sj);
          // the stone's own grain, read only from close by
          float near1 = 1. - smooth01((fw - .02) / .06);
          col *= 1. + wall * near1 * .09 * (hash12(floor(vec2(along0 * 14., cy * 6.))) - .5);
        } else if (kind < 1.5) {
          // glazed tiles four rows to a band, each a little of its own gloss, with fine dark joints; then the tile's one
          // amber glint line, 0.15 m high, along the upper edge of a lit band
          float g = vK.y - 1.;
          vec2 tq = vec2(along0 * 3.733, g * 4.), tf = fract(tq);
          float tfine = 1. - smooth01((fa * 3.733 - .25) / .5);
          float tj = max(smoothstep(.44, .47, abs(tf.x - .5)), smoothstep(.44, .47, abs(tf.y - .5)));
          col *= 1. + wall * tfine * ((hash12(floor(tq)) - .5) * .7 - .45 * tj);
          col = mix(col, GLINT, smoothstep(.88, .9, g) * smooth01(s * 3.) * wall);
        }
        // the steady wash of the face's light on the face's own wall: 0.30 units at the dial's rim, nothing one dial's width
        // out, falling by the square; the stone answers the cream with its own honey, so the wall round a dial is warm
        float rr = length(vFace.xy);
        float wsh = clamp((3. - rr) / 2., 0., 1.);
        col += mix(CREAM1, STONE_L, .85) * (.30 * wsh * wsh * vK.z * step(-.2, vFace.z) * step(kind, .5));
        // the steady pools of the tower's lamps: twelve on three ledges (one at the middle of each side), four in the belfry
        vec2 q = abs(vLoc.xz); q = q.x > q.y ? q : q.yx;
        float kl = clamp(floor((vTw.y + .45 - vLoc.y) / max(vTw.z, 1.) + .5), 0., 2.), yl = vTw.y + .45 - kl * vTw.z;
        float d1 = length(vec3(q.x - (hw + .28), q.y, vLoc.y - yl));
        float pc = hw - clamp(.32 * hw, 1.2, 2.) - .15;
        float d2 = length(vec3(abs(vLoc.x) - pc, vLoc.y - (vTw.w + 1.5), abs(vLoc.z) - pc));
        // a ledge's lamp stands on its ledge: it lights the wall over the ledge and the ledge's top, and nothing under them
        float over = smoothstep(yl - .62, yl - .42, vLoc.y);
        // a lamp's light on the stone falls by the square of the distance from the lamp: brightest on the wall behind the
        // lantern (0.45 units), a fifth of a unit a metre out, nothing from 2.5 m
        float f1 = smooth01(1. - d1 / 2.5) / (1. + d1 * d1 / .81), f2 = smooth01(1. - d2 / 2.5) / (1. + d2 * d2 / .81);
        float pool = 1.5 * max(f1 * over, f2);
        col += LAMP1 * (.35 * pool * (kind > 1.5 ? .3 : 1.));
        gl_FragColor = vec4(farFade(col, vWp, cameraPosition, 1.), 1.);
      }`,
  });
}
// all the towers named, merged into one mesh; `yieldFn` hands the page back between towers; `at` (name -> [x, z]) sets a
// tower at another place (the part shown alone)
export async function makeTowerStone(towers, yieldFn, at = null) {
  const B = makeBuf();
  for (let i = 0; i < towers.length; i++) { layTower(B, towers[i], at ? at[towers[i].name] : null); if (yieldFn) await yieldFn(); }
  const geometry = await toGeometry(B, yieldFn);
  if (yieldFn) await yieldFn();
  const mesh = new THREE.Mesh(geometry, makeStoneMaterial());
  mesh.name = 'tower-stone'; mesh.frustumCulled = false;
  return { mesh, triangles: B.idx.length / 3, vertices: B.n };
}

// ---------------------------------------------------------------- the ninety faces: one instanced quad
// Each face is painted whole on its quad: a cream disc at its own level between rest and the top of its bell's stroke, the rim
// and twelve plain strokes of its own dial, both hands turning, and a halo of fixed size. No numerals and no letter form.
export function makeFaces(towers, clock, at = null) {
  const n = towers.length, g = new THREE.InstancedBufferGeometry(), q = new THREE.PlaneGeometry(2, 2);
  g.setAttribute('position', q.getAttribute('position')); g.setIndex(q.getIndex()); g.instanceCount = n;
  const iPos = new Float32Array(n * 3), iRight = new Float32Array(n * 4), iA = new Float32Array(n * 4), iD = new Float32Array(n * 4);
  towers.forEach((t, i) => {
    const [nx, nz] = dirOf(t.facing), cx = at ? at[t.name][0] : t.x, cz = at ? at[t.name][1] : t.z, o = t.w / 2 + 0.05;
    iPos.set([cx + nx * o, t.faceY, cz + nz * o], i * 3);
    iRight.set([nz, -nx, t.dial[4], 0], i * 4);
    iA.set([t.face / 2, t.interval, t.start, t.rank], i * 4);
    iD.set([DIAL.stroke[t.dial[0]], DIAL.width[t.dial[1]], t.dial[2], t.dial[3]], i * 4);
  });
  g.setAttribute('iPos', new THREE.InstancedBufferAttribute(iPos, 3)); g.setAttribute('iRight', new THREE.InstancedBufferAttribute(iRight, 4));
  g.setAttribute('iA', new THREE.InstancedBufferAttribute(iA, 4)); g.setAttribute('iD', new THREE.InstancedBufferAttribute(iD, 4));
  const material = new THREE.ShaderMaterial({
    uniforms: { uClock: clock }, transparent: true, depthWrite: false,
    blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor,
    vertexShader: /* glsl */`
      attribute vec3 iPos; attribute vec4 iRight, iA, iD;
      varying vec2 vUv; varying vec3 vWp; varying vec4 vA, vD; varying float vHand;
      void main() {
        vUv = position.xy * 1.3; vA = iA; vD = iD; vHand = iRight.z;
        vec3 wp = iPos + vec3(iRight.x, 0., iRight.y) * (vUv.x * iA.x) + vec3(0., 1., 0.) * (vUv.y * iA.x);
        vWp = wp; gl_Position = projectionMatrix * viewMatrix * vec4(wp, 1.);
      }`,
    fragmentShader: /* glsl */`
      ${LIGHT_GLSL}
      uniform float uClock;
      varying vec2 vUv; varying vec3 vWp; varying vec4 vA, vD; varying float vHand;
      const vec3 CREAM1 = ${v3(CREAM, 1 / 3.4)}, IRON = ${v3(COLOURS.iron)};
      const float RISE = ${SOUND.rise.toFixed(2)}, FALL = ${SOUND.fall.toFixed(2)}, REST = ${SOUND.rest.toFixed(2)}, TOP = ${SOUND.top.toFixed(2)};
      #define THIN(w) clamp(1.2 * (w) / px, 0., 1.)
      // a hand that points along +y from the hub: shape 0 a plain bar, 1 a tapered blade, 2 a bar with a short tail
      float hand(vec2 p, float ang, float len, float wid, float shape, float px) {
        float c = cos(ang), s = sin(ang); vec2 h = vec2(p.x * c - p.y * s, p.x * s + p.y * c);
        float tail = shape > 1.5 ? .2 * len : .04, hw = shape > .5 && shape < 1.5 ? wid * (1.25 - clamp(h.y / len, 0., 1.)) : wid * .6;
        float along = smoothstep(-tail - px, -tail, h.y) * (1. - smoothstep(len - px, len, h.y));
        return along * (1. - smoothstep(hw - px, hw, abs(h.x)));
      }
      void main() {
        float r = length(vUv), px = max(fwidth(vUv.x), fwidth(vUv.y)) * 1.2 + 1e-4;
        // the face's level: a soft rise of 1.5 s from its bell's stroke and a soft fall of 2 s, then rest
        float a = mod(uClock - vA.z, vA.y);
        float lev = a < RISE ? smooth01(a / RISE) : 1. - smooth01((a - RISE) / FALL);
        vec3 col = CREAM1 * (REST + (TOP - REST) * lev);
        // a line narrower than a pixel shows by the share of the pixel it fills (THIN), so a far dial is a cream disc with
        // faint marks and never a dark star
        // the rim: one line, two lines, or a line and an inner circle
        float ink = smoothstep(.95 - px, .95, r) * THIN(.05);
        ink = max(ink, step(.5, vD.w) * step(vD.w, 1.5) * smoothstep(.885 - px, .885, r) * (1. - smoothstep(.91, .91 + px, r)) * THIN(.025));
        ink = max(ink, step(1.5, vD.w) * smoothstep(.5 - px, .5, r) * (1. - smoothstep(.52, .52 + px, r)) * THIN(.02));
        // twelve plain strokes, every third half as long again on some dials
        float r1 = vD.w > .5 && vD.w < 1.5 ? .85 : .91;
        float th = atan(vUv.x + step(r, 1e-4) * 1e-3, vUv.y), k = floor(th / .5235988 + .5), dth = th - k * .5235988;
        float len = vD.x * (vD.z > .5 && mod(k + 12., 3.) < .5 ? 1.5 : 1.);
        float lat = abs(r * sin(dth)), rad = r * cos(dth);
        ink = max(ink, (1. - smoothstep(vD.y * .5, vD.y * .5 + px, lat)) * smoothstep(r1 - len - px, r1 - len, rad) * (1. - smoothstep(r1, r1 + px, rad)) * THIN(vD.y));
        // the hands: the long one once round in 90 s, the short one at a twelfth of that, each from an angle of its own;
        // sturdy iron (a bar of 0.08 and of 0.12 of the dial's radius across), so that both read on a dial of 40 px
        float longA = radians(360. * vA.z / vA.y + 4. * uClock), shortA = radians(30. * mod(vA.w, 12.)) + longA / 12.;
        ink = max(ink, hand(vUv, longA, .8, .065, vHand, px) * THIN(.078));
        ink = max(ink, hand(vUv, shortA, .52, .1, vHand, px) * THIN(.12));
        ink = max(ink, (1. - smoothstep(.09, .09 + px, r)) * THIN(.18));
        col = mix(col, IRON, ink);
        col = farFade(col, vWp, cameraPosition, .5);
        // the disc is solid; outside it the quad lays only the halo: 0.5 units at the rim, nothing at 1.15 radii, at the resting level
        float disc = 1. - smoothstep(1. - px, 1., r);
        vec3 halo = CREAM1 * (.5 * clamp((1.15 - r) / .15, 0., 1.));
        gl_FragColor = vec4(mix(halo, col, disc), disc);
      }`,
  });
  const mesh = new THREE.Mesh(g, material); mesh.name = 'faces'; mesh.frustumCulled = false; mesh.renderOrder = 2;
  return mesh;
}

// ---------------------------------------------------------------- the ninety bells: one instanced turned shape
// A bell of dark metal, its clapper and its headstock; it hangs in its own belfry as bellFit gives it and swings
// 28 degrees to either side about a level axis along the bearing its tower's face looks along, once through its arc in
// its own interval. A bell with room is 0.82 as tall as it is wide; a wide bell in a low belfry is cast squatter, so that
// every bell's lip stays inside its belfry's piers and over its floor at the end of its swing.
const BELL_TALL = 0.82, HEAD_LONG = 1.3;
function bellGeometry() {
  const prof = [[0.0, -0.03], [0.14, -0.035], [0.215, -0.07], [0.25, -0.13], [0.262, -0.22], [0.275, -0.34], [0.295, -0.46], [0.33, -0.58], [0.385, -0.68], [0.445, -0.76], [0.5, -0.82], [0.47, -0.82], [0.4, -0.74]];
  // parts: 0 the bell, 1 its clapper, 2 its headstock with two straps and the crown it is hung by
  const parts = [
    [new THREE.LatheGeometry(prof.map(([r, y]) => new THREE.Vector2(r, y)).reverse(), 24), 0],
    [new THREE.SphereGeometry(0.075, 8, 5).translate(0, -0.72, 0), 1],
    [new THREE.CylinderGeometry(0.02, 0.02, 0.66, 5).translate(0, -0.37, 0), 1],
    [new THREE.CylinderGeometry(0.09, 0.12, 0.08, 8).translate(0, -0.01, 0), 2],
    [new THREE.BoxGeometry(0.22, 0.2, HEAD_LONG).translate(0, 0.11, 0), 2],
    [new THREE.BoxGeometry(0.26, 0.25, 0.05).translate(0, 0.1, 0.14), 2],
    [new THREE.BoxGeometry(0.26, 0.25, 0.05).translate(0, 0.1, -0.14), 2],
  ];
  const pos = [], nor = [], part = [], idx = []; let base = 0;
  for (const [g, id] of parts) {
    const p = g.getAttribute('position'), nn = g.getAttribute('normal'), ix = g.getIndex();
    for (let i = 0; i < p.count; i++) { pos.push(p.getX(i), p.getY(i), p.getZ(i)); nor.push(nn.getX(i), nn.getY(i), nn.getZ(i)); part.push(id); }
    for (let i = 0; i < ix.count; i++) idx.push(base + ix.getX(i));
    base += p.count; g.dispose();
  }
  const out = new THREE.InstancedBufferGeometry();
  out.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); out.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  out.setAttribute('aPart', new THREE.Float32BufferAttribute(part, 1)); out.setIndex(idx);
  return out;
}
export function makeBells(towers, clock, at = null) {
  const n = towers.length, g = bellGeometry(); g.instanceCount = n;
  const iPos = new Float32Array(n * 3), iB = new Float32Array(n * 4), iS = new Float32Array(n * 3);
  towers.forEach((t, i) => {
    const [nx, nz] = dirOf(t.facing), cx = at ? at[t.name][0] : t.x, cz = at ? at[t.name][1] : t.z;
    const fit = bellFit(t);
    iPos.set([cx, t.belfry + fit.p, cz], i * 3);
    iB.set([t.bell, nx, nz, t.interval], i * 4); iS.set([t.start, t.rank, fit.k], i * 3);
  });
  g.setAttribute('iPos', new THREE.InstancedBufferAttribute(iPos, 3)); g.setAttribute('iB', new THREE.InstancedBufferAttribute(iB, 4)); g.setAttribute('iS', new THREE.InstancedBufferAttribute(iS, 3));
  const material = new THREE.ShaderMaterial({
    uniforms: { uClock: clock }, side: THREE.DoubleSide,
    vertexShader: /* glsl */`
      attribute vec3 iPos, iS; attribute vec4 iB; attribute float aPart;
      uniform float uClock;
      varying vec3 vN, vWp; varying float vPart, vY;
      vec3 turn(vec3 p, vec3 ax, float a) { float c = cos(a), s = sin(a); return p * c + cross(ax, p) * s + ax * dot(ax, p) * (1. - c); }
      void main() {
        // the swing: 28 degrees x sin(pi (t - start) / interval); the clapper leans a little further than the bell
        float th = radians(${SOUND.swing.toFixed(1)}) * sin(3.14159265 * (uClock - iS.x) / iB.w) * (aPart > .5 && aPart < 1.5 ? 1.22 : 1.);
        vec3 ax = vec3(iB.y, 0., iB.z);
        // the unit bell is turned so that its headstock lies along the axis, then scaled to its width and swung
        vec3 p = vec3(position.x * iB.z + position.z * iB.y, position.y * iS.z, -position.x * iB.y + position.z * iB.z);
        vec3 nn = normalize(vec3(normal.x * iB.z + normal.z * iB.y, normal.y / iS.z, -normal.x * iB.y + normal.z * iB.z) + vec3(0., 1e-5, 0.));
        vec3 wp = iPos + turn(p * iB.x, ax, th);
        vN = turn(nn, ax, th); vWp = wp; vPart = aPart; vY = position.y;
        gl_Position = projectionMatrix * viewMatrix * vec4(wp, 1.);
      }`,
    fragmentShader: /* glsl */`
      ${LIGHT_GLSL}
      varying vec3 vN, vWp; varying float vPart, vY;
      const vec3 BELL = ${v3(COLOURS.bell)}, RIM = ${v3(COLOURS.bellRim)}, IRON_U = ${v3(COLOURS.iron)}, IRON_L = ${v3(COLOURS.ironLit)}, LAMP1 = ${v3(COLOURS.lamp)};
      const vec3 FILL = ${v3(COLOURS.fillUp)};
      void main() {
        vec3 N = normalize(vN);
        float front = gl_FrontFacing ? 1. : 0.;
        if (front < .5) N = -N;
        float s = max(0., dot(N, KEY));
        // dark metal, a little of the dusk's violet on what looks up, so that the round reads; the warm rim is the bell's own
        // rim, its lowest band, on the side toward the west; above it the west leaves one narrow streak of gloss; the
        // moulded lines a bell is cast with
        float edge = smooth01((s - .45) / .55), rim = 1. - smoothstep(-.7, -.6, vY);
        float band = (1. - smoothstep(.0, .012, abs(vY + .135))) + (1. - smoothstep(.0, .01, abs(vY + .61))) + (1. - smoothstep(.0, .01, abs(vY + .655)));
        vec3 metal = BELL * (1. + .5 * band) + FILL * (.05 * (.35 + .65 * max(0., N.y)) + .03 * band);
        float gloss = smooth01((s - .86) / .14);
        vec3 col = vPart < .5 ? mix(metal, RIM, front * max(edge * rim, .3 * gloss * gloss)) : mix(IRON_U, IRON_L, s) + FILL * (.03 * max(0., N.y));
        float lip = vPart < .5 ? 1. - smoothstep(-.81, -.6, vY) : 0.;
        col += LAMP1 * (.3 * lip * lip * mix(.35, 1., front));
        col *= mix(.55, 1., max(front, step(.5, vPart)));
        gl_FragColor = vec4(farFade(col, vWp, cameraPosition, 1.), 1.);
      }`,
  });
  const mesh = new THREE.Mesh(g, material); mesh.name = 'bells'; mesh.frustumCulled = false;
  return mesh;
}

// ---------------------------------------------------------------- each tower's lamps (sixteen at the most): one instanced point
// Twelve stand on its ledges (one at the middle of each side on the three ledges under its dial) and four in its belfry (one on
// the inner side of each corner pier, 1.5 m over the floor). Steady warm points, each at its own place, half a metre across and
// never under two pixels; none comes on and none takes the clock. The stone's shader paints each one's pool from the same sums.
export function lampsOf(t) {
  const L = ledgesOf(t), hw = t.w / 2, out = [], pc = hw - Math.max(1.2, Math.min(2, 0.16 * t.w)) - 0.15;
  for (let j = 0; j < 3; j++) {
    const y = L.yA - j * L.s;
    if (!L.ys.some((v) => Math.abs(v - y) < 0.01)) continue;
    for (let side = 0; side < 4; side++) out.push(sp(side, 0, hw + 0.28, y + 0.45));
  }
  for (const [sa, sb] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) out.push([sa * pc, t.belfry + 1.5, sb * pc]);
  return out;
}
export function makeLamps(towers, uH, at = null) {
  // per lamp: its place, and how it is carried (1 on a short post from its ledge, -1 hung by a rod in the belfry)
  const list = [];
  for (const t of towers) {
    const [nx, nz] = dirOf(t.rot), cx = at ? at[t.name][0] : t.x, cz = at ? at[t.name][1] : t.z, L = lampsOf(t);
    L.forEach(([a, y, b], k) => list.push(cx + a * nx - b * nz, y, cz + a * nz + b * nx, k < L.length - 4 ? 1 : -1));
  }
  const g = new THREE.InstancedBufferGeometry(), q = new THREE.PlaneGeometry(2, 2);
  g.setAttribute('position', q.getAttribute('position')); g.setIndex(q.getIndex()); g.instanceCount = list.length / 4;
  g.setAttribute('iL', new THREE.InstancedBufferAttribute(new Float32Array(list), 4));
  // A LANTERN, painted whole on one upright quad a metre high that turns about its own place to the eye: a pane of warm
  // glass (0.22 by 0.32 m, brightest at its middle), a cap and a foot of dark iron, its post or rod, and the pane's own
  // small shine on the air round it (0.3 m). From far, where the quad is a few pixels, it is the plain warm point it was
  // (half a metre across, never under two pixels): the painted lantern comes in by the quad's own size in pixels.
  const mesh = new THREE.Mesh(g, new THREE.ShaderMaterial({
    uniforms: { uH }, transparent: true, depthWrite: false,
    blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor,
    vertexShader: /* glsl */`
      attribute vec4 iL; uniform float uH; varying vec2 vM; varying vec3 vWp; varying float vPx, vFar, vHang;
      void main() {
        vec4 mv = viewMatrix * modelMatrix * vec4(iL.xyz, 1.);
        float pxPerM = projectionMatrix[1][1] * uH * .5 / max(-mv.z, .5);
        // half the quad in metres: half a metre, or the least point's half (one pixel of a 450 px picture) where that is more
        float least = uH / 450. / pxPerM, h = max(.5, least);
        vec3 up = normalize((viewMatrix * vec4(0., 1., 0., 0.)).xyz), side = cross(up, vec3(0., 0., 1.));
        float sl = length(side); side = sl > 1e-3 ? side / sl : vec3(1., 0., 0.);
        mv.xyz += (side * position.x + up * position.y) * h;
        vM = position.xy * h; vPx = pxPerM; vFar = max(.25, least); vHang = iL.w; vWp = (modelMatrix * vec4(iL.xyz, 1.)).xyz;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */`
      ${LIGHT_GLSL}
      varying vec2 vM; varying vec3 vWp; varying float vPx, vFar, vHang;
      const vec3 LAMP = ${v3(COLOURS.lamp)}, IRON = ${v3(COLOURS.iron)};
      // a box about c with half sizes b: 1 inside, eased over one pixel
      float box(vec2 p, vec2 c, vec2 b, float e) { vec2 d = abs(p - c) - b; return 1. - clamp(max(d.x, d.y) / e + .5, 0., 1.); }
      void main() {
        float e = 1. / max(vPx, 1e-3);
        // the far point: a warm disc of the lamp's own least size
        float aFar = 1. - smoothstep(.55, 1., length(vM) / vFar);
        // the lantern: pane, cap (narrowing upward), finial, foot, and its post below or its rod above
        float pane = box(vM, vec2(0.), vec2(.11, .16), e);
        float capW = mix(.16, .04, clamp((vM.y - .16) / .11, 0., 1.));
        float iron = max(box(vM, vec2(0., .215), vec2(capW, .055), e), box(vM, vec2(0., .30), vec2(.02, .03), e));
        iron = max(iron, box(vM, vec2(0., -.18), vec2(.14, .02), e));
        iron = max(iron, vHang > 0. ? box(vM, vec2(0., -.325), vec2(.03, .125), e) : box(vM, vec2(0., .415), vec2(.015, .085), e));
        vec2 dq = max(abs(vM) - vec2(.11, .16), 0.);
        float shine = smooth01(1. - length(dq) / .3); shine *= shine * .45;
        float core = clamp(1. - length(vM / vec2(.11, .16)), 0., 1.);
        vec3 near = mix(LAMP * shine, IRON, iron); float aNear = iron;
        near = mix(near, LAMP * (1. + .8 * core), pane); aNear = max(aNear, pane);
        // the painted lantern comes in where the quad's metre is 9 pixels or more, whole from 18
        float k = smooth01((vPx - 9.) / 9.);
        vec3 col = mix(LAMP * aFar, near, k); float a = mix(aFar, aNear, k);
        gl_FragColor = vec4(farFade(col, vWp, cameraPosition, 1.), a);
      }`,
  }));
  mesh.name = 'tower-lamps'; mesh.frustumCulled = false; mesh.renderOrder = 3;
  return mesh;
}

// ---------------------------------------------------------------- the hero
// opts.city: true builds all ninety at their places (the place's main file asks for this); without it three unlike towers of the
// rows stand side by side at their true sizes (the part shown alone). opts.clock: the place's one clock (a uniform object);
// without it the part keeps a clock of its own from the seconds it is given. opts.towers: names, in place of the three.
export async function buildHero(ctx, opts = {}) {
  const clock = opts.clock || makeClock(), object = new THREE.Group();
  object.name = 'dial-towers';
  let towers = opts.only ? TOWERS.filter((t) => opts.only.includes(t.name)) : TOWERS, at = null;
  if (!opts.city) {
    const names = opts.towers || ['O1', 'O2', 'B5a'];
    towers = names.map((n) => TOWERS.find((t) => t.name === n)).filter(Boolean);
    // side by side along the north-south line, the middle one a little forward, so that the lit west sides and the faces
    // are seen together and no bearing sets all three in one line
    at = {}; towers.forEach((t, i) => { const k = i - (towers.length - 1) / 2; at[t.name] = [k === 0 ? -7 : 5, k * 22]; });
  }
  const yieldFn = ctx && ctx.yield ? () => ctx.yield() : null;
  const stone = await makeTowerStone(towers, yieldFn, at);
  object.add(stone.mesh);
  if (yieldFn) await yieldFn();
  const faces = makeFaces(towers, clock, at); object.add(faces);
  if (yieldFn) await yieldFn();
  const bells = makeBells(towers, clock, at); object.add(bells);
  // the lamps' least size is in pixels of the picture's height, read from the renderer each frame
  const uH = { value: 450 }, size = new THREE.Vector2();
  const lamps = makeLamps(towers, uH, at); object.add(lamps);
  return {
    object, radius: opts.city ? 420 : 40, height: opts.city ? 120 : 108, center: new THREE.Vector3(0, opts.city ? 60 : 70, 0),
    anchors: {}, clock, towers, stone, faces, bells,
    lamps,
    update(dt, seconds) {
      if (!opts.clock) clock.value = seconds;
      if (ctx && ctx.renderer) { ctx.renderer.getDrawingBufferSize(size); uH.value = size.y; }
    },
    dispose() {},
    ground: !opts.city, groundY: GROUND_Y - 1,
  };
}
