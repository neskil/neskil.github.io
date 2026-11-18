// River of Lanterns: blue hour in an old river town on festival night. The flight follows the river under two
// humpback bridges, climbs through cherry branches as the lantern release begins, swings round the bend past the
// Lantern Pagoda (hero set piece, src/parts/lantern-river.js) and descends the last straight to the Moon Bridge,
// whose round opening holds the exit portal.
//
// Everything is laid out in river coordinates (s = metres along the centreline, d = metres to the right of it).
// Water, the pagoda's mirror image and every glow / paper lantern come from the hero module so the whole river
// shares one look; the town is built with the structures kit Builder and mirrored with its makeReflection.
import * as THREE from 'three';
import { makePath, clamp, lerp, smoothstep } from '../kit/core.js';
import { makeSky, makeLightRig } from '../kit/sky.js';
import * as S from '../kit/structures.js';
import * as flora from '../kit/flora.js';
import * as F from '../kit/fauna.js';
import * as fx from '../kit/fx.js';
import * as T from '../kit/terrain.js';
import { buildHero } from '../parts/lantern-river.js';

const PALETTE = ['#0b1640', '#2b4a9a', '#6a5f9a', '#1c1a2a', '#3a2a2a', '#ffb35a', '#ff4d3d'];
const QUAY = 2.4, S0 = -96, S1 = 904, STEP = 8, SURF = S.SURF;
const lin = (hex) => { const c = new THREE.Color(hex); return [c.r, c.g, c.b]; };
const mul = (c, k) => [c[0] * k, c[1] * k, c[2] * k];
const mix3 = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];

// ---------------------------------------------------------------- the river: 330 m straight, a bend to the right, 230 m straight
function makeRiver(o) {
  const L1 = 330, LA = 200, bend = o.bend, Rr = LA / bend, cb = Math.cos(bend), sb = Math.sin(bend);
  const E = [Rr * (1 - cb), -L1 - Rr * sb];
  // centreline frame at s: [x, z, headingX, headingZ]; right of the heading is (-hz, hx)
  const frame = (s) => {
    if (s <= L1) return [0, -s, 0, -1];
    if (s >= L1 + LA) { const t = s - L1 - LA; return [E[0] + sb * t, E[1] - cb * t, sb, -cb]; }
    const a = (s - L1) / Rr; return [Rr * (1 - Math.cos(a)), -L1 - Rr * Math.sin(a), Math.sin(a), -Math.cos(a)];
  };
  const at = (s, d) => { const f = frame(s); return [f[0] - f[3] * d, f[1] + f[2] * d]; };
  const hwR = () => 20;
  const hwL = (s) => 20 + o.bulge * Math.exp(-(((s - o.sIsland) / o.sigma) ** 2));
  const hw = (s, side) => (side > 0 ? hwR(s) : hwL(s));
  // world point at `off` metres inland of a bank (side +1 right, -1 left), its inward normal and yaw facing the water
  const bank = (s, side, off = 0) => {
    const p = at(s, side * (hw(s, side) + off)), q = at(s + 1, side * (hw(s + 1, side) + off));
    let tx = q[0] - p[0], tz = q[1] - p[1]; const tl = Math.hypot(tx, tz) || 1; tx /= tl; tz /= tl;
    const nx = side * tz, nz = -side * tx;
    return { x: p[0], z: p[1], tx, tz, nx, nz, tl, yaw: Math.atan2(nx, nz) };
  };
  // inverse: nearest centreline s and signed lateral d
  const locate = (x, z) => {
    let best = Infinity, bs = 0;
    const tryS = (s) => { const f = frame(s), dd = (x - f[0]) ** 2 + (z - f[1]) ** 2; if (dd < best) { best = dd; bs = s; } };
    tryS(clamp(-z, S0 - 200, L1));
    tryS(L1 + clamp(Math.atan2(-(z + L1), Rr - x), 0, bend) * Rr);
    tryS(L1 + LA + clamp((x - E[0]) * sb - (z - E[1]) * cb, 0, 600));
    const f = frame(bs);
    return { s: bs, d: (x - f[0]) * -f[3] + (z - f[1]) * f[2] };
  };
  return { frame, at, hw, hwL, hwR, bank, locate, bend, L1, LA };
}

// ground height `o` metres inland of the bank edge: quay, two terraces, then hills
function makeGround(noise, hillK) {
  return (s, o, side) => {
    if (o < 23) return QUAY;
    let y = QUAY + 2.2 * smoothstep(23, 27, o) + 3.3 * smoothstep(43, 49, o);
    if (o > 62) {
      const k = smoothstep(62, 250, o), n = noise.fbm2(s * 0.0042 + side * 7.3, o * 0.006 + 3.1, 3);
      y += k * (26 + hillK * (0.55 + 0.6 * n)) + smoothstep(62, 120, o) * 5 * noise.n2(s * 0.02, o * 0.03 + side);
    }
    return y;
  };
}

// ---------------------------------------------------------------- timber townhouse / tea house, front on +Z
function houseInto(b, rng, o) {
  const { w, d, floors, P, rich } = o, fh = rng.range(2.9, 3.3), seed = rng(), wallC = rng.pick(P.walls), lit = o.lit ?? 1;
  b.col(P.stone, 0.7, 1).surf(SURF.MASONRY, 0, 1);
  b.box(-w / 2 - 0.12, -1.8, -d / 2 - 0.12, w / 2 + 0.12, 0.45, d / 2 + 0.12, { m: 1 });
  let y = 0.45, wi = w, di = d;
  for (let i = 0; i < floors; i++) {
    const cw = wi / Math.max(2, Math.round(wi / rng.range(1.5, 2.0)));
    b.col(wallC, 0.82, 1).surf(SURF.SHOJI, (seed + i * 0.23) % 1, lit * (i === 0 ? 1.5 : 1.15));
    b.wall(-wi / 2, di / 2, wi / 2, di / 2, y, y + fh, { cellW: cw, cellH: fh });
    b.surf(SURF.SHOJI, (seed + 0.4 + i * 0.31) % 1, lit * 0.8);
    b.wall(wi / 2, -di / 2, -wi / 2, -di / 2, y, y + fh, { cellW: cw * 1.3, cellH: fh });
    b.wall(wi / 2, di / 2, wi / 2, -di / 2, y, y + fh, { cellW: cw * 1.6, cellH: fh });
    b.wall(-wi / 2, -di / 2, -wi / 2, di / 2, y, y + fh, { cellW: cw * 1.6, cellH: fh });
    if (rich) {
      b.col(P.wood, 0.85, 1).surf(SURF.PLAIN);
      for (const sx of [-1, 1]) b.cbox(sx * wi / 2, y, di / 2, 0.3, fh, 0.3, { top: false });
    }
    y += fh;
    if (i < floors - 1 && !o.plain) {
      b.col(P.roof, 1, 1).surf(SURF.PLAIN);
      b.sweepRoof(0, 0, wi, di, y - 0.25, 0.75, { overhang: rich ? 1.15 : 0.8, lift: 0.22, top: 0.86, nu: 2, nv: 1, edgeColor: P.trim, underColor: mul(wallC, 0.7) });
      wi -= rng.range(0.5, 1.1); di -= rng.range(0.4, 1.0);
    }
  }
  const rise = rng.range(1.9, 2.9);
  b.col(P.roof, 1, 1).surf(SURF.PLAIN);
  b.sweepRoof(0, 0, wi, di, y - 0.1, rise, { overhang: rich ? 1.4 : 1.0, lift: 0.55, top: rng.range(0.1, 0.3), nu: rich ? 3 : 2, nv: rich ? 2 : 1, edgeColor: P.trim, underColor: mul(wallC, 0.7) });
  return { h: y + rise, eaveY: 0.45 + fh - 0.35, w, d };
}

// stone lantern (toro) with a glowing fire box
function toroInto(b, x, y, z, P, s = 1) {
  b.col(P.stone, 0.75, 1).surf(SURF.MASONRY, 0, 2);
  b.frustum(x, z, 0.7 * s, 0.7 * s, 0.34 * s, 0.34 * s, y, y + 1.15 * s, { m: 1 });
  b.col(P.lamp, 1, 1).surf(SURF.GLOW, 0, 2.4); b.cbox(x, y + 1.15 * s, z, 0.5 * s, 0.42 * s, 0.5 * s);
  b.col(P.stone, 0.9, 1).surf(SURF.PLAIN); b.frustum(x, z, 1.0 * s, 1.0 * s, 0.16 * s, 0.16 * s, y + 1.57 * s, y + 1.95 * s, {});
}

// plain shrine gate for the hillside climbs (seen from afar), opening along local Z
function toriiInto(b, w, h, P) {
  b.flood(1.3, 0, h * 1.5).col(P.rail, 0.7, 1).surf(SURF.PLAIN);
  for (const sx of [-1, 1]) b.cbox(sx * w / 2, -0.6, 0, 0.36, h + 0.6, 0.36, { top: false });
  b.beam([-w / 2 - 0.35, h * 0.8, 0], [w / 2 + 0.35, h * 0.8, 0], 0.22, 0.3);
  b.col(P.wood, 1, 1); b.beam([-w / 2 - 0.9, h + 0.15, 0], [w / 2 + 0.9, h + 0.15, 0], 0.44, 0.38);
  b.flood(0);
}

// a little figure holding a light (never seen close)
function figureInto(b, rng, x, y, z, P) {
  const h = rng.range(1.5, 1.8), c = mul(rng.pick(P.robes), rng.range(0.7, 1.1));
  b.col(c, 0.7, 1).surf(SURF.PLAIN); b.frustum(x, z, 0.52, 0.4, 0.34, 0.26, y, y + h * 0.82, {});
  b.col([0.3, 0.22, 0.17], 1, 1); b.cbox(x, y + h * 0.82, z, 0.22, 0.24, 0.22);
  if (rng.chance(0.6)) { b.col(P.lamp, 1, 1).surf(SURF.GLOW, 0, 2.2); b.cbox(x + 0.3, y + h * 0.5, z + 0.1, 0.2, 0.26, 0.2); return [x + 0.3, y + h * 0.55, z + 0.1]; }
  return null;
}

// Humpback stone bridge across local X (deck over z = -W/2..W/2). o.ring: a moon bridge whose opening is a full circle.
// Returns deck(x) and the lamp positions (local).
function bridgeInto(b, o) {
  const { half, W, base, P } = o, hw = W / 2, ring = o.ring, R = ring ? ring.r : o.a, cy = ring ? ring.y : 0;
  const crown = ring ? cy + R + 1.9 : o.clear + 1.25;
  const hole = (x) => (Math.abs(x) < R ? (ring ? Math.sqrt(R * R - x * x) : o.clear * Math.sqrt(1 - (x / R) ** 2)) : -1);
  const deck = (x) => {
    const h = hole(x), hump = base + (crown - base) * Math.pow(Math.cos(Math.PI * clamp(x / half, -1, 1) / 2), ring ? 2.4 : 2);
    return h < 0 ? hump : Math.max(hump, (ring ? cy + h : h) + (ring ? 0.45 : 0.8));
  };
  const xs = [], nOut = ring ? 7 : 4, nIn = ring ? 20 : 16;
  for (let i = 0; i < nOut; i++) xs.push(-half + (half - R) * i / nOut);
  for (let i = 0; i <= nIn; i++) xs.push(-R * Math.cos(Math.PI * i / nIn));
  for (let i = 1; i <= nOut; i++) xs.push(R + (half - R) * i / nOut);
  const spans = (x, inside) => {                                    // solid intervals of the cross-section at x
    if (!inside) return [[-0.7, deck(x)]];
    const h = Math.max(hole(x), 0);
    return ring ? [[-0.7, cy - h], [cy + h, deck(x)]] : [[h, deck(x)]];
  };
  b.flood(o.flood ?? 0.26, 0, 10);
  for (let i = 0; i < xs.length - 1; i++) {
    const xa = xs[i], xb = xs[i + 1], inside = Math.abs((xa + xb) / 2) < R, A = spans(xa, inside), B = spans(xb, inside);
    for (let k = 0; k < A.length; k++) {
      const [la, ha] = A[k], [lb, hb] = B[k], last = k === A.length - 1;
      b.col(P.stone, 0.62, 1).surf(SURF.MASONRY, 0, 1.2);
      if (ha - la > 0.02 || hb - lb > 0.02) {
        b.quad([xa, la, hw], [xb, lb, hw], [xb, hb, hw], [xa, ha, hw], [xa, la, xb, ha]);
        b.quad([xb, lb, -hw], [xa, la, -hw], [xa, ha, -hw], [xb, hb, -hw], [xa, la, xb, ha]);
      }
      if (la > -0.6 || lb > -0.6) { b.col(mul(P.stone, 0.55), 1, 1); b.quad([xa, la, -hw], [xb, lb, -hw], [xb, lb, hw], [xa, la, hw], [xa, 0, xb, W]); }
      b.col(last ? P.road : mul(P.stone, 0.8), 1, 1).surf(SURF.MASONRY, 0, last ? 0.7 : 1.2);
      b.quad([xa, ha, hw], [xb, hb, hw], [xb, hb, -hw], [xa, ha, -hw], [xa, 0, xb, W]);
    }
    const ta = deck(xa), tb = deck(xb);
    b.col(P.rail, 0.8, 1).surf(SURF.LACQUER);
    for (const sg of [-1, 1]) { b.beam([xa, ta + 0.95, sg * (hw - 0.14)], [xb, tb + 0.95, sg * (hw - 0.14)], 0.2, 0.2); b.beam([xa, ta + 0.5, sg * (hw - 0.14)], [xb, tb + 0.5, sg * (hw - 0.14)], 0.1, 0.5); }
  }
  for (const sg of [-1, 1]) for (const x of [-half, half]) { b.col(P.stone, 0.62, 1).surf(SURF.MASONRY, 0, 1.2); b.wall(x, sg > 0 ? -hw : hw, x, sg > 0 ? hw : -hw, -0.7, base, { m: 1 }); }
  const lamps = [], nL = o.lamps ?? 7;
  for (let i = 0; i < nL; i++) {
    const x = (i / (nL - 1) * 2 - 1) * half * 0.86, y = deck(x);
    for (const sg of [-1, 1]) {
      const z = sg * (hw - 0.14);
      b.col(P.rail, 0.8, 1).surf(SURF.LACQUER); b.cbox(x, y, z, 0.26, 2.0, 0.26);
      b.col(P.lamp, 1, 1).surf(SURF.GLOW, 0, 2.6); b.cbox(x, y + 2.0, z, 0.42, 0.5, 0.42);
      lamps.push([x, y + 2.25, z]);
    }
  }
  if (ring) {                                                        // trim ring and a circle of lanterns round the opening, on both faces
    const n = 36;
    for (const sg of [-1, 1]) for (let i = 0; i < n; i++) {
      const a0 = i / n * Math.PI * 2, a1 = (i + 1) / n * Math.PI * 2, r0 = R - 0.05, r1 = R + 0.95, z = sg * (hw + 0.12);
      const p = (r, a) => [Math.sin(a) * r, cy + Math.cos(a) * r, z];
      if (cy + Math.cos((a0 + a1) / 2) * r0 < 0) continue;
      b.col(P.trim, 0.9, 1).surf(SURF.PLAIN);
      if (sg > 0) b.quad(p(r0, a1), p(r0, a0), p(r1, a0), p(r1, a1)); else b.quad(p(r0, a0), p(r0, a1), p(r1, a1), p(r1, a0));
      if (i % 2 === 0 && cy + Math.cos(a0) * (R + 1.5) > 0.6) {
        const q = [Math.sin(a0) * (R + 1.55), cy + Math.cos(a0) * (R + 1.55), sg * (hw + 0.35)];
        b.col(P.lamp, 1, 1).surf(SURF.GLOW, 0, 2.6); b.cbox(q[0], q[1] - 0.25, q[2], 0.4, 0.5, 0.4);
        if (sg > 0) lamps.push(q);
      }
    }
  }
  b.flood(0);
  return { deck, lamps };
}

// roofed lantern boat with a poler in the stern, bow toward +X, waterline at y = 0
function boatGeometry(rng, P) {
  const b = S.makeBuilder(1024), L = 9.4, B = 2.4;
  const half = (u) => B / 2 * Math.pow(Math.max(1 - Math.pow(Math.abs(u * 2 - 1), 2.4), 0), 0.55);
  const sheer = (u) => 0.5 + 0.55 * Math.pow(Math.abs(u * 2 - 1), 2.2);
  b.col(P.hull, 0.6, 1).surf(SURF.PLANKS, 0, 1);
  for (const sg of [-1, 1]) b.grid(10, 2, (u, v) => [(u - 0.5) * L, lerp(-0.3, sheer(u), v), sg * half(u) * (0.5 + 0.5 * Math.sqrt(v))], { flip: sg < 0 });
  b.col(P.deck, 1, 1); b.grid(10, 1, (u, v) => [(u - 0.5) * L, 0.34 + 0.2 * Math.pow(Math.abs(u * 2 - 1), 2.2), (v * 2 - 1) * half(u) * 0.93], { flip: true });
  b.col(P.cabin, 0.85, 1).surf(SURF.SHOJI, rng(), 1.7); b.box(-1.5, 0.36, -0.82, 1.9, 2.05, 0.82, { cellW: 0.85, cellH: 1.7, top: false });
  b.col(P.roof, 1, 1).surf(SURF.PLAIN); b.sweepRoof(0.2, 0, 3.4, 1.64, 2.0, 0.55, { overhang: 0.42, lift: 0.2, top: 0.5, nu: 3, nv: 1, edgeColor: P.trim });
  const lamps = [[L / 2 - 0.5, 2.1, 0], [-L / 2 + 0.6, 2.0, 0.5]];
  for (const q of lamps) {
    b.col(P.wood, 1, 1).surf(SURF.PLAIN); b.beam([q[0], 0.4, q[2]], [q[0], q[1], q[2]], 0.06, 0.06);
    b.col(P.lamp, 1, 1).surf(SURF.GLOW, 0, 2.8); b.cbox(q[0], q[1] - 0.2, q[2], 0.4, 0.52, 0.4, { bottom: true });
  }
  // the poler: robe, head, straw hat and a long pole trailing in the water
  b.col(P.robe, 0.7, 1).surf(SURF.PLAIN); b.frustum(-3.4, -0.25, 0.55, 0.45, 0.36, 0.3, 0.45, 1.75, {});
  b.col([0.32, 0.24, 0.18], 1, 1); b.cbox(-3.4, 1.75, -0.25, 0.24, 0.26, 0.24);
  b.col(P.hat, 0.8, 1); b.frustum(-3.4, -0.25, 0.95, 0.95, 0.06, 0.06, 1.98, 2.24, {});
  b.col(P.wood, 1, 1); b.beam([-2.9, 2.6, -0.5], [-5.9, -0.9, -1.25], 0.06, 0.06);
  return { geometry: b.toGeometry(), L, B, lamps };
}

export default {
  id: 'lantern-river', name: 'River of Lanterns', category: 'city', weirdness: 0.1,
  async build(ctx) {
    const { rng, noise } = ctx;
    const scene = new THREE.Scene();

    // ------------------------------------------------------------ what this visit is like
    const rv = rng.fork('vary');
    const mood = rv.pick(['cobalt', 'cobalt', 'violet', 'deep']);
    const misty = rv.chance(0.45);
    const bendDeg = rv.range(36, 44), bend = bendDeg * Math.PI / 180;
    const R = makeRiver({ bend, bulge: rv.range(80, 96), sigma: rv.range(76, 88), sIsland: 430 });
    const sB1 = 110 + rv.range(-8, 8), sB2 = 270 + rv.range(-7, 5), sMoon = 760;
    const ground = makeGround(noise, rv.range(34, 60));
    const nBoats = rv.int(7, 11), stringStyle = rv.pick(['amber', 'mixed', 'festival']), petalK = rv.range(0.7, 1.3);
    const amber = lin(PALETTE[5]), red = lin(PALETTE[6]), lanL = mix3(red, amber, 0.28);

    // ------------------------------------------------------------ sky, light, fog
    const SK = {
      cobalt: { zenith: '#040a26', mid: '#0f2668', horizon: '#2f4f9c', scatterColor: '#f08a52', stars: 0.55, milkyWay: 0 },
      violet: { zenith: '#07092a', mid: '#1c226e', horizon: '#4a4a98', scatterColor: '#ff8658', stars: 0.45, milkyWay: 0 },
      deep: { zenith: '#030716', mid: '#0a184c', horizon: '#223a82', scatterColor: '#e0603a', stars: 0.95, milkyWay: 0.35 },
    }[mood];
    const waterCol = new THREE.Color('#15235c').lerp(new THREE.Color('#0a1338'), 0.3).multiplyScalar(0.85);   // what the kit's mirror shader fades to
    const sunAz = bendDeg * 0.5 + rv.range(-8, 8), moonAz = bendDeg + rv.range(17, 30), moonEl = rv.range(11, 19);
    const sky = makeSky({
      rng: rng.fork('sky'), preset: 'blueHour', ...SK, scatter: rv.range(0.38, 0.56), scatterPow: rv.range(13, 18), scatterHigh: 0, sunAzimuth: sunAz, sunElevation: -5,
      bodies: [{ elevation: moonEl, azimuth: moonAz, size: rv.range(2.3, 3.2), phase: 1, color: '#fff3dc', texture: 0.5, intensity: 1.1, glow: 0.25, glowColor: '#9fb4ff', glowSize: 4 }],
      key: 0, lightElevationMin: 22, ground: [waterCol.r, waterCol.g, waterCol.b], renderOrder: 1000,   // dome after the opaque town: far less sky to shade
      quality: 0.5, clouds: false, clouds2: rv.chance(0.4) ? { coverage: rv.range(0.25, 0.4), stretch: 1, opacity: 0.5, lit: '#4a5c9a', shade: '#18224a' } : false,   // the sky is the dearest thing on screen: keep it lean
    });
    scene.add(sky.object);
    const rig = makeLightRig(sky, { intensity: 1, ambient: 1, bounce: 0.35 });
    scene.add(rig.object);
    const fogCol = sky.horizonColor.clone().lerp(sky.zenithColor, 0.35).multiplyScalar(0.7);
    scene.fog = new THREE.FogExp2(fogCol, misty ? 0.0013 : 0.0008);
    const moonDir = (sky.bodyDirections && sky.bodyDirections[0] ? sky.bodyDirections[0] : sky.lightDirection).clone().normalize();

    // ------------------------------------------------------------ hero: pagoda island on the outside of the bend, plus the water
    const hero = await buildHero(ctx, { palette: PALETTE, water: true, waterRadius: 1500, release: true, fireworks: 'auto', progress: 0 });
    const isl = R.at(430, -50);
    hero.object.position.set(isl[0], 0, isl[1]); hero.object.rotation.y = Math.PI / 2 - bend / 2;
    hero.object.updateMatrixWorld(true);
    scene.add(hero.object);
    const HL = (v) => hero.object.localToWorld(v.clone());
    await ctx.yield();

    // ------------------------------------------------------------ the flight
    const P = (s, y, d = 0) => { const p = R.at(s, d); return [p[0], y, p[1]]; };
    const pts = [P(0, 3), P(46, 3.1, 1.5), P(sB1, 4.0), P((sB1 + sB2) / 2, 4.7, -2), P(sB2, 4.2), P(sB2 + 34, 9.0)];
    const yFly = [15, 20, 22, 21, 18.5];
    hero.anchors.flyBy.forEach((v, i) => { const w = HL(v); pts.push([w.x, yFly[i], w.z]); });
    pts.push(P(600, 14.2), P(680, 10.4), P(725, 9.0), P(sMoon, 8.5));
    const path = makePath(pts);
    const gaze = HL(hero.anchors.gaze);
    const portalAt = path.end.clone();

    // ------------------------------------------------------------ kit materials (night look) and the town palette
    const mats = S.makeMaterials({
      night: 1, lit: rv.range(0.5, 0.68), glow: 1.55, warm: '#ffa64d', cool: '#ffcf96', glass: '#191320', flood: 1, floodColor: '#ffab5c',
      nightFill: [0.07, 0.11, 0.3], streetGlow: 0.42, streetY: QUAY, streetFall: 7,
      sky: { top: '#0a1338', horizon: '#15235c', sun: '#93a8e8', sunDir: [moonDir.x, moonDir.y, moonDir.z] },
    });
    hero.setLight({ moonDir, moonColor: new THREE.Vector3(0.3, 0.36, 0.56), waterColor: waterCol, horizonColor: sky.horizonColor.clone().multiplyScalar(0.5) });
    const sa = sunAz * Math.PI / 180, ember = new THREE.Color(SK.scatterColor);
    hero.setWater({ portal: [portalAt.x, portalAt.z, 17, 0.55], portalColor: [1.25, 0.86, 0.46], moonGlint: [0.2, 0.26, 0.46], emberDir: [Math.sin(sa), -Math.cos(sa)], emberColor: [ember.r * 0.3, ember.g * 0.3, ember.b * 0.34] });

    const tint = (hex) => { const c = new THREE.Color(hex); c.offsetHSL(rv.range(-0.015, 0.02), 0, rv.range(-0.01, 0.02)); return [c.r, c.g, c.b]; };
    const TP = {
      stone: lin('#66626e'), walls: ['#5a4034', '#664636', '#4a3836', '#6e4e36', '#58424a'].map(tint), roof: tint('#363b62'), trim: lin('#8a6444'), wood: lin('#33221c'),
      lamp: amber, rail: lin('#a32e1b'), road: lin('#6c6872'), robes: ['#5a2a30', '#2c3a66', '#6a5f9a', '#7a6a50', '#3a2a2a'].map(lin),
    };
    const G = [], H = [];                                             // glow points and hung lanterns for the hero's shared systems
    const glow = (p, size, col, type = 0, a) => G.push({ p: [p[0], p[1], p[2]], size, col, type, a });
    const hang = (x, y, z, sc) => {
      H.push([x, y, z, rng.range(0, 60), sc]);
      glow([x, y - 0.7 * sc, z], 1.6 * sc, lanL, 2); glow([x, y - 0.7 * sc, z], 3.0 * sc, mul(lanL, 0.14), 4);
    };
    const nearBridge = (s, m) => Math.abs(s - sB1) < m || Math.abs(s - sB2) < m || Math.abs(s - sMoon) < m;
    const chunk = (s) => (s < 190 ? 0 : s < 400 ? 1 : s < 590 ? 2 : 3);
    const FB = [0, 1, 2, 3].map(() => S.makeBuilder(8192)), BB = [0, 1, 2, 3].map(() => S.makeBuilder(8192));

    // embankment walls, kerbs, stone lanterns and festival-goers on the quays
    const tr = rng.fork('town');
    for (const side of [1, -1]) {
      for (let s = S0, i = 0; s < S1; s += STEP, i++) {
        const a = R.bank(s, side), c = R.bank(s + STEP, side), b = FB[chunk(s)];
        b.col(TP.stone, 0.5, 1).surf(SURF.MASONRY, 0, 1.4);
        if (side > 0) b.wall(c.x, c.z, a.x, a.z, -0.7, QUAY, { m: 1 }); else b.wall(a.x, a.z, c.x, c.z, -0.7, QUAY, { m: 1 });
        b.col(mul(TP.stone, 1.15), 1, 1).surf(SURF.MASONRY, 0, 2);
        b.beam([a.x - a.nx * 0.25, QUAY + 0.18, a.z - a.nz * 0.25], [c.x - c.nx * 0.25, QUAY + 0.18, c.z - c.nz * 0.25], 0.6, 0.4);
        if (nearBridge(s, 12)) continue;
        if (i % 3 === (side > 0 ? 0 : 1)) {
          const x = a.x - a.nx * 1.5, z = a.z - a.nz * 1.5;
          toroInto(b, x, QUAY, z, TP, 1.15); glow([x, QUAY + 1.6, z], 2.3, mul(amber, 1.5), 0);
        }
        const nf = tr.chance(0.55) ? tr.int(1, 3) : 0;
        for (let k = 0; k < nf; k++) {
          const t = tr.range(0, 1), o = tr.range(1.6, 5.5), x = lerp(a.x, c.x, t) - a.nx * o, z = lerp(a.z, c.z, t) - a.nz * o;
          const q = figureInto(b, tr, x, QUAY, z, TP); if (q) glow(q, 0.8, mul(amber, 1.3), 0);
        }
      }
    }
    await ctx.yield();

    // rows of houses stepping up the hillside
    const houses = [];
    const row = async (side, off, cfg) => {
      let s = S0 + tr.range(0, 6);
      while (s < S1 - 14) {
        await ctx.yield();                                            // hand back between houses (takes no draw)
        const w = tr.range(cfg.w[0], cfg.w[1]), d = tr.range(9, 12.5), gap = tr.chance(cfg.gap) ? tr.range(5, 11) : tr.range(0.4, 1.6);
        const o = off + (cfg.jit ? tr.range(-cfg.jit, cfg.jit) : 0), bk = R.bank(s, side, o + d / 2), sm = s + w / 2 / bk.tl, m = R.bank(sm, side, o + d / 2);
        s += (w + gap) / bk.tl;
        if (cfg.front ? nearBridge(sm, 8.5 + w / 2) : tr.chance(cfg.skip)) continue;
        const floors = tr.chance(cfg.tall) ? 3 : 2, gy = cfg.front ? QUAY : ground(sm, o + d / 2, side), b = (cfg.front ? FB : BB)[chunk(sm)];
        b.tr(m.x, gy, m.z, m.yaw);
        const info = houseInto(b, tr, { w, d, floors: floors + (cfg.extra && tr.chance(0.3) ? 1 : 0), P: TP, rich: !!cfg.front, plain: !!cfg.plain, lit: cfg.lit });
        b.pop();
        const cy = Math.cos(m.yaw), sy = Math.sin(m.yaw), W = (lx, lz) => [m.x + lx * cy + lz * sy, m.z - lx * sy + lz * cy];
        houses.push({ s: sm, side, x: m.x, z: m.z, gy, h: info.h, front: !!cfg.front, W });
        if (cfg.front) {
          const k = tr.chance(0.5) ? 1 : -1, q = W(k * (w / 2 - 0.5), d / 2 + 0.85);
          hang(q[0], gy + info.eaveY + 0.25, q[1], tr.range(0.8, 1.05));
        }
      }
    };
    for (const side of [1, -1]) {
      await row(side, 7.5, { front: true, w: [7, 11.5], gap: 0.14, tall: 0.4, lit: 1 });
      await row(side, 28.5, { w: [8, 13], gap: 0.1, skip: 0.1, tall: 0.6, lit: 0.9, extra: true });
      await ctx.yield();
      await row(side, 50.5, { w: [8, 13], gap: 0.2, skip: 0.28, tall: 0.6, lit: 0.8, extra: true, plain: true });
      await row(side, 80, { w: [8, 12], gap: 0.5, skip: 0.6, tall: 0.3, lit: 0.7, jit: 9, plain: true });
    }
    // a few small temples on the upper terrace
    for (let i = 0, n = rv.int(3, 5); i < n; i++) {
      const side = i % 2 ? 1 : -1, s = rv.range(40, 840), off = rv.range(66, 78), m = R.bank(s, side, off);
      const g = S.buildingGeometry({ rng: rng.fork('temple' + i), style: 'pagoda', tiers: rv.int(2, 4), width: rv.range(7, 9), height: rv.range(15, 24), detail: 0.5,
        palette: { wall: '#6a2a22', roof: '#2b2d47', trim: '#7a573c', accent: PALETTE[6] } });
      const b = BB[chunk(s)]; b.tr(m.x, ground(s, off, side) - 0.2, m.z, m.yaw); b.addGeometry(g); b.pop(); g.dispose();
    }
    await ctx.yield();

    // the three bridges
    const BP = { stone: lin('#77727c'), road: TP.road, rail: TP.rail, lamp: amber, trim: lin('#9a8f86') };
    const bridgeAt = (s, o, nFig) => {
      const f = R.frame(s), ry = Math.atan2(-f[2], -f[3]), cr = Math.cos(ry), sr = Math.sin(ry), b = FB[chunk(s)];
      const toW = (q) => [f[0] + q[0] * cr + q[2] * sr, q[1], f[1] - q[0] * sr + q[2] * cr];
      b.tr(f[0], 0, f[1], ry);
      const info = bridgeInto(b, o);
      for (let i = 0; i < nFig; i++) {
        const x = tr.range(-0.8, 0.8) * o.half, q = figureInto(b, tr, x, info.deck(x), tr.pick([-1, 1]) * (o.W / 2 - tr.range(0.7, 1.4)), TP);
        if (q) glow(toW(q), 0.8, mul(amber, 1.3), 0);
      }
      b.pop();
      for (const q of info.lamps) glow(toW(q), o.ring ? 2.6 : 2.2, mul(amber, 1.6), 0);
      return { deck: info.deck, toW, half: o.half, W: o.W };
    };
    bridgeAt(sB1, { half: 30, a: 20, clear: 11, W: 7, base: QUAY, P: BP, lamps: 7 }, 9);
    const br2 = bridgeAt(sB2, { half: 30, a: 20, clear: 11, W: 7, base: QUAY, P: BP, lamps: 7 }, 16);
    bridgeAt(sMoon, { half: 27, W: 6, base: QUAY, P: BP, ring: { r: 7.7, y: 8.5 }, lamps: 6, flood: 0.42 }, 8);

    // strings of lights: across the river on the first reach (lacquered poles on the quay edge), along the quays further down
    const sr = rng.fork('strings');
    const bulbCols = { amber: [mul(amber, 2)], mixed: [mul(amber, 2), mul(red, 2.2), [1.9, 1.5, 1.0]], festival: [mul(red, 2.4), mul(amber, 2), mul(red, 2.4), [1.8, 1.6, 1.3]] }[stringStyle];
    const pole = (x, z, h) => { const b = FB[chunk(R.locate(x, z).s)]; b.col(TP.rail, 0.7, 1).surf(SURF.LACQUER); b.cbox(x, QUAY, z, 0.26, h, 0.26); b.col(amber, 1, 1).surf(SURF.GLOW, 0, 2.2); b.cbox(x, QUAY + h, z, 0.34, 0.34, 0.34); };
    const string = (A, B, sag, sway, lanternEvery) => {
      const len = Math.hypot(B[0] - A[0], B[1] - A[1], B[2] - A[2]), n = Math.max(3, Math.round(len / 1.55)), ph = sr.range(0, 6.28);
      const f = R.frame(R.locate((A[0] + B[0]) / 2, (A[2] + B[2]) / 2).s);
      for (let k = 1; k < n; k++) {
        const t = k / n, x = lerp(A[0], B[0], t), y = lerp(A[1], B[1], t) - sag * 4 * t * (1 - t), z = lerp(A[2], B[2], t), am = sway * Math.sin(Math.PI * t);
        if (lanternEvery && k % lanternEvery === 2) hang(x, y, z, 0.9);
        else glow([x, y - 0.1, z], sr.range(0.75, 1.0), bulbCols[k % bulbCols.length], 0, [f[2] * am, f[3] * am, sr.range(0, 40), ph + t * 1.5]);
      }
    };
    for (let s = 28; s < sB2 - 16; s += sr.range(22, 28)) {
      if (nearBridge(s, 17)) continue;
      const a = R.at(s, -(R.hwL(s) + 1.3)), c = R.at(s, R.hwR(s) + 1.3);
      pole(a[0], a[1], 10); pole(c[0], c[1], 10);
      string([a[0], QUAY + 10, a[1]], [c[0], QUAY + 10, c[1]], 1.9, 0.12, 5);
    }
    for (const side of [1, -1]) {
      let prev = null;
      for (let s = side > 0 ? 300 : 540; s < 752; s += 23) {
        if (nearBridge(s, 14)) { prev = null; continue; }
        const q = R.bank(s, side, 1.2), top = [q.x, QUAY + 6.2, q.z];
        pole(q.x, q.z, 6.2);
        if (prev) string(prev, top, 1.1, 0.1, 0);
        prev = top;
      }
    }
    // two walled islets with big cherry trees: the close pass after the second bridge
    const islets = [R.at(sB2 + 46, -12.5), R.at(sB2 + 68, 12.5)];
    for (const q of islets) {
      const b = FB[1];
      b.col(TP.stone, 0.55, 1).surf(SURF.MASONRY, 0, 1.4); b.cyl(q[0], -0.7, q[1], 3.4, 3.1, 1.9, 12, { m: 1 });
      b.col([0.07, 0.09, 0.06], 1, 1).surf(SURF.PLAIN); b.disc(q[0], 1.2, q[1], 3.1, 12, true);
      toroInto(b, q[0] + 1.9, 1.2, q[1] + 0.8, TP, 1.1); glow([q[0] + 1.9, 2.9, q[1] + 0.8], 2.4, mul(amber, 1.6), 0);
    }

    // shrine gates climbing the hillsides, a lamp at each
    for (const [side, s0] of [[-1, rv.range(130, 230)], [1, rv.range(585, 690)]]) for (let k = 0; k < 9; k++) {
      const o = 63 + k * 8, s = s0 + k * 2.5, q = R.bank(s, side, o), y = ground(s, o, side), b = BB[chunk(s)];
      b.tr(q.x, y, q.z, q.yaw); toriiInto(b, 3.8, 4.6, TP); b.pop();
      glow([q.x + q.nx * 1.2, y + 2.4, q.z + q.nz * 1.2], 2.0, mul(amber, 1.4), 4);
    }

    const front = [], townMeshes = [];
    for (const [list, isFront] of [[FB, true], [BB, false]]) for (const b of list) {
      if (!b.triangles) continue;
      await ctx.yield();
      const m = new THREE.Mesh(b.toGeometry(), mats.facades); scene.add(m); townMeshes.push(m); if (isFront) front.push(m);
      m.renderOrder = isFront ? -0.3 : 0;                               // river fronts first, so the rows behind them fail the depth test
    }
    const mirror = S.makeReflection(front, { mats, waterY: 0, range: 340 });
    scene.add(mirror.object);
    await ctx.yield();

    // ------------------------------------------------------------ land: quays, terraces and hills, one strip mesh per bank
    {
      const pos = [], col = [], warmA = [], idx = [], maxR = 200 / bend - 42;
      const offs = [0, 4, 8, 16, 23, 27, 35, 43, 49, 56, 62, 76, 96, 125, 165, 215, 280, 360, 460];
      const ss = []; for (let s = S0 - 40; s <= S1 + 168; s += STEP) ss.push(s);
      for (const side of [1, -1]) {
        const os = side > 0 ? offs.filter((o) => o < maxR).concat([maxR]) : offs, base = pos.length / 3, nr = os.length;
        for (const s of ss) for (const o of os) {
          const p = R.at(s, side * (R.hw(s, side) + o)), y = ground(s, o, side) - (o > 300 ? 0 : 0);
          pos.push(p[0], y, p[1]);
          const n = 0.8 + 0.4 * noise.n2(p[0] * 0.07, p[1] * 0.07), g = smoothstep(20, 30, o) * (0.55 + 0.45 * noise.n2(p[0] * 0.02 + 9, p[1] * 0.02)), hK = smoothstep(58, 70, o);
          const stone = [0.2 * n, 0.19 * n, 0.225 * n], garden = [0.08 * n, 0.11 * n, 0.08 * n], hill = [0.085 * n, 0.14 * n, 0.13 * n];
          const c = mix3(mix3(stone, garden, g), hill, hK);
          col.push(c[0], c[1], c[2]);
          const wk = 0.75 * Math.exp(-o / 6) + 0.2 * smoothstep(20, 26, o) * (1 - smoothstep(58, 70, o)) + 0.12 * (1 - smoothstep(70, 110, o));   // lantern light pooled on the quays and lanes
          warmA.push(amber[0] * wk, amber[1] * wk, amber[2] * wk);
        }
        for (let i = 0; i < ss.length - 1; i++) for (let j = 0; j < nr - 1; j++) {
          const a = base + i * nr + j, b = a + nr, c = b + 1, d = a + 1;
          if (side > 0) idx.push(a, d, c, a, c, b); else idx.push(a, b, c, a, c, d);
        }
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.setIndex(idx);
      g.setAttribute('warm', new THREE.Float32BufferAttribute(warmA, 3));
      g.computeVertexNormals();
      const landMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95, metalness: 0 });
      landMat.onBeforeCompile = (sh) => {
        sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute vec3 warm; varying vec3 vWarm;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvWarm = warm;');
        sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vWarm;').replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\ntotalEmissiveRadiance += vWarm * diffuseColor.rgb;');
      };
      landMat.customProgramCacheKey = () => 'lantern-river-land';
      const land = new THREE.Mesh(g, landMat); land.renderOrder = 0.3; scene.add(land);
    }
    const ridges = T.makeHorizonRidges({ rng: rng.fork('ridges'), layers: 3, radius: [1250, 2700], height: [90, 280], base: -20, colorNear: '#0b1436', haze: fogCol, sunDir: moonDir, sunColor: '#7f9cff', sunIntensity: 0.45, snow: null });
    scene.add(ridges.object);
    await ctx.yield();

    // ------------------------------------------------------------ flora: willows trailing in the water, cherries in blossom, bamboo, dark hill trees
    const fr = rng.fork('flora');
    const wind = flora.makeWind({ direction: [0.6, 0.8], strength: 0.85, speed: 0.9 });
    const fmat = flora.windMaterial({ wind, backlight: 0.5, backlightTint: '#ffd0a0', ambient: 2.3, leafAmbient: 2.5, emissive: '#3a2410', emissiveIntensity: 0.5 });
    const cmat = flora.windMaterial({ wind, map: fmat.map, backlight: 0.6, backlightTint: '#ffd0e0', ambient: 2.3, leafAmbient: 2.8, emissive: '#5a2436', emissiveIntensity: 0.55 });
    const willows = [], cherries = [], bamboo = [], hillTrees = [];
    const tp = (x, y, z, s, v) => ({ x, y, z, s, rot: fr.range(0, 6.28), d: 0, u: 0, v });
    for (const q of islets) cherries.push(tp(q[0], 1.15, q[1], fr.range(1.05, 1.2), 0));
    for (const side of [1, -1]) {
      for (let s = S0 + 30 + fr.range(0, 20); s < S1 - 20; s += fr.range(13, 24)) {
        if (nearBridge(s, 15)) continue;
        const r = fr();
        if (r < 0.17) { const q = R.bank(s, side, 1.7); willows.push(tp(q.x, QUAY - 0.1, q.z, fr.range(0.95, 1.25), 0)); }
        else if (r < 0.6 || (s > sB2 - 30 && s < 420)) { const q = R.bank(s, side, fr.range(3.6, 5.6)); cherries.push(tp(q.x, QUAY - 0.1, q.z, fr.range(0.85, 1.3), 1 + (fr.chance(0.5) ? 1 : 0))); }
        if (fr.chance(0.25)) { const o = fr.range(21.5, 26), q = R.bank(s + 5, side, o); bamboo.push(tp(q.x, ground(s + 5, o, side) - 0.2, q.z, fr.range(0.8, 1.2), 0)); }
      }
      const maxO = side > 0 ? 200 / bend - 70 : 300;
      for (let i = 0; i < 32; i++) {
        const s = fr.range(S0, S1 + 80), o = fr.range(66, maxO), q = R.at(s, side * (R.hw(s, side) + o));
        hillTrees.push(tp(q[0], ground(s, o, side) - 0.6, q[1], fr.range(0.8, 1.7), fr.int(0, 1)));
      }
    }
    for (const side of [1, -1]) for (const ds of [-13, 12]) {         // cherries flanking the Moon Bridge abutments
      const q = R.bank(sMoon + ds, side, fr.range(4.2, 5.4)); cherries.push(tp(q.x, QUAY - 0.1, q.z, fr.range(1.0, 1.25), ds < 0 ? 0 : 1));
    }
    const blossom = rv.pick([['#f4b6cc', '#ffd9e6'], ['#f7c4d4', '#fff0f4'], ['#f0a6c0', '#ffd0de']]);
    const floraSets = [
      flora.makeScatter({ rng: fr.fork('w'), points: willows, variants: [flora.willowGeometry({ rng: fr.fork('wg'), detail: 1, height: 11, leaf: '#6f8f4a' })], material: fmat }),
      flora.makeScatter({ rng: fr.fork('c'), points: cherries, material: cmat, variants: [
        flora.cherryGeometry({ rng: fr.fork('c0'), detail: 1, height: 11.5, leaf: blossom[0], leafLight: blossom[1] }),
        flora.cherryGeometry({ rng: fr.fork('c1'), detail: 0, height: 8.5, leaf: blossom[0], leafLight: blossom[1] }),
        flora.cherryGeometry({ rng: fr.fork('c2'), detail: 0, height: 7.5, leaf: blossom[0], leafLight: blossom[1] })] }),
      flora.makeScatter({ rng: fr.fork('b'), points: bamboo, variants: [flora.bambooGeometry({ rng: fr.fork('bg'), detail: 0, height: 11 })], material: fmat }),
      flora.makeScatter({ rng: fr.fork('h'), points: hillTrees, material: fmat, variants: [
        flora.coniferGeometry({ rng: fr.fork('h0'), detail: 0, height: 15, leaf: '#1f3a34' }), flora.cypressGeometry({ rng: fr.fork('h1'), detail: 0, height: 13, leaf: '#22403a' })] }),
    ];
    for (const f of floraSets) scene.add(f.object);
    await ctx.yield();

    // a night market by the first bridge
    {
      const mp = [], my = [];
      for (let i = 0; i < 7; i++) { const q = R.bank(sB1 + 15 + i * 5.4, 1, 4.4); mp.push([q.x, QUAY, q.z]); my.push(q.yaw); }
      scene.add(S.makeMarket({ rng: rng.fork('market'), positions: mp, yaws: my, mats }).object);
    }

    // ------------------------------------------------------------ lantern boats poling along the river (instanced, with mirror images)
    const tU = { value: 0 };
    const br = rng.fork('boats');
    const boatG = boatGeometry(br, { hull: lin('#3a2418'), deck: lin('#5a4030'), cabin: lin('#4a2f22'), roof: TP.roof, trim: TP.trim, wood: TP.wood, lamp: amber, robe: lin('#2c3a66'), hat: lin('#b89a5a') });
    const boats = [];
    for (let i = 0; i < nBoats; i++) {
      const side = i % 2 ? 1 : -1, lead = i < 3;
      boats.push({ d: side * br.range(8, 14), s0: lead ? 34 + i * 30 + br.range(-6, 6) : br.range(120, 700), v: lead ? br.range(0.7, 1.1) : br.range(0.8, 1.6) * (br.chance(0.6) ? 1 : -1), ph: br.range(0, 6.28) });
    }
    const boatMesh = new THREE.InstancedMesh(boatG.geometry, mats.facades, nBoats); boatMesh.frustumCulled = false; scene.add(boatMesh);
    const boatMirror = new THREE.InstancedMesh(boatG.geometry, mats.facadeBelow(0), nBoats); boatMirror.instanceMatrix = boatMesh.instanceMatrix; boatMirror.frustumCulled = false;
    const boatMirrorRoot = new THREE.Group(); boatMirrorRoot.scale.y = -1; boatMirrorRoot.add(boatMirror); scene.add(boatMirrorRoot);
    const boatGlow = fx.makeGlows({ time: tU, positions: new Float32Array(nBoats * 12), colors: [mul(amber, 1), mul(amber, 1), mul(amber, 0.4), mul(amber, 0.4)], size: 2.6, intensity: 1.1, flicker: 0.25, renderOrder: 1 });
    scene.add(boatGlow.object);
    const _m = new THREE.Matrix4(), _e = new THREE.Euler(0, 0, 0, 'YXZ'), _v = new THREE.Vector3(), _one = new THREE.Vector3(1, 1, 1), _q = new THREE.Quaternion();
    const SLO = -60, SHI = 735;
    const placeBoats = (time) => {
      for (let i = 0; i < nBoats; i++) {
        const bt = boats[i], s = SLO + ((((bt.s0 + bt.v * time - SLO) % (SHI - SLO)) + (SHI - SLO)) % (SHI - SLO));
        const d = bt.d + (bt.d < 0 ? 17 * Math.exp(-(((s - 430) / 78) ** 2)) : 0), f = R.frame(s), dir = bt.v < 0 ? -1 : 1;
        const x = f[0] - f[3] * d, z = f[1] + f[2] * d, ry = Math.atan2(-f[3] * dir, f[2] * dir);
        _e.set(0.035 * Math.sin(time * 0.9 + bt.ph), ry, 0.02 * Math.sin(time * 0.7 + bt.ph * 2));
        _m.compose(_v.set(x, 0.03 * Math.sin(time * 1.1 + bt.ph), z), _q.setFromEuler(_e), _one);
        boatMesh.setMatrixAt(i, _m);
        for (let k = 0; k < 2; k++) {
          _v.set(boatG.lamps[k][0], boatG.lamps[k][1], boatG.lamps[k][2]).applyMatrix4(_m);
          boatGlow.setPosition(i * 4 + k, _v.x, _v.y, _v.z); boatGlow.setPosition(i * 4 + 2 + k, _v.x, -_v.y, _v.z);
        }
      }
      boatMesh.instanceMatrix.needsUpdate = true;
    };
    placeBoats(0);

    // ------------------------------------------------------------ the release: modelled sky lanterns near the river, glow points beyond
    const rr = rng.fork('release'), rising = [];
    const launchU = (s) => 0.47 + Math.max(0, s - 330) / 760 * 0.55;
    const addRising = (x, y, z, u0, hgt) => {
      const a = [u0, hgt, rr.range(0, 40), rr.range(1.0, 1.45)], b = [rr.range(-3, 3), rr.range(-3, 3)];
      rising.push({ base: [x, y, z], a, b });
      G.push({ p: [x, y + 0.6, z], a, b, type: 3, size: 1.8, col: amber });
    };
    for (let i = 0; i < 60; i++) {                                    // first wave: off the second bridge as the camera reaches it
      const x = rr.range(-0.9, 0.9) * br2.half, q = br2.toW([x, br2.deck(x) + 1.5, rr.range(-1, 1) * (br2.W / 2 - 0.6)]);
      addRising(q[0], q[1], q[2], 0.255 + rr.range(0, 0.085), 5 + 44 * Math.pow(rr(), 1.4));
    }
    for (let i = 0, tries = 0; i < 440 && tries < 6000; tries++) {    // then the boats and quays, running ahead of the camera down the river
      const s = rr.chance(0.3) ? rr.range(338, 530) : rr.range(530, 812), side = rr.chance(0.5) ? 1 : -1, onQuay = rr.chance(0.35);
      if (Math.abs(s - sMoon) < 6) continue;
      const hwS = R.hw(s, side), d = side * (onQuay ? hwS + rr.range(1, 6.5) : rr.range(7.5, Math.min(hwS - 1, s < 530 && side < 0 ? 22 : 99)));
      const p = R.at(s, d);
      if (path.nearestXZ(p[0], p[1]).dist < 7.5) continue;
      addRising(p[0], onQuay ? QUAY + 1.4 : 0.9, p[1], launchU(s) + rr.range(-0.02, 0.05), 8 + 80 * Math.pow(rr(), 1.5));
      i++;
    }
    const maxD = 200 / bend - 30;
    for (let i = 0; i < 2500; i++) {
      const s = rr.range(290, 930), d = clamp(rr.gauss() * 85, -240, maxD), p = R.at(s, d);
      if (path.nearestXZ(p[0], p[1]).dist < 10) continue;
      G.push({ p: [p[0], 2 + rr.range(0, 8), p[1]], a: [launchU(s) + rr.range(-0.03, 0.08), 14 + 120 * Math.pow(rr(), 1.3), rr.range(0, 40), 0], b: [rr.range(-6, 6), rr.range(-6, 6)],
        type: 1, size: rr.range(0.9, 1.5), col: mul(mix3(amber, red, rr.range(0, 0.25)), rr.range(0.9, 1.6)) });
    }
    const glows = hero.kit.glows(G), hungMesh = hero.kit.hung(H), risingMesh = hero.kit.rising(rising);
    scene.add(glows.below, glows.above, hungMesh, risingMesh);
    await ctx.yield();

    // ------------------------------------------------------------ creatures: koi under the first lantern boats, bats against the sky band
    const koiAt = R.at(sB1 - 16, 3.5);                                // just ahead of and below the camera at u 0.1, in the light of the first bridge
    const koi = F.makeFishSchool({ rng: rng.fork('koi'), species: 'koi', count: rv.int(16, 30), size: rv.range(2.2, 2.8), center: [koiAt[0], -0.5, koiAt[1]], spread: [10, 0.16], speed: 0.6, caustics: 0,
      light: { sunDir: [0.25, 1, 0.15], sunColor: '#ffb060', sunIntensity: 2.4, sky: '#4460b4', skyIntensity: 1.3, ground: '#201830', groundIntensity: 0.6 } });
    const nightLight = { sunDir: [moonDir.x, moonDir.y, moonDir.z], sunColor: '#7f9cff', sunIntensity: 1.2, sky: '#4460b4', skyIntensity: 1.6, ground: '#3a2a3a', groundIntensity: 0.8 };
    const bp = (s, d, y) => { const p = R.at(s, d); return [p[0], y, p[1]]; };
    const bats = F.makeFlock({ rng: rng.fork('bats'), species: 'bats', count: rv.int(24, 44), size: 1.5, light: nightLight, closed: true,
      route: [bp(40, -19, 17), bp(150, 17, 26), bp(290, 21, 21), bp(330, -17, 30), bp(200, -24, 19), bp(90, -8, 24)] });
    const bats2 = rv.chance(0.6) ? F.makeFlock({ rng: rng.fork('bats2'), species: 'bats', count: rv.int(16, 28), size: 1.5, light: nightLight, closed: true,
      route: [bp(560, -22, 30), bp(660, 18, 24), bp(750, 24, 34), bp(700, -20, 27)] }) : null;
    scene.add(koi.object, bats.object); if (bats2) scene.add(bats2.object);

    // ------------------------------------------------------------ air: petals, river mist, far fireworks
    const petals = fx.makeParticles({ rng: rng.fork('petals'), preset: 'petals', time: tU, count: Math.round(950 * petalK), colors: ['#ffc2d6', '#ffe0ea', '#f4a6c2'], intensity: 0.7 });
    const mistPos = [], mr = rng.fork('mist');
    for (let s = 40 + mr.range(0, 30); s < 880; s += misty ? 44 : 62) { const side = mr.chance(0.5) ? 1 : -1, p = R.at(s, side * mr.range(0, R.hw(s, side) - 3)); mistPos.push([p[0], mr.range(0.9, 1.8), p[1]]); }
    const mistCol = new THREE.Color().copy(fogCol).multiplyScalar(1.7).lerp(new THREE.Color(PALETTE[5]), 0.16);
    const mist = fx.makeMist({ rng: mr, time: tU, positions: mistPos, count: mistPos.length, size: [26, 46], color: mistCol, opacity: misty ? 0.2 : 0.11, drift: [0.5, 0, 0.25] });
    const fwAt = R.at(985, rv.range(-70, 70));
    const fireworks = fx.makeFireworks({ rng: rng.fork('fw'), time: tU, position: [fwAt[0], rv.range(85, 105), fwAt[1]], area: [230, 40, 90], bursts: 3, sparks: 170, radius: 40, period: rv.range(4.2, 5.4),
      colors: ['#ffb35a', '#ff4d3d', '#ffe2b0'], intensity: 3.2 });
    scene.add(petals.object, mist.object, fireworks.object);

    const cs = { s: 0 };
    return {
      scene, path, duration: 46,
      title: mood === 'deep' ? 'River of Lanterns, Midnight' : 'River of Lanterns',
      camera: { fov: 62, near: 0.3, far: 4200, lookAhead: 32, sway: 1, bank: 0.8 },
      pois: [{ at: gaze, from: 0.36, to: 0.71, weight: 0.62, fade: 0.3 }],
      portal: { shape: 'circle', radius: 7, color: '#ffd9a0', glow: 1.2, revealDistance: 300 },
      post: {
        exposure: misty ? 0.97 : 1.02, bloom: { strength: 0.6, radius: 0.7, threshold: 0.9 },
        grade: { saturation: 1.1, contrast: 1.05, tint: '#f9f6f6', shadowTint: mood === 'violet' ? '#120a2a' : '#070c26', vignette: 0.4, grain: 0.03, aberration: 0 },
      },
      update(dt, time, camera, u) {
        tU.value = time;
        sky.update(dt, time, camera); rig.update(dt, time, camera); ridges.update(dt, time, camera);
        mats.update(dt, time); mirror.update(dt, time, camera);
        hero.setProgress((u - 0.5) / 0.25); hero.setU(u); hero.update(dt, time, camera);
        for (const f of floraSets) f.update(dt, time, camera);
        placeBoats(time);
        boatGlow.update(dt, time, camera); petals.update(dt, time, camera); mist.update(dt, time, camera); fireworks.update(dt, time, camera);
        const loc = R.locate(camera.position.x, camera.position.z); cs.s = loc.s;
        koi.object.visible = loc.s < 230; if (koi.object.visible) koi.update(dt, time, camera, u);
        bats.object.visible = loc.s < 420; if (bats.object.visible) bats.update(dt, time, camera, u);
        if (bats2) bats2.update(dt, time, camera, u);
        petals.setOpacity(0.3 + 0.7 * smoothstep(sB2 - 70, sB2 + 10, loc.s) * (1 - smoothstep(400, 520, loc.s)));
      },
      dispose() {
        hero.dispose?.(); sky.dispose?.();
        for (const m of Object.values(mats)) {                          // kit materials this world never attached to the scene
          if (!m || !m.isMaterial) continue;
          for (const v of Object.values(m)) if (v && v.isTexture) v.dispose();
          if (m.uniforms) for (const un of Object.values(m.uniforms)) if (un && un.value && un.value.isTexture) un.value.dispose();
          m.dispose();
        }
      },
    };
  },
};
