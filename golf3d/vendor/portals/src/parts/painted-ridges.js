// THE RIBBON: hero set piece of "painted-ridges".
//
// A hogback of tilted, candy-striped badland strata a kilometre long and 200 m high, cut into flutes,
// with a water gap near its east end, repainted by a passing shower: a sharp ragged wet line races along
// the face (chalk pastel ahead of it, dark saturated colour behind), rivulets and ledge falls start in
// every gully behind the line, and a sun patch follows it so the soaked bands blaze and steam.
//
// LOCAL FRAME   origin at the base centre, +Y up. The strike runs along X (west = -X, east = +X); the
//               38 degree painted face looks toward +Z (the wash, the Knife and the camera are on +Z).
//               The back (-Z) is a steeper scarp. Footprint 1040 m (X) by 520 m (Z = -170 .. +350).
// SIZE          radius 440 reported (the tapered ends reach 520), height about 200 (crest), ground (the washes) at y = 0.
// COST          about 170k triangles, 7 draw calls (ridge 86k, the two flanks of the water gap 34k + 28k, talus
//               blocks 20k, falls, mist / vapour / crest dust, rain veils), 3 data textures (768 x 272 x 2,
//               1024 x 1), no lights. From more than 560 m out along the gap axis only the flanks' shoulders
//               are drawn (their stepped walls cannot be seen from there): 21k instead of 62k.
//               THE FLANKS (fin-west, fin-east): each wall is built bed by bed as true ledges (a row at every
//               contact, a recessed notch at every parting), each shoulder is gullied down to notches in the
//               rim; the gap's falls are drawn on the walls themselves (uFallW, uFallE) with mist at the foot.
//               The ridge mesh dissolves into a ragged edge over the outer 5-40 m of the footprint, where it
//               has already settled to y = -1.2: lay the world's terrain over that seam (use heightAt).
// LIGHTING      Self-lit: custom ShaderMaterials, scene lights are ignored, scene fog is honoured. The sun
//               defaults to the brief's (16 degrees up, from the west, raking 70 degrees off the face) and
//               its cast shadows and ambient occlusion are BAKED for that direction at build time, so pass
//               opts.sunDir (LOCAL space, pointing at the sun) if the world's sun differs. setLight() only
//               retints. Wants a blue-green sky and haze that pales rock to #C9CDC8 by 3 km.
//
// opts          palette   7 hex strings (brick, ochre, cream, sage, slate, dun, shale-black), brief default
//               hour      'evening' (default) | 'golden' | 'day' | 'dawn' | 'night'
//                         dawn = already wet, no travelling line, sunrise creeping down the face with u
//                         (mirror the whole object yourself with opts.mirror: true for the brief's dawn)
//               weather   'shower' (default) | 'snow' (the line leaves white on every upward ledge) | 'clear'
//               mirror    true flips the piece left to right (anchors are returned already flipped)
//               sunDir    THREE.Vector3, local, toward the sun (overrides the hour's direction)
//               rain      false to leave out the hero's own rain veils (the world may bring its own)
//
// PROGRESS      hero.setProgress(u) with the world's path progress. Nothing scripted uses wall-clock time:
//               the wet line enters the west end at u 0.38 and leaves the east end at u 0.72; rivulets and
//               falls appear 120 m (3 s at 40 m/s) behind it; the storm's shadow sits over the line, one band
//               of a fixed breadth (hero.setCloudBreadth(metres); 190 m if never set), and a 300 m sun patch
//               follows its trailing edge. Until setProgress is first called the piece runs a
//               30 s demo loop of the same event so it is alive in the viewer.
//               hero.wet = { dir (Vector2, local XZ), frontAt(u) } lets the world drive the same line in its
//               own terrain: a point is wet when dot(p.xz, dir) < frontAt(u) (+ up to 8 m of ragged edge).
//               hero.uniforms holds the shared uniform objects (uFront, uWetDir, uShade, uSun, ...).
//               hero.heightAt(x, z) is the ridge's height function in local space (for merging terrain,
//               seating horses, placing plants); hero.strata = { texture, nBed, b0, span } is the colour
//               table: bed coordinate b = dot(p, nBed), texel u = (b - b0) / span, alpha = bed hardness.
//
// ANCHORS (local space)
//   portalSeat   { position, facing }: centre of the gap floor where it crosses the crest line, 2.3 m up
//                (rider's eye); facing looks back along the gap toward the arriving camera. A 12-14 m ring
//                fits with 5 m lanes either side (floor 22 m wide, fins 45 m).
//   flyThrough   ordered points: far wash view, Knife mid (330 m off the face), Knife end (120 m off),
//                then on the gap axis 255 m, 150 m and 60 m out, the seat, 60 m beyond. The last five are
//                one straight line on the gap axis (level for the final 120 m) with at least 9 m of clearance
//                to rock either side (floor half-width 11 to 15 m, talus kept 9 m off the axis).
//   viewpoints   { wash, knifeMid, underFace, gapMouth }: where the brief's key frames stand.
//   gap          { center, axis, halfWidth, finHeight }; crest: Vector3 list along the knife edge.
//   falls        positions of the ledge falls (for sound, extra mist or horses to avoid).
//
// STYLE NOTE    No special art style. The look is: 1D strata table looked up by a tilted bed coordinate;
//               dry = bed colour mixed 0.5 to cream; wet = bed x 0.6 with saturation x 1.45 plus sun and
//               sky gloss; key light multiplied by baked shadow, scrolling cloud shadow and storm shadow.
//
// LAND          the world lays its own terrain with the same shader: ROCK_VS / ROCK_FS with the define LAND read the
//               normal and (ao, sun shadow) from vertex attributes instead of the baked textures, and add crust, pebble
//               lag, puddles and a spring flush (uLand.x). SHADOWPASS draws the same ground with the key light off.
import * as THREE from 'three';

const DEF_PAL = ['#B5472F', '#D99A45', '#EFE2C4', '#9AAB8A', '#5C728C', '#B8935F', '#2B2624'];
const X0 = -520, X1 = 520, Z0 = -170, Z1 = 350;          // footprint
const TW = 768, TH = 272;                                 // baked texture size
const TAN_F = Math.tan(38 * Math.PI / 180), TAN_B = 1.38;  // face and scarp slopes
const BED_SPAN = 1100, BED_B0 = -530, BED_N = 1024;
const JOINT_W = 9, JOINT_A = 0.36;       // master joints of the gap walls: their spacing along the gap, the step of the beds across one (metres)
const FIN_T0 = 272, FIN_T1 = 14, FIN_DT = 1.4, FIN_BX = 0.58, FIN_BY = 0.40, FIN_T0E = FIN_T0 + 42, FIN_K = FIN_BY / FIN_BX, SH_BEDS = 2.1;   // the fin walls: their span along the gap, column width, bed weights of height and of distance
const sstep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const mix = (a, b, t) => a + (b - a) * t;

// ---------------------------------------------------------------- GLSL shared by every material
const GLSL_COMMON = /* glsl */`
uniform sampler2D uStrata, uBake1, uBake2, uPart, uRockH;      // uPart: 1 on every dark shale parting of the bed table; uRockH: the Ribbon's height over its own footprint (uRect)
uniform vec3 uNBed, uSun, uSunCol, uSkyCol, uBounce, uCream, uMud, uCam, uWash;
uniform vec4 uBed;      // b0, 1/span, snow, wetAll
uniform vec4 uRect;     // x0, z0, 1/width, 1/depth
uniform vec4 uShade;    // storm shadow trailing edge, leading edge, cloud dark level, storm dark level
uniform vec4 uShade2;   // sun patch strength, sunrise line height, rain amount, unused
uniform vec4 uLand;     // spring flush on the wash floors, puddles on, unused, bed scale of the land
uniform vec3 uLandBed;  // the land away from the Ribbon is another limb of the fold: its own bed normal
uniform vec4 uFinA;     // gap axis x, z (unit, toward the mouth), seat x, z
uniform vec4 uFinB;     // fin beds: weight of height, weight of distance along the gap, scale, phase
uniform vec4 uFallW, uFallE;   // where the falls of the west and east fin come down (in gully coordinates)
uniform vec4 uRing, uRingB;    // the exit ring: its centre and how strongly it lights the gap; its colour and radius
vec3 capSat(vec3 c, float cap) {          // hold a colour's saturation under a ceiling, keeping its lightness
  float mx = max(c.r, max(c.g, c.b)), mn = min(c.r, min(c.g, c.b)), sat = (mx - mn) / max(mx, 1e-4);
  return mix(vec3(dot(c, vec3(.2126, .7152, .0722))), c, min(1., cap / max(sat, 1e-4)));
}
uniform vec4 uFinC;     // floor half width, mouth distance, fill boost in the gap, moonlight
uniform vec2 uWetDir, uWind, uVeil;   // uVeil: how far the rain veils stand ahead of the wet line (virga), their opacity
uniform float uFront, uTime;
float hash21(vec2 p) { p = fract(p * vec2(123.34, 345.45)); p += dot(p, p + 34.345); return fract(p.x * p.y); }
float vnoise(vec2 p) {
  vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(hash21(i), hash21(i + vec2(1., 0.)), f.x), mix(hash21(i + vec2(0., 1.)), hash21(i + vec2(1., 1.)), f.x), f.y);
}
float fbm3(vec2 p) { return vnoise(p) * .55 + vnoise(p * 2.13 + 17.1) * .3 + vnoise(p * 4.37 + 5.7) * .15; }
// x: wetness 0..1 with the sharp ragged edge, y: signed distance behind the front in metres (positive = behind)
vec2 wetAt(vec3 p) {
  float w = dot(p.xz, uWetDir);
  // (ragged at every scale: metres wide under the hooves, tens of metres up the height of the face, so that from four hundred
  // metres off the line is a torn edge climbing the beds and never a ruled one)
  float rag = (fbm3(p.xz * .035) - .5) * 17. + (vnoise(p.xz * .23) - .5) * 4. + (vnoise(vec2(p.y * .052 + 3.7, dot(p.xz, vec2(.34, .94)) * .014)) - .5) * 30.;
  float d = uFront + rag - w;
  float wet = smoothstep(-.7, .7, d);
  // first drops ahead of the line: dark specks a hand across, to be told one from another only from near by. (Drawn on rock
  // far across the basin, where a speck is many times finer than anything that can be told there, the specks and the dry rock
  // between them lay over one another like two pictures on one plate, and the end of the Ribbon where the line stood looked as
  // if it could be seen through.) They are let go with our own distance from the rock: whole within 40 m, gone by 140 m, and
  // from further off the line is its one ragged edge
  float spat = step(.74, vnoise(p.xz * 2.7)) * smoothstep(-22., -1., d) * (1. - smoothstep(40., 140., length(p - uCam)));
  wet = max(max(wet, spat * .75), uBed.w);
  return vec2(wet, mix(d, 400., uBed.w));
}
// how surely the ray from p along the unit vector d ends in the Ribbon's rock within some five hundred metres: fourteen steps out
// along it, each a quarter as long again (near its crest the ridge is thin: longer steps strode through it). Rain drawn in front
// of rock is all but put out by it
float rockBehind(vec3 p, vec3 d) {
  float rock = 0., tr = 22.;
  for (int i = 0; i < 14; i++) {
    vec3 rp = p + d * tr;
    vec2 ruv = (rp.xz - uRect.xy) * uRect.zw;
    float inside = step(0., min(min(ruv.x, ruv.y), min(1. - ruv.x, 1. - ruv.y)));
    rock = max(rock, inside * smoothstep(-3., 3., textureLod(uRockH, clamp(ruv, 0., 1.), 0.).r - rp.y));
    tr *= 1.28;
  }
  return rock;
}
// the shower's own cloud over a place. x: how far the place stands under it (0 clear of it, 1 under it); y: how far it stands in
// the sun patch behind it
vec2 showerAt(vec3 p) {
  // the shower's own cloud hangs low over its rain, and its shadow stands where its rain falls: by a place's own position down
  // the storm's heading, the same at every height, as the wet line itself is. (Thrown down the rays of the low sun, as the high
  // cumulus' shadows are, the band lay three and a half metres further back for every metre a place stands above the wash:
  // 120 m behind its place on the Knife's crest and 350 to 700 m behind it up the Ribbon's face. So the freshly soaked face
  // stood in full sun while the cloud was over it, and went under the shadow as the sun broke)
  float wq = dot(p.xz, uWetDir), e = (vnoise(p.xz / 75. + 3.1) - .5) * 110. + (vnoise(p.xz / 21. + 8.7) - .5) * 40.;
  float ahead = smoothstep(uShade.x - 75. + e, uShade.x + 75. + e, wq);      // 0 behind the cloud's trailing edge, 1 ahead of it
  float storm = ahead * (1. - smoothstep(uShade.y - 34. + e * .4, uShade.y + 34. + e * .4, wq));
  // the sun patch is the 300 m of land behind the cloud's trailing edge (the design's breadth): it begins at the edge, with the
  // edge's own softness, and ends as softly 300 m behind it; no cumulus shadow crosses it
  float hole = smoothstep(uShade.x - 375. + e, uShade.x - 225. + e, wq) * (1. - ahead);
  return vec2(storm, hole);
}
// the key light's weather: racing cloud shadows, the storm's shadow over the line, the sun patch behind it
float keyAt(vec3 p) {
  vec2 q = p.xz - uSun.xz * (p.y / max(uSun.y, .08));
  float c = vnoise(q / 250. - uWind * (uTime / 250.)) * .62 + vnoise(q / 95. - uWind * (uTime / 80.) + 7.3) * .38;
  float cloud = mix(uShade.z, 1., smoothstep(.40, .60, c));
  vec2 sh = showerAt(p);
  cloud = mix(cloud, 1., max(sh.y * uShade2.x, sh.x * .75));
  float k = cloud * mix(1., uShade.w, sh.x);
  return k * smoothstep(uShade2.y - 14., uShade2.y + 14., p.y);
}
`;

// ---------------------------------------------------------------- the rock (ridge mesh and talus blocks)
const ROCK_VS = /* glsl */`
#include <common>
#include <fog_pars_vertex>
varying vec3 vP;
#ifdef BLOCK
varying vec3 vN;
#endif
#if defined(LAND) || defined(FIN)
attribute vec2 aBake;
varying vec3 vN; varying vec2 vBk;
#endif
#ifdef STRIP
attribute vec2 aSL;
varying vec2 vSL;
#endif
#ifdef WING
attribute vec2 aWL;
varying vec2 vWL;
#endif
#ifdef FIN
attribute vec2 aFin;
varying vec2 vFin;
#endif
void main() {
  #if defined(LAND) || defined(FIN)
  vN = normal; vBk = aBake;
  #endif
  #ifdef WING
  vWL = aWL;
  #endif
  #ifdef FIN
  vFin = aFin;
  #endif
  #ifdef STRIP
  vSL = aSL;
  #endif
  #ifdef BLOCK
  vec4 lp = instanceMatrix * vec4(position, 1.);
  vN = normalize(mat3(instanceMatrix) * normal + vec3(0., 1e-4, 0.));
  #else
  vec4 lp = vec4(position, 1.);
  #endif
  vP = lp.xyz;
  vec4 mvPosition = modelViewMatrix * lp;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;

const ROCK_FS = /* glsl */`
#include <common>
#include <fog_pars_fragment>
${GLSL_COMMON}
varying vec3 vP;
#ifdef BLOCK
varying vec3 vN;
#endif
#if defined(LAND) || defined(FIN)
varying vec3 vN; varying vec2 vBk;
#endif
#ifdef STRIP
varying vec2 vSL;
#endif
#ifdef WING
varying vec2 vWL;       // the Wing's wall in its own coordinates: metres along its foot, metres up its face from the toe
#endif
#ifdef FIN
varying vec2 vFin;      // gully coordinate (a rivulet runs where its fraction is one half), 0 on the wall rising to 1 at the outer edge of the shoulder
#endif
#ifdef LAND
// one size of desiccation polygon: x how far this point is from the nearest crack (in cells), y the plate's own number
vec2 crackCell(vec2 q) {
  vec2 ci = floor(q), cf = fract(q);
  float d1 = 9., d2 = 9., pid = 0.;
  for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
    vec2 g = vec2(float(i), float(j));
    vec2 o = vec2(hash21(ci + g), hash21(ci + g + 17.3));
    vec2 r = g + o - cf; float dd = dot(r, r);
    if (dd < d1) { d2 = d1; d1 = dd; pid = o.x; } else if (dd < d2) d2 = dd;
  }
  return vec2(sqrt(d2) - sqrt(d1), pid);
}
#endif
// rills: dark threads down the fall line. Each family keeps one fixed bearing, chosen from eight by the fall line: steered by the
// fall line itself they swirl like wood grain wherever a gully turns the slope.  x: thread, y: slope of the noise across it, zw: that bearing
// (each thread is an open line: the level f = k + 1/2 of a coordinate that only ever grows across the slope. The contours of a
// noise close on themselves, and drew arcs and rings over the rock.)   one family: x thread, y slope across it
vec2 rillFam(vec3 p, vec2 dA) {
  float al = dot(p.xz, dA) * .42, yy = p.y * .11;
  float f = al + (vnoise(vec2(al * .33, yy)) - .5) * 1.2 + (vnoise(vec2(al * .9 + 7., yy * 2.7)) - .5) * .15;
  float w = min(fwidth(f), 1.), id = floor(f), c = fract(f) - .5, ac = abs(c);
  float on = step(.40, hash21(vec2(id, 7.3))) * smoothstep(.30, .52, vnoise(vec2(id * 3.17, yy * .7 + 5.)));      // not every hollow holds one, and each starts and gives out
  float keep = 1. - smoothstep(.10, .30, w);
  float crisp = (1. - smoothstep(.03 + w * .4, .05 + w * 1.5, ac)) * clamp(.07 / max(w, 1e-4), .35, 1.);
  float hollow = 1. - smoothstep(0., .24, ac);
  return vec2((.36 * hollow + .8 * crisp) * on * keep, -clamp(c * 7., -1., 1.) * (1. - smoothstep(.10, .32, ac)) * on * keep * .32);
}
vec4 rills(vec3 p, vec2 sd) {
  float ang = atan(sd.y, sd.x + 1e-5) * 1.2732395, a0 = floor(ang), af = smoothstep(.3, .7, ang - a0);
  vec2 dA = vec2(-sin(a0 * .7853982), cos(a0 * .7853982)), dB = vec2(-sin((a0 + 1.) * .7853982), cos((a0 + 1.) * .7853982));
  vec2 rA = rillFam(p, dA), rB = rillFam(p, dB);
  return vec4(mix(rA, rB, af), mix(dA, dB, af));
}
#ifdef LAND
// a bed table read crisply: at arm's length every texel is a lamina with a sharp contact, not a gradient a hand wide
vec4 strataAt(float tc) {
  float x = tc * ${BED_N}. - .5, i = floor(x), f = x - i, fw = fwidth(x), w = clamp(fw * .7, 1e-3, .5);
  return textureLod(uStrata, vec2((i + .5 + smoothstep(.5 - w, .5 + w, f)) / ${BED_N}., .5), max(0., log2(max(fw, 1e-4))));
}
#endif
void main() {
  #if defined(LAND) || defined(FIN)
  vec2 uv = vec2(.5);
  vec4 t1 = vec4(0., 0., vBk.x, vBk.y);
  vec4 t2 = vec4(0.);
  #else
  vec2 uv = (vP.xz - uRect.xy) * uRect.zw;
  vec4 t1 = texture2D(uBake1, uv);
  vec4 t2 = texture2D(uBake2, uv);
  #endif
  vec3 toCam = uCam - vP;
  float dist = length(toCam) + 1e-3;
  vec3 V = toCam / dist;
  float near = 1. - smoothstep(25., 260., dist);
  float mid = 1. - smoothstep(200., 900., dist);
  #ifdef BLOCK
  vec3 n = normalize(vN);
  float ao = t1.b * (.55 + .45 * smoothstep(-.4, .6, n.y));
  float riv = 0.;
  #elif defined(LAND) || defined(FIN)
  vec3 n = normalize(vN + vec3(0., 1e-4, 0.));
  #ifdef FIN
  {
    // slivers of tread and notch thinner than a pixel take the wall's own facing and an average shade, or they sparkle as dotted lines
    float sgW = sign(dot(vP.xz - uFinA.zw, vec2(uFinA.y, -uFinA.x)));
    float thinK = smoothstep(.3, 1., fwidth(vBk.x) + fwidth(vBk.y)) * (1. - smoothstep(.03, .2, vFin.y));
    n = normalize(mix(n, normalize(vec3(-uFinA.y * sgW, .35, uFinA.x * sgW)), thinK * .85));
    t1.b = mix(t1.b, .8, thinK);
  }
  #endif
  #ifdef FIN
  {
    // from across the mouth of the gap the steps and gullies of a flank are smaller than the eye can sort: lit facet by facet they
    // were a crumple of zigzags. Far off each flank is shaded more nearly as one surface, and its beds carry the picture
    float sgF = sign(dot(vP.xz - uFinA.zw, vec2(uFinA.y, -uFinA.x)));
    float farN = smoothstep(35., 120., dist);
    vec3 nFlat = normalize(mix(vec3(0., 1., 0.), vec3(-uFinA.y * sgF, .35, uFinA.x * sgF), 1. - smoothstep(.03, .30, vFin.y)));
    n = normalize(mix(n, nFlat, mix(.58, .70, smoothstep(.06, .3, vFin.y)) * farN));
  }
  #endif
  float ao = min(t1.b, 1.);
  float riv = 0.;
  #else
  vec3 n = vec3(t1.r * 2. - 1., 0., t1.g * 2. - 1.);
  n.y = sqrt(max(1. - dot(n.xz, n.xz), .03));
  float ao = t1.b;
  vec2 ed = min(uv, 1. - uv) * vec2(1040., 520.);
  if (min(ed.x, ed.y) < 4. + 34. * fbm3(vP.xz * .021)) discard;
  float riv = smoothstep(.20, .55, max(t2.r, texture2D(uBake2, uv, 1.6).r * 1.4 * (1. - near))) * smoothstep(.22, .5, n.y);
  #endif
  vec2 sp = vP.xz + vP.y * vec2(.41, .67);
  float steep = 1. - n.y;
  vec2 sd = n.xz / max(length(n.xz), 1e-3);                 // the fall line, before any detail normal
  // gap coordinates: along the gap toward its mouth, across toward the east fin
  vec2 gq = vP.xz - uFinA.zw;
  float gT = dot(gq, uFinA.xy), gL = dot(gq, vec2(uFinA.y, -uFinA.x));
  vec3 nBed = uNBed;
  float shK = 0., riserS = 1., gul = 0., ledgeSh = 0., kEn = 0.;      // ledgeSh: how far a point lies in the shade of a ledge or a gully wall (it takes the key light off: a blue shadow)
  float veil = 0., wallK = 0., stainK = 0., jDs = 9., jBlk = 0.;
  // bed coordinate, wavy contacts
  #ifdef FIN
  // the flanks of the gap are cut along the strike: their own thinner beds climb the walls diagonally, the same on both sides
  nBed = normalize(vec3(uFinA.x * uFinB.y, uFinB.x, uFinA.y * uFinB.y));
  vec2 wq = vec2(gT, vP.y);
  float bFine = (vnoise(wq * .8) - .5) * .3 * near;
  // master joints cross the gap every few metres: the beds step a hand or two at each (as the built rows do), so no band runs the length of a wall
  float jk = floor(gT / ${JOINT_W.toFixed(1)}), tj0 = (jk + .28 * sin(jk * 2.4)) * ${JOINT_W.toFixed(1)}, tj1 = (jk + 1. + .28 * sin((jk + 1.) * 2.4)) * ${JOINT_W.toFixed(1)};
  float jA0 = ${JOINT_A.toFixed(2)} * sin((jk - 1.) * 1.7), jA1 = ${JOINT_A.toFixed(2)} * sin(jk * 1.7), jA2 = ${JOINT_A.toFixed(2)} * sin((jk + 1.) * 1.7);
  float js0 = smoothstep(tj0 - .7, tj0 + .7, gT), js1 = smoothstep(tj1 - .7, tj1 + .7, gT);
  float jfo = (jA0 + (jA1 - jA0) * js0 + (jA2 - jA1) * js1) * (1. - .85 * smoothstep(26., 64., dist));      // (from across the mouth the beds run on over the joints)
  bool jn = abs(gT - tj0) < abs(gT - tj1);
  jDs = jn ? gT - tj0 : gT - tj1;
  jDs += (vnoise(vec2(vP.y * .8, (jn ? jk : jk + 1.) * 3.1)) - .5) * .7;
  jBlk = gT >= tj1 ? jk + 1. : gT >= tj0 ? jk : jk - 1.;
  float b = (uFinB.x * (vP.y + jfo) + uFinB.y * gT) * uFinB.z + uFinB.w + (vnoise(wq * .07) - .5) * .5 + bFine;
  float bRidge = dot(vP, uNBed) + (vnoise(sp * .07) - .5) * 2.6;
  float bl = b / 6.5;
  bFine /= 6.5;
  {
    // rivulets. ON THE WALL one comes through every gully notch in the rim and runs straight down the wall, jogging at each ledge.
    // ON THE SHOULDER the water runs the way the dip slope falls, down the face toward the gap's mouth: thin red-brown threads a few
    // metres apart, each an open line (the level of a coordinate that only grows across the slope) that wanders a little, starts and
    // gives out, and is held between a pixel and a half and two pixels wide however near or far it lies. (Round 10 drew the
    // shoulder's threads along its built gullies, which run ACROSS the fall line into the gap, three and a half times as wide as the
    // wall's and in a pale colour: straps laid over the beds like a net.)
    wallK = 1. - smoothstep(.03, .42, vFin.y);
    float rs = vFin.x, rwp = fwidth(rs), rc = abs(fract(rs) - .5);
    float braid = (vnoise(vec2(rs * 37., vP.y * .9 - uTime * 1.3)) - .5) * .014;
    float rw = max(.012 + .007 * vnoise(vec2(gT * .4, vP.y * .2)), rwp * 1.1);
    float rivW = (1. - smoothstep(rw * .45, rw, abs(rc + braid))) * step(.25, hash21(vec2(floor(rs), 7.)));
    float rc2 = abs(fract(rs + .41) - .5), rw2 = max(.006, rwp * .9);
    rivW = max(rivW, (1. - smoothstep(rw2 * .45, rw2, abs(rc2 - braid))) * step(.5, hash21(vec2(floor(rs + .41), 3.))) * .85);
    rivW *= clamp(.014 / max(rwp, 1e-5), .3, 1.) * (.55 + .45 * vnoise(vec2(rs * 9., vP.y * .5 - uTime * 2.2))) * smoothstep(.55, .92, wallK);
    float fs = gL / 8.5 + (vnoise(vec2(gT * .043, gL * .05)) - .5) * 1.2 + (vnoise(vec2(gT * .17 + 3., gL * .11)) - .5) * .24;
    float fsw = clamp(fwidth(fs), 1e-4, 1.), sid = floor(fs), scs = abs(fract(fs) - .5);
    float son = step(.20, hash21(vec2(sid, 5.7))) * smoothstep(.26, .44, vnoise(vec2(sid * 3.17, gT * .019 + 2.)));
    float shw = clamp(.014, fsw * 1.05, fsw * 1.4);
    float rivS = (1. - smoothstep(shw * .45, shw, scs)) * son * (1. - smoothstep(.20, .45, fsw)) * clamp(.03 / fsw, .55, 1.)
      * (.80 + .20 * vnoise(vec2(fs * 9., gT * .5 - uTime * 2.2))) * (1. - smoothstep(.55, .92, wallK));
    // nothing of either comes near the lens: a thread thins to nothing as the eye comes within a few metres of the rock it runs on
    riv = max(rivW, rivS) * smoothstep(5., 26., dist);
    stainK = (1. - smoothstep(rw * 1.2, rw * 9., abs(rc + braid * 3.))) * step(.25, hash21(vec2(floor(rs), 7.))) * wallK * smoothstep(5., 26., dist);      // the rock either side of a wall's thread is stained dark by it
    // the falls: a braided veil poured down the wall from a gully notch, stepping over every ledge, widening and tearing toward its foot
    vec4 fq = gL < 0. ? uFallW : uFallE, dv = vec4(rs) - fq;
    float fd = dv.x;
    fd = abs(dv.y) < abs(fd) ? dv.y : fd; fd = abs(dv.z) < abs(fd) ? dv.z : fd; fd = abs(dv.w) < abs(fd) ? dv.w : fd;
    float big = (gL < 0. && abs(dv.z) <= min(abs(dv.x), abs(dv.y))) ? 2.5 : 1.;                 // the third fall of the west fin is the great one
    float low = 1. - smoothstep(2., 34., vP.y), fx = clamp(fd / (mix(.075, .25, low) * big), -1.5, 1.5), fy = vP.y + gT * .35, ft = uTime * 5.2;
    float wdt = .20 + .13 * low;
    float c0 = -.42 + .20 * sin(fy * .31 + 1.), c1 = .04 + .24 * sin(fy * .23 + 2.), c2 = .46 + .18 * sin(fy * .37 + 4.);
    float q0 = (fx - c0) / wdt, q1 = (fx - c1) / (wdt * 1.25), q2 = (fx - c2) / wdt;
    float s0 = vnoise(vec2(fx * 5. + 31., fy * .55 + ft)), s1 = vnoise(vec2(fx * 7. + 7., fy * .8 + ft * 1.2)), s2 = vnoise(vec2(fx * 13. + 3., fy * 1.7 + ft * 1.7));
    float va = exp(-q0 * q0 * 2.2) * (.45 + .55 * s0) + exp(-q1 * q1 * 2.2) * (.55 + .45 * s1) + exp(-q2 * q2 * 2.2) * (.40 + 1.2 * s0 * s1);
    va *= .62 + .6 * s2 * s2;
    float spray = vnoise(vec2(fx * 3.3 + 11., fy * .33 + ft * .6)) * vnoise(vec2(fx * 9. - 5., fy * .9 + ft));
    va = mix(va, va * smoothstep(.08, .40, spray) * 1.6 + .25, low * low);
    float fe = max(1. - fx * fx, 0.);
    veil = clamp(va * 1.15, 0., 1.) * smoothstep(0., .3, fe) * (1. - smoothstep(.04, .22, vFin.y)) * max(step(0., gL), smoothstep(uLand.z - 2.5, uLand.z + 1., vP.y));      // (the east fin's falls stay on their wall all the way down)
  }
  #else
  float bFine = (vnoise(sp * .8) - .5) * .7 * near;
  float b = dot(vP, uNBed) + (vnoise(sp * .07) - .5) * 2.6 + (vnoise(vec2(vP.x * .31, vP.z * .028)) - .5) * 2.0 * (1. - steep) * (1. - steep) + bFine;
  float bl = b;
  #endif
  float fineK = 0., ledgeL = 0., kth = 0., jlL = 0., jtone = 0., wingSh = 0., wingLip = 0., landPart = 0., wingHard = .5, wingTop = 0., wingId = 0.;
  float tc = (b - uBed.x) * uBed.y;
  vec4 st = texture2D(uStrata, vec2(tc, .5));
  #ifdef FIN
  // from across the mouth of the gap a wall is read in beds four times as thick, each running unbroken over the joints: its
  // metre-thick beds, every one of its own colour and stepped at every joint, made a quilt of tiles
  float tcC = ((uFinB.x * vP.y + uFinB.y * gT) * (uFinB.z * .27) + uFinB.w * .27 + 311. + (vnoise(wq * .05) - .5) * .6 - uBed.x) * uBed.y;
  vec4 stC = texture2D(uStrata, vec2(tcC, .5));
  float farC = smoothstep(26., 64., dist);
  st.rgb = mix(st.rgb, stC.rgb, .92 * farC);
  #endif
  float ha = texture2D(uStrata, vec2(tc + 1.3 * uBed.y, .5)).a;
  #ifndef LAND
  #ifndef BLOCK
  // beside the water gap the Ribbon is cut in thinner beds (its shoulders, the fins' noses and the stump east of the gap)
  float kg = (1. - smoothstep(95., 170., abs(gL))) * smoothstep(-70., -10., gT);
  // (their contacts lie nearly straight: a thin bed warped as far as the thick ones are swirls like wood grain)
  float bT = dot(vP, uNBed) * ${SH_BEDS.toFixed(1)} + (vnoise(sp * .07) - .5) * 1.5;
  float tct = (bT - uBed.x) * uBed.y;
  vec4 stT = texture2D(uStrata, vec2(tct, .5));
  float haT = texture2D(uStrata, vec2(tct + 1.3 * uBed.y, .5)).a;
  #ifndef FIN
  {
    // the stump east of the gap is the Ribbon's own rock, cut through by the water: it keeps the Ribbon's own beds, the same
    // planes and the same thicknesses as the face west of the gap, dipping as they dip there. (Drawn in the shoulders' thin
    // beds every step of it was a tile of its own colour, a quilt; drawn in level beds it was another hill. In its own beds
    // each is thicker than a step, so one bed's colour runs on across every step it crosses)
    float kE = (1. - smoothstep(150., 250., gL)) * smoothstep(-70., -10., gT) * smoothstep(0., 14., gL) * .92;
    float kgT = kg * (1. - kE);
    st = mix(st, stT, kgT); ha = mix(ha, haT, kgT); bl = mix(bl, bT, kgT);
    // (a slate bed or a shale parting of the stump is a grey line between the others, never a black belt across it in the rain)
    st.rgb = mix(st.rgb, max(st.rgb * (1. + .9 * (1. - smoothstep(.10, .30, dot(st.rgb, vec3(.3333))))), vec3(.135, .108, .092)), kE);
    kEn = kE;
  }
  {
    // and at a stone's throw each of those is seen to be made of thinner ones still, every one of its own colour and hardness:
    // no band of the shoulder is left broad and smooth beside the stepped walls under it
    // (only within a stone's throw: further off they are hairlines, and the shoulder reads as wood grain)
    fineK = kg * (1. - smoothstep(22., 64., dist));
    float tcn = (bT * 3.3 + 53. - uBed.x) * uBed.y;
    vec4 stN = texture2D(uStrata, vec2(tcn, .5));
    float haN = texture2D(uStrata, vec2(tcn + 1.3 * uBed.y, .5)).a;
    ledgeL = mix(haT - stT.a, haN - stN.a, fineK) * kg;
    st = mix(st, vec4(mix(st.rgb, stN.rgb, .68), stN.a), fineK * .85);
    ha = mix(ha, haN, fineK * .85);
  }
  #endif
  #endif
  #endif
  #ifdef FIN
  {
    // toward its outer edge the shoulder takes the Ribbon's own thick beds, so that it meets the ridge in the same colour
    // above the rim the shoulder shows the Ribbon's own dip in thin beds (the wall's beds lie parallel to the face there)
    float kt = smoothstep(.10, .20, vFin.y), tcr = (bRidge - uBed.x) * uBed.y;
    st = mix(st, mix(texture2D(uStrata, vec2(tcr, .5)), stT, kg), kt);
    ha = mix(ha, mix(texture2D(uStrata, vec2(tcr + 1.3 * uBed.y, .5)).a, haT, kg), kt);
    bl = mix(bl, mix(bRidge, bT, kg) / 6.5, kt);
    {
      // the east fin's nose is the end of the stump behind it: the Ribbon's own dipping beds, the same planes and thicknesses
      // as the stump's and the face's, run out to it unbroken (drawn in its thin beds every step of it was a tile of its own colour)
      float kE = kt * smoothstep(0., 14., gL) * .92;
      vec4 stE = texture2D(uStrata, vec2(tcr, .5));
      stE.rgb = max(stE.rgb * (1. + .9 * (1. - smoothstep(.10, .30, dot(stE.rgb, vec3(.3333))))), vec3(.135, .108, .092));      // (a slate bed of the nose is a grey parting between the others, never a black belt)
      st = mix(st, stE, kE);
      ha = mix(ha, texture2D(uStrata, vec2(tcr + 1.3 * uBed.y, .5)).a, kE);
      bl = mix(bl, bRidge / 6.5, kE);
      kEn = kE;
    }
    st.rgb = mix(vec3(dot(st.rgb, vec3(.2126, .7152, .0722))), st.rgb, 1. - .26 * wallK);          // brick stays brick under gold light
    // a slab of the shoulder that lies along the beds is the top of one bed: weathered ochre sandstone, mottled, with the
    // colours of the beds showing only as thin stripes where the surface steps across them
    shK = smoothstep(.06, .14, vFin.y) * max(kg, .85);
    // (how squarely the surface cuts its beds, from the smooth normal: measured per triangle it made every facet a tile of one flat colour)
    riserS = mix(mix(1., smoothstep(.20, .52, length(cross(normalize(vN + vec3(0., 1e-4, 0.)), uNBed))), shK), 1., kEn * .8);      // (the nose's beds show in their own colours on every face of it)
    vec3 tread = mix(vec3(.60, .37, .16), uCream, .25) * (.80 + .40 * vnoise(sp * .31 + 2.)) * (.90 + .20 * vnoise(sp * 1.7 + 4.));
    // a dip slope is crossed by the edges of the thin beds under it: straight stripes of their colours, a stride apart, never a broad band
    float cs = vP.y * 2.4 + gT * .33 + (vnoise(sp * .21) - .5) * .5, cw = fwidth(cs);
    float stripe = (1. - smoothstep(.09 + cw * .6, .15 + cw * 1.3, abs(fract(cs) - .5))) * (1. - smoothstep(.12, .3, cw)) * (1. - smoothstep(20., 55., dist));
    tread = mix(tread, texture2D(uStrata, vec2((floor(cs) * 7.3 - uBed.x) * uBed.y, .5)).rgb * .9, stripe * .7);
    {
      // where the shoulder cuts across its beds each is made of thinner ones still, every one of its own colour and hardness: no band is
      // left broad and smooth above the stepped wall
      float nkF = shK * kg * (1. - smoothstep(22., 64., dist));
      float tcn = (bT * 3.3 + 53. - uBed.x) * uBed.y;
      vec4 stN = texture2D(uStrata, vec2(tcn, .5));
      float haN = texture2D(uStrata, vec2(tcn + 1.3 * uBed.y, .5)).a;
      st = mix(st, vec4(mix(st.rgb, stN.rgb, .68), stN.a), nkF * .85);
      ha = mix(ha, haN, nkF * .85);
    }
    st.rgb = mix(tread, st.rgb, .58 + .42 * riserS);
    // and gullied: a dark thread down the fall line every few metres (near: far off the threads and the beds would weave a tartan),
    // and the floor of every built gully in shade
    float gph = vFin.x * 3., gc = abs(fract(gph) - .5), gwp = fwidth(gph);
    gul = (1. - smoothstep(.07 + gwp * .5, .30 + gwp * 1.4, gc)) * shK * (1. - smoothstep(.12, .3, gwp)) * step(.25, hash21(vec2(floor(gph), 2.))) * (1. - smoothstep(30., 90., dist));
    ledgeSh = .62 * (1. - smoothstep(.03, .26, abs(fract(vFin.x) - .5))) * shK * (1. - smoothstep(.3, .7, fwidth(vFin.x))) * (1. - .7 * smoothstep(30., 95., dist));      // (from across the gap's mouth the built gullies are broad hollows, not bands of shade across the beds)
  }
  #endif
  #ifdef LAND
  {
    // away from the Ribbon the land is another limb of the fold: thinner beds on their own dip, their contacts nearly straight, so
    // that the banks, the spur we climb and the crest under the hooves are ruled in colour and never swirled like wood grain
    float inh = min(min(vP.x + 520., 520. - vP.x), min(vP.z + 170., 350. - vP.z));
    kth = 1. - smoothstep(-90., -10., inh);
    // (every bed runs unbroken: blocks slipped at joints kinked the bands sideways in stair-steps, and the joints drew a tartan over them)
    float bS = (dot(vP, uLandBed) + (vnoise(sp * .045) - .5) * .6 + (vnoise(sp * .29) - .5) * .16 + bFine * .05
      + ((vnoise(sp * 1.9 + 3.) - .5) * .20 + (vnoise(sp * 5.3 + 8.) - .5) * .07) * (1. - smoothstep(.10, .30, steep))) * uLand.w;      // (on gentle ground a contact is a ragged edge a stride long, not a ruled stripe drawn out along the slope)
    float tcs = (bS - uBed.x) * uBed.y;
    vec4 stL = strataAt(tcs);
    float haL = texture2D(uStrata, vec2(tcs + 1.3 * uBed.y, .5)).a;
    // a steep face of the land shows each bed split in two or three, every one of its own colour, as far off as the eye can count them
    float stK = (.7 + .3 * smoothstep(.10, .26, steep)) * (1. - smoothstep(260., 520., dist));
    float tcm = (bS * 1.9 + 91. - uBed.x) * uBed.y;
    vec4 stM = strataAt(tcm);
    float haM = texture2D(uStrata, vec2(tcm + 1.3 * uBed.y, .5)).a;
    stL = mix(stL, vec4(mix(stL.rgb, stM.rgb, .8), stM.a), stK);
    haL = mix(haL, haM, stK);
    // and among the reds, creams and ochres a soft slate shale comes round every few beds
    float slb = smoothstep(.62, .67, vnoise(vec2(bS * .16, 5.)));
    stL = mix(stL, vec4(vec3(.17, .20, .28) * (.85 + .3 * vnoise(vec2(bS * 1.3, 9.))), .25), slb * .85);
    // under a low gold sun every bed leans to orange: the dark beds are held darker and the pale ones paler, so that red, cream, ochre and slate still part
    float lL = dot(stL.rgb, vec3(.2126, .7152, .0722));
    stL.rgb = max(mix(vec3(lL), stL.rgb, 1.2), vec3(0.)) * mix(1., min(.5 + 1.6 * lL, 1.3), .65 * stK);
    {
      // the dark shale between the land's beds, at every contact of its thin-bed table: a crisp parting held a pixel and a half wide
      // on every bank and wall that cuts across the beds (and let go where they crowd, or on the level floor)
      float fwW = fwidth(tcm) * ${BED_N}.;
      float pfW = textureLod(uPart, vec2(tcm, .5), max(0., log2(max(fwW, 1e-4)))).r;
      landPart = min(1., pfW * clamp(fwW * 1.5, 1., 4.5)) * (1. - smoothstep(4., 9., fwW)) * kth;
      #ifndef WING
      landPart *= smoothstep(.06, .22, steep);
      #endif
    }
    // within a stone's throw every bed is seen to be made of thinner ones, each of its own colour
    fineK = (1. - smoothstep(14., 70., dist)) * kth;
    float tcf = (bS * 3.4 + 217. - uBed.x) * uBed.y;
    vec4 stF = strataAt(tcf);
    float haF = texture2D(uStrata, vec2(tcf + 1.3 * uBed.y, .5)).a;
    #ifdef WING
    {
      // the Wing is read from across the wash: under every harder bed a band of shade half a metre deep, along its top a lit lip
      float aUp = texture2D(uStrata, vec2(tcm + 4. * uBed.y, .5)).a, aDn = texture2D(uStrata, vec2(tcm - 3. * uBed.y, .5)).a;
      wingSh = smoothstep(.05, .22, aUp - stM.a) * kth; wingLip = smoothstep(.05, .22, stM.a - aDn) * kth;
      // (round 11, for the cut of the wall below: how hard this bed is, whether this is the top hand of a hard bed with a softer one
      // over it, and a number that is the bed's own)
      wingHard = stM.a; wingId = floor(stM.a * 41. + .5);
      wingTop = smoothstep(.05, .22, stM.a - texture2D(uStrata, vec2(tcm + 1.6 * uBed.y, .5)).a) * kth;
    }
    ledgeL = (haL - stL.a) * kth;                            // on the Wing's wall every bed is one clean band with its own ledge: no thinner beds are ruled inside it
    stL = mix(stL, vec4(mix(stL.rgb, stF.rgb, .40), stL.a), fineK);       // (and near at hand each band is seen to be made of thinner beds of its own colours)
    #else
    ledgeL = mix(haL - stL.a, (haF - stF.a) * 1.3, fineK * .7) * kth;       // positive just under a harder bed: its shade; negative on its lip
    stL = mix(stL, vec4(mix(stL.rgb, stF.rgb, .72), stF.a), fineK * .8 * (1. - .45 * stK) * (1. - .7 * slb));
    #endif
    // (the level floor of the basin, seen from a few hundred metres, keeps the Ribbon's own broad beds: the land's thin ones are
    // finer than a pixel there and average to one mud)
    float kthF = kth * (1. - smoothstep(110., 300., dist) * smoothstep(.88, .97, n.y));
    st = mix(st, stL, kthF);
    ha = mix(ha, haL, kthF);
    bl = mix(b, bS, kthF);
    nBed = normalize(mix(uNBed, uLandBed, kth));
  }
  #endif
  vec3 base = st.rgb;
  float riser = 1.;
  float wash = (1. - smoothstep(1.2, 8., vP.y)) * smoothstep(.80, .96, n.y);
  {
    // thin dark partings between the beds, held to a pixel and a half and let go when they crowd
    #ifdef FIN
    float pl = (bl - bFine * .7) * 2.3 + vnoise(vec2(bl * .9, 2.)) * .5;                 // laminae inside the stepped beds (the steps themselves are built)
    float pk = step(.45, hash21(vec2(floor(pl + .5), 3.1))) * (.3 + .4 * hash21(vec2(floor(pl + .5), 8.7)));
    #else
    float pl = (bl - bFine * .75) * .8 + vnoise(vec2(bl * .31, 2.)) * 1.3;
    float pk = (1. - wash) * step(.36, hash21(vec2(floor(pl + .5), 3.1))) * (.5 + .5 * hash21(vec2(floor(pl + .5), 8.7)));
    #endif
    #ifdef FIN
    // a tread or a dip slope is the top of one bed: its partings and laminae would be drawn out across it like the grain of a plank
    riser = mix(1., smoothstep(.3, .8, fwidth(bl) / max(length(fwidth(vP)), 1e-4)), wallK);
    pk *= riser * riserS;
    #endif
    float pw = fwidth(pl), pc = abs(fract(pl + .5) - .5);
    float parting = (1. - smoothstep(.035 + pw * .6, .06 + pw * 1.3, pc)) * (1. - smoothstep(.22, .5, pw)) * pk;
    base *= 1. - .66 * parting;
    #if !defined(LAND) && !defined(FIN) && !defined(BLOCK)
    {
      // from across the basin the face keeps the dark shale between its beds: each parting is held a pixel and a half wide however
      // thin it stands, and let go only where they crowd
      float fwT = fwidth(tc) * ${BED_N}.;
      float pf = textureLod(uPart, vec2(tc, .5), max(0., log2(max(fwT, 1e-4)))).r;
      float partFar = min(1., pf * clamp(fwT * 1.5, 1., 4.5)) * smoothstep(.5, 1.4, fwT) * (1. - smoothstep(4., 9., fwT));
      base *= 1. - .60 * partFar * (1. - kg);
    }
    #endif
    #ifdef LAND
    base *= 1. - .64 * landPart;
    {
      // the thin beds inside each: a dark line at every other contact, and every lamina of its own tone
      float plf = bl * 1.7 + vnoise(vec2(bl * 1.1, 7.)) * .8;
      float pwf = fwidth(plf), pcf = abs(fract(plf + .5) - .5), idf = floor(plf + .5);
      float pkf = (1. - wash) * step(.30, hash21(vec2(idf, 5.3))) * (.45 + .55 * hash21(vec2(idf, 1.7)));
      base *= 1. - .6 * (1. - smoothstep(.04 + pwf * .6, .07 + pwf * 1.3, pcf)) * (1. - smoothstep(.22, .5, pwf)) * pkf * fineK;
      base *= 1. + (hash21(vec2(floor(plf), 9.1)) - .5) * .26 * fineK * (1. - smoothstep(.25, .6, pwf)) * (1. - wash);
    }
    #endif
  }
  // laminae inside the beds, weathering streaks down the fall line, mottling
  #ifdef FIN
  // (no lamina runs unchanged the length of a wall: they swell and pinch out every few metres, or the beds read as planks)
  float lam = vnoise(vec2(bl * 1.4, gT * .33 + 3.3)) * .6 + vnoise(vec2(bl * 5.5, gT * 1.1 + 9.1)) * .4;
  #else
  float lam = vnoise(vec2(bl * 1.4, 3.3)) * .6 + vnoise(vec2(bl * 5.5, 9.1)) * .4;
  #endif
  float jointK = 0.;
  #ifdef FIN
  base *= .80 + .40 * mix(vnoise(sp * 1.1 + 5.) * .6 + vnoise(sp * 3.1) * .4, lam, riser * riserS);      // a wall at arm's length is all laminae, a tread is mottled
  {
    // the joints: a dark crack down each, the rock beside it shaded where the wall is let in, and every block between two of its own tone
    float wj = max(.045, fwidth(gT) * .9);
    float crack = (1. - smoothstep(wj, wj * 2.2, abs(jDs))) * (1. - .75 * smoothstep(50., 150., dist));
    float bh = hash21(vec2(jBlk, 11.));
    base *= (1. + (bh - .5) * .13 * wallK * (1. - smoothstep(50., 150., dist))) * (1. - .6 * crack * wallK) * (1. - .2 * (1. - smoothstep(.15, 1.5, abs(jDs))) * wallK);
    jointK = (bh - .5) * wallK;
  }
  {
    // at a few metres every bed is ruled in fine laminae: crisp thin lines and plates of slightly different tone
    float fl = bl * 6.7 + vnoise(vec2(bl * 1.9, 5.)) * .7, fwl = fwidth(fl), lid = floor(fl + .5), lh = hash21(vec2(lid, 4.7));
    float keepL = 1. - smoothstep(.18, .5, fwl);
    float ln = (1. - smoothstep(.04 + fwl * .6, .08 + fwl * 1.3, abs(fract(fl + .5) - .5))) * step(.3, lh) * (.3 + .5 * lh) * (.3 + .7 * smoothstep(.35, .6, vnoise(vec2(lid * 3.7, gT * .23))));
    float plate = hash21(vec2(floor(fl), 1.3));
    base *= (1. - .55 * ln * keepL * riser * riserS) * (1. + (plate - .5) * .22 * keepL * riser * riserS);
  }
  {
    // at a horse-length a wall is cut stone, not a band drawn out toward the ring: every bed is laid in courses a forearm thick,
    // each course broken by joints into blocks of its own tone, and the sandstone courses are cross-bedded, leaning one way in
    // one course and the other way in the next
    float sc = bl * 1.6 + vnoise(vec2(bl * .7, gT * .11)) * .35, sid = floor(sc), sf = fract(sc), sw = fwidth(sc);
    float hs = hash21(vec2(sid, 2.9)), hs2 = hash21(vec2(sid, 6.1));
    float jx = gT / (.8 + 1.5 * hs) + hs * 31. + (vnoise(vec2(vP.y * 1.3, sid)) - .5) * .22, jw2 = min(fwidth(jx), 1.), jf = fract(jx);
    float keepS = (1. - smoothstep(.14, .42, sw)) * riser * riserS * wallK;
    float keepJ = keepS * (1. - smoothstep(.14, .42, jw2));
    float bedLine = 1. - smoothstep(.015 + sw * .6, .04 + sw * 1.4, min(sf, 1. - sf));
    float crkJ = 1. - smoothstep(.010 + jw2 * .6, .025 + jw2 * 1.4, min(jf, 1. - jf));
    float toneJ = hash21(vec2(floor(jx), sid * 1.7 + 4.));
    base *= (1. - .40 * bedLine * keepS) * (1. - .24 * crkJ * keepJ) * (1. + (toneJ - .5) * .20 * keepJ);      // (the joints are faint and no cross-bed is ruled: drawn strongly a wall read as brickwork under a hatch of thin lines)
    ledgeSh = max(ledgeSh, .35 * bedLine * keepS);
  }
  {
    // on the shoulders every hard bed throws a line of shade on the soft one under it and takes the light on its own lip
    float shk = step(.05, vFin.y) * (1. - smoothstep(180., 420., dist)), shF = smoothstep(30., 95., dist);
    base *= (1. - mix(.22, .34, shF) * shk * smoothstep(.05, .30, ha - st.a)) * (1. + mix(.18, .34, shF) * shk * smoothstep(.05, .30, st.a - ha));
    ledgeSh = max(ledgeSh, mix(.58, .72, shF) * shk * smoothstep(.05, .30, ha - st.a));
  }
  #else
  base *= mix(1., .80 + .40 * lam, .35 + .65 * mid);
  #endif
  #ifdef FIN
  float streak = vnoise(vec2(gT * .5 + vnoise(vec2(gT * .13, vP.y * .2)) * 1.5, vP.y * .2));        // weathering runs down the wall, not along it
  #else
  float streak = vnoise(vec2(vP.x * .55, vP.z * .035 + vP.y * .05));
  #endif
  base *= (.90 + .20 * streak) * (1. - .30 * gul);      // (a gully on the shoulder is a soft hollow of shade, never a hairline)
  #ifdef FIN
  // no facet of a shoulder is left one flat colour: soft hollows with a dark thread down each, a stride or two apart, and broad weathering blotches
  vec4 rlS = rills(vP * 1.1, sd);
  base *= (1. - .26 * shK * rlS.x) * mix(1., .80 + .40 * vnoise(sp * .09 + 7.), shK);
  #endif
  #ifdef FIN
  float softb = (1. - smoothstep(.3, .62, st.a)) * near;
  vec2 rq = vec2(gT * 2.1 + vnoise(vec2(gT * .45, vP.y * .3)) * 1.6, vP.y * .13);
  float rl0 = vnoise(rq), rl1 = vnoise(rq + vec2(.3, 0.));
  base *= 1. - .30 * softb * smoothstep(.48, .78, rl0);                  // soft beds weather into rills down the fall line
  #endif
  base *= .93 + .14 * vnoise(sp * 1.9);
  base *= .84 + .32 * fbm3(sp * .013 + 4.);
  #if !defined(LAND) && !defined(FIN) && !defined(BLOCK)
  // the Ribbon's own slope close beside us is weathered rock, not a band of colour drawn out along it: pitted and mottled at arm's length
  // (the broad mottle carries to the far side of the gap, where the shoulders are seen a hundred metres off down the drop; the pitting only close by)
  base *= 1. + (vnoise(sp * 2.9 + 3.) - .5) * .30 * (1. - smoothstep(50., 150., dist)) + (vnoise(sp * 8.3 + 1.) - .5) * .20 * (1. - smoothstep(25., 80., dist))
    + (vnoise(sp * .9 + 6.) - .5) * .22 * (1. - smoothstep(110., 260., dist));
  #endif
  vec2 wt = wetAt(vP);
  float wet = wt.x;
  float washK = wash * .85, rivF = 0.;
  #ifdef LAND
  {
    // far off, the soaked floor of the basin is not one pale sheet of wash sand: the beds it is cut across show through it as broad
    // bands of their own colour, and behind the line red-brown threads run over it. (A thread is an open line, the level of a
    // coordinate that only grows across the flow: it wanders, braids with its neighbour and gives out, and is drawn a pixel and a
    // half wide however far off it lies.)
    float farF = smoothstep(60., 210., dist) * smoothstep(.86, .97, n.y);
    washK *= 1. - .64 * wet * farF;
    vec2 fdr = vec2(.3396, .9406);
    float al = dot(vP.xz, fdr), ac = dot(vP.xz, vec2(fdr.y, -fdr.x));
    float fr0 = ac / 31. + (vnoise(vec2(al / 85., ac / 120.)) - .5) * 2.6 + (vnoise(vec2(al / 19. + 3., ac / 47.)) - .5) * .42;
    float fwr = min(fwidth(fr0), 1.), rid = floor(fr0), rc = abs(fract(fr0) - .5);
    float ron = step(.26, hash21(vec2(rid, 4.1))) * smoothstep(.30, .50, vnoise(vec2(rid * 3.17, al / 140. + 2.)));
    float rhw = max(.026 + .022 * vnoise(vec2(al / 30., rid * 1.7)), fwr * .8);
    rivF = (1. - smoothstep(rhw * .55, rhw * 1.15, rc)) * ron * (1. - smoothstep(.22, .55, fwr)) * clamp(.045 / max(rhw, 1e-4), .4, 1.)
      * smoothstep(.88, .97, n.y) * smoothstep(40., 110., dist) * (1. - smoothstep(5., 14., vP.y));
  }
  #endif
  base = mix(base, uWash * (.85 + .3 * vnoise(vP.xz * .21)), washK);
  // detail normal: cracked crust and rills near, bedding micro-ledges
  vec2 dp = vP.xz * .9 + vP.y * .43;
  float e0 = vnoise(dp), ex = vnoise(dp + vec2(.35, 0.)), ez = vnoise(dp + vec2(0., .35));
  vec2 dq = vP.xz * vec2(.33, .08);
  float f0 = vnoise(dq), fx = vnoise(dq + vec2(.3, 0.));
  float near2 = 1. - smoothstep(6., 55., dist);
  vec2 gp = sp * 3.3;
  float g0 = vnoise(gp), gx = vnoise(gp + vec2(.4, 0.)), gz = vnoise(gp + vec2(0., .4));
  base *= 1. + (g0 - .5) * .22 * near2;
  #ifdef FIN
  base *= 1. - .2 * smoothstep(.58, .8, vnoise(sp * 6.1 + 3.)) * near2 * wallK;      // pitted, at arm's length
  #endif
  n.xz += (vec2(ex, ez) - e0) * (.55 * near) + vec2(fx - f0, 0.) * (.38 * mid * (1. - n.y * n.y)) + (vec2(gx, gz) - g0) * (.5 * near2);
  n += nBed * ((lam - .5) * .5 * near + (st.a - .5) * .12 + (st.a - ha) * (.35 + 1.5 * steep) * mid);
  #ifdef FIN
  float farS = smoothstep(30., 95., dist) * shK;          // a shoulder seen from across the mouth of the gap
  n.xz += (vec2(vnoise(sp * .37 + 1.7), vnoise(sp * .37 + 9.3)) - .5) * (.55 * shK * (1. - .8 * farS)) + (vec2(vnoise(sp * 1.3 + 4.1), vnoise(sp * 1.3 + 7.7)) - .5) * (.35 * shK * near);
  // from there it is a stepped hill: every hard bed a riser that stands up to the light, every soft one a tread lying back under the sky
  // (the lumps of a slab at arm's length are let go: lit lump by lump the hill was a crumple)
  n = normalize(n + (vec3(sd.x, 0., sd.y) * .75 - vec3(0., .45, 0.)) * ((st.a - .5) * 1.1 * farS));
  base *= 1. - .22 * shK * smoothstep(.55, .8, vnoise(sp * 2.3 + 6.)) * near;
  n += vec3(uFinA.x, 0., uFinA.y) * ((rl1 - rl0) * 1.6 * softb + jointK * .22) + vec3(rlS.z, 0., rlS.w) * (rlS.y * 1.3 * shK);
  #endif
  n = normalize(n);
  float pud = 0., gmul = 1., pebK = 0., gapK = 0., printK = 0., damp = 0., crk2ring = 1., plateG = 1.;
  #ifdef LAND
  {
    gapK = (1. - smoothstep(uFinC.y - 16., uFinC.y + 14., gT)) * (1. - smoothstep(uFinC.x + 4., uFinC.x + 9., abs(gL))) * step(-260., gT);
    // the ground at the lens: cracked popcorn crust on the flats, a lag of dark varnished pebbles, drift lines in the wash
    float flatg = smoothstep(.84, .97, n.y);
    float fine = 1. - smoothstep(6., 46., dist);
    vec2 cq = vP.xz * 3.1 + vec2(vnoise(vP.xz * 1.3), vnoise(vP.zx * 1.3 + 3.)) * 1.1;
    // metres a pixel covers on the ground: the mean of its long and its short side. (Judged by the long side alone, everything drawn
    // on the ground was let go a few strides ahead of the hooves, and the crest ran on bare and smooth)
    vec2 gdx = dFdx(vP.xz), gdy = dFdy(vP.xz);
    float fpa = length(gdx), fpb = length(gdy), fwc = sqrt(max(fpa, fpb) * min(fpa, fpb) + 1e-9);
    float keepP = 1. - smoothstep(.035, .12, fwc), keepH = 1. - smoothstep(.10, .34, fwc);
    // the clay cracks in polygons of three sizes (a hand, a stride, a horse-length): each is drawn as wide as a pixel needs and let
    // go only where its own cracks crowd, so the cracks that run away from us still rule the ground far ahead of the hooves
    vec2 wq2 = vec2(vnoise(vP.xz * 1.3), vnoise(vP.zx * 1.3 + 3.));
    vec2 wq3 = vec2(vnoise(vP.xz * .45 + 1.), vnoise(vP.zx * .45 + 5.));          // a slow bend only: clay breaks in straight-sided plates
    vec2 c1 = crackCell(cq), c2 = crackCell(vP.xz * .78 + wq3 * .55 + 7.);
    float f1 = fwc * 3.1, f2 = fwc * .78, f3 = fwc * .23;
    float keepC = 1. - smoothstep(.22, .6, f1), keep2 = 1. - smoothstep(.11, .32, f2), keep3 = 1. - smoothstep(.20, .55, f3);      // (a stride-sized plate is let go while it is still four pixels across: beyond that its cracks would be lone thin arcs on the ground)
    float crk = 1. - (1. - smoothstep(.035, .06 + f1 * 1.1, c1.x)) * clamp(.12 / (f1 + 1e-4), .3, 1.), pid = c1.y;      // (crisp, like the larger plates: drawn as a soft dark band it was a blurred net)
    // a crack keeps its own width; where a pixel is wider than the crack the line thins to grey instead of swelling into a black band
    float crk2 = 1. - (1. - smoothstep(.028, .043 + f2 * 1.1, c2.x)) * clamp(.10 / (f2 + 1e-4), .30, 1.);
    float crk3 = 1.;                                             // (the horse-length polygons drew thin dark arcs across whole slopes: no line is drawn for them any more)
    float crust = flatg * (1. - wash) * fine * (1. - gapK);
    float clay = flatg * max(1. - wash, gapK) * (1. - smoothstep(30., 120., dist));
    base = mix(base, mix(base, uCream, .10) * (.9 + .2 * vnoise(vP.xz * .9 + 31.)), crust);
    gmul *= mix(1., (.52 + .48 * crk) * (.86 + .28 * pid), max(crust, gapK * flatg * fine * .8) * keepC);
    float cdk = mix(.50, .34, gapK);
    gmul *= mix(1., (cdk + (1. - cdk) * crk2) * (.84 + .32 * c2.y + .22 * gapK * (c2.y - .5)) * (1. + .12 * (1. - smoothstep(.08, .32, c2.x))), clay * keep2);       // plates curl: a pale lip beside each crack
    crk2ring = mix(1., crk2 * crk3, clay);
    // every plate dries at its own pace: some shine with the sky, their neighbours are already matt, and no crack shines at all
    plateG = mix(1., (.12 + .88 * smoothstep(.35, .65, c2.y)) * crk2, clay * keep2);
    float drift = vnoise(vec2(dot(vP.xz, vec2(.28, .12)), dot(vP.xz, vec2(-1.3, 3.1))));
    base *= 1. + (drift - .5) * .3 * wash * (1. - smoothstep(10., 90., dist));
    float flush = uLand.x * max(wash, flatg * .35) * smoothstep(.34, .62, fbm3(vP.xz * .03 + 9.));
    base = mix(base, vec3(.17, .26, .10) * (.7 + .6 * vnoise(vP.xz * .55)), flush * .8);
    float patchy = .30 + .70 * vnoise(vP.xz * .4 + 5.);
    // the lag gathers along the strike of the beds: bands of dark gravel cross the crest as striped scree
    float lagB = .45 + .55 * smoothstep(.35, .65, vnoise(vec2(bl * 1.9, 4.2)));
    pebK = max(smoothstep(.74, .82, vnoise(vP.xz * 7.3 + 2.)) * keepP, smoothstep(.80, .86, vnoise(vP.xz * 2.9 + 9.)) * keepC * .8) * flatg * fine * patchy * lagB * (1. - .5 * gapK);
    n = normalize(n + vec3(1., 0., 1.) * ((crk - .7) * .16 * crust + (crk2 - .8) * .22 * clay * keep2));
    #ifdef STRIP
    {
      // hoof prints and churned trails where the herd runs
      float lane = 1. - smoothstep(8., 15., abs(vSL.y));
      vec2 hq = vec2(vSL.y * 1.7, vSL.x * 1.05), hi = floor(hq);
      vec2 hc = (fract(hq) - vec2(.28 + .44 * hash21(hi + 9.1), .28 + .44 * hash21(hi + 5.3))) / vec2(1.7, 1.05);
      float rr = length(hc * vec2(1., .82));
      float hk = step(hash21(hi + 3.7), lane * .52) * keepH * fine * flatg;
      rr *= .8 + .5 * hash21(hi + 1.9);
      printK = (1. - smoothstep(.06, .10, rr)) * hk;
      float rim = smoothstep(.09, .12, rr) * (1. - smoothstep(.12, .17, rr)) * hk;
      float trail = smoothstep(.42, .7, vnoise(vec2(vSL.y * 1.2, vSL.x * .3))) * lane * flatg * (1. - smoothstep(14., 40., dist));      // (short scuffs, close by: drawn 30 m long they were streaks stretched along the slope)
      gmul *= (1. - .5 * printK) * (1. + .14 * rim) * (1. - .10 * trail);
      n = normalize(n + vec3(hc.x, 0., hc.y) * (printK * 1.7));
    }
    #endif
    // puddles lie in the hollows of the big polygons, with a sharp shore and a dark damp margin
    // (standing water only round us, within about a hundred metres, and gathered in the lower hollows as a few pools of unequal
    // size: drawn to the horizon at one size the pools were a field of dark dashes over the whole basin)
    float pfar = 1. - smoothstep(52., 112., dist);
    float plf = vnoise(vP.xz * .13 + 3.7), pgate = mix(smoothstep(.47, .60, plf), 1., gapK);       // (pools gather where the floor lies lowest: a few, of unequal size, with a wavering shore)
    float pn = vnoise(vP.xz * .42 + 11.) + (c2.y - .5) * .10 * clay - .07 * gapK + ((plf - .5) * .07 + (vnoise(vP.xz * 1.9 + 5.) - .5) * .03) * (1. - gapK);
    pud = smoothstep(.672, .70, pn) * smoothstep(.93, .985, n.y) * (1. - uBed.z) * pfar * pgate;
    damp = smoothstep(.60, .672, pn) * flatg * pfar * pgate;
  }
  #endif
  #ifdef LAND
  {
    // rills down the fall line of every gentle slope of the land (never the Ribbon: its baked normals are too coarse to steer them)
    // (slopes only: on the flats the fall line wanders, and the threads swung round into arcs across the crest)
    float rk = smoothstep(.10, .30, steep) * (1. - smoothstep(.5, .72, steep)) * (1. - smoothstep(80., 420., dist));
    #ifdef WING
    rk = 0.;
    #endif
    vec4 rl = rills(vP, sd);
    base *= 1. - rk * .50 * rl.x;
    n = normalize(n + vec3(rl.z, 0., rl.w) * (rl.y * 1.5 * rk));
  }
  #endif
  #if !defined(LAND) && !defined(FIN) && !defined(BLOCK)
  {
    // the shoulders of the gap at a stone's throw: a line of shade under every hard thin bed, light on its lip, a gully thread every few metres
    vec4 rl = rills(vP, sd);
    float rk = fineK * smoothstep(.08, .30, steep);
    float lkR = kg * (1. - smoothstep(120., 380., dist));
    base *= (1. - .30 * lkR * smoothstep(.04, .24, ledgeL)) * (1. + .24 * lkR * smoothstep(.04, .24, -ledgeL)) * (1. - rk * .50 * rl.x);
    ledgeSh = .60 * lkR * smoothstep(.04, .24, ledgeL) * smoothstep(.08, .30, steep);
    n = normalize(n + vec3(rl.z, 0., rl.w) * (rl.y * 1.2 * rk));
  }
  #endif
  float relief = clamp((st.a - ha) * 2.2, -1., 1.) * steep * mid * (1. - .72 * kEn);      // (under the lip of a bed of the stump and of the nose the shade is a soft line: drawn at full depth it was a ruled black one from end to end)
  float joint = smoothstep(.60, .72, vnoise(vec2((vP.x + vP.z) * .8, vP.y * .05))) * smoothstep(.45, .8, steep) * mid;
  base *= (1. + relief * .9) * (1. - .14 * joint);      // (faint: drawn dark, these streaks crossed the beds of the gap's shoulders as a hatch of hairlines)
  #ifdef LAND
  {
    // every harder bed of the land stands a hand proud of the one under it: a line of shade below its lip, light on the lip itself
    float lk = (1. - smoothstep(90., 300., dist)) * (1. - wash) * (1. - gapK);
    #ifdef WING
    lk = 1. - smoothstep(240., 520., dist);                  // the Wing's ledges are read from across the wash
    base = mix(base, base * vec3(.66, .84, 1.24), .85 * lk * wingSh) * (1. - .20 * lk * wingSh) * (1. + .40 * lk * wingLip);
    ledgeSh = max(ledgeSh, .9 * lk * wingSh * smoothstep(.05, .22, steep));
    {
      // THE WALL IS CUT ROCK, not painted cloth. Every hard bed stands proud as a ledge: its face is a riser turned up to the low
      // sun, its top hand a lit lip, and the soft bed under it lies back in its shade (above); the hard beds are broken by joints
      // into blocks a stride or two long, each of its own tone. All of it in the wall's own coordinates (metres along its foot,
      // the bed's own number), so nothing is drawn out down the dip
      float hk = smoothstep(.38, .62, wingHard);
      n = normalize(n + (vec3(sd.x, 0., sd.y) * .8 - vec3(0., .5, 0.)) * ((wingHard - .5) * 1.5 * lk * kth));
      base *= (1. + .55 * lk * wingTop) * mix(.87, 1.07, hk);
      float jx = vWL.x / (1.7 + 2.6 * hash21(vec2(wingId, 3.3))) + hash21(vec2(wingId, 9.1)) * 23. + (vnoise(vec2(vWL.y * .9, wingId)) - .5) * .25;
      float jw = min(fwidth(jx), 1.), jf = fract(jx), jc = min(jf, 1. - jf), jkeep = (1. - smoothstep(.15, .45, jw)) * hk * lk * kth;
      float crackJ = (1. - smoothstep(.012 + jw * .6, .03 + jw * 1.4, jc)) * jkeep;
      base *= (1. - .5 * crackJ) * (1. + (hash21(vec2(floor(jx), wingId * 1.7 + 4.)) - .5) * .18 * jkeep);
    }
    {
      // and the wall is gullied: every fifteen to twenty metres along its foot a cleft two to three metres wide runs down the face,
      // one side of it turned to the sun and the other away, its floor in shade (in the wall's own metres; it wanders a little
      // as it comes down, and the seam of the count lies midway between two clefts, where nothing is drawn)
      float gq = vWL.x / 17.5 + (vnoise(vec2(vWL.y * .06, 3.)) - .5) * .22 + (vnoise(vec2(vWL.y * .31, 7.)) - .5) * .05;
      float gcl = fract(gq) - .5, gwd = .055 + .05 * hash21(vec2(floor(gq), 6.1));
      float ga = clamp(gcl / gwd, -1., 1.), gin = (1. - smoothstep(.45, 1., abs(ga))) * lk * kth * smoothstep(1., 5., vWL.y);
      n = normalize(n + vec3(sd.y, 0., -sd.x) * (sin(ga * 3.1416) * .85 * gin));
      float gfl = (1. - smoothstep(0., .55, abs(ga))) * gin;
      base *= 1. - .22 * gfl;
      ledgeSh = max(ledgeSh, .78 * gfl);
    }
    {
      // at a stone's throw the wall is weathered clay and not silk. Three things, all in the wall's own coordinates and each let go
      // where a pixel grows wider than it: the wall is fluted by rain into soft runnels down the fall line, half a metre apart,
      // each with a lit and a shaded side (shading, never a drawn line: hairlines over the beds read as a net laid on the picture);
      // a crumbled crust of clods two hands across, each of its own tone; and the grain of the clay itself. The beds keep their
      // colours and their clean edges
      vec2 wf = fwidth(vWL);
      float wpx = max(wf.x, wf.y);
      float gk = 1. - smoothstep(40., 160., dist);
      // (round 11: the runnels are cut in the SOFT beds only, each bed's its own and none longer than the bed is thick: run from the
      // crest to the toe across every bed, a hand apart and nine metres long, they were a grain drawn out down the dip)
      vec2 rq = vec2(vWL.x * 1.7 + wingId * 3.7 + (vnoise(vWL * vec2(.23, .15)) - .5) * 1.6, vWL.y * .36);
      float rfade = gk * (1. - smoothstep(.22, .60, wf.x * 1.7)) * (.35 + .65 * smoothstep(.30, .60, vnoise(vWL * vec2(.05, .07) + 13.))) * (1. - smoothstep(.38, .62, wingHard));
      float r0 = vnoise(rq) + .45 * vnoise(rq * vec2(2.3, 1.7) + 5.), r1 = vnoise(rq + vec2(.22, 0.)) + .45 * vnoise((rq + vec2(.22, 0.)) * vec2(2.3, 1.7) + 5.);
      float flute = clamp((r1 - r0) * 4.2, -1., 1.) * rfade;      // the slope across a runnel: one side turned to the light
      float hollow = (1. - smoothstep(.25, .55, r0 / 1.45)) * rfade;      // and its floor a little darker and damper
      vec2 cc = crackCell(vWL * vec2(2.3, 1.9) + 3.);
      float ck = gk * (1. - smoothstep(.10, .34, wpx * 2.3));
      float grn = (vnoise(vWL * 11.) - .5) * (1. - smoothstep(.04, .10, wpx)) + (vnoise(vWL * vec2(1.1, .7) + 9.) - .5) * .8;
      base *= (1. + .26 * flute) * (1. - .16 * hollow) * mix(1., .93 + .14 * cc.y, ck) * (1. + .12 * grn * gk);
      n = normalize(n + vec3(sd.y, 0., -sd.x) * (flute * .5));
    }
    #else
    base *= (1. - .30 * lk * smoothstep(.04, .24, ledgeL)) * (1. + .26 * lk * smoothstep(.04, .24, -ledgeL));
    ledgeSh = max(ledgeSh, .62 * lk * smoothstep(.04, .24, ledgeL) * smoothstep(.05, .22, steep));
    #endif
  }
  #endif
  // weather
  float kW = keyAt(vP);
  float key = kW * t1.a;
  #ifdef FIN
  key = mix(kW, 1., .75) * t1.a;
  #endif
  key *= 1. - ledgeSh;
  #ifdef SHADOWPASS
  key = 0.;
  #endif
  pud *= smoothstep(20., 80., wt.y) * uLand.y;
  damp *= smoothstep(20., 80., wt.y) * uLand.y * (1. - pud);
  float reveal = smoothstep(105., 135., wt.y);
  float run = riv * reveal;
  // dry is ONE state, the same at every moment of the flight: each bed in its own pastel (brick, ochre, cream, sage, slate), lifted
  // toward chalk but with its dark partings kept. wet: the same bed, darker and far more saturated
  float lum = dot(base, vec3(.2126, .7152, .0722));
  float lumK = smoothstep(.015, .09, lum);
  vec3 dry = mix(max(mix(vec3(lum), base, 1.22), vec3(0.)), uCream, .08 + .40 * lumK);
  #if !defined(LAND) && !defined(FIN) && !defined(BLOCK)
  {
    // the far face: the chalk it is lifted toward is nearly white (a yellow chalk turned every bed tan), and each bed keeps more of its own hue
    vec3 chalkC = mix(uCream, vec3(dot(uCream, vec3(.2126, .7152, .0722))) * 1.03, .46);
    dry = mix(max(mix(vec3(lum), base, 1.52), vec3(0.)), chalkC, .05 + .37 * lumK);
  }
  #endif
  // wet rock is darker and deeper in colour, but never past brick, ochre, sage and slate
  // (ONE state, the same under the cloud and in the sun: a soaked bed is no deeper for standing in shadow. Under the cloud the
  // grey light leaves it dim and cool; behind the cloud's edge the same colour stands in the warm key, brighter and deeper)
  vec3 wetc = capSat(max(mix(vec3(lum), base, 1.33), vec3(0.)) * .64, .70);
  #ifdef LAND
  wetc = capSat(max(mix(vec3(lum), base, 1.22), vec3(0.)) * .70, .59);        // the ground under the hooves keeps a quieter colour than the Ribbon
  dry = mix(max(mix(vec3(lum), base, 1.30), vec3(0.)), uCream, .05 + .24 * lumK);      // and the land is bolder than the far face: its colour is there from the first stride
  {
    // within a stone's throw the wetted crust is the mud of the beds it lies on: brick, and sage in the hollows
    float fk = smoothstep(.84, .97, n.y) * (1. - smoothstep(50., 150., dist));
    vec3 bs = mix(vec3(.31, .105, .068), vec3(.165, .205, .125), smoothstep(.50, .66, vnoise(vP.xz * .085 + 4.)));
    float fresh = 1. - smoothstep(40., 140., wt.y);          // just behind the line the crust is at its darkest and deepest; the sheen comes later
    wetc = mix(wetc, bs * mix(.8 + lum, .62 + .7 * lum, fresh), mix(.36, .72, fresh) * fk);
  }
  #endif
  #ifdef FIN
  wetc = mix(capSat(wetc, .74), capSat(base * .56, .56), wallK);
  #endif
  vec3 alb = mix(dry, wetc, wet);
  #ifdef LAND
  // churned wet mud between the fins; pebbles and crust cracks keep their own darkness in the dry state
  // (wet clay the colour of the beds it was washed from: brick-brown plates, each of its own tone, sage and ochre silt in the hollows)
  vec3 mudc = mix(vec3(.215, .112, .070), mix(vec3(.20, .13, .06), vec3(.12, .13, .10), smoothstep(.4, .6, vnoise(vP.xz * .11 + 2.))), smoothstep(.52, .70, vnoise(vP.xz * .19 + 8.)) * .7);
  alb = mix(alb, mudc * (.88 + .12 * vnoise(vP.xz * .35 + 5.) + .2 * vnoise(vP.xz * 2.3)) * (1. + (vnoise(vP.xz * 8.) - .5) * .7 * near2 * near2), gapK * smoothstep(.8, .95, n.y));
  alb *= gmul * (1. - .32 * damp);
  alb = mix(alb, vec3(.075, .062, .055) * (1. + 1.2 * vnoise(vP.xz * 23.)), pebK * .82);
  #endif
  alb = mix(alb, vec3(dot(alb, vec3(.3333))) * vec3(.80, .90, 1.12), .5 * uFinC.w);       // moonlight keeps little of the colour
  float flow = .55 + .45 * sin(vP.y * 1.7 + vnoise(vP.xz * .6) * 9. + uTime * 7.);
  #ifdef FIN
  alb *= 1. - .28 * stainK * reveal;
  alb = mix(alb, uMud * (mix(.44, .50, wallK) + .20 * flow), run * .92);           // a rivulet is a dark wet thread of the red mud it carries, darker than any bed it crosses
  alb = mix(alb, mix(uMud * 2.1, vec3(.88, .89, .87), clamp(.5 + .7 * veil, 0., 1.)), veil * reveal);
  #else
  alb = mix(alb, alb * .42 + uMud * (.22 + .12 * flow), run * .85);        // on the face a rivulet is the rock's own colour, darker and redder
  #endif
  #ifdef LAND
  float runF = rivF * reveal * (1. - uBed.z);
  alb = mix(alb, uMud * (.44 + .13 * vnoise(vP.xz * .7 + vec2(0., uTime * .6))), runF * .86);      // the threads on the flats carry the red mud of the beds
  #endif
  // snow squall: the line rules every upward ledge in white
  float snow = uBed.z * smoothstep(-.7, .7, wt.y) * smoothstep(.80, .93, n.y + (st.a - .5) * .12) * (1. - run);
  alb = mix(alb, vec3(.80, .84, .90), snow);
  float gloss = max(wet * (1. - snow) * (.35 + .65 * st.a), run) * (1. - veil);
  #ifdef LAND
  gloss *= (.4 + .6 * max(gapK, printK * wet)) * plateG * (1. - .45 * gapK);
  gloss = max(gloss, runF * .34);
  #endif
  // light
  float ndl = max(dot(n, uSun), 0.);
  float wrap = max(dot(n, uSun) * .5 + .5, 0.);
  vec3 sunc = uSunCol;
  vec3 sky = uSkyCol * (.30 + .70 * (n.y * .5 + .5)) * ao;
  vec3 bounce = uBounce * (1. - n.y) * (.35 + .65 * key) * ao * wrap;
  #if !defined(LAND) && !defined(FIN) && !defined(BLOCK)
  float dryK = (1. - wet) * (1. - uFinC.w) * (1. - snow);
  // the dry face in the low sun: a flute's sunward side is the SAME bed, lighter (the key is rounded off, so no wall of a flute goes
  // out to a pale wedge), the light on it is whiter than the sun itself (a deep orange sun turned brick, ochre and sage into one
  // tan), and the shadow in every flute is the slate-blue of the sky, not the brown of the wall opposite
  ndl = mix(ndl, .60 * (1. - exp(-2.5 * ndl)), dryK);
  sunc = mix(sunc, vec3(dot(sunc, vec3(.2126, .7152, .0722))) * vec3(1.03, 1., .95), .60 * dryK) * mix(1., .50, dryK);
  // (the face looks away from the low sun: most of it stands in open shade. That shade is bright and nearly white, so brick is
  // brick and sage is sage in it; only deep in a flute does it go to slate-blue)
  float fluteSh = (1. - key) * dryK, deepSh = fluteSh * (1. - smoothstep(.40, .85, ao));
  sky = mix(sky, vec3(dot(sky, vec3(.3333))) * vec3(.95, .98, 1.07), .75 * dryK) * (1. + .85 * dryK);
  sky = mix(sky, vec3(dot(sky, vec3(.3333))) * vec3(.60, .84, 1.30), .70 * deepSh);
  alb = mix(alb, vec3(dot(alb, vec3(.3333))) * vec3(.66, .86, 1.24), .40 * deepSh);
  // in a wet flute the shaded wall shines with the light of the sunlit wall opposite: the soaked bands blaze in the sun patch
  bounce += uSunCol * vec3(1., .80, .58) * (mix(.025, .15, wet) * kW * (1. - t1.a) * ao * (1. - uFinC.w));
  #endif
  #ifdef FIN
  {
    // open shade between the fins: more sky, and warm light thrown back by the sunlit wall opposite
    float away = (1. - smoothstep(-.15, .25, dot(normalize(vec3(-uFinA.y, .35, uFinA.x) * vec3(sign(gL), 1., sign(gL))), uSun))) * wallK;      // one answer for a whole wall
    alb = mix(alb, vec3(dot(alb, vec3(.3333))) * vec3(.56, .80, 1.30), .64 * away * (1. - uFinC.w));    // the shaded wall cools toward slate-blue but keeps every bed's own colour
    alb = mix(alb, max(mix(vec3(dot(alb, vec3(.3333))), alb, 1.45), vec3(0.)), away * (1. - uFinC.w)) + vec3(.012, .014, .02) * away;
    float up = n.y * .5 + .5;
    sky = mix(sky, uSkyCol * ((.14 + .86 * up * up) * ao * uFinC.z * 1.3), wallK) + uSunCol * vec3(1., .80, .58) * (.085 * ao * away * (1. - uFinC.w));      // treads take the sky, risers much less
    sunc *= mix(vec3(1.), vec3(.97, .86, .70), (1. - uFinC.w) * wallK);                                              // and the lit one to gold
    sky += uSkyCol * (veil * reveal * .55);
  }
  #endif
  #ifdef LAND
  sky = sky * mix(1., uFinC.z, gapK) * (1. + .30 * wet * (1. - gapK)) + uSunCol * (.10 * gapK * (1. - uFinC.w));      // wet ground under the cloud holds the grey light of the sky: never black
  #endif
  // whatever stands in deep shade is still reached by the glow of the sky and of the lit land around it: a floor under the light, in a
  // warm neutral that keeps each bed's own colour, and none of it where the rock is lit already (it would wash the Ribbon to pastel)
  vec3 irr = sunc * (ndl * key) + sky * (1. + .45 * ledgeSh) + bounce;
  float fillK = 1. - smoothstep(.10, .38, dot(irr, vec3(.3333)));
  #ifdef FIN
  fillK *= 1. - wallK;
  #endif
  #ifdef LAND
  fillK = max(fillK, wet * .8 * (1. - ndl * key)) * (1. - gapK);      // (soaked ground is dark in itself: it takes the glow wherever the sun is off it)
  #endif
  fillK *= (.45 + .55 * ao) * (1. - .6 * uFinC.w);
  // (the glow is thrown by lit land, and under the shower's own cloud no land round a place is lit: there the cloud's grey sky is
  // the one lamp (uSkyCol carries it), and of the glow only the sixth is left that the sunlit land beyond the shadow's edges sends
  // in under it. So the land under the cloud is dim and cool, and what the sun reaches behind the cloud's edge stands out of it)
  fillK *= 1. - .85 * showerAt(vP).x;
  vec3 fillC = dot(uSkyCol, vec3(.3333)) * vec3(.62, .55, .47) + uSkyCol * .25 + uSunCol * vec3(.050, .040, .029);
  #if !defined(LAND) && !defined(FIN) && !defined(BLOCK)
  fillC = mix(fillC, dot(uSkyCol, vec3(.3333)) * vec3(.60, .62, .68) + uSkyCol * .15, .85 * dryK);
  #endif
  irr += fillC * fillK;
  vec3 col = alb * irr;
  vec3 hv = normalize(uSun + V + vec3(0., 1e-3, 0.));
  float ndh = max(dot(n, hv), 1e-4);
  float glk = 1. - smoothstep(60., 240., dist);                 // far off a thread is a dark line; its glints are for the near ones
  float spec = pow(ndh, 42.) * 1.5 + pow(ndh, 200.) * 2.4 * run * smoothstep(.86, .97, flow) * glk;
  float fres = 1. - max(dot(n, V), 0.);
  fres = fres * fres * fres;
  col += uSunCol * (spec * key * gloss * step(1e-3, ndl));
  #ifdef FIN
  col += uSkyCol * ((fres * gloss * .26 + run * (.03 + .10 * smoothstep(mix(.93, .90, wallK), .99, flow))) * ao);        // the thread glints the sky in short dashes
  #else
  col += uSkyCol * ((fres * gloss * .9 + run * (.04 + .45 * smoothstep(.88, .98, flow) * glk)) * ao);
  #endif
  #ifdef LAND
  {
    // puddles on the flats behind the line: sky, rain rings, a low sun glint; between the fins they hold the walls too
    vec2 rq = vP.xz * 1.9, rc = fract(rq) - .5, rid = floor(rq);
    float rl = length(rc), rph = fract(uTime * .8 + hash21(rid) * 7.);            // one drop a cell: its ring widens and dies
    float ring = (1. - smoothstep(.02, .10, abs(rl - .42 * rph))) * (1. - rph) * step(.35, hash21(rid + 3.1)) * uShade2.z * (1. - smoothstep(.015, .05, max(fwidth(vP.x), fwidth(vP.z))));
    vec3 pcol = uSkyCol * (mix(.50, .24, gapK) + .55 * ring + mix(.40, .16, gapK) * fres) + uSunCol * (key * pow(max(dot(normalize(vec3(ring * .04, 1., 0.)), hv), 0.), 90.) * 1.2);
    vec3 R = reflect(-V, normalize(vec3(ring * .03, 1., ring * .02)));
    vec2 acr = vec2(uFinA.y, -uFinA.x);
    float sdr = dot(R.xz, acr);
    float dwl = max(uFinC.x + 1. - gL * sign(sdr), .5);
    float hh = dwl / max(abs(sdr), 1e-3) * max(R.y, 0.);
    float hit = (1. - smoothstep(26., 46., hh)) * gapK;
    float lit = (1. - smoothstep(-.14, .14, sdr * dot(uSun.xz, acr))) * smoothstep(3., 10., hh);
    vec3 wcol = mix(uSkyCol * vec3(.40, .42, .50) * uFinC.z, uSunCol * vec3(.36, .21, .09) + uSkyCol * .2, lit) * (.8 + .4 * vnoise(vec2(gT * .3, hh * .4)));
    pcol = mix(pcol * (1. + .7 * gapK), wcol, hit * .5);
    col = mix(col, pcol * (.5 + .5 * ao), max(pud * (.84 + .14 * fres), gapK * smoothstep(.8, .95, n.y) * (.03 + .14 * fres) * plateG));
  }
  #endif
  #if defined(LAND) || defined(FIN)
  {
    // the exit ring lights the gap: gold on the ledges that face it, and on the wet floor its own image drawn out toward us as a path of glints
    vec3 toR = uRing.xyz - vP; float dR = length(toR) + 1e-3; vec3 Lr = toR / dR;
    float att = uRing.w / (1. + dR * dR / 520.);
    col += alb * uRingB.rgb * (att * (.22 + .78 * max(dot(n, Lr), 0.)));
    #ifdef LAND
    vec3 Rr = reflect(-V, vec3(0., 1., 0.));
    vec2 Rh = Rr.xz / max(length(Rr.xz), 1e-3), Lh = Lr.xz / max(length(Lr.xz), 1e-3);
    float da = Rh.x * Lh.y - Rh.y * Lh.x, sa = uRingB.w / dR * .75 + .03, de = Rr.y - Lr.y;
    float gl = exp(-da * da / (sa * sa) - de * de / .12) * step(0., dot(Rh, Lh));
    float spark = .30 + .70 * smoothstep(.35, .75, vnoise(vP.xz * 4.7 + vec2(uTime * .35, -uTime * .5))) * (.6 + .4 * crk2ring);
    col += uRingB.rgb * (gl * spark * uRing.w * (.55 * pud + (.10 + .30 * gapK) * wet * smoothstep(.85, .97, n.y)));
    #endif
  }
  #endif
  gl_FragColor = vec4(max(col, vec3(0.)), 1.);
  #include <fog_fragment>
}`;

// ---------------------------------------------------------------- ledge falls (instanced ribbons)
const FALL_VS = /* glsl */`
#include <common>
#include <fog_pars_vertex>
${GLSL_COMMON}
attribute vec4 aTop;     // xyz of the lip, w = drop height
attribute vec4 aPar;     // width, seed, outward x, outward z
varying vec2 vUv; varying float vKey, vGrow, vSeed, vH;
void main() {
  float y = uv.y;                                   // 0 at the lip, 1 at the foot
  vec3 p = aTop.xyz;
  p.y -= y * aTop.w;
  p.xz += aPar.zw * (y * y * aTop.w * .22 + y * .6);
  vec3 toCam = uCam - p;
  float dist = length(toCam) + 1e-3;
  vec2 side = normalize(vec2(toCam.z, -toCam.x) + vec2(1e-4, 0.));
  float w = max(aPar.x * (.75 + 1.5 * y * y), dist * .0046);            // a veil that spreads into spray toward its foot
  p.xz += side * (position.x * w);
  vec2 wt = wetAt(aTop.xyz);
  vGrow = smoothstep(105., 150., wt.y) * 1.25;       // the fall runs down from its lip
  vKey = keyAt(aTop.xyz) * (1. - step(1.5, aPar.y));
  vUv = vec2(position.x + .5, y); vSeed = fract(aPar.y); vH = aTop.w;
  vec4 mvPosition = modelViewMatrix * vec4(p, 1.);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const FALL_FS = /* glsl */`
#include <common>
#include <fog_pars_fragment>
uniform vec3 uSunCol, uSkyCol, uMud;
uniform float uTime;
varying vec2 vUv; varying float vKey, vGrow, vSeed, vH;
float hash21(vec2 p) { p = fract(p * vec2(123.34, 345.45)); p += dot(p, p + 34.345); return fract(p.x * p.y); }
float vnoise(vec2 p) {
  vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(hash21(i), hash21(i + vec2(1., 0.)), f.x), mix(hash21(i + vec2(0., 1.)), hash21(i + vec2(1., 1.)), f.x), f.y);
}
void main() {
  // a braided veil: three strands that wander and cross, streaked by the falling water, torn into spray over the lower third
  float fall = vUv.y * vH, y = vUv.y, x = vUv.x * 2. - 1.;
  float sp = 4.5 + vSeed * 2.;
  float wdt = .17 + .30 * y;
  float c0 = -.40 + .20 * sin(fall * .31 + vSeed * 6.3), c1 = .04 + .24 * sin(fall * .23 + vSeed * 17. + 2.), c2 = .44 + .18 * sin(fall * .37 + vSeed * 29. + 4.);
  float d0 = (x - c0) / wdt, d1 = (x - c1) / (wdt * 1.25), d2 = (x - c2) / wdt;
  float s0 = vnoise(vec2(x * 5. + vSeed * 31., fall * .55 - uTime * sp)), s1 = vnoise(vec2(x * 7. + vSeed * 7., fall * .8 - uTime * sp * 1.2)), s2 = vnoise(vec2(x * 13. + vSeed * 3., fall * 1.7 - uTime * sp * 1.7));
  float a = exp(-d0 * d0 * 2.2) * (.45 + .55 * s0) + exp(-d1 * d1 * 2.2) * (.55 + .45 * s1) + exp(-d2 * d2 * 2.2) * (.40 + .60 * s0 * s1 * 2.);
  a *= .62 + .55 * s2 * s2;
  float tear = smoothstep(.55, 1., y);                               // the foot breaks up
  float spray = vnoise(vec2(x * 3.3 + vSeed * 11., fall * .33 - uTime * sp * .6)) * vnoise(vec2(x * 9. - vSeed * 5., fall * .9 - uTime * sp));
  a = mix(a, a * smoothstep(.10, .42, spray) * 1.5 + .11 * (1. - x * x), tear);
  float edge = 1. - x * x; edge *= edge;
  a *= smoothstep(0., .035, y) * (1. - smoothstep(.90, 1., y)) * smoothstep(0., .25, edge) * (1. - .45 * tear);
  a *= 1. - smoothstep(vGrow - .12, vGrow, y);
  if (a < .012) discard;
  vec3 col = mix(uMud * 2.0, vec3(.90, .90, .88), clamp(.45 + .5 * s2 + .3 * tear, 0., 1.)) * (uSkyCol * 1.9 + uSunCol * (vKey * .95));
  gl_FragColor = vec4(max(col, vec3(0.)), min(a, .88));
  #include <fog_fragment>
}`;

// ---------------------------------------------------------------- mist at the falls, vapour off sunlit wet rock, crest dust
const PUFF_VS = /* glsl */`
#include <common>
#include <fog_pars_vertex>
${GLSL_COMMON}
attribute vec4 aPos;     // xyz, w = size
attribute vec4 aPar;     // seed, type (0 fall mist, 1 vapour, 2 dry dust), rise, rate
varying vec2 vUv; varying float vA, vKey, vType;
void main() {
  float life = fract(uTime * aPar.w + aPar.x);
  vec3 p = aPos.xyz;
  vec2 wt = wetAt(p);
  float key = keyAt(p);
  float kind = aPar.y;
  float gate = (kind < .5 || kind > 2.5) ? smoothstep(110., 160., wt.y)
             : kind < 1.5 ? smoothstep(60., 110., wt.y) * smoothstep(.55, .95, key)
             : (1. - wt.x) * (.35 + .65 * key);
  p.y += life * aPar.z;
  p.xz += uWind * (life * aPar.z * ((kind > 1.5 && kind < 2.5) ? .22 : .035)) + vec2(sin(aPar.x * 40. + life * 5.), cos(aPar.x * 27. + life * 4.)) * (aPos.w * .12);
  float size = aPos.w * (.45 + 1.1 * life);
  vA = sin(3.14159 * sqrt(life)) * gate;
  vKey = key; vType = kind; vUv = position.xy * 2.;
  vec4 mvPosition = modelViewMatrix * vec4(p, 1.);
  mvPosition.xy += position.xy * size * (vA > .002 ? 1. : 0.);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const PUFF_FS = /* glsl */`
#include <common>
#include <fog_pars_fragment>
uniform vec3 uSunCol, uSkyCol, uCream;
varying vec2 vUv; varying float vA, vKey, vType;
void main() {
  float r = dot(vUv, vUv);
  float a = exp(-r * 4.5) * (1. - smoothstep(.6, 1., r));
  a = a * vA * (vType > 2.5 ? .30 : vType > 1.5 ? .14 : vType > .5 ? .17 : .20);
  if (a < .004) discard;
  vec3 tint = (vType > 1.5 && vType < 2.5) ? uCream * .8 : vec3(.82, .84, .86);
  vec3 col = tint * (uSkyCol * 1.3 + uSunCol * (vKey * (vType > 2.5 ? .12 : (vType > .5 && vType < 2.5) ? .75 : .55)));      // the mist between the fins hangs in their shade
  gl_FragColor = vec4(max(col, vec3(0.)), a);
  #include <fog_fragment>
}`;

// ---------------------------------------------------------------- rain veils riding the wet side of the line
const RAIN_VS = /* glsl */`
#include <common>
#include <fog_pars_vertex>
uniform vec2 uWetDir, uVeil; uniform float uFront;
attribute vec2 aLayer;   // metres behind the front, seed
varying vec2 vSt; varying float vSeed; varying vec3 vP;
void main() {
  float w = uFront - aLayer.x + uVeil.x;
  vec2 perp = vec2(-uWetDir.y, uWetDir.x);
  vec3 p = vec3(uWetDir * w + perp * position.x, position.y);
  p = p.xzy;
  p.x += position.y * .16;                         // the rain leans downwind
  vSt = vec2(position.x, position.y); vSeed = aLayer.y; vP = p;
  vec4 mvPosition = modelViewMatrix * vec4(p, 1.);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const RAIN_FS = /* glsl */`
#include <common>
#include <fog_pars_fragment>
${GLSL_COMMON}
varying vec2 vSt; varying float vSeed; varying vec3 vP;
void main() {
  float s = vSt.x, y = vSt.y;
  // the rain falls in shafts with clear air between, each shaft combed into crisp leaning streaks
  // (one slow noise, eased over its whole range: thresholded hard, or with a finer octave on the same lattice, the sheets seen
  // from below broke into columns of round lit blobs. The edge is ragged by a slanted second noise, never stacked on the first)
  float dens = vnoise(vec2(s * .0065 + vSeed * 9., y * .003 + uTime * .01)) * .78 + vnoise(vec2(s * .013 + y * .011 + vSeed * 5., y * .004 - s * .006 - uTime * .013)) * .22;
  dens = smoothstep(.34, .74, dens);
  // (seen from far off or along its own plane a sheet's metre-wide streaks are finer than a pixel: sampled there they beat into
  // columns of round blobs. The streaks are let go as they shrink, and the sheet is then a ragged grey curtain)
  float fs = fwidth(s) * 1.1 + fwidth(y) * .022, sk = 1. - smoothstep(.22, .7, fs);
  float streak = mix(.40, smoothstep(.52, .74, vnoise(vec2(s * 1.1 + vSeed * 50., y * .022 + uTime * 2.1))), sk);
  float fine = mix(.5, vnoise(vec2(s * 2.3 + vSeed * 11., y * .09 + uTime * 5.5)), 1. - smoothstep(.10, .34, fs));
  // ragged virga: not every shaft reaches the ground
  float reach = vnoise(vec2(s * .012 + vSeed * 3., 1.7)) * 150. - 40.;
  float foot = smoothstep(reach - 60., reach + 70., y) * .9 + .1;
  float top = 1. - smoothstep(250., 400., y);
  float sides = 1. - smoothstep(250., 460., abs(s));
  // (a curtain is a thing seen across the basin: within a few hundred metres its sheets would hang over the Ribbon's wet beds as a grey veil)
  vec3 toP = vP - uCam; float dP = length(toP) + 1e-3;
  // (and a sheet is never looked up through from under it: overhead it thins away)
  float a = dens * (.035 + .21 * streak * (.55 + .45 * fine)) * foot * top * sides * max(uShade2.z, uVeil.y) * smoothstep(170., 430., dP) * (1. - smoothstep(.22, .55, toP.y / dP));
  a *= 1. + 1.2 * smoothstep(500., 1100., dP);           // from across the basin the shower is a grey curtain that stands out of the sky: the first frame shows it at the Ribbon's west end
  if (a < .003) discard;
  a *= mix(1., .10, rockBehind(vP, toP / dP));           // against the Ribbon's own rock a sheet thins to almost nothing: no streak reads as passing through the face
  if (a < .003) discard;
  float key = keyAt(vP);
  vec3 col = uSkyCol * .62 + uSunCol * (key * (.03 + .21 * streak * sk));
  gl_FragColor = vec4(max(col, vec3(0.)), min(a, .6));
  #include <fog_fragment>
}`;

// ---------------------------------------------------------------- strata table
function lin(hex) { const c = new THREE.Color(hex); return [c.r, c.g, c.b]; }
function buildStrata(rng, pal) {
  const cols = [lin(pal[0]), lin(pal[1]), lin(pal[2]).map((v) => v * 0.74), lin(pal[3]), lin(pal[4]), lin(pal[5])];
  // hardness: cream and ochre sandstones stand out as ledges, red and sage mudstones recess
  const hardOf = [0.30, 0.74, 0.95, 0.22, 0.42, 0.66];
  const weight = [1.5, 1.2, 0.8, 0.5, 0.5, 0.65];
  const shale = lin(pal[6]);
  const data = new Uint8Array(BED_N * 4), hard = new Float32Array(BED_N);
  const per = BED_SPAN / BED_N;
  let pos = 0, last = -1, last2 = -1;
  const part = new Uint8Array(BED_N * 4);
  const put = (i, c, h) => { const k = i * 4; data[k] = Math.round(Math.min(1, c[0]) * 255); data[k + 1] = Math.round(Math.min(1, c[1]) * 255); data[k + 2] = Math.round(Math.min(1, c[2]) * 255); data[k + 3] = Math.round(h * 255); hard[i] = h; };
  while (pos < BED_N) {
    // pick a bed colour different from the last two
    let ci = 0, tries = 0;
    do { let r = rng() * 5.15, k = 0; while (k < 5 && r > weight[k]) { r -= weight[k]; k++; } ci = k; tries++; } while ((ci === last || ci === last2) && tries < 12);
    last2 = last; last = ci;
    const thick = rng.range(6, 25) * (ci === 2 ? 0.6 : ci === 3 || ci === 4 ? 0.55 : 1);
    const n = Math.max(3, Math.round(thick / per));
    const tintTo = cols[rng.chance(0.5) ? 2 : 5], tint = rng.range(0, 0.3), lum = rng.range(0.84, 1.06);
    const c0 = cols[ci].map((v, j) => mix(v, tintTo[j], tint) * lum);
    const h0 = Math.min(1, Math.max(0, hardOf[ci] + rng.range(-0.1, 0.1)));
    const grade = rng.range(-0.12, 0.12);              // beds grade paler or darker upward
    const sub = rng.chance(0.6) ? rng.int(3, 5) : 0;  // thin pale interbeds
    const pale = cols[2];
    for (let i = 0; i < n && pos < BED_N; i++, pos++) {
      const t = i / n;
      let f = 1 + grade * (t - 0.5);
      const inter = sub > 0 && i > 1 && i < n - 2 && rng() < 0.55 / sub;
      put(pos, c0.map((v, j) => (inter ? mix(v, pale[j], 0.45) : v) * f), h0);
    }
    // dark shale parting between beds
    const pn = rng.chance(0.3) ? 2 : 1;
    for (let i = 0; i < pn && pos < BED_N; i++, pos++) { put(pos, shale.map((v, j) => mix(v, c0[j], 0.22)), 0.3); part[pos * 4] = 255; part[pos * 4 + 3] = 255; }
  }
  const soft = new Float32Array(BED_N);
  for (let i = 0; i < BED_N; i++) { let a = 0; for (let k = -3; k <= 3; k++) a += hard[(i + k + BED_N) % BED_N]; soft[i] = a / 7; }
  hard.set(soft);
  const tex = new THREE.DataTexture(data, BED_N, 1, THREE.RGBAFormat);
  tex.wrapS = THREE.RepeatWrapping; tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.magFilter = THREE.LinearFilter; tex.minFilter = THREE.LinearMipmapLinearFilter; tex.generateMipmaps = true;
  tex.needsUpdate = true;
  // where the partings lie, as a table of its own: far off a parting is thinner than a pixel and the bed table's own mips lose it
  const partTex = new THREE.DataTexture(part, BED_N, 1, THREE.RGBAFormat);
  partTex.wrapS = THREE.RepeatWrapping; partTex.wrapT = THREE.ClampToEdgeWrapping;
  partTex.magFilter = THREE.LinearFilter; partTex.minFilter = THREE.LinearMipmapLinearFilter; partTex.generateMipmaps = true;
  partTex.needsUpdate = true;
  return { tex, hard, partTex };
}

// ---------------------------------------------------------------- the ridge's height function
function makeHeight(rng, N, P) {
  const NX = X1 - X0 + 1;
  const crestH = new Float32Array(NX), crestZ = new Float32Array(NX), depthA = new Float32Array(NX);
  const o1 = rng.range(0, 900), o2 = rng.range(0, 900), o3 = rng.range(0, 900);
  let mx = 0;
  for (let i = 0; i < NX; i++) {
    const x = X0 + i;
    const broad = 0.90 + 0.10 * N.fbm2(x / 300 + o1, 3.7, 2) + 0.045 * N.n2(x / 60 + o2, 9.1);
    const teeth = 1 - Math.abs(N.n2(x / 17 + o3, 1.3));
    const taper = Math.pow(sstep(X0 + 6, X0 + 150, x) * (1 - sstep(X1 - 120, X1 - 6, x)), 0.6);
    crestH[i] = (broad + teeth * teeth * 0.035 + 0.02 * N.n2(x / 6, 4.4)) * taper;
    if (crestH[i] > mx) mx = crestH[i];
    crestZ[i] = 30 * N.fbm2(x / 420 + o2, 6.2, 2) + 7 * N.n2(x / 85 + o1, 2.2) + 2.2 * N.n2(x / 19, 7.7);
    depthA[i] = mix(4, 14, 0.5 + 0.5 * N.n2(x / 170 + o3, 5.5));
  }
  for (let i = 0; i < NX; i++) crestH[i] *= P.height / mx;
  const { lam, gx, gTan, gCos, nb, hard, ledge } = P;
  const ilam = 1 / lam, ilam2 = 1 / (lam * 0.37);
  let carve = 0;                                    // how much the gap carve took off at the last point asked for
  function height(x, z) {
    const fx = Math.min(NX - 1.001, Math.max(0, x - X0)), i = fx | 0, f = fx - i;
    const H = crestH[i] + (crestH[i + 1] - crestH[i]) * f;
    const zc = z - (crestZ[i] + (crestZ[i + 1] - crestZ[i]) * f);
    const depth = depthA[i];
    const wv = N.n2(x * 0.011 + o1, z * 0.013);
    const d0 = Math.abs((x - gx) - (z - P.gz) * gTan) * gCos;
    let y, env, env2, envLo = -1;
    if (zc >= 0) {
      const W = Math.max(H, 6) / TAN_F, t = zc / W;
      y = t < 1 ? H * Math.pow(1 - t, 1.13) : 0;
      env = sstep(0.0, 0.13, t) * (1 - 0.8 * sstep(0.82, 1.3, t));
      env2 = sstep(0.1, 0.4, t) * (1 - sstep(0.95, 1.5, t));
      if (d0 < 190) {                               // beside the water gap the flutes run all the way to the foot of the face
        const ng = (1 - sstep(105, 190, d0)) * sstep(0.02, 0.13, t) * (1 - sstep(0.98, 1.16, t));
        if (0.72 * ng > env) { envLo = env; env = 0.72 * ng; }
        env2 = Math.max(env2, 0.8 * ng);
      }
      y += 5.5 * Math.exp(-Math.max(zc - W, 0) / 80) * sstep(0.8, 1.05, t) * (0.55 + 0.45 * wv);   // pediment apron
    } else {
      const W = Math.max(H, 6) / TAN_B, t = -zc / W;
      y = t < 1 ? H * Math.pow(1 - t, 0.86) : 0;
      env = 0.75 * sstep(0.0, 0.2, t) * (1 - 0.8 * sstep(0.8, 1.3, t));
      env2 = env * 0.7;
      y += 4 * Math.exp(-Math.max(-zc - W, 0) / 60) * sstep(0.8, 1.05, t) * (0.55 + 0.45 * wv);
    }
    // flutes: gullies down the fall line, with tributary rills
    const hs = Math.min(1, H / 60);
    const v = Math.abs(N.n2(x * ilam + wv * 0.6 + o2, z / 320 + (zc < 0 ? 40 : 0)));
    const c1 = 1 - Math.min(1, v * 2.1);
    {
      const cut = depth * env * hs * c1 * Math.sqrt(c1);
      y -= envLo < 0 ? cut : Math.min(cut, Math.max(cut * envLo / env, 0.45 * y));      // (the lengthened flutes never cut the foot of the face into teeth)
    }
    const v0 = Math.abs(N.n2(x / 105 + wv * 0.5 + o1, z / 520 + 9));
    const c0 = 1 - Math.min(1, v0 * 2.6);
    y -= 9 * env * hs * c0 * c0;
    const v2 = Math.abs(N.n2(x * ilam2 - wv * 0.8 + o3, z / 150));
    y -= depth * 0.3 * env2 * hs * (1 - Math.min(1, v2 * 2.3));
    // differential erosion: hard beds stand out as ledges along the tilted bedding
    const b = nb.x * x + nb.y * y + nb.z * z;
    let bi = ((b - BED_B0) / BED_SPAN) * BED_N; bi -= Math.floor(bi / BED_N) * BED_N;
    const b0 = bi | 0, bf = bi - b0;
    const hd = hard[b0] + (hard[(b0 + 1) % BED_N] - hard[b0]) * bf;
    y += (hd - 0.5) * ledge * Math.min(1, env * 1.4 + 0.25) * Math.min(1, Math.max(0, y) * 0.12);
    // the water gap: flat floor, two fins of cut strata, then the notch opening to the crest
    carve = 0;
    if (d0 < 230 && y > 0.1) {
      const tg = ((x - gx) * gTan + (z - P.gz)) * gCos;        // along the gap; the fin meshes stand P.back in front of this wall
      const d = d0 - P.wob(tg) - P.back(tg);
      let gh;
      if (d <= P.gapHalf) gh = 0.25 * (0.5 + 0.5 * wv);
      else if (d < P.gapHalf + 9) gh = P.finH * Math.pow((d - P.gapHalf) / 9, 0.55) + (hd - 0.5) * 1.6;
      else {
        const dd = d - P.gapHalf - 9, west = (x - gx) - (z - P.gz) * gTan < 0;
        gh = P.finH + (west ? Math.min(dd, 75) * 0.36 + Math.max(dd - 75, 0) * 1.15 : dd * 0.95) + (hd - 0.5) * 3.2 * Math.min(1, dd * 0.2);
      }
      if (gh < y) { carve = y - gh; y = gh; }
    }
    if (y < 0.2) y = 0.2 + 0.1 * wv;                 // gully floors meet the wash
    // settle into the washes at the rim of the footprint
    const rim = Math.min(sstep(X0, X0 + 40, x) * (1 - sstep(X1 - 40, X1, x)), sstep(Z0, Z0 + 30, z) * (1 - sstep(Z1 - 45, Z1, z)));
    return y * rim - (1 - rim) * 1.2;
  }
  return { height, crestH, crestZ, carved: () => carve };
}

const HOURS = {
  evening: { elev: 16, sun: '#FFD9A0', sunI: 2.15, sky: [0.30, 0.42, 0.60], skyI: 0.62, bounce: [0.50, 0.33, 0.20], cloud: 0.30, storm: 0.27 },
  golden: { elev: 5, sun: '#FFB468', sunI: 2.3, sky: [0.36, 0.36, 0.60], skyI: 0.66, bounce: [0.56, 0.32, 0.21], cloud: 0.26, storm: 0.25 },
  day: { elev: 35, sun: '#FFF2DA', sunI: 2.7, sky: [0.34, 0.50, 0.72], skyI: 0.70, bounce: [0.45, 0.36, 0.26], cloud: 0.36, storm: 0.30 },
  dawn: { elev: 9, sun: '#FFB9A0', sunI: 2.2, sky: [0.40, 0.42, 0.62], skyI: 0.50, bounce: [0.50, 0.30, 0.24], cloud: 0.5, storm: 1 },
  night: { elev: 30, sun: '#B9CCFF', sunI: 1.15, sky: [0.10, 0.16, 0.30], skyI: 1.0, bounce: [0.05, 0.06, 0.10], cloud: 0.62, storm: 0.62 },
};

export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng.fork ? ctx.rng.fork('ribbon') : ctx.rng;
  const N = ctx.noise;
  const pal = (opts.palette && opts.palette.length >= 7) ? opts.palette : DEF_PAL;
  const hourName = HOURS[opts.hour] ? opts.hour : 'evening';
  const hour = HOURS[hourName];
  const weather = opts.weather || 'shower';
  const detail = ctx.quality?.detail ?? 1;

  // ---- per-seed design
  const strata = buildStrata(rng, pal);
  await ctx.yield();
  const dipTwist = rng.range(-0.06, 0.06);
  const nb = new THREE.Vector3(-0.66 + dipTwist, 0.58, -0.48 - dipTwist * 0.5).normalize();
  const gapA = -rng.range(0.42, 0.54);                          // the gap runs 24-31 degrees off square, its mouth turned toward the sun
  const P = {
    height: 200, lam: rng.range(24, 32), ledge: rng.range(3.0, 4.0), nb, hard: strata.hard,
    gx: rng.range(300, 350), gz: 0, gTan: Math.tan(gapA), gCos: Math.cos(gapA), gapHalf: 11, finH: 45,
    wob: (t) => Math.max(0.3, 1.5 + 1.3 * N.n2(t / 41 + 5.1, 2.7) + 0.5 * N.n2(t / 12 + 1.3, 8.8)),     // the floor's half width beyond gapHalf
    back: (t) => 5.5 * sstep(14, 40, t),          // how far the height field's gap wall stands behind the fin meshes (more than one of its cells)
  };
  const Hf = makeHeight(rng, N, P);
  await ctx.yield();
  const height = Hf.height;
  const ci0 = Math.round(P.gx - X0);
  P.gz = Hf.crestZ[ci0];                                        // the gap axis crosses the crest line here
  const sunL = opts.sunDir ? opts.sunDir.clone().normalize()
    : new THREE.Vector3(-Math.sin(1.222) * Math.cos(hour.elev * Math.PI / 180), Math.sin(hour.elev * Math.PI / 180), Math.cos(1.222) * Math.cos(hour.elev * Math.PI / 180));
  await ctx.yield();

  // ---- the flanks of the water gap (laid out before the bake: the ridge's own field is sunk under them)
  // gap coordinates: t along the axis toward the mouth, lat across; each flank is a wall of stepped beds (the fin)
  // with the shoulder above its rim, both in one mesh at 1.4 m columns
  const gapAxis = new THREE.Vector3(P.gTan, 0, 1).normalize();            // toward +Z, the arriving camera's side
  const gapDist = (x, z) => Math.abs((x - P.gx) - (z - P.gz) * P.gTan) * P.gCos;
  const acrX = gapAxis.z, acrZ = -gapAxis.x;                                // across the gap, toward the east fin
  const finN = Math.round((FIN_T0E - FIN_T1) / FIN_DT) + 1;
  const finTop = [new Float32Array(finN), new Float32Array(finN)];
  const finBatter = (y) => 9 * Math.pow(Math.max(0, y) / P.finH, 1 / 0.55);
  const finTopAt = (si, t) => { const f = Math.min(finN - 1.001, Math.max(0, (FIN_T0E - t) / FIN_DT)), i = f | 0; return finTop[si][i] + (finTop[si][i + 1] - finTop[si][i]) * (f - i); };
  const finFoot = (t) => P.gapHalf + P.wob(t) + 2.6 * (1 - sstep(14, 34, t));     // at its far end the fin sinks back into the height field's own wall
  const DD = [[0.25, 1.2, 2.4, 3.8, 5.4, 7.2, 9.2, 11.5, 14, 16.8, 19.9, 23.3, 27, 31, 35.5, 40.5, 46, 52, 58.5, 65.5, 73], [0.25, 1.2, 2.4, 3.8, 5.4, 7.2, 9.2, 11.5, 14, 16.8, 19.9, 23.3, 27, 31, 35.5, 40.5, 46, 52]];
  for (let si = 0; si < 2; si++) {
    const side = si ? 1 : -1, raw = new Float32Array(finN);
    for (let i = 0; i < finN; i++) {
      const t = FIN_T0E - i * FIN_DT, foot = P.gapHalf + P.wob(t), bx = P.gx + gapAxis.x * t, bz = P.gz + gapAxis.z * t;
      const l1 = foot + 5.5 + 9 + 1.2, h1 = height(bx + acrX * side * l1, bz + acrZ * side * l1);
      const l2 = foot + 5.5 + finBatter(Math.min(h1, P.finH)) + 1.4;
      raw[i] = Math.min(P.finH + 0.5, Math.max(0, Math.min(h1, height(bx + acrX * side * l2, bz + acrZ * side * l2))));
    }
    for (let i = 0; i < finN; i++) finTop[si][i] = (raw[Math.max(0, i - 2)] + raw[Math.max(0, i - 1)] * 2 + raw[i] * 3 + raw[Math.min(finN - 1, i + 1)] * 2 + raw[Math.min(finN - 1, i + 2)]) / 9;
  }
  const finPhi = (si, t) => t / 13 + 0.35 * N.n2(t / 37 + si * 11, 4.4) + si * 0.37;
  const SINK = 6.5;
  const sinkAt = (x, z) => {            // how far the ridge's own surface is lowered under a flank mesh
    const qx = x - P.gx, qz = z - P.gz, t = qx * gapAxis.x + qz * gapAxis.z;
    if (t < FIN_T1 + 2 || t > FIN_T0E - 3) return 0;
    const lat = qx * acrX + qz * acrZ, si = lat > 0 ? 1 : 0, mx = DD[si][DD[si].length - 1];
    const dd = Math.abs(lat) - finFoot(t) - finBatter(finTopAt(si, t));
    if (dd < -3 || dd > mx - 6) return 0;
    return SINK * sstep(-3, 0, dd) * (1 - sstep(mx - 17, mx - 7, dd)) * sstep(FIN_T1 + 2, FIN_T1 + 10, t) * (1 - sstep(FIN_T0E - 13, FIN_T0E - 4, t));
  };
  await ctx.yield();

  // ---- bake the height field
  const hgt = new Float32Array(TW * TH);
  const dxT = (X1 - X0) / TW, dzT = (Z1 - Z0) / TH;
  for (let j = 0; j < TH; j++) {
    const z = Z0 + (j + 0.5) * dzT, row = j * TW;
    for (let i = 0; i < TW; i++) {
      const x = X0 + (i + 0.5) * dxT; hgt[row + i] = height(x, z) - sinkAt(x, z);
      if ((i & 255) === 255) await ctx.yield();      // three hand-backs a row
    }
  }
  const hAt = (fi, fj) => {   // nearest texel, clamped
    const i = fi < 0 ? 0 : fi >= TW ? TW - 1 : fi | 0, j = fj < 0 ? 0 : fj >= TH ? TH - 1 : fj | 0;
    return hgt[j * TW + i];
  };

  // ---- sun shadow (soft, marched over the height field at half resolution)
  const SW = TW >> 1, SH = TH >> 1;
  const shadow = new Float32Array(SW * SH);
  {
    // (a sun under 12 degrees would lay every flute in its neighbour's shadow: the face is baked as if it stood that high)
    const lh = Math.max(1e-3, Math.hypot(sunL.x, sunL.z)), sx = sunL.x / lh / dxT, sz = sunL.z / lh / dzT, rise = Math.max(sunL.y / lh, 0.2126);
    for (let j = 0; j < SH; j++) {
      for (let i = 0; i < SW; i++) {
        const fi = i * 2 + 1, fj = j * 2 + 1, h0 = hAt(fi, fj) + 0.5;
        const gd = Math.abs((X0 + (fi + 0.5) * dxT - P.gx) - (Z0 + (fj + 0.5) * dzT - P.gz) * P.gTan) * P.gCos;
        const kk = gd < 45 ? 2.4 : gd > 95 ? 9 : 2.4 + (gd - 45) * 0.132;
        let res = 1, d = 2.2;
        for (let k = 0; k < 22; k++) {
          const hr = h0 + d * rise;
          if (hr > 215) break;
          const c = kk * (hr - hAt(fi + sx * d, fj + sz * d)) / d + 0.25;
          if (c < res) { res = c; if (res <= 0) { res = 0; break; } }
          d *= 1.23;
        }
        shadow[j * SW + i] = gd < 70 ? -1 - res : res;
      }
      if ((j & 0) === 0) await ctx.yield();
    }
    // cells near the gap were tagged negative: unpack, then blur them 3x3
    const near = new Uint8Array(SW * SH);
    for (let c = 0; c < SW * SH; c++) if (shadow[c] < 0) { shadow[c] = -1 - shadow[c]; near[c] = 1; }
    const src = shadow.slice();
    for (let j = 1; j < SH - 1; j++) for (let i = 1; i < SW - 1; i++) {
      const c = j * SW + i;
      if (near[c]) shadow[c] = (src[c] * 2 + src[c - 1] + src[c + 1] + src[c - SW] + src[c + SW] + (src[c - SW - 1] + src[c - SW + 1] + src[c + SW - 1] + src[c + SW + 1]) * 0.5) / 8;
    }
  }
  await ctx.yield();

  // ---- ambient occlusion from a blurred copy (cavities darken), normals, packed into texture 1
  const blur = new Float32Array(TW * TH);
  {
    const tmp = new Float32Array(TW * TH), R = 7, inv = 1 / (2 * R + 1);
    for (let j = 0; j < TH; j++) {
      const row = j * TW; let s = hgt[row] * (R + 1);
      for (let i = 1; i <= R; i++) s += hgt[row + i];
      for (let i = 0; i < TW; i++) {
        tmp[row + i] = s * inv;
        const ia = i + R + 1, ib = i - R;
        s += hgt[row + (ia < TW ? ia : TW - 1)] - hgt[row + (ib > 0 ? ib : 0)];
      }
      if ((j & 15) === 15) await ctx.yield();
    }
    await ctx.yield();
    const col = new Float32Array(TW);
    for (let i = 0; i < TW; i++) col[i] = tmp[i] * (R + 1);
    for (let j = 1; j <= R; j++) { const row = j * TW; for (let i = 0; i < TW; i++) col[i] += tmp[row + i]; }
    for (let j = 0; j < TH; j++) {
      const row = j * TW, ja = (j + R + 1 < TH ? j + R + 1 : TH - 1) * TW, jb = (j - R > 0 ? j - R : 0) * TW;
      for (let i = 0; i < TW; i++) { blur[row + i] = col[i] * inv; col[i] += tmp[ja + i] - tmp[jb + i]; }
      if ((j & 15) === 15) await ctx.yield();
    }
  }
  await ctx.yield();
  const bake1 = new Uint8Array(TW * TH * 4);
  {
    const idx2 = 1 / (2 * dxT), idz2 = 1 / (2 * dzT);
    for (let j = 0; j < TH; j++) {
      const jm = (j > 0 ? j - 1 : 0) * TW, jp = (j < TH - 1 ? j + 1 : TH - 1) * TW, row = j * TW;
      let sj = (j - 1) * 0.5; if (sj < 0) sj = 0; else if (sj > SH - 1.001) sj = SH - 1.001;
      const sj0 = sj | 0, sjf = sj - sj0, ra = sj0 * SW, rb = ra + SW;
      for (let i = 1; i < TW - 1; i++) {
        const c = row + i;
        const gxn = (hgt[c + 1] - hgt[c - 1]) * idx2, gzn = (hgt[jp + i] - hgt[jm + i]) * idz2;
        const il = 127.5 / Math.sqrt(gxn * gxn + gzn * gzn + 1);
        let ao = 0.82 + (hgt[c] - blur[c]) * 0.07; if (ao < 0.42) ao = 0.42; else if (ao > 1) ao = 1;
        let si = (i - 1) * 0.5; if (si > SW - 1.001) si = SW - 1.001;
        const si0 = si | 0, sif = si - si0;
        const s0 = shadow[ra + si0], s1 = shadow[rb + si0];
        const t0 = s0 + (shadow[ra + si0 + 1] - s0) * sif, t1 = s1 + (shadow[rb + si0 + 1] - s1) * sif;
        let sh = t0 + (t1 - t0) * sjf; if (sh < 0) sh = 0; else if (sh > 1) sh = 1;
        const k = c * 4;
        bake1[k] = 128 - gxn * il; bake1[k + 1] = 128 - gzn * il; bake1[k + 2] = ao * 255; bake1[k + 3] = sh * 255;
      }
      const k0 = row * 4, k1 = (row + TW - 1) * 4;
      for (let c = 0; c < 4; c++) { bake1[k0 + c] = bake1[k0 + 4 + c]; bake1[k1 + c] = bake1[k1 - 4 + c]; }
      if ((j & 3) === 3) await ctx.yield();
    }
  }

  // ---- rivulets: drops walked down the steepest descent; where they jump a ledge, a fall
  const acc = new Float32Array(TW * TH);
  const fallsRaw = [];
  const nDrops = 540;
  const NBR = [[1, 0, dxT], [-1, 0, dxT], [0, 1, dzT], [0, -1, dzT], [1, 1, Math.hypot(dxT, dzT)], [-1, 1, Math.hypot(dxT, dzT)], [1, -1, Math.hypot(dxT, dzT)], [-1, -1, Math.hypot(dxT, dzT)]];
  for (let dI = 0; dI < nDrops; dI++) {
    let x, z;
    if (dI < 40) { const s = rng.range(-70, 110), sd = rng.sign() * rng.range(16, 60); x = P.gx + s * P.gTan + sd; z = P.gz + s; }   // onto the gap fins
    else if (dI >= 440) { x = P.gx - rng.range(40, 330); const cz = Hf.crestZ[Math.round(x - X0)]; z = cz + rng.range(3, 60); }      // the face over the run-in: every gully runs from the crest down
    else { x = rng.range(X0 + 30, X1 - 30); const cz = Hf.crestZ[Math.round(x - X0)]; z = cz + (rng.chance(0.8) ? rng.range(4, 150) : -rng.range(4, 60)); }
    let i = Math.round((x - X0) / dxT - 0.5), j = Math.round((z - Z0) / dzT - 0.5);
    let runDrop = 0, runTop = -1, runDx = 0, runDz = 0;
    for (let s = 0; s < 520; s++) {
      if (i < 1 || j < 1 || i >= TW - 1 || j >= TH - 1) break;
      const idx = j * TW + i, h0 = hgt[idx];
      if (h0 < 0.6) break;
      acc[idx] += 1;
      let best = 0, bk = -1;
      for (let k = 0; k < 8; k++) { const sl = (h0 - hgt[idx + NBR[k][1] * TW + NBR[k][0]]) / NBR[k][2]; if (sl > best) { best = sl; bk = k; } }
      if (bk < 0) break;
      const drop = best * NBR[bk][2];
      if (best > 1.9) { if (runTop < 0) { runTop = idx; runDx = 0; runDz = 0; runDrop = 0; } runDrop += drop; runDx += NBR[bk][0]; runDz += NBR[bk][1]; }
      else if (runTop >= 0) {
        if (runDrop >= 3.6) fallsRaw.push({ idx: runTop, drop: runDrop, ox: runDx, oz: runDz, w: acc[idx] });
        runTop = -1;
      }
      i += NBR[bk][0]; j += NBR[bk][1];
    }
    if ((dI & 15) === 15) await ctx.yield();
  }
  const bake2 = new Uint8Array(TW * TH * 4);
  for (let j = 1; j < TH - 1; j++) {
    for (let i = 1; i < TW - 1; i++) {
      const c = j * TW + i;
      bake2[c * 4 + 3] = 255;
      if (acc[c] + acc[c - 1] + acc[c + 1] + acc[c - TW] + acc[c + TW] + acc[c - 1 - TW] + acc[c + 1 - TW] + acc[c - 1 + TW] + acc[c + 1 + TW] === 0) continue;
      const a = acc[c] * 0.36 + (acc[c - 1] + acc[c + 1] + acc[c - TW] + acc[c + TW]) * 0.11 + (acc[c - 1 - TW] + acc[c + 1 - TW] + acc[c - 1 + TW] + acc[c + 1 + TW]) * 0.05;
      bake2[c * 4] = Math.round(Math.min(1, Math.sqrt(a) * 0.46) * 255);
    }
    if ((j & 3) === 3) await ctx.yield();
  }
  await ctx.yield();
  const mkTex = (data) => {
    const t = new THREE.DataTexture(data, TW, TH, THREE.RGBAFormat);
    t.magFilter = THREE.LinearFilter; t.minFilter = THREE.LinearMipmapLinearFilter; t.generateMipmaps = true;
    t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; t.anisotropy = 4; t.needsUpdate = true;
    return t;
  };
  const tex1 = mkTex(bake1), tex2 = mkTex(bake2);
  // the height of the ridge over the same footprint, for the rain (a streak in front of rock is all but put out)
  const RKW = 160, RKH = 80, rkData = new Uint16Array(RKW * RKH);
  for (let j = 0; j < RKH; j++) {
    if ((j & 3) === 3) await ctx.yield();
    for (let i = 0; i < RKW; i++) rkData[j * RKW + i] = THREE.DataUtils.toHalfFloat(height(X0 + (i + 0.5) / RKW * (X1 - X0), Z0 + (j + 0.5) / RKH * (Z1 - Z0)));
  }
  const rockTex = new THREE.DataTexture(rkData, RKW, RKH, THREE.RedFormat, THREE.HalfFloatType);
  rockTex.minFilter = rockTex.magFilter = THREE.LinearFilter; rockTex.wrapS = rockTex.wrapT = THREE.ClampToEdgeWrapping; rockTex.needsUpdate = true;
  await ctx.yield();

  // ---- shared uniforms
  const c3 = (hex, k = 1) => { const c = new THREE.Color(hex); return new THREE.Vector3(c.r * k, c.g * k, c.b * k); };
  const wetDir = new THREE.Vector2(0.94, -0.34).normalize();
  const cream = c3(pal[2], 0.76);
  const mud = c3(pal[0]).lerp(c3(pal[6]), 0.35).multiplyScalar(0.55);
  const U = {
    uStrata: { value: strata.tex }, uPart: { value: strata.partTex }, uRockH: { value: rockTex }, uBake1: { value: tex1 }, uBake2: { value: tex2 },
    uNBed: { value: nb }, uSun: { value: sunL.clone() }, uSunCol: { value: c3(hour.sun, hour.sunI) },
    uSkyCol: { value: new THREE.Vector3(...hour.sky).multiplyScalar(hour.skyI) }, uBounce: { value: new THREE.Vector3(...hour.bounce).multiplyScalar(0.34) },
    uCream: { value: cream }, uMud: { value: mud }, uWash: { value: c3(pal[2]).lerp(c3(pal[5]), 0.5).multiplyScalar(0.8) }, uCam: { value: new THREE.Vector3(0, 60, 900) },
    uBed: { value: new THREE.Vector4(BED_B0, 1 / BED_SPAN, weather === 'snow' ? 1 : 0, hourName === 'dawn' ? 1 : 0) },
    uRect: { value: new THREE.Vector4(X0, Z0, 1 / (X1 - X0), 1 / (Z1 - Z0)) },
    uShade: { value: new THREE.Vector4(-9000, -8000, hour.cloud, hour.storm) },
    uShade2: { value: new THREE.Vector4(0, -1000, 0, 0) }, uLand: { value: new THREE.Vector4(0, 0, 0, 3.1) }, uLandBed: { value: nb.clone() },
    uFinA: { value: new THREE.Vector4(P.gTan * P.gCos, P.gCos, P.gx, P.gz) }, uFinB: { value: new THREE.Vector4(FIN_BX, FIN_BY, 16, rng.range(0, 300)) }, uFallW: { value: new THREE.Vector4(1e4, 1e4, 1e4, 1e4) }, uFallE: { value: new THREE.Vector4(1e4, 1e4, 1e4, 1e4) },
    uRing: { value: new THREE.Vector4(0, 2.3, 0, 0) }, uRingB: { value: new THREE.Vector4(1, 0.82, 0.58, 6) },
    uFinC: { value: new THREE.Vector4(P.gapHalf, 275, hourName === 'night' ? 1.6 : 1.55, hourName === 'night' ? 1 : 0) },
    uWetDir: { value: wetDir }, uWind: { value: new THREE.Vector2(19, -6) },
    uFront: { value: -9000 }, uTime: { value: 0 }, uVeil: { value: new THREE.Vector2(0, 0) },
  };
  const mkMat = (vs, fs, extra = {}) => new THREE.ShaderMaterial({
    uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...U }, vertexShader: vs, fragmentShader: fs, fog: true, ...extra });

  const body = new THREE.Group();
  const object = new THREE.Group(); object.name = 'the-ribbon'; object.add(body);
  if (opts.mirror) body.scale.x = -1;

  const hBil = (x, z) => {
    let fi = (x - X0) / dxT - 0.5, fj = (z - Z0) / dzT - 0.5;
    if (fi < 0) fi = 0; else if (fi > TW - 1.001) fi = TW - 1.001;
    if (fj < 0) fj = 0; else if (fj > TH - 1.001) fj = TH - 1.001;
    const i = fi | 0, j = fj | 0, a = fi - i, b = fj - j, c = j * TW + i;
    const h0 = hgt[c] + (hgt[c + 1] - hgt[c]) * a, h1 = hgt[c + TW] + (hgt[c + TW + 1] - hgt[c + TW]) * a;
    return h0 + (h1 - h0) * b;
  };
  // ---- the ridge mesh: rows follow the knife crest, columns tighten around the gap
  {
    const xs = [];
    for (let x = X0; x < X1 - 0.5;) { xs.push(x); x += (x - P.gx > -112 && x - P.gx < 62) ? 1.3 : 2.6; }
    xs.push(X1);
    const rows = [];                          // [side, offset or fraction, isFraction]
    const backOff = [1.2, 2.6, 4.5, 7, 10]; for (let r = 17; r <= 112; r += 7) backOff.push(r);
    const frontOff = [1.2, 2.6, 4.5, 7, 10]; for (let r = 14.4; r <= 282; r += 4.4) frontOff.push(r);
    for (let k = 0; k < 3; k++) rows.push([-1, k / 3, 1]);
    for (let k = backOff.length - 1; k >= 0; k--) rows.push([-1, backOff[k], 0]);
    rows.push([0, 0, 0]);
    for (const r of frontOff) rows.push([1, r, 0]);
    for (let k = 1; k <= 4; k++) rows.push([1, k / 4, 1]);
    const nx = xs.length, nz = rows.length;
    const pos = new Float32Array(nx * nz * 3);
    const bMax = backOff[backOff.length - 1], fMax = frontOff[frontOff.length - 1];
    for (let j = 0; j < nz; j++) {
      const [side, v, frac] = rows[j];
      for (let i = 0; i < nx; i++) {
        const x = xs[i], cz = Hf.crestZ[Math.round(x - X0)];
        let z;
        if (side < 0) z = frac ? mix(Z0, cz - bMax, v) : cz - v;
        else if (side > 0) z = frac ? mix(cz + fMax, Z1, v) : cz + v;
        else z = cz;
        z = Math.min(Z1, Math.max(Z0, z));
        const k = (j * nx + i) * 3;
        pos[k] = x; pos[k + 1] = (!frac && v <= 10.5) ? height(x, z) - sinkAt(x, z) : hBil(x, z); pos[k + 2] = z;
      }
      if ((j & 1) === 1) await ctx.yield();
    }
    await ctx.yield();
    const idx = new Uint32Array((nx - 1) * (nz - 1) * 6);
    let o = 0;
    for (let j = 0; j < nz - 1; j++) for (let i = 0; i < nx - 1; i++) {
      if (i === 0 && (j & 15) === 15) await ctx.yield();
      const a = j * nx + i, b = a + 1, c = a + nx, d = c + 1;
      if ((i + j) & 1) { idx[o++] = a; idx[o++] = c; idx[o++] = b; idx[o++] = b; idx[o++] = c; idx[o++] = d; }
      else { idx[o++] = a; idx[o++] = c; idx[o++] = d; idx[o++] = a; idx[o++] = d; idx[o++] = b; }
    }
    await ctx.yield();
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setIndex(new THREE.BufferAttribute(idx, 1));
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 80, 90), 640);
    const ridge = new THREE.Mesh(g, mkMat(ROCK_VS, ROCK_FS));
    ridge.name = 'ribbon-face'; body.add(ridge);
  }
  await ctx.yield();

  // ---- the two flanks of the water gap. The baked height field cannot hold a wall (its texels smear down it) nor beds a
  // metre thick, so each flank is its own mesh in gap coordinates. THE WALL: its rows run along the beds (which climb
  // FIN_K metres a metre toward the crest), two rows 8 cm apart at every contact, so that each hard bed stands proud as a
  // riser with a tread on top and an undercut below, in true steps; AO, a shadow under every overhang and tilted lip
  // normals are baked into the vertices. THE SHOULDER above the rim: the ridge's own surface redrawn at 1.4 m with gullies
  // running down to notches in the rim and the same thin beds terraced into it; the ridge mesh is sunk beneath it.
  const finLods = [];        // from far out on the wash only the shoulders are drawn: the stepped walls inside the gap cannot be seen
  {
    const fB = U.uFinB.value, sd8 = strata.tex.image.data, per = BED_SPAN / BED_N, cS = fB.x * fB.z;      // strata metres per metre of c = y + FIN_K t
    const protOf = (h) => -0.55 + 2.5 * sstep(0.24, 0.96, h);
    const cMin = FIN_K * FIN_T1 - 2, cMax = FIN_K * FIN_T0E + P.finH + 2;
    const beds = [];
    {
      const k0 = Math.floor((cS * cMin + fB.w - BED_B0) / per), k1 = Math.ceil((cS * cMax + fB.w - BED_B0) / per);
      const al = (k) => sd8[(((k % BED_N) + BED_N) % BED_N) * 4 + 3];
      let ks = k0;
      for (let k = k0 + 1; k <= k1 + 1; k++) if (k > k1 || al(k) !== al(ks)) {
        beds.push({ c0: (BED_B0 + ks * per - fB.w) / cS, c1: (BED_B0 + k * per - fB.w) / cS, p: protOf(al(ks) / 255) });
        ks = k;
      }
    }
    const protAt = (c) => { let a = 0, b = beds.length - 1; while (a < b) { const m = (a + b) >> 1; if (beds[m].c1 <= c) a = m + 1; else b = m; } return beds[a].p; };
    // rows of the wall: c, how far the bed stands out, occlusion, shadow, normal tilt, bed, kind (1 bottom, 2 top, 0 inside)
    const rc = [], roff = [], rao = [], rkey = [], rtilt = [], rbed = [], rkind = [];
    beds.forEach((B, bi) => {
      const lo = beds[bi - 1], hi = beds[bi + 1], T = B.c1 - B.c0, dB = lo ? B.p - lo.p : 0, dA = hi ? hi.p - B.p : 0;
      const offB = B.p + (dB < -0.25 ? Math.min(0.45, -dB * 0.4) : 0), offT = B.p - (dA > 0.25 ? 0.22 : 0);
      const aoB = dB < -0.25 ? 0.66 : dB > 0.25 ? 0.82 : 0.86, aoT = dA < -0.25 ? 1 : dA > 0.25 ? 0.40 : 0.86;
      if (T < 0.35) {                    // a parting between two beds is one recessed row: a dark notch
        rc.push((B.c0 + B.c1) * 0.5); roff.push(B.p); rao.push(0.5); rkey.push(0.5); rtilt.push(0); rbed.push(bi); rkind.push(0);
        return;
      }
      const n = Math.max(0, Math.ceil(T / 1.7) - 1);
      for (let q = 0; q <= n + 1; q++) {
        const f = q / (n + 1), e = Math.min(0.09, T * 0.25);
        rc.push(q === 0 ? B.c0 + e : q === n + 1 ? B.c1 - e : B.c0 + T * f);
        roff.push(mix(offB, offT, f) + (B.p > 0.6 ? 0.14 : 0.05) * Math.sin(Math.PI * f) + (T > 1.7 && q > 0 && q <= n ? (q & 1 ? 0.26 : -0.16) : 0));      // thick beds are ribbed by stringers
        rao.push(q === 0 ? aoB : q === n + 1 ? aoT : Math.min(1, mix(aoB, aoT, f) + 0.5 * Math.sin(Math.PI * f)));
        rkey.push(q === n + 1 && dA > 0.25 ? 0.12 : q === n && n > 0 && dA > 0.25 ? 0.6 : 1);
        rtilt.push(q === 0 ? (dB < -0.25 ? 1.1 : dB > 0.25 ? -0.3 : 0) : q === n + 1 ? (dA < -0.25 ? 0.85 : dA > 0.25 ? -0.5 : 0) : 0);
        rbed.push(bi); rkind.push(q === 0 ? 1 : q === n + 1 ? 2 : 0);
      }
    });
    const NRW = rc.length;
    const hardThin = (x, y, z) => {       // bed hardness on the shoulders: the Ribbon's own dip at a thinner scale
      let fi = (((nb.x * x + nb.y * y + nb.z * z) * SH_BEDS - BED_B0) / BED_SPAN) * BED_N; fi -= Math.floor(fi / BED_N) * BED_N;      // one bench to each painted bed (3 to 12 m thick: the 1.4 m grid can carry them)
      return sd8[(fi | 0) * 4 + 3] / 255;
    };
    const hsh = (v) => { const q = Math.sin(v) * 43758.5453; return q - Math.floor(q); };
    // master joints (the shader draws the same ones): where each stands along the gap, and how far the beds step across it
    const jT = (k) => (k + 0.28 * Math.sin(k * 2.4)) * JOINT_W, jA = (k) => JOINT_A * Math.sin(k * 1.7);
    const foA = new Float32Array(finN), djA = new Float32Array(finN);
    for (let i = 0; i < finN; i++) {
      const t = FIN_T0E - i * FIN_DT, k = Math.floor(t / JOINT_W), t0 = jT(k), t1 = jT(k + 1);
      foA[i] = jA(k - 1) + (jA(k) - jA(k - 1)) * sstep(t0 - 0.7, t0 + 0.7, t) + (jA(k + 1) - jA(k)) * sstep(t1 - 0.7, t1 + 0.7, t);
      djA[i] = Math.min(Math.abs(t - t0), Math.abs(t - t1));
    }
    const sunAcr = sunL.x * acrX + sunL.z * acrZ, sunAl = sunL.x * gapAxis.x + sunL.z * gapAxis.z;
    const finMat = mkMat(ROCK_VS, ROCK_FS, { defines: { FIN: 1 }, side: THREE.DoubleSide });
    const tOf = (i) => FIN_T0E - i * FIN_DT;
    const shadowAt = (x, z) => {              // the baked sun shadow of the ridge (half resolution), bilinear
      const fi = Math.min(SW - 1.001, Math.max(0, ((x - X0) / dxT - 1.5) * 0.5)), fj = Math.min(SH - 1.001, Math.max(0, ((z - Z0) / dzT - 1.5) * 0.5)), i = fi | 0, j = fj | 0, a = fi - i, b = fj - j, k = j * SW + i;
      return Math.min(1, Math.max(0, (shadow[k] + (shadow[k + 1] - shadow[k]) * a) * (1 - b) + (shadow[k + SW] + (shadow[k + SW + 1] - shadow[k + SW]) * a) * b));
    };
    for (let si = 0; si < 2; si++) {
      const side = si ? 1 : -1, inX = -side * acrX, inZ = -side * acrZ, dds = DD[si], ND = dds.length + 1, mx = dds[dds.length - 1];
      const HtA = finTop[si], footA = new Float32Array(finN), bxA = new Float32Array(finN), bzA = new Float32Array(finN), phiA = new Float32Array(finN), rLo = new Int32Array(finN);
      for (let i = 0; i < finN; i++) {
        const t = tOf(i);
        footA[i] = finFoot(t); bxA[i] = P.gx + gapAxis.x * t; bzA[i] = P.gz + gapAxis.z * t;
        phiA[i] = finPhi(si, t);                                                  // gullies and their rivulets sit where fract(phi) = 0.5
      }
      for (let i = finN - 1, r = 0; i >= 0; i--) { while (r < NRW - 1 && rc[r + 1] <= FIN_K * tOf(i) + foA[i]) r++; rLo[i] = r; }      // the last row at or under the floor in each column
      // the sun over the opposite fin (its shadow is drawn a third of its true height so the lit wall reads from the floor up)
      const keyOf = (lat, y, t, x, z, wall) => {
        if (-side * sunAcr <= 0.05) return wall && sunL.y < 0.42 ? 0 : shadowAt(x, z);      // the flank under the sun: its wall looks away and its own shoulder shades the treads
        const tau = (lat + P.gapHalf + 1.5) / Math.abs(sunAcr), t2 = t + tau * sunAl;
        const ho = t2 > FIN_T0E || t2 < FIN_T1 ? 0 : finTopAt(1 - si, t2);
        // (on the wall the edge of that shadow is the ledges' own; on the shoulder it wanders with the ground and is soft, and the shade
        // under it is never full: a ruled dark band lay across the nose)
        if (wall) return sstep(-1.5, 3.0, y + tau * sunL.y - 0.3 * ho);
        // (round 11: and it is not laid over the shoulder at all. Its edge is a level line, y = 0.3 ho, so on the east nose, which
        // comes down to the plain, everything under some thirteen metres stood in a shade the land beside it does not have: the
        // ruled dark band across the nose. The shoulders keep the ridge's own baked shadow)
        return 1;
      };
      const o3 = [0, 0, 0], oa = [0, 0, 0], ob = [0, 0, 0], oc = [0, 0, 0], od = [0, 0, 0];
      const wallPos = (i, r, o) => {
        const t = tOf(i), Ht = HtA[i], y0 = rc[r] - FIN_K * t - foA[i], y = y0 < 0 ? 0 : y0 > Ht ? Ht : y0;
        const env = sstep(0.15, 1.8, y) * (1 - sstep(Ht - 1.7, Ht - 0.15, y)), bed = rbed[r];
        const vary = 0.78 + 0.22 * (1 + N.n2(t / 9.3 + bed * 3.1, bed * 1.7 + si * 40));
        const jt = 0.5 * (1 - sstep(0.2, 1.5, djA[i]));                          // the wall is let in half a metre at a joint
        const flute = beds[bed].p < 0.3 ? 0.42 * Math.abs(N.n2(t / 3.4 + bed * 5.3, si * 7 + bed)) : 0;                  // soft beds are fluted down the fall line
        const lat = footA[i] + finBatter(y) - (roff[r] * vary - jt - flute + 0.6 * N.n2(t / 23 + si * 9, rc[r] / 9)) * env;
        o[0] = bxA[i] + acrX * side * lat; o[1] = y; o[2] = bzA[i] + acrZ * side * lat;
        return y0 < 0 ? -1 : y0 > Ht ? 1 : 0;
      };
      const pos = [], nor = [], bake = [], fin = [], idx = [];
      const vmap = new Map();
      const wallVert = (i, r) => {
        const key = i * 4096 + r; let v = vmap.get(key); if (v !== undefined) return v;
        const cl = wallPos(i, r, o3), t = tOf(i), kind = rkind[r];
        wallPos(Math.max(0, i - 1), r, oa); wallPos(Math.min(finN - 1, i + 1), r, ob);
        wallPos(i, kind === 1 ? r : r - 1, oc); wallPos(i, kind === 2 ? r : r + 1, od);
        const ux = ob[0] - oa[0], uy = ob[1] - oa[1], uz = ob[2] - oa[2], wx = od[0] - oc[0], wy = od[1] - oc[1], wz = od[2] - oc[2];
        let nx = uy * wz - uz * wy, ny = uz * wx - ux * wz, nz = ux * wy - uy * wx;
        if (nx * inX + nz * inZ + ny * 0.6 < 0) { nx = -nx; ny = -ny; nz = -nz; }
        let nl = Math.hypot(nx, ny, nz);
        if (nl < 1e-6 || cl !== 0) { nx = inX; ny = cl > 0 ? 0.9 : 0.3; nz = inZ; nl = Math.hypot(nx, ny, nz); }
        nx /= nl; ny /= nl; nz /= nl;
        if (cl === 0) { ny += rtilt[r]; nl = Math.hypot(nx, ny, nz); nx /= nl; ny /= nl; nz /= nl; }
        v = pos.length / 3; vmap.set(key, v);
        pos.push(o3[0], o3[1], o3[2]); nor.push(nx, ny, nz);
        const lat = (o3[0] - bxA[i]) * acrX * side + (o3[2] - bzA[i]) * acrZ * side;
        bake.push(Math.min(1, (cl === 0 ? rao[r] : 0.9) * (0.55 + 0.45 * sstep(0, 7, o3[1]))), keyOf(lat, o3[1], t, o3[0], o3[2], true) * (cl === 0 ? rkey[r] : 1));
        fin.push(phiA[i] + (hsh(rbed[r] * 3.3 + si) - 0.5) * 0.05, 0);
        return v;
      };
      // beyond the ring, where we never ride, the wall is built in columns twice as wide
      let iFar = Math.ceil((FIN_T0E - ((opts.ringT ?? 110) - 12)) / FIN_DT); iFar += iFar & 1;
      for (let i = 0, cnt = 0; i < finN - 1; cnt++) {
        const i2 = Math.min(finN - 1, i + (i >= iFar ? 2 : 1));
        if (!(HtA[i] < 0.7 && HtA[i2] < 0.7)) {
          const tA = tOf(i), tB = tOf(i2);
          for (let r = Math.min(rLo[i], rLo[i2]); r < NRW - 1; r++) {
            const a0 = rc[r] - FIN_K * tA - foA[i], a1 = rc[r + 1] - FIN_K * tA - foA[i], b0 = rc[r] - FIN_K * tB - foA[i2], b1 = rc[r + 1] - FIN_K * tB - foA[i2];
            if (a0 > HtA[i] && b0 > HtA[i2]) break;                         // this row and all above are over the rim
            if (a1 < 0 && b1 < 0) continue;                                    // under the floor
            const a = wallVert(i, r), b = wallVert(i2, r), c = wallVert(i, r + 1), d = wallVert(i2, r + 1);
            idx.push(a, b, d, a, d, c);
          }
        }
        i = i2;
        await ctx.yield();                    // after every column of the wall
      }
      // the shoulder: rows at growing distance from the rim
      const wallIdx = idx.length;
      const s0 = pos.length / 3, sy = new Float32Array(finN * ND), sx = new Float32Array(finN * ND), sz = new Float32Array(finN * ND), sao = new Float32Array(finN * ND);
      for (let i = 0; i < finN; i++) {
        const t = tOf(i), Ht = HtA[i], rim = footA[i] + finBatter(Ht), ph = phiA[i], f = ph - Math.floor(ph), tri = 1 - Math.abs(2 * f - 1);
        const fe = sstep(FIN_T1 + 2, FIN_T1 + 12, t) * (1 - sstep(FIN_T0E - 16, FIN_T0E - 5, t));
        const dive = 3.2 * (1 - sstep(FIN_T1, FIN_T1 + 3, t) * (1 - sstep(FIN_T0E - 4, FIN_T0E - 1, t)));
        for (let j = 0; j < ND; j++) {
          const dd = j ? dds[j - 1] : 0, lat = rim + dd, latS = lat + P.back(t) * (1 - sstep(8, 34, dd)) + 0.5;
          // the ridge's own surface, read both here and a little further out (its wall stands back from the fin's): the higher of the two
          let base = height(bxA[i] + acrX * side * latS, bzA[i] + acrZ * side * latS), cvd = Hf.carved();
          { const b2 = height(bxA[i] + acrX * side * lat, bzA[i] + acrZ * side * lat); if (b2 > base) { base = b2; cvd = Hf.carved(); } }
          const wC = sstep(0.5, 5, cvd);
          const fo = 1 - sstep(mx - 22, mx - 9, dd);
          // (rounded gullies: a V sampled at 1.4 m, 3 m rills and bed-by-bed terraces all broke the shoulder into shards)
          // (and shallow: at their old depth, sampled every 1.4 m, they crumpled the nose and the shoulder into zigzag facets; the
          // beds' own little terraces are left to the shader)
          const gd = (0.4 + Math.min(dd * 0.12, 1.15)) * (0.5 - 0.5 * Math.cos(Math.PI * tri)) * wC;
          const pr = protOf(hardThin(bxA[i] + acrX * side * lat, base, bzA[i] + acrZ * side * lat)), terr = 0;
          let y = base + (terr - gd) * fo * fe;
          y = mix(Ht + 0.02, y, sstep(0, 1.6, dd)) - 3.0 * sstep(mx - 7, mx, dd) - dive;
          if (Ht < 0.7 && dd < 3) y = Math.min(y, base - 0.4);
          const k = i * ND + j;
          sx[k] = bxA[i] + acrX * side * lat; sy[k] = y; sz[k] = bzA[i] + acrZ * side * lat;
          sao[k] = Math.min(1, Math.max(0.42, 0.95 - 0.15 * gd * fo * fe + 0.1 * pr));
        }
        if ((i & 1) === 1) await ctx.yield();
      }
      {
        // the Ribbon's flutes are narrower than the shoulder's outer columns are wide (5 to 7 m): sampled so they came out as a crumple
        // of facets. The surface is smoothed once across the fall line and once along it (never the two rows at the rim, which
        // must meet the wall), so a shoulder is a hill of beds with broad hollows, not shards
        const tmp = new Float32Array(finN * ND);
        for (let i = 0; i < finN; i++) for (let j = 0; j < ND; j++) { const k = i * ND + j; tmp[k] = j < 2 || j === ND - 1 ? sy[k] : 0.27 * sy[k - 1] + 0.46 * sy[k] + 0.27 * sy[k + 1]; }
        await ctx.yield();
        for (let i = 0; i < finN; i++) for (let j = 0; j < ND; j++) { const k = i * ND + j; sy[k] = j < 2 || i === 0 || i === finN - 1 ? tmp[k] : 0.25 * tmp[k - ND] + 0.5 * tmp[k] + 0.25 * tmp[k + ND]; }
        await ctx.yield();
      }
      for (let i = 0; i < finN; i++) for (let j = 0; j < ND; j++) {
        if (j === 0 && (i & 15) === 15) await ctx.yield();
        const k = i * ND + j, ka = Math.max(0, i - 1) * ND + j, kb = Math.min(finN - 1, i + 1) * ND + j, kc = i * ND + Math.max(0, j - 1), kd = i * ND + Math.min(ND - 1, j + 1);
        const ux = sx[kb] - sx[ka], uy = sy[kb] - sy[ka], uz = sz[kb] - sz[ka], wx = sx[kd] - sx[kc], wy = sy[kd] - sy[kc], wz = sz[kd] - sz[kc];
        let nx = uy * wz - uz * wy, ny = uz * wx - ux * wz, nz = ux * wy - uy * wx;
        if (ny < 0) { nx = -nx; ny = -ny; nz = -nz; }
        const nl = Math.hypot(nx, ny, nz) || 1, dd = j ? dds[j - 1] : 0;
        pos.push(sx[k], sy[k], sz[k]); nor.push(nx / nl, ny / nl, nz / nl);
        bake.push(sao[k], Math.min(shadowAt(sx[k], sz[k]) + 0.25 * (1 - sstep(0, 30, dd)), keyOf(footA[i] + finBatter(HtA[i]) + dd, sy[k], tOf(i), sx[k], sz[k], false)));
        fin.push(phiA[i], 0.1 + 0.4 * sstep(0, 9, dd) + 0.5 * sstep(mx * 0.55, mx - 9, dd));
      }
      for (let i = 0; i < finN - 1; i++) for (let j = 0; j < ND - 1; j++) { const a = s0 + i * ND + j, b = a + ND, c = a + 1, d = b + 1; idx.push(a, b, d, a, d, c); }
      await ctx.yield();
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
      await ctx.yield();
      g.setAttribute('aBake', new THREE.Float32BufferAttribute(bake, 2));
      await ctx.yield();
      g.setAttribute('aFin', new THREE.Float32BufferAttribute(fin, 2));
      await ctx.yield();
      g.setIndex(idx);
      await ctx.yield();
      g.computeBoundingSphere();
      const finMesh = new THREE.Mesh(g, finMat); finMesh.name = si ? 'fin-east' : 'fin-west'; body.add(finMesh);
      finLods.push({ g, wall: wallIdx, all: idx.length });
      await ctx.yield();
    }
  }

  // ---- talus blocks at the gully mouths, on the apron and at the feet of the fins
  {
    const g0 = new THREE.IcosahedronGeometry(1, 1);
    const p = g0.attributes.position;
    for (let i = 0; i < p.count; i++) {
      let x = p.getX(i), y = p.getY(i), z = p.getZ(i);
      const d = 1 + 0.24 * N.n3(x * 1.3 + 3, y * 1.3, z * 1.3) + 0.10 * N.n3(x * 3.1, y * 3.1 + 7, z * 3.1);
      x *= d; y *= d; z *= d;
      y = Math.round(y * 2.6) / 2.6 * 0.6 + y * 0.4;               // bedding-plane facets
      if (y < -0.45) y = -0.45 + (y + 0.45) * 0.2;                 // sits on the ground
      p.setXYZ(i, x * 1.15, y * 0.72, z);
    }
    g0.computeVertexNormals();
    await ctx.yield();
    const count = Math.round(210 * (0.6 + 0.4 * detail));
    const blocks = new THREE.InstancedMesh(g0, mkMat(ROCK_VS, ROCK_FS, { defines: { BLOCK: 1 } }), count);
    const m = new THREE.Matrix4(), qt = new THREE.Quaternion(), eu = new THREE.Euler(), sc = new THREE.Vector3(), pp = new THREE.Vector3();
    let n = 0, guard = 0;
    while (n < count && guard++ < count * 8) {
      if ((guard & 15) === 0) await ctx.yield();      // every sixteenth try
      let x, z; const s = 0.45 + 2.4 * Math.pow(rng(), 2.2);
      const kind = rng();
      if (kind < 0.3) { const t = rng.range(-150, 190), d = (P.gapHalf - 1.2 + rng.range(0, 3.2)) * rng.sign(); x = P.gx + t * P.gTan + d / P.gCos; z = P.gz + t; }
      else { x = rng.range(X0 + 40, X1 - 40); const ci = Math.round(x - X0); const W = Hf.crestH[ci] / TAN_F; z = Hf.crestZ[ci] + W * (kind < 0.8 ? rng.range(0.86, 1.22) : rng.range(0.45, 0.9)); }
      if (z > Z1 - 30 || z < Z0 + 20) continue;
      const sB = kind < 0.3 ? 0.35 + (s - 0.45) * 0.3 : s;        // only small blocks on the gap floor
      if (gapDist(x, z) < 9.2 + sB * 1.2) continue;
      const y = height(x, z);
      if (kind < 0.3 && y > 3) continue;                          // never up a wall
      if (kind >= 0.3 && Math.abs(height(x, z + 1.5) - height(x, z - 1.5)) + Math.abs(height(x + 1.5, z) - height(x - 1.5, z)) > 1.35) continue;   // nor perched on the face
      {                                                          // the herd's run-in from the Knife end to the gap mouth stays clear
        const ex = P.gx + gapAxis.x * 255 - (P.gx - 185), ez = P.gz + gapAxis.z * 255 - 410, el = ex * ex + ez * ez;
        const tt = Math.min(1.25, Math.max(-0.2, ((x - (P.gx - 185)) * ex + (z - 410) * ez) / el));
        if (Math.hypot(x - (P.gx - 185) - ex * tt, z - 410 - ez * tt) < 15 + sB * 2) continue;
      }
      pp.set(x, y + sB * 0.12, z);
      eu.set(rng.range(-0.3, 0.3), rng.range(0, 6.283), rng.range(-0.3, 0.3)); qt.setFromEuler(eu);
      sc.set(sB * rng.range(0.8, 1.3), sB * rng.range(0.6, 1.1), sB * rng.range(0.8, 1.3));
      blocks.setMatrixAt(n++, m.compose(pp, qt, sc));
    }
    blocks.count = n; blocks.instanceMatrix.needsUpdate = true; blocks.frustumCulled = false;
    blocks.name = 'ribbon-talus'; body.add(blocks);
  }
  await ctx.yield();

  // ---- ledge falls
  const cellPos = (idx) => { const i = idx % TW, j = (idx / TW) | 0; return [X0 + (i + 0.5) * dxT, hgt[idx], Z0 + (j + 0.5) * dzT]; };
  fallsRaw.sort((a, b) => (b.drop * (1 + 0.2 * b.w)) - (a.drop * (1 + 0.2 * a.w)));
  const falls = [];
  for (const f of fallsRaw) {
    const [x, y, z] = cellPos(f.idx);
    const inGap = gapDist(x, z) < 34 || sinkAt(x, z) > 0.01;
    if (inGap) continue;                                                    // the height field's gap walls are hidden behind the fin meshes
    const nearCount = falls.reduce((s, o) => s + ((Math.abs(o.x - x) < 16 && Math.abs(o.z - z) < 16) ? 1 : 0), 0);
    if (nearCount > 0) continue;
    if (inGap && falls.filter((o) => o.inGap).length >= 7) continue;
    const ol = Math.hypot(f.ox * dxT, f.oz * dzT) || 1;
    falls.push({ x, y, z, drop: Math.min(f.drop, 46), ox: f.ox * dxT / ol, oz: f.oz * dzT / ol, w: f.w, inGap });
    if (falls.length >= 84) break;
  }
  await ctx.yield();
  {
    const ringT = opts.ringT ?? 110;                                        // where the world stands its ring on the gap axis
    const nFall = [0, 0];
    let ledgeY = 1e3;
    const sunAcrG = -(sunL.x * acrX + sunL.z * acrZ);                       // positive: the sun stands over the west fin, whose wall is then in shade
    for (const [t0, side, wd] of [[ringT + 100, -1, 2.8], [ringT + 52, -1, 2.6], [ringT + 6, -1, 4.4], [ringT - 34, 1, 2.2], [ringT + 66, 1, 2.0]]) {
      const si = side > 0 ? 1 : 0;
      let t = t0, best = 9;                                                 // each pours through the nearest gully notch of the rim
      for (let q = t0 - 7; q <= t0 + 7; q += 0.25) { const ph = finPhi(si, q), e = Math.abs(ph - Math.floor(ph) - 0.5); if (e < best) { best = e; t = q; } }
      if (t > FIN_T0 - 4 || t < FIN_T1 + 20) continue;
      const Hl = finTopAt(si, t); if (Hl < 12) continue;
      const lat = finFoot(t) + finBatter(Hl) - 0.6, bx = P.gx + gapAxis.x * t, bz = P.gz + gapAxis.z * t;
      // the fall itself is drawn on the wall (ROCK_FS, veil); here only its mist is seated
      (si ? U.uFallE : U.uFallW).value.setComponent(nFall[si]++, finPhi(si, t));
      const yL = Math.min(0.62 * Hl, 26), latL = finFoot(t) + finBatter(yL) - 2.6 - 0.2 * wd;      // the ledge it leaps from, and a point clear of the proudest bed there
      if (side < 0) ledgeY = Math.min(ledgeY, yL);
      falls.unshift({ x: bx + acrX * side * lat, y: Hl - 0.5, z: bz + acrZ * side * lat, drop: Hl - 0.6, ox: -acrX * side, oz: -acrZ * side, w: 9, inGap: true, fin: true, wd, t, side, bx, bz,
        leap: side < 0 ? { x: bx + acrX * side * latL, y: yL, z: bz + acrZ * side * latL, drop: yL - 0.15, shade: side * sunAcrG > 0.05 ? 0 : 1 } : null });
    }
    U.uLand.value.z = ledgeY > 900 ? 0 : ledgeY;
  }
  {
    const SEG = 8, vp = [], vu = [], vi = [];
    for (let j = 0; j <= SEG; j++) { vp.push(-0.5, 0, 0, 0.5, 0, 0); vu.push(0, j / SEG, 1, j / SEG); }
    for (let j = 0; j < SEG; j++) { const a = j * 2; vi.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
    const g = new THREE.InstancedBufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(vp, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(vu, 2));
    g.setIndex(vi);
    const ribbons = falls.filter((f) => !f.fin || f.leap), nf = Math.max(1, ribbons.length);
    const aTop = new Float32Array(nf * 4), aPar = new Float32Array(nf * 4);
    ribbons.forEach((f, k) => {
      if (f.fin) {            // seed + 2: the fall hangs in the shade of its own wall; a short throw keeps its foot clear of the lanes
        aTop.set([f.leap.x, f.leap.y, f.leap.z, f.leap.drop], k * 4);
        aPar.set([f.wd, rng() * 0.98 + (f.leap.shade ? 2 : 0), f.ox * 0.42, f.oz * 0.42], k * 4);
        return;
      }
      aTop.set([f.x + f.ox * 0.4, f.y - 0.15, f.z + f.oz * 0.4, f.drop + 0.8], k * 4);
      aPar.set([f.wd || Math.min(2.6, 0.7 + 0.16 * f.w + f.drop * 0.035), rng() * 0.98, f.ox, f.oz], k * 4);
    });
    g.setAttribute('aTop', new THREE.InstancedBufferAttribute(aTop, 4));
    g.setAttribute('aPar', new THREE.InstancedBufferAttribute(aPar, 4));
    g.instanceCount = ribbons.length;
    const mesh = new THREE.Mesh(g, mkMat(FALL_VS, FALL_FS, { transparent: true, depthWrite: false, side: THREE.DoubleSide }));
    mesh.frustumCulled = false; mesh.renderOrder = 2; mesh.name = 'ribbon-falls'; body.add(mesh);
  }
  await ctx.yield();

  // ---- mist at the foot of the falls, vapour off sunlit wet rock, dry dust streaming off the crest
  {
    const pa = [], pr = [];
    for (const f of falls) for (let k = 0; k < (f.fin ? 8 : 3); k++) {
      const out = f.drop * 0.22 + 1 + rng.range(0, 2);
      if (f.fin) {                                   // a fin fall smokes where it strikes the floor: a skirt of mist along the foot, and spray hanging against its lower third
        const r1 = rng(), r2 = rng(), r3 = rng(), r4 = rng(), r5 = rng(), r6 = rng(), big = (f.wd || 1) > 2 ? 1.3 : 1;
        for (let q = 0; q < 3; q++) {
          const yq = q === 0 ? 0.6 + 1.6 * r4 : q === 1 ? 2 + 0.3 * f.drop * r5 : 1 + 4 * r3;
          const al = ((q === 0 ? r2 : q === 1 ? r6 : r1) * 2 - 1) * (q === 0 ? 5.5 : q === 1 ? 2.2 : 3.6) * big;
          const lat = finFoot(f.t + al) + finBatter(yq) - (q === 0 ? 2.2 + 2.5 * r3 : q === 1 ? 1.6 : 3.5 + 2 * r5);
          pa.push(f.bx + gapAxis.x * al + acrX * f.side * lat, yq, f.bz + gapAxis.z * al + acrZ * f.side * lat, (q === 0 ? 7 + 5 * r1 : q === 1 ? 4 + 3.5 * r3 : 5 + 4 * r2) * big);
          pr.push(q === 0 ? r5 : q === 1 ? r2 : r6, 3, q === 0 ? 3 + 4 * r6 : q === 1 ? 2 + 3 * r4 : 5 + 5 * r1, 0.12 + 0.12 * (q === 0 ? r2 : q === 1 ? r1 : r4));
        }
        continue;
      }
      pa.push(f.x + f.ox * out + rng.range(-1, 1), f.y - f.drop + rng.range(0, 1.5), f.z + f.oz * out + rng.range(-1, 1), 5 + f.drop * 0.5 + rng.range(0, 3));
      pr.push(rng(), 0, rng.range(5, 11) + f.drop * 0.2, rng.range(0.13, 0.24));
    }
    const nVap = Math.round(300 * detail), nDust = Math.round(80 * detail);
    for (let k = 0; k < nVap + nDust; k++) {
      const dust = k >= nVap;
      const x = rng.range(X0 + 50, X1 - 50), ci = Math.round(x - X0), W = Hf.crestH[ci] / TAN_F;
      const z = Hf.crestZ[ci] + W * (dust ? rng.range(-0.02, 0.35) : rng.range(0.06, 0.92));
      const y = height(x, z);
      if (y < 4) continue;
      pa.push(x, y + (dust ? 2 : 5), z, dust ? rng.range(16, 34) : rng.range(20, 44));
      pr.push(rng(), dust ? 2 : 1, dust ? rng.range(8, 18) : rng.range(16, 34), dust ? rng.range(0.05, 0.09) : rng.range(0.03, 0.055));
    }
    const g = new THREE.InstancedBufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute([-0.5, -0.5, 0, 0.5, -0.5, 0, 0.5, 0.5, 0, -0.5, 0.5, 0], 3));
    g.setIndex([0, 1, 2, 0, 2, 3]);
    g.setAttribute('aPos', new THREE.InstancedBufferAttribute(new Float32Array(pa), 4));
    g.setAttribute('aPar', new THREE.InstancedBufferAttribute(new Float32Array(pr), 4));
    g.instanceCount = pa.length / 4;
    const mesh = new THREE.Mesh(g, mkMat(PUFF_VS, PUFF_FS, { transparent: true, depthWrite: false }));
    mesh.frustumCulled = false; mesh.renderOrder = 3; mesh.name = 'ribbon-vapour'; body.add(mesh);
  }
  await ctx.yield();

  // ---- rain veils behind the line
  if (opts.rain !== false && weather !== 'clear' && hourName !== 'dawn') {
    const offs = [22, 105, 230, 390], vp = [], vl = [], vi = [];
    offs.forEach((o, k) => {
      const s = rng();
      vp.push(-470, 0, 0, 470, 0, 0, 470, 400, 0, -470, 400, 0);
      for (let c = 0; c < 4; c++) vl.push(o, s);
      vi.push(k * 4, k * 4 + 1, k * 4 + 2, k * 4, k * 4 + 2, k * 4 + 3);
    });
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(vp, 3));
    g.setAttribute('aLayer', new THREE.Float32BufferAttribute(vl, 2));
    g.setIndex(vi);
    const mesh = new THREE.Mesh(g, mkMat(RAIN_VS, RAIN_FS, { transparent: true, depthWrite: false, side: THREE.DoubleSide }));
    mesh.frustumCulled = false; mesh.renderOrder = 4; mesh.name = 'ribbon-rain'; body.add(mesh);
  }
  await ctx.yield();

  // ---- anchors (local space; x flipped when mirrored)
  const fx = opts.mirror ? -1 : 1;
  const V = (x, y, z) => new THREE.Vector3(x * fx, y, z);
  const seat = new THREE.Vector3(P.gx, 2.3, P.gz);
  const onAxis = (t, y) => V(seat.x + gapAxis.x * t, y, seat.z + gapAxis.z * t);
  const flyThrough = [V(P.gx - 330, 2.3, 800), V(P.gx - 250, 42.3, 600), V(P.gx - 185, 42.3, 410), onAxis(255, 16), onAxis(150, 6), onAxis(60, 2.3), onAxis(0, 2.3), onAxis(-60, 2.3)];
  const crest = [];
  for (let x = X0 + 40; x <= X1 - 40; x += 40) { const ci = Math.round(x - X0); crest.push(V(x, height(x, Hf.crestZ[ci]), Hf.crestZ[ci])); }
  const anchors = {
    portalSeat: { position: onAxis(0, 2.3), facing: V(gapAxis.x, 0, gapAxis.z) },
    flyThrough,
    viewpoints: { wash: flyThrough[0], knifeMid: flyThrough[1], underFace: flyThrough[2], gapMouth: flyThrough[5] },
    gap: { center: onAxis(0, 0), axis: V(gapAxis.x, 0, gapAxis.z), halfWidth: P.gapHalf, finHeight: P.finH },
    crest,
    falls: falls.map((f) => V(f.x, f.y, f.z)),
    strike: V(1, 0, 0), faceNormal: new THREE.Vector3(0, Math.cos(38 * Math.PI / 180), Math.sin(38 * Math.PI / 180)),
  };

  // ---- progress: everything scripted hangs off u
  const wW = wetDir.x * (X0 + 20) + wetDir.y * 110, wE = wetDir.x * (X1 - 20) + wetDir.y * 110;
  // before it reaches the ridge the shower closes in slowly from 400 m off its west end, so its curtain stands there in the first frame
  const frontAt = (u) => { const q = (u - 0.38) / 0.34; return mix(wW, wE, q < 0 ? -(1 - Math.exp(2.5 * q)) / 2.5 : Math.min(2.2, q)); };
  const rainOn = opts.rain === false ? 0 : 1, SHADE_LEAD = 6;
  // the cloud's shadow is one band of a fixed breadth: its trailing edge follows the wet line this many metres behind it down the
  // storm's heading, all flight. The world gives the breadth its own route asks for (setCloudBreadth: the trailing edge passes
  // over the rider where its design has the sun break); 190 m is the piece's own, for when it stands alone
  let cloudBreadth = 190;
  let driven = false, progress = 0;
  function applyProgress(u) {
    progress = u;
    if (hourName === 'dawn') {                      // already wet; sunrise creeps down the face
      U.uFront.value = -9000; U.uShade.value.x = -9000; U.uShade.value.y = -8000;
      U.uShade2.value.set(0, mix(225, -40, sstep(0.04, 0.72, u)), 0, 0);
      return;
    }
    if (weather === 'clear') { U.uFront.value = -9000; U.uShade.value.x = -9000; U.uShade.value.y = -8000; U.uShade2.value.set(0, -1000, 0, 0); return; }
    const f = frontAt(u);
    U.uFront.value = f;
    // the cloud's shadow is a band that travels with the line, cloudBreadth metres from its leading edge to its trailing one; the
    // low sun breaks under the trailing edge and follows the line along the face, so the soaked beds blaze a few seconds after
    // they are wetted
    U.uShade.value.x = f - cloudBreadth;
    // (its leading edge keeps ONE lead over the wet line all flight: the shadow begins where the wet begins, so the dry land ahead of
    // the line stands in the sun and the line is the edge of both)
    U.uShade.value.y = f + SHADE_LEAD;
    // (the sun patch is whole wherever the cloud's trailing edge stands: its place is the edge's place, it has no clock of its own)
    U.uShade2.value.set(1, -1000, rainOn * sstep(0.33, 0.40, u) * (1 - sstep(0.80, 0.92, u)), 0);
    U.uVeil.value.set(430 * (1 - sstep(0.04, 0.38, u)), rainOn * 0.9 * (1 - sstep(0.80, 0.92, u)));
  }
  applyProgress(0);

  const inv = new THREE.Matrix4(), tmp = new THREE.Vector3();
  let sunWorld = null;
  const hero = {
    object, radius: 440, height: 200, center: new THREE.Vector3(0, 85, 70),
    anchors, ground: true, groundY: -0.6,
    uniforms: U,
    wet: { dir: new THREE.Vector2(wetDir.x * fx, wetDir.y), frontAt },
    strata: { texture: strata.tex, nBed: new THREE.Vector3(nb.x * fx, nb.y, nb.z), b0: BED_B0, span: BED_SPAN },
    heightAt: (x, z) => height(x * fx, z),
    // (ambient occlusion, sun shadow) baked for the ridge at a point of its footprint: for the land the world lays over its floor
    bakeAt(x, z, out) {
      const fi = Math.min(TW - 1.001, Math.max(0, (x * fx - X0) / (X1 - X0) * TW - 0.5)), fj = Math.min(TH - 1.001, Math.max(0, (z - Z0) / (Z1 - Z0) * TH - 0.5));
      const i = fi | 0, j = fj | 0, a = fi - i, b = fj - j, k = (j * TW + i) * 4, k2 = k + TW * 4;
      out[0] = ((bake1[k + 2] * (1 - a) + bake1[k + 6] * a) * (1 - b) + (bake1[k2 + 2] * (1 - a) + bake1[k2 + 6] * a) * b) / 255;
      out[1] = ((bake1[k + 3] * (1 - a) + bake1[k + 7] * a) * (1 - b) + (bake1[k2 + 3] * (1 - a) + bake1[k2 + 7] * a) * b) / 255;
      return out;
    },
    setProgress(u) { driven = true; applyProgress(u); },
    // the breadth of the cloud's shadow band in metres down the storm's heading (see cloudBreadth)
    setCloudBreadth(m) { if (m > 0) { cloudBreadth = m; applyProgress(progress); } },
    // world-space sun direction (toward the sun) and colours; baked shadows keep the build-time direction
    setLight({ sunDir, sunColor, sunIntensity, skyColor, skyIntensity } = {}) {
      if (sunDir) sunWorld = sunDir.clone().normalize();
      if (sunColor) { const c = new THREE.Color(sunColor), k = sunIntensity ?? hour.sunI; U.uSunCol.value.set(c.r * k, c.g * k, c.b * k); }
      if (skyColor) { const c = new THREE.Color(skyColor), k = skyIntensity ?? hour.skyI; U.uSkyCol.value.set(c.r * k, c.g * k, c.b * k); }
    },
    update(dt, time, camera) {
      U.uTime.value = time;
      body.updateWorldMatrix(true, false);
      inv.copy(body.matrixWorld).invert();
      if (camera) U.uCam.value.setFromMatrixPosition(camera.matrixWorld).applyMatrix4(inv);
      if (sunWorld) { tmp.copy(sunWorld).transformDirection(inv); if (tmp.y < 0.03) tmp.y = 0.03; U.uSun.value.copy(tmp.normalize()); }
      if (!driven) applyProgress(0.33 + 0.45 * (((time + 10) / 30) % 1));
      const far = (U.uCam.value.x - P.gx) * gapAxis.x + (U.uCam.value.z - P.gz) * gapAxis.z > 560;
      for (const f of finLods) f.g.setDrawRange(far ? f.wall : 0, far ? f.all - f.wall : f.all);
    },
    dispose() {},
  };
  return hero;
}

export { GLSL_COMMON, ROCK_VS, ROCK_FS };
