// Stone Face: one street, one pace, one line. Everything in it is aimed at the lens and timed to miss.
// The device (hat, hazards, the falling front) is src/parts/stone-face.js; this file is the street, the sky and the flight.
import * as THREE from 'three';
import { makePath } from '../kit/core.js';
import { buildDevice, makeShared, makeMaterials, makeRibbon, Rig, GLSL_COMMON, GLSL_HOLE, LEN, DUR, EYE, POLE_DZ } from '../parts/stone-face.js';

const D2R = Math.PI / 180;
// (flight2) the lot's two picket runs, in one place for the fence itself, the tufts at its foot and the rule that keeps the lot's dust off
// it: each run goes from x0 m out at d0 in to x1 m out at d1 (flight1's numbers: see the paling); the cross paling stands at d 471 and the
// lot's side fences 13 m out.
// (flight2 repair) door: the door-case's outline as the sun meets it, for the dust that stands in its shadow (the part shades it). A hand
// copy of the door-case as built below, about the line (|x| from, to; height from, to; and how fast the top falls with |x|), in the plane
// of its boards, z -490.1. The case is built 1.45 times its drawn size: jamb inner face (2.03 - 0.21) x 1.45 = 2.64; wing 1.9 wide from
// 2.3, so out to 6.09, fourteen boards to 4.55 m; its three narrow boards above, out to 4.785, to 5.42; the lintel with its fillet and
// cornice, 5.3 wide, 4.96 to 5.84; the pediment from the cornice's ends (3.99) to its apex at 7.61, a fall of 0.444 a metre; a tower flat
// each side, 3.4 wide about x 5, 5.4 to 11.2 m with its cornice; its parapet, 2.1 wide, to 11.95. The doorway itself (|x| under 2.64,
// under the lintel) lets the sun through, as it does onto the road. -1 as a near end means the part crosses the line
const LOT_RUN = { x0: 10.67, d0: 438, x1: 4.62, d1: 470.75, paling: 471, side: 13,
  door: { z: -490.1, parts: [[2.64, 6.09, 0, 4.55], [2.64, 4.785, 4.55, 5.42], [-1, 3.84, 4.96, 5.84], [-1, 3.99, 5.84, 7.61, 0.444], [3.3, 6.7, 5.4, 11.2], [3.95, 6.05, 11.2, 11.95]] } };
const col = (h) => new THREE.Color(h);

// the clapboard fronts: every front is laid out from its own seed (door, shop shutters, upper windows or a painted sign shape, fascia, frieze),
// and on the sunlit side of the street every relief throws its raking blue shadow down the wall toward the lens
const FACADE_FRAG = /* glsl */`
  uniform vec2 uRake; uniform float uCloud; uniform float uCsK; uniform vec3 uPaint; uniform vec3 uShut; uniform vec3 uCream; uniform vec3 uSlate; uniform vec3 uStraw; uniform vec3 uDeep; uniform vec3 uDust;
  varying vec3 vN; varying vec2 vL; varying vec4 vI; varying float vD; varying float vFace; varying vec3 vW; varying float vAw; varying float vCz;
  float bx(vec2 p, vec2 c, vec2 h) { vec2 d = abs(p - c) - h; return max(d.x, d.y); }
  float hh(float x) { return fract(sin(x * 91.7 + 1.3) * 4375.85); }
  float doorX(float w, float k2, float k3) { return (k3 > .6 ? w * .24 : 0.) * (k2 > .5 ? 1. : -1.); }
  float openings(vec2 p, float w, float h, float k2, float k3) {
    float dx = doorX(w, k2, k3);
    float m = bx(p, vec2(dx, 1.2), vec2(.62, 1.2));
    float one = bx(p, vec2(-dx * .8, 1.75), vec2(w * .21, .85));
    float two = bx(vec2(abs(p.x), p.y), vec2(w * .29, 1.75), vec2(w * .115, .85));
    m = min(m, k3 > .6 ? one : two);
    float n = w > 8.6 ? 3. : 2., sp = w / n, hf = (n - 1.) * .5;
    float xi = p.x - sp * clamp(floor(p.x / sp + (n > 2.5 ? .5 : 0.)) + (n > 2.5 ? 0. : .5), -hf, hf);
    m = min(m, bx(vec2(xi, p.y), vec2(0., 5.3), vec2(.52, .85)) + step(h, 7.1) * 9.);
    return m;
  }
  void main() {
    vec3 n = normalize(vN + vec3(0., 1e-5, 0.)); float w = vI.x, h = vI.y, sd = vI.z, y0 = vI.w, yA = vL.y + y0;
    float k2 = fract(sd * 17.31), k3 = fract(sd * 71.7), k4 = fract(sd * 131.9), k5 = fract(sd * 233.3);
    bool trimBox = y0 > .5; bool face = vFace > .5 && !trimBox;
    // a painted town: white and cream most of all, then butter, slate and blue, a few rose and brick fronts (none of those near the red sign
    // that comes for us); the mix leans a different way in each block of the street, so the street changes as it goes by
    float blk = floor(-vCz / 62.), lean = fract(blk * .37 + .2), kp = fract(k5 + lean * .45), far = step(104., -vCz) * step(-vCz, 322.), calm = step(322., -vCz);
    vec3 paint = uPaint;
    if (kp > .30) paint = uCream;
    if (kp > .46) paint = vec3(.84, .77, .58);          // butter, light enough to stay yellow on the shade side
    if (kp > .60) paint = vec3(.30, .40, .55);
    if (kp > .74) paint = vec3(.17, .36, .70);
    if (kp > .84) paint = mix(vec3(.44, .55, .7), uCream, 1. - far);
    if (kp > .94) paint = mix(vec3(.13, .22, .42), uPaint, 1. - far);          // (second pass) deep blue where a brick-red front stood: red is the sign's and the curtain's
    { float th = mod(blk, 5.), tk = step(fract(k5 * 7.3 + k4 * 3.1), .56) * (1. - calm);
      vec3 themeC = th < .5 ? uPaint : (th < 1.5 ? vec3(.85, .78, .6) : (th < 2.5 ? vec3(.36, .5, .7) : (th < 3.5 ? mix(uCream, vec3(.5, .63, .82), far) : uSlate * 1.05)));
      paint = mix(paint, themeC, tk); }
    paint = mix(paint, uCream, calm * step(.46, kp) * step(kp, .60));          // by the hotel even the butter fronts are cream: the curtain is the one warm thing
    float darkP = step(dot(paint, vec3(.33)), .4);
    vec3 trim = mix(mix(uPaint * 1.05, uCream * .96, step(.5, k4)), uPaint * 1.08, darkP);
    vec3 shut = mix(uShut, uDeep, step(.87, k2)); shut = mix(shut, uSlate * .66, step(k2, .3)); shut = shut * 1.3 + vec3(.03, .025, .01);
    shut = mix(shut, mix(uCream * .95, vec3(.82, .76, .6), step(.7, k2) * far), darkP * step(.35, k2));          // butter shutters, not red
    shut = mix(shut, vec3(.16, .3, .2), step(.8, k4) * (1. - darkP));          // a few bottle-green doors and shutters on the pale fronts
    vec3 band = mix(uSlate * .9, uCream * .9, step(.4, k3)); band = mix(band, uShut * 1.1, step(.86, k3));
    band = mix(band, vec3(.82, .76, .6), step(.55, k4) * step(k4, .75)); band = mix(band, vec3(.08, .22, .56), step(.75, k4));
    band = mix(band, uPaint, darkP * step(k3, .5));
    band = mix(band, uSlate * .9, calm * step(.55, k4) * step(k4, .75));
    float near = 1. - smoothstep(30., 85., vD), close = 1. - smoothstep(10., 30., vD);
    // clapboard: each board a shade of its own, a shadow line under its lap, nail heads close to
    float bf = fract(yA / .19), bi = floor(yA / .19);
    vec3 alb = trimBox ? trim : paint;
    float lapL = mix(.95, (.99 + .05 * bf) * (1. - .3 * (1. - smoothstep(.0, .13, bf))) * (.965 + .07 * hh(bi + sd * 50.)), near);
    float streak = hh(floor(vL.x * 7.) + sd * 9.) * hh(floor(vL.x * 2.3) + 4.);
    alb *= lapL * (1. - .07 * streak * near);
    alb *= 1. - .25 * close * step(abs(fract(vL.x / .62) - .5), .012) * step(abs(bf - .55), .07);
    float sh = 0.;
    if (face) {
      float m = openings(vL, w, h, k2, k3), dx = doorX(w, k2, k3);
      // fascia over the shop floor, corner boards, frieze with dentils, water table
      float fasc = step(abs(vL.y - 3.6), .3);
      alb = mix(alb, band * (1. - .14 * step(.25, abs(vL.y - 3.6))), fasc);
      float cb = step(w * .5 - .17, abs(vL.x));
      alb = mix(alb, trim, cb); alb *= 1. - .22 * step(w * .5 - .025, abs(vL.x));
      float fr = step(h - .52, vL.y);
      alb = mix(alb, trim * (1. - .2 * step(.5, fract(vL.x / .3)) * step(vL.y, h - .26) * step(h - .46, vL.y) * near), fr);
      alb = mix(alb, trim * .86, step(vL.y, .3));
      // a painted shape where a low front has no upper windows: plain, no lettering
      if (h < 7.1) { vec2 q = (vL - vec2(0., 5.0)) / vec2(w * .3, .52); float e = k2 > .5 ? length(q) - 1. : max(abs(q.x), abs(q.y)) - .9;
        alb = mix(alb, mix(band, trim, step(-.16, e)), step(e, 0.)); }
      // casings, then what is in them: louvred shutters, a panelled door
      alb = mix(alb, trim * 1.02, step(m, .11) * step(0., m));
      alb *= 1. - .18 * step(abs(m - .11), .012) * near;
      if (m < 0.) {
        vec2 dl = vL - vec2(dx, 1.2); bool door = abs(dl.x) < .62 && abs(dl.y) < 1.2;
        float lf = fract(vL.y / .105);
        vec3 lou = shut * mix(.9, (.7 + .42 * lf) * (1. - .25 * step(lf, .22)), near);
        lou = mix(lou, shut * 1.12, step(-.075, m));                                  // the stile round each leaf
        vec3 dr = shut * .92; float pan = min(bx(dl, vec2(0., .5), vec2(.4, .5)), bx(dl, vec2(0., -.62), vec2(.4, .4)));
        dr *= 1. - .22 * step(pan, 0.) + .2 * step(abs(pan - .02), .02) * near; dr = mix(dr, uCream * 1.1, step(length(dl - vec2(.47, -.1)), .045) * near);
        alb = door ? dr : lou;
        // the casing's own shadow into the recess
        sh = max(sh, step(0., openings(vL + vec2(-uRake.x, uRake.y) * .045, w, h, k2, k3)));
      } else {
        sh = max(sh, step(openings(vL + vec2(-uRake.x, uRake.y) * .075, w, h, k2, k3), .11) * step(.11, m));
      }
      // fascia, frieze and cornice shadows, and the whole shop floor under an awning
      sh = max(sh, step(vL.y, 3.3) * step(3.3 - .08 * uRake.y, vL.y));
      sh = max(sh, step(h - .52 - .05 * uRake.y, vL.y) * step(vL.y, h - .52));
      sh = max(sh, step(h - .22 * uRake.y, vL.y));
      float t = (3.4 - vL.y) / max(uRake.y, .1);
      sh = max(sh, vAw * step(0., t) * step(t, 1.4) * step(abs(vL.x - t * uRake.x), (w - 1.1) * .5));
      // road dust thrown up the foot of the wall
      alb = mix(alb, uDust, (1. - smoothstep(.0, 1.5, vL.y)) * .5);
    }
    float sunny = step(.5, vFace) * step(0., vN.x * uSun.x);
    float nl = n.y > .5 ? uSun.y : sunny * (1. - sh) * 1.0;
    // the side of the street turned from the sun is in decided blue shade, lit from the sky and, low down, from the sunlit road
    vec3 sky = uSkyC * (n.y < -.5 ? .2 : .64) * mix(.84, 1.06, smoothstep(0., 8., yA)) * mix(vec3(1.), vec3(.66, .7, .8), step(.5, vFace) * (1. - sunny));
    vec3 bounce = uGndC * (max(n.z, 0.) * 1.6 + abs(n.x) * .34 * mix(1.8, .4, smoothstep(0., 6., yA)) + max(-n.y, 0.) * 3.);
    vec3 c = alb * (uSunC * nl + sky + bounce);
    // the torn clouds' shade, the same patches the road carries, climbing the fronts as they race down the street
    vec2 gp = vW.xz - uSun.xz * (vW.y / max(uSun.y, 1e-3));
    c = mix(c, c * vec3(.5, .62, .95), sfShade(gp, uCloud) * uCsK * .9 * mix(.3, 1., sunny * (1. - sh)) * smoothstep(7., 22., vD));
    gl_FragColor = vec4(sfFog(c, vD), 1.); }`;

// (polish3) THE MARKET HALL's roof is boards with gaps: how much of a pixel at street position z (metres) is board, fp being the pixel's footprint
// along the street. The roof draws itself with it and the road draws the roof's shadow with it, so both hold together at any distance (never thin
// geometry: where a board is finer than a pixel it becomes an even half tone)
const HALL_Z0 = 249.6, HALL_Z1 = 280.4, HALL_EAVE = 8.62, HALL_RIDGE = 11.62, HALL_HALF = 6.6;
const SLAT_GLSL = /* glsl */`
float sfSlat(float z, float fp) {
  float P = 2.2, q = z / P, i = floor(q), t = abs(fract(q) - .5) * P, hh = fract(sin(i * 91.7) * 4375.85);
  float hw = .5 + .24 * hh;
  float cov = clamp((hw - t) / max(fp, 1e-3) + .5, 0., 1.) * step(.11, hh);
  return mix(cov, .5, smoothstep(.3 * P, .8 * P, fp)); }
`;
const HALL_DEF = `
#define HALL_Z0 ${HALL_Z0.toFixed(2)}
#define HALL_Z1 ${HALL_Z1.toFixed(2)}
#define HALL_RIDGE ${HALL_RIDGE.toFixed(2)}
#define HALL_SLOPE ${((HALL_RIDGE - HALL_EAVE) / HALL_HALF).toFixed(4)}
#define HALL_HALF ${HALL_HALF.toFixed(2)}
`;
const NOISE_GLSL = /* glsl */`
  float h2(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float vn(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
    return mix(mix(h2(i), h2(i + vec2(1., 0.)), f.x), mix(h2(i + vec2(0., 1.)), h2(i + vec2(1., 1.)), f.x), f.y); }`;
// the torn clouds, as a field on a plane overhead: the sky draws them and the lot takes their shadows from the same function.
// returns (density, present, offset in the cell); uBig swells them and fills more cells once the front is down and the sky is the picture
const CLOUD_GLSL = /* glsl */`
  vec4 sfCloud(vec2 q, float big) {
    q.x += .95;                                          // no cell border on the street's axis: the sky is not a mirror
    vec2 cs = vec2(2.6, 3.4), cell = floor(q / cs), f = q / cs - cell - .5;
    float thr = .5 - .34 * big, has = smoothstep(thr, thr + .06, h2(cell + 7.3));
    float edge = smoothstep(.5, .3, abs(f.x)) * smoothstep(.5, .3, abs(f.y));   // a cloud thins out toward the border of its cell: no cut edges
    vec2 o = (vec2(h2(cell), h2(cell + 3.1)) - .5) * .4; f -= o;
    float sz = (.7 + .5 * h2(cell + 11.9)) * (1. + .85 * big);
    float body = 1. - length(f * vec2(2.4, 4.4) / sz);
    float torn = vn(q * 2.3 + 5.) * .5 + vn(q * 5.9 + 1.7) * .28 + vn(q * 13.1) * .15 + vn(q * 29.) * .07;
    return vec4(body * .95 + torn - .52 - (1. - edge) * .9, has, f); }
  // the shade those clouds lay on the street: patches a block long with ragged hard edges, racing at us with the gale. gp is the point carried
  // down the sun to the ground; returns how deep in shade it is (0..1)
  // (a cloud's shadow has a wide soft edge; and none lies on the first block of the street: we arrive in full sun)
  float sfShade(vec2 gp, float uc) { vec4 cs = sfCloud(vec2(gp.x / 12. + 3.05, gp.y / 9. - uc * 3.4 + 1.15), .62);
    // (polish2) torn clouds throw torn shade: the sun breaks through it in ragged patches a few metres across that travel with the cloud, so the
    // road under a cloud is a pattern of sun and blue, never one flat tone
    float holes = vn(vec2(gp.x / 12., gp.y / 9. - uc * 3.4) * 3.3 + 7.3) * .7 + vn(vec2(gp.x / 12., gp.y / 9. - uc * 3.4) * 8.1 + 2.) * .3;
    return smoothstep(.0, .24, cs.x) * cs.y * (1. - smoothstep(-84., -48., gp.y)) * smoothstep(.36, .5, holes); }`;

export default {
  id: 'stone-face',
  name: 'Stone Face',
  category: 'city',
  weirdness: 0.45,
  media: ['open'],
  async build(ctx) {
    const rng = ctx.rng, detail = ctx.quality?.detail ?? 1, vary = ctx.vary || {};
    // ---- the visit's variations (all drawn first, in a fixed order) ----
    const sx = rng.chance(0.5) ? -1 : 1;                              // which kerb the sign, the first cart and the poles come from
    const slot2 = rng.chance(0.4) ? 'barrels' : 'carts';
    const kind = rng.pick(['hotel', 'hotel', 'opera', 'bank']);
    const lateHour = vary.hour === 'golden' ? true : vary.hour === 'day' ? false : rng.chance(0.4);   // 10:30 (sun left, 52 deg) or 13:30 (sun right, 44 deg)
    const rare = !!vary.rare;
    const sunSide = lateHour ? 1 : -1, elev = (lateHour ? 44 : 52) * D2R;
    const sunDir = new THREE.Vector3(sunSide * Math.sin(18 * D2R) * Math.cos(elev), Math.sin(elev), -Math.cos(18 * D2R) * Math.cos(elev)).normalize();

    const scene = new THREE.Scene();
    const shared = makeShared(sunDir), uRes = { value: new THREE.Vector2(800, 450) };
    scene.fog = new THREE.FogExp2(shared.uFogC.value, shared.uFogD.value);
    const sun = new THREE.DirectionalLight('#FFF6E2', 3.0); sun.position.copy(sunDir).multiplyScalar(100); scene.add(sun);
    scene.add(new THREE.HemisphereLight('#A9CBEE', '#E9DFC8', 0.9));
    const uHat = { value: new THREE.Vector4(0, -5, 1, 0) }, uGale = { value: 0.35 }, uTime = { value: 0 }, uSwing = { value: 0 }, uDrift = { value: 0 }, uCloud = { value: 0 }, uBig = { value: 0 }, uCsK = { value: 1 }, uLull = { value: 0 };
    await ctx.yield();

    // ---- sky: clear blue to pale at the roofline, five small torn clouds crossing fast (downwind, at us) ----
    const skyMat = new THREE.ShaderMaterial({
      uniforms: { uTop: { value: col('#3F7FD0').multiplyScalar(0.85) }, uHor: { value: col('#C4DCF4').multiplyScalar(1.18) }, uFogC: shared.uFogC, uCloud, uBig, uSun: shared.uSun, uWin: { value: new THREE.Vector3(0, 0, 0) } },
      vertexShader: /* glsl */`
        varying vec3 vDir;
        void main() { vDir = position; vec4 p = projectionMatrix * viewMatrix * vec4(position + cameraPosition, 1.);
          if (abs(p.w) < 1e-4) p.w = 1e-4; gl_Position = p.xyww; }`,
      fragmentShader: /* glsl */`
        uniform vec3 uTop; uniform vec3 uHor; uniform vec3 uFogC; uniform float uCloud; uniform float uBig; uniform vec3 uSun; uniform vec3 uWin; varying vec3 vDir;
        float h2(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
        float vn(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
          return mix(mix(h2(i), h2(i + vec2(1., 0.)), f.x), mix(h2(i + vec2(0., 1.)), h2(i + vec2(1., 1.)), f.x), f.y); }
        ` + CLOUD_GLSL + /* glsl */`
        void main() {
          vec3 d = normalize(vDir + vec3(0., 1e-5, 0.)); float y = max(d.y, 0.);
          vec3 c = mix(uHor, uTop, 1. - (1. - y) * (1. - y) * (1. - y));
          c = mix(c, uFogC, smoothstep(.2, -.02, d.y) * .9);
          // the piece of sky that stands behind the hotel (hidden by it, but for its one open window) is zenith blue, not horizon haze:
          // the window reads as a hole with sky in it from the far end of the street
          float inw = step(abs(d.x), -d.z * uWin.x) * step(d.y, -d.z * uWin.y) * step(0., d.y) * step(d.z, 0.) * min(uWin.z, 1.);
          // as the front comes over, the window looks up toward the sun's part of the sky: it blazes (uWin.z above 1), warm toward the sun's side
          vec3 wsky = mix(uTop, uHor, .2) * 1.32; float blaze = max(uWin.z - 1., 0.);
          wsky = mix(wsky, vec3(.5, .86, 1.7) + vec3(.3, .2, .02) * smoothstep(-.2, .6, d.x * sign(uSun.x) + d.y), blaze);
          c = mix(c, wsky, .9 * inw);
          // small torn clouds on a plane overhead: cells drifting +z (downwind, at us), most cells empty; each lit from the sun's side, blue beneath
          // high mare's tails, combed out along the wind: thin, bright, behind everything else in the sky and never in the hotel's window
          { vec2 qc = d.xz / max(d.y, .09); qc.y -= uCloud * .12; qc.x += qc.y * .22;      // combed a little across the street's axis, so they never point at the vanishing point
            float ci = vn(vec2(qc.x * 1.7 + vn(qc * vec2(.5, .3) + 3.) * 2.6, qc.y * .62)) * .6 + vn(vec2(qc.x * 4.9, qc.y * 1.7 + 7.)) * .4;
            ci = smoothstep(.52, .86, ci) * smoothstep(.42, .7, vn(qc * vec2(.31, .27) + 11.));
            c = mix(c, vec3(1.02, 1.03, 1.04), ci * .62 * smoothstep(.07, .22, d.y) * (1. - inw)); }
          // once the front is down the horizon is the sky's: a far bank of cumulus stands along it, lit from the sun's side, blue beneath, its foot lost
          // in the haze (uBig is 0 for the whole street: nothing ever stands behind the hotel or in its window)
          { float az = d.x / max(-d.z, .25), el = d.y;      // ahead of us only; no atan
            float top = .05 + .13 * vn(vec2(az * 2.1 + 4., 0.)) + .07 * vn(vec2(az * 6.3, 3.)) + .03 * vn(vec2(az * 19., 7.)) + .012 * vn(vec2(az * 53., el * 60.));
            top *= uBig * 2.05 * (.3 + .7 * smoothstep(.04, .5, abs(az)));            // lower straight behind the door, so the door stands against blue
            float in1 = smoothstep(top, top - .012, el);
            float lit = smoothstep(-.02, .05, el - top * (.45 + .25 * vn(vec2(az * 9., 1.))) + .03 * sign(uSun.x) * sin(az * 23. + vn(vec2(az * 5., 2.)) * 4.));
            vec3 bc = mix(vec3(.5, .62, .86), vec3(1.07, 1.03, .96), lit);   // (polish4) deeper blue on the bank's shade side: the white gate stands against modelled cloud
            bc = mix(uFogC * 1.02, bc, smoothstep(.0, .05, el));
            c = mix(c, bc, in1 * step(0., el) * step(d.z, -.05)); }
          vec2 q = d.xz / max(d.y, .05); q.y -= uCloud;
          vec4 cl = sfCloud(q, max(uBig, .72)); float dens = cl.x, has = cl.y; vec2 f = cl.zw;   // (polish4) .72: the street's torn clouds are a little larger and more of them, so no two stretches share one empty blue
          float n2 = vn(q * 5.9 + 1.7), n3 = vn(q * 13.1);
          float a = smoothstep(.1, .32, dens) * has * smoothstep(.05, .16, d.y);
          // thickness toward the middle; the side of each cloud turned to the sun is white, its belly the shade colour of the street
          float lit = smoothstep(-.25, .35, (f.x * uSun.x - f.y * .6) * 2.2 + (n2 - .5) * .9 + (n3 - .5) * .5);
          vec3 cc = mix(vec3(.55, .66, .84), vec3(1.06, 1.03, .97), lit) * mix(1., .9, smoothstep(.3, .9, dens) * (1. - lit));
          cc = mix(cc, c * 1.1, .35 * (1. - smoothstep(.1, .45, dens)));          // thin torn edges take the sky
          gl_FragColor = vec4(mix(c, cc, a * .95), 1.); }`,
      side: THREE.BackSide, depthWrite: false, fog: false,
    });
    const sky = new THREE.Mesh(new THREE.SphereGeometry(100, 24, 12), skyMat); sky.renderOrder = -1; sky.frustumCulled = false; scene.add(sky);
    await ctx.yield();

    // ---- the device first: the road needs the front's uniforms for its analytic shadow ----
    const dev = await buildDevice(ctx, { shared, uRes, sx, slot2, kind, rare, lotRun: LOT_RUN });
    scene.add(dev.object);
    const F = dev.front;
    await ctx.yield();

    // ---- ground: road, ruts, boardwalks, the lot; shadows are analytic and razor-edged ----
    const G = new Rig();
    { const g = new THREE.PlaneGeometry(400, 760, 1, 1); g.rotateX(-Math.PI / 2); G.addGeo(g, G.mat(0, 0, -260), col('#ffffff')); }
    const boardC = col('#ffffff');
    for (const s of [-1, 1]) {
      G.box(13, 0.3, 122, boardC, s * 11, 0.15, -55, 0, 0, 0, false);            // d -6 .. 116
      G.box(13, 0.3, 290, boardC, s * 11, 0.15, -269, 0, 0, 0, false);           // d 124 .. 414
      G.box(11.8, 0.3, 16, boardC, s * 11.6, 0.15, -422, 0, 0, 0, false);        // d 414 .. 430, set back 1.2 m
    }
    const groundMat = new THREE.ShaderMaterial({
      uniforms: { ...shared, ...dev.frontU, uRoad: { value: new THREE.Color(0.62, 0.5, 0.37) }, uBoard: { value: col('#CDBFA6').multiplyScalar(0.66) },
        uSunSide: { value: sunSide }, uHat, uRes, uDrift, uGale, uCloud, uBig, uTime, uSwing, uCsK, uLull, tRoof: { value: null }, tWash: { value: null }, tLine: { value: null } },
      vertexShader: /* glsl */`
        varying vec3 vW; varying vec3 vN; varying float vD;
        void main() { vec4 w = modelMatrix * vec4(position, 1.); vW = w.xyz; vN = normal;
          vec4 mv = viewMatrix * w; vD = length(mv.xyz); gl_Position = projectionMatrix * mv; }`,
      fragmentShader: GLSL_COMMON + GLSL_HOLE + HALL_DEF + SLAT_GLSL + /* glsl */`
        uniform float uTheta; uniform vec3 uSunF; uniform vec2 uHinge; uniform vec2 uWall; uniform vec3 uRoad; uniform vec3 uBoard; uniform vec3 uShadeC; uniform float uSunSide; uniform vec2 uRes; uniform float uDrift; uniform float uGale; uniform float uCloud; uniform float uBig; uniform sampler2D tRoof; uniform sampler2D tWash; uniform sampler2D tLine; uniform float uTime; uniform float uSwing; uniform float uCsK; uniform float uLull; uniform vec4 uHat;
        varying vec3 vW; varying vec3 vN; varying float vD;
        float h1(float x) { return fract(sin(x * 91.7) * 4375.85); }
        float h2(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
        float vn(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
          return mix(mix(h2(i), h2(i + vec2(1., 0.)), f.x), mix(h2(i + vec2(0., 1.)), h2(i + vec2(1., 1.)), f.x), f.y); }
        ` + CLOUD_GLSL + /* glsl */`
        // THE ROAD IS A SURFACE: its height in metres. Two ruts with thrown-up lips, wheel tracks that swerve across the street, the hoof-pocked
        // middle, fine wind ripples close to, and the track the hat's rim scribes (hk: how much of that track there is here). wz: how wide a
        // thing must be drawn at this distance to stay wider than a pixel
        float hatX(float z) { return .15 * sin(uHat.w - (z - uHat.y) * .5784); }
        float rdH(vec2 p, float wz, float rip, float hk) {
          float ax = abs(p.x), h = 0., s2 = .007 + wz * wz;
          float a0 = abs(ax - .75); h += (-.05 * exp(-a0 * a0 / s2) + .024 * exp(-(a0 - .2) * (a0 - .2) / s2)) * .084 / sqrt(s2);
          for (int i = 0; i < 3; i++) { float fi = float(i);
            float xc = (3.1 - .5 * fi) * sin(p.y * (.058 + .023 * fi) + fi * 2.1) + .5 * sin(p.y * .19 + fi * 5.);
            float d1 = abs(abs(p.x - xc) - .7);
            h += (-.016 * exp(-d1 * d1 / s2) + .007 * exp(-(d1 - .17) * (d1 - .17) / s2)) * .084 / sqrt(s2); }
          vec2 sc = vec2(2.6, 2.1), c = floor(p * sc), f = fract(p * sc) - .5; float k = h2(c + 3.3);
          vec2 o = (vec2(h2(c + 1.1), h2(c + 7.7)) - .5) * .5; float r = length((f - o) * vec2(1., 1.3));
          h -= .034 * step(.5, k) * (1. - smoothstep(2.2, 3.6, ax)) * exp(-r * r / .016) * rip;
          h += .005 * sin(p.y * 23. + 3. * vn(p * vec2(1.4, .5)) + 1.4 * sin(p.x * 2.3)) * rip * smoothstep(.3, .62, vn(p * vec2(.45, .16) + 31.));
          float dt = abs(p.x - hatX(p.y)); h += (-.03 * exp(-dt * dt / .0009) + .012 * exp(-(dt - .06) * (dt - .06) / .0012)) * hk;
          return h; }
        // carry the fragment along the sun to the plane of the front: in shadow unless it misses the wall or lands in the window
        vec3 frontShadow(vec3 p) {
          float st = sin(uTheta), ct = cos(uTheta); vec3 n = vec3(0., -st, ct), w = vec3(0., ct, st), H = vec3(0., uHinge.x, uHinge.y);
          float dn = min(dot(uSunF, n), -1e-4); float t = dot(H - p, n) / dn; vec3 q = p + t * uSunF;
          vec2 wc = vec2(q.x, dot(q - H, w));
          float hd = sfHole(wc);
          float inW = step(0., t) * step(abs(wc.x), uWall.x) * step(0., wc.y) * max(step(wc.y, uWall.y), sfCrown(wc));   // (flight4) the wall's rectangle and, above it, its crown
          return vec3(inW * step(0., hd), max(hd, 0.), inW * step(hd, 0.));
        }
        // THE METRONOME ON THE GROUND: carry the fragment up the sun to the height of the washing lines; it is in shadow if it meets the line itself
        // or the cloth streaming from it. The cloth is a strip from the line, a (from straight down) round toward us: its shadow is a ragged rung
        // across the road every 30 m, thin while the gale holds the sheets near the sun's own slant, deep when they hang limp in the lull
        float washShadow(vec3 p, float dF) {
          float r = abs(uSun.z) / max(uSun.y, 1e-3), kx = uSun.x / max(uSun.y, 1e-3);
          float zq = p.z - r * (5.2 - p.y);
          vec4 li = texture2D(tLine, vec2((floor(-zq) + .5) / 512., .5));
          float none = step(.5, li.r), row = floor(li.r * 255. + .5), dL = floor(-zq) + li.g * 17. - 8.;
          float xq = p.x + kx * (5.2 - p.y), bowK = max(1. - xq * xq / 49., 0.);
          float yT = 5.5 - bowK * (.45 - .4 * uGale), zL = -dL + bowK * uGale * 1.3;
          zq = p.z - r * (yT - p.y); xq = p.x + kx * (yT - p.y);
          vec4 w = texture2D(tWash, vec2((xq + 6.4) / 12.8, (min(row, 15.) + .5) / 16.));
          float L = w.r * 255. / 60., sd = w.g;
          // (flight1) the shadow is taken from the cloth's own pose, with no factor laid on it: the same gust that lifts the line's washing (see
          // the cloth's vertex shader: one expression, here and there) widens its rung on the road. A point k of the way down a piece L long
          // stands L k from the line at ak = a (.6 + .4 k) from straight down, and its shadow falls L k (sin ak - r cos ak) toward us from the
          // line's own; the rung is the span of that over the piece (taken at the hem, at .6 and at .3), and its edge toward us is ragged by
          // the wave that runs down the cloth (.26 m at the hem in the full gale)
          float gust = .5 + .5 * sin(uTime * 1.3 + dL * .07 + 1.2 * sin(uTime * .7 + dL * .031));   // dL is the line's d (= -z): the same phase as the cloth's
          float a = smoothstep(0., .22, uGale) * (.66 + .36 * uGale + .1 * sin(uTime * 3.3 + sd * 17.) + (.2 + .2 * uGale) * gust) + uSwing * sin(uTime * (2.1 + 1.1 * sd) + sd * 9.);
          a = min(a, 1.45);
          float f1 = L * (sin(a) - cos(a) * r), f6 = L * .6 * (sin(a * .84) - cos(a * .84) * r), f3 = L * .3 * (sin(a * .72) - cos(a * .72) * r);
          float wv = .26 * uGale * (cos(a) + r * sin(a)) * (.5 + .5 * sin(xq * 9. + uTime * 11. + sd * 30.));
          float hi = max(max(f1, f6), 0.) + wv, lo = min(min(f1, f6), min(f3, 0.));
          float dz = zq - zL;
          float cloth = step(lo, dz) * step(dz, hi) * step(.05, L);
          float line = step(abs(dz), max(.03, dF * .0016)) * step(abs(xq), 7.);
          return max(cloth, line) * (1. - none);
        }
        // (polish3) the market hall's slatted roof, carried down the sun: a ladder of hard blue stripes over road and boardwalk
        float hallShadow(vec3 p, float fp) {
          float kx = uSun.x / max(uSun.y, 1e-3), kz = uSun.z / max(uSun.y, 1e-3);
          float h = 10.2, xq = p.x + kx * (h - p.y); h = HALL_RIDGE - HALL_SLOPE * abs(xq);
          xq = p.x + kx * (h - p.y); h = HALL_RIDGE - HALL_SLOPE * abs(xq);
          xq = p.x + kx * (h - p.y); float zq = p.z + kz * (h - p.y);
          return sfSlat(zq, fp) * step(abs(xq), HALL_HALF) * step(zq, -HALL_Z0) * step(-HALL_Z1, zq); }
        void main() {
          float dF = length(vW - cameraPosition);   // per fragment: the road is two huge triangles, and a distance interpolated across them is wrong
          vec3 n = normalize(vN + vec3(0., 1e-5, 0.)); bool top = n.y > .5; bool board = vW.y > .2;
          float lot = smoothstep(-429., -436., vW.z);                       // past the hinge: the empty lot
          float close = 1. - smoothstep(5., 26., dF), mid = 1. - smoothstep(30., 110., dF);
          vec3 fs = frontShadow(vW); float fsh = fs.x * smoothstep(.3, .7, uTheta);   // under the falling front the road keeps its surface
          float g1 = vn(vW.xz * .31), g2 = vn(vW.xz * 1.7 + 9.), g3 = vn(vW.xz * 7.3), g4 = vn(vW.xz * 23.);
          // packed pale dust: trodden warm down the middle, looser and paler by the kerbs, grain and small stones close to
          vec3 alb = uRoad * (.9 + .13 * g1 + .07 * g2 * mid);
          alb *= mix(vec3(1.), vec3(1.05, 1., .9), smoothstep(4.5, 1., abs(vW.x)) * (1. - lot) * .6);
          // the street has been used: the middle is trodden darker and warmer, loose pale dust is banked along both kerbs, and old wheel tracks
          // wander down it beside the two that are the centre line
          float road = step(vW.y, .1) * (1. - lot), axx = abs(vW.x);
          alb *= mix(vec3(1.), vec3(.9, .86, .78), smoothstep(3.6, .8, axx) * road * (.6 + .4 * g1));
          alb = mix(alb, uRoad * vec3(1.22, 1.2, 1.14), smoothstep(3.1, 4.4, axx + (g1 - .5) * 1.6) * road * .75);
          { float fw = max(.07, dF * 1.3 / max(uRes.y, 1.)), tr = 0.;
            for (int i = 0; i < 3; i++) { float fi = float(i), x0 = 1.55 + fi * .82 + 1.1 * (vn(vec2(vW.z * .037 + fi * 7.3, fi * 3.1 + sign(vW.x))) - .5);
              tr = max(tr, (1. - smoothstep(fw * .5, fw, abs(axx - x0))) * (.45 + .55 * vn(vec2(vW.z * .09, fi * 9. + sign(vW.x) * 2.)))); }
            alb *= 1. - .09 * tr * road * min(1., .07 / fw * 2.2); }
          alb *= 1. + (.1 * (g3 - .5) + .13 * (g4 - .5)) * close;
          // combed by wheels and wind along the street: long streaks, fine across and slow along, so they hold at a grazing angle where grain cannot
          float comb = vn(vec2(vW.x * 4.3, vW.z * .23 + 3.)) * .55 + vn(vec2(vW.x * 11., vW.z * .6)) * .3 + vn(vec2(vW.x * 27., vW.z * 1.4)) * .15 * close;
          alb *= 1. + (comb - .5) * (.05 + .1 * fsh) * (1. - smoothstep(40., 90., dF)) * step(vW.y, .1) * (1. - lot);
          vec2 pc = floor(vW.xz * 5.), pf = fract(vW.xz * 5.) - .5; float ph = h2(pc);
          float pd = length(pf - (vec2(h2(pc + 1.7), h2(pc + 2.9)) - .5) * .5), pr = .05 + .11 * h2(pc + 5.3);
          float peb = step(.92, ph) * (1. - smoothstep(pr * .5, pr, pd));
          float pcl = 1. - smoothstep(3.5, 13., dF);
          alb *= 1. - .34 * peb * pcl * step(vW.y, .1);
          alb *= 1. + .16 * step(.92, ph) * (1. - smoothstep(pr, pr * 1.7, length(pf - (vec2(h2(pc + 1.7), h2(pc + 2.9)) - .5) * .5 + vec2(-.03, .05)))) * (1. - peb) * pcl * step(vW.y, .1);
          // wind ripples across the lot, at right angles to the breeze
          // the lot: wind-rippled dust in low relief at three scales, each fading out where it would be finer than a pixel: sun on the crests, blue in the troughs
          float fp = dF * dF / (1.41 * max(uRes.y, 1.));
          float wob = vn(vW.xz * vec2(.35, .12)) * 6.283;
          float r1 = sin(vW.z * 10.5 + wob * 1.6 + 2.5 * vn(vW.xz * vec2(1.3, .3)));
          float r2 = sin(vW.z * 2.6 + wob + 3. * g1);
          float r3 = sin(vW.z * .7 + vW.x * .12 + 4. * vn(vW.xz * .07));
          float rel = r1 * .5 * (1. - smoothstep(.06, .2, fp / .6)) + r2 * .36 * (1. - smoothstep(.06, .2, fp / 2.4)) + r3 * .2 * (1. - smoothstep(.06, .2, fp / 9.)) + (g1 - .5) * .5 + (vn(vW.xz * vec2(.11, .05) + 20.) - .5) * .7;
          alb *= mix(vec3(1.), vec3(1.) + (rel > 0. ? vec3(.24, .2, .12) : vec3(.42, .32, .12)) * rel, lot * step(vW.y, .1));
          alb *= mix(vec3(1.), vec3(1., .9, .72), lot * step(vW.y, .1));
          // two wheel ruts 1.5 m apart: the centre line, drawn on the ground (never thinner than ~1.5 px), each with a pale thrown-up lip
          float rw = max(.11, dF * 1.6 / max(uRes.y, 1.)), ax = abs(abs(vW.x) - .75 - .035 * (vn(vec2(vW.z * .21, 2.)) - .5) * close);
          float rut = 1. - smoothstep(rw * .5, rw, ax), lip = (1. - smoothstep(rw, rw * 2.4, ax)) * (1. - rut);
          float rk = step(vW.y, .1) * min(1., .11 / rw * 1.6);
          alb *= 1. - vec3(.3, .27, .2) * (1. + .4 * g3 * close) * rut * rk; alb *= 1. + .09 * lip * rk;
          // (second pass) THE PACE, UNDERFOOT: a plank crossing laid across the street every 17 m, from kerb to kerb (the washing lines count the
          // pace overhead, these count it on the ground: one goes under the hat every 1.4 s, at the speed we have kept from the start). Flat on
          // the road, 4 cm thick: weathered silver boards laid along the street, ragged at their ends, one missing here and there, dust drifted
          // over them and worn through where the two ruts cross; the end of every board that faces us is a line of blue shade
          // (none at d 180.7, where the ladder slaps down flat round the hat: nothing lies under a hazard that could be taken for part of it; none past d 402)
          float plSh = 0., onPl = 0.;
          { float cd = -vW.z, ck = floor((cd - 10.7) / 17. + .5), zc0 = cd - (10.7 + 17. * ck);
            float bxp = vW.x / .34, bip = floor(bxp), bfp = fract(bxp), bhp = h1(bip * 1.37 + ck * 7.1), bh2 = h1(bip * 5.71 + ck * 3.3);
            float halfL = 1.02 + .24 * (bhp - .5), zc = zc0 + (bh2 - .5) * .34;
            float cOn = step(-.5, ck) * step(ck, 23.5) * step(.5, abs(ck - 10.)) * road * step(abs(vW.x), 4.42) * step(.1, bhp);
            float inB = cOn * step(abs(zc), halfL);
            float pxw = dF * 1.4 / max(uRes.y, 1.);                                    // a pixel, in metres, here
            float gapK = 1. - smoothstep(.05, .16, pxw);
            float gap = (1. - smoothstep(.012 + pxw * .5, .03 + pxw, min(bfp, 1. - bfp) * .34)) * gapK;
            vec3 pl = mix(vec3(.4, .3, .19), vec3(.34, .29, .22), step(.6, bh2)) * (.72 + .56 * bhp);
            pl *= 1. + (.16 * (vn(vec2(vW.x * 31., vW.z * 2.1 + bip)) - .5) + .1 * (g3 - .5)) * close;      // grain along each board
            pl = mix(pl, vec3(.1, .12, .17), .8 * gap);
            pl *= 1. - .3 * close * step(length(vec2((bfp - .5) * .34, (abs(zc) - halfL + .12))), .022);          // a nail at each end
            float worn = 1. - smoothstep(.1, .34, abs(abs(vW.x) - .75));                            // the ruts have cut through: dust in the notches
            float dustC = clamp(smoothstep(.66, .9, vn(vW.xz * vec2(.8, 1.5) + ck * 9.) * .7 + g2 * .3) + .6 * worn, 0., 1.);
            alb = mix(alb, pl, inB * (1. - .9 * dustC));
            plSh = cOn * step(halfL, -zc) * step(-zc, halfL + max(.07, pxw * 1.3)) * (1. - .9 * worn) * min(1., .14 / max(pxw, 1e-3)); onPl = inB; }
          // the gale: pale dust streaming down the street at us, frozen and gone when the wind stops
          float wz = vW.z - uDrift;
          float wn = vn(vec2(vW.x * 1.1 + vn(vec2(wz * .05, 3.)) * 2.5, wz * .06)) * .62 + vn(vec2(vW.x * 2.9, wz * .15)) * .38;   // long thin streaks down the street
          // (second pass) THE GALE GROWS ON THE ROAD: a few thin streamers in the breeze we arrive in, broad rivers of blown dust by the poles;
          // none down the middle (the hat's pale crown stands against the trodden road, not against blown dust)
          float wthr = mix(.56, .4, smoothstep(.35, 1., uGale));
          float wisp = smoothstep(wthr, wthr + .16, wn) * smoothstep(.55, 1.5, abs(vW.x));
          float gk = min(1., uGale * 4.) * step(vW.y, .1);
          alb = mix(alb * .93, uRoad * vec3(1.4, 1.42, 1.42), wisp * gk * (.5 + .32 * uGale - .08 * lot));
          if (board) {
            float pz = vW.z / .3, pi = floor(pz), pfz = fract(pz);
            float gap = 1. - (1. - smoothstep(.0, .07, pfz)) * .45 * (1. - smoothstep(30., 70., dF));
            alb = uBoard * (.8 + .22 * h1(pi)) * gap * (.93 + .14 * vn(vec2(vW.x * 9., pi * 3.7)) * close);
            alb *= 1. - .3 * close * step(length(vec2(abs(abs(vW.x) - 5.75) - 1.1, (pfz - .5) * .3)), .018);     // nail heads
            alb *= 1. - .2 * step(abs(vW.x), 4.62);                                                            // the kerb board
            alb = mix(alb, uRoad * .95, .35 * smoothstep(5.3, 4.5, abs(vW.x)) * g2);                             // dust blown onto the boards
          }
          if (!top) alb = uBoard * (.72 + .1 * step(.5, fract(vW.z / 2.4)));
          // shadows: the true roofline of the row on the sun side (cornices, pediments, the gaps of the alleys), and the falling front
          float k = abs(uSun.x) / max(uSun.y, 1e-3), xr = uSunSide * vW.x;
          float bk = texture2D(tRoof, vec2((-vW.z - 2.) / 430., .5)).b * 255. / 16.;       // the square: the sun-side row stands back here
          float hN = max(7. + bk - xr, 0.) / max(k, 1e-3) + vW.y;
          float d0 = -(vW.z - (hN - vW.y) * abs(uSun.z) / max(uSun.y, 1e-3));
          vec4 rf = texture2D(tRoof, vec2(d0 / 430., .5)); float roof = (uSunSide < 0. ? rf.r : rf.g) * 255. / 16.;
          float rowSh = step(hN, roof) * step(0., d0 + 4.) * step(d0, 430.) * step(xr, 7.5 + bk) * step(0., xr + 20.);
          float hallSh = hallShadow(vW, dF * dF / (1.41 * max(uRes.y, 1.)));
          float sh = 1. - max(max(max(rowSh, fs.x), max(washShadow(vW, dF) * (1. - lot), plSh)), hallSh);
          alb *= mix(vec3(1.), vec3(.6, .72, .98), hallSh);
          // relief, lit from ahead: every wall of a rut or a hoof mark that faces the lens is in blue shade, its far side takes the sun
          float relief = 1.;
          { float flat0 = step(vW.y, .1), rk = (1. - smoothstep(16., 46., dF)) * flat0;
            float wz = dF * 1.1 / max(uRes.y, 1.), rip = 1. - smoothstep(3.5, 8.5, dF);
            float sT = vW.z - uHat.y, hk = step(-.06, sT) * (1. - smoothstep(5., 15., sT)) * uHat.z * flat0 * (1. - onPl);
            vec2 sh2 = normalize(uSun.xz + vec2(1e-5, 0.));
            float h0 = rdH(vW.xz, wz, rip, hk), h1 = rdH(vW.xz + sh2 * .035, wz, rip, hk), dh = (h1 - h0) / .035;
            float road2 = mix(step(abs(vW.x), 4.5), 1., lot);
            float hkOnly = hk * exp(-(vW.x - hatX(vW.z)) * (vW.x - hatX(vW.z)) / .02);
            float on = max(road2, hkOnly) * rk;
            relief = clamp(1. - 1.7 * dh * on, .3, 1.55);
            alb *= 1. + clamp(h0 * 5., -.3, .12) * on;
            // the spurt of dust the hat's rim throws back toward us from where it touches
            float fan = step(0., sT) * (1. - smoothstep(.0, 1.1, sT)) * (1. - smoothstep(.03 + .22 * sT, .06 + .3 * sT, abs(vW.x - hatX(vW.z)))) * uHat.z * flat0;
            alb = mix(alb, uRoad * vec3(1.42, 1.4, 1.34), fan * .7); }
          vec3 c = sfLit(alb, n, top ? relief : 1.);
          // in shadow the surface is kept and, under the front, drawn harder: grain, pebbles and planks in cool light, the rut lips picked out by
          // the bounce from the patch of sun, and the whole road a little paler toward that patch
          vec3 dtl = board ? alb / max(uBoard, vec3(1e-3)) * vec3(1.2, 1.08, .86) : alb / max(uRoad, vec3(1e-3));
          dtl = max(vec3(1.) + (dtl - 1.) * (1. + (board ? .6 : 1.2) * fsh), vec3(.66));
          float patchK = fsh * exp(-fs.y * .55);
          vec3 shadeC = uShadeC * mix(vec3(1.), vec3(.9, .97, 1.1), fsh) * dtl * (1. + .14 * patchK) + vec3(.07, .09, .12) * lip * rk * fsh * (.5 + patchK);
          // shadows are blue, never olive: the hazards' shadows are MIN-blended over the road in a blue darker than any sunlit grain of it (see
          // makeMaterials); the one channel a warm dark rut could still undercut is its blue, so that is given a floor just under the shadow's
          if (top) { c.b = max(c.b, .165); c = mix(shadeC, c, sh); }
          c *= 1. + vec3(.16, .13, .06) * fs.z * smoothstep(.3, .7, uTheta);   // the beam through the window: the warmest, brightest ground there is
          // the torn clouds' soft blue shadows slide over the lot toward us (the same field the sky draws, carried down the sun)
          vec4 cl = sfCloud((vW.xz - cameraPosition.xz) / 12. + uSun.xz / max(uSun.y, 1e-3) - vec2(0., uCloud * 3.), uBig);
          c = mix(c, c * vec3(.5, .64, 1.), smoothstep(.06, .42, cl.x) * cl.y * lot * .7 * (top ? 1. : 0.));
          // and down the street the same torn clouds throw patches of blue shade that race at us with the gale (gone once the front starts to come)
          c = mix(c, c * vec3(.37, .56, 1.14), sfShade(vW.xz, uCloud) * (1. - lot) * uCsK * .9 * sh);   // (a torn cloud's shade thins out as it reaches us: the road by the lens is always in sun)
          // the blown dust stands a little off the road, and the sun is beyond it: seen along the street each streamer is a veil of light, thin
          // by the lens and deep toward the far end, deeper as the gale rises; in a shadow it is blue. In the lull the dust hangs, a still even veil
          { float lit = top ? sh : 1.;
            float tauG = wisp * gk * (1. - lot) * (.012 + .085 * uGale * uGale) * min(dF, 46.);
            float tauL = uLull * (1. - lot) * step(vW.y, .1) * (.45 + .55 * vn(vW.xz * vec2(.21, .05) + 40.)) * .0045 * max(min(dF, 70.) - 8., 0.);
            float veil = 1. - exp(-(tauG + tauL));
            vec3 dustC = mix(uShadeC * 1.5, uSunC * vec3(.98, .9, .72) * (.82 + .2 * wn), lit * (1. - .8 * sfShade(vW.xz, uCloud) * uCsK));
            c = mix(c, dustC, veil * (top ? 1. : 0.)); }
          gl_FragColor = vec4(sfFog(c, dF), 1.); }`,
    });
    G.build(groundMat, groundMat); G.set(new THREE.Matrix4()); scene.add(G.mesh);
    await ctx.yield();
    // ---- the street: clapboard false fronts, one InstancedMesh; boards, shutters, doors, fascias and the raking shadows of all of them drawn in the shader ----
    const B = [];                                                       // [cx, cz, w along z, h, depth, side, seed, y0]  (y0 > 0: a plain trim box, cornice or pediment)
    const roofH = { '-1': new Float32Array(1024), '1': new Float32Array(1024) };   // roofline height along the street, each side: the shadow the row throws
    const AW = [];                                                      // awnings: x of the wall, cz, width, side, seed
    const gaps = { '-1': [[116, 124], [190.5, 193.5]], '1': [[116, 124], [234.5, 237.5]] };
    // (polish3) THE SQUARE: on the side away from the sign, the fronts between d 200 and the piano's alley stand 9 m back: a plank-decked square
    // with a clock tower in it. The street is still dead straight; only its wall steps aside
    const PLAZA_BACK = 9, plaza = [1e9, -1e9];
    for (const s of [-1, 1]) {
      const cuts = gaps[String(s * -sx)], segs = [[-4, cuts[0][0]], [cuts[0][1], cuts[1][0]], [cuts[1][1], 414], [414, 430]];
      for (const [a, b] of segs) {
        const n = Math.max(1, Math.round((b - a) / rng.range(7.6, 9.4)));
        for (let i = 0; i < n; i++) {
          const w = (b - a) / n, plz = s === -sx && a + w * (i + 0.5) > 200 && a + w * (i + 0.5) < 234.5 ? PLAZA_BACK : 0, back = a >= 414 ? 1.2 : plz, h = rng.range(6, 9.5), sd = rng();
          if (plz) { plaza[0] = Math.min(plaza[0], a + w * i); plaza[1] = Math.max(plaza[1], a + w * (i + 1)); }
          const d0 = a + w * i, fx = 7 + back, k2 = (sd * 17.31) % 1, k3 = (sd * 71.7) % 1;
          const hasAw = (sd * 131.9) % 1 > 0.42 && !(d0 + w / 2 > 400 || (Math.abs(d0 + w / 2 - (0.122 * LEN + 6.5)) < 9 && s === sx))
            && ![239, 0.590 * LEN + POLE_DZ, 0.620 * LEN + POLE_DZ, 0.649 * LEN + POLE_DZ].some((t) => Math.abs(d0 + w / 2 - t) < w / 2 + 0.4);   // no canvas where a mast or a pole stands on the kerb
          B.push([s * (7 + back + 6), -(a + w * (i + 0.5)), w, h, hasAw ? 12 : -12, s, sd, 0]);
          // cornice slab, and on about half the fronts a stepped pediment: the roofline is a row of different hats
          B.push([s * (fx - 0.22 + 0.4), -(d0 + w / 2), w + 0.06, 0.26, 0.8, s, sd, h]);
          let top = h + 0.26;
          if (k2 > 0.5) { const pw = w * (0.36 + 0.3 * k3), ph = 0.7 + 0.9 * k3;
            B.push([s * (fx + 0.2), -(d0 + w / 2), pw, ph, 0.4, s, sd, top]); B.push([s * (fx - 0.1 + 0.3), -(d0 + w / 2), pw + 0.3, 0.16, 0.6, s, sd, top + ph]);
            for (let j = Math.floor((d0 + w / 2 - pw / 2) / 430 * 1024); j <= (d0 + w / 2 + pw / 2) / 430 * 1024; j++) if (j >= 0 && j < 1024) roofH[s][j] = top + ph + 0.16; }
          for (let j = Math.floor(d0 / 430 * 1024); j < (d0 + w) / 430 * 1024; j++) if (j >= 0 && j < 1024) roofH[s][j] = Math.max(roofH[s][j], top);
          if (hasAw) AW.push([s * fx, -(d0 + w / 2), w - 1.1, s, sd]);
        }
      }
      B.push([s * 15.5, -435.05, 10, rng.range(9, 10.5), -15, s, rng(), 0]);     // flanking building butted to the hotel's edge
    }
    const roofData = new Uint8Array(1024 * 4);
    for (let j = 0; j < 1024; j++) { roofData[j * 4] = Math.min(255, Math.round(roofH['-1'][j] * 16)); roofData[j * 4 + 1] = Math.min(255, Math.round(roofH['1'][j] * 16)); roofData[j * 4 + 3] = 255;
      const dj = (j + 0.5) / 1024 * 430; roofData[j * 4 + 2] = sunSide === -sx && dj > plaza[0] && dj < plaza[1] ? PLAZA_BACK * 16 : 0; }   // (blue: how far back the sun-side row stands here)
    const roofTex = new THREE.DataTexture(roofData, 1024, 1, THREE.RGBAFormat); roofTex.magFilter = THREE.NearestFilter; roofTex.minFilter = THREE.NearestFilter; roofTex.needsUpdate = true;
    groundMat.uniforms.tRoof.value = roofTex;
    const bGeo = new THREE.InstancedBufferGeometry(); bGeo.copy(new THREE.BoxGeometry(1, 1, 1).translate(0, 0.5, 0));
    const aBox = new Float32Array(B.length * 4), aInf = new Float32Array(B.length * 4);
    B.forEach((b, i) => { aBox.set([b[0], b[1], b[2], b[3]], i * 4); aInf.set([b[4], b[5], b[6], b[7]], i * 4); });
    bGeo.setAttribute('aBox', new THREE.InstancedBufferAttribute(aBox, 4)); bGeo.setAttribute('aInf', new THREE.InstancedBufferAttribute(aInf, 4));
    bGeo.instanceCount = B.length;
    const rake = new THREE.Vector2(Math.abs(sunDir.z / sunDir.x), sunDir.y / Math.abs(sunDir.x));   // how far a relief's shadow runs along and down a sunlit front, per metre it stands out
    const bMat = new THREE.ShaderMaterial({
      uniforms: { ...shared, uCloud, uCsK, uRake: { value: rake }, uPaint: { value: col('#F4F1E8').multiplyScalar(0.8) }, uShut: { value: col('#7C8998').multiplyScalar(0.72) }, uCream: { value: col('#E9DFC8').multiplyScalar(0.8) },
        uSlate: { value: col('#8FA3BD').multiplyScalar(0.8) }, uStraw: { value: col('#D9B25A').multiplyScalar(0.72) }, uDeep: { value: col('#5578AA').multiplyScalar(0.62) }, uDust: { value: col('#E9DFC8').multiplyScalar(0.7) } },
      vertexShader: /* glsl */`
        attribute vec4 aBox; attribute vec4 aInf;
        varying vec3 vN; varying vec2 vL; varying vec4 vI; varying float vD; varying float vFace; varying vec3 vW; varying float vAw; varying float vCz;
        void main() { vCz = aBox.y; float dep = abs(aInf.x); vAw = step(0., aInf.x); vec3 p = vec3(position.x * dep + aBox.x, position.y * aBox.w + aInf.w, position.z * aBox.z + aBox.y);
          vN = normal; bool front = abs(normal.x) > .5;
          vL = front ? vec2(position.z * aBox.z, position.y * aBox.w) : vec2(position.x * dep, position.y * aBox.w);
          vI = vec4(aBox.z, aBox.w, aInf.z, aInf.w); vFace = front ? 1. : 0.; vW = p;
          vec4 mv = viewMatrix * vec4(p, 1.); vD = length(mv.xyz); gl_Position = projectionMatrix * mv; }`,
      fragmentShader: GLSL_COMMON + NOISE_GLSL + CLOUD_GLSL + FACADE_FRAG,
    });
    const street = new THREE.Mesh(bGeo, bMat); street.frustumCulled = false; scene.add(street);
    // ---- awnings over some of the shops: striped canvas that lifts and snaps in the gale, sun coming through it (seen from below) ----
    const awGeo = new THREE.InstancedBufferGeometry(); awGeo.copy(new THREE.PlaneGeometry(1, 1, 8, 5));
    const awA = new Float32Array(AW.length * 4), awB = new Float32Array(AW.length * 2);
    AW.forEach((a, i) => { awA.set([a[0], a[1], a[2], a[3]], i * 4); awB.set([a[4], (-a[3]) * sunDir.x > 0 ? 1 : 0], i * 2); });
    awGeo.setAttribute('aA', new THREE.InstancedBufferAttribute(awA, 4)); awGeo.setAttribute('aB', new THREE.InstancedBufferAttribute(awB, 2));
    awGeo.instanceCount = AW.length;
    const awMat = new THREE.ShaderMaterial({
      uniforms: { ...shared, uGale, uTime, uSwing, uCloud, uCsK, uC0: { value: col('#F4F1E8').multiplyScalar(0.8) }, uC1: { value: col('#8FA3BD').multiplyScalar(0.72) }, uC2: { value: col('#B7C3D2').multiplyScalar(0.8) }, uC3: { value: col('#E9DFC8').multiplyScalar(0.8) } },
      vertexShader: /* glsl */`
        attribute vec4 aA; attribute vec2 aB; uniform float uGale; uniform float uTime; uniform float uSwing;
        varying vec3 vP; varying float vD; varying vec3 vK; varying float vOut; varying vec2 vGp; uniform vec3 uSun;
        void main() {
          float v = position.y + .5, xw = position.x * aA.z, sd = aB.x, cv = min(v / .8, 1.), val = max(v - .8, 0.) / .2;
          float outw = cv * 1.4, drop = cv * .55 + val * .34;
          float g = uGale + uSwing * .4;
          float lift = sin(cv * 3.1416) * g * (.12 + .16 * sin(uTime * 3.1 + sd * 20. + xw * 1.7) + .08 * sin(uTime * 7.3 + xw * 4.1 + sd * 7.));
          float flap = val * g * (.3 * sin(uTime * 9. + xw * 5. + sd * 30.) + .14);
          vec3 p = vec3(aA.x - aA.w * (outw - flap * .3), 3.42 - drop + lift, aA.y + xw + flap * .5);
          vP = vec3(xw, v, sd); vK = vec3(aB.y, aA.w, lift); vOut = cv; vGp = p.xz - uSun.xz * (p.y / max(uSun.y, 1e-3));
          vec4 mv = viewMatrix * vec4(p, 1.); vD = length(mv.xyz); gl_Position = projectionMatrix * mv; }`,
      fragmentShader: GLSL_COMMON + NOISE_GLSL + CLOUD_GLSL + /* glsl */`
        uniform vec3 uC0; uniform vec3 uC1; uniform vec3 uC2; uniform vec3 uC3; uniform float uCloud; uniform float uCsK;
        varying vec3 vP; varying float vD; varying vec3 vK; varying float vOut; varying vec2 vGp;
        void main() {
          float sd = vP.z, k = fract(sd * 37.7);
          // scalloped valance
          float sc = abs(fract(vP.x / .42) - .5) * 2.; if (vP.y > .86 + .14 * sqrt(max(1. - sc * sc, 0.))) discard;
          vec3 a = k < .2 ? uC1 : (k < .4 ? vec3(.1, .26, .6) : (k < .6 ? mix(vec3(.3, .44, .66), uC1, step(326., -vGp.y)) : (k < .76 ? mix(uC3, vec3(.2, .3, .46), step(104., -vGp.y) * step(-vGp.y, 318.)) : uC2))), b = k > .9 ? uC3 : uC0;
          vec3 alb = mix(a, b, step(.5, fract(vP.x / .56 + .25)));
          float sunlit = mix(smoothstep(.45, .7, vOut), 1., vK.x);
          float under = gl_FrontFacing ? 1. : 0.;
          vec3 n = normalize(vec3(-vK.y * .36, .93, 0.));
          float top = max(dot(n, uSun), 0.);
          // from below the canvas is lit by what comes through it and by the pale road; from above by the sun itself
          vec3 li = mix(uSunC * top * sunlit + uSkyC * .7, uSunC * .62 * sunlit + uSkyC * .28 + uGndC * 2.6, under);
          vec3 c = alb * li * (1. - .12 * step(.8, vP.y) * (1. - under));
          c = mix(c, c * vec3(.5, .62, .95), sfShade(vGp, uCloud) * uCsK * .9 * sunlit * smoothstep(7., 22., vD));
          gl_FragColor = vec4(sfFog(c, vD), 1.); }`,
      side: THREE.DoubleSide,
    });
    const awn = new THREE.Mesh(awGeo, awMat); awn.frustumCulled = false; scene.add(awn);
    await ctx.yield();
    await ctx.yield();

    // ---- the lot behind the front: a board fence, and a white door frame standing alone at the end of the line ----
    const mats = makeMaterials(shared), S = new Rig();
    const fenceC = col('#8E897E').multiplyScalar(0.85),          // (second pass) weathered silver-grey boards, some whitewashed: no blue, no straw in the lot
       white = col('#F4F1E8').multiplyScalar(0.8), dark = col('#16181C'), iron = col('#3A4250');
    // the fence: weathered boards of uneven height with gaps between, rails behind, a post every 3 m; it faces us in shade, a calm band behind the door
    const hsh = (i) => { const x = Math.sin(i * 12.9898 + 4.1) * 43758.5453; return x - Math.floor(x); };
    const FX = 13, FZ = -512, fenceShade = [0.6, 0.74, 0.88, 1.0], fencePaint = [col('#F4F1E8'), col('#8FA3BD').multiplyScalar(0.9), col('#E9DFC8'), col('#F4F1E8')], capC = col('#F4F1E8').multiplyScalar(1.5);
    let fi = 0;
    const board = (x, z, alongX, neat = false) => { const k = hsh(fi++), hgt = neat ? 2.12 + 0.07 * hsh(fi * 3.7) : 2.05 + 0.5 * hsh(fi * 3.7) * hsh(fi * 3.7), lean = (hsh(fi * 7.1) - 0.5) * (neat ? 0.008 : 0.025);
      const c = neat ? (hsh(fi * 5.3) > 0.86 ? fencePaint[1] : fencePaint[0]).clone().multiplyScalar(0.9 + 0.2 * hsh(fi * 1.7))
        : (hsh(fi * 5.3) > 0.76 ? fencePaint[Math.floor(hsh(fi * 1.7) * 4)] : fenceC).clone().multiplyScalar(fenceShade[Math.floor(k * 4)]);
      if (neat || k > 0.13) { S.box(alongX ? 0.25 : 0.035, hgt, alongX ? 0.035 : 0.25, c, x, hgt / 2, z, alongX ? 0 : lean, 0, alongX ? lean : 0, false);
        S.box(alongX ? 0.25 : 0.07, 0.05, alongX ? 0.07 : 0.25, capC, x, hgt + 0.025, z, 0, 0, 0, false); } };
    for (let x = -FX; x <= FX; x += 0.3) board(x, FZ, true);
    await ctx.yield();
    for (const s of [-1, 1]) { for (let z = -442.8; z > FZ; z -= 0.3) board(s * FX, z, false); await ctx.yield(); }
    const railC = fenceC.clone().multiplyScalar(0.6);
    for (const y of [0.55, 1.75]) { S.box(FX * 2, 0.09, 0.05, railC, 0, y, FZ - 0.05, 0, 0, 0, false); for (const s of [-1, 1]) S.box(0.05, 0.09, 69.2, railC, s * (FX + 0.05), y, (FZ - 442.8) / 2, 0, 0, 0, false); }
    for (let x = -FX; x <= FX + 0.01; x += 3.25) S.box(0.13, 2.6, 0.13, railC, x, 1.3, FZ - 0.1, 0, 0, 0, false);
    for (const s of [-1, 1]) for (let z = -444; z > FZ; z -= 3.4) S.box(0.13, 2.6, 0.13, railC, s * (FX + 0.1), 1.3, z, 0, 0, 0, false);
    // (polish2) the lot is still only a lot, a fence and a door, but the fence also crosses it 20 m short of the door, open 9 m wide where the
    // ruts go through between two white gate posts: at u 0.94 it is the middle of the picture, with its shadows thrown toward us, and the door stands in the gap
    { const GZ = -471;
      for (const s2 of [-1, 1]) { for (let x = 4.75; x <= FX - 0.2; x += 0.3) board(s2 * x, GZ, true, true);   // (polish4) whole and whitewashed: a made paling, not a row of stray posts
        S.box(FX - 4.6, 0.07, 0.16, capC, s2 * (FX + 4.6) / 2, 2.24, GZ, 0, 0, 0, false);
        for (const y of [0.55, 1.75]) S.box(FX - 4.6, 0.09, 0.05, railC, s2 * (FX + 4.6) / 2, y, GZ - 0.05, 0, 0, 0, false);
        for (let x = 7.6; x < FX; x += 3.1) S.box(0.13, 2.6, 0.13, railC, s2 * x, 1.3, GZ - 0.1, 0, 0, 0, false);
        S.box(0.34, 3.5, 0.34, col('#F4F1E8').multiplyScalar(1.05), s2 * 4.5, 1.75, GZ, 0, 0, 0, false).box(0.5, 0.14, 0.5, col('#F4F1E8').multiplyScalar(0.9), s2 * 4.5, 3.55, GZ, 0, 0, 0, false);
        S.addGeo(new THREE.SphereGeometry(0.24, 10, 8), S.mat(s2 * 4.5, 3.84, GZ), col('#F4F1E8').multiplyScalar(0.95)); } }
    // (flight1) THE PALING COMES IN TO THE GATE: from the lot's sides a low whitewashed picket run on each hand closes in on the two gate posts,
    // so the 33 m from the props to the cross paling is a drive with a near, a middle and a far, pickets going by at the pace we have kept, and
    // their slatted shadows on the dust. Low (1.1 m, under the eye's 1.7 m): the fence, the gate and the sky stay whole above it. Each run
    // is laid from 10.67 m out at d 438 (2 m beyond the last prop's foot; the props fold across the line, not outward, so they never reach it).
    // Its first 2 m stand inside the flanking building (x 8 to 23, d 430 to 440) and are never seen: the run comes out of that building's rear wall. It
    // ends on its gate post, 4.62 m out: nothing of it stands nearer the line than the posts the amendment allows at 4.5 m
    { const A = [LOT_RUN.x0, -LOT_RUN.d0], B = [LOT_RUN.x1, -LOT_RUN.d1], Lw = Math.hypot(B[0] - A[0], B[1] - A[1]), nP = Math.floor(Lw / 0.22);
      for (const s2 of [-1, 1]) { const yaw = Math.atan2(s2 * (A[0] - B[0]), A[1] - B[1]);
        for (let i = 0; i <= nP; i++) { const t = i / nP, x = s2 * (A[0] + (B[0] - A[0]) * t), z = A[1] + (B[1] - A[1]) * t, hgt = 1.06 + 0.1 * hsh(i * 3.3 + s2 * 11 + 600);
          if (hsh(i * 7.9 + s2 * 5 + 610) < 0.05) continue;                                                          // a picket gone here and there
          S.box(0.03, hgt, 0.11, (hsh(i * 5.3 + s2 + 620) > 0.84 ? fencePaint[1] : fencePaint[0]).clone().multiplyScalar(0.88 + 0.22 * hsh(i * 1.7 + s2 * 3 + 630)), x, 0.08 + hgt / 2, z, 0, yaw, 0, false); }
        for (const y of [0.38, 0.9]) S.box(0.05, 0.08, Lw, railC, s2 * ((A[0] + B[0]) / 2 + 0.04), y, (A[1] + B[1]) / 2, 0, yaw, 0, false);   // two rails behind the pickets
        for (let k = 0; k <= 12; k++) { const t = k / 13, x = s2 * (A[0] + (B[0] - A[0]) * t + 0.1), z = A[1] + (B[1] - A[1]) * t;       // a post every 2.56 m (thirteen bays), capped
          S.box(0.13, 1.36, 0.13, capC.clone().multiplyScalar(0.6), x, 0.68, z, 0, yaw, 0, false).box(0.2, 0.05, 0.2, capC, x, 1.385, z, 0, yaw, 0, false); } } }
    await ctx.yield();
    // (polish2) the whole door-case is built 1.45 times the size it was drawn at: at u 0.94 it is the subject of the frame, not a box on the horizon
    const DK = 1.45, SD = { box(w, h, d, c, x, y, z, rx = 0, ry = 0, rz = 0, solid = true) { S.box(w * DK, h * DK, d * DK, c, x * DK, y * DK, -LEN + (z + LEN) * DK, rx, ry, rz, solid); return SD; } };
    // the door frame, standing alone at the end of the line: jambs with an architrave, a lintel and a small cornice, plinths, a threshold
    const doorW = col('#F4F1E8').multiplyScalar(1.12), white2 = doorW.clone().multiplyScalar(0.9);
    for (const s of [-1, 1]) {
      SD.box(0.42, 3.5, 0.5, doorW, s * 2.03, 1.75, -LEN, 0, 0, 0, false);
      SD.box(0.12, 3.5, 0.58, white2, s * 2.2, 1.75, -LEN, 0, 0, 0, false);
      SD.box(0.56, 0.34, 0.64, white2, s * 2.05, 0.17, -LEN, 0, 0, 0, false);
    }
    SD.box(4.9, 0.46, 0.52, doorW, 0, 3.68, -LEN, 0, 0, 0, false);
    SD.box(5.3, 0.12, 0.8, white2, 0, 3.97, -LEN, 0, 0, 0, false);
    SD.box(5.0, 0.08, 0.66, doorW, 0, 3.46, -LEN, 0, 0, 0, false);
    SD.box(3.7, 0.04, 0.3, fenceC.clone().multiplyScalar(0.8), 0, 0.02, -LEN, 0, 0, 0, false);
    // the door is one more piece of scenery, like the hotel: a pediment over it, and behind it two raking props of raw pine with a sole plate each
    const _bq = new THREE.Quaternion(), _be = new THREE.Euler(), _ba = new THREE.Vector3(), _bb = new THREE.Vector3(), _up = new THREE.Vector3(0, 1, 0);
    const beam = (R, a, b, t, c) => { _ba.set(a[0], a[1], a[2]); _bb.set(b[0], b[1], b[2]); const L = _ba.distanceTo(_bb);
      _bq.setFromUnitVectors(_up, _bb.clone().sub(_ba).normalize()); _be.setFromQuaternion(_bq);
      R.box(t, L, t, c, (a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2, _be.x, _be.y, _be.z, false); };
    const pine = col('#B08A5A').multiplyScalar(0.95), blueP = col('#3F7FD0').multiplyScalar(0.62), lotB = col('#9FB0C6').multiplyScalar(0.8);   // lotB: the door-case's weathered grey-blue (no royal blue in the lot)
    for (const s of [-1, 1]) {
      beam(SD, [s * 2.75, 4.02, -LEN], [0, 5.25, -LEN], 0.22, doorW);                          // the pediment's rakes
      beam(SD, [s * 2.1, 3.7, -LEN - 0.3], [s * 4.6, 0.1, -LEN - 3.4], 0.16, pine);             // a raking prop
      beam(SD, [s * 2.1, 2.0, -LEN - 0.3], [s * 3.4, 0.1, -LEN - 1.9], 0.12, pine);             // and a shorter one under it
      SD.box(0.5, 0.1, 1.2, pine, s * 4.6, 0.05, -LEN - 3.4, 0, s * 0.6, 0, false);
      SD.box(0.3, 0.3, 0.3, lotB, s * 2.03, 4.3, -LEN, 0, 0, 0, false);                         // a painted block on each shoulder
    }
    SD.box(3.2, 0.74, 0.1, white2, 0, 4.42, -LEN - 0.05, 0, 0, 0, false);                        // the tympanum, boarded
    for (const s of [-1, 1]) {                                                                // a clapboard wing each side, stepped down at its outer end: a small false front
      for (let i = 0; i < 17; i++) { const y = 0.34 + i * 0.2, wd = i > 13 ? 1.0 : 1.9;
        SD.box(wd, 0.2, 0.06, (i % 2 ? doorW : white2).clone().multiplyScalar(0.94 + 0.08 * hsh(i * 3.1 + s)), s * (2.3 + wd / 2), y + 0.1, -LEN - 0.08, 0.06, 0, 0, false); }
      SD.box(0.14, 3.2, 0.14, doorW, s * 4.2, 1.6, -LEN - 0.04, 0, 0, 0, false);
      SD.box(1.0, 0.1, 0.24, doorW, s * 3.75, 3.2, -LEN - 0.04, 0, 0, 0, false).box(1.2, 0.1, 0.24, doorW, s * 2.85, 3.8, -LEN - 0.04, 0, 0, 0, false);
      SD.box(1.3, 1.5, 0.05, lotB.clone().multiplyScalar(0.8), s * 3.25, 1.75, -LEN - 0.02, 0, 0, 0, false);            // a closed weathered shutter in it
      SD.box(1.5, 0.1, 0.12, doorW, s * 3.25, 2.55, -LEN, 0, 0, 0, false).box(1.5, 0.1, 0.12, doorW, s * 3.25, 0.95, -LEN, 0, 0, 0, false);
    }
    S.addGeo(new THREE.CylinderGeometry(0.34 * DK, 0.34 * DK, 0.08, 20).rotateX(Math.PI / 2), S.mat(0, 4.44 * DK, -LEN + 0.05), lotB);   // one painted disc in it
    // (polish4) THE DOOR STANDS IN A GATE OF TWO FLATS: each side of the door-case a tall narrow false front of white clapboard (a shuttered
    // window, a cornice, a stepped parapet, a staff) held up from behind by raking pine props, like the hotel that has just fallen: one more
    // piece of scenery, standing alone in the lot, and at u 0.94 a white landmark against the cloud bank. The middle is left open above the
    // pediment (|x| under 3.3 m): nothing may stand in the piece of sky the hotel's open window shows from down the street. Top 13.6 m:
    // under the sight line over the hotel's 13 m front from anywhere in the street
    const gatePen = [];
    for (const s of [-1, 1]) { const tx = s * 5.0, tz = -LEN - 0.1, y0 = 5.4, y1 = 11.0, tw = 3.4;
      for (let i = 0; i < 20; i++) { const y = y0 + (i + 0.5) * (y1 - y0) / 20;
        S.box(tw, (y1 - y0) / 20, 0.07, (i % 2 ? doorW : white2).clone().multiplyScalar(0.93 + 0.09 * hsh(i * 3.7 + s * 5 + 40)), tx, y, tz, 0.05, 0, 0, false); }
      for (const e of [-1, 1]) S.box(0.2, y1 - y0 + 0.1, 0.16, doorW, tx + e * (tw / 2 - 0.1), (y0 + y1) / 2, tz + 0.03, 0, 0, 0, false);       // corner boards
      S.box(tw + 0.5, 0.2, 0.5, doorW, tx, y1 + 0.1, tz, 0, 0, 0, false).box(tw + 0.2, 0.14, 0.3, white2, tx, y0 + 0.07, tz + 0.05, 0, 0, 0, false);   // cornice, and a string course on the wing below
      S.box(2.1, 0.75, 0.12, doorW, tx, y1 + 0.57, tz, 0, 0, 0, false).box(2.4, 0.12, 0.3, white2, tx, y1 + 1.0, tz, 0, 0, 0, false);              // the stepped parapet
      S.box(1.25, 1.9, 0.06, lotB.clone().multiplyScalar(0.8), tx, 8.3, tz + 0.06, 0, 0, 0, false);                                              // a closed weathered shutter
      S.box(1.55, 0.12, 0.16, doorW, tx, 9.32, tz + 0.08, 0, 0, 0, false).box(1.6, 0.12, 0.2, doorW, tx, 7.28, tz + 0.08, 0, 0, 0, false);
      S.box(0.05, 1.9, 0.08, doorW, tx, 8.3, tz + 0.09, 0, 0, 0, false);
      S.box(0.09, 1.9, 0.09, doorW, tx, y1 + 1.95, tz, 0, 0, 0, false);                                                                        // the staff (top 13.9 m)
      S.addGeo(new THREE.SphereGeometry(0.13, 8, 6), S.mat(tx, y1 + 2.95, tz), doorW);
      gatePen.push([tx, y1 + 2.8, tz + 0.06, s]);
      beam(S, [tx + s * 0.9, 10.3, tz - 0.25], [tx + s * 4.4, 0.1, tz - 6.2], 0.2, pine);                                                       // the props that hold it up
      beam(S, [tx + s * 1.2, 7.0, tz - 0.25], [tx + s * 3.4, 0.1, tz - 3.6], 0.15, pine);
      beam(S, [tx - s * 0.6, 10.3, tz - 0.25], [tx - s * 0.6, 0.1, tz - 6.6], 0.18, pine);
      S.box(0.6, 0.1, 1.4, pine, tx + s * 4.4, 0.05, tz - 6.2, 0, s * 0.5, 0, false); }
    // ---- THE METRONOME: washing lines every 30 m (one overhead every 2.5 s) and hanging shop signs, all driven by the gale ----
    const lines = []; for (let d = 30; d <= 360; d += 30) if (d !== 180 && d !== 240) lines.push(d);
    lines.push(374, 386, 353);   // (polish3) one more line for the lull; (polish4) hung at d 353, 10 m ahead of the lens at u 0.70: whole sheets in frame with sky above and between them
         // two more for the lull, both behind the lens by u 0.79: nothing hangs in frame while the front comes over
    const C = [];                                                       // cloth instances: x, y, z, w, h, seed, kind (0 sheet, .25 shirt, .5 long johns, 1 sign board), colour
    const W8 = (c, k) => col(c).multiplyScalar(k);
    const whites = [W8('#F4F1E8', 0.84), W8('#F4F1E8', 0.84), W8('#F4F1E8', 0.84), W8('#E9DFC8', 0.84), W8('#C9D6E6', 0.82)];
    const dyed = [W8('#C9D6E6', 0.82), W8('#3F7FD0', 0.6), W8('#8FA3BD', 0.72), W8('#E9DFC8', 0.84), W8('#5E86C4', 0.66)];
    // washing: long sheets, shirts and long johns, big enough to be a picture when a line goes overhead; most of it white, some of it dyed
    // (straw, blue), never red. washL holds, per line and per 10 cm across the street, how long the cloth hanging there is: the road reads it for the shadow
    const washL = new Uint8Array(128 * 16 * 4), lineD = new Uint8Array(512 * 4).fill(255);
    lines.forEach((d, li) => {
      const extra = d === 353, lull = d >= 370 || extra, bed = d >= 355 || extra, spans = extra ? [] : [[-5.4, -1.7], [1.7, 5.4]];   // (extra: hung without the rng)   // bed: the three lines of the lull (second pass) are hung by hand, below   // nothing hung over the middle where it would hide the hoist, the piano and the hotel from the far end
      let n = 0;
      for (const [x0, x1] of spans) {
        let x = x0 + rng.range(0, 0.3);
        for (let guard = 0; guard < 12; guard++) {
          const r = rng(), kindC = r < 0.5 || lull ? 0 : (r < 0.8 ? 0.25 : 0.5), big = d >= 270 ? 1.15 : 1;
          const w = (kindC === 0 ? rng.range(1.5, 2.2) : kindC === 0.25 ? rng.range(0.95, 1.15) : rng.range(0.8, 0.95)) * big;
          const h = (kindC === 0 ? rng.range(1.9, 2.6) : kindC === 0.25 ? rng.range(1.0, 1.2) : rng.range(1.5, 1.8)) * big;
          let sd = rng(); const cq = rng.chance(kindC === 0 ? 0.26 : 0.5) ? rng.pick(dyed) : rng.pick(whites), c = lull ? whites[guard % 3] : cq;
          if (lull) while ((sd * 5.3) % 1 >= 0.6) sd = (sd + 0.071) % 1;          // (no ticking stripes by the hotel either)   // the lull's washing is white: the curtain is the only colour by the hotel
          if (x + w > x1) break;
          if (!bed && !(detail < 0.9 && (n++ % 3) === 2)) {
            C.push([x + w / 2, 5.5, -d, w, h, sd, kindC, c]);
            for (let b = Math.round((x + 6.4) * 10); b < Math.round((x + w + 6.4) * 10); b++) if (b >= 0 && b < 128) { washL[(li * 128 + b) * 4] = Math.round(h * 60); washL[(li * 128 + b) * 4 + 1] = Math.round(sd * 255); }
          }
          x += w + rng.range(0.12, 0.45);
        }
      }
      // (second pass) hung without the rng, so nothing drawn after this changes: on every line one more piece each side out over the boardwalk;
      // on the lull's three lines long white bed sheets from the kerb to the wall, the middle 3.6 m left clear for the hotel's window
      const hang = (x, w, h, sd, kindC, c) => { C.push([x + w / 2, 5.5, -d, w, h, sd, kindC, c]);
        for (let b = Math.round((x + 6.4) * 10); b < Math.round((x + w + 6.4) * 10); b++) if (b >= 0 && b < 128) { washL[(li * 128 + b) * 4] = Math.round(h * 60); washL[(li * 128 + b) * 4 + 1] = Math.round(sd * 255); } };
      const plain = (v) => { let sd = v; while ((sd * 5.3) % 1 >= 0.6) sd = (sd + 0.071) % 1; return sd; };
      for (const e of [-1, 1]) {
        if (bed) { let x = 1.8 + 0.25 * hsh(li * 3.3 + e * 7 + 800);
          // (polish3) not a row of equal white panes: a bed sheet, a shirt, long johns, another sheet, each its own length, so the line reads as washing
          for (let j = 0; j < 4; j++) { const kj = (j + li + (e > 0 ? 1 : 0)) % 3, kindC = kj === 0 ? 0 : kj === 1 ? 0.25 : 0.5;
            const w = kindC === 0 ? 1.25 + 0.5 * hsh(li * 5.1 + j * 3.7 + e + 810) : kindC === 0.25 ? 1.2 : 0.95, h = kindC === 0 ? 2.1 + 1.1 * hsh(li * 7.3 + j * 1.9 + e + 820) : kindC === 0.25 ? 1.35 : 1.9;
            if (x + w > 6.5) break; hang(e > 0 ? x : -x - w, w, h, plain(hsh(li * 9.7 + j * 2.3 + e + 830)), kindC, (kj === 0 && j > 0 ? whites[4] : whites[0]).clone().multiplyScalar(1.02)); x += w + 0.2 + 0.25 * hsh(li + j * 5.5 + 840); }
        } else { const k = hsh(li * 4.1 + e * 3 + 850), kindC = k < 0.55 ? 0 : 0.25, w = kindC === 0 ? 1.05 : 0.9, h = kindC === 0 ? 1.9 + 0.5 * k : 1.1;
          hang(e > 0 ? 5.5 : -5.5 - w, w, h, plain(hsh(li * 6.7 + e + 860)), kindC, whites[0]); }
      }
      for (let b = d - 5; b <= d + 5; b++) { lineD[b * 4] = li; lineD[b * 4 + 1] = Math.round((d - b + 8) * 15); }
    });
    const washTex = new THREE.DataTexture(washL, 128, 16, THREE.RGBAFormat); washTex.magFilter = THREE.NearestFilter; washTex.minFilter = THREE.NearestFilter; washTex.needsUpdate = true;
    const lineTex = new THREE.DataTexture(lineD, 512, 1, THREE.RGBAFormat); lineTex.magFilter = THREE.NearestFilter; lineTex.minFilter = THREE.NearestFilter; lineTex.needsUpdate = true;
    groundMat.uniforms.tWash.value = washTex; groundMat.uniforms.tLine.value = lineTex;
    // hanging shop signs: a coloured board with a painted device (no letters) under a white timber arm with a knee brace from the wall,
    // so that nothing hangs in the air as a bare dark bar; never red (the one red board in the street is the one that comes for us)
    const signCols = [col('#3F7FD0').multiplyScalar(0.62), col('#8FA3BD').multiplyScalar(0.72), col('#2F4F86').multiplyScalar(0.6), col('#6E93B8').multiplyScalar(0.7), col('#24406E').multiplyScalar(0.62)];
    const armC = col('#F4F1E8').multiplyScalar(0.84), strapC = col('#3A4250');
    const taken = [0.122 * LEN + 6.5, 120, 192, 239, 289, 304, 318];
    let nSigns = 0;
    for (let d = 18, k = 0; d < 405 && nSigns < 22; d += 17.3, k++) {
      const s = k % 2 ? 1 : -1; if (d < 30 || taken.some((t) => Math.abs(t - d) < 9)) continue;
      const pb = s === -sx && d > plaza[0] && d < plaza[1] ? PLAZA_BACK : 0;                    // (on the square the wall stands back, and the sign with it)
      C.push([s * (5.75 + pb), 4.42, -d, 1.5, 0.84, rng(), 1, rng.pick(signCols)]);
      S.box(2.3, 0.13, 0.13, armC, s * (5.9 + pb), 4.56, -d, 0, 0, 0, false);                          // the arm, out from the wall
      S.box(1.5, 0.1, 0.1, armC, s * (6.42 + pb), 4.06, -d, 0, 0, s * 0.82, false);                    // its knee brace
      S.box(0.16, 0.2, 0.16, armC, s * (4.72 + pb), 4.56, -d, 0, 0, 0, false);                         // a turned end
      S.box(0.1, 1.5, 0.16, armC, s * (6.95 + pb), 4.1, -d, 0, 0, 0, false);                           // the wall plate it is bolted to
      for (const e of [-1, 1]) S.box(0.03, 0.2, 0.03, strapC, s * (5.75 + pb) + e * 0.6, 4.42, -d, 0, 0, 0, false);   // two iron straps
      nSigns++;
    }
    // ---- THE ROOFLINE HAS LANDMARKS: on six fronts something stands up against the sky (a windpump racing in the gale, a bell tower, a water
    // tank on a timber stand), on alternate sides, so the far end of the street is never the same picture twice. All stand behind the fronts' faces ----
    const woodT = col('#9A7446').multiplyScalar(0.9), woodTD = col('#6E5030'), slateR = col('#5E7BA6').multiplyScalar(0.7), brickR = col('#3F7FD0').multiplyScalar(0.5), galv = col('#C9D6E6').multiplyScalar(0.8);
    const pumps = [];                                                   // x, y, z of each wheel's hub
    const windpump = (s, d) => { const x = s * 9.6, z = -d, y0 = 5, y1 = 15.2;
      for (const ex of [-1, 1]) for (const ez of [-1, 1]) beam(S, [x + ex * 1.25, y0, z + ez * 1.25], [x + ex * 0.22, y1, z + ez * 0.22], 0.17, galv);
      for (let k = 1; k <= 4; k++) { const t = k / 4.6, h = 1.25 - 1.03 * t, y = y0 + (y1 - y0) * t, h2 = 1.25 - 1.03 * (k - 1) / 4.6, yp = y0 + (y1 - y0) * (k - 1) / 4.6;
        for (const e of [-1, 1]) { S.box(h * 2, 0.1, 0.1, galv, x, y, z + e * h, 0, 0, 0, false); S.box(0.1, 0.1, h * 2, galv, x + e * h, y, z, 0, 0, 0, false);
          beam(S, [x - h2, yp, z + e * h2], [x + h, y, z + e * h], 0.09, galv); beam(S, [x + e * h2, yp, z + h2], [x + e * h, y, z - h], 0.09, galv); } }
      S.box(0.3, 0.3, 1.5, galv, x, y1 + 0.2, z + 0.5, 0, 0, 0, false);                       // the head, and the tail vane downwind (toward us)
      S.box(0.06, 1.5, 2.2, col('#F4F1E8').multiplyScalar(0.85), x, y1 + 0.2, z + 2.6, 0, 0, 0, false).box(0.07, 1.5, 0.5, brickR, x, y1 + 0.2, z + 3.5, 0, 0, 0, false);
      pumps.push([x, y1 + 0.2, z - 0.35]); };
    const bellTower = (s, d, roofC) => { const x = s * 9.4, z = -d, w = 3.4;
      S.box(w, 9.5, w, doorW.clone().multiplyScalar(0.72), x, 8.25, z, 0, 0, 0, false);
      for (const ex of [-1, 1]) for (const ez of [-1, 1]) { S.box(0.26, 9.5, 0.26, doorW.clone().multiplyScalar(0.8), x + ex * w / 2, 8.25, z + ez * w / 2, 0, 0, 0, false);
        S.box(0.3, 2.2, 0.3, doorW.clone().multiplyScalar(0.8), x + ex * (w / 2 - 0.15), 14.1, z + ez * (w / 2 - 0.15), 0, 0, 0, false); }
      S.box(w + 0.5, 0.3, w + 0.5, doorW.clone().multiplyScalar(0.8), x, 13.05, z, 0, 0, 0, false).box(w + 0.5, 0.26, w + 0.5, doorW.clone().multiplyScalar(0.8), x, 15.3, z, 0, 0, 0, false);
      S.box(1.2, 2.0, 0.08, slateR.clone().multiplyScalar(0.7), x, 10.6, z + w / 2 + 0.03, 0, 0, 0, false).box(0.08, 2.0, 1.2, slateR.clone().multiplyScalar(0.7), x - s * (w / 2 + 0.03), 10.6, z, 0, 0, 0, false);   // louvres
      S.addGeo(new THREE.ConeGeometry(2.9, 3.4, 4).rotateY(Math.PI / 4), S.mat(x, 17.1, z), roofC);
      S.addGeo(new THREE.CylinderGeometry(0.3, 0.62, 0.85, 10), S.mat(x, 14.2, z), col('#3A3F48'));                        // the bell
      S.box(0.08, 1.6, 0.08, roofC, x, 19.4, z, 0, 0, 0, false).box(0.9, 0.5, 0.04, brickR, x, 19.9, z + 0.5, 0, 0, 0, false); };   // a staff and a small pennant
    const tankB = col('#C9D6E6').multiplyScalar(0.8), tankF = col('#6F86A8').multiplyScalar(0.7);   // (polish4) whitewashed staves on a slate-blue stand: no warm mark by the hotel but the curtain
    const tank = (s, d) => { const x = s * 9.6, z = -d;
      for (const ex of [-1, 1]) for (const ez of [-1, 1]) { beam(S, [x + ex * 1.9, 5, z + ez * 1.9], [x + ex * 1.5, 10.6, z + ez * 1.5], 0.24, tankF);
        if (ex > 0) { beam(S, [x - 1.8, 5.6, z + ez * 1.8], [x + 1.6, 9.8, z + ez * 1.6], 0.13, tankF); beam(S, [x + 1.8, 5.6, z + ez * 1.8], [x - 1.6, 9.8, z + ez * 1.6], 0.13, tankF); }
        else { beam(S, [x + ez * 1.8, 5.6, z - 1.8], [x + ez * 1.6, 9.8, z + 1.6], 0.13, tankF); beam(S, [x + ez * 1.8, 5.6, z + 1.8], [x + ez * 1.6, 9.8, z - 1.6], 0.13, tankF); } }
      S.box(4.3, 0.24, 4.3, tankF, x, 10.7, z, 0, 0, 0, false);
      S.addGeo(new THREE.CylinderGeometry(2.05, 1.9, 3.3, 18), S.mat(x, 12.5, z), tankB);
      for (const y of [11.3, 12.4, 13.6]) S.addGeo(new THREE.CylinderGeometry(2.08 - (13.6 - y) * 0.04, 2.08 - (13.6 - y) * 0.04, 0.12, 18), S.mat(x, y, z), col('#2A2F38'));
      S.addGeo(new THREE.ConeGeometry(2.4, 1.5, 18), S.mat(x, 14.9, z), slateR); S.box(0.14, 0.5, 0.14, tankF, x, 15.8, z, 0, 0, 0, false); };
    windpump(-sx, 70); bellTower(sx, 147, slateR); windpump(sx, 263);     // (polish3: the tank that stood at d 206 has given its place to the square's clock tower)
    bellTower(-sx, 322, brickR); tank(sx, 371);
    // three more, so that about 30 m ahead of every stretch of the street something different stands against the sky: a grain elevator (a tall
    // cream body, a head house, a spout leg), and a livery barn's gable with its hay hoist
    const creamB = col('#E9DFC8').multiplyScalar(0.76), strawB = col('#D9B25A').multiplyScalar(0.74), butterB = new THREE.Color(0.86, 0.8, 0.64).multiplyScalar(0.8);
    const elevator = (s, d, bodyC) => { const x = s * 10.3, z = -d;
      S.box(4.6, 9, 5.2, bodyC, x, 9.5, z, 0, 0, 0, false).box(2.6, 3.2, 3.0, bodyC.clone().multiplyScalar(1.06), x, 15.6, z, 0, 0, 0, false);
      S.box(5.1, 0.24, 5.7, slateR, x, 14.1, z, 0, 0, 0, false);
      for (const y of [7.6, 10.9]) S.box(4.7, 0.3, 5.3, slateR, x, y, z, 0, 0, 0, false);
      S.addGeo(new THREE.CylinderGeometry(2.0, 2.0, 3.5, 3).rotateX(-Math.PI / 2).scale(1, 0.62, 1), S.mat(x, 17.2 + 0.62, z), slateR);
      beam(S, [x - s * 1.2, 16.4, z + 0.6], [x - s * 3.4, 9.2, z + 1.4], 0.36, bodyC.clone().multiplyScalar(0.92));      // the spout leg, down toward the street
      S.box(0.9, 1.3, 0.06, slateR.clone().multiplyScalar(0.7), x, 12.4, z + 2.63, 0, 0, 0, false).box(0.7, 0.9, 0.06, slateR.clone().multiplyScalar(0.7), x, 15.7, z + 1.53, 0, 0, 0, false);
      S.box(0.06, 1.3, 0.9, slateR.clone().multiplyScalar(0.7), x - s * 2.33, 12.4, z, 0, 0, 0, false);
      S.box(0.08, 1.9, 0.08, woodTD, x, 19.3, z, 0, 0, 0, false).box(0.05, 0.36, 0.9, galv, x, 20.0, z + 0.3, 0, 0, 0, false); };   // a staff and a tin vane, downwind
    const barn = (s, d) => { const x = s * 10.6, z = -d;
      S.box(6.2, 5.6, 8, butterB, x, 7.8, z, 0, 0, 0, false);
      S.addGeo(new THREE.CylinderGeometry(3.9, 3.9, 8.7, 3).rotateX(-Math.PI / 2).scale(1, 0.55, 1), S.mat(x, 10.6 + 1.07, z), slateR);
      S.addGeo(new THREE.CylinderGeometry(3.6, 3.6, 8.3, 3).rotateX(-Math.PI / 2).scale(1, 0.55, 1), S.mat(x, 10.6 + 0.99, z + 0.3), butterB);
      S.box(6.5, 0.22, 0.2, doorW.clone().multiplyScalar(0.8), x, 10.6, z + 4.06, 0, 0, 0, false);
      S.box(1.5, 1.7, 0.08, blueP, x, 11.75, z + 4.47, 0, 0, 0, false);                                                    // the loft door in the gable
      for (const e of [-1, 1]) S.box(0.1, 2.3, 0.1, doorW.clone().multiplyScalar(0.8), x, 11.75, z + 4.52, 0, 0, e * 0.72, false);   // braced with a white cross
      S.box(0.22, 0.22, 2.4, woodTD, x, 13.55, z + 5.2, 0, 0, 0, false).box(0.3, 0.42, 0.3, hoopCb, x, 13.3, z + 6.2, 0, 0, 0, false);   // the hay hoist and its block
      for (const e of [-1, 1]) S.box(1.3, 1.5, 0.06, slateR.clone().multiplyScalar(0.7), x + e * 1.7, 8.2, z + 4.03, 0, 0, 0, false); };
    const hoopCb = col('#2A2F38');
    elevator(sx, 40, creamB); barn(-sx, 105); elevator(-sx, 284, new THREE.Color(0.13, 0.19, 0.32));          // (second pass) dark slate: the piano's ivory keys fall in front of it
    // THE TOWN GATE, 22 m in: two white posts on the kerbs, a beam, a fixed fascia board with three painted discs (no letters; bolted, it does not
    // swing: nothing here is working loose). It frames the far end of the street (the hoist, the piano, the hotel) in the first picture, and lays
    // the first hard shadow across the road; we pass 4 m under it
    { const gz = -22, gw = doorW.clone().multiplyScalar(0.72), gw2 = doorW.clone().multiplyScalar(0.62);
      for (const e of [-1, 1]) {
        S.box(0.32, 7.3, 0.32, gw, e * 5.35, 3.65, gz, 0, 0, 0, false).box(0.5, 0.5, 0.5, gw2, e * 5.35, 0.25, gz, 0, 0, 0, false).box(0.44, 0.16, 0.44, gw2, e * 5.35, 7.38, gz, 0, 0, 0, false);
        beam(S, [e * 5.35, 5.2, gz], [e * 3.7, 6.85, gz], 0.2, gw);                               // knee braces
        S.box(0.5, 0.14, 0.14, blueP, e * 5.35, 4.7, gz, 0, 0, 0, false);
        S.box(0.5, 1.1, 0.07, blueP, e * 3.66, 6.22, gz + 0.02, 0, 0, 0, false); }                 // the blue ends of the fascia
      S.box(11.6, 0.3, 0.3, gw, 0, 7.0, gz, 0, 0, 0, false).box(12.0, 0.1, 0.46, gw2, 0, 7.2, gz, 0, 0, 0, false);
      S.box(7.4, 1.1, 0.08, gw.clone().multiplyScalar(1.12), 0, 6.22, gz, 0, 0, 0, false);
      S.box(7.6, 0.1, 0.14, gw2, 0, 6.8, gz, 0, 0, 0, false).box(7.6, 0.1, 0.14, gw2, 0, 5.64, gz, 0, 0, 0, false);
      for (const e of [-1, 0, 1]) S.addGeo(new THREE.CylinderGeometry(e ? 0.27 : 0.36, e ? 0.27 : 0.36, 0.06, 18).rotateX(Math.PI / 2), S.mat(e * 2.1, 6.22, gz + 0.06), blueP); }
    await ctx.yield();
    // (polish2) NO TWO BLOCKS ALIKE: four things span the street overhead, each about 25 m ahead of a stretch that had only the corridor to show.
    // Every underside is 7.7 m or more above the road (6 m clear of the lens, and above every hazard's sight line from anywhere down the street),
    // every post stands on the boardwalk by the fronts, and each lays its own broad hard shadow across the whole road (the rig's shadow twin)
    const flagsAt = [], H = new Rig(), clockQ = [];                                 // H: (polish3) the market hall and the clock tower, with their own shadow twins
    { const wh = doorW.clone().multiplyScalar(0.74), wh2 = doorW.clone().multiplyScalar(0.6), shut = blueP.clone().multiplyScalar(0.9);
      const ridge = (len, r, x, y, z, c, rz = 0) => S.addGeo(new THREE.CylinderGeometry(r, r, len, 3).rotateX(-Math.PI / 2).rotateY(Math.PI / 2).scale(1, 0.5, 1), S.mat(x, y, z, 0, 0, rz), c);
      // 1 A COVERED FOOTBRIDGE between two stair towers, d 64: white clapboard, a row of blue-shuttered windows, a slate roof
      { const z = -90, y0 = 7.85;   // (lead5) d 90: behind the sign's bracket (d 66.3) for the whole wind-up, and far enough on that its shadow lies beyond the hat until the sign has crossed (at d 72 it swallowed the sign's shadow and the hat's at u 0.116 to 0.127)
        for (const e of [-1, 1]) {
          S.box(1.35, y0 + 3.4, 2.6, wh2, e * 6.3, (y0 + 3.4) / 2 + 0.3, z, 0, 0, 0, false);
          S.box(1.6, 0.16, 2.9, wh, e * 6.3, y0 + 3.75, z, 0, 0, 0, false);
          S.addGeo(new THREE.ConeGeometry(1.35, 1.5, 4).rotateY(Math.PI / 4), S.mat(e * 6.3, y0 + 4.6, z), slateR);
          if (e !== sx) S.box(0.7, 1.9, 0.06, shut, e * 6.3, 1.3, z + 1.32, 0, 0, 0, false).box(0.6, 0.9, 0.06, shut, e * 6.3, 5.2, z + 1.32, 0, 0, 0, false);   // (the sign winds up against the other tower: that one is a plain wall)
          S.box(1.45, 0.14, 2.7, wh, e * 6.3, 3.6, z, 0, 0, 0, false); }
        // (flight1) AN OPEN TIMBER FOOTBRIDGE, not a closed box: from the street 8 m below it is seen from underneath, so everything a bridge is
        // made of is built: three joists from tower to tower, a deck of planks laid across them with gaps the sky shows through, a post every
        // 2.28 m (five bays in the 11.4 m span), a balustrade, and a roof of laths on two head beams. Its shadow is the rig's own flattened twin:
        // a lattice of stripes on the road, like the market hall's further on, where the box threw one flood. Nothing of it moves; its lowest
        // timber is where the box's underside was (y0, 7.85 m)
        // (flight1 repair) THE RULE OF ITS SHADOW, for every timber that runs the same way as its neighbour, at both of the world's sun heights
        // (52 and 44 degrees): two shadows either overlap or stand 0.1 m or more apart, so no slot of sun thinner than that is left on the road.
        // The first build left 8 mm of sun between the near joist's shadow and the fascia's wherever a deck gap let it through, 16 mm of lath tip
        // beyond the far head beam's shadow, and 4 to 8 cm between a baluster's shadow and a post's. So: the outer joists stand 1.1 m out
        // (0.15 m in from the plank ends, under the foot rails: their shadows then run into the fascia's and the foot rails'); the laths are cut
        // to the head beams' centre lines (2.4 m: a lath's shadow ends inside the two beams' shadows); and a post takes the place of any
        // baluster that would stand less than 0.1 m clear of it
        for (const f of [-1, 0, 1]) S.box(11.4, 0.3, 0.14, wh2, 0, y0 + 0.15, z + f * 1.1, 0, 0, 0, false);            // joists, 1.1 m apart under a 2.5 m deck
        for (let i = -12; i <= 12; i++) if (hsh(i * 9.7 + 505) < 0.84) S.box(0.3, 0.07, 2.5, wh.clone().multiplyScalar(0.86 + 0.28 * hsh(i * 3.1 + 500)), i * 0.46, y0 + 0.335, z + 0.06 * (hsh(i * 7.3 + 510) - 0.5), 0, 0, 0, false);   // planks 0.3 m wide, 0.16 m apart; the hash takes out exactly one of the 25 (i = 8, 3.7 m to the right of the line), as on the plank crossings of the road ("one missing here and there")
        for (const e of [-1, 1]) for (let k = 0; k <= 5; k++) S.box(0.18, 2.6, 0.18, wh, -5.7 + k * 2.28, y0 + 0.3 + 1.3, z + e * 1.2, 0, 0, 0, false);       // posts, deck to head beam, both sides
        { const e = -1;                                                                                                    // the far side stays open, as flight1 built it: the sun comes in over its rail
          S.box(11.4, 0.18, 0.2, wh, 0, y0 + 2.99, z + e * 1.2, 0, 0, 0, false);                                           // head beam
          S.box(11.4, 0.12, 0.14, wh.clone().multiplyScalar(1.2), 0, y0 + 1.45, z + e * 1.2, 0, 0, 0, false);              // hand rail, 1.1 m above the deck
          S.box(11.4, 0.1, 0.1, wh, 0, y0 + 0.55, z + e * 1.2, 0, 0, 0, false);                                            // foot rail
          for (let i = -12; i <= 12; i++) { let clear = true; for (let k = 0; k <= 5; k++) if (Math.abs(i * 0.46 - (-5.7 + k * 2.28)) < 0.235) clear = false;   // 0.235: half a post (0.09), half a baluster (0.05) and just under the 0.1 m of clear sun between their shadows
            if (clear) S.box(0.1, 0.84, 0.08, wh, i * 0.46, y0 + 0.99, z + e * 1.2, 0, 0, 0, false); } }   // balusters, one at the end of every plank, none hard by a post
        S.box(11.4, 0.34, 0.06, shut, 0, y0 + 0.17, z + 1.33, 0, 0, 0, false);                                             // the fascia board on the side we come from, painted blue
        // (flight2) THE BRIDGE IS A BUILDING AGAIN FROM DOWN THE STREET, AND STILL LETS THE SUN THROUGH. Flight1's open frame left the street
        // without an end: from the gate one saw straight through it. A builder in a town where the gale blows down the street does not board a
        // bridge across that street shut; he louvres it. So the side we come from is closed with LOUVRE BOARDS, as a belfry is: boards 0.45 m
        // wide, one every 0.27 m of height, sloping down and outward (to shed the rain) at TS. And the roof over them is one slate slope at the
        // same pitch on our side, with open rafters behind.
        // TS = 49.4 degrees is the sun's own slope across this street: the sun stands 18 degrees off the street's axis at 52 or at 44 degrees,
        // which across the street is atan(tan 52 / cos 18) = 53.4 and atan(tan 44 / cos 18) = 45.4 degrees; 49.4 is half way, 4 degrees from
        // either. So at both of the world's hours the sun runs along every board and along the slates, and each throws only a rung:
        // a board's shadow is 0.45 sin 4 + its 0.03 m thickness = 0.07 to 0.09 m of every 0.20 m (52 degrees) or 0.27 m (44 degrees) of road,
        // which leaves 0.12 m or more of sun between two rungs (the rule of flight1's repair: never a slot of sun under 0.1 m).
        // To an eye on the line the same boards are shut: seen from the level they overlap by 0.45 sin 49.4 = 0.34 m on a 0.27 m pitch, and
        // sky first shows between two boards when the eye looks up at them at 18.7 degrees (the upper board's lower outer corner and the
        // lower board's upper inner corner, each 0.015 m off the board's middle plane for its 0.03 m of thickness, stand 0.092 m apart in
        // height over 0.27 m of depth). The boards are 6.7 to 8.9 m above the eye, so that is 20 to 26 m short of the bridge, the top
        // row first; from there in the slits open as one comes under it, as louvres do. (repair: this comment said 13.5 degrees and
        // 30 m, which left the boards' thickness out; nothing built has changed.)
        // Nine boards from the deck (0.37 m) to the roof; the lowest stands 0.57 m up, the least that keeps 0.1 m of sun between its rung
        // and the fascia's at 52 degrees. Rows 3 to 6 (1.21 to 2.36 m above the joists' underside, a sill at a rail's height) are the windows:
        // the middle 1.3 m of each of the five bays is painted the shutters' blue between two blue stiles; the rest is whitewashed.
        // Nothing of it moves; nothing is lower than the joists (7.85 m) or nearer the line; no straw, ochre or red.
        { const TS = 49.4 * D2R, tT = Math.tan(TS), cT = Math.cos(TS), sT = Math.sin(TS), LP = 0.27, LW = 0.45, zW = 1.33, yL = 0.57, wW = 1.3;
          for (let k = 0; k < 5; k++) { const xa = -5.7 + k * 2.28 + 0.09, xb = xa + 2.1, xc = (xa + xb) / 2, sw = (xb - xa - wW) / 2;   // a bay: from one post's face to the next's
            for (let n = 0; n < 9; n++) { const y = y0 + yL + n * LP, c = wh.clone().multiplyScalar(0.92 + 0.16 * hsh(n * 3.9 + k * 7.7 + 550));
              if (n >= 3 && n <= 6) { S.box(sw, 0.03, LW, c, xa + sw / 2, y, z + zW, TS, 0, 0, false).box(sw, 0.03, LW, c, xb - sw / 2, y, z + zW, TS, 0, 0, false);
                S.box(wW, 0.03, LW, shut.clone().multiplyScalar(0.9 + 0.2 * hsh(n * 5.1 + k * 3.3 + 560)), xc, y, z + zW, TS, 0, 0, false); }
              else S.box(xb - xa, 0.03, LW, c, xc, y, z + zW, TS, 0, 0, false); }
            const sy0 = yL + 3 * LP - (LW / 2) * sT - 0.12, sy1 = yL + 6 * LP + (LW / 2) * sT + 0.12;   // the stiles run 0.12 m past the window into the board below and the board above: their shadows are one with those boards' at any sun
            for (const e of [-1, 1]) S.box(0.1, sy1 - sy0, 0.08, shut, xc + e * (wW / 2), y0 + (sy0 + sy1) / 2, z + zW, 0, 0, 0, false); }
          // the roof: its near slope lies in the plane a tenth louvre board would (so the sun between it and the ninth is the same slot as
          // between any two boards), from the ridge over the middle joist down to an eave 0.4 m beyond the posts (clear of the boards' outer
          // edges, 0.28 m out). It is carried on a plate 0.15 by 0.24 m laid in the same plane on the near posts: the plate fills the slot
          // between the ninth board and the slates, so the three throw one rung (0.3 m deep at 52 degrees, 0.55 m at 44)
          const ov = 0.4, ez = 1.2 + ov, yb = yL + 9 * LP + (zW - 1.2) * tT, yr = yb + 1.2 * tT, ye = yb - ov * tT, sl = ez / cT;
          S.box(11.62, 0.06, sl, slateR, 0, y0 + (yr + ye) / 2, z + ez / 2, TS, 0, 0, false);                               // the slates (11.62 m: 0.11 m into each tower)
          for (const f of [-1, 1]) S.box(11.64, 0.075, 0.3, shut, 0, y0 + (yr + ye) / 2 + f * (sl / 2 - 0.15) * sT * -1, z + ez / 2 + f * (sl / 2 - 0.15) * cT, TS, 0, 0, false);   // a blue course along the eave and one along the ridge, in the slates' own plane
          S.box(11.4, 0.15, 0.24, wh2, 0, y0 + yb - 0.095 / cT, z + 1.2, TS, 0, 0, false);                                 // the plate
          const rl = Math.hypot(1.2, yr - 3.08), ra = Math.atan2(yr - 3.08, 1.2);
          for (let i = -7; i <= 7; i++) S.box(0.16, 0.08, rl, wh.clone().multiplyScalar(0.9 + 0.2 * hsh(i * 5.9 + 520)), i * 0.76, y0 + (yr + 3.08) / 2, z - 0.6, -ra, 0, 0, false); }   // the far slope: open rafters from the far head beam to the ridge, three to a bay (flight1's laths, now pitched)
        for (const e of [-1, 1]) beam(S, [e * 5.6, y0 - 1.6, z], [e * 3.9, y0, z], 0.2, wh2); }
      // 2 A TIMBER TRESTLE WALK, d 100: battered bents, two stringers, a plank deck, a handrail; whitewashed and blue-grey, nothing like the piano's dark hoist beyond it
      { const z = -100, y0 = 8.3, trP = wh2, trQ = wh;
        for (const e of [-1, 1]) { for (const f of [-1, 1]) beam(S, [e * 6.55, 0.3, z + f * 1.5], [e * 5.9, y0, z + f * 0.75], 0.26, trP);
          beam(S, [e * 6.5, 1.0, z - 1.4], [e * 6.0, 7.2, z + 0.8], 0.14, trP); beam(S, [e * 6.5, 1.0, z + 1.4], [e * 6.0, 7.2, z - 0.8], 0.14, trP);
          S.box(0.2, 0.2, 2.2, trP, e * 6.2, 4.4, z, 0, 0, 0, false); }
        for (const f of [-1, 1]) { S.box(13.2, 0.36, 0.24, trP, 0, y0, z + f * 0.75, 0, 0, 0, false); S.box(13.2, 0.1, 0.1, trQ, 0, y0 + 1.4, z + f * 0.92, 0, 0, 0, false);
          // (flight1 repair) the same rule of shadows as the footbridge's: the rail posts stood 3 cm clear of the stringers and ended on the deck, and
          // in a deck gap that left 26 mm of sun between a post's shadow and the stringer's. They are bolted to the stringer's outer face
          // (0.75 + 0.12 + 0.05 = 0.92 m out, the rail with them) and run down to its underside (y0 - 0.18), so the two shadows are one
          for (let k = -4; k <= 4; k++) S.box(0.1, 1.605, 0.1, trQ, k * 1.6, y0 + 0.6225, z + f * 0.92, 0, 0, 0, false); }
        for (let i = -14; i <= 14; i++) S.box(0.33, 0.08, 2.1, trQ.clone().multiplyScalar(0.88 + 0.24 * hsh(i * 4.3 + 530)), i * 0.46, y0 + 0.22, z + 0.05 * (hsh(i * 6.1 + 540) - 0.5), 0, 0, 0, false);   // (flight1) the plank deck is planks: 0.33 m boards 0.13 m apart, sky between them from below, a slatted shadow
        for (const e of [-1, 1]) { beam(S, [e * 5.9, y0 - 2.2, z], [e * 3.6, y0 - 0.1, z], 0.18, trP); } }
      // 3 A STRING OF SIGNAL FLAGS, d 146: from the bell tower's belfry down across the street to a white staff on the far roof; the flags are cloth
      { const z = -146, a = [sx * 7.9, 13.2, z], b = [-sx * 7.6, 9.3, z];
        beam(S, a, b, 0.1, strapC);
        S.box(0.2, 5.2, 0.2, wh, b[0], 7.6, z, 0, 0, 0, false).box(0.5, 0.12, 0.5, wh, b[0], 10.2, z, 0, 0, 0, false);
        for (let k = 0; k < 7; k++) { const t = 0.1 + k * 0.135; flagsAt.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t - 0.05, z, k]); } }
      await ctx.yield();
      // 3b (polish3) THE CLOCK TOWER in the square: white clapboard on a plinth, a clock stage with a face to the street and a face to us (its hands
      // go, its pendulum swings behind a slot: see clockMat), a slate spire, a long pennant. It stands 2.5 m behind the line of the fronts: nothing
      // on or over the road is ever behind it, and from far down the street it is the tallest thing on its side
      if (plaza[1] > plaza[0]) { const s = -sx, tx = s * 9.5, tz = -(plaza[1] - 4.6), whL = wh.clone().multiplyScalar(1.12);
        H.box(4.2, 0.9, 4.2, wh2, tx, 0.75, tz, 0, 0, 0, false).box(3.3, 7.2, 3.3, wh, tx, 4.8, tz, 0, 0, 0, false);
        for (const ex of [-1, 1]) for (const ez of [-1, 1]) H.box(0.3, 7.2, 0.3, whL, tx + ex * 1.6, 4.8, tz + ez * 1.6, 0, 0, 0, false);
        H.box(3.56, 0.22, 3.56, blueP, tx, 4.5, tz, 0, 0, 0, false).box(4.0, 0.3, 4.0, wh2, tx, 8.55, tz, 0, 0, 0, false);
        H.box(1.2, 2.3, 0.08, shut, tx, 2.35, tz + 1.67, 0, 0, 0, false).box(0.08, 2.3, 1.2, shut, tx - s * 1.67, 2.35, tz, 0, 0, 0, false);       // doors
        H.box(1.5, 0.14, 0.12, whL, tx, 3.6, tz + 1.7, 0, 0, 0, false).box(0.12, 0.14, 1.5, whL, tx - s * 1.7, 3.6, tz, 0, 0, 0, false);
        H.box(3.0, 3.1, 3.0, wh, tx, 10.25, tz, 0, 0, 0, false).box(3.7, 0.28, 3.7, wh2, tx, 11.94, tz, 0, 0, 0, false);
        for (const ex of [-1, 1]) for (const ez of [-1, 1]) H.box(0.26, 3.1, 0.26, whL, tx + ex * 1.45, 10.25, tz + ez * 1.45, 0, 0, 0, false);
        H.addGeo(new THREE.ConeGeometry(2.5, 4.4, 4).rotateY(Math.PI / 4), H.mat(tx, 14.28, tz), slateR);
        H.box(0.1, 2.6, 0.1, whL, tx, 17.6, tz, 0, 0, 0, false);
        C.push([tx, 18.8, tz, 0.9, 2.8, 0.37, 0, W8('#3F7FD0', 0.62)]);
        // clock faces and pendulum slots: [centre, u axis, v axis, half width, half height, kind]
        clockQ.push([[tx, 10.25, tz + 1.53], [1, 0, 0], [0, 1, 0], 1.3, 1.3, 0], [[tx - s * 1.53, 10.25, tz], [0, 0, s], [0, 1, 0], 1.3, 1.3, 0]);
        clockQ.push([[tx, 6.45, tz + 1.67], [1, 0, 0], [0, 1, 0], 0.5, 1.15, 1], [[tx - s * 1.67, 6.45, tz], [0, 0, s], [0, 1, 0], 0.5, 1.15, 1]);
        // the washing line that crosses the street at the square is made fast to a post where the wall used to be
        for (const d of [210, 300]) if (d > plaza[0] && d < plaza[1]) H.box(0.24, 5.5, 0.24, wh, s * 7, 3.05, -d, 0, 0, 0, false).box(0.5, 0.4, 0.5, wh2, s * 7, 0.5, -d, 0, 0, 0, false);
        // a stone trough and a hand pump by the tower's foot, a bench: the square is used
        H.box(2.4, 0.6, 0.9, slateR.clone().multiplyScalar(0.8), tx - s * 3.6, 0.6, tz + 3.2, 0, 0, 0, false).box(0.16, 1.5, 0.16, blueP, tx - s * 3.6, 1.05, tz + 2.6, 0, 0, 0, false).box(0.1, 0.1, 0.7, blueP, tx - s * 3.6, 1.6, tz + 2.9, 0.5, 0, 0, false); }
      await ctx.yield();
      // 3c (polish3) THE HOTEL'S BLOCK HAS STREET LAMPS: white posts on the kerb with a slate-capped lantern, a pair every few metres, so the last
      // straight to the hotel is an avenue with a near, a middle and a far, and their shadows lie across the empty road of the held breath. The last
      // pair stands 8 m short of where the front's top comes down; none stands by a washing line or a hanging sign
      for (const d of [366.5, 378, 393.5, 402.5, 409]) for (const e of [-1, 1]) { const x = e * 6.0, z = -d;
        H.box(0.34, 0.5, 0.34, wh2, x, 0.55, z, 0, 0, 0, false).box(0.16, 3.1, 0.16, wh, x, 1.85, z, 0, 0, 0, false).box(0.26, 0.1, 0.26, blueP, x, 2.5, z, 0, 0, 0, false);
        H.box(0.8, 0.08, 0.08, wh, x, 3.15, z, 0, 0, 0, false);                                                     // the ladder bar
        H.box(0.36, 0.5, 0.36, col('#DCE8F4').multiplyScalar(0.92), x, 3.68, z, 0, 0, 0, false);                    // the lantern's glass
        for (const ex of [-1, 1]) for (const ez of [-1, 1]) H.box(0.05, 0.52, 0.05, hoopCb, x + ex * 0.18, 3.68, z + ez * 0.18, 0, 0, 0, false);
        H.addGeo(new THREE.ConeGeometry(0.36, 0.3, 4).rotateY(Math.PI / 4), H.mat(x, 4.08, z), slateR); H.box(0.42, 0.05, 0.42, hoopCb, x, 3.42, z, 0, 0, 0, false); }
      await ctx.yield();
      // 4 (polish3) THE MARKET HALL, d 250 to 280: the street runs THROUGH an open-sided timber hall for 2.5 s. Posts on the boardwalk edge (5.3 m
      // from our line), white king-post trusses with their ties 8.7 m up (above every hazard's sight line), a roof of slate-blue boards with gaps:
      // the sun comes through and lays a ladder of hard blue stripes over the whole floor. Nothing in it works loose: it is not a hazard
      { const zc = -(HALL_Z0 + HALL_Z1) / 2, Lh = HALL_Z1 - HALL_Z0, px = 6.0;
        for (let i = 0; i <= 6; i++) { const z = -250 - 5 * i, endT = i === 0 || i === 6;
          for (const e of [-1, 1]) {
            H.box(0.34, 8.4, 0.34, wh, e * px, 4.5, z, 0, 0, 0, false).box(0.6, 0.55, 0.6, wh2, e * px, 0.57, z, 0, 0, 0, false).box(0.46, 0.16, 0.46, blueP, e * px, 4.9, z, 0, 0, 0, false);
            beam(H, [e * px, 6.9, z], [e * 3.6, 8.6, z], 0.2, wh);                                  // knee brace under the tie
            beam(H, [e * 6.75, 8.55, z], [0, HALL_RIDGE + 0.06, z], endT ? 0.34 : 0.24, wh);        // rafter
            beam(H, [0, 8.9, z], [e * 3.3, 10.05, z], 0.16, wh);                                    // strut
            if (i < 6) beam(H, [e * px, 7.2, z], [e * px, 8.5, z - 1.4], 0.16, wh2);                // a brace along the street under the plate
            if (i > 0) beam(H, [e * px, 7.2, z], [e * px, 8.5, z + 1.4], 0.16, wh2); }
          H.box(13.6, 0.34, 0.3, wh, 0, 8.7, z, 0, 0, 0, false);                                    // the tie beam
          H.box(0.24, 2.75, 0.24, wh, 0, 10.2, z, 0, 0, 0, false); }                                // the king post
        for (const e of [-1, 1]) { H.box(0.3, 0.3, Lh, wh2, e * px, 8.42, zc, 0, 0, 0, false); H.box(0.2, 0.2, Lh, wh2, e * 3.3, 10.2, zc, 0, 0, 0, false); }
        H.box(0.3, 0.3, Lh, wh2, 0, HALL_RIDGE + 0.1, zc, 0, 0, 0, false);
        // the near gable, a landmark from far down the street: pickets of slate-blue board between tie and rafters, a white roundel with a straw disc
        for (let k = -9; k <= 9; k++) { const x = k * 0.66, top = HALL_RIDGE - 0.4545 * Math.abs(x) - 0.3, hgt = top - 8.95; if (hgt > 0.25) H.box(0.44, hgt, 0.07, wh, x, 8.95 + hgt / 2, -250 + 0.2, 0, 0, 0, false); }
        // pennants under every tie beam, cloth: the gale lays them out downwind
        const pc = [W8('#3F7FD0', 0.62), W8('#F4F1E8', 0.86), W8('#C9D6E6', 0.84), W8('#8FA3BD', 0.74)];
        for (let i = 0; i <= 6; i++) for (let k = -3; k <= 3; k++) { if (Math.abs(k) < 2 || (detail < 0.9 && (i + k) % 2)) continue;   // (none over the middle: the piano's keys fall there)
          C.push([k * 1.42 + 0.3 * (hsh(i * 7.1 + k * 3.3 + 300) - 0.5), 8.52, -250 - 5 * i - 0.05, 0.8, 0.95 + 0.3 * hsh(i * 3.7 + k + 310), hsh(i * 5.3 + k * 9.1 + 320), 0, pc[(i * 3 + k + 12) % 4]]); } }
    }
    { const fc = [W8('#3F7FD0', 0.62), W8('#F4F1E8', 0.84), W8('#8FA3BD', 0.76)];
      for (const f of flagsAt) C.push([f[0], f[1], f[2], 1.9, 2.3 + 0.3 * hsh(f[3] * 3.3 + 70), hsh(f[3] * 7.7 + 50), 0, fc[f[3] % 3]]); }
    for (const g of gatePen) C.push([g[0], g[1], g[2], 0.75, 2.3, 0.02 + 0.05 * (g[3] > 0 ? 1 : 0), 0, W8('#8FA3BD', 0.78)]);   // (polish4) a long pennant on each staff of the gate: cloth, it lifts and falls in the lot's light breeze
    await ctx.yield();
    // ---- and the boardwalks are lived on: barrels, crates, sacks and a bench or two against the walls (none within 6 m of our line) ----
    { const hoopC = col('#2A2F38'), crateC = col('#B9AE98').multiplyScalar(0.7), barC = col('#B9AE98').multiplyScalar(0.6), sackC = col('#E9DFC8').multiplyScalar(0.8);   // (lead5) crates and barrels are weathered grey wood: straw and ochre are the hat's alone
      for (const s of [-1, 1]) for (let d = 6, i = 0; d < 404; d += 5.5 + 9 * hsh(i * 3.9 + s * 17 + 300), i++) {
        if ((d > 113 && d < 127) || (d > 187 && d < 197) || (d > 231 && d < 242) || (d > 58 && d < 92.5)) continue;
        const k = hsh(i * 7.7 + s * 3 + 320), x = s * (6.5 + 0.12 * hsh(i * 2.1)), z = -d;
        if (k < 0.34) { const n = 1 + Math.floor(hsh(i * 5.1 + 3) * 2.99);
          for (let j = 0; j < n; j++) { const bz = z + j * 0.78, by = 0.3; S.addGeo(new THREE.CylinderGeometry(0.3, 0.3, 0.9, 10), S.mat(x, by + 0.45, bz), barC);
            S.addGeo(new THREE.CylinderGeometry(0.345, 0.345, 0.5, 10), S.mat(x, by + 0.45, bz), barC.clone().multiplyScalar(1.12));
            for (const hy of [0.12, 0.78]) S.addGeo(new THREE.CylinderGeometry(0.325, 0.325, 0.06, 10), S.mat(x, by + hy, bz), hoopC); }
        } else if (k < 0.62) { const a = 0.7 + 0.3 * hsh(i * 1.3), b = 0.5 + 0.3 * hsh(i * 4.7);
          S.box(a, a * 0.8, a, crateC, x, 0.3 + a * 0.4, z, 0, hsh(i) * 0.5, 0, false).box(b, b * 0.8, b, crateC.clone().multiplyScalar(1.15), x, 0.3 + a * 0.8 + b * 0.4, z + 0.05, 0, hsh(i + 9) * 0.9, 0, false)
            .box(b, b * 0.8, b, crateC.clone().multiplyScalar(0.9), x - s * 0.1, 0.3 + b * 0.4, z + a * 0.5 + b * 0.6, 0, hsh(i + 5) * 0.6, 0, false);
        } else if (k < 0.82) { for (let j = 0; j < 3; j++) S.addGeo(new THREE.SphereGeometry(0.34, 8, 6).scale(0.7, 0.55, 1.15), S.mat(x, 0.5 + (j === 2 ? 0.34 : 0), z + (j === 2 ? 0.35 : j * 0.72), 0, 0.2 * j, 0), sackC.clone().multiplyScalar(0.9 + 0.1 * j));
        } else { const bc = k > 0.91 ? col('#B9AE98').multiplyScalar(0.72) : col('#CFC6B2').multiplyScalar(0.74);   // weathered pale wood: nothing on the boardwalk outshouts a hazard
          S.box(0.42, 0.07, 1.7, bc, x, 0.76, z, 0, 0, 0, false).box(0.07, 0.6, 1.7, bc, x + s * 0.2, 1.08, z, 0, 0, s * 0.12, false);
          for (const e of [-1, 1]) S.box(0.4, 0.46, 0.07, bc, x, 0.53, z + e * 0.72, 0, 0, 0, false); }
      } }
    await ctx.yield();
    // (no washing in the lot: the door frame stands alone)
    S.build(mats.lit, mats.shadow()); S.set(new THREE.Matrix4()); scene.add(S.mesh, S.shadow);
    // (leak) THE LOT'S SHADOWS STAY BEHIND THE FRONT: a ground shadow of this rig that lies beyond the front's plane is not drawn while the sill of
    // the front's window stands above the lens. Until the sill is down to the lens's height no line of sight reaches the lot's ground (the wall and
    // its two flanks close the street's end from the road up; the window shows only what stands above the lens), yet the twin's slope offset
    // (two picture rows of ground, tens of metres near the horizon) drew those shadows over the foot of the wall as stray picture elements
    { const sm = S.shadow.material; sm.uniforms.uTheta = dev.frontU.uTheta; sm.uniforms.uHinge = dev.frontU.uHinge; sm.uniforms.uHole = dev.frontU.uHole;
      sm.vertexShader = sm.vertexShader.replace('varying float vD;', 'varying float vD; varying float vZ;').replace('w.y = uY;', 'w.y = uY; vZ = w.z;');
      sm.fragmentShader = sm.fragmentShader.replace('varying float vD;', 'varying float vD; varying float vZ; uniform float uTheta; uniform vec2 uHinge; uniform vec4 uHole;')
        .replace('void main() {', 'void main() { if (vZ < uHinge.y && uHinge.x + (uHole.x - uHole.z) * cos(uTheta) > cameraPosition.y) discard;'); }
    await ctx.yield();
    H.build(mats.lit, mats.shadow()); H.set(new THREE.Matrix4()); scene.add(H.mesh, H.shadow);
    await ctx.yield();
    // the hall's roof: two pitches, each one quad; the boards and the gaps between them are drawn (see sfSlat), sunlit from above, slate-blue beneath
    { const rg = new THREE.BufferGeometry(), y0 = HALL_EAVE - 0.14, y1 = HALL_RIDGE + 0.2, xe = HALL_HALF + 0.3, P3 = [];
      for (const e of [-1, 1]) P3.push(e * xe, y0, -HALL_Z0, 0, y1, -HALL_Z0, 0, y1, -HALL_Z1, e * xe, y0, -HALL_Z0, 0, y1, -HALL_Z1, e * xe, y0, -HALL_Z1);
      rg.setAttribute('position', new THREE.Float32BufferAttribute(P3, 3));
      const rMat = new THREE.ShaderMaterial({
        uniforms: { ...shared },
        vertexShader: /* glsl */`
          varying vec3 vW; varying float vD;
          void main() { vW = position; vec4 mv = viewMatrix * vec4(position, 1.); vD = length(mv.xyz); gl_Position = projectionMatrix * mv; }`,
        fragmentShader: GLSL_COMMON + SLAT_GLSL + /* glsl */`
          varying vec3 vW; varying float vD;
          void main() { float fp = max(fwidth(vW.z), 1e-4), a = sfSlat(vW.z, fp);
            float under = step(cameraPosition.y, vW.y - .0);            // from the street we see the underside: slate blue, lit by the pale road
            float i = floor(vW.z / 2.2), hh = fract(sin(i * 91.7) * 4375.85);
            vec3 alb = mix(vec3(.3, .4, .58), vec3(.42, .5, .64), hh);
            vec3 c = mix(alb * (uSunC * .8 + uSkyC * .6), alb * (uSkyC * .3 + uGndC * 1.5), under);
            gl_FragColor = vec4(sfFog(c, vD), a); }`,
        side: THREE.DoubleSide, transparent: true, depthWrite: false,
      });
      const roofM = new THREE.Mesh(rg, rMat); roofM.frustumCulled = false; roofM.renderOrder = 1; scene.add(roofM); }
    // the hall's and the tower's shadows on the BOARDS (the rig's own twin lies on the road, 0.3 m lower): the same twin again at deck height, kept off the road
    { const dsm = mats.shadow(); dsm.uniforms.uY.value = 0.312;
      dsm.vertexShader = dsm.vertexShader.replace('varying float vD;', 'varying float vD; varying float vX;').replace('w.y = uY;', 'w.y = uY; vX = w.x;');
      dsm.fragmentShader = dsm.fragmentShader.replace('varying float vD;', 'varying float vD; varying float vX;').replace('void main() {', 'void main() { if (abs(vX) < 4.52 || abs(vX) > 17.4) discard;');
      const dk = new THREE.Mesh(H.mesh.geometry, dsm); dk.frustumCulled = false; dk.renderOrder = 2; scene.add(dk); }
    await ctx.yield();
    // the clock: two faces and two pendulum slots, one draw. It has stopped: hour, minute and second hands and the pendulum are all drawn at
    // fixed angles and nothing in it reads the time (the piano is the street's one pendulum)
    { const cg = new THREE.BufferGeometry(), cp = [], cu = [], cn = [], ck = [], vU = new THREE.Vector3(), vV = new THREE.Vector3(), vNn = new THREE.Vector3();
      for (const [c, ua, va, hw, hh, kd] of clockQ) { vU.fromArray(ua); vV.fromArray(va); vNn.crossVectors(vU, vV);
        for (const [a, b] of [[-1, -1], [1, -1], [1, 1], [-1, -1], [1, 1], [-1, 1]]) { cp.push(c[0] + ua[0] * a * hw + va[0] * b * hh, c[1] + ua[1] * a * hw + va[1] * b * hh, c[2] + ua[2] * a * hw + va[2] * b * hh);
          cu.push(a * (kd ? hw : 1), b * (kd ? hh : 1)); cn.push(vNn.x, vNn.y, vNn.z); ck.push(kd); } }
      cg.setAttribute('position', new THREE.Float32BufferAttribute(cp, 3)); cg.setAttribute('aUv', new THREE.Float32BufferAttribute(cu, 2));
      cg.setAttribute('aN', new THREE.Float32BufferAttribute(cn, 3)); cg.setAttribute('aK', new THREE.Float32BufferAttribute(ck, 1));
      const clockMat = new THREE.ShaderMaterial({
        uniforms: { ...shared, uHour: { value: (lateHour ? 1.5 : 10.5) / 12 * Math.PI * 2 } },
        vertexShader: /* glsl */`
          attribute vec2 aUv; attribute vec3 aN; attribute float aK; varying vec2 vUv; varying vec3 vN; varying float vK; varying float vD;
          void main() { vUv = aUv; vN = aN; vK = aK; vec4 mv = viewMatrix * vec4(position, 1.); vD = length(mv.xyz); gl_Position = projectionMatrix * mv; }`,
        fragmentShader: GLSL_COMMON + /* glsl */`
          uniform float uHour; varying vec2 vUv; varying vec3 vN; varying float vK; varying float vD;
          float hand(vec2 p, float ang, float len, float w) { vec2 d = vec2(sin(ang), cos(ang)); float t = clamp(dot(p, d), -.12, len); return length(p - d * t) - w; }
          void main() { vec3 n = normalize(vN + vec3(0., 1e-5, 0.)); if (!gl_FrontFacing) n = -n; vec3 alb;
            if (vK < .5) { float r = length(vUv); if (r > .97) discard;
              float an = atan(vUv.x, vUv.y + step(r, .001)), tk = abs(fract(an * 12. / 6.28318 + .5) - .5);
              alb = vec3(.9, .86, .74);
              alb = mix(alb, vec3(.1, .13, .22), step(tk, .07) * step(.62, r) * step(r, .8));
              float sec = 37.;                                  // (polish4) the clock has stopped: the piano is the street's one pendulum
              float hd = min(hand(vUv, uHour, .42, .055), hand(vUv, 3.2676, .68, .04));   // (lead6) the minute hand stands still, a little past the half hour
              alb = mix(alb, vec3(.08, .1, .16), step(hd, 0.));
              alb = mix(alb, vec3(.2, .36, .7), step(hand(vUv, sec * 6.28318 / 60., .74, .022), 0.));
              alb = mix(alb, vec3(.3, .4, .58), step(r, .07));
              alb = mix(alb, vec3(.16, .22, .36), step(.84, r)); alb = mix(alb, vec3(.8, .78, .7), step(.93, r)); }
            else { vec2 q = vUv; alb = vec3(.07, .1, .19);
              float a = 0.; vec2 top = vec2(0., .95), bob = top + 1.55 * vec2(sin(a), -cos(a));
              vec2 dr = normalize(bob - top); float t = clamp(dot(q - top, dr), 0., 1.55);
              alb = mix(alb, vec3(.42, .47, .56), step(length(q - top - dr * t), .035));
              alb = mix(alb, vec3(.72, .78, .86), step(length(q - bob), .17));          // (polish4) a still steel bob: no brass, no swing
              alb = mix(alb, vec3(.8, .78, .7), max(step(.42, abs(q.x)), step(1.07, abs(q.y)))); }
            gl_FragColor = vec4(sfFog(sfLit(alb, n, 1.), vD), 1.); }`,
      });
      const clock = new THREE.Mesh(cg, clockMat); clock.frustumCulled = false; scene.add(clock); }
    // the windpumps' wheels: twelve sails each, turned by the gale (the angle is a closed form in u: the gale's own integral, coasting down in the lull)
    const wGeo = new THREE.InstancedBufferGeometry(); wGeo.copy(new THREE.PlaneGeometry(1, 1));
    wGeo.setAttribute('aP', new THREE.InstancedBufferAttribute(new Float32Array(pumps.flat()), 3)); wGeo.instanceCount = pumps.length;
    const uSpin = { value: 0 };
    const wMat = new THREE.ShaderMaterial({
      uniforms: { ...shared, uSpin },
      vertexShader: /* glsl */`
        attribute vec3 aP; varying vec2 vUv; varying float vD; varying float vPh;
        void main() { vUv = position.xy * 2.; vPh = aP.z * .37; vec4 mv = viewMatrix * vec4(aP + vec3(position.xy * 5.6, 0.), 1.); vD = length(mv.xyz); gl_Position = projectionMatrix * mv; }`,
      fragmentShader: GLSL_COMMON + /* glsl */`
        uniform float uSpin; varying vec2 vUv; varying float vD; varying float vPh;
        void main() { float r = length(vUv), an = atan(vUv.y, vUv.x + 1e-5 * step(abs(vUv.x) + abs(vUv.y), 0.)) + uSpin + vPh;
          float sec = fract(an * 12. / 6.28318), sail = step(sec, .62) * step(.3, r) * step(r, .97);
          float rim = step(abs(r - .97), .025) + step(abs(r - .62), .02) + step(abs(r - .3), .025), hub = step(r, .09);
          if (sail + rim + hub < .5) discard;
          // galvanised sails set at a pitch: each catches the sky on one edge and is in its own shade at the other; the sun stands beyond them
          vec3 c = vec3(.62, .68, .76) * (uSkyC * (.75 + .5 * sec) + uSunC * .5 * step(sec, .18) * sail + uGndC * 1.2);
          c = mix(c, vec3(.1, .11, .13), max(hub, rim * (1. - sail)) * .8);
          gl_FragColor = vec4(sfFog(c, vD), 1.); }`,
      side: THREE.DoubleSide,
    });
    const wheels = new THREE.Mesh(wGeo, wMat); wheels.frustumCulled = false; scene.add(wheels);
    const spinT = new Float32Array(513);
    { let a = 0; for (let i = 0; i <= 512; i++) { const uu = i / 512, w = Math.max(dev.gale(uu), uu > 0.67 ? dev.gale(0.669) * Math.exp(-(uu - 0.67) * DUR / 1.5) : 0) * 5.2; spinT[i] = a; a += w * DUR / 512; } }
    const cGeo = new THREE.InstancedBufferGeometry(); cGeo.copy(new THREE.PlaneGeometry(1, 1, 12, 6));
    const cPos = new Float32Array(C.length * 3), cDim = new Float32Array(C.length * 4), cCol = new Float32Array(C.length * 3);
    C.forEach((c, i) => { cPos.set([c[0], c[1], c[2]], i * 3); cDim.set([c[3], c[4], c[5], c[6]], i * 4); cCol.set([c[7].r, c[7].g, c[7].b], i * 3); });
    cGeo.setAttribute('aPos', new THREE.InstancedBufferAttribute(cPos, 3)); cGeo.setAttribute('aDim', new THREE.InstancedBufferAttribute(cDim, 4));
    cGeo.setAttribute('aCol', new THREE.InstancedBufferAttribute(cCol, 3)); cGeo.instanceCount = C.length;
    const cMat = new THREE.ShaderMaterial({
      uniforms: { ...shared, uGale, uTime, uSwing },
      vertexShader: /* glsl */`
        attribute vec3 aPos; attribute vec4 aDim; attribute vec3 aCol; uniform float uGale; uniform float uTime; uniform float uSwing;
        varying vec3 vC; varying vec3 vN; varying float vD; varying float vK; varying vec4 vF; varying vec3 vS;
        void main() {
          float k = .5 - position.y, xn = position.x, sd = aDim.z, stiff = step(.75, aDim.w);
          float flut = sin(uTime * (4. + 2. * sd) + sd * 40.) * .5 + .5;
          float blow = smoothstep(0., .22, uGale);   // any gale at all lays the washing out flat downwind: thin streaming strips, not hanging squares
          float calm = (1. - blow) * (1. - stiff);   // no wind: it hangs from its pegs in folds
          // (flight1) the gale comes in gusts that travel down the street at us: as one passes a line its washing is lifted flatter ("streaming flat
          // downwind"), more so the harder it blows, and sinks back after it; the road's shadow of the line reads the same gust
          float gust = .5 + .5 * sin(uTime * 1.3 - aPos.z * .07 + 1.2 * sin(uTime * .7 - aPos.z * .031));   // a crest keeps its phase where z grows by 1.3 / .07 = 18.6 m a second: toward us, at a gale's speed; 90 m from crest to crest (three lines)
          float a = mix(blow * (.66 + .36 * uGale + .1 * sin(uTime * 3.3 + sd * 17.) + (.2 + .2 * uGale) * gust), uGale * (.3 + .42 * flut), stiff) + uSwing * sin(uTime * (2.1 + 1.1 * sd) + sd * 9.) * (1. - .4 * stiff);
          a = min(a, 1.45);
          float ak = mix(a * (.6 + .4 * k), a, stiff);
          // pegged at its corners (a sheet in the middle too): the top edge scallops between the pegs, the cloth gathers into vertical folds
          // that deepen toward the hem, and the hem hangs a little lower in the middle
          float seg = aDim.x > 1. ? 2. : 1., scal = abs(sin(3.14159 * (xn + .5) * seg));
          float fph = xn * (8. + 5. * sd) + sd * 40., fold = sin(fph) * .7 + sin(fph * 2.3 + sd * 70.) * .3;
          float amp = (.02 + .085 * k) * calm;
          float xw = xn * aDim.x * (1. - .09 * k * calm);
          float yl = aDim.y * k + (scal * .085 * exp(-k * 3.5) + .06 * (1. - 4. * xn * xn) * k * k + .02 * fold * k) * calm;
          vec3 p = aPos + vec3(xw, -cos(ak) * yl - .22 * stiff, sin(ak) * yl);
          float bow = (1. - stiff) * (1. - aPos.x * aPos.x / 49.) * step(-440., aPos.z); p.z += bow * uGale * 1.3; p.y -= bow * (.45 - .4 * uGale);   // the line it hangs from sags, and bows downwind
          vec3 nn = vec3(0., sin(ak), cos(ak));
          float wave = (1. - stiff) * uGale * k * .26 * sin(k * 8. - uTime * 11. + sd * 30. + position.x * 3.);
          p += nn * (wave + fold * amp); vN = normalize(nn + vec3(0., 0., .3 * (1. - stiff) * uGale * cos(k * 8. - uTime * 11. + sd * 30.)));
          vC = aCol; vK = stiff; vF = vec4(xn, calm, k, sd); vS = vec3(aDim.xy, aDim.w);
          vec4 mv = viewMatrix * vec4(p, 1.); vD = length(mv.xyz); gl_Position = projectionMatrix * mv; }`,
      fragmentShader: GLSL_COMMON + /* glsl */`
        varying vec3 vC; varying vec3 vN; varying float vD; varying float vK; varying vec4 vF; varying vec3 vS;
        void main() {
          float xn = vF.x, calm = vF.y, k = vF.z, sd = vF.w, fq = 8. + 5. * sd, fph = xn * fq + sd * 40.;
          // cut to its shape: a shirt (a body and two sleeves, a notch for the neck), long johns (two legs), or a plain sheet
          float kd = vS.z, ax = abs(xn);
          if (kd > .2 && kd < .3 && ((k > .4 && ax > .27) || (k < .1 && ax < .1) || (k > .3 && k < .42 && ax > .27 && ax < .31))) discard;
          if (kd > .4 && kd < .6 && ((k > .42 && ax < .05 + .05 * (k - .42)) || (k < .3 && ax > .4))) discard;
          float fold = sin(fph) * .7 + sin(fph * 2.3 + sd * 70.) * .3, dfold = (cos(fph) * .7 + cos(fph * 2.3 + sd * 70.) * .69) * fq;
          float amp = (.02 + .085 * k) * calm;
          vec3 n = normalize(vN + vec3(-dfold * amp / max(vS.x, .1), 1e-5, 0.)); if (!gl_FrontFacing) n = -n;
          // a shop sign: a pale moulding round the board and one plain painted shape on it (a disc, a lozenge or two bars), no letters
          vec3 alb = vC;
          // some sheets are striped ticking: blue or straw on white
          { float stp = step(.64, fract(sd * 5.3)) * (1. - vK) * step(kd, .1) * step(.3, dot(vC, vec3(.34)));
            vec3 sc = mix(vec3(.2, .36, .66), vec3(.42, .52, .68), step(.6, fract(sd * 11.7)));
            alb = mix(alb, sc, stp * step(.62, fract(xn * vS.x / .34 + sd * 3.))); }
          if (vK > .5) { vec2 q = vec2(xn * 2., k * 2. - 1.); float asp = vS.x / max(vS.y, .1);
            float e = min((1. - abs(q.x)) * vS.x, (1. - abs(q.y)) * vS.y) * .5, k1 = fract(sd * 7.7);
            vec2 qa = vec2(q.x * asp, q.y);
            float dv = k1 < .34 ? length(qa) - .58 : (k1 < .67 ? abs(qa.x) * .62 + abs(q.y) - .62 : max(abs(qa.x) - 1.25, abs(abs(q.y) - .3) - .13));
            vec3 pale = vec3(.74, .72, .66);
            alb = mix(alb, pale, step(dv, 0.)); alb = mix(alb, pale, step(e, .075)); alb *= 1. - .25 * step(abs(e - .075), .012); }
          vec3 c = sfLit(alb, n, 1.) * mix(.8, 1.25, vK) * (1. - .06 * calm);
          // the sun stands beyond the cloth: a single thickness glows warm white with it, the hollows of the folds stay blue
          float ridge = smoothstep(-.5, .8, fold * (gl_FrontFacing ? 1. : -1.)), dp = calm * smoothstep(.0, .5, k);
          c += alb * uSunC * (.56 + .1 * calm + (.62 * ridge - .16) * dp) * (1. - vK) * (1. - max(dot(n, uSun), 0.));
          c *= mix(vec3(1.), vec3(.56, .68, .96), (1. - ridge) * dp * .9);
          // a doubled hem and a turned top edge, a shade darker; wooden pegs on the line
          c *= 1. - (.2 * step(.94, k) + .12 * step(k, .04) + .12 * step(.47, ax)) * (1. - vK);
          // (polish3) a hanging sheet is a made thing: two woven blue bands above its hem, and when it hangs limp its folds are drawn harder
          c = mix(c, c * vec3(.42, .56, .92), (step(.8, k) * step(k, .835) + step(.86, k) * step(k, .875)) * step(kd, .1) * (1. - vK) * step(.25, fract(sd * 3.1)));
          c *= 1. - .22 * calm * smoothstep(.2, -.6, fold) * smoothstep(.1, .6, k) * (1. - vK);
          float pgx = min(abs(abs(xn) - .46), vS.x > 1. ? abs(xn) : 9.) * vS.x;
          c = mix(c, vec3(.3, .22, .13), step(pgx, .017) * step(k * vS.y, .085) * (1. - vK));
          gl_FragColor = vec4(sfFog(c, vD), 1.); }`,
      side: THREE.DoubleSide,
    });
    const cloth = new THREE.Mesh(cGeo, cMat); cloth.frustumCulled = false; scene.add(cloth);
    const RP = { shared, uRes };
    const lineU = [];
    for (const d of lines) { const r = makeRibbon(RP, 8); r.u.uA.value.set(-7, 5.52, -d); r.u.uB.value.set(7, 5.52, -d); r.u.uW.value = 0.025; r.u.uCol.value.set('#7D6E58').multiplyScalar(2.2); scene.add(r.mesh); lineU.push(r.u); }
    // (no lines in the lot)
    await ctx.yield();
    // ---- THE LULL's own light: when the wind stops the dust hangs, each mote turning in the sun; nothing of it exists in the gale ----
    const nM = Math.round(800 * detail), mA = new Float32Array(nM * 4);
    for (let i = 0; i < nM; i++) mA.set([(hsh(i * 3.1 + 900) - 0.5) * 13, 0.25 + 5.2 * hsh(i * 5.7 + 1700) * hsh(i * 1.3 + 77), -328 - 100 * hsh(i * 7.9 + 2500), hsh(i * 11.3 + 3300)], i * 4);
    const mGeo = new THREE.InstancedBufferGeometry(); mGeo.copy(new THREE.PlaneGeometry(1, 1));
    mGeo.setAttribute('aM', new THREE.InstancedBufferAttribute(mA, 4)); mGeo.instanceCount = nM;
    const mMat = new THREE.ShaderMaterial({
      uniforms: { uTime, uLull, uRes, uSunC: shared.uSunC },
      vertexShader: /* glsl */`
        attribute vec4 aM; uniform float uTime; uniform float uLull; uniform vec2 uRes; varying vec2 vUv; varying float vA;
        void main() {
          vec3 c = aM.xyz + vec3(sin(uTime * .31 + aM.w * 40.), sin(uTime * .23 + aM.w * 17.) * .6, cos(uTime * .27 + aM.w * 29.)) * .25;
          vec4 mv = viewMatrix * vec4(c, 1.); float d = max(-mv.z, .01);
          float veil = step(aM.w, .11);            // one in nine is not a mote but a wide faint sheet of the hanging dust, low over the road
          c.y = mix(c.y, .22 + .55 * fract(aM.w * 53.), veil); mv = viewMatrix * vec4(c, 1.); d = max(-mv.z, .01);
          float sz = max(.016 + .02 * fract(aM.w * 7.3), 1.7 * d / max(uRes.y * .5 * projectionMatrix[1][1], 1.));
          mv.xy += position.xy * mix(vec2(sz * 2.), vec2(4.2, .95) * (.7 + 5. * aM.w), veil);
          vA = uLull * mix(smoothstep(.8, 2.6, d) * (1. - smoothstep(22., 60., d)) * (.4 + .6 * sin(uTime * (1.3 + 2.2 * fract(aM.w * 3.1)) + aM.w * 50.)),
            .3 * smoothstep(3.5, 9., d) * (1. - smoothstep(45., 90., d)) * (.75 + .25 * sin(uTime * .5 + aM.w * 90.)), veil);
          vUv = uv; gl_Position = projectionMatrix * mv; }`,
      fragmentShader: /* glsl */`
        uniform vec3 uSunC; varying vec2 vUv; varying float vA;
        void main() { vec2 p = vUv - .5; float a = clamp(1. - dot(p, p) * 4., 0., 1.); a *= a;
          gl_FragColor = vec4(uSunC * vec3(1., .93, .78) * .9 * a * max(vA, 0.), 1.); }`,
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    });
    const motes = new THREE.Mesh(mGeo, mMat); motes.frustumCulled = false; motes.renderOrder = 6; scene.add(motes);
    await ctx.yield();
    // ---- THE GALE IS SEEN: low sheets of dust lifted off the road and driven down the street at us, backlit by the sun ahead; more of them as
    // the gale rises, none when it stops. They keep to the sides of the road (nothing veils the hat or the centre line) and thin out by the lens ----
    const nR = Math.round(110 * detail), rA = new Float32Array(nR * 4);
    for (let i = 0; i < nR; i++) rA.set([(i % 2 ? 1 : -1) * (1.9 + 2.5 * hsh(i * 3.3 + 4100)), hsh(i * 5.9 + 4300), hsh(i * 7.7 + 4500), 0.8 + 0.7 * hsh(i * 9.1 + 4700)], i * 4);
    const rGeo = new THREE.InstancedBufferGeometry(); rGeo.copy(new THREE.PlaneGeometry(1, 1));
    rGeo.setAttribute('aR', new THREE.InstancedBufferAttribute(rA, 4)); rGeo.instanceCount = nR;
    const uCamZ = { value: 0 };
    const rMat = new THREE.ShaderMaterial({
      uniforms: { ...shared, uCamZ, uDrift, uGale, uTime },
      vertexShader: /* glsl */`
        attribute vec4 aR; uniform float uCamZ; uniform float uDrift; uniform float uGale; uniform float uTime;
        varying vec2 vUv; varying vec3 vA; varying float vD;
        void main() {
          float L = 110., zr = mod(aR.y * L + uDrift * (.75 + .5 * aR.z), L), z = uCamZ - L + zr + 5.;
          float x = aR.x + .45 * sin(uTime * .9 + aR.z * 40. + zr * .08);
          float w = aR.w * (1.5 + 1.3 * aR.z), h = aR.w * (.36 + .42 * fract(aR.z * 7.3));
          vec4 mv = viewMatrix * vec4(x, .06 + h * .5, z, 1.); mv.xy += position.xy * vec2(w, h);
          vD = length(mv.xyz); vUv = uv;
          float g = uGale * (.45 + .55 * uGale) * step(-427., z) * step(fract(aR.z * 13.7), .3 + .7 * uGale);
          vA = vec3(g * smoothstep(3.5, 10., vD) * (1. - smoothstep(55., 100., vD)), aR.z, zr);
          gl_Position = projectionMatrix * mv; }`,
      fragmentShader: GLSL_COMMON + NOISE_GLSL + /* glsl */`
        varying vec2 vUv; varying vec3 vA; varying float vD;
        void main() { vec2 p = vUv - .5;
          // a torn sheet hugging the ground: full along its foot, combed out along the wind, ragged on top
          float n = vn(vec2(p.x * 3. + vA.y * 31., p.y * 2. + vA.z * .35)) * .6 + vn(vec2(p.x * 9. + vA.y * 57., p.y * 5.)) * .4;
          float body = (1. - 4. * p.x * p.x) * (1. - smoothstep(.25 + .5 * n, 1.01, vUv.y)) * smoothstep(0., .12, vUv.y);
          float a = clamp(body * (.45 + .9 * n) - .12, 0., 1.);
          vec3 c = mix(vec3(.56, .58, .66), uSunC * vec3(1.34, 1.14, .8), smoothstep(.1, .7, vUv.y + (n - .5) * .5));
          gl_FragColor = vec4(sfFog(c, vD), a * clamp(vA.x, 0., 1.) * .66); }`,
      transparent: true, depthWrite: false,
    });
    const ribbons = new THREE.Mesh(rGeo, rMat); ribbons.frustumCulled = false; ribbons.renderOrder = 4; scene.add(ribbons);
    await ctx.yield();
    // ---- the lot is not a floor: tufts of dry grass along the fence foot and here and there in the dust, leaning and shivering in the breeze ----
    const nT = Math.round(520 * detail), tA = new Float32Array((nT + Math.round(210 * detail) + 8) * 4); let nTuft = nT;   // (flight2) room for the tufts at the picket runs' feet (2 x 31.1 m / 0.3 m = 207)
    for (let i = 0; i < nT; i++) { const k = hsh(i * 2.3 + 500), edge = hsh(i * 9.1 + 600) < 0.45;
      let x = (hsh(i * 3.7 + 510) - 0.5) * 25, z = -437 - 74 * hsh(i * 5.3 + 520);
      if (edge) { if (k < 0.5) x = (k < 0.25 ? -1 : 1) * (12.6 - 1.4 * hsh(i * 1.9) * hsh(i * 4.1)); else z = -511.4 + 2.2 * hsh(i * 1.9) * hsh(i * 4.1); }
      if (!edge && Math.abs(x) < 8.4) x = (x < 0 ? -1 : 1) * (8.4 + 4.2 * hsh(i * 3.7 + 515));   // the middle of the lot is bare dust: that is the hat's, and nothing there is bigger than it
      const sz = 0.3 + 0.5 * hsh(i * 6.7 + 530) * (edge ? 1.3 : 1);
      tA.set([x, z, Math.abs(x) < 8.4 ? Math.min(sz, 0.26) : sz, hsh(i * 8.9 + 540)], i * 4); }
    // (flight2) GRASS AT THE FOOT OF THE PICKET RUNS. The lot's tufts all grow 8.4 m or more from the line (the middle is the hat's), and
    // flight1's runs, which come in from 10.67 m to 4.62 m, stand between the line and nearly all of them: so the yellow that grounded the
    // lot went out of sight. Grass grows where a fence keeps wheels and feet off the ground: a ragged line of tufts along the foot of each
    // run, two of every three on the side we pass (0.12 to 0.6 m in from the pickets), the third under and behind them (seen between the
    // pickets). One to every 0.3 m of run on average (a tuft is 0.3 to 0.7 m across), none in the first 2.2 m (inside the flanking
    // building), none nearer the line than 4.4 m (the gate posts' inner faces stand at 4.33), none taller than 0.45 m: under half a picket,
    // and under the hat's width at that distance from it. Laid from hashes of their own (no draw from the visit's rng); sizes are in the
    // tufts' own unit (width 1.5 sz, height sz)
    { const A = [LOT_RUN.x0, -LOT_RUN.d0], B = [LOT_RUN.x1, -LOT_RUN.d1], Lr = Math.hypot(B[0] - A[0], B[1] - A[1]), nx = (B[1] - A[1]) / Lr, nz = (A[0] - B[0]) / Lr;   // (nx, nz): across the right hand run, toward the line (and a little toward us)
      const nF = Math.round(2 * (Lr - 2.2) / 0.3 * detail); let w = nT;
      for (let i = 0; i < nF; i++) { const s2 = i % 2 ? 1 : -1, t = (2.2 + (Lr - 2.2) * hsh(i * 2.9 + 700)) / Lr, near = hsh(i * 4.7 + 710) < 0.667;
        const off = near ? -(0.12 + 0.48 * hsh(i * 6.1 + 720) * hsh(i * 3.3 + 725)) : 0.05 + 0.3 * hsh(i * 6.1 + 720);                 // metres across the run: minus is toward the line
        const x = A[0] + (B[0] - A[0]) * t - off * nx, z = A[1] + (B[1] - A[1]) * t - off * nz;
        if (x < 4.4) continue;
        tA.set([s2 * x, z, 0.22 + 0.23 * hsh(i * 8.3 + 730), hsh(i * 9.7 + 740)], w * 4); w++; }
      nTuft = w; }
    const tGeo = new THREE.InstancedBufferGeometry(); tGeo.copy(new THREE.PlaneGeometry(1, 1).translate(0, 0.5, 0));
    tGeo.setAttribute('aT', new THREE.InstancedBufferAttribute(tA, 4)); tGeo.instanceCount = nTuft;
    const tMat = new THREE.ShaderMaterial({
      uniforms: { ...shared, uTime, uGale },
      vertexShader: /* glsl */`
        attribute vec4 aT; uniform float uTime; uniform float uGale; varying vec2 vUv; varying float vD; varying float vSd;
        void main() { vec3 rt = normalize(vec3(viewMatrix[0][0], 0., viewMatrix[2][0]) + vec3(1e-5, 0., 0.));
          float lean = position.y * position.y * (.25 + 1.6 * uGale + .5 * uGale * sin(uTime * 5. + aT.w * 40. + aT.x));
          vec3 p = vec3(aT.x, 0., aT.y) + rt * position.x * aT.z * 1.5 + vec3(0., position.y * aT.z, lean * aT.z);
          vUv = vec2(position.x, position.y); vSd = aT.w;
          vec4 mv = viewMatrix * vec4(p, 1.); vD = length(mv.xyz); gl_Position = projectionMatrix * mv; }`,
      fragmentShader: GLSL_COMMON + /* glsl */`
        varying vec2 vUv; varying float vD; varying float vSd;
        void main() { float hit = 0., sh = 0.;
          for (int i = 0; i < 9; i++) { float fi = float(i), r1 = fract(sin(fi * 12.9 + vSd * 91.) * 437.5), r2 = fract(sin(fi * 7.3 + vSd * 57.) * 917.3);
            float x0 = (r1 - .5) * .5, h = .5 + .5 * r2, bend = (r1 - .5) * .9;
            float d = abs(vUv.x - x0 - bend * vUv.y * vUv.y) - .05 * (1. - vUv.y / h);
            if (d < 0. && vUv.y < h) { hit = 1.; sh = r2; } }
          if (hit < .5) discard;
          // dry straw, paler toward the tips where the sun comes through from beyond
          vec3 alb = mix(vec3(.3, .25, .09), vec3(.8, .6, .22), vUv.y) * (.7 + .5 * sh);
          vec3 c = alb * (uSunC * (.35 + .65 * vUv.y) + uSkyC * .5);
          gl_FragColor = vec4(sfFog(c, vD), 1.); }`,
      side: THREE.DoubleSide,
    });
    const tufts = new THREE.Mesh(tGeo, tMat); tufts.frustumCulled = false; scene.add(tufts);
    await ctx.yield();
    // ---- (polish2, second pass) THE GALE'S LITTER KEEPS TO THE KERBS: small scraps of paper and rag (under 0.5 m) skitter down the gutters and the
    // boardwalks, never nearer the line than 4 m, each with its blue shadow. Nothing on the road itself: that is the hat's and the hazards'. They
    // travel the integral of the gale over u, so when the wind stops they lie where they fell; from 1.5 s before to 1 s after every crossing
    // (uTumK goes to 0) none is drawn within 20 m of the lens; none lies where the front will come down ----
    const uTravel = { value: 0 }, uTumK = { value: 1 };
    const trvT = new Float32Array(513);
    { let a = 0; for (let i = 0; i <= 512; i++) { trvT[i] = a; a += dev.gale(i / 512) * 8.5 * DUR / 512; } }
    const TUMBLE_VS = /* glsl */`
      attribute vec4 aR; attribute vec3 aC; uniform float uCamZ; uniform float uTravel; uniform float uGale; uniform float uTime; uniform float uTumK;
      float tBase;
      vec3 tumble(vec3 pos, out vec3 nrm, out float live) {
        float g = min(uGale * 2.2, 1.);
        vec2 sz = vec2(.28, .36) * (.8 + .45 * fract(aR.x * 7.3));
        float zw = -aR.y * 520. + uTravel * (.65 + .7 * aR.z), L = 96.;
        float z = uCamZ - 84. + mod(zw - (uCamZ - 84.), L);
        float sgn = aR.x < .5 ? -1. : 1.;
        float ax = 4.08 + 2.2 * fract(aR.x * 13.7) + .06 * sin(zw * .11 + aR.x * 40.);
        tBase = step(4.5, ax) * .3;
        float ph = zw * (.45 + .4 * fract(aR.x * 3.1)) + aR.y * 50.;
        float top = .12 + .5 * fract(aR.z * 5.3);
        float y0 = top * abs(sin(ph)) * g;
        float a = (fract(ph * 2.3 / 6.2832) - .5) * 6.2832 * g, yaw = aR.z * 6.2832 + .7 * sin(ph * .7);
        vec3 q = vec3(pos.x * sz.x, 0., pos.y * sz.y);
        q.y += (sin(pos.x * 6.5 + uTime * 7. + aR.x * 30.) * .16 * sz.x + .22 * sz.y * sin(pos.y * 3.6 + ph)) * (.3 + .7 * g) * .35;
        float ca = cos(a), sa = sin(a), cy = cos(yaw), sy = sin(yaw);
        q = vec3(q.x, q.y * ca - q.z * sa, q.y * sa + q.z * ca); nrm = vec3(0., ca, sa);
        q = vec3(q.x * cy + q.z * sy, q.y, -q.x * sy + q.z * cy); nrm = vec3(nrm.z * sy, nrm.y, nrm.z * cy);
        live = max(smoothstep(-400., -394., z), 1. - smoothstep(-442., -438., z)) * smoothstep(-469., -465., z) * smoothstep(-84., -76., z - uCamZ);
        live *= mix(smoothstep(20., 24., uCamZ - z), 1., uTumK) * step(-414., z);          // (and none by the set-back fronts or in the lot)
        q *= live;
        return vec3(sgn * ax, tBase + y0 + .035 + .5 * sz.y * abs(sa) * live, z) + q; }`;
    const nTum = Math.max(24, Math.round(44 * detail));
    const tuGeo = new THREE.InstancedBufferGeometry(); tuGeo.copy(new THREE.PlaneGeometry(1, 1, 8, 8));
    { const aR = new Float32Array(nTum * 4), aC = new Float32Array(nTum * 3), tc = [W8('#F4F1E8', 0.86), W8('#F4F1E8', 0.86), W8('#C9D6E6', 0.84), W8('#D9B25A', 0.8), W8('#5E86C4', 0.7)];
      for (let k = 0; k < nTum; k++) { const big = 0, c = tc[k % 3];   // the washing is white or pale; some of it striped blue in the shader
        aR.set([hsh(k * 1.7 + 200), hsh(k * 3.1 + 210), hsh(k * 5.9 + 220), big], k * 4); aC.set([c.r, c.g, c.b], k * 3); }
      tuGeo.setAttribute('aR', new THREE.InstancedBufferAttribute(aR, 4)); tuGeo.setAttribute('aC', new THREE.InstancedBufferAttribute(aC, 3)); tuGeo.instanceCount = nTum; }
    const tuU = { ...shared, uShadeC: { value: new THREE.Color(0.105, 0.13, 0.2) }, uCamZ, uTravel, uGale, uTime, uTumK };
    const tuMat = new THREE.ShaderMaterial({ uniforms: tuU, side: THREE.DoubleSide,
      vertexShader: TUMBLE_VS + /* glsl */`
        varying vec3 vC; varying vec3 vN; varying float vD; varying vec2 vUv; varying float vBig; varying float vSeed;
        void main() { vec3 n; float live; vec3 w = tumble(position, n, live); vC = aC; vN = n; vUv = uv; vBig = aR.w; vSeed = aR.x;
          vec4 mv = viewMatrix * vec4(w, 1.); vD = length(mv.xyz); gl_Position = projectionMatrix * mv; }`,
      fragmentShader: GLSL_COMMON + /* glsl */`
        varying vec3 vC; varying vec3 vN; varying float vD; varying vec2 vUv; varying float vBig; varying float vSeed;
        void main() { vec3 n = normalize(vN + vec3(0., 1e-5, 0.));
          // thin stuff with the sun beyond it: lit through from either side, blue only where it turns edge-on to the light
          float nl = abs(dot(n, uSun)); vec3 alb = vC;
          // cloth is torn at its edges and falls in folds: sun on the ridges, the street's blue in the valleys
          float e = min(min(vUv.x, 1. - vUv.x), min(vUv.y, 1. - vUv.y));
          if (vBig > .5 && e < .04 + .035 * sin(vUv.x * 19. + vSeed * 40.) * sin(vUv.y * 15. + vSeed * 23.)) discard;
          float folds = sin(vUv.x * 9. + vSeed * 20. + 1.8 * sin(vUv.y * 4.4 + vSeed * 7.)) * step(.5, vBig);
          vec3 c = alb * (uSunC * (.22 + .7 * nl) * (.74 + .3 * folds) + uSkyC * .95 + uGndC * 1.5);
          c = mix(c, c * vec3(.6, .73, 1.02), (1. - smoothstep(-.7, .1, folds)) * .7 * step(.5, vBig));
          gl_FragColor = vec4(sfFog(c, vD), 1.); }` });
    const tuSh = new THREE.ShaderMaterial({ uniforms: tuU, side: THREE.DoubleSide, transparent: true, depthWrite: false,
      blending: THREE.CustomBlending, blendEquation: THREE.MinEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
      vertexShader: TUMBLE_VS + /* glsl */`
        uniform vec3 uSun; varying float vD;
        void main() { vec3 n; float live; vec3 w = tumble(position, n, live);
          float t = max(w.y - tBase - .012, 0.) / max(uSun.y, 1e-3); w.xz -= uSun.xz * t; w.y = tBase + .012;
          vec4 mv = viewMatrix * vec4(w, 1.); vD = length(mv.xyz); gl_Position = projectionMatrix * mv; }`,
      fragmentShader: /* glsl */`
        uniform vec3 uShadeC; uniform vec3 uFogC; uniform float uFogD; varying float vD;
        void main() { float f = 1. - exp(-uFogD * uFogD * vD * vD); gl_FragColor = vec4(mix(uShadeC, uFogC, f), 1.); }` });
    const tumblers = new THREE.Mesh(tuGeo, tuMat), tumShadow = new THREE.Mesh(tuGeo, tuSh);
    tumblers.frustumCulled = false; tumShadow.frustumCulled = false; tumShadow.renderOrder = 2; scene.add(tumblers, tumShadow);
    await ctx.yield();
    // (behind the front there is nothing: the lot, the fence, the sky. No far layer.)
    // ---- the flight: one dead straight level line at one speed; the camera never turns, slows or looks at anything ----
    const path = makePath([[0, EYE, 0], [0, EYE, -LEN / 2], [0, EYE, -LEN]]);
    const title = kind === 'opera' ? 'Stone Face: the Opera House' : kind === 'bank' ? 'Stone Face: the Bank' : 'Stone Face';
    return {
      scene, path, duration: DUR, pace: () => 1, title,
      ride: 'none', style: 'none', companion: 'none',
      camera: { fov: 62, near: 0.3, nearThrough: 0.3, far: 3000, lookAhead: 40, sway: 0, bank: 0 },
      pois: [],
      portal: { shape: 'rect', width: 5.2, height: 4.9, halo: false, style: 'ring', color: '#F4F1E8', glow: 0.8, revealDistance: 120, blendDistance: 25 },
      post: { exposure: 1, bloom: { strength: 0.12, radius: 0.5, threshold: 1 }, grade: { saturation: 1.15, contrast: 1.12, vignette: 0.16, grain: 0.02 } },
      debug: { report: dev.report, vary: { sx, slot2, kind, lateHour, rare } },
      update(dt, time, camera, u) {
        const g = dev.update(dt, time, camera, u);
        uGale.value = g; uTime.value = time; uCamZ.value = camera.matrixWorld.elements[14];
        { const hs = dev.hat.state, onG = hs.y < 0.6 ? 1 : 0; uHat.value.set(0.15 * Math.sin((Math.PI * 2 * 1.1 * time) % (Math.PI * 2)), hs.pos.z + 0.06, onG, (Math.PI * 2 * 1.1 * time) % (Math.PI * 2)); }
        for (const lu of lineU) { lu.uBow.value = g * 1.3; lu.uSag.value = 0.45 - 0.4 * g; }
        // washing swings to rest when the wind stops (damped over about 2 s)
        uSwing.value = 0.045 + 0.42 * THREE.MathUtils.smoothstep(u, 0.668, 0.69) * Math.exp(-Math.max(u - 0.69, 0) * DUR * 1.3);
        { const D = F.dH + camera.matrixWorld.elements[14], th = dev.frontU.uTheta.value, on = D > 12 && th < 1.2;
          skyMat.uniforms.uWin.value.set(on ? 6.2 / D : 0, on ? Math.max(0, (11.3 * Math.cos(th) - EYE) / Math.max(D - 11.3 * Math.sin(th), 1)) : 0, on ? 1 + THREE.MathUtils.smoothstep(th, 0.12, 0.6) : 0); }
        uCloud.value = (time * 0.22 + u * DUR * 0.5) % 3400;   // the clouds cross on the clock and, faster, with the flight: no two moments of the street have the same sky
        uBig.value = THREE.MathUtils.smoothstep(u, 0.848, 0.868);          // once the front is down the sky is the picture: the clouds swell
        uDrift.value = (time * 17) % 40000;
        { let k = 1 - THREE.MathUtils.smoothstep(dev.frontU.uTheta.value, 0.03, 0.3);     // the clouds part before every hazard: each one comes in full sun, its shadow ahead of it
          for (const [a, b] of [[0.147, 0.122], [0.245, 0.2535], [0.366, 0.366], [0.488, 0.488], [0.59, 0.649]]) k *= 1 - THREE.MathUtils.smoothstep(u, a - 0.06, a - 0.04) * (1 - THREE.MathUtils.smoothstep(u, b + 0.004, b + 0.02));
          uCsK.value = k * (1 - THREE.MathUtils.smoothstep(u, 0.652, 0.668)); }       // (second pass) and none in the lull: the light never changes, and the first blue to cross the road after the wind stops is the front's own shadow
        { let k = 1;                                                             // the kerbs' litter keeps 20 m off the lens round every crossing
          for (const [a, b] of [[0.085, 0.15], [0.21, 0.27], [0.33, 0.39], [0.45, 0.51], [0.555, 0.67]]) k *= 1 - THREE.MathUtils.smoothstep(u, a - 0.014, a - 0.002) * (1 - THREE.MathUtils.smoothstep(u, b + 0.002, b + 0.014));
          uTumK.value = k; }
        { const f = THREE.MathUtils.clamp(u, 0, 1) * 512, i0 = Math.min(511, Math.floor(f)); uSpin.value = -(spinT[i0] + (spinT[i0 + 1] - spinT[i0]) * (f - i0)) - (u <= 0 ? time * 1.8 : 0); }
        { const f = THREE.MathUtils.clamp(u, 0, 1) * 512, i0 = Math.min(511, Math.floor(f)); uTravel.value = trvT[i0] + (trvT[i0 + 1] - trvT[i0]) * (f - i0) + (u <= 0 ? (time * 3) % 5000 : 0); }
        uLull.value = THREE.MathUtils.smoothstep(u, 0.672, 0.70) * (1 - THREE.MathUtils.smoothstep(u, 0.80, 0.845));
      },
      dispose() { dev.dispose(); },
    };
  },
};
