// What Happened Here: a field of new snow at first sun, and on it the evidence of something that is already over.
// Nothing alive is ever drawn. ONE STORY LIST (../parts/what-happened-here.js, makeStory) lays down every mark; the
// camera's ground track is the hunted bird's own line of prints and its speed at every point is the speed the bird had
// there (pace). Because the gaze is the path and a level flight would show prints as slivers, the WORLD is pitched under
// a level camera: the whole field (snow, prints, hedge, sky, sun) is one group whose matrix is written from u each frame:
//   T(P) R(a, pitch(u)) T(-P) T(0, 3 - h(u), 0) T(c(u) t)
// P the path point at u, a the horizontal axis square to the tangent t, c the carry over the wing print. At u 0 and
// from u 0.87 it is the identity (plus the settled carry), so the entry, the portal picture and the exit are level.
import * as THREE from 'three';
import { makePath } from '../kit/core.js';
import { makeStory, buildField, LEN, HEDGE_S } from '../parts/what-happened-here.js';

const clamp01 = (x) => Math.min(1, Math.max(0, x));
const sstep = (a, b, x) => { const t = clamp01((x - a) / (b - a)); return t * t * (3 - 2 * t); };
// keys [[u, value], ...] joined by smoothsteps
const keyed = (keys, u) => {
  if (u <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) if (u <= keys[i][0]) return keys[i - 1][1] + (keys[i][1] - keys[i - 1][1]) * sstep(keys[i - 1][0], keys[i][0], u);
  return keys[keys.length - 1][1];
};
const PITCH = [[0.02, 0], [0.12, 28], [0.24, 30], [0.40, 38], [0.75, 38], [0.785, 55], [0.81, 55], [0.87, 0]];   // degrees
const U_LEVEL = PITCH[PITCH.length - 1][0];      // where the page is level again and the ring stands behind the gap
const HEIGHT = [[0.13, 3], [0.24, 5], [0.29, 5], [0.40, 7], [0.75, 7], [0.785, 6], [0.81, 6], [0.90, 3]];        // metres above the snow

const FAR_PITCH = 17.5 * Math.PI / 180, CREASE = 11.5 * Math.PI / 180;   // the far field's pitch, and how high above the gaze the page begins to turn
const LOOKS = [
  // THE STALK: first sun, fifteen below, gold from the right
  { sun: '#FFD47A', sunK: 1.28, shade: '#5E7FB8', deep: '#566A92', shadeK: 1.0, crest: '#FFF1D2', haze: '#F2CDA6', hazeK: 0.95, sky: '#9DB4D6', dark: '#2B2530', straw: '#C9A566', belt: '#2A0B14', az: [0.985, -0.174], e0: 4, e1: 7 },
  // HEAD ON: late afternoon, rose light: the sun low ahead and to one side at the start, square from the side after the swing
  { sun: '#FFB89A', sunK: 1.25, shade: '#6C78B8', deep: '#5A6292', shadeK: 1.0, crest: '#FFEADF', haze: '#F2C8BC', hazeK: 0.95, sky: '#A6A4D0', dark: '#2B2530', straw: '#C99A70', belt: '#300A1E', az: [-0.5, -0.866], e0: 7, e1: 4, glare: 0.5 },
  // TWO HOURS ON ONE PAGE: before dawn under a low full moon
  { sun: '#BFD0F0', sunK: 0.5, shade: '#22316C', deep: '#1E2C58', shadeK: 0.9, crest: '#E8F0FF', haze: '#3C4C80', hazeK: 0.6, sky: '#141E40', dark: '#0C1020', straw: '#D9B978', belt: '#000000', night: 1, glare: 0.4, az: [-0.588, -0.809], e0: 6, e1: 9,
    // the moon stands low ahead and to the left (in the first frames, over the hedge); first light comes up on the right as we go
    dawn: { col: '#FFA07A', colK: 1.15, dir: [0.966, -0.259], sun: '#FFB89C', sunK: 0.62, shade: '#3B3E92', deep: '#2C347E', haze: '#B07A8C', hazeK: 0.75, top: '#3A4478', topK: 0.8, gap0: '#A4BCF4', gap0K: 0.8, gap1: '#FFB080', gap1K: 0.95, k0: 0.06 } },
];

export default {
  id: 'what-happened-here',
  name: 'What Happened Here',
  category: 'wilderness',
  weirdness: 0.3,
  media: ['snow', 'open'],
  async build(ctx) {
    const vary = ctx.vary || {}, rare = !!vary.rare, seed = (ctx.seed >>> 0) || 0, detail = ctx.quality?.detail ?? 1;   // detail thins dust and streamers only
    const scene = new THREE.Scene();
    // the deal: which story, which side the hunter comes from
    let variant = [1, 2, 0][seed % 3];
    if (vary.hour === 'night') variant = 2; else if (vary.hour === 'golden') variant = 1; else if (vary.hour === 'dawn' || vary.hour === 'day') variant = 0;
    if (rare && variant === 2) variant = 0;                 // the rare event needs the two lines to have met
    const side = seed % 2 === 0 ? 1 : -1;
    const look = { ...LOOKS[variant] };
    if (variant === 1) look.az = [look.az[0] * side, look.az[1]];
    await ctx.yield();
    const story = makeStory(ctx.rng, { variant, rare, side });
    await ctx.yield();
    const path = makePath(story.pts);
    await ctx.yield();

    // the wind blows toward the sun's side, a little across it (which way and how much is the seed's): every ripple
    // turns its steep face from the light and lays a blue shadow, and the crests cross the trail instead of copying it
    const wa = (0.2 + 0.3 * (((seed >>> 2) % 5) / 4)) * ((seed >>> 1) % 2 ? 1 : -1), wca = Math.cos(wa), wsa = Math.sin(wa);
    const field = await buildField(ctx, story, look, { detail, wind: [look.az[0] * wca - look.az[1] * wsa, look.az[0] * wsa + look.az[1] * wca] });
    field.U.uSunCol.value.multiplyScalar(look.sunK);
    const drift0 = 1.05 + 0.4 * ((vary.density ?? 1) - 0.7) / 0.6;      // density: how much spindrift is running
    await ctx.yield();
    scene.add(field.group);
    scene.background = new THREE.Color(look.haze).multiplyScalar(look.hazeK);

    // pace: the bird's gait. A walk, B walk, C feeding (nearly stopped), D walk on, E the run, F the coast over the
    // wings, G the walk out. The engine clamps to 0.35..2.5 and rescales to the duration; only the shape matters.
    const L = path.length, w = 0.02, f = story.feeds;
    const bump = (u, a, b) => sstep(a - w / 2, a + w / 2, u) * (1 - sstep(b - w / 2, b + w / 2, u));
    const pace = (u) => {
      let p = 0.88;
      for (const fd of f) p += (0.44 - 0.88) * bump(u, (fd[0] - 12) / L, (fd[1] - 4) / L);
      if (variant !== 2) { p += (0.77 - 0.88) * bump(u, (f[0][1] - 4) / L, 0.40); p += (2.43 - 0.88) * bump(u, 0.40, 0.77); }
      p += (0.39 - 0.88) * bump(u, 0.77, 0.81);
      return p;
    };

    // the carry: the field travels with us a little where the bird stood still, so the snow all but stops under the
    // camera: 6 m at each feeding patch (given back over the next thirty metres) and 6 m for good over the wing print
    const carry = (u) => { let c = 6 * sstep(0.775, 0.815, u); for (const fd of f) { const ub = (fd[1] - 2) / L; c += 6 * (sstep((fd[0] - 10) / L, ub, u) - sstep(ub + 0.012, ub + 0.095, u)); } return c; };
    const P = new THREE.Vector3(), T = new THREE.Vector3(), A = new THREE.Vector3(), M = new THREE.Matrix4(), M2 = new THREE.Matrix4(), Mi = new THREE.Matrix4();
    const camW = new THREE.Vector3(), camL = new THREE.Vector3();
    const place = (u) => {
      const pitch = keyed(PITCH, u) * Math.PI / 180, h = keyed(HEIGHT, u), c = carry(u);
      path.pointAt(u, P); path.tangentAt(u, T); T.y = 0; if (T.lengthSq() < 1e-8) T.set(0, 0, -1); T.normalize();
      A.set(-T.z, 0, T.x);                                   // the horizontal axis square to the tangent (to the right)
      M.makeTranslation(P.x, P.y, P.z);
      M.multiply(M2.makeRotationAxis(A, pitch));
      M.multiply(M2.makeTranslation(-P.x + c * T.x, -P.y + 3 - h, -P.z + c * T.z));
      field.group.matrix.copy(M); field.group.matrixWorldNeedsUpdate = true;
      field.U.uLift.value = 34 * sstep(U_LEVEL, U_LEVEL + 11 / LEN, u);     // the mist in the gap hides the ring until the page is level (the last key of PITCH), then lifts over the next eleven metres
      field.U.uRingDrop.value = Math.max(HEDGE_S + 0.25 + c - u * LEN, 1) * Math.tan(pitch);   // how far below the gaze the ring's centre stands on the gap's card (0.25 m beyond the hedge line) while the page is pitched: the card's copy of the ring's outer glow is centred there, on the ring, at every u
      field.U.uStreak.value = (1 - 0.6 * sstep(0.42, 0.7, pitch)) * (look.night ? 0.8 : variant === 1 ? 1.7 : 1.35);              // streamers thin out over the pitched page: the prints stay the darkest marks
      field.setDrifts(u * LEN);
      field.U.uDrift.value = drift0 * (variant === 1 ? 1 + 0.4 * (1 - sstep(0.03, 0.12, u)) : 1);   // head on, the level entry looks into the light across the whole field: more snow is running there
      field.U.uLevel.value = 1 - sstep(0.03, 0.11, u);          // the level entry view: long blue ripple shadows; a tint once the page tips
      field.U.uSeamK.value = 1 - sstep(0.795, 0.83, u);         // no swell shadow lies over the trail ahead, nor (setCorridor) over the fox's line, until the trail has ended
      field.setCorridor(u * LEN - c);
      // THE FAR PAGE RELAXES: the page under the lens is pitched as written; the far field never tips past FAR_PITCH, so
      // from the crease up (about a third of the way down the frame) the field runs away to the hedge under the sky.
      // Off for the wings (u 0.78 on): that frame is the page face on and nothing else.
      // On the deals where two lines meet (the stalk, head on) the far page is where the second and third hands are
      // written, so there it relaxes only on the walk in, while the bird is alone, and from the hare on the page stands whole.
      const bx = pitch - FAR_PITCH, bw = 0.05, beta = (bx < -bw ? 0 : bx > bw ? bx : (bx + bw) * (bx + bw) / (4 * bw)) * (1 - sstep(0.735, 0.78, u)) * (variant === 2 ? 1 : 1 - sstep(0.115, 0.155, u)), R = 24;   // eased in: the far field stops tipping without a jolt
      field.setCurl(P.x - c * T.x, P.z - c * T.z, T.x, T.z, Math.max(h / Math.tan(Math.max(pitch - CREASE, 0.05)) - R * Math.tan(beta / 2), 1), R, beta);
      Mi.copy(M).invert();
    };
    const C = (h, k = 1) => new THREE.Color(h).multiplyScalar(k), dn = look.dawn;
    const dawn = dn ? { col: C(dn.col, dn.colK), dir: dn.dir, sun: C(dn.sun, dn.sunK), shade: C(dn.shade), deep: C(dn.deep), haze: C(dn.haze, dn.hazeK), top: C(dn.top, dn.topK), gap0: C(dn.gap0, dn.gap0K), gap1: C(dn.gap1, dn.gap1K) } : null;
    if (!dawn) field.U.uGap.value.copy(field.U.uSunCol.value).multiply(new THREE.Color(1, 0.84, 0.62));     // the gap holds the sun's own gold
    const sunAt = (u) => { field.setSun((look.e0 + (look.e1 - look.e0) * u) * Math.PI / 180, look.az[0], look.az[1]);
      // the page stays moon blue through the wings (u 0.81); the rose comes only as it levels for the walk out
      if (dawn) field.setDawn(dn.k0 + 0.4 * sstep(0.27, 0.72, u) + (0.76 - dn.k0 - 0.4) * sstep(0.82, 0.93, u), dawn); };
    place(0); sunAt(0);

    return {
      scene, path, duration: 40, pace,
      title: 'What Happened Here',
      ride: 'none', style: 'none', companion: 'none',
      camera: { fov: 62, near: 0.3, far: 4000, sway: 0, bank: 0 },
      pois: [],
      portal: { shape: 'circle', radius: 6, color: '#CFE0FF', glow: 0.8, revealDistance: 47, style: 'ring' },   // the plain ring, on every visit: the gap's card carries a copy of this ring's own outer glow
      post: { exposure: 1.0, bloom: { strength: 0.35, radius: 0.6, threshold: 0.95 },
        grade: { saturation: look.night ? 1.14 : 1.05, contrast: look.night ? 1.12 : 1.06, shadowTint: '#0A1630', vignette: look.night ? 0.3 : 0.22, grain: 0.02 } },
      update(dt, time, camera, u) {
        place(u); sunAt(u);
        camW.setFromMatrixPosition(camera.matrixWorld); camL.copy(camW).applyMatrix4(Mi);
        field.update(time, camL, camW, ctx.renderer);
      },
      dispose() {},
    };
  },
};
