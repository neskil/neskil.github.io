// hill-of-round-doors, the homes: what the seed deals to each home. Every home takes a stream of its own
// ('home-' + its number in the plan) for its front: wall (brick, stone, plaster or boards), the course round the
// arch, the door's rim, window count and places, chimney; the door colours come from one stream ('door-paints')
// walked in the order the homes stand along the lanes, so that no two neighbours are alike. Green is kept for the
// last door alone.
import { DOOR, routeOver } from './hill-of-round-doors-plan.js';
import { KIND, lin, mul } from './hill-of-round-doors-homes-geo.js';
import { outlineOf } from './hill-of-round-doors-homes-front.js';

const PAINTS = ['#f8c406', '#1f56d8', '#d62a16', '#84228c', '#f67a0a', '#f7f4ea'];      // yellow, blue, red, plum, orange, white: green is the last home's alone
export const GREEN = '#1f7a2c';
const WALLS = [
  { kind: KIND.BRICK, cols: ['#b9583c', '#a94e38', '#c4694a'], course: ['stone', 'brickdark'] },
  { kind: KIND.STONE, cols: ['#cdbb90', '#bfae8a', '#d6c8a2'], course: ['brick', 'stonepale'] },
  { kind: KIND.PLASTER, cols: ['#eadcbb', '#e6cf9f', '#f1e7cf'], course: ['brick', 'stone'] },
  { kind: KIND.BOARDS, cols: ['#9a7650', '#86684a'], course: ['stone', 'brick'] },
];
const COURSES = {
  stone: { kind: KIND.STONE, col: '#d9cfb2' }, stonepale: { kind: KIND.STONE, col: '#e6dec6' },
  brick: { kind: KIND.BRICK, col: '#b85a3e' }, brickdark: { kind: KIND.BRICK, col: '#8e4432' },
};
const FRAMES = ['#f1ead6', '#f6f0e2', '#e9dfc2'];

// how rich a home is built: by its PLACE (the plan's distance from the flown line over the ground), never by the lens
export function tierOf(home) {
  if (home.kind === 'top') return 'top';
  const d = routeOver(home.x, home.z).dist;
  return d < 20 ? 'near' : d < 60 ? 'mid' : 'far';
}

// the door colours: one draw for each home in lane order; a colour equal to either of the two before it steps on
export function dealPaints(THREE, homes, rng) {
  const order = [9, 10, 0, 1, 2, 3, 4, 8, 5, 6, 7, 13, 14, 11, 12, 15, 16, 17, 18], out = new Array(homes.length).fill(null);
  let p1 = -1, p2 = -1;
  for (const i of order) {
    let k = rng.int(0, PAINTS.length - 1);
    for (let t = 0; t < PAINTS.length && (k === p1 || k === p2); t++) k = (k + 1) % PAINTS.length;
    out[i] = lin(THREE, PAINTS[k]); p2 = p1; p1 = k;
  }
  for (let i = 0; i < homes.length; i++) if (!out[i]) out[i] = lin(THREE, GREEN);       // the last home
  return out;
}

// does a round thing of radius rad at (x, y) stand clear inside the front's arch (under the course) and over the ground?
function fits(O, x, y, rad) {
  if (y - rad < 0.6) return false;
  let best = Infinity;
  for (const p of O) { const d = Math.hypot(p.x - x, p.y - y); if (d < best) best = d; }
  return best > rad + 0.5 + 0.22;
}

export function dealHome(THREE, home, i, rng, look, paint) {
  const tier = tierOf(home), top = tier === 'top', rich = tier === 'near' || top;
  const W = top ? WALLS[rng.int(0, 1)] : WALLS[rng.int(0, WALLS.length - 1)];
  const wallCol = rng.pick(W.cols), courseName = rng.pick(W.course), CO = COURSES[courseName];
  const rimPick = rng.int(0, 2), frame = rng.pick(FRAMES), hinge = rng.sign(), tone = rng.range(0.92, 1.06);
  const r = top ? DOOR.topR : DOOR.r, cy = DOOR.sill + r;
  const seg = rich ? 40 : tier === 'mid' ? 28 : 20, n = rich ? 40 : tier === 'mid' ? 28 : 20;
  const O = outlineOf(home, 64), rimW = top ? 0.9 : 0.46;
  // windows: the dice of every candidate first, then the tests
  const holes = [], windows = [], sides = [-1, 1];
  for (const s of sides) {
    const count = top ? 2 : 1 + (rng() < 0.45 ? 1 : 0);
    const dice = []; for (let k = 0; k < 2; k++) dice.push({ r: rng.range(0.74, 0.92), gap: rng.range(0.38, 0.7), y: rng.range(2.0, 2.7), seed: rng() });
    let edge = r + rimW;
    for (let k = 0; k < count; k++) {
      const dd = dice[k]; let wr = (k === 0 ? dd.r : dd.r * 0.72) * (top ? 1.18 : 1), ok = false, x = 0, y = k === 0 ? dd.y : dd.y - 0.45;
      if (top) y += 0.3;
      for (let t = 0; t < 7 && !ok; t++) { x = s * (edge + dd.gap + wr + 0.17); ok = fits(O, x, y, wr + 0.17); if (!ok) { wr *= 0.9; y -= 0.12; } }
      if (!ok || wr < 0.42) break;
      windows.push({ x, y, r: wr, seg: rich ? 20 : tier === 'mid' ? 14 : 10, seed: dd.seed + (top ? 2 : 0) });   // (over 1.5: the last home's panes, alight at every hour)
      holes.push({ x, y, r: wr, seg: rich ? 20 : tier === 'mid' ? 14 : 10 });
      edge = Math.abs(x) + wr + 0.17;
    }
  }
  holes.unshift({ x: 0, y: cy, r, seg });
  // (the last home's stack stands well back up the hill behind its hall, 16 m and more behind the front: there its
  // pots are over 13 m from the flown line, so that its smoke may rise by the smoke's own rule of clear air)
  const cs = rng.sign(), chimney = { x: cs * (top ? rng.range(8.9, 9.6) : rng.range(1.6, home.w * 0.5)), v: rng.range(3.4, 5.2) + (top ? 12.9 : 0), w: rng.range(1.35, 1.7) * (top ? 1.25 : 1), h: rng.range(2.5, 3.3), pots: rng.int(1, 2) };
  const lipTint = []; for (let k = 0; k < 9; k++) lipTint.push(rng.range(0.86, 1.12));
  // the fringe's blades and the sod's cut edge: the look's own turf, lifted a little so that the blades catch the
  // light (the lip's top itself wears the look's turf as the ground does: `sward` below)
  const tl = 0.2126 * look.turf.r + 0.7152 * look.turf.g + 0.0722 * look.turf.b, turf = [look.turf.r, look.turf.g, look.turf.b].map((c) => (c * 0.96 + tl * 0.04) * 1.38);
  // a pale rim round every door (dressed stone, or limewash), so that the round of colour shows from across the valley
  const rimDeal = top ? { kind: KIND.STONE, col: '#ece3cb', par: 1 } : [{ kind: KIND.STONE, col: '#e9dfc6', par: 1 }, { kind: KIND.PAINT, col: '#f6f0de', par: 0 }, { kind: KIND.STONE, col: '#f0e9d6', par: 1.3 }][rimPick];
  return {
    tier, n, wall: mul(lin(THREE, wallCol), tone), wallKind: W.kind, wallPar: W.kind === KIND.BOARDS ? 0.5 : 0,
    course: lin(THREE, CO.col), courseKind: CO.kind, rim: lin(THREE, rimDeal.col), rimKind: rimDeal.kind, rimPar: rimDeal.par,
    paint, frame: lin(THREE, frame), sill: lin(THREE, '#cfc4a8'), brass: lin(THREE, '#e8b23a'), iron: lin(THREE, '#1c1c20'), hinge,
    door: { r, y: cy, seg, rimW, board: top ? 1.04 : 0.84, knob: top ? 0.26 : 0.2, detail: rich }, holes, windows, chimney,
    stack: lin(THREE, CO.kind === KIND.BRICK ? CO.col : '#b85a3e'), stackKind: KIND.BRICK, stackPar: 0, pot: lin(THREE, '#c2643c'), turf, lipTint,
    sward: [look.turf.r, look.turf.g, look.turf.b],          // the look's own turf, as the ground wears it: for the lip's top and the roof
  };
}

// The look as the world hands it over (design, section 8), read once: colours as Colors, the sun as a unit vector,
// numbers within their ranges; a field left out takes the golden evening's value.
export function readLook(THREE, look = {}) {
  const col = (c, d) => (c && c.isColor ? c.clone() : Array.isArray(c) ? new THREE.Color(c[0], c[1], c[2]) : new THREE.Color(c ?? d));
  const s = look.sun, v = new THREE.Vector3(-0.72, 0.26, 0.64);
  if (s && s.isVector3) v.copy(s); else if (Array.isArray(s)) v.set(s[0], s[1], s[2]);
  if (v.lengthSq() < 1e-6) v.set(-0.72, 0.26, 0.64);
  v.normalize();
  const num = (x, d, lo, hi) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : d);
  return {
    hour: look.hour || 'golden', sun: v, sunColor: col(look.sunColor, '#ffc27e'), skyColor: col(look.skyColor, '#5b84cc'), turf: col(look.turf, '#69a52e'),
    density: num(look.density, 1, 0.5, 1.5), detail: num(look.detail, 1, 0.4, 1), lit: num(look.lit, 0.35, 0, 1), fireworks: !!look.fireworks,
  };
}
