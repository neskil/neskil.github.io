// WHERE THE PAGE WAS FOLDED: hero set piece "The Figure and the parting", and the klecksography style kit.
//
// FRAMES. The brief's crease frame: +Z is the crease at x 0, y 0; the right leaf is x > 0. The hero's local frame is
// the crease frame moved to the Figure's resting centre: hero.object.position.set(0, 0, FIG_Z0 = 260); never rotate
// or scale it. Everything is built for the RIGHT leaf only and drawn twice with style.mirror(): that is the fold.
//
// buildHero(ctx, opts) -> { object, radius 190, height 190, center, anchors, update, setProgress, setFlight, bodyAt, figureSize, figurePosition, bindCard, style, figure, family, wetness }
//   opts.style    the world's shared makeStyle() instance (pass it; without it the hero makes its own and assumes it is alone in the viewer)
//   opts.palette  the brief's 7 hex strings; opts.stock 'day' | 'dawn' | 'golden' | 'night' (see STOCKS)
//   opts.detail   0.6..1 thins the peel threads;  opts.family  moth | bat | dancers | crown | pelvis | birds (default: by seed)
//   opts.wetness  0 dry pull .. 1 soaked (default: by seed);  opts.page  false = no page under it (a world brings its own leaves);
//   opts.backdrop false = no blank dome;  opts.pageZ  centre of the hero's own page (crease-frame z)
//   hero.setProgress(u, camZ)  u = journey progress 0..1; camZ (optional) = the crease-frame z the Figure's 235 m is added to. The lead is the
//     world's law: a world hands in the lens's z plus its own lead less 235; without camZ the part reads its own journey table (camZAt).
//     Everything keyed to arrival hangs on it: peel 0-.14, lift-off .07-.17, carmine from the tips .27-.52, streaks .44-.64,
//     shut .855-.885 ("the seam takes it"), print soaking into both walls .87-.94. Wingbeat (one stroke in 4 s) and the curling
//     edge run on time. Never called (the viewer): it plays the journey on time and hovers over its ghost.
//   hero.bindCard(mat)   give it every style.card() material of the world's leaves: the hero then drives the ghost and the print on them.
//   hero.figurePosition(v)  the body centre, local, for a poi.
//   anchors (local): origin [0,0,260] (where to put the object in the crease frame); portalSeat { position, facing, radius 7 }
//     (the hoop, z 1150 y 180); flyThrough: the brief's camera line; viewpoints; ghost; print { hingeZ, r }; shut. These are the
//     brief's places, kept for a viewer: the world reads none of them. At entry the Figure does not lie flat under that line: it
//     REARS (see below). The world sets the last print's place and size on its card (u.uStampB, u.uStampBK) and the Figure's course (hero.setFlight).
//   Cost: wing 4.8k x 2, threads about 60 x 24 x 2, own page 10.8k x 2 (opts.page), blank dome; about 34k triangles, 7 draw calls
//   (5 without page and dome). Build about 150 ms in steps under 25 ms (the Figure's field is painted in bands).
//
// makeStyle(ctx, opts) -> the kit (one instance per world; call style.update(dt, time, camera) every frame, or let hero.update do it):
//   palette   linear THREE.Colors: card, blank (the sky), fold (#DADCDF), black, slate, mist, carmine, rose, orange, seaGreen, blue, yellow
//   uniforms  shared by every material: uTime, uViewH, uCard, uFold, uSlate, uInk[6], uThin[6], uHi[6] (ink index 0 black, 1 carmine, 2 orange, 3 sea green, 4 blue, 5 yellow)
//   card(o)   THE LEAF: matte card, greyer in the fold (attribute fold), one ink map (paintInkMap) giving feathered rim with capillary
//             fingers along the fibres, tide line, squeezed washes in flat steps, pooled gloss, veins; the left leaf drinks 10% further.
//   leafGeometry(o), sheetAt(z), leafPoint(z, r)   the ruled leaf from the brief's slope table, embossed gutter, deckle edge, cockle hook.
//   paintInkMap(blots, o)   async; R arrival order, G thinness, B pooled depth, A ink index. Blots spread by u.uGrow, bloom by u.uBloomZ.
//   wet(o)    wet ink off the page (hoop, beads, tubes): flat ink + the one highlight (the white slit overhead, mist on black, rose on carmine).
//   thread(o) + threadGeometry(list)   camera-facing ribbons that stretch, sag, neck, snap and recoil into beads; 1.5 px floor, paling instead.
//   hoop(o)   the exit: right half of the ring of wet ink with its web and falling drops.
//   wing(o) + wingGeometry(), paintFigure(rng, family)   the Figure's own material and field.
//   sky()     the blank: a flat dome one shade lighter than the card.   mirror(obj)   the fold.
// Rules kept: no line, no outline, no cast shadow, no fog, no lights, no blending (opaque or alpha test only), nothing above 1.0.
// Added by the world builder: leafGeometryAsync (the same leaf a few rows at a time; normals are the ruled surface's own);
//   threadGeometry items may carry { period, phase } (seconds): such a thread stretches, snaps and is drawn again on a loop of
//   its own on uTime instead of on u.uClock; thread({ root, rootLen }) sizes the root cone; card() has u.uBloomLen / u.uBloomMin
//   (far blots wait as small cores and swell on approach), metre and fine grain on every wash edge, satellite spatter, pool
//   flanks that show the slit when skimmed, and rims that creep on time; uniforms.uFold2 + foldW / FOLD_FRAG are the second
//   fold (the rare event, see GLSL_COMMON); buildHero takes opts.cleftLift (metres over the path in the cleft, default 150; read only while no law is set by hero.setFlight) and
//   opts.debug = { figu, figz, ... } in place of the old URL switches (no URL is read any more).
// Added in the first fix round: the Figure REARS at entry (uRear in GLSL_WING: beyond 38 m from the hinge the sheet stands curled
//   up and its far half is lifted head-up, so the entry and the portal thumbnail show a blot, not a stain seen edge-on);
//   hero.setFlight(law) gives the Figure a course of its own in the fold: { y, size, sizeOpen, pitch, cleft } at its own station
//   (hero.bodyAt(u, law) is the same body without update(); from u .77 it climbs over the hoop and at .855-.885 shuts into a blade two
//   metres open that STAYS standing over the hoop: the wing is never switched off); thread() has u.uFigCut (the Figure's nose z,
//   band below the path): looping threads behind it neck, snap and stay as beaded stumps, and far threads pale to a haze and
//   thin to a third; card() has ink anatomy in METRES at close range for map blots and for the Figure's print alike (capillary
//   fingers, granular tide line, squeezed band, flat wash steps with crisp edges, pools whose slit highlight has an edge),
//   a majority-of-four ink index (no texel stairs between inks), no pale feather where two blots meet, and a pale gutter through
//   colour on the crease; paintInkMap blots fade before their own bounding box and may carry { late } (the core arrives later).
// Polish 5 (a repair round: stairs, seam, exit, highlights): paintInkMap's texture is now HALF FLOAT (arrival order as a smooth
//   field, thinness and pooled depth blurred across blot seams, blots joined by a smooth minimum; 'data' and sample() are the
//   old bytes, unchanged), and a blot may carry a NEGATIVE late (it is laid over its neighbours); card() fades every noise out
//   before its cell is four pixels wide (BL) and takes every wash, pool and highlight border as an fwidth edge; leafPoint's x
//   is exactly 0 on the crease (the two leaves share that edge: no slot); wing() and wet() show the slit as ONE flat pale shape
//   with an ink edge; style.corona({ inner, seed }) is the ring of wet colour round the hoop (u.uOpen 0..1, see there). The
//   world scales the hoop to 8.2 m inside radius (anchors.portalSeat.radius still names the brief's 7).
// ASSUMED POST: { flat: 1, bloom: { strength: 0 }, grade: { saturation: 1, contrast: 1, vignette: 0, grain: 0 } }, exposure 1;
// colours are written as the brief's hexes, not pre-corrected. Viewer: &flat=1&bloom=0. Test switches, as opts.debug = { ... } (ignored when
// opts.style is given): figu, figz, figfam, figslope, figpage, figreal, fighoop, figcam.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { clamp, lerp, smoothstep, makeRng, hashSeed } from '../kit/core.js';

export const FIG_Z0 = 260;          // crease-frame z of the Figure's centre while it lies on the page
export const FIG_HALF_LEN = 130;    // the Figure's field covers z -130..130 (ink reaches about +-110)
export const FIG_REACH = 180;       // and r 0..180 up the leaf (ink reaches about 160)

// ---- the sheet: leaf slope (degrees from level), half-gap at path height, path height, by crease-frame z
const SHEET = [[-300, 14, 180, 45], [0, 14, 180, 45], [440, 28, 75, 40], [730, 58, 60, 100], [900, 77, 38, 165], [1000, 83, 22, 180], [1150, 87, 9, 180], [1210, 89.6, 1, 180], [1500, 89.6, 1, 180]];
export const FOLD_ROWS = SHEET.map((row) => row[0]);   // the stations of the table's rows along the crease, first to last (the first is the leaf's own near end)
export function sheetAt(z) {
  let i = 1; while (i < SHEET.length - 1 && z > SHEET[i][0]) i++;
  const a = SHEET[i - 1], b = SHEET[i], t = clamp((z - a[0]) / (b[0] - a[0]), 0, 1), e = t * t * (3 - 2 * t);
  return { slope: lerp(a[1], b[1], e) * Math.PI / 180, halfGap: lerp(a[2], b[2], e), pathY: lerp(a[3], b[3], e) };
}
// a point of the right leaf: z along the crease, r metres up the leaf from the crease. The crease is an embossed
// gutter 3 m wide (rounded, 0.4 m deep), never a sharp line.
export function leafPoint(z, r, out = new THREE.Vector3()) {
  const a = sheetAt(z).slope, g = 0.4 * Math.exp(-(r * r) / 2.2);
  return out.set(r * Math.cos(a) + (g - 0.4) * Math.sin(a) * 0.3, r * Math.sin(a) - g * Math.cos(a), z);   // (polish 5) x is 0 on the crease: the leaves meet, no slot
}

// ---- stock and inks. Index 0 black, 1 carmine, 2 orange, 3 sea green, 4 blue, 5 yellow.
const STOCKS = {
  day: { card: '#F5F3EE', blank: '#FBFAF7', fold: '#DADCDF', black: '#15151A', slate: '#6E7887', mist: '#B4BBC6', carmine: '#C3243B', rose: '#EAA3AC', orange: '#E88B3C', seaGreen: '#4FA78F', blue: '#5A86C6', yellow: '#EDCB57' },
  dawn: { card: '#F3EBDD', blank: '#F9F4EA', fold: '#DCD3C4', black: '#3B2A1E', slate: '#8A735F', mist: '#C9B9A6', carmine: '#A8324A', rose: '#E0A5AE', orange: '#E88B3C', seaGreen: '#4FA78F', blue: '#E88B3C', yellow: '#4FA78F' },
  golden: { card: '#E6D3A8', blank: '#EEDFBC', fold: '#CDBB92', black: '#1B2233', slate: '#59647C', mist: '#A3A796', carmine: '#2F8F7F', rose: '#9CCBB8', orange: '#E88B3C', seaGreen: '#4FA78F', blue: '#5A86C6', yellow: '#EDCB57' },
  night: { card: '#17171C', blank: '#101014', fold: '#2A2C33', black: '#F2F0EA', slate: '#A9AEB8', mist: '#6E7887', carmine: '#C3243B', rose: '#EAA3AC', orange: '#E88B3C', seaGreen: '#4FA78F', blue: '#5A86C6', yellow: '#EDCB57' },
};

// ---- GLSL shared by every material of the style
export const GLSL_COMMON = /* glsl */`
#define FIG_R 160.
uniform vec3 uCard, uFold, uSlate, uInk[6], uThin[6], uHi[6];   // full-strength ink, its thinned wash, its wet highlight
uniform float uTime, uViewH;
// THE SECOND FOLD (the rare event): a horizontal crease at path height. uFold2 = (how far it has opened 0..1, 0, 1 when the
// world has one). Objects drawn under a y-flipped parent (modelMatrix[1].y < 0) are folded about it; the fragment stage
// keeps the original above the crease and the folded copy below it. With uFold2.z = 0 nothing is folded or clipped.
uniform vec3 uFold2;
float fold2Y(float z){ return uFold2.x * (mix(100., 165., smoothstep(730., 900., z)) + 15. * smoothstep(900., 1000., z)) * smoothstep(650., 740., z); }
vec3 foldW(vec3 w, float my){ if (my < 0.) w.y = 2. * fold2Y(w.z) + w.y; return w; }
float h21(vec2 p){ p = fract(p * vec2(123.34, 345.45)); p += dot(p, p + 34.345); return fract(p.x * p.y); }
float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(h21(i), h21(i + vec2(1., 0.)), f.x), mix(h21(i + vec2(0., 1.)), h21(i + vec2(1., 1.)), f.x), f.y); }
float fbm3(vec2 p){ return vn(p) * .5 + vn(p * 2.03 + 7.1) * .3 + vn(p * 4.1 + 3.7) * .2; }
vec3 inkAt(float idx){ int i = int(clamp(idx + .5, 0., 5.)); return uInk[i]; }
vec3 thinAt(float idx){ int i = int(clamp(idx + .5, 0., 5.)); return uThin[i]; }
vec3 hiAt(float idx){ int i = int(clamp(idx + .5, 0., 5.)); return uHi[i]; }
// ink thinned by t 0..1 in flat steps that meet without mixing (black goes by way of slate)
vec3 wash2(float idx, float t, float w){ t = clamp(t, 0., 1.); float q = smoothstep(.33 - w, .33 + w, t) * .5 + smoothstep(.69 - w, .69 + w, t) * .5;
  vec3 full = inkAt(idx), pale = thinAt(idx); vec3 mid = idx < .5 ? uSlate : mix(full, pale, .5);
  return q < .5 ? mix(full, mid, q * 2.) : mix(mid, pale, q * 2. - 1.); }
vec3 wash(float idx, float t){ return wash2(idx, t, .03); }
// the only light: the white slit overhead, mirrored in wet ink. n and v are unit, world space, v toward the eye.
float slit(vec3 n, vec3 v, float lo, float hi){ n = n * sign(dot(n, v) + 1e-5); vec3 r = reflect(-v, n);
  return smoothstep(lo, hi, r.y); }
// The Figure's own colouring, shared by its wing and by the prints it leaves on the card.
// f = field texel (r: rim distance, .5 on the rim, +1/96 per metre inward; g: vein; b: pooled depth; a: band noise)
// q = (s, r) in metres on the wing; st = (red 0..1, stripes 0..1, seed)
float figBand(vec2 q, float seed, out float id){
  float y = q.y * .058 + (vn(vec2(q.x * .012, q.y * .02) + seed) - .5) * 1.1 + (vn(q * .13 + seed) - .5) * .3 + (vn(q * .47 - seed) - .5) * .1;      // streaks 17 m apart, running along the hinge (so they lie ACROSS each arm of the tall V)
  id = floor(y); float fy = fract(y), w = .34 + .26 * h21(vec2(id, seed));
  float taper = smoothstep(.16, .4, vn(vec2(q.x * .017 + id * 3.7, id + seed)));   // each starts and stops somewhere
  float hw = w * .5 * taper; return 1. - smoothstep(hw - .03, hw, abs(fy - .5)); }
// (the print on the card keeps the streaks it was first drawn with: narrower, 20 m apart, inks by lot)
float figBandP(vec2 q, float seed, out float id){
  float y = q.y * .05 + (vn(vec2(q.x * .012, q.y * .02) + seed) - .5) * 1.3 + (vn(q * .13 + seed) - .5) * .3 + (vn(q * .47 - seed) - .5) * .1;
  id = floor(y); float fy = fract(y), w = .28 + .4 * h21(vec2(id, seed));
  float taper = smoothstep(.25, .5, vn(vec2(q.x * .017 + id * 3.7, id + seed)));
  float hw = w * .5 * taper; return 1. - smoothstep(hw - .03, hw, abs(fy - .5)); }
float seed2(float s){ return s * 2.3 + 11.; }
float figReach(vec4 f, vec2 q, vec3 st){ return FIG_R * (1. - st.x * .42) - f.g * st.x * 105. - (vn(q * .05 + st.z) - .5) * 26. - (vn(q * .31 + st.z) - .5) * 6.; }
float figFront(vec2 q, vec3 st, float id){ return q.x + (vn(q * .09 + seed2(st.z)) - .5) * 34. + (vn(q * .4) - .5) * 7. - 130. + 260. * (st.y * 1.1 - h21(vec2(id * 7.3, st.z + 2.))) / .09; }
float figInkIndex(vec4 f, vec2 q, vec3 st, out float thin){
  float idx = 0.; thin = 0.;
  if (st.x > .001 && q.y > figReach(f, q, st)) idx = 1.;                        // carmine from the tips, running in along veins
  float id; float b = figBand(q, st.z, id);
  if (b > .5 && figFront(q, st, id) > 0.) { float pick = h21(vec2(id, st.z * 3.1 + 5.));
    idx = pick < .12 ? 1. : 2. + mod(id + floor(h21(vec2(st.z, 9.)) * 4.), 4.); }     // the four washes in turn, so that they can be counted
  return idx; }
float figInkIndexP(vec4 f, vec2 q, vec3 st, out float thin){
  float idx = 0.; thin = 0.;
  if (st.x > .001 && q.y > figReach(f, q, st)) idx = 1.;
  float id; float b = figBandP(q, st.z, id);
  if (b > .5 && figFront(q, st, id) > 0.) { float pick = h21(vec2(id, st.z * 3.1 + 5.));
    idx = pick < .14 ? 1. : 2. + floor(clamp((pick - .14) / .86, 0., .999) * 4.); }
  return idx; }
`;

export const FOLD_FRAG = /* glsl */`
uniform mat4 modelMatrix;
void foldClip(vec3 w, float my){ float f = fold2Y(w.z); if (uFold2.z > .5 && (my < 0. ? (f < .5 || w.y > f) : (f > .5 && w.y < f))) discard; }
`;

// the Figure's pose: a wing point (s, r) in metres -> local position. Shared by the wing and by threads tied to it.
const GLSL_WING = /* glsl */`
        uniform sampler2D uFig; uniform vec4 uPose; uniform vec3 uFigPos, uSlope3; uniform float uPitch, uPeel, uShut, uCurl, uBend, uRear, uSize, uTwist;
        vec3 wingPos(vec2 q){
          float xs = q.x / 110., a0 = uSlope3.x + uSlope3.y * xs + uSlope3.z * xs * xs, ca = cos(a0), sa = sin(a0), g = .4 * exp(-q.y * q.y / 2.2);
          // THE REARING BLOT: beyond 38 m from the hinge the sheet already stands curled up off the page (an arc whose
          // curvature grows toward the far end, so the far half rears over the near half and shows its face to the entry)
          float rb = min(q.y, 38.), sr = max(q.y - 38., 0.), sn = clamp(xs * .5 + .5, 0., 1.);
          float kq = max(uRear * (.0028 + .0078 * sn * sn) * (.93 + .07 * sin(uTime * .8 + q.x * .03)), 1e-5), a1 = a0 + kq * sr, c1 = cos(a1), s1 = sin(a1);
          vec3 ng = vec3(-s1, c1, 0.), pg = vec3(rb * ca + (s1 - sa) / kq + g * sa * .3, rb * sa + (ca - c1) / kq - g * ca, q.x) + ng * .3;
          float d = (textureLod(uFig, vec2(q.x / 260. + .5, q.y / 180.), 0.).r - .5) * 96.;
          float k = clamp((uPeel - d) / 34., 0., 1.), lift = k * k * (3. - 2. * k);
          pg += ng * lift * (4. + 12. * lift) * (.75 + .25 * sin(q.x * .09 + q.y * .05 + uTime * .9));   // the lifted edge curls and breathes
          pg.x -= lift * lift * 5. * c1; pg.y -= lift * lift * 5. * s1;
          float rs = clamp((q.x + 70.) / 180., 0., 1.); pg.y += uRear * 94. * rs * rs * (.95 + .05 * sin(uTime * .6));   // and its far half is already off the page, head up
          float rr = q.y / FIG_R;
          float kb = clamp(q.y / max(uBend, 1.), 0., 1.), prof = kb * kb * (3. - 2. * kb);           // root angle -> tip angle: a V on the floor, a tulip in the cleft
          float a = mix(uPose.y, uPose.z, prof) + uTwist * xs * prof + uCurl * (1. + sin(uPose.w - 1.1 * rr)) * (.35 + .65 * rr) + .04 * rr * sin(q.x * .05 + uTime * 1.3);
          a = min(mix(a, 1.47, uShut), 1.5708);          // shut like a book, but a book has a thickness: a blade two metres open at its tips
          float cp = cos(uPitch), sp = sin(uPitch); vec3 hd = vec3(0., sp, cp), nr = vec3(0., cp, -sp);
          vec3 pa = uFigPos + (hd * q.x + (vec3(cos(a), 0., 0.) + nr * sin(a)) * q.y) * uSize;
          return mix(pg, pa, uPose.x); }
`;

// =====================================================================================================
// makeStyle(ctx, opts): the style kit. opts: { palette: [7 hex as in the brief], stock: 'day'|'dawn'|'golden'|'night' }
// =====================================================================================================
export function makeStyle(ctx, opts = {}) {
  const hex = { ...(STOCKS[opts.stock] || STOCKS.day) }, P = opts.palette;
  if (P && P.length >= 7) Object.assign(hex, { card: P[0], black: P[1], slate: P[2], mist: P[3], carmine: P[4], rose: P[5], seaGreen: P[6] });
  const palette = {}; for (const k in hex) palette[k] = new THREE.Color(hex[k]);
  const inks = [palette.black, palette.carmine, palette.orange, palette.seaGreen, palette.blue, palette.yellow];
  const thins = [palette.mist, palette.rose, ...inks.slice(2).map((c) => c.clone().lerp(palette.card, 0.55))];
  const his = [palette.mist, palette.rose, ...inks.slice(2).map((c) => c.clone().lerp(palette.card, 0.7))];
  // shared uniforms: every material of the style holds these same objects, so one update() drives them all
  const uniforms = {
    uCard: { value: palette.card }, uFold: { value: palette.fold }, uSlate: { value: palette.slate },
    uInk: { value: inks }, uThin: { value: thins }, uHi: { value: his },
    uTime: { value: 0 }, uViewH: { value: 900 }, uFold2: { value: new THREE.Vector3(0, 0, 0) },
  };
  // opts.slope (radians): a page opened to one constant slope instead of the valley's slope table (the set-piece viewer uses it)
  const sheet = (z) => (opts.slope != null ? { slope: opts.slope, halfGap: 45 / Math.tan(opts.slope), pathY: 45 } : sheetAt(z));
  const leafPt = (z, r, out = new THREE.Vector3()) => { const a = sheet(z).slope, g = 0.4 * Math.exp(-(r * r) / 2.2); return out.set(r * Math.cos(a) + (g - 0.4) * Math.sin(a) * 0.3, r * Math.sin(a) - g * Math.cos(a), z); };
  const white = new Uint8Array([255, 0, 0, 0]);
  const noMap = new THREE.DataTexture(white, 1, 1, THREE.RGBAFormat); noMap.needsUpdate = true;   // "never inked"

  // ---- CARD: the leaf. Geometry needs: position, normal, leaf (vec2: crease-frame z, r up the leaf), fold (0 open .. 1 deep in the cleft).
  // INK MAP (style.paintInkMap): R arrival order (0 core, .75 final rim, 1 never), G wash thinness, B pooled depth, A ink index * 40.
  // u.uMapRect = (z0, r0, 1/zLen, 1/rLen) places the map on the leaf; u.uGrow 0..1 spreads every blot (time);
  // inks with index >= u.uBloomFrom only exist behind u.uBloomZ (set it to camera z + lead: blooms keyed to approach).
  // The Figure prints through u.uFig + u.uStampA / u.uGhost (the pale ghost) and u.uStampB / u.uPrint (the last print;
  // u.uStampBK is the size it is pressed at, as a share of the Figure's full size).
  function card(o = {}) {
    return new THREE.ShaderMaterial({
      side: THREE.DoubleSide,
      uniforms: {
        ...uniforms, uMap: { value: o.map || noMap }, uMapRect: { value: o.mapRect || new THREE.Vector4(0, 0, 1, 1) },
        uMapSize: { value: new THREE.Vector2(o.map ? o.map.image.width : 1, o.map ? o.map.image.height : 1) },
        uGrow: { value: 1 }, uBloomZ: { value: 1e6 }, uBloomFrom: { value: 9 }, uBloomLen: { value: 160 }, uBloomMin: { value: 0 }, uBloomBlackZ: { value: 1e6 },
        uFig: { value: o.fig || noMap }, uStampA: { value: new THREE.Vector2(FIG_Z0, 0) }, uGhost: { value: 0 },
        uStampB: { value: new THREE.Vector2(1215, 185) }, uStampBK: { value: 1 }, uPrint: { value: 0 }, uFigState: { value: o.figState || new THREE.Vector3(0, 0, 1) },
      },
      vertexShader: GLSL_COMMON + /* glsl */`
        attribute vec2 leaf; attribute float fold;
        varying vec2 vLeaf; varying float vFoldV, vSide; varying vec3 vW, vN;
        void main(){ vLeaf = leaf; vFoldV = fold;
          vec4 w = modelMatrix * vec4(position, 1.); w.xyz = foldW(w.xyz, modelMatrix[1].y); vW = w.xyz; vN = mat3(modelMatrix) * normal;
          vSide = dot(cross(modelMatrix[0].xyz, modelMatrix[1].xyz), modelMatrix[2].xyz) < 0. ? -1. : 1.;   // -1 on the mirrored (left) leaf
          gl_Position = projectionMatrix * viewMatrix * w; }`,
      fragmentShader: GLSL_COMMON + FOLD_FRAG + /* glsl */`
        uniform sampler2D uMap, uFig; uniform vec4 uMapRect; uniform vec2 uMapSize, uStampA, uStampB;
        uniform float uGrow, uBloomZ, uBloomFrom, uBloomLen, uBloomMin, uBloomBlackZ, uGhost, uPrint, uStampBK; uniform vec3 uFigState;
        varying vec2 vLeaf; varying float vFoldV, vSide; varying vec3 vW, vN;
        float figEdge(vec2 q, float d, float grow){ float aa = fwidth(d) * .75 + 1e-3; return smoothstep(-aa, aa, d - grow); }
        void main(){
          // every texture read and derivative below is taken outside flow control (Direct3D), then masked
          vec3 col = mix(uCard, uFold, clamp(vFoldV, 0., 1.));
          vec3 toEye = cameraPosition - vW; float dist = length(toEye); vec3 v = toEye / max(dist, 1e-3);
          float near = 1. - smoothstep(60., 400., dist), feather = vSide < 0. ? 1.1 : 1.;
          // (polish 5) every noise is faded out as its cell shrinks under a pixel (BL: cells per metre along the crease and up the
          // leaf): thresholded noise finer than the pixel grid is speckle and stairs, and it blew the antialiasing widths up into smears
          vec2 fwL = fwidth(vLeaf);
          #define BL(sx, sy) (1. - smoothstep(.08, .28, max(fwL.x * (sx), fwL.y * (sy))))   // gone before a cell is four pixels wide: a finger is drawn crisp or not at all
          vec2 pA = vec2(vLeaf.x * .035, vLeaf.y * .5);
          float fibA = .5 + (vn(pA) - .5) * .5 * BL(.035, .5) + (vn(pA * 2.03 + 7.1) - .5) * .3 * BL(.071, 1.015) + (vn(pA * 4.1 + 3.7) - .5) * .2 * BL(.1435, 2.05);
          float fibB = .5 + (vn(vec2(vLeaf.x * .9, vLeaf.y * 11.)) - .5) * BL(.9, 11.);   // fibres lie along the crease
          float fibLo = .5 + (vn(pA) - .5) * BL(.035, .5);                                 // the broad lie of the fibres alone: what a wash border follows (fine fibres there read as a smear)
          // ---- the Figure's ghost (A, lying along the crease) and its last print (B, standing up the wall, hinge at uStampB.x)
          vec2 qa = vLeaf - uStampA, qb = vec2(vLeaf.y - uStampB.y, uStampB.x - vLeaf.x);
          vec2 ua = vec2(qa.x / 260. + .5, qa.y / 180.), ub = vec2(qb.x / (260. * uStampBK) + .5, qb.y / (180. * uStampBK));
          float inA = step(0., ua.x) * step(ua.x, 1.) * step(0., ua.y) * step(ua.y, 1.), inB = step(0., ub.x) * step(ub.x, 1.) * step(0., ub.y) * step(ub.y, 1.);
          float fz = (fibA - .5) * 3. + (fibB - .5) * .5 * near;
          vec4 fa = texture2D(uFig, clamp(ua, 0., 1.)), fb = texture2D(uFig, clamp(ub, 0., 1.));
          float creep = (vn(vLeaf * .07 + vec2(uTime * .06, -uTime * .045)) - .5) * 3.2;
          float da = (fa.r - .5) * 96. + fz * feather - 2. + creep * .5, db = (fb.r - .5) * 96. * uStampBK + fz * feather + creep;
          float ea = figEdge(qa, da, 0.) * inA * uGhost;
          float tideA = 1. - smoothstep(1.2, 3., da);
          col = mix(col, mix(uCard, uThin[0], .3 + .14 * step(.55, fa.b) + .22 * tideA), ea);
          // ---- the ink map
          vec2 uv = (vLeaf - uMapRect.xy) * uMapRect.zw, uc = clamp(uv, 0., 1.), px = 1. / uMapSize;
          float inM = step(0., uv.x) * step(uv.x, 1.) * step(0., uv.y) * step(uv.y, 1.);
          vec4 m = texture2D(uMap, uc), mz = texture2D(uMap, uc + vec2(px.x, 0.)), mr = texture2D(uMap, uc + vec2(0., px.y));
          float bz = mz.b - m.b, br = mr.b - m.b;
          // at arm's length the ink has anatomy of its own: the map only sketches a blot, and noise in METRES along the fibres
          // (g0 six metres, g1 and g3 two, g2 half a metre) breaks every edge into capillary fingers, grains the tide line and
          // squeezes the film into flat washes. gm = how fast the arrival order rises per metre, so that a metre is a metre on any blot.
          float near2 = 1. - smoothstep(12., 110., dist), g1 = .5 + (vn(vLeaf * vec2(.55, 1.7)) - .5) * BL(.55, 1.7), g2 = .5 + (vn(vLeaf * vec2(2.3, 7.)) - .5) * BL(2.3, 7.), g0 = .5 + (vn(vLeaf * vec2(.16, .33) + 4.4) - .5) * BL(.16, .33), g3 = .5 + (vn(vLeaf * vec2(.5, 1.5) + 19.3) - .5) * BL(.5, 1.5);
          vec2 tex = 1. / max(uMapRect.zw * uMapSize, vec2(1e-6)), gd = vec2(mz.r - m.r, mr.r - m.r);
          float gl = length(gd / tex), gm = clamp(gl, .0035, .08);
          vec2 jit = ((vec2(vn(vLeaf * .21), vn(vLeaf * .21 + 31.7)) - .5) * 2.4 + (vec2(g1, g3) - .5) * 2.8 * near + (vec2(g2, .5 + (vn(vLeaf * vec2(2.3, 7.) + 11.) - .5) * BL(2.3, 7.)) - .5) * 1.2 * near2) * px;
          // which ink: the one that owns most of the four texels around the (wandering) point, so borders between inks are curves, not stairs
          vec2 tc = clamp(uc + jit, 0., .9999) * uMapSize - .5, ti = max(floor(tc), vec2(0.)), tf = clamp(tc - ti, 0., 1.); ivec2 i0 = ivec2(ti), i1 = min(i0 + 1, ivec2(uMapSize) - 1);
          float a00 = texelFetch(uMap, i0, 0).a, a10 = texelFetch(uMap, ivec2(i1.x, i0.y), 0).a, a01 = texelFetch(uMap, ivec2(i0.x, i1.y), 0).a, a11 = texelFetch(uMap, i1, 0).a;
          float w00 = (1. - tf.x) * (1. - tf.y), w10 = tf.x * (1. - tf.y), w01 = (1. - tf.x) * tf.y, w11 = tf.x * tf.y;
          float s00 = w00 + w10 * step(abs(a10 - a00), .01) + w01 * step(abs(a01 - a00), .01) + w11 * step(abs(a11 - a00), .01);
          float s10 = w10 + w00 * step(abs(a00 - a10), .01) + w01 * step(abs(a01 - a10), .01) + w11 * step(abs(a11 - a10), .01);
          float s01 = w01 + w00 * step(abs(a00 - a01), .01) + w10 * step(abs(a10 - a01), .01) + w11 * step(abs(a11 - a01), .01);
          float s11 = w11 + w00 * step(abs(a00 - a11), .01) + w10 * step(abs(a10 - a11), .01) + w01 * step(abs(a01 - a11), .01);
          float aBest = a00, sBest = s00; if (s10 > sBest) { sBest = s10; aBest = a10; } if (s01 > sBest) { sBest = s01; aBest = a01; } if (s11 > sBest) { sBest = s11; aBest = a11; }
          float idx = floor(aBest * 6.375 + .5);
          float g = uGrow * mix(1., mix(uBloomMin * step(1.5, idx), 1., smoothstep(0., max(uBloomLen, 1.), uBloomZ - vLeaf.x)), max(step(uBloomFrom, idx), smoothstep(uBloomBlackZ - 30., uBloomBlackZ + 30., vLeaf.x)));
          float fing = ((g0 - .5) * 3.4 + (g1 - .5) * 2.6) * near + (g2 - .5) * 1. * near2;                  // metres
          float a = g * .75 - m.r - ((fibA - .5) * .07 + (fibB - .5) * .012 * near) * feather + (vn(vLeaf * .07 + vec2(uTime * .06, -uTime * .045)) - .5) * .028 - fing * gm * feather;
          float aa = fwidth(a) * .75 + 1e-4, e = smoothstep(-aa, aa, a) * inM, am = a / gm;                      // am: metres inside the rim
          // is the card bare just outside this rim? (where two blots meet there is no pale feather between them: they meet without mixing)
          float rOut = texture2D(uMap, clamp(uc + gd / max(length(gd), 1e-5) * px * 2.6, 0., 1.)).r, rimOpen = smoothstep(-.03, .0, rOut - g * .75) * step(1e-5, length(gd));
          float tide = mix(smoothstep(.004, .012, a) * (1. - smoothstep(.02, .034, a)), clamp(smoothstep(.3, .55, am) * (1. - smoothstep(.95, 1.5, am)) * (.3 + 1.5 * g2), 0., 1.), near);   // the tide line is granular
          float band = smoothstep(.95, 1.5, am) * (1. - smoothstep(2.2 + 6. * g0, 3.4 + 8. * g0, am)) * rimOpen;   // behind it the film was squeezed thin
          vec2 wv = (vec2(g1, g3) - .5) * .42 + (vec2(g0, g2) - .5) * .5;                                       // washes never run straight
          float gW = vn(vLeaf * vec2(.045, .08) + wv + idx * 3.3 + 1.7), tW = clamp((gW * .6 + g0 * .25 + fibLo * .15 - .5) * 3. + .1, 0., 1.);
          float tg = m.g + smoothstep(0., .06, m.g) * ((vn(vLeaf * .045 - vec2(uTime * .035, uTime * .05)) - .5) * .16 + (fibLo - .5) * .42 + (g1 - .5) * .22 * near + (g2 - .5) * .12 * near2);
          tg = max(tg, max(tW, band * .52) * near);
          tg = max(tg, exp(-vLeaf.y * vLeaf.y / 1.6) * .78 * step(.5, idx));                                  // the embossed gutter drinks less: a pale crease through any colour that crosses it
          // TIDE LINES INSIDE A BLOT: a blot spreads in fits and every pause leaves its mark, a granular line of full-strength ink
          // with a bled, squeezed band on its rim side, following the blot's own contours (the arrival order), a few metres apart.
          // In every ink but black, the carmine and the four washes alike (the brief: 'tide line following the feathered edge' of
          // blots, not of the carmine alone); gone where the lines would crowd, and beyond 400 m with the washes.
          float lgm = gm * 13., lv = m.r * 13. + (g0 - .5) * .9 + (g1 - .5) * .3 * near, lf = fract(lv) - .5, lw = fwidth(lv) + 1e-4;
          float lOn = (1. - smoothstep(.12, .3, lw)) * (1. - smoothstep(.24, .42, lgm)) * step(.5, idx) * smoothstep(3.5, 7., am) * near;
          float lhw = max(.2 * lgm * (.6 + .8 * g2), lw * .6), lbw = min((1.6 + 4. * g0) * lgm, .46) * lOn;                  // (where the lines must go, the bands narrow to nothing: never paler, never a ghost)
          float lineIn = (1. - smoothstep(lhw, lhw + lw, abs(lf))) * lOn, bandIn = smoothstep(lhw, lhw + lw, lf) * (1. - smoothstep(lbw * .8, lbw + lw, lf)) * step(.02, lOn);
          tg = max(tg, bandIn * mix(.5, .92, smoothstep(lbw * .12, lbw * .5, lf) * (.55 + .9 * g3)));              // rose against the line, the middle step behind it
          float t = max(tg * (1. - .85 * tide), mix((1. - smoothstep(.0, .008, a)) * .6, (1. - smoothstep(.08, .32, am)) * .8, near) * mix(1., rimOpen, near));   // squeezed washes, tide line, feathered rim
          t *= 1. - lineIn;
          float nearInk = smoothstep(460., 240., dist);                                                       // beyond 400 m a blot is one flat tone
          float tt = t * nearInk; vec3 ink = wash2(idx, tt, min(fwidth(tt) * .75 + .0006, .06)), n = vN / max(length(vN), 1e-4);
          float pb = m.b + (fibLo - .5) * .08 + (g1 - .5) * .07 * near + (g2 - .5) * .03 * near2;
          float wp = min(fwidth(pb) * .75 + .0006, .05), pool = smoothstep(.62 - wp, .62 + wp, pb);                      // pooled gloss mirrors the slit
          ink = mix(ink, inkAt(idx), pool);
          // a pool stands proud with a meniscus: its flanks tilt, so the slit shows in it even when we skim the leaf
          vec3 tr = cross(n, vec3(0., 0., 1.)) * vSide, pn = n - (vec3(0., 0., 1.) * (bz + (g1 - .5) * .03) + tr * (br + (g3 - .5) * .03)) * 22.; pn = pn / max(length(pn), 1e-4);
          vec3 pf = pn * sign(dot(pn, v) + 1e-5); float ry = reflect(-v, pf).y, rw = min(fwidth(ry) * .75 + .002, .05);            // the slit in a pool is a flat shape with an edge
          vec3 nf = n * sign(dot(n, v) + 1e-5); float ryn = reflect(-v, nf).y + (g0 - .5) * .24 + (g1 - .5) * .1, rwn = min(fwidth(ryn) * .75 + .002, .05);   // and on the open film it ends in a blot edge, never a ruled one
          float hl = max(smoothstep(.32 - rwn, .32 + rwn, ryn) * smoothstep(.73 - wp, .73 + wp, pb), smoothstep(.25 - rw, .25 + rw, ry) * smoothstep(.65 - wp, .65 + wp, pb));   // (polish 5) every border of the highlight is an edge: the ramps it had were a blur of rose into carmine many pixels wide
          ink = mix(ink, hiAt(idx), pool * hl * nearInk);
          col = mix(col, ink, e);
          // satellite spatter: drops thrown just beyond the rim, half a metre to three across, one to a 5 m cell
          vec2 sc = vLeaf / 5., ci = floor(sc), cf = fract(sc); float sh = h21(ci + 3.1), srad = (.05 + .23 * sh * sh) * step(.42, h21(ci + 5.5));
          // (a drop far from its rim is a smaller drop, never a paler one: at arm's length a faded disc is a ghost, not ink)
          float sgate = srad * smoothstep(-.11, -.02, a);
          float sdd = length(cf - vec2(.3 + .4 * h21(ci + 7.7), .3 + .4 * h21(ci + 1.3))) - sgate, saa = min(fwidth(sdd) * .75 + 1e-3, .05);
          float spat = (1. - smoothstep(-saa, saa, sdd)) * step(.001, sgate) * inM * near * (1. - e);
          col = mix(col, inkAt(idx), spat);
          // veins: hair-thin pulls of thin ink running up the leaf from a blot's rim, 14 m and more apart, each its own length; they pale when far
          float vx = vLeaf.x * .045 + (vn(vec2(vLeaf.x * .02, vLeaf.y * .012)) - .5) * .9 + (vn(vec2(vLeaf.x * .05, vLeaf.y * .11)) - .5) * .2, vid = floor(vx), vh = h21(vec2(vid, 3.7));
          vx += vh * .7; float vfw = fwidth(vx);
          vec2 uvb = clamp(uv - vec2(0., (6. + 26. * vh) * uMapRect.w), 0., 1.);
          float below = texture2D(uMap, uvb).r, bidx = floor(texelFetch(uMap, ivec2(min(uvb, vec2(.9999)) * uMapSize), 0).a * 6.375 + .5);
          float vl = abs(fract(vx) - .5), vw = min(vfw, .05) * 1.2 + .006;
          float vein = (1. - smoothstep(vw * .5, vw, vl)) * step(below, g * .75 - .02) * (1. - e) * inM * smoothstep(700., 400., dist) * (1. - smoothstep(.05, .14, vfw));
          col = mix(col, wash(bidx, mix(.5, .8, smoothstep(40., 300., dist))), vein * .9);
          // the Figure's last print lies over whatever the wall carries, and it is ink like any other: fingered rim, granular
          // tide line, a squeezed band, flat washes, standing pools, and stripes whose borders are blot edges
          vec2 qw = qb / uStampBK + ((vec2(g1, g3) - .5) * 6. + (vec2(g0, vn(vLeaf * vec2(.16, .33) + 41.)) - .5) * 9.) * near + (vec2(g2, fibB) - .5) * 1.6 * near2;
          float th; float idxB = figInkIndexP(fb, qw, uFigState, th);
          float dP = min(db + fing * feather - (1. - uPrint) * 30. * uStampBK, min(qb.y, min(min(ub.x, 1. - ub.x) * 260., (1. - ub.y) * 180.) * uStampBK) - 3. + fing * 1.5 + (g0 - .5) * 7.), aP = fwidth(dP) * .75 + 1e-3, eb = smoothstep(-aP, aP, dP) * inB * step(.001, uPrint);
          float tideP = clamp(smoothstep(.3, .55, dP) * (1. - smoothstep(.95, 1.5, dP)) * (.3 + 1.5 * g2), 0., 1.) * near;
          float bandP = smoothstep(.95, 1.5, dP) * (1. - smoothstep(2.2 + 6. * g0, 3.4 + 8. * g0, dP));
          float gWb = vn(vLeaf * vec2(.05, .075) + wv + idxB * 5.1 + 23.), tWP = clamp((gWb * .6 + g3 * .25 + fibA * .15 - .5) * 3. + .16, 0., 1.);
          float tP = max(max(max(tWP, bandP * .52) * near, (.2 - fb.b) * 4. * smoothstep(.6, 1., uPrint)) * (1. - .85 * tideP), (1. - smoothstep(.08, .32, dP)) * .8 * near);
          float pbP = fb.b + (g1 - .5) * .1, wpP = min(fwidth(pbP) * .75 + .0006, .05), poolP = smoothstep(.74 - wpP, .74 + wpP, pbP) * smoothstep(1.5, 2.5, dP);
          vec3 inkP = mix(wash2(idxB, tP, min(fwidth(tP) * .75 + .0006, .06)), inkAt(idxB), poolP);
          vec3 pnP = n - (vec3(0., 0., 1.) * (g1 - .5) + tr * (g3 - .5)) * 1.1; pnP = pnP / max(length(pnP), 1e-4);
          vec3 pg2 = pnP * sign(dot(pnP, v) + 1e-5); float ry2 = reflect(-v, pg2).y, rw2 = min(fwidth(ry2) * .75 + .002, .05);
          inkP = mix(inkP, hiAt(idxB), poolP * smoothstep(.31 - rw2, .31 + rw2, ry2) * near);
          col = mix(col, inkP, eb);
          foldClip(vW, modelMatrix[1].y); gl_FragColor = vec4(col, 1.); }`,
    });
  }

  // ---- WET INK off the page (hoop, beads, tubes): flat ink + the one highlight. Needs normals. o.ink 0..5, or a
  // per-vertex / per-instance float attribute 'ink' when o.inkAttr is true. Works on InstancedMesh.
  function wet(o = {}) {
    return new THREE.ShaderMaterial({
      side: THREE.DoubleSide, defines: { ...(o.inkAttr ? { INK_ATTR: 1 } : {}), ...(o.drip ? { DRIP: 1 } : {}) },
      uniforms: { ...uniforms, uIdx: { value: o.ink || 0 } },
      vertexShader: GLSL_COMMON + /* glsl */`
        #ifdef INK_ATTR
        attribute float ink;
        #endif
        #ifdef DRIP
        attribute vec4 drip;                 // xyz: the drop's root, w: its phase (0 = this vertex never drips)
        #endif
        uniform float uIdx; varying vec3 vW, vN; varying float vInk;
        void main(){ vec4 p = vec4(position, 1.); vec3 n = normal;
          #ifdef DRIP
          if (drip.w > 0.) { float ph = fract(uTime * .16 + drip.w), sw = smoothstep(0., .45, ph), fall = max(ph - .5, 0.) * 2.;
            p.xyz = drip.xyz + (p.xyz - drip.xyz) * sw * (1. - smoothstep(.75, 1., fall)); p.y -= fall * fall * 90. + sw * .9; }
          #endif
          #ifdef USE_INSTANCING
          p = instanceMatrix * p; n = mat3(instanceMatrix) * n;
          #endif
          vec4 w = modelMatrix * p; w.xyz = foldW(w.xyz, modelMatrix[1].y); vW = w.xyz; vN = mat3(modelMatrix) * n; vInk = uIdx;
          #ifdef INK_ATTR
          vInk = ink;
          #endif
          gl_Position = projectionMatrix * viewMatrix * w; }`,
      fragmentShader: GLSL_COMMON + FOLD_FRAG + /* glsl */`
        varying vec3 vW, vN; varying float vInk;
        void main(){ vec3 e = cameraPosition - vW; vec3 v = e / max(length(e), 1e-3); vec3 n = vN / max(length(vN), 1e-4);
          vec3 nn = n * sign(dot(n, v) + 1e-5); float ry = reflect(-v, nn).y, rw = min(fwidth(ry) * .75 + .004, .12);   // (polish 5) the highlight has an edge
          foldClip(vW, modelMatrix[1].y); gl_FragColor = vec4(mix(inkAt(vInk), hiAt(vInk), smoothstep(.68 - rw, .68 + rw, ry) * .96), 1.); }`,
    });
  }

  // ---- THREADS: instanced camera-facing ribbons of wet ink that stretch, sag, neck, snap and recoil into a bead.
  // threadGeometry(list) takes [{ a:[x,y,z], b:[x,y,z], grow, breakAt, width, sag, half, ink, seed }]:
  //   a = root, b = far end; half:true means b lies ON the crease plane (x 0) and the mirror twin is the other half
  //   (the neck is then at b), otherwise the neck is in the middle. grow / breakAt are values of the material's
  //   own clock uniform (u.uClock: seconds, metres of peel, or metres of camera z, as the user of the material likes):
  //   the thread is drawn out from nothing between grow and breakAt, necks over the last u.uNeckDur, snaps at breakAt
  //   and its ends recoil over u.uSnapDur. Never thinner than 1.5 px: it pales one step instead.
  function threadGeometry(list, segs = 16) {
    const g = new THREE.InstancedBufferGeometry(), pos = [], idx = [];
    for (let i = 0; i <= segs; i++) { pos.push(i / segs, -1, 0, i / segs, 1, 0); if (i < segs) { const k = i * 2; idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); } }
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx);
    const n = list.length, A = new Float32Array(n * 3), B = new Float32Array(n * 3), T = new Float32Array(n * 4), S = new Float32Array(n * 3);
    const L = new Float32Array(n * 2);
    list.forEach((t, i) => { L[i * 2] = t.period ?? 0; L[i * 2 + 1] = t.phase ?? 0; A.set(t.a, i * 3); B.set(t.b, i * 3); T.set([t.grow ?? -1e6, t.breakAt ?? 1e6, t.seed ?? 0, t.width ?? 0.5], i * 4); S.set([t.sag ?? 0, t.half ? 1 : 0.5, t.ink ?? 0], i * 3); });
    g.setAttribute('aA', new THREE.InstancedBufferAttribute(A, 3)); g.setAttribute('aB', new THREE.InstancedBufferAttribute(B, 3));
    g.setAttribute('aL', new THREE.InstancedBufferAttribute(L, 2)); g.setAttribute('aT', new THREE.InstancedBufferAttribute(T, 4)); g.setAttribute('aS', new THREE.InstancedBufferAttribute(S, 3));
    g.instanceCount = n; g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e5);
    return g;
  }
  function thread(o = {}) {
    return new THREE.ShaderMaterial({
      side: THREE.DoubleSide, defines: o.tied ? { WING_TIED: 1 } : {},
      uniforms: { ...uniforms, ...(o.tied || {}), uClock: { value: 0 }, uNeckDur: { value: o.neckDur ?? 1.5 }, uSnapDur: { value: o.snapDur ?? 0.7 }, uRoot: { value: new THREE.Vector2(o.root ?? 3, o.rootLen ?? 0.045) }, uFigCut: { value: new THREE.Vector2(-1e6, 50) } },
      vertexShader: GLSL_COMMON + (o.tied ? GLSL_WING : '') + /* glsl */`
        attribute vec3 aA, aB, aS; attribute vec4 aT; attribute vec2 aL;
        uniform float uClock, uNeckDur, uSnapDur; uniform vec2 uRoot, uFigCut; vec3 gB; float gDroop;
        varying float vAcross, vPale, vInk; varying vec3 vW, vSideV;
        vec3 curve(float t, float len, float sagK){ float tn = aS.y;
          float c = clamp(1. - abs(t - tn) / max(tn, 1. - tn), 0., 1.);
          // a cut stump no longer reaches for its twin: it hangs down its own leaf (toward the crease, a little off the card)
          vec3 dB = gB - aA, dn = vec3(-aA.x * 1.12, -aA.y, 0.) * (length(dB) / max(length(aA.xy), 1.));
          vec3 p = aA + mix(dB, dn, gDroop) * (t * len); float cc = 1. - c;
          #ifdef WING_TIED
          p.y -= aS.x * sagK * (1. - cc * cc);
          #else
          p.y -= aS.x * sagK * (.45 * c + .55 * (1. - cc * cc * cc));     // wet ink hangs: steep off the wall, easing toward the fold, and falling yet where it meets its twin (the two halves hang from each other at the neck). Never a straight line.
          #endif
          return p; }
        void main(){ float t = position.x, tn = aS.y;
          #ifdef WING_TIED
          gDroop = 0.; gB = wingPos(aB.xy);                                              // far end rides the wing; it snaps by stretch (aT.y = the length it can bear)
          float stretch = length(gB - aA) / max(aT.y, 1e-3), len = 1., born = step(.04, stretch);
          float neck = smoothstep(.45, 1., stretch), q = clamp((stretch - 1.) / .45, 0., 1.), qe = 1. - (1. - q) * (1. - q);
          #else
          gB = aB;
          float clk = aL.x > 0. ? mod(uTime + aL.y, max(aL.x, 1.)) : uClock;
          float len = clamp((clk - aT.x) / max(aT.y - aT.x, 1e-3), 0., 1.), born = step(aT.x, clk) * (aL.x > 0. ? smoothstep(0., 3., clk) : 1.);
          float neck = smoothstep(aT.y - uNeckDur, aT.y, clk);
          float q = clamp((clk - aT.y) / max(uSnapDur, 1e-3), 0., 1.);
          // the Figure cuts every looping thread it flies through (uFigCut.x = its nose, crease-frame z): each necks and
          // snaps as it arrives and stays a beaded stump on its wall
          float py = mix(100., 165., smoothstep(730., 900., aB.z)) + 15. * smoothstep(900., 1000., aB.z);
          float cutK = clamp((uFigCut.x - aB.z) / 30., 0., 1.) * step(.0001, aL.x) * step(py - uFigCut.y, aB.y) * step(aB.y, py + 165.);
          // ... four in ten stay, as stumps of varied length that droop down the wall and end in a round bead; the rest are gone
          float keep = step(fract(aT.z * 57.3), .4), qs = 1. - sqrt(mix(.05, .15, fract(aT.z * 23.7)) * (1. + .45 * sin(uTime * (.9 + fract(aT.z * 3.3)) + aT.z * 40.)));
          float qc = mix(1., qs, keep) * smoothstep(.35, 1., cutK); neck = max(neck, smoothstep(0., .4, cutK));
          q = min(max(q, qc), mix(1., mix(1., qs, keep), smoothstep(.5, 1., cutK)));
          gDroop = keep * smoothstep(.45, 1., cutK);
          float qe = 1. - (1. - q) * (1. - q);
          #endif
          float c = clamp(1. - abs(t - tn) / max(tn, 1. - tn), 0., 1.), c2 = c * (1. - qe);
          #ifdef WING_TIED
          float taut = .55;
          #else
          float taut = .3;                                    // a necking thread of wet ink goes on hanging
          #endif
          float t2 = t <= tn ? c2 * tn : 1. - c2 * (1. - tn), sagK = (1. - taut * neck) * (1. - qe) + qe * .35 * c2;
          float sg = t <= tn ? 1. : -1.;
          vec3 p = curve(t2, len, sagK), tg = (curve(t2 + .02, len, sagK) - curve(t2 - .02, len, sagK)) * sg;
          vec4 w = modelMatrix * vec4(p, 1.); w.xyz = foldW(w.xyz, modelMatrix[1].y); vec3 tw = mat3(modelMatrix) * tg;
          vec3 e = cameraPosition - w.xyz; float dist = length(e); e = e / max(dist, 1e-3);
          vec3 sd = cross(tw, e); sd = sd / max(length(sd), 1e-5);
          float wd = aT.w * (1. + uRoot.x * exp(-c2 / max(uRoot.y, 1e-3)));                                     // root cone on the leaf
          wd *= 1. - .86 * neck * (1. - step(.0001, q)) * exp(-(1. - c) * (1. - c) / .05);        // the neck, thinning to a hair
          float bx = (c - .72) / .28, bead = mix((2.2 + 2. * fract(aT.z * 7.31)) * exp(-(1. - c) * (1. - c) / .004), (1.3 + 1.5 * fract(aT.z * 7.31)) * sqrt(max(1. - bx * bx, 0.)), gDroop);
          wd *= (1. + step(.0001, q) * bead) * (1. - gDroop * smoothstep(.94, 1., c));                                                        // the bead on each recoiling end (round, on a stump)
          wd *= born * (1. - smoothstep(.8, 1., q)) * smoothstep(0., .04, len);
          #ifndef WING_TIED
          wd *= mix(1.9, .42, pow(c, .6));                                                           // drawn out of the wall's ink: stout at the root, thinning all the way to the fold
          wd *= step(fract(aT.z * 91.7), mix(1., .3, smoothstep(330., 760., dist)) + (1. - step(.0001, aL.x)));   // far off, only a third of the looping threads are drawn
          wd *= 1. - step(mix(250., 470., fract(aT.z * 37.1)), dist) * step(.0001, aL.x);                    // (polish 1) and from further still none: the far cleft is a quiet grey seam, and the web is strung as we come
          #endif
          float px = dist * 2. / max(projectionMatrix[1][1] * uViewH, 1.), hw = wd * .5, mn = px * .8;
          vPale = wd > 0. ? clamp(1. - hw / mn, 0., 1.) : 0.; hw = wd > 0. ? max(hw, mn) : 0.;
          w.xyz += sd * position.y * hw; vW = w.xyz; vSideV = sd; vAcross = position.y; vInk = aS.z;
          gl_Position = projectionMatrix * viewMatrix * w; }`,
      fragmentShader: GLSL_COMMON + FOLD_FRAG + /* glsl */`
        varying float vAcross, vPale, vInk; varying vec3 vW, vSideV;
        void main(){ vec3 e = cameraPosition - vW; vec3 v = e / max(length(e), 1e-3);
          float x = clamp(vAcross, -1., 1.); vec3 n = vSideV * x + v * sqrt(max(1. - x * x, 0.)); n = n / max(length(n), 1e-4);
          vec3 col = mix(inkAt(vInk), hiAt(vInk), slit(n, v, .5, .85) * .9 * (1. - vPale));
          foldClip(vW, modelMatrix[1].y); float far = smoothstep(260., 620., length(e));                          // hair-thin things pale when far: the far cleft is a haze
          gl_FragColor = vec4(mix(mix(col, wash(vInk, mix(.5, 1., far)), mix(vPale * .8, 1., far * step(.001, vPale))), uFold, .5 * far * step(.001, vPale)), 1.); }`,
    });
  }

  // ---- the blank: no sky, one flat white a shade lighter than the card. Keep it centred on the camera.
  function sky(radius = 5000) {
    const m = new THREE.Mesh(new THREE.SphereGeometry(radius, 16, 8), new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false, uniforms: { c: { value: palette.blank } },
      vertexShader: 'void main(){ gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }',
      fragmentShader: 'uniform vec3 c; void main(){ gl_FragColor = vec4(c, 1.); }' }));
    m.renderOrder = -1; m.frustumCulled = false; return m;
  }

  // ---- THE FOLD: build the right half, then  scene.add(style.mirror(rightHalf)). The twin shares geometry, materials
  // and uniforms, so twins match in shape and motion for nothing. Every material of the style is DoubleSide for this.
  function mirror(obj) {
    const g = new THREE.Group(), twin = new THREE.Group(), c = obj.clone();
    c.traverse((o) => { o.frustumCulled = false; }); twin.scale.x = -1; twin.add(c); g.add(obj, twin); g.userData.twin = twin; return g;
  }

  // ---- LEAF: the right leaf as a ruled surface from the slope table (sheetAt), with the attributes card() needs.
  // o: { z0, z1, nz, rMax, nr, rPow (rows crowd toward the crease), cockle(z, r) -> metres along the normal, deckle (m torn off the top edge) }
  function leafBegin(o) {
    const { z0 = -300, z1 = 1300, nz = 200, rMax = 2000, nr = 120, rPow = 2.2, cockle = null, deckle = 30 } = o, n = (nz + 1) * (nr + 1);
    return { z0, z1, nz, rMax, nr, rPow, cockle, deckle, pos: new Float32Array(n * 3), nor: new Float32Array(n * 3), leaf: new Float32Array(n * 2), fold: new Float32Array(n), idx: new Uint32Array(nz * nr * 6), p: new THREE.Vector3() };
  }
  function leafRows(st, i0, i1) {                      // rows i0..i1 inclusive; normals are the ruled surface's own (the card is matte: only pooled gloss reads them)
    const { z0, z1, nz, rMax, nr, rPow, cockle, deckle, pos, nor, leaf, fold, idx, p } = st;
    for (let i = i0; i <= i1; i++) {
      const z = lerp(z0, z1, i / nz), sh = sheet(z), steep = smoothstep(0.17, 1.4, sh.slope), sa = Math.sin(sh.slope), ca = Math.cos(sh.slope);
      const tear = deckle * (0.5 + 0.5 * ctx.noise.fbm2(z * 0.011, 3.3, 3)) + deckle * 0.35 * ctx.noise.n2(z * 0.19, 9.1);
      for (let j = 0, k = i * (nr + 1); j <= nr; j++, k++) {
        let r = rMax * Math.pow(j / nr, rPow); if (j === nr) r -= tear;
        leafPt(z, r, p);
        if (cockle) { const h = cockle(z, r) * Math.min(1, r / 3); p.x -= sa * h; p.y += ca * h; }   // (polish 5) no cockle on the crease itself: the two leaves share that edge
        pos[k * 3] = p.x; pos[k * 3 + 1] = p.y; pos[k * 3 + 2] = p.z; leaf[k * 2] = z; leaf[k * 2 + 1] = r;
        nor[k * 3] = -sa; nor[k * 3 + 1] = ca;
        fold[k] = Math.min(1, steep * (0.4 + 0.6 * Math.exp(-r / 500)) + 0.5 * Math.exp(-(r * r) / 2.5));
        if (i < nz && j < nr) { const q = (i * nr + j) * 6, a = k, b = k + 1, c = k + nr + 1, d = k + nr + 2; idx[q] = a; idx[q + 1] = c; idx[q + 2] = b; idx[q + 3] = b; idx[q + 4] = c; idx[q + 5] = d; }
      }
    }
  }
  function leafEnd(st) {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(st.pos, 3)); g.setAttribute('normal', new THREE.BufferAttribute(st.nor, 3));
    g.setAttribute('leaf', new THREE.BufferAttribute(st.leaf, 2)); g.setAttribute('fold', new THREE.BufferAttribute(st.fold, 1));
    g.setIndex(new THREE.BufferAttribute(st.idx, 1)); g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, (st.z0 + st.z1) / 2), 1e5); return g;
  }
  function leafGeometry(o = {}) { const st = leafBegin(o); leafRows(st, 0, st.nz); return leafEnd(st); }
  async function leafGeometryAsync(o = {}) {           // the same leaf, built a few rows at a time (a world's 200 x 120 leaf would hold the page otherwise)
    const st = leafBegin(o); for (let i = 0; i <= st.nz; i += 10) { leafRows(st, i, Math.min(st.nz, i + 9)); await ctx.yield(); } return leafEnd(st);
  }

  // ---- INK MAP for one leaf (see card()). blots: [{ z, r, rz, rr (half-sizes along the crease and up the leaf, m),
  // ink 0..5, seed, thin 0..1 (how thinly it was squeezed), pool 0..1 (how much stands as gloss), lobes }].
  // o: { width, height, z0, r0, zLen, rLen }. Async: it yields while it paints. Returns { texture, rect, data, sample(z, r) }.
  async function paintInkMap(blots, o = {}) {
    const { width: W = 1024, height: H = 512, z0 = -300, r0 = 0, zLen = 1600, rLen = 2000 } = o;
    const data = new Uint8Array(W * H * 4); for (let i = 0; i < W * H; i++) data[i * 4] = 255;
    // (polish 5) the texture itself is no longer these bytes: the arrival order is kept as a smooth float field (a byte gave
    // three levels to a two-metre texel, so every rim and every wash border ran along the texel grid in stairs), thinness
    // and pooled depth are blurred across the seams between blots, and all of it goes up as half floats. 'data' and
    // sample() stay byte for byte what they were (the world lays drops and cockle by them).
    const F = new Float32Array(W * H * 4), M = new Float32Array(W * H).fill(1); for (let i = 0; i < W * H; i++) F[i * 4] = 1;   // M: the plain minimum (who owns the texel)
    const N = ctx.noise, sz = zLen / W, sr = rLen / H; let work = 0;
    await ctx.yield();
    for (const b of blots) {
      const sd = (b.seed ?? 1) * 17.13, rz = b.rz, rr = b.rr ?? b.rz, pad = 1.45, lobes = b.lobes ?? 3;
      const L = []; for (let i = 0; i < lobes; i++) { const a = sd * (i + 1) * 2.4, m = 0.25 + 0.5 * Math.abs(Math.sin(sd * (i + 3))); L.push([Math.cos(a) * m, Math.sin(a) * m, 0.42 + 0.3 * Math.abs(Math.cos(sd * (i + 5)))]); }
      const i0 = Math.max(0, Math.floor((b.z - rz * pad - z0) / sz)), i1 = Math.min(W - 1, Math.ceil((b.z + rz * pad - z0) / sz));
      const j0 = Math.max(0, Math.floor((b.r - rr * pad - r0) / sr)), j1 = Math.min(H - 1, Math.ceil((b.r + rr * pad - r0) / sr));
      const skipOuter = !b.late;
      for (let j = j0; j <= j1; j++) {
        for (let i = i0; i <= i1; i++) {
          const z = z0 + (i + 0.5) * sz, r = r0 + (j + 0.5) * sr;
          let x = (z - b.z) / rz, y = (r - b.r) / rr;
          if (skipOuter && Math.max(Math.abs(x), Math.abs(y)) > 1.32) continue;      // (polish 5) out there the blot's order is 1 whatever the noise says (d > .4): nothing is written, so nothing need be worked out
          x += 0.16 * N.n2(z * 0.013 + sd, r * 0.013); y += 0.16 * N.n2(z * 0.013, r * 0.013 + sd);
          let d = Math.hypot(x, y) - 0.62;                                             // unit blot: a core and its lobes, smooth-joined
          for (const l of L) { const e = Math.hypot(x - l[0], y - l[1]) - l[2], h = clamp(0.5 + (e - d) / 0.3, 0, 1); d = lerp(e, d, h) - 0.15 * h * (1 - h); }
          d += 0.09 * N.fbm2(z * 0.045 + sd, r * 0.045, 3) + 2 * smoothstep(1.18, 1.45, Math.max(Math.abs(z - b.z) / rz, Math.abs(r - b.r) / rr));   // never cut square by its own box
          const R0 = clamp(0.75 * (1 + d / 0.7), 0, 1), late = b.late ?? 0, Rr = late + R0 * (1 - late / 0.75), R = Math.max(0, Rr) * 255, q = (j * W + i) * 4;   // late: its core arrives that much later
          const Rf = Rr, own8 = R < data[q], ownF = Rf < M[q >> 2];   // (a negative 'late' lays a blot OVER its neighbours: it arrives first everywhere inside its own rim)
          if (own8 || ownF) {
            let tn = 0, pl = 0; const core = d < 0.05;
            if (core) {
              const marb = 0.5 + 0.5 * N.fbm2(z * 0.014 - sd, r * 0.014 + sd * 0.3, 2);
              tn = clamp((marb - 0.78 + 0.5 * (b.thin ?? 0.3)) * 4, 0, 1);
              pl = clamp(0.5 + (N.n2(z * 0.022 + sd * 2, r * 0.022) * 0.5 + (b.pool ?? 0.4) - 0.5) * smoothstep(0, -0.25, d) * 1.2 - 0.2 * smoothstep(-0.2, 0, d), 0, 1);
            }
            if (own8) { data[q] = R; data[q + 3] = (b.ink ?? 0) * 40; if (core) { data[q + 1] = 255 * tn; data[q + 2] = 255 * pl; } }
            if (ownF) { M[q >> 2] = Rf; F[q + 3] = (b.ink ?? 0) * 40 / 255; if (core) { F[q + 1] = tn; F[q + 2] = pl; } }
          }
          // two blots that meet run together with a rounded neck (a smooth minimum of their arrival orders): the plain
          // minimum has a crease where they meet, and a sampled crease thresholded near its own height is a sawtooth
          { const f0 = F[q], lo = Math.min(f0, Rf), k = 0.07 * (1 - smoothstep(0.82, 0.97, Math.max(f0, Rf)));
            if (k > 1e-4) { const h = Math.max(k - Math.abs(f0 - Rf), 0) / k; F[q] = lo - h * h * k * 0.25; } else F[q] = lo;
          }
        }
        if ((work += i1 - i0 + 1) > 1400) { work = 0; await ctx.yield(); }
      }
    }
    // thinness and pooled depth were laid blot by blot: where one blot takes over from another they jump from one texel to
    // the next, and a threshold on such a jump is a stair. A small binomial blur (twice 1-2-1 each way) makes them fields.
    await ctx.yield();
    { const tmp = new Float32Array(W * H * 2), K = [0.0625, 0.25, 0.375, 0.25, 0.0625];       // 1-4-6-4-1: along the crease, then up the leaf
      for (let j = 0; j < H; j++) { const o = j * W;
        for (let i = 0; i < W; i++) { let g = 0, b = 0;
          if (i >= 2 && i < W - 2) { const q = (o + i) * 4; g = 0.0625 * (F[q - 7] + F[q + 9]) + 0.25 * (F[q - 3] + F[q + 5]) + 0.375 * F[q + 1]; b = 0.0625 * (F[q - 6] + F[q + 10]) + 0.25 * (F[q - 2] + F[q + 6]) + 0.375 * F[q + 2]; }
          else for (let k = -2; k <= 2; k++) { const q = (o + Math.min(W - 1, Math.max(0, i + k))) * 4; g += K[k + 2] * F[q + 1]; b += K[k + 2] * F[q + 2]; }
          const t = (o + i) * 2; tmp[t] = g; tmp[t + 1] = b; }
        if (j % 40 === 39) await ctx.yield(); }
      const W2 = W * 2;
      for (let j = 0; j < H; j++) { const a = Math.max(0, j - 2) * W2, b1 = Math.max(0, j - 1) * W2, c = j * W2, d1 = Math.min(H - 1, j + 1) * W2, e = Math.min(H - 1, j + 2) * W2;
        for (let i = 0, q = j * W * 4; i < W2; i += 2, q += 4) {
          F[q + 1] = 0.0625 * (tmp[a + i] + tmp[e + i]) + 0.25 * (tmp[b1 + i] + tmp[d1 + i]) + 0.375 * tmp[c + i];
          F[q + 2] = 0.0625 * (tmp[a + i + 1] + tmp[e + i + 1]) + 0.25 * (tmp[b1 + i + 1] + tmp[d1 + i + 1]) + 0.375 * tmp[c + i + 1]; }
        if (j % 40 === 39) await ctx.yield(); }
    }
    // to half floats: never-inked texels (most of the sheet) and the few ink indices are looked up, the rest converted
    const half = new Uint16Array(W * H * 4), toHalf = THREE.DataUtils.toHalfFloat, hOne = toHalf(1), hInk = []; for (let k = 0; k < 7; k++) hInk.push(toHalf(k * 40 / 255));
    for (let j = 0; j < H; j++) {
      for (let q = j * W * 4, e = q + W * 4; q < e; q += 4) {
        const r = F[q]; half[q + 3] = hInk[Math.round(F[q + 3] * 6.375)];
        if (r >= 1) { half[q] = hOne; const g = F[q + 1], b = F[q + 2]; if (g > 1e-4) half[q + 1] = toHalf(g); if (b > 1e-4) half[q + 2] = toHalf(b); }
        else { half[q] = toHalf(Math.max(r, -4)); half[q + 1] = toHalf(F[q + 1]); half[q + 2] = toHalf(F[q + 2]); }
      }
      if (j % 32 === 31) await ctx.yield(); }
    const texture = new THREE.DataTexture(half, W, H, THREE.RGBAFormat, THREE.HalfFloatType);
    texture.minFilter = texture.magFilter = THREE.LinearFilter; texture.wrapS = texture.wrapT = THREE.ClampToEdgeWrapping; texture.needsUpdate = true;
    const sample = (z, r) => { const i = clamp(Math.floor((z - z0) / sz), 0, W - 1), j = clamp(Math.floor((r - r0) / sr), 0, H - 1), q = (j * W + i) * 4; return [data[q] / 255, data[q + 1] / 255, data[q + 2] / 255, Math.round(data[q + 3] / 40)]; };
    return { texture, rect: new THREE.Vector4(z0, r0, 1 / zLen, 1 / rLen), data, sample };
  }

  // ---- THE FIGURE'S FIELD: one half of a klecksographic figure in (s along the hinge, r out from it), metres,
  // s -130..130 (+ is forward), r 0..180. Six families; every primitive is jittered by the seed. E = ellipse lobe
  // [s, r, as, ar, rot], C = tapered stroke of pooled ink [s1, r1, s2, r2, w1, w2], H = a hole squeezed empty.
  const FAMILIES = {
    moth: [['C', -70, 0, 78, 0, 9, 11], ['E', 88, 0, 12, 13, 0], ['E', 38, 78, 50, 82, -0.25], ['E', 72, 128, 26, 30, 0], ['E', -48, 58, 44, 62, 0.3],
      ['C', -70, 62, -112, 84, 12, 4], ['E', -116, 86, 7, 7, 0], ['C', 96, 5, 122, 40, 3.5, 2], ['E', 124, 43, 5.5, 5.5, 0],
      ['H', 48, 92, 11, 14, 0], ['H', -4, 90, 7, 34, 0.5], ['H', -52, 72, 8, 9, 0], ['H', 20, 40, 5, 12, -0.4]],
    bat: [['C', -55, 0, 62, 0, 12, 13], ['E', 74, 0, 14, 14, 0], ['C', 78, 8, 106, 22, 8, 2], ['C', 50, 6, 84, 78, 7, 5], ['C', 84, 78, 62, 152, 5, 3],
      ['C', 84, 78, 8, 142, 3.5, 2.5], ['C', 84, 78, -42, 114, 3.5, 2.5], ['E', 32, 72, 52, 66, 0], ['E', -12, 60, 44, 56, 0], ['E', -45, 30, 30, 34, 0],
      ['H', 38, 156, 21, 17, 0], ['H', -24, 136, 23, 19, 0], ['H', -68, 80, 20, 23, 0], ['C', -55, 6, -100, 30, 6, 3], ['C', -55, 0, -94, 0, 5, 3], ['H', 30, 30, 6, 10, 0.3]],
    dancers: [['E', 84, 42, 14, 13, 0], ['C', 72, 42, 60, 43, 6, 6], ['C', 62, 44, 12, 50, 17, 11], ['E', -28, 60, 44, 59, 0], ['C', -50, 45, -108, 30, 9, 4],
      ['C', -48, 75, -100, 96, 9, 4], ['E', -110, 26, 5, 9, 0], ['E', -103, 100, 5, 9, 0.5], ['C', 58, 36, 40, 0, 6, 5], ['C', 60, 54, 88, 104, 7, 4],
      ['C', 88, 104, 118, 96, 4, 3], ['E', 121, 95, 5, 5, 0], ['E', 96, 60, 9, 16, 0.6], ['H', -30, 78, 9, 20, 0.3], ['H', -22, 30, 6, 13, -0.2]],
    crown: [['E', -60, 45, 22, 88, 0], ['C', -80, 0, -80, 122, 12, 10], ['C', -50, 0, 80, 0, 16, 6], ['E', 92, 0, 13, 13, 0], ['C', -45, 55, 60, 70, 15, 5],
      ['E', 68, 72, 11, 11, 0], ['C', -45, 110, 32, 150, 13, 5], ['E', 38, 153, 10, 10, 0], ['H', -58, 30, 7, 12, 0], ['H', -58, 84, 7, 12, 0], ['E', -100, 60, 8, 40, 0], ['H', -12, 30, 12, 7, 0]],
    pelvis: [['E', 30, 80, 58, 72, -0.3], ['C', 70, 0, -30, 0, 20, 9], ['E', -62, 46, 34, 30, 0], ['C', -60, 40, -52, 0, 10, 10], ['H', -58, 44, 15, 13, 0],
      ['H', -8, 22, 17, 9, 0], ['E', -20, 112, 16, 18, 0], ['C', -25, 118, -102, 130, 11, 8], ['E', -106, 131, 12, 12, 0], ['H', 40, 90, 10, 22, -0.3]],
    birds: [['E', -5, 80, 40, 52, 0.5], ['E', 40, 40, 20, 20, 0], ['C', 44, 28, 50, 0, 9, 3.5], ['E', 44, 112, 50, 24, -0.9], ['C', -30, 118, -78, 152, 14, 20],
      ['C', -38, 66, -88, 52, 4, 3], ['C', -88, 52, -98, 30, 3, 2], ['E', -104, 20, 10, 30, 0], ['H', 44, 42, 4.5, 4.5, 0], ['H', 10, 100, 6, 20, 0.5], ['C', 62, 44, 84, 56, 5, 2]],
  };
  // The thin-limbed families carry a membrane of ink between their limbs (laid first, so their holes still open in it):
  // with wings standing in the cleft a figure of strokes alone breaks up into slivers; with it the Figure is one shape.
  const MEMBRANE = { dancers: ['E', 8, 46, 86, 44, 0], crown: ['E', -4, 50, 80, 54, 0], birds: ['E', 4, 56, 72, 52, 0] };
  async function paintFigure(rng, family) {
    const W = 288, H = 200, sz = 2 * FIG_HALF_LEN / W, sr = FIG_REACH / H, N = ctx.noise, sd = rng.range(1, 90);
    const fam = FAMILIES[family] || FAMILIES.moth;
    const prims = fam.map((p) => p.map((v, i) => (i === 0 ? v : (p[0] === 'E' || p[0] === 'H') && i === 5 ? v + rng.range(-0.12, 0.12) : v * (1 + rng.range(-0.07, 0.07)))));
    if (MEMBRANE[family]) prims.unshift(MEMBRANE[family]);
    const body = (s, r) => {                       // signed distance, negative inside (approximate, metres)
      let d = 1e3;
      for (const p of prims) {
        let e;
        if (p[0] === 'C') { const ax = p[3] - p[1], ay = p[4] - p[2], h = clamp(((s - p[1]) * ax + (r - p[2]) * ay) / (ax * ax + ay * ay + 1e-6), 0, 1); e = Math.hypot(s - p[1] - ax * h, r - p[2] - ay * h) - lerp(p[5], p[6], h); }
        else { const c = Math.cos(p[5]), sn = Math.sin(p[5]), x = (s - p[1]) * c + (r - p[2]) * sn, y = -(s - p[1]) * sn + (r - p[2]) * c; e = (Math.hypot(x / p[3], y / p[4]) - 1) * Math.min(p[3], p[4]); }
        if (p[0] === 'H') d = Math.max(d, -e - 1.5);
        else { const h = clamp(0.5 + (e - d) / 14, 0, 1); d = lerp(e, d, h) - 7 * h * (1 - h) * 0.5; }
      }
      return d;
    };
    const field = (s, r) => {
      const ws = s + 9 * N.n2(s * 0.016 + sd, r * 0.016), wr = Math.abs(r + 9 * N.n2(s * 0.016, r * 0.016 + sd) * Math.min(1, r / 12));
      return body(ws, wr) + 4.5 * N.fbm2(s * 0.06 + sd, r * 0.06, 3);
    };
    // spatter: satellite drops thrown outward, one candidate per 14 m cell, kept only just outside the rim
    const CS = 14, cw = Math.ceil(2 * FIG_HALF_LEN / CS), ch = Math.ceil(FIG_REACH / CS), drops = new Array(cw * ch).fill(null);
    for (let j = 0; j < ch; j++) for (let i = 0; i < cw; i++) {
      const s = -FIG_HALF_LEN + (i + rng.range(0.2, 0.8)) * CS, r = (j + rng.range(0.2, 0.8)) * CS, rad = 0.8 + 3.2 * rng() * rng(), keep = rng();
      const d = field(s, r); if (d > rad + 1.5 && d < 22 && keep < 0.75 - d / 40 && r > rad + 1) drops[j * cw + i] = [s, r, rad];
    }
    await ctx.yield();
    const data = new Uint8Array(W * H * 4), dist = new Float32Array(W * H);
    for (let j = 0; j < H; j++) {
      for (let i = 0; i < W; i++) {
        const s = -FIG_HALF_LEN + (i + 0.5) * sz, r = (j + 0.5) * sr; let d = field(s, r);
        const ci = Math.floor((s + FIG_HALF_LEN) / CS), cj = Math.floor(r / CS);
        for (let b = Math.max(0, cj - 1); b <= Math.min(ch - 1, cj + 1); b++) for (let a = Math.max(0, ci - 1); a <= Math.min(cw - 1, ci + 1); a++) { const dr = drops[b * cw + a]; if (dr) d = Math.min(d, Math.hypot(s - dr[0], r - dr[1]) - dr[2]); }
        const edge = Math.min(1, Math.min(s + FIG_HALF_LEN, FIG_HALF_LEN - s, FIG_REACH - r) / 6); d = lerp(8, d, clamp(edge, 0, 1));   // never inked at the texture's border
        const q = (j * W + i) * 4, vein = 1 - smoothstep(0.0, 0.1, Math.abs(N.n2(s * 0.034 + 2.2 * N.n2(s * 0.01, r * 0.012 + sd), r * 0.006 + sd)));
        dist[j * W + i] = -d;
        data[q] = 255 * clamp(0.5 - d / 96, 0, 1); data[q + 1] = 255 * vein * smoothstep(0, 10, r);
        data[q + 2] = 255 * clamp(0.5 + 0.55 * N.fbm2(s * 0.035 - sd, r * 0.035 + sd, 2) + Math.min(-d, 18) / 70 - 0.12, 0, 1); data[q + 3] = 255;
      }
      if (j % 4 === 3) await ctx.yield();
    }
    const texture = new THREE.DataTexture(data, W, H, THREE.RGBAFormat);
    texture.minFilter = texture.magFilter = THREE.LinearFilter; texture.wrapS = texture.wrapT = THREE.ClampToEdgeWrapping; texture.needsUpdate = true;
    // inward distance from the rim at (s, r), metres (positive inside)
    const inside = (s, r) => dist[clamp(Math.floor(r / sr), 0, H - 1) * W + clamp(Math.floor((s + FIG_HALF_LEN) / sz), 0, W - 1)];
    return { texture, inside, family, seed: sd };
  }

  // ---- THE WING: one half of the Figure, a 60 x 40 sheet whose vertices are (s, r) metres; silhouette by alpha test
  // on the field, posed in the vertex shader. u.uPose = (fly 0 page .. 1 air, root angle from level, tip angle from level,
  // beat phase), u.uPitch (hinge nose-up), u.uFigPos (body centre, local), u.uPeel (metres the peel front has
  // travelled in from the rim), u.uShut 0..1, u.uCurl, u.uFigState = (red 0..1, stripes 0..1, seed).
  function wingGeometry(ns = 60, nr = 40) {
    const g = new THREE.PlaneGeometry(2 * FIG_HALF_LEN, FIG_REACH, ns, nr); g.translate(0, FIG_REACH / 2, 0);
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e5); return g;
  }
  function wing(o = {}) {
    return new THREE.ShaderMaterial({
      side: THREE.DoubleSide,
      uniforms: {
        ...uniforms, uFig: { value: o.fig || noMap }, uPose: { value: new THREE.Vector4(0, 0.6, 0.3, 0) }, uPitch: { value: 0 },
        uFigPos: { value: new THREE.Vector3() }, uSlope3: { value: (() => { const a = sheet(FIG_Z0).slope, m = sheet(FIG_Z0 - 110).slope, p = sheet(FIG_Z0 + 110).slope; return new THREE.Vector3(a, (p - m) / 2, (p + m) / 2 - a); })() }, uPeel: { value: 0 }, uShut: { value: 0 },
        uCurl: { value: 0.3 }, uRear: { value: 1 }, uSize: { value: 1 }, uTwist: { value: 0 }, uBend: { value: 160 }, uFigState: { value: o.figState || new THREE.Vector3(0, 0, 1) },
      },
      vertexShader: GLSL_COMMON + GLSL_WING + /* glsl */`
        varying vec2 vQ; varying vec3 vW, vN, vTs, vTr;
        void main(){ vec2 q = position.xy; vQ = q;
          vec3 p = wingPos(q), ds = wingPos(q + vec2(2., 0.)) - p, dr = wingPos(q + vec2(0., 2.)) - p;
          vec3 n = cross(ds, dr); vN = mat3(modelMatrix) * (n / max(length(n), 1e-5));
          vTs = mat3(modelMatrix) * (ds / max(length(ds), 1e-5)); vTr = mat3(modelMatrix) * (dr / max(length(dr), 1e-5));
          vec4 w = modelMatrix * vec4(p, 1.); w.xyz = foldW(w.xyz, modelMatrix[1].y); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
      fragmentShader: GLSL_COMMON + FOLD_FRAG + /* glsl */`
        uniform sampler2D uFig; uniform vec3 uFigState; uniform float uShut;
        varying vec2 vQ; varying vec3 vW, vN, vTs, vTr;
        void main(){
          vec2 uv = vec2(vQ.x / 260. + .5, vQ.y / 180.); vec4 f = texture2D(uFig, uv);
          vec3 e = cameraPosition - vW; float dist = length(e); vec3 v = e / max(dist, 1e-3);
          float near = 1. - smoothstep(80., 500., dist);
          float fib = fbm3(vec2(vQ.x * .11, vQ.y * .9)), fine = vn(vec2(vQ.x * .9, vQ.y * 7.));
          float d = (f.r - .5) * 96. + (fib - .5) * 2.6 + (fine - .5) * .7 * near;        // capillary fingers along the fibres
          if (d < 0.) discard;
          // in flight its streaks are broad and take the four washes in turn; as it shuts they draw back to the streaks its print carries
          float th; float idx = uShut > .1 + .8 * vn(vQ * .21 + 3.) ? figInkIndexP(f, vQ, uFigState, th) : figInkIndex(f, vQ, uFigState, th);
          float rim = 1. - smoothstep(.4, 1.3 + 1.6 * fib, d);                          // feathered rim: the film is thin there
          float tide = smoothstep(1.6, 2.6, d) * (1. - smoothstep(3.4, 4.6, d));
          float t = max(rim * .5, (.2 - f.b) * 4.) * (1. - tide);              // squeezed-thin washes
          t = max(t, f.g * .9 * (1. - smoothstep(3., 16., d)) * step(idx, .5));         // pale veins toward the edge of the black
          vec3 col = wash2(idx, t, min(fwidth(t) * .75 + .0006, .03));   // (polish 5) flat steps with edges, not ramps
          vec3 n = vN / max(length(vN), 1e-4);
          float pool = smoothstep(.6, .64, f.b) * (1. - rim);
          n = n * sign(dot(n, v) + 1e-5);
          vec3 pn = n + vTs * (vQ.x / 70.) + vTr * ((vQ.y - 75.) / 52.); pn = pn / max(length(pn), 1e-4);
          // (polish 5) the one wet highlight is a flat pale shape with an ink edge (it was a soft ramp: an airbrushed grey bloom
          // on the black): the slit's mirror image thresholded, its border wandering with the film, antialiased over a pixel
          pn = pn * sign(dot(pn, v) + 1e-5);
          float ry = reflect(-v, pn).y + (vn(vQ * .06 + 5.) - .5) * .1 + (vn(vQ * .23 + 11.) - .5) * .035, thr = mix(.875, .915, uShut), rw = min(fwidth(ry) * .75 + .0015, .03);
          col = mix(col, hiAt(idx), smoothstep(thr - rw, thr + rw, ry) * (1. - step(.33, t)));
          foldClip(vW, modelMatrix[1].y); gl_FragColor = vec4(col, 1.); }`,
    });
  }

  // ---- THE HOOP (right half; mirror it): the last bridge, a thread that opened into a ring of wet black ink, 14 m inside,
  // 18 m outside, in the plane z = 0 of its own frame, webbed into the leaf at x = o.wallX, dripping in matched drops.
  // Returns a Mesh (material wet({ drip: true })); seat it at anchors.portalSeat. About 2.2k triangles a half.
  function hoop(o = {}) {
    const wallX = o.wallX ?? 9.6, hr = ctx.rng.fork('hoop'), parts = [], N = ctx.noise;
    const strand = (a, b, r0, r1, waist) => {             // a tapered pull of ink with a waist, 7-sided
      const g = new THREE.CylinderGeometry(1, 1, 1, 7, 6, true), q = g.attributes.position, d = new THREE.Vector3().subVectors(b, a), len = d.length();
      for (let i = 0; i < q.count; i++) { const t = q.getY(i) + 0.5, rr = lerp(r0, r1, t) * (1 - waist * Math.sin(Math.PI * t)); q.setXYZ(i, q.getX(i) * rr, (t - 0.5) * len, q.getZ(i) * rr); }
      g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.clone().divideScalar(Math.max(len, 1e-4))));
      g.translate((a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2); g.computeVertexNormals(); return g;
    };
    const ring = new THREE.TorusGeometry(8, 1, 10, 56, Math.PI), rp = ring.attributes.position, rn = ring.attributes.normal;
    ring.rotateZ(-Math.PI / 2);
    for (let i = 0; i < rp.count; i++) {                  // a wet rim is never even: it swells, and it hangs heavier at the foot
      const x = rp.getX(i), y = rp.getY(i), ang = Math.atan2(y, Math.max(x, 0)), sw = 0.22 * N.n2(ang * 2.3, 4.2) + 0.2 * smoothstep(-0.2, -1.4, ang);
      rp.setXYZ(i, x + rn.getX(i) * sw, y + rn.getY(i) * sw, rp.getZ(i) + rn.getZ(i) * sw);
    }
    ring.computeVertexNormals(); parts.push(ring);
    for (let k = 0; k < 6; k++) {                        // the web: where the rim is drawn out into the leaf
      const ang = lerp(-1.25, 1.25, (k + hr.range(0.2, 0.8)) / 6), from = new THREE.Vector3(Math.cos(ang) * 8.6, Math.sin(ang) * 8.6, 0);
      const to = new THREE.Vector3(wallX + 0.4, Math.sin(ang) * 8.6 * hr.range(1.2, 2.1) + hr.range(-2, 2), hr.range(-5, 5));
      parts.push(strand(from, to, hr.range(0.8, 1.3), hr.range(1.1, 2.0), hr.range(0.45, 0.7)));
    }
    for (const g of parts) { g.deleteAttribute('uv'); g.setAttribute('drip', new THREE.BufferAttribute(new Float32Array(g.attributes.position.count * 4), 4)); }
    for (let k = 0; k < 5; k++) {                        // drops gathering under the rim and falling
      const ang = -Math.PI / 2 + lerp(0.08, 1.0, k / 4) * 0.9 + hr.range(-0.05, 0.05), cx = Math.cos(ang) * 8.2, cy = Math.sin(ang) * 9.1 - 0.2, rad = hr.range(0.45, 0.85);
      const g = new THREE.SphereGeometry(rad, 8, 6), q = g.attributes.position; g.deleteAttribute('uv');
      for (let i = 0; i < q.count; i++) { const y = q.getY(i) / rad; q.setY(i, q.getY(i) * (y > 0 ? 2.1 : 1) - rad); const sq = y > 0 ? 1 - 0.75 * y : 1; q.setX(i, q.getX(i) * sq); q.setZ(i, q.getZ(i) * sq); }
      g.computeVertexNormals(); g.translate(cx, cy, 0);
      const dr = new Float32Array(q.count * 4), ph = hr.range(0.05, 0.95); for (let i = 0; i < q.count; i++) dr.set([cx, cy + rad, 0, ph], i * 4);
      g.setAttribute('drip', new THREE.BufferAttribute(dr, 4)); parts.push(g);
    }
    const geo = mergeGeometries(parts.map((g) => (g.index ? g.toNonIndexed() : g))), m = new THREE.Mesh(geo, wet({ ink: 0, drip: true }));
    geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 120); m.frustumCulled = false; return m;
  }

  // ---- THE CORONA (polish 5; right half, mirror it): the ring of wet colour the hoop bleeds into the film it was drawn from.
  // A flat half-ring in the hoop's own plane, a little behind it: carmine against the black rim, then the four washes in
  // sectors that meet without mixing, thinning in flat steps to a fingered rim with a tide line; it reaches furthest up and
  // down the cleft (the walls stand a metre from the hoop at its sides). u.uOpen 0..1 = how far it has bled (the world keys
  // it to our approach); the rim creeps on time. Flat ink, alpha test, one pale flat highlight. About 800 triangles a half.
  function corona(o = {}) {
    const inner = o.inner ?? 8.6, geo = new THREE.RingGeometry(inner - 0.6, 36, 40, 10, -Math.PI / 2, Math.PI);
    geo.deleteAttribute('uv'); geo.deleteAttribute('normal'); geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 120);
    const mat = new THREE.ShaderMaterial({
      side: THREE.DoubleSide, uniforms: { ...uniforms, uOpen: { value: 1 }, uInner: { value: inner }, uSeedC: { value: o.seed ?? 3.7 } },
      vertexShader: GLSL_COMMON + /* glsl */`
        varying vec3 vW; varying vec2 vP;
        void main(){ vP = position.xy; vec4 w = modelMatrix * vec4(position, 1.); w.xyz = foldW(w.xyz, modelMatrix[1].y); vW = w.xyz;
          gl_Position = projectionMatrix * viewMatrix * w; }`,
      fragmentShader: GLSL_COMMON + FOLD_FRAG + /* glsl */`
        uniform float uOpen, uInner, uSeedC; varying vec3 vW; varying vec2 vP;
        void main(){
          vec2 p = vP; float rho = max(length(p), 1e-3), ang = atan(p.y, max(p.x, 1e-4)), sy = p.y / rho, fw = length(fwidth(p));
          float fine = 1. - smoothstep(.2, .6, fw * 31. / rho), mid = 1. - smoothstep(.2, .6, fw * 9. / rho);
          // how far the colour has bled at this bearing: most up and down the cleft, heavier at the foot
          float lobe = abs(sy); lobe = lobe * sqrt(lobe);
          float reach = (2.4 + 15.5 * lobe * (1. + .3 * smoothstep(0., -1., sy))) * (.7 + .6 * vn(vec2(ang * 2.1 + uSeedC, 1.7))) * uOpen;
          float creep = (vn(vec2(ang * 5. + uSeedC, uTime * .11)) - .5) * 1.4;
          float tong = vn(vec2(ang * 21. + uSeedC * 3., 2.2)); tong = (tong * tong - .28) * 7.5 * (1. - smoothstep(.2, .6, fw * 21. / rho));   // tongues run out along the pull
          float fing = (vn(vec2(ang * 9. + uSeedC, rho * .12 - uTime * .03)) - .5) * 5. * mid + (vn(vec2(ang * 31., rho * .3 + uSeedC)) - .5) * 2.6 * fine + tong;
          float d = uInner + reach + fing * min(1., reach * .25) + creep - rho;                // metres inside the rim
          float b = clamp((rho - uInner) / max(reach, .5), 0., 1.) + (vn(vec2(ang * 5. - uSeedC, rho * .2)) - .5) * .32 * mid;
          // the washes in sectors: borders are curves, antialiased, never mixed
          float sc = ang * 2.3 + (vn(vec2(ang * 4. + 9., rho * .15 + uSeedC)) - .5) * 1.1 + uSeedC * 5., id = floor(sc), f = sc - id, sa = min(fwidth(sc) * 1.2 + 1e-3, .2);
          float iA = 2. + mod(id, 4.), iB = 2. + mod(id + 1., 4.);
          float t = smoothstep(.5, 1., b) * .9, tide = smoothstep(.1, .25, d) * (1. - smoothstep(.45, .75, d));
          t = max(t * (1. - tide), (1. - smoothstep(.0, .1, d)) * .6); float tw = min(fwidth(t) * .75 + .001, .06);
          vec3 colW = mix(wash2(iA, t, tw), wash2(iB, t, tw), smoothstep(1. - sa, 1., f));
          float cb = b - .3 - (vn(vec2(ang * 13. + uSeedC, rho * .5)) - .5) * .16 * mid, ca = fwidth(cb) * .75 + 1e-3;
          vec3 col = mix(inkAt(1.), colW, smoothstep(-ca, ca, cb));                              // carmine against the black rim
          // the one wet highlight: a flat pale shape with an ink edge, where the film stands thick by the hoop
          float hv = vn(vec2(ang * 3.1 + uSeedC * 2., rho * .45 - uTime * .04)) - .64 - max(cb, 0.) * 3., ha = fwidth(hv) * .75 + 1e-3;
          col = mix(col, hiAt(1.), smoothstep(-ha, ha, hv) * (1. - smoothstep(-ca, ca, cb)) * mid);
          if (d < 0. || rho < uInner - .5) discard;
          foldClip(vW, modelMatrix[1].y); gl_FragColor = vec4(col, 1.); }`,
    });
    const m = new THREE.Mesh(geo, mat); m.frustumCulled = false; return m;
  }

  function update(dt, time, camera) {
    uniforms.uTime.value = time;
    const r = ctx.renderer; if (r && r.getDrawingBufferSize) uniforms.uViewH.value = Math.max(240, r.getDrawingBufferSize(_v2).y);
  }
  return { palette, uniforms, card, wet, hoop, corona, thread, threadGeometry, wing, wingGeometry, sky, mirror, leafGeometry, leafGeometryAsync, paintInkMap, paintFigure, sheetAt: sheet, leafPoint: leafPt, families: Object.keys(FAMILIES), update, noMap };
}
const _v2 = new THREE.Vector2();

// =====================================================================================================
// buildHero: the Figure (two wings hinged on the crease plane), its sixty peel threads, its ghost and print,
// and (opts.page, for the viewer or a world that wants it) the piece of folded page it lies on.
// =====================================================================================================
const CAM_Z = [[0, 0], [0.171, 182], [0.366, 438], [0.585, 735], [0.805, 960], [1, 1152]];   // the brief's journey: u -> camera z
function camZAt(u) { let i = 1; while (i < CAM_Z.length - 1 && u > CAM_Z[i][0]) i++; const a = CAM_Z[i - 1], b = CAM_Z[i]; return lerp(a[1], b[1], clamp((u - a[0]) / (b[0] - a[0]), 0, 1)); }

export async function buildHero(ctx, opts = {}) {
  const dbg = (opts.debug && !opts.style) ? { get: (k) => (opts.debug[k] ?? null) } : null;   // test switches, passed as opts.debug = { figu, figz, ... }
  // alone in the viewer (no opts.style) the page is opened almost flat so that it can be orbited; &figreal=1 or &figpage=z shows the real valley
  const standalone = !opts.style && opts.slope == null && !(dbg && (dbg.get('figreal') || dbg.get('figpage')));
  const style = opts.style || makeStyle(ctx, standalone ? { ...opts, slope: 0.105 } : opts), rng = ctx.rng, detail = clamp(opts.detail ?? 1, 0.6, 1);
  const family = opts.family || (dbg && dbg.get('figfam')) || rng.pick(style.families);
  const wetness = opts.wetness ?? rng.range(0.2, 1);                 // dry pull .. soaked
  const withPage = opts.page ?? true, withSky = opts.backdrop ?? withPage;
  const fig = await style.paintFigure(rng, family);
  await ctx.yield();
  const figState = new THREE.Vector3(0, 0, fig.seed);
  const root = new THREE.Group(), right = new THREE.Group();

  // ---- the wing
  const wingMat = style.wing({ fig: fig.texture, figState }), wingMesh = new THREE.Mesh(style.wingGeometry(), wingMat);
  wingMesh.frustumCulled = false; right.add(wingMesh);

  // ---- sixty peel threads: page to the underside of the lifting blot, drawn out as the peel front passes, then snapped.
  // Their clock is the peel front in metres.
  const nTh = Math.round((36 + 40 * wetness) * detail), list = [], tp = new THREE.Vector3();
  for (let i = 0, tries = 0; i < nTh && tries < 4000; tries++) {
    const s = rng.range(-112, 112), r = rng.range(3, 150), w = rng.range(0.28, 0.6) * (0.7 + 0.6 * wetness), kb = rng.range(0.45, 0.85), sd = rng();
    const d = fig.inside(s, r); if (d < 2.5) continue;
    style.leafPoint(FIG_Z0 + s, r, tp);
    list.push({ a: [tp.x, tp.y, s], b: [s, r, 0], breakAt: 5 + 70 * kb * kb * sd + 0.25 * d, width: w * 2, sag: 0, ink: 0, seed: sd });
    i++;
  }
  const peelMat = style.thread({ tied: wingMat.uniforms }), peelThreads = new THREE.Mesh(style.threadGeometry(list, 12), peelMat);
  peelThreads.frustumCulled = false; right.add(peelThreads);
  await ctx.yield();

  // ---- the page it lies on (opts.page): one leaf with its own small ink map of twin blots, mirrored like everything else
  const cards = [];
  let pageMat = null;
  if (withPage) {
    const zc = opts.pageZ ?? (dbg && dbg.get('figpage') ? +dbg.get('figpage') : FIG_Z0), z0 = zc - 470, zLen = 1120, rLen = 780, blots = [], pr = rng.fork('page');
    for (let i = 0; i < 16; i++) {
      const z = z0 + pr.range(40, zLen - 40), r = pr.range(20, rLen * 0.85), rz = pr.range(18, 75) * (pr.chance(0.25) ? 1.8 : 1), far = z > FIG_Z0 + 260;
      if (Math.abs(z - FIG_Z0) < 150 + rz && r < 185 + rz) continue;                       // the Figure's own ground stays clear
      blots.push({ z, r, rz, rr: rz * pr.range(0.7, 1.3), ink: far ? 1 : 0, seed: pr.range(1, 50), thin: pr.range(0.1, 0.7), pool: 0.25 + 0.5 * wetness, lobes: pr.int(2, 4) });
    }
    blots.push({ z: FIG_Z0 - 330, r: 46, rz: 32, rr: 4.5, ink: 0, seed: 7.7, thin: 0.75, pool: 0.1, lobes: 1 });   // the thumb smear, along the crease
    const map = await style.paintInkMap(blots, { width: 512, height: 384, z0, r0: 0, zLen, rLen });
    await ctx.yield();
    const cockle = (z, r) => { const m = map.sample(z, r); return m[0] < 0.75 ? (m[2] - 0.45) * 0.9 : 0; };
    const geo = style.leafGeometry({ z0, z1: z0 + zLen, nz: 96, rMax: rLen, nr: 56, rPow: 1.5, cockle, deckle: 26 });
    geo.translate(0, 0, -FIG_Z0);
    pageMat = style.card({ map: map.texture, mapRect: map.rect, fig: fig.texture, figState });
    const leaf = new THREE.Mesh(geo, pageMat); leaf.frustumCulled = false; right.add(leaf); cards.push(pageMat);
    await ctx.yield();
  }
  if (dbg && dbg.get('fighoop')) { const h = style.hoop(); if (dbg.get('fighoop') === 'seat') h.position.set(0, 180, 1150 - FIG_Z0); else { h.position.set(0, 60, -170); h.scale.setScalar(4); } right.add(h); }
  let testThreads = null;
  if (dbg && dbg.get('figthreads')) {                                    // viewer-only: a sample of cleft threads on the time clock
    const tr = rng.fork('tt'), l = [];
    for (let i = 0; i < 40; i++) { const y = tr.range(170, 300), z = tr.range(-170, 170); l.push({ a: [tr.range(60, 110), y + tr.range(-15, 25), z + tr.range(-10, 10)], b: [0, y, z], half: true, breakAt: tr.range(4, 30), width: tr.range(0.5, 1.6), sag: tr.range(4, 16), ink: i % 6, seed: tr() }); }
    testThreads = style.thread({ neckDur: 3, snapDur: 1.2 }); const m = new THREE.Mesh(style.threadGeometry(l), testThreads); m.frustumCulled = false; right.add(m);
  }
  root.add(style.mirror(right));
  let skyMesh = null;
  if (withSky) { skyMesh = style.sky(2600); root.add(skyMesh); }

  // ---- the pose, all from one progress value u (0..1 of the 41 s journey) and the wingbeat clock
  const R = 160, HALF = 112, figPos = wingMat.uniforms.uFigPos.value, pose = wingMat.uniforms.uPose.value;
  const beat0 = makeRng(hashSeed('wingbeat:' + ctx.seed))() * Math.PI * 2;     // where in its stroke the Figure is when the world's clock starts: by lot
  const st = { u: 0, camZ: null, auto: true, phase: beat0, fly: 0, shut: 0, law: null, body: {}, sizeNow: 1 };
  const demoHover = dbg ? dbg.get('figz') !== '1' : false, forceSlope = dbg && dbg.get('figslope') ? +dbg.get('figslope') * Math.PI / 180 : null;
  function figureZ(u, camZ) {                       // crease-frame z of the body centre
    const cz = camZ ?? camZAt(u); return Math.min(1150, FIG_Z0 + Math.max(0, cz + 235 - FIG_Z0) * smoothstep(0.07, 0.2, u));
  }
  // THE TALL V. In the cleft each wing opens as far as the leaf beside it lets it, with three metres to spare: wider at the tail
  // (where the cleft is wider) than at the nose, by a twist along the hinge. Its place, size and pitch are its own course's
  // (the world's law of the fold, hero.setFlight); the angles come from the leaves at its own station. Nothing here reads the lens.
  function cleftPose(zF, size, pitch, yF) {
    const cp = Math.cos(pitch), sp = Math.sin(pitch), RS = R * size, HS = HALF * size;
    const need = (r, s) => { const tA = Math.tan(Math.min(style.sheetAt(zF + s * cp).slope, 1.555)), hy = yF + s * sp - 1 - 1.8 * tA, hyp = Math.hypot(cp, tA);
      return hy >= r * hyp ? 0 : Math.atan2(tA, cp) - Math.asin(clamp(hy / (r * hyp), -1, 1)) + 0.02; };
    const sT = -0.9 * HS, sN = 0.9 * HS, aT = clamp(need(RS, sT), 0.35, 1.5), aN = clamp(need(RS, sN), 0.35, 1.5), aTip = (aT + aN) / 2, bend = 70 * size;
    let aRoot = Math.max(0.12, aTip - 0.9);
    for (let i = 1; i <= 8; i++) { const r = RS * i / 8, k = clamp(r / bend, 0, 1), prof = k * k * (3 - 2 * k); if (prof > 0.98) break;
      aRoot = Math.max(aRoot, (need(r, sT) - aT * prof) / (1 - prof), (need(r, sN) - aN * prof) / (1 - prof)); }
    aRoot = Math.min(aRoot, Math.min(aT, aN));
    return { aTip, aRoot, twist: (aN - aT) / 2 / 0.916, bend };
  }
  // The body of a Figure flying a course of its own (hero.setFlight), from the journey progress u alone: how far it is off the
  // page, how far shut, its pitch, and the height of its middle (its tail never lower than 14 m over the crease; before it
  // shuts it climbs over the hoop). o = { y, size, sizeOpen, pitch } at its station.
  function bodyAt(u, o, out = {}) {
    const fly = smoothstep(0.07, 0.17, u), shut = smoothstep(0.855, 0.885, u), rise = smoothstep(0.77, 0.855, u);
    out.fly = fly; out.shut = shut; out.size = lerp(o.size, o.sizeOpen ?? o.size, shut);       // shut, it is a blade again and needs no room
    out.pitch = fly * lerp(0.75, o.pitch, smoothstep(0.15, 0.26, u)) * (1 - 0.9 * shut);
    out.y = Math.max(lerp(o.y, 210, rise), 14 + HALF * out.size * Math.sin(out.pitch));
    return out;
  }
  function applyPose(u, time) {
    const fly = smoothstep(0.07, 0.17, u), zF = demoHover ? FIG_Z0 : figureZ(u, st.camZ), sh = style.sheetAt(zF), alpha = forceSlope ?? sh.slope;
    const steep = smoothstep(0.35, 1.4, alpha), shut = smoothstep(0.855, 0.885, u);
    // st.law (a world's hero.setFlight) = the Figure's own course at its station: the height of its middle, its size (it can
    // never open wider than the page), its pitch in level flight, and how far it is among standing walls (cleft 0..1).
    const free = st.law != null, body = free ? bodyAt(u, st.law, st.body) : null; const size = free ? body.size : 1, RS = R * size, HS = HALF * size;
    const pitch = free ? body.pitch : fly * lerp(0.75, 1.1, steep);
    const yOld = (forceSlope != null ? 120 : sh.pathY) + lerp(55, opts.cleftLift ?? 150, steep), yMin = 14 + HS * Math.sin(pitch), curl = lerp(0.3, 0.1, steep) * (1 - shut) * fly;
    let yF = free ? body.y : Math.max(yOld, yMin), aTip = 0.14, aRoot = 0.12, twist = 0;
    const cp = Math.cos(pitch), tanA = Math.tan(Math.min(alpha, 1.555)), hyp = Math.hypot(cp, tanA), phi = Math.atan2(tanA, cp); let bend = lerp(160, 75, steep) * size;
    { // It can never open wider than the page: through the lowest point of its hinge, every part of the wing clears
      // the leaf by 5 degrees. On the open floor that is a shallow V; in the cleft the roots stay spread and the tips stand up.
      const hy = yF - HS * Math.sin(pitch) - 6, need = (r) => (hy >= r * hyp ? 0 : phi - Math.asin(hy / (r * hyp)) + 0.087);
      aTip = clamp(need(RS), 0.14, 1.5); aRoot = Math.max(0.12, aTip - lerp(0.35, 1.3, steep));
      for (let i = 1; i <= 8; i++) { const r = RS * i / 8, k = clamp(r / bend, 0, 1), prof = k * k * (3 - 2 * k), a = lerp(aRoot, aTip, prof), n = need(r); if (n > a && prof < 0.999) aRoot = Math.min(aTip, aRoot + (n - a) / (1 - prof)); }
    }
    yF += u > 0.84 && !free ? 40 * smoothstep(0.84, 0.88, u) : 0;
    // AMONG STANDING WALLS its wings take the tall V the leaves beside it allow: see cleftPose. Shut, it is the blade again.
    const K = free ? st.law.cleft * (1 - shut) : 0;
    if (K > 0.001) { const c = cleftPose(zF, size, pitch, yF);
      aTip = lerp(aTip, c.aTip, K); aRoot = lerp(aRoot, c.aRoot, K); twist = c.twist * K; bend = lerp(bend, c.bend, K); }
    st.sizeNow = size; wingMat.uniforms.uTwist.value = twist;
    wingMat.uniforms.uSize.value = lerp(1, size, fly);
    pose.set(fly, aRoot, aTip, st.phase);
    wingMat.uniforms.uPitch.value = pitch; wingMat.uniforms.uShut.value = shut; wingMat.uniforms.uBend.value = bend / size;
    wingMat.uniforms.uCurl.value = curl;
    wingMat.uniforms.uPeel.value = 7 + 100 * smoothstep(0, 0.14, u);
    figPos.set(0, yF, zF - FIG_Z0);
    figState.x = smoothstep(0.27, 0.52, u); figState.y = smoothstep(0.44, 0.64, u);
    const print = smoothstep(0.872, 0.94, u);       // shut, it stays standing in the seam as a streaked blade over the hoop
    wingMesh.visible = true; peelThreads.visible = u < 0.3;
    const tw = wingMesh.userData.twin, tt = peelThreads.userData.twin; if (tw) tw.visible = wingMesh.visible; if (tt) tt.visible = peelThreads.visible;
    for (const c of cards) { c.uniforms.uGhost.value = 1; c.uniforms.uPrint.value = print; }
    st.fly = fly; st.shut = shut;
  }
  // twins made by style.mirror are clones: find them so visibility is switched on both
  root.traverse((o) => { if (o !== wingMesh && o.geometry === wingMesh.geometry) wingMesh.userData.twin = o; if (o !== peelThreads && o.geometry === peelThreads.geometry) peelThreads.userData.twin = o; });
  const camP = new THREE.Vector3(), figcam = dbg && dbg.get('figcam') ? dbg.get('figcam').split(',').map(Number) : null;
  const hero = {
    object: root, radius: 190, height: 190, center: new THREE.Vector3(0, 95, 0), ground: false, groundY: 0,
    style, family, wetness, figure: { texture: fig.texture, state: figState, inside: fig.inside },
    anchors: {
      origin: [0, 0, FIG_Z0],
      portalSeat: { position: [0, 180, 1150 - FIG_Z0], facing: [0, 0, -1], radius: 7 },
      flyThrough: [[0, 45, -260], [0, 45, -78], [0, 40, 180], [58, 66, 280], [58, 78, 410], [0, 100, 470], [0, 165, 640], [0, 180, 740], [0, 180, 890]],
      viewpoints: { entry: [0, 45, -260], peel: [0, 45, -150], behind: [0, 45, 0] },
      ghost: [0, 0, 0], print: { hingeZ: 1215 - FIG_Z0, r: 185 }, shut: [0, 280, 1240 - FIG_Z0],   // the brief's places, unread by the world: the world sets the last print's hinge and size itself (u.uStampB, u.uStampBK)
    },
    // setProgress(u, camZ): u = journey progress 0..1; camZ (optional) = the crease-frame z the Figure's 235 m is added to (the lead is the world's law: it hands in the lens's z plus its lead less 235)
    // a world's law of the fold for the Figure at its own station: { y: height of its middle, size, sizeOpen (its size as a shut
    // blade), pitch (in level flight), cleft: 0..1 how far it is among standing walls }. All of the Figure's own place; no lens.
    setFlight(law) { st.law = law; },
    // where its middle is and how it lies at journey progress u on that law (pure: for a gaze that must not wait for update())
    bodyAt(u, law, out) { return bodyAt(u, law, out); },
    figureSize() { return st.sizeNow; },
    setProgress(u, camZ) { st.u = clamp(u, 0, 1); st.camZ = camZ ?? null; st.auto = false; },
    // where the body centre is (local), for a poi
    figurePosition(out = new THREE.Vector3()) { return st.fly < 0.02 ? out.set(0, 4, 0) : out.copy(figPos).multiplyScalar(st.fly); },
    bindCard(mat) { mat.uniforms.uFig.value = fig.texture; mat.uniforms.uFigState.value = figState; cards.push(mat); },
    update(dt, time, camera) {
      style.update(dt, time, camera);
      st.phase = beat0 + time * Math.PI * 2 / 4;                         // one stroke in four seconds, from a start of its own
      if (st.auto) st.u = dbg && dbg.get('figu') ? +dbg.get('figu') : Math.min(0.84, (time % 60) / 41);   // nobody drives it: play the journey
      applyPose(st.u, time);
      if (testThreads) testThreads.uniforms.uClock.value = time;
      if (figcam && camera) { camera.position.set(figcam[0], figcam[1], figcam[2]); camera.lookAt(figcam[3], figcam[4], figcam[5]); camera.updateMatrixWorld(true); }   // viewer-only test camera
      if (skyMesh && camera) { camP.setFromMatrixPosition(camera.matrixWorld); root.worldToLocal(camP); skyMesh.position.copy(camP); }
    },
    dispose() {},
  };
  applyPose(0, 0);
  return hero;
}
