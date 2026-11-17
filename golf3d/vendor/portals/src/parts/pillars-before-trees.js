// Pillars Before Trees · hero set piece: "The Smoking".
// The Elder, the tallest living thing on Earth 400 million years ago: a Prototaxites 8.8 m high and 1.3 m thick,
// a bone-pale lofted column (flared toed foot, lobed section, drums out of true, lean, broken top), its upper third
// a tan velvet zone that breathes out a slanted gold veil of spores glittering with motes; four to six young ones
// like pale thumbs beside it; its sun shadow; an apron of gravel, crust and Psilophyton sward round the foot.
//
// export async function buildHero(ctx, opts) -> { object, radius 7, height 8.8, center, anchors, update, dispose,
//     shared, setProgress(u), setState({ sun, sunDown, smoke, wet }), setLight({...}), setWind(x, z, speed, rise), field }
//   Origin: the Elder's foot, +Y up.  The camera's pass (brief u 0.40-0.62) runs down the +X side from +Z to -Z.
// opts: palette (brief order), detail 0.6-1 (thins sward, veil cards and motes only), height, top ('slant'|'notch'|'hollow'),
//   veilLength, apron: false / sward: false (leave the foot to the world), wind: [x, z], windSpeed, rise,
//   light: { sunDir, sunColor, sky, fill, warm, rim, sea } (THREE.Vector3; colours linear, sun already divided by pi),
//   state: { sun, sunDown, smoke, wet }, shared (a makeShared() object to reuse; shared.uVeilEven 1 = the still day's even columns,
//   shared.uSpore = the russet of the spore tassels),
//   field: [{ x, z, height, lod, fallen, rotY, veil, delay, top }] = the other pillars in hero-local space (makePillarField).
// Progress: call hero.setProgress(u) with the WORLD's u every frame.  It follows the brief: the sun term rises over
//   u 0.44-0.60, sunlight walks down the pillars from u 0.455, the tops begin to smoke at u 0.46 (each pillar after its
//   own seeded delay: a scatter, not a sweep) and all smoke by 0.58.  Never called (the viewer): full sun, full smoke.
//   setState gives the same uniforms directly: sun 0-1 (key light and shadows), sunDown 0-1 (how far down the light
//   has come), smoke 0-1, wet 0-1 (after rain).  Everything is uniforms; nothing is created or switched in update().
// Light: its own shader, no real-time lights.  With no opts.light and no setLight() it copies direction and colour of
//   the strongest DirectionalLight in the scene each frame; ambient is the brief's (cream fog on the sun side,
//   violet-grey #8E8A93 fill away from it).  Fog: scene fog (either kind) is honoured by every material.
// anchors (hero-local): top (the smoking top: gaze poi), flyThrough (7 points, the Elder passing 10.6 m on the left
//   with the lens level with its top, then round behind it climbing to 11 m; nothing solid within 9.5 m of it),
//   viewpoints { approach, beside, reveal }, young (feet of the thumbs), veilAxis (live unit vector the veils stream
//   along), clearRadius 9.5, portalSeat (only a suggestion: the brief seats the ring between the gateposts).
// For the world: pillarSpec, pillarGeometry (lod 0 about 900 triangles, 1 about 3k, 2 about 12k), pillarMaterial,
//   makeVeils, makeShadows (flat ground), makePillarField (all of that in one call), psilophytonGeometry + swardMaterial
//   (camera-facing ribbons at least 1.5 px wide, wind in the vertex shader), makeShared.  All take the hero's `shared`.
// Cost: about 101k triangles (Elder 12k, young 9k, sward 78k at detail 1, the rest 2k), 8 draw calls, build about 250-400 ms on the test machine.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { clamp, lerp, smoothstep, makeRng, makeNoise } from '../kit/core.js';

const TAU = Math.PI * 2;
export const PILLAR_PALETTE = ['#E6DCC3', '#EADFC6', '#F2C566', '#7C8F5E', '#C8642A', '#5B5A6B', '#3A3B33'];

// ------------------------------------------------------------------------------------------------
// 1. One pillar (Prototaxites) as a description, then as a lofted mesh.  Never a cylinder: a flared,
//    toed foot, a lobed cross-section that twists slowly, a taper to half width, drums a little out
//    of true with a groove between each pair, a lean with a curve, and a broken top.
// ------------------------------------------------------------------------------------------------
export function pillarSpec(rng, o = {}) {
  const H = o.height ?? rng.range(5, 8);
  const r0 = (o.thick ?? (0.3 + 0.1 * H) * rng.range(0.92, 1.1)) * 0.5;
  const step = 0.8 + 0.2 * Math.min(1, H / 6);
  const drums = []; let w = o.fallen ? 0.02 : rng.range(0.3, 0.45);
  while (w < H + 0.9) {
    drums.push({ w, s: 1 + clamp(rng.gauss() * 0.03, -0.055, 0.06), ox: rng.gauss() * (o.fallen ? 0.034 : 0.022), oz: rng.gauss() * (o.fallen ? 0.034 : 0.022), g: rng() < 0.3 ? rng.range(0.008, 0.02) : rng.range(0.03, 0.06) });      // some rings are barely a seam: an uneven rhythm
    w += rng.range(0.25, 0.5) * step;
  }
  const young = H < 2.6;
  return {
    H, r0, drums, young,
    taper: o.taper ?? (young ? rng.range(0.8, 0.92) : rng.range(0.5, 0.7)),
    lean: (o.lean ?? rng.range(3, 9)) * Math.PI / 180, leanAz: o.leanAz ?? rng.range(0, TAU), curve: o.curve ?? rng.range(-0.2, 0.5),
    flare: o.flare ?? (o.fallen ? 0 : young ? rng.range(0.2, 0.34) : rng.range(0.6, 0.95)), toes: rng.int(4, 7), toePh: rng() * TAU,
    lobeA: [rng.range(0.07, 0.15), rng.range(0.04, 0.09), rng.range(0.02, 0.045)], lobeP: [rng() * TAU, rng() * TAU, rng() * TAU],
    twist: rng.range(-0.12, 0.12),
    top: o.top ?? (young ? 'dome' : rng.pick(['slant', 'notch', 'hollow'])), topAz: o.topAz ?? rng() * TAU, topSlope: rng.range(0.7, 2.1),
    notchAz: o.notchAz ?? rng() * TAU, notchW: rng.range(0.55, 0.95), notchD: rng.range(0.07, 0.13) * H, hollowD: rng.range(0.07, 0.12) * H,
    seed: rng() * 97, baseCap: !!o.baseCap || !!o.fallen,
  };
}

function pillarSurface(sp, noise) {
  const { H, r0, drums } = sp; let ki = 0;
  const rTop = r0 * sp.taper, lx = Math.cos(sp.leanAz), lz = Math.sin(sp.leanAz), tl = Math.tan(sp.lean);
  const drumAt = (w) => { while (ki > 0 && drums[ki].w > w) ki--; while (ki < drums.length - 1 && drums[ki + 1].w <= w) ki++; return ki; };
  const warp = (w, th) => (0.045 * Math.sin(th - sp.lobeP[0] + w * 0.9) + 0.035 * noise.n3(Math.cos(th) * 0.8 + sp.seed, w * 0.5, Math.sin(th) * 0.8)) * Math.min(1, Math.max(w, 0) / 0.8);
  const out = { x: 0, y: 0, z: 0, ao: 1 };
  // radius and drum offset at height coordinate w, angle th
  const at = (w, th, y) => {
    const yy = Math.max(w, 0), t = clamp(w / H, 0, 1);
    let r = r0 * (1 - (1 - sp.taper) * Math.pow(t, 1.5));
    r *= 1 + sp.flare * 0.42 * Math.exp(-yy / 0.6);                      // k1b: the foot spreads modestly into the gravel over half a metre (it was a bulb that doubled the girth in a hand's height)
    const toe = Math.pow(Math.abs(Math.sin(th * sp.toes * 0.5 + sp.toePh)), 0.6) - 0.6;
    r *= 1 + sp.flare * 0.26 * Math.exp(-yy / 0.9) * toe;
    r *= 1 + 0.06 * Math.sin(w * 0.85 + sp.seed * 3.) * Math.min(1, yy);          // its girth swells and narrows a little as it rises
    r *= 1 + sp.lobeA[0] * Math.cos(2 * th + sp.lobeP[0] + sp.twist * w) + sp.lobeA[1] * Math.cos(3 * th + sp.lobeP[1] - sp.twist * 1.7 * w) + sp.lobeA[2] * Math.cos(5 * th + sp.lobeP[2] + w * 0.3);
    r *= 1 + 0.075 * noise.n3(Math.cos(th) * 1.1 + sp.seed, w * 0.33, Math.sin(th) * 1.1);
    if (sp.top === 'dome') { const q = smoothstep(H - 1.6 * rTop, H, w); r *= 1 - 0.3 * q * q; }
    const k = drumAt(w), d0 = drums[k], d1 = drums[Math.min(k + 1, drums.length - 1)];
    let f = 0, dn = d0.w - w, g = d0.g;
    if (w >= d0.w) { const span = Math.max(d1.w - d0.w, 0.05); f = clamp((w - d0.w) / span, 0, 1); const up = d1.w - w; dn = w - d0.w; if (up < dn) { dn = up; g = d1.g; } }
    const m = smoothstep(0.66, 1, f), s = lerp(d0.s, d1.s, m);            // n3: a drum eases into the next over its upper third (it stepped over the last sixth: a ledge at every seam)
    const gr = Math.exp(-(dn * dn) / (0.046 * 0.046)) * (0.3 + 0.7 * smoothstep(-0.45, 0.25, noise.n3(Math.cos(th) * 1.4, w * 1.1 + sp.seed, Math.sin(th) * 1.4)));
    r *= s * (1 + 0.022 * Math.sin(Math.PI * f)) * (1 - 0.7 * g * gr);          // n3: the seam is a soft waist (it was a razor notch that stair-stepped the outline)
    const off = tl * (y + sp.curve * y * y / H) / (1 + sp.curve), wig = 0.035 * (H / 8) * Math.sin(y * 0.9 + sp.seed);
    out.x = lx * off - lz * wig + lerp(d0.ox, d1.ox, m) + r * Math.cos(th);
    out.z = lz * off + lx * wig + lerp(d0.oz, d1.oz, m) + r * Math.sin(th);
    out.y = y; out.ao = 1 - Math.min(0.55, g * 7.5) * gr * Math.exp(-(dn * dn) / (0.07 * 0.07));
    return out;
  };
  const angD = (a, b) => { let d = (a - b) % TAU; if (d > Math.PI) d -= TAU; if (d < -Math.PI) d += TAU; return d; };
  const rag = (th) => 0.15 * noise.n3(Math.cos(th) * 2.6, sp.seed * 3.1, Math.sin(th) * 2.6) + 0.025 * Math.sin(5 * th + sp.seed);
  const yTop = (th) => {
    if (sp.top === 'dome') return H;
    let y = H - sp.topSlope * (sp.top === 'slant' ? 1 : 0.35) * rTop * Math.cos(th - sp.topAz) + rag(th) * (sp.top === 'hollow' ? 1.5 : 1);
    if (sp.top === 'notch') { const x = angD(th, sp.notchAz) / sp.notchW; if (Math.abs(x) < 1) { const b = 1 - x * x; y -= sp.notchD * b * b; } }
    return y;
  };
  // k1b: where a fallen pillar snapped: the break is further back on one side than the other (0 to 0.32 m along it).
  // Mend 2: the break is a plane tilted to one side (10 cm either way, toward an angle of the trunk's own) with one slow
  // unevenness of 3 cm.  It was a noise of 15 cm taken round a circle seven to nine waves long, with three lobes of 5 cm
  // and eleven of 3 cm by sines of the angle on top: every circle of the end, from the rim to the pith, carried 15 to
  // 30 cm of relief in seven to eleven lobes (m2end.mjs), and the end read as a carved flower.
  const breakY = (th) => clamp(0.16 + 0.1 * Math.cos(th - sp.seed * 2.4) + 0.03 * noise.n3(Math.cos(th) * 0.5, sp.seed * 5.3, Math.sin(th) * 0.5), 0, 0.32);
  // centre of the cap at height y (for the fan)
  const centre = (y) => { const off = tl * (y + sp.curve * y * y / H) / (1 + sp.curve), wig = 0.035 * (H / 8) * Math.sin(y * 0.9 + sp.seed); return [lx * off - lz * wig, lz * off + lx * wig]; };
  return { at, warp, yTop, centre, rTop, breakY };
}

// lod 2: a hero seen from 4-10 m (about 12k triangles for an 8 m pillar); 1: avenue and gateposts (about 3k);
// 0: the far ones (about 900).  geometry.userData.top = [x, y, z] of the middle of the broken top, .rTop its radius.
function* pillarGeometrySteps(sp, noise, lod = 2) {
  const S = pillarSurface(sp, noise), { H, drums } = sp;
  const lying = !!sp.baseCap && lod === 2;                  // n4: the fallen pillar: 40 sides and three rows a drum (about 7,000 triangles; it was 56 and four: 12,000), the lens passes 0.9 m over it
  // n4: the standing meshes.  lod -1: the far field (seven sides); -0.5: the stand-in of a trunk that has a near mesh (nine
  // sides, live's own stand-in count: it is seen from 19 m or more, where a nine-sided outline's corners stand 4 cm, two
  // pixels, off the round); both carry a row at every second drum only (a seam is a waist of two centimetres: under a pixel
  // from 12 m, and the shader draws each drum's shade); -0.25: a trunk 8 to 12 m off the route that stands as this mesh at
  // every distance (ten sides: its corners stand 3 cm off the round, under five pixels from 8 m, among thirty flutes; a row
  // at every drum).  The near meshes (mend 2): 1, a trunk within arm's length of the route (5.5 m): live's own 22 sides
  // (0.7 cm off the round: two pixels from 3.7 m, the nearest an anchor stands) and three rows a drum;
  // 0.5, a trunk 5.5 to 8 m off: 16 sides (1.2 cm off the round: under three pixels from 5.5 m) and live's two rows a drum
  // (the swell between two seams is a centimetre: two pixels from there).
  const sparse = lod === -1 || lod === -0.5;
  const segs = lod === 2 ? (lying ? 40 : 56) : lod === 1 ? 22 : lod === 0.5 ? 16 : lod === 0 ? 9 : lod === -0.25 ? 10 : lod === -0.5 ? 9 : 7, cols = segs + 1;
  const rows = sp.baseCap ? [0, 0.36] : lod < 0 ? [-0.3, 0.12] : lod === 0 ? [-0.3, 0.02, 0.2] : [-0.3, 0, 0.1, 0.24];
  const e = lod === 2 ? 0.034 : 0.06;
  for (let k = 0; k < drums.length; k++) {
    const w = drums[k].w; if (w > H + 0.4) break;
    if (sparse && k % 2 === 1) continue;
    const nw = k + 1 < drums.length ? drums[k + 1].w : w + 0.4;
    if (lod >= 0) rows.push(w - (lod === 0 ? 0.075 : e));
    rows.push(w);
    if (lod === 2) { rows.push(w + e); if (!lying) rows.push((w + nw) * 0.5); }
    else if (lod === 1) rows.push((w + nw) * 0.5);            // k1: a row in the middle of each drum too: the flank swells between the seams instead of stepping
  }
  rows.push(H + 0.7);
  const pos = [], dat = [], idx = [], rings = [];
  const ring = () => { rings.push(pos.length / 3); return pos.length / 3; };
  // body
  const b0 = pos.length / 3;
  for (let j = 0; j < rows.length; j++) {
    ring();
    for (let i = 0; i < cols; i++) {
      const th = (i % segs) / segs * TAU, w = rows[j], wp = S.warp(w, th), yT = S.yTop(th);
      let y = w - wp, w2 = w; if (y > yT) { y = yT; w2 = yT + wp; }
      if (sp.baseCap && j === 0) { y = S.breakY(th); w2 = y; }
      const p = S.at(w2, th, y);
      pos.push(p.x, p.y, p.z); dat.push(w2, i / segs, p.ao, 0);
    }
    if (lod === 2 ? j % 2 === 1 : j % 5 === 4) yield;
  }
  yield;
  for (let j = 0; j < rows.length - 1; j++) for (let i = 0; i < segs; i++) {
    const a = b0 + j * cols + i, b = a + cols, c = a + 1, d = b + 1; idx.push(a, b, c, b, d, c);
  }
  // rim again (its own normals: the break is a sharp edge), then the cap
  const rim = []; let cx = 0, cz = 0, cy = 0;
  for (let i = 0; i < segs; i++) { const th = i / segs * TAU, yT = S.yTop(th), p = S.at(yT + S.warp(H, th), th, yT); rim.push([p.x, p.y, p.z]); cx += p.x / segs; cy += p.y / segs; cz += p.z / segs; }
  const dome = sp.top === 'dome', hollow = sp.top === 'hollow';
  const capR = hollow ? (lod === 2 ? [1, 0.9, 0.82, 0.68, 0.42, 0.16] : [1, 0.86, 0.66, 0.3]) : lod === 2 ? [1, 0.93, 0.78, 0.56, 0.3] : lod < 0 ? [1, 0.45] : [1, 0.75, 0.38];
  yield;
  const c0 = pos.length / 3;
  for (let k = 0; k < capR.length; k++) {
    ring(); const q = capR[k];
    for (let i = 0; i < cols; i++) {
      const r = rim[i % segs], x = cx + (r[0] - cx) * q, z = cz + (r[2] - cz) * q;
      let y, ao = 0.9;
      if (dome) y = H + 0.42 * S.rTop * (1 - q * q);
      else if (hollow) { const dr = 1 - smoothstep(0.66, 0.88, q); y = r[1] - sp.hollowD * dr * (0.9 + 0.2 * noise.n2(x * 5 + sp.seed, z * 5)) - (1 - q) * 0.03; ao = lerp(1, 0.28, dr); }
      else { y = cy + (r[1] - cy) * q - 0.07 * (1 - q * q) + 0.03 * (1 - q * q * q) * noise.n2(x * 9 + sp.seed, z * 9); ao = 0.72 + 0.2 * q; }
      pos.push(x, y, z); dat.push(y, i / segs, ao, 1 + q);
    }
  }
  for (let k = 0; k < capR.length - 1; k++) for (let i = 0; i < segs; i++) {
    const a = c0 + k * cols + i, b = a + cols, c = a + 1, d = b + 1; idx.push(a, b, c, b, d, c);
  }
  const ctr = pos.length / 3, qL = capR[capR.length - 1], lastR = c0 + (capR.length - 1) * cols;
  const yc = dome ? H + 0.42 * S.rTop : hollow ? cy - sp.hollowD - 0.03 : cy - 0.07;
  pos.push(cx, yc, cz); dat.push(yc, 0, hollow ? 0.25 : 0.72, 1);
  for (let i = 0; i < segs; i++) idx.push(lastR + i, ctr, lastR + i + 1);
  void qL;
  yield;
  // k1b: the broken end of a fallen pillar: not a sawn disc.  The trunk is built of growth shells; where it snapped they
  // parted at different depths, so the end is four or five concentric shells standing proud of one another with a step
  // between each pair, round a shallow pith.  Growth rings are drawn on each by the shader.  Mend 2: every shell's face
  // is flat round its whole circle: it lies in the break's own tilted plane, with half a centimetre of grain (each had the
  // break's lobes and a wave of 8 cm of its own round the angle, and the pith a noise of 2 cm on forty spokes: lobes
  // and a star); the steps between the shells are the only relief, and they are circles.
  if (sp.baseCap) {
    const f0 = pos.length / 3;
    const fr = lod === 2 ? [1, 0.9, 0.885, 0.76, 0.745, 0.62, 0.605, 0.47, 0.455, 0.35, 0.3, 0.14] : [1, 0.86, 0.84, 0.6, 0.58, 0.36, 0.3, 0.14];
    const [bx, bz] = S.centre(0), nSh = fr.length / 2 - 1, lift = [0, 0.1, 0.03, 0.15, 0.07, 0.12];
    const shellY = (k, th) => S.breakY(th) * (1 - 0.16 * k) + lift[k % lift.length] + 0.004 * noise.n3(Math.cos(th) * 3.1, k * 7.3 + sp.seed, Math.sin(th) * 3.1);
    for (let k = 0; k < fr.length; k++) {
      ring();
      const sh = Math.min(k >> 1, nSh), heart = k >= fr.length - 2, q = fr[k];
      for (let i = 0; i < cols; i++) {
        const th = (i % segs) / segs * TAU, by = S.breakY(th), p = k === 0 ? S.at(by, th, by) : S.at(0, th, 0);
        const x = k === 0 ? p.x : bx + (p.x - bx) * q, z = k === 0 ? p.z : bz + (p.z - bz) * q;
        let y = k === 0 ? S.breakY(th) : shellY(sh, th) + (k % 2 === 1 ? 0 : -0.012), ao = k % 2 === 0 && k > 0 ? 0.74 : 0.95;
        if (heart) { y = shellY(nSh, th) + (k === fr.length - 1 ? 0.085 : 0.05); ao = k === fr.length - 1 ? 0.7 : 0.82; }      // n4: the heart is a shallow dished pith in the same bone (it was a hole half a metre deep that read black)
        pos.push(x, y, z); dat.push(0, i / segs, ao, -1 - q);
      }
      if (k % 3 === 2) yield;
    }
    for (let k = 0; k < fr.length - 1; k++) for (let i = 0; i < segs; i++) {
      const a = f0 + k * cols + i, b = a + cols, c = a + 1, d = b + 1; idx.push(a, c, b, b, c, d);
    }
    const fc = pos.length / 3, fl = f0 + (fr.length - 1) * cols;
    { let ym = 0; for (let i = 0; i < segs; i++) ym += pos[(fl + i) * 3 + 1] / segs; pos.push(bx, ym + 0.02, bz); dat.push(0, 0, 0.66, -1); }
    for (let i = 0; i < segs; i++) idx.push(fl + i, fl + i + 1, fc);
  }
  yield;
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('aData', new THREE.Float32BufferAttribute(dat, 4));
  g.setIndex(idx);
  yield;
  {                                                          // k1: the same area-weighted normals as computeVertexNormals, in steps (it was one 20 to 45 ms stall for the Elder)
    const nr = new Float32Array(pos.length);
    for (let t = 0; t < idx.length; t += 3) {
      const a = idx[t] * 3, b = idx[t + 1] * 3, c = idx[t + 2] * 3;
      const ux = pos[c] - pos[b], uy = pos[c + 1] - pos[b + 1], uz = pos[c + 2] - pos[b + 2], vx = pos[a] - pos[b], vy = pos[a + 1] - pos[b + 1], vz = pos[a + 2] - pos[b + 2];
      const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
      nr[a] += nx; nr[a + 1] += ny; nr[a + 2] += nz; nr[b] += nx; nr[b + 1] += ny; nr[b + 2] += nz; nr[c] += nx; nr[c + 1] += ny; nr[c + 2] += nz;
      if (t % 6000 === 5997) yield;
    }
    for (let i = 0; i < nr.length; i += 3) { const l = Math.hypot(nr[i], nr[i + 1], nr[i + 2]) || 1; nr[i] /= l; nr[i + 1] /= l; nr[i + 2] /= l; }
    g.setAttribute('normal', new THREE.BufferAttribute(nr, 3));
  }
  yield;
  const n = g.attributes.normal;
  for (const s of rings) {                                   // weld the seam column
    const a = s, b = s + segs;
    const x = n.getX(a) + n.getX(b), y = n.getY(a) + n.getY(b), z = n.getZ(a) + n.getZ(b), l = Math.hypot(x, y, z) || 1;
    n.setXYZ(a, x / l, y / l, z / l); n.setXYZ(b, x / l, y / l, z / l);
  }
  g.computeBoundingSphere();
  g.userData = { top: [cx, cy, cz], rTop: S.rTop, height: H, triangles: idx.length / 3 };
  return g;
}
export function pillarGeometry(sp, noise, lod = 2) { const it = pillarGeometrySteps(sp, noise, lod); let r = it.next(); while (!r.done) r = it.next(); return r.value; }
// the same mesh built in short steps: `pause` is ctx.yield (loading without stalls)
export async function pillarGeometryAsync(sp, noise, lod, pause) { const it = pillarGeometrySteps(sp, noise, lod); let r = it.next(); while (!r.done) { await pause(); r = it.next(); } return r.value; }

// ------------------------------------------------------------------------------------------------
// 2. Shared light and weather uniforms, and the one pillar shader.
// ------------------------------------------------------------------------------------------------
const lin = (hex, k = 1) => { const c = new THREE.Color(hex); return new THREE.Vector3(c.r * k, c.g * k, c.b * k); };

export function makeShared(palette = PILLAR_PALETTE) {
  return {
    uTime: { value: 0 },
    uSunDir: { value: new THREE.Vector3(-0.6, 0.7, 0.4).normalize() },
    uSunCol: { value: lin('#FFE2B0', 1.25) },      // hard warm key (linear, already divided by pi)
    uSky: { value: lin('#CFC9B8', 0.5) },         // from above
    uFill: { value: lin('#8E8A93', 0.52) },         // violet-grey from the side away from the sun and from below
    uWarm: { value: lin('#EADFC6', 0.3) },         // the bright fog on the sun's side
    uRim: { value: lin('#F2C566', 0.55) },         // gold edge toward the sun
    uSea: { value: new THREE.Vector3(0.3, 0, 1).normalize() },   // seaward: crust grows on this side
    uSun: { value: 1 }, uSunDown: { value: 1 }, uSmoke: { value: 1 }, uWet: { value: 0 }, uVeilGain: { value: 1 }, uVeilEven: { value: 0 }, uVeilLow: { value: 0 },
    uAxis: { value: new THREE.Vector3(-0.83, 0.13, 0.55).normalize() }, uWindSpeed: { value: 2.6 },   // plume axis (downwind, a little up) and wind in m/s
    uBone: { value: lin(palette[0], 0.8) }, uTan: { value: lin('#B9A27C', 0.9) }, uGold: { value: lin(palette[2]) },
    uRust: { value: lin(palette[4], 0.7) }, uLichen: { value: lin('#8C9A7A', 0.75) }, uDark: { value: lin(palette[6], 0.55) },
    uGreen: { value: lin(palette[3], 0.8) },
    uCover: { value: null },                    // the world's map of where the sward stands (same rectangle as uMap), or none: shadows then lie on the ground only
    uMap: { value: null }, uMapRect: { value: new THREE.Vector4(0, 0, 0, 28) },   // the world's water-distance map (x0, z0, 1/size, cap); z = 0 means none
    uSpore: { value: new THREE.Vector3(0.41, 0.185, 0.078) },
    // k1b: the fog has a bright side.  Colour of the fog toward the sun, away from it, the glow round the sun, and how much of
    // this directional colour the scene fog takes (1 in the fog half, falling as the air clears): see dirFog below.
    uFogS: { value: new THREE.Vector3(0.8, 0.72, 0.55) }, uFogA: { value: new THREE.Vector3(0.45, 0.43, 0.4) }, uFogG: { value: new THREE.Vector3(1, 0.9, 0.7) }, uFogK: { value: 0 },   // the spore tassels: russet-orange, lighter and less saturated than the crust's rust so that they never read as red flowers
  };
}

// k1b: luminous fog.  A fog: true ShaderMaterial that uses the three.js fog chunks is rewritten (once, at build, before it is
// ever compiled) so that what it fades to is the fog's colour IN THAT DIRECTION: cream and gold toward the sun, putty away from
// it, the same function the world's sky dome draws, so a far pillar melts into the sky that is behind it.  uFogK 0 = plain fog.
const DFOG_FRAG = /* glsl */`
varying vec3 vFogDir; uniform vec3 uFogS, uFogA, uFogG, uFogSunD; uniform float uFogK;
vec3 dfogC(){
  vec3 d = vFogDir / max(length(vFogDir), 1e-4);
  vec2 sh = uFogSunD.xz / max(length(uFogSunD.xz), 1e-4);
  float side = .5 + .5 * dot(d.xz / max(length(d.xz), 1e-4), sh);
  float g = max(dot(d, uFogSunD), 0.), g2 = g * g, g8 = g2 * g2; g8 *= g8;
  vec3 f = mix(uFogA, uFogS, side * mix(side, 1., .35)) + uFogG * (.05 + .95 * side) * (.05 + .13 * g2 + .3 * g8);
  return mix(fogColor, f, clamp(uFogK, 0., 1.));
}
#define fogColor dfogC()
`;
export function dirFog(mat, shared) {
  if (!mat || !mat.isShaderMaterial || !mat.fog || mat.userData.dirFog) return false;
  const v = mat.vertexShader, f = mat.fragmentShader;
  if (!v.includes('#include <fog_pars_vertex>') || !v.includes('#include <fog_vertex>') || !f.includes('#include <fog_pars_fragment>')) return false;
  mat.vertexShader = v.replace('#include <fog_pars_vertex>', '#include <fog_pars_vertex>\nvarying vec3 vFogDir;')
    .replace('#include <fog_vertex>', '#include <fog_vertex>\n  vFogDir = transpose(mat3(viewMatrix)) * mvPosition.xyz;');
  mat.fragmentShader = f.replace('#include <fog_pars_fragment>', '#include <fog_pars_fragment>\n' + DFOG_FRAG);
  mat.uniforms.uFogS = shared.uFogS; mat.uniforms.uFogA = shared.uFogA; mat.uniforms.uFogG = shared.uFogG; mat.uniforms.uFogK = shared.uFogK; mat.uniforms.uFogSunD = shared.uSunDir;
  mat.userData.dirFog = true;
  return true;
}

const GLSL_NOISE = /* glsl */`
float h31(vec3 p){ p = fract(p * vec3(.1031, .1030, .0973)); p += dot(p, p.yxz + 33.33); return fract((p.x + p.y) * p.z); }
float vn(vec3 p){ vec3 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(mix(h31(i), h31(i + vec3(1,0,0)), f.x), mix(h31(i + vec3(0,1,0)), h31(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(h31(i + vec3(0,0,1)), h31(i + vec3(1,0,1)), f.x), mix(h31(i + vec3(0,1,1)), h31(i + vec3(1,1,1)), f.x), f.y), f.z); }
float fbm3(vec3 p){ return .5 * vn(p) + .3 * vn(p * 2.1 + 7.) + .2 * vn(p * 4.3 + 13.); }
`;

const PILLAR_VERT = /* glsl */`
attribute vec4 aData;
#ifdef USE_INSTANCING
attribute vec2 iSeed;
#endif
uniform float uSeed, uH;
varying vec3 vWp, vN, vOp; varying vec4 vData; varying vec2 vSeedH;
#include <fog_pars_vertex>
void main(){
  #ifdef USE_INSTANCING
    mat4 M = modelMatrix * instanceMatrix; vSeedH = vec2(iSeed.x, uH);
  #else
    mat4 M = modelMatrix; vSeedH = vec2(uSeed, uH);
  #endif
  vec4 wp = M * vec4(position, 1.);
  vWp = wp.xyz; vOp = position; vData = aData;
  vN = mat3(M) * normal;
  vec4 mvPosition = viewMatrix * wp;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;

const PILLAR_FRAG = /* glsl */`
uniform vec3 uSunDir, uSunCol, uSky, uFill, uWarm, uRim, uSea, uBone, uTan, uGold, uRust, uLichen, uDark;
uniform float uSun, uSunDown, uSmoke, uWet, uTime, uFlutes, uBands, uWaterY, uLie; uniform vec3 uAxis;
varying vec3 vWp, vN, vOp; varying vec4 vData; varying vec2 vSeedH;
#include <common>
#include <fog_pars_fragment>
${GLSL_NOISE}
void main(){
  float w = vData.x, th = vData.y * 6.2831853, ao = vData.z, cap = vData.w, seed = vSeedH.x;
  ao *= 1. - uBands * .15 * smoothstep(.55, 1., fract(w * 2.7 + seed + .4 * vn(vec3(w * 1.3, seed, 3.)))) * (1. - step(.5, abs(cap)));      // far meshes carry no drum rows: the shade under each drum is drawn
  float tN = clamp(w / max(vSeedH.y, .1), 0., 1.);
  vec2 cs = vec2(cos(th), sin(th));
  vec3 N = normalize(vN + vec3(0., 1e-5, 0.));
  vec3 V = cameraPosition - vWp; float dist = length(V); V /= max(dist, 1e-4);
  float body = 1. - step(.5, abs(cap));
  float lod = 1. / (1. + dist * dist * .0022);
  // fluting and fine growth lines, in the normal
  // n4: the flutes run along the pillar's own axis (uAxis: straight up for one that stands, so live's line to the letter;
  // along the trunk for the one that lies, whose back faces the sky: the old cross with 'up' had no direction there and
  // lit the back in broad zebra stripes)
  vec3 T = cross(uAxis, N); T /= max(length(T), 1e-3);
  float wob = vn(vec3(cs * 3. + seed, w * .7));
  float ph = th * uFlutes + wob * 5.;
  float ph2 = th * (floor(uFlutes * .5) + 3.) + wob * 7. + 1.3;        // whole numbers of flutes: no seam
  float fl = sin(ph) * .65 + sin(ph2) * .35;
  float dfl = cos(ph) * .65 + cos(ph2) * .3;
  // n4: on the lying trunk a flute narrower than a pixel or two is not drawn (by the flute phase's own screen derivative):
  // 84 flutes under-sampled read as a few broad stripes that swim as the lens comes over
  { float flK = mix(1., 1. - smoothstep(1., 2.6, fwidth(ph)), uLie); fl *= flK; dfl *= flK; }
  float gl = sin(w * 70. + wob * 9.);
  float upK = uLie * smoothstep(.1, .9, N.y);                              // the back of the one that lies (0 on every pillar that stands)
  N = normalize(N + body * mix(.55, 1., lod) * (T * dfl * .42 + uAxis * gl * .08));
  // albedo
  vec3 q = vOp + seed;
  float big = fbm3(q * .8), fine = vn(q * 22.);
  vec3 alb = uBone * mix(.8, 1.05, big) * mix(.92, 1.04, fine);
  alb *= mix(.88, 1.06, vn(vec3(w * 2.6, seed, 1.))) * vec3(1., mix(.96, 1.01, vn(vec3(w * 1.1, seed, 7.))), mix(.9, 1.02, big));
  alb *= 1. - body * lod * .16 * smoothstep(.68, .9, vn(q * 55.));
  alb *= 1. + body * mix(.5, 1., lod) * fl * .17;
  // k1b: soft-edged bands of ochre, pale rust and slate lying round the drums (their edges wander with the girth), and close
  // to, a fibrous grain running up the flank: fine tubes, not wood
  float bw = w + .22 * vn(vec3(cs * 1.7 + seed, w * .5));
  float bn = vn(vec3(bw * 1.25, seed * 1.7, 2.)), bn2 = vn(vec3(bw * .62 + 5., seed, 9.)), bn3 = vn(vec3(bw * 2.9, seed * .7, 4.));
  vec3 bandT = mix(vec3(1.1, .95, .7), vec3(.8, .83, .93), smoothstep(.3, .7, bn));
  bandT = mix(bandT, vec3(1.14, .8, .6), smoothstep(.55, .85, bn2) * .7);
  alb *= mix(vec3(1.), bandT, body * .62) * (1. - body * .16 * smoothstep(.45, .8, bn3));
  float nearK = 1. / (1. + dist * dist * .012);
  float fib = vn(vec3(cs * 46. + seed, w * 1.7)) * .6 + vn(vec3(cs * 110. - seed, w * 3.1)) * .4;
  alb *= 1. + body * nearK * (fib - .5) * .5;
  float strk = vn(vec3(cs * 6.5 + seed, w * .22)); strk = smoothstep(.5, .78, strk) * (.3 + .7 * vn(vec3(cs * 2. - seed, w * .9)));
  // n4: on a pillar that lies (uLie) rain runs round the girth, not along it: fine streaks down each flank from the back
  float strkL = smoothstep(.46, .8, vn(vec3(w * 7.5 + seed, cs * .8))) * (.35 + .65 * vn(vec3(w * 1.9 - seed, cs * 2.))) * smoothstep(-.75, .35, 1. - abs(N.y) * 1.2);
  strk = mix(strk, strkL, uLie);
  strk = clamp(strk + (1. - ao) * .35 + uWet * .35 * vn(vec3(cs * 3., w * .3 + seed)), 0., 1.) * body;
  float zone = smoothstep(.6, .73, tN + .09 * (vn(vec3(cs * 3.5 + seed, w * 1.3)) - .5)) * body * (1. - uLie);      // n4: the one that lies grows no more: no pale velvet top (it was the white tongue under the lens), no gold fuzz
  alb = mix(alb, uDark + alb * .3, strk * mix(.5, .8, uLie) * (1. - zone * .6));
  float seaward = smoothstep(-.15, .75, dot(N, uSea));
  float cr = fbm3(q * 1.5 + 31.);
  float crust = smoothstep(.55, .62, cr * (.5 + .62 * seaward) + .04 * (1. - smoothstep(0., 2.2, w)) + (fine - .5) * .06 + .27 * upK) * (1. - zone) * body;      // a lying one carries its grey-green crust in broad patches along the whole of its back, where rain stands
  vec3 crustCol = mix(mix(uLichen, alb, .35), mix(uRust * vec3(1.25, 1.5, 1.6), alb, .5), smoothstep(.6, .7, vn(q * 1.1 + 57.)) * smoothstep(.5, 1.6, w)) * mix(.82, 1.1, vn(q * 13.)) * mix(.88, 1.06, fine);
  alb = mix(alb, crustCol, crust * .8);
  // n4: the back of the lying trunk is weathered: greyer and a tone down from the flanks' bone (it was the palest thing
  // in the frame, a white tongue at the bottom edge as the lens came over), rust bleeding from the seams between drums
  { float seam = smoothstep(.72, .98, 1. - ao) + .5 * smoothstep(.6, .8, vn(vec3(w * 3.3 + seed, cs * 1.4)));
    float rustK = upK * body * clamp(seam, 0., 1.) * smoothstep(.38, .62, vn(q * 2.3 + 71.)) * (1. - crust * .7);
    alb = mix(alb, alb * vec3(.64, .66, .62) + uDark * .1, upK * body * (.5 + .4 * big) * (1. - crust));
    alb = mix(alb, uRust * mix(.8, 1.15, fine), rustK * .6); }
  vec3 velvet = uTan * mix(.82, 1.08, vn(q * 34.)) * mix(.88, 1.06, big);
  alb = mix(alb, velvet, zone * .9);
  // the broken top and the sawn end: pale flesh with growth rings
  float rho = abs(cap) - 1.;
  float ringW = mix(sin(rho * 56.5 + 2. * vn(q * 2.5)) * .5 + .5, sin(rho * 251.3 + 4. * vn(q * 2.5)) * .5 + .5, 1. - smoothstep(1.4, 3.2, dist));     // forty rings close to, a dozen bold ones from further off (no moire)
  vec3 flesh = mix(uBone * 1.04, uTan, .35 + .3 * step(cap, -.5)) * mix(.85, 1., ringW) * mix(.85, 1.05, fine);
  // n4: the broken end of the fallen pillar: growth rings.  Mend 2: the forty fine rings are gathered in six broad bands of
  // bone and tan (decades of growth: six and a half turns of the same radius), which are there at every distance and
  // never move: they are what the end shows from the first sight of it (from 30 m a band is still three pixels wide;
  // the forty fell under a pixel there and the end was one flat tone with lobes).  The fine rings ride on the bands only
  // where the lens resolves them (by their phase's own screen derivative), as a finer grain of the same circles: nothing
  // fades in or out but that grain.  Both are circles round the pith (the phase's wobble is a hundredth of the radius).
  float endK = step(cap, -.5) * (1. - body);
  { float rr = clamp(rho, 0., 1.), wob = vn(q * 2.5);
    float rph = rr * 251.3 + 2.2 * wob, rfw = fwidth(rph), bph = rr * 40.8 + .36 * wob, bfw = fwidth(bph);
    float fineR = (sin(rph) * .5) * (1. - smoothstep(1.1, 2.8, rfw));
    float band = mix(.5, smoothstep(-.45, .45, sin(bph)), 1. - smoothstep(1.1, 2.8, bfw));
    float years = vn(vec3(rr * 11., seed, 5.));
    vec3 fleshE = mix(uBone * 1.07, uBone * vec3(.84, .69, .5), clamp(.12 + .56 * band + .3 * fineR, 0., 1.)) * mix(.9, 1.05, years) * mix(.92, 1.04, fine);
    flesh = mix(flesh, fleshE, endK); }
  alb = mix(alb, flesh, 1. - body);
  float footK = (1. - smoothstep(.0, .5, w + .25 * (vn(vec3(cs * 5. + seed, 3.)) - .5))) * body;      // k1b: the foot: a damp ragged tide mark with crust on it, not a dark boot
  alb = mix(alb, mix(alb * .62, uLichen * .8, smoothstep(.45, .7, vn(q * 4.3 + 9.))), footK * .55);
  alb *= mix(.84, 1., ao);
  { float wl = 1. - smoothstep(uWaterY + .03, uWaterY + .3 + .08 * vn(vec3(vWp.xz * 3., 1.)), vWp.y);      // k1b: a pillar lying in the stream: dark and wet to a ragged line above the water, green just over it
    alb = mix(alb, alb * vec3(.36, .37, .33), wl * .85);
    alb = mix(alb, uLichen * .55, (1. - smoothstep(uWaterY + .2, uWaterY + .46, vWp.y)) * (1. - wl) * .5 * smoothstep(.35, .6, vn(q * 3.7 + 5.))); }
  alb *= mix(1., mix(.3, 1., smoothstep(.2, .9, ao)), 1. - body);
  // light
  vec3 L = uSunDir; float ndl = dot(N, L);
  float sunMask = uSun * smoothstep(0., .22, tN + (1. - body) - (1. - uSunDown * 1.25));
  float diff = clamp((ndl + .08) / 1.08, 0., 1.); diff = mix(diff, smoothstep(0., .45, diff), .55);
  vec3 Lh = L * vec3(1., 0., 1.); Lh /= max(length(Lh), 1e-3);
  float side = .5 + .5 * dot(N, Lh);
  vec3 amb = mix(uFill, uSky, .5 + .5 * N.y) * (1. - .45 * side) + uWarm * side * side;
  amb *= mix(vec3(1.), vec3(.74, .76, 1.12), uSun * (1. - diff) * (1. - .5 * side) * (1. - endK));     // in sunlight the shaded flank goes violet
  amb = mix(amb, dot(amb, vec3(.3, .5, .2)) * vec3(1.16, 1., .8) * 1.12, endK * .85);          // n4: the ringed end is lit by the pale gravel in front of it: bone and tan, never blue
  vec3 col = alb * (uSunCol * diff * sunMask * 1.08 + amb * mix(.62, 1., ao));
  float fres = 1. - max(dot(N, V), 0.); float f3 = fres * fres * fres;
  col += alb * uRim * f3 * smoothstep(-.25, .55, ndl) * (1. + .5 * sunMask);
  float agl = max(-dot(V, L), 0.);                                         // looking toward the sun, light wraps round every edge
  col += alb * uSunCol * fres * fres * agl * agl * smoothstep(-.7, .1, ndl) * sunMask * 1.5;
  // velvet: the smoking zone catches the sun as a soft gold fuzz at its edge
  float breath = vn(vec3(cs * 3. + seed, w * 1.6 - uTime * .7));
  col += zone * uGold * (f3 * .5 + fres * .12 + .1 * breath * breath) * (.25 + .75 * uSmoke) * (.35 + sunMask * smoothstep(-.6, .3, ndl)) * mix(.6, 1.5, breath);
  vec3 Hv = L + V; Hv /= max(length(Hv), 1e-3);
  float sp = max(dot(N, Hv), 0.); sp *= sp; sp *= sp; sp *= sp; sp *= sp;
  col += uSunCol * sp * sunMask * (strk * .5 + uWet * .3) * .5;
  col += (uWarm + uSky * .5) * footK * (.25 + .75 * fres * fres) * .22;                    // the wet sheen at the waterline of the foot
  gl_FragColor = vec4(col, 1.);
  #include <fog_fragment>
}`;

export function pillarMaterial(shared, { seed = 0, height = 8, flutes = 34, bands = 0 } = {}) {
  return new THREE.ShaderMaterial({
    uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...shared, uSeed: { value: seed }, uH: { value: height }, uFlutes: { value: flutes }, uBands: { value: bands }, uWaterY: { value: -1000 }, uLie: { value: 0 }, uAxis: { value: new THREE.Vector3(0, 1, 0) } },
    vertexShader: PILLAR_VERT, fragmentShader: PILLAR_FRAG, fog: true,
  });
}

// ------------------------------------------------------------------------------------------------
// 3. The spore veils: for each pillar top a fixed train of overlapping soft cards along the plume
//    axis (close together at the top, wider and thinner downwind) through which noise wisps scroll
//    with the wind, plus true advected glitter motes.  Two draw calls for any number of pillars.
//    tops: [{ pos: [x, y, z] (local to the returned object), length: 30-60, delay: 0-1, radius, gain }]
// ------------------------------------------------------------------------------------------------
const VEIL_COMMON = /* glsl */`
uniform vec3 uAxis; uniform float uTime, uSmoke, uWindSpeed, uVeilEven, uVeilLow;
attribute vec3 iTop; attribute vec4 iA; attribute vec3 iB;
float amountOf(float delay){ return smoothstep(delay * .7, delay * .7 + .3, uSmoke); }
`;
const VEIL_FOG = /* glsl */`
#ifdef USE_FOG
  #ifdef FOG_EXP2
    float fogF = 1. - exp(-fogDensity * fogDensity * vFogDepth * vFogDepth);
  #else
    float fogF = smoothstep(fogNear, fogFar, vFogDepth);
  #endif
  gl_FragColor.rgb = mix(gl_FragColor.rgb, fogColor * gl_FragColor.a * uFogKeep, fogF);
  gl_FragColor *= 1. - fogF * .55;
#endif
`;

export function makeVeils(shared, tops, { rng, perPillar = 20, motes = 40, detail = 1 } = {}) {
  const K = Math.max(8, Math.round(perPillar * detail)), M = Math.max(10, Math.round(motes * detail)), n = tops.length;
  const quad = new Float32Array([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0]), qi = [0, 1, 2, 0, 2, 3];
  const mk = (count, fill) => {
    const g = new THREE.InstancedBufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(quad, 3)); g.setIndex(qi);
    const top = new Float32Array(count * 3), A = new Float32Array(count * 4), B = new Float32Array(count * 3);
    let c = 0;
    for (let p = 0; p < n; p++) {
      const t = tops[p];
      for (let k = 0; k < count / n; k++, c++) {
        top[c * 3] = t.pos[0]; top[c * 3 + 1] = t.pos[1]; top[c * 3 + 2] = t.pos[2];
        fill(A, c * 4, t, k); B[c * 3] = t.length ?? 45; B[c * 3 + 1] = t.radius ?? 0.3; B[c * 3 + 2] = t.gain ?? 1;
      }
    }
    g.setAttribute('iTop', new THREE.InstancedBufferAttribute(top, 3));
    g.setAttribute('iA', new THREE.InstancedBufferAttribute(A, 4));
    g.setAttribute('iB', new THREE.InstancedBufferAttribute(B, 3));
    g.instanceCount = count;
    return g;
  };
  const veilGeo = mk(n * K, (A, o, t, k) => { A[o] = t.delay ?? 0; A[o + 1] = Math.pow((k + 0.35 + 0.3 * rng()) / K, 1.25); A[o + 2] = rng(); A[o + 3] = rng.range(0.85, 1.2); });
  const moteGeo = mk(n * M, (A, o, t) => { A[o] = t.delay ?? 0; A[o + 1] = rng(); A[o + 2] = rng(); A[o + 3] = rng(); });
  const fogU = () => THREE.UniformsUtils.clone(THREE.UniformsLib.fog);
  const veilMat = new THREE.ShaderMaterial({
    uniforms: { ...fogU(), ...shared, uFogKeep: { value: 1 } }, fog: true, transparent: true, depthWrite: false,
    blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor,
    vertexShader: /* glsl */`
${VEIL_COMMON}
varying vec2 vC; varying vec3 vWp; varying vec3 vK;
#include <fog_pars_vertex>
void main(){
  // n4 (K1): uVeilLow (0 through the foggy opening, 1 once the sun is back after the shower): in the washed air the veil is
  // the short one of the live morning (a third of the opening's long pennant) and its dust SINKS as it drifts: it hangs
  // from the top down toward the plain and lies low among the trunks, never as a streak across the mountain wall
  float f = iA.y, L = iB.x * mix(1., .33, uVeilLow), s = f * L, amt = amountOf(iA.x);
  vec3 side = cross(uAxis, vec3(0., 1., 0.)); side /= max(length(side), 1e-3);
  vec3 lift = cross(side, uAxis);
  float ph = iA.z * 6.283 + iTop.x * .37;
  vec3 c = (modelMatrix * vec4(iTop, 1.)).xyz + uAxis * (s + iB.y)
    + side * (sin(uTime * .55 + s * .13 + ph) * .06 + sin(uTime * .23 - s * .05 + ph * 2.) * .04) * s
    + lift * ((sin(uTime * .41 + s * .11 + ph * 1.7) * .04 + .035) * s + .25)
    + vec3(0., .3, 0.) * sqrt(max(s, 0.)) * (1. - uVeilEven) * (1. - uVeilLow) - vec3(0., .3, 0.) * s * uVeilLow;              // k1: a veil that slants away downwind along the axis (the brief), lifting only a little off the top
  float size = (.34 + iB.y * 1.1 + s * mix(.022, .012, uVeilEven)) * iA.w;
  vec3 R = vec3(viewMatrix[0][0], viewMatrix[1][0], viewMatrix[2][0]), Uv = vec3(viewMatrix[0][1], viewMatrix[1][1], viewMatrix[2][1]);
  vec3 ax = cross(uAxis, c - cameraPosition); float axl = length(ax) / max(length(c - cameraPosition), 1e-3);
  float rb = smoothstep(.2, .6, axl);                         // seen side-on: a ribbon along the wind; seen end-on: a round card
  vec3 X = mix(R, uAxis * mix(5., 2.4, uVeilEven), rb), Y = mix(Uv, ax / max(length(ax), 1e-4), rb);
  vec3 wp = c + (X * position.x + Y * position.y) * size;
  vC = position.xy; vWp = wp;
  // thin with distance downwind, unroll from the top as the pillar starts to smoke
  float thin = (1. - f) * mix(1., .7, smoothstep(0., .5, f)) * mix(.2, 1., max(rb, uVeilEven)) * (1. + 1.2 * (1. - smoothstep(0., .25, f)) * (1. - uVeilEven));      // k1: densest where it leaves the top: a pennant on its pillar, not a band of haze
  thin = mix(thin, .62 * (1. - smoothstep(.55, 1., f)), uVeilEven);
  vK = vec3(thin * amt * smoothstep(0., .18, amt * 1.2 - f) * mix(clamp(L / 36., .3, 1.), 1.3, uVeilEven) * iB.z, f, size);
  vec4 mvPosition = viewMatrix * vec4(wp, 1.);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`,
    fragmentShader: /* glsl */`
uniform vec3 uAxis, uSunDir, uSunCol, uGold, uWarm; uniform float uTime, uSun, uWindSpeed, uFogKeep, uVeilGain, uVeilEven, uVeilLow;
varying vec2 vC; varying vec3 vWp; varying vec3 vK;
#include <common>
#include <fog_pars_fragment>
${GLSL_NOISE}
void main(){
  float fx = clamp(1. - vC.x * vC.x, 0., 1.), fy = clamp(1. - vC.y * vC.y, 0., 1.); float fall = fx * fx * fy * fy * mix(fy, 1., uVeilEven);      // k1: a streak along the wind, soft at both ends, never a round puff
  vec3 p = vWp - uAxis * uTime * uWindSpeed;
  // the wisps are drawn in the plume's own frame (along the wind, up across it, and only weakly in depth), so the
  // twenty cards agree with one another and the veil streams in threads instead of averaging to a blur
  vec3 sdv = cross(uAxis, vec3(0., 1., 0.)); sdv /= max(length(sdv), 1e-3); vec3 lft = cross(sdv, uAxis);
  float al = dot(p, uAxis), hl = dot(p, lft), sl = dot(p, sdv);
  vec3 q = vec3(al * .1, hl * .8, sl * .22);
  float wisp = .6 * vn(q) + .4 * vn(q * 2.7 + 9.);
  float fine = vn(vec3(al * .12, hl * 2.6, sl * .5) + 3.);
  float torn = vn(q * .31 + vec3(al * .05, 0., 0.) + 21.);
  float fil = smoothstep(.4, .8, vn(vec3(al * .22, hl * 2.1, sl * .9) + 11.));           // soft streaming strands (polish 4: no fine level stripes, which read as a banded patch on the hills)
  float root = 1. - smoothstep(0., .07, vK.y);                 // at the top itself the veil is a soft whole breath, never a gap
  float body = (.3 + .95 * smoothstep(.36, .76, wisp + (torn - .5) * .55 * smoothstep(.04, .3, vK.y))) * mix(.5, 1.3, fine) * mix(.5 + .8 * fil, .6 + 1.1 * fil, uVeilEven);   // threads, not a soft body
  float dens = fall * mix(body, mix(.75, .3, uVeilEven), root);
  vec3 ray = vWp - cameraPosition; float dist = length(ray); ray /= max(dist, 1e-4);
  float c = dot(ray, uSunDir), fw = max(c, 0.); fw *= fw; fw *= fw;
  float lit = mix(mix(.42, .06, uVeilLow) + mix(.58, .94, uVeilLow) * smoothstep(mix(.15, .45, uVeilLow), .96, c), 1., uVeilEven);                      // dust in light: brightest where the sun stands behind it; in the washed air it shows there only (live's law)
  // n4 (K4): the card's edge.  The amount was capped AFTER the falloff, so a dense card was one flat tone to its very edge:
  // a lit square.  Now every card ends in a round soft rim of its own (nothing is left at the inscribed circle), whatever its density.
  vec2 cc = clamp(vC, -1., 1.); float rim = 1. - smoothstep(.3, 1., dot(cc, cc));
  float farK = mix(mix(1., .72, smoothstep(40., 200., dist)), mix(1., .1, smoothstep(15., 58., dist)), uVeilLow);      // n4: in the washed air, live's own law: far off only the glitter is left, never a pale smear across the hills
  float a = min(mix(.62, .2, uVeilEven) * dens * clamp(vK.x, 0., 4.) * uVeilGain, mix(.17, .2, uVeilEven)) * rim * lit * smoothstep(1.2, mix(9., 7., uVeilEven), dist) * mix(farK, mix(1., .5, smoothstep(40., 170., dist)), uVeilEven) * mix(.5, 1., smoothstep(7., 34., dist));
  float core = (1. - vK.y); core *= core;
  vec3 gold = mix(uGold, vec3(1., .76, .3), .7) * 1.5;      // pale gold dust, not orange, under an amber sun too
  vec3 lightc = mix(uSunCol, vec3(dot(uSunCol, vec3(.3333))), .5);
  float fw1 = max(c, 0.);
  vec3 col = gold * lightc * (.8 + .5 * (c * .5 + .5) + 1.2 * fw1 * fw1 + 3.2 * fw + .45 * core * min(dens, 1.5)) * mix(.55, 1., uSun) + uWarm * .3 * gold;
  col = min(col, gold * 2.3);                                          // backlit it burns gold, never white
  gl_FragColor = vec4(col * a, a * mix(.5, .9, uVeilEven));          // sunlit dust: it glows more than it hides
  ${VEIL_FOG}
}`,
  });
  const moteMat = new THREE.ShaderMaterial({
    uniforms: { ...fogU(), ...shared, uFogKeep: { value: 0 } }, fog: true, transparent: true, depthWrite: false,
    blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor,
    vertexShader: /* glsl */`
${VEIL_COMMON}
varying vec2 vC; varying float vI;
#include <fog_pars_vertex>
void main(){
  float L = iB.x * mix(1., .33, uVeilLow), amt = amountOf(iA.x);            // n4 (K3): the glitter streams close off each top, as in the live morning
  float a = fract(uTime * uWindSpeed / L * mix(.8, 1.2, iA.w) + iA.y), s = a * L;
  vec3 side = cross(uAxis, vec3(0., 1., 0.)); side /= max(length(side), 1e-3);
  vec3 lift = cross(side, uAxis);
  float ang = iA.z * 6.283 * 7., rad = sqrt(fract(iA.z * 13.7)) * (.3 + iB.y + s * .085);
  vec3 c = (modelMatrix * vec4(iTop, 1.)).xyz + uAxis * (s + iB.y) + lift * (.035 * s + .25)
    + (side * cos(ang) + lift * sin(ang)) * rad
    + (side * sin(uTime * .9 + iA.w * 40.) + lift * cos(uTime * .7 + iA.z * 31.)) * (.08 + .012 * s);
  vec4 mvPosition = viewMatrix * vec4(c, 1.);
  float d = -mvPosition.z;
  float size = max(.03, d * .0027);
  mvPosition.xy += position.xy * size;
  float tw = .5 + .5 * sin(uTime * (2.2 + 3. * iA.w) + iA.z * 50.); tw *= tw;
  vI = (.25 + .75 * tw) * amt * smoothstep(0., .05, a) * (1. - a) * smoothstep(0., .25, amt * 1.25 - a) * smoothstep(.6, 3., d) * min(1., .03 / size * 4.5);
  vC = position.xy;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`,
    fragmentShader: /* glsl */`
uniform vec3 uGold, uSunCol; uniform float uSun, uFogKeep;
varying vec2 vC; varying float vI;
#include <common>
#include <fog_pars_fragment>
void main(){
  float r2 = dot(vC, vC); float f = clamp(1. - r2, 0., 1.); f *= f * f;
  vec3 col = mix(uGold, vec3(.96, .66, .22), .55) * mix(uSunCol, vec3(dot(uSunCol, vec3(.3333))), .5) * 4.6 * mix(.35, 1., uSun) * f * vI;
  gl_FragColor = vec4(col, 1.);
  ${VEIL_FOG}
}`,
  });
  const veil = new THREE.Mesh(veilGeo, veilMat), mote = new THREE.Mesh(moteGeo, moteMat);
  veil.frustumCulled = mote.frustumCulled = false; veil.renderOrder = 6; mote.renderOrder = 7;
  const object = new THREE.Group(); object.add(veil, mote); object.name = 'veils';
  return { object, veil, mote, triangles: (n * K + n * M) * 2 };
}

// ------------------------------------------------------------------------------------------------
// 4. Sun shadows laid on flat ground (the world has no shadow map to spare for thirty pillars):
//    each pillar's centre line is thrown along the sun direction in the vertex shader, so the
//    shadows follow the shared uSunDir and fade in with uSun.  One draw call for all pillars.
//    pillars: [{ spec, x, z, rotY, scale }]
// ------------------------------------------------------------------------------------------------
export function makeShadows(shared, pillars, noise) {
  const pos = [], dat = [], idx = [], across = [[-1, 0], [-0.5, 1], [0.5, 1], [1, 0]], ROWS = 8;
  for (const P of pillars) {
    const S = pillarSurface(P.spec, noise), sc = P.scale ?? 1, cr = Math.cos(P.rotY ?? 0), sr = Math.sin(P.rotY ?? 0), H = P.spec.H;
    const base = pos.length / 3, RW = P.rows ?? ROWS;      // mend 2: a trunk of the far field (beyond 12 m of the route) casts its shadow in four lengths, not eight: its lean bends 2 cm between two of them
    for (let j = 0; j <= RW; j++) {
      const t = j / RW, y = t * H, c = S.centre(y);
      const r = (P.girth ?? 1) * P.spec.r0 * (1 - (1 - P.spec.taper) * Math.pow(t, 1.5)) * (1 + P.spec.flare * Math.exp(-y / 0.34)) * (j === RW ? 0.55 : 1);
      const x = (c[0] * cr + c[1] * sr) * sc + P.x, z = (-c[0] * sr + c[1] * cr) * sc + P.z;
      for (const [s, a] of across) { pos.push(x, y * sc, z); dat.push(s, r * sc, t, a * (j === RW ? 0.4 : 1) * (P.gain ?? 1)); }
    }
    for (let j = 0; j < RW; j++) for (let i = 0; i < 3; i++) { const a = base + j * 4 + i, b = a + 4; idx.push(a, b, a + 1, b, b + 1, a + 1); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('aS', new THREE.Float32BufferAttribute(dat, 4));
  g.setIndex(idx);
  const m = new THREE.ShaderMaterial({
    uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...shared, uShade: { value: lin('#39344F', 1) }, uLift: { value: 0.05 } },
    fog: true, transparent: true, depthWrite: false, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
    blending: THREE.CustomBlending, blendSrc: THREE.DstColorFactor, blendDst: THREE.ZeroFactor, blendSrcAlpha: THREE.ZeroFactor, blendDstAlpha: THREE.OneFactor,      // polish 4: the shadow darkens the ground it lies on (its stones and cracks stay in it) instead of painting a violet strip over it
    vertexShader: /* glsl */`
attribute vec4 aS; uniform vec3 uSunDir; uniform float uLift; uniform sampler2D uCover; uniform vec4 uMapRect; varying float vA; varying vec2 vXZ;
#include <fog_pars_vertex>
void main(){
  vec4 base = modelMatrix * vec4(position.x, 0., position.z, 1.);
  float h = position.y, ly = max(uSunDir.y, .14);
  vec2 d = -uSunDir.xz; float dl = length(d); d = dl > 1e-3 ? d / dl : vec2(1., 0.);
  // where the sward stands the shadow lies ON it, at knee height (it used to darken only the soil between the stems, as brown strips)
  vec2 g0 = base.xz + d * dl / ly * h;
  float lift = uLift + .32 * smoothstep(.04, .35, textureLod(uCover, clamp((g0 - uMapRect.xy) * uMapRect.z, .002, .998), 0.).r) * step(1e-6, uMapRect.z);
  vec3 wp = base.xyz; wp.xz += d * dl / ly * max(h - lift, 0.); wp.y += lift;
  float wide = aS.y * 1.25 + .1 + h * .075;                 // penumbra widens with height
  wp.xz += vec2(-d.y, d.x) * aS.x * wide;
  vA = aS.w * mix(1., .16, aS.z * aS.z) * mix(1., aS.y / max(wide * .9, 1e-3), .7); vXZ = wp.xz;
  vec4 mvPosition = viewMatrix * vec4(wp, 1.);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`,
    fragmentShader: /* glsl */`
uniform vec3 uShade; uniform float uSun; uniform sampler2D uMap; uniform vec4 uMapRect; varying float vA; varying vec2 vXZ;
#include <common>
#include <fog_pars_fragment>
void main(){
  float wd = mix(9., texture2D(uMap, clamp((vXZ - uMapRect.xy) * uMapRect.z, .002, .998)).r, step(1e-6, uMapRect.z));
  float va = clamp(vA, 0., 1.); float a = va * va * (3. - 2. * va) * .54 * uSun * uSun * mix(.28, 1., smoothstep(-.5, .3, wd));
  float ff = 0.;
  #ifdef USE_FOG
    #ifdef FOG_EXP2
      ff = 1. - exp(-fogDensity * fogDensity * vFogDepth * vFogDepth);
    #else
      ff = smoothstep(fogNear, fogFar, vFogDepth);
    #endif
  #endif
  a *= 1.5 * (1. - clamp(ff, 0., 1.));
  gl_FragColor = vec4(mix(vec3(1.), vec3(.56, .56, .7), clamp(a, 0., 1.)), 1.);
}`,
  });
  const mesh = new THREE.Mesh(g, m); mesh.frustumCulled = false; mesh.renderOrder = 2; mesh.name = 'pillarShadows';
  return mesh;
}

// ------------------------------------------------------------------------------------------------
// 6. The hero: the Elder, its young, its veil, its shadow and the ground it stands in.
// ------------------------------------------------------------------------------------------------
export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng.fork ? ctx.rng.fork('elder') : ctx.rng;
  const noise = ctx.noise ?? makeNoise(Math.floor(rng() * 1e9));
  const palette = opts.palette ?? PILLAR_PALETTE, detail = clamp(opts.detail ?? ctx.quality?.detail ?? 1, 0.6, 1);
  const shared = opts.shared ?? makeShared(palette);
  const object = new THREE.Group(); object.name = 'pillars-before-trees-hero';
  let tris = 0;

  // the Elder: 8.8 m, 1.2 m thick above the flare, leaning away from the sea
  const elderSpec = pillarSpec(rng, { height: opts.height ?? 8.8, thick: 1.3, lean: rng.range(3.5, 6), taper: rng.range(0.52, 0.58), leanAz: rng.range(-2.4, -0.7), top: opts.top });
  await ctx.yield();
  const elderGeo = await pillarGeometryAsync(elderSpec, noise, 2, ctx.yield);
  await ctx.yield();
  const elderMat = pillarMaterial(shared, { seed: elderSpec.seed, height: elderSpec.H, flutes: 38 });
  const elder = new THREE.Mesh(elderGeo, elderMat); elder.name = 'elder'; object.add(elder); tris += elderGeo.userData.triangles;
  await ctx.yield();

  // the young ones: four to six pale thumbs 1-2.3 m tall, in a loose arc on the +Z side the lens comes in from (in the lower frame of the approach), clear of the pass
  const nYoung = rng.int(4, 6), young = [], yGeos = [], a0 = rng.range(0.2, 0.45);
  for (let i = 0; i < nYoung; i++) {
    const sp = pillarSpec(rng, { height: rng.range(1.0, 2.3), lean: rng.range(2, 7) });
    const a = clamp(a0 + (i - nYoung / 2) * rng.range(0.2, 0.3), -0.5, 1.0), d = rng.range(2.5, 4.3) + (i % 2) * 0.9;
    const x = Math.sin(a) * d, z = Math.cos(a) * d;
    const g = await pillarGeometryAsync(sp, noise, 1, ctx.yield); g.translate(x, 0, z);
    const ad = g.attributes.aData; for (let k = 0; k < ad.count; k++) ad.setX(k, ad.getX(k) * 8 / sp.H);
    yGeos.push(g); young.push({ spec: sp, x, z, top: [g.userData.top[0] + x, g.userData.top[1], g.userData.top[2] + z], rTop: g.userData.rTop });
    tris += g.userData.triangles;
    await ctx.yield();
  }
  const youngMesh = new THREE.Mesh(mergeGeometries(yGeos), pillarMaterial(shared, { seed: elderSpec.seed + 11, height: 8, flutes: 22 }));
  youngMesh.name = 'young'; object.add(youngMesh); yGeos.forEach((g) => g.dispose());

  // veils: the Elder's is long; the young ones only breathe a wisp
  const eTop = elderGeo.userData.top;
  const eLen = opts.veilLength ?? rng.range(46, 58), tops = [];
  for (let i = 0; i < 2; i++) tops.push({ pos: eTop, length: eLen, delay: 0, radius: elderGeo.userData.rTop, gain: 0.55 });   // three trains interleaved: the Elder's veil is seen from 10 m
  for (const y of young) tops.push({ pos: y.top, length: rng.range(7, 12), delay: rng.range(0.25, 0.9), radius: y.rTop, gain: 0.45 });
  const veils = makeVeils(shared, tops, { rng, perPillar: 22, motes: 60, detail });
  object.add(veils.object); tris += veils.triangles;
  await ctx.yield();

  const shadows = makeShadows(shared, [{ spec: elderSpec, x: 0, z: 0, gain: 0.85 }, ...young.map((y) => ({ spec: y.spec, x: y.x, z: y.z, gain: 0.45 }))], noise);   // the young stand in the Elder's own shade: their shadows must not stack to a black pit
  object.add(shadows); tris += shadows.geometry.index.count / 3;
  await ctx.yield();

  const extras = await buildSurround(ctx, rng, noise, shared, { detail, young, elderSpec, apron: opts.apron !== false, sward: opts.sward !== false, swardCount: opts.swardCount });
  if (extras.object) { object.add(extras.object); tris += extras.triangles; }
  // optionally the rest of the plain, in the hero's local space (see makePillarField)
  const fieldItems = opts.field ?? null;
  const field = fieldItems ? await makePillarField(ctx, shared, fieldItems, { rng, noise, detail }) : null;
  if (field) { object.add(field.object); tris += field.triangles; }

  // ---- state ----
  let autoLight = !opts.light, sunLight = null, searched = false, progressSet = false;
  const tmp = new THREE.Vector3(), tmp2 = new THREE.Vector3();
  const setLight = (l = {}) => {
    autoLight = false;
    if (l.sunDir) shared.uSunDir.value.copy(l.sunDir).normalize();
    if (l.sunColor) shared.uSunCol.value.copy(l.sunColor);
    if (l.sky) shared.uSky.value.copy(l.sky);
    if (l.fill) shared.uFill.value.copy(l.fill);
    if (l.warm) shared.uWarm.value.copy(l.warm);
    if (l.rim) shared.uRim.value.copy(l.rim);
    if (l.sea) shared.uSea.value.copy(l.sea).normalize();
  };
  if (opts.light) setLight(opts.light);
  // wind: a horizontal direction (x, z), a speed in m/s and how steeply the veils rise (1 = straight up, the still-day event)
  const setWind = (x, z, speed = 2.6, rise = 0.13) => {
    const l = Math.hypot(x, z) || 1; shared.uAxis.value.set(x / l * (1 - rise), rise, z / l * (1 - rise)).normalize(); shared.uWindSpeed.value = speed;
  };
  if (opts.wind) setWind(opts.wind[0], opts.wind[1], opts.windSpeed, opts.rise);
  const setState = (s = {}) => {
    progressSet = true;
    if (s.sun !== undefined) shared.uSun.value = s.sun;
    if (s.sunDown !== undefined) shared.uSunDown.value = s.sunDown;
    if (s.smoke !== undefined) shared.uSmoke.value = s.smoke;
    if (s.wet !== undefined) shared.uWet.value = s.wet;
  };
  // the brief's timing: the sun term rises over u 0.44-0.60, walks down the Elder from 0.455, the tops start to smoke at 0.46
  const setProgress = (u) => setState({ sun: smoothstep(0.44, 0.6, u), sunDown: smoothstep(0.455, 0.57, u), smoke: smoothstep(0.46, 0.58, u) });
  if (opts.state) setState(opts.state);

  return {
    object, radius: 7, height: elderSpec.H, center: new THREE.Vector3(0, elderSpec.H * 0.56, 0),
    shared, setLight, setWind, setState, setProgress, elderSpec, field, triangles: tris,
    anchors: {
      top: new THREE.Vector3(eTop[0], eTop[1], eTop[2]),                 // the smoking top: put the gaze poi here (u 0.42-0.56)
      // the brief's pass: Elder on the left at 10 m with the lens level with its top, then on round behind it, climbing
      flyThrough: [[30, 2, 48], [22, 3.2, 32], [15.5, 5.2, 17], [10.6, 7.6, 3], [8.5, 9, -12], [0, 10.4, -27], [-14, 11, -38]].map((p) => new THREE.Vector3(...p)),
      viewpoints: { approach: new THREE.Vector3(22, 3.2, 32), beside: new THREE.Vector3(10.6, 7.6, 3), reveal: new THREE.Vector3(0, 10.4, -27) },
      young: young.map((y) => new THREE.Vector3(y.x, 0, y.z)),
      veilAxis: shared.uAxis.value,                                       // live: unit direction the veil streams in (local = world if unrotated)
      // only a suggestion: the brief seats the ring between two gateposts at the end of the avenue, not at the Elder
      portalSeat: { position: new THREE.Vector3(-120, 7.5, -120), facing: new THREE.Vector3(0.707, 0, 0.707) },
      clearRadius: 9.5,                                                   // nothing of the hero but veil and shadow reaches beyond this
    },
    update(dt, time, camera) {
      shared.uTime.value = time;
      if (autoLight) {
        if (!searched && object.parent) {
          searched = true; let root = object.parent; while (root.parent) root = root.parent;
          root.traverse((o) => { if (o.isDirectionalLight && (!sunLight || o.intensity > sunLight.intensity)) sunLight = o; });
        }
        if (sunLight) {
          sunLight.getWorldPosition(tmp); sunLight.target.getWorldPosition(tmp2); tmp.sub(tmp2);
          if (tmp.lengthSq() > 1e-6) shared.uSunDir.value.copy(tmp).normalize();
          const k = sunLight.intensity / Math.PI * 1.05;
          shared.uSunCol.value.set(sunLight.color.r * k, sunLight.color.g * k, sunLight.color.b * k);
        }
      }
      void progressSet; void camera; void dt;
    },
    dispose() {},
    ground: true, groundY: 0,
  };
}

// ------------------------------------------------------------------------------------------------
// 5. Round the foot: a ring of knee-high Psilophyton (wiry leafless stems that fork again and again,
//    paired rust tassels drooping from the tips, nodding in the wind) and an apron of gravel, dark
//    crust and damp green that fades out into the world's own ground.
// ------------------------------------------------------------------------------------------------
// One clump as camera-facing ribbons: position = centre line, aTan = (tangent xyz, side -1/+1),
// aK = (half width in m, 0 stem / 1 tassel, height 0-1 for sway, random).
export function psilophytonGeometry(rng, { stems = 5, height = 0.6 } = {}) {
  const pos = [], tan = [], k = [], idx = [];
  const seg = (a, b, wa, wb, kind, rnd) => {
    const t = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], l = Math.hypot(t[0], t[1], t[2]) || 1, v = pos.length / 3;
    for (const [p, w] of [[a, wa], [b, wb]]) for (const s of [-1, 1]) { pos.push(p[0], p[1], p[2]); tan.push(t[0] / l, t[1] / l, t[2] / l, s); k.push(w, kind, clamp(p[1] / height, 0, 1.3), rnd); }
    idx.push(v, v + 1, v + 2, v + 1, v + 3, v + 2);
  };
  const tassel = (p, dir, rnd) => {                         // a spindle hanging from the tip, in two segments
    const L = rng.range(0.05, 0.08) * height / 0.6, m = [p[0] + dir[0] * L * 0.3, p[1] - L * 0.5, p[2] + dir[2] * L * 0.3], e = [p[0] + dir[0] * L * 0.36, p[1] - L, p[2] + dir[2] * L * 0.36];
    seg(p, m, 0.004, 0.013, 1, rnd); seg(m, e, 0.013, 0.002, 1, rnd);
  };
  const grow = (p, dir, len, depth, w, rnd) => {
    const e = [p[0] + dir[0] * len, p[1] + dir[1] * len, p[2] + dir[2] * len];
    seg(p, e, w, w * 0.8, 0, rnd);
    if (depth === 0) { const a = rng() * TAU, d = [Math.cos(a), 0, Math.sin(a)]; tassel(e, d, rnd); tassel(e, [-d[0], 0, -d[2]], rnd); return; }
    const a = rng() * TAU, sp = rng.range(0.28, 0.5);
    for (const s of [-1, 1]) {
      const d = [dir[0] + Math.cos(a) * sp * s, dir[1] * (depth === 1 ? 0.38 : 1), dir[2] + Math.sin(a) * sp * s], l = Math.hypot(d[0], d[1], d[2]);
      grow(e, [d[0] / l, d[1] / l, d[2] / l], len * rng.range(0.55, 0.75), depth - 1, w * 0.8, rnd);
    }
  };
  for (let i = 0; i < stems; i++) {
    const a = rng() * TAU, out = rng.range(0.05, 0.3), r = rng.range(0, 0.12);
    const d = [Math.cos(a) * out, 1, Math.sin(a) * out], l = Math.hypot(d[0], 1, d[2]);
    grow([Math.cos(a) * r, -0.03, Math.sin(a) * r], [d[0] / l, 1 / l, d[2] / l], height * rng.range(0.36, 0.5), 2, 0.0075, rng());
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('aTan', new THREE.Float32BufferAttribute(tan, 4));
  g.setAttribute('aK', new THREE.Float32BufferAttribute(k, 4));
  g.setIndex(idx);
  return g;
}

export function swardMaterial(shared) {
  return new THREE.ShaderMaterial({
    uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...shared }, fog: true, side: THREE.DoubleSide,
    vertexShader: /* glsl */`
attribute vec4 aTan, aK; uniform vec3 uAxis; uniform float uTime, uWindSpeed;
varying vec3 vWp; varying vec3 vK; varying float vGust;
#include <fog_pars_vertex>
void main(){
  #ifdef USE_INSTANCING
    mat4 M = modelMatrix * instanceMatrix;
  #else
    mat4 M = modelMatrix;
  #endif
  vec4 wp = M * vec4(position, 1.);
  vec3 T = mat3(M) * aTan.xyz; float sc = length(T); T /= max(sc, 1e-4);
  // wind: gusts run through the sward downwind; tips move most, tassels nod on top of that
  vec2 wd = uAxis.xz; float wl = length(wd); wd = wl > 1e-3 ? wd / wl : vec2(1., 0.);
  float run = dot(wp.xz, wd) * .35 - uTime * uWindSpeed * .45;
  float gust = sin(run) * .6 + sin(run * 2.3 + wp.x * .7) * .4;
  float h = aK.z * aK.z;
  wp.xz += wd * (.07 + .1 * gust) * h * sc + vec2(-wd.y, wd.x) * sin(uTime * 2.1 + wp.x * 3. + aK.w * 20.) * .012 * h;
  wp.xz += aK.y * vec2(sin(uTime * 3.1 + aK.w * 40. + wp.z * 5.), cos(uTime * 2.6 + aK.w * 33.)) * .012;
  vec3 ray = wp.xyz - cameraPosition; float d = length(ray);
  vec3 S = cross(T, ray); S /= max(length(S), 1e-4);
  float halfW = max(aK.x * sc, d * .0009);          // never thinner than about a pixel and a half
  wp.xyz += S * aTan.w * halfW;
  vWp = wp.xyz; vK = vec3(aK.y, aK.z, min(1., aK.x * sc / halfW)); vGust = gust * h;
  vec4 mvPosition = viewMatrix * wp;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`,
    fragmentShader: /* glsl */`
uniform vec3 uSunDir, uSunCol, uSky, uFill, uWarm, uGreen, uRust, uSpore; uniform float uSun;
varying vec3 vWp; varying vec3 vK; varying float vGust;
#include <common>
#include <fog_pars_fragment>
void main(){
  vec3 green = uGreen * mix(.62, 1.18, vK.y);
  vec3 alb = mix(green, mix(uSpore * vec3(.8, 1.12, 1.1), green, .3), vK.x * mix(.3, 1., vK.z));
  vec3 ray = normalize(vWp - cameraPosition + vec3(0., 1e-5, 0.));
  float back = max(dot(ray, uSunDir), 0.); back *= back;
  vec3 col = alb * (uSunCol * uSun * (.34 + .8 * back) * mix(.5, 1., vK.y) + (uSky + uFill) * .85 + uWarm * .6);
  gl_FragColor = vec4(col * mix(.8, 1., vK.z) * (1. + .22 * vGust), 1.);
  #include <fog_fragment>
}`,
  });
}

function apronMesh(noise, shared, feet, R = 10) {
  const NR = 24, NS = 60, pos = [], dat = [], idx = [];
  for (let j = 0; j <= NR; j++) {
    const r = 0.25 + (R - 0.25) * Math.pow(j / NR, 1.35);
    for (let i = 0; i <= NS; i++) {
      const a = (i % NS) / NS * TAU, x = Math.cos(a) * r, z = Math.sin(a) * r;
      let m = 0;
      for (const f of feet) { const d = Math.max(Math.hypot(x - f.x, z - f.z) - f.r, 0); m += f.h * Math.exp(-d / (f.r * 1.1 + 0.25)); }
      const edge = 1 - smoothstep(R * 0.62, R, r);
      pos.push(x, 0.03 + (m + 0.05 * noise.fbm2(x * 0.5, z * 0.5, 3) + 0.03) * edge, z);
      dat.push(edge, Math.min(1, m * 4));
    }
  }
  for (let j = 0; j < NR; j++) for (let i = 0; i < NS; i++) { const a = j * (NS + 1) + i, b = a + NS + 1; idx.push(a, a + 1, b, b, a + 1, b + 1); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('aE', new THREE.Float32BufferAttribute(dat, 2));
  g.setIndex(idx); g.computeVertexNormals();
  const m = new THREE.ShaderMaterial({
    uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...shared }, fog: true, transparent: true, depthWrite: false,
    polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1,
    vertexShader: /* glsl */`
attribute vec2 aE; varying vec3 vWp, vN; varying vec2 vE;
#include <fog_pars_vertex>
void main(){
  vec4 wp = modelMatrix * vec4(position, 1.); vWp = wp.xyz; vN = mat3(modelMatrix) * normal; vE = aE;
  vec4 mvPosition = viewMatrix * wp; gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`,
    fragmentShader: /* glsl */`
uniform vec3 uSunDir, uSunCol, uSky, uFill, uWarm, uDark, uGreen, uRust, uBone; uniform float uSun;
varying vec3 vWp, vN; varying vec2 vE;
#include <common>
#include <fog_pars_fragment>
${GLSL_NOISE}
vec3 pebble(vec2 p, float k){                       // one rounded stone per cell: rgb = colour key, shade, mask
  vec2 c = floor(p); float h = h31(vec3(c, k)), h2 = h31(vec3(c, k + 5.));
  vec2 f = fract(p) - .5 - (vec2(h, h2) - .5) * .36;
  float d = length(f * vec2(1., .8 + .4 * h2));
  return vec3(h, 1. - d * 1.6, 1. - smoothstep(.3, .4, d));
}
void main(){
  vec2 p = vWp.xz;
  vec2 pw = p + .22 * vec2(vn(vec3(p * 1.7, 0.)), vn(vec3(p * 1.7, 5.))) + .05 * vec2(vn(vec3(p * 9., 2.)), vn(vec3(p * 9., 8.)));
  vec3 a = pebble(pw * 6.3, 1.), b = pebble(mat2(.8, .6, -.6, .8) * pw * 10.7 + 3.7, 2.);
  vec3 pb = a.z > .5 ? a : b; float on = max(a.z, b.z);
  vec3 ochre = vec3(.42, .31, .16), slate = vec3(.2, .21, .25);
  vec3 stone = pb.x < .45 ? ochre : (pb.x < .8 ? slate : uRust * .8);
  stone *= mix(.75, 1.1, pb.x * 7. - floor(pb.x * 7.));
  float nearK = 1. / (1. + length(vWp - cameraPosition) * .03);
  vec3 alb = mix(vec3(.4, .34, .25), mix(vec3(.38, .32, .24), stone * (.75 + .5 * pb.y), .35 + .65 * nearK), on);
  float crust = smoothstep(.5, .62, fbm3(vec3(p * .45, 3.)));
  alb = mix(alb, uDark * 1.6 * mix(.7, 1.3, vn(vec3(p * 5., 1.))), crust * .45);
  float damp = smoothstep(.35, .65, fbm3(vec3(p * .3 + 20., 7.)) + vE.y * .5);
  alb = mix(alb, uGreen * .62 * mix(.7, 1.2, vn(vec3(p * 9., 4.))), damp * .5);
  vec3 N = normalize(vN + vec3(0., 1e-4, 0.));
  float ndl = max(dot(N, uSunDir), 0.);
  vec3 col = alb * (uSunCol * ndl * uSun * mix(.75, 1.1, pb.y * on) + mix(uFill, uSky, .5 + .5 * N.y) + uWarm * .5);
  gl_FragColor = vec4(col, smoothstep(0., .6, vE.x));
  #include <fog_fragment>
}`,
  });
  const mesh = new THREE.Mesh(g, m); mesh.renderOrder = 1; mesh.name = 'apron';
  return mesh;
}

async function buildSurround(ctx, rng, noise, shared, o) {
  const object = new THREE.Group(); object.name = 'surround'; let triangles = 0;
  const footR = o.elderSpec.r0 * (1 + o.elderSpec.flare) * 1.12;
  const feet = [{ x: 0, z: 0, r: footR, h: 0.3 }, ...o.young.map((y) => ({ x: y.x, z: y.z, r: y.spec.r0 * 1.7, h: 0.14 }))];
  if (o.apron) { const ap = apronMesh(noise, shared, feet); object.add(ap); triangles += ap.geometry.index.count / 3; }
  await ctx.yield();
  if (o.sward) {
    const mat = swardMaterial(shared), dummy = new THREE.Object3D();
    const want = Math.round((o.swardCount ?? 170) * o.detail);
    for (let v = 0; v < 2; v++) {
      const geo = psilophytonGeometry(rng, { stems: v ? 4 : 6, height: v ? 0.5 : 0.62 });
      const mesh = new THREE.InstancedMesh(geo, mat, want); let n = 0;
      for (let tries = 0; n < want && tries < want * 12; tries++) {
        const r = Math.sqrt(rng.range(1.1 * 1.1, 9.4 * 9.4)), a = rng() * TAU, x = Math.cos(a) * r, z = Math.sin(a) * r, s = rng.range(0.7, 1.3), ry = rng() * TAU, keep = rng();
        let ok = noise.fbm2(x * 0.22 + 9, z * 0.22, 3) > -0.12 - 0.35 * Math.exp(-r / 3) && keep > smoothstep(6.5, 9.6, r) * 0.85;
        for (const f of feet) if (Math.hypot(x - f.x, z - f.z) < f.r + 0.12) ok = false;
        if (!ok) continue;
        let m = 0; for (const f of feet) { const d = Math.max(Math.hypot(x - f.x, z - f.z) - f.r, 0); m += f.h * Math.exp(-d / (f.r * 1.1 + 0.25)); }
        dummy.position.set(x, 0.03 + m * (1 - smoothstep(6.2, 10, r)), z); dummy.rotation.set(0, ry, 0); dummy.scale.setScalar(s * (1 - 0.35 * smoothstep(7, 9.6, r)));
        dummy.updateMatrix(); mesh.setMatrixAt(n++, dummy.matrix);
        if ((n & 63) === 0) await ctx.yield();
      }
      mesh.count = n; mesh.instanceMatrix.needsUpdate = true; mesh.computeBoundingSphere(); mesh.name = 'psilophyton' + v;
      object.add(mesh); triangles += n * geo.index.count / 3;
      await ctx.yield();
    }
  }
  return { object, triangles };
}

// ------------------------------------------------------------------------------------------------
// 7. For the world: the other twenty-nine.  One call makes every other pillar of the plain with the
//    same loft, shader, veils and shadows, all driven by the hero's shared uniforms.
//    items: [{ x, z, y = 0, height, lod = 0 | 1 | 2, rotY, fallen, veil (length in m, 0 for none), delay 0-1, top }]
//    lod 0 pillars share `variants` meshes (instanced, scaled to their height); lod 1 and 2 are built singly.
//    A fallen one lies along +X turned by rotY, its ringed broken end at the local origin.
// ------------------------------------------------------------------------------------------------
export async function makePillarField(ctx, shared, items, { rng = ctx.rng, noise = ctx.noise, variants = 6, detail = 1, pool = 13, nearRadius = 32 } = {}) {
  const object = new THREE.Group(); object.name = 'pillarField';
  const tops = [], shadowList = [], specs = [], lods = [];
  let triangles = 0;
  const dummy = new THREE.Object3D(), v3 = new THREE.Vector3(), zero = new THREE.Matrix4().makeScale(0, 0, 0);
  const place = (it, sp) => {
    const r = rng() * TAU, sc = (it.height ?? 5) / sp.H, ry = it.rotY ?? (it.leanTo !== undefined ? sp.leanAz - it.leanTo : r),      // leanTo: the world azimuth (atan2(z, x)) this one leans toward
     sg = it.thick ? clamp(it.thick / (2 * sp.r0), sc * 0.7, sc * 2.6) : sc;
    dummy.position.set(it.x, it.y ?? 0, it.z); dummy.rotation.set(0, ry, 0); dummy.scale.set(sg, sc, sg); dummy.updateMatrix();
    return { sc, sg, ry };
  };
  const note = (it, sp, geo, q, mesh) => {
    v3.fromArray(geo.userData.top).applyMatrix4(dummy.matrix);
    if (it.veil !== 0) tops.push({ pos: v3.toArray(), length: it.veil ?? rng.range(30, 60), delay: it.delay ?? rng(), radius: geo.userData.rTop * q.sg, gain: it.gain ?? 1.25 });
    shadowList.push({ spec: sp, x: it.x, z: it.z, rotY: q.ry, scale: q.sc, girth: q.sg / q.sc, rows: (it.lod ?? 0) < 0 ? 4 : undefined }); specs.push({ item: it, spec: sp, scale: q.sc, mesh, top: v3.toArray() });      // mend 1: top: the middle of its broken top where it stands (field space), for a look that aims at it
  };
  // 1. the far field (lod -1): a few variants, instanced, about 350 triangles each
  const far = items.filter((it) => (it.lod ?? 0) < 0 && !it.fallen), nVar = Math.min(variants, far.length);
  for (let v = 0; v < nVar; v++) {
    const mine = far.filter((_, i) => i % nVar === v);
    const sp = pillarSpec(rng, { height: 6.5, top: v % 3 === 2 ? 'hollow' : undefined }), geo = pillarGeometry(sp, noise, -1);
    const mesh = new THREE.InstancedMesh(geo, pillarMaterial(shared, { seed: sp.seed, height: sp.H, flutes: 26, bands: 1 }), mine.length);
    const seeds = new Float32Array(mine.length * 2);
    mine.forEach((it, i) => { const q = place(it, sp); mesh.setMatrixAt(i, dummy.matrix); seeds[i * 2] = rng() * 97; note(it, sp, geo, q); });
    geo.setAttribute('iSeed', new THREE.InstancedBufferAttribute(seeds, 2));
    mesh.instanceMatrix.needsUpdate = true; mesh.frustumCulled = false; object.add(mesh); triangles += geo.userData.triangles * mine.length;
    await ctx.yield();
  }
  // 2. the groves beside the route (lod 0 and 1): a pool of variants, each pillar turned and scaled to its own height and
  //    girth; every pillar is one instance of its variant's standing mesh (n4: twelve sides, about 600 triangles) and, for
  //    a lod 1 item while the lens is within nearRadius of it, a mesh of the close one instead.  update(camera) swaps them;
  //    nothing is created in flight.
  const mid = items.filter((it) => (it.lod ?? 0) >= 0 && (it.lod ?? 0) < 2 && !it.fallen);
  if (mid.length) {
    const pv = [];
    const mk = async (o, kind) => {
      const sp = pillarSpec(rng, o), g1 = await pillarGeometryAsync(sp, noise, 1, ctx.yield); await ctx.yield();
      const g0 = pillarGeometry(sp, noise, -0.5), gm = pillarGeometry(sp, noise, -0.25); pv.push({ sp, g1, g1b: null, g0, gm, kind, mine: [] }); await ctx.yield();
    };
    for (let k = 0; k < pool; k++) await mk({ height: lerp(5.2, 8.8, k / Math.max(pool - 1, 1)), top: ['slant', 'notch', 'hollow', 'slant'][k % 4] }, 'tall');
    for (let k = 0; k < 3; k++) await mk({ height: 1.3 + 0.45 * k, lean: rng.range(2, 7) }, 'young');
    for (let k = 0; k < 2; k++) await mk({ height: 2.2 + 0.7 * k, thick: 1.15, top: 'hollow', taper: 0.86 }, 'stump');
    for (const it of mid) {
      const h = it.height ?? 6, kind = it.top === 'hollow' && h < 4 ? 'stump' : h < 2.6 ? 'young' : 'tall';
      const c = pv.filter((v) => v.kind === kind).sort((a, b) => Math.abs(a.sp.H - h) - Math.abs(b.sp.H - h)).slice(0, kind === 'tall' ? 4 : 3);
      c[Math.floor(rng() * c.length) % c.length].mine.push(it);
    }
    for (const v of pv) {
      const n = v.mine.length; if (!n) { v.g1.dispose(); v.g0.dispose(); v.gm.dispose(); continue; }
      // n4: a lod 1 or 0.5 item is an instance of the variant's stand-in and has a near mesh (of its own grade: mend 2); a lod 0 item is an instance of its mid mesh, always
      const withNear = v.mine.filter((it) => (it.lod ?? 0) >= 0.5), alone = v.mine.filter((it) => (it.lod ?? 0) < 0.5);
      if (withNear.some((it) => it.lod < 1)) { v.g1b = await pillarGeometryAsync(v.sp, noise, 0.5, ctx.yield); await ctx.yield(); }
      const nearMat = pillarMaterial(shared, { seed: v.sp.seed, height: v.sp.H, flutes: 30 });      // one material for the variant; each mesh hands it its own seed as it is drawn
      for (const [list, geo] of [[withNear, v.g0], [alone, v.gm]]) {
        if (!list.length) { geo.dispose(); continue; }
        const farMesh = new THREE.InstancedMesh(geo, pillarMaterial(shared, { seed: v.sp.seed, height: v.sp.H, flutes: 26, bands: 1 }), list.length), seeds = new Float32Array(list.length * 2);
        list.forEach((it, i) => {
          const q = place(it, v.sp), seed = rng() * 97; farMesh.setMatrixAt(i, dummy.matrix); seeds[i * 2] = seed;
          if (geo === v.gm) { note(it, v.sp, v.g1, q, null); return; }
          const gn = it.lod < 1 ? v.g1b : v.g1, near = new THREE.Mesh(gn, nearMat); near.onBeforeRender = () => { nearMat.uniforms.uSeed.value = seed; nearMat.uniformsNeedUpdate = true; };
          near.matrixAutoUpdate = false; near.matrix.copy(dummy.matrix); near.visible = false; object.add(near);
          note(it, v.sp, gn, q, near);
          lods.push({ near, farMesh, i, m: dummy.matrix.clone(), x: it.x, z: it.z, on: false });
        });
        geo.setAttribute('iSeed', new THREE.InstancedBufferAttribute(seeds, 2));
        farMesh.instanceMatrix.needsUpdate = true; farMesh.frustumCulled = false; object.add(farMesh); triangles += geo.userData.triangles * list.length;
      }
      await ctx.yield();
    }
  }
  // 3. the heroes of the plain (lod 2) and the fallen one: built singly
  for (const it of items) {
    if (!(it.lod >= 2) && !it.fallen) continue;
    const sp = pillarSpec(rng, { height: it.height ?? 7, top: it.top, fallen: it.fallen, thick: it.thick, lean: it.lean, leanAz: it.leanAz, curve: it.curve }), geo = await pillarGeometryAsync(sp, noise, it.fallen ? (it.lod ?? 2) : 2, ctx.yield);
    const mesh = new THREE.Mesh(geo, pillarMaterial(shared, { seed: sp.seed, height: sp.H, flutes: 38 }));
    const ry = it.rotY ?? rng() * TAU;
    if (it.fallen) { mesh.rotation.set(0, ry, -Math.PI / 2 + 0.03, 'YXZ'); mesh.position.set(it.x, (it.y ?? 0) + sp.r0 * 0.92, it.z); }
    else { mesh.rotation.y = ry; mesh.position.set(it.x, it.y ?? 0, it.z); }
    mesh.updateMatrix(); object.add(mesh); triangles += geo.userData.triangles;
    if (!it.fallen) {
      v3.fromArray(geo.userData.top).applyMatrix4(mesh.matrix);
      if (it.veil !== 0) { const t = { pos: v3.toArray(), length: it.veil ?? rng.range(30, 60), delay: it.delay ?? rng(), radius: geo.userData.rTop, gain: it.gain ?? 1.6 }; tops.push(t, { ...t }); }
      shadowList.push({ spec: sp, x: it.x, z: it.z, rotY: ry, scale: 1 });
    }
    specs.push({ item: it, spec: sp, scale: 1, mesh });
    await ctx.yield();
  }
  if (tops.length) { const veils = makeVeils(shared, tops, { rng, perPillar: 12, motes: 30, detail }); object.add(veils.object); triangles += veils.triangles; }
  await ctx.yield();
  if (shadowList.length) { const sh = makeShadows(shared, shadowList, noise); object.add(sh); triangles += sh.geometry.index.count / 3; }
  await ctx.yield();
  // swap near and far by the distance from the lens (hysteresis of a few metres so nothing flickers); camera position in the field's own space
  const r0 = nearRadius * nearRadius, r1 = (nearRadius + 5) * (nearRadius + 5), dirty = new Set();
  const update = (cx, cz) => {
    for (const L of lods) {
      const d = (L.x - cx) * (L.x - cx) + (L.z - cz) * (L.z - cz), on = L.on ? d < r1 : d < r0;
      if (on !== L.on) { L.on = on; L.near.visible = on; L.farMesh.setMatrixAt(L.i, on ? zero : L.m); dirty.add(L.farMesh); }
    }
    if (dirty.size) { for (const m of dirty) m.instanceMatrix.needsUpdate = true; dirty.clear(); }
  };
  return { object, tops, specs, triangles, update };
}
