// THE LAST LIT WINDOWS, the Night Land: the black plain outside the ring and everything that stands or burns on it.
//
// ANTIALIASING (declared once, polish round 1, second part): the slag's relief on the ground (section 4, cSlag) is
// drawn softer where the true footprint of a pixel on the ground (the screen derivatives of the ground's own x and z)
// is wider than a broken edge, 3 m, and flat from 12 m. That is the only thing of the ground's new lights that knows
// the eye, with the air between. No light of the land goes by the eye's distance or height.
//
// MAP OF THIS FILE
//   1. makeLayout       where things are: the great Watcher's frame, pits A and B by the path, the seeded pits, fire-holes,
//                       cones, the house, the kiln; the ring's distance function; the height of the ground
//   2. glow             the red, blue and pale light the fires and the dome throw on the ground: one function, baked into a
//                       half-float map near the path and into the ground's vertices further off
//   3. buildSky         the dome of the night: black, a cold band, four red smears and a blue one that breathe
//   4. buildGround      the plain: own grid (fine near the path), own shader (cinder, ash drifts, the pale road, the
//                       causeway, the light of the ring, the gate and the fires, a sheen toward the face)
//   5. buildRing, buildDome
//   6. buildFires       pit cores, flames (crossed cards), hole rims, smoke, sparks, heat
//   7. buildMoss, buildHouse, buildCones, buildStrata
import * as THREE from 'three';
import { NL_GLSL, PYR, GATE } from './last-lit-windows.js';

const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const sst = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
export const RING_OUT = 220;
// distance outside the ring (negative inside it): the ring follows the base 220 m out, its corners rounded
export const ringDist = (x, z) => Math.hypot(Math.max(Math.abs(x) - PYR.half, 0), Math.max(Math.abs(z) - PYR.half, 0)) + Math.min(Math.max(Math.abs(x) - PYR.half, Math.abs(z) - PYR.half), 0) - RING_OUT;
export const ROAD_Z = 1490;
export const roadZ = (x) => ROAD_Z + 7 * Math.sin(x / 210 + 0.6) + 3 * Math.sin(x / 67);

// ------------------------------------------------------------------------------------------------ 1. layout
export function makeLayout(ctx, path, opts = {}) {
  // S: one seeded stream for each family of things dealt here (taken by the world, in a fixed order, before anything is dealt)
  const S = opts.streams, noise = ctx.noise;
  const _q = new THREE.Vector3(), _t = new THREE.Vector3();
  // the low flight, from the entry to where the path crosses the ring: its chord gives a frame for scattering things
  let dRing = 0;
  while (dRing < path.length) { path.posAtDist(dRing, _q); if (ringDist(_q.x, _q.z) < 0) break; dRing += 1; }
  const P0 = path.points[0], P1 = path.posAtDist(dRing).clone();
  const f = new THREE.Vector2(P1.x - P0.x, P1.z - P0.z), legLen = f.length(); f.normalize();
  const r = new THREE.Vector2(-f.y, f.x);                 // along that chord, and to its right
  const at = (along, right) => [P0.x + f.x * along + r.x * right, P0.z + f.y * along + r.y * right];
  // a point so many metres to the right of the route, so many metres from its start
  const beside = (d, right) => { path.posAtDist(d, _q); path.tangentAtDist(d, _t); const l = Math.hypot(_t.x, _t.z) || 1; return [_q.x - _t.z / l * right, _q.z + _t.x / l * right]; };
  // the great Watcher lies right of the path and looks north-west at the face, so that we come up on its left side and
  // pass under its head; the dome of light stands 70 m in front of the head, the path between them and the road
  const wf = [-Math.SQRT1_2, -Math.SQRT1_2], W = { c: [-28, 1747], f: wf, r: [-wf[1], wf[0]], len: 260, wid: 210, tall: 170 };
  W.head = [W.c[0] + wf[0] * 130, W.c[1] + wf[1] * 130];
  const dome = { x: W.head[0] + wf[0] * 70, z: W.head[1] + wf[1] * 70, r: 36 };
  const blue = !!opts.blueField;
  // THE FAR WATCHERS. The compass about the house has four quarters, each 90 degrees wide: the south (+z, the face we fly
  // over), the east (+x), the north and the west. The great Watcher holds the south. Two unlike quarters of the other
  // three are dealt from the Watchers' stream, one far Watcher to each: its bearing is drawn from the whole of its
  // quarter, its distance from 2300 to 3000 m from the house's centre (one range for both). Each faces the house, stopped
  // up to 14 degrees off the line to its centre. One has a red pit under its head, one a ring of blue light over it;
  // which is the seed's. Whether the flight or the gallery looks toward either of them is the seed's too.
  const swap = !!opts.swap, rw = S.watchers, DEG = Math.PI / 180;
  const qa = rw.pick([1, 2, 3]), qb = rw.pick([1, 2, 3].filter((q) => q !== qa));
  const stand = (quarter, tall, glow) => {
    // the bearing is counted from the south toward the east: quarter 1 is the east, 2 the north, 3 the west
    const b = (quarter * 90 + rw.range(-45, 45)) * DEG, d = rw.range(2300, 3000), x = Math.sin(b) * d, z = Math.cos(b) * d, a = Math.atan2(-x, -z) + rw.range(-14, 14) * DEG;
    const w = { x, z, tall, glow, quarter, f: [Math.sin(a), Math.cos(a)] };
    w.pit = [x + w.f[0] * 170, z + w.f[1] * 170];
    return w;
  };
  const far = [stand(qa, 230, swap ? 'crown' : 'pit'), stand(qb, 260, swap ? 'pit' : 'crown')];
  const farIn = (x, z, pad) => { for (const w of far) if (Math.hypot(x - w.x, z - w.z) < w.tall * 0.75 + pad) return true; return false; };
  // PITS A AND B, by the route. A burns 34 m to its left, 100 to 160 m from the start: the first fire we pass, on the side
  // where the hounds run. B burns 40 m to its right, 300 to 360 m from the start, where the route rounds the Watcher's
  // breast: the red under its head.
  const pits = [], rp = S.pits;
  { const a = beside(rp.range(100, 160), -34), b = beside(rp.range(300, 360), 40);
    pits.push({ x: a[0], z: a[1], r: 10, kind: blue ? 1 : 0, name: 'A' }, { x: b[0], z: b[1], r: 14, kind: 0, name: 'B' }); }
  const inW = (x, z, pad) => { const dx = x - W.c[0], dz = z - W.c[1], a = dx * W.f[0] + dz * W.f[1], b = dx * W.r[0] + dz * W.r[1]; return (a / (W.len / 2 + pad)) ** 2 + (b / (W.wid / 2 + pad)) ** 2 < 1; };
  const house = { x: 900 + S.house.range(-160, 160), z: 1600 + S.house.range(-40, 110), hill: 35 };
  const kiln = { x: 640 + S.kiln.range(-80, 120), z: 1760 + S.kiln.range(-40, 80) };
  const okSpot = (x, z, rad, pathClear) => {
    if (ringDist(x, z) < 30 + rad) return false;
    if (inW(x, z, 30 + rad) || farIn(x, z, 30 + rad)) return false;
    if (Math.hypot(x - dome.x, z - dome.z) < dome.r + 20 + rad) return false;
    if (Math.abs(z - roadZ(x)) < 12 + rad) return false;
    if (Math.hypot(x - house.x, z - house.z) < 150 || Math.hypot(x - kiln.x, z - kiln.z) < 90 + rad) return false;
    if (path.nearestXZ(x, z).dist < pathClear + rad) return false;
    for (const p of pits) if (Math.hypot(x - p.x, z - p.z) < p.r + rad + 14) return false;
    return true;
  };
  // twelve more pits: five in the country the first leg looks over, seven east and south for the climb to look down on
  let guard = 0;
  while (pits.length < 7 && guard++ < 400) { const a = at(rp.range(0.1, 1.0) * legLen, rp.range(-330, -60)), rad = rp.range(7, 12); if (okSpot(a[0], a[1], rad, 18)) pits.push({ x: a[0], z: a[1], r: rad, kind: blue ? 1 : 0 }); }
  while (pits.length < 14 && guard++ < 900) { const x = rp.range(220, 2300), z = rp.range(1500, 2500), rad = rp.range(9, 17); if (okSpot(x, z, rad, 18)) pits.push({ x, z, r: rad, kind: 0 }); }
  // sixty fire-holes: most within reach of the low flight, the rest scattered east
  const holes = [], rh = S.holes;
  guard = 0;
  while (holes.length < 60 && guard++ < 4000) {
    let x, z;
    if (holes.length < 44) { const a = at(rh.range(-0.06, 1.0) * legLen, rh.range(-260, 150)); x = a[0]; z = a[1]; } else { x = rh.range(150, 1500); z = rh.range(1470, 2100); }
    if (!okSpot(x, z, 3, 18)) continue;
    let near = false; for (const h of holes) if (Math.hypot(x - h.x, z - h.z) < 16) { near = true; break; }
    if (near) continue;
    holes.push({ x, z, r: rh.range(1.1, 2.1), kind: (blue && holes.length < 44) || rh.chance(0.14) ? 1 : 0 });
  }
  // five smoking cones, east and south
  const cones = [], rc = S.cones;
  guard = 0;
  while (cones.length < 5 && guard++ < 300) {
    const out = cones.length < 3, x = out ? rc.range(1500, 2600) : rc.range(-900, 900), z = out ? rc.range(1700, 2500) : rc.range(2250, 2700), h = rc.range(40, 90), rad = h * rc.range(1.3, 1.8);
    let ok = Math.hypot(x - house.x, z - house.z) > 300 && !farIn(x, z, rad + 60); for (const c of cones) if (Math.hypot(x - c.x, z - c.z) < 420) ok = false;
    if (ok) cones.push({ x, z, h, r: rad });
  }
  // ---- the ground
  const pbox = [Infinity, -Infinity, Infinity, -Infinity];
  for (const q of path.points) { pbox[0] = Math.min(pbox[0], q.x - 30); pbox[1] = Math.max(pbox[1], q.x + 30); pbox[2] = Math.min(pbox[2], q.z - 30); pbox[3] = Math.max(pbox[3], q.z + 30); }
  const heightBase = (x, z) => {
    const rd = ringDist(x, z);
    const out = sst(-4, 80, rd), farK = sst(700, 2200, rd);
    let h = (3.3 * noise.fbm2(x / 190, z / 190, 3) + 1.3 * noise.n2(x / 47 + 9, z / 47 - 4) + 0.35 * noise.n2(x / 11, z / 11)) * out;
    h += farK * (9 * noise.fbm2(x / 520 + 30, z / 520 - 12, 3) + 5);
    // the road lies in a shallow cut, the ring on level ground
    h *= 0.35 + 0.65 * sst(4, 22, Math.abs(z - roadZ(x)));
    h *= sst(6, 40, Math.abs(rd));
    // earth drifted against the Watchers
    { const dx = x - W.c[0], dz = z - W.c[1], a = dx * W.f[0] + dz * W.f[1], b = dx * W.r[0] + dz * W.r[1], q = Math.hypot(a / (W.len / 2), b / (W.wid / 2));
      h += 13 * (1 - sst(0.86, 1.32, q)) * (0.7 + 0.3 * noise.n2(a / 30, b / 30)); }
    for (const w of far) { const q = Math.hypot(x - w.x, z - w.z) / (w.tall * 0.72); h += 14 * (1 - sst(0.85, 1.4, q)); }
    { const d = Math.hypot(x - house.x, z - house.z); h += house.hill * Math.exp(-(d * d) / (95 * 95)) * (1 + 0.12 * noise.n2(x / 60, z / 60)); }
    for (const c of cones) { const d = Math.hypot(x - c.x, z - c.z); if (d < c.r * 1.5) h += c.h * 0.14 * (1 - sst(c.r * 0.5, c.r * 1.5, d)); }
    return h;
  };
  const heightAt = (x, z) => {
    let h = heightBase(x, z);
    for (const p of pits) {
      const d = Math.hypot(x - p.x, z - p.z); if (d > p.r * 2.6) continue;
      h += 1.7 * Math.exp(-(((d - p.r * 1.12) / (p.r * 0.36)) ** 2)) - 5.2 * (1 - sst(p.r * 0.2, p.r * 1.05, d));
    }
    if (x > pbox[0] && x < pbox[1] && z > pbox[2] && z < pbox[3]) { const n = path.nearestXZ(x, z); if (n.dist < 24) h = Math.min(h, n.y - 8 + 3 * sst(8, 24, n.dist)); }
    return h;
  };
  for (const p of pits) p.y = heightAt(p.x, p.z);
  for (const h of holes) h.y = heightAt(h.x, h.z);
  for (const c of cones) c.y = heightAt(c.x, c.z);
  house.y = heightAt(house.x, house.z); kiln.y = heightAt(kiln.x, kiln.z); dome.y = heightAt(dome.x, dome.z);
  for (const w of far) w.y = 0;
  // the black country beyond: fires out to the horizon, east and south, thickest in a few fields; a far plain of blue ones
  const rf = S.fields, rq = S.farfires;
  const farFires = [], fields = [0, 1, 2, 3, 4].map(() => [rf.range(500, 2900), rf.range(1700, 3300), rf.range(180, 420)]);
  const bluePlain = [rf.range(1500, 2600), rf.range(2500, 3300)];
  guard = 0;
  while (farFires.length < 170 && guard++ < 3000) {
    let x, z, kind = 0;
    const pick = rq();
    if (pick < 0.5) { const fl = rq.pick(fields), a = rq() * 6.283, d = fl[2] * Math.sqrt(rq()); x = fl[0] + Math.cos(a) * d; z = fl[1] + Math.sin(a) * d * 0.7; }
    else if (pick < 0.68) { const a = rq() * 6.283, d = 330 * Math.sqrt(rq()); x = bluePlain[0] + Math.cos(a) * d; z = bluePlain[1] + Math.sin(a) * d * 0.6; kind = 1; }
    else { x = rq.range(260, 3300); z = rq.range(1480, 3600); }
    if (ringDist(x, z) < 70 || farIn(x, z, 40) || Math.hypot(x - house.x, z - house.z) < 170 || Math.abs(z - roadZ(x)) < 14) continue;
    if (x < 520 && z < 2200 && path.nearestXZ(x, z).dist < 150) continue;
    farFires.push({ x, z, y: heightAt(x, z), r: rq.range(2.5, 6), kind });
  }
  return { W, dome, pits, holes, cones, house, kiln, far, farFires, fields, bluePlain, blue, at, legLen, f, r, heightAt, okSpot, inW, farIn, dRing };
}

// ------------------------------------------------------------------------------------------------ 2. glow on the ground
const RED = [0.366, 0.0152, 0.0109], BLUE = [0.045, 0.133, 0.745], PALE = [0.72, 0.83, 1.0];
export function glowLights(L) {
  const ls = [];
  // a pool of firelight is round at its fire and rayed further out, where the lumps of its rim throw their shadows (`rays`)
  for (const p of L.pits) { const k = p.x > 200 ? 1.5 : 1; ls.push({ x: p.x, z: p.z, r: p.r * 2.7 * k, I: 6, c: p.kind ? BLUE : RED, cut: p.r * 19 * k, rays: 1 }); }   // the far ones are seen from the face: wider pools
  for (const h of L.holes) ls.push({ x: h.x, z: h.z, r: h.r * 4.2, I: 6, c: h.kind ? BLUE : RED, cut: h.r * 30, rays: 1 });
  ls.push({ x: L.dome.x, z: L.dome.z, r: L.dome.r * 1.5, I: 0.9, c: PALE, cut: L.dome.r * 9 });
  ls.push({ x: L.kiln.x, z: L.kiln.z, r: 20, I: 5, c: RED, cut: 300, rays: 1 });
  for (const w of L.far) if (w.glow === 'pit') ls.push({ x: w.pit[0], z: w.pit[1], r: 50, I: 5, c: RED, cut: 700 });
  for (const q of L.farFires) ls.push({ x: q.x, z: q.z, r: q.r * 3.8, I: 5, c: q.kind ? BLUE : RED, cut: q.r * 34 });
  return ls;
}
const rayed = (l, dx, dz, d2) => {
  if (!l.rays) return 1;
  const th = Math.atan2(dz, dx), ph = (l.x * 0.731 + l.z * 0.377) % 6.283;
  const m = Math.max(0.12, 0.6 + 0.3 * Math.sin(3 * th + ph) + 0.26 * Math.sin(7 * th + 2.3 * ph) + 0.16 * Math.sin(13 * th + 4.1 * ph));
  return 1 + (m - 1) * sst(0.3 * l.r * l.r, 2.5 * l.r * l.r, d2);
};
const glowAt = (ls, x, z, out) => {
  let r = 0, g = 0, b = 0;
  for (let i = 0; i < ls.length; i++) {
    const l = ls[i], dx = x - l.x, dz = z - l.z, d2 = dx * dx + dz * dz; if (d2 > l.cut * l.cut) continue;
    const a = l.I / Math.pow(1 + d2 / (l.r * l.r), 1.5) * (1 - d2 / (l.cut * l.cut)) * rayed(l, dx, dz, d2);
    r += l.c[0] * a; g += l.c[1] * a; b += l.c[2] * a;
  }
  out[0] = r; out[1] = g; out[2] = b; return out;
};
export const GLOW_BOX = { x0: -760, z0: 1360, w: 1280, d: 800, nx: 512, nz: 320 };
// the same for the country east and south, coarser (10 m), for the climb to look down on
export const GLOW_FAR = { x0: 200, z0: 1280, w: 3200, d: 2400, nx: 320, nz: 240 };
export async function makeGlowMap(ctx, lights, box = GLOW_BOX) {
  const { x0, z0, w, d, nx, nz } = box, f = new Float32Array(nx * nz * 3);
  const sx = w / nx, sz = d / nz;
  let work = 0;
  // splat each light into the texels it reaches
  for (let k = 0; k < lights.length; k++) {
    const l = lights[k], i0 = Math.max(1, Math.floor((l.x - l.cut - x0) / sx)), i1 = Math.min(nx - 2, Math.ceil((l.x + l.cut - x0) / sx));
    const j0 = Math.max(1, Math.floor((l.z - l.cut - z0) / sz)), j1 = Math.min(nz - 2, Math.ceil((l.z + l.cut - z0) / sz));
    for (let j = j0; j <= j1; j++) {
      for (let i = i0; i <= i1; i++) {
        const dx = x0 + (i + 0.5) * sx - l.x, dz = z0 + (j + 0.5) * sz - l.z, d2 = dx * dx + dz * dz; if (d2 > l.cut * l.cut) continue;
        const a = l.I / Math.pow(1 + d2 / (l.r * l.r), 1.5) * (1 - d2 / (l.cut * l.cut)) * rayed(l, dx, dz, d2), q = (j * nx + i) * 3;
        f[q] += l.c[0] * a; f[q + 1] += l.c[1] * a; f[q + 2] += l.c[2] * a;
      }
      if (((j - j0) & 63) === 63) await ctx.yield();
    }
    // (a wide pool is many texels: breathe after every twelve thousand of them, and after every fourth light)
    work += Math.max(0, i1 - i0 + 1) * Math.max(0, j1 - j0 + 1);
    if (work > 12000 || (k & 3) === 3) { work = 0; await ctx.yield(); }
  }
  const data = new Uint16Array(nx * nz * 4), H = THREE.DataUtils.toHalfFloat;
  for (let j = 0, q = 0, p = 0; j < nz; j++) {
    for (let i = 0; i < nx; i++, q += 3, p += 4) { data[p] = H(Math.min(f[q], 60)); data[p + 1] = H(Math.min(f[q + 1], 60)); data[p + 2] = H(Math.min(f[q + 2], 60)); data[p + 3] = H(1); }
    if ((j & 15) === 15) await ctx.yield();
  }
  const tex = new THREE.DataTexture(data, nx, nz, THREE.RGBAFormat, THREE.HalfFloatType);
  tex.magFilter = tex.minFilter = THREE.LinearFilter; tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping; tex.needsUpdate = true;
  return tex;
}

// POLISH ROUND 1 (P1a). THE FIRELIGHT OF THE COUNTRY AT LARGE. Every fire of the land (pit, fire-hole, far fire, the
// kiln, the throat of each cone) lights the ground round it out to several times its own width: a pool whose half
// light lies at 9 widths of a pit (14 of a hole, 10 of a far fire) and which ends at five times that. Red fires give
// a warm orange-red, blue fires a cold blue. One map for the whole fire country, 10 m to the texel; the ground's
// shader finds the way to the fire from the map's own slope, and lights the relief by it.
const ORANGE = [0.42, 0.06, 0.016], COLD = [0.05, 0.15, 0.7];
export const GLOW_WIDE = { x0: -1100, z0: 1250, w: 4600, d: 2500, nx: 766, nz: 416 };   // (second part: 6 m to the texel, for the small pools)
export function wideLights(L) {
  const ls = [];
  // SECOND PART (G1a): a POOL round each fire and no more, by the fire's own size: half its light at 3.2 radii of a
  // pit and nothing at 14 (a pit of 7 m: 98 m; the greatest, 17 m: 238 m); a fire-hole of 1 to 2 m, half at 7 radii and
  // nothing at 22 (24 to 46 m); a far fire, 3.5 and 16 radii; the kiln 40 m and 180 m; a cone's throat lights its own
  // foot and one radius beyond it. A pit's light grows with its size (a pit of 10 m gives 1.4).
  for (const p of L.pits) ls.push({ x: p.x, z: p.z, r: p.r * 3.2, I: 1.4 * (p.r / 10) ** 1.5, c: p.kind ? COLD : ORANGE, cut: p.r * 14 });
  for (const h of L.holes) ls.push({ x: h.x, z: h.z, r: h.r * 7, I: 0.7, c: h.kind ? COLD : ORANGE, cut: h.r * 22 });
  ls.push({ x: L.kiln.x, z: L.kiln.z, r: 40, I: 2.2, c: ORANGE, cut: 180 });
  for (const q of L.farFires) ls.push({ x: q.x, z: q.z, r: q.r * 3.5, I: 2.2, c: q.kind ? COLD : ORANGE, cut: q.r * 16 });
  for (const c of L.cones) ls.push({ x: c.x, z: c.z, r: c.r * 0.8, I: 0.8, c: ORANGE, cut: c.r * 2 });
  return ls;
}
// the same light at one place, with the way to its fires (for things that stand on the ground): out = [r, g, b, dx, dz]
export function wideAt(ls, x, z, out) {
  let r = 0, g = 0, b = 0, vx = 0, vz = 0;
  for (let i = 0; i < ls.length; i++) {
    const l = ls[i], dx = l.x - x, dz = l.z - z, d2 = dx * dx + dz * dz; if (d2 > l.cut * l.cut) continue;
    const a = l.I / Math.pow(1 + d2 / (l.r * l.r), 1.5) * (1 - d2 / (l.cut * l.cut)), d = Math.sqrt(d2) + 1e-3;
    r += l.c[0] * a; g += l.c[1] * a; b += l.c[2] * a; vx += dx / d * a; vz += dz / d * a;
  }
  const vl = Math.hypot(vx, vz) || 1;
  out[0] = r; out[1] = g; out[2] = b; out[3] = vx / vl; out[4] = vz / vl; return out;
}

// ------------------------------------------------------------------------------------------------ 3. the sky
// smears: [[x, z of the far fire that makes it (m), half width (rad), kind 0 red / 1 blue, strength], ...] (up to five).
// Each is a glow over a place in the world: its bearing is taken from the eye in every frame.
export function buildSky(shared, smears) {
  const sm = [0, 1, 2, 3, 4, 5].map((i) => { const s = smears[i] || [0, 9000, 0.2, 0, 0]; return new THREE.Vector4(s[0], s[1], s[3], s[4]); });
  const uniforms = { ...shared.uniforms, uSmear: { value: sm }, uSmearW: { value: [0, 1, 2, 3, 4, 5].map((i) => (smears[i] ? smears[i][2] : 0.2)) } };
  const mat = new THREE.ShaderMaterial({
    uniforms, side: THREE.BackSide, depthWrite: false, depthTest: false,
    vertexShader: /* glsl */`varying vec3 vD; void main(){ vD = position; vec4 wp = modelMatrix*vec4(position, 1.0); gl_Position = projectionMatrix*viewMatrix*wp; }`,
    fragmentShader: /* glsl */`precision highp float;
      ${NL_GLSL}
      uniform vec4 uSmear[6]; uniform float uSmearW[6];
      varying vec3 vD;
      void main(){
        vec3 d = normalize(vD);
        vec3 col = nlSky(d);
        float az = atan(d.x, -d.z + 1e-6), el = asin(clamp(d.y, -1.0, 1.0));
        vec3 warm = vec3(0.0); float cold = 0.0;
        for (int i = 0; i < 6; i++) {
          float azs = atan(uSmear[i].x - cameraPosition.x, -(uSmear[i].y - cameraPosition.z) + 1e-6);
          float da = mod(az - azs + 3.14159265, 6.2831853) - 3.14159265, w = uSmearW[i];
          float br = 0.78 + 0.22*sin(uTime*0.314 + float(i)*1.9);
          // low and wide, ragged along the top as if seen through moving smoke
          float rag = 0.25 + 1.5*nlN(vec2(az*11.0 + float(i)*7.0, uTime*0.04))*nlN(vec2(az*37.0 - float(i)*3.0, 2.0));
          float g = exp(-da*da/(w*w))*exp(-max(el, 0.0)/(0.01 + 0.026*rag))*smoothstep(-0.03, 0.004, el)*(0.35 + 0.65*rag);
          float a = uSmear[i].w*br*g;
          warm += vec3(0.366, 0.0152, 0.0109)*(a*(1.0 - uSmear[i].z)); cold += a*uSmear[i].z;
        }
        // where the cold light of the blue plain stands, the red of the fields behind it is drowned: no violet between them
        col += warm*(1.0 - clamp(cold*8.0, 0.0, 1.0)) + vec3(0.045, 0.133, 0.745)*cold;
        gl_FragColor = vec4(col, 1.0);
      }`,
  });
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(4800, 48, 24), mat);
  mesh.name = 'night'; mesh.renderOrder = -1; mesh.frustumCulled = false;
  return { mesh, uniforms };
}

// ------------------------------------------------------------------------------------------------ 4. the ground
const GROUND_VS = /* glsl */`
attribute vec3 aGlow;
varying vec3 vW, vN, vGlow;
void main(){
  vN = normal; vGlow = aGlow;
  vec4 wp = modelMatrix*vec4(position, 1.0); vW = wp.xyz;
  gl_Position = projectionMatrix*viewMatrix*wp;
}`;
const GROUND_FS = /* glsl */`
precision highp float;
${NL_GLSL}
uniform sampler2D uGlowMap, uGlowFar, uWin; uniform vec2 uTex; uniform float uWinE; uniform vec4 uGlowBox, uGlowFarBox; uniform vec3 uGate; uniform vec3 uGateCol; uniform float uRoadZ;
uniform sampler2D uGlowWide; uniform vec4 uWideBox; uniform vec4 uFarPit[2]; uniform vec3 uFarPitCol[2];
varying vec3 vW, vN, vGlow;
// POLISH ROUND 1, SECOND PART (G1c). The surface of the cinder country, for its lights to catch: cracked black rock
// and clinker. Plates of slag some 30 m across, each lying at its own height (0 to 5 m), broken from its neighbours
// by a crack with a fallen edge 3 m wide. A rule of the land, the same on every quarter; height in metres.
float cSlag(vec2 p){
  vec2 q = p/30.0, i = floor(q), f = q - i; float d1 = 9.0, d2 = 9.0, h = 0.0;
  for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) {
    vec2 g = vec2(float(x), float(y)), r = g + 0.15 + 0.7*vec2(nlH(i + g), nlH(i + g + 57.3)) - f; float d = dot(r, r);
    if (d < d1) { d2 = d1; d1 = d; h = nlH(i + g + 113.1); } else if (d < d2) { d2 = d; }
  }
  return 5.0*h*h*smoothstep(0.0, 0.22, sqrt(d2) - sqrt(d1));
}
void main(){
  vec3 P = vW; vec3 toEye = cameraPosition - P; float dist = length(toEye); vec3 V = toEye/max(dist, 1e-3);
  vec3 N = normalize(vN + vec3(0.0, 1e-4, 0.0));
  float px = dist*0.0018;                                    // about the size of a pixel on the ground, in metres
  float n1 = nlF(P.xz*0.017), n2 = nlF(P.xz*0.11 + 7.0);
  float kf = 1.0 - smoothstep(0.25, 0.9, px), kff = 1.0 - smoothstep(0.06, 0.22, px);
  float n3 = nlN(P.xz*0.83 + 3.0), n4 = nlN(P.xz*3.9);
  float hgt = n2*0.7 + (n3*0.5*kf + n4*0.22*kff);
  // its slope, by two more samples a pixel (and never less than 0.3 m) aside
  float he = max(0.3, px);
  vec2 hx = P.xz + vec2(he, 0.0), hz = P.xz + vec2(0.0, he);
  vec2 hg = vec2(nlF(hx*0.11 + 7.0)*0.7 + nlN(hx*0.83 + 3.0)*0.5*kf + nlN(hx*3.9)*0.22*kff, nlF(hz*0.11 + 7.0)*0.7 + nlN(hz*0.83 + 3.0)*0.5*kf + nlN(hz*3.9)*0.22*kff);
  hg = (hg - hgt)/he;
  float rd = nlRingD(P.xz), outR = smoothstep(-3.0, 8.0, rd);
  // cinder and crust, pale ash lying in drifts along the wind
  vec3 alb = mix(vec3(0.04, 0.038, 0.042), vec3(0.092, 0.086, 0.086), n1);
  float drift = smoothstep(0.52, 0.78, nlF(vec2(P.x*0.0055 + n1*0.9, P.z*0.033)));
  alb = mix(alb, vec3(0.15, 0.146, 0.152), drift*0.75);
  alb *= 0.74 + 0.5*n2;
  alb *= 1.0 - 0.35*kf*smoothstep(0.55, 0.75, n3) - 0.16*kff*smoothstep(0.6, 0.8, n4);
  // inside the ring the ground is bare and swept: great slabs, jointed
  vec2 sl = P.xz/vec2(36.0, 24.0), slw = fwidth(sl), slf = 0.5 - abs(fract(sl) - 0.5);
  float slj = max(1.0 - smoothstep(0.0, 1.5*slw.x + 0.006, slf.x), 1.0 - smoothstep(0.0, 1.5*slw.y + 0.009, slf.y))*clamp(0.04/(max(slw.x, slw.y) + 0.04), 0.0, 1.0);
  vec3 slab = vec3(0.088, 0.085, 0.09)*(0.86 + 0.16*nlH(floor(sl)) + 0.2*n2)*(1.0 - 0.6*slj);
  // the making and the age of the court. Each great slab is of plates 12 m square with fine joints; it is worn in broad
  // paths and scorched in old patches; pale ash has drifted into the great joints; and it falls away from the house in
  // low steps 44 m apart, each a dark riser under a worn pale edge.
  vec2 s2 = P.xz/12.0, s2w = fwidth(s2), s2f = 0.5 - abs(fract(s2) - 0.5);
  float s2j = max(1.0 - smoothstep(0.0, 1.5*s2w.x + 0.004, s2f.x), 1.0 - smoothstep(0.0, 1.5*s2w.y + 0.004, s2f.y))*clamp(0.03/(max(s2w.x, s2w.y) + 0.03), 0.0, 1.0);
  float wear = nlF(P.xz*0.045 + 31.0), scorch = smoothstep(0.6, 0.78, nlF(P.xz*0.019 + 71.0));
  slab *= (0.72 + 0.6*wear)*(1.0 - 0.3*s2j)*(1.0 - 0.6*scorch)*(0.92 + 0.16*nlH(floor(s2) + 5.0));
  float jd = min(slf.x*36.0, slf.y*24.0);
  float ashJ = (1.0 - smoothstep(0.1, 0.7 + 2.2*n3, jd))*smoothstep(0.28, 0.6, n2)*kf;
  slab = mix(slab, vec3(0.2, 0.196, 0.19)*(0.8 + 0.3*n4), 0.6*ashJ);
  float km = (fract((P.z - 1222.0)/44.0 + 0.5) - 0.5)*44.0, kw = fwidth(P.z), kk = clamp(0.3/(kw + 0.3), 0.0, 1.0)*step(1200.0, P.z)*step(abs(P.x - uGate.x), 1150.0)*smoothstep(9.4, 10.5, abs(P.x - uGate.x));
  float riser = smoothstep(-kw, 0.0, km)*(1.0 - smoothstep(0.45, 0.5 + kw, km))*kk;
  float worn = smoothstep(-0.4 - kw, -0.4, km)*(1.0 - smoothstep(0.0, kw + 0.02, km))*kk;
  slab = slab*(1.0 - 0.75*riser)*(1.0 + 0.9*worn)*(0.9 + 0.2*nlH(vec2(floor((P.z - 1222.0)/44.0 + 0.5), 3.0)));
  alb = mix(slab, alb, outR);
  // the pale road, worn at its edges, jointed
  float rz = uRoadZ + 7.0*sin(P.x/210.0 + 0.6) + 3.0*sin(P.x/67.0);
  float road = (1.0 - smoothstep(4.6, 6.4 + n2*1.6, abs(P.z - rz)))*outR;
  float jw = fwidth(P.x/9.0), jf = 0.5 - abs(fract(P.x/9.0 + 0.3*n1) - 0.5);
  float joint = (1.0 - smoothstep(0.0, 1.5*jw + 0.012, jf))*clamp(0.05/(jw + 0.05), 0.0, 1.0);
  alb = mix(alb, vec3(0.25, 0.25, 0.27)*(0.8 + 0.35*n2)*(1.0 - 0.45*joint), road*(0.75 + 0.25*n3));
  // the causeway from the gate to the ring
  float cw = (1.0 - smoothstep(8.5, 9.4, abs(P.x - uGate.x)))*(1.0 - outR)*step(P.z, 1425.0)*step(1199.0, P.z);
  float cj = 0.5 - abs(fract(P.z/8.0) - 0.5), cjw = fwidth(P.z/8.0);
  alb = mix(alb, vec3(0.3, 0.3, 0.31)*(0.88 + 0.2*n2)*(1.0 - 0.4*(1.0 - smoothstep(0.0, 1.5*cjw + 0.012, cj))*clamp(0.05/(cjw + 0.05), 0.0, 1.0)), cw);
  // relief from the same noises
  float bk = (1.0 - smoothstep(0.3, 1.2, px))*mix(0.35, 1.0, outR)*(1.0 - 0.7*road)*(1.0 - 0.8*cw);
  vec3 Nb = normalize(N - vec3(hg.x, 0.0, hg.y)*(0.55*bk));
  // A black land: outside the ring the amber of the face lights only what turns toward it more than level ground does
  // (the lee of a drift, the lip of a hollow, a stone's edge); inside the ring the swept slabs take it whole.
  vec3 Lk = normalize(uKeyAt - P);
  float tip = smoothstep(0.02, 0.3, dot(Nb, Lk) - 0.92*Lk.y);
  // (the swept ground also takes the glow that hangs in the air before the face: paler than the key, and from all sides)
  vec3 col = alb*(uAmb + vec3(0.004, 0.0045, 0.007) + vec3(0.03, 0.0075, 0.006)*outR + vec3(0.17, 0.15, 0.118)*(1.0 - outR) + uKeyCol*(nlKeyFall(P)*0.42*mix(3.4*max(dot(Nb, Lk), 0.0), 2.8*tip, outR*(1.0 - 0.85*road)))) + nlPales(P, Nb, V, alb, 0.0);
  // the fires and the dome
  vec2 guv = (P.xz - uGlowBox.xy)*uGlowBox.zw;
  float gm = smoothstep(0.0, 0.03, guv.x)*smoothstep(0.0, 0.05, guv.y)*(1.0 - smoothstep(0.97, 1.0, guv.x))*(1.0 - smoothstep(0.95, 1.0, guv.y));
  vec2 fuv = (P.xz - uGlowFarBox.xy)*uGlowFarBox.zw;
  float fm = smoothstep(0.0, 0.03, fuv.x)*smoothstep(0.0, 0.03, fuv.y)*(1.0 - smoothstep(0.97, 1.0, fuv.x))*(1.0 - smoothstep(0.97, 1.0, fuv.y));
  vec3 glow = mix(mix(vGlow, texture2D(uGlowFar, clamp(fuv, 0.0, 1.0)).rgb, fm), texture2D(uGlowMap, clamp(guv, 0.0, 1.0)).rgb, gm);
  float flick = 0.84 + 0.32*nlN(vec2(uTime*1.7 + P.x*0.021, P.z*0.021 - uTime*0.4));
  // no fire burns inside the ring, and its swept ground belongs to the windows' light: the red dies 70 m inside the line
  glow *= smoothstep(-70.0, 0.0, rd);
  col += (alb*(0.55 + 0.45*max(Nb.y, 0.0)) + 0.006)*glow*mix(1.0, flick, step(glow.b*2.0, glow.r + 0.001));
  // the ring's clear light, the gate's light down the causeway
  vec2 rg = nlRingN(P.xz);
  float rl = 1.0/(1.0 + rd*rd/45.0), rface = 0.45 + 0.55*clamp(dot(Nb, normalize(vec3(-rg.x*rd, 0.8, -rg.y*rd)))*1.6 - 0.2, 0.0, 1.5);
  col += (alb + 0.005)*uRingCol*(2.8*rl*rface*nlRingPulse(P.xz));
  float gz = max(P.z - 1200.0, 0.0), gx = abs(P.x - uGate.x);
  // the door's light lies long over the slabs; the files of the host stand 12 m either side of the causeway's middle, a
  // man every three quarters of a metre, and each throws his shadow outward from the door, a quarter as long as he is far from it
  float sR = max(gx/12.0, 0.2), zc = gz/sR, zcw = fwidth(zc/0.75);
  float stripe = mix(1.0 - smoothstep(0.2, 0.34, abs(fract((zc - 16.0)/0.75 + 0.5) - 0.5)), 0.5, clamp(zcw*1.5, 0.0, 1.0));
  float shade = smoothstep(1.0, 1.03, sR)*(1.0 - smoothstep(1.16, 1.3, sR))*stripe*step(16.0, zc)*step(zc, 209.0);
  col += alb*uGateCol*(exp(-gx/(6.0 + 0.17*gz))/(1.0 + gz/120.0)*step(1199.0, P.z)*(1.0 - 0.8*shade));
  // the light of the wall glancing off the ground at a low angle: a dull sheen with no image in it, a little more on the
  // swept slabs, the road and the causeway, broken on the cinder (the clouds of light on the face are taken from its
  // window texture, far down its mip chain)
  vec3 R = reflect(-V, normalize(mix(N, Nb, 0.3)));
  float den = R.z + 0.325*R.y, tR = (1200.0 - 0.325*P.y - P.z)/min(den, -1e-3);
  vec3 Hp = P + R*tR;
  float onFace = step(den, -0.01)*step(0.0, Hp.y)*smoothstep(0.0, 60.0, 1200.0 - 0.325*Hp.y - abs(Hp.x))*step(1200.0, P.z);
  // the slabs are dry: only the clouds of light on the face show in them, as a dull sheen (four taps of the window texture
  // half a texel apart, far down its mip chain, so that no block of it shows)
  vec2 wuv = vec2((Hp.x + 1200.0)/4.0, Hp.y/6.0);
  float wlod = 5.8 + 0.6*outR;
  vec2 wo = 0.5*exp2(wlod)/uTex;
  vec4 tw = 0.25*(textureLod(uWin, wuv/uTex + wo, wlod) + textureLod(uWin, wuv/uTex - wo, wlod) + textureLod(uWin, wuv/uTex + vec2(wo.x, -wo.y), wlod) + textureLod(uWin, wuv/uTex + vec2(-wo.x, wo.y), wlod));
  float wallL = 0.5*(tw.r + tw.g)*0.1733*nlHeightDim(Hp.y)*uWinE*smoothstep(8.0, 30.0, Hp.y);
  float fres = 1.0 - max(dot(Nb, V), 0.0); fres = fres*fres; fres = 0.03 + 0.97*fres*fres*(1.0 - max(dot(Nb, V), 0.0));
  float gloss = mix(0.22, 0.16 + 0.22*n2, outR)*(1.0 + 0.8*road)*(1.0 + 0.35*cw);
  col += vec3(0.6, 0.48, 0.33)*(wallL*fres*gloss*onFace*1.0);
  vec3 Ls = normalize(uKeyAt - P);
  float sp = max(dot(R, Ls), 0.0); sp = sp*sp*sp; sp = sp*sp;
  col += uKeyCol*sp*nlKeyFall(P)*mix(0.02, 0.022, outR)*(0.35 + 0.65*n2);
  // ================= POLISH ROUND 1 (P1, P2): the country's own lights on its ground. All of it is added to what
  // the ground showed before; all of it lies outside the ring; none of it knows where the eye is but for its air.
  // (second part: the slag's plates are bent a little out of true, the same for every tap)
  vec2 Pw = P.xz + 9.0*vec2(nlN(P.xz*0.021 + 5.0), nlN(P.xz*0.021 + 41.0));
  float fpx = max(length(dFdx(P.xz)), length(dFdy(P.xz)));       // the true footprint of a pixel on the ground, in metres
  float h0 = cSlag(Pw), rk = outR*(1.0 - 0.7*road)*(1.0 - smoothstep(3.0, 12.0, fpx));        // ANTIALIASING: a broken edge is 3 m wide; under a wider pixel it is drawn softer
  // (the plates' own tilt carries the light; of the ground's fine grain only three parts in ten, so nothing ripples)
  vec3 Nr = normalize(normalize(mix(vec3(0.0, 1.0, 0.0), Nb, 0.3)) - vec3(cSlag(Pw + vec2(1.5, 0.0)) - h0, 0.0, cSlag(Pw + vec2(0.0, 1.5)) - h0)*(rk/1.5));
  // (a) the firelight: the pool's colour and strength from the wide map, the way to the fire from the map's slope;
  // what turns toward the fire is lit, what lies behind a broken edge from it (the fires are low: nine degrees) is in
  // shadow. SECOND PART (G1a, G1b): the map holds a pool round each fire and nothing between the pools
  vec2 quv = (P.xz - uWideBox.xy)*uWideBox.zw, qo = 6.0*uWideBox.zw;
  float qm = smoothstep(0.0, 0.03, quv.x)*smoothstep(0.0, 0.03, quv.y)*(1.0 - smoothstep(0.97, 1.0, quv.x))*(1.0 - smoothstep(0.97, 1.0, quv.y));
  vec3 wg0 = texture2D(uGlowWide, clamp(quv, 0.0, 1.0)).rgb;
  float wl0 = wg0.r + wg0.g + wg0.b;
  // (a pool, not a wash: where the light of all the fires together is thin it is thinner still)
  vec3 wg = wg0*(qm*outR*wl0/(wl0 + 0.1));
  vec2 Ld = normalize(vec2(dot(texture2D(uGlowWide, clamp(quv + vec2(qo.x, 0.0), 0.0, 1.0)).rgb, vec3(1.0)) - wl0, dot(texture2D(uGlowWide, clamp(quv + vec2(0.0, qo.y), 0.0, 1.0)).rgb, vec3(1.0)) - wl0) + vec2(1e-6, 0.0));
  float tanF = 0.16;
  float shF = 1.0 - rk*smoothstep(0.0, 1.5, max(cSlag(Pw + Ld*8.0) - h0 - 8.0*tanF, cSlag(Pw + Ld*20.0) - h0 - 20.0*tanF));
  vec3 albL = alb + 0.008;
  vec3 ext = albL*wg*((0.1 + 3.6*max(dot(Nr, normalize(vec3(Ld.x, tanF, Ld.y))), 0.0)*shF)*mix(1.0, flick, 0.5*step(wg.b*2.0, wg.r + 0.001)));
  // (g) the far Watchers' fires, on whatever quarter each stands: a pool like the others (second part: half its light
  // at uFarPit.z, nothing from five times that)
  for (int i = 0; i < 2; i++) {
    vec2 dv = uFarPit[i].xy - P.xz; float d2 = dot(dv, dv), R = uFarPit[i].z;
    float fa = uFarPit[i].w/(1.0 + d2/(R*R))*(1.0 - smoothstep(2.5*R, 5.0*R, sqrt(d2)));
    vec2 Lf = dv*inversesqrt(d2 + 1.0);
    ext += albL*uFarPitCol[i]*(fa*(0.1 + 3.6*max(dot(Nr, normalize(vec3(Lf.x, tanF, Lf.y))), 0.0)));
  }
  // (e) the house's own light on the ground. SECOND PART (G1d, G1e): it lies before each face, strongest at the ring
  // (the foot), a third at 90 m outside it and gone at 380 m; beyond that the house gives the land no lit surface,
  // only a faint edge on what stands up square to it (a broken edge of slag turned to the house)
  float hd = max(rd, 0.0), houseN = outR*(1.0 - smoothstep(0.0, 380.0, hd)), houseL = outR/(1.0 + hd/500.0 + hd*hd/(1500.0*1500.0));
  ext += alb*uKeyCol*(0.4*houseN*houseN/(1.0 + hd/90.0)*(0.25 + 2.2*max(dot(Nr, normalize(vec3(-rg.x, 0.75, -rg.y))) - 0.35, 0.0)));
  ext += alb*uKeyCol*(0.3*houseL*rk*max(dot(Nr, normalize(vec3(-rg.x, 0.2, -rg.y))) - 0.32, 0.0));
  // (c) low shining mist in the hollows of that relief: a few broad sheets, uneven, drifting a metre a second; the
  // house's warmth keeps it off: none within 100 m of the ring, all of it from 450 m out. (Second part: thin and cold.)
  vec2 mq = P.xz + vec2(uTime*1.1, uTime*0.4);
  float mist = (1.0 - 0.8*smoothstep(0.4, 3.0, h0))*smoothstep(0.48, 0.62, nlF(mq*0.0027 + 40.0))*(0.6 + 0.4*nlN(mq*0.017 + 9.0))*outR*smoothstep(100.0, 450.0, rd);
  ext += (vec3(0.016, 0.029, 0.032) + 0.04*wg)*mist;
  // (b) the road is pale stone and holds a little light of its own across the whole country
  ext += vec3(0.014, 0.0145, 0.017)*(road*(0.7 + 0.5*n2));
  // these lights carry through the night's air further than the dark ground does: half its density
  gl_FragColor = vec4(nlFog(col, P) + ext*(1.0 - nlFogAmount(P, uFog.x*0.5)), 1.0);
}`;
function gridLines(a, b, step, lo, hi, grow) {
  const arr = []; for (let v = a; v <= b + 1e-6; v += step) arr.push(v);
  let s = step, v = a; while (v > lo) { s *= grow; v -= s; arr.unshift(v); }
  s = step; v = arr[arr.length - 1]; while (v < hi) { s *= grow; v += s; arr.push(v); }
  return arr;
}
export async function buildGround(ctx, shared, L, lights, glowMap, hu, glowFar, wide) {
  const xs = gridLines(-480, 180, 4.5, -4700, 4700, 1.17);
  // z: fine across the low flight, 8 m over the swept ground inside the ring, coarse beyond both ways
  const zs = gridLines(1376, 2030, 4.5, 1200, 5600, 1.17).filter((z) => z >= 1200);
  { const first = zs[0]; const add = []; for (let z = 1200; z < first - 4; z += 8) add.push(z); let s = 8, v = 1200; const lo = []; while (v > -4700) { s *= 1.25; v -= s; lo.unshift(v); } zs.unshift(...lo, ...add); }
  const nx = xs.length, nz = zs.length, pos = new Float32Array(nx * nz * 3), nrm = new Float32Array(nx * nz * 3), glow = new Float32Array(nx * nz * 3), g3 = [0, 0, 0];
  for (let j = 0; j < nz; j++) {
    for (let i = 0; i < nx; i++) {
      const q = (j * nx + i) * 3, x = xs[i], z = zs[j];
      pos[q] = x; pos[q + 1] = L.heightAt(x, z); pos[q + 2] = z;
      glowAt(lights, x, z, g3); glow[q] = g3[0]; glow[q + 1] = g3[1]; glow[q + 2] = g3[2];
    }
    if ((j & 1) === 1) await ctx.yield();
  }
  for (let j = 0; j < nz; j++) {
    const j0 = Math.max(0, j - 1), j1 = Math.min(nz - 1, j + 1);
    for (let i = 0; i < nx; i++) {
      const i0 = Math.max(0, i - 1), i1 = Math.min(nx - 1, i + 1), q = (j * nx + i) * 3;
      const dx = (pos[(j * nx + i1) * 3 + 1] - pos[(j * nx + i0) * 3 + 1]) / (xs[i1] - xs[i0]), dz = (pos[(j1 * nx + i) * 3 + 1] - pos[(j0 * nx + i) * 3 + 1]) / (zs[j1] - zs[j0]);
      const l = 1 / Math.hypot(dx, 1, dz); nrm[q] = -dx * l; nrm[q + 1] = l; nrm[q + 2] = -dz * l;
    }
    if ((j & 31) === 31) await ctx.yield();
  }
  const idx = [], inBase = (x, z) => Math.abs(x) < PYR.half - 20 && Math.abs(z) < PYR.half - 20;
  for (let j = 0; j < nz - 1; j++) for (let i = 0; i < nx - 1; i++) {
    if (inBase(xs[i], zs[j]) && inBase(xs[i + 1], zs[j + 1])) continue;
    const a = j * nx + i, b = a + 1, c = a + nx, d = c + 1;
    idx.push(a, c, b, b, c, d);
  }
  await ctx.yield();
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('normal', new THREE.BufferAttribute(nrm, 3)); geo.setAttribute('aGlow', new THREE.BufferAttribute(glow, 3));
  geo.setIndex(idx); geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 500), 7500);
  const uniforms = { ...shared.uniforms, uWin: hu.uWin, uTex: hu.uTex, uWinE: hu.uWinE, uGlowMap: { value: glowMap }, uGlowBox: { value: new THREE.Vector4(GLOW_BOX.x0, GLOW_BOX.z0, 1 / GLOW_BOX.w, 1 / GLOW_BOX.d) },
    uGlowFar: { value: glowFar }, uGlowFarBox: { value: new THREE.Vector4(GLOW_FAR.x0, GLOW_FAR.z0, 1 / GLOW_FAR.w, 1 / GLOW_FAR.d) },
    uGate: { value: new THREE.Vector3(GATE.x, GATE.w / 2, GATE.h) }, uGateCol: { value: new THREE.Color(1.0, 0.85, 0.62).multiplyScalar(1.3) }, uRoadZ: { value: ROAD_Z },
    // polish round 1: the wide firelight; the far Watchers' fires (x, z, half-light distance, strength) and colours
    uGlowWide: { value: wide.tex }, uWideBox: { value: new THREE.Vector4(GLOW_WIDE.x0, GLOW_WIDE.z0, 1 / GLOW_WIDE.w, 1 / GLOW_WIDE.d) },
    uFarPit: { value: L.far.map((w) => (w.glow === 'pit' ? new THREE.Vector4(w.pit[0], w.pit[1], 60, 2.2) : new THREE.Vector4(w.x + w.f[0] * w.tall * 0.55, w.z + w.f[1] * w.tall * 0.55, 50, 0.9))) },
    uFarPitCol: { value: L.far.map((w) => new THREE.Color(...(w.glow === 'pit' ? ORANGE : [0.3, 0.42, 0.7]))) } };
  const mesh = new THREE.Mesh(geo, new THREE.ShaderMaterial({ uniforms, vertexShader: GROUND_VS, fragmentShader: GROUND_FS }));
  mesh.name = 'plain';
  return { mesh, uniforms, triangles: idx.length / 3 };
}

// ------------------------------------------------------------------------------------------------ 5. the ring and the dome
export function ringPoints(step = 10) {
  const pts = [], H = PYR.half, R = RING_OUT;
  const side = (ax, az, bx, bz) => { const n = Math.round(Math.hypot(bx - ax, bz - az) / step); for (let i = 0; i < n; i++) pts.push([ax + (bx - ax) * i / n, az + (bz - az) * i / n]); };
  const arc = (cx, cz, a0) => { const n = Math.round(R * Math.PI / 2 / step); for (let i = 0; i < n; i++) { const a = a0 + (Math.PI / 2) * i / n; pts.push([cx + Math.cos(a) * R, cz + Math.sin(a) * R]); } };
  // round the base, starting up the east side: east, south-east corner, south (ours), south-west corner, west, north
  side(H + R, -H, H + R, H); arc(H, H, 0); side(H, H + R, -H, H + R); arc(-H, H, Math.PI / 2); side(-H - R, H, -H - R, -H); arc(-H, -H, Math.PI); side(-H, -H - R, H, -H - R); arc(H, -H, Math.PI * 1.5);
  return pts;
}
// The ring: a tube of clear light, 0.6 m through, lying half a metre over the ground. It is drawn as a ribbon that turns
// to the eye. Far off, where it would be thinner than a pixel and a half, it is kept that wide and dimmed by the square
// root of what it was widened, so that it stays a line from the entry and never a band. It never reaches white: what it
// gives is on the ground beside it (the ground's own shader) and on whatever stands near (nlRing).
export function buildRing(ctx, shared, L) {
  const pts = ringPoints(10), n = pts.length, pos = [], tan = [], uv = [], idx = [];
  for (let i = 0; i <= n; i++) {
    const p = pts[i % n], q = pts[(i + 1) % n], o = pts[(i - 1 + n) % n];
    const tx = q[0] - o[0], tz = q[1] - o[1], tl = Math.hypot(tx, tz) || 1, y = L.heightAt(p[0], p[1]) + 0.5;
    for (const s of [-1, 1]) { pos.push(p[0], y, p[1]); tan.push(tx / tl, 0, tz / tl); uv.push(i / n, s); }
    if (i < n) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('aTan', new THREE.Float32BufferAttribute(tan, 3));
  geo.setAttribute('aUv', new THREE.Float32BufferAttribute(uv, 2)); geo.setIndex(idx);
  geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), 2400);
  const uniforms = { ...shared.uniforms, uRes: { value: new THREE.Vector2(800, 450) } };
  const mat = new THREE.ShaderMaterial({
    uniforms, transparent: true, depthWrite: false, side: THREE.DoubleSide,
    vertexShader: /* glsl */`
      attribute vec3 aTan; attribute vec2 aUv;
      uniform vec2 uRes;
      varying vec3 vW; varying vec2 vUv; varying float vWide;
      void main(){
        vec3 p = position; vUv = aUv;
        vec3 toE = cameraPosition - p; float dist = length(toE);
        float pix = dist*2.0*0.6249/uRes.y;                       // metres per pixel at this distance (fov 64)
        vec3 side = normalize(cross(aTan, toE/max(dist, 1e-3)) + vec3(0.0, 1e-4, 0.0));
        float hw = max(0.3, 0.75*pix); vWide = 0.3/hw;
        p += side*aUv.y*hw;
        vW = p;
        gl_Position = projectionMatrix*viewMatrix*vec4(p, 1.0);
      }`,
    fragmentShader: /* glsl */`precision highp float;
      ${NL_GLSL}
      varying vec3 vW; varying vec2 vUv; varying float vWide;
      void main(){
        float t = clamp(abs(vUv.y), 0.0, 1.0);
        float a = (1.0 - smoothstep(0.55, 1.0, t))*sqrt(clamp(vWide, 0.0, 1.0));
        vec3 col = uRingCol*(0.6*(0.72 + 0.28*(1.0 - t*t))*nlRingPulse(vW.xz));         // a round tube: brighter along its middle
        gl_FragColor = vec4(nlFog(col, vW), a);
      }`,
  });
  const mesh = new THREE.Mesh(geo, mat); mesh.name = 'ring'; mesh.renderOrder = 2;
  return { mesh, uniforms, triangles: idx.length / 3 };
}
// The dome of light that rose from the ground before the great Watcher: light standing in the air, with no surface and
// no base line. It is a density of light, densest low at its heart, thinning outward and upward to nothing over some
// eighty metres, in soft uneven layers that rise and drift. What reaches the eye is that density summed along its line of
// sight (twelve steps), so there is no edge to see; and the light within 40 m of the eye's place is not counted (thin
// air lit close to the eye is not seen as a thing), so it is never a pane near us: we fly through brightening air.
// The mesh only bounds the sum: a cap of 2.5 radii closed underneath by a sheet lying on the ground; an eye outside it
// sums from its near side, an eye inside it to its far side.
export function buildDome(ctx, shared, L) {
  const d = L.dome, RB = d.r * 2.5, pos = [], idx = [];
  const NS = 40, NR = 12, NC = 12;
  // the cap, from its top down to a little under the heart's level
  for (let j = 0; j <= NC; j++) { const ph = (Math.PI / 2 + 0.14) * j / NC; for (let i = 0; i < NS; i++) { const a = 6.2832 * i / NS; pos.push(d.x + RB * Math.sin(ph) * Math.cos(a), d.y + RB * Math.cos(ph), d.z + RB * Math.sin(ph) * Math.sin(a)); } }
  for (let j = 0; j < NC; j++) for (let i = 0; i < NS; i++) { const p = j * NS + i, q = j * NS + (i + 1) % NS; idx.push(p, q, p + NS, q, q + NS, p + NS); }
  // the sheet on the ground under it (a metre and a half over the land, out past the cap's foot), facing down
  const base = pos.length / 3;
  for (let j = 0; j <= NR; j++) { const r = RB * 1.12 * j / NR; for (let i = 0; i < NS; i++) { const a = 6.2832 * i / NS, x = d.x + r * Math.cos(a), z = d.z + r * Math.sin(a); pos.push(x, L.heightAt(x, z) + 1.5, z); } }
  for (let j = 0; j < NR; j++) for (let i = 0; i < NS; i++) { const p = base + j * NS + i, q = base + j * NS + (i + 1) % NS; idx.push(p, p + NS, q, q, p + NS, q + NS); }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setIndex(idx);
  geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(d.x, d.y, d.z), RB * 1.2);
  const uniforms = { ...shared.uniforms, uDomeC: { value: new THREE.Vector4(d.x, d.y, d.z, d.r) } };
  const mat = new THREE.ShaderMaterial({
    uniforms, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    vertexShader: /* glsl */`varying vec3 vW; void main(){ vW = position; gl_Position = projectionMatrix*viewMatrix*vec4(position, 1.0); }`,
    fragmentShader: /* glsl */`precision highp float;
      ${NL_GLSL}
      uniform vec4 uDomeC; varying vec3 vW;
      float domeDens(vec3 p){
        float R = uDomeC.w, r2 = dot(p.xz, p.xz), y = max(p.y, 0.0);
        float body = exp(-r2/(0.5*R*R) - y/(0.36*R));
        float halo = 0.08*exp(-(r2 + 4.0*y*y)/(2.2*R*R));
        float lay = 0.45 + 0.95*nlN3(vec3(p.xz*0.045 + vec2(uTime*0.05, 0.0), p.y*0.17 - uTime*0.22));
        float edge = 1.0 - smoothstep(0.6, 1.0, length(p)/(2.5*R));
        return (body + halo)*lay*edge;
      }
      void main(){
        float RB = 2.5*uDomeC.w;
        vec3 ro = cameraPosition - uDomeC.xyz, rv = vW - cameraPosition; float far = length(rv); vec3 rd = rv/max(far, 1e-3);
        bool inside = dot(ro, ro) < RB*RB;
        if (gl_FrontFacing == inside) discard;
        float b = dot(ro, rd), c = dot(ro, ro) - RB*RB, sq = sqrt(max(b*b - c, 0.0));
        float t0 = max(-b - sq, 0.0), t1 = -b + sq;
        if (inside) t1 = min(t1, far);
        else if (rd.y < -1e-4) t1 = min(t1, -ro.y/rd.y);                    // the land ends the line of sight
        float dt = max(t1 - t0, 0.0)/12.0, tau = 0.0;
        for (int i = 0; i < 12; i++) {
          float t = t0 + (float(i) + 0.5)*dt;
          tau += domeDens(ro + rd*t)*smoothstep(8.0, 40.0, t);
        }
        tau *= dt;
        float breath = 0.9 + 0.1*sin(uTime*0.45);
        vec3 col = vec3(0.72, 0.83, 1.0)*(0.4*breath*(1.0 - exp(-tau*0.03)));
        gl_FragColor = vec4(col*(1.0 - nlFogAmount(uDomeC.xyz, uFog.x*0.6)), 1.0);
      }`,
  });
  const mesh = new THREE.Mesh(geo, mat); mesh.name = 'dome'; mesh.renderOrder = 2;
  return { mesh, uniforms, triangles: idx.length / 3 };
}


// ------------------------------------------------------------------------------------------------ 6. fires
// Pits and holes: a glowing floor, flames as upright cards that turn to the eye, smoke, sparks, a haze of their own colour.
// Deep red (or, on a blue-field visit, low blue fire): never amber, which belongs to the windows.
export async function buildFires(ctx, shared, L, fx, time, opts = {}) {
  const S = opts.streams, rng = S.fires, group = new THREE.Group(); group.name = 'fires';
  const all = [...L.pits.map((p) => ({ ...p, pit: 1 })), ...L.holes.map((h) => ({ ...h, pit: 0 })), { x: L.kiln.x, z: L.kiln.z, y: L.kiln.y, r: 9, kind: 0, pit: 1, kiln: 1 }];
  // ---- floors
  {
    const g0 = new THREE.CircleGeometry(1, 14).rotateX(-Math.PI / 2), g = new THREE.InstancedBufferGeometry();
    g.index = g0.index; g.setAttribute('position', g0.attributes.position);
    const a = new Float32Array(all.length * 4), b = new Float32Array(all.length * 2);
    all.forEach((f, i) => { a.set([f.x, f.y + (f.pit ? 1.25 : 0.25), f.z, f.pit ? f.r * 0.52 : f.r * 0.8], i * 4); b.set([f.kind, rng()], i * 2); });
    g.setAttribute('aAt', new THREE.InstancedBufferAttribute(a, 4)); g.setAttribute('aK', new THREE.InstancedBufferAttribute(b, 2));
    g.instanceCount = all.length; g.boundingSphere = new THREE.Sphere(new THREE.Vector3(600, 0, 1900), 2600);
    const mat = new THREE.ShaderMaterial({
      uniforms: { ...shared.uniforms },
      vertexShader: /* glsl */`attribute vec4 aAt; attribute vec2 aK; varying vec2 vP; varying vec2 vK; varying vec3 vW;
        void main(){ vP = position.xz; vK = aK; vW = aAt.xyz + position*aAt.w; gl_Position = projectionMatrix*viewMatrix*vec4(vW, 1.0); }`,
      fragmentShader: /* glsl */`precision highp float;
        ${NL_GLSL}
        varying vec2 vP; varying vec2 vK; varying vec3 vW;
        void main(){
          float r = length(vP), s = vK.y*37.0;
          float n = nlF(vP*2.6 + s + vec2(0.0, uTime*0.07)), n2 = nlN(vP*7.0 - s + vec2(uTime*0.25, 0.0));
          float crust = smoothstep(0.42, 0.62, n);                         // dark plates on a bed of fire
          float heat = (1.0 - 0.75*crust)*(0.55 + 0.6*n2)*(1.0 - 0.6*r*r)*(0.85 + 0.15*sin(uTime*1.3 + s));
          vec3 c = mix(vec3(0.62, 0.028, 0.018), vec3(0.06, 0.17, 0.9), vK.x)*(1.9*heat);
          c += mix(vec3(0.5, 0.06, 0.02), vec3(0.2, 0.3, 0.6), vK.x)*pow(max(heat - 0.55, 0.0), 2.0)*3.0;
          gl_FragColor = vec4(nlFog(c, vW), 1.0);
        }`,
    });
    const m = new THREE.Mesh(g, mat); m.name = 'fire-floors'; group.add(m);
  }
  await ctx.yield();
  // ---- flames
  const fl = [];
  for (const f of all) {
    if (f.pit) {
      const n = Math.round(6 + f.r * 0.55);
      for (let i = 0; i < n; i++) { const a = rng() * 6.283, d = f.r * 0.5 * Math.sqrt(rng()), w = rng.range(0.22, 0.4) * f.r; fl.push(f.x + Math.cos(a) * d, f.y + 0.6, f.z + Math.sin(a) * d, w, w * rng.range(1.7, 3.3) * (f.kind ? 0.55 : 1), rng(), f.kind, 0); }
      for (let i = 0; i < 2; i++) fl.push(f.x + rng.range(-0.2, 0.2) * f.r, f.y + 1, f.z + rng.range(-0.2, 0.2) * f.r, f.r * 0.9, f.r * rng.range(2.6, 3.6), rng(), f.kind, 1);     // the heat over it
    } else {
      for (let i = 0; i < 2; i++) { const w = rng.range(0.55, 0.9) * f.r; fl.push(f.x + rng.range(-0.3, 0.3) * f.r, f.y, f.z + rng.range(-0.3, 0.3) * f.r, w, w * rng.range(2.0, 3.6) * (f.kind ? 0.6 : 1), rng(), f.kind, 0); }
    }
  }
  {
    const g = new THREE.InstancedBufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute([-1, 0, 0, 1, 0, 0, 1, 1, 0, -1, 1, 0], 3)); g.setIndex([0, 1, 2, 0, 2, 3]);
    const ib = new THREE.InstancedInterleavedBuffer(new Float32Array(fl), 8);
    g.setAttribute('aAt', new THREE.InterleavedBufferAttribute(ib, 4, 0)); g.setAttribute('aF', new THREE.InterleavedBufferAttribute(ib, 4, 4));
    g.instanceCount = fl.length / 8; g.boundingSphere = new THREE.Sphere(new THREE.Vector3(600, 0, 1900), 2600);
    const mat = new THREE.ShaderMaterial({
      uniforms: { ...shared.uniforms }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
      vertexShader: /* glsl */`
        uniform float uTime;
        attribute vec4 aAt; attribute vec4 aF;                // base and half width; height, seed, kind (0 red, 1 blue), heat wisp
        varying vec2 vQ; varying vec4 vF; varying vec3 vW;
        void main(){
          vec3 base = aAt.xyz; vec3 toE = cameraPosition - base; toE.y = 0.0;
          vec3 right = normalize(vec3(toE.z, 0.0, -toE.x) + vec3(1e-4, 0.0, 0.0));
          float y = position.y, s = aF.y*61.0;
          float sway = (sin(uTime*(1.7 + aF.y) + s) + 0.6*sin(uTime*3.1 + s*1.7))*0.16*y*y;
          vec3 p = base + right*(position.x + sway)*aAt.w + vec3(0.0, y*aF.x, 0.0);
          p.x -= y*y*aF.x*0.22;                                // the wind leans everything west
          vQ = vec2(position.x, y); vF = aF; vW = p;
          gl_Position = projectionMatrix*viewMatrix*vec4(p, 1.0);
        }`,
      fragmentShader: /* glsl */`precision highp float;
        ${NL_GLSL}
        varying vec2 vQ; varying vec4 vF; varying vec3 vW;
        void main(){
          float x = vQ.x, y = clamp(vQ.y, 0.0, 1.0), s = vF.y*53.0;
          float n = nlF(vec2(x*1.3 + s, y*2.1 - uTime*(1.5 + 0.8*vF.y))), n2 = nlN(vec2(x*3.1 - s, y*5.0 - uTime*3.4));
          float wdt = pow(max(1.0 - y, 0.0), 0.6)*(0.42 + 0.7*n);
          float hi = max(wdt, 1e-3);
          float body = (1.0 - smoothstep(hi*0.35, hi, abs(x + 0.25*(n2 - 0.5)*y)))*smoothstep(0.0, 0.07, y);
          float tongue = smoothstep(0.3, 0.7, n + 0.55*(1.0 - y) - 0.25)*body;
          float core = tongue*(1.0 - smoothstep(0.0, 0.55, y))*(1.0 - smoothstep(0.0, 0.6, abs(x)));
          vec3 cA = mix(vec3(0.62, 0.028, 0.018), vec3(0.05, 0.16, 0.85), vF.z), cB = mix(vec3(0.75, 0.1, 0.035), vec3(0.3, 0.42, 0.9), vF.z);
          vec3 c = cA*(0.8*tongue*(1.15 - 0.8*y)) + cB*core*0.45;
          // the heat standing over a pit: a faint column that wavers
          float wisp = smoothstep(0.35, 0.8, nlF(vec2(x*1.6 + s, y*1.4 - uTime*0.5)))*pow(max(1.0 - x*x, 0.0), 2.0)*smoothstep(0.0, 0.12, y)*(1.0 - y)*(1.0 - y);
          c = mix(c, cA*0.16*wisp, vF.w);
          float fogK = 1.0 - nlFogAmount(vW, uFog.x*0.7);
          vec3 toE = cameraPosition - vW;
          gl_FragColor = vec4(c*fogK*smoothstep(3.0, 12.0, length(toE)), 1.0);
        }`,
    });
    const m = new THREE.Mesh(g, mat); m.name = 'flames'; m.renderOrder = 3; group.add(m);
  }
  await ctx.yield();
  // ---- smoke from the pits nearest the flight and from the kiln, leaning west; haze glows; sparks over A and B
  const set = fx.fxGroup(); group.add(set.object);
  const near = L.pits.map((p) => ({ p, d: opts.path.nearestXZ(p.x, p.z).dist })).sort((a, b) => a.d - b.d).slice(0, Math.round(5 * (opts.detail ?? 1)));
  const key = [0.35, 0.45, -0.82];
  for (const q of [...near.map((n) => n.p), { ...L.kiln, r: 12, kind: 0 }]) {
    // (polish round 1, P2: the smoke is grey smoke, paler toward its top, lit red (or blue) from below at its foot only)
    // smoke: red (or blue) where its fire lights it at the foot, amber through its thin edges where it stands in the light
    // of the face, many small puffs so that its edge is broken, leaning west with the wind
    set.add(fx.makeSmokeColumn({ rng: S.smoke.fork('column'), time, position: [q.x, q.y + 1.5, q.z], height: q.r * S.smoke.range(10, 14), radius: [q.r * 0.3, q.r * 2.2], size: [q.r * 0.5, q.r * 2.3], count: 96,
      color: '#2b2826', colorTop: '#48433d', shadowColor: '#0a080a', ambient: '#0b0a0c', hot: q.kind ? '#1d3c98' : '#8a2a18', hotFalloff: 9, opacity: 0.38, rate: 0.045,
      ragged: 1.6, softness: 0.9, billow: 0.2,
      wind: [-3.0, 0, 0.5], bend: 0.55, rim: 0.9, scatter: 0.6, sunDir: key, sunColor: '#8a6030' }));
    await ctx.yield();
  }
  const cols = all.filter((f) => f.pit).map((f) => (f.kind ? '#3C66E0' : '#A3211B'));
  set.add(fx.makeGlows({ rng: S.haze, positions: all.filter((f) => f.pit).map((f) => [f.x, f.y + f.r * 0.9, f.z]), sizes: all.filter((f) => f.pit).map((f) => f.r / 10), colors: cols,
    size: 46, intensity: 0.3, core: 0, halo: 1, flicker: 0.16, near: [0.4, 1.4], minAngle: 0, fogAmount: 0.4, time, renderOrder: 2 }));
  set.add(fx.makeGlows({ rng: S.holeglows, positions: L.holes.map((h) => [h.x, h.y + 1.2, h.z]), colors: L.holes.map((h) => (h.kind ? '#3C66E0' : '#A3211B')),
    size: 9, intensity: 0.5, core: 0.15, halo: 1, flicker: 0.3, near: [0.4, 1.4], minAngle: 0.0016, fogAmount: 0.4, time, renderOrder: 2 }));
  // the far fires: a flame is too small to see from the face, so each is a point of its colour with a low halo
  set.add(fx.makeGlows({ rng: S.fireglows, positions: L.farFires.map((q) => [q.x, q.y + q.r * 0.6, q.z]), sizes: L.farFires.map((q) => q.r / 4), colors: L.farFires.map((q) => (q.kind ? '#3C66E0' : '#A3211B')),
    size: 24, intensity: 1.0, core: 0.35, halo: 1, flicker: 0.35, near: [0.4, 1.4], minAngle: 0.0022, fogAmount: 0.35, time, renderOrder: 2 }));
  await ctx.yield();
  for (const p of L.pits.slice(0, 2)) {
    set.add(fx.makeParticles({ rng: p.name === 'A' ? S.sparksA : S.sparksB, preset: 'sparks', time, follow: false, count: Math.round(260 * (opts.detail ?? 1)), center: [p.x - 4, p.y + 13, p.z], box: [p.r * 2.6, 26, p.r * 2.6], size: [0.05, 0.15],
      colors: p.kind ? ['#5a86ff', '#9fb8ff', '#3C66E0'] : ['#ff3a22', '#d0241a', '#ff6a4a'], intensity: 2.2, velocity: [-2.2, 5.5, 0.3] }));
    await ctx.yield();
  }
  return { group, set, triangles: all.length * 14 + fl.length / 8 * 2, update(dt, t, camera) { set.update(dt, t, camera); } };
}

// ------------------------------------------------------------------------------------------------ 7. moss, house, cones, strata
// Moss-bushes: low rounded clumps, black-green with a grey bloom, thick round the warm holes, on the earth drifted against
// the Watcher, thin between. Their tips tremble in the heat; each takes the colour of the fire it stands by.
export async function buildMoss(ctx, shared, L, lights, path, count, rng) {
  // a clump: five sides, two rings and a cap
  const p = [], nn = [], idx = [];
  const ringAt = (y, r) => { const b = p.length / 3; for (let i = 0; i < 5; i++) { const a = i / 5 * 6.2832 + y * 2; p.push(Math.cos(a) * r, y, Math.sin(a) * r); nn.push(Math.cos(a) * 0.8, 0.25 + y * 0.6, Math.sin(a) * 0.8); } return b; };
  const r0 = ringAt(0, 0.92), r1 = ringAt(0.5, 1), r2 = ringAt(0.86, 0.6); p.push(0, 1, 0); nn.push(0, 1, 0); const top = p.length / 3 - 1;
  for (let i = 0; i < 5; i++) { const j = (i + 1) % 5; idx.push(r0 + i, r1 + j, r0 + j, r0 + i, r1 + i, r1 + j, r1 + i, r2 + j, r1 + j, r1 + i, r2 + i, r2 + j, r2 + i, top, r2 + j); }
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nn, 3)); g.setIndex(idx);
  const at = [], var_ = [], glow = [], g3 = [0, 0, 0];
  const nearHoles = L.holes.filter((h) => path.nearestXZ(h.x, h.z).dist < 150), fires = [...nearHoles, ...L.pits.filter((q) => path.nearestXZ(q.x, q.z).dist < 150)];
  let guard = 0;
  while (at.length / 4 < count && guard++ < count * 30) {
    let x, z; const pick = rng();
    if (pick < 0.6 && fires.length) { const h = rng.pick(fires), a = rng() * 6.283, d = h.r * (h.y !== undefined && h.r > 5 ? rng.range(1.5, 2.6) : rng.range(1.5, 5.5 + 4 * rng())); x = h.x + Math.cos(a) * d; z = h.z + Math.sin(a) * d; }
    else if (pick < 0.78) { const a = rng() * 6.283, q = rng.range(0.92, 1.2); const la = Math.cos(a) * L.W.len / 2 * q, lb = Math.sin(a) * L.W.wid / 2 * q; if (lb > 30) continue; x = L.W.c[0] + L.W.f[0] * la + L.W.r[0] * lb; z = L.W.c[1] + L.W.f[1] * la + L.W.r[1] * lb; }
    else { const a = L.at(rng.range(-0.08, 0.98) * L.legLen, rng.range(-125, 125) * Math.sqrt(rng())); x = a[0]; z = a[1]; }
    const n = path.nearestXZ(x, z); if (n.dist < 7 || n.dist > 150) continue;
    if (ringDistLocal(x, z) < 14 || Math.abs(z - roadZ(x)) < 8 || Math.hypot(x - L.dome.x, z - L.dome.z) < L.dome.r + 4) continue;
    let inFire = false; for (const q of L.pits) if (Math.hypot(x - q.x, z - q.z) < q.r * 1.3) { inFire = true; break; }
    if (inFire) continue;
    const s = rng.range(0.6, 1.5) * (rng.chance(0.2) ? 1.5 : 1), y = L.heightAt(x, z);
    at.push(x, y - 0.12 * s, z, rng() * 6.283); var_.push(s * rng.range(0.9, 1.6), s, rng(), 0);
    glowAt(lights, x, z, g3); glow.push(g3[0], g3[1], g3[2]);
    if ((at.length & 1023) === 0) await ctx.yield();
  }
  g.setAttribute('aAt', new THREE.InstancedBufferAttribute(new Float32Array(at), 4)); g.setAttribute('aV', new THREE.InstancedBufferAttribute(new Float32Array(var_), 4));
  g.setAttribute('aGlow', new THREE.InstancedBufferAttribute(new Float32Array(glow), 3));
  g.instanceCount = at.length / 4; const c = L.at(0.5 * L.legLen, 0); g.boundingSphere = new THREE.Sphere(new THREE.Vector3(c[0], 0, c[1]), 560);
  const mat = new THREE.ShaderMaterial({
    uniforms: { ...shared.uniforms },
    vertexShader: /* glsl */`
      ${NL_GLSL}
      attribute vec4 aAt; attribute vec4 aV; attribute vec3 aGlow;
      varying vec3 vCol; varying vec3 vW;
      void main(){
        float ca = cos(aAt.w), sa = sin(aAt.w), s = aV.z*40.0;
        vec3 p = position*vec3(aV.x, aV.y, aV.x);
        // tips tremble in the heat draughts
        float tr = position.y*position.y;
        p.x += tr*0.07*aV.y*sin(uTime*(5.0 + 3.0*aV.z) + s); p.z += tr*0.06*aV.y*sin(uTime*(4.1 + 2.0*aV.z) + s*1.7);
        vec3 wp = vec3(p.x*ca + p.z*sa, p.y, -p.x*sa + p.z*ca) + aAt.xyz;
        vec3 N = normalize(vec3(normal.x*ca + normal.z*sa, normal.y, -normal.x*sa + normal.z*ca));
        vec3 toE = cameraPosition - wp; vec3 V = toE/max(length(toE), 1e-3);
        vec3 alb = mix(vec3(0.012, 0.02, 0.014), vec3(0.085, 0.105, 0.085), position.y*position.y*(0.5 + 0.5*aV.z));   // black-green, a grey bloom on top
        float fr = 1.0 - max(dot(N, V), 0.0);
        vCol = nlKey(wp, N, V, alb*1.5, 0.1) + nlPales(wp, N, V, alb, 0.5) + nlRing(wp, N, alb) + alb*vec3(0.004, 0.0045, 0.007) + (alb*0.8 + 0.012*fr*fr + 0.002)*aGlow*(0.75 + 0.25*sin(uTime*3.0 + s));
        vW = wp;
        gl_Position = projectionMatrix*viewMatrix*vec4(wp, 1.0);
      }`,
    fragmentShader: /* glsl */`precision highp float;
      ${NL_GLSL}
      varying vec3 vCol; varying vec3 vW;
      void main(){ gl_FragColor = vec4(nlFog(vCol, vW), 1.0); }`,
  });
  const mesh = new THREE.Mesh(g, mat); mesh.name = 'moss';
  return { mesh, count: at.length / 4, triangles: at.length / 4 * 25 };
}
const ringDistLocal = (x, z) => Math.abs(ringDist(x, z));

// ------------------------------------------------------------------------------------------------ 8. boulders (polish round 1)
// Blocks of slag broken out when the house's foot was cut, and thrown outward, lie over the whole cinder country (the
// ground as it is built: 4,700 m east and west of the house's middle, from its south face 4,400 m south): thickest by
// the ring and half as thick with every 300 m from it, with no outer end but the country's own edge. Most a man's height or two, a few as big as a hut (1.2 to 6 m, the cube of a draw). None on
// the road, in a fire, on a Watcher or within 8 m of the route's own line. Each takes the house's light on the side
// toward the house and the firelight of the country on the side toward its fires. Dealt from a stream of their own.
export async function buildBoulders(ctx, shared, L, path, wideLs, rng, count) {
  const g0 = new THREE.DodecahedronGeometry(1, 0), g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', g0.attributes.position); g.setAttribute('normal', g0.attributes.normal);
  const at = [], sc = [], glow = [], w5 = [0, 0, 0, 0, 0];
  let guard = 0;
  while (at.length / 4 < count && guard++ < count * 60) {
    const x = rng.range(-4700, 4700), z = rng.range(1200, 5600), q = rng(), s = 1.2 + 4.8 * q * q * q;
    const a = rng() * 6.283, sx = rng.range(0.8, 1.35), sy = rng.range(0.5, 0.95), sz = rng.range(0.8, 1.35), seed = rng(), keep = rng();
    if ((guard & 1023) === 0) await ctx.yield();
    const rd = ringDist(x, z); if (rd < 0 || keep > Math.pow(0.5, rd / 300)) continue;
    if (!L.okSpot(x, z, s, 8)) continue;
    let inHole = false; for (const h of L.holes) if (Math.hypot(x - h.x, z - h.z) < h.r + s + 2) { inHole = true; break; }
    if (inHole) continue;
    at.push(x, L.heightAt(x, z) - 0.3 * s * sy, z, a); sc.push(s * sx, s * sy, s * sz, seed);
    wideAt(wideLs, x, z, w5); glow.push(w5[0], w5[1], w5[2], w5[3], w5[4]);
  }
  const n = at.length / 4, gl = new Float32Array(n * 3), ld = new Float32Array(n * 2);
  for (let i = 0; i < n; i++) { gl[i * 3] = glow[i * 5]; gl[i * 3 + 1] = glow[i * 5 + 1]; gl[i * 3 + 2] = glow[i * 5 + 2]; ld[i * 2] = glow[i * 5 + 3]; ld[i * 2 + 1] = glow[i * 5 + 4]; }
  g.setAttribute('aAt', new THREE.InstancedBufferAttribute(new Float32Array(at), 4)); g.setAttribute('aS', new THREE.InstancedBufferAttribute(new Float32Array(sc), 4));
  g.setAttribute('aGlow', new THREE.InstancedBufferAttribute(gl, 3)); g.setAttribute('aLd', new THREE.InstancedBufferAttribute(ld, 2));
  g.instanceCount = n; g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), 3200);
  const mat = new THREE.ShaderMaterial({
    uniforms: { ...shared.uniforms },
    vertexShader: /* glsl */`
      ${NL_GLSL}
      attribute vec4 aAt; attribute vec4 aS; attribute vec3 aGlow; attribute vec2 aLd;
      varying vec3 vCol; varying vec3 vW;
      void main(){
        float ca = cos(aAt.w), sa = sin(aAt.w);
        // every corner pushed in or out a little, by its own place on the block, so no two blocks are alike
        vec3 p = position*aS.xyz*(0.78 + 0.44*nlH(position.xy*7.3 + position.z*3.1 + aS.w*31.0));
        vec3 wp = vec3(p.x*ca + p.z*sa, p.y, -p.x*sa + p.z*ca) + aAt.xyz;
        vec3 n0 = normalize(normal/aS.xyz);
        vec3 N = normalize(vec3(n0.x*ca + n0.z*sa, n0.y, -n0.x*sa + n0.z*ca));
        vec3 toE = cameraPosition - wp; vec3 V = toE/max(length(toE), 1e-3);
        vec3 alb = vec3(0.075, 0.07, 0.072)*(0.7 + 0.6*aS.w)*(0.55 + 0.45*smoothstep(-0.5, 0.6, position.y));
        vec3 c = nlKey(wp, N, V, alb, 0.25) + alb*vec3(0.004, 0.0045, 0.007);      // (the house's light; the fires' below. No pale lamp, no lamp chosen by the route.)
        float rd = nlRingD(wp.xz); vec2 rg = nlRingN(wp.xz);
        float hd = max(rd, 0.0), houseL = 1.0/(1.0 + hd/260.0 + hd*hd/(900.0*900.0));
        // (second part, G1b: a block is a dark shape; only what turns square to the house takes a faint edge of its light)
        float hk = max(dot(N, normalize(vec3(-rg.x, 0.35, -rg.y))), 0.0);
        c += alb*uKeyCol*(0.3*houseL*hk*hk*hk);
        // (beside a great pit the firelight on a block is held to 0.8, as the ground's pool is held)
        float gs = aGlow.r + aGlow.g + aGlow.b;
        c += (alb + 0.008)*aGlow*(min(1.0, 0.8/max(gs, 1e-3))*(0.04 + 3.0*max(dot(N, normalize(vec3(aLd.x, 0.25, aLd.y))), 0.0)));
        vCol = c; vW = wp;
        gl_Position = projectionMatrix*viewMatrix*vec4(wp, 1.0);
      }`,
    fragmentShader: /* glsl */`precision highp float;
      ${NL_GLSL}
      varying vec3 vCol; varying vec3 vW;
      // (the stone is mottled, in patches of a metre or so, so that a block's flat sides are not of one tone)
      void main(){ gl_FragColor = vec4(nlFog(vCol*(0.72 + 0.56*nlN(vW.xz*1.3 + vW.y*1.9)), vW), 1.0); }`,
  });
  const mesh = new THREE.Mesh(g, mat); mesh.name = 'boulders';
  return { mesh, count: n, triangles: n * 36 };
}
