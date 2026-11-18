// over-the-wall-on-a-box, the look: AUTOMATON MAKER'S WORK. Hand-painted enamel on tin (cream, russet, sage, sky blue,
// one vermilion), lacquered brass, blued steel, nickel screws. Everything is a cut or pressed piece of tin, a rod, a
// wheel or a cam, and is shown as such.
//
// THE LIGHT IS ONE LAW, the same at every metre and for every surface: one low sun at a fixed side (uSun), the sky's
// light from above and the tray's warm light from below, a thin haze with distance. Enamel is glossy and takes the
// sky; brass, steel and nickel mirror the sky and the tray. The tray's own paint and the bench carry the same sun
// and sky by a plainer gloss of their own (a fresnel share of the sky and one narrow glint of the sun). EVERY LONG
// SHADOW is the casting piece itself laid flat on the tray along the sun (SHADE_V) and drawn in the tray's own paint
// without the sun's share, so two shadows that overlap are no darker than one; a shadow ends at the tray's rim and
// none is laid on the bench. Inside the orchard a thing is in shade where the west or the south wall stands
// between it and the sun (wallShade): the same sun, worked out from the walls' places.
//
// WHAT READS THE EYE OR THE PIXEL (section 153), all of it:
//   1. THE FOOTPRINT FILTERS: painted detail finer than the pixel (the dabs of the woods and crowns, brick courses,
//      crate slats, plough lines, hedges, rivets, the river's ribbons) goes over into its own mean tone by the
//      pixel's footprint on the surface (the longer of the two screen derivatives of the paint's own coordinates),
//      so nothing crawls far off.
//   2. THE GLOSS: enamel and metal mirror the sky by the direction of sight (a fresnel share) and carry the sun's
//      glint by the half vector; the tray's paint, the river's steel, the shadows on the tray (the sky's share only)
//      and the bench's wood do likewise by the direction of sight.
//   3. THE HAZE: by the distance from the eye.
//   4. A SHADOW SHEET lies a little over the tray, more with distance from the eye, so that it does not fight the
//      tray for depth.
//   5. THE SKY is a dome that goes with the eye; its grade, the sun's glow and its brushed clouds are by the
//      direction of sight alone.
// Nothing reads a seed, a still's position or a clock of the wall. The world's clock (uT) moves the cams and what
// rides them and runs the river's steel; the metres flown are not known to this file.
import * as THREE from 'three';

const lin = (hex) => { const c = new THREE.Color(hex); return [c.r, c.g, c.b]; };
export const COL = {
  cream: lin('#F1E6C8'), russet: lin('#B5532A'), sage: lin('#8FA57A'), sky: lin('#8CC0E4'), vermilion: lin('#D8402A'),
  brass: lin('#C9A24A'), steel: lin('#2D3F5E'), nickel: lin('#D9DEE2'), umber: lin('#6E4A2C'), ochre: lin('#E3B24F'),
  green: lin('#4E6B45'), black: lin('#1B1A19'), white: lin('#F7F3E6'), pink: lin('#E7B49C'), apple: lin('#A8322A'),
  tin: lin('#C9CCCB'), blue: lin('#5E8FC4'), plum: lin('#6B4A5A'), straw: lin('#E9D79A'),
};
export const KIND = { enamel: 0, brick: 1, crate: 2, hill: 3, leaf: 4, tin: 5, brass: 6, steel: 7, nickel: 8, cloud: 9, matt: 10, stripe: 11, roof: 12, apples: 13, lid: 14 };
export const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
export const ss = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const fr = (x) => x - Math.floor(x);
export const hash = (x, y) => fr(Math.sin(x * 127.1 + y * 311.7) * 43758.5453);
export const noise = (x, y) => { const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  return (hash(xi, yi) * (1 - u) + hash(xi + 1, yi) * u) * (1 - v) + (hash(xi, yi + 1) * (1 - u) + hash(xi + 1, yi + 1) * u) * v; };
export const WAVE = 0.449;      // the cams' turning, radians a second of the world's clock (once round in 14 s)

const COMMON = /* glsl */`
uniform float uT; uniform vec3 uSun, uSunC, uSkyC, uGndC, uHazeC, uZen, uMid, uHor, uHaze; uniform vec4 uOrch; uniform float uWall;
uniform vec3 uCream, uRusset, uSage, uSky, uVermilion, uBrass, uSteel, uNickel, uUmber, uOchre, uGreen, uApple, uTin, uStraw;
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(hash(i), hash(i + vec2(1., 0.)), f.x), mix(hash(i + vec2(0., 1.)), hash(i + vec2(1., 1.)), f.x), f.y); }
vec3 skyc(vec3 d) { vec3 c = mix(uHor, uMid, smoothstep(-.02, .22, d.y)); return mix(c, uZen, smoothstep(.15, .85, d.y)); }
// what a mirror sees: the sky above, the tray's warm tone below
vec3 envc(vec3 r) { return mix(uGndC, skyc(vec3(r.x, abs(r.y), r.z)), smoothstep(-.08, .06, r.y)); }
vec3 hazed(vec3 c, float far) { return mix(c, uHazeC, uHaze.z * (1. - exp(-far / uHaze.x))); }
// what a cam lifts: r.x the cam's place in its turn, r.y how far it lifts (metres), r.z 0 a follower (up and down),
// 1 the cam itself (its middle goes round the shaft)
vec3 ride(vec3 r) { float a = r.x + uT * ${WAVE.toFixed(3)}; return r.z > .5 ? r.y * vec3(cos(a), sin(a), 0.) : vec3(0., r.y * (.5 + .5 * sin(a)), 0.); }
// is the place p cut off from the sun by the orchard's west or south wall (1 lit, 0 in shade)
float wallShade(vec3 p) { float s = 1.;
  if (p.x < uOrch.y) { float t = (uOrch.y - p.x) / uSun.x, z = p.z + t * uSun.z; if (z > uOrch.z && z < uOrch.w) s = min(s, smoothstep(-1., 1., p.y + t * uSun.y - uWall)); }
  if (p.z > uOrch.z) { float t = (uOrch.z - p.z) / uSun.z, x = p.x + t * uSun.x; if (x > uOrch.x && x < uOrch.y) s = min(s, smoothstep(-1., 1., p.y + t * uSun.y - uWall)); }
  return s; }
`;

// ---------------------------------------------------------------- tin, brass, steel: every piece that stands
const TIN_V = /* glsl */`
attribute vec3 aCol; attribute vec4 aP; attribute vec3 aR;
varying vec3 vW, vN, vCol; varying vec4 vP;
${COMMON}
void main() { vec4 lp = vec4(position, 1.); vec3 n = normal;
#ifdef USE_INSTANCING
  lp = instanceMatrix * lp; n = mat3(instanceMatrix) * n;
#endif
  vec4 w = modelMatrix * lp; w.xyz += ride(aR); vCol = aCol;
#ifdef USE_INSTANCING_COLOR
  vCol *= instanceColor;
#endif
  vW = w.xyz; vN = normalize(mat3(modelMatrix) * n); vP = aP; gl_Position = projectionMatrix * viewMatrix * w; }`;

const TIN_F = /* glsl */`
varying vec3 vW, vN, vCol; varying vec4 vP;
${COMMON}
// one layer of round brush dabs on a shaken grid S across: its cover, the dab's own number h, and how far up the dab we are (v)
float dabs(vec2 p, float S, float rr, float w, out float h, out float v) { vec2 q = p / S, id = floor(q), f = fract(q) - .5; h = hash(id);
  vec2 o = (vec2(hash(id + 3.1), hash(id + 7.7)) - .5) * .46; float r = rr * (.62 + .5 * hash(id + 1.3)); v = (f.y - o.y) / r;
  return 1. - smoothstep(-w / S, w / S, length(f - o) - r); }
void main() { vec3 n = normalize(vN);
  float far = length(cameraPosition - vW), k = vP.x; vec2 uv = vP.yz; float w = max(max(length(dFdx(uv)), length(dFdy(uv))), 1e-5);
  vec3 col = vCol; float gloss = .55, metal = 0.;
  if (k < .5) { }                                                   // plain enamel, the colour at its corners
  else if (k < 1.5) {                                               // brick: russet courses painted on cream, 6 by 2.4 m
    float row = floor(uv.y / 2.4), fy = abs(fract(uv.y / 2.4) - .5) * 2.4, fx = abs(fract(uv.x / 6. + .5 * mod(row, 2.)) - .5) * 6.;
    float l = max(1. - smoothstep(.16, .16 + w, 1.2 - fy), 1. - smoothstep(.16, .16 + w, 3. - fx));
    l = mix(l, .2, smoothstep(.5, 2.2, w)); col = mix(col, uRusset, l * .8); col *= .94 + .1 * hash(vec2(row, floor(uv.x / 6. + .5 * mod(row, 2.)))) * (1. - smoothstep(1., 4., w)); }
  else if (k < 2.5) {                                               // a crate's side: five slats, corner posts, apples in the gaps
    float fy = fract(uv.y * 5.), gap = 1. - smoothstep(.1, .1 + 5. * w, min(fy, 1. - fy)), post = 1. - smoothstep(.1, .1 + w, min(uv.x, 1. - uv.x));
    float hh, vv; float ap = dabs(uv * vec2(1., 1.) + .13, .2, .36, w, hh, vv);
    vec3 inner = mix(uUmber * .35, uApple * (.8 + .5 * vv * .5), ap * step(.3, hh)); gap *= (1. - post);
    gap = mix(gap, .2, smoothstep(.04, .12, w)); col = mix(col, inner, gap); col = mix(col, vCol * .82, post * .5);
    col *= .95 + .08 * hash(vec2(floor(uv.y * 5.), vP.w)); }
  else if (k < 3.5) {                                               // a hill flat: woods in dabs, fields low down (uv metres, vP.w its height)
    float H = vP.w, lo = 1. - smoothstep(.05 * H, .18 * H, uv.y + 6. * sin(uv.x / 47.));
    col *= .9 + .2 * noise(uv / 60.);
    vec3 fld = mix(uStraw, mix(uSage, uOchre, hash(vec2(floor(uv.x / 52.), 3.))), step(.45, hash(vec2(floor(uv.x / 52.), 9.))));
    float fl = (1. - smoothstep(.3, .3 + w, abs(fract(uv.x / 52.) - .5) * 52. - 24.)); col = mix(col, mix(fld, uGreen, 1. - fl), lo * .8);
    float h1, v1, h2, v2; float d1 = dabs(uv, 16., .44, w, h1, v1) * step(.4, h1) * (1. - lo * .85), d2 = dabs(uv + 37., 9., .4, w, h2, v2) * step(.55, h2) * (1. - lo * .6);
    vec3 t1 = h1 < .55 ? uRusset : h1 < .7 ? uOchre : h1 < .86 ? uSage : uGreen, t2 = h2 < .7 ? uOchre : h2 < .85 ? uRusset : uGreen;
    t1 *= .78 + .34 * smoothstep(-.9, .7, v1); t2 *= .8 + .3 * smoothstep(-.9, .7, v2);
    vec3 mean = mix(mix(col, (uRusset + uOchre + uSage) / 3., .3), (uOchre + uRusset) / 2., .2);
    vec3 fine = mix(mix(col, t1, d1), t2, d2); col = mix(fine, mean, smoothstep(3., 10., w));
    col = mix(col, vCol, .25 * smoothstep(.3, .9, vP.w / 300.)); gloss = .5; }
  else if (k < 4.5) {                                               // a crown of leaves: dabs of the tree's own tones (uv metres)
    float h1, v1; float d1 = dabs(uv, 5.2, .5, w, h1, v1); vec3 t1 = (h1 < .4 ? uOchre : h1 < .7 ? vCol * 1.25 : uRusset) * (.75 + .4 * smoothstep(-.9, .7, v1));
    col = mix(mix(col * .8, t1, d1), mix(col * .8, (uOchre + vCol + uRusset) / 3., .7), smoothstep(1.2, 4., w)); }
  else if (k < 5.5) {                                               // bare tin: a flat's back, stamped ribs and tabs
    float rib = abs(fract(uv.x / 12.) - .5) * 12., tab = step(abs(fract(uv.x / 24.) - .5) * 24., 1.6) * step(abs(uv.y - 6.), 1.);
    col = uTin * (.82 + .12 * noise(uv / 9.)) * (1. - .22 * (1. - smoothstep(.3, .3 + w, rib)) * (1. - smoothstep(2., 8., w))); col = mix(col, uTin * .4, tab * (1. - smoothstep(.5, 2., w)));
    metal = .55; gloss = .6; }
  else if (k < 6.5) { col = uBrass * (.86 + .22 * noise(vec2(uv.x * .35, uv.y * 6.))); metal = .9; gloss = .9; }       // lacquered brass, turned
  else if (k < 7.5) { col = uSteel * (.9 + .2 * noise(uv * vec2(.3, 5.))); metal = .85; gloss = 1.; }                 // blued steel
  else if (k < 8.5) { col = uNickel; metal = .95; gloss = 1.; }                                                    // nickel
  else if (k < 9.5) {                                               // a tin cloud: cream, its underside painted blue grey, brush swirls
    float sw = noise(uv / 9. + vec2(0., noise(uv / 23.) * 3.)); col = mix(col * mix(vec3(.62, .7, .85), vec3(1.), smoothstep(.12, .6, uv.y / max(vP.w, 1.) + .2 * (sw - .5))), col, .0);
    col *= .96 + .08 * sw * (1. - smoothstep(2., 8., w)); gloss = .5; }
  else if (k < 10.5) { gloss = .1; }                                // matt (eyes, tyres)
  else if (k < 11.5) { float st = abs(fract(uv.y / 9. + uv.x * .0) - .5) * 9.; col = mix(uVermilion, uCream, mix(smoothstep(2.25 - w, 2.25 + w, st), .5, smoothstep(2., 7., w))); }   // the striped post
  else if (k < 12.5) { float row = floor(uv.y / 3.), sc = abs(fract(uv.x / 4. + .5 * mod(row, 2.)) - .5) * 4.;                                // a roof of painted scales
    col *= mix(.78 + .3 * smoothstep(0., 3., fract(uv.y / 3.) * 3.) - .12 * (1. - smoothstep(.2, .2 + w, 2. - sc)), .95, smoothstep(1., 4., w)); }
  else if (k < 13.5) {                                              // an apple tree's crown: leaf dabs and apples
    float h1, v1, h2, v2; float d1 = dabs(uv, 5.6, .52, w, h1, v1), d2 = dabs(uv + 11.2, 4.48, .26, w, h2, v2) * step(.45, h2);
    vec3 t1 = (h1 < .5 ? vCol * 1.3 : h1 < .8 ? uOchre : uSage) * (.72 + .45 * smoothstep(-.9, .7, v1));
    vec3 fine = mix(mix(col * .75, t1, d1), uApple * (.8 + .5 * smoothstep(-.6, .8, v2)), d2);
    col = mix(fine, mix(col, uOchre, .3), smoothstep(1.2, 4., w)); }
  else {                                                            // a crate's lid: apples seen from above
    float h1, v1; float d1 = dabs(uv, .2, .42, w, h1, v1), post = 1. - smoothstep(.07, .07 + w, min(min(uv.x, 1. - uv.x), min(uv.y, 1. - uv.y)));
    col = mix(mix(uUmber * .4, uApple * (.75 + .5 * smoothstep(-.6, .8, v1)) * (.8 + .4 * h1), mix(d1, .6, smoothstep(.04, .12, w))), vCol, post); }
  // THE ONE LIGHT
  float sh = wallShade(vW), ndl = max(dot(n, uSun), 0.) * sh;
  vec3 v = normalize(cameraPosition - vW), r = reflect(-v, n), hv = normalize(v + uSun);
  vec3 amb = mix(uGndC * .24, uSkyC * .35, n.y * .5 + .5);
  float f0 = mix(.05, .9, metal), fres = f0 + (1. - f0) * pow(1. - max(dot(n, v), 0.), 5.);
  vec3 dif = col * (uSunC * ndl + amb) * (1. - metal * .8);
  vec3 mir = envc(r) * mix(vec3(1.), col, metal) * fres * (.25 + .75 * gloss) * mix(.55, 1., metal);
  float sp = (pow(max(dot(n, hv), 0.), mix(40., 160., gloss)) * gloss * (.5 + 2.2 * metal) + pow(max(dot(n, hv), 0.), 7.) * .12 * gloss) * sh * step(0., dot(n, uSun));
  vec3 lit = dif + mir + uSunC * mix(vec3(1.), col, metal) * sp;
  gl_FragColor = vec4(hazed(lit, far), 1.); }`;

// ---------------------------------------------------------------- the tray's own paint (and the bench it stands on)
const TRAY_GLSL = /* glsl */`
uniform vec4 uRiv, uTray, uYard, uApron, uTrkBox; uniform vec4 uTrk[24];      // uTrkBox: the box of the map inside which the toys' slots lie
float segd(vec2 p, vec2 a, vec2 b, out float t) { vec2 pa = p - a, ba = b - a; t = clamp(dot(pa, ba) / dot(ba, ba), 0., 1.); return length(pa - ba * t); }
// the tray's paint at a place: its colour and its gloss (hole is kept at nought: the tray is whole, the slots are painted dark strips)
vec3 trayPaint(vec2 p, float w, out float gloss, out float hole) { gloss = .5; hole = 0.;
  // fields: a shaken, slanted grid, each field one enamel tone with brushed lines
  vec2 g = vec2(p.x + .22 * p.y, p.y - .13 * p.x) / vec2(230., 170.), id = floor(g), f = fract(g); float h = hash(id), h2 = hash(id + 5.3);
  vec3 c = h < .3 ? uStraw : h < .55 ? uSage : h < .78 ? uOchre * .92 : uRusset * 1.05; c = mix(c, uCream, .22);
  float along = h2 < .5 ? f.x * 230. : f.y * 170., line = abs(fract(along / 9. + .3 * sin((h2 < .5 ? f.y : f.x) * 9.)) - .5) * 9.;
  c *= 1. - .17 * (1. - smoothstep(1.2 - w, 1.2 + w, line)) * (1. - smoothstep(3., 9., w)) * step(.2, h);
  // rows of painted plants on the green fields, stooks on the straw ones
  { vec2 dq = vec2(f.x * 230., f.y * 170.) / 11., di = floor(dq), df = fract(dq) - .5; float dot1 = (1. - smoothstep(.27 - w / 11., .27 + w / 11., length(df))) * (1. - smoothstep(1.5, 5., w));
    if (h >= .3 && h < .55) c = mix(c, uGreen * (.8 + .5 * hash(di + id)), dot1 * .75); else if (h < .3 && hash(di + id * 3.) > .8) c = mix(c, uOchre * .8, dot1 * .8); }
  c *= .95 + .1 * noise(p / 37.);
  float hd = min(min(f.x, 1. - f.x) * 230., min(f.y, 1. - f.y) * 170.); c = mix(c, uGreen * (.8 + .4 * noise(p / 6.)), (1. - smoothstep(3.5 - w, 3.5 + w, hd)) * .9);
  // the orchard's floor, the yard, the works' apron and the crate yard
  vec2 oc = vec2(.5 * (uOrch.x + uOrch.y), .5 * (uOrch.z + uOrch.w)), oh = vec2(.5 * (uOrch.y - uOrch.x), .5 * (uOrch.w - uOrch.z)), od = abs(p - oc) - oh; float ob = max(od.x, od.y);
  vec3 grass = uSage * (.84 + .2 * noise(p / 11.)) * (.93 + .12 * step(.5, fract((p.x + p.y) / 28.))); { vec2 aq = p / 13., ai = floor(aq), af = fract(aq) - .5 - (vec2(hash(ai + 2.2), hash(ai + 6.1)) - .5) * .6; grass = mix(grass, uApple, (1. - smoothstep(.085 - w / 13., .085 + w / 13., length(af))) * step(.45, hash(ai)) * (1. - smoothstep(.5, 2., w))); }
  c = mix(c, grass, 1. - smoothstep(-w, w, ob - 26.));
  c = mix(c, uCream * (.9 + .08 * noise(p / 4.)), (1. - smoothstep(-w, w, length(p - uYard.xy) - uYard.z)) * .92);
  c = mix(c, uCream * (.9 + .08 * noise(p / 4.)), (1. - smoothstep(-w, w, max(abs(p.x - uApron.x) - uApron.z, abs(p.y - uApron.y) - uApron.w))) * .85);
  // the tray's own seams and rivets
  vec2 sg = abs(fract(p / 400. + .5) - .5) * 400.; float seam = min(sg.x, sg.y); c *= 1. - .16 * (1. - smoothstep(.6, .6 + w, seam)) * (1. - smoothstep(3., 12., w));
  vec2 rv = abs(fract(p / 20. + .5) - .5) * 20.; c *= 1. + .25 * (1. - smoothstep(.7, .7 + w, length(rv))) * step(seam, 3.) * step(1.2, seam) * (1. - smoothstep(.7, 2.5, w));
  // the slots the toys run in: a dark line between two brass rails
  float td = 1e4, tt; if (p.x > uTrkBox.x && p.x < uTrkBox.y && p.y > uTrkBox.z && p.y < uTrkBox.w) for (int i = 0; i < 24; i++) td = min(td, segd(p, uTrk[i].xy, uTrk[i].zw, tt));
  c = mix(c, uBrass * .8, (1. - smoothstep(2.2 - w, 2.2 + w, td)) * (1. - smoothstep(4., 14., w)) * .8); c = mix(c, vec3(.03, .025, .02), (1. - smoothstep(.9 - w, .9 + w, td)) * (1. - smoothstep(2., 8., w)));
  // THE RIVER: a belt of blued steel ribbons that runs (by the world's clock), each ribbon with its own brightness and passing glints
  float rt; float rd = segd(p, uRiv.xy, uRiv.zw, rt); vec2 rb = normalize(uRiv.zw - uRiv.xy); float ra = dot(p - uRiv.xy, rb), rc = dot(p - uRiv.xy, vec2(-rb.y, rb.x));
  if (rd < 39. && rt > 0. && rt < 1.) { float rib = floor(rc / 3.5), rh = hash(vec2(rib, 2.)), run = ra - uT * (26. + 8. * rh);
    vec3 st = mix(uSteel, uSky, .18 + .3 * rh) * (.8 + .5 * noise(vec2(run / 38., rib)));
    float gl = smoothstep(.8, .97, noise(vec2(run / 11., rib * 3.7))) * (1. - smoothstep(2., 7., w)); st += uSky * gl * .7 + .25 * gl;
    st *= 1. - .3 * (1. - smoothstep(.25, .25 + w, abs(fract(rc / 3.5) - .5) * 3.5 - 1.45 + 1.7)) * 0.;
    st = mix(st, mix(uSteel, uSky, .33), smoothstep(1.2, 5., w) * .6);
    float edge = smoothstep(35. - w, 35. + w, abs(rc)); c = mix(st, uBrass * .85, edge); gloss = mix(1., .8, edge); }
  return c; }
`;
const TRAY_V = /* glsl */`
varying vec3 vW;
void main() { vec4 w = modelMatrix * vec4(position, 1.); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`;
const SHADE_V = /* glsl */`
attribute vec3 aR; varying vec3 vW;
${COMMON}
void main() { vec4 lp = vec4(position, 1.);
#ifdef USE_INSTANCING
  lp = instanceMatrix * lp;
#endif
  vec4 w = modelMatrix * lp; w.xyz += ride(aR); float up = max(w.y, 0.);
  vec3 g = w.xyz - uSun * (up / uSun.y); g.y = .05 + .0006 * length(cameraPosition - g);
  vW = g; gl_Position = projectionMatrix * viewMatrix * vec4(g, 1.); }`;
const TRAY_F = /* glsl */`
varying vec3 vW;
${COMMON}
${TRAY_GLSL}
void main() { float far = length(cameraPosition - vW); vec2 p = vW.xz; float w = max(max(length(dFdx(p)), length(dFdy(p))), 1e-5);
#ifdef BENCH
  // the bench the tray stands on: planed wood, its grain running north, to the horizon
  float gr = noise(vec2(p.x / 26., p.y / 900.)) + .5 * noise(vec2(p.x / 7., p.y / 400.)); vec3 c = mix(vec3(.2, .1, .045), vec3(.36, .2, .09), smoothstep(.3, 1.2, gr)) * (.9 + .2 * noise(p / 300.));
  c *= 1. - .35 * (1. - smoothstep(2., 2. + w, abs(fract(p.x / 520.) - .5) * 520.)) * (1. - smoothstep(20., 80., w));
  float gloss = .35, sun = 1.;
#else
  if (p.x < uTray.x || p.x > uTray.y || p.y < uTray.z || p.y > uTray.w) discard;
  float gloss, hole; vec3 c = trayPaint(p, w, gloss, hole); if (hole > .5) discard;
#ifdef SHADOW
  float sun = 0.;
#else
  float sun = 1.;
#endif
#endif
  vec3 v = normalize(cameraPosition - vW), n = vec3(0., 1., 0.), r = reflect(-v, n);
  vec3 lit = c * (uSunC * uSun.y * sun + mix(uGndC * .24, uSkyC * .35, 1.));
  float fres = .05 + .95 * pow(1. - max(v.y, 0.), 5.); lit = mix(lit, skyc(r), fres * gloss * .55);
  lit += uSunC * pow(max(dot(n, normalize(v + uSun)), 0.), 220.) * gloss * sun * 1.2;
  gl_FragColor = vec4(hazed(lit, far), 1.); }`;

// ---------------------------------------------------------------- the toy's own sky: enamel, graded, with brushed clouds
const SKY_V = /* glsl */`varying vec3 vD; void main() { vD = position; gl_Position = projectionMatrix * viewMatrix * vec4(position + cameraPosition, 1.); gl_Position.z = gl_Position.w; }`;
const SKY_F = /* glsl */`
varying vec3 vD;
${COMMON}
void main() { vec3 d = normalize(vD); vec3 c = skyc(d);
  float s = max(dot(d, uSun), 0.); c += uSunC * (pow(s, 5.) * .1 + pow(s, 40.) * .16);
  // brushed clouds, painted: long strokes with a hard edge and a blue grey underside
  vec2 q = vec2(atan(d.x, d.z) * 2.6, d.y * 13.); float n1 = noise(q * 1.3) * .6 + noise(q * 3.1 + 7.) * .3 + noise(q * vec2(9., 5.) + 3.) * .1;
  float band = smoothstep(.03, .1, d.y) * (1. - smoothstep(.3, .5, d.y)), cl = smoothstep(.56, .585, n1) * band;
  float n2 = noise((q + vec2(0., .22)) * 1.3) * .6 + noise((q + vec2(0., .22)) * 3.1 + 7.) * .3 + noise((q + vec2(0., .22)) * vec2(9., 5.) + 3.) * .1;
  vec3 cc = mix(vec3(.72, .78, .9), vec3(1., .97, .9), smoothstep(.56, .64, n2)); c = mix(c, cc * (uCream * .5 + .5), cl * .85);
  gl_FragColor = vec4(c, 1.); }`;

// ---------------------------------------------------------------- a sheet of pieces: corners with their colour, their paint and their cam
export function sheet() { const P = [], N = [], C = [], A = [], R = [];
  const v = (p, n, c, a, r) => { P.push(p.x, p.y, p.z); N.push(n.x, n.y, n.z); C.push(c[0], c[1], c[2]); A.push(a[0], a[1], a[2], a[3]); R.push(r[0], r[1], r[2]); };
  return { P, N, C, A, R, v, tris: () => P.length / 9,
    geometry() { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3));
      g.setAttribute('aCol', new THREE.Float32BufferAttribute(C, 3)); g.setAttribute('aP', new THREE.Float32BufferAttribute(A, 4)); g.setAttribute('aR', new THREE.Float32BufferAttribute(R, 3)); g.computeBoundingSphere(); return g; } }; }
const NOR = [0, 0, 0], _a = new THREE.Vector3(), _b = new THREE.Vector3(), _c = new THREE.Vector3(), _d = new THREE.Vector3(), _n = new THREE.Vector3(), _nm = new THREE.Matrix3();
const colOf = (col, p) => (typeof col === 'function' ? col(p) : col);
// a four cornered piece a, b, c, d (in turn round it) under the placing m: one colour or a colour for each corner, the paint's kind, its corners' places in the paint
export function quad(sh, m, a, b, c, d, col, kind, uv, w = 0, r = NOR, back = null) {
  _a.set(a[0], a[1], a[2]).applyMatrix4(m); _b.set(b[0], b[1], b[2]).applyMatrix4(m); _c.set(c[0], c[1], c[2]).applyMatrix4(m); _d.set(d[0], d[1], d[2]).applyMatrix4(m);
  _n.copy(_b).sub(_a).cross(_c.clone().sub(_a)).normalize(); const cs = Array.isArray(col[0]) ? col : [col, col, col, col], u = uv || [[0, 0], [1, 0], [1, 1], [0, 1]];
  const A4 = (i) => [kind, u[i][0], u[i][1], w], put = (q, i, nn, kk, cc) => sh.v(q, nn, cc || cs[i], kk || A4(i), r);
  put(_a, 0, _n); put(_b, 1, _n); put(_c, 2, _n); put(_a, 0, _n); put(_c, 2, _n); put(_d, 3, _n);
  if (back) { const nb = _n.clone().negate(), B4 = (i) => [back.kind, u[i][0], u[i][1], back.w ?? w], bc = back.col;
    put(_a, 0, nb, B4(0), bc); put(_c, 2, nb, B4(2), bc); put(_b, 1, nb, B4(1), bc); put(_a, 0, nb, B4(0), bc); put(_d, 3, nb, B4(3), bc); put(_c, 2, nb, B4(2), bc); } }
// a box sx, sy, sz about the origin under m; each side painted in metres (uvm) or from nought to one
export function box(sh, m, sx, sy, sz, col, kind, o = {}) { const x = sx / 2, y = sy / 2, z = sz / 2, w = o.w ?? 0, r = o.r || NOR, met = o.metres;
  const F = [[[-x, -y, z], [x, -y, z], [x, y, z], [-x, y, z], sx, sy], [[x, -y, -z], [-x, -y, -z], [-x, y, -z], [x, y, -z], sx, sy], [[x, -y, z], [x, -y, -z], [x, y, -z], [x, y, z], sz, sy],
    [[-x, -y, -z], [-x, -y, z], [-x, y, z], [-x, y, -z], sz, sy], [[-x, y, z], [x, y, z], [x, y, -z], [-x, y, -z], sx, sz], [[-x, -y, -z], [x, -y, -z], [x, -y, z], [-x, -y, z], sx, sz]];
  F.forEach((f, i) => { if (o.skip && o.skip.includes(i)) return; const U = met ? f[4] : 1, V = met ? f[5] : 1, kk = i === 4 && o.top !== undefined ? o.top : kind;
    quad(sh, m, f[0], f[1], f[2], f[3], i === 4 && o.topCol ? o.topCol : col, kk, [[0, 0], [U, 0], [U, V], [0, V]], w, r); }); }
// a round body: radii rx, ry, rz about the origin under m; its colour may be asked of each corner's place on the unit ball
export function ball(sh, m, rx, ry, rz, col, kind = 0, o = {}) { const nu = o.nu || 14, nv = o.nv || 9, w = o.w ?? 0, r = o.r || NOR, us = o.us || 1; _nm.getNormalMatrix(m);
  const P = (i, j) => { const th = (i / nu) * Math.PI * 2, ph = (j / nv) * Math.PI, s = Math.sin(ph); return [s * Math.sin(th), Math.cos(ph), s * Math.cos(th), th]; };
  const put = (u) => { const p = new THREE.Vector3(u[0] * rx, u[1] * ry, u[2] * rz).applyMatrix4(m), n = new THREE.Vector3(u[0] / rx, u[1] / ry, u[2] / rz).applyMatrix3(_nm).normalize(); sh.v(p, n, colOf(col, u), o.cyl ? [kind, u[3] * us, u[1] * us, w] : [kind, u[0] * us, u[1] * us, w], r); };
  for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) { const a = P(i, j), b = P(i + 1, j), c = P(i + 1, j + 1), d = P(i, j + 1); if (j > 0) { put(a); put(d); put(b); } if (j < nv - 1) { put(b); put(d); put(c); } } }
// a round bar or cone along y from 0 to h, radius r0 at its foot and r1 at its head
export function bar(sh, m, r0, r1, h, col, kind = 0, o = {}) { const n = o.n || 10, w = o.w ?? 0, r = o.r || NOR; _nm.getNormalMatrix(m); const sl = (r0 - r1) / h;
  const put = (a, y, rr) => { const p = new THREE.Vector3(Math.sin(a) * rr, y, Math.cos(a) * rr).applyMatrix4(m), nn = new THREE.Vector3(Math.sin(a), sl, Math.cos(a)).applyMatrix3(_nm).normalize(); sh.v(p, nn, colOf(col, [Math.sin(a), y / h, Math.cos(a)]), [kind, a * rr, y, w], r); };
  for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2, b = ((i + 1) / n) * Math.PI * 2; put(a, 0, r0); put(b, 0, r0); put(b, h, r1); put(a, 0, r0); put(b, h, r1); put(a, h, r1); }
  if (o.caps) for (const [y, rr, s] of [[h, r1, 1], [0, r0, -1]]) { if (rr < 1e-6) continue; const nn = new THREE.Vector3(0, s, 0).applyMatrix3(_nm).normalize(), cc = new THREE.Vector3(0, y, 0).applyMatrix4(m);
    for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2, b = ((i + 1) / n) * Math.PI * 2, pa = new THREE.Vector3(Math.sin(a) * rr, y, Math.cos(a) * rr).applyMatrix4(m), pb = new THREE.Vector3(Math.sin(b) * rr, y, Math.cos(b) * rr).applyMatrix4(m);
      const c0 = colOf(o.capCol || col, [0, y / h, 0]), kk = o.capKind ?? kind; if (s > 0) { sh.v(cc, nn, c0, [kk, 0, 0, w], r); sh.v(pa, nn, c0, [kk, Math.sin(a) * rr, Math.cos(a) * rr, w], r); sh.v(pb, nn, c0, [kk, Math.sin(b) * rr, Math.cos(b) * rr, w], r); }
      else { sh.v(cc, nn, c0, [kk, 0, 0, w], r); sh.v(pb, nn, c0, [kk, Math.sin(b) * rr, Math.cos(b) * rr, w], r); sh.v(pa, nn, c0, [kk, Math.sin(a) * rr, Math.cos(a) * rr, w], r); } } } }
// a flat piece cut from tin: its outline in its own plane (x right, y up; round it in turn), fanned from a middle point; painted on both sides
export function cut(sh, m, pts, mid, col, kind, o = {}) { const w = o.w ?? 0, r = o.r || NOR, bk = o.back, us = o.uvScale || 1; _nm.getNormalMatrix(m);
  const nf = new THREE.Vector3(0, 0, 1).applyMatrix3(_nm).normalize(), nb = nf.clone().negate(), W = (p) => new THREE.Vector3(p[0], p[1], 0).applyMatrix4(m), n = pts.length;
  for (let i = 0; i < n; i++) { const a = pts[i], b = pts[(i + 1) % n], T = [mid, a, b];
    for (const p of T) sh.v(W(p), nf, colOf(col, p), [kind, p[0] * us, p[1] * us, w], r);
    for (const p of [mid, b, a]) sh.v(W(p), nb, bk ? colOf(bk.col, p) : colOf(col, p), [bk ? bk.kind : kind, p[0] * us, p[1] * us, bk?.w ?? w], r); } }
// a flat piece that stands on a base line: its top's height over each step along it (a hill flat); front painted, back bare tin
export function flat(sh, m, xs, hs, col, kind, o = {}) { const w = o.w ?? 0, r = o.r || NOR, y0 = o.y0 || 0;
  for (let i = 0; i < xs.length - 1; i++) quad(sh, m, [xs[i], y0, 0], [xs[i + 1], y0, 0], [xs[i + 1], hs[i + 1], 0], [xs[i], hs[i], 0], col, kind, [[xs[i], y0], [xs[i + 1], y0], [xs[i + 1], hs[i + 1]], [xs[i], hs[i]]], w, r, o.back || null); }

export function makeTinwork(o = {}) {
  const v3 = (c) => new THREE.Vector3(c[0], c[1], c[2]), sun = new THREE.Vector3(...(o.sun || [0.34, 0.36, -0.87])).normalize();
  const U = { uT: { value: 0 }, uSun: { value: sun }, uSunC: { value: v3(lin('#FFE6C0')).multiplyScalar(2.0) }, uSkyC: { value: v3(lin('#CFE0F2')) }, uGndC: { value: v3(lin('#C9B48A')) },
    uHazeC: { value: v3(lin('#EFE6CE')) }, uHaze: { value: new THREE.Vector3(5200, 0, 0.27) },
    uZen: { value: v3(lin('#6FA8DC')) }, uMid: { value: v3(lin('#BFDDF0')) }, uHor: { value: v3(lin('#F6ECCB')) },
    uOrch: { value: new THREE.Vector4(-260, 260, 1700, 2120) }, uWall: { value: 22 }, uRiv: { value: new THREE.Vector4(-585, 690, 60, 1120) }, uTray: { value: new THREE.Vector4(-1330, 1330, 100, 3640) },
    uYard: { value: new THREE.Vector4(120, 1150, 95, 0) }, uApron: { value: new THREE.Vector4(-150, 3150, 420, 330) }, uTrkBox: { value: new THREE.Vector4(-600, 700, 900, 2400) },
    uTrk: { value: Array.from({ length: 24 }, () => new THREE.Vector4(1e6, 1e6, 1e6 + 1, 1e6)) } };
  for (const k of ['cream', 'russet', 'sage', 'sky', 'vermilion', 'brass', 'steel', 'nickel', 'umber', 'ochre', 'green', 'apple', 'tin', 'straw']) U['u' + k[0].toUpperCase() + k.slice(1)] = { value: v3(COL[k]) };
  const tinMat = new THREE.ShaderMaterial({ uniforms: U, vertexShader: TIN_V, fragmentShader: TIN_F });
  const shadeMat = new THREE.ShaderMaterial({ uniforms: U, vertexShader: SHADE_V, fragmentShader: TRAY_F, side: THREE.DoubleSide, defines: { SHADOW: 1 }, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
  const trayMat = new THREE.ShaderMaterial({ uniforms: U, vertexShader: TRAY_V, fragmentShader: TRAY_F });
  const benchMat = new THREE.ShaderMaterial({ uniforms: U, vertexShader: TRAY_V, fragmentShader: TRAY_F, defines: { BENCH: 1 } });
  const skyMat = new THREE.ShaderMaterial({ uniforms: U, vertexShader: SKY_V, fragmentShader: SKY_F, side: THREE.BackSide, depthWrite: false, depthTest: false });
  const named = (m, name, order = 0) => { m.name = name; m.frustumCulled = false; m.renderOrder = order; return m; };
  return { uniforms: U, sun, tinMat, shadeMat,
    sky(r) { return named(new THREE.Mesh(new THREE.SphereGeometry(r, 32, 16), skyMat), 'sky', -10); },
    // the tray: one sheet at the level nought; the bench under it
    tray(x0, x1, z0, z1, deep) { const g = new THREE.Group(), pl = (y, ax0, ax1, az0, az1, mat, name, ord) => { const ge = new THREE.BufferGeometry();
      ge.setAttribute('position', new THREE.Float32BufferAttribute([ax0, y, az0, ax0, y, az1, ax1, y, az1, ax0, y, az0, ax1, y, az1, ax1, y, az0], 3)); g.add(named(new THREE.Mesh(ge, mat), name, ord)); };
      pl(0, x0, x1, z0, z1, trayMat, 'tray', -6); pl(-deep, -30000, 30000, -30000, 30000, benchMat, 'bench', -8); return g; },
    // a sheet's pieces as they stand, and their shadows laid on the tray
    mesh(sh, name) { return named(new THREE.Mesh(sh.geometry(), tinMat), name); },
    shade(geo, name) { return named(new THREE.Mesh(geo, shadeMat), name + '-shade', -4); },
    many(geo, n, name) { const im = new THREE.InstancedMesh(geo, tinMat, n); return named(im, name); },
    manyShade(im, name) { const s = new THREE.InstancedMesh(im.geometry, shadeMat, im.count); s.instanceMatrix = im.instanceMatrix; return named(s, name + '-shade', -4); },
  };
}

// ---------------------------------------------------------------- the toys, of this crew's own make
const M = () => new THREE.Matrix4(), T = (x, y, z) => M().makeTranslation(x, y, z), RX = (a) => M().makeRotationX(a), RY = (a) => M().makeRotationY(a), RZ = (a) => M().makeRotationZ(a);
const mul = (...ms) => ms.reduce((a, b) => a.clone().multiply(b));
// the wheeled plate every toy stands on (its middle at the origin, the wheels' feet at y 0), w wide and l long
function plate(sh, w, l, col) { box(sh, T(0, 2.6, 0), w, 0.9, l, col, KIND.enamel);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const m = mul(T(sx * (w / 2 + 0.2), 2.1, sz * (l / 2 - 2.4)), RZ(Math.PI / 2), T(0, -0.6, 0)); bar(sh, m, 2.1, 2.1, 1.2, COL.black, KIND.matt, { n: 12, caps: true, capCol: COL.nickel, capKind: KIND.nickel }); } }
// A FOX of pressed tin, upright on its hind legs on a wheeled plate, 25 m to its ear tips; arms: 0 held out before it, 1 paws over its eyes
export function foxSheet(arms = 0) { const sh = sheet(), V = COL.vermilion, Wt = COL.white, Bk = COL.black;
  plate(sh, 9, 12, mix(COL.umber, COL.black, 0.4));
  for (const s of [-1, 1]) bar(sh, T(s * 2.1, 3, 0.4), 1.5, 1.3, 3.2, Bk, KIND.enamel, { n: 8 });                                        // hind legs in black socks
  ball(sh, T(0, 11.6, 0), 4.6, 7.4, 4.3, (u) => (u[2] > 0.25 && u[1] < 0.75 && Math.abs(u[0]) < 0.62 ? Wt : V));                          // body, white chest
  ball(sh, mul(T(0, 7.4, -6.6), RX(-0.6)), 2.5, 2.3, 6.4, (u) => (u[2] < -0.55 ? Wt : V), 0, { nu: 10, nv: 8 });                           // the brush, white tipped
  ball(sh, T(0, 20.6, 1.0), 3.7, 3.2, 3.6, (u) => (u[1] < -0.2 && u[2] > 0.1 ? Wt : V), 0, { nu: 12, nv: 8 });                             // head, white cheeks
  bar(sh, mul(T(0, 19.9, 3.6), RX(Math.PI / 2 - 0.12)), 2.0, 0.6, 5.0, (u) => (u[2] < -0.1 ? Wt : V), 0, { n: 10 });                       // the muzzle (white under)
  ball(sh, T(0, 20.5, 8.6), 0.8, 0.7, 0.8, Bk, KIND.matt, { nu: 8, nv: 5 });                                                              // the nose
  for (const s of [-1, 1]) { cut(sh, mul(T(s * 2.2, 22.6, 0.6), RZ(-s * 0.22), RX(-0.12)), [[-1.5, 0], [1.5, 0], [0.2, 4.6]], [0, 1.4], (p) => (p[1] > 3 ? Bk : V), KIND.enamel);  // ears, black tipped
    ball(sh, T(s * 1.55, 21.3, 4.2), 0.62, 0.72, 0.4, Bk, KIND.matt, { nu: 8, nv: 5 }); ball(sh, T(s * 1.4, 21.6, 4.5), 0.2, 0.2, 0.14, Wt, 0, { nu: 6, nv: 4 });                     // eyes, each with its glint
    const arm = arms ? mul(T(s * 3.7, 15.0, 1.4), RX(0.72), RZ(s * 0.5)) : mul(T(s * 4.0, 15.0, 1.0), RX(1.15), RZ(-s * 0.1));
    bar(sh, arm, 1.15, 0.95, arms ? 7.6 : 6.4, (u) => (u[1] > 0.72 ? Bk : V), 0, { n: 8, caps: true }); }
  bar(sh, mul(T(0, 13.2, -4.0), RX(-Math.PI / 2)), 0.9, 0.9, 1.6, COL.brass, KIND.brass, { n: 8 });                                        // the key's bush in its back
  return sh; }
// A HARE of pressed tin, sitting up on a wheeled plate, its ears 26 m up; crouched: lower, ears laid back
export function hareSheet(crouch = 0) { const sh = sheet(), Cc = COL.cream, Wt = COL.white, Bk = COL.black, k = crouch ? 0.72 : 1;
  plate(sh, 8.4, 10.5, mix(COL.sage, COL.black, 0.45));
  ball(sh, T(0, 3 + 6.3 * k, 0), 4.3, 6.3 * k, 4.8, (u) => (u[2] > 0.4 && Math.abs(u[0]) < 0.5 ? Wt : Cc));
  ball(sh, T(0, 3 + 3.4 * k, 2.6), 3.0, 3.3 * k, 3.2, Cc, 0, { nu: 10, nv: 7 });                                                         // the haunch and forepaws as one swell
  ball(sh, T(0, 3.2 + 2.2 * k, -4.9), 1.7, 1.7, 1.7, Wt, 0, { nu: 8, nv: 6 });                                                           // the scut
  const hy = 3 + 13.6 * k; ball(sh, T(0, hy, 1.5), 3.0, 2.9, 3.4, Cc, 0, { nu: 12, nv: 8 });
  ball(sh, T(0, hy - 0.5, 4.7), 0.6, 0.5, 0.5, COL.pink, KIND.matt, { nu: 6, nv: 4 });
  for (const s of [-1, 1]) { ball(sh, T(s * 1.75, hy + 0.7, 3.6), 0.6, 0.7, 0.4, Bk, KIND.matt, { nu: 8, nv: 5 }); ball(sh, T(s * 1.6, hy + 1.0, 3.9), 0.2, 0.2, 0.14, Wt, 0, { nu: 6, nv: 4 });
    const ear = mul(T(s * 1.2, hy + 2.2, 0.4), RZ(-s * (crouch ? 0.25 : 0.1)), RX(crouch ? -1.25 : -0.1)), o = [[-1.2, 0], [1.2, 0], [1.45, 5.5], [0.5, 9.6], [-0.5, 9.6], [-1.45, 5.5]];
    cut(sh, ear, o, [0, 4.5], (p) => (Math.abs(p[0]) < 0.75 && p[1] > 1 && p[1] < 8.4 ? COL.pink : Cc), KIND.enamel, { back: { col: Cc, kind: KIND.enamel } }); }
  bar(sh, mul(T(0, 3 + 7 * k, -4.5), RX(-Math.PI / 2)), 0.9, 0.9, 1.6, COL.brass, KIND.brass, { n: 8 });
  return sh; }
// THE KEY in a toy's back: its stem along -z from the origin, its two wings in the plane of x and z; it turns about z
export function keySheet() { const sh = sheet(); bar(sh, mul(RX(-Math.PI / 2)), 0.55, 0.55, 3.6, COL.brass, KIND.brass, { n: 8 });
  for (const s of [-1, 1]) { const pts = []; for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; pts.push([s * 2.3 + 1.9 * Math.cos(a), 1.5 * Math.sin(a)]); } cut(sh, mul(T(0, 0, -4.4), RX(Math.PI / 2)), pts, [s * 2.3, 0], COL.brass, KIND.brass); }
  return sh; }
// A CRATE of apples: a tin box one metre a side about the origin (scaled where it stands), slats painted on its sides, apples under its open top
export function crateSheet() { const sh = sheet(); box(sh, M(), 1, 1, 1, COL.white, KIND.crate, { top: KIND.lid }); return sh; }
// A GOOSE of tin: its body along z (flying +z), 13 m long; its two wings are sheets of their own, hinged along z at the shoulders
export function gooseSheet() { const sh = sheet(), G = mix(COL.cream, COL.tin, 0.35), D = mix(COL.umber, COL.cream, 0.35);
  ball(sh, T(0, 0, 0), 2.4, 2.2, 5.6, (u) => (u[1] < -0.2 ? COL.white : u[2] < -0.5 ? D : G), 0, { nu: 10, nv: 8 });
  bar(sh, mul(T(0, 0.4, 4.6), RX(1.2)), 1.2, 0.8, 5.2, G, 0, { n: 8 }); ball(sh, T(0, 2.4, 9.6), 1.15, 1.05, 1.5, G, 0, { nu: 8, nv: 6 });
  bar(sh, mul(T(0, 2.3, 10.6), RX(Math.PI / 2)), 0.6, 0.1, 2.2, COL.ochre, 0, { n: 6 });
  for (const s of [-1, 1]) ball(sh, T(s * 0.75, 2.75, 10.2), 0.22, 0.24, 0.2, COL.black, KIND.matt, { nu: 6, nv: 4 });
  cut(sh, mul(T(0, 0.4, -5.2), RX(-Math.PI / 2 + 0.15)), [[-2.2, 0], [2.2, 0], [1.4, 3.4], [-1.4, 3.4]], [0, 1.6], D, KIND.enamel);
  return sh; }
export function wingSheet(side) { const sh = sheet(), G = mix(COL.cream, COL.tin, 0.35), D = mix(COL.umber, COL.cream, 0.35), s = side;
  const pts = [[0, -2.6], [s * 4, -3.2], [s * 9.5, -1.6], [s * 10.5, 0.4], [s * 6, 2.4], [0, 2.6]]; if (s < 0) pts.reverse();
  cut(sh, RX(-Math.PI / 2), pts, [s * 4, 0], (p) => (Math.abs(p[0]) > 6.5 ? D : G), KIND.enamel); return sh; }
// A BOAT of tin on the river: a hull, a mast, one cream sail
export function boatSheet() { const sh = sheet(); ball(sh, T(0, 0.6, 0), 3.2, 2.6, 8, (u) => (u[1] > -0.1 ? COL.cream : COL.russet), 0, { nu: 10, nv: 8 });
  bar(sh, T(0, 1, 0.5), 0.3, 0.25, 15, COL.steel, KIND.steel, { n: 6 }); cut(sh, mul(T(0, 3.5, 0.5), RY(Math.PI / 2 - 0.5)), [[0.3, 0], [7.5, 0.6], [0.3, 12]], [2.2, 3.5], COL.cream, KIND.enamel); return sh; }
