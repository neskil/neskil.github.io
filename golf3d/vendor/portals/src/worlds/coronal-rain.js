// CORONAL RAIN: behind the heat shield of a probe skimming the Sun. A boiling gold sea of granules on a small curved
// sphere, a sunspot as dark as a lake, a banked S between the legs of a magnetic arcade while rose rain slides down
// its threads, then a 60 degree climb inside the tallest loop to a portal in its crown.
//
// MAP OF THIS FILE (in order)
//   1. CONSTANTS + GLSL    sphere radius and apex (the sea is a real sphere, centre (0,-R,APEX_Z)), GLSL_WORLD = the
//                          shared surface function surfY() (sphere + spot dishes) used by the sea and the jets.
//   2. build(): MOODS      `mood` picked from ctx.vary.hour, else by ctx.rng: quiet | after (the flare) | prominence |
//                          deep. The MOODS table sets sea gain, streamer gain, star count, jet height, rain, exposure.
//                          Seeds also pick the spot kind (round | split | pores), the shield skin, the hero's loops.
//   3. SPOTS + surf()      spot table (S1 the lake, S2, pores), JS mirror of surfY, the light bridge.
//   4. PATH                `PTS`: level entry, 31 degree descent, skim, lake, the S (hero anchors), pull-up, the 60
//                          degree line. uLeg / uClimb are measured from the path and heroU() remaps u for the hero.
//   5. HERO                buildHero placed at anchors.worldOffset; groundAt = surf so feet stand on the sphere.
//   6. SEA                 one fixed polar grid on the sphere; the granule / spot / bridge / ring / ribbon shader.
//                          Granules = gran(): a weighted voronoi (cells swell, are squeezed out and replaced), shaded as
//                          domes: bright crown, darker shoulder, hairline lane, relief from limb darkening on the
//                          tilted shoulder, a second small gran() as froth near the lens, all filtered to the mean
//                          with distance (filt). Uniforms: uSeaGain, uSplash[] (rings), uRib (flare ribbons), uBridge.
//   7. DOME + STARS        black dome with corona streamers and the analytic chromosphere fringe on the limb
//                          (uStream, uJetH); kit glows for ~760 stars (deep mood 1500) and the planet (follow the
//                          camera). ctx.vary.mood scales streamer gain and jet height by +-20% / +-10%.
//   8. JETS                instanced spicule ribbons wrapping round the camera (uJetH, lean round the spots).
//   9. ROPE + ARCADE 2     instanced arch tubes: the twisting ribbon (uLift[0] keyed to u 0.2-0.7) and, in the
//                          `after` mood, a low arcade of new loops rising one after another (uLift[1..6] on time).
//  10. MOOD PIECES         prominence hedgerow (mood prominence), the sungrazing comet (ctx.vary.rare, u 0.15-0.45).
//  11. SHIELD RIG          the vehicle: disc rim, clips, paddles, coolant lines, whip antennas, sparks and motes, all
//                          in a group posed from the camera passed to update() (lags turns by up to 2 degrees).
//                          Uniforms: uUnder (underlight: gold, umber over the lake), uTopL (rose key from above).
//  12. RETURN              the portal star (a kit glow in L1's crown, faded out inside 1.5 km), pois, portal (tilted, in
//                          the hero's eye), post (exposure, bloom, grade), update, dispose.
//
// SCRIPTED MOMENTS (all keyed to u in update()):  rope lift 0.2-0.7 (ropeMat.uLift[0]); comet 0.15-0.45 (uComet);
//   underlight drop over the lake (rigMat.uUnder / uTopL from the camera's distance to S1); flare kernel + new loop
//   + sea ribbons at heroU 0.606-0.675 (hero.setFlare, seaMat.uRib); climb blob heroU 0.74-0.93 (hero.setBlob via
//   hero.setProgress). Ambient loops run on time (granules, filaments, rings, jets, threads, rain, sparks). The climb's
//   two nave ribs and their rain belong to the hero (see its header): their showers are staggered, not keyed.
// BUILD STEPS: every stretch between two `await ctx.yield()` is kept under about 20 ms (typed arrays for the sea grid,
//   yields inside the long loops). The yields sit between sequential statements only: the order of rng draws is fixed.
// THERE IS NO FOG: the sky must stay black. Depth comes from limb darkening in the sea shader, a rose-umber emission
//   haze term there, and the hero's own violet distance dimming. Exposure, bloom and grade are in `post` at the end.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import * as fx from '../kit/fx.js';
import { buildHero } from '../parts/coronal-rain.js';

const PALETTE = ['#FFB52E', '#D9781A', '#34160A', '#FF4F86', '#E9E0FF', '#020204', '#7A2338'];
const R_SUN = 14000, APEX_Z = -2700;      // the sea is a sphere of this radius whose top is at (0, 0, APEX_Z)
const NS = 10, NSP = 12, NLIFT = 8;       // spots, splash rings, arch-tube lift slots
const PI = Math.PI;

// ---------------------------------------------------------------- 1. shared GLSL: the surface
const GLSL_WORLD = /* glsl */`
#define NS ${NS}
#define R_SUN ${R_SUN.toFixed(1)}
uniform vec4 uSpot[NS];     // x, z, umbra radius, penumbra radius (radius 0 = unused)
uniform float uSpotD[NS];   // depth of the dish
float surfY(vec2 p) {
  vec2 q = p - vec2(0.0, ${APEX_Z.toFixed(1)});
  float d2 = min(dot(q, q), R_SUN * R_SUN * 0.9);
  float y = -d2 / (R_SUN + sqrt(R_SUN * R_SUN - d2));
  for (int i = 0; i < NS; i++) {
    float r = uSpot[i].z;
    if (r > 1.0) y -= uSpotD[i] * (1.0 - smoothstep(r * 0.85, r * 1.25, length(p - uSpot[i].xy)));
  }
  return y;
}
`;

const sstep = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const col = (hex) => new THREE.Color(hex);

const MOODS = {
  //            sea gain, streamers, stars, jet height, rain,    exposure, rope tint
  quiet:      { sea: 1.0,  stream: 1.0, stars: 400, jet: 1.0, rain: 'quiet', exposure: 1.0,  title: 'Coronal Rain' },
  after:      { sea: 0.92, stream: 1.3, stars: 400, jet: 1.1, rain: 'heavy', exposure: 0.96, title: 'Coronal Rain: After the Flare' },
  prominence: { sea: 0.86, stream: 2.3, stars: 420, jet: 2.0, rain: 'quiet', exposure: 1.0,  title: 'Coronal Rain: Prominence Country' },
  deep:       { sea: 0.3,  stream: 1.7, stars: 800, jet: 1.0, rain: 'quiet', exposure: 1.12, title: 'Coronal Rain: Deep Light' },
};

export default {
  id: 'coronal-rain',
  name: 'Coronal Rain',
  category: 'sky',
  weirdness: 0.5,
  media: ['space', 'air'],

  async build(ctx) {
    const rng = ctx.rng, detail = ctx.quality?.detail ?? 1;
    const vary = ctx.vary || { hour: 'any', rare: false, density: 1, mood: 0.5 };
    const density = Math.max(0.7, Math.min(1.3, vary.density ?? 1));
    const scene = new THREE.Scene();
    scene.background = col(PALETTE[5]);
    const C = PALETTE.map(col);                     // gold, amber, umber, rose, violet, black, rose-umber
    const time = { value: 0 };
    const disposables = [];

    // ------------------------------------------------------------ 2. moods and per-seed choices
    const byHour = { day: 'quiet', golden: 'after', dawn: 'prominence', night: 'deep' };
    const moodId = byHour[vary.hour] || rng.pick(['quiet', 'quiet', 'after', 'prominence', 'deep']);
    const M = MOODS[moodId];
    const moodK = Math.max(0, Math.min(1, vary.mood ?? 0.5));       // continuous: a calmer or a more active Sun (+-20%)
    const spotKind = rng.pick(['round', 'split', 'pores']);
    const bareShield = rng.chance(0.4);

    // ------------------------------------------------------------ 3. spots and the surface
    const S1 = { x: -120, z: -1900 }, S2 = { x: 150, z: -3700 };
    const spots = [];                               // [x, z, rUmbra, rPenumbra, depth]
    spots.push([S1.x, S1.z, spotKind === 'pores' ? 300 : 340, spotKind === 'pores' ? 560 : 620, 25]);
    if (moodId !== 'prominence') spots.push([S2.x, S2.z, 400, 640, 20]); else spots.push([S2.x, S2.z, 0, 0, 0]);
    const srng = rng.fork('pores');
    const nPores = spotKind === 'pores' ? 8 : 5;
    for (let i = 0; i < nPores && spots.length < NS; i++) {
      const aroundS1 = spotKind === 'pores' && i < 4;
      const a = srng.range(0, PI * 2), c = aroundS1 ? S1 : S2;
      let d = aroundS1 ? srng.range(720, 980) : srng.range(760, 1050);
      let x = c.x + Math.cos(a) * d, z = c.z + Math.sin(a) * d;
      if (aroundS1 && Math.abs(x) < 170) x = (x < 0 ? -1 : 1) * srng.range(190, 320);      // keep the skim over granules
      const r = srng.range(30, 60);
      spots.push([x, z, r, r * 1.3, 7]);
    }
    while (spots.length < NS) spots.push([0, 0, 0, 0, 0]);
    function surf(x, z) {
      const qx = x, qz = z - APEX_Z, d2 = Math.min(qx * qx + qz * qz, R_SUN * R_SUN * 0.9);
      let y = -d2 / (R_SUN + Math.sqrt(R_SUN * R_SUN - d2));
      for (const s of spots) if (s[2] > 1) y -= s[4] * (1 - sstep(s[2] * 0.85, s[2] * 1.25, Math.hypot(x - s[0], z - s[1])));
      return y;
    }
    const worldU = {
      uSpot: { value: spots.map((s) => new THREE.Vector4(s[0], s[1], s[2], s[3])) },
      uSpotD: { value: spots.map((s) => s[4]) },
      uTime: time,
      cGold: { value: C[0] }, cAmber: { value: C[1] }, cUmber: { value: C[2] }, cRose: { value: C[3] }, cViolet: { value: C[4] }, cRoseDeep: { value: C[6] },
    };
    // the light bridge: a chord (round, pores) or a diameter (split) of S1's umbra, crossed by the path
    const brA = rng.range(-0.35, 0.35), rU1 = spots[0][2];
    const brOff = spotKind === 'split' ? rng.range(-20, 20) : rng.range(90, 150);     // towards the entry (+z)
    const brHalf = Math.sqrt(Math.max(1, rU1 * rU1 - brOff * brOff)) + 60;
    const bridge = new THREE.Vector4(S1.x - Math.cos(brA) * brHalf, S1.z + brOff - Math.sin(brA) * brHalf, S1.x + Math.cos(brA) * brHalf, S1.z + brOff + Math.sin(brA) * brHalf);
    const bridgeW = spotKind === 'split' ? 76 : 54;

    // ------------------------------------------------------------ 4. the path
    const HERO_Z = -3040;
    const PTS = [
      [0, 400, 0], [0, 400, -150], [0, 400, -290], [0, 378, -400], [0, 300, -535], [0, 180, -735], [0, 70, -915], [0, 15, -1020],
      [0, 2, -1120], [0, 20, -1300], [-15, 38, -1480], [-62, 46, -1690],
      [-120, 58, -1900], [-30, 76, -2030], [60, 86, -2140], [88, 90, -2240], [78, 96, -2320], [63, 104, -2390],
      [30, 135, -2465], [6, 180, -2530], [0, 209, -2560],
    ];
    const climbDir = new THREE.Vector3(0, 831, -480).normalize();
    for (let d = 137; d < 959; d += 137) PTS.push([0, 209 + climbDir.y * d, -2560 + climbDir.z * d]);
    PTS.push([0, 1040, HERO_Z]);
    const path = ctx.core.makePath(PTS);
    // where the hero's keyed beats fall on this path: the leg-pass frame and the start of the 60 degree line
    await ctx.yield();
    const _p = new THREE.Vector3(), _pl = new THREE.Vector3(88, 90, -2240), _pc = new THREE.Vector3(0, 209, -2560);
    let uLeg = 0.6, uClimb = 0.74, bestLeg = 1e9, bestClimb = 1e9;
    for (let i = 0; i <= 800; i++) {
      path.pointAt(i / 800, _p);
      const dl = _p.distanceTo(_pl), dc = _p.distanceTo(_pc);
      if (dl < bestLeg) { bestLeg = dl; uLeg = i / 800; }
      if (dc < bestClimb) { bestClimb = dc; uClimb = i / 800; }
      if (i % 100 === 99) await ctx.yield();
    }
    const heroU = (u) => u <= uLeg ? u * 0.6 / uLeg : u <= uClimb ? 0.6 + (u - uLeg) / (uClimb - uLeg) * 0.14 : 0.74 + (u - uClimb) / (1 - uClimb) * 0.26;
    await ctx.yield();

    // ------------------------------------------------------------ 5. the hero: the arcade and its rain
    const hero = await buildHero({ ...ctx, rng: rng.fork('hero') }, {
      palette: PALETTE, rain: M.rain, far: [1700, 5600],
      groundAt: (x, z) => surf(x, z + HERO_Z),
    });
    hero.object.position.copy(hero.anchors.worldOffset);
    scene.add(hero.object);
    const kernelW = hero.anchors.kernel.clone().add(hero.anchors.worldOffset);
    await ctx.yield();

    // ------------------------------------------------------------ 6. the sea: a fixed polar grid on the sphere
    {
      const RINGS = 128, SECT = 200, RMAX = 9200;
      const pos = new Float32Array((1 + RINGS * SECT) * 3), idx = new Uint32Array((SECT + (RINGS - 1) * SECT * 2) * 3);
      let pi = 3, ii = 0;
      for (let i = 1; i <= RINGS; i++) {
        const r = RMAX * Math.pow(i / RINGS, 1.8);
        for (let k = 0; k < SECT; k++) { const a = (k + (i % 2) * 0.5) / SECT * PI * 2; pos[pi++] = Math.cos(a) * r; pos[pi++] = 0; pos[pi++] = Math.sin(a) * r; }
        if (i % 24 === 0) await ctx.yield();
      }
      for (let k = 0; k < SECT; k++) { idx[ii++] = 0; idx[ii++] = 1 + (k + 1) % SECT; idx[ii++] = 1 + k; }
      for (let i = 1; i < RINGS; i++) {
        for (let k = 0; k < SECT; k++) {
          const a = 1 + (i - 1) * SECT + k, b = 1 + (i - 1) * SECT + (k + 1) % SECT, c = a + SECT, d = b + SECT;
          idx[ii++] = a; idx[ii++] = b; idx[ii++] = c; idx[ii++] = b; idx[ii++] = d; idx[ii++] = c;
        }
        if (i % 24 === 0) await ctx.yield();
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setIndex(new THREE.BufferAttribute(idx, 1));
      geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, APEX_Z), RMAX * 1.5);
      await ctx.yield();
      var seaMat = new THREE.ShaderMaterial({
        uniforms: {
          ...worldU,
          uBridge: { value: bridge }, uBridgeW: { value: bridgeW },
          uSplash: { value: Array.from({ length: NSP }, () => new THREE.Vector4(0, 0, 0, 0)) },
          uRib: { value: new THREE.Vector4(kernelW.x, kernelW.z, 0, 0) }, uRibDir: { value: new THREE.Vector2(0.94, -0.34) },
          uSeaGain: { value: M.sea }, uRoseAt: { value: new THREE.Vector3(-60, -2380, moodId === 'after' ? 0.085 : 0.05) },
        },
        vertexShader: GLSL_WORLD + /* glsl */`
          varying vec3 vW;
          void main() {
            vec2 p = position.xz + vec2(0.0, ${APEX_Z.toFixed(1)});
            vW = vec3(p.x, surfY(p), p.y);
            gl_Position = projectionMatrix * viewMatrix * vec4(vW, 1.0);
          }`,
        fragmentShader: fx.GLSL_NOISE + GLSL_WORLD + /* glsl */`
          #define NSP ${NSP}
          varying vec3 vW;
          uniform float uTime, uBridgeW, uSeaGain;
          uniform vec3 cGold, cAmber, cUmber, cRose, cViolet, cRoseDeep, uRoseAt;
          uniform vec4 uBridge, uRib, uSplash[NSP];
          uniform vec2 uRibDir;
          // granules: a weighted voronoi of moving cell points. Every cell's weight swells and sinks on its own 8-14 s
          // clock, so cells well up, spread to their lanes, are squeezed out and replaced without popping, and no two
          // are the same size (no paving). Returns (distance to the cell edge, cell id, distance to the cell point)
          // in cell units; gN = unit vector toward the nearest edge (downhill on the dome); gW = the cell's weight
          // -1..1 (1 = fully grown).
          vec3 gran(vec2 x, float t, out vec2 gN, out float gW) {
            vec2 n = floor(x), f = fract(x), mg = vec2(0.0), mr = vec2(0.0); float md = 8.0, id = 0.0; gW = 0.0;
            for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
              vec2 g = vec2(float(i), float(j)), h = hash22(n + g);
              vec2 o = 0.5 + 0.36 * sin(t * (0.35 + 0.4 * h.yx) + 6.2831 * h);
              float w = sin(t * (0.45 + 0.3 * h.x) + h.y * 43.0);
              vec2 r = g + o - f; float d = dot(r, r) - 0.15 * w;
              if (d < md) { md = d; mr = r; mg = g; gW = w; id = hash12(n + g + 17.3); }
            }
            // the edge distance is a smooth minimum over the neighbours, so cells have rounded corners (not cracked
            // tiles) and gN, its gradient, turns smoothly and dies away on the crown: a dome, not a pyramid
            float acc = 0.0; vec2 an = vec2(0.0);
            for (int j = -2; j <= 2; j++) for (int i = -2; i <= 2; i++) {
              vec2 g = mg + vec2(float(i), float(j)), h = hash22(n + g);
              vec2 o = 0.5 + 0.36 * sin(t * (0.35 + 0.4 * h.yx) + 6.2831 * h);
              float w = sin(t * (0.45 + 0.3 * h.x) + h.y * 43.0);
              vec2 r = g + o - f, dr = r - mr; float l2 = dot(dr, dr);
              if (l2 > 0.00001) { float l = sqrt(l2), e = max((dot(r, r) - 0.15 * w - md) / (2.0 * l), 0.0), k = exp(-13.0 * e); acc += k; an += k * dr / l; }
            }
            acc = max(acc, 1e-9); gN = an / acc;
            return vec3(max(-log(acc) / 13.0, 0.0), id, length(mr));
          }
          void main() {
            vec2 p = vW.xz;
            vec3 V = cameraPosition - vW; float dist = length(V); V /= max(dist, 1e-3);
            vec3 N = normalize(vW - vec3(0.0, -R_SUN, ${APEX_Z.toFixed(1)}));
            float mu = clamp(dot(N, V), 0.0, 1.0), k = sqrt(mu);
            vec2 ddx = dFdx(p), ddy = dFdy(p);                       // derivatives before any loop
            float fa = max(length(ddx), length(ddy)), fi = min(length(ddx), length(ddy));
            float t = uTime;

            // ---- spots: umbra, penumbral filaments (grains creep inward), plage round them
            float umb = 0.0, pen = 0.0, penL = 0.0, nearSpot = 0.0;
            float filt2 = smoothstep(2.5, 9.0, fa);
            for (int i = 0; i < NS; i++) {
              vec4 s = uSpot[i];
              if (s.z < 1.0) continue;
              vec2 v = p - s.xy; float d = length(v);
              if (d > s.w * 1.9) continue;
              vec2 dn = v / max(d, 1.0); float K = s.w / 5.5;
              float n1 = vnoise(vec3(dn * K * 0.4, float(i) * 3.7));
              float lo = vnoise(vec3(dn * 3.0, float(i) + 0.5));
              float rag = n1 - 0.5;
              float ui = 1.0 - smoothstep(0.9, 1.06, d / s.z + rag * 0.22 + (lo - 0.5) * 0.2);
              float pi_ = 1.0 - smoothstep(0.9, 1.04, d / s.w + rag * 0.1 + (lo - 0.5) * 0.14);
              float fil = vnoise(vec3(dn * K, d / 120.0 + t * 0.03 + n1 * 2.0));
              float grain = vnoise(vec3(dn * K * 2.1, d / 30.0 + t * 0.11));
              float fine = vnoise(vec3(dn * K * 3.1, d / 300.0 + 4.0));
              float fb = mix(smoothstep(0.4, 0.58, fil) * (0.45 + 0.55 * smoothstep(0.3, 0.6, fine)), 0.4, filt2);
              float radial = mix(0.55, 1.1, clamp((d - s.z) / max(s.w - s.z, 1.0), 0.0, 1.0));
              float L = mix(0.06, 0.95, fb) * mix(0.55 + 0.9 * grain * grain, 1.0, filt2) * radial;
              if (pi_ > pen) { pen = pi_; penL = L; }
              umb = max(umb, ui);
              nearSpot = max(nearSpot, 1.0 - smoothstep(1.0, 1.9, d / s.w));
            }
            // ---- the light bridge: a tongue of granulation across S1
            vec2 ba = uBridge.zw - uBridge.xy;
            float hb = clamp(dot(p - uBridge.xy, ba) / max(dot(ba, ba), 1.0), 0.0, 1.0);
            float bd = length(p - uBridge.xy - ba * hb) + (vnoise(p / 55.0) - 0.5) * 22.0;
            float br = 1.0 - smoothstep(uBridgeW * 0.5 - 6.0, uBridgeW * 0.5 + 6.0, bd);
            umb *= 1.0 - br; pen *= 1.0 - br;

            // ---- granules: domed cells with bright crowns, darker shoulders and hairline lanes
            float sc = mix(40.0, 26.0, br), fc = fa / sc, fic = fi / sc;
            vec2 pw = p + (vec2(vnoise(p / 31.0), vnoise(p / 31.0 + 17.3)) - 0.5) * 24.0;        // warped: no straight edges
            vec2 gN; float gW;
            vec3 g = gran(pw / sc + vec2(3.7, 1.9), t, gN, gW);
            float life = 0.5 + 0.5 * gW;
            float filt = smoothstep(0.045, 0.3, fc);                    // the pattern melts to its mean well before a pixel nears a cell: no crackle in the mid field
            float nearK = 1.0 - smoothstep(0.5, 2.4, fa);               // fine structure only where a pixel is under about 2 m
            float wl = max(0.012 + 0.014 * (1.0 - life), 0.7 * fic);    // the hairline at the bottom of each lane, never under 0.7 px
            float midK = smoothstep(0.015, 0.07, fc);                   // 0 near the lens (domes) .. 1 where a cell is ~15 px (a gold field with hairline seams)
            float lane = 1.0 - smoothstep(wl, wl + 0.012 + fc * 0.4, g.x);
            float eg = max(g.x - wl, 0.0), shd = exp(-eg * 10.0);        // shd: 1 on the shoulder beside the lane, 0 on the crown
            float cen = 1.0 - smoothstep(0.0, 0.7, g.z);
            // one old cell in a few darkens at its centre before it bursts
            float pit = smoothstep(0.72, 1.0, life) * step(0.55, g.y) * (1.0 - smoothstep(0.05, 0.26, g.z));
            float top = (mix(0.4, 0.66, midK) + mix(0.34, 0.2, midK) * (1.0 - shd) + mix(0.3, 0.16, midK) * cen) * (0.74 + 0.26 * life) * (1.0 - 0.42 * pit);
            float sub = 1.0;                                            // the boiling froth on the cell tops, near the lens
            if (nearK > 0.01) {
              vec2 sN; float sW;
              vec3 g2 = gran(pw / 6.3 + g.y * 13.0 + vec2(t * 0.03, -t * 0.02), t * 1.6, sN, sW);
              float fine = vnoise(p / 1.9 + vec2(t * 0.21, -t * 0.13));
              sub = mix(1.0, (0.64 + 0.5 * smoothstep(0.0, 0.26, g2.x) + 0.06 * sW) * (0.88 + 0.24 * fine), nearK * (1.0 - 0.5 * shd));
            }
            // dome relief: the shoulder's slope tilts the normal, and limb darkening then brightens the shoulder that
            // faces the lens and turns the far one umber
            vec3 Nl = normalize(N + vec3(gN.x, 0.0, gN.y) * (0.6 * shd * (1.0 - lane)));
            float rel = clamp(dot(Nl, V) / max(mu, 0.1), 0.5, 1.5);
            float tex = vnoise(p / 6.5 + g.y * 31.0 + vec2(t * 0.11, -t * 0.07));
            float L = top * sub * mix(1.0, rel, 0.8 - 0.55 * midK) * (0.9 + 0.2 * tex);
            L = mix(L, mix(0.11, 0.36, midK), lane);
            // filtered to the mean, with a low-contrast grain left on the mean so the mid field is a soft mottle, not flat
            L = mix(L, 0.6 * (0.9 + 0.2 * vnoise(p / 85.0 + vec2(t * 0.01, 3.0))), filt);
            float hue = mix((1.0 - lane) * (1.0 - shd) * (0.5 + 0.5 * cen) * clamp(rel, 0.55, 1.2), 0.55, filt);
            float core = smoothstep(0.02, 0.09, g.x);                  // 0 in the lanes and along their edges
            // magnetic bright points winking in the lanes
            float bpn = vnoise(p / 13.0 + 11.0);
            float bp = (1.0 - core) * smoothstep(0.62, 0.8, bpn) * smoothstep(0.35, 0.8, vnoise(p / 21.0 + vec2(t * 0.35, -t * 0.27))) * (1.0 - filt);
            // the slow 300 m mottle and the plage round the spots
            float mot = vnoise(p / 300.0 + vec2(t * 0.004, t * 0.003)) * 0.62 + vnoise(p / 120.0 - vec2(t * 0.006, 0.0)) * 0.38;
            float plage = nearSpot * smoothstep(0.42, 0.75, vnoise(p / 95.0 + 7.0));
            L *= (0.72 + 0.5 * mot) * (1.0 + 0.22 * plage) * (1.0 + 0.2 * br);
            L = L * mix(uSeaGain, 1.0, clamp(plage * 0.75, 0.0, 1.0)) + bp * 0.85;
            hue = max(hue, bp);
            float lim = 0.46 + 0.54 * k;
            vec3 seaC = mix(cAmber, cGold, (0.3 + 0.7 * hue) * smoothstep(0.08, 0.5, k) * mix(1.0, 0.25, 1.0 - uSeaGain));
            seaC = mix(vec3(0.62, 0.12, 0.022), seaC, smoothstep(0.02, 0.36, k));
            seaC = mix(seaC, vec3(1.0, 0.62, 0.16), 0.32 * smoothstep(0.78, 1.0, L) * smoothstep(0.25, 0.6, k) * uSeaGain);   // crowns: pale gold, never white
            vec3 col = seaC * min(L, 1.0) * lim;

            // ---- penumbra and umbra
            vec3 penC = mix(cAmber, cGold, 0.25 + 0.5 * penL) * penL * (0.55 + 0.45 * k) * mix(uSeaGain, 1.0, 0.4) + cUmber * 0.6;
            col = mix(col, penC, pen);
            float un = vnoise(p / 70.0 + vec2(t * 0.02, 0.0));
            vec3 uc = vec3(0.044, 0.019, 0.009) * (0.4 + 1.0 * un);
            vec2 dc = p / 17.0, di = floor(dc), dh = hash22(di);
            float dr = length((fract(dc) - 0.2 - 0.6 * dh) * 17.0);
            float rad = max(1.4 + 2.6 * dh.x * dh.y, fi * 0.9);
            float ember = (1.0 - smoothstep(rad * 0.35, rad, dr)) * step(0.4, hash12(di + 5.0)) * max(0.0, 0.5 + 0.5 * sin(t * (0.8 + 2.0 * dh.y) + dh.x * 40.0));
            uc += mix(cAmber, cGold, dh.x) * ember * 0.75 * (1.0 - smoothstep(6.0, 22.0, fa));
            uc += cRose * uRoseAt.z * exp(-length(p - uRoseAt.xy) / 420.0) * (0.6 + 0.8 * un);
            col = mix(col, uc, umb);

            // ---- rings that ripple out where a shower lands
            float ring = 0.0;
            for (int i = 0; i < NSP; i++) {
              vec4 s = uSplash[i];
              if (s.z <= 0.0) continue;
              float sec = fract(t / s.z + s.w - 0.905) * s.z, d = length(p - s.xy);
              float rr = 16.0 + 46.0 * sec, w = 5.0 + 1.6 * sec + fa;
              float a = exp(-sec * 0.45) * (1.0 - smoothstep(4.5, 7.0, sec));
              float q = (d - rr) / w, q2 = (d - rr * 0.62) / w;
              ring += (exp(-q * q) + 0.5 * exp(-q2 * q2)) * a;
            }
            col = col * (1.0 + 0.45 * ring) + (cRose * 0.5 + vec3(0.16, 0.09, 0.06)) * ring * (0.3 + 0.7 * max(umb, pen));

            // ---- the flare: two rose ribbons running along the surface either side of the kernel
            if (uRib.w > 0.001) {
              vec2 rp = p - uRib.xy; float a = dot(rp, uRibDir), c = dot(rp, vec2(-uRibDir.y, uRibDir.x));
              float wob = (vnoise(vec2(a / 85.0, sign(c) * 3.0 + 9.0)) - 0.5) * 60.0;
              float cc = abs(c) - 150.0 + wob, ext = uRib.z * 640.0, w = 6.0 + fa * 0.7;
              float run = 1.0 - smoothstep(ext - 90.0, ext, abs(a));
              float rib = exp(-cc * cc / (w * w)) * run * uRib.w * (0.65 + 0.35 * vnoise(vec2(a / 14.0 - t * 2.0, 1.0)));
              col += cRose * (rib * 1.1 + exp(-abs(cc) / 30.0) * run * uRib.w * 0.16) + vec3(1.0, 0.85, 0.9) * rib * rib * 0.5;
            }
            // ---- rose-umber emission haze: the only depth cue above the surface
            col += cRoseDeep * 0.4 * (1.0 - exp(-dist / 2600.0)) * (1.0 - k);
            gl_FragColor = vec4(max(col, 0.0), 1.0);
          }`,
      });
      await ctx.yield();
      const sea = new THREE.Mesh(geo, seaMat); sea.frustumCulled = false; sea.name = 'sea';
      scene.add(sea);
    }
    // the splash rings the sea draws: the hero's near-foot showers first, then the far ones
    {
      const sp = hero.anchors.splashes.slice().sort((a, b) => (b.near ? 1 : 0) - (a.near ? 1 : 0)).slice(0, NSP);
      sp.forEach((s, i) => seaMat.uniforms.uSplash.value[i].set(s.x, s.z + HERO_Z, s.period, s.phase));
    }
    await ctx.yield();

    // ------------------------------------------------------------ 7. the dome: black, corona streamers, the limb's rose fringe
    const uPx = { value: 0.0028 };                  // world size of one pixel at 1 m (set every frame)
    const domeMat = new THREE.ShaderMaterial({
      uniforms: { ...worldU, uStream: { value: M.stream * (0.8 + 0.4 * moodK) }, uJetH: { value: M.jet * (0.9 + 0.2 * moodK) } },
      side: THREE.BackSide, depthWrite: false, depthTest: false,
      vertexShader: /* glsl */`
        varying vec3 vDir;
        void main() { vDir = position; gl_Position = projectionMatrix * viewMatrix * vec4(cameraPosition + position * 8200.0, 1.0); }`,
      fragmentShader: fx.GLSL_HASH + fx.GLSL_VALUE_NOISE + /* glsl */`
        varying vec3 vDir;
        uniform float uTime, uStream, uJetH;
        uniform vec3 cGold, cRose, cViolet, cRoseDeep;
        void main() {
          vec3 v = normalize(vDir);
          vec3 oc = cameraPosition - vec3(0.0, -${R_SUN.toFixed(1)}, ${APEX_Z.toFixed(1)});
          float Lc = max(length(oc), 1.0); vec3 n = oc / Lc;
          float alpha = asin(clamp(${R_SUN.toFixed(1)} / Lc, 0.0, 1.0));
          float el = acos(clamp(-dot(v, n), -1.0, 1.0)) - alpha;         // radians above the limb
          vec3 e1 = normalize(cross(n, vec3(1.0, 0.0, 0.0))), e2 = cross(n, e1);
          float az = atan(dot(v, e2), dot(v, e1) + 1e-5);                  // seam behind the entry
          // corona: pearl-violet streamers rising radially, drifting sideways very slowly
          float drift = uTime * 0.004;
          float s1 = vnoise(vec2(az * 9.0 + drift, 1.3));
          float s2 = vnoise(vec2(az * 31.0 - drift * 2.3, 4.1 + el * 2.0));
          float s3 = vnoise(vec2(az * 83.0 + drift * 4.0, 9.7 + el * 5.0));
          float streak = s1 * s1 * (0.3 + 0.7 * s2 * s2) * (0.45 + 0.55 * s3) * 1.9;
          float I = 0.25 * uStream * exp(-max(el, 0.0) / mix(0.05, 0.15, s1)) * (0.08 + 0.92 * streak) * (1.0 - smoothstep(0.28, 0.44, el));
          vec3 col = cViolet * I;
          // chromosphere: a rose hairline on the limb, ragged with flame jets
          float j1 = vnoise(vec2(az * 520.0, uTime * 0.22));
          float j2 = vnoise(vec2(az * 170.0 + 3.0, uTime * 0.09));
          float j3 = vnoise(vec2(az * 40.0 + 8.0, uTime * 0.03));
          float h = (0.007 + 0.02 * j1 * j1 * (0.4 + 0.6 * j2) + 0.008 * j3) * mix(1.0, uJetH, 0.6);
          float e = max(el, 0.0) / h;
          float chrom = 1.0 - smoothstep(0.3, 1.0, e);
          col += (mix(cRose * 0.95, cRoseDeep * 0.9, smoothstep(0.0, 0.9, e)) + vec3(1.0, 0.8, 0.6) * 0.22 * exp(-e * 7.0)) * chrom;
          if (el < 0.0) col = vec3(0.62, 0.12, 0.022) * 0.46 * 0.6 + cRoseDeep * 0.3;
          gl_FragColor = vec4(max(col, 0.0), 1.0);
        }`,
    });
    const dome = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 4), domeMat);
    dome.frustumCulled = false; dome.renderOrder = -10; scene.add(dome);
    await ctx.yield();

    // stars and one steady planet: kit glows on a shell that follows the camera
    const skyGroup = new THREE.Group(); scene.add(skyGroup);
    {
      const sr = rng.fork('stars'), positions = [], sizes = [], n = Math.round(M.stars * 1.9 * (0.6 + 0.4 * detail));
      const v = new THREE.Vector3();
      let guard = 0;
      while (positions.length < n && guard++ < 20000) {
        v.set(sr.gauss(), sr.gauss(), sr.gauss());
        if (v.lengthSq() < 1e-4) continue;
        v.normalize();
        if (v.y < -0.32) continue;
        const up = sstep(-0.25, 0.45, v.y);                       // fewer and dimmer near the limb
        if (!sr.chance(0.22 + 0.78 * up)) continue;
        positions.push([v.x * 7800, v.y * 7800, v.z * 7800]); sizes.push(sr.range(0.6, 1.6) * (0.5 + 0.5 * up) * (sr.chance(0.09) ? 1.9 : 1));
      }
      await ctx.yield();
      const stars = fx.makeGlows({ rng: sr, positions, sizes, colors: ['#ffffff', '#E9E0FF', '#fff1d6', '#cfd8ff'], size: 36, intensity: 4.4, halo: 0.5,
        flicker: 0.12, minAngle: 0.0062, fogAmount: 0, time, renderOrder: -5 });
      stars.object.frustumCulled = false; skyGroup.add(stars.object);
      const planet = fx.makeGlow({ rng: sr, position: [-3100, 3250, -6400], color: '#ffe6bd', size: 95, intensity: 2.6, halo: 1, spikes: 0, flicker: 0, minAngle: 0.009, fogAmount: 0, time, renderOrder: -5 });
      planet.object.frustumCulled = false; skyGroup.add(planet.object);
    }
    await ctx.yield();

    // ------------------------------------------------------------ 8. the jets: spicule ribbons wrapping round the camera
    const JBOX = 1150;
    const jetU = { ...worldU, uCen: { value: new THREE.Vector2(0, -400) }, uBox: { value: JBOX }, uJetH: { value: Math.min(M.jet * (0.9 + 0.2 * moodK), 1.7) }, uPx };
    {
      const SEG = 6, bp = [], bi = [];
      for (let j = 0; j <= SEG; j++) bp.push(-1, j / SEG, 0, 1, j / SEG, 0);
      for (let j = 0; j < SEG; j++) { const a = j * 2; bi.push(a, a + 1, a + 2, a + 2, a + 1, a + 3); }
      const nJ = Math.round(8500 * detail * density), jr = rng.fork('jets');
      const aB = new Float32Array(nJ * 4), aR = new Float32Array(nJ * 4);
      for (let i = 0; i < nJ; i++) {
        // clumps: a third of the blades sit near the one before, so the jets stand in tufts
        if (i > 0 && jr.chance(0.6)) { aB[i * 4] = (aB[(i - 1) * 4] + jr.gauss() * 0.006 + 1) % 1; aB[i * 4 + 1] = (aB[(i - 1) * 4 + 1] + jr.gauss() * 0.006 + 1) % 1; }
        else { aB[i * 4] = jr(); aB[i * 4 + 1] = jr(); }
        aB[i * 4 + 2] = jr(); aB[i * 4 + 3] = jr.range(30, 45);
        aR[i * 4] = jr.range(5, 9); aR[i * 4 + 1] = jr.range(2, 3); aR[i * 4 + 2] = jr(); aR[i * 4 + 3] = jr();
      }
      const geo = new THREE.InstancedBufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(bp, 3)); geo.setIndex(bi);
      geo.setAttribute('aB', new THREE.InstancedBufferAttribute(aB, 4)); geo.setAttribute('aR', new THREE.InstancedBufferAttribute(aR, 4));
      geo.instanceCount = nJ;
      const mat = new THREE.ShaderMaterial({
        uniforms: jetU, transparent: true, depthWrite: false, side: THREE.DoubleSide,
        vertexShader: fx.GLSL_HASH + fx.GLSL_VALUE_NOISE + GLSL_WORLD + /* glsl */`
          attribute vec4 aB, aR;
          uniform vec2 uCen; uniform float uBox, uJetH, uTime, uPx;
          varying vec3 vJ;   // across, along, dim
          varying vec2 vS;   // seed, hue
          void main() {
            vec2 base = uCen + (fract(aB.xy - uCen / uBox) - 0.5) * uBox;
            vec2 rel = (base - uCen) / (uBox * 0.5);
            float edge = 1.0 - smoothstep(0.72, 1.0, max(abs(rel.x), abs(rel.y)));
            // densest along the dark lanes of the 300 m mottle and round the spots; none in the umbra
            float mot = vnoise(base / 300.0 + vec2(uTime * 0.004, uTime * 0.003)) * 0.62 + vnoise(base / 120.0 - vec2(uTime * 0.006, 0.0)) * 0.38;
            float dens = smoothstep(0.54, 0.3, mot) * 0.95 + 0.03;
            float fa_ = vnoise(base / 420.0 + 3.0) * 12.566;
            vec2 lean = vec2(cos(fa_), sin(fa_));
            float tall = 1.0;
            for (int i = 0; i < NS; i++) {
              vec4 s = uSpot[i];
              if (s.z < 1.0) continue;
              vec2 v = base - s.xy; float d = length(v), q = d / s.w;
              float shore = smoothstep(0.9, 1.0, q) * (1.0 - smoothstep(1.02, 1.3, q)) * 0.5 * (0.4 + 0.6 * vnoise(base / 60.0 + 5.0));
              dens = max(dens * smoothstep(0.8, 1.0, q), shore);
              lean = mix(lean, v / max(d, 1.0), 1.0 - smoothstep(1.0, 1.7, q));       // like reeds round a pond
              tall = max(tall, 1.0 + 0.25 * shore);
            }
            float keep = smoothstep(0.0, 0.12, dens - aR.z * 0.92);
            float ph = fract(uTime / aR.x + aB.z);
            float up = pow(max(sin(3.14159265 * ph), 0.0), 0.7);
            float H = aB.w * uJetH * tall * up * edge * keep;
            float y = position.y;
            float amt = 0.3 + 0.14 * sin(uTime * 0.8 + aB.z * 6.2831) + 0.25 * (1.0 - up);
            vec3 b3 = vec3(base.x, surfY(base) - 1.0, base.y);
            vec3 L3 = vec3(lean.x, 0.0, lean.y);
            vec3 P = b3 + vec3(0.0, 1.0, 0.0) * H * y + L3 * H * amt * y * y + L3 * sin(uTime * 1.3 + aB.z * 40.0 + y * 3.0) * 0.6 * y;
            vec3 T = normalize(vec3(0.0, 1.0, 0.0) + L3 * amt * 2.0 * y);
            vec3 toCam = cameraPosition - P; float dist = length(toCam);
            vec3 side = normalize(cross(T, toCam) + vec3(1e-4, 0.0, 0.0));
            float w = aR.y * 0.62 * (1.0 - 0.86 * y) * (0.6 + 0.4 * up);
            float wmin = 0.75 * uPx * dist, dim = w / max(w, wmin);
            P += side * position.x * max(w, wmin);
            vJ = vec3(position.x, y, dim * step(0.5, H) * (1.0 - smoothstep(380.0, 640.0, dist)));
            vS = vec2(aB.z, aR.w);
            gl_Position = projectionMatrix * viewMatrix * vec4(P, 1.0);
          }`,
        fragmentShader: fx.GLSL_HASH + fx.GLSL_VALUE_NOISE + /* glsl */`
          uniform vec3 cGold, cAmber, cRose, cRoseDeep; uniform float uTime;
          varying vec3 vJ; varying vec2 vS;
          void main() {
            float x = vJ.x, y = vJ.y;
            float fl = 0.72 + 0.4 * vnoise(vec2(y * 5.0 - uTime * 1.3 + vS.x * 30.0, vS.x * 9.0));
            vec3 c = mix(mix(cGold, cAmber, 0.5) * 0.8, mix(cRose, cRoseDeep, 0.2 + 0.35 * vS.y) * 1.15, smoothstep(0.03, 0.42, y));
            float a = (1.0 - x * x) * (1.0 - y * y * y) * vJ.z * smoothstep(0.0, 0.06, y);
            gl_FragColor = vec4(max(c * fl * (0.95 - 0.2 * y), 0.0), clamp(a * 0.8, 0.0, 1.0));
          }`,
      });
      const jets = new THREE.Mesh(geo, mat); jets.frustumCulled = false; jets.renderOrder = 1; scene.add(jets);
    }
    await ctx.yield();

    // ------------------------------------------------------------ 9. arch tubes: the twisting ribbon and (mood `after`) the low arcade
    // one instanced tube: aA = feet (ax, az, bx, bz), aP = (height, strand radius, strand angle, twist turns),
    // aQ = (tube radius, lift slot, gold 0..1, seed). uLift[slot] = (lift 0..1, gain).
    const ribCen = moodId === 'after' ? new THREE.Vector2(-100, -2330) : new THREE.Vector2(kernelW.x, kernelW.z);
    const ribDir = seaMat.uniforms.uRibDir.value, ribNrm = new THREE.Vector2(-ribDir.y, ribDir.x);
    seaMat.uniforms.uRib.value.set(ribCen.x, ribCen.y, moodId === 'after' ? 1 : 0, moodId === 'after' ? 0.8 : 0);
    const ropeU = { ...worldU, uPx, uLift: { value: Array.from({ length: NLIFT }, () => new THREE.Vector2(0, 0)) } };
    {
      const SEGS = 110, SIDES = 6, tp = [], ti = [];
      for (let j = 0; j <= SEGS; j++) for (let k = 0; k <= SIDES; k++) tp.push(j / SEGS, k / SIDES, 0);
      for (let j = 0; j < SEGS; j++) for (let k = 0; k < SIDES; k++) { const a = j * (SIDES + 1) + k, b = a + SIDES + 1; ti.push(a, a + 1, b, b, a + 1, b + 1); }
      const rr = rng.fork('rope'), A = [], P = [], Q = [];
      const hand = rr.sign();
      for (let k = 0; k < 4; k++) {                 // the rope: three braided strands and a thin core
        A.push(520, -3150, 1150, -3500);
        if (k < 3) { P.push(900, 40, k * 2.094, hand * 5.5); Q.push(15, 0, 0.0, rr()); }
        else { P.push(900, 0, 0, 0); Q.push(62, 0, 0.1, rr()); }
      }
      if (moodId === 'after') for (let i = 0; i < 6; i++) {
        const a = -640 + i * 92 + rr.range(-18, 18), h = rr.range(110, 190);
        A.push(ribCen.x + ribDir.x * a + ribNrm.x * 150, ribCen.y + ribDir.y * a + ribNrm.y * 150, ribCen.x + ribDir.x * (a + 20) - ribNrm.x * 150, ribCen.y + ribDir.y * (a + 20) - ribNrm.y * 150);
        P.push(h, 0, 0, 0); Q.push(rr.range(5, 7.5), 1 + i, 0.85, rr());
      }
      const geo = new THREE.InstancedBufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(tp, 3)); geo.setIndex(ti);
      geo.setAttribute('aA', new THREE.InstancedBufferAttribute(new Float32Array(A), 4));
      geo.setAttribute('aP', new THREE.InstancedBufferAttribute(new Float32Array(P), 4));
      geo.setAttribute('aQ', new THREE.InstancedBufferAttribute(new Float32Array(Q), 4));
      geo.instanceCount = Q.length / 4;
      const mat = new THREE.ShaderMaterial({
        uniforms: ropeU, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
        vertexShader: GLSL_WORLD + /* glsl */`
          #define NLIFT ${NLIFT}
          attribute vec4 aA, aP, aQ;
          uniform vec2 uLift[NLIFT]; uniform float uTime, uPx;
          varying vec3 vN, vView; varying vec4 vT;   // s, angle, gain, gold
          varying vec2 vM;                           // length (m), seed
          vec3 arch(float s, float H, float lift) {
            float a = 3.14159265 * s;
            vec2 xz = mix(aA.xy, aA.zw, 0.5 - 0.5 * cos(a));
            float y = H * sin(a) * (1.0 + 0.3 * sin(2.0 * a) * (1.0 - lift));
            return vec3(xz.x, y, xz.y);
          }
          void main() {
            int slot = int(aQ.y + 0.5);
            float lift = uLift[slot].x, s = position.x;
            float H = max(aP.x * lift, 2.0);
            vec3 c = arch(s, H, lift), c1 = arch(s + 0.004, H, lift);
            float yb = mix(surfY(aA.xy), surfY(aA.zw), s) - 2.0;
            vec3 T = normalize(c1 - c);
            vec2 ab = aA.zw - aA.xy;
            vec3 Nn = normalize(vec3(ab.y, 0.0, -ab.x)), n2 = cross(T, Nn);
            float th = aP.z + aP.w * 6.2831853 * s * mix(1.0, 0.3, lift) + uTime * 0.12;
            float rS = aP.y * (0.3 + 0.7 * sin(3.14159265 * s)) * (0.7 + 0.8 * lift);
            c += (Nn * cos(th) + n2 * sin(th)) * rS + Nn * sin(uTime * 0.21 + s * 5.0 + aQ.w * 6.0) * 6.0 * lift;
            c.y += yb;
            float dist = length(cameraPosition - c);
            float r = aQ.x * (1.0 + 0.25 * sin(s * 40.0 + aQ.w * 30.0 - uTime * 0.6)), rmin = 0.8 * uPx * dist;
            float dim = r / max(r, rmin); r = max(r, rmin);
            float a = position.y * 6.2831853;
            vec3 dir = Nn * cos(a) + n2 * sin(a);
            vec3 p = c + dir * r;
            vN = dir; vView = cameraPosition - p;
            vT = vec4(s, position.y, uLift[slot].y * dim * (aQ.x > 30.0 ? 0.22 : 1.0), aQ.z);
            vM = vec2(3.14159265 * sqrt((dot(ab, ab) * 0.25 + H * H) * 0.5), aQ.w);
            gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0);
          }`,
        fragmentShader: fx.GLSL_HASH + fx.GLSL_VALUE_NOISE + /* glsl */`
          uniform vec3 cGold, cAmber, cRose, cRoseDeep, cViolet; uniform float uTime;
          varying vec3 vN, vView; varying vec4 vT; varying vec2 vM;
          void main() {
            float ndv = abs(dot(normalize(vN), normalize(vView)));
            float edge = 1.0 / max(ndv, 0.25);
            float a = vT.y * 6.2831853, along = abs(vT.x - 0.5) * vM.x;
            float t1 = vnoise(vec3(cos(a) * 2.2, sin(a) * 2.2, along / 55.0 + uTime * 0.5 + vM.y * 20.0));
            float t2 = vnoise(vec3(cos(a) * 5.0, sin(a) * 5.0, along / 18.0 + uTime * 0.9 + vM.y * 7.0));
            float th = smoothstep(0.35, 0.8, t1) * 0.7 + smoothstep(0.45, 0.9, t2) * 0.6;
            float I = min(0.9, (0.07 + 0.36 * th) * (0.4 + 0.6 * edge));
            vec3 body = mix(mix(cRoseDeep, cRose, smoothstep(0.0, 0.7, th)), mix(cAmber, cGold, smoothstep(0.0, 0.6, th)), vT.w);
            body = mix(body, mix(vec3(1.0, 0.8, 0.88), vec3(1.0, 0.92, 0.8), vT.w), 0.4 * smoothstep(0.8, 1.3, th));
            float foot = sin(3.14159265 * vT.x);
            body = mix(mix(cGold, vec3(1.0, 0.9, 0.75), 0.4), body, smoothstep(0.0, 0.3, foot));
            gl_FragColor = vec4(max(body * I * vT.z * smoothstep(0.0, 0.03, foot), 0.0), 1.0);
          }`,
      });
      const rope = new THREE.Mesh(geo, mat); rope.frustumCulled = false; rope.renderOrder = 2; scene.add(rope);
    }
    await ctx.yield();

    // ------------------------------------------------------------ 10. mood pieces: the prominence hedgerow, the comet
    if (moodId === 'prominence') {
      const geo = new THREE.PlaneGeometry(1300, 520, 90, 14); geo.translate(0, 260, 0);
      const mk = (seed, gain) => new THREE.ShaderMaterial({
        uniforms: { ...worldU, uSeed: { value: seed }, uGain: { value: gain } },
        transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
        vertexShader: GLSL_WORLD + /* glsl */`
          uniform float uTime, uSeed;
          varying vec2 vUv;
          void main() {
            vUv = uv;
            vec4 wp = modelMatrix * vec4(position, 1.0);
            wp.z += sin(position.x / 130.0 + uSeed * 5.0 + uTime * 0.07) * 40.0 * uv.y + sin(position.x / 47.0 + uTime * 0.11) * 12.0 * uv.y;
            wp.y += surfY(wp.xz) - 6.0;
            gl_Position = projectionMatrix * viewMatrix * wp;
          }`,
        fragmentShader: fx.GLSL_HASH + fx.GLSL_VALUE_NOISE + /* glsl */`
          uniform vec3 cGold, cRose, cRoseDeep; uniform float uTime, uSeed, uGain;
          varying vec2 vUv;
          void main() {
            float x = vUv.x * 1300.0, y = vUv.y;
            float top = 0.5 + 0.48 * vnoise(vec2(x / 190.0 + uSeed * 11.0, 2.0));
            float pil = vnoise(vec2(x / 70.0 + uSeed * 31.0, 7.0));
            float body = (1.0 - smoothstep(top - 0.22, top, y)) * mix(smoothstep(0.42, 0.62, pil), 1.0, smoothstep(0.08, 0.14 + 0.3 * pil, y));
            float th = vnoise(vec2(x / 6.0 + uSeed * 9.0, y * 6.0 + uTime * 0.12));
            float th2 = vnoise(vec2(x / 19.0, y * 2.5 + uTime * 0.05 + 4.0));
            float I = body * (0.16 + 0.55 * smoothstep(0.3, 0.8, th) * (0.4 + 0.8 * th2)) * (0.55 + 0.6 * smoothstep(0.2, 0.8, vnoise(vec2(x / 45.0 + uSeed * 3.0, y * 1.5 + uTime * 0.03))));
            I *= smoothstep(0.0, 0.1, vUv.x) * (1.0 - smoothstep(0.9, 1.0, vUv.x));
            vec3 col = mix(cRose, cRoseDeep * 1.6, smoothstep(0.25, 1.0, y / max(top, 0.05))) * I + cGold * 0.3 * exp(-y * 16.0) * body;
            gl_FragColor = vec4(max(col * uGain, 0.0), 1.0);
          }`,
      });
      for (let k = 0; k < 2; k++) {
        const m = new THREE.Mesh(geo, mk(rng.range(0, 1), k === 0 ? 2.1 : 1.2));
        m.position.set(-1180 - k * 60, 0, -3350 - k * 110); m.rotation.y = 0.5 - k * 0.1; m.frustumCulled = false; m.renderOrder = 2; scene.add(m);
      }
      await ctx.yield();
    }
    // the rare event: a sungrazing comet crossing left to right, boiling away just above the limb (u 0.15-0.45)
    const cometU = { ...worldU, uHead: { value: new THREE.Vector3(-1500, 700, -2700) }, uTail: { value: new THREE.Vector3(-0.6, 0.8, 0) }, uFade: { value: 0 } };
    let comet = null;
    if (vary.rare) {
      const geo = new THREE.PlaneGeometry(2, 1.06, 2, 24); geo.translate(0, 0.47, 0);
      comet = new THREE.Mesh(geo, new THREE.ShaderMaterial({
        uniforms: cometU, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
        vertexShader: /* glsl */`
          uniform vec3 uHead, uTail;
          varying vec2 vC;
          void main() {
            vec3 c = uHead + uTail * position.y * 900.0;
            vec3 side = normalize(cross(uTail, cameraPosition - c) + vec3(0.0, 1e-4, 0.0));
            float w = mix(46.0, 150.0, clamp(position.y, 0.0, 1.0));
            vC = vec2(position.x, position.y);
            gl_Position = projectionMatrix * viewMatrix * vec4(c + side * position.x * w, 1.0);
          }`,
        fragmentShader: fx.GLSL_HASH + fx.GLSL_VALUE_NOISE + /* glsl */`
          uniform vec3 cViolet, cRose; uniform float uTime, uFade;
          varying vec2 vC;
          void main() {
            float x = vC.x, y = vC.y, ym = y * 900.0;
            float head = exp(-(x * x * 5.0 + ym * ym / 900.0));
            float tail = pow(clamp(1.0 - y, 0.0, 1.0), 1.6) * step(0.0, y) * exp(-x * x * (1.5 + 4.0 * (1.0 - y))) * (1.0 - x * x)
                       * (0.45 + 0.55 * vnoise(vec2(x * 3.0, ym / 70.0 - uTime * 2.0)));
            vec3 col = (cViolet * (tail * 0.8 + head * 2.6) + vec3(1.0) * head * head * 1.2 + cRose * tail * 0.08) * uFade;
            gl_FragColor = vec4(max(col, 0.0), 1.0);
          }`,
      }));
      comet.frustumCulled = false; comet.renderOrder = 3; scene.add(comet);
    }
    await ctx.yield();

    // ------------------------------------------------------------ 11. the shield rig (the vehicle, posed from the camera every frame)
    // Rig space = camera space: -Z ahead, +Y up. The disc lies below and ahead; only the far arc of its rim is in frame.
    const rig = new THREE.Group(); rig.name = 'shield-rig'; scene.add(rig);
    const rigU = {
      uTime: time, cGold: { value: C[0] }, cRose: { value: C[3] }, cRoseDeep: { value: C[6] }, cViolet: { value: C[4] },
      uUnder: { value: new THREE.Color(1, 0.46, 0.03) }, uTopL: { value: new THREE.Color(0.14, 0.11, 0.15) },
      uSkin: { value: bareShield ? 1 : 0 }, uGlow: { value: 1 },
    };
    {
      const parts = [];
      const discM = new THREE.Matrix4().makeRotationX(4 * PI / 180).setPosition(0, -1.05, -0.8);
      const add = (geo, kind, m) => {
        if (m) geo.applyMatrix4(m);
        const n = geo.attributes.position.count;
        geo.setAttribute('aL', new THREE.BufferAttribute(geo.attributes.position.array.slice(), 3));
        geo.setAttribute('aK', new THREE.BufferAttribute(new Float32Array(n).fill(kind), 1));
        geo.applyMatrix4(discM);
        parts.push(geo);
      };
      const az = (deg, r, y) => new THREE.Vector3(Math.sin(deg * PI / 180) * r, y, -Math.cos(deg * PI / 180) * r);
      const TR = (pos, yaw, tilt) => new THREE.Matrix4().makeTranslation(pos.x, pos.y, pos.z).multiply(new THREE.Matrix4().makeRotationY(yaw)).multiply(new THREE.Matrix4().makeRotationX(tilt));
      // the disc: ceramic top skin, a groove, the raised bevelled lip, the side
      const prof = [[1.19, -0.1], [1.2, -0.02], [1.195, 0.012], [1.17, 0.024], [1.14, 0.018], [1.12, 0.0], [1.105, -0.006], [1.09, 0.0], [1.0, 0.004], [0.6, 0.01], [0.001, 0.012]];
      add(new THREE.LatheGeometry(prof.map((p) => new THREE.Vector2(p[0], p[1])), 160), 0);
      await ctx.yield();
      // eight titanium clips straddling the lip, each with a bolt
      for (let i = 0; i < 8; i++) {
        const deg = 22.5 + i * 45, yaw = -deg * PI / 180;
        add(new THREE.BoxGeometry(0.085, 0.03, 0.15), 1, TR(az(deg, 1.15, 0.036), yaw, 0));
        add(new THREE.BoxGeometry(0.06, 0.05, 0.03), 1, TR(az(deg, 1.215, 0.0), yaw, 0));
        add(new THREE.CylinderGeometry(0.014, 0.014, 0.022, 8), 1, TR(az(deg, 1.11, 0.058), yaw, 0));
      }
      await ctx.yield();
      // two folded solar paddles peeking out either side, with coolant lines running to them
      for (const sgn of [-1, 1]) {
        const yaw = -sgn * 58 * PI / 180;
        add(new THREE.BoxGeometry(0.32, 0.016, 0.46), 2, TR(az(sgn * 58, 1.4, 0.1), yaw, 13 * PI / 180));
        add(new THREE.BoxGeometry(0.36, 0.028, 0.028), 1, TR(az(sgn * 58, 1.175, 0.05), yaw, 13 * PI / 180));
        for (const off of [-5, 5]) {
          const curve = new THREE.CatmullRomCurve3([az(sgn * (50 + off), 0.78, 0.012), az(sgn * (53 + off), 0.95, 0.05), az(sgn * (56 + off * 0.6), 1.1, 0.06), az(sgn * (57.5 + off * 0.5), 1.24, 0.07)]);
          add(new THREE.TubeGeometry(curve, 18, 0.011, 5), 3);
        }
        // a whip antenna ahead and outward, with a bead at its tip
        const base = az(sgn * 33, 1.16, 0.03), tip = base.clone().add(new THREE.Vector3(sgn * 1.15, 0.0, -0.62));
        add(new THREE.TubeGeometry(new THREE.LineCurve3(base, tip), 12, 0.006, 4), 4);
        const bead = new THREE.SphereGeometry(0.017, 8, 6); bead.attributes.uv.array.fill(1);
        add(bead, 5, new THREE.Matrix4().makeTranslation(tip.x, tip.y, tip.z));
        add(new THREE.CylinderGeometry(0.02, 0.026, 0.05, 8), 1, new THREE.Matrix4().makeTranslation(base.x, base.y + 0.01, base.z));
      }
      await ctx.yield();
      const rigGeo = mergeGeometries(parts, false);
      parts.forEach((g) => g.dispose());
      await ctx.yield();
      var rigMat = new THREE.ShaderMaterial({
        uniforms: rigU, side: THREE.DoubleSide,
        vertexShader: /* glsl */`
          attribute float aK; attribute vec3 aL;
          uniform float uTime;
          varying vec3 vL, vNr, vPr; varying float vK; varying vec2 vUv2;
          void main() {
            vec3 p = position;
            if (aK > 3.5) {       // whips tremble
              float a = uv.x * uv.x, sg = sign(p.x);
              p += vec3(sin(uTime * 31.0 + sg), cos(uTime * 27.0 + 1.3 * sg), 0.0) * 0.011 * a + vec3(0.0, sin(uTime * 2.3 + sg), 0.0) * 0.022 * a;
            }
            vL = aL; vK = aK; vNr = normal; vPr = p; vUv2 = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
          }`,
        fragmentShader: fx.GLSL_HASH + fx.GLSL_VALUE_NOISE + fx.GLSL_VORONOI + /* glsl */`
          uniform vec3 uUnder, uTopL, cGold, cRose, cRoseDeep, cViolet; uniform float uTime, uSkin, uGlow;
          varying vec3 vL, vNr, vPr; varying float vK; varying vec2 vUv2;
          void main() {
            vec2 q = vL.xz, cuv = vUv2 * vec2(6.0, 9.0);
            float fq = fwidth(q.x) + fwidth(q.y), fwc = fwidth(cuv.x) + fwidth(cuv.y);      // derivatives first
            vec3 n = normalize(vNr), v = normalize(-vPr);
            if (dot(n, v) < 0.0) n = -n;
            float r = length(q), ang = atan(q.x, -q.y + 1e-5);
            vec2 rd = q / max(r, 1e-3);
            float under = max(-n.y, 0.0) + 0.4 * max(dot(n.xz, rd), 0.0);
            vec3 col;
            if (vK < 0.5) {
              // top skin: pale ceramic with hairline crazing at two scales (or bare carbon weave), in shadow; the lip
              // burns: white-gold at the edge grading smoothly through gold to dull rose 20 cm in
              float f1 = fq * 34.0, f2 = fq * 88.0;
              vec3 vor = voronoi(q * 34.0 + 3.0), vor2 = voronoi(q * 88.0 + 11.0);
              float crack = max((1.0 - smoothstep(f1 * 0.25, 0.012 + f1 * 0.85, vor.y)) * (1.0 - smoothstep(0.35, 0.9, f1)),
                                0.6 * (1.0 - smoothstep(f2 * 0.25, 0.015 + f2 * 0.85, vor2.y)) * (1.0 - smoothstep(0.3, 0.8, f2)));
              float weave = 0.5 + 0.5 * sin(q.x * 230.0) * sin(q.y * 230.0) * (1.0 - smoothstep(0.3, 1.2, fq * 27.0));
              vec3 skin = mix(vec3(0.74, 0.72, 0.7) * (0.9 + 0.12 * vor.z), vec3(0.03, 0.03, 0.036) * (0.5 + 1.2 * weave), uSkin);
              float heat = smoothstep(0.98, 1.17, r), lip = smoothstep(1.125, 1.18, r) * (1.0 - smoothstep(1.196, 1.2, r) * 0.6);
              float mid = smoothstep(1.07, 1.16, r);
              float breathe = 0.85 + 0.15 * sin(uTime * 1.1 + ang * 3.0) + 0.07 * sin(uTime * 3.7 + ang * 11.0);
              vec3 lit = skin * (uTopL * mix(2.4, 1.0, uSkin) * (0.55 + 0.45 * n.y) + uUnder * under * 0.5);
              lit *= 1.0 - 0.34 * crack * (1.0 - uSkin * 0.7);
              float lw = 0.9 + 0.1 * sin(ang * 140.0);
              vec3 glow = mix(cRoseDeep * 0.8, cRose * 0.6, heat) * heat * heat * 0.5
                        + cGold * mid * mid * (1.0 - lip) * 0.55
                        + mix(cGold, vec3(1.0, 0.93, 0.8), 0.5) * lip * lip * 2.1 * lw;
              col = lit + glow * breathe * uGlow;
            } else if (vK < 1.5) {
              float spec = pow(max(dot(reflect(-v, n), normalize(vec3(0.0, 0.5, -1.0))), 0.0), 12.0);
              col = vec3(0.34, 0.33, 0.35) * (uTopL * (0.7 + 0.5 * n.y) + uUnder * under) + uTopL * spec * 0.7
                  + cGold * 0.55 * smoothstep(1.13, 1.24, r) * uGlow * (0.4 + 0.6 * under);
            } else if (vK < 2.5) {
              vec2 gq = abs(fract(cuv) - 0.5);
              float line = smoothstep(0.44 - fwc, 0.49, max(gq.x, gq.y));
              col = mix(vec3(0.02, 0.028, 0.07), vec3(0.3, 0.3, 0.33), line) * (uTopL * 1.3 + uUnder * (under + 0.1))
                  + cViolet * 0.06 * pow(1.0 - abs(dot(n, v)), 3.0);
            } else if (vK < 3.5) {
              float pulse = smoothstep(0.9, 1.0, sin(vUv2.x * 9.0 - uTime * 3.0));
              col = vec3(0.5, 0.24, 0.12) * (uTopL * 1.2 + uUnder * (under + 0.05)) + cViolet * pulse * 0.45;
            } else if (vK < 4.5) {
              col = vec3(0.32) * (uTopL * 1.4 + uUnder * (0.35 + under));
            } else {
              col = mix(cGold, vec3(1.0, 0.9, 0.8), 0.3) * (1.5 + 0.4 * sin(uTime * 5.0 + vPr.x));
            }
            gl_FragColor = vec4(max(col, 0.0), 1.0);
          }`,
      });
      const mesh = new THREE.Mesh(rigGeo, rigMat); mesh.frustumCulled = false; mesh.renderOrder = 5; rig.add(mesh);
      await ctx.yield();

      // sparks tearing off the lip and plasma motes streaking back past the lens (rig space, 1 draw)
      const sr = rng.fork('sparks'), nS = Math.round(110 * (0.6 + 0.4 * detail)), nM = Math.round(170 * detail * density);
      const aS = [], aV = [], aC = [], v3 = new THREE.Vector3();
      for (let i = 0; i < nS; i++) {
        const deg = sr.range(-82, 82);
        v3.copy(az(deg, 1.19, 0.02)).applyMatrix4(discM);
        const life = sr.range(0.3, 0.75);
        aS.push(v3.x, v3.y, v3.z, life);
        aV.push(Math.sin(deg * PI / 180) * sr.range(0.2, 1.3), sr.range(0.4, 2.4) * (sr.chance(0.12) ? 1.8 : 1), sr.range(5, 11), sr());
        aC.push(0, sr.range(0.003, 0.006), sr.range(0.016, 0.03), sr());
      }
      for (let i = 0; i < nM; i++) {
        const th = sr.range(0, PI * 2), r = sr.range(1.7, 8), vz = sr.range(70, 110);
        aS.push(Math.cos(th) * r, Math.sin(th) * r * 0.8 - 0.4, -44, 46 / vz);
        aV.push(0, 0, vz, sr());
        aC.push(1, sr.range(0.004, 0.011), 0.0075, sr());
      }
      const sg = new THREE.InstancedBufferGeometry();
      sg.setAttribute('position', new THREE.Float32BufferAttribute([-1, 0, 0, 1, 0, 0, 1, 1, 0, -1, 1, 0], 3)); sg.setIndex([0, 1, 2, 0, 2, 3]);
      sg.setAttribute('aS', new THREE.InstancedBufferAttribute(new Float32Array(aS), 4));
      sg.setAttribute('aV', new THREE.InstancedBufferAttribute(new Float32Array(aV), 4));
      sg.setAttribute('aC', new THREE.InstancedBufferAttribute(new Float32Array(aC), 4));
      sg.instanceCount = nS + nM;
      const sparkMat = new THREE.ShaderMaterial({
        uniforms: { uTime: time, uPx, cGold: { value: C[0] }, cRose: { value: C[3] } },
        transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
        vertexShader: /* glsl */`
          attribute vec4 aS, aV, aC;
          uniform float uTime, uPx;
          varying vec4 vF; varying float vKs;
          void main() {
            float f = fract(uTime / aS.w + aV.w), tt = f * aS.w;
            vec3 p = aS.xyz + aV.xyz * tt;
            if (aC.x < 0.5) p += vec3(sign(aS.x) * 1.6, 1.0, 0.0) * tt * tt * 3.0;
            vec3 q = p - aV.xyz * aC.z;
            vec4 A = modelViewMatrix * vec4(p, 1.0), B = modelViewMatrix * vec4(q, 1.0);
            vec2 ax = A.xy / max(-A.z, 0.05) - B.xy / max(-B.z, 0.05);
            vec2 perp = normalize(vec2(-ax.y, ax.x) + vec2(1e-6, 0.0));
            vec4 P = mix(A, B, position.y);
            P.xy += perp * position.x * max(aC.y, 0.9 * uPx * max(-P.z, 0.1));
            vF = vec4(position.x, position.y, f, aC.w); vKs = aC.x + 0.4 * smoothstep(2.0, 7.0, -A.z);
            gl_Position = projectionMatrix * P;
          }`,
        fragmentShader: /* glsl */`
          uniform vec3 cGold, cRose;
          varying vec4 vF; varying float vKs;
          void main() {
            float x = vF.x, y = vF.y, f = vF.z;
            float shape = (1.0 - x * x) * (1.0 - y) * (1.0 - y);
            vec3 col;
            if (vKs < 0.5) col = mix(vec3(1.0, 0.8, 0.5), cRose, smoothstep(0.1, 0.8, f)) * 2.4 * smoothstep(0.0, 0.05, f) * (1.0 - f) * (1.0 - f);
            else col = mix(cRose, cGold, vF.w) * 2.2 * (vKs - 1.0) * smoothstep(0.0, 0.2, f) * (1.0 - smoothstep(0.9, 1.0, f));
            gl_FragColor = vec4(max(col * shape, 0.0), 1.0);
          }`,
      });
      const sparks = new THREE.Mesh(sg, sparkMat); sparks.frustumCulled = false; sparks.renderOrder = 6; rig.add(sparks);
    }
    await ctx.yield();

    // ------------------------------------------------------------ 12. pois, portal, post, update
    const portalAt = new THREE.Vector3(0, 1040, HERO_Z);
    // the portal seen from afar: a small steady violet-white star in the crown of the tallest loop. It fades out inside
    // 1.5 km so that it never veils the eye on the climb (uIntensity is driven from the camera's distance in update()).
    const pStar = fx.makeGlow({ rng: rng.fork('pstar'), position: [0, 1040, HERO_Z], color: '#E9E0FF', size: 70, intensity: 3.2, halo: 1, spikes: 4, flicker: 0,
      minAngle: 0.014, fogAmount: 0, time, renderOrder: 6 });
    pStar.object.frustumCulled = false; scene.add(pStar.object);
    await ctx.yield();
    const pois = [
      { at: [0, 430, HERO_Z], from: 0.05, to: 0.46, weight: 0.5 },                                  // the arcade, through the descent
      { at: [-140, 70, -2330], from: uLeg - 0.13, to: uLeg + 0.05, weight: 0.45 },   // the lake, lower left in the S
      { at: portalAt, from: uLeg + 0.03, to: 1, weight: 0.6 },
    ];
    const _d = new THREE.Vector3(), _t0 = new THREE.Vector3(), _t1 = new THREE.Vector3();
    const _q = new THREE.Quaternion(), _e = new THREE.Euler(), _size = new THREE.Vector2();
    const cometA = new THREE.Vector3(-1500, 700, -2700), cometB = new THREE.Vector3(800, 70, -3500);
    const cometTail = new THREE.Vector3().subVectors(cometA, cometB).normalize().multiplyScalar(1.0).add(new THREE.Vector3(0, 0.3, 0)).normalize();
    cometU.uTail.value.copy(cometTail);
    const underGold = new THREE.Color(1, 0.46, 0.03).multiplyScalar(moodId === 'deep' ? 0.45 : 1), underUmber = new THREE.Color(0.3, 0.085, 0.035);
    const topBase = new THREE.Color(0.12, 0.11, 0.135), topRose = new THREE.Color(1, 0.3, 0.45);
    const rU = spots[0][2], rP = spots[0][3];

    function update(dt, t, camera, u) {
      time.value = t;
      let hpx = 720;
      if (ctx.renderer?.getDrawingBufferSize) hpx = Math.max(1, ctx.renderer.getDrawingBufferSize(_size).y);
      uPx.value = 2 / (Math.max(0.1, camera.projectionMatrix.elements[5]) * hpx);
      const cp = camera.position;
      skyGroup.position.copy(cp);
      _d.set(0, 0, -1).applyQuaternion(camera.quaternion);
      jetU.uCen.value.set(cp.x + _d.x * 380, cp.z + _d.z * 380);

      pStar.uniforms.uIntensity.value = 3.2 * sstep(700, 1500, cp.distanceTo(portalAt));
      // the hero and its keyed beats
      const hu = heroU(u);
      hero.update(dt, t, camera);
      hero.setProgress(hu);
      const rib = seaMat.uniforms.uRib.value;
      const kick = sstep(0.606, 0.62, hu) * (1 - 0.7 * sstep(0.72, 0.92, hu));
      if (moodId === 'after') rib.w = 0.75 + 0.1 * Math.sin(t * 0.9) + 0.35 * kick;
      else { rib.z = 0.08 + 0.92 * sstep(0.608, 0.7, hu); rib.w = kick; }

      // the twisting ribbon lifts off the limb; the low arcade's loops rise one after another
      const lifts = ropeU.uLift.value;
      lifts[0].set(0.1 + 0.9 * sstep(0.2, 0.7, u), 1);
      for (let i = 1; i < NLIFT; i++) { const ph = (t / 16 + i / 6) % 1; lifts[i].set(sstep(0, 0.5, ph), sstep(0, 0.08, ph) * (1 - sstep(0.8, 1, ph))); }

      // the comet (rare)
      if (comet) {
        const f = (u - 0.15) / 0.3, on = f > 0 && f < 1;
        comet.visible = on;
        if (on) {
          cometU.uHead.value.lerpVectors(cometA, cometB, f);
          cometU.uFade.value = sstep(0, 0.1, f) * (1 - sstep(0.8, 1, f)) * (1 - 0.25 * sstep(0.6, 1, f) * (0.5 + 0.5 * Math.sin(t * 11)));      // boiling away: under 2 flickers a second, and soft
        }
      }

      // the rig: at the camera, lagging up to 2 degrees behind every turn
      path.tangentAt(u, _t0); path.tangentAt(Math.min(1, u + 0.012), _t1);
      const turn = _t0.z * _t1.x - _t0.x * _t1.z;
      const lag = Math.max(-0.035, Math.min(0.035, turn * 0.5));
      rig.position.copy(cp);
      rig.quaternion.copy(camera.quaternion).multiply(_q.setFromEuler(_e.set(0, lag, lag * 0.7)));
      // underlight: gold from the sea; over the lake it drops by two thirds, turns umber, and rose becomes the key
      const over = 1 - sstep(rU * 0.85, rP * 0.95, Math.hypot(cp.x - S1.x, cp.z - S1.z));
      const nearArc = 1 - sstep(150, 1000, Math.hypot(cp.x, cp.z + 2450));
      const high = 1 / (1 + Math.max(0, cp.y - 120) / 700);
      rigU.uUnder.value.copy(underGold).lerp(underUmber, over).multiplyScalar(high);
      const tk = 0.04 * over + 0.07 * nearArc;
      rigU.uTopL.value.setRGB(topBase.r + topRose.r * tk, topBase.g + topRose.g * tk, topBase.b + topRose.b * tk);
      rigU.uGlow.value = 1 - 0.3 * over;
    }

    return {
      scene, path, duration: 46, title: M.title,
      camera: { fov: 64, near: 0.4, far: 9500, lookAhead: 60, sway: 0.6, bank: 2.2 },
      pois,
      portal: { shape: 'circle', radius: 10, color: '#E9E0FF', glow: 1, tilt: true, revealDistance: 3200 },
      post: {
        exposure: M.exposure,
        bloom: { strength: 0.25, radius: 0.6, threshold: 1.1 },
        grade: { saturation: 1.06, contrast: 1.05, tint: '#ffffff', shadowTint: '#000000', vignette: 0.28, grain: 0.018, aberration: 0 },
      },
      ride: 'none', style: 'none',
      update,
      dispose() { hero.dispose(); disposables.forEach((d) => d.dispose()); },
    };
  },
};
