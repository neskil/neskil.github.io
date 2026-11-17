// The Titan's Strait · 202 million years ago (deep-time crew).
// A clear afternoon over a new shallow sea on the edge of Pangaea: we step off a tilted limestone island among
// rib-winged gliding lizards and sail down over Ichthyotitan, 25 m, swimming beside her own hard shadow on pale
// sand, then into the shaded cleft of a second island where the ring stands.
//
// WORLD SPACE  y 0 is the sea surface. The flight heads +Z; the islands and the sun are on the left (+X),
//   the channel, the animal's shadow and the red mainland on the right (-X). The hero's local frame IS the
//   world frame moved along Z (she heads +Z at x = LANE_X).
// LIGHT        no scene lights: every material is a ShaderMaterial lit by shared uniforms (sun, sky, bounce).
// VARIETY      three days by seed, each with its own sky, light, fog and water: clear | dust (the coast a red ghost) | low sun (28
//              degrees, warmer, the shadow longer); sea: calm | chop | falling tide; cast: one giant | two in line | a dense shoal
//              instead of the sharks. Rare: a second giant rolls and puffs at u 0.3.
// HER COURSE   from the ledge she is crossing the channel head side-on to us; she rounds the placodonts' spit (u 0.22-0.36, in
//              profile beside her shadow) and comes onto our line by u 0.42.
// THE PASS     u 0.42-0.56 we fly to her RIGHT, above the strip of sand between her and her shadow, so the two lie side by side;
//              u 0.60 we cross over her back; u 0.64-0.70 we fly 8 m to her left and 4.5 m up, level with her eye, while she
//              rolls toward us and breathes: snout, eye, flank line, the lifted flipper, the puff against the red coast.
import * as THREE from 'three';
import { makePath, clamp, lerp, smoothstep } from '../kit/core.js';
import { makeSky } from '../kit/sky.js';
import { buildHero, SEA_GLSL, SAND_GLSL, SHADE_GLSL } from '../parts/titan-strait.js';

const PALETTE = ['#B4492C', '#EFE3C8', '#7CCBB8', '#1F6F74', '#22262C', '#9CC3DA', '#E9A66B'];
const BREATH_SHIFT = 0.04;                 // (the hero's own breath clock; the world overrides tilt, lift and puff in update())
const LANE_X = -6;                       // her spine in the channel (we fly to her right during the pass, to her left for the breath)
const FLOOR_Y = -12;                     // the channel floor
const BANK_X = 10;                       // the bank edge, 10 m to our left
const DIP = 0.364;                       // the launch slab dips 20 degrees
const DIPDIR = [-0.10, 0.995];          // ... toward the channel and the open strait
const CREST = 29.5;
// the cleft of the second island: an axis from C0 along E (15 degrees left of the heading)
const DZ = 60;                           // polish2: the second island stands this much further up the strait (a new stretch of open water after the pass)
const C0 = [14, 338 + DZ], EC = [Math.sin(15 * Math.PI / 180), Math.cos(15 * Math.PI / 180)];

// her mid-body, metres along the path (rate per unit u, integrated). She starts 105 m out, crossing our line of sight toward the
// open channel so that from the ledge she and her shadow lie nearly side-on in the gap between the conifers; she rounds the spit,
// swings back onto our line by u 0.42 and holds 22 m ahead of us while we swing out over the strip between her and her shadow
// (her whole length and the whole shadow in frame); at u 0.54 she slows, we cross over her back at u 0.60 and come down beside
// her head: from u 0.64 to 0.70 we fly 8 m to her left, 5 m up, level with her eye (0.66) while she breathes; then she falls behind
const PATH_SHORT = 12.4;      // polish1: the path now starts past the ledge and is this much shorter; she is moved to match, so the pass is as it was
// polish2: her course is now a table of (old u, z) knots, eased: she starts 50 m ahead of the ledge (big in the first frame), is under
// us at old u 0.39 (the pair seen from above), holds a little ahead while we come down beside her tail and cross behind it, lets us
// draw up her sunlit flank for the breath (0.60) and her face (0.70), then falls behind
const TITAN_Z = (() => {
  const K = [[0, 86], [0.14, 102], [0.21, 119.6], [0.29, 149], [0.39, 193], [0.50, 223], [0.578, 254], [0.62, 257.5], [0.70, 262.5], [0.76, 272], [1, 300]];
  const N = 400, raw = new Float32Array(N + 1), t = new Float32Array(N + 1);
  for (let i = 0, k = 0; i <= N; i++) { const u = i / N; while (k < K.length - 2 && u > K[k + 1][0]) k++; raw[i] = K[k][1] + (K[k + 1][1] - K[k][1]) * (u - K[k][0]) / (K[k + 1][0] - K[k][0]); }
  for (let i = 0; i <= N; i++) { let a = 0, n = 0; for (let j = -9; j <= 9; j++) { const q = Math.min(N, Math.max(0, i + j)); a += raw[q]; n++; } t[i] = a / n; }
  return t;
})();
const titanZ = (u) => { const x = Math.min(1, Math.max(0, u)) * 400, i = Math.min(399, Math.floor(x)); return TITAN_Z[i] + (TITAN_Z[i + 1] - TITAN_Z[i]) * (x - i); };

const NOISE_GLSL = /* glsl */`
float h12(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * .1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.-2.*f);
  return mix(mix(h12(i), h12(i+vec2(1.,0.)), f.x), mix(h12(i+vec2(0.,1.)), h12(i+vec2(1.,1.)), f.x), f.y); }
float fbm(vec2 p){ float a = .5, s = 0.; for(int i=0;i<4;i++){ s += a*vn(p); p = p*2.03 + 17.1; a *= .5; } return s; }
`;
// light for everything above the water: hard sun, blue sky fill, warm bounce from below
const LIGHT_GLSL = /* glsl */`
uniform vec3 uSun, uSunA, uSkyA, uBounceA;
vec3 litAbove(vec3 alb, vec3 N, float sh){
  float ndl = max(dot(N, uSun), 0.);
  return alb * (uSunA * ndl * sh + uSkyA * (.55 + .45 * N.y) + uBounceA * (.5 - .5 * N.y));
}
`;

export default {
  id: 'titan-strait',
  name: "The Titan's Strait",
  category: 'prehistoric',
  weirdness: 0.25,
  media: ['air', 'water'],
  async build(ctx) {
    const rng = ctx.rng, noise = ctx.noise, vary = ctx.vary || {};
    const detail = clamp(ctx.quality?.detail ?? 1, 0.5, 1), density = clamp(vary.density ?? 1, 0.7, 1.3);
    const scene = new THREE.Scene();
    const col = (h, m = 1) => new THREE.Color(h).multiplyScalar(m);

    // ------------------------------------------------------------------ the visit: sea, air, sun, cast
    const vr = rng.fork('visit');
    const seaRoll = vr(), airRoll = vr(), sunRoll = vr(), castRoll = vr();
    const SEA = seaRoll < 0.46 ? 'calm' : seaRoll < 0.74 ? 'chop' : 'ebb';
    // three days, each with its own sky, light, air and water: CLEAR (deep blue, hard white light, the red coast crisp), DUST (a milky
    // sky, the veil thick off the desert, the coast a red ghost, softer jade water) and LOW (the sun at 28 degrees: a deeper sky,
    // warmer light, the shadow longer and further from her). Never a sunset.
    const hour = vary.hour || 'any', lookRoll = (airRoll * 2 + sunRoll) % 1;
    let LOOK = lookRoll < 0.34 ? 'clear' : lookRoll < 0.67 ? 'dust' : 'low';
    if (hour === 'golden' || hour === 'dawn') LOOK = 'low'; else if (hour === 'day' && LOOK === 'low') LOOK = 'clear';
    const DUST = LOOK === 'dust' ? 1 : 0, LOWSUN = LOOK === 'low';
    const SKYC = { clear: ['#4F86C4', '#9CC3DA', '#DFE6DF', '#D3DEDD'], dust: ['#6A8FB4', '#B2C5CD', '#EBD8B8', '#DFD3BF'], low: ['#4878B8', '#93B6D6', '#E6E0CC', '#D7DAD0'] }[LOOK];
    const RARE = !!vary.rare;
    const CAST = castRoll < 0.5 ? 'one' : castRoll < 0.76 ? 'two' : 'shoal';
    const chop = SEA === 'chop' ? 1 : 0, ebb = SEA === 'ebb' ? 1 : 0;
    const sunElev = LOWSUN ? 28 : 38, az = 130 * Math.PI / 180, el = sunElev * Math.PI / 180;
    const sunDir = new THREE.Vector3(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el));

    // ------------------------------------------------------------------ the path: 400 m, heading +Z
    const endX = C0[0] + EC[0] * 60, endZ = C0[1] + EC[1] * 60;
    // off the ledge, down over the spit, then out to the RIGHT of her so that we look down the strip of bright sand between the
    // animal (on our left) and her shadow (on our right); we cross back over her shoulders at u 0.60-0.63 and sink to 5 m,
    // 8 m to her left and level with her eye, for the breath (u 0.64-0.70): her face, the lifted flipper, the puff against the red coast
    const path = makePath([
      // polish1: off the crest at once, banking right and down over the head of the channel (she is below us, crossing), then back
      // left onto the spit; the arc is as long as the old straight run, so every u from the spit on means what it meant before
      // (polish2: from 21 m, not 34: she is 50 m ahead and a third of the frame at once)
      [0, 21.5, 34], [-2.5, 20.8, 42], [-10.5, 18, 52], [-21.5, 14.5, 61], [-31, 11.8, 73], [-31, 9.2, 89], [-15, 6.6, 106], [0, 5.0, 122], [-1.2, 4.9, 138],
      // ... and we cross BEHIND her tail (u 0.53) to her sunlit left side, then draw level along her flank to her eye (u 0.66)
      // (polish2: up over her at once for the pair from above, then DOWN to 4.5 m on her right, low beside her tail and hind flippers with
      // a pterosaur at our shoulder, across behind the tail blade and up her sunlit flank)
      [-7, 5.2, 150], [-15.5, 3.8, 163], [-20, 3.0, 175], [-26.5, 4.6, 186], [-28, 6.6, 198], [-21, 6.3, 211], [-9, 5.5, 221], [-1.5, 5.2, 228], [4.2, 5.4, 238], [5.8, 5.0, 250], [4.4, 4.6, 267], [3.6, 4.2, 281],
      // polish2: a new stretch of open strait: low past the skerry (on our left) and the wheeling shoal, swinging out to the right so
      // that the second island is seen whole, with its cleft and the ring, before we turn in
      [3.0, 3.8, 297], [0.0, 4.3, 314], [-3.0, 5.2, 332], [-3.6, 6.2, 350], [0.5, 6.7, 366], [7.2, 6.9, 383],
      [C0[0], 7.0, C0[1]], [C0[0] + EC[0] * 20, 8.5, C0[1] + EC[1] * 20], [C0[0] + EC[0] * 40, 9, C0[1] + EC[1] * 40], [endX, 9, endZ],
    ]);
    // where she and the channel edge run
    // first across the channel head to the right (round the placodonts' spit), then back left onto our line; far ahead she swings right again, out of our sight
    // (polish2: the bank reaches out under the skerry and 10 m beyond it, so the rock stands on shoal sand, not on the channel's slope)
    const laneX = (z) => { const q = Math.max(0, (126 - z) / 21); return LANE_X - 18 * (1 - smoothstep(121, 187, z)) + 4.4 * q * q - 18 * smoothstep(290 + DZ, 350 + DZ, z); };
    const bankEdge = (z) => BANK_X - 9 * smoothstep(318, 338, z) * (1 - smoothstep(372, 396, z)) - 20 * smoothstep(285 + DZ, 345 + DZ, z) - 18 * smoothstep(98, 110, z) * (1 - smoothstep(137, 150, z));

    // polish2: the path is longer than the one every scripted moment was keyed to (397.6 m). UO(u) gives the OLD progress for our
    // place on the new path: metre for metre up to the end of the pass (old u 0.69), then the rest of the old clock spread over the
    // new stretch, the island front and the cleft. Everything scripted reads UO(u); only path distances use u * L.
    const L_OLD = 397.637, S_KEEP = 0.69 * L_OLD;
    // polish3: between 150 m and 245 m the path now swings low through the fish ring and wide out to her right (11.5 m longer); DSH takes
    // that out again, so that from the crossing behind her tail onward every moment falls where it fell
    // (the first bank is 4.7 m wider too, which keeps the twelve stills where they fell: D1 takes that out before the spit)
    const D1 = 4.7, D2 = 11.7, DSH = D1 + D2;
    const UO = (u) => { let s = clamp(u, 0, 1) * path.length; s -= D1 * smoothstep(40, 112, s) + D2 * smoothstep(155, 250, s); return s <= S_KEEP ? s / L_OLD : 0.69 + 0.31 * (s - S_KEEP) / (path.length - DSH - S_KEEP); };
    const UN = (uo) => (uo * L_OLD + D1 * smoothstep(38, 108, uo * L_OLD) + D2 * smoothstep(150, 234, uo * L_OLD)) / path.length;      // old u -> new u (valid up to old 0.69)

    // ------------------------------------------------------------------ sky, air
    const sky = makeSky({
      rng: rng.fork('sky'), preset: 'day', sunDirection: sunDir,
      zenith: SKYC[0], mid: SKYC[1], horizon: SKYC[2], ground: '#8FB9B4',
      horizonPow: 18, midPow: 0.75, scatter: 0.02, sunSize: 0.9, sunIntensity: 9, sunGlow: 0.3,
      clouds: { coverage: DUST ? 0.34 : 0.30, scale: 0.55, opacity: 0.9, softness: 0.30, haze: 0.3, wind: [0.006, 0.003], lit: '#fff9ee', shade: '#a9b9cf' }, clouds2: { coverage: DUST ? 0.36 : 0.26, stretch: 1, opacity: 0.6, scale: 0.8, haze: 0.4, wind: [0.004, 0.002], lit: '#ffffff', shade: '#c9d6e2' },
    });
    scene.add(sky.object);
    const fogCol = col(SKYC[3]);
    scene.fog = new THREE.FogExp2(fogCol, DUST ? 0.00150 : 0.00090);
    await ctx.yield();

    // ------------------------------------------------------------------ shared light (no scene lights)
    const warm = LOWSUN ? 1 : 0;
    const LU = {
      uSun: { value: sunDir },
      uSunA: { value: new THREE.Color(0.84 + 0.05 * warm - 0.05 * DUST, 0.72 - 0.03 * warm - 0.03 * DUST, 0.57 - 0.10 * warm - 0.01 * DUST) },
      uSkyA: { value: new THREE.Color(0.20 + 0.05 * DUST, 0.30 + 0.02 * DUST, 0.44 + 0.03 * warm - 0.04 * DUST) },
      uBounceA: { value: new THREE.Color(0.11, 0.10, 0.07) },
      uTime: { value: 0 },
    };
    const fogU = () => THREE.UniformsUtils.clone(THREE.UniformsLib.fog);

    // ------------------------------------------------------------------ the lie of the land (CPU height functions)
    // launch island: a tilted slab. s runs down the dip, t along the crest (left-forward)
    const env1 = (x, z) => {
      const s = x * DIPDIR[0] + z * DIPDIR[1], t = x * DIPDIR[1] - z * DIPDIR[0];
      const n = noise.fbm2(x * 0.021 + 3.1, z * 0.021 - 7.7, 3), n2 = noise.n2(x * 0.09, z * 0.09);
      // a rock shoulder each side of the way out
      let h = CREST - DIP * (s + 3) + n2 * 0.25 + 4.6 * Math.exp(-(Math.pow((x - 13.5) / 6, 2) + Math.pow((z - 22) / 9, 2))) + 1.2 * Math.exp(-(Math.pow((x + 17.5) / 6, 2) + Math.pow((z - 21) / 8, 2)));
      const sf = 23.5 + n * 5 + smoothstep(22, 85, t) * 50;              // where the pavement breaks into steps
      if (s > sf) h -= (s - sf) * (0.80 + 0.25 * n2);
      if (s < -3) h -= (-3 - s) * 2.4;
      const tr = -36 + n * 7, tl = 150 + n * 14;
      if (t < tr) h -= (tr - t) * 1.9;
      if (t > tl) h -= (t - tl) * 1.3;
      return h;
    };
    // second island: a = along the cleft axis from its mouth, b = to the left of it
    const cleftB = (a) => -36 * smoothstep(63, 96, a);
    const env2top = (x, z) => {
      const dx = x - C0[0], dz = z - C0[1], a = dx * EC[0] + dz * EC[1], b = dx * EC[1] - dz * EC[0];
      const n = noise.fbm2(x * 0.024 - 11.3, z * 0.024 + 5.9, 3), n2 = noise.n2(x * 0.11 + 9, z * 0.11);
      let h = 18.5 - 0.035 * a + 0.05 * b + n * 4.5 + n2 * 0.4 + 2.2 * noise.n2(x * 0.045 + 3, z * 0.045 - 8);
      const edge = (d) => 2.7 * Math.min(d, 3.4 + n2) + 0.22 * clamp(d - 3.4 - n2, 0, 5.5) + 2.3 * Math.max(d - 8.9 - n2, 0);
      const a0 = -5 + n * 6 + Math.max(0, b) * 0.10, a1 = 150 + n * 12;
      if (a < a0) h -= edge(a0 - a);
      if (a > a1) h -= (a - a1) * 1.6;
      const br = -(22 + 16 * smoothstep(10, 60, a) + 46 * smoothstep(46, 84, a)) + n * 4, bl = 84 + n * 10;
      if (b < br) h -= edge(br - b) * 0.6;      // (polish2: a slope the mesh can hold; as a cliff this flank stood in sawteeth)
      if (b > bl) h -= edge(b - bl) * 0.7;
      return h;
    };
    const env2 = (x, z, widen = 0, steep = 5.5) => {
      const dx = x - C0[0], dz = z - C0[1], a = dx * EC[0] + dz * EC[1], b = dx * EC[1] - dz * EC[0];
      const w = 10.2 + noise.n2(x * 0.11 + 9, z * 0.11) * 0.9 + 3 * smoothstep(-8, 4, -a) + widen;
      return Math.min(env2top(x, z), (Math.abs(b - cleftB(a)) - w) * steep - 2.2);      // the cleft
    };
    // polish2: a skerry, an outlying slab of the second island 30 m long, tilted like the islands: awash at its near end, 8 m high at
    // the far one. We pass 10 m to its right on the new stretch (u 0.64-0.76); the swell creams round it.
    const SK = { x: 22.5, z: 353, sn: Math.sin(0.3), cs: Math.cos(0.3), hl: 15.5, hw: 8 };
    const skL = (x, z) => [(x - SK.x) * SK.sn + (z - SK.z) * SK.cs, (x - SK.x) * SK.cs - (z - SK.z) * SK.sn];
    // a blunt-ended slab in plan (as an ellipse its low tip ran out into a thin dark tongue)
    // (the wobble of the outline dies just outside it: it used to leave a spur of rock awash off the near tip, a dark line in the water)
    const skD = (ls, lt) => { const hy = Math.cbrt(Math.pow(Math.abs(ls / SK.hl), 3) + Math.pow(Math.abs(lt / SK.hw), 3)); return hy + (0.10 * Math.sin(ls * 0.45 + 1) + 0.08 * Math.sin(lt * 0.9 + 2) + 0.05 * Math.sin((ls + lt) * 1.3)) * (1 - smoothstep(0.92, 1.12, hy)); };
    const env3 = (x, z) => {
      if (Math.abs(x - SK.x) > 30 || Math.abs(z - SK.z) > 30) return -99;
      const [ls, lt] = skL(x, z);
      // polish3: a tipped table. Its top is one bedding plane dipping toward our line: awash on the side we pass, 7 m high on the far,
      // sunward side, so what we see is the sunlit pavement running down into the surf (it showed us its shaded wall: a black wedge)
      const top = -1.5 + 6.2 * clamp(lt / SK.hw * 0.5 + 0.5, 0, 1) + 0.9 * clamp(ls / SK.hl, -1, 1) + 0.5 * noise.n2(x * 0.09 + 5, z * 0.09);
      return Math.min(top, (1 - skD(ls, lt)) * 34);      // steep all round: a gentle foot left a wave-washed shelf that read as a dark line in the water
    };
    // the sand banked round the skerry: an apron that rises to meet the rock 3 m down (the channel runs close by on its right)
    const apron3 = (x, z) => { if (Math.abs(x - SK.x) > 60 || Math.abs(z - SK.z) > 60) return -99; const [ls, lt] = skL(x, z); return Math.min((1 - skD(ls, lt)) * 1.6, 0.5) - 2.0; };
    const envI = (x, z) => Math.max(env1(x, z), env2(x, z), env3(x, z));
    // sea floor: banks 1-4 m deep on the island side, the 12 m channel, far banks, the mainland shore
    const floorBase = (x, z) => {
      const n = noise.fbm2(x * 0.02 + 40, z * 0.02 + 13, 3), e = bankEdge(z);
      let bank = -2.6 + n * 1.5 + ebb * 2.5 * smoothstep(e + 5, e + 22, x) * (0.75 + 0.5 * noise.n2(x * 0.045, z * 0.045));
      const spit = smoothstep(96, 108, z) * (1 - smoothstep(139, 153, z)) * smoothstep(e - 1, e + 4, x) * (1 - smoothstep(e + 15, e + 30, x));
      bank = lerp(bank, Math.max(bank, -1.25 + 0.3 * noise.n2(x * 0.12, z * 0.12)), spit);
      const farBank = -4.2 + n * 1.3 + smoothstep(-250, -310, x) * 5.2;
      const head = smoothstep(42, 66, z + n * 6);                         // the channel begins 40 m out from the ledge
      // polish3: the drop-off wanders in bays and tongues and falls away over 20 m in a slope that slumps (it was a ruled edge 11 m wide:
      // 'a pane under the surface'); it never comes nearer her lane than the old edge did
      const e2 = e + clamp(8 * noise.n2(z * 0.021 + 3.3, 2.2) + 5 * noise.n2(z * 0.062, x * 0.02 + 5.1), -4, 13);
      // two stages: a long pale ramp that deepens through every green on the way down, then the channel side proper
      const tt = (e2 + 7 - x - 2.6 * noise.n2(x * 0.09 + 7, z * 0.09)) / 31;
      const spitZ = smoothstep(96, 108, z) * (1 - smoothstep(139, 153, z));
      const ch = lerp(0.40 * smoothstep(0, 0.62, tt) + 0.60 * smoothstep(0.42, 1, tt), smoothstep(e + 2, e - 9, x), spitZ) * head;
      const right = smoothstep(-92, -78, x);
      let h = lerp(farBank, lerp(bank, FLOOR_Y, ch), right);
      return h;
    };
    // (polish2: the floor used to rise to a pale shelf 0.4 m under water all round the rocks, which read as a blobby white band: now the
    // rock goes down 4 m into the sea and the sand meets it there; the cleft is a channel 6 m deep)
    const cleftDeep = (x, z) => { const dx = x - C0[0], dz = z - C0[1], a = dx * EC[0] + dz * EC[1], b = dx * EC[1] - dz * EC[0]; return smoothstep(-34, -6, a) * (1 - smoothstep(13, 22, Math.abs(b - cleftB(a)))); };
    // polish3: beyond the rock's foot the sand runs on down as an apron (a fall of 1 in 5) instead of ending at a cliff under water:
    // where the channel passes close under an island the shelf showed as a pale pane with a ruled edge
    const skirt = (e) => (e >= 0 ? Math.min(e, 0.5) - 3.4 : -3.4 + e * 0.15);
    const floorH = (x, z) => Math.max(lerp(floorBase(x, z), -6.2, cleftDeep(x, z)), skirt(Math.max(env1(x, z), env2(x, z, 1.8, 8))), apron3(x, z));
    // is the sun hidden by an island from here? 0 lit .. 1 shaded (marched along the sun on the envelopes)
    const shadeAt = (x, y, z) => {
      let sh = 0;
      for (let i = 1; i <= 9; i++) {
        const d = i * i * 0.55 + 1.2, px = x + sunDir.x * d, py = y + sunDir.y * d, pz = z + sunDir.z * d;
        if (py > 31) break;
        const over = envI(px, pz) - py;
        if (over > 0) { sh = Math.max(sh, Math.min(1, over / (0.6 + d * 0.06))); if (sh >= 1) break; }
      }
      return sh;
    };
    const nearIsland = (x, z) => (x > -45 && x < 190 && z > -50 && z < 135) || (x > -45 && x < 200 && z > 325 && z < 540 + DZ);

    // ------------------------------------------------------------------ the hero: Ichthyotitan and her escort
    const hero = await buildHero(ctx, { palette: PALETTE, detail, stage: false, floorY: FLOOR_Y, sunDir, sharks: 5, momentShift: BREATH_SHIFT });
    hero.object.position.set(laneX(titanZ(0)), 0, titanZ(0));
    scene.add(hero.object);
    if (CAST === 'shoal') { hero.parts.sharks.visible = false; hero.parts.sharkShadows.visible = false; }
    const HU = hero.uniforms;
    // the day's light and water under the surface (shared by her, the floor, the shadows and everything that swims)
    const dayLight = (H) => {
      H.uTintB.value.set('#2C9DB4'); H.uTintA.value.set('#7FD2C0');      // the channel: deep clear turquoise under the pale shoals
      if (LOWSUN) { H.uSunCol.value.setRGB(0.90, 0.71, 0.50); H.uSkyCol.value.setRGB(0.40, 0.52, 0.70); H.uTintA.value.set('#74C6BE'); H.uTintB.value.set('#2A93B0'); }
      if (DUST) { H.uSunCol.value.setRGB(0.76, 0.67, 0.54); H.uSkyCol.value.setRGB(0.47, 0.55, 0.62); H.uTintA.value.set('#86CDB2'); H.uTintB.value.set('#44A596'); }
    };
    dayLight(HU);
    await ctx.yield();
    // a second giant: the rare roller 40 m to the right, or the leader of two in line
    let hero2 = null;
    if (RARE || CAST === 'two') {
      hero2 = await buildHero(ctx, { palette: PALETTE, detail, stage: false, floorY: FLOOR_Y, sunDir, sharks: 5 });
      hero2.parts.sharks.visible = false; hero2.parts.sharkShadows.visible = false; dayLight(hero2.uniforms);
      scene.add(hero2.object);
      await ctx.yield();
    }

    // ------------------------------------------------------------------ sea floor and water: one grid, two meshes
    const xs = [], zs = [];
    for (let x = -340; x < -96; x += 20) xs.push(x);
    for (let x = -96; x <= 150; x += 2.5) xs.push(x);
    for (let x = 164; x <= 300; x += 17) xs.push(x);
    for (let z = -200; z < -44; z += 26) zs.push(z);
    for (let z = -44; z <= 452 + DZ; z += 4) zs.push(z);
    for (let z = 470 + DZ; z <= 900 + DZ; z += 21.5) zs.push(z);
    const NX = xs.length, NZ = zs.length, NV = NX * NZ;
    const fPos = new Float32Array(NV * 3), wPos = new Float32Array(NV * 3), fAux = new Float32Array(NV * 3), gIdx = [];
    for (let j = 0; j < NZ; j++) {
      for (let i = 0; i < NX; i++) {
        const k = j * NX + i, x = xs[i], z = zs[j], h = floorH(x, z);
        fPos[k * 3] = x; fPos[k * 3 + 1] = h; fPos[k * 3 + 2] = z;
        wPos[k * 3] = x; wPos[k * 3 + 1] = 0; wPos[k * 3 + 2] = z;
        const ni = nearIsland(x, z);
        fAux[k * 3] = h;
        fAux[k * 3 + 1] = ni ? shadeAt(x, Math.max(h, 0, Math.min(envI(x, z), 30)) + 0.2, z) : 0;      // (polish2: a floor vertex UNDER a rock asks from the rock's top, or the coarse grid drew a dark halo out past the rock on its sunny side)
        fAux[k * 3 + 2] = ni ? clamp((envI(x, z) + 7) / 5, 0, 1) : 0;
      }
      if (j % 4 === 3) await ctx.yield();
    }
    for (let j = 0; j < NZ - 1; j++) for (let i = 0; i < NX - 1; i++) { const a = j * NX + i, b = a + 1, c = a + NX, d = c + 1; gIdx.push(a, c, b, b, c, d); }
    const floorGeo = new THREE.BufferGeometry();
    floorGeo.setAttribute('position', new THREE.BufferAttribute(fPos, 3)); floorGeo.setAttribute('aAux', new THREE.BufferAttribute(fAux, 3));
    floorGeo.setIndex(gIdx); floorGeo.computeBoundingSphere();
    const waterGeo = new THREE.BufferGeometry();
    waterGeo.setAttribute('position', new THREE.BufferAttribute(wPos, 3)); waterGeo.setAttribute('aAux', floorGeo.attributes.aAux);
    waterGeo.setIndex(gIdx); waterGeo.computeBoundingSphere();
    await ctx.yield();
    const floorMat = new THREE.ShaderMaterial({
      fog: true, uniforms: { ...fogU(), ...HU, uSunW: LU.uSun },
      vertexShader: /* glsl */`attribute vec3 aAux; varying vec3 vW; varying float vSh;
#include <fog_pars_vertex>
void main(){ vec4 wp = modelMatrix * vec4(position, 1.); vW = wp.xyz; vSh = aAux.y; vec4 mvPosition = viewMatrix * wp; gl_Position = projectionMatrix * mvPosition;
#include <fog_vertex>
}`,
      fragmentShader: /* glsl */`
uniform vec3 uSkyCol, uSunCol, uSunRefr, uSunW; uniform float uShade;
varying vec3 vW; varying float vSh;
#include <fog_pars_fragment>
${NOISE_GLSL}
${SEA_GLSL}
${SAND_GLSL}
void main(){
  float rip; float dist = length(cameraPosition - vW);
  vec3 a = sandCol(vW.xz, dist, rip);
  float wet = smoothstep(.0, .9, -vW.y);                      // under water
  float nearS = 1. - smoothstep(18., 55., dist);
  float ca = caustic(vW.xz, uTime) * wet * (1. - .6 * smoothstep(110., 260., dist)) * 1.25;
  // shell hash on the banks: crisp-edged drifts of broken shell, pale pieces with dark gaps between them (never a soft stain)
  float bankK = smoothstep(-7., -4.5, vW.y);
  float hn = fbm(vW.xz * .17 + 71.) + (vn(vW.xz * 1.5) - .5) * .12 + (vn(vW.xz * 5.3) - .5) * .06;
  float hash = smoothstep(.612, .628, hn) * bankK;
  float bits = vn(vW.xz * 6.1 + 13.) , gaps = 1. - smoothstep(.26, .34, vn(vW.xz * 8.3 + 5.));
  float hk = 1. - smoothstep(20., 60., dist);
  vec3 shellC = mix(a * vec3(1.03, 1.02, 1.0), mix(a * 1.22 + .03, a * vec3(.50, .47, .42), gaps), hk * (.35 + .65 * smoothstep(.35, .6, bits)));
  a = mix(a, shellC, hash);
  // dry sand left by the tide: paler, ribbed, darker where still damp
  float dry = smoothstep(.05, .5, vW.y);
  a *= mix(1., 1.06, dry) * mix(1., .72, (1. - dry) * (1. - wet));
  float cs = smoothstep(.50, .70, fbm(vW.xz * .0058 + vec2(uTime * .0035, uTime * .0022) + 3.7));      // cloud shadows drifting down the strait
  float sun = (1. - vSh * .96) * mix(uSunW.y * 1.15, uSunRefr.y, wet) * (1. - .50 * cs);
  float lens = sin(vW.x * .52 + vW.z * .36 + fbm(vW.xz * .045) * 5. - uTime * 1.25) + .5 * sin(vW.x * -.21 + vW.z * .47 - uTime * .8 + 2.);
  sun *= 1. + .12 * lens * wet;
  vec3 L = uSunCol * sun * (1. + (.20 + .06 * nearS + .2 * dry + .14 * (1. - smoothstep(1., 5., -vW.y))) * rip) * (.90 + .62 * ca * (1. - .7 * cs)) + uSkyCol * uShade * (1. - .12 * vSh) * (1. + .05 * rip);
  vec3 col = seaTint(a * L, -vW.y, vW);
  gl_FragColor = vec4(col, 1.);
  #include <fog_fragment>
}`,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat); floor.renderOrder = 0; scene.add(floor);
    await ctx.yield();
    //@@HERO
    // the water's skin: sky fresnel far off, glass below us, surf on the island feet, the far strait dark
    const headW = new THREE.Vector3(), head2W = new THREE.Vector3(0, 0, -9999), heroW = new THREE.Vector4(0, 0, 0, 1);   // heroW: her mid-body x, z and heading
    const waterMat = new THREE.ShaderMaterial({
      fog: true, transparent: true, depthWrite: false,
      uniforms: { ...fogU(), uTime: LU.uTime, uZen: { value: col(SKYC[0]) }, uPale: { value: col(SKYC[1]) }, uHor: { value: col(SKYC[2]) },
        uFar: { value: col(PALETTE[3], 1.0) }, uShal: { value: col('#63BFAF') }, uChop: { value: chop }, uHead: { value: headW }, uHead2: { value: head2W },
        uLift: HU.uLift, uHero: { value: heroW }, uSunW: LU.uSun, uFoamC: { value: new THREE.Color(1.18, 1.16, 1.10) },
        uCleft: { value: new THREE.Vector4(C0[0], C0[1], EC[0], EC[1]) }, uWallLit: { value: col('#B9B09C', 0.62) }, uWallSh: { value: col('#5C6B78', 0.5) } },
      vertexShader: /* glsl */`attribute vec3 aAux; varying vec3 vW; varying vec3 vAux;
#include <fog_pars_vertex>
void main(){ vec4 wp = modelMatrix * vec4(position, 1.); vW = wp.xyz; vAux = aAux; vec4 mvPosition = viewMatrix * wp; gl_Position = projectionMatrix * mvPosition;
#include <fog_vertex>
}`,
      fragmentShader: /* glsl */`
uniform vec3 uZen, uPale, uHor, uFar, uShal, uHead, uHead2, uSunW, uFoamC, uWallLit, uWallSh; uniform vec4 uHero, uCleft; uniform float uTime, uChop, uLift;
varying vec3 vW; varying vec3 vAux;
#include <fog_pars_fragment>
${NOISE_GLSL}
float swell(vec2 p){ float t = uTime;
  return sin(p.x * .21 + p.y * .13 + t * .55) * .06 + sin(p.x * -.11 + p.y * .29 + t * .43 + 1.7) * .05 + sin(p.x * .53 - p.y * .47 + t * .9) * .015; }
void main(){
  float h = vAux.x, sh = vAux.y;
  if (h > .12) discard;
  vec2 p = vW.xz; vec3 V = cameraPosition - vW; float dist = max(length(V), 1e-3); V /= dist;
  float e = .35;
  float hx = swell(p + vec2(e, 0.)) - swell(p - vec2(e, 0.)), hz = swell(p + vec2(0., e)) - swell(p - vec2(0., e));
  float nearK = 1. - smoothstep(25., 110., dist);
  // wind ripples: a fine shiver everywhere, a real chop on some days
  vec2 q = p * 1.35 + vec2(uTime * .42, uTime * .31), q2 = p * 3.1 - vec2(uTime * .6, -uTime * .45);
  float c1 = vn(q) - .5, c2 = vn(q2) - .5;
  vec2 rp = vec2(vn(q + vec2(.3, 0.)) - vn(q - vec2(.3, 0.)), vn(q + vec2(0., .3)) - vn(q - vec2(0., .3)));
  float chopK = (.05 + .5 * uChop) * nearK;
  vec3 N = normalize(vec3(-hx / (2. * e) - rp.x * chopK, 1., -hz / (2. * e) - rp.y * chopK));
  float nv = clamp(dot(N, V), 0., 1.), f = 1. - nv, f5 = f * f; f5 = f5 * f5 * f;
  float F = .02 + .98 * f5;
  vec3 Rr = reflect(-V, N); float up = clamp(Rr.y, 0., 1.); up = mix(max(up, .15), up, smoothstep(140., 480., dist));
  vec3 sky = mix(mix(uHor, uPale, smoothstep(0., .16, up)), uZen, smoothstep(.12, .85, up));
  // cat's-paws: patches of ruffled water drifting down the strait on the breeze
  float paw = fbm(p * .035 + vec2(uTime * .045, uTime * .06)); paw = smoothstep(.42, .62, paw + .12 * vn(p * .21 - uTime * .25));
  F = clamp(F * (1. + .55 * paw) + .028 * paw * (1. - nearK * .7), 0., 1.);
  // glass: within 200 m the skin gives back less than half of the sky it should, and less again over her and her shadow,
  // so that from the ledge she is the darkest thing in the sea and her shadow is sand in shade, not a blue copy of her
  vec2 hq = p - uHero.xy; float along = clamp(dot(hq, uHero.zw), -13., 12.); hq -= uHero.zw * along; hq.x += 3.;
  float overHer = 1. - smoothstep(8., 17., length(hq));
  float aR = clamp((F * 1.05 + .012) * mix(.42, 1., smoothstep(60., 210., dist)) * (1. - .6 * overHer), 0., .96);
  float depth = max(-h, 0.), deepK = smoothstep(1.2, 3.2, depth);
  // slow slicks give the glass a skin; a smooth hump of pale sky travels over each head
  float slick = sin(p.x * .29 + p.y * .17 + uTime * .11) * sin(p.y * .23 - p.x * .09 - uTime * .08);
  slick = slick * slick * (.5 + .5 * sin(p.x * .05 - p.y * .07 + uTime * .03));
  vec2 d1 = p - uHead.xz, d2 = p - uHead2.xz;
  float hump = exp(-dot(d1, d1) / 7.) * (.02 + .07 * uLift / 1.55) + exp(-dot(d2, d2) / 9.) * uHead2.y;
  // the skin itself, so that whatever swims is seen THROUGH something: wind-drawn threads of pale sky, sparks on the cat's-paws,
  // a long smooth hump travelling over her back and slow rings spreading where the snout base lifts
  vec2 sq = p * vec2(.95, .42) + vec2(uTime * .16, uTime * .10);
  float thr = 1. - smoothstep(0., .075, abs(vn(sq + vn(sq * 1.6 + 5.) * .8) - .5));
  float thr2 = 1. - smoothstep(0., .05, abs(vn(sq * 2.3 - vn(sq * 2.9) * .6 + 9.) - .5));
  float skin = (thr * .11 + thr2 * .05 * nearK) * (.35 + .65 * deepK) * (1. - .7 * smoothstep(120., 300., dist));
  float backK = exp(-dot(hq, hq) / 5.5) * step(-12.9, along) * step(along, 11.9);
  float wake = backK * (.035 + .05 * max(sin(along * 1.7 + uTime * 2.1) * sin(length(hq) * 2.3 - uTime * 1.6), 0.));
  // (polish2: the rings are few, uneven and broken by the wind's own ripples: they were ruled circles)
  float rr = length(d1 * vec2(1., .82)) + (vn(p * .33 + vec2(uTime * .1, 0.)) - .5) * 2.2 + (vn(p * 1.1) - .5) * .7;
  float rings = exp(-rr * rr / 70.) * smoothstep(.15, .95, .5 + .5 * sin(rr * 1.9 - uTime * 2.6)) * smoothstep(1.0, 2.6, rr) * (.03 + .13 * uLift / 1.55) * (.55 + .9 * vn(p * .8 + 7.));
  aR = clamp(aR + hump + .05 * slick + skin + wake + rings, 0., .96);
  // chop: bright facets of sky and dark backs of wavelets shiver over whatever lies below
  vec2 q3 = p * vec2(5.3, 7.9) + vec2(uTime * .9, uTime * .6), q4 = p * vec2(12.7, 9.1) - vec2(uTime * 1.1, -uTime * .8);
  float facet = smoothstep(.16, .34, (vn(q3) - .5) + (vn(q4) - .5) * .8 + c1 * .35) * uChop * (.25 + .75 * nearK) * (.12 + .88 * deepK);      // over the shallows only a shiver: the shells stay readable
  sky = mix(sky, uPale * 1.04, facet * .5);
  aR = clamp(aR + facet * .075, 0., .96);
  // far off the water closes over: dark teal over the channel, pale green over the banks
  vec3 body = mix(uShal, uFar, smoothstep(2.5, 9., depth)) * (.62 + .38 * (1. - sh));
  float aB = smoothstep(150., 430., dist) * .96 + uChop * .10 * (1. - smoothstep(.0, .3, c2 + .2)) * (.2 + .8 * deepK);
  // surf: a creaming white line on the island feet, surging with the swell
  float surge = .5 + .5 * sin(uTime * .9 + p.x * .07 + p.y * .05);
  float isl = vAux.z;
  // the cleft (polish2): the coarse floor grid cannot draw a shoreline between walls 20 m apart (it drew grey slabs), so inside the
  // cleft and round its mouth the foam is left to the strips that follow the wall feet, and the water gives back the WALLS:
  // warm lit stone on the sunny side, blue shade on the other, a strip of sky down the middle
  vec2 cq = p - uCleft.xy; float cA = dot(cq, uCleft.zw), cB = cq.x * uCleft.w - cq.y * uCleft.z + 36. * smoothstep(63., 96., cA);
  float cW = 10.5 + 3. * smoothstep(-8., 4., -cA);
  float inC = smoothstep(-14., -5., cA) * (1. - smoothstep(cW + 4., cW + 9., abs(cB)));
  float wallK = inC * smoothstep(-4., 8., cA) * smoothstep(.22, .92, abs(cB) / cW + (vn(p * .9 + vec2(uTime * .3, 0.)) - .5) * .22 + rp.x * .5);
  vec3 wallC = mix(uWallSh, uWallLit, smoothstep(-2., 2., -cB) * (1. - .8 * sh)) * (.75 + .5 * vn(vec2(p.x * .5 + p.y * .9, cB * 1.3 + uTime * .15)));
  sky = mix(sky, wallC, wallK * .85);
  aR = clamp(aR + wallK * .42 + inC * .10, 0., .96);
  // (polish2: on the island feet the white line itself is drawn on the rock at the waterline, pixel-sharp; the water only adds
  // threads of lace drifting off it, since the floor grid here is far too coarse to carry a shoreline)
  float band = smoothstep(mix(-.28, -.62, isl), mix(-.06, -.44, isl), h) * (1. - smoothstep(-.02, .12, h)) * mix(.5, .8, isl) * (1. - inC) * (1. - smoothstep(.15, .5, isl));
  float offK = smoothstep(-3.4, -1.1, h) * isl * (1. - inC);
  float offT = 1. - smoothstep(0., .07, abs(vn(p * vec2(.9, .7) + vec2(uTime * .12, -uTime * .1) + vn(p * 2.1 + 3.) * .9) - .5));
  float lace = fbm(p * 1.6 + vec2(uTime * .22, -uTime * .17)) + .35 * sin(h * 5. - uTime * 1.3);
  float foam = band * smoothstep(.42, .75, lace + band * .45) * (1. - smoothstep(260., 520., dist));
  foam = clamp(foam + smoothstep(-.3, .0, h) * band * .6 * isl + offT * offK * .5 * (.4 + .6 * surge), 0., 1.);
  // over the shoals the swell stands up and frays into thin lines of lace that run in and fade
  float shoalK = (1. - smoothstep(.8, 1.9, depth)) * (1. - smoothstep(200., 420., dist));
  float wf = sin(p.x * .9 + p.y * .55 - uTime * 1.1 + fbm(p * .11) * 7.);
  float laceS = smoothstep(.80, .97, wf) * smoothstep(.38, .62, fbm(p * 1.3 + vec2(-uTime * .3, uTime * .2)));
  foam = clamp(foam + laceS * shoalK * .55, 0., 1.);
  float cs = smoothstep(.50, .70, fbm(p * .0058 + vec2(uTime * .0035, uTime * .0022) + 3.7));
  body *= 1. - .35 * cs; sky *= 1. - .12 * cs;
  float spark = .35 * smoothstep(.97, 1.06, vn(p * 5.1 + vec2(uTime * 1.3, -uTime * .9)) * (.6 + .8 * vn(p * 8.3 - vec2(uTime * 1.7, uTime * 1.1)))) * paw * (1. - cs)
    * smoothstep(14., 40., dist) * (1. - smoothstep(170., 380., dist));
  vec3 foamC = uFoamC * mix(vec3(1.), vec3(.42, .52, .66), sh * .9) * (.85 + .3 * vn(p * 9.));
  float a = 1. - (1. - aR) * (1. - aB);
  vec3 c = (sky * .92 * aR + body * aB * (1. - aR)) / max(a, 1e-3);
  c = mix(c, vec3(1.5, 1.45, 1.3), spark * .8); a = max(a, spark * .8);
  c = mix(c, foamC, foam); a = max(a, foam * .92);
  gl_FragColor = vec4(c, a);
  #include <fog_fragment>
}`,
    });
    const water = new THREE.Mesh(waterGeo, waterMat); water.renderOrder = 6; scene.add(water);
    await ctx.yield();
    //@@GROUND
    const ledgePts = [];
    // ------------------------------------------------------------------ the islands: bedded grey limestone
    // beds: the surface is cut into steps wherever it leaves a bedding plane (bed coordinate = height above the plane)
    const terrace = (bed, T) => { const k = Math.floor(bed / T), f = bed / T - k; return (k + smoothstep(0.62, 0.98, f)) * T; };
    const bed1 = (x, z) => DIP * (x * DIPDIR[0] + z * DIPDIR[1]);
    const h1 = (x, z) => { const e = env1(x, z), b = bed1(x, z); return terrace(e + b + 40, 1.7 + 0.5 * noise.n2(x * 0.013, z * 0.013)) - 40 - b; };
    const bed2 = (x, z) => 0.035 * ((x - C0[0]) * EC[0] + (z - C0[1]) * EC[1]) - 0.05 * ((x - C0[0]) * EC[1] - (z - C0[1]) * EC[0]);
    // (polish2: no steps within 3 m of the sea: on the coarse mesh a riser at the waterline stood up as a row of spikes)
    const h2 = (x, z) => { const e = env2(x, z, 7, 8), b = bed2(x, z); return lerp(e - 0.4, terrace(e + b + 40, 1.9) - 40 - b, smoothstep(0.8, 3.6, e)); };
    const bed3 = (x, z) => -0.36 * skL(x, z)[1];
    const h3 = (x, z) => { const e = env3(x, z), b = bed3(x, z); return lerp(e - 0.3, terrace(e + b + 40, 1.25) - 40 - b, smoothstep(0.6, 2.4, e)); };
    const landH = (x, z) => Math.max(h1(x, z), h2(x, z), h3(x, z));
    const rockMat = new THREE.ShaderMaterial({
      fog: true, uniforms: { ...fogU(), ...HU, ...LU, uRock: { value: col('#C9C6BC', 0.80) }, uSoil: { value: col('#9A4A30', 0.75) } },
      vertexShader: /* glsl */`attribute vec2 aRk; varying vec3 vW, vN; varying vec2 vRk;
#include <fog_pars_vertex>
void main(){ vec4 wp = modelMatrix * vec4(position, 1.); vW = wp.xyz; vN = normal; vRk = aRk; vec4 mvPosition = viewMatrix * wp; gl_Position = projectionMatrix * mvPosition;
#include <fog_vertex>
}`,
      fragmentShader: /* glsl */`
uniform vec3 uRock, uSoil, uSunCol, uSkyCol, uSunRefr; uniform float uShade;
varying vec3 vW, vN; varying vec2 vRk;
#include <fog_pars_fragment>
${NOISE_GLSL}
${LIGHT_GLSL}
${SEA_GLSL}
${SAND_GLSL}
void main(){
  vec3 N = normalize(vN + vec3(0., 1e-4, 0.));
  float dist = length(cameraPosition - vW), near = 1. - smoothstep(40., 150., dist);
  float bed = vRk.x, top = smoothstep(.72, .9, N.y), face = 1. - top;
  vec3 rough = vec3(vn(vW.xz * 1.7 + vW.y * 2.3) - .5, (vn(vW.xy * 2.1 + vW.z * 1.3) - .5) * .5, vn(vW.zx * 1.9 - vW.y * 2.1) - .5) + (vec3(vn(vW.xz * 6.1 + vW.y * 5.), .5, vn(vW.zy * 5.7 + vW.x * 6.3)) - .5) * .5;
  N = normalize(N + rough * (.38 * near + .08));
  // strata: beds of uneven thickness, a dark joint under each lip, thin laminae inside the beds
  // (polish1: the beds undulate, pinch and break into blocks; no joint runs ruled from end to end)
  float hc = vW.x * .9 + vW.z * .7;
  float bw = bed * .62 + vn(vW.xz * .05) * .9 + (vn(vec2(hc * .07, vW.y * .05)) - .5) * .45 + (vn(vec2(hc * .5, vW.y * .3)) - .5) * .07, k = floor(bw), f = fract(bw);
  float cx = hc * (.22 + .2 * h12(vec2(k, 11.))) + h12(vec2(k, 7.)) * 9. + (vn(vec2(vW.y * .6, k)) - .5) * .3, cf = fract(cx);
  float blockT = h12(vec2(floor(cx), k * 3.1));
  float vj = (1. - smoothstep(.0, .03, min(cf, 1. - cf))) * face * step(.45, blockT);
  float tone = .80 + .20 * h12(vec2(k, 3.)) + .16 * (blockT - .5) * face + .10 * (vn(vec2(bw * 9., vW.x * .05 + vW.z * .05)) - .5) * near;
  float jm = .25 + .75 * smoothstep(.3, .62, vn(vec2(hc * .19, k * 7.3)));
  float joint = (1. - smoothstep(.0, .10, f)) * .50 * jm + (1. - smoothstep(.0, .05, abs(f - .55))) * .12 * near * (1. - jm) + vj * .30;
  // vertical joints and rain stains down the faces
  float st = vn(vec2(vW.x * .9 + vW.z * .7, vW.y * .12)) * .6 + vn(vec2(vW.x * 2.3 - vW.z * 1.9, vW.y * .3)) * .4;
  vec3 alb = uRock * tone * (1. - joint * face) * mix(1., .72 + .5 * st, face);
  // polish3: the beds are not one grey: buff and cream limestones between the grey ones, now and then a rusty marl
  float bq = h12(vec2(k, 9.)), br = h12(vec2(k, 5.));
  alb *= mix(vec3(1.), mix(vec3(1.17, 1.02, .79), vec3(1.22, .88, .64), step(.86, br)), smoothstep(.30, .62, bq) * (.35 + .65 * face));
  alb = mix(alb, alb * vec3(.80, .86, .96), smoothstep(.55, .8, vn(vW.xz * .08 + 9.)) * .5);      // lichen-grey patches
  // polish2: a face seen close is not ruled lines: blocks of different weathering, a web of fine cracks, pits and pale lichen spots
  float mid = 1. - smoothstep(25., 90., dist);
  vec2 fq = vec2(hc, vW.y * 1.05);
  alb *= mix(1., .74 + .52 * fbm(fq * .85 + 5.), face * (.35 + .65 * mid));
  float crk = 1. - smoothstep(0., .045, abs(vn(fq * 1.25 + vn(fq * 3.1) * .7 + 9.) - .5));
  float crk2 = 1. - smoothstep(0., .06, abs(vn(fq * 4.3 + 21.) - .5));
  alb *= 1. - (.30 * crk * mid * smoothstep(.3, .6, vn(fq * .23 + 2.)) + .20 * crk2 * near) * face;
  alb = mix(alb, vec3(.62, .60, .50), smoothstep(.68, .80, vn(fq * 2.7 + 31.)) * smoothstep(.45, .7, vn(fq * .4 + 3.)) * .5 * mid);
  // iron stain bleeding down from the red soil, weather pockets, and ferns and moss hanging from the wetter ledges
  float stain = smoothstep(.42, .72, fbm(vec2(hc * .06, vW.y * .10) + 3.)) * face;
  alb = mix(alb, alb * vec3(1.30, .90, .60), stain * .75);
  alb *= 1. - .26 * smoothstep(.76, .84, vn(vec2(hc * 2.7, vW.y * 3.3))) * face * near;
  float gm = smoothstep(.62, .78, vn(vec2(hc * .15, k * 3.7 + 1.))) * smoothstep(.50 + .3 * vn(vec2(hc * 2.3, 5.)), 1., f) * step(.25, vn(vec2(hc * 5.1, vW.y * 2.))) * face * smoothstep(1.8, 3.2, vW.y);
  alb = mix(alb, vec3(.20, .30, .10) * (.6 + .9 * vn(vec2(hc * 3.7, vW.y * 3.1))), gm * .8);
  // the pavement: clints and grikes, red soil in the cracks
  vec2 cp = vW.xz * .42 + vec2(vn(vW.xz * .2) * 1.4, vn(vW.xz * .2 + 31.) * 1.4);
  float cr = min(abs(fract(cp.x + .3 * sin(cp.y * 1.7)) - .5), abs(fract(cp.y * .62 + .25 * sin(cp.x * 1.3)) - .5));
  float fine = abs(vn(vW.xz * 2.6) - .5);
  float crack = (1. - smoothstep(.02, .075, cr)) * .9 + (1. - smoothstep(.01, .05, fine)) * .45 * near;
  crack = clamp(crack, 0., 1.) * top;
  alb = mix(alb, uSoil * (.5 + .8 * vn(vW.xz * 3.)), crack * .78);
  alb *= 1. + (vn(vW.xz * 11.) - .5) * .16 * near;
  // the tide mark: dark wet rock and a black-green band at the water's edge
  float wetK = 1. - smoothstep(.15, 1.1 + .5 * vn(vW.xz * .7), vW.y);
  alb = mix(alb, alb * vec3(.60, .66, .54), wetK * .85);
  // the swell creaming on the rock: a white line that climbs and drains with each surge, lace above it
  float sg = .5 + .5 * sin(uTime * .9 + vW.x * .07 + vW.z * .05), fl = fbm(vec2(hc * 1.7 + uTime * .2, vW.y * 3. - uTime * .5));
  float foamR = (1. - smoothstep(.03 + .16 * sg, .10 + .30 * sg, vW.y + (fl - .5) * .35)) * smoothstep(-.14, -.02, vW.y);
  foamR *= .45 + .55 * smoothstep(.36, .62, fbm(vec2(hc * 2.3 - uTime * .3, vW.y * 5. + vW.x * .9)));      // ragged, never an even white band
  foamR *= .18 + .82 * smoothstep(.34, .62, vn(vec2(hc * .21 - uTime * .10, 3.)));      // polish3: it comes and goes along the foot (a stiff white outline round every rock)
  foamR *= mix(1., .9 * smoothstep(.50, .72, fbm(vW.xz * 1.1 + vec2(uTime * .16, -uTime * .12))) * (1. - smoothstep(.10, .30, vW.y)), top);      // a platform awash carries lace, not a white sheet
  float sh = 1. - vRk.y * .97;
  // bed lips catch the sun, their undersides hold shade
  float lip = smoothstep(.80, 1., f) * face * near;
  vec3 col = litAbove(alb, N, sh) * (1. + .16 * lip - .22 * joint * face);
  // in the shade a wall is not flat blue: warm light comes back off the sunlit wall opposite, and the water throws a moving net up it
  vec2 wq = vec2(hc * .45 + uTime * .13, vW.y * .7 - uTime * .22);
  float wl = (1. - smoothstep(0., .10, abs(vn(wq + vn(wq * 1.7 + 4.) * .9) - .5))) * (1. - smoothstep(.3, 6., vW.y)) * face;
  col += alb * (vec3(.26, .22, .17) * vRk.y * face * (.75 + .5 * rough.x) + vec3(.20, .25, .24) * wl * (.25 + .75 * vRk.y));
  col = mix(col, mix(vec3(1.15, 1.13, 1.06), vec3(.42, .52, .66), vRk.y * .85) * (.8 + .4 * fl), foamR * .9);
  col = mix(col, seaTint(col * 1.5 + alb * vec3(.10, .12, .11), -vW.y, vW), smoothstep(0., .3, -vW.y));      // the foot of the rock, seen through the water
  // a metre down the rock is buried in the same sand as the sea floor, lit and tinted the same way, so that where the two coarse
  // meshes cut each other nothing shows (it showed as dark shards in the water round the skerry)
  float rip = 0.; vec3 sa = uSand * (.84 + .08 * (fbm(vW.xz * .35 + 3.) - .5));      // plain sand: with the turf pattern a steep buried face could come out as a dark blade
  float cau = caustic(vW.xz, uTime) * 1.25;
  vec3 Ls = uSunCol * (1. - vRk.y * .22) * uSunRefr.y * (1. + .2 * rip) * (.90 + .62 * cau) + uSkyCol * uShade;      // (lit like the floor beside it: with the rock's own shade its buried skirt drew a dark line along the foot)
  // under water the rock takes the look of the sea floor round its foot (sand seen through about 3 m of water), whatever its own
  // depth and slope: so the thin steep cells where the rock mesh dives under the floor mesh vanish into the floor instead of showing
  // as dark blades or pale slabs under the foam line
  float dEff = .9 + 1.05 * clamp(-vW.y, 0., 12.);      // polish3: the foot deepens as it goes down (at one fixed depth it lay under the water as a pale pane with a ruled edge)
  col = mix(col, seaTint(sa * Ls, dEff, vW), smoothstep(.0, .10, -vW.y));
  gl_FragColor = vec4(col, 1.);
  #include <fog_fragment>
}`,
    });
    // a height-field patch over a list of columns and rows; pos(i, j) -> [x, z]; cells below the sea are skipped
    const rockPatch = async (ni, nj, posOf, hOf, bedOf, skip = null, shK = 1) => {
      const P = new Float32Array(ni * nj * 3), R = new Float32Array(ni * nj * 2), B = new Uint8Array(ni * nj), idx = [];
      for (let j = 0; j < nj; j++) {
        for (let i = 0; i < ni; i++) {
          // polish3: the rock goes down INTO the sand (it stopped in a flat skirt 4.2 m down, which hung over the channel as a pale pane)
          const k = j * ni + i, [x, z] = posOf(i, j), fl = floorH(x, z), h0 = hOf(x, z), h = Math.max(h0, fl - 1.2, -13.5);
          P[k * 3] = x; P[k * 3 + 1] = h; P[k * 3 + 2] = z; R[k * 2] = h + bedOf(x, z) + 40; B[k] = h0 > fl - 0.15 ? 1 : 0;
          R[k * 2 + 1] = B[k] ? shK * shadeAt(x, Math.max(h, 0) + 0.35, z) : 0;
        }
        if (j % 3 === 2) await ctx.yield();
      }
      for (let j = 0; j < nj - 1; j++) for (let i = 0; i < ni - 1; i++) {
        const a = j * ni + i, b = a + 1, c = a + ni, d = c + 1;
        if (!(B[a] || B[b] || B[c] || B[d])) continue;      // wholly under the sand
        if (skip && skip(P[a * 3], P[a * 3 + 2])) continue;
        idx.push(a, c, b, b, c, d);
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(P, 3)); g.setAttribute('aRk', new THREE.BufferAttribute(R, 2));
      g.setIndex(idx); g.computeVertexNormals(); g.computeBoundingSphere();
      return g;
    };
    {
      const ix = [], jz = [];
      for (let x = -52; x < -30; x += 2.75) ix.push(x);
      for (let x = -30; x < 64; x += 1.25) ix.push(x);
      for (let x = 64; x <= 196; x += 2.75) ix.push(x);
      for (let z = -44; z < -12; z += 2.9) jz.push(z);
      for (let z = -12; z < 74; z += 1.25) jz.push(z);
      for (let z = 74; z <= 132; z += 2.9) jz.push(z);
      // (polish1: the broken foot of the island right of our way out is left out: from the new first frames it showed as dark slabs in the corner)
      const g = await rockPatch(ix.length, jz.length, (i, j) => [ix[i], jz[j]], h1, bed1, (x, z) => x < 3 && z > 31.5);
      scene.add(new THREE.Mesh(g, rockMat));
      await ctx.yield();
    }
    {
      // second island: a patch sheared along the cleft, then the two cleft walls as bedded ribbons
      const ia = [], jb = [];
      for (let a = -22; a < 40; a += 1.4) ia.push(a);
      for (let a = 40; a < 112; a += 2.2) ia.push(a);
      for (let a = 112; a <= 176; a += 4.5) ia.push(a);
      for (let b = -103; b < -64; b += 2.75) jb.push(b);
      for (let b = -64; b < -18; b += 1.45) jb.push(b);        // out past the island's right-hand shore everywhere (a cut edge here left a strip of its top hanging in the air)
      for (let b = -18; b < 18; b += 1.2) jb.push(b);
      for (let b = 18; b < 60; b += 1.45) jb.push(b);
      for (let b = 60; b <= 150; b += 2.75) jb.push(b);
      const toXZ = (a, b) => [C0[0] + a * EC[0] + b * EC[1], C0[1] + a * EC[1] - b * EC[0]];
      const g = await rockPatch(jb.length, ia.length, (i, j) => toXZ(ia[j], jb[i] + cleftB(ia[j])), h2, bed2);
      scene.add(new THREE.Mesh(g, rockMat));
      await ctx.yield();
      const T = 1.61, NB = 13, rowsPerBed = 3, NR = NB * rowsPerBed + 1, NA = 88, hsh = (k, s) => { const v = Math.sin(k * 127.1 + s * 311.7) * 43758.5453; return v - Math.floor(v); };
      const feet = [[], []];
      for (const side of [1, -1]) {
        const P = new Float32Array(NA * NR * 3), R = new Float32Array(NA * NR * 2), idx = [];
        for (let i = 0; i < NA; i++) {
          const a = -9 + i * 1.5, bc = cleftB(a), w = 10.5 + 0.8 * noise.n2(a * 0.07, side * 5.3) + 3 * smoothstep(-8, 4, -a); let colTop = -3;
          for (let r = 0; r < NR; r++) {
            const k = r * 3 + i, cap = r === NR - 1;
            const bedI = Math.min(NB - 1, Math.floor(r / rowsPerBed)), fr = (r % rowsPerBed) / (rowsPerBed - 1);
            let y = -3 + (bedI + 0.02 + 0.96 * fr) * T + 0.25 * noise.n2(a * 0.03, bedI * 3.1);
            const kb = bedI + Math.floor(a / 23 + hsh(bedI, 9) * 3) * 17;                  // beds step in and out, in runs along the wall
            let off = hsh(kb, side) * 1.2 + Math.max(0, y) * 0.065 + 0.35 * noise.n2(a * 0.16, y * 0.3 + side * 7) + 0.22 * fr * (hsh(kb, 4) - 0.3);
            // polish2: the walls are not ruled planes: alcoves 6 to 12 m wide open in them from foot to rim, with buttresses between
            // that catch the light, and single beds break back in shorter bites
            off += 2.4 * smoothstep(0.12, 0.55, noise.n2(a * 0.075 + side * 13.7, 4.2)) + 0.9 * Math.max(0, noise.n2(a * 0.23 + 5, side * 3.1 + bedI * 0.37));
            let b = bc + side * (w + off);
            let [x, z] = toXZ(a, b);
            const top = terrace(env2top(x, z) + bed2(x, z) + 40, 1.9) - 40 - bed2(x, z);
            if (cap) {      // the cap reaches back onto the plateau only as far as the plateau is there (polish2: it hung down to the sea in big slanted sheets at the mouth)
              let done = false;
              for (const co of [11, 7.5, 4.5, 2.2]) { b = bc + side * (w + off + co); [x, z] = toXZ(a, b); y = Math.max(-1.6, h2(x, z) + 0.05); if (y >= colTop - 1.6) { done = true; break; } }
              if (!done) { b = bc + side * (w + off + 0.9); [x, z] = toXZ(a, b); y = colTop - 0.35; }
            } else { y = Math.min(y, Math.max(top, -3)); colTop = y; }
            if (r === 5) feet[side > 0 ? 0 : 1].push(a, b);
            const o = (i * NR + r) * 3; P[o] = x; P[o + 1] = y; P[o + 2] = z;
            R[(i * NR + r) * 2] = y + bed2(x, z) + 40; R[(i * NR + r) * 2 + 1] = shadeAt(x - side * EC[1] * 0.5, y + 0.3, z + side * EC[0] * 0.5);
          }
          if (i % 6 === 5) await ctx.yield();
        }
        // ledges where a bed steps back: ferns will root there
        for (let i = 4; i < NA - 14; i += 2) for (let r = 2; r < NR - 2; r += 3) {
          const o = (i * NR + r) * 3, q = o + 3, w = Math.hypot(P[q] - P[o], P[q + 2] - P[o + 2]);
          if (w > 0.45 && P[o + 1] > 1.6 && P[o + 1] < 15) ledgePts.push([(P[o] + P[q]) * 0.5, P[o + 1] + 0.02, (P[o + 2] + P[q + 2]) * 0.5]);
        }
        for (let i = 0; i < NA - 1; i++) for (let r = 0; r < NR - 1; r++) {
          const a = i * NR + r, b = a + 1, c = a + NR, d = c + 1;
          if (Math.min(P[(i * NR + NR - 2) * 3 + 1], P[((i + 1) * NR + NR - 2) * 3 + 1]) < 3) continue;      // no wall where the island has not yet risen (it stood in shards off the mouth)
          if (side > 0) idx.push(a, c, b, b, c, d); else idx.push(a, b, c, b, d, c);
        }
        const wg = new THREE.BufferGeometry();
        wg.setAttribute('position', new THREE.BufferAttribute(P, 3)); wg.setAttribute('aRk', new THREE.BufferAttribute(R, 2));
        wg.setIndex(idx); wg.computeVertexNormals(); wg.computeBoundingSphere();
        scene.add(new THREE.Mesh(wg, rockMat));
        await ctx.yield();
      }
      // the swell surging white along the feet of the cleft walls: two scrolling foam strips
      {
        const P = [], A = [], idx = []; let n = 0;
        for (let sd = 0; sd < 2; sd++) {
          const side = sd ? -1 : 1, F = feet[sd], m = F.length / 2;
          for (let i = 0; i < m; i++) {
            const a = F[i * 2], b = F[i * 2 + 1];
            for (let c = 0; c < 2; c++) {
              const [x, z] = toXZ(a, b + side * (c ? -3.4 : 0.7));
              P.push(x, 0.05, z); A.push(c, a, shadeAt(x, 0.3, z), sd);
            }
            if (i < m - 1) { const k = n + i * 2; if (sd) idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); else idx.push(k, k + 2, k + 1, k + 1, k + 2, k + 3); }
          }
          n += m * 2;
        }
        const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); sg.setAttribute('aF', new THREE.Float32BufferAttribute(A, 4)); sg.setIndex(idx);
        const surfMat = new THREE.ShaderMaterial({
          fog: true, transparent: true, depthWrite: false, side: THREE.DoubleSide, uniforms: { ...fogU(), uTime: LU.uTime },
          vertexShader: /* glsl */`attribute vec4 aF; varying vec4 vF; varying vec3 vW;
#include <fog_pars_vertex>
void main(){ vF = aF; vec4 wp = modelMatrix * vec4(position, 1.); vW = wp.xyz; vec4 mvPosition = viewMatrix * wp; gl_Position = projectionMatrix * mvPosition;
#include <fog_vertex>
}`,
          fragmentShader: /* glsl */`uniform float uTime; varying vec4 vF; varying vec3 vW;
#include <fog_pars_fragment>
${NOISE_GLSL}
void main(){
  float c = vF.x, a = vF.y;
  // each surge runs along the wall, climbs out from its foot and drains back in lace
  // polish2: a ragged white edge 0.3 to 1.5 m wide that breathes with the swell, and threads of foam drawn out along the wall
  // beyond it (it was a 3 m shelf of white)
  float d = c * 4.1 - .7;
  float surge = .5 + .5 * sin(uTime * 1.05 - a * .13 + vF.w * 2.1), reach = .30 + 1.2 * surge * surge;
  float lace = fbm(vW.xz * 2.6 + vec2(uTime * .25, -uTime * .2)), fine = vn(vW.xz * 9. - uTime * .6);
  float body = 1. - smoothstep(reach * .25, reach, d + (lace - .5) * 1.1);
  float th = 1. - smoothstep(0., .075, abs(vn(vec2(a * .55 - uTime * .35, d * 1.9 + lace * 1.2)) - .5));
  float trail = th * (1. - smoothstep(.8, 3.2, d)) * .5;
  float al = clamp(body * (.6 + .4 * fine) + trail * (.45 + .55 * fine), 0., 1.) * (1. - smoothstep(.85, 1., c));
  if (al < .01) discard;
  vec3 col = mix(vec3(1.2, 1.18, 1.1), vec3(.40, .52, .68), vF.z * .92) * (.85 + .25 * fine);
  gl_FragColor = vec4(col, al * .92);
  #include <fog_fragment>
}`,
        });
        const surf = new THREE.Mesh(sg, surfMat); surf.renderOrder = 7; surf.frustumCulled = false; scene.add(surf);
      }
    }
    {   // the skerry (polish2)
      // polish3: columns run ACROSS it and rows along, so that the faces wind upward like every other patch (it was wound inside out:
      // the top was culled and we looked into the far wall from behind, the 'black wedge with a cut-off edge')
      const ni = 25, nj = 49;
      const g = await rockPatch(ni, nj, (i, j) => { const ls = -24 + j, lt = -11.4 + i * 0.95; return [SK.x + ls * SK.sn + lt * SK.cs, SK.z + ls * SK.cs - lt * SK.sn]; }, h3, bed3, null, 0.3);
      scene.add(new THREE.Mesh(g, rockMat));
      await ctx.yield();
    }
    // ------------------------------------------------------------------ the mainland: dead flat red desert, no green
    {
      // a wet mud flat at the water's edge, a first line of dunes 20 m high a hundred metres inland, higher ridges behind: land with a
      // face to the sun, not a strip. Ahead the coast falls away to the right, so the forward horizon is open sea.
      // polish3: the coast is LAND: a pale beach, then red mudstone bluffs 10 to 24 m high cut by gullies and broken by bays,
      // dune fields behind them and great dunes inland. The mesh is fine enough (10 m along the shore) to carry the bluffs.
      const ds = [2300, 1600, 1150, 820, 600, 450, 350, 280, 230, 190, 160, 135, 112, 92, 76, 62, 50, 41, 34, 28, 23, 18, 13, 8, 4, 0], zs2 = [];   // x ascending, as the winding wants
      for (let z = -1100; z < -160; z += 40) zs2.push(z);
      for (let z = -160; z < 900; z += 10) zs2.push(z);
      for (let z = 900; z <= 2140; z += 40) zs2.push(z);
      const coastX = (z) => -288 - 0.0011 * Math.pow(Math.max(0, z - 860), 2) - 0.0011 * Math.pow(Math.max(0, -360 - z), 2) + 16 * noise.n2(z * 0.0042 + 31, 5.5);      // bays and low points
      const n = ds.length, m = zs2.length, P = new Float32Array(n * m * 3), idx = [];
      for (let j = 0; j < m; j++) {
        for (let i = 0; i < n; i++) {
          const z = zs2[j], d = ds[i] + (ds[i] > 60 ? noise.n2(z * 0.004, i * 3.7) * 6 : 0), x = coastX(z) - d;
          const r1 = 0.5 + 0.5 * noise.n2(z * 0.0065 + 1.3, d * 0.004), r2 = Math.abs(noise.n2(z * 0.0031 + 7, d * 0.0052 + 3));
          const dune = 30 * smoothstep(52, 118, d) * (1 - 0.72 * smoothstep(150, 235, d)) * (0.45 + 0.55 * r1)            // the first dune line
            + 62 * smoothstep(250, 520, d) * (0.35 + 0.65 * r2) + (40 + 130 * Math.pow(1 - Math.abs(noise.n2(z * 0.0017 + 5, d * 0.0008)), 2.2)) * smoothstep(650, 1500, d) * (1 - 0.35 * smoothstep(1700, 2300, d))
            + 2.2 * Math.abs(noise.n2(z * 0.03, d * 0.03)) * smoothstep(30, 90, d);
          // the bluffs: a scarp that stands where the noise says, its foot notched by gullies that run back into it
          const bl = smoothstep(-0.25, 0.2, noise.n2(z * 0.0036 + 9, 1.7)), gul = Math.pow(Math.abs(noise.n2(z * 0.021, 3.3 + d * 0.004)), 0.7);
          const hb = (10 + 14 * (0.5 + 0.5 * noise.n2(z * 0.009 + 4, 8.8))) * bl;
          const bluff = hb * smoothstep(15, 31, d - 15 * (1 - gul)) * (0.72 + 0.28 * gul) * (1 - 0.55 * smoothstep(70, 240, d));
          const k = (j * n + i) * 3; P[k] = x; P[k + 1] = -0.7 + 2.3 * smoothstep(0, 22, d) + bluff + dune; P[k + 2] = z;
        }
        if (j % 12 === 11) await ctx.yield();
      }
      for (let j = 0; j < m - 1; j++) for (let i = 0; i < n - 1; i++) { const a = j * n + i, b = a + 1, c = a + n, d = c + 1; idx.push(a, c, b, b, c, d); }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(P, 3)); g.setIndex(idx); g.computeVertexNormals(); g.computeBoundingSphere();
      await ctx.yield();
      const desertMat = new THREE.ShaderMaterial({
        fog: true, uniforms: { ...fogU(), ...LU, uRed: { value: col(PALETTE[0], 0.98) }, uPaleRed: { value: col('#CC7B4E', 0.92) }, uBeach: { value: col('#E3C6A0', 0.80) }, uHaze: { value: col('#E2A77E', 0.95) } },
        vertexShader: /* glsl */`varying vec3 vW, vN;
#include <fog_pars_vertex>
void main(){ vec4 wp = modelMatrix * vec4(position, 1.); vW = wp.xyz; vN = normal; vec4 mvPosition = viewMatrix * wp; gl_Position = projectionMatrix * mvPosition;
#include <fog_vertex>
}`,
        fragmentShader: /* glsl */`
uniform vec3 uRed, uPaleRed, uBeach, uHaze; uniform float uTime;
varying vec3 vW, vN;
#include <fog_pars_fragment>
${NOISE_GLSL}
${LIGHT_GLSL}
void main(){
  vec3 N = normalize(vN + vec3(0., 1e-4, 0.));
  float steep = 1. - smoothstep(.70, .96, N.y);
  // broad colour only (nothing finer than the pixel at 300 m): pale pans, deeper red faces, darker hollows
  float big = fbm(vec2(vW.x * .006, vW.z * .009) + 2.), mid = fbm(vec2(vW.x * .021 + vW.z * .006, vW.z * .027));
  vec3 alb = mix(uRed, uPaleRed, smoothstep(.35, .7, big) * .65) * (.80 + .40 * mid);
  // the bluff faces: thick beds of red mudstone, a few paler ones, weathering into ribs (broad soft bands warped by the rock itself)
  float bedq = vW.y * .16 + (fbm(vec2(vW.z * .012, vW.x * .012)) - .5) * 1.6, bed = smoothstep(.25, .75, abs(fract(bedq) - .5) * 2.);
  vec3 face = mix(uRed * vec3(.78, .66, .66), uRed * vec3(1.08, .98, .90), bed);
  face = mix(face, uPaleRed * vec3(1.0, 1.02, .98), smoothstep(.70, .86, vn(vec2(floor(bedq) * 7.3, vW.z * .004))) * .55);
  float rib = vn(vec2(vW.z * .16, vW.y * .03 + 4.));
  face *= .74 + .5 * rib;
  alb = mix(alb, face, steep);
  // the beach: pale shell sand above the tide, dark wet mud at the water's edge
  float beach = (1. - smoothstep(1.4, 3.4, vW.y + (mid - .5) * 1.6)) * (1. - steep);
  alb = mix(alb, uBeach * (.9 + .2 * mid), beach);
  alb = mix(alb, uRed * vec3(.50, .46, .50), (1. - smoothstep(.15, .7, vW.y)) * .85);
  N = normalize(N + vec3(mid - .5, 0., vn(vW.xz * .03 + 9.) - .5) * .30);
  // front light flattens land, so the form is drawn by what the sky cannot reach: gullies, the feet of faces, the lee of crests
  float occ = 1. - .42 * steep * (1. - rib) - .20 * (1. - smoothstep(.30, .60, mid)) * (1. - beach);
  float cs = smoothstep(.50, .70, fbm(vW.xz * .0058 + vec2(uTime * .0035, uTime * .0022) + 3.7));
  vec3 c = litAbove(alb, N, 1. - .62 * cs) * occ;
  // the swell breaking on the beach: a ragged white line that runs up and drains
  float run = .12 + .22 * (.5 + .5 * sin(uTime * .8 + vW.z * .05));
  float surf = (1. - smoothstep(run * .4, run, abs(vW.y - .02) + (vn(vec2(vW.z * .21, uTime * .3)) - .5) * .25)) * (.55 + .45 * vn(vec2(vW.z * .6 + uTime * .2, 3.)));
  c = mix(c, vec3(1.05, 1.03, .98), clamp(surf, 0., 1.) * .8);
  // the far dunes stand in the desert's own warm dust, not in the sea's pale haze (fogged white they read as snow peaks)
  float fd = fogDensity * max(vFogDepth, 0.), ff = 1. - exp(-fd * fd);
  gl_FragColor = vec4(mix(c, mix(fogColor, uHaze, .62), ff * .9), 1.);
}`,
      });
      scene.add(new THREE.Mesh(g, desertMat));
      await ctx.yield();
    }
    // weathered limestone boulders on the pavement; the first is the boss the gliders crouch on
    const bossAt = (b, dx, dy, dz, out) => {
      const l = Math.hypot(dx, dy, dz) || 1, x = dx / l, y = dy / l, z = dz / l;
      const m = 1 + 0.2 * noise.n3(x * 1.6 + b[6], y * 1.6, z * 1.6) + 0.07 * noise.n3(x * 4.1, y * 4.1 + b[6], z * 4.1);
      return out.set(b[0] + x * b[3] * m, Math.max(b[1] + y * b[4] * m, b[1] - b[4] * 0.45), b[2] + z * b[5] * m);
    };
    const BOULDERS = [[-3.9, 0, 7.6, 2.0, 1.45, 1.7, 3.1], [4.8, 0, 13.5, 1.2, 0.9, 1.4, 9.2], [-9.5, 0, 14.5, 1.6, 1.1, 1.3, 5.5], [9.5, 0, 5.5, 1.1, 0.8, 1.0, 1.7], [-1.8, 0, 18.5, 0.8, 0.6, 1.0, 7.7], [1.6, 0, 22, 1.0, 0.7, 0.9, 4.4], [-14, 0, 6, 1.5, 1.1, 1.8, 6.1]];
    {
      const P = [], R = [], idx = [], NI = 10, NJ = 16, v = new THREE.Vector3(); let base = 0;
      for (const b of BOULDERS) {
        b[1] = h1(b[0], b[2]) + b[4] * 0.42;
        for (let i = 0; i <= NI; i++) for (let j = 0; j <= NJ; j++) {
          const th = (i / NI) * Math.PI, ph = (j / NJ) * Math.PI * 2;
          bossAt(b, Math.sin(th) * Math.cos(ph), Math.cos(th), Math.sin(th) * Math.sin(ph), v);
          P.push(v.x, v.y, v.z); R.push(v.y + bed1(v.x, v.z) + 40, 0);
        }
        for (let i = 0; i < NI; i++) for (let j = 0; j < NJ; j++) { const a = base + i * (NJ + 1) + j, c = a + NJ + 1; idx.push(a, a + 1, c, a + 1, c + 1, c); }
        base += (NI + 1) * (NJ + 1);
      }
      const bg = new THREE.BufferGeometry(); bg.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); bg.setAttribute('aRk', new THREE.Float32BufferAttribute(R, 2));
      bg.setIndex(idx); bg.computeVertexNormals(); bg.computeBoundingSphere();
      scene.add(new THREE.Mesh(bg, rockMat));
    }
    //@@ISLANDS
    // ------------------------------------------------------------------ plants: conifers, bennettites, ferns, horsetails
    // one merged mesh, one material. aPl = (u along, v across, kind, sway): kind 0 bark, 1 scale-leaved cord, 2 frond, 3 scarred barrel, 4 jointed rod
    const newBuf = () => ({ pos: [], col: [], pl: [], idx: [], n: 0 });
    let FL = newBuf();
    const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _c = new THREE.Vector3(), _t = new THREE.Vector3();
    // a tube along points [[x,y,z,r], ...]; colours c0 -> c1 along it; sway s0 -> s1
    const tube = (pts, sides, c0, c1, kind, s0, s1, vScale = 1) => {
      const base = FL.n, n = pts.length;
      let run = 0;
      for (let i = 0; i < n; i++) {
        const p = pts[i], q = pts[Math.min(n - 1, i + 1)], o = pts[Math.max(0, i - 1)];
        _t.set(q[0] - o[0], q[1] - o[1], q[2] - o[2]).normalize();
        _a.set(0, 1, 0); if (Math.abs(_t.y) > 0.92) _a.set(1, 0, 0);
        _b.crossVectors(_t, _a).normalize(); _c.crossVectors(_b, _t);
        if (i > 0) run += Math.hypot(p[0] - o[0], p[1] - o[1], p[2] - o[2]);
        const f = i / (n - 1);
        for (let j = 0; j < sides; j++) {
          const an = (j / sides) * Math.PI * 2, cs = Math.cos(an) * p[3], sn = Math.sin(an) * p[3];
          FL.pos.push(p[0] + _b.x * cs + _c.x * sn, p[1] + _b.y * cs + _c.y * sn, p[2] + _b.z * cs + _c.z * sn);
          const sh = 0.82 + 0.18 * Math.sin(an) ;
          FL.col.push(lerp(c0.r, c1.r, f) * sh, lerp(c0.g, c1.g, f) * sh, lerp(c0.b, c1.b, f) * sh);
          FL.pl.push(run * vScale, j / sides, kind, lerp(s0, s1, f));
        }
        FL.n += sides;
      }
      for (let i = 0; i < n - 1; i++) for (let j = 0; j < sides; j++) {
        const a = base + i * sides + j, b = base + i * sides + (j + 1) % sides, c = a + sides, d = b + sides;
        FL.idx.push(a, c, b, b, c, d);
      }
    };
    // a flat ribbon (two-sided by material) along points [[x,y,z], ...] with half-width w(f), lying across `side`
    const ribbon = (pts, wOf, side, c0, c1, kind, s0, s1) => {
      const base = FL.n, n = pts.length;
      for (let i = 0; i < n; i++) {
        const p = pts[i], f = i / (n - 1), w = wOf(f);
        for (const e of [-1, 1]) {
          FL.pos.push(p[0] + side.x * w * e, p[1] + side.y * w * e, p[2] + side.z * w * e);
          FL.col.push(lerp(c0.r, c1.r, f), lerp(c0.g, c1.g, f), lerp(c0.b, c1.b, f));
          FL.pl.push(f, e, kind, lerp(s0, s1, f));
        }
        FL.n += 2;
      }
      for (let i = 0; i < n - 1; i++) { const a = base + i * 2; FL.idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
    };
    const fr = rng.fork('flora');
    const cBark = col('#6B5646', 0.8), cBarkD = col('#4A3B30', 0.8), cCord = col('#3F5A45', 0.9), cCordL = col('#5E7A4E', 0.9), cCordD = col('#26382C', 0.9);
    // scale-leaved conifer: straight trunk, whorls of drooping boughs clothed in cord-like green twigs
    const conifer = (x, y, z, H, rich) => {
      const lean = fr.range(-0.03, 0.03), lean2 = fr.range(-0.03, 0.03), r0 = H * 0.022 + 0.05;
      const tp = []; for (let i = 0; i <= 6; i++) { const f = i / 6; tp.push([x + lean * H * f * f, y - 0.3 + (H + 0.3) * f, z + lean2 * H * f * f, r0 * (1 - 0.86 * f) + 0.012]); }
      tube(tp, rich ? 7 : 5, cBarkD, cBark, 0, 0, 0.25, 1);
      const whorls = rich ? 9 : 6, per = rich ? 6 : 5;
      for (let w = 0; w < whorls; w++) {
        const f = (w + fr.range(0.1, 0.5)) / whorls, hy = lerp(0.24, 0.97, f) * H, len = lerp(0.36, 0.07, Math.pow(f, 1.3)) * H * fr.range(0.85, 1.1), a0 = fr() * 6.28;
        for (let k = 0; k < per; k++) {
          const an = a0 + (k / per) * 6.28 + fr.range(-0.2, 0.2), dx = Math.cos(an), dz = Math.sin(an), L = len * fr.range(0.8, 1.1);
          const bx = x + lean * H * f * f, bz = z + lean2 * H * f * f, by = y + hy, bp = [];
          const droop = lerp(0.55, 0.18, f) * L, N = rich ? 5 : 3;
          for (let i = 0; i <= N; i++) { const g = i / N; bp.push([bx + dx * L * g, by + L * 0.16 * Math.sin(g * 2.2) - droop * g * g, bz + dz * L * g, lerp(0.085, 0.03, g) * (0.7 + 0.3 * H / 8)]); }
          tube(bp, rich ? 5 : 4, cCordD, cCord, 1, 0.25 + 0.2 * f, 0.9, 3);
          // cords hanging from the bough
          const cords = rich ? 5 : 3;
          for (let q = 0; q < cords; q++) {
            const g = (q + 0.7) / (cords + 0.4), i0 = Math.min(N - 1, Math.floor(g * N)), t0 = g * N - i0, A = bp[i0], B = bp[i0 + 1];
            const px = lerp(A[0], B[0], t0), py = lerp(A[1], B[1], t0), pz = lerp(A[2], B[2], t0), sd = q % 2 ? 1 : -1;
            const cl = L * fr.range(0.26, 0.42) * (1 - 0.35 * g), ox = -dz * sd * cl * 0.55 + dx * cl * 0.25, oz = dx * sd * cl * 0.55 + dz * cl * 0.25;
            tube([[px, py, pz, 0.05], [px + ox * 0.6, py - cl * 0.25, pz + oz * 0.6, 0.042], [px + ox, py - cl * 0.85, pz + oz, 0.016]], 3, cCord, cCordL, 1, 0.6, 1.0, 3);
          }
        }
      }
      // the leading shoot
      tube([[x + lean * H, y + H - 0.2, z + lean2 * H, 0.06], [x + lean * H, y + H + 0.5, z + lean2 * H, 0.015]], 4, cCord, cCordL, 1, 0.5, 0.9, 3);
    };
    const cFr = col('#4F6B3A', 0.9), cFrL = col('#7E9550', 0.9), cFrD = col('#2F4428', 0.9), cScar = col('#7A6248', 0.8), cScarD = col('#3E3226', 0.8);
    // bennettite: a barrel trunk armoured in diamond leaf scars, a crown of stiff feather fronds
    const bennettite = (x, y, z, s) => {
      const hgt = fr.range(0.8, 1.2) * s, r = fr.range(0.26, 0.36) * s, tp = [];
      for (let i = 0; i <= 5; i++) { const f = i / 5; tp.push([x, y - 0.15 + (hgt + 0.15) * f, z, r * (0.82 + 0.3 * Math.sin(f * 2.6)) * (f > 0.9 ? 0.7 : 1)]); }
      tube(tp, 8, cScarD, cScar, 3, 0, 0, 1 / (r * 6.28));
      const nf = Math.round(fr.range(11, 15)), a0 = fr() * 6.28;
      for (let k = 0; k < nf; k++) {
        const an = a0 + k * 2.399, up = fr.range(0.35, 1.15), L = fr.range(1.2, 1.6) * s, dx = Math.cos(an), dz = Math.sin(an), pts = [];
        for (let i = 0; i <= 4; i++) { const g = i / 4, rr = L * g * Math.cos(up) , yy = L * g * Math.sin(up) - 0.42 * L * g * g * (1.25 - up); pts.push([x + dx * (0.06 + rr), y + hgt - 0.05 + yy, z + dz * (0.06 + rr)]); }
        _a.set(-dz, 0.12 * (k % 2 ? 1 : -1), dx);
        ribbon(pts, (f) => (0.02 + 0.15 * Math.pow(Math.sin(Math.PI * Math.pow(f, 0.65)), 0.7)) * s, _a, cFrD, k % 3 ? cFr : cFrL, 2, 0.1, 0.8);
      }
    };
    const fernTuft = (x, y, z, s) => {
      const nf = 5 + Math.floor(fr() * 3), a0 = fr() * 6.28;
      for (let k = 0; k < nf; k++) {
        const an = a0 + k * 2.399 + fr.range(-0.3, 0.3), L = fr.range(0.35, 0.6) * s, dx = Math.cos(an), dz = Math.sin(an);
        const pts = [[x, y - 0.03, z], [x + dx * L * 0.45, y + L * 0.62, z + dz * L * 0.45], [x + dx * L * 0.95, y + L * 0.5, z + dz * L * 0.95]];
        _a.set(-dz, 0, dx);
        ribbon(pts, (f) => (0.02 + 0.10 * Math.sin(Math.PI * Math.min(1, f * 1.15 + 0.08))) * s, _a, cFrD, k % 2 ? cFr : cFrL, 2, 0.15, 1.0);
      }
    };
    const horsetail = (x, y, z, hgt) => {
      const lx = fr.range(-0.08, 0.08), lz = fr.range(-0.08, 0.08);
      tube([[x, y - 0.05, z, 0.03], [x + lx * 0.4, y + hgt * 0.5, z + lz * 0.4, 0.027], [x + lx, y + hgt, z + lz, 0.012]], 4, cFrD, cFrL, 4, 0, 1.0, 1);
    };
    // where plants may stand: on a pavement (a gentle top), clear of our line
    const slopeOK = (hf, x, z) => Math.abs(hf(x + 0.9, z) - hf(x - 0.9, z)) + Math.abs(hf(x, z + 0.9) - hf(x, z - 0.9)) < 1.5;
    const clearOf = (x, y, z, r) => path.distanceTo(x, y, z) > r;
    // six conifers frame the entry
    for (const [x, z, H] of [[10.5, 2.5, 10.5], [-11, 3, 10], [12.5, 20, 9], [-25, 13, 9], [17, 8, 9.5], [-28, 4, 8]]) { conifer(x, h1(x, z), z, H, true); await ctx.yield(); }
    let placed = 0;
    for (let i = 0; i < 400 && placed < 22; i++) {
      const x = fr.range(-30, 170), z = fr.range(-8, 100), y = h1(x, z), H = fr.range(6.5, 9);
      if (y < 5 || !slopeOK(h1, x, z) || !clearOf(x, y + H * 0.6, z, 11) || (Math.abs(x) < 22 && z < 30)) continue;
      conifer(x, y, z, H, false); placed++;
      if (placed % 6 === 0) await ctx.yield();
    }
    placed = 0;
    for (let i = 0; i < 400 && placed < 9; i++) {
      const x = fr.range(-20, 150), z = fr.range(330 + DZ, 480 + DZ), y = h2(x, z), H = fr.range(6, 8.5);
      if (y < 11 || !slopeOK(h2, x, z) || !clearOf(x, y + H * 0.5, z, 16)) continue;
      conifer(x, y, z, H, false); placed++;
    }
    await ctx.yield();
    placed = 0;
    for (let i = 0; i < 900 && placed < 60; i++) {
      const second = placed >= 42, near = placed < 16;
      const x = second ? fr.range(-20, 130) : near ? fr.range(-16, 16) : fr.range(-30, 150), z = second ? fr.range(330 + DZ, 470 + DZ) : near ? fr.range(5, 26) : fr.range(-6, 95);
      const hf = second ? h2 : h1, y = hf(x, z);
      if (y < (second ? 10 : 4) || !slopeOK(hf, x, z) || !clearOf(x, y + 1, z, second ? 15 : 4.5)) continue;
      bennettite(x, y, z, fr.range(0.85, 1.2)); placed++;
    }
    await ctx.yield();
    const nFern = Math.round(400 * detail * Math.min(1.15, density));
    placed = 0;
    for (let i = 0; i < 4000 && placed < nFern; i++) {
      const near = placed < nFern * 0.45, x = near ? fr.range(-20, 22) : fr.range(-32, 160), z = near ? fr.range(1, 30) : fr.range(-8, 100), y = h1(x, z);
      if (y < 3 || !slopeOK(h1, x, z)) continue;
      // tufts gather along the grikes: the same crack lattice the rock shader draws, near enough
      const cx = x * 0.42, cz = z * 0.42 * 0.62, cr = Math.min(Math.abs(cx - Math.round(cx)), Math.abs(cz - Math.round(cz)));
      if (cr > 0.2 && fr() < 0.7) continue;
      fernTuft(x, y, z, fr.range(0.8, 1.5)); placed++;
      if (placed % 80 === 0) await ctx.yield();
    }
    {   // ferns on the ledges of the cleft walls (polish2): many small arching tufts gathered along the wetter ledges and long
        // fronds hanging down the face below them, instead of a few big flat fans; bright where the sun finds them
      const lr = ctx.core.makeRng(((ctx.seed | 0) * 31 + 977) >>> 0), cFrS = col('#93A84E', 0.85), cFrM = col('#3F5E2E', 0.85), cFrH = col('#5E7C3A', 0.85);
      const want = Math.min(ledgePts.length * 3, Math.round(560 * detail));
      for (let i = 0; i < want && ledgePts.length; i++) {
        const q0 = ledgePts[Math.floor(lr() * ledgePts.length)];
        const dx0 = q0[0] - C0[0], dz0 = q0[2] - C0[1], aa = dx0 * EC[0] + dz0 * EC[1], bb = dx0 * EC[1] - dz0 * EC[0];
        if (noise.n2(aa * 0.11 + 31, q0[1] * 0.35 + (bb > cleftB(aa) ? 9 : 0)) < -0.15 && lr() < 0.85) continue;      // dry stretches stay bare
        const sl = lr.range(-0.9, 0.9), q = [q0[0] + EC[0] * sl, q0[1], q0[2] + EC[1] * sl];
        if (!clearOf(q[0], q[1], q[2], 6.4)) continue;
        const sgn = bb - cleftB(aa) > 0 ? -1 : 1, ox = sgn * EC[1], oz = -sgn * EC[0];          // out of the wall, into the cleft
        const s = lr.range(0.42, 0.95), nf = 6 + Math.floor(lr() * 4);
        for (let k = 0; k < nf; k++) {
          const an = (k / (nf - 1) - 0.5) * 2.9 + lr.range(-0.2, 0.2), ca = Math.cos(an), sa = Math.sin(an);
          const dx = ox * ca - oz * sa, dz = oz * ca + ox * sa, L = lr.range(0.7, 1.2) * s, drop = lr.range(0.4, 1.0), up = lr.range(0.25, 0.6);
          const pts = [[q[0] - ox * 0.08, q[1] - 0.02, q[2] - oz * 0.08], [q[0] + dx * L * 0.36, q[1] + L * up, q[2] + dz * L * 0.36],
            [q[0] + dx * L * 0.74, q[1] + L * (up * 0.75 - 0.2 * drop), q[2] + dz * L * 0.74], [q[0] + dx * L * 0.98, q[1] - L * (0.1 + 0.55 * drop), q[2] + dz * L * 0.98]];
          _a.set(-dz, 0.35 * (k % 2 ? 1 : -1), dx).normalize();
          ribbon(pts, (f) => (0.02 + 0.12 * Math.sin(Math.PI * Math.min(1, f * 1.1 + 0.06))) * s, _a, cFrM, k % 3 === 0 ? cFrS : k % 3 === 1 ? cFrL : cFrH, 2, 0.15, 1.0);
        }
        if (lr() < 0.45) {                           // hanging fronds: long narrow ribbons down the face, stirring
          const nh = 2 + Math.floor(lr() * 4);
          for (let k = 0; k < nh; k++) {
            const sx = lr.range(-0.55, 0.55), Lh = lr.range(0.8, 2.3), px = q[0] + EC[0] * sx + ox * 0.12, pz = q[2] + EC[1] * sx + oz * 0.12, bow = lr.range(0.1, 0.3);
            _a.set(EC[0], 0, EC[1]);
            ribbon([[px, q[1] + 0.03, pz], [px + ox * bow, q[1] - Lh * 0.3, pz + oz * bow], [px + ox * bow * 1.2, q[1] - Lh * 0.68, pz + oz * bow * 1.2], [px + ox * bow * 0.8, q[1] - Lh, pz + oz * bow * 0.8]],
              (f) => 0.035 + 0.075 * Math.sin(Math.PI * Math.min(1, f * 0.9 + 0.1)), _a, cFrM, k % 2 ? cFrH : cFrS, 2, 0.1, 1.0);
          }
        }
        if (i % 40 === 39) await ctx.yield();
      }
      for (const [ls, lt, kind] of [[10, 5.2, 'c'], [-3, 5.6, 'c'], [7.5, 3.6, 'b'], [12.5, 4.4, 'b'], [3, 5.0, 'b'], [-7, 4.6, 'b'], [9, 2.4, 'f'], [6, 4.5, 'f'], [10.5, 1.8, 'f'], [1.5, 3.2, 'f'], [13, 3.0, 'f'], [5, 2.0, 'f'], [-2, 2.6, 'f'], [-9, 3.4, 'f'], [-5, 1.6, 'f']]) {
        const x = SK.x + ls * SK.sn + lt * SK.cs, z = SK.z + ls * SK.cs - lt * SK.sn, y = h3(x, z);
        if (y < 2.4) continue;
        if (kind === 'c') conifer(x, y, z, ls > 0 ? 5.6 : 4.4, false); else if (kind === 'b') bennettite(x, y, z, 0.95); else fernTuft(x, y, z, 1.3);
      }
      await ctx.yield();
      // conifers on the rim of the cleft, leaning a little over it: dark crowns against the sky above the walls
      const toXZc = (a, b) => [C0[0] + a * EC[0] + b * EC[1], C0[1] + a * EC[1] - b * EC[0]];
      for (const [a, sd, H] of [[6, 1, 7.5], [19, -1, 8.5], [27, 1, 9], [41, -1, 7], [52, 1, 8], [66, -1, 9], [74, 1, 7.5], [-2, -1, 6.5]]) {
        const [x, z] = toXZc(a, cleftB(a) + sd * (17.5 + lr.range(0, 3))), y = h2(x, z);
        if (y < 8 || !clearOf(x, y + H * 0.5, z, 14)) continue;
        conifer(x, y, z, H, false);
        await ctx.yield();
      }
    }
    for (let i = 0; i < 70; i++) {               // horsetails at one seep, down-slope to the right of our line
      const an = fr() * 6.28, rr = Math.sqrt(fr()) * 3.2, x = -7.5 + Math.cos(an) * rr, z = 15 + Math.sin(an) * rr * 1.6;
      horsetail(x, h1(x, z), z, fr.range(0.7, 1.2));
    }
    await ctx.yield();
    const finishGeo = (B) => {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(B.pos, 3)); g.setAttribute('aCol', new THREE.Float32BufferAttribute(B.col, 3));
      g.setAttribute('aPl', new THREE.Float32BufferAttribute(B.pl, 4)); g.setIndex(B.idx);
      return g;
    };
    const floraGeo = finishGeo(FL);
    await ctx.yield();
    {   // vertex normals and bounds in slices (one call to computeVertexNormals held the page for 100 ms)
      const P = floraGeo.attributes.position.array, I = floraGeo.index.array, N = new Float32Array(P.length);
      for (let t = 0; t < I.length; t += 3) {
        const a = I[t] * 3, b = I[t + 1] * 3, c = I[t + 2] * 3;
        const ux = P[b] - P[a], uy = P[b + 1] - P[a + 1], uz = P[b + 2] - P[a + 2], vx = P[c] - P[a], vy = P[c + 1] - P[a + 1], vz = P[c + 2] - P[a + 2];
        const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
        N[a] += nx; N[a + 1] += ny; N[a + 2] += nz; N[b] += nx; N[b + 1] += ny; N[b + 2] += nz; N[c] += nx; N[c + 1] += ny; N[c + 2] += nz;
        if (t % 45000 === 44997) await ctx.yield();
      }
      let x0 = 1e9, y0 = 1e9, z0 = 1e9, x1 = -1e9, y1 = -1e9, z1 = -1e9;
      for (let i = 0; i < N.length; i += 3) {
        const l = Math.hypot(N[i], N[i + 1], N[i + 2]) || 1; N[i] /= l; N[i + 1] /= l; N[i + 2] /= l;
        x0 = Math.min(x0, P[i]); y0 = Math.min(y0, P[i + 1]); z0 = Math.min(z0, P[i + 2]); x1 = Math.max(x1, P[i]); y1 = Math.max(y1, P[i + 1]); z1 = Math.max(z1, P[i + 2]);
        if (i % 90000 === 89997) await ctx.yield();
      }
      floraGeo.setAttribute('normal', new THREE.BufferAttribute(N, 3));
      floraGeo.boundingSphere = new THREE.Sphere(new THREE.Vector3((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2), Math.hypot(x1 - x0, y1 - y0, z1 - z0) / 2 + 0.5);
    }
    await ctx.yield();
    const floraMat = new THREE.ShaderMaterial({
      fog: true, side: THREE.DoubleSide, uniforms: { ...fogU(), ...LU },
      vertexShader: /* glsl */`attribute vec3 aCol; attribute vec4 aPl; uniform float uTime; varying vec3 vW, vN, vCol; varying vec4 vPl;
#include <fog_pars_vertex>
void main(){ vec3 p = position; float s = aPl.w;
  float g = sin(uTime * .6 + p.x * .05 + p.z * .07) * .5 + .5;                         // slow gusts crossing the island
  p.x += s * (.05 + .13 * g) * sin(uTime * 1.9 + p.x * .9 + p.y * .7) + s * .03 * sin(uTime * 4.3 + p.z * 3.);
  p.z += s * (.04 + .09 * g) * sin(uTime * 1.6 + p.z * .8 + 1.3);
  p.y += s * .05 * g * sin(uTime * 2.3 + p.x * 1.3 + p.z);
  vec4 wp = modelMatrix * vec4(p, 1.); vW = wp.xyz; vN = normal; vCol = aCol; vPl = aPl;
  vec4 mvPosition = viewMatrix * wp; gl_Position = projectionMatrix * mvPosition;
#include <fog_vertex>
}`,
      fragmentShader: /* glsl */`
varying vec3 vW, vN, vCol; varying vec4 vPl;
#include <fog_pars_fragment>
${NOISE_GLSL}
${LIGHT_GLSL}
void main(){
  vec3 N = normalize(vN + vec3(0., 1e-4, 0.)); if (!gl_FrontFacing) N = -N;
  float kind = vPl.z, u = vPl.x, v = vPl.y; vec3 alb = vCol; float thin = 0.;
  if (kind < .5) { alb *= .75 + .5 * vn(vec2(u * 3., v * 9.)); }
  else if (kind < 1.5) { float sc = abs(fract(u * 2.6 + v * 2.) - .5) + abs(fract(u * 2.6 - v * 2.) - .5); alb *= .62 + .75 * smoothstep(.2, .7, sc); }
  else if (kind < 2.5) {
    float av = abs(v), comb = fract(u * 22. + av * 1.5);
    if (av > .16 && comb > .58) discard;
    alb *= mix(1.25, .8 + .3 * comb, smoothstep(.08, .2, av)); thin = 1.;
  }
  else if (kind < 3.5) { float d1 = abs(fract(u * 5. + v * 7.) - .5), d2 = abs(fract(u * 5. - v * 7.) - .5); alb *= .5 + .9 * smoothstep(.03, .2, min(d1, d2)); }
  else { alb *= .6 + .5 * smoothstep(.1, .2, fract(u * 7.)); }
  vec3 c = litAbove(alb, N, 1.) + alb * uSunA * (.45 * thin + .12) * max(dot(-N, uSun), 0.);
  gl_FragColor = vec4(c, 1.);
  #include <fog_fragment>
}`,
    });
    const floraMesh = new THREE.Mesh(floraGeo, floraMat); scene.add(floraMesh);
    await ctx.yield();
    //@@FLORA
    const updaters = [], placoAt = [];
    // ------------------------------------------------------------------ silver fish: three shoals, each fish on its own loop
    const fa = rng.fork('fauna');
    const nFish = Math.round(3000 * detail * (CAST === 'shoal' ? 1.25 : 1));
    const shoalC = [new THREE.Vector4(-10, -1.8, 193, 8.5), new THREE.Vector4(-7, -1.6, 330, 10), CAST === 'shoal' ? new THREE.Vector4(LANE_X - 2.5, -4.0, 0, 11) : new THREE.Vector4(10.5, -1.5, 322 + DZ + 3, 9.5)];
    const avoid = [new THREE.Vector4(0, 0, -999, 1), new THREE.Vector4(0, 0, -999, 1), new THREE.Vector4(0, 0, -999, 1)];   // xz of what each shoal parts round, radius
    {
      const g = new THREE.InstancedBufferGeometry();
      // a little fish: a lozenge body and a forked tail, lying in the xz plane with a thin back
      g.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0.11, 0.026, 0, 0.02, -0.026, 0, 0.02, 0, 0, -0.07, 0.03, 0, -0.11, -0.03, 0, -0.11, 0, 0.03, 0.02], 3));
      g.setIndex([0, 1, 2, 1, 3, 2, 3, 4, 5, 0, 6, 1, 0, 2, 6, 6, 3, 1, 6, 2, 3]);
      const iA = new Float32Array(nFish * 4), iB = new Float32Array(nFish * 4);
      for (let i = 0; i < nFish; i++) {
        const sh = CAST === 'shoal' ? (i % 5 < 3 ? 2 : i % 5 - 3) : i % 3;
        const r = Math.pow(fa(), 0.6), an = fa() * 6.2832;
        iA.set([r * Math.cos(an), fa.range(-1, 1), r * Math.sin(an), fa()], i * 4);
        iB.set([sh, fa.range(0.75, 1.3), fa.range(0.8, 1.25), fa()], i * 4);
        if (i % 1000 === 999) await ctx.yield();
      }
      g.setAttribute('iA', new THREE.InstancedBufferAttribute(iA, 4)); g.setAttribute('iB', new THREE.InstancedBufferAttribute(iB, 4));
      g.instanceCount = nFish;
      const fishMat = new THREE.ShaderMaterial({
        fog: true, side: THREE.DoubleSide,
        uniforms: { ...fogU(), ...HU, uShoal: { value: shoalC }, uAvoid: { value: avoid }, uSunW: LU.uSun },
        vertexShader: /* glsl */`attribute vec4 iA, iB; uniform vec4 uShoal[3], uAvoid[3]; uniform float uTime;
varying vec3 vW; varying float vFl, vBack;
#include <fog_pars_vertex>
void main(){
  int si = int(iB.x + .5); vec4 S = uShoal[0], A = uAvoid[0];
  if (si == 1) { S = uShoal[1]; A = uAvoid[1]; } else if (si == 2) { S = uShoal[2]; A = uAvoid[2]; }
  // the shoal turns as one slow wheel that breathes; each fish keeps its own lane in it
  float ph = iA.w * 6.2832, w = .16 * iB.y, th = uTime * w + ph * .15;
  float c = cos(th), s = sin(th);
  vec2 o = vec2(c * iA.x - s * iA.z, s * iA.x + c * iA.z) * S.w * (1. + .18 * sin(uTime * .5 + iB.x * 2.));
  o.x *= .62; o += vec2(sin(uTime * .21 + iB.x * 3.), cos(uTime * .17 + iB.x * 5.)) * 2.;
  vec3 ctr = vec3(S.x + o.x, S.y + iA.y * (.55 + .12 * S.w) * .5 + .25 * sin(uTime * .8 + ph), S.z + o.y);
  // it parts round whatever comes through: fish are pushed out sideways
  vec2 d = (ctr.xz - A.xy) * vec2(1., A.w); float dl = length(d) + 1e-3, push = sqrt(dl * dl + A.z * A.z) - dl;
  ctr.x += d.x / dl * push;  ctr.z += d.y / dl * push * A.w;
  // heading: along the wheel, and outward where it is parting
  vec2 hd = vec2(-s * iA.x - c * iA.z, c * iA.x - s * iA.z); hd.x *= .62; hd += d / dl * push * .12;
  hd = hd / max(length(hd), 1e-3);
  vec3 p = position * iB.z * 1.5;
  float wig = sin(uTime * 9. * iB.y + ph * 7. - p.z * 14.) * (.012 + .16 * max(-p.z, 0.));
  p.x += wig;
  float roll = sin(uTime * 1.3 * iB.y + ph * 3.) ; roll = roll * roll * roll * .9 + smoothstep(1.2, 4., push) * sin(uTime * 7. + ph * 9.) * .8;
  p.xy = vec2(cos(roll) * p.x - sin(roll) * p.y, sin(roll) * p.x + cos(roll) * p.y);
  vec3 wp = ctr + vec3(hd.y * p.x + hd.x * p.z, p.y, -hd.x * p.x + hd.y * p.z);
  // polish3: one fish in seven leaps where the shoal is parting: a short silver arc out of the water and back
  float lt = fract(uTime * .42 * iB.y + iA.w * 37.), lk = step(.86, fract(iA.w * 91.7)) * (.22 + .78 * smoothstep(.25, 1.6, push));
  float arc = sin(3.14159 * clamp(lt / .26, 0., 1.)) * lk;
  wp.y = mix(wp.y, .05 + .95 * arc * (.6 + .5 * iB.z), smoothstep(0., .22, arc)); wp.xz += hd * arc * .5;
  vW = wp; vFl = max(abs(roll), smoothstep(.1, .3, arc)); vBack = position.y;
  vec4 mvPosition = viewMatrix * vec4(wp, 1.); gl_Position = projectionMatrix * mvPosition;
#include <fog_vertex>
}`,
        fragmentShader: /* glsl */`
uniform vec3 uSunCol, uSkyCol;
varying vec3 vW; varying float vFl, vBack;
#include <fog_pars_fragment>
${NOISE_GLSL}
${SEA_GLSL}
void main(){
  // dark olive backs from above; a roll throws the silver flank at the sun
  float fl = smoothstep(.35, .85, vFl);
  vec3 col = mix(vec3(.05, .07, .07), vec3(.95, .97, 1.) * 1.5, fl) * (uSunCol + uSkyCol * .5);
  col = seaTint(col, -vW.y, vW);
  gl_FragColor = vec4(col, 1.);
  #include <fog_fragment>
}`,
      });
      const fish = new THREE.Mesh(g, fishMat); fish.frustumCulled = false; fish.renderOrder = 2; scene.add(fish);
      await ctx.yield();
    }
    // ------------------------------------------------------------------ creature builder: a lofted body on the shared buffers
    // rows [x, y, z, halfWidth, top, bottom]; pl = (rest z, ring 0 back .. 1 belly, kind, sway); keel(a, f) adds to the radius
    // sect = { px, py, add(a, f) }: a boxier section (exponents on the side and the top) and ridges added to the height in metres
    const loft = (rows, sides, cTop, cBel, kind, swayOf, keel = null, sect = null) => {
      const base = FL.n, n = rows.length;
      for (let i = 0; i < n; i++) {
        const r = rows[i], f = i / (n - 1);
        for (let j = 0; j < sides; j++) {
          const a = (j / sides) * Math.PI * 2, sa = Math.sin(a), ca = Math.cos(a), k = keel ? 1 + keel(a, f) : 1;
          const px = sect ? sect.px : 0.85, top = sect ? r[4] * Math.pow(ca, sect.py) + sect.add(a, f) : r[4] * ca * k;
          FL.pos.push(r[0] + r[3] * Math.sign(sa) * Math.pow(Math.abs(sa), px) * k, r[1] + (ca >= 0 ? top : r[5] * ca), r[2]);
          const t = smoothstep(-0.25, 0.3, -ca);
          FL.col.push(lerp(cTop.r, cBel.r, t), lerp(cTop.g, cBel.g, t), lerp(cTop.b, cBel.b, t));
          FL.pl.push(r[2], (1 - ca) * 0.5, kind, swayOf ? swayOf(f, sa) : 0);
        }
        FL.n += sides;
      }
      for (let i = 0; i < n - 1; i++) for (let j = 0; j < sides; j++) {
        const a = base + i * sides + j, b = base + i * sides + (j + 1) % sides, c = a + sides, d = b + sides;
        FL.idx.push(a, b, c, b, d, c);
      }
    };
    // ------------------------------------------------------------------ Psephoderma: six placodonts creeping on the bank
    {
      FL = newBuf();
      // Not a turtle: a broad flat keeled main shield with an angular outline, bare skin, then a separate small hip shield;
      // a pointed skull on a neck stretched forward; four sprawled paddle legs; a thin straight tail a third of the length.
      const cSh = col('#75623A', 0.66), cShD = col('#3E3120', 0.7), cSk = col('#A88C5E', 0.82), cBl = col('#B9AE8C', 0.7);
      // three keels (mid-line and one each side, on ring vertices 0, 2 and 22 of 24) and a raised rim: ridges 3 cm proud of a FLAT shield
      const G = (a, a0) => { let d = Math.abs(a - a0); d = Math.min(d, 6.2832 - d); return Math.exp(-d * d / 0.012); };
      const ridge = (h) => (a, f) => h * (G(a, 0) + 0.85 * G(a, 0.5236) + 0.85 * G(a, 5.7596)) * Math.min(1, 0.25 + 3 * Math.sin(Math.PI * f));
      // plan outlines as straight-sided polygons (half-width against f), not ovals: a six-sided shield, widest behind the middle
      const poly = (pts) => (f) => { let i = 0; while (i < pts.length - 2 && f > pts[i + 1][0]) i++; const p0 = pts[i], p1 = pts[i + 1]; return lerp(p0[1], p1[1], clamp((f - p0[0]) / (p1[0] - p0[0]), 0, 1)); };
      const planS = poly([[0, 0.50], [0.05, 0.60], [0.60, 1.0], [0.68, 1.0], [0.95, 0.62], [1, 0.52]]);
      const planH = poly([[0, 0.50], [0.10, 0.80], [0.50, 1.0], [0.85, 0.70], [1, 0.44]]);
      const trunk = []; for (let i = 0; i <= 8; i++) { const f = i / 8; trunk.push([0, -0.02, 0.44 - 1.22 * f, 0.15 - 0.05 * f, 0.065, 0.06]); }
      loft(trunk, 8, cSk, cBl, 6, null);                                             // the body under and between the shields
      const shell = []; for (let i = 0; i <= 14; i++) { const f = i / 14, e = planS(f), d = Math.min(1, 0.6 + 2.2 * Math.sin(Math.PI * f)); shell.push([0, 0.035, 0.52 - 0.84 * f, 0.62 * e, 0.075 * d, 0.045 * d]); }
      loft(shell, 24, cSh, cBl, 5, null, null, { px: 0.55, py: 0.42, add: ridge(0.034) });
      const hip = []; for (let i = 0; i <= 7; i++) { const f = i / 7, e = planH(f), d = Math.min(1, 0.6 + 2.2 * Math.sin(Math.PI * f)); hip.push([0, 0.02, -0.44 - 0.32 * f, 0.31 * e, 0.06 * d, 0.04 * d]); }
      loft(hip, 24, cSh, cBl, 5, null, null, { px: 0.55, py: 0.42, add: ridge(0.024) });
      // the neck stretched forward and the pointed skull
      loft([[0, 0.0, 0.42, 0.15, 0.08, 0.06], [0, 0.0, 0.58, 0.125, 0.07, 0.055], [0, 0.005, 0.72, 0.12, 0.068, 0.05], [0, 0.015, 0.82, 0.155, 0.08, 0.055], [0, 0.01, 0.91, 0.125, 0.066, 0.05],
        [0, 0.0, 1.0, 0.07, 0.045, 0.035], [0, -0.01, 1.08, 0.03, 0.026, 0.02], [0, -0.015, 1.14, 0.006, 0.008, 0.008]], 8, cSk, cBl, 6, (f) => 0.4 * f);
      // tail: thin, straight, a third of the whole length
      loft([[0, 0.0, -0.74, 0.10, 0.06, 0.045], [0, 0.0, -0.90, 0.07, 0.045, 0.035], [0, 0.0, -1.14, 0.044, 0.03, 0.025], [0, 0.0, -1.42, 0.03, 0.022, 0.018], [0, 0.0, -1.70, 0.012, 0.01, 0.008]], 6, cSk, cShD, 6, (f) => -0.55 * f);
      // four sprawled paddle legs: upper limb out, elbow, a flat paddle; sway carries the diagonal (+1 / -1)
      for (const [sx, z0, len, dg] of [[1, 0.30, 0.36, 1], [-1, 0.30, 0.36, -1], [1, -0.60, 0.32, -1], [-1, -0.60, 0.32, 1]]) {
        const x0 = sx * (z0 > 0 ? 0.42 : 0.24), fw = z0 > 0 ? 0.10 : -0.06;
        tube([[x0, -0.02, z0, 0.06], [x0 + sx * len * 0.5, -0.05, z0 + fw * 0.5, 0.05], [x0 + sx * len, -0.11, z0 + fw, 0.034]], 5, cSk, cSk, 7, dg * 0.4, dg * 1.0, 1);
        _a.set(0, 0, 1);
        ribbon([[x0 + sx * len * 0.9, -0.11, z0 + fw], [x0 + sx * (len + 0.09), -0.13, z0 + fw * 1.2], [x0 + sx * (len + 0.18), -0.14, z0 + fw * 1.3]], (f) => 0.045 + 0.07 * Math.sin(Math.PI * (0.25 + 0.7 * f)), _a, cSk, cSk, 7, dg, dg);
      }
      const pg = finishGeo(FL); pg.computeVertexNormals();
      const ig = new THREE.InstancedBufferGeometry(); ig.index = pg.index; for (const k of Object.keys(pg.attributes)) ig.setAttribute(k, pg.attributes[k]);
      // six on the spit we skim at u 0.30-0.34, each creeping round its own slow circle
      const nP = 6, iP = new Float32Array(nP * 4), iQ = new Float32Array(nP * 4);
      const PZ = [123.6, 125.6, 127.4, 129.6, 132.6, 136.4], PX = [-1.4, -5.4, 1.8, -3.2, -6.4, 0.2];
      for (let i = 0; i < nP; i++) {
        const z = PZ[i] + fa.range(-0.5, 0.5), x = PX[i] + fa.range(0, 0.6), rad = fa.range(1.3, 1.9);
        iP.set([x, floorH(x, z) + 0.14, z, rad * (i % 2 ? 1 : -1)], i * 4);
        iQ.set([fa() * 6.28, fa.range(1.08, 1.2), fa(), 0], i * 4);
        placoAt.push([x, z, rad]);
      }
      ig.setAttribute('iP', new THREE.InstancedBufferAttribute(iP, 4)); ig.setAttribute('iQ', new THREE.InstancedBufferAttribute(iQ, 4)); ig.instanceCount = nP;
      const PV = /* glsl */`attribute vec3 aCol; attribute vec4 aPl, iP, iQ; uniform float uTime;
vec3 placo(vec3 p, inout vec3 n, out float fy){
  float kind = aPl.z, sw = aPl.w, ph = uTime * 2.1 * (.8 + .4 * iQ.z) + iQ.x * 5.;
  // slow diagonal steps: each paddle swings forward clear of the sand, plants, and the body slides over it
  if (kind > 6.5) { float c = sin(ph * sign(sw) + (sw > 0. ? 0. : 3.1416)), l = max(cos(ph * sign(sw) + (sw > 0. ? 0. : 3.1416)), 0.); p.z += c * .13 * abs(sw); p.y += l * .05 * abs(sw); }
  else if (kind > 5.5) { p.x += sin(ph * .5 + p.z * 2.) * .05 * sw; }                 // head noses about, tail swings against it
  p.x += sin(ph) * .012; p.y += abs(sin(ph)) * .008;
  p *= iQ.y;
  float r = iP.w, w = .085 / r, th = uTime * w + iQ.x, c = cos(th), s = sin(th);
  // heading is the tangent of its slow circle
  vec2 h = vec2(-s, c) * sign(r);
  vec3 q = vec3(h.y * p.x + h.x * p.z, p.y, -h.x * p.x + h.y * p.z);
  n = vec3(h.y * n.x + h.x * n.z, n.y, -h.x * n.x + h.y * n.z);
  fy = iP.y - .13;
  return q + vec3(iP.x + c * abs(r), iP.y, iP.z + s * abs(r));
}`;
      const placoMat = new THREE.ShaderMaterial({
        fog: true, side: THREE.DoubleSide, uniforms: { ...fogU(), ...HU },
        vertexShader: `${PV}\nvarying vec3 vW, vN, vCol; varying vec4 vPl;\n#include <fog_pars_vertex>\nvoid main(){ vec3 n = normal; float fy; vec3 wp = placo(position, n, fy); vW = wp; vN = n; vCol = aCol; vPl = aPl;\n vec4 mvPosition = viewMatrix * vec4(wp, 1.); gl_Position = projectionMatrix * mvPosition;\n#include <fog_vertex>\n}`,
        fragmentShader: /* glsl */`
uniform vec3 uSunRefr, uSunCol, uSkyCol, uBounce;
varying vec3 vW, vN, vCol; varying vec4 vPl;
#include <fog_pars_fragment>
${NOISE_GLSL}
${SEA_GLSL}
void main(){
  vec3 N = normalize(vN + vec3(0., 1e-4, 0.)); if (!gl_FrontFacing) N = -N;
  vec3 alb = vCol;
  if (vPl.z > 4.5 && vPl.z < 5.5) {
    // the shell: a mosaic of small plates, paler seams between them
    vec2 q = vec2(vPl.x * 16., vPl.y * 34.); q.x += .5 * floor(q.y);
    vec2 f = abs(fract(q) - .5); float seam = smoothstep(.34, .47, max(f.x, f.y));
    alb = alb * (.72 + .5 * h12(floor(q))) ; alb = mix(alb, alb * 2.3 + .05, seam * .85 * (1. - smoothstep(.36, .5, vPl.y)));
    float kl = max(1. - smoothstep(.002, .012, vPl.y), 1. - smoothstep(.006, .02, abs(vPl.y - .067)));
    alb = mix(alb, alb * 2.1 + .06, kl * .8);
    alb *= 1. - .45 * smoothstep(.20, .27, vPl.y) * (1. - smoothstep(.30, .36, vPl.y));          // the shield's rim throws a dark edge
  } else { alb *= .75 + .5 * vn(vec2(vPl.x * 30., vPl.y * 14.)); }
  float ndl = max(dot(N, uSunRefr), 0.), ca = caustic(vW.xz + vW.y * .7, uTime) * smoothstep(.1, .6, N.y);
  vec3 col = alb * (uSunCol * ndl * (.88 + .75 * ca) + uSkyCol * (.42 + .58 * N.y) * .55 + uBounce * (max(-N.y, 0.) * .55 + .08));
  gl_FragColor = vec4(seaTint(col, -vW.y, vW), 1.);
  #include <fog_fragment>
}`,
      });
      const placos = new THREE.Mesh(ig, placoMat); placos.frustumCulled = false; placos.renderOrder = 2; scene.add(placos);
      const placoShMat = new THREE.ShaderMaterial({
        fog: true, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2, uniforms: { ...fogU(), ...HU },
        vertexShader: `${PV}\nuniform vec3 uSunRefr; varying vec3 vW;\n#include <fog_pars_vertex>\nvoid main(){ vec3 n = normal; float fy; vec3 wp = placo(position, n, fy);\n float t = (wp.y - fy) / max(uSunRefr.y, .2); wp -= uSunRefr * t; wp.y = fy + .03; vW = wp;\n vec4 mvPosition = viewMatrix * vec4(wp, 1.); gl_Position = projectionMatrix * mvPosition;\n#include <fog_vertex>\n}`,
        fragmentShader: /* glsl */`
varying vec3 vW;
#include <fog_pars_fragment>
${NOISE_GLSL}
${SEA_GLSL}
${SAND_GLSL}
${SHADE_GLSL}
void main(){
  float rip; vec3 a = sandCol(vW.xz, length(cameraPosition - vW), rip);
  gl_FragColor = vec4(seaTint(a * shadeLight(-vW.y, rip), -vW.y, vW), 1.);
  #include <fog_fragment>
}`,
      });
      const placoSh = new THREE.Mesh(ig, placoShMat); placoSh.frustumCulled = false; placoSh.renderOrder = 1; scene.add(placoSh);
      await ctx.yield();
    }
    // ------------------------------------------------------------------ oyster mounds: low dark lumps crusted with pale shells, each
    // with its own short hard shadow; three stand where a placodont's round brings its snout to them
    {
      const mr = rng.fork('mounds'), P = [], C = [], F = [], idx = []; let base = 0;
      const cDark = col('#3E3A2E', 0.8), cPale = col('#D9D2BC', 0.8), NI = 6, NJ = 12;
      const mound = (x, z, R, H) => {
        const y0 = floorH(x, z) - 0.05, sd = mr() * 50;
        for (let i = 0; i <= NI; i++) for (let j = 0; j <= NJ; j++) {
          const th = (i / NI) * Math.PI * 0.5, ph = (j / NJ) * Math.PI * 2, cx = Math.sin(th) * Math.cos(ph), cz = Math.sin(th) * Math.sin(ph), cy = Math.cos(th);
          const m = 1 + 0.30 * noise.n3(cx * 2.3 + sd, cy * 2.3, cz * 2.3) + 0.26 * Math.abs(noise.n3(cx * 5.5 + sd, cy * 5.5, cz * 5.5)) - 0.06;      // knobs: single shells standing proud
          P.push(x + cx * R * m, y0 + cy * H * m, z + cz * R * m * 0.8);
          const sh = clamp(0.5 + 1.6 * noise.n3(cx * 7 + sd, cy * 7 + 3, cz * 7), 0, 1) * (0.35 + 0.65 * cy);
          C.push(lerp(cDark.r, cPale.r, sh), lerp(cDark.g, cPale.g, sh), lerp(cDark.b, cPale.b, sh)); F.push(y0 + 0.05);
        }
        for (let i = 0; i < NI; i++) for (let j = 0; j < NJ; j++) { const a = base + i * (NJ + 1) + j, c = a + NJ + 1; idx.push(a, a + 1, c, a + 1, c + 1, c); }
        base += (NI + 1) * (NJ + 1);
      };
      for (let i = 0; i < 3; i++) { const [x, z, r] = placoAt[i * 2], an = 0.6 + i * 2.2; mound(x + Math.cos(an) * (r + 0.62), z + Math.sin(an) * (r + 0.62), 0.55, 0.42); }
      const nM = Math.round(46 * Math.max(detail, 0.8));
      for (let i = 0, tries = 0; i < nM && tries < 600; tries++) {
        const z = mr.range(92, 262), x = bankEdge(z) + mr.range(0.5, 30), h = floorH(x, z);
        if (h > -0.5 || h < -5.5 || envI(x, z) > -2) continue;
        let ok = true; for (const q of placoAt) if (Math.hypot(x - q[0], z - q[1]) < q[2] + 0.9) ok = false;
        if (!ok) continue;
        mound(x, z, mr.range(0.45, 1.0), mr.range(0.3, 0.55)); i++;
        if (mr.chance(0.5)) mound(x + mr.range(-1.2, 1.2), z + mr.range(-1.2, 1.2), mr.range(0.3, 0.55), mr.range(0.2, 0.35));
      }
      const mg = new THREE.BufferGeometry(); mg.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); mg.setAttribute('aCol', new THREE.Float32BufferAttribute(C, 3));
      mg.setAttribute('aFy', new THREE.Float32BufferAttribute(F, 1)); mg.setIndex(idx); mg.computeVertexNormals(); mg.computeBoundingSphere();
      const moundMat = new THREE.ShaderMaterial({
        fog: true, uniforms: { ...fogU(), ...HU },
        vertexShader: /* glsl */`attribute vec3 aCol; varying vec3 vW, vN, vCol;
#include <fog_pars_vertex>
void main(){ vec4 wp = modelMatrix * vec4(position, 1.); vW = wp.xyz; vN = normal; vCol = aCol; vec4 mvPosition = viewMatrix * wp; gl_Position = projectionMatrix * mvPosition;
#include <fog_vertex>
}`,
        fragmentShader: /* glsl */`
uniform vec3 uSunRefr, uSunCol, uSkyCol, uBounce;
varying vec3 vW, vN, vCol;
#include <fog_pars_fragment>
${NOISE_GLSL}
${SEA_GLSL}
void main(){
  vec3 N = normalize(vN + vec3(0., 1e-4, 0.));
  // a heap of oyster shells: pale valves a hand across, black gaps between them
  float cell = vn(vW.xz * 15. + vW.y * 11.), big = vn(vW.xz * 6.5 + vW.y * 5. + 3.);
  vec3 alb = mix(vCol * .32, vec3(.66, .63, .55) * (.7 + .5 * big), smoothstep(.36, .47, cell) * (.45 + .55 * smoothstep(.25, .5, big)));
  float ndl = max(dot(N, uSunRefr), 0.), ca = caustic(vW.xz + vW.y * .7, uTime) * smoothstep(.1, .6, N.y);
  vec3 col = alb * (uSunCol * ndl * (.9 + .6 * ca) + uSkyCol * (.42 + .58 * N.y) * .5 + uBounce * .06);
  gl_FragColor = vec4(seaTint(col, -vW.y, vW), 1.);
  #include <fog_fragment>
}`,
      });
      const mounds = new THREE.Mesh(mg, moundMat); mounds.renderOrder = 2; scene.add(mounds);
      const moundShMat = new THREE.ShaderMaterial({
        fog: true, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2, uniforms: { ...fogU(), ...HU },
        vertexShader: /* glsl */`attribute float aFy; uniform vec3 uSunRefr; varying vec3 vW;
#include <fog_pars_vertex>
void main(){ vec4 wp = modelMatrix * vec4(position, 1.); float t = max(wp.y - aFy, 0.) / max(uSunRefr.y, .2); wp.xyz -= uSunRefr * t; wp.y = aFy + .03; vW = wp.xyz;
  vec4 mvPosition = viewMatrix * wp; gl_Position = projectionMatrix * mvPosition;
#include <fog_vertex>
}`,
        fragmentShader: /* glsl */`
varying vec3 vW;
#include <fog_pars_fragment>
${NOISE_GLSL}
${SEA_GLSL}
${SAND_GLSL}
${SHADE_GLSL}
void main(){
  float rip; vec3 a = sandCol(vW.xz, length(cameraPosition - vW), rip);
  gl_FragColor = vec4(seaTint(a * shadeLight(-vW.y, rip), -vW.y, vW), 1.);
  #include <fog_fragment>
}`,
      });
      const moundSh = new THREE.Mesh(mg, moundShMat); moundSh.renderOrder = 1; scene.add(moundSh);
      await ctx.yield();
    }
    // ------------------------------------------------------------------ in the air: Kuehneosuchus gliders and small pterosaurs
    // kinds: 8 lizard skin, 9 rib fan, 10 wing membrane, 11 limb / bone, 12 fur. One shader; each animal has its own uniforms.
    const airShader = {
      vertexShader: /* glsl */`attribute vec3 aCol; attribute vec4 aPl; uniform float uTime, uOpen, uFlap, uAmp, uSeed;
varying vec3 vW, vN, vCol; varying vec4 vPl;
#include <fog_pars_vertex>
void main(){ vec3 p = position, n = normal; float kind = aPl.z, sw = aPl.w, sx = sign(p.x);
  if (kind > 8.5 && kind < 9.5) {                    // rib fan: folds flat to the flank on the rock, trembles in the glide
    float out_ = abs(p.x) - .03; p.x = sx * (.03 + out_ * mix(.12, 1., uOpen)); p.z -= out_ * (1. - uOpen) * .9;
    p.y += sw * (.012 * sin(uTime * 11. + uSeed + sw * 3.) + .03 * sin(uTime * 2.3 + uSeed)) * uOpen + sw * sw * .035 * uOpen;
  } else if (kind > 9.5 && kind < 11.5 && sw > 0.) {   // wing: beats from the shoulder, the outer wing lagging and folding on the upstroke
    float a = uAmp * (sin(uFlap) * .85 + .1) + (1. - uAmp) * .16, a2 = a + uAmp * sw * (.55 * sin(uFlap - 1.1) - .25 * cos(uFlap));
    float r = abs(p.x) - .03, ang = mix(a, a2, sw);
    p.y += r * sin(ang); p.x = sx * (.03 + r * (cos(ang) - .22 * uAmp * sw * max(cos(uFlap), 0.)));
    n.y += .5; n = normalize(n);
  } else if (sw < 0.) { p.x += sin(uTime * 3.1 + uSeed + p.z * 6.) * .05 * sw * sw; p.y += sin(uTime * 2.2 + uSeed) * .03 * sw * sw; }   // tail steers
  vec4 wp = modelMatrix * vec4(p, 1.); vW = wp.xyz; vN = mat3(modelMatrix) * n; vCol = aCol; vPl = aPl;
  vec4 mvPosition = viewMatrix * wp; gl_Position = projectionMatrix * mvPosition;
#include <fog_vertex>
}`,
      fragmentShader: /* glsl */`
varying vec3 vW, vN, vCol; varying vec4 vPl;
#include <fog_pars_fragment>
${NOISE_GLSL}
${LIGHT_GLSL}
void main(){
  vec3 N = normalize(vN + vec3(0., 1e-4, 0.)); if (!gl_FrontFacing) N = -N;
  float kind = vPl.z; vec3 alb = vCol; float thin = 0.;
  if (kind < 8.5) {                                   // lizard: darker cross-bands over the back, fine speckle, a dark eye
    float band = smoothstep(.35, .65, sin(vPl.x * 62.) * .5 + .5) * (1. - smoothstep(.3, .55, vPl.y));
    alb *= mix(1., .45, band) * (.85 + .3 * vn(vec2(vPl.x * 220., vPl.y * 40.)));
  } else if (kind < 9.5) {                            // fan: rust skin, the long ribs showing as pale lines
    float rib = 1. - smoothstep(.04, .16, abs(fract(vPl.x) - .5)); alb = mix(alb, alb * 1.7 + .05, rib * .7); alb *= .8 + .4 * vn(vPl.xy * vec2(3., 9.)); thin = 1.;
  } else if (kind < 10.5) {                           // wing skin: the finger along the front, faint fibres, the sun through it
    alb *= .82 + .3 * vn(vec2(vPl.x * 30., vPl.y * 5.)); alb = mix(alb, alb * .5, 1. - smoothstep(.0, .07, vPl.y)); thin = 1.;
  } else if (kind > 11.5) { alb *= .6 + .8 * vn(vec2(vPl.x * 300., vPl.y * 60.)); }       // fur
  vec3 c = litAbove(alb, N, 1.) + alb * uSunA * (.42 * thin) * max(dot(-N, uSun), 0.) + alb * uSkyA * .15 * thin;
  gl_FragColor = vec4(c, 1.);
  #include <fog_fragment>
}`,
    };
    const airMat = () => new THREE.ShaderMaterial({ fog: true, side: THREE.DoubleSide, vertexShader: airShader.vertexShader, fragmentShader: airShader.fragmentShader,
      uniforms: { ...fogU(), ...LU, uOpen: { value: 0 }, uFlap: { value: 0 }, uAmp: { value: 0 }, uSeed: { value: fa() * 40 } } });
    // a flat web between two edge curves A(s), B(s): grid ns x nc; pl = (s * lines, c, kind, sway(s, c))
    const web = (A, B, ns, nc, c0, c1, kind, swayOf, lines = 1) => {
      const base = FL.n;
      for (let i = 0; i <= ns; i++) { const s = i / ns, a = A(s), b = B(s);
        for (let j = 0; j <= nc; j++) { const c = j / nc; FL.pos.push(lerp(a[0], b[0], c), lerp(a[1], b[1], c), lerp(a[2], b[2], c)); FL.col.push(lerp(c0.r, c1.r, c), lerp(c0.g, c1.g, c), lerp(c0.b, c1.b, c)); FL.pl.push(s * lines, c, kind, swayOf(s, c)); }
        FL.n += nc + 1; }
      for (let i = 0; i < ns; i++) for (let j = 0; j < nc; j++) { const a = base + i * (nc + 1) + j, b = a + 1, c = a + nc + 1, d = c + 1; FL.idx.push(a, c, b, b, c, d); }
    };
    const L3 = (p, q, t) => [lerp(p[0], q[0], t), lerp(p[1], q[1], t), lerp(p[2], q[2], t)];
    const poly = (pts, s) => { const x = clamp(s, 0, 1) * (pts.length - 1), i = Math.min(pts.length - 2, Math.floor(x)); return L3(pts[i], pts[i + 1], x - i); };
    // Kuehneosuchus, 0.7 m: blunt head, slim body, legs trailed back, a whip tail over half the length, a stiff rib fan each side
    FL = newBuf();
    {
      const cB = col('#B79A6C', 0.85), cBel = col('#E6DCC0', 0.8), cRust = col('#A0603C', 0.8), cRustD = col('#74442C', 0.8);
      loft([[0, 0, 0.325, 0.006, 0.005, 0.005], [0, 0.002, 0.312, 0.02, 0.013, 0.012], [0, 0.004, 0.285, 0.03, 0.022, 0.016], [0, 0.004, 0.255, 0.033, 0.025, 0.018], [0, 0.002, 0.225, 0.026, 0.02, 0.017],
        [0, 0, 0.195, 0.022, 0.019, 0.018], [0, 0, 0.15, 0.029, 0.023, 0.022], [0, 0, 0.09, 0.032, 0.024, 0.023], [0, 0, 0.03, 0.028, 0.022, 0.02], [0, 0, -0.02, 0.02, 0.018, 0.016],
        [0, 0, -0.10, 0.011, 0.011, 0.01], [0, 0, -0.22, 0.006, 0.006, 0.006], [0, 0, -0.38, 0.0015, 0.0015, 0.0015]], 10, cB, cBel, 8, (f) => (f > 0.72 ? -(f - 0.72) * 3.4 : 0));
      for (const sx of [1, -1]) {
        tube([[sx * 0.026, -0.004, 0.16, 0.009], [sx * 0.07, -0.008, 0.115, 0.007], [sx * 0.078, -0.008, 0.05, 0.005], [sx * 0.085, -0.008, 0.03, 0.007]], 4, cB, cB, 11, 0, 0, 1);
        tube([[sx * 0.022, -0.004, 0.0, 0.011], [sx * 0.065, -0.006, -0.05, 0.008], [sx * 0.058, -0.006, -0.13, 0.005], [sx * 0.066, -0.006, -0.155, 0.008]], 4, cB, cB, 11, 0, 0, 1);
        // the fan: a paper dart's wing, front edge swept back, eleven ribs
        web((s) => [sx * 0.03, 0.005, lerp(0.165, 0.0, s)],
          (s) => [sx * (0.03 + 0.2 * Math.pow(Math.sin(Math.PI * (0.07 + 0.86 * s)), 0.6)), 0.007, lerp(0.105, -0.035, s) - 0.012],
          11, 4, cRustD, cRust, 9, (s, c) => c, 11);
      }
    }
    const gliderGeo = finishGeo(FL); gliderGeo.computeVertexNormals(); gliderGeo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 0.6);
    await ctx.yield();
    // a small long-tailed pterosaur, 1 m across: big toothed head, short furry body, skin wings from one long finger to the
    // ankle with three small claws at the bend, legs trailing, a stiff tail ending in a leaf-shaped vane
    FL = newBuf();
    {
      const cFur = col('#5A4634', 0.9), cFurL = col('#8A735A', 0.9), cWing = col('#C89B74', 0.8), cWingD = col('#8E6648', 0.8), cBone = col('#6E5642', 0.85), cBeak = col('#3A3028', 0.9);
      // head: long jaws, a deep back of the skull
      loft([[0, 0.012, 0.205, 0.003, 0.003, 0.003], [0, 0.014, 0.185, 0.009, 0.008, 0.008], [0, 0.016, 0.15, 0.014, 0.014, 0.012], [0, 0.02, 0.118, 0.02, 0.022, 0.016], [0, 0.022, 0.095, 0.022, 0.024, 0.018], [0, 0.018, 0.075, 0.015, 0.016, 0.014]], 8, cBeak, cFurL, 8, null);
      // short furry body
      loft([[0, 0.016, 0.08, 0.012, 0.013, 0.012], [0, 0.008, 0.05, 0.026, 0.024, 0.024], [0, 0, 0.0, 0.034, 0.03, 0.032], [0, 0, -0.06, 0.03, 0.026, 0.028], [0, 0, -0.115, 0.018, 0.016, 0.016], [0, 0, -0.14, 0.006, 0.006, 0.006]], 10, cFur, cFurL, 12, null);
      // stiff tail and its vane
      tube([[0, 0, -0.13, 0.006], [0, 0.004, -0.25, 0.004], [0, 0.006, -0.36, 0.003]], 4, cBone, cBone, 11, -0.2, -0.9, 1);
      _a.set(0, 1, 0);
      ribbon([[0, 0.006, -0.35], [0, 0.006, -0.385], [0, 0.006, -0.42]], (f) => 0.004 + 0.022 * Math.sin(Math.PI * Math.min(1, f + 0.12)), _a, cWingD, cWing, 11, -0.9, -1.0);
      for (const sx of [1, -1]) {
        const arm = [[sx * 0.03, 0.012, 0.045], [sx * 0.105, 0.014, 0.015], [sx * 0.19, 0.014, 0.075], [sx * 0.34, 0.008, 0.035], [sx * 0.5, 0.0, -0.05]];
        const ankle = [sx * 0.035, 0.0, -0.20], hip = [sx * 0.02, 0, -0.10];
        // membrane: leading edge along the arm and finger, trailing edge sweeping back to the ankle
        web((s) => poly(arm, s), (s) => { const e = L3(ankle, arm[4], Math.pow(s, 1.25)); e[2] += 0.035 * Math.sin(Math.PI * s); return e; }, 10, 3, cWing, cWingD, 10, (s, c) => Math.pow(s, 1.2) * 0.999 + 0.001, 1);
        tube(arm.map((p, i) => [p[0], p[1] + 0.002, p[2], [0.011, 0.009, 0.007, 0.005, 0.002][i]]), 4, cBone, cBone, 11, 0.001, 0.999, 1);
        // three small claws at the bend
        for (let k = 0; k < 3; k++) tube([[sx * 0.19, 0.014, 0.075, 0.004], [sx * (0.2 + 0.008 * k), 0.012, 0.098 + 0.004 * k, 0.003], [sx * (0.205 + 0.012 * k), 0.006, 0.108, 0.001]], 3, cBeak, cBeak, 11, 0.37, 0.37, 1);
        tube([[hip[0], hip[1], hip[2], 0.009], [sx * 0.045, 0.0, -0.15, 0.006], ankle.concat(0.004), [sx * 0.04, -0.004, -0.225, 0.005]], 4, cFur, cBone, 11, 0, 0, 1);
      }
    }
    const pteroGeo = finishGeo(FL); pteroGeo.computeVertexNormals(); pteroGeo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 0.8);
    await ctx.yield();
    // the animals of the air: each a mesh on a track tied to our own path
    const L = path.length, _f = new THREE.Vector3(), _r = new THREE.Vector3(), _u = new THREE.Vector3(), _m4 = new THREE.Matrix4(), _p1 = new THREE.Vector3(), _p2 = new THREE.Vector3(), _qr = new THREE.Quaternion();
    const Zaxis = new THREE.Vector3(0, 0, 1);
    const flyers = [];
    const addFlyer = (geo, posFn, scale, tick) => {
      const mesh = new THREE.Mesh(geo, airMat()); mesh.frustumCulled = false; mesh.scale.setScalar(scale); scene.add(mesh);
      flyers.push({ mesh, posFn, tick, U: mesh.material.uniforms });
    };
    // gliders: perch, jump window, station beside us (x off our line, metres ahead, metres below)
    const perch = [[3.2, 22.6], [5.4, 23.4]].map(([x, z]) => new THREE.Vector3(x, h1(x, z) + 0.035, z));
    perch.unshift(bossAt(BOULDERS[0], 0.25, 1, -0.05, new THREE.Vector3()), bossAt(BOULDERS[0], -0.35, 0.8, 0.5, new THREE.Vector3()));
    perch[0].y += 0.03; perch[1].y += 0.03;
    const station = [[-1.4, 3.8, 1.5], [-1.5, 3.4, 2.3], [-0.4, 5.6, 3.4], [2.4, 4.8, 2.6]], jump = [[0.0, 0.018], [0.002, 0.024], [0.004, 0.034], [0.006, 0.042]];      // polish2: in the air beside us from the first frame, out in front where the gaze goes      // (stations: on our line of sight down to her, close)
    for (let i = 0; i < 4; i++) {
      const ph = fa() * 6.28;
      addFlyer(gliderGeo, (un, time, out) => {
        const u = UO(un);
        const k = smoothstep(jump[i][0], jump[i][1], u), peel = smoothstep(0.285 + 0.012 * i, 0.47, u), st = station[i];
        path.posAtDist(un * L + st[1] + 5 * peel, out);
        out.x += st[0] + 0.3 * Math.sin(time * 0.8 + ph) + 62 * peel * Math.sqrt(peel); out.y += -st[2] + 0.18 * Math.sin(time * 1.2 + ph * 2) - 6 * peel; out.y = Math.max(out.y, 1.2);
        out.lerpVectors(perch[i], out, k); out.y += 1.1 * Math.sin(Math.PI * k) * (1 - k);
        return out;
      }, i === 0 ? 1.3 : i < 2 ? 1.15 : 1, (f, un, time) => {
        const u = UO(un);
        const k = smoothstep(jump[i][0], jump[i][1], u);
        f.U.uOpen.value = smoothstep(0.12, 0.6, k); f.roll = (0.22 * Math.sin(time * 0.9 + ph) + 0.08 * Math.sin(time * 2.3 + ph)) * k; f.mesh.visible = u < 0.47;
      });
    }
    // pterosaurs: slide in from the right at u 0.3, keep station through the pass, then pull ahead; one goes through the ring before us
    const pst = [[-6.4, 7.2, 2.2], [-9.2, 9.8, 3.1], [-5.2, 12.5, 0.9]];      // over the open channel on our right, clear of her and of her shadow
    for (let i = 0; i < 3; i++) {
      const ph = fa() * 6.28;
      const dipK = (u) => (i === 2 ? smoothstep(0.455, 0.492, u) * (1 - smoothstep(0.5, 0.54, u)) : 0);
      addFlyer(pteroGeo, (un, time, out) => {
        const u = UO(un);
        const inn = smoothstep(0.27, 0.39, u), lead = smoothstep(0.69, 0.87, u), st = pst[i];
        // the first one slides in close on our right (3 m off, 4 m ahead) from u 0.37 to 0.47, then drifts out to the others
        const nearK = i === 0 ? smoothstep(0.40, 0.455, u) * (1 - smoothstep(0.525, 0.575, u)) : 0;
        const ahead = lerp(st[1], 3.9, nearK) + (i === 0 ? (4.3 - st[1]) * lead : (34 + 9 * i) * lead);
        path.posAtDist(un * L + ahead, out);
        const lat = (lerp(st[0], -0.7, nearK) + (10.5 + 1.5 * i) * smoothstep(0.50 + 0.012 * i, 0.56 + 0.012 * i, u)) * (1 - lead) + (i === 0 ? 0.7 * lead : -(9 + 7 * i) * lead * lead) - 46 * (1 - inn) * (1 - inn);
        out.x += lat + 0.45 * Math.sin(time * 0.6 + ph) * (1 - 0.6 * nearK); out.z += 6 * (1 - inn);
        out.y += -lerp(st[2], 0.7, nearK) * (1 - lead) - (i === 0 ? 0.5 * lead : -15 * lead * lead) + 0.22 * Math.sin(time * 1.1 + ph) * (1 - 0.5 * nearK) + 2.5 * (1 - inn);
        out.y = lerp(Math.max(out.y, 1.0), 0.32, dipK(u));
        return out;
      }, i === 0 ? 1.25 : 1, (f, un, time) => {
        const u = UO(un);
        f.U.uFlap.value = time * 18.85 + ph;
        f.U.uAmp.value = smoothstep(-0.25, 0.3, Math.sin(time * 0.62 + ph)) * (1 - 0.9 * dipK(u)) * 0.75;
        f.roll = 0.16 * Math.sin(time * 0.7 + ph);
        f.mesh.visible = u > 0.255 && (i !== 0 || un * L + 4.3 < L - 0.6);
      });
    }
    updaters.push((dt, time, camera, u) => {
      for (let i = 0; i < flyers.length; i++) {
        const f = flyers[i]; f.roll = 0; f.tick(f, u, time);
        if (!f.mesh.visible) continue;
        f.posFn(u, time, f.mesh.position); f.posFn(u + 0.004, time, _p2); f.posFn(Math.max(0, u - 0.004), time, _p1);
        _f.subVectors(_p2, _p1); if (_f.lengthSq() < 1e-6) _f.set(Math.sin(i * 1.3 - 0.4), 0, Math.cos(i * 1.3 - 0.4)); _f.normalize();
        _u.set(0, 1, 0); _r.crossVectors(_u, _f); if (_r.lengthSq() < 1e-6) _r.set(1, 0, 0); _r.normalize(); _u.crossVectors(_f, _r);
        _m4.makeBasis(_r, _u, _f); f.mesh.quaternion.setFromRotationMatrix(_m4);
        f.mesh.quaternion.multiply(_qr.setFromAxisAngle(Zaxis, f.roll));
      }
    });
    // the second giant: the rare roller out to the right, or the leader of two in line
    const rarePoi = new THREE.Vector3();
    const z2 = (u) => (RARE ? 150 + (u - 0.3) * 330 * (u < 0.3 ? 0.75 : 1) - 190 * Math.max(0, u - 0.38) : titanZ(u) + 47);
    updaters.push((dt, time, camera, un) => {
      const u = UO(un);
      // what the shoals part round: us (our shadow on the water), and her
      const hp = hero.object.position;
      camera.getWorldPosition(_p1);
      avoid[0].set(_p1.x + 1.5, _p1.z + 5, 4.5, 1);
      if (_p1.z > 296) avoid[1].set(_p1.x - 2, _p1.z + 9, 5.5, 1); else avoid[1].set(hp.x, hp.z, 4.2, 0.3);
      if (CAST === 'shoal') { shoalC[2].set(hp.x - 5.5, -3.6, hp.z + 5, 13); avoid[2].set(hp.x, hp.z - 1, 4.4, 0.3); } else avoid[2].set(_p1.x, _p1.z + 6, 4, 1);
      if (!hero2) return;
      const z = z2(u), H2 = hero2.uniforms;
      H2.uTime.value = time; H2.uTrim.value = time * 0.55 + 2;
      if (RARE) {
        hero2.object.position.set(-48, 0, z); hero2.setSwim(z);
        hero2.setTilt(smoothstep(0.235, 0.285, u) * (1 - smoothstep(0.325, 0.385, u)));
        const up = smoothstep(0.278, 0.297, u) * (1 - smoothstep(0.306, 0.34, u));
        H2.uLift.value = 1.55 * up; H2.uRise.value = 0.5 * smoothstep(0.26, 0.297, u) * (1 - smoothstep(0.31, 0.36, u));
        hero2.setBreath((u - 0.28) / 0.085);
      } else {
        hero2.object.position.set(laneX(z) - 2.5, 0, z); hero2.object.rotation.y = Math.atan((laneX(z + 1) - laneX(z - 1)) * 0.5);
        hero2.setSwim(hero.swimAt(u) + 9);
      }
      hero2.headWorld(head2W); head2W.y = 0.06 + 0.16 * H2.uLift.value / 1.55;
    });
    // ------------------------------------------------------------------ the dust veil streaming seaward off the desert
    {
      const nD = Math.round((DUST ? 520 : 300) * detail), g = new THREE.InstancedBufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3)); g.setIndex([0, 1, 2, 0, 2, 3]);
      const dA = new Float32Array(nD * 4), dB = new Float32Array(nD * 4), dr = rng.fork('dust');
      for (let i = 0; i < nD; i++) {
        dA.set([dr.range(-345, -262), dr.range(2, 12) + (DUST ? 9 * dr() : 0), dr.range(-420, 1050), dr()], i * 4);
        dB.set([dr.range(30, 62), dr.range(0.5, 1), dr.range(0.012, 0.03), dr()], i * 4);
      }
      g.setAttribute('dA', new THREE.InstancedBufferAttribute(dA, 4)); g.setAttribute('dB', new THREE.InstancedBufferAttribute(dB, 4)); g.instanceCount = nD;
      const dustMat = new THREE.ShaderMaterial({
        fog: true, transparent: true, depthWrite: false,
        uniforms: { ...fogU(), uTime: LU.uTime, uDustC: { value: col(DUST ? '#DDB392' : PALETTE[6], 0.9) }, uReach: { value: DUST ? 190 : 110 }, uDen: { value: DUST ? 0.125 : 0.06 } },
        vertexShader: /* glsl */`attribute vec4 dA, dB; uniform float uTime, uReach; varying vec2 vUv; varying vec2 vK;
#include <fog_pars_vertex>
void main(){
  float life = fract(uTime * dB.z + dA.w);
  vec3 c = dA.xyz + vec3(life * uReach, life * 5. * dB.w + sin(uTime * .2 + dA.w * 30.) * 1.5, life * 25.);
  vUv = position.xy; vK = vec2(sin(3.14159 * life) * dB.y, dB.w);
  vec4 mvPosition = viewMatrix * vec4(c, 1.);
  mvPosition.xy += position.xy * dB.x * vec2(1.6, .3) * (.7 + .6 * life);
  gl_Position = projectionMatrix * mvPosition;
#include <fog_vertex>
}`,
        fragmentShader: /* glsl */`uniform vec3 uDustC; uniform float uDen; varying vec2 vUv; varying vec2 vK;
#include <fog_pars_fragment>
${NOISE_GLSL}
void main(){
  float r2 = dot(vUv, vUv), n = vn(vUv * 2.2 + vK.y * 40.);
  float a = (1. - smoothstep(.1, 1., r2 + n * .5)) * vK.x * uDen;
  if (a < .003) discard;
  gl_FragColor = vec4(uDustC * (.9 + .25 * n), a);
  #include <fog_fragment>
}`,
      });
      const dust = new THREE.Mesh(g, dustMat); dust.frustumCulled = false; dust.renderOrder = 9; scene.add(dust);
      await ctx.yield();
    }
    //@@FAUNA
    // ------------------------------------------------------------------ the flight
    const _p = new THREE.Vector3(), _q = new THREE.Vector3();
    const heroPoi = (time, un) => {
      const u = UO(un);
      // her mid-body from afar; during the pass a point low and near in the strip of sand between her and her shadow, so that
      // the gaze tips down far enough to hold her tail and the tail of the shadow; then her head for the breath
      const z = titanZ(u), k = smoothstep(0.385, 0.45, u) * .2, k2 = smoothstep(0.47, 0.56, u), blow = smoothstep(0.58, 0.605, u) * (1 - smoothstep(0.625, 0.655, u));
      const along = smoothstep(0.44, 0.48, u) * (1 - smoothstep(0.515, 0.555, u));      // polish2: beside her flank the gaze lifts and runs up her body to her head, so the island and the horizon stay in the frame
      return _q.set(laneX(z) - 1.5 - 1.6 * k * (1 - k2) + 2.0 * k2, -3 - 6 * k * (1 - k2) + 2.2 * k2 + 2.6 * smoothstep(0.635, 0.69, u) + 3.2 * along, z - 5.5 * k * (1 - k2) + 6.6 * k2 + 4.0 * blow + 7 * along);     // breath: her cheek, so that snout and puff lie to the left of centre, shoulder and flipper to the right
    };
    const pace = (un) => {
      const u = UO(un);
      const a = lerp(1.25, 1.45, smoothstep(0.10, 0.20, u)), b = lerp(a, 1.0, smoothstep(0.26, 0.34, u));
      const c = lerp(b, 0.78, smoothstep(0.37, 0.45, u)), d = lerp(c, 1.1, smoothstep(0.67, 0.75, u));
      return lerp(d, 0.92, smoothstep(0.82, 0.9, u));
    };
    return {
      scene, path, duration: 45, pace,
      title: "The Titan's Strait · 202 million years ago",
      camera: { fov: 62, near: 0.3, far: 2500, lookAhead: 30, sway: 0.2, bank: 0.4 },
      // the second entry holds the gaze on her face while we fly beside it (the path there runs past her, not at her)
      pois: RARE ? [{ at: heroPoi, from: -0.2, to: UN(0.775), weight: 0.7, fade: 0.07 }, { at: heroPoi, from: UN(0.585), to: UN(0.765), weight: 0.6, fade: 0.2 }, { at: (time, u) => rarePoi.set(-48, -1, z2(UO(u)) + 5), from: UN(0.2), to: UN(0.4), weight: 0.42, fade: 0.3 }]
        : [{ at: heroPoi, from: -0.2, to: UN(0.775), weight: 0.7, fade: 0.07 }, { at: heroPoi, from: UN(0.585), to: UN(0.765), weight: 0.6, fade: 0.2 }, { at: heroPoi, from: -0.2, to: 0.07, weight: 0.5, fade: 0.06 }],
      portal: { shape: 'circle', radius: 7, color: '#bfe6dc', glow: 0.9, revealDistance: 150 },
      post: { exposure: 0.94, bloom: { strength: 0.25, radius: 0.5, threshold: 0.97 },
        grade: { saturation: 1.12, contrast: 1.06, tint: '#fff8ee', shadowTint: '#06181c', vignette: 0.15, grain: 0.012 } },
      ride: 'none', companion: 'none', style: 'none',
      update(dt, time, camera, u) {
        LU.uTime.value = time;
        sky.update(dt, time, camera);
        const un = u; u = UO(un);                 // the old journey clock (see UO): every scripted moment below reads it
        const hz = titanZ(u);
        hero.object.position.set(laneX(hz), 0, hz);
        hero.object.rotation.y = Math.atan((laneX(hz + 1) - laneX(hz - 1)) * 0.5);
        hero.setProgress(u); hero.setSwim(hz - 105 + time * 1.4); hero.update(dt, time, camera);
        // the breath, keyed to our line: the snout base lifts and she blows at u 0.60 while we are still above and behind her (so the
        // puff rises in front of us, steady camera included); she rolls toward us as we come down beside her head (0.63-0.70) and
        // the puff stands, drifts and thins until 0.72
        hero.setBreath((u - 0.520) / 0.15);      // polish2: earlier, so that the puff stands full-grown over her head at new u 0.52
        HU.uLift.value = 1.55 * smoothstep(0.520, 0.540, u) * (1 - smoothstep(0.600, 0.64, u));
        HU.uRise.value = 0.5 * smoothstep(0.514, 0.553, u) * (1 - smoothstep(0.65, 0.71, u));
        hero.setTilt(smoothstep(0.598, 0.645, u) * (1 - smoothstep(0.685, 0.735, u)));
        hero.headWorld(headW);
        heroW.set(hero.object.position.x, hz, Math.sin(hero.object.rotation.y), Math.cos(hero.object.rotation.y));
        for (let i = 0; i < updaters.length; i++) updaters[i](dt, time, camera, un);
      },
      dispose() { sky.dispose(); },
    };
    //@@RETURN
  },
};
