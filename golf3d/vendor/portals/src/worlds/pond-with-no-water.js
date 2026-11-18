// pond-with-no-water: THE POND THAT IS ONLY PAPER, after Bada Shanren (1626 to 1705).
// A lotus pond with the water left out: black leaves on stalks far too long, a rock on a foot too small, a fish
// hanging in blank paper with its eye rolled up, a bird asleep on one leg, one red seal. No ground, sky, light or fog:
// everything is ink on one sheet, shaded with the style routines of ../parts/pond-with-no-water.js (post.flat, exact pigments).
// The flight is a run of album leaves, one large subject each with the void beside it: leaf one and the minnows, the rock,
// the drop over two wet leaves, the black leaf overhead, the fish, two birds on a small rock, the lotus in outline, the
// minnows under the rock, a second fish, the leaf cut by the top edge, the shoulder, the bird and the seal.
// The brush (shared uniforms and material factories) is made per build by the hero (hero.ink): no module state.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { makePath } from '../kit/core.js';
import {
  buildHero, PALETTE, STYLE_GLSL, STYLE_FRAG_GLSL, WORLD_OFFSET, strokeGeometry, dabGeometry, makeEye, leafGeometry,
  makeFish, makeBird, makeBoulder,
} from '../parts/pond-with-no-water.js';

const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
const sstep = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const lerp = (a, b, t) => a + (b - a) * t;

// stalks and leaves sway from the foot: aAnim = (phase, amplitude in metres at this vertex, flap)
const SWAY_DEFORM = /* glsl */`
vec3 deform(vec3 p, vec3 a){
  float t = uTime * 0.698 + a.x;                                   // nine seconds a sway
  p.x += a.y * sin(t); p.z += a.y * 0.6 * sin(t * 0.83 + 1.7);
  p.y += a.z * sin(uTime * 1.9 + a.x * 3.0);                       // torn leaves flap at the neck
  return p;
}`;

export default {
  id: 'pond-with-no-water',
  name: 'The Pond That Is Only Paper',
  category: 'artists',
  placeKind: 'bizarre',
  after: 'Bada Shanren, 1626 to 1705',
  weirdness: 0.6,
  media: ['air'],

  async build(ctx) {
    const scene = new THREE.Scene();
    const detail = Math.max(0.6, Math.min(1, ctx.quality?.detail ?? 1));
    const rare = !!ctx.vary?.rare;

    // ---- the hero first (it draws the variant from ctx.rng: brush, fish, rock, bird)
    const hero = await buildHero(ctx, { palette: PALETTE, detail, dome: false });
    hero.object.position.set(...WORLD_OFFSET);
    scene.add(hero.object);
    await ctx.yield();
    const ink = hero.ink, { STYLE, makePaperDome, shellMaterial, lineMaterial, dabMaterial, leafMaterial } = ink;   // this build's own brush: nothing shared between two instances
    const variant = hero.anchors.variant, dry = variant.brush === 'dry', soaked = variant.brush === 'soaked';
    const rng = ctx.rng.fork('pond');
    const O = (a) => V3(a[0] + WORLD_OFFSET[0], a[1] + WORLD_OFFSET[1], a[2] + WORLD_OFFSET[2]);

    const dome = makePaperDome(3000);
    scene.add(dome);

    // ---- the course (+Z): level under leaf one, over the lip, the drop, the fish, round the stem and up, the seal
    const yE = hero.anchors.horn[1] + 8.5;                         // the last leg runs level with the bird's chest, 9 m to starboard of the horn
    const path = makePath([
      [0, 150, 0], [0, 150, 32], [0.5, 150, 64], [1.5, 149.5, 88], [2, 146, 104], [1.2, 118, 134], [0, 80, 172],
      [4, 61, 202], [25, 54, 226], [23, 56.5, 250], [8, 60.5, 266], [-7, 63.5, 277], [-8.5, 64.5, 289],   // a swing to the east before the fish: we come at it broadside
       [6, 66, 338], [34, 70, 366], [66, 82, 358], [78, 98, 330],
      [71, 113, 279], [38, 130, 242], [-34, 172, 238], [-66, 199, 266], [-58, yE - 17, 300], [-36, yE - 4, 326], [-19, yE, 344], [-10.5, yE, 362], [-10.5, yE, 388], [-10.5, yE, 412],
    ]);
    const NS = 600, samples = [];
    for (let i = 0; i <= NS; i++) samples.push(path.pointAt(i / NS));
    const uNear = (p) => { let b = 1e9, bi = 0; for (let i = 0; i <= NS; i++) { const d = samples[i].distanceToSquared(p); if (d < b) { b = d; bi = i; } } return { u: bi / NS, dist: Math.sqrt(b) }; };
    const uWithin = (p, r) => { for (let i = 0; i <= NS; i++) if (samples[i].distanceTo(p) < r) return i / NS; return 2; };

    const pace = (u) => {
      let p = 0.75;
      p = lerp(p, 1.5, sstep(0.09, 0.15, u));
      p = lerp(p, 0.55, sstep(0.22, 0.30, u));
      p = lerp(p, 1.3, sstep(0.40, 0.455, u));
      p = lerp(p, 0.8, sstep(0.74, 0.80, u));
      return lerp(p, 0.9, sstep(0.88, 0.92, u));
    };
    {                                                                         // the bird is met SIDE-ON at the exit picture (u 0.93), facing the way we go, a little turned to us
      const pc = path.pointAt(0.93), hn = O(hero.anchors.horn), tg = path.tangentAt(0.93);
      let dx = hn.x - pc.x, dz = hn.z - pc.z; const dl = Math.hypot(dx, dz) || 1; dx /= dl; dz /= dl;
      let fx = -dz, fz = dx; if (fz < 0) { fx = -fx; fz = -fz; }                   // head toward the seal, tail toward where we came from
      fx -= dx * 0.22; fz -= dz * 0.22;
      hero.parts.bird.rotation.y = Math.atan2(-fz, fx);
      scene.userData.pww = { horn: hn.toArray(), eye: O(hero.anchors.fishEyeNW).toArray() };
    }
    await ctx.yield();

    // ---- THE LEAVES AND THEIR STALKS: thirty sweeps of soaked ink on stalks far too long, in three clumps
    const lr = rng.fork('leaves');
    const rockAxis = V3(22, 0, 336);
    const spec = [];                                              // { c, w, torn, fold, kink, start (u the bleed begins), special }
    const clearOfPath = (c, R) => {                                // nothing within about 7 m of the course (a leaf is a shallow bowl)
      for (let i = 0; i <= NS; i += 2) { const s = samples[i], h = Math.hypot(s.x - c.x, s.z - c.z), v = s.y - c.y; if (h < R * 1.15 + 7 && v > -1.5 * R - 8 && v < 0.3 * R + 8) return false; }
      return true;
    };
    const clearOfRock = (c, R) => { const h = Math.hypot(c.x - rockAxis.x, c.z - rockAxis.z); return c.y > 236 ? true : h > 78 + R * 0.7; };
    const clearOfLeaves = (c, R) => spec.every((s) => Math.hypot(s.c.x - c.x, s.c.z - c.z) > (s.w / 2 + R) * 0.55 || Math.abs(s.c.y - c.y) > 14);
    const put = (x, y, z, w, o = {}) => spec.push({ c: V3(x, y, z), w, torn: !!o.torn, fold: !!o.fold, kink: !!o.kink, start: o.start, special: true, head: o.head, tilt: o.tilt, lead: o.lead, lean: o.lean, face: o.face, droop: o.droop });
    // the ones the journey names (placed by hand)
    put(21, 171, 48, 58, { start: -0.07, tilt: [-0.2, 0.0], lean: Math.atan2(-0.8, 0.6), droop: 0.62 });                // leaf one: mid-bleed in the first frame, rim 8 m overhead
    put(31, 126, 62, 38, { start: -1, kink: true, face: 0.0, droop: 0.3, lean: 0.5 });                           // the leaf below, seen from above
    put(22, 181, 88, 26, { start: 0.02, head: 0 });                          // the two stalks we pass between, still being drawn
    put(-20, 186, 90, 30, { start: 0.05, head: 1, torn: true });
    put(-27, 140, 122, 28, { start: 0.075, kink: true, fold: true });
    put(-28, 171, 112, 40, { start: 0.02, lean: -1.04, droop: 0.4 });                  // one more hangs in from the top to starboard of the two stalks, bleeding as we pass under it          // the kinked stalk beside the drop
    put(54, 153, 220, 36, { lead: 0.13 }); put(-50, 197, 226, 46, { torn: true, lead: 0.14 });   // the two we brush beneath on the climb
    put(64, 88, 392, 34, { start: 0.37, torn: true }); put(132, 112, 356, 54, { start: 0.455, face: 0.52, droop: 0.3 }); put(102, 114, 313, 50, { start: 0.47, face: 0.52, droop: 0.34, lean: 5.2 });   // far to the east, a pale blot: the lotus in outline (u 0.52) keeps bare paper behind it   // two young low leaves north and east of the stem
    put(-8, 178, 204, 30, { lead: 0.1, torn: true }); put(-94, 214, 285, 72, { start: 0.70, lean: 2.6, face: 0.785, droop: 0.34 }); put(-112, 204, 256, 62, { start: 0.725, lean: 0.9, face: 0.79, droop: 0.26, torn: true }); put(-84, 209, 305, 50, { start: 0.757, lean: 3.3, face: 0.80, droop: 0.2 });
    put(-50, yE + 18, 368, 46, { lead: 0.14 }); put(28, yE + 40, 392, 64, { start: 0.845, lean: Math.PI, tilt: [0.45, 0.0], droop: 0.3 }); put(8, yE + 22, 338, 54, { start: 0.815, lean: 3.6, droop: 0.3, face: 0.87 });   // the hood of the exit; and one over the shoulder, its stalk gone behind the rock   // over the shoulder; the one the exit crops
    put(48, 96, 160, 36, { lead: 0.1 }); put(-36, 78, 172, 56, { start: 0.105, lean: Math.PI, face: 0.155, droop: 0.12 }); put(36, 38, 150, 56, { start: 0.06, lean: 0.3, face: 0.15, droop: 0.12, torn: true });   // two low ones in the drop, seen from above: the west one fills the left of the fall
    put(-16, 77, 247, 46, { start: 0.2, lean: 2.3, face: 0.24, droop: 0.3 });                          // the black leaf overhead as we level out toward the fish, mid-bleed
    const nHand = spec.length;
    const clumps = [
      { n: 3, c: [0, 0, 60], rx: 80, rz: 70, y0: 140, y1: 190, near: 62 },      // round the entry (eight with the five above)
      { n: 9, c: [22, 0, 336], rx: 150, rz: 150, y0: 140, y1: 190, near: 118 },  // round the rock (fourteen with the hand-placed)
      { n: 4, c: [-10, 0, 515], rx: 140, rz: 50, y0: 160, y1: 235, near: 300 },  // beyond it (eight)
    ];
    for (const cl of clumps) {
      let made = 0, tries = 0;
      const want = Math.round(cl.n * Math.max(0.8, Math.min(1.2, ctx.vary?.density ?? 1)));
      while (made < want && tries++ < 400) {
        if (tries % 12 === 0) await ctx.yield();
        const a = lr() * 6.283, rr = Math.sqrt(0.15 + 0.85 * lr()), w = Math.min(60, lr.range(30, 50) * (lr.chance(0.25) ? 1.25 : 1));
        const c = V3(cl.c[0] + Math.cos(a) * rr * cl.rx, lr.range(cl.y0, cl.y1), cl.c[2] + Math.sin(a) * rr * cl.rz), R = w / 2;
        if (!clearOfPath(c, R) || !clearOfRock(c, R) || !clearOfLeaves(c, R) || uNear(c).dist > cl.near) continue;
        if (c.z < 30 && Math.abs(c.x) < 30) continue;                           // keep the entry axis open
        if (c.z > 20 && c.z < 325 && c.x / c.z > -0.09 && c.x / c.z < 0.31) continue;   // and the sight line from the entry to the rock's stem and foot
        spec.push({ c, w, torn: lr.chance(dry ? 0.6 : 0.22), fold: lr.chance(0.14), kink: lr.chance(dry ? 0.5 : 0.25), special: false });
        made++;
      }
    }
    // the far ranks: lotus beyond reach, pale dry blots on pale stalks that never load (the far plane of every picture)
    const nNear = spec.length, fr0 = rng.fork('far'), nFar = Math.round(22 * (0.7 + 0.3 * detail));
    for (let k = 0, tries = 0; k < nFar && tries < 1500; tries++) {
      if (tries % 20 === 0) await ctx.yield();
      const uu = fr0(), pc = samples[Math.round(uu * NS)], a = fr0() * 6.283, d = 135 + 250 * fr0() * fr0(), w = 38 + 62 * fr0() * fr0();
      const c = V3(pc.x + Math.cos(a) * d, pc.y + (fr0() - 0.42) * 150, pc.z + Math.sin(a) * d * 1.0), nr = uNear(c);
      const hr = Math.hypot(c.x - rockAxis.x, c.z - rockAxis.z);
      if (nr.dist < 125 || nr.dist > 330 || c.y < -20 || (hr < 105 && c.y > 110 && c.y < 240) || hr < 30) continue;
      if (c.z > 20 && c.z < 325 && c.x / c.z > -0.09 && c.x / c.z < 0.31) continue;
      if (!spec.every((s) => s.c.distanceTo(c) > (s.w + w) * 0.62)) continue;
      spec.push({ c, w, far: true, torn: fr0() < 0.3, fold: fr0() < 0.22, kink: fr0() < 0.6, special: true, start: 5, face: fr0() < 0.45 ? nr.u : undefined, droop: 0.12 + 0.6 * fr0() * fr0(), rad: 0.7 + 0.9 * fr0(), drift: [(fr0() - 0.5) * 150, (fr0() - 0.5) * 150] });
      k++;
    }
    await ctx.yield();
    const farStalkGeos = [], farLeafGeos = [];
    const leafMat = leafMaterial(spec.length + 2, { deform: SWAY_DEFORM, darkest: true });
    const leafState = leafMat.uniforms.uLeaf.value;
    for (let i = nNear; i < spec.length; i++) leafState[i].set(-0.4, 0);        // the far ranks never load: no heart, one pale tone
    const stalkMat = lineMaterial({ load: 0.74, dryLen: 70, deform: SWAY_DEFORM, uniforms: { uFloor: { value: 1.7 } } });
    const headMats = [0, 1].map(() => lineMaterial({ load: 0.8, dryLen: 70, deform: SWAY_DEFORM, uniforms: { uHead: { value: 0.06 }, uFloor: { value: 1.7 } } }));
    const thornMat = dabMaterial(1.3, { deform: SWAY_DEFORM });
    const leafGeos = [], stalkGeos = [], headGeos = [null, null], thornGeos = [];
    const m4 = new THREE.Matrix4(), q4 = new THREE.Quaternion(), e4 = new THREE.Euler(), one = V3(1, 1, 1);
    const constAnim = (g, a, b, c) => { const n = g.attributes.position.count, arr = new Float32Array(n * 3); for (let i = 0; i < n; i++) { arr[i * 3] = a; arr[i * 3 + 1] = b; arr[i * 3 + 2] = c; } g.setAttribute('aAnim', new THREE.BufferAttribute(arr, 3)); return g; };
    // one stalk: from the neck down and out of sight; a blunt line 0.8 m wide that wobbles, with one sharp elbow in four
    const makeStalk = (top, r, o) => {
      const pts = [], foot = o.foot ?? (r() < 0.25 ? -250 : -20 - r() * 110), len = top.y - foot, ph = r() * 6.28, ph2 = r() * 6.28, wob = 1.5 + r() * 2.5;
      const kh = 12 + r() * 18, ka = r() * 6.28, kx = Math.cos(ka), kz = Math.sin(ka), slope = o.kink ? 0.4 + r() * 0.4 : 0;
      const dm = 9 + 24 * ((ph * 1.7) % 1), drift = o.drift ?? [Math.cos(ph * 3.1) * dm, Math.sin(ph * 3.1) * dm], sw = o.swell ?? 0.3;   // the whole line leans off as it falls
      for (let d = 0; d <= len; d += 4) {
        const f = d / len, w = wob * Math.sin(f * 9 + ph) * Math.min(1, d / 30) + 0.5 * Math.sin(f * 14 + ph2) * Math.min(1, d / 30);
        const k = slope * Math.min(d, kh);                                      // the neck leans off, then the elbow, then straight down
        const lx = drift[0] * f * f * (len / 200), lz = drift[1] * f * f * (len / 200);
        pts.push(V3(top.x + kx * k + w + lx, top.y - d, top.z + kz * k + w * 0.6 + lz));
        if (o.kink && d < kh && d + 4 >= kh) pts.push(V3(top.x + kx * slope * kh + w, top.y - kh, top.z + kz * slope * kh + w * 0.6));   // the elbow itself, too sharp
      }
      const amp = o.amp ?? 3;
      let clear = 1e9;
      for (const p of pts) if (p.y > 30) { const d = path.distanceTo(p.x, p.y, p.z); if (d < clear) clear = d; }
      if (clear < 7.5 && (o.tries ?? 0) < 8) return makeStalk(top, r, { ...o, kink: o.kink && (o.tries ?? 0) < 4, tries: (o.tries ?? 0) + 1 });
      const g = strokeGeometry(o.rev ? pts.slice().reverse() : pts, o.radius ?? 0.6, { raw: true, seed: r() * 9, radial: 5, width: (f) => 0.9 + sw * Math.sin(f * 31 + ph) * Math.sin(f * 7 + ph2) + sw * 0.5 * Math.sin(f * 11 + ph2), anim: (p, s) => [o.phase, amp * Math.pow(o.rev ? s : 1 - s, 1.6), 0] });   // rev: drawn from the foot up, so the pooled start is out of sight and the line runs dry into its leaf
      return { g, pts };
    };
    for (let i = 0; i < spec.length; i++) {
      const s = spec[i], r = lr.fork('leaf' + i), R = s.w / 2, phase = r() * 6.28;
      const near = uNear(s.c), pc = path.pointAt(near.u), dy = pc.y - s.c.y;
      // tilt: a leaf level with the eye is turned to show its face, so none is ever edge-on as a line
      let tx = (r() - 0.5) * 0.5, tz = (r() - 0.5) * 0.5;
      if (Math.abs(dy) < 22 && !s.tilt) { const hx = pc.x - s.c.x, hz = pc.z - s.c.z, hl = Math.hypot(hx, hz) || 1, t = (dy >= 0 ? 0.2 : -0.2) * (1 - Math.abs(dy) / 30); tx += (hz / hl) * t; tz += -(hx / hl) * t; }
      if (s.fold) { const a = r() * 6.28; tx = Math.cos(a) * 1.05; tz = Math.sin(a) * 1.05; }
      if (s.tilt) { tx = s.tilt[0]; tz = s.tilt[1]; }
      if (s.lean === undefined && near.dist < 70) s.lean = Math.atan2(s.c.z - pc.z, s.c.x - pc.x) + (r() < 0.5 ? 1 : -1) * (1.25 + 0.5 * r());   // near the course: seen in profile, hanging to one side of its neck, never over the camera
      const g = leafGeometry(r, { width: s.w, id: i, sweeps: s.far ? 3 + Math.floor(r() * 2) : 5 + Math.floor(r() * 5), droop: s.droop ?? (s.fold ? 0.5 : 0.16 + r() * 0.12), torn: s.torn, lean: s.lean, plain: !!s.far });
      await ctx.yield();
      const n = g.attributes.position.count, an = new Float32Array(n * 3), uvA = g.attributes.uv;
      for (let k = 0; k < n; k++) { const f = uvA.getY(k); an[k * 3] = phase; an[k * 3 + 1] = 3; an[k * 3 + 2] = (s.torn || s.fold ? 1.6 : 0.5) * f * f; }
      g.setAttribute('aAnim', new THREE.BufferAttribute(an, 3));
      const yaw = r() * 6.28;
      q4.setFromEuler(e4.set(tx, s.lean !== undefined ? 0 : yaw, tz, 'YXZ'));
      if (s.face !== undefined) {                                   // turned to show its whole wet face to us at one moment of the flight
        const to = path.pointAt(s.face).sub(s.c).normalize(), up = V3(0, to.y >= 0 ? 1 : -1, 0);
        q4.setFromUnitVectors(up, up.clone().lerp(to, 0.62).normalize());
      }
      g.applyMatrix4(m4.compose(s.c, q4, one));
      (s.far ? farLeafGeos : leafGeos).push(g);
      await ctx.yield();
      const st = makeStalk(s.c, r, { kink: s.kink || s.fold, phase, radius: s.far ? s.rad : undefined, rev: !!s.far, drift: s.drift, swell: s.far ? 0.6 : 0.3 });
      if (s.far) { farStalkGeos.push(st.g); s.dryAt = 5; s.full = 1; await ctx.yield(); continue; }
      if (s.head !== undefined) headGeos[s.head] = st.g; else stalkGeos.push(st.g);
      await ctx.yield();
      const nt = Math.round((2 + Math.floor(r() * 3)) * detail);                // a few thorn dots
      for (let t = 0; t < nt; t++) {
        const p = st.pts[2 + Math.floor(r() * Math.min(40, st.pts.length - 3))], a = r() * 6.28, d = dabGeometry(r, 0.5 + r() * 0.35, 9, 0.2);
        d.applyMatrix4(m4.compose(V3(p.x + Math.cos(a) * 0.75, p.y, p.z + Math.sin(a) * 0.75), q4.setFromEuler(e4.set(0, Math.PI + (r() - 0.5), 0)), one));
        thornGeos.push(constAnim(d, phase, 3 * Math.pow(Math.max(0, 1 - (s.c.y - p.y) / 420), 1.6), 0));
      }
      // when this leaf wells up and runs to its tide line (once, keyed to u), and when it has dried
      const within = uWithin(s.c, 120);
      s.start = s.start ?? (i < nHand || within > 1 ? Math.max(within, near.u - (s.lead ?? 0.085)) : Math.max(within, near.u - 0.07 - 0.05 * r()));
      if (!s.special && s.c.z < 150) s.start = r() < 0.5 ? -1 : 0.03 + 0.08 * r();   // round the entry: some already wet, some bleeding as we come
      s.dryAt = near.u + 0.07; s.full = (soaked ? 1.32 : 1) * (dry && r() < 0.8 && i !== 0 ? 0.55 : 1);
      await ctx.yield();
    }
    let RARE_LEAF_GEO = null;
    const tip = path.pointAt(0.25).add(V3(-12, 10, 0));            // the bare stalk tip the rare bead strikes
    if (rare) {                                                    // the bare stalk the bead will strike, and the leaf folded inside it
      const r = lr.fork('rare'), id = spec.length;
      RARE_LEAF_GEO = leafGeometry(r, { width: 24, id, sweeps: 7, droop: 0.3 });
      constAnim(RARE_LEAF_GEO, 1.0, 3, 0);
      stalkGeos.push(makeStalk(tip, r, { phase: 1.0 }).g);
      spec.push({ c: tip.clone(), w: 24, start: 0.2, dryAt: 0.33, full: soaked ? 1.32 : 1, rareLeaf: true });
    }
    await ctx.yield();
    const leaves = new THREE.Mesh(mergeGeometries(leafGeos), leafMat); leaves.renderOrder = 6; leaves.frustumCulled = false;
    await ctx.yield();
    const stalks = new THREE.Mesh(mergeGeometries(stalkGeos), stalkMat); stalks.frustumCulled = false;
    await ctx.yield();
    const thorns = new THREE.Mesh(mergeGeometries(thornGeos), thornMat); thorns.frustumCulled = false;
    scene.add(leaves, stalks, thorns);
    if (farLeafGeos.length) { const fl = new THREE.Mesh(mergeGeometries(farLeafGeos), leafMat); fl.renderOrder = 5; fl.frustumCulled = false; scene.add(fl); }
    await ctx.yield();
    if (farStalkGeos.length) { const fm = new THREE.Mesh(mergeGeometries(farStalkGeos), lineMaterial({ load: 0.2, dryLen: 50, deform: SWAY_DEFORM, uniforms: { uFloor: { value: 1.7 } } })); fm.frustumCulled = false; scene.add(fm); }
    await ctx.yield();
    for (let k = 0; k < 2; k++) { const m = new THREE.Mesh(headGeos[k], headMats[k]); m.frustumCulled = false; scene.add(m); }
    await ctx.yield();
    // ---- FLOWERS AND SEED PODS: thin pale outline only, paper inside (dry brush: pods for flowers)
    const fr = rng.fork('flowers'), paleGeos = [], paleMat = lineMaterial({ load: 0.17, dryLen: 5, deform: SWAY_DEFORM });
    const fus = [0.045, 0.3, 0.5, 0.57, 0.69, 0.8, 0.9];
    const petalGeos = [];
    const bigAt = { 2: [105, 88, 341] }, bigGeos = [], bigMat = lineMaterial({ load: 0.64, dryLen: 9, deform: SWAY_DEFORM });
    for (let i = 0; i < 7; i++) {
      const r = fr.fork('f' + i), pod = dry || i >= 3, phase = r() * 6.28;
      const big = bigAt[i], K = big ? 2.0 : 1, into = big ? bigGeos : paleGeos;
      let c = big ? V3(...big) : null;
      for (let t = 0; t < 30 && !c; t++) {
        const pc = path.pointAt(fus[i] + (r() - 0.5) * 0.04), a = r() * 6.28, d = 20 + r() * 22;
        const q = V3(pc.x + Math.cos(a) * d, pc.y + 4 + r() * 16, pc.z + Math.sin(a) * d);
        const hr = Math.hypot(q.x - rockAxis.x, q.z - rockAxis.z);
        if (path.distanceTo(q.x, q.y, q.z) > 17 && hr > (q.y > 95 ? 86 : 34) && clearOfLeaves(q, 8)) c = q;
      }
      if (!c) continue;
      const sw = (p) => [phase, 3, 0], S = (pts, rad) => into.push(strokeGeometry(pts, rad * (big ? 1.9 : 1), { seed: r() * 9, step: 0.9 * K, radial: 5, anim: sw }));
      const pcF = path.pointAt(fus[i]), yaw = big ? Math.atan2(c.z - pcF.z, c.x - pcF.x) + 0.35 : r() * 6.28, cy = Math.cos(yaw), sy = Math.sin(yaw), P = (x, y, z) => V3(c.x + K * (x * cy - z * sy), c.y + K * y, c.z + K * (x * sy + z * cy));
      if (pod) {                                                             // a cone with a flat tilted top and its seeds
        const R = 3.4 + r() * 1.2, top = [], tl = big ? 1.5 : 0.25 + r() * 0.3;
        for (let k = 0; k <= 15; k++) { const a = (k / 14) * 6.283 * 1.04, rr = R * (1 + 0.08 * Math.sin(a * 3 + phase)); top.push(P(Math.cos(a) * rr, 6 + Math.cos(a) * rr * tl, Math.sin(a) * rr * 0.9)); }
        S(top, 0.24);
        for (const sg of [-1, 1]) S([P(sg * R * 0.96, 6 + sg * R * tl, 0), P(sg * R * 0.7, 3.2, 0), P(sg * 0.5, -0.4, 0)], 0.24);
        for (let k = 0; k < 6; k++) { const a = r() * 6.28, rr = R * 0.6 * Math.sqrt(r()); S([P(Math.cos(a) * rr, 6.1 + Math.cos(a) * rr * tl, Math.sin(a) * rr * 0.9), P(Math.cos(a) * rr + 0.5, 6.25 + Math.cos(a) * rr * tl, Math.sin(a) * rr * 0.9 + 0.3)], 0.3); }
      } else {                                                               // a lotus half open: pointed petals in outline, paper inside, the near ones hiding the far
        const H = 9 + r() * 3, a0 = r() * 6.28, nOut = 4 + Math.floor(r() * 2);
        const petal = (a, lean, curl, h, wd, bulge) => {
          const ca = Math.cos(a), sa = Math.sin(a), L = [], R = [], N = 9;
          for (let j = 0; j <= N; j++) {
            const t = j / N, out = bulge * h * Math.sin(Math.PI * Math.pow(t, 0.8)) + lean * h * t + curl * h * t * t, y = h * t * (1 - 0.22 * curl * t), w = wd * Math.pow(Math.sin(Math.PI * Math.pow(t, 0.72)), 0.8);
            L.push(P(ca * out - sa * w, y, sa * out + ca * w)); R.push(P(ca * out + sa * w, y, sa * out - ca * w));
          }
          const pts = L.slice(0, N).concat(R.slice().reverse());
          pts.push(pts[pts.length - 1].clone().lerp(L[1], 1.35));               // the loop overshoots its start
          S(pts, 0.22);
          const pp = [], ix = [];
          for (let j = 0; j <= N; j++) { pp.push(L[j].x, L[j].y, L[j].z, R[j].x, R[j].y, R[j].z); if (j) { const q = j * 2; ix.push(q - 2, q - 1, q, q - 1, q + 1, q); } }
          const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.Float32BufferAttribute(pp, 3)); pg.setIndex(ix); pg.computeVertexNormals();
          pg.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(pp.length / 3 * 2), 2));
          petalGeos.push(constAnim(pg, phase, 3, 0));
        };
        for (let k = 0; k < 3; k++) petal(a0 + k * 2.09 + r() * 0.5, r() * 0.05, 0.0, H * (0.92 + r() * 0.16), H * (0.2 + r() * 0.05), 0.2);        // the heart: three upright, closing to a point
        for (let k = 0; k < nOut; k++) petal(a0 + 1.0 + (k / nOut) * 6.283 + r() * 0.5, 0.3 + r() * 0.3, 0.12 + r() * 0.25, H * (0.74 + r() * 0.2), H * (0.21 + r() * 0.06), 0.12);   // the open ones
        if (big || r() < 0.5) petal(a0 + 0.4 + r() * 6, 0.95, 0.75, H * 0.7, H * 0.2, 0.05);   // one has let go and hangs
      }
      const st = makeStalk(c, r, { phase, radius: big ? 0.55 : 0.3, kink: big ? i === 5 : r() < 0.3 });
      into.push(st.g);
      await ctx.yield();
    }
    await ctx.yield();
    const paleMesh = new THREE.Mesh(mergeGeometries(paleGeos), paleMat); paleMesh.frustumCulled = false; scene.add(paleMesh);
    if (petalGeos.length) { const pm = new THREE.Mesh(mergeGeometries(petalGeos), shellMaterial({ deform: SWAY_DEFORM, side: THREE.DoubleSide })); pm.frustumCulled = false; scene.add(pm); }
    if (bigGeos.length) { const bm = new THREE.Mesh(mergeGeometries(bigGeos), bigMat); bm.frustumCulled = false; scene.add(bm); }
    await ctx.yield();

    // ---- THE SEVEN MINNOWS: a back stroke and an eye; they bolt past us in the drop, then hang dead still under the rock
    const mr = rng.fork('minnows');
    const eyeMats = { paper: shellMaterial(), ring: lineMaterial({ load: 1, dryLen: 1.4 }), dab: dabMaterial(1.3) };
    const minLine = lineMaterial({ load: 0.95, dryLen: 1.3 });
    const mk = (pts, rad, seed) => strokeGeometry(pts.map((p) => V3(p[0], p[1], p[2])), rad, { seed, step: 0.3, radial: 6 });
    const minGeo = mergeGeometries([
      mk([[-2.0, 0.2, 0], [-1.1, 0.66, 0], [0.2, 0.62, 0], [1.4, 0.26, 0], [2.3, 0.1, 0]], 0.44, 1.3),          // the back, one stroke
      mk([[2.2, 0.1, 0], [2.7, 0.4, 0], [3.25, 0.85, 0]], 0.2, 2.1), mk([[2.2, 0.1, 0], [2.7, -0.1, 0], [3.2, -0.6, 0]], 0.2, 4.4), mk([[2.3, 0.1, 0], [2.8, 0.12, 0], [3.1, 0.1, 0]], 0.16, 5.1),
      mk([[-2.0, -0.05, 0], [-1.2, -0.44, 0], [0.2, -0.38, 0], [1.5, -0.08, 0]], 0.11, 6.2),
    ]);
    const bellyGeo = new THREE.SphereGeometry(1, 14, 8); bellyGeo.scale(2.0, 0.5, 0.36); bellyGeo.translate(-0.1, 0.08, 0);
    const restU = 0.61, restP = path.pointAt(restU), restT = path.pointAt(restU + 22 / path.length).sub(restP).normalize();   // where we look at u 0.61
    const restR = V3().crossVectors(restT, V3(0, 1, 0)).normalize(), restUp = V3().crossVectors(restR, restT).normalize();
    const hB = V3().crossVectors(restT, V3(0, 1, 0)).normalize().multiplyScalar(-1); hB.y = 0.12; hB.normalize();
    const hA = V3(0.92, 0.06, 0.39).normalize();
    const toRest = V3(rockAxis.x - restP.x, 6, rockAxis.z - restP.z).normalize();
    const minnows = [];
    for (let i = 0; i < 7; i++) {
      const g = new THREE.Group(), r = mr.fork('m' + i), sc = (0.9 + r() * 0.3) * 1.5;
      g.add(new THREE.Mesh(bellyGeo, eyeMats.paper), new THREE.Mesh(minGeo, minLine));
      const eyes = [];
      for (const sg of [1, -1]) { const e = makeEye(r, 0.92, eyeMats); e.group.position.set(-1.38, 0.2, sg * 0.36); e.group.rotation.y = sg > 0 ? 0 : Math.PI; g.add(e.group); eyes.push(e); }
      g.scale.setScalar(sc);
      const A = i === 0 ? V3(-8, 146.5, 31) : V3(-9 - r() * 19, 139 + r() * 17, 42 + r() * 30);
      if (i >= 4) { A.z += 46; A.x -= 6; }                                    // three hang further on, so the picture between the two stalks has its fish too
      const off = V3((i % 2 ? 1 : -1) * (2.5 + r() * 7), -3 + r() * 6, (r() - 0.5) * 6);
      const B = restP.clone().addScaledVector(restT, 11 + i * 4.2 + r() * 2).addScaledVector(restR, (i === 0 ? 6 : (i % 2 ? 4 : 10) + r() * 9) - 2).addScaledVector(restUp, i === 0 ? -1.5 : (r() - 0.5) * 12);
      for (let k = 0; k < 6 && path.distanceTo(B.x, B.y, B.z) < 4.5; k++) B.addScaledVector(restR, -1.5);
      scene.add(g); minnows.push({ g, eyes, A, B, off, ph: r() * 6.28, lag: i === 0 ? -0.006 : -0.014 + r() * 0.01 });
    }
    const tp = V3(), tq = V3(), th = V3();
    const minnowPos = (m, u, out) => {
      const x = u - 0.119 - m.lag, um = Math.min(0.245, 0.05 + 2.55 * Math.max(0, x));
      path.pointAt(um, tp).add(m.off);
      out.copy(m.A).lerp(tp, sstep(0, 0.014, x));
      return out.lerp(m.B, sstep(0.2, 0.265, u));
    };
    await ctx.yield();
    // ---- THE REST OF THE CAST (his album leaves: one large subject each, the void beside it)
    const cr = rng.fork('cast');
    // a second fish hangs high beside the rock's shoulder, the other head, side-on to the climb, eye rolled up (u 0.70)
    const fish2 = makeFish(ink, cr.fork('fish2'), { flat: variant.fish === 'hump', detail, eyeMats });
    const F2 = V3(-20, 160, 221);
    fish2.group.position.copy(F2); fish2.group.scale.setScalar(1.25); fish2.group.rotation.set(0, Math.PI / 2 - 0.3, 0.09);
    await ctx.yield();
    // (cure) the second fish stands back along its length, a quarter metre at a time (at most 12 m), until no point of it is
    // within 2 m of the route's line: at F2 its near eye lay on the line where the route passes its head. Counted with each
    // point: the bob (0.4 m either way), what the shader may move it (the tail's scull, a fin's, the gill's lift), the
    // contour's width (0.56 of the fish's units), the pupil's slide along its rim (0.9 units), a line's pooled start (0.06 m).
    // The gaze aims at F2 as before, now within its flank
    {
      fish2.group.updateMatrixWorld(true);
      const back = V3(1, 0, 0).applyQuaternion(fish2.group.quaternion).setY(0).normalize(), q = V3(), sc = fish2.group.scale.x, pup = new Set(fish2.eyes.map((e) => e.pupil));
      const ball = new THREE.Box3().setFromObject(fish2.group).getBoundingSphere(new THREE.Sphere());
      let ua = 2, ub = -1; for (let i = 0; i <= NS; i++) if (samples[i].distanceTo(ball.center) < ball.radius + 20) { ua = Math.min(ua, i / NS); ub = Math.max(ub, i / NS); }
      const rt = []; for (let u = Math.max(0, ua - 1 / NS); u <= Math.min(1, ub + 1 / NS); u += 0.2 / path.length) rt.push(path.pointAt(u));
      const off = (x, y, z, t, st) => { x += back.x * t; z += back.z * t; let m = 1e18; for (let i = 0; i < rt.length; i += st) { const r = rt[i], dx = r.x - x, dz = r.z - z, dy = Math.max(0, Math.abs(r.y - y) - 0.4), d = dx * dx + dy * dy + dz * dz; if (d < m) m = d; } return Math.sqrt(m); };
      const near = [];
      fish2.group.traverse((o) => {
        if (!o.isMesh) return;
        const pos = o.geometry.attributes.position, an = o.geometry.attributes.aAnim, body = o.parent === fish2.group;
        for (let i = 0; i < pos.count; i++) {
          const tail = Math.min(1, Math.max(0, (pos.getX(i) + 3) / 18)), sway = body ? sc * (0.56 + 0.8 * tail * tail + (an ? Math.abs(an.getX(i)) + Math.abs(an.getZ(i)) : 0)) : pup.has(o) ? 0.9 * sc : 0.06;
          q.fromBufferAttribute(pos, i).applyMatrix4(o.matrixWorld);
          if (off(q.x, q.y, q.z, 0, 10) - sway < 2 + 12 + 2) near.push([q.x, q.y, q.z, sway]);          // a first pass on every tenth point of the route (2 m apart), so 2 m wider
        }
      });
      await ctx.yield();
      let t = 0, bad = 0;          // the point that was too near is tried first at the next place
      const tooNear = () => { for (let k = 0; k < near.length; k++) { const j = (bad + k) % near.length, p = near[j]; if (off(p[0], p[1], p[2], t, 1) - p[3] < 2) { bad = j; return true; } } return false; };
      while (t < 12 && tooNear()) t += 0.25;
      fish2.group.position.addScaledVector(back, t);
    }
    scene.add(fish2.group);
    await ctx.yield();
    // two birds, backs turned to each other, on a small rock that ought to fall, north of the stem (u 0.43)
    const BO = V3(15, 21, 379), camB = path.pointAt(0.43);
    const boulder = makeBoulder(ink, cr.fork('boulder'), { height: 32, side: Math.atan2(camB.z - BO.z, camB.x - BO.x) + 0.5 });
    boulder.group.position.copy(BO); boulder.group.scale.setScalar(1.3); scene.add(boulder.group);
    await ctx.yield();
    const kinds = ['mynah', 'quail', 'kingfisher'].filter((k) => k !== variant.bird), sideOn = Math.atan2(-(camB.x - BO.x), -(camB.z - BO.z));
    const birdA = makeBird(ink, cr.fork('birdA'), kinds[0], { eyeMats });
    await ctx.yield();
    const birdB = makeBird(ink, cr.fork('birdB'), kinds[1], { eyeMats, awake: true });
    birdA.group.scale.setScalar(2.05); birdA.group.position.copy(boulder.top).add(V3(0, -0.4, 0)); birdA.group.rotation.y = sideOn;
    { const sp = boulder.at(0.93, Math.atan2(camB.z - BO.z, camB.x - BO.x) + 1.35);
      birdB.group.scale.setScalar(1.5); birdB.group.position.copy(sp.p).add(V3(0, -0.5, 0)); birdB.group.rotation.y = sideOn + Math.PI - 0.45; }
    boulder.group.add(birdA.group, birdB.group);

    // ---- THE SHOAL (u 0.79): nine more of the white-eyed fish sweep close past three huge wet leaves on the outside of the turn,
    // all one way, eyes rolled up. Two rigid bands (three draw calls each), baked where they are at u 0.79 and moved by u only.
    const sh = rng.fork('shoal'), camS = path.pointAt(0.79), LC = V3(-98, 198, 278);
    const gS = LC.clone().sub(camS).normalize(), rS = V3().crossVectors(gS, V3(0, 1, 0)).normalize(), uS = V3().crossVectors(rS, gS).normalize();
    const dirS = rS.clone().addScaledVector(uS, 0.2).addScaledVector(gS, 0.1).normalize();      // across the frame, a little up and away
    const P79 = camS.clone().addScaledVector(gS, 25).addScaledVector(uS, -6.5);
    const bands = [], shoalDen = V3(10, 175, 310).sub(P79).addScaledVector(dirS, 0);   // before their moment they wait inside the rock's shell and come out from behind its contour
    {
      const fx = dirS.clone().negate(), fz = V3().crossVectors(fx, uS).normalize(), fy = V3().crossVectors(fz, fx).normalize();
      const slots = [[-25, 3.5, 3], [-15, -2.5, -2], [-9, 5, 6], [-1, -0.5, -4], [6, 4.5, 2], [12, -4, 5], [19, 1, -3], [27, 5.5, 4], [31, -3, 0]];
      const parts = [[[], [], []], [[], [], []]], mm = new THREE.Matrix4(), em = new THREE.Matrix4(), bq = new THREE.Quaternion(), holder = new THREE.Group();
      for (let i = 0; i < slots.length; i++) {
        const r = sh.fork('s' + i), sc = (1.45 + 0.8 * r()) * (i === 3 ? 1.3 : 1), sl = slots[i], tiltZ = (r() - 0.5) * 0.3;
        const p = P79.clone().addScaledVector(dirS, sl[0] + (r() - 0.5) * 3).addScaledVector(uS, sl[1]).addScaledVector(gS, sl[2]);
        const base = new THREE.Matrix4().makeBasis(fx, fy, fz).multiply(mm.makeRotationZ(tiltZ)); base.setPosition(p); base.scale(V3(sc, sc, sc));
        const into = parts[i % 2];
        into[0].push(bellyGeo.clone().applyMatrix4(base)); into[1].push(minGeo.clone().applyMatrix4(base));
        for (const sg of [1, -1]) {
          const e = makeEye(r, 0.92, eyeMats); e.group.position.set(-1.38, 0.2, sg * 0.36); e.group.rotation.y = sg > 0 ? 0 : Math.PI;
          holder.add(e.group); holder.updateMatrixWorld(true);
          const bake = (mesh) => mesh.geometry.clone().applyMatrix4(em.multiplyMatrices(base, mesh.matrixWorld));
          into[0].push(bake(e.disc)); into[1].push(bake(e.ring)); into[2].push(bake(e.pupil));
          holder.remove(e.group);
        }
        await ctx.yield();
      }
      for (let b = 0; b < 2; b++) {
        const g = new THREE.Group(), mats = [eyeMats.paper, minLine, eyeMats.dab];
        for (let k = 0; k < 3; k++) { const m = new THREE.Mesh(mergeGeometries(parts[b][k]), mats[k]); m.frustumCulled = false; g.add(m); }
        scene.add(g); bands.push({ g, lag: b * 0.0035, ph: b * 2.1 });
        await ctx.yield();
      }
    }
    const BTOP = BO.clone().addScaledVector(boulder.top, 1.3).add(V3(0, 9, 0));
    await ctx.yield();

    // ---- THE SEAL: a cinnabar square 24 m across round a 14 m opening; one corner chipped, a notch out of the lower edge
    const sr = rng.fork('seal'), seat = path.pointAt(1), seatT = path.tangentAt(1);
    const shape = new THREE.Shape(), H = 12, wobble = (t) => 0.22 * Math.sin(t * 5.1 + 1.3) + 0.12 * Math.sin(t * 13.7);
    const outline = [];
    const edge = (x0, y0, x1, y1, n, nx, ny) => { for (let k = 0; k < n; k++) { const t = k / n, w = wobble(t * 6.28 + x0 + y0 * 2.0); outline.push([lerp(x0, x1, t) + nx * w, lerp(y0, y1, t) + ny * w]); } };
    edge(-H, -H, -3.4, -H, 8, 0, 1); outline.push([-3.0, -H + 1.5], [-1.6, -H + 2.1], [-0.9, -H + 0.2]);       // the notch in the lower edge
    edge(-0.8, -H, H, -H, 9, 0, 1); edge(H, -H, H, H - 3.6, 10, 1, 0);
    outline.push([H - 0.9, H - 3.0], [H - 2.2, H - 1.7], [H - 3.9, H - 0.4]);                                    // the chipped corner
    edge(H - 4.2, H, -H, H, 10, 0, 1); edge(-H, H, -H, -H, 12, 1, 0);
    shape.moveTo(outline[0][0], outline[0][1]); for (let k = 1; k < outline.length; k++) shape.lineTo(outline[k][0], outline[k][1]);
    const hole = new THREE.Path(), hp = [];
    for (let k = 0; k < 48; k++) { const side = Math.floor(k / 12), t = (k % 12) / 12, h = 6.86 + 0.05 * Math.sin(k * 2.3), c = [[-h, -h], [h, -h], [h, h], [-h, h], [-h, -h]]; hp.push([lerp(c[side][0], c[side + 1][0], t), lerp(c[side][1], c[side + 1][1], t)]); }
    hole.moveTo(hp[0][0], hp[0][1]); for (let k = hp.length - 1; k > 0; k--) hole.lineTo(hp[k][0], hp[k][1]);
    shape.holes.push(hole);
    const sealMat = new THREE.ShaderMaterial({
      side: THREE.DoubleSide, uniforms: { ...STYLE, uSeed: { value: sr() * 40 } },
      vertexShader: 'varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: STYLE_GLSL + STYLE_FRAG_GLSL + /* glsl */`
        uniform float uSeed; varying vec3 vP;
        void main(){
          vec3 q = vec3(vP.xy, uSeed);
          float px = length(fwidth(vP.xy));                                    // flecks finer than 3 px melt into the flat red
          float fl = fbm3(q * 0.55) * 0.6 + 0.4 * vnoise(q * vec3(2.6, 2.6, 1.0));
          float rim = min(min(12.0 - abs(vP.x), 12.0 - abs(vP.y)), max(abs(vP.x), abs(vP.y)) - 6.8);   // paste misses most near the edges
          float miss = smoothstep(0.685, 0.70, fl + 0.16 * (1.0 - smoothstep(0.0, 1.6, rim)));
          miss *= 1.0 - smoothstep(0.25, 0.8, px);
          if (miss > 0.5) discard;
          float fb = fibreF(vP * 1.3);
          gl_FragColor = vec4(uCinnabar * (0.94 + 0.12 * fb), 1.0);
        }`,
    });
    const seal = new THREE.Mesh(new THREE.ShapeGeometry(shape), sealMat);
    seal.position.set(seat.x - seatT.x * 0.12, seat.y, seat.z - seatT.z * 0.12); seal.rotation.y = Math.atan2(-seatT.x, -seatT.z);                               // it faces back down the course
    scene.add(seal);
    await ctx.yield();

    // ---- THE RARE EVENT: a bead of ink as big as a house falls past us in the drop, strikes a bare stalk tip and bursts open into a leaf
    const beadOff = V3(-10, 4, 0), bq = V3();
    let bead = null, newLeaf = null;
    if (rare) {
      const bg = new THREE.IcosahedronGeometry(1, 3), bp = bg.attributes.position;
      for (let k = 0; k < bp.count; k++) { const x = bp.getX(k), y = bp.getY(k), z = bp.getZ(k), w = 1 + 0.12 * Math.sin(x * 3.1 + 1.0) * Math.sin(z * 2.7) ; bp.setXYZ(k, x * 4.4 * w, y * 5.6 * (y > 0 ? 1.25 : 1), z * 4.4 * w); }
      bg.computeVertexNormals(); bg.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(bp.count * 2), 2));
      bead = new THREE.Mesh(constAnim(bg, 0, 0, 0), thornMat); bead.frustumCulled = false; scene.add(bead);
      newLeaf = new THREE.Mesh(RARE_LEAF_GEO, leafMat); newLeaf.position.copy(tip); newLeaf.renderOrder = 6; newLeaf.frustumCulled = false; scene.add(newLeaf);
    }
    await ctx.yield();

    // ---- every frame
    const camP = V3(), eyeAt = V3(), fishEyeSE = O(hero.anchors.fishEyeSE), fishEye = O(hero.anchors.fishEyeNW), birdAt = O(hero.anchors.bird);
    const easeOut = (t) => { t = Math.max(0, Math.min(1, t)); return 1 - (1 - t) * (1 - t) * (1 - t); };
    function update(dt, time, camera, u) {
      camera.getWorldPosition(camP);
      dome.position.copy(camP);
      hero.update(dt, time, camera);
      hero.setProgress(u < 0.8 ? u : 0.8 + (u - 0.8) * 1.38);                 // the bird wakes at u 0.905 (still ahead of us), changes legs by 0.927
      STYLE.uWet.value.set(150, 520);
      // the medium: each leaf wells up once, runs to its tide line and stops, then dries a tone paler when we are past
      for (let i = 0; i < spec.length; i++) {
        const s = spec[i]; if (s.far) continue;
        const t = s.start <= -1 ? 1 : (u - s.start) / 0.075, live = t > 0 && t < 1 ? 1 : 0;
        leafState[i].set(s.full * (easeOut(t) + live * 0.012 * Math.sin(time * 1.3 + i)), sstep(s.dryAt, s.dryAt + 0.06, u));
      }
      // the two nearest stalks are still being drawn: a wet bead runs down each ahead of us
      headMats[0].uniforms.uHead.value = Math.min(1, 0.075 + 0.3 * sstep(0, 0.1, u) + 0.63 * sstep(0.09, 0.22, u) + 0.004 * Math.sin(time * 0.9));
      headMats[1].uniforms.uHead.value = Math.min(1, 0.055 + 0.26 * sstep(0.01, 0.11, u) + 0.69 * sstep(0.1, 0.24, u) + 0.004 * Math.sin(time * 0.8 + 2.0));
      // minnows: hang, bolt, hang
      const moving = sstep(0.125, 0.14, u) * (1 - sstep(0.24, 0.275, u)), atB = sstep(0.22, 0.275, u);
      for (let i = 0; i < minnows.length; i++) {
        const m = minnows[i];
        minnowPos(m, u, m.g.position); minnowPos(m, u + 0.004, tq);
        th.copy(hA).lerp(hB, atB);
        if (moving > 0.001) { tq.sub(m.g.position); if (tq.lengthSq() > 1e-6) th.lerp(tq.normalize(), moving); }
        if (th.lengthSq() < 1e-6) th.copy(hB);
        th.normalize();
        const still = 1 - moving;
        m.g.position.y += 0.25 * Math.sin(time * 0.5 + m.ph) * still * (1 - atB);          // under the leaf they bob; under the rock they hang dead still
        m.g.rotation.set(0, Math.atan2(th.z, -th.x) + 0.22 * Math.sin(time * 15 + m.ph) * moving, -Math.asin(Math.max(-1, Math.min(1, th.y))), 'YZX');
        for (const e of m.eyes) e.look(camP, dt);
      }
      fish2.group.position.y = F2.y + 0.4 * Math.sin(time * 0.29 + 2.0);
      for (const e of fish2.eyes) e.look(camP, dt);
      for (const e of birdB.eyes) e.look(camP, dt);
      for (const b of bands) { const sS = Math.max(0.735, Math.min(0.9, u)) - 0.79 - b.lag; b.g.position.copy(dirS).multiplyScalar(560 * sS).lerp(shoalDen, 1 - sstep(0.655, 0.735, u)); b.g.position.y += 0.3 * Math.sin(time * 0.6 + b.ph); }   // the shoal sweeps past the three leaves, keyed to u
      if (bead) {                                                                          // the rare event, keyed to u
        const f = Math.max(0, Math.min(1, (u - 0.13) / 0.07)), hit = sstep(0.2, 0.203, u);       // it runs down our own line, faster than we fall
        path.pointAt(0.06 + 0.17 * f, bq).add(beadOff);
        bead.position.copy(bq).lerp(tip, sstep(0.7, 1, f));
        const sq = (1 - hit) * sstep(0.128, 0.134, u); bead.scale.set(Math.max(0.001, sq * (1 + 0.04 * Math.sin(time * 9))), Math.max(0.001, sq), Math.max(0.001, sq));
        newLeaf.scale.setScalar(Math.max(0.001, easeOut((u - 0.2) / 0.02)));
      }
    }
    update(0, 0, { getWorldPosition: (v) => v.copy(path.start) }, 0);

    return {
      scene, path, duration: 42, pace,
      camera: { fov: 62, near: 0.3, far: 4000, lookAhead: 22, sway: 0.5, bank: 0.7 },
      pois: [
        { at: (time, u) => eyeAt.copy(fishEyeSE).lerp(fishEye, sstep(0.342, 0.366, u)), from: 0.22, to: 0.41, weight: 0.75, fade: 0.2 },   // the near eye as we come at it broadside, the far one once we are round the snout
        { at: BTOP, from: 0.405, to: 0.485, weight: 0.6 },                     // the two birds on their rock, north of the stem
        { at: V3(105, 100, 341), from: 0.49, to: 0.555, weight: 0.7 },
        { at: restP.clone().addScaledVector(restT, 26).addScaledVector(restR, 10), from: 0.565, to: 0.65, weight: 0.6 },   // the minnows hanging under the rock, to starboard
                  // the lotus in outline under its leaf
        { at: F2, from: 0.655, to: 0.74, weight: 0.6 },                       // the second fish
        { at: LC, from: 0.745, to: 0.835, weight: 0.75 },                      // the three wet leaves and the shoal sweeping past them
        { at: birdAt, from: 0.85, to: 0.965, weight: 0.5 },                     // the rock's shoulder rising to the horn, the bird on its tip
      ],
      portal: { shape: 'rect', width: 14, height: 14, frame: 0, glow: 0, color: PALETTE[5], veil: PALETTE[5], revealDistance: 420, blendDistance: 25 },
      post: { flat: 1, exposure: 1, bloom: { strength: 0 }, grade: { saturation: 1, contrast: 1, vignette: 0, grain: 0 } },
      ride: 'none', style: 'none', companion: 'none',
      update,
      dispose() { hero.dispose(); },
    };
  },
};
