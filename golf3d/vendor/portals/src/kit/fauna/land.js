// Land animals: herds of quadrupeds walking terrain-following tracks, and wading birds standing in water.
import * as THREE from 'three';
import { Geo, col, v3, rngOf, creatureMaterial, instancedGeo, creatureMesh, triCount, applyLight, loopPoints, crossPoints, alongPoints, makeTravel, sphereOfPoints, shadowMaterial, blobGeometry } from './common.js';

// All dimensions are multiples of the shoulder height `h` (metres).
// aAnim = (x: leg phase 0..1 | neck weight, y: limb weight 0 joint .. 1 tip, z: part 1 leg, 2 neck/head, 3 tail, 4 trunk, 5 ear, w: 2 = optional part hidden on variety 0)
// aPivot = joint. aGlow = coat mask (1 where the fur pattern applies).
export const HERD_PRESETS = {
  deer: { h: 1.0, bodyLen: 1.0, width: 0.3, depth: 0.42, hip: 1.02, leg: [0.062, 0.04, 0.026], neckLen: 0.5, neckAng: 62, neck: [0.14, 0.085], headLen: 0.3, headR: 0.085, headPitch: 18, ears: 0.17, tail: 0.12, tailType: 'scut', antlers: 0.55, graze: 1.75,
    coat: '#a8743e', belly: '#e6d5b4', legs: '#94683c', sock: '#7a5a3e', accent: '#f4ecdc', horn: '#d8c8a0', pattern: 'spots', speed: 1.1, stride: 0.95, count: 14, varieties: 0.4 },
  antelope: { h: 0.85, bodyLen: 0.98, width: 0.26, depth: 0.38, hip: 1.03, leg: [0.05, 0.032, 0.02], neckLen: 0.48, neckAng: 66, neck: [0.12, 0.07], headLen: 0.27, headR: 0.075, headPitch: 16, ears: 0.15, tail: 0.2, tailType: 'thin', horns: 0.42, graze: 1.8,
    coat: '#c98f4e', belly: '#f6efe0', legs: '#c08a4c', sock: '#d8c09a', accent: '#3a2a20', horn: '#4a3c30', pattern: 'band', speed: 1.3, stride: 0.9, count: 22, varieties: 1 },
  horse: { h: 1.55, bodyLen: 1.0, width: 0.36, depth: 0.5, hip: 1.0, leg: [0.085, 0.05, 0.034], neckLen: 0.6, neckAng: 46, neck: [0.27, 0.15], neckArch: 0.12, headLen: 0.45, headR: 0.1, headPitch: 46, ears: 0.09, tail: 0.62, tailType: 'flow', mane: 1.3, graze: 1.4, chest: 1.14, croup: 0.1, sway: 0.1, joints: 1,
    coat: '#b0763f', belly: '#a06c3c', legs: '#8a6240', sock: '#6e5444', accent: '#54402f', hoof: '#5a5048', horn: '#000', pattern: 'none', speed: 1.4, stride: 1.15, count: 9, tints: ['#ffffff', '#dcb890', '#9c8878', '#f4ece0', '#d09060', '#8a7a74'] },
  zebra: { h: 1.35, bodyLen: 0.98, width: 0.38, depth: 0.5, hip: 1.0, leg: [0.08, 0.047, 0.033], neckLen: 0.55, neckAng: 50, neck: [0.25, 0.14], neckArch: 0.08, headLen: 0.42, headR: 0.1, headPitch: 40, ears: 0.11, tail: 0.45, tailType: 'tuft', mane: 1, graze: 1.45, chest: 1.1, croup: 0.08, sway: 0.06, joints: 1,
    coat: '#f2efe8', belly: '#f6f4ee', legs: '#f2efe8', sock: '#f2efe8', accent: '#262326', hoof: '#4c4a4c', horn: '#000', pattern: 'stripes', speed: 1.3, stride: 1.05, count: 12 },
  elephant: { h: 3.0, bodyLen: 0.82, width: 0.5, depth: 0.6, hip: 0.9, leg: [0.115, 0.1, 0.105], neckLen: 0.16, neckAng: 8, neck: [0.3, 0.27], headLen: 0.34, headR: 0.22, headPitch: 20, ears: 0.3, earType: 'fan', dome: 0.22, tail: 0.45, tailType: 'tuft', trunk: 0.62, tusks: 0.34, graze: 0, belly2: 1.12, sway: -0.12, hoofFlare: 0.7,
    legSides: 8, coat: '#8d857f', belly: '#766e69', legs: '#817974', sock: '#726a65', accent: '#6c635e', hoof: '#a39b90', horn: '#f4ecd8', pattern: 'none', speed: 1.1, stride: 1.6, count: 6, sizes: [1, 0.86, 0.9, 0.55, 0.8, 0.45] },
  giraffe: { h: 3.0, bodyLen: 0.62, width: 0.26, depth: 0.42, hip: 0.84, leg: [0.062, 0.042, 0.03], neckLen: 0.86, neckAng: 62, neck: [0.17, 0.075], headLen: 0.22, headR: 0.058, headPitch: 28, ears: 0.07, tail: 0.4, tailType: 'tuft', ossicones: 0.07, mane: 0.5, graze: 0.25, legK: 1.12,
    coat: '#b8742e', belly: '#e8d4a8', legs: '#e0c898', sock: '#e8dcc0', accent: '#f0dfb8', horn: '#4a3420', pattern: 'patches', speed: 1.3, stride: 1.9, count: 5, sizes: [1, 0.9, 0.95, 0.6, 0.85] },
  bison: { h: 1.8, bodyLen: 0.9, width: 0.42, depth: 0.62, hip: 0.82, leg: [0.085, 0.05, 0.04], neckLen: 0.22, neckAng: -8, neck: [0.34, 0.24], headLen: 0.34, headR: 0.15, headPitch: 58, ears: 0.06, tail: 0.3, tailType: 'tuft', horns: 0.16, hornType: 'curl', hump: 0.16, graze: 0.75,
    coat: '#80583a', belly: '#70503a', legs: '#6e5038', sock: '#5e4838', accent: '#5a4230', horn: '#4a423c', pattern: 'none', speed: 1.0, stride: 1.2, count: 12 },
};

const RUMP = '#f6f0e4', MARKS = ['belly', 'legs', 'sock', 'accent'];   // RUMP: the scut, when a preset has no `rump` of its own
// A preset marking re-based on another coat. It keeps the place the preset gives it against its own coat: the same step in
// lightness (a tint toward white by the same fraction when the marking is paler than the preset coat, a shade toward black by
// the same factor when it is darker) and the same share of the coat's chroma, in the hue of the new coat.
const _hm = {}, _h0 = {}, _h1 = {}, chromaOf = (q) => (1 - Math.abs(2 * q.l - 1)) * q.s;
function markingOf(mark, coat0, coat) {
  const out = col(mark), CS = THREE.SRGBColorSpace; out.getHSL(_hm, CS); col(coat0).getHSL(_h0, CS); col(coat).getHSL(_h1, CS);
  const l = _hm.l >= _h0.l ? _h1.l + (1 - _h1.l) * (_hm.l - _h0.l) / Math.max(1 - _h0.l, 1e-3) : _h1.l * _hm.l / Math.max(_h0.l, 1e-3);
  const c = chromaOf(_h1) * Math.min(1.5, chromaOf(_hm) / Math.max(chromaOf(_h0), 0.02));
  return out.setHSL(_h1.h, Math.min(1, c / Math.max(1 - Math.abs(2 * l - 1), 1e-3)), Math.min(1, Math.max(0, l)), CS);
}

export function quadrupedGeometry(S) {
  const g = new Geo(), H = S.h, cCoat = col(S.coat), cBel = col(S.belly), cLeg = col(S.legs), cSock = col(S.sock), cAcc = col(S.accent), cHorn = col(S.horn), cHoof = col(S.hoof ?? '#5a5048');
  const bl = S.bodyLen * H, zs = bl / 2, zh = -bl / 2, rx = (S.width * H) / 2, ry = (S.depth * H) / 2, hipY = H * S.hip, hump = (S.hump || 0) * H, b2 = S.belly2 || 1;
  const yc = (zt) => { const t = (zt - zh) / bl; return (hipY + (H - hipY) * t) - ry; };
  // torso: rump, croup, barrel (sway dips the back, negative arches it), withers and chest
  const ch = S.chest || 1, cr = (S.croup || 0) * ry, sw = (S.sway || 0) * ry;
  const body = g.loft([
    { z: zh - 0.34 * ry, y: yc(zh) + 0.22 * ry, rx: 0, ry: 0 }, { z: zh - 0.2 * ry, y: yc(zh) + 0.1 * ry + cr * 0.4, rx: rx * 0.66, ry: ry * 0.72 }, { z: zh + 0.12 * bl, y: yc(zh) + cr * 0.5, rx: rx * 0.98, ry: ry * 0.96 + cr * 0.5 },
    { z: zh + 0.45 * bl, y: yc(0) - 0.04 * ry * b2 - sw * 0.5, rx: rx * 1.06 * b2, ry: ry * 1.0 * b2 - sw * 0.5 }, { z: zs - 0.16 * bl, y: yc(zs) + hump * 0.5 - (ch - 1) * ry * 0.5, rx: rx * 1.02, ry: ry * (0.04 + ch) + hump * 0.5 }, { z: zs + 0.06 * bl, y: yc(zs) + 0.06 * ry + hump * 0.35 - (ch - 1) * ry * 0.3, rx: rx * 0.84, ry: ry * (0.9 + (ch - 1) * 0.6) + hump * 0.3 }, { z: zs + 0.3 * ry + 0.08 * bl, y: yc(zs) + 0.14 * ry, rx: 0, ry: 0 },
  ], { sides: S.sides ?? 12, top: cCoat, belly: cBel, shade: [-0.75, -0.1] });
  g.glow(body, 1);
  // legs: shoulder / hip joint, knee, fetlock, hoof
  const lt = S.leg, legK = S.legK || 1;
  const leg = (sx, z, front, phase) => {
    const jy = yc(z) + ry * 0.2, x = sx * rx * 0.62, kz = front ? 0.02 * H : -0.07 * H, ky = jy * 0.5;
    const jn = S.joints ? 1.22 : 1, hf = S.hoofFlare ?? (S.joints ? 1 : 0.85);
    const pts = [[x, jy + ry * 0.5, z], [x, jy - ry * 0.25, z + (front ? 0.01 : -0.03) * H], [x, ky + 0.05 * H, z + kz * 0.8], [x, ky, z + kz], [x, 0.11 * H * legK, z + (front ? -0.01 : 0.01) * H], [x, 0.05 * H, z + 0.012 * H], [x, 0.04 * H, z + 0.02 * H], [x, 0, z + 0.026 * H]];
    const r = g.tube(pts, [lt[0] * H * 1.5, lt[0] * H * 1.3, lt[1] * H * 1.05, lt[1] * H * jn, lt[2] * H, lt[2] * H * jn * 1.1, lt[2] * H * 1.45 * hf, lt[2] * H * 1.6 * hf], S.legSides ?? 6, cLeg, cSock);
    g.anim(r, (px, py) => [phase, Math.min(1, Math.max(0, (jy - py) / jy)), 1, 0]); g.pivot(r, x, jy, z); g.glow(r, (px, py) => (py > 0.12 * H ? 1 : 0));
    g.paint(r, (px, py, pz, c) => { if (py < 0.045 * H) c.copy(cHoof); });
  };
  // walk: lateral sequence (LH, LF, RH, RF)
  leg(-1, zs - 0.04 * bl, true, 0.25); leg(1, zs - 0.04 * bl, true, 0.75); leg(-1, zh + 0.06 * bl, false, 0.0); leg(1, zh + 0.06 * bl, false, 0.5);
  // neck + head (built in a local frame, then pitched around the neck base)
  const nb = [0, yc(zs) + ry * 1.25 + hump * 0.2, zs + 0.02 * bl], na = (S.neckAng * Math.PI) / 180, nl = S.neckLen * H, n0 = g.n;
  const npts = [], nr = []; for (let i = 0; i <= 4; i++) { const t = i / 4, bow = Math.sin(t * Math.PI) * (0.06 - (S.neckArch || 0) * 1.3) * nl; npts.push([0, nb[1] - ry * 0.35 * (1 - t) + Math.sin(na) * nl * t - bow * Math.cos(na), nb[2] + Math.cos(na) * nl * t + bow * Math.sin(na)]); nr.push((S.neck[0] + (S.neck[1] - S.neck[0]) * Math.pow(t, 0.8)) * H); }
  const neck = g.tube(npts, nr, 9, cCoat, cCoat, { flatten: 0.78 }); g.glow(neck, 1);
  g.paint(neck, (x, y, z, c) => { const below = (z - nb[2]) * Math.sin(na) - (y - nb[1]) * Math.cos(na); if (below > 0.02 * H) c.lerp(cBel, 0.7); });
  if (S.mane) {   // upright crest (zebra, giraffe) or, for flowing manes, a low ridge plus a drape down the right side of the neck
    const mh = 0.07 * H * S.mane, fl = S.tailType === 'flow', rows = fl ? [0, 0.6, 1.15, 1.6] : [0], ring = (th, lift) => npts.map((p, i) => { const r = nr[i] * 1.07, k = Math.cos(th) * (th ? r : nr[i] * 0.78) + lift; return [Math.sin(th) * r * 0.78, p[1] + k * Math.cos(na), p[2] - k * Math.sin(na)]; });
    g.strip(ring(0, 0), ring(0, fl ? mh * 0.35 : mh), cAcc, cAcc);
    for (let i = 0; i + 1 < rows.length; i++) g.strip(ring(rows[i], i ? 0 : nr[0] * 0.05), ring(rows[i + 1], 0), cAcc, cAcc);
  }
  const top = npts[4], hp = (S.headPitch * Math.PI) / 180, hl = S.headLen * H, hr = S.headR * H, h0 = g.n, dome = S.dome || 0;
  const head = g.loft([{ z: -0.3 * hl, y: 0, rx: 0, ry: 0 }, { z: -0.12 * hl, y: dome * hr * 0.5, rx: hr * 0.9, ry: hr * (0.95 + dome * 0.5) }, { z: 0.2 * hl, y: dome * hr * 0.6, rx: hr, ry: hr * (1 + dome * 0.6) }, { z: 0.62 * hl, y: -0.12 * hr, rx: hr * 0.62, ry: hr * 0.66 }, { z: 0.92 * hl, y: -0.2 * hr, rx: hr * 0.48, ry: hr * 0.5, top: cAcc, belly: cAcc }, { z: hl, y: -0.22 * hr, rx: 0, ry: 0, top: cAcc }], { sides: 8, top: cCoat, belly: cBel, shade: [-0.6, 0] });
  g.glow(head, (x, y, z) => (z < 0.5 * hl ? 1 : 0));
  for (const sx of [-1, 1]) {
    g.blob(sx * hr * 0.82, hr * 0.25, 0.22 * hl, hr * 0.12, hr * 0.16, hr * 0.16, col('#0a0806'), null, 4, 2);
    const e = S.ears * H;
    if (S.earType === 'fan') {   // big ears: a curved sheet hanging beside and behind the head, top edge at head height
      const eh = e * 1.45, grid = [], e0 = g.n;
      for (let r = 0; r <= 4; r++) { const v = r / 4, shp = (0.72 + 0.4 * Math.sin(Math.PI * Math.pow(v, 0.7))) * (1 - 0.45 * v * v), row = [];
        for (let c = 0; c <= 2; c++) { const u = c / 2; row.push(g.v(sx * (hr * 0.8 + u * e * 0.42 * shp + Math.sin(u * Math.PI) * e * 0.09), hr * 0.85 - v * eh + u * (1 - v) * e * 0.12 - u * e * 0.92 * shp * Math.tan(hp) * 0.9, -0.12 * hl - u * e * 0.92 * shp, c === 2 ? cAcc : cCoat)); g.a[(g.n - 1) * 4 + 1] = u; g.a[(g.n - 1) * 4 + 2] = 5; }
        grid.push(row); }
      for (let r = 0; r < 4; r++) for (let c = 0; c < 2; c++) g.quad(grid[r][c], grid[r + 1][c], grid[r + 1][c + 1], grid[r][c + 1]);
      g.pivot([e0, g.n], sx * hr * 0.8, 0, -0.12 * hl); g.glow([e0, g.n], 1);
    }
    else g.fan([[sx * hr * 0.6, hr * 0.75, -0.08 * hl], [sx * (hr * 0.7 + e * 0.75), hr * 0.8 + e * 0.75, -0.2 * hl], [sx * (hr * 0.95 + e * 0.35), hr * 0.7 + e * 0.15, -0.1 * hl]], cCoat, cAcc);
    if (S.antlers) { const a = S.antlers * H, o0 = g.n, bx = sx * hr * 0.45; g.tube([[bx, hr * 0.85, -0.02 * hl], [bx + sx * a * 0.22, hr + a * 0.38, -0.12 * hl], [bx + sx * a * 0.36, hr + a * 0.74, 0.02 * hl], [bx + sx * a * 0.3, hr + a, 0.2 * hl]], [0.02 * H, 0.016 * H, 0.012 * H, 0], 3, cHorn);
      g.tube([[bx + sx * a * 0.1, hr + a * 0.2, -0.06 * hl], [bx + sx * a * 0.14, hr + a * 0.36, 0.45 * hl]], [0.012 * H, 0], 3, cHorn); g.tube([[bx + sx * a * 0.3, hr + a * 0.6, -0.06 * hl], [bx + sx * a * 0.52, hr + a * 0.92, -0.12 * hl]], [0.012 * H, 0], 3, cHorn); g.tube([[bx + sx * a * 0.24, hr + a * 0.46, -0.1 * hl], [bx + sx * a * 0.3, hr + a * 0.6, -0.5 * hl]], [0.011 * H, 0], 3, cHorn);
      g.anim([o0, g.n], () => [0, 0, 0, 2]); g.pivot([o0, g.n], bx, hr * 0.85, -0.02 * hl); }
    if (S.horns) { const a = S.horns * H, bx = sx * hr * 0.5; if (S.hornType === 'curl') g.tube([[bx, hr * 0.8, 0.0], [bx + sx * a * 0.9, hr * 0.9, 0.0], [bx + sx * a * 1.2, hr * 0.9 + a * 0.7, 0.02 * hl]], [0.035 * H, 0.028 * H, 0], 4, cHorn);
      else g.tube([[bx, hr * 0.85, 0.0], [bx + sx * a * 0.12, hr + a * 0.4, -0.2 * hl], [bx + sx * a * 0.2, hr + a * 0.75, -0.3 * hl], [bx + sx * a * 0.1, hr + a, -0.12 * hl]], [0.018 * H, 0.015 * H, 0.011 * H, 0], 4, cHorn); }
    if (S.ossicones) g.tube([[sx * hr * 0.4, hr * 0.8, 0.0], [sx * hr * 0.45, hr * 0.8 + S.ossicones * H, -0.05 * hl]], [0.014 * H, 0.018 * H], 4, cHorn);
    if (S.tusks) { const a = S.tusks * H; g.tube([[sx * hr * 0.55, -hr * 0.7, 0.55 * hl], [sx * hr * 0.75, -hr * 1.1 - a * 0.1, 0.55 * hl + a * 0.45], [sx * hr * 0.7, -hr * 1.0 - a * 0.02, 0.55 * hl + a * 0.95]], [0.03 * H, 0.024 * H, 0], 5, cHorn); }
  }
  if (S.hump) g.paint(body, (x, y, z, c) => { if (z > 0 ) c.lerp(cAcc, 0.35 * Math.min(1, z / zs)); });
  const hend = g.n;
  let trunkR = null;
  if (S.trunk) {   // S-curve: forward off the face, hanging straight down, tip curled back
    const tl = S.trunk * H, pts = [], rr = [], m = 10, a0 = 0.5; let py = -0.25 * hr, pz = 0.72 * hl;
    for (let i = 0; i <= m; i++) { const t = i / m, k = Math.min(1, t / 0.45), a = a0 + (Math.PI / 2 - hp + 0.06 - a0) * k * k * (3 - 2 * k) + Math.max(0, t - 0.66) / 0.34 * 2.0;
      pts.push([0, py, pz]); rr.push(hr * (0.56 - 0.38 * t)); py -= Math.sin(a) * tl / m; pz += Math.cos(a) * tl / m; }
    trunkR = g.tube(pts, rr, 6, cCoat, cAcc); g.anim(trunkR, (x, y) => [0, Math.min(1, Math.max(0, (-0.25 * hr - y) / (tl * 0.75))), 4, 0]); g.glow(trunkR, 1); }
  // place the head: pitch about x, then move to the top of the neck
  g.move([h0, g.n], (p) => { const y = p.y, z = p.z; p.y = y * Math.cos(hp) - z * Math.sin(hp) + top[1] + hr * 0.25; p.z = y * Math.sin(hp) + z * Math.cos(hp) + top[2] + hr * 0.1; });
  // everything from the neck up nods and grazes around the neck base (ears, trunk and antlers ride along)
  for (let i = n0; i < g.n; i++) { const t = Math.min(1, Math.max(0, ((g.p[i * 3 + 2] - nb[2]) * Math.cos(na) + (g.p[i * 3 + 1] - nb[1]) * Math.sin(na)) / (nl * 0.5))); g.a[i * 4] = i >= h0 ? 1 : t; if (g.a[i * 4 + 2] < 3.5) g.a[i * 4 + 2] = 2; g.pv[i * 3] = 0; g.pv[i * 3 + 1] = nb[1] - ry * 0.2; g.pv[i * 3 + 2] = nb[2]; }
  // tail
  const tz = zh - 0.3 * ry, ty = yc(zh) + ry * 0.75, tl = S.tail * H, t0 = g.n;
  if (S.tailType === 'flow') { g.tube([[0, ty, tz], [0, ty - tl * 0.15, tz - tl * 0.22], [0, ty - tl * 0.6, tz - tl * 0.3], [0, ty - tl, tz - tl * 0.18]], [0.03 * H, 0.045 * H, 0.05 * H, 0], 4, cAcc); }
  else if (S.tailType === 'scut') g.fan([[0, ty, tz + 0.03 * H], [0.03 * H, ty - tl * 0.3, tz - tl * 0.7], [0, ty - tl, tz - tl * 0.5], [-0.03 * H, ty - tl * 0.3, tz - tl * 0.7]], col(S.rump ?? RUMP));
  else { g.tube([[0, ty, tz], [0, ty - tl * 0.5, tz - tl * 0.14], [0, ty - tl * 0.86, tz - tl * 0.1]], [0.014 * H, 0.01 * H, 0.009 * H], 3, cCoat); if (S.tailType === 'tuft') g.blob(0, ty - tl * 0.95, tz - tl * 0.1, 0.022 * H, 0.022 * H, 0.07 * H, cAcc, null, 4, 2); }
  g.anim([t0, g.n], (x, y) => [0, Math.min(1, Math.max(0, (ty - y) / tl)), 3, 0]); g.pivot([t0, g.n], 0, ty, tz);
  return g.build();
}

const HERD_PRE = /* glsl */`
uniform sampler2D uTracks; uniform vec3 uTrackInfo; uniform float uTravel, uSpeed, uPause, uGraze, uRun, uH; uniform vec4 uGait;
vec3 trackTex(float i){ float W = uTrackInfo.x; i = uTrackInfo.y > .5 ? mod(i, W) : clamp(i, 0., W - 1.); return texelFetch(uTracks, ivec2(int(i + .5), int(iA.x + .5)), 0).xyz; }
vec3 trackAt(float s){
  float W = uTrackInfo.x, L = iA.y, f = s / L, fc = f, x;
  if(uTrackInfo.y > .5) x = fract(f) * W; else { fc = clamp(f, 0., 1.); x = fc * (W - 1.); }
  float i = floor(x), k = x - i, k2 = k * k, k3 = k2 * k;
  vec3 p = trackTex(i - 1.) * ((1. - 3. * k + 3. * k2 - k3) / 6.) + trackTex(i) * ((3. * k3 - 6. * k2 + 4.) / 6.) + trackTex(i + 1.) * ((-3. * k3 + 3. * k2 + 3. * k + 1.) / 6.) + trackTex(i + 2.) * (k3 / 6.);
  if(uTrackInfo.y < .5 && f != fc){ float e = f > 1. ? W - 1. : 1.; p += normalize(trackTex(e) - trackTex(e - 1.)) * (f - fc) * L; }
  return p;
}
float pauseW(){ return uPause * (.6 + .8 * h11(iB.z + 1.)); }
float distAt(float q){
#ifdef MIGRATE
  return uTravel + (q - uTime) * uSpeed - iA.z;
#else
  // speed factor 1 + 1.125 cos a - .125 cos 3a: flat top, and a flat zero so the animal really stops
  float w = pauseW(), a = w * q + iA.w * 6.2832;
  return iA.z + uSpeed * iB.w * (q + (1.125 * sin(a) - .0416667 * sin(3. * a)) / w);
#endif
}
`;
const HERD_TRAJ = /* glsl */`
vec3 traj(float q){ return trackAt(distAt(q)); }
`;
const HERD_DEFORM = /* glsl */`
void deform(inout vec3 p, inout vec3 n){
  float seed = iB.z, cyc = distAt(uTime) / iB.x / uGait.x, part = aAnim.z, mv = 1., gz = 0.;
#ifndef MIGRATE
  float pa = pauseW() * uTime + iA.w * 6.2832, sl = 1. + 1.125 * cos(pa) - .125 * cos(3. * pa);
  mv = smoothstep(.01, .3, sl); gz = smoothstep(.5, .08, sl) * step(.25, h11(seed + 4.));
#endif
  if(aAnim.w > 1.5 && iB.y < .5){ p = aPivot; }
  if(part > .5 && part < 1.5){
    float gp = (aPivot.z > 0. ? .0 : .52) + (aPivot.x > 0. ? .09 : 0.);
    float ph = (cyc + mix(aAnim.x, gp, uRun)) * 6.2832, w = aAnim.y;
    float ang = uGait.y * sin(ph) * mv, lift = max(cos(ph), 0.) * mv, lw = smoothstep(.42, .6, w) * (w - .42) * 1.7;
    vec3 d = p - aPivot; float c = cos(ang), sn = sin(ang);
    d.yz = vec2(d.y * c + d.z * sn, d.z * c - d.y * sn);
    d.z -= lw * aPivot.y * (.5 + uRun * .3) * lift * uGait.y * (aPivot.z > 0. ? 1. : .55);
    d.y += lw * aPivot.y * (.3 + uRun * .25) * lift * uGait.y * 1.6;
    p = aPivot + d;
    p.y += uGait.z * uH * sin(cyc * 12.566) * mv * (1. - w);
  } else {
    if(part > 1.5 && part != 3.){
      float sw = part > 3.5 ? aAnim.y : 0.;
      if(part > 4.5){ float fl = sw * uH * (.5 + .5 * sin(uTime * 1.1 + seed * 5.)); p.x += sign(aPivot.x) * fl * .1; p.z += fl * .04; }
      else if(part > 3.5){ p.x += sw * sw * uH * .1 * sin(uTime * .9 + seed * 7.); p.z += sw * sw * uH * .07 * sin(uTime * .6 + seed * 3.) + sw * sw * sw * uH * .1; }
      float a = (uGraze * gz * (.75 + .25 * sin(uTime * 2.3 + seed)) + uGait.w * sin(cyc * 12.566 + 1.) * mv + .05 * sin(uTime * .5 + seed * 9.)) * aAnim.x;
      vec3 d = p - aPivot; float c = cos(a), sn = sin(a);
      d.yz = vec2(d.y * c - d.z * sn, d.z * c + d.y * sn); n.yz = vec2(n.y * c - n.z * sn, n.z * c + n.y * sn);
      p = aPivot + d;
    } else if(part > 2.5){ p.x += aAnim.y * aAnim.y * uH * .12 * sin(uTime * 2.1 + seed * 11.) ; p.z -= aAnim.y * uH * .05 * uRun; }
    p.y += uGait.z * uH * sin(cyc * 12.566) * mv + p.z * uRun * .09 * sin(cyc * 6.2832 + 1.2);
  }
  gThin = aGlow;
}
`;
const PATTERNS = { none: 0, patches: 1, stripes: 2, spots: 3, band: 4 };
const HERD_PATTERN = /* glsl */`
uniform vec4 uPat; uniform vec3 uPatColor;
vec3 ph3(vec3 p){ p = vec3(dot(p, vec3(127.1, 311.7, 74.7)), dot(p, vec3(269.5, 183.3, 246.1)), dot(p, vec3(113.5, 271.9, 124.6))); return fract(sin(p) * 43758.5453); }
vec2 voro(vec3 x){ vec3 i = floor(x), f = fract(x); float d1 = 8., d2 = 8.;
  for(int a = -1; a <= 1; a++) for(int b = -1; b <= 1; b++) for(int c = -1; c <= 1; c++){ vec3 g = vec3(float(a), float(b), float(c)); vec3 r = g + ph3(i + g) * .8 + .1 - f; float d = dot(r, r); if(d < d1){ d2 = d1; d1 = d; } else if(d < d2) d2 = d; }
  return sqrt(vec2(d1, d2)); }
vec3 pattern(vec3 base, vec3 lp, float mask){
#if PATTERN == 1
  #ifdef COAT_TINT
  // a coat colour was passed: the filter widens both ways and settles on the true mean, so the share of coat is the same at every distance
  vec2 v = voro(lp * uPat.x); float fw = length(fwidth(lp * uPat.x)), fa = min(fw, .3) * .5;
  float cell = mix(smoothstep(.05 - fa, .2 + fa, v.y - v.x), .61, smoothstep(.2, .7, fw));
  #else
  vec2 v = voro(lp * uPat.x); float fw = length(fwidth(lp * uPat.x)), cell = smoothstep(.05, .2 + fw, v.y - v.x);
  cell = mix(cell, .8, smoothstep(.3, .9, fw));                    // far away: the mean coat colour instead of noise
  #endif
  return mix(base, mix(uPatColor, base * (.8 + .3 * fract(v.x * 7.) * (1. - smoothstep(.2, .6, fw))), cell), mask);
#elif PATTERN == 2
  float H = uPat.y, leg = 1. - smoothstep(.5 * H, .62 * H, lp.y), nk = smoothstep(uPat.z * .8, uPat.z * 1.3, lp.z) * smoothstep(.95 * H, 1.1 * H, lp.y);
  vec3 dir = normalize(mix(mix(vec3(0., .25, 1.), vec3(0., 1., .1), leg), vec3(0., .75, -.65), nk));
  float sp = dot(lp, dir) * uPat.x / H + sin(lp.y * 5. / H + lp.x * 3.) * .6, fw = fwidth(sp);
  float st = smoothstep(-.25 - fw, .25 + fw, sin(sp)); st = mix(st, .5, smoothstep(.9, 2.4, fw));   // stripes melt to grey before they alias
  return mix(base, mix(uPatColor, base, st), mask);
#elif PATTERN == 3
  vec2 v = voro(lp * uPat.x); float fw = length(fwidth(lp * uPat.x));
  #ifdef COAT_TINT
  // a coat colour was passed: spots cover about 2% of the back up close, and the filter keeps it there. (The preset's filter
  // below widens the spots outward only: about 25% of the back at middle distance and 10% far away, which washes a dark coat pale.)
  float fa = min(fw, .16) * .5, sp = mix(1. - smoothstep(.12 - fa, .2 + fa, v.x), .026, smoothstep(.1, .5, fw)) * smoothstep(.72 * uPat.y, .86 * uPat.y, lp.y) * (1. - smoothstep(uPat.z, uPat.z * 1.4, lp.z));
  #else
  float sp = mix(smoothstep(.2 + fw, .12, v.x), .1, smoothstep(.3, .9, fw)) * smoothstep(.72 * uPat.y, .86 * uPat.y, lp.y) * (1. - smoothstep(uPat.z, uPat.z * 1.4, lp.z));
  #endif
  return mix(base, uPatColor, sp * mask * .85);
#elif PATTERN == 4
  float H = uPat.y, b = smoothstep(.66 * H, .69 * H, lp.y) * (1. - smoothstep(.75 * H, .78 * H, lp.y)) * smoothstep(-uPat.z * .8, -uPat.z * .5, lp.z) * (1. - smoothstep(uPat.z * .7, uPat.z * 1.0, lp.z));
  return mix(base, uPatColor, b * mask);
#else
  return base;
#endif
}
`;

// makeHerd(opts): quadrupeds on terrain. species: deer | antelope | horse | zebra | elephant | giraffe | bison.
//   mode 'graze' (default): each animal ambles its own small loop inside center/radius, pausing to graze.
//   mode 'migrate': the herd walks (or gait:'run' gallops) along a shared route: route | cross | along | center+radius.
//   heightAt(x, z): terrain height; tracks are baked onto it at build time (count x 48 samples).
//   colours: coat, belly, legs, sock, accent, horn, hoof, rump (any THREE.Color input). `coat` alone recolours the whole animal:
//   belly, legs, sock, accent (spots, stripes, muzzle, mane) and rump follow it as tints and shades with the preset's contrast,
//   and the coat pattern keeps its mean at every distance. Pass any of belly / legs / sock / accent as well and the rest stay at
//   the preset's own colours. markings: 'tint' | 'preset' forces one or the other.
export function makeHerd(opts = {}) {
  const rng = rngOf(opts), pre = opts.preset, name = (typeof pre === 'string' ? pre : null) || opts.species || 'deer';
  const P = (pre && typeof pre === 'object' ? pre : null) || HERD_PRESETS[name] || HERD_PRESETS.deer, o = (k) => opts[k] ?? P[k];
  const S = { ...P }; for (const k of ['coat', 'belly', 'legs', 'sock', 'accent', 'horn', 'hoof', 'rump']) if (opts[k] !== undefined) S[k] = opts[k];
  // A coat passed on its own recolours the whole animal: the preset's markings (belly, legs, sock, accent, rump) are absolute
  // colours chosen for the preset's coat, so each one is re-based on the new coat (markingOf). Callers that also pass a marking
  // are setting a palette of their own and keep the preset's other markings as before; `markings` overrides either way.
  const tinted = opts.coat !== undefined && (opts.markings !== undefined ? opts.markings === 'tint' : MARKS.every((k) => opts[k] === undefined));
  if (tinted) for (const k of [...MARKS, 'rump']) if (opts[k] === undefined) S[k] = markingOf(P[k] ?? (k === 'rump' ? RUMP : P.coat), P.coat, opts.coat);
  const base = opts.geometry || quadrupedGeometry(S), count = Math.max(1, Math.floor(o('count'))), size = opts.size ?? 1, H = P.h;
  const hAt = opts.heightAt || (() => opts.y ?? (opts.center ? (opts.center.y ?? opts.center[1]) : 0)), migrate = (opts.mode || 'graze') === 'migrate', run = opts.gait === 'run';
  const W = migrate ? 96 : 48, data = new Float32Array(W * count * 4), iA = new Float32Array(count * 4), iB = new Float32Array(count * 4), iT = new Float32Array(count * 3);
  const center = v3(opts.center, new THREE.Vector3(0, 0, 0)), radius = opts.radius ?? 30 + H * 6, speed = (opts.speed ?? P.speed) * (run ? 4.2 : 1);
  const tints = (opts.tints || P.tints || ['#ffffff']).map((c) => col(c)), sizes = opts.sizes || P.sizes, tmp = new THREE.Vector3(), tan = new THREE.Vector3();
  let T = null, closed = true, baseCurve = null, baseLen = 1;
  if (migrate) {
    let pts, mode = 'loop';
    if (opts.cross && opts.cross.path) { pts = crossPoints(opts.cross.path, { height: 0, span: 260, ...opts.cross }); closed = false; mode = 'cross'; }
    else if (opts.along && opts.along.path) { pts = alongPoints(opts.along.path, { side: 30, ...opts.along }); closed = false; mode = 'along'; }
    else if (opts.route) { pts = opts.route.map((p) => v3(p)); closed = opts.closed !== false; }
    else pts = loopPoints(rng, center, radius, { height: 0, wobble: 0.25, points: 10 });
    baseCurve = new THREE.CatmullRomCurve3(pts, closed, 'centripetal'); baseLen = baseCurve.getLength();
    const c = opts.cross, a = opts.along, phase = rng() * baseLen; let fn;
    if (mode === 'cross') { const cu = c.u ?? 0.5, dur = c.duration ?? opts.duration, win = c.window ?? (dur ? baseLen / (2 * speed * dur) : 0.25); fn = (time, u) => (u === undefined ? (time * speed + phase) % (baseLen * 1.2) : ((u - (cu - win)) / (2 * win)) * baseLen); }
    else if (mode === 'along') { const from = a.from ?? -0.05, to = a.to ?? 1.1; fn = (time, u) => (u === undefined ? (time * speed + phase) % baseLen : ((u - from) / (to - from)) * baseLen + (a.lead ?? 30)); }
    else fn = (time) => (phase + time * speed) % (closed ? baseLen : baseLen * 1.2);
    T = makeTravel(fn, speed, mode, baseLen, a ? a.tread ?? 120 : 120);
  }
  const spread = opts.spread ?? (migrate ? [H * 4 + 3, H * 10 + count * 0.8] : null), bodyLen = (P.bodyLen ?? 0.5) * H, placed = [];
  for (let i = 0; i < count; i++) {
    const sc = size * (sizes ? sizes[i % sizes.length] : rng.range(0.82, 1.1));
    let len = 1, lag = 0;
    if (migrate) {
      const off = rng.gauss() * spread[0] * 0.5; lag = rng() * spread[1];
      for (let j = 0; j < W; j++) { const t = closed ? j / W : j / (W - 1); baseCurve.getPointAt(t, tmp); baseCurve.getTangentAt(t, tan); const x = tmp.x - tan.z * off, z = tmp.z + tan.x * off, k = (i * W + j) * 4; data[k] = x; data[k + 1] = hAt(x, z); data[k + 2] = z; }
      len = baseLen;
    } else {
      // every animal ambles its own loop; loops are kept apart (Poisson-style) so neighbours never walk through each other
      let cx = 0, cz = 0, r = 0, shrink = 1, grow = 1; const need = bodyLen * sc * 0.6 + 0.3;
      for (let tries = 0; tries < 30; tries++) {
        const a = rng() * 6.283, rr = Math.sqrt(rng()) * radius * grow; cx = center.x + Math.cos(a) * rr; cz = center.z + Math.sin(a) * rr; r = rng.range(2.5, 6) * (0.6 + H * 0.5) * (opts.roam ?? 1) * shrink;
        let ok = !opts.path || opts.path.nearestXZ(cx, cz).dist > r * 1.3 + (opts.clear ?? 10);
        for (let k = 0; ok && k < placed.length; k++) { const q = placed[k]; if (Math.hypot(cx - q[0], cz - q[1]) < r * 1.3 + q[2]) ok = false; }
        if (ok) break;
        if (tries % 5 === 4) { shrink = Math.max(0.3, shrink * 0.78); grow = Math.min(1.8, grow * 1.1); }
      }
      placed.push([cx, cz, r * 1.3 + need * 2]);
      const lp = loopPoints(rng, [cx, 0, cz], r, { height: 0, wobble: 0.3, points: 7 }), cv = new THREE.CatmullRomCurve3(lp, true, 'centripetal'); cv.arcLengthDivisions = 60; len = cv.getLength();
      for (let j = 0; j < W; j++) { cv.getPointAt(j / W, tmp); const k = (i * W + j) * 4; data[k] = tmp.x; data[k + 1] = hAt(tmp.x, tmp.z); data[k + 2] = tmp.z; }
      lag = rng() * len;
    }
    iA.set([i, len, lag, rng()], i * 4); iB.set([sc, rng() < (opts.varieties ?? P.varieties ?? 1) ? 1 : 0, rng() * 100, rng.range(0.75, 1.2)], i * 4);
    const t = tints[Math.floor(rng() * tints.length)], l = rng.range(0.88, 1.1); iT.set([t.r * l, t.g * l, t.b * l], i * 3);
  }
  const tex = new THREE.DataTexture(data, W, count, THREE.RGBAFormat, THREE.FloatType); tex.minFilter = tex.magFilter = THREE.NearestFilter; tex.generateMipmaps = false; tex.needsUpdate = true;
  const pat = PATTERNS[opts.pattern ?? P.pattern] || 0, stride = (opts.stride ?? P.stride) * H * (run ? 2.3 : 1);
  const spec = {
    instanced: true, light: opts.light, bank: 0, eps: run ? 0.12 : 0.5, level: 0.55,
    pre: HERD_PRE, traj: HERD_TRAJ, deform: HERD_DEFORM, pattern: pat ? HERD_PATTERN : '', defines: { ...(migrate ? { MIGRATE: 1 } : {}), ...(pat ? { PATTERN: pat } : {}), ...(pat && tinted ? { COAT_TINT: 1 } : {}) },
    rim: opts.rim ?? 0.45, spec: 0.12, shine: 10, trans: 0, vivid: 0.1, fill: opts.fill ?? 0.3, glow: col(opts.glow ?? P.glow ?? '#000000').multiplyScalar(opts.glowIntensity ?? P.glowK ?? 1), glowAnim: P.glowAnim || [0.7, 0.3, 1.5, 0],
    uniforms: {
      uTracks: { value: tex }, uTrackInfo: { value: new THREE.Vector3(W, closed ? 1 : 0, 0) }, uTravel: { value: 0 }, uSpeed: { value: speed }, uPause: { value: opts.pause ?? 0.16 },
      uGraze: { value: opts.graze ?? P.graze }, uRun: { value: run ? 1 : 0 }, uH: { value: H },
      uGait: { value: new THREE.Vector4(stride, run ? 0.7 : (opts.swing ?? 0.36), run ? 0.035 : 0.012, run ? 0.1 : 0.05) },
      uPat: { value: new THREE.Vector4({ 1: 4.6 / Math.sqrt(H / 3), 2: 34, 3: 9 / H, 4: 1 }[pat] || 1, H, (P.bodyLen * H) / 2, 0) }, uPatColor: { value: col(S.accent) },
    },
  };
  const material = creatureMaterial(spec), u = material.uniforms, sphere = sphereOfPoints(data, 4, W * count, H * size * 2.5 + 2);
  const geometry = instancedGeo(base, count, iA, iB, iT), mesh = creatureMesh(geometry, material, 0, sphere);
  let object = mesh, su = null;
  if (opts.blobShadow !== false) {
    const sz = opts.shadowSize || P.shadow || [(P.width ?? 0.3) * H * 0.85, bodyLen * 0.72, bodyLen * 0.08];
    const sm = shadowMaterial(spec, sz, opts.shadowOpacity ?? 0.42), shadow = creatureMesh(instancedGeo(blobGeometry(), count, iA, iB, iT), sm, 1, sphere);
    su = sm.uniforms; object = new THREE.Group(); object.add(shadow, mesh);
  }
  return {
    object, mesh, material, uniforms: u, geometry, count, bounds: sphere, species: name, triangles: triCount(base) * count,
    update(dt, time, camera, pu) { u.uTime.value = time; u.uQ.value = time; if (T) { u.uTravel.value = T.step(dt, time, pu); u.uVis.value = T.state.vis; } if (su) { su.uTime.value = time; su.uQ.value = time; su.uVis.value = u.uVis.value; } },
    setLight(light, over) { applyLight(u, light, over); },
    positionAt(time, pu, out = new THREE.Vector3()) { if (migrate) { const s = T.travel(time, pu) / baseLen; baseCurve.getPointAt(closed ? ((s % 1) + 1) % 1 : Math.min(1, Math.max(0, s)), out); out.y = hAt(out.x, out.z) + H; return out; } return out.set(data[0], data[1] + H, data[2]); },
  };
}

// ---------- wading birds ----------
export const WADER_PRESETS = {
  heron: { h: 1.05, leg: 0.4, bodyLen: 0.44, girth: 0.1, neckLen: 0.4, neckBow: 0.1, beak: 0.17, pitch: 32, body: '#8c9cae', belly: '#dfe4e8', wing: '#5e6c7e', neckC: '#eeeeea', cap: '#2c3440', beakC: '#eab02c', legC: '#7a7650', count: 5 },
  egret: { h: 0.95, leg: 0.42, bodyLen: 0.4, girth: 0.09, neckLen: 0.42, neckBow: 0.11, beak: 0.15, pitch: 30, body: '#f6f6f2', belly: '#ffffff', wing: '#ecece8', neckC: '#f8f8f4', cap: '#f8f8f4', beakC: '#f0b428', legC: '#2a2a26', count: 7 },
  crane: { h: 1.45, leg: 0.44, bodyLen: 0.42, girth: 0.105, neckLen: 0.4, neckBow: 0.05, beak: 0.1, pitch: 18, body: '#f4f4f0', belly: '#ffffff', wing: '#2a2a2e', neckC: '#26262a', cap: '#e02a20', beakC: '#c8c0a0', legC: '#3a3a3a', plume: 1, count: 6 },
  flamingo: { h: 1.3, leg: 0.5, bodyLen: 0.34, girth: 0.085, neckLen: 0.46, neckBow: 0.17, beak: 0.1, beakBend: 1, pitch: 12, body: '#ffaab6', belly: '#ffc4cc', wing: '#ff8698', neckC: '#ffb8c2', cap: '#ffb8c2', beakC: '#2a1c1e', legC: '#ff94a4', oneLeg: 0.5, count: 26 },
  stork: { h: 1.15, leg: 0.44, bodyLen: 0.42, girth: 0.1, neckLen: 0.36, neckBow: 0.05, beak: 0.2, pitch: 24, body: '#f4f4f0', belly: '#ffffff', wing: '#1e1e22', neckC: '#f4f4f0', cap: '#f4f4f0', beakC: '#e0402a', legC: '#e0503a', count: 5 },
};
// Y-up, facing +Z. aAnim = (leg index | neck weight, limb weight, part: 1 leg 2 neck/head, 0)
export function waderGeometry(S) {
  const g = new Geo(), H = S.h, ll = S.leg * H, bl = S.bodyLen * H, G = S.girth * H, cB = col(S.body), cBel = col(S.belly), cW = col(S.wing), cN = col(S.neckC), cCap = col(S.cap), cBk = col(S.beakC), cL = col(S.legC);
  const pa = (S.pitch * Math.PI) / 180, by = ll + G * 0.75;
  for (const [k, sx] of [[0, -1], [1, 1]]) {
    const x = sx * G * 0.42, r = g.tube([[x, by, -0.02 * H], [x, ll * 0.55, -0.045 * H], [x, 0.02 * H, 0], [x, 0, 0.015 * H]], [0.02 * H, 0.012 * H, 0.011 * H, 0.012 * H], 4, cL);
    const toes = g.fan([[x, 0.005 * H, -0.02 * H], [x - 0.04 * H, 0, 0.06 * H], [x, 0.004 * H, 0.085 * H], [x + 0.04 * H, 0, 0.06 * H]], cL);
    g.anim([r[0], toes[1]], (px, py) => [k, Math.min(1, Math.max(0, (by - py) / by)), 1, 0]); g.pivot([r[0], toes[1]], x, by, -0.02 * H);
  }
  const b0 = g.n;
  const body = g.loft([{ z: -0.62 * bl, y: -0.1 * G, rx: 0, ry: 0 }, { z: -0.4 * bl, y: 0, rx: 0.5 * G, ry: 0.42 * G }, { z: -0.1 * bl, rx: G * 0.98, ry: G * 0.95 }, { z: 0.2 * bl, rx: G, ry: G * 1.02 }, { z: 0.42 * bl, y: 0.12 * G, rx: 0.66 * G, ry: 0.7 * G }, { z: 0.54 * bl, y: 0.3 * G, rx: 0.3 * G, ry: 0.32 * G, top: cN, belly: cN }], { sides: 7, top: cB, belly: cBel, shade: [-0.5, 0.1] });
  g.paint(body, (x, y, z, c) => { if (Math.abs(x) > G * 0.55 && y > -0.3 * G && z < 0.25 * bl) c.lerp(cW, 0.85); if (z < -0.36 * bl) c.lerp(cW, 0.9); });
  if (S.plume) for (const sx of [-1, 1]) g.fan([[sx * 0.3 * G, 0.5 * G, -0.3 * bl], [sx * 0.6 * G, 0.3 * G, -0.8 * bl], [sx * 0.2 * G, -0.5 * G, -0.9 * bl], [0, 0.0, -0.5 * bl]], cW);
  g.move([b0, g.n], (p) => { const y = p.y, z = p.z; p.y = y * Math.cos(pa) + z * Math.sin(pa) + by + 0.1 * G; p.z = z * Math.cos(pa) - y * Math.sin(pa); });
  // S-curved neck from the chest to the head
  const nb = [0, by + 0.1 * G + Math.sin(pa) * 0.5 * bl + 0.25 * G, Math.cos(pa) * 0.5 * bl], top = [0, H - 0.045 * H, nb[2] + 0.07 * H], n0 = g.n, pts = [], rr = [], m = 7;
  for (let i = 0; i <= m; i++) { const t = i / m, s = Math.sin(t * Math.PI), s2 = Math.sin(t * Math.PI * 2); pts.push([0, nb[1] + (top[1] - nb[1]) * t + s2 * S.neckBow * H * 0.25, nb[2] + (top[2] - nb[2]) * t + s2 * S.neckBow * H * 0.9 - s * S.neckBow * H * 0.25]); rr.push(0.3 * G * (1 - t) + 0.021 * H * (0.6 + 0.4 * t) + (i === 0 ? 0.1 * G : 0)); }
  g.tube(pts, rr, 5, cN, cN);
  const hr = 0.034 * H, hz = top[2] + 0.01 * H, hy = top[1] + 0.012 * H, bkl = S.beak * H;
  g.blob(0, hy, hz + 0.01 * H, hr * 0.85, hr, hr * 1.4, cCap, cN, 5, 3);
  if (S.beakBend) g.tube([[0, hy - 0.003 * H, hz + hr], [0, hy - 0.012 * H, hz + hr + bkl * 0.5], [0, hy - 0.06 * H, hz + hr + bkl * 0.78]], [hr * 0.6, hr * 0.5, 0.004 * H], 4, cN, cBk);
  else g.tube([[0, hy - 0.004 * H, hz + hr * 0.8], [0, hy - 0.014 * H, hz + hr + bkl]], [hr * 0.5, 0], 4, cBk);
  for (const sx of [-1, 1]) g.blob(sx * hr * 0.7, hy + 0.2 * hr, hz + hr * 0.5, hr * 0.14, hr * 0.2, hr * 0.2, col('#0a0806'), null, 4, 2);
  const span = top[1] - nb[1];
  g.anim([n0, g.n], (x, y) => [Math.min(1, Math.max(0, (y - nb[1]) / span)), 0, 2, 0]); g.pivot([n0, g.n], 0, nb[1], nb[2]);
  g.pivot([b0, n0], 0, by, 0);
  return g.build();
}
const WADER_PRE = /* glsl */`
uniform vec4 uPeck; uniform float uH, uLeg;
`;
const WADER_TRAJ = /* glsl */`
vec3 traj(float q){ gYaw = iB.w + .12 * sin(q * .23 + iB.z * 7.); return iA.xyz; }
`;
const WADER_DEFORM = /* glsl */`
void deform(inout vec3 p, inout vec3 n){
  float seed = iB.z, h1 = h11(seed), h2 = h11(seed + 2.);
  float pk = pow(max(sin(uTime * uPeck.x * (.6 + .8 * h1) + seed * 20.), 0.), uPeck.w) * step(uPeck.z, h2);
  float part = aAnim.z;
  if(part > .5 && part < 1.5){
    if(iB.y > .5 && aAnim.x > .5){ float w = aAnim.y, k = smoothstep(.4, .6, w); p.y += k * (w - .45) * uLeg * 1.5; p.z += k * uH * .05 * sin((w - .45) * 5.); }
  } else {
    if(part > 1.5){
      float a = (pk * uPeck.y + .1 * sin(uTime * .6 + seed * 5.) * (1. - pk)) * aAnim.x;
      vec3 d = p - aPivot; float c = cos(a), s = sin(a);
      d.yz = vec2(d.y * c - d.z * s, d.z * c + d.y * s); n.yz = vec2(n.y * c - n.z * s, n.z * c + n.y * s);
      d.z += .25 * a * (1. - aAnim.x) * aAnim.x * uH;
      p = aPivot + d;
    }
    float b = pk * .5 + .025 * sin(uTime * .9 + seed * 3.);
    vec3 hp = vec3(0., uLeg, 0.), d = p - hp; float c = cos(b), s = sin(b);
    d.yz = vec2(d.y * c - d.z * s, d.z * c + d.y * s); n.yz = vec2(n.y * c - n.z * s, n.z * c + n.y * s);
    p = hp + d;
  }
}
`;
// makeWaders(opts): herons, egrets, cranes, flamingos or storks standing in shallows, preening and striking at fish.
//   positions | center + radius (+ heightAt); level = water surface y; feet stand `depth` below it (or on heightAt if higher).
export function makeWaders(opts = {}) {
  const rng = rngOf(opts), name = opts.species || opts.preset || 'heron', P = WADER_PRESETS[name] || WADER_PRESETS.heron, S = { ...P };
  for (const k of ['body', 'belly', 'wing', 'neckC', 'cap', 'beakC', 'legC']) if (opts[k] !== undefined) S[k] = opts[k];
  const base = waderGeometry(S), count = Math.max(1, Math.floor(opts.count ?? P.count)), size = opts.size ?? 1, H = P.h;
  const c = v3(opts.center, new THREE.Vector3()), radius = opts.radius ?? (3 + Math.sqrt(count) * 1.6), level = opts.level ?? c.y, depth = opts.depth ?? P.leg * H * 0.35;
  const iA = new Float32Array(count * 4), iB = new Float32Array(count * 4), iT = new Float32Array(count * 3), pts = opts.positions, face = opts.facing ?? rng() * 6.283;
  for (let i = 0; i < count; i++) {
    let x, z;
    if (pts && pts[i]) { x = pts[i].x ?? pts[i][0]; z = pts[i].z ?? pts[i][2]; } else { const a = rng() * 6.283, r = Math.pow(rng(), 0.7) * radius; x = c.x + Math.cos(a) * r; z = c.z + Math.sin(a) * r; }
    const sc = size * rng.range(0.85, 1.12), gy = opts.heightAt ? opts.heightAt(x, z) : -Infinity, y = Math.max(gy, level - depth * sc);
    iA.set([x, y, z, rng()], i * 4); iB.set([sc, rng() < (opts.oneLeg ?? P.oneLeg ?? 0.15) ? 1 : 0, rng() * 100, face + rng.gauss() * (opts.scatterYaw ?? 0.9)], i * 4);
    const l = rng.range(0.92, 1.06); iT.set([l, l, l], i * 3);
  }
  const spec = { instanced: true, upright: true, light: opts.light, pre: WADER_PRE, traj: WADER_TRAJ, deform: WADER_DEFORM, rim: opts.rim ?? 0.5, spec: 0.15, shine: 12, vivid: 0.2,
    uniforms: { uPeck: { value: new THREE.Vector4(opts.peckRate ?? 0.5, opts.peckAngle ?? 1.35, 1 - (opts.active ?? 0.6), 8) }, uH: { value: H }, uLeg: { value: P.leg * H + P.girth * H * 0.75 } } };
  const material = creatureMaterial(spec), u = material.uniforms, sphere = sphereOfPoints(iA, 4, count, H * size * 1.6 + 1);
  const geometry = instancedGeo(base, count, iA, iB, iT), mesh = creatureMesh(geometry, material, 0, sphere);
  let object = mesh, su = null;
  if (opts.blobShadow !== false) {   // on the water surface when the feet are under it: reads as shadow and reflection
    const sm = shadowMaterial(spec, [P.girth * H * 2.2, P.bodyLen * H * 0.95, 0, 0.03], opts.shadowOpacity ?? 0.34, level), shadow = creatureMesh(instancedGeo(blobGeometry(), count, iA, iB, iT), sm, 1, sphere);
    su = sm.uniforms; object = new THREE.Group(); object.add(shadow, mesh);
  }
  return { object, mesh, material, uniforms: u, geometry, count, bounds: sphere, species: name, triangles: triCount(base) * count,
    update(dt, time) { u.uTime.value = time; u.uQ.value = time; if (su) { su.uTime.value = time; su.uQ.value = time; } }, setLight(light, over) { applyLight(u, light, over); },
    positionAt(time, pu, out = new THREE.Vector3()) { return out.set(iA[0], iA[1] + H * 0.6, iA[2]); } };
}
