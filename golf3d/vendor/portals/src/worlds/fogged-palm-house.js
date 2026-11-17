// The Fogged Palm House: a pearl-grey winter morning at a great iron-and-glass palm house whose every pane is misted.
// STYLE (the law): sharpness and colour belong to contact. Milk glass is the light; things are crisp viridian where
// they touch a pane (seen from the snow) or the lens (inside), and grow larger, softer and paler away from it, into
// milk white, never into dark. No lights, no shadows, no fog, no screen blur: every material is unlit and comes from
// the one makeStyle instance (src/parts/fogged-palm-house.js) or from its palette uniforms. post.flat = 1.
// NEAR PLANTING ON CUE (so that no stretch of the course is bare white glass): an avenue of slender tree ferns throws whole
// fronds over the walk through the wing and lifts them under the lens down the apse; four fans hang over the climb in the
// dome; the seed's accent is met at arm's length in the wing, at the dome's mouth and on standards down the apse; prints lie
// on the drum's panes. All of it is the style's own leaf cards under the one contact rule (per-mesh reach), nothing else.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { makePath, makeRng, clamp, lerp, smoothstep } from '../kit/core.js';
import { buildHero, makeStyle, makeStyleTextures, ATLAS_CELLS, PALETTE, DOME } from '../parts/fogged-palm-house.js';

const TAU = Math.PI * 2;
const DZ = 200;                       // world z of the dome's centre
const WING = { z0: 80, hw: 13, spring: 5.5, rise: 6.5 };          // fern wing: barrel vault 26 m wide, 12 m high
const APSE = { z1: 308, hw: 11, spring: 11, rise: 11 };           // apse: 22 m wide, arch 22 m high
const WHEEL = { y: 9, r: 7 };                                    // (polish: the wheel hangs 3 m lower, so the nave is flown among the fern crowns, not over them)

// hour looks: [milk, pearl, greyGreen, viridian, deep, accent, blue], then sky horizon, sky zenith, pale patch
const HOURS = {
  day: { pal: PALETTE.slice(), lo: '#C3CAC8', hi: '#6C9BC7', patch: '#F3E8C2', snow: 0.14 },     // (polish 4: the snow a clear tone under the glass)
  dawn: { pal: ['#F4F1EC', '#CEC6C6', '#93A89C', '#0E6F57', '#0A4638', '#D7281E', '#BC8E9C'], lo: '#CFC2C2', hi: '#A98C9E', patch: '#EBD9D2', snow: 0.22 },
  golden: { pal: ['#F6F1E3', '#D9CCAE', '#98A88E', '#0E6F57', '#0A4638', '#D7281E', '#7BA0C4'], lo: '#D6C7A6', hi: '#7C9EBF', patch: '#F0DDAE', snow: 0.2 },
  night: { pal: ['#DCE6F3', '#8C9CB9', '#6C8D93', '#0D6658', '#083A36', '#D7281E', '#27447F'], lo: '#56678A', hi: '#172850', patch: '#B9C8E2', snow: 0.42 },
};
const ACCENTS = [['hibiscus', '#D7281E'], ['clivia', '#E8741C'], ['bougainvillea', '#C2247E']];

// ---------------------------------------------------------------- small geometry accumulator
function makeAcc() { return { pos: [], nor: [], uv: [], idx: [] }; }
// a grid of nu x nv cells; fn(a, b, out) fills out = [x, y, z, nx, ny, nz, u, v] for a, b in 0..1
function accGrid(acc, nu, nv, fn) {
  const base = acc.pos.length / 3, o = [0, 0, 0, 0, 1, 0, 0, 0];
  for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) {
    fn(i / nu, j / nv, o);
    acc.pos.push(o[0], o[1], o[2]); acc.nor.push(o[3], o[4], o[5]); acc.uv.push(o[6], o[7]);
  }
  const W = nu + 1;
  for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) { const a = base + j * W + i; acc.idx.push(a, a + 1, a + W, a + 1, a + W + 1, a + W); }
}
function accGeometry(acc) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(acc.pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(acc.nor, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(acc.uv, 2));
  g.setIndex(acc.idx);
  return g;
}
// a flat rectangular pane wall: corner P, edge vectors A (along the lanes' axis, lane width lw) and down-edge D
// (unit, length h); uv = (lane coordinate + u0, metres down from the top edge + v0)
function accWall(acc, P, A, lenA, D, h, N, lw, u0 = 0, v0 = 0) {
  accGrid(acc, 1, 1, (a, b, o) => {
    o[0] = P.x + A.x * lenA * a + D.x * h * b; o[1] = P.y + A.y * lenA * a + D.y * h * b; o[2] = P.z + A.z * lenA * a + D.z * h * b;
    o[3] = N.x; o[4] = N.y; o[5] = N.z; o[6] = u0 + lenA * a / lw; o[7] = v0 + h * b;
  });
}

// ---------------------------------------------------------------- the world's own flats: sky and grounds
const SKY_VERT = /* glsl */`
varying vec3 vDir;
void main(){
  vDir = position;
  vec4 p = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.);
  if (abs(p.w) < 1e-4) p.w = 1e-4;
  gl_Position = p.xyww;
}`;
// a thin high overcast: pearl at the horizon lifting to the cold blue overhead, no disc, one broad paler patch
const SKY_FRAG = /* glsl */`
uniform vec3 uLo, uHi, uPatch, uPatchDir; uniform float uTime;
varying vec3 vDir;
float h21(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(h21(i), h21(i + vec2(1., 0.)), f.x), mix(h21(i + vec2(0., 1.)), h21(i + vec2(1., 1.)), f.x), f.y); }
void main(){
  vec3 d = normalize(vDir + vec3(0., 1e-5, 0.));
  float y = max(d.y, 0.);
  vec2 q = d.xz / (y + 0.35);
  float band = vn(q * vec2(1.3, 3.1) + vec2(uTime * 0.012, 0.)) * 0.6 + vn(q * vec2(3.7, 9.) - vec2(uTime * 0.02, 1.7)) * 0.4;
  vec3 col = mix(uLo, uHi, smoothstep(0.0, 0.26, y + (band - 0.5) * 0.1));
  float pt = max(dot(d, uPatchDir), 0.);
  col = mix(col, uPatch, pt * pt * pt * pt * pt * 0.8 * (0.75 + 0.5 * band));        // (polish 4: the sun's patch is the pale gold that falls through the glass inside)
  col = mix(uLo, col, smoothstep(-0.02, 0.05, d.y));
  gl_FragColor = vec4(col, 1.);
}`;
const GROUND_VERT = /* glsl */`
varying vec3 vWp;
void main(){ vec4 wp = modelMatrix * vec4(position, 1.); vWp = wp.xyz; gl_Position = projectionMatrix * viewMatrix * wp; }`;
// uMode 0: snow and the swept terrace (outside; far value is the sky's horizon). 1: the fern wing (grating down the
// middle, beds either side). 2: the apse (pale paving). Inside, the floor obeys the contact rule: joints and bars are
// drawn where the lens is near, glow further off.
function groundFrag(common, dappleGlsl) {
  return common + dappleGlsl + /* glsl */`
uniform float uMode; uniform vec3 uLo; uniform float uSnow;
varying vec3 vWp;
float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(h21(i), h21(i + vec2(1., 0.)), f.x), mix(h21(i + vec2(0., 1.)), h21(i + vec2(1., 1.)), f.x), f.y); }
// a line of bird prints from a to b: one soft dart every 0.3 m, left foot, right foot, wandering a little
float birdTrack(vec2 p, vec2 a, vec2 b, float seed, float w){
  vec2 d = b - a; float len = max(length(d), 1e-3); vec2 t = d / len, n = vec2(-t.y, t.x);
  float s = dot(p - a, t), o = dot(p - a, n) + 0.3 * sin(s * 0.6 + seed) + 0.1 * sin(s * 1.9 + seed * 3.);
  float cell = floor(s / 0.3);
  vec2 q = vec2((fract(s / 0.3) - 0.5) * 0.3, o - (mod(cell, 2.) * 2. - 1.) * 0.065);
  float m = 1. - smoothstep(0.028, 0.06 + w, length(q * vec2(0.5, 1.)));
  m = max(m, (1. - smoothstep(0.012, 0.03 + w, abs(abs(q.y) - (q.x + 0.03) * 0.7))) * step(-0.03, q.x) * step(q.x, 0.12));   // the toes, spread
  return m * step(0., s) * step(s, len) * (1. - smoothstep(0.12, 0.4, w));
}
float gridLine(vec2 p, vec2 w){ vec2 d = 0.5 - abs(fract(p) - 0.5); vec2 l = 1. - smoothstep(w, w * 2. + 1e-4, d); return max(l.x, l.y); }
void main(){
  float dist = distance(vWp, uLens);
  vec2 p = vWp.xz;
  // (polish 6) the snow does not lie under the house: over its 2400 m plane the depth of a floor 6 cm above it is not held, and the terrace showed through the wing's floor
  if (uMode < 0.5 && ((abs(p.x) < 12.7 && p.y > 80.4 && p.y < 307.6) || length(p - vec2(0., 200.)) < 29.6)) discard;
  vec2 fw = max(fwidth(p), vec2(1e-4));
  vec3 col;
  if (uMode < 0.5) {
    float n = vn(p * 0.06 + 3.) * 0.6 + vn(p * 0.19) * 0.3 + vn(p * 0.7) * 0.1;
    float drift = vn(p * vec2(0.035, 0.11) + 9.) ;                       // long soft drifts lying across the wind
    float fwm0 = max(fw.x, fw.y);
    // (polish 6) the snow is one flat tone, and a drift is a drawn shape with a cut edge (soft patches read as shadows, and there are none)
    col = mix(cMilk, cPearl, uSnow + 0.0 * (drift + n));
    // the terrace: a swept strip of long flags down the axis (4 m along the course: nothing alternates under the lens
    // faster than three a second), each its own tone of pearl, joints soft grooves in grey-green, never a line
    float ex = abs(p.x) + 0.5 * vn(p * vec2(1.7, 0.4));
    float on = step(-60., p.y) * (1. - smoothstep(76., 80., p.y));
    float strip = (1. - smoothstep(4.55, 4.6 + fw.x + fw.y, ex)) * step(-60., p.y);     // (polish 6: every edge on the snow is cut, none is a soft gradient)
    vec2 q = vec2(p.x, p.y + 1.33 * floor(p.x / 1.5)) / vec2(1.5, 4.0);
    vec2 jd = 0.5 - abs(fract(q) - 0.5);
    vec2 jw = fw / vec2(1.5, 4.0);
    float jx = 1. - smoothstep(0.028, 0.03 + jw.x, jd.x), jy = 1. - smoothstep(0.011, 0.012 + jw.y, jd.y);     // (polish 7) snow packed in the joints: a cut white line, never a soft groove
    float jfade = 1. - smoothstep(0.1, 0.55, max(fw.x, fw.y));
    float near = 1. - smoothstep(14., 60., dist);
    float dustN = vn(p * vec2(0.8, 0.2) + 17.) * 0.7 + vn(p * vec2(2.3, 0.9)) * 0.3;
    float dust = smoothstep(0.64, 0.645 + fwm0 * 0.5, dustN);      // snow the broom left lying: cut-edged drifts of milk on the wet stone
    // (polish 7) the swept flags are wet stone, a full tone under the snow (three flat tones of pearl going grey-green), snow packed white in every joint,
    // drifts the broom left lying across them: the walk is a drawn thing, never a bare pale floor
    vec3 flag = mix(cPearl, cGrey, 0.3 + 0.22 * floor(h21(floor(q)) * 3.) / 3.);
    flag = mix(flag, cMilk, max(jx, jy) * jfade * 0.9);
    flag = mix(flag, cMilk, dust);
    col = mix(col, flag, strip);
    // the snow the broom threw up: a soft milk bank along each side of the strip, the wet edge of the flags at its foot
    float bank = smoothstep(4.55, 4.6 + fwm0, ex) * (1. - smoothstep(6.5, 6.55 + fwm0, ex + 0.7 * vn(p * vec2(0.8, 0.21) + 4.)));
    col = mix(col, cMilk, bank * 0.9 * on);
    col = mix(col, mix(cGrey, cVirid, 0.25), (1. - smoothstep(0.05, 0.07 + fwm0, abs(ex - 4.5))) * 0.55 * on * (1. - smoothstep(0.1, 0.5, fwm0)));

    // blackbird tracks across the swept strip, from under the lens toward the birds: soft darts in grey-green
    float fwm = max(fw.x, fw.y);
    float tr = max(birdTrack(p, vec2(3.6, -1.0), vec2(1.4, 9.0), 1.3, fwm), max(birdTrack(p, vec2(2.0, 0.5), vec2(-0.6, 13.5), 4.1, fwm), birdTrack(p, vec2(4.4, 3.0), vec2(-2.2, 16.5), 7.7, fwm)));
    col = mix(col, mix(cGrey, cDeep, 0.55), tr * 0.85);
    col = mix(col, uLo, smoothstep(70., 520., dist));
  } else {
    float s = contactS(dist);
    float crisp = 1. - smoothstep(0.3, 0.8, s);
    float isBed = 0.;
    if (uMode < 1.5) {
      float gr = 1. - smoothstep(1.5, 1.5 + fw.x, abs(p.x));
      vec2 q = vec2(p.x * 8., p.y / 0.75);
      float bars = gridLine(q, max(fwidth(q), vec2(0.06, 0.02)));
      bars *= 1. - smoothstep(0.2, 0.6, max(fwidth(q.x), fwidth(q.y)));
      float m = vn(p * 0.5) * 0.6 + vn(p * 1.9 + 7.) * 0.4;
      vec3 bed = mix(mix(cGrey, cVirid, 0.7), mix(cPearl, cGrey, 0.75), smoothstep(0.55, 1.0, contactS(dist * 0.5))) + 0.0 * m;     // (polish 6) planted earth: dark at the lens, paling with distance
      vec3 grate = mix(mix(cMilk, cPearl, 0.35), cGrey, bars * 0.8);
      float edge = (1. - smoothstep(0.05, 0.05 + fw.x, abs(abs(p.x) - 1.56))) ;
      col = mix(bed, grate, gr); isBed = 1. - gr;
      col = mix(col, mix(cMilk, cPearl, 0.3), edge);
    } else {
      vec2 q = vec2(p.x + p.y, p.x - p.y) / 1.56;
      vec2 jd = 0.5 - abs(fract(q) - 0.5), jw = max(fwidth(q), vec2(1e-4));
      float jt = max(1. - smoothstep(0.0, 0.07 + jw.x, jd.x), 1. - smoothstep(0.0, 0.07 + jw.y, jd.y));
      jt *= 1. - smoothstep(0.1, 0.35, max(jw.x, jw.y));
      col = mix(mix(cMilk, cPearl, 0.3 + 0.2 * h21(floor(q))), mix(cPearl, cGrey, 0.3), jt * 0.5);
      isBed = smoothstep(2.9, 2.9 + fw.x, abs(p.x));
      col = mix(col, mix(cMilk, cPearl, 0.3), isBed);
      float ed = smoothstep(3.06, 3.06 + fw.x, abs(p.x));
      col = mix(col, mix(mix(cGrey, cVirid, 0.7), mix(cPearl, cGrey, 0.75), smoothstep(0.55, 1.0, contactS(dist * 0.5))), ed); isBed = ed;
    }
    col = mix(mix(cMilk, cPearl, 0.12), col, mix(crisp * 0.6 + 0.4, 1., isBed));
    // (polish 4) the second key: out of the sun the floor is a tone of pearl under the glass; a bay's light lies on it in flat gold
    col = mix(col, mix(cPearl, cGrey, 0.42), 0.62 * (1. - 0.4 * smoothstep(0.5, 1., s)) * (1. - isBed));
    col = mix(col, cSun, sunBand(p, max(fw.x, fw.y)) * 0.92 * (1. - 0.72 * isBed) * (1. - 0.9 * dapple(p, max(fw.x, fw.y))));     // (polish 6) the light falls through the planting: leaf shapes stand in each bar of gold
  }
  gl_FragColor = vec4(col, 1.);
}`;
}

export default {
  id: 'fogged-palm-house',
  name: 'The Fogged Palm House',
  category: 'interior',
  weirdness: 0.3,
  media: ['interior', 'air'],
  async build(ctx) {
    const rng = ctx.rng;
    const vary = ctx.vary || {};
    const detail = clamp(ctx.quality?.detail ?? 1, 0.6, 1);
    const density = clamp(vary.density ?? 1, 0.7, 1.3);
    const rare = !!vary.rare;
    // ---- the seeded look: hour, weather, accent, wings
    const vr = rng.fork ? rng.fork('fph-vary') : rng;
    vr(); vr();
    const hourPick = (vr() + vr() * 7.31 + ((ctx.seed | 0) % 97) * 0.137) % 1;
    let hour = vary.hour && vary.hour !== 'any' ? vary.hour : (hourPick < 0.52 ? 'day' : hourPick < 0.7 ? 'dawn' : hourPick < 0.84 ? 'golden' : 'night');
    if (!HOURS[hour]) hour = 'day';
    const H = HOURS[hour];
    const accent = ACCENTS[Math.floor(vr() * 2.999)];
    const snowfall = vr() < 0.4;
    const moths = vr() < 0.35;
    const pal = H.pal.slice(); pal[5] = accent[1];
    const styleTex = await makeStyleTextures(ctx);      // (the two canvases, each in its own build step)
    const style = makeStyle(ctx, { tex: styleTex, palette: pal, runDensity: clamp(0.5 + 0.3 * density, 0.5, 0.92), honey: hour === 'golden' ? '#EFDBAB' : hour === 'day' ? '#F5E7BE' : hour === 'dawn' ? '#F6DDCE' : null, honeyX: hour === 'golden' ? 1 / 14 : -1 / 14, honeyK: hour === 'golden' ? 1 : 0.6,     // (polish 4) by day and at dawn too the flank toward the sun's patch is a warm milk, the other pearl
      sunX: hour === 'golden' ? -1 : 1,
      sun: { day: '#F5DA93', dawn: '#F7D9C4', golden: '#F5CF7E', night: '#EEF4FB' }[hour], sunK: hour === 'night' ? 0.8 : 1 });     // (polish 4) the printed sun: one pale gold (rose at dawn, moon-white at night)
    const U = style.uniforms, P = style.palette;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(H.lo);
    await ctx.yield();
    // ---- the course (the brief's points; the dome's centre is at z 200)
    // POLISH 1 (the outside eye): the walk hugs the fogged wall (3 m off it, the prints and geckos large); in the dome a low
    // pass over the pool's far side, then the climb wide of the trunk (15 m off: the crown is seen whole against the ruled
    // hull, never straight up into it), then down under the arch and into the nave at the height of the fern crowns
    // POLISH 6: the climb swings wide of the palm on the far side (17 m off the trunk at u 0.61, half way up), so the look up into
    // the crown has the palm whole (trunk, crown, rosette) and no fan at arm's length cut by the frame; then on up over the wing's
    // arch for the look down onto the pool
    const path = makePath([[3.0, 2.6, -10], [2.5, 2.6, 8], [0.5, 2.7, 24], [1.5, 2.8, 40], [1.8, 3.0, 58], [0.4, 3.8, 80], [-3, 4.5, 105], [1.0, 2.7, 136], [0.6, 3.6, 168],
      [-6.5, 4.6, 184], [-9.8, 3.5, 197], [-7.8, 3.7, 208.5], [2.5, 6.4, 216.5], [12, 10.5, 212.5],     /* (polish 6: low over the pads, two metres off the water) */ [17, 13.5, 202], [15, 18, 190.5], [7.5, 22.5, 184], [-2, 23.6, 185],
      [-6.6, 22, 196], [-6.2, 19.5, 208], [-3.2, 12.2, 227], [0.8, 4.6, 244], [0.9, 3.6, 257], [0, 6.6, 277], [0, 9, 291], [0, 9, APSE.z1]]);     // (polish 4) down under the arch to walk height: the nave first as an avenue from its floor, then up among the crowns
    await ctx.yield();
    // (polish 7) the wheel pane is the nave's one focal point: nothing stands in the cone from the lens to its middle, from the turn under the arch on
    const sightEyes = []; for (let u = 0.74; u < 0.955; u += 0.01) sightEyes.push(path.pointAt(u).clone());
    const blocksWheel = (x, y, z, sc) => {
      for (const E of sightEyes) {
        const dx = -E.x, dy = WHEEL.y - E.y, dz = APSE.z1 - E.z, dd = dx * dx + dy * dy + dz * dz, t = clamp(((x - E.x) * dx + (y - E.y) * dy + (z - E.z) * dz) / dd, 0, 1);
        if (t < 0.03) continue;
        if (Math.hypot(x - E.x - dx * t, y - E.y - dy * t, z - E.z - dz * t) < 0.9 + 2.9 * t + 0.4 * sc) return true;
      }
      return false;
    };
    const tick = [];                                // (dt, time, camera, u, lens) for every living thing
    const extra = [];                               // disposables not reachable from the scene
    const lens = new THREE.Vector3(0, 3, 0);
    const shared = (o) => ({ ...U, ...o });
    const mat = (vs, fs, uniforms, o = {}) => new THREE.ShaderMaterial({ vertexShader: vs, fragmentShader: fs, uniforms: shared(uniforms), ...o });

    // ---- sky: a tone darker than the building, so the glass house is the brightest thing in its landscape
    const cLo = new THREE.Color(H.lo), cHi = new THREE.Color(H.hi), cPatch = new THREE.Color(H.patch);
    const patchDir = new THREE.Vector3(-Math.sin(1.22), hour === 'night' ? 0.55 : hour === 'golden' ? 0.1 : 0.2, Math.cos(1.22)).normalize();
    if (hour === 'golden') patchDir.x *= -1;
    const sky = new THREE.Mesh(new THREE.SphereGeometry(900, 24, 12), new THREE.ShaderMaterial({ vertexShader: SKY_VERT, fragmentShader: SKY_FRAG,
      uniforms: { uLo: { value: cLo }, uHi: { value: cHi }, uPatch: { value: cPatch }, uPatchDir: { value: patchDir }, uTime: U.uTime }, side: THREE.BackSide, depthWrite: false, depthTest: false }));
    sky.renderOrder = -10; sky.frustumCulled = false; scene.add(sky);
    tick.push(() => sky.position.copy(lens));

    // ---- grounds: snow and terrace outside, the wing's grating and beds, the apse's paving
    const gFrag = groundFrag(style.glsl.common, style.glsl.dapple);
    const groundMat = (mode) => mat(GROUND_VERT, gFrag, { uMode: { value: mode }, uLo: { value: cLo }, uSnow: { value: H.snow } }, { side: THREE.DoubleSide });
    const snowGeo = new THREE.PlaneGeometry(2400, 2400, 1, 1); snowGeo.rotateX(-Math.PI / 2); snowGeo.translate(0, -0.06, 200);
    const snow = new THREE.Mesh(snowGeo, groundMat(0)); scene.add(snow);
    const R = DOME.R, shellAt = (x) => Math.sqrt(Math.max(1, R * R - x * x));
    {
      const a = makeAcc();
      accGrid(a, 8, 1, (i, j, o) => { const x = (i * 2 - 1) * WING.hw; o[0] = x; o[1] = 0; o[2] = j < 0.5 ? WING.z0 : DZ - shellAt(x) + 0.4; });
      const wf = new THREE.Mesh(accGeometry(a), groundMat(1)); scene.add(wf);
      const b = makeAcc();
      accGrid(b, 8, 1, (i, j, o) => { const x = (i * 2 - 1) * APSE.hw; o[0] = x; o[1] = 0; o[2] = j < 0.5 ? DZ + shellAt(x) - 0.4 : APSE.z1; });
      const af = new THREE.Mesh(accGeometry(b), groundMat(2)); scene.add(af);
    }
    await ctx.yield();

    // ---- the hero: the dome and its palm, in the same hand
    const hero = await buildHero(ctx, { style, detail, archIn: { hw: WING.hw, h: WING.spring + WING.rise, rise: WING.rise }, archOut: { hw: APSE.hw, h: APSE.spring + APSE.rise, rise: APSE.rise } });
    hero.object.position.set(0, 0, DZ);
    hero.object.updateMatrixWorld(true);
    scene.add(hero.object);
    await ctx.yield();
    const crown = hero.anchors.crown.clone().add(hero.object.position);
    // ================================================================ GLASS AND IRON: wing, gable, forcing house, apse
    const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
    const shellZ = (x, y) => Math.sqrt(Math.max(1, R * R - x * x - Math.max(0, y - DOME.drumH) ** 2));
    // cross-section of a vaulted hall: left foot, up the wall, over the vault, down to the right foot
    const profile = (hw, spring, rise, n) => {
      const pts = [];
      for (let j = 0; j < 3; j++) pts.push({ x: -hw, y: spring * j / 3, nx: -1, ny: 0 });
      for (let j = 0; j <= n; j++) { const a = Math.PI * (1 - j / n), c = Math.cos(a), s = Math.sin(a), l = Math.hypot(c / hw, s / rise) || 1;
        pts.push({ x: hw * c, y: spring + rise * s, nx: c / hw / l, ny: s / rise / l }); }
      for (let j = 2; j >= 0; j--) pts.push({ x: hw, y: spring * j / 3, nx: 1, ny: 0 });
      const mid = (pts.length - 1) / 2; let run = 0; pts[mid].s = 0;
      for (let i = mid + 1; i < pts.length; i++) { run += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y); pts[i].s = run; pts[pts.length - 1 - i].s = run; }
      return pts;
    };
    const topOf = (hw, spring, rise, x) => spring + rise * Math.sqrt(Math.max(0, 1 - (x / hw) * (x / hw)));
    const LW = 0.45;                                               // one lane of glass
    const hall = (prof, zA, zB) => {                                // zA, zB: (x, y) -> z of each end
      const a = makeAcc(), n = prof.length - 1;
      accGrid(a, n, 1, (i, j, o) => { const p = prof[Math.round(i * n)], z = j < 0.5 ? zA(p.x, p.y) : zB(p.x, p.y);
        o[0] = p.x; o[1] = p.y; o[2] = z; o[3] = p.nx; o[4] = p.ny; o[5] = 0; o[6] = z / LW; o[7] = p.s; });
      return accGeometry(a);
    };
    const wingProf = profile(WING.hw, WING.spring, WING.rise, 28), apseProf = profile(APSE.hw, APSE.spring, APSE.rise, 28);
    const glassIn = style.glass({ L: 19, bars: 0.75, lap: 1.3, side: THREE.DoubleSide });
    const glassInB = style.glass({ L: 26, bars: 0.75, lap: 1.3, side: THREE.DoubleSide, milk: 0.03 });
    const wingShell = new THREE.Mesh(hall(wingProf, () => WING.z0, (x, y) => DZ - shellZ(x, y) + 0.05), glassIn); scene.add(wingShell);
    const apseShell = new THREE.Mesh(hall(apseProf, (x, y) => DZ + shellZ(x, y) - 0.05, () => APSE.z1), glassInB); scene.add(apseShell);
    await ctx.yield();
    // ribs (riveted I-sections) and purlins, a hand's breadth inside the glass
    const ironA = style.iron({ rivet: 0.3 }), ironB = style.iron({});
    const ribOf = (prof) => style.ironSweep(prof.map((p) => V3(p.x - p.nx * 0.17, p.y - p.ny * 0.17, 0)), prof.map((p) => V3(p.nx, p.ny, 0)), style.iSection(0.3, 0.16));
    const m4 = new THREE.Matrix4();
    const ribRow = (prof, zs) => { const im = new THREE.InstancedMesh(ribOf(prof), ironA, zs.length);
      zs.forEach((z, i) => im.setMatrixAt(i, m4.makeTranslation(0, 0, z))); im.frustumCulled = false; scene.add(im); return im; };
    const wingRibZ = [], apseRibZ = [];
    for (let z = WING.z0 + 0.2; z < 166; z += 7.4) wingRibZ.push(z);
    for (let z = 238; z < APSE.z1; z += 7.6) apseRibZ.push(z);
    apseRibZ.push(APSE.z1 - 0.2);
    ribRow(wingProf, wingRibZ); ribRow(apseProf, apseRibZ);
    const bars = [];
    const purlins = (prof, zA, zB, every, sec) => {
      for (let i = 0; i < prof.length; i += every) { const p = prof[i], N = V3(p.nx, p.ny, 0);
        bars.push(style.ironSweep([V3(p.x - p.nx * 0.09, p.y - p.ny * 0.09, zA(p.x, p.y)), V3(p.x - p.nx * 0.09, p.y - p.ny * 0.09, zB(p.x, p.y))], [N, N], sec)); }
    };
    purlins(wingProf, () => WING.z0, (x, y) => DZ - shellZ(x, y) + 0.3, 4, style.boxSection(0.12, 0.1));
    purlins(apseProf, (x, y) => DZ + shellZ(x, y) - 0.3, () => APSE.z1, 4, style.boxSection(0.12, 0.1));
    await ctx.yield();

    // the gable of the fern wing at z 80, with its open doorway 10 m wide and 9 m tall
    const DOOR = { hw: 5, h: 9 };
    const gableGeo = (() => {
      const a = makeAcc(), top = (x) => topOf(WING.hw, WING.spring, WING.rise, x);
      const panel = (x0, x1, bottom) => accGrid(a, 8, 1, (i, j, o) => { const x = lerp(x0, x1, i), y = lerp(top(x), bottom, j);
        o[0] = x; o[1] = y; o[2] = WING.z0; o[3] = 0; o[4] = 0; o[5] = -1; o[6] = x / LW; o[7] = 12 - y; });
      panel(-WING.hw, -DOOR.hw, 0); panel(-DOOR.hw, DOOR.hw, DOOR.h); panel(DOOR.hw, WING.hw, 0);
      return accGeometry(a);
    })();
    const glassOut = style.glass({ outside: true, L: 12, bars: 0.75, lap: 1.3, reflect: 0.9 });
    const gableOut = new THREE.Mesh(gableGeo, glassOut); gableOut.renderOrder = 2; scene.add(gableOut);
    const gableIn = new THREE.Mesh(gableGeo, style.glass({ L: 12, bars: 0.75, lap: 1.3 })); scene.add(gableIn);
    // door frame, gable rim, cresting spears
    {
      const zf = WING.z0 - 0.12, N = V3(0, 0, -1), frame = [V3(-DOOR.hw, 0, zf), V3(-DOOR.hw, DOOR.h, zf), V3(DOOR.hw, DOOR.h, zf), V3(DOOR.hw, 0, zf)];
      for (let i = 0; i < 3; i++) bars.push(style.ironSweep([frame[i], frame[i + 1]], [N, N], style.boxSection(0.3, 0.34)));
      bars.push(style.ironSweep(wingProf.map((p) => V3(p.x, p.y, zf)), wingProf.map((p) => V3(p.nx, p.ny, 0)), style.boxSection(0.36, 0.4)));
      for (const x of [-9, 9]) bars.push(style.ironSweep([V3(x, 0, zf), V3(x, topOf(WING.hw, WING.spring, WING.rise, x), zf)], [N, N], style.boxSection(0.16, 0.16)));
      bars.push(style.ironSweep([V3(-WING.hw, WING.spring, zf), V3(-DOOR.hw, WING.spring, zf)], [N, N], style.boxSection(0.14, 0.14)), style.ironSweep([V3(DOOR.hw, WING.spring, zf), V3(WING.hw, WING.spring, zf)], [N, N], style.boxSection(0.14, 0.14)));
      for (let k = -12; k <= 12; k++) { const x = k * 1.02, y = topOf(WING.hw, WING.spring, WING.rise, x), h = k % 2 ? 0.7 : 1.15;
        bars.push(style.ironSweep([V3(x, y, zf), V3(x, y + h, zf)], [N, N], [[-0.03, -0.09, -0.03, 0.09], [0.03, -0.09, 0.03, 0.09]])); }
    }
    // the pair of sashes, swung open on their stays (they ease a little)
    const sashes = [];
    for (const sd of [-1, 1]) {
      const g = new THREE.Group(); g.position.set(sd * DOOR.hw, 0, WING.z0 - 0.15);
      const a = makeAcc();
      accWall(a, V3(0, DOOR.h, 0), V3(-sd, 0, 0), DOOR.hw, V3(0, -1, 0), DOOR.h, V3(0, 0, -1), LW, sd * 3.3);
      const pane = new THREE.Mesh(accGeometry(a), style.glass({ outside: true, L: 9, bars: 1.5, lap: 1.5, reflect: 0.9, side: THREE.DoubleSide })); pane.renderOrder = 2; g.add(pane);
      const N = V3(0, 0, -1), fr = [V3(0, 0, 0), V3(0, DOOR.h, 0), V3(-sd * DOOR.hw, DOOR.h, 0), V3(-sd * DOOR.hw, 0, 0), V3(0, 0, 0)], fb = [];
      for (let i = 0; i < 4; i++) fb.push(style.ironSweep([fr[i], fr[i + 1]], [N, N], style.boxSection(0.18, 0.2)));
      for (const y of [3, 6]) fb.push(style.ironSweep([V3(0, y, 0), V3(-sd * DOOR.hw, y, 0)], [N, N], style.boxSection(0.1, 0.1)));
      const fm = new THREE.Mesh(mergeGeometries(fb), ironB); for (const b of fb) b.dispose(); g.add(fm);
      g.rotation.y = -sd * 1.92; scene.add(g); sashes.push({ g, sd, a0: -sd * 1.92 });
    }
    tick.push((dt, time) => { for (const s of sashes) s.g.rotation.y = s.a0 + s.sd * 0.035 * Math.sin(time * 0.5 + s.sd); });
    await ctx.yield();
    // ---- leaf cards: every plant in the world is one of these, from the style's own leaf material
    const cardA = style.cardGeometry(-0.5, 0.5, 0, 1, 2, 2);        // atlas card (the shape is its middle half)
    const cardF = style.cardGeometry(-0.5, 0.5, 0, 1, 2, 7);        // a frond: it has to bend
    extra.push(cardA, cardF);
    const leafMesh = (list, material, order, geo = cardA) => {
      const g = style.leafAttr(geo.clone(), list.map((l) => l[1]));
      const im = new THREE.InstancedMesh(g, material, Math.max(1, list.length));
      list.forEach((l, i) => im.setMatrixAt(i, l[0])); im.count = list.length;
      im.frustumCulled = false; im.renderOrder = order; scene.add(im); return im;
    };
    const _X = new THREE.Vector3(), _Y = new THREE.Vector3(), _Z = new THREE.Vector3(), _S = new THREE.Vector3();
    // a card whose stalk is at pos, growing along Y, facing Z (made square to Y), sc metres square
    const cardAt = (pos, Yd, Zd, sc, out = new THREE.Matrix4()) => {
      _Y.copy(Yd).normalize(); _Z.copy(Zd).addScaledVector(_Y, -_Y.dot(Zd)); if (_Z.lengthSq() < 1e-6) _Z.set(_Y.z, _Y.x, _Y.y).cross(_Y); _Z.normalize();
      _X.crossVectors(_Y, _Z);
      return out.makeBasis(_X, _Y, _Z).scale(_S.set(sc, sc, sc)).setPosition(pos.x - _Y.x * sc * 0.25, pos.y - _Y.y * sc * 0.25, pos.z - _Y.z * sc * 0.25);
    };
    const outsideOnly = (m) => { m.uniforms.uInside = { value: 0 }; return m; };     // these never take the lens rule
    const C = ATLAS_CELLS;

    // ================================================================ THE FORCING HOUSE (lean-to, left of the terrace)
    const FH = { x: 7, z0: -35.2, z1: WING.z0, h: 7, bx: 12.6, bh: 10.2 }, FZ0 = 8;   // (polish 6: the house runs back past the entry and out of the frame; it used to begin in view as a free-standing screen. FZ0: where its first planting was laid out from)   // +X is screen-left on this course
    // the leaf that swings on its stalk behind the hand leaf and wipes a clear arc in the fog (stalk, reach; angle now, half swing)
    const wipeAt = new THREE.Vector4(FH.x, 1.25, 39.6, 2.3), wipeA = new THREE.Vector3(0, 0.66, 1);
    {
      const a = makeAcc(), len = FH.z1 - FH.z0, sl = Math.hypot(FH.x - FH.bx, FH.bh - FH.h);
      accWall(a, V3(FH.x, FH.h, FH.z0), V3(0, 0, 1), len, V3(0, -1, 0), FH.h, V3(-1, 0, 0), 0.4);                               // the fogged wall
      accWall(a, V3(FH.bx, FH.bh, FH.z0), V3(0, 0, 1), len, V3((FH.x - FH.bx) / sl, (FH.h - FH.bh) / sl, 0), sl, V3(-0.45, 0.89, 0), 0.4, 7.3);   // the roof
      accGrid(a, 1, 1, (i, j, o) => { const x = lerp(FH.bx, FH.x, i), top = lerp(FH.bh, FH.h, i);
        o[0] = x; o[1] = lerp(top, 0, j); o[2] = FH.z0; o[3] = 0; o[4] = 0; o[5] = -1; o[6] = x / 0.4; o[7] = FH.bh - o[1]; });           // its end
      const fh = new THREE.Mesh(accGeometry(a), style.glass({ outside: true, L: 7, bars: 0.667, lap: 1.4, reflect: 0.0, side: THREE.DoubleSide, milk: 0.02, wipe: wipeAt, wipeA }));
      fh.renderOrder = 2; scene.add(fh);
      const b = makeAcc();
      accWall(b, V3(FH.bx, FH.bh, FH.z0), V3(0, 0, 1), len, V3(0, -1, 0), FH.bh, V3(1, 0, 0), 0.4);
      accWall(b, V3(FH.bx, 0.02, FH.z0), V3(0, 0, 1), len, V3(-1, 0, 0), FH.bx - FH.x, V3(0, 1, 0), 0.4);
      const back = new THREE.Mesh(accGeometry(b), style.glass({ L: 0.01, bars: 0.667, lap: 1.4, side: THREE.DoubleSide })); scene.add(back);
      // iron: plinth, eave, ridge, a post every 2.4 m with a rafter over it
      const N = V3(-1, 0, 0), xo = FH.x - 0.08;
      bars.push(style.ironSweep([V3(xo, 0.25, FH.z0), V3(xo, 0.25, FH.z1)], [N, N], style.boxSection(0.3, 0.5)), style.ironSweep([V3(xo, FH.h, FH.z0), V3(xo, FH.h, FH.z1)], [N, N], style.boxSection(0.26, 0.22)),
        style.ironSweep([V3(FH.bx, FH.bh + 0.1, FH.z0), V3(FH.bx, FH.bh + 0.1, FH.z1)], [V3(0, 1, 0), V3(0, 1, 0)], style.boxSection(0.24, 0.3)),
        style.ironSweep([V3(xo, 3.5, FH.z0), V3(xo, 3.5, FH.z1)], [N, N], style.boxSection(0.08, 0.08)));
      for (let z = FH.z0; z <= FH.z1 + 0.01; z += 2.4) {
        bars.push(style.ironSweep([V3(xo, 0, z), V3(xo, FH.h, z)], [N, N], style.boxSection(0.14, 0.14)));
        bars.push(style.ironSweep([V3(xo, FH.h + 0.08, z), V3(FH.bx, FH.bh + 0.12, z)], [V3(-0.45, 0.89, 0), V3(-0.45, 0.89, 0)], style.boxSection(0.12, 0.1)));
      }
      for (let k = 0; k < 96; k++) { const z = FH.z0 + 0.6 + k * 1.2, h = k % 2 ? 0.5 : 0.85;
        bars.push(style.ironSweep([V3(FH.bx, FH.bh + 0.2, z), V3(FH.bx, FH.bh + 0.2 + h, z)], [N, N], [[-0.03, -0.08, -0.03, 0.08], [0.03, -0.08, 0.03, 0.08]])); }
    }
    await ctx.yield();
    // what grows in it: crisp leaves right behind the glass (a run uncovers them), ghosts further in (drawn on the fog)
    const pressed = [], fhCrisp = [], fhGhost = [];
    {
      const r2 = rng.fork ? rng.fork('fph-fh') : rng, cells = [C.lance, C.fatsia, C.heart, C.hand, C.lance, C.fatsia];
      const up = new THREE.Vector3(), pos = new THREE.Vector3(), face = V3(-1, 0, 0);
      const nC = Math.round(300 * (0.6 + 0.4 * detail));
      for (let i = 0; i < nC; i++) {
        const z = r2.range(FZ0 + 0.5, FH.z1 - 0.5), y = r2.range(0.3, 5.6) * (0.55 + 0.45 * Math.abs(Math.sin(z * 0.23 + 1.3))), a = r2.range(-1.0, 1.0);
        const clear = Math.abs(z - 33) < 3.3;                      // the hand leaf has the milk to itself
        if (!clear) fhCrisp.push([cardAt(pos.set(FH.x + r2.range(0.12, 0.5), y, z), up.set(0, Math.cos(a), Math.sin(a)), face, r2.range(1.2, 2.6)).clone(), [0.2, r2(), 0, r2.pick(cells)]]);
      }
      const nG = Math.round(120 * density * (0.6 + 0.4 * detail));
      for (let i = 0; i < nG; i++) {
        const z = r2.range(FZ0 + 1, FH.z1 - 1), dp = r2.range(1.2, 9), y = r2.range(0.8, 4.8) + (r2() < 0.25 ? 1.6 : 0), a = r2.range(-0.9, 0.9), cell = r2() < 0.3 ? C.frond : r2.pick(cells);
        fhGhost.push([cardAt(pos.set(FH.x + 0.6 + dp * 0.3, y, z), up.set(0, Math.cos(a), Math.sin(a)), face, r2.range(2.2, 4.4) * (cell === C.frond ? 1.5 : 1)).clone(), [dp, r2(), 0, cell]]);
      }
      // a thicket right behind the pane where the wiper swings, so its clear arc uncovers hard viridian
      for (let i = 0; i < 46; i++) { const a = r2.range(-0.85, 0.85), rr = r2.range(0.4, 2.4), la = r2.range(-1, 1);
        fhCrisp.push([cardAt(pos.set(FH.x + r2.range(0.1, 0.3), wipeAt.y + Math.cos(a) * rr - 0.3, wipeAt.z + Math.sin(a) * rr), up.set(0, Math.cos(la), Math.sin(la)), face, r2.range(1.1, 1.9)).clone(), [0.2, r2(), 0, r2.pick(cells)]]); }
      // the hand leaf, 2.2 m across, spread on the glass at eye height at z 34, and the geckos beside it
      pressed.push([cardAt(pos.set(FH.x + 0.04, 1.75, 33), up.set(0, 1, 0.06), face, 6.6).clone(), [-1, 0.37, 0, C.hand]]);
      // and a thicket hard behind the pane on both sides of it, so that a run beside the hand leaf uncovers a stripe of hard viridian
      const r3 = ctx.core.makeRng(ctx.core.hashSeed('fph-fh2:' + ctx.seed));     // its own stream: a fork would shift every draw after it
      for (let i = 0; i < 64; i++) { const rt = i % 2, z = rt ? r3.range(35.4, 36.2) : r3.range(28.9, 29.7), la = r3.range(-1, 1);   // (two narrow columns: the milk round the leaf and its geckos stays clean)
        fhCrisp.push([cardAt(pos.set(FH.x + r3.range(0.1, 0.4), rt ? r3.range(4.1, 6.3) : r3.range(0.3, 3.6), z), up.set(0, Math.cos(la), Math.sin(la)), face, r3.range(1.2, 2.0)).clone(), [0.2, r3(), 0, r3.pick(cells)]]); }
    }
    // ================================================================ POLISH 6: THE ARRIVAL, PLANTED
    // (the first three stills were chalk on chalk.) The forcing house is full, and it shows: (1) wherever its plants reach the pane
    // their last leaves lie flat on it, in clumps, in the house's darkest ink, from the plinth to above the eye, with the seed's
    // accent spread on the glass among them (contact, so sharp and full colour from the snow); (2) five casements stand open on
    // their stays and the planting leans out of them into the cold at arm's length: fronds, fatsia and the accent. The hand leaf and its geckos keep their clean stage (z 27 to 40). Its own rng: nothing else moves.
    const arrFlowers = [], spillFlowers = [], sashAcc = makeAcc(), CASEMENTS = [4.6, 13.5, 45.5, 66.5, 75];
    {
      const ra = makeRng(((ctx.seed | 0) * 151 + 8089) >>> 0), pos = new THREE.Vector3(), up = new THREE.Vector3(), Zd = new THREE.Vector3(), face = V3(-1, 0, 0);
      const cellsA = [C.fatsia, C.hand, C.heart, C.lance, C.fatsia, C.frond, C.heart];
      const onStage = (z) => z > 26.6 && z < 40.4, atSash = (z) => CASEMENTS.some((c) => Math.abs(z - c) < 1.9);
      for (let c = 0; c < 24; c++) {                                   // clumps of prints, one every 4.6 m
        const cz = -30 + c * 4.6 + ra.range(-1, 1), top = ra.range(3.4, 6.2), nL = 7 + Math.floor(ra() * 7);
        for (let k = 0; k < nL; k++) {
          const z = cz + ra.range(-1.9, 1.9), y = 0.35 + (top - 0.35) * Math.pow(ra(), 0.8), a = ra.range(-1.1, 1.1), cell = ra.pick(cellsA), sc = ra.range(1.5, 3.1) * (cell === C.frond ? 1.5 : 1), sd = ra();
          if (onStage(z) || (atSash(z) && y > 0.8 && y < 3.6) || (z > -1.2 && z < 2.8)) continue;     // (and none where the first still's left edge would cut it)
          pressed.push([cardAt(pos.set(FH.x + 0.045, y, z), up.set(0, Math.cos(a), Math.sin(a)), face, sc).clone(), [-1, sd, 0, cell]]);
        }
        const fz = cz + ra.range(-1.2, 1.2), fy = ra.range(1.5, 4.2), fs = ra.range(1.0, 1.5), fd = ra();
        if (c % 3 !== 1 && !onStage(fz) && !atSash(fz) && !(fz > 22.5 && fz < 27.6) && !(fz > 58.5 && fz < 63) && !(fz > -0.5 && fz < 2.6)) arrFlowers.push([cardAt(pos.set(FH.x + 0.03, fy, fz), up.set(0, 1, ra.range(-0.3, 0.3)), face, fs).clone(), [-1, fd, 0, C.flower]]);
      }
      await ctx.yield();
      // the open casements: an iron frame in the wall, the light swung out from its top rail, and what leans out
      const N = V3(-1, 0, 0), xo = FH.x - 0.1, Yd = new THREE.Vector3();
      for (const cz of CASEMENTS) {
        const z0 = cz - 1.2, z1 = cz + 1.2, y0 = 0.95, y1 = 3.45, fr = [V3(xo, y0, z0), V3(xo, y1, z0), V3(xo, y1, z1), V3(xo, y0, z1), V3(xo, y0, z0)];
        for (let i = 0; i < 4; i++) bars.push(style.ironSweep([fr[i], fr[i + 1]], [N, N], style.boxSection(0.16, 0.18)));
        const sw = 0.95 + 0.1 * ra(), D = V3(-Math.sin(sw), -Math.cos(sw), 0), h = 1.85;      // swung well out from the top rail: an awning of glass over the planting, which shows under it
        accWall(sashAcc, V3(xo - 0.06, y1, z0 + 0.06), V3(0, 0, 1), 2.28, D, h, V3(-Math.cos(sw), Math.sin(sw), 0), 0.4, cz * 0.7);
        const e = (z, t) => V3(xo - 0.06 + D.x * h * t, y1 + D.y * h * t, z);
        bars.push(style.ironSweep([e(z0 + 0.06, 0), e(z0 + 0.06, 1), e(z1 - 0.06, 1), e(z1 - 0.06, 0)], [N, N, N, N], style.boxSection(0.09, 0.09)));
        bars.push(style.ironSweep([e(z0 + 0.3, 0.96), V3(xo, y0 + 0.5, z0 + 0.3)], [V3(0, 0, 1), V3(0, 0, 1)], style.boxSection(0.035, 0.035)));     // the stay
        // the planting that leans out: a dark mass in the opening, fronds arching out and down, the accent out in front
        for (let k = 0; k < 26; k++) {
          const out = k < 12 ? ra.range(0.0, 0.5) : ra.range(0.4, 1.5), cell = k % 4 === 0 ? C.frond : ra.pick(cellsA), sc = (cell === C.frond ? ra.range(2.2, 3.2) : ra.range(1.0, 1.9)) * (k < 12 ? 1.15 : 1);
          pos.set(FH.x - 0.12 - out, y0 + 0.2 + ra() * (y1 - y0 - 0.9) * (1 - out * 0.3), cz + ra.range(-1.0, 1.0));
          Yd.set(-ra.range(0.5, 1.2), ra.range(-0.5, 0.75) - out * 0.25, ra.range(-0.9, 0.9));
          Zd.set(-0.55, 0.6, -0.6);
          fhCrisp.push([cardAt(pos, Yd, Zd, sc).clone(), [0, ra(), ra.range(0.1, 0.35), cell]]);
        }
        for (let k = 0; k < 4; k++) {
          pos.set(FH.x - ra.range(0.75, 1.45), y0 + ra.range(0.5, 1.9), cz + (k - 1.5) * 0.55 + ra.range(-0.2, 0.2));
          Zd.set(-0.8, 0.25, -0.55).normalize();
          spillFlowers.push([cardAt(pos, Yd.set(ra.range(-0.2, 0.2), 1, ra.range(-0.2, 0.2)), Zd, k === 1 ? 1.25 : ra.range(0.8, 1.05)).clone(), [0, ra(), -0.3, C.flower]]);
        }
      }
    }
    // ================================================================ POLISH 7: THE WALK, FURNISHED (plant cases in the snow)
    // (strangers: "a pale, bare exterior with blank green slabs and empty paving".) Down both sides of the swept walk stand glazed plant
    // cases, the gardeners' lanterns: an eight-sided cage of white iron on a snow-capped tub, a pointed roof with snow lying on it, and
    // inside, pressed to its lights, the house's own planting in its darkest ink with the seed's accent in flower (contact with a pane, so
    // sharp and full colour from the snow). They stand between the limes on the right and between the casements on the left, the nearest
    // three metres from the lens: a near, a middle and a far of green and scarlet all the way to the door. Their own rng: nothing else moves.
    const lanternStands = [];
    {
      const rl = makeRng(((ctx.seed | 0) * 113 + 4513) >>> 0), pos = new THREE.Vector3(), Yd = new THREE.Vector3(), Zd = new THREE.Vector3(), N = new THREE.Vector3();
      const cellsL = [C.fatsia, C.heart, C.lance, C.fatsia, C.frond, C.hand];
      const px = (z) => path.pointAt(path.nearestXZ(0, z).u).x;
      // [z, side (+1 = the forcing house's side, screen-left), metres off the course, scale]
      const spots = [[4.2, -1, 2.5, 1.0], [12.4, -1, 2.9, 1.1], [18.6, 1, 2.6, 0.95], [35.6, -1, 2.6, 1.0], [47.2, -1, 3.0, 1.15], [49.0, 1, 2.3, 0.95], [53.0, -1, 2.9, 1.0], [66.6, -1, 3.0, 1.1], [67.6, 1, 2.6, 1.0], [74.6, -1, 3.3, 1.0], [75.4, 1, 3.1, 1.05]];
      for (const [z, sd, off, k] of spots) {
        await ctx.yield();
        const x = px(z) + sd * off, r = 0.78 * k, y0 = 0.82, y1 = y0 + 1.9 * k, yt = y1 + 0.95 * k;
        lanternStands.push([x, z, r]);
        const ring = (rr, y, sec) => { const pts = [], nrm = []; for (let i = 0; i <= 8; i++) { const a = (i / 8) * TAU + Math.PI / 8; pts.push(V3(x + Math.cos(a) * rr, y, z + Math.sin(a) * rr)); nrm.push(V3(Math.cos(a), 0, Math.sin(a))); } return style.ironSweep(pts, nrm, sec); };
        bars.push(ring(r, y0, style.boxSection(0.09, 0.1)), ring(r, y1, style.boxSection(0.1, 0.12)), ring(r, (y0 + y1) / 2, style.boxSection(0.04, 0.04)));
        for (let i = 0; i < 8; i++) {
          const a = (i / 8) * TAU + Math.PI / 8, c = Math.cos(a), s2 = Math.sin(a); N.set(c, 0, s2);
          bars.push(style.ironSweep([V3(x + c * r, y0, z + s2 * r), V3(x + c * r, y1, z + s2 * r)], [N.clone(), N.clone()], style.boxSection(0.07, 0.07)));
          bars.push(style.ironSweep([V3(x + c * r, y1, z + s2 * r), V3(x + c * r * 0.5, y1 + (yt - y1) * 0.62, z + s2 * r * 0.5), V3(x, yt, z)], [N.clone(), N.clone(), N.clone()], style.boxSection(0.05, 0.05)));
        }
        bars.push(style.ironSweep([V3(x, yt - 0.05, z), V3(x, yt + 0.5 * k, z)], [V3(1, 0, 0), V3(1, 0, 0)], style.boxSection(0.05, 0.05)));     // the finial
        // the planting inside: a dark mass against the lights, a few leaves pushed out between the bars, the accent in front
        for (let i = 0; i < 22; i++) {
          const a = rl() * TAU, rr = r * (i < 14 ? rl.range(0.2, 0.8) : rl.range(0.85, 1.25)), cell = i % 6 === 0 ? C.frond : rl.pick(cellsL), sc = (cell === C.frond ? rl.range(1.5, 2.0) : rl.range(0.9, 1.5)) * k;
          pos.set(x + Math.cos(a) * rr, y0 + 0.1 + rl() * (y1 - y0) * 0.72, z + Math.sin(a) * rr);
          Yd.set(Math.cos(a) * rl.range(0.3, 1.0), rl.range(0.5, 1.0), Math.sin(a) * rl.range(0.3, 1.0));
          Zd.set(path.pointAt(0).x - x + rl.range(-1, 1), 0.5, -1).normalize();
          fhCrisp.push([cardAt(pos, Yd, Zd, sc).clone(), [0, rl(), rl.range(0.1, 0.3), cell]]);
        }
        const nf = 3 + (rl() < 0.5 ? 1 : 0);
        for (let i = 0; i < nf; i++) {
          const a = Math.atan2(-1, (px(z) - x) * 0.6) + (i - (nf - 1) / 2) * 0.75 + rl.range(-0.15, 0.15), rr = r * rl.range(0.7, 1.05);
          pos.set(x + Math.cos(a) * rr, y0 + 0.45 + (y1 - y0 - 0.9) * ((i * 0.618 + rl() * 0.3) % 1), z + Math.sin(a) * rr);
          Zd.set(Math.cos(a) * 0.6, 0.2, Math.sin(a) * 0.6 - 0.6).normalize();
          spillFlowers.push([cardAt(pos, Yd.set(rl.range(-0.2, 0.2), 1, rl.range(-0.2, 0.2)), Zd, (i === 0 ? 1.15 : rl.range(0.75, 1.0)) * k).clone(), [0, rl(), -0.3, C.flower]]);
        }
      }
    }
    await ctx.yield();
    {
      const sp = new THREE.Mesh(accGeometry(sashAcc), style.glass({ outside: true, L: 2.3, bars: 0.667, lap: 1.2, reflect: 0.9, side: THREE.DoubleSide, milk: 0.03 })); sp.renderOrder = 2; scene.add(sp);
      const af = leafMesh(arrFlowers, style.leaf({ core: true, afterGlass: true, scarlet: true, sway: 0.0, breath: 0.02 }), 3.1);
      const sf = leafMesh(spillFlowers, outsideOnly(style.leaf({ core: true, scarlet: true, sway: 0.04, breath: 0.03 })), 0);
      tick.push(() => { const v = lens.z < 110; sp.visible = v; af.visible = v; sf.visible = v; });
    }
    await ctx.yield();
    leafMesh(fhCrisp, outsideOnly(style.leaf({ core: true, sway: 0.03 })), 0);
    // the hand leaf and its two geckos have the milk to themselves: no dark ghost within the stage (pale ones, far from the pane, stay)
    const fhGhostKept = fhGhost.filter((l) => !(Math.abs(l[0].elements[14] - 33.5) < 6.2 && l[1][0] < 5));
    leafMesh(fhGhostKept, outsideOnly(style.leaf({ sway: 0.06, ghost: 0.85 })), 3);
    await ctx.yield();
    // ---- geckos, stuck to the inside of panes: from the snow the sharpest things on the wall (every toe pad printed)
    const geckoSlots = [];
    {
      const r2 = rng.fork ? rng.fork('fph-gecko') : rng, pos = new THREE.Vector3(), up = new THREE.Vector3();
      const gecko = (p, face, ang, sc) => { const t = V3(0, 1, 0).cross(face).normalize();
        up.set(0, Math.cos(ang), 0).addScaledVector(t, Math.sin(ang));
        pressed.push([cardAt(pos.copy(p), up, face, sc).clone(), [-1, r2(), 0, C.gecko]]); return pressed.length - 1; };
      const fx = V3(-1, 0, 0);
      geckoSlots.push(gecko(V3(FH.x + 0.04, 4.3, 30.4), fx, -0.3, 1.95));             // the two beside the hand leaf: above-left of it,
      geckoSlots.push(gecko(V3(FH.x + 0.04, 2.9, 36.5), fx, 2.6, 2.4));           // and below-right (this one walks)
      for (const z of [14, 21.5, 47, 60, 70]) gecko(V3(FH.x + 0.04, r2.range(1.2, 5.6), z + r2.range(-1.5, 1.5)), fx, r2.range(-3, 3), r2.range(1.0, 1.4));
      for (const x of [-10.5, -7.2, 8.0]) gecko(V3(x, r2.range(2, 7), WING.z0 - 0.04), V3(0, 0, -1), r2.range(-3, 3), 1.3);
      for (const [x, y] of [[-8.6, 16.5], [8.9, 8.2], [-9.4, 6.0], [7.9, 18.2]]) geckoSlots.push(gecko(V3(x, y, APSE.z1 - 0.06), V3(0, 0, -1), r2.range(-3, 3), 1.5));
      // and four on the apse's side walls, by its mouth and half way down: they walk
      for (const [sd, y, z, a] of [[1, 7.6, 241, 0.4], [-1, 6.2, 246, -0.5], [1, 9.4, 277, 2.6], [-1, 8.6, 284, 0.9]]) geckoSlots.push(gecko(V3(sd * (APSE.hw - 0.06), y, z), V3(-sd, 0, 0), a, 1.7));
      // one beside each great hand leaf by the wheel (they keep still: the prints are the stage)
      for (const [sd, y, z, a] of [[1, 8.9, 299.4, 0.3], [-1, 10.6, 289.4, -2.85], [1, 10.4, 286.4, 2.8], [-1, 8.6, 282.6, -0.35]]) gecko(V3(sd * (APSE.hw - 0.06), y, z), V3(-sd, 0, 0), a, 2.5);
    }
    const wiperSlot = pressed.length;
    pressed.push([new THREE.Matrix4(), [-1, 0.61, 0, C.heart]]);
    const pressedMesh = leafMesh(pressed, style.leaf({ core: true, afterGlass: true, sway: 0.0 }), 3);
    // (n8) THE WALL'S OWN BARS AND LAPS OVER ITS PRESSED LEAVES (brief: "pressed leaves are opaque crisp cards 3 cm inside the glass"; "glazing bars
    // every 60 cm"). The forcing house wall is drawn at order 2 with its bars painted in its own shader, and everything pressed on it is drawn after
    // it (orders 3 and 3.1) from 0.03 to 0.045 m inside the glass, so a print covered the bars of the very pane it lies behind. One flat sheet on the
    // wall's own rectangle (accWall as the wall is called above), its corner 0.005 m outside the glass (a plain number, short of the posts' back face
    // at 0.01), its material the pane's own with the wall's options written again and the define BARS_ONLY: it draws the pane's own laps and bars and
    // nothing else, at order 3.15 (after the last print at 3.1, before the roof's snow at 3.2). So the wall's bars run on unbroken across every
    // print, ghost, gecko and the hand leaf, by the wall's own 60 cm law; none is drawn, widened, darkened or left out for a leaf, a gecko or a view.
    // (n8b) This sheet is part of the wall's glass: it may lie over the wall's own prints and over nothing that stands before the wall, from any eye,
    // at any moment. No outside pane and no butterfly writes depth, so each thing that stands before the wall writes the wall's depth itself, after
    // the last print and before this sheet: see WHAT STANDS BEFORE THE FORCING HOUSE WALL below (after the butterflies, the last of them to be
    // made). No stream; never hidden by a key.
    {
      const c = makeAcc();
      accWall(c, V3(FH.x - 0.005, FH.h, FH.z0), V3(0, 0, 1), FH.z1 - FH.z0, V3(0, -1, 0), FH.h, V3(-1, 0, 0), 0.4);
      const barsMat = style.glass({ outside: true, L: 7, bars: 0.667, lap: 1.4, reflect: 0.0, side: THREE.DoubleSide, milk: 0.02, wipe: wipeAt, wipeA });
      barsMat.defines = { BARS_ONLY: 1 };
      const sheet = new THREE.Mesh(accGeometry(c), barsMat); sheet.name = 'fph-wall-bars'; sheet.renderOrder = 3.15;
      scene.add(sheet);
    }
    {
      const pos = V3(wipeAt.x + 0.05, wipeAt.y, wipeAt.z), up = new THREE.Vector3(), face = V3(-1, 0, 0), mm = new THREE.Matrix4();
      tick.push((dt, time) => {
        const a = wipeA.y * 0.94 * Math.sin(time * 0.9 + 0.6 * Math.sin(time * 0.37));
        wipeA.x = a;
        pressedMesh.setMatrixAt(wiperSlot, cardAt(pos, up.set(0, Math.cos(a), Math.sin(a)), face, wipeAt.w * 1.9, mm));
        pressedMesh.instanceMatrix.needsUpdate = true;
      });
    }
    {
      // geckos walk six steps along the pane, wait, and walk back: stepped, small, never a strobe
      const mm = new THREE.Matrix4(), tr = new THREE.Matrix4(), wig = new THREE.Matrix4(), rot = new THREE.Matrix4();
      const walkers = [1, 2, 4, 6, 7, 8, 9].filter((k) => k < geckoSlots.length).map((k, n) => { const idx = geckoSlots[k], base = pressed[idx][0].clone();
        return { idx, base, dir: V3(0, 1, 0).applyMatrix4(rot.extractRotation(base)).normalize(), ph: n * 3.7, per: 12 + n * 1.3 }; });
      tick.push((dt, time) => {
        for (const w of walkers) {
          const cyc = ((time + w.ph) % w.per) / w.per, ph = cyc < 0.5 ? cyc * 2 : 2 - cyc * 2;            // out and back
          const st = clamp(ph * 8.5 - 1.2, 0, 6), k = Math.floor(st), f = smoothstep(0, 0.45, st - k), d = (k + f) * 0.2;
          wig.makeRotationZ(Math.sin((k + f) * Math.PI) * 0.16);
          mm.copy(w.base).multiply(wig).premultiply(tr.makeTranslation(w.dir.x * d, w.dir.y * d, w.dir.z * d));
          pressedMesh.setMatrixAt(w.idx, mm);
        }
        pressedMesh.instanceMatrix.needsUpdate = true;
      });
    }

    // ================================================================ THE APSE'S FLAT GABLE AND THE WHEEL PANE
    {
      const a = makeAcc(), cy = WHEEL.y, inside = (x, y) => y > 0 && Math.abs(x) < APSE.hw && (y < APSE.spring || x * x + (y - APSE.spring) ** 2 < APSE.rise * APSE.rise);
      const reach = (c, s) => { let lo = 0, hi = 30; for (let k = 0; k < 22; k++) { const m = (lo + hi) / 2; if (inside(c * m, cy + s * m)) lo = m; else hi = m; } return lo; };
      accGrid(a, 96, 2, (i, j, o) => { const th = i * TAU, c = Math.cos(th), s = Math.sin(th), r = lerp(WHEEL.r + 0.06, reach(c, s), j);
        o[0] = c * r; o[1] = cy + s * r; o[2] = APSE.z1 + 0.06; o[3] = 0; o[4] = 0; o[5] = -1; o[6] = o[0] / LW; o[7] = 22 - o[1]; });
      const wall = new THREE.Mesh(accGeometry(a), style.glass({ L: 9, bars: 0.75, lap: 1.3, side: THREE.DoubleSide, milk: 0.05 })); scene.add(wall);
      // the wheel: two iron rings, sixteen short spokes, and the smears a cloth left round it
      const ring = (r, sec, z) => { const pts = [], nrm = []; for (let i = 0; i <= 96; i++) { const t = (i / 96) * TAU; pts.push(V3(Math.cos(t) * r, cy + Math.sin(t) * r, z)); nrm.push(V3(Math.cos(t), Math.sin(t), 0)); } return style.ironSweep(pts, nrm, sec); };
      bars.push(ring(WHEEL.r + 0.16, style.boxSection(0.3, 0.3), APSE.z1 - 0.1), ring(WHEEL.r + 1.0, style.boxSection(0.12, 0.14), APSE.z1 - 0.02));
      for (let k = 0; k < 16; k++) { const t = (k + 0.5) / 16 * TAU, c = Math.cos(t), s = Math.sin(t), N = V3(0, 0, -1);
        bars.push(style.ironSweep([V3(c * (WHEEL.r + 0.3), cy + s * (WHEEL.r + 0.3), APSE.z1 - 0.02), V3(c * (WHEEL.r + 1.0), cy + s * (WHEEL.r + 1.0), APSE.z1 - 0.02)], [N, N], style.boxSection(0.1, 0.1))); }
      const sg = new THREE.RingGeometry(WHEEL.r + 0.3, WHEEL.r + 4.2, 96, 1); sg.translate(0, cy, 0);
      const smear = new THREE.Mesh(sg, mat(/* glsl */`varying vec2 vP; varying vec3 vWp;
        void main(){ vP = position.xy - vec2(0., ${cy.toFixed(1)}); vec4 wp = modelMatrix * vec4(position, 1.); vWp = wp.xyz; gl_Position = projectionMatrix * viewMatrix * wp; }`,
        style.glsl.common + /* glsl */`uniform float uSyringe; varying vec2 vP; varying vec3 vWp;
        float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
          return mix(mix(h21(i), h21(i + vec2(1., 0.)), f.x), mix(h21(i + vec2(0., 1.)), h21(i + vec2(1., 1.)), f.x), f.y); }
        void main(){
          float r = length(vP); vec2 d = vP / max(r, 1e-3);
          float k = floor((r - 7.3) / 0.62), fr = fract((r - 7.3) / 0.62);
          float st = smoothstep(0.44, 0.58, vn(d * (1.25 + 0.16 * k) + k * 5.1)) * smoothstep(0., 0.14, fr) * smoothstep(1., 0.84, fr);   // long arcs, one cloth wide
          st *= 1. - smoothstep(8.0, 11.2, r);
          vec3 dir = vWp - uLens; dir /= max(length(dir), 1e-4);
          gl_FragColor = vec4(trackSky(0.4 + 0.028 * vP.y), st * 0.8 * (1. - uSyringe));
        }`, {}, { transparent: true, depthWrite: false, side: THREE.DoubleSide }));
      smear.position.set(0, 0, APSE.z1 + 0.0); smear.rotation.y = Math.PI; smear.renderOrder = 4; scene.add(smear);
    }
    await ctx.yield();
    // ================================================================ THE FERN WING: forty tree ferns over the grating
    // a tube along pts with radii rad; uv = (turns, metres), aPane = metres to the nearest pane
    const tube = (pts, rad, sides, paneOf) => {
      const a = makeAcc(), ap = [], n = pts.length, T = new THREE.Vector3(), Nn = new THREE.Vector3(1, 0, 0), B = new THREE.Vector3();
      let run = 0;
      for (let i = 0; i < n; i++) {
        T.subVectors(pts[Math.min(n - 1, i + 1)], pts[Math.max(0, i - 1)]).normalize();
        B.crossVectors(T, Nn); if (B.lengthSq() < 1e-6) B.set(0, 0, 1); B.normalize(); Nn.crossVectors(B, T).normalize();
        if (i > 0) run += pts[i].distanceTo(pts[i - 1]);
        for (let k = 0; k <= sides; k++) { const t = (k / sides) * TAU, c = Math.cos(t), s = Math.sin(t), nx = Nn.x * c + B.x * s, ny = Nn.y * c + B.y * s, nz = Nn.z * c + B.z * s;
          a.pos.push(pts[i].x + nx * rad[i], pts[i].y + ny * rad[i], pts[i].z + nz * rad[i]); a.nor.push(nx, ny, nz); a.uv.push(k / sides, run); ap.push(paneOf(pts[i])); }
        if (i < n - 1) for (let k = 0; k < sides; k++) { const p = i * (sides + 1) + k, q = p + sides + 1; a.idx.push(p, p + 1, q, p + 1, q + 1, q); }
      }
      const g = accGeometry(a); g.setAttribute('aPane', new THREE.Float32BufferAttribute(ap, 1)); return g;
    };
    const wingPane = (p) => Math.max(0.3, Math.min(WING.hw - Math.abs(p.x), p.z - WING.z0 + (Math.abs(p.x) < DOOR.hw ? 0 : 0)));
    const apsePane = (p) => Math.max(0.3, Math.min(APSE.hw - Math.abs(p.x), APSE.z1 - p.z));
    const ferns = [], fronds = [], pinnae = [], cuePinnae = [], apsePinnae = [], apseLow = [], ribs = [], floorLeaves = [], fernTrunks = [];
    const wingPinnae = pinnae;
    const Tn = new THREE.Vector3(), Sd = new THREE.Vector3(), Nf = new THREE.Vector3(), Pd = new THREE.Vector3();
    {
      const r2 = rng.fork ? rng.fork('fph-ferns') : rng, pos = new THREE.Vector3(), Yd = new THREE.Vector3(), up = V3(0, 1, 0);
      const nFrond = Math.round(12 * (0.75 + 0.25 * detail));
      // rows either side of the grating, the near rows tall enough to arch over the lens
      for (let i = 0, tries = 0; i < 40 && tries < 600; tries++) {
        const near = i < 22, z = WING.z0 + 3 + r2() * 84, sd = r2() < 0.5 ? -1 : 1;
        const pn = path.nearestXZ(0, z), px = path.pointAt(pn.u).x;
        const x = near ? px + sd * r2.range(4.2, 6.2) : sd * r2.range(7.5, 11.6);
        if (Math.abs(x) > 11.8) continue;
        let ok = true; for (const f of ferns) if ((f.x - x) ** 2 + (f.z - z) ** 2 < (near ? 20 : 9)) { ok = false; break; }
        if (!ok) continue;
        const h = near ? pn.y + r2.range(1.6, 2.8) : r2.range(4, 6);
        ferns.push({ x, z, h, near }); i++;
        grow(x, z, h, near, wingPane);
        if (i % 3 === 0) await ctx.yield();
      }
      function grow(x, z, h, near, wingPane, pinnae = wingPinnae, lenK = 1) {
        const lean = r2.range(-0.4, 0.4), pts = [], rad = [];
        for (let j = 0; j <= 6; j++) { const t = j / 6; pts.push(V3(x + lean * t * t, h * t, z + lean * 0.5 * t)); rad.push(0.24 * (1 + 0.5 * Math.exp(-t * 6) + 0.25 * Math.exp(-(1 - t) * (1 - t) * 40))); }
        fernTrunks.push(tube(pts, rad, 8, wingPane));
        const top = pts[6], a0 = r2() * TAU;
        for (let k = 0; k < nFrond; k++) {
          const az = a0 + (k / nFrond) * TAU + r2.range(-0.2, 0.2), el = r2.range(0.25, 0.75), len = r2.range(7.2, 9.2) * (k % 3 === 0 ? 0.7 : 1) * lenK;
          Yd.set(Math.cos(az) * Math.cos(el), Math.sin(el), Math.sin(az) * Math.cos(el));
          if (!near) {                                             // far rows: one card a frond (never in contact)
            const mid = pos.copy(top).addScaledVector(Yd, len * 0.25);
            fronds.push([cardAt(top, Yd, up, len).clone(), [wingPane(mid), r2(), r2.range(0.42, 0.7), C.frond]]);
            continue;
          }
          // near rows: a bent rib with six pairs of pinnae and a tip, each its own card, so that
          // the wave of sharpness travels along the frond with the lens
          const L = len * 0.5, dr = r2.range(1.5, 2.7) * (L / 4), rib = [], rr = [];
          for (let j = 0; j <= 6; j++) {
            const t = 0.1 + 0.14 * j, pj = V3(top.x + Yd.x * L * t, top.y + Yd.y * L * t - dr * t * t, top.z + Yd.z * L * t);
            rib.push(pj); rr.push(lerp(0.045, 0.012, j / 6));
            Tn.set(Yd.x * L, Yd.y * L - 2 * dr * t, Yd.z * L).normalize();
            Sd.crossVectors(Tn, up).normalize(); Nf.crossVectors(Sd, Tn).normalize();
            if (j === 6) { pinnae.push([cardAt(pj, Tn, Nf, L * 0.62).clone(), [wingPane(pj), r2(), 0.25, C.frond]]); break; }
            const lp = (0.55 + 1.05 * Math.pow(Math.sin(Math.PI * (0.1 + 0.8 * t)), 0.8)) * (L / 4);
            for (const s2 of [-1, 1]) { Pd.copy(Sd).multiplyScalar(s2 * 0.93).addScaledVector(Tn, 0.36);
              pinnae.push([cardAt(pj, Pd, Nf, lp * 2.15).clone(), [wingPane(pj), r2(), r2.range(0.15, 0.4), C.frond]]); }
          }
          ribs.push(tube([top.clone(), ...rib], [0.05, ...rr], 3, wingPane));
        }
      }
      // the apse: tree ferns either side of the walk, their crowns under the gutter line, a few metres below the lens
      for (let i = 0; i < 14; i++) {
        const sd = i % 2 ? -1 : 1, z = 241 + i * 4.6 + r2.range(-1.2, 1.2);
        const nT = fernTrunks.length, nP = pinnae.length, nR = ribs.length;
        grow(sd * r2.range(4.6, 7.2), z, r2.range(6.6, 8.4), true, apsePane, i < 5 ? apseLow : pinnae);
        if (i >= 5) { fernTrunks.length = nT; pinnae.length = nP; ribs.length = nR; }   // (the far ones give way to the tall ferns below; the draws stay, so nothing else moves)
        if (i % 3 === 0) await ctx.yield();
      }
      // fronds leaning out of the open doorway: in contact with the sash line, so sharp and dark from the snow
      for (let k = 0; k < 14; k++) {
        const sd = k % 2 ? -1 : 1, top = V3(sd * r2.range(2.6, 4.9), r2.range(3.5, 8.2), WING.z0 + r2.range(-0.3, 1.2)), az = -Math.PI / 2 + sd * r2.range(-0.3, 1.0), el = r2.range(-0.1, 0.6);
        Yd.set(Math.cos(az) * Math.cos(el) * -sd * 0.6, Math.sin(el), -Math.abs(Math.sin(az) * Math.cos(el))).normalize();
        fronds.push([cardAt(top, Yd, up, r2.range(5.5, 8)).clone(), [0, r2(), r2.range(0.4, 0.7), C.frond]]);
      }
      // the floor of fatsia and aspidistra under them
      const nFloor = Math.round(760 * density * (0.5 + 0.5 * detail)), cells = [C.fatsia, C.lance, C.fatsia, C.lance, C.heart, C.hand];
      for (let i = 0; i < nFloor; i++) {
        const z = WING.z0 + 1 + r2() * 90, sd = r2() < 0.5 ? -1 : 1, x = sd * r2.range(1.9, 12.6);
        if (z > DZ - shellZ(x, 2) - 0.5) continue;
        const cell = r2.pick(cells), tall = cell === C.lance ? r2.range(1.8, 3.4) : r2.range(1.3, 2.6), az = r2() * TAU, el = r2.range(0.8, 1.42);
        Yd.set(Math.cos(az) * Math.cos(el), Math.sin(el), Math.sin(az) * Math.cos(el));
        pos.set(x, r2.range(0.3, 1.9) + (r2() < 0.2 ? r2.range(0.5, 1.6) : 0), z);
        floorLeaves.push([cardAt(pos, Yd, i % 3 ? Pd.set(-Math.sin(az), 0.3, Math.cos(az)) : up, tall).clone(), [wingPane(pos), r2(), r2.range(0.1, 0.5), cell]]);
        if (i % 300 === 299) await ctx.yield();
      }
      // the apse's last sixty metres: eighteen slender tree ferns hard by the walk, their crowns just under the gutter line, so
      // that the nearest fronds pass an arm's length under the lens, every pinna sharp, in the lower corners of the frame
      for (let i = 0; i < 14; i++) {
        const sd = i % 2 ? -1 : 1, z = 262 + i * 2.75 + r2.range(-0.6, 0.6);
        grow(sd * r2.range(4.9, 5.5), z, r2.range(8.6, 9.2) - 0.9 - 0.33 * Math.max(0, z - 285), true, apsePane, apsePinnae, 0.72);   // (the last few a little lower: the wheel keeps its rim)
        if (i % 2 === 0) await ctx.yield();
      }
      // THE WAVE OF FOCUS, on cue: an avenue of slender tree ferns hard by the grating, alternate sides, one every 3.5 m of
      // the course. Each throws two fronds over the walk, drooping to an arm's length above the lens, so that at every
      // moment in the wing a whole frond or two is in contact (full viridian, deep rib, every pinna) crossing the soft
      // pale crowns behind, and goes soft again as it passes. Its own rng: nothing else in the world moves.
      {
        const rc = makeRng(((ctx.seed | 0) * 31 + 977) >>> 0), T = new THREE.Vector3(), Rv = new THREE.Vector3(), top = new THREE.Vector3();
        const frond = (top, Yd, L, dr, paneOf, list) => {
          const rib = [], rr = [];
          for (let j = 0; j <= 6; j++) {
            const t = 0.1 + 0.14 * j, pj = V3(top.x + Yd.x * L * t, top.y + Yd.y * L * t - dr * t * t, top.z + Yd.z * L * t);
            rib.push(pj); rr.push(lerp(0.05, 0.014, j / 6));
            Tn.set(Yd.x * L, Yd.y * L - 2 * dr * t, Yd.z * L).normalize();
            Sd.crossVectors(Tn, up); if (Sd.lengthSq() < 1e-6) Sd.set(1, 0, 0); Sd.normalize(); Nf.crossVectors(Sd, Tn).normalize();
            if (j === 6) { list.push([cardAt(pj, Tn, Nf, L * 0.6).clone(), [paneOf(pj), rc(), 0.25, C.frond]]); break; }
            const lp = (0.55 + 1.05 * Math.pow(Math.sin(Math.PI * (0.1 + 0.8 * t)), 0.8)) * (L / 4);
            for (const s2 of [-1, 1]) { Pd.copy(Sd).multiplyScalar(s2 * 0.93).addScaledVector(Tn, 0.36); Pd.y -= 0.18;
              list.push([cardAt(pj, Pd, Nf, lp * 2.15).clone(), [paneOf(pj), rc(), rc.range(0.15, 0.4), C.frond]]); }
          }
          ribs.push(tube([top.clone(), ...rib], [0.055, ...rr], 3, paneOf));
        };
        // one cue fern beside the course at u: sd = side, drop = metres its over-the-walk fronds' tips hang above (+) or below (-)
        // the course, rise = its head above (+) or below (-) the course, inK = how far across the walk they reach (1 = to the middle)
        const cueFern = (u, sd, paneOf, rise, drop, inK, el0) => {
          const P = path.pointAt(u);
          T.subVectors(path.pointAt(Math.min(1, u + 0.004)), P).setY(0).normalize(); Rv.set(-T.z, 0, T.x);
          const lat = rc.range(3.3, 3.9), h = P.y + rise + rc.range(-0.3, 0.3), bx = P.x + Rv.x * sd * lat, bz = P.z + Rv.z * sd * lat, lean = rc.range(-0.25, 0.25);
          const pts = [], rad = [];
          for (let j = 0; j <= 6; j++) { const t = j / 6; pts.push(V3(bx + lean * (1 - t) * (1 - t), h * t, bz + lean * 0.6 * (1 - t))); rad.push(0.17 * (1 + 0.5 * Math.exp(-t * 6) + 0.3 * Math.exp(-(1 - t) * (1 - t) * 40))); }
          fernTrunks.push(tube(pts, rad, 7, paneOf));
          top.set(bx, h, bz);
          // two over the walk (one leaning back toward the oncoming lens, one on ahead), one away from it
          for (const [along, inward, el, Lk] of [[-0.62, 1, el0, inK], [0.5, 1, el0 - 0.06, 0.92 * inK], [rc.range(-0.8, 0.8), -0.8, 0.5, 0.8]]) {
            const L = lat * 1.22 * Lk * rc.range(0.95, 1.08) * (inward > 0 ? 1 : 1.1), ca = Math.cos(el);
            Yd.set((-Rv.x * sd * inward + T.x * along) * ca, 0, (-Rv.z * sd * inward + T.z * along) * ca);
            const hl = Math.hypot(Yd.x, Yd.z) / ca; Yd.x /= hl; Yd.z /= hl; Yd.y = Math.sin(el);
            const tipY = P.y + drop + rc.range(-0.2, 0.2), dr = inward > 0 ? Math.max(0.6, (h + Yd.y * L * 0.94 - tipY) / 0.8836) : rc.range(1.2, 2.0) * (L / 4);
            frond(top, Yd, L, dr, paneOf, cuePinnae);
          }
        };
        // the wing: heads 3 m over the course, tips drooping to 1.7 m above it, right across the walk (the last stands at u 0.37: the
        // way out into the dome, with its one frond across the reveal, is left as it was)
        for (let i = 0; i < 16; i++) { cueFern(0.222 + i * 0.0125, i % 2 ? -1 : 1, wingPane, 3.0, 1.7, 1, 0.3); if (i % 3 === 2) await ctx.yield(); }
        // the apse: heads just under the gutter line, their fronds lifting toward the lens and falling away an arm's length below
        // and beside it, so every frame of the nave has whole crisp fronds in its lower corners, the last of them beside the wheel
        for (let i = 0; i < 20; i++) { const hi = i % 2 === 0 && i < 15;
          cueFern(0.812 + i * 0.0088, (i >> 1) % 2 ? 1 : -1, apsePane, hi ? 2.9 : -1.9, hi ? 1.55 : -1.5, (hi ? 1.0 : 0.74) * 0.58, hi ? 0.3 : 0.62); if (i % 3 === 2) await ctx.yield(); }     // (polish 4: the first nine keep to their own side, so the avenue's middle is open down to the wheel pane)
      }
    }
    await ctx.yield();
    { const tg = mergeGeometries(fernTrunks); for (const g of fernTrunks) g.dispose();
      const tm = new THREE.Mesh(tg, style.stem({ scales: 7, far: 0.75, reach: 0.45 })); tm.renderOrder = 1; scene.add(tm); }
    await ctx.yield();
    // the nave is flown at the height of its fern crowns: no card lies in the lens's own corridor there
    for (const [list, r] of [[apsePinnae, 1.5], [cuePinnae, 1.25], [pinnae, 1.5], [apseLow, 1.5]]) {
      let w = 0;
      for (let i = 0; i < list.length; i++) { const e = list[i][0].elements; if (!(e[14] > 226 && (path.distanceTo(e[12], e[13], e[14]) < r || blocksWheel(e[12], e[13], e[14], Math.hypot(e[0], e[1], e[2]))))) list[w++] = list[i]; if (i % 400 === 399) await ctx.yield(); }
      list.length = w;
      await ctx.yield();
    }
    const frondCore = leafMesh(fronds, style.leaf({ core: true, sway: 0.05, centre: [0, 0.5], reach: 0.5, coreS: 0.5, softFrom: 0.45 }), 0, cardF);
    await ctx.yield();
    const frondSoft = leafMesh(fronds, style.leaf({ sway: 0.05, centre: [0, 0.5], ghost: 0.8, reach: 0.5, coreS: 0.5, softFrom: 0.45, fade: 1 }), 2.5, cardF);     // (the far rows' one-card fronds are a pale presence behind the avenue, never a heavy grey shape)
    await ctx.yield();
    leafMesh(pinnae, style.leaf({ core: true, sway: 0.035, reach: 0.4, coreS: 0.5, softFrom: 0.45 }), 0);     // (the crowns overhead come into contact a little sooner: the wave is seen)
    leafMesh(pinnae, style.leaf({ sway: 0.035, reach: 0.4, coreS: 0.5, softFrom: 0.45, fade: 1 }), 2.5);
    await ctx.yield();
    leafMesh(cuePinnae, style.leaf({ core: true, sway: 0.04, reach: 0.4, coreS: 0.5, softFrom: 0.45 }), 0);
    leafMesh(cuePinnae, style.leaf({ sway: 0.04, reach: 0.4, fade: 1, coreS: 0.5, softFrom: 0.45 }), 2.5);
    await ctx.yield();
    leafMesh(apsePinnae, style.leaf({ core: true, sway: 0.035, reach: 0.14, coreS: 0.5, softFrom: 0.45 }), 0);      // in the apse's plain light contact carries further: whole crowns come sharp, never one card
    leafMesh(apsePinnae, style.leaf({ sway: 0.035, reach: 0.14, fade: 1, coreS: 0.5, softFrom: 0.45 }), 2.5);
    // (seen from above and far off, soft pinnae thin out so that their rows still show where they overlap: fronds, not smoke)
    await ctx.yield();
    leafMesh(apseLow, style.leaf({ core: true, sway: 0.035, reach: 0.14, coreS: 0.5, softFrom: 0.45 }), 0);
    leafMesh(apseLow, style.leaf({ sway: 0.035, reach: 0.14, fade: 1, coreS: 0.5, softFrom: 0.45 }), 2.5);
    await ctx.yield();
    { const rg = mergeGeometries(ribs); for (const g of ribs) g.dispose();
      const rm = new THREE.Mesh(rg, style.stem({ scales: 0, far: 0.0, depthWrite: false })); rm.renderOrder = 2.3; scene.add(rm); }
    await ctx.yield();
    leafMesh(floorLeaves, style.leaf({ core: true, sway: 0.04, reach: 0.4, coreS: 0.5, softFrom: 0.45 }), 0);     // (the bed under the lens is in contact too: crisp fatsia below, never grey shapes)
    await ctx.yield();
    leafMesh(floorLeaves, style.leaf({ sway: 0.04, reach: 0.4, coreS: 0.5, softFrom: 0.45, fade: 1 }), 2.4);
    await ctx.yield();
    // ---- hibiscus (or the seed's one accent): fourteen bushes, sixty flowers, nine passing within 3 m of the lens
    const bushLeaves = [], flowers = [], apseFlowers = [], bushStems = [];
    {
      const r2 = rng.fork ? rng.fork('fph-accent') : rng, pos = new THREE.Vector3(), Yd = new THREE.Vector3(), Zd = new THREE.Vector3(), up = V3(0, 1, 0);
      const perBush = Math.max(3, Math.round(60 / 14 * clamp(density, 0.85, 1.3)));
      for (let b = 0; b < 14; b++) {
        const near = b < 10, z = near ? 87 + b * 8.1 + r2.range(-1.5, 1.5) : r2.range(90, 160), pn = path.nearestXZ(0, z), pp = path.pointAt(pn.u), sd = b % 2 ? -1 : 1;
        const off = near ? r2.range(2.9, 3.4) : r2.range(5.5, 8), cx = pp.x + sd * off, cy = near ? pp.y + r2.range(-0.9, 0.3) : r2.range(2.5, 4.5), cz = z;
        for (let k = 0; k < 3; k++) { const fx = cx + r2.range(-0.3, 0.3), fz = cz + r2.range(-0.3, 0.3);
          bushStems.push(tube([V3(fx, 0, fz), V3(fx + r2.range(-0.2, 0.2), cy * 0.6, fz), V3(cx + r2.range(-0.5, 0.5), cy, cz + r2.range(-0.5, 0.5))], [0.05, 0.04, 0.025], 5, wingPane)); }
        const nL = Math.round(30 * (0.6 + 0.4 * detail));
        for (let k = 0; k < nL; k++) {
          const a = r2() * TAU, e = r2.range(-0.8, 1.2), rr = r2.range(0.3, 1.25);
          pos.set(cx + Math.cos(a) * Math.cos(e) * rr, cy + Math.sin(e) * rr, cz + Math.sin(a) * Math.cos(e) * rr * 1.3);
          Yd.set(Math.cos(a) * 0.7, r2.range(-0.2, 0.9), Math.sin(a) * 0.7);
          bushLeaves.push([cardAt(pos, Yd, up, r2.range(0.9, 1.6)).clone(), [wingPane(pos), r2(), r2.range(0.1, 0.4), r2() < 0.75 ? C.heart : C.lance]]);
        }
        for (let k = 0; k < perBush; k++) {                       // flowers on the side that faces the path
          const t = r2.range(-1.3, 1.3), e = r2.range(-0.7, 0.8), rr = r2.range(0.75, 1.15);
          pos.set(cx - sd * Math.cos(t) * Math.cos(e) * rr, cy + Math.sin(e) * rr + 0.2, cz + Math.sin(t) * rr * 1.2);
          Zd.set(-sd, r2.range(-0.2, 0.3), r2.range(-0.9, 0.2)).normalize();
          flowers.push([cardAt(pos, Yd.set(r2.range(-0.3, 0.3), 1, r2.range(-0.3, 0.3)), Zd, r2.range(0.72, 0.92)).clone(), [wingPane(pos), r2(), -0.35, C.flower]]);
        }
        if (near && b !== 4) {                                   // nine sprays reach in to arm's length: the scarlet that is seen
          const rz = cz + r2.range(-1.0, 1.0), rp = path.pointAt(path.nearestXZ(0, rz).u);
          pos.set(rp.x + sd * r2.range(1.15, 1.6), rp.y + (b % 3 === 0 ? r2.range(0.45, 0.8) : r2.range(-1.0, -0.4)), rz);
          bushStems.push(tube([V3(cx, cy, cz), V3((cx + pos.x) / 2, Math.max(cy, pos.y) + 0.35, (cz + pos.z) / 2), pos.clone()], [0.03, 0.022, 0.014], 4, wingPane));
          Zd.set(-sd * 0.45, 0.15, -1).normalize();
          flowers.push([cardAt(pos, Yd.set(0.1 * sd, 1, 0.15), Zd, 1.0).clone(), [wingPane(pos), r2(), -0.3, C.flower]]);
          for (let k = 0; k < 3; k++) { Yd.set(r2.range(-1, 1), r2.range(-0.3, 0.6), r2.range(-1, 1));
            bushLeaves.push([cardAt(pos.clone().addScaledVector(Yd, 0.12).setY(pos.y - 0.2 - 0.12 * k), Yd, up, r2.range(0.7, 1.0)).clone(), [wingPane(pos), r2(), 0.25, C.heart]]); }
        }
      }
    }
    {
      // four sprays on cue, each a small cluster 4 m ahead of the lens and a little to one side at its second
      // (10, 11.4, 12.7 and 14 s): the scarlet of the 11 s frame, sharp among three fronds
      const r3 = rng.fork ? rng.fork('fph-cue') : rng, pos = new THREE.Vector3(), Yd = new THREE.Vector3(), Zd = new THREE.Vector3(), up = V3(0, 1, 0), T = new THREE.Vector3();
      // [u, side (-x is screen-right on this course), metres off the course, metres above it]: the first is met just inside the sash
      [[0.226, 1, 0.85, 0.45], [0.255, 1, 1.35, -0.5], [0.2745, -1, 0.78, 0.5], [0.312, 1, 1.35, 0.55], [0.345, -1, 1.35, -0.5],
        // and on: one more in the wing, two where it gives onto the dome (left of the lens, the young palms being on the right), and six
        // standards trained up canes among the apse's ferns, so the accent is met at arm's length along the whole course
        [0.385, 1, 1.3, 0.5], [0.44, 1, 1.7, -0.45], [0.462, 1, 1.9, 0.4],
        [0.816, -1, 1.6, -0.55], [0.842, 1, 1.6, 0.3], [0.886, -1, 1.7, -0.6], [0.902, 1, 2.3, -0.7], [0.932, -1, 2.4, -0.5], [0.972, 1, 2.4, -0.9],
        [0.808, 1, 1.9, 0.5], [0.829, 1, 1.5, -0.4], [0.857, -1, 1.5, 0.55], [0.888, 1, 1.6, 0.45], [0.918, -1, 1.7, 0.4], [0.9585, 1, 2.0, 0.5], [0.966, -1, 2.6, -0.6], [0.415, -1, 1.3, 0.3],
        [0.7985, 1, 1.25, -0.35]].forEach(([u, sd, lat, dy], i) => {      // (polish 4: the last entry is the subject of the turn into the nave, the accent at arm's length under the arch)
        const P = path.pointAt(u);
        const c = V3(P.x + sd * lat, P.y + dy, P.z), root = V3(c.x + sd * 1.6, 0, c.z + 0.8);
        bushStems.push(tube([root, V3((root.x + c.x) / 2 + sd * 0.4, c.y * 0.62, (root.z + c.z) / 2), c.clone()], [0.05, 0.035, 0.018], 5, wingPane));
        for (let k = 0; k < 3; k++) {
          pos.set(c.x + sd * 0.3 * k, c.y + [0, 0.34, -0.3][k], c.z + [0, 0.45, 0.8][k]);
          Zd.set(-sd * 0.4, 0.12, -1).normalize();
          (u > 0.7 ? apseFlowers : flowers).push([cardAt(pos, Yd.set(0.12 * sd, 1, 0.1 * k), Zd, k ? 0.9 : 1.3).clone(), [wingPane(pos), r3(), -0.3, C.flower]]);
        }
        for (let k = 0; k < 7; k++) { Yd.set(r3.range(-1, 1), r3.range(-0.4, 0.5), r3.range(-0.6, 1));
          bushLeaves.push([cardAt(pos.set(c.x + sd * r3.range(0.1, 0.9), c.y - r3.range(0.25, 0.9), c.z + r3.range(-0.2, 1.1)), Yd, up, r3.range(0.7, 1.1)).clone(), [wingPane(pos), r3(), 0.25, C.heart]]); }
      });
    }
    {
      // POLISH 6: the accent at both jambs of the open doorway, in contact with the sash line: full colour from the snow, the warm
      // point of the arrival, and the first thing met inside
      const rj = makeRng(((ctx.seed | 0) * 173 + 3331) >>> 0), pos = new THREE.Vector3(), Yd = new THREE.Vector3(), Zd = new THREE.Vector3(), up = V3(0, 1, 0);
      for (const sd of [-1, 1]) {
        const c = V3(sd * 3.7, 2.6, WING.z0 + 0.25);
        bushStems.push(tube([V3(sd * 4.4, 0, WING.z0 + 0.9), V3(sd * 4.3, 1.7, WING.z0 + 0.6), c.clone()], [0.06, 0.045, 0.025], 5, wingPane));
        for (let k = 0; k < 5; k++) {
          pos.set(c.x - sd * [0, 0.55, -0.35, 0.9, 0.2][k], c.y + [0, 0.85, 1.5, 1.9, 2.6][k], WING.z0 + 0.1 + 0.12 * k);
          Zd.set(-sd * 0.25, 0.1, -1).normalize();
          flowers.push([cardAt(pos, Yd.set(0.1 * sd, 1, 0), Zd, [1.5, 1.15, 1.3, 1.0, 1.1][k]).clone(), [0, rj(), -0.3, C.flower]]);
        }
        for (let k = 0; k < 16; k++) { Yd.set(rj.range(-1, 1), rj.range(-0.3, 0.7), rj.range(-0.8, 0.2));
          bushLeaves.push([cardAt(pos.set(c.x + sd * rj.range(-0.9, 0.7), c.y + rj.range(-1.6, 2.8), WING.z0 + rj.range(0.0, 0.6)), Yd, up, rj.range(0.8, 1.3)).clone(), [0, rj(), 0.25, C.heart]]); }
      }
    }
    // ---- POLISH 1: the accent along the pool walk, and young fan palms down the nave (their own rng: nothing else moves)
    const navePalmFans = [], navePalmTrunks = [];
    {
      const rq = makeRng(((ctx.seed | 0) * 131 + 7703) >>> 0), pos = new THREE.Vector3(), Yd = new THREE.Vector3(), Zd = new THREE.Vector3(), Xd = new THREE.Vector3();
      const up = V3(0, 1, 0), T = new THREE.Vector3(), O = new THREE.Vector3(), mm = new THREE.Matrix4();
      // sprays on canes along the pool walk, outboard of the course (screen-right on this left-hand orbit), met at arm's length
      for (const [u, lat, dy] of [[0.455, 1.5, -0.3], [0.474, 1.3, 0.4], [0.493, 1.6, -0.5], [0.512, 1.4, 0.3], [0.532, 1.7, -0.2]]) {
        const P = path.pointAt(u); T.subVectors(path.pointAt(u + 0.004), P).normalize();
        const nS0 = bushStems.length, nF0 = flowers.length, nL0 = bushLeaves.length;
        O.set(P.x, 0, P.z - DZ).normalize();                      // away from the trunk
        const c = V3(P.x + O.x * lat, P.y + dy, P.z + O.z * lat), root = V3(c.x + O.x * 2.2, 0, c.z + O.z * 2.2);
        if (Math.hypot(root.x, root.z - DZ) < 15.2) root.set(O.x * 15.4, 0, DZ + O.z * 15.4);    // never out of the water
        bushStems.push(tube([root, V3((root.x + c.x) / 2 + O.x * 0.4, c.y * 0.62, (root.z + c.z) / 2 + O.z * 0.4), c.clone()], [0.05, 0.035, 0.018], 5, () => 8));
        for (let k = 0; k < 4; k++) {
          const al = [0, 0.45, 0.8, 0.3][k];
          pos.set(c.x + O.x * 0.28 * k + T.x * al, c.y + [0, 0.34, -0.3, 0.6][k], c.z + O.z * 0.28 * k + T.z * al);
          Zd.copy(T).multiplyScalar(-1).addScaledVector(O, -0.4); Zd.y = 0.12; Zd.normalize();
          flowers.push([cardAt(pos, Yd.set(0.1, 1, 0.1 * k), Zd, k ? 0.9 : 1.3).clone(), [8, rq(), -0.3, C.flower]]);
        }
        for (let k = 0; k < 8; k++) { Yd.set(rq.range(-1, 1), rq.range(-0.4, 0.5), rq.range(-1, 1)); const oo = rq.range(0.1, 0.9), tt = rq.range(-0.2, 1.1);
          bushLeaves.push([cardAt(pos.set(c.x + O.x * oo + T.x * tt, c.y - rq.range(0.25, 0.9), c.z + O.z * oo + T.z * tt), Yd, up, rq.range(0.7, 1.1)).clone(), [8, rq(), 0.25, C.heart]]); }
        if (u === 0.532) { bushStems.length = nS0; flowers.length = nF0; bushLeaves.length = nL0; }     // (polish 7)
      }
      // young fan palms either side of the nave: crowns alternately under the lens (seen from above, every pleat) and over it
      for (let i = 0; i < 15; i++) {
        let sd = i % 2 ? -1 : 1, z = 239 + i * 4.3 + rq.range(-0.8, 0.8), hi = i % 3 === 1 || i >= 11, x = sd * rq.range(3.6, 4.6);
        let h = hi ? rq.range(11.2, 12.4) : rq.range(6.2, 7.4) - 0.25 * Math.max(0, z - 282);
        if (i >= 11 && i < 13) x = sd * 5.0;
        if (i >= 13) { sd = -1; z = [236.5, 246][i - 13]; x = [-5.6, -7.2][i - 13]; h = [9.6, 13][i - 13]; }
        const lean = rq.range(-0.3, 0.3), pts = [], rad = [];
        for (let j = 0; j <= 5; j++) { const t = j / 5; pts.push(V3(x + lean * t * t, h * t, z + lean * 0.6 * t)); rad.push(0.2 * (1 + 0.6 * Math.exp(-t * 6))); }
        navePalmTrunks.push(tube(pts, rad, 8, apsePane));
        const top = pts[5], a0 = rq() * TAU;
        for (let k = 0; k < 9; k++) {
          const az = a0 + k * 2.39996, el = k < 3 ? rq.range(0.5, 1.0) : rq.range(-0.25, 0.45), len = rq.range(1.3, 2.2), sc = rq.range(1.35, 1.9), roll = rq.range(-0.5, 0.5), sdv = rq(), dr = rq.range(0.05, 0.14);
          Yd.set(Math.cos(az) * Math.cos(el), Math.sin(el), Math.sin(az) * Math.cos(el));
          pos.copy(top).addScaledVector(Yd, len);
          Yd.y -= 0.2; Yd.normalize();
          Zd.set(0, 1, 0).addScaledVector(Yd, -Yd.y).normalize().applyAxisAngle(Yd, roll);
          Xd.crossVectors(Yd, Zd).normalize();
          if (path.distanceTo(pos.x, pos.y, pos.z) < sc + 0.7 || blocksWheel(pos.x, pos.y, pos.z, sc * 2)) continue;                 // the lens's own corridor stays clear, and the sight line to the wheel
          navePalmFans.push([mm.makeBasis(Xd, Yd, Zd).scale(_S.set(sc, sc, sc)).setPosition(pos).clone(), [8, sdv, dr, 0]]);
          bushStems.push(tube([top.clone(), top.clone().lerp(pos, 0.5).add(V3(0, 0.25, 0)), pos.clone()], [0.06, 0.045, 0.03], 4, () => 8));
        }
      }
    }
    // ================================================================ POLISH 7: THE POOL HALL, PLANTED IN TIERS
    // (strangers: "the lily pond is a pale, sparse view".) Round the pool walk, at the front of the beds, stands a ring of young fan palms
    // four to nine metres tall, and between them bushes of the seed's accent in full flower. In the open of the hall contact carries
    // right across the water (per-mesh reach), so from any side of the pool the far bank is a wall of cut leaves in three steps of
    // green with the accent burning in it, and the white drum behind. Their own rng: nothing else moves.
    const domeFlowers = [], ringFans = [];
    {
      const rg = makeRng(((ctx.seed | 0) * 89 + 3907) >>> 0), pos = new THREE.Vector3(), Yd = new THREE.Vector3(), Zd = new THREE.Vector3(), Xd = new THREE.Vector3(), mm = new THREE.Matrix4(), up = V3(0, 1, 0);
      const N = 22;
      for (let i = 0; i < N; i++) {
        if (i % 2 === 0) await ctx.yield();
        const a = (i + rg.range(-0.25, 0.25)) / N * TAU, tall = i % 3 === 0, rr = tall ? rg.range(23.2, 24.6) : rg.range(21.4, 22.6), x = Math.sin(a) * rr, zl = Math.cos(a) * rr;
        const h = tall ? rg.range(6.6, 8.2) : rg.range(3.6, 5.2), lean = rg.range(-0.4, 0.4), a0 = rg() * TAU, way = Math.abs(x) < 10.5 && Math.abs(zl) > 12;
        const fansHere = [];
        for (let k = 0; k < 10; k++) {
          const az = a0 + k * 2.39996, el = k < 3 ? rg.range(0.5, 1.0) : rg.range(-0.3, 0.45), len = rg.range(1.5, 2.5), sc = rg.range(1.5, 2.1) * (tall ? 1.15 : 1), roll = rg.range(-0.5, 0.5), sdv = rg(), dr = rg.range(0.05, 0.14);
          fansHere.push([az, el, len, sc, roll, sdv, dr]);
        }
        if (way) continue;                                         // the two ways through stay open (the draws are made all the same)
        const pts = [], rad = [], top = V3(x + lean, h, DZ + zl + lean * 0.6);
        for (let j = 0; j <= 5; j++) { const t = j / 5; pts.push(V3(x + lean * t * t, h * t, DZ + zl + lean * 0.6 * t)); rad.push((tall ? 0.3 : 0.22) * (1 + 0.6 * Math.exp(-t * 6))); }
        if (path.distanceTo(top.x, top.y, top.z) < 6) continue;
        navePalmTrunks.push(tube(pts, rad, 8, () => 8));
        for (const [az, el, len, sc, roll, sdv, dr] of fansHere) {
          Yd.set(Math.cos(az) * Math.cos(el), Math.sin(el), Math.sin(az) * Math.cos(el));
          pos.copy(top).addScaledVector(Yd, len);
          Yd.y -= 0.2; Yd.normalize();
          Zd.set(0, 1, 0).addScaledVector(Yd, -Yd.y).normalize().applyAxisAngle(Yd, roll);
          Xd.crossVectors(Yd, Zd).normalize();
          if (path.distanceTo(pos.x, pos.y, pos.z) < sc + 2.2) continue;
          ringFans.push([mm.makeBasis(Xd, Yd, Zd).scale(_S.set(sc, sc, sc)).setPosition(pos).clone(), [8, sdv, dr, 0]]);
          bushStems.push(tube([top.clone(), top.clone().lerp(pos, 0.5).add(V3(0, 0.25, 0)), pos.clone()], [0.06, 0.045, 0.03], 4, () => 8));
        }
        // a bush of the accent at its foot, on the pool's side: flowers facing the water
        if (!tall) {
          const br = rr - rg.range(0.9, 1.4), ba = a + rg.range(0.07, 0.11), cx = Math.sin(ba) * br, cz = DZ + Math.cos(ba) * br, cy = rg.range(1.5, 2.4), nF = 5 + Math.floor(rg() * 3);
          for (let k = 0; k < nF; k++) {
            pos.set(cx + rg.range(-1.1, 1.1), cy + rg.range(-0.9, 1.3), cz + rg.range(-1.1, 1.1));
            if (path.distanceTo(pos.x, pos.y, pos.z) < 3.2) continue;
            Zd.set(-Math.sin(ba), 0.25, -Math.cos(ba)).normalize();
            domeFlowers.push([cardAt(pos, Yd.set(rg.range(-0.3, 0.3), 1, rg.range(-0.3, 0.3)), Zd, rg.range(1.25, 1.85)).clone(), [8, rg(), -0.3, C.flower]]);
          }
          for (let k = 0; k < 14; k++) { Yd.set(rg.range(-1, 1), rg.range(-0.2, 0.9), rg.range(-1, 1));
            bushLeaves.push([cardAt(pos.set(cx + rg.range(-1.3, 1.3), cy + rg.range(-1.4, 1.0), cz + rg.range(-1.3, 1.3)), Yd, up, rg.range(1.0, 1.7)).clone(), [8, rg(), 0.25, rg() < 0.7 ? C.heart : C.fatsia]]); }
        }
      }
    }
    // ================================================================ ADDS 1: TWO THINGS OF THE HALL (this block is added whole; no line of live is changed)
    // Each stands in the hall's own metres by a rule of the place, the same wherever the eye is, on every seed and edition, and draws from a named
    // stream of its own (as the thicket by the hand leaf does, above). The one reference to the course is a keep-out margin in metres, tested from
    // eyes every 2.5 m of ROUTE (routeEyes: used in tests only; nothing is placed, sized, turned or lit from them).
    await ctx.yield();
    const spikeFlowers = [];     // (n8) the nave spikes' flowers: a pool of their own (they rode the apse's flower pool)
    {
      const routeEyes = [];
      for (let s = 0; s <= path.length; s += 2.5) routeEyes.push(path.posAtDist(s, new THREE.Vector3()));
      const eyeGap = (p) => { let m = 1e9; for (const E of routeEyes) m = Math.min(m, E.distanceTo(p)); return m; };
      // (1) THE RED FLOWER SPIKES DOWN BOTH FLANKS OF THE NAVE. A bush of the seed's one accent, trained up a cane, stands at the foot of each of the
      // nave's ten ribs, both sides, twenty in all (the ribs at z 238 by 7.6 to 306.4; not the gable's own). Root 0.6 m inside the glass (x 10.4),
      // 0.3 m before its rib.
      // THE SIDE OF THE RIB (n8). Each bush is rooted 0.3 m before its rib, on the dome side, and its head stands 0.2 to 1.0 m before it. The nave
      // ends in the gable 1.6 m beyond the tenth rib (apseRibZ: 238 by 7.6 to 306.4; APSE.z1 308). Were the head behind that rib, the bush's second
      // spike, 0.7 m further down the nave (the second spikeOf call below), would stand 0.9 to 1.7 m behind it: in the gable's own rib, 0.2 m short
      // of the glass (apseRibZ's last, APSE.z1 - 0.2), and through the glass. So the one side that serves all ten ribs is the side before. The second
      // spike itself stands from 0.3 m before to 0.5 m beyond its rib's line.
      // The head stands 0.2 to 1.0 m before the rib, 8.8 to 9.4 m off the nave's axis: the wheel pane's radius (7 m), its iron
      // rim (1 m more) and 0.8 m for a spike's lean and its widest flower, so that NOTHING OF THIS STANDS WITHIN 8 m OF THE PANE'S AXIS (the pane's
      // cylinder: x 0, y WHEEL.y, along z). Head 4.4 to 8.2 m up: from the highest foot a bed leaf has at the walls to where a spike's tip, 1.45 m
      // above its head, is over a metre under the gutter line (brief: "no plants above the gutter line"). Two spikes a bush: a stalk of seven flowers,
      // each looking outward from its own stalk (n8): it sits on the stalk's own line at its height, 0.19 m off it (less toward the tip) in a
      // direction square to the stalk, the nave's axis turned about the stalk by a lot from the whole round, one lot a flower, from a stream of its
      // own ('fph-nave-spike-turns'); the card faces that direction lifted by 0.12, its up the stalk's line made square to that face; and two heart
      // leaves. Flowers ride in a pool of their own (spikeFlowers), made as the apse's flower pool is and with its options written again (the seed's
      // accent, "always one alone", its reach, cut edge and thinning), and one thing more: a flower goes from the accent toward milk by exactly the
      // share a flat leaf of its own bush has gone at that distance (the bushes' leaf pool, whose material is handed to it); leaves in the bushes' pool;
      // canes and stalks in ONE merged mesh of their own at the flowers' reach, so a cane is seen exactly as far as its flowers are.
      // KEEP-OUT: a flower nearer a route eye than 2.5 m is not laid (brief: "A hibiscus passes 2.5 m to the right"). A leaf whose foot stands
      // nearer the gable's glass than its own length is not laid (it would reach through the gable).
      {
        const rs = ctx.core.makeRng(ctx.core.hashSeed('fph-nave-spikes:' + ctx.seed)), spikeCanes = [];
        const rt = ctx.core.makeRng(ctx.core.hashSeed('fph-nave-spike-turns:' + ctx.seed));     // (n8) each flower's turn about its stalk: a stream of its own, one draw a flower
        const STALK = [[0, -0.3], [-0.06, 0.5], [-0.18, 1.45]];     // (n8) a spike's stalk, named once: (out, up) in metres from its head; the tube and the flowers' seats both come from these points
        const Ts = new THREE.Vector3(), Od = new THREE.Vector3(), Zf = new THREE.Vector3(), Yf = new THREE.Vector3(), seat = new THREE.Vector3();
        const pos = new THREE.Vector3(), Yd = new THREE.Vector3(), up = V3(0, 1, 0);
        // one spike at c: out = the level direction from the nave's axis to the wall, T = the nave's axis; seed and size from the spikes' own stream
        const spikeOf = (c, out, T) => {
          const seed = rs(), size = rs.range(0.88, 1.12);
          let nCard = 0;
          const at = (dOut, dUp, dT) => V3(c.x + out.x * dOut + T.x * dT, c.y + dUp, c.z + out.z * dOut + T.z * dT);
          const dir = (kOut, kUp, kT) => V3(out.x * kOut + T.x * kT, kUp, out.z * kOut + T.z * kT).normalize();
          const put = (q, Yq, Zq, sc) => { const sdv = (seed + 0.381966 * nCard++) % 1; if (eyeGap(q) < 2.5) return; spikeFlowers.push([cardAt(q, Yq, Zq, sc * size).clone(), [apsePane(q), sdv, -0.3, C.flower]]); };
          const stalk = STALK.map(([o, u]) => at(o, u, 0));
          spikeCanes.push(tube(stalk, [0.022, 0.016, 0.008], 4, apsePane));
          for (let j = 0; j < 7; j++) {
            // (n8) flower j keeps its height and its distance from the stalk; it sits on the stalk's own line (the straight line between the named
            // points, as the tube is built) and looks outward from it: the nave's axis, square to the stalk, turned about the stalk by this flower's lot
            const t = j / 6, hy = -0.25 + 1.4 * t, k = hy <= STALK[1][1] ? 0 : 1, f = (hy - STALK[k][1]) / (STALK[k + 1][1] - STALK[k][1]);
            Ts.subVectors(stalk[k + 1], stalk[k]).normalize();
            Od.copy(T).addScaledVector(Ts, -Ts.dot(T)).normalize().applyAxisAngle(Ts, rt() * TAU);
            seat.lerpVectors(stalk[k], stalk[k + 1], f).addScaledVector(Od, 0.19 * (1 - 0.4 * t));
            Zf.copy(Od); Zf.y += 0.12; Zf.normalize();                        // the face: outward, lifted by 0.12
            Yf.copy(Ts).addScaledVector(Zf, -Zf.dot(Ts)).normalize();         // its up: the stalk's line made square to the face (cardAt keeps the up it is given)
            put(seat, Yf, Zf, lerp(0.98, 0.5, t));
          }
        };
        for (let i = 0; i < 10; i++) for (const sd of [-1, 1]) {
          const zr = apseRibZ[i], root = V3(sd * 10.4, 0, zr - 0.3);
          const cz = zr - rs.range(0.2, 1.0), cx = sd * (WHEEL.r + 1.0 + 0.8 + rs.range(0, 0.6)), c = V3(cx, rs.range(4.4, 8.2), cz);
          spikeCanes.push(tube([root, V3((root.x + c.x) / 2 + sd * 0.3, c.y * 0.62, (root.z + c.z) / 2), c.clone()], [0.06, 0.045, 0.025], 5, apsePane));
          spikeOf(c, V3(sd, 0, 0), V3(0, 0, 1));
          spikeOf(V3(c.x + sd * 0.55, c.y - 0.7, c.z + 0.7), V3(sd, 0, 0), V3(0, 0, 1));
          for (let k = 0; k < 2; k++) {
            Yd.set(rs.range(-1, 1), rs.range(-0.4, 0.6), rs.range(-1, 1));
            pos.set(c.x + sd * rs.range(0.5, 1.2), c.y - rs.range(0.2, 1.6), c.z + rs.range(-0.7, 1.3));
            const sc = rs.range(0.8, 1.3), sdv = rs();
            if (APSE.z1 - pos.z < sc) continue;
            bushLeaves.push([cardAt(pos, Yd, up, sc).clone(), [apsePane(pos), sdv, 0.25, C.heart]]);
          }
        }
        const sg = mergeGeometries(spikeCanes); for (const g of spikeCanes) g.dispose();
        const sm = new THREE.Mesh(sg, style.stem({ scales: 0, far: 0.0, depthWrite: false, reach: 0.4 })); sm.name = 'fph-nave-spike-canes'; sm.renderOrder = 2.3; scene.add(sm);
      }
      await ctx.yield();
      // (2) THE RING OF SMALL FAN PALMS ROUND THE GREAT PALM'S FOOT (brief, space: "a stone island and the palm"). Six young palms, seedlings of the
      // great one (as live calls its own young palms), stand on the island's top course round the trunk's foot: the course is 1.2 m wide about radius
      // 2.1 m (its outer edge 2.70 m out), its top 1.2 m up; the bark is 1.24 m out at its flare 0.7 m up and 1.15 m out at the course's top.
      // (n8) A foot stands in the outermost 0.3 m a foot can stand on: the course's outer edge less the foot's own radius (0.11 * 1.6) less the
      // play of 0.15 either way, so 2.22 to 2.52 m out, at
      // (i + a drawn -0.25 to 0.25) / 6 of the round (six is a plain number: two fans of about 1 m radius to a palm, six palms on a circle 12 m round
      // touch and overlap into one ring). Trunk 1.0 to 2.2 m (under the least of the pool walk's palms, 3.6 m), its top leaning 0.3 to 0.7 m away from
      // the mother trunk, half as thick as a low palm of the pool walk. Two fans a palm, as live's seedlings have, one to each side of the outward
      // direction. (n8) No hub is nearer the mother trunk's axis than its fan's radius and the bark's widest radius (0.8 * 1.55, the flare) and the
      // trunk's thickness (1.6 m, the brief's "a fibrous trunk 1.6 m thick"): a hub nearer than that is carried out LEVEL, in steps of 0.1 m straight
      // away from the axis at its own height (under 4 m in all), and the stalk reaches from the seedling's top to where the hub then is. The fan keeps
      // the frame its draws gave it: it is the same fan, carried out. The crowns hang beyond the course, over the lower step and the water.
      // (n8) Seedlings of the great palm take the great palm's own law of nearness: their fans are drawn with the great crown's own two fan materials
      // and their trunks and stalks with the great trunk's own material (the objects themselves, found on the hero's meshes; no number copied).
      // KEEP-OUT: a fan whose hub is nearer a route eye than its radius and 2.2 m (the margin live keeps for this pool) is not laid; a palm left with
      // no fan is not laid.
      {
        const rp = ctx.core.makeRng(ctx.core.hashSeed('fph-foot-palms:' + ctx.seed)), HP = hero.object.position;
        const Yd = new THREE.Vector3(), Y0 = new THREE.Vector3(), Zd = new THREE.Vector3(), Xd = new THREE.Vector3(), pos = new THREE.Vector3(), mm = new THREE.Matrix4();
        const footFans = [], footTrunks = [];     // (n8) the seedlings' own lists (they rode the pool walk's fan pool and the nave palms' trunk mesh)
        for (let i = 0; i < 6; i++) {
          const a = (i + rp.range(-0.25, 0.25)) / 6 * TAU, rr = (2.1 + 1.2 / 2) - 0.11 * 1.6 - 0.15 + rp.range(-0.15, 0.15), ox = Math.sin(a), oz = Math.cos(a);
          const h = rp.range(1.0, 2.2), lean = rp.range(0.3, 0.7), pts = [], rad = [];
          for (let j = 0; j <= 3; j++) { const t = j / 3; pts.push(V3(HP.x + ox * (rr + lean * t * t), 1.2 + h * t, HP.z + oz * (rr + lean * t * t))); rad.push(0.11 * (1 + 0.6 * Math.exp(-t * 6))); }
          const top = pts[3], az0 = Math.atan2(oz, ox), laid = [];
          for (let k = 0; k < 2; k++) {
            const az = az0 + (k ? -1 : 1) * rp.range(0.5, 0.9), el = rp.range(0.35, 0.8), sc = (k ? 1.0 : 1.18) * rp.range(0.92, 1.08), roll = rp.range(-0.5, 0.5), sdv = rp(), dr = rp.range(0.05, 0.14);
            const len = rp.range(0.5, 0.9);
            Y0.set(Math.cos(az) * Math.cos(el), Math.sin(el), Math.sin(az) * Math.cos(el));
            pos.copy(top).addScaledVector(Y0, len);
            // (n8) carried out level: each step moves the hub 0.1 m straight away from the mother trunk's axis at its own height
            { const ax = pos.x - HP.x, az1 = pos.z - HP.z, ar = Math.hypot(ax, az1);
              for (let carried = 0; Math.hypot(pos.x - HP.x, pos.z - HP.z) < sc + 0.8 * 1.55 + 1.6 && carried < 4; carried += 0.1) { pos.x += 0.1 * ax / ar; pos.z += 0.1 * az1 / ar; } }
            Yd.copy(Y0); Yd.y -= 0.2; Yd.normalize();
            Zd.set(0, 1, 0).addScaledVector(Yd, -Yd.y).normalize().applyAxisAngle(Yd, roll);
            Xd.crossVectors(Yd, Zd).normalize();
            if (eyeGap(pos) < sc + 2.2) continue;
            laid.push([mm.makeBasis(Xd, Yd, Zd).scale(_S.set(sc, sc, sc)).setPosition(pos).clone(), [8, sdv, dr, 0], pos.clone()]);
          }
          if (!laid.length) continue;
          footTrunks.push(tube(pts, rad, 6, () => 8));
          for (const [m, row, hub] of laid) {
            footFans.push([m, row]);
            footTrunks.push(tube([top.clone(), top.clone().lerp(hub, 0.5).add(V3(0, 0.25, 0)), hub.clone()], [0.06, 0.045, 0.03], 4, () => 8));
          }
        }
        // (n8) the great palm's own law, called from its meshes: the crown's two fan materials themselves (the cut pass and the soft pass: the hero's
        // instanced meshes whose material is a FAN's and is laid on no sphere) and the great trunk's material itself (the hero's one mesh with leaf
        // bases round it). The same objects, so the seedlings can never part from the palm they are seedlings of.
        const heroFans = hero.object.children.filter((c) => c.isInstancedMesh && c.material.defines && c.material.defines.FAN && c.material.uniforms.uConformR.value === 0);
        const fanCut = heroFans.find((c) => c.material.defines.CORE), fanSoft = heroFans.find((c) => !c.material.defines.CORE);
        const heroTrunk = hero.object.children.find((c) => c.isMesh && !c.isInstancedMesh && c.material.uniforms && c.material.uniforms.uScales && c.material.uniforms.uScales.value > 0);
        if (footFans.length && fanCut && fanSoft && heroTrunk) {
          const cardF = style.cardGeometry(-1.5, 1.5, -1.05, 1.5, 6, 6); extra.push(cardF);
          leafMesh(footFans, fanCut.material, 0, cardF).name = 'fph-foot-palm-fans';
          leafMesh(footFans, fanSoft.material, 2.5, cardF).name = 'fph-foot-palm-fans-soft';
          const fg = mergeGeometries(footTrunks); for (const g of footTrunks) g.dispose();
          const fm = new THREE.Mesh(fg, heroTrunk.material); fm.name = 'fph-foot-palm-trunks'; fm.renderOrder = 1; scene.add(fm);
        }
      }
    }
    await ctx.yield();
    { const dfA = leafMesh(domeFlowers, style.leaf({ core: true, scarlet: true, sway: 0.04, breath: 0.03, reach: 0.12, holdCol: 1, coreS: 0.5 }), 0);
      await ctx.yield();
      const dfB = leafMesh(domeFlowers, style.leaf({ scarlet: true, sway: 0.04, breath: 0.03, reach: 0.12, holdCol: 1, coreS: 0.5, softFrom: 0.45, fade: 1 }), 2.7);
      await ctx.yield();
      const cardR = style.cardGeometry(-1.5, 1.5, -1.05, 1.5, 6, 6); extra.push(cardR);
      leafMesh(ringFans, style.leaf({ fan: true, core: true, sway: 0.05, reach: 0.085, coreS: 0.5 }), 0, cardR);
      await ctx.yield();
      leafMesh(ringFans, style.leaf({ fan: true, sway: 0.05, reach: 0.085, fade: 1, coreS: 0.5, softFrom: 0.45 }), 2.5, cardR); }
    await ctx.yield();
    await ctx.yield();
    { const tg = mergeGeometries(navePalmTrunks); for (const g of navePalmTrunks) g.dispose();
      const tm = new THREE.Mesh(tg, style.stem({ scales: 9, far: 0.8, reach: 0.16 })); tm.renderOrder = 1; scene.add(tm);
      const cardP = style.cardGeometry(-1.5, 1.5, -1.05, 1.5, 6, 6); extra.push(cardP);
      leafMesh(navePalmFans, style.leaf({ fan: true, core: true, sway: 0.05, reach: 0.14, coreS: 0.5, softFrom: 0.45 }), 0, cardP);
      leafMesh(navePalmFans, style.leaf({ fan: true, sway: 0.05, reach: 0.14, fade: 1, coreS: 0.5, softFrom: 0.45 }), 2.5, cardP); }
    await ctx.yield();
    { const tg = mergeGeometries(bushStems); for (const g of bushStems) g.dispose();
      const tm = new THREE.Mesh(tg, style.stem({ scales: 0, far: 0.0, depthWrite: false })); tm.renderOrder = 2.3; scene.add(tm); }
    await ctx.yield();
    leafMesh(bushLeaves, style.leaf({ core: true, sway: 0.06, reach: 0.45, coreS: 0.5, softFrom: 0.45 }), 0);
    leafMesh(bushLeaves, style.leaf({ sway: 0.06, reach: 0.45, coreS: 0.5, softFrom: 0.45, fade: 1 }), 2.6);
    const bushLeafMat = scene.children[scene.children.length - 2].material;     // (n8) the bushes' own leaf material, as made two lines above (the cut pass; both passes have the one reach): the plant that carries the nave's spikes
    await ctx.yield();
    leafMesh(flowers, style.leaf({ core: true, scarlet: true, sway: 0.04, breath: 0.03, reach: 0.4, holdCol: 1, coreS: 0.5, softFrom: 0.45 }), 0);
    leafMesh(flowers, style.leaf({ scarlet: true, sway: 0.04, breath: 0.03, reach: 0.4, holdCol: 1, coreS: 0.5, softFrom: 0.45, fade: 1 }), 2.7);
    // (the apse's standards go by thinning out, not by standing pale: nothing lies over the wheel pane until it is at arm's length)
    leafMesh(apseFlowers, style.leaf({ core: true, scarlet: true, sway: 0.04, breath: 0.03, reach: 0.4, holdCol: 1, coreS: 0.5, softFrom: 0.45 }), 0);
    leafMesh(apseFlowers, style.leaf({ scarlet: true, sway: 0.04, breath: 0.03, reach: 0.4, holdCol: 1, fade: 1, coreS: 0.5, softFrom: 0.45 }), 2.7);
    // (n8) the nave spikes' flowers: made as the apse's pool above is, its options written again (same size, cut edge, thinning, orders), plus accentLeaf:
    // the leaf material of the bushes that carry them, so a spike's flower is never paler and never redder than its own bush's leaves
    leafMesh(spikeFlowers, style.leaf({ core: true, scarlet: true, sway: 0.04, breath: 0.03, reach: 0.4, holdCol: 1, coreS: 0.5, softFrom: 0.45, accentLeaf: bushLeafMat }), 0).name = 'fph-nave-spike-flowers';
    leafMesh(spikeFlowers, style.leaf({ scarlet: true, sway: 0.04, breath: 0.03, reach: 0.4, holdCol: 1, fade: 1, coreS: 0.5, softFrom: 0.45, accentLeaf: bushLeafMat }), 2.7).name = 'fph-nave-spike-flowers-soft';
    await ctx.yield();

    // ---- mist: three level shelves down the wing (and three in the apse), curling where the lens breaks through
    {
      const geos = [];
      // (polish 4) no shelf reaches the wheel pane: the apse's mist ends, frayed, thirty metres short of it, and none lies below the lens there
      // (polish 7) withdrawn from the wing and the apse: seen edge-on down an aisle a level sheet stood as a white haze in the middle of the frame, and from the dome it lay
      // across the wheel pane; one small shelf is kept high under the wing's ridge, seen only from below
      for (const [y, z0, z1, hw] of [[11.2, 96, 150, 4.5]]) {
        const g = new THREE.PlaneGeometry(hw * 2, z1 - z0, 1, 1); g.rotateX(-Math.PI / 2); g.translate(60, y, (z0 + z1) / 2); geos.push(g); }
      const mm = new THREE.Mesh(mergeGeometries(geos), style.mist({ strength: 0.42, edge: 1e5, span: [400, 80] })); for (const g of geos) g.dispose();
      mm.position.x = -60; mm.renderOrder = 5; mm.frustumCulled = false; scene.add(mm);
    }
    // ================================================================ AIR: steam, snowflakes, butterflies
    // soft discs of milk white: steam rising through the grating and rolling out of the open sashes; flakes outside
    const puffMat = (o) => mat(/* glsl */`
      attribute vec4 aSrc; attribute vec4 aVel; uniform vec4 uPuff; uniform float uResY; uniform float uTime; uniform float uFar; uniform vec2 uFarR;
      varying vec2 vQ; varying float vA;
      void main(){
        float ph = fract(uTime / max(aVel.w, 0.1) + aSrc.w);
        vec3 p = aSrc.xyz + aVel.xyz * ph * aVel.w;
        p.x += sin(aSrc.w * 40. + uTime * 0.31 + ph * 3.) * uPuff.w * ph; p.z += cos(aSrc.w * 23. + uTime * 0.23) * uPuff.w * ph;
        vec4 mv = viewMatrix * modelMatrix * vec4(p, 1.);
        float px = 2. * max(-mv.z, 0.1) / max(projectionMatrix[1][1] * uResY, 1.);
        float size = max(mix(uPuff.x, uPuff.y, ph) * (0.7 + 0.6 * fract(aSrc.w * 7.3)), 1.2 * px);
        mv.xy += position.xy * size;
        vQ = position.xy;
        vA = sin(ph * 3.14159) * uPuff.z * smoothstep(1.2, 5.5, -mv.z) * (1. - uFar * smoothstep(uFarR.x, uFarR.y, -mv.z));     // (polish 4) steam down a long aisle must not add up to a white blank in the middle of the frame
        gl_Position = projectionMatrix * mv;
      }`, style.glsl.common + /* glsl */`
      uniform float uSoft, uTone; varying vec2 vQ; varying float vA;
      void main(){ float r = length(vQ); float a = min(vA, 1.) * (1. - smoothstep(uSoft, 1., r)); if (a < 0.004) discard; gl_FragColor = vec4(mix(cMilk, cPearl, uTone), a); }`,
      { uPuff: { value: new THREE.Vector4(o.s0, o.s1, o.alpha, o.wander) }, uSoft: { value: o.soft }, uTone: { value: o.tone ?? 0 }, uFar: { value: o.far ?? 0 }, uFarR: { value: new THREE.Vector2(o.far0 ?? 16, o.far1 ?? 40) } }, { transparent: true, depthWrite: false });
    const puffs = (list, material, order) => {
      const g = new THREE.PlaneGeometry(2, 2), n = list.length, a = new Float32Array(n * 4), b = new Float32Array(n * 4);
      list.forEach((l, i) => { a.set(l[0], i * 4); b.set(l[1], i * 4); });
      g.setAttribute('aSrc', new THREE.InstancedBufferAttribute(a, 4)); g.setAttribute('aVel', new THREE.InstancedBufferAttribute(b, 4));
      const im = new THREE.InstancedMesh(g, material, n); im.frustumCulled = false; im.renderOrder = order; scene.add(im); return im;
    };
    let flakeMesh = null;
    {
      const r2 = rng.fork ? rng.fork('fph-air') : rng, st = [];
      const nS = Math.round(210 * detail);
      // (polish 6) the grating breathes at eight vents beside the walk, alternate sides, each a slim column of small drawn puffs seen only from near:
      // never a haze standing in the middle of the aisle
      for (let i = 0; i < nS; i++) { const zr = r2.range(82, 169), vent = Math.floor((zr - 82) / 11), sdv = vent % 2 ? -1 : 1, xr = r2.range(-1.4, 1.4);
        st.push([[sdv * 2.05 + xr * 0.12, 0.1, 87.5 + vent * 11 + (zr % 1 - 0.5) * 0.5, r2()], [r2.range(-0.15, 0.15) * 0.6, r2.range(0.8, 1.5) * 0.8, r2.range(-0.15, 0.15) * 0.6, r2.range(3.5, 6) * 0.6]]); }
      for (let i = 0; i < Math.round(90 * detail); i++) st.push([[r2.range(-4.6, 4.6), r2.range(3.5, 8.6), WING.z0 + 0.6, r2()], [r2.range(-0.3, 0.3), r2.range(0.5, 1.1), r2.range(-2.2, -0.9), r2.range(4, 6.5)]]);
      puffs(st, puffMat({ s0: 0.12, s1: 0.42, alpha: 0.2, wander: 0.22, soft: 0.3, far: 1, far0: 4.5, far1: 10 }), 4.5);     // (polish 6: a breath, never a white figure standing in the aisle)
      const fl = [], nF = Math.round((snowfall ? 620 : 90) * detail);
      for (let i = 0; i < nF; i++) fl.push([[r2.range(-38, 6), r2.range(9, 16), r2.range(-4, 78), r2()], [-r2.range(0.1, 0.5), -r2.range(1.2, 1.9), r2.range(-0.2, 0.2), 8.5]]);
      flakeMesh = puffs(fl, puffMat({ s0: 0.045, s1: 0.045, alpha: 2.0, wander: 0.6, soft: 0.35 }), 4.6);
    }
    await ctx.yield();
    // butterflies (or the seed's white moths): fifty, each a pale blur until it crosses within 2 m of the lens
    {
      const r2 = rng.fork ? rng.fork('fph-fly') : rng, n = Math.max(24, Math.round(50 * (0.5 + 0.5 * detail))), list = [], bf = [];
      for (let i = 0; i < n; i++) {
        const inDome = i >= n * 0.55, a = r2() * TAU, rr = r2.range(6, 22);
        const home = i >= n * 0.8 ? V3(r2.range(-6, 6), r2.range(9, 15), r2.range(236, 292)) : inDome ? V3(Math.cos(a) * rr, r2.range(3, 20), DZ + Math.sin(a) * rr) : V3(r2.range(-9, 9), r2.range(2.5, 8.5), r2.range(86, 166));
        bf.push({ home, r: r2.range(1.2, 3.2), w: r2.range(0.25, 0.6), ph: r2() * TAU, fl: r2.range(7, 10), sc: r2.range(0.52, 0.7) * 0.5 });     // (polish 6: half the size; at 60 cm across they were stickers)
        for (let k = 0; k < 2; k++) list.push([new THREE.Matrix4(), [6, r2(), 0.1, k ? 1 : -1]]);      // two wings hinged at the body; w = which way the head lies on the card
      }
      // (polish 7) a dozen have found the open casements and the plant cases: they flutter in the cold round the accent, in contact with
      // the lights, so they are sharp from the snow (their own rng; they are extra to the fifty)
      { const ro = makeRng(((ctx.seed | 0) * 137 + 2203) >>> 0), nOut = Math.round(12 * (0.6 + 0.4 * detail));
        for (let j = 0; j < nOut; j++) { const st = lanternStands[(j * 3) % lanternStands.length];
          bf.push({ home: V3(st[0] + ro.range(-0.8, 0.8), ro.range(2.0, 3.6), st[1] + ro.range(-1.2, 1.2)), r: ro.range(0.7, 1.5), w: ro.range(0.4, 0.8), ph: ro() * TAU, fl: ro.range(7, 10), sc: ro.range(0.42, 0.62) });
          for (let k = 0; k < 2; k++) list.push([new THREE.Matrix4(), [0.3, ro(), 0.1, k ? 1 : -1]]); } }
      const nAll = bf.length;
      const bm = leafMesh(list, style.leaf({ moth: moths ? 2 : 1, sway: 0 }), 2.8);
      const cue = [0.296, 0.232, 0.318, 0.49, 0.585, 0.845, 0.365, 0.735, 0.762, 0.545, 0.405],     // (polish 6: none is at the centre of a still)
        cueX = cue.map((c, i) => 0.55 + 0.45 * ((i * 0.618) % 1)),   /* how far above or below the centre each keeps as it crosses */
        Ub = new THREE.Vector3(), Fc = new THREE.Vector3(), p = new THREE.Vector3(), q = new THREE.Vector3(), F = new THREE.Vector3(), Rt = new THREE.Vector3(), Yw = new THREE.Vector3(), Zw = new THREE.Vector3();
      const cf = new THREE.Vector3(), cr = new THREE.Vector3(), cu = new THREE.Vector3(), mm = new THREE.Matrix4();
      cue.forEach((c, i) => { if (i < n) { bf[i].home.copy(path.pointAt(c)).add(V3(r2.range(-4, 4), r2.range(1, 3), r2.range(3, 7))); bf[i].sc = 0.25 + 0.1 * ((i * 0.381) % 1); bf[i].home.y += 2; bf[i].home.x += bf[i].home.x >= path.pointAt(c).x ? 2.5 : -2.5; } });   // each waits near its cue
      const at = (b, t, out) => out.set(b.home.x + Math.sin(t * b.w + b.ph) * b.r, b.home.y + Math.sin(t * b.w * 1.7 + b.ph * 2.) * b.r * 0.35, b.home.z + Math.cos(t * b.w * 0.83 + b.ph) * b.r);
      tick.push((dt, time, camera, u) => {
        const e = camera.matrixWorld.elements; cr.set(e[0], e[1], e[2]); cf.set(-e[8], -e[9], -e[10]); cu.set(e[4], e[5], e[6]);
        for (let i = 0; i < nAll; i++) {
          const b = bf[i];
          let wCue = 0;
          at(b, time, p); at(b, time + 0.2, q); F.subVectors(q, p);
          F.y *= 0.3; if (F.lengthSq() < 1e-8) F.set(1, 0, 0); F.normalize();
          F.y += 0.7; F.normalize();                               // a butterfly flies with its body pitched up
          if (i < cue.length) {                                    // the ones that cross within arm's reach, on cue:
            // it comes in from one side, crosses the centre 1.5 m off at its cue and leaves ahead of us, up and to the other
            // side (never back across the lens); climbing away, so both wings show either side of the body
            const k = (u - cue[i]) / 0.03, ak = Math.abs(k), w = 1 - smoothstep(2.0, 3.0, ak), sgn = i % 2 ? -1 : 1, kp = Math.max(0, k);
            q.copy(lens).addScaledVector(cf, 3.7 + 0.2 * Math.sin(time * 1.3 + i) + 2.2 * kp + 1.2 * Math.max(0, -k - 1)).addScaledVector(cr, sgn * k * 1.5).addScaledVector(cu, (i % 3 === 0 ? -0.7 : 0.8) * cueX[i]);
            q.y += 0.6 * kp * kp; q.y += 0.2 * Math.sin(time * 2.1 + i * 2.) - 0.05;
            p.lerp(q, w);
            Fc.copy(cf).multiplyScalar(0.35); Fc.y += 0.9;
            F.lerp(Fc.normalize(), w).normalize();
            wCue = w;
          }
          Ub.set(0, 1, 0).addScaledVector(F, -F.y); if (Ub.lengthSq() < 1e-6) Ub.set(1, 0, 0); Ub.normalize();
          if (wCue > 0.01) {                                       // its back turned to the lens as it crosses, so the two wings open either side of the body
            Fc.subVectors(lens, p); Fc.addScaledVector(F, -F.dot(Fc));
            if (Fc.lengthSq() > 1e-6) Ub.lerp(Fc.normalize(), wCue * (0.2 + 0.5 * ((i * 0.447) % 1))).normalize();     // (polish 6) each banked its own way: three-quarter views, never the same flat glyph
          }
          Rt.crossVectors(F, Ub).normalize();
          const fl = 0.42 + 0.8 * Math.abs(Math.sin(time * b.fl * 0.8 + b.ph)),     /* (polish 6) wings held in a V between beats: a still shows a flying insect, never an opened glyph */ c = Math.cos(fl), s = Math.sin(fl);
          for (let k = 0; k < 2; k++) { const sd = k ? -1 : 1;
            Yw.copy(Rt).multiplyScalar(sd * c).addScaledVector(Ub, s);
            Zw.copy(Rt).multiplyScalar(-sd * s).addScaledVector(Ub, c);
            bm.setMatrixAt(i * 2 + k, cardAt(p, Yw, Zw, b.sc, mm)); }
        }
        bm.instanceMatrix.needsUpdate = true;
      });
    }
    await ctx.yield();
    // ================================================================ (n8b) WHAT STANDS BEFORE THE FORCING HOUSE WALL AND WRITES NO DEPTH
    // The wall's bars are drawn over its prints by one flat sheet at order 3.15 ('fph-wall-bars', above), after everything that stands on the
    // terrace. What can stand between an eye on the route and the wall's rectangle and writes no depth (the list, made by building the world and
    // flying the walk at several clocks: n8b/NOTES.md): the open casements' lights and the door's sash on the forcing house's side (panes, order
    // 2) and the butterflies (order 2.8). ONE RULE, stated by the place: each is drawn once more by its own shader with the define WALL_DEPTH (the
    // part), after the wall's last print and before its bars (order 3.12, where s3 had its mask of the lights): no colour; where the eye's own line
    // through it goes on to the wall's rectangle it writes the depth of a plane 0.01 m outside the glass (as far before the bars' sheet as that
    // is before the glass), so the bars stop at its outline, and with them whatever else is drawn later BEHIND the wall's plane on that line (by
    // render: a drop inside the wing, seen through the sash's pane or an open casement light and the wall's last metres); where the line misses the rectangle it writes
    // nothing, so nothing before the wall or beside it is cut. Each shares its thing's own state: the lights' own geometry built again; the sash's own pane geometry in
    // the sash's own group, easing with it; the butterflies' own geometry, instance matrices (the attribute update writes each frame), defines and uniforms. None reads a key, a clock, u or a seed; none is ever hidden.
    {
      const uWall = { value: new THREE.Vector4(FH.x - 0.01, FH.z0, FH.z1, FH.h) };
      const wallDepth = (m, of = m) => { m.defines = { ...of.defines, WALL_DEPTH: 1 }; m.uniforms = { ...of.uniforms, uWall }; m.colorWrite = false; m.depthWrite = true; m.forceSinglePass = true; return m; };
      const paneDepth = wallDepth(style.glass({ outside: true, side: THREE.DoubleSide }));
      const lights = new THREE.Mesh(accGeometry(sashAcc), paneDepth); lights.name = 'fph-casement-lights-depth'; lights.renderOrder = 3.12;
      scene.add(lights);
      for (const s of sashes) if (s.sd * FH.x > 0) { const pane = s.g.children.find((c) => c.material.uniforms.uOutside), d = new THREE.Mesh(pane.geometry, paneDepth); d.name = 'fph-door-sash-depth'; d.renderOrder = 3.12; s.g.add(d); }
      const fly = scene.children.find((c) => c.isInstancedMesh && c.material.defines && c.material.defines.WING);
      const flies = new THREE.InstancedMesh(fly.geometry, wallDepth(style.leaf({}), fly.material), fly.count); flies.instanceMatrix = fly.instanceMatrix;
      flies.name = 'fph-butterflies-depth'; flies.frustumCulled = false; flies.renderOrder = 3.12;
      scene.add(flies);
    }
    await ctx.yield();
    // ================================================================ OUTSIDE: hedge, pollarded limes, blackbirds, the roof's snow
    // flat inks for things that stand in the open: two tones by aTint, paling toward the horizon (never toward dark)
    const flatMat = (cA, cB, grain = 0) => mat(/* glsl */`
      attribute float aTint; varying float vT; varying vec3 vWp;
      void main(){ vec4 p = vec4(position, 1.);
        #ifdef USE_INSTANCING
        p = instanceMatrix * p;
        #endif
        vec4 wp = modelMatrix * p; vWp = wp.xyz; vT = aTint; gl_Position = projectionMatrix * viewMatrix * wp; }`,
      style.glsl.common + /* glsl */`
      uniform vec3 uA, uB, uLo; uniform float uGrain; varying float vT; varying vec3 vWp;
      void main(){
        // (polish 7) a clipped thing shows its leaves: rows of small darts in the lighter green, each a cut shape (flat, two inks, no shading)
        vec2 lp = vec2((vWp.z + vWp.x * 0.83) / 0.34, vWp.y / 0.24);
        float fwl = max(fwidth(lp.x), fwidth(lp.y));
        float row = floor(lp.y); lp.x += 0.5 * mod(row, 2.) + 0.3 * h11(row);
        vec2 lc = floor(lp), lf = fract(lp) - 0.5;
        float lr = h21(lc);
        lf = vec2(lf.x + lf.y * (lr - 0.5) * 1.2, lf.y);
        float g = (1. - smoothstep(0.36, 0.36 + fwl * 1.5, abs(lf.x) * 1.15 + abs(lf.y) * 1.9)) * step(0.3, lr) * (1. - smoothstep(0.2, 0.6, fwl));
        vec3 col = mix(mix(uA, mix(cVirid, cGrey, 0.25), g * uGrain * (1. - step(0.3, vT))), uB, vT);
        gl_FragColor = vec4(mix(col, uLo, smoothstep(40., 420., distance(vWp, uLens)) * 0.85), 1.);
      }`, { uA: { value: cA }, uB: { value: cB }, uLo: { value: cLo }, uGrain: { value: grain } }, { side: THREE.DoubleSide });
    const tint = (g, v) => { g.setAttribute('aTint', new THREE.BufferAttribute(new Float32Array(g.attributes.position.count).fill(v), 1)); if (g.attributes.uv) g.deleteAttribute('uv'); if (g.attributes.normal) g.deleteAttribute('normal'); if (g.attributes.aPane) g.deleteAttribute('aPane'); return g; };
    const tintSnow = (g) => { const n = g.attributes.normal, a = new Float32Array(n.count);
      for (let i = 0; i + 2 < n.count; i += 3) { const v = (n.getY(i) + n.getY(i + 1) + n.getY(i + 2)) / 3 > 0.62 ? 0.75 : 0; a[i] = a[i + 1] = a[i + 2] = v; }     // (polish 6: was a smooth gradient, which read as a lit sphere)
      tint(g, 0); g.setAttribute('aTint', new THREE.BufferAttribute(a, 1)); return g; };
    const outside = new THREE.Group(); scene.add(outside);
    const snowCol = P.milk.clone().lerp(P.pearl, 0.04);
    {
      const r2 = rng.fork ? rng.fork('fph-out') : rng, gs = [], balls = [], box = (w, h, d, x, y, z, t) => { const g = new THREE.BoxGeometry(w, h, d, 1, 1, 1).toNonIndexed(); g.translate(x, y, z); gs.push(tint(g, t)); };
      // the clipped hedge on the right of the terrace, capped with snow; a second, lower one beyond the limes
      // (polish 4) taller than the eye and a darker ink: the lens no longer looks down on a bare pale lid, and the grey limes stand against it
      // (polish 6) lower than the eye again and running back past the entry: over it the yew cones and drums stand in tiers of snow, the park beyond
      box(1.7, 2.2, 112, -6.4, 1.1, 20, 0); box(2.0, 0.3, 112.3, -6.4, 2.32, 20, 1);
      for (let k = -3; k < 10; k++) box(2.3, 3.0, 2.3, -6.4, 1.5, -1 + k * 8.75, 0), box(2.6, 0.34, 2.6, -6.4, 3.14, -1 + k * 8.75, 1);
      box(0.6, 0.5, 112, 6.15, 0.25, 22, 0); box(0.76, 0.14, 112.2, 6.15, 0.56, 22, 1);          // a box edging at the forcing house's foot, capped with snow
      box(1.2, 1.1, 96, -24, 0.55, 40, 0); box(1.5, 0.22, 96.3, -24, 1.2, 40, 1);
      await ctx.yield();
      for (const [bx, bz, br] of [[-3.4, 68.5, 1.1], [-3.7, 76.0, 0.95], [4.7, 67.5, 1.05], [4.9, 75.5, 0.9], [5.6, 9.0, 0.95], [-1.0, 8.6, 0.9], [-3.9, 24.0, 0.85], [-4.0, 41.4, 0.9], [-3.9, 53.0, 0.8], [5.2, 10.5, 0.72], [5.2, 22.5, 0.72], [5.2, 51, 0.72], [5.2, 58.5, 0.7]]) {   // (polish 4: three more down the right of the walk, between the limes)   // (the last two stand like gateposts where the walk begins)
        box(br * 1.5, 0.9, br * 1.5, bx, 0.45, bz, 1);
        const ball = new THREE.SphereGeometry(br, 14, 10).toNonIndexed(); ball.translate(bx, 0.9 + br * 0.9, bz); balls.push(tintSnow(ball));
        const cap = new THREE.SphereGeometry(br * 1.03, 14, 4, 0, TAU, 0, 0.8).toNonIndexed(); cap.translate(bx, 0.9 + br * 0.9, bz); balls.push(tint(cap, 1));
        if (balls.length % 8 === 0) await ctx.yield();
      }
      await ctx.yield();
      for (const [lx, lz, lr] of lanternStands) {     // (polish 7) each plant case on its tub, snow on its rim and on its roof
        box(lr * 2.1, 0.74, lr * 2.1, lx, 0.37, lz, 0); box(lr * 2.3, 0.12, lr * 2.3, lx, 0.8, lz, 1);
        const k = lr / 0.78, roof = new THREE.ConeGeometry(lr * 1.16, 0.62 * k, 8, 1, true).toNonIndexed(); roof.rotateY(Math.PI / 8); roof.translate(lx, 0.82 + 1.9 * k + 0.33 * k, lz); gs.push(tint(roof, 1));
      }
      await ctx.yield();
      { const bm = new THREE.Mesh(mergeGeometries(balls), flatMat(P.viridian.clone().lerp(P.deep, 0.75), snowCol, 1)); for (const g of balls) g.dispose(); outside.add(bm); }
      const hm = new THREE.Mesh(mergeGeometries(gs), flatMat(P.viridian.clone().lerp(P.deep, 0.6), snowCol, 1)); for (const g of gs) g.dispose(); outside.add(hm);
      await ctx.yield();
      // nine pollarded limes, bare, soft grey
      const ls = [];
      for (let k = 0; k < 9; k++) {
        if (k % 2 === 1) await ctx.yield();
        const x = -2.5 + r2.range(-0.3, 0.3), z = 9.5 + k * 5.8, h = r2.range(3.4, 4.1) * 1.36;     // (taller: their crowns stand into the sky on the right of the entry)
        ls.push(tintSnow(tube([V3(x, 0, z), V3(x + 0.1, h * 0.5, z), V3(x, h, z)], [0.34, 0.26, 0.3], 9, () => 0).toNonIndexed()));
        const nb = r2.int(4, 5);
        for (let b = 0; b < nb; b++) {
          const a = (b / nb) * TAU + r2.range(-0.3, 0.3), kx = x + Math.cos(a) * 0.9, kz = z + Math.sin(a) * 0.9, ky = h + r2.range(0.5, 1.0);
          ls.push(tintSnow(tube([V3(x, h - 0.2, z), V3((x + kx) / 2, h + 0.25, (z + kz) / 2), V3(kx, ky, kz)], [0.22, 0.17, 0.24], 6, () => 0).toNonIndexed()));
          const cap = new THREE.SphereGeometry(0.27, 6, 3, 0, TAU, 0, 1.3).toNonIndexed(); cap.translate(kx, ky + 0.06, kz); ls.push(tint(cap, 1));
          for (let s = 0; s < 5; s++) { const sa = a + r2.range(-0.9, 0.9), sl = r2.range(1.3, 2.6) * 1.5, so = r2.range(0.25, 0.7) * 1.5;
            ls.push(tint(tube([V3(kx, ky, kz), V3(kx + Math.cos(sa) * so * 0.5, ky + sl * 0.5, kz + Math.sin(sa) * so * 0.5), V3(kx + Math.cos(sa) * so, ky + sl, kz + Math.sin(sa) * so)], [0.075, 0.055, 0.035], 3, () => 0).toNonIndexed(), 0)); }
        }
      }
      await ctx.yield();
      const lm = new THREE.Mesh(mergeGeometries(ls), flatMat(P.greyGreen.clone().lerp(P.deep, 0.28), snowCol)); for (const g of ls) g.dispose(); outside.add(lm);
      await ctx.yield();
      // POLISH 4: the winter garden on the right of the walk (it was a bare pale block). Beyond the hedge a row of clipped yew
      // cones and drums in the darkest outdoor ink, snow on every shoulder; cold frames at the hedge's foot; and far off a
      // park of bare trees, pale soft crowns on the horizon: a near, a middle and a far on the right of every entry frame.
      {
        const rq = makeRng(((ctx.seed | 0) * 29 + 6113) >>> 0), yews = [], far = [], frames = [];
        for (let k = 0; k < 9; k++) {
          if (k % 3 === 2) await ctx.yield();
          const x = -10.6 - (k % 2) * 3.2 + rq.range(-0.4, 0.4), z = 4 + k * 8.1 + rq.range(-1, 1), h = rq.range(5.4, 6.8), r = rq.range(1.5, 1.9);
          if (k % 3 === 1) {            // a drum with a domed head
            const d = new THREE.CylinderGeometry(r * 0.95, r * 0.95, h * 0.6, 14, 1).toNonIndexed(); d.translate(x, h * 0.3, z); yews.push(tintSnow(d));
            const hd = new THREE.SphereGeometry(r * 0.95, 14, 6, 0, TAU, 0, Math.PI / 2).toNonIndexed(); hd.translate(x, h * 0.6, z); yews.push(tintSnow(hd));
            const cp = new THREE.SphereGeometry(r * 0.98, 14, 3, 0, TAU, 0, 0.75).toNonIndexed(); cp.translate(x, h * 0.6, z); yews.push(tint(cp, 1));
          } else {                      // a cone in three clipped tiers, snow on each shoulder
            for (let t = 0; t < 3; t++) { const y0 = h * t / 3, rb = r * (1 - t * 0.3), rtop = t === 2 ? r * 0.07 : r * (1 - (t + 1) * 0.3) * 0.82, g = new THREE.CylinderGeometry(rtop, rb, h / 3 + 0.05, 14, 1).toNonIndexed(); g.translate(x, y0 + h / 6, z); yews.push(tintSnow(g));
              const sh = new THREE.CylinderGeometry(rtop * 0.9, rtop * 1.25 + 0.1, 0.2, 14, 1).toNonIndexed(); sh.translate(x, y0 + h / 3 + 0.08, z); yews.push(tint(sh, 1)); }
          }
        }
        await ctx.yield();
        for (let k = 0; k < 6; k++) {   // cold frames: a dark box, its light propped open, snow swept off it
          const z = 13 + k * 11.6, g = new THREE.BoxGeometry(1.3, 0.55, 3.2).toNonIndexed(); g.translate(-4.5, 0.27, z); frames.push(tint(g, 0));
          const lid = new THREE.BoxGeometry(1.35, 0.07, 3.3).toNonIndexed(); lid.rotateZ(-0.32 - 0.3 * (k % 2)); lid.translate(-4.45, 0.74 + 0.2 * (k % 2), z); frames.push(tint(lid, 1));
        }
        await ctx.yield();
        for (let k = 0; k < 22; k++) {  // the park: bare crowns, pale on the horizon
          const x = -34 - rq.range(0, 70) - (k % 3) * 12, z = -10 + k * 15 + rq.range(-6, 6), h = rq.range(13, 22), w = h * rq.range(0.32, 0.46);
          const c = new THREE.SphereGeometry(1, 9, 6).toNonIndexed(); c.scale(w, h * 0.36, w); c.translate(x, h * 0.66, z); far.push(tint(c, 0.25 + 0.2 * rq()));
          const tr = new THREE.CylinderGeometry(w * 0.07, w * 0.1, h * 0.4, 5, 1).toNonIndexed(); tr.translate(x, h * 0.2, z); far.push(tint(tr, 0.1));
        }
        await ctx.yield();
        const ym = new THREE.Mesh(mergeGeometries(yews), flatMat(P.viridian.clone().lerp(P.deep, 0.8), snowCol, 1)); for (const g of yews) g.dispose(); outside.add(ym);
        const cf = new THREE.Mesh(mergeGeometries(frames), flatMat(P.greyGreen.clone().lerp(P.deep, 0.5), snowCol)); for (const g of frames) g.dispose(); outside.add(cf);
        const fm = new THREE.Mesh(mergeGeometries(far), flatMat(P.greyGreen.clone().lerp(P.pearl, 0.25), P.pearl.clone().lerp(P.milk, 0.3))); for (const g of far) g.dispose(); outside.add(fm);
      }
    }
    await ctx.yield();
    // snow lying on the forcing house roof; one slab lets go and slides off as we pass (u 0.10 .. 0.15)
    {
      const sl = Math.hypot(FH.x - FH.bx, FH.bh - FH.h), dx = (FH.x - FH.bx) / sl, dy = (FH.h - FH.bh) / sl, gs = [];
      const slabG = (z0, z1, t0, t1) => { const g = new THREE.PlaneGeometry(1, 1, 1, 1).toNonIndexed(), p = g.attributes.position;
        for (let i = 0; i < p.count; i++) { const a = p.getX(i) + 0.5, b = p.getY(i) + 0.5, t = lerp(t0, t1, b) * sl; p.setXYZ(i, FH.bx + dx * t - 0.03, FH.bh + dy * t + 0.07, lerp(z0, z1, a)); }
        return tint(g, 1); };
      for (let z = FH.z0; z < FH.z1 - 1; z += 4.8) { if (Math.abs(z - 56) < 3) continue; gs.push(slabG(z + 0.15, z + 4.65, 0.02, 0.3 + 0.25 * Math.abs(Math.sin(z * 1.7)))); }
      const lying = new THREE.Mesh(mergeGeometries(gs), flatMat(snowCol, snowCol)); for (const g of gs) g.dispose(); lying.renderOrder = 3.2; outside.add(lying);
      const slab = new THREE.Mesh(slabG(53.2, 60.6, 0.02, 0.5), lying.material); slab.renderOrder = 3.2; outside.add(slab);
      tick.push((dt, time, camera, u) => { const k = smoothstep(0.1, 0.15, u), s = k * k * sl * 0.9, f = Math.max(0, k - 0.8) * 5;
        slab.position.set(dx * s - f * 0.8, dy * s - f * f * 5.5, 0); slab.visible = k < 0.999; });
    }
    await ctx.yield();
    // blackbirds on the snow: five, the darkest marks of the entry; two fly up to the forcing house ridge as we set off
    {
      const r2 = rng.fork ? rng.fork('fph-birds') : rng, gs = [];
      const part = (g, x, y, z, t) => { const n = g.toNonIndexed(); n.translate(x, y, z); gs.push(tint(n, t)); };
      const body = new THREE.SphereGeometry(1, 8, 6); body.scale(0.12, 0.125, 0.25); part(body, 0, 0.2, 0, 0);
      part(new THREE.SphereGeometry(0.085, 7, 5), 0, 0.31, 0.19, 0);
      const beak = new THREE.ConeGeometry(0.03, 0.11, 5); beak.rotateX(Math.PI / 2); part(beak, 0, 0.305, 0.31, 1);
      const tail = new THREE.BoxGeometry(0.1, 0.02, 0.26); tail.rotateX(-0.25); part(tail, 0, 0.215, -0.33, 0);
      for (const sx of [-0.045, 0.045]) part(new THREE.BoxGeometry(0.018, 0.14, 0.018), sx, 0.06, 0.02, 0);
      const ink = flatMat(P.deep.clone().multiplyScalar(0.8), P.greyGreen);
      const NB = 12;                                   // (polish 4) five on the snow as before, and seven on the wing over the terrace: dark marks in the pale sky
      const bodies = new THREE.InstancedMesh(mergeGeometries(gs), ink, NB); for (const g of gs) g.dispose();
      const wg = new THREE.BufferGeometry();          // a wing: root on the body, a swept tip
      wg.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0.12, 0.52, 0, -0.06, 0, 0, -0.14, 0, 0, 0.12, 0.3, 0, 0.1, 0.52, 0, -0.06], 3));
      const wings = new THREE.InstancedMesh(tint(wg, 0), ink, NB * 2);
      bodies.frustumCulled = false; wings.frustumCulled = false; outside.add(bodies, wings);
      const birds = [];
      for (let i = 0; i < 5; i++) birds.push({ s: V3((i < 3 ? 1.5 - i * 1.3 : 0.9 - (i - 3) * 1.7) + r2.range(-0.3, 0.3), 0, (i < 3 ? 8.5 + ((i * 7) % 5) * 2.3 : 34.5 + (i - 3) * 3.4) + r2.range(-0.6, 0.6)), yaw: r2() * TAU, ph: r2() * TAU,
        perch: V3(FH.bx - 0.5, FH.bh + 0.02, 37 + i * 7) });
      { const rb = makeRng(((ctx.seed | 0) * 61 + 977) >>> 0);
        for (let i = 5; i < NB; i++) birds.push({ s: V3(-3 + rb.range(-5, 4), rb.range(7.5, 12.5), 46 + rb.range(-14, 22)), yaw: 0, ph: rb() * TAU, perch: null, r: rb.range(5, 11), w: rb.range(0.32, 0.5) * (i % 2 ? 1 : -1) }); }
      const M = new THREE.Matrix4(), W = new THREE.Matrix4(), T = new THREE.Matrix4(), Rm = new THREE.Matrix4(), p = new THREE.Vector3(), q = new THREE.Vector3(), eul = new THREE.Euler(), sc = 2.0;
      const fly = (b, w, out) => out.lerpVectors(b.s, b.perch, w).setY(lerp(b.s.y, b.perch.y, w) + 4 * w * (1 - w) * 2.6);
      tick.push((dt, time, camera, u) => {
        for (let i = 0; i < NB; i++) {
          const b = birds[i], w = i < 2 ? smoothstep(0.028 + i * 0.012, 0.085 + i * 0.012, u) : 0, wheel = i >= 5, air = wheel || (w > 0.002 && w < 0.998);
          let yaw = b.yaw + 0.5 * Math.sin(time * 0.4 + b.ph), pitch = Math.pow(Math.max(0, Math.sin(time * 1.3 + b.ph)), 6) * 0.75, flap = 0;
          if (wheel) {                        // wheeling over the terrace: a slow ring, a glide between bursts of wingbeats
            const a = time * b.w + b.ph, sg = b.w > 0 ? 1 : -1;
            p.set(b.s.x + Math.cos(a) * b.r, b.s.y + Math.sin(a * 0.7 + b.ph) * 0.9, b.s.z + Math.sin(a) * b.r * 1.7);
            yaw = Math.atan2(-Math.sin(a) * sg, Math.cos(a) * 1.7 * sg); pitch = 0;
            flap = (Math.sin(time * 11 + b.ph) * 0.8 + 0.1) * smoothstep(-0.2, 0.3, Math.sin(time * 0.9 + b.ph * 3)) + 0.12;
          } else fly(b, w, p);
          if (wheel) { /* placed above */ } else if (air) { fly(b, Math.min(1, w + 0.02), q); q.sub(p); yaw = Math.atan2(q.x, q.z); pitch = -Math.atan2(q.y, Math.hypot(q.x, q.z)) * 0.6; flap = Math.sin(time * 13 + b.ph) * 0.85 + 0.15; }
          else if (w < 0.5) p.y += Math.pow(Math.abs(Math.sin(time * 1.7 + b.ph)), 10) * 0.07;
          else { yaw = -1.2; pitch *= 0.4; }
          M.makeRotationFromEuler(eul.set(pitch, yaw, 0, 'YXZ')).scale(q.set(sc, sc, sc)).setPosition(p);
          bodies.setMatrixAt(i, M);
          for (let k = 0; k < 2; k++) { const sd = k ? -1 : 1;
            W.makeRotationZ(sd * flap);
            if (!air) W.makeRotationY(sd * 1.25).multiply(Rm.makeScale(0.62, 1, 0.8));                 // folded along the back
            T.makeTranslation(sd * 0.085, 0.27, 0.02); W.premultiply(T);
            if (k) W.multiply(Rm.makeScale(-1, 1, 1));
            wings.setMatrixAt(i * 2 + k, W.premultiply(M)); }
        }
        bodies.instanceMatrix.needsUpdate = true; wings.instanceMatrix.needsUpdate = true;
      });
    }
    await ctx.yield();
    // the house breathing: the steam that rolls out of the open sashes gathers under the gable's verge and stands up past the ridge
    // as one milk-white plume, leaning downwind (screen-right) across the darker sky beside the dome
    {
      const rp = makeRng(((ctx.seed | 0) * 17 + 2903) >>> 0), pl = [], nP = Math.round(84 * (0.6 + 0.4 * detail));
      for (let i = 0; i < nP; i++) pl.push([[rp.range(-5.4, -2.6), rp.range(7.6, 9.4), WING.z0 - rp.range(0.4, 1.6), rp()], [-rp.range(1.5, 2.2), rp.range(2.2, 3.1), -rp.range(0.1, 0.5), rp.range(6.4, 8.2)]]);
      const plume = puffs(pl, puffMat({ s0: 0.8, s1: 3.2, alpha: 0.6, wander: 0.9, soft: 0.0 }), 4.4);     // (polish 4) larger: it stands twice the gable's height
      outside.add(plume);
    }
    tick.push(() => { outside.visible = lens.z < 110; flakeMesh.visible = lens.z < 100; });
    await ctx.yield();
    // ================================================================ PRINTS ON THE WALLS, THE APSE'S BEDS, DRIPS
    // wherever a plant reaches a pane its last leaves lie flat on it: crisp prints low on the wing's walls and the apse's
    {
      const r2 = rng.fork ? rng.fork('fph-prints') : rng, prints = [], beds = [], pos = new THREE.Vector3(), up = new THREE.Vector3(), Yd = new THREE.Vector3();
      const cells = [C.fatsia, C.hand, C.lance, C.heart, C.fatsia, C.frond];
      for (let i = 0; i < 34; i++) {                                 // the fern wing, both walls, in loose clumps
        const sd = i % 2 ? -1 : 1, z = WING.z0 + 4 + ((i * 2.47) % 1) * 78 + r2.range(-1, 1), a = r2.range(-1.1, 1.1), cell = r2.pick(cells);
        prints.push([cardAt(pos.set(sd * (WING.hw - 0.05), r2.range(0.6, 4.6), z), up.set(0, Math.cos(a), Math.sin(a)), V3(-sd, 0, 0), r2.range(1.5, 3.0) * (cell === C.frond ? 1.5 : 1)).clone(), [-1, r2(), 0, cell]]);
      }
      for (let i = 0; i < 40; i++) {                                 // the apse, never above the gutter line
        const sd = i % 2 ? -1 : 1, z = 236 + ((i * 0.618) % 1) * 68, a = r2.range(-1.0, 1.0), cell = r2.pick(cells), big = i % 5 === 0;
        prints.push([cardAt(pos.set(sd * (APSE.hw - 0.05), big ? r2.range(4.5, 7.5) : r2.range(0.8, 9.6), z), up.set(0, Math.cos(a), Math.sin(a)), V3(-sd, 0, 0), (big ? r2.range(4.2, 5.4) : r2.range(1.8, 3.4)) * (cell === C.frond ? 1.4 : 1)).clone(), [-1, r2(), 0, big ? C.hand : cell]]);
      }
      for (let i = 0; i < 8; i++) {                                  // the great leaves at the apse's mouth, read from the dome as the turn ends
        const sd = i % 2 ? -1 : 1, z = 235.5 + Math.floor(i / 2) * 7.2 + r2.range(-1, 1), a = r2.range(-0.7, 0.7);
        prints.push([cardAt(pos.set(sd * (APSE.hw - 0.05), r2.range(4.6, 8.2), z), up.set(0, Math.cos(a), Math.sin(a)), V3(-sd, 0, 0), r2.range(6.0, 7.4)).clone(), [-1, r2(), 0, i % 4 < 2 ? C.hand : C.fatsia]]);
      }
      // one great hand leaf on each wall beside the wheel, at mid height, and two more further back: each has its gecko (see below)
      for (const [sd, y, z, a, sc] of [[1, 6.9, 295.5, 0.12, 6.4], [-1, 7.3, 293, -0.1, 6.2], [1, 6.2, 282, -0.2, 5.6], [-1, 6.6, 278.5, 0.25, 5.8]])
        prints.push([cardAt(pos.set(sd * (APSE.hw - 0.05), y, z), up.set(0, Math.cos(a), Math.sin(a)), V3(-sd, 0, 0), sc).clone(), [-1, 0.3 + 0.1 * sd, 0, C.hand]]);
      {
        const rpp = makeRng(((ctx.seed | 0) * 211 + 5501) >>> 0);
        const nPr = Math.round(230 * (0.6 + 0.4 * detail));
        for (let i = 0; i < nPr; i++) {
          const inWing = i < nPr * 0.39, sd = i % 2 ? -1 : 1, z = inWing ? rpp.range(WING.z0 + 2, 166) : rpp.range(234, APSE.z1 - 1.5), clump = 0.3 + 0.7 * Math.abs(Math.sin(z * 0.21 + sd * 1.7));
          const a = rpp.range(-1.0, 1.0), cell = rpp.pick(cells), y = 0.3 + (inWing ? 4.6 : 8.6) * clump * Math.pow(rpp(), 1.5), sc = rpp.range(1.8, 3.6) * (cell === C.frond ? 1.4 : 1) * (0.7 + 0.5 * clump), sdv = rpp();
          if (!inWing && Math.abs(z - 287) < 13 && y > 3.2) continue;          // the great hand leaves and their geckos keep their milk
          prints.push([cardAt(pos.set(sd * ((inWing ? WING.hw : APSE.hw) - 0.05), y, z), up.set(0, Math.cos(a), Math.sin(a)), V3(-sd, 0, 0), sc).clone(), [-1, sdv, 0, cell]]);
        }
      }
      leafMesh(prints, style.leaf({ core: true, afterGlass: true, sway: 0.1, breath: 0.025 }), 3);
      // the apse's planting: low beds either side of a paved walk, all of it below the gutter
      const nB = Math.round(760 * density * (0.5 + 0.5 * detail));
      for (let i = 0; i < nB; i++) {
        const sd = r2() < 0.5 ? -1 : 1, x = sd * (2.9 + 7.7 * Math.sqrt(r2())), z = r2.range(233, APSE.z1 - 0.6);
        if (z < DZ + shellZ(x, 2) + 0.8) continue;
        const cell = r2.pick(cells), tall = (cell === C.frond ? r2.range(3.4, 5.6) : cell === C.lance ? r2.range(2.0, 3.6) : r2.range(1.6, 3.0)) * (1 + 0.5 * (Math.abs(x) - 4.2) / 6.4);
        const az = r2() * TAU, el = r2.range(0.45, 1.25);
        Yd.set(Math.cos(az) * Math.cos(el), Math.sin(el), Math.sin(az) * Math.cos(el));
        pos.set(x, r2.range(0.1, 1.0) + (Math.abs(x) > 8 ? r2.range(0.5, 3.4) : 0), z);
        beds.push([cardAt(pos, Yd, V3(0, 1, 0), tall).clone(), [apsePane(pos), r2(), r2.range(0.1, 0.45), cell]]);
      }
      // (seen from the nave's height the beds are metres below the lens: in the apse's plain light contact carries down to them, as it
      // does to the fern crowns, so the planting under and just ahead of the lens is crisp leaves and only the far beds are soft)
      leafMesh(beds, style.leaf({ core: true, sway: 0.045, reach: 0.18, coreS: 0.5, softFrom: 0.45 }), 0);
      leafMesh(beds, style.leaf({ sway: 0.045, reach: 0.18, fade: 1, coreS: 0.5, softFrom: 0.45 }), 2.4);
      await ctx.yield();
      // drops let go of the ribs of the wing and the apse and fall past the lens
      const nD = Math.round(110 * detail), a = new Float32Array(nD * 4);
      for (let i = 0; i < nD; i++) {
        const inWing = i % 2 === 0, hw = inWing ? WING.hw : APSE.hw, x = r2.range(-0.92, 0.92) * hw;
        const z = inWing ? wingRibZ[i % wingRibZ.length] + 0.2 : apseRibZ[i % apseRibZ.length] + 0.2;
        const top = inWing ? topOf(WING.hw, WING.spring, WING.rise, x) : topOf(APSE.hw, APSE.spring, APSE.rise, x);
        a.set([x, top - 0.4, z, r2()], i * 4);
      }
      const dg = new THREE.PlaneGeometry(2, 2); dg.setAttribute('aDrop', new THREE.InstancedBufferAttribute(a, 4));
      const dm = new THREE.InstancedMesh(dg, style.drops({ floorY: 0.1 }), nD); dm.frustumCulled = false; dm.renderOrder = 4; scene.add(dm);
    }
    await ctx.yield();
    // ================================================================ WHAT A HAND LEFT: the hose, the can, the cane chair
    {
      // a hose coiled on the grating in the wing, its tail running off under the ferns
      const hp = [], hr = [];
      for (let i = 0; i <= 150; i++) { const t = i / 150, a = t * TAU * 5.2, r = 0.34 + 0.42 * t; hp.push(V3(-0.75 + Math.cos(a) * r, 0.07 + 0.012 * Math.sin(a * 3.), 97.5 + Math.sin(a) * r)); hr.push(0.034); }
      for (let i = 1; i <= 14; i++) { const t = i / 14; hp.push(V3(-0.75 + 0.76 + t * 3.4, 0.07, 97.5 + 0.5 * Math.sin(t * 4.) + t * 2.2)); hr.push(0.034); }
      const hose = new THREE.Mesh(tube(hp, hr, 5, wingPane), style.stem({ scales: 0, far: 0.35 })); hose.renderOrder = 1; scene.add(hose);
      // the watering can on the pool kerb (white iron here: there is no brass in this glass)
      const ringAt = (c, r, y, face, n = 20) => { const pts = [], nrm = []; for (let i = 0; i <= n; i++) { const t = (i / n) * TAU; pts.push(V3(c.x + Math.cos(t) * r, y, c.z + Math.sin(t) * r)); nrm.push(V3(Math.cos(t), 0, Math.sin(t))); } return style.ironSweep(pts, nrm, face); };
      const k = hero.anchors.kerbSeat, can = V3(k.x, k.y, k.z + DZ), out = V3(k.x, 0, k.z).normalize();
      bars.push(ringAt(can, 0.24, can.y, [[0, 0, 0, 0.5]]), ringAt(can, 0.24, can.y + 0.5, [[-0.24, 0, 0, 0]], 12));
      const side = V3(-out.z, 0, out.x), sp = [], sn = [], hd = [], hn = [];
      for (let i = 0; i <= 5; i++) { const t = i / 5; sp.push(V3(can.x + side.x * (0.22 + 0.5 * t), can.y + 0.1 + 0.5 * t, can.z + side.z * (0.22 + 0.5 * t))); sn.push(V3(0, 1, 0)); }
      for (let i = 0; i <= 8; i++) { const a = -0.4 + (i / 8) * 3.5; hd.push(V3(can.x - side.x * (0.2 + 0.2 * Math.sin(a)), can.y + 0.3 - 0.26 * Math.cos(a) + 0.1, can.z - side.z * (0.2 + 0.2 * Math.sin(a)))); hn.push(out.clone()); }
      bars.push(style.ironSweep(sp, sn, style.boxSection(0.06, 0.06)), style.ironSweep(hd, hn, style.boxSection(0.05, 0.03)));
      // the cane chair by the stair
      const c = hero.anchors.chairSeat, ch = V3(c.x, 0, c.z + DZ), fw = V3(-c.x, 0, -c.z).normalize(), rt = V3(-fw.z, 0, fw.x), U3 = V3(0, 1, 0);
      const at = (f, r, y) => V3(ch.x + fw.x * f + rt.x * r, y, ch.z + fw.z * f + rt.z * r), leg = style.boxSection(0.035, 0.035);
      for (const [f, r] of [[0.24, 0.24], [0.24, -0.24], [-0.24, 0.24], [-0.24, -0.24]]) bars.push(style.ironSweep([at(f, r, 0), at(f, r, f < 0 ? 1.05 : 0.47)], [fw, fw], leg));
      bars.push(style.ironSweep([at(0.26, 0.26, 0.47), at(0.26, -0.26, 0.47), at(-0.26, -0.26, 0.47), at(-0.26, 0.26, 0.47), at(0.26, 0.26, 0.47)], [U3, U3, U3, U3, U3], leg));
      const bk = [], bn = []; for (let i = 0; i <= 10; i++) { const a = (i / 10) * Math.PI; bk.push(at(-0.24, 0.24 * Math.cos(a), 1.05 + 0.2 * Math.sin(a))); bn.push(fw.clone()); }
      bars.push(style.ironSweep(bk, bn, leg));
      for (const r of [-0.12, 0, 0.12]) bars.push(style.ironSweep([at(-0.24, r, 0.47), at(-0.24, r, 1.22)], [fw, fw], style.boxSection(0.02, 0.02)));
    }
    await ctx.yield();
    // ================================================================ THE SYRINGING (rare): a fine spray from a ring under the gallery
    let sprayMat = null;
    {
      const r2 = rng.fork ? rng.fork('fph-spray') : rng, n = Math.round(520 * detail), list = [];
      for (let i = 0; i < n; i++) { const a = (i / n) * TAU + r2.range(-0.02, 0.02), r = 26.8, c = Math.cos(a), s = Math.sin(a), inw = r2.range(1.5, 7.5);
        list.push([[c * r, 9.5, DZ + s * r, r2()], [-c * inw, -r2.range(4.2, 6.2), -s * inw, r2.range(1.2, 1.9)]]); }
      sprayMat = puffMat({ s0: 0.07, s1: 0.5, alpha: 0, wander: 0.25, soft: 0.1, tone: 0.7 });
      const sm = puffs(list, sprayMat, 4.7); sm.visible = rare;
      // the pipe it comes from
      const pts = [], nrm = []; for (let i = 0; i <= 96; i++) { const t = (i / 96) * TAU; pts.push(V3(Math.cos(t) * 26.9, 9.62, DZ + Math.sin(t) * 26.9)); nrm.push(V3(Math.cos(t), 0, Math.sin(t))); }
      bars.push(style.ironSweep(pts, nrm, style.boxSection(0.07, 0.07)));
    }





    // ================================================================ THE DOME'S BEDS: a ring of low planting between the pool walk and the drum
    {
      const r2 = rng.fork ? rng.fork('fph-domebeds') : rng, beds = [], pos = new THREE.Vector3(), Yd = new THREE.Vector3(), up = V3(0, 1, 0), Zb = new THREE.Vector3();
      const cells = [C.fatsia, C.lance, C.fatsia, C.heart, C.hand, C.frond, C.frond];
      const nB = Math.round(1000 * density * (0.5 + 0.5 * detail));
      for (let i = 0; i < nB; i++) {
        const a = r2() * TAU, rr = 20.5 + 8.3 * Math.sqrt(r2()), x = Math.cos(a) * rr, zl = Math.sin(a) * rr;
        const cell = r2.pick(cells), az = r2() * TAU, el = r2.range(0.75, 1.4), back = (rr - 20.5) / 8.3;
        const tall = (cell === C.frond ? r2.range(3.0, 5.0) : cell === C.lance ? r2.range(1.8, 3.2) : r2.range(1.4, 2.8)) * (0.8 + 0.6 * back);
        const y0 = r2.range(0.3, 1.7) + back * r2.range(0, 2.6);
        if (Math.abs(x) < 9.5 && Math.abs(zl) > 12) continue;          // the two ways through stay open
        Yd.set(Math.cos(az) * Math.cos(el), Math.sin(el), Math.sin(az) * Math.cos(el));
        pos.set(x, y0, DZ + zl);
        beds.push([cardAt(pos, Yd, i % 3 ? Zb.set(-Math.sin(az), 0.3, Math.cos(az)) : up, tall).clone(), [Math.max(0.3, R - rr), r2(), r2.range(0.1, 0.45), cell]]);
        if (i % 300 === 299) await ctx.yield();
      }
      leafMesh(beds, style.leaf({ core: true, sway: 0.045, reach: 0.11, coreS: 0.5, softFrom: 0.45 }), 0);
      leafMesh(beds, style.leaf({ sway: 0.045, reach: 0.11, coreS: 0.5, softFrom: 0.45, fade: 1 }), 2.4);
    }
    await ctx.yield();
    // ---- where the dome's beds reach the drum their last leaves lie flat on its panes: crisp prints round the foot of the
    // hull, under the gallery (never in the vault: the rosette stays the one dark shape up there), the white iron crossing them
    {
      const rd = makeRng(((ctx.seed | 0) * 71 + 6113) >>> 0), prints = [], pos = new THREE.Vector3(), Yd = new THREE.Vector3(), Nn = new THREE.Vector3();
      const cells = [C.fatsia, C.hand, C.heart, C.fatsia, C.frond, C.lance];
      for (let i = 0; i < 54; i++) {
        const big = i % 4 === 0, th = (i + rd.range(-0.3, 0.3)) / 54 * TAU, dA = Math.abs(Math.atan2(Math.sin(th), Math.cos(th)));
        const a = rd.range(-0.9, 0.9), cell = big ? (i % 8 ? C.fatsia : C.hand) : rd.pick(cells), y = big ? rd.range(2.2, 4.6) : rd.range(0.7, 6.4), sc = big ? rd.range(4.6, 6.2) : rd.range(1.8, 3.2) * (cell === C.frond ? 1.4 : 1);
        if (dA < 0.47 || dA > Math.PI - 0.54) continue;                // the two arches
        const rr = R - 0.12, sn = Math.sin(th), cs = Math.cos(th);
        pos.set(sn * rr, y, DZ + cs * rr);
        Yd.set(cs * Math.sin(a), Math.cos(a), -sn * Math.sin(a));
        prints.push([cardAt(pos, Yd, Nn.set(-sn, 0, -cs), sc).clone(), [-1, rd(), 0, cell]]);
      }
      for (let i = 0, nPd = Math.round(210 * (0.6 + 0.4 * detail)); i < nPd; i++) {   // (polish) a dark band of leaves round the foot of the hull, in clumps
        const th = rd() * TAU, dA = Math.abs(Math.atan2(Math.sin(th), Math.cos(th))), clump = 0.25 + 0.75 * Math.abs(Math.sin(th * 4.3 + 0.7));
        const a = rd.range(-0.9, 0.9), cell = rd.pick(cells), y = 0.3 + 8.4 * clump * Math.pow(rd(), 1.6), sc = rd.range(2.0, 4.2) * (cell === C.frond ? 1.4 : 1) * (0.7 + 0.5 * clump), sdv = rd();
        if (dA < 0.47 || dA > Math.PI - 0.54) continue;
        const rr = R - 0.12, sn = Math.sin(th), cs = Math.cos(th);
        pos.set(sn * rr, y, DZ + cs * rr);
        Yd.set(cs * Math.sin(a), Math.cos(a), -sn * Math.sin(a));
        prints.push([cardAt(pos, Yd, Nn.set(-sn, 0, -cs), sc).clone(), [-1, sdv, 0, cell]]);
      }
      leafMesh(prints, style.leaf({ core: true, afterGlass: true, sway: 0.1, breath: 0.025 }), 3);
    }
    await ctx.yield();
    // ================================================================ THE LOWEST FANS: four that hang 3 m over the lens as it climbs past
    {
      const r2 = rng.fork ? rng.fork('fph-fans') : rng, list = [], stalks = [], top = hero.anchors.trunkTop.clone().add(hero.object.position);
      const Yd = new THREE.Vector3(), Zd = new THREE.Vector3(), Xd = new THREE.Vector3(), hub = new THREE.Vector3(), mm = new THREE.Matrix4();
      for (const [u, lift, inb = 1.5] of [[0.66, 0], [0.676, 0], [0.69, 0], [0.704, -1.0], [0.716, -1.0], [0.73, -1.6, -2.6], [0.742, -2.4, -3.0], [0.727, -1.9, -3.4]]) {   // the last two hang low over the turn for the apse   // the last two hang low over the turn for the apse
        const P = path.pointAt(u);
        Yd.set(P.x - top.x, 0, P.z - top.z).normalize(); Yd.y = -0.32; Yd.normalize();
        Zd.set(0, 1, 0).addScaledVector(Yd, -Yd.y).normalize().applyAxisAngle(Yd, r2.range(-0.25, 0.25));
        Xd.crossVectors(Yd, Zd).normalize();
        const sc = 2.5 * r2.range(0.95, 1.1);
        hub.copy(P).addScaledVector(Yd, -inb); hub.y = P.y + r2.range(3.0, 3.5) + lift;
        const row = [mm.makeBasis(Xd, Yd, Zd).scale(_S.set(sc, sc, sc)).setPosition(hub).clone(), [8, r2(), r2.range(0.06, 0.14), 0]];
        if (u < 0.7) continue;                     // (polish 6: the wide climb passes 17 m off the trunk: no fan reaches out there; the draws stay)
        list.push(row);
        const pts = [], rad = [], ctl = top.clone().lerp(hub, 0.45); ctl.y += 2.0;
        for (let j = 0; j <= 8; j++) { const t = j / 8; pts.push(top.clone().multiplyScalar((1 - t) * (1 - t)).addScaledVector(ctl, 2 * t * (1 - t)).addScaledVector(hub, t * t)); rad.push(lerp(0.085, 0.035, t)); }
        stalks.push(tube(pts, rad, 5, () => 8));
      }
      {
        // one more, for the steady camera: at u 0.6 that gaze is level and looks far round the spiral, under the other fans.
        // This one hangs square to it, an arm's length up and ahead, so a crisp fan lies across the top third of that frame
        // (the ordinary camera, looking up at the crown, has it far out to its left).
        const P = path.posAtDist(0.6 * path.length, new THREE.Vector3()), D = path.posAtDist(0.6 * path.length + 48, new THREE.Vector3()).sub(P);
        D.y *= 0.5; D.normalize();
        const Rs = new THREE.Vector3().crossVectors(D, V3(0, 1, 0)).normalize(), Us = new THREE.Vector3().crossVectors(Rs, D).normalize();
        hub.copy(P).addScaledVector(D, 3.1).addScaledVector(Us, 2.35).addScaledVector(Rs, -0.9);
        Zd.subVectors(P, hub).normalize();
        Yd.copy(Rs).multiplyScalar(0.55).addScaledVector(Us, -0.83); Yd.addScaledVector(Zd, -Yd.dot(Zd)).normalize();
        Xd.crossVectors(Yd, Zd).normalize();
        // (polish 6: withdrawn with the climb fans: from the wide climb the steady camera has the palm itself)
      }
      // the young palms: seedlings of the great one, standing where the wing gives onto the dome, their fans an arm's
      // length to the right of the lens as it comes out under the hull (the dark, sharp foreground of the arrival)
      const Tg = new THREE.Vector3(), Rv = new THREE.Vector3(), root = new THREE.Vector3();
      for (let i = 0; i < 8; i++) {
        const u = 0.44 + i * 0.01, P = path.pointAt(u);
        Tg.subVectors(path.pointAt(u + 0.004), P).setY(0).normalize(); Rv.set(-Tg.z, 0, Tg.x);       // screen-right of the course
        for (let k = 0; k < 2; k++) {
          const lat = k ? r2.range(2.1, 2.6) : r2.range(1.05, 1.25), sc = (k ? 1.0 : 1.18) * r2.range(0.92, 1.08);
          hub.copy(P).addScaledVector(Rv, lat).addScaledVector(Tg, k ? r2.range(-1.2, 1.2) : 0); hub.y = P.y - (k ? r2.range(1.5, 2.1) : r2.range(0.95, 1.2));
          Yd.copy(Rv).multiplyScalar(k ? 0.75 : 0.42).addScaledVector(Tg, r2.range(-0.15, 0.25)); Yd.y = k ? 0.65 : 0.9; Yd.normalize();
          Zd.copy(Tg).multiplyScalar(-0.8).addScaledVector(Rv, -0.2); Zd.y = 0.5; Zd.addScaledVector(Yd, -Yd.dot(Zd)).normalize();
          Xd.crossVectors(Yd, Zd).normalize();
          list.push([mm.makeBasis(Xd, Yd, Zd).scale(_S.set(sc, sc, sc)).setPosition(hub).clone(), [8, r2(), r2.range(0.04, 0.1), 0]]);
          root.copy(P).addScaledVector(Rv, 1.5 + 0.3 * k).addScaledVector(Tg, 0.4); root.y = 0;
          const mid = root.clone().lerp(hub, 0.55); mid.y = hub.y * 0.72; mid.addScaledVector(Rv, 0.25);
          stalks.push(tube([root.clone(), mid, hub.clone()], [0.07, 0.05, 0.03], 5, () => 8));
        }
      }
      {
        // four more for the climb (u 0.47 to 0.58), where the gaze is on the crown and the frame was hull and nothing else: each hangs
        // over the course a little outboard, so it comes up dark and pleated from the side of the frame, clear of the rosette
        const rf = makeRng(((ctx.seed | 0) * 53 + 4111) >>> 0);
        const climb = [], cardC = style.cardGeometry(-1.5, 1.5, -1.05, 1.5, 6, 6); extra.push(cardC);
        for (const [u, out, upk] of [[0.6, 0.4, 2.4], [0.617, 0.2, 2.3], [0.633, 0.4, 2.4], [0.648, 0.3, 2.4]].slice(0, 0)) {     // (polish 6: withdrawn; a fan at arm's length here was cut by the frame and read as the camera in the foliage)
          const P = path.pointAt(u);
          Yd.set(P.x - top.x, 0, P.z - top.z).normalize();
          hub.copy(P).addScaledVector(Yd, out); hub.y = P.y + upk + rf.range(0, 0.4);
          Yd.y = -0.3; Yd.normalize();
          Zd.set(0, 1, 0).addScaledVector(Yd, -Yd.y).normalize().applyAxisAngle(Yd, rf.range(-0.25, 0.25));
          Xd.crossVectors(Yd, Zd).normalize();
          const sc = 2.0 * rf.range(0.95, 1.1);
          climb.push([mm.makeBasis(Xd, Yd, Zd).scale(_S.set(sc, sc, sc)).setPosition(hub).clone(), [8, rf(), rf.range(0.06, 0.14), 0]]);
          const pts = [], rad = [], ctl = top.clone().lerp(hub, 0.45); ctl.y += 2.0;
          for (let j = 0; j <= 8; j++) { const t = j / 8; pts.push(top.clone().multiplyScalar((1 - t) * (1 - t)).addScaledVector(ctl, 2 * t * (1 - t)).addScaledVector(hub, t * t)); rad.push(lerp(0.085, 0.035, t)); }
          stalks.push(tube(pts, rad, 5, () => 8));
        }
        // (in the open of the vault contact carries further for these four: each is dark and pleated from ten metres off, never a soft grey fan on the hull)
        await ctx.yield();
        if (climb.length) { leafMesh(climb, style.leaf({ fan: true, core: true, sway: 0.05, reach: 0.34 }), 0, cardC);
          leafMesh(climb, style.leaf({ fan: true, sway: 0.05, reach: 0.34, fade: 12 }), 2.5, cardC); }     // (gone by fifteen metres: never a soft fan lying on the hull)
      }
      await ctx.yield();
      const card = style.cardGeometry(-1.5, 1.5, -1.05, 1.5, 6, 6); extra.push(card);
      leafMesh(list, style.leaf({ fan: true, core: true, sway: 0.05, reach: 0.42 }), 0, card);
      leafMesh(list, style.leaf({ fan: true, sway: 0.05, reach: 0.42, fade: 5 }), 2.5, card);     // (polish 6: gone as soon as it softens: a soft grey fan on the hull read as a cast shadow, in a corner as a smear)     // (gone by ten metres: a soft fan on the hull reads as a shadow, and there are none)
      const sm = new THREE.Mesh(mergeGeometries(stalks), style.stem({ scales: 0, far: 0.0, depthWrite: false })); for (const g of stalks) g.dispose();
      sm.renderOrder = 2.9; scene.add(sm);     // under the rosette's print: a half-near stalk must not lie pale across it
    }
    await ctx.yield();
    // ================================================================ POLISH 6: THE SUN'S RAYS, PRINTED
    // The low sun comes through the misted glass on the patch's side and stands in the damp air as slim flat rays of the one pale
    // gold, each from a pane of the vault's haunch (or the drum) down to the bar of gold its bay lays on the floor: parallel, hard-
    // edged, flat (a print of light, like the bars; never a glow, never a gradient across). They lie in the planes of the floor's
    // own bands, so ray and bar always meet. None in the apse (nothing crosses the wheel pane), none above the gallery in the dome
    // (the rosette and its rules stay clean), and a ray lets go within a few metres of the lens.
    {
      const sv = U.uSun.value, dir = new THREE.Vector2(sv.x, sv.y), per = sv.z, wv = new THREE.Vector2(-dir.y, dir.x);
      // up the ray from its foot: across the hall toward the sun's side, 25 degrees above level, square to the course
      const aK = (0.9 * dir.y) / Math.max(1e-3, wv.y), rd = V3(-0.9 * dir.x + aK * wv.x, 1, 0), rl = Math.hypot(rd.x, 1);
      const wAx = V3(wv.x, 0, wv.y), pos = [], uvs = [], idx = [];
      const inHouse = (x, y, z) => (z > WING.z0 + 0.5 && z < 166 ? (Math.abs(x) < WING.hw - 0.25 && y < topOf(WING.hw, WING.spring, WING.rise, x) - 0.2)
        : Math.hypot(x, z - DZ) < R - 0.5 && y < 6.4);     // (in the dome only under the gallery, against the planting: never a streak across the ruled hull)
      const ray = (fx, fz, hw) => {
        let t = 0; while (t < 60 && inHouse(fx + rd.x * (t + 0.5), rd.y * (t + 0.5), fz)) t += 0.5;
        if (t < 3.4) return;
        // (polish 7) a shaft is a whole drawn shape standing in the middle distance: none passes within 7.5 m of the course (near the lens a ray was a pale streak across the frame, a pane over the picture)
        for (let q = 0; q <= 8; q++) { const tt = t * q / 8; if (path.distanceTo(fx + rd.x * tt, 0.06 + rd.y * tt, fz) < 5.0) return; }
        const b = pos.length / 3;
        for (const [tt, k] of [[0, 1], [t, 0.8]]) for (const s2 of [-1, 1]) { pos.push(fx + rd.x * tt + wAx.x * hw * k * s2, 0.06 + rd.y * tt, fz + wAx.z * hw * k * s2); uvs.push(s2, tt / t); }
        idx.push(b, b + 1, b + 2, b + 1, b + 3, b + 2);
      };
      const rr = makeRng(((ctx.seed | 0) * 97 + 1213) >>> 0);
      for (let k = Math.floor(70 / per); k < 240 / per; k++) for (let j = 0; j < 1; j++) {
        await ctx.yield();
        const c = (k + 0.34) * per;                    // (polish 7) one broad shaft to a bay's bar, as wide as the bar is deep: few, parallel, each a clear shape
        for (let x = -25.5; x <= 26; x += 5.6) {
          const fx = x + rr.range(-0.5, 0.5), fz = (c - fx * dir.x) / dir.y;     // the foot, on the bar: dot(foot, dir) = c
          if (inHouse(fx, 0.5, fz) && !(Math.hypot(fx, fz - DZ) < 15)) ray(fx, fz, rr.range(0.9, 1.3));
        }
      }
      if (pos.length) {
        const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2)); g.setIndex(idx);
        const rays = new THREE.Mesh(g, mat(/* glsl */`varying vec2 vUv; varying vec3 vWp;
          void main(){ vUv = uv; vec4 wp = modelMatrix * vec4(position, 1.); vWp = wp.xyz; gl_Position = projectionMatrix * viewMatrix * wp; }`,
          style.glsl.common + /* glsl */`uniform float uRayK; varying vec2 vUv; varying vec3 vWp;
          void main(){
            float a = uRayK * uSun.w * smoothstep(5., 7.5, distance(vWp, uLens)) * (1. - 0.35 * step(0.55, abs(vUv.x)));     // two flat tones: a denser core, a paler margin; cut edges
            if (a < 0.004) discard;
            gl_FragColor = vec4(cSun, a);
          }`, { uRayK: { value: hour === 'night' ? 0.22 : 0.42 } }, { transparent: true, depthWrite: false, side: THREE.DoubleSide }));
        rays.renderOrder = 4.2; rays.frustumCulled = false; scene.add(rays);
      }
    }
    await ctx.yield();
    // all the loose bars of the world in one mesh
    { const h = bars.length >> 1, gA = mergeGeometries(bars.slice(0, h)); await ctx.yield(); const gB = mergeGeometries(bars.slice(h)); await ctx.yield();
      const bm = new THREE.Mesh(mergeGeometries([gA, gB]), ironB); gA.dispose(); gB.dispose(); for (const b of bars) b.dispose(); bm.frustumCulled = false; scene.add(bm); }
    await ctx.yield();




    const trunkPoi = new THREE.Vector3(0, 24, DZ), trunkTmp = new THREE.Vector3();
    return {
      scene, path, duration: 41,
      pace: (u) => 1 - 0.27 * smoothstep(0.44, 0.5, u) * (1 - smoothstep(0.7, 0.77, u)),
      title: 'The Fogged Palm House',
      camera: { fov: 62, near: 0.15, far: 1600, lookAhead: 16, sway: 0.6, bank: 0.35 },
      // the gaze: the hand leaf; then up the trunk to the rosette as the dome opens; the crown through the climb; the wheel pane from the turn on
      // (the trunk itself, a little above the lens, through the spiral: it holds the palm in the picture for the steady camera too, which
      // takes every poi at a third of its weight and would otherwise look past the trunk along the hull)
      pois: [{ at: [FH.x, 3.6, 33.5], from: 0.03, to: 0.118, weight: 0.8 },
        { at: [-1, 17, 104], from: 0.118, to: 0.205, weight: 0.5 },                                   // the gable, its plume and the dome's cap
        { at: [0.5, 17, DZ], from: 0.36, to: 0.47, weight: 0.6 },                                   // the palm whole over its pool, from under the arch
        { at: [0, 1.2, DZ], from: 0.465, to: 0.55, weight: 0.8, fade: 0.2 },                   // down across the mirror: pads, island, the trunk's foot
        { at: [0, 35, DZ], from: 0.545, to: 0.66, weight: 0.95, fade: 0.25 },                 // (polish 6) the palm whole from the wide climb: trunk, crown and rosette, centred                              // up into the crown against the ruled hull
        { at: [3, 2, DZ + 15], from: 0.662, to: 0.742, weight: 0.9, fade: 0.3 },     // (polish 6: aimed at the far kerb, so the far walk, the beds and the drum's foot close the top of the frame)                  // (polish 4) from the top of the climb, straight down the trunk onto the pool: pads, gold, the island
        { at: [0, WHEEL.y, APSE.z1], from: 0.735, to: 0.84, weight: 0.55 }],
      portal: { shape: 'circle', radius: WHEEL.r, color: H.pal[6], glow: 0.18, halo: false, revealDistance: 420 },
      post: { flat: 1, exposure: 1, bloom: { strength: 0 }, grade: { saturation: 1, contrast: 1, vignette: 0, grain: 0 } },
      ride: 'none',
      style: 'none',
      update(dt, time, camera, u) {
        lens.setFromMatrixPosition(camera.matrixWorld);
        style.update(dt, time, camera);
        // outside, sharpness follows each card's pane; inside, the lens. The hand-over is at the open sash.
        style.setInside(smoothstep(68, 81, lens.z));
        for (let i = 0; i < tick.length; i++) tick[i](dt, time, camera, u, lens);
        if (rare) {
          // 21 s: the spray falls and every pane fogs whole over three seconds; then all the drops let go together and
          // the hull clears from the apex down into blue stripes over six; then it mists again
          const fog = smoothstep(0.5, 0.553, u) * (1 - smoothstep(0.7, 0.76, u));
          const let_go = smoothstep(0.553, 0.565, u) * (1 - smoothstep(0.69, 0.75, u));
          style.setSyringe(fog); style.setFlush(1.15 * smoothstep(0.553, 0.665, u), let_go);
          sprayMat.uniforms.uPuff.value.z = 0.7 * smoothstep(0.492, 0.51, u) * (1 - smoothstep(0.55, 0.575, u));
        }
        hero.update(dt, time, camera);
      },
      dispose() { style.dispose(); hero.dispose(); for (const d of extra) d.dispose(); },
    };

  },
};
