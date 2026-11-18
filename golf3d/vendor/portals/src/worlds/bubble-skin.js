// Skin of a Bubble: a low orbit over a soap bubble built as a planet, in the last seconds before it
// bursts. The bubble (src/parts/bubble-skin.js) is the only sharp thing in the world; the summer
// garden round it is drawn as blur and bokeh from the same analytic environment the film reflects.
//
// Variations by seed (ctx.vary.hour is honoured): summer afternoon in tree shade, golden evening,
// blue dusk under a string of garden lights, frost morning (ice ferns grow over the film and the
// burst sheds flakes). Also seeded: the film's age, the insect (bee, dragonfly, thistle seed), a
// small foam of extra docked bubbles, counts of everything. Rare event: a second bubble drifts in
// and docks beside the satellite at mid-flight, a bright ridge racing round the new join.
//
// POLISH L1 (shots/bubble-skin/polish-l1-1/notes.md; the hero's header has its half): the gaze now makes five
// different pictures before the satellite (hillside with the window's quadrilateral, down into the vortex
// street, the satellite rising, the gap of the close pass) and looks down into the black country after it; a
// ring of light at the portal's seat shows through the black windows; hollyhock spires are stacks of clean
// bokeh discs; bright garden features behind the planet are dimmed (two skins in the way) so bokeh never reads
// as lying on the film; duration 33 s for the shorter run-in (same speed; 35 s since L1D, see below); frost motes hang instead of falling.
// No seeded roll was moved.
//
// POLISH L2 (shots/bubble-skin/polish-l1-2/notes.md; the hero's header has its half): the backdrop is deep shade with
// blurred masses instead of one green; hollyhocks are tall soft columns with the lens's discs over them; the wand is a thin
// loop on a stick; small crisp bright discs low in the garden (wet leaves, sprinkler); the house wall stands on the lawn and
// the lawn is a dark floor (uDown), so the burst, the droplet ring and the dive are on darkness; the wide portal glow goes
// with the film; the first dandelion seed hangs beside the entry, the third over the limb of the black country (L2 lifted
// both away on u as we came: that is gone since L1B, see below). The garden discs' draws: see L1C.
//
// POLISH L1B (shots/bubble-skin/src-l1b/NOTES.md): no dandelion seed moves by u any more (the two lifts of L2 are gone): the
// three hang at fixed seats on the open side of the route and drift on the world's clock only; the first hangs far out over
// the fall of the hillside, where the look down into the street holds it whole until we pass it. A seed behind the planet is
// behind its skins. The big visitor has no gate on u for its coming: it flies its whole line. No draw was added or moved.
//
// POLISH L1C (shots/bubble-skin/src-l1c/NOTES.md): dealing and wording only, nothing of the flight. The low garden discs of L2
// are dealt from a fork of their own ('garden-discs'), so the 'sprites' stream is the live version's draw for draw (plus the
// one draw that makes the fork, after all of them). The window's mirror direction is stated from the route's knots (the
// lens at the knot where the run-in meets the hillside, the film 20 m further along the track), not from a fraction of
// the route's length. All three dandelions hang on the garden side of the track by one stated rule. The hero's half: the
// two entry swirls are swirls of their own on a fork of their own; vortices 12 and 13 are where their draws put them.
//
// POLISH L1D (shots/bubble-skin/src-l1d/NOTES.md): the designer's rulings on L1B. Duration 35 s. The ends of the first four
// gaze windows and the first two dandelions' seats are places of the route in metres (they were the flank passage plus typed
// offsets of u, and typed fractions of the route's length); what the lens looks at, in which order and with which weights
// is unchanged. The second dandelion keeps 18 m of clear air from the satellite, the foam and the newcomer by a rule on
// each seed's own layout. The hero's half: the window's reflection and the house wall's are carried by the film, feathered
// and given in the film's own colours. No draw of any stream is added, removed or moved; the route is untouched.
//
// POLISH L1E (shots/bubble-skin/src-l1e/NOTES.md): one place of the gaze and nothing else. The look goes down into the street
// of storms where the first storm, the hook of the entry, comes under the route (L1D started it at 30 m of altitude).
//
// DUSK REPAIR (after L1E went live): under the garden lights the garden had gone black. L2 darkened the backdrop for every
// look, among other places in these three (a deeper and darker deep of the garden, the blurred masses, the dark floor), and gave light back in
// pools of sun and lit foliage, which the dusk has next to none of (uSunK 0.15, lawn 0.35); its navy sits at the foot of the
// grade (the toe of the tone curve, then the contrast step), where such a cut ends in black. So the dusk alone (define
// BS_LAMPS on the dome, uDown 0) keeps the garden of before L2 in those three places; everything else of L2 stands in it (the hollyhocks' darkened feet and the
// wall standing on the lawn among it).
// The other three looks compile to what they were.
import * as THREE from 'three';
import { makePath, clamp, smoothstep, lerp } from '../kit/core.js';
import * as fx from '../kit/fx.js';
import { buildHero, makeSphereGeo, ENV_GLSL, NOISE_GLSL } from '../parts/bubble-skin.js';

const LOOKS = {
  afternoon: {
    title: 'Skin of a Bubble', palette: ['#0F2A1C', '#E8308C', '#19C3D6', '#F2B93B', '#F4F1E6', '#6FB34A', '#05080A'],
    sunElev: 50, sunColor: '#fff6e4', sunGlow: '#fff2cf', flowers: ['#f6a9c6', '#fbe9ee'], lawn: 1, dome: 1.0, flow: 1,
    post: { exposure: 1.05, tint: '#fffdf6', shadow: '#03100a', sat: 1.1 }, portal: '#fff1c4', mote: ['#fff3c9', '#ffffff', '#d8f0a0'],
  },
  golden: {
    title: 'Skin of a Bubble, Golden Hour', palette: ['#241808', '#E8308C', '#19C3D6', '#F2B93B', '#F3D9A2', '#D99A32', '#070504'],
    sunElev: 20, sunColor: '#ffab52', sunGlow: '#ff9a3c', flowers: ['#ff9d6e', '#ffd9a6'], lawn: 0.7, dome: 1.0, flow: 1,
    post: { exposure: 1.05, tint: '#fff0dc', shadow: '#140803', sat: 1.12 }, portal: '#ffcf8a', mote: ['#ffc46a', '#ffe6b0', '#ff9a4a'],
  },
  dusk: {
    title: 'Skin of a Bubble, Garden Lights', palette: ['#0A1634', '#E8308C', '#19C3D6', '#F2B93B', '#CBD6F4', '#34508C', '#03040A'],
    sunElev: 40, sunColor: '#141c38', sunGlow: '#1c2a55', flowers: ['#5a5fae', '#9aa4e0'], lawn: 0.35, dome: 1.15, flow: 0.9, lamps: true,
    post: { exposure: 1.2, tint: '#f0f2ff', shadow: '#03051a', sat: 1.08 }, portal: '#ffc98a', mote: ['#ffc070', '#9ab0ff', '#ffe0b0'],
  },
  frost: {
    title: 'Skin of a Bubble, Frost Morning', palette: ['#172B3D', '#E8308C', '#19C3D6', '#F2B93B', '#F3F8FF', '#B9D6EC', '#05080C'],
    sunElev: 28, sunColor: '#f2f8ff', sunGlow: '#eaf4ff', flowers: ['#d8e8f6', '#ffffff'], lawn: 1.5, dome: 1.0, flow: 0.4, frost: true,
    post: { exposure: 1.0, tint: '#f4faff', shadow: '#061220', sat: 1.02 }, portal: '#dff2ff', mote: ['#ffffff', '#dcefff', '#bfe0ff'],
  },
};

export default {
  id: 'bubble-skin',
  name: 'Skin of a Bubble',
  category: 'domestic',
  weirdness: 0.35,
  media: ['air', 'tiny'],
  async build(ctx) {
    const rng = ctx.rng, vary = ctx.vary || {};
    const detail = ctx.quality?.detail ?? 1, dens = clamp(vary.density ?? 1, 0.7, 1.3);
    const V3 = (x, y, z) => new THREE.Vector3(x, y, z), C = (h) => new THREE.Color(h);

    // ---- which visit is this ---------------------------------------------------------------------
    const vr = rng.fork('variation');
    const hour = vary.hour || 'any';
    let lookId = vr.pick(['afternoon', 'afternoon', 'golden', 'dusk', 'frost']);
    if (hour === 'golden') lookId = 'golden';
    else if (hour === 'night') lookId = 'dusk';
    else if (hour === 'dawn') lookId = 'frost';
    else if (hour === 'day') lookId = vr.chance(0.7) ? 'afternoon' : 'frost';
    const look = LOOKS[lookId];
    const age = vr.chance(0.3) ? vr.range(0.05, 0.3) : (vr.chance(0.4) ? vr.range(0.75, 1) : vr.range(0.3, 0.75));
    const insectKind = vr.pick(['bee', 'bee', 'dragonfly', 'thistle']);
    const foam = vr.pick([0, 0, 1, 2]);                       // extra docked bubbles beside the satellite
    const rare = !!vary.rare;
    const duration = 35;                                      // POLISH L1D: 35 s, the designer's ruling (the guide's floor). L1 had 33 for its shorter run-in, live 37

    const scene = new THREE.Scene();
    scene.background = C(look.palette[0]);

    // ---- the hero ------------------------------------------------------------------------------------
    const elev = (look.sunElev + vr.range(-4, 4)) * Math.PI / 180, sAz0 = vr.range(-0.12, 0.12);
    const sunDir = V3(Math.sin(sAz0) * Math.cos(elev), Math.sin(elev), Math.cos(sAz0) * Math.cos(elev)).normalize();
    const hero = await buildHero(ctx, {
      palette: look.palette, duration, age, sunDir, sunColor: look.sunColor, satellites: 1,
      frost: !!look.frost, lamps: !!look.lamps, rimSpeed: 165, progress: 0,
    });
    scene.add(hero.object);
    await ctx.yield();
    const A = hero.anchors, R = hero.R, CEN = A.bubbleCenter, P = A.pole;
    const path = makePath(A.flyThrough);
    await ctx.yield();
    { // POLISH L1: the house window's bright quadrilateral stands where the opening hillside mirrors it, so
      // it slides over the film ahead of us and under us on the way in (the design's opening image).
      // POLISH L1C: the place is stated in space, from the route's own knots (it was the lens at a typed fraction of the
      // route's length): the lens at the knot where the level run-in meets the hillside (the route's third knot, 16.5 m
      // over the film), and the film 20 m further along the track toward the next knot. 20 m lies inside the band in which
      // no edge of the picture cuts the pane anywhere along the run-in, on every route tried. (POLISH L1D, corrected: L1C
      // gave that band as 12 to 28 m from eyes every 2 m; with eyes every 1.1 m it was 14 to 26 m under L1C's gaze, 6 m of
      // margin each way, and it is 12 to 36 m under L1D's gaze, whose opening is the same on every seed.)
      const cam = A.flyThrough[2], tg = A.flyThrough[3].clone().sub(cam).normalize();
      const T = cam.clone().addScaledVector(tg, 20).sub(CEN).normalize();
      const Vv = cam.clone().sub(T.clone().multiplyScalar(R).add(CEN)).normalize();
      const Wd = T.clone().multiplyScalar(2 * T.dot(Vv)).sub(Vv).normalize();
      if (Wd.y > 0.12 && Wd.y < 0.97) { hero.env.uWin.value.copy(Wd); hero.env.uWinX.value.set(0, 1, 0).cross(Wd).normalize(); }
    }
    const burstU = hero.burstU;
    const UP = V3(0, 1, 0);
    const time = { value: 0 };
    let flankU = 0.6;                                         // where the close pass happens on this seed's route
    { const q = V3(); let best = 1e9; for (let i = 0; i <= 400; i++) { const d = path.pointAt(i / 400, q).distanceTo(A.satellite.flank); if (d < best) { best = d; flankU = i / 400; } } }
    // POLISH L1D: places of the route in METRES from its start, found on the route's own points at even steps of half a metre
    // (the first four gaze windows and the dandelions' seats are stated by these; nothing here reads the lens or the clock)
    const Lp = path.length, _rp = V3(), _rq = V3();
    const routeNear = (p) => { let best = 1e18, bd = 0; for (let d = 0; d <= Lp; d += 0.5) { const e = path.posAtDist(d, _rp).distanceToSquared(p); if (e < best) { best = e; bd = d; } } return bd; };   // where the route passes nearest a point
    const routeFirst = (test, from = 0) => { for (let d = from; d <= Lp; d += 0.5) if (test(path.posAtDist(d, _rp))) return d; return Lp; };                                                    // the first route point, from `from` on, at which a thing holds
    const _la = V3(), _lb = V3();
    const overLimb = (p, c) => {                               // is the point c in open view from p (true), or is the planet's limb in front of it
      const len = _la.subVectors(c, p).length(); _la.divideScalar(Math.max(len, 1e-6));
      const b = _la.dot(_lb.subVectors(p, CEN)), disc = b * b - (_lb.lengthSq() - R * R);
      if (disc <= 0) return true;
      const t0 = -b - Math.sqrt(disc);
      return !(t0 > 0 && t0 < len);
    };
    // POLISH L1E: where the first storm comes under us. The first storm on the way in is the hook, the large entry swirl. The
    // hero lays its two entry swirls last in the planet's film's list of vortices, the hook first of the two (each entry: the
    // direction of the eye from the bubble's centre, and the radius as a share of the bubble's). The hook's eye and radius
    // are read here as built on this seed; a route point's foot on the film is inside the hook's rim when the film's own
    // measure of distance from the eye (the squared chord, as the film's shader takes it) is under the squared radius. No
    // margin. A route that began inside the rim would give 0, the start. (L1D had here the first route point under 30 m
    // of altitude, a place at which nothing happens.)
    let hook = null;
    hero.object.traverse((o) => { const uv = !hook && o.material && o.material.uniforms && o.material.uniforms.uVort; if (uv) hook = uv.value[uv.value.length - 2]; });
    const mStorm = routeFirst((p) => { const f = _la.subVectors(p, CEN).normalize(); return 2 * (1 - (f.x * hook.x + f.y * hook.y + f.z * hook.z)) < hook.w * hook.w; });
    const mMeet = routeNear(A.flyThrough[2]);                                      // the run-in meets the hillside (the route's third knot)
    const mPar = routeNear(A.flyThrough[4]);                                       // the run along the parallel ends: the track turns down across the street of storms
    const mTurn = routeNear(A.flyThrough[6]);                                      // across the street: the track turns in toward the satellite's flank
    const mPass = routeNear(A.flyThrough[7]);                                      // the close pass begins: the first of the two knots that carry the track round the dome
    const satC = A.satellite.center, dPass = path.posAtDist(mPass, _rq).distanceTo(satC);
    const mRise = routeFirst((p) => overLimb(p, satC));                            // the satellite's centre stands clear above the planet's limb as seen from the route
    const mLeft = routeFirst((p) => p.distanceTo(satC) > dPass, routeNear(A.flyThrough[8]));   // past the flank, the dome is again as far off as it was where the pass began

    await ctx.yield();

    // ---- the garden, all of it out of focus: one dome that follows the camera -------------------------
    const env = hero.env;
    const domeU = Object.assign({}, env, {
      uEnvWin: { value: 0 }, uEnvWall: { value: new THREE.Vector2(0.4, 1) }, uGain: { value: look.dome * 0.55 }, uLawn: { value: look.lawn },
      uFl0: { value: C(look.flowers[0]) }, uFl1: { value: C(look.flowers[1]) }, uGlow: { value: C(look.sunGlow) },
      uPink: { value: C('#ff6fae').lerp(C(look.flowers[0]), lookId === 'afternoon' ? 0.35 : 0.7) }, uSeedD: { value: vr.range(0, 50) }, uGardenAz: { value: Math.atan2(path.startTangent.x, path.startTangent.z) + vr.range(-0.35, 0.35) },   // the hollyhocks stand where the entry looks
      uSunK: { value: look.lamps ? 0.15 : 1 }, uPc: { value: V3(0, -1e4, 0) }, uPr: { value: R }, uThru: { value: 1 }, uDown: { value: look.frost ? 0.6 : look.lamps ? 0 : 0.92 },
      uGardenAz2: { value: Math.atan2(A.heading.x, A.heading.z) + vr.range(-0.12, 0.12) },                 // and a darker mass stands where the exit looks
    });
    const dome = new THREE.Mesh(new THREE.SphereGeometry(5200, 48, 32), new THREE.ShaderMaterial({
      uniforms: domeU, side: THREE.BackSide, depthWrite: false, depthTest: false, defines: look.lamps ? { BS_LAMPS: 1 } : {},
      vertexShader: /* glsl */`varying vec3 vD; void main(){ vD = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: /* glsl */`precision highp float;
${NOISE_GLSL}${ENV_GLSL}
uniform float uGain, uLawn, uSeedD, uGardenAz, uGardenAz2, uSunK, uPr, uThru, uDown;
uniform vec3 uPc;
uniform vec3 uFl0, uFl1, uGlow, uPink;
varying vec3 vD;
float dAng(float a, float b){ return abs(mod(a - b + 3.14159, 6.28318) - 3.14159); }
void main(){
  vec3 r = normalize(vD);
  float up = r.y;
  float az = atan(r.x, abs(r.z) + abs(r.x) < 1e-5 ? 1e-5 : r.z);
  vec3 c = bsEnv(r) * uGain;
  // POLISH L1: what stands behind the planet is seen through two skins: its bright discs are dimmed there,
  // so the bokeh stays behind the film and is never read as lying on it
  float pb = dot(r, uPc), pd = pb * pb - dot(uPc, uPc) + uPr * uPr;
  float feat = 1.0 - 0.72 * uThru * step(0.0, pb) * smoothstep(0.0, 5000.0, pd);
  // sunlit lawn a long way down, mottled
  float lw = smoothstep(-0.1, -0.6, up);
  vec2 lp = r.xz / max(-up, 0.12) + vec2(uTime * 0.004, 0.0);
  float mot = bsNoise(vec3(lp * 0.9, uSeedD)) * 0.65 + bsNoise(vec3(lp * 2.6, uSeedD + 3.0)) * 0.35;
  c *= mix(1.0, 0.75 + 2.6 * mot * mot * uLawn, lw);
  c += uShade * 2.0 + vec3(0.014);                                             // the floor of the picture is deep shade green, never black
  c += uShade * 0.22 * smoothstep(0.25, -0.5, up);                // tree shade dappling the lawn
  float pool = smoothstep(0.5, 0.78, mot) * (0.8 + 0.2 * sin(uTime * 0.7 + mot * 30.0));   // pools of sun on the grass, leaf shadows stirring
  c += (uLeaf * 0.3 + uGlow * 0.07) * uLawn * uSunK * lw * pool;
  // the hedge: a dark band on the garden side
  float gs = smoothstep(1.2, 0.6, dAng(az, uGardenAz));
  c *= 1.0 - 0.3 * gs * smoothstep(0.1, 0.0, up) * smoothstep(-0.26, -0.08, up);
  c = mix(vec3(dot(c, vec3(0.3, 0.55, 0.15))), c, 0.78);          // the tone curve deepens dark greens: keep them leaf, not neon
  // the exit looks into the deep of the garden: a tall dark hedge mass with a soft scalloped top, and the
  // tree's own shade pooled on the lawn straight beneath the bubble, so the rim and the droplets burn on darkness
  float g2 = smoothstep(1.5, 0.45, dAng(az, uGardenAz2));
  float top2 = 0.1 + 0.07 * sin(az * 5.0 + uSeedD) + 0.04 * sin(az * 13.0 + uSeedD * 2.0 + 0.3 * sin(uTime * 0.4 + az * 3.0));
  float deep = max(g2 * smoothstep(top2 + 0.1, top2 - 0.06, up) * (0.82 - 0.3 * smoothstep(-0.3, -0.8, up)), 0.78 * smoothstep(-0.3, -0.8, up));
  vec3 dk = uShade * (1.7 + 2.6 * mot * mot * lw) + vec3(0.006) + (uLeaf * 0.11 + uGlow * 0.03) * uSunK * uLawn * lw * smoothstep(0.62, 0.84, mot);   // POLISH L2: dark lawn with a few pools of sun, so the droplets and the rim burn on darkness
#ifdef BS_LAMPS
  // DUSK REPAIR: under the garden lights the deep of the garden is the one of before L2 (these two lines as they were), the
  // masses below are not laid and the dark floor is off (uDown 0): see the header
  deep = max(g2 * smoothstep(top2 + 0.1, top2 - 0.06, up) * (0.82 - 0.3 * smoothstep(-0.3, -0.8, up)), 0.6 * smoothstep(-0.35, -0.85, up));
  dk = uShade * (2.3 + 1.5 * mot * lw) + vec3(0.008);
#endif
  c = mix(c, dk, deep);
#ifndef BS_LAMPS
  // POLISH L2: the backdrop is deep shade with blurred masses in it (dark boughs, lit foliage), not one flat green
  float ms = bsNoise(r * 2.1 + uSeedD) * 0.6 + bsNoise(r * 4.7 + uSeedD * 1.7) * 0.4;
  c *= mix(0.64, 1.25, smoothstep(0.28, 0.72, ms)) * (0.74 + 0.26 * smoothstep(0.0, 0.5, abs(up)));
  c += uLeaf * 0.085 * uSunK * smoothstep(0.6, 0.86, ms) * smoothstep(-0.25, 0.25, up);
#endif
  // hollyhock spires far out of focus (POLISH L2): each a tall soft column of pink-white rising out of the dark
  // of the hedge, and over it the lens's own discs, all one size for one distance, overlapping, each with a
  // slightly brighter rim (they were chains of separate grey-pink discs hanging in the air)
  for (int i = 0; i < 12; i++) {                                  // seven where the entry looks, five against the dark where the exit looks
    float fi = float(i);
    float a0 = i < 7 ? uGardenAz + (fi - 3.0) * 0.36 + 0.2 * sin(fi * 5.1 + uSeedD) : uGardenAz2 + (fi - 9.0) * 0.3 + 0.1 * sin(fi * 5.1 + uSeedD);
    float top = 0.2 + 0.2 * fract(sin(fi * 12.9 + uSeedD) * 43.7);
    float da0 = dAng(az, a0);
    if (da0 < 0.2 && up > -0.5 && up < top + 0.1) {
      float sway = 0.012 * sin(uTime * 0.6 + fi * 1.9);
      float sgn = mod(az - a0 + 9.42478, 6.28318) - 3.14159;       // signed azimuth offset from the spire
      float tt = clamp((up + 0.3) / (top + 0.3), 0.0, 1.0);
      float wv = 0.05 - 0.028 * tt, xs = sgn - sway * tt;
      float body = exp(-xs * xs / (wv * wv)) * smoothstep(-0.46, -0.16, up) * (1.0 - smoothstep(top - 0.1, top + 0.06, up));
      vec3 fcol = mix(uPink, uFl0, 0.35);
      float gk = i < 7 ? 1.0 : 0.62;
      c = mix(c, c * 0.5 + fcol * (0.24 + 0.14 * tt), body * 0.72 * feat * gk);
      c = mix(c, c * 0.4 + uLeaf * 0.05, exp(-xs * xs / 0.012) * smoothstep(-0.1, -0.4, up) * 0.5 * feat);   // its leaves, a darker green mass at the foot
      float rad = 0.034 + 0.012 * fract(sin(fi * 3.7 + uSeedD) * 17.3);
      for (int k = 0; k < 11; k++) {
        float fk = float(k), hk = fract(sin(fi * 7.7 + fk * 3.1 + uSeedD) * 91.3), h2 = fract(hk * 13.7 + 0.3);
        float y = mix(-0.2, top, (fk + 0.6 * hk) / 11.0);
        vec2 e = vec2(sgn - (hk - 0.5) * 0.075 * (1.0 - 0.5 * fk / 11.0) - sway * (fk / 11.0), up - y);
        float d = length(e);
        float disc = (1.0 - smoothstep(rad * 0.93, rad, d)) * (0.62 + 0.38 * smoothstep(rad * 0.62, rad * 0.96, d));
        c += mix(fcol, uFl1, step(0.7, h2)) * disc * feat * gk * (0.035 + 0.075 * h2) * (0.75 + 0.25 * sin(uTime * 0.5 + hk * 30.0));
      }
    }
  }
  // washing line: pale sheets lifting slowly
  for (int i = 0; i < 3; i++) {
    float fi = float(i);
    float a0 = uGardenAz + 2.55 + fi * 0.2;
    float lift = 0.07 * (0.5 + 0.5 * sin(uTime * 0.5 + fi * 1.7));
    float da = dAng(az, a0 + lift * 0.6 * (0.02 - up) * 8.0);
    float sh = smoothstep(0.16, 0.0, da) * smoothstep(-0.3 + lift, -0.06 + lift, up) * smoothstep(0.16, -0.1, up - 0.012 * sin(az * 40.0 + uTime));
    float fold = 0.75 + 0.25 * sin(az * 34.0 + up * 9.0 + uTime * 0.6 + fi * 2.0);          // slow folds travelling across the cloth
    c = mix(c, uWhite * 0.5 * fold, sh * 0.32 * feat);
  }
  // the bubble wand: a blurred pink ring, a new bubble swelling from it every six seconds
  {
    vec3 wd = normalize(vec3(sin(uGardenAz - 2.5), -0.06, cos(uGardenAz - 2.5)));
    vec3 wx = normalize(cross(wd, vec3(0.0, 1.0, 0.0))), wy = cross(wx, wd);
    vec2 q = vec2(dot(r, wx), dot(r, wy)) / max(dot(r, wd), 0.05);
    float front = step(0.05, dot(r, wd));
    // POLISH L2: a thin pink loop on a stick with a sheen of film across it (it was a fat ring that read as a doughnut)
    float rq = (length(q) - 0.043) / 0.012; float ring = exp(-rq * rq);
    float hq = q.x / 0.011; float handle = exp(-hq * hq) * smoothstep(-0.043, -0.055, q.y) * smoothstep(-0.26, -0.2, q.y);
    float inl = 1.0 - smoothstep(0.03, 0.043, length(q));
    c += (uPink * (ring + handle * 0.8) * 0.3 + mix(uPink, uWhite * vec3(0.5, 0.9, 1.0), 0.5 + 0.5 * sin(q.y * 70.0 + q.x * 30.0 + uTime * 0.8)) * inl * 0.06) * front * feat;
    float ph = fract(uTime / 6.0);
    float br = 0.043 * smoothstep(0.0, 0.55, ph) * (1.0 + 0.06 * sin(uTime * 7.0) * step(ph, 0.6));
    vec2 bc = vec2(0.02, 0.0) * smoothstep(0.5, 1.0, ph) + vec2(0.03 * sin(ph * 9.0), 0.22) * pow(max(ph - 0.55, 0.0) / 0.45, 1.5);
    float bd = length(q - bc);
    float bq = (bd - br) / 0.008; float bub = exp(-bq * bq) * (1.0 - smoothstep(0.9, 1.0, ph)) * step(0.02, ph);
    c += mix(uWhite, uPink, 0.3 + 0.3 * sin(atan(q.y - bc.y, q.x - bc.x + 1e-4) * 2.0 + uTime)) * bub * 0.4 * front;
  }
  // the sprinkler: an arc of sparks that sweeps
  {
    float a0 = uGardenAz + 1.25, sweep = sin(uTime * 0.55);
    for (int i = 0; i < 16; i++) {
      float s = fract(float(i) / 16.0 + uTime * 0.42);
      float a = a0 + sweep * 0.3 * s + 0.004 * sin(float(i) * 7.0);
      float h = -0.24 + 0.5 * s * (1.0 - s) * (0.8 + 0.2 * sweep * sweep);
      vec3 sd = normalize(vec3(sin(a), h, cos(a)));
      float dd = max(1.0 - dot(r, sd), 0.0);
      c += uWhite * (1.0 - smoothstep(0.00003, 0.00008, dd)) * (0.5 + 0.5 * sin(uTime * 9.0 + float(i) * 2.3)) * 1.2 * sin(s * 3.14159) * uSunK;
    }
  }
  // POLISH L2: the lawn is a dark floor a long way down (it was a pale veil behind the droplets and the dive): deep
  // shade with the pools of sun left in it, so the rim, the droplet ring and the portal burn on darkness
  { float dn = smoothstep(-0.08, -0.62, up); c = mix(c, c * (0.2 + 0.5 * c) + uShade * 0.5, dn * uDown); }
  // the gap in the leaves the sun comes through: one big soft disc and its glow
  float sd = max(1.0 - dot(r, uSun), 0.0);
  c += uGlow * uSunK * ((1.0 - smoothstep(0.0016, 0.0026, sd)) * 3.2 + exp(-sd * 55.0) * 0.55 + exp(-sd * 6.0) * 0.12);
  c += min(bsLamps(r, 0.0009), vec3(1.2)) * 1.6;
  gl_FragColor = vec4(c, 1.0);
}`,
    }));
    dome.renderOrder = -10; dome.frustumCulled = false; scene.add(dome);
    await ctx.yield();

    // ---- soft sprites: canopy bokeh with parallax, far bubbles as soft rings, midges, pop sparks -------
    const sr = rng.fork('sprites');
    const pal = look.palette, leafC = C(pal[5]), whiteC = C(pal[4]), tmpC = new THREE.Color();
    const sp = { pos: [], sc: [], col: [] };
    const addSprite = (p, size, kind, seed, extra, col) => { sp.pos.push(p.x, p.y, p.z); sp.sc.push(size, kind, seed, extra); sp.col.push(col.r, col.g, col.b); };
    const rdir = (minY, maxY) => { for (;;) { const v = V3(sr.gauss(), sr.gauss(), sr.gauss()).normalize(); if (v.y >= minY && v.y <= maxY) return v; } };
    // canopy bokeh in three depth tiers: many small dim far discs, a middle layer, eight big bright near ones;
    // one in six gathers round the gap the sun comes through, so the sky has a focal point
    const nBokeh = Math.round(600 * dens * detail);
    const sunX = V3().crossVectors(sunDir, UP).normalize(), sunY = V3().crossVectors(sunX, sunDir).normalize();
    for (let i = 0; i < nBokeh; i++) {
      const tier = i < 8 ? 2 : (sr.chance(0.62) ? 0 : 1);
      const canopy = tier === 2 || sr.chance(0.8), gap = tier < 2 && sr.chance(0.17);
      let d = canopy ? rdir(tier === 2 ? 0.3 : 0.12, 1) : rdir(-0.45, 0.3);
      if (gap) { const ga = sr.range(0, 6.2832), gr = 0.08 + 0.4 * sr() ** 0.7; d = sunDir.clone().addScaledVector(sunX, Math.cos(ga) * gr).addScaledVector(sunY, Math.sin(ga) * gr * 0.7).normalize(); }
      const dist = [4400, 3300, 2400][tier] * sr.range(0.9, 1.1);
      const warm = look.lamps && sr.chance(0.18);
      const lum = tier === 0 ? sr.range(0.1, 0.18) : (tier === 1 ? sr.range(0.15, 0.3) : sr.range(0.3, 0.45));
      tmpC.copy(leafC).lerp(whiteC, sr() ** 2 * (gap ? 1 : 0.8)).multiplyScalar(lum * (canopy ? 1 : 0.45) * (gap ? 1.5 : 1));
      if (warm) tmpC.set('#ffb060').multiplyScalar(sr.range(0.3, 0.6));
      const size = dist * (tier === 0 ? sr.range(0.01, 0.024) : (tier === 1 ? sr.range(0.022, 0.045) : sr.range(0.06, 0.095)));
      addSprite(d.multiplyScalar(dist).add(CEN), size, 0, sr(), tier === 0 ? 0.5 : (tier === 1 ? 0.72 : 0.8), tmpC);
    }
    for (let i = 0; i < 14; i++) {                               // far bubbles: soft rings, slowly rising
      const d = rdir(-0.35, 0.8), dist = sr.range(2300, 4200);
      tmpC.copy(whiteC).lerp(C(sr.pick([pal[1], pal[2], pal[3]])), 0.35).multiplyScalar(sr.range(0.25, 0.5));
      addSprite(d.multiplyScalar(dist).add(CEN), dist * sr.range(0.03, 0.07), 1, sr(), 0, tmpC);
    }
    // the sun shaft stands beside the entry; sixty midges turn in it
    const pIn = path.pointAt(0.1), tIn = path.tangentAt(0.1), outIn = pIn.clone().sub(CEN).normalize();
    const shaftAt = pIn.clone().addScaledVector(outIn, 130).addScaledVector(tIn, 170);
    const shX = V3().crossVectors(sunDir, UP).normalize(), shY = V3().crossVectors(sunDir, shX).normalize();
    const moteC = look.mote.map(C);
    for (let i = 0; i < Math.round(60 * dens); i++) {
      tmpC.copy(sr.pick(moteC)).multiplyScalar(sr.range(1.2, 2.6));
      addSprite(shaftAt.clone().addScaledVector(sunDir, sr.range(-150, 150)), sr.range(0.5, 1.1), 2, sr(), sr.range(6, 42) * sr.sign(), tmpC);
    }
    for (let i = 0; i < 80; i++) { tmpC.copy(whiteC).multiplyScalar(sr.range(1.2, 2.4)); addSprite(V3(sr.gauss(), sr.gauss(), sr.gauss()).normalize(), sr.range(2, 5), 3, sr(), i < 40 ? 0 : 1, tmpC); }
    { // POLISH L2: small bright discs low in the garden, as a lens draws wet leaves and the sprinkler's drops: crisp,
      // overlapping, a brighter rim. POLISH L1C: dealt from a fork of their own, made once, here, after the last draw of the
      // 'sprites' stream (making it takes that stream's one last draw; every draw before it is the live version's)
      const gd = sr.fork('garden-discs');
      const gAz = Math.atan2(path.startTangent.x, path.startTangent.z), n = Math.round(90 * dens * detail);
      for (let i = 0; i < n; i++) {
        const wet = i % 3 !== 0, a = wet ? gd.range(0, 6.2832) : gAz + 1.25 + gd.gauss() * 0.22, el = wet ? gd.range(-0.5, 0.02) : gd.range(-0.3, 0.0);
        const d = V3(Math.sin(a) * Math.cos(el), Math.sin(el), Math.cos(a) * Math.cos(el)), dist = 3000 * gd.range(0.9, 1.1);
        tmpC.copy(leafC).lerp(whiteC, wet ? gd.range(0.2, 0.9) : 0.95).multiplyScalar(wet ? gd.range(0.12, 0.3) : gd.range(0.25, 0.5));
        if (look.lamps && gd.chance(0.3)) tmpC.set('#ffb060').multiplyScalar(gd.range(0.2, 0.45));
        addSprite(d.multiplyScalar(dist).add(CEN), dist * gd.range(0.008, 0.02), 0, gd(), 0.86, tmpC);
      }
    }
    await ctx.yield();
    const spGeo = new THREE.InstancedBufferGeometry();
    spGeo.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3)); spGeo.setIndex([0, 1, 2, 0, 2, 3]);
    spGeo.setAttribute('aPos', new THREE.InstancedBufferAttribute(new Float32Array(sp.pos), 3));
    spGeo.setAttribute('aSC', new THREE.InstancedBufferAttribute(new Float32Array(sp.sc), 4));
    spGeo.setAttribute('aCol', new THREE.InstancedBufferAttribute(new Float32Array(sp.col), 3));
    spGeo.instanceCount = sp.sc.length / 4;
    const spU = {
      uTime: time, uPxK: { value: 0.003 }, uShX: { value: shX }, uShY: { value: shY }, uShD: { value: sunDir }, uCenY: { value: CEN.y },
      uPuff: { value: [new THREE.Vector4(0, 0, 0, -1), new THREE.Vector4(0, 0, 0, -1)] },
      uCen: { value: CEN.clone() }, uPr: domeU.uPr, uThru: domeU.uThru,
    };
    const sprites = new THREE.Mesh(spGeo, new THREE.ShaderMaterial({
      uniforms: spU, transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending,
      vertexShader: /* glsl */`
attribute vec3 aPos, aCol; attribute vec4 aSC;
uniform float uTime, uPxK, uCenY, uPr, uThru; uniform vec3 uShX, uShY, uShD, uCen; uniform vec4 uPuff[2];
varying vec2 vUv; varying vec3 vCol; varying vec3 vK;
void main(){
  vec3 p = aPos; float size = aSC.x, kind = aSC.y, sd = aSC.z, live = 1.0, tw = 1.0;
  if (kind < 0.5) {
    p += vec3(sin(uTime * 0.31 + sd * 40.0), cos(uTime * 0.23 + sd * 17.0), sin(uTime * 0.19 + sd * 29.0)) * size * 0.22;
    tw = 0.55 + 0.45 * sin(uTime * (0.5 + sd * 1.7) + sd * 60.0);
  } else if (kind < 1.5) {
    float ph = fract((aPos.y - uCenY + 2400.0) / 4800.0 + uTime * (0.0012 + 0.0016 * sd));
    p.y = uCenY - 2400.0 + ph * 4800.0;
    tw = smoothstep(0.0, 0.08, ph) * (1.0 - smoothstep(0.9, 1.0, ph));
  } else if (kind < 2.5) {
    float ang = uTime * (0.35 + sd * 0.9) * sign(aSC.w) + sd * 50.0, rad = abs(aSC.w) * (0.8 + 0.2 * sin(uTime * 0.6 + sd * 20.0));
    p += uShX * cos(ang) * rad + uShY * sin(ang) * rad + uShD * sin(uTime * 0.5 + sd * 30.0) * 14.0;
    tw = 0.5 + 0.5 * sin(uTime * (3.0 + sd * 5.0) + sd * 9.0);
  } else {
    vec4 pf = aSC.w < 0.5 ? uPuff[0] : uPuff[1];
    float age = pf.w; live = step(0.0, age) * step(age, 2.4);
    float k = 1.0 - exp(-2.5 * max(age, 0.0));
    p = pf.xyz + aPos * (30.0 + 110.0 * sd) * k + vec3(0.0, -9.0 * age * age, 0.0);
    tw = (1.0 - smoothstep(0.8, 2.4, age)) * (0.6 + 0.4 * sin(uTime * 17.0 + sd * 70.0));
  }
  if (kind < 1.5) {                                    // a disc behind the planet is seen through two skins: dimmer
    vec3 oc = uCen - cameraPosition, rd = p - cameraPosition; rd /= max(length(rd), 1e-3);
    float pb = dot(rd, oc), pd = pb * pb - dot(oc, oc) + uPr * uPr;
    tw *= 1.0 - 0.7 * uThru * step(0.0, pb) * smoothstep(0.0, 5000.0, pd);
  }
  vec4 mv = viewMatrix * vec4(p, 1.0);
  float px = max(-mv.z, 0.1) * uPxK / max(projectionMatrix[1][1], 0.05);
  size = max(size, px * 1.5) * live;
  vec3 vd = normalize(mv.xyz), bx = normalize(cross(vd, vec3(0.0, 1.0, 0.0))), by = cross(bx, vd);   // face the eye, not the film plane
  mv.xyz += (bx * position.x + by * position.y) * size;
  vUv = position.xy; vCol = aCol * tw; vK = vec3(kind, sd, aSC.w);
  gl_Position = projectionMatrix * mv;
}`,
      fragmentShader: /* glsl */`
varying vec2 vUv; varying vec3 vCol; varying vec3 vK;
void main(){
  float r = length(vUv); if (r > 1.0) discard;
  float a;
  if (vK.x < 0.5) a = (1.0 - smoothstep(vK.z, 1.0, r)) * (0.7 + 0.3 * smoothstep(vK.z * 0.6, vK.z, r));
  else if (vK.x < 1.5) a = (1.0 - smoothstep(0.86, 1.0, r)) * (0.16 + 0.84 * smoothstep(0.5, 0.88, r));
  else a = exp(-r * r * 5.0) + (1.0 - smoothstep(0.0, 0.25, r));
  gl_FragColor = vec4(vCol * a, 1.0);
}`,
    }));
    sprites.frustumCulled = false; sprites.renderOrder = -5; scene.add(sprites);
    await ctx.yield();

    // ---- the shaft itself, and motes round the camera -------------------------------------------------
    const set = fx.fxGroup(); scene.add(set.object);
    const rays = set.add(fx.makeGodRays({
      rng: rng.fork('rays'), position: shaftAt.clone().addScaledVector(sunDir, 430).toArray(), direction: sunDir.clone().negate().toArray(),
      radius: 46, count: 9, length: 900, width: [12, 44], color: look.lamps ? '#ffb060' : look.sunGlow, intensity: look.lamps ? 0.04 : 0.13, time, fogAmount: 0,
    }));
    rays.object.renderOrder = -4;
    await ctx.yield();
    const motes = set.add(fx.makeParticles(look.frost
      ? { rng: rng.fork('motes'), preset: 'dust', time, count: Math.round(1300 * dens * detail), box: [110, 70, 110], size: [0.08, 0.3], colors: look.mote, intensity: 1.5, fog: false, renderOrder: 12 }   // frost motes hang in the air; nothing falls (the design has no snowfall)
      : { rng: rng.fork('motes'), preset: 'dust', time, count: Math.round(1100 * dens * detail), box: [90, 60, 90], size: [0.07, 0.3], colors: look.mote, intensity: 1.5, fog: false, renderOrder: 12 }));
    await ctx.yield();

    // ---- bubble-moons: the near ones sharp, with the same film ------------------------------------------
    const mr = rng.fork('moons');
    const nMoon = Math.round(12 * dens);
    const moonMat = hero.makeMoonMaterial({ thin: 0.7 - 0.3 * age, span: 3.0, ns: 0.9, phase: mr.range(0, 20) });
    const moons = new THREE.InstancedMesh(makeSphereGeo(14), moonMat, nMoon);
    moons.frustumCulled = false; moons.renderOrder = 0; moonMat.uniforms.uGain.value = 0.95;
    const moonData = [];
    for (let i = 0; i < nMoon; i++) {
      const d = V3(mr.gauss(), mr.gauss() * 0.8 + 0.25, mr.gauss()).normalize(), rad = mr.range(22, 50) * (i < 3 ? 1.4 : 1);
      const dist = R + 230 + rad + (i < 4 ? mr.range(0, 200) : mr.range(160, 1400));
      moonData.push({ base: d.multiplyScalar(dist).add(CEN), rad, rise: mr.range(1.5, 5), ph: mr(), spin: mr.range(-0.1, 0.1), ax: V3(mr.gauss(), mr.gauss(), mr.gauss()).normalize(),
        pop: i >= nMoon - 2 ? mr.range(11, 19) : 0, popAt: mr.range(0.55, 0.8) });
    }
    scene.add(moons);
    const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _s = V3(), _p = V3(), _a = V3(), _b = V3(), _c = V3();
    function updateMoons(t) {
      let pi = 0;
      for (let i = 0; i < nMoon; i++) {
        const m = moonData[i];
        const span = 500, yy = ((m.ph * span + t * m.rise) % span + span) % span, k = yy / span;
        let sc = m.rad * smoothstep(0, 0.1, k) * (1 - smoothstep(0.9, 1, k)) * (1 + 0.015 * Math.sin(t * 1.3 + i));
        _p.copy(m.base); _p.y += yy - span * 0.5; _p.x += Math.sin(t * 0.21 + i * 2.1) * 12;
        if (m.pop) {                                     // one or two wink out into a puff of sparks, then a new one swells
          const c = ((t + m.ph * m.pop) % m.pop) / m.pop, age = (c - m.popAt) * m.pop;
          if (age > 0) sc *= smoothstep(0.97, 1, c);
          spU.uPuff.value[pi].set(_p.x, _p.y, _p.z, age > 0 ? age : -1); pi++;
        }
        _q.setFromAxisAngle(m.ax, t * m.spin + i);
        moons.setMatrixAt(i, _m.compose(_p, _q, _s.setScalar(Math.max(sc, 1e-3))));
      }
      moons.instanceMatrix.needsUpdate = true;
    }
    updateMoons(0);
    await ctx.yield();

    // ---- extra docked bubbles: a small foam beside the satellite, and the rare newcomer -----------------
    const sat = A.satellite, satDir = A.satDir;
    const tUp = UP.clone().addScaledVector(satDir, -UP.dot(satDir)).normalize();
    const tSide = V3().crossVectors(tUp, satDir).normalize();
    if (tSide.dot(path.pointAt(0.3).sub(sat.center)) < 0) tSide.negate();        // toward the side we arrive from
    const dockGeo = makeSphereGeo(17);
    const ridgeMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(1.2, 1.1, 0.9) });
    const poleN = A.poleNormal, holeRate = 165 / R;
    const docked = [];
    function makeDocked(bearingDeg, r, seedPh) {
      const b = bearingDeg * Math.PI / 180, rho = (sat.radius + r) * 0.86;
      const dir = satDir.clone().multiplyScalar(R).addScaledVector(tSide, Math.cos(b) * rho).addScaledVector(tUp, Math.sin(b) * rho).normalize();
      const c = dir.clone().multiplyScalar(R + r * 0.45).add(CEN);
      const mat = hero.makeMoonMaterial({ thin: 0.9, span: 2.6, ns: 1.0, phase: seedPh });
      const mesh = new THREE.Mesh(dockGeo, mat); mesh.scale.setScalar(r); mesh.position.copy(c); mesh.frustumCulled = false; mesh.renderOrder = 3;
      scene.add(mesh);
      // bright ridge where it meets the planet
      const d = R + r * 0.45, x0 = (d * d + R * R - r * r) / (2 * d), rr = Math.sqrt(Math.max(1, R * R - x0 * x0));
      const ridge = new THREE.Mesh(new THREE.TorusGeometry(rr, 0.38, 6, 96), ridgeMat);
      ridge.position.copy(dir).multiplyScalar(x0).add(CEN); ridge.quaternion.setFromUnitVectors(V3(0, 0, 1), dir); ridge.frustumCulled = false;
      scene.add(ridge);
      const o = { mesh, mat, ridge, c, dir, r, colat: Math.acos(clamp(dir.dot(poleN), -1, 1)), pos: c.clone(), gone: 0 };
      docked.push(o); return o;
    }
    const fr = rng.fork('foam');
    for (let i = 0; i < foam; i++) makeDocked(205 + i * 62 + fr.range(-8, 8), fr.range(15, 24), fr.range(0, 30));
    // rare: a second bubble drifts in and docks beside the satellite at mid-flight
    let newcomer = null;
    if (rare) {
      const o = makeDocked(158, 27, 11.3);
      const dSat = o.c.distanceTo(sat.center), xs = (dSat * dSat + sat.radius * sat.radius - o.r * o.r) / (2 * dSat);
      const wr = Math.sqrt(Math.max(1, sat.radius * sat.radius - xs * xs)), wn = o.c.clone().sub(sat.center).normalize();
      const wallPos = sat.center.clone().addScaledVector(wn, xs);
      const wall = new THREE.Mesh(new THREE.CircleGeometry(wr, 48), new THREE.MeshBasicMaterial({ color: C(pal[4]).multiplyScalar(0.5), transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending }));
      wall.position.copy(wallPos); wall.quaternion.setFromUnitVectors(V3(0, 0, 1), wn); wall.renderOrder = 5; scene.add(wall);
      const join = new THREE.Mesh(new THREE.TorusGeometry(wr, 0.4, 6, 96), ridgeMat);
      join.position.copy(wallPos); join.quaternion.copy(wall.quaternion); join.frustumCulled = false; scene.add(join);
      const from = o.dir.clone().multiplyScalar(0.75).addScaledVector(tUp, 0.5).addScaledVector(wn, 0.45).normalize();
      newcomer = { o, wall, join, from, nIdx: join.geometry.index.count, rIdx: o.ridge.geometry.index.count };
      join.geometry.setDrawRange(0, 0); o.ridge.geometry.setDrawRange(0, 0);
    }
    const DOCK_U = flankU - 0.08;
    const newcomerAt = (u, out) => {                           // POLISH L1D: the newcomer's way in as one function of u (updateDocked's own arithmetic, moved here unchanged), so that what hangs near the satellite can keep clear of the whole of it
      const n = newcomer, k = 1 - smoothstep(DOCK_U - 0.34, DOCK_U, u);
      return out.copy(n.o.c).addScaledVector(n.from, 300 * k * k + 3 * k).addScaledVector(tSide, 30 * k * Math.sin(u * 20));
    };
    function updateDocked(t, u) {
      const hole = hero.holeAngle();
      if (newcomer) {
        const n = newcomer, o = n.o;
        newcomerAt(u, o.pos);
        const snap = clamp((u - DOCK_U) * duration, 0, 9);                       // seconds since contact
        const wob = snap > 0 ? Math.exp(-snap * 1.6) * Math.sin(snap * 11) * 0.07 : 0;
        o.mesh.scale.set(o.r * (1 + wob), o.r * (1 - wob * 1.4), o.r * (1 + wob));
        const race = 3 * Math.floor(smoothstep(0, 1.1, snap) * n.nIdx / 3);
        n.join.geometry.setDrawRange(0, race); o.ridge.geometry.setDrawRange(0, 3 * Math.floor(smoothstep(0.1, 1.4, snap) * n.rIdx / 3));
        n.wall.material.opacity = 0.55 * smoothstep(0, 0.25, snap) * (0.6 + 0.4 * Math.exp(-snap));
      }
      for (const o of docked) {
        const tf = hole > 0 ? (hole - o.colat + 0.12) / holeRate : -1;           // freed when the rim arrives
        if (tf > 0) {
          const k = 1 - Math.exp(-tf * 0.7);
          o.mesh.position.copy(o.pos).addScaledVector(o.dir, 22 * k + 3 * tf).addScaledVector(tUp, 6 * k);
          o.mat.uniforms.uClipR.value = 0; o.mat.uniforms.uWob.value = 0.01 + 0.1 * Math.exp(-tf * 0.9);
          o.ridge.visible = false;
          if (newcomer && o === newcomer.o) { newcomer.join.visible = false; newcomer.wall.visible = false; }
        } else {
          o.mesh.position.copy(o.pos);
          o.mat.uniforms.uClipC.value.copy(CEN).sub(o.pos).divideScalar(o.r); o.mat.uniforms.uClipR.value = R / o.r;
          o.mat.uniforms.uWob.value = 0.012; o.ridge.visible = true;
          if (newcomer && o === newcomer.o) { newcomer.join.visible = true; newcomer.wall.visible = true; }
        }
        o.mesh.rotation.set(Math.sin(t * 0.7 + o.r) * 0.015, 0, Math.cos(t * 0.6 + o.r) * 0.015);
      }
    }
    await ctx.yield();

    // ---- soft-focus insects: one airliner-sized visitor beyond the limb, its reflection, a hoverfly ------
    const KIND = { bee: 0, dragonfly: 1, thistle: 2 }[insectKind];
    const insectGeo = new THREE.PlaneGeometry(2, 2);
    const makeInsect = (kind, alpha, flat, soft = 0) => new THREE.ShaderMaterial({
      uniforms: { uTime: time, uKind: { value: kind }, uA: { value: alpha }, uFlat: { value: flat }, uSoft: { value: soft }, uDark: { value: C('#1a1208') }, uGold: { value: C(pal[3]).multiplyScalar(0.8) }, uWing: { value: C(pal[4]).multiplyScalar(0.55) } },
      transparent: true, depthWrite: false, depthTest: false, side: THREE.DoubleSide,
      vertexShader: /* glsl */`varying vec2 vUv; void main(){ vUv = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: /* glsl */`
uniform float uTime, uKind, uA, uFlat, uSoft; uniform vec3 uDark, uGold, uWing; varying vec2 vUv;
float ell(vec2 q, vec2 c, vec2 r, float blur){ vec2 e = (q - c) / r; return 1.0 - smoothstep(1.0 - blur, 1.0 + blur, length(e)); }
void main(){
  vec2 q = vUv; vec3 col = vec3(0.0); float a = 0.0;
  if (uKind < 0.5) {                         // bee: a soft dark-and-gold barrel, two swept wings a pale blur
    float bl = 0.6 + 0.25 * uSoft, se = 0.7 + 0.7 * uSoft;
    float ab = ell(q, vec2(-0.3, -0.1), vec2(0.36, 0.2), bl), th = ell(q, vec2(0.14, -0.06), vec2(0.21, 0.19), bl), hd = ell(q, vec2(0.42, -0.1), vec2(0.12, 0.12), bl);
    float stripe = smoothstep(-se, se, sin(q.x * 14.0 + 0.4));
    a = max(max(ab, th), hd);
    col = mix(mix(uDark * 1.4, uGold * 0.75, 0.3), mix(uDark, uGold, stripe), smoothstep(0.0, 0.3, ab));
    col = mix(col, uDark, smoothstep(0.1, 0.5, hd) * (1.0 - smoothstep(0.2, 0.6, th)));
    float fl = sin(uTime * 23.0);
    vec2 w1 = q - vec2(-0.16, 0.3), w2 = q - vec2(-0.3, 0.16);
    w1 = vec2(w1.x * 0.9 + w1.y * 0.44, w1.y * 0.9 - w1.x * 0.44); w2 = vec2(w2.x * 0.97 + w2.y * 0.26, w2.y * 0.97 - w2.x * 0.26);
    float w = max(ell(w1, vec2(0.0), vec2(0.46, 0.15 + 0.05 * fl), 0.7), 0.8 * ell(w2, vec2(0.0), vec2(0.38, 0.11 - 0.04 * fl), 0.7)) * (1.0 - uFlat);
    col = mix(uWing * 1.2, col, smoothstep(0.0, 0.35, a)); a = max(a, w * 0.6);
  } else if (uKind < 1.5) {                  // dragonfly: four blurred vanes on a soft two-tone needle
    float bd = ell(q, vec2(-0.16, 0.0), vec2(0.66, 0.09), 0.7), th = ell(q, vec2(0.46, 0.0), vec2(0.2, 0.14), 0.6);
    a = max(bd, th);
    col = mix(uDark * 1.5, uGold * 0.55 + vec3(0.0, 0.16, 0.22), smoothstep(-0.7, 0.55, q.x)) * (1.0 - 0.6 * th) + uGold * 0.1 * smoothstep(0.0, 0.08, q.y) * th;
    float fl = sin(uTime * 14.0);
    float w = 0.0;                           // vanes swept a little back, each pair beating against the other
    for (int k = 0; k < 2; k++) {
      float sg = k == 0 ? 1.0 : -1.0;
      vec2 e1 = vec2(q.x - 0.4 + 0.1 * abs(q.y), q.y * sg - 0.3), e2 = vec2(q.x - 0.2 + 0.22 * abs(q.y), q.y * sg - 0.27);
      w += ell(e1, vec2(0.0), vec2(0.12 + 0.045 * fl, 0.3 + 0.05 * fl), 0.75) + 0.85 * ell(e2, vec2(0.0), vec2(0.11 - 0.045 * fl, 0.27 - 0.05 * fl), 0.75);
    }
    w = min(w, 1.0) * (1.0 - uFlat * 0.5);
    col = mix(uWing * 1.15, col, smoothstep(0.0, 0.4, a)); a = max(a, w * 0.62);
  } else {                                   // thistle seed: a drifting globe of down
    float r = length(q), an = atan(q.y, abs(q.x) + abs(q.y) < 1e-5 ? 1e-5 : q.x);
    float fil = 0.45 + 0.55 * pow(abs(sin(an * 13.0 + sin(an * 5.0) * 2.0 + uTime * 0.15)), 3.0);
    a = (1.0 - smoothstep(0.35, 0.95, r)) * fil * 0.7 + (1.0 - smoothstep(0.0, 0.12, r));
    col = mix(uWing * 1.5, uDark, 1.0 - smoothstep(0.03, 0.12, r));
  }
  a *= 1.0 - smoothstep(0.7, 1.0, length(q));       // nothing reaches the edge of the quad
  gl_FragColor = vec4(col, clamp(a, 0.0, 1.0) * uA);
}`,
    });
    const BEE_U = 0.3;                                         // crosses beyond the limb about 11 s in
    const big = new THREE.Mesh(insectGeo, makeInsect(KIND, 0.9, 0)); big.frustumCulled = false; big.renderOrder = -3;
    const bigLen = KIND === 2 ? 70 : (KIND === 1 ? 150 : 95);
    big.scale.set(bigLen, bigLen * (KIND === 2 ? 1 : 0.62), 1); scene.add(big);
    const pB = path.pointAt(BEE_U), tB = path.tangentAt(BEE_U), oB = pB.clone().sub(CEN).normalize(), rB = V3().crossVectors(tB, oB).normalize();
    const hill = rB.dot(V3().subVectors(V3(CEN.x, CEN.y + R, CEN.z), pB)) > 0 ? 1 : -1;       // +1: the summit is to the right
    const beeA = pB.clone().addScaledVector(tB, 430).addScaledVector(rB, -hill * 330).addScaledVector(oB, 150);
    const beeB = pB.clone().addScaledVector(tB, 330).addScaledVector(rB, hill * 260).addScaledVector(oB, 240);
    // its dark-and-gold reflection slides over the skin beneath us a moment later
    const refl = new THREE.Mesh(insectGeo, makeInsect(KIND, 0.0, 1)); refl.frustumCulled = false; refl.renderOrder = 6;
    refl.scale.set(46, 30, 1); scene.add(refl);
    const REFL_U = BEE_U + 0.07, pR = path.pointAt(REFL_U + 0.03), tR = path.tangentAt(REFL_U + 0.03), oR = pR.clone().sub(CEN).normalize(), rR = V3().crossVectors(tR, oR).normalize();
    // a hoverfly holds station by the satellite and darts away as we pass
    const HOVER_U = flankU - 0.01, pH = path.pointAt(HOVER_U + 0.03), tH = path.tangentAt(HOVER_U + 0.03), oH = pH.clone().sub(CEN).normalize();
    const awayH = pH.clone().sub(sat.center).normalize();
    const hoverAt = pH.clone().addScaledVector(awayH, 11).addScaledVector(oH, 3);
    const hover = new THREE.Mesh(insectGeo, makeInsect(0, 0.7, 0, 1)); hover.frustumCulled = false; hover.renderOrder = 11; hover.scale.set(4.2, 2.8, 1); scene.add(hover);
    const _x = V3(), _y = V3(), _z = V3(), _cam = V3(), _bm = new THREE.Matrix4();
    function face(mesh, pos, along, camPos) {               // billboard whose x axis is the direction of travel
      _z.subVectors(camPos, pos).normalize(); _x.copy(along).addScaledVector(_z, -along.dot(_z)).normalize(); _y.crossVectors(_z, _x);
      mesh.quaternion.setFromRotationMatrix(_bm.makeBasis(_x, _y, _z)); mesh.position.copy(pos);
    }
    const beeDir = beeB.clone().sub(beeA).normalize();
    function updateInsects(t, u, camPos) {
      const k = (u - (BEE_U - 0.08)) / 0.15;                 // the crossing is keyed to the journey
      _p.lerpVectors(beeA, beeB, k); _p.addScaledVector(oB, Math.sin(t * 1.7) * 6);
      face(big, _p, beeDir, camPos);
      // POLISH L1B: no gate on u for its coming (it was held invisible until k = 0.2). It flies its one straight line for the
      // whole flight and is simply there: small and far over the limb from the start, veiled by the planet's own film where
      // the limb stands in front of it (it is drawn before the skins), large overhead at the crossing, the journey's beat at BEE_U
      big.material.uniforms.uA.value = (KIND === 2 ? 0.8 : 0.9) * (1 - smoothstep(1.0, 1.3, k));
      big.visible = k < 1.3;
      const kr = (u - (REFL_U - 0.035)) / 0.085;
      _a.copy(pR).addScaledVector(rR, lerp(-70, 70, kr)).addScaledVector(tR, lerp(-12, 26, kr)).sub(CEN).normalize();
      _p.copy(_a).multiplyScalar(R + 0.8).add(CEN);
      _z.copy(_a); _x.copy(rR).addScaledVector(_z, -rR.dot(_z)).normalize(); _y.crossVectors(_z, _x);
      refl.quaternion.setFromRotationMatrix(_bm.makeBasis(_x, _y, _z)); refl.position.copy(_p);
      refl.material.uniforms.uA.value = (KIND === 2 ? 0.17 : 0.5) * smoothstep(0, 0.2, kr) * (1 - smoothstep(0.8, 1, kr));
      refl.visible = kr > 0 && kr < 1;
      const dart = smoothstep(HOVER_U - 0.015, HOVER_U + 0.05, u);
      _p.copy(hoverAt).addScaledVector(oH, Math.sin(t * 5.1) * 0.5 + 260 * dart * dart).addScaledVector(tH, Math.sin(t * 3.3) * 0.7 + 90 * dart).addScaledVector(awayH, Math.sin(t * 4.3 + 1) * 0.6 + 120 * dart * dart);
      face(hover, _p, tH, camPos);
      hover.visible = u > HOVER_U - 0.3 && dart < 0.98;
    }
    await ctx.yield();

    // ---- three dandelion seeds on parachutes 25 m across, every filament a fine white ribbon -------------
    const dr = rng.fork('seeds');
    const dg = { pos: [], dir: [], sw: [], col: [], idx: [] };
    const ribbon = (a, b, w0, w1, c0, c1) => {
      const n = dg.pos.length / 3, d = b.clone().sub(a).normalize();
      for (const [pt, w, c, s] of [[a, w0, c0, -1], [a, w0, c0, 1], [b, w1, c1, -1], [b, w1, c1, 1]]) { dg.pos.push(pt.x, pt.y, pt.z); dg.dir.push(d.x, d.y, d.z); dg.sw.push(s, w); dg.col.push(c.r, c.g, c.b); }
      dg.idx.push(n, n + 1, n + 2, n + 2, n + 1, n + 3);
    };
    {
      const white = C(pal[4]).multiplyScalar(1.15), tip = C(pal[4]).multiplyScalar(0.7), stem = C('#b9ad8c'), nut = C('#5a4326');
      ribbon(V3(0, 0, 0), V3(0.3, -7, 0), 0.16, 0.14, stem, stem); ribbon(V3(0.3, -7, 0), V3(0, -13.5, 0.2), 0.14, 0.2, stem, stem);
      ribbon(V3(0, -13.5, 0.2), V3(0, -16.6, 0.2), 0.55, 0.3, nut, nut);
      for (let i = 0; i < 72; i++) {
        const az = (i / 72) * Math.PI * 2 + dr.range(-0.05, 0.05), el = dr.range(0.12, 0.62), len = dr.range(10.5, 13);
        const h = V3(Math.cos(az), 0, Math.sin(az));
        let a = V3(0, 0, 0);
        for (let k = 1; k <= 3; k++) {
          const f = k / 3, b = h.clone().multiplyScalar(len * f * Math.cos(el)).add(V3(0, len * Math.sin(el) * (f - 0.35 * f * f), 0));
          ribbon(a, b, 0.07, 0.06, k === 3 ? tip : white, k === 3 ? tip : white); a = b;
        }
      }
    }
    await ctx.yield();
    const seedGeo = new THREE.BufferGeometry();
    seedGeo.setAttribute('position', new THREE.Float32BufferAttribute(dg.pos, 3)); seedGeo.setAttribute('aDir', new THREE.Float32BufferAttribute(dg.dir, 3));
    seedGeo.setAttribute('aSW', new THREE.Float32BufferAttribute(dg.sw, 2)); seedGeo.setAttribute('aCol', new THREE.Float32BufferAttribute(dg.col, 3)); seedGeo.setIndex(dg.idx);
    const seedU = { uPxK: spU.uPxK, uTime: time, uTint: { value: C(look.sunGlow).lerp(C('#ffffff'), 0.5).multiplyScalar(look.lamps ? 0.55 : 1) }, uCen: spU.uCen, uPr: domeU.uPr, uThru: domeU.uThru };
    const seeds = new THREE.InstancedMesh(seedGeo, new THREE.ShaderMaterial({
      uniforms: seedU, transparent: true, depthWrite: false, side: THREE.DoubleSide,
      vertexShader: /* glsl */`
attribute vec3 aDir, aCol; attribute vec2 aSW; uniform float uPxK, uTime, uPr, uThru; uniform vec3 uCen; varying vec3 vCol; varying float vS, vHid;
void main(){
  mat4 mm = modelMatrix;
  #ifdef USE_INSTANCING
  mm = modelMatrix * instanceMatrix;
  #endif
  vec3 p = position; p.xz *= 1.0 + 0.035 * sin(uTime * 1.1 + position.y * 0.4);        // the parachute breathes
  vec4 wp = mm * vec4(p, 1.0);
  vec4 mv = viewMatrix * wp;
  { // POLISH L1B: what hangs behind the planet is behind its skins (nothing here writes depth, so a far seed was drawn over
    // the film it is behind): each part goes out as the limb comes in front of it, and is back when the film is gone
    vec3 oc = uCen - cameraPosition, rd = wp.xyz - cameraPosition; float hl = max(length(rd), 1e-3); rd /= hl;
    float pb = dot(rd, oc), pd = pb * pb - dot(oc, oc) + uPr * uPr;
    vHid = uThru * step(0.0, pb) * smoothstep(0.0, 1500.0, pd) * smoothstep(0.0, 20.0, hl - (pb - sqrt(max(pd, 0.0))));
  }
  vec3 dv = mat3(viewMatrix) * mat3(mm) * aDir;
  vec2 n = vec2(-dv.y, dv.x); float nl = length(n); n = nl > 1e-4 ? n / nl : vec2(1.0, 0.0);
  float px = max(-mv.z, 0.1) * uPxK / max(projectionMatrix[1][1], 0.05);
  mv.xy += n * aSW.x * max(aSW.y, px * 0.8);
  vCol = aCol * min(1.0, aSW.y / max(px * 0.8, 1e-4) + 0.35); vS = aSW.x;
  gl_Position = projectionMatrix * mv;
}`,
      fragmentShader: /* glsl */`uniform vec3 uTint; varying vec3 vCol; varying float vS, vHid;
void main(){ float e = 1.0 - smoothstep(0.55, 1.0, abs(vS)); gl_FragColor = vec4(vCol * uTint, e * (1.0 - clamp(vHid, 0.0, 1.0))); }`,
    }), 3);
    seeds.frustumCulled = false; seeds.renderOrder = 11; scene.add(seeds);
    // POLISH L1B: the seats are fixed points of the world and no seed moves by u (the first and the third were lifted
    // 52 and 58 m off the planet in a second and a half, on u). Each row: the place on the route the seed hangs abeam of
    // (its own scatter draw is added; the places themselves: see L1D below), metres outward from the track there, metres
    // to the side: the first far out over the fall of the hillside; the third beside the place where the cap fails under
    // us, its distance from the track the canopy's 13 m + 8 m of clear air + the 14.5 m its drift can carry it.
    // POLISH L1C: the side is one stated rule for all three, on every route, as drawn or mirrored: the garden side of the
    // track, away from the summit, where the hillside falls away and the garden's air is (a seed drifts in from the
    // garden, and that is the side the gaze turns to). The table holds distances only: the second's was a signed number
    // in L1B. For the second the other side was weighed on each seed's own layout of satellite, foam and newcomer, and
    // lost: neither side touches them, and on the garden side it is in the picture, uncut, for longer (see the notes).
    const gardenSide = hill > 0 ? -1 : 1;                     // along l = tangent x outward: -1 when the summit is on that hand
    // POLISH L1D: each seat is METRES ALONG THE ROUTE from a place of the world (the first two were the flank passage minus a
    // typed quarter of the route's length, and a typed 0.41 of it), found by a test on each seed's own layout (the notes):
    //   the first hangs just beyond the knot where the run along the parallel ends and the track turns down across the street
    //     of storms (mPar): far out over the fall of the hillside, it is in the picture from the first second of the flight,
    //     comes nearer all along the run-in, and is passed after the track has turned away from it. MEND 1: its scatter is
    //     laid beyond the knot only (the same draw, its size taken: nothing to one canopy radius further along), so that on
    //     no seed is it passed while we still run along the parallel, the street of storms on our other hand;
    //   the second hangs as near the satellite as 18 m of clear air allow: walking back along the route from where the close
    //     pass begins (mPass), 2.5 m at a time, the first seat at which the whole reach of the seed (17 m of body about its
    //     hub and the 13.7 m its drift can carry it) stays 18 m clear of the satellite, of every foam bubble and of the
    //     newcomer on the whole of its way in, on this seed's own layout. The nearer the satellite, the longer the seed is
    //     seen coming with the satellite behind it; nearer than this it would brush them;
    //   the third hangs abeam of the place where the cap fails (the burst, in metres flown).
    // The seat's own scatter along the track is one draw of one canopy radius (13 m) either way (it was 0.02 of the route's
    // length either way; the same draw, in the same place of the 'seeds' stream); the first seat takes the draw's size only.
    const _st = V3(), _so = V3(), _sl = V3(), _nc = V3(), _sr = V3();
    const seatAt = (sm, jit, outD, aside, out) => {
      const p = path.posAtDist(sm + jit, out), t = path.tangentAtDist(sm, _st), o = _so.subVectors(p, CEN).normalize();
      _sl.crossVectors(t, o).normalize();
      return p.addScaledVector(o, outD).addScaledVector(_sl, gardenSide * aside);
    };
    const REACH = 17 + 13.7, CLEAR = 18;                      // metres: body and drift (the drift's box is 9, 5 and 9 m about a point 2 m under the seat); clear air
    const airRound = (b) => {                                  // the clear air between a seed's whole reach about its seat b and the nearest docked bubble's skin
      _sr.copy(b); _sr.y -= 2;
      let least = _sr.distanceTo(sat.center) - sat.radius;
      for (const o of docked) least = Math.min(least, _sr.distanceTo(o.c) - o.r);
      if (newcomer) for (let d = 0; d <= DOCK_U * Lp; d += 2.5) least = Math.min(least, _sr.distanceTo(newcomerAt(d / Lp, _nc)) - newcomer.o.r);
      return least - REACH;
    };
    const seedData = [[mPar, 10, 80, 1, false, true], [mPass, 30, 36, -1, true, false], [burstU * Lp, 16, 34, 1, false, false]].map(([m0, outD, aside, s, walk, beyond]) => {
      const j0 = dr.range(-13, 13), jit = beyond ? Math.abs(j0) : j0, base = seatAt(m0, jit, outD, aside, V3());
      let at = m0;                                             // metres of route this seat is abeam of (before its scatter)
      if (walk) while (at - 2.5 > mPar && airRound(base) < CLEAR) { at -= 2.5; seatAt(at, jit, outD, aside, base); }
      return { base, at, ph: dr.range(0, 6), tilt: dr.range(0.15, 0.35), spin: dr.range(0.08, 0.2) * s };
    });
    const _e = new THREE.Euler();
    function updateSeeds(t) {
      for (let i = 0; i < 3; i++) {
        const sdd = seedData[i];
        // the garden's air, one law on the world's clock for all three for the whole flight (each seed its own phase): a slow
        // turn 9 m wide at about a metre a second, a rise and fall of 5 m; nothing here knows where the camera is
        _p.copy(sdd.base); _p.x += Math.sin(t * 0.13 + sdd.ph) * 9; _p.y += Math.sin(t * 0.21 + sdd.ph * 2) * 5 - 2; _p.z += Math.cos(t * 0.11 + sdd.ph) * 9;
        _q.setFromEuler(_e.set(Math.sin(t * 0.5 + sdd.ph) * sdd.tilt, t * sdd.spin, Math.cos(t * 0.37 + sdd.ph) * sdd.tilt));
        seeds.setMatrixAt(i, _m.compose(_p, _q, _s.setScalar(1)));
      }
      seeds.instanceMatrix.needsUpdate = true;
    }
    updateSeeds(0);

    await ctx.yield();

    // ---- the portal waits inside the bubble: its light is seen through the black film ---------------------
    const seat = A.portalSeat.position;
    const glow = set.add(fx.makeGlow({ position: seat.toArray(), size: 36, color: look.portal, intensity: 1.1, halo: 0.4, core: 0.75, depthTest: false, fogAmount: 0, time, renderOrder: 0 }));
    // a second, wide and faint one: the portal burning through the black windows from far off
    const glowFar = set.add(fx.makeGlow({ position: seat.toArray(), size: 120, color: look.portal, intensity: 0, halo: 1, core: 0.25, depthTest: false, fogAmount: 0, time, renderOrder: 0 }));
    await ctx.yield();

    // POLISH L1: a ring of light at the portal's seat, inside the planet: it is what the black windows show
    // (drawn before the near skin, so colour film veils it and black film does not); it hands over to the
    // portal's own rim when the cap fails
    const ringMat = new THREE.MeshBasicMaterial({ color: C(look.portal).multiplyScalar(2.6), transparent: true, opacity: 1, depthWrite: false });
    const portalRing = new THREE.Mesh(new THREE.TorusGeometry(8.4, 0.5, 8, 72), ringMat);
    portalRing.position.copy(seat); portalRing.quaternion.setFromUnitVectors(V3(0, 0, 1), A.portalSeat.normal);
    portalRing.renderOrder = 1.5; portalRing.frustumCulled = false; scene.add(portalRing);
    await ctx.yield();

    const street = A.vortexStreet, ringC = A.ringCenter;
    // The gaze makes the journey's pictures (POLISH L1: five different ones before the satellite): the banded
    // hillside rising beside us; down into the vortex street; the satellite rising with the big visitor beyond
    // the limb; along the gap between the two skins; down into the black-film country; the ring.
    // POLISH L1D: what the lens looks at, in which order and with which weights is L1's and stands (the designer). The ends
    // of the first four windows are now places of the route in metres (they were the flank passage plus typed offsets of u),
    // each end where a person flying the route could say why the look changes there:
    //   the hillside: from the start of the route until the run-in meets the hillside (knot in2);
    //   down into the storms (POLISH L1E): from where the first storm comes under us (the route's foot on the film crosses
    //     the rim of the hook, the large entry swirl, as it is built on this seed: until then we look at the hillside as
    //     a whole) until the run along the parallel ends and the track itself turns down across the street;
    //   the satellite: from where its centre stands clear above the limb as seen from the route, until the close pass begins;
    //   along the gap: from where the track, across the street, turns in toward the satellite's flank, until the dome is
    //     again as far behind as it was ahead where the pass began.
    // An end divided by the route's length is only the engine's u for that many metres flown.
    const F = flankU;
    const pois = [
      { at: (t, u) => skinPt(u, 55, 22), from: 0.0, to: mMeet / Lp, weight: 0.85 },
      { at: (t, u) => skinPt(u, 20, -10), from: mStorm / Lp, to: mPar / Lp, weight: 0.92 },            // look down into the vortex street
      { at: sat.center, from: mRise / Lp, to: mPass / Lp, weight: 0.5 },
      { at: (t, u) => skinPt(u, 40, 0), from: mTurn / Lp, to: mLeft / Lp, weight: 0.7 },            // the close pass: along the gap, two skins and the ridge
      { at: (t, u) => blackAhead(u), from: F - 0.04, to: burstU + 0.02, weight: 0.8, fade: 0.14 },   // down into the black-film country, the portal burning through it
      { at: ringC, from: burstU - 0.04, to: 0.95, weight: 0.85 },           // the droplet ring and the portal hold the centre through the crest
    ];
    const _sa = V3(), _sb = V3(), _sn = V3();
    const TOP = V3(CEN.x, CEN.y + R, CEN.z);
    function skinPt(u, ahead, up) {                           // a point on the film `ahead` metres down the track and `up` metres upslope of it
      path.posAtDist(Math.min(Lp, (u || 0) * Lp + ahead), _sa);
      _sn.subVectors(_sa, CEN).normalize();
      _sb.subVectors(TOP, _sa); _sb.addScaledVector(_sn, -_sb.dot(_sn));
      if (_sb.lengthSq() > 1e-6) _sb.normalize();
      return _sa.addScaledVector(_sb, up).sub(CEN).normalize().multiplyScalar(R).add(CEN);
    }
    const _sc = V3();
    function blackAhead(u) {                                  // the skin 60 m ahead, so the gaze tips down over the summit; then P itself
      path.pointAt(Math.min(1, (u || 0) + 0.075), _sc).sub(CEN).normalize().multiplyScalar(R).add(CEN);
      return _sc.lerp(P, smoothstep(burstU - 0.13, burstU - 0.03, u || 0));
    }
    const _size = new THREE.Vector2();
    const flowRate = look.flow;

    return {
      scene, path, duration, title: look.title,
      ride: 'none', style: 'none',
      camera: { fov: 62, near: 0.4, far: 9000, lookAhead: 24, sway: 0.6, bank: 1 },
      pois,
      portal: { shape: 'circle', radius: 7, color: look.portal, glow: 1, tilt: true, revealDistance: 320 },
      post: {
        exposure: look.post.exposure, bloom: { strength: 0.42, radius: 0.6, threshold: 1.0 },
        grade: { saturation: look.post.sat, contrast: 1.06, tint: look.post.tint, shadowTint: look.post.shadow, vignette: 0.36, grain: 0.02, aberration: 0 },
      },
      update(dt, t, camera, u) {
        const uu = u || 0;
        time.value = t;
        camera.getWorldPosition(_cam);
        dome.position.copy(_cam);
        domeU.uPc.value.subVectors(CEN, _cam); domeU.uThru.value = 1 - smoothstep(burstU, burstU + 0.035, uu);
        hero.setProgress(uu);
        hero.update(dt, t * flowRate, camera);
        if (ctx.renderer) { ctx.renderer.getDrawingBufferSize(_size); spU.uPxK.value = 2 / Math.max(64, _size.y); }
        updateMoons(t); updateDocked(t, uu); updateInsects(t, uu, _cam); updateSeeds(t);
        set.update(dt, t, camera);
        // the film hides the portal's light until the black windows open and the cap fails
        glow.uniforms.uIntensity && (glow.uniforms.uIntensity.value = (0.5 + 1.3 * smoothstep(burstU - 0.02, burstU + 0.01, uu)) * (1 + 0.6 * smoothstep(burstU, burstU + 0.05, uu)) * (1 - 0.7 * smoothstep(0.87, 0.95, uu)));
        glowFar.uniforms.uIntensity && (glowFar.uniforms.uIntensity.value = (1.3 + 1.1 * smoothstep(burstU - 0.02, burstU, uu)) * smoothstep(0.56, burstU - 0.08, uu) * (1 - smoothstep(burstU, burstU + 0.05, uu)));   // POLISH L2: gone with the film (it veiled the whole frame after the burst)
        ringMat.opacity = 1 - smoothstep(burstU + 0.005, burstU + 0.05, uu);
      },
      dispose() { hero.dispose(); dockGeo.dispose(); ridgeMat.dispose(); },
    };
  },
};
