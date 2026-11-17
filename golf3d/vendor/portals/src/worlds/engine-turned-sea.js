// THE ENGINE-TURNED SEA: an archipelago of jewelled eggs standing in a sea of blue enamel over engine-turned
// silver. The Great Egg flowers open once, rose gores and primrose petals together; the portal sits in a mauve saucer at its heart with a gold
// clockwork bird on its ring. The route rises over the open flower and looks down into it, then turns onto the railed gangway.
// Two jewelled eggs stand by the Great Egg on the side away from the gangway (one of mauve enamel over white silver turning in a thin gold trellis, one of green
// scales opening 40 percent on its gold tree). Every lesser egg stands mirrored in the sea, analytically and opaque. The sky is one clean
// tent of the brief, drawn from the same etsSky every surface mirrors (periwinkle zenith, pearl belt to 18 degrees, three faint bars at the zenith,
// a hard horizon, one pixel and a half of analytic blend); the sea is a sheet of enamel over engraving whose cut lines turn pearl in the swell bands (in the part), satin ultramarine under the horizon.
// No lights, no fog: every pixel mirrors one analytic light tent (SKY_GLSL from the hero part).
import * as THREE from 'three';
import { makePath, clamp, smoothstep } from '../kit/core.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { buildHero, SKY_GLSL } from '../parts/engine-turned-sea.js';

const TAU = Math.PI * 2;

// one vertex shader for every instanced jewel of the world (eggs, gores, pads, leaves, gems, pearls)
const VERT = /* glsl */`
attribute vec4 aTint;      // rgb enamel tint, a = kind (0 enamel, 1 gold, 2 gem, 3 pearl)
attribute vec4 aAnim;      // x phase, y shiver amount, z spin rate, w pattern scale
attribute vec4 aPat;       // x: the cut under the glass (0 wave rings, 1 crossed twist, 2 scales, 3 rings in a gold trellis); the rest spare
uniform float uTime;
varying vec3 vN, vW, vTint; varying vec2 vUv; varying float vKind, vPh, vScale, vCut;
void main(){
  vec3 p = position; vec3 n = normal; vCut = aPat.x;
  float sp = aAnim.z * uTime + aAnim.x;
  float c = cos(sp * step(0.0001, abs(aAnim.z))), s = sin(sp * step(0.0001, abs(aAnim.z)));
  p.xz = mat2(c, -s, s, c) * p.xz; n.xz = mat2(c, -s, s, c) * n.xz;
  float sh = aAnim.y * sin(uTime * 5.3 + aAnim.x * 7.0);
  p.y += sh * p.x; n = normalize(n + vec3(-sh, 0.0, 0.0) + vec3(0.0, 1e-5, 0.0));
  vec4 w = modelMatrix * instanceMatrix * vec4(p, 1.0);
  w.y += min(aAnim.y, 0.06) * 2.6 * (0.55 + 0.55 * sin(uTime * 1.4 + aAnim.x * 3.0));                 // pads bob on the swell
  if (aTint.a > 2.5) w.xz += 0.24 * step(0.0001, abs(aAnim.z)) * vec2(cos(sp), sin(sp));   // pad pearls roll round their pads
  vN = normalize(mat3(modelMatrix) * mat3(instanceMatrix) * n + vec3(0.0, 1e-6, 0.0));
  vW = w.xyz; vUv = uv; vTint = aTint.rgb; vKind = aTint.a; vPh = aAnim.x; vScale = aAnim.w;
  gl_Position = projectionMatrix * viewMatrix * w;
}`;

const FRAG = SKY_GLSL + /* glsl */`
uniform float uTime, uGoldBand, uPixelAngle;
varying vec3 vN, vW, vTint; varying vec2 vUv; varying float vKind, vPh, vScale, vCut;
void main(){
  vec3 Vd = vW - cameraPosition; float dist = max(length(Vd), 1e-3); vec3 V = Vd / dist;
  vec3 N = normalize(vN + vec3(0.0, 1e-5, 0.0)); if (!gl_FrontFacing) N = -N;
  float nv = clamp(dot(N, -V), 0.0, 1.0);
  vec3 up = vec3(0.0, 1.0, 0.0);
  vec3 T = up - N * dot(N, up); float tl = length(T); T = mix(vec3(1.0, 0.0, 0.0), T / max(tl, 1e-3), step(0.05, tl));
  vec3 B = cross(N, T);
  // the cut under the glass: a coarse wave family along the meridian, a fine one for close passes
  float f = vUv.y * 90.0 * vScale + 1.4 * sin(vUv.x * 6.2832 * 12.0);
  float f2 = vUv.x * 6.2832 * 48.0 + 0.8 * sin(vUv.y * 40.0);
  // the jewelled eggs that stand by the route are each cut their own way: lines two pixels wide or more, gone to satin when their pitch is too fine for the pixels
  float lon = vUv.x * 6.2832, own = step(0.5, vCut);
  float fa = f, fb = f2;
  if (vCut > 0.5) {
    if (vCut < 1.5) { fa = 16.0 * lon + 44.0 * vUv.y; fb = 16.0 * lon - 44.0 * vUv.y; }                    // two twists crossing: a lozenge of light that visibly turns
    else if (vCut < 2.5) {                                                                                  // scales, each a fan of arcs
      float v = vUv.y * 9.0, row = floor(v);
      vec2 cq = vec2((fract(lon * 2.5465 + 0.5 * mod(row, 2.0)) - 0.5) * 1.25, fract(v) - 1.0);
      fa = 7.0 * sqrt(dot(cq, cq) + 1e-8); fb = fa;
    } else { fa = 70.0 * vUv.y + 1.6 * sin(lon * 16.0); fb = fa; }                                          // close wavy rings, bound in a gold trellis
  }
  // No derivatives: the rate of each cut's phase per pixel comes from its pitch on the shell (ga, gb, gt: radians a metre), the range, N.V and
  // uPixelAngle. A line is never under two pixels wide, and a cut whose pitch falls under about six pixels goes to plain satin.
  float eh = max(40.0 * vScale, 1.0), er = max(0.335 * eh * sin(3.1416 * clamp(vUv.y, 0.0, 1.0)), 0.06 * eh), em = 1.34 * eh;
  float ga = 1.0, gb = 1.0;
  if (vCut > 0.5) {
    if (vCut < 1.5) { ga = sqrt(256.0 / (er * er) + 1936.0 / (em * em)); gb = ga; }
    else if (vCut < 2.5) { ga = 7.0 * max(3.18 / er, 6.0 / em); gb = ga; }
    else { ga = sqrt(4900.0 / (em * em) + 655.0 / (er * er)); gb = ga; }
  }
  float pxm = dist * uPixelAngle / max(nv, 0.08);                                                           // metres of shell under one pixel
  float wa = max(ga * pxm, 1e-4), wb = max(gb * pxm, 1e-4);
  float hair = own * max((1.0 - smoothstep(0.4 * wa, 0.7 * wa, abs(sin(0.5 * fa)))) * (1.0 - smoothstep(0.97, 1.8, wa)), (1.0 - smoothstep(0.4 * wb, 0.7 * wb, abs(sin(0.5 * fb)))) * (1.0 - smoothstep(0.97, 1.8, wb)));
  float hsat = own * 0.3 * smoothstep(0.97, 1.8, min(wa, wb));                                              // a cut gone to satin keeps its lines' mean cover as depth
  // the gold trellis is a mount, never a field: six thin bands each way, two pixels wide where that covers under a quarter of the shell, else capped there
  float ta = 6.0 * lon + 15.0 * vUv.y, tb = 6.0 * lon - 15.0 * vUv.y;
  float wu = 0.55 * sqrt(36.0 / (er * er) + 225.0 / (em * em)) * pxm, wt = clamp(wu, 0.06, 0.14);
  float trellis = step(2.5, vCut) * (1.0 - smoothstep(wt, wt * 1.35, min(abs(sin(0.5 * ta)), abs(sin(0.5 * tb))))) * step(0.03, vUv.y) * (1.0 - step(0.9, vUv.y)) * (1.0 - smoothstep(0.5, 0.9, wu));
  float keep = mix(1.0, 1.0 - smoothstep(0.6, 1.5, max(wa, wb)), own);                                      // a cut too fine for the pixels goes to plain satin instead of shimmering
  f = fa; f2 = fb;
  float fine = 1.0 - smoothstep(60.0, 260.0, dist);
  float bend = (0.3 * cos(f) + 0.14 * cos(f2) * fine) * keep;
  vec3 Nb = normalize(N + bend * T + 0.12 * cos(f2) * fine * keep * B);
  vec3 col;
  float gold = step(0.5, vKind) * (1.0 - step(1.5, vKind));
  // gold girdle and rim bands on shells (uv.y near the hinge line)
  float band = uGoldBand * (1.0 - smoothstep(0.012, 0.02, abs(vUv.y - 0.36)));
  band = max(band, uGoldBand * smoothstep(0.468, 0.488, abs(fract(vUv.x * 8.0) - 0.5)) * step(0.36, vUv.y) * (1.0 - step(2.5, vCut)));   // (the trellised egg has its trellis for ribs)
  gold = max(gold, max(band, trellis * uGoldBand)); if (!gl_FrontFacing && uGoldBand > 0.5) gold = 1.0;
  if (vKind > 2.5) {                                   // pearl: soft mirror plus a broad lobe
    vec3 R = reflect(V, N);
    vec3 Nl = normalize(N + vec3(0.0, 0.9, 0.0) + vec3(1e-4));
    col = (mix(etsSky(vec3(R.x, abs(R.y) * 0.35 + 0.07, R.z)), etsSky(vec3(Nl.x, abs(Nl.y) * 0.2 + 0.05, Nl.z)), 0.6) * 0.8 + uSeaAvg * 0.25 * (1.0 - nv)) * vTint + 0.25 * etsSun(R, 0.02);
  } else if (vKind > 1.5) {                            // gem: flat facets mirroring the tent, a limited flash
    vec3 R = reflect(V, N);
    float lobe = 0.5 + 0.5 * cos(dot(R, vec3(3.1, 4.7, 2.3)) * 1.1 + vPh * 6.2832 + uTime * 0.9);   // slow lobes: a turning stone flashes under 3 times a second
    float fl = lobe * lobe; fl = fl * fl; fl = fl * fl; fl = fl * fl;
    col = etsSky(R) * vTint * 0.9 + vTint * 5.0 * fl;
  } else {
    vec3 R = reflect(V, Nb);
    vec3 wide = etsSky(normalize(vec3(R.x, abs(R.y) * 0.5 + 0.1, R.z)));
    vec3 silver = mix(etsSky(R), wide, 0.55) * vec3(0.97, 0.97, 0.95);
    silver = mix(silver, max(silver, uBelt * 0.62), 1.0 - step(0.08, vScale));
    float leaf = 1.0 - step(0.08, vScale);              // tree leaves are thin glass: they keep their green at any angle
    // (the brief's law: the glass is thicker over every cut. On the two jewelled eggs each cut line is a deeper channel, 1.25 path lengths more in the
    // scales and 1.85 in the rings, so it reads the enamel's own rim colour under the glass; no light is added on a line)
    float path = 1.0 / max(mix(0.25, 0.8, leaf), nv) + mix(0.5 * (0.5 - 0.5 * sin(f)), mix(1.25, 1.85, step(2.5, vCut)) * (hair + hsat), step(0.5, vCut));
    // the two jewelled eggs by the route (scales, trellis) are enamel over white silver: the ground is still the mirrored tent, light where it mirrors
    // the belt and dark where it mirrors the lower sky, with only the tent's blue taken out, so the glass reads the palette's own colour face on and
    // deepens where the path through it lengthens at the rim
    float tre = step(2.5, vCut), wsil = step(1.5, vCut);
    silver = mix(silver, vec3(clamp(dot(silver, vec3(0.25, 0.5, 0.25)) * 5.5, 0.4, 1.15)), 0.85 * wsil);   // (the tent's zenith is 0.17 linear: a white silver that mirrors it face on)
    vec3 glass = silver * exp(log(clamp(vTint, vec3(0.02), vec3(1.0))) * (path + 2.4 * wsil * (1.0 - nv) * (1.0 - nv)) * (0.95 + 0.12 * wsil));
    float rk = mix(1.0, 0.25, step(2.5, vCut));          // the trellised egg's gold is chased four times as wide, so it holds as relief (never a pixel stipple) from across the water
    float lr = 0.5 + 0.5 * cos(vUv.x * 6.2832 * 64.0 * rk) * cos(vUv.y * 400.0 * vScale * rk);
    vec3 Rg = reflect(V, normalize(N + 0.3 * (lr - 0.5) * T));
    vec3 gsky = mix(etsSky(Rg), etsSky(normalize(vec3(Rg.x, abs(Rg.y) * 0.5 + 0.1, Rg.z))), 0.6);
    vec3 gcol = gsky * vec3(1.0, 0.78, 0.34) * (0.85 + 0.3 * lr);
    // the trellised egg's mounts mirror the tent with its blue taken out, through the brief's gold reflectance (1.0, 0.78, 0.34): about two bounces in
    // the light (#D9B25A), three and more where the chasing turns from it (#6E4A14)
    float gl = clamp(dot(gsky, vec3(0.25, 0.5, 0.25)), 0.02, 1.4);
    gcol = mix(gcol, min(6.7 * gl * sqrt(gl), 0.78) * exp(vec3(0.0, -0.2485, -1.0788) * mix(3.2, 1.8, smoothstep(0.08, 0.25, gl))) * (0.85 + 0.3 * lr), tre);
    col = mix(glass, gcol, gold);
    vec3 Rc = reflect(V, N);
    float fr = 1.0 - nv; float f5 = fr * fr; f5 = f5 * f5 * fr;
    col += (0.04 + 0.96 * f5) * etsSky(Rc) * (1.0 - 0.6 * gold) * (1.0 - 0.6 * wsil) + 1.2 * etsSun(Rc, 0.0006);   // (the two jewelled eggs' rims deepen: less of the tent in their top coat)
    col += uBelt * 0.26 * (1.0 - 0.5 * wsil) * (1.0 - gold) * (1.0 - leaf) * smoothstep(-0.04, 0.02, Rc.y) * (1.0 - smoothstep(0.2, 0.34, Rc.y)) * (0.75 + 0.25 * cos(f) * keep);   // glass over silver: the pearl belt as one crisp band in the top coat
    col = etsClamp(col);
    // far eggs go satin and take a little of the pale belt
    col = mix(col, uBelt, 0.35 * smoothstep(300.0, 1500.0, dist));   // (the coat takes up to 35 percent of the pale belt by 1.5 km; nothing else)
  }
  gl_FragColor = vec4(col, 1.0);
}`;

// THE EGGS' IMAGES IN THE SEA BEYOND THE TEN. The sea's own shader mirrors the ten lesser eggs that matter most to the eye; every other egg, the far
// ones too, is mirrored the same analytic way by a patch of the sheet laid where its image falls. The patch is opaque and depth-tested like the sheet
// it lies on: its shader is the sea's own (ground, cut, satin and bands from the sky chunk) with the egg's image mixed in by the same function the
// sea uses, so where the mirrored ray misses the egg nothing is drawn and where the image thins with range the patch is the sea exactly. No blending.
const IMG_VERT = /* glsl */`
attribute vec4 aBase;      // the egg: x, z, height
attribute vec3 aTintI;
attribute float aW;        // 0 = the sea's own shader is showing this egg's image whole
varying vec3 vT, vP, vE;
void main(){
  vec2 toC = cameraPosition.xz - aBase.xy; float dl = sqrt(dot(toC, toC) + 1e-4);
  vec2 right = vec2(-toC.y, toC.x) / dl;
  // a patch that bounds the image: an outline wider than the egg (position.x across, position.y up, in heights), each point carried to where its
  // mirror image meets the sea plane
  float h = max(cameraPosition.y, 0.5), y = max(position.y * aBase.z, -0.5 * h);
  vec2 pxz = aBase.xy + right * (position.x * aBase.z);
  vec2 img = cameraPosition.xz + (pxz - cameraPosition.xz) * (h / (h + y));
  vT = aTintI; vE = aBase.xyz; vP = vec3(img.x, 0.0, img.y);
  gl_Position = projectionMatrix * viewMatrix * vec4(vP, 1.0);
  if (aW < 0.5) gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
}`;
const IMG_FRAG = SKY_GLSL + /* glsl */`
uniform float uTime, uPixelAngle, uRefOn;
uniform vec3 uRefC, uRefR;                      // the Great Egg's own image zone, shared with the sea's material
varying vec3 vT, vP, vE;
void main(){
  vec3 Vv = cameraPosition - vP; float dist = max(length(Vv), 0.05); vec3 V = Vv / dist;
  float nv = clamp(V.y, 0.0, 1.0);
  vec3 R = vec3(-V.x, V.y, -V.z);
  vec4 im = etsEggImage(vP, R, vE, vT);
  // where the sheet shows the Great Egg's own image, that image hides this one
  vec3 ir = 1.0 / max(uRefR, vec3(1e-3));
  vec3 o = (vP - uRefC) * ir, d = R * ir;
  float qa = max(dot(d, d), 1e-8), qb = dot(o, d), qc = dot(o, o) - 1.0;
  float zone = uRefOn * smoothstep(0.0, 0.3, (qb * qb - qa * qc) / qa) * max(step(qb, 0.0), step(qc, 0.0));
  // as strong as the sea's own ten images near by, thinning into the satin with range
  float k = 0.85 * im.a * (1.0 - 0.75 * smoothstep(700.0, 2600.0, dist)) * (1.0 - smoothstep(0.0, 0.5, zone));
  if (k < 0.004) discard;
  vec3 col = mix(etsSeaGround(V, nv, dist), im.rgb, k);
  vec2 h1 = etsSeaCut(vP.xz, V, nv, dist, uTime, uPixelAngle);
  col = etsSeaSatin(col, V, nv, 1.5 * uPixelAngle, h1.x, h1.y);
  gl_FragColor = vec4(etsClamp(col), 1.0);
}`;

const DOME_FRAG = SKY_GLSL + /* glsl */`
uniform float uTime, uPixelAngle;
varying vec3 vDir;
void main(){
  vec3 d = normalize(vDir + vec3(0.0, 1e-6, 0.0));
  // The horizon is one straight hard line: sea below, tent above, met across a pixel and a half (no derivatives: uPixelAngle), so a rolled horizon
  // never steps in blocks.
  float he = 0.75 * uPixelAngle, hz = smoothstep(-he, he, d.y);
  vec3 c = vec3(0.0), cs = vec3(0.0);
  if (d.y < he) {
    // below the horizon the dome is the sea itself, its cut gone to satin and the swell bands surviving in it: the sheet's rim never shows
    float ny = max(-d.y, 0.0);
    cs = etsSeaSatin(etsSeaBase(ny, vec2(0.0), 0.0) + etsSky(vec3(d.x, ny, d.z)) * 0.05, vec3(-d.x, ny, -d.z), ny, 1.5 * uPixelAngle, 0.0, 1.0);
  }
  if (d.y > -he) {
    // THE TENT is the one sky every surface mirrors: periwinkle zenith, the pearl belt from the hard horizon to 18 degrees (brightest at 6), three
    // faint bars across the zenith. Nothing is painted over it but the sun. (The direction is held 0.7 degrees up so the horizon stays a hard line.)
    c = etsSky(vec3(d.x, max(d.y, 0.0125), d.z)) + vec3(1.0, 0.97, 0.9) * 6.0 * etsSun(d, 0.0004);
    // a jewelled sun: sixteen cut rays and a ring of brilliants round the disc
    float sm = dot(d, uSunDir);
    vec3 sx = cross(uSunDir, vec3(0.0, 1.0, 0.0)); sx /= max(length(sx), 1e-4);
    vec3 sy = cross(sx, uSunDir);
    float px = dot(d, sx), py = dot(d, sy), pr = sqrt(px * px + py * py);
    float pa = atan(py, pr < 1e-5 ? 1.0 : px);
    float ray = 0.5 + 0.5 * cos(16.0 * pa + uTime * 0.05); ray *= ray; ray *= ray; ray *= ray;
    float sunUp = step(0.0, uSunDir.y) * step(0.0, sm);
    c += vec3(1.0, 0.95, 0.85) * sunUp * (0.5 * ray * exp(-pr / 0.09) * smoothstep(0.03, 0.06, pr) + 0.25 * exp(-pr / 0.05));
    float hb = (pr - 0.075) / 0.006;
    float gemr = 0.5 + 0.5 * cos(24.0 * pa); gemr *= gemr; gemr *= gemr;
    c += vec3(1.0, 0.97, 0.9) * sunUp * 2.5 * exp(-min(hb * hb, 30.0)) * gemr;
  }
  gl_FragColor = vec4(mix(cs, c, hz), 1.0);
}`;
const DOME_VERT = /* glsl */`
varying vec3 vDir;
void main(){ vDir = position; vec4 p = projectionMatrix * viewMatrix * vec4(position + cameraPosition, 1.0); if (abs(p.w) < 1e-4) p.w = 1e-4; gl_Position = p.xyww; }`;

const COLOURWAYS = [
  ['#8FA8E0', '#F1C9C4', '#F2E3A0', '#B79AD6', '#A9D6A0', '#D9B25A', '#F7F8FF'],
  ['#7FCDB8', '#F2A58E', '#F1E2A8', '#6C6FC4', '#C9DDA0', '#D9B25A', '#F7F8FF'],
  ['#D9DEE8', '#D8443C', '#3FA871', '#3F5FC8', '#E6C86A', '#D9B25A', '#F7F8FF'],
];

function eggProfile(y0, y1, n) {            // unit egg: height 1, girdle at y 0.36, radius 0.34
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const y = y0 + (y1 - y0) * i / n; let r;
    if (y < 0.36) r = 0.34 * Math.sqrt(Math.max(0, 1 - ((0.36 - y) / 0.5) ** 2));
    else { const s = (y - 0.36) / 0.64; r = 0.34 * Math.sqrt(Math.max(0, 1 - s * s)) * (1 - 0.14 * s * s); }
    pts.push(new THREE.Vector2(Math.max(r, 0.0005), y));
  }
  return pts;
}
function fixUv(g, k) { const p = g.attributes.position, uv = g.attributes.uv; for (let i = 0; i < p.count; i++) uv.setXY(i, uv.getX(i) * k, p.getY(i)); return g; }

export default {
  id: 'engine-turned-sea',
  name: 'The Engine-Turned Sea',
  category: 'bizarre',
  weirdness: 0.8,
  media: ['air', 'open', 'water'],
  async build(ctx) {
    const rng = ctx.rng, detail = ctx.quality?.detail ?? 1, vary = ctx.vary || {};
    const scene = new THREE.Scene();
    // ---- variations: tent, colourway, cast ---------------------------------------------------
    let tent = rng.int(0, 2);                     // 0 noon pearl, 1 evening, 2 overcast
    if (vary.hour === 'golden' || vary.hour === 'dawn') tent = 1; else if (vary.hour === 'day') tent = 0;
    const way = rng.int(0, 2), pal = COLOURWAYS[way];
    const nEggs = Math.round(rng.range(30, 40) * clamp(vary.density ?? 1, 0.8, 1.15));
    const nShoals = rng.int(2, 4), goldEels = rng.chance(0.4), rare = !!vary.rare;
    const C = (h, k = 1) => new THREE.Color(h).multiplyScalar(k);

    // ---- the Great Egg and the path -----------------------------------------------------------
    const E = new THREE.Vector3(80, 0, 575), rotY = -Math.PI / 3;
    const sunEl = (tent === 1 ? 12 : tent === 2 ? -20 : 38) * Math.PI / 180;
    const sunDir = new THREE.Vector3(-0.866 * Math.cos(sunEl), Math.sin(sunEl), 0.5 * Math.cos(sunEl)).normalize();
    // under the overcast tent the three nested enamels are cut deeper, so rose, primrose and mauve stay saturated against grey
    const deepen = (h, k) => { const c = new THREE.Color(h); c.setRGB(Math.pow(c.r, k), Math.pow(c.g, k), Math.pow(c.b, k)); return '#' + c.getHexString(); };
    const heroPal = tent === 2 ? pal.map((h, i) => (i >= 1 && i <= 3 ? deepen(h, [0, 1.45, 1.15, 1.3][i]) : h)) : pal;
    const hero = await buildHero(ctx, { palette: heroPal, detail, progress: 0, apron: true, apronRadius: 3600, portalGlow: false, sunDir, rampMirror: true });
    hero.object.position.copy(E); hero.object.rotation.y = rotY; hero.object.updateMatrixWorld(true);
    scene.add(hero.object);
    if (hero.parts.glow) hero.parts.glow.visible = false;
    const SU = hero.skyUniforms;
    if (tent === 1) { SU.uBelt.value.set(1.3, 0.92, 0.6); SU.uZenith.value.set(0.17, 0.2, 0.5); }
    if (tent === 2) { SU.uBelt.value.set(1.12, 1.1, 1.08); SU.uZenith.value.set(0.34, 0.37, 0.48); }
    await ctx.yield();
    const seatY = hero.anchors.portalSeat.position.y;
    const L = (l) => { const p = new THREE.Vector3(0, seatY - Math.tan(14 * Math.PI / 180) * l, l); return hero.object.localToWorld(p); };
    // THE ROUTE. Across the sea to the Egg's port side while it flowers open, then up over the front petals (above every tip, 160 to 180 m) to look down into
    // the open flower at the saucer, the portal's ring and the bird on it, out over the gangway, a descending turn in front of it with the archipelago behind,
    // and in along the gangway's line from 200 m. The eggs, pads and ambient creatures stand where the first route (kept as "place") put them.
    const LW = (x, y, z) => hero.object.localToWorld(new THREE.Vector3(x, y, z));
    const head = [[0, 5, 0], [0, 5, 60], [0, 5, 110], [-25, 5.5, 200], [-62, 6.5, 300]];
    const place = makePath([...head, [-100, 9, 400], [-128, 12, 480], [-158, 16, 548], [-180, 21.5, 600], [-179.6, 28, 643.5], [-165.6, 34, 665.4], [-123.2, 39, 683], L(200), L(130), L(60), L(0)]);
    const pts = [...head, LW(-262, 22, 50), LW(-205, 72, 105), LW(-135, 138, 128), LW(-62, 176, 116), LW(10, 150, 158), LW(62, 112, 205), LW(92, 78, 250), LW(70, 52, 292), LW(22, 42, 290), L(200), L(130), L(60), L(0)];
    const path = makePath(pts);
    await ctx.yield();
    const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _c = new THREE.Vector3(), gazeAt = new THREE.Vector3();
    const P = (u, out) => place.curve.getPointAt(clamp(u, 0, 1), out);            // placing: along the first route
    const PC = (u, out) => path.curve.getPointAt(clamp(u, 0, 1), out);            // moving creatures: along the route we fly
    const side = (u, d, out) => { P(u, out); place.curve.getTangentAt(clamp(u, 0, 1), _b); return out.set(out.x - _b.z * d, 0, out.z + _b.x * d); };   // d > 0 = starboard

    // ---- the light tent's dome ----------------------------------------------------------------
    await ctx.yield();
    const dome = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 16), new THREE.ShaderMaterial({ uniforms: { ...SU }, vertexShader: DOME_VERT, fragmentShader: DOME_FRAG, side: THREE.BackSide, depthWrite: false, depthTest: false, fog: false }));
    dome.frustumCulled = false; dome.renderOrder = -10; scene.add(dome);

    // ---- one material for every instanced jewel ------------------------------------------------
    const mkMat = (goldBand, sideMode) => new THREE.ShaderMaterial({ uniforms: { ...SU, uGoldBand: { value: goldBand } }, vertexShader: VERT, fragmentShader: FRAG, side: sideMode, fog: false });
    const matShell = mkMat(1, THREE.DoubleSide), matJewel = mkMat(0, THREE.DoubleSide);
    const inst = (geo, mat, n, name) => {
      const m = new THREE.InstancedMesh(geo, mat, n); m.name = name; m.frustumCulled = false;
      geo.setAttribute('aTint', new THREE.InstancedBufferAttribute(new Float32Array(n * 4), 4));
      geo.setAttribute('aAnim', new THREE.InstancedBufferAttribute(new Float32Array(n * 4), 4));
      geo.setAttribute('aPat', new THREE.InstancedBufferAttribute(new Float32Array(n * 4), 4));
      scene.add(m); return m;
    };
    const setI = (m, i, mat4, tint, kind, ph, shiver, spin, sc) => {
      m.setMatrixAt(i, mat4); m.geometry.attributes.aTint.setXYZW(i, tint.r, tint.g, tint.b, kind); m.geometry.attributes.aAnim.setXYZW(i, ph, shiver, spin, sc);
    };
    const M = new THREE.Matrix4(), M2 = new THREE.Matrix4(), Q = new THREE.Quaternion(), S3 = new THREE.Vector3(), Y = new THREE.Vector3(0, 1, 0), X = new THREE.Vector3(1, 0, 0);

    // ---- the lesser eggs: where they stand -----------------------------------------------------
    const tints = [C(pal[1]), C(pal[2]), C(pal[3]), C(pal[4]), C('#E9E2D2'), C(pal[0]).lerp(C('#B9C4F2'), 0.4)];
    const eggs = [], RING = 215;   // RING: no dealt egg's shell comes within this of the Great Egg's axis
    const farFromAll = (x, z, r) => eggs.every((e) => Math.hypot(e.x - x, e.z - z) > e.H * 0.34 + r + 8);
    const addEgg = (x, z, H, tint, u0) => { const e = { x, z, H, tint, u0, open: u0 >= 0, rot: rng.range(0, TAU), k: 0 }; eggs.push(e); return e; };
    side(0.1, -120, _a); addEgg(_a.x, _a.z, 34, tints[4], -1);                    // the oyster egg to port
    side(0.185, 22, _a); addEgg(_a.x, _a.z, 36, tints[3], -1);                    // the apple-green egg, its girdle at arm's length
    const openU = [0.26, 0.34, 0.43, 0.5, 0.58, 0.66], openAt = [0.2, 0.215, 0.3, 0.36, 0.42, 0.5];
    for (let i = 0; i < openU.length; i++) {                                    // six small eggs that open on gold trees as we come (the second is open by u 0.3)
      const H = rng.range(21, 29); side(openU[i] + (i === 1 ? 0.058 : 0.035), (i === 2 ? -1 : 1) * (H * 0.34 + rng.range(11, 15) + (i === 2 ? 24 : 0)), _a);
      addEgg(_a.x, _a.z, H, tints[[5, 1, 2, 3, 4, 0][i]], openAt[i]);
    }
    // ---- the two jewelled eggs that stand by the Great Egg, in its own coordinates and in the same places on every seed (how each is turned at
    // the start, its leaves and its girdle stones are dealt from their own stream, 'added-eggs', below).
    // WHERE THEY STAND: a rule in the Great Egg's own plan, with nothing in it taken from the lens. Both stand on the circle midway between the Egg's
    // girdle (the rose hinge ring, 60 m from the axis) and the ring inside which no egg is dealt (RING, 215 m): 137.5 m out. The seventh egg stands
    // dead aft, on the gangway's line carried back through the axis. The trellised egg stands on a seam between two of the Egg's twelve gores, so
    // that no gore comes down over its crown: the first seam round from dead aft, on the side away from the route (the route comes in past the Egg's
    // -x side and ends up the gangway), at which the two shells do not touch; that is the seam between the fourth and fifth gores, 135 degrees
    // round from the gangway toward +x (at the seam next to dead aft the axes would be 36 m apart and the shells 46 m wide together).
    // WHAT THAT GIVES IN SPACE (fix6/place4.mjs measures it; no measurement chose the place): each shell stands more than 40 m outside the plan hull
    // of the whole route and the Egg's girdle, so it cannot come between any point of the route and the Egg's cup, its image or the gangway; each
    // axis is over 130 m in plan from every point of the route. The one is a turning egg in a gold trellis, to starboard of the last straight; the
    // other an egg cut in scales that opens on its gold tree as we come (the lead's ruling: 64 m, from u 0.3, no further than 40 percent).
    {
      const fe = (lx, lz, H, tint, cut, u0, maxOpen, spin) => { const w = LW(lx, 0, lz); eggs.push({ x: w.x, z: w.z, H, tint, u0, open: u0 >= 0, rot: 0, k: 0, cut, maxOpen, spin, feature: u0 < 0, own: true }); };
      const rMid = 0.5 * (hero.anchors.hinges.rose.z + RING), HT = 74, H7 = 64;
      let seam = 5.5; while (seam > 3 && 2 * rMid * Math.sin((6 - seam) * Math.PI / 12) < 0.335 * (HT + H7)) seam -= 1;   // 5.5 fails (35.9 m < 46.2 m); 4.5 stands
      fe(rMid * Math.sin(seam * TAU / 12), rMid * Math.cos(seam * TAU / 12), HT, C(pal[3]).lerp(C('#ffffff'), 0.1), 3, -1, 1, TAU / 40);   // mauve enamel in a thin gold trellis, one turn in 40 s
      fe(0, -rMid, H7, C(pal[4]), 2, 0.37, 0.38, 0);   // the seventh opening egg, the palette's green: its gores lift from u 0.30 and are at their limit by 0.385; with its 2 percent of breathing it never passes 40 percent open
    }
    if (rare) {                                                                  // the rare wave: a line of eggs running away to port of the Egg and behind it, as the long curve sees them at u 0.6
      P(0.6, _a); const fx = E.x - _a.x, fz = E.z - _a.z, fl = Math.hypot(fx, fz) || 1, cx = _a.x, cz = _a.z;
      const line = [[150, -21, 22, 3], [215, -27, 30, 2], [330, -25, 34, 0], [400, -20.5, 40, 3], [505, -15.5, 46, 1], [470, 17, 44, 5], [600, -24, 52, 2]];
      for (const [d, deg, H, ti] of line) {
        const t = deg * Math.PI / 180, c = Math.cos(t), sn = Math.sin(t), dx = (fx * c - fz * sn) / fl, dz = (fz * c + fx * sn) / fl;
        const x = cx + dx * d, z = cz + dz * d, dE = Math.hypot(x - E.x, z - E.z);
        if (place.nearestXZ(x, z).dist < H * 0.34 + 30 || !farFromAll(x, z, H * 0.34)) continue;
        addEgg(x, z, H, tints[ti], 0.5 + 0.075 * clamp((dE - 140) / 260, 0, 1));
      }
    }
    let guard = 0, nGaze = 0;
    while (eggs.length < nEggs + 4 && guard++ < 4000) {
      if (guard % 20 === 0) await ctx.yield();
      const ang = rng.range(0, TAU), rad = 60 + 840 * Math.pow(rng(), 0.7), x = -60 + Math.cos(ang) * rad, z = 420 + Math.sin(ang) * rad;
      const H = rng.range(20, 90), R = H * 0.34 + 4, near = place.nearestXZ(x, z);
      if (near.dist < R + 26 || Math.hypot(x - E.x, z - E.z) < RING + R || !farFromAll(x, z, R)) continue;
      // keep the entry picture and the last straight open
      if (Math.abs(x) < 40 + R && z < 560 && z > -20) continue;
      { const t = clamp((x * E.x + z * E.z) / (E.x * E.x + E.z * E.z), 0, 1); if (Math.hypot(x - E.x * t, z - E.z * t) < R + 55) continue; }
      const dE = Math.hypot(x - E.x, z - E.z), gx = x + 150, gz = z - 540, gl = Math.max(1, Math.hypot(gx, gz));
      const inGaze = (gx * 0.99 + gz * 0.15) / gl > 0.72 && dE < 850 && nGaze < 14;      // behind the Egg as the long curve sees it
      const opens = rare && (inGaze || (dE < 520 && H < 60)); if (opens && inGaze) nGaze++;
      addEgg(x, z, H, tints[rng.int(0, 5)], opens ? 0.44 + 0.12 * clamp((dE - 215) / 635, 0, 1) : -1);
    }
    await ctx.yield();
    {                                                                            // no egg stands in the route we fly: any that would is slid straight away from it (no rng)
      // (a margin in space, not a test from the eye: a clearance in plan between each egg and the route's own line, taken at points 2.5 m apart
      // along the whole of it. One kind of egg is left where it stands: an egg whose nearest point of the route lies on the stretch the route still
      // shares with the lane the eggs were set out along, up to the last control point the two have in common; there each egg was set off the lane
      // by its own rule, the apple-green egg at arm's length among them, and nothing is asked again.)
      const smp = [], last = head[head.length - 1]; let dLast = 0, bf = 1e9;   // dLast: how far along the route that last shared control point lies
      for (let d = 0; d <= path.length; d += 2.5) { path.posAtDist(d, _a); smp.push([_a.x, _a.y, _a.z, d]); const q = Math.hypot(_a.x - last[0], _a.z - last[2]); if (q < bf) { bf = q; dLast = d; } }
      for (const e of eggs) for (let it = 0; it < 4; it++) {
        const R = e.H * 0.34 + 4; let bd = 1e9, bx = 0, bz = 0, bAt = 0;
        for (const q of smp) { if (q[1] > e.H + 24) continue; const d = Math.hypot(e.x - q[0], e.z - q[2]); if (d < bd) { bd = d; bx = q[0]; bz = q[2]; bAt = q[3]; } }
        if (bd >= R + 28 || bAt <= dLast) break;
        const dx = e.x - bx, dz = e.z - bz, dl = Math.hypot(dx, dz) || 1, push = R + 32 - bd; e.x += dx / dl * push; e.z += dz / dl * push;
      }
    }
    const openers = [...eggs.filter((e) => e.open && !e.own), ...eggs.filter((e) => e.open && e.own)], wholes = eggs.filter((e) => !e.open && !e.feature), feats = eggs.filter((e) => e.feature);   // (the added egg last)
    // TWO STREAMS OF THEIR OWN, each made from the world's seed and a name, so that neither draws anything from the visit's stream:
    //   'pads'        the lily pads' loop: how many draws it takes depends on where the eggs stand (a pad that falls under any egg, the two added
    //                 ones too, is dealt again), so it has a stream of its own and nothing after it depends on that count;
    //   'added-eggs'  the two eggs added by the Great Egg: how each is turned at the start, the seventh egg's leaves, their girdle stones.
    const own = (name) => ctx.core.makeRng(ctx.core.hashSeed(name + ':' + ctx.seed));
    const rngPads = own('pads'), rngAdded = own('added-eggs');
    for (const e of eggs) if (e.own) { e.rot = rngAdded.range(0, TAU); e.ph = rngAdded.range(0, TAU); }
    await ctx.yield();

    // ---- shells ---------------------------------------------------------------------------------
    const wholeGeo = fixUv(new THREE.LatheGeometry(eggProfile(0, 1, 16), 22), 1);
    const wholeM = inst(wholeGeo, matShell, wholes.length, 'lesser-eggs');
    wholes.forEach((e, i) => {
      M.compose(_a.set(e.x, 0, e.z), Q.setFromAxisAngle(Y, e.rot), S3.setScalar(e.H));
      setI(wholeM, i, M, e.tint, 0, e.rot, 0, (i % 2 ? 1 : -1) * TAU / rng.range(40, 90), e.H / 40);
    });
    await ctx.yield();
    {                                                                            // the eggs by the route are lathed finer, so their outline stays round at half the frame's height
      const featM = inst(fixUv(new THREE.LatheGeometry(eggProfile(0, 1, 40), 56), 1), matShell, Math.max(1, feats.length), 'route-eggs');
      feats.forEach((e, i) => {
        M.compose(_a.set(e.x, 0, e.z), Q.setFromAxisAngle(Y, e.rot), S3.setScalar(e.H));
        setI(featM, i, M, e.tint, 0, e.rot, 0, e.spin, e.H / 40); featM.geometry.attributes.aPat.setX(i, e.cut);
      });
    }
    await ctx.yield();
    {
      const NF = Math.round(56 * detail), farM = inst(fixUv(new THREE.LatheGeometry(eggProfile(0, 1, 8), 10), 1), matShell, NF, 'far-eggs');
      for (let i = 0; i < NF; i++) {
        const ang = i * 2.39996 + 0.7, rad = 1250 + 2000 * ((i * 0.618034) % 1), H = 38 + 52 * ((i * 0.381966) % 1);
        M.compose(_a.set(-60 + Math.cos(ang) * rad, 0, 420 + Math.sin(ang) * rad), Q.setFromAxisAngle(Y, ang), S3.setScalar(H));
        setI(farM, i, M, tints[i % 6], 0, ang, 0, 0, H / 40);
      }
    }
    await ctx.yield();
    const cupGeo = fixUv(new THREE.LatheGeometry(eggProfile(0, 0.36, 10), 32), 1);
    const goreGeo = fixUv(new THREE.LatheGeometry(eggProfile(0.36, 1, 18), 5, -TAU / 16, TAU / 8), 0.125);
    const cupM = inst(cupGeo, matShell, Math.max(1, openers.length), 'opening-cups');
    const goreM = inst(goreGeo, matShell, Math.max(1, openers.length * 8), 'opening-gores');
    const hingeA = new THREE.Matrix4().makeTranslation(0, 0.36, 0.34), hingeB = new THREE.Matrix4().makeTranslation(0, -0.36, -0.34);
    const setGores = (e, k, open) => {
      for (let g = 0; g < 8; g++) {
        M.compose(_a.set(e.x, 0, e.z), Q.setFromAxisAngle(Y, e.rot + g * TAU / 8), S3.setScalar(e.H));
        M.multiply(hingeA).multiply(M2.makeRotationX(open * (1.55 + 0.12 * Math.sin(g * 2.4)))).multiply(hingeB);
        goreM.setMatrixAt(k * 8 + g, M);
      }
    };
    openers.forEach((e, k) => {
      e.k = k; e.cur = -1;
      M.compose(_a.set(e.x, 0, e.z), Q.setFromAxisAngle(Y, e.rot), S3.setScalar(e.H));
      setI(cupM, k, M, e.tint, 0, e.rot, 0, 0, e.H / 40); cupM.geometry.attributes.aPat.setX(k, e.cut || 0);
      for (let g = 0; g < 8; g++) { goreM.geometry.attributes.aTint.setXYZW(k * 8 + g, e.tint.r, e.tint.g, e.tint.b, 0); goreM.geometry.attributes.aAnim.setXYZW(k * 8 + g, e.rot, 0, 0, e.H / 40); goreM.geometry.attributes.aPat.setX(k * 8 + g, e.cut || 0); }
      setGores(e, k, 0);
    });
    goreM.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    await ctx.yield();

    // ---- gold trees inside the eggs that open -----------------------------------------------------
    const tips = [], parts = [];
    const limb = (ax, ay, az, bx, by, bz, r) => {
      const a = new THREE.Vector3(ax, ay, az), b = new THREE.Vector3(bx, by, bz), len = a.distanceTo(b);
      const g = new THREE.CylinderGeometry(r * 0.7, r, len, 7, 3); g.translate(0, len / 2, 0);
      g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(Y, b.clone().sub(a).normalize())); g.translate(ax, ay, az); parts.push(g);
    };
    limb(0, 0.36, 0, 0.004, 0.57, 0.003, 0.032);
    for (let i = 0; i < 3; i++) {
      const a = i * TAU / 3 + 0.4, bx = Math.cos(a) * 0.09, bz = Math.sin(a) * 0.09;
      limb(0.004, 0.57, 0.003, bx, 0.68, bz, 0.021);
      for (let j = 0; j < 2; j++) {
        const a2 = a + (j ? 0.7 : -0.7), cx = bx + Math.cos(a2) * 0.07, cz = bz + Math.sin(a2) * 0.07, cy = 0.75 + 0.03 * j;
        limb(bx, 0.68, bz, cx, cy, cz, 0.013); tips.push([cx, cy, cz]);
        limb(cx, cy, cz, cx + Math.cos(a2 + 1) * 0.04, cy + 0.045, cz + Math.sin(a2 + 1) * 0.04, 0.008); tips.push([cx + Math.cos(a2 + 1) * 0.04, cy + 0.045, cz + Math.sin(a2 + 1) * 0.04]);
      }
    }
    parts.push(new THREE.CircleGeometry(0.335, 32).rotateX(-Math.PI / 2).translate(0, 0.362, 0));
    const treeGeo = mergeGeometries(parts.map((g) => g.index ? g.toNonIndexed() : g)); parts.forEach((g) => g.dispose());
    await ctx.yield();
    const treeM = inst(treeGeo, matJewel, Math.max(1, openers.length), 'gold-trees');
    const goldTint = C(pal[5]);
    const perTree = Math.round(320 * detail);
    const leafGeo = new THREE.BufferGeometry();
    leafGeo.setAttribute('position', new THREE.Float32BufferAttribute([-0.5, 0, 0, 0, 0, 0.22, 0.5, 0.06, 0, 0, 0, -0.22], 3));
    leafGeo.setAttribute('normal', new THREE.Float32BufferAttribute([0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0], 3));
    leafGeo.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, 0.5, 0.3, 1, 0.5, 0.5, 0.7], 2)); leafGeo.setIndex([0, 1, 2, 0, 2, 3]);
    const leafM = inst(leafGeo, matJewel, Math.max(1, openers.length * perTree), 'enamel-leaves');
    const leafTint = C(pal[4]); leafTint.r *= 0.7; leafTint.b *= 0.62;          // apple-green enamel, bright against the sky
    const E3 = new THREE.Euler();
    for (let k = 0; k < openers.length; k++) {
      const e = openers[k], rng = e.own ? rngAdded : ctx.rng;
      M.compose(_a.set(e.x, 0, e.z), Q.setFromAxisAngle(Y, e.rot), S3.setScalar(e.H)); setI(treeM, k, M, goldTint, 1, e.rot, 0, 0, 1);
      for (let i = 0; i < perTree; i++) {
        if (i % 100 === 99) await ctx.yield();
        const t = tips[(i + k) % tips.length], rr = 0.05 * Math.cbrt(rng()), th = rng() * TAU, ph = Math.acos(2 * rng() - 1);
        _a.set(t[0] + rr * Math.sin(ph) * Math.cos(th), t[1] + rr * Math.cos(ph) * 0.8, t[2] + rr * Math.sin(ph) * Math.sin(th)).multiplyScalar(e.H).applyAxisAngle(Y, e.rot);
        _a.x += e.x; _a.z += e.z;
        M.compose(_a, Q.setFromEuler(E3.set(rng.range(-0.6, 0.6), rng() * TAU, rng.range(-0.6, 0.6))), S3.setScalar(rng.range(0.7, 1.1) * e.H / 13.5));
        setI(leafM, k * perTree + i, M, leafTint, 0, rng() * TAU, 0.35, 0, 0.05);
      }
      await ctx.yield();
    }

    // ---- diamonds on the girdles of the eggs we pass ---------------------------------------------
    const gemGeo = () => new THREE.IcosahedronGeometry(0.5, 0).scale(1, 0.7, 1);
    await ctx.yield();
    const nearEggs = eggs.filter((e) => place.nearestXZ(e.x, e.z).dist < 170);
    const girdleN = (e) => Math.max(12, Math.round(e.H * 0.34 * TAU / 4));
    const gemM = inst(gemGeo(), matJewel, Math.max(1, nearEggs.reduce((s, e) => s + girdleN(e), 0)), 'girdle-diamonds');
    const diaTint = C(pal[6]); let gi = 0;
    for (const e of nearEggs) {
      const n = girdleN(e);
      for (let i = 0; i < n; i++) {
        const a = e.rot + i * TAU / n; _a.set(e.x + Math.sin(a) * e.H * 0.345, e.H * 0.36, e.z + Math.cos(a) * e.H * 0.345);
        M.compose(_a, Q.setFromEuler(E3.set(Math.PI / 2, a, 0, 'YXZ')), S3.setScalar(0.9));
        setI(gemM, gi++, M, diaTint, 2, (e.own ? rngAdded : rng)(), 0, 0, 1);
      }
    }
    await ctx.yield();

    // ---- lily pads of enamel, each carrying pearls ------------------------------------------------
    const nPads = Math.round(1400 * detail * clamp(vary.density ?? 1, 0.8, 1.2));
    const padGeo = new THREE.CircleGeometry(1, 16, 0.22, TAU - 0.44).rotateX(-Math.PI / 2);
    const padM = inst(padGeo, matJewel, nPads, 'lily-pads');
    const pearlGeo = () => new THREE.SphereGeometry(1, 9, 6);
    const nPP = Math.ceil(nPads / 2), padPearlM = inst(new THREE.SphereGeometry(1, 6, 3), matJewel, nPP, 'pad-pearls');
    const padTints = [C(pal[4]), C('#E9E2D2'), C(pal[4]).lerp(C(pal[0]), 0.35)], pearlTint = C('#FFF6EC');
    // (the pads draw from their own stream, 'pads', made above with the other)
    for (let i = 0; i < nPads; i++) {
      let x = 0, z = 0, ok = false;
      for (let t = 0; t < 6 && !ok; t++) {
        const u = rngPads(), off = rngPads.chance(0.72) ? rngPads.gauss() * 20 : rngPads.range(-130, 130);
        side(u, off, _a); x = _a.x + rngPads.range(-6, 6); z = _a.z + rngPads.range(-6, 6);
        ok = Math.hypot(x - E.x, z - E.z) > 66 && eggs.every((e) => Math.hypot(e.x - x, e.z - z) > e.H * 0.26 + 3);
      }
      const r = ok ? rngPads.range(0.75, 2) : 0.001;
      M.compose(_a.set(x, 0.07 + (i % 7) * 0.004, z), Q.setFromAxisAngle(Y, rngPads() * TAU), S3.set(r, 1, r));
      setI(padM, i, M, padTints[i % 3], 0, rngPads() * TAU, 0.05, 0, 0.12);
      const pr = ok ? rngPads.range(0.24, 0.36) : 0.001, pa = rngPads() * TAU, pd = r * rngPads.range(0.1, 0.55);
      M.compose(_a.set(x + Math.cos(pa) * pd, 0.07 + pr, z + Math.sin(pa) * pd), Q.identity(), S3.setScalar(pr));
      const phP = rngPads(); if (i % 2 === 0) setI(padPearlM, i >> 1, M, pearlTint, 3, phP * 6.2832, 0, (i % 4 ? 0.9 : -1.2), 1);
      if (i % 20 === 19) await ctx.yield();
    }
    await ctx.yield();

    // ---- diamond shoals, their sparks and touch rings ---------------------------------------------
    const PER = 60, shoalN = nShoals * PER;
    const shoalM = inst(gemGeo(), matJewel, shoalN, 'diamond-shoals'); shoalM.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    const stone = [];
    for (let i = 0; i < shoalN; i++) {
      stone.push({ a: rng.range(-4.5, 4.5), b: rng.range(-2.5, 2.5), ph: rng(), sp: rng.range(0.6, 1.3), ax: rng() * TAU });
      setI(shoalM, i, M.identity(), diaTint, 2, rng(), 0, 0, 1);
    }
    await ctx.yield();
    const sparkGeo = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2);
    const sparkAge = new THREE.InstancedBufferAttribute(new Float32Array(shoalN), 1); sparkAge.setUsage(THREE.DynamicDrawUsage);
    sparkGeo.setAttribute('aAge', sparkAge);
    const sparkMat = new THREE.ShaderMaterial({
      uniforms: {}, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false,
      vertexShader: /* glsl */`attribute float aAge; varying vec2 vUv; varying float vAge;
        void main(){ vUv = uv - 0.5; vAge = aAge; gl_Position = projectionMatrix * viewMatrix * modelMatrix * instanceMatrix * vec4(position, 1.0); }`,
      fragmentShader: /* glsl */`varying vec2 vUv; varying float vAge;
        void main(){ float r = length(vUv) * 2.0; float a = clamp(vAge, 0.0, 1.0);
          float ring = (1.0 - smoothstep(0.0, 0.07, abs(r - (0.15 + 0.8 * a)))) * (1.0 - a) * (1.0 - a);
          float fall = max(0.0, 1.0 - a * 3.0); vec2 q = abs(vUv) * 2.0;
          float star = max(0.0, 1.0 - q.x * 1.6) * max(0.0, 1.0 - q.y * 22.0) + max(0.0, 1.0 - q.y * 1.6) * max(0.0, 1.0 - q.x * 22.0);
          vec3 c = vec3(0.85, 0.92, 1.0) * ring * 0.5 + vec3(1.0, 0.97, 0.9) * star * fall * fall * 2.2;
          gl_FragColor = vec4(c * step(r, 1.0), 1.0); }`,
    });
    const sparkM = new THREE.InstancedMesh(sparkGeo, sparkMat, shoalN); sparkM.frustumCulled = false; sparkM.name = 'sparks-and-rings';
    sparkM.instanceMatrix.setUsage(THREE.DynamicDrawUsage); sparkM.renderOrder = 5; scene.add(sparkM);

    // ---- pearl eels --------------------------------------------------------------------------------
    const NE = 6, PE = 57;
    const eelM = inst(pearlGeo(), matJewel, NE * PE, 'pearl-eels'); eelM.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    const eelTint = goldEels ? C(pal[5]) : C('#FFF4E6');
    const eel = [];
    for (let k = 0; k < NE; k++) {
      const u = [0, 0, 0.08, 0.22, 0.56, 0.7][k];
      eel.push({ c: side(u, (k % 2 ? 1 : -1) * rng.range(16, 26), new THREE.Vector3()).clone(), r: rng.range(9, 14), w: rng.range(0.35, 0.55) * (k % 2 ? 1 : -1), ph: rng() * TAU, y: rng.range(4, 9) });
      for (let j = 0; j < PE; j++) setI(eelM, k * PE + j, M.identity(), j === 0 ? C('#FFF6EC') : eelTint, goldEels && j > 0 ? 1 : 3, rng(), 0, 0, 1);
    }
    await ctx.yield();

    // ---- per-frame motion ---------------------------------------------------------------------------
    const cen = new THREE.Vector3(), tan = new THREE.Vector3(), tp = new THREE.Vector3(), zero = new THREE.Vector3(0, 0, 0);
    const uTip = 1 - 186 / path.length;
    const amb = [side(0.38, 26, new THREE.Vector3()).clone(), side(0.6, -30, new THREE.Vector3()).clone()];
    let sparkK = 1;
    const shoalPose = (s, u, time) => {              // -> cen, tan (unit travel direction), returns [travelled, show]
      sparkK = 1;
      if (s === 0) {
        // sweeps in from port, crosses the bow 20 m ahead at u 0.14, skips along ahead of us to u 0.23, then outruns us
        const ahead = 20 + 220 * smoothstep(0.22, 0.32, u), uu = clamp(u + ahead / path.length, 0, 1), lat = -60 * (1 - smoothstep(0.05, 0.135, u)) - 7 + 4 * Math.sin((u - 0.135) * 45);
        PC(uu, cen); path.curve.getTangentAt(uu, tan); cen.set(cen.x - tan.z * lat, 0.3, cen.z + tan.x * lat); tan.y = 0; tan.normalize();
        return [uu * path.length + time * 1.5, 1 - smoothstep(0.3, 0.33, u)];
      }
      if (s === 1) {
        // waits on the gore's tip, then skips up the gilt face ahead of us; at the girdle the stones leave the gold and fly on as a stream into the portal's light
        const uu = clamp(u + 0.032 + 0.03 * (1 - smoothstep(0.78, 0.86, u)), uTip, 0.999); PC(uu, cen); path.curve.getTangentAt(uu, tan);
        const r = Math.hypot(cen.x - E.x, cen.z - E.z); cen.y = hero.anchors.floorY(r) + 0.35; sparkK = smoothstep(58, 66, r);
        return [uu * path.length + time * 1.5, smoothstep(0.7, 0.76, u) * smoothstep(3, 14, r)];
      }
      const c = amb[s - 2], a = time * 0.4 * (s === 2 ? 1 : -1) + s; cen.set(c.x + Math.cos(a) * 22, 0.3, c.z + Math.sin(a) * 22); tan.set(-Math.sin(a), 0, Math.cos(a)).multiplyScalar(s === 2 ? 1 : -1);
      return [time * 8.8, 1];
    };
    const moveFauna = (u, time) => {
      for (let s = 0; s < nShoals; s++) {
        const [trav, show] = shoalPose(s, u, time);
        for (let i = 0; i < PER; i++) {
          const st = stone[s * PER + i], idx = s * PER + i, sd = (trav + st.a) / 7 + st.ph, fr = sd - Math.floor(sd), leap = 2 * Math.sin(Math.PI * fr);
          tp.set(cen.x + tan.x * st.a - tan.z * st.b, cen.y + tan.y * st.a + 0.3 + leap, cen.z + tan.z * st.a + tan.x * st.b);
          M.compose(tp, Q.setFromAxisAngle(_c.set(Math.cos(st.ax), 0.5, Math.sin(st.ax)).normalize(), time * st.sp + st.ax), S3.setScalar(0.72 * show));
          shoalM.setMatrixAt(idx, M);
          tp.set(tp.x - tan.x * fr * 7, cen.y + tan.y * (st.a - fr * 7) + 0.12, tp.z - tan.z * fr * 7);
          M.compose(tp, Q.identity(), S3.setScalar(3.2 * show * sparkK)); sparkM.setMatrixAt(idx, M); sparkAge.array[idx] = fr;
        }
      }
      shoalM.instanceMatrix.needsUpdate = true; sparkM.instanceMatrix.needsUpdate = true; sparkAge.needsUpdate = true;
      for (let k = 0; k < NE; k++) {
        const e = eel[k];
        if (k < 2) {
          const uu = clamp(u + 0.012 - k * 0.004, 0, 1); PC(uu, cen); path.curve.getTangentAt(uu, tan);
          const early = 1 - smoothstep(0.255, 0.295, u), peel = smoothstep(0.29, 0.335, u), d = -(7.5 + k * 2.5) + peel * 72 - early * (5 + 6 * Math.sin(time * 0.35 + k * 2.1));   // escort to port, then cross the bow and leave to starboard before the climb over the Egg
          for (let j = 0; j < PE; j++) {
            const w = Math.min(1, j / 6), lat = d + 1.2 * w * Math.sin(j * 0.3 - time * 3.2 + e.ph), back = j * 0.25;
            tp.set(cen.x - tan.x * back - tan.z * lat, cen.y - 2.2 + k * 1.6 - early * (4.5 + k * 1.5) + 0.6 * w * Math.sin(j * 0.22 - time * 2.1), cen.z - tan.z * back + tan.x * lat);
            M.compose(tp, Q.identity(), S3.setScalar(j === 0 ? 0.42 : 0.2)); eelM.setMatrixAt(k * PE + j, M);
          }
        } else {
          for (let j = 0; j < PE; j++) {
            const a = time * e.w + e.ph - Math.sign(e.w) * j * 0.25 / e.r, w = Math.min(1, j / 6), rr = e.r + 1.2 * w * Math.sin(j * 0.3 - time * 3.2);
            tp.set(e.c.x + Math.cos(a) * rr, e.y + 0.8 * Math.sin(j * 0.22 - time * 2.1 + e.ph), e.c.z + Math.sin(a) * rr);
            M.compose(tp, Q.identity(), S3.setScalar(j === 0 ? 0.42 : 0.2)); eelM.setMatrixAt(k * PE + j, M);
          }
        }
      }
      eelM.instanceMatrix.needsUpdate = true;
    };
    const openEggs = (u, time) => {
      let dirty = false;
      for (const e of openers) {
        let o = smoothstep(e.u0 - 0.07, e.u0 + 0.015, u); if (o > 0.02) o += 0.02 * Math.sin(time * 0.8 + e.k);
        if (e.own) { o = smoothstep(e.u0 - 0.07, e.u0 + 0.015, u) * e.maxOpen; if (o > 0.02) o += 0.02 * Math.sin(time * 0.8 + e.ph); }   // the added egg: its own limit, and a breathing phase dealt from its own stream
        if (Math.abs(o - e.cur) > 1e-4) { e.cur = o; setGores(e, e.k, o); dirty = true; }
      }
      if (dirty) goreM.instanceMatrix.needsUpdate = true;
    };
    await ctx.yield();
    openEggs(0, 0); await ctx.yield(); moveFauna(0, 0); await ctx.yield();
    // ---- the eggs' images in the sea beyond the ten analytic ones (see IMG_VERT) -----------------
    const NFI = Math.round(56 * detail), NI = NFI + eggs.length, imgW = new Float32Array(NI).fill(1);
    {
      const rows = [[-0.25, 0.4], [0, 0.4], [0.35, 0.4], [0.7, 0.4], [0.9, 0.36], [1.1, 0.3], [1.25, 0.2]], pos = [], idx = [];
      for (const [y, hw] of rows) pos.push(-hw, y, 0, hw, y, 0);
      for (let i = 0; i + 1 < rows.length; i++) idx.push(2 * i, 2 * i + 1, 2 * i + 2, 2 * i + 1, 2 * i + 3, 2 * i + 2);
      const g = new THREE.InstancedBufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx);
      const base = new Float32Array(NI * 4), tin = new Float32Array(NI * 3);
      for (let i = 0; i < NFI; i++) {                                              // the far eggs, placed as they are above
        const ang = i * 2.39996 + 0.7, rad = 1250 + 2000 * ((i * 0.618034) % 1), H = 38 + 52 * ((i * 0.381966) % 1), t = tints[i % 6];
        base.set([-60 + Math.cos(ang) * rad, 420 + Math.sin(ang) * rad, H, 0], i * 4); tin.set([t.r, t.g, t.b], i * 3);
      }
      for (let i = 0; i < eggs.length; i++) { const e = eggs[i], k = NFI + i; base.set([e.x, e.z, e.H, 0], k * 4); tin.set([e.tint.r, e.tint.g, e.tint.b], k * 3); }
      g.setAttribute('aBase', new THREE.InstancedBufferAttribute(base, 4)); g.setAttribute('aTintI', new THREE.InstancedBufferAttribute(tin, 3));
      g.setAttribute('aW', new THREE.InstancedBufferAttribute(imgW, 1).setUsage(THREE.DynamicDrawUsage)); g.instanceCount = NI;
      const seaU = hero.object.getObjectByName('sea-apron').material.uniforms;      // the Great Egg's image zone: the sea material's own uniforms, shared
      // opaque, tested against the depth of everything already drawn, lifted off the coplanar sheet by a polygon offset; it writes no depth, so that
      // pads and stones lying on the sheet are still tested against the sheet itself
      const im = new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms: { ...SU, uRefC: seaU.uRefC, uRefR: seaU.uRefR, uRefOn: seaU.uRefOn }, vertexShader: IMG_VERT, fragmentShader: IMG_FRAG,
        side: THREE.DoubleSide, blending: THREE.NoBlending, depthTest: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -8, fog: false }));
      im.frustumCulled = false; im.renderOrder = -7.9; im.name = 'egg-images'; scene.add(im);
      imgW.attr = g.attributes.aW;
    }
    await ctx.yield();
    const score = new Float32Array(eggs.length), LE = SU.uLE.value, LT = SU.uLT.value, camP = new THREE.Vector3(), sel = new Int16Array(10);
    const mirrorEggs = (camera) => {
      camera.getWorldPosition(camP);
      for (let i = 0; i < eggs.length; i++) { const e = eggs[i], dd = Math.hypot(e.x - camP.x, e.z - camP.z); score[i] = e.H / Math.max(20, dd); imgW[NFI + i] = 1; }
      let floor = 0;
      for (let k = 0; k <= 10; k++) {                                            // the eleventh sets the level at which an image has faded to nothing, so the set can change unseen
        let bi = -1, bs = 0; for (let i = 0; i < eggs.length; i++) if (score[i] > bs) { bs = score[i]; bi = i; }
        if (k === 10) { floor = bs; break; }
        sel[k] = bi; if (bi < 0) { LE[k].set(0, 0, 1, 0); continue; }
        const e = eggs[bi]; LE[k].set(e.x, e.z, e.H, bs); LT[k].set(e.tint.r, e.tint.g, e.tint.b); score[bi] = 0;
      }
      for (let k = 0; k < 10; k++) { LE[k].w = LE[k].w > 0 ? smoothstep(floor, floor * 1.5 + 1e-4, LE[k].w) : 0; if (sel[k] >= 0 && LE[k].w > 0.999) imgW[NFI + sel[k]] = 0; }   // an egg whose image the sea's own shader shows whole needs no patch; the two are the same picture, so the change cannot be seen
      imgW.attr.needsUpdate = true;
    };
    // THE EXIT GAZE rests on the portal's own centre, where the route ends: one pull to one fixed thing. It follows no creature and has no state of
    // its own; the diamond shoal runs up the gilt stair between the lens and the portal and is seen on the way.
    const stairMid = 0.5 * (hero.anchors.goreTip.z + hero.anchors.hinges.rose.z);
    const portalAim = hero.object.localToWorld(hero.anchors.portalSeat.position.clone()), lensAt = new THREE.Vector3();
    // WHERE THE EXIT GAZE COMES ON: it begins at the route metre nearest the route's own control point at the turn in front of the Egg (a waypoint of
    // the route: in substance a gaze key, the same u on every seed; a later round is to begin it at a thing of the Egg) and is whole where the lens
    // is over the ring through the middle of the stair (stairMid, a thing of the Egg). Both are searched along the route in steps of 1 m.
    let dOn0 = 0, dOn1 = 0;
    { const turn = pts[pts.length - 5]; let b = 1e9;
      for (let d = 0; d <= path.length; d += 1) { path.posAtDist(d, lensAt); const q = lensAt.distanceTo(turn); if (q < b) { b = q; dOn0 = d; } }
      b = 1e9; for (let d = dOn0; d <= path.length; d += 1) { path.posAtDist(d, lensAt); const q = Math.abs(Math.hypot(lensAt.x - E.x, lensAt.z - E.z) - stairMid); if (q < b) { b = q; dOn1 = d; } } }
    const ss = smoothstep;
    return {
      scene, path, duration: 46,
      pace: (u) => 0.95 + 0.25 * ss(0.10, 0.16, u) + 0.25 * ss(0.3, 0.38, u) - 0.5 * ss(0.48, 0.54, u) + 0.2 * ss(0.64, 0.7, u) - 0.5 * ss(0.76, 0.81, u) + 0.35 * ss(0.87, 0.91, u),
      camera: { fov: 52, near: 0.3, far: 6000, lookAhead: 24, sway: 0.5, bank: 0.37 },   // bank 0.37: the engine's 16 degrees of roll at most becomes 5.9 (the brief: bank at most 6 degrees)
      pois: [{ at: [E.x, 82, E.z], from: 0.02, to: 0.3, weight: 0.8 }, { at: [E.x, 84, E.z], from: 0.12, to: 0.4, weight: 0.62, fade: 0.3 }, { at: (t, u) => gazeAt.set(E.x, 86 - 10 * ss(0.3, 0.44, u) + 40 * ss(0.54, 0.62, u) - 16 * ss(0.62, 0.72, u) - 14 * ss(0.72, 0.8, u), E.z), from: 0.24, to: 0.9, weight: 0.86, fade: 0.16 },   // down into the open flower from above, then up to the bird and the fan from the front
        { at: portalAim, from: dOn0 / path.length, to: 2, fade: (dOn1 - dOn0) / (2 * path.length - dOn0), weight: 0.42 }],   // (it comes on between the two places found above; a window that ends past the route's end: no key of ours lets this gaze go)
      portal: { shape: 'circle', radius: hero.anchors.portalSeat.radius, color: '#FFF4D6', glow: 0.6, tilt: true, revealDistance: 320 },
      post: { exposure: 1, bloom: { strength: 0.3, radius: 0.35, threshold: 1.4 }, grade: { saturation: 1.08, contrast: 1.05, vignette: 0.15, grain: 0 } },
      ride: 'none', style: 'none',
      update(dt, time, camera, u) {
        hero.setProgress(u); hero.update(dt, time, camera);
        SU.uTravel.value = u * 900 + 0.6 * time;                // the swell bands race out with every metre flown, and creep at the swell's own 0.6 m/s
        openEggs(u, time); moveFauna(u, time); mirrorEggs(camera);
      },
      dispose() { if (hero.dispose) hero.dispose(); },
    };
  },
};
