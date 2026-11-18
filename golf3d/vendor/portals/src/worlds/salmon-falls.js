// AGAINST THE FALLS: Brooks Falls at three times life size, flown as one sockeye among thousands.
//
// Layout (world = the hero's local frame): the river runs toward +Z, we swim upstream toward -Z. Lower river
// surface y 0, upper river y 6, the ledge (hero, src/parts/salmon-falls.js) across z 0. Left bank -X (the sun's
// side by day), right bank +X. The route: in through a deep pool (11 m) where a drowned spruce lies along the bed on
// our right, its root wad fanned up 42 m in and the red ribbon streaming over it, up the lower river, three
// porpoising arcs over the riffles, down into the plunge pool, a failed leap under three bears, swept back under
// the boil to the tail of the pool (gulls squabbling on a gravel spit, a wolf with a fish on the bar against young
// spruce, which turns and trots into the reedgrass), the run at the ledge (up the pool past a shoal where two bears
// fish 15 m off, then a swing along the face with the lip bears on our left), a dive under the queue of fish at the
// foot, the clean leap past the apex bear's jaws, splashdown, and the calm upper river to the outlet channel where a
// fallen spruce spans the water over the portal. world.beats holds the u of every moment for this seed.
//
// The water surface (from below: Snell's window with the forest round its rim, the bed mirrored outside it, foam
// under the boil), the shoal (three tiers: modelled, low, crossed cards), the eight companions, the bed, the root
// wad and logs, the sun shafts, wolf, standing gulls, mergansers, the halo of drops at the snap and the sprites are
// built here; sky, terrain, trees, grass and flying birds come from the kit. Under water the key and fill lights are
// filtered to the water's colour (update), so an evening or a dawn stays copper only in the window overhead.
import * as THREE from 'three';
import { makePath, makeRng, clamp, lerp, smoothstep } from '../kit/core.js';
import * as Water from '../kit/water.js';
import * as T from '../kit/terrain.js';
import * as flora from '../kit/flora.js';
import * as F from '../kit/fauna.js';
import * as FX from '../kit/fx.js';
import { makeSky, makeLightRig } from '../kit/sky.js';
import { buildHero, makeBuilder, salmonGeometry, salmonColours, GLSL_SALMON_SKIN } from '../parts/salmon-falls.js';

const PALETTE = ['#C4262E', '#8C8A3A', '#2E5E4C', '#E2B13C', '#1E3A2D', '#F1F5F2', '#3A2A1F'];
const LIP = 6, DUR = 45;
// GREEN DUSK BY DEPTH, a law of the water (the same in every reach, at every moment and in every camera): light falls with
// depth. The water's own colour goes from the green of the shallows (the look's vol) to the design's dark pool green
// (PALETTE[2], #2E5E4C, at the look's own strength) as the EYE goes from DUSK_EYE[0] to DUSK_EYE[1] metres under the
// surface at its place: 1 m, because in the runs the eye rides 0.74 to 0.8 m under and the runs stay as they are; 3 m,
// the depth the route holds through the plunge pool; the entry reach, where the eye rides 7.5 m under, lies in the dusk
// too. And the bed, and what lies on it, is lit by its OWN depth: in full down to DUSK_BED[0], 3 m (the deepest a run's
// bed lies, where it is cut under the route), falling to DEEP_LIGHT of it at DUSK_BED[1], 7 m, the pool's floor, the red
// going first. The haze's density (the 60 m of visibility) is not touched.
const DUSK_EYE = [1, 3], DUSK_BED = [3, 7], DEEP_LIGHT = [0.4, 0.56, 0.5];
const GLSL_DEEP = `mix(vec3(1.), vec3(${DEEP_LIGHT.map((v) => v.toFixed(3)).join(', ')}), smoothstep(${DUSK_BED[0].toFixed(1)}, ${DUSK_BED[1].toFixed(1)}, DEPTH))`;
const ss = smoothstep;
const hexLin = (h) => { const c = new THREE.Color(h); return [c.r, c.g, c.b]; };
const mul = (c, k) => [c[0] * k, c[1] * k, c[2] * k];
const mix3 = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];

// ---------------------------------------------------------------- the looks (hour, season, weather by seed)
// sun = unit vector toward the sun (the hero's own presets), air = haze colour and density above water (in every look
// the air is clear over the brief's distances: at airK 0.0032 and under, the far bank, 150 m off, keeps four fifths of
// its own colour and the ledge at 20 m all of it; the mist of a misty look is the rag on the upper river, see mistPos),
// vol = colour of the water volume, leaf = birch foliage, snow = first snow on the banks. uw = for the hours with a low
// sun: under water the light is brought up to the default look's (see 'under water the light is the water's').
const LOOKS = {
  september: { title: 'Against the Falls', hour: 'day', season: 'september', weather: 'clear', preset: 'day', sun: [-0.816, 0.574, -0.071],
    sky: { zenith: '#3f6fb4', horizon: '#b9cfe0', clouds: { coverage: 0.3, scale: 1.5, softness: 0.25 } }, air: '#a9c0cf', airK: 0.0019, vol: [0.07, 0.19, 0.125],
    birch: true, gold: '#E2B13C', leaf: 0.5, mist: 0.1, exposure: 1.0, sat: 1.1, tint: '#fffaf2', shadow: '#0a1420', light: 1, amb: 1 },
  evening: { title: 'Against the Falls, Evening', hour: 'evening', season: 'september', weather: 'clear', preset: 'goldenHour', sun: [0.6, 0.26, 0.76],
    sky: { clouds: { coverage: 0.36, scale: 1.4 } }, air: '#c9a488', airK: 0.0024, vol: [0.05, 0.17, 0.14],
    birch: true, gold: '#E8A13A', leaf: 0.5, mist: 0.16, exposure: 1.0, sat: 1.08, tint: '#fff2e0', shadow: '#0c1428', light: 1, amb: 1.25, uw: { keep: 0.24, shaft: 0.85 } },
  dawn: { title: 'Against the Falls, First Light', hour: 'dawn', season: 'september', weather: 'clear', preset: 'dawn', sun: [-0.95, 0.12, -0.28],
    sky: {}, air: '#d8b8b4', airK: 0.0026, vol: [0.07, 0.165, 0.135],
    birch: true, gold: '#D9A848', leaf: 0.4, mist: 0.5, exposure: 1.05, sat: 1.05, tint: '#fff0ec', shadow: '#141228', light: 1, amb: 1.2, uw: { keep: 0.3, shaft: 0.8 } },
  july: { title: 'Against the Falls, July', hour: 'day', season: 'july', weather: 'clear', preset: 'day', sun: [-0.816, 0.574, -0.071],
    sky: { zenith: '#3a6cba', horizon: '#bcd4e6', clouds: { coverage: 0.42, scale: 1.3 } }, air: '#a8c4d4', airK: 0.0019, vol: [0.06, 0.19, 0.135],
    birch: true, gold: '#6FA53A', leaf: 0.08, mist: 0.08, exposure: 1.0, sat: 1.1, tint: '#fbfff6', shadow: '#0a1620', light: 1, amb: 1 },
  october: { title: 'Against the Falls, First Snow', hour: 'day', season: 'october', weather: 'clear', preset: 'day', sun: [-0.86, 0.36, -0.36],
    sky: { zenith: '#5b7fae', horizon: '#c9d3dc', clouds: { coverage: 0.55, scale: 1.2, softness: 0.4 } }, air: '#b6c2cc', airK: 0.0026, vol: [0.07, 0.155, 0.12],
    birch: false, gold: '#B89A58', leaf: 0.12, mist: 0.22, snow: 1, exposure: 0.95, sat: 1.0, tint: '#f4f8ff', shadow: '#0e1626', light: 0.85, amb: 1 },
  rain: { title: 'Against the Falls, Soft Rain', hour: 'day', season: 'september', weather: 'rain', preset: 'overcast', sun: [-0.816, 0.574, -0.071],
    sky: {}, air: '#9aa8a6', airK: 0.0032, vol: [0.065, 0.145, 0.105],
    birch: true, gold: '#C9A244', leaf: 0.4, mist: 0.4, rain: 1, exposure: 1.36, sat: 0.98, tint: '#f2f8f4', shadow: '#0c1618', light: 1, amb: 1.1 },
  night: { title: 'Against the Falls, Moonlight', hour: 'night', season: 'september', weather: 'clear', preset: 'night', sun: [-0.6, 0.6, -0.5],
    sky: {}, air: '#1c2a44', airK: 0.0024, vol: [0.03, 0.06, 0.06],
    birch: true, gold: '#8f8a66', leaf: 0.3, mist: 0.3, exposure: 1.35, sat: 0.9, tint: '#e8f0ff', shadow: '#060a18', light: 1, amb: 1.3 },
};

// ---------------------------------------------------------------- shared GLSL (light uniforms are the hero's)
const GLSL_LIGHT = /* glsl */`
uniform float uTime; uniform vec3 uSun, uSunCol, uSkyCol, uGndCol, uCam;
float h11(float n){ return fract(sin(n*127.1)*43758.5453); }
float h21(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }
float vn(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f);
  return mix(mix(h21(i),h21(i+vec2(1.,0.)),f.x), mix(h21(i+vec2(0.,1.)),h21(i+vec2(1.,1.)),f.x), f.y); }
float fbm(vec2 p){ return vn(p)*.5 + vn(p*2.03+7.1)*.3 + vn(p*4.1+13.7)*.2; }
vec3 safeN(vec3 v){ return v / max(length(v), 1e-5); }
vec3 hemi(vec3 n){ return mix(uGndCol, uSkyCol, n.y*.5+.5); }
`;

// ---------------------------------------------------------------- the river surface, seen from above and below
// aD = (depth m, riffle 0..1, under-the-boil 0..1, calm 0..1); aBed = how deep the bed the eye in the water sees lies under
// the surface, m (the lower river's is aD.x; the upper river's is the ledge's own rock, which the world's terrain is not)
const SURF_VERT = /* glsl */`
#include <fog_pars_vertex>
uniform float uTime; uniform vec4 uWave;
attribute vec4 aD; attribute float aBed;
varying vec3 vP; varying vec4 vD; varying float vBed;
void main(){
  vBed = aBed;
  vec3 p = position;
  float amp = (.3 + 1.5*aD.y)*(1. - .8*aD.w);
  p.y += (sin(p.x*.55 + p.z*.31 - uTime*1.7)*.03 + sin(p.x*.19 - p.z*.47 + uTime*1.1)*.035)*amp;
  float rw = length(p.xz - uWave.xy) - uWave.z;
  p.y += uWave.w*exp(-rw*rw*.03)*(1. - aD.w);
  vP = p; vD = aD;
  vec4 mvPosition = modelViewMatrix*vec4(p, 1.);
  gl_Position = projectionMatrix*mvPosition;
  #include <fog_vertex>
}`;
const SURF_FRAG = /* glsl */`
#include <fog_pars_fragment>
${GLSL_LIGHT}
uniform vec3 uPool, uAmber, uWhite, uGold, uHorizon, uSkyHor, uVol, uBedCol, uCeil;
uniform float uLeaf, uRain, uGoldAmt, uGlint, uWK;
uniform float uDusk;          // 0..1: how far the eye has gone down into the dusk (DUSK_EYE): the sky's share of the mirror's sheen falls with it
uniform vec4 uComp[8]; uniform float uCompS[8]; uniform vec3 uSunAir, uSkyAir;
uniform vec4 uRing[8];        // where a companion last left or met the water on an arc: (x, z, seconds since, strength)
uniform vec4 uHole; uniform vec3 uHoleAx; uniform float uHoleK; uniform vec4 uRaft;
uniform float uJetX[24];      // where the jets of the falls drive down into the pool (x; unused entries far away)
// uSubm = is the eye under water in the lower river (x) or the upper (y): 1 yes, 0 no, .5 right at the surface (then the
// fragment's own height decides). uLedge = the lip bears as the pool mirrors them (x, half width, top y, 0..1).
uniform vec2 uSubm; uniform vec4 uWave; uniform vec3 uDrown; uniform vec4 uLedge[16]; uniform float uMirK;
// the mergansers' runs: uDuck = (start x, z, the second it starts, heading), uDuckT = the ducks' clock
uniform vec4 uDuck[8]; uniform float uDuckT; uniform float uDuckL[8];      // (uDuckL = how far each has run when it leaves the water)
// the forest as the water mirrors it: tTrees = the canopy of the banks seen from above (r = height over the water / 80,
// g = 1 where it is birch, poplar, alder or reedgrass and 0 where it is spruce), uTreeMap = (x0, z0, 1/width, 1/length);
// uGoldRef = the lit gold as the water gives it back, uPortalR = the portal (x, y, z, radius), uPortalCol its glow
uniform sampler2D tTrees; uniform vec4 uTreeMap, uPortalR; uniform vec3 uGoldRef, uSpruceRef, uPortalCol; uniform float uHazeK;
uniform vec3 uSpruceLit;      // the colour of a spruce bough's lit needles
varying vec3 vP; varying vec4 vD; varying float vBed;
// Seen from below, the forest stands round the rim of Snell's window. ax = 0..1 round the window, y = height in it.
// spires: one spruce in most of N cells, each with its own place, width, height and tiers of boughs (some cells are
// gaps of sky); lobes: round birch crowns. Three ranks of spires with different N never line up into a pattern.
// Each also gives, of the tree that covers the place most, where in that tree the place is. spires, s = (across the
// tree, -1 at the side of its outline toward lesser ax and 1 at the other; the place in a tier of boughs, 0 at a
// tier's widest and 1 at the next widest above; the height in the tree, 0 at its foot and 1 at its top). lobes,
// s = the place in the crown in its own half width and half height from its middle.
float spires(float ax, float y, float N, float seed, float hLo, float hHi, float wK, out vec3 s){
  float x = ax*N, i0 = floor(x), cov = 0.; s = vec3(0.);
  for (int k = -1; k <= 1; k++) {
    float ci = mod(i0 + float(k), N), r1 = h11(ci*1.31 + seed), r2 = h11(ci*2.17 + seed*1.7 + 5.), r3 = h11(ci*.73 + seed*2.3 + 9.);
    float cx = i0 + float(k) + .5 + (r1 - .5)*.7, h = mix(hLo, hHi, r3*r3), w = wK*(.5 + r2);
    float d = abs(x - cx)/w, yy = clamp(y/max(h, 1e-3), 0., 1.), tq = fract(yy*(4. + 3.*r1) + r3*3.);
    float prof = (1. - yy)*(.68 + .32*abs(tq - .5)*2.) + .05;
    float cv = step(.2, r2)*(1. - smoothstep(prof - .12, prof + .12, d))*(1. - smoothstep(h*.94, h, y));
    if (cv > cov) { cov = cv; s = vec3(clamp((x - cx)/(w*prof), -1., 1.), tq, yy); }
  }
  return cov;
}
float lobes(float ax, float y, float N, float seed, out vec2 s){
  float x = ax*N, i0 = floor(x), cov = 0.; s = vec2(0.);
  for (int k = -1; k <= 1; k++) {
    float ci = mod(i0 + float(k), N), r1 = h11(ci*1.91 + seed), r2 = h11(ci*3.07 + seed*1.3 + 2.), r3 = h11(ci*.57 + seed*2.9 + 4.);
    float cx = i0 + float(k) + .5 + (r1 - .5)*.8;
    vec2 d = vec2((x - cx)/(.13 + .11*r2), (y - .045 - .07*r3)/(.045 + .04*r2));
    float bump = .13*sin(atan(d.y, abs(d.x) + 1e-4)*5. + r1*20.);
    float cv = (1. - smoothstep(.8, 1.05, length(d) + bump))*step(.42, r3 + r2*.5);
    if (cv > cov) { cov = cv; s = d; }
  }
  return cov;
}
// a standing bear side on, in its own measure (sx: along it from its middle, in 1.25 times uLedge's half width, the
// head toward +; by: 0 at 5.2 m over the pool, 1 at its top): the long barrel of the body, the shoulders' hump, two legs, the head
float lipBear(float sx, float by){
  float bx = abs(sx);
  float bodyM = 1. - smoothstep(.82, 1.08, length(vec2(bx/.98, (by - .62)/.36)) - .1*smoothstep(.5, .0, bx)*step(.62, by));
  float legM = (1. - smoothstep(.13, .27, abs(bx - .56)))*smoothstep(-.06, .06, by)*(1. - smoothstep(.45, .6, by));
  float headM = 1. - smoothstep(.2, .32, length(vec2(sx - 1.02, (by - .6)*.9)));
  return max(max(bodyM, legM), headM);
}
// a strand of the falls as the window shows them: the same rule as the ledge's own sheet (parts, sheetMaterial). xc =
// the place across the fall in strand widths, tc = the fall clock in strand lengths; every strand has a clock of its own
// and surges of a length of its own (no rows, so no cells) and is a file of surges coming down head first. Returns
// (how much water, its slope across).
vec2 fallStrand(float xc, float tc, float sd, float k){
  float i = floor(xc), f = fract(xc), w = f*f*(3. - 2.*f);
  vec2 hh = vec2(h11(i*.731 + sd), h11((i + 1.)*.731 + sd)), ph = hh*23. + tc*(.8 + .4*fract(hh*7.3));
  vec2 j = floor(ph), g = fract(ph), e = smoothstep(.55, 1., g);
  float a = mix(h21(vec2(i, j.x) + sd)*(.75 + .5*g.x), h21(vec2(i, j.x + 1.) + sd)*.75, e.x);
  float b = mix(h21(vec2(i + 1., j.y) + sd)*(.75 + .5*g.y), h21(vec2(i + 1., j.y + 1.) + sd)*.75, e.y);
  return vec2(.5 + (mix(a, b, w) - .451)*k, (b - a)*6.*f*(1. - f)*k);     // (.451: the mean of a and b by the two lines above)
}
// a pavement of clots (the rafts of froth are crowds of them): x = each clot's own number, y = 1 on a clot, 0 in the
// dark between clots
vec2 cobbles(vec2 p){
  vec2 g = p*.95 + vec2(vn(p*.6), vn(p*.6 + 9.))*.7, gi = floor(g), gf = fract(g);
  float dm = 9., id = 0.;
  for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
    vec2 o = vec2(float(i), float(j)), cc = o + .5 + (vec2(h21(gi + o), h21(gi + o + 37.)) - .5)*.7 - gf;
    float dd = dot(cc, cc); if (dd < dm) { dm = dd; id = h21(gi + o + 71.); }
  }
  return vec2(id, 1. - smoothstep(.09, .3, dm));
}
// the bed's cobbles as the mirror shows them, by the count and the sizes the world deals them on the bed: scattered, not
// a pavement (a stone in two of three cells of 1.3 m), each .4 to 1.3 m across. Returns (metres to the nearest stone's
// rim, below 0 on the stone; how pale that stone is; the way out from its middle).
vec4 bedStones(vec2 p){
  vec2 g = p/1.3, gi = floor(g), gf = fract(g), dv = vec2(0., 1.);
  float dm = 9., id = 0.;
  for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
    vec2 o = vec2(float(i), float(j)), cc = (o + .5 + (vec2(h21(gi + o + 3.7), h21(gi + o + 41.)) - .5)*.62 - gf)*1.3;
    float r3 = h21(gi + o + 71.), lc = max(length(cc), 1e-3);
    float an = atan(cc.y, cc.x + 1e-5);
    float dd = lc*(1. + .1*sin(an*3. + r3*40.) + .06*sin(an*5. + r3*71.)) - (.2 + .46*r3*r3) + 9.*step(h21(gi + o + 17.), .34);
    if (dd < dm) { dm = dd; id = fract(r3*7.3); dv = -cc/lc; }
  }
  return vec4(dm, id, dv);
}
// how high over the land a ray that leaves the water through the window points (the sine of its rise), from its upward
// cosine c in the water. The window is drawn wider than the true cone (its rim at the cosine .33, 71 degrees from
// straight up, where the true rim stands at 48.6), so that a level eye has its near rim across the top of the frame:
// the land's level lies on that rim, the zenith stays the zenith, and the rise between them is spread over the wider span
float skyRise(float c){
  return pow(clamp((c - .33)/(1. - .33), 0., 1.), .8);
}
void main(){
  float t = uTime, dep = vD.x, rif = vD.y, calm = vD.w;
  vec2 q = vP.xz;
  float fl = mix(1., 2.2, rif)*(1. - .7*calm);
  float n1 = fbm(vec2(q.x*.35, q.y*.12 - t*.33*fl));
  float n2 = fbm(vec2(q.x*1.3 + n1, q.y*.5 - t*1.05*fl));
  float n3 = vn(vec2(q.x*4.2, q.y*1.6 - t*2.5*fl));
  float k = mix(.34, .7, rif)*(1. - .6*calm);
  // the pool under the face is choppy: dark troughs between the lights, and short wavelets that run across the
  // current (seen from the swing along the lip they lie across the view, and break the mirrored falls into bands)
  float chop = (1. - calm)*smoothstep(5., 10., q.y)*(1. - smoothstep(34., 48., q.y));
  k += .3*chop;
  vec3 n = safeN(vec3((n2 - .5)*k + (n3 - .5)*k*.5, 1., (n1 - .5)*k + (vn(q*2.3 + t*.3) - .5)*k*.5
    + ((vn(vec2(q.x*.7 + n1*2., q.y*2.3 - t*1.5)) - .5)*.62 + (vn(vec2(q.x*1.9 - n2, q.y*5.1 - t*2.3)) - .5)*.3)*chop));
  // rain: expanding rings in a grid of cells
  float ring = 0.;
  if (uRain > 0.) {
    vec2 rc = q*.8, ri = floor(rc), rf = fract(rc) - .5; float rh = h21(ri), rr = fract(t*.8 + rh*7.);
    vec2 ro = rf - (vec2(h21(ri + 1.7), h21(ri + 5.3)) - .5)*.5;
    ring = (1. - smoothstep(0., .05, abs(length(ro) - rr*.42)))*(1. - rr)*uRain;
    n = safeN(n + vec3(ro.x, 0., ro.y)*ring*1.5);
  }
  // drifting birch leaves
  float dist = length(uCam - vP);
  // (pxA: the breadth of one pixel as an angle, taken from the picture itself, whatever its size and its lens)
  float pxA = min(length(dFdx(vP)), length(dFdy(vP)))/max(dist, .05);
  vec2 qdx = dFdx(q), qdy = dFdy(q);
  vec2 lc = vec2(q.x*.9, (q.y - t*(.45 + 1.3*(1. - calm)))*.9), li = floor(lc);
  vec2 lf = fract(lc) - .5 - (vec2(h21(li + 3.1), h21(li + 7.7)) - .5)*.6;
  // (each is a birch leaf lying on the water: ovate, pointed, turned its own way, a midrib and veins, rust at its edge)
  float la = h21(li + 4.4)*6.2832, lca = cos(la), lsa = sin(la);
  vec2 lp = vec2(lf.x*lca + lf.y*lsa, lf.y*lca - lf.x*lsa)/(.085 + .05*h21(li + 2.9));
  float lu = clamp(lp.x, -1., 1.), lw = .64*sqrt(max(1. - lu, 0.)*.5)*smoothstep(-1., -.5, lu)*(1. + .07*sin(lu*38.));
  float leafSh = (1. - smoothstep(lw - .1, lw + .02, abs(lp.y)))*step(abs(lp.x), 1.);
  float leaf = step(1. - uLeaf*(.5 + n1), h21(li))*leafSh*(1. - smoothstep(22., 55., dist));
  float leafRib = (1. - smoothstep(.02, .07, abs(lp.y)))*.45 + (1. - smoothstep(.06, .16, abs(fract((lu + abs(lp.y)*.9)*4.) - .5)))*.2 + smoothstep(.35, .0, lw - abs(lp.y))*.35;
  vec3 col; float a = 1., wz = 0., fzFar = 0., farK = 1.;
  float eyeSub = vD.w > .5 ? uSubm.y : uSubm.x;
  bool below = eyeSub > .75 || (eyeSub > .25 && uCam.y < vP.y);
  if (!below && vD.w > .5 && uCam.y < vP.y - .04) {
    // the upper river seen from the air under the lip (both leaps): not the ceiling a drowned eye sees, but the root
    // of the falls, green glass drawn out into white as it bends over the rock
    float lipK = smoothstep(-6., -.62, vP.z);
    float fz = vn(vec2(q.x*2.6, q.y*.7 - t*2.4))*.6 + vn(vec2(q.x*8., q.y*1.8 - t*3.6))*.4;
    vec3 green = mix(uPool*2.2, uAmber*1.2, .25)*(uSunCol*.4 + uSkyCol*.5);
    vec3 wht = uWhite*(uSunCol*.3 + uSkyCol*.42 + .03);
    col = mix(green*.9, wht, smoothstep(.55, .8, fz)*.55);
    a = .92*lipK*smoothstep(-.62, -1. - .9*fz, vP.z);          // thinning away to the lip's edge in fibres
  } else if (!below) {
    // the companions' wakes: behind every back that breaks the surface a slim V of two ripple lines, carried by the
    // normal (the reflections bend along them) with only a thread of foam on their crests; the water between and
    // around them stays clear. Never thinner than a pixel and a half.
    // Right under the eye a ripple line would be a broad pale band, so they fade out inside 5 m.
    // And where the eye looks down through the surface at a companion's drowned flank (bodyK), the water's own veil
    // thins: the body just under the surface shows dark red, not as a pale shape the colour of the veil.
    float wake = 0., bodyK = 0., wfoam = 0.; vec2 wn = vec2(0.);
    vec3 V = safeN(uCam - vP);
    vec2 sm = -V.xz/max(V.y, .12)*.5;
    float nearK = mix(.12, 1., smoothstep(1.4, 5., dist));
    for (int i = 0; i < 8; i++) {
      vec4 cp = uComp[i]; vec2 dq = q - cp.xy;
      float al = -dot(dq, cp.zw), ac = dq.x*cp.w - dq.y*cp.z;
      float arm = abs(ac) - (.1 + al*.3), wd = max(.04 + al*.024, dist*.004);
      float e = exp(-arm*arm/(wd*wd))*smoothstep(.05, .7, al)*exp(-max(al, 0.)/3.2)*uCompS[i]*nearK;
      wake += e;
      wn += vec2(cp.w, -cp.z)*(sign(ac)*(-arm/wd)*e);
      vec2 d1 = dq + sm*.15, d2 = dq + sm*.5, d3 = dq + sm*.85;
      float l1 = length(d1 - cp.zw*clamp(dot(d1, cp.zw), -.92, .92)), l2 = length(d2 - cp.zw*clamp(dot(d2, cp.zw), -.92, .92)), l3 = length(d3 - cp.zw*clamp(dot(d3, cp.zw), -.92, .92));
      bodyK = max(bodyK, (1. - smoothstep(.2, .44, min(l1, min(l2, l3))))*uCompS[i]);
      // where the back breaks the surface: a thread of foam along the body's waterline, and a bow ripple pushed
      // ahead of the nose
      float sK = uCompS[i]*nearK;
      vec2 db = dq - cp.zw*clamp(dot(dq, cp.zw), -.8, .8);
      wfoam += (1. - smoothstep(0., .08 + dist*.004, abs(length(db) - .27)))*sK*.55;
      vec2 dn = dq - cp.zw*.78; float rb = max(length(dn), .03), bowK = smoothstep(-.1, .5, dot(dn, cp.zw)/rb)*sK;
      float bw = sin((rb - .2)*10. - t*8.)*exp(-rb*1.9)*bowK;
      wn += dn/rb*bw*1.1;
      wfoam += (1. - smoothstep(0., .07 + dist*.004, abs(rb - .36)))*bowK*.6;
    }
    wake = clamp(wake, 0., 1.);
    // (a drowned flank shows through the water to an eye that looks down on it; at a grazing look the surface is a
    // mirror over it, and only the back that is out of the water is seen, with its wake)
    bodyK *= smoothstep(.05, .22, V.y);
    n = safeN(n + vec3(wn.x, 0., wn.y)*.6);
    // close under the eye the lower river carries a finer ripple on its chop: the lights that the white sheet and the
    // sky lay on the water are broken into small moving facets, never a pane with an edge
    float fineK = (1. - calm)*smoothstep(5., 10., q.y)*(1. - smoothstep(80., 110., q.y))*(1. - smoothstep(5., 16., dist))*mix(.55, 1., chop);
    n = safeN(n + (vec3(vn(q*vec2(5.2, 7.4) + vec2(t*1.1, -t*1.9)) - .5, 0., vn(q*vec2(6.1, 9.3) + vec2(-t*1.3, -t*2.2) + 5.) - .5)*.42
      + vec3(vn(q*vec2(12.3, 15.1) + vec2(-t*1.7, -t*2.6)) - .5, 0., vn(q*vec2(13.7, 17.9) + vec2(t*1.5, -t*2.9) + 3.) - .5)*.2)*fineK);
    // THE POOL UNDER THE FACE (z 6 to 40), where the route swings along the lip half a metre above the water: rings
    // where leapers have fallen back (one every few seconds in each 4.6 m cell that has a fish in it, a train of
    // ripples running out from a white patch where it went in), and the ring thrown by the bear that loses the fight
    float poolK = (1. - vD.w)*smoothstep(5., 10., q.y)*(1. - smoothstep(34., 48., q.y)), ringFoam = 0.;
    if (poolK > .001) {
      vec2 rc = vec2(q.x, q.y - t*.5)/4.6, ri = floor(rc);
      float ph = fract(t*.37 + h21(ri + 3.3)*9.), on = step(.38, h21(ri + 8.8))*poolK*(1. - ph)*(1. - ph);
      vec2 ro = (fract(rc) - .5 - (vec2(h21(ri + 1.7), h21(ri + 5.3)) - .5)*.44)*4.6;
      float dl = length(ro), rr = ph*2.5, dr = dl - rr + (n2 - .5)*.3 + (n3 - .5)*.12, rag0 = .3 + .7*smoothstep(.3, .62, vn(ro*2.3 + ri*3.7 + t*.2));
      float wv = sin(dr*5.6)*exp(-abs(dr)*1.5)*(1. - smoothstep(.2, .6, dr));
      n = safeN(n + vec3(ro.x, 0., ro.y)/max(dl, .05)*(wv*on*.28*rag0));
      float rag = smoothstep(.3, .62, vn(ro*2.3 + ri*3.7 + t*.2));
      ringFoam = on*((1. - smoothstep(.0, .13 + dist*.012, abs(dr)))*.3*smoothstep(.42, .72, n3)*rag + (1. - smoothstep(.08, .5, dl + (n3 - .5)*.3))*(1. - smoothstep(.0, .25, ph))*(.3 + .6*n2));
    }
    if (uWave.w > .001) {
      vec2 wd = q - uWave.xy; float wl = length(wd), rw = wl - uWave.z, e = exp(-rw*rw*.55)*min(uWave.w*1.4, 1.)*(1. - vD.w);
      n = safeN(n + vec3(wd.x, 0., wd.y)/max(wl, .05)*(-rw*e*.9));
      ringFoam += e*(.45 + .5*n3) + exp(-wl*wl*.02)*min(uWave.w*2., 1.)*(1. - vD.w)*(.5 + .5*n2);      // and the churned patch where it went in
    }
    // and the rings where the companions' arcs left the water and met it again: a white patch that thins, ripples
    // running out from it
    for (int i = 0; i < 8; i++) {
      vec4 rg = uRing[i];
      vec2 rq = q - rg.xy; float rl2 = length(rq), rr2 = .25 + rg.z*1.7, dr2 = rl2 - rr2 + (n3 - .5)*.12 + (n2 - .5)*.2;
      float wv2 = sin(dr2*7.)*exp(-abs(dr2)*2.2);
      n = safeN(n + vec3(rq.x, 0., rq.y)/max(rl2, .05)*(wv2*rg.w*.35));
      ringFoam += rg.w*((1. - smoothstep(0., .1 + dist*.01, abs(dr2)))*.55*smoothstep(.4, .7, n3) + (1. - smoothstep(.1, .6, rl2 + (n3 - .5)*.3))*(1. - smoothstep(0., .55, rg.z))*(.5 + .5*n2));
    }
    float ndv = max(dot(n, V), 0.), F = .04 + .96*pow(1. - ndv, 3.6);
    vec3 R = reflect(-V, n); R.y = abs(R.y);
    float treeH = .13 + .13*vn(vec2(R.x*7. + 3., R.z*7.));
    float tree = (1. - smoothstep(treeH - .08*chop, treeH + .07 + .22*chop, R.y));       // (in the chop the forest's edge is a soft one: no dark outlines round the lights)
    // THE BANKS IN THE WATER. The mirrored ray is walked over the canopy map until it runs in under a crown: what it
    // finds there is that tree (a gold streak under a birch, a dark one under a spruce, straw under the reedgrass),
    // drawn out toward the eye as long as the tree is tall, tapering with its crown, and broken and bent by the ripples
    // because the ray is thrown by the rippled normal. Far trees are paled by the air between; within 12 m of the eye
    // the forest fades from the water and only the sky and the bed are left.
    // The ray is thrown by the wave normal itself (in full near the eye, eased far off where one pixel holds many
    // ripples), and its foot rides the swell, so that no edge in the water is straight or still.
    float damp = mix(.9, .36, smoothstep(5., 60., dist));
    vec3 Rt = reflect(-V, safeN(vec3(n.x*damp, n.y, n.z*damp))); Rt.y = abs(Rt.y);
    vec2 rd = Rt.xz; float rl = max(length(rd), 1e-3); rd /= rl;
    vec2 q0 = q + vec2(n2 - .5, n1 - .5)*(1.5 + dist*.14) + vec2(n3 - .5, 0.)*min(dist*.05, 1.2);
    float slope = Rt.y/rl, sw = 3.6, hitK = 0., goldK = 0., sHit = 0., topK = 0., sLo = 3.6, lodF = 0., mapK = 1.;
    for (int i = 0; i < 16; i++) {
      // a long stride first, tested against the map's coarser levels (each holds the tallest crown of the ground it
      // covers, so no tree is stepped over); where something stands in the stride, four short steps find it
      float s2 = sw*1.3, len = s2 - sw;
      float tall = textureLod(tTrees, (q0 + rd*(sw + len*.5) - uTreeMap.xy)*uTreeMap.zw, log2(max(len, 2.)*.5) + .5).r*80.;
      if (hitK < .5 && tall > slope*sw) {
        float lf = max(log2(len*.125) - 1., 0.);
        for (int j = 0; j < 4; j++) {
          float sf = sw + len*(float(j) + .5)*.25;
          vec4 tm = textureLod(tTrees, (q0 + rd*sf - uTreeMap.xy)*uTreeMap.zw, lf);
          float over = tm.r*80. - slope*sf;
          if (hitK < .5) { if (over > 0.) { hitK = 1.; goldK = tm.g; sHit = sf; topK = over; lodF = lf; } else sLo = sf; }
        }
      }
      if (hitK < .5) sLo = max(sLo, sw);
      sw = s2;
    }
    // (the crown's edge is then found between the last clear step and the first one under it, so that the outline
    // drawn in the water is the tree's own and not the stride's)
    if (hitK > .5) {
      for (int j = 0; j < 3; j++) {
        float sm2 = (sLo + sHit)*.5;
        vec4 tm = textureLod(tTrees, (q0 + rd*sm2 - uTreeMap.xy)*uTreeMap.zw, lodF);
        if (tm.r*80. - slope*sm2 > 0.) { sHit = sm2; goldK = tm.g; } else sLo = sm2;
      }
      // how deep under the crowns the ray runs on beyond the rim: a ray that only clips a tip is mostly sky (a soft
      // rim, not a cut one); and toward the end of the map the forest fades out of the water over 10 m
      vec2 u1 = (q0 + rd*(sHit + 2.5) - uTreeMap.xy)*uTreeMap.zw, u2 = (q0 + rd*(sHit + 6.5) - uTreeMap.xy)*uTreeMap.zw;
      topK = max(textureLod(tTrees, u1, lodF + 1.).r*80. - slope*(sHit + 2.5), textureLod(tTrees, u2, lodF + 1.5).r*80. - slope*(sHit + 6.5));
      vec2 eu = min(u1, 1. - u1)/(uTreeMap.zw*10.);
      mapK = clamp(min(eu.x, eu.y), 0., 1.);
    }
    float brk = .4 + .6*smoothstep(.2, .7, n2)*(.55 + .9*n3);                 // the ripples let the sky in between the streaks
    float hazeR = 1. - exp(-sHit*sHit*uHazeK*uHazeK);
    float treeM = hitK*smoothstep(0., 4.5, topK)*mapK*smoothstep(.45, 1.7, dist)*clamp(brk, 0., 1.)*.94*(1. - .35*smoothstep(45., 110., sHit))*(1. - .5*hazeR);
    float goldM = smoothstep(.2, .9, goldK)*uGoldAmt*smoothstep(.6, 2.4, dist)*(.45 + .55*smoothstep(.3, .62, vn(vec2(q.x*.9 + n1*2., q.y*.33))));
    vec3 treeCol = mix(uSpruceRef*(.7 + .6*n3), uGoldRef*(.7 + .6*n1), goldM);
    vec3 sky = mix(uSkyHor, uSkyCol*1.2, smoothstep(0., .6, R.y));
    treeCol = mix(treeCol, sky*.8, hazeR*.5 + .05);
    vec3 refl = mix(sky, mix(treeCol, uHorizon, chop), mix(treeM, tree, chop));
    // and the portal's pale glow, a wavering column under it
    if (vD.w > .5 && R.z < -.05) {
      float tp = (uPortalR.z - vP.z)/R.z; vec2 ph = vec2(vP.x + R.x*tp - uPortalR.x, vP.y + R.y*tp - uPortalR.y);
      float pg = exp(-dot(ph, ph)/(uPortalR.w*uPortalR.w*.55))*step(0., tp)*(1. - smoothstep(60., 130., tp));
      refl = mix(refl, uPortalCol, clamp(pg*1.15, 0., .9));
    }
    // the ledge in the pool: where the mirrored ray runs to the face it finds the white sheet, the bears standing dark
    // on it. The image is taken with half of the ripples' tilt, so that it is a
    // broken band and not a scatter, and drawn at a fifth of its height (uMirK): the eye is half a metre above the
    // water, and a true mirror would lay the sheet over all the water there is and push the bears out of the frame
    float mirDark = 0.;
    if (vD.w < .5 && q.y > 2.5 && q.y < 80.) {
      vec3 Rl = reflect(-V, safeN(vec3(n.x*.5, n.y, n.z*.5)));
      float face = smoothstep(.03, .2, -Rl.z)*(1. - smoothstep(50., 80., q.y)), tl = (q.y - 1.5)/max(-Rl.z, .03);
      float hy = abs(Rl.y)*tl/uMirK, hx = q.x + Rl.x*tl;
      float fb = vn(vec2(hx*1.4, hy*.35 - t*1.5))*.6 + vn(vec2(hx*4.5, hy*.9 - t*2.4))*.4;
      float inSheet = (1. - smoothstep(3.6, 7.6, hy + (n3 - .5)*1.6 + (n2 - .5)*2.2))*(.5 + .5*smoothstep(.34, .58, n2));     // broken by the troughs
      vec3 sheetC = uWhite*(uSunCol*.24 + uSkyCol*.42 + .03)*mix(vec3(.5, .66, .74), vec3(1.), smoothstep(.3, .62, fb))*.88;
      float bearM = 0.;
      for (int i = 0; i < 16; i++) {
        vec4 lb = uLedge[i];
        float bx = abs(hx - lb.x)/max(lb.y*1.25, .1), by = (hy - 5.2)/max(lb.z - 5.2, .1);
        bearM = max(bearM, (1. - smoothstep(.3, 1., bx))*smoothstep(-.12, .12, by)*(1. - smoothstep(.45, 1., by + .3*bx*bx))*lb.w);
      }
      bearM *= (.35 + .65*smoothstep(.25, .6, n2 + (n3 - .5)*.4))*smoothstep(4., 14., dist);      // (and not in the facets right under the eye, where each would be a dark outline)
      refl = mix(refl, sheetC, face*inSheet);
      refl = mix(refl, vec3(.03, .024, .02)*(uSkyCol + .3), face*bearM*(1. - inSheet*.6)*.8);
      mirDark = face*bearM*(1. - inSheet*.6)*.7;
    }
    // reflections bend round a body that lies just under the surface; they do not paint it
    refl = mix(refl, uDrown*(uSunCol*.14 + uSkyCol*.5), bodyK*.85);
    vec3 lit = uSunCol*.26*max(uSun.y, 0.) + uSkyCol*.55 + .05;
    vec3 body = mix(uAmber*(.7 + .5*n1), uPool*1.05, smoothstep(.5, 4.2, dep))*lit;
    body = mix(body, vec3(.07, .24, .17)*lit*2.1, calm*.45);
    col = mix(body, refl, mix(F, max(F, .6*smoothstep(1.5, 9., dist)*(1. - smoothstep(45., 110., sHit))), treeM*(1. - chop)));
    col = mix(col, vec3(.03, .026, .02)*(uSkyCol + .3), mirDark*.5);
    col += pow(max(dot(R, uSun), 0.), 150.)*uSunCol*uGlint*(.6 + 2.*rif)*(1. - bodyK);
    float lines = smoothstep(.6, .74, fbm(vec2(q.x*.33 + n1*1.3, q.y*.045 - t*.13)))*(.3 + .7*n3)*smoothstep(55., 80., q.y)*(1. - smoothstep(150., 260., q.y))*.5;
    // in the riffles, close under the eye: threads of foam drawn out along the current, and broader pale streaks
    float nearR = smoothstep(.12, .45, rif + .25*(1. - calm)*smoothstep(150., 100., q.y)*smoothstep(60., 80., q.y))*(1. - smoothstep(9., 20., dist));
    float thr = vn(vec2(q.x*8.5 + n1*3., q.y*2.4 - t*2.6*fl)), thr2 = vn(vec2(q.x*2.6 - n2*2., q.y*.8 - t*1.5*fl));
    float threads = nearR*(smoothstep(.72, .84, thr)*smoothstep(.4, .65, thr2)*.6 + smoothstep(.7, .84, thr2)*smoothstep(.45, .75, n3)*.3);
    float foam = rif*smoothstep(.5, .78, n2*.62 + n3*.5)*.9 + (1. - smoothstep(.04, .5, dep))*(.25 + .5*n3) + lines + ring*.5 + wake*.3*(.45 + .55*n3) + wfoam*smoothstep(.3, .62, n3) + threads;
    // rafts of foam and long streak lines that ride down the pool from the boil
    if (poolK > .001) {
      vec2 qd = vec2(q.x, q.y - t*.8);
      float rf = fbm(vec2(qd.x*.2 + n1*.9, qd.y*.23));
      vec2 clot = cobbles(qd*3.6 + vec2(n2, n1)*.8);                     // a raft is a crowd of clots of froth with dark water between them, never a pale patch
      float lace = clot.y*(.45 + .55*clot.x)*(.5 + .5*smoothstep(.3, .6, vn(qd*1.3 + 5.)))*(.3 + .7*smoothstep(.3, .7, vn(qd*9. + n3*2.)));
      float sl = fbm(vec2(q.x*.85 + n1*1.6, q.y*.06 - t*.085));
      foam += poolK*(smoothstep(.57, .65, rf)*lace + smoothstep(.585, .7, sl)*(.25 + .75*smoothstep(.35, .7, n3))*(.4 + .6*clot.y)*.8);
    }
    foam += ringFoam;
    // where the mergansers have run: from every footfall a ring spreads and fades, white at its middle while it is new
    if (uDuckT > 0. && vD.w > .5) {
      float lw = max(.06, dist*.0035);
      for (int i = 0; i < 8; i++) {
        vec4 dk = uDuck[i]; float sd = uDuckT - dk.z;
        vec2 dir = vec2(sin(dk.w), cos(dk.w)), dq = q - dk.xy;
        float al = dot(dq, dir), ac = dq.x*dir.y - dq.y*dir.x, run = 2.5*sd + 1.6*sd*sd;
        if (sd <= 0. || al < -1.6 || al > run + 1.6 || abs(ac) > 2.2) continue;
        float c0 = floor((al - .4)/1.25 + .5);
        for (int j = -1; j <= 1; j++) {
          float cell = c0 + float(j), rk = .4 + 1.25*cell;
          if (cell < 0. || rk > run || rk > uDuckL[i]) continue;
          float age = sd - (-2.5 + sqrt(6.25 + 6.4*rk))/3.2;
          vec2 dd = vec2(al - rk, ac - .2*(mod(cell, 2.)*2. - 1.));
          float dl = length(dd), rr = .22 + age*.62, fade = 1. - smoothstep(.4, 1.9, age);
          foam += fade*((1. - smoothstep(0., lw, abs(dl - rr)))*.6 + (1. - smoothstep(.12, .42, dl + (n3 - .5)*.2))*(1. - smoothstep(0., .8, age))*.9);
        }
      }
    }
    foam = clamp(foam, 0., 1.);
    vec3 white = uWhite*(uSunCol*(.2 + .16*max(n.x*uSun.x + uSun.y, 0.)) + uSkyCol*.42 + .03);
    col = mix(col, white*(.75 + .3*n3), foam);
    col = mix(col, mix(uGold*(.62 + .5*h21(li + 9.)), vec3(.3, .15, .04), clamp(leafRib + .5*step(.7, h21(li + 6.1)), 0., .85))*(uSunCol*.3 + uSkyCol*.5)*(.85 + .3*n3), leaf);
    a = clamp(max(max(F*1.7, (1. - exp(-dep*.4))*mix(.62, 1., smoothstep(3., 26., dist))), max(foam, leaf)), .28, 1.);
    a *= 1. - .64*bodyK*(1. - foam);
  } else {
    // FROM BELOW. Straight overhead is Snell's window: a bright round opening of sky (drawn wider than the true 48
    // degrees, so that a level eye has its near rim across the top of the frame), netted with light by the ripples,
    // the spruce tops and birch crowns of the banks standing bent round its rim, the sun's glare in it on the sun's
    // side, and (from the pool) the white of the falls with the bears dark on the lip. Outside the window the
    // surface is a mirror: the lit bed upside down in the bed's own light, crossed by the bright crests of the ripples
    // that slide with the current, and torn by foam wherever the water breaks above.
    vec3 Vd = safeN(vP - uCam);
    vec2 rp = vec2((n2 - .5) + (n3 - .5)*.6, (n1 - .5) + (vn(q*2.3 + t*.3) - .5)*.6);
    float rk = mix(.55, 1., rif)*(1. - .4*calm);
    // (far off one pixel holds many ripples: there a ripple's tone goes to its mean, and what a threshold cuts out of it
    // is cut with as soft an edge: pw2, pw3 = how many of the middle and of the small ripples one pixel holds)
    float pw3 = max(length(qdx*vec2(4.2, 1.6)), length(qdy*vec2(4.2, 1.6))), pw2 = max(length(qdx*vec2(1.3, .5)), length(qdy*vec2(1.3, .5)));
    float wF = smoothstep(.15, .6, pw3), n3f = mix(n3, .5, wF), n2f = mix(n2, .5, smoothstep(.15, .6, pw2));
    float c = clamp(Vd.y + (rp.x + rp.y)*.2*rk, 0., 1.);
    // (rpL: the slow swells, wider than a stone and wider than a tree stands in the window: they rock what the mirror and
    // the window show as a whole. cW: the calmer cosine the window is drawn by, the swells in full and a fifth of the
    // small ripples: its rim, at the cosine .33, is one clean line that rocks, and what stands in the window rocks with
    // it and is not torn)
    vec2 rpL = vec2(vn(vec2(q.x*.42 + 7., q.y*.3 - t*.45*fl)) - .5, n1 - .5);
    float cW = clamp(Vd.y + ((rpL.x + rpL.y)*.07 + (rp.x + rp.y)*.04)*rk, 0., 1.);
    float win = smoothstep(.33 - .012, .33 + .012, cW);
    vec2 hz = Vd.xz/max(length(Vd.xz), 1e-4);
    float se = skyRise(cW), ce = sqrt(max(1. - se*se, 0.));
    vec3 Rr = vec3(hz.x*ce, se, hz.y*ce);
    // the ripples as lenses: a net of bright lines that crawls over the window and, fainter, over the mirror; it is
    // drawn only where a line is wider than a pixel
    float fine = 1. - smoothstep(.1, .45, dist*.0022/max(Vd.y, .05));
    float l1 = vn(vec2(q.x*1.5 + n1*1.6, q.y*1.1 - t*.9*fl)), l2 = vn(vec2(q.x*3.4 - n2*1.2, q.y*2.6 - t*1.6*fl + 7.));
    float c1 = clamp(1. - abs(l1*2. - 1.), 0., 1.), c2 = clamp(1. - abs(l2*2. - 1.), 0., 1.);
    float lines = (c1*c1*c1 + .6*c2*c2*c2)*fine;
    vec3 sky = mix(uSkyHor*1.15, uSkyAir*1.35, smoothstep(0., .55, se));
    float cloud = smoothstep(.45, .7, fbm(Rr.xz/(se + .35)*1.4 + vec2(t*.012, 3.)));
    sky = mix(sky, uSkyHor*1.25 + uSunAir*.1, cloud*.7);
    // from the pool the window looks out at the ledge: the white sheet in its fibres up to the lip, the bears standing
    // dark on it against the sky (the same bears the pool mirrors from above: uLedge)
    float ledgeK = 0., mist = 0.;
    vec2 sh = uSun.xz/max(length(uSun.xz), 1e-4);
    if (vD.w < .5 && vP.z > 0. && vP.z < 90. && Rr.z < -.04 && win > .001) {
      float tl = (vP.z + 1.5)/(-Rr.z), hy = Rr.y*tl, hx = vP.x + Rr.x*tl, fk = 1. - smoothstep(70., 120., tl);
      // (the bears are looked up along a ray of their own, c0, which the ripples bend a third as much as they bend the
      // mirror's, c: the bears rock, they are not torn)
      float c0 = clamp(Vd.y + (rp.x + rp.y)*.065*rk, 0., 1.), se0 = skyRise(c0), ce0 = sqrt(max(1. - se0*se0, 0.));
      vec3 Rb = vec3(hz.x*ce0, se0, hz.y*ce0);
      float tlb = (vP.z + 1.5)/max(-Rb.z, .04), hyb = Rb.y*tlb, hxb = vP.x + Rb.x*tlb;
      // THE FALL IN THE WINDOW FALLS IN FIBRES, by the sheet's own rule: strands on the fall clock (tf = the root of the
      // drop from the lip at 6 m, running at 2.215 a second: free fall), ropes .77 m and strands .2 m wide that run down
      // the whole face; they are looked up along the bears' ray (they rock, they are not torn into pieces), and no strand
      // is drawn narrower than a pixel (.0022 of the way to it, as the ripples' lines above); the ropes are drawn at
      // every distance, as in the sheet
      float fallW = sqrt(clamp(6. - hyb, 0., 7.) + .04) - t*2.215, pxw = (dist + tlb)*.0022;
      float kw2 = 1. - smoothstep(.4, 1., pxw*5.), ww1 = sqrt(.1156 + (1. - kw2*kw2)*.158);
      vec2 w1 = fallStrand(hxb*1.3, fallW*.6, 3., 1.), w2 = fallStrand(hxb*5., fallW*.6, 11., kw2);
      // (the sheet's own sum where its fibres and threads are not drawn: they are narrower than a pixel here and hand
      // their share to the strands, .397 = the root of .3, .22 and .14 squared, and the strands theirs to the ropes
      // where they are too)
      float fb = .5 + (w1.x - .5)*ww1 + (w2.x - .5)*.397;
      float sheetK = (1. - smoothstep(5.3, 6.5, hy + (n3 - .5)*1.2))*fk*(1. - smoothstep(72., 78., abs(hx)));
      vec3 sheetC = uWhite*(uSunAir*.22 + uSkyAir*.42 + .03)*mix(vec3(.42, .6, .68), vec3(1.), smoothstep(.3, .62, fb));
      // the lip bears: each is the shape of lipBear in its own place and size. rimB = how much less of the shape
      // there is 0.28 m toward the sun (the sun's x and height) than here: the side of its outline that faces the
      // sun. Of the bear that covers the place most: rndB = how high on the barrel the place is (0 a quarter of the
      // barrel's half height under its middle, 1 at its top), legB = the height in the bear (0 at 5.2 m, 1 its top)
      float bearM = 0., rimB = 0., rndB = 0., legB = 1.;
      vec2 s2 = uSun.xy/max(length(uSun.xy), 1e-4)*.28;
      for (int i = 0; i < 16; i++) {
        vec4 lb = uLedge[i];
        float wB = max(lb.y*1.25, .1), hB = max(lb.z - 5.2, .1), fc = fract(lb.x*.37) > .5 ? 1. : -1.;
        float sxh = (hxb - lb.x)/wB*fc, by = (hyb - 5.2)/hB;
        float m = lipBear(sxh, by)*lb.w;
        rimB = max(rimB, clamp(m - lipBear(sxh + s2.x/wB*fc, by + s2.y/hB)*lb.w, 0., 1.));
        if (m > bearM) { bearM = m; rndB = smoothstep(-.25, 1., (by - .62)/.36); legB = by; }
      }
      sky = mix(sky, sheetC, sheetK);
      // umber-black, a lighter umber up the barrel by the sun and the sky, and on the rim the sun's own colour warmed
      vec3 bearC = vec3(.035, .028, .022)*(uSkyAir + .3) + vec3(.2, .11, .05)*(uSunAir*.3 + uSkyAir*.4)*rndB + uSunAir*vec3(1., .72, .4)*(.75*rimB);
      // (by the sheet's own share sheetK its white stands before the legs: under 0.04 of the bear's height the sheet
      // alone, over 0.18 the bear alone, both 0.075 of its height higher where fb is 1 and as much lower where it is 0)
      sky = mix(sky, bearC, bearM*fk*(1. - sheetK*(1. - smoothstep(.04, .18, legB - (fb - .5)*.15))));
      ledgeK = max(sheetK, bearM*fk);
      // (the trees that stand behind the ledge are seen through the wall of spray that rises behind the bears: mist)
      mist = fk*(1. - smoothstep(72., 78., abs(hx)))*(1. - smoothstep(22., 44., hy));
    }
    float cover = 0.;
    // THE TREELINE SEEN UP THROUGH THE WATER: every tree is found along the window's own calm ray (cW): it rocks
    // as a whole, it is not torn. Its outline is one clean shape; inside it the tone is by the sun's bearing about
    // the window (front: 1 where the eye looks straight away from the sun, -1 where it looks toward it; sideS: 1
    // where the sun stands a quarter turn toward greater ax, -1 the other way; back: 0 while front is over -0.1, 1
    // when it is under -0.8), in nothing finer than a bough. A spruce is lit as a cone (nl: the sun's bearing on its
    // face at the place across it), each tier of boughs light on its upper side and dark under (bl, one wave a
    // tier): from uSpruceRef, 1 to 1.8 times by bl, to uSpruceLit in the sun's and the sky's light; and by back its
    // sides (from 0.84 of the way out) and its top (from 0.82 of its height) are brightened by up to half the sun's
    // colour times the sum of its lit green and half the gold. A birch crown is lit as a ball (nlb, the sun's height counted) in
    // clumps of leaf (clump), from the gold under the sky alone to the gold in the sun; and by back all of it is
    // brightened by 0.12 of the sun's colour times the gold, and from 0.72 of its radius out by up to 0.92 of it.
    // The far rank goes from twice uSpruceRef to the same lit green by front and its own grain (tex), and 0.45 of
    // the way to 0.8 of the sky's colour at the horizon.
    if (se < .62 && win > .001) {
      float ax = atan(hz.x, hz.y + 1e-5)/6.2832 + .5 + rpL.x*.004*rk, ys = se;
      float tex = vn(vec2(ax*150., ys*11.));
      vec3 sF, sA, sB; vec2 cA, cB;
      float far = max(spires(ax, ys, 96., 3.3, .05, .13, .5, sF), 1. - smoothstep(0., .02, ys - .03 - .02*vn(vec2(ax*260., 3.))));
      float bA = lobes(ax, ys*.62, 21., 7.7, cA), bB = lobes(ax, ys*.8, 33., 2.9, cB);
      float birch = max(bA, bB)*uGoldAmt;
      birch *= smoothstep(.3, .5, vn(vec2(ax*420., ys*30.))*.55 + tex*.45 + .1);                    // (a crown is clumps of leaf with the sky between them)
      float nA = spires(ax, ys, 23., 1.7, .17, .46, .3, sA), nB = spires(ax, ys, 31., 5.1, .11, .32, .26, sB);
      float near = max(nA, nB);
      vec3 sp = nA > nB ? sA : sB; vec2 cr = bA > bB ? cA : cB;
      float front = -dot(hz, sh), sideS = sh.x*hz.y - sh.y*hz.x, back = smoothstep(.1, .8, -front);
      float nl = sqrt(1. - sp.x*sp.x)*front + sp.x*sideS, bl = .5 + .5*cos(6.2832*(sp.y - .2));
      vec3 sprC = mix(uSpruceRef*(1. + .8*bl), uSpruceLit*(uSunAir*.26 + uSkyAir*.22), smoothstep(-.15, .55, nl)*(.2 + .8*bl));
      sprC += (uSpruceLit + uGold*.5)*uSunAir*(.5*back*max(smoothstep(.84, .99, abs(sp.x)), smoothstep(.82, .93, sp.z)));
      float rr = min(length(cr), 1.), nlb = length(uSun.xz)*(sqrt(1. - rr*rr)*front + cr.x*sideS) + uSun.y*cr.y;
      float clump = vn(vec2(ax*200., ys*22.));
      vec3 birC = mix(uGold*uSkyAir*(.25 + .2*clump), uGold*(uSunAir*.44 + uSkyAir*.3), smoothstep(-.2, .6, nlb)*(.45 + .55*clump));
      birC += uGold*uSunAir*(back*(.12 + .8*smoothstep(.72, .98, rr)));
      vec3 forest = mix(mix(uSpruceRef*2., uSpruceLit*(uSunAir*.26 + uSkyAir*.22), smoothstep(-.5, .6, front)*(.6 + .4*tex)), uSkyHor*.8, .45);
      forest = mix(forest, birC, birch);
      forest = mix(forest, sprC, near);
      forest = mix(forest, uSkyHor*1.1, .62*mist);          // (paled by the spray: the bears on the lip stay dark on pale)
      cover = max(max(far, birch), near)*(1. - ledgeK);
      sky = mix(sky, forest, cover);
    }
    // the sun: its disc where it stands in the window, and on the sun's side of the window a broad glare that the
    // ripples break into running lines
    float sd = max(dot(Rr, uSun), 0.);
    float az = max(dot(hz, sh), 0.), glare = az*az*az*(1. - .6*se);
    sky += uSunAir*(pow(sd, 40.)*1.4*(.5 + n3) + pow(sd, 6.)*.14 + glare*(.07 + .45*lines))*uGlint*(1. - cover)*(1. - ledgeK);
    float lens = vn(q*1.25 + vec2(t*.55, -t*.4))*vn(q*2.7 - vec2(t*.45, t*.6));
    sky *= (.7 + (.9*lens + .45*lines)*mix(1., .5, calm))*mix(.78, 1., smoothstep(0., .5, se));
    // THE MIRROR, BY THE PLACE. Outside the window the surface gives back all the light that meets it from below: what
    // stands in it is the bed itself upside down, as an eye as far above the surface as ours is under it would see it.
    // The mirrored ray is followed down to the bed (tbT: its way from the surface to the bed; way: the whole way from
    // the eye) and the bed is drawn where it lands, as it lies there: beds of olive algae and bars of clean gravel, the
    // scattered pale cobbles with the sun on one flank and the dark at their feet, the caustic net over all. It is as
    // sharp as one pixel and the small ripples in it leave it on the bed at that distance (fAc across the line of
    // sight, fAl along it, in metres; nothing is blurred beyond that), it is lit as the bed is, and the water on the
    // whole way takes it as the scene's haze takes the bed below: far off both are the water's own colour and meet in
    // it. The ripples rock the picture as a whole (the slow swells, wider than a stone) and shiver it a little (the
    // small ones): they do not tear it.
    // (depB: the depth of the bed the mirror shows, the same law in both rivers: the lower river's own depth, and under
    // the glass of the upper river the depth of the ledge's rock, 3 m, where the world's terrain lies 14 m down in a pit)
    float depB = vBed;
    // (rpB: the ripples one pixel holds, too small to rock the picture, soften it instead, by twice their tilt over the
    // mirrored way: little in the glide of a run, more over a riffle, most in the chop under the falls)
    float vy = max(Vd.y, .03), tbT = max(depB, .4)/vy, way = dist + tbT, rpB = tbT*(.006 + .012*rif + .03*chop)*(1. - .6*calm);
    float fAc = length(vec2(way*pxA, rpB)), fAl = fAc/vy;
    vec2 bq = vP.xz + Vd.xz*tbT + (rpL*.2 + rp*.025)*min(tbT, 4.)*(1. - .2*calm);
    // (what one pixel can hold: a stone, the caustic net, the fine gravel, a ripple's face; what it cannot hold goes to its mean)
    float sStone = 1. - smoothstep(.15, .6, fAl), sNet = 1. - smoothstep(.25, .9, fAl), sFine = 1. - smoothstep(.04, .16, fAl);
    vec4 st = bedStones(bq);
    float ew = length(vec2(dot(st.zw, hz)*fAl, (st.z*hz.y - st.w*hz.x)*fAc)) + .004;        // (one pixel across the stone's rim, m)
    float stoneM = (1. - smoothstep(-ew, ew, st.x))*sStone, inS = -st.x, onTop = smoothstep(.04, .3, inS);
    vec2 sunH = uSun.xz/max(length(uSun.xz), 1e-4);
    float bars = smoothstep(.34, .66, fbm(vec2(bq.x*.31, bq.y*.14) + 4.7));
    // (the bed's ground: pale gravel, and on it the dark tufts of algae, thick in its beds and thin on its bars)
    float tuft = mix(.5, smoothstep(.4, .6, vn(bq*3.3 + 3.)*.6 + vn(bq*7.7 + 9.)*.4), 1. - smoothstep(.08, .32, fAl));
    vec3 gcol = mix(uBedCol*vec3(.78, .83, .64), vec3(.12, .14, .05), tuft*(.75 - .35*bars))*(.9 + .2*mix(.5, vn(bq*15.), sFine));
    // (a stone seen from above and aslant: its top in the light, pale, a little algae on it; the flank it turns to the
    // eye in its own shade, the sun's flank brighter; and the dark at its foot, deepest on the eye's side and away from the sun)
    float flank = dot(st.zw, sunH), nearK = max(-dot(st.zw, hz), 0.), wall = nearK*(1. - smoothstep(.02, .24, inS));
    gcol *= 1. - (.34 + .3*nearK - .18*flank)*exp(-max(st.x, 0.)/.14)*sStone;
    // (and it is a lumpy thing: its faces lighter and darker, its skin grained)
    float lump = mix(.5, vn(st.zw*1.6 + st.y*37. + inS*4.), sStone), grain = mix(.5, vn(bq*17.), sFine);
    vec3 scol = uBedCol*(2.1 + .45*st.y)*mix(vec3(1., 1.03, .82), vec3(.86, .97, .7), .3*onTop)*(mix(.8, 1.06, smoothstep(0., .2, inS)) + .2*flank*(1. - onTop))*(1. - .5*wall)*(.84 + .32*lump)*(.93 + .14*grain);
    vec3 alb = mix(gcol, scol, stoneM) + (uBedCol*1.5 - gcol)*.17*(1. - sStone);
    // (the caustic net as it lies on the bed: bright threads with the dark of the water's shade between them)
    float k1 = vn(bq*.9 + vec2(t*.5, -t*.35)), k2 = vn(bq*1.7 - vec2(t*.4, t*.3));
    k1 = clamp(1. - abs(k1*2. - 1.), 0., 1.); k2 = clamp(1. - abs(k2*2. - 1.), 0., 1.);
    float net = k1*k1*k1 + .6*k2*k2*k2;
    // (its light is the bed's own: the measure .46, .46, .45 brings the mirror's gravel, tufts and cobbles to the tones
    // the bed below has in the picture, in the rose light of a dawn and in September's alike)
    vec3 bed = alb*(uSunCol*(.2 + .75*mix(.4, net, sNet))*.6 + uSkyCol*.34)*vec3(.46, .46, .45);
    // (the longer way through the water takes a little of it, the red first, toward the water's own tint of what lies deep)
    bed *= mix(vec3(1.), vec3(.55, .86, .8), 1. - exp(-tbT*.09));
    // (the bed in the mirror is lit by its own depth, as the bed itself is: DUSK_BED, DEEP_LIGHT)
    bed *= ${GLSL_DEEP.replace('DEPTH', 'depB')};
    // (under the glass of the upper river the mirror is a clean one: the bed's image keeps the bed's own pale light)
    bed *= mix(vec3(1.), vec3(1.3, 1.1, 1.14), calm);
    // (the water on the mirrored way dims the picture by the law the scene's haze has under water, with the water's own
    // density, uWK, at every depth of the eye: the scene's haze thins to the air's as the eye comes up through the last
    // of the water, and the mirror keeps its tone there; the way up to the surface is laid on with the surface's own
    // haze, below. farK: only a ray that climbs to the ceiling finds the glow of the light that comes down through it;
    // a level ray finds the water's own colour, the colour the far bed goes into under water: uCeil is one and a half
    // times that colour, and it is taken from uCeil at every depth of the eye, since the scene's haze colour turns to
    // the air's in the last of the water)
    float img = exp(-uWK*uWK*tbT*(tbT + 2.*dist));
    farK = smoothstep(.02, .3, Vd.y);
    vec3 mirror = mix(mix(uCeil/1.5, uCeil*.85, farK), bed, img);
    // the ripples' own faces: lit and shaded sides, and the bright crests
    mirror *= (.86 + .4*(n2f - .45)*mix(1., .4, calm))*(1. - .22*smoothstep(.33 - .19, .33, c));
    // (the sky's light in the crests and in the sheen falls as the eye goes down into the dusk: skyK)
    float skyK = 1. - .8*uDusk;
    mirror += (uSkyHor*.22*skyK + uCeil*.5)*lines*(.3 + .7*n3)*mix(.8, .3, calm);
    // (a mirror of moving water is silver where it has no picture to show: a third of it is the water's own sheen
    // there, and a fourteenth where the cobbles stand in it)
    mirror = mix(mirror, (uSkyHor*.3*skyK + uCeil*.8)*(.7 + .6*n2f), mix(.32, .07, img)*mix(.3, 1., farK));
    col = mix(mirror, sky*vec3(.66, .86, .9), win);
    col += uSkyHor*smoothstep(.25, .33, c)*(1. - win)*smoothstep(.74, .88, vn(q*vec2(9., 3.5) + vec2(t*.7, -t*1.3)))*.4;      // slivers of sky tipped through by the ripples
    col = mix(col, uGold*(uSunCol*.05 + uSkyCol*.14), leaf*.9*win);                    // leaves ride over as silhouettes
    col += uWhite*ring*.3*(.3 + win);
    // under the boil: a churning ceiling of aerated water, bright clouds of bubbles with dark water between them
    float b1 = fbm(q*.35 + vec2(t*.21, -t*.5)), b2 = fbm(q*1.1 + b1*2. - vec2(0., t*1.1));
    vec3 glow = uWhite*(uSunCol*.15 + uSkyCol*.3)*vec3(.72, 1., .88);
    float clotK = smoothstep(.45, .7, b2*.7 + n3*.3);
    vec3 foamU = mix(uVol*.7 + glow*.04, glow*1.22, clotK)*(.72 + .6*vn(q*3.1 + vec2(t*.9, -t*1.7)));
    foamU += uWhite*(uSunCol*.1 + uSkyCol*.12)*smoothstep(.62, .8, b1)*smoothstep(.35, .7, n3);
    float fz = step(0., vP.z)*smoothstep(.22, .6, exp(-max(vP.z, 0.)/9.)*1.35 + (b2 - .5)*.55);
    fz = max(fz, step(0., vP.z)*(1. - smoothstep(42., 100., vP.z))*smoothstep(.51, .63, b1 + (b2 - .5)*.35)*.9);      // and rafts of it ride down the pool
    // over the riffle bars the water breaks: patches of the same foam, torn out along the current
    // (in patches, and in long trains that ride down from each bar)
    float train = smoothstep(.6, .7, vn(vec2(q.x*1.4 + n1*1.3, q.y*.19 - t*.4*fl)))*(.4 + .6*smoothstep(.3, .62, n3f));
    // (the trains ride on down the deeper channel between the bars as well, thinner there)
    float reach = (1. - calm)*smoothstep(76., 92., q.y)*(1. - smoothstep(166., 182., q.y));
    float fzR = max(rif*max(smoothstep(.54 - .15*wF, .64 + .15*wF, n2f*.62 + n3f*.5)*(.5 + .5*smoothstep(.3, .6, n1)), train), reach*train*.6*smoothstep(.35, .6, n2f))*.92;
    // the left of the pool, between the pool bear and the falls, is roofed with drifting rafts of the same foam (uRaft
    // = centre x, z and radii)
    vec2 rq = (vP.xz - uRaft.xy)/uRaft.zw;
    fz = max(fz, (1. - smoothstep(.45, 1., length(rq)))*smoothstep(.34, .5, b1*.55 + b2*.45 + (n3 - .5)*.1)*.94);
    // (inside the window the dark between the clouds of foam is not water but the opening itself: the sky, the falls
    // and the bears show there)
    col = mix(col, foamU, max(vD.z, fz)*(1. - .9*win*(1. - clotK)));
    // (the riffle's foam is thin: white where the light comes down through it, in patches with clean water between)
    col = mix(col, glow*(1.25 + .9*n3f) + uSkyHor*.12, fzR*(1. - .5*win));
    fzFar = max(max(vD.z, fz)*clotK, fzR);
    // right under the falls the ceiling is the white of the plunging jets themselves (wz, laid on after the haze
    // below): thick under each jet of the falls (uJetX), thinner between them, where the green shows
    float jd = 1e3;
    if (vP.z > 0. && vP.z < 14.) for (int i = 0; i < 24; i++) jd = min(jd, abs(q.x - uJetX[i]));
    float jetK = 1. - smoothstep(1.1, 3.6, jd + (b2 - .5)*2.2);
    wz = step(0., vP.z)*(1. - smoothstep(6., 10.5, vP.z + (b2 - .5)*3.4 + (n3 - .5)*1.2 + (1. - jetK)*2.6))*mix(.5, 1., jetK);
    // THE POOL BEAR wades in a patch of its own froth: where the eye's ray runs on above the surface to its back and
    // head the surface is broken open (uHole = the middle of what stands above the water and the opening's radius,
    // uHoleAx = half the length of the back), a ragged opening torn by the clots of the froth, never an outline; behind
    // the bear hangs the glow of that froth ('poolWindow'), and round the opening the ceiling is froth too
    vec3 hb = uHole.xyz - uCam; float ht = max(dot(hb, Vd), 0.);
    vec3 h1 = hb - uHoleAx, h2 = hb + uHoleAx, h3 = hb - uHoleAx*.5, h4 = hb + uHoleAx*.5;
    float hd = min(min(length(hb - Vd*ht), min(length(h1 - Vd*dot(h1, Vd)), length(h2 - Vd*dot(h2, Vd)))), min(length(h3 - Vd*dot(h3, Vd)), length(h4 - Vd*dot(h4, Vd))));
    hd += (rp.x + rp.y)*.55 + (b2 - .5)*1.5 + (n3 - .5)*.5;
    float hin = step(dist, ht + length(uHoleAx) + 1.);
    col = mix(col, foamU*1.15, uHoleK*(1. - smoothstep(uHole.w*.9, uHole.w*2., hd))*hin*(.35 + .65*clotK));
    a = 1. - uHoleK*(1. - smoothstep(uHole.w*.3, uHole.w*1.05, hd))*hin;
  }
  gl_FragColor = vec4(max(col, 0.), a);
  // fog: the scene's from above; from below the far ceiling glows with the light that comes down through it
  float ff = 1. - exp(-fogDensity*fogDensity*vFogDepth*vFogDepth);
  // (far off the ceiling is not one flat tone: the swells of the surface cross it as long light and dark bands that
  // slide with the current, and where the water breaks the foam still shows pale through the haze)
  vec3 ceilC = uCeil;
  if (below) {
    float sw = vn(vec2(q.x*.11 + n1*.8, q.y*.42 - t*.25))*.6 + vn(vec2(q.x*.3 - n2*.5, q.y*1.1 - t*.5))*.4;
    ceilC = uCeil*(.72 + .56*sw) + (uSkyHor*.12 + uCeil*.22)*smoothstep(.6, .8, sw);
    ceilC = mix(ceilC, uWhite*(uSunCol*.15 + uSkyCol*.3)*vec3(.74, 1., .9), fzFar*.6);
    // (and toward the far end the ceiling is the mirror of far water: it goes into the water's own colour, uCeil over
    // one and a half, as the far bed does, so that the two meet in it; farK, above)
    ceilC = mix(uCeil/1.5, ceilC, farK);
  }
  gl_FragColor.rgb = mix(gl_FragColor.rgb, below ? ceilC : fogColor, ff);
  // (the same white, gain and half share of the haze as the hero's bubble wall, so that the two are one tone in every look)
  // and it is streaked: fibres of white driven down, the green of the pool in the gaps between them
  if (wz > .001) {
    float wf = vn(vec2(q.x*5.5, q.y*1.4 + t*3.))*.55 + vn(vec2(q.x*13., q.y*3.1 + t*4.4))*.45;
    vec3 wc = uWhite*(uSunCol*.3 + uSkyCol*.5)*vec3(.8, 1., .92)*(.3 + 1.05*smoothstep(.25, .7, wf))*1.3;
    gl_FragColor.rgb = mix(gl_FragColor.rgb, mix(wc, fogColor, ff*.5), wz*(.5 + .42*smoothstep(.3, .62, wf)));
  }
}`;

// ---------------------------------------------------------------- fish (the shoal and the companions)
// iA = home xyz + phase; iB = (size, yaw [0 = facing upstream, -Z], burst speed m/s, wrap length m);
// iC = (tint seed, pitch, tail-beat rate, how much it shuffles on station)
const FISH_VERT = /* glsl */`
#include <fog_pars_vertex>
${GLSL_LIGHT}
attribute vec4 aAux, iA, iB, iC;
uniform vec2 uFan;       // (roll onto its side, radians; more sweep to the tail): a female fanning her redd
uniform float uGrow;     // 0..1: the whole lot drawn small to nothing (a lot that the eye, under the falls, has no sight of)
varying vec3 vP, vN, vC, vB; varying float vFin, vSeed;
void main(){
  float ph = iA.w, t = uTime, sc = iB.x*uGrow;
  vB = position; vSeed = iC.x;
  vec3 home = iA.xyz;
  home.x += sin(t*.23 + ph*17.)*.4*iC.w; home.y += sin(t*.37 + ph*9.)*.14*iC.w; home.z += sin(t*.29 + ph*40.)*.8*iC.w;
  if (iB.z > 0.) { float tr = mod(t*iB.z + ph*iB.w, iB.w); home.z -= tr; sc *= smoothstep(0., 6., tr)*(1. - smoothstep(iB.w - 6., iB.w, tr)); }
  float b = aAux.x, w = t*iC.z + ph*30.;
  vec3 lp = position;
  lp.x += sin(w - b*2.6)*(.13 + uFan.y)*b*b + sin(w*.5)*.04*(b - .35);
  vec3 ln = normal; ln.x += cos(w - b*2.6)*(.22 + uFan.y)*b*step(.001, abs(normal.x));
  lp *= sc;
  // (a fish that holds its station, iB.z 0, may look about it: iB.w - 1 = how far it swings its head and body round, radians)
  float yw = iB.y + (iB.z > 0. ? 0. : (iB.w - 1.)*sin(t*.55 + ph*11.));
  float cy = cos(yw), sy = sin(yw), cp = cos(iC.y), sp = sin(iC.y);
  vec3 f = vec3(-sy*cp, sp, -cy*cp), r = vec3(cy, 0., -sy), u = cross(r, f);
  float cr = cos(uFan.x), sr = sin(uFan.x); vec3 r2 = r*cr + u*sr; u = u*cr - r*sr; r = r2;
  vec3 wp = home + r*lp.x + u*lp.y + f*lp.z;
  vN = safeN(r*ln.x + u*ln.y + f*ln.z); vP = wp; vFin = aAux.y;
  vC = color*(.78 + .4*h11(iC.x*3.))*mix(vec3(1.), vec3(1.1, .92, .84), h11(iC.x*7.));
  vec4 mvPosition = modelViewMatrix*vec4(wp, 1.);
  gl_Position = projectionMatrix*mvPosition;
  #include <fog_vertex>
}`;
const GLSL_WET = /* glsl */`
// light under water: steeper, netted with caustics, and red goes first with depth
vec3 wetLight(vec3 P, vec3 n, out float under){
  float wl = P.z < -.6 ? ${LIP.toFixed(1)} : 0., depth = max(wl - P.y, 0.);
  under = step(.001, depth);
  vec3 Ld = safeN(mix(uSun, vec3(uSun.x*.5, 1., uSun.z*.5), under*.7));
  float ca = vn(P.xz*.9 + vec2(uTime*.5, -uTime*.35))*vn(P.xz*1.7 - vec2(uTime*.4, uTime*.3));
  vec3 l = uSunCol*(max(dot(n, Ld)*.65 + .35, 0.)*(.55 + under*(ca*2.4 - .25)*max(n.y, 0.)) + .45*(1. - under)*max(dot(n, Ld), 0.)) + hemi(n)*.9;
  // (and by its own depth: DUSK_BED, DEEP_LIGHT)
  return l*mix(vec3(1.), vec3(.6, .84, .7), under*(1. - exp(-depth*.35)))*${GLSL_DEEP.replace('DEPTH', 'depth')};
}`;
const FISH_FRAG = /* glsl */`
#include <fog_pars_fragment>
${GLSL_LIGHT}${GLSL_SALMON_SKIN}
uniform vec3 uVolC; uniform float uAbove, uFogF, uGainF, uGainR, uFarK; uniform vec4 uBoil;      // uBoil = (the boil hides drowned bodies from the air nearer the face than x..y, bodies are cut off this deep, and this dark below the surface)
uniform vec3 uShaftD;      // the way the sun's shafts run down through the water
varying vec3 vP, vN, vC, vB; varying float vFin, vSeed;
void main(){
  float gloss, cut;
  vec3 alb = salmonSkin(vC, vB, vFin, vSeed, gloss, cut);
  // to the eye in the water with it a sockeye is not one red: the head is a clear olive green back to the gill cover,
  // the belly paler than the flank (the back is dark already)
  float body = 1. - step(.05, vFin), hdK = smoothstep(.27, .33, vB.z/1.8)*body, rel = salmonRel(vB);
  alb = mix(alb, alb*2.2 + vec3(.016, .046, .006), hdK*.92*(1. - uAbove));
  alb = mix(alb, alb*.85 + vec3(.11, .06, .05), (1. - smoothstep(.03, .3, rel))*(1. - hdK)*body*.6*(1. - uAbove));
  // TO THE EYE IN THE AIR a spawning sockeye is red over its back as well: the dark maroon back is how the eye in the
  // water sees it, against the bright ceiling. So the back that rides out of the water, and the fish on its arc, take
  // the sun as the flank does: crimson where the sun reaches, a deep red in their own shade, never black.
  alb = mix(alb, vC*vec3(.84, .8, .8), smoothstep(.55, .8, rel)*(1. - .55*smoothstep(.3, .335, vB.z/1.8))*body*.82*uAbove);
  float depth = max((vP.z < -.6 ? ${LIP.toFixed(1)} : 0.) - vP.y, 0.), under = step(.001, depth);
  float boilK = uAbove*under*(1. - smoothstep(uBoil.x, uBoil.y, vP.z))*step(-.6, vP.z);
  if (boilK > .5 || cut > .5 || uAbove*depth > uBoil.z) discard;                      // the boil is opaque from the air; fins end raggedly
  vec3 V = safeN(uCam - vP), n = safeN(vN); if (dot(n, V) < 0.) n = -n;
  // light: the sun above water; under it the light comes steeply down, netted with caustics, and red goes first with depth
  vec3 Ld = safeN(mix(uSun, vec3(uSun.x*.5, 1., uSun.z*.5), under*.7));
  float ca = vn(vP.xz*.9 + vec2(uTime*.5, -uTime*.35))*vn(vP.xz*1.7 - vec2(uTime*.4, uTime*.3));
  // the caustic net crawls over the back and over the flank that is turned to the sun; and where one of the sun's
  // shafts comes down through the water (sb: the place on the surface the light came in by) the fish it crosses is lit
  float eyeW = under*(1. - uAbove);
  float sunSide = max(dot(n.xz, uSun.xz)/max(length(uSun.xz), 1e-4), 0.)*(1. - abs(n.y));
  vec2 shq = vP.xz - uShaftD.xz*((vP.y - (vP.z < -.6 ? ${LIP.toFixed(1)} : 0.))/min(uShaftD.y, -.2));
  float sb = smoothstep(.6, .78, vn(shq*.4 + vec2(uTime*.05, -uTime*.09)))*eyeW;
  float form = salmonForm(n, Ld, mix(.3, .38, under))*(1. + under*(ca*2.2 - .3)*(max(n.y, 0.)*.8 + sunSide*.7*eyeW));
  // to the eye under water the light comes from above: a lit back and upper flank over a belly in its own shade
  form *= mix(1., .34 + .66*smoothstep(-.8, .15, n.y), under*(1. - uAbove));
  form *= 1. + sb*.9*smoothstep(-.3, .5, n.y + sunSide);
  vec3 E = (uSunCol*.3 + uSkyCol*.5 + uGndCol*.2)*mix(vec3(1.), vec3(.86, .84, .72), under*(1. - exp(-depth*.35)));
  float fr = 1. - max(dot(n, V), 0.), back = max(dot(-V, uSun), 0.); back *= back;
  vec3 col = salmonLit(alb*(1. + vFin*(.7 + back*2.2*(1. - under))), E, form);       // crimson that keeps its shading in any light
  col += alb*uSunCol*fr*fr*(.04 + .2*back)*(1. - under);
  // a soft sheen along the lit upper flank (wet skin, not paint), and the water's own green light on every edge that turns away
  float sheen = max(dot(n, safeN(Ld + V)), 0.); sheen *= sheen; sheen *= sheen;
  col += (uSunCol*.05*sheen*sheen*(.4 + .6*smoothstep(.2, .8, rel)) + uVolC*fr*fr*.55)*body*eyeW;
  float sp = pow(max(dot(n, safeN(Ld + V)), 0.), 160.) + .6*pow(max(dot(n, safeN(V + vec3(0., 1.3, 0.) + uSun*.6)), 0.), 260.);
  col += uSunCol*sp*(.3 + .5*gloss)*(1. - vFin)*mix(1., .22, under) + uSkyCol*fr*fr*mix(.09, .03, under);   // one small wet glint
  // THE RUN'S RED, BY THE METRES OF WATER BETWEEN THE FISH AND THE EYE (one rule for every reach and both tiers; the
  // brief's 60 m of visibility): a fish keeps its own colours, the crimson plain, out to 30 m, and goes over to the
  // water's colour between 30 and 60 m (the haze of the water itself, the fog below, lies over that as over everything)
  { float wd = length(uCam - vP), wet = (1. - uAbove)*uFarK;
    col = mix(col, fogColor*mix(.3, .46, smoothstep(-.3, .5, n.y)), smoothstep(30., 60., wd)*wet); }
  // seen from the air, by the depth of water over it: the part of a body that lies within 0.4 m of the surface keeps
  // its red; below that it goes down into the water's own colour, a dark shape and not a pale one. Where a body breaks
  // the surface a thread of light lies along its waterline, so that a back that is out of the water is seen to be out
  // (and from the waterline down the body is in the water: it takes the water's own tint at once, a deeper red than the
  // back that is out in the sun, so that a fish awash is seen to lie in the river and not on it)
  col = mix(col, col*vec3(.6, .68, .64) + uVolC*.1, uAbove*smoothstep(.0, .1, depth)*.42);
  col = mix(col, col*vec3(.7, .64, .6) + uVolC*.04, uAbove*smoothstep(.4, 1.8, depth)*.85);
  col = mix(col, uVolC*.5, uAbove*smoothstep(.4, 2.2, depth)*.56);
  { float sLv = (vP.z < -.6 ? ${LIP.toFixed(1)} : 0.) - vP.y;
    col = mix(col, uSunCol*.3 + uSkyCol*.5, uAbove*(1. - smoothstep(.0, .018 + length(uCam - vP)*.0024, abs(sLv)))*.55*(step(16., vP.z) + step(vP.z, -12.))); }
  // (uGainR lifts the red of the flank alone: the dark back, the olive head and the fins stay dark)
  gl_FragColor = vec4(max(col, 0.)*uGainF*mix(1., uGainR, smoothstep(.12, .3, alb.r - max(alb.g, alb.b)))*mix(1., uBoil.w, uAbove*under), 1.);
  gl_FragColor.rgb = mix(gl_FragColor.rgb, fogColor, 1. - exp(-fogDensity*fogDensity*vFogDepth*vFogDepth*uFogF));
}`;

// the far tier: two crossed cards per fish, one upright along the body (the flank: a spindle with a forked tail) and
// one flat (the back seen from above or below), so that from any side it has a fish's outline and from behind it is
// as slight as a fish is. The tail corners still beat. Same instance attributes as the modelled fish; never nearer
// than 13 m. aQ = (along the body -1 tail .. 1 nose, across -1..1, 0 upright card / 1 flat card)
const CARD_VERT = /* glsl */`
#include <fog_pars_vertex>
${GLSL_LIGHT}
attribute vec3 aQ; attribute vec4 iA, iB, iC;
varying vec3 vQ, vP; varying float vSeed, vEnd;
void main(){
  float ph = iA.w, t = uTime, sc = iB.x;
  vec3 home = iA.xyz;
  home.x += sin(t*.23 + ph*17.)*.4*iC.w; home.y += sin(t*.37 + ph*9.)*.14*iC.w; home.z += sin(t*.29 + ph*40.)*.8*iC.w;
  if (iB.z > 0.) { float tr = mod(t*iB.z + ph*iB.w, iB.w); home.z -= tr; sc *= smoothstep(0., 6., tr)*(1. - smoothstep(iB.w - 6., iB.w, tr)); }
  float b = clamp((.45 - position.z)/1.35, 0., 1.);
  vec3 lp = position; lp.x += sin(t*iC.z + ph*30. - b*2.6)*.23*b*b + sin(t*iC.z*.5 + ph*30.)*.05*(b - .35);
  lp *= sc;
  float cy = cos(iB.y), sy = sin(iB.y), cp = cos(iC.y), sp = sin(iC.y);
  vec3 f = vec3(-sy*cp, sp, -cy*cp), r = vec3(cy, 0., -sy), u = cross(r, f);
  // seen nose-on or tail-on a fish is slight: the flat card narrows and the head's colour goes
  vEnd = smoothstep(.72, .96, abs(dot(f, safeN(uCam - home))));
  lp.x *= 1. - .62*vEnd*aQ.z;
  vec3 wp = home + r*lp.x + u*lp.y + f*lp.z;
  vQ = aQ; vP = wp; vSeed = iC.x;
  vec4 mvPosition = modelViewMatrix*vec4(wp, 1.);
  gl_Position = projectionMatrix*mvPosition;
  #include <fog_vertex>
}`;
const CARD_FRAG = /* glsl */`
#include <fog_pars_fragment>
${GLSL_LIGHT}${GLSL_SALMON_SKIN}
uniform vec3 uRed, uOlive, uVolC, uShaftD; uniform float uAbove, uFogF, uGainF, uGainR, uFarK;
varying vec3 vQ, vP; varying float vSeed, vEnd;
void main(){
  float x = vQ.x, y = vQ.y, top = vQ.z;
  float bx = clamp((x + .68)/1.68, 0., 1.);
  // the outline of a sockeye, not an oval: a slim wrist before the tail, the back humped ahead of the dorsal fin, a
  // flatter belly, the dorsal, pelvic and anal fins standing out of it (the flat card, the fish from above, is slimmer)
  float prof0 = pow(max(sin(3.1416*pow(bx, .8)), 0.), .75)*step(-.68, x)*mix(.5, 1., smoothstep(.02, .32, bx));
  float hump = exp(-(bx - .63)*(bx - .63)*22.);
  float finT = max(1. - abs(bx - .5)/.085, 0.)*.26, finB = max(max(1. - abs(bx - .4)/.06, 0.)*.17, max(1. - abs(bx - .2)/.07, 0.)*.2);
  float bodyE = prof0*mix(y > 0. ? .76*(1. + .2*hump) : .7, .5, top);
  float prof = bodyE + mix(y > 0. ? finT : finB, 0., top)*step(.05, prof0);
  float finK = (1. - top)*smoothstep(bodyE - .02, bodyE + .03, abs(y));
  float tl = clamp((-.64 - x)/.36, 0., 1.);
  float tail = step(x, -.64)*mix(step(abs(y), .14 + .82*tl)*step(max(tl - .55, 0.)*1.3, abs(y)), step(abs(y), .16), top);
  float depth = max((vP.z < -.6 ? ${LIP.toFixed(1)} : 0.) - vP.y, 0.), under = step(.001, depth);
  float boilK = uAbove*under*(1. - smoothstep(15., 34., vP.z))*step(-.6, vP.z);
  if (max(step(abs(y), prof), tail) < .5 || boilK > .5) discard;
  vec3 base = uRed*(.78 + .4*h11(vSeed*3.))*mix(vec3(1.), vec3(1.1, .92, .84), h11(vSeed*7.));
  float eyeW = under*(1. - uAbove), headK = smoothstep(.56, .7, x);
  base = mix(base, mix(uOlive, uOlive*1.9 + vec3(.012, .024, .004), eyeW), max(headK, step(x, -.64)*.8)*(1. - .85*vEnd));
  float yy = mix(y, .75, top);                                 // the flat card shows the dark back
  // across the upright card the body is round: yn = -1 at the belly line, 1 at the back line. The flank faces the eye,
  // the back and the belly turn away from it; the belly is paler, the back dark
  float yn = clamp(y/max(bodyE, .06), -1., 1.), rnd = mix(sqrt(max(1. - yn*yn, 0.)), 1., top);
  base = mix(base, uOlive*.8, finK*.85);
  base = mix(base, base*.85 + vec3(.11, .06, .05), (1. - smoothstep(-.85, -.35, yn))*(1. - headK)*(1. - top)*.6*eyeW*step(-.64, x));
  float backK = mix(smoothstep(.12, .5, yy), smoothstep(.3, .7, mix(yn, 1., top)), eyeW)*.94;
  base = mix(base, base*.13 + vec3(.016, .018, .01), backK);
  float ca = vn(vP.xz*.9 + vec2(uTime*.5, -uTime*.35))*vn(vP.xz*1.7 - vec2(uTime*.4, uTime*.3));
  vec2 shq = vP.xz - uShaftD.xz*((vP.y - (vP.z < -.6 ? ${LIP.toFixed(1)} : 0.))/min(uShaftD.y, -.2));
  float sb = smoothstep(.6, .78, vn(shq*.4 + vec2(uTime*.05, -uTime*.09)))*eyeW;
  float form = mix(.36, 1., smoothstep(-1., .15, yy))*(1. + under*(ca*2.2 - .3)*max(yy, 0.)*.8)*mix(1., .5 + .5*rnd, eyeW)*(1. + sb*.9*smoothstep(-.3, .5, yy));
  vec3 E = (uSunCol*.3 + uSkyCol*.5 + uGndCol*.2)*mix(vec3(1.), vec3(.86, .84, .72), under*(1. - exp(-depth*.35)));
  vec3 col = salmonLit(base, E, form);
  col += uVolC*(1. - rnd)*.45*eyeW;
  // the run's red by the metres of water between the fish and the eye, the same rule as the modelled fish (FISH_FRAG):
  // its own colours out to 30 m, over to the water's colour between 30 and 60 m
  float wd = length(uCam - vP), wet = (1. - uAbove)*uFarK, farK = smoothstep(30., 60., wd)*wet;
  col = mix(col, fogColor*mix(.28, .46, smoothstep(-.6, .5, yy)*(1. - backK)), farK);
  // (and from the air by the depth of water over it, as the modelled fish)
  col = mix(col, col*vec3(.7, .64, .6) + uVolC*.04, uAbove*smoothstep(.4, 1.8, depth)*.85);
  col = mix(col, uVolC*.5, uAbove*smoothstep(.4, 2.2, depth)*.56);
  gl_FragColor = vec4(max(col, 0.)*uGainF*mix(uGainR, 1., max(backK, farK)), 1.);
  gl_FragColor.rgb = mix(gl_FragColor.rgb, fogColor, 1. - exp(-fogDensity*fogDensity*vFogDepth*vFogDepth*uFogF));
}`;

// sun shafts: soft beams from the surface down along the refracted light, each a quad turned about its own axis to
// face the eye, living in a tile that wraps about the camera (the kit's rays fade out in water this shallow).
// iS = (x, z in the tile, width m, phase). A beam's length L is uLen times a share between uShort and 1 that is its
// own (the fraction of 7.3 phases). Its half width is wd times 0.75 at the surface and 1.25 at its foot, wd being
// uWd.x plus uWd.y times its own width, and never more than a quarter of L or 0.5 m, whichever is the greater. Its
// light is a bell across (SHAFT_FRAG) that is half its peak 0.54 of the half width from the axis: at the surface of a
// beam whose wd is 1 m that is 0.81 m from side to side.
const SHAFT_VERT = /* glsl */`
uniform float uTime, uSurfY, uLen, uRange, uWK, uShort; uniform vec2 uWd; uniform vec3 uCam, uDir, uAvoid;
attribute vec4 iS;
varying vec2 vQ; varying float vA;
void main(){
  vec2 c = mod(iS.xy - uCam.xz + uRange, 2.*uRange) - uRange;
  float edge = 1. - smoothstep(.7, 1., max(abs(c.x), abs(c.y))/uRange);
  float s = position.y*.5 + .5;
  float L = uLen*mix(uShort, 1., fract(iS.w*7.3)), wd = min(uWd.x + uWd.y*iS.z, max(.5, .25*L));
  vec3 p = vec3(uCam.x + c.x, uSurfY, uCam.z + c.y) + uDir*(L*s);
  p.x += sin(uTime*.3 + iS.w*40.)*.3*s;
  vec4 mv = viewMatrix*vec4(p, 1.);
  vec3 dv = (viewMatrix*vec4(uDir, 0.)).xyz;
  vec2 sd = vec2(-dv.y, dv.x); float sl = length(sd); sd = sl > 1e-3 ? sd/sl : vec2(1., 0.);
  mv.xy += sd*position.x*wd*(.75 + .5*s);
  vQ = vec2(position.x, s);
  float flick = .6 + .4*sin(uTime*(.5 + iS.w) + iS.w*50.)*sin(uTime*.23 + iS.w*17.);
  float fd = uWK*max(-mv.z, 0.);
  vA = edge*flick*smoothstep(1.5, 7., -mv.z)*smoothstep(.15, .5, sl)*exp(-fd*fd);
  // none on the sight line to the sitting bear, nor on the bear itself (uAvoid = its x, z and the clear radius)
  vec2 sa = uAvoid.xy - uCam.xz, sq = vec2(uCam.x + c.x, uCam.z + c.y) + uDir.xz*(uLen*.4) - uCam.xz;
  float st = clamp(dot(sq, sa)/max(dot(sa, sa), 1e-3), 0., 1.25);
  vA *= smoothstep(uAvoid.z*.55, uAvoid.z, length(sq - sa*st));
  gl_Position = projectionMatrix*mv;
}`;
// across: 1 on the axis, nothing and level at the quad's two sides. along: the product of a rise from nothing at the
// surface to 1 at 0.12 of the length, and of ((1 - the share of the length)/0.88) to the power uThin: 1 at 0.12 of the
// length, nothing at the foot.
const SHAFT_FRAG = /* glsl */`
uniform vec3 uShaftCol; uniform float uGain, uThin;
varying vec2 vQ; varying float vA;
void main(){
  float across = 1. - vQ.x*vQ.x; across *= across;
  float along = smoothstep(0., .12, vQ.y)*pow(max(1. - vQ.y, 0.)/.88, uThin);
  gl_FragColor = vec4(uShaftCol*(across*along*vA*uGain), 1.);
}`;

// ---------------------------------------------------------------- props: cobbles, logs, wolf (vertex colour, hero light)
// (uGrow, 0..1: the prop's own shape drawn small to nothing about its seat, before the instance's matrix; 1 from propMat)
const PROP_VERT = /* glsl */`
#include <fog_pars_vertex>
uniform float uGrow;
varying vec3 vP, vN, vC, vL;
void main(){
  vec4 wp = vec4(position*uGrow, 1.); vec3 nn = normal;
  #ifdef USE_INSTANCING
    wp = instanceMatrix*wp; nn = mat3(instanceMatrix)*nn;
  #endif
  wp = modelMatrix*wp;
  vP = wp.xyz; vL = position; vN = mat3(modelMatrix)*nn; vC = color;
  #ifdef USE_INSTANCING_COLOR
    vC *= instanceColor;
  #endif
  vec4 mvPosition = viewMatrix*wp;
  gl_Position = projectionMatrix*mvPosition;
  #include <fog_vertex>
}`;
const PROP_FRAG = /* glsl */`
#include <fog_pars_fragment>
${GLSL_LIGHT}${GLSL_WET}
uniform vec4 uGrain;        // (frequency x, y, strength, rim)
uniform float uFogK, uTone;  // how much of the water's or the air's haze it takes, and a plain gain
uniform float uAlgae;        // drowned wood: its upper sides are furred green and take the light
varying vec3 vP, vN, vC, vL;
void main(){
  vec3 V = safeN(uCam - vP), n = safeN(vN); if (dot(n, V) < 0.) n = -n;
  float g = fbm(vec2(vL.x*uGrain.x + vL.z*uGrain.x*.7, vL.y*uGrain.y + vL.z*uGrain.y*.4));
  float g2 = vn(vec2(vL.x + vL.y, vL.z - vL.y)*uGrain.x*3.1);
  vec3 alb = vC*(1. + uGrain.z*(g*1.5 + g2*.5 - 1.));
  float under; vec3 lgt = wetLight(vP, n, under);
  float up = smoothstep(.05, .75, n.y)*uAlgae*under;
  alb = mix(alb, alb*vec3(.62, .8, .42) + vec3(.01, .024, .008)*(.4 + 1.2*g), up*(.45 + .55*g2));
  vec3 col = alb*lgt*(1. + .3*up);
  // (from afar drowned wood stands dark against the lit water behind it: its own colours come up as the eye nears)
  col *= mix(1., mix(.14, 1., 1. - smoothstep(13., 36., length(uCam - vP))), uAlgae*under);
  float fr = 1. - max(dot(n, V), 0.), back = max(dot(-V, uSun), 0.);
  col += uSunCol*fr*fr*fr*uGrain.w*(.15 + back*back)*(1. - under) + uSkyCol*fr*fr*.05;
  gl_FragColor = vec4(max(col, 0.)*uTone, 1.);
  gl_FragColor.rgb = mix(gl_FragColor.rgb, fogColor, 1. - exp(-fogDensity*fogDensity*vFogDepth*vFogDepth*uFogK));
}`;

// the drowned spruce's wood (windthrowGeometry): aAux = (turn round the limb 0..1, metres along it, its radius there,
// kind 0 bark | 1 soil of the plate | 2 stone | 3 broken wood). Bark is ridged along each limb, the plate is a mat
// of roots with gravel in it; every upper side is furred with olive algae that streams down the current and takes
// the caustic net; every underside is lit green-brown by the pale bed below and by the water's own scattered light.
// From afar it stands dark against the lit water (its colours come up as the eye nears).
const WOOD_VERT = /* glsl */`
#include <fog_pars_vertex>
attribute vec4 aAux;
varying vec3 vP, vN, vC, vL; varying vec4 vA;
void main(){
  vec4 wp = modelMatrix*vec4(position, 1.);
  vP = wp.xyz; vL = position; vN = mat3(modelMatrix)*normal; vC = color; vA = aAux;
  vec4 mvPosition = viewMatrix*wp;
  gl_Position = projectionMatrix*mvPosition;
  #include <fog_vertex>
}`;
const WOOD_FRAG = /* glsl */`
#include <fog_pars_fragment>
${GLSL_LIGHT}${GLSL_WET}
uniform float uFogK, uBedY;
varying vec3 vP, vN, vC, vL; varying vec4 vA;
float pn(vec2 p, float per){
  vec2 i = floor(p), f = fract(p); f = f*f*(3. - 2.*f);
  float x0 = mod(i.x, per), x1 = mod(i.x + 1., per);
  return mix(mix(h21(vec2(x0, i.y)), h21(vec2(x1, i.y)), f.x), mix(h21(vec2(x0, i.y + 1.)), h21(vec2(x1, i.y + 1.)), f.x), f.y);
}
void main(){
  vec3 V = safeN(uCam - vP), n = safeN(vN); if (dot(n, V) < 0.) n = -n;
  float kind = vA.w, isBark = 1. - step(.5, kind), isSoil = step(.5, kind)*(1. - step(1.5, kind)), isStone = step(1.5, kind)*(1. - step(2.5, kind)), isCut = step(2.5, kind);
  float dist = length(uCam - vP), nearK = 1. - smoothstep(9., 26., dist);
  // a limb's width in pixels (wpx): twice its radius over its distance times the angle between the rays of two
  // pixels side by side AT THE PICTURE'S MIDDLE, one angle for the whole of the picture being drawn, whatever its
  // size. pc is the fragment's place in the space of the camera that draws it; the ray to it turns, from this
  // pixel to the next across, by this pixel's own angle (the length of dFdx of the ray), which for the ray
  // through (X, Y, -1) is the middle's angle times sqrt(1 + Y*Y)/(1 + X*X + Y*Y): divided out, it is the
  // middle's. So a limb is as wide in the picture's corner as in its middle at the same distance, and turning
  // the gaze in place changes no limb's wpx.
  // From 0.6 to 1.8 pixels wide bark and broken wood are thin (1 to 0). From 0.6 down to 0.4 of a pixel a limb
  // goes out piece by piece and under that none of it is drawn: it is told off along its own length in pieces
  // six of its radii long, each piece has a number of its own from 0 to 1 (a hash of which piece it is along
  // the limb, nothing of the screen), and a piece is left out once (wpx - 0.4)/0.2 is under its number.
  vec3 pc = (viewMatrix*vec4(vP, 1.)).xyz; float dc = max(length(pc), 1e-3); vec2 xy = pc.xy/max(-pc.z, 1e-3);
  float mid = length(dFdx(pc/dc))*(1. + dot(xy, xy))/sqrt(1. + xy.y*xy.y);
  float wpx = 2.*vA.z/(dc*max(mid, 1e-6)), thin = (isBark + isCut)*(1. - smoothstep(.6, 1.8, wpx));
  if (isBark + isCut > .5 && (wpx - .4)/.2 < h21(vec2(floor(vA.y/(6.*max(vA.z, 1e-3))), 3.))) discard;
  // bark: ridges and furrows along the limb, broken into plates by cross cracks
  float big = step(.4, vA.z), per = mix(8., 22., big);
  vec2 bq = vec2(vA.x*per, vA.y*mix(.9, .5, big));
  float r1 = pn(bq, per), r2 = pn(bq*vec2(2., 2.3) + vec2(3., 7.), per*2.);
  float ridge = smoothstep(0., .55, abs(2.*r1 - 1.))*(.72 + .28*r2);
  float crack = smoothstep(.06, .2, abs(fract(vA.y*mix(1.3, .7, big) + r2*.9) - .5));
  float hBark = ridge*(.6 + .4*crack);
  // the plate: roots matted in the bed, running out from its middle, gravel caught between them
  float ay = abs(vL.y) < 1e-4 ? 1e-4 : vL.y, ang = atan(vL.z, ay), rad = length(vL.yz);
  float seam = smoothstep(2.6, 3.1, abs(ang));
  float fib = mix(vn(vec2(ang*7., rad*.9 + vL.x*1.5)), vn(vec2(rad*.9, vL.x*1.5 + 4.)), seam), fib2 = mix(vn(vec2(ang*23. + 3., rad*2.1)), vn(vec2(rad*2.1, 9.)), seam);
  float matt = smoothstep(.3, .7, fib)*.6 + smoothstep(.35, .7, fib2)*.4;
  vec2 pq = vL.yz*2.6 + vec2(vL.x*.7, 0.), ci = floor(pq), cf = fract(pq) - .5;
  float hh = h21(ci), pr = .16 + .22*h21(ci + 7.);
  float peb = (1. - smoothstep(pr - .07, pr, length((cf + (vec2(h21(ci + 3.), h21(ci + 5.)) - .5)*.5)*vec2(1., .7 + .6*h21(ci + 9.)))))*step(.7, hh);
  float hSoil = matt*.7 + peb*.9 + .4*vn(vL.yz*5.3);
  float grain = vn(vec2(vL.y*26. + vL.x*9., vL.z*26.));
  // (in the plate's earth the matted roots are the dark: 1.1 of its colour where there is no mat, 0.4 where the mat
  // is thickest; its pebbles are a pale grey)
  vec3 alb = vC*(isBark*(.4 + .9*hBark) + isSoil*(1.1 - .7*matt) + isStone*(.8 + .3*grain) + isCut*(.65 + .6*grain));
  alb = mix(alb, vec3(.4, .39, .34)*(.6 + .7*h21(ci + 11.)), isSoil*peb);
  alb *= mix(vec3(1.), vec3(1.28, .96, .7), isBark + isSoil*.6*(1. - peb));
  // relief from the same patterns (near the eye only)
  float h = (isBark*hBark*.05 + isSoil*hSoil*.09)*nearK;
  vec3 sx = dFdx(vP), sy = dFdy(vP), R1 = cross(sy, n), R2 = cross(n, sx);
  float det = dot(sx, R1);
  vec3 grad = sign(det)*(dFdx(h)*R1 + dFdy(h)*R2);
  n = safeN(abs(det)*n - clamp(grad, -1., 1.)*step(1e-9, abs(det)));
  float under; vec3 lgt = wetLight(vP, n, under);
  // algae on every upper side, in streaks down the current
  float up = smoothstep(-.05, .7, n.y), st = vn(vec2(vP.x*2.9 + vP.y*2.1, vP.z*.4)), fz = vn(vP.xz*8. + vP.y*3.);
  float alg = up*smoothstep(.3, .72, st)*(1. - .8*isCut);
  alb = mix(alb, vec3(.05, .058, .026)*(.6 + 1.1*fz)*(.7 + .5*hBark*isBark + .3*(1. - isBark)), alg*.5);
  // the undersides: the pale bed's light from below, and the water's own light from every side
  vec3 bounce = (uSunCol*.2 + uSkyCol*.34)*vec3(.56, .6, .36)*(.5 - .5*n.y)*(.7 + .6*(1. - smoothstep(0., 7., vP.y - uBedY)));
  // (the sun's and the sky's light on it falls to 0.16 of itself from 30 to 45 m from the eye; the bed's light from
  // below and the water's own light do not)
  vec3 col = alb*(lgt*(1. + .15*alg)*mix(.16, 1., 1. - smoothstep(30., 45., dist)) + bounce + fogColor*.3*under);
  float fr = 1. - max(dot(n, V), 0.);
  col += fogColor*fr*fr*.06*under;
  gl_FragColor = vec4(max(col, 0.), 1.);
  gl_FragColor.rgb = mix(gl_FragColor.rgb, fogColor, 1. - exp(-fogDensity*fogDensity*vFogDepth*vFogDepth*uFogK));
  // (by thin a limb goes up to 0.8 of the way to the fog's colour)
  gl_FragColor.rgb = mix(gl_FragColor.rgb, fogColor, thin*.8);
}`;

// the wolf: the prop shader's light on a body that lives. aAux = (leg phase 0.25 | 0.75 by diagonal pair, leg weight
// 0 at the shoulder .. 1 at the paw, head and neck weight, tail weight). uGait = (stride phase in turns, swing in
// radians, head yaw, head pitch): the legs swing from shoulder and hip as diagonal pairs, the paw lifting as it comes
// forward, the back rides the stride, the head turns on the neck, the tail hangs and sways.
const WOLF_VERT = /* glsl */`
#include <fog_pars_vertex>
uniform float uTime; uniform vec4 uGait;
attribute vec4 aAux;
varying vec3 vP, vN, vC, vL;
void rotYZ(inout vec3 p, inout vec3 n, vec2 piv, float a){
  float c = cos(a), s = sin(a); vec2 d = p.yz - piv;
  p.yz = piv + vec2(d.x*c - d.y*s, d.x*s + d.y*c); n.yz = vec2(n.y*c - n.z*s, n.y*s + n.z*c);
}
void main(){
  vec3 p = position, nn = normal;
  float ph = 6.2832*(uGait.x + aAux.x), lw = smoothstep(0., .3, aAux.y);
  // legs: forward and back from the joint, the lower leg folding a little as it comes forward
  float pz = position.z > -.3 ? .8 : -1.45;
  rotYZ(p, nn, vec2(2.05, pz), -uGait.y*sin(ph)*lw);
  float fold = max(cos(ph), 0.)*uGait.y*aAux.y*aAux.y;
  p.y += fold*.75; p.z -= fold*.5*smoothstep(.5, 1., aAux.y);
  // the back rides the stride twice a cycle, and breathes
  float body = 1. - lw;
  p.y += body*(uGait.y*.16*sin(12.566*uGait.x) + .012*sin(uTime*1.9));
  // head and neck: turn (yaw) and nod (pitch) about the base of the neck
  float hw = aAux.z;
  { float a = uGait.z*hw, c = cos(a), sn = sin(a); vec2 d = p.xz - vec2(0., 1.3);
    p.xz = vec2(0., 1.3) + vec2(d.x*c + d.y*sn, -d.x*sn + d.y*c); nn.xz = vec2(nn.x*c + nn.z*sn, -nn.x*sn + nn.z*c); }
  rotYZ(p, nn, vec2(2.3, 1.3), -uGait.w*hw);
  // tail
  p.x += aAux.w*(sin(uTime*1.3)*.1 + sin(6.2832*uGait.x)*uGait.y*.6)*(2.3 - position.y);
  vec4 wp = modelMatrix*vec4(p, 1.);
  vP = wp.xyz; vL = position; vN = mat3(modelMatrix)*nn; vC = color;
  vec4 mvPosition = viewMatrix*wp;
  gl_Position = projectionMatrix*mvPosition;
  #include <fog_vertex>
}`;

// lichen: hanging tapered strands that sway and never get thinner than about 1.5 px. aL = (t down the strand, side, phase, width)
const LICHEN_VERT = /* glsl */`
#include <fog_pars_vertex>
uniform float uTime, uPx; uniform vec3 uCam;
attribute vec4 aL;
varying float vT;
void main(){
  vec3 p = position;
  float sw = aL.x*aL.x;
  p.x += sin(uTime*1.1 + aL.z*6.3 + p.y*.4)*.45*sw + sin(uTime*.37 + aL.z*11.)*.3*sw;
  p.z += cos(uTime*.83 + aL.z*9.)*.3*sw;
  vec4 mvPosition = modelViewMatrix*vec4(p, 1.);
  float w = max(aL.w*(1. - .75*aL.x), -mvPosition.z*uPx*1.6);
  mvPosition.x += aL.y*w*.5;
  vT = aL.x;
  gl_Position = projectionMatrix*mvPosition;
  #include <fog_vertex>
}`;
const LICHEN_FRAG = /* glsl */`
#include <fog_pars_fragment>
uniform vec3 uSunCol, uSkyCol, uTint;
varying float vT;
void main(){
  gl_FragColor = vec4(uTint*(uSunCol*.22 + uSkyCol*.55)*(1.1 - .5*vT), 1.);
  #include <fog_fragment>
}`;

// mergansers: floating, bobbing, sometimes diving; at uGo > 0 they patter away across the water, wings beating
// iA = (x, z, phase, heading), aAux = (wing side -1/0/1, wing tip 0..1, 0, 0)
const DUCK_VERT = /* glsl */`
#include <fog_pars_vertex>
${GLSL_LIGHT}
uniform float uGo, uSize;
attribute vec4 aAux, iA, iB;      // iB = (wing phase 0..1, beats a second x 6.28, how high it has lifted off, the second it lifts)
varying vec3 vP, vN, vC;
void main(){
  float ph = iA.z, s = max(uGo - ph*1.1, 0.), go = smoothstep(0., .25, s);
  vec3 lp = position;
  float a = mix(-1.25, (sin(uTime*iB.y + iB.x*6.2832 - aAux.y*1.1)*1.02 + .1)*(1. + .4*aAux.y), go)*aAux.x;
  if (abs(aAux.x) > .5) { float c = cos(a), sn = sin(a); vec2 d = lp.xy - vec2(.22*aAux.x, .3); d = vec2(d.x*c - d.y*sn, d.x*sn + d.y*c); lp.xy = d + vec2(.22*aAux.x, .3); }
  float dive = smoothstep(0., .6, sin(uTime*.35 + ph*31.) - .82)*(1. - go);
  float pitch = -dive*1.1 + go*.22, cpi = cos(pitch), spi = sin(pitch);
  lp.yz = vec2(lp.y*cpi + lp.z*spi, -lp.y*spi + lp.z*cpi);
  float run = 2.5*s + 3.2*s*s*.5; run = min(run, 2.5*s + 60.);
  float h = iA.w, ch = cos(h), sh = sin(h);
  vec3 f = vec3(sh, 0., ch), r = vec3(ch, 0., -sh);
  vec3 base = vec3(iA.x, ${LIP.toFixed(1)} + .02 + sin(uTime*1.3 + ph*9.)*.04 - dive*1.6 + go*.25 + min(s*.22, 1.4)*go + iB.z*smoothstep(iB.w, iB.w + 1.1, s), iA.y) + f*run;
  base.x += sin(uTime*.2 + ph*5.)*.6*(1. - go);
  vec3 wp = base + (r*lp.x + vec3(0., lp.y, 0.) + f*lp.z)*uSize;
  vN = safeN(r*normal.x + vec3(0., normal.y, 0.) + f*normal.z); vP = wp; vC = color;
  vec4 mvPosition = modelViewMatrix*vec4(wp, 1.);
  gl_Position = projectionMatrix*mvPosition;
  #include <fog_vertex>
}`;
const DUCK_FRAG = /* glsl */`
#include <fog_pars_fragment>
${GLSL_LIGHT}
varying vec3 vP, vN, vC;
void main(){
  if (uCam.y > ${LIP.toFixed(1)} && vP.y < ${LIP.toFixed(1)} - .05) discard;
  vec3 V = safeN(uCam - vP), n = safeN(vN); if (dot(n, V) < 0.) n = -n;
  vec3 col = vC*(uSunCol*max(dot(n, uSun)*.7 + .3, 0.)*.75 + hemi(n)*.9);
  float fr = 1. - max(dot(n, V), 0.);
  col += uSkyCol*fr*fr*.12;
  gl_FragColor = vec4(col, 1.);
  #include <fog_fragment>
}`;

// the gulls standing round the carcass: they stand with their wings folded along their flanks, peck, and for a second
// in every few spread them and hop at a neighbour; three hang over the squabble on beating wings. Each bird carries
// both wings twice: folded (aAux.w 0) and spread (aAux.w 1); one is drawn to nothing while the other shows.
// iA = (x, y, z, heading), iB = (phase, period s, size, 1 = hovering), aAux = (wing side, span 0..1, head weight, spread wing)
const GULL_VERT = /* glsl */`
#include <fog_pars_vertex>
${GLSL_LIGHT}
attribute vec4 aAux, iA, iB;
varying vec3 vP, vN, vC;
void main(){
  float ph = iB.x, s = mod(uTime + ph*iB.y, iB.y);
  float flare = max(smoothstep(0., .18, s)*(1. - smoothstep(1.7, 2.3, s)), iB.w);
  float peck = smoothstep(.5, .9, sin(uTime*1.7 + ph*40.))*(1. - flare);
  vec3 lp = position, ln = normal;
  { float a = (peck*.95 - flare*.25)*aAux.z, c = cos(a), sn = sin(a); vec2 d = lp.yz - vec2(.55, .3); lp.yz = vec2(d.x*c - d.y*sn, d.x*sn + d.y*c) + vec2(.55, .3); ln.yz = vec2(ln.y*c - ln.z*sn, ln.y*sn + ln.z*c); }
  float wing = step(.5, abs(aAux.x));
  vec3 piv = vec3(.2*aAux.x, .7, .16);
  // the spread wing beats from the shoulder, the outer half lagging; the folded one lies still
  float beat = sin(uTime*13. + ph*20. - aAux.y*1.1)*mix(.42, .62, iB.w) + mix(.5, .3, iB.w);
  float a = beat*aAux.x*aAux.w, c = cos(a), sn = sin(a);
  vec3 d = (lp - piv)*mix(1. - flare, flare, aAux.w);
  d.xy = vec2(d.x*c - d.y*sn, d.x*sn + d.y*c); ln.xy = mix(ln.xy, vec2(ln.x*c - ln.y*sn, ln.x*sn + ln.y*c), wing);
  lp = mix(lp, piv + d, wing);
  lp *= iB.z;
  float h = iA.w + sin(uTime*.4 + ph*9.)*.3, ch = cos(h), sh = sin(h);
  vec3 f = vec3(sh, 0., ch), r = vec3(ch, 0., -sh);
  vec3 wp = iA.xyz + vec3(0., mix(flare*abs(sin(s*7.))*.5, .28*sin(uTime*2.1 + ph*13.), iB.w), 0.) + f*(flare*.45*(1. - iB.w) + lp.z) + r*lp.x + vec3(0., lp.y, 0.);
  wp.x += iB.w*.35*sin(uTime*.9 + ph*21.);
  vN = safeN(r*ln.x + vec3(0., ln.y, 0.) + f*ln.z); vP = wp; vC = color;
  vec4 mvPosition = modelViewMatrix*vec4(wp, 1.);
  gl_Position = projectionMatrix*mvPosition;
  #include <fog_vertex>
}`;
const GULL_FRAG = /* glsl */`
#include <fog_pars_fragment>
${GLSL_LIGHT}
varying vec3 vP, vN, vC;
void main(){
  vec3 V = safeN(uCam - vP), n = safeN(vN); if (dot(n, V) < 0.) n = -n;
  // a white bird in shade is grey, not blue: the fill is the sky's with most of its colour taken out, and the gravel throws light up
  vec3 hm = hemi(n), fill = mix(hm, vec3(dot(hm, vec3(.3, .5, .2)))*vec3(1.03, 1., .95), .62);
  float ndl = dot(n, uSun);
  vec3 col = vC*(uSunCol*(max(ndl*.62 + .38, 0.)*.6) + fill*1.45 + uGndCol*(.5 - .5*n.y)*.9);
  float fr = 1. - max(dot(n, V), 0.);
  col += uSkyCol*fr*fr*.05;
  gl_FragColor = vec4(col, 1.);
  #include <fog_fragment>
}`;

// the spray at the snap: a few drops thrown up and on along the taken fish's arc, and off the fish in the air before
// the jaws close. Additive drops vanish against lit mist, so these are drawn as a drop looks against the light: a dark
// rim round a lit core, alpha-blended, each stretched along its flight into a streak; only the few big ones are
// bright enough to bloom. iP = origin + delay (s after the snap), iV = velocity + size (radius, m)
const HALO_VERT = /* glsl */`
uniform float uT, uVH;
attribute vec4 iP, iV;
varying vec2 vQ; varying float vA, vBig;
void main(){
  float s = uT - iP.w, life = .55 + iV.w*9.;
  float a = step(0., s)*step(s, life);
  vec3 pos = iP.xyz + iV.xyz*s - vec3(0., 11.*s*s, 0.);
  vec3 vel = iV.xyz - vec3(0., 22.*s, 0.);
  vec4 mv = modelViewMatrix*vec4(pos, 1.);
  vec3 vv = (modelViewMatrix*vec4(vel, 0.)).xyz; float sp = length(vv.xy);
  vec2 dir = sp > 1e-3 ? vv.xy/sp : vec2(0., 1.);
  float px = 2.*max(-mv.z, .1)/(projectionMatrix[1][1]*uVH);
  float size = max(iV.w*(1. - .35*s/life), px*.62)*a;
  mv.xy += (dir*position.y*(1. + min(sp*.22, 4.2)) + vec2(dir.y, -dir.x)*position.x)*size;
  vQ = position.xy; vA = a*(1. - smoothstep(.6, 1., s/life)); vBig = smoothstep(.03, .046, iV.w);
  gl_Position = projectionMatrix*mv;
}`;
const HALO_FRAG = /* glsl */`
uniform vec3 uSunCol, uSkyCol;
varying vec2 vQ; varying float vA, vBig;
void main(){
  float d = dot(vQ, vQ); if (d > 1.) discard;
  float core = 1. - smoothstep(0., .6, d), body = 1. - smoothstep(.5, 1., d);
  vec3 col = mix(uSkyCol*.3, uSunCol*(.26 + .5*vBig) + uSkyCol*.45, core);
  gl_FragColor = vec4(col*body*vA, body*vA*(.35 + .55*core));
}`;

// drops thrown by the rare fight's splash and by the pattering ducks: iP = origin + delay, iV = velocity + size
const SPLASH_VERT = /* glsl */`
#include <fog_pars_vertex>
uniform float uT, uVH, uFloor;
attribute vec4 iP, iV;
varying vec2 vQ; varying float vA;
void main(){
  float s = uT - iP.w, life = 1.6 + min(iV.w, .7)*4.;
  float a = step(0., s)*step(s, life);
  vec3 pos = iP.xyz + iV.xyz*s - vec3(0., 11.*s*s, 0.);
  vec4 mvPosition = modelViewMatrix*vec4(pos, 1.);
  float px = 2.*max(-mvPosition.z, .1)/(projectionMatrix[1][1]*uVH);
  float size = max(iV.w*(1. + s*1.5), px*1.2)*a;
  mvPosition.xy += position.xy*size;
  vQ = position.xy; vA = a*(1. - s/life)*smoothstep(uFloor, uFloor + .7, pos.y)*mix(1., .5, smoothstep(.7, 1.2, iV.w));
  gl_Position = projectionMatrix*mvPosition;
  #include <fog_vertex>
}`;
const SPLASH_FRAG = /* glsl */`
uniform vec3 uSunCol, uSkyCol; uniform float uWhiteK;
varying vec2 vQ; varying float vA;
void main(){
  float d = dot(vQ, vQ); if (d > 1.) discard;
  float k = 1. - smoothstep(.1, 1., d);
  // (uWhiteK 1: white water thrown up, lit; 0: the ducks' drops, which thin to grey as they fade)
  gl_FragColor = vec4((uSunCol*.34 + uSkyCol*.5)*mix(k*vA*.9, .8 + .14*k, uWhiteK), k*vA*mix(.75, .9, uWhiteK));
}`;

// the white veil when the falling sheet takes us after the miss (a full-screen wash, eased by uVeil)
const VEIL_VERT = /* glsl */`
varying vec2 vUv;
void main(){ vUv = position.xy; gl_Position = vec4(position.xy, 0., 1.); }`;
const VEIL_FRAG = /* glsl */`
${GLSL_LIGHT}
uniform vec2 uVeil;      // (how far the sheet has come down over the lens 0..1, its strength 0..1)
uniform vec3 uWhite;
varying vec2 vUv;
// a strand of the veil, by the rule of the ledge's own falling sheet (parts, sheetMaterial, strand, with its k at 1). xc =
// the place across the frame in strand widths, tc = the fall clock, sd = a seed. Every strand (one to a width) has a
// clock of its own (23 times its own draw, plus tc at .8 to 1.2 of its pace) and is a file of surges, one to each whole
// number of its clock: a surge's water is its own draw times .75 where its clock's fraction is 0, rising to 1.25 as the
// fraction rises, and over the last .45 of the fraction it goes over to .75 of the next surge's draw. Across a width
// the water goes from one strand's to the next's. Returns .5 + that water - .451.
float veilStrand(float xc, float tc, float sd){
  float i = floor(xc), f = fract(xc), w = f*f*(3. - 2.*f);
  vec2 hh = vec2(h11(i*.731 + sd), h11((i + 1.)*.731 + sd)), ph = hh*23. + tc*(.8 + .4*fract(hh*7.3));
  vec2 j = floor(ph), g = fract(ph), e = smoothstep(.55, 1., g);
  float a = mix(h21(vec2(i, j.x) + sd)*(.75 + .5*g.x), h21(vec2(i, j.x + 1.) + sd)*.75, e.x);
  float b = mix(h21(vec2(i + 1., j.y) + sd)*(.75 + .5*g.y), h21(vec2(i + 1., j.y + 1.) + sd)*.75, e.y);
  return .5 + mix(a, b, w) - .451;
}
void main(){
  // three sizes of strand, 17, 43 and 5 to half the frame's width. Their fall clocks do not change on places that come
  // down the frame at 5.3/4, 7/9 and 3.1/1.6 of half its height a second, and at a place fall by 1 in .75 s, .56 s
  // and .75 s (the times the sheet's surges take to pass its lip, parts, sheetMaterial); they rise towards the frame's foot
  float f2 = veilStrand(vUv.x*17., -(vUv.y*4. + uTime*5.3)/(5.3*.75), 11.), f3 = veilStrand(vUv.x*43., -(vUv.y*9. + uTime*7.)/(7.*.56), 19.);
  float f1 = veilStrand(vUv.x*5., -(vUv.y*1.6 + uTime*3.1)/(3.1*.75), 3.);
  float fib = f1*.4 + f2*.36 + f3*.24;
  vec3 col = uWhite*(uSunCol*.2 + uSkyCol*.42 + .03)*mix(vec3(.55, .72, .78), vec3(1.), smoothstep(.3, .65, fib));
  // it comes down over the frame from the top, its lower edge a fringe of fibres (never a pane with an edge)
  float cover = smoothstep(-.3, .4, vUv.y - 1.35 + 2.7*uVeil.x + (fib - .5)*1.5);
  float a = uVeil.y*cover*(.6 + .4*smoothstep(.25, .7, fib));
  gl_FragColor = vec4(col, clamp(a, 0., .94));
}`;

// THE WATERLINE ON THE GLASS OF THE UPPER RIVER. The kit's waterline paints the whole part of the lens that lies on the
// other side of the surface in one flat colour: on the calm upper river that was a broad flat band over half the frame
// while the eye crossed. Here the waterline is a thin bright line where the surface cuts the lens (the same rays and the
// same near distance the kit's overlay is given), and the part of the lens beyond it shows the other side: for the eye
// in the air, the green of the water laid thinly over what the air's picture shows there, the bed through the surface;
// for the eye in the water, the river above it: the sky, and the forest's wall tall along both banks and low and far
// up and down the river. uSurfH = the surface's height at the eye's place, uNearD = the lens's near distance.
const GLASS_VERT = /* glsl */`
varying vec3 vRay;
void main(){
  gl_Position = vec4(position.xy, 0., 1.);
  vec4 v = inverse(projectionMatrix)*vec4(position.xy, -1., 1.);
  vRay = transpose(mat3(viewMatrix))*(v.xyz/v.w);
}`;
const GLASS_FRAG = /* glsl */`
${GLSL_LIGHT}
uniform float uSurfH, uNearD, uGoldAmt; uniform vec3 uVol, uSkyHor, uSkyAir, uSunAir, uHorizon, uGold, uSpruceRef, uGoldRef;
varying vec3 vRay;
// one rank of the forest's wall: a tree in most of N cells round the horizon, each its own height under top (the sine
// of the wall's height at this bearing); k = 1 a spruce's cone with its boughs, k = 0 a birch's round crown
float rank(float ax, float el, float N, float seed, float top, float k){
  float sp = ax*N, si = floor(sp), sf = abs(fract(sp) - .5)*2.;
  float hs = top*(.55 + .45*h11(si*1.7 + seed))*step(.2, h11(si*.61 + seed*2.3));
  float cone = hs*(1. - sf*(1.02 + .09*sin(el*150. + si*2.1)));
  float crown = hs*sqrt(max(1. - sf*sf*1.1, 0.))*(.92 + .08*sin(sf*17. + si));
  return 1. - smoothstep(-.012, .012, el - mix(crown, cone, k));
}
void main(){
  vec3 d = safeN(vRay); float h = uSurfH - cameraPosition.y;
  float t = h/(abs(d.y) > 1e-4 ? d.y : 1e-4);
  // (glass: the line barely moves)
  t *= 1. + .02*sin(d.x*23. + uTime*4.)*sin(d.z*31. - uTime*3.);
  float reach = uNearD*1.45;
  if (t <= 0. || t > reach*1.25) discard;
  float w = clamp(fwidth(t)*1.5, 1e-4, reach*.2);
  float beyond = 1. - smoothstep(reach - w, reach + w, t);
  float line = 1. - smoothstep(w*.5, w*2., abs(t - reach));
  vec3 col; float a;
  if (h < 0.) {
    // the eye in the air: below the line the lens is in the water
    col = uVol*1.15;
    a = beyond*mix(.7, .46, smoothstep(0., reach*.8, reach - t));
  } else {
    // the eye in the water: above the line the lens is in the air
    float el = clamp(d.y, 0., 1.);
    vec2 hz = d.xz/max(length(d.xz), 1e-4);
    float side = abs(hz.x), ax = atan(hz.x, hz.y + 1e-5)/6.2832 + .5;
    float top = .1 + .72*side*side;
    float tex = vn(vec2(ax*900., el*60.));
    float spruce = max(rank(ax, el, 44., 3., top, 1.), rank(ax + .013, el, 29., 8., top*.82, 1.));
    float birch = max(rank(ax + .007, el, 37., 5., top*.6, 0.), rank(ax + .021, el, 23., 11., top*.48, 0.));
    float wall = 1. - smoothstep(-.02, .02, el - top*.3*(.75 + .5*vn(vec2(ax*80., 2.))));
    vec3 sky = mix(uSkyHor*1.15, uSkyAir*1.35, smoothstep(0., .55, el));
    // (the spruce and the birch in the colours the world makes for its own trees in this look, uSpruceRef and uGoldRef,
    // with the grain the water's mirror gives the same two colours, .7 to 1.3)
    vec3 gold = uGoldRef*(.7 + .6*tex);
    vec3 forest = mix(uSpruceRef*(.7 + .6*tex), mix(uSpruceRef*(.7 + .6*tex), gold, uGoldAmt), birch*(1. - spruce*.6));
    // (the air between: the far wall up and down the river is paler than the near wall along the banks)
    forest = mix(forest, uSkyHor*.9, (1. - side)*.3);
    col = mix(sky, forest, max(max(spruce, birch), wall));
    a = beyond*.94;
  }
  col = mix(col, uSkyHor*1.1 + uSunAir*.22, line);
  gl_FragColor = vec4(col, max(a, line*.95));
}`;

// THE PLUNGING COLUMNS under the falls, for the eye that is swept along the foot of them after the miss: where a jet of
// the fall drives down into the pool it carries a column of white bubbles to the bed. Each is a strip that turns about
// its upright axis to face the eye (so it is a column from wherever it is seen, and nothing of it is drawn by the
// edges of a mesh): white fibres running down, a ragged outline that wanders as they do, a top that flares into the
// froth ceiling and a foot that breaks up into single bubbles above the stones. Dark water stands between them.
// (So it is drawn beyond 26 m from the eye. Nearer it goes over, wholly by 12 m, to clouds of bubbles with single
// bubbles in and about them: the end of COLM_FRAG. The riffles' curtains are drawn by the same program.)
// iP = (x, z, half width m, seed), iQ = (top y, bottom y, strength, 0); position = (-1..1 across, 0 top..1 foot)
const COLM_VERT = /* glsl */`
#include <fog_pars_vertex>
uniform float uTime; uniform vec3 uCam;
attribute vec4 iP, iQ;
varying vec2 vQ; varying vec3 vK;
varying vec3 vW;       // the place of this point of the strip in the world
void main(){
  float y = position.y, sd = iP.w;
  vec3 c = vec3(iP.x, mix(iQ.x, iQ.y, y), iP.y);
  c.x += sin(y*3.1 + uTime*.7 + sd*9.)*.22*y + sin(y*7. - uTime*1.3 + sd*4.)*.07;
  c.z += cos(y*2.3 + uTime*.5 + sd*5.)*.3*y;
  vec2 to = uCam.xz - c.xz; float tl = max(length(to), 1e-3); to /= tl;
  vec3 wp = c + vec3(-to.y, 0., to.x)*(position.x*iP.z*2.3);
  vQ = position.xy; vK = vec3(sd, iQ.z, iP.z);
  vW = wp;
  vec4 mvPosition = modelViewMatrix*vec4(wp, 1.);
  gl_Position = projectionMatrix*mvPosition;
  #include <fog_vertex>
}`;
const COLM_FRAG = /* glsl */`
#include <fog_pars_fragment>
${GLSL_LIGHT}
uniform vec3 uWhite; uniform float uShow;
varying vec2 vQ; varying vec3 vK;
varying vec3 vW;
// the bubbles of one size: p = the place in cells of that size, sd = a seed. A cell holds one bubble, of its own radius
// (.1 to .32 of the cell, more of them small than large) and at its own place in the cell, wholly inside it; the cells
// whose own draw is under fill hold one (by stages, over .1 either side of fill). e = half the breadth of a pixel in
// cells: the disc's edge is softened over a pixel. Returns (the disc, the disc's rim: nothing over the inner half of
// its radius, rising from there to the edge)
vec2 colmBub(vec2 p, float sd, float fill, float e){
  vec2 i = floor(p), q = fract(p) - .5;
  float rh = h21(i + sd), r = .1 + .22*rh*rh, on = smoothstep(-.1, .1, fill - h21(i + sd + 7.3));
  q -= (vec2(h21(i + sd + 3.1), h21(i + sd + 5.7)) - .5)*(1. - 2.*r);
  float d = length(q), disc = 1. - smoothstep(r - e, r + e, d);
  return vec2(disc, disc*smoothstep(r*.5, r, d))*on;
}
void main(){
  float x = vQ.x*2.3, y = vQ.y, sd = vK.x, t = uTime;
  // the outline: flared where it leaves the ceiling, slimmer with depth, its two edges wandering on their own
  float w = mix(1., .62, smoothstep(.05, .8, y)) + .5*(1. - smoothstep(0., .16, y));
  float e1 = (vn(vec2(sd*9. + y*3.3 - t*.5, 2.)) - .5)*.95, e2 = (vn(vec2(sd*5. + y*3.9 - t*.6, 7.)) - .5)*.95;
  float fine = (vn(vec2(sd*3. + x*3., y*13. - t*3.2)) - .5)*.26;
  float ax = (x > 0. ? x + e1 : -x + e2)/w + fine;
  float core = 1. - smoothstep(.5, 1., ax);
  // fibres that run down, parting to let the dark through
  float f1 = vn(vec2(x*6. + sd*13., y*2.4 - t*2.7)), f2 = vn(vec2(x*17. + sd*7., y*5.5 - t*4.6)), fib = f1*.56 + f2*.44;
  // the foot: it thins from two thirds of the way down and breaks into single bubbles
  float foot = 1. - smoothstep(.6, 1., y + (vn(vec2(sd*3. + x*1.5, t*.8)) - .5)*.34);
  float beads = smoothstep(.36, .74, vn(vec2(x*5. + sd, y*9. + t*2.6))*.62 + vn(vec2(x*11. + sd*3., y*21. + t*3.4))*.38);
  foot *= mix(1., beads, smoothstep(.56, .9, y));
  float a = core*(.62 + .38*smoothstep(.24, .62, fib))*foot;
  // and round it a loose sleeve of fine bubbles
  float sleeve = (1. - smoothstep(.75, 1.65, ax))*smoothstep(.5, .86, vn(vec2(x*6. + sd*3., y*13. + t*1.9))*.6 + vn(vec2(x*13., y*27. + t*2.7))*.4)*(1. - .7*y);
  a = max(a, sleeve*.5);
  vec3 col = uWhite*(uSunCol*.3 + uSkyCol*.5)*vec3(.8, 1., .92)*(.6 + .8*fib)*(1.1 - .4*y)*1.34;
  col = mix(col*vec3(.62, .86, .76), col, smoothstep(.0, .5, core));           // green where it thins at the edges
  float fogK = 1. - exp(-fogDensity*fogDensity*vFogDepth*vFogDepth);
  // (its sides thin away into the water before the strip ends: a veil, never a block with an edge)
  a *= 1. - smoothstep(.62, 1., abs(vQ.x));
  // NEAR THE EYE A COLUMN IS CLOUDS OF BUBBLES. By the true distance from the eye to this point of the strip, with no
  // step: beyond 26 m the strength and the colour are the lines above; from 26 m in they go over, wholly by 12 m, to
  // the lines below (12 and 26 m: the distances between which the ledge's froth skirt comes into sight, parts,
  // bubbleMaterial). px = the height of the world one pixel spans here (the sum of its change across and down the
  // frame), and no less than .00001
  float dist = length(uCam - vW), nearK = 1. - smoothstep(12., 26., dist), px = max(fwidth(vW.y), 1e-5);
  if (nearK > 0.) {
    // wd = iP.z, no less than .05. m = this point in metres (across from the strip's middle, the world's height); uq =
    // the same with the height in wd's (across, x is already so). Two fields of uq, both turned by 37 degrees: qs, which
    // sinks half a wd a second, and qr, which rises .32 of a wd a second; up = .28 of a wd upward, in the fields
    float wd = max(vK.z, .05);
    vec2 m = vec2(x*wd, vW.y), uq = vec2(x, vW.y/wd);
    mat2 R = mat2(.8, .6, -.6, .8);
    vec2 qs = R*(uq + vec2(0., t*.5)), qr = R*(uq - vec2(0., t*.32)), up = R*vec2(0., .28);
    // q = the place across as the outline above measures it, without its fine grain, except that the wander added to
    // it goes over from e2 (the outline's where x is under 0) to e1 (the outline's where x is over 0) between x -.35
    // and x .35, so that q has no jump at the strip's middle; rimK = 0 where q is under .3, 1 where over 1
    float q = (abs(x) + mix(e2, e1, smoothstep(-.35, .35, x)))/w, rimK = smoothstep(.3, 1., q);
    // (each field is shifted each way by a noise of its own: qs by up to .35, qr by up to .3)
    qs += (vec2(vn(qs*.6 + sd*3.), vn(qs*.6 + sd*3. + 19.)) - .5)*.7; qr += (vec2(vn(qr*.8 + sd*7.), vn(qr*.8 + sd*7. + 13.)) - .5)*.6;
    // the cloud: three sizes of noise (shares .5, .32, .18), read in the sinking field where rimK is 0 and in the rising
    // one where it is 1; cUp = its two larger sizes (shares .6, .4) read the step up higher; lit = 0 where the cloud is
    // .22 under cUp, 1 where it is .22 over it
    float cIn = vn(qs*1.15 + sd*17.)*.5 + vn(qs*3. + sd*5. + 7.)*.32 + vn(qs*7.3 + 11.)*.18, cOut = vn(qr*1.5 + sd*23.)*.5 + vn(qr*3.6 + 3.)*.32 + vn(qr*8.1 + 5.)*.18;
    float cloud = mix(cIn, cOut, rimK), cUp = mix(vn((qs + up)*1.15 + sd*17.)*.6 + vn((qs + up)*3. + sd*5. + 7.)*.4, vn((qr + up)*1.5 + sd*23.)*.6 + vn((qr + up)*3.6 + 3.)*.4, rimK);
    float lit = smoothstep(-.22, .22, cloud - cUp);
    // its body: whole where q less 1.5 times what the cloud lacks of .5 is under .45, none where that is over 1.4;
    // a quarter of that where the cloud is under .38, the whole of it where over .62 (lump); it thins out from .6 of
    // the strip's height down to its end, the cloud moving that by up to a quarter of the height either way, and what
    // is then left of it fades out over the last fifth of the strip's height, to nothing at the strip's end; and it
    // has no strength at the height where the lower river's surface is laid over the boil (ceilY: the rule of the
    // surface's own mesh, the river's level being 0) or above it, and its whole strength .14 to .7 of a wd under it
    // (by the cloud)
    float dens = 1. - smoothstep(.45, 1.4, q + (cloud - .5)*1.5);
    float ceilY = -.78*exp(-max(vW.z, 0.)/6.5)*smoothstep(-.6, 1.5, vW.z);
    float topK = smoothstep(0., 1., (ceilY - vW.y)/((.14 + .56*cloud)*wd));
    float footN = (1. - smoothstep(.6, 1., y + (cloud - .5)*.5))*(1. - smoothstep(.8, 1., y));
    float lump = smoothstep(.38, .62, cloud), body = dens*(.25 + .75*lump)*footN*topK;
    // bubbles of three sizes, in cells of .05, .1 and .19 m: the smallest sink .6 m a second, the others rise .3 and
    // .5 m a second. The two smaller fill .8 and .55 of their cells where q plus .8 of the cloud's excess over .5 is
    // under .5; where that is over 1.9 their fill is 0 (densW), and then only the cells whose own draw is under .1 hold
    // a bubble, at half its strength or less (colmBub's stages). The largest fill .3 of theirs where q plus .6 of that
    // excess is under .8, and their fill is 0, in the same way, where it is over 2.2. A size fades out as a pixel grows
    // from .22 to .5 of its cell. The two smaller
    // are drawn as discs (.6 and .75), the largest as a rim (.85) on a faint disc (.3); all take the body's rule at
    // the surface (topK) and fade out over the last fifth of the strip's height
    float densW = 1. - smoothstep(.5, 1.9, q + (cloud - .5)*.8);
    vec2 b1 = colmBub((m + vec2(0., t*.6))/.05, sd, .8*densW, .5*px/.05)*(1. - smoothstep(.22, .5, px/.05));
    vec2 b2 = colmBub((m - vec2(0., t*.3))/.1 + 31., sd, .55*densW, .5*px/.1)*(1. - smoothstep(.22, .5, px/.1));
    vec2 b3 = colmBub((m - vec2(0., t*.5))/.19 + 67., sd, .3*(1. - smoothstep(.8, 2.2, q + (cloud - .5)*.6)), .5*px/.19)*(1. - smoothstep(.22, .5, px/.19));
    float bubs = max(max(b1.x*.6, b2.x*.75), b3.y*.85 + b3.x*.3)*topK*(1. - smoothstep(.8, 1., y));
    // the strength: the body's (.92 of it) or a bubble's, whichever is more, thinning to the strip's sides as above
    float aN = max(body*.92, bubs)*(1. - smoothstep(.62, 1., abs(vQ.x)));
    // the colour: the white above without its fibres, at .4 to 1.2 of it by lit and lump; greener where the body is
    // under .6, wholly so where under .1 (the green of the column's edges above); a bubble takes it .8 of its own
    // strength of the way to 1.25 of the white
    vec3 wht = uWhite*(uSunCol*.3 + uSkyCol*.5)*vec3(.8, 1., .92)*(1.1 - .4*y)*1.34;
    vec3 colN = wht*(.4 + .55*lit + .25*lump);
    colN = mix(colN*vec3(.62, .86, .76), colN, smoothstep(.1, .6, body));
    colN = mix(colN, wht*1.25, bubs*.8);
    a = mix(a, aN, nearK); col = mix(col, colN, nearK);
  }
  gl_FragColor = vec4(mix(col, fogColor, fogK*.5), clamp(a*vK.y*uShow, 0., .96));
}`;
// bubbles and puffs. One instanced quad each, looping: iP = origin + phase, iV = velocity + radius m, iL = (life s,
// wobble m, growth, spread m). uKind 0 = air bubbles (a bright rim, a clear middle, a glint), 1 = soft puffs of silt.
const BUB_VERT = /* glsl */`
#include <fog_pars_vertex>
uniform float uTime, uVH, uTop, uKind; uniform vec2 uGo;
attribute vec4 iP, iV; attribute vec4 iL;
varying vec2 vQ; varying float vA;
void main(){
  float life = iL.x, s = fract(uTime/life + iP.w)*life, k = s/life;
  vec3 pos = iP.xyz + iV.xyz*s;
  pos.x += sin(s*3.1 + iP.w*40.)*iL.y; pos.z += cos(s*2.3 + iP.w*23.)*iL.y;
  pos.xz += iV.xz/max(length(iV.xz), 1e-3)*iL.w*sqrt(k);
  vec4 mvPosition = modelViewMatrix*vec4(pos, 1.);
  float px = 2.*max(-mvPosition.z, .1)/(projectionMatrix[1][1]*uVH);
  float size = max(iV.w*(1. + iL.z*2.5*k), px*1.3);
  mvPosition.xy += position.xy*size;
  vQ = position.xy;
  vA = smoothstep(0., .12, k)*(1. - smoothstep(.7, 1., k))*(1. - smoothstep(uTop - .25, uTop, pos.y))*smoothstep(.5, 2., -mvPosition.z)*uGo.x;
  gl_Position = projectionMatrix*mvPosition;
  #include <fog_vertex>
}`;
const BUB_FRAG = /* glsl */`
#include <fog_pars_fragment>
uniform vec3 uSunCol, uSkyCol, uTint; uniform float uKind;
varying vec2 vQ; varying float vA;
void main(){
  float d = length(vQ); if (d > 1.) discard;
  float rim = smoothstep(.55, .86, d)*(1. - smoothstep(.9, 1., d)), glint = 1. - smoothstep(0., .2, length(vQ - vec2(-.35, .4)));
  float a = mix(rim*.8 + glint*.9 + .26, (1. - d*d)*.52, uKind);
  vec3 col = uTint*(uSunCol*.3 + uSkyCol*.55)*mix(1.2, .6, uKind);
  float fogK = 1. - exp(-fogDensity*fogDensity*vFogDepth*vFogDepth);
  gl_FragColor = vec4(mix(col, fogColor, fogK*.6), a*vA);
}`;
// what the river carries past the lens under water: specks of silt and, one in seven, a yellow leaf turning over. A
// box of them 26 m square rides with the eye (each wraps round it), every one going downstream at its own speed.
// iP = (x, depth 0..1, z, phase), iV = (m/s downstream, size, 1 = leaf, spin)
const DRIFT_VERT = /* glsl */`
#include <fog_pars_vertex>
uniform float uTime, uVH, uSurf;
attribute vec4 iP, iV;
varying vec2 vQ; varying float vA, vLeaf, vPh;
void main(){
  vec2 p = vec2(iP.x + sin(uTime*.4 + iP.w*40.)*.35, iP.z + uTime*iV.x);
  vec2 c = mod(p - cameraPosition.xz + 13., 26.) - 13.;
  float edge = 1. - smoothstep(9., 13., max(abs(c.x), abs(c.y)));
  vec3 w = vec3(cameraPosition.x + c.x, uSurf - .3 - iP.y*5. + sin(uTime*.7 + iP.w*23.)*.15, cameraPosition.z + c.y);
  vec4 mvPosition = viewMatrix*vec4(w, 1.);
  float px = 2.*max(-mvPosition.z, .1)/(projectionMatrix[1][1]*uVH);
  float size = max(iV.y, px*1.1);
  float a = uTime*iV.w + iP.w*60., ca = cos(a), sa = sin(a);
  vec2 q = position.xy; q.x *= mix(1., .3 + .7*abs(sin(a*.7)), iV.z); q.y *= mix(1., .62, iV.z);
  mvPosition.xy += vec2(q.x*ca - q.y*sa, q.x*sa + q.y*ca)*size;
  vQ = position.xy; vLeaf = iV.z; vPh = iP.w;
  vA = edge*smoothstep(.7, 2.4, -mvPosition.z);
  gl_Position = projectionMatrix*mvPosition;
  #include <fog_vertex>
}`;
const DRIFT_FRAG = /* glsl */`
#include <fog_pars_fragment>
uniform vec3 uSunCol, uSkyCol;
varying vec2 vQ; varying float vA, vLeaf, vPh;
void main(){
  float d = length(vQ); if (d > 1.) discard;
  vec3 leaf = mix(vec3(.5, .37, .09), vec3(.36, .2, .06), fract(vPh*7.)), silt = vec3(.6, .64, .5);
  vec3 col = mix(silt, leaf*(.75 + .5*smoothstep(-.2, .2, vQ.y)), vLeaf)*(uSunCol*.45 + uSkyCol*.6);
  float a = mix((1. - d*d)*.42, 1. - smoothstep(.82, 1., d), vLeaf);
  float fogK = 1. - exp(-fogDensity*fogDensity*vFogDepth*vFogDepth);
  gl_FragColor = vec4(mix(col, fogColor, fogK*.7), a*vA);
}`;
// salmon eggs in the redd: small spheres among the gravel, lit by the scene's sun and sky as the stones are (no light
// of their own): a muted salmon tone, a little of the light coming through at the rim, one small white glint
const EGG_VERT = /* glsl */`
#include <fog_pars_vertex>
varying vec3 vN, vP;
void main(){
  vec4 wp = instanceMatrix*vec4(position, 1.);
  vN = normal; vP = wp.xyz;
  vec4 mvPosition = viewMatrix*wp;
  gl_Position = projectionMatrix*mvPosition;
  #include <fog_vertex>
}`;
const EGG_FRAG = /* glsl */`
#include <fog_pars_fragment>
${GLSL_LIGHT}${GLSL_WET}
uniform float uEgg;
varying vec3 vN, vP;
void main(){
  vec3 n = safeN(vN), V = safeN(uCam - vP);
  float under; vec3 lit = wetLight(vP, n, under);
  float fr = 1. - max(dot(n, V), 0.);
  vec3 col = vec3(.84, .43, .3)*lit*uEgg*(1. + .35*fr*fr);
  col += vec3(.3)*pow(max(dot(n, safeN(V + vec3(0., 1., 0.))), 0.), 60.);
  gl_FragColor = vec4(min(col, vec3(.8)), 1.);
  float fogK = 1. - exp(-fogDensity*fogDensity*vFogDepth*vFogDepth);
  gl_FragColor.rgb = mix(gl_FragColor.rgb, fogColor, fogK*.6);
}`;
// rainbow trout behind the nest: the sockeye's body and swimming (FISH_VERT) under a skin of its own, drawn from the
// body-space position: olive-grey speckled back, grey flank, pale belly, one pale pink stripe along the side
const TROUT_FRAG = /* glsl */`
#include <fog_pars_fragment>
${GLSL_LIGHT}${GLSL_SALMON_SKIN}
uniform vec3 uVolC; uniform float uAbove, uFogF, uGainF;
varying vec3 vP, vN, vC, vB; varying float vFin, vSeed;
void main(){
  vec3 s = vB/1.8;
  float dz = s.z - .12, wT = dz < 0. ? .3 : .23, dzb = s.z - .1;
  float top = .05 + .17*exp(-dz*dz/(wT*wT)), bot = -.05 - .105*exp(-dzb*dzb/.09);
  float rel = clamp((s.y - bot)/max(top - bot, 1e-3), 0., 1.);
  vec3 alb = mix(vec3(.46, .47, .42), vec3(.25, .29, .23), smoothstep(.1, .42, rel));
  float body = smoothstep(-.43, -.32, s.z)*(1. - smoothstep(.36, .47, s.z));
  alb = mix(alb, vec3(.6, .3, .33), (1. - smoothstep(.06, .2, abs(rel - .44)))*body*.9);
  // (the back is olive, not black: seen from above, over pale gravel, a trout is a green fish peppered with dark spots)
  alb = mix(alb, vec3(.1, .125, .058), smoothstep(.54, .76, rel));
  float spk = smoothstep(.56, .7, vn(vec2(s.z*70. + vSeed*31., s.y*85. + abs(s.x)*40.)))*smoothstep(.3, .6, rel);
  alb *= 1. - .72*spk;
  float de = length(vec2(s.z - .428, s.y - .022));
  alb = mix(alb, vec3(.01), (1. - smoothstep(.012, .017, de))*smoothstep(.006, .02, abs(s.x)));
  alb = mix(alb, vec3(.13, .15, .1), step(.05, vFin));
  float depth = max((vP.z < -.6 ? ${LIP.toFixed(1)} : 0.) - vP.y, 0.), under = step(.001, depth);
  vec3 V = safeN(uCam - vP), n = safeN(vN); if (dot(n, V) < 0.) n = -n;
  vec3 Ld = safeN(mix(uSun, vec3(uSun.x*.5, 1., uSun.z*.5), under*.7));
  float ca = vn(vP.xz*.9 + vec2(uTime*.5, -uTime*.35))*vn(vP.xz*1.7 - vec2(uTime*.4, uTime*.3));
  float form = salmonForm(n, Ld, mix(.3, .38, under))*(1. + under*(ca*2.2 - .3)*max(n.y, 0.)*.8);
  form *= mix(1., .34 + .66*smoothstep(-.8, .15, n.y), under*(1. - uAbove));
  vec3 E = (uSunCol*.3 + uSkyCol*.5 + uGndCol*.2)*mix(vec3(1.), vec3(.86, .84, .72), under*(1. - exp(-depth*.35)));
  vec3 col = salmonLit(alb, E, form);
  float fr = 1. - max(dot(n, V), 0.);
  col += uSunCol*pow(max(dot(n, safeN(Ld + V)), 0.), 160.)*.07*(1. - step(.05, vFin)) + uSkyCol*fr*fr*.03;
  col *= mix(vec3(1.), vec3(.74, .82, .74), (1. - uAbove)*(1. - exp(-length(uCam - vP)*.014)));
  col = mix(col, col*vec3(.7, .64, .6) + uVolC*.04, uAbove*(1. - exp(-depth*.7))*.85);
  gl_FragColor = vec4(max(col, 0.)*uGainF, 1.);
  gl_FragColor.rgb = mix(gl_FragColor.rgb, fogColor, 1. - exp(-fogDensity*fogDensity*vFogDepth*vFogDepth*uFogF));
}`;

// ---------------------------------------------------------------- geometry
const X3 = [1, 0, 0], Y3 = [0, 1, 0], Z3 = [0, 0, 1];
const fishColours = salmonColours;
// middle tier: ~100 triangles, two-tone body, olive head, tail and dorsal fin
function fishLowGeometry(pal, season) {
  const B = makeBuilder(), L = 1.8, C = fishColours(pal, season), bend = (z) => clamp((0.25 * L - z) / (0.75 * L), 0, 1);
  const rows = [[-0.45, 0.05, -0.05, 0.02], [-0.25, 0.1, -0.095, 0.058], [-0.03, 0.175, -0.142, 0.088], [0.14, 0.215, -0.155, 0.095], [0.31, 0.142, -0.13, 0.085], [0.44, 0.08, -0.085, 0.054], [0.515, -0.01, -0.045, 0.014]];
  const col = (p, sy) => {
    let c = mix3(mix3(C.red, C.belly, ss(-0.2, -0.9, sy)), C.back, ss(0.55, 1, sy) * 0.8);
    c = mix3(c, mix3(C.olive, C.jaw, ss(-0.1, -0.8, sy) * 0.7), ss(0.27 * L, 0.33 * L, p[2]));
    return mix3(c, C.olive, ss(-0.36 * L, -0.44 * L, p[2]) * 0.8);
  };
  B.loft(rows.map((r) => ({ c: [0, (r[1] + r[2]) * 0.5 * L, r[0] * L], rx: r[3] * L, ry: (r[1] - r[2]) * 0.5 * L, e: 2.2, k: [bend(r[0] * L), 0, 0, 0] })), X3, Y3, 6, 1, col);
  const tail = mix3(C.olive, C.fin, 0.5);
  const fin = (pts, c) => { const i0 = B.v(pts[0], c, [bend(pts[0][2]), 0.3, 0, 0]); for (let i = 1; i < pts.length; i++) B.v(pts[i], c, [bend(pts[i][2]), 1, 0, 0]); for (let i = 1; i < pts.length - 1; i++) B.tri(i0, i0 + i, i0 + i + 1); };
  fin([[0, 0, -0.42 * L], [0, 0.175 * L, -0.6 * L], [0, 0, -0.53 * L], [0, -0.175 * L, -0.6 * L]], tail);
  fin([[0, 0.2 * L, 0.03 * L], [0, 0.285 * L, -0.06 * L], [0, 0.165 * L, -0.12 * L]], C.fin);
  return B.build();
}
// river cobble: a squashed, lumpy ball; olive algae on top, pale flanks, dark foot
// a boulder for the foot of the falls, seen from 3 to 8 m: 128 faces, lumps on lumps, a flattish top, dark wet basalt with a
// paler dusting of silt in the hollows of its top
function boulderGeometry(nz) {
  const g = new THREE.OctahedronGeometry(1, 2), p = g.getAttribute('position'), n = g.getAttribute('normal'), c = new Float32Array(p.count * 3);
  for (let i = 0; i < p.count; i++) {
    let x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const k = 1 + 0.26 * nz.n3(x * 1.1 + 15, y * 1.1, z * 1.1 + 3) + 0.12 * nz.n3(x * 2.7, y * 2.7 + 19, z * 2.7) + 0.05 * nz.n3(x * 6.1 + 7, y * 6.1, z * 6.1);
    x *= k; y = Math.min(y * k, 0.72 + 0.1 * nz.n3(x * 2.2, 5, z * 2.2)) * 0.74; z *= k * 0.9;
    p.setXYZ(i, x, y + 0.22, z);
    const l = Math.hypot(x, y / 0.5, z) || 1; n.setXYZ(i, x / l, y / 0.5 / l, z / l);
    const top = ss(0.15, 0.5, y), v = 0.8 + 0.35 * nz.n3(x * 2.4 + 3, y * 2.4, z * 2.4 + 7);
    const col = mix3(mix3([0.07, 0.075, 0.07], [0.2, 0.2, 0.18], ss(-0.6, 0.3, y)), [0.26, 0.29, 0.2], top * 0.4 * ss(-0.1, 0.25, nz.n3(x * 3.3, 11, z * 3.3)));
    c[i * 3] = col[0] * v; c[i * 3 + 1] = col[1] * v; c[i * 3 + 2] = col[2] * v;
  }
  g.setAttribute('color', new THREE.BufferAttribute(c, 3));
  return g;
}
// (cut: 1 gives the cobble, the ball's eight faces each cut in four, 32 faces; 0 gives the same stone in its 8
// first faces, whose six corners are six of the cobble's own, shaped, toned and facing as they are there, every
// corner being shaped from its own place on the ball alone. No other value is passed)
function cobbleGeometry(nz, cut = 1) {
  const g = new THREE.OctahedronGeometry(1, cut), p = g.getAttribute('position'), n = g.getAttribute('normal'), c = new Float32Array(p.count * 3);
  for (let i = 0; i < p.count; i++) {
    let x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const k = 1 + 0.22 * nz.n3(x * 1.3 + 5, y * 1.3, z * 1.3) + 0.08 * nz.n3(x * 3.1, y * 3.1 + 9, z * 3.1);
    x *= k; y *= k * 0.58; z *= k * 0.86;
    p.setXYZ(i, x, y + 0.2, z);
    const l = Math.hypot(x, y / 0.34, z) || 1; n.setXYZ(i, x / l, y / 0.34 / l, z / l);
    const top = ss(0.1, 0.5, y), v = 0.85 + 0.25 * nz.n3(x * 2 + 3, y * 2, z * 2 + 7);
    const col = mix3(mix3([0.2, 0.19, 0.16], [0.5, 0.47, 0.4], ss(-0.5, 0.15, y)), [0.3, 0.31, 0.14], top * 0.55);
    c[i * 3] = col[0] * v; c[i * 3 + 1] = col[1] * v; c[i * 3 + 2] = col[2] * v;
  }
  g.setAttribute('color', new THREE.BufferAttribute(c, 3));
  return g;
}
// a dead spruce lying along +X: tapered trunk, optional root plate at x = 0 (a disc of soil and roots standing in
// the YZ plane), and a comb of dead branches. Returns the geometry and the points lichen may hang from.
function logGeometry(rng, nz, o) {
  const B = makeBuilder(), len = o.length, r0 = o.radius, anchors = [];
  const bark = (p, sy) => { const v = 0.7 + 0.5 * nz.n3(p[0] * 0.35, p[1] * 1.6, p[2] * 1.6) + 0.25 * nz.n2(p[0] * 2.2, sy * 3); return mul(mix3([0.1, 0.085, 0.07], [0.2, 0.19, 0.17], ss(-0.2, 0.9, sy) * 0.6 + 0.2), v); };
  const rings = [], axisY = (t) => -o.sag * Math.sin(Math.PI * t) + 0.25 * nz.n2(t * 4, 3.3), axisZ = (t) => 0.5 * nz.n2(t * 3, 9.1);
  for (let i = 0; i <= 14; i++) { const t = i / 14; rings.push({ c: [t * len, axisY(t), axisZ(t)], rx: r0 * (1 - 0.82 * t) * (1 + 0.5 * Math.exp(-t * 14)) * (1 + 0.08 * nz.n2(t * 9, 1)), ry: r0 * (1 - 0.82 * t) * (1 + 0.5 * Math.exp(-t * 14)) }); }
  if (!o.noTrunk) B.loft(rings, Y3, Z3, 9, 2, bark);
  if (o.roots) {
    const R = o.roots, soil = (p, sy) => mul(mix3([0.06, 0.045, 0.035], [0.16, 0.13, 0.1], 0.5 + 0.5 * nz.n3(p[0] * 1.5, p[1] * 1.5, p[2] * 1.5)), 0.7 + 0.3 * sy * sy);
    B.loft([{ c: [-0.75, 0, 0], rx: R * 0.3, ry: R * 0.3 }, { c: [-0.55, 0, 0], rx: R * 0.74, ry: R * 0.7, e: 2.6 }, { c: [-0.1, 0, 0], rx: R * 0.8, ry: R * 0.78, e: 2.4 }, { c: [0.4, 0, 0], rx: R * 0.42, ry: R * 0.42 }, { c: [1.3, 0, 0], rx: r0 * 1.3, ry: r0 * 1.3 }], Y3, Z3, 14, 2,
      (p, sy, cx) => soil(p, sy));
    const nR = 15;
    for (let i = 0; i < nR; i++) {
      const a = (i / nR) * 6.283 + rng.range(-0.15, 0.15), L = R * rng.range(0.85, 1.45), ca = Math.cos(a), sa = Math.sin(a), tw = rng.range(-0.5, 0.5), rr = rng.range(0.2, 0.34), pts = [];
      for (let k = 0; k <= 4; k++) { const t = k / 4, w = a + tw * t * t, d = R * 0.35 + L * t; pts.push({ c: [-0.35 - 0.5 * t * t + rng.range(-0.1, 0.1), Math.cos(w) * d, Math.sin(w) * d], rx: rr * (1 - 0.86 * t), ry: rr * (1 - 0.86 * t) }); }
      B.loft(pts, X3, [0, -sa, ca], 5, 2, (p, sy) => mul(bark(p, sy), 0.75), 2);
    }
  }
  const nB = o.branches || 0;
  for (let i = 0; i < nB; i++) {
    const t = lerp(o.span ? o.span[0] : 0.22, o.span ? o.span[1] : 0.96, (i + rng()) / nB), bx = t * len, by = axisY(t), bz = axisZ(t);
    const a = o.hang ? rng.range(-0.9, 0.9) + (rng() < 0.3 ? rng.sign() * 1.2 : 0) : rng.range(0, 6.283);
    const L = (o.lenAt ? o.lenAt(t) : (o.branchLen || 4) * (1 - 0.45 * t)) * rng.range(0.6, 1.2), rb = Math.max(0.07, r0 * 0.22 * (1 - 0.5 * t)), lean = rng.range(-0.35, 0.35);
    const dy = -Math.cos(a), dz = Math.sin(a), pts = [];
    for (let k = 0; k <= 3; k++) { const s = k / 3, droop = o.hang ? 0 : -0.25 * s * s * L; pts.push({ c: [bx + lean * L * s, by + dy * L * s + droop + (o.hang ? 0.18 * L * s * s * Math.abs(dz) * -1 : 0), bz + dz * L * s], rx: rb * (1 - 0.7 * s), ry: rb * (1 - 0.7 * s) }); }
    B.loft(pts, X3, [0, dz, -dy], 4, 1, (p, sy) => mul(bark(p, sy), 0.8), 2);
    for (let k = 1; k <= 3; k++) if (rng() < 0.8) anchors.push([pts[k].c[0], pts[k].c[1] - rb, pts[k].c[2]]);
    // twigs: a few side spikes so the comb reads ragged
    for (let j = 0; j < 2; j++) { const s = rng.range(0.35, 0.8), c0 = [bx + lean * L * s, by + dy * L * s, bz + dz * L * s], tl = L * rng.range(0.25, 0.45), sx = rng.sign();
      B.loft([{ c: c0, rx: rb * 0.5, ry: rb * 0.5 }, { c: [c0[0] + sx * tl * 0.8, c0[1] + dy * tl * 0.6 - 0.1 * tl, c0[2] + dz * tl * 0.6], rx: rb * 0.16, ry: rb * 0.16 }], [0, dz, -dy], X3, 3, 1, (p, sy) => mul(bark(p, sy), 0.7), 0);
      anchors.push([c0[0] + sx * tl * 0.5, c0[1] + dy * tl * 0.4, c0[2] + dz * tl * 0.4]); }
  }
  return { geometry: B.build(), anchors };
}
// THE DROWNED SPRUCE, windthrown. Local frame: the trunk lies along +X, and at x = 0 its root PLATE stands on edge in
// the YZ plane: a ragged disc of matted roots and bed (o.plate = its radius) with cobbles still gripped in both
// faces. The main roots run out through the plate and past its rim: each tapers from 0.5 m thick to a broken end,
// crooks, and forks twice; short sinker stubs stand out of the underside (-X), and a fringe of fine rootlets hangs
// from the roots and the rim. The trunk slopes down to the bed, snapped limb stubs along it. Nothing but the trunk
// is thicker than 0.5 m.
//   o.clear(x, y, z) = metres from the route to a local point; every point of every root is tested as it is laid:
//   a root that would come within 4 m of the route (its own thickness counted) bends away, and if no bend clears
//   it, ends there, broken. o.bed(x, z) = the bed under a local point (local y), o.top = the highest a root may reach.
// Own arrays: smooth round normals, and aAux = (turn round the limb 0..1, metres along it, its radius there,
// kind: 0 bark, 1 soil of the plate, 2 stone, 3 broken wood) for the wood shader's ridges.
async function windthrowGeometry(rng, nz, o, pause) {
  const P = [], N = [], C = [], A = [], I = [], tips = [], fringe = [];
  const R = o.plate, len = o.length, rT = o.trunk;
  const nrm = (v) => { const l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; };
  const crs = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const push = (p, n, c, a0, a1, a2, a3) => { P.push(p[0], p[1], p[2]); N.push(n[0], n[1], n[2]); C.push(c[0], c[1], c[2]); A.push(a0, a1, a2, a3); return P.length / 3 - 1; };
  // (near = the least clearance of anything laid, its own thickness counted)
  let near = 1e9;
  const free = (c, r) => { const d = o.clear(c[0], c[1], c[2]) - r; if (d < 4.15 || c[1] + r >= o.top) return false; if (d < near) near = d; return true; };
  const PALE = [0.42, 0.33, 0.2];
  // a round limb through pts [{ c, r }]; cap = its far end is a break, pale splintered wood showing
  const tube = (pts, sides, kind, col, cap) => {
    const n = pts.length, base = P.length / 3; let s = 0, u = null;
    for (let k = 0; k < n; k++) {
      const a = pts[Math.max(k - 1, 0)].c, b = pts[Math.min(k + 1, n - 1)].c, t = nrm([b[0] - a[0], b[1] - a[1], b[2] - a[2]]);
      if (!u) u = nrm(crs(t, Math.abs(t[1]) < 0.8 ? [0, 1, 0] : [1, 0, 0]));
      else { const d = u[0] * t[0] + u[1] * t[1] + u[2] * t[2]; u = nrm([u[0] - t[0] * d, u[1] - t[1] * d, u[2] - t[2] * d]); }
      const w = crs(t, u), c = pts[k].c, r = pts[k].r;
      if (k) s += Math.hypot(c[0] - pts[k - 1].c[0], c[1] - pts[k - 1].c[1], c[2] - pts[k - 1].c[2]);
      const cc = col(c, s, k / (n - 1));
      for (let j = 0; j <= sides; j++) {
        const an = (j / sides) * 6.2832, ca = Math.cos(an), sa = Math.sin(an), nn = [u[0] * ca + w[0] * sa, u[1] * ca + w[1] * sa, u[2] * ca + w[2] * sa];
        push([c[0] + nn[0] * r, c[1] + nn[1] * r, c[2] + nn[2] * r], nn, cc, j / sides, s, r, kind);
      }
      if (k) { const q0 = base + (k - 1) * (sides + 1), q1 = q0 + sides + 1; for (let j = 0; j < sides; j++) I.push(q0 + j, q1 + j, q0 + j + 1, q0 + j + 1, q1 + j, q1 + j + 1); }
      if (k === n - 1 && cap) {
        const q0 = P.length / 3, jag = 0.5 * r;
        for (let j = 0; j <= sides; j++) { const an = (j / sides) * 6.2832, ca = Math.cos(an), sa = Math.sin(an), h = jag * ((j * 7) % 3) * 0.5; push([c[0] + (u[0] * ca + w[0] * sa) * r * 0.9 + t[0] * h, c[1] + (u[1] * ca + w[1] * sa) * r * 0.9 + t[1] * h, c[2] + (u[2] * ca + w[2] * sa) * r * 0.9 + t[2] * h], t, PALE, j / sides, s, r, 3); }
        const mid = push([c[0] + t[0] * jag, c[1] + t[1] * jag, c[2] + t[2] * jag], t, mul(PALE, 0.7), 0.5, s, r, 3);
        for (let j = 0; j < sides; j++) I.push(q0 + j, q0 + j + 1, mid);
      }
    }
  };
  const barkCol = (k) => (c, s) => mul(mix3([0.15, 0.1, 0.058], [0.27, 0.2, 0.115], 0.5 + 0.5 * nz.n3(c[0] * 0.5 + 3, c[1] * 0.5, c[2] * 0.5)), k * (0.8 + 0.35 * nz.n3(c[0] * 1.7, c[1] * 1.7 + 9, c[2] * 1.7)));

  // ---- the plate: a polar grid, two faces that meet in one ragged rim. Its radius at each bearing is its own
  // (noise), and is drawn in until the rim there is clear of the route
  const NA = 44, NR = 6, rim = new Float32Array(NA);
  // (a spoke of the plate is clear when its rim is and both its faces are, out to where their lumps stand)
  const spokeFree = (a, rr) => { const cy = Math.cos(a) * rr, cz = Math.sin(a) * rr; if (!free([0, cy, cz], 0.55)) return false; for (let j = 0; j < NR; j++) { const f = j / NR; if (!free([1.25, cy * f, cz * f], 0) || !free([-1.25, cy * f, cz * f], 0)) return false; } return true; };
  for (let i = 0; i < NA; i++) {
    const a = (i / NA) * 6.2832; let rr = R * (0.88 + 0.2 * nz.n2(Math.cos(a) * 1.6 + 5, Math.sin(a) * 1.6 + 11) + 0.07 * nz.n2(Math.cos(a) * 5.1, Math.sin(a) * 5.1 + 3));
    while (rr > 1.5 && !spokeFree(a, rr)) rr -= 0.25;
    rim[i] = rr;
  }
  const thick = (a, f) => (0.5 * Math.pow(Math.max(1 - f * f, 0), 0.55) + 0.1) * (1 + 0.45 * nz.n2(Math.cos(a) * 2.3 * f + 7, Math.sin(a) * 2.3 * f + 2));
  // (the plate's earth: the bed's own sand and silt, bound in the roots)
  const soilCol = (p) => mul(mix3([0.21, 0.18, 0.13], [0.42, 0.37, 0.27], 0.5 + 0.5 * nz.n3(p[0] * 0.9 + 4, p[1] * 0.9, p[2] * 0.9)), 0.8 + 0.4 * nz.n3(p[0] * 2.6, p[1] * 2.6, p[2] * 2.6 + 5));
  const plate0 = P.length / 3;
  {
    const face = (sgn) => {
      const c0 = push([sgn * thick(0, 0), 0, 0], [sgn, 0, 0], soilCol([sgn, 0, 0]), 0, 0, 0, 1), rings = [];
      for (let j = 1; j < NR; j++) {
        const f = j / NR, row = [];
        for (let i = 0; i < NA; i++) {
          const a = (i / NA) * 6.2832, r = rim[i] * f, y = Math.cos(a) * r, z = Math.sin(a) * r, lump = 0.22 * nz.n3(y * 0.8 + sgn * 9, z * 0.8, 4) + 0.1 * nz.n3(y * 2.1, z * 2.1, sgn * 6);
          const p = [sgn * (thick(a, f) + lump * (0.4 + 0.6 * f)), y, z];
          row.push(push(p, [sgn, 0, 0], soilCol(p), i / NA, r, 0, 1));
        }
        rings.push(row);
      }
      for (let i = 0; i < NA; i++) I.push(c0, rings[0][i], rings[0][(i + 1) % NA]);
      for (let j = 0; j + 1 < rings.length; j++) for (let i = 0; i < NA; i++) { const i1 = (i + 1) % NA; I.push(rings[j][i], rings[j + 1][i], rings[j][i1], rings[j][i1], rings[j + 1][i], rings[j + 1][i1]); }
      return rings[rings.length - 1];
    };
    const fr = face(1), bk = face(-1), edge = [];
    for (let i = 0; i < NA; i++) {
      const a = (i / NA) * 6.2832, r = rim[i], p = [0.12 * nz.n2(i * 0.9, 3), Math.cos(a) * r, Math.sin(a) * r];
      edge.push(push(p, [0, Math.cos(a), Math.sin(a)], mul(soilCol(p), 0.85), i / NA, r, 0, 1));
      if (i % 2 === 0) fringe.push({ c: p, d: [-0.2, Math.cos(a), Math.sin(a)], r: 0.05 });
    }
    for (let i = 0; i < NA; i++) { const i1 = (i + 1) % NA; I.push(fr[i], edge[i], fr[i1], fr[i1], edge[i], edge[i1], bk[i], edge[i], bk[i1], bk[i1], edge[i], edge[i1]); }
  }
  const plate1 = P.length / 3, plateI1 = I.length;
  // (the plate's normals: summed from its faces)
  {
    for (let i = plate0 * 3; i < plate1 * 3; i++) N[i] = 0;
    for (let t = 0; t < plateI1; t += 3) {
      const a = I[t] * 3, b = I[t + 1] * 3, c = I[t + 2] * 3;
      const n = crs([P[b] - P[a], P[b + 1] - P[a + 1], P[b + 2] - P[a + 2]], [P[c] - P[a], P[c + 1] - P[a + 1], P[c + 2] - P[a + 2]]);
      const cx = (P[a] + P[b] + P[c]) / 3, sg = (n[0] * cx >= 0 ? 1 : -1);          // outward: away from the plate's middle plane
      for (const v of [a, b, c]) { N[v] += n[0] * sg; N[v + 1] += n[1] * sg; N[v + 2] += n[2] * sg; }
    }
    for (let v = plate0; v < plate1; v++) { const n = nrm([N[v * 3], N[v * 3 + 1], N[v * 3 + 2]]); N[v * 3] = n[0]; N[v * 3 + 1] = n[1]; N[v * 3 + 2] = n[2]; }
  }
  if (pause) await pause();
  const rimAt = (a) => { const f = ((a / 6.2832) % 1 + 1) % 1 * NA, i = Math.floor(f) % NA; return lerp(rim[i], rim[(i + 1) % NA], f - Math.floor(f)); };
  // ---- one root: from c0, heading `ang` in the plate's plane (0 = +Y), drifting dx along X per metre, L long, r0
  // thick where it starts. It wanders, crooks once, tapers to a broken end; each new point is tested (clear of the
  // route, under the surface, not far under the bed): if the straight way is shut it bends, and if every bend is
  // shut it ends there
  const root = (c0, ang, dx, L, r0, segs, sides, tint) => {
    const pts = [{ c: c0, r: r0 }], step = L / segs, crook = 2 + Math.floor(rng() * (segs - 2)), turn = rng.sign() * rng.range(0.25, 0.6), wob = rng.range(0.1, 0.22), ph = rng() * 6.283;
    let c = c0, a = ang;
    for (let k = 1; k <= segs; k++) {
      const t = k / segs, r = Math.max(r0 * Math.pow(1 - t * 0.93, 0.6), 0.028);
      a += wob * Math.sin(ph + k * 1.7) + (k === crook ? turn : 0);
      let nx = null;
      for (const bend of [0, 0.5, -0.5, 1.0, -1.0, 1.5, -1.5]) {
        const q = [c[0] + (dx - Math.abs(bend) * 0.3) * step, c[1] + Math.cos(a + bend) * step, c[2] + Math.sin(a + bend) * step];
        if (free(q, r) && q[1] - r > o.bed(q[0], q[2]) - 0.5) { nx = q; a += bend; break; }
      }
      if (!nx) break;
      c = nx; pts.push({ c, r });
    }
    if (pts.length > 1) tube(pts, sides, 0, barkCol(tint), true);
    return pts;
  };
  const dirOf = (pts, k) => { const a = pts[Math.max(k - 1, 0)].c, b = pts[Math.min(k + 1, pts.length - 1)].c; return Math.atan2(b[2] - a[2], b[1] - a[1]); };
  const hairy = (pts, from) => { for (let k = from; k < pts.length; k++) { const a = dirOf(pts, k); fringe.push({ c: pts[k].c, d: [-0.15, Math.cos(a), Math.sin(a)], r: pts[k].r }); } };
  const nR = o.count;
  for (let i = 0; i < nR; i++) {
    if (pause && (i & 1) === 1) await pause();
    const a = (i / nR) * 6.2832 + rng.range(-0.22, 0.22), rm = rimAt(a), L = rm * 0.7 + rng.range(1.5, 4.2);
    const pts = root([0.3 + rng.range(-0.1, 0.15), Math.cos(a) * rm * 0.3, Math.sin(a) * rm * 0.3], a, rng.range(-0.12, 0.03), L, 0.25 * rng.range(0.82, 1), 10, 7, 1);
    const n = pts.length; if (n < 4) continue;
    tips.push(pts[n - 1].c, pts[Math.max(1, n - 3)].c); hairy(pts, Math.min(n - 1, 6));
    // it forks twice, and the first fork once more
    const s1 = rng.sign(), k1 = Math.min(n - 2, rng.int(4, 5)), a1 = dirOf(pts, k1) + s1 * rng.range(0.45, 0.85);
    const f1 = root(pts[k1].c, a1, rng.range(-0.15, 0.1), L * rng.range(0.32, 0.5), pts[k1].r * 0.78, 6, 5, 0.92);
    if (f1.length > 2) { tips.push(f1[f1.length - 1].c); hairy(f1, 2); }
    const k2 = Math.min(n - 2, rng.int(6, 8)), a2 = dirOf(pts, k2) - s1 * rng.range(0.4, 0.9);
    const f2 = root(pts[k2].c, a2, rng.range(-0.15, 0.1), L * rng.range(0.18, 0.3), pts[k2].r * 0.8, 4, 4, 0.9);
    if (f2.length > 2) hairy(f2, 2);
    if (f1.length > 4) { const k3 = rng.int(2, 3), f3 = root(f1[k3].c, a1 - s1 * rng.range(0.5, 1.0), rng.range(-0.1, 0.1), L * rng.range(0.12, 0.22), f1[k3].r * 0.8, 3, 4, 0.88); if (f3.length > 2) hairy(f3, 2); }
  }
  if (pause) await pause();
  // ---- sinker stubs: the roots that went straight down, snapped off short, standing out of the underside
  for (let i = 0; i < (o.sinkers || 0); i++) {
    const a = rng() * 6.2832, f = Math.sqrt(rng()) * 0.7, rm = rimAt(a) * f, c0 = [-0.3, Math.cos(a) * rm, Math.sin(a) * rm], Ls = rng.range(0.7, 1.9), r0 = rng.range(0.12, 0.2), dy = rng.range(-0.35, 0.15), dz = rng.range(-0.25, 0.25), pts = [{ c: c0, r: r0 }];
    for (let k = 1; k <= 3; k++) { const t = k / 3, q = [c0[0] - Ls * t, c0[1] + dy * Ls * t * t, c0[2] + dz * Ls * t]; if (!free(q, r0)) break; pts.push({ c: q, r: r0 * (1 - 0.45 * t) }); }
    if (pts.length > 1) { tube(pts, 5, 0, barkCol(0.9), true); const e = pts[pts.length - 1]; fringe.push({ c: e.c, d: [-1, 0, 0], r: e.r }); if (i % 2 === 0) tips.push(e.c); }
  }
  // ---- the fringe of fine rootlets: from the roots beyond the rim, their forks, the sinkers and the rim itself;
  // each stands out, droops a little and trails down the current (o.stream = the current, local)
  const st = o.stream;
  for (let i = 0, made = 0, nF = fringe.length; nF && made < (o.rootlets || 0) && i < (o.rootlets || 0) * 3; i++) {
    if (pause && (i & 63) === 63) await pause();
    const f = fringe[Math.floor(rng() * nF)], Lr = rng.range(0.35, 1.05), d = nrm([f.d[0] + rng.range(-0.8, 0.8), f.d[1] + rng.range(-0.8, 0.8), f.d[2] + rng.range(-0.8, 0.8)]);
    const b = [f.c[0] + d[0] * f.r * 0.6, f.c[1] + d[1] * f.r * 0.6, f.c[2] + d[2] * f.r * 0.6], pts = [{ c: b, r: 0.036 }]; let good = true;
    for (let k = 1; k <= 3; k++) {
      const t = k / 3, q = [b[0] + (d[0] + st[0] * 0.55 * t) * Lr * t, b[1] + (d[1] - 0.3 * t) * Lr * t, b[2] + (d[2] + st[2] * 0.55 * t) * Lr * t];
      if (!free(q, 0.05)) { good = false; break; }
      pts.push({ c: q, r: 0.036 * (1 - 0.75 * t) });
    }
    if (!good) continue;
    tube(pts, 3, 0, barkCol(0.8), false); made++;
  }
  if (pause) await pause();
  // ---- cobbles and gravel still gripped in both faces of the plate and along its rim
  if (o.cobble) {
    const cp = o.cobble.getAttribute('position'), cn = o.cobble.getAttribute('normal'), cc = o.cobble.getAttribute('color'), ci = o.cobble.index, m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), v = new THREE.Vector3(), s3 = new THREE.Vector3();
    for (let i = 0; i < (o.stones || 0); i++) {
      const a = rng() * 6.2832, f = Math.pow(rng(), 0.45) * 0.97, r = rimAt(a) * f, sg = rng() < 0.6 ? 1 : -1, s = rng.range(0.2, 0.42) * (rng() < 0.22 ? 1.7 : 1), ctr = [sg * thick(a, f) * 0.8, Math.cos(a) * r, Math.sin(a) * r], k = rng.range(0.75, 1.15);
      e.set(rng.range(-0.5, 0.5), rng() * 6.283, -sg * 1.5708 + rng.range(-0.4, 0.4)); q.setFromEuler(e);
      if (!free(ctr, s)) continue;
      m.compose(v.set(ctr[0], ctr[1], ctr[2]), q, s3.set(s, s, s));
      const base = P.length / 3;
      for (let j = 0; j < cp.count; j++) {
        v.fromBufferAttribute(cp, j).applyMatrix4(m); const px = v.x, py = v.y, pz = v.z;
        v.fromBufferAttribute(cn, j).applyQuaternion(q);
        push([px, py, pz], [v.x, v.y, v.z], [cc.getX(j) * k, cc.getY(j) * k, cc.getZ(j) * k], 0, 0, s, 2);
      }
      if (ci) for (let j = 0; j < ci.count; j++) I.push(base + ci.getX(j)); else for (let j = 0; j < cp.count; j++) I.push(base + j);
    }
  }
  if (pause) await pause();
  // ---- the trunk: from the plate's middle down to the bed and along it, swelling at the butt; snapped limb stubs
  {
    const yEnd = o.bed(len * 0.6, 0) + rT * 0.5, axis = [], rad = (t) => rT * (1 - 0.8 * t) * (1 + 0.3 * Math.exp(-t * 14));
    const trunkCol = (c, s) => mul(mix3([0.17, 0.13, 0.085], [0.3, 0.26, 0.19], 0.5 + 0.5 * nz.n3(c[0] * 0.3 + 3, c[1] * 0.8, c[2] * 0.8)), 0.8 + 0.35 * nz.n3(c[0] * 1.1, c[1] * 1.7 + 9, c[2] * 1.7));
    for (let i = 0; i <= 14; i++) {
      const t = i / 14, x = 0.2 + t * len, z = 0.45 * nz.n2(t * 3, 9.1) * ss(0, 0.2, t), r = rad(t);
      const c = [x, Math.max(o.bed(x, z) + 0.8 * r, lerp(0, yEnd, ss(0, 0.6, t)) + 0.2 * nz.n2(t * 4, 3.3) * ss(0, 0.2, t)), z];
      // (the trunk keeps clear of the route as the roots do: where it would not, it is snapped there)
      if (!free(c, r)) break;
      axis.push({ c, r });
    }
    const nA = axis.length - 1;
    if (nA >= 1) tube(axis, 12, 0, trunkCol, true);
    for (let i = 0; i < (o.stubs || 0) && nA >= 1; i++) {
      const t = rng.range(0.1, 0.86), f = t * nA, k = Math.min(nA - 1, Math.floor(f)), a0 = axis[k], a1 = axis[k + 1], w = f - k, r = lerp(a0.r, a1.r, w), an = rng.range(-1.9, 1.9), Ls = rng.range(0.7, 2.6), rs = 0.1 + 0.07 * (1 - t), lean = rng.range(-0.35, 0.35);
      const c0 = [lerp(a0.c[0], a1.c[0], w), lerp(a0.c[1], a1.c[1], w) + Math.cos(an) * r * 0.8, lerp(a0.c[2], a1.c[2], w) + Math.sin(an) * r * 0.8], pts = [{ c: c0, r: rs }];
      for (let j = 1; j <= 2; j++) { const s = j / 2, q = [c0[0] + lean * Ls * s, c0[1] + Math.cos(an) * Ls * s, c0[2] + Math.sin(an) * Ls * s]; if (!free(q, rs)) break; pts.push({ c: q, r: rs * (1 - 0.3 * s) }); }
      if (pts.length > 1) tube(pts, 5, 0, trunkCol, true);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3)); g.setAttribute('aAux', new THREE.Float32BufferAttribute(A, 4)); g.setIndex(I);
  g.computeBoundingSphere();
  return { geometry: g, tips, near };
}
// a dead sockeye, limp: B = builder, at = its middle, ax = unit vector tail -> head, tall = unit vector belly -> back,
// thin = the third axis, len = length m, droop = how far the two ends hang (along -tall). Used in the wolf's jaws
// (crosswise) and for the carcasses the gulls fight over.
function limpFish(B, at, ax, tall, thin, len, droop, torn, bright, k = [0, 0, 0, 0]) {
  // bright = a July fish, fresh from the sea: silver, blue-backed
  const red = bright ? [0.2, 0.21, 0.23] : [0.13, 0.012, 0.015], dark = bright ? [0.03, 0.05, 0.06] : [0.035, 0.02, 0.016], olive = bright ? [0.05, 0.08, 0.09] : [0.035, 0.045, 0.02], flesh = [0.3, 0.16, 0.12];
  const rows = [[-0.5, 0.02, 0.012], [-0.44, 0.05, 0.02], [-0.3, 0.085, 0.04], [-0.1, 0.15, 0.065], [0.08, 0.185, 0.075], [0.24, 0.17, 0.07], [0.36, 0.125, 0.06], [0.45, 0.07, 0.04], [0.5, 0.02, 0.015]];
  const pt = (s, h) => { const d = -droop * (s * 2) * (s * 2); return [at[0] + ax[0] * s * len + tall[0] * (d + h), at[1] + ax[1] * s * len + tall[1] * (d + h), at[2] + ax[2] * s * len + tall[2] * (d + h)]; };
  B.loft(rows.map((r) => ({ c: pt(r[0], 0), rx: r[2] * len, ry: r[1] * len, e: 2.2, k })), thin, tall, 7, 1, (p, sy, cx, t) => {
    const s = t - 0.5;
    let c = mix3(mix3(red, dark, ss(0.35, 0.95, sy) * 0.75), mul(red, 0.7), ss(-0.3, -0.9, sy));
    c = mix3(c, olive, Math.max(ss(0.26, 0.34, s), ss(-0.36, -0.44, s) * 0.8));
    if (torn && s > -0.12 && s < 0.16 && sy < 0.2 && cx > 0) c = mix3(c, flesh, 0.85);       // the gulls have opened its flank
    return c;
  });
  // tail fin: a dark fork in the plane of the body
  const t0 = pt(-0.46, 0), i0 = B.v(t0, dark, k); B.v(pt(-0.62, 0.15 * len), dark, k); B.v(pt(-0.55, 0), mul(dark, 0.8), k); B.v(pt(-0.62, -0.15 * len), dark, k);
  B.tri(i0, i0 + 1, i0 + 2); B.tri(i0, i0 + 2, i0 + 3);
}
// grey wolf: nose +Z, feet at y 0, 2.5 m at the shoulder (three times life). A dark grey saddle from the ruff to the
// tail, grey flanks, buff legs, belly and muzzle, a dark-tipped tail hanging; with fish = true a limp sockeye hangs
// crosswise in its jaws. A PALE grey wolf: the flanks a light ash grey, the saddle only a darker grizzle along the top
// of the back, legs, belly, cheeks and muzzle cream (the prop shader's full sun is three times the albedo).
function wolfGeometry(fish, bright) {
  const B = makeBuilder(), pale = [0.215, 0.2, 0.17], grey = [0.125, 0.122, 0.118], saddleC = [0.05, 0.048, 0.05], dark = [0.012, 0.012, 0.013];
  const coat = (p, sy) => {
    const along = ss(-2.0, -1.3, p[2]) * ss(2.5, 1.9, p[2]);
    let c = mix3(grey, saddleC, ss(0.3, 0.9, sy) * along * 0.9);
    c = mix3(c, pale, Math.max(ss(-0.3, -0.85, sy) * 0.9, ss(2.3, 2.7, p[2]) * ss(0.45, -0.25, sy)));       // belly, throat, cheeks and the sides of the muzzle
    return mix3(c, dark, ss(3.1, 3.16, p[2]));
  };
  // a deep chest, a tucked loin, a thick ruffed neck and the head carried level with the back
  const HW = (w) => [0, 0, w, 0], HEAD = [0, 0, 1, 0];
  B.loft([{ c: [0, 2.2, -1.85], rx: 0.24, ry: 0.3 }, { c: [0, 2.25, -1.5], rx: 0.5, ry: 0.6 }, { c: [0, 2.2, -0.8], rx: 0.5, ry: 0.58 }, { c: [0, 2.12, -0.1], rx: 0.55, ry: 0.7 }, { c: [0, 2.05, 0.6], rx: 0.6, ry: 0.86 },
    { c: [0, 2.2, 1.15], rx: 0.56, ry: 0.8, k: HW(0.1) }, { c: [0, 2.36, 1.6], rx: 0.47, ry: 0.62, k: HW(0.45) }, { c: [0, 2.46, 1.95], rx: 0.4, ry: 0.48, k: HW(0.85) }, { c: [0, 2.5, 2.3], rx: 0.37, ry: 0.36, k: HEAD }, { c: [0, 2.44, 2.58], rx: 0.27, ry: 0.25, k: HEAD },
    { c: [0, 2.35, 2.85], rx: 0.16, ry: 0.15, k: HEAD }, { c: [0, 2.3, 3.08], rx: 0.125, ry: 0.115, k: HEAD }, { c: [0, 2.3, 3.18], rx: 0.07, ry: 0.06, k: HEAD }], X3, Y3, 10, 2, coat);
  const legC = (p) => mix3(mix3(pale, grey, ss(1.3, 2.1, p[1]) * 0.85), mul(pale, 0.8), ss(0.5, 0.05, p[1]));
  for (const sx of [-1, 1]) {
    // legs: diagonal pairs share a phase (WOLF_VERT), the weight runs from 0 at the shoulder to 1 from the elbow down
    const pf = sx < 0 ? 0.25 : 0.75, ph = sx < 0 ? 0.75 : 0.25, LK = (q, w) => [q, w, 0, 0];
    B.loft([{ c: [sx * 0.3, 2.0, 0.8], rx: 0.26, ry: 0.38, k: LK(pf, 0) }, { c: [sx * 0.32, 1.3, 0.78], rx: 0.17, ry: 0.22, k: LK(pf, 0.5) }, { c: [sx * 0.32, 0.7, 0.86], rx: 0.12, ry: 0.14, k: LK(pf, 1) }, { c: [sx * 0.32, 0.16, 0.84], rx: 0.12, ry: 0.15, k: LK(pf, 1) }, { c: [sx * 0.32, 0, 0.97], rx: 0.14, ry: 0.23, k: LK(pf, 1) }], X3, Z3, 7, 2, legC, 2);
    B.loft([{ c: [sx * 0.3, 2.2, -1.45], rx: 0.3, ry: 0.5, k: LK(ph, 0) }, { c: [sx * 0.33, 1.5, -1.3], rx: 0.21, ry: 0.31, k: LK(ph, 0.5) }, { c: [sx * 0.33, 0.82, -1.62], rx: 0.12, ry: 0.16, k: LK(ph, 1) }, { c: [sx * 0.33, 0.18, -1.5], rx: 0.12, ry: 0.16, k: LK(ph, 1) }, { c: [sx * 0.33, 0, -1.4], rx: 0.14, ry: 0.23, k: LK(ph, 1) }], X3, Z3, 7, 2, legC, 2);
    B.loft([{ c: [sx * 0.2, 2.78, 2.2], rx: 0.13, ry: 0.07, k: HEAD }, { c: [sx * 0.25, 3.0, 2.16], rx: 0.1, ry: 0.055, k: HEAD }, { c: [sx * 0.28, 3.18, 2.13], rx: 0.03, ry: 0.025, k: HEAD }], X3, Z3, 5, 1, (p, sy) => (sy > 0.2 ? mul(pale, 0.7) : saddleC), 2);
    B.loft([{ c: [sx * 0.2, 2.61, 2.5], rx: 0.02, ry: 0.02, k: HEAD }, { c: [sx * 0.235, 2.6, 2.55], rx: 0.045, ry: 0.04, k: HEAD }, { c: [sx * 0.22, 2.58, 2.6], rx: 0.02, ry: 0.02, k: HEAD }], X3, Y3, 5, 1, () => [0.12, 0.085, 0.02]);
  }
  const TK = (w) => [0, 0, 0, w];
  B.loft([{ c: [0, 2.2, -1.8], rx: 0.14, ry: 0.14, k: TK(0) }, { c: [0, 1.95, -2.14], rx: 0.24, ry: 0.24, k: TK(0.3) }, { c: [0, 1.5, -2.4], rx: 0.3, ry: 0.3, k: TK(0.65) }, { c: [0, 1.05, -2.5], rx: 0.2, ry: 0.2, k: TK(0.9) }, { c: [0, 0.8, -2.5], rx: 0.04, ry: 0.04, k: TK(1) }], X3, Z3, 7, 2, (p) => mix3(mix3(grey, saddleC, 0.35), mul(saddleC, 0.5), ss(1.5, 0.95, p[1])));
  if (fish) limpFish(B, [0.04, 1.82, 3.0], X3, Y3, Z3, 1.9, 0.5, false, bright, HEAD);
  return B.build();
}
// glaucous-winged gull on its feet: bill +Z, feet at y 0, 1.5 m tall (three times life). A rounded white body, a pale
// grey mantle, the folded wings lying along the flanks with their darker tips crossed over the white tail, a yellow
// bill with the red spot, short dull-pink legs; and a second pair of wings, spread, for when it flares (GULL_VERT).
// aAux = (wing side -1/0/1, span 0..1 along the spread wing, head weight, 1 = spread wing)
function gullGeometry() {
  const B = makeBuilder(), white = [0.3, 0.3, 0.29], mantle = [0.195, 0.205, 0.22], tipC = [0.07, 0.075, 0.085], bill = [0.4, 0.27, 0.025], spot = [0.36, 0.04, 0.025], leg = [0.19, 0.125, 0.115], shade = [0.22, 0.225, 0.23];
  const K = (w) => [0, 0, w, 0];
  B.loft([{ c: [0, 1.03, -0.98], rx: 0.03, ry: 0.015 }, { c: [0, 1.01, -0.7], rx: 0.16, ry: 0.06 }, { c: [0, 0.97, -0.38], rx: 0.24, ry: 0.19 }, { c: [0, 0.94, -0.06], rx: 0.295, ry: 0.28 }, { c: [0, 0.95, 0.2], rx: 0.275, ry: 0.285 },
    { c: [0, 1.04, 0.38], rx: 0.2, ry: 0.22, k: K(0.25) }, { c: [0, 1.2, 0.48], rx: 0.125, ry: 0.13, k: K(0.75) }, { c: [0, 1.36, 0.55], rx: 0.135, ry: 0.13, k: K(1) }, { c: [0, 1.41, 0.66], rx: 0.125, ry: 0.115, k: K(1) }, { c: [0, 1.4, 0.77], rx: 0.085, ry: 0.085, k: K(1) },
    { c: [0, 1.38, 0.86], rx: 0.045, ry: 0.058, k: K(1) }, { c: [0, 1.365, 0.98], rx: 0.036, ry: 0.052, k: K(1) }, { c: [0, 1.33, 1.07], rx: 0.024, ry: 0.04, k: K(1) }, { c: [0, 1.285, 1.1], rx: 0.008, ry: 0.012, k: K(1) }], X3, Y3, 9, 2,
  (p, sy) => {
    if (p[2] > 0.84) return p[2] > 0.96 && p[2] < 1.06 && sy < -0.25 ? spot : bill;
    let c = mix3(white, shade, ss(-0.2, -0.95, sy) * 0.5);                                    // the belly turns from the light
    c = mix3(c, mantle, ss(0.2, 0.55, sy) * ss(0.36, 0.2, p[2]) * ss(-0.78, -0.6, p[2]));       // the mantle between the wings
    return c;
  });
  for (const sx of [-1, 1]) {
    // the folded wing: a long flat blade from the shoulder along the flank, its tip past the tail
    const FW = [sx, 0, 0, 0];
    B.loft([{ c: [sx * 0.2, 1.1, 0.32], rx: 0.04, ry: 0.07, k: FW }, { c: [sx * 0.285, 1.07, 0.12], rx: 0.07, ry: 0.19, k: FW }, { c: [sx * 0.31, 1.03, -0.2], rx: 0.065, ry: 0.215, k: FW }, { c: [sx * 0.26, 1.02, -0.52], rx: 0.05, ry: 0.16, k: FW },
      { c: [sx * 0.15, 1.05, -0.84], rx: 0.035, ry: 0.085, k: FW }, { c: [sx * 0.07, 1.085, -1.08], rx: 0.02, ry: 0.035, k: FW }, { c: [sx * 0.05, 1.1, -1.2], rx: 0.006, ry: 0.01, k: FW }], X3, Y3, 6, 1,
    (p, sy) => {
      let c = mix3(mantle, mul(mantle, 0.8), ss(0.3, -0.8, sy) * 0.6);
      c = mix3(c, white, ss(-0.72, -0.92, sy) * ss(-0.75, -0.3, p[2]) * 0.9);                  // the white trailing edge of the secondaries
      c = mix3(c, tipC, ss(-0.66, -0.86, p[2]));
      return mix3(c, white, ss(-1.1, -1.16, p[2]) * 0.8);                                       // white mirrors at the very tip
    });
    // the spread wing: an arched aerofoil from the shoulder, swept back to a point
    const N = 6, rings = [];
    for (let i = 0; i <= N; i++) { const t = i / N; rings.push({ c: [sx * (0.2 + 1.34 * t), 1.1 + 0.1 * Math.sin(Math.PI * Math.min(t * 1.2, 1)), 0.1 - 0.34 * t * t], rx: 0.045 * (1 - 0.8 * t) + 0.006, ry: (0.27 + 0.06 * Math.sin(Math.PI * t)) * (1 - Math.pow(t, 2.6)) + 0.012, k: [sx, t, 0, 1] }); }
    B.loft(rings, Y3, Z3, 6, 1, (p, sy, cx, t) => {
      let c = cx > 0 ? mantle : mix3(white, shade, 0.35);                                       // grey above, pale beneath
      c = mix3(c, white, ss(-0.74, -0.95, sy) * 0.9);                                          // white trailing edge
      c = mix3(c, tipC, ss(0.68, 0.84, t));
      return mix3(c, white, ss(0.95, 0.99, t) * 0.7);
    });
    B.loft([{ c: [sx * 0.1, 0.4, -0.02], rx: 0.045, ry: 0.045 }, { c: [sx * 0.1, 0.22, 0.0], rx: 0.03, ry: 0.03 }, { c: [sx * 0.1, 0.05, 0.02], rx: 0.03, ry: 0.035 }, { c: [sx * 0.1, 0.012, 0.21], rx: 0.085, ry: 0.014 }], X3, Z3, 5, 1, () => leg, 2);
    B.loft([{ c: [sx * 0.098, 1.435, 0.67], rx: 0.01, ry: 0.01, k: K(1) }, { c: [sx * 0.118, 1.435, 0.7], rx: 0.03, ry: 0.03, k: K(1) }, { c: [sx * 0.1, 1.435, 0.735], rx: 0.01, ry: 0.01, k: K(1) }], X3, Y3, 5, 1, () => [0.012, 0.011, 0.01]);
  }
  // a gull stands low: the body rides a quarter of its height over the gravel, the short legs mostly under its belly
  // feathers (everything above the legs comes down 0.4 m; GULL_VERT's joints are at the lowered heights)
  const g = B.build(), p = g.getAttribute('position');
  for (let i = 0; i < p.count; i++) if (p.getY(i) > 0.55) p.setY(i, p.getY(i) - 0.4);
  return g;
}
// common merganser afloat: nose +Z, waterline y 0, 1.8 m long; aAux.x marks the wings (-1 left, 1 right)
function duckGeometry() {
  const B = makeBuilder(), back = [0.035, 0.04, 0.045], flank = [0.62, 0.62, 0.58], head = [0.02, 0.07, 0.045], bill = [0.5, 0.09, 0.03];
  B.loft([{ c: [0, 0.12, -0.92], rx: 0.04, ry: 0.03 }, { c: [0, 0.14, -0.6], rx: 0.25, ry: 0.19 }, { c: [0, 0.15, -0.1], rx: 0.35, ry: 0.27 }, { c: [0, 0.16, 0.38], rx: 0.31, ry: 0.26 }, { c: [0, 0.24, 0.66], rx: 0.17, ry: 0.19 },
    { c: [0, 0.5, 0.8], rx: 0.1, ry: 0.1 }, { c: [0, 0.72, 0.9], rx: 0.13, ry: 0.13 }, { c: [0, 0.72, 1.08], rx: 0.085, ry: 0.08 }, { c: [0, 0.69, 1.28], rx: 0.035, ry: 0.03 }, { c: [0, 0.68, 1.46], rx: 0.018, ry: 0.014 }], X3, Y3, 7, 1,
  (p, sy) => (p[2] > 1.1 ? bill : p[1] > 0.4 && p[2] > 0.7 ? head : mix3(flank, back, ss(0.5, 0.9, sy))));
  // wings: the inner half white (the drake's wing patch), the dark primaries swept back to a point
  for (const sx of [-1, 1]) {
    const a = [sx, 0, 0, 0], m = [sx, 0.5, 0, 0], b = [sx, 1, 0, 0], white = [0.6, 0.6, 0.58], grey = [0.16, 0.17, 0.19];
    const i0 = B.v([sx * 0.22, 0.3, 0.36], grey, a); B.v([sx * 0.85, 0.3, 0.38], white, m); B.v([sx * 0.85, 0.3, -0.3], white, m); B.v([sx * 0.22, 0.3, -0.36], white, a);
    B.v([sx * 1.55, 0.3, 0.12], back, b); B.v([sx * 1.3, 0.3, -0.28], grey, b);
    B.tri(i0, i0 + 1, i0 + 2); B.tri(i0, i0 + 2, i0 + 3); B.tri(i0 + 1, i0 + 4, i0 + 5); B.tri(i0 + 1, i0 + 5, i0 + 2);
  }
  return B.build();
}
function instancedGeo(base, count, attrs, sphere) {
  const g = new THREE.InstancedBufferGeometry(); g.index = base.index;
  for (const k of ['position', 'normal', 'color', 'aAux']) g.setAttribute(k, base.getAttribute(k));
  for (const k in attrs) g.setAttribute(k, new THREE.InstancedBufferAttribute(attrs[k] instanceof Float32Array ? attrs[k] : new Float32Array(attrs[k]), 4));
  g.instanceCount = count; if (sphere) g.boundingSphere = sphere;
  return g;
}

// ---------------------------------------------------------------- the route
// fx / lx = x of the failed and the clean leap line, Z0 = where we enter, L = last estimate of the path length
// (the three riffle arcs sit at fixed fractions of it), E = extra metres of upper river before the portal.
// Everything else hangs off the ledge at z 0.
const ARC_U = [0.15, 0.208, 0.2525], ARC_W = 11, UNDER = -0.74, DEEP = -7.5;
const SWING_Z = [29, 24, 23];       // the swing along the face: 25 m off the lip bears, clear of the boil and of the leapers' foam
function routePoints(fx, lx, Z0, L, E) {
  const xs = fx + 6, P = [];
  const arcY = (d) => { let y = UNDER; for (const u of ARC_U) { const t = (d - u * L) / ARC_W; if (Math.abs(t) < 1) { const c = Math.cos(t * Math.PI * 0.5); y += 1.74 * c * c; } } return y; };
  // the entry is a deep pool, 7.5 m under the surface and as far over the bed, so that the 14 m opening of the portal
  // before us is filled with water; level for 22 m, then up over the drowned spruce's roots to the riffles
  P.push([xs, DEEP, Z0], [xs, DEEP, Z0 - 22], [xs - 1.2, -5.7, Z0 - 33], [xs - 2.4, -3.0, Z0 - 44], [xs - 2.2, -1.25, Z0 - 55]);
  const dEnd = ARC_U[2] * L + ARC_W + 2;
  for (let d = 66; d <= dEnd; d += 5.5) P.push([lerp(xs - 1.8, fx + 2.6, ss(60, 170, d)), arcY(d), Z0 - d]);
  P.push([fx + 2, -1.9, 64], [fx + 1, -3.0, 51], [fx + 0.3, -3.4, 37], [fx, -3.1, 24.5]);
  P.push([fx, 0, 16], [fx, 3.8, 8.6], [fx + 1.5, 2.3, 6.6], [fx + 4, -1.8, 9.5]);                                     // the miss
  P.push([fx + 9.5, -3.3, 15], [fx + 12, -3.5, 27], [fx + 8, -2.8, 42], [fx + 1, -1.5, 56], [fx - 4, 0.4, 67]);        // swept back under the boil
  P.push([fx - 3, 0.5, 77], [fx + 3, 0.5, 83.5], [fx + 11, 0.5, 81.5], [fx + 16.5, 0.5, 73]);                           // the tail of the pool
  // the run at the ledge: straight up the pool past the shoal where two bears fish (15 m on our right), the whole ledge
  // ahead; a feint left at the face, the lip bears dead ahead, then a right swing along it 26 m off, the bears passing
  // on our left; then a left curve, the apex bear ahead, that dives and brings us onto the leap line 13 m out, so
  // that run-up, leap and landing are one straight line (no roll at the apex)
  const rx0 = fx + 16.5, rx1 = lx - 2;
  P.push([fx + 17.5, 0.5, 61], [fx + 18.4, 0.5, 49], [fx + 14.8, 0.5, 38.5], [rx0, 0.5, SWING_Z[0]], [lerp(rx0, rx1, 0.5), 0.5, SWING_Z[1]], [rx1, 0.5, SWING_Z[2]]);
  P.push([lx + 3.2, 0.2, 21.6], [lx + 4.2, -1.5, 18.6], [lx + 2.4, -2.6, 16], [lx + 0.7, -2.8, 13.2], [lx + 0.1, 0.3, 8.2]);
  P.push([lx, 5.5, 3.4], [lx, 8.6, 0], [lx, 8.0, -4.5], [lx, 6, -9], [lx, 5.25, -14], [lx, 5.7, -18.5], [lx, 6.5, -23.5]);  // the leap
  P.push([lx, 6.5, -42], [lx, 6.5, -75], [lx, 6.5, -115 - E]);
  return P;
}

// A fish on a course of its own (a leaper's or a taken fish's arc at the ledge, a burst swimmer's lane in the shoal) is
// held off the WHOLE of the route's line, not only off the stretch the eye is on when the fish is there: a visitor may
// arrive at any clock, and then nothing ties the place of the fish on its course to the place of the eye on the route.
// BODY_CLEAR is the clearance such a body keeps, measured as bodyClear measures a body beside the route: five points
// along the spine, one size to either end, less 0.17 of the size (the body's half thickness).
const BODY_CLEAR = 2.6;
// The route walked every 5 cm (the walked points sorted by z into bins of 2 m), and what is asked of it:
//   near(x0, x1, y0, y1, z0, z1)   the walked points inside a box, as x, y, z in a row
//   dist(sel, x, y, z, ex, ey, ez)   from those points to a place, or to the box of half extents e about it
//   body(sel, x, y, z, fx, fy, fz, s, ex, ey, ez, s1, h)   the clearance of a body of size s at a place, facing f, each
//     point of its spine anywhere in the box e about its place (a fish that sways); with s1 and h, of a body on
//     its way to the size s1 at a place h metres on (toward -z): each point of the spine anywhere in the box about
//     its two places, and the thicker of the two bodies taken off
function routeWalk(path) {
  const STEP = 0.05, BIN = 2, n = Math.ceil(path.length / STEP), P = new Float64Array((n + 1) * 3), bins = new Map(), v = new THREE.Vector3();
  for (let i = 0; i <= n; i++) {
    path.posAtDist(Math.min(i * STEP, path.length), v); P[i * 3] = v.x; P[i * 3 + 1] = v.y; P[i * 3 + 2] = v.z;
    const b = Math.floor(v.z / BIN); if (!bins.has(b)) bins.set(b, []); bins.get(b).push(i * 3);
  }
  const dist = (sel, x, y, z, ex = 0, ey = 0, ez = 0) => {
    let best = Infinity;
    for (let i = 0; i < sel.length; i += 3) { const dx = Math.max(Math.abs(sel[i] - x) - ex, 0), dy = Math.max(Math.abs(sel[i + 1] - y) - ey, 0), dz = Math.max(Math.abs(sel[i + 2] - z) - ez, 0), d = dx * dx + dy * dy + dz * dz; if (d < best) best = d; }
    return Math.sqrt(best);
  };
  return {
    clear: BODY_CLEAR, dist,
    near(x0, x1, y0, y1, z0, z1) {
      const out = [];
      for (let b = Math.floor(z0 / BIN); b <= Math.floor(z1 / BIN); b++) { const l = bins.get(b); if (l) for (const i of l) if (P[i] >= x0 && P[i] <= x1 && P[i + 1] >= y0 && P[i + 1] <= y1 && P[i + 2] >= z0 && P[i + 2] <= z1) out.push(P[i], P[i + 1], P[i + 2]); }
      return out;
    },
    body(sel, x, y, z, fx, fy, fz, s, ex = 0, ey = 0, ez = 0, s1 = s, h = 0) {
      let d = Infinity;
      for (let k = -2; k <= 2; k++) {
        const a = k * 0.25 * (s + s1), w = Math.abs(k * 0.25 * (s1 - s));        // the point's mean place along the spine, and half its way along it
        d = Math.min(d, dist(sel, x + fx * a, y + fy * a, z - h / 2 + fz * a, ex + Math.abs(fx) * w, ey + Math.abs(fy) * w, ez + Math.abs(fz * k * 0.5 * (s1 - s) - h) / 2));
      }
      return d - 0.17 * Math.max(s, s1);
    },
  };
}
// The longest lane, no longer than the len its law drew, on which a burst swimmer of the shoal clears the route, or 0
// when none of the lanes its law may draw clears (32 m is the law's least). The fish is taken as FISH_VERT and CARD_VERT
// draw it: from its home (x, y, z) toward -z, grown over the first 6 m of the lane and gone over the last 6, facing
// yaw and pitch, and anywhere in the box it sways in (a burst swimmer shuffles 0.35 of a station fish's 0.4, 0.14 and
// 0.8 m).
function laneOff(walk, x, y, z, size, yaw, pitch, len) {
  const C = walk.clear, ex = 0.4 * 0.35, ey = 0.14 * 0.35, ez = 0.8 * 0.35;
  const cp = Math.cos(pitch), fx = -Math.sin(yaw) * cp, fy = Math.sin(pitch), fz = -Math.cos(yaw) * cp;
  // (the measure is walk.body's: five points along the spine, one size to either end, less 0.17 of the size. None of
  // the five is farther from the middle than one size: a body whose middle, wherever it sways, is 1.17 sizes and
  // the clearance from the route keeps the clearance by that measure)
  const reach = C + 1.17 * size;
  const near = (t0, t1) => walk.near(x - ex - reach, x + ex + reach, y - ey - reach, y + ey + reach, z - t1 - ez - reach, z - t0 + ez + reach);
  if (!near(0, len).length) return len;
  // the first place from `from` on at which a lane L long comes nearer than the clearance, or -1
  let sel = null, end = -1;
  const fails = (from, L) => {
    end = -1;
    for (let t = from; t < L;) {
      if (t >= end - 1e-6) { end = Math.min(t + 8, L); sel = near(t, end); }       // the route's points near the next 8 m of the lane
      if (!sel.length) { t = end; continue; }
      const spare = walk.dist(sel, x, y, z - t, ex, ey, ez) - reach;
      if (spare > 0.1) { t = Math.min(t + spare, end); continue; }                 // so far off that the next `spare` metres are clear at any size
      // one step of the lane, 0.1 m where the size changes and 0.5 m at most where it is full (within a step the
      // size changes one way only, so the box about a point's two places holds all of its way between them)
      const h = Math.min(t < 6 || t > L - 6 - 1e-6 ? 0.1 : Math.min(0.5, L - 6 - t), end - t), u = t + h;
      if (walk.body(sel, x, y, z - t, fx, fy, fz, size * ss(0, 6, t) * (1 - ss(L - 6, L, t)), ex, ey, ez, size * ss(0, 6, u) * (1 - ss(L - 6, L, u)), h) < C) return t;
      t = u;
    }
    return -1;
  };
  // (ok: up to there a lane is clear before its last 6 m, and so is every shorter lane before its own last 6 m)
  let ok = 0;
  for (let L = len; L >= 32;) {
    const t = fails(Math.min(ok, L - 6), L);
    if (t < 0) return L;
    if (t < 6) return 0;                                    // in the first 6 m, which every lane of the law has alike
    ok = Math.max(ok, Math.min(t, L - 6));
    // the next lane to try is a quarter of a metre shorter; where the place that failed was at full size, the
    // longest lane (in quarters of a metre) that may not be at full size there: one under t + 6.5, a step being
    // 0.5 m at most
    L = Math.min(L - 0.25, Math.ceil((t + 6.5) * 4) / 4 - 0.25);
  }
  return 0;
}

// speed along the route compared with the average: linger in the deep entry pool, on the miss, the tail of the pool,
// the run at the ledge (the shoal bears, the swing along the face) and (most of all) the leap; hurry the sweep under
// the boil and the dive
function paceAt(u) {
  const b = (a, c, w = 0.012) => ss(a - w, a + w, u) * (1 - ss(c - w, c + w, u));
  return 1 - 0.14 * b(0.0, 0.075, 0.02) - 0.28 * b(0.385, 0.425) + 0.5 * b(0.44, 0.525, 0.015) - 0.18 * b(0.545, 0.6) - 0.3 * b(0.605, 0.728, 0.015) + 0.4 * b(0.74, 0.755, 0.007) - 0.58 * b(0.762, 0.797, 0.008) + 0.06 * b(0.84, 0.9, 0.02);
}

export default {
  id: 'salmon-falls',
  name: 'Against the Falls',
  category: 'wilderness',
  weirdness: 0.05,
  media: ['water', 'underwater'],
  async build(ctx) {
    const rng = ctx.rng, nz = ctx.noise, vary = ctx.vary || {}, detail = ctx.quality?.detail ?? 1;
    // ---- which look: hour, season and weather by seed (the viewer's hour wish first)
    const r0 = rng();
    let lookId = r0 < 0.14 ? 'dawn' : r0 < 0.3 ? 'july' : r0 < 0.44 ? 'october' : r0 < 0.62 ? 'evening' : r0 < 0.92 ? 'september' : 'rain';
    if (vary.hour === 'night') lookId = 'night';
    else if (vary.hour === 'dawn') lookId = 'dawn';
    else if (vary.hour === 'golden') lookId = r0 < 0.3 ? 'dawn' : 'evening';
    else if (vary.hour === 'day' && (lookId === 'dawn' || lookId === 'evening')) lookId = r0 < 0.14 ? 'july' : 'september';
    const look = LOOKS[lookId], night = lookId === 'night';
    const density = clamp(vary.density ?? 1, 0.7, 1.3), rare = !!vary.rare;
    const cast = { secondWolf: rng() < 0.3, otters: rng() < 0.35, gulls: Math.round(rng.range(10, 16)), eagles: rng() < 0.5 ? 2 : 3 };
    const scene = new THREE.Scene();
    const yr = makeRng((((ctx.seed ?? 1) | 0) * 6007 + 911) >>> 0);        // and one for what this round added (cobbles under the third arc)
    const xr = makeRng((((ctx.seed ?? 1) | 0) * 7919 + 4243) >>> 0);       // a stream of its own for the ribbon, the shoal bears and the wolf's grass
    const zr = makeRng((((ctx.seed ?? 1) | 0) * 9173 + 7757) >>> 0);       // and one for the third bear at the miss and the fish holding under the face
    // (a new thing draws from a stream of its own, made from the world's seed and its name)
    const own = (name) => ctx.core.makeRng(ctx.core.hashSeed(name + ':' + ctx.seed));
    await ctx.yield();

    // ---- the hero ledge (world space = its local space)
    const hero = await buildHero(ctx, { palette: PALETTE, hour: look.hour, season: look.season, weather: look.weather, density, water: false, duration: DUR, strikeU: 0.77, plumeOpacity: 0.72 });
    scene.add(hero.object);
    const A = hero.anchors, fx = A.failX, lx = A.leapX, HU = hero.uniforms;
    if (look.weather === 'rain') HU.uSkyCol.value.multiplyScalar(1.3);          // overcast is a big soft light: the bears are brown in it, not black
    if (night) { HU.uSunCol.value.multiplyScalar(1.5); HU.uSkyCol.value.multiplyScalar(2.2); }   // moonlight enough to see the red of a fish and the rim of a bear
    const bubbleWall = hero.object.getObjectByName('bubbleWall') || null;
    if (bubbleWall) bubbleWall.material.uniforms.uBub.value.set(0.5, 1.3);      // the bubble wall keeps its glow through the pool's haze
    await ctx.yield();

    // ---- the route. Two lengths are tuned per seed (the entry reach and the last reach before the portal) so
    // that the miss breaks the surface at u 0.397 and the clean leap at u 0.767 whatever this seed's leap lines are
    let Z0 = 238, E = 5, L = 574, path = null;
    const _tv = new THREE.Vector3();
    const upAt = (u0, u1) => { let was = null; for (let i = 0; i <= 240; i++) { const u = u0 + (u1 - u0) * i / 240; path.pointAt(u, _tv); const up = _tv.y > 0; if (was === false && up && _tv.z < 30 && _tv.z > 0) return u; was = up; } return (u0 + u1) / 2; };
    for (let it = 0; it < 7; it++) {
      await ctx.yield();
      path = makePath(routePoints(fx, lx, Z0, L, E)); L = path.length;
      await ctx.yield();
      const ub = upAt(0.3, 0.5);
      await ctx.yield();
      const ul = upAt(0.66, 0.9);
      if (Math.abs(ub - 0.397) < 0.001 && Math.abs(ul - 0.767) < 0.001 && it > 1) break;
      Z0 += (0.397 - ub) * L / 0.61; E = clamp(E + (ul - 0.767) * L / 0.767, -6, 26);
    }
    await ctx.yield();
    path = makePath(routePoints(fx, lx, Z0, L, E)); L = path.length;
    const portalZ = -115 - E;
    await ctx.yield();
    // (the ledge laid its leapers and its taken fish before there was a route: now that the route stands, each of
    // their arcs that comes nearer the route's line than BODY_CLEAR gets another start, one that clears the whole of
    // that line: from the box its law draws starts from or, for a taken fish with no such start there, from that box
    // grown to either side to no more than twice its width; where no start clears, the one that keeps the most. The
    // keyed bear's fish is as it was laid. The shoal's burst swimmers are held off the route further down.)
    const walk = routeWalk(path);
    await ctx.yield();
    await hero.offRoute(walk, ctx.yield);
    await ctx.yield();
    // u of a place on the route (nearest sample between u0 and u1)
    const _pv = new THREE.Vector3();
    const uNear = (x, y, z, u0 = 0, u1 = 1) => { let best = 1e9, bu = u0; for (let i = 0; i <= 300; i++) { const u = u0 + (u1 - u0) * i / 300; path.pointAt(u, _pv); const e = (_pv.x - x) ** 2 + (_pv.y - y) ** 2 + (_pv.z - z) ** 2; if (e < best) { best = e; bu = u; } } return bu; };
    const uCross = (u0, u1, level) => { let a = u0; for (let i = 1; i <= 240; i++) { const u = u0 + (u1 - u0) * i / 240; path.pointAt(u, _pv); const up = _pv.y > level; path.pointAt(a, _pv); if ((_pv.y > level) !== up) return u; a = u; } return u1; };
    await ctx.yield();
    const beats = {
      look: lookId, rare, length: Math.round(L), Z0: Math.round(Z0), E: Math.round(E),
      arc1: ARC_U[0], arc2: ARC_U[1], arc3: ARC_U[2],
      missBreak: uCross(0.36, 0.42, 0), missTop: uNear(fx, 3.8, 8.6, 0.36, 0.46),
      tailUp: uNear(fx - 4, 0.4, 67, 0.45, 0.6), wolf: uNear(fx + 3, 0.5, 83.5, 0.45, 0.65),
      slantFrom: uNear(fx + 16.5, 0.5, 73, 0.5, 0.7), shoal: uNear(fx + 18, 0.5, 52, 0.55, 0.72), slantTo: uNear(lx - 2, 0.5, SWING_Z[2], 0.6, 0.78),
      leapBreak: uNear(lx + 0.1, 0.3, 8.2, 0.65, 0.85), apex: uNear(lx, 8.6, 0, 0.7, 0.88), splash: uNear(lx, 6, -9, 0.7, 0.9), 
    };
    await ctx.yield();
    beats.missFall = uCross(beats.missTop, beats.missTop + 0.05, 0);
    beats.surface = uCross(beats.splash + 0.004, beats.splash + 0.07, 5.97);
    beats.snap = lerp(beats.leapBreak, beats.apex, 0.42);
    beats.eagle = lerp(beats.slantFrom, beats.slantTo, 0.5);
    beats.fx = +fx.toFixed(2); beats.lx = +lx.toFixed(2);
    // seconds of flight at u (the engine scales pace the same way), for the keyed bear's clock
    const tTab = new Float32Array(257); { let acc = 0; for (let i = 1; i <= 256; i++) { acc += 1 / clamp(paceAt((i - 0.5) / 256), 0.35, 2.5); tTab[i] = acc; } for (let i = 1; i <= 256; i++) tTab[i] *= DUR / acc; }
    const tAt = (u) => { const f = clamp(u, 0, 1) * 256, i = Math.min(255, Math.floor(f)); return lerp(tTab[i], tTab[i + 1], f - i); };

    // nearest point of the route in plan, from a 24 m hash of route samples (path.nearestXZ scans every sample, which is
    // too slow for a height function); beyond 24 m a coarse scan of 97 samples is near enough
    const NS = 1200, HC = 24, HX0 = -360, HZ0 = -460, HNX = 34, HNZ = 42, cells = new Array(HNX * HNZ).fill(null), spx = new Float32Array(NS + 1), spy = new Float32Array(NS + 1), spz = new Float32Array(NS + 1), _nr = { dist: 0, y: 0 };
    await ctx.yield();
    for (let i = 0; i <= NS; i++) {
      path.pointAt(i / NS, _pv); spx[i] = _pv.x; spy[i] = _pv.y; spz[i] = _pv.z;
      const k = clamp(Math.floor((_pv.z - HZ0) / HC), 0, HNZ - 1) * HNX + clamp(Math.floor((_pv.x - HX0) / HC), 0, HNX - 1); (cells[k] || (cells[k] = [])).push(i);
      if ((i & 127) === 127) await ctx.yield();
    }
    const nearRoute = (x, z) => {
      const cx = Math.floor((x - HX0) / HC), cz = Math.floor((z - HZ0) / HC); let best = 1e12, bi = -1;
      if (cx >= 0 && cz >= 0 && cx < HNX && cz < HNZ) for (let b = Math.max(0, cz - 1); b <= Math.min(HNZ - 1, cz + 1); b++) for (let a = Math.max(0, cx - 1); a <= Math.min(HNX - 1, cx + 1); a++) {
        const L2 = cells[b * HNX + a]; if (L2 === null) continue;
        for (let j = 0; j < L2.length; j++) { const i = L2[j], dx = spx[i] - x, dz = spz[i] - z, d = dx * dx + dz * dz; if (d < best) { best = d; bi = i; } }
      }
      if (bi < 0 || best > HC * HC) { for (let i = 0; i <= NS; i += 12) { const dx = spx[i] - x, dz = spz[i] - z, d = dx * dx + dz * dz; if (d < best) { best = d; bi = i; } } }
      _nr.dist = Math.sqrt(best); _nr.y = spy[bi]; return _nr;
    };
    await ctx.yield();

    // ---- the river: banks, bed, bars
    const xs = fx + 6;
    const halfW = (z) => (z >= -40 ? 75 - 5 * ss(30, 180, z) + 4 * Math.sin(z * 0.011 + 1.3) * ss(40, 120, z) : z > portalZ - 14 ? lerp(75, 13, ss(-40, -96, z)) : lerp(13, 170, ss(portalZ - 14, portalZ - 115, z)));
    const midX = (z) => (z >= -40 ? (z > 240 ? 0.0028 * (z - 240) * (z - 240) : 0) : lx * ss(-40, -96, z));
    const edgeD = (x, z) => Math.abs(x - midX(z)) - halfW(z);                     // > 0 on land
    const waterAt = (z) => (z < -0.6 ? LIP : 0);
    const bar = { x: fx + 22, z: 99, rx: 21, rz: 10 }, spit = { x: fx - 1.5, z: 90.4, rx: 5.6, rz: 4.8 }, ebar = { x: 64, z: 44, rx: 10, rz: 17 }, shelf = { x: fx - 9.5, z: 36 }, reef = { x: fx + 33, z: 46.5, rx: 6, rz: 5 };
    const sx = rng.range(0, 100);
    // the gulls' gravel spit: a bank that climbs away from us as we come up out of the pool, so that its face shows
    const spitUp = (x, z, y) => { const q = ((x - spit.x) / spit.rx) ** 2 + ((z - spit.z) / spit.rz) ** 2; return q < 1.6 ? Math.max(y, lerp(y, clamp(0.62 + 0.16 * (z - spit.z), 0.1, 1.4) + 0.1 * nz.n2(x * 0.3, z * 0.3), ss(1.5, 0.55, q))) : y; };
    const heightRaw = (x, z) => {
      const d = edgeD(x, z), wb = 6 * ss(9, -3, z);
      if (d > 0) {
        const cut = 1.9 * ss(0.5, 3.5, d), roll = 1.3 * nz.fbm2(x * 0.02 + sx, z * 0.02, 3) * ss(2, 30, d);
        const bluff = 5.6 * ss(-66, -92, z) * ss(portalZ - 24, portalZ + 2, z) * ss(0.5, 6, d);                // the outlet channel is cut between high banks
        return wb + 0.5 + cut + bluff + roll + d * 0.02 + 28 * ss(35, 250, d) * (0.6 + 0.4 * nz.fbm2(x * 0.006 + 9, z * 0.006 + sx, 2));
      }
      const e = -d;
      if (z < -0.5) {
        const up = LIP + 0.5 - 3.3 * ss(0, 12, e) - 0.3 * nz.n2(x * 0.08 + sx, z * 0.08);
        return z > -47 ? lerp(-8.2, up, ss(-43, -47, z)) : up;
      }
      const pool = ss(74, 52, z), rif = ss(182, 168, z) * ss(76, 90, z);
      let dep = (lerp(lerp(2.9, 1.05, rif), 7.0, pool) + 11.2 * ss(Z0 - 80, Z0 - 36, z)) * ss(0, lerp(16, 9, pool), e) + 0.28 * nz.fbm2(x * 0.07 + sx, z * 0.07, 2) * (1 - 0.5 * rif);
      let y = 0.5 - dep;
      let q = ((x - bar.x) / bar.rx) ** 2 + ((z - bar.z) / bar.rz) ** 2; if (q < 1.6) y = lerp(y, 1.25 + 0.3 * nz.n2(x * 0.15, z * 0.15), ss(1.5, 0.72, q));
      y = spitUp(x, z, y);
      q = ((x - ebar.x) / ebar.rx) ** 2 + ((z - ebar.z) / ebar.rz) ** 2; if (q < 1.6) y = lerp(y, 0.6 + 0.15 * nz.n2(x * 0.2, z * 0.2), ss(1.5, 0.7, q));
      q = ((x - shelf.x) ** 2 + (z - shelf.z) ** 2) / 90; if (q < 1.6) y = lerp(y, -3.75 + 0.12 * nz.n2(x * 0.35, z * 0.35), ss(1.5, 0.3, q));   // the pool bear's shelf: it stands to the shoulder, only its back out
      q = ((x - reef.x) / reef.rx) ** 2 + ((z - reef.z) / reef.rz) ** 2; if (q < 1.6) y = lerp(y, -0.5 + 0.12 * nz.n2(x * 0.3, z * 0.3), ss(1.5, 0.5, q));   // a shoal awash in the pool: two bears fish from it
      return z < 14.5 ? lerp(-8.2, y, ss(11, 14.5, z)) : y;
    };
    const height = (x, z, laid) => {
      let y = heightRaw(x, z);
      if (edgeD(x, z) < 9) { const pd = nearRoute(x, z); if (pd.dist < 11) { const t = Math.min(pd.y, waterAt(z)) - 2.05, nar = ss(68, 78, z) * ss(116, 106, z) * ss(fx + 4, fx + 8, x); if (t < y) y = lerp(t, y, ss(lerp(4.5, 3.4, nar), lerp(11, 7.2, nar), pd.dist)); } }
      // (for z from 80 to 100 the spit is laid over the trench again: none of it within 1.6 m of the route in plan, all
      // of it from 3.4 m, eased between; with laid, all of it at every distance)
      if (z > 80 && z < 100) { const s = spitUp(x, z, y); if (s > y) y = laid ? s : lerp(y, s, ss(1.6, 3.4, nearRoute(x, z).dist)); }
      return y;
    };
    // the ground with the spit laid whole over the trench. The scatters that test a place against it take and refuse
    // the places they would if the spit stood whole, so that what is dealt after them from the same streams does not
    // move with the cut
    const bedWas = (x, z) => height(x, z, true);

    // ---- sky, light, haze
    const sunV = new THREE.Vector3(look.sun[0], look.sun[1], look.sun[2]).normalize();
    const sunEl = Math.asin(sunV.y) * 180 / Math.PI, sunAz = Math.atan2(sunV.x, -sunV.z) * 180 / Math.PI;
    const sky = makeSky(night
      ? { rng, preset: 'night', bake: true, renderer: ctx.renderer, bodyOverrides: { 0: { elevation: sunEl, azimuth: sunAz, size: 2.6 } }, ...look.sky }
      : { rng, preset: look.preset, sunElevation: sunEl, sunAzimuth: sunAz, ...look.sky });
    scene.add(sky.object);
    const airCol = new THREE.Color(look.air), volCol = new THREE.Color(look.vol[0], look.vol[1], look.vol[2]);
    const AIR_K = look.airK, WATER_K = 0.0155;
    // (the water's colour in the deep: the design's dark pool green, as strong as this look's water is beside September's;
    // volNow = the water's own colour at the eye's depth, set each frame in update)
    const volDeep = new THREE.Color(PALETTE[2]).multiplyScalar((0.2126 * look.vol[0] + 0.7152 * look.vol[1] + 0.0722 * look.vol[2]) / (0.2126 * LOOKS.september.vol[0] + 0.7152 * LOOKS.september.vol[1] + 0.0722 * LOOKS.september.vol[2]));
    const volNow = volCol.clone();
    scene.fog = new THREE.FogExp2(airCol.clone(), AIR_K);
    scene.background = airCol.clone();
    const rig = makeLightRig(sky, { intensity: look.light, ambient: look.amb, bounce: 0.35 });
    scene.add(rig.object);
    await ctx.yield();

    // ---- terrain
    const C_BED = hexLin('#c2bba4'), C_ALGAE = hexLin('#77803f'), C_GRAVEL = hexLin('#a8a294'), C_MOSS = hexLin(look.season === 'july' ? '#3c5428' : '#3a4428');
    const C_GRASS = hexLin(look.season === 'july' ? '#7c8a3a' : look.snow ? '#9a8c5c' : '#9a8236'), C_TUNDRA = hexLin(look.season === 'july' ? '#5c6a34' : '#7c3626'), C_SNOW = [0.74, 0.77, 0.82], C_WET = hexLin('#3c352a');
    const groundColor = (x, z, h, ny, out) => {
      const d = edgeD(x, z), wy = waterAt(z), n = nz.fbm2(x * 0.05 + 3, z * 0.05, 3), n2 = nz.n2(x * 0.4, z * 0.4);
      let c;
      if (d < 0 && h < wy + 0.3) {
        c = mul(mix3(C_BED, C_ALGAE, clamp(0.12 + 0.6 * n, 0, 0.7)), 0.84 + 0.16 * n2);
        c = mix3(c, [0.12, 0.17, 0.11], clamp((wy - h) / 7, 0, 1) * (z > 150 ? 0.25 : 0.42));
        // (the bed is lit by its own depth: in full down to DUSK_BED[0], DEEP_LIGHT of it at DUSK_BED[1] and below)
        { const k = ss(DUSK_BED[0], DUSK_BED[1], wy - h); c = [c[0] * lerp(1, DEEP_LIGHT[0], k), c[1] * lerp(1, DEEP_LIGHT[1], k), c[2] * lerp(1, DEEP_LIGHT[2], k)]; }
      } else if (d < 0) c = mix3(mul(C_GRAVEL, 0.85 + 0.15 * n2), C_GRASS, ss(0.75, 1.25, h - wy) * 0.75);
      else {
        c = mix3(C_MOSS, C_GRASS, ss(16, 4, d) * 0.85 + 0.1 * n);
        c = mix3(c, C_TUNDRA, ss(90, 230, d) * (0.55 + 0.45 * n));
        c = mix3(c, C_WET, ss(1.2, 0.2, d));
      }
      if (look.snow && (d > 1 || h > wy + 0.8)) c = mix3(c, C_SNOW, ss(0.6, 0.85, ny) * ss(-0.35, 0.2, n + 0.25 * n2) * 0.92);
      return out.setRGB(c[0], c[1], c[2]);
    };
    // The kit asks for most of its heights in one step, so they are worked out here first, a slice at a time, on the
    // kit's own lattice (3 m cells, 96 m roots centred on the bounds): fine near the route, coarse far from it. A
    // point that was not prepared is simply computed when asked for.
    const TB = [-300, -400, 350, 450], TC = 3, TR = TC * 32, tnx = Math.round((TB[2] - TB[0]) / TR), tnz = Math.round((TB[3] - TB[1]) / TR);
    const TX0 = (TB[0] + TB[2]) / 2 - tnx * TR / 2, TZ0 = (TB[1] + TB[3]) / 2 - tnz * TR / 2, TGX = tnx * 32, TGZ = tnz * 32, TSX = TGX + 1;
    const memo = new Float32Array(TSX * (TGZ + 1)).fill(NaN);
    { let work = 0;
      for (let bz = 0; bz < TGZ; bz += 8) for (let bx = 0; bx < TGX; bx += 8) {
        const dist = nearRoute(TX0 + (bx + 4) * TC, TZ0 + (bz + 4) * TC).dist - 17, st = dist < 52 ? 1 : dist < 100 ? 2 : dist < 190 ? 4 : 8;
        for (let j = 0; j <= 8; j += st) for (let i = 0; i <= 8; i += st) { const k = (bz + j) * TSX + bx + i; if (memo[k] === memo[k]) continue; memo[k] = height(TX0 + (bx + i) * TC, TZ0 + (bz + j) * TC); work++; }
        if (work > 500) { work = 0; await ctx.yield(); }
      }
    }
    const heightMemo = (x, z) => {
      const fi = (x - TX0) / TC, fj = (z - TZ0) / TC, i = Math.round(fi), j = Math.round(fj);
      if (Math.abs(fi - i) > 1e-3 || Math.abs(fj - j) > 1e-3 || i < 0 || j < 0 || i > TGX || j > TGZ) return height(x, z);
      const k = j * TSX + i, h = memo[k]; if (h === h) return h;
      return (memo[k] = height(x, z));
    };
    await ctx.yield();
    const detailTexture = T.makeDetailTexture({ rng: rng.fork('detail'), size: 96, anisotropy: 4 });
    await ctx.yield();
    const terrain = await T.makeTerrainAsync({
      rng: rng.fork('terrain'), noise: nz, height: heightMemo, path, corridor: false, bounds: TB, cell: TC, near: 40, levels: 5, maxTriangles: 44000, detailTexture,
      biome: 'tundra', palette: { snow: null, rock: '#4a4034', rockB: '#3a3228', rockSlope: [0.45, 0.75], strata: 0.1, pebbles: 0.9, cracks: 0.05, tufts: 0.5, clouds: night ? 0 : 0.4, patchAmount: 0.12 },
      color: groundColor, sunDir: sunV, skirt: 20,
    }, ctx.yield);
    scene.add(terrain.object);
    await ctx.yield();

    // ---- our own water surface: lower river (y 0) and upper river (y 6, bending to the hero's lip)
    const surfU = {
      ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), uTime: HU.uTime, uSun: HU.uSun, uSunCol: HU.uSunCol, uSkyCol: HU.uSkyCol, uGndCol: HU.uGndCol, uCam: HU.uCam,
      uWave: { value: new THREE.Vector4(0, 0, -100, 0) }, uDusk: { value: 0 }, uPool: { value: new THREE.Color(PALETTE[2]) }, uAmber: { value: new THREE.Color(PALETTE[1]) }, uWhite: { value: new THREE.Color(PALETTE[5]) },
      uGold: { value: new THREE.Color(look.gold) }, uHorizon: hero.waterUniforms.uHorizon, uSkyHor: { value: sky.horizonColor.clone().multiplyScalar(night ? 1 : 0.85) }, uVol: { value: volCol },
      uBedCol: { value: new THREE.Color(C_BED[0], C_BED[1], C_BED[2]) }, uLeaf: { value: look.leaf * 0.11 }, uRain: { value: look.rain ? 1 : 0 }, uGoldAmt: { value: look.birch ? 1 : 0.3 },
      uGlint: { value: look.weather === 'rain' ? 0.25 : night ? 0.8 : 1.5 }, uCeil: { value: volCol.clone().multiplyScalar(1.5) }, uWK: { value: WATER_K },
      uComp: { value: Array.from({ length: 8 }, () => new THREE.Vector4(0, 0, 0, 1)) }, uCompS: { value: [0, 0, 0, 0, 0, 0, 0, 0] }, uRing: { value: Array.from({ length: 8 }, () => new THREE.Vector4(0, 0, 0, 0)) },
      uSunAir: { value: HU.uSunCol.value.clone() }, uSkyAir: { value: HU.uSkyCol.value.clone() },
      uDuck: { value: Array.from({ length: 8 }, () => new THREE.Vector4(0, 0, 99, 0)) }, uDuckT: { value: -1 }, uDuckL: { value: [99, 99, 99, 99, 99, 99, 99, 99] },
      uSubm: { value: new THREE.Vector2(0, 0) }, uDrown: { value: new THREE.Color(0.2, 0.02, 0.02) }, uMirK: { value: 0.2 },
      uLedge: { value: Array.from({ length: 16 }, () => new THREE.Vector4(0, 1, 6, 0)) },
      uJetX: { value: new Array(24).fill(1e4) },
      uHole: { value: new THREE.Vector4(0, -100, 0, 1) }, uHoleAx: { value: new THREE.Vector3(1, 0, 0) }, uHoleK: { value: 0.95 }, uRaft: { value: new THREE.Vector4(shelf.x - 9, 21, 23, 18) },
      tTrees: { value: null }, uTreeMap: { value: new THREE.Vector4(-210, -400, 1 / 420, 1 / 850) }, uGoldRef: { value: new THREE.Color(0.3, 0.18, 0.02) }, uSpruceRef: { value: new THREE.Color(0.02, 0.04, 0.03) }, uSpruceLit: { value: new THREE.Color(0.11, 0.24, 0.1) }, uHazeK: { value: look.airK * 1.15 },
      uPortalR: { value: new THREE.Vector4(lx, 6.5, portalZ, 6) }, uPortalCol: { value: new THREE.Color(night ? '#b8ccff' : '#d4ecff').multiplyScalar(night ? 0.5 : 0.8) },
    };
    // the canopy map the water mirrors (filled once the forest is laid out, further down)
    const TM = { nx: 210, nz: 425, x0: -210, z0: -400, cell: 2, data: new Uint8Array(210 * 425 * 4) };
    hero.waterUniforms.uUnder.value.copy(volCol); HU.uUnderC.value.copy(volCol);
    const surfMat = new THREE.ShaderMaterial({ uniforms: surfU, vertexShader: SURF_VERT, fragmentShader: SURF_FRAG, fog: true, transparent: true, depthWrite: false, side: THREE.DoubleSide });
    {
      const P = [], D = [], I = [], BD = []; let base = 0;
      const sheet = (zs, nx, yAt, calm) => {
        for (let j = 0; j < zs.length; j++) {
          const z = zs[j], hw = Math.min(halfW(z) + 7, 190), mx = midX(z);
          for (let i = 0; i <= nx; i++) {
            const s = (i / nx) * 2 - 1, x = mx + Math.sign(s) * Math.pow(Math.abs(s), 1.25) * hw, y = yAt(x, z);
            const dep = Math.max(0, y - height(x, z)), rif = z > 0 ? ss(182, 168, z) * ss(76, 90, z) * ss(2.6, 1.2, dep) : 0;
            const boil = z > 0 ? Math.exp(-Math.max(z, 0) / 6.5) * ss(-0.6, 1.5, z) : 0;
            P.push(x, y - 0.78 * boil, z); D.push(dep, rif, ss(0.25, 0.8, boil), calm);
            // (the bed under the upper river from the lip back to the end of the ledge is the hero's rock)
            BD.push(calm && z > -47 ? Math.max(0, y - hero.rockTop(x, z)) : dep);
          }
        }
        for (let j = 0; j < zs.length - 1; j++) for (let i = 0; i < nx; i++) { const a = base + j * (nx + 1) + i, b = a + nx + 1; I.push(a, b, a + 1, a + 1, b, b + 1); }
        base += zs.length * (nx + 1);
      };
      const zl = []; for (let j = 0; j <= 104; j++) { const t = j / 104; zl.push(0.35 + 449 * (0.35 * t + 0.65 * t * t)); }
      sheet(zl.slice(0, 36), 52, () => 0, 0);
      await ctx.yield();
      sheet(zl.slice(35, 71), 52, () => 0, 0);
      await ctx.yield();
      sheet(zl.slice(70), 52, () => 0, 0);
      await ctx.yield();
      const zu = []; for (let j = 0; j <= 62; j++) { const t = j / 62; zu.push(-0.62 - 399 * (0.3 * t + 0.7 * t * t)); }
      sheet(zu, 40, (x, z) => (z > -12 ? hero.surfaceAt(x, z) : LIP) - 0.03, 1);
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('aD', new THREE.Float32BufferAttribute(D, 4)); g.setAttribute('aBed', new THREE.Float32BufferAttribute(BD, 1)); g.setIndex(I);
      const mesh = new THREE.Mesh(g, surfMat); mesh.name = 'river'; mesh.renderOrder = 0; mesh.frustumCulled = false; scene.add(mesh);
    }
    await ctx.yield();

    // ---- under water: the kit's shafts, plankton, bubbles and waterline; fog and visibility are switched here
    // (the bubbles that rise at the foot of the falls are swarms of many small ones, 2 to 15 cm across, none a large ring)
    const uw = Water.makeUnderwater({
      rng: rng.fork('uw'), sky, surfaceY: 0, floorY: -7, water: '#62a878', deep: '#1f5a44', fogDensity: WATER_K,
      rays: false,
      particles: { count: Math.round(520 * detail), range: 36, size: 0.045, color: '#d8e8c8', glowFraction: 0 },
      bubbles: { count: Math.round(450 * detail), size: 0.03, sources: [[fx - 6, -6.5, 7], [fx + 7, -6.5, 8], [fx + 16, -6.5, 9], [lx + 12, -6.5, 8], [lx + 5, -6.5, 9.5], [fx + 1, -6.5, 12]] },
      caustics: { scale: 3.4, intensity: 5.2, speed: 0.6, color: '#f6ffd8' },
    });
    if (uw.surface) uw.surface.visible = false;
    scene.add(uw.object);
    uw.applyCaustics(terrain.material);
    // THE BED OF THE RUNS (the design: the river runs '2.4 m deep over cobbles in the runs, 1 m in the riffles'). Over
    // the colour the mesh carries the kit's ground lays a dress of its own: all that its ground shader does to that
    // colour (patches and slip faces, the near layers of pebbles, cracks, ripples and tufts, drift, rock, strata and
    // joints where the ground is steep, fine breakup, wet tint, snow: whichever of them this ground is given), and the
    // bump that goes with it (gTGrad). That dress is the riffles' gravel: it is whole where the water over the bed is
    // RIFFLE_DEEP or less, as it is on all the ground in the air, and none of it is left where the water is RUN_DEEP or
    // more. What is left there is the bed's own colour as the mesh carries it (bedOwn), with the kit's absorption by
    // depth and the kit's wet tint on it as the kit lays them, and a face without the kit's bump for the light and for
    // the caustic net.
    // (the water's level is waterAt's: LIP upstream of the falls' line z -0.6 and 0 downstream of it)
    // HOW IT IS LAID, AND WHAT IS DONE IF IT CANNOT BE: the ground's material is the kit's, and its program text is put
    // together in the material's onBeforeCompile, which by now is the kit's (the ground's own steps, the caustics' after
    // them). Ours is chained after it: the kit's is called first, then two pieces are put into the fragment text it
    // hands on, one straight after '#include <color_fragment>' (the bed's own colour is taken there) and one straight
    // before '#include <roughnessmap_fragment>' (the rule above). They are put in only if that fragment text has every
    // piece they lean on: the two includes (BED_AT) and, each as a whole word, the kit's names they read or write
    // (BED_NAMES). If one of them is not there, as under a kit that names its parts otherwise, neither piece is put in:
    // the fragment text stays the kit's, character for character, and the ground is drawn by the kit's program alone.
    // No texture is made here.
    const RIFFLE_DEEP = 1, RUN_DEEP = 2.4;
    {
      const bedMat = terrain.material, kitCompile = bedMat.onBeforeCompile, kitKey = bedMat.customProgramCacheKey();
      const BED_AT = ['#include <color_fragment>', '#include <roughnessmap_fragment>'], BED_NAMES = ['diffuseColor', 'vTWorld', 'vKitWorld', 'uKitAbsorb', 'uKitAbsorbK', 'uCausSurf', 'uTWetTint', 'gTWet', 'gTGrad'];
      bedMat.onBeforeCompile = (shader, renderer) => {
        kitCompile.call(bedMat, shader, renderer);
        const f = shader.fragmentShader;
        if (typeof f !== 'string' || !BED_AT.every((w) => f.includes(w)) || !BED_NAMES.every((w) => new RegExp('\\b' + w + '\\b').test(f))) return;
        shader.fragmentShader = f
          .replace(BED_AT[0], BED_AT[0] + '\n vec3 bedOwn = diffuseColor.rgb;')
          .replace(BED_AT[1], `{ float ease = smoothstep(${RIFFLE_DEEP.toFixed(1)}, ${RUN_DEEP.toFixed(1)}, (vTWorld.z < -.6 ? ${LIP.toFixed(1)} : 0.) - vTWorld.y);
  vec3 own = bedOwn*mix(vec3(1.), uKitAbsorb, 1. - exp(-max(uCausSurf - vKitWorld.y, 0.)*uKitAbsorbK))*mix(vec3(1.), uTWetTint, gTWet);
  diffuseColor.rgb = mix(diffuseColor.rgb, own, ease); gTGrad *= 1. - ease; }
` + BED_AT[1]);
      };
      bedMat.customProgramCacheKey = () => kitKey + '|bed-runs';
      bedMat.needsUpdate = true;
    }
    const uwSurfU = [uw.rays, uw.particles, uw.bubbles].filter(Boolean).map((m) => m.material.uniforms.uSurf);
    await ctx.yield();

    // ---- the shoal: three tiers in four reaches (each reach is one mesh per tier, so reaches behind us are culled)
    // (the way the sun's shafts run down through the water: the refracted sun)
    const shaftDir = new THREE.Vector3(-sunV.x * 0.62, -Math.sqrt(Math.max(1 - (1 - sunV.y * sunV.y) * 0.565, 0.05)), -sunV.z * 0.62).normalize();
    const lightU = { uTime: HU.uTime, uSun: HU.uSun, uSunCol: HU.uSunCol, uSkyCol: HU.uSkyCol, uGndCol: HU.uGndCol, uCam: HU.uCam };
    const fishU = { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...lightU, uVolC: { value: volCol }, uAbove: { value: 0 }, uFogF: { value: 1 }, uGainF: { value: 1 }, uGainR: { value: 1 }, uFarK: { value: 1 }, uGrow: { value: 1 }, uFan: { value: new THREE.Vector2(0, 0) }, uBoil: { value: new THREE.Vector4(15, 34, 99, 1) }, uShaftD: { value: shaftDir } };
    const fishMat = new THREE.ShaderMaterial({ uniforms: fishU, vertexShader: FISH_VERT, fragmentShader: FISH_FRAG, fog: true, vertexColors: true, side: THREE.DoubleSide });
    await ctx.yield();
    const geoNear = salmonGeometry(PALETTE, look.season);
    await ctx.yield();
    const geoLod = salmonGeometry(PALETTE, look.season, 8, 1);      // the same fish in 214 triangles, for the ones the eye never comes within 5 m of
    await ctx.yield();
    const geoMid = fishLowGeometry(PALETTE, look.season), FC = fishColours(PALETTE, look.season);
    surfU.uDrown.value.setRGB(FC.red[0] * 0.66, FC.red[1] * 0.66, FC.red[2] * 0.66);
    await ctx.yield();
    const cardU = { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...lightU, uShaftD: fishU.uShaftD, uVolC: { value: volCol }, uAbove: fishU.uAbove, uFogF: { value: 1 }, uGainF: fishU.uGainF, uGainR: fishU.uGainR, uFarK: fishU.uFarK, uRed: { value: new THREE.Color(FC.red[0], FC.red[1], FC.red[2]) }, uOlive: { value: new THREE.Color(FC.olive[0], FC.olive[1], FC.olive[2]) } };
    const cardMat = new THREE.ShaderMaterial({ uniforms: cardU, vertexShader: CARD_VERT, fragmentShader: CARD_FRAG, fog: true, side: THREE.DoubleSide });
    const geoCard = new THREE.BufferGeometry();
    geoCard.setAttribute('position', new THREE.Float32BufferAttribute([0, -0.36, -1.08, 0, -0.36, 0.93, 0, 0.36, 0.93, 0, 0.36, -1.08, -0.19, 0.02, -1.08, -0.19, 0.02, 0.93, 0.19, 0.02, 0.93, 0.19, 0.02, -1.08], 3));
    geoCard.setAttribute('aQ', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0, -1, -1, 1, 1, -1, 1, 1, 1, 1, -1, 1, 1], 3)); geoCard.setIndex([0, 1, 2, 0, 2, 3, 4, 5, 6, 4, 6, 7]);
    const pathX = (z) => (z > 64 ? lerp(xs - 1.8, fx + 2.6, ss(Z0 - 60, Z0 - 170, z)) : fx + 2);
    // the red ribbon: in from the lower right of the entry (and a second stream from the left, so that from the
    // portal it runs right across the disc), over the drowned spruce's roots, then up the riffle beside us
    const ribbonAt = (z) => [xs + 3.9 + 5.4 * ss(Z0 - 46, Z0 + 8, z) + 2.6 * Math.sin(z * 0.045 + 1) * ss(Z0 - 50, Z0 - 90, z), lerp(lerp(-8.6, -2.5, ss(Z0 - 4, Z0 - 38, z)), -1.5, ss(Z0 - 44, Z0 - 72, z))];
    const reaches = [
      { name: 'entry', z0: 170, z1: Z0 + 36, cx: pathX, spread: 13, far: 3000, mid: 470, ribbon: 0.62, burst: 0.3 },
      { name: 'riffle', z0: 78, z1: 170, cx: pathX, spread: 9, far: 1200, mid: 172, ribbon: 0, burst: 0.15 },
      { name: 'pool', z0: 15.5, z1: 76, cx: () => fx + 10, alt: lx + 6, spread: 22, far: 2800, mid: 330, ribbon: 0, burst: 0 },
      { name: 'foot', z0: 9.8, z1: 17, cx: () => lx + 1, spread: 13, far: 500, mid: 92, ribbon: 0, burst: 0 },
      { name: 'upper', z0: -96, z1: -13, cx: () => lx, spread: 5, far: 700, mid: 82, ribbon: 0, burst: 0 },
    ];
    let fishCount = 0;
    // the sight line from the route down the pool to the pool bear, and the bear itself: no fish there
    const inSight = (x, z) => { const dx = x - shelf.x, dz = z - shelf.z; return dx * dx + dz * dz < 56 || (dx > -3.5 && x < fx + 1.4 && dz > -6.5 - 0.4 * dx && dz < 6.5 + 4.4 * dx); };
    const placeFish = async (R, n, sizeK, clear, spreadK, sink, card) => {
      const iA = new Float32Array(n * 4), iB = new Float32Array(n * 4), iC = new Float32Array(n * 4); let c = 0;
      for (let tries = 0; c < n && tries < n * 14; tries++) {
        if ((tries & (card ? 63 : 15)) === (card ? 63 : 15)) await ctx.yield();
        const z = rng.range(R.z0, R.z1), rib = !card && rng() < R.ribbon, rb = rib ? ribbonAt(z) : null;
        const cx = R.alt !== undefined && rng() < 0.45 ? R.alt : R.cx(z);
        let x = rib ? (z > Z0 - 44 && rng() < 0.45 ? 2 * xs - 1 - rb[0] : rb[0]) + rng.gauss() * 1.7 : cx + clamp(rng.gauss(), -2.6, 2.6) * R.spread * spreadK * (R.name === 'upper' && z < -50 ? 1.6 : 1);
        if (edgeD(x, z) > -4) continue;
        const overRock = z < 9.7 && z > -47.5;
        if (overRock && Math.abs(x - lx) > 6) continue;
        const bed = overRock ? 4.0 : z < 14.5 ? -6.6 : bedWas(x, z), top = waterAt(z) - sink - (z > 0 ? 1.3 * ss(42, 24, z) : 0), bot = bed + 0.42;   // deeper under the boil, whose troughs dip 0.7 m
        if (top - bot < 0.25) continue;
        const y = rib ? Math.min(top, rb[1] + rng.gauss() * 0.75) : lerp(bot, top, Math.pow(rng(), 0.8));
        if (y < bot) continue;
        const keep = z > Z0 - 28 ? Math.max(clear, 7.5) : clear;                                              // the entry cone stays open
        if (!rib && z > Z0 - 46 && z < Z0 + 30) { const k = (Z0 - z) / 42; if (Math.hypot(x - (xs + 4 * k), y - (DEEP - 1.4 * k)) < 4.5 + 3 * clamp(k, 0, 1)) continue; }
        if (z > Z0 - 12 && Math.hypot(x - xs, y - DEEP, Math.max(z - Z0 - 22, Z0 - z, 0)) < (card ? 15 : 5)) continue;   // the preview's eye stands 20 m behind the entry   // and so does the view of the roots
        if (card) { const nr = nearRoute(x, z); if (Math.hypot(nr.dist, y - nr.y) < keep) continue; } else if (path.distanceTo(x, y, z) < keep) continue;
        const burst = rng() < R.burst && z > R.z0 + 45;
        iA[c * 4] = x; iA[c * 4 + 1] = y; iA[c * 4 + 2] = z; iA[c * 4 + 3] = rng();
        iB[c * 4] = lerp(0.85, 1.15, (rng.range(0.82, 1.22) - 0.82) / 0.4) * sizeK * (z < 90 && z > 15 && inSight(x, z) ? 0 : 1); iB[c * 4 + 1] = card ? clamp(rng.gauss() * 0.42, -1.2, 1.2) : rng.range(-0.16, 0.16) * (R.name === 'pool' ? 1.8 : 1); iB[c * 4 + 2] = burst ? rng.range(3.5, 7) : 0; iB[c * 4 + 3] = burst ? rng.range(32, z - R.z0 - 6) : 1;
        iC[c * 4] = rng(); iC[c * 4 + 1] = rng.range(-0.07, 0.07); iC[c * 4 + 2] = burst ? rng.range(11, 15) : rng.range(4.5, 7.5); iC[c * 4 + 3] = burst ? 0.35 : 1;
        // (a burst swimmer's whole lane is held off the whole of the route: where the lane drawn comes too near, the
        // longest shorter one that clears; where none of the law's lanes clears, the fish keeps its station at home
        // as its neighbours do, with a station fish's values from the same draws: speed 0, wrap 1, the shuffle 1,
        // and a tail beat between 4.5 and 7.5 where the swimmer's was between 11 and 15, three quarters as far
        // above 4.5 as that was above 11)
        if (burst) {
          const len = laneOff(walk, iA[c * 4], iA[c * 4 + 1], iA[c * 4 + 2], iB[c * 4], iB[c * 4 + 1], iC[c * 4 + 1], iB[c * 4 + 3]);
          if (len > 0) iB[c * 4 + 3] = len; else { iB[c * 4 + 2] = 0; iB[c * 4 + 3] = 1; iC[c * 4 + 2] = 4.5 + (iC[c * 4 + 2] - 11) * 0.75; iC[c * 4 + 3] = 1; }
        }
        c++;
      }
      return { iA, iB, iC, count: c };
    };
    const fishMeshes = [];
    for (const R of reaches) {
      const zc = (R.z0 + R.z1) / 2, sphere = new THREE.Sphere(new THREE.Vector3(R.cx(zc), R.name === 'upper' ? 4 : -4, zc), (R.z1 - R.z0) / 2 + R.spread * 2.6 + 30);
      for (const [card, n, k, clear, spreadK, sink] of [[true, Math.round(R.far * density * (0.4 + 0.6 * detail)), 1, 13, 1, 0.98], [false, Math.round(R.mid * density * (0.6 + 0.4 * detail)), 1, 2.8, 0.46, 0.78]]) {
        const d = await placeFish(R, n, k, clear, spreadK, sink, card);
        // (over a density of 1.15 the fish are laid out as before but the last of them are not drawn: the triangle budget)
        const shown = Math.min(d.count, Math.round(n * Math.min(1, 1.15 / density)));
        let geo;
        if (card) { geo = new THREE.InstancedBufferGeometry(); geo.index = geoCard.index; geo.setAttribute('position', geoCard.getAttribute('position')); geo.setAttribute('aQ', geoCard.getAttribute('aQ')); for (const key of ['iA', 'iB', 'iC']) geo.setAttribute(key, new THREE.InstancedBufferAttribute(d[key], 4)); geo.instanceCount = shown; geo.boundingSphere = sphere; }
        else geo = instancedGeo(geoMid, shown, { iA: d.iA, iB: d.iB, iC: d.iC }, sphere);
        const mesh = new THREE.Mesh(geo, card ? cardMat : fishMat);
        // (the upper river's only from the leap on; the pool's not from the riffle arcs, whose glare hides them; the riffle's not from the swing along the face)
        mesh.name = (card ? 'shoal-far-' : 'shoal-') + R.name; mesh.userData.airBack = R.name === 'entry' ? 10 : 0; mesh.userData.uMax = R.name === 'upper' ? 2 : beats.leapBreak + 0.0015; mesh.userData.zr = [R.z0 - (R.name === 'entry' ? 10 : R.name === 'riffle' ? 48 : 56), R.name === 'upper' ? 13 : R.z1 + (R.name === 'pool' ? 16 : 62)];
        scene.add(mesh); fishMeshes.push(mesh); fishCount += shown;
        await ctx.yield();
      }
    }
    // the red ribbon at the entry: two streams of big sockeye that rise out of the deep on either side of the axis
    // (the left one passing under it) and pour together over the drowned spruce's roots, 60 m in front of the eye
    // that looks through the previous world's portal; then on up the riffle on our right
    {
      const WX = xs + 4.5, streams = [
        [[xs + 10, -10.6, Z0 - 2], [xs + 9.5, -8.6, Z0 - 16], [xs + 8, -6, Z0 - 30], [xs + 5.2, -1.9, Z0 - 41.5], [xs + 2.6, -2.3, Z0 - 55], [xs + 2.2, -1.7, Z0 - 70]],
        [[xs - 9, -10.6, Z0 - 4], [xs - 6.5, -10.9, Z0 - 14], [xs - 1, -10.7, Z0 - 24], [xs + 3.4, -7.6, Z0 - 34], [WX + 0.6, -2.0, Z0 - 42], [xs + 3.2, -2.4, Z0 - 56], [xs + 2.6, -1.8, Z0 - 70]],
      ];
      const n = Math.round(150 * density * (0.6 + 0.4 * detail)), iA = new Float32Array(n * 4), iB = new Float32Array(n * 4), iC = new Float32Array(n * 4), a = new THREE.Vector3(), b = new THREE.Vector3(); let c = 0;
      const curves = streams.map((pts) => new THREE.CatmullRomCurve3(pts.map((q) => new THREE.Vector3(q[0], q[1], q[2])), false, 'centripetal'));
      await ctx.yield();
      for (let tries = 0; c < n && tries < n * 8; tries++) {
        if ((tries & 31) === 31) await ctx.yield();
        const cv = curves[tries & 1], t = Math.pow(xr(), 0.8) * 0.97; cv.getPoint(t, a); cv.getPoint(t + 0.02, b); b.sub(a).normalize();
        const x = a.x + xr.gauss() * 1.05, y = a.y + xr.gauss() * 0.55, z = a.z + xr.gauss() * 1.6;
        // (no fish within 3.8 m of the route's line nor of the line 1.6 m under it, the same along the whole reach)
        if (y > -1.15 || y < height(x, z) + 0.5 || path.distanceTo(x, y, z) < 3.8 || path.distanceTo(x, y + 1.6, z) < 3.8) continue;
        iA.set([x, y, z, xr()], c * 4); iB.set([lerp(0.9, 1.15, (xr.range(1.12, 1.5) - 1.12) / 0.38), Math.atan2(-b.x, -b.z) + xr.range(-0.12, 0.12), 0, 1], c * 4);
        iC.set([xr(), Math.asin(clamp(b.y, -0.8, 0.8)), xr.range(5, 8), 0.7], c * 4); c++;
      }
      const mesh = new THREE.Mesh(instancedGeo(geoMid, c, { iA, iB, iC }, new THREE.Sphere(new THREE.Vector3(xs + 3, -6, Z0 - 36), 60)), fishMat);
      mesh.name = 'ribbon'; mesh.userData.zr = [Z0 - 120, Z0 + 60]; scene.add(mesh); fishMeshes.push(mesh); fishCount += c;
      await ctx.yield();
    }
    // neighbours within arm's reach of the route (full detail: hump, hooked jaw, fins)
    const byU = [];           // meshes shown only while u is in their userData.ur
    // THE WATER'S SIGHT, one rule for a new thing of the lower river (bySight): d is how far the eye stands, along z, outside
    // the stretch the thing's own members span, before it or behind. The thing is whole while d is at most SIGHT_Z (the
    // design's 60 m of visibility) less RISE_Z, is drawn small to nothing over the last RISE_Z metres, and is not drawn beyond
    const SIGHT_Z = 60, RISE_Z = 20, byZ = [];
    const bySight = (mesh) => {
      const stones = mesh.isInstancedMesh, A = stones ? mesh.instanceMatrix.array : mesh.geometry.getAttribute('iA').array, B = stones ? null : mesh.geometry.getAttribute('iB').array, n = stones ? mesh.count : mesh.geometry.instanceCount;
      let z0 = Infinity, z1 = -Infinity;
      // (a fish of no size is not there)
      for (let i = 0; i < n; i++) { if (B && B[i * 4] === 0) continue; const z = stones ? A[i * 16 + 14] : A[i * 4 + 2]; z0 = Math.min(z0, z); z1 = Math.max(z1, z); }
      // WHAT CANNOT BE SEEN IS NOT DRAWN, two rules for every fish thing shown by the water's sight:
      // 1. THE RENDERER'S OWN, AND OF THE LENS, not of the place: what lies wholly outside the picture is not drawn. It
      // is the renderer's culling, which turns on where the eye looks, the same by which the far shoal's reaches behind
      // the eye are culled (the stones have it from their seats). All that is given here is what it needs: a fish thing
      // that came here without bounds gets the bounds of its own members (their homes, the stretch a burst swimmer
      // runs down, and 2.4 m round them for a body's length and its sway on station).
      // 2. OF THE PLACE, wherever the eye looks and in every camera: the boil is opaque from the air (FISH_FRAG, uBoil: a
      // drowned body nearer the face than uBoil.x is cut while more than half of the eye's picture is the air's,
      // uAbove; with the eye at the surface 0.9888 of it is, and from 2 cm over it all of it: update, 1 - ss(-0.02, 0.3, d)).
      // A fish thing all of whose members hold there, every part of each under water (its sway on station; the nose
      // or tail of a pitched body and the highest of its back and fins, both as its own body is built: REACH and FIN,
      // read from the modelled body's own points at size 1), is 'boiled': it is not drawn while the eye is over the surface
      if (!stones) {
        const C = mesh.geometry.getAttribute('iC').array, lo = [Infinity, Infinity, Infinity], hi = [-Infinity, -Infinity, -Infinity]; let top = -Infinity;
        const P = mesh.geometry.getAttribute('position'); let REACH = 0, FIN = 0; for (let i = 0; i < P.count; i++) { REACH = Math.max(REACH, Math.abs(P.getZ(i))); FIN = Math.max(FIN, P.getY(i)); }
        for (let i = 0; i < n; i++) {
          if (B[i * 4] === 0) continue;
          for (let j = 0; j < 3; j++) { const v = A[i * 4 + j]; lo[j] = Math.min(lo[j], j === 2 && B[i * 4 + 2] > 0 ? v - B[i * 4 + 3] : v); hi[j] = Math.max(hi[j], v); }
          top = Math.max(top, A[i * 4 + 1] + 0.14 * C[i * 4 + 3] + B[i * 4] * (REACH * Math.abs(Math.sin(C[i * 4 + 1])) + FIN));
        }
        if (lo[2] <= hi[2] && !mesh.geometry.boundingSphere) { mesh.geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3((lo[0] + hi[0]) / 2, (lo[1] + hi[1]) / 2, (lo[2] + hi[2]) / 2), Math.hypot(hi[0] - lo[0], hi[1] - lo[1], hi[2] - lo[2]) / 2 + 2.4); mesh.frustumCulled = true; }
        mesh.userData.boiled = top < 0 && hi[2] + 2.4 < mesh.material.uniforms.uBoil.value.x;
      }
      // (a fish thing gets a material of its own, made as the one it has is made: the same program with a uGrow of its own; a stone thing has its own from propMat.
      // A fish thing whose material already carries a uGrow of its own, one that is not the river's shared fishU.uGrow object, keeps that material)
      if (!stones && mesh.material.uniforms.uGrow === fishU.uGrow) { const o = mesh.material; mesh.material = new THREE.ShaderMaterial({ uniforms: { ...o.uniforms, uGrow: { value: 0 } }, vertexShader: o.vertexShader, fragmentShader: o.fragmentShader, fog: o.fog, vertexColors: o.vertexColors, side: o.side }); }
      mesh.userData.sight = [z0, z1]; byZ.push(mesh);
    };
    // THE ENTRY REACH, by the design: nothing within ENTRY_IN metres of the first frame; level and straight to 0.125 of
    // the route's length (ENTRY_END, in metres of the route)
    const ENTRY_IN = 15, ENTRY_END = 0.125 * L;
    const nearPts = [];
    // the nearest any part of a fish's body comes to the route: five points along its axis, less its half width
    const bodyClear = (x, y, z, size, yaw) => { let d = 1e9; for (let k = -2; k <= 2; k++) { const a = k * 0.5 * size; d = Math.min(d, path.distanceTo(x - Math.sin(yaw) * a, y, z - Math.cos(yaw) * a)); } return d - 0.17 * size; };
    const hushAll = async (pts, r) => {
      for (const m of fishMeshes) {
        if (m.name.startsWith('shoal-far')) continue;
        const A = m.geometry.getAttribute('iA').array, B = m.geometry.getAttribute('iB'), n = m.geometry.instanceCount; let ch = false;
        for (let i = 0; i < n; i++) { const ax = A[i * 4], ay = A[i * 4 + 1], az = A[i * 4 + 2]; for (const q of pts) { if (Math.abs(az - q[2]) < r && Math.abs(ax - q[0]) < r && Math.hypot(ax - q[0], ay - q[1], az - q[2]) < r) { B.array[i * 4] = 0; ch = true; break; } } }
        if (ch) B.needsUpdate = true;
        await ctx.yield();
      }
    };
    {
      const spans = [[0.04, 0.125, 18], [beats.arc3 + 0.035, beats.missBreak - 0.01, 18], [beats.missFall + 0.01, beats.tailUp - 0.02, 10], [beats.slantTo + 0.02, beats.leapBreak - 0.008, 7], [beats.splash + 0.006, beats.surface - 0.004, 4], [beats.slantTo + 0.03, beats.leapBreak - 0.006, 9, rng.fork('dive')]];
      const p = new THREE.Vector3(), t = new THREE.Vector3();
      for (const [u0, u1, n, rr = rng] of spans) {
        const iA = new Float32Array(n * 4), iB = new Float32Array(n * 4), iC = new Float32Array(n * 4); let c = 0;
        for (let tries = 0; c < n && tries < 400; tries++) {
          if ((tries & 15) === 15) await ctx.yield();
          const u = rr.range(u0, u1); path.pointAt(u, p); path.tangentAt(u, t);
          const side = rr.sign() * rr.range(2.7, 5.2), x = p.x - t.z * side, z = p.z + t.x * side, y = p.y + rr.range(-1.5, 0.5);
          if (edgeD(x, z) > -4 || y > waterAt(z) - 0.45 || y < bedWas(x, z) + 0.45 || path.distanceTo(x, y, z) < 2.6 || (z < 9.7 && z > -47.5 && (Math.abs(x - lx) > 6 || y < 4.45)) || (z < 14.5 && z >= 9.7 && y < -6.2)) continue;
          iA[c * 4] = x; iA[c * 4 + 1] = y; iA[c * 4 + 2] = z; iA[c * 4 + 3] = rr();
          iB[c * 4] = rr.range(0.9, 1.15) * (z < 90 && z > 15 && inSight(x, z) ? 0 : 1); iB[c * 4 + 1] = rr.range(-0.2, 0.2); iB[c * 4 + 2] = 0; iB[c * 4 + 3] = 1;
          iC[c * 4] = rr(); iC[c * 4 + 1] = rr.range(-0.06, 0.06); iC[c * 4 + 2] = rr.range(5, 8); iC[c * 4 + 3] = 0.6;
          c++;
        }
        const mesh = new THREE.Mesh(instancedGeo(geoNear, c, { iA, iB, iC }), fishMat); mesh.name = 'neighbours'; mesh.frustumCulled = false; mesh.userData.ur = [u0 - (u0 > 0.6 ? 0.02 : 0.006), u1 + 0.07];
        // (the entry's and the pool's stay out: those reaches are full of the shoal and the companions, and the pool bear's sight line is clear)
        if (u0 > 0.4) { scene.add(mesh); byU.push(mesh); fishCount += c; }
        // (the spans that line keeps out are shown too, every reach having its neighbours: each by the water's sight, from its own fish)
        // (a fish of no size is not there, and is not drawn: a thing shown here holds only its fish that have a size, in arrays
        // of its own on its own geometry, in the stations' order; the stations' arrays above are left whole for the line below.
        // fishCount counts the fish that are there, and a thing with no fish of any size is not added)
        if (!mesh.parent) {
          const g = mesh.geometry, own = { iA: [], iB: [], iC: [] };
          for (let k = 0; k < c; k++) { if (iB[k * 4] === 0) continue; for (const key in own) own[key].push(...g.getAttribute(key).array.subarray(k * 4, k * 4 + 4)); }
          const there = own.iB.length / 4;
          for (const key in own) g.setAttribute(key, new THREE.InstancedBufferAttribute(new Float32Array(own[key]), 4));
          g.instanceCount = there;
          if (there) { scene.add(mesh); bySight(mesh); fishCount += there; }
        }
        for (let k = 0; k < c; k++) nearPts.push([iA[k * 4], iA[k * 4 + 1], iA[k * 4 + 2]]);
        await ctx.yield();
      }
      // THE ENTRY REACH: a file of neighbours on either hand along all of it, one every 3.4 m of the route by turns left and
      // right, 2.65 to 3.4 m off it and about the eye's depth, noses upstream, built size; every third is a humped male
      // with the hooked jaw, teeth and green head. So there is always one coming up large beside us and another ahead.
      // (their own stream of draws)
        // (seated by metres of the route, from ENTRY_IN to ENTRY_END; shown by the water's sight)
      {
        const er = makeRng((((ctx.seed ?? 1) | 0) * 4409 + 1553) >>> 0), d0 = ENTRY_IN, d1 = ENTRY_END, n = Math.round((d1 - d0) / 3.4);
        const E = [0, 1].map(() => ({ iA: [], iB: [], iC: [] }));
        for (let k = 0; k < n; k++) {
          const male = k % 3 === 1 ? 1 : 0, sd = k % 2 ? 1 : -1;
          for (let tries = 0; tries < 14; tries++) {
            const d = d0 + (d1 - d0) * (k + er.range(0.2, 0.8)) / n; path.posAtDist(d, p); path.tangentAtDist(d, t);
            const hl = Math.hypot(t.x, t.z) || 1, side = sd * er.range(2.65, 3.4), x = p.x - t.z / hl * side, z = p.z + t.x / hl * side, y = p.y + er.range(-0.85, 0.3);
            const size = er.range(0.97, 1.15), yaw = er.range(-0.12, 0.12), ph = er(), tint = er(), pitch = er.range(-0.05, 0.05), beat = er.range(5, 7.5);
            // (a male swings a quarter of a radian either way as it looks about, so that its hooked jaw shows in
            // profile to the eye behind it: it keeps its 2.6 m from the route at both ends of the swing)
            if (y > waterAt(z) - 0.5 || y < height(x, z) + 0.45 || bodyClear(x, y, z, size, yaw) < 2.6 || (male && (bodyClear(x, y, z, size, yaw + 0.26) < 2.6 || bodyClear(x, y, z, size, yaw - 0.26) < 2.6))) continue;
            E[male].iA.push(x, y, z, ph); E[male].iB.push(size, yaw, 0, male ? 1.26 : 1); E[male].iC.push(tint, pitch, beat, 0.3);
            for (let j = -1; j <= 1; j++) nearPts.push([x - Math.sin(yaw) * j * 0.6 * size, y, z - Math.cos(yaw) * j * 0.6 * size]);
            break;
          }
        }
        await ctx.yield();
        const geoMale = salmonGeometry(PALETTE, look.season, 12, 2, { male: 1.7 });
        await ctx.yield();
        for (let m = 0; m < 2; m++) {
          const c = E[m].iA.length / 4; if (!c) continue;
          const mesh = new THREE.Mesh(instancedGeo(m ? geoMale : geoNear, c, { iA: E[m].iA, iB: E[m].iB, iC: E[m].iC }), fishMat);
          mesh.name = m ? 'entry-males' : 'entry-file'; mesh.frustumCulled = false; scene.add(mesh); bySight(mesh); fishCount += c;
        }
        await ctx.yield();
      }
      // after the neighbours are placed, shoal fish lying within 1.15 m of one are taken out
      await hushAll(nearPts, 1.15);
    }
    // the queue under the falls: sockeye holding in the boil at the foot of the leap line, noses up at the white ceiling
    {
      // (two meshes: the ones within 5.5 m of our line keep the full fish, the rest are the 214-triangle one; the count no longer grows with density over 1)
      const qr = rng.fork('queue'), n = Math.round(58 * Math.min(density, 1)), Q = [0, 1].map(() => ({ iA: new Float32Array(n * 4), iB: new Float32Array(n * 4), iC: new Float32Array(n * 4), c: 0 })); let c = 0;
      for (let tries = 0; c < n && tries < 600; tries++) {
        if ((tries & 31) === 31) await ctx.yield();
        const x = lx + qr.range(-10, 7), z = qr.range(10.3, 17.5), y = qr.range(-5.4, -0.95), dq = path.distanceTo(x, y, z);
        if (dq < 2.6) continue;
        const q = Q[dq < 5.5 ? 0 : 1];
        q.iA.set([x, y, z, qr()], q.c * 4); q.iB.set([qr.range(0.9, 1.15), qr.range(-0.4, 0.4), 0, 1], q.c * 4); q.iC.set([qr(), qr.range(0.3, 0.95), qr.range(6, 9), 0.5], q.c * 4); q.c++; c++;
      }
      for (let t = 0; t < 2; t++) {
        const q = Q[t]; if (!q.c) continue;
        const mesh = new THREE.Mesh(instancedGeo(t ? geoLod : geoNear, q.c, { iA: q.iA, iB: q.iB, iC: q.iC }), fishMat); mesh.name = t ? 'queue-far' : 'queue'; mesh.frustumCulled = false; mesh.userData.ur = [beats.slantTo + 0.014, beats.leapBreak + 0.0015]; scene.add(mesh); byU.push(mesh);
      }
      fishCount += c;
      await ctx.yield();
    }
    // under the boil after the miss: sockeye holding between us and the bubble wall, noses to the falls and a little up,
    // seen side-on against its white as we are swept along it
    {
      const br = makeRng((((ctx.seed ?? 1) | 0) * 5021 + 17) >>> 0), n = Math.round(13 * Math.min(density, 1)), iA = new Float32Array(n * 4), iB = new Float32Array(n * 4), iC = new Float32Array(n * 4); let c = 0;
      for (let tries = 0; c < n && tries < 300; tries++) {
        const x = fx + br.range(10.5, 31), z = 9.9 + br() * Math.min(5.5, 0.42 * (x - fx - 8.5)), y = br.range(-4.6, -1.5), ph = br(), size = br.range(0.9, 1.15), yaw = br.range(-0.35, 0.35), tint = br(), pitch = br.range(0.08, 0.55), beat = br.range(6, 9);
        if (path.distanceTo(x, y, z) < 2.9) continue;
        iA.set([x, y, z, ph], c * 4); iB.set([size, yaw, 0, 1], c * 4); iC.set([tint, pitch, beat, 0.5], c * 4); c++;
      }
      await ctx.yield();
      const mesh = new THREE.Mesh(instancedGeo(geoNear, c, { iA, iB, iC }), fishMat); mesh.name = 'boilHolders'; mesh.frustumCulled = false; mesh.userData.ur = [beats.missFall - 0.002, beats.tailUp - 0.02]; scene.add(mesh); byU.push(mesh); fishCount += c;
      await ctx.yield();
    }
    // the eight companions: formation offsets (metres ahead, to the right, below the eye)
    const COMP = [[7, -3.0, -0.62], [7.4, 3.1, -0.66], [3.7, -2.45, -0.72], [3.9, 2.5, -0.75], [11.5, -5.2, -0.8], [11, 5.4, -0.86], [15.5, -3.4, -0.7], [16, 3.8, -0.74]];
    // One formation for the whole flight: the flankers ride 2.5 m to each side and a little below (their backs, fins and
    // beating tails rock in the lower corners); before the dive for the leap the two leaders ride a little further ahead
    // and deeper (COMP_A) and close up for the leap.
    const COMP_A = [[7.7, -2.7, -0.82], [8.1, 2.8, -0.86]];
    const compA = new Float32Array(32), compB = new Float32Array(32), compC = new Float32Array(32);
    for (let i = 0; i < 8; i++) { compA[i * 4 + 3] = rng(); compB[i * 4] = rng.range(0.95, 1.12); compB[i * 4 + 3] = 1; compC[i * 4] = rng(); compC[i * 4 + 2] = rng.range(8.5, 10.5); }
    const geoComp = salmonGeometry(PALETTE, look.season, 16);                   // seen from a metre behind with their backs awash: a rounder back
    await ctx.yield();
    const compGeo = instancedGeo(geoComp, 8, { iA: compA, iB: compB, iC: compC });
    compGeo.getAttribute('iA').setUsage(THREE.DynamicDrawUsage); compGeo.getAttribute('iB').setUsage(THREE.DynamicDrawUsage); compGeo.getAttribute('iC').setUsage(THREE.DynamicDrawUsage);
    const compMesh = new THREE.Mesh(compGeo, fishMat); compMesh.name = 'companions'; compMesh.frustumCulled = false; scene.add(compMesh);
    await ctx.yield();
    // fish holding under the face where the route swings along the lip, noses to the falls and backs awash: a near file
    // 3 to 4.5 m on the falls' side of us, one every 3 m (they pass through the bottom corners of the frame while we
    // look at the lip), and a looser lot beyond, out to the edge of the boil
    const awashPts = [];      // where a fish holds with its back awash on the lower river: [x, z]
    {
      const uA = beats.shoal + 0.035, uB = beats.slantTo - 0.012, p = new THREE.Vector3(), La = (uB - uA) * L;
      // (the shoal's own drowned bodies are not drawn from the air within 24 m of the face, where the boil is opaque; these lie beyond the boil and keep theirs)
      const holdMat = new THREE.ShaderMaterial({ uniforms: { ...fishU, uBoil: { value: new THREE.Vector4(5, 11, 0.55, 0.6) } }, vertexShader: FISH_VERT, fragmentShader: FISH_FRAG, fog: true, vertexColors: true, side: THREE.DoubleSide });
      const nN = Math.max(6, Math.round(La / 3.0)), nF = Math.round(9 * density);
      for (const [near, n, geo] of [[true, nN, geoComp], [false, nF, geoMid]]) {
        const iA = new Float32Array(n * 4), iB = new Float32Array(n * 4), iC = new Float32Array(n * 4); let c = 0;
        for (let k = 0; k < n; k++) {
          const u = near ? uA + (uB - uA) * (k + 0.2 + 0.6 * zr()) / n : zr.range(uA, uB); path.pointAt(u, p);
          const off = near ? zr.range(2.9, 3.9) : zr.range(5.8, 11.5), size = near ? zr.range(1.0, 1.15) : zr.range(0.9, 1.15), x = p.x + zr.range(-1, 1) * (near ? 0.5 : 2.5), z = p.z - off, y = (near ? 0.13 : 0.03) - 0.37 * size, ph = zr(), tint = zr(), yaw = near ? (k % 2 ? 1 : -1) * zr.range(0.4, 0.75) : zr.range(-0.28, 0.28), beat = zr.range(5, 7.5);
          if (z < 12.5 || z > 40 || Math.abs(x) > 60 || path.distanceTo(x, y, z) < 2.9) continue;
          iA.set([x, y, z, ph], c * 4); iB.set([size, yaw, 0, 1], c * 4); iC.set([tint, 0.03, beat, 0.32], c * 4); c++; awashPts.push([x, z]);
        }
        const mesh = new THREE.Mesh(instancedGeo(geo, c, { iA, iB, iC }), holdMat); mesh.name = near ? 'holders' : 'holders-far'; mesh.frustumCulled = false; mesh.userData.ur = [beats.shoal - 0.01, beats.leapBreak - 0.01]; scene.add(mesh); byU.push(mesh); fishCount += c;
        await ctx.yield();
      }
      // above the falls: the ones that made it hold in the glide with their backs awash, a loose crowd on both sides of
      // our line from the landing on, thinning towards the portal (their own stream of draws: nothing else moves)
      {
        const hr = makeRng((((ctx.seed ?? 1) | 0) * 6151 + 4409) >>> 0), n = Math.round(84 * Math.min(density, 1)), u0 = beats.splash + 0.002, u1 = 0.9;
        const iA = new Float32Array(n * 4), iB = new Float32Array(n * 4), iC = new Float32Array(n * 4); let c = 0;
        for (let k = 0; k < n * 3 && c < n; k++) {
          const u = u0 + (u1 - u0) * Math.pow(hr(), 1.7); path.pointAt(u, p);
          const off = (hr() < 0.5 ? -1 : 1) * (6.2 + 9 * Math.pow(hr(), 1.4)), size = hr.range(0.9, 1.15), x = p.x + off, z = p.z + hr.range(-3, 3), y = LIP + 0.15 - 0.37 * size;
          const ph = hr(), tint = hr(), yaw = hr.range(-0.3, 0.3), beat = hr.range(5, 7.5);
          if (z > -11 || edgeD(x, z) > -2.2 || (z > -47.5 ? hero.rockTop(x, z) : height(x, z)) > 5.05 || path.distanceTo(x, y, z) < 5.6) continue;
          iA.set([x, y, z, ph], c * 4); iB.set([size, yaw, 0, 1], c * 4); iC.set([tint, 0.03, beat, 0.32], c * 4); c++;
        }
        const mesh = new THREE.Mesh(instancedGeo(geoMid, c, { iA, iB, iC }), holdMat); mesh.name = 'holders-upper'; mesh.frustumCulled = false; mesh.userData.ur = [beats.leapBreak, 1.01]; scene.add(mesh); byU.push(mesh); fishCount += c;
        await ctx.yield();
      }
    }
    const cP = new THREE.Vector3(), cT = new THREE.Vector3(), wakeV = surfU.uComp.value, wakeS = surfU.uCompS.value;
    const cO = [0, 0, 0];
    // NOTHING HANGS IN THE AIR. Wherever the route runs over the water, a companion is either awash (its back and fin
    // out, a wake behind it, a bow ripple and a thread of foam where it breaks the surface) or on an arc of the route's
    // own that starts and ends in the water: RIDE = the height of the route over the water below which it is a ride
    // (awash) and above which it is a leap. Where a leap leaves the water and where it meets it again a ring spreads
    // (crossD = those places along the route; SURF_FRAG uRing).
    const ROUTE_MARGIN = 4.5;
    const RIDE = [0.62, 0.98], AWASH = 0.24, crossD = [], ringV = surfU.uRing.value, compS = new Float32Array(8), compL = new Float32Array(8);
    { let was = null; const NC = Math.ceil(L / 0.3);
      for (let i = 0; i <= NC; i++) {
        const d = Math.min(i * 0.3, L); path.posAtDist(d, cP); const up = cP.y - (cP.z < -0.6 ? LIP : 0) > 0.8;
        if (was !== null && up !== was) crossD.push(d);
        was = up; if ((i & 255) === 255) await ctx.yield();
      } }
    // (compDrops: the water that streams off a companion while it is in the air, made further down with the ledge's drops)
    let compDrops = null;
    const placeCompanions = (u, time) => {
      const dist = u * L, pull = ss(beats.leapBreak - 0.055, beats.leapBreak - 0.012, u) * (1 - ss(beats.splash, beats.splash + 0.02, u));
      // the left flanker leaps low and a little late: it stays under the lip line, out of the sight line to the apex bear,
      // until the jaws have closed, then rises beside us for the apex
      const duck = ss(beats.leapBreak - 0.03, beats.leapBreak - 0.005, u) * (1 - ss(beats.snap + 0.003, beats.apex - 0.001, u));
      // on the calm upper river all eight keep their berths beside us, backs awash and wakes behind them, to the portal;
      // the two leaders close in a little to ride either side of the portal's reflection
      const sf = beats.surface, close = ss(sf + 0.03, sf + 0.085, u);
      const early = 1 - ss(beats.slantTo - 0.035, beats.slantTo - 0.005, u);
      const tq = tAt(u), dkV = surfU.uDuck.value, dkL = surfU.uDuckL.value;
      for (let i = 0; i < 8; i++) {
        const oo = COMP[i], ph = compA[i * 4 + 3] * 6.283, ek = i < 2 ? early : 0;
        cO[0] = i < 2 ? lerp(oo[0], COMP_A[i][0], ek) : oo[0]; cO[1] = i < 2 ? lerp(oo[1], COMP_A[i][1], ek) : oo[1]; cO[2] = i < 2 ? lerp(oo[2], COMP_A[i][2], ek) : oo[2];
        const o = cO;
        let ahead = lerp(o[0] + Math.sin(time * 0.31 + ph) * 0.5, -6 - i * 0.7, o[1] < 0 && i !== 2 ? pull : 0) - (i === 2 ? 1.3 * duck : 0);
        if (i < 2) ahead = lerp(ahead, 5.4 + 0.5 * i, close);     // the left flanker stays: two leaders in the air beside us at the apex
        path.posAtDist(Math.max(dist + ahead, 0), cP); path.tangentAtDist(Math.max(dist + ahead, 0), cT);
        const lat0 = (o[1] + Math.sin(time * 0.43 + ph * 2) * 0.22) * (i < 2 ? lerp(1, 0.56, close) : 1);
        // no companion rides over a bar: where the bed at its place lies within 0.8 m of the surface it closes in on
        // the route (to two fifths of its berth at most) until it has water under it
        const h = Math.hypot(cT.x, cT.z) || 1, sYr = cP.z < -0.6 ? LIP : 0;
        const dry = (k) => { const zz = cP.z + (cT.x / h) * lat0 * k; return (zz > 14.5 || zz < -47) && height(cP.x - (cT.z / h) * lat0 * k, zz) > sYr - 0.8; };
        let latK = 1;
        if (dry(1)) { let lo = 0.4, hi = 1; for (let k = 0; k < 6; k++) { const mid = (lo + hi) * 0.5; if (dry(mid)) hi = mid; else lo = mid; } latK = lo; }
        const lat = lat0 * latK, x = cP.x - (cT.z / h) * lat, z = cP.z + (cT.x / h) * lat;
        let y = cP.y + o[2] + Math.sin(time * 0.6 + ph * 3) * 0.08 - (i === 2 ? 1.9 * duck : 0);
        // (a salmon sounds under a bird on the water: within 2.6 m of a merganser, afloat or pattering away, it goes down
        // a metre and a half and comes up again behind it; a bird that has lifted is no matter to it)
        if (z < -30) {
          let sound = 0;
          for (let k = 0; k < 8; k++) { const dk = dkV[k], sd = Math.max(tq - dk.z, 0), run = 2.5 * sd + 1.6 * sd * sd; if (run < dkL[k]) sound = Math.max(sound, ss(2.6, 1.5, Math.hypot(dk.x + Math.sin(dk.w) * run - x, dk.y + Math.cos(dk.w) * run - z))); }
          y -= 1.5 * sound;
        }
        // (the water's own level at its place: the upper river is drawn down toward the lip, the pool sags under the boil)
        const sY0 = z < -0.6 ? (z > -12 ? hero.surfaceAt(x, z) : LIP) - 0.03 : -0.78 * Math.exp(-Math.max(z, 0) / 6.5) * ss(-0.6, 1.5, z), hp = cP.y - sY0, arcK = ss(RIDE[0], RIDE[1], hp);
        // (awash: its back a hand's breadth and a half, AWASH = 0.24 m, out of the water, the dorsal fin standing on it. A
        // companion that would swim within half a metre under that level rides awash; one that is sent deep, the flanker
        // ducking under the lip line, stays deep)
        const aw = sY0 + AWASH - 0.37 * compB[i * 4] + Math.sin(time * 0.6 + ph * 3) * 0.03;
        y = lerp(y >= aw ? aw : lerp(y, aw, ss(aw - 1.1, aw - 0.5, y)), y + 0.45 * arcK, arcK);
        compS[i] = Math.max(dist + ahead, 0); compL[i] = lat;
        if (z > 14.5 || z < -47) y = Math.max(y, height(x, z) + 0.5); else if (z < -6) y = Math.max(y, 4.45);
        compA[i * 4] = x; compA[i * 4 + 1] = y; compA[i * 4 + 2] = z;
        compB[i * 4 + 1] = Math.atan2(-cT.x, -cT.z) + (i === 2 ? -0.36 : i === 3 ? 0.36 : 0) * ss(0.6, 2.2, y - (z < -0.6 ? LIP : 0)); compC[i * 4 + 1] = Math.asin(clamp(cT.y, -0.95, 0.95)) * 0.9 * (hp > -0.15 ? lerp(0.3, 1, arcK) : 1);
        // its wake: only while the back is awash (not deep, not in the air) and never in the white water under the falls
        const sY = sY0, top = y + 0.37 * compB[i * 4];
        wakeV[i].set(x, z, cT.x / h, cT.z / h); wakeS[i] = ss(-0.14, 0.1, top - sY) * (1 - ss(0.25, 0.7, y - sY)) * (z > 16 || z < -4 ? 1 : 0);
        if (compDrops) {
          // in the air (on its arc, or clearing a bar too shallow to swim) the water streams off it: drops leave its flanks and tail and fall away behind; none while it rides awash
          const D = compDrops, on = y - sY0 > 0.25 ? 1 : 0, tx = cT.x / h, tz = cT.z / h, sz = compB[i * 4], PA = D.P.array, VA = D.V.array;
          for (let k = 0; k < D.ND; k++) {
            const j = i * D.ND + k, a = D.loc[j * 7] * sz, lt = D.loc[j * 7 + 1], bk = D.loc[j * 7 + 3], sd = D.loc[j * 7 + 4];
            PA[j * 4] = x + tx * a - tz * lt; PA[j * 4 + 1] = y + D.loc[j * 7 + 2]; PA[j * 4 + 2] = z + tz * a + tx * lt; PA[j * 4 + 3] = on * D.loc[j * 7 + 6];
            VA[j * 4] = -tx * bk - tz * sd; VA[j * 4 + 1] = D.loc[j * 7 + 5]; VA[j * 4 + 2] = -tz * bk + tx * sd;
          }
        }
      }
      // the ring each left where its arc last crossed the surface (none in the white water under the falls)
      for (let i = 0; i < 8; i++) {
        let c = -1; for (let k = 0; k < crossD.length && crossD[k] <= compS[i]; k++) c = crossD[k];
        const gap = compS[i] - c;
        if (c < 0 || gap > 26) { ringV[i].w = 0; continue; }
        const age = tAt(u) - tAt(u - gap / L);
        path.posAtDist(c, cP); path.tangentAtDist(c, cT);
        const h = Math.hypot(cT.x, cT.z) || 1, x = cP.x - (cT.z / h) * compL[i], z = cP.z + (cT.x / h) * compL[i];
        ringV[i].set(x, z, age, clamp(1 - age / 1.8, 0, 1) * (z > 16 || z < -4 ? 1 : 0));
      }
      if (compDrops) { compDrops.P.needsUpdate = true; compDrops.V.needsUpdate = true; }
      compGeo.getAttribute('iA').needsUpdate = true; compGeo.getAttribute('iB').needsUpdate = true; compGeo.getAttribute('iC').needsUpdate = true;
    };
    placeCompanions(0, 0);
    await ctx.yield();

    // ---- cobbles under the route (three reaches), redds as pale ovals of finer gravel
    const propMat = (grain, side = THREE.DoubleSide, fogK = 1, tone = 1, algae = 0) => new THREE.ShaderMaterial({ uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...lightU, uGrain: { value: new THREE.Vector4(grain[0], grain[1], grain[2], grain[3]) }, uFogK: { value: fogK }, uTone: { value: tone }, uAlgae: { value: algae }, uGrow: { value: 1 } },
      vertexShader: PROP_VERT, fragmentShader: PROP_FRAG, fog: true, vertexColors: true, side });
    let cobbleGeo = null, lensKeeps = null;
    const nests = [];         // every redd: { x, z, ra = half length along the current, rc = half width across it }
    {
      const geo = cobbleGeometry(nz), mat = propMat([2.2, 2.2, 0.3, 0], THREE.FrontSide);
      cobbleGeo = geo;
      const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), v = new THREE.Vector3(), s3 = new THREE.Vector3(), col = new THREE.Color(), p = new THREE.Vector3(), t = new THREE.Vector3();
      // THE LENS'S LAW FOR A STONE ON THE BED, asked of the cobbles of the reaches, of the bars and of the runs as
      // they are dealt (lensKeeps, given the matrix the stone would be set with). The bed is no body, and a stone
      // that lies low on it is the bed's own dress; a stone that stands up towards the lens is a body.
      // WHICH IT IS: the stone's top is the highest of its corners as placed. The samples near it are those of the
      // route's NS + 1, every pass of the whole flown route, that lie within its reach as a body of its seat, in
      // space (reach: the shape's farthest corner at the stone's greatest scale, GEO_R times that scale, with
      // BODY_AIR and LENS_MARGIN more; a stone whose seat lies that far from every sample in plan, by nearRoute,
      // has none and is made). If at any of them the top is higher than the sample less DRESS_UNDER, the stone is a
      // body; if at every one the top lies DRESS_UNDER or more under the sample, it is dress.
      // WHAT IT KEEPS: dress keeps LENS_AIR of clear way between its skin and the lens's place, a body BODY_AIR,
      // and each LENS_MARGIN more for the route between two samples (they lie about half a metre apart). The
      // measure is taken at each sample within the farthest corner and those two lengths of the seat, along the
      // straight line from the sample to the stone's nearest corner: the least that any corner lies along that line.
      // No point of the skin lies nearer along it than that, a face being spanned by its corners. A stone whose
      // measure is under its two lengths at any sample is not made: not sunk, not moved, not made smaller, not
      // turned. Nothing here knows where the lens looks, what the picture holds, u, or which seed this is.
      // Every draw of a stone is taken all the same, and a dealing counts it as dealt (c), so that the dealing's
      // stream runs on as it would and every other stone has the place, the size and the tone it would have; only
      // the stones made (made) are set into the mesh.
      // (the other lots of stones, those of the pool, of the falls' foot and of the tail and the nests' gravel, are
      // not asked it where they are dealt)
      const LENS_AIR = 1.0, LENS_MARGIN = 0.1, BODY_AIR = 2.0, DRESS_UNDER = 1.0;
      lensKeeps = (() => {
        const gp = geo.getAttribute('position'), nc = gp.count, W = new Float32Array(nc * 3), c3 = new THREE.Vector3(), near = new Int32Array(NS + 1); let GEO_R = 0; for (let i = 0; i < nc; i++) GEO_R = Math.max(GEO_R, Math.hypot(gp.getX(i), gp.getY(i), gp.getZ(i)));
        return (m) => {
          const el = m.elements, far = GEO_R * Math.sqrt(Math.max(el[0] * el[0] + el[1] * el[1] + el[2] * el[2], el[4] * el[4] + el[5] * el[5] + el[6] * el[6], el[8] * el[8] + el[9] * el[9] + el[10] * el[10])), reach = far + BODY_AIR + LENS_MARGIN;
          if (nearRoute(el[12], el[14]).dist >= reach) return true;
          let n = 0, top = -Infinity, body = false;
          for (let j = 0; j <= NS; j++) {
            const ax = spx[j] - el[12], ay = spy[j] - el[13], az = spz[j] - el[14]; if (ax * ax + ay * ay + az * az >= reach * reach) continue;
            if (!n) for (let i = 0; i < nc; i++) { c3.fromBufferAttribute(gp, i).applyMatrix4(m); W[i * 3] = c3.x; W[i * 3 + 1] = c3.y; W[i * 3 + 2] = c3.z; if (c3.y > top) top = c3.y; }
            near[n++] = j; if (top > spy[j] - DRESS_UNDER) body = true;
          }
          const need = (body ? BODY_AIR : LENS_AIR) + LENS_MARGIN, cut = (far + need) * (far + need);
          for (let k = 0; k < n; k++) {
            const j = near[k], ax = spx[j] - el[12], ay = spy[j] - el[13], az = spz[j] - el[14]; if (ax * ax + ay * ay + az * az >= cut) continue;
            let b2 = Infinity, ux = 0, uy = 0, uz = 0;
            for (let i = 0; i < nc; i++) { const cx = W[i * 3] - spx[j], cy = W[i * 3 + 1] - spy[j], cz = W[i * 3 + 2] - spz[j], d2 = cx * cx + cy * cy + cz * cz; if (d2 < b2) { b2 = d2; ux = cx; uy = cy; uz = cz; } }
            const bl = Math.sqrt(b2); let least = bl;
            if (bl > 0) for (let i = 0; i < nc; i++) least = Math.min(least, ((W[i * 3] - spx[j]) * ux + (W[i * 3 + 1] - spy[j]) * uy + (W[i * 3 + 2] - spz[j]) * uz) / bl);
            if (least < need) return false;
          }
          return true;
        };
      })();
      const redds = []; for (let i = 0; i < 9; i++) { const u = i < 6 ? rng.range(0.01, 0.12) : rng.range(beats.surface, 0.93); path.pointAt(u, p); redds.push([p.x + rng.range(-5, 5), p.z, rng.range(1.6, 2.6)]); }
      redds.forEach((r, i) => nests.push({ x: r[0], z: r[1], ra: r[2] * 1.48, rc: r[2], reach: i < 6 ? 'entry' : 'upper' }));
      // (the fourth lot, from a stream of its own, thickens the bed under the third riffle arc, where the eye looks down through a metre of water)
      for (const [u0, u1, n, cr = rng, spreadK = 1, sizeK = 1] of [[0.0, 0.128, 560], [0.128, beats.arc3 + 0.05, 370], [beats.splash, 0.93, 320], [0.205, beats.arc3 + 0.04, 290, yr, 0.62, 1.25]]) {
        const count = Math.round(n * (0.5 + 0.5 * detail)), mesh = new THREE.InstancedMesh(geo, mat, count); let c = 0, made = 0;
        for (let tries = 0; c < count && tries < count * 6; tries++) {
          if ((tries & 127) === 127) await ctx.yield();
          const u = cr.range(u0, u1); path.pointAt(u, p); path.tangentAt(u, t);
          const wide = u0 === 0 ? 1.6 : 1, side = clamp(cr.gauss() * 4.6 * wide * spreadK, -13 * wide, 13 * wide), x = p.x - t.z * side + cr.range(-1, 1), z = p.z + t.x * side + cr.range(-3, 3);
          if (z < 15 && z > -3) continue;
          const y = z <= -3 && z > -47 ? hero.rockTop(x, z) : height(x, z); if ((z > 80 && z < 100 ? bedWas(x, z) : y) > waterAt(z) - 0.5) continue;
          let rd = 0; for (const r of redds) rd = Math.max(rd, 1 - ((x - r[0]) ** 2 / (r[2] * r[2]) + (z - r[1]) ** 2 / (r[2] * r[2] * 2.2)));
          const redd = ss(0, 0.3, rd), s = (0.2 + 0.46 * cr() * cr()) * sizeK * lerp(1, 0.5, redd) * (1 + 1.5 * ss(-5, -12, y));
          e.set(cr.range(-0.2, 0.2), cr() * 6.283, cr.range(-0.2, 0.2)); q.setFromEuler(e);
          v.set(x, y - 0.12 * s, z); s3.set(s * cr.range(0.8, 1.35), s * cr.range(0.7, 1.15), s * cr.range(0.8, 1.2));
          m4.compose(v, q, s3);
          const k = cr.range(0.7, 1.15) * lerp(1, 1.4, redd), w = cr.range(-0.06, 0.06);
          if (lensKeeps(m4)) { mesh.setMatrixAt(made, m4); mesh.setColorAt(made, col.setRGB(k * (1 + w), k, k * (1 - w))); made++; }
          c++;
        }
        mesh.count = made; mesh.instanceMatrix.needsUpdate = true; if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
        mesh.name = 'cobbles'; mesh.userData.ur = [u0 - 0.1, u1 + 0.12]; scene.add(mesh); byU.push(mesh);
        await ctx.yield();
      }
      // THE BARS: cobbles thick where the bed lies near the surface, an added lot from a stream of its own. Dealt by metres
      // along the route from the end of the entry reach (ENTRY_END) to the foot of the falls (dFoot: where the route first
      // comes to z 15, the edge of the apron, which the lots above keep clear too), spread to either side as they are, and
      // kept by the depth of water over the bed with the spit laid whole (bedWas): none where it is under half a metre,
      // every one where it is from half a metre to a metre and a half, one in five where it is
      // three metres and more. Scattered cobbles, not a pavement: one stone to five square metres of bed (BAR_PER_M2) across
      // the breadth the spread itself has (BAR_WIDE, the breadth of its bell: 4.6 m times the root of two pi), 1.2 times the
      // others' size. Shown by the water's sight.
      {
        const kr = own('barCobbles'), BAR_PER_M2 = 0.2, BAR_WIDE = 4.6 * Math.sqrt(2 * Math.PI); let dFoot = ENTRY_END; while (dFoot < path.length && path.posAtDist(dFoot, p).z > 15) dFoot += 1;
        // (a material of their own, made as the shared one is: their uGrow must not shrink the other lots)
        const count = Math.round(BAR_PER_M2 * BAR_WIDE * (dFoot - ENTRY_END) * (0.5 + 0.5 * detail)), mesh = new THREE.InstancedMesh(geo, propMat([2.2, 2.2, 0.3, 0], THREE.FrontSide), count); let c = 0, made = 0;
        for (let tries = 0; c < count && tries < count * 6; tries++) {
          if ((tries & 127) === 127) await ctx.yield();
          const d = kr.range(ENTRY_END, dFoot); path.posAtDist(d, p); path.tangentAtDist(d, t);
          const side = clamp(kr.gauss() * 4.6, -13, 13), x = p.x - t.z * side + kr.range(-1, 1), z = p.z + t.x * side + kr.range(-3, 3);
          if (z < 15) continue;
          const y = height(x, z), yw = z > 80 && z < 100 ? bedWas(x, z) : y; if (yw > waterAt(z) - 0.5) continue;
          if (kr() > 0.2 + 0.8 * ss(3.0, 1.5, waterAt(z) - yw)) continue;
          let rd = 0; for (const r of redds) rd = Math.max(rd, 1 - ((x - r[0]) ** 2 / (r[2] * r[2]) + (z - r[1]) ** 2 / (r[2] * r[2] * 2.2)));
          const redd = ss(0, 0.3, rd), s = (0.2 + 0.46 * kr() * kr()) * 1.2 * lerp(1, 0.5, redd) * (1 + 1.5 * ss(-5, -12, y));
          e.set(kr.range(-0.2, 0.2), kr() * 6.283, kr.range(-0.2, 0.2)); q.setFromEuler(e);
          v.set(x, y - 0.12 * s, z); s3.set(s * kr.range(0.8, 1.35), s * kr.range(0.7, 1.15), s * kr.range(0.8, 1.2));
          m4.compose(v, q, s3);
          const k = kr.range(0.7, 1.15) * lerp(1, 1.4, redd), w = kr.range(-0.06, 0.06);
          if (lensKeeps(m4)) { mesh.setMatrixAt(made, m4); mesh.setColorAt(made, col.setRGB(k * (1 + w), k, k * (1 - w))); made++; }
          c++;
        }
        mesh.count = made; mesh.instanceMatrix.needsUpdate = true; if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
        mesh.name = 'cobbles-bars'; scene.add(mesh); bySight(mesh);
        await ctx.yield();
      }
      // the pool: stones on the pool bear's shelf (whose slope fills the lower half of the frame as we pass it) and on
      // the bed beside the route, from a stream of their own
      {
        const pr = makeRng((((ctx.seed ?? 1) | 0) * 3571 + 1289) >>> 0), count = Math.round(320 * (0.5 + 0.5 * detail)), mesh = new THREE.InstancedMesh(geo, mat, count); let c = 0;
        for (let tries = 0; c < count && tries < count * 5; tries++) {
          if ((tries & 63) === 63) await ctx.yield();
          let x, z;
          if (tries % 3) { const a = pr() * 6.283, r = 12.5 * Math.sqrt(pr()); x = shelf.x + Math.cos(a) * r; z = shelf.z + Math.sin(a) * r; }
          else { z = pr.range(20, 72); x = fx + 1.5 + clamp(pr.gauss() * 5, -11, 12); }
          const y = height(x, z); if (y > -0.8 || z < 15.5 || path.distanceTo(x, y + 0.3, z) < 1.5) continue;
          const sz = (0.2 + 0.36 * pr() * pr()) * (1 + 0.8 * ss(-4.5, -6.5, y));
          e.set(pr.range(-0.2, 0.2), pr() * 6.283, pr.range(-0.2, 0.2)); q.setFromEuler(e);
          v.set(x, y - 0.12 * sz, z); s3.set(sz * pr.range(0.8, 1.35), sz * pr.range(0.7, 1.15), sz * pr.range(0.8, 1.2));
          mesh.setMatrixAt(c, m4.compose(v, q, s3));
          const k = pr.range(0.62, 1.02), w = pr.range(-0.02, 0.1);
          mesh.setColorAt(c, col.setRGB(k * (1 + w), k, k * (1 - 1.6 * w))); c++;
        }
        mesh.count = c; mesh.instanceMatrix.needsUpdate = true; if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
        mesh.name = 'cobbles-pool'; mesh.userData.ur = [beats.arc3 + 0.012, beats.tailUp + 0.012]; scene.add(mesh); byU.push(mesh);
        await ctx.yield();
      }
      // the foot of the falls: dark boulders on the ledge's apron under the bubble wall, where we are swept along it after
      // the miss (the apron was a smooth slab there, ending in a straight edge at z 14), with smaller stones between them.
      // ONE MARGIN for whatever stands in the water at the foot of the falls, the boulders here, the plunging columns and
      // the lesser tongues of falling water further down: none within ROUTE_MARGIN metres of the route's line, counted
      // from the thing's own surface (the small stones and the gravel lie on the bed and keep their own clearance)
      {
        // (their own material from the same program: they take half the water's haze, so that they stay dark under the white)
        const ar = makeRng((((ctx.seed ?? 1) | 0) * 7919 + 311) >>> 0), bgeo = boulderGeometry(nz), nB = 60, nS = 150, darkMat = propMat([2.2, 2.2, 0.34, 0], THREE.FrontSide, 0.5, 0.8);
        const big = new THREE.InstancedMesh(bgeo, darkMat, nB), small = new THREE.InstancedMesh(geo, darkMat, nS);
        const floorAt = (x, z) => (z < 13.6 ? -7 + 0.25 * nz.fbm2(x * 0.1, z * 0.1 + 31, 2) : Math.max(height(x, z), -7.2));
        for (const [mesh, count, lo, hi, z0, z1] of [[big, nB, 0.3, 0.7, 9, 15.6], [small, nS, 0.14, 0.3, 8.5, 16.5]]) {
          let c = 0;
          for (let tries = 0; c < count && tries < count * 6; tries++) {
            // (three in five of the small ones lie along the edge of the apron at z 14, where it meets the pool's bed)
            const x = fx + ar.range(mesh === big ? 8 : 5, mesh === big ? 32 : 35), z = mesh !== big && ar() < 0.6 ? ar.range(13.2, 15.2) : ar.range(z0, z1), sz = lerp(lo, hi, ar() * ar()), y = floorAt(x, z);
            if (path.distanceTo(x, y + 0.5 * sz, z) < (mesh === big ? ROUTE_MARGIN : 1.4) + sz) continue;
            e.set(ar.range(-0.25, 0.25), ar() * 6.283, ar.range(-0.25, 0.25)); q.setFromEuler(e);
            v.set(x, y - 0.2 * sz, z); s3.set(sz * ar.range(0.85, 1.4), sz * ar.range(0.75, 1.2), sz * ar.range(0.85, 1.25));
            mesh.setMatrixAt(c, m4.compose(v, q, s3));
            const k = mesh === big ? ar.range(0.5, 0.85) : ar.range(0.22, 0.45), w = ar.range(-0.03, 0.06);
            mesh.setColorAt(c, col.setRGB(k * (1 + w), k, k * (1 - w))); c++;
          }
          mesh.count = c; mesh.instanceMatrix.needsUpdate = true; if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
          mesh.name = mesh === big ? 'boulders-foot' : 'cobbles-foot'; mesh.userData.ur = [beats.missTop - 0.01, beats.tailUp - 0.01]; scene.add(mesh); byU.push(mesh);
          await ctx.yield();
        }
      }
      // fine gravel on the apron along the foot of the falls, the whole stretch the sweep passes (the boulders' span):
      // small rounded stones in the tones of the bed, the grain between the boulders at 3 to 6 m, none on the route.
      // A stream of their own.
      {
        const vr = makeRng((((ctx.seed ?? 1) | 0) * 2843 + 977) >>> 0), nG = Math.round(560 * (0.5 + 0.5 * detail));
        const tongueAt = (x, z) => 0.5 + 0.28 * Math.sin(x * 0.52 + 1.2 * Math.sin(z * 0.19 + 1)) + 0.22 * Math.sin(x * 1.23 - z * 0.11 + 2.4 * Math.sin(x * 0.2));
        const gm = new THREE.InstancedMesh(geo, propMat([2.2, 2.2, 0.3, 0], THREE.FrontSide, 0.5, 0.85), nG); let c = 0;
        for (let tries = 0; c < nG && tries < nG * 4; tries++) {
          if ((tries & 127) === 127) await ctx.yield();
          // (sorted by the current in tongues that run out from the face, the same tongues the apron's own pebbles are
          // drawn in: cobbles in one, gravel in the next, pale sand grains in the slack between)
          const x = fx + vr.range(5, 35), z = vr.range(8.6, 15.4), tg = tongueAt(x, z), cobK = ss(0.52, 0.6, tg), sandK = 1 - ss(0.36, 0.44, tg);
          const sz = lerp(lerp(0.07 + 0.1 * vr() * vr(), 0.17 + 0.2 * vr(), cobK), 0.03 + 0.035 * vr(), sandK), y = z < 13.6 ? -7 + 0.25 * nz.fbm2(x * 0.1, z * 0.1 + 31, 2) : Math.max(height(x, z), -7.2);
          const k = lerp(vr.range(0.5, 1.15) * (vr() < 0.3 ? 0.62 : 1), vr.range(1.0, 1.3), sandK), w = vr.range(-0.04, 0.08);
          e.set(vr.range(-0.3, 0.3), vr() * 6.283, vr.range(-0.3, 0.3)); q.setFromEuler(e);
          v.set(x, y - 0.1 * sz, z); s3.set(sz * vr.range(0.8, 1.5), sz * vr.range(0.7, 1.1), sz * vr.range(0.8, 1.3));
          if (path.distanceTo(x, y + 0.2, z) < 1.3) continue;
          gm.setMatrixAt(c, m4.compose(v, q, s3));
          gm.setColorAt(c, col.setRGB(k * (1 + w), k, k * (1 - w))); c++;
        }
        gm.count = c; gm.instanceMatrix.needsUpdate = true; if (gm.instanceColor) gm.instanceColor.needsUpdate = true;
        gm.name = 'gravel-foot'; scene.add(gm); bySight(gm);
        await ctx.yield();
      }
      // the tail of the pool: stones under the route where the bed shoals towards the wolf's bar, and one redd beside
      // it, a pale oval of small clean gravel (a stream of their own)
      {
        const tr = makeRng((((ctx.seed ?? 1) | 0) * 4621 + 2203) >>> 0), nR = 200, nG = 90, mesh = new THREE.InstancedMesh(geo, mat, nR + nG); let c = 0;
        // (the redd lies as far up the shoaling tail as the bed is still under 0.9 m of water)
        let ca = 1, sa = 0, rx = 0, rz = 0; const ry0 = 1.7, ry1 = 3.2;
        for (let k = 0; k < 12; k++) {
          const u = beats.tailUp + 0.006 - k * 0.003; path.pointAt(u, p); path.tangentAt(u, t);
          const tl = Math.hypot(t.x, t.z) || 1; ca = t.x / tl; sa = t.z / tl; rx = p.x - sa * 2.3; rz = p.z + ca * 2.3;
          if (height(rx, rz) < -0.9) break;
        }
        ca = 0; sa = 1;                 // (the nest itself lies along the current, whichever way the route runs past it)
        nests.push({ x: rx, z: rz, ra: ry1, rc: ry0, reach: 'tail' });
        for (let tries = 0; c < nR && tries < nR * 6; tries++) {
          if ((tries & 127) === 127) await ctx.yield();
          const u = tr.range(beats.tailUp - 0.06, beats.tailUp + 0.02); path.pointAt(u, p); path.tangentAt(u, t);
          const side = clamp(tr.gauss() * 4.4, -12, 12), x = p.x - t.z * side + tr.range(-1, 1), z = p.z + t.x * side + tr.range(-2, 2), y = height(x, z), yw = z > 80 ? bedWas(x, z) : y;
          if (yw > -0.55 || z < 15.5 || path.distanceTo(x, yw + 0.3, z) < 1.2) continue;
          const dx = x - rx, dz = z - rz, al = (dx * ca + dz * sa) / ry1, ac = (-dx * sa + dz * ca) / ry0; if (al * al + ac * ac < 1.15) continue;
          const sz = (0.2 + 0.4 * tr() * tr()) * (1 + 0.6 * ss(-3, -6, y));
          e.set(tr.range(-0.2, 0.2), tr() * 6.283, tr.range(-0.2, 0.2)); q.setFromEuler(e);
          v.set(x, y - 0.12 * sz, z); s3.set(sz * tr.range(0.8, 1.35), sz * tr.range(0.7, 1.15), sz * tr.range(0.8, 1.2));
          mesh.setMatrixAt(c, m4.compose(v, q, s3));
          const k = tr.range(0.5, 0.92), w = tr.range(-0.02, 0.1);
          mesh.setColorAt(c, col.setRGB(k * (1 + w), k, k * (1 - 1.6 * w))); c++;
        }
        const c0 = c;
        for (let tries = 0; c < c0 + nG && tries < nG * 4; tries++) {
          const a = tr() * 6.283, r = Math.sqrt(tr()), al = Math.cos(a) * r * ry1, ac = Math.sin(a) * r * ry0, x = rx + al * ca - ac * sa, z = rz + al * sa + ac * ca, y = height(x, z);
          if (y > -0.45) continue;
          const sz = tr.range(0.1, 0.19);
          e.set(tr.range(-0.2, 0.2), tr() * 6.283, tr.range(-0.2, 0.2)); q.setFromEuler(e);
          v.set(x, y - 0.1 * sz, z); s3.set(sz * tr.range(0.9, 1.4), sz * tr.range(0.6, 0.9), sz * tr.range(0.9, 1.3));
          mesh.setMatrixAt(c, m4.compose(v, q, s3));
          const k = tr.range(1.25, 1.6), w = tr.range(0.0, 0.06);
          mesh.setColorAt(c, col.setRGB(k * (1 + w), k, k * (1 - w))); c++;
        }
        mesh.count = c; mesh.instanceMatrix.needsUpdate = true; if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
        mesh.name = 'cobbles-tail'; mesh.userData.ur = [beats.tailUp - 0.085, beats.tailUp + 0.05]; scene.add(mesh); byU.push(mesh);
        await ctx.yield();
      }
    }

    // ---- bubbles and puffs (BUB_VERT): one mesh for each place they rise from
    const bubU = [];
    const mkBubbles = (items, kind, tint, top, name) => {
      const n = items.length, iP = new Float32Array(n * 4), iV = new Float32Array(n * 4), iL = new Float32Array(n * 4);
      for (let i = 0; i < n; i++) { iP.set(items[i].p, i * 4); iV.set(items[i].v, i * 4); iL.set(items[i].l, i * 4); }
      const g = new THREE.InstancedBufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3)); g.setIndex([0, 1, 2, 0, 2, 3]);
      g.setAttribute('iP', new THREE.InstancedBufferAttribute(iP, 4)); g.setAttribute('iV', new THREE.InstancedBufferAttribute(iV, 4)); g.setAttribute('iL', new THREE.InstancedBufferAttribute(iL, 4)); g.instanceCount = n;
      const U = { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), uTime: HU.uTime, uVH: { value: 450 }, uTop: { value: top }, uGo: { value: new THREE.Vector2(1, 0) }, uSunCol: HU.uSunCol, uSkyCol: HU.uSkyCol, uTint: { value: new THREE.Color(tint[0], tint[1], tint[2]) }, uKind: { value: kind } };
      const mesh = new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms: U, vertexShader: BUB_VERT, fragmentShader: BUB_FRAG, fog: true, transparent: true, depthWrite: false, side: THREE.DoubleSide }));
      mesh.frustumCulled = false; mesh.renderOrder = 6; mesh.name = name; mesh.visible = false; scene.add(mesh); bubU.push(U);
      return { mesh, U };
    };
    // ---- THE PLUNGING COLUMNS under the falls (COLM_VERT): one stands where each jet of the falls drives down into the
    // pool (in every 7.4 m of the face, the place where most water comes over the lip), stepped out from the face by a
    // seeded step of its own and as thick as its jet is strong; none stands within ROUTE_MARGIN of the route. Bubbles rise
    // round them (most round the ones nearest the route) and ride off downstream.
    const colmU = { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...lightU, uWhite: { value: new THREE.Color(PALETTE[5]) }, uShow: { value: 1 } };
    let columns = null, wallBub = null;
    {
      const boilAt = (z) => Math.exp(-Math.max(z, 0) / 6.5) * ss(-0.6, 1.5, z), cr = makeRng((((ctx.seed ?? 1) | 0) * 3167 + 59) >>> 0);
      const cols = [], jetX = surfU.uJetX.value; let nj = 0;
      for (let c0 = -70.3; c0 < 70; c0 += 7.4) {
        let jx = c0, jf = -1; for (let k = 0; k < 8; k++) { const x = c0 + 7.4 * (k + 0.5) / 8, f = hero.flowAt(x); if (f > jf) { jf = f; jx = x; } }
        const z = 4.3 + 4.6 * cr(), w = (0.9 + 0.75 * jf) * cr.range(0.8, 1.05), st = 0.86 + 0.12 * jf;
        if (jf < 0.25) continue;
        if (nj < 24) jetX[nj++] = jx;
        if (path.distanceTo(jx, -0.8, z) < ROUTE_MARGIN || path.distanceTo(jx, -3, z) < ROUTE_MARGIN || path.distanceTo(jx, -5.5, z) < ROUTE_MARGIN) continue;
        cols.push([jx, z, w, st]);
      }
      // and between them the lesser falls of water: slim columns of their own widths, each at its own step from the
      // face, wherever water comes over the lip; none within ROUTE_MARGIN of the route nor within 1.7 m of another
      // (a stream of their own, which also gives each its phase once all their places are dealt: its fifth number)
      { const c2 = makeRng((((ctx.seed ?? 1) | 0) * 5519 + 211) >>> 0), nJet = cols.length;
        for (let c0 = -70.3; c0 < 70; c0 += 3.7) {
          const x = c0 + 3.7 * c2(), z = 3.4 + 6.2 * c2(), w = c2.range(0.28, 0.72), st = c2.range(0.7, 0.92), f = hero.flowAt(x);
          if (f < 0.2 || c2() > 0.4 + f) continue;
          if (path.distanceTo(x, -0.8, z) < ROUTE_MARGIN || path.distanceTo(x, -3, z) < ROUTE_MARGIN || path.distanceTo(x, -5.5, z) < ROUTE_MARGIN) continue;
          if (cols.some((q) => Math.hypot(q[0] - x, (q[1] - z) * 0.5) < 1.7 + q[2])) continue;
          cols.push([x, z, w, st]);
        }
        for (let i = nJet; i < cols.length; i++) cols[i].push(c2()); }
      await ctx.yield();
      const n = cols.length, iP = new Float32Array(n * 4), iQ = new Float32Array(n * 4), P = [], I = [], NS = 10;
      // (a jet column takes its phase from the jets' stream here; a lesser one carries its own)
      for (let i = 0; i < n; i++) { const c = cols[i]; iP.set([c[0], c[1], c[2], c.length > 4 ? c[4] : cr()], i * 4); iQ.set([-0.78 * boilAt(c[1]) + 0.12, -6.95, c[3], 0], i * 4); }
      for (let j = 0; j <= NS; j++) P.push(-1, j / NS, 0, 1, j / NS, 0);
      for (let j = 0; j < NS; j++) { const a = j * 2; I.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
      const g = new THREE.InstancedBufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setIndex(I);
      g.setAttribute('iP', new THREE.InstancedBufferAttribute(iP, 4)); g.setAttribute('iQ', new THREE.InstancedBufferAttribute(iQ, 4)); g.instanceCount = n;
      columns = new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms: colmU, vertexShader: COLM_VERT, fragmentShader: COLM_FRAG, fog: true, transparent: true, depthWrite: false, side: THREE.DoubleSide }));
      columns.frustumCulled = false; columns.renderOrder = 2.5; columns.name = 'plungeColumns'; columns.visible = false; scene.add(columns);
      await ctx.yield();
      const byNear = cols.map((c, i) => [path.distanceTo(c[0], -3, c[1]), i]).sort((a, b) => a[0] - b[0]).map((q) => q[1]);
      const items = [], nb = n ? Math.round(280 * (0.5 + 0.5 * detail)) : 0;
      for (let i = 0; i < nb; i++) {
        const c = cols[cr() < 0.7 ? byNear[Math.min(n - 1, Math.floor(cr() * 4))] : Math.floor(cr() * n)], life = cr.range(3, 6.5), size = 0.016 + 0.05 * Math.pow(cr(), 2.2);
        items.push({ p: [c[0] + cr.gauss() * 1.5, cr.range(-6.7, -1.6), c[1] + cr.range(-0.6, 3.2), cr()], v: [cr.range(-0.12, 0.12), cr.range(0.45, 1.15), cr.range(0.25, 0.75), size], l: [life, cr.range(0.04, 0.12), 0, 0] });
      }
      if (!items.length) items.push({ p: [fx + 20, -4, 8, 0], v: [0, 0.6, 0.4, 0.02], l: [4, 0.05, 0, 0] });
      wallBub = mkBubbles(items, 0, [0.9, 1, 0.95], -0.35, 'wallBubbles');
      await ctx.yield();
      // sockeye hold before the columns along the foot, noses to the falls: dark shapes against the white (their own
      // material from the same program, at half the light, made once with a uGrow of its own for the water's sight),
      // scattered as the other holders under the boil are, a little nearer the face
      const darkMat = new THREE.ShaderMaterial({ uniforms: { ...fishU, uGainF: { value: night ? 0.9 : 0.5 }, uGainR: { value: 1 }, uGrow: { value: 0 } }, vertexShader: FISH_VERT, fragmentShader: FISH_FRAG, fog: true, vertexColors: true, side: THREE.DoubleSide });
      const nH = 5, iA = new Float32Array(nH * 4), iB = new Float32Array(nH * 4), iC = new Float32Array(nH * 4); let c = 0;
      for (let tries = 0; c < nH && tries < 120; tries++) {
        const x = fx + cr.range(10.5, 31), z = 7.8 + cr() * Math.min(4.2, 0.42 * (x - fx - 8.5)), y = cr.range(-4.6, -1.5), ph = cr(), size = cr.range(0.9, 1.15), yaw = cr.range(-0.2, 0.2), tint = cr(), pitch = cr.range(0.1, 0.3), beat = cr.range(6, 8);
        if (path.distanceTo(x, y, z) < 2.9) continue;
        iA.set([x, y, z, ph], c * 4); iB.set([size, yaw, 0, 1], c * 4); iC.set([tint, pitch, beat, 0.3], c * 4); c++;
      }
      const hm = new THREE.Mesh(instancedGeo(geoNear, c, { iA, iB, iC }), darkMat); hm.name = 'wallHolders'; hm.frustumCulled = false; scene.add(hm); bySight(hm); fishCount += c;
    }
    await ctx.yield();

    // ---- THE LIP BEARS STAND IN WHITE WATER: round the legs of each a mound of froth works (soft white puffs that
    // lift, swell and are carried on over the lip), so that from the pool below no paw stands on top of the foam.
    // None is laid within 18 m of the route: from nearer it is the water itself that is seen. A stream of its own.
    let legFoam = null;
    // (the drops of the ledge are under a pixel from beyond the second riffle bar: drawn from 125 m in)
    const ledgeDrops = hero.object.getObjectByName('drops') || null;
    if (ledgeDrops) {
      // the companions' own drops: the same quads and the same material (no new program), thirty to a fish, each with
      // its place on the body, its speed off it and its own clock (a stream of their own); they live a third of a second,
      // about the time it takes one to fall back to the water from a fish on its arc
      const ND = 30, n = 8 * ND, dr = makeRng((((ctx.seed ?? 1) | 0) * 7919 + 389) >>> 0), src = ledgeDrops.geometry;
      const g = new THREE.InstancedBufferGeometry(); g.setIndex(src.index); g.setAttribute('position', src.getAttribute('position'));
      const iP = new Float32Array(n * 4), iV = new Float32Array(n * 4), iT = new Float32Array(n * 4), loc = new Float32Array(n * 7);
      for (let j = 0; j < n; j++) {
        const life = dr.range(0.24, 0.42), period = life + dr.range(0.02, 0.2);
        iV[j * 4 + 3] = dr.range(0.02, 0.045); iT[j * 4] = period; iT[j * 4 + 1] = dr.range(0, period);
        loc[j * 7] = dr.range(-1.0, 0.45); loc[j * 7 + 1] = dr.range(-0.2, 0.2); loc[j * 7 + 2] = dr.range(-0.32, 0.1); loc[j * 7 + 3] = dr.range(0.3, 1.8); loc[j * 7 + 4] = dr.range(-0.7, 0.7); loc[j * 7 + 5] = dr.range(-0.2, 1.4); loc[j * 7 + 6] = life;
      }
      const aP = new THREE.InstancedBufferAttribute(iP, 4), aV = new THREE.InstancedBufferAttribute(iV, 4); aP.setUsage(THREE.DynamicDrawUsage); aV.setUsage(THREE.DynamicDrawUsage);
      g.setAttribute('iP', aP); g.setAttribute('iV', aV); g.setAttribute('iT', new THREE.InstancedBufferAttribute(iT, 4)); g.instanceCount = n;
      const m = new THREE.Mesh(g, ledgeDrops.material); m.name = 'companionDrops'; m.frustumCulled = false; m.renderOrder = 6; scene.add(m);
      compDrops = { mesh: m, P: aP, V: aV, loc, ND };
    }
    {
      const lr = makeRng((((ctx.seed ?? 1) | 0) * 3511 + 641) >>> 0), items = [];
      for (const b of A.bears) {
        const s = b.scale || 1, cy = Math.cos(b.yaw), sy = Math.sin(b.yaw);
        for (let k = 0; k < 14; k++) {
          const ax = lr.range(-1.25, 1.25) * s, az = lr.range(-2.1, 2.3) * s, x = b.position.x + cy * ax + sy * az, z = b.position.z - sy * ax + cy * az, y = Math.max(b.position.y, LIP - 0.2) + lr.range(-0.05, 0.22) * s, life = lr.range(0.6, 1.1), size = lr.range(0.2, 0.36) * s, ph = lr();
          if (path.distanceTo(x, y, z) < 18) continue;
          items.push({ p: [x, y, z, ph], v: [lr.range(-0.2, 0.2), lr.range(0.1, 0.45), lr.range(0.4, 1.2), size], l: [life, 0.06, 0.16, 0.2] });
        }
      }
      if (items.length) { legFoam = mkBubbles(items, 1, [1.75, 1.8, 1.8], 99, 'legFoam'); legFoam.mesh.renderOrder = 3; }
    }
    await ctx.yield();

    // ---- THE NESTS. Every redd the world has (the pale ovals of the cobble bed in the entry reach and on the upper
    // river, and the one on the shoaling tail of the pool) is dressed the same way, along the current: a hollow of small
    // clean gravel with a rim thrown up at its downstream end, eggs among the stones in the scene's own light, a female
    // on her side over its upstream half beating the stones clean with her tail (none where her body would come within
    // 2.6 m of the route), silt lifting off under her tail and away downstream, and three rainbow trout hanging 1 to
    // 2 m behind the rim for the eggs, noses upstream, each now and then darting 0.7 m at them and drifting back
    // (update); no trout, holding or darting, comes within 2.75 m of the route. The nests of a reach are drawn while
    // the eye is within 60 m of them. Streams of their own.
    const fanV = new THREE.Vector2(1.1, 0.14), nestGroups = [], nestFeet = [];
    {
      const rr = makeRng((((ctx.seed ?? 1) | 0) * 8191 + 127) >>> 0), bedAt = (x, z) => (z <= -3 && z > -47 ? hero.rockTop(x, z) : height(x, z));
      const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), v = new THREE.Vector3(), s3 = new THREE.Vector3(), col = new THREE.Color();
      const gravMat = propMat([2.2, 2.2, 0.3, 0], THREE.FrontSide), eg = new THREE.IcosahedronGeometry(1, 0);
      const eggMat = new THREE.ShaderMaterial({ uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...lightU, uEgg: { value: 0.5 } }, vertexShader: EGG_VERT, fragmentShader: EGG_FRAG, fog: true });
      const fanMat = new THREE.ShaderMaterial({ uniforms: { ...fishU, uFan: { value: fanV } }, vertexShader: FISH_VERT, fragmentShader: FISH_FRAG, fog: true, vertexColors: true, side: THREE.DoubleSide });
      const troutMat = new THREE.ShaderMaterial({ uniforms: { ...fishU }, vertexShader: FISH_VERT, fragmentShader: TROUT_FRAG, fog: true, vertexColors: true, side: THREE.DoubleSide });
      const hushPts = [];
      for (const reach of ['entry', 'tail', 'upper']) {
        const list = nests.filter((n) => n.reach === reach), nN = list.length; if (!nN) continue;
        const nG = 34, nE = 18, nT = 3, gm = new THREE.InstancedMesh(cobbleGeo, gravMat, nN * nG), em = new THREE.InstancedMesh(eg, eggMat, nN * nE);
        const fA = [], fB = [], fC = [], items = [], tA = [], tB = [], tC = [], home = [], dart = []; let gc = 0, ec = 0, cx = 0, cz = 0;
        for (const n of list) {
          await ctx.yield();
          cx += n.x / nN; cz += n.z / nN;
          const y0 = bedAt(n.x, n.z), wy = waterAt(n.z);
          if (y0 > wy - 0.6) continue;
          if (reach !== 'upper') nestFeet.push([n.x, n.z, wy - y0]);
          // the gravel of the nest: small pale stones, the bigger ones thrown up at the downstream end
          for (let i = 0; i < nG; i++) {
            const a = rr() * 6.283, r = Math.sqrt(rr()), al = Math.cos(a) * r, x = n.x + Math.sin(a) * r * n.rc, z = n.z + al * n.ra, sz = rr.range(0.09, 0.17) * (1 + 0.9 * ss(0.55, 1, al));
            e.set(rr.range(-0.3, 0.3), rr() * 6.283, rr.range(-0.3, 0.3)); q.setFromEuler(e);
            v.set(x, bedAt(x, z) - 0.05 * sz + 0.1 * ss(0.5, 1, al), z); s3.set(sz * rr.range(0.9, 1.4), sz * rr.range(0.7, 1), sz * rr.range(0.9, 1.3));
            gm.setMatrixAt(gc, m4.compose(v, q, s3));
            const k = rr.range(1.0, 1.3), w = rr.range(0, 0.06); gm.setColorAt(gc, col.setRGB(k * (1 + w), k, k * (1 - w))); gc++;
          }
          // the eggs: in the hollow, between and under the stones
          for (let i = 0; i < nE; i++) {
            const cl = i % 3 === 0, a = rr() * 6.283, r = Math.pow(rr(), 0.8) * (cl ? 0.3 : 0.6), x = n.x + Math.sin(a) * r * n.rc, z = n.z + (Math.cos(a) * r - (cl ? 0.15 : 0)) * n.ra, sz = rr.range(0.06, 0.09);
            v.set(x, bedAt(x, z) + 0.13 + rr.range(0, 0.08), z); s3.setScalar(sz); q.identity();
            em.setMatrixAt(ec++, m4.compose(v, q, s3));
          }
          // the female: across the current, rolled onto her side (FISH_VERT, uFan), over the upstream half of the nest,
          // on whichever side of its middle line keeps her clear of the route
          {
            const size = rr.range(1.0, 1.12), turn = rr.range(0.5, 0.95), ph = rr(), tint = rr(), fz0 = n.z - n.ra * 0.3, fy = y0 + 0.62; let best = null;
            if (fy < wy - 0.35) for (const o of [0, 0.45, -0.45, 0.85, -0.85]) for (const sd of [1, -1]) {
              const x = n.x + o * n.rc, yaw = sd * turn, d = bodyClear(x, fy, fz0, size, yaw);
              if (d >= 2.6 && (!best || Math.abs(o) < best[3] - 0.01)) best = [x, yaw, d, Math.abs(o)];
            }
            if (best) {
              fA.push(best[0], fy, fz0, ph); fB.push(size, best[1], 0, 1); fC.push(tint, -0.08, 15, 0.05); hushPts.push([best[0], fy, fz0]);
              // silt off the stones under her tail, carried away downstream
              const tx = best[0] + Math.sin(best[1]) * 0.9 * size, tz = fz0 + Math.cos(best[1]) * 0.9 * size;
              for (let i = 0; i < 14; i++) items.push({ p: [tx + rr.range(-0.4, 0.4), y0 + rr.range(0.1, 0.3), tz + rr.range(-0.4, 0.4), rr()], v: [rr.range(-0.15, 0.15), rr.range(0.1, 0.36), rr.range(0.5, 1.1), rr.range(0.16, 0.3)], l: [rr.range(2.4, 4), 0.06, 1, 0] });
            }
          }
          // the trout behind it
          for (let k = 0, tries = 0; k < nT && tries < 60; tries++) {
            const sd = rr() < 0.5 ? 1 : -1, x = n.x + sd * rr.range(0.3, n.rc + 1.3), z = n.z + n.ra + rr.range(1.0, 1.9), y = bedAt(x, z) + rr.range(0.42, 0.85), ph = rr(), size = rr.range(0.66, 0.78), tint = rr(), beat = rr.range(5.5, 8);
            const off = sd * rr.range(0.1, 0.46), nx = Math.sin(off), nzz = -Math.cos(off);
            if (y > waterAt(z) - 0.5 || path.distanceTo(x, y, z) < 2.85 || path.distanceTo(x + nx * 0.7, y, z + nzz * 0.7) < 2.75) continue;
            let ok = true; for (let j = home.length / 4 - k; j < home.length / 4; j++) if (Math.hypot(home[j * 4] - x, home[j * 4 + 2] - z) < 1.0) ok = false;
            if (!ok) continue;
            home.push(x, y, z, ph); dart.push(nx, nzz);
            tA.push(x, y, z, ph); tB.push(size, Math.atan2(-nx, -nzz), 0, 1); tC.push(tint, -0.05, beat, 0.3); hushPts.push([x, y, z]); k++;
          }
        }
        gm.count = gc; gm.instanceMatrix.needsUpdate = true; if (gm.instanceColor) gm.instanceColor.needsUpdate = true; gm.name = 'nest-gravel-' + reach;
        em.count = ec; em.instanceMatrix.needsUpdate = true; em.name = 'eggs-' + reach;
        const meshes = [gm, em], nF = fA.length / 4, nTr = tA.length / 4, up = reach === 'upper';
        if (nF) { const fm = new THREE.Mesh(instancedGeo(geoNear, nF, { iA: new Float32Array(fA), iB: new Float32Array(fB), iC: new Float32Array(fC) }), fanMat); fm.name = 'nestFemales-' + reach; fm.frustumCulled = false; meshes.push(fm); fishCount += nF; }
        const g = { up, cx, cz, rad: 0, meshes, puffs: null, tm: null, attr: null, home: new Float32Array(home), dart: new Float32Array(dart), n: nTr };
        for (const n of list) g.rad = Math.max(g.rad, Math.hypot(n.x - cx, n.z - cz));
        if (nTr) {
          const tg = instancedGeo(geoMid, nTr, { iA: new Float32Array(tA), iB: new Float32Array(tB), iC: new Float32Array(tC) }); tg.getAttribute('iA').setUsage(THREE.DynamicDrawUsage);
          const tm = new THREE.Mesh(tg, troutMat); tm.name = 'trout-' + reach; tm.frustumCulled = false; meshes.push(tm); g.tm = tm; g.attr = tg.getAttribute('iA');
        }
        for (const m of meshes) { m.visible = false; scene.add(m); }
        if (items.length) g.puffs = mkBubbles(items, 1, [0.5, 0.48, 0.36], (up ? LIP : 0) - 0.2, 'siltPuffs-' + reach);
        nestGroups.push(g);
        await ctx.yield();
      }
      await hushAll(hushPts, 1.1);
    }
    await ctx.yield();

    // ---- THE RIFFLES from below: wherever the bed with the spit laid whole (bedWas) comes within 2.2 m of the surface under the route (the bars the
    // three arcs go over), the broken water overhead drives bubbles down, which tumble a metre under the ceiling and
    // ride off downstream. And everywhere under water the river carries silt and yellow leaves past the lens (DRIFT_VERT).
    let riffleBub = null, drift = null, riffleCurt = null;
    const driftU = { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), uTime: HU.uTime, uVH: { value: 450 }, uSurf: { value: 0 }, uSunCol: HU.uSunCol, uSkyCol: HU.uSkyCol };
    {
      const br = makeRng((((ctx.seed ?? 1) | 0) * 7541 + 1013) >>> 0), items = [], nB = Math.round(520 * (0.5 + 0.5 * detail)), p = new THREE.Vector3(), t = new THREE.Vector3();
      // (the bubbles, and the curtains below, are dealt by metres along the route, over the whole stretch of it that lies
      // downstream of z 60, the bound their switches use: from the route's start to d60, where it first comes up to z 60)
      let d60 = 0; while (d60 < path.length && path.posAtDist(d60, p).z > 60) d60 += 1;
      for (let tries = 0; items.length < nB && tries < nB * 8; tries++) {
        if ((tries & 255) === 255) await ctx.yield();
        const d = br.range(0, d60); path.posAtDist(d, p); path.tangentAtDist(d, t);
        const side = br.gauss() * 6, x = p.x - t.z * side, z = p.z + t.x * side, depth = waterAt(z) - bedWas(x, z);
        if (depth < 0.5 || br() > ss(2.2, 1.1, depth)) continue;
        const life = br.range(1.3, 2.6), down = br.range(0.1, 0.9) * Math.min(depth - 0.3, 1.2);
        items.push({ p: [x, -0.08 - down * br(), z, br()], v: [br.range(-0.2, 0.2), -down / life * 0.5 + br.range(-0.1, 0.25), br.range(0.9, 2.0), 0.012 + 0.04 * Math.pow(br(), 2.4)], l: [life, br.range(0.05, 0.16), 0, 0] });
      }
      if (items.length) riffleBub = mkBubbles(items, 0, [0.95, 1, 0.96], -0.03, 'riffleBubbles');
      await ctx.yield();
      // and under each bar the broken water drives trains of bubbles down: slim white curtains of them hang from the
      // ceiling (beyond 26 m; nearer the eye they are clouds of bubbles that begin just under the ceiling: the end of
      // COLM_FRAG) wherever the bed with the spit laid whole (bedWas) is within 1.9 m of the surface beside the route (the plunging columns' own program
      // and material), each of its own width and reach; none within 3 m of the route. A stream of their own.
      {
        const c2 = makeRng((((ctx.seed ?? 1) | 0) * 4637 + 83) >>> 0), cols = [], NS = 10, P = [], I = [];
        // (dealt by metres along the route over the same stretch as the bubbles above: from the route's start to d60)
        for (let tries = 0; cols.length < 46 && tries < 900; tries++) {
          if ((tries & 127) === 127) await ctx.yield();
          const d = c2.range(0, d60); path.posAtDist(d, p); path.tangentAtDist(d, t);
          const side = c2.sign() * c2.range(3.2, 15), x = p.x - t.z * side, z = p.z + t.x * side, depth = waterAt(z) - bedWas(x, z), w = c2.range(0.2, 0.55), st = c2.range(0.55, 0.85), sd = c2(), reach = c2.range(0.6, 1.3);
          if (depth < 0.55 || depth > 1.9 || path.distanceTo(x, -0.5, z) < 3 || cols.some((q) => Math.hypot(q[0] - x, q[1] - z) < 1.6)) continue;
          cols.push([x, z, w, sd, -0.02, -Math.min(depth - 0.1, reach), st]);
        }
        const n = cols.length, iP = new Float32Array(n * 4), iQ = new Float32Array(n * 4);
        for (let i = 0; i < n; i++) { const c = cols[i]; iP.set([c[0], c[1], c[2], c[3]], i * 4); iQ.set([c[4], c[5], c[6], 0], i * 4); }
        for (let j = 0; j <= NS; j++) P.push(-1, j / NS, 0, 1, j / NS, 0);
        for (let j = 0; j < NS; j++) { const a = j * 2; I.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
        if (n && columns) {
          const g = new THREE.InstancedBufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setIndex(I);
          g.setAttribute('iP', new THREE.InstancedBufferAttribute(iP, 4)); g.setAttribute('iQ', new THREE.InstancedBufferAttribute(iQ, 4)); g.instanceCount = n;
          riffleCurt = new THREE.Mesh(g, columns.material); riffleCurt.frustumCulled = false; riffleCurt.renderOrder = 2.5; riffleCurt.name = 'riffleCurtains'; riffleCurt.visible = false; scene.add(riffleCurt);
        }
      }
      await ctx.yield();
      const n = Math.round(300 * (0.5 + 0.5 * detail)), iP = new Float32Array(n * 4), iV = new Float32Array(n * 4);
      for (let i = 0; i < n; i++) {
        const leaf = i % 7 === 0;
        iP.set([br.range(-13, 13), Math.pow(br(), leaf ? 1.6 : 1), br.range(-13, 13), br()], i * 4);
        iV.set([br.range(0.9, 1.9), leaf ? br.range(0.03, 0.055) : br.range(0.008, 0.022), leaf ? 1 : 0, leaf ? br.range(0.6, 1.8) * (br() < 0.5 ? -1 : 1) : 0], i * 4);
      }
      const g = new THREE.InstancedBufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3)); g.setIndex([0, 1, 2, 0, 2, 3]);
      g.setAttribute('iP', new THREE.InstancedBufferAttribute(iP, 4)); g.setAttribute('iV', new THREE.InstancedBufferAttribute(iV, 4)); g.instanceCount = n;
      drift = new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms: driftU, vertexShader: DRIFT_VERT, fragmentShader: DRIFT_FRAG, fog: true, transparent: true, depthWrite: false, side: THREE.DoubleSide }));
      drift.frustumCulled = false; drift.renderOrder = 6; drift.name = 'drift'; drift.visible = false; scene.add(drift);
    }
    await ctx.yield();

    // ---- the drowned spruce on the entry axis (root plate toward us), and the fallen spruce over the portal
    const barkMat = propMat([0.35, 3.2, 0.4, 0.25]);
    let weedMat = null, rootBub = null;
    // (the fish among the roots, and the z of the root wad they hold at: update() switches them by the eye's place)
    let rootFish = null, rootWadZ = 0;
    await ctx.yield();
    {
      // 42 m in and 4.5 m right of the axis: the trunk lies down the current toward us on our right, and its root plate
      // stands on edge across the bed, a metre of it sunk in the gravel. Every point of it is laid clear of the route
      // (4 m and its own thickness: tested against the route's own points through the whole entry reach)
      const tx = xs + 4.5, tz = Z0 - 42, ty = height(tx, tz) + 4.1, rot = -0.96, cr = Math.cos(rot), sr = Math.sin(rot);
      const NP = 240, rp = new Float32Array((NP + 1) * 3);
      // (the route's points from its start to 76 m beyond the tree, one every half metre)
      const span = Z0 - tz + 76;
      for (let i = 0; i <= NP; i++) { path.posAtDist(span * i / NP, _pv); rp[i * 3] = _pv.x; rp[i * 3 + 1] = _pv.y; rp[i * 3 + 2] = _pv.z; }
      await ctx.yield();
      const clear = (x, y, z) => { const wx = tx + cr * x + sr * z, wy = ty + y, wz = tz - sr * x + cr * z; let d = 1e9; for (let i = 0; i <= NP; i++) { const ax = rp[i * 3] - wx, ay = rp[i * 3 + 1] - wy, az = rp[i * 3 + 2] - wz, e = ax * ax + ay * ay + az * az; if (e < d) d = e; } return Math.sqrt(d); };
      const g = await windthrowGeometry(rng.fork('drowned'), nz, { length: 36, trunk: 0.72, plate: 5.2, count: 11, sinkers: 8, rootlets: 120, stones: 26, stubs: 11, cobble: cobbleGeo,
        clear, bed: (x, z) => height(tx + cr * x + sr * z, tz - sr * x + cr * z) - ty, top: -0.9 - ty, stream: [-sr, 0, cr] }, ctx.yield);
      beats.tree = [+ty.toFixed(2), +g.near.toFixed(2), g.geometry.index.count / 3];
      await ctx.yield();
      // it takes a third of the water's haze, so that the dark shape still reads from the portal's eye 62 m away
      const woodMat = new THREE.ShaderMaterial({ uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...lightU, uFogK: { value: 0.34 }, uBedY: { value: ty - 4.1 } }, vertexShader: WOOD_VERT, fragmentShader: WOOD_FRAG, fog: true, vertexColors: true, side: THREE.DoubleSide });
      const mesh = new THREE.Mesh(g.geometry, woodMat); mesh.position.set(tx, ty, tz); mesh.rotation.set(0, rot, 0); mesh.name = 'drownedSpruce'; mesh.userData.info = beats.tree; scene.add(mesh);
      mesh.updateMatrixWorld(true);
      await ctx.yield();
      // drowned weed streaming downstream from the roots
      const P = [], Lc = [], I = [], v = new THREE.Vector3(), wr = rng.fork('weed'); let n = 0;
      for (const a of g.tips) {
        v.set(a[0], a[1], a[2]).applyMatrix4(mesh.matrixWorld);
        const len = wr.range(1.2, 3.2), ph = wr(), w = wr.range(0.09, 0.17), dx = wr.range(-0.5, 0.5);
        for (let k = 0; k <= 4; k++) { const t = k / 4; for (const sd of [-1, 1]) { P.push(v.x + dx * t, v.y - len * 0.45 * t * t - 0.1 * t, v.z + len * 0.85 * t); Lc.push(t, sd, ph, w); } }
        for (let k = 0; k < 4; k++) { const b0 = n * 10 + k * 2; I.push(b0, b0 + 1, b0 + 2, b0 + 1, b0 + 3, b0 + 2); }
        n++;
      }
      const wg = new THREE.BufferGeometry(); wg.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); wg.setAttribute('aL', new THREE.Float32BufferAttribute(Lc, 4)); wg.setIndex(I);
      weedMat = new THREE.ShaderMaterial({ uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), uTime: HU.uTime, uCam: HU.uCam, uSunCol: HU.uSunCol, uSkyCol: HU.uSkyCol, uPx: { value: 0.003 }, uTint: { value: new THREE.Color(0.04, 0.07, 0.03) } },
        vertexShader: LICHEN_VERT, fragmentShader: LICHEN_FRAG, fog: true, side: THREE.DoubleSide });
      const wm = new THREE.Mesh(wg, weedMat); wm.name = 'weed'; scene.add(wm);
      await ctx.yield();
      // sockeye hold among the roots, noses upstream (none within 2.6 m of the route), and air works loose from the
      // wad and rises through them. A stream of their own.
      {
        const fr = makeRng((((ctx.seed ?? 1) | 0) * 5303 + 389) >>> 0), nF = 9, iA = new Float32Array(nF * 4), iB = new Float32Array(nF * 4), iC = new Float32Array(nF * 4), pts = [], items = []; let c = 0;
        for (let tries = 0; c < nF && tries < 400 && g.tips.length; tries++) {
          const a = g.tips[Math.floor(fr() * g.tips.length)]; v.set(a[0], a[1], a[2]).applyMatrix4(mesh.matrixWorld);
          const x = v.x + fr.range(-1.3, 1.3), y = v.y + fr.range(-0.4, 0.9), z = v.z + fr.range(-0.6, 2.2), size = fr.range(0.9, 1.12), yaw = fr.range(-0.35, 0.35);
          if (y > -0.7 || y < height(x, z) + 0.5 || bodyClear(x, y, z, size, yaw) < 2.6 || pts.some((q) => Math.hypot(q[0] - x, q[1] - y, q[2] - z) < 1.25)) continue;
          iA.set([x, y, z, fr()], c * 4); iB.set([size, yaw, 0, 1], c * 4); iC.set([fr(), fr.range(-0.05, 0.1), fr.range(5, 7), 0.3], c * 4); pts.push([x, y, z]); c++;
        }
        if (c) {
          const fm = new THREE.Mesh(instancedGeo(geoNear, c, { iA, iB, iC }), fishMat); fm.name = 'rootFish'; fm.frustumCulled = false; scene.add(fm); rootFish = fm; rootWadZ = tz; fishCount += c;
          await hushAll(pts, 1.0);
        }
        for (let i = 0; i < 70 && g.tips.length; i++) {
          const a = g.tips[Math.floor(fr() * g.tips.length)]; v.set(a[0], a[1], a[2]).applyMatrix4(mesh.matrixWorld);
          const life = fr.range(3.5, 7);
          items.push({ p: [v.x + fr.range(-0.5, 0.5), v.y + fr.range(-0.6, 0.2), v.z + fr.range(-0.5, 0.5), fr()], v: [fr.range(-0.05, 0.05), fr.range(0.5, 0.95), fr.range(0.15, 0.4), 0.014 + 0.04 * Math.pow(fr(), 2)], l: [life, fr.range(0.04, 0.1), 0, 0] });
        }
        if (items.length) { rootBub = mkBubbles(items, 0, [0.92, 1, 0.95], -0.3, 'rootBubbles'); }
      }
    }
    await ctx.yield();
    const spanZ = portalZ + 11, spanY = 13.7;
    let lichenMat = null;
    {
      const g = logGeometry(rng.fork('fallen'), nz, { length: 47, radius: 1.12, sag: 0.8, roots: 2.5, branches: 26, hang: true, span: [0.2, 0.93], lenAt: (t) => lerp(1.15, 6.2, ss(6, 14, Math.abs(t * 47 - 23.5))) });
      const mesh = new THREE.Mesh(g.geometry, barkMat); mesh.position.set(lx - 23.5, spanY, spanZ); mesh.rotation.set(0.12, 0, -0.025); mesh.name = 'fallenSpruce'; scene.add(mesh);
      mesh.updateMatrixWorld(true);
      await ctx.yield();
      // a second rank of dead branches between the first (the comb is thick enough to fill the top of the frame as we
      // come in under it), on the same trunk; streams of their own for it and for its lichen
      const g2 = logGeometry(makeRng((((ctx.seed ?? 1) | 0) * 6703 + 331) >>> 0), nz, { length: 47, radius: 1.12, sag: 0.8, branches: 24, hang: true, span: [0.14, 0.96], noTrunk: true, lenAt: (t) => lerp(0.7, 7.4, ss(6.4, 15, Math.abs(t * 47 - 23.5))) });
      const mesh2 = new THREE.Mesh(g2.geometry, barkMat); mesh2.position.copy(mesh.position); mesh2.rotation.copy(mesh.rotation); mesh2.name = 'fallenComb'; scene.add(mesh2);
      const lr2 = makeRng((((ctx.seed ?? 1) | 0) * 6703 + 977) >>> 0);
      await ctx.yield();
      // old-man's-beard lichen hanging from the comb
      const P = [], Lc = [], I = [], v = new THREE.Vector3(); let n = 0;
      for (const a of g.anchors) {
        if (rng() > 0.8) continue;
        v.set(a[0], a[1], a[2]).applyMatrix4(mesh.matrixWorld);
        let len = rng.range(1.3, 3.1); const ph = rng(), w = rng.range(0.22, 0.4), dx = rng.range(-0.3, 0.3);
        // over the opening of the portal (6 m either side of the leap line) nothing hangs lower than its rim
        if (Math.abs(v.x - lx) < 7.2) { len = Math.min(len, v.y - 12.1); if (len < 0.45) continue; }
        for (let k = 0; k <= 4; k++) { const t = k / 4; for (const sd of [-1, 1]) { P.push(v.x + dx * t * t, v.y - len * t, v.z); Lc.push(t, sd, ph, w); } }
        for (let k = 0; k < 4; k++) { const b = n * 10 + k * 2; I.push(b, b + 1, b + 2, b + 1, b + 3, b + 2); }
        n++;
      }
      for (const a of g2.anchors) {
        v.set(a[0], a[1], a[2]).applyMatrix4(mesh.matrixWorld);
        let len = lr2.range(1.4, 3.6); const ph = lr2(), w = lr2.range(0.22, 0.42), dx = lr2.range(-0.3, 0.3);
        if (Math.abs(v.x - lx) < 7.2) { len = Math.min(len, v.y - 12.1); if (len < 0.45) continue; }
        for (let k = 0; k <= 4; k++) { const t = k / 4; for (const sd of [-1, 1]) { P.push(v.x + dx * t * t, v.y - len * t, v.z); Lc.push(t, sd, ph, w); } }
        for (let k = 0; k < 4; k++) { const b = n * 10 + k * 2; I.push(b, b + 1, b + 2, b + 1, b + 3, b + 2); }
        n++;
      }
      const lg = new THREE.BufferGeometry(); lg.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); lg.setAttribute('aL', new THREE.Float32BufferAttribute(Lc, 4)); lg.setIndex(I);
      lichenMat = new THREE.ShaderMaterial({ uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), uTime: HU.uTime, uCam: HU.uCam, uSunCol: HU.uSunCol, uSkyCol: HU.uSkyCol, uPx: { value: 0.003 }, uTint: { value: new THREE.Color('#a9b596') } },
        vertexShader: LICHEN_VERT, fragmentShader: LICHEN_FRAG, fog: true, side: THREE.DoubleSide });
      const lm = new THREE.Mesh(lg, lichenMat); lm.name = 'lichen'; scene.add(lm);
    }
    await ctx.yield();

    // ---- more bears: one snorkelling in the riffle, one chest-deep in the pool, a sow and two cubs on the east bar
    const zArc2 = Z0 - ARC_U[1] * L;
    const riffleBear = { x: pathX(zArc2) - 16, z: zArc2 - 22 };
    const moreBears = [
      { x: riffleBear.x, z: riffleBear.z, yaw: 1.9, scale: 1.04, girth: 1.1, phase: rng(), tint: 0.35, period: 8.5, offset: rng.range(0, 8) },
      { x: shelf.x, z: shelf.z, yaw: 1.45, scale: 1.08, girth: 1.14, phase: rng(), tint: 0.6, period: 11, offset: rng.range(0, 11) },
      { x: ebar.x, z: ebar.z, yaw: -1.9, scale: 0.94, girth: 1.05, phase: rng(), tint: 0.75, period: 23, offset: rng.range(0, 20) },
      { x: ebar.x - 4.2, z: ebar.z + 5, yaw: -2.5, scale: 0.42, girth: 1.1, phase: rng(), tint: 0.85, period: 6.5, offset: rng.range(0, 6) },
      { x: ebar.x - 2.2, z: ebar.z + 7.6, yaw: 0.7, scale: 0.4, girth: 1.1, phase: rng(), tint: 0.9, period: 7.5, offset: rng.range(0, 7) },
    ];
    // two more fish from the shoal in the pool: a big boar side-on to us and a smaller bear beyond it watching the falls.
    // We pass 15 m off, the sun behind us (the brief's warm brown bears at 20 m, on the run at the ledge)
    moreBears.push(
      { x: reef.x - 1.7, z: reef.z + 1.0, yaw: -2.1, scale: 1.1, girth: 1.12, phase: xr(), tint: 0.5, period: 9.5, offset: xr.range(0, 9) },
      { x: reef.x + 2.7, z: reef.z - 1.7, yaw: 2.3, scale: 0.84, girth: 1.06, phase: xr(), tint: 0.8, period: 13, offset: xr.range(0, 13) });
    for (const b of moreBears) b.y = height(b.x, b.z) - 0.05;
    const bearAt = moreBears.map((b) => [b.x, b.z]);        // where each of the river's bears stands
    // the pool bear stands belly-deep on its shelf, side-on to us as we come up the pool: four legs and the belly in the
    // water, the back and the head above it, seen through the ripples. It has its own material so that it alone keeps
    // its umber under water (subK)
    const sitter = moreBears.splice(1, 1)[0], sitYaw = 2.1, sitF = [Math.sin(sitYaw), Math.cos(sitYaw)];
    sitter.yaw = sitYaw; sitter.x = shelf.x; sitter.z = shelf.z; sitter.y = height(shelf.x, shelf.z) - 0.05; sitter.scale = 1.26; sitter.girth = 1.1;
    const riffleB = hero.addBears(moreBears.splice(0, 1), { own: true, name: 'riffleBear', subK: 0.6, silK: 0.3 });
    riffleB.mesh.userData.ur = [-1, 0.46]; byU.push(riffleB.mesh);
    hero.addBears(moreBears, { own: true, name: 'riverBears', subK: 0.6, silK: 0.3 });
    await ctx.yield();
    // the bears as the pool mirrors them (SURF_FRAG, uLedge): x, half width (more when side-on), top, strength
    const ledgeV = surfU.uLedge.value; let nLedge = 0;
    const mirrorBear = (x, yaw, scale, y) => { const i = Math.min(nLedge++, 15); ledgeV[i].set(x, scale * (1.35 + 1.9 * Math.abs(Math.sin(yaw))), y + 4.6 * scale, 1); return ledgeV[i]; };
    for (const b of A.bears) mirrorBear(b.position.x, b.yaw, b.scale, b.position.y);
    // a third bear at the miss: a young one on the lip between the bear we rise under and its neighbour on the right,
    // so that three stand black on the sky over the failed leap (the two neighbours are 12 to 14 m off, outside the
    // frame from 9 m below). Not in October, when three vast bears have the whole ledge.
    let thirdX = null;
    if (look.season !== 'october') {
      let right = fx + 14; for (const b of A.bears) if (b.position.x > fx + 1 && b.position.x < right) right = b.position.x;
      const tb = { x: fx + clamp((right - fx) * 0.5, 5.4, 6.6), z: -1.5, yaw: -0.42, scale: 0.84, girth: 1.04, phase: zr(), tint: 0.55, period: 12.5, offset: zr.range(0, 12) };
      tb.y = hero.crestAt(tb.x) - 0.06; thirdX = tb.x;
      hero.addBears([tb], { name: 'thirdBear' });
      mirrorBear(tb.x, tb.yaw, tb.scale, tb.y);
    }
    await ctx.yield();
    const sit = hero.addBears([sitter], { own: true, name: 'poolBear', subK: 0.8, silK: 0.3 });
    await ctx.yield();
    // THE RUNS RUN OVER COBBLES (the design: the river runs 'over cobbles in the runs'; 'Near detail all the way: cobbles,
    // nests, algae, neighbours, bubbles, foam'). Stones of the cobbles' own shape, from a stream of their own, on the
    // bed of the lower river from the edge of the apron (APRON_Z) on. (The design counts 'plus 2,400 instanced
    // cobbles and nest ovals within 15 m of the path'; these stones are a further lot beside that count.)
    // THE LAW OF THEIR PLACE: RUN_PER_M2 stones to the square metre, counted on the level (at full detail; half as many
    // at none), wherever the runs' line passes within RUN_WHOLE metres on the level; fewer farther out by a smooth step,
    // none from RUN_REACH. The runs' line is the route from its first sample to the foot of the falls (NF: the first
    // sample at or under z APRON_Z, where the route first comes to the apron; were there none, the search ends at the
    // route's last sample and the line is the whole route); the distance is to the nearest of those samples in plan
    // (runDist). What the route flies after that sample is not part of that line. Nothing in the law
    // knows where the eye stands or where the lens looks.
    // HOW THEY ARE DEALT: the box that holds those samples, grown by RUN_REACH to both sides in x and downstream in z
    // and begun at APRON_Z, is walked in cells of RUN_CELL metres, row by row (a hand-back is asked for at every row).
    // Every cell deals RUN_TRIES stones, thirteen draws a stone whatever comes of it, each at a place of its own in the
    // cell. A stone stands with the chance the law gives its place (one whose draw is not under the law's greatest
    // chance stands nowhere, and its distance is not asked for), unless: the water over the bed there, as the bed
    // lies, is under half a metre; it lies in a nest's oval, the oval taken wider by the stone's own size; it lies
    // within BEAR_CLEAR of where a river bear stands; or it would break the lens's law. A
    // stone refused is not dealt again: there is no second try, and every loop here is counted (the box's rows and
    // cells, a cell's tries, the route's samples, the nests, the bears, the shape's corners, the lots).
    // Sized, seated, turned and toned by the cobbles' own laws.
    // THE LENS'S LAW is the cobbles' own, asked of the same function (lensKeeps, where the cobbles are dealt: a
    // stone that lies low under the lens is the bed's dress and keeps LENS_AIR, one that stands up towards it is a
    // body and keeps BODY_AIR, each with LENS_MARGIN more, from every sample of the whole flown route near it).
    // THE LOTS: the stones are gathered by tiles of RUN_TILE metres (a stone belongs to the tile its place lies in). Each
    // tile that holds a stone is a lot with a material of its own, made as the cobbles' is, and is shown by update()
    // for itself. A lot carries the box of its stones' places (box: update() reads the stretch of z it spans) and a
    // box that holds every stone of it whole (bounds: each seat grown to all sides by GEO_R times the stone's
    // greatest scale).
    // THE STONE FROM OVER THE WATER: a lot is made twice, of the same stones (the same matrices and tones, stone for
    // stone, and the lot's one material): one mesh in the cobble's own 32 faces (named cobbles-run) and one in the same
    // stone's 8 first faces (named cobbles-run-far; farGeo: the cobbles' shape uncut, whose six corners are six of the
    // cobble's 18). update() shows one of the two and never both: the 32 faces while the eye is under the water's
    // surface, the 8 while it is over it. From over the surface the bed is seen only through the surface; under
    // water every run stone is the cobble whole.
    const runLots = [], runFrustum = new THREE.Frustum(), runPM = new THREE.Matrix4();
    {
      const kr = own('runStones'), RUN_PER_M2 = 0.8, RUN_WHOLE = 8, RUN_REACH = 15, RUN_CELL = 1, RUN_TRIES = 2, RUN_TILE = 12, APRON_Z = 15, BEAR_CLEAR = 2.5;
      const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), v = new THREE.Vector3(), s3 = new THREE.Vector3();
      const farGeo = cobbleGeometry(nz, 0), gp = cobbleGeo.getAttribute('position'), nc = gp.count; let GEO_R = 0; for (let i = 0; i < nc; i++) GEO_R = Math.max(GEO_R, Math.hypot(gp.getX(i), gp.getY(i), gp.getZ(i)));
      let NF = 0; while (NF < NS && spz[NF] > APRON_Z) NF++;
      const runDist = (x, z) => { let best = Infinity; for (let i = 0; i <= NF; i++) { const dx = spx[i] - x, dz = spz[i] - z, d = dx * dx + dz * dz; if (d < best) best = d; } return Math.sqrt(best); };
      let bx0 = Infinity, bx1 = -Infinity, bz1 = -Infinity;
      for (let i = 0; i <= NF; i++) { bx0 = Math.min(bx0, spx[i]); bx1 = Math.max(bx1, spx[i]); bz1 = Math.max(bz1, spz[i]); }
      const x0 = bx0 - RUN_REACH, nx = Math.ceil((bx1 - bx0 + 2 * RUN_REACH) / RUN_CELL), nr = Math.ceil((bz1 + RUN_REACH - APRON_Z) / RUN_CELL);
      const keepK = RUN_PER_M2 * RUN_CELL * RUN_CELL / RUN_TRIES * (0.5 + 0.5 * detail), tiles = new Map();
      for (let iz = 0; iz < nr; iz++) {
        await ctx.yield();
        for (let ix = 0; ix < nx; ix++) for (let k = 0; k < RUN_TRIES; k++) {
          const rd = kr(), rx = kr(), rz = kr(), ra = kr(), rb = kr(), e1 = kr(), e2 = kr(), e3 = kr(), wx = kr(), wy = kr(), wz = kr(), rk = kr(), rw = kr();
          if (rd >= keepK) continue;
          const x = x0 + (ix + rx) * RUN_CELL, z = APRON_Z + (iz + rz) * RUN_CELL;
          if (rd >= keepK * (1 - ss(RUN_WHOLE, RUN_REACH, runDist(x, z)))) continue;
          const y = height(x, z); if (waterAt(z) - y < 0.5) continue;
          const s = (0.2 + 0.46 * ra * rb) * (1 + 1.5 * ss(-5, -12, y));
          if (nests.some((o) => ((x - o.x) / (o.rc + s)) ** 2 + ((z - o.z) / (o.ra + s)) ** 2 < 1)) continue;
          if (bearAt.some((o) => Math.hypot(o[0] - x, o[1] - z) < BEAR_CLEAR)) continue;
          e.set(lerp(-0.2, 0.2, e1), e2 * 6.283, lerp(-0.2, 0.2, e3)); q.setFromEuler(e);
          v.set(x, y - 0.12 * s, z); s3.set(s * lerp(0.8, 1.35, wx), s * lerp(0.7, 1.15, wy), s * lerp(0.8, 1.2, wz)); m4.compose(v, q, s3);
          if (!lensKeeps(m4)) continue;
          const far = GEO_R * Math.max(s3.x, s3.y, s3.z);
          const tk = Math.floor((x - x0) / RUN_TILE) + 4096 * Math.floor((z - APRON_Z) / RUN_TILE); let T = tiles.get(tk); if (!T) tiles.set(tk, T = { m: [], c: [], lo: [Infinity, Infinity, Infinity], hi: [-Infinity, -Infinity, -Infinity] });
          for (let i = 0; i < 16; i++) T.m.push(m4.elements[i]);
          for (let i = 0; i < 3; i++) { const at = v.getComponent(i); T.lo[i] = Math.min(T.lo[i], at - far); T.hi[i] = Math.max(T.hi[i], at + far); }
          const tone = lerp(0.7, 1.15, rk), w = lerp(-0.06, 0.06, rw); T.c.push(tone * (1 + w), tone, tone * (1 - w));
        }
      }
      await ctx.yield();
      for (const T of tiles.values()) {
        const n = T.c.length / 3, mesh = new THREE.InstancedMesh(cobbleGeo, propMat([2.2, 2.2, 0.3, 0], THREE.FrontSide), n), box = [Infinity, -Infinity, Infinity, -Infinity];
        mesh.instanceMatrix.array.set(T.m); mesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(T.c), 3);
        for (let i = 0; i < n; i++) { const x = T.m[i * 16 + 12], z = T.m[i * 16 + 14]; box[0] = Math.min(box[0], x); box[1] = Math.max(box[1], x); box[2] = Math.min(box[2], z); box[3] = Math.max(box[3], z); }
        mesh.name = 'cobbles-run'; mesh.userData.box = box; mesh.userData.bounds = new THREE.Box3(new THREE.Vector3(T.lo[0], T.lo[1], T.lo[2]), new THREE.Vector3(T.hi[0], T.hi[1], T.hi[2]));
        // (the same lot in the stone's 8 first faces: the lot's own material, its matrices and tones again)
        const air = new THREE.InstancedMesh(farGeo, mesh.material, n);
        air.instanceMatrix.array.set(T.m); air.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(T.c), 3);
        air.name = 'cobbles-run-far'; air.visible = false; mesh.userData.air = air;
        scene.add(mesh, air); runLots.push(mesh);
        if ((runLots.length & 7) === 7) await ctx.yield();
      }
    }
    await ctx.yield();
    // THE POOL'S OWN FISH AT THE SURFACE, along the whole of the run the route makes over the pool (the brief's slanting
    // run and the turn at the pool's tail before it): sockeye holding nose to the current with their backs awash, one
    // for every RUN_STEP metres of the route by turns on its left and its right, RUN_OFF metres off it (outside the
    // companions' berths, the widest of which lies 5.4 m out, so that none of ours swims through one), wherever the
    // route rides at the surface of the lower river below the boil. Each has 0.8 m of water under it (the companions'
    // rule over a bar); none lies within BEAR_OFF of where a bear stands or within a body's length of another awash
    // fish. From below they are bodies on the ceiling. They are drawn while
    // the eye is in the lower river below the boil (update: runFile), and grow from nothing over the boil's last
    // 4.5 m, where the white water hides them (a stream of their own)
    let runFile = null;
    {
      const rf = own('runFile'), RUN_STEP = 1.5, RUN_OFF = [6.3, 12], BEAR_OFF = 7.5, p = new THREE.Vector3(), t = new THREE.Vector3(), iA = [], iB = [], iC = [];
      let k = 0, zMax = 16;
      for (let d = beats.missFall * L; d < beats.leapBreak * L; d += RUN_STEP) {
        const r1 = rf(), r2 = rf(), r3 = rf(), r4 = rf(), r5 = rf(), r6 = rf(), r7 = rf();        // (seven draws a step, whatever comes of it)
        path.posAtDist(d, p); if (p.y < -0.3 || p.z < 16) continue;
        path.tangentAtDist(d, t);
        const h = Math.hypot(t.x, t.z) || 1, off = (k++ % 2 ? 1 : -1) * lerp(RUN_OFF[0], RUN_OFF[1], r1 * r1), x = p.x - (t.z / h) * off, z = p.z + (t.x / h) * off + (r2 - 0.5) * 1.2;
        const size = lerp(0.9, 1.15, r3), y = lerp(0.04, 0.16, r4) - 0.37 * size;
        if (z < 16 || edgeD(x, z) > -4 || height(x, z) > -0.8 || path.distanceTo(x, y, z) < RUN_OFF[0] - 0.2) continue;
        if (bearAt.some((q) => Math.hypot(q[0] - x, q[1] - z) < BEAR_OFF) || awashPts.some((q) => Math.hypot(q[0] - x, q[1] - z) < 2.2)) continue;
        awashPts.push([x, z]); zMax = Math.max(zMax, z);
        iA.push(x, y, z, r5); iB.push(size, (r6 - 0.5) * 0.56, 0, 1); iC.push(r7, 0.03, lerp(5, 7.5, r2), 0.32);
      }
      await ctx.yield();
      const c = iA.length / 4;
      if (c) {
        const runMat = new THREE.ShaderMaterial({ uniforms: { ...fishU, uBoil: { value: new THREE.Vector4(5, 11, 0.55, 0.6) }, uGrow: { value: 0 } }, vertexShader: FISH_VERT, fragmentShader: FISH_FRAG, fog: true, vertexColors: true, side: THREE.DoubleSide });
        runFile = new THREE.Mesh(instancedGeo(geoMid, c, { iA: new Float32Array(iA), iB: new Float32Array(iB), iC: new Float32Array(iC) }), runMat);
        runFile.name = 'runFile'; runFile.frustumCulled = false; runFile.userData.zMax = zMax; runFile.userData.grow = runMat.uniforms.uGrow; scene.add(runFile); fishCount += c;
      }
    }
    const holdLots = [], HOLD_AIR = [-0.25, 0];
    // THE POOL'S HOLDING COMPANY (the design: 'down into the pool: green dusk, hundreds of fish holding nose to current 3 m
    // away'): sockeye holding in the pool's deep water beside every metre the route swims under water there (the eye a
    // metre and more under, from end to end of the pool reach of the shoal's table: HOLD_Z, both ends read from it),
    // HOLD_PER_M of them to a metre of it, by turns on its left and its right, HOLD_OFF metres off its line in plan,
    // stacked through the depth from 0.6 m over the bed up to HOLD_TOP (2 m under the surface), noses to the current,
    // swaying on station as the other holders do (the same shader, the same law of motion). None where the water is
    // kept clear: the sight line to the sitting bear and the bear itself (inSight); none whose body comes nearer the
    // route than the neighbours' 2.6 m, nor nearer than HOLD_OFF[0] to any part of its line (the run-up and the leap
    // line are the route's own, kept by that clearance); none on a fish that is there already (the queue under the
    // falls among them, whose last fish hold up to 2 m into the pool reach; the wall's and the boil's holders stand
    // nearer the face than the reach begins); none within a body's room (HOLD_ROOM, the room they keep from one
    // another) of any place a companion can be as the eye runs the route (the middle of its sway at each point of
    // its track, and the sway's own reach about it): the eight ride beside the eye, and in the pool at the depth
    // the company holds at. The full fish within HOLD_FULL metres of the line, the 214-triangle one
    // out to HOLD_LOD, the low one beyond. They are laid in lots by HOLD_BIN metres of the river, each lot with its
    // own bounds (a lot behind the eye is not drawn) and each shown by the water's sight. A stream of their own.
    // FROM THE AIR the company lies two metres and more under the surface it is seen through, where the water takes a
    // body's modelling: there each of them is drawn as the far shoal's fish are, the flat card of a sockeye on the same
    // station. The cards are laid in the same lots as the bodies (a card mesh to a lot, within the lot's own bounds, on
    // a material of the company's own with a uGrow for each lot), and a lot's cards are as large as the water's sight
    // makes the lot. The change is eased by the height of the eye over the surface at its place, wherever it is
    // (HOLD_AIR, metres, under the surface negative): bodies alone below HOLD_AIR[0], cards alone from HOLD_AIR[1] up,
    // between the two both, the bodies shrinking as the cards grow. A quarter metre under the surface: inside the
    // crossing's own blend of the two pictures, so that no body is small while the eye's picture is wholly the water's.
    // The surface itself: from there up the air's whole scene is drawn, the forest, the banks and the sky, the heaviest
    // pictures of the flight, and the bodies are never drawn with it: over the water the company is four triangles a fish.
    {
      const kr = own('poolHolders'), HOLD_PER_M = 1.5, POOL = reaches.find((R) => R.name === 'pool'), HOLD_Z = [POOL.z0, POOL.z1], HOLD_OFF = [3, 7], HOLD_TOP = -2, HOLD_FULL = 3.25, HOLD_LOD = 4, HOLD_BIN = 10, HOLD_ROOM = [1, 0.7, 2.4];
      const p = new THREE.Vector3(), t = new THREE.Vector3(), cellsT = new Map(), cellsB = new Map();
      // (the fish that are there already, and each new one as it is seated, in cells of 3 m of the river: a body's room,
      // HOLD_ROOM, is a metre across, 0.7 m up and down and 2.4 m along, from the middle of one body to the middle of
      // the next. The points of the companions' tracks lie in cells of their own, cellsB, and are asked about by the
      // same measure. A place in a cell is its middle and its reach on each axis, how far the thing that is there
      // can be from that middle: nothing for a fish on its station, the sway's reach for a point of a track; the
      // room is measured from the nearest place within the reach. 'far' = how many cells either way are asked)
      const put = (x, y, z, cells = cellsT, rx = 0, ry = 0, rz = 0) => { const c = Math.floor(z / 3); let a = cells.get(c); if (!a) cells.set(c, a = []); a.push(x, y, z, rx, ry, rz); };
      const crowded = (x, y, z, cells = cellsT, far = 1) => {
        const c0 = Math.floor(z / 3);
        for (let c = c0 - far; c <= c0 + far; c++) { const a = cells.get(c); if (!a) continue; for (let i = 0; i < a.length; i += 6) { const dx = Math.max(Math.abs(x - a[i]) - a[i + 3], 0) / HOLD_ROOM[0], dy = Math.max(Math.abs(y - a[i + 1]) - a[i + 4], 0) / HOLD_ROOM[1], dz = Math.max(Math.abs(z - a[i + 2]) - a[i + 5], 0) / HOLD_ROOM[2]; if (dx * dx + dy * dy + dz * dz < 1) return true; } }
        return false;
      };
      { const olds = [];
        scene.traverse((m) => { const g = m.geometry; if (m.isMesh && m !== compMesh && g && g.getAttribute('iA') && g.getAttribute('iB') && g.getAttribute('iC') && !m.name.startsWith('shoal-far')) olds.push(m); });
        for (const m of olds) {
          const A = m.geometry.getAttribute('iA').array, B = m.geometry.getAttribute('iB').array, n = m.geometry.instanceCount;
          for (let i = 0; i < n; i++) { const z = A[i * 4 + 2]; if (B[i * 4] !== 0 && z > HOLD_Z[0] - 4 && z < HOLD_Z[1] + 4) put(A[i * 4], A[i * 4 + 1], z); }
          await ctx.yield();
        } }
      // THE COMPANIONS' TRACKS: where each of the eight can be as the eye runs the route, by their own law, called
      // (placeCompanions: the berths of COMP, the two leaders' COMP_A before the dive for the leap, a berth closing in
      // over a bar, the arcs). The law places a companion by the eye's place on the route and by the engine's time,
      // which at a place is not the same from flight to flight: time carries the companion's sway about its berth.
      // So at a point of the route (one for every half of the room's least measure of the route's own metres) the
      // law is called for a row of moments: the flight's own for the place (tAt) and HOLD_ROW more, spread evenly
      // through the flight's time (tAt(0) to tAt(1)) and shifted from point to point by the golden section of
      // their spacing, so that the rows of neighbouring points fall between one another's moments. Of each
      // companion's least and greatest x, y and z over the row the middle is the point of its track there and half
      // their difference the reach of its sway there, each axis for itself: both are laid in cellsB, and a seat
      // keeps its room from the nearest place within that reach of the point (crowded). The reach is the point's
      // own, not the greatest of all: at half of the pool's points the sway's is no more than 0.28 m across, 0.09 m
      // in height and 0.5 m along (the law's own sines); but where the route bends tightly the sway fore and aft
      // swings a berth that lies metres to the side round the bend, and where the route dives it carries the
      // companion through the depth at which it comes up awash (by rows of 32 moments on three seeds 1.25 m
      // across, 0.56 m in height and 1.62 m along at the most among the points a seat can lie near).
      // A ROW SO SHORT DOES NOT FIND THE WHOLE SWAY, and a long one costs the build seconds (rows of 32 moments:
      // three). So HOLD_SHORT is added to every reach: the furthest, on any axis, that a companion where a seat
      // can lie near it was found outside the nearest reach of its own track (of the eight points either side),
      // the law run at every point given a row for 512 moments through five minutes: 0.160, 0.140 and 0.147 m on
      // seeds 3, 7 and 11. The sway fore and aft carries a companion along its own track, so what the row of one
      // point misses the rows of its neighbours find, if their moments are not the same: rows of four so shifted
      // come within 0.08 m of rows of eight unshifted (0.122, 0.147 and 0.076 m) at half the calls, and unshifted rows of
      // four worse (0.200, 0.302 and 0.162 m). The measure is made at the points of the route; half-way between
      // two of them it is greater (0.278, 0.283 and 0.288 m), which is the points' spacing and is not added.
      // The rows are made only where a seat can ask: the first call of a row, the flight's own moment, marks the
      // points of the route at which any companion lies within HOLD_FAR cells of the cells of HOLD_Z, which are the
      // cells a seat asks crowded about for a track (two cells, 6 m: the room's 2.4 m along the river, twice the
      // widest reach, which is 1.63 m, and HOLD_SHORT lie within them). The page is asked back after every HOLD_ASK
      // calls of the law (three times the 64 of the tracks' first version: about 12 ms where the build was timed, a
      // quarter of what one step of a build may take; the engine returns at once if its slice is not used up). Then the
      // companions are placed for the flight's start again; update places them every frame
      const HOLD_ROW = 4, HOLD_SHORT = 0.16, HOLD_FAR = 2, HOLD_ASK = 192;
      {
        const cA = Math.floor(HOLD_Z[0] / 3) - HOLD_FAR, cB = Math.floor(HOLD_Z[1] / 3) + HOLD_FAR, T0 = tAt(0), T1 = tAt(1), lo = new Float32Array(24), hi = new Float32Array(24), turn = (Math.sqrt(5) - 1) / 2;
        const seen = () => { for (let j = 0; j < 24; j++) { const v = compA[(j / 3 | 0) * 4 + j % 3]; lo[j] = Math.min(lo[j], v); hi[j] = Math.max(hi[j], v); } };
        for (let d = 0, rows = 0, calls = 0; d <= L; d += Math.min(...HOLD_ROOM) / 2) {
          if (calls >= HOLD_ASK) { calls = 0; await ctx.yield(); }
          placeCompanions(d / L, tAt(d / L)); calls++;
          let near = false; for (let j = 0; j < 8; j++) { const c = Math.floor(compA[j * 4 + 2] / 3); near = near || (c >= cA && c <= cB); }
          if (!near) continue;
          lo.fill(Infinity); hi.fill(-Infinity); seen();
          const shift = (++rows * turn) % 1;
          for (let m = 0; m < HOLD_ROW; m++) { placeCompanions(d / L, lerp(T0, T1, (m + shift) / HOLD_ROW)); seen(); calls++; }
          for (let j = 0; j < 24; j += 3) put((lo[j] + hi[j]) / 2, (lo[j + 1] + hi[j + 1]) / 2, (lo[j + 2] + hi[j + 2]) / 2, cellsB, (hi[j] - lo[j]) / 2 + HOLD_SHORT, (hi[j + 1] - lo[j + 1]) / 2 + HOLD_SHORT, (hi[j + 2] - lo[j + 2]) / 2 + HOLD_SHORT);
        }
      }
      placeCompanions(0, 0);
      const lots = new Map(), step = 1 / HOLD_PER_M; let k = 0, metres = 0;
      for (let d = 0, i = 0; d < L; d += step, i++) {
        if ((i & 255) === 255) await ctx.yield();
        path.posAtDist(d, p); if (p.z < HOLD_Z[0] || p.z > HOLD_Z[1] || p.y > -DUSK_EYE[0]) continue;
        path.tangentAtDist(d, t); metres += step;
        const h = Math.hypot(t.x, t.z) || 1, sd = k++ % 2 ? 1 : -1;
        if ((k & 3) === 3) await ctx.yield();
        for (let tries = 0; tries < 6; tries++) {
          const r1 = kr(), r2 = kr(), r3 = kr(), r4 = kr(), r5 = kr(), r6 = kr(), r7 = kr(), r8 = kr();        // (eight draws a try, whatever comes of it)
          // (its own side first; if no seat is found there in three tries, the other side)
          const off = sd * (tries < 3 ? 1 : -1) * lerp(HOLD_OFF[0], HOLD_OFF[1], Math.pow(r1, 1.3)), x = p.x - (t.z / h) * off, z = p.z + (t.x / h) * off + (r2 - 0.5) * 1.2;
          if (z < HOLD_Z[0] || z > HOLD_Z[1] || edgeD(x, z) > -4 || inSight(x, z)) continue;
          const bot = height(x, z) + 0.6; if (HOLD_TOP - bot < 0.3) continue;
          const y = lerp(bot, HOLD_TOP, r3), size = lerp(0.9, 1.15, r4), yaw = (r5 - 0.5) * 0.32, dq = path.distanceTo(x, y, z);
          if (dq < HOLD_OFF[0] || bodyClear(x, y, z, size, yaw) < 2.6 || crowded(x, y, z)) continue;
          // (nor within a body's room of any place a companion's sway was found to carry it to at the points of its track)
          if (crowded(x, y, z, cellsB, HOLD_FAR)) continue;
          put(x, y, z);
          const tier = dq < HOLD_FULL ? 0 : dq < HOLD_LOD ? 1 : 2, key = tier + ':' + Math.floor(z / HOLD_BIN);
          let lot = lots.get(key); if (!lot) lots.set(key, lot = { tier, iA: [], iB: [], iC: [] });
          lot.iA.push(x, y, z, r6); lot.iB.push(size, yaw, 0, 1); lot.iC.push(r7, (r8 - 0.5) * 0.1, lerp(5, 7.5, r2), 0.5);
          break;
        }
      }
      await ctx.yield();
      // (the company's card: the far shoal's card, its program's text with a uGrow added; the shared cardMat is as it was)
      const holdCardVert = CARD_VERT.replace('attribute vec3 aQ;', 'uniform float uGrow; attribute vec3 aQ;').replace('sc = iB.x;', 'sc = iB.x*uGrow;');
      const held = [0, 0, 0];
      for (const lot of lots.values()) {
        const c = lot.iA.length / 4, lo = [1e9, 1e9, 1e9], hi = [-1e9, -1e9, -1e9];
        for (let i = 0; i < c; i++) for (let j = 0; j < 3; j++) { const v = lot.iA[i * 4 + j]; lo[j] = Math.min(lo[j], v); hi[j] = Math.max(hi[j], v); }
        // (its bounds: the lot's own fish, and 2.4 m round them for a body's length and its sway on station)
        const sphere = new THREE.Sphere(new THREE.Vector3((lo[0] + hi[0]) / 2, (lo[1] + hi[1]) / 2, (lo[2] + hi[2]) / 2), Math.hypot(hi[0] - lo[0], hi[1] - lo[1], hi[2] - lo[2]) / 2 + 2.4);
        const mesh = new THREE.Mesh(instancedGeo([geoNear, geoLod, geoMid][lot.tier], c, { iA: lot.iA, iB: lot.iB, iC: lot.iC }, sphere), fishMat);
        mesh.name = 'poolHolders'; scene.add(mesh); bySight(mesh); fishCount += c; held[lot.tier] += c;
        // (the lot's cards: the same fish on the same stations, within the same bounds)
        const geo = new THREE.InstancedBufferGeometry();
        geo.index = geoCard.index; geo.setAttribute('position', geoCard.getAttribute('position')); geo.setAttribute('aQ', geoCard.getAttribute('aQ'));
        for (const key of ['iA', 'iB', 'iC']) geo.setAttribute(key, mesh.geometry.getAttribute(key));
        geo.instanceCount = c; geo.boundingSphere = sphere;
        const cards = new THREE.Mesh(geo, new THREE.ShaderMaterial({ uniforms: { ...cardU, uGrow: { value: 0 } }, vertexShader: holdCardVert, fragmentShader: CARD_FRAG, fog: true, side: THREE.DoubleSide }));
        cards.name = 'poolHolders-air'; cards.visible = false; scene.add(cards); holdLots.push({ body: mesh, cards });
        await ctx.yield();
      }
      beats.holders = held; beats.holdMetres = Math.round(metres);
    }
    sit.rear2.value.set(0, 0.3, 0, 0);                                                              // it fishes with its head down, the ears just awash
    // as we come up the pool it drives its muzzle down after a fish (update: rear2.y), and the air it takes down with it
    // bursts up round its head
    let muzzleBub = null, muzzleFoam = null;
    {
      const mr = makeRng((((ctx.seed ?? 1) | 0) * 2477 + 31) >>> 0), items = [], mx = shelf.x + sitF[0] * 4.0, mz = shelf.z + sitF[1] * 4.0;
      for (let i = 0; i < 110; i++) {
        const a = mr() * 6.283, r = mr.range(0.1, 1.0), size = 0.07 + 0.2 * Math.pow(mr(), 2);
        items.push({ p: [mx + Math.cos(a) * r, mr.range(-3.1, -2.1), mz + Math.sin(a) * r, mr()], v: [Math.cos(a) * mr.range(0.05, 0.4), mr.range(0.55, 1.25), Math.sin(a) * mr.range(0.05, 0.4), size], l: [mr.range(1.5, 2.5), mr.range(0.05, 0.14), 0, mr.range(0.2, 0.9)] });
      }
      muzzleBub = mkBubbles(items, 0, [1, 1, 0.97], -0.12, 'muzzleBubbles');
      const foam = [];
      for (let i = 0; i < 22; i++) { const a = mr() * 6.283, r = mr.range(0, 0.8); foam.push({ p: [mx + Math.cos(a) * r, mr.range(-3.0, -2.0), mz + Math.sin(a) * r, mr()], v: [Math.cos(a) * 0.2, mr.range(0.3, 0.7), Math.sin(a) * 0.2, mr.range(0.4, 0.75)], l: [mr.range(1.4, 2.4), 0.05, 0.5, 0.3] }); }
      muzzleFoam = mkBubbles(foam, 1, [1, 1, 0.96], -0.1, 'muzzleFoam');
    }
    const sitHead = new THREE.Vector3(shelf.x + sitF[0] * 0.6, 0.75, shelf.z + sitF[1] * 0.6);      // the middle of what stands above the water
    surfU.uHole.value.set(sitHead.x, sitHead.y, sitHead.z, 2.25); surfU.uHoleAx.value.set(sitF[0] * 3.9, 0, sitF[1] * 3.9);
    // the sky behind its back, for the eye under water: a sheet that stands behind the bear and turns to face the eye.
    // The ceiling hides all of it but what shows through the opening above the bear (SURF_FRAG, uHole)
    const winU = { ...lightU, uWinTint: { value: new THREE.Color(...(lookId === 'dawn' ? [0.97, 0.92, 0.88] : lookId === 'evening' ? [1, 0.92, 0.82] : [0.86, 0.95, 0.95])) }, uAt: { value: new THREE.Vector3(sitHead.x, 0.16, sitHead.z) }, uSkyHor: surfU.uSkyHor, uSkyAir: surfU.uSkyAir, uCeil: surfU.uCeil, uWK: surfU.uWK };
    const poolWindow = new THREE.Mesh(new THREE.PlaneGeometry(2, 1, 1, 1), new THREE.ShaderMaterial({ uniforms: winU, transparent: true, depthWrite: false, side: THREE.DoubleSide, fog: false,
      vertexShader: /* glsl */`
uniform vec3 uCam, uAt; varying vec3 vW; varying vec2 vQ;
void main(){
  vec2 to = uAt.xz - uCam.xz; to /= max(length(to), 1e-3);
  vec3 w = uAt + vec3(to.x, 0., to.y)*5.5 + vec3(-to.y, 0., to.x)*(position.x*11.) + vec3(0., (position.y + .5)*8., 0.);
  vW = w; vQ = vec2(position.x, position.y + .5);
  gl_Position = projectionMatrix*viewMatrix*vec4(w, 1.);
}`,
      fragmentShader: /* glsl */`
${GLSL_LIGHT}
uniform vec3 uSkyHor, uSkyAir, uCeil, uWinTint; uniform float uWK;
varying vec3 vW; varying vec2 vQ;
void main(){
  vec2 q = vec2(vW.x + vW.z, vW.y*1.3);
  float lens = vn(q*.9 + vec2(uTime*.5, -uTime*.35))*vn(q*2.1 - vec2(uTime*.4, uTime*.5));
  float net = smoothstep(.3, .75, vn(q*1.6 + vec2(-uTime*.3, uTime*.45)));
  // (what shows through the opening is the light of the froth round the bear: clots of white foam and bubbles with
  // green water between them, never a sheet of one colour)
  float b1 = vn(q*2.9 + vec2(uTime*.7, -uTime*1.1)), b2 = vn(q*6.1 - vec2(uTime*.5, uTime*1.5));
  float clot = smoothstep(.36, .7, b1*.66 + b2*.5);
  vec3 lightC = mix(uSkyHor*.9, uSkyAir*1.2, clamp(smoothstep(.0, .5, vQ.y) + .35*net, 0., 1.))*uWinTint;
  vec3 sky = mix(uCeil*1.35 + lightC*.12, lightC*(.6 + 1.2*lens), clot);
  float fd = uWK*length(uCam - vW)*.75;
  gl_FragColor = vec4(mix(uCeil, sky, exp(-fd*fd)), 1.);
}` }));
    poolWindow.frustumCulled = false; poolWindow.renderOrder = -1; poolWindow.visible = false; poolWindow.name = 'poolWindow'; scene.add(poolWindow);
    await ctx.yield();

    // ---- the rare event: a boar charges the bear on the best notch; both rear, the loser goes off the ledge.
    // They fight along the lip (the line between them lies 25 degrees off it), so the run along the face sees both in
    // profile: the defender on the left facing right, the boar coming in from the right and from upstream.
    let fight = null;
    const FD = [0.906, -0.423];                       // the way the defender faces (x, z)
    if (rare) {
      // where: the loser goes at beats.fall, when we have just passed them on the swing along the face; the pair
      // stands some 10 m behind us along the lip then, in the widest gap between the lip bears near there, and never
      // within 24 m of the apex bear (the winner must not stand behind its head at the snap)
      beats.fall = beats.slantTo - 0.0305;
      path.pointAt(beats.fall, _pv);
      const xWant = Math.min(_pv.x - 8.5, A.bears[A.apexBear].position.x - 26);
      let xD = 0, bestGap = -1;
      for (let x = xWant - 14; x <= xWant + 14; x += 1) { if (x > A.bears[A.apexBear].position.x - 24 || x < -62) continue; let gap = 1e9; for (const b of A.bears) gap = Math.min(gap, Math.abs(b.position.x - x), Math.abs(b.position.x - x - 3)); if (thirdX !== null) gap = Math.min(gap, Math.abs(thirdX - x) + 1.5, Math.abs(thirdX - x - 3) + 1.5); const score = Math.min(gap, 11) - Math.abs(x - xWant) * 0.2; if (score > bestGap) { bestGap = score; xD = x; } }
      const yC = hero.crestAt(xD) - 0.06, zD = -2.2, SEP = 3.3;
      const dfn = hero.addBears([{ x: xD, y: yC, z: zD, yaw: Math.atan2(FD[0], FD[1]), scale: 1.3, girth: 1.12, phase: 0.3, tint: 0.3, period: 60, offset: 30 }], { own: true, name: 'defender' });
      const atk = hero.addBears([{ x: xD + FD[0] * SEP, y: yC, z: zD + FD[1] * SEP, yaw: Math.atan2(-FD[0], -FD[1]), scale: 1.36, girth: 1.16, phase: 0.7, tint: 0.15, period: 60, offset: 30 }], { own: true, name: 'boar' });
      // the splash where the loser lands, 4 m out from the foot: a crown thrown out and up in a ring to 12 m, a column
      // in the middle, and broad soft billows of spray that hang in it (iV.w = radius). It has its own stream of numbers.
      for (let i = 0; i < 1300; i++) rng();        // (the draws the first splash took from the world's stream: everything built after it stays where it was)
      const sr = makeRng((((ctx.seed ?? 1) | 0) * 4513 + 291) >>> 0), n = 440, iP = new Float32Array(n * 4), iV = new Float32Array(n * 4), sxc = xD + 0.9, szc = 3.7;
      for (let i = 0; i < n; i++) {
        const a = sr() * 6.283, kind = i < 320 ? 0 : i < 400 ? 1 : 2;
        const r = kind === 0 ? sr.range(2.2, 8.5) : kind === 1 ? sr.range(0, 1.6) : sr.range(0.3, 4.5);
        const up = kind === 0 ? sr.range(10, 23) * (1 - r / 17) : kind === 1 ? sr.range(15, 25) : sr.range(6, 15);
        const size = kind === 2 ? sr.range(0.75, 1.3) : sr.range(0.2, 0.5);
        iP.set([sxc + Math.cos(a) * (1.2 + r * 0.14), 0.15, szc + Math.sin(a) * (1.2 + r * 0.14), sr() * (kind === 2 ? 0.3 : 0.22)], i * 4);
        iV.set([Math.cos(a) * r, up, Math.sin(a) * r * 0.8 + 1.2, size], i * 4);
      }
      const sg = new THREE.InstancedBufferGeometry(); sg.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3)); sg.setIndex([0, 1, 2, 0, 2, 3]);
      sg.setAttribute('iP', new THREE.InstancedBufferAttribute(iP, 4)); sg.setAttribute('iV', new THREE.InstancedBufferAttribute(iV, 4)); sg.instanceCount = n;
      const sm = new THREE.ShaderMaterial({ uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), uT: { value: -1 }, uVH: { value: 450 }, uFloor: { value: -0.25 }, uWhiteK: { value: 1 }, uSunCol: HU.uSunCol, uSkyCol: HU.uSkyCol }, vertexShader: SPLASH_VERT, fragmentShader: SPLASH_FRAG, fog: true, transparent: true, depthWrite: false });
      const splash = new THREE.Mesh(sg, sm); splash.frustumCulled = false; splash.renderOrder = 7; splash.name = 'fightSplash'; scene.add(splash);
      const mD = mirrorBear(xD, 1.2, 1.3, yC), mA = mirrorBear(xD + FD[0] * SEP, 1.2, 1.36, yC); mA.w = 0;
      fight = { dfn, atk, splash: sm, xD, zD, sxc, szc, mD, mA, yC, SEP };
      beats.rareX = xD; beats.bearsX = A.bears.map((b) => Math.round(b.position.x));
    }
    const setFight = (tf, time) => {
      // tf = seconds since the loser began to go; the pair came up on their hind legs 3.4 s before
      if (!fight) return;
      const tt = tf + 3.4, up = ss(-1.9, -0.5, tt), wr = ss(-0.4, 0.3, tt), tip = ss(0, 0.6, tf), drop = Math.max(0, tf - 0.42), gone = 1 - ss(0.5, 1.6, tf);
      // the boar: charges in from upstream along the line of the fight (plunging), rears as it arrives, shoves, and drops back to all fours
      const run = 1 - ss(-4.6, -0.9, tt), plunge = Math.abs(Math.sin(tt * 6.5)) * run * (1 - run) * 4, take = ss(0.7, 3.4, tf), shove = 1.3 * ss(-0.25, 0.4, tf) + 3.3 * take + 0.25 * Math.abs(Math.sin(tf * 5.5)) * take * (1 - take) * 4;       // and it takes the notch, plunging through the torrent
      fight.atk.rear.value.set(up * gone * (1.3 + 0.05 * Math.sin(time * 5.1) * wr) + 0.14 * plunge, FD[0] * (21 * run - shove) + Math.sin(time * 3.3) * 0.22 * wr * gone, -2.1 * run * run + 0.5 * plunge, FD[1] * (21 * run - shove));
      fight.atk.rear2.value.set(0, 0, wr * gone, 0);
      // the defender: rears, is shoved, tips back and over onto its left side (the pool's side), slides off the lip and falls
      const slide = 5.4 * ss(0.05, 1.0, tf);
      fight.dfn.rear.value.set(up * (1.3 + 0.05 * Math.sin(time * 4.3 + 1) * wr * (1 - tip)) + tip * 0.55, -FD[0] * 1.5 * tip + 0.42 * slide - Math.sin(time * 3.3) * 0.22 * wr * (1 - tip), -Math.min(11 * drop * drop, 13), -FD[1] * 1.5 * tip + 0.9 * slide);
      fight.dfn.rear2.value.set(tip * 0.95, 0, wr * (1 - 0.6 * tip), ss(0.05, 0.45, tf));
      const ws = tf - 1.0;
      fight.splash.uniforms.uT.value = ws;
      surfU.uWave.value.set(fight.sxc, fight.szc, ws > 0 ? 1.5 + 7.5 * ws : -100, ws > 0 ? 0.9 * Math.exp(-ws * 0.55) * ss(0, 0.25, ws) : 0);
      // and the pool's mirror of the pair: tall while they are reared, the loser's gone as it tips
      fight.mD.set(fight.xD + 0.42 * slide - FD[0] * 1.5 * tip, 1.9, fight.yC + lerp(6, 10.5, up), 1 - ss(0.25, 0.8, tf));
      fight.mA.set(fight.xD + FD[0] * (fight.SEP + 21 * run - shove), 1.9, fight.yC + lerp(6, 10.5, up * gone), 1 - run);
    };

    // ---- the tail of the pool: gulls squabbling over a carcass on the gravel spit in the near ground; beyond them a
    // pale grey wolf on the brink of the cut bank with a sockeye crosswise in its jaws, young spruce on the bar behind it
    const furMat = propMat([5.5, 2.2, 0.3, 0.12]);
    const carcassAt = [spit.x + 0.6, spit.z - 1.6];
    // (the spit stands whole from 3.4 m of the route in plan, and the carcass reaches 1.9 m from its centre toward the
    // route: its centre is moved west by quarter metres, twelve at most, until it lies 5.3 m or more from the route)
    for (let k = 0; k < 12 && nearRoute(carcassAt[0], carcassAt[1]).dist < 5.3; k++) carcassAt[0] -= 0.25;
    // THE WOLF STANDS BY A RULE OF THE PLACE, not at a place typed for it. The brink of the cut bank is the bank's own
    // edge, read from the height field: the line along which the ground stands BRINK metres over the river (under it
    // the wet face that the current cuts, over it the crown where the reedgrass begins). The route comes up onto the
    // tail of the pool at beats.wolf (the brief's beat). The wolf stands where that brink lies WOLF_D = 24 m (the
    // brief's distance) from that point of the route, on the face that meets the current (of the places where the
    // 24 m circle crosses the brink, the one furthest upstream); it stands SETBACK back from the edge, its forefeet on
    // the lip of the crown, square to the edge with its nose out over the water. It trots on TROT metres along the
    // brink, away from the gulls' squabble at the carcass. The second wolf, when the cast has one, stands a seeded few
    // metres beyond the end of that trot on the same brink and watches the first one come.
    const BRINK = 0.75, WOLF_D = 24, SETBACK = 2.0, TROT = 7.25;
    const WOLF_ROOM = 3.2;      // the wolves' standing room, in metres (the reedgrass keeps this far from where a wolf stands)
    const wolfAt = [0, 0], wolfTo = [0, 0], wolf2At = [0, 0]; let wolfYaw0 = 0, wolf2Yaw = 0;
    {
      const Pw = path.pointAt(beats.wolf, new THREE.Vector3());
      // the ground's slope at a place: (uphill x, uphill z, metres of rise per metre)
      const slope = (x, z) => { const gx = heightRaw(x + 0.4, z) - heightRaw(x - 0.4, z), gz = heightRaw(x, z + 0.4) - heightRaw(x, z - 0.4), l = Math.hypot(gx, gz) || 1e-6; return [gx / l, gz / l, l / 0.8]; };
      // from a place near the brink, straight up or down the slope onto it
      const toBrink = (x, z) => { for (let k = 0; k < 6; k++) { const g = slope(x, z), e = clamp((heightRaw(x, z) - BRINK) / Math.max(g[2], 0.08), -0.7, 0.7); x -= g[0] * e; z -= g[1] * e; } return [x, z]; };
      let b0 = null, was = null, wa = 0;
      for (let i = 0; i <= 720; i++) {
        const a = (i / 720) * 6.2832, x = Pw.x + Math.cos(a) * WOLF_D, z = Pw.z + Math.sin(a) * WOLF_D, dry = heightRaw(x, z) > BRINK && edgeD(x, z) < 0;
        if (was !== null && dry !== was) { const am = (a + wa) * 0.5, q = toBrink(Pw.x + Math.cos(am) * WOLF_D, Pw.z + Math.sin(am) * WOLF_D); if (!b0 || q[1] < b0[1]) b0 = q; }
        was = dry; wa = a;
      }
      if (!b0) b0 = toBrink(bar.x, bar.z - bar.rz);
      await ctx.yield();
      // along the brink in steps of a quarter metre, from 3 m before that place: where the wolf would stand at each step
      const g0 = slope(b0[0], b0[1]), sense = (-g0[1] * (b0[0] - carcassAt[0]) + g0[0] * (b0[1] - carcassAt[1])) > 0 ? 1 : -1, DS = 0.25, stand = [];
      let x = b0[0], z = b0[1];
      for (let i = 0; i < 12; i++) { const g = slope(x, z); [x, z] = toBrink(x + g[1] * sense * DS, z - g[0] * sense * DS); }
      for (let i = 0; i < 100; i++) { const g = slope(x, z); stand.push([x + g[0] * SETBACK, z + g[1] * SETBACK, g[0], g[1]]); [x, z] = toBrink(x - g[1] * sense * DS, z + g[0] * sense * DS); }
      await ctx.yield();
      let i0 = 0, best = 1e9;
      for (let i = 0; i < 25; i++) { const e = Math.abs(Math.hypot(stand[i][0] - Pw.x, stand[i][1] - Pw.z) - WOLF_D); if (e < best) { best = e; i0 = i; } }
      const w2 = own('wolf2'), i1 = i0 + Math.round(TROT / DS), i2 = Math.min(stand.length - 1, i1 + Math.round(w2.range(3.5, 6.5) / DS));
      wolfAt[0] = stand[i0][0]; wolfAt[1] = stand[i0][1]; wolfTo[0] = stand[i1][0]; wolfTo[1] = stand[i1][1]; wolf2At[0] = stand[i2][0]; wolf2At[1] = stand[i2][1];
      // (it turns from the water to its way along the brink by the shorter way round)
      const yaw1 = Math.atan2(wolfTo[0] - wolfAt[0], wolfTo[1] - wolfAt[1]); let dy = Math.atan2(-stand[i0][2], -stand[i0][3]) - yaw1; dy -= Math.round(dy / 6.2832) * 6.2832;
      wolfYaw0 = yaw1 + dy;
      wolf2Yaw = Math.atan2(wolfTo[0] - wolf2At[0], wolfTo[1] - wolf2At[1]) + w2.range(-0.3, 0.3);
    }
    // (the carcass and the gulls, which update() switches with the wolves by the eye's place)
    const onBar = [];
    const wolfYaw1 = Math.atan2(wolfTo[0] - wolfAt[0], wolfTo[1] - wolfAt[1]), wolfLen = Math.hypot(wolfTo[0] - wolfAt[0], wolfTo[1] - wolfAt[1]);
    // each wolf has its own material (the same program): uGait poses its legs, head and tail (WOLF_VERT). At night the
    // moon rims it, or it is lost against the spruce
    const wolfMat = () => new THREE.ShaderMaterial({ uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...lightU, uGrain: { value: new THREE.Vector4(5.5, 2.2, 0.3, night ? 1.6 : 0) }, uFogK: { value: 1 }, uTone: { value: night ? 1.5 : 1 }, uAlgae: { value: 0 }, uGait: { value: new THREE.Vector4(0, 0, 0, 0) } },
      vertexShader: WOLF_VERT, fragmentShader: PROP_FRAG, fog: true, vertexColors: true, side: THREE.DoubleSide });
    const mkWolf = (geo, x, z, yaw, s) => { const g = new THREE.Group(), m = new THREE.Mesh(geo, wolfMat()); m.name = 'wolf'; g.add(m); g.position.set(x, height(x, z) - 0.06, z); g.rotation.y = yaw; g.scale.setScalar(s); scene.add(g); g.userData.gait = m.material.uniforms.uGait.value; return g; };
    await ctx.yield();
    const wolfGeo = wolfGeometry(true, look.season === 'july');
    await ctx.yield();
    const wolf = mkWolf(wolfGeo, wolfAt[0], wolfAt[1], wolfYaw0, 1), wolfY = wolf.position.y, wolfY1 = height(wolfTo[0], wolfTo[1]) - 0.06, wolfGait = wolf.userData.gait;
    let wolf2Gait = null, wolf2 = null;
    if (cast.secondWolf) { const g2 = wolfGeometry(false); await ctx.yield(); wolf2 = mkWolf(g2, wolf2At[0], wolf2At[1], wolf2Yaw, 0.9); wolf2Gait = wolf2.userData.gait; }
    await ctx.yield();
    {
      const B = makeBuilder();
      limpFish(B, [0, 0.15, 0], X3, Z3, Y3, 2.1, 0, true, look.season === 'july'); limpFish(B, [0.7, 0.14, 1.5], [0.5, 0, 0.866], [-0.866, 0, 0.5], Y3, 1.8, 0, true, look.season === 'july');
      const cm = new THREE.Mesh(B.build(), furMat); cm.position.set(carcassAt[0], height(carcassAt[0], carcassAt[1]) + 0.03, carcassAt[1]); cm.rotation.set(-0.16, 0.35, 0); cm.name = 'carcass'; onBar.push(cm); scene.add(cm);
      await ctx.yield();
      // seven standing round the carcass and three hanging over the squabble on beating wings, each at its own offset from the
      // carcass's centre (a standing one a quarter metre or less off that in x and in z). A gull is set 0.02 m under
      // the ground at its place, or 0.02 m under the level -0.06 where the ground there is lower than that (under
      // the water, whose level is 0 here: such a gull stands at the water's face); a hanging one is set its own
      // height over that. The route passes 5.3 m or more to the carcass's right
      const gr = rng.fork('standing'), n = 10, iA = new Float32Array(n * 4), iB = new Float32Array(n * 4);
      const STAND = [[0.3, 1.9], [-1.0, 2.9], [-2.5, 1.8], [-3.1, -0.5], [-2.2, -2.6], [0.2, -1.5], [-1.3, 0.7]], HOVER = [[-4.0, 0.6, 1.25], [-1.2, -1.6, 2.35], [0.6, -3.4, 1.75]];
      for (let i = 0; i < n; i++) {
        const hov = i >= 7, q = hov ? HOVER[i - 7] : STAND[i], x = carcassAt[0] + q[0] + (hov ? 0 : gr.range(-0.25, 0.25)), z = carcassAt[1] + q[1] + (hov ? 0 : gr.range(-0.25, 0.25));
        iA.set([x, Math.max(height(x, z), -0.06) - 0.02 + (hov ? q[2] : 0), z, Math.atan2(carcassAt[0] - x, carcassAt[1] - z) + gr.range(-0.4, 0.4)], i * 4); iB.set([gr(), gr.range(3.2, 6.5), gr.range(0.9, 1.08), hov ? 1 : 0], i * 4);
      }
      await ctx.yield();
      const gullGeo = gullGeometry();
      await ctx.yield();
      const gm = new THREE.Mesh(instancedGeo(gullGeo, n, { iA, iB }), new THREE.ShaderMaterial({ uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...lightU }, vertexShader: GULL_VERT, fragmentShader: GULL_FRAG, fog: true, vertexColors: true, side: THREE.DoubleSide }));
      gm.frustumCulled = false; gm.name = 'gulls'; onBar.push(gm); scene.add(gm);
    }
    await ctx.yield();
    // ---- the mergansers: eight rest on the upper river to the right of the leap line, a ragged raft 48 to 76 m above
    // the lip. Each takes fright when the route brings the eye within 23 m of where it floats (the nearest first, each
    // after a moment of its own) and patters away across the water to the right and a little upstream, wings beating,
    // a puff of spray at every footfall and a ring spreading from it, and lifts off before it reaches the bank. Their
    // clock is the flight's own (seconds of flight at u), so every bird is where a flight would have it.
    const duckU = { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...lightU, uGo: { value: -10 }, uSize: { value: 1.05 } };
    const duckRun = (sd) => 2.5 * sd + 1.6 * sd * sd, duckV = surfU.uDuck.value; let tDuck0 = 1e9;
    {
      const n = 8, iA = new Float32Array(n * 4), iB = new Float32Array(n * 4), sP = [], sV = [], duckL = surfU.uDuckL.value, at = [];
      const dr = makeRng((((ctx.seed ?? 1) | 0) * 6689 + 53) >>> 0), FRIGHT = 23;
      for (let i = 0; i < n; i++) {
        const r1 = rng(), r2 = rng(), r3 = rng(), r4 = rng();              // (four draws a bird, as before)
        let x0 = lx + 3.5 + 11.5 * r1, z0 = -48 - 28 * r2;
        for (let tries = 0; tries < 30 && at.some((a) => Math.hypot(a[0] - x0, a[1] - z0) < 2.4); tries++) { x0 = lx + dr.range(3.5, 15); z0 = dr.range(-76, -48); }
        at.push([x0, z0]);
        // the second of the flight at which the eye first comes within the fright distance of it
        let uF = 1; for (let k = 0; k <= 400; k++) { const u = beats.splash + (1 - beats.splash) * k / 400; path.pointAt(u, _pv); if (Math.hypot(_pv.x - x0, _pv.z - z0) < FRIGHT) { uF = u; break; } }
        const start = tAt(uF) + 0.05 + 0.45 * r3, hd = 1.93 + (r4 - 0.5) * 0.6, dx = Math.sin(hd), dz = Math.cos(hd);
        // it runs until 9 m short of the bank (never less than 5 m), then lifts
        let toBank = 5; while (toBank < 70 && edgeD(x0 + dx * (toBank + 9), z0 + dz * (toBank + 9)) < 0) toBank += 1.5;
        const liftAt = (-2.5 + Math.sqrt(6.25 + 6.4 * toBank)) / 3.2, lift = dr.range(1.5, 3.2);
        tDuck0 = Math.min(tDuck0, start); beats.ducks = Math.min(beats.ducks ?? 1, uF);
        iA.set([x0, z0, start / 1.1, hd], i * 4); duckV[i].set(x0, z0, start, hd);
        iB.set([dr(), dr.range(21, 30), lift, liftAt], i * 4); duckL[i] = duckRun(liftAt + 0.25);
        // footfalls: every 1.25 m of its run (the surface draws their rings), each throwing a few drops up and back
        for (let k = 0; k < 20; k++) {
          const rk = 0.4 + 1.25 * k, sk = (-2.5 + Math.sqrt(6.25 + 6.4 * rk)) / 3.2, side = (k % 2 ? 0.2 : -0.2), gone = rk > duckL[i];
          for (let j = 0; j < 4; j++) {
            sP.push(x0 + dx * rk + dz * side + dr.range(-0.2, 0.2), LIP + 0.1, z0 + dz * rk - dx * side + dr.range(-0.2, 0.2), (gone ? 999 : 0) + start + sk + dr.range(0, 0.06));
            sV.push(-dx * dr.range(0.3, 1.6) + dr.range(-0.9, 0.9), dr.range(3.2, 6.2), -dz * dr.range(0.3, 1.6) + dr.range(-0.9, 0.9), dr.range(0.09, 0.2));
          }
        }
      }
      const mesh = new THREE.Mesh(instancedGeo(duckGeometry(), n, { iA, iB }), new THREE.ShaderMaterial({ uniforms: duckU, vertexShader: DUCK_VERT, fragmentShader: DUCK_FRAG, fog: true, vertexColors: true, side: THREE.DoubleSide }));
      mesh.frustumCulled = false; mesh.name = 'mergansers'; scene.add(mesh);
      await ctx.yield();
      const sg = new THREE.InstancedBufferGeometry(); sg.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3)); sg.setIndex([0, 1, 2, 0, 2, 3]);
      sg.setAttribute('iP', new THREE.InstancedBufferAttribute(new Float32Array(sP), 4)); sg.setAttribute('iV', new THREE.InstancedBufferAttribute(new Float32Array(sV), 4)); sg.instanceCount = sP.length / 4;
      duckU.uSprayVH = { value: 450 };
      const spray = new THREE.Mesh(sg, new THREE.ShaderMaterial({ uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), uT: duckU.uGo, uVH: duckU.uSprayVH, uFloor: { value: LIP - 0.35 }, uWhiteK: { value: 0.8 }, uSunCol: HU.uSunCol, uSkyCol: HU.uSkyCol }, vertexShader: SPLASH_VERT, fragmentShader: SPLASH_FRAG, fog: true, transparent: true, depthWrite: false }));
      spray.frustumCulled = false; spray.renderOrder = 7; spray.name = 'duckSpray'; spray.userData.ur = [beats.ducks - 0.004, 1.01]; scene.add(spray); byU.push(spray);
    }
    await ctx.yield();

    // ---- birds from the kit: gulls squabbling over the carcass and wheeling over the falls, eagles soaring, one stooping
    const fauna = F.makeFauna(scene, { light: F.lightFrom(scene) });
    fauna.add(F.makeFlock({ rng: rng.fork('gulls'), species: 'gulls', count: Math.max(5, Math.round(cast.gulls * 0.5)), size: 2.2, center: [carcassAt[0] - 13, 13, carcassAt[1] + 3], radius: 6, spread: [5, 1.5, 6], speed: 6, wander: [1.5, 0.7, 1.5, 0.5] }));   // wheeling over the bank behind the spit, well clear of the route
    await ctx.yield();
    await ctx.yield();
    fauna.add(F.makeFlock({ rng: rng.fork('gulls2'), species: 'gulls', count: 14, size: 3, center: [(fx + lx) * 0.5, 22, 6], radius: 30, spread: [26, 5, 10] }));
    await ctx.yield();
    // (and a third wheel of gulls low over the middle of the pool, by the flock's own law the whole flight like the others:
    // the brief's thirty with the standing ones. The pool reach runs from z 15.5 to 76; the route under them never
    // rises 4 m over the water. A stream of their own)
    fauna.add(F.makeFlock({ rng: own('poolGulls'), species: 'gulls', count: 9, size: 3, center: [midX(46), 12, 46], radius: 22, spread: [20, 3, 14] }));
    await ctx.yield();
    fauna.add(F.makeFlock({ rng: rng.fork('eagles'), species: 'eagles', count: cast.eagles, size: 3, center: [10, 64, 30], radius: 55 }));
    await ctx.yield();
    fauna.add(F.makeFlock({ rng: rng.fork('stoop'), species: 'eagles', count: 1, size: 3.4, speed: 20, cross: { path, u: beats.eagle, lead: 26, angle: 112, side: -1, height: 8, span: 170, sag: 6.5, duration: DUR } }));
    await ctx.yield();

    // ---- forest: spruce ranks, gold birch and poplar, alder thickets, reedgrass on the cut banks and bars
    const fr = rng.fork('flora');
    const wind = flora.makeWind({ direction: [0.85, 0.5], strength: look.rain ? 1.4 : 1 });
    const leafOpts = { size: 512, alphaTest: 0.4, anisotropy: 2 };
    await flora.prepareLeafTexture(leafOpts, ctx.yield);            // the atlas, drawn in short steps
    const leafMap = flora.makeLeafTexture(leafOpts);
    await ctx.yield();
    const treeMat = flora.windMaterial({ wind, map: leafMap, backlight: 1.0, backlightTint: look.season === 'july' ? '#d8ff7a' : '#ffd468' });
    await ctx.yield();
    const SPR = { leaf: '#24452f', leafLight: '#5d8658', leafDark: '#0c1f16', bark: '#4a3a2c', barkDark: '#241a12', snow: look.snow ? 0.75 : 0, slim: 1.12 };
    const gold = new THREE.Color(look.gold), goldL = '#' + gold.clone().lerp(new THREE.Color('#fff2a8'), 0.45).getHexString(), goldD = '#' + gold.clone().multiplyScalar(0.45).getHexString();
    const bare = !look.birch, GOLD = bare ? { leaf: '#6e5c48', leafLight: '#9a8870', leafDark: '#3a3028' } : { leaf: look.gold, leafLight: goldL, leafDark: goldD };
    const spruceFar = [], spruceNear = [], poplars = [], birches = [];
    for (const h of [16, 18.5, 21]) { spruceFar.push(flora.coniferGeometry({ rng: fr, height: h, detail: 0, ...SPR })); await ctx.yield(); }
    for (const h of [17, 20]) { spruceNear.push(flora.coniferGeometry({ rng: fr, height: h, detail: 1, ...SPR })); await ctx.yield(); }
    for (const h of [12.5, 14.5]) { poplars.push(flora.cypressGeometry({ rng: fr, height: h, detail: 0, girth: bare ? 0.07 : 0.115, ...GOLD, bark: '#b8b0a0' })); await ctx.yield(); }
    for (const h of [13, 15]) { birches.push(flora.birchGeometry({ rng: fr, height: h, detail: 0, autumn: look.season !== 'july', foliage: !bare, ...(look.season === 'july' || bare ? {} : GOLD) })); await ctx.yield(); }
    const zN = (z) => clamp((445 - z) / 840, 0, 0.999);
    const spruceP = [], goldP = [], birchP = [], bushP = [], grassP = [];
    let cell = 0;
    for (let gz = -390; gz < 440; gz += 17) for (let gx = -275; gx < 325; gx += 17) {
      if ((++cell & 127) === 0) await ctx.yield();
      const x = gx + fr.range(-6.5, 6.5), z = gz + fr.range(-6.5, 6.5), d = edgeD(x, z);
      if (d < 7 || d > 100 || fr() > (d < 36 ? 0.96 : 0.96 * Math.exp(-(d - 36) / 30))) continue;
      const pdist = nearRoute(x, z).dist; if (pdist < 23) continue;
      const p = { x, y: heightRaw(x, z), z, s: 3 * fr.range(0.85, 1.18), rot: fr() * 6.283, d: pdist, u: zN(z) };
      if (fr() > (d < 24 ? 0.5 : 0.24)) spruceP.push(p); else if (pdist < 120 && birchP.length < 42) birchP.push(p); else goldP.push(p);
    }
    await ctx.yield();
    for (let z = -385; z < 440; z += 13) for (const side of [-1, 1]) {
      const x = midX(z) + side * (halfW(z) + fr.range(1.5, 8));
      const pdist = nearRoute(x, z).dist; if (pdist < 15 || (z < 16 && z > -48 && Math.abs(x) < 92)) continue;
      bushP.push({ x, y: heightRaw(x, z), z, s: fr.range(2.6, 4.3), rot: fr() * 6.283, d: pdist, u: zN(z) });
    }
    await ctx.yield();
    const nGrass = Math.round(3300 * (0.45 + 0.55 * detail));
    for (let i = 0; i < nGrass; i++) {
      if ((i & 255) === 255) await ctx.yield();
      let x, z;
      if (i % 9 === 0) { const a = fr() * 6.283, r = Math.sqrt(fr()) * 0.95, B = i % 27 === 0 ? ebar : bar; x = B.x + Math.cos(a) * r * B.rx; z = B.z + Math.sin(a) * r * B.rz; }
      else { z = fr.range(-385, 440); x = midX(z) + fr.sign() * (halfW(z) + 0.3 + 12.5 * Math.pow(fr(), 1.6)); if (z < 16 && z > -48 && Math.abs(x) < 90) continue; }
      const y = heightRaw(x, z); if (y < waterAt(z) + 0.7) continue;
      if (Math.abs(x) < 110 && nearRoute(x, z).dist < 8.5) continue;
      if ((x > fx + 3 && x < fx + 25 && z > 82 && z < 98.5) || ((x - fx - 21) / 11.5) ** 2 + ((z - 99.6) / 5.6) ** 2 < 1 || Math.hypot(x - ebar.x + 2, z - ebar.z - 4) < 9) continue;     // nothing tall between us and the wolf, nor gold behind it
      if (Math.hypot(x - wolfAt[0], z - wolfAt[1]) < WOLF_ROOM || Math.hypot(x - wolf2At[0], z - wolf2At[1]) < WOLF_ROOM) continue;     // no reedgrass within WOLF_ROOM metres of where a wolf stands, whatever the cast
      grassP.push({ x, y, z, s: fr.range(0.72, 1.25), rot: fr() * 6.283, d: 50, u: zN(z) });
    }
    // the wolf's feet stand in short grass, and it trots into a stand of reedgrass that takes its legs
    for (let i = 0; i < 54; i++) {
      const end = i >= 20, a = xr() * 6.283, r = Math.sqrt(xr()) * (end ? 2.9 : 2.3) + (end ? 0 : 0.5);
      const t = end ? xr.range(0.62, 1.12) : xr.range(-0.05, 0.5), cx = lerp(wolfAt[0], wolfTo[0], t), cz = lerp(wolfAt[1], wolfTo[1], t);
      const x = cx + Math.cos(a) * r * (end ? 1 : 0.8), z = cz + Math.sin(a) * r * (end ? 0.75 : 0.8), y = heightRaw(x, z); if (y < 0.75) continue;
      grassP.push({ x, y, z, s: end ? xr.range(0.5, 0.72) : xr.range(0.3, 0.46), rot: xr() * 6.283, d: 50, u: zN(z) });
    }
    const GR = look.season === 'july' ? ['#4a6a2a', '#b4c45c'] : look.snow ? ['#7a6a44', '#e6d8a4'] : ['#6a5626', '#e0bc5c'];
    await ctx.yield();
    const tufts = [0, 1].map((k) => flora.grassTuftGeometry({ rng: fr, cards: 3, width: 3.1 + k * 0.7, height: 4.0 + k * 0.7, root: GR[0], tip: GR[1] }));
    await ctx.yield();
    const groves = [];
    const clumpP = [];
    { const cr = rng.fork('clump'), tx = wolfTo[0] - wolfAt[0], tz = wolfTo[1] - wolfAt[1];
      for (let i = 0; i < 90 && clumpP.length < 18; i++) {
        const tall = clumpP.length < 6, a = cr() * 6.283, r = Math.sqrt(cr()), x = fx + 21 + Math.cos(a) * r * 9.5, z = 99.6 + Math.sin(a) * r * 4.2, sc = tall ? cr.range(0.8, 1.25) : cr.range(0.36, 0.6), rot = cr() * 6.283;
        const tt = clamp(((x - wolfAt[0]) * tx + (z - wolfAt[1]) * tz) / (tx * tx + tz * tz), 0, 1.3);
        if (Math.hypot(x - wolfAt[0] - tx * tt, z - wolfAt[1] - tz * tt) < 2.6 || Math.hypot(x - fx - 21, z - 94) < 3.2) continue;
        let ok = true; for (const q of clumpP) if (Math.hypot(q.x - x, q.z - z) < (tall ? 3.2 : 1.7)) ok = false;
        if (ok) clumpP.push({ x, y: heightRaw(x, z) - 0.12, z, s: sc, rot, d: 30, u: zN(z) });
      }
      // and the young spruce of the bar, by a rule of the bank: they take the crown of the bar, dealt evenly over it, none
      // nearer the brink than STAND_BACK (the floods scour the edge: at a spruce's foot and that far from it on every
      // side the ground stands over the brink's level), none on the wolves' way along the brink nor where one stands,
      // no two in one place. Whatever stands on the brink is seen against them (a stream of its own)
      const c2 = own('barSpruce'), n0 = clumpP.length, STAND_BACK = 3;
      const crown = (x, z) => heightRaw(x, z) > BRINK + 0.2 && heightRaw(x + STAND_BACK, z) > BRINK && heightRaw(x - STAND_BACK, z) > BRINK && heightRaw(x, z + STAND_BACK) > BRINK && heightRaw(x, z - STAND_BACK) > BRINK;
      for (let i = 0; i < 160 && clumpP.length < n0 + 16; i++) {
        const tall = clumpP.length < n0 + 7, a = c2() * 6.283, r = Math.sqrt(c2()), x = bar.x + Math.cos(a) * r * bar.rx, z = bar.z + Math.sin(a) * r * bar.rz, sc = tall ? c2.range(0.8, 1.2) : c2.range(0.36, 0.6), rot = c2() * 6.283;
        const tt = clamp(((x - wolfAt[0]) * tx + (z - wolfAt[1]) * tz) / (tx * tx + tz * tz), 0, 1.3);
        if (!crown(x, z) || Math.hypot(x - wolfAt[0] - tx * tt, z - wolfAt[1] - tz * tt) < 2.6 || Math.hypot(x - wolf2At[0], z - wolf2At[1]) < 3.2) continue;
        let ok = true; for (const q of clumpP) if (Math.hypot(q.x - x, q.z - z) < (tall ? 3.0 : 1.7)) ok = false;
        if (ok) clumpP.push({ x, y: heightRaw(x, z) - 0.12, z, s: sc, rot, d: 30, u: zN(z) });
      } }
    const grove = (variants, points, o = {}) => { if (!points.length) return; const g = flora.makeScatter({ rng: fr, variants, points, material: treeMat, chunks: 5, tint: 0.16, hue: 0.05, ...o }); scene.add(g.object); groves.push(g); };
    // the spruce go in by reach (three scatters), so no single call holds the page
    for (const [za, zb] of [[-1e4, -60], [-60, 150], [150, 1e4]]) { grove(spruceNear, spruceP.filter((q) => q.z >= za && q.z < zb), { farVariants: spruceFar, farDistance: 78, chunks: 2 }); await ctx.yield(); }
    grove(spruceNear, clumpP, { chunks: 1, tint: 0.1 });
    await ctx.yield();
    grove(poplars, goldP, { tint: 0.22 });
    await ctx.yield();
    grove(birches, birchP, { tint: 0.2 });
    await ctx.yield();
    const bushG = [0, 1].map(() => flora.bushGeometry({ rng: fr, size: 1.7, detail: 0, leaf: look.season === 'july' ? '#4f7a30' : '#9a8a2c', leafLight: look.season === 'july' ? '#9ab84e' : '#e0c850', leafDark: '#3a3a16' }));
    await ctx.yield();
    grove(bushG, bushP, { tint: 0.22 });
    await ctx.yield();
    for (const [za, zb] of [[-1e4, -20], [-20, 130], [130, 1e4]]) { grove(tufts, grassP.filter((q) => q.z >= za && q.z < zb), { tint: 0.22, tilt: 0.14, sink: 0.02, chunks: 2 }); await ctx.yield(); }

    // ---- the canopy map for the water's mirror (SURF_FRAG, tTrees): every tree, bush and grass tuft of the banks is
    // laid into it as a hill as high as it stands over the water and as wide as its crown (a cone for a spruce, a
    // dome for a birch, a column for a poplar), flagged gold or dark. The mirrored ray is walked over this map.
    {
      const D = TM.data, NX = TM.nx, NZ = TM.nz;
      const splat = (x, z, H, r, goldV, shape) => {
        const ci = (x - TM.x0) / TM.cell - 0.5, cj = (z - TM.z0) / TM.cell - 0.5, rr = r / TM.cell + 0.6;
        const i0 = Math.max(1, Math.floor(ci - rr)), i1 = Math.min(NX - 2, Math.ceil(ci + rr)), j0 = Math.max(1, Math.floor(cj - rr)), j1 = Math.min(NZ - 2, Math.ceil(cj + rr));
        for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
          const d = Math.hypot(i - ci, j - cj) / rr; if (d >= 1) continue;
          const h = H * (shape === 0 ? Math.pow(1 - d, 0.8) : shape === 1 ? Math.sqrt(1 - d * d) : 1 - 0.35 * d), v = Math.min(255, Math.round(h * 255 / 80)), k = (j * NX + i) * 4;
          if (v > D[k]) { D[k] = v; D[k + 1] = goldV; D[k + 3] = 255; }
        }
      };
      const lay = async (pts, hK, rK, goldV, shape, rMin = 0) => { let n = 0; for (const q of pts) { const H = hK * q.s; splat(q.x, q.z, Math.max(q.y - waterAt(q.z), 0) + H, Math.max(rK * H, rMin), goldV, shape); if ((++n & 63) === 0) await ctx.yield(); } await ctx.yield(); };
      const gv = look.birch ? 255 : 120;
      await lay(spruceP, 18.5, 0.15, 0, 0);
      await lay(clumpP, 18.5, 0.16, 0, 0);
      await lay(goldP, 13.5, 0.1, gv, 1);
      await lay(birchP, 14, 0.2, gv, 1);
      await lay(bushP, 2.1, 0.75, look.season === 'july' ? 100 : 135, 1);
      await lay(grassP, 4.2, 0, look.snow ? 90 : 115, 2, 2.3);
      // the coarser levels: each texel the tallest crown of the four by four under it
      const mips = [{ data: D, width: NX, height: NZ }];
      for (let l = 1; l < 7; l++) {
        const a = mips[l - 1], w = Math.max(1, a.width >> 1), h = Math.max(1, a.height >> 1), d = new Uint8Array(w * h * 4);
        for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
          let best = 0, gold = 0;
          for (let jj = 2 * j - 1; jj <= 2 * j + 2; jj++) for (let ii = 2 * i - 1; ii <= 2 * i + 2; ii++) {
            if (ii < 0 || jj < 0 || ii >= a.width || jj >= a.height) continue;
            const k = (jj * a.width + ii) * 4; if (a.data[k] > best) { best = a.data[k]; gold = a.data[k + 1]; }
          }
          const k = (j * w + i) * 4; d[k] = best; d[k + 1] = gold; d[k + 3] = 255;
        }
        mips.push({ data: d, width: w, height: h });
        await ctx.yield();
      }
      const treeTex = new THREE.DataTexture(D, NX, NZ, THREE.RGBAFormat);
      treeTex.mipmaps = mips; treeTex.magFilter = THREE.LinearFilter; treeTex.minFilter = THREE.LinearMipmapNearestFilter; treeTex.generateMipmaps = false;
      treeTex.wrapS = treeTex.wrapT = THREE.ClampToEdgeWrapping; treeTex.needsUpdate = true;
      surfU.tTrees.value = treeTex;
      const gc = new THREE.Color(look.gold), sc = HU.uSunCol.value, kc = HU.uSkyCol.value, jk = look.season === 'july' ? 0.5 : 1;
      surfU.uGoldRef.value.setRGB(gc.r * (sc.r * 0.2 + kc.r * 0.55) * jk, gc.g * (sc.g * 0.2 + kc.g * 0.55) * jk, gc.b * (sc.b * 0.2 + kc.b * 0.55) * jk);
      const pc = new THREE.Color(SPR.leaf);
      surfU.uSpruceRef.value.setRGB(pc.r * (sc.r * 0.16 + kc.r * 0.95) + 0.004, pc.g * (sc.g * 0.16 + kc.g * 0.95) + 0.005, pc.b * (sc.b * 0.16 + kc.b * 0.95) + 0.005);
      surfU.uSpruceLit.value.set(SPR.leafLight);
    }
    await ctx.yield();

    // ---- Dumpling Mountain beyond the left bank (tundra red, first snow on top) and the far ring of hills
    const farU = { ...lightU, uHaze: { value: sky.horizonColor.clone() }, uHazeK: { value: clamp(0.36 + look.mist * 0.7, 0.36, 0.85) } };
    let mountain;
    {
      // IT STANDS BY THE BRIEF'S WORDS ('Dumpling Mountain stands 5 km off beyond the left bank'): a distance and a
      // bearing from the middle of the ledge (x 0, z 0). The bearing: MOUNT_BEARING = 45 degrees to the left of
      // upstream, half way between straight up the river and square across the left bank. The distance: the brief's
      // 5000 m, were the far plane not at CAM_FAR = 4000 m; the eye ranges up to 300 m from the ledge's middle against
      // that bearing (0.707 of the lower river's length), so MOUNT_D = CAM_FAR - 400 = 3600 m is the farthest at which
      // its summit and both shoulders are drawn from every place on the route. Not by what any picture shows of it
      const CAM_FAR = 4000, MOUNT_BEARING = 45 * Math.PI / 180, MOUNT_D = Math.min(5000, CAM_FAR - 400);
      const R = 1500, H = 1050, cx = -Math.sin(MOUNT_BEARING) * MOUNT_D, cz = -Math.cos(MOUNT_BEARING) * MOUNT_D, NA = 56, NR = 12, P = [], C = [], I = [];
      const tundra = hexLin(look.season === 'july' ? '#55683a' : '#8a3c2a'), low = hexLin('#1c3024');
      for (let j = 0; j <= NR; j++) for (let i = 0; i <= NA; i++) {
        const a = (i / NA) * 6.283, r = j / NR, ca = Math.cos(a), sa = Math.sin(a), rr = R * r * (1 + 0.16 * nz.n2(ca * 1.3 + 7, sa * 1.3));
        const h = H * Math.pow(1 - r * r, 1.35) * (0.84 + 0.2 * nz.fbm2(ca * r * 2.3 + 3, sa * r * 2.3 + 5, 3)) * (1 - 0.1 * Math.abs(nz.n2(ca * 4, sa * 4)) * r);
        P.push(cx + ca * rr, -30 + h, cz + sa * rr);
        const snow = ss(0.6, 0.76, h / H + 0.07 * nz.n2(ca * r * 9, sa * r * 9)) * (look.season === 'july' ? 0.25 : 1);
        const c = mix3(mix3(low, tundra, ss(0.08, 0.3, h / H)), [0.78, 0.81, 0.87], Math.max(snow, look.snow ? 0.55 * ss(0.15, 0.4, h / H) : 0));
        C.push(c[0], c[1], c[2]);
      }
      for (let j = 0; j < NR; j++) for (let i = 0; i < NA; i++) { const a = j * (NA + 1) + i, b = a + NA + 1; I.push(a, a + 1, b, a + 1, b + 1, b); }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3)); g.setIndex(I); g.computeVertexNormals();
      mountain = new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms: farU, vertexColors: true, side: THREE.DoubleSide,
        vertexShader: 'varying vec3 vN, vC; void main(){ vN = normal; vC = color; gl_Position = projectionMatrix*modelViewMatrix*vec4(position, 1.); }',
        fragmentShader: 'uniform vec3 uSun, uSunCol, uSkyCol, uHaze; uniform float uHazeK; varying vec3 vN, vC; void main(){ vec3 n = vN/max(length(vN), 1e-5); if (n.y < 0.) n = -n; vec3 c = vC*(uSunCol*max(dot(n, uSun)*.8 + .2, 0.)*.75 + uSkyCol*.8); gl_FragColor = vec4(mix(c, uHaze, uHazeK), 1.); }' }));
      mountain.name = 'dumpling'; mountain.renderOrder = -0.5; scene.add(mountain);
    }
    const ridges = T.makeHorizonRidges({ rng: rng.fork('ridges'), layers: 3, radius: [1300, 3300], height: [70, 250], colorNear: look.season === 'july' ? '#2c4030' : '#4a3028', fog: scene.fog, sunDir: sunV, sunColor: sky.lightColor, snow: look.season !== 'july', snowLine: 0.72, rim: 0.3 });
    scene.add(ridges.object);
    await ctx.yield();

    // ---- air: falling leaves, fireweed fluff, snow or rain by the look, mist lifting off the upper river
    const fxTime = { value: 0 }, parts = [];
    if (!look.snow && look.leaf > 0.1) parts.push(FX.makeParticles({ rng: rng.fork('leaves'), preset: 'leaves', time: fxTime, count: Math.round(560 * detail * look.leaf), box: [80, 34, 80], size: [0.2, 0.4], colors: [look.gold, goldL, '#c8742a'] }));
    parts.push(FX.makeParticles({ rng: rng.fork('fluff'), preset: 'pollen', time: fxTime, count: Math.round(650 * detail), box: [58, 24, 58], size: [0.05, 0.11], colors: night ? ['#8fa0c8', '#7888b0', '#a0b0d0'] : ['#ffffff', '#f4f0e0', '#e8ecf0'] }));
    if (look.snow) parts.push(FX.makeParticles({ rng: rng.fork('snow'), preset: 'snow', time: fxTime, count: Math.round(2400 * detail) }));
    if (look.rain) parts.push(FX.makeParticles({ rng: rng.fork('rain'), preset: 'rain', time: fxTime, count: Math.round(4500 * detail) }));
    for (const p of parts) scene.add(p.object);
    await ctx.yield();
    const mistPos = [];
    for (let i = 0; i < 30; i++) { const z = -52 - 290 * rng(), x = midX(z) + rng.range(-0.8, 0.8) * halfW(z); mistPos.push([x, LIP + rng.range(2.5, 7), z]); }
    // (a misty look, dawn or rain, has more of it, and all of it where the brief has it, on the upper river, from the lip up:
    // 'mist so thick on the upper river that the bears are shapes in it'; none lies over the lower river as a veil)
    if (look.mist > 0.3) for (let i = 0; i < 18; i++) { const z = -4 - 150 * rng(); mistPos.push([midX(z) + rng.range(-0.9, 0.9) * halfW(z), LIP + rng.range(3, 8), z]); }
    const mist = FX.makeMist({ rng: rng.fork('mist'), time: fxTime, positions: mistPos, size: [22, 46], color: '#' + airCol.clone().lerp(new THREE.Color(night ? '#5a6a90' : '#ffffff'), 0.5).getHexString(), opacity: 0.07 + 0.3 * look.mist });
    scene.add(mist.object);

    // ---- the white veil of the miss
    const veilU = { ...lightU, uVeil: { value: new THREE.Vector2(0, 0) }, uWhite: { value: new THREE.Color(PALETTE[5]) } };
    const veil = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({ uniforms: veilU, vertexShader: VEIL_VERT, fragmentShader: VEIL_FRAG, transparent: true, depthTest: false, depthWrite: false, fog: false }));
    veil.frustumCulled = false; veil.renderOrder = 55; veil.visible = false; veil.name = 'veil'; scene.add(veil);
    // ---- the waterline on the glass of the upper river (GLASS_VERT)
    const glassU = { ...lightU, uSurfH: { value: LIP }, uNearD: { value: 0.2 }, uGoldAmt: surfU.uGoldAmt, uVol: surfU.uVol, uSkyHor: surfU.uSkyHor, uSkyAir: surfU.uSkyAir, uSunAir: surfU.uSunAir, uHorizon: surfU.uHorizon, uGold: surfU.uGold, uSpruceRef: surfU.uSpruceRef, uGoldRef: surfU.uGoldRef };
    const glassLine = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({ uniforms: glassU, vertexShader: GLASS_VERT, fragmentShader: GLASS_FRAG, transparent: true, depthTest: false, depthWrite: false, fog: false }));
    glassLine.frustumCulled = false; glassLine.renderOrder = 50; glassLine.visible = false; glassLine.name = 'glassLine'; scene.add(glassLine);
    await ctx.yield();

    // ---- sun shafts under water (our own: see SHAFT_VERT)
    const shaftU = { uTime: HU.uTime, uCam: HU.uCam, uSurfY: { value: 0 }, uLen: { value: 8 }, uGain: { value: 1 }, uRange: { value: 30 }, uWK: { value: WATER_K }, uShort: { value: 0.6 }, uThin: { value: 1 }, uWd: { value: new THREE.Vector2(0, 1) }, uDir: { value: shaftDir }, uAvoid: { value: new THREE.Vector3(shelf.x, shelf.z, 7.5) },
      uShaftCol: { value: HU.uSunCol.value.clone().multiply(new THREE.Color(0.62, 1, 0.78)).multiplyScalar(night ? 0.11 : look.weather === 'rain' ? 0.05 : 0.085) } };
    let shafts;
    {
      const n = Math.round(52 * (0.6 + 0.4 * detail)), iS = new Float32Array(n * 4), sr = rng.fork('shafts');
      for (let i = 0; i < n; i++) iS.set([sr() * 60, sr() * 60, sr.range(0.4, 1.5), sr()], i * 4);
      const g = new THREE.InstancedBufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3)); g.setIndex([0, 1, 2, 0, 2, 3]);
      g.setAttribute('iS', new THREE.InstancedBufferAttribute(iS, 4)); g.instanceCount = n;
      shafts = new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms: shaftU, vertexShader: SHAFT_VERT, fragmentShader: SHAFT_FRAG, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false }));
      shafts.frustumCulled = false; shafts.renderOrder = 4; shafts.name = 'shafts'; scene.add(shafts);
    }
    await ctx.yield();
    // three shafts on the left of the entry axis, for the eye at the previous world's portal and the first seconds,
    // each half as wide as its own width (wd 0.85, 1.15 and 0.9 m)
    const entryU = { ...shaftU, uSurfY: { value: 0 }, uLen: { value: 12.5 }, uGain: { value: 0 }, uRange: { value: 5000 }, uWK: { value: WATER_K * 0.5 }, uShort: { value: 0.75 }, uWd: { value: new THREE.Vector2(0, 0.5) }, uAvoid: { value: new THREE.Vector3(0, 9000, 1) } };
    let entryShafts;
    {
      const iS = new Float32Array([xs - 8.5, Z0 - 17, 1.7, 0.21, xs - 12.5, Z0 - 25, 2.3, 0.57, xs - 9.5, Z0 - 33, 1.8, 0.83]);
      const g = new THREE.InstancedBufferGeometry();
      g.setAttribute('position', shafts.geometry.getAttribute('position')); g.setIndex(shafts.geometry.getIndex());
      g.setAttribute('iS', new THREE.InstancedBufferAttribute(iS, 4)); g.instanceCount = 3;
      entryShafts = new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms: entryU, vertexShader: SHAFT_VERT, fragmentShader: SHAFT_FRAG, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false }));
      entryShafts.frustumCulled = false; entryShafts.renderOrder = 4; entryShafts.name = 'entryShafts'; entryShafts.visible = false; scene.add(entryShafts);
    }
    // and two on every nest of the lower river: they come down through the surface and stand on the pale gravel
    // (uLen = the longest of their ways down along the light, 1 m at the least; a beam's phase gives it 0.999 of its
    // own way down for its length. Their own widths are 0.5 and 0.38 m: at their feet they are 1.25 and 0.95 m from
    // side to side, on nests that are 3.2 m across the current or more. uThin 0.5: at half their way down they have
    // 0.75 of their brightest light, at 0.86 of it 0.4)
    let nestShafts = null;
    const nestShaftU = { ...shaftU, uSurfY: { value: 0 }, uLen: { value: 4 }, uGain: { value: night ? 1.5 : 2.1 }, uRange: { value: 5000 }, uWK: { value: WATER_K * 0.5 }, uShort: { value: 0 }, uThin: { value: 0.5 }, uWd: { value: new THREE.Vector2(0, 1) }, uAvoid: { value: new THREE.Vector3(0, 9000, 1) } };
    if (nestFeet.length) {
      const OFF = [[0.1, -0.5, 0.5], [-0.6, 0.7, 0.38]], iS = new Float32Array(nestFeet.length * 8); let far = 1;
      for (const f of nestFeet) far = Math.max(far, f[2] / -shaftDir.y);
      nestFeet.forEach((f, i) => {
        const len = f[2] / -shaftDir.y;
        for (let k = 0; k < 2; k++) iS.set([f[0] + OFF[k][0] - shaftDir.x * len, f[1] + OFF[k][1] - shaftDir.z * len, OFF[k][2], (i * 2 + k + 0.999 * len / far) / 7.3], (i * 2 + k) * 4);
      });
      nestShaftU.uLen.value = far;
      const g = new THREE.InstancedBufferGeometry();
      g.setAttribute('position', shafts.geometry.getAttribute('position')); g.setIndex(shafts.geometry.getIndex());
      g.setAttribute('iS', new THREE.InstancedBufferAttribute(iS, 4)); g.instanceCount = nestFeet.length * 2;
      nestShafts = new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms: nestShaftU, vertexShader: SHAFT_VERT, fragmentShader: SHAFT_FRAG, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false }));
      nestShafts.frustumCulled = false; nestShafts.renderOrder = 4; nestShafts.name = 'nestShafts'; nestShafts.visible = false; scene.add(nestShafts);
    }
    await ctx.yield();

    // ---- the spray at the snap: a fan of drops off the fish and the jaws, up and to the left of the frame (the way the
    // fish was going), most of them small and within a head's width of the mouth, a few big ones flung wide; and a
    // thin trail shaken off the fish along the last of its arc
    const haloU = { uT: { value: -9 }, uVH: { value: 450 }, uSunCol: HU.uSunCol, uSkyCol: HU.uSkyCol };
    let halo;
    {
      const hr = rng.fork('halo'), n = Math.round(104 * (0.6 + 0.4 * detail)), iP = new Float32Array(n * 4), iV = new Float32Array(n * 4), m = A.apexMouth;
      path.pointAt(beats.snap, _pv);
      const e = [_pv.x - m.x, _pv.y - m.y, _pv.z - m.z], el = Math.hypot(e[0], e[1], e[2]) || 1; e[0] /= el; e[1] /= el; e[2] /= el;          // toward the eye
      const rl = Math.hypot(e[0], e[2]) || 1, R = [e[2] / rl, 0, -e[0] / rl], U = [e[1] * R[2], e[2] * R[0] - e[0] * R[2], -e[1] * R[0]];      // across the frame, and up it
      // the taken fish's arc (the hero throws it from the foam at leapX - 2.6, z 7.2 to the mouth in about 0.9 s)
      const T = 0.91, p0 = [lx - 2.6, -1, 7.2], v0 = [(m.x - p0[0]) / T, (m.y - p0[1]) / T + 11 * T, (m.z - p0[2]) / T];
      for (let i = 0; i < n; i++) {
        const size = 0.007 + 0.052 * Math.pow(hr(), 3.4), big = size > 0.03;
        if (i < n * 0.78) {
          const a = clamp(2.25 + hr.gauss() * 0.5, 1.2, 3.35), r = (1.6 + 9.5 * Math.pow(hr(), 2.1)) * (big ? 1.25 : 1), f = hr.range(-0.6, 2.6), o = hr.range(-0.45, 0.45), ca = Math.cos(a) * r, sa = Math.sin(a) * r + 1.4;
          iP.set([m.x + R[0] * o + e[0] * 0.3, m.y + hr.range(-0.25, 0.2), m.z + R[2] * o + e[2] * 0.3, i < n * 0.6 ? -hr.range(0.02, 0.3) : hr.range(0, 0.22)], i * 4);
          iV.set([R[0] * ca + U[0] * sa + e[0] * f, R[1] * ca + U[1] * sa + e[1] * f, R[2] * ca + U[2] * sa + e[2] * f, size], i * 4);
        } else {
          const t = T - hr.range(0.04, 0.42), k = hr.range(0.35, 0.7);
          iP.set([p0[0] + v0[0] * t + hr.range(-0.2, 0.2), p0[1] + v0[1] * t - 11 * t * t + hr.range(-0.2, 0.2), p0[2] + v0[2] * t + hr.range(-0.2, 0.2), t - T - 0.02], i * 4);
          iV.set([v0[0] * k + hr.range(-1.2, 1.2), (v0[1] - 22 * t) * k + hr.range(0.5, 3), v0[2] * k + hr.range(-1.2, 1.2), size * 0.8], i * 4);
        }
      }
      const g = new THREE.InstancedBufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3)); g.setIndex([0, 1, 2, 0, 2, 3]);
      g.setAttribute('iP', new THREE.InstancedBufferAttribute(iP, 4)); g.setAttribute('iV', new THREE.InstancedBufferAttribute(iV, 4)); g.instanceCount = n;
      halo = new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms: haloU, vertexShader: HALO_VERT, fragmentShader: HALO_FRAG, transparent: true, premultipliedAlpha: true, depthWrite: false, fog: false, side: THREE.DoubleSide }));
      halo.frustumCulled = false; halo.renderOrder = 9; halo.name = 'halo'; scene.add(halo);
    }
    await ctx.yield();

    // ---- under water the light is the water's: the key and the fill lose their copper (it stays in the window)
    const lumOf = (c) => 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b;
    const wet = (c, tint, keep) => new THREE.Color(tint[0], tint[1], tint[2]).multiplyScalar(lumOf(c) * 0.95).lerp(c, keep);
    // With the sun low (dawn, evening) little light gets into the water and what does comes in nearly level, so the bed
    // was a dark marbled smear under its caustics. Under water those hours get the light the default hour has: the
    // rays stand at the refracted angle (steep whatever the sun's height) and the key and the fill are brought up to
    // September's strength on a level bed, keeping a little more of their own hue (rose at dawn, copper at evening).
    const UW = look.uw || null, toLum = (c, target) => c.multiplyScalar(target / Math.max(lumOf(c), 1e-4));
    const sunDirAir = HU.uSun.value.clone(), sunDirWet = sunDirAir.clone();
    if (UW) { const h = Math.hypot(sunDirAir.x, sunDirAir.z), sinT = h / 1.333, k = h > 1e-4 ? sinT / h : 0; sunDirWet.set(sunDirAir.x * k, Math.sqrt(1 - sinT * sinT), sunDirAir.z * k).normalize(); }
    const REF = { sun: 2.18, sky: 0.4, rigSun: 1.52, rigHemi: 0.945 };       // September's wet key and fill (luminance), its key on a level bed, its fill
    const sunAir = HU.uSunCol.value.clone(), skyAir = HU.uSkyCol.value.clone(), sunWet = wet(sunAir, [0.8, 1, 0.9], UW ? UW.keep : 0.15), skyWet = wet(skyAir, [0.78, 1, 0.95], 0.2);
    if (UW) { toLum(sunWet, REF.sun * 0.9); if (lumOf(skyWet) < REF.sky) toLum(skyWet, REF.sky); }
    const shaftK = night ? 0.11 : look.weather === 'rain' ? 0.05 : 0.085;
    if (UW) shaftU.uShaftCol.value.copy(sunAir).multiplyScalar(lumOf(sunWet) / Math.max(lumOf(sunAir), 1e-4)).lerp(sunWet, 0.5).multiplyScalar(shaftK * UW.shaft);      // the shafts keep the hour's colour
    else shaftU.uShaftCol.value.copy(sunWet).multiply(new THREE.Color(0.7, 1, 0.84)).multiplyScalar(shaftK);
    const uwSun = uw.light.sunColor.clone(), uwSunWet = wet(uwSun, [0.8, 1, 0.9], 0.15);
    const rigSun = rig.sun.color.clone(), rigHemi = rig.hemi.color.clone(), rigSunWet = wet(rigSun, [0.8, 1, 0.9], UW ? UW.keep : 0.15), rigHemiWet = wet(rigHemi, [0.78, 1, 0.95], 0.2);
    const rigDirAir = rig.direction.clone(), rigDirWet = rigDirAir.clone();
    if (UW) {
      const h = Math.hypot(rigDirAir.x, rigDirAir.z), sinT = h / 1.333, k = h > 1e-4 ? sinT / h : 0; rigDirWet.set(rigDirAir.x * k, Math.sqrt(1 - sinT * sinT), rigDirAir.z * k).normalize();
      toLum(rigSunWet, REF.rigSun / Math.max(rig.sun.intensity * rigDirWet.y, 0.2));
      if (lumOf(rigHemiWet) * rig.hemi.intensity < REF.rigHemi) toLum(rigHemiWet, REF.rigHemi / Math.max(rig.hemi.intensity, 0.2));
    }

    // ---- gaze
    const head0 = A.bears[0].head, mouth = A.apexMouth;
    const poiV = new THREE.Vector3(), poiW = new THREE.Vector3(), poiB = new THREE.Vector3();
    const pois = [
      { at: [fx + 8, 9, 0], from: 0.12, to: 0.3, weight: 0.3 },
      { at: [shelf.x + 0.6, -0.9, shelf.z], from: 0.285, to: beats.missBreak - 0.03, weight: 0.45 },
      // the bears overhead at the miss; then, behind the white of the falling sheet, round to the bubble wall at the foot of
      // the falls, which we are swept along (it stands on our left, the fish that hold in front of it dark against it)
      { at: (time, u) => { const k = ss(beats.missFall + 0.0015, beats.missFall + 0.0085, u); path.pointAt(clamp(u, 0, 1), poiB); return poiB.set(lerp(fx + 1.5, poiB.x + 19, k), lerp(LIP + 2.6, poiB.y - 3.4, k), lerp(-4.5, poiB.z - 7, k)); },
        from: beats.missBreak - 0.04, to: beats.missFall + 0.062, weight: 0.76, fade: 0.25 },
      // the gulls first (they are close on our left as we come up), then across to the wolf as it turns and goes
      { at: (time, u) => { const k = ss(beats.wolf - 0.018, beats.wolf + 0.004, u), g = ss(beats.wolf, beats.wolf + 0.03, u) * 0.6; return poiV.set(lerp(carcassAt[0] - 0.3, lerp(wolfAt[0], wolfTo[0], g), k), lerp(1.5, 2.8, k), lerp(carcassAt[1], lerp(wolfAt[1], wolfTo[1], g), k)); }, from: beats.tailUp - 0.014, to: beats.slantFrom + 0.004, weight: 0.75, fade: 0.25 },
      // the run at the ledge: the two bears on the shoal as we come up beside them, then the lip bears on our left
      { at: [reef.x + 0.4, 2.4, reef.z - 0.2], from: beats.slantFrom - 0.012, to: beats.shoal + 0.022, weight: 0.5 },
      { at: (time, u) => poiV.set(lerp(fx + 15, lx - 11, ss(beats.shoal + 0.05, beats.slantTo - 0.012, u)), 6.5, -1), from: beats.shoal - 0.01, to: beats.leapBreak - 0.03, weight: 0.55 },
      // the fight, and when the loser has gone over, the place in the pool where it lands: the gaze follows it down and
      // stays on the crown of its splash until we dive for the leap
      ...(fight ? [{ at: (time, u) => { const k = ss(beats.fall + 0.006, beats.fall + 0.021, u); return poiW.set(lerp(fight.xD + 1.9, fight.sxc + 2.5, k), lerp(9.6, 4.6, k), lerp(-2.6, fight.szc, k)); }, from: beats.shoal + 0.012, to: beats.fall + 0.056, weight: 0.85, fade: 0.2 }] : []),
      { at: [mouth.x, mouth.y - 0.3, mouth.z], from: beats.leapBreak - (fight ? 0.037 : 0.045), to: beats.apex + 0.004, weight: 0.78 },
    ];

    await ctx.yield();
    await sky.prewarm(ctx.renderer, null, scene);

    const camW = new THREE.Vector3(), bufSize = new THREE.Vector2(), deep = [uw.rays, uw.particles, uw.bubbles].filter(Boolean);
    const lineU = uw.waterline.material.uniforms, tSnap = tAt(beats.snap), tWolf = tAt(beats.wolf), tFall = tAt(beats.fall ?? 0.7), mf = beats.missFall;
    return {
      scene, path, duration: DUR, pace: paceAt, title: look.title, beats,
      camera: { fov: 62, near: 0.2, far: 4000, lookAhead: 20, sway: 0.8, bank: 0.3 },
      pois,
      portal: { shape: 'circle', radius: 6, color: night ? '#b8ccff' : '#d4ecff', glow: 1, revealDistance: 240 },
      post: { exposure: look.exposure, bloom: { strength: lookId === 'evening' ? 0.22 : 0.3, radius: 0.6, threshold: lookId === 'evening' ? 1.1 : 0.93 },
        grade: { saturation: look.sat, contrast: 1.05, tint: look.tint, shadowTint: look.shadow, vignette: 0.3, grain: 0.02, aberration: 0 } },
      ride: 'none', companion: 'none',
      update(dt, time, camera, u) {
        camera.getWorldPosition(camW);
        // which water are we in, and how deep: fog, background and the kit's underwater parts follow the eye
        const upper = camW.z < -0.6, boil = upper ? 0 : Math.exp(-Math.max(camW.z, 0) / 6.5) * ss(-0.6, 1.5, camW.z);
        const surfY = upper ? hero.surfaceAt(camW.x, camW.z) - 0.03 : -0.78 * boil;
        // u 0 is the portal preview (its camera may stand off the axis, above the water or in it): no half states there
        const pre = u === 0, d = surfY - camW.y, sub = d > 0, s = pre ? (sub ? 1 : 0) : ss(-0.02, 0.3, d), fog = scene.fog;
        // (green dusk by depth: the water's own colour by the metres of water over the eye, and the far ceiling's glow with it)
        surfU.uDusk.value = ss(DUSK_EYE[0], DUSK_EYE[1], d);
        volNow.copy(volCol).lerp(volDeep, surfU.uDusk.value); surfU.uCeil.value.copy(volNow).multiplyScalar(1.5);
        fog.color.copy(airCol).lerp(volNow, pre ? s : ss(-0.04, 0.07, d)); fog.density = lerp(AIR_K, WATER_K, s);
        HU.uSunCol.value.copy(sunAir).lerp(sunWet, s); HU.uSkyCol.value.copy(skyAir).lerp(skyWet, s); rig.sun.color.copy(rigSun).lerp(rigSunWet, s); rig.hemi.color.copy(rigHemi).lerp(rigHemiWet, s);
        if (UW) { HU.uSun.value.copy(sunDirAir).lerp(sunDirWet, s).normalize(); rig.direction.copy(rigDirAir).lerp(rigDirWet, s).normalize(); }
        scene.background.copy(fog.color);
        surfMat.depthWrite = sub; fishU.uAbove.value = 1 - s;
        // the surface is drawn as a ceiling only in the reach the eye is under (within 8 cm of the surface each fragment's
        // own height decides): from the air under the lip the upper river is the root of the falls, and a crest of the boil is foam
        const eyeK = !pre && Math.abs(d) < 0.08 ? 0.5 : sub ? 1 : 0;
        surfU.uSubm.value.set(upper ? 0 : eyeK, upper ? eyeK : 0); hero.waterUniforms.uEye.value.set(!upper && sub ? 1 : 0, upper && sub ? 1 : 0);
        // under water the run keeps its red a little further than the water's haze would let it; through the portal
        // (a small disc seen from 20 m behind the entry) it is lifted so that the ribbon reads as red
        // moonlight leaves the red too little to read: lift it; and so does the low sun of dawn and evening under water,
        // where a river full of dark-backed fish would pull the whole frame down
        fishU.uFogF.value = lerp(1, pre ? 0.3 : 0.78, s); cardU.uFogF.value = lerp(1, pre ? 0.3 : 1, s); fishU.uGainF.value = (pre && sub ? 1.45 : 1) * (night ? 2 : 1); fishU.uGainR.value = UW && !pre ? 1 + 0.2 * s : 1; fishU.uFarK.value = pre ? 0.15 : 1;
        // (the lower river's shoal is behind and under us from the moment we are in the air over the lip, and so is the queue
        // in the boil, which the fish shader does not draw from the air: not drawn from a metre above the water on;
        // a reach's shoal is drawn until the eye is zr[0] past it, and from the air (airBack) only while some of the
        // reach still lies ahead of the eye: the deep entry reach is wholly behind us on the first riffle arc)
        for (const m of fishMeshes) m.visible = camW.z > m.userData.zr[0] + (sub ? 0 : m.userData.airBack || 0) && camW.z < m.userData.zr[1] && !(u > m.userData.uMax);
        for (const m of byU) m.visible = u >= m.userData.ur[0] && u <= m.userData.ur[1];
        // (the things shown by the water's sight)
        // (and a boiled thing, one that holds wholly under the opaque boil, not while the eye is over the surface)
        for (const m of byZ) { const zs = m.userData.sight, d = Math.max(zs[0] - camW.z, camW.z - zs[1], 0), g = upper || (m.userData.boiled && !sub) ? 0 : 1 - ss(SIGHT_Z - RISE_Z, SIGHT_Z, d); m.material.uniforms.uGrow.value = g; m.visible = g > 0; }
        // (the runs' stones, lot by lot, by the water's sight, as the things above are: the size is taken along z from
        // the stretch of z the lot's stones span, and none is drawn while the eye is upstream of the falls' line
        // (upper). And a lot whose bounds lie wholly outside what this camera sees is not drawn: the renderer's own
        // rule, asked of the lot's box where the renderer asks it of a ball about the lot.
        // Of a lot that is drawn, one of its two meshes is shown: the cobble's 32 faces while the eye is under the
        // water's surface, the 8 faces while it is over it. Which, is sub above: the eye's own height against the
        // water over it, the very value by which the sky and the forest are not drawn from under water)
        runFrustum.setFromProjectionMatrix(runPM.copy(camera.matrixWorld).invert().premultiply(camera.projectionMatrix));
        for (const m of runLots) { const b = m.userData.box, dz = Math.max(b[2] - camW.z, camW.z - b[3], 0), g = upper || !runFrustum.intersectsBox(m.userData.bounds) ? 0 : 1 - ss(SIGHT_Z - RISE_Z, SIGHT_Z, dz); m.material.uniforms.uGrow.value = g; m.visible = g > 0 && sub; m.userData.air.visible = g > 0 && !sub; }
        // (the pool's company from the air: of the size the water's sight has just given a lot, its bodies take the share that falls and its cards the share that rises with the eye's height over the surface)
        { const air = ss(HOLD_AIR[0], HOLD_AIR[1], -d); for (const lot of holdLots) { const gb = lot.body.material.uniforms.uGrow, gc = lot.cards.material.uniforms.uGrow, g = gb.value; gb.value = g * (1 - air); gc.value = g * air; lot.body.visible = gb.value > 0; lot.cards.visible = gc.value > 0; } }
        // (the pool's awash fish: while the eye is in the lower river between the boil and 70 m below the last of them)
        if (runFile) { runFile.visible = camW.z > 14.5 && camW.z < runFile.userData.zMax + 70; runFile.userData.grow.value = ss(14.5, 19, camW.z); }
        hero.object.visible = !(sub && camW.z > 150);     // the ledge is beyond sight from under the entry reach
        sky.object.visible = !sub; mountain.visible = !sub; ridges.object.visible = !sub; mist.object.visible = !sub;
        for (const g of groves) g.object.visible = !sub;     // from below the forest is the painted rim of the window
        for (const m of deep) m.visible = s > 0;
        drift.visible = s > 0 && !pre; driftU.uSurf.value = upper ? LIP : 0;
        if (riffleBub) riffleBub.mesh.visible = s > 0 && !upper && camW.z > 60;
        if (riffleCurt) riffleCurt.visible = s > 0 && !upper && camW.z > 60;
        if (rootBub) rootBub.mesh.visible = s > 0 && !upper && camW.z > 120;
        // the fish among the roots (from the air too): the roots reach 10 m from the wad's middle and a fish lies within
        // 3 m of a root's end, so they are drawn until the eye is 16 m past the wad along z, all of them then behind it
        if (rootFish) rootFish.visible = camW.z > rootWadZ - 16;
        if (legFoam) legFoam.mesh.visible = s < 1 && camW.z < 110;
        if (ledgeDrops) ledgeDrops.visible = camW.z < 125;
        // the carcass, the gulls and the wolves stand on the bar downstream of the falls: drawn while the eye is downstream
        // of the falls' line (z 0), and no longer once it is 0.6 m past that line, where the upper river begins: the bar
        // is then behind and below us
        const barSeen = camW.z > -0.6;
        for (const m of onBar) m.visible = barSeen;
        if (compDrops) compDrops.mesh.visible = !sub;
        shafts.visible = s > 0; shaftU.uSurfY.value = upper ? LIP : 0;
        // the bubble wall under the falls is for the eye in the pool: from the air it showed through the surface (which
        // writes no depth) as a flat pale band over all the water between us and the face
        if (bubbleWall) { bubbleWall.visible = s > 0 && !upper; bubbleWall.material.uniforms.uJet.value = ss(mf - 0.004, mf + 0.004, u) * (1 - ss(beats.tailUp - 0.03, beats.tailUp, u)); }
        poolWindow.visible = s > 0.5 && !upper && u > 0.2 && u < beats.missBreak + 0.01;
        // the plunging columns and their bubbles are for the eye in the lower river; the pool bear's muzzle goes down as we
        // come up to it; the redd's female fans, its shafts and its silt show while we are at the tail of the pool
        const low = s > 0 && !upper;
        // (the wall bubbles rise within 18 m of the falls' face: they are drawn while the eye is in the lower river within
        // 100 m of the face along z, so that 82 m of water and more lie between when they come and go, beyond the 60 m it lets us see)
        columns.visible = low; wallBub.mesh.visible = low && camW.z < 100;
        const plunge = ss(0.295, 0.325, u) * (1 - ss(0.372, 0.39, u));
        sit.rear2.value.y = 0.3 + plunge * (0.42 + 0.08 * Math.sin(time * 1.6));
        muzzleBub.mesh.visible = muzzleFoam.mesh.visible = low && plunge > 0.01; muzzleBub.U.uGo.value.x = plunge; muzzleFoam.U.uGo.value.x = plunge * 0.8;
        // the nests of a reach are drawn while the eye is within 60 m of them (the lower river's never from the upper
        // river); the females fan, the silt lifts for the eye under water, and each trout in its turn darts at the
        // eggs and drifts back to its station
        fanV.set(1.08 + 0.14 * Math.sin(time * 2.3), 0.13 + 0.04 * Math.sin(time * 3.1));
        if (nestShafts) nestShafts.visible = low;
        for (const g of nestGroups) {
          const on = (g.up || !upper) && Math.hypot(camW.x - g.cx, camW.z - g.cz) < g.rad + 60;
          for (const m of g.meshes) m.visible = on;
          if (g.puffs) g.puffs.mesh.visible = on && s > 0 && g.up === upper;
          if (on && g.tm) {
            const A = g.attr.array, H = g.home, D = g.dart;
            for (let i = 0; i < g.n; i++) {
              const k = (time / (4.6 + 3 * H[i * 4 + 3]) + H[i * 4 + 3] * 7) % 1, dd = 0.7 * ss(0, 0.045, k) * (1 - ss(0.07, 0.4, k));
              A[i * 4] = H[i * 4] + D[i * 2] * dd; A[i * 4 + 2] = H[i * 4 + 2] + D[i * 2 + 1] * dd;
            }
            g.attr.needsUpdate = true;
          }
        }
        const bedY = camW.z < 14.5 && camW.z > -47 ? (upper ? 3.2 : -7) : height(camW.x, camW.z);
        shaftU.uLen.value = clamp(((upper ? LIP : 0) - bedY) / -shaftDir.y, 2, 24);
        entryU.uGain.value = (night ? 1.8 : 3.1) * (1 - ss(0.035, 0.085, u)); entryShafts.visible = s > 0 && u < 0.085;
        // no shaft of the tile has less than the gain of the nests' beams, 2.1 by day and 1.5 by night. The depth's law
        // (1.75 where the way down is 3.5 m or less, falling to 1 where it is 13 m or more; 2.3 times that in the small
        // disc of the portal) lies under 2.1 on the whole flight by day: it shows only by night, where it is over 1.5,
        // and in the portal's preview
        shaftU.uGain.value = Math.max((1 + 0.75 * ss(13, 3.5, shaftU.uLen.value)) * (pre ? 2.3 : 1), night ? 1.5 : 2.1);
        const near = camera.near ?? 0.2, lvl = upper ? LIP : 0;
        // (on the glass of the upper river the waterline is the world's own thin line, glassLine; the kit's wipe is the lower river's)
        uw.waterline.visible = !pre && !upper && Math.abs(d) < near * 2.2; lineU.uSurfH.value = surfY; lineU.uNearD.value = near;
        glassLine.visible = upper && Math.abs(d) < near * 2.2; glassU.uSurfH.value = surfY; glassU.uNearD.value = near;
        for (const un of uwSurfU) un.value = lvl;
        uw.causticUniforms.uCausSurf.value = lvl;
        for (const p of parts) p.setOpacity(1 - s);
        ctx.renderer.getDrawingBufferSize(bufSize);
        const p11 = camera.projectionMatrix.elements[5] || 1.66, vh = Math.max(bufSize.y, 1);
        if (lichenMat) lichenMat.uniforms.uPx.value = 2 / (p11 * vh);
        if (weedMat) weedMat.uniforms.uPx.value = 2 / (p11 * vh);
        if (fight) fight.splash.uniforms.uVH.value = vh;
        haloU.uVH.value = vh;
        for (const bu of bubU) bu.uVH.value = vh;
        driftU.uVH.value = vh;

        fxTime.value = time;
        hero.update(dt, time, camera);
        const tNow = tAt(u);
        hero.setStrikeClock(tNow - tSnap);
        haloU.uT.value = tNow - tSnap;
        placeCompanions(u, time);
        setFight(tNow - tFall, time);
        // the heads over the miss, and the apex bear's as we come up at it, are turned aside (three-quarter profile on the sky,
        // the muzzle clear of the chest) and carried a little higher; a strike is as it was
        { const k1 = ss(beats.missBreak - 0.035, beats.missBreak - 0.008, u) * (1 - ss(mf + 0.004, mf + 0.02, u)), k2 = ss(beats.leapBreak - 0.06, beats.leapBreak - 0.025, u) * (1 - ss(beats.apex + 0.004, beats.apex + 0.02, u));
          if (k2 > 0) hero.bearTurn.value.set(lx, 12, 0.62 * k2, 0.14 * k2); else hero.bearTurn.value.set(fx + 2.4, 17, 0.66 * k1, 0.1 * k1); }
        duckU.uGo.value = tNow; surfU.uDuckT.value = tNow > tDuck0 ? tNow : -1; duckU.uSprayVH.value = vh;
        // the wolf watches us come, the fish in its jaws; then it turns, stepping round, and trots off into the reedgrass.
        // Its legs are driven by the ground it covers (WOLF_VERT), so that they keep step with it
        const wt = tNow - tWolf, tu = clamp((wt + 0.3) / 2.1, 0, 1), tg = clamp((wt - 0.9) / 4.1, 0, 1), turn = tu * tu * (3 - 2 * tu), go = tg * tg * (3 - 2 * tg);
        wolf.rotation.y = lerp(wolfYaw0, wolfYaw1, turn) + Math.sin(time * 0.5) * 0.05 * (1 - turn);
        wolf.position.set(lerp(wolfAt[0], wolfTo[0], go), lerp(wolfY, wolfY1, go), lerp(wolfAt[1], wolfTo[1], go));
        let gaze = Math.atan2(camW.x - wolf.position.x, camW.z - wolf.position.z) - wolf.rotation.y; gaze -= Math.round(gaze / 6.2832) * 6.2832;
        wolfGait.set((go * wolfLen + turn * 1.9) / 2.9, 0.36 * Math.sqrt(4 * tg * (1 - tg)) + 0.15 * Math.sqrt(4 * tu * (1 - tu)) * (1 - 4 * tg * (1 - tg)),
          clamp(gaze, -0.62, 0.62) * (1 - go) * (1 - 0.5 * turn) + Math.sin(time * 0.9) * 0.04, 0.05 + 0.05 * Math.sin(time * 0.6) - 0.12 * Math.sqrt(4 * tg * (1 - tg)));
        wolf.visible = barSeen; if (wolf2) wolf2.visible = wolf.visible;       // the wolves stand on the brink for the whole flight and, like the carcass and the gulls, are drawn wherever barSeen is true and nowhere else
        if (wolf2Gait) wolf2Gait.set(0, 0, Math.sin(time * 0.31) * 0.4, 0.06 + 0.06 * Math.sin(time * 0.47));
        // the falling sheet takes us: it comes down over the lens as we drop back through the surface (never before: at the
        // top of the miss the bears stand clear on the sky), white for a third of a second, then the boil's own ceiling
        const vc = ss(mf + 0.0003, mf + 0.0045, u), vs = vc * (1 - ss(mf + 0.005, mf + 0.0085, u));
        veil.visible = vs > 0.002; veilU.uVeil.value.set(vc, vs);

        sky.update(dt, time, camera); rig.update(dt, time, camera); terrain.update(dt, time); ridges.update(dt, time, camera);
        uw.update(dt, time, camera); fauna.update(dt, time, camera, u); flora.updateWind(wind, time);
        uw.light.sunColor.copy(uwSun).lerp(uwSunWet, s);
      },
      dispose() { sky.dispose(); geoNear.dispose(); geoMid.dispose(); geoCard.dispose(); },
    };
  },
};
