// THE WHITE STACK (gannet-stack-gale): a gale after a squall. We run in low over a bottle-green swell, thread the arch
// of a 170 m sea stack as a swell detonates in it, ride the updraft up a face white with nesting gannets, tip over
// with thirty of them and fall into the boiling sea, through the surface and down to the ring among bubble trails.
//
// MAP OF THIS FILE (in order)
//   1. MOODS            the seeded looks (hour): golden / dawn / day / night. Slot, deck, key, ambient, sea, fog, exposure.
//                       Weather (clear / rain + rainbow foot / haar), season (june / august) and cast (skua or
//                       black-backed gulls; seals or dolphins) are drawn from ctx.rng in build ("SEEDED LOOK").
//   2. GEOMETRY         gannetGeometry (flyers, escorts, divers, rafts, crossers; the lander variant has a fanned tail and feet),
//                       swimmerGeometry (seals / dolphins), trawlerGeometry, skerryGeometry, whaleGeometry (smooth,
//                       pointed rostrum, dark lip over a pale jaw line, pleated throat, white-banded flippers).
//   3. GLSL             SEA_GLSL (the kit ocean's own waves, read from its uniforms, so things ride the real surface),
//                       TRAJ (one trajectory per kind of flyer: stream, escort, diver, lander, flush, cross, raft, swim) and
//                       gannetMaterial(traj) with the wing pose (flap and fold: 0 spread, 1 half-closed W, 2 spear),
//                       litMaterial (trawler, skerries, whale), strikeMaterial (plume + foam patch + bubble trail per
//                       diver; the plume is a short ragged tuft, at least 0.6 as wide as tall, bright at the base and torn to mist at
//                       the top; the patch is a ragged disc of white water that spreads, tears into lace and pales with bubbles; uGrow
//                       keeps the tufts readable from far above, by distance), wreathMaterial (the boil's wreath as foam lace
//                       at three sizes, the turquoise eye and, on rare seeds, the whale's dark back under the surface), trail and veil materials, curtainMaterial, rainbowFootMaterial,
//                       squallMaterial (the sky darkened by bearing, with soft breaks and rags of scud: a noise of the deck's
//                       own plane that drifts downwind on the world's clock, the same on every seed; see SCUD AND LIGHTER BREAKS).
//   3b. FLIGHT          routePoints, flightKeys, flightPlan (pace + pois), CAMERA, DURATION: pure functions of the hero's
//                       anchors, between the >>> FLIGHT and <<< FLIGHT marks, so the camera can be replayed without drawing.
//   4. build(ctx)
//        SEEDED LOOK      mood, weather, season, cast, counts (ctx.vary.density, ctx.quality.detail)
//        PATH             routePoints (FLIGHT) from the hero's anchors (archAxis, helixAt) -> makePath; key u values (U.*) from flightKeys
//        SKY + FOG        kit sky (storm deck with a brass slot as the scatter term), FogExp2, scud, the squall shell (the
//                         brief's near-black slate #12161C laid over sky and scud to the south and east, by bearing), four
//                         broad god rays that lean out of the slot (their source stands up-sun of the stack, under the deck's edge)
//        HERO             buildHero at the origin (its local space is the brief's world space)
//        SEA              Water.makeSea (storm retuned), shallows on the skirt and skerries, underwater below. THE SEA'S OWN
//                         MAIN (flag `seaMain`; see SEA_MAIN_GLSL): the kit's ocean fragment main is replaced by this
//                         world's copy of it (water.js as of s0x, 10 Oct), word for word but for two cures at a flat look
//                         (the mirror, the lace), only where the 22 names it checks stand in the kit's shader text (not
//                         every name the main reads is checked: uTime, NW, fogColor, uDepthRect, uDepthTex and uLand are
//                         read and are not among the 22); where
//                         one is missing nothing of it is set and the sea is the kit's own with the replaces of before,
//                         whole. Four earlier changes stand in both cases, written into
//                         that main or, in the fall back, made as string replaces on the kit's shaders (the spray's is a
//                         replace in either case), each with a fallback and a flag: the ocean's colour is clamped at
//                         zero (`seaClamp`); how hard a wave must fold before it foams follows the water's own distance
//                         from the stack (`seaPlace`); where a god ray's line meets the sea the water itself is lit, a
//                         soft broken pool that multiplies the ocean's own colour (`seaPools`); and the kit's wind-blown
//                         spray is thrown only within 225 to 300 m of the stack (`seaCalm`).
//                         THE SWELL: the kit's two longest waves are replaced by SWELL (FLIGHT): the brief's swell (6 m,
//                         110 m apart, north at 13 m/s) and a 73 m train that beats with it, each at the phase the kit
//                         drew for that wave from the 'sea' fork. They run on the world's clock everywhere; seaY is the
//                         surface as drawn (trawler, veil, the bait ball's rule)
//        BIRDS            near flyers (by zone: run-in, north foot, beside the climb, crest, hang), 12 landers coming
//                         in to the ledges beside the climb, rafts all along the run-in that flush as the lens reaches
//                         them, seven birds that cross the run-in's line low over the swell on the world's clock,
//                         escorts (the thirty companions, each dealt a station 5 to
//                         20 m ahead and 4.6 to 13.4 m to one side of the path's line, + the skua chase), divers and
//                         their strikes (plus strike-only instances that fill the boil)
//        THE BOIL         wreath decal + eye (our own image of the portal on the surface); the bait ball, 15 m across, 20 m
//                         beyond the ring and 19 m left of it, upright, 2000 small fish round a dark heart of its own
//        BACKDROP         trawler (the world's only lamp), skerries, kittiwakes, fulmars, guillemots, seals
//        WEATHER / RARE   rain curtain (due east) + the rainbow's foot on it (at the bearing the sun gives), haar, minke
//                         whale (heading, lean and roll from its own stream 'minke:' + seed) with its collar of white water
//                         and the birds it flushes (ctx.vary.rare), spray haze over the boil (thinned by the eye's height
//                         and distance, never switched)
//        return           pace(u), camera, pois (all three from FLIGHT), portal, post (exposure, bloom, grade per mood; no vignette), update, dispose
//
// WHERE THINGS ARE SET
//   path: routePoints (FLIGHT). The run-in is level at 7.6 m, due north, and the swell heaves under it; it rises to 11 m
//   for the arch. The north foot is rounded on one even arc of about 40 m radius from just north of the arch to the
//   foot of the helix (its radius and end follow from the helix's first point). The climb is the hero's helix; the crest
//   swings out from the summit to the hang: 82 m straight and level at 208 m on bearing 32 (north-north-east), ending
//   where the 90 m nose-over arc begins; the arc curls 6 degrees to port onto the line of the fall (bearing 25.5,
//   62 degrees down, 202 m).
//   pace and pois: flightPlan (FLIGHT). The pace is the brief's, hung on the route's anchors (U.*). The gaze is six
//   pois, each one plain window with wide fades (half a second and more), none over 1: the arch on the run-in; the
//   stack's foot round the north side; the face beside the climb; the summit floor over the crest; and, over the hang,
//   the tip-over and the fall, TWO LOOKS AT POINTS OF THE WORLD (the designers' ruling on the fall, 10 Oct). Each aim is
//   a fixed place, each window is typed by the path's own marks, and both are the same on every seed and for the whole
//   stretch. THE WREATH: the boil's middle on the sea, weight 1, from the back of the crest to half way down the fall
//   (the boil lies dead ahead on the hang's heading and the fall's line passes through it, so from U.fall0 this look IS
//   the fall's line). THE FAR SEA BEYOND IT: a point of the sea 700 m further out on the fall's own heading, weight
//   0.55, laid over the first: it holds the gaze up over the back of the crest and the first two fifths of the level
//   leg, so that the horizon stands behind the wreath, and has let go by four fifths of the leg. Neither aim is worked
//   out from u, a lens or a picture. (Live's one pull, whose aim was worked out from u to lay the wreath beside a
//   mount, is gone.)
//   hero placement: "HERO" (origin, no rotation).
//   exposure / bloom / grade: MOODS[*].exposure and the post block in the return. fog: MOODS[*].fog / fogD.
//   scripted moments (keyed to the flight's own anchors U.*, or to where the lens is):
//     arch detonation      hero.setBurst(p) from U.burst0..U.burst1 (elsewhere the arch bursts as each crest of the long
//                          swell reaches the south-west pier, every 8.5 s at the seed's phase; no new burst starts just
//                          before the scripted one); fog ramp through the veil via `air`
//     rafts flush          none: TRAJ.raft puts each bird up when the lens is 34 m short of it (those within 11 to 21 m of our line)
//     skua chase           escort uniform uEsc.z (presence), U.chase0..U.chase1: stations inside our turn, in the path's frame
//     companions           uEsc.x (presence, from the crest), uEsc.y (fold: 0 on the hang, 1 as the nose goes over, 2 spear
//                          from 30 m above the sea). They fly in the frame of the PATH (its heading at u) beside us, each
//                          at its station (iA) on its own small weave, to the water and under; uEsc.w sinks them under
//                          the path's level on the hang, by the dip of the gaze under the path;
//                          uPart opens the right wing while the whale is up
//     surface veil         veil material uA, from the eye's height over the surface as it stands (seaY): 3.9 m above to 2.9 m below
//     rafts / divers       rafts are drawn until just inside the arch, divers and strikes after (never both)
//     boil from above      strike uGrow and the wreath's uEyeNear follow the eye's height
//     bait ball            drawn when the eye is under the surface (or within 6 m over it) and within 160 m of the ball:
//                          from higher up the sea hides it, from further off the water's own haze does
//     minke whale (rare)   whale.position / quaternion (up along its own heading, 8 m clear), splash uPlume, flush uFlush,
//                          the wreath's uHole and uBack from U.whale0 (a quarter of the way down the fall)
//   on the world's clock (time): sea and swell, sky, scud, tower, ledge birds, near flyers, crossers, divers +
//   strikes, wreath, eye pulse, trawler, the companions' weave, the pools of light under the shafts, the arch's
//   bursts away from our pass (by way of the swell).
import * as THREE from 'three';
import { makePath, clamp, lerp, smoothstep } from '../kit/core.js';
import { makeSky, makeCloudField, skyDirection } from '../kit/sky.js';
import * as Water from '../kit/water.js';
import * as F from '../kit/fauna.js';
import * as FX from '../kit/fx.js';
import { buildHero, LIGHT_GLSL } from '../parts/gannet-stack-gale.js';

const TAU = Math.PI * 2;
const PALETTE = ['#12161C', '#3B4650', '#1D564E', '#2E9A7E', '#F4F0E4', '#E3B04B', '#7FE6C8'];
const BOIL = new THREE.Vector3(174, 0, -207), PORTAL = new THREE.Vector3(178, -18, -215);
const TRAWLER = new THREE.Vector3(292, 0, -128);

// ---------------------------------------------------------------- 1. MOODS (hour)
// slot: the band of light along the horizon from west round to north. key: the low north-west light. sky / shade:
// ambient from above / below (shadows stay slate-green, never black). fog: spray haze.
const MOODS = {
  golden: {
    zenith: '#262a2c', mid: '#373c3d', horizon: '#5c6057', ground: '#1a2126', slot: '#E9D9A8', slotK: 1.0, slotPow: 3.2, slotFall: 10, seaAmb: '#98a8a5',
    cloudLit: '#9a9888', cloudShade: '#2b3033', coverage: 0.9, key: '#FFE9C4', keyK: 1.22, sky: [0.3, 0.38, 0.42], shade: [0.13, 0.19, 0.195],
    fog: '#56636A', fogD: 0.0011, deep: '#2a5e56', scatter: '#3f9c7e', foam: '#e9efe9', water: '#0c4a3e', waterDeep: '#03181a',
    rays: '#f1dca6', rayK: 0.5, exposure: 1.22, tint: '#fff6e8', shadowTint: '#0a1416', sat: 1.02, glow: '#000000', moon: false,
  },
  dawn: {
    zenith: '#232528', mid: '#34353a', horizon: '#57555a', ground: '#16181f', slot: '#F2E6A6', slotK: 0.95, slotPow: 3.4, slotFall: 7, seaAmb: '#9897a6',
    cloudLit: '#9c8a8c', cloudShade: '#2a2c2f', coverage: 0.88, key: '#FFD3C4', keyK: 1.12, sky: [0.25, 0.29, 0.37], shade: [0.11, 0.125, 0.16],
    fog: '#5a5863', fogD: 0.0011, deep: '#2c6264', scatter: '#3fa292', foam: '#efe6e6', water: '#0b443f', waterDeep: '#03151a',
    rays: '#f6c9b8', rayK: 0.42, exposure: 1.3, tint: '#fff2f0', shadowTint: '#0b1215', sat: 1.08, glow: '#000000', moon: false,
  },
  day: {
    zenith: '#2a2f30', mid: '#3f4646', horizon: '#737b78', ground: '#262c2b', slot: '#E3E5DC', slotK: 0.8, slotPow: 2.5, slotFall: 5, seaAmb: '#aab6b0',
    cloudLit: '#b2b8b4', cloudShade: '#2a302f', coverage: 0.7, key: '#F4F3EA', keyK: 1.3, sky: [0.36, 0.4, 0.4], shade: [0.14, 0.18, 0.17],
    fog: '#6f7a78', fogD: 0.001, deep: '#2b665a', scatter: '#4f9480', foam: '#f0f3ee', water: '#0f5145', waterDeep: '#041d1a',
    rays: '#e9ebea', rayK: 0.5, exposure: 1.12, tint: '#fbfbf6', shadowTint: '#0a1517', sat: 1.06, glow: '#000000', moon: false,
  },
  // night: a full moon in the slot. The night changes the light and not the place. The moon's key is silver with a
  // faint cool cast (slot, key, rays: as they were). No number below is fitted to a picture: each comes from a rule,
  // and where a rule has a number it was counted headless over the whole field, as said with it.
  //   THE SKY (zenith, mid, horizon, cloudLit, cloudShade): the deck is slate cloud as by day (as numbers its zenith and
  //     shaded side are lighter than every other hour's: the lines below say why), and it
  //     spans the design's own two sky slates as the night's grade shows them. zenith is the scene colour that reaches
  //     the screen as the near-black slate #12161C; cloudLit, the deck's moonlit side, the one that reaches it as the
  //     slate #3B4650; cloudShade, mid and horizon stand between those two where the golden hour's stand, by
  //     luminance, between its own zenith and lit cloud (0.021, 0.074 and 0.315 of the way). Why: the post shows a
  //     linear value under about 0.03 as pure black. The golden hour's deck colours lie under that too, but its wide
  //     slot light lifts the whole dome over it; the moon's is narrow (slotPow 6, halo 0.1), so with the deck under
  //     the toe the sky was blotches of pure black wherever the moon's glow did not reach: 21 to 33 % of the dome,
  //     now none. That share is counted over the whole dome as it is drawn (the scud and the squall shell with it):
  //     48 bearings x 30 heights from the horizon to the zenith, from eyes 7.6 and 208 m up at twelve places 150 and
  //     300 m round the stack, four moments. Never blue: as numbers every sky colour is a near-neutral slate (no
  //     channel differs from another by more than 8 of 255); on the screen they are the design's slates. The cloud
  //     is palest toward the moon (the slot's own numbers) and darkens away from it.
  //   THE SEA (deep, scatter, glow). deep is the design's bottle green #1D564E by night: the scene colour the night's
  //     grade shows as that green, mixed 0.055 of the way to the one it shows as the slate-green shadow #26363A,
  //     divided channel by channel by the night's light on level water where the key only grazes (seaAmb x .9 + key
  //     x keyK x .16: the kit ocean's own body term), times 0.599. The two numbers are the least that keep two rules:
  //     0.599, that no more of the sea reaches the screen pure black than in the golden hour (2.2 % against 2.3 %), so
  //     the sea is as dark as "never black" lets it be (0.86 of the golden hour's sea on the screen); 0.055, that
  //     clear water is no more saturated on the screen than the golden hour's clear water ((max - min) / max of its
  //     mean colour: 0.71 in both; before, 0.88). Both are counted over the whole field: every bearing and every
  //     depression under the horizon, from eyes 7.6 to 208 m up at twelve places 150 and 300 m round the stack, four
  //     moments, three night seeds pooled against three golden ones, with the sky above in place (the sea mirrors
  //     it). As NUMBERS the body is lighter and greyer than the golden hour's because the night's light is weaker and
  //     the grade's toe steeper; on the screen clear water is a dark bottle green (about 15 53 50 of 255).
  //     scatter is the golden hour's own number: the crest glass is the place's, and the moon's silver lights it.
  //     glow is none, as in every other hour: the only green that glows by night is the plunge trails (trail).
  //   fog: the design's haze (the golden hour's #56636A) times the night's sky triple over the golden hour's, channel
  //     by channel: the haze stands to the ambient from above as it does in the gale.
  night: {
    zenith: '#343535', mid: '#353637', horizon: '#393a3c', ground: '#0c0f0f', slot: '#b4bcc6', slotK: 0.75, slotPow: 6, slotFall: 8, seaAmb: '#6a766e',
    cloudLit: '#414549', cloudShade: '#353536', coverage: 0.86, key: '#D6DCE8', keyK: 0.95, sky: [0.175, 0.2, 0.205], shade: [0.078, 0.1, 0.098],
    fog: '#42484b', fogD: 0.0012, deep: '#576f6a', scatter: '#3f9c7e', foam: '#d2d9d6', water: '#0a3d2d', waterDeep: '#03140e',
    rays: '#c9d0d8', rayK: 0.34, exposure: 1.75, tint: '#f4f6f8', shadowTint: '#0a0c0e', sat: 1.0, glow: '#000000', trail: '#0b5a44', moon: true,
  },
};

// ---------------------------------------------------------------- 2. GEOMETRY
// A flying gannet, 0.95 m long and 1.8 m across at unit size. +Z bill, +Y up. aW = (side, span 0..1, chord offset):
// the vertex shader rebuilds each wing from these, so one model flaps, glides, half-closes to a W and folds to a spear.
function gannetGeometry(lander = false) {
  const cream = new THREE.Color(PALETTE[4]).multiplyScalar(0.86), saff = new THREE.Color(PALETTE[5]); saff.setRGB(saff.r * 0.98, saff.g * 0.8, saff.b * 0.5);
  const black = new THREE.Color(0.02, 0.02, 0.025), bill = new THREE.Color(0.36, 0.45, 0.52);
  const P = [], N = [], C = [], W = [], I = [];
  const v = (x, y, z, nx, ny, nz, c, sx = 0, s = 0, ch = 0) => { P.push(x, y, z); N.push(nx, ny, nz); C.push(c.r, c.g, c.b); W.push(sx, s, ch); return P.length / 3 - 1; };
  const rings = [[-0.47, 0.055, 0.008, cream, cream], [-0.3, 0.05, 0.045, cream, cream], [-0.12, 0.085, 0.08, cream, cream], [0.06, 0.092, 0.088, cream, cream],
    [0.2, 0.07, 0.068, cream.clone().lerp(saff, 0.35), cream], [0.29, 0.046, 0.046, saff, cream.clone().lerp(saff, 0.5)], [0.35, 0.052, 0.05, saff, saff], [0.4, 0.032, 0.034, bill, bill]];
  const R = [];
  for (const [z, rx, ry, ct, cb] of rings) {
    const ring = [];
    for (let k = 0; k < 6; k++) { const a = (k / 6) * TAU + Math.PI / 6, cx = Math.cos(a), sy = Math.sin(a); ring.push(v(cx * rx, sy * ry, z, cx, sy, 0, sy > -0.2 ? ct : cb)); }
    R.push(ring);
  }
  for (let r = 0; r + 1 < R.length; r++) for (let k = 0; k < 6; k++) { const k1 = (k + 1) % 6; I.push(R[r][k], R[r + 1][k1], R[r][k1], R[r][k], R[r + 1][k], R[r + 1][k1]); }
  const tip = v(0, -0.004, 0.535, 0, 0, 1, bill.clone().multiplyScalar(0.8));
  for (let k = 0; k < 6; k++) I.push(R[R.length - 1][k], tip, R[R.length - 1][(k + 1) % 6]);
  // wing stations: span 0..1, leading and trailing chord offsets, how black the leading and trailing edges are
  const st = [[0, 0.1, -0.12, 0, 0], [0.25, 0.09, -0.11, 0, 0], [0.5, 0.07, -0.1, 0, 0],
    [0.62, 0.06, -0.09, 0.7, 1], [0.82, 0.04, -0.065, 1, 1], [1, 0.012, -0.02, 1, 1]];
  for (const sx of [-1, 1]) {
    const rows = [];
    for (const [s, lead, trail, kl, kt] of st) {
      const x = sx * (0.07 + 0.9 * s);
      rows.push([v(x, 0.02, 0.05 + lead, 0, 1, 0, cream.clone().lerp(black, kl), sx, s, lead), v(x, 0.02, 0.05 + trail, 0, 1, 0, cream.clone().lerp(black, kt), sx, s, trail)]);
    }
    for (let r = 0; r + 1 < rows.length; r++) I.push(rows[r][0], rows[r][1], rows[r + 1][1], rows[r][0], rows[r + 1][1], rows[r + 1][0]);
  }
  if (lander) { // coming in to land: tail fanned as a brake, grey webbed feet reaching down
    const grey = new THREE.Color(0.2, 0.22, 0.23), t0 = v(0, 0.01, -0.36, 0, 1, 0, cream), fan = [];
    for (let k = 0; k <= 4; k++) { const a = (k / 4 - 0.5) * 1.5; fan.push(v(Math.sin(a) * 0.3, -0.03, -0.42 - Math.cos(a) * 0.3, 0, 1, 0, cream.clone().multiplyScalar(k % 2 ? 0.82 : 1))); }
    for (let k = 0; k < 4; k++) I.push(t0, fan[k], fan[k + 1]);
    for (const sx of [-1, 1]) {
      const a = v(sx * 0.045, -0.05, -0.12, sx, 0, 0, cream), b = v(sx * 0.05, -0.2, -0.05, sx, 0, 0, grey), c = v(sx * 0.12, -0.27, 0.07, 0, 0, 1, grey), d = v(sx * 0.015, -0.27, 0.08, 0, 0, 1, grey), e = v(sx * 0.04, -0.07, -0.2, sx, 0, 0, cream);
      I.push(a, b, e, b, c, d);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(P), 3));
  g.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(N), 3));
  g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(C), 3));
  g.setAttribute('aW', new THREE.BufferAttribute(new Float32Array(W), 3));
  g.setIndex(I);
  return g;
}

// A seal (or, with a fin, a dolphin): a mottled spindle 2.4 m long. Same attributes as the gannet (no wings).
function swimmerGeometry(rng, dolphin) {
  const top = new THREE.Color(dolphin ? '#2c3338' : '#3c4144'), belly = new THREE.Color(dolphin ? '#aeb6b8' : '#8a8d88');
  const P = [], N = [], C = [], W = [], I = [], k0 = dolphin ? 0.78 : 1;
  const v = (x, y, z, nx, ny, nz, c) => { P.push(x, y, z); N.push(nx, ny, nz); C.push(c.r, c.g, c.b); W.push(0, 0, 0); return P.length / 3 - 1; };
  const prof = [[-1.2, 0.03], [-0.95, 0.11], [-0.5, 0.25], [0, 0.33], [0.45, 0.3], [0.75, 0.2], [0.95, 0.16], [1.1, 0.11], [1.2, 0.03]], R = [];
  for (const [z, r] of prof) {
    const ring = [];
    for (let k = 0; k < 8; k++) {
      const a = (k / 8) * TAU, cx = Math.cos(a), sy = Math.sin(a), m = rng.range(0.75, 1.15);
      ring.push(v(cx * r * k0, sy * r * k0 * 0.9, z, cx, sy, 0, top.clone().lerp(belly, smoothstep(0.1, -0.5, sy)).multiplyScalar(m)));
    }
    R.push(ring);
  }
  for (let r = 0; r + 1 < R.length; r++) for (let k = 0; k < 8; k++) { const k1 = (k + 1) % 8; I.push(R[r][k], R[r + 1][k1], R[r][k1], R[r][k], R[r + 1][k], R[r + 1][k1]); }
  const fl = (x0, y0, z0, x1, y1, z1, x2, y2, z2) => { const a = v(x0, y0, z0, 0, 1, 0, top), b = v(x1, y1, z1, 0, 1, 0, top), c = v(x2, y2, z2, 0, 1, 0, top); I.push(a, b, c); };
  fl(0, 0, -1.15, 0.34, 0.02, -1.5, 0.05, 0, -1.48); fl(0, 0, -1.15, -0.34, 0.02, -1.5, -0.05, 0, -1.48);       // hind flippers / flukes
  fl(0.24, -0.1, 0.4, 0.62, -0.2, 0.2, 0.26, -0.12, 0.15); fl(-0.24, -0.1, 0.4, -0.62, -0.2, 0.2, -0.26, -0.12, 0.15);
  if (dolphin) fl(0, 0.2, 0.05, 0, 0.6, -0.3, 0, 0.21, -0.4);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(P), 3));
  g.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(N), 3));
  g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(C), 3));
  g.setAttribute('aW', new THREE.BufferAttribute(new Float32Array(W), 3));
  g.setIndex(I);
  return g;
}

// Non-indexed coloured triangles for the lit material (facet normals come from derivatives in the shader).
function soup() {
  const P = [], C = [];
  const tri = (a, b, c, col) => { P.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2]); for (let k = 0; k < 3; k++) C.push(col.r, col.g, col.b); };
  const quad = (a, b, c, d, col) => { tri(a, b, c, col); tri(a, c, d, col); };
  const box = (cx, cy, cz, w, h, d, col, taper = 1) => {
    const x = w / 2, z = d / 2, xt = x * taper, zt = z * taper, y0 = cy - h / 2, y1 = cy + h / 2;
    const b = [[cx - x, y0, cz - z], [cx + x, y0, cz - z], [cx + x, y0, cz + z], [cx - x, y0, cz + z]], t = [[cx - xt, y1, cz - zt], [cx + xt, y1, cz - zt], [cx + xt, y1, cz + zt], [cx - xt, y1, cz + zt]];
    for (let k = 0; k < 4; k++) quad(b[k], b[(k + 1) % 4], t[(k + 1) % 4], t[k], col);
    quad(t[0], t[1], t[2], t[3], col); quad(b[3], b[2], b[1], b[0], col);
  };
  const build = () => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(P), 3));
    g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(C), 3));
    g.computeBoundingSphere();
    return g;
  };
  return { tri, quad, box, build };
}

// A 28 m side trawler: rust-streaked dark green hull with sheer, bulwarks, white wheelhouse aft, funnel, gallows, mast.
function trawlerGeometry(rng) {
  const S = soup(), green = new THREE.Color('#1c3a31'), rust = new THREE.Color('#6b3a22'), boot = new THREE.Color('#3c1a14');
  const white = new THREE.Color('#d8d6cc').multiplyScalar(0.8), deck = new THREE.Color('#3a3630'), dark = new THREE.Color('#15181a');
  const st = [[-14, 2.3, 2.3], [-12.5, 3.2, 2.2], [-8, 3.6, 2.1], [0, 3.7, 2.1], [6, 3.3, 2.5], [10.5, 2.1, 3.1], [13, 0.9, 3.6], [14.2, 0.06, 3.9]];
  const sec = (z, b, dy, sx) => [[0, -1.6, z], [sx * b * 0.72, -1.1, z], [sx * b, 0.25, z], [sx * b * 1.03, dy, z], [sx * b * 0.95, dy, z], [sx * b * 0.95, dy - 0.9, z], [0, dy - 0.9, z]];
  for (const sx of [-1, 1]) for (let k = 0; k + 1 < st.length; k++) {
    const a = sec(st[k][0], st[k][1], st[k][2], sx), b = sec(st[k + 1][0], st[k + 1][1], st[k + 1][2], sx);
    for (let j = 0; j + 1 < a.length; j++) {
      const col = j === 0 ? boot : j === 1 ? boot.clone().lerp(green, 0.5) : j === 2 ? green.clone().lerp(rust, rng() < 0.45 ? rng.range(0.3, 0.8) : 0.05) : j === 5 ? deck : j === 4 ? green.clone().multiplyScalar(0.7) : green;
      if (sx > 0) S.quad(a[j], b[j], b[j + 1], a[j + 1], col); else S.quad(a[j], a[j + 1], b[j + 1], b[j], col);
    }
  }
  { const z = -14, b = 2.3, dy = 2.3; S.quad([-b, 0.25, z], [b, 0.25, z], [b * 1.03, dy, z], [-b * 1.03, dy, z], green.clone().lerp(rust, 0.3)); S.quad([-b * 0.72, -1.1, z], [b * 0.72, -1.1, z], [b, 0.25, z], [-b, 0.25, z], boot); }
  S.box(0, 2.9, -7, 4.6, 3.0, 5.2, white); S.box(0, 4.55, -7, 5.2, 0.3, 5.9, deck);                 // wheelhouse and its roof
  S.box(0, 3.3, -4.38, 3.8, 0.8, 0.06, dark); S.box(2.32, 3.3, -6.6, 0.06, 0.8, 3.4, dark);         // dark windows (the lit one is its own mesh)
  S.box(0, 5.6, -8.2, 1.3, 2.2, 1.5, new THREE.Color('#5a2a1c'), 0.85); S.box(0, 6.5, -8.2, 1.2, 0.4, 1.4, dark, 0.95);   // funnel
  S.box(0, 6.6, 5.5, 0.55, 9.5, 0.55, deck, 0.6); S.box(0, 6.0, 3.6, 0.4, 0.4, 4.4, deck);         // foremast and derrick
  S.box(-2.6, 3.9, 2.2, 0.5, 4.2, 0.5, dark, 0.8); S.box(-2.6, 3.9, -2.2, 0.5, 4.2, 0.5, dark, 0.8); S.box(-2.6, 5.9, 0, 0.45, 0.45, 5.0, dark);   // gallows on the working side
  S.box(0.6, 1.9, 1.2, 2.4, 1.3, 1.8, rust.clone().multiplyScalar(0.8)); S.box(0, 1.6, 8.5, 2.2, 0.9, 2.6, deck);     // winch, fo'c'sle hatch
  S.box(1.4, 1.75, -11.6, 1.6, 0.9, 2.2, new THREE.Color('#7a5a22'));                                   // fish boxes aft
  return S.build();
}

// A low skerry: black rock with a whitewashed crown.
function skerryGeometry(rng, noise, R, Hh, ox) {
  const S = soup(), rock = new THREE.Color('#2A2C2E').multiplyScalar(1.3), white = new THREE.Color(PALETTE[4]).multiplyScalar(0.6);
  const NR = 6, NS = 16, pt = (i, j) => {
    const a = (j / NS) * TAU, f = i / NR, r = R * f * (0.75 + 0.35 * noise.n2(Math.cos(a) * 1.3 + ox, Math.sin(a) * 1.3));
    const h = Hh * Math.pow(1 - f, 0.8) * (0.7 + 0.5 * noise.n2(Math.cos(a) * 2.1 * f + ox, Math.sin(a) * 2.1 * f + 7)) - 2.5 * f * f;
    return [Math.cos(a) * r * 1.5, h, Math.sin(a) * r];
  };
  for (let i = 0; i < NR; i++) for (let j = 0; j < NS; j++) {
    const a = pt(i, j), b = pt(i + 1, j), c = pt(i + 1, j + 1), d = pt(i, j + 1), top = (a[1] + c[1]) * 0.5 / Hh;
    S.quad(a, d, c, b, rock.clone().lerp(white, clamp(smoothstep(0.35, 0.8, top) * rng.range(0.5, 1.1), 0, 1)).multiplyScalar(rng.range(0.8, 1.1)));
  }
  return S.build();
}

// The minke's head and chest as it lunges: slate above, cream throat with dark pleats below, pale flipper bands.
// 13 m long, +Z rostrum. Indexed, with its own smooth normals (litMaterial's smooth variant).
function whaleGeometry() {
  const back = new THREE.Color('#3d4850'), flank = new THREE.Color('#66757d'), lipC = new THREE.Color('#0c0f11'), throat = new THREE.Color('#d9d6c8').multiplyScalar(0.84), pleat = new THREE.Color('#39413f'), jawC = new THREE.Color('#e2dfd2').multiplyScalar(0.9);
  const prof = [[6.5, 0.04], [6.2, 0.27], [5.6, 0.52], [4.6, 0.86], [3.3, 1.26], [1.6, 1.62], [0, 1.76], [-1.6, 1.72], [-3.2, 1.5], [-5, 1.1], [-6.5, 0.5]], NS = 36;
  const P = [], C = [], I = [];
  for (let k = 0; k < prof.length; k++) for (let j = 0; j < NS; j++) {
    const [z, r] = prof[k], a = (j / NS) * TAU, sy = Math.sin(a), cx = Math.cos(a), under = smoothstep(0.05, -0.35, sy);
    const bulge = 1 + 0.22 * under * smoothstep(-5, 2, z) * smoothstep(6.5, 3.5, z);            // the throat distended with water
    P.push(cx * r * (1 + 0.08 * under), sy * r * (sy < 0 ? 1.12 * bulge : 0.8), z);
    const groove = under * smoothstep(-4.5, -2, z) * smoothstep(6.2, 5, z) * (j % 2);        // ventral pleats: every other meridian dark
    const lip = (1 - smoothstep(0, 0.1, Math.abs(sy + 0.02))) * smoothstep(1.2, 2.8, z);                 // the line of the jaw
    const jaw = (1 - smoothstep(0.05, 0.15, Math.abs(sy + 0.17))) * smoothstep(0.6, 2.2, z);                      // the pale edge of the lower jaw, under the dark lip
    const c = back.clone().lerp(flank, smoothstep(0.5, -0.05, sy) * 0.8).lerp(throat, under).lerp(pleat, groove * 0.8).lerp(jawC, jaw * 0.9).lerp(lipC, lip * 0.85);
    C.push(c.r, c.g, c.b);
  }
  for (let k = 0; k + 1 < prof.length; k++) for (let j = 0; j < NS; j++) { const a = k * NS + j, b = k * NS + (j + 1) % NS, c = a + NS, d = b + NS; I.push(a, c, b, b, c, d); }
  const fin = (sx) => { // a flipper: dark with the minke's white band
    const n0 = P.length / 3, white = new THREE.Color('#d6dbd8').multiplyScalar(0.8);
    const pts = [[1.45, -0.55, 2.2, back], [1.5, -0.6, 0.3, back], [3.0, -1.0, 1.3, white], [3.0, -1.05, 0.0, white], [4.7, -1.45, -0.9, back]];
    for (const [x, y, z, c] of pts) { P.push(sx * x, y, z); C.push(c.r, c.g, c.b); }
    I.push(n0, n0 + 1, n0 + 2, n0 + 1, n0 + 3, n0 + 2, n0 + 2, n0 + 3, n0 + 4);
  };
  fin(1); fin(-1);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(P), 3));
  g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(C), 3));
  g.setIndex(I); g.computeVertexNormals(); g.computeBoundingSphere();
  return g;
}

// ---------------------------------------------------------------- 3. GLSL
// The kit ocean's eight geometry waves, read from its own uniforms, so that birds, seals, foam and plumes sit on the
// surface the ocean really draws (far-field filter and the stack's shoal damping included).
const SEA_GLSL = /* glsl */`
uniform vec4 uWA[18], uWB[18]; uniform float uSeaT, uSpacing, uR0, uSeaRad; uniform vec3 uSeaC; uniform vec4 uShoal;
vec3 gsDisp(vec2 xz) {
  float r = length(xz - uSeaC.xz), sp = (r + uR0) * uSpacing; vec3 d = vec3(0.);
  for (int i = 0; i < 8; i++) { vec4 a = uWA[i], b = uWB[i]; float f = smoothstep(2., 4.5, b.w / max(sp, 1e-4));
    float th = a.z * dot(a.xy, xz) - a.w * uSeaT + b.z; float c = cos(th), s = sin(th);
    d.xz += a.xy * (b.y * b.x * c * f); d.y += b.x * s * f; }
  d *= 1. - smoothstep(.3 * uSeaRad, .8 * uSeaRad, r);
  d *= mix(uShoal.w, 1., smoothstep(0., 1., (length(xz - uShoal.xy) - uShoal.z) / 30.));
  return d;
}
float gsSeaY(vec2 xz) { vec2 p = xz; for (int k = 0; k < 3; k++) { vec3 d = gsDisp(p); p += (xz - d.xz - p) * .85; } return gsDisp(p).y; }`;
const NOISE2_GLSL = /* glsl */`
float h21(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * .1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
float vn(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(h21(i), h21(i + vec2(1., 0.)), f.x), mix(h21(i + vec2(0., 1.)), h21(i + vec2(1., 1.)), f.x), f.y); }`;
const FOGF_GLSL = /* glsl */`
float gsFog() {
  #ifdef FOG_EXP2
    return 1. - exp(-fogDensity * fogDensity * vFogDepth * vFogDepth);
  #else
    return 0.;
  #endif
}`;
// THE SEA'S OWN MAIN (the polish round; ORDER 5: LIVE'S SEA WHOLE, WITH TWO CURES AT A FLAT LOOK). A COPY OF THE KIT'S MAIN: water.js as of
// s0x, 10 Oct (OCEAN_FRAG from its `void main(){` to its end, comments and all; the kit's file of s0x is md5 256086e7ebb6b937f8a90bdac512fe8a),
// WORD FOR WORD but for what is listed here. ONLY THE FRAGMENT MAIN IS THE WORLD'S: the vertex shader (the surface the birds ride and the flock
// rules read), the uniforms, the depth map, the underside, the waves, the ripples, the foam's amount, the horizon's fade, the fog's line and
// the tone curve (the renderer's) are the kit's; so are its sky, its noises and its head. What differs from the kit's main:
//  - this world's three earlier replaces on the ocean's shader, written in with the words the fall back sets as string replaces: the colour
//    clamped at zero, the sea state by place (uOpenSea), the pools of light (gsPool);
//  - CURE 1, THE MIRROR READS NO FACE THE EYE CANNOT SEE. The kit shades every ripple's face, also the ones turned from the eye more steeply
//    than the look itself: on a real sea those lie hidden behind the crest before them. Drawn, each was a full mirror of the low sky: flat
//    grey or brown patches drawn out across the picture, the smear of a low look. The face the mirror reads leans from the eye by GS_MK of
//    the look's own angle at most (see the lines in the main); the light on the water, the sun's glints and the foam read the kit's own face.
//    The limit acts at every look angle, less and less as the look steepens (at 45 degrees a lean of 0.2 from the eye is read as 0.17):
//    from above next to nothing changes;
//  - CURE 2, THE LACE AT A FLAT LOOK (gsLace, see it): a wall of the lace is softened by the pixel's footprint along that wall's own normal;
//    where the fine lace is smaller than the footprint it is not there (open water), and where the large lace is, the patch keeps its
//    own outline, crisp (the kit drew a smooth grey film in both cases; so far foam thinner than GS_C0 is not drawn where the large
//    lace is under the footprint: the kit drew a grey mean there); the foam's inner texture (bubbles, crust, veins) is drawn
//    by the mean of the footprint's two axes, not by the long one. From above the two axes are one, both sizes are drawn, and nothing changes.
// What orders 2 to 4 of this round put into this main (the ripples as texture on the form and the ripples along the look, the grain, the
// bubbles' cloud, the wash of old foam, the third lace, the sided shade, the second train in the shading) IS TAKEN OUT: in the real picture
// beside live it read as lumps, milky blobs and ruled lines.
// Both cures read the place of the eye over the water (V, and the footprint of one pixel there) and never where the camera faces (section
// 153): the same on every seed, at every pace and whichever way the camera is turned. The footprint is that of the picture's own pixel, as
// the kit takes it (kitPix): a finer picture draws finer lace, as in the kit. No number in them is fitted to a picture.
const SEA_MAIN_GLSL = /* glsl */`
uniform vec3 uOpenSea; uniform vec4 uPool[4]; uniform vec4 uPoolLean; uniform vec3 uPoolCol;
const float GS_MK = .6, GS_C0 = .45, GS_C1 = .6;      // the mirror's limit (a share of the look's own angle); the patch's outline where the large lace is not drawn (the foam amount it turns over)
float gsPh(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * .1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
float gsPn(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f); return mix(mix(gsPh(i), gsPh(i + vec2(1., 0.)), f.x), mix(gsPh(i + vec2(0., 1.)), gsPh(i + vec2(1., 1.)), f.x), f.y); }
vec3 gsPool(vec2 xz) {
  float m = 0., n = .5 * (gsPn(xz * .011 + uPoolLean.w * .021) - .5) + .2 * (gsPn(xz * .045 - uPoolLean.w * .05) - .5);
  for (int i = 0; i < 4; i++) { vec2 d = xz - uPool[i].xy; vec2 q = vec2(d.x * uPoolLean.y - d.y * uPoolLean.x, (d.x * uPoolLean.x + d.y * uPoolLean.y) / max(uPoolLean.z, 1.)) / max(uPool[i].z, 1.);
    m += uPool[i].w * (1. - smoothstep(.4, 1., length(q) + n)); }
  return uPoolCol * min(m, 1.25);
}
// the kit's lace at one size (kitLace, its cells and its numbers), with two changes. sc: cells to the metre; foot, pixm: one pixel on the water along the
// look and across it (m); lk: the level direction from the water to the eye, in the lace's own frame; fv: what stands where the size is not drawn.
// - A wall's edge is softened by the footprint ALONG THE WALL'S OWN NORMAL (the kit took the long footprint for every wall: at a flat look the
//   walls that run toward the eye, which the picture resolves, were blurred with the rest, and the lace was a smear drawn out across the picture).
// - Where a cell is smaller than the footprint the kit drew the lace's mean, a smooth grey film; here fv stands there.
float gsLace(vec2 p, float m, float sc, float foot, float pixm, vec2 lk, float fv) {
  float fr = foot*sc; if(fr>1.6) return fv;
  p += .13*sin(p.yx*4.7+vec2(1.3,4.1))+.06*sin(p.yx*11.3+2.);
  vec2 i = floor(p), f = fract(p), r1 = vec2(1.,0.); float d1 = 8.;
  for(int y=-1;y<=1;y++) for(int x=-1;x<=1;x++){ vec2 g = vec2(float(x),float(y)); vec2 r = g+h22(i+g)-f; float d = dot(r,r); if(d<d1){ d1 = d; r1 = r; } }
  d1 = sqrt(d1); float gl = dot(r1,lk)/max(d1,1e-4), g2 = min(gl*gl,1.);
  float r = .74*(1.-m), aa = .04+.09*(1.-m)+.6*sc*sqrt(foot*foot*g2+pixm*pixm*(1.-g2));
  float v = d1+.07*sin(p.x*17.+p.y*13.)*sin(p.y*19.-p.x*7.);
  return mix(smoothstep(r-aa, r+aa, v), fv, smoothstep(.7,1.6,fr)); }
void main(){
  vec3 toCam = cameraPosition-vWorld; float dist = length(toCam); vec3 V = toCam/dist;
  float foot = dist*kitPix()/max(abs(V.y),.03);           // pixel footprint along the view direction (m)
  #ifdef KIT_DEPTHMAP
    // sea that the depth map puts well under the land is never shaded (it is hidden by the terrain anyway)
    vec2 duv = (vXZ-uDepthRect.xy)*uDepthRect.zw;
    if(gl_FrontFacing && min(min(duv.x,duv.y),min(1.-duv.x,1.-duv.y))>0. && texture2D(uDepthTex,duv).r<-uLand) discard;
  #endif
  vec2 slope = vec2(0.); float q = 0., lost = 0.; vec3 j0 = vec3(0.), j1 = vec3(0.), j2 = vec3(0.);
  vec2 wq = vec2(vnoise(R2*vXZ*.05+uTime*.03), vnoise(R1*vXZ*.14-uTime*.05))-.5;       // bends the ripple crests
  float wq2 = vnoise(R2*vXZ*.41+uTime*.09)-.5;
  float gust = .5+vnoise(vXZ*.0065+uTime*.012)+.4*(wq.x+.5);                           // wind patches: rougher and smoother water
  int nf = gl_FrontFacing ? NF : NW+4;                    // the underside needs fewer ripples
  for(int i=0;i<NF;i++){ if(i>=nf) break; vec4 a=uWA[i], b=uWB[i];
    float ka = a.z*b.x, f0 = smoothstep(1.2,4.,b.w/foot), g = i<NW ? 1. : gust*uDetail;
    if(f0<=0.){ lost += ka*ka*.5*g*g; continue; }
    float th = a.z*dot(a.xy,vXZ)-a.w*uTime+b.z;
    int m3 = i-(i/3)*3; float e = m3==0 ? wq.x : m3==1 ? wq.y : -wq.x-wq.y;        // wave groups: crests are short, not endless lines
    if(i>=NW){ float ee = i<NW+3 ? wq.x : (i<NW+6 ? wq.y : wq2); if((i&1)==1) ee = -ee;      // each ripple train lives in its own patches, a few wavelengths across
      th += ((i&1)==0 ? wq.x : wq.y)*6.+((i&2)==0 ? wq2 : wq.y-wq2)*min(a.z*1.3,7.);       // crests wander: no ruled lines
      g *= .12+1.8*smoothstep(-.28,.28,ee); }
    else if(i>=3){ float sm = smoothstep(16.,6.,b.w);                                // short geometry waves break into groups too
      th += ((i&1)==0 ? wq.x : wq.y)*mix(1.2,5.,sm); g *= clamp(1.+mix(1.9,3.4,sm)*e,mix(.3,.08,sm),2.)*mix(1.,smoothstep(.55,1.5,gust)*1.5,sm); }   // and leave glassy slicks between the gusts
    float c=cos(th), s=sin(th), f=f0*g;
    slope += a.xy*(ka*c*f); lost += (1.-f0*f0)*ka*ka*.5*g*g;
    if(i<NW){ float qa=b.y*ka*f, qs=qa*s; q += qs; vec3 dd=vec3(a.x*a.x,a.y*a.y,a.x*a.y);
      j0 += dd*qs; j1 += dd*(qa*(s*.7648+c*.6442)); j2 += dd*(qa*(s*.0707+c*.9975)); } }      // fold now, .7 and 1.5 rad ago
  // micro ripples close to the eye
  float f1 = smoothstep(.6,3.,.9/foot), f2 = smoothstep(.6,3.,.28/foot);
  if(f1>0.){ vec3 n1 = noised(R1*vXZ*1.1+uTime*vec2(.4,.25)), n2 = noised(R2*vXZ*3.6-uTime*vec2(.55,-.4)+n1.x*1.2);
    slope += uDetail*gust*((n1.yz*R1)*.15*f1+(n2.yz*R2)*.11*f2); }
  lost += uDetail*uDetail*gust*gust*((1.-f1)*.004+(1.-f2)*.0025);
  vec3 N = normalize(vec3(-slope.x, 1.-q, -slope.y));
  if(!gl_FrontFacing){                                   // seen from below
    float net = pow(1.-min(abs(slope.x-slope.y)*3.,1.),3.);
    vec3 uc = kitUnderside(-V, -N, dist, net);
    uc = mix(uc, uUwWater, max(smoothstep(0.,.8,kitFog()), 1.-smoothstep(0.,.09,abs(V.y))));      // the far underside melts into the murk: no seam
    gl_FragColor = vec4(uc,1.);
    #include <fog_fragment>
    return; }
  float alpha = sqrt(uRough*uRough+2.*max(lost,0.));
  // CURE 1 (this world's): the mirror reads no face the eye cannot see. tl is the face's lean toward the eye (under 0: turned from it); a face
  // turned from the eye by the look's own angle or more lies hidden behind the crest before it. The lean the mirror reads never passes GS_MK of
  // that angle: it follows the face's own while that is small and closes on the limit smoothly (no flat patch). Nm is for the mirror alone.
  float pixm = foot*max(abs(V.y),.03), vl = max(length(V.xz),1e-4); vec2 lk = V.xz/vl; vec3 Nm = N;
  float tl = dot(N.xz,lk)/max(N.y,.001), te = GS_MK*max(V.y,.02)/vl;
  if(tl<0.){ float k = (te*(exp(tl/te)-1.)-tl)*N.y; Nm = normalize(vec3(N.x+lk.x*k, N.y, N.z+lk.y*k)); }
  float ndv = max(dot(Nm,V),0.);
  // reflection of the sky; rough far water tilts the mean reflection upward
  vec3 R = reflect(-V,Nm); R.y = abs(R.y); R = normalize(R+vec3(0.,alpha*.9,0.));
  vec3 refl = kitSky(R)*uReflect;
  float F = .02+.98*pow5(1.-ndv); F *= 1./(1.+alpha*1.6);
  // body colour: deep water lit by sky and sun, dark troughs, light scattering through the crests
  vec3 amb = kitAmbient(); float ndl = max(dot(N,uSunDir),0.);
  float crest = smoothstep(-.35,1.,vH);
  float toward = pow(clamp(dot(-V,uSunDir)*.5+.5,0.,1.),3.);
  vec3 body = uDeep*(amb*.9+uSunColor*(.08+.24*ndl));
  body *= mix(1., .5+.5*smoothstep(-1.,.25,vH), uContrast);
  body += uScatter*(amb*(.16+.2*uContrast)+uSunColor*(.04+.3*toward))*crest*crest*(.4+.6*clamp((1.-N.y)*14.,0.,1.))*(.3+.7*exp(-dist*.004));
  vec2 sh = kitShoal(vXZ); float shal = 1.-smoothstep(0.,1.,sh.x);
  float ft = fbm2(R1*vXZ*.33+vec2(uTime*.05,0.));
  float ring = 0.;
  if(sh.x<.6){ float lap = sin(sh.x*sh.y*.55+uTime*1.1+ft*7.)*.5+.5;                    // swash running up the shore
    ring = (1.-smoothstep(0.,.55,sh.x))*smoothstep(-.1,.04,sh.x)*smoothstep(.45,.95,lap*.6+ft*.75+(1.-smoothstep(0.,.2,sh.x))*.4); }
  body = mix(body, uShallowColor*(amb+uSunColor*(.1+.26*ndl)), shal*.62);
  vec3 gsPl = gsPool(vXZ); body *= 1. + 1.7 * gsPl; vec3 col = mix(body, refl, F);
  // sun: sharp glints up close, a glittering path far away
  vec3 spec = kitSunSpec(N,V,alpha,60.);
  float gl = kitGlitter(vXZ, dist*kitPix()*3./sqrt(max(V.y,.03)));
  spec *= mix(1., .2+9.*gl, uGlitter*smoothstep(.0,.06,alpha));
  // foam: born where the surface folds (jacobian of the gerstner displacement), ageing into lace behind the crest
  float fa = 0.;
  float J0 = (1.-j0.x)*(1.-j0.y)-j0.z*j0.z, J1 = (1.-j1.x)*(1.-j1.y)-j1.z*j1.z, J2 = (1.-j2.x)*(1.-j2.y)-j2.z*j2.z, gsFT = uFoamT-uOpenSea.z*smoothstep(uOpenSea.x,uOpenSea.y,length(vXZ)), fT = gsFT-.25*uSteep;
  float m = max(smoothstep(gsFT,fT,J0), max(smoothstep(gsFT,fT,J1)*.62, smoothstep(gsFT,fT,J2)*.36))*uFoam;
  vec2 wd = uWA[0].xy; vec2 ws = vec2(dot(vXZ,wd),dot(vXZ,vec2(-wd.y,wd.x)));
  m += uFoam*.3*smoothstep(.6,1.,crest)*smoothstep(.95,1.5,gust);                        // whitecaps flicker in the gusts
  float row = 1.-abs(2.*vnoise(ws*vec2(.014,.2)+vec2(uTime*.02,ft*1.5))-1.);              // wind rows in heavy seas
  m += uFoam*uFoam*.42*pow(row,6.)*smoothstep(-.5,.5,vH);
  m = max(m, ring);
  if(m>.004){
    vec2 fp = vXZ+wd*uTime*.3, wv = vec2(ft-.5, wq.y)*1.2;
    float mm = clamp(m*(.5+1.1*fbm2(ws*vec2(.045,.15)+vec2(uTime*.02,3.)+wv)),0.,.94);     // patchy, drawn out along the wind
    // CURE 2 (this world's): the lace by gsLace (see it); the large lace gives way to the patch's own crisp outline, the fine one to open water
    float cov = max(gsLace(fp*.42+wv, mm, .42, foot, pixm, lk, smoothstep(GS_C0,GS_C1,mm)), gsLace(R1*fp*1.5+wv*2., mm*.9, 1.5, foot, pixm, R1*lk, 0.));
    float footT = sqrt(foot*pixm);      // (cure 2) the foam's inner texture is drawn by the mean of the footprint's two axes (the kit took the long one: a patch seen at a flat look was a blank sheet)
    float dense = smoothstep(.3,.9,mm), lt = smoothstep(.5,2.5,.4/footT), lt2 = smoothstep(.5,2.5,.12/footT);
    // thick foam is marbled: wind-drawn veins of green water open through it, so a breaking crest is never a flat white sheet
    float lt0 = smoothstep(.5,2.5,2.4/footT), mar = 1.-abs(2.*fbm2(ws*vec2(.085,.3)+wv*2.2+vec2(uTime*.05,7.))-1.);
    float mar2 = 1.-abs(2.*vnoise(R1*fp*.55+wv*3.+4.)-1.);
    cov *= max(0., 1.-dense*lt0*(.8*smoothstep(.66,.95,mar)+.45*smoothstep(.72,.97,mar2)*lt));   // never below zero: where both veins cross in dense foam the cover went negative (a few dark pixels along a surf line)
    float bub = mix(.5, kitCell4(R2*fp*2.3+wv).x*1.6, lt);                                 // bubble clusters: thick foam is never a flat sheet
    float tex = (.84+.16*bub)*(.8+.4*mix(.5, fbm2(R1*fp*1.3+wv*3.), lt))*(.94+.12*mix(.5, vnoise(R1*fp*9.), lt2))*(.84+.16*crest);
    fa = cov*(.7+.3*dense)*(.9+.1*mix(1.,bub*1.6,dense));
    fa *= mix(1., mix(min(.3+1.1*fbm2(R2*fp*2.7+wv*2.),1.), 1., dense), lt);                       // flecks are ragged and uneven, not paper cut-outs
    vec3 fc = mix(mix(uScatter,uFoamColor,.5), uFoamColor, dense)*(amb+uSunColor*(.05+.2*mix(ndl,uSunDir.y,.65)))*tex;
    col = mix(col, fc, fa); }
  col += spec*(1.-fa)*(1. + 3. * gsPl * smoothstep(.05, .25, V.y));
  col += uGlow*(fa*1.5+pow(crest,4.)*.25);
  // horizon: dissolve into the sky seen in that direction
  float hf = smoothstep(uFadeA,uFadeB,length(vWorld.xz-cameraPosition.xz)); hf = hf*hf*(3.-2.*hf);
  vec3 hz = mix(kitAtmo(normalize(vec3(-V.x,.004,-V.z))), uHorizonColor, uHorizonMix);
  col = mix(col, hz, hf);
  col = max(col, 0.); gl_FragColor = vec4(col,1.);
  #ifdef USE_FOG
    gl_FragColor.rgb = mix(col, mix(fogColor, hz, hf), kitFog());
  #endif
}`;

// Trajectories: each sets C (centre), fw (heading) and the pose (bank, fold, A = beat amplitude, ph = beat phase).
const TRAJ = {
  // near flyers: straight tracks that cross the route. iA = anchor xyz, seed. iB = heading x, heading z, speed, track length
  stream: { pars: '', main: /* glsl */`
    float s = iA.w, L = iB.w, d = mod(t * iB.z + s * L * 7.3, L) - .5 * L;
    vec3 D = vec3(iB.x, 0., iB.y);
    C = iA.xyz + D * d + vec3(0., 1.6 * sin(t * .6 + s * 40.) + .8 * sin(t * 1.7 + s * 9.), 0.) + vec3(-D.z, 0., D.x) * 1.2 * sin(t * .45 + s * 23.);
    fw = normalize(D + vec3(0., .12 * cos(t * .6 + s * 40.), 0.));
    vis = 1. - smoothstep(.5 * L - 22., .5 * L, abs(d));
    bank = .3 * sin(t * .45 + s * 23. + 1.57);
    A = mix(.1, .75, smoothstep(.1, .5, sin(t * .43 + s * 20.) + .35 * sin(t * 1.1 + s * 5.))); ph = t * 22. + s * 100.;
    tint = step(fract(s * 53.7), uJuv); size = 1.25 + .25 * fract(s * 31.);` },
  // escorts, in the frame of the path at the camera. iA = offset (right, up, ahead), seed. iB = kind (0 companion,
  // 1 the harried gannet, 2 its pursuer), tint, size, lead (1 for the six that fly closest). uEsc = (companions'
  // presence, their fold, chase presence, how far the companions fly under the path's level for each metre ahead).
  // Each companion keeps its station (iA) to the water and under, on its own small weave.
  escort: { pars: 'uniform vec3 uCam, uPF, uPR, uPU, uHead; uniform vec4 uEsc; uniform float uPart;', main: /* glsl */`
    float s = iA.w, kind = iB.x, pres = kind < .5 ? uEsc.x : uEsc.z, away = (1. - pres) * (1. - pres), skew = 0.;
    vec3 o = iA.xyz;
    if (kind < .5) {
      float dive = smoothstep(.35, 1., uEsc.y), spear = clamp(uEsc.y - 1., 0., 1.);
      float calm = 1. - .7 * smoothstep(.5, 1.5, uEsc.y);
      o += vec3(.9 * sin(t * .6 + s * 30.), .6 * sin(t * .8 + s * 17.), 1.4 * sin(t * .4 + s * 9.)) * calm;
      float sg = o.x < 0. ? -1. : 1.;
      o.x += uPart * 9. * step(0., o.x); o.y += uPart * 2.5 * step(0., o.x);      // (rare) the right wing opens a window on the whale
      o.x *= 1. + 4. * away; o.y += 14. * away * (fract(s * 7.) - .2) - o.z * uEsc.w; o.z -= 26. * away * fract(s * 3.);      // uEsc.w: on the hang they fly under the path's level
      fold = uEsc.y; tint = step(fract(s * 53.7), uJuv);
      A = mix(.1, .7, smoothstep(.1, .5, sin(t * .43 + s * 20.))); ph = t * 22. + s * 100.;
      bank = .2 * sin(t * .6 + s * 30. + 1.57) + (-sg * (.95 + .7 * (fract(s * 13.) - .5)) + .3 * sin(t * .9 + s * 21.)) * dive * (1. - .4 * spear);      // each rolled its own way, back toward us
      size = mix(iB.z, 1.9 - .2 * iB.w, dive);
      skew = dive * (1. - spear);
    } else {
      float lag = kind > 1.5 ? .5 : 0.;
      o += vec3(2.6 * sin(t * 1.7 - lag) + 1.2 * sin(t * 2.9 - lag * 1.4), 1.5 * sin(t * 2.3 - lag) + .6 * sin(t * 3.7 - lag), 1.5 * sin(t * 1.1 - lag));
      o.z += 45. * away; o.y += 5. * away;
      tint = iB.y; A = .8; ph = t * (kind > 1.5 ? 27. : 23.) + s * 100.;
      bank = -.55 * cos(t * 1.7 - lag);
    }
    C = uCam + uPR * o.x + uPU * o.y + uPF * o.z;
    fw = normalize(uHead + uPR * (.06 * sin(t * .7 + s * 12.) + (fract(s * 29.) - .5) * .3 * skew) + uPU * (fract(s * 37.) - .35) * .3 * skew);      // they head as the path heads
    upRef = normalize(vec3(0., 1., 0.) - uHead * uHead.y + vec3(0., 1e-4, 0.)); vis = smoothstep(0., .3, pres); if (kind > .5) size = iB.z;` },
  // divers: circle, tip over, stoop, fold, vanish at the surface. iA = strike x, strike z, height, seed. iB = period, circle radius, heading, run-in
  diver: { pars: /* glsl */`
    vec3 gsDiver(float c, vec2 S, vec2 T, float h, float rho, float X, float t, float s) {
      vec2 N = vec2(T.y, -T.x), K = S - T * X + N * rho;
      float q = clamp((c - .75) / .25, 0., 1.), al = (min(c, .75) - .75) / .75 * 6.2832;
      vec2 xz = K + rho * (-N * cos(al) + T * sin(al));
      xz = mix(xz, S - T * X * (1. - q) * (1. - q), step(.75, c));
      float y = h * (1. - q * q) + 2. * sin(t * .5 + s * 30.) * (1. - smoothstep(.55, .75, c));
      return vec3(xz.x, y, xz.y);
    }`, main: /* glsl */`
    float s = iA.w, per = iB.x, c = fract(t / per + s * 17.);
    vec2 S = iA.xy, T = vec2(cos(iB.z), sin(iB.z));
    vec3 P0 = gsDiver(c, S, T, iA.z, iB.y, iB.w, t, s), P1 = gsDiver(c + .004, S, T, iA.z, iB.y, iB.w, t, s);
    float q = clamp((c - .75) / .25, 0., 1.);
    C = P0 + vec3(0., gsSeaY(S), 0.); fw = normalize(P1 - P0 + vec3(1e-4, 0., 0.));
    fold = smoothstep(.02, .3, q) + smoothstep(.55, .8, q);
    vis = smoothstep(0., .04, c) * (1. - step(.996, c));
    bank = .45 * (1. - smoothstep(0., .2, q));
    A = mix(.1, .7, smoothstep(.1, .5, sin(t * .43 + s * 20.))); ph = t * 22. + s * 100.;
    tint = step(fract(s * 53.7), uJuv); size = 1.3;` },
  // landers beside the climb: a bird hangs on the wind off a ledge, wings high, tail fanned and feet down, sinks to
  // the lip and is gone among its neighbours. iA = a point just off the lip, seed. iB = outward x, outward z, period
  lander: { pars: 'uniform vec3 uWindDir;', main: /* glsl */`
    float s = iA.w, cy = fract(t / iB.z + s * 13.), e = smoothstep(0., .78, cy);
    vec3 o3 = vec3(iB.x, 0., iB.y);
    C = iA.xyz + o3 * mix(3.3, .25, e) + vec3(-o3.z, 0., o3.x) * (.8 * sin(t * 1.3 + s * 17.) * (1. - .7 * e) + 2.2 * (1. - e))
      + vec3(0., mix(4.2, -.85, e * e) + .45 * sin(t * 1.9 + s * 9.) * (1. - .7 * e), 0.);
    fw = normalize(-uWindDir + vec3(0., .32 + .3 * e, 0.));
    vis = smoothstep(0., .08, cy) * (1. - smoothstep(.93, 1., cy));
    bank = .26 * sin(t * 2.1 + s * 4.) * (1. - .5 * e);
    A = .34 + .14 * e; ph = t * 29. + s * 100.; dih = .42;
    tint = 0.; size = 1.32;` },
  // the birds a surfacing whale puts up: they burst outward and upward from round it. iA = x, z, bearing, seed. uFlush 0..1
  flush: { pars: 'uniform float uFlush;', main: /* glsl */`
    float s = iA.w, k = clamp(uFlush * (1.15 + .5 * fract(s * 7.)) - .12 * fract(s * 3.), 0., 1.), tt = k * 3.2;
    vec2 D = vec2(cos(iA.z), sin(iA.z));
    float run = tt * (6.5 + 4.5 * fract(s * 11.)), lift = .4 + tt * (2.4 + 2. * fract(s * 5.)) + .5 * sin(t * 1.1 + s * 9.) * k;
    C = vec3(iA.x + D.x * run, gsSeaY(iA.xy) + lift, iA.y + D.y * run);
    fw = normalize(vec3(D.x, .4 * (1. - .6 * k), D.y));
    vis = smoothstep(0., .06, k) * (1. - smoothstep(.9, 1., uFlush));
    bank = .4 * sin(s * 40. + t * 1.4); A = .8; ph = t * 26. + s * 100.;
    tint = step(fract(s * 53.7), uJuv); size = 2.6 * (1.5 - .5 * smoothstep(.05, .4, k));` },
  // near birds that cross the run-in's line low over the swell (but humped over the line itself), on the WORLD'S CLOCK: each flies one track across the
  // line per cycle of its own (9 to 17 s, seeded), and each new cycle draws its own place along the run-in, its own
  // height over the swell and its own side to come from, so where a crosser is depends on the clock and its seed alone.
  // iA = cycle (s), track length (m), how far east of the line its track is centred, seed
  cross: { pars: 'uniform vec4 uLine;', main: /* glsl */`
    float s = iA.w, cyc = t / iA.x + s * 13., gen = floor(cyc), tt = fract(cyc);
    float side = gh(gen * .731 + s * 91.) < .5 ? -1. : 1., z0 = mix(58., 306., gh(gen * 1.37 + s * 47.)), y0 = mix(2.4, 8.2, gh(gen * 2.11 + s * 29.));
    vec2 xz = vec2(40. + iA.z + side * (tt - .5) * iA.y, z0 - 18. * (tt - .5));
    C = vec3(xz.x, y0 + .7 * gsSeaY(xz) + 1.3 + .35 * sin(t * 2.6 + s * 9.), xz.y);
    // THE CLEAR AIR, by place: over the route's line (uLine, read from the path at the build) a crosser passes at
    // least 4.1 m above it (2.35 m of air and its own half span), rising to that from 45 m off and easing down again
    float ln = clamp((abs(xz.x - uLine.x) - 5.) / 40., 0., 1.), over = max(uLine.y + uLine.z * (1. - smoothstep(45., uLine.w, xz.y)) - C.y, 0.);
    C.y += over * (1. - ln * ln * (3. - 2. * ln));
    fw = normalize(vec3(side * iA.y, 0., -18.) + vec3(0., 4. * cos(t * 2.6 + s * 9.) - sign(xz.x - uLine.x) * side * iA.y * over * 6. * ln * (1. - ln) / 40., 0.)); vis = smoothstep(0., .07, tt) * (1. - smoothstep(.93, 1., tt));
    bank = -side * (.25 + .1 * sin(t * 2.3 + s * 5.)); A = mix(.15, .6, smoothstep(-.2, .5, sin(t * .5 + s * 20.))); ph = t * 21. + s * 100.; size = 1.5 + .3 * fract(s * 31.);
    tint = step(fract(s * 53.7), uJuv);` },
  // rafts of birds sitting on the swell all along the run-in. A raft flushes as we reach it: every bird within 11 m
  // of the route's line (and fewer out to 21 m) is put up when the lens is 34 m short of it, the nearest to the line
  // first; it runs forward and out to its own side, lifts 2.5 to 5 m and is left behind. iA = x, z, yaw, seed
  raft: { pars: '', main: /* glsl */`
    float s = iA.w, off = iA.x - 40., goes = step(fract(s * 7.7), 1. - smoothstep(11., 21., abs(off)));
    float tt = max((34. - (uSeaC.z - iA.y)) / 27.3 - .5 * fract(s * 3.3) - .03 * abs(off), 0.) * goes;
    float up1 = smoothstep(0., .22, tt), t1 = min(tt, 1.5), run = 3.6 * t1 * t1 + 10.8 * (tt - t1);
    vec2 D = normalize(vec2((off < 0. ? -1. : 1.) * (.3 + .5 * fract(s * 11.)), -1.)), S = iA.xy + D * run;
    float lift = (1. - exp(-tt * 1.6)) * (2.4 + 2.6 * fract(s * 5.)) + .3 * sin(t * 1.3 + s * 9.) * up1;
    C = vec3(S.x, gsSeaY(S) + .1 + lift, S.y);
    float yaw = iA.z + .3 * sin(t * .5 + s * 20.);
    fw = normalize(mix(vec3(sin(yaw), .16, cos(yaw)), vec3(D.x, .5 - .35 * smoothstep(.3, 1.6, tt), D.y), smoothstep(0., .45, tt)));
    fold = 2. * (1. - up1); bank = mix(.12 * sin(t * 1.3 + s * 33.), .45 * sin(s * 40. + t * 1.9), up1);
    A = .85; ph = t * 27. + s * 100.; size = 1.4; vis = 1. - smoothstep(4.5, 5.5, tt);
    tint = step(fract(s * 53.7), uJuv);` },
  // seals rolling in the surge (uLeap 0) or dolphins porpoising (uLeap 1). iA = x, z, loop radius, seed. iB.x = size
  swim: { pars: 'uniform float uLeap;', main: /* glsl */`
    float s = iA.w, dir = fract(s * 5.) > .5 ? 1. : -1., a = t * (.25 + .2 * fract(s * 9.)) * dir + s * 40.;
    vec2 S = iA.xy + iA.z * vec2(cos(a), sin(a));
    float lp = sin(t * 1.9 + s * 30.), leap = max(lp, 0.);
    C = vec3(S.x, gsSeaY(S) - .14 + uLeap * (leap * 1.7 - .5) + .12 * sin(t * 1.1 + s * 7.), S.y);
    vec2 tg = vec2(-sin(a), cos(a)) * dir;
    fw = normalize(vec3(tg.x, uLeap * cos(t * 1.9 + s * 30.) * .9 + (1. - uLeap) * .25 * sin(t * .7 + s * 3.), tg.y));
    bank = (1. - uLeap) * (1.3 * sin(t * .8 + s * 12.) + .8 * sin(t * .37 + s * 5.));
    size = iB.x;` },
};

function gannetMaterial(shared, traj) {
  const mat = new THREE.ShaderMaterial({
    side: THREE.DoubleSide, fog: true, vertexColors: true,
    uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog]),
    vertexShader: /* glsl */`
      attribute vec3 aW; attribute vec4 iA, iB;
      uniform float uTime, uJuv;
      varying vec3 vCol, vN, vV; varying float vWing;
      ${SEA_GLSL}
      float gh(float p) { p = fract(p * .1031); p *= p + 33.33; p *= p + p; return fract(p); }
      ${traj.pars}
      #include <fog_pars_vertex>
      void main() {
        vec3 C = vec3(0.), fw = vec3(0., 0., 1.), upRef = vec3(0., 1., 0.);
        float bank = 0., fold = 0., A = 0., ph = 0., vis = 1., tint = 0., size = 1.3, dih = 0., t = uTime;
        ${traj.main}
        vec3 p = position, n = normal; float sx = aW.x;
        if (abs(sx) > .5) {
          float sp = aW.y, ch = aW.z, f1 = min(fold, 1.), f2 = clamp(fold - 1., 0., 1.);
          float phi1 = mix(.5 * f1, -1.15, f2), phi2 = mix(1.05 * f1, 1.45, f2);
          vec2 d1 = vec2(cos(phi1), sin(phi1)), d2 = vec2(cos(phi2), -sin(phi2)), dd = sp < .5 ? d1 : d2;
          float s1 = min(sp, .5) * 2., s2 = max(sp - .5, 0.) * 2.;
          vec2 q = d1 * (.42 * s1) + d2 * (.48 * s2) + vec2(-dd.y, dd.x) * ch * (1. - .3 * f2);
          float Af = A * (1. - .85 * f1), a1 = Af * sin(ph) + .08 + dih, a2 = a1 + Af * .9 * sin(ph - .9) - .22 * f1 * (1. - f2);
          float xw = .42 * d1.x, an = sp < .5 ? a1 : a2;
          float X = sp < .5 ? q.x * cos(a1) : xw * cos(a1) + (q.x - xw) * cos(a2);
          float Y = sp < .5 ? q.x * sin(a1) : xw * sin(a1) + (q.x - xw) * sin(a2);
          p = vec3(sx * (.07 + X), .02 + Y, .05 + q.y); n = vec3(-sx * sin(an), cos(an), 0.);
        }
        p.y -= .1 * A * sin(ph) * (1. - min(fold, 1.));
        fw = normalize(fw + vec3(0., 0., 1e-5));
        vec3 rt = normalize(cross(upRef, fw) + vec3(1e-5, 0., 0.)), up = cross(fw, rt);
        float cb = cos(bank), sb = sin(bank); vec3 r2 = rt * cb + up * sb, u2 = up * cb - rt * sb;
        size *= vis;
        vec3 wp = C + (r2 * p.x + u2 * p.y + fw * p.z) * size;
        vN = r2 * n.x + u2 * n.y + fw * n.z; vV = wp - cameraPosition;
        vec3 col = color;
        if (tint > 2.5) col = abs(sx) > .5 ? vec3(.03) : mix(col, vec3(.8), .5);
        else if (tint > 1.5) col = vec3(.075, .055, .045) * (1. + 5. * step(.55, aW.y) * step(aW.y, .7) * abs(sx));
        else if (tint > .5) col = mix(vec3(.13, .09, .065) * (.6 + .9 * gh(position.z * 91. + position.x * 37.)), col, .1);
        vCol = col; vWing = abs(sx);
        vec4 mvPosition = viewMatrix * vec4(wp, 1.);
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      varying vec3 vCol, vN, vV; varying float vWing;
      ${LIGHT_GLSL}
      #include <fog_pars_fragment>
      void main() {
        vec3 n = normalize(vN + vec3(0., 1e-5, 0.)); if (dot(n, vV) > 0.) n = -n;
        n = normalize(n + uSunDir * .35 * vWing);
        // (whites are held: the brightest channel stops at 0.9, so a flock in the low key keeps its form and is not a blot of bloom)
        vec3 c = gsLight(vCol, n, 1.); c *= min(1., .9 / max(max(c.r, max(c.g, c.b)), 1e-3));
        gl_FragColor = vec4(c, 1.);
        #include <fog_fragment>
      }`,
  });
  Object.assign(mat.uniforms, shared);
  return mat;
}

// Lit vertex colours with the hero's light, the scene's fog and a wet sheen. Facet-shaded from derivatives (trawler,
// skerries) or, with smoothN, from the mesh's own normals (the whale).
function litMaterial(shared, wet = 0.3, smoothN = false, amb = 0) {
  const mat = new THREE.ShaderMaterial({
    side: THREE.DoubleSide, fog: true, vertexColors: true,
    uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { uWet: { value: wet }, uAmb: { value: amb } }]),
    vertexShader: /* glsl */`
      varying vec3 vCol, vV, vNw, vOb;
      #include <fog_pars_vertex>
      void main() {
        vCol = color; vOb = position; vNw = ${smoothN ? 'normalize(mat3(modelMatrix) * normal)' : 'vec3(0., 1., 0.)'};
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.);
        vV = mvPosition.xyz; gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      uniform float uWet, uAmb, uSeaT;
      varying vec3 vCol, vV, vNw, vOb;
      ${LIGHT_GLSL}
      ${smoothN ? NOISE2_GLSL : ''}
      #include <fog_pars_fragment>
      void main() {
        vec3 vd = normalize((vec4(-normalize(vV + vec3(0., 0., -1e-6)), 0.) * viewMatrix).xyz), hv = normalize(uSunDir + vd);
        ${smoothN ? 'vec3 n = normalize(vNw + vec3(0., 1e-5, 0.)); if (dot(n, vd) < 0.) n = -n;'
    : 'vec3 nv = normalize(cross(dFdx(vV), dFdy(vV)) + vec3(0., 0., 1e-9)); vec3 n = normalize((vec4(nv, 0.) * viewMatrix).xyz);'}
        float fres = pow(max(1. - max(dot(n, vd), 0.), 0.), 4.);
        float spec = uWet * (pow(max(dot(n, hv), 0.), 30.) * 1.2 + .06 * fres);
        vec3 alb = vCol;
        ${smoothN ? `// water streaming off it: white runs sliding tailward down the flanks, thickest low on the body
        float runs = vn(vec2(vOb.x * 5.3 + vOb.y * 7.1, vOb.z * .3 + uSeaT * 1.9)) * .6 + vn(vec2(vOb.x * 13.1 - vOb.y * 9.7, vOb.z * .7 + uSeaT * 3.1)) * .4;
        alb = mix(alb, vec3(.78, .84, .82), smoothstep(.56, .74, runs) * (.3 - .18 * smoothstep(-5., 4., vOb.z)));` : ''}
        gl_FragColor = vec4(gsLight(alb, n, 1.) + alb * uSkyCol * uAmb + uSunCol * spec + uSkyCol * uWet * (.05 + ${smoothN ? '.5' : '0.'} * fres), 1.);
        #include <fog_fragment>
      }`,
  });
  Object.assign(mat.uniforms, shared);
  return mat;
}

// One strike per diver, timed by that diver's own cycle: a spray spike (kind 0), a ragged foam patch spreading on the
// surface and opening into lace (kind 1) and, seen from below, a white bubble trail going down (kind 2). aK = corner x, corner y, kind.
function strikeMaterial(shared) {
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, fog: true, side: THREE.DoubleSide,
    uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { uSub: { value: 0 }, uPlume: { value: 1 }, uGrow: { value: 0 }, uPatch: { value: 1 }, uTrailGlow: { value: new THREE.Color(0, 0, 0) } }]),
    vertexShader: /* glsl */`
      attribute vec3 aK; attribute vec4 iA, iB;
      uniform float uTime, uSub, uPlume, uGrow, uPatch;      // uPatch thins the foam patches where many strikes share one spot (bow, whale)
           // uGrow 0..1: plumes hold a size on screen when seen from far above (the boil from the hang)
      varying vec2 vQ; varying vec4 vK;
      ${SEA_GLSL}
      #include <fog_pars_vertex>
      void main() {
        float s = iA.w, per = iB.x, c = fract(uTime / per + s * 17.), tp = c * per, kind = aK.z;
        vec2 S = iA.xy; vec3 base = vec3(S.x, gsSeaY(S), S.y), wp = base;
        vec3 rx = normalize(vec3(viewMatrix[0][0], 0., viewMatrix[2][0]) + vec3(1e-5, 0., 0.));
        float dist = distance(base, cameraPosition), a = 0.;
        if (kind < .5) {
          float grow = 1. - exp(-tp * 6.);
          float Hh = (3. + 2.4 * fract(s * 91.)) * uPlume * grow * (1. - .5 * smoothstep(.5, 1.6, tp)) * (1. + uGrow * min(dist / 120., 1.5));
          a = (1. - smoothstep(.7, 1.7, tp)) * (1. - uSub) * smoothstep(7., 30., dist);      // never a white card across the lens
          a *= 1. - .96 * smoothstep(90., 230., dist) * (1. - uGrow);                       // from sea level, far off, they melt into the spray haze
          // a tuft, never a pin: at least 0.3 of its height to each side, wider still seen from over it in the fall
          float Wd = max(max(.55 + .8 * tp, dist * mix(.002, .0075, uGrow)), Hh * .34);
          wp += (rx * aK.x * Wd + vec3(0., (aK.y * .5 + .5) * Hh - .15, 0.)) * step(.004, a);
        } else if (kind < 1.5) {
          a = smoothstep(0., .1, tp) * (1. - smoothstep(1.6, 3.8, tp)) * (1. - uSub) * min(uPlume, 1.) * .92 * uPatch;
          wp += (vec3(aK.x, 0., aK.y) * (1.3 + 2.7 * sqrt(tp)) * max(1., uPlume * .6) + vec3(0., .12, 0.)) * step(.004, a);
        } else {
          a = (1. - smoothstep(1.2, 3.6, tp)) * uSub;
          wp += (rx * aK.x * max(.3, dist * .003) - vec3(0., (aK.y * .5 + .5) * min(tp * 14., 9. + 4. * fract(s * 13.)), 0.)) * step(.004, a);
        }
        vQ = aK.xy; vK = vec4(kind, a, s, tp);
        vec4 mvPosition = viewMatrix * vec4(wp, 1.);
        if (kind > .5 && kind < 1.5) mvPosition.xyz *= 1. - min(.9 / max(length(mvPosition.xyz), 1e-3), .4);
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      uniform float uTime; uniform vec3 uTrailGlow;
      varying vec2 vQ; varying vec4 vK;
      ${LIGHT_GLSL}
      ${NOISE2_GLSL}
      #include <fog_pars_fragment>
      void main() {
        float kind = vK.x, a = 0.; vec3 col = (uSunCol * .42 + uSkyCol * 1.15) * .9;
        if (kind < .5) {
          // a short ragged tuft of thrown water: widest a third of the way up, its outline eroded by two noises that
          // rise through it, brightest at the base and torn to mist at the top
          float y = clamp(vQ.y * .5 + .5, 0., 1.), w = .55 + .45 * sin(3.1416 * min(y * 1.25, 1.));
          float n = vn(vec2(vQ.x * 2.2 + vK.z * 50., y * 3.2 - uTime * 2.5)) * .6 + vn(vec2(vQ.x * 5.5 - vK.z * 31., y * 7. - uTime * 4.)) * .4;
          float edge = abs(vQ.x) / w + (n - .5) * (.55 + .9 * y);
          a = (1. - smoothstep(.4, 1., edge)) * smoothstep(0., .07, y) * (1. - smoothstep(.3 + .55 * n, 1., y)) * (.5 + .7 * n);
          col *= mix(1.12, .7, y);
        } else if (kind < 1.5) {
          // the strike seen from above: a white burst, then a crown thrown outward as a widening, breaking ring; inside it
          // the water is beaten dark for a moment and then pales as the bird's bubbles come up; lace is left behind
          float r = length(vQ), n = vn(vQ * 4. + vK.z * 30.), n2 = vn(vQ * 9. - vK.z * 17.), rj = r + .42 * (n - .5) + .16 * (n2 - .5), tp = vK.w;
          float open = smoothstep(.2, 2.8, tp), rc = .2 + .6 * smoothstep(0., 2.7, tp);
          // a ragged disc of white water that spreads, tears into lace from the middle and is gone; its middle pales with bubbles
          float disc = (1. - smoothstep(rc - .16, rc + .04, rj)) * smoothstep(.85 * open - .12, .85 * open + .2, n2 * .55 + n * .45 + .35 * smoothstep(rc - .5, rc, rj)) * (1. - smoothstep(2.3, 3.6, tp));
          float burst = (1. - smoothstep(.1, .5, rj)) * exp(-tp * 1.6) * (.5 + .9 * n2) * 1.3;
          float bub = (1. - smoothstep(rc - .3, rc - .05, rj)) * smoothstep(.4, 1.2, tp) * (1. - smoothstep(2., 3.4, tp)) * (.3 + .7 * n2) * .3;
          float wA = max(disc, burst);
          a = max(wA, bub);
          col = mix(col * vec3(.62, .9, .82), col * (.7 + .42 * n), smoothstep(0., .45, wA));
        } else {
          float y = vQ.y * .5 + .5, n = vn(vec2(vQ.x * 3. + vK.z * 9., y * 14. + uTime * 1.5));
          a = (1. - abs(vQ.x)) * (.35 + .9 * n) * pow(max(1. - y, 0.), .6);
          col = mix(vec3(.75, .95, .88), col, .3) * 1.2 + uTrailGlow;
        }
        a *= vK.y; if (a < .01) discard;
        gl_FragColor = vec4(col, clamp(a, 0., 1.));
        #include <fog_fragment>
      }`,
  });
  Object.assign(mat.uniforms, shared);
  return mat;
}

// The boil: a wreath of boiling foam round a dark eye, and in the eye the milky turquoise bloom with a wobbling image
// of the ring (the sea hides the real portal until we are under). The foam has thickness: bright cores, torn lace that
// lets the green through, blue-grey on the slopes turned from the light, ripple scars, and finer lace that comes in as
// we fall toward it. Premultiplied colour. uEyeNear (1 from the hang, 0 at the surface) sets the grain of the eye's
// caustic veins and steadies and thins the ring's image as we close.
function wreathMaterial(shared, eyeColor) {
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, fog: true, premultipliedAlpha: true,
    uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { uEye: { value: new THREE.Color(eyeColor) }, uEyeK: { value: 1 }, uEyeNear: { value: 1 }, uBack: { value: new THREE.Vector4(1, 0, 16, 0) } }]),
    vertexShader: /* glsl */`
      varying vec2 vP, vSl;
      ${SEA_GLSL}
      #include <fog_pars_vertex>
      void main() {
        vec3 wp = (modelMatrix * vec4(position, 1.)).xyz; vP = position.xz;
        float y0 = gsSeaY(wp.xz);
        vSl = vec2(gsSeaY(wp.xz + vec2(2.5, 0.)) - y0, gsSeaY(wp.xz + vec2(0., 2.5)) - y0) / 2.5;
        wp.y = y0 + .1;
        vec4 mvPosition = viewMatrix * vec4(wp, 1.);
        mvPosition.xyz *= 1. - min(1.1 / max(length(mvPosition.xyz), 1e-3), .4);
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      uniform float uTime, uEyeK, uEyeNear; uniform vec3 uEye, uHole; uniform vec4 uBack;
      varying vec2 vP, vSl;
      ${LIGHT_GLSL}
      ${NOISE2_GLSL}
      #include <fog_pars_fragment>
      ${FOGF_GLSL}
      // distance to the nearest wall between foam cells (0 on a wall, about 1 in the middle of a big cell); the cells drift
      float gsWall(vec2 p, float t) {
        vec2 i = floor(p), f = fract(p); float d1 = 8., d2 = 8.;
        for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) {
          vec2 g = vec2(float(x), float(y)), c = i + g;
          vec2 o = .5 + .4 * sin(t + 6.2831 * vec2(h21(c), h21(c + 17.3)));
          vec2 q = g + o - f; float d = dot(q, q);
          if (d < d1) { d2 = d1; d1 = d; } else if (d < d2) { d2 = d; }
        }
        return sqrt(max(d2, 0.)) - sqrt(max(d1, 0.));
      }
      void main() {
        float r = length(vP), nearK = 1. - smoothstep(40., 125., vFogDepth);
        float n1 = vn(vP * .045 + vec2(uTime * .015, 0.)), n2 = vn(vP * .3 - uTime * vec2(.05, .03)), n3 = vn(vP * 1.1 + uTime * vec2(.2, .1)), n4 = vn(vP * 3.1 - uTime * .4);
        float n5 = vn(vP * 6.7 + uTime * vec2(.45, -.3)), n6 = vn(vP * 18. - uTime * vec2(.7, .5));
        float rr = r + 18. * (n1 - .5) + 5. * (n2 - .5);
        float band = smoothstep(19., 31., rr) * (1. - smoothstep(56., 86., rr));
        // how much foam lies here (0..1): the wreath's body, torn by slow holes, thinning to threads at both rims
        float tear = smoothstep(.5, .7, vn(vP * .6 + 11. + uTime * vec2(.04, -.06))) * smoothstep(.4, .62, n3);
        float amt = band * (.12 + .58 * smoothstep(.3, .8, n1 * .5 + n2 * .5)) * (1. - .6 * tear);
        amt *= 1. - .85 * uHole.z * (1. - smoothstep(8., 24., length(vP - uHole.xy) + 5. * (n2 - .5)));
        // lace: the walls between foam cells at three sizes (5.5 m, 1.75 m, 0.6 m). Where there is little foam only thin
        // walls stand and green water shows through; where there is much they close into a sheet. The finer sizes come
        // in as we fall toward it, opening small holes in the sheet and drawing threads between the big walls.
        float k2 = 1. - smoothstep(110., 250., vFogDepth), k3 = 1. - smoothstep(30., 95., vFogDepth), tw = uTime * .35;
        vec2 wq = vP + 2.4 * vec2(n3 - .5, n2 - .5);
        float d1 = gsWall(wq / 5.5 + uTime * vec2(.012, .008), tw), d2 = gsWall(wq / 1.75 + 7., tw * 1.6), d3 = gsWall(vP / .6 + 3., tw * 2.3);
        float sf = .1 * (1. - k2), w1 = amt * 1.3 + .25 * (n3 - .5), w2 = amt * 1.25 + .3 * (n4 - .5), w3 = amt * 1.2 + .3 * (n3 - .5);
        float l1 = 1. - smoothstep(w1 - .1 - sf, w1 + .06 + sf, d1), l2 = 1. - smoothstep(w2 - .12, w2 + .08, d2), l3 = 1. - smoothstep(w3 - .14, w3 + .1, d3);
        float gate = smoothstep(.02, .18, amt);
        float thick = l1 * gate * mix(1., .3 + .7 * l2, k2) * mix(1., .4 + .6 * l3, k3);
        thick = max(thick, gate * max(l2 * k2 * .8 * smoothstep(.12, .45, amt), l3 * k3 * .6 * smoothstep(.22, .55, amt)));
        float solid = smoothstep(.35, .8, amt) * l1;
        // ripple scars: rings spreading from strikes (a coarse set seen from the hang, a finer one close to)
        vec2 cell = floor(vP / 11.), f = fract(vP / 11.) - .5;
        float hsh = h21(cell), rd = length(f - (vec2(h21(cell + 3.1), h21(cell + 7.7)) - .5) * .5) + .05 * (n3 - .5);
        float bandR = max(band, smoothstep(9., 16., r) * (1. - smoothstep(56., 86., rr)));      // strike rings spread into the eye's outer band too
        float age = fract(uTime * .22 + hsh * 7.), ring = (1. - smoothstep(0., .045, abs(rd - age * .42))) * (1. - age) * bandR * step(.5, hsh) * (.4 + .9 * n4) * (.5 + .5 * nearK);
        vec2 cell2 = floor(vP / 4.3 + 7.), f2 = fract(vP / 4.3 + 7.) - .5;
        float hs2 = h21(cell2), rd2 = length(f2 - (vec2(h21(cell2 + 5.1), h21(cell2 + 1.7)) - .5) * .5);
        float age2 = fract(uTime * .35 + hs2 * 5.), ring2 = (1. - smoothstep(0., .06, abs(rd2 - age2 * .4))) * (1. - age2) * bandR * step(.78, hs2) * nearK * (.3 + .9 * n4);
        thick = clamp(max(thick, max(ring * .8, ring2 * .85)), 0., 1.);            // strike rings: thin white circles spreading over foam and water alike
        // foam flecks drifting on the eye itself, seen only close to
        thick = max(thick, .5 * nearK * smoothstep(.62, .8, n5 * .55 + n6 * .45) * smoothstep(.5, .72, n3) * (1. - smoothstep(20., 34., r)));
        // foam light: cream where the slope takes the low key, blue-grey where it turns away; never past 0.7
        float lit = clamp(.3 - 2.6 * (vSl.x * uSunDir.x + vSl.y * uSunDir.z) + .35 * (solid - .4) + .4 * (n4 - .5) + .5 * k2 * (d2 - .35) + nearK * .4 * (n6 - .5), 0., 1.);
        vec3 fcol = mix(uSkyCol * .74 + uShadeCol * .34, uSkyCol * .92 + uSunCol * .27, lit) * (.82 + .2 * n1) * mix(1., .74 + .52 * (n5 * .6 + n6 * .4), nearK);
        fcol = mix(fcol * vec3(.66, .9, .82) * .86, fcol, .25 + .75 * solid);        // thin lace is wet and a little green; the sheet is white
        float fa = clamp(thick * 1.1, 0., .96);
        float pulse = .8 + .2 * sin(uTime * .9);
        // the eye is dark bottle-green water, alive: two octaves of caustic veins whose grain follows our height;
        // the glow is a core that falls off to dark at the eye's rim; the ring's image is thin and refracted, and it
        // steadies and sharpens as we close (it is never faded to a blur)
        float low = 1. - uEyeNear, s1 = mix(.11, .3, low), s2 = mix(.3, .9, low);
        vec2 q1 = vP * s1 + uTime * vec2(.05, -.035), q2 = vP * s2 - uTime * vec2(.09, .06);
        float v1 = 1. - smoothstep(0., .36, abs(vn(q1) - vn(q1 * 1.31 + 7.3))), v2 = 1. - smoothstep(0., .4, abs(vn(q2) - vn(q2 * 1.27 + 3.1)));
        v1 *= v1; v2 *= v2;
        float vein = v1 * .65 + v2 * .5, wobA = mix(.5, 1.7, uEyeNear), wid = mix(.45, 1.05, uEyeNear);
        float wob = r + wobA * (vn(vP * .33 + uTime * .3) - .5) + .4 * wobA * sin(vP.x * .55 + uTime * 1.3) * sin(vP.y * .47 - uTime * 1.1) + .5 * (vn(vP * 1.4 - uTime * .7) - .5);
        float glow = (exp(-r * r / 110.) * .43 + exp(-r * r / 600.) * .08) * pulse * (.62 + .7 * vein) + .022 * vein * (1. - smoothstep(14., 34., r));
        float img = (1. - smoothstep(wid * .25, wid, abs(wob - 6.6))) * .95 * (.78 + .22 * sin(uTime * 1.7)) * (.7 + .5 * v2) + (1. - smoothstep(1.5, 6.6, wob)) * .2;
        float dark = .8 * (1. - smoothstep(13., 36., r));                // the eye: stilled, deepened water
        // (rare) the whale's back, just under the surface behind where it stands out: a long dark shape along its own
        // heading (uBack = the way its tail lies, its length, how far it is up), tapering to the tail, the foam parted over it
        vec2 hb = vP - uHole.xy; float bl = dot(hb, uBack.xy), bc = dot(hb, vec2(-uBack.y, uBack.x)), bt = clamp(bl / max(uBack.z, 1.), 0., 1.);
        float bk = uBack.w * (1. - smoothstep(.55, 1.2, abs(bc + .5 * (n3 - .5)) / mix(2.3, .55, bt * bt))) * smoothstep(-1.5, 1., bl) * (1. - smoothstep(.8, 1., bt));
        fa *= 1. - .85 * bk; dark = max(dark, .82 * bk);
        float ff = gsFog();
        float a = clamp(fa + dark * (1. - fa), 0., 1.);
        vec3 col = mix(fcol * fa, fogColor * a, ff);
        col += uEye * (glow + img) * uEyeK * (1. - fa) * (1. - .7 * ff);
        gl_FragColor = vec4(col, a * (1. - smoothstep(88., 96., r)));
      }`,
  });
  Object.assign(mat.uniforms, shared);
  return mat;
}

// Bubble trails behind the companions once they are under water: ribbons back up the line of the fall.
function trailMaterial(shared) {
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, fog: true, side: THREE.DoubleSide,
    uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { uTrailGlow: { value: new THREE.Color(0, 0, 0) } }]),
    vertexShader: /* glsl */`
      attribute vec4 iA, iB;
      uniform float uTime; uniform vec3 uCam, uPF, uPR, uPU; uniform vec4 uEsc;
      varying vec2 vQ; varying vec2 vK;
      #include <fog_pars_vertex>
      void main() {
        float s = iA.w;
        vec3 o = iA.xyz + vec3(.9 * sin(uTime * .6 + s * 30.), .6 * sin(uTime * .8 + s * 17.), 1.4 * sin(uTime * .4 + s * 9.)) * .3;
        vec3 C = uCam + uPR * o.x + uPU * o.y + uPF * o.z;
        float len = 24. + 10. * fract(s * 7.), y = position.y;
        vec3 c = C - uPF * (y * len + .4);
        vec3 side = normalize(cross(uPF, c - cameraPosition) + vec3(1e-5, 0., 0.));
        float wd = max(.07 + .2 * y, distance(c, cameraPosition) * .0022);
        vec3 wp = c + side * position.x * wd;
        vQ = position.xy; vK = vec2(uEsc.x * step(iB.x, .5) * (1. - smoothstep(-1.6, -.3, wp.y)), s);
        vec4 mvPosition = viewMatrix * vec4(wp, 1.);
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      uniform float uTime; uniform vec3 uTrailGlow;
      varying vec2 vQ; varying vec2 vK;
      ${NOISE2_GLSL}
      #include <fog_pars_fragment>
      void main() {
        float n = vn(vec2(vQ.x * 2.5 + vK.y * 40., vQ.y * 46. + uTime * 2.)) * .65 + vn(vec2(vQ.x * 6., vQ.y * 150. + uTime * 4. + vK.y * 9.)) * .35;
        float a = (1. - abs(vQ.x)) * smoothstep(.3, .72, n + .3 * (1. - vQ.y)) * pow(max(1. - vQ.y, 0.), .7) * vK.x * .8;
        if (a < .01) discard;
        gl_FragColor = vec4(vec3(.78, .95, .9) * 1.15 + uTrailGlow, a);
        #include <fog_fragment>
      }`,
  });
  Object.assign(mat.uniforms, shared);
  return mat;
}

// The 0.3 s veil of white bubbles as we go through the surface: a sheet held in front of the eye.
function veilMaterial() {
  return new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, depthTest: false, fog: false,
    uniforms: { uA: { value: 0 }, uTime: { value: 0 }, uCol: { value: new THREE.Color('#DCEBE4').multiplyScalar(0.8) } },
    vertexShader: /* glsl */`varying vec2 vQ; void main() { vQ = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`,
    fragmentShader: /* glsl */`
      uniform float uA, uTime; uniform vec3 uCol; varying vec2 vQ;
      ${NOISE2_GLSL}
      void main() {
        float n = vn(vQ * 9. + vec2(0., uTime * 6.)) * .6 + vn(vQ * 31. - vec2(0., uTime * 11.)) * .4;
        gl_FragColor = vec4(uCol * (.72 + .5 * n), uA * (.72 + .28 * n));
      }`,
  });
}

// A rain curtain far to the north-east: soft-edged, streaked, darker than the cloud behind it.
function curtainMaterial(color) {
  return new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, fog: false, side: THREE.DoubleSide,
    uniforms: { uTime: { value: 0 }, uCol: { value: new THREE.Color(color) } },
    vertexShader: /* glsl */`varying vec2 vQ; void main() { vQ = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`,
    fragmentShader: /* glsl */`
      uniform float uTime; uniform vec3 uCol; varying vec2 vQ;
      ${NOISE2_GLSL}
      void main() {
        float st = vn(vec2(vQ.x * 60. + vQ.y * 9., vQ.y * 2.5 - uTime * .35)) * .6 + vn(vec2(vQ.x * 9. + vQ.y * 1.5, 3.)) * .4;
        float edge = smoothstep(0., .22, vQ.x) * (1. - smoothstep(.78, 1., vQ.x)) * (1. - smoothstep(.55, 1., vQ.y)) * smoothstep(0., .04, vQ.y);
        gl_FragColor = vec4(uCol, edge * (.45 + .5 * st));
      }`,
  });
}

// The foot of a rainbow standing on the sea against the rain curtain: only the lowest eight degrees of the bow, faint.
function rainbowFootMaterial(sunDir, k) {
  return new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, fog: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    uniforms: { uAnti: { value: sunDir.clone().negate() }, uK: { value: k } },
    vertexShader: /* glsl */`varying vec3 vW; void main() { vec4 w = modelMatrix * vec4(position, 1.); vW = w.xyz - cameraPosition; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: /* glsl */`
      uniform vec3 uAnti; uniform float uK; varying vec3 vW;
      void main() {
        vec3 d = normalize(vW + vec3(0., 1e-5, 0.));
        float ang = degrees(acos(clamp(dot(d, uAnti), -1., 1.))), x = (ang - 40.4) / 2.2;      // 0 violet (inside) .. 1 red (outside)
        vec3 c = clamp(vec3(1.5 - abs(x - .86) * 3.4, 1.4 - abs(x - .52) * 3.4, 1.5 - abs(x - .18) * 3.4), 0., 1.);
        float el = degrees(asin(clamp(d.y, -1., 1.)));
        float k = smoothstep(0., .14, x) * (1. - smoothstep(.86, 1., x)) * smoothstep(-.3, .8, el) * (1. - smoothstep(3., 9., el));
        gl_FragColor = vec4(c * k * uK, 1.);
      }`,
  });
}

// The squall that has gone through: the deck darkens BY BEARING. A shell round the camera, drawn after the kit's sky
// and the scud (which is given a draw order just under the shell's) and before the rays and every spray, lays the
// brief's near-black slate (#12161C), three quarters opaque, over the sky and the scud to the south and east and nothing over the slot's side
// (west round to north); between them it is one smooth gradient round the compass (0.35 of it overhead). The sky's
// own cloud forms show through it (a quarter of them where it is darkest); flying birds, being nearer, are never under it and burn white against it.
// uS = the level direction of the middle of the slot (north-west), uDark = the slate, uK = how nearly opaque.
// SCUD AND LIGHTER BREAKS (the polish round's second order, A5): the shell was one even pane of the slate at every bearing
// of the squall's side ("flat charcoal"). It is a deck: its darkness now has a noise of the deck's own plane over the eye
// (the level direction over the height, so what stands near the horizon is far off and lies in long flat bands), drifting
// downwind on the world's clock (uT): where the noise is high the shell is up to 0.42 thinner (a lighter break: the sky's
// own cloud of that hour shows through, so the two sides of the sky are one sky), where it is low up to 0.16 thicker (a
// rag of scud). The turn from the slot's side to the squall's stays the one smooth gradient round the compass. No colour
// is added: the shell is the slate, only more or less of it.
// THE THIRD ORDER (part A3): THE BREAKS ARE SOFT, AS CLOUD (at night their edges were torn against the deck): less of the finest
// octave; a break and a rag turn over a wide band of the noise, wider still low down, where the deck's plane is seen edge-on
// and its forms are pressed flat. The shell's greatest change over one degree of sky falls from 0.81 to 0.25 of its opacity.
function squallMaterial(dark, slotDir, k, clock) {
  return new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, fog: false, side: THREE.BackSide,
    uniforms: { uDark: { value: dark }, uS: { value: slotDir }, uK: { value: k }, uT: clock },
    vertexShader: /* glsl */`varying vec3 vD; void main() { vD = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`,
    fragmentShader: /* glsl */`
      uniform vec3 uDark, uS; uniform float uK, uT; varying vec3 vD;
      ${NOISE2_GLSL}
      void main() {
        vec3 d = normalize(vD + vec3(0., 1e-5, 0.));
        float k = 1. - smoothstep(-.9, .6, dot(d, uS));
        vec2 p = d.xz / (max(d.y, 0.) + .2) - uT * vec2(.019, -.008);
        float n = vn(p * 1.2) * .54 + vn(p * 2.7 + 7.3) * .34 + vn(p * 5.9 + 2.1) * .12, e = .1 * (1. - smoothstep(.15, .6, d.y));
        float up = smoothstep(0., .12, d.y), brk = smoothstep(.5 - e, .86 + e, n) * up, rag = (1. - smoothstep(.2 - e, .5 + e, n)) * up;      // (the lowest 7 degrees are the far deck seen edge-on: even)
        // the lowest few degrees keep a little of the horizon's haze, so the far sea meets the sky without a cut-out line
        gl_FragColor = vec4(uDark, min(k * uK * (1. - .42 * brk + .16 * rag), .93) * mix(.72, 1., smoothstep(0., .09, d.y)));
      }`,
  });
}

function instancedMesh(base, count, attrs, material, order = 0) {
  const g = new THREE.InstancedBufferGeometry();
  g.index = base.index;
  for (const k of Object.keys(base.attributes)) g.setAttribute(k, base.attributes[k]);
  for (const k of Object.keys(attrs)) g.setAttribute(k, new THREE.InstancedBufferAttribute(attrs[k], 4));
  g.instanceCount = count;
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(60, 80, -60), 900);
  const m = new THREE.Mesh(g, material); m.frustumCulled = false; m.renderOrder = order;
  return m;
}

// ---------------------------------------------------------------- the route (brief's journey, from the hero's anchors)
// The scud's tileable noise, in the layout the kit's cloud puffs read (fbm in R and G; B and A are shifted copies of R).
// Baked here one octave at a time (128 x 128: the scud is soft) so the bake never holds the page in one long step.
async function scudNoise(rng, ctx, size = 256) {
  const N = size * size, f = [new Float32Array(N), new Float32Array(N)];
  const ix0 = new Int32Array(size), ix1 = new Int32Array(size), wx = new Float32Array(size);
  for (let ch = 0; ch < 2; ch++) {
    const acc = f[ch];
    for (let o = 0, per = ch ? 16 : 4, amp = 0.5; o < 4; o++, per *= 2, amp *= 0.55) {
      const lat = new Float32Array(per * per);
      for (let i = 0; i < lat.length; i++) { lat[i] = rng(); if (i % 4096 === 4095) await ctx.yield(); }      // (this fork's draws are its own)
      await ctx.yield();
      for (let x = 0; x < size; x++) { const fx = x / size * per, i = Math.floor(fx), t = fx - i; ix0[x] = i % per; ix1[x] = (i + 1) % per; wx[x] = t * t * (3 - 2 * t); }
      for (let y = 0; y < size; y++) {
        const r0 = ix0[y] * per, r1 = ix1[y] * per, wy = wx[y];
        for (let x = 0, p = y * size; x < size; x++, p++) {
          const a = lat[r0 + ix0[x]], b = lat[r0 + ix1[x]], c = lat[r1 + ix0[x]], d = lat[r1 + ix1[x]], w = wx[x];
          acc[p] += amp * (a + (b - a) * w + (c + (d - c) * w - a - (b - a) * w) * wy);
        }
        if (y % 16 === 15) await ctx.yield();
      }
    }
  }
  const norm = 0.5 * (1 + 0.55 + 0.55 ** 2 + 0.55 ** 3), data = new Uint8Array(N * 4), m = size - 1;
  const px = (v) => Math.max(0, Math.min(255, ((v / norm - 0.5) * 1.75 + 0.5) * 255));
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const p = y * size + x, s1 = ((y + 89) & m) * size + ((x + 151) & m), s2 = ((y + 33) & m) * size + ((x + 201) & m);
      data[p * 4] = px(f[0][p]); data[p * 4 + 1] = px(f[1][p]); data[p * 4 + 2] = px(f[0][s1]); data[p * 4 + 3] = px(f[0][s2]);
    }
    if (y % 16 === 15) await ctx.yield();
  }
  const tex = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.magFilter = THREE.LinearFilter; tex.minFilter = THREE.LinearMipmapLinearFilter; tex.anisotropy = 4;
  tex.generateMipmaps = true; tex.colorSpace = THREE.NoColorSpace; tex.needsUpdate = true;
  return tex;
}

// >>> FLIGHT
// The route, its key u values, the pace and the gaze (pois) are pure functions of the hero's anchors: nothing here
// touches the scene, so the camera can be replayed and measured without drawing anything.
const HEAD = new THREE.Vector3(0.4313, 0, -0.9022);            // heading of the hang and the fall: north-north-east
// THE SWELL (the brief's: 6 m crest to trough, 110 m apart, travelling north at 13 m/s) and a 73 m train 14 degrees west
// of north that beats with it, so sets (4 m) and slight crests follow one another. Both run on the world's clock,
// everywhere and for every eye; the route does not follow them: the run-in is level and the swell heaves under it.
// fold: how far each train pinches its crests (the kit whitens where the surface folds; these stay green glass, laced
// only where the chop breaks on them).
const SWELL = [{ dx: 0, dz: -1, L: 110, amp: 3.0, c: 13, fold: 0.05 }, { dx: -0.242, dz: -0.9703, L: 73.3, amp: 1.05, c: 10.7, fold: 0.03 }];
for (const s of SWELL) { s.k = Math.PI * 2 / s.L; s.w = s.c * s.k; }
const RUN_Y = 7.6;                                             // the run-in's height: level, inside the brief's 6 to 8 m
// THE HANG'S LINE. Level, straight, heading north-north-east (HANG_BEAR east of north: inside it, toward its eastern
// end, so the line runs out over the stack's south-east shoulder, which is where the crest leaves the helix, and no
// detour is flown to reach it). It ends where the nose goes over: on an arc of ARC_R m that curls 6 degrees to the left
// as it tips, onto the line of the fall (which is HEAD's and ends at the ring). HANG_LEG is the length of the leg.
const HANG_BEAR = 32 * Math.PI / 180, HANG_LEG = 82, ARC_R = 90, HANG = new THREE.Vector3(Math.sin(HANG_BEAR), 0, -Math.cos(HANG_BEAR));
function routePoints(A) {
  const c62 = Math.cos(62 * Math.PI / 180), s62 = Math.sin(62 * Math.PI / 180);
  const fall = new THREE.Vector3(HEAD.x * c62, -s62, HEAD.z * c62);
  const fallStart = PORTAL.clone().addScaledVector(fall, -202);
  const thN = Math.acos(clamp(HANG.dot(fall), -1, 1)), nrm = fall.clone().addScaledVector(HANG, -Math.cos(thN)).normalize();      // the arc's angle; square to the hang, toward the fall
  const levelEnd = fallStart.clone().addScaledVector(HANG, -ARC_R * Math.sin(thN)).addScaledVector(nrm, -ARC_R * (1 - Math.cos(thN)));
  const arc = (f) => { const a = thN * f; return levelEnd.clone().addScaledVector(HANG, ARC_R * Math.sin(a)).addScaledVector(nrm, ARC_R * (1 - Math.cos(a))); };
  const hangStart = levelEnd.clone().addScaledVector(HANG, -HANG_LEG);
  // the climb: the hero's own helix, 7 m off the wall at the flyer's height (the hero eases it and keeps it under 60 degrees)
  const hel = []; for (let k = 0; k <= 28; k++) hel.push(A.helixAt(k / 28));
  const h0 = hel[0], h1 = hel[28];
  const V3 = (p) => new THREE.Vector3(p[0], p[1], p[2]);
  // the run-in: due north and level for its first 190 m, then up to 11 m for the arch
  const runIn = [[40, RUN_Y, 317], [40, RUN_Y, 250], [40, RUN_Y, 185], [40, RUN_Y, 125], [40, 8.8, 82], [40, 11, 45]].map(V3);
  // round the north foot: ONE even left-hand arc, from 7 m north of the arch's north mouth to the foot of the helix,
  // 52 to 65 m from the axis, rising from 11 m to the helix's 30. Its radius (about 40 m) and the short straight after
  // it are what joins the arch's line (due north at x 40) to the helix's first point along the helix's own heading
  // there, so the turn is the same all the way round: about 34 degrees a second.
  const ZS = -24, th = -Math.atan2(h0.z, h0.x), ct = Math.cos(th), st = Math.sin(th);
  const Rf = ((40 - h0.x) * ct - (ZS - h0.z) * st) / (ct - 1), tf = ((1 - ct) * (ZS - h0.z) - st * (40 - h0.x)) / (ct - 1);
  const footLen = Rf * th + Math.max(tf, 0), nArc = tf > 3 ? 6 : 5, foot = [[40, 11, 12], [40, 11, -10]].map(V3);
  for (let k = 0; k <= nArc; k++) { const f = th * k / 6; foot.push(new THREE.Vector3(40 - Rf * (1 - Math.cos(f)), 11 + (h0.y - 11) * Math.pow(Rf * f / footLen, 1.6), ZS - Rf * Math.sin(f))); }
  const pts = [...runIn, ...foot];
  for (const p of hel) pts.push(p);
  // the crest: over the south-east shoulder, the summit floor below-left, one even left-hand turn from the helix's
  // heading (east) round onto the hang's line, climbing the last 38 m; the leg's first third finishes the climb (2 m)
  const c0 = new THREE.Vector3(15, 181.5, 33.5), cm = c0.clone().lerp(hangStart, 0.5), out = new THREE.Vector3(c0.z - hangStart.z, 0, hangStart.x - c0.x).normalize();
  cm.addScaledVector(out, 4); cm.y = levelEnd.y - 10.3; hangStart.y = levelEnd.y - 2.3;
  const l1 = hangStart.clone().lerp(levelEnd, 1 / 3), l2 = hangStart.clone().lerp(levelEnd, 2 / 3); l1.y = levelEnd.y - 0.2; l2.y = levelEnd.y;
  pts.push(c0, cm, hangStart, l1, l2, levelEnd, arc(1 / 3), arc(2 / 3), fallStart);
  for (const f of [0.25, 0.5, 0.75]) pts.push(fallStart.clone().lerp(PORTAL, f));
  pts.push(PORTAL.clone());
  const surf = fallStart.clone().lerp(PORTAL, fallStart.y / (fallStart.y - PORTAL.y));
  return { pts, h0, h1, hangStart, levelEnd, fallStart, surf, fall };
}
// Key u values (the route's anchors): one pass over the path finds the nearest sample to every anchor point.
function flightKeys(path, R) {
  const want = { archIn: new THREE.Vector3(40, 11, 45), archOut: new THREE.Vector3(40, 11.3, -45), climb0: R.h0, climb1: R.h1, hang0: R.hangStart, hang1: R.levelEnd, fall0: R.fallStart, surf: R.surf };
  const keys = Object.keys(want), best = keys.map(() => 1e18), U = {}, q = new THREE.Vector3();
  for (let i = 0; i <= 700; i++) { path.pointAt(i / 700, q); for (let k = 0; k < keys.length; k++) { const d = q.distanceToSquared(want[keys[k]]); if (d < best[k]) { best[k] = d; U[keys[k]] = i / 700; } } }
  U.burst0 = U.archIn - 0.1; U.burst1 = U.archIn + 0.11;
  U.chase0 = U.archOut - 0.045; U.chase1 = U.climb0 + 0.012;
  U.over = U.hang1 - CAMERA.lookAhead / path.length;      // where the engine's own look-ahead (22 m) reaches the arc: the gaze begins to go over
  U.spear = U.surf - 30.6 / path.length;
  U.whale0 = U.fall0 + 0.25 * (U.surf - U.fall0);
  return U;
}
function flightPlan(A, path, U) {
  const ss = smoothstep;
  // The brief's pace, hung on the route's anchors: 1.1 on the run-in and through the arch, 0.72 round the north foot and
  // up the face, 0.6 on the hang and as the nose goes over, 1.35 early in the fall, 1.05 for the last tenth.
  const pace = (u) => 1.1 - 0.38 * ss(U.archOut - 0.03, U.archOut + 0.07, u) - 0.12 * ss(U.climb1 + 0.02, U.hang0, u)
    + 0.75 * ss(U.fall0 - 0.025, U.fall0 + 0.04, u) - 0.3 * ss(U.fall0 + 0.04, U.fall0 + 0.085, u);
  // THE GAZE: six pois in the order they are flown (the last two share the hang, the tip-over and the fall), each one plain window on the route's anchors with wide fades (the
  // shortest lasts two seconds), none weighing more than 1 and no two aimed at one point. The engine's own
  // look-ahead along the path carries the rest; these refine it.
  const P = new THREE.Vector3(), footAt = new THREE.Vector3(), faceAt = new THREE.Vector3();
  const crest = U.hang0 - U.climb1;                            // the crest, between the climb and the hang: 3.5 s
  // THE HANG, THE TIP-OVER AND THE FALL: two looks at points of the world (see them below). The wreath: the boil's middle,
  // on the sea. The far sea beyond it: a point of the sea FAR_SEA m further out on the fall's own heading, FAR_W of the
  // weight. (700 m, not the horizon itself: from the hang that point lies 14 degrees under the level, which is where a
  // viewer's steady camera looks there already, so that camera is not lifted off the wreath by it: at 3,000 m its wide
  // picture lost the wreath's eye for 37 % of the hang. Turned toward the slot the point would hold the slot in the
  // upright picture too, and lose the right wing's companions from it: it stays on the fall's heading. Seeds 1 to 40.)
  const FAR_SEA = 700, FAR_W = 0.55, farAt = BOIL.clone().addScaledVector(HEAD, FAR_SEA);
  const half = (U.fall0 + U.surf) / 2;                         // half way down the fall
  const footFrom = U.archOut - 0.082, footTo = U.climb0 + 0.01;
  const sumFrom = U.climb1 - 0.05, sumTo = U.climb1 + 0.8 * crest;
  const boilFrom = U.climb1 + 0.15 * crest, boilTo = half, farFrom = U.climb1 + 0.2 * crest, farTo = U.hang0 + 0.8 * (U.hang1 - U.hang0);
  const pois = [
    // the run-in: the arch, a keyhole of light
    { at: A.archCenter.clone(), from: U.archIn - 0.165, to: U.archIn - 0.005, weight: 0.4 },
    // round the north foot the gaze leads the turn: a point on the stack's foot ahead of us round the curve, so the
    // foot and the ledges overhead stay in the picture's left half. It comes on through the arch, level with us (the
    // west wall and the surge below-left), and is whole as the turn begins; the aim then lifts to 13 m above us as the
    // path itself starts to rise (11 to 15 m), and it gives way to the face as the climb begins.
    { at: (time, u) => { path.pointAt(u, P); const th = Math.atan2(P.z, P.x) - 0.55; return footAt.set(Math.cos(th) * 38, P.y + 13 * ss(11.2, 15.5, P.y), Math.sin(th) * 38); },
      from: footFrom, to: footTo, weight: 0.55, fade: 0.36 },
    // the living wall beside the climb: 12 m off, a little ahead and below, so the ledges cross the picture side-on
    // (0.553 along the turn, 0.708 in toward the rock, 0.438 down)
    { at: (time, u) => {
      path.pointAt(u, P); const r = Math.max(Math.hypot(P.x, P.z), 1), ox = P.x / r, oz = P.z / r;
      return faceAt.set(P.x + 12 * (0.553 * oz - 0.708 * ox), P.y - 12 * 0.438, P.z + 12 * (-0.553 * ox - 0.708 * oz));
    }, from: U.climb0 - 0.03, to: U.climb1 - 0.004, weight: 0.7, fade: 0.25 },
    // the crest: the summit floor, below-left
    { at: A.summit.clone(), from: sumFrom, to: sumTo, weight: 0.78, fade: 0.4 },
    // THE HANG, THE TIP-OVER AND THE FALL (the designers' ruling on the fall, 10 Oct: "over the hang and the tip-over the
    // gaze may be held up by a point of interest in the world, so that the horizon ... stand behind the wreath; it comes
    // down onto the fall line no later than half way down the fall").
    // THE WREATH (the boil's middle, on the sea), whole weight, from the back of the crest (where live's pull came on) to
    // the fall's half-way mark. The boil lies dead ahead on the hang's heading and the line of the fall passes through it
    // (0.6 m off at the surface): along the hang this look lays the wreath in the picture's middle column with the
    // companions on both wings; through the tip-over it goes down with the boil (52 to 62 degrees under the horizon), and
    // from U.fall0 it IS the fall's own line, so its fade-out over the fall's first half turns nothing and the lower half
    // of the fall is the path's own look-ahead, as it was.
    { at: BOIL.clone(), from: boilFrom, to: boilTo, weight: 1, fade: 0.85 * crest / (boilTo - boilFrom) },
    // THE FAR SEA BEYOND IT (the horizon behind the wreath), laid over the first: it holds the gaze up over the back of the
    // crest and the first two fifths of the level leg (24 to 28 degrees down: the horizon and the north end of the slot
    // across the top of the picture, the wreath low in it), then lets go over the next two fifths (to U.hang0 + 0.8 of the
    // leg) and the gaze sinks onto the wreath. It is held up no longer and no higher: the wreath's eye lies 40 degrees
    // under the horizon where the leg begins and 52 where it ends, so a gaze that keeps the horizon in the wide picture
    // (31 degrees tall above its middle) has the eye in the picture's lowest third and, for a rider on a mount, behind the
    // bird's head and wings (a mount is drawn four fifths of the way round to the gaze and hides what lies more than 16
    // degrees under its own line). From the hang the stack lies abeam and behind: the world's geometry does not put it
    // behind the wreath.
    { at: farAt, from: farFrom, to: farTo, weight: FAR_W, fade: 0.33 },
  ];
  return { pace, pois };
}
const CAMERA = { fov: 62, near: 0.3, far: 4000, lookAhead: 22, sway: 0.7, bank: 0.72 }, DURATION = 46;
// <<< FLIGHT

const _v = new THREE.Vector3(), _v2 = new THREE.Vector3(), UP = new THREE.Vector3(0, 1, 0);
const hex = (c) => '#' + c.getHexString();

export default {
  id: 'gannet-stack-gale',
  name: 'The White Stack',
  category: 'ocean',
  weirdness: 0.05,
  media: ['air', 'open'],
  async build(ctx) {
    const { rng } = ctx, vary = ctx.vary || {}, detail = ctx.quality?.detail ?? 1, density = clamp(vary.density ?? 1, 0.7, 1.3);
    const scene = new THREE.Scene();

    // ================================================================= SEEDED LOOK
    const lookRng = rng.fork('look'), hour = vary.hour || 'any', mr = lookRng(), wr = lookRng();
    const moodId = hour === 'golden' ? 'golden' : hour === 'dawn' ? 'dawn' : hour === 'day' ? 'day' : hour === 'night' ? 'night'
      : mr < 0.4 ? 'golden' : mr < 0.6 ? 'dawn' : mr < 0.8 ? 'day' : 'night';
    const M = MOODS[moodId];
    const weather = wr < 0.5 ? 'clear' : wr < 0.78 ? 'rain' : 'haar';
    const august = lookRng() < 0.4, gullCast = lookRng() < 0.35, dolphins = lookRng() < 0.35, rare = !!vary.rare;
    const SUN = skyDirection(8, -45);                              // north-west, 8 degrees up: it never moves
    const skyCol = new THREE.Color(M.sky[0], M.sky[1], M.sky[2]), shadeCol = new THREE.Color(M.shade[0], M.shade[1], M.shade[2]);
    const fogD = M.fogD * (weather === 'haar' ? 1.3 : 1);
    scene.fog = new THREE.FogExp2(new THREE.Color(M.fog), fogD);
    scene.background = new THREE.Color(M.fog);

    // ================================================================= HERO (at the origin: its local space is the brief's)
    const hero = await buildHero(ctx, { palette: PALETTE, sunDir: SUN, sunColor: M.key, sunIntensity: M.keyK, skyColor: skyCol, shadeColor: shadeCol,
      season: august ? 'august' : 'june', towerBirds: Math.round(4800 * clamp(density, 0.85, 1.15)) });
    scene.add(hero.object);
    const A = hero.anchors, wind = A.windDir.clone(), lip = A.lipRadius;
    await ctx.yield();

    // ================================================================= PATH
    const R = routePoints(A), path = makePath(R.pts, { samples: 480 });
    await ctx.yield();
    const U = flightKeys(path, R);
    await ctx.yield();
    const ss = smoothstep, { pace, pois } = flightPlan(A, path, U);
    await ctx.yield();

    // ================================================================= SKY + FOG
    const sky = makeSky({
      rng: rng.fork('sky'), preset: 'storm', lightning: 0, zenith: M.zenith, mid: M.mid, horizon: M.horizon, ground: M.ground, horizonPow: 3,
      scatterColor: M.slot, scatter: M.slotK, scatterPow: M.slotPow, scatterHigh: 0, scatterFall: M.slotFall,
      sunElevation: 8, sunAzimuth: -45, sunColor: M.key, sunIntensity: 0, sunGlow: M.moon ? 0.1 : 0.55, sunGlowTight: 0.3, veil: 0.7,
      clouds: { coverage: M.coverage, softness: 0.4, scale: 0.75, lit: M.cloudLit, shade: M.cloudShade, absorb: 2, silver: 0.7, wind: [0.03, -0.012], detail: 0.75, haze: 0.22 },
      clouds2: { coverage: 0.97, softness: 0.6, scale: 0.5, stretch: 0.3, opacity: 1, lit: M.mid, shade: M.zenith, wind: [0.012, -0.005] },
      lightColor: M.key, lightIntensity: M.keyK, fogColor: M.fog, cloudLit: M.cloudLit, cloudShade: M.cloudShade,
      ...(M.moon ? { bodies: [{ elevation: 8.5, azimuth: -45, size: 2.3, color: '#f2f4f8', color2: '#c2c8d2', phase: 1, intensity: 1.5, glow: 0.5, glowSize: 5 }], key: 0, bake: true, renderer: ctx.renderer } : {}),
    });
    scene.add(sky.object);
    await ctx.yield();
    const scudTex = await scudNoise(rng.fork('scud-noise'), ctx, 128);
    await ctx.yield();
    const scud = makeCloudField({ rng: rng.fork('scud'), sky, noiseTexture: scudTex, count: 16, altitude: 350, altitudeJitter: 60, size: [220, 460], height: 0.4, center: [0, 0, -150], extent: [2600, 2600],
      wind: [17, 0, -7], opacity: 0.8, fogFade: 0.6, renderOrder: -0.8, bottomColor: new THREE.Color(M.cloudShade).lerp(new THREE.Color(M.slot), 0.3) });
    scene.add(scud.object);
    await ctx.yield();
    // the squall's side of the sky (see squallMaterial): the shell's own colour is the brief's near-black slate #12161C as it
    // reaches the screen; the shell is three quarters opaque (below), so the side that is seen is lighter than that slate.
    // This world's post (exposure, tone map, contrast, shadow tint) shows any linear value under about 0.03 as pure
    // black, so the colour handed to the shell is the one that the post shows as #12161C: `shown` runs the post
    // backwards, channel by channel, for the mood's own exposure and tints (so every hour is handed the same slate).
    const shown = (hexStr) => {
      const t = new THREE.Color(hexStr), tint = new THREE.Color(M.tint), st = new THREE.Color(M.shadowTint), K = 1.07;
      const one = (v, sh, ti) => { const o = Math.max((v - 0.5 * sh - 0.5) / K + 0.5, 0.001), A = 1 - 0.983729 * o, B = 0.0245786 - 0.432951 * o, C = 0.000090537 + 0.238081 * o;
        return (-B + Math.sqrt(B * B + 4 * A * C)) / (2 * A) * 0.6 / (M.exposure * ti); };
      return new THREE.Color(one(t.r, st.r, tint.r), one(t.g, st.g, tint.g), one(t.b, st.b, tint.b));
    };
    const squallCol = shown(PALETTE[0]);
    const slotDir = new THREE.Vector3(SUN.x, 0, SUN.z).normalize();
    // (how nearly opaque: at 0.95 the shell left a twentieth of the sky's own clouds and the squall's side was a flat pane.
    // At 0.75 the clouds under it stand off their ground, after the post, by as much as live's dark sky's do: lightest
    // less darkest 0.060 against live's 0.062 in the golden hour, 30 degrees either side of the squall's bearing. One number
    // serves every hour: at dawn 0.056 against live's 0.075, by day 0.088 against 0.329. The night's deck was relit after
    // this count (MOODS.night) and was not counted again by it)
    const T = { value: 0 };                                        // the world's clock, for every shader that reads it
    const squall = new THREE.Mesh(new THREE.SphereGeometry(3000, 24, 12), squallMaterial(squallCol, slotDir, 0.75, T));
    squall.frustumCulled = false; squall.renderOrder = -0.5; scene.add(squall);
    await ctx.yield();
    const fxset = FX.fxGroup(); scene.add(fxset.object);
    // four broad, soft shafts that lean out of the slot across the sea. The sky's own rule places them: their source
    // is a disc under the deck's edge 640 m up-sun of the stack's axis (the middle of the slot's bearing), 400 m up,
    // and they lean down-sun from it, so they stand on the sea round the stack and to the west and north of it.
    // Each thins to nothing 40 to 190 m above the water (its own length), so from the sea no shaft is a pale bar
    // standing on the horizon; where its line meets the sea the WATER is lit instead (the pools: see SEA).
    const rays = fxset.add(FX.makeGodRays({ rng: rng.fork('rays'), time: T, position: [slotDir.x * 640, 400, slotDir.z * 640], direction: [-slotDir.x * 0.74, -0.5, -slotDir.z * 0.74], radius: 270, count: 4, length: 640,
      width: [42, 125], color: M.rays, intensity: M.rayK * 4.2, falloff: 0.9, speed: 0.55, fogAmount: 0.3 }));
    await ctx.yield();

    // ================================================================= SEA
    const L = Water.waterLight(sky, { sunDir: SUN, sunColor: M.key, sunIntensity: M.keyK * 2.0, glint: 0.42, fogColor: M.fog, ambient: M.seaAmb });
    const air = { color: new THREE.Color(M.fog), density: fogD };
    const hideBelow = [sky.object, scud.object, fxset.object, squall];
    let seaY = () => 0;      // the surface as it is drawn (set below, once the kit's waves exist)
    const sea = Water.makeSea({
      rng: rng.fork('sea'), light: L, level: 0, hideBelow, air,
      ocean: { preset: 'storm', height: 2.9, wavelength: 80, contrast: 0.66, windAngle: -Math.PI / 2, segments: 144, sprayOpacity: 0.8, deep: M.deep, scatter: M.scatter, foamColor: M.foam, glow: M.glow, spray: true,
        shallows: [{ x: 0, z: 0, radius: 50, falloff: 30 }, { x: -400, z: 30, radius: 30, falloff: 26 }, { x: -428, z: -72, radius: 24, falloff: 24 }], shallowColor: '#3f927c', shoreDamp: 0.3 },
      underwater: { surfaceAt: (x, z, t) => seaY(x, z, t), water: M.water, deep: M.waterDeep, floorY: -60, fogDensity: 0.02, sunDisc: 0.3, rayIntensity: 1.0,
        particles: { count: Math.round(420 * detail), range: 40, size: 0.05 }, bubbles: { count: 110, columns: 6, size: 0.14, sources: [[168, -58, -214], [186, -58, -206], [176, -58, -228], [160, -58, -200], [190, -58, -222], [172, -58, -196]] } },
    });
    scene.add(sea.object);
    // THE SEA'S SHADING is the world's own main (SEA_MAIN_GLSL, see it), set in place of the kit's before the shader is first
    // compiled: the kit's shader text up to its main is kept, and the main is the world's. It is set only if every name it
    // reads stands in the kit's text as it did on 10 Oct (`needs`); the flag `seaMain` returned with the world then is true,
    // and so are `seaClamp`, `seaPlace` and (where the shafts are found) `seaPools`, whose replaces are written into it.
    // If the kit is ever worded differently the main is not set and the four string replaces of before are made instead,
    // each with its own fallback: a replace whose line is not found is left out, nothing else breaks, its flag stays false.
    // 1. The kit's marbled foam can mix past zero (its coverage goes negative where two veins cross) and write
    //    colours below zero: they are clamped.
    // 2. SEA STATE BY PLACE. The kit whitens the water wherever its short waves fold past uFoamT, the same everywhere.
    //    Here that threshold follows the water's own distance from the stack's axis (uOpenSea: from, to, how much
    //    harder a wave must fold): within 125 m, where the swell feels the stack, the sea is torn white; beyond 215 m,
    //    on the open swell, the sheets of fold-foam are held back and the long slopes are green glass, back-lit at
    //    their crests, with lace and wind rows. It is a property of the water, the same for every eye.
    let seaClamp = false, seaPlace = false, seaMain = false;
    const pools = [0, 1, 2, 3].map(() => new THREE.Vector4(0, 0, 1, 0)), poolBase = [0, 0, 0, 0], poolPh = [0, 0, 0, 0], poolLean = new THREE.Vector4(1, 0, 1, 0);
    { const om = sea.ocean.material, key = 'gl_FragColor = vec4(col,1.);', kF = 'fT = uFoamT-.25*uSteep;', kS = 'smoothstep(uFoamT,fT,', kM = 'void main(){';
      const needs = ['uniform vec4 uWA[NF], uWB[NF];', 'uFoamT, uFoam, uDetail, uRough, uFadeA, uFadeB, uGlitter, uReflect, uSteep, uContrast, uHorizonMix', 'uDeep, uScatter, uFoamColor, uGlow, uHorizonColor, uShallowColor',
        'varying vec3 vWorld; varying vec2 vXZ; varying float vH;', 'const mat2 R1 = mat2(.7986,.6018,-.6018,.7986), R2 = mat2(-.3256,.9455,-.9455,-.3256);', 'uSunDir, uScatDir, uSunColor', 'uUwWater', 'vec3 kitUnderside(', 'vec2 kitShoal(',
        'float kitFog(', 'float kitPix(', 'vec3 kitSky(', 'vec3 kitAtmo(', 'vec3 kitSunSpec(', 'float kitGlitter(', 'vec2 h22(', 'vec2 kitCell4(', 'float fbm2(', 'float vnoise(', 'vec3 noised(', 'float pow5(', 'vec3 kitAmbient('];
      if (om && typeof om.fragmentShader === 'string' && om.fragmentShader.includes(kM) && needs.every((k) => om.fragmentShader.includes(k))) {
        om.uniforms.uOpenSea = { value: new THREE.Vector3(125, 215, 0.12) };
        om.uniforms.uPool = { value: pools }; om.uniforms.uPoolLean = { value: poolLean }; om.uniforms.uPoolCol = { value: new THREE.Color(M.rays).multiplyScalar(M.moon ? 0.8 : 1.15) };      // (the pools are dark, w = 0, until the shafts are found below)
        om.fragmentShader = om.fragmentShader.slice(0, om.fragmentShader.indexOf(kM)) + SEA_MAIN_GLSL;
        om.needsUpdate = true; seaMain = seaClamp = seaPlace = true;
      } else if (om && typeof om.fragmentShader === 'string') {
        if (om.fragmentShader.includes(key)) { om.fragmentShader = om.fragmentShader.replace(key, 'col = max(col, 0.); ' + key); seaClamp = true; }
        if (om.fragmentShader.includes(kF) && om.fragmentShader.includes(kS) && om.fragmentShader.includes(kM)) {
          om.uniforms.uOpenSea = { value: new THREE.Vector3(125, 215, 0.12) };
          om.fragmentShader = om.fragmentShader.replace(kM, 'uniform vec3 uOpenSea;\n' + kM).replace(kF, 'gsFT = uFoamT-uOpenSea.z*smoothstep(uOpenSea.x,uOpenSea.y,length(vXZ)), fT = gsFT-.25*uSteep;').split(kS).join('smoothstep(gsFT,fT,');
          seaPlace = true;
        }
        om.needsUpdate = true;
      } }
    // 3. THE POOLS OF LIGHT. Where the line of each shaft meets the sea the water itself is lit: the ocean's own body
    //    colour (the green, its wave shadows, its back-lit crests) and its glitter are multiplied up inside a soft,
    //    broken, slowly shifting footprint, brass under the golden slot and silver by day. What the water mirrors
    //    (the sky, more and more toward the horizon) is left alone, and the glitter is raised only where the water
    //    is seen from 3 to 14 degrees above its own plane and more, so from low down a far pool is a faint brighter
    //    band of the swell's own green and never a pale flat strip; from above it is bright jade and sparkle.
    //    A third guarded replace (flag `seaPools`).
    // 4. SPRAY BY PLACE. The kit throws its wind-blown spray off every crest near the lens, the same everywhere. Here
    //    it follows the water's own distance from the stack's axis, like the fold-foam of point 2: all of it within
    //    225 m, where the swell feels the stack, thinning to none at 300 m. Out on the open swell (the entry lies 317 m
    //    out) the crests throw none, so the first sight of this sea through the previous world's ring is clean jade
    //    swell and not a white smear. The same from any eye, on any clock.
    //    Fourth guarded replace (flag `seaCalm`).
    let seaPools = false, seaCalm = false;
    const CALM = new THREE.Vector4(0, 0, 300, 225);       // the stack's axis (x, z); no spray thrown further than 300 m from it, all of it within 225 m
    { const om = sea.ocean.material, kM = 'void main(){', kC = 'vec3 col = mix(body, refl, F);', kG = 'col += spec*(1.-fa);';
      const ro = rays.object, go = ro && ro.geometry, aO = go && go.getAttribute('aOrigin'), aP = go && go.getAttribute('aParam'), rd = rays.uniforms && rays.uniforms.uDir && rays.uniforms.uDir.value;
      if (om && typeof om.fragmentShader === 'string' && (seaMain || (om.fragmentShader.includes(kM) && om.fragmentShader.includes(kC) && om.fragmentShader.includes(kG))) && aO && aP && rd && rd.y < -0.1 && aO.count >= 4) {
        const hl = Math.hypot(rd.x, rd.z); poolLean.set(rd.x / hl, rd.z / hl, 1 / -rd.y, 0);      // the footprint is drawn out along the shafts' lean
        for (let i = 0; i < 4; i++) {
          const oy = ro.position.y + aO.getY(i), t = oy / -rd.y;
          pools[i].set(ro.position.x + aO.getX(i) + rd.x * t, ro.position.z + aO.getZ(i) + rd.z * t, clamp(0.6 * 125 * aP.getX(i), 45, 110), 0);
          poolBase[i] = 0.55 + 0.45 * aP.getW(i); poolPh[i] = aP.getZ(i);
        }
        if (!seaMain) { om.uniforms.uPool = { value: pools }; om.uniforms.uPoolLean = { value: poolLean }; om.uniforms.uPoolCol = { value: new THREE.Color(M.rays).multiplyScalar(M.moon ? 0.8 : 1.15) };
        om.fragmentShader = om.fragmentShader.replace(kM, `uniform vec4 uPool[4]; uniform vec4 uPoolLean; uniform vec3 uPoolCol;
float gsPh(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * .1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
float gsPn(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f); return mix(mix(gsPh(i), gsPh(i + vec2(1., 0.)), f.x), mix(gsPh(i + vec2(0., 1.)), gsPh(i + vec2(1., 1.)), f.x), f.y); }
vec3 gsPool(vec2 xz) {
  float m = 0., n = .5 * (gsPn(xz * .011 + uPoolLean.w * .021) - .5) + .2 * (gsPn(xz * .045 - uPoolLean.w * .05) - .5);
  for (int i = 0; i < 4; i++) { vec2 d = xz - uPool[i].xy; vec2 q = vec2(d.x * uPoolLean.y - d.y * uPoolLean.x, (d.x * uPoolLean.x + d.y * uPoolLean.y) / max(uPoolLean.z, 1.)) / max(uPool[i].z, 1.);
    m += uPool[i].w * (1. - smoothstep(.4, 1., length(q) + n)); }
  return uPoolCol * min(m, 1.25);
}
` + kM).replace(kC, 'vec3 gsPl = gsPool(vXZ); body *= 1. + 1.7 * gsPl; ' + kC).replace(kG, 'col += spec*(1.-fa)*(1. + 3. * gsPl * smoothstep(.05, .25, V.y));'); }
        om.needsUpdate = true; seaPools = true;
      }
      const sp = sea.ocean.spray && sea.ocean.spray.material, kV = 'vQ = position.xy; vSeed = aB.z; vWorld = w;', kI = '#include <fog_pars_vertex>';
      if (sp && typeof sp.vertexShader === 'string' && sp.vertexShader.includes(kV) && sp.vertexShader.includes(kI)) {
        sp.uniforms.uCalm = { value: CALM };
        sp.vertexShader = sp.vertexShader.replace(kI, 'uniform vec4 uCalm;\n' + kI).replace(kV, 'vI *= 1. - smoothstep(uCalm.w, uCalm.z, distance(w.xz, uCalm.xy)); ' + kV);
        sp.needsUpdate = true; seaCalm = true;
      } }
    await ctx.yield();
    const OU = sea.ocean.uniforms;
    OU.uAmp.value = 3.6;
    // THE SWELL. The kit's sea keeps its six shorter waves (76 m and under: chop, lace, wind rows). Its two longest
    // are replaced here by SWELL (FLIGHT): the brief's swell and the 73 m train that beats with it, on the world's
    // clock like every other wave. The kit copies its waves for its own heightAt when it is built, so the trawler, the
    // surface veil and the bait ball's rule ask seaY, which reads the live uniforms.
    const WA = OU.uWA.value, WB = OU.uWB.value;
    SWELL.forEach((s, i) => { WA[i].set(s.dx, s.dz, s.k, s.w); WB[i].set(s.amp, s.fold / (s.k * s.amp), WB[i].z, s.L); });      // (each keeps the phase the kit drew for that wave from the 'sea' fork: where the crests stand at any moment is the seed's)
    seaY = (x, z, time) => {
      let px = x, pz = z, dy = 0;
      for (let it = 0; it < 5; it++) {
        let dx = 0, dz = 0; dy = 0;
        for (let i = 0; i < 8; i++) { const a = WA[i], b = WB[i], th = a.z * (a.x * px + a.y * pz) - a.w * time + b.z, q = b.y * b.x * Math.cos(th); dx += a.x * q; dz += a.y * q; dy += b.x * Math.sin(th); }
        if (it < 4) { px += (x - dx - px) * 0.85; pz += (z - dz - pz) * 0.85; }
      }
      return dy;
    };
    const shared = { ...hero.uniforms, uWA: OU.uWA, uWB: OU.uWB, uSeaT: OU.uTime, uSpacing: OU.uSpacing, uR0: OU.uR0, uSeaRad: OU.uRadius,
      uSeaC: { value: new THREE.Vector3() }, uShoal: { value: new THREE.Vector4(0, 0, 50, OU.uShoreDamp.value) }, uJuv: { value: august ? 1 / 6 : 1 / 12 } };

    // ================================================================= BIRDS
    const gannet = gannetGeometry();
    const solid = (x, y, z) => { if (y >= 177) return false; const r = Math.hypot(x, z); return r < 80 && r < lip(Math.atan2(z, x), clamp(y, 0, 170)) + 4; };       // nothing of the stack reaches 76 m from its axis
    // THE CLEAR AIR (2 m round the lens, kept by PLACE). The lens rides the route's line exactly (the engine lags and
    // sways the gaze, never the place), so a body is kept off the lens by keeping its whole course off that line, a
    // fixed line in the place: by 2.25 to 2.5 m and its half span (the margin is for the rules' sampling). lineP: the
    // line, a point every half metre (the last: half a metre behind its start, where the engine's hand-over can leave
    // the lens for a frame). lineOff: the least distance from the line to a level stroke (centre, heading, half
    // length), its wobble box taken off. crest: the sea's highest. One with no clear seat keeps live's.
    const lineP = new Float32Array((Math.ceil(path.length * 2) + 2) * 3), nL = lineP.length - 6;
    for (let k = 0; k < lineP.length; k += 3) { path.posAtDist(k > nL ? -0.5 : k / nL * path.length, _v); lineP.set([_v.x, _v.y, _v.z], k); if (k % 900 === 897) await ctx.yield(); }
    let crest = 0; for (let k = 0; k < 8; k++) crest += WB[k].x;
    // uLine, for the crossers' hump: the line's x, its height at its start, its rise before z 45 (where their tracks
    // end) and where that begins; a smooth step on those, raised (d) to stand 4.1 m over every point of the line
    { let up = 0, zr = 46, d = 0;
      for (let k = 0; lineP[k + 2] > 45; k += 3) { up = Math.max(up, lineP[k + 1] - lineP[1]); if (lineP[k + 1] < lineP[1] + 0.02) zr = lineP[k + 2]; }
      for (let k = 0; lineP[k + 2] > 45; k += 3) d = Math.max(d, lineP[k + 1] - lineP[1] - up * (1 - ss(45, zr, lineP[k + 2])));
      shared.uLine = { value: new THREE.Vector4(lineP[0], lineP[1] + 4.1 + d, up, zr) }; }
    const lineOff = (x, y, z, ex = 1, ez = 0, hl = 0, bs = 0, by = 0, P = lineP) => {
      let b = 1e9;
      for (let k = 0; k < P.length; k += 3) { const qx = P[k] - x, qz = P[k + 2] - z, a = Math.max(Math.abs(qx * ex + qz * ez) - hl, 0), l = Math.max(Math.abs(qx * ez - qz * ex) - bs, 0), h = Math.max(Math.abs(P[k + 1] - y) - by, 0), d = a * a + l * l + h * h; if (d < b) b = d; }
      return Math.sqrt(b); };
    // every search of the clear air that finds no seat is counted here by kind (the body then keeps live's seat), with the
    // divers the last deal's law moved and the tracks that took the line's bar alone: read by reports, drawn by nothing
    const fails = scene.userData.seatFails = { hangers: 0, wheelers: 0, ...(await hero.clearAir(lineP)), tracks: 0, landers: 0, rafts: 0, flocks: 0, diversMoved: 0, tracksLineOnly: 0 };
    // --- near flyers: tracks that cross the route. Five zones: the run-in, the north foot, the open side of the climb
    // (level tracks 8-30 m outside the helix, turning the tower's way, so they pass slowly as we rise), the crest
    // (10-38 m round the path over the summit and the shoulder) and the hang.
    const nNear = Math.round(460 * density * detail), nrng = rng.fork('near');
    const nA = new Float32Array(nNear * 4), nB = new Float32Array(nNear * 4);
    for (let i = 0; i < nNear; i++) {
      for (let tries = 0; tries < 7; tries++) {
        const zone = nrng(), kind = zone < 0.35 ? 0 : zone < 0.72 ? 1 : zone < 0.92 ? 2 : 0;
        const u = zone < 0.2 ? nrng.range(0.02, 0.24) : zone < 0.35 ? nrng.range(U.archOut - 0.02, U.climb0) : zone < 0.72 ? nrng.range(U.climb0, U.climb1) : zone < 0.92 ? nrng.range(U.climb1, U.hang0 + 0.02) : nrng.range(U.hang0 + 0.02, 0.8);
        const p = path.pointAt(u, _v), pr0 = Math.max(Math.hypot(p.x, p.z), 1);
        const ang = kind === 1 ? Math.atan2(p.z, p.x) + nrng.range(-0.9, 0.9) : nrng.range(0, TAU);
        const off = kind === 1 ? nrng.range(8.5, 30) : kind === 2 ? nrng.range(10, 38) : nrng.range(9, 40), upo = kind === 1 ? nrng.range(-9, 10) : kind === 2 ? nrng.range(-6, 12) : nrng.range(-4, 15);
        const ax = p.x + Math.cos(ang) * off, az = p.z + Math.sin(ang) * off, ay = Math.max(p.y + upo, 3.5);
        // headings: upwind over the open sea, anticlockwise round the stack near it (the tower's sense)
        const rr = Math.hypot(ax, az), tx = az / Math.max(rr, 1), tz = -ax / Math.max(rr, 1), near = kind ? 1 : rr < 130 ? 0.8 : 0.15, pick = nrng(), jit = kind ? nrng.range(-0.25, 0.25) : nrng.range(-0.5, 0.5);
        let hx = pick < near ? tx : pick < near + (1 - near) * 0.6 ? -wind.x : wind.x, hz = pick < near ? tz : pick < near + (1 - near) * 0.6 ? -wind.z : wind.z;
        const ca = Math.cos(jit), sa = Math.sin(jit), dx = hx * ca - hz * sa, dz = hx * sa + hz * ca;
        const Lt = kind === 1 ? nrng.range(70, 110) : nrng.range(120, 200), sp = kind ? nrng.range(12, 17) : nrng.range(13, 19), seed = nrng();
        let ok = true;
        for (let k = -3; k <= 3 && ok; k++) { const s = (k / 3) * (Lt * 0.5 - 12), x = ax + dx * s, z = az + dz * s; if (solid(x, ay, z) || path.distanceTo(x, ay, z) < 9) ok = false; }
        if (ok || tries === 6) { nA.set([ax, ok ? ay : ay + 70, az, seed], i * 4); nB.set([dx, dz, sp, Lt], i * 4); break; }
      }
      if (i % 8 === 7) await ctx.yield();
    }
    // the clear air: a track whose swept band (1.2 m to either side, 2.4 m up and down) comes within 2.3 m and the
    // bird's half span of the line is lifted or dropped, by the least step that clears it, out of the rock (dropped
    // only if its band stays 1 m over the highest crest). The rock of this rule is solid's: the stack's lips and
    // 4 m more, wider than the rock as drawn. A track live deals inside that, with no height clear of both, takes
    // the height nearest live's that clears the line alone (over the crests as above): it stands within solid's
    // 4 m at either height, as live's does, and need not touch the drawn rock
    for (let i = 0; i < nNear; i++) {
      const ax = nA[i * 4], y0 = nA[i * 4 + 1], az = nA[i * 4 + 2], dx = nB[i * 4], dz = nB[i * 4 + 1], hl = nB[i * 4 + 3] / 2;
      const rock = (y) => { for (let q = -hl; q <= hl; q += 2) if (solid(ax + dx * q, y, az + dz * q)) return true; return false; };
      let j = 0, alt = null;
      for (let y = y0; j < 400; j++, y = y0 + (j & 1 ? 0.5 : -0.5) * ((j + 1) >> 1)) if (lineOff(ax, y, az, dx, dz, hl, 1.2, 2.4) >= 3.75 && (!j || y > y0 || y >= crest + 3.4)) { if (!j || !rock(y)) { nA[i * 4 + 1] = y; break; } if (alt === null) alt = y; }
      if (j === 400) { if (alt === null) fails.tracks++; else { nA[i * 4 + 1] = alt; fails.tracksLineOnly++; } }
      if (i % 8 === 7) await ctx.yield();
    }
    const streamMat = gannetMaterial(shared, TRAJ.stream);
    scene.add(instancedMesh(gannet, nNear, { iA: nA, iB: nB }, streamMat));
    await ctx.yield();

    // --- landers: twelve modelled birds coming in to the ledges beside the climb, a little ahead of where we pass
    const lrng = rng.fork('landers'), nLand = 12, lA = new Float32Array(nLand * 4), lB = new Float32Array(nLand * 4);
    for (let i = 0; i < nLand; i++) {
      const p = path.pointAt(lerp(U.climb0 + 0.012, U.climb1 - 0.012, (i + lrng()) / nLand), _v);
      const th = Math.atan2(p.z, p.x) - lrng.range(0.1, 0.2), ox = Math.cos(th), oz = Math.sin(th);      // the climb turns toward smaller angles
      A.ledgeAt(th, p.y + lrng.range(-4, 2.5), _v2);
      lA.set([_v2.x + ox * 0.5, _v2.y + 1.25, _v2.z + oz * 0.5, lrng()], i * 4); lB.set([ox, oz, lrng.range(5.5, 8.5), 0], i * 4);
    }
    // the clear air: a lander whose way in (its wobble counted) comes within 2.27 m and its half span of the line
    // takes the nearest other ledge on its own bearing whose way in is clear
    for (let i = 0; i < nLand; i++) {
      const ox = lB[i * 4], oz = lB[i * 4 + 1], y0 = lA[i * 4 + 1] - 1.25, N = [], live = lA.slice(i * 4, i * 4 + 3);
      for (let k = 0; k < lineP.length; k += 3) if (Math.hypot(lineP[k] - lA[i * 4], lineP[k + 2] - lA[i * 4 + 2]) < 30) N.push(lineP[k], lineP[k + 1], lineP[k + 2]);
      const free = () => { for (let k = 0; k <= 24; k++) { const e = k / 24, a = lerp(3.3, 0.25, e), b = 2.2 * (1 - e); if (lineOff(lA[i * 4] + ox * a - oz * b, lA[i * 4 + 1] + lerp(4.2, -0.85, e * e), lA[i * 4 + 2] + oz * a + ox * b, 1, 0, 0, 0, 0, N) < 3.55 + 0.92 * (1 - 0.7 * e)) return false; } return true; };
      for (let j = 1; !free() && j < 80; j++) { A.ledgeAt(Math.atan2(oz, ox), y0 + (j & 1 ? 1 : -1) * ((j + 1) >> 1), _v2); lA.set([_v2.x + ox * 0.5, _v2.y + 1.25, _v2.z + oz * 0.5], i * 4); }
      if (!free()) { lA.set(live, i * 4); fails.landers++; }
      await ctx.yield();
    }
    scene.add(instancedMesh(gannetGeometry(true), nLand, { iA: lA, iB: lB }, gannetMaterial({ ...shared, uWindDir: { value: wind } }, TRAJ.lander)));
    await ctx.yield();

    // --- rafts of sitting birds beside the run-in
    const nRaft = Math.round(440 * density * detail), rrng = rng.fork('rafts'), rA = new Float32Array(nRaft * 4), rB = new Float32Array(nRaft * 4);
    const yawWind = Math.atan2(-wind.x, -wind.z);
    { let cx = 0, cz = 0, cr = 1;
      for (let i = 0; i < nRaft; i++) {
        if (i % 20 === 0) { const side = rrng() < 0.5 ? -1 : 1; cr = rrng.range(5, 9); cx = 40 + side * (cr + rrng.range(3.5, 15)); cz = lerp(300, 64, (i / 20 + rrng()) / Math.ceil(nRaft / 20)); }      // one raft to every 11 m of the run-in, on either side
        const a = rrng.range(0, TAU), r = cr * Math.sqrt(rrng());
        rA.set([cx + Math.cos(a) * r * 1.6, cz + Math.sin(a) * r, yawWind + rrng.range(-0.5, 0.5), rrng()], i * 4);
      } }
    // the clear air: the whole course of a bird that is put up (TRAJ.raft: from where it sits, 51 m forward and out
    // to its side, up to 5.4 m over the highest crest) is a level stroke with its height for a box; a bird whose
    // stroke comes within 2.24 m and its half span of the line sits at the nearest place to either side that is clear
    for (let i = 0; i < nRaft; i++) {
      const x0 = rA[i * 4], s = rA[i * 4 + 3], h = 1.4 + 1.3 * (s * 5 % 1);
      const far = (x) => { const dx = (x < 40 ? -1 : 1) * (0.3 + 0.5 * (s * 11 % 1)), dl = Math.hypot(dx, 1); return lineOff(x + 25.65 * dx / dl, h, rA[i * 4 + 1] - 25.65 / dl, dx / dl, -1 / dl, 25.65, 0, crest + h) >= 3.6; };      // (its side as TRAJ.raft takes it)
      let j = 0; for (let x = x0; j < 80; j++, x = x0 + (j & 1 ? 0.25 : -0.25) * ((j + 1) >> 1)) if (far(x)) { rA[i * 4] = x; break; }
      if (j === 80) fails.rafts++;
      if (i % 40 === 39) await ctx.yield();
    }
    const rafts = instancedMesh(gannet, nRaft, { iA: rA, iB: rB }, gannetMaterial(shared, TRAJ.raft)); scene.add(rafts);
    await ctx.yield();
    // --- near birds that cross the run-in's line on the world's clock (TRAJ.cross): each has its own cycle, track and seed
    // (forked from the rafts' own rng, which is done: a fork draws from its parent, and the world's later forks must stay as they were)
    const nCross = 7, frng = rrng.fork('lift'), fA2 = new Float32Array(nCross * 4), fB2 = new Float32Array(nCross * 4);
    for (let i = 0; i < nCross; i++) { const per = frng.range(9, 17); fA2.set([per, per * frng.range(12.5, 15.5), frng.range(-14, 14), frng()], i * 4); }
    const crossers = instancedMesh(gannet, nCross, { iA: fA2, iB: fB2 }, gannetMaterial(shared, TRAJ.cross)); scene.add(crossers);
    await ctx.yield();

    // --- escorts: thirty companions for the hang and the fall, and the chase round the north foot
    const erng = rng.fork('escort'), nEsc = 30 + (gullCast ? 3 : 2), eA = new Float32Array(nEsc * 4), eB = new Float32Array(nEsc * 4);
    for (let i = 0; i < 30; i++) {
      const side = i % 2 ? 1 : -1, z = erng.range(5, 20), x = side * (Math.max(4.6, 0.42 * z) + erng.range(0, 5));
      eA.set([x, erng.range(-2.6, 3.4), z, erng()], i * 4); eB.set([0, 0, erng.range(1.3, 1.5), 0], i * 4);
    }
    // the six nearest ahead are the leads (iB.w)
    Array.from({ length: 30 }, (q, i) => [eA[i * 4 + 2], i]).sort((a, b) => a[0] - b[0]).slice(0, 6).forEach(([, i]) => { eB[i * 4 + 3] = 1; });
    // the chase (the harried gannet, its pursuer or pursuers): inside our turn round the north foot, 9 to 13 m ahead
    eA.set([-6.2, 0.8, 9, 0.37], 120); eB.set([1, 0, 1.5, 0], 120);
    eA.set([-5.0, 2.0, 11.5, 0.71], 124); eB.set([2, gullCast ? 3 : 2, gullCast ? 1.6 : 1.45, 0], 124);
    if (gullCast) { eA.set([-8.4, 2.7, 13.5, 0.13], 128); eB.set([2, 3, 1.5, 0], 128); }
    const escU = { uCam: { value: new THREE.Vector3() }, uPF: { value: new THREE.Vector3(0, 0, -1) }, uPR: { value: new THREE.Vector3(1, 0, 0) }, uPU: { value: new THREE.Vector3(0, 1, 0) }, uHead: { value: new THREE.Vector3(0, 0, -1) }, uEsc: { value: new THREE.Vector4(0, 0, 0, 0) }, uPart: { value: 0 } };
    const escMat = gannetMaterial({ ...shared, ...escU }, TRAJ.escort);
    scene.add(instancedMesh(gannet, nEsc, { iA: eA, iB: eB }, escMat));
    const ribbon = new THREE.BufferGeometry();
    { const P = [], I = []; for (let k = 0; k <= 8; k++) P.push(-1, k / 8, 0, 1, k / 8, 0); for (let k = 0; k < 8; k++) I.push(k * 2, k * 2 + 1, k * 2 + 3, k * 2, k * 2 + 3, k * 2 + 2);
      ribbon.setAttribute('position', new THREE.BufferAttribute(new Float32Array(P), 3)); ribbon.setIndex(I); }
    const trailMat = trailMaterial({ ...shared, ...escU });
    trailMat.uniforms.uTrailGlow.value.set(M.trail || '#000000').multiplyScalar(4);
    scene.add(instancedMesh(ribbon, 30, { iA: eA, iB: eB }, trailMat, 6));
    await ctx.yield();

    // --- divers over the boil, each with its strike (plume, foam ring, bubble trail)
    const nDive = Math.round(330 * clamp(density, 0.85, 1.2) * Math.max(detail, 0.75)), drng = rng.fork('divers');
    const dA = new Float32Array(nDive * 4), dB = new Float32Array(nDive * 4);
    const lineD = (x, z) => { const px = x - BOIL.x, pz = z - BOIL.z, s = clamp(-(px * HEAD.x + pz * HEAD.z), 0, 48); return Math.hypot(px + HEAD.x * s, pz + HEAD.z * s); };
    for (let i = 0; i < nDive; i++) {
      for (let tries = 0; tries < 8; tries++) {
        const r = Math.sqrt(lerp(25 * 25, 72 * 72, drng())), th = drng.range(0, TAU), sx = BOIL.x + Math.cos(th) * r, sz = BOIL.z + Math.sin(th) * r;
        const psi = drng.range(0, TAU), rho = drng.range(13, 24), X = drng.range(8, 14), h = drng.range(22, 48), per = drng.range(8, 13.5), seed = drng();
        const kx = sx - Math.cos(psi) * X + Math.sin(psi) * rho, kz = sz - Math.sin(psi) * X - Math.cos(psi) * rho;
        const ok = lineD(sx, sz) > 15 && lineD(kx, kz) > rho + 9;
        if (ok || tries === 7) { dA.set([sx, sz, h, seed], i * 4); dB.set([per, rho, psi, X], i * 4); if (ok) break; } else continue;
        // the eighth deal obeys the two bars as well, BY PLACE: strike and circle are turned together about the boil's
        // middle by the least angle either way (steps of 0.01) at which both hold; where its circle's centre lies too
        // near the middle for any turn, 2 m further out at a time, to the ring's edge (there a turn always holds). No draw.
        turn: for (let R = r; ; R = Math.min(R + 2, 72)) {
          for (let k = 1; k < 630; k++) {
            const a = (k & 1 ? 0.01 : -0.01) * ((k + 1) >> 1), x = BOIL.x + Math.cos(th + a) * R, z = BOIL.z + Math.sin(th + a) * R, p = psi + a;
            if (lineD(x, z) > 15 && lineD(x - Math.cos(p) * X + Math.sin(p) * rho, z - Math.sin(p) * X - Math.cos(p) * rho) > rho + 9) { dA.set([x, z], i * 4); dB[i * 4 + 2] = p; fails.diversMoved++; break turn; }
          }
          if (R === 72) break;
        }
      }
      if (i % 60 === 59) await ctx.yield();
    }
    await ctx.yield();
    const divers = instancedMesh(gannet, nDive, { iA: dA, iB: dB }, gannetMaterial(shared, TRAJ.diver)); scene.add(divers);
    await ctx.yield();
    // every diver's strike, and as many again from birds too far below to see: the wreath is spiked all round the eye
    const nStrike = nDive + Math.round(170 * detail), kA = new Float32Array(nStrike * 4), kB = new Float32Array(nStrike * 4);
    kA.set(dA); kB.set(dB);
    for (let i = nDive; i < nStrike; i++) {
      for (let tries = 0; tries < 6; tries++) {
        const r = Math.sqrt(lerp(23 * 23, 75 * 75, drng())), th = drng.range(0, TAU), sx = BOIL.x + Math.cos(th) * r, sz = BOIL.z + Math.sin(th) * r, per = drng.range(4.5, 8), seed = drng();
        if (lineD(sx, sz) > 13 || tries === 5) { kA.set([sx, sz, 0, seed], i * 4); kB.set([per, 0, 0, 0], i * 4); break; }
      }
    }
    await ctx.yield();
    const strikeBase = new THREE.BufferGeometry();
    { const K = [], I = []; for (let k = 0; k < 3; k++) { K.push(-1, -1, k, 1, -1, k, 1, 1, k, -1, 1, k); I.push(k * 4, k * 4 + 1, k * 4 + 2, k * 4, k * 4 + 2, k * 4 + 3); }
      strikeBase.setAttribute('position', new THREE.BufferAttribute(new Float32Array(K), 3)); strikeBase.setAttribute('aK', new THREE.BufferAttribute(new Float32Array(K), 3)); strikeBase.setIndex(I); }
    const strikeMat = strikeMaterial(shared);
    strikeMat.uniforms.uTrailGlow.value.set(M.trail || '#000000').multiplyScalar(4);
    const strikes = instancedMesh(strikeBase, nStrike, { iA: kA, iB: kB }, strikeMat, 5); scene.add(strikes);
    await ctx.yield();

    // ================================================================= THE BOIL (wreath + eye) and the bait ball under it
    const wreathGeo = new THREE.BufferGeometry();
    { const NR = 22, NS = 72, P = [0, 0, 0], I = [];
      for (let i = 1; i <= NR; i++) for (let j = 0; j < NS; j++) { const a = (j / NS) * TAU, r = 96 * i / NR; P.push(Math.cos(a) * r, 0, Math.sin(a) * r); }
      for (let j = 0; j < NS; j++) I.push(0, 1 + (j + 1) % NS, 1 + j);
      for (let i = 0; i + 1 < NR; i++) for (let j = 0; j < NS; j++) { const a = 1 + i * NS + j, b = 1 + i * NS + (j + 1) % NS, c = a + NS, d = b + NS; I.push(a, b, d, a, d, c); }
      wreathGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(P), 3)); wreathGeo.setIndex(I); }
    const wreathMat = wreathMaterial(shared, PALETTE[6]);
    wreathMat.uniforms.uHole = { value: new THREE.Vector3(-HEAD.z * 33 - HEAD.x * 4, HEAD.x * 33 - HEAD.z * 4, 0) };      // (rare) where the whale comes up, in the wreath's own plane; z = how far its upwelling has swept the foam aside
    wreathMat.uniforms.uEyeK.value = moodId === 'night' ? 0.8 : 1;
    const wreath = new THREE.Mesh(wreathGeo, wreathMat); wreath.position.copy(BOIL); wreath.frustumCulled = false; wreath.renderOrder = 4; scene.add(wreath);
    await ctx.yield();
    // The bait ball: 15 m across, upright as the kit turns it (about its own vertical axis), 20 m beyond the ring along
    // the line of the fall and 19 m to its left: a place in the water, so the ring's glow passes in front of its right
    // side. Many small fish packed on a sphere; inside the school hangs its own dark heart (a still, soft-edged body
    // of deep water two thirds of the ball's size), so the silver bodies of the near side read against it and the
    // ball is dark at its core from wherever it is seen.
    // (radius 0.4: the kit would otherwise send the ball round a 16 m loop on the clock.)
    const fallDir = R.fall, BALL = PORTAL.clone().addScaledVector(fallDir, 20).add(new THREE.Vector3(HEAD.z, 0, -HEAD.x).multiplyScalar(19));
    const ball = F.makeFishSchool({ rng: rng.fork('ball'), species: 'sardines', count: Math.round(2000 * detail), center: [0, 0, 0], radius: 0.4, drift: 0.05, spread: [7.4, 6.6], size: 4.6, rim: 0.8, top: '#93a4a8', belly: '#eef4f3', fin: '#b4c0c2', spec: 5, vivid: 0,
      light: { sunDir: new THREE.Vector3(0.1, 1, 0.1).normalize(), sunColor: '#f2fff8', sunIntensity: 2.6, sky: '#bfe8da', skyIntensity: 1.9, ground: '#1f5a4a', groundIntensity: 0.8 } });
    ball.object.position.copy(BALL);
    ball.object.visible = false; scene.add(ball.object);
    const core = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 3), new THREE.ShaderMaterial({ transparent: true, depthWrite: false, fog: false,
      uniforms: { uCol: { value: new THREE.Color(M.waterDeep).multiplyScalar(0.5) } },
      vertexShader: /* glsl */`varying vec3 vN, vV; void main() { vec4 mv = modelViewMatrix * vec4(position, 1.); vV = mv.xyz; vN = normalMatrix * normal; gl_Position = projectionMatrix * mv; }`,
      fragmentShader: /* glsl */`uniform vec3 uCol; varying vec3 vN, vV; void main() { float f = clamp(dot(normalize(vN), -normalize(vV + vec3(0., 0., -1e-6))), 0., 1.), d = length(vV) * .016;
        gl_FragColor = vec4(uCol, smoothstep(.05, .75, f) * .93 * exp(-d * d)); }` }));
    core.position.copy(BALL); core.scale.set(5.0, 4.5, 5.0); core.renderOrder = 1; core.visible = false; scene.add(core);
    await ctx.yield();

    // ================================================================= BACKDROP: trawler, skerries, small seabirds, seals
    const lit = litMaterial(shared, 0.35);
    const trawler = new THREE.Group(); trawler.rotation.order = 'YXZ'; trawler.position.copy(TRAWLER); trawler.rotation.y = 0.5;
    trawler.add(new THREE.Mesh(trawlerGeometry(rng.fork('trawler')), lit));
    await ctx.yield();
    const lampMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(5.2, 3.5, 1.8), fog: true });      // #FFC27A, the world's only lamp
    const pane1 = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.85, 0.1), lampMat); pane1.position.set(-1.1, 3.3, -4.36);
    const pane2 = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.85, 1.7), lampMat); pane2.position.set(-2.34, 3.3, -5.3);
    trawler.add(pane1, pane2); scene.add(trawler);
    await ctx.yield();
    const lampGlow = fxset.add(FX.makeGlow({ position: [TRAWLER.x, 3.5, TRAWLER.z], color: '#FFC27A', size: 9, intensity: moodId === 'night' ? 2.2 : 1.5, time: T }));
    const bow = new THREE.Vector3(Math.sin(0.5) * 14.5, 0, Math.cos(0.5) * 14.5).add(TRAWLER), brng = rng.fork('bow');
    const bA = new Float32Array(10 * 4), bB = new Float32Array(10 * 4);
    for (let i = 0; i < 10; i++) { bA.set([bow.x + brng.range(-2.5, 2.5), bow.z + brng.range(-2.5, 2.5), 0, brng()], i * 4); bB.set([brng.range(2.6, 3.6), 0, 0, 0], i * 4); }
    const bowMat = strikeMaterial(shared); bowMat.uniforms.uPlume.value = 2.3; bowMat.uniforms.uPatch.value = 0.5;
    scene.add(instancedMesh(strikeBase, 10, { iA: bA, iB: bB }, bowMat, 5));
    await ctx.yield();
    const skerries = [[-400, 30, 24, 8.5], [-428, -72, 18, 7]].map(([x, z, r, h], i) => { const m = new THREE.Mesh(skerryGeometry(rng.fork('skerry' + i), ctx.noise, r, h, i * 13.7), lit); m.position.set(x, -1.2, z); scene.add(m); return m; });
    await ctx.yield();
    const faunaLight = { sunDir: SUN.clone(), sunColor: M.key, sunIntensity: M.keyK * 1.7, sky: hex(skyCol), skyIntensity: 1.5, ground: hex(shadeCol), groundIntensity: 1.3 };
    const GULL_WANDER = [5, 2.5, 4, 0.35];      // (handed to the kit in each gull call below; the guillemots hand their own)
    const flockMakers = [
      () => F.makeFlock({ rng: rng.fork('gulls'), species: 'gulls', count: 16, wander: GULL_WANDER, center: [TRAWLER.x - 14, 15, TRAWLER.z + 30], radius: 30, height: 9, size: 1.1, light: faunaLight }),
      () => F.makeFlock({ rng: rng.fork('kitti'), species: 'gulls', count: Math.round(30 * density), wander: GULL_WANDER, center: [84, 30, 8], radius: 26, height: 14, size: 0.85, body: '#e9ebe8', wingC: '#9aa4ac', tip: '#15181a', light: faunaLight }),
      () => F.makeFlock({ rng: rng.fork('fulmar'), species: 'gulls', count: Math.round(25 * density), wander: GULL_WANDER, center: [78, 18, -34], radius: 24, height: 8, size: 0.95, glide: 0.92, body: '#dcdcd4', wingC: '#7d868c', tip: '#6c747a', light: faunaLight }),
      () => F.makeFlock({ rng: rng.fork('guille'), species: 'swifts', count: Math.round(60 * density), center: [0, 5, 0], radius: 96, height: 2.5, wobble: 0.15, wander: [9, 1, 8, 0.7], size: 1.5, speed: 19, flap: 9, glide: 0, body: '#14171a', belly: '#e4e4dc', wingC: '#181b1e', tip: '#101214', light: faunaLight }),
    ];
    const small = [];
    // the clear air: a flock bird's course is its flock's loop shifted by its own offset, in the box of its wander
    // (the kit's: 1.5 wx, wy, wz of the wander its call hands the kit; the dealt places and the count are read
    // from the kit's own buffers; the guillemots' up and down is cut from 5 m to 1 above). clear: a bird whose lap (a
    // point a metre, the box round each) stands 2.5 m and its half span (c) off every point of the line keeps live's
    // seat. The rest take the least move (a metre of lift as two of level shift, a lift over 9 m as 200 m more) that
    // passes three bars. The line: G holds, by 2 m cells of the plan, the lowest and highest the loop runs within
    // the box and c, so each point of the line bars a band of heights (low: the points a lift of 25 m can meet).
    // The sea: dropped only if the lowest point of the lap, wander counted, stays 1 m over the highest crest. The
    // rock as drawn at each lap point's own height (rT: the part's surface by half degrees and metres; deep: the
    // most a lap stands inside it over the bearings half a metre of lap sweeps, live's at the least, a move's at the
    // most; beside the arch, under its top, the lesser of that and lin, the distance inside the opening's edge, for
    // live less the 1.4 m its lining can stand back; in the opening live's lap is in air, a move's still reads as
    // rock): 0.6 m clear, or half a metre less deep than live's lap where that is inside. Passes: level to 60 m (the
    // whole ring) and 25 m up or down; every 2 m to 90 m on 32 bearings; the first again with lifts as high as it
    // takes.
    // AND NO LAP PASSES THROUGH THE STACK AS DRAWN (cure 2), BY THE STACK'S OWN TRIANGLES (the polish's head).
    // GR: the rock's own mesh (A.rockGeometry: faces, ledges, cap, the awash shelf, the arch's lining) as a table:
    // the outermost radius by bearing bin (GB round the axis) and height slab (GY). Exact: the slabs' level planes
    // and the bins' planes through the axis cut a triangle into flat pieces, and the radius, convex, is greatest
    // at a piece's corner, so every corner is stamped (grid: the triangles in the order of their lowest corner, as
    // high as each flock asks). What lies inside the outermost rock of a bearing counts as rock (the arch's
    // opening too). dryT: a lap, a point every GLAP, is dry when at every point the box of the kit's wander
    // (1.5 wx, wy, wz) with a ball rb round it holds no rock: rb = the body (hk) + MARGIN + a pad, the pad what a
    // rounded shape can poke unseen between two lap points, two rock nodes (GSTEP) and two bearings (arc). By
    // levels of QY: ringT lays the rock a level's box can meet (level: the slabs its height reaches; one a gap g
    // above or below the box is drawn in by rb less the root of rb squared less g squared) as nodes at the bins'
    // edges (the wider bin's radius; down a step between two bins a node every GSTEP), and barT gives, when asked,
    // how far out along an edge a lap point is barred (tOf: the box's flat sides and rounded corners; outward from
    // the edge itself, a block of eight edges passed over where its widest rock cannot reach). A point is held
    // against the bars of the two edges beside it, and before that against a lower and an upper bound (lb, ub).
    // THE SEA'S BAR FOR EVERY NEW SEAT: yb is the height at which the lap's lowest point, wander down, stands a
    // metre over the highest crest. Under it the bird's seat in live is found again (VY: cure 2's own padded test,
    // rC / wall / bar / dry, and its own search, kept to the letter for this alone; 1e9: a seat off its ladder,
    // over the bar), and no new seat stands lower than the higher of the two live seats (yB, never over yb). A bird
    // keeps the seat of the rule above if its lap is dry there and it does not stand under yB (or stands over the
    // crest anyway). Else it is seated anew as in cure 2, by dryT: the least move by its own place (the narrowest
    // wall first: thinT), else the ladder ROUND the stack (thinL first).
    // THE COURSE ALONG THE SKIRT: a file with a bird that finds no seat ROUND the stack flies a closed course on
    // the stack's open side (the middle of the widest run of SECT bearing sectors no low point of the line stands
    // on): an arc about the axis at Ri, a half circle ALONG_W across, the arc back at Ri + ALONG_W, a half circle;
    // the half angle from the loop's own length, so the file flies it at the kit's pace on the kit's clock (the
    // loop's samples are rewritten in place, heights kept, as the kit's own clearRoute does; no draw). Ri from
    // ALONG_FROM inside the rock's widest reach outward by ALONG_STEP: the first course on which the ten levels
    // from the sea's bar hold a seat a bird within ALONG_RINGS rings (2 m each) of the course; each bird takes
    // the spot nearest its dealt place and the culling sphere is laid round the new course. None to ALONG_TO
    // beyond: the dealt loop again and cure 2's ladder BESIDE the stack (rings out to D), then above: the last
    // resort.
    const MARGIN = 0.5, NB = 720, col = [], cs = new Float64Array(NB), sn = new Float64Array(NB), ic = new Float64Array(NB), is = new Float64Array(NB), at = new Uint8Array(1025), none = [];
    for (let i = 0; i < 1025; i++) at[i] = Math.atan(i / 1024) / TAU * NB;
    const bin = (x, z) => { const u = Math.abs(x), v = Math.abs(z), t = u >= v ? at[v / u * 1024 | 0] : NB / 4 - 1 - at[u / v * 1024 | 0]; return x < 0 ? (z < 0 ? NB / 2 + t : NB / 2 - 1 - t) : z < 0 ? NB - 1 - t : t; };      // (the half degree a bearing lies in, to a twentieth of a degree)
    for (let a = 0; a < NB; a++) { if (a & 1) col.push(A.rockColumn((a - 1) * TAU / NB)); cs[a] = Math.cos(a * TAU / NB); sn[a] = Math.sin(a * TAU / NB); ic[a] = 1 / (cs[a] || 1e-12); is[a] = 1 / (sn[a] || 1e-12); }
    let yLo = 0, yHi = 0, got = 0, rmax = 0; while (col[0](yLo)) yLo--; while (col[0](yHi)) yHi++;
    const NR = yHi - yLo, rC = new Float32Array((NB / 2 + 1) * NR);
    const rows = async (y) => { const n = Math.min(Math.ceil(y) - yLo, NR - 1);
      for (let a = 0; a <= NB / 2 && n > got; a++) { for (let j = got + 1; j <= n; j++) rmax = Math.max(rmax, rC[a * NR + j] = col[a % (NB / 2)](j + yLo)); if (a % 24 === 23) await ctx.yield(); }
      got = Math.max(got, n); };
    const rT = new Float32Array(720 * 172), nd = (a, j) => rT[a % 720 + j * 720] || (rT[a % 720 + j * 720] = A.surfRadius(a * TAU / 720, j));
    const GB = 1440, GY = 0.25, QY = 0.5, GLAP = 0.5, GSTEP = 0.5, FRESH = 6, ALONG_W = 30, ALONG_RINGS = 10, ALONG_STEP = 2, ALONG_FROM = 24, ALONG_TO = 60, SECT = 72;
    const gp = A.rockGeometry.attributes.position.array, gi = A.rockGeometry.index.array, gn = gi.length / 3, gcs = new Float64Array(GB + 1), gsn = new Float64Array(GB + 1), gat = new Uint16Array(1025);
    for (let a = 0; a <= GB; a++) { gcs[a] = Math.cos(a * TAU / GB); gsn[a] = Math.sin(a * TAU / GB); }
    for (let i = 0; i < 1025; i++) gat[i] = Math.atan(i / 1024) / TAU * GB;
    let gy0 = 1e9, gy1 = -1e9, grw = 0, gdone = 0;
    for (let i = 0; i < gp.length; i += 3) { gy0 = Math.min(gy0, gp[i + 1]); gy1 = Math.max(gy1, gp[i + 1]); grw = Math.max(grw, gp[i] * gp[i] + gp[i + 2] * gp[i + 2]); }
    grw = Math.sqrt(grw);
    const GY0 = Math.floor(gy0), GN = Math.ceil((gy1 - GY0) / GY) + 1, GR = new Float32Array(GB * GN), gkey = new Int32Array(gn), gcnt = new Int32Array(Math.ceil(gy1 - GY0) + 2), gord = new Int32Array(gn);
    for (let t = 0; t < gn; t++) { gkey[t] = Math.floor(Math.min(gp[gi[t * 3] * 3 + 1], gp[gi[t * 3 + 1] * 3 + 1], gp[gi[t * 3 + 2] * 3 + 1]) - GY0); gcnt[gkey[t] + 1]++; }
    for (let i = 1; i < gcnt.length; i++) gcnt[i] += gcnt[i - 1];
    for (let t = 0; t < gn; t++) gord[gcnt[gkey[t]]++] = t;
    const gfix = (g, x, z) => { for (let n = GB; n-- && gcs[g] * z - gsn[g] * x < 0;) g = g ? g - 1 : GB - 1; for (let n = GB; n-- && gcs[g + 1] * z - gsn[g + 1] * x >= 0;) g = g + 1 < GB ? g + 1 : 0; return g; };
    const gbin = (x, z) => { const u = Math.abs(x), v = Math.abs(z), t = u >= v ? gat[v / u * 1024 | 0] : GB / 4 - 1 - gat[u / v * 1024 | 0]; return gfix(x < 0 ? (z < 0 ? GB / 2 + t : GB / 2 - 1 - t) : z < 0 ? GB - 1 - t : t, x, z); };
    const gseg = (px, pz, b, qx, qz, bq, o, o2) => { const r0 = Math.sqrt(px * px + pz * pz), r1 = Math.sqrt(qx * qx + qz * qz);
      if (r0 > GR[o + b]) GR[o + b] = r0; if (r1 > GR[o + bq]) GR[o + bq] = r1; if (o2) { if (r0 > GR[o2 + b]) GR[o2 + b] = r0; if (r1 > GR[o2 + bq]) GR[o2 + bq] = r1; }
      if (b === bq) return;
      let d = ((bq - b + GB + GB / 2) % GB) - GB / 2; const s = d < 0 ? -1 : 1;
      for (; d !== 0; d -= s) { const e = s > 0 ? b + 1 : b, nb = (b + s + GB) % GB, dp = gcs[e] * pz - gsn[e] * px, dq = gcs[e] * qz - gsn[e] * qx, t = dp / (dp - dq), r = (px + t * (qx - px)) * gcs[e] + (pz + t * (qz - pz)) * gsn[e];
        if (r > GR[o + b]) GR[o + b] = r; if (r > GR[o + nb]) GR[o + nb] = r; if (o2) { if (r > GR[o2 + b]) GR[o2 + b] = r; if (r > GR[o2 + nb]) GR[o2 + nb] = r; } b = nb; } };
    const grid = async (y) => { const K = Math.floor(y - GY0);
      for (; gdone < gn && gkey[gord[gdone]] <= K; gdone++) { const q = gord[gdone] * 3; let a = gi[q] * 3, b = gi[q + 1] * 3, c = gi[q + 2] * 3, t;
        if (gp[a + 1] > gp[b + 1]) { t = a; a = b; b = t; } if (gp[b + 1] > gp[c + 1]) { t = b; b = c; c = t; } if (gp[a + 1] > gp[b + 1]) { t = a; a = b; b = t; }
        const ax = gp[a], ay = gp[a + 1], az = gp[a + 2], mx = gp[b], my = gp[b + 1], mz = gp[b + 2], cx = gp[c], cy = gp[c + 1], cz = gp[c + 2], k1 = Math.min(GN - 1, Math.floor((cy - GY0) / GY)), bm = gbin(mx, mz);
        let plx = ax, plz = az, qlx = ax, qlz = az, bpl = gbin(ax, az), bql = bpl, past = false;
        for (let k = Math.max(0, Math.floor((ay - GY0) / GY)); k <= k1; k++) { const Y = GY0 + (k + 1) * GY, end = Y >= cy || k === k1, o = k * GB; let pux = cx, puz = cz, qux = cx, quz = cz;
          if (!end) { const u = (Y - ay) / (cy - ay); pux = ax + u * (cx - ax); puz = az + u * (cz - az); if (Y < my) { const v = (Y - ay) / (my - ay); qux = ax + v * (mx - ax); quz = az + v * (mz - az); } else { const v = (Y - my) / (cy - my); qux = mx + v * (cx - mx); quz = mz + v * (cz - mz); } }
          const bpu = gfix(bpl, pux, puz), turn = !past && (end || my <= Y), bqu = gfix(turn ? bm : bql, qux, quz);
          gseg(plx, plz, bpl, pux, puz, bpu, o, 0);
          if (turn) { gseg(qlx, qlz, bql, mx, mz, bm, o, 0); gseg(mx, mz, bm, qux, quz, bqu, o, 0); past = true; } else gseg(qlx, qlz, bql, qux, quz, bqu, o, 0);
          if (!end) gseg(pux, puz, bpu, qux, quz, bqu, o, o + GB);
          plx = pux; plz = puz; qlx = qux; qlz = quz; bpl = bpu; bql = bqu; }
        if (!(gdone & 1023)) await ctx.yield(); } };
    for (const mk of flockMakers) {
      const f = mk(), iA = f.geometry.attributes.iA.array, iB = f.geometry.attributes.iB.array, w = f.uniforms.uWander.value, hs = 0.84 * f.uniforms.uNear.value.x, c = 2.5 + hs, bx = 1.5 * w.x + c + 0.5, bz = w.z + c + 0.5, h = w.y + c + 0.25, rp = [], rq = [], low = [], dA = iA.slice(), dB = iB.slice();
      const hk = Math.max(hs, f.reach ? f.reach.body : 0), ex = bx - c + hk + MARGIN, ez = bz - c + hk + MARGIN, ey = w.y + hk + MARGIN, rho = Math.hypot(ex, ez), E = [], seats = [], hb = new Int32Array(16);
      const tx = 1.5 * w.x, tz = w.z, arc = (grw + Math.hypot(tx, tz) + hk + MARGIN) * TAU / GB, rb = hk + MARGIN + (GLAP * GLAP + GSTEP * GSTEP + 3 * arc * arc) / (8 * (hk + MARGIN)), trho = Math.hypot(tx, tz) + rb, gfar = (grw + trho) ** 2, ey2 = w.y + rb + 1, TE = [], lv = new Float32Array(GB), f0 = new Float32Array(GB + 1), hB = new Float32Array(GB + 1), hbT = new Int32Array(16);
      let lo = 1e9, top = -1e9, x0 = 1e9, z0 = 1e9, x1 = -1e9, z1 = -1e9, nx = 0, nz = 0, G = null, reach = 0, up = 0, grow = 0, hot = 0, along = 0, spotT = 0, fresh = 0;
      const lay = () => { rp.length = rq.length = 0; lo = x0 = z0 = 1e9; top = x1 = z1 = -1e9; reach = 0;
        for (let q = 0; q < f.route.length; q++) { f.route.pointAt(q, _v); rp.push(_v.x, _v.y, _v.z); lo = Math.min(lo, _v.y); top = Math.max(top, _v.y); x0 = Math.min(x0, _v.x - bx); x1 = Math.max(x1, _v.x + bx); z0 = Math.min(z0, _v.z - bz); z1 = Math.max(z1, _v.z + bz); reach = Math.max(reach, Math.hypot(_v.x, _v.z)); }
        for (let q = 0; q < f.route.length; q += GLAP) { f.route.pointAt(q, _v); rq.push(_v.x, _v.y, _v.z); }
        nx = Math.ceil((x1 - x0) / 2) + 1; nz = Math.ceil((z1 - z0) / 2) + 1; G = new Float32Array(nx * nz * 2).fill(1e9);
        for (let q = 0; q < rp.length; q += 3) mark(rp[q], rp[q + 1], rp[q + 2]); };
      const cell = (x, z) => { const a = Math.floor((x - x0) / 2), b = Math.floor((z - z0) / 2); return a >= 0 && a < nx && b >= 0 && b < nz ? (a + b * nx) * 2 : -1; };
      const mark = (x, y, z) => { for (let a = Math.floor((x - bx - x0) / 2); a <= (x + bx - x0) / 2; a++) for (let b = Math.floor((z - bz - z0) / 2); b <= (z + bz - z0) / 2; b++) { const g = (a + b * nx) * 2; G[g] = Math.min(G[g], y); G[g + 1] = Math.min(G[g + 1], -y); } };
      const bands = (ox, oz, P, no = []) => { for (let k = 0; k < P.length; k += 3) { const g = cell(P[k] - ox, P[k + 2] - oz);
        if (g >= 0 && G[g] < 1e8) { const n = no.length - 2, u = P[k + 1] + G[g + 1] - h, v = P[k + 1] - G[g] + h; if (n >= 0 && u <= no[n + 1] && v >= no[n]) { no[n] = Math.min(no[n], u); no[n + 1] = Math.max(no[n + 1], v); } else no.push(u, v); } } return no; };
      const free = (y, y0, no) => { if (y < y0 && lo + y - w.y < crest + 1) return false; for (let m = 0; m < no.length; m += 2) if (y > no[m] && y < no[m + 1]) return false; return true; };
      const clear = (ox, oy, oz) => { for (let k = 0; k < low.length; k += 3) { const g = cell(low[k] - ox, low[k + 2] - oz), y = low[k + 1] - oy;
        if (g >= 0 && y > G[g] - h && y < h - G[g + 1]) for (let q = 0; q < rp.length; q += 3) { const dx = Math.abs(low[k] - ox - rp[q]) - 1.5 * w.x, dz = Math.abs(low[k + 2] - oz - rp[q + 2]) - w.z; if (dx < c && dz < c && Math.hypot(Math.max(dx, 0), Math.max(Math.abs(y - rp[q + 1]) - w.y, 0), Math.max(dz, 0)) < c) return false; } } return true; };
      const deep = (ox, oy, oz, pick, lim) => { let m = -9; for (let k = 0, q = hot; k < rp.length && m <= lim; k += 3, q = (q + 3) % rp.length) { const x = rp[q] + ox, y = rp[q + 1] + oy, z = rp[q + 2] + oz, r = Math.hypot(x, z);
        if (r < 80 && y < 174) { const hw = A.archHalf(y), lin = hw ? Math.abs(x - A.archCenter.x) - hw : 1e9, a = Math.floor((Math.atan2(z, x) / TAU + 1) * 720), j = Math.floor(clamp(y, 0, 170)), n = Math.min(Math.ceil(58 / r), 360); let v = nd(a, j); for (let b = a - n; b < a + n + 2; b++) v = pick(v, nd(b, j), nd(b, j + 1)); m = Math.max(m, pick === Math.min ? Math.min(v - r, lin - 1.4) : lin < 0 ? v - r : Math.min(v - r, lin)); if (m > lim) hot = q; } } return m; };
      const ringOf = (s) => { const e = new Float32Array(3 * NB + 2).fill(-1, 0, NB); let m = 1e9; for (let a = 0; a < NB; a++) { const r = s((a >> 1) * NR, ((a + 1) >> 1) * NR) || NaN; e[NB + 1 + a] = r * cs[a]; e[2 * NB + 1 + a] = r * sn[a]; if (r < m) m = r; } e[3 * NB + 1] = m > rho ? Math.ceil(Math.asin(rho / m) * NB / TAU) : NB / 2; return e; };
      const bar = (e, g) => { const u = ic[g], v = is[g], ax = ex * Math.abs(u), az = ez * Math.abs(v), n = e[3 * NB + 1] | 0; let m = 0;
        for (let b = g - n + NB, b1 = g + n + NB; b <= b1; b++) { const a = b % NB, tx = e[NB + 1 + a] * u, tz = e[2 * NB + 1 + a] * v, t = Math.min(tx + ax, tz + az); if (t > m && Math.max(tx - ax, tz - az) <= t) m = t; } return e[g] = m; };
      const wall = (j) => E[j + 512] || (E[j + 512] = ringOf((g, g1) => { let s = 0; for (let k = Math.max(Math.round(j - 0.5 - ey) - yLo, 1), k1 = Math.min(Math.round(j + 0.5 + ey) - yLo, got); k <= k1; k++) s = Math.max(s, rC[g + k], rC[g1 + k]); return s; }));
      const dry = (ox, oy, oz, e0) => { const far = (rmax + rho) ** 2, n = rp.length / 3 | 0; for (let k = 0; k < n; k++) { const p = (spot + (k & 1 ? n - ((k + 1) >> 1) : k >> 1)) % n, q = p * 3, x = rp[q] + ox, z = rp[q + 2] + oz, r = x * x + z * z;      // (from the point that failed last, outward both ways)
        if (r < far) { const e = e0 || wall(Math.round(rp[q + 1] + oy)), a = bin(x, z), b = (a + 1) % NB, m = Math.max(e[a] < 0 ? bar(e, a) : e[a], e[b] < 0 ? bar(e, b) : e[b]); if (r < m * m) { spot = p; return false; } } } return true; };
      const off = (y, no) => { for (let m = 0; m < no.length; m += 2) if (y > no[m] && y < no[m + 1]) return false; return true; };
      const tOf = (Px, Pz, g) => { const ux = gcs[g], uz = gsn[g], iu = 1 / (ux || 1e-12), iv = 1 / (uz || 1e-12), au = Math.abs(iu), av = Math.abs(iv), sx = Px * iu, sz = Pz * iv;
        let t = -1e9, a = Math.min(sx + tx * au, sz + (tz + rb) * av); if (a >= Math.max(sx - tx * au, sz - (tz + rb) * av)) t = a;
        a = Math.min(sx + (tx + rb) * au, sz + tz * av); if (a > t && a >= Math.max(sx - (tx + rb) * au, sz - tz * av)) t = a;
        if (t >= Math.min(sx + (tx + rb) * au, sz + (tz + rb) * av)) return t;      // (out through a flat side: no corner can hold it longer)
        for (let k = 0; k < 4; k++) { const cx = Px - (k & 1 ? tx : -tx), cz = Pz - (k & 2 ? tz : -tz), cr = cx * uz - cz * ux, D = rb * rb - cr * cr; if (D >= 0) { a = cx * ux + cz * uz + Math.sqrt(D); if (a > t) t = a; } }
        return t; };
      for (let g = 0; g <= GB; g++) { f0[g] = tOf(0, 0, g % GB); hB[g] = tx * Math.abs(gcs[g]) + tz * Math.abs(gsn[g]) + rb; }
      const reachT = (e, a, g, iu, iv, ax, az, m) => { const ca = gcs[a] * iu, sa = gsn[a] * iv; let r = e.nu[a]; if (!(r > 0)) return m;
        let u = r * ca, v = r * sa, t = Math.min(u + ax, v + az); if (t > m && t >= Math.max(u - ax, v - az) && (t = tOf(r * gcs[a], r * gsn[a], g)) > m) m = t;
        for (let j = e.xo[a], j1 = e.xo[a + 1]; j < j1; j++) { r = e.xr[j]; u = r * ca; v = r * sa; t = Math.min(u + ax, v + az); if (t > m && t >= Math.max(u - ax, v - az) && (t = tOf(r * gcs[a], r * gsn[a], g)) > m) m = t; } return m; };
      const barT = (e, g) => { const iu = 1 / (gcs[g] || 1e-12), iv = 1 / (gsn[g] || 1e-12), ax = (tx + rb) * Math.abs(iu), az = (tz + rb) * Math.abs(iv), bm = e.bm, wd = hB[g + GB / 4 < GB ? g + GB / 4 : g - 3 * GB / 4], far = hB[g], n = e.m > wd ? Math.ceil(Math.asin(wd / e.m) * GB / TAU) : GB / 2;
        let m = e.nu[g] > 0 ? e.nu[g] + f0[g] : 0;      // (wd, far: the box and ball's half width across this bearing and its reach along it; outward from the bearing itself, one way then the other, a block of eight passed over where its widest rock at its nearest cannot reach past m)
        for (let j = 1, a = g; j <= n; j++) { if (++a === GB) a = 0; if (!(a & 7) && bm[a >> 3] * Math.max(gcs[j], 0) + far <= m) { j += 7; a += 7; continue; } m = reachT(e, a, g, iu, iv, ax, az, m); }
        for (let j = 1, a = g; j <= n; j++) { a = a ? a - 1 : GB - 1; if ((a & 7) === 7 && bm[a >> 3] * Math.max(gcs[j], 0) + far <= m) { j += 7; a -= 7; continue; } m = reachT(e, a, g, iu, iv, ax, az, m); }
        return e.bar[g] = m; };
      const ringT = (v) => { const nu = new Float32Array(GB), ub = new Float32Array(GB), lb = new Float32Array(GB), bar = new Float32Array(GB).fill(-1), xo = new Int32Array(GB + 1), wm = new Float32Array(GB), bm = new Float32Array(GB >> 3), xr = []; let m = 1e9, mx = 0;
        for (let a = 0; a < GB; a++) { const r0 = v[a ? a - 1 : GB - 1], r1 = v[a], hi = r0 > r1 ? r0 : r1, lw = r0 > r1 ? r1 : r0; nu[a] = hi; xo[a] = xr.length; if (hi > 0 && lw < m) m = lw; if (hi > mx) mx = hi; if (hi > bm[a >> 3]) bm[a >> 3] = hi; for (let r = hi - GSTEP; r > lw; r -= GSTEP) xr.push(r); }
        xo[GB] = xr.length; if (!mx) return { m: 0, far: 0 };
        const n = m > trho ? Math.ceil(Math.asin(trho / m) * GB / TAU) : GB / 2, W = 2 * n + 1, M = GB + 2 * n;
        if (n >= GB / 2) wm.fill(mx); else { const pm = new Float32Array(M), sm = new Float32Array(M);
          for (let i = 0; i < M; i++) { const r = nu[(i - n + GB) % GB]; pm[i] = i % W ? Math.max(pm[i - 1], r) : r; }
          for (let i = M - 1; i >= 0; i--) { const r = nu[(i - n + GB) % GB]; sm[i] = i % W === W - 1 || i === M - 1 ? r : Math.max(sm[i + 1], r); }
          for (let a = 0; a < GB; a++) wm[a] = Math.max(sm[a], pm[a + 2 * n]); }
        for (let a = 0; a < GB; a++) { const b = (a + 1) % GB, u = Math.max(wm[a] + hB[a], wm[b] + hB[b]), l = Math.max(nu[a] > 0 ? nu[a] + f0[a] : 0, nu[b] > 0 ? nu[b] + f0[b] : 0); ub[a] = u * u; lb[a] = l * l; }
        return { nu, xo, xr: Float32Array.from(xr), ub, lb, bar, bm, m, far: (mx + trho) ** 2 }; };
      const level = (q) => { const a0 = q * QY - QY / 2 - w.y, a1 = q * QY + QY / 2 + w.y; lv.fill(0);
        for (let k = Math.max(0, Math.floor((a0 - rb - GY0) / GY)), k1 = Math.min(GN - 1, Math.floor((a1 + rb - GY0) / GY)); k <= k1; k++) { const sl = GY0 + k * GY, g = Math.max(0, sl - a1, a0 - sl - GY); if (g >= rb) continue;
          const d = rb - Math.sqrt(rb * rb - g * g), o = k * GB; for (let b = 0; b < GB; b++) { const r = GR[o + b] - d; if (r > lv[b]) lv[b] = r; } } return lv; };
      const wallT = (q) => TE[q + 4096] || (fresh++, TE[q + 4096] = ringT(level(q)));
      const ready = async (ox, oy, oz) => { for (let q = 0; q < rq.length; q += 3) { const x = rq[q] + ox, z = rq[q + 2] + oz; if (x * x + z * z < gfar && !TE[Math.round((rq[q + 1] + oy) / QY) + 4096]) { wallT(Math.round((rq[q + 1] + oy) / QY)); if (fresh >= FRESH) { fresh = 0; await ctx.yield(); } } } };
      const dryT = (ox, oy, oz, e0) => { const n = rq.length / 3 | 0; for (let k = 0; k < n; k++) { let p = spotT + (k & 1 ? n - ((k + 1) >> 1) : k >> 1); if (p >= n) p -= n; const q = p * 3, x = rq[q] + ox, z = rq[q + 2] + oz, r = x * x + z * z; if (r >= gfar) continue;
          const e = e0 || TE[Math.round((rq[q + 1] + oy) / QY) + 4096] || wallT(Math.round((rq[q + 1] + oy) / QY)); if (r >= e.far) continue; const a = gbin(x, z); if (r >= e.ub[a]) continue; if (r < e.lb[a]) { spotT = p; return false; }
          const b = (a + 1) % GB, m = Math.max(e.bar[a] < 0 ? barT(e, a) : e.bar[a], e.bar[b] < 0 ? barT(e, b) : e.bar[b]); if (r < m * m) { spotT = p; return false; } } return true; };
      const scan = async (y, k0, k1, cap) => { await grid(top + y + ey2);
        for (let k = k0; k <= k1 && seats.length < cap; k++) for (let t = 0; t < (8 * k || 1) && seats.length < cap; t++) { const s = t / (2 * k) | 0, u = t % (2 * k) - k, x = 2 * (s === 0 ? u : s === 1 ? k : s === 2 ? -u : -k) || 0, z = 2 * (s === 0 ? -k : s === 1 ? u : s === 2 ? k : -u) || 0;
          if ((y > L0 + 9 || dryT(x, 0, z, thinL)) && dryT(x, y, z) && off(y, bands(x, z, y > L0 + 9 ? lineP : lad))) seats.push(x, y, z); if (!(t & 63)) await ctx.yield(); } };
      const skirt = async () => { const R = f.route, Dt = R.data, N = R.N, was = Dt.slice(), sec = new Uint8Array(SECT), box = (D) => { const m = [1e9, 1e9, 1e9, -1e9, -1e9, -1e9]; for (let i = 0; i < N * 4; i += 4) for (let k = 0; k < 3; k++) { m[k] = Math.min(m[k], D[i + k]); m[k + 3] = Math.max(m[k + 3], D[i + k]); } return m; };
        let turn = 0, run = 0, end = 0, wide = 0; const b0 = box(was), pad = f.bounds.radius - Math.hypot(b0[3] - b0[0], b0[4] - b0[1], b0[5] - b0[2]) / 2;
        for (let i = 0; i < N; i++) { const j = (i + 1) % N; turn += was[i * 4] * was[j * 4 + 2] - was[j * 4] * was[i * 4 + 2]; }
        for (let k = 0; k < lad.length; k += 3) sec[Math.floor((Math.atan2(lad[k + 2], lad[k]) / TAU + 1) * SECT) % SECT] = 1;
        for (let a = 0; a < 2 * SECT; a++) { if (sec[a % SECT]) run = 0; else if (++run > wide) { wide = run; end = a; } }
        const mid = (end - (wide - 1) / 2 + 0.5) * TAU / SECT, cm = Math.cos(mid), sm = Math.sin(mid), dir = turn < 0 ? -1 : 1, hw = ALONG_W / 2, lc = Math.PI * hw;
        for (let Ri = grw - ALONG_FROM; Ri <= grw + ALONG_TO; Ri += ALONG_STEP) { const Ro = Ri + ALONG_W, al = (R.length - 2 * lc) / (2 * (Ri + Ro)), l1 = 2 * al * Ri, l3 = 2 * al * Ro, ca = Math.cos(al), sa = Math.sin(al); if (!(al > 0 && al < Math.PI / 2)) continue;
          for (let i = 0; i < N; i++) { let s = (i / N) * R.length, x, z;
            if (s < l1) { x = Ri * Math.cos(s / Ri - al); z = Ri * Math.sin(s / Ri - al); }
            else if ((s -= l1) < lc) { const t = s / hw, a = Ri + hw - hw * Math.cos(t), b = hw * Math.sin(t); x = a * ca - b * sa; z = a * sa + b * ca; }
            else if ((s -= lc) < l3) { x = Ro * Math.cos(al - s / Ro); z = Ro * Math.sin(al - s / Ro); }
            else { const t = (s - l3) / hw, a = Ri + hw + hw * Math.cos(t), b = -hw * Math.sin(t); x = a * ca + b * sa; z = -a * sa + b * ca; }
            Dt[i * 4] = x * cm - dir * z * sm; Dt[i * 4 + 2] = x * sm + dir * z * cm; }
          R.texture.needsUpdate = true; lay(); seats.length = 0;
          for (let y = L0; y <= L0 + 9 && seats.length < f.count * 3; y++) await scan(y, 0, ALONG_RINGS, f.count * 3);
          if (seats.length >= f.count * 3) { const b1 = box(Dt); grow = 0;
            for (let i = 0; i < f.count; i++) { const X = dA[i * 4], y0 = dA[i * 4 + 1], Z = dB[i * 4 + 3]; let best = 1e9, s = 0;
              for (let k = 0; k < seats.length; k += 3) { const m = Math.hypot(seats[k] - X, 2 * (seats[k + 1] - y0), seats[k + 2] - Z); if (m < best) { best = m; s = k; } }
              [iA[i * 4], iA[i * 4 + 1], iB[i * 4 + 3]] = seats.splice(s, 3); grow = Math.max(grow, Math.hypot(iA[i * 4] - X, iA[i * 4 + 1] - y0, iB[i * 4 + 3] - Z)); }
            f.bounds.center.set((b1[0] + b1[3]) / 2, (b1[1] + b1[4]) / 2, (b1[2] + b1[5]) / 2); f.bounds.radius = Math.hypot(b1[3] - b1[0], b1[4] - b1[1], b1[5] - b1[2]) / 2 + pad; return 1; } }
        Dt.set(was); R.texture.needsUpdate = true; lay(); seats.length = 0; return -1; };
      await ctx.yield();
      lay();
      await ctx.yield();
      for (let i = 1; i < iA.length; i += 4) up = Math.max(up, iA[i]);
      for (let k = 0; k < lineP.length; k += 3) if (lineP[k + 1] < top + up + 25 + h) low.push(lineP[k], lineP[k + 1], lineP[k + 2]);
      await rows(top + up + 10 + ey); await grid(top + up + 9 + ey2);
      let ph = 0, spot = 0;
      const kt = Math.round(top + up + 9) - yLo, thin = ringOf((g) => { let s = 1e9; for (let k = 1; k <= kt && k < NR; k++) s = Math.min(s, rC[g + k]); return kt > 0 && kt < NR ? s : 0; });
      const yb = crest + 1 + w.y - lo, L0 = Math.ceil(yb), D = Math.ceil((reach + rmax + rho) / 2), lad = []; let lev = L0;
      await grid(top + L0 + 9 + ey2);
      const narrow = (y) => { lv.fill(1e9); for (let k = Math.ceil(-GY0 / GY), k1 = Math.min(GN - 1, Math.floor((y - GY0) / GY)); k <= k1; k++) for (let b = 0, o = k * GB; b < GB; b++) if (GR[o + b] < lv[b]) lv[b] = GR[o + b];
        for (let b = 0; b < GB; b++) if (lv[b] > 1e8) lv[b] = 0; return ringT(lv); };
      const thinT = narrow(top + up + 9), thinL = narrow(top + L0 + 9);
      for (let k = 0; k < lineP.length; k += 3) if (lineP[k + 1] < top + L0 + 9 + h) lad.push(lineP[k], lineP[k + 1], lineP[k + 2]);      // (the points of the line a lap of the ten low levels can meet)
      for (let i = 0; i < f.count; i++) {
        const X = iA[i * 4], y0 = iA[i * 4 + 1], Z = iB[i * 4 + 3]; let lost = false;
        if (!clear(X, y0, Z)) {
          const dl = deep(X, y0, Z, Math.min, 1e9), lim = dl > 0.6 ? dl - 0.5 : -0.6; let best = 1e9;
          for (let pass = 0; pass < 3 && best > 1e8; pass++) for (let d = 0; d < Math.min(best, pass & 1 ? 92 : 62); d += pass & 1 || d < 16 ? 2 : 4) {
            for (let a = 0, na = !d ? 1 : pass & 1 ? 32 : d < 16 ? 8 : 16; a < na; a++) {
              const x = X + d * Math.cos(a * TAU / na), z = Z + d * Math.sin(a * TAU / na), no = bands(x, z, pass > 1 ? lineP : low);
              for (let j = 0; j < (pass > 1 ? 1801 : 101); j++) { const u = ((j + 1) >> 1) / 2, y = y0 + (j & 1 ? u : -u), m = Math.hypot(d, 2 * u) + (u > 9 ? 200 : 0); if (m >= best) break; if (free(y, y0, no) && deep(x, y, z, Math.max, lim) <= lim) { best = m; iA[i * 4] = x; iA[i * 4 + 1] = y; iB[i * 4 + 3] = z; break; } }
              await ctx.yield();
            }
          }
          lost = best > 1e8;
        }
        const UX = iA[i * 4], UY = iA[i * 4 + 1], UZ = iB[i * 4 + 3]; let VY = UY;
        if (UY < yb) { await rows(top + UY + 1 + ey);
          if (!dry(UX, UY, UZ)) { let best = 1e9; VY = 1e9;
            for (let d = 0; d < Math.min(best, 62); d += d < 16 ? 2 : 4) {
              for (let a = 0, na = !d ? 1 : d < 16 ? 8 : 16; a < na; a++) {
                const x = X + d * Math.cos(a * TAU / na), z = Z + d * Math.sin(a * TAU / na); let no = 0; spot = hb[a * 16 / na];
                if (dry(x, 0, z, thin)) for (let j = 0; j < 37; j++) { const u = ((j + 1) >> 1) / 2, y = y0 + (j & 1 ? u : -u), m = Math.hypot(d, 2 * u); if (m >= best) break; if (free(y, y0, no || none) && dry(x, y, z) && (no || free(y, y0, no = bands(x, z, low)))) { best = m; VY = y; break; } }
                hb[a * 16 / na] = spot; if (no) await ctx.yield();
              }
              await ctx.yield();
            }
          }
        }
        const yB = Math.min(Math.max(UY, VY), yb);
        await grid(top + UY + ey2); await ready(UX, UY, UZ);
        if (!(dryT(UX, UY, UZ) && (UY >= yB || lo + UY - w.y >= crest))) {
          let best = 1e9, s = -1;
          for (let d = 0; d < Math.min(best, 62); d += d < 16 ? 2 : 4) {
            for (let a = 0, na = !d ? 1 : d < 16 ? 8 : 16; a < na; a++) {
              const x = X + d * Math.cos(a * TAU / na), z = Z + d * Math.sin(a * TAU / na); let no = 0; spotT = hbT[a * 16 / na];
              if (dryT(x, 0, z, thinT)) for (let j = 0; j < 37; j++) { const u = ((j + 1) >> 1) / 2, y = y0 + (j & 1 ? u : -u), m = Math.hypot(d, 2 * u); if (m >= best) break; if (y >= yB && (!no || off(y, no)) && dryT(x, y, z) && (no || off(y, no = bands(x, z, low)))) { best = m; iA[i * 4] = x; iA[i * 4 + 1] = y; iB[i * 4 + 3] = z; break; } if (fresh >= FRESH) { fresh = 0; await ctx.yield(); } }
              hbT[a * 16 / na] = spotT; if (no) await ctx.yield();
            }
            await ctx.yield();
          }
          if (best > 1e8) {
            while (!seats.length && ph < 3) {
              if (ph === 1 && !along) { along = await skirt(); if (along > 0) break; }
              await scan(lev, ph === 1 ? 31 : 0, ph === 1 ? D : 30, ph === 1 ? f.count * 3 : 1e9); if (++lev > (ph < 2 ? L0 + 9 : 450)) { if (!ph) lev = L0; ph++; } }
            if (along > 0) break;
            for (let k = 0; k < seats.length; k += 3) { const m = Math.hypot(seats[k] - X, 2 * (seats[k + 1] - y0), seats[k + 2] - Z); if (m < best) { best = m; s = k; } }
            if (s >= 0) [iA[i * 4], iA[i * 4 + 1], iB[i * 4 + 3]] = seats.splice(s, 3);
          }
          lost = best > 1e8;
        }
        if (lost) fails.flocks++;
        grow = Math.max(grow, Math.hypot(iA[i * 4] - X, iA[i * 4 + 1] - y0, iB[i * 4 + 3] - Z));
        if (i % 8 === 7) await ctx.yield();
      }
      f.bounds.radius += grow;      // (the kit culls the flock by this sphere)
      small.push(f); scene.add(f.object); await ctx.yield();
    }
    const srng = rng.fork('seals'), sA = new Float32Array(8 * 4), sB = new Float32Array(8 * 4);
    for (let i = 0; i < 8; i++) { sA.set([i < 6 ? srng.range(29.5, 34.5) : srng.range(46, 50), i < 6 ? 38 - i * 11.5 + srng.range(-3, 3) : srng.range(-20, 25), srng.range(1.2, 2.6), srng()], i * 4); sB.set([srng.range(1.15, 1.45), 0, 0, 0], i * 4); }
    await ctx.yield();
    const swimMat = gannetMaterial({ ...shared, uLeap: { value: dolphins ? 1 : 0 } }, TRAJ.swim);
    scene.add(instancedMesh(swimmerGeometry(rng.fork('swimmer'), dolphins), 8, { iA: sA, iB: sB }, swimMat));
    await ctx.yield();

    // ================================================================= WEATHER and the RARE event
    let curtain = null, whale = null, bowFoot = null, bowBear = 0;
    if (weather === 'rain') {
      // a rain curtain due east, 1800 m off (bearings 62 to 118), and on it the foot of the bow where the sun puts it
      curtain = new THREE.Mesh(new THREE.PlaneGeometry(1900, 640), curtainMaterial(new THREE.Color(M.zenith).lerp(new THREE.Color(M.fog), 0.2)));
      curtain.position.set(1800, 318, 0); curtain.rotation.y = -Math.PI / 2; curtain.renderOrder = 0; fxset.object.add(curtain);
      // the bow is a circle 41.5 degrees from the point opposite the sun: of the two bearings where it meets the sea
      // the foot is the one nearer due east, on the curtain. (A rainbow has no place of its own: it stands at that
      // bearing from whoever looks, so its card keeps that bearing from the eye's position.)
      const antiB = Math.atan2(-SUN.x, SUN.z), dB = Math.acos(clamp(Math.cos(41.5 * Math.PI / 180) / Math.max(Math.hypot(SUN.x, SUN.z), 0.75), -1, 1));
      const offE = (b) => Math.abs(Math.atan2(Math.sin(b - Math.PI / 2), Math.cos(b - Math.PI / 2)));
      bowBear = offE(antiB - dB) < offE(antiB + dB) ? antiB - dB : antiB + dB;
      bowFoot = new THREE.Mesh(new THREE.PlaneGeometry(1100, 520), rainbowFootMaterial(SUN, moodId === 'night' ? 0.05 : 0.15));
      bowFoot.rotation.y = -bowBear; bowFoot.renderOrder = 1; bowFoot.frustumCulled = false; fxset.object.add(bowFoot);
    } else if (weather === 'haar') {
      fxset.add(FX.makeMist({ rng: rng.fork('haar'), time: T, count: 70, area: [560, 80, 560], center: [0, 228, 0], size: [70, 150], color: M.fog, opacity: 0.2, drift: [wind.x * 10, 0, wind.z * 10], follow: false }));
    }
    await ctx.yield();
    const WH = new THREE.Vector3(BOIL.x - HEAD.z * 33 - HEAD.x * 4, 0, BOIL.z + HEAD.x * 33 - HEAD.z * 4);      // right side of the wreath, 33 m off the line of the fall
    if (rare) {
      // THE MINKE. Its heading, how far it leans from the vertical at full height (26 to 36 degrees) and its roll are
      // its own, drawn from a stream of its own (the world's seed and its name): it comes up rostrum first along that
      // heading, back to the sky behind it, throat ahead, 8 m of it clear of the water as the design says, and the
      // rest of it lies under the surface along the same heading (the wreath's uBack).
      const wp = ctx.core.makeRng(ctx.core.hashSeed('minke:' + ctx.seed)), wHead = wp.range(0, TAU);
      whale = new THREE.Mesh(whaleGeometry(), litMaterial(shared, 0.45, true, 0.22)); whale.position.set(WH.x, -6.2, WH.z); scene.add(whale);      // (raised in update)
      whale.userData.pose = { head: new THREE.Vector3(Math.sin(wHead), 0, -Math.cos(wHead)), roll: wp.range(-0.6, 0.6), lean: wp.range(0.45, 0.62) };
      wreathMat.uniforms.uBack.value.set(-Math.sin(wHead), Math.cos(wHead), 16, 0);
      const nW = 30, wA = new Float32Array(nW * 4), wB = new Float32Array(nW * 4), wrng = rng.fork('whale');
      for (let i = 0; i < nW; i++) { const a = wrng.range(0, TAU), r = wrng.range(3.4, 6.6); wA.set([WH.x + Math.cos(a) * r, WH.z + Math.sin(a) * r, 0, wrng()], i * 4); wB.set([wrng.range(1.4, 2.4), 0, 0, 0], i * 4); }
      const wMat = strikeMaterial(shared); wMat.uniforms.uPlume.value = 0; wMat.uniforms.uPatch.value = 0.8;      // a collar of white water round it, lower than the animal
      const splash = instancedMesh(strikeBase, nW, { iA: wA, iB: wB }, wMat, 5); scene.add(splash); whale.userData.splash = wMat;
      await ctx.yield();
      // the raft it comes up under: forty-eight birds burst off the water round it, most of them away from the eye, out
      // over the water the upwelling has swept clear of foam (wreath uHole)
      const nF = 48, fA = new Float32Array(nF * 4), fB = new Float32Array(nF * 4), away = Math.atan2(WH.z - BOIL.z, WH.x - BOIL.x);
      for (let i = 0; i < nF; i++) { const a = away + wrng.range(-1.9, 1.9), r = wrng.range(7, 15); fA.set([WH.x + Math.cos(a) * r, WH.z + Math.sin(a) * r, a + wrng.range(-0.4, 0.4), wrng()], i * 4); }
      const fMat = gannetMaterial({ ...shared, uFlush: { value: 0 } }, TRAJ.flush);
      scene.add(instancedMesh(gannet, nF, { iA: fA, iB: fB }, fMat)); whale.userData.flush = fMat;
    }
    // (forked last: every fork above is one the world's cast has always been dealt from, in that order, and a fork draws
    // from its parent, so anything new is forked after them)
    // spray haze low over the boil: from sea level north of the arch the strike plumes stand in it, not on a bare horizon
    const boilMist = fxset.add(FX.makeMist({ rng: rng.fork('boilmist'), time: T, count: 26, area: [170, 4, 150], center: [BOIL.x, 4.5, BOIL.z], size: [24, 50], color: new THREE.Color(M.foam).multiplyScalar(0.7), opacity: 0.17,
      drift: [wind.x * 4, 0, wind.z * 4], follow: false }));
    await ctx.yield();
    const veil = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), veilMaterial()); veil.frustumCulled = false; veil.renderOrder = 60; veil.scale.setScalar(1e-5); scene.add(veil);
    await ctx.yield();
    await sky.prewarm(ctx.renderer, null, scene);

    // ================================================================= PACE, POIS, UPDATE
    const cp = new THREE.Vector3(), cd = new THREE.Vector3(), cq = new THREE.Quaternion(), pf = new THREE.Vector3(), pr = new THREE.Vector3(), pu = new THREE.Vector3();
    const fogBase = new THREE.Color(M.fog), fogVeil = new THREE.Color('#C9D2D0').multiplyScalar(moodId === 'night' ? 0.4 : 0.82);
    let quiet = false, lastCt = 0, gazeK = 0;
    const PIER = new THREE.Vector2(17, 41), boilMistK = boilMist.uniforms.uOpacity.value;
    const wZ = new THREE.Vector3(), wY = new THREE.Vector3(), wX = new THREE.Vector3(), wM = new THREE.Matrix4();

    return {
      scene, path, duration: DURATION, pace,
      camera: CAMERA,
      pois,
      portal: { shape: 'circle', radius: 7, color: '#7FE6C8', glow: 1, tilt: true, revealDistance: 140 },
      // ================================================================= POST (exposure and grade per mood)
      post: { exposure: M.exposure, bloom: { strength: 0.32, radius: 0.6, threshold: 0.93 },
        grade: { saturation: M.sat, contrast: 1.07, tint: M.tint, shadowTint: M.shadowTint, vignette: 0, grain: 0.03, aberration: 0 } },
      ride: 'great-bird', seaClamp, seaPlace, seaPools, seaCalm, seaMain, anchors: U,
      update(dt, time, camera, u) {
        camera.getWorldPosition(cp); camera.getWorldDirection(cd); camera.getWorldQuaternion(cq);
        T.value = time;
        shared.uSeaC.value.copy(cp);
        // --- the arch detonation is fired by the sea: each crest of the long swell (SWELL[0], 110 m at 13 m/s: one every
        // 8.5 s, its phase the seed's) detonates as it reaches the south-west pier. ct = seconds since the last one did.
        // As we come in it is scripted to u (U.burst0 to U.burst1); on the run-in the burst under way plays out and no
        // new one starts, so the scripted one is not met half-spent.
        const w0 = WA[0], cyc = (Math.PI / 2 - (w0.z * (w0.x * PIER.x + w0.y * PIER.y) - w0.w * time + WB[0].z)) / TAU, ct = (cyc - Math.floor(cyc)) * TAU / w0.w; let bp;
        if (u > U.burst0 && u < U.burst1) { bp = (u - U.burst0) / (U.burst1 - U.burst0); quiet = true; }
        else if (u > U.burst0 - 0.12 && u <= U.burst0) { if (ct > 6.2 || ct < lastCt) quiet = true; bp = quiet ? 1 : ct / 6.2; }
        else { if (quiet && ct < lastCt) quiet = false; bp = quiet ? 1 : ct / 6.2; }
        lastCt = ct;
        hero.setBurst(clamp(bp, 0, 1));
        hero.update(dt, time, camera);
        // --- fog thickens to pale spray for a moment as we pass the falling veil
        const kv = ss(U.archIn - 0.012, U.archIn + 0.004, u) * (1 - ss(U.archIn + 0.008, U.archIn + 0.03, u));
        air.color.copy(fogBase).lerp(fogVeil, kv * 0.5); air.density = fogD * (1 + 3 * kv);
        sky.update(dt, time, camera); scud.update(dt, time, camera); fxset.update(dt, time, camera); squall.position.copy(cp);
        // the pools of light breathe with their shafts (the kit's own shimmer), and their broken edges drift on the clock
        for (let i = 0; i < 4; i++) pools[i].w = poolBase[i] * (0.7 + 0.3 * Math.sin(time * 0.55 * (0.35 + poolPh[i] * 0.5) + poolPh[i] * 20));
        poolLean.w = time;
        const sub = sea.update(dt, time, camera, scene);
        shared.uSeaC.value.copy(cp);
        // --- escorts fly in the frame of the path at the camera
        path.tangentAt(u, pf).normalize(); pr.crossVectors(pf, UP).normalize(); pu.crossVectors(pr, pf);
        escU.uCam.value.copy(cp); escU.uPF.value.copy(pf); escU.uPR.value.copy(pr); escU.uPU.value.copy(pu); escU.uHead.value.copy(pf);
        escU.uEsc.value.set(ss(U.climb1 + 0.03, U.hang0 - 0.005, u), ss(U.hang1 + 0.02, U.fall0, u) + ss(U.spear - 0.006, U.spear + 0.004, u),
          ss(U.chase0, U.chase0 + 0.02, u) * (1 - ss(U.chase1 - 0.02, U.chase1, u)), 0);
        // on the hang the gaze drops while the path stays level: the companions sink with it (by the tangent of the
        // angle between gaze and path)
        const dip = Math.asin(clamp(pf.y, -1, 1)) - Math.asin(clamp(cd.y, -1, 1));
        const want = clamp(Math.tan(clamp(dip, 0, 1.1)) * 0.74, 0, 0.85) * ss(U.hang0 - 0.03, U.hang0 + 0.02, u);
        gazeK = want; escU.uEsc.value.w = gazeK;
        // --- the boil: surface things above, bubble trails below
        wreath.visible = !sub; strikeMat.uniforms.uSub.value = sub ? 1 : 0; bowMat.uniforms.uSub.value = sub ? 1 : 0;
        wreathMat.uniforms.uEyeNear.value = ss(7, 30, cp.y);
        // the spray haze over the boil is always there: it is seen from low down and near (it thins out as the eye rises
        // from 18 to 60 m over the sea and as it stands from 300 to 430 m off)
        boilMist.uniforms.uOpacity.value = boilMistK * (1 - ss(18, 60, cp.y)) * (1 - ss(300, 430, Math.hypot(cp.x - BOIL.x, cp.z - BOIL.z)));
        if (bowFoot) bowFoot.position.set(cp.x + 2000 * Math.sin(bowBear), 180, cp.z - 2000 * Math.cos(bowBear));
        strikeMat.uniforms.uGrow.value = ss(45, 170, cp.y);       // from the hang the spikes are drawn larger; from the sea they are life-size
        // the rafts belong to the run-in, the divers to everything after it; they change over inside the arch, unseen
        rafts.visible = u < U.archIn + 0.03; divers.visible = strikes.visible = !rafts.visible;
        // the bait ball lies 36 m under the surface: it is drawn when the eye is under the surface (or within 6 m over it)
        // and within 160 m of the ball. From higher up the sea itself hides it; from further off the water's haze does
        // (nothing shows through it past 130 m, and the ball comes up out of that haze over the next 60 m).
        const hs = cp.y - seaY(cp.x, cp.z, time);
        ball.object.visible = core.visible = hs < 6 && cp.distanceToSquared(BALL) < 160 * 160;
        ball.update(dt, time, camera, u);
        for (const f of small) f.update(dt, time, camera, u);
        // --- trawler: pitching 12 degrees into the swell
        trawler.position.y = seaY(TRAWLER.x, TRAWLER.z, time) * 0.6 + 0.25;
        trawler.rotation.x = 0.21 * Math.sin(time * 0.85); trawler.rotation.z = 0.07 * Math.sin(time * 0.6 + 1);
        trawler.updateMatrixWorld(); pane1.getWorldPosition(lampGlow.object.position);
        // --- the surface veil
        // (keyed to the surface as it stands, which with the swell can be 4 m above or below the path's own crossing)
        const va = u > U.fall0 ? (1 - ss(0.4, hs > 0 ? 3.9 : 2.9, Math.abs(hs))) * 0.88 : 0;
        veil.material.uniforms.uA.value = va; veil.material.uniforms.uTime.value = time;
        if (va > 0.002) { veil.scale.set(3.2, 2.2, 1); veil.position.copy(cp).addScaledVector(cd, 0.8); veil.quaternion.copy(cq); } else veil.scale.setScalar(1e-5);
        if (curtain) curtain.material.uniforms.uTime.value = time;
        if (whale) {
          const k = ss(U.whale0, U.whale0 + 0.022, u) * (1 - ss(U.whale0 + 0.07, U.whale0 + 0.092, u));      // up a quarter of the way down the fall (the brief's 41 s), held for three seconds, under again before the spear
          const wq = whale.userData.pose, lean = lerp(1.0, wq.lean, k);
          escU.uPart.value = k; whale.position.y = -6.2 + 7.5 * k; whale.userData.splash.uniforms.uPlume.value = 0.5 * k; whale.userData.splash.uniforms.uSub.value = sub ? 1 : 0;
          wZ.copy(wq.head).multiplyScalar(Math.sin(lean)).addScaledVector(UP, Math.cos(lean));                 // the body's axis: rostrum up and ahead
          wY.copy(UP).multiplyScalar(Math.sin(lean)).addScaledVector(wq.head, -Math.cos(lean));               // its back: to the sky, behind it
          wX.crossVectors(wY, wZ); wY.multiplyScalar(Math.cos(wq.roll)).addScaledVector(wX, Math.sin(wq.roll)); wX.crossVectors(wY, wZ).normalize();
          whale.quaternion.setFromRotationMatrix(wM.makeBasis(wX, wY, wZ));
          wreathMat.uniforms.uBack.value.w = k;
          wreathMat.uniforms.uHole.value.z = ss(U.whale0 - 0.012, U.whale0 + 0.02, u) * (1 - ss(U.whale0 + 0.075, U.whale0 + 0.1, u));
          whale.userData.flush.uniforms.uFlush.value = clamp((u - U.whale0 + 0.004) / 0.075, 0, 1);
        }
      },
      dispose() { sky.dispose(); scudTex.dispose(); },
    };
  },
};
