// HERO SET PIECE for "boulders-that-walk": THE FIELD GETS UP.
// A patch of frost-white "boulders" lying on frozen silt that are sleeping Glyptodon (and one or two Doedicurus).
// Keyed to a progress value they heave up back end first (1.8 s each, shuffled, never a wave), the frost slides off
// the tiled brown domes in sheets and smokes orange against the sun, the helmeted head swings out of the front notch,
// the ringed tail lifts, and they turn and plod off north-west at 0.8 m/s. Some never wake.
//
// LOCAL FRAME: origin at the base centre of the patch, +Y up, front toward +Z: the camera arrives heading -Z ("north").
//   The brief's sun is 50 degrees right of that heading and 11 degrees up: opts.sunDir defaults to that.
//
// EXPORTS
//   buildHero(ctx, opts)             the contract piece: a patch of sleepers + their frost smoke, shadows and ground.
//   buildGlyptodontGeometry(rng, o)  one animal as a BufferGeometry: o = { kind: 'glyptodon' | 'doedicurus', lod: 1 | 0.5 }.
//   makeGlyptodonts(ctx, o)          the instanced herd the world coder should use for the whole field and the lagoon:
//        o = { kind, lod, slots: [{ x, y, z, heading, scale, wakeU, awake, never, walkHeading, tuck, wet }], palette, sunDir, duration }
//        -> { mesh, count, setProgress(u), update(dt, time), state(i) -> { x, y, z, rise, heading, moving } }
//
// opts (buildHero): palette (7 hex strings, the brief's by default), detail (0.6..1: thins smoke sprites and ground
//   tufts only, never animals), count (sleepers, default by seed 9..11), sunDir (THREE.Vector3 toward the sun, local),
//   groundPatch (default true: a frosted silt disc so the piece can be judged alone; pass false in a world with terrain),
//   shadows (default true: one long blue multiply shadow per dome), duration (seconds of the flight, 44: sets how
//   much u the 1.8 s rise takes).
//   For a world's own route: first ({ x, z, heading, riseU }: where the owl's dome lies in local space, which way its nose
//   points and how much of u its rise takes), clear((x, z) => true where no sleeper may lie), wakeOf((x, z, i) => wakeU).
//   shared.uCap = 1 (on hero.herds[0].shared) turns the hoar blanket into a cap of snow above the shoulder of the shell.
//
// PROGRESS: hero.setProgress(u) with the world's u (0..1). wakeU per animal is in anchors.wake. Until setProgress is
//   called the piece runs a demo loop on time so the viewer shows sleeping, rising and walking animals together.
//
// ANCHORS (local space, hero.anchors):
//   firstRiser / owlLanding   the dome the owl lands on (ahead-right of the entry; wakeU 0.15) and the top of its shell
//   flyThrough                ordered points of a camera line down the open corridor (x = 0, heading -Z, 2 to 2.2 m up).
//                             No dome centre lies within 2.7 m of x = 0: shells pass about 2 m either side, as the brief asks
//   viewpoints                entry, firstRise, againstSun, sloth: { position, lookAt }
//   tree, sloth, slothHook    foot of the algarrobo, where the Megatherium stands, the bough its claws hook
//   portalSeat                { position, facing }: only if a world wants the ring at the patch (the brief seats it 400 m on)
//   walkHeading / walkDir     north-west, the way the risen ones plod; sunDir; wake: [{ x, z, wakeU, never, kind, scale }]
// ALSO ON THE HERO: herds (the two instanced herds), animals, slothTree (buildSlothTree's result), setProgress(u).
// MORE EXPORTS: buildSlothTree(ctx, o) (sloth + tree + shower as one group; setProgress keys the 9 s loop so the pull
//   falls at o.pullAtU = 0.45), buildMegatheriumGeometry(rng), makeShared(palette, fill), buildGlyptodontGeometryAsync.
// SIZE: radius 10 m (the patch of sleepers is 13 m in radius; the tree stands at its sunward edge), height 8 m (the tree; the domes are 1.5 m).  COST at detail 1: about 100k triangles without the
//   stand-alone ground and tufts (Glyptodon 7.8k and Doedicurus 6.3k each at lod 1, about 2.5k at lod 0.5 for far
//   herds; sloth 3k; tree 16k), 7 draw calls + 2 for the ground patch; build
//   ~180 ms in steps under 25 ms; no lights, no textures.
// LIGHT: wants one low warm directional key + a sky hemisphere fill (MeshStandardMaterial underneath, so everything
//   takes the scene's lights and fog). The animals add a little sky fill to themselves (opts.fill, default 0.8; 0 = off).
//   Emissive only where the brief allows the orange accent: frost smoke, shower and the rim of sloth and tree against
//   the sun (HDR up to ~2.4, hue kept). Shadows are blue multiply quads laid away from opts.sunDir, not shadow maps.
import * as THREE from 'three';
import { clamp, lerp, smoothstep } from '../kit/core.js';

const DEFAULT_PALETTE = ['#DDE6EA', '#8FA3C4', '#6B5B4B', '#C9B48A', '#F3E3C3', '#2F3B45', '#F29A4B'];
const TAU = Math.PI * 2;
const col = (hex) => { const c = new THREE.Color(hex); return [c.r, c.g, c.b]; };
const mixc = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const mulc = (a, k) => [a[0] * k, a[1] * k, a[2] * k];

// ---------------------------------------------------------------------------------------------------------------
// Vertex builder. Every vertex carries: position (standing pose), colour, aBone (part, weight, extra, frostTake),
// aPivot, aShell (plate coordinates in metres, z = plate strength).
// parts: 0 rigid shell/body, 1 head+neck, 2 leg, 3 tail, 4 frost sheet
function makeGeo() {
  const P = [], C = [], B = [], V = [], S = [], I = [];
  const g = {
    count: 0,
    v(p, c, b, pv, s) {
      P.push(p[0], p[1], p[2]); C.push(c[0], c[1], c[2]); B.push(b[0], b[1], b[2], b[3]);
      V.push(pv[0], pv[1], pv[2]); S.push(s ? s[0] : 0, s ? s[1] : 0, s ? s[2] : 0);
      return g.count++;
    },
    tri(a, b, c) { I.push(a, b, c); },
    // grid of nu x nv cells; fn(u, v, i, j) -> { p, c, b, pv, s }; wrapU shares the seam so normals stay smooth
    grid(nu, nv, fn, wrapU = false, flip = false) {
      const cols = wrapU ? nu : nu + 1, base = g.count;
      for (let j = 0; j <= nv; j++) for (let i = 0; i < cols; i++) { const o = fn(i / nu, j / nv, i, j); g.v(o.p, o.c, o.b, o.pv, o.s); }
      for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) {
        const i1 = wrapU ? (i + 1) % nu : i + 1;
        const a = base + j * cols + i, b = base + j * cols + i1, c = base + (j + 1) * cols + i1, d = base + (j + 1) * cols + i;
        if (flip) I.push(a, c, b, a, d, c); else I.push(a, b, c, a, c, d);
      }
      return base;
    },
    // blunt cone / spike: base centre o, unit axis ax, radius r, length len
    cone(o, ax, r, len, sides, c0, c1, b, pv, s, squash = 1, sharp = false) {
      const up = Math.abs(ax[1]) > 0.9 ? [1, 0, 0] : [0, 1, 0];
      const t1 = norm(cross(ax, up)), t2 = cross(ax, t1);
      const prof = sharp ? [[0, 1], [0.5, 0.52], [1, 0.0]] : g.low ? [[0, 1], [0.6, 0.62], [1, 0.0]] : [[0, 1], [0.45, 0.78], [0.82, 0.42], [1, 0.0]];
      if (g.low) sides = Math.min(sides, 3);
      g.grid(sides, prof.length - 1, (u, v, i, j) => {
        const a = u * TAU, rr = r * prof[j][1], h = len * prof[j][0];
        const cx = Math.cos(a) * rr, cy = Math.sin(a) * rr * squash;
        return { p: [o[0] + ax[0] * h + t1[0] * cx + t2[0] * cy, o[1] + ax[1] * h + t1[1] * cx + t2[1] * cy, o[2] + ax[2] * h + t1[2] * cx + t2[2] * cy],
          c: mixc(c0, c1, prof[j][0]), b, pv, s };
      }, true);
    },
    build() {
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
      geo.setAttribute('color', new THREE.Float32BufferAttribute(C, 3));
      geo.setAttribute('aBone', new THREE.Float32BufferAttribute(B, 4));
      geo.setAttribute('aPivot', new THREE.Float32BufferAttribute(V, 3));
      geo.setAttribute('aShell', new THREE.Float32BufferAttribute(S, 3));
      geo.setIndex(I);
      geo.computeVertexNormals();
      return geo;
    },
  };
  return g;
}
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const norm = (a) => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
const sgnpow = (x, k) => Math.sign(x) * Math.pow(Math.abs(x), k);

// ---------------------------------------------------------------------------------------------------------------
// The carapace as a function: azimuth th (0 = front, +Z; quarter turn = +X), f = 0 at the rim .. 1 at the apex.
// Not a hemisphere: a high vault whose top lies behind the middle, steep behind, sides dropping straight to the rim,
// with an arch cut for the neck in front and one for the tail behind.
function shellShape(kind) {
  const D = kind === 'doedicurus';
  const K = D
    ? { hw: 0.80, front: 1.10, back: 1.06, top: 1.52, apexZ: 0.22, rim: 0.36, notchF: 0.30, notchB: 0.26, hump: 0.17 }
    : { hw: 0.76, front: 1.02, back: 0.98, top: 1.50, apexZ: -0.14, rim: 0.35, notchF: 0.30, notchB: 0.24, hump: 0.0 };
  K.rimAt = (th) => {
    const cf = Math.cos(th), nf = Math.exp(-Math.pow((1 - cf) / 0.11, 1.6)), nb = Math.exp(-Math.pow((1 + cf) / 0.075, 1.6));
    return K.rim + K.notchF * nf + K.notchB * nb;
  };
  K.at = (th, f) => {
    const sx = Math.sin(th), cz = Math.cos(th);
    // plan outline: a superellipse, blunter in front than behind
    const ex = 0.82, px = sgnpow(sx, ex) * K.hw, pz = sgnpow(cz, ex) * (cz > 0 ? K.front : K.back);
    const frontness = cz * 0.5 + 0.5;                      // 1 front, 0 back
    // profile: how fast it leaves the vertical. Sides and back stay steep; the front slopes more gently
    const kr = lerp(0.36, 0.56, Math.pow(frontness, 1.5)) + 0.10 * Math.abs(sx);
    const a = f * Math.PI * 0.5;
    const rho = Math.pow(Math.cos(a), kr * 1.25), up = Math.pow(Math.sin(a), 0.92);
    const rim = K.rimAt(th);
    let y = rim + (K.top - rim) * up;
    const shift = K.apexZ * (1 - rho);                      // the top slides back (Glyptodon) or forward (Doedicurus)
    let z = pz * rho + shift;
    if (D) y += K.hump * Math.exp(-Math.pow((z - 0.42) / 0.34, 2)) * Math.pow(Math.max(0, Math.cos(Math.asin(clamp(px * rho / K.hw, -1, 1)))), 1.5) * up;
    return [px * rho, y, z];
  };
  return K;
}

// ---------------------------------------------------------------------------------------------------------------
// One animal, standing pose, nose toward +Z, feet on y = 0. About 6,400 triangles at lod 1 (Glyptodon).
const runSync = (gen) => { let r; while (!(r = gen.next()).done); return r.value; };
const runAsync = async (gen, y) => { let r; while (!(r = gen.next()).done) if (y) await y(); return r.value; };
export function buildGlyptodontGeometry(rng, o = {}) { const [g, q] = runSync(glyptodontBody(rng, o)); return runSync(finishGlyptodont(g, q)); }
// the same in two steps, for a build that must not hold the page (await ctx.yield() between them)
export async function buildGlyptodontGeometryAsync(rng, o = {}, yieldFn = null) { const [g, q] = await runAsync(glyptodontBody(rng, o), yieldFn); if (yieldFn) await yieldFn(); return runAsync(finishGlyptodont(g, q), yieldFn); }
function* glyptodontBody(rng, o) {
  const kind = o.kind === 'doedicurus' ? 'doedicurus' : 'glyptodon', D = kind === 'doedicurus';
  const lod = o.lod ?? 1, pal = o.palette || DEFAULT_PALETTE;
  const K = shellShape(kind), g = makeGeo(); g.low = lod < 1;
  const horn = D ? col('#7c746c') : col(pal[2]), hide = col('#75624f'), hair = col('#6e5a49'), dark = col('#221d1a');
  const frost = col(pal[0]), claw = col('#8c8274');
  const Z3 = [0, 0, 0];

  // --- carapace ---------------------------------------------------------------------------------------------
  const NU = Math.round(64 * lod / 4) * 4, NV = Math.round(20 * lod);
  const merLen = (th) => { let L = 0, q = K.at(th, 0); for (let k = 1; k <= 10; k++) { const p = K.at(th, k / 10); L += Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]); q = p; } return L; };
  const merL = []; for (let i = 0; i < NU; i++) merL.push(merLen(i / NU * TAU));
  g.grid(NU, NV, (u, v, i) => {
    const th = u * TAU, f = 1 - Math.pow(1 - v, 1.35);       // rows crowd toward the rim, where the silhouette turns
    const p = K.at(th, f), L = merL[i] * (1 - f);
    const tone = lerp(1.10, 0.76, smoothstep(0.35, 1, f)) * (0.94 + 0.10 * Math.sin(th * 5 + f * 9) * Math.sin(th * 3 - f * 4));
    return { p, c: mulc(horn, tone), b: [0, 0, 0, 1], pv: Z3, s: [Math.sin(th) * L, Math.cos(th) * L, 1] };
  }, true);
  yield;
  // rim lip: the shell has thickness; a dark inner face closes it from below
  g.grid(NU, 2, (u, v, i, j) => {
    const th = u * TAU, p = K.at(th, 0), q = K.at(th, 0.25);
    const inn = [p[0] * 0.90, p[1] + 0.012, p[2] * 0.92];
    const pp = j === 0 ? p : j === 1 ? inn : [q[0] * 0.80, q[1], q[2] * 0.84];
    return { p: pp, c: j === 0 ? mulc(horn, 0.9) : mulc(hide, 0.55), b: [0, 0, 0, j === 0 ? 1 : 0], pv: Z3, s: [0, 0, 0] };
  }, true, true);
  // rim: Glyptodon's saw edge of 44 blunt cones; Doedicurus has a plain rolled lip (smaller bosses)
  {
    const N = D ? 36 : 44, samples = 360, cum = [0]; let q = K.at(0, 0);
    for (let k = 1; k <= samples; k++) { const p = K.at(k / samples * TAU, 0); cum.push(cum[k - 1] + Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2])); q = p; }
    const per = cum[samples]; let k = 0;
    for (let n = 0; n < N; n++) {
      const want = (n + 0.5) / N * per; while (cum[k + 1] < want) k++;
      const th = (k + (want - cum[k]) / Math.max(1e-6, cum[k + 1] - cum[k])) / samples * TAU;
      const p = K.at(th, 0.03), out = norm([Math.sin(th) * 1.0, -0.95, Math.cos(th) * 1.0]);
      const notch = (K.rimAt(th) - K.rim) / 0.3, sz = (D ? 0.55 : 1) * lerp(1, 0.6, clamp(notch, 0, 1)) * (0.92 + 0.16 * rng());
      g.cone([p[0] * 0.985, p[1], p[2] * 0.985], out, per / N * 0.52 * sz + 0.012, (D ? 0.05 : 0.105) * sz, lod < 1 ? 4 : 6,
        mulc(horn, 0.95), mulc(mixc(horn, col('#B98A52'), 0.4), 0.95), [0, 0, 0, 0.42], Z3, [0, 0, 0]);
    }
  }
  yield;
  // --- body under the shell: a hairy barrel, seen under the rim and in the notches ---------------------------
  g.grid(Math.round(10 * lod), 8, (u, v) => {
    const a = u * TAU, z = lerp(-0.86, 0.84, v), e = Math.sin(v * Math.PI);
    // heavy shoulders fill the front notch of the shell, so that from the front it is a chest and a neck, not a dark arch
    const sh = smoothstep(0.55, 0.86, v) * (1 - 0.3 * smoothstep(0.93, 1, v));
    const w = Math.max(0.30 + 0.30 * Math.pow(e, 0.6), 0.55 * sh), h = Math.max(0.20 + 0.20 * Math.pow(e, 0.6), 0.34 * sh), cy = 0.60 + 0.03 * e;
    return { p: [Math.sin(a) * w, cy - Math.cos(a) * h * (Math.cos(a) > 0 ? 1.0 : 1.2), z], c: mulc(mixc(hair, hide, sh * 0.7), 0.8 + 0.3 * Math.cos(a) + 0.25 * sh), b: [0, 0, 0, 0.15], pv: Z3, s: [0, 0, 0] };
  }, true);

  // --- neck and head: short, deep, blunt; a helmet of plates on top ------------------------------------------
  const neckP = [0, 0.56, 0.80];                               // the pivot the head swings about
  {
    const base = [0, 0.57, 0.66], ax = norm([0, -0.16, 1]), len = 0.92;
    //        t,    halfW, halfH, drop
    const sec = [[0, 0.175, 0.17, 0], [0.22, 0.165, 0.17, 0], [0.40, 0.17, 0.185, 0.0], [0.50, 0.205, 0.21, 0.005], [0.62, 0.215, 0.215, 0.01],
      [0.76, 0.185, 0.205, 0.02], [0.88, 0.15, 0.18, 0.03], [0.96, 0.125, 0.14, 0.04], [1.0, 0.05, 0.06, 0.05]];
    const NA = Math.round(14 * lod / 2) * 2;
    g.grid(NA, sec.length - 1, (u, v, i, j) => {
      const s = sec[j], a = u * TAU, sa = Math.sin(a), ca = Math.cos(a);     // ca = 1 at the top
      const capM = j >= 3 && j <= 6 && ca > 0.42 ? 1 : 0;                    // the cephalic shield
      const hk = j >= 2 ? 1.12 : 1, bx = sgnpow(sa, 0.72) * s[1] * hk * (ca < -0.2 ? 0.86 : 1), by = sgnpow(ca, 0.78) * s[2] * hk * (ca > 0 ? 0.92 : 1.08) + capM * 0.03;
      const zc = base[2] + ax[2] * len * s[0], yc = base[1] + ax[1] * len * s[0] - s[3];
      let c = mulc(mixc(hide, col('#c2a888'), j >= 2 ? 0.62 : 0.2), 0.92 + 0.22 * ca);
      if (capM) c = mulc(mixc(horn, col('#B98A52'), 0.55), (i + j) % 2 ? 1.18 : 0.98); if (j >= 7) c = dark; else if (j === 6 && ca < 0.4) c = mixc(c, dark, 0.6);
      if (j >= 5 && j < 7 && ca < -0.5) c = mulc(hide, 0.42);                   // mouth line shadow
      const w = smoothstep(0.02, 0.36, s[0]);
      return { p: [bx * (1 + capM * 0.04), yc + by, zc], c, b: [1, w, 0, capM ? 0.85 : 0.42], pv: neckP, s: capM ? [bx * 1.5, zc * 1.5, 0.8] : [0, 0, 0] };
    }, true);
    const hb = [1, 1, 0, 0.2], at = (t) => [base[2] + ax[2] * len * t, base[1] + ax[1] * len * t];
    for (const sd of [-1, 1]) {
      const [ez, ey] = at(0.66);
      // eye: a dark bead with one bright fleck, set in a ring of pale skin so that it reads from ten metres
      g.grid(8, 3, (u, v) => { const a = u * TAU, b = v * Math.PI; return { p: [sd * (0.214 + 0.012 * Math.sin(b)), ey + 0.078 + 0.058 * Math.sin(b) * Math.sin(a), ez + 0.004 + 0.062 * Math.sin(b) * Math.cos(a) * 1.2], c: [0.66, 0.56, 0.42], b: [1, 1, 5, 0.0], pv: neckP, s: [0, 0, 0] }; }, true, sd > 0);
      g.grid(6, 3, (u, v) => { const a = u * TAU, b = v * Math.PI; return { p: [sd * (0.222 + 0.02 * Math.cos(b) * 0.4 + 0.0) + sd * 0.016 * Math.sin(b) , ey + 0.078 + 0.036 * Math.sin(b) * Math.sin(a), ez + 0.004 + 0.036 * Math.sin(b) * Math.cos(a) * 1.25], c: [0.012, 0.01, 0.009], b: [1, 1, 5, 0.0], pv: neckP, s: [0, 0, 0] }; }, true, sd > 0);
      const e0 = g.v([sd * 0.2445, ey + 0.096, ez + 0.006], [1.6, 1.5, 1.3], [1, 1, 5, 0], neckP), e1 = g.v([sd * 0.2445, ey + 0.084, ez + 0.018], [1.6, 1.5, 1.3], [1, 1, 5, 0], neckP), e2 = g.v([sd * 0.2445, ey + 0.099, ez + 0.022], [1.6, 1.5, 1.3], [1, 1, 5, 0], neckP);
      if (sd > 0) g.tri(e0, e1, e2); else g.tri(e0, e2, e1);
      // ear, cheek spur (the descending process of the cheekbone), nostril pad
      const [rz, ry] = at(0.47); g.cone([sd * 0.195, ry + 0.145, rz], norm([sd * 0.75, 0.6, -0.3]), 0.045, 0.10, 5, mulc(hide, 1.1), mulc(hide, 0.8), hb, neckP, null, 0.55);
      const [cz, cy] = at(0.70); g.cone([sd * 0.205, cy - 0.07, cz], norm([sd * 0.12, -1, 0.12]), 0.06, 0.17, 5, mulc(hide, 0.95), mulc(hide, 0.7), hb, neckP, null, 0.7);
    }
  }
  return [g, { K, D, lod, rng, horn, hide, hair, dark, frost, claw, Z3 }];
}

function* finishGlyptodont(g, q) {
  const { K, D, lod, rng, horn, hide, hair, dark, frost, claw } = q;
  // --- legs: thick thigh, a knee, a thinner shank, a spreading foot with blunt hoof-claws ---------------------
  // index 0 left hind, 1 left front, 2 right hind, 3 right front (the four-beat order of the walk)
  for (let li = 0; li < 4; li++) {
    const hindLeg = li % 2 === 0, sd = li < 2 ? 1 : -1, m = hindLeg ? 1.26 : 1;
    const hip = hindLeg ? [sd * 0.43, 0.62, -0.47] : [sd * 0.40, 0.60, 0.50], foot = hindLeg ? [sd * 0.50, 0, -0.50] : [sd * 0.45, 0, 0.53];
    const kz = hindLeg ? 0.07 : -0.06;
    const sec = [[0, 0.17, 0], [0.24, 0.168, 0.4], [0.48, 0.14, 1], [0.70, 0.105, 0.35], [0.86, 0.10, 0], [0.95, 0.13, -0.5], [1, 0.142, -0.6]];
    const NA = Math.round(10 * lod / 2) * 2;
    g.grid(NA, sec.length - 1, (u, v, i, j) => {
      const s = sec[j], a = u * TAU, r = s[1] * m, t = s[0];
      const cx = lerp(hip[0], foot[0], t), cy = lerp(hip[1], foot[1], t), cz = lerp(hip[2], foot[2], t) + kz * s[2] * (s[2] < 0 ? -1 : 1) * (s[2] < 0 ? (hindLeg ? 0.6 : -0.9) : 1);
      const shag = 0.75 + 0.3 * Math.sin(a * 5 + j * 2.1) * Math.sin(a * 3 + j);
      return { p: [cx + Math.sin(a) * r, cy, cz + Math.cos(a) * r * (j >= 5 ? 1.18 : 1.05)], c: mulc(j >= 5 ? hide : hair, shag), b: [2, 1 - t, li, 0.3], pv: hip, s: [0, 0, 0] };
    }, true);
    const nc = hindLeg ? 3 : 4;
    for (let c = 0; c < nc; c++) {
      const a = ((c + 0.5) / nc - 0.5) * 1.9 + sd * 0.25, r = 0.125 * m;
      g.cone([foot[0] + Math.sin(a) * r, 0.045, foot[2] + 0.03 + Math.cos(a) * r], norm([Math.sin(a), -0.28, Math.cos(a)]), 0.05 * m, 0.105 * m, lod < 1 ? 4 : 5, mulc(claw, 0.7), claw, [2, 0, li, 0.2], hip, null, 0.75);
    }
  }
  yield;
  // --- tail --------------------------------------------------------------------------------------------------
  const TB = D ? [0, 0.47, -0.90] : [0, 0.45, -0.82], td = norm(D ? [0, -0.05, -1] : [0, -0.25, -1]), TL = D ? 1.5 : 1.02;
  const tx = [1, 0, 0], ty = cross(tx, td);                      // ring frame: tx sideways, ty up; a = 0 is the underside
  const tp = (t, a, rx, ry) => { const sx = Math.sin(a) * rx, sy = -Math.cos(a) * ry; return [TB[0] + td[0] * TL * t + tx[0] * sx + ty[0] * sy, TB[1] + td[1] * TL * t + tx[1] * sx + ty[1] * sy, TB[2] + td[2] * TL * t + tx[2] * sx + ty[2] * sy]; };
  const NS = Math.round(10 * lod / 2) * 2, rings = D ? 4 : 9, ringEnd = D ? 0.34 : 0.93;
  const rad = (t) => D ? lerp(0.18, 0.12, Math.pow(t / 0.34, 0.8)) : lerp(0.18, 0.05, Math.pow(t, 0.85));
  for (let k = 0; k < rings; k++) {
    const t0 = k / rings * ringEnd, t1 = (k + 1) / rings * ringEnd, r0 = rad(t0), r1 = rad(t1);
    g.grid(NS, 2, (u, v, i, j) => {
      const a = u * TAU, t = j === 0 ? t0 : j === 1 ? lerp(t0, t1, 0.84) : lerp(t0, t1, 0.9), r = j === 0 ? r0 * 0.90 : j === 1 ? r0 * 1.10 : r1 * 0.86;
      return { p: tp(t, a, r, r), c: mulc(horn, (j === 2 ? 0.45 : j === 1 ? 1.08 : 0.8) * (D ? 0.72 : 1)), b: [3, t, r0, 0.8], pv: TB, s: [a * r0, t * TL, 0.45] };
    }, true);
    if (!D) {
      const ns = lod < 1 ? 3 : 5, tr = lerp(t0, t1, 0.74);
      for (let s = 0; s < ns; s++) {
        const a = Math.PI + ((s + 0.5) / ns - 0.5) * 4.4 + (k % 2) * 0.3, rd = [Math.sin(a), -Math.cos(a) * ty[1], -Math.cos(a) * ty[2]];
        const base = tp(tr, a, r0 * 1.0, r0 * 1.0), dir = norm([rd[0] * 0.9 + td[0] * 0.35, rd[1] * 0.9 + td[1] * 0.35, rd[2] * 0.9 + td[2] * 0.35]);
        g.cone(base, dir, 0.020 + r0 * 0.15, (0.06 + r0 * 0.5) * (0.85 + 0.3 * rng()), 5, mulc(horn, 0.8), mulc(horn, 0.5), [3, tr, r0, 0.35], TB, null, 1, true);
      }
    }
  }
  if (!D) g.cone(tp(ringEnd, 0, 0, 0), td, 0.05, 0.10, 6, mulc(horn, 0.8), claw, [3, 1, 0.05, 0.7], TB, null);
  else {
    // Doedicurus: a stiff bony tube ending in a flattened club with blunt horn knobs
    const sec = [[0.34, 0.118, 0.118], [0.47, 0.10, 0.10], [0.58, 0.088, 0.085], [0.67, 0.115, 0.13], [0.77, 0.165, 0.205], [0.87, 0.185, 0.235], [0.945, 0.15, 0.195], [0.99, 0.075, 0.10], [1, 0.015, 0.02]];
    g.grid(NS, sec.length - 1, (u, v, i, j) => {
      const s = sec[j], a = u * TAU;
      return { p: tp(s[0], a, s[1], s[2]), c: mulc(horn, (j >= 3 ? 0.46 : 0.56) + 0.16 * Math.cos(a + Math.PI)), b: [3, s[0], s[2], j >= 3 ? 0.22 : 0.8], pv: TB, s: [a * 0.1, s[0] * TL, 0.3] };
    }, true);
    const secAt = (t) => { const s0 = Math.max(1, sec.findIndex((s) => s[0] >= t)), sa = sec[s0 - 1], sb = sec[s0], f = (t - sa[0]) / Math.max(1e-4, sb[0] - sa[0]); return [lerp(sa[1], sb[1], f), lerp(sa[2], sb[2], f)]; };
    const knob = (t, a, r, len, back) => {
      const [rx, ry] = secAt(t), base = tp(t, a, rx * 0.9, ry * 0.9), o = tp(t, 0, 0, 0);
      const dir = norm([base[0] - o[0] + td[0] * back, base[1] - o[1] + td[1] * back, base[2] - o[2] + td[2] * back]);
      g.cone(base, dir, r, len, lod < 1 ? 4 : 5, mulc(horn, 0.9), mulc(claw, 1.5), [3, t, ry, 0.12], TB, null, 0.8);
    };
    for (let k = 0; k < 7; k++) { const a = (k + 0.5) / 7 * TAU; knob(0.765, a, 0.055, 0.10, 0.02); knob(0.87, a + 0.45, 0.068, 0.135, 0.05); }
    for (let k = 0; k < 4; k++) knob(0.95, (k + 0.5) / 4 * TAU, 0.055, 0.11, 0.4);
  }
  yield;
  // --- six sheets of frost that let go of the dome when it stands -------------------------------------------
  for (let k = 0; k < (lod < 1 ? 0 : 6); k++) {
    const th0 = (k + 0.5 + (rng() - 0.5) * 0.5) / 6 * TAU, fw = 0.36 + 0.14 * rng(), f0 = 0.24 + 0.1 * rng(), f1 = 0.66 + 0.16 * rng(), dl = rng();
    const pa = K.at(th0, f0), pb = K.at(th0, f1), dn = norm([pa[0] - pb[0] + Math.sin(th0) * 0.25, pa[1] - pb[1], pa[2] - pb[2] + Math.cos(th0) * 0.25]);
    g.grid(6, 4, (u, v, i, j) => {
      const edge = (i === 0 || i === 6 || j === 0 || j === 4) ? 1 : 0, inn = Math.min(1, Math.min(i, 6 - i) / 2, Math.min(j, 4 - j) / 1.5);
      const th = th0 + (u - 0.5) * 2 * fw * (1 + edge * 0.18 * Math.sin(i * 7.1 + j * 3.3 + k)), f = lerp(f0, f1, v) + edge * 0.04 * Math.sin(i * 4.7 + j * 9.1 + k * 2);
      const p = K.at(th, clamp(f, 0.02, 0.98)), n = norm([p[0], (p[1] - 0.55) * 0.9, p[2]]);
      return { p: [p[0] + n[0] * 0.022, p[1] + n[1] * 0.022, p[2] + n[2] * 0.022], c: mulc(frost, 0.92), b: [4, k / 6, dl, 1], pv: dn, s: [inn, 0, 0] };
    });
  }
  yield;
  const geo = g.build();
  geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0.7, 0), 2.6);
  return geo;
}

// ---------------------------------------------------------------------------------------------------------------
// The animal shader: MeshStandardMaterial (so it takes the scene's lights and fog) with the pose in the vertex stage
// and plates + frost in the fragment stage. Per instance: iA = x, y, z, heading; iB = rise, gait (cycles), walk 0..1,
// scale; iC = tuck side (+-1), frost 0..1, seed, wet 0..1.
const VERT_HEAD = /* glsl */`
attribute vec4 aBone; attribute vec3 aPivot; attribute vec3 aShell;
attribute vec4 iA; attribute vec4 iB; attribute vec4 iC;
uniform float uTime; uniform vec4 uTail; uniform float uKind;
varying vec3 vShell; varying vec4 vFx; varying vec3 vLoc; varying float vSeed;
vec3 gPos; vec3 gNrm; float gTake;
vec3 rotX(vec3 p, float a){ float c = cos(a), s = sin(a); return vec3(p.x, p.y * c - p.z * s, p.z * c + p.y * s); }   // + = nose down
vec3 rotY(vec3 p, float a){ float c = cos(a), s = sin(a); return vec3(p.x * c + p.z * s, p.y, p.z * c - p.x * s); }
vec3 rotZ(vec3 p, float a){ float c = cos(a), s = sin(a); return vec3(p.x * c - p.y * s, p.y * c + p.x * s, p.z); }
float bump01(float a, float b, float x){ float t = clamp((x - a) / (b - a), 0., 1.); return sin(t * 3.14159265); }
// body pose: x = pitch, y = roll, z = lift
vec3 bodyPose(float r, float gait, float wk, float seed){
  float rearL = smoothstep(0.03, 0.50, r), frontL = smoothstep(0.42, 0.96, r);
  float rear = -0.35 * (1. - rearL) + 0.13 * bump01(0.12, 0.80, r);
  float front = -0.35 * (1. - frontL) + 0.012 * sin(uTime * 0.8 + seed * 40.) * (1. - rearL);
  float g = gait * 6.2831853;
  float pitch = atan((rear - front) / 1.8) + wk * 0.018 * sin(2. * g + 0.6);
  float roll = wk * 0.07 * sin(g) + 0.05 * bump01(0.05, 0.9, r) * sin(r * 9. + seed * 30.);
  float lift = 0.5 * (rear + front) + wk * 0.014 * sin(2. * g);
  lift = max(lift, sin(abs(pitch)) * 1.02 - 0.27);
  return vec3(pitch, roll, lift);
}
vec3 bodyXf(vec3 p, vec3 bp){ vec3 q = p - vec3(0., 0.35, 0.); q = rotZ(rotX(q, bp.x), bp.y); return q + vec3(0., 0.35 + bp.z, 0.); }
vec3 bodyN(vec3 n, vec3 bp){ return rotZ(rotX(n, bp.x), bp.y); }
void animate(){
  float r = iB.x, gait = iB.y, wk = iB.z, seed = iC.z, side = iC.x;
  vec3 p = position, n = normal; float part = aBone.x; gTake = 1.;
  vec3 bp = bodyPose(r, gait, wk, seed);
  float g = gait * 6.2831853;
  if (part < 0.5) { p = bodyXf(p, bp); n = bodyN(n, bp); }
  else if (part < 1.5) {
    float tk = 1. - smoothstep(0.08, 0.46, r), w = aBone.y; gTake = mix(0.22, 0.8, tk * tk);
    float yaw = side * tk * 1.08 + (1. - tk) * (0.22 * sin(uTime * 0.31 + seed * 50.) * (1. - 0.5 * wk) + 0.5 * side * bump01(0.45, 1.0, r));
    float pit = -0.10 * tk - 0.50 * bump01(0.16, 1.0, r) + wk * (0.16 + 0.10 * sin(2. * g + 1.2)) + (1. - tk) * 0.05 * sin(uTime * 0.53 + seed * 9.);
    vec3 q = p - aPivot; vec3 qr = rotY(rotX(q, pit), yaw); vec3 nr = rotY(rotX(n, pit), yaw);
    p = aPivot + mix(q, qr, w); n = normalize(mix(n, nr, w));
    p = bodyXf(p, bp); n = bodyN(n, bp);
    p.y = max(p.y, 0.015 * w);
  } else if (part < 2.5) {
    float li = aBone.z, hind = 1. - mod(li, 2.), w = aBone.y;
    float ph = fract(gait + li * 0.25 + 0.1), duty = 0.72, stride = 0.86;
    float sw = clamp((ph - duty) / (1. - duty), 0., 1.), ss = sw * sw * (3. - 2. * sw);
    float fz = ph < duty ? stride * duty * (0.5 - ph / duty) : stride * duty * (ss - 0.5);
    float lift = sin(sw * 3.14159265) * 0.10;
    vec3 hipNow = bodyXf(aPivot, bp);
    float comp = clamp((aPivot.y - hipNow.y) / 0.35, 0., 1.);
    vec3 pf = p + vec3(0., lift, fz) * wk;
    vec3 pb = bodyXf(p, bp);
    float ww = w * w * (3. - 2. * w);
    p = mix(pf, pb, ww);
    float knee = sin(w * 3.14159265);
    p.z += knee * (comp * 0.13 + lift * wk * 0.9) * (hind * 2. - 1.);
    p.x += knee * comp * 0.05 * sign(aPivot.x);
    p.y = max(p.y, 0.0);
    n = bodyN(n, bp * ww);
  } else if (part < 3.5) {
    float t = aBone.y, rr = aBone.z;
    float bend = mix(t * t, t, uKind);
    float asleep = 1. - smoothstep(0.25, 0.85, r);
    vec3 c = aPivot + vec3(0., uTail.x, uTail.y) * uTail.z * t;
    float sx = bend * (wk * 0.20 * sin(g + 3.14159265) + (1. - asleep) * 0.07 * sin(uTime * 0.6 + seed * 70.) - side * asleep * mix(0.42, 0.55, uKind));
    float sz = asleep * bend * 0.14 * (1. - uKind);
    // two bulls sparring (tuck = +-2 on an animal that is up): a slow heavy swing of the club toward the other's shell
    // (tuck = +-3: a bull standing as a gatepost, its club held level and swung slowly)
    float post = step(2.5, abs(side)), duel = step(1.5, abs(side)) * (1. - post), dph = uTime * 1.15 + floor(seed * 2.) * 3.14159265;
    sx += bend * post * 0.30 * sin(uTime * 0.55 + seed * 70.);
    sx += bend * duel * sign(side) * (0.30 + 0.85 * sin(dph) * (0.65 + 0.35 * sin(dph)));
    p.x += sx; p.z += sz; c.x += sx; c.z += sz;
    float lifted = (1. - asleep) * bend * mix(0.05, 0.0, uKind) + 0.10 * bend * bump01(0.3, 1.0, r);
    p.y += lifted; c.y += lifted;
    p = bodyXf(p, bp); c = bodyXf(c, bp); n = bodyN(n, bp);
    p.y += max(0., rr + 0.012 - c.y);
  } else {
    float dl = aBone.z, r0 = 0.03 + dl * 0.30;
    float s = clamp((r - r0) / 0.40, 0., 1.);
    if (r < 0.002 || s >= 0.999) { p = vec3(0., -3., 0.); }
    else {
      p = bodyXf(p, bp); n = bodyN(n, bp);
      p += aPivot * (s * s * 0.9 + s * 0.25) + vec3(0., -1.5 * s * s, 0.);
      p.y = max(p.y, 0.02 + 0.01 * dl);
    }
  }
  float sc = iB.w, h = iA.w;
  gPos = rotY(p * sc, h) + iA.xyz; gNrm = rotY(n, h);
  vShell = aShell; vFx = vec4(aBone.w * gTake, r, iC.y, iC.w); vLoc = position; vSeed = seed;
  if (part > 3.5) vShell = vec3(clamp((r - (0.03 + aBone.z * 0.30)) / 0.40, 0., 1.), aShell.x, -1.);
}
`;

const FRAG_HEAD = /* glsl */`
varying vec3 vShell; varying vec4 vFx; varying vec3 vLoc; varying float vSeed;
uniform float uTime; uniform float uKind; uniform float uCap; uniform vec3 uFrost; uniform vec3 uAmber; uniform vec3 uFill;
float gH; float gFrost; float gButton; float gWet; vec3 gEmis;
float h21(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float vnoise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(h21(i), h21(i + vec2(1., 0.)), f.x), mix(h21(i + vec2(0., 1.)), h21(i + vec2(1., 1.)), f.x), f.y); }
vec4 hexCell(vec2 p){ const vec2 s = vec2(1., 1.7320508);
  vec4 hc = floor(vec4(p, p - vec2(0.5, 1.)) / s.xyxy) + 0.5;
  vec4 h = vec4(p - hc.xy * s, p - (hc.zw + 0.5) * s);
  return dot(h.xy, h.xy) < dot(h.zw, h.zw) ? vec4(h.xy, hc.xy) : vec4(h.zw, hc.zw + 0.5); }
// one bony plate: x height 0..1, y button mask, z groove, w cell hash
vec4 plate(vec2 uv, float kind){
  vec4 hc = hexCell(uv); vec2 q = hc.xy;
  float d = max(dot(abs(q), vec2(0.5, 0.8660254)), abs(q.x)), r = length(q);
  float groove = smoothstep(0.39, 0.48, d), id = h21(hc.zw);
  float button = 1. - smoothstep(0.15, 0.23, r);
  float ang = atan(q.y, q.x + sign(q.x) * 1e-4 + 1e-5);
  float spoke = abs(fract(ang * 1.2732395 + id) - 0.5) * 2.;                 // eight facets round the button
  float facet = smoothstep(0.21, 0.27, r) * (1. - groove) * (1. - 0.75 * smoothstep(0.72, 0.95, spoke));
  float hG = button * (0.75 + 0.25 * (1. - r * 4.)) + 0.52 * facet;
  vec2 pq = fract(q * 4.5 + id * 7.) - 0.5;
  float pits = smoothstep(0.10, 0.26, length(pq));
  float hD = (1. - groove) * (0.45 + 0.55 * pits);
  return vec4(mix(hG, hD, kind), button * (1. - kind), groove, id);
}
`;
const FRAG_COLOR = /* glsl */`
if (vShell.z < -0.5) {   // a frost sheet breaking into flakes as it slides
  float fl = 0.50 * vnoise(vLoc.xz * 9. + vLoc.y * 5.) + 0.32 * vnoise(vLoc.zy * 23. + 3.) + 0.18 * vnoise(vLoc.xy * 67. + 1.);
  float inn = clamp(vShell.y, 0., 1.);
  if (fl < 0.34 + clamp(vShell.x, 0., 1.) * 1.0 + (1. - inn) * (1. - inn) * 0.6) discard;
}
{
  float ps = vShell.z; vec3 base = diffuseColor.rgb;
  float cell = mix(0.054, 0.034, uKind);
  vec2 uvp = vShell.xy / cell; vec2 fwv = fwidth(uvp);
  float fade = (1. - smoothstep(0.30, 0.85, max(fwv.x, fwv.y))) * step(0.01, ps);
  vec4 pl = plate(uvp, uKind);
  float groove = pl.z * fade; gButton = pl.y * fade; gH = pl.x * fade * ps;
  vec3 detail = base * (0.82 + 0.36 * pl.w);
  detail = mix(detail, uAmber * (0.80 + 0.35 * pl.w), pl.y * 0.9);
  detail *= 1. - 0.62 * pl.z;
  vec3 mean = mix(base, uAmber, 0.16 * (1. - uKind)) * 0.93;
  base = mix(base, mix(mean, detail, fade), step(0.01, ps) * min(1., ps * 1.6));
  { vec2 ub = vShell.xy / 0.17; vec2 fwb = fwidth(ub); float fadeB = 1. - smoothstep(0.5, 1.5, max(fwb.x, fwb.y));
    vec4 hb = hexCell(ub); float boss = 1. - smoothstep(0.20, 0.42, length(hb.xy)), idb = h21(hb.zw + 3.);
    float mott = vnoise(vShell.xy * 2.3 + vSeed * 20.) * 0.6 + vnoise(vShell.xy * 5.1 + 4.) * 0.4, dK = uKind * step(0.9, ps);     // the shell only: tail and club keep their dark horn
    vec3 bd = base * mix(1., (0.78 + 0.36 * boss) * (0.86 + 0.28 * idb), fadeB * 0.9) * (0.74 + 0.52 * mott) * (1. - 0.34 * smoothstep(1.0, 1.5, vLoc.y));
    bd = mix(bd, vec3(0.40, 0.35, 0.27) * (0.8 + 0.4 * mott), 0.42 * (1. - smoothstep(0.42, 0.95, vLoc.y)));     // dust low on the flanks
    base = mix(base, bd, dK); }
  // wet flanks for the waders
  float wetK = vFx.w * (1. - smoothstep(0.52, 0.95, vLoc.y + 0.22 * (vnoise(vLoc.xz * 7. + vSeed * 9.) - 0.5)));
  base *= 1. - 0.55 * wetK; gWet = wetK;
  // hoar frost: a blanket while asleep, cleared from the top down as the animal stands; a residue stays in the grooves
  float take = vFx.x, rise = vFx.y, amt = vFx.z;
  float nz = vnoise(vLoc.xz * 4. + vSeed * 31.) * 0.6 + vnoise(vLoc.zy * 11. + 7.) * 0.4;
  float line = mix(2.0, -0.6, smoothstep(0.04, 0.78, rise));
  float keep = 1. - smoothstep(line - 0.06, line + 0.06, vLoc.y + (nz - 0.5) * 0.20 + 0.05 * sin(vShell.x * 9. + vSeed * 40.));
  float thin = smoothstep(0.30, 0.62, vnoise(vLoc.xy * 2.6 + vSeed * 17.) * 0.6 + 0.4 * nz);
  // hoar lies thick on what faces the sky and thin on the steep flanks, where the plates ghost through it with white grooves:
  // a frosted stone with a strange tiled skin, darker than the white ground it lies on
  float upK = dot(normalize(vNormal), normalize((viewMatrix * vec4(0., 1., 0., 0.)).xyz + vec3(0., 1e-4, 0.)));
  float spk = vnoise(vLoc.xz * 37. + vLoc.y * 23. + vSeed * 9.);
  float lie = smoothstep(0.34, 0.92, upK + (nz - 0.5) * 0.26 + (spk - 0.5) * 0.30);
  float blanket = amt * take * keep * mix(0.08 + 0.20 * smoothstep(0.45, 0.8, spk) + 0.10 * groove * fade + 0.05 * (1. - fade), 0.84 + 0.14 * thin - 0.30 * pl.x * fade * ps + 0.3 * groove, max(lie, 1. - step(0.01, ps) * 0.999 * (1. - uCap)));
  float resid = amt * take * (1. - keep) * (0.20 * groove * (1. - 0.7 * smoothstep(0.45, 1.25, vLoc.y)) + 0.04 * (1. - smoothstep(0.35, 1.0, vLoc.y)) * smoothstep(0.45, 0.8, nz));
  // after snow (uCap 1) the white is a cap on the shell above its shoulder; the lower shell and saw rim stay dark horn
  float capK = mix(1., smoothstep(0.64, 0.80, vLoc.y + (nz - 0.5) * 0.24), uCap);
  gFrost = clamp(blanket * capK + resid * (1. - uCap), 0., 1.);
  diffuseColor.rgb = mix(base, uFrost * (0.90 + 0.10 * nz), gFrost);
  gH *= 1. - 0.8 * gFrost;
  // slow glitter (each glint lasts a second or more), only where a crystal is larger than a pixel
  vec3 gp = vLoc * 55.; vec2 gc = floor(gp.xz + gp.y * 0.71); vec2 gfw = fwidth(gp.xz + gp.y * 0.71);
  float hs = h21(gc + vSeed * 13.);
  float tw = sin(uTime * (0.7 + hs) + hs * 40.);
  gEmis = uFrost * smoothstep(0.955, 1., hs) * smoothstep(0.55, 1., tw) * gFrost * 1.5 * (1. - smoothstep(0.5, 1.2, max(gfw.x, gfw.y)));
  if (vShell.z < -0.5) {   // a crust, not paper: granular lumps that take the light and the shade
    float gr = vnoise(vLoc.xz * 41. + vLoc.y * 29.) * 0.6 + vnoise(vLoc.zy * 97.) * 0.4;
    diffuseColor.rgb = uFrost * (0.74 + 0.30 * gr); gH = gr * 2.2; gEmis += uFrost * 0.06; }
}
`;
const FRAG_NORMAL = /* glsl */`
{
  vec3 sp = -vViewPosition; vec2 dH = vec2(dFdx(gH), dFdy(gH)) * 0.0075;
  vec3 sX = dFdx(sp), sY = dFdy(sp);
  vec3 R1 = cross(sY, normal), R2 = cross(normal, sX);
  float fDet = dot(sX, R1) * faceDirection;
  vec3 nn = abs(fDet) * normal - sign(fDet) * (dH.x * R1 + dH.y * R2);
  if (dot(nn, nn) > 1e-14) normal = normalize(nn);
}
`;
// uniforms every herd shares. fill: how much sky light the animals add to themselves so a shaded shell stays open
// (#4A4640 with its pattern readable) whatever the world's hemisphere light is; 0 switches it off.
export function makeShared(pal = DEFAULT_PALETTE, fill = 0.8) {
  return { uTime: { value: 0 }, uCap: { value: 0 }, uFrost: { value: new THREE.Color(pal[0]).multiplyScalar(0.9) }, uFill: { value: new THREE.Color(pal[1]).multiplyScalar(fill) } };
}
export function makeAnimalMaterial(shared, kind, mirror = null) {
  const D = kind === 'doedicurus';
  const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.6, metalness: 0, side: THREE.DoubleSide });
  const td = norm(D ? [0, -0.05, -1] : [0, -0.25, -1]);
  const uni = { uTime: shared.uTime, uCap: shared.uCap || { value: 0 }, uFrost: shared.uFrost, uFill: shared.uFill, uAmber: { value: new THREE.Color(D ? '#7d766c' : '#B98A52') },
    uKind: { value: D ? 1 : 0 }, uTail: { value: new THREE.Vector4(td[1], td[2], D ? 1.5 : 1.02, 0) } };
  mat.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, uni);
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\n' + VERT_HEAD)
      .replace('#include <beginnormal_vertex>', 'animate();\nvec3 objectNormal = gNrm;')
      .replace('#include <begin_vertex>', mirror
        // a reflection (the mesh is drawn upside down under the water): it trembles more the further it lies from the waterline
        ? 'float my = max(gPos.y - iA.y - uMirror.w * iB.w, 0.); gPos.x += sin(my * 9. + uTime * 2.3 + iA.x) * 0.03 * my; gPos.z += sin(my * 7. + uTime * 1.9 + iA.z) * 0.02 * my; vMir = my;\nvec3 transformed = gPos;'
        : 'vec3 transformed = gPos;');
    if (mirror) {
      sh.uniforms.uMirror = mirror.uMirror;
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nuniform vec4 uMirror; varying float vMir;');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform vec4 uMirror; varying float vMir;')
        .replace('#include <dithering_fragment>', 'gl_FragColor.rgb = mix(gl_FragColor.rgb * vec3(0.80, 0.86, 1.0) + uMirror.rgb * 0.9, uMirror.rgb * 1.6, clamp(0.04 + 0.22 * vMir, 0., 0.55));\n#include <dithering_fragment>');
    }
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\n' + FRAG_HEAD)
      .replace('#include <color_fragment>', '#include <color_fragment>\n' + FRAG_COLOR)
      .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\nroughnessFactor = mix(mix(0.66, 0.40, gButton), 0.9, gFrost) * (1. - 0.6 * gWet);')
      .replace('#include <normal_fragment_maps>', '#include <normal_fragment_maps>\n' + FRAG_NORMAL)
      .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\ntotalEmissiveRadiance += gEmis + diffuseColor.rgb * uFill * (0.8 + 0.5 * vFx.y);');
  };
  mat.customProgramCacheKey = () => 'btw-glyptodont-v4' + (mirror ? '-mirror' : '');
  return mat;
}

// ---------------------------------------------------------------------------------------------------------------
// The instanced herd. One draw call per call of this function.
//   slots: [{ x, y = 0, z, heading (radians; nose = (sin h, 0, cos h)), scale = 1, wakeU, awake (up before we came:
//     no frost, no rise), never (never wakes), walkHeading, walkFromU, speed = 0.8 m/s (0 = stands), tuck = +-1, wet 0..1 }]
//   o.duration: seconds of the flight (44); o.timeOfU(u): seconds flown at u if the world uses pace(u) (default u * duration)
//   o.shared: { uTime, uFrost } uniform holders shared by every herd (made if absent)
// Walking is a function of the progress value (distance = speed * time since standing), so a frame at a given u is
// always the same picture; with u held still an animal walks on up to 2.5 m and then stands looking round.
const angLerp = (a, b, t) => { let d = (b - a) % TAU; if (d > Math.PI) d -= TAU; if (d < -Math.PI) d += TAU; return a + d * t; };
export function makeGlyptodonts(ctx, o = {}) {
  const kind = o.kind === 'doedicurus' ? 'doedicurus' : 'glyptodon', pal = o.palette || DEFAULT_PALETTE;
  const rng = o.rng || ctx.rng, slots = o.slots || [], n = slots.length, duration = o.duration ?? 44;
  const timeOfU = o.timeOfU || ((u) => u * duration), riseU = 1.8 / duration;
  const shared = o.shared || makeShared(pal, o.fill);
  const base = o.geometry || buildGlyptodontGeometry(rng, { kind, lod: o.lod ?? 1, palette: pal });
  const geo = new THREE.InstancedBufferGeometry();
  geo.setIndex(base.index); for (const k of ['position', 'normal', 'color', 'aBone', 'aPivot', 'aShell']) geo.setAttribute(k, base.attributes[k]);
  const A = new Float32Array(n * 4), B = new Float32Array(n * 4), C = new Float32Array(n * 4);
  const st = slots.map((s, i) => {
    const heading = s.heading ?? 0, scale = s.scale ?? (kind === 'doedicurus' ? 1.07 : 1);
    C[i * 4] = s.tuck ?? (rng() < 0.5 ? -1 : 1); C[i * 4 + 1] = s.awake ? 0 : (s.frost ?? 1); C[i * 4 + 2] = rng(); C[i * 4 + 3] = s.wet ?? 0;
    return { x0: s.x, y0: s.y ?? 0, z0: s.z, h0: heading, h1: s.walkHeading ?? heading, scale, wakeU: s.wakeU ?? 0.2, awake: !!s.awake, never: !!s.never,
      walkFromU: s.walkFromU ?? 0, speed: s.speed ?? 0.8, riseU: s.riseU ?? riseU, seed: C[i * 4 + 2], gait0: rng(), x: s.x, y: s.y ?? 0, z: s.z, h: heading, rise: s.awake ? 1 : 0, riseT: 0, d: 0, wk: 0, extra: 0, want: 0, moving: false };
  });
  const aA = new THREE.InstancedBufferAttribute(A, 4).setUsage(THREE.DynamicDrawUsage), aB = new THREE.InstancedBufferAttribute(B, 4).setUsage(THREE.DynamicDrawUsage);
  geo.setAttribute('iA', aA); geo.setAttribute('iB', aB); geo.setAttribute('iC', new THREE.InstancedBufferAttribute(C, 4));
  geo.instanceCount = n;
  const mat = o.material || makeAnimalMaterial(shared, kind);
  const mesh = new THREE.Mesh(geo, mat); mesh.frustumCulled = false; mesh.name = 'btw-' + kind;
  const STRIDE = 0.86, TURN = 3.5;                 // metres per gait cycle at scale 1; metres over which it turns onto its walk heading
  let u = 0, lastU = 0;
  const place = (s) => {                           // position and heading as a pure function of distance walked
    let x = s.x0, z = s.z0, h = s.h0; const steps = 10, d = s.d;
    for (let k = 0; k < steps; k++) {
      const dm = d * (k + 0.5) / steps; h = angLerp(s.h0, s.h1, smoothstep(0, TURN, dm));
      x += Math.sin(h) * d / steps; z += Math.cos(h) * d / steps;
    }
    s.x = x; s.z = z; s.h = angLerp(s.h0, s.h1, smoothstep(0, TURN, d));
  };
  const api = {
    mesh, count: n, shared, kind, slots: st,
    setProgress(v) { u = v; },
    update(dt, time) {
      shared.uTime.value = time;
      const jumped = Math.abs(u - lastU) > 0.02; lastU = u;
      for (let i = 0; i < n; i++) {
        const s = st[i];
        const upU = s.awake ? -1 : s.never ? 9 : s.wakeU + s.riseU;                 // the u at which it is on its feet
        s.riseT = s.awake ? 9 : s.never ? 0 : (u - s.wakeU) / s.riseU;
        s.rise = clamp(s.riseT, 0, 1);
        const goU = Math.max(upU, s.walkFromU);
        const want = u > goU ? s.speed * Math.max(0, timeOfU(u) - timeOfU(Math.max(0, goU))) : 0;   // metres it should have walked by now
        let go = 0;
        if (jumped || want <= 0) { s.extra = 0; go = want > 0 ? 1 : 0; s.wk = go; }
        else if (want > s.want + 1e-6) go = 1;                                    // u is moving: follow it exactly
        else { const k = clamp((2.5 - s.extra) / 0.6, 0, 1); s.extra += s.speed * dt * k; go = clamp(k * 3, 0, 1); }   // u held: walk on, slow, stand
        s.want = want; s.d = want + s.extra;
        s.wk += (go - s.wk) * Math.min(1, dt * 4);
        s.moving = s.wk > 0.05;
        place(s);
        const gait = (s.gait0 + s.d / (STRIDE * s.scale)) % 1;
        A[i * 4] = s.x; A[i * 4 + 1] = s.y0; A[i * 4 + 2] = s.z; A[i * 4 + 3] = s.h;
        B[i * 4] = s.rise; B[i * 4 + 1] = gait; B[i * 4 + 2] = s.rise >= 1 ? s.wk : 0; B[i * 4 + 3] = s.scale;
      }
      aA.needsUpdate = true; aB.needsUpdate = true;
    },
    state(i) { return st[i]; },
  };
  api.update(0, 0);
  return api;
}

// ---------------------------------------------------------------------------------------------------------------
// Long blue shadows: one stretched multiply quad per animal, laid away from the sun. set(i, x, z, height, heading).
export function makeShadows(n, sunDir, y = 0.03, rise = null) {
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute([-0.2, 0, -1, 1, 0, -1, 1, 0, 1, -0.2, 0, 1], 3));
  g.setIndex([0, 2, 1, 0, 3, 2]);
  const S = new Float32Array(n * 4), aS = new THREE.InstancedBufferAttribute(S, 4).setUsage(THREE.DynamicDrawUsage);
  g.setAttribute('iS', aS); g.instanceCount = n;
  const az = new THREE.Vector2(-sunDir.x, -sunDir.z).normalize(), k = Math.hypot(sunDir.x, sunDir.z) / Math.max(0.05, sunDir.y);
  const mat = new THREE.ShaderMaterial({
    uniforms: { uDir: { value: az }, uY: { value: y }, uMul: { value: new THREE.Vector3(0.48, 0.56, 0.75) }, uOpacity: { value: 0.85 },
      uRiseA: rise ? rise.uRiseA : { value: new THREE.Vector4(0, 0, 1, 0) }, uRiseB: rise ? rise.uRiseB : { value: new THREE.Vector4(0, 1, 0, 1) } },
    vertexShader: /* glsl */`attribute vec4 iS; uniform vec2 uDir; uniform float uY; uniform vec4 uRiseA, uRiseB; varying vec2 vQ;
      void main(){ vQ = position.xz; vec2 side = vec2(-uDir.y, uDir.x);
        vec2 p = iS.xy + uDir * position.x * iS.z + side * position.z * iS.w;
        vec2 q = p - uRiseA.xy; float rs = dot(q, uRiseA.zw), rt = abs(dot(q, vec2(-uRiseA.w, uRiseA.z)));
        float gy = uRiseB.z * smoothstep(uRiseB.x, uRiseB.y, rs) * (1. - smoothstep(uRiseB.w, uRiseB.w + 26., rt));
        gl_Position = projectionMatrix * modelViewMatrix * vec4(p.x, uY + gy * 1.02, p.y, 1.); }`,
    fragmentShader: /* glsl */`uniform vec3 uMul; uniform float uOpacity; varying vec2 vQ;
      void main(){ float e = length(vec2((vQ.x - 0.40) / 0.60, vQ.y));
        float a = (1. - smoothstep(0.86, 1.0, e)) * (1. - 0.35 * smoothstep(0.3, 1., vQ.x)) * uOpacity;      // a cast shadow has an edge
        gl_FragColor = vec4(mix(vec3(1.), uMul, a), 1.); }`,
    transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.MultiplyBlending, premultipliedAlpha: true,
  });
  const mesh = new THREE.Mesh(g, mat); mesh.frustumCulled = false; mesh.renderOrder = 1; mesh.name = 'btw-shadows';
  return { mesh, set(i, x, z, h, w) { S[i * 4] = x; S[i * 4 + 1] = z; S[i * 4 + 2] = h * k * 1.05 + 0.9; S[i * 4 + 3] = w; }, commit() { aS.needsUpdate = true; } };
}

// A frosted silt disc so the piece can be judged on its own (a world with terrain passes groundPatch: false).
function makeGroundPatch(noise, R, pal) {
  const silt = col('#8A7A66'), frost = mulc(col(pal[0]), 0.86), NR = 30, NA = 96, P = [], Cc = [], I = [];
  for (let j = 0; j <= NR; j++) for (let i = 0; i < NA; i++) {
    const r = R * Math.pow(j / NR, 2.4), a = i / NA * TAU, x = Math.sin(a) * r, z = Math.cos(a) * r;
    const f = clamp(0.84 + 0.30 * noise.fbm2(x * 0.045, z * 0.045, 2) * Math.min(1, 14 / (r + 1)) + 0.12 * noise.n2(x * 0.35, z * 0.35) * Math.min(1, 5 / (r + 1)), 0.5, 1);
    const c = mixc(mulc(silt, 0.8), frost, f);
    P.push(x, 0, z); Cc.push(c[0], c[1], c[2], 1 - smoothstep(0.55, 1, j / NR));
  }
  for (let j = 0; j < NR; j++) for (let i = 0; i < NA; i++) { const i1 = (i + 1) % NA, a = j * NA + i, b = j * NA + i1, c = (j + 1) * NA + i1, d = (j + 1) * NA + i; I.push(a, d, c, a, c, b); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(Cc, 4)); g.setIndex(I);
  g.computeVertexNormals();
  const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ vertexColors: true, transparent: true, depthWrite: false, roughness: 0.95, metalness: 0 }));
  m.position.y = 0.012; m.renderOrder = 0; m.name = 'btw-ground';
  return m;
}

// Frosted bunch grass for the stand-alone patch: 0.3 m tufts, every blade white with hoar, shivering in a light wind.
function makeTufts(rng, shared, n, R, pal, keepOff) {
  const P = [], C = [], N = [], T = [], I = [], straw = col(pal[3]), frost = mulc(col(pal[0]), 0.88);
  let v = 0;
  for (let i = 0; i < n; i++) {
    const a = rng() * TAU, r = Math.pow(rng(), 0.8) * R, x = Math.sin(a) * r, z = Math.cos(a) * r, ph = rng(), sz = 0.7 + 0.7 * rng();
    if (keepOff(x, z)) continue;
    for (let b = 0; b < 5; b++) {
      const ba = rng() * TAU, lean = (0.08 + 0.16 * rng()) * sz, h = (0.2 + 0.2 * rng()) * sz, w = 0.022 * sz, dx = Math.sin(ba), dz = Math.cos(ba);
      P.push(x - dz * w, 0.0, z + dx * w, x + dz * w, 0.0, z - dx * w, x + dx * lean, h, z + dz * lean);
      const c0 = mulc(straw, 0.55 + 0.2 * rng()), c1 = mixc(straw, frost, 0.55 + 0.4 * rng());
      C.push(c0[0], c0[1], c0[2], c0[0], c0[1], c0[2], c1[0], c1[1], c1[2]); N.push(0, 1, 0, 0, 1, 0, 0, 1, 0); T.push(ph, 0, ph, 0, ph, 1); I.push(v, v + 1, v + 2); v += 3;
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3)); g.setAttribute('aTuft', new THREE.Float32BufferAttribute(T, 2)); g.setIndex(I);
  const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9, metalness: 0, side: THREE.DoubleSide });
  mat.onBeforeCompile = (sh) => {
    sh.uniforms.uTime = shared.uTime;
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute vec2 aTuft; uniform float uTime;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\ntransformed.x += aTuft.y * (0.018 * sin(uTime * 2.6 + aTuft.x * 40. + position.z * 0.7) + 0.012 * sin(uTime * 0.7 + position.x * 0.3));');
    sh.fragmentShader = sh.fragmentShader.replace('#include <normal_fragment_maps>', '#include <normal_fragment_maps>\nnormal = normalize((viewMatrix * vec4(0., 1., 0., 0.)).xyz);');
  };
  mat.customProgramCacheKey = () => 'btw-tufts';
  const m = new THREE.Mesh(g, mat); m.name = 'btw-tufts'; return m;
}

// ---------------------------------------------------------------------------------------------------------------
// THE SECOND SURPRISE: Megatherium reared against an algarrobo, hooking a bough and shaking down lit frost.
// Tube along a polyline with elliptical sections. rad[i] = [r1, r2]: r1 along (tangent x ref), r2 across.
function tubeAlong(g, pts, rad, sides, ref, fn) {
  const n = pts.length, fr = [];
  for (let i = 0; i < n; i++) {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)], t = norm([b[0] - a[0], b[1] - a[1], b[2] - a[2]]);
    const n1 = norm(cross(t, ref)), n2 = cross(t, n1); fr.push([n1, n2]);
  }
  g.grid(sides, n - 1, (u, v, i, j) => {
    const a = u * TAU, ca = Math.cos(a), sa = Math.sin(a), [n1, n2] = fr[j], r = rad[j], p = pts[j], o = fn(j, a, ca, sa);
    const k1 = r[0] * (o.k1 ?? 1), k2 = r[1];
    return { p: [p[0] + n1[0] * ca * k1 + n2[0] * sa * k2, p[1] + n1[1] * ca * k1 + n2[1] * sa * k2, p[2] + n1[2] * ca * k1 + n2[2] * sa * k2], c: o.c, b: o.b, pv: o.pv, s: o.s };
  }, true);
  return fr;
}
// rows of hanging hair: ragged teeth round a tube, so the outline is shaggy from every side
function shagRows(g, rng, pts, rad, ref, rows, teeth, len, c0, c1, bfn) {
  const n = pts.length;
  for (let r = 0; r < rows; r++) {
    const f = (r + 0.5) / rows * (n - 1), j = Math.min(n - 2, Math.floor(f)), t = f - j, pa = pts[j], pb = pts[j + 1];
    const p = [lerp(pa[0], pb[0], t), lerp(pa[1], pb[1], t), lerp(pa[2], pb[2], t)], r1 = lerp(rad[j][0], rad[j + 1][0], t), r2 = lerp(rad[j][1], rad[j + 1][1], t);
    const tg = norm([pb[0] - pa[0], pb[1] - pa[1], pb[2] - pa[2]]), n1 = norm(cross(tg, ref)), n2 = cross(tg, n1), o = bfn(p);
    const off = rng() * TAU;
    for (let k = 0; k < teeth; k++) {
      const a0 = off + k / teeth * TAU, a1 = a0 + TAU / teeth * 1.15, am = (a0 + a1) / 2, L = len * (0.6 + 0.8 * rng());
      const at = (a, s, drop) => [p[0] + (n1[0] * Math.cos(a) * r1 + n2[0] * Math.sin(a) * r2) * s, p[1] + (n1[1] * Math.cos(a) * r1 + n2[1] * Math.sin(a) * r2) * s - drop, p[2] + (n1[2] * Math.cos(a) * r1 + n2[2] * Math.sin(a) * r2) * s];
      const v0 = g.v(at(a0, 0.98, 0), c0, o.b, o.pv, o.s), v1 = g.v(at(a1, 0.98, 0), c0, o.b, o.pv, o.s);
      const v2 = g.v(at(am, 1.0 + (0.10 + 0.12 * rng()) / Math.max(0.3, Math.max(r1, r2)) * 0.5, L), c1, [o.b[0], o.b[1], o.b[2], 1], o.pv, o.s);
      g.tri(v0, v1, v2);
    }
  }
}
export function buildMegatheriumGeometry(rng, o = {}) {
  const g = makeGeo(), dun = col(o.color || '#7A6650'), dk = mulc(dun, 0.55), lt = mulc(dun, 1.25), claw = col('#2a2622'), X = [1, 0, 0], Z0 = [0, 0, 0];
  // body, neck and head as one loft up a spine that leans no more than 17 degrees: an upright pear (hips twice the
  // shoulders), a short thick neck, a small long-muzzled head lifted toward the bough. rows: y, z, half width, half depth
  const sp = [[1.02, -0.30, 0.34, 0.40], [1.22, -0.27, 0.66, 0.80], [1.55, -0.22, 0.80, 0.96], [1.98, -0.15, 0.78, 0.88], [2.40, -0.06, 0.66, 0.72], [2.78, 0.03, 0.54, 0.58],
    [3.04, 0.12, 0.42, 0.47], [3.20, 0.34, 0.27, 0.28], [3.30, 0.54, 0.215, 0.205], [3.36, 0.74, 0.20, 0.175], [3.39, 0.96, 0.145, 0.13], [3.40, 1.13, 0.115, 0.10], [3.40, 1.20, 0.04, 0.04]];
  const pts = sp.map((q) => [0, q[0], q[1]]), rad = sp.map((q) => [q[2], q[3]]), neck = [0, 3.10, 0.24];
  const bodyB = (j) => j >= 7 ? [3, j >= 8 ? 1 : 0.4, 0, 0] : [0, 0, 0, 0];
  tubeAlong(g, pts, rad, 20, X, (j, a, ca) => ({ k1: ca < 0 && j >= 1 && j <= 5 ? 1.16 : 1, c: mulc(j >= 11 ? claw : dun, 0.8 + 0.25 * ca + 0.12 * Math.sin(a * 7 + j * 3)), b: bodyB(j), pv: neck, s: Z0 }));
  shagRows(g, rng, pts.slice(0, 8), rad.slice(0, 8), X, 15, 26, 0.26, dk, lt, (p) => ({ b: p[1] > 3.2 ? [3, 0.4, 0, 0] : [0, 0, 0, 0], pv: neck, s: Z0 }));
  for (const sd of [-1, 1]) {
    g.cone([sd * 0.17, 3.44, 0.50], norm([sd * 0.8, 0.5, -0.4]), 0.06, 0.12, 5, dun, dk, [3, 1, 0, 0], neck, Z0, 0.5);           // ear
    g.cone([sd * 0.165, 3.44, 0.80], norm([sd, 0.2, 0]), 0.03, 0.025, 5, [0.01, 0.01, 0.01], [0.01, 0.01, 0.01], [3, 1, 0, 0], neck, Z0);  // eye
    // hind legs: thick thigh, knee forward, standing on the outer edge of the foot with the claws turned in. They are
    // planted wide and a stride apart (one forward, one back), so that from the side two pillars stand under the pear
    const zo = sd * 0.44;
    const leg = [[sd * 0.50, 1.55, -0.20 + zo * 0.3], [sd * 0.62, 1.12, 0.02 + zo * 0.75], [sd * 0.66, 0.74, 0.10 + zo], [sd * 0.64, 0.40, 0.02 + zo], [sd * 0.62, 0.17, -0.04 + zo]];
    const lr = [[0.46, 0.42], [0.40, 0.36], [0.31, 0.29], [0.25, 0.24], [0.22, 0.22]];
    tubeAlong(g, leg, lr, 10, X, (j, a, ca) => ({ c: mulc(dun, 0.78 + 0.2 * ca + 0.1 * Math.sin(a * 5 + j)), b: [0, 0, 0, 0], pv: Z0, s: Z0 }));
    shagRows(g, rng, leg.slice(0, 3), lr, X, 4, 14, 0.2, dk, lt, () => ({ b: [0, 0, 0, 0], pv: Z0, s: Z0 }));
    const foot = [[sd * 0.62, 0.15, -0.26 + zo], [sd * 0.60, 0.15, 0.05 + zo], [sd * 0.50, 0.13, 0.36 + zo], [sd * 0.40, 0.10, 0.58 + zo]];
    tubeAlong(g, foot, [[0.13, 0.17], [0.15, 0.21], [0.13, 0.19], [0.07, 0.11]], 8, [0, 1, 0], (j, a, ca) => ({ c: mulc(dk, 0.9 + 0.2 * ca), b: [0, 0, 0, 0], pv: Z0, s: Z0 }));
    for (let c = 0; c < 3; c++) g.cone([sd * (0.44 - c * 0.07), 0.11, 0.52 + c * 0.05 + zo], norm([-sd * 0.75, -0.05, 0.6]), 0.05, 0.26, 5, claw, mulc(claw, 1.6), [0, 0, 0, 0], Z0, Z0, 0.7);
    // arms: shoulder, elbow, wrist, a long hand, three hooked claws. The near arm (as the world shows it, -X) reaches
    // high to hook the bough; the far one holds a lower branch, so the two do not merge into one thick shape
    const hi = sd < 0, S = [sd * 0.50, 2.90, 0.12], E = hi ? [sd * 0.62, 3.88, 0.52] : [sd * 0.62, 2.62, 0.92], W = hi ? [sd * 0.50, 4.20, 1.50] : [sd * 0.50, 2.86, 1.62], Kn = hi ? [sd * 0.44, 4.33, 1.86] : [sd * 0.44, 2.98, 1.92];
    const arm = [S, [lerp(S[0], E[0], 0.5), lerp(S[1], E[1], 0.5) - 0.03, lerp(S[2], E[2], 0.5)], E, [lerp(E[0], W[0], 0.5), lerp(E[1], W[1], 0.5), lerp(E[2], W[2], 0.5)], W, Kn];
    const ar = [[0.31, 0.28], [0.26, 0.24], [0.21, 0.20], [0.19, 0.17], [0.15, 0.15], [0.10, 0.15]];
    const fw = [0, 0, 0.5, 1, 1, 1], part = sd > 0 ? 1 : 2;
    tubeAlong(g, arm, ar, 10, X, (j, a, ca) => ({ c: mulc(dun, 0.78 + 0.2 * ca + 0.1 * Math.sin(a * 5 + j)), b: [part, 1, fw[j], 0], pv: S, s: E }));
    shagRows(g, rng, arm.slice(0, 5), ar, X, 8, 12, 0.22, dk, lt, (p) => ({ b: [part, 1, p[1] > E[1] ? 1 : 0, 0], pv: S, s: E }));
    for (let c = -1; c <= 1; c++) {
      const b0 = [Kn[0] + c * 0.085, Kn[1], Kn[2]];
      tubeAlong(g, [b0, [b0[0], b0[1] + 0.13, b0[2] + 0.12], [b0[0], b0[1] + 0.13, b0[2] + 0.28], [b0[0], b0[1] + 0.02, b0[2] + 0.38], [b0[0], b0[1] - 0.09, b0[2] + 0.37]],
        [[0.05, 0.05], [0.05, 0.045], [0.04, 0.035], [0.025, 0.022], [0.006, 0.006]], 5, X, (j) => ({ c: mulc(claw, 1 + j * 0.25), b: [part, 1, 1, 0], pv: S, s: E }));
    }
  }
  // tail: the third leg of the tripod
  const tail = [[0, 1.18, -0.52], [0, 0.80, -1.02], [0, 0.42, -1.48], [0, 0.22, -1.95], [0, 0.15, -2.42], [0, 0.10, -2.75]];
  const tr = [[0.44, 0.44], [0.36, 0.36], [0.27, 0.28], [0.19, 0.20], [0.11, 0.12], [0.03, 0.03]];
  tubeAlong(g, tail, tr, 10, X, (j, a, ca) => ({ c: mulc(dun, 0.78 + 0.2 * ca), b: [0, 0, 0, 0], pv: Z0, s: Z0 }));
  shagRows(g, rng, tail.slice(0, 5), tr, X, 5, 12, 0.2, dk, lt, () => ({ b: [0, 0, 0, 0], pv: Z0, s: Z0 }));
  const geo = g.build(); geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 2.2, 0), 3.6);
  return geo;
}

// Algarrobo in winter: a short twisted black trunk dividing low into a wide flat crown of zigzag twigs, every twig rimed.
// The bough that leaves toward `toward` (unit xz) passes through `hook` and is the one the sloth pulls: aBone.y = pull weight.
export async function buildAlgarroboGeometry(ctx, rng, hook, plain = false, tone = null) {   // plain: no long pulled bough (a tree nothing feeds from); tone: { bark, rime }
  const g = makeGeo(), bark = col(tone?.bark || '#2b231d'), rime = col(tone?.rime || '#cfd8de'), Z0 = [0, 0, 0], fork = [0.12, 1.7, 0.05];
  const hookD = Math.hypot(hook[0] - fork[0], hook[1] - fork[1], hook[2] - fork[2]);
  let segs = 0;
  const limb = (start, dir, len, r0, r1, nseg, sides, zig, flat, pulled, flex, depth) => {
    const pts = [start], rad = [[r0, r0]], ends = []; let d = dir.slice(), p = start.slice();
    for (let k = 1; k <= nseg; k++) {
      const sgn = k % 2 ? 1 : -1, side = norm(cross(d, [0, 1, 0]));
      d = norm([d[0] + side[0] * zig * sgn * (0.6 + 0.8 * rng()) + (rng() - 0.5) * zig * 0.5, Math.max(depth >= 2 ? -0.45 : -0.04, d[1] + (rng() - 0.5) * zig * 0.6 - flat * (0.03 + Math.max(0, p[1] - 6.2) * 0.35)), d[2] + side[2] * zig * sgn * (0.6 + 0.8 * rng()) + (rng() - 0.5) * zig * 0.5]);
      p = [p[0] + d[0] * len / nseg, p[1] + d[1] * len / nseg, p[2] + d[2] * len / nseg];
      pts.push(p); const r = lerp(r0, r1, k / nseg); rad.push([r, r]); ends.push([p.slice(), d.slice(), r]);
    }
    const tw = depth >= 2 ? 0.75 : depth === 1 ? 0.3 : 0.06;
    tubeAlong(g, pts, rad, sides, Math.abs(dir[1]) > 0.9 ? [1, 0, 0] : [0, 1, 0], (j, a, ca, sa) => {
      const q = pts[j], w = pulled ? Math.min(1.5, Math.hypot(q[0] - fork[0], q[1] - fork[1], q[2] - fork[2]) / hookD) : 0;
      return { c: mixc(mulc(bark, 0.8 + 0.4 * rng()), rime, clamp(tw * (0.6 + 0.5 * sa) + (sa > 0.3 ? 0.25 : 0), 0, 0.92)), b: [0, w, flex * j / nseg, depth >= 2 ? 1 : 0], pv: Z0, s: Z0 };
    });
    segs += nseg;
    return ends;
  };
  // trunk with a root flare and a twist
  tubeAlong(g, [[0, -0.1, 0], [0.02, 0.35, 0], [-0.05, 0.9, 0.04], [0.06, 1.35, 0.0], fork], [[0.62, 0.58], [0.44, 0.42], [0.38, 0.40], [0.37, 0.35], [0.40, 0.42]], 9, [1, 0, 0],
    (j, a) => ({ k1: 1 + 0.12 * Math.sin(a * 3 + j * 1.7), c: mulc(bark, 0.75 + 0.3 * Math.sin(a * 5 + j * 2) ** 2), b: [0, 0, 0, 0], pv: Z0, s: Z0 }));
  const NB = 5, a0 = Math.atan2(hook[0] - fork[0], hook[2] - fork[2]);
  for (let b = 0; b < NB; b++) {
    const pulled = b === 0 && !plain, az = a0 + b / NB * TAU + (pulled ? 0 : (rng() - 0.5) * 0.5);
    let dir, len;
    if (pulled) { dir = norm([hook[0] - fork[0], hook[1] - fork[1], hook[2] - fork[2]]); len = hookD * 1.45; }
    else { const el = 0.80 + 0.30 * rng(); dir = [Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el)]; len = 5.6 + 1.3 * rng(); }
    const ends = limb(fork, dir, len, 0.24, 0.10, 7, 7, pulled ? 0.05 : 0.2, pulled ? 0.5 : 1.5, pulled, 0.05, 0);
    for (let k = 1; k < ends.length; k++) {
      if (k < 2 && !pulled) continue;
      const [ep, ed, er] = ends[k], n2 = k === ends.length - 1 ? 2 : 1;
      for (let q = 0; q < n2 + (rng() < 0.5 ? 1 : 0); q++) {
        const sa = (rng() - 0.5) * 2.2, sd = norm([ed[0] * Math.cos(sa) + ed[2] * Math.sin(sa), ed[1] * 0.4 + 0.25 + 0.3 * rng(), ed[2] * Math.cos(sa) - ed[0] * Math.sin(sa)]);
        const e2 = limb(ep, sd, 2.0 + 1.3 * rng(), er * 0.72, 0.042, 5, 5, 0.34, 1.6, pulled, 0.3, 1);
        for (let t = 0; t < e2.length; t++) {
          const [tp, tdd, trr] = e2[t], nt = 1 + (t % 2) + (t === e2.length - 1 ? 1 : 0);
          for (let w = 0; w < nt; w++) {
            const ta = (rng() - 0.5) * 2.6, tdir = norm([tdd[0] * Math.cos(ta) + tdd[2] * Math.sin(ta), tdd[1] * 0.3 + (rng() - 0.35) * 0.7, tdd[2] * Math.cos(ta) - tdd[0] * Math.sin(ta)]);
            const e3 = limb(tp, tdir, 0.8 + 0.9 * rng(), Math.min(0.036, trr * 0.85), 0.018, 4, 3, 0.5, 2.2, pulled, 1, 2);
            // a twiglet off the middle of each twig, and now and then a hanging pod
            const [mp, md] = e3[1]; limb(mp, norm([md[2] * 0.8 + md[0] * 0.3, md[1] * 0.2 - 0.1, -md[0] * 0.8 + md[2] * 0.3]), 0.35 + 0.4 * rng(), 0.022, 0.014, 2, 3, 0.5, 2, pulled, 1, 2);
            if (rng() < 0.1) g.cone(e3[2][0], norm([0.2 * (rng() - 0.5), -1, 0.2 * (rng() - 0.5)]), 0.022, 0.22, 4, col('#5a4026'), col('#7a5a34'), [0, pulled ? Math.min(1.5, Math.hypot(mp[0] - fork[0], mp[1] - fork[1], mp[2] - fork[2]) / hookD) : 0, 1, 0], Z0, Z0, 0.5);
          }
        }
        if (segs > 120) { segs = 0; await ctx.yield(); }
      }
    }
  }
  await ctx.yield();
  const geo = g.build(); geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 4.5, 0), 9);
  return geo;
}

// Material for the sloth and its tree: lit, near-dark, with a burning rim against the sun (aBone.w = 1 marks hair tips
// and twigs, which glow through). mode 'sloth': uPose = reach, pull, chew, lean. mode 'tree': uPose.x = bough pull, y = shiver.
export function makeSilhouetteMaterial(shared, mode, uPose, sunDir, accent) {
  const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85, metalness: 0, side: THREE.DoubleSide });
  const uni = { uTime: shared.uTime, uFill: shared.uFill, uPose: { value: uPose }, uSunW: { value: sunDir }, uAccent: { value: new THREE.Color(accent) } };
  const head = /* glsl */`
    attribute vec4 aBone; attribute vec3 aPivot; attribute vec3 aShell; uniform float uTime; uniform vec4 uPose; varying float vTip;
    vec3 gPos; vec3 gNrm;
    vec3 rX(vec3 p, float a){ float c = cos(a), s = sin(a); return vec3(p.x, p.y * c - p.z * s, p.z * c + p.y * s); }
    void animate(){ vec3 p = position, n = normal; vTip = aBone.w;
    ${mode === 'sloth' ? `
      float part = aBone.x;
      if (part > 0.5 && part < 2.5) {
        float fl = aBone.z * (uPose.y * 0.55 + (1. - uPose.x) * 1.1);
        p = aShell + rX(p - aShell, fl); n = rX(n, fl);
        float sh = (1. - uPose.x) * 0.80 + uPose.y * 0.30;
        p = aPivot + rX(p - aPivot, sh); n = rX(n, sh);
      } else if (part > 2.5) {
        float hd = aBone.y * (uPose.z * (0.55 + 0.07 * sin(uTime * 5.2)) - 0.10 * uPose.y + 0.03 * sin(uTime * 0.7));
        p = aPivot + rX(p - aPivot, hd); n = rX(n, hd);
      }
      float lw = smoothstep(1.2, 3.2, position.y), ln = -uPose.w * lw + 0.006 * sin(uTime * 1.1) * lw;
      p = vec3(0., 1.3, -0.3) + rX(p - vec3(0., 1.3, -0.3), ln); n = rX(n, ln);
      p.z -= 0.012 * sin(uTime * 1.1) * (1. - abs(position.y - 2.0) * 0.5) * step(position.y, 3.0);
      p.x += aBone.w * 0.035 * sin(uTime * 1.6 + position.y * 4. + position.z * 3.);
    ` : `
      float w = aBone.y;
      p += vec3(0., -0.80, 0.20) * uPose.x * w * sqrt(w);
      float fx = aBone.z;
      p.x += fx * (0.035 * sin(uTime * 1.2 + position.y * 1.7 + position.z * 0.9) + uPose.y * step(0.01, w) * 0.05 * sin(uTime * 15. + position.x * 5.));
      p.y += fx * 0.02 * sin(uTime * 0.9 + position.x * 1.3);
    `}
      gPos = p; gNrm = n; }`;
  mat.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, uni);
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\n' + head)
      .replace('#include <beginnormal_vertex>', 'animate();\nvec3 objectNormal = gNrm;').replace('#include <begin_vertex>', 'vec3 transformed = gPos;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform vec3 uSunW; uniform vec3 uAccent; uniform vec3 uFill; varying float vTip;')
      .replace('#include <emissivemap_fragment>', /* glsl */`#include <emissivemap_fragment>
        { vec3 vd = normalize(vViewPosition + vec3(0., 0., 1e-6)); vec3 sv = normalize((viewMatrix * vec4(uSunW, 0.)).xyz);
          float back = clamp(dot(-vd, sv), 0., 1.); back *= back;
          float rimF = 1. - abs(dot(normalize(vNormal + vec3(0., 0., 1e-6)), vd)); rimF *= rimF; rimF *= rimF;
          totalEmissiveRadiance += diffuseColor.rgb * uFill * 0.6 + uAccent * back * (rimF * 2.4 + vTip * 0.12); }`);
  };
  mat.customProgramCacheKey = () => 'btw-silhouette-' + mode;
  return mat;
}

// The sloth, its tree and the shower, as one group. Origin at the foot of the trunk; the sloth stands 4.2 m off along
// local -Z, facing the trunk (+Z). o = { shared, sunDir, palette, detail, duration, pullAtU (0.45), timeOfU }.
// setProgress(u) keys the 9 s reach-hook-pull-chew loop so the pull falls at pullAtU; without it the loop runs on time.
export async function buildSlothTree(ctx, o = {}) {
  const rng = ctx.rng, pal = o.palette || DEFAULT_PALETTE, shared = o.shared || makeShared(pal, o.fill), detail = o.detail ?? 1, duration = o.duration ?? 44;
  const sunDir = o.sunDir || new THREE.Vector3(0.75, 0.19, -0.63).normalize(), timeOfU = o.timeOfU || ((u) => u * duration), pullAtU = o.pullAtU ?? 0.45;
  const group = new THREE.Group(); group.name = 'btw-sloth-tree';
  const SZ = -4.2, hook = [0, 4.42, SZ + 1.95];                 // where the claws hook the bough (tree space)
  const poseS = new THREE.Vector4(1, 0, 0, 0), poseT = new THREE.Vector4(0, 0, 0, 0);
  const sloth = new THREE.Mesh(buildMegatheriumGeometry(rng, { color: o.slothColor }), makeSilhouetteMaterial(shared, 'sloth', poseS, sunDir, pal[6]));
  sloth.position.set(0, 0, SZ); sloth.name = 'btw-megatherium';
  await ctx.yield();
  const tree = new THREE.Mesh(await buildAlgarroboGeometry(ctx, rng, hook), makeSilhouetteMaterial(shared, 'tree', poseT, sunDir, pal[6]));
  tree.name = 'btw-algarrobo';
  await ctx.yield();
  // the shower: frost dust (soft) and glints (small, bright) let go of the pulled bough and fall slowly through the light
  const nD = Math.round(260 * detail), nG = Math.round(420 * detail), n = nD + nG;
  const sg = new THREE.InstancedBufferGeometry();
  sg.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3)); sg.setIndex([0, 1, 2, 0, 2, 3]);
  const SA = new Float32Array(n * 4), SB = new Float32Array(n * 4);
  for (let i = 0; i < n; i++) {
    const dust = i < nD, t = Math.pow(rng(), 0.7), a = rng() * TAU, r = Math.sqrt(rng()) * (0.5 + 2.0 * t);
    SA[i * 4] = Math.sin(a) * r; SA[i * 4 + 1] = lerp(3.4, 6.6, t) + (rng() - 0.5); SA[i * 4 + 2] = lerp(-0.6, hook[2] - 1.6, t) + Math.cos(a) * r * 0.8;
    SA[i * 4 + 3] = dust ? 0.35 + 0.5 * rng() : 0.035 + 0.03 * rng();
    SB[i * 4] = rng() * 2.4 * (0.4 + 0.6 * t); SB[i * 4 + 1] = rng(); SB[i * 4 + 2] = dust ? 0 : 1; SB[i * 4 + 3] = dust ? 0.7 + 0.5 * rng() : 1.1 + 0.9 * rng();
  }
  sg.setAttribute('sA', new THREE.InstancedBufferAttribute(SA, 4)); sg.setAttribute('sB', new THREE.InstancedBufferAttribute(SB, 4)); sg.instanceCount = n;
  const shower = new THREE.Mesh(sg, makeShowerMaterial(shared, sunDir, pal)); shower.frustumCulled = false; shower.renderOrder = 5; shower.name = 'btw-frost-shower';
  group.add(tree, sloth, shower);
  let progress = null;
  const api = {
    object: group, sloth, tree, shower, hook: new THREE.Vector3(hook[0], hook[1], hook[2]), slothAt: new THREE.Vector3(0, 0, SZ),
    setProgress(u) { progress = u; },
    update(dt, time) {
      const tt = progress === null ? time : timeOfU(progress) - timeOfU(pullAtU) + 4.5 + 9000;
      const ph = (tt / 9) % 1;
      const pull = smoothstep(0.42, 0.56, ph) * (1 - smoothstep(0.62, 0.74, ph));
      poseS.set(0.45 + 0.55 * smoothstep(0.05, 0.30, ph) - 0.55 * smoothstep(0.66, 0.80, ph), pull, smoothstep(0.68, 0.80, ph) * (1 - smoothstep(0.94, 1, ph)), pull * 0.07);
      const rel = (ph - 0.6) * 9;
      poseT.x = ph < 0.6 ? smoothstep(0.42, 0.56, ph) : Math.exp(-rel * 1.5) * Math.cos(rel * 6.5);
      poseT.y = ph < 0.6 ? smoothstep(0.42, 0.56, ph) * 0.4 : Math.exp(-rel * 0.9);
      shower.material.uniforms.uT.value = ((ph - 0.5 + 1) % 1) * 9;        // seconds since the bough began to shed
    },
  };
  api.update(0, 0);
  return api;
}
function makeShowerMaterial(shared, sunDir, pal) {
  const mat = new THREE.ShaderMaterial({
    uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { uT: { value: 0 }, uSun: { value: sunDir.clone() }, uShade: { value: new THREE.Color('#9FB0CC').multiplyScalar(0.8) },
      uLit: { value: new THREE.Color(pal[4]).multiplyScalar(0.85) }, uAccent: { value: new THREE.Color(pal[6]) } }]),
    vertexShader: /* glsl */`
      attribute vec4 sA; attribute vec4 sB; uniform vec3 uSun; uniform float uTime; uniform float uT;
      varying vec2 vUv; varying vec4 vFx;
      #include <fog_pars_vertex>
      void main(){
        float age = uT - sB.x, life = mix(4.2, 3.4, sB.z);
        float on = step(0., age) * step(age, life);
        vec3 c = sA.xyz; float fall = sB.w * age + 0.25 * age * age * sB.z;
        c.y -= min(fall, max(sA.y - 0.15, 0.)); c.x += 0.22 * age * (sB.y - 0.3) + 0.12 * sin(age * 1.7 + sB.y * 30.); c.z -= 0.18 * age;
        vec4 wc = modelMatrix * vec4(c, 1.);
        float sz = sA.w * mix(1. + 0.5 * age, 1., sB.z) * on * length(modelMatrix[0].xyz);
        vec4 mvPosition = viewMatrix * wc; mvPosition.xy += position.xy * sz;
        gl_Position = projectionMatrix * mvPosition;
        vec3 toS = wc.xyz - cameraPosition; float l = max(length(toS), 1e-3);
        float back = max(dot(toS / l, normalize(uSun)), 0.);
        float fade = smoothstep(0., 0.35, age) * (1. - smoothstep(life * 0.6, life, age)) * smoothstep(0.1, 0.6, c.y);
        float tw = 0.55 + 0.45 * sin(uTime * (1.3 + sB.y * 1.4) + sB.y * 50.);
        vUv = position.xy; vFx = vec4(fade * on, sB.z, back * back, tw);
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uShade; uniform vec3 uLit; uniform vec3 uAccent; varying vec2 vUv; varying vec4 vFx;
      #include <fog_pars_fragment>
      void main(){
        float r = length(vUv); if (r > 1.) discard;
        float soft = 1. - r * r; soft *= soft;
        float a = vFx.x * soft * mix(0.11, 0.9 * vFx.w, vFx.y);
        vec3 col = mix(mix(uShade, uLit, 0.5) + uAccent * vFx.z * 2.2, uLit * 1.2 + uAccent * (0.6 + vFx.z * 3.2), vFx.y);
        gl_FragColor = vec4(col, a);
        #include <fog_fragment>
      }`,
    transparent: true, depthWrite: false, fog: true,
  });
  mat.uniforms.uTime = shared.uTime;
  return mat;
}

// ---------------------------------------------------------------------------------------------------------------
export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng, pal = opts.palette || DEFAULT_PALETTE, detail = opts.detail ?? 1, duration = opts.duration ?? 44;
  const root = new THREE.Group(); root.name = 'boulders-that-walk-hero';
  const sunDir = (opts.sunDir ? opts.sunDir.clone() : new THREE.Vector3(Math.sin(0.873) * Math.cos(0.192), Math.sin(0.192), -Math.cos(0.873) * Math.cos(0.192))).normalize();
  const shared = makeShared(pal, opts.fill);
  const R = 13;

  // --- where they lie: a seeded scatter that leaves the flight corridor (x = 0, heading -Z) open ------------------
  const count = opts.count ?? rng.int(9, 11), nDoed = rng.chance(0.35) ? 2 : 1;
  const NW = -Math.PI * 0.75;                                   // north-west when the camera heads -Z
  const spots = [{ x: 2.9 + rng() * 0.5, z: 5.5 + rng() * 1.5 }];      // the one the owl lands on: ahead-right of the entry
  if (opts.first) { spots[0].x = opts.first.x; spots[0].z = opts.first.z; }   // the world may seat it on its own route (the draws above are kept)
  const firstHeading = (h) => opts.first?.heading ?? h;
  for (let tries = 0; spots.length < count && tries < 4000; tries++) {
    const a = rng() * TAU, r = Math.sqrt(rng()) * (R - 3), x = Math.sin(a) * r * 1.0, z = Math.cos(a) * r * 0.92 - 1;
    if (Math.abs(x) < 2.7) continue;
    if (opts.clear && opts.clear(x, z)) continue;                    // the world's own route through the patch
    if (Math.hypot(x - 9.5, z + 6.6) < 5.2) continue;                 // keep clear of the sloth and its tree
    if (spots.every((q) => Math.hypot(q.x - x, q.z - z) > 4.9)) spots.push({ x, z });
  }
  // wake order: the first is fixed, the rest a seeded shuffle of the brief's beats; one in the patch never wakes
  const beats = rng.shuffle([0.18, 0.183, 0.20, 0.22, 0.222, 0.226, 0.25, 0.272, 0.288, 0.305, 0.32, 0.335].slice(0, spots.length - 1));
  const sleeper = 1 + rng.int(0, spots.length - 2);
  const doed = new Set(); while (doed.size < nDoed) doed.add(2 + rng.int(0, spots.length - 3));
  const slotsG = [], slotsD = [], order = [];
  spots.forEach((q, i) => {
    const slot = { x: q.x, z: q.z, heading: i === 0 ? firstHeading(-2.2 + rng() * 0.5) : rng() * TAU, scale: (i === 0 ? 1.04 : rng.range(0.86, 1.08)), wakeU: i === 0 ? 0.15 : beats[i - 1],
      never: i === sleeper, riseU: i === 0 ? opts.first?.riseU : undefined, walkHeading: NW + rng.range(-0.22, 0.22), walkFromU: opts.walkFromU ?? 0.24, speed: 0.8 * rng.range(0.9, 1.08) };
    if (opts.wakeOf) { const w = opts.wakeOf(q.x, q.z, i, slot.wakeU); if (w !== undefined && w !== null) slot.wakeU = w; }   // the world times each riser to its own route
    if (doed.has(i)) { slot.scale *= 1.07; order.push(['d', slotsD.length]); slotsD.push(slot); } else { order.push(['g', slotsG.length]); slotsG.push(slot); }
  });
  await ctx.yield();
  const yf = () => ctx.yield();
  const geoG = await buildGlyptodontGeometryAsync(rng, { kind: 'glyptodon', palette: pal }, yf);
  await ctx.yield();
  const geoD = await buildGlyptodontGeometryAsync(rng, { kind: 'doedicurus', palette: pal }, yf);
  await ctx.yield();
  const herdG = makeGlyptodonts(ctx, { kind: 'glyptodon', slots: slotsG, palette: pal, shared, duration, timeOfU: opts.timeOfU, geometry: geoG });
  const herdD = makeGlyptodonts(ctx, { kind: 'doedicurus', slots: slotsD, palette: pal, shared, duration, timeOfU: opts.timeOfU, geometry: geoD });
  root.add(herdG.mesh, herdD.mesh);
  const animals = order.map(([k, i]) => ({ herd: k === 'g' ? herdG : herdD, i, s: (k === 'g' ? herdG : herdD).state(i), kind: k }));
  await ctx.yield();

  const shadows = opts.shadows === false ? null : makeShadows(animals.length + 2, sunDir);
  if (shadows) root.add(shadows.mesh);
  if (opts.groundPatch !== false) {
    root.add(makeGroundPatch(ctx.noise, 170, pal));
    await ctx.yield();
    root.add(makeTufts(rng, shared, Math.round(3200 * detail), 46, pal, (x, z) => spots.some((q) => Math.hypot(q.x - x, q.z - z) < 1.7) || Math.hypot(x - 9.5, z + 10.5) < 0.9));
  }
  await ctx.yield();
  const fx = makeFrostFx(ctx, { animals, detail, pal, sunDir, shared });
  root.add(fx.mesh);

  // the second surprise, at the sunward edge of the patch: the sloth on our side of its tree, facing away
  await ctx.yield();
  const st = opts.sloth === false ? null : await buildSlothTree(ctx, { shared, sunDir, palette: pal, detail, duration, timeOfU: opts.timeOfU, pullAtU: opts.pullAtU });
  const treeAt = new THREE.Vector3(9.5, 0, -10.5);
  if (st) { st.object.position.copy(treeAt); st.object.rotation.y = Math.PI; root.add(st.object); }
  let progress = null;
  const hero = {
    object: root, radius: st ? 10 : R, height: st ? 8 : 1.6, center: new THREE.Vector3(st ? 2.5 : 0, st ? 1.5 : 0.8, st ? -2.5 : 0), ground: opts.groundPatch === false, groundY: 0,
    slothTree: st,
    herds: [herdG, herdD], animals,
    setProgress(u) { progress = u; },
    update(dt, time, camera) {
      // until the world sets a progress value, play the rise on a loop so the piece can be judged alone
      const u = progress ?? 0.125 + ((time + 14) % 20) / 44;
      herdG.setProgress(u); herdD.setProgress(u);
      herdG.update(dt, time); herdD.update(dt, time);
      if (shadows) {
        for (let i = 0; i < animals.length; i++) { const s = animals[i].s, e = smoothstep(0.05, 0.9, s.rise); shadows.set(i, s.x, s.z, (1.12 + 0.36 * e) * s.scale, (0.95 - 0.1 * e) * s.scale); }
        if (st) { shadows.set(animals.length, treeAt.x, treeAt.z + 4.2, 3.6, 1.25); shadows.set(animals.length + 1, treeAt.x, treeAt.z, 6.2, 2.6); }
        shadows.commit();
      }
      fx.update(dt, time, camera);
      if (st) { if (progress !== null) st.setProgress(progress); st.update(dt, time); }
    },
    dispose() {},
  };
  hero.anchors = makeAnchors(animals, R, NW);
  hero.anchors.sunDir = sunDir.clone();
  if (st) {
    // the tree's foot, where the sloth stands (on our side of it, facing away along -Z), the bough it hooks, and the place
    // to pass: 8 m to the side away from the sun, so the pair stands against the light
    hero.anchors.tree = treeAt.clone(); hero.anchors.sloth = new THREE.Vector3(treeAt.x, 0, treeAt.z + 4.2);
    hero.anchors.slothHook = new THREE.Vector3(treeAt.x, 4.42, treeAt.z + 2.25);
    hero.anchors.viewpoints.sloth = { position: new THREE.Vector3(treeAt.x - 8, 2.4, treeAt.z + 9), lookAt: new THREE.Vector3(treeAt.x, 3.2, treeAt.z + 2.5) };
  }
  hero.update(0, 0, null);
  return hero;
}

// ---------------------------------------------------------------------------------------------------------------
// Frost smoke: soft sprites pooled per animal (14 each at detail 1), born as the frost lets go of the dome, falling
// down the flank, billowing out and drifting up-wind-ward; shaded blue-white, burning orange only against the sun.
export function makeFrostFx(ctx, { animals, detail, pal, sunDir, shared }) {
  const rng = ctx.rng, per = Math.max(6, Math.round(14 * detail)), n = animals.length * per;
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3)); g.setIndex([0, 1, 2, 0, 2, 3]);
  const SA = new Float32Array(n * 4), SB = new Float32Array(n * 4);
  const aSA = new THREE.InstancedBufferAttribute(SA, 4).setUsage(THREE.DynamicDrawUsage), aSB = new THREE.InstancedBufferAttribute(SB, 4).setUsage(THREE.DynamicDrawUsage);
  g.setAttribute('sA', aSA); g.setAttribute('sB', aSB); g.instanceCount = n;
  const P = [];
  for (let i = 0; i < n; i++) {
    const a = rng() * TAU;
    P.push({ a, r: 0.45 + 0.35 * rng(), y: 0.55 + 0.75 * rng(), birth: 0.03 + 0.9 * Math.pow(rng(), 1.25), life: 1.5 + 1.3 * rng(), size: 0.36 + 0.34 * rng(), out: 0.5 + 0.9 * rng(), upv: 0.5 + 1.1 * rng() });
    SB[i * 4 + 1] = rng();
  }
  const wind = new THREE.Vector3(-0.9, 0, -0.35);
  const mat = new THREE.ShaderMaterial({
    uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { uSun: { value: sunDir.clone() }, uShade: { value: new THREE.Color(pal[1]).multiplyScalar(0.8) },
      uLit: { value: new THREE.Color(pal[4]).multiplyScalar(0.85) }, uAccent: { value: new THREE.Color(pal[6]) } }]),
    vertexShader: /* glsl */`
      attribute vec4 sA; attribute vec4 sB; uniform vec3 uSun; uniform float uTime;
      varying vec2 vUv; varying vec3 vFx; varying float vY;
      #include <fog_pars_vertex>
      void main(){
        vec4 wc = modelMatrix * vec4(sA.xyz, 1.);
        float rot = sB.y * 6.2831853 + uTime * 0.25 * (sB.y - 0.5);
        float c = cos(rot), s = sin(rot);
        vec2 q = vec2(position.x * c - position.y * s, position.x * s + position.y * c) * sA.w * length(modelMatrix[0].xyz);
        vec4 mvPosition = viewMatrix * wc; mvPosition.xy += q;
        gl_Position = projectionMatrix * mvPosition;
        vec3 toS = wc.xyz - cameraPosition; float l = max(length(toS), 1e-3);
        float back = max(dot(toS / l, normalize(uSun)), 0.);
        vUv = position.xy; vFx = vec3(sB.x, sB.y, back * back * back); vY = wc.y + q.y;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uShade; uniform vec3 uLit; uniform vec3 uAccent; uniform float uTime;
      varying vec2 vUv; varying vec3 vFx; varying float vY;
      #include <fog_pars_fragment>
      float h21(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
      float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
        return mix(mix(h21(i), h21(i + vec2(1., 0.)), f.x), mix(h21(i + vec2(0., 1.)), h21(i + vec2(1., 1.)), f.x), f.y); }
      void main(){
        float r = length(vUv); if (r > 1.) discard;
        float soft = (1. - r * r); soft *= soft;
        vec2 p = vUv * 2.2 + vFx.y * 37. + vec2(0., -uTime * 0.07);
        float nz = 0.6 * vn(p) + 0.4 * vn(p * 2.3 + 5.);
        float a = vFx.x * soft * smoothstep(0.30, 0.74, nz) * smoothstep(-0.05, 0.3, vY);
        vec3 col = mix(uShade, uLit, 0.35 + 0.4 * nz) + uAccent * vFx.z * 1.5 * (0.5 + 0.5 * soft);
        gl_FragColor = vec4(col, min(a, 0.3));
        #include <fog_fragment>
      }`,
    transparent: true, depthWrite: false, fog: true,
  });
  mat.uniforms.uTime = shared.uTime;
  const mesh = new THREE.Mesh(g, mat); mesh.frustumCulled = false; mesh.renderOrder = 4; mesh.name = 'btw-frost-smoke';
  return {
    mesh,
    update() {
      for (let i = 0; i < n; i++) {
        const s = animals[(i / per) | 0].s, p = P[i], age = (s.riseT - p.birth) / p.life;
        if (!(age > 0 && age < 1) || s.awake || s.never) { SA[i * 4 + 3] = 0; SB[i * 4] = 0; continue; }
        const sc = s.scale, a = p.a + s.h0, ox = Math.sin(a), oz = Math.cos(a), e = 1 - (1 - age) * (1 - age);
        SA[i * 4] = s.x0 + ox * (p.r + p.out * e) * sc + wind.x * (0.5 + 2.3 * age + 1.2 * age * age);
        SA[i * 4 + 1] = Math.max(0.25, (p.y - 0.9 * e + p.upv * age * age * 1.7) * sc);
        SA[i * 4 + 2] = s.z0 + oz * (p.r + p.out * e) * sc + wind.z * (0.5 + 2.3 * age + 1.2 * age * age);
        SA[i * 4 + 3] = p.size * (0.6 + 1.25 * e) * sc;
        SB[i * 4] = 0.42 * smoothstep(0, 0.07, age) * Math.pow(1 - age, 1.2);
      }
      aSA.needsUpdate = true; aSB.needsUpdate = true;
    },
  };
}

function makeAnchors(animals, R, NW) {
  const first = animals[0].s;
  return {
    // the dome the owl lands on (asleep it is 1.15 m high; standing 1.5 m), ahead-right of the entry, woken at u 0.15
    firstRiser: new THREE.Vector3(first.x0, 0, first.z0), owlLanding: new THREE.Vector3(first.x0, 1.25 * first.scale, first.z0 - 0.1),
    // a safe camera line through the open corridor, heading -Z: no dome centre lies within 2.7 m of x = 0, so the shells
    // pass about 2 m either side (the brief wants close passes; there is not 6 m of clearance and there should not be)
    flyThrough: [new THREE.Vector3(0, 2.2, R + 8), new THREE.Vector3(0, 2.2, 10), new THREE.Vector3(0.2, 2.0, 3), new THREE.Vector3(-0.2, 2.0, -5), new THREE.Vector3(0, 2.1, -R - 6)],
    // viewpoints: entry (looking -Z), the first rise from 3 m, and a three-quarter view of the whole patch with the sun behind it
    viewpoints: {
      entry: { position: new THREE.Vector3(0, 2.2, R + 4), lookAt: new THREE.Vector3(1, 0.8, 0) },
      firstRise: { position: new THREE.Vector3(first.x0 - 2.6, 1.8, first.z0 + 2.4), lookAt: new THREE.Vector3(first.x0, 0.8, first.z0) },
      againstSun: { position: new THREE.Vector3(-13, 2.4, 12), lookAt: new THREE.Vector3(2, 0.8, -2) },
    },
    // the brief seats the 14 m portal 400 m on, across the lagoon; if a world wants it at the patch, this is where the
    // corridor leaves it (facing back along the path)
    portalSeat: { position: new THREE.Vector3(0, 7.5, -R - 30), facing: new THREE.Vector3(0, 0, 1) },
    walkHeading: NW, walkDir: new THREE.Vector3(Math.sin(NW), 0, Math.cos(NW)),
    // every animal: where it lies, when it wakes, what it is
    wake: animals.map((a) => ({ x: a.s.x0, z: a.s.z0, wakeU: a.s.never ? null : a.s.wakeU, never: a.s.never, kind: a.kind === 'd' ? 'doedicurus' : 'glyptodon', scale: a.s.scale })),
  };
}
