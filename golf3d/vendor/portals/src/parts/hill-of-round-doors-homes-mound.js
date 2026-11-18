// hill-of-round-doors, the homes: THE MOUND'S OWN DRESS, so that a home is whole from its sides and its back. Over
// the lip and the mound behind it stand tufts of grass (thickest where the lip sinks into the mound and down the two
// flanks) and small wild flowers in little companies; at the flanks stand small things of the household: a stack of
// split logs between two stakes, a water butt at the front's foot, two white beehives on a stand, hollyhocks against
// the turf, and on some homes a small round window looking out of the mound's side, its pane lit from within.
// All by PLACE and by dice from a stream of the home's own ('mound-<n>'); `clear` is asked before anything stands.
import { frontTop, groundY } from './hill-of-round-doors-plan.js';
import { KIND, mul, mix } from './hill-of-round-doors-homes-geo.js';
import { layWindow } from './hill-of-round-doors-homes-front.js';
import * as PL from './hill-of-round-doors-homes-plants.js';

const LIP_UP = 0.14;
const OAK = [0.3, 0.2, 0.11], CUT = [0.62, 0.47, 0.27], WHITE = [0.84, 0.83, 0.78];
const WILD = [[0.93, 0.93, 0.88], [0.95, 0.76, 0.1], [0.93, 0.93, 0.88], [0.86, 0.4, 0.6], [0.5, 0.55, 0.9]];

// the outline's outward normal (in the front's plane) u metres along the front
function normalAt(home, u) {
  const e = 0.05, a = Math.max(-home.w + 1e-3, u - e), b = Math.min(home.w - 1e-3, u + e), dy = (frontTop(home, b) - frontTop(home, a)) / (b - a);
  const l = Math.hypot(dy, 1); return [-dy / l, 1 / l];
}
// the ground over a home's garden level at (u, v) of its own space (v: metres behind the front line)
const gAt = (home, u, v) => groundY(home.x + home.fz * u - home.fx * v, home.z - home.fx * u - home.fz * v) - home.y;
// a place on a home's roof of turf: before 2.3 m behind the front it is the lip, behind that the plan's ground (sunk
// a little down the flanks, where the land's mesh cuts the mound's round foot short). Returns [x, y, z, nx, ny, sunk].
function roofAt(home, u, v) {
  const n = normalAt(home, u);
  if (v < 2.3) { const k = v < 0.6 ? LIP_UP : LIP_UP - 0.08 * (v - 0.6) / 1.6; return [u + n[0] * k, frontTop(home, u) + n[1] * k, -v, n[0], n[1], 0]; }
  const sunk = 0.04 + 0.3 * Math.min(1, Math.max(0, (Math.abs(u) - (home.w - 1.5)) / 1.2));
  return [u, gAt(home, u, v) - sunk, -v, n[0], n[1], sunk];
}

// a tuft of grass: n blades from one root, each a triangle the wind stirs; big: how long they stand; sunk: how far
// the root lies under the turf
function tuft(G, x, y, z, nx, ny, r, col, n, big, sunk = 0) {
  for (let b = 0; b < n; b++) {
    const a = r() * 6.283, len = big * (0.24 + 0.26 * r()), wd = 0.05 + 0.05 * r(), tone = 0.85 + 0.4 * r();
    const dx = nx * 0.5 + Math.cos(a) * 0.38, dy = ny * 0.5 + 0.62, dz = Math.sin(a) * 0.38, px = -Math.sin(a) * wd, pz = Math.cos(a) * wd;
    const root = mul(col, 0.8 * tone), tip = mix(mul(col, 1.35 * tone), [0.55 * tone, 0.52 * tone, 0.18 * tone], 0.25);
    const v0 = G.vert(x - px, y, z - pz, nx * 0.5, 0.85, 0, root, KIND.LEAF), v1 = G.vert(x + px, y, z + pz, nx * 0.5, 0.85, 0, root, KIND.LEAF);
    const v2 = G.vert(x + dx * len, y + dy * (len + sunk), z + dz * len, nx * 0.5, 0.85, 0, tip, KIND.LEAF, 0, 0, 0, 0.08 + 0.2 * len);
    G.tri(v0, v1, v2);
  }
}

// a stack of split logs lying front to back between two stakes, its cut ends pale; at the frame's origin, 1.5 m broad
function woodpile(G, r) {
  let row = 0, y = 0.17;
  for (const count of [4, 3, 2]) {
    for (let i = 0; i < count; i++) {
      const x = -0.54 + row * 0.18 + i * 0.36, rad = 0.16 + 0.03 * r(), len = 0.95 + 0.25 * r(), bark = mul(OAK, 0.8 + 0.5 * r());
      G.tube([x, y, 0.5], [x, y, 0.5 - len], rad, rad, 5, bark, KIND.PAINT, 0, { cb: bark });
      for (const z of [0.5, 0.5 - len]) G.ring(x, y, z, 0, rad, 5, mul(CUT, 1.1), CUT, KIND.PAINT);
    }
    row++; y += 0.3;
  }
  for (const x of [-0.78, 0.78]) G.box(x - 0.05, -0.2, 0.0, x + 0.05, 0.95, 0.1, OAK, KIND.PAINT, 0, { skip: 'b' });
}
// a water butt: a tarred barrel of staves with two hoops, brim-full
function butt(G) {
  const wood = [0.2, 0.15, 0.1], iron = [0.07, 0.07, 0.08];
  G.tube([0, -0.1, 0], [0, 0.5, 0], 0.36, 0.43, 8, mul(wood, 0.7), KIND.BOARDS, 0.2, { cb: wood });
  G.tube([0, 0.5, 0], [0, 1.05, 0], 0.43, 0.37, 8, wood, KIND.BOARDS, 0.2, { cb: mul(wood, 1.15) });
  for (const y of [0.22, 0.8]) G.tube([0, y, 0], [0, y + 0.06, 0], 0.435, 0.435, 8, iron, KIND.PAINT);
  const top = []; for (let k = 0; k < 8; k++) { const t = k / 8 * 6.283; top.push([Math.cos(t) * 0.34, 1.0, -Math.sin(t) * 0.34]); }
  G.poly(top, [0.1, 0.16, 0.2], KIND.PAINT, 0, { out: [0, 1, 0] });
}
// two white beehives on a low stand: three boxes each, a board lid, a dark slit of a door low on the front
function hives(G) {
  G.box(-0.85, 0.0, -0.3, 0.85, 0.2, 0.3, OAK, KIND.PAINT, 0, { skip: 'b' });
  for (const x of [-0.42, 0.42]) {
    for (let k = 0; k < 3; k++) G.box(x - 0.27, 0.2 + k * 0.27, -0.25, x + 0.27, 0.45 + k * 0.27, 0.25, mul(WHITE, k % 2 ? 0.93 : 1), KIND.BOARDS, 0.3, { skip: 'bt', low: mul(WHITE, 0.75) });
    G.box(x - 0.33, 1.01, -0.31, x + 0.33, 1.08, 0.31, mul(OAK, 1.6), KIND.PAINT, 0, { skip: 'b' });
    G.box(x - 0.09, 0.22, 0.25, x + 0.09, 0.25, 0.262, [0.03, 0.03, 0.03], KIND.PAINT, 0, { skip: 'k' });
  }
}

// The dress of one home's mound. tier: 'near', 'mid', 'far' or 'top' (how richly, by the home's place); clear(x, y, z)
// in the home's own space: whether a thing may stand there (the flown line's clear air).
export function layMound(G, home, d, r, tier, clear) {
  const w = home.w, sw = d.sward || d.turf, top = tier === 'top';
  // ---- tufts: a good third of them where the lip sinks into the mound, a fifth on the lip, the rest over the
  // mound's back; a third of all keep to the two flanks
  const nT = top ? 90 : tier === 'near' ? 46 : tier === 'mid' ? 26 : 8;
  for (let i = 0; i < nT; i++) {
    const t = r(), q = r(), flank = r() < 0.34, e = r(), u = flank ? (r() < 0.5 ? -1 : 1) * (w - 0.2 - 1.7 * e * e) : (e * 2 - 1) * (w - 0.3);
    const v = t < 0.36 ? 2.0 + 1.5 * q : t < 0.56 ? -0.25 + 2.2 * q : 3.5 + 5 * q, p = roofAt(home, u, v), big = 1.3 + 0.9 * r();
    // (one in seven is a tussock of long grass)
    if (clear(p[0], p[1], p[2])) { if (i % 7 === 3) tuft(G, p[0], p[1], p[2], p[3], p[4], r, sw, 5, big * 1.4, p[5]); else tuft(G, p[0], p[1], p[2], p[3], p[4], r, sw, tier === 'far' ? 2 : 3, big, p[5]); }
  }
  // ---- small wild flowers in the turf, in companies of one colour (daisies have a yellow eye)
  const nF = top ? 9 : tier === 'near' ? 5 : tier === 'mid' ? 4 : 2;
  for (let i = 0; i < nF; i++) {
    const u0 = (r() * 2 - 1) * (w - 1.6), v0 = 0.1 + 7.6 * r(), ci = Math.floor(r() * WILD.length), col = WILD[ci], n = 3 + Math.floor(r() * 3);
    for (let k = 0; k < n; k++) {
      const p = roofAt(home, u0 + (r() - 0.5) * 1.1, v0 + (r() - 0.5) * 1.1), hgt = 0.2 + 0.14 * r(), rad = 0.15 + 0.09 * r();
      if (!clear(p[0], p[1], p[2])) continue;
      PL.flower(G, p[0] + p[3] * hgt, p[1] + p[4] * hgt + p[5] + 0.02, p[2], p[3] * 0.6, p[4] * 0.6 + 0.5, 0.35, rad, 5, ci % 2 ? mul(col, 0.8) : WILD[1], col, 0.03);
    }
  }
  if (top || tier === 'far') return;
  // ---- the household's small things at the flanks: at most one a flank (a mid home: one flank only), by dice
  let windowed = false;
  for (const s of [-1, 1]) {
    const pick = r() * (tier === 'mid' ? 1.25 : 1), jv = r(), seed = r(), hue = r();
    if (tier === 'mid' && (s < 0) === (seed < 0.5)) continue;
    // (they stand on the level strip beside the front's foot, behind the front line and clear of the garden's fence)
    const place = (x, v, yaw) => { const gy = gAt(home, x, v); if (!clear(x, gy + 1, -v)) return false; G.pushYaw(x, gy, -v, Math.sin(yaw), Math.cos(yaw)); return true; };
    if (pick < 0.24) { if (place(s * (w + 0.95), 0.75 + 0.5 * jv, 0)) { woodpile(G, r); G.pop(); } }
    else if (pick < 0.4) { if (place(s * (w + 0.62), 0.55, 0)) { butt(G); G.pop(); } }
    else if (pick < 0.58) { if (place(s * (w + 1.75), 0.7 + 0.5 * jv, s * 1.1)) { hives(G); G.pop(); } }
    else if (pick < 0.76) {
      for (let k = 0; k < 3; k++) { const hh = 1.5 + 0.7 * r(), col = PL.BLOOMS.hollyhock[Math.floor(r() * PL.BLOOMS.hollyhock.length)]; if (place(s * (w + 0.45 + 0.2 * r()), 0.4 + k * 0.6 + 0.25 * r(), 0)) { PL.hollyhock(G, 0, 0, hh, col, r); G.pop(); } }
    } else if (!windowed) {
      // a small round window looking out of the mound's shoulder, a metre over the hillside that rises beside the
      // mound there: the front's own kind of window in a short collar of the arch's course, its pane lit from within
      const v = 2.6 + 0.7 * hue, y = Math.max(1.45, gAt(home, s * (w + 0.8), v) + 1.05) + 0.3 * jv, k = 0.5;      // (k: the frame stands half a metre out of the turf, so that its pane is clear of it)
      if (y > home.h - 1.7) continue;
      const u = s * w * Math.sqrt(1 - Math.pow(y / home.h, 1 / 0.7)), n = normalAt(home, u);
      if (!clear(u, y, -v)) continue;
      G.push(new G.THREE.Matrix4().set(0, -s * n[1], n[0], u + n[0] * k, 0, s * n[0], n[1], y + n[1] * k, -s, 0, 0, -v, 0, 0, 0, 1));
      G.barrel(0, 0, 0.72, -0.8, 0.02, 10, mul(d.course, 0.6), d.course, d.courseKind, 0, false);
      layWindow(G, d, { x: 0, y: 0, r: 0.55, seg: 10, seed: 0.2 + 0.7 * seed }, false);
      G.pop(); windowed = true;
    }
  }
}
