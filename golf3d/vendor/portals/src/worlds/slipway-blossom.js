// SLIPWAY BLOSSOM, "Down the Ways": a hill-ringed shipyard in cherry blossom on the morning a great riveted liner is
// launched. We enter over the water at her stern, fly up the nave under her keel as she starts to slide the other way,
// burst out under her bow into streamers and doves, loop once to the right over the east yard until she lies broadside
// on ahead, fly straight at her flank as she runs down the ways (the close pass), come in between two east towers as her
// bow sweeps past, and follow her and her drag chains down the emptied cradle to the portal.
//
// World frame = the brief's: X north up the slip, Z east, water y = 0, waterline x = 0. The hero (src/parts) is the
// launch itself; this file is everything round it: the terraced harbour bowl, the yard, the town, the trees, the
// crowd, the boats, the birds and the weather.
//
// Looks (ctx.vary.hour, else by seed): morning (low sun in the east, fair-weather cloud, the default), golden (sun low in the west),
// dawn (pearl mist, yard lamps lit), drizzle (a sun shower: umbrellas, low smoke, rain through low gold light from the south-east, a
// rainbow over the north-west hills; one visit in fourteen). Season by seed: blossom (six visits in seven), may (fresh green, carp streamers), november (maples, never under the golden
// sun). Cast by seed: livery and tapes (hero), steam tugs or a paddle tender. Rare: the petal storm.
// The entry is 8 m above the water at x = -40; the exit portal hangs at (-58, 13, 22) (west of the centreline under the golden sun), behind
// the entry plane and 22 m to the sunny side of her track: her stem runs past it at u 0.84, then she swings her bow the other way and
// stands clear of the ring with open water between.
import * as THREE from 'three';
import { makePath } from '../kit/core.js';
import { makeSky } from '../kit/sky.js';
import * as T from '../kit/terrain.js';
import * as Water from '../kit/water.js';
import * as flora from '../kit/flora.js';
import * as F from '../kit/fauna.js';
import * as fx from '../kit/fx.js';
import * as S from '../kit/structures.js';
import { buildHero } from '../parts/slipway-blossom.js';

const PALETTE = ['#8E3B2A', '#AEB4B8', '#F2B8C9', '#5C646C', '#C49A5A', '#2E6E78', '#CFE6F5'];
const PI = Math.PI, TAU = PI * 2, K = Math.tan(3 * PI / 180);
const sat = (x) => Math.min(1, Math.max(0, x));
const lerp = (a, b, t) => a + (b - a) * t;
const sstep = (a, b, x) => { const t = sat((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const slipY = (x) => Math.min(x, 270) * K;
const SURF = S.SURF, lin = S.lin;

// sunAz: kit azimuth (0 = -Z, 90 = +X). East-south-east is 195, west-south-west is -15.
const LOOKS = {
  morning: {
    sky: { preset: 'day', zenith: '#5d9bd6', mid: '#93c3ea', horizon: '#d6e9f4', clouds: { coverage: 0.2, softness: 0.25, silver: 1.3 }, clouds2: { coverage: 0.28, stretch: 1, opacity: 0.4 },
      sunColor: '#fff0d6', sunSize: 1.1, scatter: 0.5, scatterColor: '#ffe0b0' },
    sunAz: 195, sunEl: 17, sunCol: '#FFE3B8', sunI: 3.8, hemiSky: '#8fb2e2', hemiGround: '#9a7a5e', hemiI: 1.3, fog: '#CFE6F5', density: 0.0009,
    night: 0, exposure: 1.0, bloom: 0.34, tint: '#fff6ea', shadowTint: '#2a3558', saturation: 1.09, amb: '#9DB6CE', fill: '#7C97B0', kick: '#B88A6A',
    seaDeep: '#17474c', seaScatter: '#3c8f88', mist: 0.05, portal: '#fff0cc', smokeBend: 0.5,
  },
  golden: {
    sky: { preset: 'goldenHour', clouds: false, clouds2: { coverage: 0.22, stretch: 1, opacity: 0.5 } },
    sunAz: -15, sunEl: 13, sunCol: '#ffc88c', sunI: 3.5, hemiSky: '#9fb2d6', hemiGround: '#b88a60', hemiI: 1.4, fog: '#eccfae', density: 0.0011,
    night: 0.12, exposure: 1.0, bloom: 0.4, tint: '#fff4e6', shadowTint: '#120f2a', saturation: 1.1, amb: '#a9a6c2', fill: '#98969e', kick: '#d08a58',
    seaDeep: '#23505a', seaScatter: '#86a892', mist: 0.06, portal: '#ffe2b0', smokeBend: 0.55,
  },
  dawn: {
    sky: { preset: 'dawn', zenith: '#7f9bc4', mid: '#c9bfd2', horizon: '#f3d9cc', clouds: { coverage: 0.3, softness: 0.3, silver: 1.8 }, clouds2: { coverage: 0.3, stretch: 1, opacity: 0.55 },
      scatter: 0.6, scatterColor: '#ffc9a0' },
    sunAz: 195, sunEl: 8, sunCol: '#ffc4a0', sunI: 3.3, hemiSky: '#b4bfdc', hemiGround: '#7c6a6a', hemiI: 1.0, fog: '#dcd2d8', density: 0.0015, contrast: 1.12,
    night: 0.55, exposure: 1.08, bloom: 0.46, tint: '#fff6f4', shadowTint: '#1b1e38', saturation: 1.04, amb: '#aab0cc', fill: '#8793b4', kick: '#b88a7a',
    seaDeep: '#2b4a5c', seaScatter: '#8fa9b0', mist: 0.24, portal: '#ffd9b8', smokeBend: 0.35,
  },
  drizzle: {                                                        // a sun shower: rain falling through low gold light from the south-east, slate cloud behind the yard, a rainbow over the north-west hills
    sky: { preset: 'goldenHour', zenith: '#40608f', mid: '#8497b8', horizon: '#f0cf9f', scatterColor: '#ffb264', scatter: 0.85, scatterPow: 3,
      clouds: { coverage: 0.58, softness: 0.3, lit: '#ffdcb4', shade: '#565c7c', silver: 2.2, absorb: 1.9 }, clouds2: { coverage: 0.45, stretch: 1, opacity: 0.5, lit: '#ffe6c8', shade: '#9a92a8' },
      sunColor: '#ffd9a0', sunSize: 1.5, sunGlow: 0.9, veil: 2 },
    sunAz: 232, sunEl: 14, sunCol: '#ffcd94', sunI: 4.2, hemiSky: '#a9b6d2', hemiGround: '#a07e62', hemiI: 1.15, fog: '#dccdb8', density: 0.0012,
    night: 0.25, exposure: 1.04, bloom: 0.4, tint: '#fff4e6', shadowTint: '#1a1c38', saturation: 1.14, amb: '#b0b4c8', fill: '#8f98b2', kick: '#c08a62',
    seaDeep: '#28505c', seaScatter: '#8aa69a', mist: 0.1, portal: '#ffe2b4', smokeBend: 1.1,
  },
};
const SEASONS = {
  blossom: { leaf: '#f4b6cc', leafLight: '#ffe6ef', leafDark: '#c07f98', puff: ['#F2B8C9', '#f7cad8', '#eaa2ba', '#fbdbe4'], grass: '#73865a', soil: '#8a7458', petals: ['#ffd9e4', '#F2B8C9', '#ffffff'], petalN: 1 },
  may: { leaf: '#7fb04a', leafLight: '#c4e080', leafDark: '#467e34', puff: ['#86b74e', '#9cc85c', '#74a646', '#b4d674'], grass: '#648c48', soil: '#86705a', petals: ['#e9f2c8', '#ffffff', '#cfe6a0'], petalN: 0.8 },
  november: { leaf: '#c8421a', leafLight: '#f0a030', leafDark: '#7c2414', puff: ['#c8421a', '#e08a22', '#a8301a', '#e9b23c'], grass: '#9a8c4e', soil: '#80684e', petals: ['#d8581c', '#e9a030', '#a83018'], petalN: 0.8 },
};

// ---------- small helpers ----------
const _m4 = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _p = new THREE.Vector3(), _s = new THREE.Vector3();
// flat-shaded vertex-coloured triangles for the few things the kit has no word for (people, parasols, far roofs)
class VC {
  constructor() { this.p = []; this.c = []; }
  tri(a, b, c, col) { this.p.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2]); for (let i = 0; i < 3; i++) this.c.push(col.r, col.g, col.b); return this; }
  quad(a, b, c, d, col) { return this.tri(a, b, c, col).tri(a, c, d, col); }
  box(x0, y0, z0, x1, y1, z1, col, top = col) {
    this.quad([x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1], col).quad([x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0], col);
    this.quad([x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1], col).quad([x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0], col);
    return this.quad([x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0], top);
  }
  geo() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(this.c, 3));
    g.computeVertexNormals(); return g;
  }
}
// items: [{ x, y, z, ry, rx, rz, sx, sy, sz, c }]
function instanced(geo, mat, items) {
  const mesh = new THREE.InstancedMesh(geo, mat, Math.max(1, items.length));
  mesh.count = items.length;
  for (let i = 0; i < items.length; i++) {
    const o = items[i], sx = o.sx ?? 1;
    _m4.compose(_p.set(o.x, o.y, o.z), _q.setFromEuler(_e.set(o.rx || 0, o.ry || 0, o.rz || 0, 'YXZ')), _s.set(sx, o.sy ?? sx, o.sz ?? sx));
    mesh.setMatrixAt(i, _m4); if (o.c) mesh.setColorAt(i, o.c);
  }
  mesh.instanceMatrix.needsUpdate = true; if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  mesh.computeBoundingSphere();
  return mesh;
}
// a lit, fogged Lambert material whose vertices move in the shader (bobbing crowd, fluttering cloth)
function animLambert(params, uT, head, body, key, extra, glow) {
  const mat = new THREE.MeshLambertMaterial(params);
  mat.onBeforeCompile = (sh) => {
    sh.uniforms.uT = uT; if (extra) Object.assign(sh.uniforms, extra);
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nuniform float uT;\n' + head).replace('#include <begin_vertex>', '#include <begin_vertex>\n' + body);
    if (glow) sh.fragmentShader = sh.fragmentShader.replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n' + glow);
  };
  mat.customProgramCacheKey = () => 'slipway-' + key;
  return mat;
}

// a grey-tiled hill house in the kit's facade language; local +Z is the front (downhill). Returns its size.
function hillHouse(b, rng, P, x, y, z, yaw) {
  const w = rng.range(6.4, 9.6), d = rng.range(5, 6.8), two = rng.chance(0.55), gf = 2.9, hw = two ? 5.5 : gf, seed = rng();
  const wall = rng.pick(P.walls), wood = rng.pick(P.woods), roof = rng.pick(P.roofs), rise = d * (two ? 0.3 : 0.36);
  b.tr(x, y, z, yaw);
  b.col(P.stone, 0.62, 1).surf(SURF.MASONRY, 0, 0.8); b.box(-w / 2 - 0.35, -3.2, -d / 2 - 0.35, w / 2 + 0.35, 0.32, d / 2 + 0.35, { m: 1 });
  b.col(wall, 0.86, 1).surf(SURF.SHOJI, seed, 1); b.wall(-w / 2, d / 2, w / 2, d / 2, 0.32, gf, { cellW: 1.5, cellH: gf });
  b.surf(SURF.WINDOW, (seed + 0.4) % 1, 0.8); b.wall(w / 2, -d / 2, -w / 2, -d / 2, 0.32, gf, { cellW: 2.2, cellH: gf });
  b.col(wood, 0.8, 1).surf(SURF.PLANKS, 0, 1); b.wall(w / 2, d / 2, w / 2, -d / 2, 0.32, gf, { m: 1 }); b.wall(-w / 2, -d / 2, -w / 2, d / 2, 0.32, gf, { m: 1 });
  let x0 = -w / 2, x1 = w / 2, z0 = -d / 2, z1 = d / 2;
  if (two) {
    b.col(roof, 0.9, 1); b.hip(x0, z0, x1, z1, gf, 0.55, { overhang: 0.85, ridge: 0.94, m: 0.5 });
    x0 += 0.5; x1 -= 0.5; z0 += 0.45; z1 -= 0.45;
    b.col(wall, 0.92, 1).surf(SURF.SHOJI, (seed + 0.2) % 1, 1); b.wall(x0, z1, x1, z1, gf + 0.2, hw, { cellW: 1.4, cellH: hw - gf });
    b.surf(SURF.WINDOW, (seed + 0.7) % 1, 0.8); b.wall(x1, z0, x0, z0, gf + 0.2, hw, { cellW: 2, cellH: hw - gf });
    b.surf(SURF.PLAIN); b.wall(x1, z1, x1, z0, gf + 0.2, hw); b.wall(x0, z0, x0, z1, gf + 0.2, hw);
  }
  b.col(roof, 0.92, 1).surf(SURF.PLAIN); b.gable(x0, z0, x1, z1, hw, rise, { alongX: true, overhang: 0.8, wallColor: P.plaster, wallStyle: SURF.PLAIN, m: 0.5 });
  b.col([roof[0] * 0.6, roof[1] * 0.6, roof[2] * 0.62]).surf(SURF.PLAIN); b.box(x0 - 0.5, hw + rise - 0.06, -0.16, x1 + 0.5, hw + rise + 0.24, 0.16);
  // veranda, tub, pots, firewood
  b.col(wood, 0.9, 1).surf(SURF.PLANKS, 0, 1); b.box(-w / 2 + 0.4, 0.2, d / 2, w / 2 - 0.4, 0.5, d / 2 + 1.1, { m: 1 });
  if (rng.chance(0.6)) { b.col(P.tub).surf(SURF.PLANKS, 0, 1); b.cyl(w / 2 + 0.7, 0.3, d / 2 - 0.6, 0.42, 0.48, 0.85, 7); }
  b.surf(SURF.PLAIN);
  for (let i = rng.int(1, 4); i > 0; i--) { const px = rng.range(-w / 2, w / 2), s = rng.range(0.22, 0.4); b.col(P.pot); b.cbox(px, 0.5, d / 2 + 0.8, s, s, s); b.col(rng.pick(P.plants)); b.cbox(px, 0.5 + s, d / 2 + 0.8, s * 1.5, s * 1.4, s * 1.5); }
  if (rng.chance(0.4)) { b.col(P.fire, 0.8, 1).surf(SURF.PLANKS, 0, 1); b.box(-w / 2 - 0.9, 0.3, -d / 2 + 0.3, -w / 2 - 0.1, 1.3, -d / 2 + 2.6, { m: 2 }); b.surf(SURF.PLAIN); }
  b.pop();
  return { w, d, top: hw + rise };
}

// ---------- yard pieces (all into one Builder, world coordinates) ----------
function wheel(b, cx, cy, cz, r) {
  for (let i = 0; i < 8; i++) {
    const a0 = i / 8 * TAU, a1 = (i + 1) / 8 * TAU, p0 = [cx + Math.cos(a0) * r, cy + Math.sin(a0) * r, cz], p1 = [cx + Math.cos(a1) * r, cy + Math.sin(a1) * r, cz];
    b.tri([cx, cy, cz], p0, p1); b.tri([cx, cy, cz], p1, p0);
  }
}
function boilerShop(b, rng, P, yAt) {
  const x0 = 78, x1 = 150, z0 = 66, z1 = 104, y = yAt(114, 85) + 0.4, eave = 9, teeth = 8, tw = (x1 - x0) / teeth;
  b.col(P.brick, 0.7, 1).surf(SURF.ARCHED, rng(), 1.2); b.box(x0, y - 5, z0, x1, y + eave, z1, { cellW: 4.5, cellH: eave + 5, top: false });
  for (let i = 0; i < teeth; i++) {
    const xa = x0 + i * tw, xb = xa + tw, ya = y + eave, yb = ya + 3.6;
    b.col(i % 2 ? P.roofRust : P.roofIron, 0.85, 1).surf(SURF.TILES, 0, 1); b.quad([xa, ya, z0], [xa, ya, z1], [xb, yb, z1], [xb, yb, z0], [0, 0, (z1 - z0) * 0.5, 4.6]);
    b.col(P.glass, 0.9, 1).surf(SURF.RIBBON, rng(), 1.3); b.quad([xb, ya, z1], [xb, ya, z0], [xb, yb, z0], [xb, yb, z1], [0, 0, 8, 1]);
    b.col(P.brick, 0.9, 1).surf(SURF.MASONRY, 0, 1); b.tri([xa, ya, z1], [xb, ya, z1], [xb, yb, z1]); b.tri([xb, ya, z0], [xa, ya, z0], [xb, yb, z0]);
  }
  // lean-to, big doors, two chimneys
  b.col(P.wood, 0.75, 1).surf(SURF.PLANKS, 0, 1); b.box(x0 + 8, y - 4, z0 - 7, x0 + 40, y + 4.2, z0, { m: 1, top: false });
  b.col(P.roofRust, 0.9, 1).surf(SURF.TILES, 0, 1); b.quad([x0 + 41, y + 3.6, z0 - 7.6], [x0 + 7, y + 3.6, z0 - 7.6], [x0 + 7, y + 5.6, z0], [x0 + 41, y + 5.6, z0], [0, 0, 17, 4]);
  b.col(P.dark).surf(SURF.PLAIN); for (const dx of [14, 44]) b.box(x0 + dx, y, z0 - 0.15, x0 + dx + 7, y + 6.5, z0 - 0.02);
  const stacks = [[68, 92], [120, 112]];
  for (const [cx, cz] of stacks) {
    const cy = yAt(cx, cz);
    b.col(P.brick, 0.62, 1.05).surf(SURF.MASONRY, 0, 0.7); b.cbox(cx, cy - 3, cz, 6, 7, 6, { m: 1 }); b.cyl(cx, cy + 4, cz, 2.3, 1.35, 38, 10, { m: 1 });
    b.col(P.dark).surf(SURF.PLAIN); b.cyl(cx, cy + 42, cz, 1.6, 1.6, 0.9, 10);
  }
  return stacks.map(([cx, cz]) => [cx, yAt(cx, cz) + 43.5, cz]);
}
function plateRacks(b, rng, P, yAt) {
  for (let r = 0; r < 6; r++) {
    const x = 236 + r * 10.5 + rng.range(-1, 1), za = 54 + rng.range(0, 6), zb = za + rng.range(22, 32), y = yAt(x, (za + zb) / 2);
    b.col(P.wood, 0.8, 1).surf(SURF.PLAIN);
    for (let k = 0; k <= 3; k++) { const z = lerp(za, zb, k / 3); b.beam([x - 1.5, y - 1, z], [x, y + 3.3, z], 0.22); b.beam([x + 1.5, y - 1, z], [x, y + 3.3, z], 0.22); }
    b.beam([x, y + 3.3, za - 0.5], [x, y + 3.3, zb + 0.5], 0.24);
    for (const sg of [-1, 1]) for (let i = 0, n = rng.int(3, 6); i < n; i++) {
      const o = 1.7 + i * 0.12, t = 0.35 + i * 0.12, a = za + rng.range(0, 5), c = zb - rng.range(0, 6), h = rng.range(2.2, 3.0);
      for (let z0 = a; z0 < c - 2;) {                                   // separate plates stood on edge, each its own length, height and colour
        const z1 = Math.min(c, z0 + rng.range(6, 10)), hh = h * rng.range(0.78, 1.06), ze = z1 - 0.3;
        b.col(rng.pick(P.rackPlates), 0.8, 1.08).surf(SURF.PLAIN);        // dull mill scale and red lead: no sky in them
        const A = [x + sg * o, y - 0.4, z0], B = [x + sg * o, y - 0.4, ze], C = [x + sg * lerp(o, t, hh / h), y + hh, ze], D = [x + sg * lerp(o, t, hh / h), y + hh, z0];
        if (sg > 0) b.quad(B, A, D, C); else b.quad(A, B, C, D);
        const E = [C[0] - sg * 0.11, C[1], C[2]], G = [D[0] - sg * 0.11, D[1], D[2]]; b.shade(1.15, 1.3); if (sg > 0) b.quad(C, D, G, E); else b.quad(D, C, E, G);   // the sheared top edge catches the light
        z0 = z1;
      }
    }
  }
}
function launchStand(b, P, y) {
  const x0 = 280, x1 = 291.5, z0 = -14, z1 = 14, dk = y + 1.7, ev = y + 6.2, rg = y + 8.1, xr = 286;
  b.col(P.wood, 0.7, 1).surf(SURF.PLANKS, 0, 1); b.box(x0, y - 2, z0, x1, dk, z1, { m: 1 });
  for (let i = 1; i <= 4; i++) b.box(x0 - i * 0.6, y - 2, -5, x0 - (i - 1) * 0.6, dk - i * 0.4, 5, { m: 1 });
  b.col(P.red, 0.9, 1).surf(SURF.STRIPES, 0, 1);
  b.quad([x0 - 0.05, dk, z0], [x0 - 0.05, dk, z1], [x0 - 0.05, dk + 1.1, z1], [x0 - 0.05, dk + 1.1, z0], [0, 0, 28, 1]);
  b.quad([x0 - 0.8, ev, z0 - 0.8], [x0 - 0.8, ev, z1 + 0.8], [xr, rg, z1 + 0.8], [xr, rg, z0 - 0.8], [0, 0, 26, 1]);
  b.quad([xr, rg, z0 - 0.8], [xr, rg, z1 + 0.8], [x1 + 0.8, ev, z1 + 0.8], [x1 + 0.8, ev, z0 - 0.8], [0, 0, 26, 1]);
  b.quad([x0 - 0.8, ev - 0.9, z0 - 0.8], [x0 - 0.8, ev - 0.9, z1 + 0.8], [x0 - 0.8, ev, z1 + 0.8], [x0 - 0.8, ev, z0 - 0.8], [0, 0, 26, 1]);
  b.tri([x0 - 0.8, ev, z1 + 0.8], [x1 + 0.8, ev, z1 + 0.8], [xr, rg, z1 + 0.8]); b.tri([x1 + 0.8, ev, z0 - 0.8], [x0 - 0.8, ev, z0 - 0.8], [xr, rg, z0 - 0.8]);
  b.shade(0.5, 0.6);
  b.quad([x0 - 0.8, ev - 0.03, z1 + 0.8], [x0 - 0.8, ev - 0.03, z0 - 0.8], [xr, rg - 0.03, z0 - 0.8], [xr, rg - 0.03, z1 + 0.8], [0, 0, 26, 1]);
  b.quad([xr, rg - 0.03, z1 + 0.8], [xr, rg - 0.03, z0 - 0.8], [x1 + 0.8, ev - 0.03, z0 - 0.8], [x1 + 0.8, ev - 0.03, z1 + 0.8], [0, 0, 26, 1]);
  b.col(P.white, 0.9, 1).surf(SURF.PLAIN);
  for (const x of [x0 + 0.2, x1 - 0.2]) for (let i = 0; i <= 4; i++) b.beam([x, dk, lerp(z0, z1, i / 4)], [x, ev, lerp(z0, z1, i / 4)], 0.2);
  for (const z of [z0 - 3, z1 + 3]) b.beam([x0 - 1, y, z], [x0 - 1, y + 13, z], 0.16);
  return [[x0 - 1, y + 12.6, z0 - 3], [x0 - 1, y + 12.6, z1 + 3]];
}
function sheds(b, rng, P, yAt) {
  for (let i = 0; i < 6; i++) {
    const cx = 34 + i * 29 + rng.range(-3, 3), w = rng.range(15, 23), d = rng.range(9, 13), cz = -66 - d / 2 + rng.range(-2, 2), y = yAt(cx, cz) + 0.3, h = rng.range(4.5, 6.5);
    b.col(rng.pick(P.woods), 0.72, 1).surf(SURF.PLANKS, 0, 1); b.box(cx - w / 2, y - 3, cz - d / 2, cx + w / 2, y + h, cz + d / 2, { m: 1, top: false });
    b.col(P.plaster, 0.85, 1).surf(SURF.WINDOW, rng(), 0.9); b.wall(cx - w / 2 + 1, cz + d / 2 + 0.04, cx + w / 2 - 1, cz + d / 2 + 0.04, y + 1.6, y + h - 0.8, { cellW: 2.6, cellH: h });
    b.col(rng.pick([P.roofRust, P.roofIron, P.roofs[0]]), 0.9, 1).surf(SURF.PLAIN); b.gable(cx - w / 2, cz - d / 2, cx + w / 2, cz + d / 2, y + h, d * 0.28, { alongX: true, overhang: 0.7, wallColor: P.woods[0], wallStyle: SURF.PLANKS });
    if (rng.chance(0.6)) { b.col(P.brick, 0.7, 1).surf(SURF.MASONRY, 0, 0.6); b.cbox(cx + rng.range(-0.3, 0.3) * w, y + h, cz, 0.9, d * 0.28 + 2.2, 0.9, { m: 1 }); }
    // a sliding door on the slip side with one leaf run half open, a lean-to on one end, a louvred vent along the ridge
    const dx = cx + rng.range(-0.22, 0.22) * w, dw = rng.range(3.2, 4.4), zf = cz + d / 2, e = rng.chance(0.5) ? 1 : -1, lw = rng.range(3.4, 5), lh = h * 0.62;
    b.col(P.dark).surf(SURF.PLAIN); b.box(dx - dw / 2, y - 0.2, zf, dx + dw / 2, y + 3.6, zf + 0.1, { top: false });
    b.col(rng.pick(P.woods), 0.55, 0.82).surf(SURF.PLANKS, 0, 1); b.box(dx + dw * 0.08, y - 0.2, zf + 0.1, dx + dw * 0.98, y + 3.7, zf + 0.24, { m: 1 });
    b.col(P.dark, 1.6, 1.6).surf(SURF.PLAIN); b.beam([dx - dw * 0.6, y + 3.86, zf + 0.17], [dx + dw * 1.05, y + 3.86, zf + 0.17], 0.14);
    const xa = cx + e * w / 2, xb = xa + e * lw, X0 = Math.min(xa, xb), X1 = Math.max(xa, xb), za = cz - d * 0.36, zb = cz + d * 0.36, hi = y + lh + 1.3, lo = y + lh - 0.1;
    b.col(rng.pick(P.woods), 0.66, 0.95).surf(SURF.PLANKS, 0, 1); b.box(X0, y - 3, za, X1, y + lh, zb, { m: 1, top: false });
    b.col(rng.pick([P.roofRust, P.roofIron]), 0.85, 1).surf(SURF.TILES, 0, 1);
    b.quad([X0 - (e < 0 ? 0.5 : 0), e > 0 ? hi : lo, za - 0.5], [X0 - (e < 0 ? 0.5 : 0), e > 0 ? hi : lo, zb + 0.5], [X1 + (e > 0 ? 0.5 : 0), e > 0 ? lo : hi, zb + 0.5], [X1 + (e > 0 ? 0.5 : 0), e > 0 ? lo : hi, za - 0.5], [0, 0, (zb - za + 1) * 0.5, 2.4]);
    const ry = y + h + d * 0.28;
    b.col(P.roofIron, 0.7, 1).surf(SURF.PLAIN); b.cbox(cx, ry - 0.3, cz, w * 0.56, 0.8, 1.3, { top: false }); b.col(P.roofIron, 1.05, 1.05); b.cbox(cx, ry + 0.5, cz, w * 0.6, 0.13, 2.1, { bottom: true });
  }
}
// loose things beside the slip and round the sheds: timber, crates, barrels, plate, carts
function clutter(b, rng, P, yAt, spots) {
  for (const [x, z] of spots) {
    const y = yAt(x, z), k = rng.int(0, 5), yaw = rng.range(-0.3, 0.3) + (rng.chance(0.3) ? PI / 2 : 0);
    b.tr(x, y, z, yaw);
    if (k === 0) {                                                    // timber stack on bearers
      const n = rng.int(2, 4), L = rng.range(5, 8);
      for (let i = 0; i < n; i++) { b.col(rng.pick(P.woods), 0.8, 1.05).surf(SURF.PLANKS, 0, 1); b.box(-L / 2 + rng.range(-0.4, 0.4), -0.5 + i * 0.5, -0.9, L / 2 + rng.range(-0.4, 0.4), i * 0.5 + 0.42, 0.9, { m: 1.5 }); }
    } else if (k === 1) {                                             // crates
      for (let i = rng.int(2, 5); i > 0; i--) { const s = rng.range(0.7, 1.3); b.col(rng.pick(P.woods), 0.85, 1.05).surf(SURF.PLANKS, 0, 1); b.cbox(rng.range(-1.6, 1.6), -0.5, rng.range(-1.2, 1.2), s, s + 0.5, s, { m: 2 }); }
    } else if (k === 2) {                                             // barrels and a drum of red lead
      for (let i = rng.int(3, 6); i > 0; i--) { b.col(rng.pick([P.tub, P.tub, P.red, P.plates[0]]), 0.8, 1).surf(SURF.PLANKS, 0, 1); b.cyl(rng.range(-1.5, 1.5), -0.4, rng.range(-1.2, 1.2), 0.38, 0.36, rng.range(1.2, 1.4), 7); }
    } else if (k === 3) {                                             // plates laid flat on dunnage
      for (let i = 0, n = rng.int(2, 5); i < n; i++) { b.col(rng.pick(P.plates), 0.9, 1).surf(SURF.STEEL, 0, 0); b.box(-3 + rng.range(-0.3, 0.3), -0.4 + i * 0.16, -1.1, 3 + rng.range(-0.3, 0.3), -0.3 + i * 0.16 + 0.4, 1.1, { m: 0.5, capStyle: SURF.STEEL, capM: 0.5 }); }
    } else if (k === 4) {                                             // hand cart
      b.col(rng.pick(P.woods), 0.85, 1).surf(SURF.PLANKS, 0, 1); b.box(-1.2, 0.55, -0.6, 1.2, 0.95, 0.6, { m: 2 }); b.beam([1.2, 0.8, 0.5], [2.5, 1.0, 0.5], 0.07); b.beam([1.2, 0.8, -0.5], [2.5, 1.0, -0.5], 0.07);
      b.col(P.dark).surf(SURF.PLAIN); wheel(b, 0, 0.55, 0.68, 0.55); wheel(b, 0, 0.55, -0.68, 0.55);
      b.col(rng.pick(P.plants)); b.cbox(0, 0.95, 0, 1.6, 0.5, 0.9);
    } else {                                                          // coiled hawser and a keel block
      b.col(P.rope, 0.8, 1).surf(SURF.PLAIN); b.cyl(0, -0.3, 0, 0.9, 0.8, 0.75, 9); b.col(P.wood, 0.8, 1).surf(SURF.PLANKS, 0, 1); b.cbox(1.8, -0.4, 0.3, 1.4, 1.4, 1.1, { m: 2 });
    }
    b.surf(SURF.PLAIN); b.pop();
  }
}
// the quay wall either side of the slip foot, a timber pier, pile dolphins by the way ends
function quay(b, rng, P) {
  for (const [za, zb] of [[33, 150], [-101, -33], [-215, -141]]) {
    b.col(P.stone, 0.5, 1).surf(SURF.MASONRY, 0, 1.4); b.box(-6, -5, za, -3.2, 2.05, zb, { m: 1 });
    b.col(P.stoneLight, 0.9, 1).surf(SURF.MASONRY, 0, 2); b.box(-6.25, 2.05, za, -2.6, 2.4, zb, { m: 1 });
    for (let z = za + 5; z < zb - 3; z += 13) { b.col(P.dark, 0.8, 1.2).surf(SURF.PLAIN); b.cyl(-4.3, 2.4, z, 0.3, 0.38, 0.85, 7); }
    for (let z = za + 2; z < zb; z += 6.5) { b.col(P.pile, 0.45, 1).surf(SURF.PLANKS, 0, 1); b.cyl(-6.6, -4, z, 0.26, 0.24, 6.3 + rng.range(-0.3, 0.3), 6); }
  }
  // pier with lighters alongside (east)
  b.col(P.wood, 0.8, 1).surf(SURF.PLANKS, 0, 1); b.box(-58, 1.5, 84, -6, 1.85, 89.5, { m: 1, bottom: true });
  for (let x = -56; x < -6; x += 6) for (const z of [84.3, 89.2]) { b.col(P.pile, 0.4, 1); b.cyl(x, -4, z, 0.24, 0.22, 6.8 + (x * 7 % 3) * 0.3, 6); }
  b.col(P.wood, 0.9, 1).surf(SURF.PLAIN); for (let x = -57; x <= -8; x += 7) { b.beam([x, 1.85, 84.1], [x, 2.9, 84.1], 0.1); } b.beam([-57, 2.85, 84.1], [-8, 2.85, 84.1], 0.09);
  for (const [dx, dz] of [[-12, 21], [-12, -21], [-27, 23.5], [-27, -23.5], [-52, 40], [-52, -40]]) {
    for (let k = 0; k < 3; k++) { const a = k / 3 * TAU + dx; b.col(P.pile, 0.35, 1).surf(SURF.PLANKS, 0, 1); b.cyl(dx + Math.cos(a) * 0.5, -4, dz + Math.sin(a) * 0.5, 0.3, 0.26, 7.6 + k * 0.35, 6); }
    b.col(P.rope).surf(SURF.PLAIN); b.cyl(dx, 2.5, dz, 0.86, 0.86, 0.3, 8);
  }
}
// the second, empty slip to the west with the first frames of the next hull standing on it
function secondSlip(b, rng, P) {
  const z0 = -139, z1 = -103, xa = -30, xb = 240, zc = -121;
  b.col(P.deck, 0.7, 1).surf(SURF.PLANKS, 0, 1); b.quad([xa, slipY(xa) + 0.06, z0], [xa, slipY(xa) + 0.06, z1], [xb, slipY(xb) + 0.06, z1], [xb, slipY(xb) + 0.06, z0], [0, 0, 18, 135]);
  b.col(P.stone, 0.6, 1).surf(SURF.MASONRY, 0, 1.2);
  for (const z of [z0 - 1.2, z1]) for (let x = 0; x < xb; x += 30) b.box(x, slipY(x) - 3, z, Math.min(xb, x + 30), slipY(x + 15) + 0.5, z + 1.2, { m: 1 });
  for (let x = 6; x < 232; x += 5.2) { b.col(rng.pick(P.woods), 0.8, 1).surf(SURF.PLANKS, 0, 1); b.cbox(x, slipY(x), zc, 1.3, 1.5, 1.7, { m: 2 }); }
  b.col(P.oxide, 0.85, 1).surf(SURF.STEEL, 0, 0);
  for (let x = 60; x < 228; x += 12) b.box(x, slipY(x + 6) + 1.5, zc - 0.5, x + 12.05, slipY(x + 6) + 2.0, zc + 0.5, { m: 0.5 });
  for (let x = 150; x < 226; x += 7.5) {                             // frames
    const y = slipY(x) + 2, h = 9 + 3 * Math.sin(x * 0.07), hb = 6.5;
    b.beam([x, y, zc - hb], [x, y, zc + hb], 0.3); b.beam([x, y, zc - hb], [x, y + h, zc - hb - 1.6], 0.28); b.beam([x, y, zc + hb], [x, y + h, zc + hb + 1.6], 0.28);
  }
  b.col(P.bamboo, 0.8, 1).surf(SURF.PLAIN);                         // pole staging
  for (const z of [z0 + 2.5, z1 - 2.5]) { for (let x = 140; x <= 236; x += 8) b.beam([x, slipY(x), z], [x, slipY(x) + 15, z], 0.16); for (const h of [5, 10, 14.6]) b.beam([140, slipY(140) + h, z], [236, slipY(236) + h, z], 0.14); }
}

// ---------- vessels, crane, instanced bits ----------
// bow toward local +X; kind: 'tug' | 'paddle' | 'ferry'. Returns the geometry and the funnel top in local space.
function vesselGeometry(rng, P, kind) {
  const b = new S.Builder(2048), ferry = kind === 'ferry', paddle = kind === 'paddle';
  const L = ferry ? 46 : paddle ? 33 : 19, B = ferry ? 9.6 : paddle ? 6.8 : 5.2, l = L / 2, h = B / 2, dk = ferry ? 2.1 : 1.7;
  const poly = [[-l, h * 0.8], [-l * 0.75, h], [l * 0.4, h], [l * 0.8, h * 0.55], [l, 0], [l * 0.8, -h * 0.55], [l * 0.4, -h], [-l * 0.75, -h], [-l, -h * 0.8]];
  const hullC = ferry ? P.white : P.tugHull, house = ferry ? P.white : paddle ? P.buffLight : rng.pick([P.buffLight, P.white, P.woods[1]]);
  b.col(ferry ? P.green : P.oxide, 0.8, 1).surf(SURF.STEEL, 0, 0); b.prism(poly, -1.4, 0.4, { m: 0.4, top: false });
  b.col(hullC, 0.9, 1.05).surf(SURF.STEEL, 0, 0); b.prism(poly, 0.4, dk, { m: 0.4, capColor: P.deck });
  b.col(hullC, 1, 1.1).surf(SURF.PLAIN); b.prism(poly.map(([x, z]) => [x * 1.005, z * 1.02]), dk, dk + 0.55, { top: false });
  b.col(house, 0.85, 1).surf(SURF.WINDOW, rng(), 1); b.cbox(-0.04 * L, dk, 0, (ferry ? 0.7 : 0.4) * L, 2.35, B * (ferry ? 0.8 : 0.56), { cellW: 1.7, cellH: 2.35, capColor: P.deck });
  b.surf(SURF.WINDOW, rng(), 1.2); b.cbox((ferry ? -0.02 : 0.07) * L, dk + 2.35, 0, (ferry ? 0.5 : 0.15) * L, 2.15, B * (ferry ? 0.66 : 0.42), { cellW: 1.3, cellH: 2.15, capColor: P.white });
  if (ferry) { b.col(P.white).surf(SURF.PLAIN); b.cbox(0.2 * L, dk + 4.5, 0, 0.1 * L, 2, B * 0.4, { capColor: P.white }); b.col(P.wood); for (const sg of [-1, 1]) b.cbox(-0.16 * L, dk + 4.6, sg * B * 0.24, 4.5, 0.8, 1.3); }
  const fx0 = (ferry ? -0.05 : -0.12) * L, fr = ferry ? 1.3 : paddle ? 0.95 : 0.72, fy = dk + (ferry ? 4.5 : 2.35), fh = ferry ? 5.5 : 5;
  b.col(P.buff, 0.9, 1).surf(SURF.PLAIN); b.cyl(fx0, fy, 0, fr, fr * 0.96, fh - 1.2, 10, { cap: false });
  b.col(P.dark); b.cyl(fx0, fy + fh - 1.2, 0, fr * 0.98, fr * 0.98, 1.2, 10);
  b.col(P.wood); b.beam([0.24 * L, dk, 0], [0.24 * L - 0.4, dk + 9, 0], 0.15); b.beam([-0.36 * L, dk, 0], [-0.36 * L, dk + 4.4, 0], 0.12);
  if (paddle) for (const sg of [-1, 1]) { b.col(P.white, 0.9, 1).surf(SURF.PLAIN); b.cbox(0, 0.1, sg * (h + 0.75), 7, 3.4, 1.6); b.col(P.red); b.cbox(0, 3.5, sg * (h + 0.75), 4.2, 0.5, 1.6); }
  b.col(P.dark);
  if (!ferry) for (const sg of [-1, 1]) for (let i = 0; i < 4; i++) b.cbox(lerp(-0.3, 0.3, i / 3) * L, 0.5, sg * (h + (paddle ? -0.05 : 0.14)), 0.9, 0.9, 0.28);
  return { geo: b.toGeometry(), funnel: [fx0, fy + fh + 0.3, 0], L, B };
}
// 60 m hammerhead crane: a square lattice tower and a jib that slews (two meshes)
function craneGeometry(P) {
  const tb = new S.Builder(4096), jb = new S.Builder(4096), H = 44, bays = 6;
  const leg = (sx, sz, t) => [sx * lerp(4.2, 3, t), H * t, sz * lerp(4.2, 3, t)], cs = [[1, 1], [1, -1], [-1, -1], [-1, 1]];
  tb.col(P.craneSteel, 0.75, 1.05).surf(SURF.PLAIN);
  for (const [sx, sz] of cs) tb.beam(leg(sx, sz, 0), leg(sx, sz, 1), 0.55);
  for (let k = 0; k < bays; k++) for (let f = 0; f < 4; f++) {
    const a = cs[f], c = cs[(f + 1) % 4], t0 = k / bays, t1 = (k + 1) / bays;
    tb.beam(leg(a[0], a[1], t1), leg(c[0], c[1], t1), 0.3); tb.beam(leg(a[0], a[1], t0), leg(c[0], c[1], t1), 0.24); tb.beam(leg(c[0], c[1], t0), leg(a[0], a[1], t1), 0.24);
  }
  tb.col(P.stone, 0.7, 1).surf(SURF.MASONRY, 0, 1); for (const [sx, sz] of cs) tb.cbox(sx * 4.2, -3, sz * 4.2, 2.4, 4, 2.4, { m: 1 });
  tb.col(P.craneSteel, 0.9, 1).surf(SURF.STEEL, 0, 0); tb.cbox(0, H, 0, 7.4, 1.2, 7.4, { m: 0.5 }); tb.cyl(0, H + 1.2, 0, 3.4, 3.4, 1.3, 12);
  // jib: pivot at its origin
  const xa = -21, xb = 40, dp = 4.6, hw = 1.6;
  jb.col(P.craneSteel, 0.8, 1.05).surf(SURF.PLAIN);
  for (const z of [-hw, hw]) {
    jb.beam([xa, 0, z], [xb, 0, z], 0.4); jb.beam([xa, dp, z], [xb - 4, dp, z], 0.36); jb.beam([xb - 4, dp, z], [xb, 0.4, z], 0.3);
    for (let x = xa, i = 0; x < xb - 4; x += 5, i++) { jb.beam([x, 0, z], [x, dp, z], 0.22); jb.beam(i % 2 ? [x, 0, z] : [x, dp, z], i % 2 ? [x + 5, dp, z] : [x + 5, 0, z], 0.2); }
  }
  for (let x = xa; x <= xb; x += 10) { jb.beam([x, 0, -hw], [x, 0, hw], 0.24); if (x < xb - 4) jb.beam([x, dp, -hw], [x, dp, hw], 0.22); }
  jb.col(P.oxide, 0.8, 1).surf(SURF.PLANKS, 0, 1); jb.cbox(-11, 0.2, 0, 10, 4.3, 3.6, { m: 1, capColor: P.roofIron });
  jb.col(P.stone, 0.7, 1).surf(SURF.MASONRY, 0, 1); jb.cbox(-18.5, -2.2, 0, 4.4, 2.6, 3.4, { m: 1, bottom: true });
  jb.col(P.dark).surf(SURF.PLAIN); jb.cbox(29, -1.0, 0, 2.6, 1, 2.9, { bottom: true }); jb.beam([29, -1, 0.5], [29, -19, 0.2], 0.16); jb.beam([29, -1, -0.5], [29, -19, -0.2], 0.16); jb.cbox(29, -20.4, 0, 1, 1.5, 1);
  jb.col(P.buffLight, 0.9, 1).surf(SURF.WINDOW, 0.3, 1); jb.cbox(6, -2.3, hw + 0.9, 2.4, 2.3, 2, { cellW: 1.2, cellH: 2.3, bottom: true });
  return { tower: tb.toGeometry(), jib: jb.toGeometry(), H: H + 2.5 };
}
function farHouseGeometry() {
  const v = new VC(), W = new THREE.Color(0.72, 0.67, 0.58), W2 = new THREE.Color(0.34, 0.28, 0.22), R = new THREE.Color(0.33, 0.34, 0.36), R2 = new THREE.Color(0.42, 0.43, 0.45);
  v.box(-4, -3, -3, 4, 3.4, 3, W, R); v.quad([-4, -3, 3.03], [4, -3, 3.03], [4, 1.3, 3.03], [-4, 1.3, 3.03], W2);
  v.quad([-4.6, 3.1, 3.7], [4.6, 3.1, 3.7], [4.6, 5.7, 0], [-4.6, 5.7, 0], R2).quad([4.6, 3.1, -3.7], [-4.6, 3.1, -3.7], [-4.6, 5.7, 0], [4.6, 5.7, 0], R);
  v.tri([4, 3.4, 3], [4, 3.4, -3], [4, 5.5, 0], W).tri([-4, 3.4, -3], [-4, 3.4, 3], [-4, 5.5, 0], W);
  return v.geo();
}
function personGeometry() {
  const v = new VC(), body = new THREE.Color(1, 1, 1), head = new THREE.Color(0.5, 0.36, 0.26);
  v.box(-0.22, 0, -0.15, 0.22, 1.28, 0.15, body);
  for (const [a, b] of [[[-0.15, -0.15], [0.15, -0.15]], [[0.15, -0.15], [0.15, 0.15]], [[0.15, 0.15], [-0.15, 0.15]], [[-0.15, 0.15], [-0.15, -0.15]]]) v.tri([a[0], 1.28, a[1]], [b[0], 1.28, b[1]], [0, 1.6, 0], head);
  return v.geo();
}
// a blossom crown: icosahedron lobes with soft normals, vertex colour dark underneath and light on top, optional stub trunk
function crownGeometry(lobes, trunk) {
  const base = new THREE.IcosahedronGeometry(1, 0), bp = base.attributes.position, pos = [], nor = [], col = [];
  for (const [cx, cy, cz, r] of lobes) for (let i = 0; i < bp.count; i++) {
    const x = bp.getX(i), y = bp.getY(i), z = bp.getZ(i), px = cx + x * r, py = cy + y * r, pz = cz + z * r, l = Math.hypot(px, py, pz) || 1;
    const g = lerp(0.46, 1.12, sstep(-0.95, 0.9, py + 0.25 * y));
    pos.push(px, py, pz); _p.set(x * 0.65 + px / l * 0.35, y * 0.65 + py / l * 0.35, z * 0.65 + pz / l * 0.35).normalize(); nor.push(_p.x, _p.y, _p.z); col.push(g, g, g);
  }
  if (trunk) for (let k = 0; k < 3; k++) {
    const a0 = k / 3 * TAU, a1 = (k + 1) / 3 * TAU, r = 0.085, y0 = -1.5, y1 = -0.35;
    const A = [Math.cos(a0) * r, y0, Math.sin(a0) * r], B = [Math.cos(a1) * r, y0, Math.sin(a1) * r], C2 = [Math.cos(a1) * r * 0.7, y1, Math.sin(a1) * r * 0.7], D = [Math.cos(a0) * r * 0.7, y1, Math.sin(a0) * r * 0.7];
    for (const v of [A, C2, B, A, D, C2]) { pos.push(v[0], v[1], v[2]); const l = Math.hypot(v[0], v[2]) || 1; nor.push(v[0] / l, 0.1, v[2] / l); col.push(0.22, 0.17, 0.15); }
  }
  base.dispose();
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  return g;
}
function clothGeometry() { return new THREE.PlaneGeometry(1, 1, 6, 2).translate(0.5, -0.5, 0); }

export default {
  id: 'slipway-blossom',
  name: 'Down the Ways',
  category: 'city',
  weirdness: 0.08,
  media: ['air', 'open'],
  async build(ctx) {
    const rng = ctx.rng, noise = ctx.noise, vary = ctx.vary || {}, detail = ctx.quality?.detail ?? 1, density = vary.density ?? 1;
    const vr = rng.fork('sb-cast-c'), hour = vary.hour || 'any', rare = !!vary.rare;
    let lookName;
    if (hour === 'dawn' || hour === 'night') lookName = 'dawn';
    else if (hour === 'golden') lookName = 'golden';
    else if (hour === 'day') lookName = vr.chance(0.07) ? 'drizzle' : 'morning';
    else { const r = vr(); lookName = r < 0.52 ? 'morning' : r < 0.76 ? 'golden' : r < 0.93 ? 'dawn' : 'drizzle'; }
    // blossom is the world: May green and November maples are the occasional visit, and never maples under a golden sun (brown on orange)
    const sr = vr(), seasonName = rare || sr >= 0.14 || (sr >= 0.07 && lookName === 'golden') ? 'blossom' : sr < 0.07 ? 'may' : 'november', paddle = vr.chance(0.3);
    const look = LOOKS[lookName], season = SEASONS[seasonName], wet = lookName === 'drizzle', sw = lookName === 'golden' ? -1 : 1;     // sw: the side the low sun is on (east 1, west -1)
    const scene = new THREE.Scene(), time = { value: 0 }, uT = { value: 0 };

    // ---------- sky and the one shadow-casting sun, fitted to the slip ----------
    const sky = makeSky({ rng, ...look.sky, sunElevation: look.sunEl, sunAzimuth: look.sunAz, lightElevationMin: 11 });
    scene.add(sky.object);
    scene.fog = new THREE.FogExp2(new THREE.Color(look.fog), look.density);
    const sunDir = sky.lightDirection.clone().normalize();
    const hemi = new THREE.HemisphereLight(look.hemiSky, look.hemiGround, look.hemiI); scene.add(hemi);
    const sun = new THREE.DirectionalLight(look.sunCol, look.sunI), tgt = new THREE.Vector3(115, 30, 0);
    sun.position.copy(tgt).addScaledVector(sunDir, 320); sun.target.position.copy(tgt); scene.add(sun, sun.target);
    {
      sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
      const zc = sunDir, xc = new THREE.Vector3(0, 1, 0).cross(zc).normalize(), yc = zc.clone().cross(xc), c = new THREE.Vector3();
      let l = 1e9, r = -1e9, bt = 1e9, tp = -1e9, n = 1e9, f = -1e9;
      for (const x of [-44, 278]) for (const y of [-1, 74]) for (const z of [-34, 34]) {
        c.set(x, y, z).sub(tgt); const a = c.dot(xc), b2 = c.dot(yc), d = -c.dot(zc);
        l = Math.min(l, a); r = Math.max(r, a); bt = Math.min(bt, b2); tp = Math.max(tp, b2); n = Math.min(n, d); f = Math.max(f, d);
      }
      const sc = sun.shadow.camera; sc.left = l - 3; sc.right = r + 3; sc.bottom = bt - 3; sc.top = tp + 3; sc.near = Math.max(5, 320 + n - 12); sc.far = 320 + f + 12; sc.updateProjectionMatrix();
      sun.shadow.bias = -0.0007; sun.shadow.normalBias = 0.1; sun.shadow.radius = wet ? 4 : lookName === 'morning' ? 3 : 5; sun.shadow.intensity = wet ? 0.92 : 1;
    }
    await ctx.yield();

    // ---------- the hero, in the brief's own frame ----------
    const hero = await buildHero(ctx, { palette: PALETTE, frame: 'brief', sun: [sunDir.x, sunDir.y, sunDir.z], fill: lookName === 'morning' ? 0.85 : lookName === 'golden' ? 1.2 : wet ? 0.9 : 0.62, swing: sw,
      caustics: lookName === 'morning' ? 1 : lookName === 'golden' ? 0.9 : 0.6 });
    hero.setSun([sunDir.x, sunDir.y, sunDir.z], look.sunCol); hero.setTone({ amb: look.amb, fill: look.fill, kick: look.kick });
    scene.add(hero.object);
    const A = hero.anchors;
    await ctx.yield();

    // ---------- the flight (the hero's fly-through, with the nave and the straight pinned so the spline cannot wander) ----------
    // The entry is 8 m up, so the round opening it is first seen through stands a metre clear of the water; the exit portal hangs 18 m
    // behind the entry plane, where the previous portal's near plane cuts it out of the first picture.
    // Out from under her bow the route climbs between two east towers into one right-hand loop over the east yard, 42 m up, and comes
    // back south-west straight at her flank while she runs: the close pass, from 90 m down to 45. It slips in between two east towers
    // behind her bow and follows her down the centreline.
    const ft = A.flyThrough, nf = ft.length, pts = [[-40, 8, 0], [-15, 6.4, 0], ft[1]];
    for (const x of [48, 86, 124, 162]) pts.push([x, slipY(x) + 4.5, 0]);
    for (let i = 2; i <= nf - 3; i++) pts.push(ft[i]);
    const s0 = ft[nf - 3], s1 = ft[nf - 2];
    // Down the cradle the route leaves the centreline for the sunny side, 12 degrees off, and the ring hangs 22 m to that side of her track:
    // her stem runs past it, not through it, and when she swings her bow the other way there is open water between the ring and the ship.
    const PZ = 22 * sw, vz = (x) => PZ * (1 - (x + 58) / 104);           // the last 72 m are one straight line
    pts.push([lerp(s0[0], s1[0], 0.25), lerp(s0[1], s1[1], 0.25), 0], [lerp(s0[0], s1[0], 0.5), lerp(s0[1], s1[1], 0.5), 0.25 * sw], [lerp(s0[0], s1[0], 0.75), lerp(s0[1], s1[1], 0.75), 1.3 * sw]);
    pts.push([s1[0], s1[1], 3.4 * sw], [14, 13, vz(14)], [-4, 13, vz(-4)], [-31, 13, vz(-31)], [-58, 13, PZ]);
    const path = makePath(pts), DUR = 48, E = 980 / path.length;     // E: what happens under her comes later in u than in the brief (see the hero)
    await ctx.yield();

    // ---------- the harbour bowl: sea, yard, terraced hills ----------
    const hillE = (x, z) => {
      const south = Math.max(0, -x), dN = x - 300, dE = z - (135 + south * 0.45), dW = -z - (205 + south * 0.3), m = Math.max(dN, dE, dW), k = 30;
      return m + k * Math.log(Math.exp((dN - m) / k) + Math.exp((dE - m) / k) + Math.exp((dW - m) / k)) + 20 * noise.n2(x * 0.006 + 3.1, z * 0.006 - 1.7) + 6 * noise.n2(x * 0.021, z * 0.021 + 9);
    };
    const hillRaw = (e, x, z) => {
      const ee = Math.max(0, e - 125), raw = (0.42 * e + 0.0006 * e * e + 0.0042 * ee * ee) * (0.86 + 0.28 * noise.n2(x * 0.004 + 11, z * 0.004));
      const kc = 85 + 40 * noise.n2(x * 0.003 + 7, z * 0.003 + 2);
      return (raw < 150 ? raw : 150 + kc * (1 - Math.exp(-(raw - 150) / kc))) * (1 - sstep(-250, -470, x));
    };
    const hillH = (e, x, z) => {
      const raw = hillRaw(e, x, z), t = raw / 6, fl = Math.floor(t);
      return lerp(raw + 5 * noise.n2(x * 0.02 + 40, z * 0.02), 6 * (fl + sstep(0.76, 0.98, t - fl)), 1 - sstep(96, 134, raw));
    };
    const yardY = (x) => Math.max(1.9, slipY(x) - 0.3);
    const H0 = (x, z) => {
      const e = hillE(x, z), az = Math.abs(z);
      let land = yardY(x);
      if (e > 0) land += hillH(e, x, z);
      else if (az < 34.5 && x < 270.5) land = Math.min(land, lerp(slipY(x) - 0.9, land, sstep(32, 34.5, az)));
      else if (z > -141.5 && z < -100.5 && x < 244) land = Math.min(land, slipY(x) - 0.4);
      let h = lerp(-7, land, Math.max(sstep(-7, -3.4, x), sstep(-2, 6, e)));
      if (az < 34 && x < 0) h = Math.min(h, Math.max(-7, slipY(x) - 0.9));
      return h;
    };
    const H = (x, z) => {
      const h = H0(x, z);
      if (h < 20) return h;
      const n = path.nearestXZ(x, z);
      return Math.min(h, lerp(27.5, n.y - 19.5, sstep(24, 34, n.y)) + Math.max(0, n.dist - 15) * 0.62);
    };
    const C = (hex, k = 1) => new THREE.Color(hex).multiplyScalar(k);
    const cYardA = C('#8f887c'), cYardB = C('#b39a74'), cYardC = C('#7a5544'), cPetal = C(season.puff[1], 0.9), cStone = C('#b3ab9b'), cStoneD = C('#8f887a'), cGrass = C(lookName === 'golden' && seasonName !== 'november' ? '#84a452' : season.grass), cGrassB = C(seasonName === 'november' ? '#6f7a3c' : '#4f8a3c'), cSoil = C(season.soil),
      cWalk = C('#c9bca0'), cRidge = C(seasonName === 'november' ? '#5a5630' : '#35543a'), cRidge2 = C(seasonName === 'november' ? '#8a5426' : '#476a42'), cBed = C('#3c4c48'), cShore = C('#7c7462'), cBank = C(seasonName === 'november' ? '#7a7440' : lookName === 'golden' ? '#7c9c4c' : '#5c7a46');
    // cherries stand in groves along the terrace walls, not evenly over the hills: one mask for the crowns, the ground under them and the shrubs
    const groveN = (x, z) => noise.n2(x * 0.012 + 17, z * 0.012 - 5), blossom = seasonName === 'blossom';
    const colorFn = (x, z, h, ny, out) => {
      if (h < 0.5) return out.copy(cBed).lerp(cShore, sstep(-2.5, 0.5, h));
      const e = hillE(x, z), n1 = noise.n2(x * 0.045, z * 0.045), n2 = noise.n2(x * 0.13 + 7, z * 0.13);
      if (e <= 0) {
        out.copy(cYardA).lerp(cYardB, sat(0.45 + 0.55 * n1)).lerp(cYardC, sstep(0.25, 0.8, n2) * 0.32).multiplyScalar(0.86 + 0.2 * noise.n2(x * 0.31, z * 0.31 + 3));
        const az = Math.abs(z), strip = sstep(33.5, 35, az) * (1 - sstep(38, 47, az));
        out.lerp(cPetal, strip * sstep(-0.1, 0.6, noise.n2(x * 0.09 + 5, z * 0.4)) * (blossom ? 0.6 : 0.25) * (1 - sstep(260, 268, x)) * sstep(0.2, 0.6, noise.n2(x * 0.35, z * 0.35)));   // thin drifts, none on the head of the slip
        return out.lerp(cWalk, sstep(0.3, 0.9, noise.n2(x * 0.012 + 20, z * 0.05)) * 0.5);
      }
      const raw = h - yardY(x);
      const wood = sstep(62, 108, raw + 14 * n1);
      const tt = hillRaw(e, x, z) / 6, tf = tt - Math.floor(tt), riser = tf > 0.72 && ny < 0.955 && raw < 110;
      const cut = sstep(3, 8, hillH(e, x, z) - raw);                // how far the slope was cut down under the flight: there it is a grass bank, not terraces
      if ((ny < 0.84 || riser) && wood < 0.5 && cut < 0.5) out.copy(cStone).lerp(cStoneD, sat(0.5 + 0.5 * n2)).multiplyScalar((0.9 + 0.2 * noise.n2(x * 0.4, z * 0.4 + 5)) * lerp(1, 0.74, sstep(150, 290, Math.hypot(x - 230, z - 60))));   // far walls darker: contour lines
      else {
        const gm = sstep(0.0, 0.2, groveN(x, z) + 0.1 * n2);
        const plot = sstep(0.1, 0.5, noise.n2(x * 0.03 + 60, z * 0.03 - 20));          // vegetable plots and tea rows on some terraces
        out.copy(cGrass).multiplyScalar(0.86 + 0.3 * noise.n2(x * 0.22 + 9, z * 0.22)).lerp(cSoil, sstep(0.2, 0.75, n1) * 0.6).lerp(cGrassB, plot * (0.35 + 0.35 * Math.sin((x * 0.8 + z * 0.6) * 2.1)))
          .lerp(cWalk, sstep(0.5, 0.82, n2) * 0.45).lerp(cPetal, blossom ? Math.max(gm * 0.66, 0.3 * sstep(0.0, 0.75, noise.n2(x * 0.08 + 31, z * 0.08))) : seasonName === 'november' ? sstep(0.2, 0.8, noise.n2(x * 0.08 + 31, z * 0.08)) * 0.3 : gm * 0.22);
        // fallen petals lie in a band along the lip of every terrace, under the trees that line the walls
        if (blossom && raw < 110) out.lerp(cPetal, sstep(0.44, 0.54, tf) * (1 - sstep(0.68, 0.74, tf)) * (0.25 + 0.4 * gm) * (1 - cut));
        if (cut > 0) out.lerp(cBank, cut * (0.5 + 0.3 * noise.n2(x * 0.1 + 13, z * 0.1 - 4)));
      }
      return out.lerp(cRidge, wood).lerp(cRidge2, wood * sat(0.5 + 0.9 * n2)).multiplyScalar(lerp(1, 0.86 + 0.32 * noise.n2(x * 0.055 + 3, z * 0.055 - 7), wood));   // the woods in clumps of light and dark, not felt
    };
    const land = await T.makeTerrainAsync({
      rng: rng.fork('land'), noise, height: H, corridor: false, bounds: [-520, -640, 760, 600], cell: 3, near: 40, levels: 5, maxTriangles: 40000,
      focus: (x, z) => Math.min(Math.max(0, Math.hypot(x - 232, z - 84) - 132), 24 + 1.4 * Math.max(0, Math.abs(z) - 44, -x - 30, x - 300)),
      biome: 'meadow', palette: { rock: '#a59d8f', rockB: '#8a8376', rockSlope: [0.3, 0.55], strata: 0.08, clouds: 0, tufts: 0.5, patchAmount: 0.12 }, color: colorFn, shadow: 0.66, ao: 0.3,
      waterLevel: 0, sunDir: [sunDir.x, sunDir.y, sunDir.z], skirt: 30,
    }, ctx.yield, 2);
    scene.add(land.object);
    await ctx.yield();
    const ridges = T.makeHorizonRidges({ rng: rng.fork('ridges'), layers: 3, radius: [1250, 2700], height: [80, 290], base: -25, coverage: 0.85, fog: scene.fog,
      colorNear: seasonName === 'november' ? '#6a6248' : '#57705c', sunDir: [sunDir.x, sunDir.y, sunDir.z], sunColor: look.sunCol, rim: 0.35 });
    scene.add(ridges.object);
    await ctx.yield();
    const WL = Water.waterLight(sky);
    const ocean = Water.makeOcean({ rng: rng.fork('sea'), light: WL, preset: 'calm', height: 0.06, wavelength: 38, detail: 0.25, level: 0, radius: 3400, rings: 58, segments: 84, deep: look.seaDeep, scatter: look.seaScatter, glitter: 0.8, fogColor: look.fog });
    scene.add(ocean.object);
    await ctx.yield();

    // ---------- the yard ----------
    const mats = S.makeMaterials({ night: look.night, streetY: 6, lit: 0.5, glow: 2.4 });
    mats.setSky({ top: '#' + sky.zenithColor.getHexString(), horizon: '#' + sky.horizonColor.getHexString(), sun: look.sunCol, sunDir: [sunDir.x, sunDir.y, sunDir.z] });
    await ctx.yield();
    const P = {
      stone: lin('#8d877b'), stoneLight: lin('#a9a294'), brick: lin('#8a4a38'), wood: lin('#7a5a3c'), woods: [lin('#6a4c34'), lin('#8a6a46'), lin('#4c3a2c'), lin('#9a7c58')],
      walls: [lin('#d9cfbc'), lin('#cbbfa6'), lin('#e4dccd'), lin('#b9a88c'), lin('#a89274')], plaster: lin('#e2dbcc'),
      roofs: [lin('#827f7a'), lin('#908d87'), lin('#767470'), lin('#9c9993'), lin('#7f7d7a')], roofRust: lin('#7c3c2c'), roofIron: lin('#59616a'),
      glass: lin('#9ab4c4'), dark: lin('#1c1a18'), red: lin('#c8262c'), white: lin('#eeeae0'), tub: lin('#7a6040'), pot: lin('#8a5a40'),
      plants: [lin('#5a8a3a'), lin(season.puff[0]), lin('#d8c040'), lin('#3f6a34')], fire: lin('#9a8060'), plates: [lin('#8E3B2A'), lin('#5C646C'), lin('#43494f'), lin('#7a3a2c')], rackPlates: [lin('#9a5540'), lin('#8f8172'), lin('#84604e'), lin('#7d7468'), lin('#a8644a'), lin('#9c907e')],
      rope: lin('#b09a6a'), pile: lin('#5a4a38'), deck: lin('#9a7c54'), oxide: lin('#8E3B2A'), bamboo: lin('#b8a468'), tugHull: lin('#15171a'), buff: lin('#d9a85c'), buffLight: lin('#e6d4ac'),
      green: lin('#2E6E78'), craneSteel: lin('#56605e'),
    };
    const yb = new S.Builder(32768), cr = rng.fork('clutter');
    const stackTops = boilerShop(yb, rng.fork('boiler'), P, H);
    plateRacks(yb, rng.fork('racks'), P, H);
    const flagPoles = launchStand(yb, P, slipY(285));
    await ctx.yield();
    sheds(yb, rng.fork('sheds'), P, H); quay(yb, rng.fork('quay'), P); secondSlip(yb, rng.fork('slip2'), P);
    await ctx.yield();
    // paved aprons either side of the slip: big worn setts laid in lanes that follow the yard, pink with fallen petals under the avenue
    {
      const xs = [8]; for (let x = 23; x < 266; x += 15) xs.push(x); xs.push(270, 292);
      const cA = lin('#8f887c'), cB = lin('#a3947a'), cP = lin(season.puff[1]), rows = [34, 42, 50, 58, 66, 83, 100], pk = seasonName === 'blossom' ? 0.42 : 0.16;
      const tone = (x, zm, k) => {
        const n = sat(0.5 + 0.6 * noise.n2(x * 0.045 + 3, zm * 0.045)), g = 0.84 + 0.24 * sat(0.5 + 0.7 * noise.n2(x * 0.17, zm * 0.17 + 8)), q = k * sstep(0.35, 0.8, sat(0.5 + 0.7 * noise.n2(x * 0.09 + 5, zm * 0.2)));
        return [lerp(lerp(cA[0], cB[0], n) * g, cP[0], q), lerp(lerp(cA[1], cB[1], n) * g, cP[1], q), lerp(lerp(cA[2], cB[2], n) * g, cP[2], q)];
      };
      yb.surf(SURF.MASONRY, 0, 2.4);
      const rowsE = rows.concat([118, 136]);                       // east of the slip, forward of the boiler shop, the paving runs on to the hill foot
      for (const sg of [-1, 1]) for (let j = 0; j < (sg > 0 ? rowsE : rows).length - 1; j++) for (let i = 0; i < xs.length - 1; i++) {
        if (j >= rows.length - 1 && xs[i] < 150) continue;
        const x0 = xs[i], x1 = xs[i + 1], z0 = sg > 0 ? rowsE[j] : -rows[j + 1], z1 = sg > 0 ? rowsE[j + 1] : -rows[j], zm = (z0 + z1) / 2;
        if (Math.max(H(x0, z0) - yardY(x0), H(x0, z1) - yardY(x0), H(x1, z0) - yardY(x1), H(x1, z1) - yardY(x1), H((x0 + x1) / 2, zm) - yardY((x0 + x1) / 2)) > 0.25) continue;
        const k = pk * (Math.abs(zm) > 46 && Math.abs(zm) < 70 ? 1 : 0.45), ya = yardY(x0) + 0.12, yc = yardY(x1) + 0.12;
        yb.quad([x0, ya, z0], [x0, ya, z1], [x1, yc, z1], [x1, yc, z0], [z0, x0, z1, x1], tone(x0, zm, k), tone(x1, zm, k));
      }
      yb.surf(SURF.PLAIN);
    }
    await ctx.yield();
    const spots = [];
    for (const sg of [-1, 1]) for (let x = 6; x < 276; x += cr.range(6, 11)) if (cr.chance(0.66)) spots.push([x, sg * cr.range(35.2, 38.4)]);
    for (let i = 0; i < 44; i++) spots.push([cr.range(8, 292), cr.chance(0.5) ? cr.range(55, 63) : -cr.range(52, 58)]);
    for (let i = 0; i < 26; i++) { const x = cr.range(0, 286), z = -cr.range(84, 98); if (Math.hypot(x - 210, z + 90) > 9) spots.push([x, z]); }
    for (let i = 0; i < 30; i++) spots.push(cr.chance(0.5) ? [cr.range(0, 62), cr.range(62, 126)] : [cr.range(160, 228), cr.range(62, 126)]);
    for (let i = 0; i < 22; i++) spots.push([cr.range(0, 290), -cr.range(146, 196)]);
    clutter(yb, cr, P, H, spots);
    await ctx.yield();
    // the east yard under the beam view: timber, crates and plate along a second siding (its own random stream: nothing else moves)
    const xr = ctx.core.makeRng('slipway-east-yard:' + ctx.seed);
    {
      const spotsE = [];
      for (let i = 0; i < 34; i++) { const x = xr.range(156, 298), z = xr.chance(0.55) ? xr.range(103, 109) : xr.range(115, 133); if (H(x, z) - yardY(x) < 0.3) spotsE.push([x, z]); }
      clutter(yb, xr, P, H, spotsE);
      // three plate wagons left on the siding
      for (const wx of [176, 184.5, 247]) {
        const wy = H(wx, 112) + 0.55;
        yb.col(P.woods[2], 0.8, 1).surf(SURF.PLANKS, 0, 1); yb.box(wx - 3.6, wy + 0.5, 110.8, wx + 3.6, wy + 0.85, 113.2, { m: 1.5 });
        yb.col(P.dark).surf(SURF.PLAIN); for (const dx of [-2.3, 2.3]) for (const dz of [-0.85, 0.85]) wheel(yb, wx + dx, wy + 0.1, 112 + dz, 0.5);
        for (let i = 0, n = xr.int(2, 4); i < n; i++) { yb.col(xr.pick(P.rackPlates), 0.85, 1.05).surf(SURF.PLAIN); yb.box(wx - 3.3 + xr.range(-0.2, 0.2), wy + 0.85 + i * 0.14, 111 + xr.range(-0.1, 0.1), wx + 3.3, wy + 0.97 + i * 0.14, 113, {}); }
      }
      yb.surf(SURF.PLAIN);
      await ctx.yield();
      // things with scale under the loop: long baulks stacked on bearers, plates laid in square stacks, a steam crane on the siding
      for (const [x, z, yaw] of [[168, 72, 0.08], [191, 85, -0.06], [214, 70, 0.04], [209, 96, 0.1], [176, 98, 1.5], [262, 101, 0.05], [285, 99, 0.12], [163, 121, 0.03]]) {
        const L = xr.range(12, 20), rows = xr.int(3, 4), per = xr.int(3, 5);
        if (H(x, z) - yardY(x) > 0.3) continue;
        yb.tr(x, H(x, z), z, yaw);
        yb.col(P.woods[2], 0.8, 1).surf(SURF.PLANKS, 0, 1); for (const dx of [-L * 0.32, 0, L * 0.32]) yb.box(dx - 0.25, -0.3, -per * 0.5, dx + 0.25, 0.4, per * 0.5, {});
        for (let r = 0; r < rows; r++) for (let i = 0; i < per - (r > 1 ? 1 : 0); i++) {
          const o = xr.range(-0.7, 0.7), z0 = (i - per / 2) * 0.95 + (r > 1 ? 0.45 : 0);
          yb.col(xr.pick(P.woods), 0.85, 1.2).surf(SURF.PLANKS, 0, 1); yb.box(-L / 2 + o, 0.4 + r * 0.72, z0 + 0.06, L / 2 + o, 0.4 + r * 0.72 + 0.66, z0 + 0.86, { m: 1.5 });
        }
        yb.pop();
      }
      for (const [x, z] of [[227, 101], [157, 97], [201, 66], [276, 97], [243, 122]]) {
        const n = xr.int(4, 8), yaw = xr.range(-0.2, 0.2);
        if (H(x, z) - yardY(x) > 0.3) continue;
        yb.tr(x, H(x, z), z, yaw);
        yb.col(P.woods[0], 0.8, 1).surf(SURF.PLANKS, 0, 1); for (const dz of [-2.6, 0, 2.6]) yb.box(-4, -0.3, dz - 0.2, 4, 0.3, dz + 0.2, {});
        for (let i = 0; i < n; i++) { const ox = xr.range(-0.5, 0.5), oz = xr.range(-0.5, 0.5); yb.col(xr.pick(P.rackPlates), 0.85, 1.1).surf(SURF.STEEL, 0, 0); yb.box(-4 + ox, 0.3 + i * 0.15, -4 + oz, 4 + ox, 0.42 + i * 0.15, 4 + oz, { capStyle: SURF.STEEL, capM: 0.5 }); }
        yb.pop();
      }
      {
        const cx = 225, cy = H(cx, 112) + 0.55;
        yb.tr(cx, cy, 112, 0);
        yb.col(P.dark, 1.5, 1.8).surf(SURF.PLAIN); yb.box(-3.6, 0.45, -1.25, 3.6, 0.95, 1.25, {});
        for (const dx of [-2.3, 2.3]) for (const dz of [-0.9, 0.9]) wheel(yb, dx, 0.1, dz, 0.5);
        yb.cbox(-3.1, 0.95, 0, 1.3, 1.5, 2.3);
        yb.col(P.green, 0.7, 0.9).surf(SURF.PLANKS, 0, 1); yb.box(-2.4, 0.95, -1.35, 0.6, 3.9, 1.35, { m: 1 });
        yb.col(P.roofIron, 0.9, 1).surf(SURF.PLAIN); yb.box(-2.8, 3.9, -1.6, 1.0, 4.08, 1.6, { bottom: true });
        yb.col(P.dark, 1.2, 1.6); yb.cyl(-1.5, 0.95, 0, 0.78, 0.72, 4.5, 10); yb.cyl(-1.5, 5.45, 0, 0.3, 0.27, 1.7, 8);
        yb.col(P.craneSteel, 0.9, 1.1);
        for (const dz of [-0.55, 0.55]) yb.beam([0.7, 1.7, dz], [10.6, 11.6, dz * 0.25], 0.26);
        for (let i = 1; i < 6; i++) { const f = i / 6, g = (i + 1) / 6, e = i % 2 ? 1 : -1; yb.beam([lerp(0.7, 10.6, f), lerp(1.7, 11.6, f), e * lerp(0.55, 0.14, f)], [lerp(0.7, 10.6, g), lerp(1.7, 11.6, g), -e * lerp(0.55, 0.14, g)], 0.12); }
        yb.col(P.dark); yb.beam([10.6, 11.6, 0], [10.6, 4.4, 0], 0.09); yb.beam([-0.6, 4.0, 0], [10.6, 11.6, 0], 0.07); yb.cbox(10.6, 3.8, 0, 0.5, 0.7, 0.5);
        yb.col(P.rackPlates[0], 0.9, 1).surf(SURF.STEEL, 0, 0); yb.box(7.4, 3.2, -1.2, 13.8, 3.32, 1.2, { capStyle: SURF.STEEL, capM: 0.5, bottom: true });
        yb.col(P.dark).surf(SURF.PLAIN); for (const dx of [-2.6, 2.6]) yb.beam([10.6, 3.85, 0], [10.6 + dx, 3.34, 0], 0.05);
        yb.pop();
      }
      yb.surf(SURF.PLAIN);
    }
    await ctx.yield();
    const yard = new THREE.Mesh(yb.toGeometry(), mats.facades); scene.add(yard);
    await ctx.yield();
    const crane = craneGeometry(P), craneY = H(210, -90);
    const craneTower = new THREE.Mesh(crane.tower, mats.facades), jib = new THREE.Mesh(crane.jib, mats.facades);
    craneTower.position.set(210, craneY, -90); jib.position.set(210, craneY + crane.H, -90); scene.add(craneTower, jib);
    await ctx.yield();
    const track = S.makeTracks({ mats, points: [[6, 0, 41.5], [150, 0, 41.5], [292, 0, 41.5]], straight: true, heightAt: H });
    await ctx.yield();
    const siding = S.makeTracks({ mats, points: [[154, 0, 112], [225, 0, 112], [296, 0, 112]], straight: true, heightAt: H });
    scene.add(siding.object);
    await ctx.yield();
    const loco = S.makeTrain({ rng: rng.fork('loco'), mats, track, type: 'steam', cars: 3, speed: 3.4, loop: 'pingpong', start: rng() });
    await ctx.yield();
    const fenceE = S.makeFence({ mats, type: 'rail', points: [[4, 0, 46], [150, 0, 46], [294, 0, 46]], heightAt: H, height: 1.3 });
    const fenceW = S.makeFence({ mats, type: 'rail', points: [[4, 0, -46], [150, 0, -46], [294, 0, -46]], heightAt: H, height: 1.3 });
    await ctx.yield();
    const poles = S.makePowerLines({ rng: rng.fork('poles'), mats, points: [[2, 0, -174], [150, 0, -176], [290, 0, -172]], heightAt: H, type: 'pole', spacing: 38, lamps: 0.5 });
    await ctx.yield();
    const lampPos = [];
    for (let x = 14; x < 292; x += 31) for (const z of [-48.5, 48.5]) lampPos.push([x, H(x, z), z]);
    const lamps = S.makeLamps({ mats, type: 'post', positions: lampPos, pool: look.night > 0.2, power: 2.4 });
    scene.add(track.object, loco.object, fenceE.object, fenceW.object, poles.object, lamps.object);
    await ctx.yield();

    // ---------- the town on the terraces: one scan decides houses, trees, stairs ----------
    const tr = rng.fork('town'), arcC = A.turnCentre, flats = [], nearH = [], farH = [], nearT = [], puffs = [], bushes = [];
    const flatAt = (x, z, h) => Math.abs(H(x + 4, z) - h) < 0.7 && Math.abs(H(x - 4, z) - h) < 0.7 && Math.abs(H(x, z + 4) - h) < 0.7 && Math.abs(H(x, z - 4) - h) < 0.7;
    for (let gx = -330; gx < 700; gx += 9.5) {
      for (let gz = -600; gz < 560; gz += 9.5) {
        const x = gx + tr.range(-3.4, 3.4), z = gz + tr.range(-3.4, 3.4), r = tr(), e = hillE(x, z);
        if (e < 5) continue;
        const h = H(x, z); if (h < 2.4) continue;
        const raw = h - yardY(x), dA = Math.hypot(x - arcC[0], z - arcC[2]);
        if (raw > 96) { if (r < 0.8) puffs.push({ x, y: h, z, dark: true, big: 1.4 }); continue; }
        if (!flatAt(x, z, h)) { if (dA < 230 ? r < 0.5 : r < (dA < 360 ? 0.3 : 0.12)) (dA < 230 ? bushes : puffs).push({ x, y: h - 0.6, z, dark: r > 0.55, big: dA < 230 ? tr.range(0.3, 0.55) : 0.8 }); continue; }
        const ex = hillE(x + 3, z) - hillE(x - 3, z), ez = hillE(x, z + 3) - hillE(x, z - 3), yaw = Math.atan2(-ex, -ez), d = path.nearestXZ(x, z).dist;
        const it = { x, y: h, z, yaw, d, raw, dA };
        flats.push(it);
        if (r < 0.4) (dA < 170 || d < 110 ? nearH : farH).push(it);
        else if (r < 0.88) { if (dA < 215 || d < 130) nearT.push(it); else puffs.push({ x, y: h, z, dark: raw > 80 || (r > 0.8 && groveN(x, z) < -0.3), big: 1 }); }
      }
      await ctx.yield();
    }
    for (let gx = 150; gx < 372; gx += 6.2) {                                             // the hill feet that face the loop, sown closer
      for (let gz = -44; gz < 214; gz += 6.2) {
        const x = gx + tr.range(-2.2, 2.2), z = gz + tr.range(-2.2, 2.2), r = tr(), dA = Math.hypot(x - arcC[0], z - arcC[2]);
        if (dA > 172 || hillE(x, z) < 5) continue;
        const h = H(x, z); if (h < 17.5 || !flatAt(x, z, h)) continue;
        const n = path.nearestXZ(x, z); if (n.y - h < 13.5) continue;
        const ex = hillE(x + 3, z) - hillE(x - 3, z), ez = hillE(x, z + 3) - hillE(x, z - 3), it = { x, y: h, z, yaw: Math.atan2(-ex, -ez), d: n.dist, raw: h - yardY(x), dA };
        flats.push(it);
        if (r < 0.3) nearH.push(it); else if (r < 0.9) nearT.push(it);
      }
      if ((Math.round((gx - 150) / 6.2) & 3) === 3) await ctx.yield();
    }
    await ctx.yield();
    const tb = new S.Builder(32768), cloths = [], people = [], brollies = [], taken = [];
    const free = (x, z, r) => !taken.some((q) => Math.hypot(q[0] - x, q[1] - z) < q[2] + r);
    const kimono = ['#2c3a5c', '#3d4a6a', '#6a6f78', '#e8e4da', '#8a4a4a', '#4a5a4c', '#b9a88c', '#20242c', '#7a5a7a', '#c9b7a0'].map((c) => new THREE.Color(c));
    const sunshade = (wet ? ['#c9a05a', '#b98a48', '#d8b874', '#a8763c'] : ['#f4f1ea', '#F2B8C9', '#a9c8e6', '#f4f1ea', '#f7d3de', '#e8e2c8']).map((c) => new THREE.Color(c));
    const linen = ['#f1eee6', '#f1eee6', '#2c3a5c', '#F2B8C9', '#a9c8e6', '#e3d9b8', '#8a4a4a'].map((c) => new THREE.Color(c));
    const person = (x, y, z, pr) => {
      people.push({ x, y, z, ry: pr() * TAU, sx: pr.range(0.85, 1.1), sy: pr.range(0.82, 1.12), c: pr.pick(kimono) });
      if (pr.chance(wet ? 0.7 : 0.3)) brollies.push({ x: x + pr.range(-0.1, 0.1), y: y + pr.range(1.72, 1.95), z: z + pr.range(-0.1, 0.1), ry: pr() * TAU, rx: pr.range(-0.2, 0.2), sx: pr.range(0.85, 1.15), c: pr.pick(sunshade) });
    };
    // landmarks first: two temples and the church take the best flat seats near their marks
    const seat = (tx, tz, lo, hi) => { let best = null, bd = 1e9; for (const f of flats) { const dd = Math.hypot(f.x - tx, f.z - tz); if (dd < bd && f.raw > lo && f.raw < hi && f.d > 30 && free(f.x, f.z, 12)) { bd = dd; best = f; } } if (best) taken.push([best.x, best.z, 13]); return best; };
    const temples = [];
    for (const [tx, tz, tiers] of [[452, 30, 3], [150, -330, 2]]) {
      const f = seat(tx, tz, 22, 70); if (!f) continue;
      temples.push(S.makeBuilding({ rng: tr.fork('temple' + tiers), style: 'pagoda', tiers, width: 9.5, height: tiers * 6.5 + 4, mats, position: [f.x, f.y, f.z], rotationY: f.yaw,
        palette: { roof: '#4f5860', wall: '#e2dbcc', wood: '#6a3a2c', trim: '#c8b890', accent: '#ffc27a' } }));
      await ctx.yield();
    }
    const ch = seat(118, 228, 24, 70);
    if (ch) {
      tb.tr(ch.x, ch.y, ch.z, ch.yaw);
      tb.col(P.stone, 0.6, 1).surf(SURF.MASONRY, 0, 1); tb.box(-5.6, -3.5, -9.6, 5.6, 0.4, 9.6, { m: 1 });
      tb.col(P.white, 0.85, 1).surf(SURF.ARCHED, 0.31, 1); tb.box(-5, 0.4, -9, 5, 7.4, 9, { cellW: 3, cellH: 7, top: false });
      tb.col(P.roofs[2], 0.9, 1).surf(SURF.PLAIN); tb.gable(-5, -9, 5, 9, 7.4, 4.4, { alongX: false, overhang: 0.5, wallColor: P.white });
      tb.col(P.white, 0.8, 1).surf(SURF.ARCHED, 0.62, 1); tb.box(-2.2, 0.4, 9, 2.2, 15, 12.6, { cellW: 2.2, cellH: 7.3 });
      tb.col(P.green, 0.8, 1.1).surf(SURF.PLAIN); tb.frustum(0, 10.8, 4.9, 4.1, 0.2, 0.2, 15, 27); tb.col(P.buff); tb.beam([0, 27, 10.8], [0, 29.4, 10.8], 0.14); tb.beam([-0.7, 28.5, 10.8], [0.7, 28.5, 10.8], 0.14);
      tb.pop();
    }
    // real houses round the turn, each with its own life: laundry, people, a stair down the wall
    nearH.sort((a, b) => a.d - b.d);
    const maxNear = Math.round(138 * Math.min(1.12, density)), carp = seasonName === 'may';
    let nh = 0;
    for (const f of nearH) {
      if (nh >= maxNear) { farH.push(f); continue; }
      if (!free(f.x, f.z, 6.2)) continue;
      const hr = tr.fork('h' + nh), info = hillHouse(tb, hr, P, f.x, f.y + 0.05, f.z, f.yaw), sn = Math.sin(f.yaw), cs = Math.cos(f.yaw);
      const W = (lx, lz) => [f.x + lx * cs + lz * sn, f.z - lx * sn + lz * cs];
      taken.push([f.x, f.z, 5.6]); nh++;
      if (hr.chance(f.d < 80 ? 0.8 : 0.5)) {
        const a = W(-info.w / 2 + 0.5, info.d / 2 + 2), c = W(info.w / 2 - 0.5, info.d / 2 + 2), n = hr.int(3, 6);
        tb.col(P.bamboo, 0.8, 1).surf(SURF.PLAIN); tb.beam([a[0], f.y, a[1]], [a[0], f.y + 2.6, a[1]], 0.09); tb.beam([c[0], f.y, c[1]], [c[0], f.y + 2.6, c[1]], 0.09); tb.beam([a[0], f.y + 2.5, a[1]], [c[0], f.y + 2.5, c[1]], 0.06);
        for (let i = 0; i < n; i++) { const t = (i + hr.range(0.1, 0.5)) / n; cloths.push({ x: lerp(a[0], c[0], t), y: f.y + 2.47, z: lerp(a[1], c[1], t), ry: f.yaw, sx: hr.range(0.6, 1.1), sy: hr.range(0.7, 1.4), sz: 1, c: hr.pick(linen), mode: 0 }); }
      }
      if (hr.chance(0.75)) for (let i = hr.int(1, 5); i > 0; i--) { const p = W(hr.range(-info.w / 2, info.w / 2), info.d / 2 + hr.range(1.4, 3.6)), y = H(p[0], p[1]); if (Math.abs(y - f.y) < 0.6) person(p[0], y, p[1], hr); }
      if (carp && hr.chance(0.3)) {
        const p = W(info.w / 2 + 1.2, -1);
        tb.col(P.bamboo, 0.8, 1).surf(SURF.PLAIN); tb.beam([p[0], f.y, p[1]], [p[0], f.y + 11, p[1]], 0.12);
        ['#1c1c22', '#c8262c', '#2f5a9a'].forEach((cc, i) => cloths.push({ x: p[0], y: f.y + 10.6 - i * 1.5, z: p[1], ry: -PI / 2, sx: 3.4 - i * 0.5, sy: 0.8 - i * 0.1, sz: 1, c: new THREE.Color(cc), mode: 1 }));
      }
      if (hr.chance(0.3)) {                                           // a stone stair down the retaining wall in front
        let s1 = 0, s2 = 0;
        for (let s = info.d / 2 + 1; s < 15; s += 0.5) { const y = H(f.x + sn * s, f.z + cs * s); if (!s1) { if (y < f.y - 0.4) s1 = s - 0.5; } else if (y - H(f.x + sn * (s + 1), f.z + cs * (s + 1)) < 0.12) { s2 = s; break; } }
        if (s1 && s2 > s1 + 1) {
          const drop = f.y - H(f.x + sn * s2, f.z + cs * s2), n = Math.max(4, Math.ceil(drop / 0.42)), rise = drop / n, run = (s2 - s1) / n;
          tb.tr(f.x + sn * s1, f.y, f.z + cs * s1, f.yaw); tb.col(P.stoneLight, 0.75, 1).surf(SURF.MASONRY, 0, 1.5);
          for (let i = 0; i < n; i++) tb.box(-1.15, -(i + 0.5) * rise - 1.8, i * run, 1.15, -(i + 0.5) * rise, (i + 1) * run + 0.04, { m: 1 });
          tb.pop(); tb.surf(SURF.PLAIN);
          for (let i = hr.int(0, 3); i > 0; i--) { const k = hr.int(0, n - 1), s = s1 + (k + 0.5) * run; person(f.x + sn * s + cs * hr.range(-0.6, 0.6), f.y - (k + 0.5) * rise, f.z + cs * s - sn * hr.range(-0.6, 0.6), hr); }
        }
      }
      if ((nh & 7) === 0) await ctx.yield();
    }
    await ctx.yield();
    const town = new THREE.Mesh(tb.toGeometry(), mats.facades); scene.add(town);
    for (const t of temples) scene.add(t.object);
    await ctx.yield();
    // real stone retaining walls under the terraces the turn skims: wherever a flat site looks over a drop of 3 m or more, a block of
    // coursed masonry fills the clay riser from the lip of the terrace to its foot (a paved lip above, a wall face below)
    {
      const wb = new S.Builder(8192), done = [], ys = new Float32Array(14), sites = flats.filter((f) => f.d < 120).sort((a, b) => a.d - b.d), maxW = Math.round(420 * detail);
      const cap = lin('#b9b09c');
      for (let i = 0, n = 0; i < sites.length && n < maxW; i++) {
        const f = sites[i], sn = Math.sin(f.yaw), cs = Math.cos(f.yaw);
        if ((i & 15) === 15) await ctx.yield();
        if (H(f.x + sn * 6, f.z + cs * 6) > f.y - 3) continue;
        if (done.some((q) => Math.abs(q[2] - f.y) < 1.5 && Math.hypot(q[0] - f.x, q[1] - f.z) < 8.2)) continue;
        for (let k = 0; k < 14; k++) ys[k] = H(f.x + sn * k, f.z + cs * k);
        let a = -1; for (let k = 1; k <= 11; k++) if (ys[k] < f.y - 0.5) { a = k - 1; break; }
        if (a < 0) continue;
        let c = a + 1; while (c < 12 && ys[c] - ys[c + 1] > 0.15) c++;
        const drop = f.y - ys[c]; if (drop < 3 || drop > 13) continue;
        const lift = 0.1 + 0.05 * ((i * 7) % 5) / 5;
        wb.tr(f.x, f.y, f.z, f.yaw);
        wb.col(P.stone, 0.6, 1.02).surf(SURF.MASONRY, 0, 1.5); wb.box(-4.75, -drop - 0.8, a + 0.15, 4.75, lift, c + 0.4, { m: 1, capColor: cap, capStyle: SURF.MASONRY, capM: 1 });
        wb.pop(); done.push([f.x, f.z, f.y]); n++;
      }
      wb.surf(SURF.PLAIN);
      await ctx.yield();
      scene.add(new THREE.Mesh(wb.toGeometry(), mats.facades));
    }
    await ctx.yield();
    // the rest of the town as instanced grey gables
    const farItems = [], maxFar = Math.round(650 * detail), tintC = new THREE.Color();
    tr.shuffle(farH);
    for (const f of farH) {
      if (farItems.length >= maxFar) break;
      if (!free(f.x, f.z, 5.5) || (f.d > 150 && noise.n2(f.x * 0.011 + 40, f.z * 0.011 + 9) < -0.12)) continue;     // hamlets, not an even scatter
      const g = tr.range(0.78, 1.22);
      farItems.push({ x: f.x, y: f.y, z: f.z, ry: f.yaw, sx: tr.range(0.8, 1.25), sy: tr.range(0.85, 1.35), sz: tr.range(0.85, 1.2), c: tintC.setRGB(g * tr.range(0.97, 1.05), g, g * tr.range(0.97, 1.06)).clone() });
    }
    await ctx.yield();
    const farTown = instanced(farHouseGeometry(), new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide }), farItems); scene.add(farTown);
    await ctx.yield();

    // ---------- trees: cherries (or maples) with their own wind near the turn, blossom puffs beyond ----------
    const wind = flora.makeWind({ direction: [0.15, 1], strength: wet ? 0.6 : 0.9, speed: 1 });
    await ctx.yield();                                              // the leaf atlas is drawn in short steps by the kit, at half size
    const leafOpts = { size: 512 };                                 // (no tree stands closer than 8 m to the flight)
    await flora.prepareLeafTexture(leafOpts, ctx.yield);
    const leafMap = flora.makeLeafTexture(leafOpts);
    await ctx.yield();
    const treeMat = flora.windMaterial({ wind, map: leafMap, backlight: 1.3, backlightTint: seasonName === 'blossom' ? '#ffd9e6' : seasonName === 'may' ? '#d8ff7a' : '#ffb060', ambient: 1.3, leafAmbient: 1.25 });
    await ctx.yield();
    nearT.sort((a, b) => a.d - b.d);
    const treePts = [], maxT = Math.round(120 * detail), nD1 = Math.round(14 * detail);
    for (const f of nearT) {
      if (!free(f.x, f.z, 3.4) || path.distanceTo(f.x, f.y + 8, f.z) < 8.5) continue;
      if (treePts.length >= maxT) { const dk = tr.chance(0.15); puffs.push({ x: f.x, y: f.y, z: f.z, dark: dk && groveN(f.x, f.z) < -0.1, big: 0.9 }); continue; }
      const v = f.d > 30 && tr.chance(0.13) ? 2 : f.d > 20 && tr.chance(0.08) ? 3 : tr.int(0, 1);
      treePts.push({ x: f.x, y: f.y, z: f.z, s: tr.range(0.82, 1.1), rot: tr() * TAU, d: f.d, u: 0, v }); taken.push([f.x, f.z, 2.6]);
    }
    // the yard's own cherries: an avenue behind each fence, where the crowd stands, and a row along the quay either side of the slip
    // foot, so there is blossom in the first picture and all the way down the straight
    {
      const av = rng.fork('avenue');
      const tree = (x, z) => {
        const y = H(x, z); if (y - yardY(x) > 0.5 || y < 1.5 || path.distanceTo(x, y + 9, z) < 15) return;
        treePts.push({ x, y, z, s: av.range(1.28, 1.56), rot: av() * TAU, d: path.nearestXZ(x, z).dist, u: 0, v: av.int(0, 1) });
      };
      for (let x = 20; x <= 280; x += 13) {
        if (!(x > 80 && x < 124) && x < 228) tree(x + av.range(-1.5, 1.5), 57 + av.range(-1, 1));
        tree(x + av.range(-1.5, 1.5), -57 + av.range(-1, 1));
      }
      for (const z of [38, 74, 92, 110, 128, -38, -74, -92, -150, -168]) tree(10 + av.range(-1, 1), z + av.range(-1.5, 1.5));
      for (let x = 158; x <= 292; x += 12.5) tree(x + av.range(-2, 2), 122 + av.range(-2.5, 2.5));     // along the east yard, between the siding and the hill foot
      treePts.sort((a, b) => a.d - b.d);
    }
    const dCut = treePts.length > nD1 ? (treePts[nD1 - 1].d + treePts[nD1].d) / 2 : 1e9;
    const fr = rng.fork('trees'), leafP = { leaf: season.leaf, leafLight: season.leafLight, leafDark: season.leafDark };
    const mk = seasonName === 'november' ? (o) => flora.mapleGeometry(o) : (o) => flora.cherryGeometry({ ...o, ...leafP });
    const kinds = async (d) => {                                     // four tree geometries, a step each
      const a = mk({ rng: fr, detail: d, height: 8.6 }); await ctx.yield();
      const b = mk({ rng: fr, detail: d, height: 7.4 }); await ctx.yield();
      const c = flora.pineGeometry({ rng: fr, detail: d, height: 13 }); await ctx.yield();
      return [a, b, c, flora.bambooGeometry({ rng: fr, detail: d, height: 9.5 })];
    };
    const nearKinds = await kinds(1); await ctx.yield();
    const farKinds = await kinds(0); await ctx.yield();
    const trees = flora.makeScatter({ rng: fr, points: treePts, variants: nearKinds, farVariants: farKinds, farDistance: dCut, material: treeMat, tint: 0.12, hue: 0.03 });
    scene.add(trees.object);
    await ctx.yield();
    {                                                                // their ground shadows, a step of their own
      const casters = treePts.map((p) => ({ x: p.x, z: p.z, r: ((p.d > dCut ? farKinds : nearKinds)[p.v % 4].userData.radius || 1) * p.s }));
      const shadowSheet = flora.makeGroundShadows({ points: casters, sunDir: [sunDir.x, sunDir.y, sunDir.z], strength: 0.42,
        heightAt: (x, z) => { const h = H(x, z), az = Math.abs(z); return az > 34 && az < 100 && x > 8 && x < 292 && h - yardY(x) < 0.25 ? h + 0.15 : h; } });   // on the paved aprons, not under them
      scene.add(shadowSheet.object);
    }
    await ctx.yield();
    // crowns beyond the real trees. Near the flight: lobed crowns with a shaded underside on a stub trunk, and lobed shrubs on the
    // terrace walls; far off: single lobes, lit above and dark below, so a hillside of them reads as blossom and not as boulders.
    const puffC = season.puff.map((c) => new THREE.Color(c).multiplyScalar(0.92)), darkC = (seasonName === 'november' ? ['#6a6a36', '#8a7434', '#4c6238', '#c8702a'] : ['#4c7a46', '#5d8c48', '#3f6a40', '#547f56']).map((c) => new THREE.Color(c));
    const whiteC = new THREE.Color('#fff4f6');
    for (const q of puffs) q.d = path.nearestXZ(q.x, q.z).dist;
    await ctx.yield();
    puffs.sort((q1, q2) => q1.d - q2.d);
    const nLobed = Math.round(230 * detail), nearPuffs = puffs.slice(0, nLobed).filter((q) => path.distanceTo(q.x, q.y + 8, q.z) > 9.5), restPuffs = tr.shuffle(puffs.slice(nLobed));
    // The hills are blossom first, camphor and pine second, and neither is sown evenly. Pink crowns stand only inside the grove mask, each
    // with a sibling a few metres along the contour, so that they run together into drifts on the terrace lips; dark crowns keep to the
    // ridge cap and the gullies, in clumps of their own.
    const farPuffs = [];
    {
      const facing = restPuffs.filter((q) => !q.dark && groveN(q.x, q.z) > -0.3 && Math.hypot(q.x - arcC[0], q.z - arcC[2]) < 340).slice(0, Math.round(300 * detail)), seen = new Set(facing);
      const base = facing.concat(restPuffs.filter((q) => !q.dark && !seen.has(q) && groveN(q.x, q.z) > 0.02).slice(0, Math.round(300 * detail)));     // thickest on the hill faces the loop looks at
      for (let i = 0; i < base.length; i++) {
        const q = base[i], ex = hillE(q.x + 3, q.z) - hillE(q.x - 3, q.z), ez = hillE(q.x, q.z + 3) - hillE(q.x, q.z - 3), l = Math.hypot(ex, ez) || 1;
        farPuffs.push(q);
        for (const o of [tr.range(5.5, 8), -tr.range(5.5, 8)]) { const x = q.x - ez / l * o, z = q.z + ex / l * o; farPuffs.push({ x, y: Math.max(H(x, z), q.y - 2.5), z, dark: false, big: q.big * tr.range(0.75, 1) }); }
        if ((i & 127) === 127) await ctx.yield();
      }
      await ctx.yield();
      for (const q of restPuffs) if (q.dark && noise.n2(q.x * 0.02 + 3, q.z * 0.02 + 8) > -0.05 && farPuffs.push(q) >= base.length * 3 + Math.round(110 * detail)) break;
    }
    await ctx.yield();
    // shrubs on the walls and banks: the nearest to the flight first (the carved slope under the turn has little else), then a scatter of the rest
    const bushOk = bushes.filter((q) => path.distanceTo(q.x, q.y + 3, q.z) > 9); for (const q of bushOk) q.d = path.nearestXZ(q.x, q.z).dist;
    bushOk.sort((q1, q2) => q1.d - q2.d);
    const nSh = Math.round(200 * detail), restSh = tr.shuffle(bushOk.slice(Math.round(nSh * 0.6))), shrubs = bushOk.slice(0, Math.round(nSh * 0.6)).concat(restSh.slice(0, Math.round(nSh * 0.4)));
    const bankSh = restSh.slice(Math.round(nSh * 0.4), Math.round(nSh * 0.4) + Math.round(240 * detail));     // and more of them as plain domes, so the cut banks round the turn are not bare
    const sway = 'float ph = instanceMatrix[3].x * 0.37 + instanceMatrix[3].z * 0.51; transformed.x += sin(uT * 0.9 + ph) * 0.12 * (position.y + 1.); transformed.z += sin(uT * 0.7 + ph * 1.3) * 0.09 * (position.y + 1.);';
    const puffMat = animLambert({ vertexColors: true, side: THREE.DoubleSide }, uT, '', sway, 'puff', null, 'totalEmissiveRadiance += diffuseColor.rgb * 0.2;');     // a floor of their own colour: crowns in shade stay blossom
    const lobedItems = nearPuffs.map((q) => {
      const sc = tr.range(2.7, 4.3) * q.big, g = tr.range(0.88, 1.12), sy = sc * tr.range(0.7, 0.9);
      return { x: q.x, y: q.y + sy * 1.5, z: q.z, ry: tr() * TAU, sx: sc, sy, sz: sc * tr.range(0.85, 1.15), c: tr.pick(q.dark ? darkC : puffC).clone().multiplyScalar(g) };
    }).concat(shrubs.map((q) => {
      const sc = tr.range(3.0, 5.0) * q.big, g = tr.range(0.85, 1.1), sy = sc * tr.range(0.6, 0.8);
      return { x: q.x, y: q.y + sy * 0.55, z: q.z, ry: tr() * TAU, sx: sc, sy, sz: sc * tr.range(0.85, 1.15), c: tr.pick(tr.chance(groveN(q.x, q.z) > -0.1 ? 0.9 : 0.2) ? puffC : darkC).clone().multiplyScalar(g) };
    }));
    const farItems2 = farPuffs.map((q) => {
      const sc = (q.dark ? tr.range(4.4, 7.2) : tr.range(6.5, 10)) * Math.min(1.15, q.big), g = tr.range(0.82, 1.14);
      const sy = sc * (q.dark ? tr.range(0.7, 0.9) : tr.range(0.58, 0.78));   // domes sunk in the slope, three abreast along the wall: a drift of canopy, not a row of pills
      const c = tr.pick(q.dark ? darkC : puffC).clone().multiplyScalar(g); if (!q.dark && blossom && tr.chance(0.33)) c.lerp(whiteC, 0.25);
      return { x: q.x, y: q.y + sy * 0.22, z: q.z, ry: tr() * TAU, sx: sc, sy, sz: sc * tr.range(0.85, 1.15), c };
    });
    scene.add(instanced(crownGeometry([[0, 0.1, 0, 0.95], [0.8, -0.15, 0.25, 0.68], [-0.55, -0.1, -0.6, 0.72]], true), puffMat, lobedItems));
    for (const q of bankSh) {
      const sc = tr.range(2.2, 3.8), sy = sc * tr.range(0.6, 0.85), g = tr.range(0.85, 1.1);
      farItems2.push({ x: q.x, y: q.y + sy * 0.2, z: q.z, ry: tr() * TAU, sx: sc, sy, sz: sc * tr.range(0.85, 1.15), c: tr.pick(tr.chance(groveN(q.x, q.z) > -0.1 ? 0.85 : 0.2) ? puffC : darkC).clone().multiplyScalar(g) });
    }
    scene.add(instanced(crownGeometry([[0, 0, 0, 1]], false), puffMat, farItems2));
    await ctx.yield();

    // ---------- the crowd (bobbing specks), parasols, cloth ----------
    const pr = rng.fork('crowd'), crowdK = density * detail, throng0 = people.length, uCheer = { value: 0 };
    const throng = (n, x0, x1, z0, z1, yFn) => { for (let i = Math.round(n * crowdK); i > 0; i--) { const x = pr.range(x0, x1), z = pr.range(z0, z1); person(x, yFn ? yFn(x, z) : H(x, z), z, pr); } };
    throng(330, 6, 292, 47, 52.5); throng(330, 6, 292, -52.5, -47);
    throng(210, 100, 240, 47, 54);                                 // thickest along the east fence, where she passes closest
    throng(190, 281, 290.8, -13, 13, () => slipY(285) + 1.7);
    throng(230, 272, 279.4, -44, 44); throng(130, 292.5, 299, -60, 60);
    throng(80, -2.2, 5, 36, 140); throng(60, -2.2, 5, -99, -36); throng(22, -56, -8, 85, 89, () => 1.85);
    await ctx.yield();
    const bob = 'float ph = instanceMatrix[3].x * 12.9898 + instanceMatrix[3].z * 78.233;';
    const crowd = instanced(personGeometry(), animLambert({ vertexColors: true, side: THREE.DoubleSide }, uT, 'uniform float uCheer;',
      bob + 'transformed.y += abs(sin(uT * (2.1 + fract(ph) * 1.6) + ph)) * (0.13 + 0.2 * uCheer) * step(0.01, position.y); transformed.x += sin(uT * 1.3 + ph * 1.7) * 0.06 * position.y;', 'crowd', { uCheer }), people);
    // hats thrown as she goes: flecks that leap from the crowd and fall back, each on its own beat
    const hatC = ['#e2cf9a', '#f1eee6', '#2a2a30', '#d9c28a', '#8a4a4a', '#f1eee6'].map((c) => new THREE.Color(c)), hatItems = [];
    for (let i = throng0, step = Math.max(1, Math.floor((people.length - throng0) / Math.round(320 * detail))); i < people.length; i += step) {
      const q = people[i]; hatItems.push({ x: q.x, y: q.y + 1.75, z: q.z, ry: pr() * TAU, rx: pr.range(-0.5, 0.5), sx: pr.range(0.8, 1.25), c: pr.pick(hatC) });
    }
    const hats = instanced(new THREE.ConeGeometry(0.3, 0.14, 6, 1, true), animLambert({ side: THREE.DoubleSide }, uT, 'uniform float uCheer;',
      bob + 'float cy_ = fract(uT * (0.3 + 0.22 * fract(ph * 3.7)) + fract(ph * 1.3)), th_ = clamp(cy_ * 1.6, 0., 1.), up_ = 4. * th_ * (1. - th_);\n' +
      'transformed *= uCheer; transformed.y += up_ * (2.4 + 3.2 * fract(ph * 1.9)) * uCheer; transformed.x += sin(ph * 5.) * th_ * 1.1 + sin(uT * 9. + ph) * 0.12 * up_; transformed.z += cos(ph * 3.) * th_ * 0.9;', 'hat', { uCheer }), hatItems);
    const shades = instanced(new THREE.ConeGeometry(0.62, 0.2, 8, 1, true), animLambert({ side: THREE.DoubleSide }, uT, '',
      bob + 'transformed.y += sin(uT * (1.5 + fract(ph)) + ph) * 0.2; transformed.x += sin(uT * 0.9 + ph) * 0.1;', 'shade'), brollies);
    [['#c8262c', '#f1eee6', '#c8262c'], ['#5a3f93', '#f2c230', '#c8262c']].forEach((cols, k) => cols.forEach((cc, i) =>     // striped launch flags, three cloths each
      cloths.push({ x: flagPoles[k][0], y: flagPoles[k][1] - i * 0.9, z: flagPoles[k][2], ry: -PI / 2, sx: 4.4 - i * 0.25, sy: 0.9, sz: 1, c: new THREE.Color(cc), mode: 1 })));
    for (let x = 40; x < 280; x += 60) for (const z of [-46, 46]) cloths.push({ x, y: H(x, z) + 6.3, z, ry: -PI / 2, sx: 2.6, sy: 1.5, sz: 1, c: pr.pick(sunshade), mode: 1, pole: true });
    const cg = clothGeometry(); cg.setAttribute('aMode', new THREE.InstancedBufferAttribute(new Float32Array(cloths.map((c) => c.mode)), 1));
    const clothMesh = instanced(cg, animLambert({ side: THREE.DoubleSide }, uT, 'attribute float aMode;',
      'float ph = instanceMatrix[3].x * 1.3 + instanceMatrix[3].z * 1.7, wg = mix(-position.y, position.x, aMode);\n' +
      'transformed.z += (sin(position.x * 5. - uT * 5.2 + ph) * 0.15 + sin(position.x * 2.3 + position.y * 3. - uT * 3.1 + ph * 1.3) * 0.1) * wg * mix(1., 1.5, aMode);\n' +
      'transformed.y += sin(uT * 2.1 + ph + position.x * 3.) * 0.07 * wg * aMode;', 'cloth'), cloths);
    const poleB = new S.Builder(512); poleB.col(P.white, 0.8, 1).surf(SURF.PLAIN);
    for (const c of cloths) if (c.pole) poleB.beam([c.x, c.y - 6.3, c.z], [c.x, c.y + 0.2, c.z], 0.12);
    scene.add(crowd, shades, hats, clothMesh, new THREE.Mesh(poleB.toGeometry(), mats.facade));
    await ctx.yield();

    // ---------- on the water: tugs (or a paddle tender), a white ferry, sampans and lighters ----------
    const WAVE = { x: -165, z: 0, radius: 0, strength: 0, height: 0 };
    const seaAt = (x, z, t) => { const k = (Math.hypot(x - WAVE.x, z - WAVE.z) - WAVE.radius) / 16; return ocean.heightAt(x, z, t) + WAVE.height * Math.exp(-k * k); };
    const set = fx.fxGroup(); scene.add(set.object);
    const smokeSun = { sunDir: [sunDir.x, sunDir.y, sunDir.z], sunColor: look.sunCol, time };
    const vg = vesselGeometry(rng.fork('tug'), P, paddle ? 'paddle' : 'tug'), fg = vesselGeometry(rng.fork('ferry'), P, 'ferry');
    const berths = (paddle ? [[-236, 96, -124, 74], [-240, -92, -58, -64]] : [[-236, 92, -120, 70], [-222, -86, -56, -62], [-330, 128, -384, 100], [-334, -94, -338, -46]]).map(([a, b2, c, d]) => [a, b2 * sw, c, d * sw]);
    const vessels = berths.map(([sx, sz, gx, gz], i) => {
      const mesh = new THREE.Mesh(vg.geo, mats.facades); mesh.rotation.order = 'YXZ'; scene.add(mesh);
      const smoke = set.add(fx.makeSmokeColumn({ rng: rng.fork('tugsmoke' + i), ...smokeSun, position: [sx, 9, sz], height: wet ? 20 : 30, radius: [0.5, 6], size: [2.2, 12], count: 40,
        color: '#6a666e', colorTop: '#b4b1b8', shadowColor: '#3c3842', ambient: '#2a2830', opacity: 0.6, wind: [0.15, 0, 1], bend: look.smokeBend + 0.25 }));
      return { mesh, smoke, sx, sz, gx, gz, ph: rng() * TAU, g: vg, yaw: Math.atan2(-(gz - sz), gx - sx) };
    });
    const ferry = { mesh: new THREE.Mesh(fg.geo, mats.facades), g: fg, ph: rng() * TAU,
      smoke: set.add(fx.makeSmokeColumn({ rng: rng.fork('ferrysmoke'), ...smokeSun, position: [-600, 12, 0], height: 34, radius: [0.8, 8], size: [3, 15], count: 44, color: '#6e6a72', colorTop: '#b9b6bd', shadowColor: '#3c3842', ambient: '#2a2830', opacity: 0.6, wind: [0.15, 0, 1], bend: look.smokeBend + 0.3 })) };
    ferry.mesh.rotation.order = 'YXZ'; scene.add(ferry.mesh);
    await ctx.yield();
    const whistle = set.add(fx.makeSmokeColumn({ rng: rng.fork('whistle'), ...smokeSun, position: [berths[0][0], 8, berths[0][1]], height: 22, radius: [0.4, 6], size: [2, 12], count: 36, rate: 0.16,
      color: '#d6dde6', colorTop: '#f4f6f8', shadowColor: '#8a96a6', ambient: '#4a5464', opacity: 0, wind: [0.15, 0, 1], bend: 0.9, rim: 0.5, scatter: 0.6 }));
    for (const st of stackTops) set.add(fx.makeSmokeColumn({ rng: rng.fork('stack' + st[0]), ...smokeSun, position: st, height: wet ? 55 : 85, radius: [1.5, 17], size: [6, 32], count: 80,
      color: '#8c8891', colorTop: '#cfccd2', shadowColor: '#5c5862', ambient: '#46444c', opacity: 0.5, wind: [0.2, 0, 1], bend: look.smokeBend }));
    set.add(fx.makeSmokeColumn({ rng: xr.fork('cranesteam'), ...smokeSun, position: [223.5, H(225, 112) + 7.9, 112], height: 15, radius: [0.3, 3.4], size: [1.3, 7], count: 26,
      color: '#d6dde6', colorTop: '#f4f6f8', shadowColor: '#8a96a6', ambient: '#4a5464', opacity: 0.55, wind: [0.15, 0, 1], bend: look.smokeBend + 0.5, rim: 0.5, scatter: 0.6 }));     // the steam crane on the east siding
    await ctx.yield();
    const onWater = (x, z) => x < -9 && hillE(x, z) < -12 && !(Math.abs(z) < 46 && x > -440) && !(Math.abs(z) < 104 && x > -410 && x < -120) && !(x > -64 && z > 76 && z < 98);
    const moor = [lookName === 'golden' ? [-20, -52] : [-14, -47], [-12, 30], [-72, 64 * sw], [-12, 60], [-14, 108], [-11, -64], [-13, -160], [-30, 93], [-46, 80.5], [-120, 122], [-190, -150], [-92, -112], [-262, 172], [-300, -196], [-172, 74], [-70, 150]];
    const boats = S.makeBoats({ rng: rng.fork('boats'), mats, types: ['rowboat', 'junk'], variants: 1, positions: moor.map(([x, z]) => [x, 0, z]), headings: moor.map(() => rng() * TAU), clear: onWater, heightAt: seaAt, speed: 1.1 });
    scene.add(boats.object);
    await ctx.yield();

    // ---------- birds ----------
    const fauna = F.makeFauna(scene, { light: F.lightFrom(scene) });
    const white = { body: '#ffffff', belly: '#fbfbfb', wingC: '#f6f6f2', tip: '#e9e9e6', head: '#ffffff', tailC: '#ffffff', trail: '#f0f0ee' };
    const route = (mid, dir) => ({ length: 1, posAtDist: (d, out) => out.set(mid[0], mid[1], mid[2]), tangentAtDist: (d, out) => out.set(dir[0], 0, dir[1]).normalize() });
    const nDove = Math.round(70 * (0.6 + 0.4 * detail));
    // three releases: one bursts up round us as her bow passes over, one goes down the east yard along her flank while the flight closes
    // on her, one wheels out over the slip foot and the west shore as she takes the water
    fauna.add(F.makeFlock({ rng: xr.fork('doveBurst'), species: 'gulls', count: Math.round(84 * (0.6 + 0.4 * detail)), lod: 'low', size: 1.45, speed: 15, spread: [11, 4.5, 24], wander: [5, 1, 4, 0.35], maxSigma: 3, ...white,
      cross: { path: route([252, 32, 8], [0.93, 0.33]), u: 0.255 * E, window: 0.06, lead: 0, height: 9.9, angle: 0, span: 124, rise: 27, bow: 6 } }), { always: true });
    // (flock cure 2) the two releases that fly with us keep 2.0 m of clear air from the flown line, BY PLACE, bird by bird: each course stays where it is
    // laid and the spread is live's; a dove whose own reach comes within 2 m of the line is moved by what it alone lacks (the kit's keepClear with each),
    // the deal is held at three scatters, and each has a small wander of its own written out; each clearing is made in slices, in build steps of its own
    await ctx.yield();
    fauna.add(await F.makeFlockAsync({ rng: rng.fork('dovesE'), species: 'gulls', count: nDove, lod: 'low', size: 1.35, speed: 15, spread: [12, 9, 34], wander: [0.8, 0.5, 0.8, 0.35], maxSigma: 3, keepClear: { path, dist: 2, each: true, from: 0, to: 1, step: 2 }, ...white,
      cross: { path: route([132, 34, 40], [-0.98, 0.1]), u: 0.645, window: 0.17, lead: 0, height: 0, angle: 0, span: 280, rise: 22, bow: 12 } }, ctx.yield), { always: true });
    await ctx.yield();
    fauna.add(await F.makeFlockAsync({ rng: rng.fork('dovesW'), species: 'gulls', count: nDove, lod: 'low', size: 1.35, speed: 13, spread: [16, 10, 40], wander: [0.8, 0.5, 0.8, 0.35], maxSigma: 3, keepClear: { path, dist: 2, each: true, from: 0, to: 1, step: 2 }, ...white,
      cross: { path: route([18, 44, -64], [-0.8, -0.6]), u: 0.85, window: 0.26, lead: 0, height: 0, angle: 0, span: 400, rise: 60, bow: -30 } }, ctx.yield), { always: true });
    await ctx.yield();
    fauna.add(F.makeFlock({ rng: rng.fork('kites'), species: 'eagles', count: 5, size: 2.1, center: [226, 76.5, 96], radius: 80, height: 0, spread: [70, 22, 70], wander: [0, 0, 0, 0.2], soarRadius: 30, soarLift: 6, body: '#2a2018', wingC: '#3a2c20', belly: '#4a3a2a', tip: '#16100c' }));
    fauna.add(F.makeFlock({ rng: rng.fork('gulls'), species: 'gulls', count: Math.round(30 * (0.6 + 0.4 * detail)), size: 1.5, spread: [17, 4.8, 34], wander: [5, 1, 4, 0.35], maxSigma: 3, center: [-170, 27, 62], radius: 120, height: 2 }));
    fauna.add(F.makeFlock({ rng: rng.fork('gulls2'), species: 'gulls', count: 10, size: 1.4, spread: [13.6, 4.8, 34], wander: [5, 1, 4, 0.35], maxSigma: 3, center: [-36, 27.5, -44], radius: 34, height: 2 }));
    await ctx.yield();

    // ---------- air: petals on the breeze, haze on the harbour, six fair-weather puffs over the western ridge ----------
    const petalKind = seasonName === 'november' ? 'leaves' : 'petals';
    const petals = set.add(fx.makeParticles({ rng: rng.fork('petals'), preset: petalKind, time, count: Math.round(3800 * season.petalN * detail), box: [70, 36, 70], colors: season.petals,
      velocity: [0.3, -0.55, 3], size: [0.15, 0.37], lightDir: [sunDir.x, sunDir.y, sunDir.z] }));
    set.add(fx.makeParticles({ rng: rng.fork('motes'), preset: 'dust', time, follow: false, center: [128, 12.5, 0], box: [252, 11, 12.5], count: Math.round(2600 * detail),
      velocity: [0.12, 0.03, 0.55], size: [0.05, 0.15], colors: [look.sunCol, '#ffffff', season.petals[0]], opacity: wet ? 0.5 : 0.85 }));
    // and thicker over the head of the slip, where her bow comes out into the open: a standing drift of them between the gantry rows
    set.add(fx.makeParticles({ rng: xr.fork('petalsHead'), preset: petalKind, time, follow: false, center: [238, 30, 0], box: [96, 44, 76], count: Math.round(1300 * season.petalN * detail), colors: season.petals,
      velocity: [0.3, -0.55, 3], size: [0.15, 0.37], lightDir: [sunDir.x, sunDir.y, sunDir.z] }));
    const storm = rare ? set.add(fx.makeParticles({ rng: rng.fork('storm'), preset: 'petals', time, count: Math.round(7000 * detail), box: [66, 40, 66], colors: ['#ffd9e4', '#F2B8C9', '#ffffff'],
      velocity: [1.2, -1.3, 9], size: [0.13, 0.32], minAngle: 0.0036, lightDir: [sunDir.x, sunDir.y, sunDir.z] })) : null;
    if (storm) storm.setOpacity(0);
    await ctx.yield();
    if (wet) set.add(fx.makeParticles({ rng: rng.fork('rain'), preset: 'rain', time, count: Math.round(3400 * detail), opacity: 0.3, colors: ['#dfe7ee', '#c4d0da', '#ffffff'] }));
    set.add(fx.makeMist({ rng: rng.fork('mist'), time, count: 54, center: [-300, 3.5, 0], area: [420, 7, 820], size: [36, 84], color: '#' + new THREE.Color(look.fog).lerp(new THREE.Color('#ffffff'), 0.5).getHexString(), opacity: look.mist * 0.8, drift: [0.1, 0, 0.9] }));
    if (lookName === 'dawn') set.add(fx.makeMist({ rng: rng.fork('mist2'), time, count: 40, center: [150, 16, 0], area: [330, 10, 420], size: [20, 44], color: look.fog, opacity: 0.1, drift: [0, 0, 0.7], heightAt: H, lift: 2.5 }));
    if (!wet) {
      const cl = rng.fork('clouds'), n = lookName === 'dawn' ? 5 : 6, list = [];
      for (let i = 0; i < n; i++) list.push({ position: [lerp(-420, 640, (i + cl.range(0.1, 0.9)) / n), cl.range(330, 430), cl.range(-1150, -820)], scale: cl.range(1.6, 2.6) });
      // and a second fleet standing over the harbour mouth, in the long view down the straight
      for (let i = 0; i < n; i++) list.push({ position: [cl.range(-1500, -700), cl.range(240, 320), lerp(-500, 500, (i + cl.range(0.15, 0.85)) / n)], scale: cl.range(1.5, 2.2) });
      set.add(fx.makeCloudPuffs({ rng: cl, time, sunDir: [sunDir.x, sunDir.y, sunDir.z], clouds: list, size: [34, 70], drift: [0.4, 0, -1.4], veil: 0,
        color: lookName === 'golden' ? '#ffd9b4' : lookName === 'dawn' ? '#f6dcd6' : '#f6f3ee', shadowColor: lookName === 'golden' ? '#8a7aa6' : '#8fa0c0', rim: 0.4 }));
    }
    await ctx.yield();
    // the sun shower's rainbow: a band 42 degrees round the antisolar point, so it stands over the north-west hills with one foot behind
    // the launch stand; carried with whichever camera draws the world, 150 m out in the open (in front of the hills, behind what is near)
    let bow = null;
    if (wet) {
      const ax = sky.sunDirection.clone().multiplyScalar(-1).normalize(), ex = new THREE.Vector3(0, 1, 0).cross(ax).normalize(), ey = ax.clone().cross(ex).normalize();
      const N = 96, R = 150, pos = [], uvs = [], idx = [];
      for (let i = 0; i <= N; i++) {
        const phi = lerp(-1.8, 1.8, i / N);
        for (let j = 0; j < 2; j++) {
          const ang = (j ? 44.4 : 39.0) * PI / 180, sn = Math.sin(ang);
          _p.copy(ax).multiplyScalar(Math.cos(ang)).addScaledVector(ey, sn * Math.cos(phi)).addScaledVector(ex, sn * Math.sin(phi));
          pos.push(_p.x * R, _p.y * R, _p.z * R); uvs.push(i / N, j);
        }
        if (i < N) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 2, a + 1, a + 3); }
      }
      const bg = new THREE.BufferGeometry();
      bg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); bg.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2)); bg.setIndex(idx);
      bow = new THREE.Mesh(bg, new THREE.ShaderMaterial({
        transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false,
        uniforms: { uCol: { value: new THREE.Color(look.sunCol).lerp(new THREE.Color('#ffffff'), 0.6).multiplyScalar(0.38) } },
        vertexShader: 'varying vec2 vUv; varying float vEl; void main() { vUv = uv; vEl = position.y / ' + R.toFixed(1) + '; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }',
        fragmentShader: `varying vec2 vUv; varying float vEl; uniform vec3 uCol;
          void main() {
            float t = vUv.y;                                            // 0 on the inside of the bow (violet), 1 outside (red)
            vec3 c = vec3(smoothstep(0.42, 0.74, t) * (1. - smoothstep(0.84, 1., t)), smoothstep(0.24, 0.5, t) * (1. - smoothstep(0.56, 0.82, t)), smoothstep(0.08, 0.26, t) * (1. - smoothstep(0.34, 0.58, t)));
            c += vec3(0.3, 0.08, 0.36) * smoothstep(0., 0.1, t) * (1. - smoothstep(0.12, 0.26, t));
            c += vec3(0.07, 0.07, 0.08) * (1. - smoothstep(0., 0.42, t));   // the sky is a shade brighter inside the bow
            float a = smoothstep(-0.02, 0.05, vEl) * (1. - 0.4 * smoothstep(0.15, 0.45, vEl)) * (0.75 + 0.25 * sin(vUv.x * 11. + 0.7));   // strongest in the feet, thinner over the top
            gl_FragColor = vec4(c * uCol * a, 1.);
          }`,
      }));
      bow.frustumCulled = false; bow.renderOrder = -0.5; scene.add(bow);
    }
    await ctx.yield();

    // ---------- every frame ----------
    const gaze = new THREE.Vector3(), gaze2 = new THREE.Vector3(), gP = new THREE.Vector3(), gT = new THREE.Vector3(), gH = new THREE.Vector3(), jibPh = rng() * TAU;
    // The hull is behind us as we come out over the east yard, and the loop is a right-hand one: the gaze is led round by the right,
    // inside the turn and a little below the horizon, never more than 54 degrees off the heading, so the yard, the harbour and then
    // her bow come into the frame from the right. From u 0.58 the route itself flies straight at her flank; the point of interest then
    // only trims the framing, sliding forward along her to the bow as she runs past, and lets go as we come in behind her.
    const heroGaze = (t, u) => {
      path.pointAt(u, gP); path.tangentAt(u, gT); hero.pointOnHull(u, lerp(145, 208, sstep(0.57, 0.7, u)), 22, 0, gH);
      const hp = Math.atan2(gT.z, gT.x); let off = Math.atan2(gH.z - gP.z, gH.x - gP.x) - hp;
      while (off > PI) off -= TAU; while (off < -PI) off += TAU;
      off = Math.max(-0.95, Math.min(0.95, off));
      const k = sstep(0.365, 0.46, u) * (1 - sstep(0.75, 0.81, u));
      const pitchH = Math.max(-0.3, Math.atan2(gH.y - gP.y, Math.hypot(gH.x - gP.x, gH.z - gP.z))), pitchP = Math.asin(Math.max(-1, Math.min(1, gT.y)));
      const a = hp + off * k, pit = lerp(lerp(pitchP, -0.04, sstep(0.365, 0.44, u)), pitchH, k * sstep(0.5, 0.6, u)), c = Math.cos(pit) * 220;
      return gaze.set(gP.x + Math.cos(a) * c, gP.y + Math.sin(pit) * 220, gP.z + Math.sin(a) * c);
    };
    // under her, once the shores have gone down: a glance out of the nave to the sunny side, at the yard, the crowd and the blossom
    const sideGlance = (t, u) => { path.pointAt(u, gP); path.tangentAt(u, gT); return gaze2.set(gP.x + gT.x * 34, gP.y + 3, gP.z + sw * 40); };
    // and before that, as the wedges drop and she starts to move: up at the riveted bottom plating streaming overhead
    const gaze3 = new THREE.Vector3(), upGlance = (t, u) => { path.pointAt(u, gP); path.tangentAt(u, gT); return gaze3.set(gP.x + gT.x * 30, gP.y + 11, gP.z + gT.z * 30); };
    const sail = (v, x, z, yaw, t) => {
      const y = seaAt(x, z, t), hl = v.g.L * 0.4, cy = Math.cos(yaw), sy = Math.sin(yaw);
      const pitch = Math.atan2(seaAt(x + cy * hl, z - sy * hl, t) - seaAt(x - cy * hl, z + sy * hl, t), hl * 2);
      v.mesh.position.set(x, y + 0.2, z); v.mesh.rotation.set(0.035 * Math.sin(t * 0.9 + v.ph), yaw, pitch + 0.012 * Math.sin(t * 0.6 + v.ph));
      const f = v.g.funnel; v.smoke.uniforms.uBase.value.set(x + f[0] * cy, y + f[1], z - f[0] * sy);
    };
    const update = (dt, t, camera, u) => {
      time.value = t; uT.value = t;
      hero.setProgress(u); hero.waveAt(u, WAVE); hero.update(dt, t, camera);
      if (bow) { bow.position.setFromMatrixPosition(camera.matrixWorld); bow.scale.setScalar(lerp(2.9, 1, sstep(0.27, 0.32, u))); }     // beyond the head of the slip while we are under her, then in front of the hills
      sky.update(dt, t, camera); ridges.update(dt, t, camera); ocean.update(dt, t, camera); land.update(dt, t);
      mats.update(dt, t); loco.update(dt, t, camera); trees.update(dt, t, camera);
      jib.rotation.y = -PI / 2 + 0.75 * Math.sin(t * 0.07 + jibPh);
      const k = sstep(0.74, 0.96, u);
      for (let i = 0; i < vessels.length; i++) {
        const v = vessels[i];
        sail(v, lerp(v.sx, v.gx, k) + 3 * Math.sin(t * 0.13 + v.ph), lerp(v.sz, v.gz, k) + 2.2 * Math.cos(t * 0.11 + v.ph), v.yaw + 0.12 * Math.sin(t * 0.09 + v.ph), t);
      }
      const fa = ferry.ph + t * 0.0165; sail(ferry, -640 + 250 * Math.cos(fa), -30 + 250 * Math.sin(fa), Math.atan2(-Math.cos(fa), -Math.sin(fa)), t);
      whistle.uniforms.uBase.value.copy(vessels[0].smoke.uniforms.uBase.value); whistle.uniforms.uBase.value.y -= 1.5;
      if (whistle.uniforms.uOpacity) whistle.uniforms.uOpacity.value = 0.85 * Math.max(sstep(0.1 * E, 0.14 * E, u) * (1 - sstep(0.3, 0.4, u)), sstep(0.7, 0.76, u) * (1 - sstep(0.88, 0.95, u)));
      uCheer.value = sstep(0.085 * E, 0.16 * E, u) * (1 - 0.4 * sstep(0.8, 1, u));
      if (storm) storm.setOpacity(sstep(0.16, 0.3, u) * (1 - 0.45 * sstep(0.86, 1, u)));
      boats.update(dt, t, camera); fauna.update(dt, t, camera, u); set.update(dt, t, camera);
    };
    // Shadow depth materials of this world's own, one per kind of caster: the renderer's shared one picks its program again
    // whenever the kind of caster changes between two shadow draws, which can compile a shader in view.
    const depthMats = new Map();
    scene.traverse((o) => {
      if (!o.isMesh || !o.castShadow || o.customDepthMaterial) return;
      const m = Array.isArray(o.material) ? o.material[0] : o.material;
      const kind = (o.isInstancedMesh ? (o.instanceColor ? 'ic' : 'i') : 'm') + (m.shadowSide ?? m.side);
      let d = depthMats.get(kind);
      if (!d) depthMats.set(kind, d = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking }));
      o.customDepthMaterial = d;
    });
    await sky.prewarm(ctx.renderer, null, scene);

    return {
      scene, path, duration: DUR,
      pace: (u) => (1.12 - 0.62 * sstep(0.56, 0.65, u) * (1 - sstep(0.8, 0.88, u))) * (1 - 0.2 * sstep(0.86, 0.93, u)),   // brisk under her and round the loop, slow while she runs past and takes the water, unhurried to the ring
      camera: { fov: 62, near: 0.3, far: 5200, lookAhead: 24, sway: 0.8, bank: 0.45 },
      pois: [
        { at: upGlance, from: 0.115, to: 0.195, weight: 0.55, fade: 0.04 },                               // the hull as our ceiling
        { at: sideGlance, from: 0.185, to: 0.3, weight: 0.75, fade: 0.05 },                                 // out of the nave to the sunny side as the shores go down
        { at: [300, 58, 4], from: 0.29, to: 0.375, weight: 0.6, fade: 0.04 },                            // up over the head of the slip, into the tapes, the paper ball and the doves, as the bow passes over
        { at: heroGaze, from: 0.36, to: 0.81, weight: 0.9, fade: 0.03 },                                  // round by the right to the whole hull, then along her as she runs
      ],
      portal: { shape: 'circle', radius: 7, color: look.portal, glow: 1.5, revealDistance: 400, blendDistance: 40 },
      post: {
        exposure: look.exposure, bloom: { strength: look.bloom, radius: 0.6, threshold: 0.92 },
        grade: { saturation: look.saturation, contrast: look.contrast ?? 1.08, tint: look.tint, shadowTint: look.shadowTint, vignette: 0.3, grain: 0.022, aberration: 0 },
      },
      ride: 'none',
      update,
      dispose() { hero.dispose(); sky.dispose(); for (const d of depthMats.values()) d.dispose(); },
    };
  },
};
