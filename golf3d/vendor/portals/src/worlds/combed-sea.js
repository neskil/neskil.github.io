// THE COMBED SEA: a northern sea in plankton bloom drawn as Turkish ebru (marbled paper).
//
// MAP OF THIS FILE (in order)
//   1. MOODS            the seeded looks (squall day, golden sun-shower, lacivert night, pearl dawn):
//                       palette, paper (sky and haze), sun, highlight, glow, squall, rain, post. Chosen in
//                       build() with rng.fork('look') (42 % squall, 26 % golden, 12 % night, 20 % dawn),
//                       overridden by ctx.vary.hour. EXPOSURE, BLOOM and GRADE are each mood's `post`.
//   2. GLSL             sky dome (laid paper, marbled cirrus veins, fibres, pinhole stars), squall slab
//                       (stone-marble cells, each shaded as a hanging pouch; POUCH_VERT places the pouches' relief), rain
//                       strokes, splash crowns / plunge rings, and the vertex /
//                       fragment snippets that the hero's styleMaterial takes for boats, sharks and birds.
//   3. GEOMETRY         drifterGeometry (hull, sails, crew, rigging, floats), sharkGeometry, birdGeometry,
//                       puffGeometry, pouchGeometry (the unit cap of a pouch of the squall's base), slabWhole (the
//                       plan of the squall's edge band: where the slab is whole between its stones).
//   4. build(ctx)       a. mood and hero (src/parts/combed-sea.js placed at the origin, unrotated)
//                       b. PATH: hero.anchors.flyThrough (the brief's track) with the entry 80 m further back;
//                          uAtZ() turns a z into path u, camAt(u) is the camera's place
//                       c. sky dome, squall slab, its pouches (relief) and puffs, rain
//                       d. fleet (hero drifter keyed to u, the rest on a clock), wakes = hero.ops strokes
//                       e. sharks, their lenses and fin strokes (hero.ops), the rare TORUS
//                       f. birds (kittiwake wheels, terns), six scripted plunges with splash and ring
//                       g. great drops (three staged rings keyed to u)
//                       h. POIS, PORTAL, POST (exposure, bloom, grade: no scene fog, the haze is in every
//                          shader through hero.uniforms.uHaze / uHazeCol)
//                       i. update(): everything scripted is keyed to u, ambient loops to time
// SCRIPTED MOMENTS AND WHAT DRIVES THEM
//   great drops         dropOps[k].fields.r from u              (section g; update() writes op fields directly and
//                       allocates nothing)
//   hero drifter        boatPos(0, u): abeam at u = U_ABEAM; its wake is strokeOps[0]
//   highlight           hero.setHighlight(k) from u (hidden under the squall, slides in near u 0.25, thins to a
//                       fifth over the nonpareil field from u 0.75 so the ring stands alone)
//   shark lenses        lensOps[i % 2].fields (x, z, r) for the sharks nearest ahead; finOps[i % 3]. The sharks ride
//                       with their backs a quarter metre under: SHARK_FRAG draws everything below the waterline
//                       (varying vSub) darker and bluer, with a hairline where the skin breaks the surface
//   plunges             plunge[k].u0: dive, splash (splashGeo attributes aPos / aS), ring
//   kittiwakes peeling  birdU.uPeel from u (0.62 .. 0.72)
//   portal ring         hero.setProgress(u)
//   rare torus          eleven extra shark instances circling torus.c; lens drop + vortex in hero.ops
// STYLE: every surface is shaded by the hero's styleMaterial or by a ShaderMaterial here that uses the
//   hero's EBRU_GLSL palette and haze. Nothing is lit by three.js lights. The world returns style 'none'.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { makePath, clamp, lerp, smoothstep } from '../kit/core.js';
import { buildHero, styleMaterial, EBRU_GLSL } from '../parts/combed-sea.js';

// ------------------------------------------------------------------------------------------------
// 1. MOODS. palette: ground, turquoise, jade, cream, ochre, rim, slate (the hero's order).
const DEG = Math.PI / 180;
const MOODS = {
  squall: { title: 'The Combed Sea',
    palette: ['#0F1D40', '#1E9FA6', '#3F8F6E', '#F2E7C9', '#C98A2B', '#17151C', '#5B6672'],
    paper: '#F2E7C9', zenith: 0.16, vein: '#5B6672', sunAz: 40, sunEl: 42, hi: 1, hiCol: [1.25, 1.19, 1.02], hiFrom: 0.3,
    glow: 0, squall: 1, rain: 0.5, slabDark: 1, stars: 0, tint: [1, 1, 1], lantern: 0, bait: 0,
    post: { exposure: 1.0, bloom: { strength: 0.25, radius: 0.5, threshold: 0.95 }, grade: { saturation: 1.06, contrast: 1.04, tint: '#fffaf0', shadowTint: '#04060f', vignette: 0.22, grain: 0.035, aberration: 0 } } },
  golden: { title: 'The Combed Sea, Sun-Shower',
    palette: ['#1D1A48', '#1E9FA6', '#4A9468', '#F0DCAE', '#C98A2B', '#19141C', '#655F68'],
    paper: '#E3CFA0', zenith: 0.2, vein: '#7A6A66', sunAz: 34, sunEl: 17, hi: 1.5, hiCol: [1.5, 1.02, 0.42], hiFrom: -1,
    glow: 0, squall: 0.55, rain: 0.22, slabDark: 1.25, stars: 0, tint: [1.04, 0.97, 0.88], lantern: 0, bait: 0,
    post: { exposure: 1.08, bloom: { strength: 0.3, radius: 0.55, threshold: 0.92 }, grade: { saturation: 1.08, contrast: 1.05, tint: '#fff2d6', shadowTint: '#0a0614', vignette: 0.26, grain: 0.035, aberration: 0 } } },
  night: { title: 'The Combed Sea, Lacivert',
    palette: ['#070A1A', '#1A8F98', '#2A7C66', '#B4C0C4', '#C98A2B', '#03040A', '#525E7E'],
    paper: '#222C50', zenith: 0.93, vein: '#39445C', sunAz: 40, sunEl: 38, hi: 0.5, hiCol: [0.8, 0.92, 1.0], hiFrom: 0.3,
    glow: 0.85, squall: 1, rain: 0.5, rainAmt: 0.5, slabDark: 1.05, stars: 1, tint: [0.7, 0.78, 0.95], lantern: 1, bait: 0,
    post: { exposure: 1.0, bloom: { strength: 0.36, radius: 0.55, threshold: 0.85 }, grade: { saturation: 1.1, contrast: 1.05, tint: '#eef4ff', shadowTint: '#02030a', vignette: 0.3, grain: 0.04, aberration: 0 } } },
  dawn: { title: 'The Combed Sea, Pearl Dawn',
    palette: ['#2A3D62', '#2AA3A8', '#4C9478', '#EFE9DC', '#C98A2B', '#191822', '#66707C'],
    paper: '#E9E3D8', zenith: 0.12, vein: '#8A8E99', sunAz: 58, sunEl: 13, hi: 0.9, hiCol: [1.3, 1.12, 0.98], hiFrom: -1,
    glow: 0, squall: 0, rain: 0, slabDark: 1, stars: 0, tint: [1, 0.99, 1.0], lantern: 0, bait: 1,
    post: { exposure: 1.0, bloom: { strength: 0.25, radius: 0.5, threshold: 0.95 }, grade: { saturation: 1.02, contrast: 1.03, tint: '#fff8f4', shadowTint: '#060812', vignette: 0.2, grain: 0.035, aberration: 0 } } },
};

// ------------------------------------------------------------------------------------------------
// 2. GLSL
const SKY_VERT = /* glsl */`
varying vec3 vDir;
void main(){ vDir = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }
`;
// Laid paper. Cirrus veins are hairlines of a striped base read through four marbling operations in dome
// coordinates (comb, tine, vortex, shear); the whole sheet creeps 2 degrees a minute. Fibres and stars
// are fixed to the dome. Below the horizon the dome is the far sea's hazed mean.
const SKY_FRAG = /* glsl */`
precision highp float;
${EBRU_GLSL}
uniform vec3 uPaper;
uniform vec3 uZen;
uniform vec3 uVein;
uniform vec3 uSeaFar;
uniform float uTime;
uniform float uStars;
uniform float uSeedK;
varying vec3 vDir;
float hair(float px, float w){ return 1. - smoothstep(w * .5 - .5, w * .5 + .5, px); }
void main(){
  vec3 d = vDir / max(length(vDir), 1e-5);
  float h = d.y;
  vec3 col = mix(uPaper, uZen, smoothstep(.03, .85, h));
  vec2 p0 = d.xz / (max(h, 0.) + .3);
  float a = uTime * 5.8e-4 + uSeedK;
  float ca = cos(a), sa = sin(a);
  vec2 p = vec2(ca * p0.x - sa * p0.y, sa * p0.x + ca * p0.y);
  { float sp = .9; float t = p.x / sp; float f = (t - floor(t)) * sp; p.y -= .5 * (exp(-f / .16) + exp(-(sp - f) / .16)); }
  p.x -= 1.1 * exp(-abs(p.y - .4) / .5);
  { vec2 c = vec2(-.8, .6); vec2 q = p - c; float ang = 2.4 * exp(-length(q) / .9); float cs = cos(ang), sn = sin(ang); p = c + vec2(cs * q.x - sn * q.y, sn * q.x + cs * q.y); }
  p.y += .35 * sin(p.x * 1.7 + 1.);
  float f = p.y * 2.7;
  float id = floor(f), fr = f - id;
  float fw = max(fwidth(f), 1e-5);
  float lod = (1. - smoothstep(.22, .6, fw)) * smoothstep(.03, .14, h);
  float hv = ebHash1(vec2(id, 7.3));
  float vein = hair(min(fr, 1. - fr) / fw, 1.5) * step(.2, hv);
  float inner = hair(abs(fr - .36) / fw, 1.2) * step(.55, hv) * .6;
  col = mix(col, uVein, step(.66, hv) * .16 * lod);
  col = mix(col, uVein, max(vein, inner) * .72 * lod);
  // paper fibres
  vec2 q = p0 * 26.;
  vec2 g = floor(q); vec2 hf = ebHash2(g + 3.1);
  float th = hf.x * 3.1416; vec2 dr = vec2(cos(th), sin(th));
  vec2 rel = q - g - .25 - .5 * ebHash2(g + 9.7);
  float al = dot(rel, dr), ac = rel.x * dr.y - rel.y * dr.x;
  float dd = length(vec2(max(abs(al) - .3, 0.), ac));
  float fq = max(fwidth(q.x) + fwidth(q.y), 1e-5) * .6;
  float fleck = hair(dd / fq, 1.3) * (1. - smoothstep(.12, .4, fq)) * step(.45, hf.y) * step(0., h);
  col = mix(col, mix(col * .86, col * 1.5 + .02, uStars), fleck * .55);
  // pinhole stars (night paper)
  vec2 qs = p0 * 34.; vec2 gs = floor(qs); vec2 hs = ebHash2(gs + 41.);
  float ds = length(qs - gs - .2 - .6 * ebHash2(gs + 17.)) - (.025 + .055 * hs.x * hs.x);
  float fs = max(fwidth(qs.x) + fwidth(qs.y), 1e-5) * .6;
  float star = (1. - smoothstep(-1., 1., ds / fs)) * step(.72, hs.y) * smoothstep(.02, .12, h) * (1. - smoothstep(.2, .5, fs));
  col += uStars * star * uPig[3] * (1.1 + .5 * sin(uTime * (1. + 2. * hs.x) + hs.y * 40.));
  col = mix(uSeaFar, col, smoothstep(-.003, .002, h));
  gl_FragColor = vec4(col, 1.);
}
`;

const SLAB_VERT = /* glsl */`
varying vec3 vW;
void main(){ vec4 w = modelMatrix * vec4(position, 1.); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }
`;
// THE POUCHES OF THE BASE. Every cell of the squall's underside hangs as a pouch about its own heart: a paraboloid of the
// stone's radius but of no more than POUCH_R of a cell (29 m: a pouch is at most 58 m, 1.26 cells, wide), POUCH_K of its
// radius deep. Its rim lies in the base (130 m): nothing stands higher than the flat base did. POUCH_R is a measure: nine
// tenths of the base lie nearer to their own cell's heart than 0.63 of a cell (200,000 points of the base). POUCH_K is a
// choice (shallow, so that the slab stays the design's flat-bottomed slab); measured of it: the deepest pouch hangs 9.7 m,
// to 120.3 m, 88 m clear of the lens at its highest under the slab (the flight, both cameras, every squall seed of 1 to 40),
// and the paper strip under the edge keeps 98.8 % of its height or more by day, 91.5 % or more at night (six chance places).
const POUCH_R = 0.63;      // a radius, in cells (a cell is 46 m)
const POUCH_K = 1 / 3;     // depth over radius: a choice
// The cloud's pigments: lamp black laid SLAB_NAVY toward navy; the mean of the base, that black laid SLAB_SLATE toward slate.
// Read by the slab's shader (its bands and its far melt) and where the slab is built (the depth of the shadow step).
const SLAB_NAVY = 0.22, SLAB_SLATE = 0.4;
// The cell law's stone, for the places outside the shaders that need it (SLAB_WIDE below, slabWhole): the radius, in cells,
// of the stone whose heart lies `past` metres behind the edge line; none stands before the line (SLAB_FRAG's R over SC).
const slabStone = (past) => (past >= 0 ? lerp(0.24, 1.05, smoothstep(-20, 130, past)) : 0);
// The plan of the squall's edge band (slabWhole, section 3, where their measures stand): the width of the disc that tells
// open sky from the slab's, in metres (the least stone that stands: the cell law's stone on the edge line, twice its
// radius); how far past the place where that disc stops the sky stays open, in metres; the plan's levels a metre.
const SLAB_WIDE = 2 * 46 * slabStone(0), SLAB_BACK = 10, SLAB_STEP = 16;
// The relief: one unit cap (pouchGeometry) for every cell of the part of the base the flight can see, placed and sized here by
// the fragment's own cell law (the same hash of the same cell index, the same trailing edge, the same radius), so that a cap
// and the drawing on it cannot part; it rides the slab's drift.
const POUCH_VERT = /* glsl */`
${EBRU_GLSL}
attribute vec2 aCell;
uniform float uEdge;
uniform float uSeedS;
uniform float uDrift;
varying vec3 vW;
varying vec2 vCen;
#define SC 46.0
void main(){
  vec2 cen = (aCell + .5 + .7 * (ebHash2(aCell) - .5) - uSeedS) * SC;
  float edge = uEdge + 42. * sin(cen.x * .0105 + 1.3) + 24. * sin(cen.x * .027 + .4);
  float R = SC * mix(.24, 1.05, smoothstep(-20., 130., cen.y - edge)) * step(edge, cen.y);
  float rp = min(R, SC * ${POUCH_R});
  vec3 w = vec3(cen.x + position.x * rp, 130. + position.y * rp, cen.y + position.z * rp + uDrift);
  vW = w; vCen = cen;
  gl_Position = projectionMatrix * viewMatrix * vec4(w, 1.);
}
`;
// The squall's underside: stone-marble cells 46 m across whose bands churn outward; cells shrink to round
// stones and stop at the trailing edge (uEdge, a z); between stones that do not meet the base is whole inside the slab's own
// outline (uWhole, the plan made by slabWhole). Each cell is drawn as its pouch in the style's two steps of shade,
// split by the key's bearing. The far underside melts toward its own mean pigment under a sky lighter than the cloud, toward
// the paper under a sky no lighter (the night).
// With POUCH defined the same text draws the caps of the relief (opaque, each cut at its own cell's wall).
const SLAB_FRAG = /* glsl */`
precision highp float;
${EBRU_GLSL}
uniform float uTime;
uniform float uEdge;
uniform float uSeedS;
uniform float uDark;
uniform float uShade;
uniform float uDrift;
uniform vec3 uSunDir;
uniform sampler2D uWhole;
uniform vec4 uWholeBox;
varying vec3 vW;
#ifdef POUCH
varying vec2 vCen;
#endif
#define SC 46.0
float sl(float px, float w){ return 1. - smoothstep(w * .5 - .5, w * .5 + .5, px); }
void main(){
  vec2 xz = vW.xz - vec2(0., uDrift);
  vec2 q = xz / SC + uSeedS; vec2 g = floor(q), f = q - g;
  float d1 = 1e3, d2 = 1e3; vec2 r1 = vec2(0.), r2 = vec2(1., 0.), id1 = g, h1 = vec2(0.);
  for (int j = -1; j <= 1; j++) {
    for (int i = -1; i <= 1; i++) {
      vec2 o = vec2(float(i), float(j));
      vec2 hh = ebHash2(g + o);
      vec2 r = o + .5 + .7 * (hh - .5) - f;
      float d = dot(r, r);
      if (d < d1) { d2 = d1; r2 = r1; d1 = d; r1 = r; id1 = g + o; h1 = hh; }
      else if (d < d2) { d2 = d; r2 = r; }
    }
  }
  vec2 dr = r2 - r1;
  float eCell = dot(.5 * (r1 + r2), dr / max(length(dr), 1e-4)) * SC;
  vec2 cen = (id1 + .5 + .7 * (h1 - .5) - uSeedS) * SC;
  float edge = uEdge + 42. * sin(cen.x * .0105 + 1.3) + 24. * sin(cen.x * .027 + .4);
  float inside = smoothstep(-20., 130., cen.y - edge);
  float R = SC * mix(.24, 1.05, inside) * step(edge, cen.y);
  float dl = sqrt(d1) * SC;
  float sd = dl - R;
  float b = h1.x * 5. + uTime * .05 * (.5 + h1.y) - dl * dl / (SC * SC * .1);
  // derivatives: once, after the loop, and every one of them before the cap's discard below
  float fwq = max(fwidth(q.x) + fwidth(q.y), 1e-5) * .7;
  float fsd = max(fwidth(dl), 1e-5);
  float fwb = max(fwidth(b), 1e-5);
  float fwe = max(fwidth(eCell), 1e-5);
  float n = floor(b), bf = b - n;
  float hp = ebHash1(id1 * 1.7 + n * 3.1);
  vec3 black = mix(uPig[5], uPig[0], ${SLAB_NAVY}), slate = uPig[6];
  vec3 pig = hp < .34 ? black : (hp < .74 ? mix(black, slate, .5) : mix(slate, black, .1));
  vec3 mean = mix(black, slate, ${SLAB_SLATE});
  float lodB = 1. - smoothstep(.12, .45, fwb), lodC = 1. - smoothstep(.08, .3, fwq);
  vec3 col = mix(mean, pig, lodB * lodC);
  float rim = max(sl(min(bf, 1. - bf) / fwb, 1.4) * lodB, sl(eCell / fwe, 1.7)) * lodC;
  rim = max(rim, sl(abs(sd) / fsd, 2.) * lodC);
  // the pouch's two steps of shade, the style's own (the lit pigment; the shadow pigment 35 % toward navy; a hairline where
  // they meet). No light falls on a cloud's base from above, so the key is laid level on its own bearing: the half of each
  // pouch that leans toward the key is lit, the half that leans away and the level base between pouches are in shadow. Cells
  // too small in the frame to be split take the mean of the two. The shadow step is as deep as the look's sky allows (uShade,
  // worked out where the slab is built): whole under a sky of twice the cloud's light or more, none under a sky no lighter
  // than the cloud (the night). The hairline where the two steps meet is drawn as strongly as the step is deep: by night
  // there are no two steps and no line between them (it lay black across every pouch), and a pouch's turn is told by its
  // own outline against its neighbours.
  float rp = min(R, SC * ${POUCH_R});
  float tn = 2. * ${POUCH_K.toFixed(4)} * dl / max(rp, 1e-3);            // the paraboloid's slope at this distance from the heart
  vec2 key = uSunDir.xz / max(length(uSunDir.xz), 1e-4);
  float ndl = tn / sqrt(1. + tn * tn) * dot(-r1, key) / max(sqrt(d1), 1e-4);
  float fwn = max(fwidth(ndl), 1e-4);
  // a cap ends at its own cell's wall. It is cut here, after the last derivative: past a discard a derivative is not defined
  // on every graphics card. The .5 m is a choice: one heart worked out twice (here and in POUCH_VERT) differs by rounding
  // only, and two hearts are never nearer than 0.3 of a cell (13.8 m)
#ifdef POUCH
  if (abs(cen.x - vCen.x) + abs(cen.y - vCen.y) > .5) discard;
#endif
  float on = 1. - smoothstep(-.7, .7, (dl - rp) / fsd);
  float lit = mix(.5, smoothstep(-fwn, fwn, ndl), lodC) * on;
  col = mix(mix(col, uPig[0], .35 * uShade) * mix(1., .72, uShade), col, lit);
  rim = max(rim, sl(abs(ndl) / fwn, 1.4) * .85 * on * lodC * uShade);
  float alpha = 1. - smoothstep(-.7, .7, sd / fsd);
#ifdef POUCH
  alpha = 1.;
#else
  // the slab is whole inside its outline: where the plan (slabWhole) says the slab stands between stones, the base is drawn
  // there as it is drawn everywhere (its bands, its cells' walls, the shadow step of the level base), and where that base
  // ends against the open sky it has the hairline every stone's edge has. The plan is read between its texels (1 m): wh
  // is how far inside the slab's side of that line the place lies, in metres (8 at most); whp the same in pixels (fwq
  // is a pixel's width in cells), or in spans of 4 m where a pixel holds more than that
  float wh = (textureLod(uWhole, (xz - uWholeBox.xy) * uWholeBox.zw, 0.).r * 255. - 128.) / ${SLAB_STEP}.;
  float whp = wh / clamp(fwq * SC, 1e-4, 4.);
  alpha = max(alpha, clamp(whp + .5, 0., 1.));
  rim = max(rim, sl(abs(whp), 2.) * step(0., sd) * lodC);
#endif
  col = mix(col, uPig[5] * .45, rim * .9) * uDark;
  // the far underside melts, by the haze law of every shader here. Under a sky lighter than the cloud (uShade 1) it melts
  // toward its own mean pigment raised to the paper's weight (the luminance of linear red, green and blue): it pales with
  // distance as the paper haze pales all things and stays slate and lamp black; the paper's cream laid over lamp black is
  // what showed as brown. Under a sky no lighter than the cloud (the night, uShade 0) it melts toward the paper itself,
  // as every other thing does there: the night's paper is navy, and the cloud's own mean stood less blue than all around
  // it. Between the two, by uShade.
  vec3 lw = vec3(.2126, .7152, .0722);
  col = mix(col, mix(mean * (dot(uHazeCol, lw) / max(dot(mean, lw), 1e-4)), uHazeCol, 1. - uShade), ebHaze(length(vW - cameraPosition)) * .85);
  gl_FragColor = vec4(col, alpha);
}
`;

// Rain: cream hairline strokes in a box that wraps round the camera. Never thinner than 1.6 px.
const RAIN_VERT = /* glsl */`
attribute vec3 aBase;
attribute float aRnd;
uniform vec3 uBox;
uniform vec3 uVel;
uniform vec3 uCen;
uniform float uTime;
uniform float uLen;
uniform float uWid;
uniform float uPxAng;
uniform float uAmt;
uniform vec2 uZEdge;
uniform vec2 uNearFade;
varying vec2 vUv;
varying float vA;
varying float vDist;
void main(){
  vec3 p = aBase * uBox + uVel * uTime * (.8 + .4 * aRnd);
  vec3 rel = mod(p - uCen, uBox) - .5 * uBox;
  vec3 w = uCen + rel;
  vec3 dn = uVel / max(length(uVel), 1e-4);
  vec3 P = w + dn * (uv.y - .5) * uLen * (.7 + .6 * aRnd);
  vec3 tc = P - cameraPosition;
  float dist = length(tc);
  vec3 sd = cross(dn, tc); sd /= max(length(sd), 1e-4);
  float wd = max(uWid, dist * uPxAng * 1.6);
  P += sd * (uv.x - .5) * wd;
  vUv = uv; vDist = dist;
  float box = 1. - smoothstep(.36, .5, max(abs(rel.x) / uBox.x, abs(rel.z) / uBox.z));
  vA = uAmt * smoothstep(uZEdge.x, uZEdge.x + uZEdge.y, w.z) * smoothstep(uNearFade.x, uNearFade.y, dist) * box * clamp(uWid / wd, .3, 1.) * step(.2, P.y);
  gl_Position = projectionMatrix * viewMatrix * vec4(P, 1.);
}
`;
const RAIN_FRAG = /* glsl */`
precision highp float;
${EBRU_GLSL}
uniform vec3 uTint;
varying vec2 vUv;
varying float vA;
varying float vDist;
void main(){
  float a = vA * (1. - smoothstep(.25, .5, abs(vUv.x - .5))) * smoothstep(0., .3, vUv.y) * (1. - smoothstep(.75, 1., vUv.y));
  vec3 col = mix(uPig[3] * uTint, uHazeCol, ebHaze(vDist) * .6);
  gl_FragColor = vec4(col, a);
}
`;

// Splash crowns (kind 0: upright card facing the camera) and plunge rings (kind 1: flat on the sea).
const SPLASH_VERT = /* glsl */`
attribute vec3 aPos;
attribute vec4 aS;
varying vec2 vUv;
varying vec4 vS;
varying float vDist;
void main(){
  vec3 P;
  if (aS.z < .5) {
    vec3 tc = cameraPosition - aPos; tc.y = 0.;
    vec3 rt = normalize(vec3(tc.z, 0., -tc.x) + vec3(1e-4, 0., 0.));
    P = aPos + rt * (uv.x - .5) * aS.x * 1.5 + vec3(0., uv.y * aS.x, 0.);
  } else {
    P = aPos + vec3((uv.x - .5) * aS.x, 0., (uv.y - .5) * aS.x);
  }
  vUv = uv; vS = aS;
  vec4 mv = viewMatrix * vec4(P, 1.);
  vDist = length(mv.xyz);
  gl_Position = projectionMatrix * mv;
}
`;
const SPLASH_FRAG = /* glsl */`
precision highp float;
${EBRU_GLSL}
uniform vec3 uTint;
varying vec2 vUv;
varying vec4 vS;
varying float vDist;
void main(){
  float ph = vS.y;
  float sdf = 1e3;
  if (vS.z < .5) {
    // nine jets and their beads rising from the foot of the card, then falling back
    vec2 p = vec2((vUv.x - .5) * 1.5, vUv.y);
    float grow = sin(clamp(ph, 0., 1.) * 1.5708);
    float fall = 1. - smoothstep(1., 1.7, ph);
    for (int k = 0; k < 9; k++) {
      float fk = float(k);
      vec2 h = ebHash2(vec2(fk * 3.7 + vS.w * 17., vS.w * 5.3 + 1.1));
      float ang = (fk - 4.) * .2 + (h.x - .5) * .16;
      vec2 dir = vec2(sin(ang), cos(ang));
      float len = (.42 + .5 * h.y) * grow * mix(.45, 1., fall);
      vec2 b = vec2((fk - 4.) * .035, .0);
      vec2 pa = p - b; float s = clamp(dot(pa, dir) / max(len, 1e-3), 0., 1.);
      sdf = min(sdf, length(pa - dir * len * s) - mix(.06, .014, s) * fall);
      vec2 tip = b + dir * len;
      sdf = min(sdf, length(p - tip - dir * .07) - .034 * fall);
      sdf = min(sdf, length(p - tip - dir * (.16 + .1 * h.x) * grow) - .022 * fall);
    }
    sdf = min(sdf, length((p - vec2(0., .02)) * vec2(1., 3.2)) - .2 * grow * fall);
  } else {
    float r = length(vUv - .5) * 2.;
    float R = .92 * sqrt(clamp(ph / 2.4, 0., 1.));
    float wd = mix(.16, .03, clamp(ph / 2.4, 0., 1.)) * (1. - smoothstep(2., 2.4, ph));
    sdf = abs(r - R) - .5 * wd;
    sdf = wd < .004 ? 1. : sdf;
  }
  float fw = max(fwidth(sdf), 1e-5);
  float a = (1. - smoothstep(-.6, .6, sdf / fw)) * step(.001, ph);
  float rim = 1. - smoothstep(.8, 2., -sdf / fw);
  vec3 col = mix(uPig[3], uPig[5], rim * .85) * uTint;
  col = mix(col, uHazeCol, ebHaze(vDist));
  gl_FragColor = vec4(col, a);
}
`;

// ---- snippets handed to the hero's styleMaterial (it supplies op / on / mm in the vertex shader and
//      pig / rim / spotAmt / spotCream / op / sRim() in the fragment shader)
const PART_VERT_DECL = /* glsl */`
attribute float aPart;
attribute vec2 aUV;
attribute float aSeed;
uniform float uPxAng;
varying float vPart;
varying vec2 vUV;
`;
const PART_FRAG_DECL = /* glsl */`
uniform float uLantern;
varying float vPart;
varying vec2 vUV;
`;
// parts: 0 hull, 1 sail, 2 spars, 3 crew, 4 rigging, 5 cork floats, 6 pennant, 7 deck, 8 lantern
const BOAT_VERT_MAIN = /* glsl */`
  vPart = aPart; vUV = aUV;
  float bph = aSeed * 6.283;
  if (aPart > .5 && aPart < 1.5) {
    float su = sin(3.1416 * aUV.x), sv = sin(3.1416 * clamp(aUV.y * .9 + .08, 0., 1.));
    float amp = .95 + .16 * sin(uTime * 1.3 + bph + aUV.y * 3.) + .045 * sin(uTime * 6.5 + aUV.x * 9. + bph);
    vec3 lee = on * (on.x < 0. ? -1. : 1.);
    op += lee * su * sv * amp;
    on = normalize(lee - amp * (vec3(0., 0., 1.) * cos(3.1416 * aUV.x) * sv * .42 + vec3(0., 1., 0.) * su * cos(3.1416 * clamp(aUV.y * .9 + .08, 0., 1.)) * .3));
  } else if (aPart > 5.5 && aPart < 6.5) {
    op.x += aUV.x * .55 * sin(uTime * 6. - aUV.x * 5. + bph);
    op.y += aUV.x * .16 * sin(uTime * 4.3 - aUV.x * 4. + bph);
  } else if (aPart > 2.5 && aPart < 3.5) {
    float hk = sin(uTime * 1.7 + aUV.x * 6.283 + bph);
    op.x += hk * .3 * aUV.y; op.y -= abs(hk) * .07 * aUV.y;
  } else if (aPart > 4.5 && aPart < 5.5) {
    vec4 fw = mm * vec4(position, 1.);
    op.y += ebSwell(fw.xz) + position.y - fw.y;
    on = (normalize(cameraPosition - fw.xyz) + vec3(0., 1.5, 0.)) * mat3(mm);      // foam and cork: lit from above, never a rim
  } else if (aPart > 3.5 && aPart < 4.5) {
    vec4 rw = mm * vec4(position, 1.);
    op += on * max(length(rw.xyz - cameraPosition) * uPxAng * .85 - .03, 0.);
  }
`;
const BOAT_FRAG = /* glsl */`
  {
    float st = vUV.y * 7.;
    float fst = max(fwidth(st), 1e-5);
    float bu = vUV.x * 11. + floor(st) * .37;
    float fbu = max(fwidth(bu), 1e-5);
    float cl = vUV.x * 9.;
    float fcl = max(fwidth(cl), 1e-5);
    float fvy = max(fwidth(vUV.y), 1e-5);
    float pk = op.x / .28;
    float fpk = max(fwidth(pk), 1e-5);
    if (vPart < .5) {
      float fr = fract(st);
      rim = max(rim, sRim(min(fr, 1. - fr) / fst, 1.3) * (1. - smoothstep(.2, .5, fst)) * .9);
      rim = max(rim, sRim((.5 - abs(fract(bu) - .5)) / fbu, 1.1) * .55 * (1. - smoothstep(.1, .3, fbu)));
      pig = vUV.y > .857 ? uPig[3] : (vUV.y > .714 ? mix(uPig[5], uPig[6], .3) : pig);
      pig = mix(pig, mix(uPig[5], uPig[2], .35), step(vUV.y, .2) * .8);
    } else if (vPart < 1.5) {
      float ci = floor(cl), cf = cl - ci;
      float hc = ebHash1(vec2(ci, 3.3));
      pig *= cf < .13 ? .74 : (hc > .7 ? 1.1 : (hc < .2 ? .88 : 1.));
      rim = max(rim, sRim(min(cf, 1. - cf) / fcl, 1.1) * .5 * (1. - smoothstep(.15, .4, fcl)));
      float reef = min(abs(vUV.y - .2), abs(vUV.y - .36));
      float dash = step(abs(fract(cl * 2. + .25) - .5), .2);
      rim = max(rim, (1. - smoothstep(.007, .007 + fvy, reef)) * dash * (1. - smoothstep(.01, .03, fvy)));
      float bolt = min(min(vUV.x, 1. - vUV.x) * 3., min(vUV.y, 1. - vUV.y));
      pig *= bolt < .022 ? .7 : 1.;
    } else if (vPart > 6.5 && vPart < 7.5) {
      rim = max(rim, sRim((.5 - abs(fract(pk) - .5)) / fpk, 1.1) * .5 * (1. - smoothstep(.15, .4, fpk)));
    } else if (vPart > 7.5) {
      pig = mix(pig, uPig[4] * 5., uLantern);
    }
  }
`;
// sharks: parts 0 body, 1 inside of the mouth, 2 fins. aUV.x = station along the body, aUV.y = fin height.
const SHARK_VERT_MAIN = /* glsl */`
  vPart = aPart; vUV = aUV;
  float sph = aSeed * 6.283;
  float sst = aUV.x;
  op.x += sin(uTime * 2.094 - sst * 5.2 + sph) * (.07 + .95 * sst * sst);
  if (aPart > 1.5) op.x += aUV.y * aUV.y * .55 * sin(uTime * 1.4 + sph * 1.7 + sst * 4.);
  if (sst < .12) op.xy *= 1. + .1 * sin(uTime * .9 + sph) * (1. - sst / .12);
  { vec4 sw = mm * vec4(op, 1.); vSub = sw.y - ebSwell(sw.xz); }
`;
const SHARK_VERT_DECL = PART_VERT_DECL + 'varying float vSub;\n';
const SHARK_FRAG_DECL = PART_FRAG_DECL + 'varying float vSub;\n';
const SHARK_FRAG = /* glsl */`
  {
    float fsx = max(fwidth(vUV.x), 1e-5);
    float mott = 1., arch = 0.;
    if (vPart < .5) {
      float gs = (vUV.x - .12) / .03;
      float gi = floor(gs), gf = gs - gi;
      float gon = step(0., gs) * step(gs, 5.);
      float fg = fsx / .03;
      arch = gon * step(.3, gf) * step(gf, .78);
      pig = mix(pig, uPig[3], arch);
      rim = max(rim, gon * max(sRim(abs(gf - .3) / fg, 1.3), sRim(abs(gf - .78) / fg, 1.3)));
      mott = 1. - gon;
      pig = mix(pig, uPig[3], step(vUV.x, .014));
    } else if (vPart < 1.5) {
      float gs = vUV.x * 5.; float gf = fract(gs);
      float fg = fsx * 5.;
      arch = step(.42, gf) * step(gf, .82);
      pig = mix(mix(uPig[5], uPig[0], .5), uPig[3], arch);
      rim = max(rim, max(sRim(abs(gf - .42) / fg, 1.3), sRim(abs(gf - .82) / fg, 1.3)));
      mott = 0.;
    } else {
      mott = .45;
    }
    // the back is spotted stone-marbling of its own: dark and pale stones, two sizes (the shared spots are cream / jade)
    spotAmt = 0.;
    vec3 dk = mix(uPig[6], uPig[5], .66), pl = mix(uPig[6], uPig[3], .6);
    float onA = step(hs.y, .72 * mott), onB = step(ht.y, .5 * mott);
    float lA = 1. - smoothstep(.12, .4, fwS / uSpotCell), lB = 1. - smoothstep(.12, .4, fwS / (uSpotCell * .31));
    pig = mix(pig, hs.z < .3 ? pl : dk, onA * (1. - smoothstep(-.5, .5, sdA / fwS)) * mix(.5, 1., lA));
    rim = max(rim, onA * lA * sRim(abs(sdA) / fwS, 1.2) * .6);
    pig = mix(pig, ht.z < .35 ? pl : dk, onB * (1. - smoothstep(-.5, .5, sdB / fwS)) * lB);
    // below the waterline the body is seen through the lens: darker and bluer, with a hairline where the skin
    // breaks the surface, so only snout tip, dorsal and upper tail lobe are clean pigment
    float sb = vSub + .05;
    float fsb = max(fwidth(sb), 1e-5);
    float under = 1. - smoothstep(-fsb, fsb, sb);
    pig = mix(pig, mix(uPig[7], uPig[1], .34), under * mix(.7, .28, arch));
    rim = max(rim, sRim(abs(sb) / fsb, 1.6) * .9);
  }
`;
// birds: aPart = signed wing span fraction; aA = centre xyz + radius; aB = phase, speed (or pitch), mode, size
//   mode 0 kittiwake wheel, 1 tern hovering and plunging on its own clock, 2 scripted (aA.xyz is the bird)
const BIRD_VERT_DECL = /* glsl */`
attribute float aPart;
attribute vec4 aA;
attribute vec4 aB;
uniform float uPeel;
`;
const BIRD_VERT_MAIN = /* glsl */`
  {
    float t = uTime, ph = aB.x, mode = aB.z;
    float hsh = fract(ph * 7.31);
    vec3 bp = aA.xyz; vec2 fw2 = vec2(-.6, -.8); float pitch = 0., flapK = 1., fold = 0., flapHz = 7.;
    if (mode < .5) {
      float Rr = aA.w * (1. + .16 * sin(t * .21 + ph * 3.)) + uPeel * 18. * step(.55, hsh);
      float th = ph + aB.y * t;
      bp += vec3(cos(th) * Rr, 3.5 * sin(t * .37 + ph * 5.) - uPeel * 16. * step(.55, hsh), sin(th) * Rr * .8);
      fw2 = normalize(vec2(-sin(th), cos(th) * .8)) * (aB.y < 0. ? -1. : 1.);
      flapK = smoothstep(-.3, .5, sin(t * .45 + ph * 4.));
      flapHz = 5.5;
    } else if (mode < 1.5) {
      float T = 8. + 7. * hsh;
      float tau = fract(t / T + ph);
      float dive = smoothstep(.78, .875, tau) * (1. - smoothstep(.885, .99, tau));
      bp.x += aA.w * cos(t * .7 + ph * 6.); bp.z += aA.w * sin(t * .53 + ph * 4.);
      bp.y = mix(aA.y + .8 * sin(t * 1.1 + ph * 9.), .4, dive);
      pitch = -1.25 * smoothstep(.78, .83, tau) * (1. - smoothstep(.86, .9, tau)) + .5 * smoothstep(.89, .93, tau) * (1. - smoothstep(.95, 1., tau));
      fold = smoothstep(.79, .83, tau) * (1. - smoothstep(.87, .9, tau));
      fw2 = normalize(vec2(-.6 + .5 * sin(ph * 30.), -.8));
      flapHz = 9.;
    } else {
      pitch = aB.y; fold = clamp(-aB.y, 0., 1.); fw2 = normalize(vec2(-.5, -.85)); flapHz = 9.;
    }
    float wing = abs(aPart);
    vec3 lp = op, ln = on;
    float fa = sin(t * flapHz + ph * 9.) * flapK * (1. - fold);
    lp.y += wing * (.36 * fa + .05) - wing * wing * .14 * (1. - fa);
    lp.x *= mix(1., .3, fold * step(.01, wing));
    lp.z += fold * wing * .2;
    float cp = cos(pitch), sp = sin(pitch);
    lp = vec3(lp.x, lp.y * cp + lp.z * sp, -lp.y * sp + lp.z * cp);
    ln = vec3(ln.x, ln.y * cp + ln.z * sp, -ln.y * sp + ln.z * cp);
    vec3 fwd = vec3(fw2.x, 0., fw2.y), rgt = vec3(-fw2.y, 0., fw2.x);
    op = bp + (rgt * lp.x + vec3(0., 1., 0.) * lp.y - fwd * lp.z) * aB.w;
    on = rgt * ln.x + vec3(0., 1., 0.) * ln.y - fwd * ln.z;
  }
`;

// ------------------------------------------------------------------------------------------------
// 3. GEOMETRY
function makeAcc() {
  const P = [], C = [], A = [], U = [], I = [];
  const acc = {
    v(x, y, z, c, part, u = 0, v = 0) { P.push(x, y, z); C.push(c.r, c.g, c.b); A.push(part); U.push(u, v); return P.length / 3 - 1; },
    quad(a, b, c, d) { I.push(a, b, c, a, c, d); },
    tri(a, b, c) { I.push(a, b, c); },
    // nu x nv vertices from fn(i, j) -> [x, y, z, colour, u, v]; wrap joins the last column to the first
    grid(nu, nv, fn, part, wrap = false) {
      const base = P.length / 3;
      for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) { const r = fn(i, j); acc.v(r[0], r[1], r[2], r[3], part, r[4] ?? 0, r[5] ?? 0); }
      const ni = wrap ? nu : nu - 1;
      for (let j = 0; j < nv - 1; j++) for (let i = 0; i < ni; i++) {
        const i1 = (i + 1) % nu;
        acc.quad(base + j * nu + i, base + j * nu + i1, base + (j + 1) * nu + i1, base + (j + 1) * nu + i);
      }
    },
    // a tapered tube through a polyline pts [[x,y,z,r], ...]
    tube(pts, sides, c, part, u = 0, v0 = 0, v1 = 1) {
      const a = new THREE.Vector3(), d = new THREE.Vector3(), s1 = new THREE.Vector3(), s2 = new THREE.Vector3();
      const n = pts.length;
      acc.grid(sides, n, (i, j) => {
        const p = pts[j], q0 = pts[Math.max(j - 1, 0)], q1 = pts[Math.min(j + 1, n - 1)];
        d.set(q1[0] - q0[0], q1[1] - q0[1], q1[2] - q0[2]).normalize();
        a.set(0, 1, 0); if (Math.abs(d.y) > 0.9) a.set(1, 0, 0);
        s1.crossVectors(d, a).normalize(); s2.crossVectors(d, s1);
        const th = i / sides * Math.PI * 2, cs = Math.cos(th) * p[3], sn = Math.sin(th) * p[3];
        const col = typeof c === 'function' ? c(i, j, th) : c;
        return [p[0] + s1.x * cs + s2.x * sn, p[1] + s1.y * cs + s2.y * sn, p[2] + s1.z * cs + s2.z * sn, col, u, lerp(v0, v1, j / (n - 1))];
      }, part, true);
    },
    build() {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
      g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3));
      g.setAttribute('aPart', new THREE.Float32BufferAttribute(A, 1));
      g.setAttribute('aUV', new THREE.Float32BufferAttribute(U, 2));
      g.setIndex(I);
      g.computeVertexNormals();
      return g;
    },
  };
  return acc;
}

// A 14 m herring drifter. Local space: bow -Z, starboard +X, waterline y 0.
function drifterGeometry(pal) {
  const acc = makeAcc();
  const tar = pal.black.clone().lerp(pal.navy, 0.3), wood = pal.slate.clone().lerp(pal.black, 0.45), spar = pal.slate.clone().lerp(pal.cream, 0.25);
  const oil = pal.cream.clone().lerp(pal.slate, 0.12), cork = pal.cream.clone().lerp(pal.slate, 0.2);
  const NS = 16, NJ = 7, HL = 7;
  const beam = (s) => 2.25 * Math.pow(Math.max(1 - Math.pow(Math.abs(s), s < 0 ? 2.3 : 3.0), 0), 0.55);
  const top = (s) => 1.15 + 0.7 * s * s + (s < 0 ? 0.3 * s * s : 0);
  const keel = (s) => -0.75 + 0.5 * Math.pow(Math.abs(s), 4);
  for (const side of [1, -1]) {
    acc.grid(NS + 1, NJ + 1, (ii, j) => {
      const i = side > 0 ? ii : NS - ii;                      // keeps the winding outward on both sides
      const s = -1 + 2 * i / NS, t = j / NJ, w = beam(s);
      return [side * w * Math.pow(t, 0.48), lerp(keel(s), top(s), Math.pow(t, 1.35)), s * HL, tar, i / NS, t];
    }, 0);
    // gunwale rail and rubbing strake
    const rail = [], rub = [];
    for (let i = 0; i <= NS; i++) { const s = -1 + 2 * i / NS; rail.push([side * beam(s), top(s) + 0.03, s * HL, 0.07]); rub.push([side * beam(s) * Math.pow(0.6, 0.48) * 1.02, lerp(keel(s), top(s), Math.pow(0.6, 1.35)), s * HL, 0.05]); }
    acc.tube(rail, 4, pal.cream, 2); acc.tube(rub, 4, wood, 2);
  }
  // stem and stern posts, rudder
  acc.tube([[0, -0.3, -HL + 0.25, 0.1], [0, 1.2, -HL - 0.02, 0.1], [0, 2.75, -HL - 0.12, 0.08]], 5, wood, 2);
  acc.tube([[0, -0.3, HL - 0.25, 0.1], [0, 1.2, HL + 0.02, 0.1], [0, 2.3, HL + 0.08, 0.08]], 5, wood, 2);
  acc.grid(2, 2, (i, j) => [0, -0.8 + j * 2.2, HL + 0.05 + i * 0.75 * (1 - j * 0.4), wood], 2);
  // deck, hatch coaming, net heap, capstan
  acc.grid(2, NS + 1, (i, j) => { const s = -1 + 2 * j / NS; return [(i ? 1 : -1) * beam(s) * 0.9, top(s) - 0.5, s * HL * 0.97, wood]; }, 7);
  const deckY = 0.72;
  const box = (x0, x1, y0, y1, z0, z1, c, part = 2) => {
    const k = [[x0, z0], [x1, z0], [x1, z1], [x0, z1]];
    acc.grid(4, 2, (i, j) => [k[i][0], j ? y1 : y0, k[i][1], c], part, true);
    acc.grid(2, 2, (i, j) => [i ? x1 : x0, y1, j ? z0 : z1, c], part);
  };
  box(-0.95, 0.95, deckY, deckY + 0.42, -1.3, 1.0, spar);
  box(-0.5, 0.5, deckY, deckY + 1.25, 5.0, 6.0, wood);
  acc.grid(7, 4, (i, j) => { const th = i / 7 * Math.PI * 2, r = [1.25, 1.05, 0.6, 0.02][j], y = [0, 0.3, 0.55, 0.62][j]; return [0.2 + Math.cos(th) * r * 0.9, deckY + y, 2.6 + Math.sin(th) * r * 1.2, j % 2 ? cork : pal.slate]; }, 2, true);
  acc.tube([[0, deckY, -4.4, 0.28], [0, deckY + 0.7, -4.4, 0.2], [0, deckY + 0.78, -4.4, 0.3]], 6, wood, 2);
  // masts and yards
  const FM = -2.6, MM = 4.3;
  acc.tube([[0, deckY, FM, 0.18], [0, 6, FM - 0.1, 0.15], [0, 11.9, FM - 0.2, 0.08]], 6, spar, 2);
  acc.tube([[0, deckY, MM, 0.14], [0, 8.9, MM + 0.2, 0.07]], 6, spar, 2);
  const sail = (zm, ang, T, Cw, H, K, nseed) => {
    const sa = Math.sin(ang), ca = Math.cos(ang);
    const map = (zs, y) => [0.1 + (zs - T[0]) * sa, y, T[0] + (zs - T[0]) * ca];      // swung to leeward about the tack
    acc.grid(9, 9, (i, j) => {
      const u = i / 8, v = j / 8;
      const zs = lerp(lerp(T[0], Cw[0], u), lerp(H[0], K[0], u), v), y = lerp(lerp(T[1], Cw[1], u), lerp(H[1], K[1], u), v) - 0.25 * Math.sin(Math.PI * u) * (1 - v);
      const m = map(zs, y); return [m[0], m[1], m[2], pal.ochre, u, v];
    }, 1);
    const h = map(H[0] - 0.4, H[1] - 0.2), k = map(K[0] + 0.3, K[1] + 0.17);
    acc.tube([[h[0], h[1], h[2], 0.075], [k[0], k[1], k[2], 0.06]], 5, spar, 2);
    return { tack: map(T[0], T[1]), clew: map(Cw[0], Cw[1]), peak: k };
  };
  const s1 = sail(FM, 0.32, [-6.5, 1.75], [1.5, 1.95], [-4.9, 9.3], [2.0, 12.7]);
  const s2 = sail(MM, 0.3, [2.9, 1.95], [8.2, 2.35], [3.3, 7.0], [7.6, 10.0]);
  // pennant
  acc.grid(6, 2, (i, j) => { const u = i / 5; return [0.05 + u * 0.5, 12.1 + (j ? 0.24 : -0.24) * (1 - u), FM - 0.2 + u * 1.7, pal.ochre, u, j]; }, 6);
  // rigging ribbons (widened with distance in the vertex shader)
  const rope = (a, b) => acc.tube([[a[0], a[1], a[2], 0.03], [b[0], b[1], b[2], 0.03]], 3, pal.black, 4);
  rope([0, 11.6, FM - 0.2], [0, 2.7, -HL - 0.1]); rope([0, 11.4, FM - 0.2], [2.1, 1.25, -1.2]); rope([0, 11.4, FM - 0.2], [-2.1, 1.25, -1.2]);
  rope([0, 8.7, MM + 0.2], [0, 2.3, HL]); rope([0, 8.5, MM + 0.2], [1.9, 1.3, 5.3]); rope([0, 8.5, MM + 0.2], [-1.9, 1.3, 5.3]);
  rope(s1.clew, [1.9, 1.3, 3.2]); rope(s2.clew, [0.4, 2.2, HL]); rope(s1.tack, [0, 2.6, -HL]);
  // three oilskinned hands hauling over the starboard rail
  const hand = (x, z, k) => {
    const uu = k / 3, hv = (y) => clamp(y / 1.75, 0, 1);
    const T = (pts, sides, c) => acc.grid(sides, pts.length, (i, j) => {
      const p = pts[j], th = i / sides * Math.PI * 2;
      return [x + p[0] + Math.cos(th) * p[3], deckY + p[1], z + p[2] + Math.sin(th) * p[3] * (p[4] ?? 1), typeof c === 'function' ? c(j) : c, uu, hv(p[1])];
    }, 3, true);
    T([[-0.02, 0, -0.11, 0.1], [-0.02, 0.85, -0.11, 0.11]], 5, pal.slate.clone().lerp(pal.black, 0.5));
    T([[-0.02, 0, 0.11, 0.1], [-0.02, 0.85, 0.11, 0.11]], 5, pal.slate.clone().lerp(pal.black, 0.5));
    T([[0, 0.62, 0, 0.33, 1.15], [0.03, 1.0, 0, 0.26, 1.2], [0.08, 1.42, 0, 0.21, 1.35], [0.12, 1.52, 0, 0.08]], 7, oil);
    T([[0.14, 1.5, 0, 0.07], [0.16, 1.58, 0, 0.115], [0.17, 1.7, 0, 0.11], [0.17, 1.76, 0, 0.03]], 6, (j) => (j >= 2 ? pal.black : pal.cream));
    T([[0.15, 1.71, 0, 0.21, 1.1], [0.13, 1.735, 0, 0.02]], 7, pal.black);
    for (const sgn of [1, -1]) acc.tube([[x + 0.1, deckY + 1.4, z + sgn * 0.25, 0.075], [x + 0.42, deckY + 1.18, z + sgn * 0.2, 0.065], [x + 0.78, deckY + 0.98, z + sgn * 0.1, 0.055]], 4, oil, 3, uu, hv(1.4), hv(1.0));
  };
  hand(0.95, 0.6, 0); hand(1.05, 2.4, 1); hand(0.8, 4.2, 2);
  // the net coming aboard and a line of cork floats trailing astern to starboard
  acc.grid(2, 6, (i, j) => [2.05 + i * 0.15 + j * 0.02, 1.3 - j * 0.28, 0.2 + i * 4.4, j % 2 ? cork : pal.slate], 2);
  for (let k = 0; k < 16; k++) {
    const z = 5.5 + k * 2.1, x = 2.5 + 0.006 * (z - 5.5) * (z - 5.5), r = 0.3;
    const b = acc.v(x, 0.12 + r * 0.7, z, pal.cream, 5), t = acc.v(x, 0.12 - r * 0.6, z, cork, 5);
    const ring = []; for (let i = 0; i < 5; i++) { const th = i / 5 * Math.PI * 2; ring.push(acc.v(x + Math.cos(th) * r, 0.12, z + Math.sin(th) * r, k % 4 === 0 ? pal.slate : cork, 5)); }
    for (let i = 0; i < 5; i++) { acc.tri(b, ring[(i + 1) % 5], ring[i]); acc.tri(t, ring[i], ring[(i + 1) % 5]); }
  }
  // foam at the waterline: a scalloped collar hugging the hull and a short wake astern (they ride the swell)
  for (const side of [1, -1]) acc.grid(2, 2 * NS + 1, (i, j) => {
    const s = -1 + j / NS, w = beam(s);
    return [side * (w + (i ? 0.3 + 0.55 * j / (2 * NS) + (j % 2 ? 0.3 : 0) : -0.2)), 0.2, s * HL * 1.02, i && j % 4 === 0 ? cork : pal.cream];
  }, 5);
  acc.grid(3, 10, (i, j) => { const dz = j * 1.6, hw = (1 - j / 9) * (1.1 + 0.1 * dz) + (j % 2 ? 0.35 : 0); return [(i - 1) * hw, 0.18, HL + dz, i === 1 && j % 2 ? cork : pal.cream]; }, 5);
  // masthead lantern
  { const y = 12.0, r = 0.26, b = acc.v(0, y + r, FM - 0.2, pal.slate, 8), t = acc.v(0, y - r, FM - 0.2, pal.slate, 8); const ring = [];
    for (let i = 0; i < 5; i++) { const th = i / 5 * Math.PI * 2; ring.push(acc.v(Math.cos(th) * r, y, FM - 0.2 + Math.sin(th) * r, pal.slate, 8)); }
    for (let i = 0; i < 5; i++) { acc.tri(b, ring[(i + 1) % 5], ring[i]); acc.tri(t, ring[i], ring[(i + 1) % 5]); } }
  return acc.build();
}

// A 9 m basking shark. Local space: snout -Z, back +Y, body axis on y 0 (the instance sets its depth).
function sharkGeometry(pal) {
  const acc = makeAcc();
  const L = 9, zOf = (s) => (s - 0.5) * L;
  const back = pal.slate.clone().lerp(pal.black, 0.18), belly = pal.slate.clone().lerp(pal.cream, 0.4), fin = pal.slate.clone().lerp(pal.black, 0.25);
  const prof = [[0, 0.56], [0.08, 0.72], [0.25, 0.86], [0.45, 0.8], [0.7, 0.5], [0.9, 0.2], [1, 0.13]];
  const rad = (s) => { for (let i = 0; i < prof.length - 1; i++) { const a = prof[i], b = prof[i + 1]; if (s <= b[0]) return lerp(a[1], b[1], smoothstep(0, 1, (s - a[0]) / (b[0] - a[0]))); } return 0.13; };
  const NS = 22, NA = 12;
  // the upper jaw leads the lower by 0.6 m: a hood over the hoop mouth, carrying the pointed snout
  const hood = (s, sy) => (s < 0.1 ? -(1 - s / 0.1) * 0.45 * Math.max(sy, 0) : 0);
  acc.grid(NA, NS + 1, (i, j) => {
    const s = j / NS, th = i / NA * Math.PI * 2, r = rad(s), sy = Math.sin(th);
    return [Math.cos(th) * r, sy * r * 0.92, zOf(s) + hood(s, sy), sy > 0.25 ? back : (sy > -0.35 ? back.clone().lerp(belly, 0.5) : belly), s, i / NA];
  }, 0, true);
  acc.grid(NA, 2, (i, j) => { const th = i / NA * Math.PI * 2, r = j ? 0.5 : 0.56; return [Math.cos(th) * r, Math.sin(th) * r * 0.92, zOf(0) + j * 0.02 + hood(0, Math.sin(th)), pal.cream, 0, 0]; }, 0, true);
  acc.grid(NA, 6, (i, j) => { const m = j / 5, th = -i / NA * Math.PI * 2, r = lerp(0.5, 0.07, Math.pow(m, 0.8)); return [Math.cos(th) * r, Math.sin(th) * r * 0.92, zOf(0.002 + m * 0.27), pal.black, m, 0]; }, 1, true);
  { const sn = [[0.42, 0.27, zOf(0.06), 0.42], [0.46, 0.21, zOf(0) - 0.2, 0.31], [0.5, 0.14, zOf(0) - 0.6, 0.17], [0.54, 0.06, zOf(0) - 0.88, 0.06], [0.55, 0.01, zOf(0) - 0.98, 0.01]];
    acc.grid(8, sn.length, (i, j) => { const th = i / 8 * Math.PI * 2, r = sn[j]; return [Math.cos(th) * r[3], r[0] + Math.sin(th) * r[1], r[2], Math.sin(th) > -0.3 ? back : belly, 0.07, i / 8]; }, 0, true); }
  // fins: lens-section plates. plate(base front, base back, tip, half thickness, station, nu, nv)
  const plate = (a, b, tip, th, st, n = 5, thickAxis = 'x') => {
    for (const sg of th > 0 ? [1, -1] : [1]) acc.grid(n, n, (i, j) => {
      const u = i / (n - 1), v = j / (n - 1), bu = Math.sin(Math.PI * u) * (1 - v) * th * sg;
      const bx = lerp(a[0], b[0], u), by = lerp(a[1], b[1], u), bz = lerp(a[2], b[2], u), w = Math.pow(v, 0.85);
      const p = [lerp(bx, tip[0], w), lerp(by, tip[1], w), lerp(bz, tip[2], w) + 0.25 * Math.sin(Math.PI * v) * (1 - u)];
      if (thickAxis === 'x') p[0] += bu; else p[1] += bu;
      return [p[0], p[1], p[2], v > 0.82 ? fin.clone().lerp(pal.black, 0.4) : fin, st, v];
    }, 2);
  };
  plate([0, 0.6, zOf(0.39)], [0, 0.62, zOf(0.57)], [0, 2.6, zOf(0.6)], 0.1, 0.5);                 // first dorsal, 2 m
  plate([0, 0.34, zOf(0.75)], [0, 0.3, zOf(0.82)], [0, 0.95, zOf(0.845)], 0.05, 0.8, 3);
  for (const sg of [1, -1]) plate([sg * 0.7, -0.3, zOf(0.25)], [sg * 0.66, -0.34, zOf(0.36)], [sg * 2.5, -0.8, zOf(0.44)], 0.05, 0.3, 4, 'y');
  plate([0, 0.14, zOf(0.955)], [0, -0.1, zOf(1.0)], [0, 2.0, zOf(1.0) + 1.55], 0.045, 1.08, 4);   // upper tail lobe
  plate([0, -0.1, zOf(0.96)], [0, 0.1, zOf(1.0)], [0, -0.95, zOf(1.0) + 0.95], 0.04, 1.05, 3);
  return acc.build();
}

// A sea bird, wingspan 1 (scaled per instance). aPart carries the signed wing-span fraction.
function birdGeometry(pal) {
  const acc = makeAcc();
  const body = pal.cream, wing = pal.cream.clone().lerp(pal.slate, 0.72), ink = pal.black, back = pal.cream.clone().lerp(pal.slate, 0.55), dark = pal.slate.clone().lerp(pal.black, 0.6);
  const rings = [[-0.25, 0.006], [-0.17, 0.042], [-0.07, 0.058], [0.06, 0.05], [0.18, 0.018]];
  acc.grid(5, rings.length, (i, j) => { const th = i / 5 * Math.PI * 2, r = rings[j]; return [Math.cos(th) * r[1], Math.sin(th) * r[1], r[0], j === 0 || (j === 1 && Math.sin(th) > 0.1) ? ink : (Math.sin(th) > 0.3 ? back : body)]; }, 0, true);
  { const a = acc.v(0, 0.01, 0.15, body, 0), b = acc.v(-0.07, 0.01, 0.32, body, 0), c = acc.v(0, 0.01, 0.26, body, 0), d = acc.v(0.07, 0.01, 0.32, body, 0); acc.tri(a, b, c); acc.tri(a, c, d); }
  for (const sg of [1, -1]) {
    const w = (x, z, c) => acc.v(sg * x, 0.02, z, c, sg * x / 0.5);
    const r0 = w(0.03, -0.08, back), r1 = w(0.03, 0.07, back), m0 = w(0.25, -0.115, wing), m1 = w(0.25, 0.035, wing), t0 = w(0.4, -0.06, dark), t1 = w(0.4, 0.04, ink), tip = w(0.5, 0.045, ink);
    acc.quad(r0, m0, m1, r1); acc.quad(m0, t0, t1, m1); acc.tri(t0, tip, t1);
  }
  return acc.build();
}

// a lumpy flattened ball for the squall's upper edge
function puffGeometry(noise) {
  const g = new THREE.IcosahedronGeometry(1, 2);
  const p = g.attributes.position;
  const v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i).normalize();
    const k = 1 + 0.22 * noise.n3(v.x * 1.7, v.y * 1.7, v.z * 1.7) + 0.1 * noise.n3(v.x * 4, v.y * 4 + 9, v.z * 4);
    p.setXYZ(i, v.x * k, Math.max(v.y * k, -0.25) * 0.6, v.z * k);
  }
  g.deleteAttribute('uv');
  g.computeVertexNormals();
  return g;
}

// the unit cap of a pouch: a paraboloid of radius 1 that hangs POUCH_K below its rim (y 0), its heart on the y axis. 30
// triangles: a ring of ten at the heart and a band of twenty to the rim. SEG 10 and the ring at 0.6 are choices; measured of
// them (by arithmetic): the decagon stands off the circle by at most 4.9 % of the radius (1.4 m of 29), and along a spoke the
// two straight steps stand off the paraboloid by at most 9 % of the depth (0.9 m of 9.7). The rim lies in the base and is no
// outline. An outline (the belly against the cells behind; no rim line is drawn on it) shows on every pouch whose far side
// its belly hides: those farther along the ground than one and a half times the lens's depth under the base (the rim's slope
// is 2 POUCH_K), from 147 m with the lens at its highest. Such a pouch is still wide in the frame: 58 m at 177 m from the
// lens, about 190 px of a frame 1280 wide.
function pouchGeometry() {
  const SEG = 10, RINGS = [0.6, 1], pos = [0, -POUCH_K, 0], idx = [];
  for (const r of RINGS) for (let i = 0; i < SEG; i++) { const a = i / SEG * Math.PI * 2; pos.push(Math.cos(a) * r, -POUCH_K * (1 - r * r), Math.sin(a) * r); }
  for (let i = 0; i < SEG; i++) { const j = (i + 1) % SEG; idx.push(0, 1 + j, 1 + i, 1 + i, 1 + j, 1 + SEG + j, 1 + i, 1 + SEG + j, 1 + SEG + i); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx);
  return g;
}

// THE SLAB IS WHOLE INSIDE ITS OUTLINE. The cell law of SLAB_FRAG draws one round stone to a cell. Along the eroded edge the
// stones shrink and stop meeting, and between stones that still ring it the sky stood, or a puff that rides above the base
// (a puff keeps the paper's haze: it shows tan between the slate stones): in plan, at 1 m, 26 to 78 places a slab where
// sky was shut in (the mean 47; 4 to 13 of them of 20 square metres or more), and bays besides whose mouths the hanging
// pouches hide from below; all in the band of the edge, none farther in (the 40 patterns a slab can have). slabWhole
// draws that band in plan, as the shader's law draws it, and says where the sky between stones is open:
//   the sky is open where a disc as wide as the least stone that stands (SLAB_WIDE) can be slid to it, touching no stone,
//   from beyond the edge or from the plane's two ends, and for SLAB_BACK metres past the place where that disc stops;
//   all other sky between stones is the slab's (and any sky that this would shut in), and the plane draws its base
//   there (SLAB_FRAG, uWhole).
// So the slab's outline is made of the stones' own edges, and a bay too narrow for the disc is still a bay, SLAB_BACK
// deep; behind it the base runs from stone to stone and ends in an arc, and a stone that stands clear of the rest by the
// least stone's width stays alone. No stone, pouch or tone is changed, and the law reads nothing but the pattern.
// SLAB_WIDE is a measure: the width of the stone the cell law sets on the edge line itself, its least (25.7 m). Tried
// in its place, the base ending where the disc stops, with the gaps counted in stills 1280 wide at six chance places of
// the stretch under the cloud as the flight comes in (a gap: sky ringed by cloud in the picture, 20 pixels or more of
// it; the squall-day look, then the sun-shower look): as the slab stood 47 and 37; a disc of 3 m 22 and 16; of 11 m 12
// and 18; of 22 m 2 and 6; this one 2 and 6 (on each look one bay of the far edge, 700 m off or more, seen in the stills).
// SLAB_BACK, 10 m, is a choice between two wants that pull against each other. A bay left open is the cloud's ragged
// edge to an eye that looks along it and sky ringed by cloud to an eye that looks across it (the pouches that hang at
// its mouth hide the mouth), and nothing in the pattern's space tells the two apart: every metre of bay left open gives
// the edge roughness and gives gaps back. The roughness: how many pixels the cloud's lowest edge climbs or falls from
// one pixel column to the next, on the mean, in stills 1280 wide. Counted by rays through this plan and the pouches from
// the flight's own eyes (four chance places of that stretch, the 34 seeds of 1 to 40 that have a squall; gaps of 20
// pixels or more, then the roughness): the stones alone 598 and .436; the base ending where the disc stops (1.5 m
// past it, the plan's grain) 33 and .320; set back 6 m 38 and .350; 10 m 49 and .368; 11 m 52 and .371; 12 m 66 and
// .374; the least stone's radius 75 and .377; 16 m 108 and .387; 20 m 160 and .397: to 11 m about two gaps come back
// for each metre, past it ten or more. In rendered stills at six chance places (the squall-day look, then the sun-shower
// look): the stones alone 48 and 40 gaps, .442 and .398; the base ending where the disc stops 1 and 6, .320 and .321;
// 6 m 1 and 6, .349 and .346; 10 m 1 and 6, .366 and .357; 11 m 1 and 6, .369 and .359; the least stone's radius 1
// and 6, .376 and .363. Tried besides, by rays, and none gave more roughness for the gaps it gave back: a narrower disc;
// a base only where a disc is held in and cannot be slid out; a set-back that follows the bay's width, growing or
// shrinking with it; the stones' own edges swollen into the bay.
// The plan's own grain lies within SLAB_BACK: the disc's middle stands on a texel's middle and is held off every stone's
// texel, so its reach can fall short of a stone's true edge by up to 1.42 m (two half diagonals of a texel). SLAB_STEP,
// 16 levels a metre, is a choice: the plan tells 8 m to either side of the line where the open sky ends, to 6 cm.
// The band: the plane's own length in x (2200 m from x -1040); in z from 105 m before the edge's z (the edge line dips
// at most 66 m, a stone on the line has a radius of 12.9 m, and the disc passes under it: 25.7 m more) to 220 m past it
// (the line rises at most 66 m, stones are whole 130 m behind the line, and half a cell more). Measured on the 40
// patterns: the open sky reaches at most 106 m past the edge's z, and past the band no sky stands between stones; the
// law makes 14,200 to 20,800 square metres of sky the slab's (the median 17,600) and leaves no place where sky is shut
// in; the outline in plan (the sides of the plan's texels between cloud and sky, times pi / 4) is 4250 m on the mean,
// 48 to 60 in a hundred of the stones' own (8210 m; with the base ending where the disc stops 3370 m, 38 to 47).
// The hearts are worked out as the shader works them, the hash in single precision step by step: on the test renderer
// the card's own hash and this one agree to 0.00001 on 6161 cells (all that the 40 bands hold, and more). A graphics
// card that rounds in another order (three tried) sets 1, 2 or 4 of those hearts elsewhere; there the plane shows its
// base where this plan has a stone.
const f32 = Math.fround, frac32 = (x) => f32(x - Math.floor(x)), F33 = f32(33.33);
function slabHash2(px, py) {                 // ebHash2 of EBRU_GLSL
  let qx = frac32(f32(px * f32(0.1031))), qy = frac32(f32(py * f32(0.1030))), qz = frac32(f32(px * f32(0.0973)));
  const dt = f32(f32(f32(qx * f32(qy + F33)) + f32(qy * f32(qz + F33))) + f32(qz * f32(qx + F33)));
  qx = f32(qx + dt); qy = f32(qy + dt); qz = f32(qz + dt);
  return [frac32(f32(f32(qx + qy) * qz)), frac32(f32(f32(qx + qz) * qy))];
}
// the plan of the edge band for the pattern sS (uSeedS) and the edge's z at time 0: { data, x0, z0, nx, nz }, one byte a
// square metre of pattern ground: how far the place lies from where the open sky ends, 128 on that line, SLAB_STEP levels
// a metre, more toward the slab (255 from 8 m in, and in sky the base shuts in), less toward the open sky (0 from 8 m
// out). It draws nothing from any
// stream. Its work is done a few rows or columns at a time by the small functions inside it, with a pause (ctx.yield)
// between
async function slabWhole(sS, edge0, ctx) {
  const SC = 46, X0 = -1040, NX = 2200, Z0 = edge0 - 105, NZ = 325, N = NX * NZ, RR = SLAB_WIDE * SLAB_WIDE / 4, FAR = 1e9;
  // the hearts of the band's cells and the squares of their radii, in cells, by the cell law of SLAB_FRAG
  const i0 = Math.floor(X0 / SC + sS) - 1, ni = Math.floor((X0 + NX) / SC + sS) + 3 - i0, j0 = Math.floor(Z0 / SC + sS) - 1, nj = Math.floor((Z0 + NZ) / SC + sS) + 3 - j0;
  const hx = new Float64Array(ni * nj), hz = new Float64Array(ni * nj), hr = new Float64Array(ni * nj);
  for (let j = 0; j < nj; j++) for (let i = 0; i < ni; i++) {
    const hh = slabHash2(i + i0, j + j0), x = i + i0 + 0.5 + 0.7 * (hh[0] - 0.5), z = j + j0 + 0.5 + 0.7 * (hh[1] - 0.5), cx = (x - sS) * SC, cz = (z - sS) * SC;
    const edge = edge0 + 42 * Math.sin(cx * 0.0105 + 1.3) + 24 * Math.sin(cx * 0.027 + 0.4), R = slabStone(cz - edge);
    hx[j * ni + i] = x; hz[j * ni + i] = z; hr[j * ni + i] = R * R;
  }
  const sky = new Uint8Array(N), along = new Uint8Array(N), room = new Uint8Array(N), data = new Uint8Array(N), st = new Int32Array(N);
  const f = new Float64Array(NZ), d2 = new Float64Array(NZ), vv = new Int32Array(NZ), zz = new Float64Array(NZ + 1);
  let sp = 0;
  // sky: 1 where a texel's middle lies outside its nearest heart's stone, 0 on a stone
  const skyRow = (iz) => {
    const qz = (Z0 + iz + 0.5) / SC + sS, gz = Math.floor(qz) - j0;
    for (let ix = 0; ix < NX; ix++) {
      const qx = (X0 + ix + 0.5) / SC + sS, gx = Math.floor(qx) - i0; let d1 = 1e9, r2 = 0;
      for (let j = gz - 1; j <= gz + 1; j++) for (let k = j * ni + gx - 1, e = k + 3; k < e; k++) { const dx = hx[k] - qx, dz = hz[k] - qz, d = dx * dx + dz * dz; if (d < d1) { d1 = d; r2 = hr[k]; } }
      sky[iz * NX + ix] = d1 < r2 ? 0 : 1;
    }
  };
  // along: in a row, how far (texels, 255 at most) to the nearest texel where `set` holds `v`
  const alongRow = (iz, set, v) => {
    const a = iz * NX; let run = 255;
    for (let i = a, e = a + NX; i < e; i++) { run = set[i] === v ? 0 : Math.min(run + 1, 255); along[i] = run; }
    run = 255;
    for (let i = a + NX - 1; i >= a; i--) { run = set[i] === v ? 0 : Math.min(run + 1, 255); if (run < along[i]) along[i] = run; }
  };
  // d2: down a column, the square of the true distance (texels) to the nearest such texel anywhere, from `along` (the
  // lower envelope of the rows' parabolas)
  const column = (ix) => {
    for (let q = 0; q < NZ; q++) { const g = along[q * NX + ix]; f[q] = g === 255 ? FAR : g * g; }
    let k = 0; vv[0] = 0; zz[0] = -FAR; zz[1] = FAR;
    for (let q = 1; q < NZ; q++) {
      let s = 0;
      for (;;) { const p = vv[k]; s = ((f[q] + q * q) - (f[p] + p * p)) / (2 * q - 2 * p); if (s <= zz[k] && k > 0) k--; else break; }
      k++; vv[k] = q; zz[k] = s; zz[k + 1] = FAR;
    }
    k = 0;
    for (let q = 0; q < NZ; q++) { while (zz[k + 1] < q) k++; const p = vv[k]; d2[q] = (q - p) * (q - p) + f[p]; }
  };
  // room: 1 where the disc, its middle on the texel's, holds no stone's texel (the rows past the band are stone)
  const roomColumn = (ix) => { column(ix); for (let q = 0; q < NZ; q++) room[q * NX + ix] = d2[q] >= RR && (NZ - q) * (NZ - q) >= RR ? 1 : 0; };
  // 2: the room the disc reaches from the row beyond the edge and from the plane's two ends
  const push = (i) => { if (room[i] === 1) { room[i] = 2; st[sp++] = i; } };
  const flood = (n) => {
    while (sp && n-- > 0) { const i = st[--sp], ix = i % NX; if (ix > 0) push(i - 1); if (ix < NX - 1) push(i + 1); if (i >= NX) push(i - NX); if (i < N - NX) push(i + NX); }
  };
  // the plan: the distance from the disc's reach, less the disc's radius and SLAB_BACK, in levels about 128; the last row
  // is the slab's (past the band the slab is whole, and the plan's last row is read for all beyond it)
  const planColumn = (ix) => {
    column(ix);
    for (let q = 0; q < NZ; q++) data[q * NX + ix] = q === NZ - 1 ? 255 : clamp(Math.round(128 + (Math.sqrt(d2[q]) - SLAB_WIDE / 2 - SLAB_BACK) * SLAB_STEP), 0, 255);
  };
  // 3 in `sky`: the sky the plan leaves open (under 128) that is joined to the row beyond the edge or to the plane's ends
  const pushOpen = (i) => { if (sky[i] === 1 && data[i] < 128) { sky[i] = 3; st[sp++] = i; } };
  const floodOpen = (n) => {
    while (sp && n-- > 0) { const i = st[--sp], ix = i % NX; if (ix > 0) pushOpen(i - 1); if (ix < NX - 1) pushOpen(i + 1); if (i >= NX) pushOpen(i - NX); if (i < N - NX) pushOpen(i + NX); }
  };
  // sky that is left open but not joined (the base shuts it in) is the slab's: 255, so that no line is drawn in it
  const shutRow = (iz) => { for (let i = iz * NX, e = i + NX; i < e; i++) if (sky[i] === 1 && data[i] < 128) data[i] = 255; };
  // a stone's texel beside sky that is the slab's stands at 128 or more: from that texel's middle to the stone's own drawn
  // edge the plan reads the slab's, and no sliver of sky is left along the stone
  const stoneRow = (iz) => {
    for (let ix = 0; ix < NX; ix++) {
      const i = iz * NX + ix; if (sky[i] !== 0 || data[i] >= 128) continue;
      if ((ix > 0 && sky[i - 1] === 1) || (ix < NX - 1 && sky[i + 1] === 1) || (iz > 0 && sky[i - NX] === 1) || (iz < NZ - 1 && sky[i + NX] === 1)) data[i] = 128;
    }
  };
  const each = async (n, every, fn) => { for (let k = 0; k < n; k++) { if (k % every === 0) await ctx.yield(); fn(k); } };
  await each(NZ, 8, skyRow);
  await each(NZ, 64, (iz) => alongRow(iz, sky, 0));
  await each(NX, 128, roomColumn);
  for (let ix = 0; ix < NX; ix++) push(ix);
  for (let iz = 0; iz < NZ; iz++) { push(iz * NX); push(iz * NX + NX - 1); }
  while (sp) { await ctx.yield(); flood(30000); }
  await each(NZ, 64, (iz) => alongRow(iz, room, 2));
  await each(NX, 128, planColumn);
  for (let ix = 0; ix < NX; ix++) pushOpen(ix);
  for (let iz = 0; iz < NZ; iz++) { pushOpen(iz * NX); pushOpen(iz * NX + NX - 1); }
  while (sp) { await ctx.yield(); floodOpen(30000); }
  await each(NZ, 64, shutRow);
  await each(NZ, 64, stoneRow);
  return { data, x0: X0, z0: Z0, nx: NX, nz: NZ };
}

// ------------------------------------------------------------------------------------------------
// 4. THE WORLD
export default {
  id: 'combed-sea',
  name: 'The Combed Sea',
  category: 'ocean',
  weirdness: 0.45,
  media: ['air'],
  async build(ctx) {
    const { rng } = ctx;
    const detail = ctx.quality?.detail ?? 1;
    const vary = ctx.vary || { hour: 'any', rare: false, density: 1, mood: 0.5 };
    const density = clamp(vary.density ?? 1, 0.7, 1.3);
    const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
    const scene = new THREE.Scene();

    // ---- a. mood (seeded; the viewer's hour wins) and the hero
    const look = rng.fork('look');
    const roll = look();
    let moodId = roll < 0.26 ? 'squall' : roll < 0.52 ? 'golden' : roll < 0.64 ? 'night' : roll < 0.84 ? 'dawn' : 'squall';
    if (vary.hour === 'day') moodId = 'squall'; else if (vary.hour === 'golden') moodId = 'golden';
    else if (vary.hour === 'night') moodId = 'night'; else if (vary.hour === 'dawn') moodId = 'dawn';
    const M = MOODS[moodId];
    const rare = !!vary.rare;
    const shawl = !rare && look() < 0.4;                       // pattern variation: long S-curves over the open sea
    const sunDir = V3(Math.sin(M.sunAz * DEG) * Math.cos(M.sunEl * DEG), Math.sin(M.sunEl * DEG), -Math.cos(M.sunAz * DEG) * Math.cos(M.sunEl * DEG));
    scene.background = new THREE.Color(M.paper);

    const hero = await buildHero(ctx, { palette: M.palette, sunDir, hazeColor: M.paper });
    scene.add(hero.object);
    const sh = hero.uniforms;
    hero.enableLens(true);
    // The exit portal is tilted into the sea, so its glow plane dips under the surface: with the sea writing
    // depth the glow was cut along a hard line across the still ring. The sea therefore writes no depth and is
    // drawn far to near (its rings reversed), which is also what the lens drops want.
    { const seaMesh = hero.object.getObjectByName('ebru-sea'), ix = seaMesh.geometry.index.array, n = ix.length, rv = new ix.constructor(n);
      for (let i = 0; i < n; i += 3) { rv[i] = ix[n - 3 - i]; rv[i + 1] = ix[n - 2 - i]; rv[i + 2] = ix[n - 1 - i]; }
      seaMesh.geometry.setIndex(new THREE.BufferAttribute(rv, 1)); hero.materials.sea.depthWrite = false; }
    hero.setGlow(M.glow);
    hero.setRain(60, 50, M.rain);
    hero.setHighlight(M.hi, new THREE.Color(M.hiCol[0], M.hiCol[1], M.hiCol[2]));
    const pig = sh.uPig.value;
    const pal = { navy: pig[0], turq: pig[1], jade: pig[2], cream: pig[3], ochre: pig[4], black: pig[5], slate: pig[6], still: pig[7] };
    const tint = new THREE.Color(M.tint[0], M.tint[1], M.tint[2]);
    if (hero.materials.rock && moodId === 'night') hero.materials.rock.uniforms.uSpots.value = 0.26;     // fewer bright spots on moonlit rock
    const A = hero.anchors;
    await ctx.yield();

    // ---- b. the path: the brief's track, straight from the hero's anchors
    //      with 80 m added before it, heading 24 degrees west of north: the entry axis (and so the view through
    //      the previous portal) looks at the skerry row and the eddy, then the track swings left onto the brief's
    //      first leg. The extra length also puts the gap at u 0.73, so the great stacks still flank the frame at u 0.7.
    const fly = A.flyThrough.map((p) => p.clone());
    fly.unshift(fly[0].clone().add(V3(Math.sin(24 * DEG) * 80, 0, Math.cos(24 * DEG) * 80)));
    const path = makePath(fly);
    const N_U = 600, pz = new Float32Array(N_U + 1), px = new Float32Array(N_U + 1), py = new Float32Array(N_U + 1);
    { const t = V3(0, 0, 0); for (let i = 0; i <= N_U; i++) { path.pointAt(i / N_U, t); px[i] = t.x; py[i] = t.y; pz[i] = t.z; } }
    const uAtZ = (z) => { for (let i = 1; i <= N_U; i++) if (pz[i] <= z) return (i - 1 + (pz[i - 1] - z) / Math.max(pz[i - 1] - pz[i], 1e-6)) / N_U; return 1; };
    const camAt = (u, out) => { const f = clamp(u, 0, 1) * N_U, i = Math.min(Math.floor(f), N_U - 1), k = f - i; return out.set(lerp(px[i], px[i + 1], k), lerp(py[i], py[i + 1], k), lerp(pz[i], pz[i + 1], k)); };
    const DUR = 46.5;                          // seconds, metres

    // ---- c. sky dome, squall slab, its pouches and puffs, rain
    const hz = (d) => 1 - Math.exp(-Math.pow(d / sh.uHaze.value.x, sh.uHaze.value.y));
    const seaFar = (() => {
      const r = (c) => new THREE.Color(Math.sqrt(c.r), Math.sqrt(c.g), Math.sqrt(c.b));
      const nv = r(pal.navy.clone().lerp(pal.navy.clone().lerp(pal.turq, 0.17), 0.45));
      const br = r(pal.turq).multiplyScalar(0.42).add(r(pal.jade).multiplyScalar(0.3)).add(r(pal.cream).multiplyScalar(0.28));
      const m = br.lerp(nv, 0.85); m.setRGB(m.r * m.r, m.g * m.g, m.b * m.b);
      return m.lerp(new THREE.Color(M.paper), hz(3200));
    })();
    const paper = new THREE.Color(M.paper);
    const skyU = {
      uPig: sh.uPig, uHazeCol: sh.uHazeCol, uHaze: sh.uHaze, uTime: sh.uTime,
      uPaper: { value: paper }, uZen: { value: paper.clone().lerp(moodId === 'night' ? new THREE.Color('#05060d') : pal.slate, M.zenith) },
      uVein: { value: new THREE.Color(M.vein) }, uSeaFar: { value: seaFar }, uStars: { value: M.stars }, uSeedK: { value: look() * 6.28 },
    };
    await ctx.yield();
    const sky = new THREE.Mesh(new THREE.SphereGeometry(3600, 48, 24), new THREE.ShaderMaterial({ uniforms: skyU, vertexShader: SKY_VERT, fragmentShader: SKY_FRAG, side: THREE.BackSide, depthWrite: false, depthTest: false, fog: false }));
    sky.renderOrder = -10; sky.frustumCulled = false; sky.name = 'paper-sky';
    scene.add(sky);

    const EDGE0 = -46;                                          // z of the squall's trailing edge at time 0
    let slabU = null, puffs = null;
    const rains = [];
    if (M.squall > 0) {
      // THE SHADOW STEP FOLLOWS THE SKY. The pouches' shadow step is laid as deep as the look's sky is lighter than the cloud:
      // the light of the paper (the look's sky) over the light of the cloud's mean pigment (the slab shader's own mean, with
      // the look's slabDark), less one, held to 0..1. Light is the luminance of linear red, green and blue. Measured: squall
      // 14.0 and sun-shower 9.5, the whole step; night 0.56, none. That the step is whole from twice the cloud's light is a
      // choice; no look stands between. Why (measured in stills 640 wide at six places of the stretch where the gaze leaves the
      // cloud): by day the cloud stands 75 to 107 levels (of 255) under the sky with or without the step. By night its pigment
      // stands within 2 levels of the sky's own tone, and the whole step cut shapes 1.3 to 3.2 levels darker than the night sky.
      // The same uShade says how strongly the hairline between the two steps is drawn and where the far underside melts
      // (SLAB_FRAG). Measured by night at six chance places of the stretch under the cloud as the flight comes in (stills
      // 640 wide, the base ending where the disc stops; on the pixels the cloud changes: how many in a hundred are no
      // lighter than 3 of 255, then the mean blue): with the hairline, melting toward the cloud's own mean, 34.2 and 46.1;
      // without the hairline 31.5 and 48.6; without it and melting toward the paper 30.2 and 50.7; the flat discs before
      // the pouches 25.9 and 51.6, and the pouches themselves add 3.1 (the same slab with and without them).
      const lumOf = (c) => 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b;
      const shade = clamp(lumOf(paper) / lumOf(pal.black.clone().lerp(pal.navy, SLAB_NAVY).lerp(pal.slate, SLAB_SLATE).multiplyScalar(M.slabDark)) - 1, 0, 1);
      slabU = { uPig: sh.uPig, uHazeCol: sh.uHazeCol, uHaze: sh.uHaze, uTime: sh.uTime, uEdge: { value: EDGE0 }, uSeedS: { value: Math.floor(look() * 40) + 0.31 }, uDark: { value: M.slabDark }, uShade: { value: shade }, uDrift: { value: 0 }, uSunDir: sh.uSunDir };
      // the plan of the edge band (slabWhole), for this slab's pattern: read by the plane, between its texels
      { const plan = await slabWhole(slabU.uSeedS.value, EDGE0, ctx);
        const map = new THREE.DataTexture(plan.data, plan.nx, plan.nz, THREE.RedFormat, THREE.UnsignedByteType);
        map.magFilter = map.minFilter = THREE.LinearFilter; map.needsUpdate = true;
        slabU.uWhole = { value: map }; slabU.uWholeBox = { value: new THREE.Vector4(plan.x0, plan.z0, 1 / plan.nx, 1 / plan.nz) }; }
      const sg = new THREE.PlaneGeometry(2200, 1500, 1, 1).rotateX(Math.PI / 2);
      const slab = new THREE.Mesh(sg, new THREE.ShaderMaterial({ uniforms: slabU, vertexShader: SLAB_VERT, fragmentShader: SLAB_FRAG, side: THREE.DoubleSide, transparent: true, depthWrite: false, fog: false }));
      slab.position.set(60, 130, 610); slab.renderOrder = -5; slab.frustumCulled = false; slab.name = 'squall-slab';
      scene.add(slab);
      // the pouches' relief, for the cells of the part of the base the flight can see. Measured from eyes every 2.5 m of the route
      // with both cameras in the still pose, rays a tenth beyond the lens, screens from 1 : 2 to 2.4 : 1, the drift at 0, 50, 100
      // and 150 m: the base is seen from pattern x -1040 (the slab's own west end) to 469 and from the trailing edge (it reaches
      // z -112) to z 658. With the live flight's sway at its greatest laid on top: to x 483 and z 697 (the hearts of the cells
      // seen there: to z 704). The typed box below, less the column at the west end (no cap hangs past the plane), reaches
      // x 538 and z 722 by the cells that hold its bounds; it holds every cell seen in either measure but that west column,
      // which is seen no nearer than about 1 km. 33 by 20 cells, 660 caps of 30 triangles, 19,800 triangles in one draw call,
      // built in this step
      const cellIds = [];
      { const sS = slabU.uSeedS.value, i0 = Math.ceil(-1040 / 46 + sS) + 1, i1 = Math.floor(512 / 46 + sS), j0 = Math.floor(-158 / 46 + sS), j1 = Math.floor(704 / 46 + sS);
        for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) cellIds.push(i, j); }
      const pg = new THREE.InstancedBufferGeometry();
      { const unit = pouchGeometry(); pg.index = unit.index; pg.setAttribute('position', unit.attributes.position); }
      pg.setAttribute('aCell', new THREE.InstancedBufferAttribute(new Float32Array(cellIds), 2)); pg.instanceCount = cellIds.length / 2;
      const pouches = new THREE.Mesh(pg, new THREE.ShaderMaterial({ uniforms: { ...slabU }, defines: { POUCH: 1 }, vertexShader: POUCH_VERT, fragmentShader: SLAB_FRAG, side: THREE.DoubleSide, fog: false }));
      pouches.frustumCulled = false; pouches.name = 'squall-pouches';
      scene.add(pouches);
      // the lumpy upper edge: two-step slate puffs riding just above the base
      const NP = Math.round(40 * (0.6 + 0.4 * detail));
      const pm = styleMaterial({ shared: sh, color: pal.slate.clone().lerp(pal.cream, moodId === 'golden' ? 0.3 : 0.12).multiply(tint), outline: 0.5, bias: 0.15 });
      await ctx.yield();
      puffs = new THREE.InstancedMesh(puffGeometry(ctx.noise), pm, NP);
      puffs.userData.base = [];
      for (let i = 0; i < NP; i++) {
        const x = lerp(-900, 1000, (i + look()) / NP), back = look() * look() * 420;
        puffs.userData.base.push({ x, z: 20 + back + 42 * Math.sin(x * 0.0105 + 1.3), y: 150 + look() * 26 + back * 0.05, sx: 70 + look() * 80, sy: 40 + look() * 38, ry: look() * 6.28, ph: look() * 6.28 });
      }
      puffs.frustumCulled = false; puffs.name = 'squall-puffs';
      scene.add(puffs);
      // rain: a near field of strokes at arm's length and a far curtain under the slab
      const mkRain = (count, box, len, wid, vel, amt, cenY, nearFade) => {
        const n = Math.round(count * (0.5 + 0.5 * detail) * M.squall);
        const g = new THREE.InstancedBufferGeometry();
        const q = new THREE.PlaneGeometry(1, 1);
        g.index = q.index; g.setAttribute('position', q.attributes.position); g.setAttribute('uv', q.attributes.uv);
        const base = new Float32Array(n * 3), rnd = new Float32Array(n);
        for (let i = 0; i < n; i++) { base[i * 3] = look(); base[i * 3 + 1] = look(); base[i * 3 + 2] = look(); rnd[i] = look(); }
        g.setAttribute('aBase', new THREE.InstancedBufferAttribute(base, 3)); g.setAttribute('aRnd', new THREE.InstancedBufferAttribute(rnd, 1));
        g.instanceCount = n;
        const u = { uPig: sh.uPig, uHazeCol: sh.uHazeCol, uHaze: sh.uHaze, uTime: sh.uTime, uBox: { value: V3(box[0], box[1], box[2]) }, uVel: { value: V3(vel[0], vel[1], vel[2]) },
          uCen: { value: V3(0, 0, 0) }, uLen: { value: len }, uWid: { value: wid }, uPxAng: { value: 0.0027 }, uAmt: { value: amt }, uZEdge: { value: new THREE.Vector2(55, 60) }, uNearFade: { value: new THREE.Vector2(nearFade[0], nearFade[1]) }, uTint: { value: tint } };
        const m = new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms: u, vertexShader: RAIN_VERT, fragmentShader: RAIN_FRAG, transparent: true, depthWrite: false, side: THREE.DoubleSide, fog: false }));
        m.frustumCulled = false; m.renderOrder = 3; m.name = 'rain';
        scene.add(m); rains.push({ u, cenY });
      };
      const rainAmt = M.rainAmt ?? 1;                           // night: half the strokes' strength, so the paper strip reads
      mkRain(1500, [64, 44, 64], 2.6, 0.035, [5, -24, 3.5], 0.8 * rainAmt, null, [2.2, 7]);
      mkRain(1100, [620, 128, 620], 30, 0.5, [5, -24, 3.5], 0.42 * rainAmt, 64, [50, 130]);
    }
    await ctx.yield();

    // ---- d. the fleet. Boat 0 is the hero drifter (keyed to u); the others sail on a clock that eases off.
    const pxAng = { value: 0.0027 };
    const U_ABEAM = 0.33, HERO_X = -9, BOAT_K = 1.15, HERO_V = 5 * DUR;       // metres of drifter travel per unit of u
    const abeam = camAt(U_ABEAM, V3(0, 0, 0));
    const heroZ = (u) => abeam.z + HERO_V * (U_ABEAM - u);
    const NB = clamp(Math.round(7 * density), 5, 9);
    const far = rng.shuffle([[-330, 30], [290, 150], [-520, -170], [430, -40]]);
    const boats = [{ hero: true }];
    const sail = (x, z, dx, dz, v, wake = 280) => { const l = Math.hypot(dx, dz); boats.push({ x, z, dx: dx / l, dz: dz / l, v, wake }); };
    // (positions are where each boat is at time 30) 1: the entry boat, right under the opening view;
    // 2, 3: working the race edge; 4, 5: out on the nonpareil field either side of the last leg; then the far ones
    { const e = path.start, h = path.startTangent; sail(e.x + h.x * 135 - h.z * 10, e.z + h.z * 135 + h.x * 10, -0.5, -0.87, 2.5, 230); }
    sail(-120, -250, -0.94, 0.34, 1.8); sail(140, -230, 0.8, 0.6, 1.8);
    sail(-70, -590, -0.44, -0.9, 0.6, 110); sail(82, -612, 0.5, -0.87, 0.6, 110);
    for (let i = boats.length; i < NB; i++) { const a = rng.range(0, Math.PI * 2), f = far[i - 6]; sail(f[0], f[1], Math.cos(a), Math.sin(a), rng.range(3, 5)); }
    boats.length = Math.min(boats.length, NB);
    const TB = 150, travel = (b, t) => b.v * TB * (1 - Math.exp(-t / TB)) - b.v * TB * (1 - Math.exp(-30 / TB));   // 0 at t = 30
    await ctx.yield();
    const boatGeo = drifterGeometry(pal);
    await ctx.yield();
    { const sd = new Float32Array(NB); for (let i = 0; i < NB; i++) sd[i] = rng(); boatGeo.setAttribute('aSeed', new THREE.InstancedBufferAttribute(sd, 1)); }
    const boatMat = styleMaterial({ shared: sh, vertexColors: true, side: THREE.DoubleSide, color: tint, outline: 0.3,
      vertDecl: PART_VERT_DECL, vertMain: BOAT_VERT_MAIN, fragDecl: PART_FRAG_DECL, fragPigment: BOAT_FRAG, uniforms: { uPxAng: pxAng, uLantern: { value: M.lantern } } });
    const fleet = new THREE.InstancedMesh(boatGeo, boatMat, NB);
    fleet.frustumCulled = false; fleet.name = 'drifters';
    scene.add(fleet);
    const ops = hero.ops;
    const strokeFor = rare ? [0, 1, 2, 4] : [0, 1, 2, 3, 4];           // which boats rake the sea (hero.ops slots)
    const strokeOps = [];
    for (const i of strokeFor) if (i < NB) strokeOps[i] = ops.addStroke({ x0: 0, z0: 0, x1: 0, z1: 1, drag: i === 0 ? 24 : 14, width: i === 0 ? 7.5 : 7, tail: 40, order: 60 + i });
    const _m4 = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _s = V3(1, 1, 1), _p = V3(0, 0, 0);
    const boatState = boats.map(() => ({ x: 0, z: 0, dx: 0, dz: -1 }));
    const placeBoats = (time, u) => {
      for (let i = 0; i < NB; i++) {
        const b = boats[i], st = boatState[i];
        if (b.hero) { st.x = HERO_X; st.z = heroZ(u); st.dx = 0; st.dz = -1; }
        else { const d = travel(b, time); st.x = b.x + b.dx * d; st.z = b.z + b.dz * d; st.dx = b.dx; st.dz = b.dz; }
        const hb = hero.heightAt(st.x + st.dx * 5, st.z + st.dz * 5, time), hs = hero.heightAt(st.x - st.dx * 5, st.z - st.dz * 5, time);
        const hr = hero.heightAt(st.x - st.dz * 2, st.z + st.dx * 2, time), hl = hero.heightAt(st.x + st.dz * 2, st.z - st.dx * 2, time);
        _p.set(st.x, (hb + hs + hr + hl) * 0.21, st.z);
        _e.set((hb - hs) / 10 * 0.8, Math.atan2(-st.dx, -st.dz), (hr - hl) / 4 * 0.5 - 0.07 + 0.02 * Math.sin(time * 0.6 + i * 2.1), 'YXZ');
        _q.setFromEuler(_e);
        _s.setScalar(BOAT_K);
        fleet.setMatrixAt(i, _m4.compose(_p, _q, _s));
        _s.setScalar(1);
        const so = strokeOps[i];
        if (so) {
          const f = so.fields;
          if (b.hero) { f.x0 = HERO_X; f.z0 = heroZ(0) + 270; f.x1 = HERO_X; f.z1 = st.z - 10; }
          else { f.x0 = b.x - b.dx * b.wake; f.z0 = b.z - b.dz * b.wake; f.x1 = st.x + st.dx * 10; f.z1 = st.z + st.dz * 10; }
        }
      }
      fleet.instanceMatrix.needsUpdate = true;
    };
    await ctx.yield();

    // ---- e. basking sharks: a staggered file swimming south into the tide, each in its own clear lens
    const SHARK_V = 1.2 * DUR;                                  // metres swum per unit of u
    let file = [[-22, 1], [-50, -1], [-80, 1], [-111, -1], [-136, 1], [-161, -1], [-190, 1]];
    const nFile = clamp(Math.round(5 * density), 4, 6);
    if (rare) file = file.slice(3);                              // the torus takes the head of the file
    else if (nFile === 6) file.splice(0, 1); else if (nFile === 5) { file.splice(2, 1); file.splice(0, 1); } else { file.splice(4, 1); file.splice(2, 1); file.splice(0, 1); }
    const sharks = file.map(([z, side], i) => ({ Z: z, x: side < 0 ? -7 : 6.5, ui: uAtZ(z), size: rng.range(0.9, 1.05), ph: rng.range(0, 6.28), i, zNow: z, ahead: 999 }));
    const sense = A.eddySense || 1;
    const torus = rare ? { c: V3(-30, 0, -30), R: 20, n: 11 } : null;
    const NSH = sharks.length + (torus ? torus.n : 0);
    await ctx.yield();
    const sharkGeo = sharkGeometry(pal);
    await ctx.yield();
    { const sd = new Float32Array(NSH); for (let i = 0; i < NSH; i++) sd[i] = rng(); sharkGeo.setAttribute('aSeed', new THREE.InstancedBufferAttribute(sd, 1)); }
    const sharkMat = styleMaterial({ shared: sh, vertexColors: true, side: THREE.DoubleSide, color: tint, spots: 0.8, spotCell: 0.5, spotCream: 0.3, outline: 0.5,
      vertDecl: SHARK_VERT_DECL, vertMain: SHARK_VERT_MAIN, fragDecl: SHARK_FRAG_DECL, fragPigment: SHARK_FRAG, uniforms: { uPxAng: pxAng, uLantern: { value: 0 } } });
    const sharkMesh = new THREE.InstancedMesh(sharkGeo, sharkMat, NSH);
    sharkMesh.frustumCulled = false; sharkMesh.name = 'basking-sharks';
    scene.add(sharkMesh);
    // still, dark water under the lenses (only ever seen through them)
    const deep = new THREE.Mesh(new THREE.PlaneGeometry(760, 560).rotateX(-Math.PI / 2), new THREE.ShaderMaterial({
      uniforms: { uPig: sh.uPig, uHazeCol: sh.uHazeCol, uHaze: sh.uHaze }, fog: false,
      vertexShader: 'void main(){ gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }',
      fragmentShader: `precision highp float;\n${EBRU_GLSL}\nvoid main(){ gl_FragColor = vec4(mix(uPig[7], uPig[1], .22), 1.); }` }));
    deep.position.set(-40, -4.6, -100); deep.name = 'deep-water';
    scene.add(deep);
    const lensOps = [0, 1].map((k) => ops.addDrop({ x: 0, z: 0, r: 0, pigment: 3, core: 0.93, corePigment: 7, lens: 0.25, order: 80 + k }));
    const finOps = [0, 1, 2].map((k) => ops.addStroke({ x0: 0, z0: 0, x1: 0, z1: 0, drag: 3.2, width: 1.0, tail: 8, order: 70 + k }));
    let torusLens = null, torusVortex = null;
    if (torus) {
      torusVortex = ops.addVortex({ x: torus.c.x, z: torus.c.z, angle: 0, radius: 24, order: 13 });
      torusLens = ops.addDrop({ x: torus.c.x, z: torus.c.z, r: 0, pigment: 3, core: 0.972, corePigment: 7, lens: 0.25, order: 85 });
    }
    const U_T0 = uAtZ(100), U_T1 = uAtZ(40);
    const _camP = V3(0, 0, 0);
    const lensBest = [null, null], finBest = [null, null, null];
    const placeSharks = (time, u) => {
      camAt(u, _camP);
      lensBest[0] = lensBest[1] = null; finBest[0] = finBest[1] = finBest[2] = null;
      for (const s of sharks) {
        s.zNow = s.Z + SHARK_V * (s.ui - u);
        s.xNow = s.x + 0.5 * Math.sin(time * 0.23 + s.ph);
        s.ahead = _camP.z - s.zNow;
        s.lensR = 6.5 * s.size * (1 - smoothstep(36, 46, s.ahead)) * smoothstep(-6, -1, s.ahead);
        if (s.lensR > 0.05 && (!lensBest[s.i % 2] || s.lensR > lensBest[s.i % 2].lensR)) lensBest[s.i % 2] = s;
        if (s.ahead > -8 && s.ahead < 68) finBest[s.i % 3] = s;
        _p.set(s.xNow, hero.heightAt(s.xNow, s.zNow, time) * 0.8 - 1.05 * s.size, s.zNow);   // the back rides a quarter metre under: only snout tip, dorsal and tail lobe break the surface
        _e.set(0.1, Math.PI + 0.05 * Math.sin(time * 0.31 + s.ph), 0, 'YXZ'); _q.setFromEuler(_e);
        _s.setScalar(s.size);
        sharkMesh.setMatrixAt(s.i, _m4.compose(_p, _q, _s));
      }
      _s.setScalar(1);
      for (let k = 0; k < 2; k++) { const s = lensBest[k], f = lensOps[k].fields; if (s) { f.x = s.xNow; f.z = s.zNow - 0.4; f.r = s.lensR; } else f.r = 0; }
      for (let k = 0; k < 3; k++) { const s = finBest[k], f = finOps[k].fields; if (s) { f.x0 = s.xNow; f.z0 = s.Z - 85; f.x1 = s.xNow; f.z1 = s.zNow + 1.6; } else { f.x0 = 0; f.z0 = 0; f.x1 = 0; f.z1 = 0; } }
      if (torus) {
        const w = sense * 0.058 * time;
        for (let k = 0; k < torus.n; k++) {
          const a = k / torus.n * Math.PI * 2 + w, x = torus.c.x + Math.cos(a) * torus.R, z = torus.c.z + Math.sin(a) * torus.R;
          const hx = -Math.sin(a) * sense, hzz = Math.cos(a) * sense;
          _p.set(x, hero.heightAt(x, z, time) * 0.8 - 1.05, z);
          _e.set(0.1, Math.atan2(-hx, -hzz), 0, 'YXZ'); _q.setFromEuler(_e);
          sharkMesh.setMatrixAt(sharks.length + k, _m4.compose(_p, _q, _s));
        }
        torusLens.fields.r = 27 * smoothstep(U_T0, U_T1, u);
        torusVortex.fields.angle = -sense * (2.4 + 0.03 * Math.min(time, 150));
      }
      sharkMesh.instanceMatrix.needsUpdate = true;
    };
    await ctx.yield();

    // ---- f. birds: kittiwakes wheeling round the two great stacks, terns over the shark file (and, at
    //         dawn, a hundred more on a bait ball under the entry), six scripted plunges with splash and ring
    const NK = Math.round(80 * density * (0.6 + 0.4 * detail)), NT = Math.round(40 * density * (0.6 + 0.4 * detail));
    const BAIT = V3(112, 0, 205), NFK = Math.round(28 * (0.6 + 0.4 * detail)), NBAIT = M.bait ? Math.round(100 * (0.6 + 0.4 * detail)) : 0, NPL = 6;
    const NBIRD = NK + NFK + NT + NBAIT + NPL;
    const aA = new Float32Array(NBIRD * 4), aB = new Float32Array(NBIRD * 4);
    let bi = 0;
    const bird = (x, y, z, r, ph, sp, mode, size) => { const o = bi * 4; aA[o] = x; aA[o + 1] = y; aA[o + 2] = z; aA[o + 3] = r; aB[o] = ph; aB[o + 1] = sp; aB[o + 2] = mode; aB[o + 3] = size; bi++; };
    for (let i = 0; i < NK; i++) {
      const top = A.greatStacks[i % 2], R = rng.range(24, 48);
      bird(top.x, top.y - rng.range(2, 24), top.z, R, rng.range(0, 6.28), rng.sign() * rng.range(6, 9.5) / R, 0, rng.range(1.6, 2.0) * 1.55);
    }
    for (let i = 0; i < NFK; i++) { const R = rng.range(17, 29); bird(i % 2 ? 55 : -55, 16 + (rng.range(14, 30) - 14) * 1.75, -540, R, rng.range(0, 6.28) * 0.07, rng.sign() * rng.range(6, 9) / R, 0, rng.range(1.7, 2.1) * 1.5); }   // two wheels flanking the ring: life in the sky on the climb
    for (let i = 0; i < NT; i++) {
      const x = rng.sign() * rng.range(9, 30), y = rng.range(6, 15), z = rng.range(-205, -15), r = rng.range(1.5, 4), ph = rng(), sz = rng.range(1.35, 1.65);
      if (i < 12 && sharks.length) {                           // a dozen hover low over the file, three to a shark, in the gaze
        const s = sharks[i % sharks.length], k = Math.floor(i / sharks.length);
        bird(Math.sign(s.x) * (8.5 + k * 2.4), 4.2 + ((i * 2.3) % 3.6), s.Z - 5 + ((i * 7) % 11), Math.min(r, 2), ph, 0, 1, 2.0);
      } else bird(x, y, z, r, ph, 0, 1, sz);
    }
    for (let i = 0; i < NBAIT; i++) { const a = rng.range(0, 6.28), r = 58 * Math.sqrt(rng()); bird(BAIT.x + Math.cos(a) * r, rng.range(5, 17), BAIT.z + Math.sin(a) * r, rng.range(1.5, 4), rng(), 0, 1, rng.range(1.35, 1.65)); }
    const plungeSpec = rare ? [[10, -75], [10, -113], [-10, -138], [10, -163], [-10, -192], [10, -222]] : [[10, -36], [-10, -66], [10, -113], [-10, -138], [10, -163], [-10, -192]];
    const plunges = plungeSpec.map(([x, z], k) => ({ x, z, u0: uAtZ(z + 24), k, slot: NK + NFK + NT + NBAIT + k }));
    for (const p of plunges) bird(p.x, 13, p.z, 0, rng(), 0, 2, 1.7);
    await ctx.yield();
    const birdGeo = new THREE.InstancedBufferGeometry();
    { const bg = birdGeometry(pal); birdGeo.index = bg.index; for (const k of ['position', 'normal', 'color', 'aPart']) birdGeo.setAttribute(k, bg.attributes[k]); }
    const aAattr = new THREE.InstancedBufferAttribute(aA, 4), aBattr = new THREE.InstancedBufferAttribute(aB, 4);
    aAattr.setUsage(THREE.DynamicDrawUsage); aBattr.setUsage(THREE.DynamicDrawUsage);
    birdGeo.setAttribute('aA', aAattr); birdGeo.setAttribute('aB', aBattr);
    birdGeo.instanceCount = NBIRD;
    const birdU = { uPeel: { value: 0 } };
    const birds = new THREE.Mesh(birdGeo, styleMaterial({ shared: sh, vertexColors: true, side: THREE.DoubleSide, color: tint, outline: 0.6, bias: 0.25,
      vertDecl: BIRD_VERT_DECL, vertMain: BIRD_VERT_MAIN, uniforms: birdU }));
    birds.frustumCulled = false; birds.name = 'kittiwakes-and-terns';
    scene.add(birds);
    // splash crowns (instances 0..5) and plunge rings (6..11)
    const splashGeo = new THREE.InstancedBufferGeometry();
    { const q = new THREE.PlaneGeometry(1, 1); splashGeo.index = q.index; splashGeo.setAttribute('position', q.attributes.position); splashGeo.setAttribute('uv', q.attributes.uv); }
    const spPos = new Float32Array(NPL * 2 * 3), spS = new Float32Array(NPL * 2 * 4);
    const spPosA = new THREE.InstancedBufferAttribute(spPos, 3), spSA = new THREE.InstancedBufferAttribute(spS, 4);
    spPosA.setUsage(THREE.DynamicDrawUsage); spSA.setUsage(THREE.DynamicDrawUsage);
    splashGeo.setAttribute('aPos', spPosA); splashGeo.setAttribute('aS', spSA); splashGeo.instanceCount = NPL * 2;
    const splash = new THREE.Mesh(splashGeo, new THREE.ShaderMaterial({ uniforms: { uPig: sh.uPig, uHazeCol: sh.uHazeCol, uHaze: sh.uHaze, uTint: { value: tint } },
      vertexShader: SPLASH_VERT, fragmentShader: SPLASH_FRAG, transparent: true, depthWrite: false, side: THREE.DoubleSide, fog: false }));
    splash.frustumCulled = false; splash.renderOrder = 2; splash.name = 'plunge-splashes';
    scene.add(splash);
    const DPL = 0.02;
    const placePlunges = (time, u) => {
      for (const p of plunges) {
        const f = (u - p.u0) / DPL, k = p.k, o = p.slot * 4;
        const sea = hero.heightAt(p.x, p.z, time);
        let y = 13 + 0.6 * Math.sin(time * 1.3 + k), pitch = 0;
        if (f > -1.6 && f <= 0) { const d = (f + 1.6) / 1.6; y = lerp(y, sea + 0.2, d * d); pitch = -1.25 * smoothstep(0, 0.25, d); }
        else if (f > 0 && f <= 0.5) { y = -3; pitch = -1.25; }
        else if (f > 0.5 && f < 2.6) { const d = smoothstep(0.5, 2.6, f); y = lerp(sea + 0.4, 11, d); pitch = 0.55 * (1 - d) + 0.12 * Math.sin(time * 14) * (1 - d); }
        else if (f >= 2.6) y = 11 + 0.6 * Math.sin(time * 1.3 + k);
        aA[o] = p.x + (f > 0.5 ? Math.min(f - 0.5, 3) * 0.8 : 0); aA[o + 1] = y; aA[o + 2] = p.z; aB[o + 1] = pitch;
        const a = k * 3, b = k * 4, c = (NPL + k) * 3, d = (NPL + k) * 4;
        spPos[a] = p.x; spPos[a + 1] = sea - 0.1; spPos[a + 2] = p.z; spS[b] = 3.6; spS[b + 1] = clamp(f * 1.5, 0, 1.75) * (f < 1.17 ? 1 : 0); spS[b + 2] = 0; spS[b + 3] = k + 0.37;
        spPos[c] = p.x; spPos[c + 1] = sea + 0.3; spPos[c + 2] = p.z; spS[d] = 7.2; spS[d + 1] = f > 0.05 && f < 2 ? f * 1.2 : 0; spS[d + 2] = 1; spS[d + 3] = k;
      }
      aAattr.needsUpdate = true; aBattr.needsUpdate = true; spPosA.needsUpdate = true; spSA.needsUpdate = true;
    };
    await ctx.yield();

    // ---- g. great drops (keyed to u), tern rings, the bait ball's rings, the shawl pattern
    const hd = V3(0, 0, 0); path.tangentAt(0, hd); hd.y = 0; hd.normalize();
    const D1 = V3(path.start.x + hd.x * 78 + hd.z * 12, 0, path.start.z + hd.z * 78 - hd.x * 12);
    const D3 = V3(HERO_X, 0, heroZ(0.24));
    const dropOps = [
      ops.addDrop({ x: D1.x, z: D1.z, r: 0, pigment: 3, core: 0.74, corePigment: 0, order: 52 }),
      ops.addDrop({ x: 72, z: 128, r: 0, pigment: 1, core: 0.64, corePigment: 0, order: 53 }),
      ops.addDrop({ x: D3.x, z: D3.z, r: 0, pigment: 3, core: 0.78, corePigment: 1, order: 55 }),
    ];
    const setDrops = (u, time) => {
      dropOps[0].fields.r = 6.5 + 4 * smoothstep(0, 0.1, u) + 0.3 * Math.sin(time * 0.8);
      dropOps[1].fields.r = 13 * smoothstep(0.1, 0.25, u);
      dropOps[2].fields.r = 2.5 + 17.5 * smoothstep(0.015, 0.12, u);
    };
    ops.addRingField({ x: 0, z: -110, radius: 115, cell: 15, maxR: 1.6, period: 5, density: 0.5 * density, pigment: 3, order: 56 });
    if (M.bait && ops.free() > 0) ops.addRingField({ x: BAIT.x, z: BAIT.z, radius: 64, cell: 9, maxR: 2.2, period: 3.2, density: 0.85, pigment: 3, order: 57, seed: 5 });
    if (shawl && ops.free() > 0) ops.addShear({ dirX: 0.8, dirZ: 0.6, amp: 46, wavelength: 260, phase: look() * 6, order: 5 });

    // ---- h. gaze, portal, post
    const _t1 = V3(0, 0, 0), _t2 = V3(0, 0, 0);
    const pois = [
      // down along the wake to the drifter raking the great ring
      { at: (time, u) => { camAt(u, _t2); const z = heroZ(u), d = Math.hypot(HERO_X - _t2.x, z - _t2.z); return _t1.set(HERO_X, 4 - clamp(0.2 * d, 0, 24), z); }, from: 0.04, to: 0.36, weight: 0.75, fade: 0.3 },
      // the shark whose lens is coming up
      { at: (time, u) => {
        camAt(u, _t2); let wx = 0, wz = 0, ws = 1e-3;
        for (const s of sharks) { const z = s.Z + SHARK_V * (s.ui - u), a = _t2.z - z, w = Math.exp(-((a - 24) * (a - 24)) / 260); wx += s.x * w; wz += z * w; ws += w; }
        const k = clamp(ws, 0, 1);
        return _t1.set(lerp(0, wx / ws, k), -1, lerp(_t2.z - 30, wz / ws, k));
      }, from: torus ? 0.47 : 0.38, to: 0.62, weight: 0.42, fade: 0.2 },
      { at: [0, 2, -556], from: 0.66, to: 0.97, weight: 0.92, fade: 0.25 },
    ];
    if (torus) pois.push({ at: [torus.c.x, -1, torus.c.z], from: 0.33, to: 0.47, weight: 0.6, fade: 0.3 });

    const _sz = new THREE.Vector2(), _cw = V3(0, 0, 0);
    const renderer = ctx.renderer;
    return {
      scene, path, duration: DUR, title: M.title,
      camera: { fov: 62, near: 0.3, far: 4300, lookAhead: 34, sway: 1, bank: 1 },
      pois,
      portal: { shape: 'circle', radius: 7, color: '#BFEFE6', glow: 1, revealDistance: 330, tilt: true },
      post: M.post,
      ride: 'none', style: 'none',
      update(dt, time, camera, u) {
        u = clamp(u || 0, 0, 1);
        if (renderer && camera) { renderer.getDrawingBufferSize(_sz); pxAng.value = 2 * Math.tan((camera.fov || 62) * DEG / 2) / Math.max(_sz.y, 1); }
        // i. scripted moments (u) and ambient loops (time)
        hero.setProgress(u);
        hero.setHighlight(M.hi * (M.hiFrom < 0 ? 1 : smoothstep(M.hiFrom, M.hiFrom + 0.1, u)) * (1 - 0.82 * smoothstep(0.75, 0.85, u)));   // thins to a faint scatter over the field: the ring alone
        setDrops(u, time);
        placeBoats(time, u);
        placeSharks(time, u);
        placePlunges(time, u);
        birdU.uPeel.value = smoothstep(0.63, 0.71, u) * (1 - smoothstep(0.76, 0.82, u));
        const drift = 150 * (1 - Math.exp(-time / 125));
        if (slabU) { slabU.uDrift.value = drift; }
        if (puffs) {
          const base = puffs.userData.base;
          for (let i = 0; i < base.length; i++) {
            const b = base[i], k = 1 + 0.05 * Math.sin(time * 0.21 + b.ph);
            _p.set(b.x, b.y + 3 * Math.sin(time * 0.13 + b.ph), EDGE0 + b.z + drift);
            _e.set(0, b.ry + time * 0.004, 0, 'YXZ'); _q.setFromEuler(_e);
            _s.set(b.sx * k, b.sy / k, b.sx * 0.8 * k);
            puffs.setMatrixAt(i, _m4.compose(_p, _q, _s));
          }
          _s.set(1, 1, 1);
          puffs.instanceMatrix.needsUpdate = true;
        }
        if (camera) {
          camera.getWorldPosition(_cw);                      // never camera.position: behind a portal only the world matrix is set
          sky.position.copy(_cw);
          for (const r of rains) { r.u.uPxAng.value = pxAng.value; r.u.uCen.value.copy(_cw); if (r.cenY != null) r.u.uCen.value.y = r.cenY; }
        }
        hero.update(dt, time, camera);
      },
      dispose() { hero.dispose(); },
    };
  },
};
