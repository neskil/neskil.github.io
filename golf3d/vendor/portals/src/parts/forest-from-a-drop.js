// The Forest From a Drop: the Great Jar and its one tree, and the MOCHA WARE style kit the whole world is made from.
//
// THE STYLE (makeStyle(ctx, { palette, rust, window, pale }) -> style; one instance for the world, pass it as opts.style)
//   Flat pipeline: return post: style.post (flat 1, no bloom, neutral grade). Colours are written as the hex, nothing
//   is pre-corrected, nothing exceeds 1. Nothing is lit: no lights, no fog, no shadows. Every material below is unlit.
//   style.palette    linear THREE.Colors: cream honey blue tan olive chocolate ink rust window
//   style.glaze(o)   THE material of every pot, strap and lug. Colour comes from the vertex attribute aBand.x = t:
//                    0-1 chocolate, 1-2 olive, 2-3 tan, 3-4 the blue belly band, 4-5 cream; t = -1 bare cream (straps),
//                    t = -2 a thumbprint pad. It draws: pinstripes and the cog border (teeth never under 10 m) on the
//                    blue, a blue drip below its line, honey pooled along the foot of every band and where aBand.z
//                    says a hollow is, faint turning ridges, crazing at two scales, specks, the slip front (wet blue is
//                    deeper and trembles the highlight) and THE WINDOW, the one four-pane highlight, from the
//                    reflection vector. o.hero = true: the front comes from material.uniforms.uWet (the Jar only).
//                    Otherwise the front goes round every 24 s from the clock, offset by the pot's phase (aBand.w).
//                    o.lap = [a0, S, T]: the front spends T laps crossing the share S of the pot that starts at a0 (turns);
//                    T over 1 keeps more than one front in that sector. Beyond 150 m a clock pot's blue carries a dark
//                    fringe of tree shapes drawn by the glaze (wiped by the front, regrowing behind it).
//   style.stain(o)   the dendrite: ribbons lying in the surface, MIN-blended (so nothing sorts or double-darkens),
//                    ink core, rust halo, a wet bead with its own tiny window at every growing tip, never thinner than
//                    1.5 px (it loses strength instead), the same window laid over it. Clock trees (default) are
//                    born 2 s after the slip front passes them, grow for (max birth / rate) s, and are drowned by the
//                    next front; o.hero = true grows on uniforms.uGrow.x instead.
//                    Added by the world builder: a clock tree whose aGrow.y has a whole part k is born k/100 laps late
//                    (still drowned by the front); clock meshes fade into the slip with uniforms.uGrow.y (0..1);
//                    uGrow.w = 2 is a full-grown hero-mode mesh drowned where the hero front (uGrow.y, metres along
//                    the band) has passed a vertex (aGrow.y = its metres along the band). Wet slip dries in crisp
//                    runs that sag down the wall (mochaSheen, shared by glaze and stain); distance pales by exp(-d/900).
//                    Ribbons carry aLag (laps after the root at which the front reaches a vertex): each vertex shows the old
//                    full-grown tree until the wet edge reaches it, then the new growth. A running tip is thin and swells
//                    behind the front; every tip ends in a whole round bead (the line stops inside it).
//   style.drop(o)    unit-sphere beads (Mesh or InstancedMesh), ink with the window in each; o.hero: never pales with distance.
//   style.bead()     the small beads: an InstancedMesh of style.beadGeometry() (a 32-sided disc that faces the lens and is shaded
//                    as a sphere, so its outline is round at any size); instance matrix = scale (sx, sy, sx) and position.
//   (polish 6) On the cream above every belly band the glaze also draws the SHOULDER FRIEZE, the ware's other marks: a rust-orange
//                    line between dark pinstripes, a row of cat's eyes, an earthworm cable, two lines under the lip (uOrange, uDark).
//                    The sky carries FEATHERED SLIP (combed bands of pale blue and honey; uniforms.uSkyWarm 0..1 turns the honey to rust).
//   style.makeSky(r) the cream dome: honey toward the horizon, two turning lines, one blue line, crazing. Copy the
//                    camera's WORLD position into it each frame.
//   style.setWindow(dirWorld)  where the window stands (default: hero-local (0, sin 40, cos 40), anchors.windowDir).
//   style.update(dt, time, camera)  every frame (time uniform, buffer height). buildHero calls it only if it made the style.
//   style.uniforms   shared: uTime uResY uPale uWinDir/U/V uWinSize uWinCol and the palette colours.
//   Geometry, all giving the attributes the materials need:
//     await style.lathe(spec)      a pot or a sector -> { geometry, surf(a, y, out, lift), R, H, edgeAt, rAt }; real 0.4 m
//                                  steps at each slip edge, wobbling edges, lean, ovality, slumped lip. See lathe().
//     style.strap(spec)            a pulled strap handle along a list of points (honey in its groove and joints).
//     style.thumbPad(c, n, up, r)  the thumb-pressed terminal with its thumbprint.
//     await style.growDendrite(rng, spec) -> branches; await style.ribbons(branches, surf, { start, rate }) -> geometry
//                                  for style.stain(). surf = (x, y, out) => pot.surf(x / pot.R, y, out, 0.1).
//                                  start = style.treeStart(potPhase, angle); rate = maxBirth / 3 for "done in 3 s".
//                                  Cheap far trees: orders 2, a few segs; merge many trees into one mesh.
//
// THE HERO (await buildHero(ctx, opts) -> { object, radius, height, center, anchors, style, jar, wallPoint, wallNormal,
//   setProgress(u), update(dt, time, camera), dispose(), ground, groundY })
//   object: the whole Jar (900 m tall, belly radius 700 m, blue band y 40-260), origin at its base centre, the tree on
//   the +Z face rooted at band x = 0; the lug 190 m further along the band toward +X at y 228. radius/height/center
//   only steer the set-piece viewer round the outside of the Jar (the tree, about 300 m wide and 190 m tall, shows for
//   viewer u under 0.25); the Jar's own size is in `jar`.
//   opts: palette (7 hex), style, detail (0.6-1), twigs (0-1 share of hair twigs, default 0.55; halve for the second tree),
//         habit 'upright' | 'seaweed' | 'fern', lugX, lugY, dropRadius (6), fallHeight (180), front [[u, metres along the band], ...] (the Jar's slip front; hero.frontAt(u)),
//         timing { wet .24, fall .37, strike .53, trunk .59, limbs .72, end .985 }: the values of u at which the slip front
//         starts across the band, the drop starts to fall, strikes, the trunk tops out, the limbs are out, the runner
//         reaches the lug. Twigs are born as the camera on anchors.flyThrough comes abreast of them.
//   setProgress(u): call every frame with the world's u. Until it is first called the piece loops by itself on the clock
//         (that is what the set-piece viewer shows). At u = 0 the band is bare and dry.
//   anchors (local): strike, strikeNormal, dropStart, trunkMid, crown, treeTop (pois); portalSeat { position, direction,
//         normal, up, radius 7 }: the centre of the lug's loop, 12 m off the wall, fly along direction (24 degrees up);
//         flyThrough: 8 points, the pass at 60 m, closing, then the climb 12 m off the wall, the last two are the straight
//         70 m into the portal; thumbprint, runnerEnd; viewpoints { framed, pass, climb }; windowDir; timing;
//         wallPoint(x, y, off) -> a point `off` m out from the wall at band coordinates (x along the band, y height).
//   The tree, whatever its habit: the limbs on the lug's side of the lower trunk are aimed along the climb (growDendrite's
//   limb hook), so the crown lies on the wall beside the camera all the way to the lug; within about 30 m of the camera's
//   line every limb is feathered with hair twigs two metres apart. The Jar's slip front is keyframed (frontAt): it crosses
//   the picture slowly while the great drop falls and runs on ahead of the limbs once the drop has struck.
//   Cost: about 125k triangles (Jar 56k, tree 60-66k, lug 4k, drop 3k), 4 draw calls, 3 programs, no textures, no lights,
//         about 200 ms of build in steps under 15 ms.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { clamp, lerp, smoothstep } from '../kit/core.js';

const PALETTE = ['#EFE3C4', '#C9A45A', '#6F8FA6', '#C99A5B', '#8C8A4A', '#4A2E20', '#2B1D1A'];
const TAU = Math.PI * 2;

// ---------------------------------------------------------------- GLSL shared by every material
const GLSL_COMMON = /* glsl */`
uniform float uTime;
uniform vec3 uWinDir, uWinU, uWinV;   // the one window: direction to it and its right/up axes (world)
uniform vec2 uWinSize;                // half size as tangents
uniform vec3 uWinCol;
float h11(float n){ return fract(sin(n * 127.1) * 43758.5453); }
float h21(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
vec2 h22(vec2 p){ return fract(sin(vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)))) * 43758.5453); }
float vn1(float x){ float i = floor(x), f = fract(x); f = f * f * (3. - 2. * f); return mix(h11(i), h11(i + 1.), f); }
float vn2(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(h21(i), h21(i + vec2(1., 0.)), f.x), mix(h21(i + vec2(0., 1.)), h21(i + vec2(1., 1.)), f.x), f.y); }
// The window: a soft cream rounded rectangle of four panes with a cross bar, found from the
// reflection vector r. soft = edge softness (tangent units), wob = offset that distorts it on wet slip.
float mochaWindow(vec3 r, float soft, vec2 wob){
  float d = dot(r, uWinDir);
  vec2 p = vec2(dot(r, uWinU), dot(r, uWinV)) / max(d, 0.05) + wob;
  float aa = max(soft, 1.5 * max(fwidth(p.x), fwidth(p.y)));
  vec2 q = abs(p) - uWinSize + 0.03;
  float sd = length(max(q, 0.)) + min(max(q.x, q.y), 0.) - 0.03;
  float w = 1. - smoothstep(-aa, aa, sd);
  float bw = uWinSize.x * 0.07;
  float bar = min(abs(p.x), abs(p.y));
  w *= mix(0.3, 1., smoothstep(bw - aa, bw + aa, bar));
  return w * step(0.05, d);
}
`;

// wet slip trembles the window; both the glaze and the stain use these so the highlight passes unbroken
const GLSL_WET = /* glsl */`
uniform float uPale;    // how far distance pales everything toward cream (0..1)
uniform float uWinK;    // strength of the window on this material (1; the Great Jar's own materials share one the hero eases)
vec2 mochaWob(vec3 w){
  return (vec2(vn2(vec2(dot(w.xz, vec2(0.71, 0.71)) * 0.21, w.y * 0.03 + uTime * 0.7)),
               vn2(vec2(dot(w.xz, vec2(0.71, -0.71)) * 0.21 + 9., w.y * 0.03 - uTime * 0.6))) - 0.5) * 0.085;
}
// wet slip is still moving: it dries in long runs that sag down the wall (the only weather). Glaze and stain both
// multiply their wetness by this, so a ribbon's ground is always the tone of the slip under it.
// thr: how dry the slip is here. Under -0.2 it is wet all over (just laid), 0.845 leaves the long wet runs, over 1.8 it is dry.
float mochaSheenT(vec3 w, float thr){
  float s = vn2(vec2(dot(w.xz, vec2(0.6, 0.8)) * 0.024, w.y * 0.009 + uTime * 0.1));
  s += 0.5 * vn2(vec2(dot(w.xz, vec2(-0.8, 0.6)) * 0.06 + 7., w.y * 0.022 + uTime * 0.18));
  s += 0.22 * vn2(vec2(dot(w.xz, vec2(0.8, 0.6)) * 0.21 + 3., w.y * 0.045 + uTime * 0.12));   // the drying line is ragged, never a smooth arc
  float e = max(1.2 * fwidth(s), 1e-4);                 // a crisp drying line: flat tone either side, one pixel of edge
  return 0.06 + 0.94 * smoothstep(thr - e, thr + e, s);
}
float mochaSheen(vec3 w){ return mochaSheenT(w, 0.845); }
// (polish 1) The window is crisp and whole on every surface: one small steady tremble everywhere, never a wobble that jumps
// at a drying line (from the valley that read as a torn, blurred pane on the Jar).
vec3 mochaWin(vec3 col, vec3 V, vec3 N, vec3 w){
  float win = mochaWindow(reflect(V, N), 0.005, mochaWob(w) * 0.12);
  return clamp(mix(col, uWinCol, 0.85 * win * uWinK), 0., 1.);
}
vec3 mochaFinish(vec3 col, vec3 cream, vec3 V, vec3 N, vec3 w, float wet, float dist){
  col = mix(col, cream, uPale * (1. - exp(-dist / 900.)));
  return mochaWin(col, V, N, w);
}
`;

// ---------------------------------------------------------------- the glaze (every pot, strap and lug)
// attributes: aBand = (t, metres per t, pool, pot phase), aSurf = (angle, reference radius, height m)
// t: 0-1 chocolate, 1-2 olive, 2-3 tan, 3-4 the blue belly band, 4-5 cream body. t < 0: bare cream (straps).
const GLAZE_VS = /* glsl */`
attribute vec4 aBand; attribute vec3 aSurf;
varying vec4 vBand; varying vec3 vSurf; varying vec3 vW; varying vec3 vN;
void main(){
  vBand = aBand; vSurf = aSurf;
  vec4 w = modelMatrix * vec4(position, 1.);
  vW = w.xyz; vN = mat3(modelMatrix) * normal;
  gl_Position = projectionMatrix * viewMatrix * w;
}`;

const GLAZE_FS = /* glsl */`
${GLSL_COMMON}
${GLSL_WET}
uniform vec3 uCream, uHoney, uBlue, uTan, uOlive, uChoc, uInk, uRust, uOrange, uDark;
uniform vec3 uLap;
#ifdef MOCHA_FLOOR
uniform vec3 uPots[32];   // the floor only: (x, z, foot radius) of everything that stands on it
uniform vec4 uFlood;      // (polish 3) the burst of slip: (x, z) of the great strike's foot, the radius the blue slip has run to over the tray, 0
uniform vec2 uShade;      // (polish 3) the way the glaze ran on the tray: every pool is drawn out that way from its pot's foot
#endif
uniform float uLead;    // (polish 3) strength of the dark wet edge of a clock front (the Pitcher's read as a ragged patch at arm's length)
uniform float uFringe;  // 1: beyond 150 m the glaze draws the dark fringe of far trees itself; 0: this pot carries real trees at any distance
uniform vec4 uWet;      // x: 0 = slip front from the clock, 1 = hero front; y: hero front angle; z: hero wetness; w: drip growth
varying vec4 vBand; varying vec3 vSurf; varying vec3 vW; varying vec3 vN;

// distance to the nearest cell edge of a jittered cell net (crazing); p in cells
float crazeNet(vec2 p){
  vec2 ip = floor(p), fp = fract(p);
  float d1 = 9., d2 = 9.;
  for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
    vec2 g = vec2(float(i), float(j));
    vec2 o = g + 0.15 + 0.7 * h22(ip + g) - fp;
    float d = dot(o, o);
    if (d < d1) { d2 = d1; d1 = d; } else if (d < d2) { d2 = d; }
  }
  return sqrt(d2) - sqrt(d1);
}

void main(){
  float t = vBand.x, mpt = max(vBand.y, 0.01), R = max(vSurf.y, 1.);
  float band = floor(t), f = t - band, m = f * mpt;            // m: metres above this band's foot
  float ang = vSurf.x, arc = ang * R, hgt = vSurf.z;
  vec3 Vd = vW - cameraPosition; float dist = length(Vd);
  vec3 V = Vd / max(dist, 1e-3);
  float nl = length(vN); vec3 N = vN / max(nl, 1e-5);
  if (!gl_FrontFacing) N = -N;
  vec2 sp = vec2(arc, hgt);
  vec2 fw = vec2(length(vec2(dFdx(sp.x), dFdy(sp.x))), length(vec2(dFdx(sp.y), dFdy(sp.y))));
  float px = max(max(fw.x, fw.y), 1e-4);                       // metres per pixel on the surface

  // ---- the slip, band by band, in the potter's order
  vec3 col = uCream; float isBlue = 0., slip = 1.;
  if (t < 0. || band >= 4.) { slip = 0.; }
  else if (band < 1.) col = uChoc;
  else if (band < 2.) col = uOlive;
  else if (band < 3.) col = uTan;
  else { col = uBlue; isBlue = 1.; }

  // ---- wet slip: an angle front from the clock (or the hero's own front)
  // uLap = (a0, S, T): the front spends T of each lap crossing the S of the pot that starts at a0 (turns); S = T is an even lap
  float ca0 = fract(ang / 6.2831853 - uLap.x), inS = step(ca0, uLap.y);
  float nL = ceil(uLap.z - 1e-4);                             // T over 1: more than one front is in the sector at a time
  float ca = mix(uLap.z + (ca0 - uLap.y) / max(1. - uLap.y, 1e-3) * (nL - uLap.z), ca0 / max(uLap.y, 1e-3) * uLap.z, inS);   // the lap time at which the front is here
  float mLap = 6.2831853 * R * mix((1. - uLap.y) / max(nL - uLap.z, 1e-3), uLap.y / max(uLap.z, 1e-3), inS);                 // metres it travels per lap here
  float wobM = 4.5 * sin(hgt * 0.19 + vBand.w * 40.) + 5. * (vn1(hgt * 0.4 + 3.) - 0.5);
  float behind = fract(fract(uTime / 24. + vBand.w) - ca + wobM / mLap);      // laps since the slip was laid here: 0 just laid ... 1 oldest
  float thr = mix(-0.3, 2., smoothstep(0.02, 0.6, behind)), wet = 1.;   // just laid: wet all over; then it dries in crisp runs; dry by 0.6 of a lap
  float lw = clamp(max(2.4, 2.5 * px) / mLap, 0.0015, 0.06), la = clamp(px / mLap, 1e-5, 0.01);
  float lead = (1. - smoothstep(lw, lw + la, behind)) * uLead;                            // the edge of the wet slip: one dark wobbling line
  if (uWet.x > 0.5) {
    float bm = (uWet.y - ang) * R + 14. * sin(hgt * 0.045 + 1.) + 9. * (vn1(hgt * 0.12) - 0.5);   // metres behind the hero front
    float le = max(6., 3.5 * px);
    wet = smoothstep(0., px, bm) * uWet.z;
    thr = mix(-0.3, 0.845, smoothstep(30., 380., bm));
    lead = smoothstep(0., px, bm) * (1. - smoothstep(le, le + px, bm));
  }
  wet *= isBlue * mochaSheenT(vW, thr); lead *= isBlue;

  // ---- on the blue only: pinstripes, the cog border, and below it the drips
  if (isBlue > 0.5) {
    float pw = mpt * 0.011 + 0.15, top = mpt - m;
    float a1 = max(px, 0.02);
    float pin = smoothstep(pw * 0.7 - a1, pw * 0.7 + a1, m) * (1. - smoothstep(pw * 1.7 - a1, pw * 1.7 + a1, m));
    pin = max(pin, smoothstep(pw * 0.7 - a1, pw * 0.7 + a1, top) * (1. - smoothstep(pw * 1.7 - a1, pw * 1.7 + a1, top)));
    float per = max(10., mpt * 0.075);
    float nT = max(floor(6.2831853 * R / per), 3.);
    float ca = fract(ang * nT / 6.2831853);
    float aT = clamp(fw.x * nT / (6.2831853 * R), 1e-4, 0.25);
    float tooth = smoothstep(0.25 - aT, 0.25 + aT, ca) * (1. - smoothstep(0.75 - aT, 0.75 + aT, ca));
    float c0 = pw * 2.6, c1 = pw * 2.6 + mpt * 0.03;
    float cog = tooth * smoothstep(c0 - a1, c0 + a1, top) * (1. - smoothstep(c1 - a1, c1 + a1, top));
    cog = max(cog, smoothstep(c1 - a1, c1 + a1, top) * (1. - smoothstep(c1 + pw - a1, c1 + pw + a1, top)));
    col = mix(col, uBlue * 0.9, wet * mix(0.8, 0.55, step(uWet.x, 0.5) * (1. - uLead)));
    col = mix(col, uBlue * 0.62, lead);
    if (uWet.x < 0.5) {                                         // distance: the trees thin to a dark fringe along the foot of the blue
      float fk = smoothstep(150., 400., dist) * uFringe, pS = floor(vBand.w * 512. + 0.5);
      float xc = arc / (mpt * 0.31) + pS * 0.37, hh = h11(floor(xc) * 1.7 + pS), xf = abs(fract(xc) - 0.5) * 2.;
      float xd = arc / (mpt * 0.13) + pS * 0.11, hd = h11(floor(xd) * 2.3 + pS + 5.), xg = abs(fract(xd) - 0.5) * 2.;
      float gA = clamp((behind - 0.07 - 0.2 * hh) / 0.2, 0., 1.), gB = clamp((behind - 0.05 - 0.25 * hd) / 0.15, 0., 1.);
      // (polish 1) each far tree is a fan: a stem that opens into a round crown, as the dendrites do (they were humps, and read as hills)
      float mm = m - pw * 1.7, ax = 2. * max(fwidth(xc), 1e-4), ag = 2. * max(fwidth(xd), 1e-4);
      float tA = max(mpt * (0.3 + 0.42 * hh) * gA, 1e-3), tB = max(mpt * (0.12 + 0.2 * hd) * gB, 1e-3);
      float frA = (1. - smoothstep(-a1, a1, mm - tA * sqrt(max(1. - xf * xf, 0.)))) * (1. - smoothstep(-ax, ax, xf - 0.08 - 0.92 * clamp(mm / tA, 0., 1.))) * step(0.01, gA);
      float frB = (1. - smoothstep(-a1, a1, mm - tB * sqrt(max(1. - xg * xg, 0.)))) * (1. - smoothstep(-ag, ag, xg - 0.1 - 0.9 * clamp(mm / tB, 0., 1.))) * step(0.01, gB);
      float fr = max(frA, frB) * step(0., mm);
      col = mix(col, uInk, 0.78 * fr * fk);
    }
    col = mix(col, uInk, max(pin, cog));
  }
  if (band == 2.) {                                             // the hand: a blue drip runs below its line
    float nD = max(floor(6.2831853 * R / (mpt * 1.7 + 14.)), 3.);
    float ca = ang * nD / 6.2831853, ci = floor(ca);
    float sd = floor(vBand.w * 512. + 0.5);                     // an exact number: a hash must not see interpolation noise
    float on = step(0.72, h11(ci + sd * 3.));
    float wD = 0.5 + mpt * 0.05, L = mpt * (0.25 + 0.55 * h11(ci * 3. + sd + 2.)) * (0.55 + 0.45 * uWet.w);
    float x = (fract(ca) - 0.5) * 6.2831853 * R / nD, dn = mpt - m;
    float yy = clamp(dn, 0., L);
    float dd = length(vec2(x, dn - yy)) - wD * (0.55 + 0.45 * yy / max(L, 0.01));
    col = mix(col, uBlue * 0.92, on * (1. - smoothstep(-px, px, dd)));
  }
`;

const GLAZE_FS2 = /* glsl */`
  // ---- honey: pooled along the foot of every band, and wherever the vertex mask says a hollow is
  float hw = 0.25 + mpt * 0.02;
  float foot = (t < 0.) ? 0. : (1. - smoothstep(0., hw, m));
  foot *= foot;
  float pool = clamp(max(vBand.z, foot * 0.9), 0., 1.);
  #ifdef MOCHA_FLOOR
  float inF = 0., edgeF = 0., hF = 0., edgeH = 0.;
  {
    // (polish 3) THE TRAY. The pots stand on a tray of the same ware, and its glaze is where the picture gets its depth: under
    // every pot the honey has pooled deep and run one way (uShade), flat inside a drawn edge, a darker pool inside a paler one:
    // the ware's own "shadow". Further out it lies in broad flat patches, the wheel's turning lines go round the Great Jar,
    // and one slate-blue line runs round it as round the sky.
    float pxF = max(max(fwidth(vW.x), fwidth(vW.z)), 1e-3), dP = 1e5;
    for (int i = 0; i < 32; i++) {
      vec3 q = uPots[i]; vec2 d = vW.xz - q.xy;
      float L = q.z * 1.5 + 30., h = clamp(dot(d, uShade) / L, 0., 1.);
      dP = min(dP, length(d - uShade * (L * h)) - q.z * mix(1.06, 0.62, h) - 12.);
    }
    float wP = 9. * (vn2(vW.xz * 0.045) - 0.5) + 3. * (vn2(vW.xz * 0.17 + 5.) - 0.5);         // the pool's edge wanders like a poured glaze
    float dO = dP + wP, dI = dP + 30. + 1.6 * wP;
    float inP = 1. - smoothstep(-pxF, pxF, dO), inI = 1. - smoothstep(-pxF, pxF, dI), lw = max(0.6, 1.2 * pxF);
    float rim = max((1. - smoothstep(lw, lw + pxF, abs(dO))), 0.7 * (1. - smoothstep(lw, lw + pxF, abs(dI)))) * clamp(2.2 / pxF, 0., 1.);
    float nP = vn2(vW.xz * 0.0052 + 11.) + 0.45 * vn2(vW.xz * 0.019 + 3.);
    float eP = max(fwidth(nP), 1e-4);
    float inQ = smoothstep(0.7 - eP, 0.7 + eP, nP), inQ2 = smoothstep(0.93 - eP, 0.93 + eP, nP);
    float rimQ = max(1. - smoothstep(eP, 2.2 * eP, abs(nP - 0.7)), 1. - smoothstep(eP, 2.2 * eP, abs(nP - 0.93))) * clamp(0.004 / eP, 0., 1.);
    pool = clamp(max(max(pool, 0.72 * inQ + 0.24 * inQ2), 0.92 * inP), 0., 1.);
    float rF = length(vW.xz), pxR = max(fwidth(rF), 1e-3);
    float dR = abs(fract(rF / 85. + 0.3 * vn1(rF / 85. + 2.)) - 0.5) * 85., wR = max(0.7, 1.1 * pxR);
    float ring = (1. - smoothstep(wR, wR + pxR, dR)) * clamp(4. / pxR, 0., 1.) * (1. - inP);
    float dB = abs(rF - 1012. - 9. * (vn2(vW.xz * 0.011) - 0.5)), wB = max(1.6, 1.1 * pxR);
    float blueL = (1. - smoothstep(wB, wB + pxR, dB)) * (1. - inP) * clamp(6. / pxR, 0., 1.);
    // the burst of slip: from the great strike a sheet of wet blue runs out over the tray, lobed like a splash, a dark wet edge leading it
    vec2 dF2 = vW.xz - uFlood.xy; float rf = length(dF2), af = atan(dF2.x, abs(dF2.y) + 1e-4);
    float lobes = 0.11 * sin(af * 9. + 1.3) + 0.07 * sin(af * 17. + 4.) + 0.05 * sin(af * 31. + 2.);
    float dFl = rf - uFlood.z * (1. + lobes) + 16. * (vn2(vW.xz * 0.021 + 3.) - 0.5);
    float lwF = max(2.2, 1.6 * pxF);
    inF = (1. - smoothstep(-pxF, pxF, dFl)) * step(2., uFlood.z);
    edgeF = inF * (1. - smoothstep(lwF, lwF + pxF, -dFl));
    // (polish 5) behind the blossom the flood turns: a second front runs out from the strike (uFlood.w) and inside it the slip is warm
    float dH = rf - uFlood.w * (1. + 0.6 * lobes) + 24. * (vn2(vW.xz * 0.017 + 9.) - 0.5);
    hF = (1. - smoothstep(-pxF, pxF, dH)) * step(2., uFlood.w) * inF;
    edgeH = hF * (1. - smoothstep(lwF, lwF + pxF, -dH));
    float deep = mix(0.38, 0.62, inI);                                                         // honey, then honey gone toward chocolate
    col = mix(col, mix(uHoney, uChoc, deep), max(0.8 * inI, 0.62 * rim) * (1. - inF));
    col = mix(col, uHoney * 0.84, 0.5 * rimQ * (1. - inP) * (1. - inF));
    col = mix(col, uHoney * 0.88, 0.55 * ring * (1. - inF));
    col = mix(col, uBlue, 0.85 * blueL * (1. - inF));
    pool *= (1. - inF * (1. - 0.9 * inI)) * (1. - 0.72 * inI);
    slip = max(slip, inF);
  }
  #endif
  if (t < -1.5) {                                              // a thumb-pressed terminal: sp is metres on the pad
    float rr = length(sp * vec2(1., 0.78) + vec2(0.35 * sin(sp.y * 0.9), 0.));
    float rd = 0.5 + 0.5 * sin(rr * 6.2831853 / 0.55 + 1.2 * sin(sp.x * 0.7));
    float ra = clamp(0.2 / max(px, 1e-4), 0., 1.);
    pool = clamp(vBand.z * mix(0.55, 0.25 + 0.75 * smoothstep(0.25, 0.75, rd), ra), 0., 1.);
  }
  col = mix(col, mix(col, uHoney, mix(1., 0.4, slip)), pool);
  #ifdef MOCHA_FLOOR
  {
    vec3 slipC = mix(uBlue, uBlue * 0.9, 0.8 * mochaSheenT(vW * vec3(1., 0., 1.) + vec3(0., 40., 0.), 0.7));
    col = mix(col, mix(slipC, col, 0.5 * pool), inF);
    col = mix(col, uBlue * 0.6, edgeF);
    // marbled slip: warm honey in three flat tones, each inside a drawn line, with pools of the first slip left in it
    vec2 mq = vW.xz * 0.0085 + vec2(0.011, -0.004) * uTime; mq += 1.5 * vec2(vn2(mq * 0.9 + 4.), vn2(mq * 0.9 + 17.) + 0.02 * uTime);      // still wet: it creeps
    float mN = vn2(mq * 1.7 + 2.), eM = max(fwidth(mN), 1e-4);
    vec3 warm = min(uHoney * vec3(1.07, 0.95, 0.8), vec3(1.));
    vec3 marb = mix(warm, mix(uHoney, uCream, 0.6), smoothstep(0.64 - eM, 0.64 + eM, mN));
    marb = mix(marb, mix(warm, uChoc, 0.32), 1. - smoothstep(0.36 - eM, 0.36 + eM, mN));
    marb = mix(marb, slipC, 1. - smoothstep(0.2 - eM, 0.2 + eM, mN));
    float lnM = (1. - smoothstep(eM, 2.2 * eM, min(min(abs(mN - 0.64), abs(mN - 0.36)), abs(mN - 0.2)))) * clamp(0.004 / eM, 0., 1.);
    marb = mix(marb, uChoc, 0.4 * lnM);
    col = mix(col, marb, hF);
    col = mix(col, mix(uChoc, uHoney, 0.3), edgeH);
  }
  #endif

  // ---- (polish 1) two honey turning lines on the cream shoulder, as on the sky: a shoulder reads as ware against the cream sky
  #ifdef MOCHA_FLOOR
  if (band >= 4. && t < 5.) {
    float lwS = max(mpt * 0.0045, 1.1 * px), d1S = abs(m - mpt * 0.075), d2S = abs(m - mpt * 0.2);
    float lnS = 1. - smoothstep(lwS, lwS + px, min(d1S, d2S));
    col = mix(col, uHoney, 0.55 * lnS * clamp(mpt * 0.02 / px, 0., 1.));
  }
  #else
  // ---- (polish 6) THE SHOULDER FRIEZE: the ware's other marks, slip-trailed on the cream above the belly band of every pot, in
  // the potter's order: a rust-orange line between two dark pinstripes, a row of CAT'S EYES (three slips dropped one in another),
  // an EARTHWORM cable of three slips laid side by side. Flat slip inside drawn edges; no pot shows a bare cream shoulder.
  if (band >= 4. && t < 5.) {
    float D = min(mpt, 0.3 * R + 20.), y = m / D, ay = max(px / D, 1e-4), sdP = floor(vBand.w * 512. + 0.5);
    float kd = clamp(0.03 / ay - 0.3, 0., 1.);
    float inB = smoothstep(0.06 - ay, 0.06 + ay, y) * (1. - smoothstep(0.15 - ay, 0.15 + ay, y));
    float lwB = max(0.007, 1.1 * ay);
    float lnB = 1. - smoothstep(lwB, lwB + ay, min(abs(y - 0.06), abs(y - 0.15)));
    vec3 dc = mix(col, uOrange, inB);
    dc = mix(dc, uDark, lnB);
    // cat's eyes: whole turns only (no seam)
    float nE = max(floor(6.2831853 * R / (0.46 * D)), 5.);
    float ce = ang * nE / 6.2831853, ci = floor(ce), hs = h11(ci * 1.3 + sdP * 0.7), sA = hs * 6.2831853;
    vec2 q = vec2((fract(ce) - 0.5) * 6.2831853 * R / (nE * D) * 0.8, y - 0.36 - 0.02 * (hs - 0.5)) / 0.125;
    float ax = max(max(fwidth(ce) * 6.2831853 * R / (nE * D) * 0.8, ay) / 0.125, 1e-4);
    float th = atan(q.y, q.x + 1e-5), r0 = length(q) / (0.9 + 0.1 * cos(th * 3. + sA));
    vec2 c1 = 0.16 * vec2(cos(sA + 0.2 * sin(uTime * 0.4 + sA)), sin(sA)), c2 = c1 + 0.12 * vec2(cos(sA * 3.3), sin(sA * 3.3));
    float r1 = length(q - c1) / 0.56, r2 = length(q - c2) / 0.24;
    vec3 eo = mix(uOrange, uBlue, step(0.5, fract(ci * 0.5 + 0.25)));
    vec3 ec = mix(uCream, eo, smoothstep(1. - ax, 1. + ax, r1));
    ec = mix(uDark, ec, smoothstep(1. - 2. * ax, 1. + 2. * ax, r2));
    float lwE = max(0.09, 1.3 * ax);
    ec = mix(ec, uDark, smoothstep(1. - lwE - ax, 1. - lwE + ax, r0));
    dc = mix(dc, ec, 1. - smoothstep(1. - ax, 1. + ax, r0));
    // the earthworm cable
    float nW = max(floor(6.2831853 * R / (0.7 * D)), 3.);
    float v = (y - 0.63 - 0.035 * sin(ang * nW)) / 0.042, av = max(ay / 0.042, 1e-4);
    float w3 = v + 0.3 * sin(ang * nW * 0.5 + 1.);
    vec3 wc = mix(uOrange, uCream, smoothstep(-0.3 - av, -0.3 + av, w3));
    wc = mix(wc, uDark, smoothstep(0.3 - av, 0.3 + av, w3));
    float lwW = max(0.14, 1.3 * av);
    wc = mix(wc, uDark, smoothstep(1. - lwW - av, 1. - lwW + av, abs(v)));
    dc = mix(dc, wc, 1. - smoothstep(1. - av, 1. + av, abs(v)));
    // and under the lip, where there is room for them: a blue line and a rust one
    float yl = (mpt - m) / D, room = step(1.5 * D, mpt);
    float l1 = smoothstep(0.1 - ay, 0.1 + ay, yl) * (1. - smoothstep(0.16 - ay, 0.16 + ay, yl));
    float l2 = smoothstep(0.2 - ay, 0.2 + ay, yl) * (1. - smoothstep(0.225 - ay, 0.225 + ay, yl));
    dc = mix(dc, uBlue, l1 * room); dc = mix(dc, uOrange, l2 * room);
    col = mix(col, dc, kd);
  }
  #endif
  // ---- turning ridges: irregular, 2 to 5 m apart, under 5 percent
  col *= 1. + 0.04 * (vn1(hgt * 0.31 + vBand.w * 57.) - 0.5) * (1. - smoothstep(150., 600., dist));

  // ---- crazing: a honey hairline net at two scales, filtered, gone with distance
  // fine net: cells of half a metre, a hairline a pixel and a half wide within 20 m, gone by 60 m (and before its cells get small enough to shimmer)
  float k1 = (1. - smoothstep(22., 60., dist)), k2 = (1. - smoothstep(250., 900., dist));
  float e1 = crazeNet(sp / 0.55), e2 = crazeNet(sp / 5.5 + 7.3);
  float w1 = px / 0.55, w2 = px / 5.5;
  float h1 = max(0.016, 0.75 * w1);
  float l1 = (1. - smoothstep(h1, h1 + 1.5 * w1, e1)) * k1 * (1. - smoothstep(0.065, 0.125, w1));   // gone before a cell is under 8 px: never a fine mesh
  float l2 = (1. - smoothstep(0.006, 0.008 + 1.5 * w2, e2)) * k2 * clamp(0.008 / max(w2, 1e-4), 0., 1.);
  float craze = clamp(l1 * mix(0.24, 0.62, step(0., t)) + l2 * 0.34 * step(0., t), 0., 1.);
  col = mix(col, mix(uHoney * 0.92, mix(col * 0.74, uHoney, 0.22), slip), craze);

  // ---- pinholes and iron specks, only near
  vec2 cq = sp / 0.9, ci2 = floor(cq);
  float hsp = h21(ci2 + 3.1);
  vec2 cp = 0.2 + 0.6 * h22(ci2) - fract(cq);
  float speck = step(0.88, hsp) * (1. - smoothstep(0., 1.1 * px / 0.9, length(cp) - 0.034 * (1.1 + 4. * (hsp - 0.88))));
  // iron specks (dark) and a few pinholes (the bare body showing through)
  col = mix(col, mix(mix(uInk, uRust, 0.2), mix(uCream, uHoney, 0.3), step(0.975, hsp)), speck * (1. - smoothstep(20., 60., dist)) * 0.9 * clamp(0.07 / px - 0.5, 0., 1.));

  gl_FragColor = vec4(mochaFinish(col, uCream, V, N, vW, wet, dist), 1.);
}`;

// ---------------------------------------------------------------- the stain (dendrite ribbons lying in the glaze)
// attributes: position = centre line on the surface, normal = surface normal, aLat = sideways unit vector,
// aRib = (birth, half width m, side -1/+1, birth at this branch's tip), aGrow = (metres per birth unit, tree start, tree rate)
const STAIN_VS = /* glsl */`
uniform float uTime, uResY, uRegrow; uniform vec4 uGrow;   // w: 1 = hero (x: growth in birth units, z: wetness), 0 = run on the clock per tree
attribute vec4 aRib; attribute vec3 aLat; attribute vec3 aGrow; attribute float aLag;   // aLag: laps after the tree's root at which the slip front reaches this vertex
varying vec4 vRib; varying vec4 vAux; varying vec3 vMore; varying vec3 vW; varying vec3 vN;
void main(){
  float ph = fract(uTime / 24. + aGrow.y);
  float dl = floor(aGrow.y + 1e-4) * 0.01;             // clock trees: laps by which this tree's drop comes late (whole part of aGrow.y)
  // each vertex has its own clock: since = laps since the wet edge reached it in the tree's present life. Before that
  // (since < 0) it still shows the old, full-grown tree, so a tree is wiped where the edge is and regrows behind it.
  float lph = ph - aLag, since = lph + 0.08 + dl, wetT = fract(since);
  float old = (uGrow.w > 0.5) ? 0. : step(since, 0.03);
  float g = (uGrow.w > 0.5) ? uGrow.x : mix(ph * 24. * aGrow.z, 1e4, old);
  float wet = (uGrow.w > 0.5) ? uGrow.z : (1. - smoothstep(0.02, 0.5, wetT)) * step(0.035, wetT);
  float drown = (uGrow.w > 0.5) ? 0. : smoothstep(0.935 - dl, 0.95 - dl, lph);
  if (uGrow.w > 1.5) {
    drown = smoothstep(0., 22., uGrow.y - aGrow.y);
    // (polish 2) the forest comes back: a wave goes out along the band from the great tree (uRegrow, metres) and every drowned
    // tree it has passed grows again from its root (aGrow.z = the root's metres along the band; 0 = this one stays drowned)
    float rg = uRegrow - abs(aGrow.z);
    if (rg > 0. && abs(aGrow.z) > 0.5) { drown = 0.; g = rg * 1.1; }
  }
  if (uGrow.w < 0.5) drown = max(drown, uGrow.y);                      // clock trees: uGrow.y fades the whole mesh into the slip   // mode 2, old trees on the hero band: aGrow.y = metres along the band, uGrow.y = where the slip front is
  vec4 w = modelMatrix * vec4(position, 1.);
  float dist = length(w.xyz - cameraPosition);
  float mpp = dist * 2. / (max(projectionMatrix[1][1], 0.01) * max(uResY, 1.));
  float gF = min(g, aRib.w);
  float dm = (gF - aRib.x) * aGrow.x;                 // metres behind the growing front
  // the stain soaks in: a thin running tip that swells to its full width a little way behind the front
  // a thick limb is drawn as a line: it runs thin (under a third of its soaked width) and swells a long way behind the front
  float thick = smoothstep(0.5, 3., aRib.y), tipK = mix(0.55, 0.3, thick);
  float hT = aRib.y * tipK, rT = min(hT * mix(1.7, 1.5, thick), hT + 1.2) + 0.12 * (1. - thick);      // the tip, and its bead: a round drop about 1.5 tips wide
  float hw = aRib.y * (tipK + (1. - tipK) * smoothstep(0., max(aRib.y * mix(11., 16., thick), 0.5), dm - rT));
  float hwE = max(hw, 0.75 * mpp), cov = min(1., hw / hwE);
  float halo = max(hw * 1.9 + 0.12, hwE + mpp);
  float rE = max(rT, 1.1 * mpp);
  float W = halo;
  if (dm > -5. && dm < 2. * rE + 5.) W = max(W, rE * 1.15);
  if (dm < -8.) W = 0.;
  vec3 lat = mat3(modelMatrix) * aLat;
  vRib = vec4(aRib.x, hwE, aRib.z * W, gF);
  vAux = vec4(halo, cov, rE, wet);
  vMore = vec3(aGrow.x, drown, min(1., (rT * rT) / max(rE * rE, 1e-8)));
  if (aRib.y < 0.) {
    // a blot: the drop flattened where it landed, a round pool under the trunk's foot (two points 1.4 radii either side of it;
    // aRib.x = -1 / +1 says which, -aRib.y is the radius). It spreads in under half a second from the moment the tree is born.
    float Rb = -aRib.y, kB = clamp(g / max(0.45 * aGrow.z, 1e-4), 0., 1.), on = step(1e-4, kB);
    float Re = max(Rb * kB * (2. - kB), 1.1 * mpp);
    W = 1.4 * Rb * on;
    vRib = vec4(0., 0., aRib.z * W, Re + aRib.x * 1.4 * Rb);
    vAux = vec4(-1., 0., Re, wet);
    vMore = vec3(1., drown, on * min(1., (Rb * Rb) / max(Re * Re, 1e-8)));
  }
  w.xyz += lat * (aRib.z * W);
  vW = w.xyz; vN = mat3(modelMatrix) * normal;
  gl_Position = projectionMatrix * viewMatrix * w;
}`;

const STAIN_FS = /* glsl */`
${GLSL_COMMON}
${GLSL_WET}
uniform vec3 uCream, uBlue, uInk, uRust; uniform float uInkPale, uFree;
varying vec4 vRib; varying vec4 vAux; varying vec3 vMore; varying vec3 vW; varying vec3 vN;
void main(){
  float s = abs(vRib.z), a = max(fwidth(vRib.z), 1e-4);
  float dm = (vRib.w - vRib.x) * vMore.x;
  float wet = vAux.w * mochaSheen(vW), rE = vAux.z;
  float vis = smoothstep(-a, a, dm - rE);                  // the line ends inside its bead, so the tip is a whole round drop
  float core = (1. - smoothstep(vRib.y - 0.6 * a, vRib.y + 0.6 * a, s)) * vAux.y * vis;
  float blot = step(vAux.x, -0.5);                         // 1 on a blot's quad (see the vertex shader)
  float hl = 1. - smoothstep(vRib.y, max(vAux.x, vRib.y + a), s);
  hl = hl * sqrt(max(hl, 0.)) * 0.85 * vAux.y * vis;
  vec2 bq = vec2(dm - rE, vRib.z) / max(rE, 1e-3);
  float bl = length(bq), ab = a / max(rE, 1e-3);
  float bead = (1. - smoothstep(1. - ab, 1. + ab, bl)) * vMore.z;
  hl = max(hl, blot * 0.8 * (1. - smoothstep(1., 1.34, bl)) * vMore.z);   // the blot's rust edge
  vec2 wq = abs(bq - vec2(-0.3, 0.32)) - vec2(0.2, 0.27);
  float bwin = (1. - smoothstep(-ab, ab, max(wq.x, wq.y))) * smoothstep(0.03, 0.03 + ab, min(abs(bq.x + 0.3), abs(bq.y - 0.32)));
  bwin *= bead * clamp(0.25 / max(ab, 1e-3), 0., 1.) * (1. - blot);
  vec3 Vd = vW - cameraPosition; float dist = length(Vd);
  float P = uPale * (1. - exp(-dist / 900.));              // distance pales the slip and the halo fully, the ink by uInkPale of that
  vec3 base = mix(mix(uBlue, uBlue * 0.9, wet * 0.8), uCream, P);        // the same wet blue the glaze lays underneath
  base = mix(base, vec3(1.), uFree);                         // (polish 3) a stain that has stood up out of the slip has no ground under it: MIN leaves what is behind it as it is
  vec3 col = mix(base, mix(uRust, uCream, P), hl);
  col = mix(col, mix(uInk, uCream, P * uInkPale), max(core, bead));
  col = mix(col, uWinCol, bwin * 0.9);
  col = mix(col, base, vMore.y);                           // drowned under the next slip front
  vec3 N = vN / max(length(vN), 1e-5);
  gl_FragColor = vec4(mix(mochaWin(col, Vd / max(dist, 1e-3), N, vW), col, uFree), 1.);
}`;

// ---------------------------------------------------------------- the drop (a glossy black bead with the window in it)
const DROP_VS = /* glsl */`
uniform vec4 uDrop;   // x: squash 0 = sphere ... 1 = a flat blot lying on the wall (local +Z is the wall normal); y: blot spread
varying vec3 vW; varying vec3 vN; varying float vFlat;
void main(){
  #ifdef USE_INSTANCING
    mat4 im = instanceMatrix;
  #else
    mat4 im = mat4(1.);
  #endif
  vec3 p = position, n = normal;
  float sq = uDrop.x, a = atan(p.y, p.x + 1e-5);
  float lobes = 1. + 0.1 * sin(a * 3. + 1.3) + 0.07 * sin(a * 5. + 4.) + 0.04 * sin(a * 8.);
  // (polish 3) uDrop.w: falling, the great drop is a drop: round below, drawn out to a point above
  float tl = max(p.y, 0.) * uDrop.w * (1. - sq);
  p.xz *= sqrt(max(1. - 0.96 * tl, 0.)); p.y += 2.1 * tl * tl + 0.5 * tl;
  p.xy *= mix(1., uDrop.y * lobes, sq);
  p.z *= mix(1., 0.03, sq);
  n = mix(n, vec3(0., 0., 1.), sq * 0.97);
  vec4 w = modelMatrix * im * vec4(p, 1.);
  vW = w.xyz; vN = mat3(modelMatrix) * mat3(im) * n; vFlat = sq;
  gl_Position = projectionMatrix * viewMatrix * w;
}`;
const DROP_FS = /* glsl */`
${GLSL_COMMON}
${GLSL_WET}
uniform vec3 uCream, uInk, uRust; uniform vec4 uDrop;
varying vec3 vW; varying vec3 vN; varying float vFlat;
void main(){
  vec3 Vd = vW - cameraPosition; float dist = length(Vd); vec3 V = Vd / max(dist, 1e-3);
  vec3 N = vN / max(length(vN), 1e-5);
  vec3 r = reflect(V, N);
  // a bead bends the room into itself: pull the reflection half way to the window so its image is larger
  vec3 rb = mix(r, uWinDir, 0.5 * (1. - vFlat)); rb = rb / max(length(rb), 1e-4);
  float win = mochaWindow(rb, 0.012, mochaWob(vW) * vFlat);
  vec3 col = mix(uInk, uCream, uPale * (1. - exp(-dist / 900.)) * (1. - uDrop.z * (1. - 0.2 * vFlat)));      // uDrop.z = 1: the great drop, full ink at any distance; flattened to a blot it is stain, and pales as the stain does
  gl_FragColor = vec4(clamp(mix(col, uWinCol, 0.9 * win), 0., 1.), 1.);
}`;

// ---------------------------------------------------------------- the small beads (every drop but the great one)
// A disc of 32 sides that always faces the lens and is shaded as the sphere it stands for: the outline is round at any
// size and a bead costs 32 triangles. Instance matrix = scale (sx, sy, sx) and position; sy stretches it along world up.
const BEAD_VS = /* glsl */`
varying vec3 vC; varying vec3 vQ; varying vec2 vUp;
void main(){
  #ifdef USE_INSTANCING
    mat4 im = instanceMatrix;
  #else
    mat4 im = mat4(1.);
  #endif
  vec4 c = modelMatrix * im * vec4(0., 0., 0., 1.);
  float sx = length(im[0].xyz), sy = length(im[1].xyz);
  vec4 cv = viewMatrix * c;
  vec2 up = (viewMatrix * vec4(0., 1., 0., 0.)).xy; float ul = length(up);
  up = ul > 1e-3 ? up / ul : vec2(0., 1.);
  // (polish 2) a falling drop is a drop: round below, drawn out to a point above (sy over sx says how much: a bead at rest is round)
  float tl = max(position.y, 0.), tk = clamp((sy / max(sx, 1e-4) - 0.9) / 0.22, 0., 1.);
  vec2 q = vec2(position.x * mix(1., sqrt(max(1. - tl, 0.)), tk), position.y + tl * 1.25 * tk);
  cv.xy += vec2(up.y, -up.x) * (q.x * sx) + up * (q.y * sy);
  vC = c.xyz; vQ = vec3(position.xy, sx); vUp = up;
  gl_Position = projectionMatrix * cv;
}`;
const BEAD_FS = /* glsl */`
${GLSL_COMMON}
${GLSL_WET}
uniform vec3 uCream, uInk;
varying vec3 vC; varying vec3 vQ; varying vec2 vUp;
void main(){
  float z = sqrt(max(1. - dot(vQ.xy, vQ.xy), 0.));
  // (the normal leans out faster than a true sphere's, so the window's image sits nearer the middle of the bead, whole and readable)
  vec3 nv = vec3((vUp.y * vQ.x + vUp.x * vQ.y) * 1.6, (vUp.y * vQ.y - vUp.x * vQ.x) * 1.6, z);
  vec3 N = nv * mat3(viewMatrix);                          // view space back to world
  N = N / max(length(N), 1e-5);
  vec3 Vd = vC + N * vQ.z - cameraPosition; float dist = length(Vd); vec3 V = Vd / max(dist, 1e-3);
  vec3 rb = mix(reflect(V, N), uWinDir, 0.5); rb = rb / max(length(rb), 1e-4);   // a bead bends the room into itself (as the great drop does)
  float win = mochaWindow(rb, 0.012, vec2(0.)) * smoothstep(0.25, 0.45, dot(rb, uWinDir));   // one window, no ghost of it at the far rim
  vec3 col = mix(uInk, uCream, uPale * (1. - exp(-dist / 900.)));
  gl_FragColor = vec4(clamp(mix(col, uWinCol, 0.9 * win), 0., 1.), 1.);
}`;

// ---------------------------------------------------------------- the sky (the inside of the same pot)
const SKY_VS = /* glsl */`
varying vec3 vD;
void main(){ vD = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`;
const SKY_FS = /* glsl */`
${GLSL_COMMON}
uniform vec3 uCream, uHoney, uBlue, uOrange; uniform float uSkyWarm;
varying vec3 vD;
float skyNet(vec2 p){
  vec2 ip = floor(p), fp = fract(p); float d1 = 9., d2 = 9.;
  for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
    vec2 g = vec2(float(i), float(j)); vec2 o = g + 0.15 + 0.7 * h22(ip + g) - fp; float d = dot(o, o);
    if (d < d1) { d2 = d1; d1 = d; } else if (d < d2) { d2 = d; }
  }
  return sqrt(d2) - sqrt(d1);
}
void main(){
  vec3 d = vD / max(length(vD), 1e-4);
  float el = degrees(asin(clamp(d.y, -1., 1.)));
  float az = atan(d.x, abs(d.z) < 1e-5 ? 1e-5 : d.z);
  float aw = max(fwidth(el), 1e-3);
  // (polish 3) honey pools toward the horizon in two flat steps inside drawn, wandering edges, as it lies on the tray: the sky has
  // three calm tones, and a cream shoulder stands light against it (only whole turns of az: no seam)
  float e1 = 8.5 + 1.6 * sin(az * 3. + 1.) + 0.9 * sin(az * 7. + 4.) + 0.5 * sin(az * 13.);
  float e2 = 22. + 2.2 * sin(az * 2. + 2.) + 1.2 * sin(az * 5. + 1.) + 0.6 * sin(az * 11. + 3.);
  float s1 = 1. - smoothstep(-aw, aw, el - e1), s2 = 1. - smoothstep(-aw, aw, el - e2);
  vec3 col = mix(uCream, uHoney, 0.08 + 0.3 * s2 + 0.36 * s1);
  float eln = max(1. - smoothstep(0.16, 0.16 + aw, abs(el - e1)), 1. - smoothstep(0.16, 0.16 + aw, abs(el - e2)));
  col = mix(col, uHoney * 0.84, 0.55 * eln);
  float t1 = 1. - smoothstep(0.2, 0.2 + aw, abs(el - 12. - 0.25 * sin(az * 2. + 1.)));
  float t2 = 1. - smoothstep(0.2, 0.2 + aw, abs(el - 30. - 0.3 * sin(az * 3. + 4.)));
  col = mix(col, uHoney, 0.6 * max(t1, t2));                                                      // two turning lines
  float bl = 1. - smoothstep(0.2, 0.2 + aw, abs(el - 48. - sin(az * 3. + 2.) - 0.4 * sin(az * 7.)));
  col = mix(col, uBlue, 0.8 * bl);                                                                 // one thin slate-blue line
  // (polish 6) FEATHERED SLIP: over our heads the potter trailed lines of blue and honey slip across the wet cream and drew a
  // feather through them, as on a combed dish: flat chevroned bands inside drawn edges that lie like a mackerel sky, in
  // perspective toward the horizon, and creep (the slip is still wet). They pale into the honey of the horizon.
  {
    vec2 cq = d.xz / max(d.y + 0.16, 0.1);
    float kc = smoothstep(4., 13., el) * (1. - smoothstep(72., 86., el));
    vec2 cw = cq * 1.1 + vec2(0.008, 0.005) * uTime;
    float comb = abs(fract(cw.x * 1.5 + 0.15 * vn1(cw.y * 0.7)) - 0.5) * 2.;                        // the feather's strokes
    float bf = cw.y * 2.5 + 0.5 * comb * comb + 0.3 * vn2(cw * 0.6 + 2.);
    float st = fract(bf), eb = max(fwidth(bf), 1e-4), ib = floor(bf);
    float hb = h11(ib * 1.7 + 3.);
    float wB = 0.2 + 0.16 * hb, wH = wB + 0.1 + 0.1 * h11(ib + 9.);
    float mk = vn2(cq * 0.85 + vec2(0.006, 0.) * uTime + 5.) + 0.35 * vn2(cq * 2.3 + 11.), em = max(fwidth(mk), 1e-4);
    float inC = smoothstep(0.52 - em, 0.52 + em, mk) * kc * clamp(0.05 / eb, 0., 1.);
    float sB = smoothstep(0.03 - eb, 0.03 + eb, st) * (1. - smoothstep(wB - eb, wB + eb, st));
    float sH = smoothstep(wB - eb, wB + eb, st) * (1. - smoothstep(wH - eb, wH + eb, st));
    vec3 warmS = mix(uHoney, uOrange, 0.55 * uSkyWarm);
    vec3 cc = mix(col, mix(col, uBlue, mix(0.62, 0.3, uSkyWarm)), sB);
    cc = mix(cc, mix(col, warmS, 0.6), sH);
    float lnC = max(1. - smoothstep(eb, 2.2 * eb, min(min(abs(st - 0.03), abs(st - wB)), abs(st - wH))), 1. - smoothstep(em, 2.2 * em, abs(mk - 0.52)));
    cc = mix(cc, uHoney * 0.8, 0.5 * lnC * clamp(0.02 / eb, 0., 1.));
    col = mix(col, cc, inC);
  }
  vec2 sp = d.xz / max(1. + d.y, 0.3) * 7.5;                                                       // crazing, cells some 8 degrees across
  float pw = max(fwidth(sp.x), fwidth(sp.y));
  float net = 1. - smoothstep(0.004, 0.006 + 1.5 * pw, skyNet(sp));
  col = mix(col, uHoney, 0.15 * net * clamp(0.02 / max(pw, 1e-4), 0., 1.));      // (polish 6) barely there: strangers read the net as a cracked ceiling
  gl_FragColor = vec4(clamp(col, 0., 1.), 1.);
}`;

// ================================================================ makeStyle: everything the world is made from
export function makeStyle(ctx, opts = {}) {
  const hex = opts.palette || PALETTE;
  const C = (i, d) => new THREE.Color(hex[i] || d);
  const palette = {
    cream: C(0, PALETTE[0]), honey: C(1, PALETTE[1]), blue: C(2, PALETTE[2]), tan: C(3, PALETTE[3]),
    olive: C(4, PALETTE[4]), chocolate: C(5, PALETTE[5]), ink: C(6, PALETTE[6]),
    rust: new THREE.Color(opts.rust || '#8A4A2A'), window: new THREE.Color(opts.window || '#FFF8E6'),
  };
  const U = {
    uTime: { value: 0 }, uResY: { value: 720 }, uPale: { value: opts.pale ?? 0.55 },
    uWinDir: { value: new THREE.Vector3(0, 0.6428, 0.766) }, uWinU: { value: new THREE.Vector3(1, 0, 0) },
    uWinV: { value: new THREE.Vector3(0, 0.766, -0.6428) }, uWinSize: { value: new THREE.Vector2(0.16, 0.22) },
    uWinK: { value: 1 }, uWinCol: { value: palette.window }, uCream: { value: palette.cream }, uHoney: { value: palette.honey },
    uBlue: { value: palette.blue }, uTan: { value: palette.tan }, uOlive: { value: palette.olive },
    uChoc: { value: palette.chocolate }, uInk: { value: palette.ink }, uRust: { value: palette.rust },
    uOrange: { value: new THREE.Color(opts.orange || '#C8622B') }, uDark: { value: new THREE.Color(opts.dark || '#43281C') },      // (polish 6) the ware's other slips
    uSkyWarm: { value: 0 },
  };
  const heroWin = { value: 1 };      // the window's strength on the Great Jar's glaze and stains (style.heroWindow)
  // (polish 2) the Jar is a hill: seen from the valley its share of the one window would lie 45 degrees off the gaze, cut by the frame.
  // Its glaze and stains take the window's direction from their own uniforms (style.setHeroWindow), so the highlight lies whole on the band.
  const HW = { uWinDir: { value: new THREE.Vector3(0, 0.6428, 0.766) }, uWinU: { value: new THREE.Vector3(1, 0, 0) }, uWinV: { value: new THREE.Vector3(0, 0.766, -0.6428) } };
  const _v = new THREE.Vector3(), _s = new THREE.Vector2();
  // the window stands in direction dir (world, any length); call once the hero and course are placed
  function setWin(T, dir) {
    const d = T.uWinDir.value.copy(dir).normalize();
    const u = T.uWinU.value.set(d.z, 0, -d.x); if (u.lengthSq() < 1e-6) u.set(1, 0, 0); u.normalize();
    T.uWinV.value.crossVectors(u, d).normalize();
    if (T.uWinV.value.y < 0) { T.uWinV.value.negate(); }
  }
  function setWindow(dir, heroToo = true) { setWin(U, dir); if (heroToo) setWin(HW, dir); }
  function setHeroWindow(dir) { setWin(HW, dir); }
  // glaze({ hero }) : hero = true gives the material its own slip front (uniforms.uWet) instead of the clock
  function glaze(o = {}) {
    // o.floor: [{ x, z, foot }] (at most 32): the floor's own program, with honey pooled round each foot inside a drawn edge
    const fl = o.floor ? { uFlood: { value: new THREE.Vector4(0, 700, 0, 0) }, uShade: { value: new THREE.Vector2(0.8, 0.6) }, uPots: { value: Array.from({ length: 32 }, (_, i) => (o.floor[i] ? new THREE.Vector3(o.floor[i].x, o.floor[i].z, o.floor[i].foot) : new THREE.Vector3(1e6, 1e6, 0))) } } : null;
    return new THREE.ShaderMaterial({
      defines: fl ? { MOCHA_FLOOR: 1 } : {},
      uniforms: { ...U, ...(o.hero ? { uWinK: heroWin, ...HW } : {}), ...(fl || {}), ...(o.uniforms || {}), uLead: { value: o.lead ?? 1 }, uFringe: { value: o.fringe ?? 1 }, uWet: { value: new THREE.Vector4(o.hero ? 1 : 0, 0, 0, 0.5) }, uLap: { value: new THREE.Vector3(o.lap?.[0] ?? 0, o.lap?.[1] ?? 0.5, o.lap?.[2] ?? 0.5) } },
      vertexShader: GLAZE_VS, fragmentShader: GLAZE_FS + GLAZE_FS2, side: o.side ?? THREE.FrontSide,
    });
  }
  // stain({ hero }) : hero = true grows on uniforms.uGrow.x (birth units); otherwise on the clock, per tree
  function stain(o = {}) {
    return new THREE.ShaderMaterial({
      uniforms: { ...U, ...(o.hero ? { uWinK: heroWin, ...HW } : {}), ...(o.uniforms || {}), uFree: { value: o.free ? 1 : 0 }, uGrow: { value: new THREE.Vector4(-1, 0, 0, o.hero ? 1 : 0) }, uRegrow: { value: -1 }, uInkPale: { value: o.inkPale ?? (o.hero ? 0.2 : 0.35) } },
      vertexShader: STAIN_VS, fragmentShader: STAIN_FS, side: THREE.DoubleSide, transparent: true,
      depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -6,
      blending: THREE.CustomBlending, blendEquation: THREE.MinEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor,
    });
  }
  // drop() : unit spheres (plain mesh or InstancedMesh); uniforms.uDrop.x squashes it into a blot on the wall
  function drop(o = {}) {
    return new THREE.ShaderMaterial({
      uniforms: { ...U, uDrop: { value: new THREE.Vector4(0, 1.7, o.hero ? 1 : 0, 0) } },
      vertexShader: DROP_VS, fragmentShader: DROP_FS, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -10,
    });
  }
  // bead() : the material of the small beads; use it on an InstancedMesh of style.beadGeometry() (matrix = scale (sx, sy, sx) + position)
  function bead() {
    return new THREE.ShaderMaterial({ uniforms: { ...U }, vertexShader: BEAD_VS, fragmentShader: BEAD_FS, side: THREE.DoubleSide,
      polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -10 });
  }
  const beadGeometry = () => new THREE.CircleGeometry(1, 32);
  // makeSky(radius) : the cream dome; the world copies the camera's world position into it every frame
  function makeSky(radius = 3500) {
    const m = new THREE.Mesh(new THREE.SphereGeometry(radius, 48, 24), new THREE.ShaderMaterial({
      uniforms: U, vertexShader: SKY_VS, fragmentShader: SKY_FS, side: THREE.BackSide, depthWrite: false, depthTest: false }));
    m.renderOrder = -1; m.frustumCulled = false; return m;
  }
  function update(dt, time, camera) {
    U.uTime.value = time;
    if (ctx.renderer) U.uResY.value = Math.max(64, ctx.renderer.getDrawingBufferSize(_s).y);
  }
  const style = { palette, uniforms: U, heroWindow: heroWin, setWindow, setHeroWindow, glaze, stain, drop, bead, beadGeometry, makeSky, update,
    post: { flat: 1, bloom: { strength: 0 }, grade: { saturation: 1, contrast: 1, vignette: 0, grain: 0 } },
    lathe, strap, thumbPad, growDendrite, ribbons,
    // start phase for a clock tree at angle `ang` on a pot whose aBand.w phase is potPhase: the drop lands
    // two seconds after the slip front has passed, and the next front drowns the tree
    treeStart: (potPhase, ang) => (((potPhase - ang / TAU + 0.92) % 1) + 1) % 1,
  };
  return style;
}

// ================================================================ geometry helpers
// await lathe(spec) -> { geometry, surf(a, y, out, lift), H, R, edgeAt(k, a) }   one pot, or a sector of one (pass yield: ctx.yield).
// spec: profile [[y, r], ...] metres from foot to lip; edges [e0..e4] heights of the slip edges (e0 = foot of the
// chocolate, e1 olive, e2 tan, e3/e4 = foot/top of the blue); a0, a1 radians (0 = +Z, growing toward +X; a full pot is a0 .. a0 + TAU);
// cols, rows [chocolate, olive, tan, blue, cream]; colAt(f) -> f for uneven columns; phase 0..1 (slip front and
// wobble seed); wobble m; step m (0.4); lean [x, z] per metre of height; oval; slump { amp, dir }; refR.
// surf() gives a point on the BLUE band's slip surface (lifted by `lift` m) and its normal: seat dendrites with it.
async function lathe(spec) {
  const prof = spec.profile, H = prof[prof.length - 1][0], NT = 768;
  const tab = new Float32Array(NT + 1);
  for (let i = 0, k = 0; i <= NT; i++) {
    const y = (i / NT) * H;
    while (k < prof.length - 2 && y > prof[k + 1][0]) k++;
    const p0 = prof[Math.max(k - 1, 0)], p1 = prof[k], p2 = prof[k + 1], p3 = prof[Math.min(k + 2, prof.length - 1)];
    const f = clamp((y - p1[0]) / Math.max(p2[0] - p1[0], 1e-6), 0, 1), d = p2[0] - p1[0];
    const m1 = ((p2[1] - p0[1]) / Math.max(p2[0] - p0[0], 1e-6)) * d, m2 = ((p3[1] - p1[1]) / Math.max(p3[0] - p1[0], 1e-6)) * d;
    const f2 = f * f, f3 = f2 * f;
    tab[i] = (2 * f3 - 3 * f2 + 1) * p1[1] + (f3 - 2 * f2 + f) * m1 + (-2 * f3 + 3 * f2) * p2[1] + (f3 - f2) * m2;
  }
  const rAt = (y) => { const x = clamp(y / H, 0, 1) * NT, i = Math.min(Math.floor(x), NT - 1); return tab[i] + (tab[i + 1] - tab[i]) * (x - i); };
  let R = 0; for (let i = 0; i <= NT; i++) R = Math.max(R, tab[i]);
  R = spec.refR || R;
  const e = spec.edges, phase = spec.phase ?? 0, step = spec.step ?? 0.4, wob = spec.wobble ?? R * 0.004;
  const lean = spec.lean || [0, 0], oval = spec.oval ?? 0, sl = spec.slump || { amp: 0, dir: 0 };
  const off = [step, step * 2, step, step * 2, 0];
  const k1 = Math.round(R / 38) + 3, k2 = Math.round(R / 14) + 5, k3 = Math.round(R / 5.5) + 9;
  const edgeAt = (k, a) => {
    if (k <= 0 || k > 4) return k <= 0 ? e[0] : H;
    const lim = 0.3 * Math.min(e[k] - e[k - 1], (k < 4 ? e[k + 1] : H) - e[k]);
    const w = Math.sin(a * k1 + phase * 40 + k * 2.1) + 0.6 * Math.sin(a * k2 + phase * 71 + k * 4.7) + 0.3 * Math.sin(a * k3 + k * 1.3 + phase * 13);
    return e[k] + Math.min(wob, lim) * w * 0.6;
  };
  const point = (a, y, o, out) => {
    let r = rAt(y) + o;
    r *= 1 + oval * Math.cos(2 * a + phase * 9) * Math.sin(Math.PI * clamp(y / H, 0, 1) * 0.9 + 0.2);
    const yy = y - sl.amp * smoothstep(0.72 * H, H, y) * (0.5 + 0.5 * Math.cos(a - sl.dir));
    out[0] = Math.sin(a) * r + lean[0] * y; out[1] = yy; out[2] = Math.cos(a) * r + lean[1] * y;
    return out;
  };
  const P = [0, 0, 0], Pa = [0, 0, 0], Py = [0, 0, 0];
  const frame = (a, y, o, out) => {            // out: [x, y, z, nx, ny, nz]
    point(a, y, o, P); point(a + 0.5 / R, y, o, Pa); point(a, y + 0.5, o, Py);
    const ax = Pa[0] - P[0], ay = Pa[1] - P[1], az = Pa[2] - P[2], bx = Py[0] - P[0], by = Py[1] - P[1], bz = Py[2] - P[2];
    let nx = ay * bz - az * by, ny = az * bx - ax * bz, nz = ax * by - ay * bx;
    const l = Math.hypot(nx, ny, nz) || 1;
    out[0] = P[0]; out[1] = P[1]; out[2] = P[2]; out[3] = nx / l; out[4] = ny / l; out[5] = nz / l;
    return out;
  };
  const rows = spec.rows || [2, 2, 2, 8, 20], cols = spec.cols || 48;
  const rowList = [];
  for (let k = 0; k < 5; k++) for (let i = 0; i <= rows[k]; i++) rowList.push([k, i / rows[k]]);
  const nR = rowList.length, nC = cols + 1, nV = nR * nC;
  const pos = new Float32Array(nV * 3), nor = new Float32Array(nV * 3), band = new Float32Array(nV * 4), srf = new Float32Array(nV * 3);
  const F = [0, 0, 0, 0, 0, 0], a0 = spec.a0 ?? 0, a1 = spec.a1 ?? TAU, colAt = spec.colAt || ((f) => f);
  for (let j = 0; j < nC; j++) {
    const a = a0 + (a1 - a0) * colAt(j / cols);
    for (let i = 0; i < nR; i++) {
      const k = rowList[i][0], f = rowList[i][1];
      const lo = edgeAt(k, a), hi = k < 4 ? edgeAt(k + 1, a) : H;
      const y = lo + (hi - lo) * (k === 4 ? f * (2 - f) * 0.35 + f * 0.65 : f);
      frame(a, y, off[k], F);
      const v = i * nC + j;
      pos.set([F[0], F[1], F[2]], v * 3); nor.set([F[3], F[4], F[5]], v * 3);
      // hollows hold honey: where the wall is concave going up (a neck), and inside the lip
      const cc = (rAt(y + 6) + rAt(y - 6) - 2 * rAt(y)) / 36 * R * 0.6;
      const pool = k === 4 ? clamp(cc, 0, 0.8) + (spec.pool ? spec.pool(a, y) : 0) : 0;
      band.set([k + (y - lo) / Math.max(hi - lo, 1e-3) * 0.9999, (k < 4 ? e[k + 1] : H) - e[k], pool, phase], v * 4);
      srf.set([a, R, y], v * 3);
    }
    if (spec.yield && j % 2 === 1) await spec.yield();   // every 2 columns: 5 ran to 70 ms in one stretch on a busy machine
  }
  if (spec.yield) await spec.yield();
  const idx = new (nV > 65535 ? Uint32Array : Uint16Array)((nR - 1) * cols * 6);
  let q = 0;
  for (let i = 0; i < nR - 1; i++) {
    for (let j = 0; j < cols; j++) {
      const v00 = i * nC + j, v01 = v00 + 1, v10 = v00 + nC, v11 = v10 + 1;
      idx[q++] = v00; idx[q++] = v01; idx[q++] = v11; idx[q++] = v00; idx[q++] = v11; idx[q++] = v10;
    }
    if (spec.yield && i % 12 === 11) await spec.yield();   // the hero's index loop and attributes ran to 53 ms in one stretch
  }
  if (spec.yield) await spec.yield();
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geometry.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  geometry.setAttribute('aBand', new THREE.BufferAttribute(band, 4));
  geometry.setAttribute('aSurf', new THREE.BufferAttribute(srf, 3));
  geometry.setIndex(new THREE.BufferAttribute(idx, 1));
  if (spec.yield) await spec.yield();
  geometry.computeBoundingSphere();
  if (spec.yield) await spec.yield();
  const surf = (a, y, out, lift = 0) => { frame(a, y, off[3] + lift, out); return out; };
  return { geometry, surf, H, R, edgeAt, rAt, phase };
}

// strap(spec) -> geometry : a pulled strap (handle, lug) swept along spec.points (Vector3[]), bare cream body.
// spec: side (Vector3, the direction of the strap's width), width, thick, cross (points round the section, 14),
// phase, pool(f, v) extra honey (f 0..1 along, v -1..1 across); joints and the centre groove pool by themselves.
function strap(spec) {
  const pts = spec.points, n = pts.length, nx = spec.cross || 14, w = spec.width || 9, th = spec.thick || 2.6;
  const nV = n * (nx + 1), pos = new Float32Array(nV * 3), nor = new Float32Array(nV * 3), band = new Float32Array(nV * 4), srf = new Float32Array(nV * 3);
  const T = new THREE.Vector3(), S = new THREE.Vector3(), B = new THREE.Vector3(), N = new THREE.Vector3(), P = new THREE.Vector3();
  let along = 0;
  for (let i = 0; i < n; i++) {
    T.subVectors(pts[Math.min(i + 1, n - 1)], pts[Math.max(i - 1, 0)]).normalize();
    S.copy(spec.side).addScaledVector(T, -spec.side.dot(T)).normalize();
    B.crossVectors(T, S).normalize();
    if (i > 0) along += pts[i].distanceTo(pts[i - 1]);
    const f = i / (n - 1), fl = 1 + 0.55 * Math.pow(Math.abs(2 * f - 1), 6);      // the strap flares where it is pressed on
    for (let j = 0; j <= nx; j++) {
      const a = (j / nx) * TAU, c = Math.cos(a), s = Math.sin(a);
      const x = Math.sign(c) * Math.pow(Math.abs(c), 0.55) * w * 0.5 * fl, z = Math.sign(s) * Math.pow(Math.abs(s), 0.8) * th * 0.5;
      const groove = s > 0 ? -0.22 * th * Math.exp(-((x / (0.16 * w)) ** 2)) : 0;
      P.copy(pts[i]).addScaledVector(S, x).addScaledVector(B, z + groove);
      N.set(0, 0, 0).addScaledVector(S, c * th).addScaledVector(B, s * w).normalize();
      const v = i * (nx + 1) + j;
      pos.set([P.x, P.y, P.z], v * 3); nor.set([N.x, N.y, N.z], v * 3);
      const joint = Math.pow(Math.abs(2 * f - 1), 8) * 0.9;
      const gr = s > 0 ? 0.75 * Math.exp(-((x / (0.1 * w)) ** 2)) : 0;
      band.set([-1, 1, clamp(Math.max(joint, gr) + (spec.pool ? spec.pool(f, x / (w * 0.5)) : 0), 0, 1), spec.phase ?? 0], v * 4);
      srf.set([x + (s > 0 ? 0 : 40), 1, along], v * 3);
    }
  }
  const idx = new Uint16Array((n - 1) * nx * 6); let q = 0;
  for (let i = 0; i < n - 1; i++) for (let j = 0; j < nx; j++) {
    const a = i * (nx + 1) + j, b = a + 1, c = a + nx + 1, d = c + 1;
    idx[q++] = a; idx[q++] = b; idx[q++] = d; idx[q++] = a; idx[q++] = d; idx[q++] = c;
  }
  return packGlaze(pos, nor, band, srf, idx);
}
function packGlaze(pos, nor, band, srf, idx) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  g.setAttribute('aBand', new THREE.BufferAttribute(band, 4)); g.setAttribute('aSurf', new THREE.BufferAttribute(srf, 3));
  g.setIndex(new THREE.BufferAttribute(idx, 1)); g.computeBoundingSphere();
  return g;
}
// thumbPad(centre, normal, up, radius) -> geometry : the thumb-pressed terminal, a shallow dish with the thumbprint
// drawn by the glaze (aBand.x = -2) and honey pooled in it. normal = out of the wall, up = the strap's direction.
function thumbPad(centre, normal, up, radius = 4.5, phase = 0) {
  const nr = 14, na = 40, nV = (nr + 1) * (na + 1);
  const pos = new Float32Array(nV * 3), nor = new Float32Array(nV * 3), band = new Float32Array(nV * 4), srf = new Float32Array(nV * 3);
  const Z = normal.clone().normalize(), Y = up.clone().addScaledVector(Z, -up.dot(Z)).normalize(), X = new THREE.Vector3().crossVectors(Y, Z);
  const hAt = (r) => { const u = r / radius; return 1.5 * (1 - u * u) * (1 - u * u) + 0.55 * Math.exp(-(((u - 0.72) / 0.2) ** 2)) - 1.25 * Math.exp(-((u / 0.5) ** 2)); };
  const P = new THREE.Vector3(), N = new THREE.Vector3();
  for (let i = 0; i <= nr; i++) for (let j = 0; j <= na; j++) {
    const a = (j / na) * TAU, lob = 1 + 0.07 * Math.sin(a * 3 + 1) + 0.05 * Math.sin(a * 5), r = (i / nr) * radius * 1.12;
    const x = Math.cos(a) * r * lob, y = Math.sin(a) * r * lob * 1.12, h = hAt(Math.min(r, radius)) - Math.max(0, r - radius) * 1.4;
    const dh = (hAt(Math.min(r + 0.1, radius)) - h) / 0.1;
    P.copy(centre).addScaledVector(X, x).addScaledVector(Y, y).addScaledVector(Z, h);
    N.copy(Z).addScaledVector(X, -dh * Math.cos(a)).addScaledVector(Y, -dh * Math.sin(a)).normalize();
    const v = i * (na + 1) + j;
    pos.set([P.x, P.y, P.z], v * 3); nor.set([N.x, N.y, N.z], v * 3);
    band.set([-2, 1, clamp(1.15 - r / (radius * 0.8), 0, 1) + 0.5 * smoothstep(0.9, 1.1, r / radius), phase], v * 4);
    srf.set([x, 1, y], v * 3);
  }
  const idx = new Uint16Array(nr * na * 6); let q = 0;
  for (let i = 0; i < nr; i++) for (let j = 0; j < na; j++) {
    const a = i * (na + 1) + j, b = a + 1, c = a + na + 1, d = c + 1;
    idx[q++] = a; idx[q++] = c; idx[q++] = d; idx[q++] = a; idx[q++] = d; idx[q++] = b;
  }
  return packGlaze(pos, nor, band, srf, idx);
}

// growDendrite(rng, spec) -> branches [{ order, n, pts: Float32Array of (x, y, half width, birth) * n, speed }]
// A seeded branching walk in the plane of the band: x = metres along the band, y = height. Trunk first, side limbs
// forking at 25 to 40 degrees, each 0.7 of its parent, down to hair twigs. spec: x, y, len, hw, heading (rad from
// up), orders (5), segs[], kids[], fork [lo, hi], ratio (number or per order), curl[], clear, keep(order) -> chance, bounds { x0, x1, y0, y1 }, speed(order) metres per birth
// unit, start(order, x, y, birthAtFork) -> the child's first birth, budget (max segments), habit, yield, limb(kid, f, j) (aim a child before it grows),
// cell (m; needs bounds): no stain crosses another, a limb that meets one stops dead. Use a forked rng.
async function growDendrite(rng, spec) {
  const orders = spec.orders ?? 5, segs = spec.segs || [30, 14, 9, 6, 4, 3], kids = spec.kids || [11, 8, 5, 3, 2];
  const fork = spec.fork || [0.44, 0.7], rat0 = spec.ratio ?? 0.7, ratio = Array.isArray(rat0) ? rat0 : [rat0, rat0, rat0, rat0, rat0, rat0], keep = spec.keep, bd = spec.bounds, habit = spec.habit || 'upright';
  const speed = spec.speed || (() => 1), budget = spec.budget ?? 1e9, minHw = spec.minHw ?? 0.025;
  const wig = habit === 'fern' ? [0.01, 0.02, 0.03, 0.05, 0.06, 0.06] : [0.022, 0.05, 0.07, 0.09, 0.11, 0.12];
  const trop = [0.05, 0, 0, 0, 0, 0];
  const curl = spec.curl || (habit === 'seaweed' ? [0, 0.05, 0.035, 0.012, 0, 0] : habit === 'fern' ? [0, 0.012, 0, 0, 0, 0] : [0, 0.03, 0.02, 0.008, 0, 0]);
  const out = [], queue = [{ x: spec.x, y: spec.y, h: spec.heading ?? 0, len: spec.len, hw: spec.hw, order: 0, birth: spec.birth ?? 0, side: 0 }];
  // cell > 0: a stain never crosses another; a limb that runs into one stops dead (ancestors excepted)
  const cell = bd ? (spec.cell ?? 0) : 0, gw = cell ? Math.ceil((bd.x1 - bd.x0) / cell) + 1 : 0, gh = cell ? Math.ceil((bd.y1 - bd.y0) / cell) + 1 : 0;
  const grid = cell ? new Int32Array(gw * gh) : null;
  const mark = (x, y, r, id) => {
    const i0 = Math.max(0, Math.floor((x - r - bd.x0) / cell)), i1 = Math.min(gw - 1, Math.floor((x + r - bd.x0) / cell));
    const j0 = Math.max(0, Math.floor((y - r - bd.y0) / cell)), j1 = Math.min(gh - 1, Math.floor((y + r - bd.y0) / cell));
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) if (grid[j * gw + i] === 0) grid[j * gw + i] = id;
  };
  let used = 0, done = 0, nid = 0, qi = 0;
  queue[0].anc = [];
  while (qi < queue.length && used < budget) {
    const b = queue[qi++], o = b.order, id = ++nid, n = Math.max(2, segs[o] | 0), ds = b.len / n, sp = speed(o);
    const pts = new Float32Array((n + 1) * 4), hd = new Float32Array(n + 1);
    let x = b.x, y = b.y, h = b.h, m = 0;
    pts.set([x, y, b.hw, b.birth], 0); hd[0] = h;
    for (let i = 1; i <= n; i++) {
      h += rng.gauss() * (b.wg ?? wig[o]) - h * trop[o] + b.side * (b.cu ?? curl[o]) + (o === 0 ? 0.03 * Math.sin(i * 0.37 + b.x) : 0);
      const nxp = x + Math.sin(h) * ds, nyp = y + Math.cos(h) * ds;
      if (bd && (nxp < bd.x0 || nxp > bd.x1 || nyp < bd.y0 || nyp > bd.y1)) break;
      const f = i / n, hwi = Math.max(minHw, b.hw * (1 - 0.82 * Math.pow(f, 1.15)));
      if (grid) {
        const c = grid[Math.floor((nyp - bd.y0) / cell) * gw + Math.floor((nxp - bd.x0) / cell)];
        if (i > 1 && c !== 0 && c !== id && !b.anc.includes(c)) break;
        const ns = Math.max(1, Math.ceil(ds / cell)), r = Math.max(hwi, cell * 0.6);
        for (let k = 1; k <= ns; k++) mark(lerp(x, nxp, k / ns), lerp(y, nyp, k / ns), r, id);
      }
      x = nxp; y = nyp; m = i;
      pts.set([x, y, hwi, b.birth + (i * ds) / sp], i * 4); hd[i] = h;
    }
    if (m < 1) continue;
    if (m < n) for (let i = 1; i <= m; i++) pts[i * 4 + 2] = Math.max(minHw, b.hw * (1 - 0.82 * Math.pow(i / m, 1.15)));   // stopped short: still ends in a hair
    out.push({ order: o, n: m + 1, pts: pts.subarray(0, (m + 1) * 4), speed: sp });
    used += m;
    if (o < orders) {
      const nk = kids[o];
      for (let j = 0; j < nk; j++) {
        const f0 = o === 0 ? (spec.clear ?? 0.16) : 0.14, f = f0 + (0.97 - f0) * ((j + 0.25 + 0.5 * rng()) / nk);
        const side = (j % 2 ? 1 : -1) * (rng.chance(0.12) ? -1 : 1), ang = rng.range(fork[0], fork[1]), lr = rng.range(0.8, 1.15);
        const fi = f * m, i0 = Math.min(Math.floor(fi), m - 1), ft = fi - i0;
        const cx = lerp(pts[i0 * 4], pts[i0 * 4 + 4], ft), cy = lerp(pts[i0 * 4 + 1], pts[i0 * 4 + 5], ft);
        const chw = Math.max(minHw, lerp(pts[i0 * 4 + 2], pts[i0 * 4 + 6], ft) * 0.7), cb = lerp(pts[i0 * 4 + 3], pts[i0 * 4 + 7], ft);
        const clen = b.len * (0.35 + 0.65 * m / n) * ratio[o] * (1 - 0.62 * f) * lr * (habit === 'seaweed' ? 1.3 : 1);
        if (clen < (spec.minLen ?? 0.8) || (keep && rng() > keep(o + 1))) continue;
        const kid = { x: cx, y: cy, h: hd[i0] + side * ang * (habit === 'seaweed' ? 1.6 : 1), len: clen, hw: chw, order: o + 1, side, anc: grid ? [...b.anc, id] : null,
          birth: spec.start ? spec.start(o + 1, cx, cy, cb) : cb };
        if (spec.limb) spec.limb(kid, f, j);          // the caller may aim a limb: it may change h, len, side, cu (its own curl), wg (its own wiggle)
        queue.push(kid);
      }
    }
    if (spec.yield && (++done % 50) === 0) await spec.yield();   // every 50 branches: 150 ran to 34 ms on a busy machine
  }
  return out;
}

// ribbons(branches, surf, opts) -> geometry for style.stain(): flat ribbons lying in the surface.
// A branch { blot: R, n: 2, pts: [x, y - 1.4 R, 0, 0, x, y + 1.4 R, 0, 0], speed: 1 } is drawn as a round blot of radius R at (x, y).
// surf(x, y, out) writes [px, py, pz, nx, ny, nz] for band coordinates (x, y). opts: start (tree start phase 0..1,
// see style.treeStart), rate (birth units per second on the clock), yield. Several trees: merge the geometries.
async function ribbons(branches, surf, opts = {}) {
  let nP = 0, nS = 0;
  for (const b of branches) { nP += b.n; nS += b.n - 1; }
  const pos = new Float32Array(nP * 6), nor = new Float32Array(nP * 6), lat = new Float32Array(nP * 6), rib = new Float32Array(nP * 8), grow = new Float32Array(nP * 6), lag = new Float32Array(nP * 2);
  const idx = new (nP * 2 > 65535 ? Uint32Array : Uint16Array)(nS * 6);
  const F = new Float64Array(6), buf = new Float64Array(6 * 64);
  let v = 0, q = 0, cnt = 0;
  const start = opts.start ?? 0, rate = opts.rate ?? 1;
  for (const b of branches) {
    const n = b.n, p = b.pts, tip = p[(n - 1) * 4 + 3];
    let fb = n <= 64 ? buf : new Float64Array(n * 6);
    for (let i = 0; i < n; i++) { surf(p[i * 4], p[i * 4 + 1], F); fb.set(F, i * 6); }
    for (let i = 0; i < n; i++) {
      const i0 = Math.max(i - 1, 0) * 6, i1 = Math.min(i + 1, n - 1) * 6, c = i * 6, lg = opts.lag ? opts.lag(p[i * 4]) : 0;
      const tx = fb[i1] - fb[i0], ty = fb[i1 + 1] - fb[i0 + 1], tz = fb[i1 + 2] - fb[i0 + 2];
      const nx = fb[c + 3], ny = fb[c + 4], nz = fb[c + 5];
      let lx = ny * tz - nz * ty, ly = nz * tx - nx * tz, lz = nx * ty - ny * tx;
      const l = Math.hypot(lx, ly, lz) || 1; lx /= l; ly /= l; lz /= l;
      for (let s = -1; s <= 1; s += 2) {
        pos[v * 3] = fb[c]; pos[v * 3 + 1] = fb[c + 1]; pos[v * 3 + 2] = fb[c + 2];
        nor[v * 3] = nx; nor[v * 3 + 1] = ny; nor[v * 3 + 2] = nz;
        lat[v * 3] = lx; lat[v * 3 + 1] = ly; lat[v * 3 + 2] = lz;
        rib[v * 4] = p[i * 4 + 3]; rib[v * 4 + 1] = p[i * 4 + 2]; rib[v * 4 + 2] = s; rib[v * 4 + 3] = tip;
        if (b.blot) { rib[v * 4] = i === 0 ? -1 : 1; rib[v * 4 + 1] = -b.blot; }   // a blot: two points 1.4 radii below and above its centre
        grow[v * 3] = b.speed; grow[v * 3 + 1] = start; grow[v * 3 + 2] = rate; lag[v] = lg;
        v++;
      }
      if (i > 0) { const a = v - 4; idx[q++] = a; idx[q++] = a + 1; idx[q++] = a + 3; idx[q++] = a; idx[q++] = a + 3; idx[q++] = a + 2; }
    }
    if (opts.yield && (++cnt % 200) === 0) await opts.yield();
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  g.setAttribute('aLat', new THREE.BufferAttribute(lat, 3)); g.setAttribute('aRib', new THREE.BufferAttribute(rib, 4));
  g.setAttribute('aGrow', new THREE.BufferAttribute(grow, 3)); g.setAttribute('aLag', new THREE.BufferAttribute(lag, 1));
  g.setIndex(new THREE.BufferAttribute(idx, 1));
  return g;
}

// ================================================================ the hero: the Great Jar and its one tree
export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng, detail = opts.detail ?? ctx.quality?.detail ?? 1;
  const ownStyle = !opts.style, style = opts.style || makeStyle(ctx, { palette: opts.palette });
  const T = { wet: 0.24, fall: 0.37, strike: 0.53, trunk: 0.59, limbs: 0.72, end: 0.985, ...(opts.timing || {}) };
  const object = new THREE.Group();
  // per-seed habit of the pot and the tree (all draws up front, in a fixed order)
  const seedV = { phase: rng(), lean: [rng.range(-0.012, 0.012), rng.range(-0.006, 0.006)], oval: rng.range(0.004, 0.012),
    slumpDir: rng.range(-0.9, 0.9), slumpAmp: rng.range(14, 34), belly: rng.range(-6, 6), neck: rng.range(-25, 25), lip: rng.range(-18, 22) };
  const treeRng = rng.fork('tree'), runRng = rng.fork('runner');
  await ctx.yield();

  // ---- the Jar: 900 m tall, widest at the foot of its blue band so a falling drop meets the wall there
  const R = 700, H = 900, Y0 = 40, Y1 = 260;
  const jar = await lathe({ yield: ctx.yield,
    profile: [[0, 680], [20, 695], [46, 700], [150, 693 + seedV.belly], [260, 672 + seedV.belly], [400, 612], [560, 500],
      [700, 385 + seedV.neck], [780, 340 + seedV.neck], [840, 345 + seedV.neck * 0.7], [880, 372 + seedV.lip], [900, 392 + seedV.lip]],
    edges: [0, 14, 27, Y0, Y1], a0: -Math.PI, a1: Math.PI, cols: Math.round(216 * (0.7 + 0.3 * detail)), rows: [2, 2, 3, 18, 22],
    colAt: (f) => { const s = 2 * f - 1; return 0.5 + 0.5 * (0.4 * s + 0.6 * s * s * s); },      // columns crowd toward the tree's side
    phase: seedV.phase, refR: R, lean: seedV.lean, oval: seedV.oval, slump: { amp: seedV.slumpAmp, dir: seedV.slumpDir },
  });
  const jarMat = style.glaze({ hero: true });
  const jarMesh = new THREE.Mesh(jar.geometry, jarMat); object.add(jarMesh);
  await ctx.yield();
  const F = new Float64Array(6);
  // a point `off` metres out from the wall at band coordinates (x metres along the band from the trunk, y height)
  const wallPoint = (x, y, off = 0, out = new THREE.Vector3()) => { jar.surf(x / R, y, F, 0); return out.set(F[0] + F[3] * off, F[1] + F[4] * off, F[2] + F[5] * off); };
  const wallNormal = (x, y, out = new THREE.Vector3()) => { jar.surf(x / R, y, F, 0); return out.set(F[3], F[4], F[5]); };
  const surfXY = (x, y, out) => jar.surf(x / R, y, out, 0.12);

  // ---- the lug: a strap loop standing off the band, 190 m along from the trunk, with two thumb-pressed terminals
  // (polish 3) opts.lugScale: the whole lug larger (the loop, its strap, its pads, the portal's seat); opts.lugDir -1: its hole is
  // flown the other way along the band; opts.lugYaw: the hole's axis turned in toward the wall by that angle, so the loop faces a
  // course that comes in from the valley; opts.lugPitch: how steeply that course climbs (24 degrees by default)
  const LX = opts.lugX ?? 190, LY = opts.lugY ?? 228, LS = opts.lugScale ?? 1, OFF = 12 * LS, ldir = opts.lugDir ?? 1, yaw = opts.lugYaw ?? 0;
  const cl = Math.cos(opts.lugPitch ?? 0.4189) * ldir, sl = Math.sin(opts.lugPitch ?? 0.4189);
  const C = wallPoint(LX, LY, OFF), nW = wallNormal(LX, LY);
  const dC = wallPoint(LX + cl, LY + sl, OFF).sub(wallPoint(LX - cl, LY - sl, OFF)).normalize();   // the course: up along the wall
  if (yaw) { const y0 = new THREE.Vector3(0, 1, 0), d1 = dC.clone().applyAxisAngle(y0, yaw), d2 = dC.clone().applyAxisAngle(y0, -yaw); dC.copy(d1.dot(nW) < d2.dot(nW) ? d1 : d2); }
  const nC = nW.clone().addScaledVector(dC, -nW.dot(dC)).normalize();        // out from the wall, square to the hole's axis
  const qC = new THREE.Vector3().crossVectors(nC, dC).normalize();
  const nFoot = -(OFF / Math.max(nC.dot(nW), 0.3) + 1.6 * LS);               // where the strap's feet go into the wall
  const cp = [[-14.8 * LS, nFoot], [-13.8 * LS, nFoot * 0.6], [-11.6 * LS, nFoot * 0.22]];
  const ctl = cp.map(([q, n]) => C.clone().addScaledVector(qC, q).addScaledVector(nC, n));
  for (let i = 0; i <= 10; i++) { const ph = (-80 + i * 16) * Math.PI / 180; ctl.push(C.clone().addScaledVector(qC, 10.6 * LS * Math.sin(ph)).addScaledVector(nC, 10.6 * LS * Math.cos(ph))); }
  for (let i = 2; i >= 0; i--) ctl.push(C.clone().addScaledVector(qC, -cp[i][0]).addScaledVector(nC, cp[i][1]));
  const lugPts = new THREE.CatmullRomCurve3(ctl, false, 'centripetal').getSpacedPoints(56);
  // the two thumb-pressed terminals, where the feet meet the band (band coordinates); padLo is the lower one: the runner ends at it
  const padAt = (q) => { const f = C.clone().addScaledVector(qC, q).addScaledVector(nC, nFoot + 1.6 * LS); return { x: Math.atan2(f.x, f.z) * R, y: f.y }; };
  let padLo = padAt(-18 * LS), padHi = padAt(18 * LS), upLo = qC;
  if (padLo.y > padHi.y) { const t = padLo; padLo = padHi; padHi = t; upLo = qC.clone().negate(); }
  await ctx.yield();
  const lugStrap = strap({ points: lugPts, side: dC, width: 8 * Math.pow(LS, 0.8), thick: 3.4 * Math.pow(LS, 0.8), phase: seedV.phase });
  await ctx.yield();
  const lugPads = [thumbPad(wallPoint(padLo.x, padLo.y, 0.15 + 0.5 * (LS - 1)), wallNormal(padLo.x, padLo.y), upLo, 4.6 * LS, seedV.phase),
    thumbPad(wallPoint(padHi.x, padHi.y, 0.15 + 0.5 * (LS - 1)), wallNormal(padHi.x, padHi.y), upLo.clone().negate(), 4.2 * LS, seedV.phase)];
  await ctx.yield();
  const lugGeo = mergeGeometries([lugStrap, ...lugPads]);
  const lugMesh = new THREE.Mesh(lugGeo, style.glaze({ side: THREE.DoubleSide })); object.add(lugMesh);
  await ctx.yield();

  // ---- the one tree: birth is in seconds after the strike (trunk 3 s, limbs 7 more, twigs keyed to our passing)
  const rootY = Y0 + 14, G_END = 22, speeds = [67, 42, 27, 15, 15, 15];
  const habit = opts.habit || 'upright', twigs = (opts.twigs ?? 0.55) * detail * detail;
  const arrive = (x) => clamp(10 + ((Math.abs(x) - 53) / 137) * 12, 5.5, 20.5);
  const branches = await growDendrite(treeRng, {
    x: 0, y: rootY, len: 196, hw: opts.trunkHw ?? 4.5, heading: treeRng.range(-0.1, 0.1), orders: opts.orders ?? 5, habit, clear: treeRng.range(0.13, 0.22),
    segs: [46, 20, 13, 8, 5, 3], kids: [treeRng.int(12, 15), 10, 7, 5, 3], cell: 0.9, ratio: [treeRng.range(0.78, 0.9), 0.7, 0.7, 0.7, 0.7, 0.7], fork: [0.44, 0.7],
    curl: habit === 'upright' ? [0, treeRng.range(0.02, 0.036), 0.02, 0.008, 0, 0] : undefined,
    keep: (o) => (o >= 5 ? twigs : o === 4 ? (opts.fine ?? 1) : 1),      // opts.fine: the share of the finest limbs kept (a tree only ever seen from far needs fewer)
    bounds: { x0: -150, x1: 180, y0: Y0 + 8, y1: 241 }, budget: 30000, yield: ctx.yield,
    speed: (o) => speeds[o],
    start: (o, x, y, cb) => (o === 3 ? Math.max(cb, arrive(x) - 3.2 + 1.6 * treeRng()) : cb),
    // whatever the habit, the limbs on the lug's side of the lower trunk are aimed along the climb (a fan of long arcs that
    // crosses the corridor the camera flies, x 53 to 180), so the crown is on the wall beside us all the way to the lug
    limb: (k, f, j) => {
      if (opts.aim === false || k.order !== 1 || k.side < 0 || f > 0.74) return;      // (polish 3) opts.aim false: a crown of its own, no limbs laid along a climb
      const tx = 178 - 62 * (f / 0.74), ty = LY - 70 + (tx - 53) * 0.51 + ((j % 3) - 1) * 9;
      k.h = Math.atan2(tx - k.x, ty - k.y) - 0.16; k.len = Math.max(k.len, Math.hypot(tx - k.x, ty - k.y) * 1.2);
      k.cu = 0.016 * 196 / k.len * (habit === 'seaweed' ? 1.5 : 1); k.wg = habit === 'fern' ? 0.03 : 0.05;
      k.hw = Math.min(k.hw, 0.95);                             // long and lean: a line across the wall, not a second trunk
    },
  });
  await ctx.yield();
  // feathering beside the climb: within about 30 m of the camera's line every limb carries hair twigs a couple of metres
  // apart (5 to 7 cm wide, a wet bead on each), born as the limb passes or as we come abreast, so nothing near the lens is a bare spike
  const fr = treeRng.fork('feather'), every = 3.0 / (0.6 + 0.4 * detail);   // (a fork of the tree's own rng: no draw from ctx.rng, so the rest of the world is as it was)
  const feather = async (from) => {
    const n0 = branches.length;
    for (let bi = from; bi < n0; bi++) {
      const b = branches[bi], p = b.pts;
      if (b.order > 3) continue;
      let acc = fr.range(0, every), side = fr.sign();
      for (let i = 1; i < b.n; i++) {
        const x0 = p[i * 4 - 4], y0 = p[i * 4 - 3], x1 = p[i * 4], y1 = p[i * 4 + 1], ds = Math.hypot(x1 - x0, y1 - y0);
        if (x1 < 62 || Math.abs(y1 - (LY - 70 + (x1 - 53) * 0.51)) > 32) { continue; }
        acc += ds;
        while (acc >= every) {
          acc -= every;
          const f = clamp(1 - acc / Math.max(ds, 1e-3), 0, 1), x = lerp(x0, x1, f), y = lerp(y0, y1, f), hwP = lerp(p[i * 4 - 2], p[i * 4 + 2], f);
          const len = fr.range(1.5, 4.2) * (0.8 + 0.5 * Math.min(hwP, 1)), h = Math.atan2(x1 - x0, y1 - y0) + side * fr.range(0.45, 0.95), bend = fr.range(-0.25, 0.25);
          const born = Math.max(lerp(p[i * 4 - 1], p[i * 4 + 3], f), arrive(x) - 2.6 + 1.4 * fr()), w0 = clamp(hwP * 0.3, 0.03, 0.07), t = new Float32Array(16);
          side = -side;
          let tx = x + Math.sin(h) * hwP * 0.6, ty = y + Math.cos(h) * hwP * 0.6;
          let fx = 0, fy = 0;
          for (let k = 0; k < 4; k++) {
            t.set([tx, ty, w0 * (1 - 0.2 * k), born + (k * len / 3) / 15], k * 4);
            if (k === 1) { fx = tx; fy = ty; }
            const hk = h + bend * (k + 1) / 3; tx += Math.sin(hk) * len / 3; ty += Math.cos(hk) * len / 3;
          }
          if (!(ty < 238 && ty > Y0 + 8 && tx < padLo.x - 6)) continue;
          branches.push({ order: 5, n: 4, pts: t, speed: 15 });
          if (len > 3.2) {                                  // the longer ones fork once
            const h2 = h + bend / 3 - side * fr.range(0.5, 0.8), l2 = len * fr.range(0.35, 0.55), t2 = new Float32Array(12);
            for (let k = 0; k < 3; k++) t2.set([fx + Math.sin(h2) * l2 * k / 2, fy + Math.cos(h2) * l2 * k / 2, w0 * 0.75, born + (len / 3 + l2 * k / 2) / 15], k * 4);
            branches.push({ order: 5, n: 3, pts: t2, speed: 15 });
          }
        }
      }
      if ((bi % 400) === 399) await ctx.yield();
    }
  };
  if (opts.feather !== false) await feather(0);
  const nTree = branches.length;
  await ctx.yield();
  // the runner: the one limb that goes on to the lug and stops at the edge of the thumbprint
  const tgt = { x: padLo.x - 4.7 * LS, y: padLo.y - 1.7 * LS };
  let best = null, bd = 1e9;
  for (const b of branches) {
    if (b.order < 1 || b.order > 2) continue;
    for (let i = 1; i < b.n; i++) {
      const x = b.pts[i * 4], y = b.pts[i * 4 + 1], d = Math.hypot(tgt.x - x, tgt.y - y);
      if (x < tgt.x - 55 && y < tgt.y + 60 && y > tgt.y - 70 && d < bd) { bd = d; best = { x, y, hw: b.pts[i * 4 + 2], birth: b.pts[i * 4 + 3] }; }
    }
  }
  if (!best) { best = { x: Math.min(100, tgt.x - 60), y: Math.min(170, tgt.y + 40), hw: 0.5, birth: 8 }; bd = Math.hypot(tgt.x - best.x, tgt.y - best.y); }
  {
    const n = Math.max(12, Math.ceil(bd / 2.4)), pts = new Float32Array((n + 1) * 4);
    const G_RUN = G_END - 1.2;                         // it reaches the pad a second or so before we reach the loop
    const b0 = Math.max(best.birth, G_RUN - bd / 15), w0 = clamp(best.hw * 0.9, 0.7, 1.1);
    const px = -(tgt.y - best.y) / bd, py = (tgt.x - best.x) / bd, k1 = runRng.range(0.5, 1.4), k2 = runRng.range(0, 6), amp = bd * 0.07 * runRng.sign();
    for (let i = 0; i <= n; i++) {
      const f = i / n, wv = Math.sin(f * Math.PI) * (amp * Math.sin(f * Math.PI * k1 + 0.4) + 1.6 * Math.sin(f * 9 + k2));
      pts.set([lerp(best.x, tgt.x, f) + px * wv, lerp(best.y, tgt.y, f) + py * wv, lerp(w0, 0.1, Math.pow(f, 1.3)), lerp(b0, G_RUN, f)], i * 4);
    }
    const sp = bd / Math.max(G_RUN - b0, 0.5);
    branches.push({ order: 3, n: n + 1, pts, speed: sp });
    for (let j = 1; j < 9; j++) {                       // its own twigs, so it is a limb and not a wire
      const i = Math.floor((j / 9) * n), side = j % 2 ? 1 : -1;
      const tw = await growDendrite(runRng, { x: pts[i * 4], y: pts[i * 4 + 1], len: runRng.range(14, 28) * (1 - 0.5 * j / 9), hw: pts[i * 4 + 2] * 0.6,
        heading: Math.atan2(tgt.x - best.x, tgt.y - best.y) + side * runRng.range(0.5, 0.8), orders: 1, segs: [6, 3], kids: [3], birth: pts[i * 4 + 3], speed: () => 15,
        bounds: { x0: -136, x1: padLo.x - 6, y0: Y0 + 6, y1: 240 } });
      for (const t of tw) branches.push(t);
    }
  }
  if (opts.feather !== false) await feather(nTree);                                 // the runner and its twigs are feathered too
  await ctx.yield();
  const treeGeo = await ribbons(branches, surfXY, { yield: ctx.yield });
  treeGeo.boundingSphere = new THREE.Sphere(wallPoint(30, 140, 0), 260);
  const treeMat = style.stain({ hero: true });
  const tree = new THREE.Mesh(treeGeo, treeMat); tree.renderOrder = 3; object.add(tree);
  await ctx.yield();

  // ---- the great drop: 12 m across, falls down the middle of the picture, flattens into the blot at the root
  const strike = wallPoint(0, rootY, 0), nS = wallNormal(0, rootY);
  const dropMat = style.drop({ hero: true });
  const drop = new THREE.Mesh(new THREE.SphereGeometry(1, 64, 22).rotateX(Math.PI / 2), dropMat);   // poles on the wall normal, so the blot's rim is one smooth ring
  drop.scale.setScalar(opts.dropRadius ?? 6); drop.renderOrder = 2;
  drop.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), nS);
  object.add(drop);
  const fallH = opts.fallHeight ?? 180, dropR = opts.dropRadius ?? 6;

  // ---- anchors (local space)
  const fly = [[-30, 165, 150], [-14, 165, 82], [0, 165, 62], [30, 165, 38], [53, 165, 26], [85, 180.5, 14], [126, 199.5, 12], [LX, LY, OFF]];
  const anchors = {
    strike: strike.clone(), strikeNormal: nS.clone(),                     // where the great drop lands; poi for u 0.3-0.62
    dropStart: strike.clone().addScaledVector(nS, dropR * 0.9).add(new THREE.Vector3(0, fallH, 0)),
    trunkMid: wallPoint(0, 140, 0), crown: wallPoint(70, 200, 0), treeTop: wallPoint(0, 240, 0),
    portalSeat: { position: C.clone(), direction: dC.clone(), normal: nC.clone(), wall: nW.clone(), up: qC.clone(), radius: 7 * LS },   // centre of the lug's loop; fly along `direction`
    flyThrough: fly.map(([x, y, o]) => wallPoint(x, y, o)),               // pass at 60 m, close, then the climb 12 m off; last two points are the straight 70 m
    thumbprint: wallPoint(padLo.x, padLo.y, 0.5), runnerEnd: wallPoint(tgt.x, tgt.y, 0.2),
    viewpoints: { framed: wallPoint(-30, 165, 330), pass: wallPoint(0, 165, 62), climb: wallPoint(110, 192, 12) },
    windowDir: new THREE.Vector3(0, 0.6428, 0.766),                       // local direction to the window (90 degrees right of the climb, 40 up)
    timing: T, wallPoint,
  };

  // ---- progress: everything about the great drop and its tree hangs on u (setProgress), never on the clock
  let prog = -1;
  // the blot is a pool three trunk widths across: its centre sits a little above the root so its rim stays on the blue
  const up = new THREE.Vector3(0, 1, 0), contact = strike.clone().addScaledVector(nS, dropR * 0.9), rest = wallPoint(0, rootY + dropR * 0.75, 0.3);
  const seg = (p, a, b) => clamp((p - a) / Math.max(b - a, 1e-4), 0, 1);
  const footK = 1.12 * (opts.trunkHw ?? 4.5) / dropR, restLow = wallPoint(0, rootY + 1.5, 0.3);
  // The slip front on the Jar, in metres along the band (the trunk is 0, the lug +190): it comes round fast, then crosses the
  // picture slowly while the great drop falls (the old frieze still standing ahead of it, bare wet slip behind), and once
  // the drop has struck it runs on ahead of the limbs, past the lug and away.
  const FK = opts.front || [[T.wet, -385], [T.wet + 0.03, -94], [T.wet + 0.07, 20], [T.wet + 0.12, 100], [T.strike - 0.04, 165], [T.strike, 205], [T.strike + 0.06, 350], [T.strike + 0.16, 735]];
  const frontAt = (p) => {
    if (p <= FK[0][0]) return FK[0][1];
    for (let i = 1; i < FK.length; i++) if (p < FK[i][0]) return lerp(FK[i - 1][1], FK[i][1], (p - FK[i - 1][0]) / Math.max(FK[i][0] - FK[i - 1][0], 1e-4));
    return FK[FK.length - 1][1];
  };
  function apply(p) {
    const G = p < T.strike ? -1 : p < T.trunk ? 3 * seg(p, T.strike, T.trunk) : p < T.limbs ? 3 + 7 * seg(p, T.trunk, T.limbs) : 10 + 12 * seg(p, T.limbs, T.end);
    const wetness = 1 - 0.25 * smoothstep(T.limbs, 1, p);
    treeMat.uniforms.uGrow.value.set(G, 0, wetness, 1);
    jarMat.uniforms.uWet.value.set(1, frontAt(p) / R, wetness, 0.3 + 0.7 * p);
    const f = seg(p, T.fall, T.strike), sq = smoothstep(T.strike, T.strike + 0.012, p);
    drop.visible = p >= T.fall;
    // (polish 2) the blot is drawn up into the trunk as it rises: by the time the trunk is up it is the swell of its foot, not a stain beside it
    const kB = smoothstep(T.strike + 0.012, T.trunk + 0.025, p);
    drop.position.copy(contact).addScaledVector(up, fallH * (1 - f)).lerp(rest, sq).lerp(restLow, kB);
    dropMat.uniforms.uDrop.value.set(sq, lerp(opts.blot ?? 0.8, footK, kB), 1, opts.dropTail ?? 0);
  }
  apply(0);
  return {
    object, radius: 480, height: 260, center: new THREE.Vector3(0, 130, 0), anchors, style,
    jar: { radius: R, height: H, bandFoot: Y0, bandTop: Y1 }, wallPoint, wallNormal, frontAt,
    setProgress(u) { prog = clamp(u, 0, 1); },
    update(dt, time, camera) {
      if (ownStyle) style.update(dt, time, camera);
      apply(prog >= 0 ? prog : 0.22 + 0.78 * (((time + 14) / 34) % 1));     // until setProgress is called the piece loops by itself (the viewer)
    },
    dispose() {},
    ground: true, groundY: 0,
  };
}
