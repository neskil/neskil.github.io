// The hound and the fog bank: the hero of The Moor Under the Fog Bank. Also the makers of the moor ponies and of the still figure on the tor.
//
// The hound is one skinned mesh (two bones a vertex, posed on the CPU from the metres it has run: a bounding gallop), black, with a pale
// BLUE-WHITE fire (HOUND_FIRE below): lit edges on muzzle, hackles and dewlap, flame cards streaming from the mouth and standing
// short along the neck (none down the back), glowing eyes, and a light that falls on the ground and into the
// fog. Its flanks, legs and tail carry no fire: by a moon they have the dim edge the ponies have, in the moon's own colour.
// The fog is ONE BODY, a heaving surface over its own floor with a fringe of tongues and drifts (THE SEA OF FOG below): the world's
// sea and the hero's slab are made by the same maker.
import * as THREE from 'three';
import { clamp, lerp, smoothstep, makeRng, hashSeed } from '../kit/core.js';

export const HOUND_LENGTH = 3.1;
const DEG = Math.PI / 180;

const MAXB = 22;
// THE FIRE'S COLOUR, named once: a pale blue-white, on the blue side (round 9; the night's fourth light, unlike the moon's silver, the hall's gold
// and the mine's red). HOUND_FIRE is the hue of all the hound's fire (its lit edges, eyes and mouth, its
// pool on the ground, its halo; the world gives the same to the glow at its head and to the light it throws about it); GHOST_FIRE is the second
// hound's, paler. The flame cards run a deeper blue at the root to near white at the tips (FLAME_FRAG).
export const HOUND_FIRE = '#a2dcec', GHOST_FIRE = '#e0eef8';
const FIRE = HOUND_FIRE;

// ------------------------------------------------------------------------------------------------ a small rig: bones posed on the CPU
// defs: [{ name, parent (index, -1 for the root), at: [x, y, z] (the joint, in the rest pose, model space) }], parents before children.
function makeRig(defs) {
  const n = defs.length, rest = defs.map((d) => new THREE.Vector3(d.at[0], d.at[1], d.at[2])), parent = defs.map((d) => d.parent);
  const rot = defs.map(() => new THREE.Euler(0, 0, 0, 'YXZ')), shift = defs.map(() => new THREE.Vector3());
  const world = defs.map(() => new THREE.Matrix4()), data = new Float32Array(16 * MAXB), m = new THREE.Matrix4(), t = new THREE.Matrix4();
  const index = {}; defs.forEach((d, i) => { index[d.name] = i; });
  for (let i = 0; i < MAXB; i++) data[i * 16] = data[i * 16 + 5] = data[i * 16 + 10] = data[i * 16 + 15] = 1;
  const solve = () => {
    for (let i = 0; i < n; i++) {
      const q = parent[i], r = rest[i], sh = shift[i];
      m.makeRotationFromEuler(rot[i]);
      if (q < 0) m.setPosition(r.x + sh.x, r.y + sh.y, r.z + sh.z); else m.setPosition(r.x - rest[q].x + sh.x, r.y - rest[q].y + sh.y, r.z - rest[q].z + sh.z);
      if (q < 0) world[i].copy(m); else world[i].multiplyMatrices(world[q], m);
      t.makeTranslation(-r.x, -r.y, -r.z); m.multiplyMatrices(world[i], t); m.toArray(data, i * 16);
    }
  };
  const reset = () => { for (let i = 0; i < n; i++) { rot[i].set(0, 0, 0); shift[i].set(0, 0, 0); } };
  solve();
  return { n, rest, rot, shift, world, data, index, solve, reset };
}

// A skin: vertices with a colour, two bones and a weight for the second, and a fourth number (how much of the fire lies on that vertex).
function makeSkin() {
  const pos = [], col = [], skin = [], idx = [];
  const vert = (x, y, z, c, sk, fire) => { pos.push(x, y, z); col.push(c[0], c[1], c[2]); skin.push(sk[0], sk[1], sk[2], fire); return pos.length / 3 - 1; };
  // A lofted tube through rings. axis 'z': rings lie across x (half width w) and y (half heights up and down); axis 'y': rings lie across
  // x (w) and z (up = toward +z, down = toward -z). ring: { p: [x, y, z], w, up, down, c, sk: [boneA, boneB, weightB], fire }
  const tube = (axis, rings, sides = 10, o = {}) => {
    const first = pos.length / 3;
    for (const r of rings) {
      for (let j = 0; j < sides; j++) {
        const a = j / sides * Math.PI * 2, ca = Math.cos(a), sa = Math.sin(a), ext = sa >= 0 ? r.up : (r.down ?? r.up);
        const sq = o.square ? Math.pow(Math.abs(ca), 0.7) * Math.sign(ca) : ca;
        const f = sa > 0.55 ? (r.fT ?? r.fire ?? 0) : sa < -0.55 ? (r.fD ?? r.fire ?? 0) : (r.fire ?? 0);
        if (axis === 'z') vert(r.p[0] + r.w * sq, r.p[1] + ext * sa, r.p[2], r.c, r.sk, f);
        else vert(r.p[0] + r.w * sq, r.p[1], r.p[2] + ext * sa, r.c, r.sk, f);
      }
    }
    const flip = axis === 'y';
    for (let i = 0; i < rings.length - 1; i++) for (let j = 0; j < sides; j++) {
      const a = first + i * sides + j, b = first + i * sides + (j + 1) % sides, c = a + sides, d = b + sides;
      if (flip) idx.push(a, c, b, b, c, d); else idx.push(a, b, c, b, d, c);
    }
    for (const [k, end] of [[0, 0], [rings.length - 1, 1]]) {
      const r = rings[k], cv = vert(r.p[0], r.p[1], r.p[2], r.c, r.sk, r.fire ?? 0), base = first + k * sides;
      for (let j = 0; j < sides; j++) { const a = base + j, b = base + (j + 1) % sides; if ((end === 1) !== flip) idx.push(a, b, cv); else idx.push(b, a, cv); }
    }
  };
  // a flat two-sided flap (ears): a fan from the root's two ends to the tip, with a little thickness given by the normals of both faces
  const flap = (a, b, tip, c, sk, fire = 0) => {
    const i0 = vert(a[0], a[1], a[2], c, sk, fire), i1 = vert(b[0], b[1], b[2], c, sk, fire), i2 = vert(tip[0], tip[1], tip[2], c, sk, fire);
    const j0 = vert(a[0], a[1], a[2], c, sk, fire), j1 = vert(b[0], b[1], b[2], c, sk, fire), j2 = vert(tip[0], tip[1], tip[2], c, sk, fire);
    idx.push(i0, i1, i2, j1, j0, j2);
  };
  // a straight tapering rod between two points, any way up
  const rod = (p, q, r0, r1, c, sk, sides = 6, flat = 1) => {
    const d = new THREE.Vector3(q[0] - p[0], q[1] - p[1], q[2] - p[2]), a = new THREE.Vector3(0, 0, 1).cross(d), first = pos.length / 3;
    if (a.lengthSq() < 1e-8) a.set(1, 0, 0); a.normalize(); const b = new THREE.Vector3().crossVectors(d, a).normalize();
    for (const [pt, r] of [[p, r0], [q, r1]]) for (let j = 0; j < sides; j++) { const t = j / sides * Math.PI * 2, ca = Math.cos(t) * r, sa = Math.sin(t) * r * flat;
      vert(pt[0] + a.x * ca + b.x * sa, pt[1] + a.y * ca + b.y * sa, pt[2] + a.z * ca + b.z * sa, c, sk, 0); }
    for (let j = 0; j < sides; j++) { const v0 = first + j, v1 = first + (j + 1) % sides; idx.push(v0, v1, v0 + sides, v1, v1 + sides, v0 + sides); }
    const c0 = vert(p[0], p[1], p[2], c, sk, 0), c1 = vert(q[0], q[1], q[2], c, sk, 0);
    for (let j = 0; j < sides; j++) { const v0 = first + j, v1 = first + (j + 1) % sides; idx.push(v1, v0, c0, v0 + sides, v1 + sides, c1); }
  };
  const ball = (p, r, c, sk, fire = 0, sides = 6) => tube('z', [-0.9, -0.45, 0.2, 0.75].map((t) => { const rr = r * Math.sqrt(1 - t * t); return { p: [p[0], p[1], p[2] + t * r], w: rr, up: rr, c, sk, fire }; }), sides);
  const build = () => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    g.setAttribute('aSkin', new THREE.Float32BufferAttribute(skin, 4)); g.setIndex(idx); g.computeVertexNormals();
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 1, 0.3), 4);
    return g;
  };
  return { vert, tube, rod, flap, ball, build, count: () => idx.length / 3 };
}

// The lit material of a skinned beast: the bones are a uniform array, the fire is an emissive on the vertices that carry it, strongest
// where the surface turns away from the eye (so muzzle, hackles and dewlap read as edges of flame) and flickering along the body.
// THE FIRE IS ON THE VERTICES THAT CARRY IT AND NOWHERE ELSE: on the hound those are the muzzle and jaws, the hackles (the top of the
// neck and shoulders) and the dewlap (under the throat), with the eyes, gums and teeth (the vertices that carry
// more than 1.1 of fire), which burn whichever way they face. Its flanks, legs and tail carry none.
// o.sheen: a dim edge over the whole coat, and o.back: the same light lying along what faces upward (the line of the back and skull).
// These two are NOT fire: their colour is o.edge (the moon's own, for the hounds as for the ponies: a coal-black beast under a low
// moon is edged by the moon); where no o.edge is given they take o.fire's (the ponies hand the moon's so).
// o.fireMax: the sum of all this light is held under that number in its brightest channel (the world hands the bloom's threshold
// times two), keeping its colour.
function skinMaterial(rig, o = {}) {
  const u = { uBones: { value: rig.data }, uFire: { value: new THREE.Color(o.fire ?? FIRE) }, uFireK: { value: o.fireK ?? 0 }, uTime: { value: 0 }, uSheen: { value: o.sheen ?? 0 }, uBack: { value: o.back ?? 0 }, uFireMax: { value: o.fireMax ?? 1.8 },
    uEdge: { value: new THREE.Color(o.edge ?? o.fire ?? FIRE) } };
  const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: o.roughness ?? 0.6, metalness: 0 });
  const head = '#include <common>\nattribute vec4 aSkin;\nuniform mat4 uBones[' + MAXB + '];\nvarying float vFire;\nvarying vec3 vModel;\nvarying float vUpN;';
  const skin = 'mat4 skinM = uBones[int(aSkin.x + 0.5)] * (1.0 - aSkin.z) + uBones[int(aSkin.y + 0.5)] * aSkin.z;';
  mat.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, u);
    sh.vertexShader = sh.vertexShader.replace('#include <common>', head)
      .replace('#include <beginnormal_vertex>', skin + '\n#include <beginnormal_vertex>\nobjectNormal = mat3(skinM) * objectNormal;\nvUpN = normalize(objectNormal).y;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvFire = aSkin.w; vModel = transformed;\ntransformed = (skinM * vec4(transformed, 1.0)).xyz;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform vec3 uFire;\nuniform float uFireK;\nuniform float uTime;\nuniform float uSheen;\nuniform float uBack;\nuniform float uFireMax;\nuniform vec3 uEdge;\nvarying float vFire;\nvarying vec3 vModel;\nvarying float vUpN;')
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
        float fireRim = 1.0 - clamp(abs(dot(normalize(vNormal), normalize(vViewPosition))), 0.0, 1.0);
        float fireFl = 0.72 + 0.28 * sin(vModel.z * 9.0 + vModel.y * 7.0 - uTime * 13.0) * sin(vModel.x * 13.0 + uTime * 8.3);
        float fireRim2 = fireRim * fireRim;
        vec3 edgePale = mix(uEdge, vec3(1.0), 0.4);
        // (THE EDGE IS STEADY: the fire's flicker, fireFl, is on the fire's term alone; the moon's edge is held at the strength it
        // had at the flicker's mean, 0.888, so that it never wavers and never reads as fire)
        vec3 fireSum = uFire * (uFireK * vFire * (0.07 + 0.55 * smoothstep(1.1, 1.6, vFire) + 2.3 * fireRim2) * fireFl)
          + edgePale * ((uSheen * fireRim2 * fireRim2 + uBack * smoothstep(0.8, 1.0, vUpN) * (0.3 + 0.7 * fireRim)) * 0.888);
        totalEmissiveRadiance += fireSum * min(1.0, uFireMax / max(max(fireSum.r, fireSum.g), max(fireSum.b, 0.0001)));`);
  };
  mat.customProgramCacheKey = () => 'moor-skin-5';
  const depth = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking });
  depth.onBeforeCompile = (sh) => {
    sh.uniforms.uBones = u.uBones;
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute vec4 aSkin;\nuniform mat4 uBones[' + MAXB + '];')
      .replace('#include <begin_vertex>', skin + '\n#include <begin_vertex>\ntransformed = (skinM * vec4(transformed, 1.0)).xyz;');
  };
  depth.customProgramCacheKey = () => 'moor-skin-depth-1';
  return { mat, depth, u };
}

// The bones every four-legged beast here has (22). at: the joint in the rest pose, +z toward the nose, y up, the ground at 0.
function beastBones(q) {
  const B = [['root', -1, [0, q.back, q.mid]], ['pelvis', 0, [0, q.back, q.loin]], ['chest', 0, [0, q.back, q.mid + 0.1]], ['neck', 2, q.neck], ['head', 3, q.head], ['jaw', 4, q.jaw],
    ['earL', 4, [q.ear[0], q.ear[1], q.ear[2]]], ['earR', 4, [-q.ear[0], q.ear[1], q.ear[2]]], ['tail1', 1, q.tail], ['tail2', 8, [0, q.tail[1] - q.tailDrop * 0.5, q.tail[2] - q.tailLen * 0.5]]];
  for (const sx of [1, -1]) { const n = sx > 0 ? 'L' : 'R';
    B.push(['f' + n + '1', 2, [sx * q.fx, q.fy[0], q.fz[0]]], ['f' + n + '2', B.length, [sx * q.fx, q.fy[1], q.fz[1]]], ['f' + n + '3', B.length + 1, [sx * q.fx, q.fy[2], q.fz[2]]]); }
  for (const sx of [1, -1]) { const n = sx > 0 ? 'L' : 'R';
    B.push(['h' + n + '1', 1, [sx * q.hx, q.hy[0], q.hz[0]]], ['h' + n + '2', B.length, [sx * q.hx, q.hy[1], q.hz[1]]], ['h' + n + '3', B.length + 1, [sx * q.hx, q.hy[2], q.hz[2]]]); }
  return B.map((b) => ({ name: b[0], parent: b[1], at: b[2] }));
}

// One leg: three tapering segments down the joints and a paw (or hoof). r: the radii at shoulder, elbow, wrist and foot.
function legSkin(sk, ix, J, toe, r, c, cFoot, hoof) {
  const [a, b, d] = J, seg = (p, q, r0, r1, bA, bB, wTop) => {
    const rings = [];
    for (let i = 0; i <= 3; i++) { const t = i / 3; rings.push({ p: [lerp(p[0], q[0], t), lerp(p[1], q[1], t), lerp(p[2], q[2], t)], w: lerp(r0, r1, t) * 0.82, up: lerp(r0, r1, t), c, sk: [bA, bB, i === 0 ? wTop : 0] }); }
    sk.tube('y', rings.reverse(), 7);
  };
  seg([a[0], a[1] + r[0] * 0.5, a[2]], b, r[0], r[1], ix, ix - 0, 0);
  seg([b[0], b[1] + r[1] * 0.4, b[2]], d, r[1] * 0.92, r[2], ix + 1, ix, 0.5);
  seg([d[0], d[1] + r[2] * 0.4, d[2]], [toe[0], toe[1] + (hoof ? 0.09 : 0.07), toe[2] - (hoof ? 0 : 0.05)], r[2] * 0.95, r[3], ix + 2, ix + 1, 0.5);
  if (hoof) sk.tube('y', [{ p: [toe[0], 0, toe[2]], w: r[3] * 1.25, up: r[3] * 1.45, c: cFoot, sk: [ix + 2, ix + 2, 0] }, { p: [toe[0], 0.1, toe[2]], w: r[3] * 1.0, up: r[3] * 1.1, c: cFoot, sk: [ix + 2, ix + 2, 0] }], 7);
  else sk.tube('z', [{ p: [toe[0], 0.06, toe[2] - 0.09], w: r[3] * 1.0, up: 0.055, c: cFoot, sk: [ix + 2, ix + 2, 0] }, { p: [toe[0], 0.065, toe[2] + 0.02], w: r[3] * 1.25, up: 0.065, c: cFoot, sk: [ix + 2, ix + 2, 0] },
    { p: [toe[0], 0.05, toe[2] + 0.11], w: r[3] * 1.05, up: 0.045, c: cFoot, sk: [ix + 2, ix + 2, 0] }], 7);
}

// ------------------------------------------------------------------------------------------------ the hound
// A great hound of the mastiff and bloodhound kind: heavy square head, broad muzzle, hanging ears and dewlap, deep chest, tucked loin.
// Built 3.67 long (nose to the tip of the streaming tail) and scaled to HOUND_LENGTH.
const HOUND_Q = { back: 1.1, mid: -0.1, loin: -0.45, neck: [0, 1.2, 0.95], head: [0, 1.44, 1.36], jaw: [0, 1.37, 1.5], ear: [0.19, 1.6, 1.47], tail: [0, 1.14, -0.95], tailDrop: 0.2, tailLen: 0.78,
  fx: 0.26, fy: [0.98, 0.58, 0.2], fz: [0.6, 0.56, 0.6], hx: 0.25, hy: [1.0, 0.62, 0.3], hz: [-0.72, -0.54, -0.86] };
const HOUND_BUILT = 3.67;

function houndBeast(o = {}) {
  const q = HOUND_Q, rig = makeRig(beastBones(q)), sk = makeSkin(), br = o.brush ?? 1, TIP = o.tip ?? null;
  // (the colours under the fire, where it burns: gums, eyes and teeth in the fire's own pale blue-white; the fox hands its own)
  // (o.coatK: how much of its own colour the hound's coat keeps, 1 where none is handed: the world's night hands one)
  const CK = o.coatK ?? 1, BK = o.coat ?? [0.05 * CK, 0.053 * CK, 0.066 * CK], PAD = o.pad ?? [0.02, 0.02, 0.026], GUM = o.gum ?? [0.2, 0.4, 0.46], EYE = o.eye ?? [0.7, 0.9, 1.0], TOOTH = o.tooth ?? [0.9, 0.95, 0.98];
  const R = (z, y, w, up, down, bA, bB, wB, extra = {}) => ({ p: [0, y, z], w, up, down, c: BK, sk: [bA, bB, wB], ...extra });
  // rump to chest, then up the neck to the skull: fire ON THE HACKLES (the top of the neck and the shoulders: round 9, none on the
  // back behind the withers) and on the dewlap (under the neck)
  sk.tube('z', [R(-1.0, 1.1, 0.12, 0.1, 0.14, 1, 1, 0), R(-0.9, 1.1, 0.3, 0.21, 0.3, 1, 1, 0), R(-0.7, 1.09, 0.35, 0.24, 0.36, 1, 1, 0), R(-0.42, 1.08, 0.31, 0.21, 0.29, 1, 0, 0.5),
    R(-0.1, 1.08, 0.33, 0.21, 0.35, 0, 0, 0), R(0.22, 1.1, 0.38, 0.23, 0.48, 0, 2, 0.5), R(0.56, 1.12, 0.41, 0.27, 0.54, 2, 2, 0, { fT: 0.45 }),
    R(0.82, 1.16, 0.36, 0.27, 0.46, 2, 2, 0, { fT: 1 }), R(0.98, 1.22, 0.27, 0.24, 0.37, 2, 3, 0.5, { fT: 1, fD: 0.5 }), R(1.13, 1.32, 0.225, 0.22, 0.31, 3, 3, 0, { fT: 1, fD: 1 }),
    R(1.27, 1.41, 0.21, 0.2, 0.28, 3, 4, 0.5, { fT: 0.9, fD: 1 }), R(1.4, 1.47, 0.215, 0.2, 0.23, 4, 4, 0, { fT: 0.5, fD: 0.7 }), R(1.53, 1.47, 0.205, 0.17, 0.17, 4, 4, 0, { fire: 0.2 }),
    R(1.62, 1.45, 0.16, 0.12, 0.08, 4, 4, 0, { fire: 0.6 })], 12);
  // the muzzle (upper jaw, square and broad, with hanging flews) and the lower jaw, each its own tube so that the mouth can gape
  sk.tube('z', [R(1.6, 1.44, 0.15, 0.115, 0.07, 4, 4, 0, { fire: 0.7 }), R(1.74, 1.43, 0.145, 0.105, 0.085, 4, 4, 0, { fire: 1 }), R(1.9, 1.42, 0.14, 0.1, 0.085, 4, 4, 0, { fire: 1 }), R(1.98, 1.42, 0.105, 0.07, 0.06, 4, 4, 0, { fire: 1 })], 8, { square: true });
  sk.tube('z', [R(1.48, 1.33, 0.125, 0.04, 0.08, 5, 5, 0, { fire: 0.5 }), R(1.68, 1.33, 0.118, 0.034, 0.065, 5, 5, 0, { fire: 1 }), R(1.86, 1.335, 0.105, 0.03, 0.05, 5, 5, 0, { fire: 1 }), R(1.93, 1.34, 0.07, 0.022, 0.035, 5, 5, 0, { fire: 1 })], 8, { square: true });
  sk.tube('z', [{ p: [0, 1.365, 1.56], w: 0.06, up: 0.012, c: GUM, sk: [5, 5, 0], fire: 1.6 }, { p: [0, 1.365, 1.86], w: 0.05, up: 0.012, c: GUM, sk: [5, 5, 0], fire: 1.6 }], 6);
  for (const sx of [1, -1]) {
    sk.flap([sx * 0.19, 1.62, 1.38], [sx * 0.2, 1.58, 1.56], [sx * 0.33, 1.24, 1.45], BK, [sx > 0 ? 6 : 7, 4, 0]);
    sk.flap([sx * 0.2, 1.58, 1.56], [sx * 0.19, 1.62, 1.38], [sx * 0.35, 1.27, 1.53], BK, [sx > 0 ? 6 : 7, 4, 0]);
    sk.ball([sx * 0.115, 1.55, 1.61], 0.038, EYE, [4, 4, 0], 2.6, 6);
    sk.tube('y', [{ p: [sx * 0.07, 1.33, 1.9], w: 0.006, up: 0.006, c: TOOTH, sk: [4, 4, 0], fire: 1.2 }, { p: [sx * 0.07, 1.39, 1.9], w: 0.016, up: 0.016, c: TOOTH, sk: [4, 4, 0], fire: 1.2 }], 5);
    sk.tube('y', [{ p: [sx * 0.062, 1.365, 1.84], w: 0.013, up: 0.013, c: TOOTH, sk: [5, 5, 0], fire: 1.2 }, { p: [sx * 0.062, 1.42, 1.85], w: 0.005, up: 0.005, c: TOOTH, sk: [5, 5, 0], fire: 1.2 }], 5);
  }
  const tipC = TIP ? { c: TIP } : {};
  sk.tube('z', [R(-1.72, 0.97, 0.025 * br, 0.025 * br, 0.025 * br, 9, 9, 0, tipC), R(-1.5, 1.0, 0.05 * br, 0.05 * br, 0.05 * br, 9, 9, 0, tipC), R(-1.3, 1.05, 0.065 * br, 0.065 * br, 0.065 * br, 9, 8, 0.5), R(-1.1, 1.11, 0.08 * br, 0.08 * br, 0.08 * br, 8, 8, 0),
    R(-0.93, 1.14, 0.1, 0.1, 0.1, 8, 1, 0.5)], 6);
  const toes = [];
  for (const [i, sx] of [[10, 1], [13, -1]]) { const J = [0, 1, 2].map((k) => [sx * q.fx, q.fy[k], q.fz[k]]), toe = [sx * q.fx, 0, q.fz[2] + 0.02];
    legSkin(sk, i, [[J[0][0] * 1.12, J[0][1] + 0.06, J[0][2]], J[1], J[2]], toe, [0.2, 0.12, 0.085, 0.08], BK, PAD, false); toes.push({ bone: i + 2, p: new THREE.Vector3(toe[0], 0, toe[2]) }); }
  for (const [i, sx] of [[16, 1], [19, -1]]) { const J = [0, 1, 2].map((k) => [sx * q.hx, q.hy[k], q.hz[k]]), toe = [sx * q.hx, 0, q.hz[2] + 0.05];
    legSkin(sk, i, [[J[0][0] * 1.1, J[0][1] + 0.06, J[0][2]], J[1], J[2]], toe, [0.27, 0.15, 0.085, 0.078], BK, PAD, false); toes.push({ bone: i + 2, p: new THREE.Vector3(toe[0], 0, toe[2]) }); }
  return { rig, geometry: sk.build(), toes, q };
}

// The gallop of a four-legged beast from a phase (one stride = 1): two flights a stride, the back flexing and stretching, fore legs
// reaching as the hind legs drive, each leg folding as it comes forward. amp 1 = flat out, 0.5 = a canter. Sets the bones; the caller solves.
const _toe = new THREE.Vector3();
function poseGallop(beast, ph, o = {}) {
  const { rig, toes } = beast, X = rig.index, r = rig.rot, amp = o.amp ?? 1, TAU = Math.PI * 2, c1 = Math.cos(TAU * ph), s1 = Math.sin(TAU * ph);
  rig.reset();
  r[X.root].x = 0.07 * s1 * amp + (o.pitch ?? 0); rig.shift[X.root].y = (0.07 * Math.cos(2 * TAU * ph) + 0.06 * c1 - 0.08) * amp + (o.lift ?? 0);
  r[X.pelvis].x = (-0.14 - 0.24 * (0.5 - 0.5 * c1)) * amp + 0.06; r[X.chest].x = (0.12 * (0.5 - 0.5 * c1) - 0.07 * (0.5 + 0.5 * c1)) * amp;
  r[X.neck].x = (0.2 - 0.1 * c1) * amp + (o.neck ?? 0); r[X.head].x = -r[X.neck].x * 0.55 - r[X.chest].x - r[X.root].x * 0.8 + (o.head ?? 0.1); r[X.head].y = o.headTurn ?? 0;
  r[X.jaw].x = o.jaw ?? 0;
  const ear = (o.ear ?? 1) * (0.35 + 0.25 * Math.sin(2 * TAU * ph + 1.2)) * amp;
  r[X.earL].z = ear; r[X.earR].z = -ear; r[X.earL].x = r[X.earR].x = 0.5 * amp * (o.ear ?? 1);
  r[X.tail1].x = (o.tail ?? 0.1) + 0.14 * s1 * amp; r[X.tail2].x = 0.16 * Math.sin(TAU * ph - 1.0) * amp + (o.tail2 ?? 0); r[X.tail1].y = 0.1 * Math.sin(TAU * ph * 0.5);
  const A = (o.reach ?? 0.82) * amp;
  for (const [n, lag] of [['L', 0], ['R', 0.085]]) {
    const pf = TAU * (ph - lag), cf = Math.cos(pf), foldF = Math.max(0, -Math.sin(pf)), i = X['f' + n + '1'];
    r[i].x = -A * cf * 0.95 - 0.05 - r[X.chest].x; r[i + 1].x = -1.25 * foldF * amp - 0.12 * Math.max(0, cf); r[i + 2].x = 1.5 * foldF * amp + 0.25 * Math.max(0, -cf);
    const phh = TAU * (ph - lag * 0.8 - 0.04), chh = Math.cos(phh), foldH = Math.max(0, Math.sin(phh)), j = X['h' + n + '1'];
    r[j].x = A * chh * 0.9 - 0.12 - r[X.pelvis].x; r[j + 1].x = (1.0 * foldH + 0.25 * Math.max(0, -chh)) * amp; r[j + 2].x = (-1.2 * foldH - 0.3 * Math.max(0, chh)) * amp;
  }
  rig.solve();
  if (o.ground !== false) {
    let low = Infinity;
    for (const t of toes) { _toe.copy(t.p).sub(rig.rest[t.bone]).applyMatrix4(rig.world[t.bone]); low = Math.min(low, _toe.y); }
    if (low < 0.02) { rig.shift[X.root].y += 0.02 - low; rig.solve(); }
  }
}

// The flames: cards that stand on the beast (each rooted to a bone), turned to the eye about their own axis, streaming back with the run.
const FLAME_FRAG = /* glsl */`
  uniform vec3 uFire; uniform float uTime; uniform float uK;
  varying vec2 vUv; varying float vSeed;
  void main() {
    float y = vUv.y, x = vUv.x * 2.0 - 1.0, t = uTime * (1.0 + 0.3 * vSeed) + vSeed * 31.0;
    float wob = (sin(y * 6.5 - t * 9.0) * 0.26 + sin(y * 13.0 - t * 15.0 + 1.7) * 0.13) * y;
    float lick = 0.72 + 0.28 * sin(t * 6.1 + vSeed * 9.0) * sin(t * 3.7);
    float wid = mix(0.82, 0.1, clamp(y / lick, 0.0, 1.0));
    float a = clamp(1.0 - abs(x - wob) / wid, 0.0, 1.0); a = a * a * (3.0 - 2.0 * a);
    a *= smoothstep(0.0, 0.1, y) * (1.0 - smoothstep(0.45 * lick, lick, y));
    // a blue-white flame: deeper blue at the root, near white at the tips; the heart of each tongue a little paler than its edge
    vec3 root = uFire * vec3(0.5, 0.9, 1.0), tip = mix(uFire, vec3(1.0), 0.75);
    vec3 col = mix(root, tip, smoothstep(0.05, 0.75, y / lick));
    col = mix(col, tip, 0.35 * clamp(a * 1.3 - 0.6, 0.0, 1.0));
    gl_FragColor = vec4(col * uK, a);
  }`;
function makeFlames(beast, cards, o = {}) {
  const n = cards.length, pos = new Float32Array(n * 12), uv = new Float32Array(n * 8), seed = new Float32Array(n * 4), idx = [];
  cards.forEach((c, i) => { uv.set([0, 0, 1, 0, 1, 1, 0, 1], i * 8); seed.fill(c.seed, i * 4, i * 4 + 4); idx.push(i * 4, i * 4 + 1, i * 4 + 2, i * 4, i * 4 + 2, i * 4 + 3);
    c.P = new THREE.Vector3(c.p[0], c.p[1], c.p[2]); c.D = new THREE.Vector3(c.dir[0], c.dir[1], c.dir[2]).normalize(); });
  const g = new THREE.BufferGeometry(), pa = new THREE.BufferAttribute(pos, 3); pa.setUsage(THREE.DynamicDrawUsage);
  g.setAttribute('position', pa); g.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); g.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1)); g.setIndex(idx);
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 1, 0.3), 5);
  const u = { uFire: { value: new THREE.Color(o.fire ?? FIRE) }, uTime: { value: 0 }, uK: { value: o.k ?? 1.5 } };
  const mat = new THREE.ShaderMaterial({ uniforms: u, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    vertexShader: 'attribute float aSeed; varying vec2 vUv; varying float vSeed;\nvoid main() { vUv = uv; vSeed = aSeed; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }', fragmentShader: FLAME_FRAG });
  const mesh = new THREE.Mesh(g, mat); mesh.renderOrder = 6; mesh.frustumCulled = false;
  const b = new THREE.Vector3(), d = new THREE.Vector3(), side = new THREE.Vector3(), eye = new THREE.Vector3(), m4 = new THREE.Matrix4(), back = new THREE.Vector3();
  // eyeLocal: the eye in the beast's own space; stream: how hard the flames lie back (0 standing, 1 flat out)
  const update = (time, eyeLocal, stream = 1) => {
    u.uTime.value = time;
    for (let i = 0; i < n; i++) {
      const c = cards[i]; m4.fromArray(beast.rig.data, c.bone * 16);
      b.copy(c.P).applyMatrix4(m4); d.copy(c.D).transformDirection(m4);
      back.set(0, 0.25, -1).multiplyScalar(stream * (c.stream ?? 0.6)); d.add(back).normalize();
      eye.copy(eyeLocal).sub(b); side.crossVectors(d, eye);
      const sl = side.length(); if (sl < 1e-5) side.set(1, 0, 0); else side.multiplyScalar(1 / sl);
      const w = c.wid * 0.5, len = c.len * (1 + 0.25 * stream * (c.stream ?? 0.6)), k = i * 12;
      pos[k] = b.x - side.x * w; pos[k + 1] = b.y - side.y * w; pos[k + 2] = b.z - side.z * w;
      pos[k + 3] = b.x + side.x * w; pos[k + 4] = b.y + side.y * w; pos[k + 5] = b.z + side.z * w;
      pos[k + 6] = b.x + d.x * len + side.x * w; pos[k + 7] = b.y + d.y * len + side.y * w; pos[k + 8] = b.z + d.z * len + side.z * w;
      pos[k + 9] = b.x + d.x * len - side.x * w; pos[k + 10] = b.y + d.y * len - side.y * w; pos[k + 11] = b.z + d.z * len - side.z * w;
    }
    pa.needsUpdate = true;
  };
  return { mesh, u, update, dispose() { g.dispose(); mat.dispose(); } };
}

// A soft round glow lying flat (the fire's light on the ground) or facing the eye (a halo): one small texture made here, no file.
function glowTexture() {
  const N = 64, data = new Uint8Array(N * N * 4);
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) { const d = Math.hypot(i - 31.5, j - 31.5) / 31.5, a = Math.max(0, 1 - d), v = Math.round(255 * a * a * (3 - 2 * a) * a), k = (j * N + i) * 4;
    data[k] = data[k + 1] = data[k + 2] = v; data[k + 3] = 255; }
  const t = new THREE.DataTexture(data, N, N, THREE.RGBAFormat); t.magFilter = t.minFilter = THREE.LinearFilter; t.needsUpdate = true; return t;
}

// The hound. o: { fire (colour), fireK (1), ghost (true: no black body, the beast drawn in light only: its fire, flames and glow, and
//   the dim edge), moon (the moon's colour, or nothing: the DIM EDGE of the coat and the pale line along the back, the ponies' own
//   numbers and no brighter; without a moon the coat has no edge at all), light (false: no lamp), rng (the stream that lays its flame cards),
//   coatK (how much of its colour the coat keeps: 1 where none is handed) }
// WHERE THE FIRE IS (round 9: AT THE JAWS AND THE NECK): at the mouth and the eyes, as a flickering outline on the muzzle, the
// hackles and the dewlap, and in short tongues along the neck from the withers to the skull. The back behind the withers, the
// flanks, the legs and the tail carry none.
// Returns { object, set(run, time, o), light (a PointLight inside object, or null), length, dispose }.
// set: run = metres run (the gallop's phase), stride = metres a stride, eye = the camera (for the flame cards),
// fire 0..1 (all of its fire: edges, flames, glow and pool come up and go out with it), inFog 0..1, wet 0..1 (splashes), pool, groundDrop.
export function makeHound(ctx, o = {}) {
  // (round 11: THE RARE SECOND HOUND HAS NO MOON'S EDGE: its body adds only light, so an edge over the whole coat drew the whole
  // beast as a pale outline; now only its jaws and neck burn. The first hound, a solid black beast, keeps its dim edge.)
  const FK = o.ghost ? 1.2 : 1.5, FLAME_K = o.ghost ? 2.0 : 1.1, beast = houndBeast({ coatK: o.coatK }), SHEEN = o.moon && !o.ghost ? 0.3 : 0, BACK = o.moon && !o.ghost ? 0.09 : 0;
  const sm = skinMaterial(beast.rig, { fire: o.fire, fireK: FK, roughness: 0.4, sheen: SHEEN, back: BACK, edge: o.moon ?? '#000000', fireMax: o.fireMax });
  const object = new THREE.Group(), body = new THREE.Group(), S = HOUND_LENGTH / HOUND_BUILT; body.scale.setScalar(S); object.add(body);
  const mesh = new THREE.Mesh(beast.geometry, sm.mat); mesh.customDepthMaterial = sm.depth; mesh.castShadow = !o.ghost; mesh.frustumCulled = false; body.add(mesh);
  // (the ghost's body adds only its light: its coat is black, so what shows is its fire where the fire is, and nothing else: no edge)
  if (o.ghost) { sm.mat.transparent = true; sm.mat.blending = THREE.AdditiveBlending; sm.mat.depthWrite = false; sm.mat.color.setScalar(0.0); }
  const cards = [], rng = o.rng, C = (bone, p, dir, len, wid, stream) => cards.push({ bone, p, dir, len, wid, stream, seed: rng() });
  // (seven short tongues along the hackles, the withers to the skull, each on the bone under it; then the dewlap's, the muzzle's,
  // the mouth's and the eyes')
  for (let i = 0; i < 7; i++) { const t = i / 6, z = lerp(0.45, 1.36, t), y = z < 0.82 ? lerp(1.3, 1.38, (z - 0.3) / 0.52) : lerp(1.38, 1.6, (z - 0.82) / 0.54);
    C(z < 0.95 ? 2 : z < 1.25 ? 3 : 4, [rng.range(-0.04, 0.04), y, z], [rng.range(-0.25, 0.25), 1, -0.25], rng.range(0.34, 0.5), rng.range(0.26, 0.36), 0.75); }
  C(3, [0, 1.06, 1.1], [0, -0.35, -0.6], 0.5, 0.3, 0.9); C(3, [0, 1.12, 1.28], [0, -0.4, -0.5], 0.42, 0.26, 0.9); C(2, [0, 0.86, 0.95], [0, -0.2, -0.8], 0.4, 0.26, 0.9);
  C(4, [0, 1.5, 1.8], [0, 0.8, -0.3], 0.34, 0.2, 0.8); C(4, [0.11, 1.42, 1.86], [0.5, 0.3, -0.4], 0.36, 0.18, 1); C(4, [-0.11, 1.42, 1.86], [-0.5, 0.3, -0.4], 0.36, 0.18, 1);
  C(5, [0.07, 1.37, 1.74], [0.55, 0.1, -0.2], 0.95, 0.4, 1.3); C(5, [-0.07, 1.37, 1.74], [-0.55, 0.1, -0.2], 0.95, 0.4, 1.3); C(5, [0, 1.38, 1.82], [0, 0.15, 1], 0.42, 0.3, -0.5);
  C(4, [0.1, 1.54, 1.6], [0.35, 0.5, -0.5], 0.3, 0.1, 1); C(4, [-0.1, 1.54, 1.6], [-0.35, 0.5, -0.5], 0.3, 0.1, 1);
  const flames = makeFlames(beast, cards, { fire: o.fire, k: FLAME_K }); body.add(flames.mesh);
  const tex = glowTexture(), fireCol = new THREE.Color(o.fire ?? FIRE);
  // on the ground under it: the pool of its fire's light (wide and low, before and beside it), the dark under its own body, and the
  // water its feet throw up where the ground is wet (two footfalls a stride, each standing where it fell while the hound runs on)
  const pool = new THREE.Mesh(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: tex, color: fireCol.clone().multiplyScalar(o.ghost ? 0.2 : 0.42), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
  pool.scale.set(9, 1, 11.5); pool.position.set(0, 0.12, 1.5); pool.renderOrder = 3; pool.name = 'hound light pool'; object.add(pool);
  const under = new THREE.Mesh(pool.geometry, new THREE.MeshBasicMaterial({ alphaMap: tex, color: 0x000000, transparent: true, opacity: o.ghost ? 0 : 0.62, depthWrite: false, fog: false }));
  under.scale.set(1.9, 1, 4.4); under.position.set(0, 0.14, 0.1); under.renderOrder = 3.5; under.name = 'hound ground shade'; object.add(under);
  const SPLASH_VERT = /* glsl */`
    attribute vec3 aFoot;
    uniform float uRun; uniform float uStride; uniform float uWet;
    varying vec2 vUv; varying float vAge; varying float vSeed;
    void main() {
      // aFoot: the footfall's phase in the stride, how many strides back, and which way the card stands (0 across, 1 along)
      float j = floor(uRun / uStride - aFoot.x) - aFoot.y, age = uRun / uStride - aFoot.x - j;
      float grow = 0.35 + 0.65 * min(1.0, age * 2.4), wide = 1.5 * grow, high = 1.05 * grow * (1.0 - 0.45 * age);
      vec3 c = vec3(0.0, 0.0, 0.55 - age * uStride / ` + (HOUND_LENGTH / HOUND_BUILT).toFixed(4) + `);
      vec2 q = position.xy;
      vec3 lp = c + mix(vec3(q.x * wide, 0.0, 0.0), vec3(0.0, 0.0, q.x * wide), aFoot.z) + vec3(0.0, (q.y + 0.5) * high, 0.0);
      vUv = q * 2.0; vAge = age; vSeed = j * 3.7 + aFoot.x * 11.0 + aFoot.z * 5.0;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(lp, 1.0);
    }`;
  const SPLASH_FRAG = /* glsl */`
    uniform vec3 uCol; uniform float uWet;
    varying vec2 vUv; varying float vAge; varying float vSeed;
    void main() {
      float up = vUv.y * 0.5 + 0.5, ang = atan(vUv.x, up + 0.08), r = length(vec2(vUv.x, up));
      // a crown of thrown water: spokes that fly outward and thin as the splash ages, drops at their ends
      float spoke = 0.5 + 0.5 * sin(ang * 9.0 + vSeed), fine = 0.5 + 0.5 * sin(ang * 23.0 + vSeed * 1.7);
      float reach = 0.35 + 0.6 * min(1.0, vAge * 2.2);
      float a = smoothstep(reach, reach - 0.3, r + 0.25 * (1.0 - spoke)) * smoothstep(0.02, 0.2, r) * (0.35 + 0.65 * spoke * fine);
      a *= (1.0 - smoothstep(0.25, 0.85, vAge)) * uWet * (1.0 - smoothstep(0.7, 1.0, abs(vUv.x))) * smoothstep(0.0, 0.08, up);
      if (a < 0.01) discard;
      gl_FragColor = vec4(uCol * a, a * 0.5);
    }`;
  const sgeo = new THREE.InstancedBufferGeometry(); sgeo.setAttribute('position', new THREE.Float32BufferAttribute([-0.5, -0.5, 0, 0.5, -0.5, 0, 0.5, 0.5, 0, -0.5, 0.5, 0], 3)); sgeo.setIndex([0, 1, 2, 0, 2, 3]);
  const feet = []; for (const ph of [0.08, 0.56]) for (const back of [0, 1]) for (const way of [0, 1]) feet.push(ph, back, way);
  sgeo.setAttribute('aFoot', new THREE.InstancedBufferAttribute(new Float32Array(feet), 3)); sgeo.instanceCount = feet.length / 3;
  const splashU = { uRun: { value: 0 }, uStride: { value: 7 }, uWet: { value: 0 }, uCol: { value: fireCol.clone().lerp(new THREE.Color('#dfeaf0'), 0.55).multiplyScalar(0.55) } };
  const splash = new THREE.Mesh(sgeo, new THREE.ShaderMaterial({ uniforms: splashU, vertexShader: SPLASH_VERT, fragmentShader: SPLASH_FRAG, transparent: true, depthWrite: false, side: THREE.DoubleSide,
    blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor, blendSrcAlpha: THREE.OneFactor, blendDstAlpha: THREE.OneMinusSrcAlphaFactor }));
  splash.frustumCulled = false; splash.renderOrder = 4.5; splash.name = 'hound splashes'; body.add(splash);
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, color: fireCol.clone().multiplyScalar(0.13), transparent: true, depthWrite: false, depthTest: true, blending: THREE.AdditiveBlending, fog: false }));
  halo.scale.setScalar(1.5); halo.renderOrder = 5; halo.name = 'hound halo'; object.add(halo);
  const haloCol = fireCol.clone().multiplyScalar(0.13), haloFog = fireCol.clone().multiplyScalar(0.3);
  let light = null;
  if (o.light !== false && !o.ghost) { light = new THREE.PointLight(fireCol, 15, 16, 1.5); light.position.set(0, 1.6, 2.6); object.add(light); }
  const eyeL = new THREE.Vector3(), headP = new THREE.Vector3(), m4 = new THREE.Matrix4(), X = beast.rig.index;
  const set = (run, time, q = {}) => {
    const ph = run / (q.stride ?? 7) + (q.phase ?? 0), f = ph - Math.floor(ph);
    poseGallop(beast, f, { jaw: 0.42 + 0.1 * Math.sin(time * 5.3), lift: 0, pitch: 0, ground: true, tail: 0.12, reach: 0.84 });
    sm.u.uTime.value = time;
    m4.fromArray(beast.rig.data, X.head * 16); headP.set(0, 1.45, 1.7).applyMatrix4(m4).multiplyScalar(S);
    const fl = 0.86 + 0.14 * Math.sin(time * 17.0) * Math.sin(time * 7.3 + 1.0);
    // (inFog 0..1: while it runs inside the bank its fire is a wide glow in the fog and no more)
    const inFog = q.inFog ?? 0, drop = q.groundDrop ?? 0, fire = q.fire ?? 1;
    // (the dim edge is the moon's, not the fire's: it does not go with `fire`)
    sm.u.uFireK.value = FK * fire; flames.u.uK.value = FLAME_K * fire;
    halo.position.copy(headP); halo.material.opacity = fl * fire; halo.scale.setScalar(lerp(1.5, 13, inFog)); halo.material.color.lerpColors(haloCol, haloFog, inFog);
    pool.material.opacity = fl * fire * (q.pool ?? 1) * (1 - 0.8 * inFog); pool.position.y = 0.12 - drop; under.position.y = 0.14 - drop; under.material.opacity = o.ghost ? 0 : 0.62 * (q.pool ?? 1) * (1 - inFog);
    splashU.uRun.value = run + (q.phase ?? 0) * (q.stride ?? 7); splashU.uStride.value = q.stride ?? 7; splashU.uWet.value = q.wet ?? 0; splash.position.y = -drop / S;
    if (light) { light.position.set(headP.x, headP.y + 0.5, headP.z + 1.0); light.intensity = (q.lamp ?? 15) * fl; }
    if (q.eye) { object.updateMatrixWorld(true); eyeL.copy(q.eye); body.worldToLocal(eyeL); } else eyeL.set(0, 2, -8);
    flames.update(time, eyeL, q.stream ?? 1);
  };
  set(0, 0);
  return { object, set, light, length: HOUND_LENGTH, pool, halo, flames, skin: sm, dispose() { beast.geometry.dispose(); sm.mat.dispose(); sm.depth.dispose(); flames.dispose(); tex.dispose(); pool.geometry.dispose(); pool.material.dispose(); under.material.dispose(); sgeo.dispose(); splash.material.dispose(); halo.material.dispose(); } };
}

// A fox: the same beast small and russet, with a brush and a white tip to it, no fire. set(run, time, amp): a trot from the metres it has run.
export function makeFox(ctx, o = {}) {
  const beast = houndBeast({ coat: [0.42, 0.17, 0.06], pad: [0.04, 0.03, 0.03], gum: [0.05, 0.03, 0.03], eye: [0.9, 0.8, 0.4], tooth: [0.9, 0.95, 0.9], brush: 2.6, tip: [0.75, 0.75, 0.72] }), sm = skinMaterial(beast.rig, { fireK: 0, roughness: 0.85 });
  const object = new THREE.Group(), mesh = new THREE.Mesh(beast.geometry, sm.mat); mesh.customDepthMaterial = sm.depth; mesh.castShadow = true; mesh.frustumCulled = false;
  mesh.scale.setScalar((o.length ?? 1.15) / HOUND_BUILT); object.add(mesh);
  const set = (run, time, amp = 0.5) => poseGallop(beast, run / 1.1, { amp, reach: 0.6, jaw: 0.04, ear: 0.1, tail: -0.25 + 0.1 * Math.sin(time * 1.3), tail2: -0.2, neck: -0.2 * (1 - amp), head: 0.1, headTurn: (o.look ?? 0.8) * (1 - amp) });
  set(0, 0, 0);
  return { object, set, dispose() { beast.geometry.dispose(); sm.mat.dispose(); sm.depth.dispose(); } };
}

// ------------------------------------------------------------------------------------------------ the sea of fog
// ONE BODY OF NESTED VEILS. The fog is a low bank with a face, a level top of slow swells and a foot that creeps. NOTHING OF
// IT IS SHOWN, HIDDEN OR FADED BY WHERE THE EYE IS (not by the eye's height, not by its nearness, not by the angle it is seen at).
// It keeps out of the lens's way as any thing does: by standing where the line does not go (the world's rule of its shore on the
// plan); its low foot is never thicker at a place than the cap the world hands for that place, which the world takes from the
// land alone (the foot's own level over the mire against the ground there).
// It lives in its own co-ordinates: e = metres along an axis from an origin, n = metres to the right of the axis, y over a level
// (the mire's). At every place it has
//   a FLOOR (the ground there, over the level),
//   a TOP of its own: `aTop` metres over the level and THE HEAVES over that: great soft domes (fgDome: each dome a paraboloid of its
//     own height round its own middle, joined softly where they meet, as the heads of a cloud bank are) one lattice across and
//     `uHeave.y` metres high, with lesser ones on them (a third as wide), all drifting slowly down the axis and breathing in
//     place BY THE WORLD'S CLOCK, a closed form of the time;
//   a FACE (fgMask: how much of that top stands there, 0 to 1): by the place's metres inside the shore on the plan (d) over the
//     fringe's width there, cut by a slow noise of the place (bays and headlands, so that the face stands in folds), RISING
//     EVENLY FROM ITS FOOT AND ROUNDING OVER TO THE TOP (no wall);
//   a FOOT (the skin only): a low mist `uFoot.x` metres thick at the most, lying out from the shore as far as `uFoot.y` metres
//     in tongues (fgTongue: a slow noise that creeps and changes by the world's clock), never thicker at a place than the cap
//     the world hands for it.
// IT IS DRAWN AS VEILS, ONE INSIDE ANOTHER, from one geometry: THE SKIN (the body's outer surface with the foot and the low
// drifts), then INNER VEILS, each the same surface `step` metres farther inside the shore and `drop` metres lower, each thin
// (its own alpha), within `band` metres of the shore; behind them all THE CORE (the same surface farther in and lower still,
// opaque where it is thick, written to the depth). A thing that stands in the fog's edge is seen through as many veils as lie
// before it: a silhouette that fades with its depth; the top's edge is crossed by the outer veils alone and is soft. (SHELLS
// of torn wisps over the top, the same surface higher in streaks laid along the drift, are made only where o.shell is
// handed: the hero's slab asks for them (buildHero, below), and since round 11 the world's bank too, low ones (0.3 and 0.6 m
// over its level top) within 45 m of its shore: wisps that lift from the top and drift by the clock.)
// The veils are drawn from the inside outward (the line never goes inside the shore), each one's cells the farthest first as
// seen from the basin's middle, a place of the plan.
// LIGHT: every veil is lit as a surface under the moon. A face turned to the moon is silver, a face turned from it and every
// fold and hollow is blue-grey, softly across a crease; crests are paler than hollows; the inner veils are a little deeper in
// tone than the skin (the edge of the body is its palest part); a fine grain drifts over it. FAR OFF IT GROWS PALER: the
// scene's air takes it by its distance toward a tone between the air's own and the fog's silver (`pale`: the silver's share
// of that tone). EVERY VEIL IS DRAWN BEFORE THE LIGHTS' GLOWS AND THE MISTS OF THE KIT (their draw order is 2; the veils' 1.2
// to 1.4, the shells' 1.6 and 1.7): a lantern that stands before the fog is not dimmed by a veil behind it. The hound's fire,
// the mine's ring and up to four more fires of the place light what is near them, each by its own place and colour, on
// every veil: a fire inside the edge glows through what lies before it.
const FOG_NOISE = /* glsl */`
  float fgH(vec3 p) { p = fract(p * vec3(0.1031, 0.1030, 0.0973)); p += dot(p, p.yxz + 33.33); return fract((p.x + p.y) * p.z); }
  float fgN(vec3 p) { vec3 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
    return mix(mix(mix(fgH(i), fgH(i + vec3(1, 0, 0)), f.x), mix(fgH(i + vec3(0, 1, 0)), fgH(i + vec3(1, 1, 0)), f.x), f.y),
               mix(mix(fgH(i + vec3(0, 0, 1)), fgH(i + vec3(1, 0, 1)), f.x), mix(fgH(i + vec3(0, 1, 1)), fgH(i + vec3(1, 1, 1)), f.x), f.y), f.z); }
  vec3 fgH3(vec2 p) { vec3 q = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973)); q += dot(q, q.yxz + 33.33); return fract((q.xxy + q.yzz) * q.zyx); }
  // uHeave: 1 / the great domes' lattice (m), their height (m), 1 / the lesser domes' lattice, their height. uDrift: the drift's
  // direction on the plan (x, z) and its speed (m/s); w: the fringe's noise, 1 / its lattice (m).
  uniform float uTime; uniform vec4 uHeave; uniform vec4 uDrift; uniform float uWhole;
  // A FIELD OF DOMES at lattice place p: x = the height (some 0.2 to 1.1), yz = its slope along the lattice's two axes. Each cell has
  // one dome: its middle a little off the cell's, its height 0.45 to 1 by the cell's own hash, breathing slowly by the clock.
  vec3 fgDome(vec2 p, float ph) {
    vec2 i = floor(p), f = fract(p); vec3 acc = vec3(0.0);
    for (int cy = -1; cy <= 1; cy++) for (int cx = -1; cx <= 1; cx++) {
      vec2 g = vec2(float(cx), float(cy)); vec3 r = fgH3(i + g + ph * 19.0);
      vec2 c = g + 0.5 + 0.7 * (r.xy - 0.5) + 0.08 * sin(uTime * 0.06 + r.z * 40.0 + vec2(0.0, 1.7));
      vec2 d = c - f; float h = 0.45 + 0.55 * r.z + 0.05 * sin(uTime * 0.045 + r.x * 50.0) - 1.15 * dot(d, d);
      // (the domes are joined softly: where two meet the crease between them is rounded, as fog's is, not cut)
      float wt = exp(6.0 * h); acc += wt * vec3(1.0, 2.3 * d);
    }
    return vec3(log(acc.x) / 6.0, acc.yz / acc.x);
  }
  vec2 fgAt(vec2 xz) { return xz + uDrift.xy * (uTime * uDrift.z); }
  // THE FRINGE'S NOISE at a place: 0 to 1, slow shapes two sizes deep, creeping a third as fast as the heaves drift
  float fgFringe(vec2 xz) { vec2 q = (xz + uDrift.xy * (uTime * uDrift.z * 0.35)) * uDrift.w;
    return clamp(0.5 + 1.3 * (fgN(vec3(q.x, uTime * 0.011, q.y)) - 0.5) + 0.6 * (fgN(vec3(q.x * 2.7 + 9.1, 4.3, q.y * 2.7 - 3.7)) - 0.5), 0.0, 1.0); }
  // THE FACE: how much of its top the fog has at a place whose depth in the fringe is k (1 at k = 1 whatever the noise says; 0 at
  // k = 0): rising evenly from its foot and rounding over to the top
  float fgMask(float k, vec2 xz) { float t = clamp(k * 1.5 - 0.5 * (1.0 - fgFringe(xz)), 0.0, 1.0); return t * t * (3.0 - 2.0 * t); }
  // THE FOOT'S TONGUES: kf is 0 at the tongues' farthest reach and 1 at the shore; a slow noise of the place, half as wide as the
  // fringe's, that creeps with the drift and changes shape by the clock: the tongues roll out and draw back
  float fgTongue(float kf, vec2 xz) { vec2 q = (xz + uDrift.xy * (uTime * uDrift.z * 0.6)) * uDrift.w * 1.9;
    float n = 0.65 * fgN(vec3(q.x, uTime * 0.021, q.y)) + 0.35 * fgN(vec3(q.x * 2.3 + 5.0, uTime * 0.034 + 2.0, q.y * 2.3));
    return smoothstep(0.0, 0.5, kf * 1.6 - 1.15 * (1.0 - n)); }
  // (how thick or thin it is by its thickness, frayed where it is thin by the fine grain nf: nothing under 0.1 m, whole from
  // w metres)
  float fgAlpha(float thick, float nf, float w) { return smoothstep(0.1, w, thick * mix(0.55 + 0.9 * nf, 1.0, smoothstep(0.6 * w, 1.2 * w, thick))); }`;
// aFog: the k left by the outer rim and by what stands in the fog (1 where neither is near; a drift's own k), the ground over the
//   level (m), the top over the level before the heaves (m), the heaves' share (1 in the sea).
// aDen: the density (1 in the sea; a drift's is less).
// aEdge: d (metres inside the shore on the plan; under nought outside it), the fringe's width there (m), the foot's cap (its
//   greatest thickness there, m), the veils' share (1 near the shore, 0 where the inner veils' band ends).
// aGrad: the slope of d along the grid's two axes (metres a metre).
// uLayer: this veil's metres farther inside the shore, its metres lower, its alpha, its number (0 the skin).
const FOG_VERT = /* glsl */`
  attribute vec4 aFog; attribute float aDen; attribute vec4 aEdge; attribute vec2 aGrad;
  uniform vec2 uOrigin; uniform vec2 uAxis; uniform float uY0; uniform float uStep; uniform vec2 uShell; uniform vec4 uLayer; uniform vec3 uFoot;
  varying vec3 vWorld; varying vec4 vFog; varying vec3 vMask; varying float vAir; varying vec3 vFoot;
  ` + FOG_NOISE + `
  float fgK(float d) { return min(aFog.x, smoothstep(0.0, aEdge.y, d - uLayer.x)); }
  void main() {
    vec2 across = vec2(-uAxis.y, uAxis.x), xz = uOrigin + uAxis * position.x + across * position.z, q = fgAt(xz);
    vec3 d1 = fgDome(q * uHeave.x, 1.0), d2 = fgDome(q * uHeave.z + 17.0, 2.0);
    float top = aFog.z + aFog.w * (uHeave.y * d1.x + uHeave.w * d2.x) - uLayer.y;
    // (the face and its slope along the world's x and z, measured over uStep metres: by the shore's own slope there and by the noise)
    vec2 gw = uAxis * aGrad.x + across * aGrad.y;
    float m = fgMask(fgK(aEdge.x), xz), mx = fgMask(fgK(aEdge.x + gw.x * uStep), xz + vec2(uStep, 0.0)), mz = fgMask(fgK(aEdge.x + gw.y * uStep), xz + vec2(0.0, uStep));
    float flr = max(aFog.y, -0.4), rise = max(top - flr, 0.0), body = rise * m, foot = 0.0;
    #ifdef FOG_SKIN
      // (THE FOOT: the low mist in tongues, out to uFoot.y metres beyond the shore, never over the cap of the place)
      foot = min(uFoot.x * fgTongue(clamp(1.0 + aEdge.x / uFoot.y, 0.0, 1.0), xz), aEdge.z);
    #endif
    vec3 wp = vec3(xz.x, uY0 + flr + max(body, foot), xz.y);
    // (a SHELL stands over the surface by its own height, more and less by a slow noise of the place, and not at all where no fog is)
    #ifdef FOG_SHELL
      wp.y += uShell.x * m * (0.5 + fgN(vec3(q.x * uHeave.z * 0.9 + uShell.x * 3.1, 7.7, q.y * uHeave.z * 0.9)));
    #endif
    vWorld = wp;
    // vFog: the thickness (m: the surface over its floor), the top over the floor (m), the heaves' share, the density
    vFog = vec4(max(body, foot), rise, aFog.w, aDen);
    vFoot = vec3(foot, body, aEdge.w);
    vMask = vec3(m, (mx - m) / uStep, (mz - m) / uStep);
    vec4 mv = viewMatrix * vec4(wp, 1.0);
    // (how much air lies before it: the measure three's own fog takes of every lit thing)
    vAir = -mv.z;
    gl_Position = projectionMatrix * mv;
  }`;
const FOG_FRAG = /* glsl */`
  uniform vec3 uLit; uniform vec3 uShade; uniform vec3 uFire; uniform vec3 uFirePos; uniform float uFireK;
  uniform vec3 uMinePos; uniform vec4 uMineCol; uniform vec3 uMoon; uniform vec2 uShell; uniform vec4 uLayer; uniform vec3 uFoot;
  uniform vec4 uLampPos[4]; uniform vec3 uLampCol[4]; uniform float uPale; uniform float uModel;
  uniform vec3 fogColor; uniform float fogDensity;
  varying vec3 vWorld; varying vec4 vFog; varying vec3 vMask; varying float vAir; varying vec3 vFoot;
  ` + FOG_NOISE + `
  void main() {
    vec2 q = fgAt(vWorld.xz);
    float thick = vFog.x, isFoot = 0.0;
    // (a fine drifting grain: it frays the thin of the fog and mottles its light)
    float nf = fgN(vec3(q.x * uHeave.z * 3.3, uTime * 0.05, q.y * uHeave.z * 3.3));
    float a = 0.0;
    #ifdef FOG_CORE
      a = fgAlpha(thick, nf, uWhole) * vFog.w;
      if (a < 0.97) discard;
    #else
      #ifdef FOG_SHELL
        // (a shell is TORN WISPS over the body: streaks laid along the drift, more and less of them by a slow noise; none over the thin of it)
        vec2 along = vec2(dot(q, uDrift.xy), dot(q, vec2(-uDrift.y, uDrift.x)));
        float nw = fgN(vec3(along.x * uHeave.z * 0.5 + uShell.x * 2.0, uTime * 0.03 + uShell.x, along.y * uHeave.z * 1.9));
        float nb = fgN(vec3(q.x * uHeave.z * 0.6 + 3.0, uTime * 0.02, q.y * uHeave.z * 0.6 - uShell.x));
        a = uShell.y * smoothstep(0.5, 1.0, fgAlpha(vFoot.y, nf, uWhole)) * smoothstep(0.38, 0.72, nw * (0.55 + 0.9 * nb)) * (0.7 + 0.6 * nf);
      #else
        // (a veil: thin all over, thinner where the body is thin under it; an inner veil ends with its band; the skin has the
        // foot's low mist, and the low drifts by their own density)
        a = uLayer.z * fgAlpha(vFoot.y, nf, uWhole) * mix(1.0, vFoot.z, step(0.5, uLayer.w));
        #ifdef FOG_SKIN
          float aFoot = uFoot.z * smoothstep(0.04, 0.8, vFoot.x) * (0.55 + 0.9 * nf);
          if (vFog.w < 0.99) a = fgAlpha(thick, nf, 3.4) * vFog.w;
          else if (aFoot > a) { a = aFoot; isFoot = 1.0; }
        #endif
      #endif
      if (a < 0.004) discard;
      a = min(a, 0.92);
    #endif
    // THE SURFACE'S SLOPE at this place: the heaves' own (the two sizes the surface is raised by, and a third, finer, that is in the
    // light only), by how much of the top stands here, and the face's own slope by the height it cuts
    vec3 d1 = fgDome(q * uHeave.x, 1.0), d2 = fgDome(q * uHeave.z + 17.0, 2.0), d3 = fgDome(q * uHeave.z * 2.9 + 5.0, 3.0);
    vec2 gH = vFog.z * (uHeave.y * uHeave.x * d1.yz + uHeave.w * uHeave.z * d2.yz + 0.12 * uHeave.w * uHeave.z * 2.9 * d3.yz);
    vec2 g = (vMask.x * gH + vFog.y * vMask.yz) * (1.0 - isFoot);
    vec3 nrm = normalize(vec3(-g.x, 1.0, -g.y));
    // LIT AS A SURFACE UNDER THE MOON: A LEVEL TOP IS WHITE (the moon lies on it as on a field of ice: four fifths and more of the
    // fog's light), a face turned to the moon whiter still, a face turned from it and every fold blue-grey; a swell's crest
    // is a little paler than its hollow; the thin of it is dimmer; the foot's mist is a flat pale silver
    float nl = dot(nrm, uMoon), crest = clamp(0.7 * d1.x + 0.3 * d2.x, 0.0, 1.0);
    float lit = smoothstep(0.0, 1.0, 0.8 + 0.75 * (nl - uMoon.y)) * (0.86 + 0.14 * smoothstep(0.3, 0.95, crest));
    lit *= mix(0.82, 1.0, smoothstep(0.3, 3.0, thick));
    lit = mix(lit, 0.95, isFoot);
    // ROUND 11: MODELLED BY THE MOON, AND NEVER ONE TONE (where uModel is handed: the world's bank). The slope is told uModel
    // times over IN THE LIGHT ALONE, so that a billow's side toward the moon is lit and its side from the moon and every
    // hollow between two billows is blue-grey; a crest is paler than a hollow by more; and the body has a slow mottle of
    // its own (shapes 40 m and 13 m across that drift with the heaves and change by the clock). The foot's mist is not a
    // white sheet: its tone is the mottle's, four fifths of the body's white at the most.
    if (uModel > 0.0) {
      float mot = 0.6 * fgN(vec3(q.x * 0.025, uTime * 0.008, q.y * 0.025)) + 0.4 * fgN(vec3(q.x * 0.075 + 5.0, uTime * 0.013 + 3.0, q.y * 0.075));
      vec3 nrmL = normalize(vec3(-g.x * uModel, 1.0, -g.y * uModel));
      float nlL = dot(nrmL, uMoon);
      lit = smoothstep(0.0, 1.0, 0.6 + 1.05 * (nlL - uMoon.y)) * (0.68 + 0.32 * smoothstep(0.25, 0.9, crest));
      lit *= mix(0.8, 1.0, smoothstep(0.3, 3.0, thick)) * (0.72 + 0.56 * mot);
      lit = mix(lit, 0.42 + 0.4 * mot, isFoot);
    }
    #ifdef FOG_SHELL
      lit = min(1.0, lit + 0.16);
    #endif
    // (an inner veil is a little deeper in tone than the one outside it)
    vec3 col = mix(uShade, uLit, clamp(lit, 0.0, 1.0) * (1.0 - 0.07 * uLayer.w)) * (0.94 + 0.12 * nf);
    vec3 df = vWorld - uFirePos;
    col += uFire * (uFireK / (1.0 + dot(df, df) * 0.007));
    // THE MINE'S RED ON THE FOG: the light of the ring's fire in the mine's mouth lies on the fog that faces the yard, strongest nearest it
    vec3 dm = vWorld - uMinePos;
    col += uMineCol.rgb / (1.0 + dot(dm, dm) * uMineCol.a);
    // (and the place's other fires, each by its own place, colour and reach: xyz and the falloff with the distance squared)
    for (int i = 0; i < 4; i++) { vec3 dl = vWorld - uLampPos[i].xyz; col += uLampCol[i] / (1.0 + dot(dl, dl) * uLampPos[i].w); }
    // THE SCENE'S OWN AIR, by the law three's fog has for every lit thing (the density squared by the distance squared): the
    // fog far off goes toward a tone between the air's own and its own silver: PALER WITH DISTANCE
    col = mix(col, mix(fogColor, uLit, uPale), 1.0 - exp(-fogDensity * fogDensity * vAir * vAir));
    #ifdef FOG_CORE
      gl_FragColor = vec4(col, 1.0);
    #else
      gl_FragColor = vec4(col * a, a);
    #endif
  }`;

// THE MAKER (the world's sea and the hero's slab are both made here, by the same lines).
// o: { origin: [x, z], axis: [x, z] (unit), y0 (the level), depth(e, n) (metres inside the fog's shore on the plan; negative: clear air),
//   ground(e, n) (the ground over the level), rim(e, n) (metres inside the fog's outer bound), span: [e0, e1, half] (the grid),
//   fine: [e0, e1, half] (where its cells are `cell` metres; beyond, each line stands 1.3 times farther than the last, to `cellMax`),
//   top (the top over the level before the heaves, at the fringe's inner side), lift: [m, d0, d1] (how much higher it stands d1
//   metres inside the shore, rising from d0: the body mounts inland as a cloud bank does),
//   cover (far inside, where the ground rises, the fog lies on it this deep before its heaves: 0 for none),
//   heave: [the great domes' lattice m, their height m, the lesser ones' lattice, their height], far: [d0, d1, k] (the heaves stand
//   1 + k times as high from d1 metres off `mid`), mid: [e, n] (a place of the plan, the basin's middle: the far heaves are measured
//   from it and every veil's cells are drawn in order of their distance from it, the farthest first),
//   fringe: [w, dw] (its width, w - dw to w + dw by the place), rimW (the outer rim's width), mask (1 / the fringe noise's lattice),
//   islands: [[e, n, radius, floor (the k left at its foot)], ...] (the fog laps and thins round each),
//   drifts: [[e, n, half length, half width, yaw, top m, density, heave share], ...] (low lying mounds of the same fog),
//   veils: { n (inner veils), step (metres farther inside the shore, each), drop (metres lower, each), alpha (every veil's), band
//     (the inner veils reach this far inside the shore) }, coreIn, coreDrop (the core's metres inside the last veil and lower than it),
//   foot: { thick (m), reach (m beyond the shore), alpha, cap(e, n) (the greatest thickness the foot may have at a place) },
//   shell: { band (metres inside the shore on the plan that have shells), e1 (and no farther up the axis than this), heights: [m, m], alpha: [a, a] },
//   model (round 11: how many times over the slope is told in the light, with the body's mottle; nothing or 0: the light as it was),
//   whole (the thickness in metres from which a veil has its whole alpha and the core hides what is behind it), moon (unit Vector3
//   to the moon), lit, shade (colours, as the hour names them), litK, pale (the silver's share of its far tone), mine: [x, y, z], mineGlow, mineFall (its falloff with the
//   distance squared), lamps: [[x, y, z, falloff, colour, strength], ...] (up to four more fires of the place), fire }
// Returns { object, uniforms, tris, coreTris, fringeTris (the skin's), veilTris, shellTris, body: { en, top } (every place of the grid
// that has the body, and the highest its surface can stand there over the level: for the counts), foot: { en, top } (every place
// the foot's mist can lie, and the highest it can stand there over the level), drifts, seaDepth, setFire(worldPos, k),
// update(time), dispose }.
export async function makeFogSea(ctx, o = {}) {
  const depth = o.depth, gnd = o.ground || (() => 0), rimOf = o.rim || (() => 1e3), islands = o.islands || [], y0 = o.y0 ?? 0;
  const span = o.span, fine = o.fine || span, cell = o.cell ?? 7, cellMax = o.cellMax ?? 40, top0 = o.top ?? 4.4, cover = o.cover ?? 0;
  const LIFT = Array.isArray(o.lift) ? o.lift : [o.lift ?? 0, 40, 320];
  const HV = o.heave ?? [64, 7, 21, 2.4], FAR = o.far ?? [300, 600, 0], mid = o.mid ?? [0, 0], FR = o.fringe ?? [60, 18], rimW = o.rimW ?? 110;
  const hvMax = HV[1] + HV[3], whole = o.whole ?? 3.4, VE = o.veils || { n: 0, step: 7, drop: 1, alpha: 1, band: 0 }, FT = o.foot || null, SH = o.shell || null;
  const coreIn = VE.n * VE.step + (o.coreIn ?? 0), coreDrop = VE.n * VE.drop + (o.coreDrop ?? 0), reach = FT ? FT.reach : 0;
  const U = { uOrigin: { value: new THREE.Vector2(o.origin[0], o.origin[1]) }, uAxis: { value: new THREE.Vector2(o.axis[0], o.axis[1]) }, uY0: { value: y0 }, uTime: { value: 0 },
    uHeave: { value: new THREE.Vector4(1 / HV[0], HV[1], 1 / HV[2], HV[3]) }, uDrift: { value: new THREE.Vector4(-o.axis[0], -o.axis[1], o.drift ?? 0.35, o.mask ?? 1 / 42) }, uStep: { value: o.step ?? 3 }, uShell: { value: new THREE.Vector2(0, 0) },
    uLayer: { value: new THREE.Vector4(0, 0, VE.alpha, 0) }, uFoot: { value: new THREE.Vector3(FT ? FT.thick : 0, Math.max(1, reach), FT ? FT.alpha : 0) },
    uLit: { value: new THREE.Color(o.lit ?? '#d4def4').multiplyScalar(o.litK ?? 0.42) }, uShade: { value: new THREE.Color(o.shade ?? '#3f5078').lerp(new THREE.Color(0.126, 0.126, 0.126), 0.25) },
    uFire: { value: new THREE.Color(o.fire ?? FIRE) }, uFirePos: { value: new THREE.Vector3(0, -999, 0) }, uFireK: { value: 0 },
    uMoon: { value: (o.moon ?? new THREE.Vector3(0.3, 0.5, 0.3)).clone().normalize() },
    uMinePos: { value: new THREE.Vector3(...(o.mine ?? [0, -9999, 0])) }, uMineCol: { value: (() => { const c = new THREE.Color(o.mineGlow ?? '#000000'); return new THREE.Vector4(c.r, c.g, c.b, o.mineFall ?? 0.0011); })() }, uWhole: { value: whole },
    uLampPos: { value: [0, 1, 2, 3].map((i) => { const q = (o.lamps || [])[i]; return q ? new THREE.Vector4(q[0], q[1], q[2], q[3]) : new THREE.Vector4(0, -9999, 0, 1); }) },
    uLampCol: { value: [0, 1, 2, 3].map((i) => { const q = (o.lamps || [])[i]; return q ? new THREE.Color(q[4]).multiplyScalar(q[5] ?? 1) : new THREE.Color(0, 0, 0); }) },
    uPale: { value: o.pale ?? 0.5 }, uModel: { value: o.model ?? 0 }, fogColor: { value: new THREE.Color(0, 0, 0) }, fogDensity: { value: 0 } };
  const object = new THREE.Group(); object.name = 'the sea of fog';
  // THE GRID'S LINES: `cell` metres apart over the fine span, then each 1.3 times farther than the last (cellMax at the most).
  // (its cells are finer where the plan says the fog is seen from near, the mire's own reach, and coarser on the far ground: a
  // rule of the place, the same from every eye)
  const lines = (a0, a1, f0, f1) => { const L = []; for (let v = f0; v <= f1 + 1e-6; v += cell) L.push(v);
    for (let v = L[L.length - 1], s = cell; v < a1;) { s = Math.min(cellMax, s * 1.3); v = Math.min(a1, v + s); L.push(v); }
    for (let v = L[0], s = cell; v > a0;) { s = Math.min(cellMax, s * 1.3); v = Math.max(a0, v - s); L.unshift(v); }
    return L; };
  const fe1 = Math.min(fine[1], span[1]), fe0 = Math.max(fine[0], span[0]), fh = Math.min(fine[2], span[2]);
  const E = lines(span[0], span[1], fe0, fe0 + Math.floor((fe1 - fe0) / cell) * cell), nH = Math.floor(fh / cell) * cell, N = lines(-span[2], span[2], -nH, nH);
  const nE = E.length, nN = N.length, nV = nE * nN, K = new Float32Array(nV), G = new Float32Array(nV), TP = new Float32Array(nV), HS = new Float32Array(nV);
  // (D: metres inside the shore; WD: the fringe's width there; KO: the k the rim and the islands leave; CAP: the foot's cap; ON: has fog)
  const D = new Float32Array(nV), WD = new Float32Array(nV), KO = new Float32Array(nV), CAP = new Float32Array(nV), ON = new Uint8Array(nV);
  for (let i = 0; i < nE; i++) {
    if (i % 12 === 11) await ctx.yield();
    for (let j = 0; j < nN; j++) {
      const e = E[i], n = N[j], d = depth(e, n), r = rimOf(e, n), ix = i * nN + j, wd = FR[0] + FR[1] * Math.sin(e * 0.021 + n * 0.017 + 1.1);
      D[ix] = d; WD[ix] = wd; TP[ix] = top0; HS[ix] = 1; KO[ix] = 1;
      if (r <= 0 || d <= -reach) continue;
      const g = gnd(e, n); G[ix] = g; ON[ix] = 1;
      if (FT) CAP[ix] = Math.max(0, Math.min(FT.thick, FT.cap ? FT.cap(e, n) : FT.thick)) * smoothstep(0, 0.4 * rimW, r);
      if (d <= 0) continue;
      let ko = smoothstep(0, rimW, r);
      for (const q of islands) { const dq = Math.hypot(e - q[0], n - q[1]); if (dq < q[2] + 22) ko = Math.min(ko, lerp(q[3] ?? 0.12, 1, smoothstep(q[2] * 0.6, q[2] + 22, dq))); }
      const base = top0 + LIFT[0] * smoothstep(LIFT[1], LIFT[2], d);
      KO[ix] = ko; K[ix] = Math.min(smoothstep(0, wd, d), ko); HS[ix] = 1 + FAR[2] * smoothstep(FAR[0], FAR[1], Math.hypot(e - mid[0], n - mid[1]));
      TP[ix] = cover > 0 ? Math.max(base, base + (g + cover - base) * smoothstep(90, 230, d)) : base;
    }
  }
  await ctx.yield();
  // the cells: one that has no fog at any corner, or whose ground stands over the highest its top can be at every corner, is left
  // out; the skin has every cell with the body or the foot; an inner veil those within its band of the shore; the core those
  // where the body, so far in and so much lower, can be whole; a shell those within its band
  const vi = new Int32Array(nV).fill(-1), pos = [], aFog = [], aDen = [], aEdge = [], aGrad = [], bodyEN = [], bodyTop = [], footEN = [], footTop = [];
  const shUp = SH ? 1.5 * SH.heights[SH.heights.length - 1] : 0;
  const vert = (i, j) => { const ix = i * nN + j; if (vi[ix] >= 0) return vi[ix]; const v = pos.length / 3; pos.push(E[i], 0, N[j]); aFog.push(KO[ix], G[ix], TP[ix], HS[ix]); aDen.push(1);
    const i0 = Math.max(0, i - 1), i1 = Math.min(nE - 1, i + 1), j0 = Math.max(0, j - 1), j1 = Math.min(nN - 1, j + 1);
    aEdge.push(D[ix], WD[ix], CAP[ix], VE.band > 0 ? 1 - smoothstep(0.7 * VE.band, VE.band, D[ix]) : 0);
    aGrad.push(clamp((D[i1 * nN + j] - D[i0 * nN + j]) / (E[i1] - E[i0]), -3, 3), clamp((D[i * nN + j1] - D[i * nN + j0]) / (N[j1] - N[j0]), -3, 3));
    if (K[ix] > 0) { bodyEN.push(E[i], N[j]); bodyTop.push(Math.max(G[ix], TP[ix] + 1.1 * hvMax * HS[ix] + shUp)); }
    if (ON[ix] && CAP[ix] > 0) { footEN.push(E[i], N[j]); footTop.push(Math.max(G[ix], -0.4) + CAP[ix]); }
    vi[ix] = v; return v; };
  const core = [], fr = [], ve = [], sh = [];
  for (let i = 0; i < nE - 1; i++) { if (i % 48 === 47) await ctx.yield(); for (let j = 0; j < nN - 1; j++) {
    // (the cell's four corners, asked without a list: most cells of the grid have no fog and are left here)
    const c0 = i * nN + j, c1 = c0 + nN, c2 = c1 + 1, c3 = c0 + 1;
    if (!(ON[c0] || ON[c1] || ON[c2] || ON[c3])) continue;
    const kMax = Math.max(0, K[c0], K[c1], K[c2], K[c3]), capMax = Math.max(CAP[c0], CAP[c1], CAP[c2], CAP[c3]);
    const over = Math.max(TP[c0] + hvMax * HS[c0] - G[c0], TP[c1] + hvMax * HS[c1] - G[c1], TP[c2] + hvMax * HS[c2] - G[c2], TP[c3] + hvMax * HS[c3] - G[c3]);
    const hasBody = kMax > 0 && over > 0.1;
    if (!hasBody && capMax <= 0.02) continue;
    const a = vert(i, j), b = vert(i + 1, j), cc = vert(i + 1, j + 1), dd = vert(i, j + 1);
    const tri = (i + j) & 1 ? [a, dd, cc, a, cc, b] : [a, dd, b, b, dd, cc];
    const far = Math.hypot(0.5 * (E[i] + E[i + 1]) - mid[0], 0.5 * (N[j] + N[j + 1]) - mid[1]), dMax = Math.max(D[c0], D[c1], D[c2], D[c3]), dMin = Math.min(D[c0], D[c1], D[c2], D[c3]);
    fr.push([far, tri]);
    if (!hasBody) continue;
    if (VE.n > 0 && dMax > VE.step && dMin < VE.band) ve.push([far, tri]);
    if (dMax > coreIn && over - coreDrop > whole - 0.1) core.push(...tri);
    if (SH && kMax > 0.3 && over > whole - 0.1 && dMin < SH.band && E[i] < (SH.e1 ?? 1e9)) sh.push([far, tri]);
  } }
  await ctx.yield();
  // THE DRIFTS: each a lying mound, an oval of two rings of ten round a middle (k: 1, 0.7, 0 outward), its top `top` metres over
  // the level before its heaves, its floor the ground at each place (they are the skin's: no veil, no foot)
  const drifts = o.drifts || [];
  for (const q of drifts) {
    const [de, dn, ra, rb, yaw, tp, den, hs] = q, ca = Math.cos(yaw), sa = Math.sin(yaw), v0 = pos.length / 3, SEG = 10;
    const put = (u, v, k) => { const e = de + u * ca - v * sa, n = dn + u * sa + v * ca; pos.push(e, 0, n); aFog.push(k, gnd(e, n), tp, hs); aDen.push(den); aEdge.push(1e3, 1, 0, 0); aGrad.push(0, 0); };
    put(0, 0, 1);
    for (let ring = 1; ring <= 2; ring++) for (let s = 0; s < SEG; s++) { const an = (s + 0.5 * ring) / SEG * 6.2832; put(Math.cos(an) * ra * 0.5 * ring, Math.sin(an) * rb * 0.5 * ring, ring === 1 ? 0.7 : 0); }
    const tri = [];
    for (let s = 0; s < SEG; s++) { const a1 = v0 + 1 + s, a2 = v0 + 1 + (s + 1) % SEG, b1 = v0 + 1 + SEG + s, b2 = v0 + 1 + SEG + (s + 1) % SEG;
      tri.push(v0, a2, a1, a1, a2, b1, a2, b2, b1); }
    fr.push([Math.hypot(de - mid[0], dn - mid[1]), tri]);
  }
  const flat = (list) => { list.sort((p, q) => q[0] - p[0]); const out = []; for (const f of list) for (const v of f[1]) out.push(v); return out; };
  const fringe = flat(fr), veil = flat(ve), shell = flat(sh);
  await ctx.yield();
  const aP = new THREE.Float32BufferAttribute(pos, 3), aF = new THREE.Float32BufferAttribute(aFog, 4), aD = new THREE.Float32BufferAttribute(aDen, 1), aE = new THREE.Float32BufferAttribute(aEdge, 4), aG = new THREE.Float32BufferAttribute(aGrad, 2);
  const sphere = new THREE.Sphere(new THREE.Vector3(o.origin[0] + o.axis[0] * 0.5 * (span[0] + span[1]), y0, o.origin[1] + o.axis[1] * 0.5 * (span[0] + span[1])), Math.hypot(0.5 * (span[1] - span[0]), span[2]) + 60);
  const geoOf = (index) => { const g = new THREE.BufferGeometry(); g.setAttribute('position', aP); g.setAttribute('aFog', aF); g.setAttribute('aDen', aD); g.setAttribute('aEdge', aE); g.setAttribute('aGrad', aG); g.setIndex(index); g.boundingSphere = sphere.clone(); return g; };
  const PRE = { blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor, blendSrcAlpha: THREE.OneFactor, blendDstAlpha: THREE.OneMinusSrcAlphaFactor };
  // (fog: true hands these materials the scene's own fog colour and density, as every lit material has them)
  const made = [], matOf = (defines, extraU, blend) => { const m = new THREE.ShaderMaterial({ uniforms: { ...U, ...extraU }, vertexShader: FOG_VERT, fragmentShader: FOG_FRAG, defines, fog: true, side: THREE.DoubleSide, ...(blend ? { transparent: true, depthWrite: false, ...PRE } : {}) }); made.push(m); return m; };
  const meshOf = (geo, mat, order, name) => { const m = new THREE.Mesh(geo, mat); m.frustumCulled = false; m.renderOrder = order; m.name = name; object.add(m); return m; };
  const coreGeo = geoOf(core), fringeGeo = geoOf(fringe); made.push(coreGeo, fringeGeo);
  // (the core: the body so far inside the last veil and so much lower)
  meshOf(coreGeo, matOf({ FOG_CORE: 1 }, { uLayer: { value: new THREE.Vector4(coreIn, coreDrop, 1, VE.n + 1) } }, false), 0, 'the sea of fog, its core');
  // THE INNER VEILS, the innermost drawn first; then THE SKIN with the foot and the drifts
  if (VE.n > 0 && veil.length) { const veilGeo = geoOf(veil); made.push(veilGeo);
    for (let k = VE.n; k >= 1; k--) meshOf(veilGeo, matOf({ FOG_VEIL: 1 }, { uLayer: { value: new THREE.Vector4(k * VE.step, k * VE.drop, VE.alpha, k) } }, true), 1.2 + (VE.n - k) * 0.02, 'the sea of fog, an inner veil'); }
  meshOf(fringeGeo, matOf({ FOG_SKIN: 1 }, {}, true), 1.4, 'the sea of fog, its skin, its foot and the drifts');
  // THE SHELLS: over the body, within `band` metres of its shore on the plan (where it is seen from near, a rule of the place), the
  // same surface is drawn again one and two shell heights higher, in torn wisps: the fog has no hard top, from any place
  if (SH && shell.length) { const shellGeo = geoOf(shell); made.push(shellGeo);
    SH.heights.forEach((hgt, k) => meshOf(shellGeo, matOf({ FOG_SHELL: 1 }, { uShell: { value: new THREE.Vector2(hgt, SH.alpha[k]) } }, true), 1.6 + 0.1 * k, 'the sea of fog, a shell')); }
  const shellTris = SH ? shell.length / 3 * SH.heights.length : 0, veilTris = veil.length / 3 * VE.n;
  return { object, uniforms: U, coreTris: core.length / 3, fringeTris: fringe.length / 3, veilTris, shellTris, tris: (core.length + fringe.length) / 3 + veilTris + shellTris,
    body: { en: new Float32Array(bodyEN), top: new Float32Array(bodyTop) }, foot: { en: new Float32Array(footEN), top: new Float32Array(footTop) }, drifts, seaDepth: depth,
    setFire(p, k) { U.uFirePos.value.copy(p); U.uFireK.value = k; }, update(time) { U.uTime.value = time; },
    dispose() { for (const x of made) x.dispose(); } };
}

// The hero alone: the hound at full gallop out of a slab of the fog (the slab lies on the one side the viewer's orbit never crosses).
// The slab is the world's own fog by the same maker, at a third of its scale: 58 m deep and 52 m wide, its edge 9 m behind the hound.
export async function buildHero(ctx, opts = {}) {
  const object = new THREE.Group(), hound = makeHound(ctx, { rng: makeRng(hashSeed('moor-hero-flames:' + (ctx.seed ?? 1))) }), dir = [0.88, -0.47];
  hound.object.rotation.y = Math.atan2(dir[0], dir[1]); object.add(hound.object);
  await ctx.yield();
  const bank = await makeFogSea(ctx, { origin: [-dir[0] * 7, -dir[1] * 7], axis: [-dir[0], -dir[1]], y0: 0, depth: (e) => e - 2, rim: (e, n) => Math.min(26 - Math.abs(n), 60 - e), span: [0, 60, 26], cell: 2.4, cellMax: 2.4,
    top: 1.6, heave: [21, 3.4, 7.5, 1.1], fringe: [12, 2], rimW: 7, mask: 1 / 12, step: 1, drift: 0.2, mid: [-20, 0], moon: new THREE.Vector3(-0.6, 0.7, 0.4), shell: { band: 1e9, heights: [0.5, 1.1], alpha: [0.5, 0.3] },
    veils: { n: 3, step: 1.8, drop: 0.25, alpha: 0.45, band: 30 }, foot: { thick: 0.35, reach: 5, alpha: 0.5 }, whole: 1.6 });
  object.add(bank.object);
  await ctx.yield();
  const head = new THREE.Vector3();
  return { object, radius: 3.2, height: 3.4, center: new THREE.Vector3(0, 1.0, 0), anchors: { head: new THREE.Vector3(dir[0] * 1.5, 1.2, dir[1] * 1.5) },
    update(dt, time, camera) { hound.set(time * 11, time, { eye: camera.position, stride: 6.9 }); bank.update(time); head.set(dir[0] * 1.5, 1.2, dir[1] * 1.5); bank.setFire(head, 0.3); },
    dispose() { hound.dispose(); bank.dispose(); } };
}

// ------------------------------------------------------------------------------------------------ the moor ponies
// Small shaggy ponies, about 1.2 m at the withers: barrel body, thick neck with a mane, a long head, a full tail, hooves.
const PONY_Q = { back: 1.1, mid: -0.05, loin: -0.4, neck: [0, 1.18, 0.56], head: [0, 1.6, 0.98], jaw: [0, 1.48, 1.08], ear: [0.07, 1.74, 0.97], tail: [0, 1.16, -0.84], tailDrop: 0.7, tailLen: 0.24,
  fx: 0.16, fy: [0.98, 0.6, 0.27], fz: [0.44, 0.44, 0.44], hx: 0.17, hy: [1.0, 0.66, 0.31], hz: [-0.62, -0.5, -0.67] };
function ponySkin() {
  const q = PONY_Q, sk = makeSkin(), C = [0.2, 0.14, 0.1], D = [0.07, 0.05, 0.045], M = [0.3, 0.25, 0.2], HOOF = [0.05, 0.045, 0.04];
  const R = (z, y, w, up, down, bA, bB, wB, c = C) => ({ p: [0, y, z], w, up, down, c, sk: [bA, bB, wB] });
  sk.tube('z', [R(-0.9, 1.08, 0.12, 0.1, 0.14, 1, 1, 0), R(-0.8, 1.08, 0.27, 0.2, 0.28, 1, 1, 0), R(-0.6, 1.07, 0.31, 0.22, 0.36, 1, 1, 0), R(-0.3, 1.05, 0.33, 0.2, 0.4, 1, 0, 0.5), R(0, 1.05, 0.34, 0.2, 0.42, 0, 0, 0),
    R(0.28, 1.07, 0.32, 0.22, 0.4, 0, 2, 0.5), R(0.5, 1.1, 0.27, 0.24, 0.36, 2, 2, 0), R(0.62, 1.2, 0.17, 0.2, 0.3, 2, 3, 0.5), R(0.74, 1.34, 0.13, 0.17, 0.22, 3, 3, 0), R(0.88, 1.5, 0.11, 0.15, 0.17, 3, 4, 0.5),
    R(0.98, 1.62, 0.105, 0.13, 0.13, 4, 4, 0), R(1.1, 1.6, 0.1, 0.1, 0.13, 4, 4, 0), R(1.24, 1.5, 0.08, 0.075, 0.1, 4, 4, 0), R(1.38, 1.4, 0.065, 0.06, 0.07, 4, 4, 0, M), R(1.45, 1.36, 0.045, 0.04, 0.045, 4, 4, 0, M)], 10);
  // the mane and forelock (a thick shaggy crest), the ears, the tail
  sk.tube('z', [R(0.42, 1.36, 0.05, 0.05, 0.1, 2, 2, 0, D), R(0.56, 1.44, 0.07, 0.07, 0.16, 2, 3, 0.5, D), R(0.72, 1.56, 0.075, 0.08, 0.2, 3, 3, 0, D), R(0.88, 1.7, 0.07, 0.07, 0.18, 3, 4, 0.5, D), R(1.0, 1.77, 0.06, 0.04, 0.12, 4, 4, 0, D), R(1.12, 1.7, 0.045, 0.03, 0.08, 4, 4, 0, D)], 6);
  for (const sx of [1, -1]) sk.flap([sx * 0.05, 1.72, 0.94], [sx * 0.1, 1.72, 0.99], [sx * 0.09, 1.88, 0.95], D, [sx > 0 ? 6 : 7, 4, 0]), sk.flap([sx * 0.1, 1.72, 0.99], [sx * 0.05, 1.72, 0.94], [sx * 0.09, 1.88, 0.95], D, [sx > 0 ? 6 : 7, 4, 0]);
  sk.tube('y', [{ p: [0, 0.42, -1.0], w: 0.05, up: 0.05, c: D, sk: [9, 9, 0] }, { p: [0, 0.62, -1.0], w: 0.1, up: 0.09, c: D, sk: [9, 9, 0] }, { p: [0, 0.9, -0.97], w: 0.1, up: 0.09, c: D, sk: [9, 8, 0.5] }, { p: [0, 1.14, -0.9], w: 0.07, up: 0.07, c: D, sk: [8, 1, 0.5] }], 6);
  const toes = [];
  for (const [i, sx] of [[10, 1], [13, -1]]) { const J = [0, 1, 2].map((k) => [sx * q.fx, q.fy[k], q.fz[k]]), toe = [sx * q.fx, 0, q.fz[2]];
    legSkin(sk, i, J, toe, [0.14, 0.075, 0.05, 0.05], C, HOOF, true); toes.push({ bone: i + 2, p: new THREE.Vector3(toe[0], 0, toe[2]) }); }
  for (const [i, sx] of [[16, 1], [19, -1]]) { const J = [0, 1, 2].map((k) => [sx * q.hx, q.hy[k], q.hz[k]]), toe = [sx * q.hx, 0, q.hz[2]];
    legSkin(sk, i, J, toe, [0.19, 0.09, 0.05, 0.05], C, HOOF, true); toes.push({ bone: i + 2, p: new THREE.Vector3(toe[0], 0, toe[2]) }); }
  return { geometry: sk.build(), toes };
}

// o.moon: the moon's colour, or nothing (no moon in the sky).
// o.ponies: [{ x, z, face: [x, z] (the way it stands), period (seconds), up (the share of its period it keeps its head up), tint, size, look, phase }]
// o.ground(x, z) -> y. The herd GRAZES where it stands, a standing state with a habit on the world's clock: each pony has its neck
// down, its tail switching and its weight shifting, and once in its own period lifts its head, looks about it (its head turned by
// `look`), and goes back to the grass. Nothing of it answers the visitor: a visitor who stands still sees the same herd.
export function makePonies(ctx, o = {}) {
  const object = new THREE.Group(), skin = ponySkin(), list = [], bones = beastBones(PONY_Q);
  for (const d of o.ponies ?? []) {
    // (the moon on the ponies: a pale edge on the coat and a pale line along the back, of the moon's own colour, when the world gives one)
    const rig = makeRig(bones), beast = { rig, toes: skin.toes }, sm = skinMaterial(rig, { roughness: 0.85, fire: o.moon ?? '#000000', sheen: o.moon ? 0.3 : 0, back: o.moon ? 0.09 : 0 });
    sm.mat.color.setRGB(d.tint?.[0] ?? 1, d.tint?.[1] ?? 1, d.tint?.[2] ?? 1);
    const mesh = new THREE.Mesh(skin.geometry, sm.mat); mesh.customDepthMaterial = sm.depth; mesh.castShadow = true; mesh.frustumCulled = false;
    const g = new THREE.Group(); g.add(mesh); g.scale.setScalar(d.size ?? 1); object.add(g);
    g.position.set(d.x, o.ground ? o.ground(d.x, d.z) : 0, d.z); g.rotation.y = Math.atan2(d.face?.[0] ?? 0, d.face?.[1] ?? 1);
    list.push({ d, beast, g, sm });
  }
  // how far a pony's head is up at the world's clock `time` (0 grazing, 1 up): up over a twelfth of its period, down over an eighth
  const headUp = (d, time) => { const per = d.period ?? 17, up = d.up ?? 0.35, c = time / per + (d.phase ?? 0), f = c - Math.floor(c); return smoothstep(0, 0.085, f) * (1 - smoothstep(up, up + 0.125, f)); };
  const update = (time) => {
    for (const p of list) {
      const d = p.d, alert = headUp(d, time), graze = 1 - alert, sway = Math.sin(time * 0.5 + d.x), nod = Math.sin(time * 1.9 + d.z), sw = Math.sin(time * 2.3 + d.x);
      poseGallop(p.beast, d.phase ?? 0, { amp: 0, reach: 0.7, neck: lerp(-0.12, 1.25 + 0.06 * nod, graze), head: lerp(0.05, 0.75, graze), headTurn: (d.look ?? 0.5) * alert * Math.sin(time * 0.43 + d.z),
        ear: 0, tail: 0.12 * sw, tail2: 0.2 * Math.sin(time * 2.3 + d.x - 0.8), pitch: 0.02 * sway * graze });
    }
  };
  // where the herd stands (the mean of its ponies' places, a pony's back over the ground)
  let cx = 0, cz = 0;
  for (const p of list) { cx += p.d.x; cz += p.d.z; }
  const n = Math.max(1, list.length), centre = new THREE.Vector3(cx / n, (o.ground ? o.ground(cx / n, cz / n) : 0) + 0.9, cz / n);
  update(0);
  return { object, update, centre, headUp, count: list.length, dispose() { skin.geometry.dispose(); for (const p of list) { p.sm.mat.dispose(); p.sm.depth.dispose(); } } };
}

// ------------------------------------------------------------------------------------------------ the figure on the tor
// A tall thin man, bare-headed, standing with his legs a little apart and his arms folded: a dark shape, nothing in his hands and
// nothing on his head. He faces +z; only his head moves (it turns slowly, by the clock). o: { height (2.3), turn (0.7 radians) }
export function makeTorFigure(ctx, o = {}) {
  const rig = makeRig([{ name: 'body', parent: -1, at: [0, 0, 0] }, { name: 'head', parent: 0, at: [0, 1.68, 0] }]), sk = makeSkin(), K = [0.016, 0.017, 0.022], SKIN = [0.05, 0.045, 0.045];
  const Y = (x, y, z, w, up, down, c = K, b = 0) => ({ p: [x, y, z], w, up, down, c, sk: [b, b, 0] });
  for (const sx of [1, -1]) {
    sk.tube('y', [Y(sx * 0.215, 0.07, 0, 0.05, 0.06, 0.06), Y(sx * 0.19, 0.3, 0, 0.06, 0.07, 0.07), Y(sx * 0.15, 0.62, 0.01, 0.07, 0.08, 0.08), Y(sx * 0.1, 1.02, 0, 0.09, 0.1, 0.1)], 7);
    sk.tube('z', [{ p: [sx * 0.22, 0.045, -0.08], w: 0.05, up: 0.045, c: K, sk: [0, 0, 0] }, { p: [sx * 0.225, 0.045, 0.08], w: 0.055, up: 0.045, c: K, sk: [0, 0, 0] }, { p: [sx * 0.23, 0.035, 0.19], w: 0.04, up: 0.03, c: K, sk: [0, 0, 0] }], 6);
    // arms folded: the upper arm down the side, the fore arm across the chest, the hand tucked at the other elbow
    sk.rod([sx * 0.235, 1.6, 0], [sx * 0.265, 1.31, 0.05], 0.058, 0.05, K, [0, 0, 0], 6);
    sk.rod([sx * 0.265, 1.31, 0.05], [-sx * 0.12, 1.345 + sx * 0.03, 0.165], 0.05, 0.04, K, [0, 0, 0], 6);
  }
  // a plain jacket to the hip, narrow at the waist, square at the shoulder; a thin neck
  sk.tube('y', [Y(0, 0.94, 0, 0.2, 0.125, 0.13), Y(0, 1.08, 0, 0.185, 0.12, 0.125), Y(0, 1.25, 0, 0.17, 0.115, 0.11), Y(0, 1.45, 0.005, 0.215, 0.125, 0.115), Y(0, 1.59, 0, 0.235, 0.105, 0.105), Y(0, 1.645, 0, 0.12, 0.08, 0.08),
    Y(0, 1.67, 0, 0.05, 0.05, 0.05), Y(0, 1.74, 0.005, 0.045, 0.05, 0.05)], 10);
  // the bare head: a long skull with hair close to it, a brow, a thin nose and a chin (so that the turning of the head shows)
  sk.tube('y', [Y(0, 1.71, 0.02, 0.04, 0.05, 0.04, SKIN, 1), Y(0, 1.745, 0.015, 0.06, 0.085, 0.065, SKIN, 1), Y(0, 1.8, 0.005, 0.072, 0.092, 0.085, SKIN, 1), Y(0, 1.87, 0, 0.078, 0.095, 0.095, K, 1), Y(0, 1.93, -0.005, 0.07, 0.085, 0.09, K, 1),
    Y(0, 1.965, -0.01, 0.04, 0.05, 0.055, K, 1)], 9);
  sk.rod([0, 1.86, 0.085], [0, 1.795, 0.128], 0.014, 0.018, SKIN, [1, 1, 0], 5); sk.rod([0, 1.72, 0.06], [0, 1.735, 0.1], 0.02, 0.016, SKIN, [1, 1, 0], 5);
  const geometry = sk.build(); geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 1, 0), 1.6);
  const sm = skinMaterial(rig, { roughness: 0.9 }), mesh = new THREE.Mesh(geometry, sm.mat), object = new THREE.Group(), H = o.height ?? 2.3;
  mesh.customDepthMaterial = sm.depth; mesh.castShadow = true; mesh.scale.setScalar(H / 1.98); object.add(mesh);
  const update = (time) => { rig.rot[1].y = (o.turn ?? 0.7) * Math.sin(time * 0.33 + (o.phase ?? 0)) + (o.bias ?? 0); rig.rot[1].x = 0.06 * Math.sin(time * 0.21 + 1); rig.solve(); };
  update(0);
  return { object, update, height: H, dispose() { geometry.dispose(); sm.mat.dispose(); sm.depth.dispose(); } };
}
