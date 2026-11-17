// HERO SET PIECE for "thousand-kite-roofs" (The Sky Is Full of Paper): THE SKY ITSELF.
//
// WHAT IT IS
//   ~4,800 paper fighter kites (per seed 4,300-5,200; magenta, saffron, lime, turquoise, white, red; halved,
//   striped, quartered, moon-spotted) flown over a square kilometre, every one on its own sagging, glinting
//   glass-coated line that leans back upwind to a roof. Each kite is flown in the vertex shader on a sphere
//   round its anchor (figure-eights, stoops, a gust wave that crosses the whole sky), turns its nose into its
//   velocity and streams a paper tail; ~110 "cut" kites side-slip down and settle on the roofs. Tissue is
//   translucent: kites between the camera and the sun glow like stained glass with the bamboo spine and bow
//   in silhouette. Through the middle rises THE RED TRAIN: 300 scarlet kites on one line, a 250 m vertebral
//   arc with a travelling wave, from a bamboo winch on a roof up to THE RING: a 20 m bamboo hoop kite (clear
//   14 m opening for the portal) with a tissue annulus in red / saffron / magenta, 48 streaming pennants,
//   bunting on its stays, held by twelve converging lines from tripods on roofs 150-250 m away.
//   Optional "stage" (on by default so the piece can be judged alone): a cheap pastel roof mosaic with
//   shadow stripes and sliding kite shadows. The world replaces it: pass { stage: false }.
//
// LOCAL SPACE  origin = centre of the square kilometre at street level, +Y up. The wind blows toward -Z, so
//   the camera comes from +Z (the piece's front) and flies toward -Z; +X is to the right of travel, the sun
//   is on the left (-X). To drop it into the brief's world frame (heading +X, city X -150..850):
//       hero.object.position.set(350, 0, 0); hero.object.rotation.y = -Math.PI / 2;
//   (local -Z -> world +X, local +X -> world +Z; anchors.toWorld(v) does the same mapping for a point.)
//   Do not scale the object. radius/height/center are VIEWER FRAMING for the train + ring; the whole field
//   is anchors.field (half extent 500 m, kites 30-150 m up).
//
// OPTS
//   palette     7 hex strings in brief order [cream, pink, lime, sky blue, sandstone, magenta, red]
//   count       number of kites (default per seed 4300-5200, scaled by ctx.quality.detail, never below 2500)
//   stage       true (default) | false: the placeholder roofs + mosaic plane (20k triangles, 2 draws)
//   roofY       (x, z) => roof height in local metres; pass the world's own so every line ends on a real roof
//               (default: the stage's plot grid, 9-15 m)
//   path        camera path as [[x,y,z],...] or Vector3[] in LOCAL space. Every kite and line is kept >= 6 m
//               from it (plus its own swing), and ~450 "escort" kites are hung 8-40 m beside its high parts so
//               the camera is always inside the paper. Default: the brief's journey (anchors.pathDefault).
//   pathSpace   'world': opts.path is in the brief's world frame (converted with the placement above)
//   lineOpacity near opacity of the kite lines (default 0.45; they are 1.5 px ribbons that thin out with distance)
//   windLean    radians the whole sky leans off the -Z wind (default per seed, +-0.1); cutU see greatCut
//   sunDir      unit vector TO the sun in local space (default brief: [-0.91, 0.37, -0.16])
//   sunColor / sunIntensity / skyColor / groundColor / hemiIntensity   own-lit shaders; defaults from the brief
//   scheme      'all' | 'magenta-saffron' | 'turquoise-white' dominant paper colours (default per seed)
//   pathFn      ({ flyThrough, toLocal, toWorld }) => points: build the path from the finale line (uses pathSpace)
//   minCount    lowest kite count allowed (default 2500; a dusk or early-morning sky passes a few hundred)
//   elevation   mean line elevation in radians (default per seed 0.82-0.98; ~0.6 for a stiff-wind day)
//   greatCut    true: the rare event: up to 300 kites (15% of a thin sky) are cut loose when setProgress crosses cutU (default 0.328)
//   heroEscorts number of big kites (half size 1.3-1.7) hung 10-15 m beside and below the climb and duel (default 36)
//   pathEscorts number of great kites (half size 1.8-2.6) hung 12-19 m beside and above the WHOLE path, evenly in path
//               length: the fall, the skim (10-25 m above the row) and the final climb too (default 70)
//   midKites    number of large kites (half size 1.3-1.9) 25-80 m from the whole path (default 240); ringHalo: number
//               of large kites in a wreath 64-150 m round and beyond the hoop, outside its clear bubble (default 70)
//   meanY       mean height of the field kites (default 80; lower on a stiff-wind day); lamp 0..1: dusk, the train
//               is lit from the lamps below
//   ringY / ringTilt   height of the hoop's centre (default 96) and its tilt back in degrees (default 35): a world that
//               wants the last approach low over its roofs hangs it lower and flatter. finaleScale: size factor of the
//               great kites beside the route beyond the minarets (default 1)
//   farKites    number of very large kites (half size 2.8-4.6) hung 70-250 m from the high part of the route, to fill the
//               sky between the near paper and the far specks (default 0). beyondKites: number of kites flown downwind of
//               the field, as far as beyond.reach metres past the centre and beyond.halfX to either side (default 0);
//               beyond.noAnchor(x, z) = true where no line may end (water). Both flights are placed last and from their own
//               random stream, so every other kite of the sky is the same with or without them.
//
//   anchorFix   (x, z) => [x, z] in local metres: where the roof end of a line may stand (the world moves it in from a lane
//               onto the roof beside it, so a flyer can stand there). fixed: [{ a, k, size, c1, c2, pat, phase, speed,
//               ampAz, ampEl, hash }] composed great kites: roof end a and kite k as [x,y,z] (in pathSpace), placed first,
//               drawing nothing from the random stream; anchors.fixedPlaced[i] is false where the clearances refused one.
//               bigLineOpacity: opacity floor of the great kites' strings (default 0.6; uniform uBigA on 'kite-lines')
//   clearLanes  [{ a, b, r0, r1 }] sight lines (in pathSpace) kept clear of the scattered field: capsules from a to b whose
//               radius runs from r0 to r1. A field kite whose mean place is inside one is hidden with its line; the kites
//               hung beside the route are never taken, and nothing else in the sky moves (anchors.counts.cleared).
//
// ANCHORS (all local space)
//   portalSeat      { position, normal, up, radius: 7, tiltDeg: 35 }: centre of the hoop, normal = the direction
//                   the camera flies through it (35 degrees up, toward -Z), up = in-plane up. Seat the 14 m portal here.
//   flyThrough      Vector3[]: safe camera line for the finale: over the winch roof, 7 m above the red train,
//                   last 60 m straight at 35 degrees into the hoop, then 30 m beyond. >= 6 m from everything.
//   trainCurve      Vector3[] (33 points) rest line of the train; trainAnchor = its roof end (the winch)
//   ringLineAnchors Vector3[12] roof ends of the ring's stays (tripods stand there; put roofs under them)
//   kiteAnchors     Float32Array xyz per kite: the roof point each line leans back to (put crowd knots there)
//   pathDefault     Vector3[] the brief's journey in local space as used for clearance
//   minarets        Vector3[2] suggested bases of the twin minarets (they frame the train and ring)
//   launch          Vector3 the launch terrace; viewpoints: { entry, duel, skim, finale } good camera spots
//   field           { halfX, halfZ, minY, maxY }; placement { position, rotationY }; toWorld(v) / toLocal(v)
//   counts          { kites, lines, escorts, train } as built
//
// HOOKS  update(dt, time, camera) every frame (camera is never cached). setProgress(u): journey progress;
//   drives the gust that takes the train and ring from u 0.76 (wave and pennants strengthen) and the optional
//   great cut. setSun(dir, color, intensity) / setAmbient(sky, ground, intensity) relight the paper.
//   uniforms is exposed for anything else (uGust, uTime ...).
//
// COST  about 130k triangles with the stage (about 110k without), 8 draw calls (6 without the stage), no
//   lights, no textures, 150-270 ms build. Everything is instanced and animated in vertex shaders. Kites
//   and lines never cull (one draw each). Great kites hold a 1.4 px floor; field kites thin out with distance (one in
//   eight is left by 380 m, and they take the haze a little sooner) and those left hold a 3.2 px floor, so the far sky is
//   separate diamonds with blue between them, not specks. Lines hold a 1.5 px floor; the strings of the great kites (half
//   size 1.75 and up) within about 120 m of the eye are never stubbed, so each reads down to its flyer: bright out in the
//   air, a thread where it passes within 30 m of the eye; every string looked down on against the roofs is drawn fainter.
//   The red train never falls under a fiftieth of the frame's half height across, so it is a ribbon from 500 m.
//
// LIGHTING  wants the brief's low sun from the left and a clear blue sky behind it: the paper, lines and
//   stage are lit by their own uniforms (set them with setSun / setAmbient to match the world), the bamboo
//   hoop, tripods and winch are MeshStandardMaterial and take the scene's lights. Scene fog is honoured.
//   Bloom should catch only line glints and backlit tissue (values 1.5-5).

import * as THREE from 'three';
import { clamp, lerp, smoothstep, makeRng, hashSeed } from '../kit/core.js';

const DEF_PAL = ['#F6E9D2', '#F4B8C6', '#CDE6A5', '#A9D4EF', '#C68A55', '#E3207F', '#D8281C'];
const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
const lin = (hex) => new THREE.Color(hex);
const toV3 = (p) => (p.isVector3 ? p.clone() : V3(p[0], p[1], p[2]));

// distance from point (x,y,z) to a polyline of Vector3
function distPoly(x, y, z, poly) {
  let best = 1e9;
  for (let i = 0; i < poly.length - 1; i++) {
    const a = poly[i], b = poly[i + 1];
    const dx = b.x - a.x, dy = b.y - a.y, dz = b.z - a.z;
    const l2 = dx * dx + dy * dy + dz * dz || 1e-6;
    const t = clamp(((x - a.x) * dx + (y - a.y) * dy + (z - a.z) * dz) / l2, 0, 1);
    const ex = a.x + dx * t - x, ey = a.y + dy * t - y, ez = a.z + dz * t - z;
    const d = ex * ex + ey * ey + ez * ez;
    if (d < best) best = d;
  }
  return Math.sqrt(best);
}
// integer hash -> 0..1 (plot grid of the stage and default roof heights)
function h2(i, j, k) {
  let h = (Math.imul(i | 0, 374761393) + Math.imul(j | 0, 668265263) + Math.imul(k | 0, 1274126177)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

// ---------------------------------------------------------------- GLSL shared by kites and their lines
const GLSL_FLIGHT = /* glsl */`
uniform float uTime, uCutAt, uCutClock, uPx, uGust;
uniform vec3 uCam;
attribute vec3 iA;   // roof anchor
attribute vec4 iL;   // azimuth, elevation, line length, kite half size
attribute vec4 iP;   // phase, speed, azimuth swing, elevation swing
attribute vec2 iM;   // mode (0 flying, 1 cut and drifting, 2 cut at the great cut), hash
vec3 flyAt(float t){
  float w = iP.y, ph = iP.x;
  float s1 = sin(t*w + ph), s2 = sin(t*w*2. + ph*1.7);
  float f = fract(t*w*0.11 + ph*0.37);
  float st = smoothstep(0., .07, f)*(1. - smoothstep(.09, .26, f))*step(.55, iM.y);
  float gust = iP.w*.9*sin(t*.31 + iA.z*.021 + iA.x*.013);
  float az = iL.x + iP.z*(s1 + .35*sin(t*w*.37 + ph*2.3)) + st*iP.z*1.4*sin(ph*5.);
  float el = clamp(iL.y + iP.w*s2 - st*iP.w*3. + gust, .15, 1.5);
  float ce = cos(el);
  return iA + iL.z*vec3(sin(az)*ce, sin(el), -cos(az)*ce);
}
vec3 driftFrom(vec3 s0, float ts){
  float fall = 3.0 + 1.8*iM.y;
  float tl = clamp(ts, 0., max(s0.y - iA.y - .4, 0.)/fall);
  return s0 + vec3(sin(tl*.9 + iP.x)*5.*smoothstep(0., 3., tl), -fall*tl, -(4.5 + 3.*iM.y)*tl);
}
// returns position; vis = 0 hides (cut kites fade in and out of their loop)
vec3 kiteAt(float t, out float vis, out float cut){
  vis = 1.; cut = 0.;
  vec3 p = flyAt(t);
  if (iM.x > 1.5) {
    if (uCutClock >= 0.) { p = driftFrom(flyAt(uCutAt), uCutClock + (t - uTime)); cut = 1.; }
  } else if (iM.x > .5) {
    float ts = fract(t/46. + iM.y*7.)*46.;
    p = driftFrom(flyAt(iP.x*9.), ts); cut = 1.;
    vis = smoothstep(0., 1.5, ts)*(1. - smoothstep(43., 45.5, ts));
  }
  return p;
}
`;
const GLSL_TRAIN = /* glsl */`
vec3 trainWave(float s, float t){
  float e = sin(3.14159*clamp(s, 0., 1.)); e = e*sqrt(max(e, 0.));
  float a = .55 + .75*uGust;
  return e*a*vec3(2.2*sin(s*21. - t*1.7) + .6*sin(s*47. - t*2.9), .7*sin(s*17. - t*1.3 + 1.), 0.);
}
`;
const GLSL_LIGHT = /* glsl */`
uniform vec3 uSunDir, uSun, uSky, uGnd;
// translucent paper: lit face, plus stained-glass transmission when the sun is behind it
vec3 paper(vec3 base, vec3 N, vec3 V, float bone){
  if (dot(N, V) < 0.) N = -N;
  float ndl = dot(N, uSunDir);
  float front = max(ndl, 0.), back = max(-ndl, 0.);
  float vds = max(dot(-V, uSunDir), 0.);
  vec3 sat = base*base*1.25 + base*.35;
  vec3 amb = mix(uGnd, uSky, .5 + .5*N.y);
  vec3 c = base*(amb*1.15 + uSun*front*(1. - .45*bone));
  c += sat*uSun*back*1.6*(.5 + .5*vds*vds)*(1. - .85*bone);
  return c;
}
`;

// ---------------------------------------------------------------- kite shader (also the train with TRAIN)
const KITE_VERT = /* glsl */`
#include <common>
#include <fog_pars_vertex>
${GLSL_FLIGHT}
${GLSL_TRAIN}
attribute vec3 aN; attribute vec2 aPT; attribute vec3 iC1; attribute vec3 iC2; attribute float iPat;
uniform float uGrow, uTanH;
varying vec3 vN; varying vec3 vP; varying vec3 vC1; varying vec3 vC2; varying vec3 vUv; varying float vPat; varying vec2 vSH;
void main(){
  float vis = 1., cut = 0.;
#ifdef TRAIN
  vec3 P = iA + trainWave(iP.x, uTime);
  vec3 vel = (iA + trainWave(iP.x, uTime + .12) - P)/.12;
  vec3 n = normalize(-normalize(iL.xyz)*.55 + vec3(.5*sin(iM.y*6.283 + uTime*.9), -.4, .75));          // each kite of the chain yaws on the line
  float dist = length(P - uCam);
  // from far off the chain is drawn as a ribbon a fiftieth of the frame's half height across, whatever the resolution, so
  // the one red line of the sky reads from the far end of the city; it comes down to its true size as we near it
  float sz = max(max(iP.y*(1. + min(dist/150., .8)), 2.*dist*uPx), .02*dist*uTanH);
  vSH = vec2(smoothstep(170., 420., dist), iM.y);
  vec3 raw = vec3(0., 1., 0.) + vel*.14;
  float tailLen = 1.6, has = 1.;
#else
  vec3 P = kiteAt(uTime, vis, cut);
  float v2, c2;
  vec3 vel = (kiteAt(uTime + .12, v2, c2) - P)/.12;
  vec3 n = -normalize(P - iA + vec3(0., 1e-3, 0.));
  n = normalize(mix(n, vec3(.3*sin(uTime*.8 + iP.x), .55, .75), cut*.8));
  float dist = length(P - uCam);
  float sz = iL.w*(1. + min(dist/uGrow, 1.2));
  float big = step(1.2, iL.w);
  // far out the sky is fewer and larger: by 380 m one field kite in eight is left, each a diamond six or seven pixels
  // across, so the distance reads as separate kites with blue between them and not as a band of specks (the great
  // kites are all kept). A kite of size 0 was taken out of a sight line by the world (opts.clearLanes).
  float keep = max(step(.88*smoothstep(110., 380., dist), iM.y), big)*step(.05, iL.w);
  sz = max(sz, mix(3.2, 1.4, big)*dist*uPx)*keep;
  vec3 raw = vec3(1e-3, 3., 0.) + vel*(1. - .7*cut);
  float tailLen = 3.4 + 1.6*big, has = max(step(.3, fract(iM.y*13.7)), big)*mix(1. - smoothstep(240., 320., dist), 1., big);
  vSH = vec2(iL.w, iM.y);
#endif
  vec3 nose = normalize(raw - n*dot(raw, n) + vec3(1e-4, 0., 1e-4));
  vec3 rt = normalize(cross(nose, n));
  vec3 lp; vec3 nl;
  float part = aPT.x;
  if (part < 1.5) {
    float rip = sin(uTime*19. + iP.x*7. + position.y*5.)*.03*(.3 + abs(position.x));
    lp = P + sz*(rt*position.x + nose*position.y + n*(position.z + rip));
    nl = rt*aN.x + nose*aN.y + n*aN.z;
  } else {
    float t = aPT.y*has;
    vec3 td = normalize(-nose*.45 + vec3(0., -.75, -.6) - vel*.05);
    float wa = uTime*7. - t*5.5 + iP.x*3.;
    float wv = (sin(wa)*.24 + sin(uTime*11.3 - t*9. + iP.x)*.09)*t;
    lp = P + sz*(-nose*1.15 + td*t*tailLen + rt*(position.x*has + wv) + n*wv*.5);
    nl = normalize(n + rt*cos(wa)*.6);
  }
  lp = mix(P, lp, vis);
  vN = nl; vP = lp; vUv = vec3(position.xy, part); vC1 = iC1; vC2 = iC2; vPat = iPat;
  vec4 mvPosition = modelViewMatrix*vec4(lp, 1.);
  gl_Position = projectionMatrix*mvPosition;
  #include <fog_vertex>
#if defined(TRAIN) && defined(USE_FOG)
  vFogDepth *= .45;                       // the one red chain keeps its colour from the far end of the city
#endif
#if !defined(TRAIN) && defined(USE_FOG)
  vFogDepth *= mix(1.35, 1., big);        // the field kites sink into the haze a little sooner than the roofs: the paper has depth and keeps its colour
#endif
}`;
const KITE_FRAG = /* glsl */`
#include <common>
#include <fog_pars_fragment>
${GLSL_LIGHT}
uniform vec3 uCam; uniform float uLamp;
varying vec3 vN; varying vec3 vP; varying vec3 vC1; varying vec3 vC2; varying vec3 vUv; varying float vPat; varying vec2 vSH;
float kh1(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7)))*43758.5453); }
float kvn(vec2 p){
  vec2 i = floor(p), f = fract(p); f = f*f*(3. - 2.*f);
  return mix(mix(kh1(i), kh1(i + vec2(1., 0.)), f.x), mix(kh1(i + vec2(0., 1.)), kh1(i + vec2(1., 1.)), f.x), f.y);
}
void main(){
  float x = vUv.x, y = vUv.y, part = vUv.z;
  float aa = fwidth(y)*1.5 + fwidth(x)*1.5 + 1e-4;
  float big = step(1.2, vSH.x);
  vec3 base; float bone = 0.;
  if (part < .5) {
    float m;
#ifdef TRAIN
    if (vPat < .5) m = smoothstep(.86, .86 + aa, abs(x) + abs(y - .18)*.82);
#else
    if (vPat < .5) m = smoothstep(.74, .74 + aa, abs(x) + abs(y - .18)*.82);
#endif
    else if (vPat < 1.5) m = smoothstep(-aa, aa, x);
    else if (vPat < 2.5) m = smoothstep(.18 - aa, .18 + aa, y);
    else if (vPat < 3.5) m = smoothstep(.5 - aa*2., .5 + aa*2., abs(fract((y + x*.6)*2.1) - .5)*2.);
    else if (vPat < 4.5) { float d = length(vec2(x, y - .2)), d2 = length(vec2(x - .15, y - .28)); m = (1. - smoothstep(.44, .44 + aa, d))*smoothstep(.37, .37 + aa, d2); }
    else if (vPat < 5.5) m = smoothstep(-aa*.3, aa*.3, x*(y - .18));
    else m = 1. - smoothstep(.33, .33 + aa, length(vec2(x, y - .2)));
    base = mix(vC1, vC2, m);
    base *= .93 + .07*sin(x*41.)*sin(y*37.);
    float spine = 1. - smoothstep(.02, .02 + aa, abs(x));
    float bw = .2 + .78*sqrt(max(1. - x*x/.9025, 0.));
    float bow = 1. - smoothstep(.022, .022 + aa, abs(y - bw));
    bone = max(spine, bow)*.9;
    if (big > .5) {                                      // the great kites near the route: real paper
      float e = 1. - abs(x)/.95 - (y > .2 ? (y - .2)/.8 : (.2 - y)/1.2);                  // 0 on the rim of the diamond
      float fib = kvn(vec2(x*52., y*5.)), fib2 = kvn(vec2(x*8. + 3., y*19.));
      base *= mix(1., .8 + .24*fib + .12*fib2, 1. - smoothstep(.03, .12, aa));              // long fibres in the tissue (gone before they can alias)
      float seam = max(1. - smoothstep(.012, .012 + aa, abs(abs(x) - .44)), 1. - smoothstep(.012, .012 + aa, abs(y + .34)));
      base *= 1. - .26*seam;                                                               // creases where the sheets are pasted
      vec3 edgeC = mix(mix(vC2, vC1, m), vec3(.93, .88, .76), .35);
      base = mix(base, edgeC, 1. - smoothstep(.055, .055 + aa, e));                         // a pasted border in the other colour
      base = mix(base, vC2*.8 + .1, (1. - smoothstep(.09, .09 + aa, length(vec2(x, y - .2))))*.9);   // the bridle patch
    }
#ifdef TRAIN
    base *= .82 + .36*vSH.y;                             // three hundred sheets of paper, no two quite the same red
    base = mix(base, base*vec3(.5, .3, .3), bone);
#endif
  } else if (part < 1.5) {
    base = vC2;
    if (big > .5) {                                      // a fringed paper tassel
      float st = fract(x*13.);
      base = mix(vC2, vC1, step(.5, st));
      if (y < -1.08 && abs(st - .5) > .3) discard;
    }
  } else base = mix(vC1, vC2, step(.5, fract(vPat*.37 + .2 + big*floor(y*6. + .001)*.5)));
  vec3 c = paper(base, normalize(vN), normalize(uCam - vP), bone);
#ifdef TRAIN
  c += base*uLamp*.3;
  c *= 1. + .4*vSH.x;                                    // far off the chain is a little brighter than its paper
#endif
  gl_FragColor = vec4(c, 1.);
  #include <fog_fragment>
}`;

// ---------------------------------------------------------------- line ribbons (glass-coated manja)
const lineVert = (isStatic) => /* glsl */`
#include <common>
#include <fog_pars_vertex>
${isStatic ? 'uniform float uTime, uPx, uGust; uniform vec3 uCam; attribute vec3 aTan; attribute vec3 aSW; attribute vec3 aCol;' + GLSL_TRAIN : GLSL_FLIGHT + 'attribute vec3 iC1;'}
uniform float uLineW, uAFloor, uBigA;
varying vec3 vT; varying vec3 vP; varying vec3 vCol; varying float vA; varying float vM; varying float vG;
${isStatic ? '' : `
vec3 ptAt(float s, vec3 K){
  vec3 c = mix(iA, K, s);
  float sag = (.02 + .03*(.5 + .5*sin(uTime*iP.y*.6 + iP.x*2.)))*iL.z;
  float q = pow(clamp(s, 0., 1.), .8);
  c.y -= sag*4.*q*(1. - q);
  return c;
}`}
void main(){
#ifdef STATIC_LINE
  float s = aSW.y, side = aSW.x, hide = 0.;
  vec3 c = position;
  if (aSW.z < .5) c += trainWave(s, uTime);
  else c += sin(3.14159*s)*vec3(sin(uTime*.7 + aSW.z*5.), .5*sin(uTime*.9 + aSW.z*3.), 0.)*(.25 + .4*uGust);
  vec3 T = normalize(aTan);
  vCol = aCol; vM = s*240. + aSW.z*50.;
#else
  float vis, cut;
  vec3 K = kiteAt(uTime, vis, cut);
  float s = position.x, side = position.y, hide = max(cut, 1. - vis);
  vec3 c = ptAt(s, K);
  vec3 T = normalize(ptAt(s + .03, K) - ptAt(s - .03, K));
  vM = s*iL.z + iM.y*200.;
  hide = max(hide, 1. - step(.05, iL.w));
#endif
  vec3 toC = uCam - c; float dist = length(toC);
  vec3 sd = normalize(cross(T, toC) + vec3(1e-5, 0., 0.));
#ifdef STATIC_LINE
  float bigL = 0.;
#else
  float kd = length(K - uCam);
  float bigL = step(1.75, iL.w)*(1. - smoothstep(85., 170., kd));       // the string of a great kite near us: read all the way down to its flyer
  vCol = mix(vec3(.92, .9, .86), iC1, .4 + .32*bigL);                   // and it takes more of its kite's colour, so it reads as that kite's string
#endif
  float px = (1.5 + .3*bigL)*dist*uPx;
  float w = max(uLineW, px);
  float nr = 40./max(dist, 40.);
  vA = clamp(max(uLineW/max(px, 1e-5), uAFloor*pow(nr, .62)), 0., 1.)*(1. - hide);
  vG = pow(nr, .6)*(1. - hide);
#ifndef STATIC_LINE
  float stub = smoothstep(45., 150., dist), sTop = 1. - 40./max(iL.z, 41.);          // far off, only the last 40 m under the kite
  vA *= mix(mix(1., smoothstep(sTop - .12, sTop + .12, s), stub), 1., bigL);
  vA *= mix(1. - .92*smoothstep(-.015, .045, toC.y/max(dist, 1e-3))*smoothstep(18., 55., dist), 1., bigL);   // looked down on from aloft, the lines over the roofs are faint threads, not a veil
  float keepL = max(step(.88*smoothstep(110., 380., kd), iM.y), step(1.2, iL.w));          // no stub hangs where its kite has dropped away
  vA *= mix(1. - .8*smoothstep(90., 320., dist), 1., bigL)*keepL;                          // far field lines fall back: no white hairline fan
  // the bright floor of a great kite's string is for the string seen out in the air. Where it passes close by the eye it
  // falls back to a thread (a wide half-clear band across the foreground read as a smear), and any string looked down
  // on from aloft, against the roofs, is drawn at four tenths: it still runs to its flyer, as a line and not as a veil
  float nearEye = smoothstep(10., 34., dist), below = smoothstep(.04, .3, toC.y/max(dist, 1e-3));
  vA = max(vA, bigL*uBigA*(1. - hide)*(1. - smoothstep(70., 190., dist))*nearEye);
  vA *= 1. - .6*below*smoothstep(4., 20., dist);
#endif
  vec3 lp = c + sd*side*w*.5*(1. - hide);
  vT = T; vP = lp;
  vec4 mvPosition = modelViewMatrix*vec4(lp, 1.);
  gl_Position = projectionMatrix*mvPosition;
  #include <fog_vertex>
}`;
const LINE_FRAG = /* glsl */`
#include <common>
#include <fog_pars_fragment>
uniform vec3 uCam, uSunDir, uSun, uSky; uniform float uTime;
varying vec3 vT; varying vec3 vP; varying vec3 vCol; varying float vA; varying float vM; varying float vG;
void main(){
  vec3 T = normalize(vT), V = normalize(uCam - vP);
  vec3 H = normalize(V + uSunDir + vec3(0., 1e-4, 0.));
  float th = dot(T, H), k = max(1. - th*th, 0.);
  float band = pow(max(sin(vM*.21 + dot(V, vec3(31., 17., 23.))), 0.), 24.);
  float glint = pow(k, 260.)*band;
  float cell = floor(vM*1.3 - uTime*2.5);
  float spark = step(.9, fract(sin(cell*12.9898)*43758.5453))*pow(k, 30.);
  float g = (glint + spark*.15)*vG;
  vec3 col = vCol*(uSky*1.2 + uSun*.42) + uSun*g*2.0;
  gl_FragColor = vec4(col, clamp(vA*(1. + g*1.5) + g*.2, 0., 1.));
  #include <fog_fragment>
}`;

// one kite: bent diamond (4 facets), paper "phudda" tail triangle, 3-segment ribbon tail. 11 triangles.
function kiteGeometry(segs = 3, big = false) {
  const pos = [], nor = [], pt = [];
  const N = [0, 1, 0], S = [0, -1, 0], C = [0, 0.18, 0.05], E = [0.95, 0.2, -0.2], W = [-0.95, 0.2, -0.2];
  const tri = (a, b, c, part, ta = 0, tb = 0, tc = 0) => {
    const u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], v = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
    let n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
    const l = Math.hypot(n[0], n[1], n[2]) || 1; n = n.map((q) => q / l); if (n[2] < 0) n = n.map((q) => -q);
    pos.push(...a, ...b, ...c); nor.push(...n, ...n, ...n); pt.push(part, ta, part, tb, part, tc);
  };
  tri(N, W, C, 0); tri(W, S, C, 0); tri(N, C, E, 0); tri(C, S, E, 0);
  if (big) tri([0, -0.82, 0], [-0.27, -1.3, 0], [0.27, -1.3, 0], 1); else tri([0, -0.84, 0], [-0.2, -1.2, 0], [0.2, -1.2, 0], 1);
  const tw = big ? 0.085 : 0.06;
  for (let k = 0; k < segs; k++) {
    const t0 = k / segs, t1 = (k + 1) / segs, w0 = tw - tw * 0.5 * t0, w1 = tw - tw * 0.5 * t1;
    tri([-w0, t0, 0], [w0, t0, 0], [w1, t1, 0], 2, t0, t0, t1);
    tri([-w0, t0, 0], [w1, t1, 0], [-w1, t1, 0], 2, t0, t1, t1);
  }
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('aN', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('aPT', new THREE.Float32BufferAttribute(pt, 2));
  return g;
}
function lineGeometry(segs) {
  const pos = [], idx = [];
  for (let k = 0; k <= segs; k++) { pos.push(k / segs, -1, 0, k / segs, 1, 0); if (k < segs) { const a = k * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } }
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx);
  return g;
}

// ================================================================= buildHero
export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng.fork ? ctx.rng.fork('kite-sky') : ctx.rng;
  const pal = (opts.palette && opts.palette.length >= 7 ? opts.palette : DEF_PAL).map(lin);
  const detail = ctx.quality?.detail ?? 1;
  const root = new THREE.Group(); root.name = 'thousand-kite-roofs-hero';
  const FIELD = 500, PITCH = 12;
  const gridSeed = rng.int(1, 9999);

  // ---- plot grid shared by the default roof heights and the stage
  const plot = (x, z) => {
    const i = Math.floor(x / PITCH), j = Math.floor(z / PITCH);
    return { i, j, h: 9 + 6 * h2(i, j, gridSeed), cx: (i + 0.5) * PITCH, cz: (j + 0.5) * PITCH };
  };
  const roofY = typeof opts.roofY === 'function' ? opts.roofY : (x, z) => plot(x, z).h;

  // ---- lighting uniforms (own-lit paper, lines and stage)
  const sunDir = toV3(opts.sunDir || [-0.91, 0.37, -0.16]).normalize();
  const U = {
    uTime: { value: 0 }, uCutAt: { value: 0 }, uCutClock: { value: -1 }, uPx: { value: 2 / (1.73 * 1080) },
    uGust: { value: 0.3 }, uCam: { value: V3(0, 60, 400) }, uGrow: { value: 220 }, uLamp: { value: opts.lamp ?? 0 }, uTanH: { value: 0.6 },
    uSunDir: { value: sunDir },
    uSun: { value: lin(opts.sunColor || '#FFE9C4').multiplyScalar((opts.sunIntensity ?? 3.6) / Math.PI) },
    uSky: { value: lin(opts.skyColor || '#9CC4EE').multiplyScalar((opts.hemiIntensity ?? 1.9) / Math.PI) },
    uGnd: { value: lin(opts.groundColor || '#D9B48C').multiplyScalar((opts.hemiIntensity ?? 1.9) / Math.PI) },
  };
  const mkMat = (vs, fs, extra = {}, params = {}) => new THREE.ShaderMaterial({
    uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...U, ...extra },
    vertexShader: vs, fragmentShader: fs, fog: true, side: THREE.DoubleSide, ...params,
  });

  // ---- the ring and the train: frames and curves
  const TILT = (opts.ringTilt ?? 35) * Math.PI / 180;
  const C = V3(-20, opts.ringY ?? 96, -405);
  const dN = V3(0, Math.sin(TILT), -Math.cos(TILT));       // direction of flight through the hoop
  const uR = V3(0, Math.cos(TILT), Math.sin(TILT));        // in-plane up
  const xR = V3(1, 0, 0);
  const ringPt = (r, a, back = 0) => C.clone().addScaledVector(xR, r * Math.cos(a)).addScaledVector(uR, r * Math.sin(a)).addScaledVector(dN, back);
  const R_OUT = 10, R_IN = 7.4;
  const T0 = V3(-20, roofY(-20, -170) + 3.4, -170), T1 = ringPt(R_OUT, -Math.PI / 2);
  const TL = T0.z - T1.z, s0 = 0.05, sEnd = Math.tan(TILT);
  const pw = (sEnd - s0) / Math.max((T1.y - T0.y) / TL - s0, 0.05);     // exponent + 1
  const trainAt = (s, out = V3()) => out.set(-20, T0.y + s0 * s * TL + (sEnd - s0) * TL * Math.pow(s, pw) / pw, T0.z - s * TL);
  const trainTan = (s, out = V3()) => out.set(0, s0 + (sEnd - s0) * Math.pow(s, pw - 1), -1).normalize();
  const trainCurve = []; for (let i = 0; i <= 32; i++) trainCurve.push(trainAt(i / 32));
  // finale camera line: 7 m above the train, then straight into the hoop
  const flyThrough = [];
  const straight0 = C.clone().addScaledVector(dN, -60);
  for (let i = 0; i <= 12; i++) {
    const s = i / 12 * 0.8, p = trainAt(s), t = trainTan(s);
    p.y += 7 * -t.z; p.z += 7 * t.y;
    if (p.z > straight0.z + 8) flyThrough.push(p);
  }
  flyThrough.push(straight0, C.clone().addScaledVector(dN, -30), C.clone(), C.clone().addScaledVector(dN, 30));
  const pathDefault = [[0, 14.5, 350], [0, 14.5, 290], [-4, 30, 262], [-12, 52, 236], [-24, 78, 198], [-30, 91, 170], [-31, 90, 125],
    [-29, 90, 80], [-27, 72, 42], [-25, 48, 5], [-22, 26, -35], [-20, 14.5, -70], [-20, 13.5, -150]].map(toV3).concat(flyThrough);
  const toLocal = (v) => V3(v.z, v.y, 350 - v.x), toWorld = (v) => V3(350 - v.z, v.y, v.x);
  // opts.pathFn({ flyThrough, toLocal, toWorld }) may return the real camera path once the finale line is known
  const pathIn = opts.pathFn ? opts.pathFn({ flyThrough, toLocal, toWorld }) : opts.path;
  const path = pathIn ? pathIn.map(toV3).map((v) => (opts.pathSpace === 'world' ? toLocal(v) : v)) : pathDefault;

  // ---- paper colours
  const saffron = lin('#F59A12'), lime = lin('#8FD033'), turq = lin('#17B3B9'), white = pal[0].clone().multiplyScalar(0.9);
  const magenta = pal[5], red = pal[6], black = lin('#4A1F5C'), indigo = lin('#2B2E7A');
  const papers = [magenta, saffron, lime, turq, white, red, pal[1], pal[3], black, indigo];
  const scheme = opts.scheme || rng.pick(['all', 'all', 'magenta-saffron', 'turquoise-white']);
  const wts = scheme === 'magenta-saffron' ? [7, 6, 1.2, 1, 2, 2, 1.5, 0.5, 0.3, 0.3]
    : scheme === 'turquoise-white' ? [1.2, 1.5, 1.5, 7, 6, 1, 0.6, 2, 0.3, 0.6] : [4, 3.5, 3, 3, 3, 2.2, 1, 1, 0.4, 0.5];
  const wSum = wts.reduce((a, b) => a + b, 0);
  let R = rng;                  // the stream the placing draws from: the sky's own, or the extra flights' (see below)
  const pickPaper = () => { let r = R() * wSum; for (let i = 0; i < wts.length; i++) { r -= wts[i]; if (r <= 0) return papers[i]; } return papers[0]; };

  // ---- place the kites
  const N = Math.max(opts.minCount ?? 2500, Math.round((opts.count ?? rng.int(4300, 5200)) * detail));
  const fixedIn = Array.isArray(opts.fixed) ? opts.fixed : [];
  const nFar = Math.round((opts.farKites ?? 0) * Math.min(1, detail + 0.2)), nBey = Math.round((opts.beyondKites ?? 0) * detail), NALL = N + nFar + nBey + fixedIn.length;
  const nCut = Math.round(N * 0.023), nEsc = Math.min(460, Math.max(300, Math.round(N * 0.095))), nGreat = opts.greatCut ? Math.min(300, Math.round(N * 0.15)) : 0;
  const nHeroEsc = Math.min(opts.heroEscorts ?? 36, Math.round(N * 0.05));
  const nPathEsc = Math.min(opts.pathEscorts ?? 70, Math.round(N * 0.06)), nMid = Math.min(opts.midKites ?? 240, Math.round(N * 0.1)), nHalo = Math.min(opts.ringHalo ?? 70, Math.round(N * 0.05));
  const iA = new Float32Array(NALL * 3), iL = new Float32Array(NALL * 4), iP = new Float32Array(NALL * 4), iM = new Float32Array(NALL * 2);
  const iC1 = new Float32Array(NALL * 3), iC2 = new Float32Array(NALL * 3), iPat = new Float32Array(NALL);
  const windAz = (opts.windLean ?? rng.range(-0.1, 0.1));
  const elMean0 = rng.range(0.82, 0.98), elMean = opts.elevation ?? elMean0;
  let placed = 0;
  const meanY = opts.meanY ?? 80;
  const sight = [path[0], C];
  // returns true when kite K (mean position) with the given swing is legal, and writes instance `placed`
  let limX = FIELD + 4, limZ = FIELD + 4, noAnchor = null;
  const fixA = typeof opts.anchorFix === 'function' ? opts.anchorFix : null;
  const tryPlace = (kx, ky, kz, size, ampAz, ampEl, mode, maxEnv = 0) => {
    const el0 = clamp(elMean + R.gauss() * 0.14, Math.min(0.6, elMean - 0.08), 1.25), az0 = windAz + R.gauss() * 0.16;
    const hd = (ky - 13) / Math.tan(el0);
    let ax = kx - hd * Math.sin(az0), az_ = kz + hd * Math.cos(az0);
    if (Math.abs(ax) > limX || az_ > FIELD + 4 || az_ < -limZ) return false;
    if (noAnchor && noAnchor(ax, az_)) return false;
    if (fixA) { const f = fixA(ax, az_); ax = f[0]; az_ = f[1]; }       // the world moves a roof end in from the lane to where a flyer can stand
    let ay = roofY(ax, az_) + 1.3;
    const hsh = R();
    const dx = kx - ax, dz = kz - az_;
    if (mode === 1) {                       // cut kite: iA.y is the roof it will settle on
      const fall = 3.0 + 1.8 * hsh, spd = 4.5 + 3 * hsh, tl = (ky - 12) / fall;
      ay = roofY(kx, kz - spd * tl) + 0.2;
      for (let t = 0; t <= tl; t += 2.5) {
        const py = ky - fall * t, pz = kz - spd * t;
        if (distPoly(kx, py, pz, path) < 16 || Math.hypot(kx - C.x, py - C.y, pz - C.z) < 45 || distPoly(kx, py, pz, trainCurve) < 12) return false;
      }
    }
    const dy = ky - ay, len = Math.hypot(dx, dy, dz);
    if (maxEnv) { const sc = Math.min(1, maxEnv / (len * Math.hypot(2.75 * ampAz, 4.9 * ampEl))); ampAz *= sc; ampEl *= sc; }
    const env = len * Math.hypot(2.75 * ampAz, 4.9 * ampEl) + size * 1.5;
    if (Math.hypot(kx - C.x, ky - C.y, kz - C.z) < 60 + env) return false;
    if (distPoly(kx, ky, kz, sight) < 22) return false;          // the ring must read from the entry: a clear sight corridor
    if (mode !== 1) for (let q = 1; q <= 10; q++) {
      const f = q / 10, px = ax + dx * f, py = ay + dy * f, pz = az_ + dz * f, m = env * f + 0.03 * len * 4 * f * (1 - f);
      if (distPoly(px, py, pz, path) < 6.5 + m) return false;
      if (Math.hypot(px - C.x, py - C.y, pz - C.z) < 26 + m) return false;
      if (distPoly(px, py, pz, trainCurve) < 5 + m) return false;
      if (py < 52 && Math.abs(pz + 180) < 6 + m && (Math.abs(px + 32) < 6 + m || Math.abs(px + 8) < 6 + m)) return false;      // the twin minarets
    }
    const k = placed++;
    iA[k * 3] = ax; iA[k * 3 + 1] = ay; iA[k * 3 + 2] = az_;
    iL[k * 4] = Math.atan2(dx, -dz); iL[k * 4 + 1] = Math.asin(clamp(dy / len, -1, 1)); iL[k * 4 + 2] = len; iL[k * 4 + 3] = size;
    iP[k * 4] = R.range(0, 6.283); iP[k * 4 + 1] = R.range(0.5, 1.5); iP[k * 4 + 2] = ampAz; iP[k * 4 + 3] = ampEl;
    iM[k * 2] = mode; iM[k * 2 + 1] = hsh;
    const c1 = pickPaper(); let c2 = R.chance(0.3) ? white : pickPaper(); if (c2 === c1) c2 = c1 === white ? magenta : white;
    iC1.set([c1.r, c1.g, c1.b], k * 3); iC2.set([c2.r, c2.g, c2.b], k * 3);
    iPat[k] = R.pick([0, 0, 1, 1, 2, 3, 3, 4, 4, 5, 6]);
    return true;
  };
  // composed kites (opts.fixed): placed by the world, kite and roof end given outright, to make a subject of a view:
  // a fan from one roof, a ladder of seven on one line, a duelling pair. They draw nothing from the random stream and
  // come first in the instance list (great kites, with the long banded tail). The same clearances hold: a kite or
  // line that would come within 6.5 m of the route, or foul the hoop or the train, is left out (fixedPlaced says which).
  const fixedPlaced = [];
  const placeFixed = (f) => {
    const cv = (p) => { const v = toV3(p); return opts.pathSpace === 'world' ? toLocal(v) : v; };
    const Af = cv(f.a), Kf = cv(f.k), size = f.size ?? 2.2;
    const dx = Kf.x - Af.x, dy = Kf.y - Af.y, dz = Kf.z - Af.z, len = Math.hypot(dx, dy, dz);
    if (len < 4 || dy / len < 0.16) return false;
    let ampAz = f.ampAz ?? 0.03, ampEl = f.ampEl ?? 0.008;
    const room = Math.max(Math.min(distPoly(Kf.x, Kf.y, Kf.z, path) - 7.0 - size * 1.5, f.maxEnv ?? 99), 0.4);
    const sc = Math.min(1, room / (len * Math.hypot(2.75 * ampAz, 4.9 * ampEl))); ampAz *= sc; ampEl *= sc;
    const env = len * Math.hypot(2.75 * ampAz, 4.9 * ampEl) + size * 1.5;
    for (let q = 1; q <= 10; q++) {
      const g = q / 10, px = Af.x + dx * g, py = Af.y + dy * g, pz = Af.z + dz * g, m = env * g + 0.03 * len * 4 * g * (1 - g);
      if (distPoly(px, py, pz, path) < 6.5 + m) return false;
      if (Math.hypot(px - C.x, py - C.y, pz - C.z) < 26 + m) return false;
      if (distPoly(px, py, pz, trainCurve) < 5 + m) return false;
    }
    const k = placed++;
    iA[k * 3] = Af.x; iA[k * 3 + 1] = Af.y; iA[k * 3 + 2] = Af.z;
    iL[k * 4] = Math.atan2(dx, -dz); iL[k * 4 + 1] = Math.asin(clamp(dy / len, -1, 1)); iL[k * 4 + 2] = len; iL[k * 4 + 3] = size;
    iP[k * 4] = f.phase ?? (k * 2.399) % 6.283; iP[k * 4 + 1] = f.speed ?? 0.9; iP[k * 4 + 2] = ampAz; iP[k * 4 + 3] = ampEl;
    iM[k * 2] = 0; iM[k * 2 + 1] = f.hash ?? 0.2;
    const c1 = lin(f.c1 || '#F59A12'), c2 = lin(f.c2 || '#F6E9D2');
    iC1.set([c1.r, c1.g, c1.b], k * 3); iC2.set([c2.r, c2.g, c2.b], k * 3);
    iPat[k] = f.pat ?? 6;
    return true;
  };
  for (const f of fixedIn) fixedPlaced.push(placeFixed(f));
  // escorts: beside the high parts of the path, so the camera is inside the paper
  const hi = [], whole = []; let acc = 0;
  for (let i = 0; i < path.length - 1; i++) {
    const a = path[i], b = path[i + 1], l = a.distanceTo(b);
    for (let d = acc; d < l; d += 3) { const p = a.clone().lerp(b, d / l), smp = { p, t: b.clone().sub(a).normalize() };
      if (p.y > 36 && p.distanceTo(C) > 110 && p.z > -150) hi.push(smp);
      if (p.distanceTo(C) > 34) whole.push(smp); }
    acc = (acc - l) % 3; if (acc < 0) acc += 3;
  }
  const side = V3(), upv = V3();
  // the great kites: hung beside and above the WHOLE route (the fall, the skim and the last climb too), evenly in path
  // length, so there is large patterned paper in the frame wherever the camera is. They come first in the instance
  // list: the first nBig kites are drawn by a second mesh with a longer, banded tail.
  for (let e = 0; whole.length && e < nPathEsc; e++) {
    for (let tr = 0; tr < 14; tr++) {
      const h = whole[Math.min(whole.length - 1, Math.floor((e + rng()) / nPathEsc * whole.length))], sz = rng.range(1.8, 2.6) * (h.p.z < -185 ? (opts.finaleScale ?? 1) : 1), sg = rng.chance(0.5) ? 1 : -1;
      side.crossVectors(h.t, V3(0, 1, 0)).normalize(); upv.crossVectors(side, h.t);
      let kx, ky, kz, r;
      if (h.p.y < 30) {                                    // low over the roofs: 10 to 25 m above the row, never dead ahead
        const lat = sg * rng.range(7.5, 17), up = rng.range(10, 25); r = Math.hypot(lat, up);
        kx = h.p.x + side.x * lat; ky = h.p.y + up; kz = h.p.z + side.z * lat;
      } else {
        r = rng.range(12, 19) + tr * 0.5; const th = rng.range(-0.3, 1.15), cl = Math.max(Math.cos(th), 7.5 / r) * sg, sl = Math.sin(th);
        kx = h.p.x + r * (cl * side.x + sl * upv.x); ky = h.p.y + r * (cl * side.y + sl * upv.y); kz = h.p.z + r * (cl * side.z + sl * upv.z);
      }
      if (ky < 23) continue;
      if (tryPlace(kx, ky, kz, sz, rng.range(0.03, 0.06), rng.range(0.008, 0.016), 0, Math.max(r - 7.0 - sz * 1.5, 0.6))) break;
    }
    if ((e & 7) === 7) await ctx.yield?.();
  }
  for (let e = 0; whole.length && e < nMid; e++) {
    for (let tr = 0; tr < 8; tr++) {
      const h = whole[Math.min(whole.length - 1, Math.floor((e + rng()) / nMid * whole.length))], sz = rng.range(1.3, 1.9), r = 25 + 55 * Math.pow(rng(), 1.4);
      const th = rng.range(-0.35, Math.PI + 0.35);
      side.crossVectors(h.t, V3(0, 1, 0)).normalize(); upv.crossVectors(side, h.t);
      const kx = h.p.x + r * (Math.cos(th) * side.x + Math.sin(th) * upv.x) + h.t.x * rng.range(-3, 3), ky = h.p.y + r * (Math.cos(th) * side.y + Math.sin(th) * upv.y * 0.8), kz = h.p.z + r * (Math.cos(th) * side.z + Math.sin(th) * upv.z) + h.t.z * rng.range(-3, 3);
      if (ky < 27) continue;
      if (tryPlace(kx, ky, kz, sz, rng.range(0.025, 0.07), rng.range(0.008, 0.02), 0, Math.max(r - 8 - sz * 1.5, 1))) break;
    }
    if ((e & 15) === 15) await ctx.yield?.();
  }
  // a wreath of large kites round the hoop, outside its clear bubble, so the last approach is not into an empty sky
  for (let e = 0, guard = 0; e < nHalo && guard < nHalo * 14; guard++) {
    const a = rng.range(-0.5, Math.PI + 0.5), fwd = rng.range(-25, 200), rr = rng.range(64, 125) + Math.max(fwd - 85, 0) * 0.25, sz = rng.range(1.5, 2.4) * (1 + Math.max(fwd - 60, 0) / 200);
    const kx = C.x + xR.x * Math.cos(a) * rr + dN.x * fwd, ky = C.y + uR.y * Math.sin(a) * rr * 0.8 + dN.y * fwd * 0.6, kz = C.z + uR.z * Math.sin(a) * rr + dN.z * fwd;
    if (ky < 40 || ky > 215) continue;
    if (tryPlace(kx, ky, kz, sz, rng.range(0.02, 0.05), rng.range(0.006, 0.014), 0, 9)) e++;
  }
  const nBig = placed;
  await ctx.yield?.();
  for (let e = 0, guard = 0; hi.length && e < nEsc && guard < nEsc * 12; guard++) {
    if ((guard & 31) === 31) await ctx.yield?.();
    const h = rng.pick(hi), th = rng.range(0, 6.283), r = 8.8 + 31 * Math.pow(rng(), 1.3), sz = rng.range(0.75, 0.98);
    side.crossVectors(h.t, V3(0, 1, 0)).normalize(); upv.crossVectors(side, h.t);
    const kx = h.p.x + r * (Math.cos(th) * side.x + Math.sin(th) * upv.x) + h.t.x * rng.range(-2, 2);
    const ky = h.p.y + r * (Math.cos(th) * side.y + Math.sin(th) * upv.y * 0.8);
    const kz = h.p.z + r * (Math.cos(th) * side.z + Math.sin(th) * upv.z) + h.t.z * rng.range(-2, 2);
    if (ky < 30) continue;
    if (tryPlace(kx, ky, kz, sz, rng.range(0.02, 0.05), rng.range(0.005, 0.012), 0, Math.max(r - 6.8 - sz * 1.5, 0.3))) e++;
  }
  // hero escorts: a few big kites close beside and below the climb and the duel, so paper is always large in frame
  const hiNear = hi.filter((h) => h.p.z > 60);
  for (let e = 0, guard = 0; hiNear.length && e < nHeroEsc && guard < nHeroEsc * 40; guard++) {
    const h = hiNear[Math.floor((e + rng()) / nHeroEsc * hiNear.length) % hiNear.length], sz = rng.range(1.3, 1.7), r = rng.range(10.6, 15);
    const x0 = rng.range(-1.0, 0.3), th = rng.chance(0.5) ? x0 : Math.PI - x0;
    side.crossVectors(h.t, V3(0, 1, 0)).normalize(); upv.crossVectors(side, h.t);
    const kx = h.p.x + r * (Math.cos(th) * side.x + Math.sin(th) * upv.x), ky = h.p.y + r * (Math.cos(th) * side.y + Math.sin(th) * upv.y), kz = h.p.z + r * (Math.cos(th) * side.z + Math.sin(th) * upv.z);
    if (ky < 30) continue;
    if (tryPlace(kx, ky, kz, sz, rng.range(0.02, 0.04), rng.range(0.005, 0.01), 0, Math.max(r - 6.9 - sz * 1.5, 0.5))) e++;
  }
  const nEscDone = placed;
  await ctx.yield?.();
  for (let guard = 0; placed < N && guard < N * 8; guard++) {
    const left = N - placed, mode = left <= nCut ? 1 : (left <= nCut + nGreat ? 2 : 0);
    const kx = rng.range(-FIELD, FIELD), kz = rng.range(-FIELD - 50, FIELD - 30);
    const ky = clamp(meanY + rng.gauss() * 26 * meanY / 80, 30, 150);
    const big = rng.chance(0.12);
    tryPlace(kx, ky, kz, big ? rng.range(1.25, 1.7) : rng.range(0.8, 1.15), rng.range(0.018, 0.085), rng.range(0.006, 0.028), mode);
    if ((guard & 255) === 255) await ctx.yield?.();
  }
  const NK0 = placed;
  // ---- two more flights, placed after everything above and from their own stream, so the sky above is the same with
  // or without them: very large kites at middle distance round the high part of the route (the sky between the near
  // paper and the far specks), and the kites of the roofs downwind of the hoop, out over the river and its far bank
  if (nFar || nBey) {
    R = makeRng(hashSeed('kite-sky-more:' + gridSeed));
    for (let e = 0, guard = 0; hi.length && e < nFar && guard < nFar * 14; guard++) {
      if ((guard & 15) === 15) await ctx.yield?.();
      const h = hi[Math.floor((e + R()) / nFar * hi.length) % hi.length], r = R.range(70, 250), th = R.range(-0.25, Math.PI + 0.25), sz = R.range(2.8, 4.6), fwd = R.range(-40, 130);
      side.crossVectors(h.t, V3(0, 1, 0)).normalize();
      const kx = h.p.x + r * Math.cos(th) * side.x + h.t.x * fwd, kz = h.p.z + r * Math.cos(th) * side.z + h.t.z * fwd;
      const ky = clamp(h.p.y * 0.6 + 30 + r * Math.sin(th) * 0.45 + R.range(-10, 25), 42, 175);
      if (distPoly(kx, ky, kz, path) < 58) continue;
      if (tryPlace(kx, ky, kz, sz, R.range(0.012, 0.03), R.range(0.004, 0.01), 0)) e++;
    }
    await ctx.yield?.();
    const bey = opts.beyond || {}, reach = bey.reach ?? FIELD + 400;
    limX = bey.halfX ?? FIELD + 150; limZ = reach; noAnchor = bey.noAnchor || null;
    for (let e = 0, guard = 0; e < nBey && guard < nBey * 10; guard++) {
      if ((guard & 31) === 31) await ctx.yield?.();
      const kx = R.range(-limX, limX), kz = -R.range(FIELD + 10, reach - 20), ky = clamp(meanY + R.gauss() * 26 * meanY / 80, 30, 150), big = R.chance(0.3);
      if (tryPlace(kx, ky, kz, big ? R.range(2.2, 4.2) : R.range(0.9, 1.5), R.range(0.018, 0.07), R.range(0.006, 0.022), 0)) e++;
    }
    limX = limZ = FIELD + 4; noAnchor = null; R = rng;
  }
  const NK = placed;
  // ---- sight lines kept clear of the scattered field (opts.clearLanes): a kite whose mean place lies inside one of the
  // capsules is given size 0, which hides it and its line. Nothing is drawn from the random stream and no instance
  // moves, so the rest of the sky is as it was; the kites placed beside the route (all before nEscDone) are never taken.
  let nCleared = 0;
  if (Array.isArray(opts.clearLanes) && opts.clearLanes.length) {
    const lanes = opts.clearLanes.map((l) => { const cvp = (q) => { const v = toV3(q); return opts.pathSpace === 'world' ? toLocal(v) : v; }; return { a: cvp(l.a), b: cvp(l.b), r0: l.r0 ?? 12, r1: l.r1 ?? l.r0 ?? 12 }; });
    for (let k = nEscDone; k < NK; k++) {
      if ((k & 1023) === 1023) await ctx.yield?.();
      const az = iL[k * 4], el = iL[k * 4 + 1], len = iL[k * 4 + 2], ce = Math.cos(el);
      const kx = iA[k * 3] + len * Math.sin(az) * ce, ky = iA[k * 3 + 1] + len * Math.sin(el), kz = iA[k * 3 + 2] - len * Math.cos(az) * ce;
      for (const l of lanes) {
        const dx = l.b.x - l.a.x, dy = l.b.y - l.a.y, dz = l.b.z - l.a.z, t = clamp(((kx - l.a.x) * dx + (ky - l.a.y) * dy + (kz - l.a.z) * dz) / (dx * dx + dy * dy + dz * dz || 1e-6), 0, 1);
        if (Math.hypot(l.a.x + dx * t - kx, l.a.y + dy * t - ky, l.a.z + dz * t - kz) < lerp(l.r0, l.r1, t)) { iL[k * 4 + 3] = 0; nCleared++; break; }
      }
    }
  }

  // ---- kites and their lines: two instanced draws sharing the same per-kite attributes
  const ib = (arr, n) => new THREE.InstancedBufferAttribute(arr, n);
  const shared = { iA: ib(iA, 3), iL: ib(iL, 4), iP: ib(iP, 4), iM: ib(iM, 2), iC1: ib(iC1, 3) };
  // the field: every kite after the first nBig (views into the same arrays, so no instance is drawn twice)
  const kiteMat = mkMat(KITE_VERT, KITE_FRAG);
  const kg = kiteGeometry(); kg.instanceCount = NK - nBig;
  const tail = (arr, n) => ib(arr.subarray(nBig * n, NK * n), n), head = (arr, n) => ib(arr.subarray(0, Math.max(nBig, 1) * n), n);
  kg.setAttribute('iA', tail(iA, 3)); kg.setAttribute('iL', tail(iL, 4)); kg.setAttribute('iP', tail(iP, 4)); kg.setAttribute('iM', tail(iM, 2));
  kg.setAttribute('iC1', tail(iC1, 3)); kg.setAttribute('iC2', tail(iC2, 3)); kg.setAttribute('iPat', tail(iPat, 1));
  const kites = new THREE.Mesh(kg, kiteMat); kites.frustumCulled = false; kites.name = 'kites'; root.add(kites);
  await ctx.yield?.();
  // the great kites near the route: the same paper, a fringed tassel and a six-band ribbon tail
  const bgk = kiteGeometry(6, true); bgk.instanceCount = nBig;
  bgk.setAttribute('iA', head(iA, 3)); bgk.setAttribute('iL', head(iL, 4)); bgk.setAttribute('iP', head(iP, 4)); bgk.setAttribute('iM', head(iM, 2));
  bgk.setAttribute('iC1', head(iC1, 3)); bgk.setAttribute('iC2', head(iC2, 3)); bgk.setAttribute('iPat', head(iPat, 1));
  const bigKites = new THREE.Mesh(bgk, kiteMat); bigKites.frustumCulled = false; bigKites.name = 'great-kites'; bigKites.visible = nBig > 0; root.add(bigKites);
  let nLined = NK0; while (nLined > 0 && iM[(nLined - 1) * 2] === 1) nLined--;
  const lg = lineGeometry(3); lg.instanceCount = NK > NK0 ? NK : nLined;      // (the cut kites between the two flights hide their own lines)
  for (const k in shared) lg.setAttribute(k, shared[k]);
  const lines = new THREE.Mesh(lg, mkMat(lineVert(false), LINE_FRAG, { uLineW: { value: 0.03 }, uAFloor: { value: opts.lineOpacity ?? 0.45 }, uBigA: { value: opts.bigLineOpacity ?? 0.6 } }, { transparent: true, depthWrite: false }));
  lines.frustumCulled = false; lines.renderOrder = 3; lines.name = 'kite-lines'; root.add(lines);
  await ctx.yield?.();

  // ---- the red train: 300 kites on one line
  const NT = 300, tA = new Float32Array(NT * 3), tL = new Float32Array(NT * 4), tP = new Float32Array(NT * 4), tM = new Float32Array(NT * 2);
  const tC1 = new Float32Array(NT * 3), tC2 = new Float32Array(NT * 3), tPat = new Float32Array(NT), tv = V3(), tc = new THREE.Color();
  const trim = red.clone().lerp(saffron, 0.8), crimson = lin('#9E0F22'), vermilion = lin('#F2501E'), cream0 = pal[0].clone().multiplyScalar(0.9);
  for (let i = 0; i < NT; i++) {
    const s = 0.012 + 0.976 * i / (NT - 1);
    trainAt(s, tv); tA.set([tv.x, tv.y, tv.z], i * 3); trainTan(s, tv); tL.set([tv.x, tv.y, tv.z, 0], i * 4);
    tP.set([s, 0.62 + 0.1 * rng(), 0, 0], i * 4); tM.set([0, rng()], i * 2);
    const tk = rng.range(0.7, 1.15), hk = rng();
    tc.copy(red).lerp(hk < 0.5 ? crimson : vermilion, Math.abs(hk - 0.5) * 1.1).multiplyScalar(tk); tC1.set([tc.r, tc.g, tc.b], i * 3);
    if (i % 5 === 2) tC2.set([cream0.r, cream0.g, cream0.b], i * 3); else tC2.set([trim.r * tk, trim.g * tk, trim.b * tk], i * 3);   // a thin saffron border on every kite, every fifth one cream
    tPat[i] = i % 25 === 12 ? 6 : 0;
  }
  const tg = kiteGeometry(); tg.instanceCount = NT;
  tg.setAttribute('iA', ib(tA, 3)); tg.setAttribute('iL', ib(tL, 4)); tg.setAttribute('iP', ib(tP, 4)); tg.setAttribute('iM', ib(tM, 2));
  tg.setAttribute('iC1', ib(tC1, 3)); tg.setAttribute('iC2', ib(tC2, 3)); tg.setAttribute('iPat', ib(tPat, 1));
  const train = new THREE.Mesh(tg, mkMat(KITE_VERT, KITE_FRAG, {}, { defines: { TRAIN: 1 } })); train.frustumCulled = false; train.name = 'red-train'; root.add(train);
  await ctx.yield?.();

  // ---- the ring's twelve stays and the train line: static ribbons
  const SL = { pos: [], tan: [], sw: [], col: [], idx: [] };
  const strip = (pts, kind, col) => {
    const base = SL.pos.length / 3, n = pts.length;
    for (let i = 0; i < n; i++) {
      const p = pts[i], t = tv.subVectors(pts[Math.min(i + 1, n - 1)], pts[Math.max(i - 1, 0)]).normalize();
      for (const sd of [-1, 1]) { SL.pos.push(p.x, p.y, p.z); SL.tan.push(t.x, t.y, t.z); SL.sw.push(sd, i / (n - 1), kind); SL.col.push(col.r, col.g, col.b); }
      if (i < n - 1) { const a = base + i * 2; SL.idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
    }
  };
  const tl = []; for (let i = 0; i <= 120; i++) tl.push(trainAt(i / 120));
  strip(tl, 0, pal[1].clone().lerp(red, 0.35));
  const ringLineAnchors = [], stays = [];
  for (let k = 0; k < 12; k++) {
    const sgn = k < 6 ? 1 : -1, j = k % 6;
    const phi = sgn * (22 + 18 * j + rng.range(-4, 4)) * Math.PI / 180, dist = rng.range(150, 250) - j * 8;
    const pc = plot(C.x + dist * Math.sin(phi), C.z + dist * Math.cos(phi));
    const ax = opts.roofY ? C.x + dist * Math.sin(phi) : pc.cx, az = opts.roofY ? C.z + dist * Math.cos(phi) : pc.cz;
    const A = V3(ax, roofY(ax, az) + 2.7, az); ringLineAnchors.push(A);
    const a = lerp(-0.9, 1.0, j / 5), att = ringPt(R_OUT, sgn > 0 ? a : Math.PI - a);
    const len = att.distanceTo(A), pts = [];
    for (let i = 0; i <= 28; i++) { const f = i / 28, p = att.clone().lerp(A, f); p.y -= 0.035 * len * 4 * f * (1 - f) * (0.6 + 0.4 * f); pts.push(p); }
    stays.push(pts); strip(pts, 1 + k * 0.37, white);
  }
  const sg = new THREE.BufferGeometry();
  sg.setAttribute('position', new THREE.Float32BufferAttribute(SL.pos, 3)); sg.setAttribute('aTan', new THREE.Float32BufferAttribute(SL.tan, 3));
  sg.setAttribute('aSW', new THREE.Float32BufferAttribute(SL.sw, 3)); sg.setAttribute('aCol', new THREE.Float32BufferAttribute(SL.col, 3)); sg.setIndex(SL.idx);
  const stayMesh = new THREE.Mesh(sg, mkMat(lineVert(true), LINE_FRAG, { uLineW: { value: 0.16 }, uAFloor: { value: 1.3 }, uBigA: { value: 0 } }, { defines: { STATIC_LINE: 1 }, transparent: true, depthWrite: false }));
  stayMesh.frustumCulled = false; stayMesh.renderOrder = 4; stayMesh.name = 'stays'; root.add(stayMesh);
  await ctx.yield?.();

  // ---- bamboo: hoop, inner hoop, spokes, stay tripods, the train's winch (one lit mesh)
  const W = { pos: [], nor: [], col: [], idx: [] };
  const tube = (frames, sides, radFn, colFn, closed) => {
    const base = W.pos.length / 3, n = frames.length;
    for (let i = 0; i < n; i++) {
      const f = frames[i], r = radFn(i), c = colFn(i);
      for (let j = 0; j < sides; j++) {
        const b = j / sides * 6.2832, cb = Math.cos(b), sb = Math.sin(b);
        const nx = f.a.x * cb + f.b.x * sb, ny = f.a.y * cb + f.b.y * sb, nz = f.a.z * cb + f.b.z * sb, sh = 0.85 + 0.15 * cb;
        W.pos.push(f.p.x + nx * r, f.p.y + ny * r, f.p.z + nz * r); W.nor.push(nx, ny, nz); W.col.push(c.r * sh, c.g * sh, c.b * sh);
      }
    }
    for (let i = 0; i < (closed ? n : n - 1); i++) for (let j = 0; j < sides; j++) {
      const i2 = (i + 1) % n, j2 = (j + 1) % sides, a = base + i * sides + j, b = base + i2 * sides + j, c = base + i2 * sides + j2, d = base + i * sides + j2;
      W.idx.push(a, b, c, a, c, d);
    }
  };
  const rod = (p0, p1, r0, r1, sides, c0, c1 = c0, rings = 2) => {
    const t = V3().subVectors(p1, p0).normalize(), a = V3().crossVectors(t, Math.abs(t.y) > 0.9 ? V3(1, 0, 0) : V3(0, 1, 0)).normalize(), b = V3().crossVectors(t, a);
    const fr = []; for (let i = 0; i < rings; i++) fr.push({ p: p0.clone().lerp(p1, i / (rings - 1)), a, b });
    tube(fr, sides, (i) => lerp(r0, r1, i / (rings - 1)) * (rings > 2 && i % 2 ? 1.12 : 1), (i) => (i % 2 ? c1 : c0), false);
  };
  const bamboo = lin('#C9A55C'), bambooDk = lin('#7A5A2C'), lash = red.clone().multiplyScalar(0.8), bc = new THREE.Color();
  const hoop = (R, segs, sides, rad, back) => {
    const fr = [];
    for (let i = 0; i < segs; i++) { const a = i / segs * 6.2832; fr.push({ p: ringPt(R, a, back), a: V3().addScaledVector(xR, Math.cos(a)).addScaledVector(uR, Math.sin(a)), b: dN }); }
    const hv = fr.map(() => rng());
    tube(fr, sides, (i) => rad * (i % 6 === 0 ? 1.3 : (i % 6 === 3 ? 0.92 : 1)),
      (i) => (i % 12 === 0 ? lash : bc.copy(i % 6 === 0 ? bambooDk : bamboo).multiplyScalar(0.8 + 0.3 * hv[i - (i % 6)]).clone()), true);
  };
  hoop(R_OUT, 120, 7, 0.2, 0); hoop(R_OUT - 0.32, 120, 5, 0.12, 0.26); hoop(R_IN, 96, 6, 0.13, 0);
  for (let i = 0; i < 24; i++) { const a = (i + 0.5) / 24 * 6.2832; rod(ringPt(R_IN, a), ringPt(R_OUT, a), 0.07, 0.055, 5, bamboo, bambooDk, 4); }
  const tripod = (top, legR, legr, spoolR, spoolCol) => {
    const base = top.y - (top === T0 ? 3.4 : 2.7), n = top === T0 ? 4 : 3, a0 = rng.range(0, 6.28);
    for (let i = 0; i < n; i++) { const a = a0 + i / n * 6.2832; rod(V3(top.x + Math.cos(a) * legR, base, top.z + Math.sin(a) * legR), V3(top.x - Math.cos(a) * 0.12, top.y + 0.35, top.z - Math.sin(a) * 0.12), legr, legr * 0.8, 5, bambooDk, bamboo, 4); }
    const sp = V3(top.x, base + spoolR + 0.25, top.z);
    rod(V3(sp.x - spoolR * 0.9, sp.y, sp.z), V3(sp.x + spoolR * 0.9, sp.y, sp.z), spoolR, spoolR, 9, spoolCol, spoolCol.clone().multiplyScalar(0.7), 5);
    rod(V3(sp.x - spoolR * 1.5, sp.y, sp.z), V3(sp.x + spoolR * 1.5, sp.y, sp.z), 0.06, 0.06, 5, bambooDk);
    rod(sp, top, 0.03, 0.03, 4, spoolCol);
  };
  tripod(T0, 1.5, 0.11, 0.75, red);
  for (const A of ringLineAnchors) tripod(A, 1.0, 0.07, 0.38, rng.pick([magenta, saffron, pal[1]]));
  await ctx.yield?.();
  const wg = new THREE.BufferGeometry();
  wg.setAttribute('position', new THREE.Float32BufferAttribute(W.pos, 3)); wg.setAttribute('normal', new THREE.Float32BufferAttribute(W.nor, 3));
  wg.setAttribute('color', new THREE.Float32BufferAttribute(W.col, 3)); wg.setIndex(W.idx);
  const wood = new THREE.Mesh(wg, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.75, metalness: 0, side: THREE.DoubleSide }));
  wood.frustumCulled = false; wood.name = 'bamboo'; root.add(wood);
  await ctx.yield?.();

  // ---- paper on the ring: tissue annulus, 48 pennants on the rim, bunting on the stays (one draw)
  const CL = { pos: [], ax: [], fl: [], col: [], uv: [], idx: [] };
  const cv = (p, ax, flex, ph, kind, col, u, v) => { CL.pos.push(p.x, p.y, p.z); CL.ax.push(ax.x, ax.y, ax.z); CL.fl.push(flex, ph, kind); CL.col.push(col.r, col.g, col.b); CL.uv.push(u, v); return CL.pos.length / 3 - 1; };
  const cream = pal[0].clone().multiplyScalar(0.92);
  const panelCols = rng.pick([[red, saffron, red, magenta], [red, saffron, red, cream], [red, magenta, saffron, cream]]);
  for (let i = 0; i < 24; i++) {
    const col = panelCols[i % panelCols.length], ph = rng.range(0, 6.28), ids = [];
    for (let v = 0; v <= 3; v++) for (let u = 0; u <= 3; u++) {
      const a = (i - 0.5 + u / 3) / 24 * 6.2832, r = lerp(R_IN + 0.1, R_OUT - 0.15, v / 3);
      ids.push(cv(ringPt(r, a), dN, Math.sin(Math.PI * u / 3) * Math.sin(Math.PI * v / 3), ph, -1, col, u / 3, v / 3));
    }
    for (let v = 0; v < 3; v++) for (let u = 0; u < 3; u++) { const a = ids[v * 4 + u], b = ids[v * 4 + u + 1], c = ids[v * 4 + u + 5], d = ids[v * 4 + u + 4]; CL.idx.push(a, b, c, a, c, d); }
  }
  const sdir = V3(0, -0.28, -1).normalize(), pennCols = [red, saffron, red, saffron, magenta, red, saffron, cream];
  for (let k = 0; k < 48; k++) {
    const a = (k + 0.25) / 48 * 6.2832, rootP = ringPt(R_OUT + 0.15, a), up01 = 0.5 + 0.5 * Math.sin(a);
    const Lp = rng.range(3.6, 6.4) * (1 - 0.25 * up01), w0 = rng.range(0.55, 0.85), ph = rng.range(0, 6.28), col = pennCols[k % 8];
    const tg_ = V3().addScaledVector(xR, -Math.sin(a)).addScaledVector(uR, Math.cos(a));
    const sd = sdir.clone().addScaledVector(xR, 0.55 * Math.cos(a)).addScaledVector(uR, 0.55 * Math.sin(a)).normalize();
    const wd = tg_.addScaledVector(sd, -tg_.dot(sd)).normalize(), ax = V3().crossVectors(sd, wd).normalize();
    let prev = null;
    for (let s = 0; s <= 6; s++) {
      const t = s / 6, hw = w0 * 0.5 * (1 - t * 0.92), c = rootP.clone().addScaledVector(sd, t * Lp);
      const l = cv(c.clone().addScaledVector(wd, -hw), ax, t, ph, Lp, col, 0, t), r = cv(c.clone().addScaledVector(wd, hw), ax, t, ph, Lp, col, 1, t);
      if (prev) CL.idx.push(prev[0], prev[1], r, prev[0], r, l);
      prev = [l, r];
    }
  }
  for (let k = 0; k < 96; k++) {            // serrated paper fringe round the rim
    const a0 = k / 96 * 6.2832, a1 = (k + 1) / 96 * 6.2832, am = (a0 + a1) / 2, col = [saffron, red, cream, red][k % 4], ph = k * 0.7;
    const tip = ringPt(R_OUT + 1.25, am, -0.35);
    CL.idx.push(cv(ringPt(R_OUT + 0.1, a0), dN, 0, ph, 1.6, col, 0, 0), cv(ringPt(R_OUT + 0.1, a1), dN, 0, ph, 1.6, col, 1, 0), cv(tip, dN, 1, ph, 1.6, col, 0.5, 0.3));
  }
  const buntCols = [red, saffron, cream, magenta, lime, turq];
  stays.forEach((pts, k) => {
    const dir = V3().subVectors(pts[4], pts[0]).normalize(), ax = V3().crossVectors(dir, V3(0, 1, 0)).normalize(), total = pts[0].distanceTo(pts[28]);
    for (let d = 3, n = 0; d < 42; d += 1.7, n++) {
      const f = d / total * 28, i0 = Math.floor(f), p = pts[i0].clone().lerp(pts[i0 + 1], f - i0), q = p.clone().addScaledVector(dir, 0.95), ph = k * 1.3 + n * 0.9, col = buntCols[(n + k) % 6];
      const tip = p.clone().lerp(q, 0.5); tip.y -= 1.15;
      CL.idx.push(cv(p, ax, 0, ph, 1.2, col, 0, 0), cv(q, ax, 0, ph, 1.2, col, 1, 0), cv(tip, ax, 1, ph, 1.2, col, 0.5, 1));
    }
  });
  const cg = new THREE.BufferGeometry();
  cg.setAttribute('position', new THREE.Float32BufferAttribute(CL.pos, 3)); cg.setAttribute('aAx', new THREE.Float32BufferAttribute(CL.ax, 3));
  cg.setAttribute('aFl', new THREE.Float32BufferAttribute(CL.fl, 3)); cg.setAttribute('aCol', new THREE.Float32BufferAttribute(CL.col, 3));
  cg.setAttribute('aUv', new THREE.Float32BufferAttribute(CL.uv, 2)); cg.setIndex(CL.idx);
  const cloth = new THREE.Mesh(cg, mkMat(/* glsl */`
#include <common>
#include <fog_pars_vertex>
uniform float uTime, uGust;
attribute vec3 aAx; attribute vec3 aFl; attribute vec3 aCol; attribute vec2 aUv;
varying vec3 vP; varying vec3 vCol; varying vec3 vAx; varying vec3 vUv;
void main(){
  float fl = aFl.x, ph = aFl.y; vec3 lp = position;
  if (aFl.z < 0.) lp += aAx*fl*(.42 + .18*sin(uTime*1.3 + ph) + .06*sin(uTime*7.3 + ph*3. + aUv.x*9.));
  else {
    float w = sin(uTime*(5. + 2.*uGust) - fl*6. + ph)*.5 + sin(uTime*9.7 - fl*11. + ph*1.7)*.25;
    lp += aAx*w*fl*(.45 + .6*uGust)*min(aFl.z*.3, 1.3) + vec3(0., -1., 0.)*fl*fl*aFl.z*.4*(1. - uGust);
  }
  vP = lp; vCol = aCol; vAx = aAx; vUv = vec3(aUv, aFl.z);
  vec4 mvPosition = modelViewMatrix*vec4(lp, 1.);
  gl_Position = projectionMatrix*mvPosition;
  #include <fog_vertex>
#ifdef USE_FOG
  vFogDepth *= .45;                       // the ring's paper stays red and saffron at 700 m
#endif
}`, /* glsl */`
#include <common>
#include <fog_pars_fragment>
${GLSL_LIGHT}
uniform vec3 uCam, uCream;
varying vec3 vP; varying vec3 vCol; varying vec3 vAx; varying vec3 vUv;
void main(){
  vec3 N = normalize(cross(dFdx(vP), dFdy(vP)) + vAx*1e-5);
  vec3 base = vCol;
  if (vUv.z < 0.) {
    vec2 dq = abs(vUv.xy - .5)*vec2(1., 1.15);
    float d = dq.x + dq.y;
    base = mix(base, uCream, (1. - smoothstep(.27, .3, d))*.92);
    base = mix(base, vCol, 1. - smoothstep(.1, .13, d));
    base = mix(base, vCol*.5, 1. - smoothstep(.0, .03, abs(d - .39) - .012));
    float e = min(min(vUv.x, 1. - vUv.x), min(vUv.y, 1. - vUv.y));
    base = mix(uCream*.9, base, smoothstep(.035, .06, e));
  } else base *= .82 + .18*step(.5, fract(vUv.y*2.5 + .25));
  vec3 c = paper(base, N, normalize(uCam - vP), 0.)*1.4;
  gl_FragColor = vec4(c, 1.);
  #include <fog_fragment>
}`, { uCream: { value: cream } }));
  cloth.frustumCulled = false; cloth.name = 'ring-paper'; root.add(cloth);
  await ctx.yield?.();

  // ---- optional stage: a pastel roof mosaic so the sky can be judged alone (the world replaces it)
  const stageOn = opts.stage !== false;
  const BOXC = V3(-20, -270, 300);                       // x, z, radius of the modelled roofs
  if (stageOn) {
    const GLSL_ROOF = /* glsl */`
${GLSL_LIGHT}
uniform float uTime, uTint;
float h1(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7)))*43758.5453); }
vec3 roofShade(vec2 m, vec2 dm, vec3 wall, float seed, vec2 wxz){
  float edge = min(min(m.x, dm.x - m.x), min(m.y, dm.y - m.y));
  vec3 roof = mix(vec3(.6, .55, .5), wall, uTint)*(.84 + .22*h1(floor(wxz*.7) + seed));
  vec2 sn = normalize(uSunDir.xz + vec2(1e-4, 0.));
  float cot = length(uSunDir.xz)/max(uSunDir.y, .08);
  float tx = (sn.x < 0. ? m.x : dm.x - m.x)/max(abs(sn.x), 1e-3);
  float tz = (sn.y < 0. ? m.y : dm.y - m.y)/max(abs(sn.y), 1e-3);
  float lit = smoothstep(cot*.95, cot*1.05, min(tx, tz));
  vec2 sc = dm*(.28 + .44*vec2(h1(vec2(seed, 1.3)), h1(vec2(seed, 7.7))));
  vec2 q = m - sc;
  float shed = step(max(abs(q.x), abs(q.y)), 1.3);
  vec2 q1 = q + sn*cot*.9, q2 = q + sn*cot*1.8, q3 = q + sn*cot*2.6;
  float ss = max(step(max(abs(q1.x), abs(q1.y)), 1.3), max(step(max(abs(q2.x), abs(q2.y)), 1.3), step(max(abs(q3.x), abs(q3.y)), 1.3)));
  lit *= 1. - ss*(1. - shed);
  vec2 g = (wxz + vec2(uTime*1.1, -uTime*.6))/6.5; vec2 cid = floor(g);
  vec2 f = fract(g) - .5 - (vec2(h1(cid), h1(cid + 3.1)) - .5)*.5;
  lit *= 1. - .6*step(.6, h1(cid + 9.7))*(1. - smoothstep(.1, .15, abs(f.x) + abs(f.y)));
  float par = 1. - smoothstep(.32, .4, edge);
  vec3 alb = mix(mix(roof, mix(wall, vec3(.74, .7, .66), .3), shed), wall, par);
  lit = mix(lit, 1., max(par, shed));
  return alb*(uSky*1.05 + uSun*(max(uSunDir.y, 0.)*1.5 + .22*max(par, shed))*lit);
}`;
    const bpos = [], bnor = [];
    const face = (a, b, c, d, n) => { for (const v of [a, b, c, a, c, d]) { bpos.push(...v); bnor.push(...n); } };
    const P = (x, y, z) => [x, y, z];
    face(P(-.5, 1, -.5), P(-.5, 1, .5), P(.5, 1, .5), P(.5, 1, -.5), [0, 1, 0]);
    face(P(-.5, 0, .5), P(.5, 0, .5), P(.5, 1, .5), P(-.5, 1, .5), [0, 0, 1]);
    face(P(.5, 0, -.5), P(-.5, 0, -.5), P(-.5, 1, -.5), P(.5, 1, -.5), [0, 0, -1]);
    face(P(.5, 0, .5), P(.5, 0, -.5), P(.5, 1, -.5), P(.5, 1, .5), [1, 0, 0]);
    face(P(-.5, 0, -.5), P(-.5, 0, .5), P(-.5, 1, .5), P(-.5, 1, -.5), [-1, 0, 0]);
    const iB = [], iD = [], iCol = [], walls = [pal[0], pal[1], pal[2], pal[3], pal[0], lin('#f2efe8'), pal[1], pal[3], pal[0], pal[2], lin('#f2efe8'), pal[4]], wc = new THREE.Color();
    const n0 = Math.floor((BOXC.x - BOXC.z) / PITCH), n1 = Math.ceil((BOXC.x + BOXC.z) / PITCH), m0 = Math.floor((BOXC.y - BOXC.z) / PITCH), m1 = Math.ceil((BOXC.y + BOXC.z) / PITCH);
    for (let i = n0; i <= n1; i++) for (let j = m0; j <= m1; j++) {
      const cx = (i + 0.5) * PITCH, cz = (j + 0.5) * PITCH;
      if (Math.hypot(cx - BOXC.x, cz - BOXC.y) >= BOXC.z) continue;
      const street = ((i % 14) + 14) % 14 === 6 ? 5 : 0;
      const lx = 2.5 + 1.5 * h2(i, j, gridSeed + 7) + street, lz = 2.5 + 1.5 * h2(i, j, gridSeed + 11);
      iB.push(cx, roofY(cx, cz), cz, h2(i, j, gridSeed + 3) * 97); iD.push(PITCH - lx, PITCH - lz, 0);
      wc.copy(walls[Math.floor(h2(i, j, gridSeed + 5) * walls.length)]).multiplyScalar(0.7 + 0.16 * h2(i, j, gridSeed + 9)); iCol.push(wc.r, wc.g, wc.b);
    }
    const bg = new THREE.InstancedBufferGeometry(); bg.instanceCount = iB.length / 4;
    bg.setAttribute('position', new THREE.Float32BufferAttribute(bpos, 3)); bg.setAttribute('normal', new THREE.Float32BufferAttribute(bnor, 3));
    bg.setAttribute('iB', ib(new Float32Array(iB), 4)); bg.setAttribute('iD', ib(new Float32Array(iD), 3)); bg.setAttribute('iCol', ib(new Float32Array(iCol), 3));
    const boxes = new THREE.Mesh(bg, mkMat(/* glsl */`
#include <common>
#include <fog_pars_vertex>
attribute vec4 iB; attribute vec3 iD; attribute vec3 iCol;
varying vec3 vN; varying vec3 vP; varying vec3 vCol; varying vec4 vM; varying vec3 vDim;
void main(){
  vec3 lp = vec3(iB.x + position.x*iD.x, position.y*iB.y, iB.z + position.z*iD.y);
  vN = normal; vP = lp; vCol = iCol; vDim = vec3(iD.xy, iB.w);
  vM = vec4((position.xz + .5)*iD.xy, abs(normal.x) > .5 ? position.z*iD.y : position.x*iD.x, iB.y - lp.y);
  vec4 mvPosition = modelViewMatrix*vec4(lp, 1.);
  gl_Position = projectionMatrix*mvPosition;
  #include <fog_vertex>
}`, /* glsl */`
#include <common>
#include <fog_pars_fragment>
${GLSL_ROOF}
varying vec3 vN; varying vec3 vP; varying vec3 vCol; varying vec4 vM; varying vec3 vDim;
void main(){
  vec3 c;
  if (vN.y > .5) c = roofShade(vM.xy, vDim.xy, vCol, vDim.z, vP.xz);
  else {
    float top = vM.w, y = vP.y;
    vec3 alb = vCol*(.74 + .26*h1(floor(vec2(vM.z*.9, y*.45)) + vDim.z))*(.72 + .28*smoothstep(0., 2.2, top))*(.7 + .3*smoothstep(0., 4., y));
    alb = mix(alb, vCol*1.05, 1. - smoothstep(.9, 1.05, top));
    vec2 wq = vec2(vM.z/2.4 + .5, y/3.1); vec2 wf = fract(wq) - .5; vec2 wi = floor(wq);
    float win = step(abs(wf.x), .2)*step(abs(wf.y), .26)*step(.3, h1(wi + vDim.z))*step(1.6, top)*step(1., y);
    vec3 shut = mix(vec3(.07, .06, .08), mix(vec3(.1, .3, .34), vec3(.36, .2, .1), h1(wi*1.7 + vDim.z)), step(.55, h1(wi + 4.4)));
    alb = mix(alb, shut, win);
    c = alb*(mix(uGnd, uSky, .5)*1.05 + uSun*max(dot(normalize(vN), uSunDir), 0.)*.9);
  }
  gl_FragColor = vec4(c, 1.);
  #include <fog_fragment>
}`, { uTint: { value: 0.28 } }, { side: THREE.FrontSide }));
    boxes.frustumCulled = false; boxes.name = 'stage-roofs'; root.add(boxes);
    const pg = new THREE.PlaneGeometry(3200, 3200); pg.rotateX(-Math.PI / 2); pg.translate(0, 8.9, 0);
    const plane = new THREE.Mesh(pg, mkMat(/* glsl */`
#include <common>
#include <fog_pars_vertex>
varying vec3 vP;
void main(){
  vP = position;
  vec4 mvPosition = modelViewMatrix*vec4(position, 1.);
  gl_Position = projectionMatrix*mvPosition;
  #include <fog_vertex>
}`, /* glsl */`
#include <common>
#include <fog_pars_fragment>
${GLSL_ROOF}
uniform vec3 uCam, uBoxC; uniform vec3 uW0, uW1, uW2, uW3;
varying vec3 vP;
void main(){
  vec2 p = vP.xz; vec2 cid = floor(p/12.); vec2 m0 = p - cid*12.;
  float street = 1. - step(.5, abs(mod(cid.x, 14.) - 6.));
  vec2 lane = vec2(2.5 + 1.5*h1(cid + 5.5) + 5.*street, 2.5 + 1.5*h1(cid + 8.5));
  vec2 m = m0 - lane*.5, dm = vec2(12.) - lane;
  float inside = step(0., min(min(m.x, dm.x - m.x), min(m.y, dm.y - m.y)));
  inside *= step(uBoxC.z, distance((cid + .5)*12., uBoxC.xy));
  float r = h1(cid + 1.7);
  vec3 wall = (r < .32 ? uW0 : (r < .54 ? uW1 : (r < .72 ? uW2 : (r < .9 ? uW3 : vec3(.85, .83, .8)))))*(.72 + .16*h1(cid + 2.9));
  vec3 laneCol = vec3(.055, .055, .08) + uGnd*.06;
  vec3 c = mix(laneCol, roofShade(m, dm, wall, h1(cid)*97., p), inside);
  float far = smoothstep(450., 1500., distance(vP, uCam));
  c = mix(c, vec3(.47, .42, .42)*(uSky + uSun*.5)*1.3, far);
  gl_FragColor = vec4(c, 1.);
  #include <fog_fragment>
}`, { uTint: { value: 0.66 }, uBoxC: { value: BOXC }, uW0: { value: pal[0] }, uW1: { value: pal[1] }, uW2: { value: pal[2] }, uW3: { value: pal[3] } }, { side: THREE.FrontSide }));
    plane.frustumCulled = false; plane.name = 'stage-mosaic'; root.add(plane);
  }

  // ---- anchors, hooks
  const kiteAnchors = iA.slice(0, nLined * 3);
  const anchors = {
    portalSeat: { position: C.clone(), normal: dN.clone(), up: uR.clone(), radius: 7, tiltDeg: opts.ringTilt ?? 35 },
    ringCenter: C.clone(), ringNormal: dN.clone(), flyThrough, trainCurve, trainAnchor: T0.clone(), ringLineAnchors, kiteAnchors,
    pathDefault, minarets: [V3(-32, 0, -180), V3(-8, 0, -180)], launch: V3(0, 12, 350),
    viewpoints: { entry: V3(0, 14.5, 350), duel: V3(-30, 90, 100), skim: V3(-20, 14.5, -120), finale: V3(-20, 58, -325) },
    field: { halfX: FIELD, halfZ: FIELD, minY: 30, maxY: 150 }, sunDir: sunDir.clone(),
    placement: { position: V3(350, 0, 0), rotationY: -Math.PI / 2 }, toWorld, toLocal,
    counts: { kites: NK, lines: nLined, escorts: nEscDone, great: nBig, train: NT, cleared: nCleared }, fixedPlaced,
    kiteLines: iL.slice(0, nLined * 4),            // azimuth, elevation, line length, half size of each kite (same order as kiteAnchors)
  };
  const tmp = V3(), size = new THREE.Vector2();
  const cutU = opts.cutU ?? 0.328;
  let gustTarget = 0.3, cutTime = -1, lastTime = 0;
  let gustU = 0, gustSnap = true;                  // the gust begins AT its target: on the first update, and after a jump of place (setProgress)
  return {
    object: root, radius: 130, height: 150, center: V3(-20, 62, -300), anchors, uniforms: U,
    ground: !stageOn, groundY: 0,
    update(dt, time, camera) {
      lastTime = time; U.uTime.value = time;
      // the gust eases by the clock step alone: at a step of 0 (paused, a frozen still, a second draw of one frame) it is left exactly as it is
      if (gustSnap) { U.uGust.value = gustTarget; gustSnap = false; }
      else if (dt > 0) U.uGust.value += (gustTarget - U.uGust.value) * Math.min(1, dt * 1.5);
      U.uCutClock.value = cutTime >= 0 ? Math.max(0, time - cutTime) : -1;
      if (camera) {
        root.updateWorldMatrix(true, false);
        U.uCam.value.copy(root.worldToLocal(tmp.setFromMatrixPosition(camera.matrixWorld)));
        let h = 1080; if (ctx.renderer?.getDrawingBufferSize) h = ctx.renderer.getDrawingBufferSize(size).y || 1080;
        U.uPx.value = 2 / (Math.max(camera.projectionMatrix.elements[5], 0.05) * h);
        U.uTanH.value = 1 / Math.max(camera.projectionMatrix.elements[5], 0.05);
      }
    },
    setProgress(u) {
      gustTarget = 0.3 + 0.7 * smoothstep(0.74, 0.8, u);
      // a posed place is a jump no flight makes (one step of 0.05 s moves u by under 0.03, at the fastest pace and hurried to the portal): the gust is then set, not eased
      if (Math.abs(u - gustU) > 0.1) gustSnap = true;
      gustU = u;
      if (nGreat) {
        if (u >= cutU && cutTime < 0) { cutTime = lastTime; U.uCutAt.value = lastTime; }
        else if (u < cutU - 0.02 && cutTime >= 0) cutTime = -1;
      }
    },
    setSun(dir, color, intensity = 3.6) { if (dir) U.uSunDir.value.copy(toV3(dir)).normalize(); if (color) U.uSun.value.set(color).multiplyScalar(intensity / Math.PI); },
    setAmbient(sky, ground, intensity = 1.9) { U.uSky.value.set(sky).multiplyScalar(intensity / Math.PI); U.uGnd.value.set(ground).multiplyScalar(intensity / Math.PI); },
    dispose() {},
  };
}
