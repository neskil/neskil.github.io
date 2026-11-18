// THE DESERT OPENS: Namaqualand after winter rain, six sun-days in forty seconds.
// A hyperlapse dolly over a red granite-gravel plain: rain and puddles, a green haze, then bands of orange, white and
// magenta daisies that open, follow a racing sun and shut each dusk; on the last morning a line of sunlight (the edge of
// the sea fog peeling back) outruns the camera to Kokerboom Koppie, and everything behind it opens.
// One clock(u) drives sun, sky, light, wetness, growth and opening, so playback speed changes nothing.
// World space == hero-local space: the koppie stands at the origin, the camera arrives from +Z flying toward -Z.
// The route: 110 m straight, one left-hand arc of 760 m radius through 60 degrees, then the hero's fly line up the koppie; 1,091 m.
// The lens comes in 8.6 m up (the previous portal's opening is 7 m in radius and must not look under the ground), eases down to 3 m
// over the first sixth of the route, flies 1.6 m up through the flowers from day 3, rides 3 m over the last morning's rollers and
// climbs the koppie's skirt to the portal on the saddle.
// What stands where (metres along the route; each thing by the rule that puts it there):
//   the Sentinel, an 11 m quiver tree on an 8 m boulder stack with the weavers' nest, 106 m in and 13.3 m right of the line;
//   a rain pan 196 m in, 9 m left of the line: full at the first sun of day 2, cracked clay by its noon;
//   boulder stacks crowned with quiver trees beside the line by one seeded law (see the stacks of the plain: one in every 66 m of
//   the route and 12 to 25 m off the line before the ridge, one in every 45 m and 10 to 18 m off it from the ridge's far foot to the
//   bull's ground; great stacks stand back); granite boulders in twos and threes between them; of the boulders the seeded laws
//   deal (the stacks of the plain, their foot boulders, the clusters, the scatter) none over 1.5 m in radius stands with its near
//   face less than 9 m from the line (see FACE); the named rock of the design and of the first version (the Sentinel, the first
//   outlier, the tall stacks, the pair on the knolls, the dusk group) stands where it stood, its main boulders' near sides about
//   6.5 to 9 m from the line;
//   a heuweltjie 385 m in on the left; a ridge 8 m high that the line climbs by its left shoulder (crest 562 m in, its slopes 52 m
//   long either way); a damp hollow left of the line from the foot of the ridge's far slope (614 m) to the middle of the second
//   wash's far bank (771 m), its middle 14 m left of the line and its rim 20 m from that, half a metre deep (see HOL); a second dry
//   wash that lies under the line from 650 to 700 m, with pools in its bed and rain daisies on both banks; two low rollers across
//   the line 792 and 858 m in and a pair of knolls where the climb begins; the wind pump 45 m left of the halfway point; six ring
//   koppies; two granite massifs, each where a draw of their own stream puts it, 150 to 600 m from the route (see the massifs);
//   the Kamiesberg, a flat blue band.
// The clock (u): 0-0.125 day 1, rain to dusk: dark wet gravel, puddles wherever the ground's own noise holds water (each mirrors
// the sky that stands over it at that moment, darkens toward its middle and has a soaked margin), the sun going down on the right; 0.125-0.153 the first star night; 0.153-0.315 day 2, a green haze under one
// plain sun from dawn to dusk; 0.315-0.365 the second star night; days 3, 4 and 5 (0.365-0.468, 0.482-0.575, 0.59-0.708) with a
// short blue dip of twilight after each (no stars: the sun is five degrees under); 0.728-1 the last morning.
// From day 3 a treadmill of real PLANTS rides with the lens (two to six heads each on stems over a leaf rosette: orange and yellow
// daisies, white rain daisies, small gazanias, ragwort in colonies, a few bulbinella spikes; soft shadows, red gravel between the
// clumps, shut goblets at dawn and dusk, butterflies over them by day).
// The cast. Gemsbok are this file's own animal (gemsbokGeometry: lofted and smooth, the brief's markings painted in its shader, a
// sun rim), all at middle distance: the herd of day 4 walks one file across the line of flight on the orange foot of the ridge's
// far slope, on one track fixed in the world (the brief's u 0.55: its last three clear the line 18 m ahead of where the lens is
// then; see HTRK); the bull grazes 9 m right of the line with two cows behind him (the brief's u 0.84); every other standing animal
// is seated on a landform by one seeded rule, in parties of two to four at the brief's middle distance first (see the standing
// gemsbok): a party's nearest animal stands 9 to 14 m from the line and the others behind it, away from the line, a party every
// 90 to 130 m where the land gives a seat (the one in the pan's water stands 7.5 m left of the line). The ostriches (a cock and two hens) run their
// lane 13 m left of the line at a steady 16 m/s through day 5, along a damp hollow white with rain daisies, and the lens draws
// past them (the brief's u 0.63 to 0.71; see ostrichAt). Two eagles circle
// Kokerboom Koppie the whole flight; weavers stream at the Sentinel and at the portal tree; a leopard tortoise runs the game path on
// the last morning; beetles glitter over the open heads.
// The sky. Stars wheel about the south celestial pole and the Milky Way turns with them: a fixed great circle of that sky (see
// uMwN), rich with star clouds and dark lanes; by night the land is pale and readable under a key from the pole's own bearing.
// The last morning (the fog look): the brief's sun, 30 rising to 38 degrees up over the left shoulder; the lid is a low ceiling of
// soft rolls with a band of the coming day's sky under its far edge, and the field lies shut under it, each head in the colour
// of its back, until the line of sunlight comes from behind, passes under the lens at the brief's u 0.757 and runs out
// ahead at one steady rate, three times the lens's speed, to the koppie's foot and up its skirt (see FRONT); the lid's lit rim
// stands in the sky above it (rare: a blue cloud-shadow island crosses the line of flight after the opening).
// pace(u): 0.9 past the Sentinel, 1.3 through the middle of day 2 (0.2-0.29), 0.74 over the light line, the bloom and the bull
// (0.735-0.86), 1 from 0.9.
// What is drawn: every rock and tree stands from the start and is left out once it lies 30 m or more behind the lens along the
// route (see PG); the bossies likewise, and they come in 260 m ahead. Each group of things shapes itself from a stream of its own
// (see stream).
import * as THREE from 'three';
import { makePath } from '../kit/core.js';
import * as F from '../kit/fauna.js';
import * as fx from '../kit/fx.js';
import { buildHero } from '../parts/the-desert-opens.js';

const PALETTE = ['#9C4A2E', '#F28A1C', '#F4EFE2', '#C2247E', '#D9A441', '#4A3328', '#7E9463'];
const DURATION = 40, RAD = Math.PI / 180;
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const lerp = (a, b, t) => a + (b - a) * t;
// piecewise-linear keys [[u, v], ...]
const keys = (u, K) => { if (u <= K[0][0]) return K[0][1]; for (let i = 1; i < K.length; i++) if (u <= K[i][0]) { const a = K[i - 1], b = K[i]; return lerp(a[1], b[1], (u - a[0]) / Math.max(1e-6, b[0] - a[0])); } return K[K.length - 1][1]; };

// JS twins of the hero's GLSL hash and value noise (the tortoise runs in the wheel rut that the ground shader draws)
const fract = (x) => x - Math.floor(x);
const h21 = (x, y) => { let a = fract(x * 0.1031), b = fract(y * 0.1030), c = fract(x * 0.0973); const d = a * (b + 33.33) + b * (c + 33.33) + c * (a + 33.33); a += d; b += d; c += d; return fract((a + b) * c); };
const h22 = (x, y) => { let a = fract(x * 0.1031), b = fract(y * 0.1030), c = fract(x * 0.0973); const d = a * (b + 33.33) + b * (c + 33.33) + c * (a + 33.33); a += d; b += d; c += d; return [fract((a + b) * c), fract((a + c) * b)]; };
const vnoise = (x, y) => { const ix = Math.floor(x), iy = Math.floor(y); let fx = x - ix, fy = y - iy; fx = fx * fx * (3 - 2 * fx); fy = fy * fy * (3 - 2 * fy);
  return lerp(lerp(h21(ix, iy), h21(ix + 1, iy), fx), lerp(h21(ix, iy + 1), h21(ix + 1, iy + 1), fx), fy); };

// ---- the sun: latitude 30 S, winter declination +18, so it crosses the NORTHERN sky.
// Local frame: -Z is compass 190 (the final heading), +X is west-ish, +Z north-ish.
const NORTH = new THREE.Vector3(Math.sin(10 * RAD), 0, Math.cos(10 * RAD)), WEST = new THREE.Vector3(Math.cos(10 * RAD), 0, -Math.sin(10 * RAD));
const POLE_N = new THREE.Vector3().copy(NORTH).multiplyScalar(Math.cos(30 * RAD)).add(new THREE.Vector3(0, -Math.sin(30 * RAD), 0));
const MERID = new THREE.Vector3().copy(NORTH).multiplyScalar(Math.sin(30 * RAD)).add(new THREE.Vector3(0, Math.cos(30 * RAD), 0));
const DEC = 18 * RAD;
function sunAt(Hdeg, out) {
  const H = Hdeg * RAD, c = Math.cos(DEC), s = Math.sin(DEC);
  return out.set(0, 0, 0).addScaledVector(MERID, c * Math.cos(H)).addScaledVector(WEST, c * Math.sin(H)).addScaledVector(POLE_N, s).normalize();
}
// six sample days [u0, u1, hourAngle0, hourAngle1]; the gaps are the nights (two long, three short blue dips)
// (days 3 to 5 are sampled unevenly: the camera's intervalometer hurries through dawn and dusk and lingers on the open hours, so
// the field is in bloom for four fifths of each of them; see clockSet)
// (the first star night is the shorter of the two long ones: day 2 breaks at u 0.153; in the three short gaps the sun goes only
// five degrees under, a blue dip of twilight without stars: see clockSet)
const DAYS = [[0, 0.125, 64, 83], [0.153, 0.315, -84, 84], [0.365, 0.468, -84, 84], [0.482, 0.575, -84, 84], [0.59, 0.708, -84, 84], [0.728, 1.0001, -42, -24]];

const SKY_VERT = /* glsl */`
varying vec3 vDir;
void main(){ vDir = position; vec4 mv = modelViewMatrix * vec4(position, 1.); gl_Position = projectionMatrix * mv; gl_Position.z = gl_Position.w * .99999; }`;
// hero GLSL (hashes, noise, sunLine, sunEdge and their uniforms) is prepended to this
const SKY_FRAG = /* glsl */`
varying vec3 vDir;
uniform vec3 uFogC, uSunE, uLidCol, uPole, uE1, uE2, uVeilCol, uMtn;
uniform vec4 uLid, uVeil;
uniform float uStarRot, uTrail, uLidLead, uMtA;
uniform vec3 uMwN;
void main(){
  vec3 d = normalize(vDir + vec3(0., 1e-6, 0.));
  float el = d.y, elc = max(el, 0.);
  vec3 col = mix(uHor, uZen, pow(elc + 1e-4, .42));
  float sd = max(dot(d, uSunD), 0.); float s2 = sd * sd, s4 = s2 * s2, s8 = s4 * s4, s32 = s8 * s8 * s8 * s8, s128 = s32 * s32 * s32 * s32;
  vec2 dxz = d.xz / max(length(d.xz), 1e-4), sxz = uSunD.xz / max(length(uSunD.xz), 1e-4);
  float azf = .5 + .5 * dot(dxz, sxz);
  col += uGlow * (s2 * .1 + s8 * .22 + s128 * .7);
  col += uGlow * exp(-abs(el) * 8.) * azf * azf * .62;
  // the anti-twilight arch: opposite a sun on the horizon a rose band stands over the blue shadow of the earth (every dawn of the
  // flight is seen this way round: the sun comes up behind the lens)
  float anti = .5 - .5 * dot(dxz, sxz); anti *= anti;
  float bb = (el - .11) / .08; col += uBelt.rgb * uBelt.a * anti * exp(-bb * bb);
  col *= mix(vec3(1.), vec3(.6, .7, .96), uBelt.a * anti * (1. - smoothstep(.0, .075, elc)) * .55);
  float az = atan(d.z, d.x + 1e-6);
  // stars wheel about the south celestial pole; short trails along their circles; the Milky Way turns with them
  if (uNight > .01) {
    vec3 ds = vec3(dot(d, uE1), dot(d, uPole), dot(d, uE2));
    float lat = asin(clamp(ds.y, -1., 1.)); float lon = atan(ds.z, ds.x + 1e-6) + uStarRot;
    float K = 64.; float row = floor(lat * K); float nl = max(1., floor(6.2832 * K * cos((row + .5) / K)));
    float lx = fract(lon / 6.2832) * nl; float ci = floor(lx);
    vec2 hh = h22(vec2(ci, row) + 13.); float pr = step(.76, h21(vec2(ci, row) + 3.3));
    vec2 dd = vec2(lx - ci, lat * K - row) - (.22 + .56 * hh); dd.x = max(abs(dd.x) - uTrail, 0.);
    float mag = h21(vec2(ci, row) + 9.1); mag *= mag; mag = .12 + 3.4 * mag * mag * mag;
    vec3 sc = mix(vec3(.75, .85, 1.), vec3(1., .86, .7), step(.7, hh.x));
    // the Milky Way: a band of light along one great circle of the turning sky, clotted with star clouds, split by a dark lane
    // and thick with faint stars
    vec3 dr = vec3(cos(lon) * cos(lat), sin(lat), sin(lon) * cos(lat));
    float mb = dot(dr, uMwN); vec2 mq = vec2(lon * 2.6, lat * 4.);
    float mc = fbm(mq + 3.), mw = exp(-mb * mb * 16.) * (.25 + 1.5 * mc * mc) + exp(-mb * mb * 90.) * .5;
    mw *= 1. - .75 * exp(-(mb - .03) * (mb - .03) * 420.) * smoothstep(.3, .6, fbm(mq * 2.3 + 11.));
    // (the faint stars: each a point at its own place in its cell and of its own brightness, most of them dim, so no lattice shows)
    vec2 fq = vec2(lx, lat * K) * 3.3; vec2 fi = floor(fq); vec2 fj = h22(fi + 5.); float fm = h21(fi + 21.7);
    float fs = step(.9 - .34 * min(mw, 1.), fm) * (1. - smoothstep(.03, .17, length(fract(fq) - .2 - .6 * fj))) * (.16 + 1.5 * fj.x * fj.x * fj.y);
    col += (sc * exp(-dot(dd, dd) * 95.) * mag * pr * 1.7 + vec3(.4, .47, .74) * mw * .4 + vec3(.7, .78, 1.) * fs * (.3 + .8 * min(mw, 1.)) * .75) * uNight * smoothstep(.0, .1, el);
  }
  // cumulus streets streaming in on the north-west wind
  vec2 cp = d.xz / (elc + .06);
  vec2 cc = vec2(dot(cp, uWind.xy) * .42, dot(cp, vec2(-uWind.y, uWind.x)) * 1.7) + uCloudP.xy;
  float n = fbm(cc) + (vn(cc * 3.3 + 7.) - .5) * .14 + (vn(cc * .23 + 2.) - .5) * .3;
  vec2 so = vec2(dot(sxz, uWind.xy) * .42, dot(sxz, vec2(-uWind.y, uWind.x)) * 1.7) * .22;
  float n2 = fbm(cc + so);
  float cov = smoothstep(uCloudP.z, uCloudP.z + .16, n) * smoothstep(.01, .1, el) * (1. - smoothstep(7., 14., length(cp))) * uCloudP.w * (1. - .9 * uNight);
  float clit = clamp((n - n2) * 3.5 + .55, 0., 1.) * (1. - smoothstep(uCloudP.z + .1, uCloudP.z + .42, n) * .6);
  vec3 ccol = mix(uCloudSh, uCloudCol, clit) + uGlow * (s8 * .35 + azf * azf * exp(-el * 5.) * .3);
  col = mix(col, ccol, cov);
  // rain veils dragging away ahead, lit by the low sun
  if (uVeil.z > .003) {
    float c = vn(vec2(az * 6.5 + 2., 1.7 + uTime * .02));
    float curtain = smoothstep(.36, .66, c) * smoothstep(.1, .7, dot(dxz, uVeil.xy));
    float fine = vn(vec2(az * 95. + el * 30., el * 7. + uTime * 1.3 + c * 3.));
    float veil = curtain * (1. - smoothstep(.03, .26 + .14 * c, el)) * (.55 + .45 * fine);
    col = mix(col, uVeilCol * (.75 + .5 * fine), veil * uVeil.z);
  }
  // the fog lid (or cloud bank): a low ceiling whose ragged near edge is the same line that opens the flowers. It has form: soft
  // rolls lying across the wind, dark in their bellies and paler between; for a hundred metres in from its edge it is thin, torn
  // into rags and lit through by the sun; and it is a bank, not the whole sky: far out it ends, and under its far edge a band
  // of the open sky of the coming day stands along the horizon (uBand), lighting the bellies of the last rolls from below
  float lid = 0., bandK = 0.;
  if (uLid.x > .003) {
    float t = max(uLid.y - uCam.y, 6.) / max(el, .014);
    vec2 hit = uCam.xz + d.xz * t;
    float distf = 1. - exp(-t * uLid.w);
    // > 0 where the lid has already peeled away; its edge runs uLidLead metres ahead of the line on the ground, so the
    // edge hangs high ahead while the line lies across the flowers before the lens
    float dl = uFront + uLidLead - dot(hit, uTideDir) + tideRag(hit) * 1.3 + (vn(hit * .09 + 3.) - .5) * 9.;
    float tex = fbm(hit * .016 + uCloudP.xy * .2) * .6 + fbm(hit * .0045 + 7.) * .4;
    float roll = fbm(vec2(dot(hit, uWind.xy) * .0125, dot(hit, vec2(-uWind.y, uWind.x)) * .0031) + uCloudP.xy * .15);
    float form = smoothstep(.3, .7, roll * .78 + tex * .22);
    // (the rags: toward the edge the lid is open wherever it is thin)
    float dlr = dl + exp(min(dl, 0.) / 75.) * max(tex * .7 + roll * .3 - .4, 0.) * 210.;
    // (the far edge of the bank, a few degrees over the horizon, uneven)
    float farE = smoothstep(.03, .1, el + (vn(vec2(az * 6. + 3., 1.3)) - .5) * .05 + (vn(vec2(az * 23., 7.1)) - .5) * .016);
    bandK = uLid.x * (1. - smoothstep(.0, .13, elc)) * (1. - smoothstep(-5., 5., dl)) * step(0., el);
    col = mix(col, uBand.rgb * (1.02 - .5 * elc), bandK);
    lid = (1. - smoothstep(-5., 5., dlr)) * farE * uLid.x * step(0., el);
    // (the sun burns through the last of it)
    float thin = exp(min(dlr, 0.) / 60.);
    vec3 lc = uLidCol * (.2 + .52 * form + .36 * tex * (1. - distf * .6))
      + uBand.rgb * (1. - smoothstep(.03, .15, el)) * (.03 + .13 * form)
      + uSunCol * vec3(1., .8, .62) * thin * thin * uLid.z * (.02 + .1 * tex) * (1. - distf * .5)
      + uSunCol * vec3(1., .7, .45) * exp(min(dlr, 0.) / 26.) * uLid.z * .05;
    col = mix(col, mix(lc, uFogC, distf * .22), lid);
    // the lit edge: a cream rim, bright enough to bloom, soft into the lid and crisp against the blue (the rags' own rims are fainter)
    float rim = exp(-max(-dl, 0.) / 13. - max(dl, 0.) / 3.5) * (.5 + 1. * tex) * .55 + exp(-max(-dlr, 0.) / 7. - max(dlr, 0.) / 3.) * (.3 + .6 * tex) * .2;
    col += uSunCol * rim * (1. - distf * .8) * uLid.z * uLid.x * farE * step(0., el);
  }
  // the sun
  col += uSunE * smoothstep(.99982, .99993, dot(d, uSunD)) * (1. - cov * .92) * (1. - lid) * (1. - .7 * bandK) * step(0., el);
  // the Kamiesberg, 15 km off: a flat blue band two degrees high along the horizon, a paler band behind it; its top is level (it
  // wavers by a tenth of a degree, no summits) and soft with 15 km of air; haze pales its foot, the low sun warms the flank
  // turned to it. (The noise is taken on the unit circle: no seam.)
  float r1 = .037 + .003 * vn(dxz * 4.3 + 4.);
  float r2 = .031 + .003 * vn(dxz * 9. + 5.) + .0015 * vn(dxz * 29. + 1.);
  vec3 mcol = uMtn + uGlow * azf * azf * .1;
  col = mix(col, mix(uFogC, mcol, .4), (1. - smoothstep(r1 - .005, r1 + .005, el)) * uMtA);
  col = mix(col, mix(uFogC, mcol * (.8 + .3 * vn(dxz * 40. + el * 90.)), .5 + .38 * smoothstep(0., r2 + 1e-4, el)), (1. - smoothstep(r2 - .005, r2 + .005, el)) * uMtA);
  col = mix(col, uFogC, 1. - smoothstep(-.012, .002, el));
  col = mix(col, uFogC * vec3(.5, .3, .26), 1. - smoothstep(-.1, -.03, el));
  gl_FragColor = vec4(col, 1.);
}`;

// ---- the gemsbok (Oryx gazella), built here (the kit antelope is a box on sticks at this range): lofted torso, neck, wedge head,
// two long straight horns, ears, four jointed legs and a tufted tail, about 700 triangles with smooth normals. The markings (fawn-grey
// coat, white belly, black flank band, dorsal stripe and throat stripe, white face with the black mask, black legs with white socks) are
// painted in the fragment shader from each part's own coordinates. Model space: +Z forward, +Y up, 1.2 m at the shoulder, 2.1 to 2.2 m
// to the horn tips. aP = (part, along, around, 0); aPiv = the joint a part turns about (hip, poll or tail root) and, for a leg, its
// place in the stride.
function gemsbokGeometry() {
  const pos = [], aP = [], piv = [], idx = [];
  // rings [y, z, half-width, half-depth, x]; the section stands at right angles to the run of the tube in the yz plane
  const loft = (rings, sides, pt, pv) => {
    const b = pos.length / 3, n = rings.length;
    for (let i = 0; i < n; i++) {
      const p = rings[Math.max(0, i - 1)], q = rings[Math.min(n - 1, i + 1)], r = rings[i];
      let ty = q[0] - p[0], tz = q[1] - p[1]; const tl = Math.hypot(ty, tz) || 1; ty /= tl; tz /= tl;
      for (let j = 0; j < sides; j++) {
        const a = (j / sides) * 6.2832, ca = Math.cos(a), sa = Math.sin(a);
        pos.push((r[4] || 0) + sa * r[2], r[0] + ca * r[3] * tz, r[1] - ca * r[3] * ty);
        aP.push(pt, i / (n - 1), 0.5 - 0.5 * ca, 0); piv.push(pv[0], pv[1], pv[2], pv[3]);
      }
    }
    for (let i = 0; i < n - 1; i++) for (let j = 0; j < sides; j++) { const a0 = b + i * sides + j, a1 = b + i * sides + (j + 1) % sides; idx.push(a0, a0 + sides, a1, a1, a0 + sides, a1 + sides); }
  };
  const NPV = [0, 1.1, 0.47, 0], HPV = [0, 1.5, 0.79, 0];
  loft([[1.02, -0.8, 0.02, 0.03], [1.02, -0.74, 0.15, 0.18], [1.0, -0.6, 0.215, 0.25], [0.98, -0.38, 0.235, 0.275], [0.955, -0.1, 0.225, 0.27], [0.95, 0.2, 0.235, 0.29],
    [0.985, 0.42, 0.215, 0.285], [1.03, 0.57, 0.15, 0.22], [1.07, 0.67, 0.05, 0.08]], 12, 0, [0, 0, 0, 0]);
  loft([[1.0, 0.42, 0.16, 0.2], [1.17, 0.55, 0.125, 0.165], [1.33, 0.67, 0.1, 0.13], [1.5, 0.79, 0.085, 0.11]], 10, 1, NPV);
  loft([[1.6, 0.7, 0.02, 0.03], [1.575, 0.76, 0.08, 0.09], [1.54, 0.84, 0.085, 0.1], [1.47, 0.95, 0.07, 0.085], [1.4, 1.06, 0.05, 0.06], [1.365, 1.13, 0.045, 0.05], [1.35, 1.16, 0.015, 0.02]], 8, 2, HPV);
  for (const sx of [-1, 1]) {
    loft([[1.6, 0.775, 0.025, 0.025, sx * 0.05], [1.83, 0.6, 0.02, 0.02, sx * 0.085], [2.06, 0.425, 0.013, 0.013, sx * 0.125], [2.2, 0.32, 0.003, 0.003, sx * 0.15]], 5, 3, HPV);
    // an ear: a leaf of two triangles
    const b = pos.length / 3;
    for (const q of [[sx * 0.07, 1.585, 0.735, 0], [sx * 0.12, 1.575, 0.7, 0.4], [sx * 0.13, 1.66, 0.74, 0.4], [sx * 0.215, 1.675, 0.69, 1]]) { pos.push(q[0], q[1], q[2]); aP.push(4, q[3], 0.5, 0); piv.push(HPV[0], HPV[1], HPV[2], 0); }
    idx.push(b, b + 1, b + 2, b + 1, b + 3, b + 2);
  }
  // legs: left hind 0, left fore 0.25, right hind 0.5, right fore 0.75 of the stride (a walk)
  for (const sx of [-1, 1]) {
    const xf = sx * 0.125, xh = sx * 0.13;
    loft([[0.98, 0.42, 0.07, 0.1, xf], [0.74, 0.41, 0.062, 0.075, xf], [0.53, 0.4, 0.04, 0.045, xf], [0.3, 0.395, 0.028, 0.032, xf], [0.09, 0.4, 0.034, 0.038, xf], [0, 0.42, 0.04, 0.05, xf]], 6, 5, [xf, 0.95, 0.41, sx < 0 ? 0.25 : 0.75]);
    loft([[1.0, -0.52, 0.1, 0.17, xh], [0.76, -0.5, 0.075, 0.12, xh], [0.54, -0.6, 0.042, 0.052, xh], [0.3, -0.585, 0.028, 0.034, xh], [0.09, -0.57, 0.034, 0.038, xh], [0, -0.55, 0.04, 0.05, xh]], 6, 5, [xh, 0.97, -0.52, sx < 0 ? 0 : 0.5]);
  }
  loft([[1.08, -0.78, 0.022, 0.022], [0.9, -0.85, 0.018, 0.018], [0.68, -0.86, 0.02, 0.02], [0.52, -0.86, 0.045, 0.045], [0.36, -0.855, 0.012, 0.012]], 5, 6, [0, 1.08, -0.78, 0]);
  return { pos, aP, piv, idx };
}
const GEMS_VERT = /* glsl */`
attribute vec4 aP, aPiv, iPos, iPose; attribute vec2 iRnd;
varying vec3 vP, vN, vL; varying vec3 vK;
vec3 rx(vec3 v, float a){ float c = cos(a), s = sin(a); return vec3(v.x, v.y * c - v.z * s, v.y * s + v.z * c); }
vec3 ry(vec3 v, float a){ float c = cos(a), s = sin(a); return vec3(v.x * c + v.z * s, v.y, -v.x * s + v.z * c); }
void main(){
  vec3 q = position, n = normal; float part = aP.x, h = iRnd.x;
  if (part > 4.5 && part < 5.5) {
    // a leg: the cannon folds at the knee as the leg comes forward, the whole leg swings about the hip
    float ph = (iPose.y + aPiv.w) * 6.2832, sw = sin(ph) * .4 * iPose.z, fold = max(cos(ph), 0.) * .55 * iPose.z * (1. - smoothstep(.45, .58, position.y));
    vec3 kp = vec3(aPiv.x, .53, aPiv.z - .02);
    q = rx(q - kp, fold) + kp; n = rx(n, fold);
    q = rx(q - aPiv.xyz, -sw) + aPiv.xyz; n = rx(n, -sw);
  } else if (part > .5 && part < 4.5) {
    // neck and head: the neck swings down from its root to graze, the head turns back up a little on the poll; a head held up
    // turns a little to one side
    float g = iPose.x, w = part < 1.5 ? smoothstep(0., .5, aP.y) : 1.;
    if (part > 1.5) { q = rx(q - aPiv.xyz, -g * .8) + aPiv.xyz; n = rx(n, -g * .8); }
    vec3 np = vec3(0., 1.1, .47); float yw = iRnd.y * (1. - g) * w;
    q = rx(q - np, g * 1.72 * w) + np; n = rx(n, g * 1.72 * w);
    q = ry(q - np, yw) + np; n = ry(n, yw);
  } else if (part > 5.5) {
    float tl = 1. - aP.y, sw = sin(uTime * 5.3 + h * 40.) * .4 * aP.y * aP.y;
    q.x += sw * (aPiv.y - position.y); q.y += abs(sw) * .1 * tl;
  }
  // breathing
  if (part < .5) q.x *= 1. + .012 * sin(uTime * 3.1 + h * 20.) * smoothstep(-.5, .1, position.z);
  float s = iPose.w;
  vec3 P = iPos.xyz + ry(q, iPos.w) * s;
  vP = P; vN = ry(n, iPos.w); vL = position; vK = vec3(aP.x, aP.y, aP.z);
  vec4 mvPosition = modelViewMatrix * vec4(P, 1.);
  gl_Position = projectionMatrix * mvPosition;
#include <fog_vertex>
}`;
const GEMS_FRAG = /* glsl */`
varying vec3 vP, vN, vL; varying vec3 vK;
void main(){
  vec3 N = normalize(vN + vec3(0., 1e-4, 0.)); vec3 V = normalize(uCam - vP + vec3(0., 1e-4, 0.));
  if (vK.x > 3.5 && vK.x < 4.5 && dot(N, V) < 0.) N = -N;
  float part = vK.x, t = vK.y, v = vK.z;
  float hair = .9 + .2 * (vn(vL.zy * 31. + vL.x * 17.) * .6 + vn(vL.zy * 9. + 3.) * .4);
  vec3 fawn = vec3(.4, .345, .285) * hair, white = vec3(.68, .66, .6), black = vec3(.022, .019, .017);
  vec3 alb = fawn; float ao = 1.;
  if (part < .5) {
    alb = mix(fawn, fawn * 1.16, smoothstep(.25, .5, v) * (1. - smoothstep(.5, .58, v)));
    alb = mix(alb, white, smoothstep(.73, .79, v));
    alb = mix(alb, black, smoothstep(.57, .615, v) * (1. - smoothstep(.71, .755, v)) * smoothstep(.1, .22, t) * (1. - smoothstep(.8, .9, t)));
    alb = mix(alb, black, (1. - smoothstep(.02, .07, v)) * smoothstep(.05, .3, t) * (1. - smoothstep(.7, .9, t)) * .75);
    alb = mix(alb, black, (1. - smoothstep(.05, .13, t)) * (1. - smoothstep(.3, .5, v)));
    ao = mix(.5, 1., smoothstep(-.9, -.1, N.y));
  } else if (part < 1.5) {
    alb = mix(fawn, black, smoothstep(.8, .9, v) * smoothstep(.0, .25, t));
  } else if (part < 2.5) {
    alb = mix(white, fawn, (1. - smoothstep(.16, .3, t)) * (1. - smoothstep(.45, .7, v)));
    float nose = (1. - smoothstep(.2, .3, v)) * smoothstep(.34, .44, t) * (1. - smoothstep(.74, .84, t));
    float eye = (1. - smoothstep(.09, .15, abs(v - mix(.4, .86, smoothstep(.24, .62, t))))) * smoothstep(.1, .2, t) * (1. - smoothstep(.62, .72, t));
    alb = mix(alb, black, max(max(nose, eye), smoothstep(.9, .96, t) * .8));
  } else if (part < 3.5) {
    alb = vec3(.035, .032, .03) * (.75 + .5 * sin(t * 60.) * (1. - t));
  } else if (part < 4.5) {
    alb = mix(fawn, black, smoothstep(.7, .9, t));
  } else if (part < 5.5) {
    alb = mix(white, black, smoothstep(.16, .23, vL.y));
    alb = mix(alb, fawn, smoothstep(.74, .88, vL.y));
    alb = mix(alb, black, 1. - smoothstep(.035, .05, vL.y));
    ao = mix(.7, 1., smoothstep(.3, .9, abs(vL.x) * 6.));
  } else alb = black * 1.3;
  float lit = sunLine(vP.xz) * domeShadow(vP);
  vec3 col = shadeS(alb * ao, N, vP, .3, 1., 0.);
  float f1 = 1. - clamp(dot(N, V), 0., 1.), fr = f1 * f1 * f1;
  // the sun's rim on the back, the neck and the horns (strongest seen against the light), the sky's sheen on the coat, and the
  // warm light the sunlit flowers throw up under the belly
  col += uSunCol * (alb * .7 + .04) * fr * smoothstep(-.35, .35, dot(N, uSunDir)) * (.3 + .7 * smoothstep(-.3, .7, dot(-V, uSunDir))) * lit * .55;
  col += uSkyCol * (alb * .5 + .02) * fr * .2;
  col += alb * uSunCol * vec3(.4, .27, .12) * max(uSunDir.y, 0.) * (.5 - .5 * N.y) * .22 * sunLine(vP.xz);
  // (by starlight the pale coat is held under the stars, so the animal is a shape with a rim and never a white glow)
  col *= 1. - .38 * uNite;
  gl_FragColor = vec4(col, 1.);
#include <fog_fragment>
}`;

export default {
  id: 'the-desert-opens',
  name: 'The Desert Opens',
  category: 'wilderness',
  weirdness: 0.1,
  media: ['open', 'air'],
  async build(ctx) {
    const rng = ctx.rng, vary = ctx.vary || {}, detail = ctx.quality?.detail ?? 1;
    const density = clamp(vary.density ?? 1, 0.7, 1.3);
    const scene = new THREE.Scene();
    // Every family of things (the plain, the koppies, the sky, the scatter, the stacks, the clusters, the massifs, the standing
    // gemsbok ...) takes a stream of its own, made from the world's seed and the family's name: what one family holds changes
    // nothing in another. A thing that is not there is in no list and takes no draw beyond the draw of the place it was offered.
    const stream = (name) => ctx.core.makeRng(ctx.core.hashSeed(name + ':' + ctx.seed));

    // ---------- what this visit is ----------
    const vr = rng.fork('visit');
    // the last day: fog burn-off (default, also for dawn), a clearing golden afternoon, or a hot berg-wind day
    const hour = vary.hour || 'any';
    const LAST = hour === 'golden' ? 'golden' : hour === 'dawn' ? 'fog' : hour === 'day' ? vr.pick(['fog', 'berg']) : vr.pick(['fog', 'fog', 'golden', 'berg']);
    const SEASON = vr.pick(['orange', 'orange', 'white', 'thin', 'flax']);
    // (gemsbok every year; the brief's ostriches are a cock and two hens)
    const HENS = 2, RARE = !!vary.rare;
    const days = DAYS.map((d) => d.slice());
    // (the fog morning keeps the brief's sun: hour angle -42 to -24, 30 rising to 38 degrees up over the left shoulder)
    if (LAST === 'golden') { days[5][2] = 40; days[5][3] = 52; }
    if (LAST === 'berg') { days[5][2] = -34; days[5][3] = -12; }

    // ---------- the plain: one analytic height shared by JS, the hero ground and the treadmill flowers ----------
    const PL = (() => { const q = stream('the plain'); return [q.range(0, 6.28), q.range(0, 6.28), q.range(0, 6.28), q.range(0, 6.28)]; })();
    const kops = [];      // ring koppies { x, z, r, h } filled in below; their mounds have compact support
    const plainBase = (x, z) => {
      const k = sstep(150, 420, Math.hypot(x, z));
      return k * (1.25 * Math.sin(x * 0.0105 + PL[0]) * Math.cos(z * 0.0087 + PL[1]) + 0.8 * Math.sin(x * 0.021 + z * 0.016 + PL[2]) + 0.45 * Math.sin(z * 0.037 - x * 0.012 + PL[3]));
    };
    const plainFn = (x, z) => {
      let h = plainBase(x, z);
      for (const k of kops) { const d = Math.hypot(x - k.x, z - k.z); if (d < k.r) h += k.h * (1 - sstep(0, k.r, d)); }
      return h + featH(x, z);
    };

    // ---------- the path: 110 m straight, one left-hand arc of 760 m radius through 60 degrees, then the hero's fly line ----------
    const R = 760, Z0 = 180, A0 = Math.PI / 3;
    const arcP = (th) => [-R + R * Math.cos(th), Z0 + R * Math.sin(th)];
    const xz = [];
    { const [ax, az] = arcP(A0), hx = Math.sin(A0), hz = -Math.cos(A0); for (const s of [110, 74, 37]) xz.push([ax - hx * s, az - hz * s]); }
    for (let i = 0; i <= 80; i++) xz.push(arcP(A0 * (1 - i / 80)));
    // koppie positions are chosen against this plan line before the hero is built (its heightAt needs them)
    const planAt = (s) => { const L = 110 + R * A0; s = clamp(s, 0, L + 170); if (s < 110) { const [ax, az] = arcP(A0); return [ax - Math.sin(A0) * (110 - s), az + Math.cos(A0) * (110 - s), Math.sin(A0), -Math.cos(A0)]; }
      if (s > L) return [0, Z0 - (s - L), 0, -1]; const th = A0 * (1 - (s - 110) / (R * A0)), p = arcP(th); return [p[0], p[1], Math.sin(th), -Math.cos(th)]; };
    // [distance along the plan, side, distance off the path, size (0 = seeded)]. The second stands left of the path through day-1 dusk
    // and night 1; the third stands right of it, between the lens and the setting sun of day 2.
    const KOP = [[110, 1, 200, 0], [345, -1, 62, 0.86], [470, 1, 95, 0.88], [640, 1, 400, 0], [730, -1, 380, 0], [900, 1, 430, 0]];
    const kr = stream('the ring koppies');
    for (const [s, side, dist, big] of KOP) {
      const j = kr.range(-25, 25), k1 = kr.range(0.88, 1.15), k2 = kr.range(100, 120), k3 = kr.range(8, 13), k4 = kr.range(0.8, 1.25);
      const [px, pz, tx, tz] = planAt(s + (big ? j * 0.2 : j)), d = dist * (big ? 0.98 + (k1 - 0.88) * 0.3 : k1);
      kops.push({ x: px - tz * side * d, z: pz + tx * side * d, r: big ? k2 * 0.56 : k2, h: big ? k3 * 0.45 : k3, big: big ? big * (0.97 + (k4 - 0.8) * 0.15) : k4, near: !!big, far: dist > 300 });
    }

    // ---------- what lies along the plan line (JS twins of planAL, wash2D and featH in the hero's GLSL) ----------
    // a ridge the line climbs by its left shoulder (crest 562 m along the plan, 8 m high, its far slope as long as its near one:
    // its far foot lies 614 m along); a second dry wash that swings in from the left, lies under the line from 650 to 700 m and
    // swings away to the right (a swale a metre deep with a sandy bed and pools), running out against the valley floor between
    // 752 and 790 m (W2G: where the swale comes in and where it runs out); a heuweltjie 8 m left of the line, 385 m along it
    const RISE = [562, 52, 8], W2 = [650, 700, 70, 60], MOUND = { x: 0, z: 9000, r: 9, h: 0 };
    const W2G = [566, 600, 752, 790];
    // THE DAMP HOLLOW: a long shallow hollow of the flats beyond the ridge, on the left of the line, where the flood of the second
    // wash stood longest. It begins at the foot of the ridge's far slope (RISE: 614 m along the plan) and ends where the wash's
    // swale runs out (the middle of W2G's last stretch: 771 m); its middle line lies between the two lanes the brief gives the
    // ostriches (13 m left of the line and 2.5 m beyond), and it is 20 m from that line to its ragged rim: half a metre deep in the
    // middle, white with rain daisies from rim to rim (the brief's 'damp hollows'). HOL: [begins, ends, lateral of the middle, half-width]
    const O_LANE = 13, HEN_OFF = 2.5;
    const HOL = [RISE[0] + RISE[1], (W2G[2] + W2G[3]) / 2, -(O_LANE + HEN_OFF / 2), 20], HOL_DEEP = 0.5;
    const holD = (a, l) => Math.hypot(Math.max(HOL[0] - a, a - HOL[1], 0), l - HOL[2]);
    const planAL = (x, z) => { const qx = x + R, qz = z - Z0; return [110 + R * (A0 - Math.atan2(qz, qx + 1e-4)), Math.hypot(qx, qz) - R]; };
    const wash2D = (a, l) => { const b = Math.max(W2[0] - a, 0), c = Math.max(a - W2[1], 0); return l - (c * c / W2[3] - b * b / W2[2]); };
    // low swells in the last third of the plain (JS twin of swellH in the hero's GLSL): two rollers lying across the line, their
    // crests 792 and 858 m along the plan, 30 and 38 m long from foot to crest, and a pair of knolls either side of the line 970 m
    // along (the valley floor's far bank, where the climb to the portal begins)
    const SW = [[792, 30, 1.5, 0], [858, 38, 1.4, 0], [970, 24, 1.3, 1]];
    const swellH = (a, l) => {
      const ly = Math.abs(l); let h = 0;
      for (let i = 0; i < 3; i++) {
        const q = SW[i], aa = a + 0.28 * l + 5 * Math.sin(l * 0.055 + i * 2.1), t = clamp(Math.abs(aa - q[0]) / Math.max(q[1], 1), 0, 1);
        const lat = lerp(1 - 0.4 * sstep(50, 130, ly), 0.22 + 0.78 * sstep(3, 11, ly) * (1 - sstep(20, 38, ly)), q[3]);
        h += q[2] * (0.5 + 0.5 * Math.cos(Math.PI * t)) * lat;
      }
      return h * (1 - sstep(120, 260, ly));
    };
    const featH = (x, z) => {
      const al = planAL(x, z), a = al[0], l = al[1]; let h = swellH(a, l);
      const e = Math.hypot(x, z); if (e < 305) return h;
      const t = Math.abs(a - RISE[0]) / RISE[1];
      if (t < 1) h += RISE[2] * (1 - sstep(0, 1, t)) * (1 - sstep(10, 48, -l)) * (1 - sstep(70, 150, l));
      h -= HOL_DEEP * (1 - sstep(HOL[3] * 0.3, HOL[3], holD(a, l))) * sstep(310, 345, e);
      const g = sstep(W2G[0], W2G[1], a) * (1 - sstep(W2G[2], W2G[3], a)) * sstep(310, 345, e);
      if (g > 0) h -= 1.05 * (1 - sstep(3.2, 8.5, Math.abs(wash2D(a, l)))) * g;
      const dm = Math.hypot(x - MOUND.x, z - MOUND.z); if (dm < MOUND.r) h += MOUND.h * (1 - sstep(0, 1, dm / MOUND.r));
      return h;
    };
    { const [px, pz, tx, tz] = planAt(385); MOUND.x = px + tz * 8; MOUND.z = pz - tx * 8; MOUND.h = 1.8; }
    // under the fine ground ribbon that carries these (350 to 760 m along the plan, 40 m either side) the coarse rings of the plain
    // are sunk out of sight
    const dipAt = (x, z) => { const e = Math.hypot(x, z); if (e < 305) return 0; const al = planAL(x, z); return 2.2 * sstep(350, 362, al[0]) * (1 - sstep(778, 790, al[0])) * (1 - sstep(30, 40, Math.abs(al[1]))) * sstep(310, 330, e); };

    // ---------- hero: Kokerboom Koppie and the tide ----------
    const hero = await buildHero(ctx, { palette: PALETTE, season: SEASON, density: clamp(density * (SEASON === 'thin' ? 0.9 : 1.05), 0.5, 1.5), apron: 300, field: 1e5, plain: plainFn, progress: 0, fill: 1.5 });
    scene.add(hero.object);
    const U = hero.uniforms, A = hero.anchors, hAt = hero.heightAt, TD = A.tideDir, HT = hero.tiers;
    // the rain pan lies 196 m along the plan, 9 m left of the line (23 m long): a mirror at the first sun of day 2, cracked clay by noon
    const PAN = [196, -9];
    U.uPlan.value.set(A0, 110, 0, 0); U.uRise.value.set(RISE[0], RISE[1], RISE[2], 0); U.uW2.value.set(W2[0], W2[1], W2[2], W2[3]);
    U.uMound.value.set(MOUND.x, MOUND.z, MOUND.r, MOUND.h); U.uPan.value.set(PAN[0], PAN[1], 1, 1); U.uArc.value.set(-R, Z0, R, 1);
    SW.forEach((q, i) => U.uSw.value[i].set(q[0], q[1], q[2], q[3])); U.uBias.value = 0.75;
    U.uHol.value.set(HOL[0], HOL[1], HOL[2], HOL[3]); U.uHolK.value.set(HOL_DEEP, 1);
    await ctx.yield();

    // height of the lens over the ground against the distance still to fly: 8.6 m in (the previous portal is 7 m in radius), about
    // 8 m past the Sentinel, 2.6 m over the green haze of day 2, then down among the flowers: 1.6 m (lens daisies stand to 0.75 m)
    // from day 3 until the fog day; it cranes to 6 m to watch the light line run out ahead (u 0.75-0.80) and comes down to 2.8 m
    // where the hero's own low pass begins
    // (the crane over the light line is 3.6 m, so the daisies under the lens stay whole flowers; 2 m over the bed of
    // the second wash; 1.7 m through night 2, under the gemsbok on their heuweltjie)
    const ALT = [[185, 2.8], [210, 3.0], [228, 3.1], [245, 3.0], [262, 2.7], [280, 2.2], [300, 1.7], [330, 1.6], [385, 1.6], [400, 2.0], [436, 2.0], [450, 1.6], [640, 1.6], [700, 1.7], [735, 1.7], [790, 2.4], [900, 2.7], [925, 3.3], [950, 4.8], [981, 7.4], [1018, 8.1], [1055, 8.4], [1091, 8.6]];
    const pts = [];
    {
      let run = 0;
      for (let i = 0; i < xz.length; i++) {
        if (i) run += Math.hypot(xz[i][0] - xz[i - 1][0], xz[i][1] - xz[i - 1][1]);
        const remain = 110 + R * A0 - run + 185, alt = keys(remain, ALT);
        // the lens keeps its height over the highest ground within a few metres, so rolls never rise into it
        let g = -1e9; for (const o of [-6, -3, 0, 3, 6]) { const j = clamp(i + Math.sign(o), 0, xz.length - 1); const q = Math.min(1, Math.abs(o) / Math.max(1, Math.hypot(xz[j][0] - xz[i][0], xz[j][1] - xz[i][1]))), fx_ = lerp(xz[i][0], xz[j][0], q), fz_ = lerp(xz[i][1], xz[j][1], q); g = Math.max(g, hAt(fx_, fz_)); }
        pts.push(new THREE.Vector3(xz[i][0], g + alt, xz[i][1]));
      }
      for (const p of A.flyThrough) if (p.z < 160) pts.push(p.clone());
    }
    await ctx.yield();
    const path = makePath(pts);
    await ctx.yield();
    const PL_LEN = path.length;
    const camDotAt = (u) => { const p = path.pointAt(u); return p.x * TD.x + p.z * TD.z; };
    // the light line on the last day, one law for every look (FRONT, metres along tideDir): it comes up from behind, passes under the
    // lens at the brief's u 0.757 and runs on at one steady rate, three times the lens's own speed along tideDir there (the brief's
    // 40 m/s relative to a lens at 20), to the koppie's foot, up its skirt, over the saddle and on across the valley beyond: that
    // one law from the moment it passes under the lens to the end of the flight
    const U_PASS = 0.757;
    const F_PASS = camDotAt(U_PASS), F_RATE = (() => { const t = path.tangentAt(U_PASS); return 3 * PL_LEN * Math.max(0.5, t.x * TD.x + t.z * TD.z); })();
    const FRONT = (u) => F_PASS + F_RATE * (u - U_PASS);

    await ctx.yield();
    // the wind of the visit: cloud streets streak in from the north-west (the lee of every stack lies downwind of it)
    const skyS = stream('the sky'), windA = (305 - 10) * RAD + skyS.range(-0.25, 0.25);
    const WIND = new THREE.Vector2(Math.sin(windA), -Math.cos(windA));                // direction the air moves toward (local xz)
    // ---------- lights (the hero and the fauna read these every frame) ----------
    const sun = new THREE.DirectionalLight('#fff1d6', 3); scene.add(sun, sun.target);
    const hemi = new THREE.HemisphereLight('#9fbde6', '#3a2c26', 1); scene.add(hemi);
    const haze = new THREE.FogExp2('#b9cbdc', 0.0005); scene.fog = haze;      // (its colour and density are driven by the clock)

    // ---------- the plain beyond the hero's apron: the same ground shader on rings that continue the hero's polar grid ----------
    {
      const NS = 132, pos = [], nor = [], occ = [], idx = [];
      const ring = (r, n, off) => { const b = pos.length / 3; for (let j = 0; j < n; j++) { const a = ((j + off) / n) * Math.PI * 2, x = Math.sin(a) * r, z = Math.cos(a) * r, y = hAt(x, z) - dipAt(x, z); pos.push(x, y, z);
        const hx = hAt(x + 1.5, z) - hAt(x - 1.5, z), hz = hAt(x, z + 1.5) - hAt(x, z - 1.5), il = 1 / Math.hypot(hx, 3, hz); nor.push(-hx * il, 3 * il, -hz * il); occ.push(1); } return b; };
      let prev = ring(hero.apron, NS, 0), r = hero.apron * (1 + 0.6 * Math.PI * 2 / (NS * 2));
      let cur = ring(r, NS * 2, 0);
      for (let j = 0; j < NS; j++) { const a = prev + j, b = prev + (j + 1) % NS, o0 = cur + 2 * j, o1 = cur + 2 * j + 1, o2 = cur + (2 * j + 2) % (NS * 2); idx.push(a, o1, o0, a, b, o1, b, o2, o1); }
      const n = NS * 2; let k = 0;
      while (r < 3300) {
        r *= 1 + (Math.PI * 2 / n) * (r < 620 ? 1 : r < 1500 ? 2.4 : 5); k++;
        const nx = ring(r, n, (k % 2) * 0.5); prev = cur; cur = nx;
        for (let j = 0; j < n; j++) { const a = prev + j, b = prev + (j + 1) % n, c = cur + j, d = cur + (j + 1) % n; if (k % 2) idx.push(a, c, b, b, c, d); else idx.push(a, d, b, a, c, d); }
        await ctx.yield();
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
      g.setAttribute('aOcc', new THREE.Float32BufferAttribute(occ, 1)); g.setIndex(idx);
      const m = new THREE.Mesh(g, hero.groundMaterial); m.frustumCulled = false; scene.add(m);
    }
    await ctx.yield();
    // ---------- the fine ground ribbon, 350 to 760 m along the plan and 40 m either side of it: the ridge, the heuweltjie and the
    // swale of the second wash need a closer mesh than the rings (2 m along, 1.5 m across near the line); its rim is tucked under
    {
      const LAT = [0, 1.5, 3, 4.5, 6, 7.5, 9, 10.5, 12, 14, 16, 18.5, 21.5, 25, 29, 34, 40], cols = [];
      for (let i = LAT.length - 1; i > 0; i--) cols.push(-LAT[i]);
      for (const l of LAT) cols.push(l);
      const NC = cols.length, AA = 350, AB = 790, NRW = Math.round((AB - AA) / 2), pos = new Float32Array((NRW + 1) * NC * 3), nor = new Float32Array((NRW + 1) * NC * 3), idx = [];
      for (let r = 0; r <= NRW; r++) {
        const a = AA + (AB - AA) * r / NRW, th = A0 - (a - 110) / R, ct = Math.cos(th), st = Math.sin(th);
        for (let c = 0; c < NC; c++) {
          const x = -R + (R + cols[c]) * ct, z = Z0 + (R + cols[c]) * st, rim = r === 0 || r === NRW || c === 0 || c === NC - 1, o = (r * NC + c) * 3;
          pos[o] = x; pos[o + 1] = hAt(x, z) + (rim ? -0.55 : 0.04); pos[o + 2] = z;
          const hx = hAt(x + 0.6, z) - hAt(x - 0.6, z), hz = hAt(x, z + 0.6) - hAt(x, z - 0.6), il = 1 / Math.hypot(hx, 1.2, hz);
          nor[o] = -hx * il; nor[o + 1] = 1.2 * il; nor[o + 2] = -hz * il;
        }
        if ((r & 3) === 3) await ctx.yield();
      }
      for (let r = 0; r < NRW; r++) for (let c = 0; c < NC - 1; c++) { const a = r * NC + c, b = a + 1, d = a + NC, e = d + 1; idx.push(a, d, b, b, d, e); }
      await ctx.yield();
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
      g.setAttribute('aOcc', new THREE.BufferAttribute(new Float32Array((NRW + 1) * NC).fill(1), 1)); g.setIndex(idx);
      const m = new THREE.Mesh(g, hero.groundMaterial); m.frustumCulled = false; scene.add(m);
    }
    await ctx.yield();

    // ---------- sky dome (own shader: the kit sky is static) ----------
    const south = new THREE.Vector3().copy(NORTH).negate();
    const POLE_S = new THREE.Vector3().copy(south).multiplyScalar(Math.cos(30 * RAD)).add(new THREE.Vector3(0, Math.sin(30 * RAD), 0)).normalize();
    const E1 = new THREE.Vector3().crossVectors(POLE_S, WEST).normalize(), E2 = new THREE.Vector3().crossVectors(E1, POLE_S).normalize();
    const SU = {
      ...U,
      uFogC: { value: new THREE.Color() }, uSunE: { value: new THREE.Color() }, uLidCol: { value: new THREE.Color(0.36, 0.39, 0.45) },
      uPole: { value: POLE_S }, uE1: { value: E1 }, uE2: { value: E2 }, uVeilCol: { value: new THREE.Color() }, uMtn: { value: new THREE.Color() },
      uLid: { value: new THREE.Vector4(0, 46, 1, 0.0011) }, uVeil: { value: new THREE.Vector4(path.startTangent.x, path.startTangent.z, 0, 0) },
      uStarRot: { value: 0 }, uTrail: { value: 0.1 }, uLidLead: { value: 70 }, uMtA: { value: 1 }, uMwN: { value: new THREE.Vector3(0.36, 0.48, 0.8) },
    };
    // (the dome's gradient, sun, glow, arch, cloud field and wind are the hero's shared uniforms: the ground's standing water
    // mirrors the same sky; see skyMir in the hero's GLSL)
    SU.uCloudP.value.set(skyS.range(0, 40), skyS.range(0, 40), 0.5, 1); SU.uWind.value.set(WIND.x, WIND.y, 0, 0); SU.uBelt.value.set(0.42, 0.2, 0.25, 0); SU.uSunD.value.set(0, 1, 0);
    { const v = new THREE.Vector2(SU.uVeil.value.x, SU.uVeil.value.y).normalize(); SU.uVeil.value.x = v.x; SU.uVeil.value.y = v.y; }
    const skyMat = hero.makeMat(SU, SKY_VERT, SKY_FRAG, { fog: false, depthWrite: false, depthTest: true, side: THREE.BackSide });
    const sky = new THREE.Mesh(new THREE.SphereGeometry(3800, 48, 24), skyMat);
    sky.renderOrder = -1; sky.frustumCulled = false; scene.add(sky);
    await ctx.yield();
    const cloud0 = SU.uCloudP.value.clone();
    // the Milky Way is a fact of this sky, not of the route: one great circle fixed in the stars' own frame (uMwN, its pole; the frame
    // is E1, the south celestial pole, E2), 61 degrees off the celestial pole as the real galaxy's is 63, turning with the stars the
    // whole flight. As the sky wheels, the band stands across the south-west both long nights: in the first it rises from the horizon
    // a little right of the line of flight and climbs to the left, in the second it rises on the left and climbs to the right
    SU.uMwN.value.set(0.36, 0.48, 0.8).normalize();

    // ---------- GLSL twin of the plain height (valid outside the koppie skirt, e > 92) ----------
    const PLAIN_GLSL = /* glsl */`
uniform vec4 uPl; uniform vec4 uKop[6];
float groundH(vec2 p){
  float k = smoothstep(150., 420., length(p));
  float h = k * (1.25 * sin(p.x * .0105 + uPl.x) * cos(p.y * .0087 + uPl.y) + .8 * sin(p.x * .021 + p.y * .016 + uPl.z) + .45 * sin(p.y * .037 - p.x * .012 + uPl.w));
  for (int i = 0; i < 6; i++) h += uKop[i].w * (1. - smoothstep(0., uKop[i].z, length(p - uKop[i].xy)));
  h += featH(p);
  float wd = abs(p.y - (uWash.x + uWash.y * sin(p.x * uWash.z + uWash.w)));
  return h - .8 * (1. - smoothstep(4., 12., wd)) * smoothstep(78., 100., length(p * vec2(.8, 1.)));
}`;
    const uPl = { value: new THREE.Vector4(PL[0], PL[1], PL[2], PL[3]) }, uKop = { value: kops.map((k) => new THREE.Vector4(k.x, k.z, k.r, k.h)) };

    // ---------- mid tier on the plain: instanced heads in two treadmill windows that wrap around the lens ----------
    const TREAD_VERT = PLAIN_GLSL + /* glsl */`
attribute vec3 iOff; attribute vec4 iRnd;
uniform vec4 uWin; uniform float uHead;
varying vec2 vUv; varying vec3 vP, vHn, vFace, vBack; varying float vOpen, vEye;
void main(){
  vec2 rel = fract(iOff.xy - uWin.xy * uWin.w) - .5;
  vec2 pxz = uWin.xy + rel * uWin.z;
  float edge = 1. - smoothstep(.36, .5, max(abs(rel.x), abs(rel.y)));
  edge *= smoothstep(93., 106., length(pxz * vec2(.8, 1.)));
  vec3 ip = vec3(pxz.x, groundH(pxz), pxz.y);
  vec4 sp = daisyMix(speciesAt(pxz));
  float pres = step(iRnd.x, sp.w * 1.05 * uFrac);
  float o = openAt(pxz, iRnd.y);
  float k = fract(iRnd.x * 7.31 + iRnd.y * 3.17);
  headColours(sp, k, iRnd.z, yellowAt(pxz), vFace, vBack);
  vEye = step(sp.z, k); vOpen = o;
  // among the orange daisies a few deep red gazanias and purple ragworts (pale-eyed)
  float kd = fract(iRnd.y * 17.3 + iRnd.z * 5.7) + step(k, sp.z + sp.y);
  if (kd < .07) { vFace = vec3(.8, .21, .03) * (.85 + .3 * iRnd.z); vBack = vec3(.42, .2, .1); }
  else if (kd < .075 + .2 * smoothstep(.56, .74, vn(pxz * .13 + 3.3))) { vFace = vec3(.42, .08, .4) * (.8 + .4 * iRnd.z); vBack = vec3(.3, .17, .33); vEye = 0.; }
  float a0 = iRnd.z * 6.283;
  // (under a low sun the heads lean less, so from the lens they are still discs and not slivers)
  vec3 Hn = normalize(mix(vec3(0., 1., 0.), uSunDir, .6 * o * mix(.3, 1., smoothstep(.2, .55, uSunDir.y))) + vec3(cos(a0), 0., sin(a0)) * (1. - o) * .35
    + vec3(sin(uTime * 8. + a0 * 5.), 0., cos(uTime * 6.7 + a0 * 3.)) * .08);
  float dist = length(uCam - ip);
  // (and the open heads turn their faces part of the way to the lens: seen from 1.6 m up they are discs, not edge-on slivers)
  Hn = normalize(Hn + (uCam - ip) / max(dist, 1e-3) * uBias * o);
  vec3 T = normalize(cross(vec3(.3, 0., 1.), Hn)); vec3 Bv = cross(Hn, T);
  float size = (.03 + .1 * iRnd.z * iRnd.z * iRnd.z + .012 * iRnd.x) * mix(1., .82, 1. - vEye) * (1. + .3 * step(k, sp.y)) * uHead * pres * mix(.72, 1., o) * smoothstep(.45, 1., uGrowth) * edge;
  size *= 1. + dist * .022;
  float hgt = (.15 + .17 * fract(iRnd.z * 5.3)) * uGrowth * mix(1., .5, 1. - vEye);
  vec3 P = ip + vec3(0., hgt, 0.) + (Hn - vec3(0., 1., 0.)) * hgt * .4 + (T * position.x + Bv * position.y) * size;
  vUv = position.xy; vP = P; vHn = Hn;
  vec4 mvPosition = modelViewMatrix * vec4(P, 1.);
  gl_Position = projectionMatrix * mvPosition;
#include <fog_vertex>
}`;
    const treads = [];
    // (TREAD_PRES: the factor that pres in TREAD_VERT gives the share in flower, read from that line itself, so the two cannot
    // part; if the line should ever read otherwise, every head is drawn. TREAD_SLACK: what the search of treadCount allows over
    // the product, for the shader multiplies in single precision. See THE HEADS IN THE ORDER OF THEIR DRAW OF PRESENCE)
    const TREAD_PRES = Number((/step\(iRnd\.x, sp\.w \* ([0-9.]+) \* uFrac\)/.exec(TREAD_VERT) || [0, Infinity])[1]), TREAD_SLACK = 1e-4;
    const makeTread = (count, W, head, lead) => {
      const n = Math.round(count * detail * clamp(density, 0.85, 1)), iOff = new Float32Array(n * 3), iRnd = new Float32Array(n * 4), tr = rng.fork('tread' + W);
      for (let i = 0; i < n; i++) { iOff[i * 3] = tr(); iOff[i * 3 + 1] = tr(); iOff[i * 3 + 2] = tr(); iRnd[i * 4] = tr(); iRnd[i * 4 + 1] = tr(); iRnd[i * 4 + 2] = tr(); iRnd[i * 4 + 3] = 0; }
      // THE HEADS IN THE ORDER OF THEIR DRAW OF PRESENCE. A head is present where its draw of presence, iRnd.x, is no more than
      // the ground's cover (never more than 1) times TREAD_PRES times the share in flower (pres in TREAD_VERT); a head that is
      // not present has no size and draws nothing. So the heads are laid into the buffers in the order of that draw, the least
      // first, each with its own draws: at every share in flower the heads that can be present are then the first of the mesh,
      // and update draws those and no more (treadCount finds how many in the ordered draws). The heads it leaves out are
      // heads without size at that share.
      { const ord = Array.from({ length: n }, (_, i) => i).sort((a, b) => iRnd[a * 4] - iRnd[b * 4] || a - b), o0 = iOff.slice(), r0 = iRnd.slice();
        ord.forEach((j, i) => { iOff.set(o0.subarray(j * 3, j * 3 + 3), i * 3); iRnd.set(r0.subarray(j * 4, j * 4 + 4), i * 4); }); }
      const draws = Float32Array.from({ length: n }, (_, i) => iRnd[i * 4]);
      const g = new THREE.InstancedBufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3)); g.setIndex([0, 1, 2, 0, 2, 3]);
      g.setAttribute('iOff', new THREE.InstancedBufferAttribute(iOff, 3)); g.setAttribute('iRnd', new THREE.InstancedBufferAttribute(iRnd, 4));
      g.instanceCount = n;
      const uWin = { value: new THREE.Vector4(0, 0, W, 1 / W) }, uHead = { value: head };
      const mat = hero.makeMat({ ...U, uWin, uHead, uPl, uKop }, TREAD_VERT, hero.midFrag, { side: THREE.DoubleSide });
      const m = new THREE.Mesh(g, mat); m.frustumCulled = false; scene.add(m);
      treads.push({ uWin, uHead, head, lead, mesh: m });
      treads[treads.length - 1].draws = draws;
    };
    // how many heads of a treadmill can be present at a share in flower: the heads whose draw of presence is no more than
    // TREAD_PRES times the share (and the slack), counted in its ordered draws
    const treadCount = (draws, share) => { const top = TREAD_PRES * share + TREAD_SLACK; let lo = 0, hi = draws.length; while (lo < hi) { const mid = (lo + hi) >> 1; if (draws[mid] <= top) lo = mid + 1; else hi = mid; } return lo; };
    makeTread(12000, 30, 0.95, 11);
    await ctx.yield();
    makeTread(8000, 96, 1.25, 40);
    await ctx.yield();

    // ---------- lens plants: real flowering plants in a 20 m treadmill window around the lens, from the seedlings of day 2 to the foot
    // of the koppie. One instance is one plant: a tuft of six arching leaves over its own dark litter, two to six heads of different
    // sizes on their own stems (each head a card with its rays, ring and eye cut and painted in the fragment shader, cupped by its
    // shading normal; shut, it is an upright furled goblet in the colour of the rays' backs), and for a few plants a tall spike of
    // cat's tail (Bulbinella) with grassy leaves instead. Kinds: orange Namaqualand daisies and yellow gousblom (dark eye and ring),
    // white rain daisies (violet eye), deep red gazanias (black-spotted), purple ragwort (small, tall, yellow-eyed). Plants crowd in
    // clumps a pace or two across with grit between (the same drift thins the painted heads of the ground under them). Open heads
    // turn part of the way to the lens (uBias), so from 1.6 m up every one is a disc. Species, yellow sheets, opening, growth and the
    // share in flower (uFrac) are the hero's shared functions, so the plants agree with the painted ground and the quad heads beyond.
    // (where a plant stands and whether it is there: shared by the plants and by their shadows)
    const PLANT_AT = /* glsl */`
  vec2 rel = fract(iOff.xy - uWin.xy * uWin.w) - .5;
  vec2 pxz = uWin.xy + rel * uWin.z;
  float edge = 1. - smoothstep(.4, .5, max(abs(rel.x), abs(rel.y)));
  edge *= smoothstep(93., 106., length(pxz * vec2(.8, 1.)));
  vec3 ip = vec3(pxz.x, groundH(pxz), pxz.y);
  vec4 sp = daisyMix(speciesAt(pxz));
  float hsh = fract(iRnd.x * 13.71 + iRnd.w * 5.13);
  float clump = smoothstep(.3, .62, vn(pxz * 1.37 + 12.3) * .5 + vn(pxz * .47 + 5.9) * .5);
  float dens = sp.w * 1.25 * (.4 + .9 * clump) * mix(1., .8, sp.y) * mix(1.6, 1., smoothstep(.45, .8, uGrowth));
  float here = step(hsh, dens) * edge;
  float flower = step(hsh, dens * uFrac);
  float sc = (.8 + .5 * iRnd.z) * uLensK;
`;
    const LENS_VERT = PLAIN_GLSL + /* glsl */`
attribute vec3 iOff; attribute vec4 iRnd, aH; attribute float aPart, aJ;
uniform vec4 uWin; uniform float uLensK;
varying vec3 vP, vN, vT, vFace, vBack, vEyeC; varying float vPart, vOpen, vKind, vHash; varying vec2 vQ;
void main(){` + PLANT_AT + /* glsl */`
  float o = openAt(pxz, iRnd.y);
  float k = fract(iRnd.x * 7.31 + iRnd.y * 3.17);
  headColours(vec4(sp.x, sp.y, 0., 1.), k, iRnd.z, yellowAt(pxz), vFace, vBack);
  float kind = step(k, sp.y);
  vEyeC = mix(vec3(.05, .024, .012), vec3(.06, .035, .15), kind);
  // (gazanias anywhere among the orange; ragwort only in loose colonies)
  float kd = fract(iRnd.y * 17.3 + iRnd.z * 5.7) + kind;
  if (kd < .07) { kind = 2.; vFace = vec3(.8, .21, .03) * (.85 + .3 * iRnd.z); vBack = vec3(.42, .2, .1); }
  else if (kd < .075 + .2 * smoothstep(.56, .74, vn(pxz * .13 + 3.3))) { kind = 3.; vFace = vec3(.42, .08, .4) * (.8 + .4 * iRnd.z); vBack = vec3(.3, .17, .33); vEyeC = vec3(.95, .7, .1); }
  // cat's tails stand in loose groups, never in the lane right under the lens
  vec2 hd = uWin.xy - uCam.xz; hd /= max(length(hd), 1e-3);
  vec2 rc = pxz - uCam.xz; float latd = abs(rc.x * hd.y - rc.y * hd.x);
  float spk = step(.985 - .1 * smoothstep(.5, .72, vn(pxz * .11 + 7.7)), fract(iRnd.w * 9.7 + iRnd.z * 3.3)) * smoothstep(1.6, 2.6, latd);
  float hgtK = smoothstep(.3, .95, uGrowth), headK = smoothstep(.5, .9, uGrowth) * flower * (1. - spk);
  float a0 = iRnd.x * 6.2832;
  vec3 up = vec3(0., 1., 0.);
  vec3 toC = uCam - ip; float dc = length(toC);
  vec3 Vh = vec3(toC.x, 0., toC.z); Vh /= max(length(Vh), 1e-3);
  vec3 Rv = vec3(Vh.z, 0., -Vh.x);
  vec3 P = ip; vec3 N = up; vec3 Tn = Rv; vQ = vec2(0.); float hj = 0.;
  if (aPart < 2.5) {
    // a head (0) or its stem (2)
    float j = aJ; hj = h21(vec2(j * 7.3 + 1.7, iRnd.w * 91. + 3.1)); float hj2 = h21(vec2(j * 3.1 + 5.9, iRnd.x * 77. + 1.3));
    float nH = 2. + floor(iRnd.y * 4.999);
    float show = step(j, nH - .5) * headK;
    float ang = aH.x + a0, rad = aH.y * (.5 + .7 * hj) * .2 * sc;
    float hgt = (.1 + .26 * aH.z * (.6 + .8 * hj2)) * sc * hgtK * mix(1., 1.55, step(2.5, kind));
    vec3 out2 = vec3(cos(ang), 0., sin(ang));
    vec3 wind = vec3(sin(uTime * 8. + a0 * 5. + j), 0., cos(uTime * 6.7 + a0 * 3. + j * 2.)) * .05;
    vec3 base = ip + out2 * rad * .3;
    vec3 hp = ip + out2 * rad + up * hgt + wind * hgt;
    if (aPart < .5) {
      vec3 Hn = normalize(mix(up, uSunDir, .6 * o * mix(.3, 1., smoothstep(.2, .55, uSunDir.y))) + out2 * .25 + wind);
      vec3 Vc = (uCam - hp) / max(length(uCam - hp), 1e-3);
      Hn = normalize(Hn + Vc * uBias * mix(.4, 1., o));
      float oo = smoothstep(.2, .5, o);
      Hn = normalize(mix(Vh + up * .15, Hn, oo));
      vec3 Bv = cross(Hn, Rv); Bv /= max(length(Bv), 1e-3);
      Tn = cross(Bv, Hn);
      float kindK = mix(mix(mix(1., .9, step(.5, kind)), 1.12, step(1.5, kind)), .62, step(2.5, kind));
      float Rh = .075 * sc * (.55 + .75 * aH.w * (.7 + .6 * hj)) * kindK * show * mix(.8, 1., oo);
      P = hp + (Tn * position.x + Bv * position.y) * Rh + Hn * .004;
      N = Hn; vQ = position.xy;
    } else {
      float w = max(.007 * sc, dc * .0013) * show;
      P = mix(base, hp, position.y) + Rv * position.x * w * (1. - position.y);
      N = normalize(Vh + up * .4); vQ = position.xy;
    }
  } else if (aPart < 4.5) {
    // a leaf: base, two shoulders, tip; arching out of the tuft (long, narrow and upright on a cat's tail)
    float l = aJ - 10.; hj = h21(vec2(l * 5.3 + 2.2, iRnd.z * 83. + 7.7));
    float ang = aH.x + a0 * 3., t = position.y, side = position.x;
    float len = (.11 + .1 * aH.y * (.6 + .8 * hj)) * sc * smoothstep(.06, .45, uGrowth) * mix(1., 1.8, spk);
    vec2 d2 = vec2(cos(ang), sin(ang));
    vec2 l2 = d2 * t * len * mix(1., .55, spk) + vec2(-d2.y, d2.x) * side * len * mix(.24, .07, spk);
    P = ip + vec3(l2.x, .012 + sin(t * 2.3) * len * (.3 + .35 * aH.z) * mix(1., 2.4, spk), l2.y);
    N = normalize(vec3(-d2.x * .5, 1., -d2.y * .5) + vec3(-d2.y, 0., d2.x) * side * .5);
    vQ = vec2(side, t);
  } else {
    // the spike: one card turned to the lens, swaying; the raceme is cut and painted in the fragment shader
    float Hs = (.5 + .4 * iRnd.y) * sc * hgtK * smoothstep(.8, .97, uGrowth) * spk * flower;
    vec3 sway = vec3(sin(uTime * 5. + a0 * 7.), 0., cos(uTime * 4.3 + a0 * 5.)) * .05 + vec3(cos(a0 * 3.), 0., sin(a0 * 3.)) * .08;
    float t = position.y;
    P = ip + up * t * Hs + sway * t * t * Hs + Rv * position.x * max(.05 * sc, dc * .004) * step(1e-3, Hs);
    N = normalize(Vh + up * .3); vQ = position.xy;
  }
  P = ip + (P - ip) * here;
  vP = P; vN = N; vT = Tn; vPart = aPart; vOpen = o; vKind = mix(kind, 4., step(.5, spk)); vHash = hj;
  vec4 mvPosition = modelViewMatrix * vec4(P, 1.);
  gl_Position = projectionMatrix * mvPosition;
#include <fog_vertex>
}`;
    const LENS_FRAG = /* glsl */`
varying vec3 vP, vN, vT, vFace, vBack, vEyeC; varying float vPart, vOpen, vKind, vHash; varying vec2 vQ;
void main(){
  vec3 N = normalize(vN + vec3(0., 1e-5, 0.)); vec3 V = normalize(uCam - vP + vec3(0., 1e-4, 0.));
  float lit = sunLine(vP.xz) * domeShadow(vP);
  vec3 alb = vec3(.1); float wrap = .5, sunK = 1.; vec3 add = vec3(0.);
  if (vPart < .5) {
    float r = length(vQ), a = atan(vQ.y, vQ.x + 1e-5);
    if (vOpen < .35) {
      // shut: a furled goblet in the colour of the rays' backs, paler at its tip, on a green calyx
      float y = vQ.y * .5 + .5;
      float w = (.2 + .26 * sin(clamp(y, 0., 1.) * 2.5)) * (1. - .85 * smoothstep(.7, 1., y));
      if (abs(vQ.x) > w) discard;
      alb = mix(mix(cGreen, vec3(.16, .36, .08), .45) * .6, vBack * (1. + .5 * smoothstep(.55, 1., y)), smoothstep(.15, .32, y));
      alb *= .82 + .18 * cos(vQ.x / max(w, 1e-3) * 5.);
      alb = mix(alb, vec3(.62, .68, .86) * (.5 + .7 * y), uNite * .6 * smoothstep(.2, .5, y));          // by night the pale tips catch the starlight
    } else {
      float n = vKind > 2.5 ? 9. : vKind > 1.5 ? 17. : 13.;
      float pm = abs(fract(a * n / 6.2832 + vHash) - .5) * 2.;
      if (r > mix(1., .62, pm * pm) * mix(.72, 1., vOpen)) discard;
      float front = step(0., dot(N, V));
      vec3 T = normalize(vT + vec3(1e-5, 0., 0.)), B = cross(N, T);
      // the rays stand in a shallow cup, deeper under a low sun: the far side of the head turns its face to the lens
      float cup = .25 + .5 * (1. - smoothstep(.2, .55, uSunDir.y));
      vec3 Nc = normalize(N - (T * vQ.x + B * vQ.y) * cup);
      // (a rain daisy is cream, never white: its rays darken to mauve toward the eye and each ray has its own crease and shade)
      float wk = step(.5, vKind) * step(vKind, 1.5);
      alb = mix(vBack, vFace * mix(1.06, 1., wk) + .03 * (1. - wk), mix(.55, 1., front));
      alb *= mix(.84 + .16 * cos(pm * 3.1416), (.72 + .28 * cos(pm * 3.1416)) * (.86 + .14 * cos(a * 5. + vHash * 40.)), wk);
      alb = mix(alb, alb * vec3(.62, .52, .78), wk * (1. - smoothstep(.3, .8, r)) * .8);
      float eyeR = vKind > 2.5 ? .2 : .26;
      float ring = 1. - smoothstep(eyeR, eyeR + .17, r);
      if (vKind < .5) alb = mix(alb, vFace * .36, ring * .7 * front);
      else if (vKind < 1.5) alb = mix(alb, vec3(.26, .17, .42), ring * .8 * front);
      else if (vKind < 2.5) alb = mix(alb, vec3(.04, .03, .02), max(ring * .6, (1. - smoothstep(.07, .13, abs(r - .45))) * (1. - smoothstep(.25, .6, pm))) * front);
      alb = mix(alb, vEyeC * (.7 + .7 * smoothstep(0., eyeR, r)), (1. - smoothstep(eyeR - .05, eyeR, r)) * front);
      float n0s = clamp(dot(N, uSunDir), -1., 1.);
      add = (vFace * uSunCol * lit * vOpen * ((1. - front) * max(n0s, 0.) * .42 + front * max(-n0s, 0.) * .3) + alb * uSunCol * lit * .08) * mix(1., .3, wk);
      N = front > .5 ? Nc : -Nc;
    }
  } else if (vPart < 2.5) {
    alb = mix(cGreen, vec3(.16, .36, .08), .45) * mix(.4, .72, vQ.y); if (dot(N, V) < 0.) N = -N;
  } else if (vPart < 4.5) {
    if (dot(N, V) < 0.) N = -N;
    vec3 lc = mix(mix(cGreen, vec3(.14, .34, .07), .5), vec3(.17, .43, .08), step(.5, vKind) * step(vKind, 1.5));
    lc = mix(lc, vec3(.2, .4, .12), step(3.5, vKind));
    alb = lc * mix(.5, .92, vQ.y) * (.82 + .3 * vHash) * (1. - .22 * (1. - smoothstep(0., .3, abs(vQ.x)))); wrap = .35;
  } else {
    float x = vQ.x, t = vQ.y;
    float w = mix(.92, .15, smoothstep(.45, 1., t)) * smoothstep(.36, .47, t);
    vec2 cg = vec2(x * 3.3 + .5 * floor(mod(t * 26., 2.)), t * 26.); vec2 cf = fract(cg) - .5;
    float fl = (1. - smoothstep(.34, .5, length(cf))) * step(abs(x), w);
    float stem = step(abs(x), .1) * step(t, .98);
    if (max(fl, stem) < .5) discard;
    vec3 fc = mix(vec3(.93, .7, .07), vec3(.2, .3, .85), uSeason.w) * (.75 + .5 * h21(floor(cg) + 3.3));
    fc = mix(fc, mix(vec3(.5, .6, .12), vec3(.95, .45, .05), .5), smoothstep(.8, 1., t));
    alb = mix(vec3(.2, .4, .12) * mix(.45, .8, t), fc, fl);
    add = alb * uSunCol * lit * .1 * fl; if (dot(N, V) < 0.) N = -N; wrap = .6;
  }
  vec3 col = shadeS(alb, N, vP, wrap, sunK, 0.) + add;
  gl_FragColor = vec4(col, 1.);
#include <fog_fragment>
}`;
    const lens = { uWin: { value: new THREE.Vector4(0, 0, 20, 1 / 20) }, uLensK: { value: 1 }, mesh: null };
    {
      const pos = [], part = [], aJ = [], aH = [], idx = [];
      const v = (x, y, z, p, j, h) => { pos.push(x, y, z); part.push(p); aJ.push(j); aH.push(h[0], h[1], h[2], h[3]); return pos.length / 3 - 1; };
      // six heads: [angle round the plant, how far out, how tall, how large]; the middle one stands tallest and largest
      const HS = [[0, 0.12, 1, 1], [2.4, 0.62, 0.78, 0.8], [4.8, 0.85, 0.6, 0.92], [0.9, 1, 0.42, 0.6], [3.3, 0.9, 0.52, 0.72], [5.7, 0.7, 0.86, 0.55]];
      HS.forEach((h, j) => {
        const b = v(-1, -1, 0, 0, j, h); v(1, -1, 0, 0, j, h); v(1, 1, 0, 0, j, h); v(-1, 1, 0, 0, j, h); idx.push(b, b + 1, b + 2, b, b + 2, b + 3);
        const c = v(-1, 0, 0, 2, j, h); v(1, 0, 0, 2, j, h); v(0, 1, 0, 2, j, h); idx.push(c, c + 1, c + 2);
      });
      // six leaves: [angle, length, lift]
      const LS = [[0.4, 1, 0.5, 0], [1.45, 0.7, 0.9, 0], [2.5, 0.9, 0.3, 0], [3.55, 0.6, 0.7, 0], [4.6, 0.85, 0.4, 0], [5.65, 0.75, 0.8, 0]];
      LS.forEach((h, l) => { const b = v(0, 0, 0, 4, 10 + l, h); v(-1, 0.55, 0, 4, 10 + l, h); v(1, 0.55, 0, 4, 10 + l, h); v(0, 1, 0, 4, 10 + l, h); idx.push(b, b + 1, b + 2, b + 1, b + 3, b + 2); });
      const Z4 = [0, 0, 0, 0];
      { const b = v(-1, 0, 0, 5, 0, Z4); v(1, 0, 0, 5, 0, Z4); v(-1, 1, 0, 5, 0, Z4); v(1, 1, 0, 5, 0, Z4); idx.push(b, b + 1, b + 2, b + 1, b + 3, b + 2); }
      const n = Math.round(2200 * detail * clamp(density, 0.85, 1.1)), iOff = new Float32Array(n * 3), iRnd = new Float32Array(n * 4), lr = ctx.core.makeRng(((ctx.seed | 0) ^ 0x1e57d3) >>> 0);
      for (let i = 0; i < n; i++) { iOff[i * 3] = lr(); iOff[i * 3 + 1] = lr(); iOff[i * 3 + 2] = 0; iRnd[i * 4] = lr(); iRnd[i * 4 + 1] = lr(); iRnd[i * 4 + 2] = lr(); iRnd[i * 4 + 3] = lr(); }
      const g = new THREE.InstancedBufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aPart', new THREE.Float32BufferAttribute(part, 1));
      g.setAttribute('aJ', new THREE.Float32BufferAttribute(aJ, 1)); g.setAttribute('aH', new THREE.Float32BufferAttribute(aH, 4)); g.setIndex(idx);
      const aOff = new THREE.InstancedBufferAttribute(iOff, 3), aRnd = new THREE.InstancedBufferAttribute(iRnd, 4);
      g.setAttribute('iOff', aOff); g.setAttribute('iRnd', aRnd); g.instanceCount = n;
      lens.mesh = new THREE.Mesh(g, hero.makeMat({ ...U, uWin: lens.uWin, uLensK: lens.uLensK, uPl, uKop }, LENS_VERT, LENS_FRAG, { side: THREE.DoubleSide }));
      lens.mesh.frustumCulled = false; lens.mesh.visible = false; scene.add(lens.mesh); lens.n = n; lens.n0 = Math.round(n * 0.6);
      // each plant's shade on the ground: a soft blue-grey disc multiplied into whatever lies under it (gravel, leaf, painted heads),
      // drawn out away from the sun; without a sun only the dimness under the tuft
      const PSH_VERT = PLAIN_GLSL + /* glsl */`
attribute vec3 iOff; attribute vec4 iRnd;
uniform vec4 uWin; uniform float uLensK;
varying vec2 vQ; varying float vA;
void main(){` + PLANT_AT + /* glsl */`
  float hl = max(length(uSunDir.xz), 1e-3); vec2 sd = -uSunDir.xz / hl;
  float rs = (.2 + .12 * iRnd.y) * sc * smoothstep(.06, .45, uGrowth) * here;
  float sun = smoothstep(.03, .14, uSunDir.y) * sunLine(pxz);
  float st = min(.45 * hl / max(uSunDir.y, .15), 2.) * sun;
  vec2 q = pxz + sd * rs * st * .6 + (sd * position.x * (1. + st * .6) + vec2(-sd.y, sd.x) * position.z) * rs;
  vec3 P = vec3(q.x, ip.y + .03 + .04 * length(q - pxz), q.y);
  vQ = position.xz; vA = (.3 + .3 * sun) * (1. - .5 * uNite);
  vec4 mvPosition = modelViewMatrix * vec4(P, 1.);
  gl_Position = projectionMatrix * mvPosition;
#include <fog_vertex>
}`;
      const PSH_FRAG = /* glsl */`
varying vec2 vQ; varying float vA;
void main(){
  float a = (1. - smoothstep(.25, 1., length(vQ))) * vA;
#ifdef USE_FOG
  a *= exp(-fogDensity * fogDensity * vFogDepth * vFogDepth);
#endif
  gl_FragColor = vec4(mix(vec3(1.), vec3(.3, .38, .5), a), 1.);
}`;
      const gs = new THREE.InstancedBufferGeometry();
      gs.setAttribute('position', new THREE.Float32BufferAttribute([-1, 0, -1, 1, 0, -1, 1, 0, 1, -1, 0, 1], 3)); gs.setIndex([0, 2, 1, 0, 3, 2]);
      gs.setAttribute('iOff', aOff); gs.setAttribute('iRnd', aRnd); gs.instanceCount = n;
      lens.shade = new THREE.Mesh(gs, hero.makeMat({ ...U, uWin: lens.uWin, uLensK: lens.uLensK, uPl, uKop }, PSH_VERT, PSH_FRAG, { transparent: true, depthWrite: false, blending: THREE.CustomBlending,
        blendEquation: THREE.AddEquation, blendSrc: THREE.DstColorFactor, blendDst: THREE.ZeroFactor, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }));
      lens.shade.frustumCulled = false; lens.shade.visible = false; lens.shade.renderOrder = 1; scene.add(lens.shade);
    }
    await ctx.yield();

    // ---------- butterflies over the bloom: painted ladies, whites and clouded yellows in an 18 m treadmill window round the lens,
    // each wandering a loop a metre or two across half a metre over the heads, beating in bursts and gliding; none within 1.6 m of
    // the lens. Four triangles each (two wing cards, cut into fore and hind wing in the fragment shader).
    const flies = { uWin: { value: new THREE.Vector4(0, 0, 18, 1 / 18) }, uFly: { value: 0 }, mesh: null };
    {
      const FLY_VERT = PLAIN_GLSL + /* glsl */`
attribute vec3 iOff; attribute vec4 iRnd;
uniform vec4 uWin; uniform float uFly;
varying vec3 vP, vN; varying vec2 vQ; varying float vK;
void main(){
  vec2 rel = fract(iOff.xy - uWin.xy * uWin.w) - .5;
  vec2 c = uWin.xy + rel * uWin.z;
  float edge = 1. - smoothstep(.36, .5, max(abs(rel.x), abs(rel.y)));
  float ph = iRnd.x * 6.2832, sp = .6 + .8 * iRnd.y, amp = .7 + .9 * iRnd.z;
  float t1 = uTime * .9 * sp + ph, t2 = uTime * 2.3 * sp + ph * 2., t3 = uTime * .7 * sp + ph * 1.7, t4 = uTime * 1.9 * sp + ph;
  vec2 pxz = c + vec2(sin(t1) + .5 * sin(t2), cos(t3) + .5 * cos(t4)) * amp;
  vec2 dw = vec2(.9 * cos(t1) + 1.15 * cos(t2), -.7 * sin(t3) - .95 * sin(t4));
  vec2 hd = dw / max(length(dw), 1e-3);
  float cov = daisyMix(speciesAt(c)).w;
  vec3 body = vec3(pxz.x, groundH(pxz) + .5 + .55 * iRnd.w + .14 * sin(uTime * 3.1 * sp + ph * 3.), pxz.y);
  float sz = (.075 + .045 * iRnd.y) * uFly * edge * smoothstep(1.6, 3.2, length(uCam - body)) * smoothstep(.3, .6, cov);
  float beat = sin(uTime * (12. + 6. * iRnd.z) + ph * 5.);
  float flap = mix(.2 + 1.05 * beat, .5, smoothstep(.55, .8, sin(uTime * 1.3 * sp + ph * 4.)));
  vec3 fwd = vec3(hd.x, 0., hd.y), rt = vec3(-hd.y, 0., hd.x);
  vec3 wdir = rt * position.z * cos(flap) + vec3(0., sin(flap), 0.);
  vec3 P = body + (fwd * position.y + wdir * position.x) * sz;
  vP = P; vN = cross(fwd, wdir) * position.z; vQ = position.xy; vK = iRnd.w;
  vec4 mvPosition = modelViewMatrix * vec4(P, 1.);
  gl_Position = projectionMatrix * mvPosition;
#include <fog_vertex>
}`;
      const FLY_FRAG = /* glsl */`
varying vec3 vP, vN; varying vec2 vQ; varying float vK;
void main(){
  float d1 = length((vQ - vec2(.5, .38)) / vec2(.52, .42)), d2 = length((vQ - vec2(.38, -.3)) / vec2(.4, .42)), dm = min(d1, d2);
  float bodyK = (1. - smoothstep(.05, .09, vQ.x)) * step(abs(vQ.y), .5);
  if (dm > 1. && bodyK < .5) discard;
  vec3 base = vK < .5 ? vec3(.86, .4, .06) : vK < .8 ? vec3(.86, .84, .74) : vec3(.9, .72, .1);
  float dk = max(smoothstep(.74, .92, dm) * (vK < .5 ? 1. : .55), smoothstep(.66, .8, vQ.x) * step(.15, vQ.y) * (vK < .8 ? 1. : .6));
  vec3 alb = mix(base, vec3(.04, .03, .03), max(dk, bodyK));
  vec3 N = normalize(vN + vec3(0., 1e-4, 0.)); vec3 V = normalize(uCam - vP + vec3(0., 1e-4, 0.)); if (dot(N, V) < 0.) N = -N;
  vec3 col = shade(alb, N, vP, .6) + alb * uSunCol * sunLine(vP.xz) * .1;
  gl_FragColor = vec4(col, 1.);
#include <fog_fragment>
}`;
      const pos = [], idx = [];
      for (const sd of [-1, 1]) { const b = pos.length / 3; pos.push(0, 0.8, sd, 0, -0.72, sd, 1.02, 0.8, sd, 1.02, -0.72, sd); idx.push(b, b + 1, b + 2, b + 1, b + 3, b + 2); }
      const n = Math.round(110 * detail), iOff = new Float32Array(n * 3), iRnd = new Float32Array(n * 4), br = ctx.core.makeRng(((ctx.seed | 0) ^ 0x2b7f19) >>> 0);
      for (let i = 0; i < n; i++) { iOff[i * 3] = br(); iOff[i * 3 + 1] = br(); iOff[i * 3 + 2] = 0; iRnd[i * 4] = br(); iRnd[i * 4 + 1] = br(); iRnd[i * 4 + 2] = br(); iRnd[i * 4 + 3] = br(); }
      const g = new THREE.InstancedBufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx);
      g.setAttribute('iOff', new THREE.InstancedBufferAttribute(iOff, 3)); g.setAttribute('iRnd', new THREE.InstancedBufferAttribute(iRnd, 4)); g.instanceCount = n;
      flies.mesh = new THREE.Mesh(g, hero.makeMat({ ...U, uWin: flies.uWin, uFly: flies.uFly, uPl, uKop }, FLY_VERT, FLY_FRAG, { side: THREE.DoubleSide }));
      flies.mesh.frustumCulled = false; flies.mesh.visible = false; scene.add(flies.mesh);
    }
    await ctx.yield();

    // ---------- props in the hero's own granite and quiver-tree materials (each family from its own stream) ----------
    const rocks = [], trees = [], casters = [], pr = rng.fork('props');
    const shadowOf = [];                 // [x, z, half width, height, kind (0 blob, 1 tree)] for the clock-hand shadow strips
    const offPath = (x, z, r) => path.nearestXZ(x, z).dist > 9 + r;
    const lineD = (x, z) => path.nearestXZ(x, z).dist;
    // a place given as metres along the path and metres right of it: [x, z, the path's heading there (x, z)]
    const bP = new THREE.Vector3(), bT = new THREE.Vector3();
    const beside = (s, l) => { path.posAtDist(s, bP); path.tangentAtDist(s, bT); const tl = Math.hypot(bT.x, bT.z) || 1; return [bP.x - bT.z / tl * l, bP.z + bT.x / tl * l, bT.x / tl, bT.z / tl]; };
    // the families' names go onto their specs (the hero shapes each family from its own stream)
    const mark = (i0r, i0t, st) => { for (let i = i0r; i < rocks.length; i++) rocks[i].st = st; for (let i = i0t; i < trees.length; i++) trees[i].st = st; };
    // the brief's bull (u 0.84) grazes 16 m beyond that point of the line; the standing gemsbok are seated further down (GSPEC)
    const BULL_S = 0.84 * PL_LEN + 16, GSPEC = [];
    // the brief's herd: 16 gemsbok, 10 to 20 by the visit's density
    const herdN = Math.round(clamp(16 * density, 10, 20));
    // THE HERD OF DAY 4 walks one track that is fixed in the world: it comes down the right-hand foot of the ridge, crosses the
    // line of flight squarely on the orange foot of the ridge's far slope, and goes away to the left, bending slowly ahead. The
    // track is timed once, from the brief's beat: the crossing lies 18 m beyond the point of the line where the lens is at the
    // brief's u 0.55, and the last three of the file have just stepped off the line then ('the last three clearing our line 16 to
    // 20 m ahead'). HTRK: the track's corners, [metres beyond the crossing along the line, metres right of the line]; herdAt(d) is
    // the point of the track d metres of walking beyond the crossing (see gemsUpdate for the walk).
    const HERD_X = 0.55 * PL_LEN + 18;
    const HTRK = [[-30, 104], [-24, 70], [-15, 42], [-7, 18], [0, 0], [1.5, -13], [12, -32], [36, -66], [76, -124], [120, -220]].map(([a, l]) => beside(HERD_X + a, l));
    const HLEN = [0]; for (let i = 1; i < HTRK.length; i++) HLEN.push(HLEN[i - 1] + Math.hypot(HTRK[i][0] - HTRK[i - 1][0], HTRK[i][1] - HTRK[i - 1][1]));
    const H_X = HLEN[4], H_END = HLEN[HLEN.length - 1];
    const herdAt = (d, out) => {
      const q = clamp(d + H_X, 0, H_END); let i = 1; while (i < HLEN.length - 1 && HLEN[i] < q) i++;
      const f = (q - HLEN[i - 1]) / Math.max(1e-3, HLEN[i] - HLEN[i - 1]);
      out[0] = lerp(HTRK[i - 1][0], HTRK[i][0], f); out[1] = lerp(HTRK[i - 1][1], HTRK[i][1], f); return out;
    };
    // (the ground they cross is a tongue of the orange flats, whatever the year's leading colour)
    { const q = beside(HERD_X + 8, -2); U.uOrange.value.set(q[0], q[1], 32, 1); }
    const trackPts = [];
    for (let d = -H_X; d <= H_END - H_X; d += 4) { const q = herdAt(d, [0, 0]); trackPts.push([q[0], q[1], 4.5]); }
    // the ostriches of day 5: one plain law for their run, a steady 16 m/s on their own lanes (the cock O_LANE = 13 m left of the
    // line, as the brief has him; the two hens 2.5 m beyond him and 3.5 m ahead) while the lens flies PL_LEN / DURATION = 27 m/s,
    // so it gains 0.41 m on them for every metre it flies. The start is derived from the brief's own stretch, u 0.63 to 0.71: 'the
    // ostriches run beside us 13 m to the left at 16 m/s and we draw past them (2.4 m at 19 to 25 m)'. 25 m from the lens with the
    // lane 13 m off is 21 m ahead: the cock is 21 m ahead as the stretch begins. From there the law itself puts him abeam at
    // u 0.677 and 15 m behind at the stretch's end (and 39 m ahead as day 5 breaks). ostrichAt(u) = where the cock runs, as a share
    // of the path.
    const O_RATIO = 16 / (PL_LEN / DURATION), ostrichAt = (u) => 0.63 + 21 / PL_LEN + O_RATIO * (u - 0.63);
    // (their lanes lie in the damp hollow of the flats beyond the ridge: see HOL)
    await ctx.yield();
    // the Sentinel: an 11 m quiver tree on an 8 m boulder stack, 106 m from the entry and 13.3 m right of the line; its taller
    // boulders are on the line's side and behind, the flank toward the setting sun is kept clean
    const SK = 1.15;      // (its scale against the set-piece artist's drawing of it)
    const S0 = path.posAtDist(106), ST = path.tangentAtDist(106), sAv = new THREE.Vector2(ST.x, ST.z).normalize(), sRv = new THREE.Vector2(-sAv.y, sAv.x);
    const SEN = { x: S0.x + sRv.x * 13.3, z: S0.z + sRv.y * 13.3 }; SEN.y = hAt(SEN.x, SEN.z);
    const sAt = (a, r) => [SEN.x + (sAv.x * a + sRv.x * r) * SK, SEN.z + (sAv.y * a + sRv.y * r) * SK];
    { const b2 = sAt(0.5, -0.6), b3 = sAt(-2.9, 1.0), b4 = sAt(-5.8, -2.0), b5 = sAt(5.2, -1.6), b6 = sAt(-1.6, 5.1), b7 = sAt(3.6, 2.6);
      rocks.push({ x: SEN.x, y: SEN.y + 2.0 * SK, z: SEN.z, r: 4.9 * SK, sy: 0.84, sx: 1, sz: 1.04, detail: 7, facets: 4, tone: 1 },
        { x: b2[0], y: SEN.y + 5.9 * SK, z: b2[1], r: 3.3 * SK, sy: 0.76, detail: 6, facets: 4, tone: 1.06 },
        { x: b3[0], y: SEN.y + 4.6 * SK, z: b3[1], r: 1.9 * SK, sy: 0.8, detail: 5, facets: 4, tone: 0.95 },
        { x: b4[0], y: SEN.y + 0.9 * SK, z: b4[1], r: 2.3 * SK, sy: 0.8, detail: 5, facets: 3, tone: 0.92 },
        { x: b5[0], y: SEN.y + 0.6 * SK, z: b5[1], r: 1.8 * SK, sy: 0.75, detail: 4, facets: 3, tone: 1.1 },
        { x: b6[0], y: SEN.y + 0.35 * SK, z: b6[1], r: 1.05 * SK, sy: 0.8, detail: 3, facets: 3, tone: 1 },
        { x: b7[0], y: SEN.y + 0.5 * SK, z: b7[1], r: 1.5 * SK, sy: 0.72, detail: 4, facets: 3, tone: 1.04 }); }
    const senTree = { x: sAt(0.3, -0.5)[0], y: SEN.y + 7.9 * SK, z: sAt(0.3, -0.5)[1], H: 10.4 * SK, levels: 5, hero: true, nest: true, lean: 0.05, yaw: 0.6 };
    trees.push(senTree); mark(0, 0, 'the Sentinel');
    casters.push([SEN.x, SEN.y + 3.9 * SK, SEN.z, 5.0 * SK], [senTree.x, SEN.y + 15.6 * SK, senTree.z, 4.1 * SK]);
    await ctx.yield();
    // six ring koppies: stacked granite domes, boulders and quiver trees on a low mound
    for (const k of kops) {
      const g0 = hAt(k.x, k.z), r0 = 27 * k.big, sy0 = pr.range(0.95, 1.3), nd = pr.int(2, 3), i0r = rocks.length, i0t = trees.length;
      rocks.push({ x: k.x, y: g0 + r0 * sy0 * 0.42, z: k.z, r: r0, sy: sy0, detail: k.near ? 7 : k.far ? 5 : 6, facets: 5, tone: pr.range(0.92, 1.06) });
      casters.push([k.x, g0 + r0 * sy0 * 0.5, k.z, r0 * 1.15]);
      k.top = g0 + r0 * sy0 * 1.4; k.ball = [k.x, g0 + r0 * sy0 * 0.5, k.z, r0 * 1.06]; k.foot = r0 * 2.6;
      for (let i = 0; i < nd; i++) {
        const a = pr.range(0, 6.28), d = r0 * pr.range(0.8, 1.15), r = r0 * pr.range(0.5, 0.75), sy = pr.range(0.8, 1.1), x = k.x + Math.cos(a) * d, z = k.z + Math.sin(a) * d;
        if (offPath(x, z, r)) rocks.push({ x, y: hAt(x, z) + r * sy * 0.35, z, r, sy, detail: k.near ? 5 : k.far ? 3 : 4, facets: 4, tone: pr.range(0.88, 1.1) });
      }
      if (k.big > 0.95 || k.near) { const r = r0 * (k.near ? 0.36 : 0.42), o = k.near ? r0 * 0.3 : 3; rocks.push({ x: k.x + pr.range(-o, o), y: g0 + r0 * sy0 * (k.near ? 1.22 : 1.34) + r * 0.5, z: k.z + pr.range(-o, o), r, sy: 0.8, detail: k.near ? 5 : 4, facets: 4, tone: 1.05 }); k.top += r * 1.2; }
      for (let i = 0; i < 9; i++) {
        const a = pr.range(0, 6.28), d = r0 * pr.range(0.9, 2.6), r = pr.range(2.2, 5.5), x = k.x + Math.cos(a) * d, z = k.z + Math.sin(a) * d, sy = pr.range(0.6, 0.9);
        if (!offPath(x, z, r * 1.3)) continue;
        rocks.push({ x, y: hAt(x, z) + r * 0.3, z, r: r * 1.3, sy, detail: k.near ? 3 : k.far ? 1 : 2, facets: 4, tone: pr.range(0.85, 1.12) });
        if (k.near) shadowOf.push([x, z, r * 1.3, r * 1.3 * sy * 1.5, 0]);
      }
      const nt = Math.round(pr.int(9, 13));
      for (let i = 0; i < nt; i++) {
        const a = pr.range(0, 6.28), d = r0 * pr.range(1.15, 3.6), x = k.x + Math.cos(a) * d, z = k.z + Math.sin(a) * d, H = pr.range(5, 9);
        if (!offPath(x, z, 1)) continue;
        trees.push({ x, y: hAt(x, z) - 0.2, z, H, levels: k.near && path.nearestXZ(x, z).dist < 40 ? 4 : k.near ? 3 : 2, hero: k.near && path.nearestXZ(x, z).dist < 26 });      // the ones that stand close to the line are built in full
        if (k.near) shadowOf.push([x, z, H * 0.3, H, 1]);
      }
      mark(i0r, i0t, 'the ring koppies');
    }
    await ctx.yield();
    const stackAt = [[SEN.x, SEN.z, 5.2 * SK]];      // every boulder stack beside the route: [x, z, radius of its main boulder]
    // where the pan lies
    const PANC = (() => { const [px, pz, tx, tz] = planAt(PAN[0]); return [px - tz * PAN[1], pz + tx * PAN[1]]; })();
    // where its gemsbok stands (on its near shore, 7.5 m left of the line, 188 m along the plan)
    const PANBULL = (() => { const [px, pz, tx, tz] = planAt(188); return [px + tz * 7.5, 0, pz - tx * 7.5]; })();
    const inPan = (x, z) => { const al = planAL(x, z); return Math.hypot((al[0] - PAN[0]) / 12.5, (al[1] - PAN[1]) / 7.4) < 1; };
    // outliers: a boulder stack with one quiver tree, standing alone on the plain of the early days as a clock hand (the first two
    // are half as large again; the first stands 12.5 m right of the line 198 m in, across it from the rain pan)
    { const os = stream('the outliers'), i0r = rocks.length, i0t = trees.length;
      for (const [s, side, d, big] of [[198, 1, 12.5, 1.5], [300, 1, 16.5, 1.4], [367, 1, 36, 1], [562, 1, 27, 1]]) {
        const p = path.posAtDist(s), t = path.tangentAtDist(s), x = p.x - t.z * side * d, z = p.z + t.x * side * d, y = hAt(x, z), Rk = os.range(2.3, 3.0) * big, H = os.range(6.2, 7.6) * (big > 1 ? 1.2 : 1);
        rocks.push({ x, y: y + Rk * 0.36, z, r: Rk, sy: 0.8, detail: big > 1 ? 6 : 5, facets: 4, tone: 1 },
          { x: x + Rk * 0.95 * side, y: y + Rk * 0.2, z: z + os.range(-1.5, 1.5), r: Rk * 0.62, sy: 0.75, detail: 4, facets: 3, tone: 0.92 },
          { x: x - Rk * 0.35 * side, y: y + Rk * 1.02, z: z + 0.5, r: Rk * 0.52, sy: 0.72, detail: 3, facets: 3, tone: 1.08 });
        stackAt.push([x, z, Rk]);
        const tx = x - t.x * Rk * 1.5 - t.z * side * -Rk * 0.9, tz = z - t.z * Rk * 1.5 + t.x * side * -Rk * 0.9;
        trees.push({ x: tx, y: hAt(tx, tz) - 0.15, z: tz, H, levels: 4, hero: true });
        shadowOf.push([x, z, Rk * 1.1, Rk * 1.9, 0], [tx, tz, H * 0.3, H, 1]);
      }
      mark(i0r, i0t, 'the outliers'); }
    await ctx.yield();
    // the tall stacks: a pile of five boulders crowned with a quiver tree
    const tallStack = (s, side, d, Rk, H, lv, rr, at) => {
      const p = path.posAtDist(s), t = at ? at.t : path.tangentAtDist(s), x = at ? at.x : p.x - t.z * side * d, z = at ? at.z : p.z + t.x * side * d, y = hAt(x, z);
      const tx = x - t.z * side * Rk * 0.12 + t.x * 0.4, tz = z + t.x * side * Rk * 0.12 + t.z * 0.4;
      const dq = d < 20 ? 0 : 1;      // the stacks further from the line are built a level coarser
      rocks.push({ x, y: y + Rk * 0.4, z, r: Rk, sy: 0.82, sx: 1, sz: 1.05, detail: 7 - dq, facets: 4, tone: 1 },
        { x: tx, y: y + Rk * 1.12, z: tz, r: Rk * 0.64, sy: 0.76, detail: 6 - dq, facets: 4, tone: 1.06 },
        { x: x - t.z * side * Rk * 1.05 - t.x * Rk * 0.5, y: y + Rk * 0.22, z: z + t.x * side * Rk * 1.05 - t.z * Rk * 0.5, r: Rk * 0.52, sy: 0.8, detail: 5 - dq, facets: 3, tone: 0.92 },
        { x: x + t.x * Rk * 1.1, y: y + Rk * 0.15, z: z + t.z * Rk * 1.1, r: Rk * 0.4, sy: 0.75, detail: 4 - dq, facets: 3, tone: 1.1 },
        { x: x - t.x * Rk * 1.25 + rr.range(-1, 1), y: y + Rk * 0.1, z: z - t.z * Rk * 1.25, r: Rk * 0.3, sy: 0.8, detail: 3, facets: 3, tone: 1 });
      stackAt.push([x, z, Rk]);
      const ty = y + Rk * 1.12 + Rk * 0.64 * 0.76 * 0.72;
      trees.push({ x: tx, y: ty, z: tz, H, levels: lv, hero: true, lean: 0.04, yaw: rr.range(0, 3) });
      shadowOf.push([x, z, Rk * 1.15, Rk * 1.6, 0], [tx, tz, H * 0.32, ty - y + H, 1]);
      if (casters.length < 10) casters.push([x, y + Rk * 0.8, z, Rk * 1.05]);
    };
    // (three stand along day 3's stretch of the route: 10.8 m left of the line 488 m in, 24 and 12.4 m right of it 531 and 553 m in;
    // and one 396 m in, 10.5 m right of the line, across it from the heuweltjie)
    { const ts = stream('the tall stacks'), i0r = rocks.length, i0t = trees.length;
      for (const [s, side, d, Rk, H, lv] of [[488, -1, 10.8, 4.0, 8.4, 5], [531, 1, 24, 3.3, 8.2, 4], [553, 1, 12.4, 3.8, 9.0, 4], [396, 1, 10.5, 4.0, 9.4, 5]]) tallStack(s, side, d, Rk, H, lv, ts);
      mark(i0r, i0t, 'the tall stacks'); }
    // the gate before the gate: two boulder stacks with short quiver trees on the knolls of the valley floor's far bank, 10.5 m left and
    // 11.5 m right of the line where the climb begins (z 117 and 113), rain daisies and orange lapping their feet; half the height
    // of the tors behind them
    { const kn = stream('the knolls'), tS = { x: 0, z: -1 }, i0r = rocks.length, i0t = trees.length;
      for (const q of [[-10.5, 117, -1, 2.4, 4.8], [11.5, 113, 1, 3.0, 3.6]]) tallStack(0, q[2], 0, q[3], q[4], 4, kn, { x: q[0], z: q[1], t: tS });
      mark(i0r, i0t, 'the knolls'); }
    // a group of four boulders 10.5 m right of the line, 28 m beyond the point of it where the lens is at the brief's last light of
    // day 1 (u 0.12): their long shadows reach across the wet gravel toward the line
    const sD = 0.12 * PL_LEN + 28, DUSK = beside(sD, 10.5);
    { const ds = stream('the dusk boulders'), i0r = rocks.length, [cx, cz, tx, tz] = DUSK;
      for (const [da, dl, r, sy] of [[0, 0, 3.1, 0.8], [3.4, 2.6, 1.9, 0.72], [-3.0, -1.6, 1.5, 0.7], [1.2, -3.6, 1.0, 0.66]]) {
        const x = cx + tx * da - tz * dl, z = cz + tz * da + tx * dl;
        rocks.push({ x, y: hAt(x, z) + r * sy * 0.32, z, r, sy, detail: r > 2.5 ? 6 : r > 1.6 ? 5 : 4, facets: 4, tone: ds.range(0.9, 1.1) }); shadowOf.push([x, z, r * 1.08, r * sy * 1.6, 0]);
      }
      mark(i0r, trees.length, 'the dusk boulders'); }
    await ctx.yield();
    // ---------- what rock keeps off: the washes and the damp hollow (washNear: the bed of either, and pad metres beyond it), the pan,
    // the heuweltjie, the wind pump, the herd's track, the bull's ground (JS twins of the washes in the hero's GLSL) ----------
    const washNear = (x, z, pad) => {
      const al = planAL(x, z), g = sstep(W2G[0], W2G[1], al[0]) * (1 - sstep(W2G[2], W2G[3], al[0])) * sstep(310, 345, Math.hypot(x, z));
      if (g > 0.05 && Math.abs(wash2D(al[0], al[1])) < 8.5 + pad) return true;
      if (holD(al[0], al[1]) < HOL[3] * 0.55 + pad) return true;
      const W = U.uWash.value; return Math.hypot(x * 0.8, z) > 84 && Math.abs(z - (W.x + W.y * Math.sin(x * W.z + W.w))) < 9 + pad;
    };
    const PUMP = (() => { const P0 = path.pointAt(0.5), T0 = path.tangentAt(0.5); return [P0.x + T0.z * 45, P0.z - T0.x * 45]; })();
    const BULLS = [[BULL_S, 9, -2.2, 1.15, 1], [BULL_S + 8, 19.5, -1.0, 0.98, 1], [BULL_S + 11.5, 22.1, 2.5, 0.93, 0]].map((q) => [beside(q[0], q[1]), q]);
    // (the flowers' cover at a ground point by the ground's own bands and noises: the JS twin of the main term of speciesAtW in the
    // hero's GLSL)
    const coverAt = (x, z) => {
      const S = U.uSeed.value, n1 = vnoise(x * 0.013 + S.x, z * 0.013 + S.y), n2 = vnoise(x * 0.037 + S.y * 1.7, z * 0.037 + S.x * 1.7), n3 = vnoise(x * 0.12 + 3.1, z * 0.12 + 3.1), n4 = vnoise(x * 0.31 + 8.7, z * 0.31 + 8.7);
      const e0 = Math.hypot(x * 0.8, z), st = Math.sin((e0 * 0.05 + (n1 - 0.5) * 5.5 + (n2 - 0.5) * 1.5) * 6.2832), pk = 1 - sstep(70, 104, Math.hypot(x * 0.72, z - 138));
      return sstep(0.27, 0.41, n3 * 0.4 + n4 * 0.24 + n1 * 0.3 + st * 0.075 + 0.03 + pk * 0.09);
    };
    // ---------- THE STACKS OF THE PLAIN: one seeded law, from a stream of its own ----------
    // The route from the Sentinel to the foot of Kokerboom Koppie is cut into stretches and one stack stands in each, at a drawn place
    // in its first 45 hundredths. Before the ridge a stretch is 66 m long (shortening to 38 m toward the feet of the koppies);
    // on the plain beyond the ridge, from the foot of its far slope (RIDGE_S) to the bull's ground, every stretch is 45 m. A
    // stack's side is drawn. Three in every four are stacks of the common size (the main boulder 3.2 to 4.4 m in radius by draw, up
    // to half as large again at the foot of a koppie): before the ridge they stand 12 to 25 m off the line by draw, beyond it 10 to
    // 18 m; every fourth (which, by draw) is a great stack, 5.4 to 7.2 m in radius, and great stacks stand back, 30 to 56 m off the
    // line by draw. ONE RULE FOR EVERY BOULDER THE SEEDED LAWS DEAL (these stacks and their foot boulders, the clusters, the
    // scatter; not the named rock above, the Sentinel, the first outlier, the tall stacks, the pair on the knolls and the dusk
    // group, which stands where the design and the first version put it, some of it nearer): no boulder over 1.5 m in
    // radius stands with its near face less than 9 m from the line (FACE; a boulder's flank reaches 1.2 radii from its middle), so a
    // stack drawn nearer stands out to where its main boulder clears that; the brief's 6 to 10 m is for the small ones. The place
    // is refused where a wash or the damp hollow lies, on the pan, the heuweltjie, the pump, the herd's track or the bull's ground,
    // and where another stack or a koppie's boulders already stand; the stack then takes the other side, or stands 6 m further
    // out, or looks again 14 m further along the route. Each stack turns as it is drawn (its own yaw): a main boulder, one on top,
    // three or four round its foot, each built no finer than its distance from the line needs. A quiver tree crowns every stack
    // that stands within 20 m of the line and most of the others (built in full where it stands within 26 m of the line), and up
    // to two stand at their feet, by draw (the butter trees follow below).
    const FACE = 9, faceClear = (x, z, r, small) => lineD(x, z) >= (r > 1.5 ? FACE + r * 1.2 : small + r);
    const RIDGE_S = (() => { const q = planAt(RISE[0] + RISE[1]); return path.nearestXZ(q[0], q[1]).u * PL_LEN; })();
    const nearKop = (x, z) => { let k = 1 - sstep(140, 520, Math.hypot(x * 0.8, z)); for (const q of kops) k = Math.max(k, 1 - sstep(q.foot, q.foot + 160, Math.hypot(x - q.x, z - q.z))); return k; };
    const stackFree = (x, z, Rk) => {
      if (!faceClear(x, z, Rk, 7) || washNear(x, z, Rk * 1.4)) return false;
      if (Math.hypot(x - PANC[0], z - PANC[1]) < 16 + Rk * 1.6 || Math.hypot(x - MOUND.x, z - MOUND.z) < 9 + Rk * 1.6 || Math.hypot(x - PUMP[0], z - PUMP[1]) < 10 + Rk * 1.6) return false;
      if (Math.hypot(x - DUSK[0], z - DUSK[1]) < 12 + Rk * 1.6 || BULLS.some(([c]) => Math.hypot(x - c[0], z - c[1]) < 12 + Rk * 1.6)) return false;
      if (stackAt.some((k) => Math.hypot(x - k[0], z - k[1]) < 14 + Rk + k[2]) || trackPts.some((k) => Math.hypot(x - k[0], z - k[1]) < 7 + Rk * 1.6)) return false;
      return !rocks.some((k) => Math.hypot(x - k.x, z - k.z) < k.r + Rk * 1.5 + 2);
    };
    const lawStacks = [];
    { const ks = stream('the stacks of the plain'), i0r = rocks.length, i0t = trees.length;
      const farOne = ks.int(0, 3);
      for (let i = 0, s0 = 106 + 40; ; i++) {
        path.posAtDist(s0, bP); const beyond = s0 >= RIDGE_S && s0 < BULL_S, nk = nearKop(bP.x, bP.z), cell = beyond ? 45 : 66 - 28 * nk; let s = s0 + 0.45 * cell * ks(); s0 += cell;
        if (s > PL_LEN - 150) break;
        const great = i % 4 === farOne, Rk = great ? ks.range(5.4, 7.2) : ks.range(3.2, 4.4) * (1 + 0.45 * nk * ks()), side = ks.sign();
        const d = great ? ks.range(30, 56) : Math.max(beyond ? 10 + 8 * ks() : 12 + 13 * ks() * ks(), FACE + Rk * 1.2 + 0.2);
        let pl = null;
        for (let k = 0; k < 5 && !pl && s < PL_LEN - 150; k++) {
          for (const [sd, dd] of [[side, d], [-side, d], [side, d + 6], [-side, d + 6]]) { const [x, z] = beside(s, sd * dd); if (stackFree(x, z, Rk)) { pl = [x, z, sd, dd]; break; } }
          if (!pl) s += 14;
        }
        if (pl) {
          const [x, z, sd, dd] = pl, y = hAt(x, z), yaw = ks.range(0, 6.2832), cy = Math.cos(yaw), sn = Math.sin(yaw), dq = dd < 19 ? 0 : dd < 24 ? 1 : dd < 32 ? 2 : 4;
          const at = (a, l) => [x + (cy * a - sn * l) * Rk, z + (sn * a + cy * l) * Rk], b2 = at(0.12, -0.1);
          rocks.push({ x, y: y + Rk * 0.38, z, r: Rk, sy: 0.86, sx: 1, sz: 1.06, detail: 7 - dq, facets: 4, tone: 1 },
            { x: b2[0], y: y + Rk * 1.1, z: b2[1], r: Rk * 0.62, sy: 0.78, detail: Math.max(2, 5 - dq), facets: 4, tone: 1.06 });
          const nb = ks.int(3, 4), a0 = ks.range(0, 6.2832);
          for (let i = 0; i < nb; i++) {
            const k = [0.56, 0.42, 0.3, 0.24][i] * ks.range(0.9, 1.12), a = a0 + i * 6.2832 / nb + ks.range(-0.45, 0.45), rr = (0.62 + k) * ks.range(1.0, 1.16) + i * 0.15 * ks(), f = at(Math.cos(a) * rr, Math.sin(a) * rr);
            if (!faceClear(f[0], f[1], Rk * k, 7.4)) continue;
            rocks.push({ x: f[0], y: hAt(f[0], f[1]) + Rk * k * 0.4, z: f[1], r: Rk * k, sy: ks.range(0.74, 0.84), sx: 1, sz: 1.05, detail: Math.max(1, 4 - i - dq), facets: 3, tone: ks.range(0.9, 1.1) });
          }
          stackAt.push([x, z, Rk]); lawStacks.push({ s, x, z, Rk, d: dd, side: sd });
          shadowOf.push([x, z, Rk * 1.15, Rk * 1.7, 0]);
          const near = dd < 26, ty = y + Rk * 1.1 + Rk * 0.62 * 0.78 * 0.7;
          if (dd < 20 || ks() < 0.85) { const H = ks.range(8, 10.6); trees.push({ x: b2[0], y: ty, z: b2[1], H, levels: dd < 20 ? (Rk > 5 ? 5 : 4) : 3, hero: near, lean: 0.05, yaw: ks.range(0, 3) }); shadowOf.push([b2[0], b2[1], H * 0.32, ty - y + H, 1]); }
          for (let i = 0, nf = ks.int(0, 2); i < nf; i++) {
            const a = ks.range(0, 6.2832), rr = ks.range(1.45, 1.9), f = at(Math.cos(a) * rr, Math.sin(a) * rr), H = ks.range(5, 7.4);
            if (lineD(f[0], f[1]) < 9.5 || rocks.some((k) => Math.hypot(f[0] - k.x, f[1] - k.z) < k.r * 0.95 + 0.6)) continue;
            trees.push({ x: f[0], y: hAt(f[0], f[1]) - 0.15, z: f[1], H, levels: near ? 3 : 2, hero: lineD(f[0], f[1]) < 18, yaw: ks.range(0, 3) }); shadowOf.push([f[0], f[1], H * 0.3, H, 1]);
          }
        }
      }
      mark(i0r, i0t, 'the stacks of the plain'); }
    await ctx.yield();
    // what standing water mirrors (spheres): the rain pan at the dawn of day 2 holds the ring koppie nearest to it and the three
    // boulders that stand largest over it (by radius over distance, within 170 m); the puddles of the arrival hold the four largest
    // boulders that stand within 26 m of the line along its first 240 m
    { let kb = kops[0]; for (const k of kops) if (Math.hypot(k.x - PANC[0], k.z - PANC[1]) < Math.hypot(kb.x - PANC[0], kb.z - PANC[1])) kb = k;
      U.uRefl.value[0].set(kb.ball[0], kb.ball[1], kb.ball[2], kb.ball[3]);
      const sph = (k) => [k.x, k.y, k.z, k.r * 0.95];
      const byPan = rocks.filter((k) => k.r >= 2 && k.r < 20).map((k) => [k.r / Math.max(1, Math.hypot(k.x - PANC[0], k.z - PANC[1])), k]).filter((q) => q[0] > 2 / 170).sort((a, b) => b[0] - a[0]);
      for (let i = 0; i < 3; i++) if (byPan[i]) { const q = sph(byPan[i][1]); U.uRefl.value[1 + i].set(q[0], q[1], q[2], q[3]); }
      const byLine = rocks.filter((k) => k.r >= 1.4 && k.r < 20).map((k) => [k, path.nearestXZ(k.x, k.z)]).filter((q) => q[1].dist < 26 && q[1].u * PL_LEN < 240).sort((a, b) => b[0].r - a[0].r);
      for (let i = 0; i < 4; i++) if (byLine[i]) { const q = sph(byLine[i][0]); U.uRefl.value[4 + i].set(q[0], q[1], q[2], q[3]); } }
    await ctx.yield();
    // ---------- THE STANDING GEMSBOK ----------
    // The brief's three stand first (its beat at u 0.84): the bull grazes 9 m right of the line, 16 m beyond that point of it (18 m
    // from the lens there, between the brief's 22 and 14), his two cows behind him.
    for (const [c, [sd, l, yaw, sc, g]] of BULLS) {
      const dx = c[2] * Math.cos(yaw) - c[3] * Math.sin(yaw), dz = c[3] * Math.cos(yaw) + c[2] * Math.sin(yaw);
      GSPEC.push({ sd, x: c[0], z: c[1], y: hAt(c[0], c[1]), th: Math.atan2(dx, dz), sc, g, pan: false, h: h21(sd, l), yw: (h21(l, sd) - 0.5) * 1.3 });
    }
    // The pan's gemsbok is the one that has always stood there: on the pan's near shore, 7.5 m left of the line and 188 m along the
    // plan (PANBULL), 1.18 times life, in the water's edge (it lies mirrored in the pan); its heading by draw.
    // Every other standing animal is seated by ONE rule from its own stream. The land offers the seats: the heuweltjies within 35 m
    // of the line (the hero's grid of them, its three by the koppie, the world's own mound); the skylines (the crest of the ridge
    // and of the two rollers); the right bank of the second wash; the far rim of the damp hollow; the lee of every boulder stack
    // (the downwind half of a ring round it, a stack's width off). The stream deals the animals. In the order of the route,
    // PARTIES: a seat that offers a point 9 to 14 m from the line (the brief's bull stands at 9) takes a party of two to four on one
    // heading if it lies 90 to 130 m or more (by draw) beyond the last party; the nearest animal stands on that point, where the
    // flowers (or, on day 2, the green) cover the ground best of the points drawn, and the others stand behind it, away from the
    // line, a pace or two apart. The first party stands beyond the pan; the bull's own party is the last of the plain. The seats
    // that lie further out (to 35 m) get the rest: one or two each. On any one sample day no more animals stand along that day's
    // stretch of the route than the brief's herd holds (herdN). None stands nearer than 9 m to the line (the pan's own, 7.5 m), in
    // rock, in a wash or in the bed of the damp hollow, or on the herd's track; none is placed by the clock: each stands on its seat
    // until the lens has passed it.
    {
      const gs = stream('the standing gemsbok'), seats = [];
      const at = (s, l) => { const [px, pz, tx, tz] = planAt(s); return [px - tz * l, pz + tx * l]; };
      const seat = (c, r, n, lee, rim) => { const q = path.nearestXZ(c[0], c[1]); seats.push({ c, r, n, lee: lee || 0, rim: !!rim, sd: q.u * PL_LEN, d: q.dist }); };
      // (a point of a seat by draw: anywhere on a mound, a crest or a bank's disc; in the lee of a stack, on the downwind half of a
      // ring round it, 0.85 to 1.25 times a stack's width and 3 m from its middle; on the hollow's rim, anywhere along it)
      const windB = Math.atan2(WIND.y, WIND.x);
      const spot = (q) => {
        if (q.rim) return at(gs.range(HOL[0], HOL[1]), HOL[2] - HOL[3] * gs.range(0.85, 1.1));
        if (q.lee) { const a = windB + gs.range(-1.45, 1.45), rr = q.lee * gs.range(0.85, 1.25); return [q.c[0] + Math.cos(a) * rr, q.c[1] + Math.sin(a) * rr]; }
        const a = gs.range(0, 6.2832), rr = q.r * Math.sqrt(gs()); return [q.c[0] + Math.cos(a) * rr, q.c[1] + Math.sin(a) * rr];
      };
      // (the hero's grid of heuweltjies, 85 m cells: the JS twin of the cells in speciesAtW; a cell is a seat only where its disc
      // is surely drawn, clear of the koppie's own ground)
      for (let i = -12; i <= 12; i++) for (let j = -8; j <= 14; j++) {
        const hj = h22(i + 61.7, j + 61.7), hp = h21(i + 7.7, j + 7.7), cx = (i + 0.5 + (hj[0] - 0.5) * 0.55) * 85, cz = (j + 0.5 + (hj[1] - 0.5) * 0.55) * 85;
        if (hp < 0.03 || hp > 0.44 || Math.hypot(cx * 0.8, cz) < 190) continue;
        const al = planAL(cx, cz); if (al[0] < 60 || al[0] > 900 || Math.abs(al[1]) > 35) continue;
        seat([cx, cz], (10 + 6 * hj[0]) * 0.5, 2);
      }
      for (const h of U.uHeu.value) if (lineD(h.x, h.y) < 35 && Math.hypot(h.x * 0.72, h.y - 138) > 110) seat([h.x, h.y], h.z * 0.5, 2);
      seat([MOUND.x, MOUND.z], 3.5, 2);
      seat(at(RISE[0], gs.sign() * 13), 3, 2);
      for (let i = 0; i < 2; i++) { const l = gs.sign() * 13; seat(at(SW[i][0] - 0.28 * l - 5 * Math.sin(l * 0.055 + i * 2.1), l), 2.5, 1); }
      seat(at((W2[0] + W2[1]) * 0.5, 11), 3, 2);
      seat(at((HOL[0] + HOL[1]) * 0.5, HOL[2] - HOL[3]), (HOL[1] - HOL[0]) * 0.5, 2, 0, true);
      for (const [x, z, Rk] of stackAt) seat([x, z], (Rk * 2.2 + 3) * 1.25, 0, Rk * 2.2 + 3);
      await ctx.yield();
      seats.sort((a, b) => a.sd - b.sd);
      const clear = (x, z, minD) => {
        if (lineD(x, z) < minD || inPan(x, z) || washNear(x, z, -4)) return false;
        if (rocks.some((k) => Math.hypot(x - k.x, z - k.z) < k.r * 1.05 + 1.3) || trees.some((k) => Math.hypot(x - k.x, z - k.z) < 1.6)) return false;
        return !(GSPEC.some((k) => Math.hypot(x - k.x, z - k.z) < 2.3) || trackPts.some((k) => Math.hypot(x - k[0], z - k[1]) < 6));
      };
      const perDay = [0, 0, 0, 0, 0, 0], dayOf = (sd) => { const uu = sd / PL_LEN; let i = 0; while (i < 5 && uu >= days[i + 1][0]) i++; return i; };
      const put = (x, z, th, sc, g, pan) => {
        const sd = path.nearestXZ(x, z).u * PL_LEN, di = dayOf(sd); if (perDay[di] >= herdN) return false;
        perDay[di]++; GSPEC.push({ sd, x, z, y: hAt(x, z), th, sc, g, pan, h: gs(), yw: (gs() - 0.5) * 1.3 }); return true;
      };
      put(PANBULL[0], PANBULL[2], gs.range(0, 6.2832), 1.18, 0, true);
      // the parties
      let next = GSPEC.find((q) => q.pan).sd + gs.range(90, 130); const END = BULL_S - 60, oP = new THREE.Vector3();
      for (const s of seats) {
        if (s.rim || s.sd < next || s.sd > END || s.d < 9 - s.r || s.d > 14 + s.r) continue;
        let best = null, bc = -1;
        for (let k = 0; k < 12 && bc < 0.6; k++) {
          const [x, z] = spot(s), dl = lineD(x, z);
          if (dl < 9 || dl > 14 || !clear(x, z, 9)) continue;
          const c = coverAt(x, z); if (c > bc) { bc = c; best = [x, z]; }
        }
        if (!best) continue;
        // (straight out from the line at the nearest animal's place, and along the line there)
        path.pointAt(path.nearestXZ(best[0], best[1]).u, oP); const ol = Math.hypot(best[0] - oP.x, best[1] - oP.z) || 1, ox = (best[0] - oP.x) / ol, oz = (best[1] - oP.z) / ol;
        const n = gs.int(2, 4), th0 = gs.range(0, 6.2832), spread = gs.range(2.2, 3.6);
        for (let j = 0; j < n; j++) {
          let x = best[0], z = best[1], ok = j === 0;
          for (let k = 0; k < 6 && !ok; k++) { const out = 1.5 + (j - 1) * 1.4 + 1.5 * gs(), al = (gs() - 0.5) * 2 * spread; x = best[0] + ox * out - oz * al; z = best[1] + oz * out + ox * al; ok = clear(x, z, 9); }
          if (ok) put(x, z, th0 + gs.range(-0.3, 0.3), gs.range(0.97, 1.13), j > 0 && gs() < 0.45 ? 1 : 0, false);
        }
        s.used = true; next = s.sd + gs.range(90, 130);
      }
      await ctx.yield();
      // the rest, on the seats that lie further out (stepped straight out from the line where one would stand in rock or water)
      for (const s of seats) {
        if (s.used || (!s.rim && (s.d <= 14 + s.r || s.d > 35 + s.r))) continue;
        for (let j = 0, n = s.n || gs.int(1, 2); j < n; j++) {
          const th = gs.range(0, 6.2832), sc = gs.range(0.95, 1.13), gz = gs() < 0.42 ? 1 : 0;
          let [x, z] = spot(s);
          path.pointAt(path.nearestXZ(x, z).u, bP); const ol = Math.hypot(x - bP.x, z - bP.z) || 1, ox = (x - bP.x) / ol, oz = (z - bP.z) / ol;
          for (let k = 0; k < 20 && !clear(x, z, 10); k++) { x += ox * 1.2; z += oz * 1.2; }
          if (clear(x, z, 10)) put(x, z, th, sc, gz, false);
        }
      }
      // (kept in the order of the route, the last first, so that those the lens has passed are the tail of the list and are not drawn)
      GSPEC.sort((a, b) => b.sd - a.sd);
      // (the animal that stands in the pan lies mirrored in its water)
      const pb = GSPEC.find((q) => q.pan); if (pb) U.uBull.value.set(pb.x, pb.y, pb.z, pb.th);
    }
    await ctx.yield();
    // ---------- low granite boulders in twos and threes, a cluster about every 30 m from day 3's ground to the valley floor, 10 to 18 m
    // off the line on the left or the right by draw; then the scatter. Neither stands on what is already there: a stack, an
    // animal's place, the herd's track and the open flat it crosses, the pan, the heuweltjie; the clusters keep off the washes and
    // the damp hollow as the stacks do, and every boulder keeps the stacks' rule of the near face (faceClear) ----------
    const keepOff = stackAt.map((k) => [k[0], k[1], k[2] * 2.1]);
    for (const q of GSPEC) keepOff.push([q.x, q.z, 4]);
    for (const q of trackPts) keepOff.push(q);
    keepOff.push([MOUND.x, MOUND.z, 7], [PANC[0], PANC[1], 14], [U.uOrange.value.x, U.uOrange.value.y, 17], [DUSK[0], DUSK[1], 7]);
    { const cs = stream('the clusters'), i0r = rocks.length;
      for (let sC = 404; sC < 880; sC += 30) {
        const s0 = sC + cs.range(-9, 9), side = cs.sign(), dC = 10 + cs.range(0, 8), [cx, cz] = beside(s0, side * dC);
        if (washNear(cx, cz, 2) || keepOff.some((k) => Math.hypot(cx - k[0], cz - k[1]) < k[2] + 3)) continue;
        for (let j = 0, nB = cs.int(2, 3); j < nB; j++) {
          const r = j ? cs.range(0.7, 1.3) : cs.range(1.4, 2.3), a = cs.range(0, 6.28), dd = j ? cs.range(1.5, 3.2) : 0, x = cx + Math.cos(a) * dd, z = cz + Math.sin(a) * dd, sy = cs.range(0.5, 0.78), tone = cs.range(0.85, 1.15);
          if (!faceClear(x, z, r, 7.4)) continue;
          rocks.push({ x, y: hAt(x, z) + r * sy * 0.28, z, r, sy, sx: 1, sz: 1.08, detail: r > 1.6 ? 4 : 3, facets: 4, tone }); shadowOf.push([x, z, r * 1.05, r * sy * 1.5, 0]);
        }
        keepOff.push([cx, cz, 3.5]);
      }
      mark(i0r, trees.length, 'the clusters'); }
    await ctx.yield();
    // boulders streaking past beside the path (the small ones never nearer than 7 m), thicker in the bare first days; nothing solid
    // beside the entry
    { const sc = stream('the scatter'), i0r = rocks.length;
      for (let i = 0, tries = 0; i < 100 && tries < 900; tries++) {
        const s = sc.range(-20, PL_LEN - 300) * (i < 60 ? 0.5 : 1), side = sc.sign(), d = 7.5 + Math.pow(sc(), 1.8) * 70, [x, z] = beside(s, side * d);
        if (s < 30 && d < 18) continue;
        const r = sc.range(0.45, 1.5) * (d > 20 ? 1.5 : 1);
        if (!faceClear(x, z, r, 7) || Math.hypot(x - SEN.x, z - SEN.z) < 10.6 || keepOff.some((k) => Math.hypot(x - k[0], z - k[1]) < k[2] + r)) continue;
        const sy = sc.range(0.55, 0.85);
        rocks.push({ x, y: hAt(x, z) + r * sy * 0.3, z, r, sy, sx: 1, sz: 1.08, detail: d < 13 ? 3 : d < 24 ? 2 : 1, facets: 4, tone: sc.range(0.85, 1.15) }); i++;
        shadowOf.push([x, z, r * 1.05, r * sy * 1.5, 0]);
      }
      mark(i0r, trees.length, 'the scatter'); }
    await ctx.yield();
    // butter trees (Tylecodon): fat yellow-green stems 1.3 to 2 m tall with tufts of winter leaf, one to three among the boulders
    // of every stack, by draw
    { const bs = stream('the butter trees'), i0t = trees.length;
      for (const [cx, cz, cr] of stackAt) for (let i = 0, n = bs.int(1, 3), tries = 0; i < n && tries < 12; tries++) {
        const a = bs.range(0, 6.28), d = cr * bs.range(1.12, 1.7) + 0.6, x = cx + Math.cos(a) * d, z = cz + Math.sin(a) * d;
        if (lineD(x, z) < 8.5 || rocks.some((k) => Math.hypot(x - k.x, z - k.z) < k.r * 0.95 + 0.5)) continue;
        const H = bs.range(1.3, 2.0);
        trees.push({ x, y: hAt(x, z) - 0.05, z, H, levels: lineD(x, z) < 25 ? 2 : 1, butter: true, hero: false, lean: bs.range(0, 0.12) }); i++;
        shadowOf.push([x, z, H * 0.35, H * 0.9, 0]);
      }
      mark(rocks.length, i0t, 'the butter trees'); }
    await ctx.yield();
    // two granite massifs, the largest koppies of the ring: each is dealt as the ring's koppies are, a place along the plan line, a
    // side and a distance off the line, all three by draw from the massifs' own stream within the brief's ring (150 to 600 m from
    // the path), and the place is refused only where another koppie stands (a ring koppie, Kokerboom Koppie or the other massif);
    // it then draws again, six times at most. Their size is set by their height: the topmost boulder stands at most 68 m over the
    // plain (the brief's koppies are 30 to 70 m)
    { const ms = stream('the massifs'), i0r = rocks.length, i0t = trees.length, stood = [];
      for (let m = 0; m < 2; m++) {
        let mx = 0, mz = 0, ok = false;
        for (let k = 0; k < 6 && !ok; k++) {
          const [px, pz, tx, tz] = planAt(ms.range(0, 110 + R * A0)), side = ms.sign(), d = ms.range(150, 600);
          mx = px - tz * side * d; mz = pz + tx * side * d;
          ok = Math.hypot(mx, mz) > 190 && !kops.some((q) => Math.hypot(mx - q.x, mz - q.z) < q.foot + 80) && !stood.some((q) => Math.hypot(mx - q[0], mz - q[1]) < 170);
        }
        if (!ok) continue;
        stood.push([mx, mz]);
        const g0 = hAt(mx, mz), sy0 = ms.range(1.15, 1.3), R0 = 66 / (sy0 * 1.34 + 0.375);
        rocks.push({ x: mx, y: g0 + R0 * sy0 * 0.42, z: mz, r: R0, sy: sy0, detail: 5, facets: 5, tone: ms.range(0.94, 1.04) });
        for (let i = 0; i < 3; i++) { const a = ms.range(0, 6.28), d = R0 * ms.range(0.75, 1.05), r = R0 * ms.range(0.5, 0.72), sy = ms.range(0.85, 1.1), x = mx + Math.cos(a) * d, z = mz + Math.sin(a) * d;
          rocks.push({ x, y: hAt(x, z) + r * sy * 0.36, z, r, sy, detail: 3, facets: 4, tone: ms.range(0.9, 1.08) }); }
        for (let i = 0; i < 3; i++) { const a = ms.range(0, 6.28), r = R0 * ms.range(0.2, 0.3);
          rocks.push({ x: mx + Math.cos(a) * R0 * 0.3, y: g0 + R0 * sy0 * 1.34 + r * 0.45, z: mz + Math.sin(a) * R0 * 0.3, r, sy: 0.8, detail: 2, facets: 4, tone: 1.05 }); }
        for (let i = 0; i < 5; i++) { const a = ms.range(0, 6.28), d = R0 * ms.range(1.2, 2.3), x = mx + Math.cos(a) * d, z = mz + Math.sin(a) * d, r = ms.range(4, 9);
          rocks.push({ x, y: hAt(x, z) + r * 0.3, z, r, sy: ms.range(0.6, 0.9), detail: 1, facets: 4, tone: ms.range(0.86, 1.1) }); }
        { const a = ms.range(0, 6.28), d = R0 * ms.range(1.2, 2.3), x = mx + Math.cos(a) * d, z = mz + Math.sin(a) * d; trees.push({ x, y: hAt(x, z) - 0.2, z, H: ms.range(7, 9), levels: 2, hero: false }); }
      }
      mark(i0r, i0t, 'the massifs'); }
    await ctx.yield();
    // one rule along the whole route for the quiver trees that stand on the ground: no trunk nearer than 9 m to the line of flight,
    // measured against the route at every metre of it. A tree that stands nearer is stepped straight out from the line to 9.5 m (its
    // shadow goes with it); the trees that crown the boulder stacks stay where they are
    { const NR = Math.ceil(PL_LEN) + 1, rx = new Float32Array(NR), rz = new Float32Array(NR), rv = new THREE.Vector3();
      for (let i = 0; i < NR; i++) { path.posAtDist(Math.min(i, PL_LEN), rv); rx[i] = rv.x; rz[i] = rv.z; }
      await ctx.yield();
      for (const tr of trees) {
        if (tr.butter || tr.y > hAt(tr.x, tr.z) + 0.6) continue;
        let best = 1e9, bi = 0; for (let i = 0; i < NR; i++) { const dx = tr.x - rx[i], dz = tr.z - rz[i], d = dx * dx + dz * dz; if (d < best) { best = d; bi = i; } }
        best = Math.sqrt(best); if (best >= 9) continue;
        let ox = tr.x - rx[bi], oz = tr.z - rz[bi]; const ol = Math.hypot(ox, oz); if (ol < 1e-3) { const j = Math.min(bi + 1, NR - 1), k = Math.max(bi - 1, 0); ox = -(rz[j] - rz[k]); oz = rx[j] - rx[k]; }
        const on = Math.hypot(ox, oz) || 1, nx = rx[bi] + ox / on * 9.5, nz = rz[bi] + oz / on * 9.5;
        const sw = shadowOf.find((q) => q[4] === 1 && q[0] === tr.x && q[1] === tr.z); if (sw) { sw[0] = nx; sw[1] = nz; }
        tr.x = nx; tr.z = nz; tr.y = hAt(nx, nz) - 0.15;
      } }
    await ctx.yield();
    // WHAT IS DRAWN, by one rule of place: a rock or a tree is left out once the lens has flown 30 m, and half its own distance
    // off the line, beyond the point of the route nearest to it (it then lies well behind the lens, on whatever side). The
    // things are gathered into meshes by that distance, GB m of route to a mesh, and a mesh goes when its last thing has gone
    // (see update); what stands round Kokerboom Koppie and beyond it is always drawn.
    const GB = 55, NG = Math.ceil((PL_LEN - 160) / GB) + 1;
    { const grpOf = (o) => { const q = path.nearestXZ(o.x, o.z), sd = q.u * PL_LEN; o.g = sd > PL_LEN - 160 ? NG - 1 : Math.min(NG - 1, Math.floor((sd + 30 + 0.5 * q.dist) / GB)); };
      for (let i = 0; i < rocks.length; i++) { grpOf(rocks[i]); if ((i & 63) === 63) await ctx.yield(); }
      for (let i = 0; i < trees.length; i++) { grpOf(trees[i]); if ((i & 63) === 63) await ctx.yield(); } }
    await ctx.yield();
    const props = await hero.makeProps(rocks, trees);
    scene.add(props);
    const PG = props.userData.groups;
    const senNest = props.userData.info.nests[0] || new THREE.Vector3(SEN.x, SEN.y + 9, SEN.z);
    casters.slice(0, 10).forEach((c, i) => U.uCast.value[i].set(c[0], c[1], c[2], c[3]));
    const cast9keep = U.uCast.value[9].clone();
    await ctx.yield();

    // ---------- bossies: 0.4 m grey-green shrubs shivering in a time-lapse wind ----------
    const PROP_VERT = /* glsl */`
attribute vec3 color; attribute float aT; attribute vec4 iPos; attribute vec3 iRnd;
varying vec3 vP, vN, vC; varying float vT;
void main(){
  float c = cos(iRnd.x * 6.283), s = sin(iRnd.x * 6.283);
  vec3 q = vec3(position.x * c - position.z * s, position.y * (.7 + .5 * iRnd.y), position.x * s + position.z * c) * iPos.w;
  float ph = iRnd.x * 40. + position.x * 5.;
  q.xz += aT * aT * iPos.w * .16 * vec2(sin(uTime * 9. + ph), cos(uTime * 7.3 + ph * 1.3));
  vec3 P = iPos.xyz + q;
  vP = P; vN = vec3(normal.x * c - normal.z * s, normal.y, normal.x * s + normal.z * c); vT = aT;
  vC = color * mix(vec3(.82, .92, .95), vec3(1.2, 1.0, .74), iRnd.z * iRnd.z) * (.75 + .4 * iRnd.y);
  vec4 mvPosition = modelViewMatrix * vec4(P, 1.);
  gl_Position = projectionMatrix * mvPosition;
#include <fog_vertex>
}`;
    const PROP_FRAG = /* glsl */`
varying vec3 vP, vN, vC; varying float vT;
void main(){
  vec3 N = normalize(vN + vec3(0., 1e-4, 0.));
  vec3 alb = vC * mix(.22, 1.05, vT) * (.7 + .6 * vn(vP.xz * 23. + vP.y * 17.)) * (.55 + .9 * vn(vP.xz * 7.3 + vP.y * 9. + 4.));
  vec3 col = shade(alb, mix(N, vec3(0., 1., 0.), .35), vP, .6);
  gl_FragColor = vec4(col, 1.);
#include <fog_fragment>
}`;
    // a bossie is a twiggy shrub, not a mound: a low dome whose skirt is cut into ragged gaps in the fragment shader, with nine pale
    // sprigs standing out of it (30 triangles); one in six is dead and grey. They are kept in the order of the route, in
    // meshes of 100 m of it each: a bossie is drawn from 260 m ahead of the lens along the route until it lies 30 m behind it
    const BOSS_VERT = PROP_VERT.replace('  vec4 mvPosition = modelViewMatrix * vec4(P, 1.);', '  vC = mix(vC, vec3(dot(vC, vec3(.45))) * vec3(1.3, 1.12, .95) + .015, step(.84, fract(iRnd.x * 7.7)));\n  vec4 mvPosition = modelViewMatrix * vec4(P, 1.);');
    const BOSS_FRAG = /* glsl */`
varying vec3 vP, vN, vC; varying float vT;
void main(){
  vec3 N = normalize(vN + vec3(0., 1e-4, 0.));
  float fwp = length(fwidth(vP.xz)) + abs(fwidth(vP.y));
  float nearK = 1. - smoothstep(.012, .06, fwp);
  float tw = vn(vP.xz * 19. + vP.y * 14.) * .6 + vn(vP.zx * 43. + vP.y * 29. + 3.) * .4;
  if (tw < .5 * nearK * (1. - smoothstep(.4, .95, vT))) discard;
  vec3 alb = vC * mix(.2, 1.08, min(vT, 1.)) * (.5 + 1. * smoothstep(.3, .78, tw)) * (.7 + .5 * vn(vP.xz * 7.3 + vP.y * 9. + 4.));
  vec3 col = shade(alb, mix(N, vec3(0., 1., 0.), .35), vP, .6);
  gl_FragColor = vec4(col, 1.);
#include <fog_fragment>
}`;
    const boss = [], BOSS_W = 100, BOSS_AHEAD = 260;
    {
      const br = rng.fork('bossies'), sg = ctx.core.makeRng(((ctx.seed | 0) ^ 0x6b05e1) >>> 0), pos = [], nor = [], col = [], aT = [], idx = [], gc = hero.palette.green;
      const ringV = (n, rad, yy, off) => { for (let j = 0; j < n; j++) { const a = ((j + off) / n) * 6.2832, rr = rad * sg.range(0.72, 1.25), y2 = yy * sg.range(0.75, 1.3), k = sg.range(0.7, 1.1);
        pos.push(Math.cos(a) * rr, y2, Math.sin(a) * rr); nor.push(Math.cos(a) * 0.75, 0.66, Math.sin(a) * 0.75); col.push(gc.r * 0.62 * k, gc.g * 0.6 * k, gc.b * 0.66 * k); aT.push(Math.min(1, y2 / 0.6)); } };
      pos.push(0.06, 0.62, -0.04); nor.push(0, 1, 0); col.push(gc.r * 0.66, gc.g * 0.64, gc.b * 0.68); aT.push(1);
      ringV(7, 0.6, 0.42, 0); ringV(7, 1.0, 0.03, 0.5);
      for (let j = 0; j < 7; j++) { const j2 = (j + 1) % 7; idx.push(0, 1 + j2, 1 + j, 1 + j, 1 + j2, 8 + j, 1 + j2, 8 + j2, 8 + j); }
      for (let i = 0; i < 9; i++) {
        const a = (i / 9) * 6.2832 + sg.range(-0.3, 0.3), r0 = sg.range(0.12, 0.62), y0 = 0.5 - r0 * 0.3, len = sg.range(0.4, 0.78), out = sg.range(0.1, 0.6), w = sg.range(0.06, 0.1), b = pos.length / 3;
        const ca = Math.cos(a), sa = Math.sin(a), k = sg.range(0.9, 1.25);
        pos.push(ca * r0 - sa * w, y0, sa * r0 + ca * w, ca * r0 + sa * w, y0, sa * r0 - ca * w, ca * (r0 + out * len), y0 + len * (1 - out * 0.45), sa * (r0 + out * len));
        for (let j = 0; j < 3; j++) { nor.push(ca * 0.5, 0.8, sa * 0.5); const kk = j === 2 ? 1.25 * k : 0.7 * k; col.push(gc.r * 0.7 * kk + (j === 2 ? 0.03 : 0), gc.g * 0.68 * kk + (j === 2 ? 0.03 : 0), gc.b * 0.7 * kk + (j === 2 ? 0.02 : 0)); aT.push(j === 2 ? 1.3 : 0.75); }
        idx.push(b, b + 1, b + 2);
      }
      // (the last 420 are extra shrubs close to the line through the bare first days and nights, 110 to 420 m along it: with their
      // clock-hand shadows they are the near detail of the gravel flats until the seedlings take over)
      const N0 = Math.round(1250 * detail), N = N0 + Math.round(420 * detail), list = [], br2 = ctx.core.makeRng(((ctx.seed | 0) ^ 0x39b7c1) >>> 0), solid = rocks.filter((k) => k.r > 1);
      for (let tries = 0; list.length < N && tries < N * 4; tries++) {
        const more = list.length >= N0, bq = more ? br2 : br;
        const s = more ? bq.range(110, 420) : bq.range(-40, PL_LEN - 150), p = path.posAtDist(s), t = path.tangentAtDist(s), side = bq.sign(), d = more ? 4 + Math.pow(bq(), 1.3) * 24 : 3.3 + Math.pow(bq(), 1.7) * 75;
        const x = p.x - t.z * side * d, z = p.z + t.x * side * d;
        if (Math.hypot(x * 0.8, z) < 96 || Math.hypot(x - SEN.x, z - SEN.z) < 8) continue;
        if (inPan(x, z)) continue;
        // (none in a boulder, none where a gemsbok stands)
        let inRock = false; for (const k of solid) if (Math.abs(x - k.x) < k.r && Math.hypot(x - k.x, z - k.z) < k.r * 0.98) { inRock = true; break; }
        if (inRock || GSPEC.some((k) => Math.hypot(x - k.x, z - k.z) < 1.5)) continue;
        const sc = bq.range(0.3, 0.58) * (d < 6 ? 0.85 : 1) * (d > 30 ? 1.5 : 1), ry = bq();
        list.push([s, x, hAt(x, z) - 0.03, z, sc, bq(), ry, bq()]);
        if (d < 42 && shadowOf.length < (more ? 2100 : 1700)) shadowOf.push([x, z, sc * 0.8, sc * 0.62 * (0.8 + 0.5 * ry) * 1.3, 0]);
        if (list.length % 200 === 199) await ctx.yield();
      }
      await ctx.yield();
      list.sort((a, b) => b[0] - a[0]);
      // (one mesh to every BOSS_W m of route, all of one material: a mesh is drawn while any of its shrubs lies between 30 m behind
      // the lens and BOSS_AHEAD m ahead of it along the route; that far off a shrub 0.6 m tall subtends an eighth of a degree and the
      // ground's own painted mats stand for it)
      const base = new THREE.BufferGeometry();
      base.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); base.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
      base.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); base.setAttribute('aT', new THREE.Float32BufferAttribute(aT, 1)); base.setIndex(idx);
      const mat = hero.makeMat(U, BOSS_VERT, BOSS_FRAG, { side: THREE.DoubleSide });
      await ctx.yield();
      for (let i0 = 0; i0 < list.length;) {
        const c = Math.floor((list[i0][0] + 40) / BOSS_W); let i1 = i0; while (i1 < list.length && Math.floor((list[i1][0] + 40) / BOSS_W) === c) i1++;
        const n = i1 - i0, iPos = new Float32Array(n * 4), iRnd = new Float32Array(n * 3), sA = new Float32Array(n);
        for (let i = 0; i < n; i++) { const q = list[i0 + i]; sA[i] = q[0]; iPos.set([q[1], q[2], q[3], q[4]], i * 4); iRnd.set([q[5], q[6], q[7]], i * 3); }
        const g = new THREE.InstancedBufferGeometry();
        for (const k of ['position', 'normal', 'color', 'aT']) g.setAttribute(k, base.attributes[k]); g.setIndex(base.index);
        g.setAttribute('iPos', new THREE.InstancedBufferAttribute(iPos, 4)); g.setAttribute('iRnd', new THREE.InstancedBufferAttribute(iRnd, 3)); g.instanceCount = n;
        const m = new THREE.Mesh(g, mat); m.frustumCulled = false; scene.add(m);
        boss.push({ g, m, sA, n }); i0 = i1;
        await ctx.yield();
      }
    }
    await ctx.yield();

    // ---------- THE NEAR ROCK OF THE PLAIN: one rule of the place, from a stream of its own, after all that is dealt above ----------
    // Granite country: the plain between the koppies is not bare of rock, and Kokerboom Koppie sheds its rock into the plain.
    // The law of the stacks of the plain gives the plain one stack to a stretch, on a drawn side and often well off the line,
    // and none where the hollow and the washes lie: the line then runs long without rock or tree near it. This law gives the
    // plain what it lacks. It is a law
    // of the ground, in metres along the line and to its side: it reads the line, the land and what stands on it, and nothing
    // else, and it moves nothing: every thing above stands where it stood, and these stand on free ground.
    // NEAR ROCK is a stack crowned with a quiver tree whose rock comes within NR_CLOSE m of the line (the near flank of the
    // nearest boulder that lies within 2.3 of its main boulder's radii of its middle). The law walks the line that the law
    // of the stacks of the plain walks, from NR_WALK[0] (where that law's first stretch begins, 40 m beyond the Sentinel's
    // 106 m) to NR_WALK[1] (that law offers no stack a place beyond it), in two parts that meet at the far foot of the ridge
    // (RIDGE_S). A RUN is a length of one part without near rock: it begins where the part begins or at a near rock, and it
    // ends at the next near rock of that part or where the part ends (the stacks above first, then these as they come).
    // THE LONGEST RUN that may begin at a metre of the line is NR_EVERY[0] m before RIDGE_S and NR_EVERY[1] m from it on,
    // each less by the share kopAt of what it has over NR_EVERY[2] m. kopAt is the Koppie's nearness at that metre of the
    // line: Kokerboom Koppie's own term of the measure nearKop at that point of the line, 0 where the point lies 520 m and
    // more from the Koppie's middle and 1 within 140 m of it (the distance as nearKop counts it, x at eight tenths). So
    // the longest run shortens toward the Koppie, to NR_EVERY[2] m where kopAt is 1. NR_EVERY[0] and NR_EVERY[1] are the
    // lengths the law of the stacks of the plain gives a stretch before the ridge where no koppie is near, and on the plain
    // beyond the ridge.
    // A run longer than the longest run that may begin at its beginning is offered a stack. Five draws make the offer, all
    // of them before a place is tried: whether it is a GREAT stack (with a chance of kopAt at the run's beginning) or one of
    // the common size; the share of its size's range at which its main boulder's radius lies (NR_GREAT_R for a great
    // stack: the radii of the great stacks above; NR_R for a common one: the smaller of the common ones); its side; its
    // main boulder's near flank's distance from the line, from NR_TRACK to NR_CLOSE m; and its place in the run, from
    // NR_IN[0] to NR_IN[1] of the longest run beyond the run's beginning, and no nearer the end of the run than NR_IN[0]
    // of the longest run. The stack stands at that place on its drawn side, or else on the other; where neither is free,
    // at the first free of the places every NR_STEP m further on (each on the drawn side, or else on the other), no nearer
    // the end of the run than NR_IN[0] of the longest run; and where none of those is free, at the first free of the places
    // every NR_STEP m back from the drawn place, no nearer the beginning of the run than NR_IN[0] of the longest run. A
    // great stack that finds none of these places free is offered again as the common stack of the same draws (the same
    // share, of NR_R; the same side, distance of the near flank and place), at the same places in the same order. Where
    // that finds none free either, or a common stack finds none, the run stays as it is. So no run longer than the longest
    // that may begin at its beginning is left without near rock where one of the places this law tries is free. The runs
    // are counted between the near rocks as they stand, not by that law's stretches: so this law deals where that law left a
    // stretch without near rock (a great stack standing back, a stack without a tree, a refusal), and also between two near
    // rocks of that law that stand further apart than the longest run that may begin at the first of them (that law sets
    // each stack in the first 45 hundredths of its stretch, so on the plain beyond the ridge, where its stretches are 45 m,
    // two neighbours that stand where they were first drawn are 24.75 to 65.25 m apart; where a place was refused
    // that law looks again 14 m further along, which sets the stack further from the one behind it and nearer the one ahead).
    // A stack stands NR_IN[0] of the longest run that may begin at its run's beginning, or more, along the line from both
    // ends of its run (15 m where that longest run is NR_EVERY[2], 33 m where it is NR_EVERY[0]), where the near rock that
    // ends it may stand on the other side.
    // (A stack that is no near rock, one without a crowning tree or one standing back, ends no run: from it a stack of
    // these keeps only the distance that stacks keep from one another.)
    // HOW EXACT THESE LENGTHS ARE: a near rock's metre along the line is that of the line's sample nearest to it
    // (path.nearestXZ), and a stack of these is offered at an exact metre (a run that begins at one begins at that metre, or
    // at its own sample's if that is further on). So a longest run between two near rocks is counted between their samples
    // and holds to within one spacing of those samples (a run up to a spacing longer than it can be left, and one up to a
    // spacing shorter can be given a stack), and the keep-off of NR_IN[0] holds to within half a spacing.
    // FREE GROUND (nearFree for the stack, the tests of dealStack for what stands round it): no flank of a boulder of these
    // stands within NR_TRACK m of the line and no tree of these is rooted within it (the middle of its foot: its trunk's own
    // thickness and its crown may reach nearer) (the two-track and the tortoise's way swing no further from it than that; it
    // is more than FACE, so the rule of the near face holds); a stack stands off the bed and the banks' slopes of the washes
    // and off the hollow's bed with the ostriches' run in it (washNear: the main boulder with its own flank for a pad, a foot
    // boulder or a tree by its middle; a wash runs past rock on its bank, it does not remove it); its main boulder stands
    // off the pan, the heuweltjie, the pump, the dusk group, the bull's ground, the herd's track and the middle of the open
    // flat it crosses (its middle each one's measure and 1.6 of its radii from it: 16 m from the pan's middle, 9 from the
    // heuweltjie's, 10 from the pump, 12 from the dusk group and from each bull's place, 7 from each of the points kept
    // of the herd's track (one to every 4 m of it), 17 from the flat's centre: the flat counted as the 17 m about its
    // centre, as the clusters above count it; the
    // flat is drawn wider than that, and a stack may stand on its outer part. What stands round a stack is not asked
    // about these places: a foot boulder's flank reaches to 2.2 of the main boulder's radii from the stack's middle, so a
    // boulder or a tree at a stack's foot may stand on the outer skirt of the heuweltjie, and nearer the herd's track
    // than the main boulder's measure); as far from
    // every other stack as the stacks above keep from one another, as far from every boulder that FACE rules as they keep,
    // and clear of every tree and standing animal that is there (a small boulder may lie at its foot, clear of its main
    // boulder's flank); and no boulder of these, the main one or one at its foot, is set down on a shrub that stands (none
    // within 0.98 of the boulder's radius of its middle: the measure by which the shrubs' own law keeps out of rock).
    // The boulders that standing water mirrors are chosen above, from those dealt before that point. The boulders of these
    // are dealt after that point and are none of what the pan and the puddles of the arrival hold, also where one of them
    // stands within 26 m of the line along its first 240 m, or larger over the pan (by radius over distance) than a
    // boulder the pan holds.
    // A boulder or a tree that is refused takes no draw beyond those of the size and place it was offered: a boulder's squash
    // and tone and a tree's height, turn and lean are drawn only where it stands (so a quiver tree at the foot and a butter
    // tree are asked for free ground with the widest crown their laws can draw, NR_FOOT_H and NR_BUTTER_H).
    // Each stack turns as it is drawn (its own yaw); its main boulder, the boulder on top (its size and seat by draw, inside
    // the main boulder's flank), the boulders round its foot and their number, the tree's height, a quiver tree at its foot
    // or none and the butter trees among its boulders are all by draw; the sizes of the boulders on and round a stack, and
    // how far they and the trees round it stand from its middle, go by its main boulder's radius, a great stack's as a
    // common one's (the heights of the trees round it do not). The tree that crowns a great stack has its height from
    // NR_GREAT_H (the upper half of the 8 to 10.6 m the law above draws for a crowning tree) and the five levels that law
    // gives the tree on a stack over 5 m in radius whose middle stands within 20 m of the line (here at any distance: a
    // great stack's middle stands 15.98 to 22.64 m off the line). Each boulder is built as the stacks above build theirs
    // at their finest step (a common stack's middle stands at most 18.68 m off the line, nearer than the first of those
    // steps, 19 m; a great stack is built at that step wherever it stands), and of a great stack the boulder on top is
    // built NR_GREAT_FINE[0] step finer and the boulders round its foot NR_GREAT_FINE[1] steps finer than a common
    // stack's, for their size (a great stack's main boulder is 1.38 to 2.25 times a common one's in radius, 5.4 / 3.9 to
    // 7.2 / 3.2, and the sizes of its other boulders go by it); each stack throws one
    // shadow, from its main boulder, and each of its trees its own, by the one shadow rule (shadowOf), as the stacks above
    // do. A boulder on the ground is set down by its own shape on the lowest ground beneath it (seat: see makeProps in the
    // hero), and the boulder on top and the tree that crowns the stack go with the main boulder (on). No trunk is dealt
    // inside the crown of a tree that stands, the trees above or these, nor with one of their trunks inside its own
    // (treeFree; the tree that crowns a stack stands on its main boulder, inside the ground that nearFree keeps clear of
    // every tree).
    const NR_R = [3.2, 3.9], NR_GREAT_R = [5.4, 7.2], NR_WALK = [106 + 40, PL_LEN - 150], NR_EVERY = [66, 45, 30], NR_IN = [0.5, 1], NR_STEP = 5, NR_CLOSE = 14, NR_TRACK = 9.5;
    const NR_GREAT_H = [9.3, 10.6], NR_GREAT_FINE = [1, 2], NR_FOOT_H = [5, 7.4], NR_BUTTER_H = [1.3, 2.0];
    const nearStacks = [], nearRocks = [], nearTrees = [];
    {
      const ns = stream('the near rock'), ST = 'the near rock', eQ = new THREE.Vector3();
      // (metres from the line itself, not from its nearest sample: the line 4 m either way of that sample, at every half metre)
      const offLine = (x, z) => { const s0 = path.nearestXZ(x, z).u * PL_LEN; let m = 1e9; for (let s = s0 - 4; s <= s0 + 4; s += 0.5) { path.posAtDist(s, eQ); m = Math.min(m, Math.hypot(x - eQ.x, z - eQ.z)); } return m; };
      // the shrubs that stand (from their meshes) and the quiver trees
      const shrubs = [], quiver = trees.filter((t) => !t.butter);
      for (const b of boss) { const a = b.g.attributes.iPos.array; for (let i = 0; i < b.n; i++) shrubs.push([a[i * 4], a[i * 4 + 2]]); }
      // a boulder's flank: how far its rock reaches from its middle (1.2 radii, as the rule of the near face counts it)
      const flank = (r) => r * 1.2;
      // the stacks that stand crowned with a quiver tree (one rooted on their rock): [x, z, metres along the line, and how near the
      // line the nearest flank comes of the boulders within 2.3 of their main boulder's radii of their middle]
      const stood = [];
      for (const [x, z, Rk] of stackAt) if (quiver.some((t) => Math.hypot(t.x - x, t.z - z) < Rk && t.y > hAt(x, z) + Rk)) {
        let m = 1e9; for (const k of rocks) if (Math.hypot(k.x - x, k.z - z) < Rk * 2.3) m = Math.min(m, offLine(k.x, k.z) - flank(k.r));
        stood.push([x, z, path.nearestXZ(x, z).u * PL_LEN, m]);
      }
      await ctx.yield();
      // a tree's crown: how far it reaches from its trunk (as the shadow rule counts the crown of a crowning quiver tree and of
      // a butter tree); and whether a trunk may stand at (x, z) with a crown of its own reach R
      const crownOf = (t) => t.H * (t.butter ? 0.35 : 0.32);
      const treeFree = (x, z, R) => !trees.some((k) => Math.hypot(x - k.x, z - k.z) < Math.max(R, crownOf(k))) && !nearTrees.some((k) => Math.hypot(x - k.x, z - k.z) < Math.max(R, crownOf(k)));
      const inRock = (x, z, r) => trees.some((k) => Math.hypot(x - k.x, z - k.z) < r + 0.8) || nearTrees.some((k) => Math.hypot(x - k.x, z - k.z) < r + 0.8) || shrubs.some((k) => Math.hypot(x - k[0], z - k[1]) < r * 0.98)
        || rocks.some((k) => Math.hypot(x - k.x, z - k.z) < (k.r + r) * 0.8);
      // (Rk: the main boulder's radius)
      const nearFree = (x, z, Rk) => {
        if (offLine(x, z) < NR_TRACK + flank(Rk) || washNear(x, z, flank(Rk))) return false;
        if (Math.hypot(x - PANC[0], z - PANC[1]) < 16 + Rk * 1.6 || Math.hypot(x - MOUND.x, z - MOUND.z) < 9 + Rk * 1.6 || Math.hypot(x - PUMP[0], z - PUMP[1]) < 10 + Rk * 1.6) return false;
        if (Math.hypot(x - DUSK[0], z - DUSK[1]) < 12 + Rk * 1.6 || BULLS.some(([c]) => Math.hypot(x - c[0], z - c[1]) < 12 + Rk * 1.6)) return false;
        if (shrubs.some((k) => Math.hypot(x - k[0], z - k[1]) < Rk * 0.98)) return false;
        if (trackPts.some((k) => Math.hypot(x - k[0], z - k[1]) < 7 + Rk * 1.6) || Math.hypot(x - U.uOrange.value.x, z - U.uOrange.value.y) < 17 + Rk * 1.6) return false;
        if (stackAt.some((k) => Math.hypot(x - k[0], z - k[1]) < 14 + Rk + k[2]) || nearStacks.some((k) => Math.hypot(x - k.x, z - k.z) < 14 + Rk + k.Rk)) return false;
        if (rocks.some((k) => Math.hypot(x - k.x, z - k.z) < k.r + (k.r > 1.5 ? Rk * 1.5 + 2 : Rk * 1.2 + 0.5)) || GSPEC.some((k) => Math.hypot(x - k.x, z - k.z) < 5 + Rk * 1.6)) return false;
        return !trees.some((k) => Math.hypot(x - k.x, z - k.z) < Rk * 1.3 + 1.5) && !nearTrees.some((k) => Math.hypot(x - k.x, z - k.z) < Rk * 1.3 + 1.5);
      };
      // the lowest ground beneath a boulder: at its middle and round it, at its flank and at half of that
      const lowAt = (x, z, r) => { let m = hAt(x, z); for (let a = 0; a < 6.28; a += 0.5236) { const c = Math.cos(a) * flank(r), s = Math.sin(a) * flank(r); m = Math.min(m, hAt(x + c, z + s), hAt(x + c * 0.5, z + s * 0.5)); } return m; };
      // a stack at (x, z), its middle dd m off the line, a great one or not: its boulders, its trees and their shadows
      const dealStack = (x, z, dd, Rk, great) => {
        const q = path.nearestXZ(x, z), sK = q.u * PL_LEN, y = lowAt(x, z, Rk), yaw = ns.range(0, 6.2832), cy = Math.cos(yaw), sn = Math.sin(yaw), dq = great || dd < 19 ? 0 : dd < 24 ? 1 : dd < 32 ? 2 : 4, up = great ? NR_GREAT_FINE : [0, 0];
        const g = sK > PL_LEN - 160 ? NG - 1 : Math.min(NG - 1, Math.floor((sK + 30 + 0.5 * q.dist) / GB));
        const at = (a, l) => [x + (cy * a - sn * l) * Rk, z + (sn * a + cy * l) * Rk], kT = ns.range(0.54, 0.68), b2 = at(ns.range(-0.16, 0.16), ns.range(-0.16, 0.16)), syM = ns.range(0.8, 0.9);
        const main = { x, y: y + Rk * 0.38, z, r: Rk, sy: syM, sx: 1, sz: 1.06, detail: 7 - dq, facets: 4, tone: 1, st: ST, g, seat: y };
        nearRocks.push(main, { x: b2[0], y: y + Rk * (0.24 + syM), z: b2[1], r: Rk * kT, sy: 0.78, detail: Math.max(2, 5 + up[0] - dq), facets: 4, tone: 1.06, st: ST, g, on: main });
        const nb = ns.int(3, 4), a0 = ns.range(0, 6.2832);
        for (let i = 0; i < nb; i++) {
          const k = [0.56, 0.42, 0.3, 0.24][i] * ns.range(0.9, 1.12), a = a0 + i * 6.2832 / nb + ns.range(-0.45, 0.45), rr = (0.62 + k) * ns.range(1.0, 1.16) + i * 0.15 * ns(), f = at(Math.cos(a) * rr, Math.sin(a) * rr), r = Rk * k;
          if (offLine(f[0], f[1]) < NR_TRACK + flank(r) || washNear(f[0], f[1], 0) || inRock(f[0], f[1], r)) continue;
          const low = lowAt(f[0], f[1], r);
          nearRocks.push({ x: f[0], y: low + r * 0.4, z: f[1], r, sy: ns.range(0.74, 0.84), sx: 1, sz: 1.05, detail: Math.max(1, 4 + up[1] - i - dq), facets: 3, tone: ns.range(0.9, 1.1), st: ST, g, seat: low });
        }
        nearStacks.push({ s: sK, x, z, Rk, d: dd }); stood.push([x, z, sK, dd - flank(Rk)]);
        shadowOf.push([x, z, Rk * 1.15, Rk * 1.7, 0]);
        const ty = y + Rk * (0.24 + syM) + Rk * kT * 0.78 * 0.7, H = great ? ns.range(NR_GREAT_H[0], NR_GREAT_H[1]) : ns.range(7.6, 10.6);
        nearTrees.push({ x: b2[0], y: ty, z: b2[1], H, levels: great ? 5 : dd < 20 ? 4 : 3, hero: dd < 26, lean: 0.05, yaw: ns.range(0, 3), st: ST, g, on: main }); shadowOf.push([b2[0], b2[1], H * 0.32, ty - y + H, 1]);
        const solid = (fx, fz) => rocks.some((k) => Math.hypot(fx - k.x, fz - k.z) < k.r * 0.95 + 0.6) || nearRocks.some((k) => Math.hypot(fx - k.x, fz - k.z) < k.r * 0.95 + 0.6);
        // a quiver tree at its foot, or none
        if (ns() < 0.5) {
          const a = ns.range(0, 6.2832), rr = ns.range(1.45, 1.9), f = at(Math.cos(a) * rr, Math.sin(a) * rr);
          if (offLine(f[0], f[1]) >= NR_TRACK && !solid(f[0], f[1]) && !washNear(f[0], f[1], 0) && treeFree(f[0], f[1], NR_FOOT_H[1] * 0.3)) { const Hf = ns.range(NR_FOOT_H[0], NR_FOOT_H[1]); nearTrees.push({ x: f[0], y: hAt(f[0], f[1]) - 0.15, z: f[1], H: Hf, levels: 3, hero: offLine(f[0], f[1]) < 18, yaw: ns.range(0, 3), st: ST, g }); shadowOf.push([f[0], f[1], Hf * 0.3, Hf, 1]); }
        }
        // one or two butter trees among its boulders, where there is free ground for them (twelve places tried)
        for (let i = 0, n = ns.int(1, 2), tries = 0; i < n && tries < 12; tries++) {
          const a = ns.range(0, 6.28), d = Rk * ns.range(1.12, 1.7) + 0.6, bx = x + Math.cos(a) * d, bz = z + Math.sin(a) * d;
          if (offLine(bx, bz) < NR_TRACK || solid(bx, bz) || washNear(bx, bz, 0) || !treeFree(bx, bz, NR_BUTTER_H[1] * 0.35)) continue;
          const Hb = ns.range(NR_BUTTER_H[0], NR_BUTTER_H[1]);
          nearTrees.push({ x: bx, y: hAt(bx, bz) - 0.05, z: bz, H: Hb, levels: 2, butter: true, hero: false, lean: ns.range(0, 0.12), st: ST, g }); i++;
          shadowOf.push([bx, bz, Hb * 0.35, Hb * 0.9, 0]);
        }
      };
      // the Koppie's nearness at a metre of the line (Kokerboom Koppie's own term of nearKop, at that point of the line)
      const kopAt = (s) => { path.posAtDist(s, eQ); return 1 - sstep(140, 520, Math.hypot(eQ.x * 0.8, eQ.z)); };
      // the walk: no run longer than the longest that may begin at its beginning is left without near rock, where one of the
      // places tried is free (lim: where the part of the walk ends; run: the longest run that may begin at prev)
      for (let prev = NR_WALK[0]; prev < NR_WALK[1];) {
        const lim = prev < RIDGE_S ? RIDGE_S : NR_WALK[1], kop = kopAt(prev), far = prev < RIDGE_S ? NR_EVERY[0] : NR_EVERY[1], run = far - (far - NR_EVERY[2]) * kop;
        const nx = stood.filter((k) => k[3] <= NR_CLOSE && k[2] > prev + 0.01 && k[2] < lim).map((k) => k[2]).sort((a, b) => a - b)[0] ?? lim;
        if (nx - prev <= run) { prev = nx; continue; }
        const great = ns() < kop, kR = ns(), side = ns.sign(), nf = ns.range(NR_TRACK, NR_CLOSE), beg = prev + run * NR_IN[0], end = nx - run * NR_IN[0];
        const s0 = Math.min(end, prev + run * ns.range(NR_IN[0], NR_IN[1])); let pl = null;
        for (const gr of great ? [true, false] : [false]) {
          const Rk = gr ? lerp(NR_GREAT_R[0], NR_GREAT_R[1], kR) : lerp(NR_R[0], NR_R[1], kR), dd = nf + flank(Rk);
          const tryAt = (s) => { for (const sd of [side, -side]) { const [x, z] = beside(s, sd * dd); if (nearFree(x, z, Rk)) { pl = [x, z, s, dd, Rk, gr]; break; } } };
          for (let s = s0; s <= end && !pl; s += NR_STEP) tryAt(s);
          for (let s = s0 - NR_STEP; s >= beg && !pl; s -= NR_STEP) tryAt(s);
          if (pl) break;
        }
        await ctx.yield();
        if (pl) { dealStack(pl[0], pl[1], pl[3], pl[4], pl[5]); prev = pl[2]; } else prev = nx;
      }
    }
    await ctx.yield();
    // (the rock and trees of these: their own meshes in the hero's materials, grouped along the route and left out by the same
    // rule of place as the props above; see PG)
    const nearProps = await hero.makeProps(nearRocks, nearTrees);
    scene.add(nearProps);
    const NPG = nearProps.userData.groups;
    await ctx.yield();

    // ---------- THE GRANITE KEEPS THE FACES THAT ARE EVER DRAWN ----------
    // The granite's material draws the front of a face only, and the lens rides on the line itself (its sway and bank turn it,
    // they do not move it). So every place a rock is ever looked at from is known: the points of the line from which it is
    // drawn (a point to every SEEN_STEP m; Kokerboom Koppie from the first metre to the last, a group of rocks beside the line
    // as far as its group is drawn: see PG), and, for whatever looks in through the gate before the flight begins, a box behind
    // the entry that opens as it goes back (SEEN_BOX: how deep it is; its half width and its half height at the gate; how much
    // wider to a side and higher it grows with each metre of depth). The hero is told those places (of the box its eight
    // corners: a face that is turned from all the corners is turned from every place inside the box) and leaves out of each
    // rock mesh the faces whose fronts are turned from all of them (see dropUnseen in the hero): faces that were never drawn.
    // Every face that is drawn is drawn as it was.
    const SEEN_STEP = 1, SEEN_BOX = [400, 25, 25, 1, 0.5];
    { const eyes = [], box = [], v = new THREE.Vector3(), t0 = path.tangentAtDist(0, new THREE.Vector3()), tl = Math.hypot(t0.x, t0.z) || 1, tx = t0.x / tl, tz = t0.z / tl;
      for (let s = 0; s < PL_LEN; s += SEEN_STEP) { path.posAtDist(s, v); eyes.push(v.x, v.y, v.z); }
      path.posAtDist(PL_LEN, v); eyes.push(v.x, v.y, v.z);
      path.posAtDist(0, v);
      for (const a of [0, SEEN_BOX[0]]) for (const sb of [-1, 1]) for (const c of [-SEEN_BOX[2], SEEN_BOX[2] + SEEN_BOX[4] * a]) { const b = sb * (SEEN_BOX[1] + SEEN_BOX[3] * a); box.push(v.x - tx * a - tz * b, v.y + c, v.z - tz * a + tx * b); }
      await ctx.yield();
      await hero.seenFrom(eyes.concat(box));
      // (the trees' meshes carry aSway and are left whole: their material draws both sides. A group is drawn while the lens
      // is short of (g + 1) GB m along the line, the last group always: its rock is told the points of the line up to there
      // and one more)
      for (const G of [PG, NPG]) for (let g = 0; g < G.length; g++) for (const m of G[g]) {
        if (m.geometry.attributes.aSway) continue;
        const n = g >= NG - 1 ? eyes.length : Math.min(eyes.length, 3 * (Math.ceil((g + 1) * GB / SEEN_STEP) + 2));
        await hero.seenFrom(eyes.slice(0, n).concat(box), m.geometry);
      } }
    await ctx.yield();

    // ---------- shadows as clock hands: soft strips stretched away from the sun under every boulder beside the path ----------
    const uShAmt = { value: 1 };
    {
      const SH_VERT = PLAIN_GLSL + /* glsl */`
attribute vec4 iBase; attribute float iKind;
uniform float uShAmt;
varying vec3 vQ; varying vec3 vP; varying float vS;
void main(){
  float hl = max(length(uSunDir.xz), 1e-3); vec2 sd = -uSunDir.xz / hl;
  // (vS: how much sun the thing stands in; out of it, under the lid, in the dusk shadow or by night, the strip draws in to a
  // soft patch of shade round the thing's foot)
  vS = uShAmt * sunLine(iBase.xy); float k = smoothstep(0., .25, vS);
  float L = min(iBase.w * hl / max(uSunDir.y, .03), iBase.w * 12.) * k;
  vec2 pxz = iBase.xy + sd * (position.y * (L + iBase.z * 1.2) - iBase.z * mix(.6, .25, k)) + vec2(-sd.y, sd.x) * position.x * iBase.z * mix(1.3, 1., k);
  vec3 P = vec3(pxz.x, groundH(pxz) + .05, pxz.y);
  vQ = vec3(position.xy, iKind); vP = P;
  vec4 mvPosition = modelViewMatrix * vec4(P, 1.);
  gl_Position = projectionMatrix * mvPosition;
#include <fog_vertex>
}`;
      const SH_FRAG = /* glsl */`
uniform float uShAmt;
varying vec3 vQ; varying vec3 vP; varying float vS;
void main(){
  // a boulder or shrub throws a tapering tongue; a quiver tree a thin trunk line that swells into its crown
  float wv = mix(1. - .4 * vQ.y, mix(.14, 1., smoothstep(.4, .58, vQ.y)), step(.5, vQ.z));
  float a = (1. - smoothstep(wv * .5, wv, abs(vQ.x))) * (1. - smoothstep(.74, 1., vQ.y)) * smoothstep(0., .05, vQ.y);
  a *= uShAmt * sunLine(vP.xz) * (1. - .8 * cloudCov(vP.xz)) * (1. - .85 * isleAt(vP.xz));
  // out of the sun every thing still stands on a soft patch of its own shade (the sky's light is cut off under it)
  float k = clamp(vS * 4., 0., 1.);
  a = mix((1. - smoothstep(.12, 1., length(vec2(vQ.x, vQ.y * 2. - 1.)))) * .52 * (1. - .35 * uNite), a, k);
#ifdef USE_FOG
  a *= exp(-fogDensity * fogDensity * vFogDepth * vFogDepth);
#endif
  gl_FragColor = vec4(mix(vec3(1.), vec3(.33, .42, .64), a * .88), 1.);
}`;
      const pos = [], idx = [], SEGS = 3;
      for (let i = 0; i <= SEGS; i++) pos.push(-1, i / SEGS, 0, 1, i / SEGS, 0);
      for (let i = 0; i < SEGS; i++) idx.push(i * 2, i * 2 + 1, i * 2 + 2, i * 2 + 1, i * 2 + 3, i * 2 + 2);
      const iBase = new Float32Array(shadowOf.length * 4), iKind = new Float32Array(shadowOf.length);
      shadowOf.forEach((k, i) => { iBase.set([k[0], k[1], k[2], k[3]], i * 4); iKind[i] = k[4]; });
      const g = new THREE.InstancedBufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx);
      g.setAttribute('iBase', new THREE.InstancedBufferAttribute(iBase, 4)); g.setAttribute('iKind', new THREE.InstancedBufferAttribute(iKind, 1)); g.instanceCount = shadowOf.length;
      const mat = hero.makeMat({ ...U, uPl, uKop, uShAmt }, SH_VERT, SH_FRAG, { transparent: true, depthWrite: false, blending: THREE.CustomBlending, blendEquation: THREE.AddEquation,
        blendSrc: THREE.DstColorFactor, blendDst: THREE.ZeroFactor, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
      const m = new THREE.Mesh(g, mat); m.frustumCulled = false; m.renderOrder = 1; scene.add(m);
    }
    await ctx.yield();

    // ---------- the wind pump and its round stone dam, 45 m left of the path at the halfway mark ----------
    const pumpHead = new THREE.Group(); let pumpWheel = null, damWater = null;
    {
      const P0 = path.pointAt(0.5), T0 = path.tangentAt(0.5), px = P0.x + T0.z * 45, pz = P0.z - T0.x * 45, py = hAt(px, pz);
      const pos = [], nor = [], col = [], aT = [], idx = [];
      const steel = new THREE.Color(0.42, 0.44, 0.46), rust = new THREE.Color(0.36, 0.22, 0.15), stone = new THREE.Color(0.46, 0.36, 0.3);
      const va = new THREE.Vector3(), vb = new THREE.Vector3(), vu = new THREE.Vector3(), vv = new THREE.Vector3(), vt = new THREE.Vector3();
      // a four-sided beam between two points (ribbons wide enough never to alias at 45 m)
      const beam = (a, b, w, c, T) => {
        va.set(a[0], a[1], a[2]); vb.set(b[0], b[1], b[2]); vt.copy(vb).sub(va).normalize();
        vu.set(1, 0, 0); if (Math.abs(vt.x) > 0.8) vu.set(0, 0, 1); vu.addScaledVector(vt, -vu.dot(vt)).normalize(); vv.crossVectors(vt, vu);
        const base = (T ? T.pos : pos).length / 3, P_ = T ? T.pos : pos, N_ = T ? T.nor : nor, C_ = T ? T.col : col, A_ = T ? T.aT : aT, I_ = T ? T.idx : idx;
        for (const e of [va, vb]) for (let j = 0; j < 4; j++) { const an = j * Math.PI / 2 + 0.785, cx = Math.cos(an), sn = Math.sin(an);
          P_.push(e.x + (vu.x * cx + vv.x * sn) * w, e.y + (vu.y * cx + vv.y * sn) * w, e.z + (vu.z * cx + vv.z * sn) * w); N_.push(vu.x * cx + vv.x * sn, vu.y * cx + vv.y * sn, vu.z * cx + vv.z * sn);
          const k = 0.8 + 0.4 * ((j * 7 + base) % 5) / 5; C_.push(c.r * k, c.g * k, c.b * k); A_.push(1); }
        for (let j = 0; j < 4; j++) { const j2 = (j + 1) % 4; I_.push(base + j, base + j2, base + 4 + j, base + j2, base + 4 + j2, base + 4 + j); }
      };
      const HT = 8.6, foot = 1.35, topW = 0.28, cx = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
      const at = (i, t) => { const w = lerp(foot, topW, t); return [cx[i][0] * w, t * HT, cx[i][1] * w]; };
      for (let i = 0; i < 4; i++) {
        beam(at(i, 0), at(i, 1), 0.085, steel);
        for (let l = 0; l < 4; l++) { const t0 = l / 4, t1 = (l + 1) / 4, j = (i + 1) % 4; beam(at(i, t1), at(j, t1), 0.05, steel); beam(at(i, t0), at(j, t1), 0.045, l % 2 ? rust : steel); }
      }
      beam([0, HT, 0], [0, HT + 0.55, 0], 0.16, rust); beam([0, 0.2, 0], [0, HT, 0], 0.04, rust);
      // dam: a ring of stone courses
      const DR = 3.4, DH = 1.05, DX = 5.2, NSG = 22;
      for (let i = 0; i < NSG; i++) {
        const a0 = (i / NSG) * 6.2832, a1 = ((i + 1) / NSG) * 6.2832, b = pos.length / 3;
        for (const [a, r, y] of [[a0, DR, 0], [a1, DR, 0], [a0, DR, DH], [a1, DR, DH], [a0, DR - 0.42, DH], [a1, DR - 0.42, DH], [a0, DR - 0.42, 0.5], [a1, DR - 0.42, 0.5]]) {
          pos.push(DX + Math.cos(a) * r, y, Math.sin(a) * r); const top = y === DH ? 1 : 0, inn = r < DR ? -1 : 1;
          nor.push(Math.cos(a) * inn * (1 - top * 0.6), top * 0.8, Math.sin(a) * inn * (1 - top * 0.6));
          const k = 0.7 + 0.5 * (((i * 13) % 7) / 7) * (y > 0.3 ? 1 : 0.7); col.push(stone.r * k, stone.g * k, stone.b * k); aT.push(y > 0.3 ? 1 : 0.5);
        }
        idx.push(b, b + 2, b + 1, b + 1, b + 2, b + 3, b + 2, b + 4, b + 3, b + 3, b + 4, b + 5, b + 4, b + 6, b + 5, b + 5, b + 6, b + 7);
      }
      const mk = (T) => { const g = new THREE.InstancedBufferGeometry();
        g.setAttribute('position', new THREE.Float32BufferAttribute(T.pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(T.nor, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(T.col, 3));
        g.setAttribute('aT', new THREE.Float32BufferAttribute(T.aT.map(() => 0), 1)); g.setIndex(T.idx); return g; };
      // static tower + dam as one instance of the prop material (no sway: aT is 0 so the wind term vanishes)
      const g = mk({ pos, nor, col, aT, idx });
      g.setAttribute('iPos', new THREE.InstancedBufferAttribute(new Float32Array([px, py, pz, 1]), 4)); g.setAttribute('iRnd', new THREE.InstancedBufferAttribute(new Float32Array([0, 0.6, 0.35]), 3)); g.instanceCount = 1;
      const PUMP_FRAG = PROP_FRAG.replace('mix(.22, 1.05, vT)', '1.').replace(' * (.55 + .9 * vn(vP.xz * 7.3 + vP.y * 9. + 4.))', '').replace('mix(N, vec3(0., 1., 0.), .35)', 'N').replace(', .6);', ', .15);');
      const tower = new THREE.Mesh(g, hero.makeMat(U, PROP_VERT, PUMP_FRAG, { side: THREE.DoubleSide })); tower.frustumCulled = false; scene.add(tower);
      // the head turns into the wind: a wheel that is a spinning blur, and a tail vane
      const WH_FRAG = /* glsl */`
varying vec3 vP, vN; varying vec2 vUv2;
uniform float uSpin;
void main(){
  float r = length(vUv2), a = atan(vUv2.y, vUv2.x + 1e-5);
  float blades = .62 + .38 * sin(a * 18. + uSpin) * (1. - smoothstep(.0, 1., fract(uSpin * .05)) * .3);
  float ring = smoothstep(.2, .26, r) * (1. - smoothstep(.94, 1., r));
  float rim = smoothstep(.9, .94, r) * (1. - smoothstep(.97, 1., r)) + (1. - smoothstep(.1, .14, r));
  float al = max(ring * blades * .78, rim);
  if (al < .04) discard;
  vec3 N = normalize(vN + vec3(0., 1e-4, 0.));
  vec3 col = shade(vec3(.5, .52, .55) * (.7 + .5 * blades), N, vP, .7) + uSunCol * sunLine(vP.xz) * .05 * blades;
  gl_FragColor = vec4(col, al);
#include <fog_fragment>
}`;
      const WH_VERT = /* glsl */`
varying vec3 vP, vN; varying vec2 vUv2;
void main(){ vUv2 = position.xy; vec4 wp = modelMatrix * vec4(position * vec3(1.55, 1.55, 1.), 1.); vP = wp.xyz; vN = normalize(mat3(modelMatrix) * vec3(0., .25, 1.));
  vec4 mvPosition = viewMatrix * wp; gl_Position = projectionMatrix * mvPosition;
#include <fog_vertex>
}`;
      const uSpin = { value: 0 };
      pumpWheel = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), hero.makeMat({ ...U, uSpin }, WH_VERT, WH_FRAG, { side: THREE.DoubleSide, transparent: true, depthWrite: false }));
      pumpWheel.position.set(0, 0, 0.55); pumpWheel.userData.spin = uSpin; pumpWheel.renderOrder = 2;
      const VT = { pos: [], nor: [], col: [], aT: [], idx: [] };
      beam([0, 0, 0.5], [0, 0, -2.6], 0.05, steel, VT);
      { const b = VT.pos.length / 3; for (const q of [[0, 0.1, -1.9], [0, 0.75, -3.5], [0, -0.75, -3.5], [0, -0.1, -1.9]]) { VT.pos.push(q[0], q[1], q[2]); VT.nor.push(1, 0.2, 0); VT.col.push(rust.r * 1.2, rust.g * 1.2, rust.b * 1.2); VT.aT.push(1); } VT.idx.push(b, b + 1, b + 2, b, b + 2, b + 3); }
      const vg = mk(VT); vg.setAttribute('iPos', new THREE.InstancedBufferAttribute(new Float32Array([0, 0, 0, 1]), 4)); vg.setAttribute('iRnd', new THREE.InstancedBufferAttribute(new Float32Array([0, 0.6, 0.35]), 3)); vg.instanceCount = 1;
      const VANE_VERT = PROP_VERT.replace('vec3 P = iPos.xyz + q;', 'vec3 P = (modelMatrix * vec4(position, 1.)).xyz;').replace('vN = vec3(normal.x * c - normal.z * s, normal.y, normal.x * s + normal.z * c);', 'vN = mat3(modelMatrix) * normal;').replace('modelViewMatrix * vec4(P, 1.)', 'viewMatrix * vec4(P, 1.)');
      const vane = new THREE.Mesh(vg, hero.makeMat(U, VANE_VERT, PUMP_FRAG, { side: THREE.DoubleSide })); vane.frustumCulled = false;
      pumpHead.add(pumpWheel, vane); pumpHead.position.set(px, py + HT + 0.45, pz); scene.add(pumpHead);
      damWater = new THREE.Mesh(new THREE.CircleGeometry(DR - 0.3, 20).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: '#6a88a8', fog: true }));
      damWater.position.set(px + DX, py + 0.82, pz); scene.add(damWater);
    }
    await ctx.yield();

    // ---------- the leopard tortoise: in time-lapse it sprints along the right-hand rut of the two-track, legs a blur; it is 8 m ahead
    // of the lens at u 0.84 and the lens passes over it at u 0.849 (an incidental, built here: a high domed carapace of horn-yellow
    // scutes with dark seams and flecks, head and neck, four stub legs). Its shadow is a sphere caster in the ground shader.
    const tortU = { value: new THREE.Vector4(0, -50, 0, 0) }; let tortMesh = null;
    {
      const pos = [], nor = [], part = [], idx = [];
      const ell = (cx, cy, cz, rx, ry, rz, na, nr, pt, lo = Math.PI) => {      // a lat-long ellipsoid (lo = how far down it goes from the pole)
        const b = pos.length / 3;
        for (let r = 0; r <= nr; r++) { const el = (r / nr) * lo, sr = Math.sin(el), cr = Math.cos(el);
          for (let j = 0; j < na; j++) { const a = (j / na) * 6.2832, x = Math.cos(a) * sr, z = Math.sin(a) * sr; pos.push(cx + x * rx, cy + cr * ry, cz + z * rz);
            const il = 1 / Math.hypot(x / rx, cr / ry, z / rz); nor.push(x / rx * il, cr / ry * il, z / rz * il); part.push(pt); } }
        for (let r = 0; r < nr; r++) for (let j = 0; j < na; j++) { const j2 = (j + 1) % na, p0 = b + r * na + j, p1 = b + r * na + j2, q0 = p0 + na, q1 = p1 + na; if (r > 0) idx.push(p0, p1, q1); idx.push(p0, q1, q0); }
      };
      ell(0, 0.075, -0.02, 0.27, 0.33, 0.39, 12, 5, 0, Math.PI * 0.5);                          // carapace
      ell(0, 0.17, 0.455, 0.05, 0.047, 0.115, 6, 4, 1);                                         // head and neck
      [[-0.2, 0.25], [0.2, 0.25], [-0.2, -0.27], [0.2, -0.27]].forEach(([x, z], i) => ell(x, 0.085, z, 0.055, 0.09, 0.06, 5, 3, 2 + 0.25 * [0, 2, 2, 0][i] + 0.05));   // legs, diagonal pairs in step
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setAttribute('aPart', new THREE.Float32BufferAttribute(part, 1)); g.setIndex(idx);
      const TV = /* glsl */`
attribute float aPart; uniform vec4 uTort;
varying vec3 vP, vN, vL; varying float vPart;
void main(){
  vec3 q = position; float ph = fract(aPart) * 4.;
  if (aPart > 1.5) { float sw = sin(uTime * 23. + floor(ph) * 1.5708); q.z += sw * .075 * (1. - smoothstep(.02, .17, position.y)); q.y += max(sw, 0.) * .014 * (1. - smoothstep(.02, .17, position.y)); }
  else if (aPart > .5) { q.y += sin(uTime * 23.) * .006; q.x += sin(uTime * 11.5) * .008 * smoothstep(.36, .55, position.z); }
  q.y += .007 * sin(uTime * 46.);
  float c = cos(uTort.w), s = sin(uTort.w);
  vec3 P = uTort.xyz + vec3(q.x * c + q.z * s, q.y, -q.x * s + q.z * c);
  vN = vec3(normal.x * c + normal.z * s, normal.y, -normal.x * s + normal.z * c); vP = P; vL = position; vPart = aPart;
  vec4 mvPosition = modelViewMatrix * vec4(P, 1.);
  gl_Position = projectionMatrix * mvPosition;
#include <fog_vertex>
}`;
      const TF = /* glsl */`
varying vec3 vP, vN, vL; varying float vPart;
void main(){
  vec3 N = normalize(vN + vec3(0., 1e-4, 0.)); vec3 alb;
  if (vPart < .5) {
    // scutes: polygonal plates seen from above, each pale with dark flecks toward its seams
    float jd = joints(vL.xz * vec2(6.4, 5.6) + 2.7);
    float seam = 1. - smoothstep(.03, .16, jd), fleck = smoothstep(.4, .56, vn(vL.xz * 41. + 3.) * .6 + vn(vL.zx * 17.) * .4) * (1. - smoothstep(.25, .75, jd));
    alb = mix(vec3(.4, .29, .11) * (.75 + .4 * vn(vL.xz * 9.)), vec3(.035, .028, .02), max(seam * .94, fleck * .85));
    alb *= mix(.45, 1., smoothstep(.07, .2, vL.y));
    N = normalize(N + vec3(vn(vL.xz * 30.) - .5, 0., vn(vL.xz * 30. + 5.) - .5) * .25);
  } else alb = vec3(.25, .21, .15) * (.55 + .7 * vn(vL.xy * 37. + vL.z * 29.)) * mix(.5, 1., smoothstep(.0, .12, vL.y));
  vec3 col = shade(alb, N, vP, .3);
  vec3 V = normalize(uCam - vP + vec3(0., 1e-4, 0.)); float fr = 1. - clamp(dot(N, V), 0., 1.);
  col += uSkyCol * fr * fr * .05 + alb * uSunCol * sunLine(vP.xz) * pow(max(dot(reflect(-V, N), uSunDir), 0.), 12.) * .12 * step(vPart, .5);
  gl_FragColor = vec4(col, 1.);
#include <fog_fragment>
}`;
      tortMesh = new THREE.Mesh(g, hero.makeMat({ ...U, uTort: tortU }, TV, TF, { side: THREE.DoubleSide })); tortMesh.frustumCulled = false; tortMesh.visible = false; scene.add(tortMesh);
    }
    // where the right-hand rut runs at local z (the twin of trackAt in the hero's ground shader)
    const rutX = (z) => U.uTrack.value.x - Math.pow(Math.max(z - 180, 0), 2) / 1520 + (vnoise(z * 0.021, 7.3) - 0.5) * 9 + (vnoise(z * 0.083, 2.1) - 0.5) * 2.2;

    await ctx.yield();
    // ---------- wildlife ----------
    const fauna = F.makeFauna(scene, { light: F.lightFrom(scene), rng: rng.fork('fauna') });
    const fr = rng.fork('cast'), lit = [];
    const add = (f, o) => { fauna.add(f, o); lit.push(f); return f; };
    const manual = (f) => { scene.add(f.object); lit.push(f); return f; };
    // the grazing bull (see GSPEC): a tongue of the orange flats runs into the band of rain daisies behind him as he is seen from
    // the brief's u 0.84, so his whole body stands on saturated colour
    { const bP = path.posAtDist(BULL_S), bT = path.tangentAtDist(BULL_S), bullC = [bP.x - bT.z * 9, 0, bP.z + bT.x * 9];
      const l0 = path.posAtDist(0.84 * PL_LEN), dx = bullC[0] - l0.x, dz = bullC[2] - l0.z, dl = Math.hypot(dx, dz) || 1;
      U.uTongue.value.set(bullC[0] + dx / dl * 13, bullC[2] + dz / dl * 13, 9.5, 0); }
    // ostriches: a black-and-white cock and grey-brown hens running beside us on the left through day 5
    const ostrichGeo = (cock) => {
      const g = new F.Geo(), C = (h) => new THREE.Color(h);
      const cBody = C(cock ? '#0b0a0a' : '#55463a'), cBel = C(cock ? '#060606' : '#42372e'), cPl = C(cock ? '#e9e5da' : '#7d6e5e'), cSkin = C(cock ? '#b98f86' : '#9a8a78'), cBeak = C('#d8b070');
      const body = g.loft([{ z: -0.66, y: 1.2, rx: 0, ry: 0 }, { z: -0.52, y: 1.3, rx: 0.2, ry: 0.22 }, { z: -0.2, y: 1.36, rx: 0.37, ry: 0.4 }, { z: 0.16, y: 1.3, rx: 0.36, ry: 0.36 }, { z: 0.44, y: 1.27, rx: 0.22, ry: 0.24 }, { z: 0.6, y: 1.34, rx: 0, ry: 0 }], { sides: 10, top: cBody, belly: cBel });
      g.glow(body, 1);
      g.fan([[0, 1.5, -0.42], [0.3, 1.42, -0.86], [0, 1.1, -1.02], [-0.3, 1.42, -0.86]], cPl, cPl);            // tail plumes
      g.fan([[0, 1.56, -0.5], [0.16, 1.66, -0.9], [0, 1.4, -1.0], [-0.16, 1.66, -0.9]], cPl, cPl);
      for (const sx of [-1, 1]) { g.fan([[sx * 0.37, 1.5, 0.22], [sx * 0.46, 1.1, 0.0], [sx * 0.45, 1.08, -0.46], [sx * 0.39, 1.4, -0.56]], cBody, cBody); g.fan([[sx * 0.46, 1.12, 0.0], [sx * 0.47, 0.94, -0.12], [sx * 0.45, 0.9, -0.5], [sx * 0.45, 1.1, -0.48]], cPl, cPl); }   // wing plumes
      for (const [sx, ph] of [[-1, 0], [1, 0.5]]) {
        const x = sx * 0.17, jy = 1.12;
        const r = g.tube([[x, jy + 0.12, -0.04], [x, 0.9, 0.08], [x, 0.62, -0.13], [x, 0.34, -0.07], [x, 0.07, -0.03], [x, 0.0, 0.14]], [0.13, 0.115, 0.05, 0.036, 0.036, 0.03], 6, cSkin, cSkin);
        g.anim(r, (px, py) => [ph, Math.min(1, Math.max(0, (jy - py) / jy)), 1, 0]); g.pivot(r, x, jy, -0.04);
      }
      const n0 = g.n, nb = [0, 1.42, 0.44], npts = [], nr = [];
      for (let i = 0; i <= 6; i++) { const t = i / 6; npts.push([0, nb[1] + t * 0.86, nb[2] + 0.2 * Math.sin(t * Math.PI) * (1 - t * 0.4) + t * 0.12]); nr.push(lerp(0.085, 0.04, Math.pow(t, 0.6))); }
      g.tube(npts, nr, 6, cSkin, cSkin);
      const hy = nb[1] + 0.9, hz = nb[2] + 0.17;
      g.blob(0, hy, hz, 0.06, 0.055, 0.1, cSkin, null, 6, 3);
      g.tube([[0, hy - 0.01, hz + 0.08], [0, hy - 0.035, hz + 0.21]], [0.035, 0], 4, cBeak);
      g.anim([n0, g.n], (px, py) => [Math.min(1, Math.max(0, (py - nb[1]) / 0.9)), 0, 2, 0]); g.pivot([n0, g.n], 0, nb[1] - 0.1, nb[2]);
      return g.build();
    };
    const OSTR = { h: 1.36, bodyLen: 0.9, width: 0.52, depth: 0.5, coat: '#0d0c0c', belly: '#070707', legs: '#c9a49a', sock: '#c9a49a', accent: '#f2efe6', horn: '#000', pattern: 'none', speed: 5, stride: 2.1, graze: 0, count: 1 };
    const OFROM = 0.5, OTO = 0.86;
    const mkOstrich = (cock, count, side, sizes, label) => manual(F.makeHerd({ rng: stream(label), geometry: ostrichGeo(cock), preset: OSTR, count, sizes, mode: 'migrate', heightAt: hAt, swing: 0.6, fill: 0.3, rim: 0.45,
      spread: [1.5, count > 1 ? 5 : 0.1], shadowSize: [0.5, 0.7, 0], along: { path, side, from: OFROM, to: OTO, lead: 0 } }));
    // they run on the brief's lane, 13 m left of the line, the cock leading, down the damp hollow and its white rain daisies (see
    // HOL); the cock and the hens each from a stream of their own
    const cockH = mkOstrich(true, 1, -O_LANE, [1.44], 'the ostrich cock');      // (2.4 m to the crown of his head, as the brief has him)
    await ctx.yield();
    const hensH = mkOstrich(false, HENS, -(O_LANE + 2.5), [0.95, 0.9, 0.98], 'the ostrich hens');
    await ctx.yield();
    // (their run is one plain law, ostrichAt above: a steady 16 m/s, the lens drawing past them through day 5)
    U.uTrack.value.set(2.3, 96, 330, 1);          // vygie mats on the plain keep off the line of flight      // the faint two-track beside us for the last 200 m of plain
    // sociable weavers stream in and out of the haystack nests in the Sentinel and in a portal tree
    const weaverAt = (c, n, rng) => F.makeFlock({ rng, species: 'crows', count: n, size: 0.62, speed: 8, flap: 7.5, glide: 0.15, center: [c.x, c.y, c.z], radius: 5.5, wobble: 0.5,
      spread: [3.2, 2.4, 6], wander: [2.2, 1.6, 2.2, 1.3], body: '#5b4632', belly: '#d9c8a6', wingC: '#3c2e22', head: '#2a2019', tailC: '#3c2e22' });
    // WEAVER_CLEAR: the metres asked between the flown line and every place where a weaver can be drawn. LINE_STEP: the step of d
    // by which flownLine is laid. MOVE_STEP: the metres by which the move of a flock grows at a time.
    const WEAVER_CLEAR = 2.0, LINE_STEP = 0.25, MOVE_STEP = 0.125;
    // flownLine: the x, y, z of path.posAtDist(d) for d = 0, LINE_STEP, 2 * LINE_STEP and so on while d is under path.length, and
    // then of path.posAtDist(path.length)
    const flownLine = [], flownAt = new THREE.Vector3();
    for (let d = 0; d < path.length; d += LINE_STEP) { path.posAtDist(d, flownAt); flownLine.push(flownAt.x, flownAt.y, flownAt.z); }
    path.posAtDist(path.length, flownAt); flownLine.push(flownAt.x, flownAt.y, flownAt.z);
    // lineGap: the longest distance between two neighbours of flownLine
    let lineGap = 0;
    for (let k = 3; k < flownLine.length; k += 3) { const dx = flownLine[k] - flownLine[k - 3], dy = flownLine[k + 1] - flownLine[k - 2], dz = flownLine[k + 2] - flownLine[k - 1]; lineGap = Math.max(lineGap, Math.sqrt(dx * dx + dy * dy + dz * dz)); }
    // boxOff: the distance from the point (x, y, z) to the box about the origin with the half-sizes hx, hy, hz; 0 for a point in it
    const boxOff = (x, y, z, hx, hy, hz) => { const dx = Math.max(Math.abs(x) - hx, 0), dy = Math.max(Math.abs(y) - hy, 0), dz = Math.max(Math.abs(z) - hz, 0); return Math.sqrt(dx * dx + dy * dy + dz * dz); };
    await ctx.yield();
    // weaver(c, n): a flock of n at the centre c or, by what follows, at a centre moved level from c; it is handed to add with
    // always: true and returned
    const weaver = (c, n) => {
      // the flock is made at c with the values of the stream fr.fork('weav' + n); each value is put in drawn as the kit takes it
      const wr = fr.fork('weav' + n), drawn = [];
      let f = weaverAt(c, n, () => { const v = wr(); drawn.push(v); return v; });
      // Of what the kit made (src/kit/fauna/birds.js and common.js). D: the N stored places of the loop, four numbers each, x, y, z
      // the first three; the kit's shader takes a bird's place on the loop from a cubic B-spline over them. Bird b: its offset from its place on the loop is
      // iA[b * 4] along x, iA[b * 4 + 1] along y, iB[b * 4 + 3] along z, and its scale is iB[b * 4]. wd: the wander of the call.
      const D = f.route.data, N = f.route.N, iA = f.geometry.attributes.iA.array, iB = f.geometry.attributes.iB.array, wd = f.uniforms.uWander.value;
      // hx, hy, hz: the half-sizes of the box of a bird's wander. In the kit the wander along x is a sine plus 0.5 of a sine, times
      // wd.x; along y a sine times wd.y; along z a sine times wd.z.
      const hx = (1 + 0.5) * wd.x, hy = wd.y, hz = wd.z;
      // gap: the longest distance between two neighbours of the loop's stored places, the last and the first being neighbours too
      let gap = 0;
      for (let j = 0; j < N; j++) { const k = (j + 1) % N, dx = D[k * 4] - D[j * 4], dy = D[k * 4 + 1] - D[j * 4 + 1], dz = D[k * 4 + 2] - D[j * 4 + 2]; gap = Math.max(gap, Math.sqrt(dx * dx + dy * dy + dz * dz)); }
      // reach[b], a sum of four: for the body and wings of bird b, the len plus the span of the kit's crow, times the bird's scale;
      // for the loop between its stored places, two thirds of gap; WEAVER_CLEAR; for the line between the places of flownLine, half
      // of lineGap
      // ox, oy, oz: the largest offset of a bird along x, y, z, taken without its sign. rMost: the largest reach[b].
      const crow = F.BIRD_PRESETS.crows, reach = [];
      let ox = 0, oy = 0, oz = 0, rMost = 0;
      for (let b = 0; b < f.count; b++) {
        reach.push((crow.len + crow.span) * iB[b * 4] + gap * 2 / 3 + WEAVER_CLEAR + lineGap / 2);
        ox = Math.max(ox, Math.abs(iA[b * 4])); oy = Math.max(oy, Math.abs(iA[b * 4 + 1])); oz = Math.max(oz, Math.abs(iB[b * 4 + 3])); rMost = Math.max(rMost, reach[b]);
      }
      // (mx, my, mz) and bx, by, bz: the middle and the half-sizes of the box that spans the loop's stored places
      let x0 = Infinity, y0 = Infinity, z0 = Infinity, x1 = -Infinity, y1 = -Infinity, z1 = -Infinity;
      for (let j = 0; j < N; j++) { x0 = Math.min(x0, D[j * 4]); x1 = Math.max(x1, D[j * 4]); y0 = Math.min(y0, D[j * 4 + 1]); y1 = Math.max(y1, D[j * 4 + 1]); z0 = Math.min(z0, D[j * 4 + 2]); z1 = Math.max(z1, D[j * 4 + 2]); }
      const mx = (x0 + x1) / 2, my = (y0 + y1) / 2, mz = (z0 + z1) / 2, bx = (x1 - x0) / 2, by = (y1 - y0) / 2, bz = (z1 - z0) / 2;
      // (nx, nz): the level unit direction to c from the place of flownLine nearest to c in space (the first such place in the list)
      let nearest = Infinity, kn = 0;
      for (let k = 0; k < flownLine.length; k += 3) { const dx = flownLine[k] - c.x, dy = flownLine[k + 1] - c.y, dz = flownLine[k + 2] - c.z, d2 = dx * dx + dy * dy + dz * dz; if (d2 < nearest) { nearest = d2; kn = k; } }
      const ax = c.x - flownLine[kn], az = c.z - flownLine[kn + 2], al = Math.sqrt(ax * ax + az * az), nx = ax / al, nz = az / al;
      // move: the metres by which the flock is taken as moved along (nx, 0, nz); 0 at first.
      // The places of flownLine are gone through from the first. For a place, far is its distance from the box of half-sizes
      // bx + hx + ox, by + hy + oy, bz + hz + oz about (mx, my, mz) plus move along (nx, 0, nz), less rMost; with far at 0 or more
      // the going passes on by 1 plus the whole number of times lineGap goes into far, in places. Otherwise the loop's stored
      // places are gone through from the first. For a stored place, farJ is the distance of the place of flownLine from the box
      // of half-sizes hx + ox, hy + oy, hz + oz about the stored place plus move along (nx, 0, nz), less rMost; with farJ at 0 or
      // more the going passes on by 1 plus the whole number of times gap goes into farJ, in stored places. Otherwise the birds
      // are gone through. For a bird b, o is the distance of the place of flownLine from the box of half-sizes hx, hy, hz about
      // the stored place plus the bird's offset plus move along (nx, 0, nz); as long as o is under reach[b], move grows by
      // MOVE_STEP and o is taken again. spare is the least, over the birds, of o less reach[b] as each bird was left; the going
      // then passes on by 1 plus the whole number of times gap goes into spare, in stored places, and after the last stored
      // place to the next place of flownLine. All of it is gone through again until move comes out of one going-through as it
      // went in.
      let move = 0, settled = false;
      while (!settled) {
        settled = true;
        let k = 0;
        while (k < flownLine.length) {
          const px = flownLine[k], py = flownLine[k + 1], pz = flownLine[k + 2];
          const far = boxOff(px - nx * move - mx, py - my, pz - nz * move - mz, bx + hx + ox, by + hy + oy, bz + hz + oz) - rMost;
          if (far >= 0) { k += 3 * (1 + Math.floor(far / lineGap)); continue; }
          let j = 0;
          while (j < N) {
            const qx = px - D[j * 4], qy = py - D[j * 4 + 1], qz = pz - D[j * 4 + 2];
            const farJ = boxOff(qx - nx * move, qy, qz - nz * move, hx + ox, hy + oy, hz + oz) - rMost;
            if (farJ >= 0) { j += 1 + Math.floor(farJ / gap); continue; }
            let spare = Infinity;
            for (let b = 0; b < f.count; b++) {
              let o = boxOff(qx - nx * move - iA[b * 4], qy - iA[b * 4 + 1], qz - nz * move - iB[b * 4 + 3], hx, hy, hz);
              while (o < reach[b]) { move += MOVE_STEP; settled = false; o = boxOff(qx - nx * move - iA[b * 4], qy - iA[b * 4 + 1], qz - nz * move - iB[b * 4 + 3], hx, hy, hz); }
              spare = Math.min(spare, o - reach[b]);
            }
            j += 1 + Math.floor(spare / gap);
          }
          k += 3;
        }
      }
      // with move at 0 the flock made above is kept; otherwise the flock is made again at c plus move along (nx, 0, nz), the kit
      // given the values of drawn in their order, and no further value is taken from the stream
      if (move > 0) { let at = 0; f = weaverAt(new THREE.Vector3(c.x + nx * move, c.y, c.z + nz * move), n, () => drawn[at++]); }
      return add(f, { always: true });
    };
    weaver(new THREE.Vector3(senNest.x + ST.z * 2, senNest.y + 0.6, senNest.z - ST.x * 2), 44);
    await ctx.yield();
    const gateWeavers = A.nestTree ? weaver(new THREE.Vector3(A.nestTree.x * 1.25, A.nestTree.y + 1.2, A.nestTree.z - 2), 40) : null;
    await ctx.yield();
    // two Verreaux's eagles circle Kokerboom Koppie the whole flight, on wide thermals over its tors so that they read from the plain
    const eagles = add(F.makeFlock({ rng: fr.fork('eagle'), species: 'eagles', count: 2, size: 2.6, center: [4, 74, -8], radius: 62, soarRadius: 44, soarLift: 7, body: '#12100f', belly: '#12100f', wingC: '#171412', tip: '#0b0a09', tailC: '#12100f', head: '#12100f' }), { always: true });
    await ctx.yield();
    // ---------- gemsbok: one instanced mesh carries every animal of the flight (the standing ones of GSPEC and the herd of day 4) ----------
    // The herd walks one file in stutter-frames along its track (HTRK), from the right across the line of flight and away to the
    // left: from the crest of the ridge it is a line of animals coming down the foot of the slope on the right; at the brief's
    // day-4 noon its leaders are away to the left and its last three, walking abreast, have just stepped off the line, 18 m beyond
    // the lens, on the orange foot of the slope; then the short night takes it.
    const GN = GSPEC.length + herdN, H_GAP = 4.6, H_STEP = 7.5;
    const gIPos = new Float32Array(GN * 4), gIPose = new Float32Array(GN * 4), gIRnd = new Float32Array(GN * 2), gHerd = [];
    let gPosAttr = null, gPoseAttr = null; const gGeoms = [];
    {
      const gr = stream('the herd'), G = gemsbokGeometry(), g0 = new THREE.BufferGeometry();
      g0.setAttribute('position', new THREE.Float32BufferAttribute(G.pos, 3)); g0.setIndex(G.idx); g0.computeVertexNormals();
      const g = new THREE.InstancedBufferGeometry();
      g.setAttribute('position', g0.attributes.position); g.setAttribute('normal', g0.attributes.normal); g.setIndex(g0.index);
      g.setAttribute('aP', new THREE.Float32BufferAttribute(G.aP, 4)); g.setAttribute('aPiv', new THREE.Float32BufferAttribute(G.piv, 4));
      GSPEC.forEach((q, i) => { gIPos.set([q.x, q.y, q.z, q.th], i * 4); gIPose.set([q.g, 0, 0, 0], i * 4); gIRnd.set([q.h, q.yw], i * 2); });
      // the file: animal j walks j places ahead of the last (H_GAP m to a place, a little out of step and out of line by draw);
      // the last three walk abreast, a stride behind one another, heads up
      for (let j = 0; j < herdN; j++) {
        const o = GSPEC.length + j, tail = [[0, -1.6, 1.1], [1.6, 1.7, 1.03], [3.2, -0.2, 1.07]][j];
        const hj = tail ? { h: gr(), dd: tail[0], dl: tail[1], sc: tail[2], g: 0 } : { h: gr(), dd: j * H_GAP + (gr() - 0.5) * 2.2, dl: (gr() - 0.5) * 5, sc: 0.9 + 0.22 * gr(), g: gr() < 0.2 ? 0.25 : 0 };
        gHerd.push(hj); gIRnd.set([hj.h, (gr() - 0.5) * 0.5], o * 2);
      }
      gPosAttr = new THREE.InstancedBufferAttribute(gIPos, 4); gPoseAttr = new THREE.InstancedBufferAttribute(gIPose, 4);
      gPosAttr.setUsage(THREE.DynamicDrawUsage); gPoseAttr.setUsage(THREE.DynamicDrawUsage);
      g.setAttribute('iPos', gPosAttr); g.setAttribute('iPose', gPoseAttr); g.setAttribute('iRnd', new THREE.InstancedBufferAttribute(gIRnd, 2)); g.instanceCount = GN; gGeoms.push(g);
      const m = new THREE.Mesh(g, hero.makeMat(U, GEMS_VERT, GEMS_FRAG, { side: THREE.DoubleSide })); m.frustumCulled = false; scene.add(m);
      // each animal's shadow: a soft blue tongue drawn out away from the sun (a clock hand, as every boulder's is), dark under the belly
      const GSH_VERT = PLAIN_GLSL + /* glsl */`
attribute vec4 iPos, iPose;
varying vec2 vQ; varying vec3 vP; varying float vL;
void main(){
  float hl = max(length(uSunDir.xz), 1e-3); vec2 sd = -uSunDir.xz / hl; float s = iPose.w;
  float L = min(1.3 * s * hl / max(uSunDir.y, .05), 15. * s) * smoothstep(.0, .08, uSunDir.y);
  vec2 fw = vec2(sin(iPos.w), cos(iPos.w));
  float wd = (.3 + .55 * abs(dot(fw, vec2(-sd.y, sd.x)))) * s;
  vec2 pxz = iPos.xz + sd * (position.y * (L + 1.1 * s) - .55 * s) + vec2(-sd.y, sd.x) * position.x * wd * 1.5;
  vec3 P = vec3(pxz.x, groundH(pxz) + .06, pxz.y);
  vQ = position.xy; vP = P; vL = L / max(s, 1e-3);
  vec4 mvPosition = modelViewMatrix * vec4(P, 1.);
  gl_Position = projectionMatrix * mvPosition;
#include <fog_vertex>
}`;
      const GSH_FRAG = /* glsl */`
varying vec2 vQ; varying vec3 vP; varying float vL;
void main(){
  float a = (1. - smoothstep(.35, 1., abs(vQ.x))) * smoothstep(0., .08, vQ.y) * (1. - smoothstep(.6, 1., vQ.y));
  float sunny = sunLine(vP.xz) * (1. - .8 * cloudCov(vP.xz));
  a *= mix(.34 * (1. - smoothstep(.0, 1.6 / (vL + 1.1), vQ.y)), .8, sunny * smoothstep(.02, .12, uSunDir.y)) * (1. - .5 * uNite);
#ifdef USE_FOG
  a *= exp(-fogDensity * fogDensity * vFogDepth * vFogDepth);
#endif
  gl_FragColor = vec4(mix(vec3(1.), vec3(.3, .38, .6), a), 1.);
}`;
      const sp = [], si = [], SEG = 3;
      for (let i = 0; i <= SEG; i++) sp.push(-1, i / SEG, 0, 1, i / SEG, 0);
      for (let i = 0; i < SEG; i++) si.push(i * 2, i * 2 + 1, i * 2 + 2, i * 2 + 1, i * 2 + 3, i * 2 + 2);
      const gs = new THREE.InstancedBufferGeometry();
      gs.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3)); gs.setIndex(si); gs.setAttribute('iPos', gPosAttr); gs.setAttribute('iPose', gPoseAttr); gs.instanceCount = GN; gGeoms.push(gs);
      const ms = new THREE.Mesh(gs, hero.makeMat({ ...U, uPl, uKop }, GSH_VERT, GSH_FRAG, { transparent: true, depthWrite: false, blending: THREE.CustomBlending, blendEquation: THREE.AddEquation,
        blendSrc: THREE.DstColorFactor, blendDst: THREE.ZeroFactor, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }));
      ms.frustumCulled = false; ms.renderOrder = 1; scene.add(ms);
    }
    const hA = [0, 0], hB = [0, 0], panBull = GSPEC.find((q) => q.pan) || null;
    // (each sample day is a week on: the herd is there for day 4 only, the ostriches for day 5 only; they come and go at the darkest
    // moment of the dips either side of their day)
    const HERD_ON = (days[2][1] + days[3][0]) / 2, HERD_OFF = (days[3][1] + days[4][0]) / 2, BIRDS_OFF = (days[4][1] + days[5][0]) / 2;
    const gemsUpdate = (u, t) => {
      const sL = u * PL_LEN, tt = u > 0.728 ? t : Math.floor(t * 3 + 1e-4) / 3;
      let nSt = 0;
      for (let i = 0; i < GSPEC.length; i++) {
        const q = GSPEC[i], o = i * 4, pulse = Math.max(0, Math.sin(tt * (0.5 + 0.5 * q.h) + q.h * 40));
        gIPose[o] = q.g ? 1 - 0.3 * pulse * pulse : 0.1 * pulse; gIPose[o + 3] = q.sd > sL - 26 ? q.sc : 0;
        if (q.sd > sL - 26) nSt = i + 1;
      }
      if (panBull) U.uBull.value.x = panBull.sd > sL - 26 ? panBull.x : 9000;          // (his mirror image goes when he does)
      // the walk: three snaps to a second of the flight (120 to the whole of it), H_STEP m of walking to a snap, nothing moving
      // during a hold; the brief's u 0.55 lies in the middle of a hold, and in that hold the last animal stands 4 m beyond the
      // crossing
      const on = u >= HERD_ON && u < HERD_OFF, snap = Math.floor(u * 120 + 0.5), dT = (snap - Math.floor(0.55 * 120 + 0.5)) * H_STEP + 4;
      for (let j = 0; j < herdN; j++) {
        const hj = gHerd[j], o = (GSPEC.length + j) * 4, d = dT + hj.dd;
        herdAt(d, hA); herdAt(d + 2.5, hB); const tx = hB[0] - hA[0], tz = hB[1] - hA[1], tl = Math.hypot(tx, tz) || 1;
        const x0 = hA[0] + tz / tl * hj.dl, z0 = hA[1] - tx / tl * hj.dl;
        gIPos[o] = x0; gIPos[o + 1] = hAt(x0, z0); gIPos[o + 2] = z0; gIPos[o + 3] = Math.atan2(tx, tz);
        gIPose[o] = hj.g; gIPose[o + 1] = fract(hj.h * 7.3 + snap * 0.37); gIPose[o + 2] = 1; gIPose[o + 3] = on ? hj.sc : 0;
      }
      // (only the animals that are there are drawn: the herd on its day, the standing ones until the lens has passed them)
      for (const q of gGeoms) q.instanceCount = on ? GN : nSt;
      gPosAttr.needsUpdate = true; gPoseAttr.needsUpdate = true;
    };
    await ctx.yield();
    // ---------- air: rain on day one, monkey beetles as glitter over the open daisies ----------
    const time = { value: 0 }, set = fx.fxGroup(); scene.add(set.object);
    const rain = set.add(fx.makeParticles({ rng: rng.fork('rain'), preset: 'rain', time, count: Math.round(3200 * detail), box: [46, 30, 46], colors: ['#ffd9a8', '#cfd8e6', '#ffe9c8'], intensity: 0.9 }));
    const beetles = set.add(fx.makeParticles({ rng: rng.fork('beetle'), preset: 'dust', time, follow: 'xz', center: [0, 1, 0], count: Math.round(1500 * detail), box: [42, 1.5, 42], size: [0.022, 0.055], colors: ['#ffd76a', '#b6f06a', '#ff9a3c'], twinkle: 1, intensity: 2.2 }));
    rain.setOpacity(0); beetles.setOpacity(0);

    // ---------- the clock: everything below is a pure function of u (and loops of time) ----------
    const c3 = (r, g, b) => new THREE.Color(r, g, b);
    const K = {
      zenDay: c3(0.055, 0.19, 0.53), zenNight: c3(0.016, 0.034, 0.1), zenStorm: c3(0.06, 0.07, 0.15), zenGold: c3(0.15, 0.25, 0.52), horGold: c3(0.95, 0.63, 0.37), zenBerg: c3(0.2, 0.3, 0.5),
      horDay: c3(0.56, 0.68, 0.78), horDusk: c3(0.86, 0.47, 0.25), horNight: c3(0.05, 0.09, 0.2), horBerg: c3(0.8, 0.6, 0.42),
      nightKey: c3(0.32, 0.5, 1.0), cream: c3(1, 0.93, 0.8), amber: c3(1, 0.6, 0.3), fillDay: c3(0.62, 0.74, 0.9), fillNight: c3(0.3, 0.5, 1.05), fillDusk: c3(0.62, 0.48, 0.66),
      gndDay: c3(0.2, 0.16, 0.13), gndNight: c3(0.14, 0.2, 0.4), cloudNight: c3(0.05, 0.07, 0.13), cloudShDay: c3(0.42, 0.47, 0.6), cloudShNight: c3(0.02, 0.03, 0.07),
      rose: c3(0.86, 0.56, 0.6), lidFog: c3(0.36, 0.39, 0.45), lidBank: LAST === 'berg' ? c3(0.3, 0.25, 0.22) : c3(0.2, 0.18, 0.25), mtnDay: c3(0.3, 0.42, 0.6), mtnNight: c3(0.03, 0.045, 0.09),
    };
    const GROW = [[0, 0], [days[1][0], 0.03], [days[1][1], 0.46], [0.37, 0.82], [0.468, 0.88], [0.482, 0.93], [0.575, 0.95], [0.59, 0.98], [0.708, 0.99], [0.728, 1]];
    const FRAC = [[0.36, 0.5], [0.468, 0.64], [0.482, 0.82], [0.575, 0.88], [0.59, 0.96], [0.708, 0.97], [0.728, 1]];
    // (the puddles, the last drops and a veil over the afterglow hold through the dusk of day 1)
    const WET = [[0, 1], [0.085, 0.72], [0.125, 0.68], [0.17, 0.4], [0.26, 0.06], [0.3, 0]], RAIN = [[0, 1], [0.06, 0.62], [0.1, 0.56], [0.125, 0.46], [0.15, 0]];
    const STORM = [[0, 1], [0.1, 0.75], [0.125, 0.59], [0.153, 0.2], [0.2, 0]], VEIL = [[0, 1], [0.09, 0.75], [0.125, 0.42], [0.153, 0]];
    const PANW = [[0, 1], [0.172, 1], [0.215, 0.4], [0.26, 0]];          // the pan's water shrinks to its middle through the morning of day 2
    const sunV = new THREE.Vector3(), sunL = new THREE.Vector3(), camP = new THREE.Vector3(), camT = new THREE.Vector3(), tmpC = new THREE.Color(), keyC = new THREE.Color(), horC = new THREE.Color(), zenC = new THREE.Color(), fogC = new THREE.Color();
    // (_dot: where a creature stands along the tide; null = it is lit as the lens is. The portal-tree weavers and the eagles light up
    // when the line reaches the saddle)
    for (const f of lit) f._dot = null;
    eagles._dot = 0; if (gateWeavers) gateWeavers._dot = 0;
    const cbP = new THREE.Vector3(), cbT = new THREE.Vector3();
    // (by night the key comes from one bearing of the sky, the south celestial pole itself: due south, compass 180, 30 degrees up, the
    // still point the stars and the Milky Way wheel about; the land lies dim and blue under it)
    const windYaw = Math.atan2(-WIND.x, -WIND.y), NIGHT_DIR = POLE_S.clone();
    const clockSet = (u, t) => {
      // which day, and the sun's hour angle
      let H = 0, di = -1;
      for (let i = 0; i < 6; i++) if (u >= days[i][0] && u < days[i][1]) { di = i; const q = (u - days[i][0]) / (days[i][1] - days[i][0]);
        // days 3 to 5: the hour angle runs fast at both ends and slowly through the middle (the open hours last longest); day 2,
        // like days 1 and 6, runs its hours evenly from dawn to dusk, so its sun is low and its shadows long as it ends (the brief's
        // u 0.3)
        if (i >= 2 && i <= 4) { const sq = 2 * q - 1; H = 84 * (0.3 * sq + 0.7 * sq * sq * sq); } else H = lerp(days[i][2], days[i][3], q); }
      if (di < 0) for (let i = 0; i < 5; i++) if (u >= days[i][1] && u < days[i + 1][0]) {
        // (the two long nights take the sun 29 degrees under; in the three short gaps it goes 1.2 degrees of hour angle on, five
        // degrees under the horizon: a blue dip of twilight, no stars)
        const len = days[i + 1][0] - days[i][1], q = (u - days[i][1]) / len, g = i < 2 ? 30 : 1.2;
        H = q < 0.5 ? lerp(days[i][3], days[i][3] + g, q * 2) : lerp(-(84 + g), days[i + 1][2], (q - 0.5) * 2);
      }
      sunAt(H, sunV);
      const e = Math.asin(clamp(sunV.y, -1, 1)) / RAD, w6 = sstep(0.708, 0.728, u), last = u >= 0.708;
      const dayK = sstep(-7, 7, e), sunK = sstep(-4, 6, e), nightI = 1.6 * (1 - sstep(-5, 3, e)), storm = keys(u, STORM);
      U.uNite.value = 1 - sstep(-10, -3, e); U.uPan.value.z = keys(u, PANW);
      let lowK = 1 - sstep(3, 26, e); if (LAST === 'golden') lowK = Math.max(lowK, 0.7 * w6);
      const berg = LAST === 'berg' ? w6 : 0, gold = LAST === 'golden' ? w6 : 0;
      // sky colours
      zenC.copy(K.zenNight).lerp(tmpC.copy(K.zenDay).lerp(K.zenStorm, storm * 0.8).lerp(K.zenBerg, berg * 0.8).lerp(K.zenGold, gold * 0.7), dayK);
      horC.copy(K.horNight).lerp(tmpC.copy(K.horDay).lerp(K.horBerg, berg).lerp(K.horDusk, lowK * 0.8 * (1 - gold)).lerp(K.horGold, gold * 0.85), dayK);
      horC.lerp(tmpC.setRGB(0.2, 0.17, 0.26), storm * 0.42 * dayK);          // a slate storm sky, so the lit rain veils and the Sentinel stand out
      keyC.copy(K.cream).lerp(K.amber, lowK * 0.92);
      // key and fill
      sunL.copy(sunV); if (sunL.y < 0.05) { sunL.y = 0.05; sunL.normalize(); }
      const sunI = 3.15 * sunK * (1 - berg * 0.12), nk = nightI / (sunI + nightI + 1e-4);
      sunL.lerp(NIGHT_DIR, nk).normalize();          // by night a pale skylight key, as a long exposure would see it
      sun.position.copy(sunL).multiplyScalar(200); sun.target.position.set(0, 0, 0); sun.target.updateMatrixWorld(); sun.updateMatrixWorld();
      sun.color.copy(keyC).lerp(K.nightKey, nk); sun.intensity = sunI + nightI;
      // (at dusk the whole sky is still bright: a rose fill lifts the land between the last sun and the stars, so it never goes
      // dull olive or dark crimson)
      const duskK = (1 - sstep(1, 11, e)) * sstep(-13, -5, e);
      hemi.color.copy(K.fillNight).lerp(tmpC.copy(K.fillDay).lerp(K.fillDusk, lowK * 0.45).lerp(K.horBerg, berg * 0.35), dayK).lerp(K.rose, 0.4 * duskK); hemi.intensity = (1 - storm * 0.18 * dayK + 0.42 * duskK) * (1 - 0.5 * U.uNite.value);
      hemi.groundColor.copy(K.gndNight).lerp(K.gndDay, dayK);
      // the light line: dusk shadow sweeping toward us on days 1-5, the fog edge running ahead on the last day
      path.pointAt(u, camP); path.tangentAt(u, camT);
      const cd = camP.x * TD.x + camP.z * TD.z;
      let front = 5000, open = H < 0 ? sstep(11, 21, e) : sstep(8, 18, e);
      if (last) { front = FRONT(u); open = 1; }
      else if (H > 0) front = cd + lerp(1700, -600, di === 0 ? sstep(71, 79, H) : di === 1 ? sstep(67, 79, H) : sstep(56, 79, H)) + 9000 * sstep(-0.5, -3.5, e);
      // heads open 2 to 6 m behind the last day's line (20 m behind the fast dusk and dawn waves); the shade beyond it is deep and blue
      U.uTune.value.set(lerp(20, 1.5, w6), lerp(0.3, LAST === 'fog' ? 1 : 0.85, w6), lerp(0.35, 0.7, w6));
      hero.setFront(front); hero.setOpen(open); hero.setGrowth(keys(u, GROW));
      U.uFrac.value = keys(u, FRAC); U.uWet.value = keys(u, WET); U.uRain.value = keys(u, RAIN);
      const lidFogK = LAST === 'fog' ? w6 * (1 - sstep(-20, 70, front - cd)) : 0;          // (the fog thins as the line runs out ahead of the lens)
      U.uCloud.value.set(WIND.x * t * 42, WIND.y * t * 42, 0.78 * sunK * (1 - storm * 0.5) * (last ? 0.45 * sstep(0.83, 0.9, u) : 1), 0);
      // day 3: one long cloud shadow lies across the mid-field beyond the near stack (from about 60 m to 260 m ahead of the lens at u 0.4)
      // and drifts on with the wind as we come up on it
      { const sC = 0.4 * PL_LEN + 152 + (u - 0.4) * PL_LEN * 0.55, cp = path.posAtDist(sC, cbP), ct = path.tangentAtDist(sC, cbT), cl = Math.max(1e-4, Math.hypot(ct.x, ct.z));
        U.uCb.value.set(cp.x, cp.z, 520, 0.8 * sunK * sstep(0.36, 0.385, u) * (1 - sstep(0.45, 0.472, u)));
        { const ax = -ct.z / cl, az = ct.x / cl, tx = ct.x / cl, tz = ct.z / cl; U.uCbAx.value.set(ax * 0.92 - tx * 0.39, az * 0.92 - tz * 0.39, 5.2, 0); } }
      // the rare cloud island: a blue shadow 40 m deep and 150 m wide that sails up the valley against us; its leading edge is 12 m
      // ahead at u 0.81, it passes over the lens at 0.822 and its trailing edge clears us by 0.832, heads reopening behind it
      if (RARE) { const ia = 30 - (u - 0.81) * PL_LEN * 2.3, tl = Math.max(1e-4, Math.hypot(camT.x, camT.z));
        U.uIsle.value.set(camP.x + camT.x / tl * ia, camP.z + camT.z / tl * ia, 21, sstep(0.772, 0.794, u) * (1 - sstep(0.862, 0.886, u)));
        U.uIsleAx.value.set(camT.x / tl, camT.z / tl, 0.26, 8); }
      // fog and haze
      // the band of open sky along the horizon under the far edge of the last day's lid: the horizon's own colour, warmed by the sun
      // that lights it from beyond the bank (every look has its own: pearl on the fog morning, amber on the golden afternoon)
      const lidA = w6 * (1 - 0.35 * sstep(0.84, 0.97, u));
      tmpC.copy(horC).lerp(keyC, 0.5).multiplyScalar(1.2 * (0.25 + 0.75 * dayK)); U.uBand.value.set(tmpC.r, tmpC.g, tmpC.b, lidA);
      // (under the sea fog the air is damp: the far plain pales into the light of that band, and the koppie stands in it as a dark
      // shape; by night the air is clear)
      fogC.copy(horC).multiplyScalar(0.9).lerp(zenC, 0.12).lerp(tmpC.multiplyScalar(0.58), lidFogK * 0.85);
      haze.color.copy(fogC); haze.density = (0.00075 + storm * 0.0007 * dayK + lidFogK * 0.0005 + berg * 0.0006) * (1 - 0.45 * U.uNite.value);
      SU.uMtA.value = 1 - 0.3 * lidFogK;
      // sky uniforms
      SU.uZen.value.copy(zenC); SU.uHor.value.copy(horC); SU.uFogC.value.copy(fogC); SU.uSunD.value.copy(sunV);
      SU.uSunE.value.copy(keyC).multiplyScalar(26 * sstep(-1.2, 1.5, e));
      SU.uGlow.value.copy(keyC).multiplyScalar((0.22 + 0.78 * lowK) * sstep(-15, -3, e) * 0.85 * (1 + 1.1 * (1 - sstep(-3, 1, e)) * sstep(-13, -5, e)));
      SU.uCloudCol.value.copy(K.cloudNight).lerp(tmpC.copy(keyC).multiplyScalar(0.92 - storm * 0.56), dayK);
      SU.uCloudSh.value.copy(K.cloudShNight).lerp(tmpC.copy(K.cloudShDay).multiplyScalar(1 - storm * 0.8).lerp(K.amber, lowK * 0.16 * (1 - storm * 0.6)), dayK);
      // (each sample day has its own sky: day 3 cloud streets, day 4 a hard clear blue with a few wisps, day 5 heavier streets coming in)
      const dv = u >= days[3][0] && u < days[3][1] ? 1 : u >= days[4][0] && u < days[4][1] ? -1 : 0;
      if (dv > 0) SU.uZen.value.lerp(tmpC.setRGB(0.03, 0.14, 0.5), 0.5 * dayK);
      SU.uCloudP.value.set(cloud0.x - t * 0.2, cloud0.y + t * 0.02, 0.5 - storm * 0.17 + (last ? 0.07 : 0) - berg * 0.05 + (dv > 0 ? 0.11 : dv < 0 ? -0.055 : 0), 1);
      SU.uVeil.value.z = keys(u, VEIL) * dayK * 0.92; SU.uVeilCol.value.copy(keyC).multiplyScalar(0.7 + 0.8 * sunK).lerp(horC, 0.18);
      // (under storm cloud and in the low light of dusk and dawn the range is a hazy slate-violet, near the colour of the horizon)
      SU.uMtn.value.copy(K.mtnNight).lerp(K.mtnDay, dayK).lerp(tmpC.setRGB(0.3, 0.29, 0.44).multiplyScalar(0.2 + 0.8 * dayK).lerp(horC, 0.45), Math.min(0.8, 0.7 * storm + 0.5 * lowK));
      SU.uNight.value = (1 - dayK) * sstep(-7, -13, e); SU.uStarRot.value = u * 9.5;
      SU.uBelt.value.w = (1 - sstep(1.5, 13, e)) * sstep(-13, -2.5, e) * (1 - storm);
      SU.uLid.value.set(lidA, LAST === 'fog' ? 46 : 50, LAST === 'fog' ? 1.5 : 1.3, LAST === 'fog' ? 0.0012 : 0.0009);
      SU.uLidCol.value.copy(LAST === 'fog' ? K.lidFog : K.lidBank).multiplyScalar(0.25 + 0.75 * dayK);
      U.uSkyRef.value.copy(horC).lerp(zenC, 0.45).add(tmpC.copy(SU.uGlow.value).multiplyScalar(0.3)).lerp(SU.uVeilCol.value, 0.3 * SU.uVeil.value.z);
      // (standing water mirrors the rose arch opposite a low sun, and by night the glow of the stars)
      U.uSkyRef.value.add(tmpC.setRGB(0.42, 0.2, 0.25).multiplyScalar(0.7 * SU.uBelt.value.w)).add(tmpC.setRGB(0.1, 0.15, 0.3).multiplyScalar(U.uNite.value));
      U.uGlowRef.value.copy(SU.uGlow.value).multiplyScalar(1.7).lerp(tmpC.copy(horC).multiplyScalar(1.3), 0.3);
      // (and the lit rain veils, on the bearing they hang on)
      U.uVeilM.value.set(SU.uVeil.value.x, SU.uVeil.value.y, SU.uVeil.value.z, 0); U.uVeilC.value.copy(SU.uVeilCol.value);
      uShAmt.value = sunK;
      if (damWater) damWater.material.color.copy(U.uSkyRef.value).multiplyScalar(0.75);
      // wildlife light (the kit creatures carry their own light uniforms)
      for (const f of lit) {
        const uu = f.uniforms, k = f._dot == null ? (last ? sstep(-10, 10, front - cd) : 1) : sstep(-10, 10, front - f._dot);
        uu.uSunDir.value.copy(sunL); uu.uSunColor.value.copy(sun.color).multiplyScalar(sun.intensity * 0.52 * (0.12 + 0.88 * k));
        uu.uSkyColor.value.copy(hemi.color).multiplyScalar(hemi.intensity * 0.75); uu.uGroundColor.value.copy(hemi.groundColor).multiplyScalar(1.0);
      }
      return { open, sunK, front, cd };
    };
    clockSet(0, 0);
    const SUNSET = new THREE.Vector3().copy(WEST).multiplyScalar(Math.cos(13 * RAD)).addScaledVector(NORTH, Math.sin(13 * RAD)), poiV = new THREE.Vector3();
    const camW = new THREE.Vector3();
    const sunPoi = (t, u) => { path.pointAt(u, poiV); poiV.y += 30; return poiV.addScaledVector(SUNSET, 900); };
    const poiD = new THREE.Vector3();
    // as the lens comes up on the day-3 stack the gaze lifts (no turn): the whole stack and its tree, crown and a strip of sky over it
    const skyV = new THREE.Vector3(), skyPoi = (t, u) => { path.posAtDist(u * PL_LEN + 34, skyV); skyV.y += 24; return skyV; };
    const downPoi = (t, u) => { const sd = u * PL_LEN + 46; path.posAtDist(sd, poiD); poiD.y = hAt(poiD.x, poiD.z) - 1.5; return poiD; };

    return {
      scene, path, duration: DURATION,
      // screen time: unhurried past the Sentinel in the rain, quicker through the bare second day and its nights, slowest for the tide
      // and the low pass through the bloom (u 0.73-0.89), back to the average for the climb to the portal
      pace: (u) => 1 - 0.1 * (1 - sstep(0.085, 0.12, u)) + 0.3 * sstep(0.17, 0.205, u) * (1 - sstep(0.285, 0.32, u)) - 0.26 * sstep(0.69, 0.735, u) * (1 - sstep(0.86, 0.9, u)),
      camera: { fov: 62, near: 0.3, far: 5200, lookAhead: 34, sway: 0.45, bank: 0.35 },
      // the gaze swings toward the setting sun of days 1 and 2 (so the disc stands to the right of the gaze and the shadows come at
      // the lens), then rests on Kokerboom Koppie
      pois: [{ at: new THREE.Vector3(SEN.x, SEN.y + 16, SEN.z), from: 0, to: 0.1, fade: 0.25, weight: 0.34 }, { at: sunPoi, from: 0.07, to: 0.15, weight: 0.24 }, { at: sunPoi, from: 0.215, to: 0.345, weight: 0.42 },
        { at: new THREE.Vector3(0, 25, 0), from: 0.315, to: 0.52, weight: 0.5 }, { at: new THREE.Vector3(0, 25, 0), from: 0.36, to: 0.9, weight: 0.62 },
        // over the crest of the ridge the gaze drops to the foot of its far slope: the lens looks down over the bloom, the herd and the wash
        { at: downPoi, from: 0.468, to: 0.585, weight: 0.72 }, { at: skyPoi, from: 0.385, to: 0.468, weight: 0.26 }],
      portal: { shape: 'circle', radius: A.portalSeat.radius || 7, color: '#fff0c8', glow: 1.1, revealDistance: 340, tilt: true },
      post: { exposure: 1.0, bloom: { strength: 0.3, radius: 0.6, threshold: 0.95 },
        grade: { saturation: 1.1, contrast: 1.05, tint: '#fffaf2', shadowTint: '#070a16', vignette: 0.3, grain: 0.02, aberration: 0 } },
      ride: 'none', heightAt: hAt,
      update(dt, t, camera, u) {
        time.value = t;
        const S = clockSet(u, t);
        camW.setFromMatrixPosition(camera.matrixWorld);
        sky.position.copy(camW);
        // treadmill windows ride ahead of the lens along the path
        // (when the lens cranes up over the light line the heads are drawn a little larger, so the field keeps its colour from 7 m)
        const altK = 1 + 0.14 * clamp(camW.y - hAt(camW.x, camW.z) - 2.2, 0, 4), craneK = sstep(0.735, 0.762, u) * (1 - sstep(0.8, 0.83, u));
        for (const w of treads) { w.uWin.value.set(camW.x + camT.x * w.lead, camW.z + camT.z * w.lead, w.uWin.value.z, w.uWin.value.w); w.uHead.value = w.head * altK; }
        // (where the lens rides higher, over the light line, the real daisies are drawn a third larger: whole flowers with petals and eyes)
        lens.uWin.value.set(camW.x + camT.x * (8.5 + 1.5 * craneK), camW.z + camT.z * (8.5 + 1.5 * craneK), 20, 1 / 20); lens.uLensK.value = 1 + 0.3 * craneK;
        // what is drawn when (meshes only; no light, material or uniform set changes): the lens daisies from the seedlings of
        // day 2 to the valley floor, the hero's own tiers as the lens comes within their range, rocks and trees until the lens is
        // well past them, bossies until they are 30 m behind it, the rain while it falls
        lens.mesh.visible = lens.shade.visible = u > 0.15 && u < 0.93; lens.mesh.geometry.instanceCount = lens.shade.geometry.instanceCount = u < 0.336 ? lens.n0 : lens.n;
        // (the painted heads of the ground thin under the real plants, while those are about)
        U.uReal.value.x = sstep(0.3, 0.36, u) * (1 - sstep(0.875, 0.9, u));
        flies.uWin.value.set(camW.x + camT.x * 7, camW.z + camT.z * 7, 18, 1 / 18);
        flies.uFly.value = S.open * S.sunK * sstep(0.37, 0.4, u) * sstep(-25, 15, S.front - S.cd); flies.mesh.visible = flies.uFly.value > 0.02;
        for (const w of treads) w.mesh.visible = u > 0.285;
        // (of each treadmill the heads that can be present at this share in flower are drawn, the first of its ordered buffers:
        // see makeTread; the heads left out have no size and draw nothing)
        for (const w of treads) w.mesh.geometry.instanceCount = treadCount(w.draws, U.uFrac.value);
        HT.mid.visible = u > 0.75; HT.near.visible = false; for (const m of HT.cush) m.visible = u > 0.838;      // (the lens plants run on to the foot of the koppie: the hero's own near tier is not drawn)
        // (rocks and trees by the rule of place: see GB)
        for (let g = 0; g < PG.length; g++) { const on = g >= NG - 1 || u * PL_LEN < (g + 1) * GB; for (const m of PG[g]) m.visible = on; }
        // (the near rock of the plain by the same rule of place)
        for (let g = 0; g < NPG.length; g++) { const on = g >= NG - 1 || u * PL_LEN < (g + 1) * GB; for (const m of NPG[g]) m.visible = on; }
        { const thr = u * PL_LEN - 30;
          for (const b of boss) { const on = b.sA[0] >= thr && b.sA[b.n - 1] < thr + 30 + BOSS_AHEAD; b.m.visible = on; if (!on) continue;
            let lo = 0, hi = b.n; while (lo < hi) { const mid = (lo + hi) >> 1; if (b.sA[mid] >= thr) lo = mid + 1; else hi = mid; } b.g.instanceCount = lo; } }
        hero.update(dt, t, camera);
        // stutter-frames: the herd and the ostriches move in three snaps a second and hold still between them
        const tq = Math.floor(t * 3 + 1e-4) / 3;
        gemsUpdate(u, t);
        // the ostriches run their own steady race (ostrichAt) and the lens overtakes them; their snaps are half as long as the herd's
        const uo = Math.floor(u * 240 + 1e-4) / 240, ou = ostrichAt(uo);
        // (each sample day is a week on: the birds are simply there on the morning of day 5, never parked on the axis before it)
        cockH.object.visible = hensH.object.visible = u > HERD_OFF && u < BIRDS_OFF;
        cockH.update(dt, tq, camera, ou); hensH.update(dt, tq, camera, ou + 3.5 / PL_LEN);
        fauna.update(dt, t, camera, u);
        rain.setOpacity(U.uRain.value * 0.85); rain.object.visible = U.uRain.value > 0.004; beetles.setOpacity(S.open * S.sunK * U.uFrac.value * (u > 0.36 ? 0.9 : 0) * sstep(-25, 15, S.front - S.cd));
        beetles.uniforms.uCenter.value.y = hAt(camW.x + camT.x * 12, camW.z + camT.z * 12) + 0.95;
        set.update(dt, t, camera);
        // the tortoise: a fifth of the lens's speed along its rut; its shadow takes over the last sphere caster while it is about
        { const on = u > 0.775 && u < 0.868, tz = 161.7 - (clamp(u, 0.77, 0.87) - 0.84) * PL_LEN * 0.2, tx = rutX(tz), ty = hAt(tx, tz);
          tortMesh.visible = on; tortU.value.set(tx, ty - 0.012, tz, Math.atan2(rutX(tz - 0.6) - tx, -0.6));
          if (on) U.uCast.value[9].set(tx, ty + 0.17, tz, 0.33); else U.uCast.value[9].copy(cast9keep); }
        pumpHead.rotation.y = windYaw + 0.45 * Math.sin(t * 0.9) + 0.18 * Math.sin(t * 2.7 + 1);
        pumpWheel.userData.spin.value = t * 37;
      },
      dispose() { hero.dispose(); },
    };
  },
};
