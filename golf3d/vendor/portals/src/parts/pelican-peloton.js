// pelican-peloton: THE LOOK KIT of the pelican peloton, and buildHero (the leader alone, for the part viewer).
// Everything in this world is drawn the way a program draws: every shape ONE exact flat colour inside ONE even dark
// line, no light, no shade, no texture; true solids that read as a vector drawing from every side (a ball is a
// circle, an ellipsoid an ellipse, a cone a triangle, a box a rectangle, a tube a stroked path).
//
// HOW THE LINE IS MADE: each filled solid carries, in the SAME geometry, a copy of itself with reversed winding (its
// hull); the vertex shader pushes the hull out along the normal, in world space. One FrontSide material, one draw.
// THE ONE LINE (build plan 2.4): a hull's width W is in metres (aK.x: PP.LINE_RIDER on riders and birds; on scenery
// PP.LINE_SHARE of the shape's own size, at most PP.LINE_MAX) and is HELD between uLine.x and uLine.y POINTS on the
// picture (a point: 1/450 of the picture's height, never less than PT_MIN, 0.68, of a pixel: on a frame under 306 lines
// the line's floor is a pixel and a half), so near and far shapes wear one weight.
// Where the held line is fat beside the thing it is drawn round, its colour goes over evenly to the shape's own fill
// (full ink at W / held = uInkMix.x, none at uInkMix.y) and the hull draws in with it to three quarters of a pixel,
// so a small far thing is a clean flat shape and never a blot. Strokes (tyres, spokes, chain, bars of the hopeless)
// are tubes whose own skin follows the same law: thinned near with the line, never under a pixel and a half wide.
// A DETAIL stroke (a digit, a scallop, the chain, a speed stroke: aK.w under 1) is the one exception: where it would be
// held fatter than its mark can carry (its true width under aK.w of the drawn one) it is drawn in to nothing, so a
// far bib is a clean card and not a blot of ink.
// A TYRE (a ring's stroke laid with far: true; aK.w 2) goes over to the rim's pale colour uRim, and draws in to six
// tenths of its held width, by the same share as the line goes over to the fill: a far wheel is a pale ring, never a
// dark disc.
// All of it reads the pixel's footprint only (a filter); nothing is placed, sized, hidden or timed by the lens.
//
// VERTEX DATA (one layout for every mesh of the world):
//   position, normal (a box corner carries the sum of its faces; a cone's tip a normal along its axis)
//   aCol  vec3  the flat colour, linear; all three corners of a triangle carry ONE colour. A hull keeps its shape's colour
//   aK    vec4  x: the line (0 a fill; > 0 a hull vertex, W in metres; < 0 a stroke's skin, minus its radius)
//               y: the part (what moves it, below)   z: 1 where the row's tint replaces the colour   w: a corner's mitre
//               (on a stroke: 1 a stroke that stays; 2 a tyre; under 1 a detail stroke, the share at which it is drawn in)
//   aRig  vec4  what the part needs (pivots, phases), below
//   iA, iB vec4 the row: instanced, or (the merged one-off riders) plain per-vertex attributes. The pack's rows are
//               iA = (lane n, offset o, own number 0..1, size over life), iB = (tint r, g, b, glitch id)
// PARTS (aK.y) the kit itself moves, by the globals a holder's vertexPre sets in ppBegin() (gTrav metres ridden, gCrank
// the cranks' angle, gSpin, gStand, gTurn, gSize, gPx):
//   0 still | 1 wheel (hub y, hub z, radius, turns; |turns| 2: a spoke, drawn in to the hub as the wheel grows small)
//   2 crank set (centre y, z, phase, turns) | 3 pedal kept level (centre y, z, phase, arm)
//   4 thigh, 5 shin, 6 foot (x of the leg, phase, ankle above the pedal, index of the rig) in bone space; an ankle
//     height under 0 is a foot that slips off its pedal's front once a turn (generation two's)
//   7 pouch (weight, pivot y, pivot z, nod) | 8 a streaming cloth (metres from the knot, reach, -, -)
//   9 a hovering thing (rise, beats per metre, phase, side drift) | 10 the bird's trunk (-, -, -, 1 where pinned to the bars)
//   11 head, bill and hat (pivot y, pivot z, nod, its share of the turn: 0 the whole) | 12 speed strokes (phase, reach, -, -) | 13 the drifter's bird
//   14 a guest's own moving part (holder's) | 15 a part that stands with the rider on the climb
//   16 the leader's head (as 11) | 17 a fish's tail (pivot y, pivot z, swing, phase)
//   heads, hats and pouches (7, 11, 16) are turned about the neck by gTurn, whoever sets it
//   20 and over: never touched here (a holder's own, moved in its vertexMove)
//   a part number 32 over its own is the same part of a LOOSE body: gLoose is 1 for it (the holder's law carries it)
// A leg's rig may say back: true (the bird sits facing astern): its knee then bends the other way.
// A RIDER'S FRAME: origin on the road under the cranks, +Z the way it rides, +Y up, +X to port; in metres at PP.SCALE
// (2.5) times life, the row's size over PP.SCALE scaling it in the shader. The drive side (chainring, chain, cog) is
// at -X: seen from starboard the rider faces right, as in every such drawing, and shows its chain.
import * as THREE from 'three';
import { PP } from './pelican-peloton-plan.js';
import { leaderGeometry, packMesh } from './pelican-peloton-riders.js';   // for buildHero only (used inside calls: the cycle is safe)

// THE TWO LOOKS: the design's paletteMore by name (hex as typed there). Both are daylight in the same primaries.
// The bicycles are red, teal (#1FB5A8, a green teal, never a sky blue) or yellow in both looks. Names after `beam`
// are the brown pelican's five and the riders' own small things (one flat colour each, the same in both looks).
const DAY = {
  ink: '#1B1F3B', sky: '#8FD0FF', skyLowBand: '#BFE6FF', sun: '#FFD23F', halo: '#FFF1B0', sea: '#2F7FD8', seaFar: '#4F9BE6',
  stroke: '#FFFFFF', surf: '#FFFFFF', beach: '#F7E7B5', cliff: '#E9C98B', cliffShade: '#D2A865', wall: '#E3E0D6',
  wallShade: '#C4C0B4', verge: '#F2DFA6', road: '#8C929B', dash: '#FFFFFF', shadow: '#5A6478', land: '#6CC466',
  hillNear: '#57B85A', hillMid: '#7FCB6B', hillFar: '#9AD68A', fieldStripe: '#8ED36B', headlandFar: '#A8D8C8',
  treeHead: '#3FA34D', treeCone: '#2F8F57', treeStick: '#8A5A2B', pelican: '#FFFFFF', pelicanShade: '#DCE3EC',
  wingTip: '#2B2B33', bill: '#FFA630', pouch: '#FFC83D', pouchShade: '#F08A1C', legs: '#FF8A1E', bikeRed: '#E8362E',
  bikeTeal: '#1FB5A8', bikeYellow: '#F5C518', tyre: '#1B1F3B', rim: '#C9CED6', greyBlob: '#9AA1AA',
  sail: '#E8362E', lighthouseWhite: '#FFFFFF', lighthouseRed: '#E8362E', beam: '#FFF1B0',
  brownBack: '#8A7F78', brownHead: '#FFFFFF', brownNape: '#7A3B2E', brownCrown: '#E9D27A', brownPouch: '#C7483A',
  saddle: '#8A5630', straw: '#ECC77A', fish: '#5AA9E6', crownWash: '#FFF3B8', eyeRing: '#FFE9A8', hat: '#1B1F3B',
  hatBand: '#F5C518', cap: '#2F6FD6', scarf: '#E8362E',
};
export const LOOKS = {
  day: DAY,
  morning: { ...DAY, sky: '#BDE6FF', skyLowBand: '#DDF2FF', sun: '#FFE066', halo: '#FFF6C9', sea: '#2A8FD0', seaFar: '#58AEE2',
    beach: '#FAEEC8', cliff: '#EBD09A', cliffShade: '#D6B274', road: '#949AA3', land: '#79CC72', hillNear: '#62BE64',
    hillMid: '#8BD278', hillFar: '#A6DC98', headlandFar: '#B4DDD2', shadow: '#647089' },
};
const _col = new THREE.Color();
const C = (hex) => { _col.set(hex); return [_col.r, _col.g, _col.b]; };   // a hex as the linear rgb the shaders write
const INK = C(DAY.ink), INK_W = PP.LINE_RIDER;
export const lineOf = (size) => Math.min(PP.LINE_MAX, PP.LINE_SHARE * size);   // a scenery shape's W from its own size (a tree 0.14, a hill 0.6 to 0.8)

// makeLook(key) -> { key, hex, col(name) -> [r, g, b] linear, U, setRoad(road) }. U: the uniforms every material of the
// world shares BY REFERENCE (build plan 2.3). The world sets, each frame: uTime, uD (metres flown, 0 while seen through
// a portal), uResY (the drawing buffer's height) and uCamP; once in build: uSunDir, and the road by setRoad(road).
export function makeLook(key = 'day') {
  const hex = LOOKS[key] || LOOKS.day, memo = {};
  const col = (name) => memo[name] || (memo[name] = C(hex[name] || name));
  const road = []; for (let i = 0; i < PP.KNOTS; i++) road.push(new THREE.Vector4(0, PP.KNOT_S0 + i * PP.KNOT_STEP, 0, 1));   // a straight road along +Z until setRoad
  const U = {
    uTime: { value: 0 }, uD: { value: 0 }, uResY: { value: 450 },
    uLine: { value: new THREE.Vector2(PP.LINE_PT[0], PP.LINE_PT[1]) }, uInkMix: { value: new THREE.Vector2(PP.INK_FULL, PP.INK_NONE) },
    uInk: { value: new THREE.Vector3(...col('ink')) }, uF: { value: new THREE.Vector4(PP.K0, PP.K1, PP.D_K0, PP.D_K1) },
    uRoad: { value: road },
    uRoadY: { value: [PP.ROAD_Y0, PP.FALL, PP.S_FALL[0], PP.S_FALL[1], PP.S_FALL[2], PP.S_FALL[3], PP.S_BRINK, PP.S_GRADE, Math.tan(PP.GRADE_DEG * Math.PI / 180)] },
    uSunDir: { value: new THREE.Vector3(0.6486, 0.1392, 0.7483) }, uSunCol: { value: new THREE.Vector3(...col('sun')) },
    uCamP: { value: new THREE.Vector3() }, uRim: { value: new THREE.Vector3(...col('rim')) },
  };
  const setRoad = (r) => { const K = r.knots; for (let i = 0; i < PP.KNOTS; i++) road[i].set(K[i * 4], K[i * 4 + 1], K[i * 4 + 2], K[i * 4 + 3]); };
  return { key: LOOKS[key] ? key : 'day', hex, col, U, setRoad };
}
// ---------------------------------------------------------------------------------------------
// PP_GLSL: the text every vertex shader of the world shares (it declares the shared uniforms of makeLook's U, so a
// material that uses it spreads `...look.U` into its own uniforms).
//   vec2  ppRot2(v, a)            v turned by a
//   float ppF(d)                  the race's own metres for d metres flown (the plan's packF)
//   vec2  ppRoadY(s)              the road's height and slope at station s (the plan's closed form)
//   vec3  ppRoad(s, n, h, hd)     the world place at station s, n to port, h over the road, by the cubic Hermite of the
//                                 64 knots (the plan's road.hermite is its mirror); hd: the heading's unit (x, z)
//   float ppPixel(clip)           metres one pixel covers at that clip-space place
//   vec2  ppLine(W, px)           the line of 2.4 for a true width W: (held width in metres, the share of ink 0..1)
// Safe on Direct3D: no loop, the knot index clamped, every division guarded.
// ---------------------------------------------------------------------------------------------
const f1 = (x) => Number(x).toFixed(4);
// A POINT is 1/450 of the picture's height and never less than PT_MIN of a pixel (on a frame under 450 lines the line's
// floor of 2.2 points is then about a pixel and a half: tried against a whole pixel on riders 30 to 40 m off)
export const PT_MIN = 0.68;
export const PP_GLSL = /* glsl */`
  uniform float uTime, uD, uResY; uniform vec2 uLine, uInkMix; uniform vec3 uInk, uSunDir, uSunCol, uCamP;
  uniform vec4 uF; uniform vec4 uRoad[${PP.KNOTS}]; uniform float uRoadY[9];
  vec2 ppRot2(vec2 v, float a){ float c = cos(a), s = sin(a); return vec2(c * v.x - s * v.y, s * v.x + c * v.y); }
  float ppF(float d){
    float w = max(uF.w - uF.z, 1e-3), t = clamp((d - uF.z) / w, 0., 1.);
    return uF.x * d + (uF.y - uF.x) * w * (t * t * t - 0.5 * t * t * t * t) + (uF.y - uF.x) * max(d - uF.w, 0.);
  }
  vec2 ppRoadY(float s){
    float y0 = uRoadY[0], F = uRoadY[1], a0 = uRoadY[2], a1 = uRoadY[3], a2 = uRoadY[4], a3 = uRoadY[5], b0 = uRoadY[6], b1 = uRoadY[7], g = uRoadY[8];
    float wa = max(a1 - a0, 1e-3), wc = max(a3 - a2, 1e-3), wb = max(b1 - b0, 1e-3);
    float yA = y0 - F * wa * 0.5, yB = yA - F * (a2 - a1), yC = yB - F * wc * 0.5;
    if (s <= a0) return vec2(y0, 0.);
    if (s <= a1) { float t = s - a0; return vec2(y0 - F * t * t / (2. * wa), -F * t / wa); }
    if (s <= a2) return vec2(yA - F * (s - a1), -F);
    if (s <= a3) { float t = s - a2; return vec2(yB - F * (t - t * t / (2. * wc)), -F * (1. - t / wc)); }
    if (s <= b0) return vec2(yC, 0.);
    if (s <= b1) { float t = s - b0; return vec2(yC + g * t * t / (2. * wb), g * t / wb); }
    return vec2(yC + g * wb * 0.5 + g * (s - b1), g);
  }
  vec3 ppRoad(float s, float n, float h, out vec2 hd){
    float f = (s - ${f1(PP.KNOT_S0)}) / ${f1(PP.KNOT_STEP)}, fi = clamp(floor(f), 0., ${f1(PP.KNOTS - 2)}), t = f - fi, L = ${f1(PP.KNOT_STEP)};
    int i = int(fi);
    vec4 A = uRoad[i], B = uRoad[i + 1];
    float t2 = t * t, t3 = t2 * t;
    float h00 = 2. * t3 - 3. * t2 + 1., h10 = t3 - 2. * t2 + t, h01 = -2. * t3 + 3. * t2, h11 = t3 - t2;
    float d00 = 6. * t2 - 6. * t, d10 = 3. * t2 - 4. * t + 1., d11 = 3. * t2 - 2. * t;
    vec2 c = h00 * A.xy + h10 * L * A.zw + h01 * B.xy + h11 * L * B.zw;
    vec2 d = d00 * A.xy + d10 * L * A.zw - d00 * B.xy + d11 * L * B.zw;
    hd = d / max(length(d), 1e-4);
    return vec3(c.x + hd.y * n, ppRoadY(s).x + h, c.y - hd.x * n);
  }
  float ppPixel(vec4 clip){ return 2. * abs(clip.w) / max(projectionMatrix[1][1] * max(uResY, 1.), 1e-4); }
  vec2 ppLine(float W, float px){
    float pt = px * max(uResY / 450., ${f1(PT_MIN)});                         // metres one POINT covers there
    float held = clamp(W, uLine.x * pt, max(uLine.y * pt, uLine.x * pt));
    return vec2(held, smoothstep(uInkMix.y, max(uInkMix.x, uInkMix.y + 1e-3), W / max(held, 1e-6)));
  }
`;
// ---------------------------------------------------------------------------------------------
// THE ONE MATERIAL. flatMaterial(U, rig, opts) -> THREE.ShaderMaterial (U: makeLook's shared uniforms).
//   rig: one rig or a table of up to 24 (a leg's aRig.w is its index): { hip: [y, z], thigh, shin, crank: [y, z], arm }
//   opts.vertexPre   GLSL at global scope after PP_GLSL (attributes aCol, aK, aRig, iA, iB and the g-globals are declared);
//                    `#define PP_BEGIN` there with a `void ppBegin()` that sets the globals for this vertex's row
//   opts.vertexMove  statements run after the part's own motion: they take p and n in the thing's own frame (part, the
//                    g-globals and the row are in reach) and leave them in the mesh's frame
//   opts.fragPre     GLSL at the fragment's global scope; opts.fragColor: statements that may change `col` and set
//                    `cut = true` (the one discard is the fragment's last statement)
//   opts.uniforms, opts.side, opts.extra (other ShaderMaterial fields: polygonOffset and the like)
//   opts.keepInk     true for THE RIDERS (the pack's material): the line stays the ink's colour and a tyre stays dark at
//                    ANY distance (drawn in to three quarters of a point as before, never gone over to the fill), so a
//                    far rider is a small drawn figure and no pale ghost. Scenery and the sea's birds keep the fade.
// vertex: p, n in local space -> the part's own motion -> vertexMove -> world -> the line of 2.4 -> clip
// ---------------------------------------------------------------------------------------------
export function flatMaterial(U, rig = {}, opts = {}) {
  const rigs = (Array.isArray(rig) ? rig : [rig]).slice(0, 24), N = Math.max(1, rigs.length), legs = [], cranks = [];
  for (let i = 0; i < N; i++) {
    const r = rigs[i] || {}, hip = r.hip || [2.05, -0.28], ck = r.crank || [0.72, 0];
    legs.push(new THREE.Vector4(hip[0], hip[1], r.thigh ?? 0.82, r.shin ?? 0.95)); cranks.push(new THREE.Vector4(ck[0], ck[1], r.arm ?? 0.43, r.back ? 1 : 0));   // back: the knees bend astern
  }
  return new THREE.ShaderMaterial({
    uniforms: { ...U, uRim: U.uRim || { value: new THREE.Vector3(0.584, 0.617, 0.672) }, uLeg: { value: legs }, uCrank: { value: cranks }, ...(opts.uniforms || {}) },
    vertexShader: FLAT_VERT(N, opts.vertexPre || '', opts.vertexMove || '', !!opts.keepInk),
    fragmentShader: /* glsl */`
      varying vec3 vCol;
      ${opts.fragPre || ''}
      void main(){
        vec3 col = vCol; bool cut = false;
        ${opts.fragColor || ''}
        gl_FragColor = vec4(col, 1.);
        if (cut) discard;
      }`,
    side: opts.side ?? THREE.FrontSide,
    ...(opts.extra || {}),
  });
}
function FLAT_VERT(N, pre, move, keep = false) {
  const KEEP = keep ? '1.' : '0.';   // opts.keepInk (the riders): the line stays ink and a tyre stays dark at any distance
  return /* glsl */`
    attribute vec3 aCol; attribute vec4 aK; attribute vec4 aRig; attribute vec4 iA; attribute vec4 iB;
    ${PP_GLSL}
    uniform vec4 uLeg[${N}], uCrank[${N}];
    varying vec3 vCol;
    // what ppBegin() sets for this vertex's row: metres ridden, the cranks' angle, 0 where wheels stand still, the wheels'
    // own small time term, 0..1 standing on the pedals, the head's turn, the size over the model's, metres a pixel covers
    // at the thing, and the row's own phase
    float gTrav = 0., gCrank = 0., gSpin = 1., gWheelT = 0., gStand = 0., gTurn = 0., gSize = 1., gPx = 0.01, gOwn = 0., gLoose = 0.;
    uniform vec3 uRim;
    ${pre}
    void main(){
      vec3 p = position, n = normal;
      float part = floor(aK.y + 0.5);
      if (part > 31.5) { gLoose = 1.; part -= 32.; }                     // a part of the rider's LOOSE body (the drifter's bird): the same part, carried by the holder
      else gLoose = 0.;
      #ifdef PP_BEGIN
        ppBegin();
      #else
        gPx = ppPixel(projectionMatrix * modelViewMatrix * vec4(0., 0., 0., 1.));
      #endif
      if (part > 0.5 && part < 1.5) {                                   // a wheel turns by metres over its radius
        float R = max(aRig.z * gSize, 0.05), a = (gTrav / R + gWheelT) * sign(aRig.w) * gSpin;
        vec2 q = p.yz - aRig.xy;
        if (abs(aRig.w) > 1.5) q *= smoothstep(7., 15., R / max(gPx, 1e-5));   // a spoke: drawn in to the hub as the wheel grows small on the picture
        p.yz = ppRot2(q, a) + aRig.xy; n.yz = ppRot2(n.yz, a);
      } else if (part > 1.5 && part < 2.5) {                            // arms and chainring turn about the bracket
        float a = gCrank * aRig.w + aRig.z;
        p.yz = ppRot2(p.yz - aRig.xy, a) + aRig.xy; n.yz = ppRot2(n.yz, a);
      } else if (part > 2.5 && part < 3.5) {                            // a pedal rides its arm's end and stays level
        float a = gCrank + aRig.z;
        p.yz += aRig.w * (vec2(cos(a), sin(a)) - vec2(1., 0.));
      } else if (part > 3.5 && part < 6.5) {                            // a leg: hip fixed, ankle over the pedal, knee solved
        int ri = int(clamp(aRig.w, 0., ${(N - 1).toFixed(1)}) + 0.5);
        vec4 lg = uLeg[ri], ck = uCrank[ri];
        float a = gCrank + aRig.y;
        // the ankle rides its lift over the pedal; a NEGATIVE lift is a foot that slips off the pedal's front once a turn
        vec2 lift = aRig.z >= 0. ? vec2(aRig.z, 0.) : vec2(0.12, 0.) + aRig.z * smoothstep(0.55, 1., sin(a)) * vec2(1., -0.5);
        vec2 H = lg.xy + gStand * vec2(0.35, 0.25), F = ck.xy + ck.z * vec2(cos(a), sin(a)) + lift;
        float L1 = lg.z, L2 = lg.w;
        vec2 dv = F - H; float dl0 = max(length(dv), 1e-4); vec2 dn = dv / dl0;
        float dl = clamp(dl0, abs(L1 - L2) + 0.02, L1 + L2 - 0.004);    // the two circles always meet
        float a2 = (dl * dl + L1 * L1 - L2 * L2) / (2. * dl), hh = sqrt(max(L1 * L1 - a2 * a2, 0.));
        vec2 Kn = H + dn * a2 + vec2(dn.y, -dn.x) * hh * (ck.w > 0.5 ? -1. : 1.);   // the knee goes forward (astern on a bird that faces astern)
        F = H + dn * dl;
        if (part > 5.5) {                                               // the foot: flat on the pedal, toes dipping with the stroke
          float tip = 0.22 * sin(a + 0.6);
          p.yz = ppRot2(p.yz, tip) + F; n.yz = ppRot2(n.yz, tip); p.x += aRig.x;
        } else {
          vec2 P0 = part < 4.5 ? H : Kn, P1 = part < 4.5 ? Kn : F;
          vec2 ax = (P1 - P0) / max(length(P1 - P0), 1e-4);             // the bone's own +Y, as (y, z)
          p = vec3(p.x + aRig.x, P0.x + ax.x * p.y - ax.y * p.z, P0.y + ax.y * p.y + ax.x * p.z);
          n = vec3(n.x, ax.x * n.y - ax.y * n.z, ax.y * n.y + ax.x * n.z);
        }
      }
      else if (part > 6.5 && part < 7.5) {                              // the pouch: nods with the head, then swings and sags (on the world's time)
        float a = aRig.w * sin(gCrank * 2.);
        p.yz = ppRot2(p.yz - aRig.yz, a) + aRig.yz; n.yz = ppRot2(n.yz, a);
        float ph = uTime * 4.6 + gOwn;
        p.y -= aRig.x * 0.07 * (1. + sin(ph + 0.9)); p.x += aRig.x * 0.09 * sin(ph * 0.83); p.z += aRig.x * 0.04 * sin(ph + 2.2);
        if (abs(gTurn) > 1e-4) { vec2 q = ppRot2(vec2(p.x, p.z - aRig.z), gTurn); p.x = q.x; p.z = q.y + aRig.z; n.xz = ppRot2(n.xz, gTurn); }
      } else if (part > 7.5 && part < 8.5) {                            // cloth streaming back from its knot: a wave along its length
        float s = aRig.x, k = aRig.y * s, ph = uTime * 7. + 0.6 * gTrav + gOwn;
        p.x += k * sin(s * 4.2 - ph); p.y += k * 0.7 * sin(s * 3.1 - ph * 0.74 + 1.3);
      } else if (part > 8.5 && part < 9.5) {                            // a thing that hovers: it bobs by the metres ridden, and drifts a little aside
        float ph = gTrav * aRig.y + 0.5 * uTime + gOwn;
        p.y += aRig.x * sin(ph + aRig.z); p.x += aRig.w * sin(ph * 0.61 + aRig.z * 1.7);
      } else if ((part > 10.5 && part < 11.5) || (part > 15.5 && part < 16.5)) {   // head, bill, hat: a nod with each stroke
        float a = aRig.z * sin(gCrank * 2.);
        p.yz = ppRot2(p.yz - aRig.xy, a) + aRig.xy; n.yz = ppRot2(n.yz, a);
        float tn = gTurn * (aRig.w > 0.01 ? aRig.w : 1.);                // a head's own share of the turn (aRig.w; none typed: the whole of it)
        if (abs(tn) > 1e-4) { vec2 q = ppRot2(vec2(p.x, p.z - aRig.y), tn); p.x = q.x; p.z = q.y + aRig.y; n.xz = ppRot2(n.xz, tn); }   // the head turns (the leader by the metres flown; the others look about on the world's time)
      } else if (part > 11.5 && part < 12.5) {                          // speed strokes: they slide back and forth behind the rider
        p.z += aRig.y * sin(uTime * 6. + aRig.x + gOwn);
      } else if (part > 16.5 && part < 17.5) {                          // a fish's tail: it flaps side to side about its root
        float away = clamp(length(p.yz - aRig.xy) * 3., 0., 1.);
        p.x += aRig.z * away * sin(uTime * 9. + aRig.w + gOwn);
      }
      // the bird itself (pouch, cloth, trunk, head, the drifter's bird, dress): it rises and falls a little on the saddle,
      // and where the rider stands on the pedals it goes up and forward and rocks with the cranks
      if ((part > 6.5 && part < 8.5) || (part > 9.5 && part < 11.5) || (part > 12.5 && part < 13.5) || (part > 14.5 && part < 16.5)) {
        float w = gStand * ((part > 9.5 && part < 10.5) ? 1. - clamp(aRig.w, 0., 1.) : 1.);
        p.y += 0.02 * sin(gCrank * 2. + 0.4) + 0.35 * w; p.z += 0.25 * w; p.x += 0.10 * w * sin(gCrank);
      }
      ${move}
      vec4 wp = modelMatrix * vec4(p, 1.);
      vec3 wn = mat3(modelMatrix) * n; wn = wn / max(length(wn), 1e-5);
      vec4 cp = projectionMatrix * viewMatrix * wp;
      float px = ppPixel(cp);
      vec3 fill = mix(aCol, iB.rgb, aK.z);
      vCol = fill;
      float push = 0.;
      if (aK.x > 0.) {                                                  // a hull: THE ONE LINE, going over to the fill where it is fat beside its thing
        vec2 l = ppLine(aK.x, px);
        push = l.x * aK.w * mix(0.75 / max(uLine.x, 0.75), 1., l.y);    // ... and drawn in with it to three quarters of a pixel
        vCol = mix(fill, uInk, max(l.y, ${KEEP}));
      } else if (aK.x < 0.) {                                           // a stroke's own skin: thinned near with the line, never under 1.5 px wide
        float r = -aK.x, ls = ppLine(${f1(INK_W)}, px).x / ${f1(INK_W)}, pt = px * max(uResY / 450., ${f1(PT_MIN)});
        float hw = max(max(r * min(ls, 1.), min(r * ls, 0.5 * uLine.x * pt)), 0.75 * px);
        // a DETAIL stroke (aK.w under 1: a digit, a scallop, a chain) is drawn in to nothing once it is held fatter than
        // its mark can carry: whole while its true width is over aK.w of the drawn one, gone at four fifths of that
        if (aK.w < 0.99) hw *= smoothstep(0.8 * aK.w, aK.w, r / max(hw, 1e-6));
        // a TYRE (aK.w over 1.5) goes over to the rim's pale tone as the line goes over to its fill, by the same two
        // figures, and is drawn in with it: a far wheel is a pale ring and never a solid dark disc
        if (aK.w > 1.5) { float sh = smoothstep(uInkMix.y, max(uInkMix.x, uInkMix.y + 1e-3), r / max(hw, 1e-6)); vCol = mix(uRim, fill, max(sh, ${KEEP})); hw = max(hw * mix(0.6, 1., sh), 0.5 * px); }
        push = hw - r;
      }
      wp.xyz += wn * push;
      gl_Position = projectionMatrix * viewMatrix * wp;
    }`;
}


// ---------------------------------------------------------------------------------------------
// THE BUILDER: plain arrays; lofted solids with their hulls; strokes.
// ---------------------------------------------------------------------------------------------
export function makeBuilder() { return { pos: [], nor: [], col: [], k: [], rig: [], idx: [], hulls: [] }; }
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const X_AXIS = V(1, 0, 0), Y_AXIS = V(0, 1, 0), Z_AXIS = V(0, 0, 1);
const _a = V(0, 0, 0), _b = V(0, 0, 0), _c = V(0, 0, 0), _t = V(0, 0, 0);
const NORIG = [0, 0, 0, 0];

// Loft a closed skin through stations [{ p, rx, rz, side?, rig? }]. o: { col, part, rig, line (hull width; 0 none; < 0 the
// skin itself is a stroke floored in pixels), tint, side (where rx points), axis (one fixed axis for every station) }.
export function loft(B, S, nseg, o = {}) {
  const { col = [1, 1, 1], part = 0, rig = NORIG, line = INK_W, tint = 0, side = X_AXIS, axis = null, flip = false } = o;
  const base = B.pos.length / 3, n = S.length, cols = nseg + 1;
  for (let i = 0; i < n; i++) {
    const s = S[i], p0 = S[Math.max(0, i - 1)].p, p1 = S[Math.min(n - 1, i + 1)].p;
    if (axis) _t.copy(axis); else { _t.subVectors(p1, p0); if (_t.lengthSq() < 1e-10) _t.set(0, 1, 0); }
    _t.normalize();
    _a.copy(s.side || side).addScaledVector(_t, -_t.dot(s.side || side)); if (_a.lengthSq() < 1e-8) _a.set(1, 0, 0).addScaledVector(_t, -_t.x); _a.normalize();
    _b.crossVectors(_t, _a);
    const rg = s.rig || rig;
    for (let j = 0; j < cols; j++) {
      const th = (j / nseg) * Math.PI * 2, x = Math.cos(th) * s.rx, z = Math.sin(th) * s.rz;
      B.pos.push(s.p.x + _a.x * x + _b.x * z, s.p.y + _a.y * x + _b.y * z, s.p.z + _a.z * x + _b.z * z);
      B.nor.push(0, 0, 0); B.col.push(col[0], col[1], col[2]); B.k.push(line < 0 ? line : 0, part, tint, line < 0 && o.detail ? o.detail : (s.m || 1)); B.rig.push(rg[0], rg[1], rg[2], rg[3]);
    }
  }
  const i0 = B.idx.length;
  for (let i = 0; i < n - 1; i++) for (let j = 0; j < nseg; j++) {
    const a = base + i * cols + j, b = a + 1, c = a + cols, d = c + 1;
    if (flip) B.idx.push(a, c, b, b, c, d); else B.idx.push(a, b, c, b, d, c);
  }
  const P = B.pos, N = B.nor;                                           // smooth normals by face sums, the seam column merged
  for (let q = i0; q < B.idx.length; q += 3) {
    const ia = B.idx[q] * 3, ib = B.idx[q + 1] * 3, ic = B.idx[q + 2] * 3;
    _a.set(P[ib] - P[ia], P[ib + 1] - P[ia + 1], P[ib + 2] - P[ia + 2]); _b.set(P[ic] - P[ia], P[ic + 1] - P[ia + 1], P[ic + 2] - P[ia + 2]);
    _c.crossVectors(_a, _b);
    for (const v of [ia, ib, ic]) { N[v] += _c.x; N[v + 1] += _c.y; N[v + 2] += _c.z; }
  }
  for (let i = 0; i < n; i++) {
    const s0 = (base + i * cols) * 3, s1 = (base + i * cols + nseg) * 3;
    for (let q = 0; q < 3; q++) { const m = N[s0 + q] + N[s1 + q]; N[s0 + q] = m; N[s1 + q] = m; }
    const tiny = Math.max(S[i].rx, S[i].rz) < 1e-3;                     // a closed end (a pole, a cone's tip): the normal lies along the axis
    for (let j = 0; j < cols; j++) {
      const v = (base + i * cols + j) * 3; let l = Math.hypot(N[v], N[v + 1], N[v + 2]);
      if (tiny || l < 1e-9) { const o2 = S[i === 0 ? 1 : i === n - 1 ? n - 2 : i - 1]; _c.subVectors(S[i].p, o2.p); l = _c.length() || 1; N[v] = _c.x / l; N[v + 1] = _c.y / l; N[v + 2] = _c.z / l; }
      else { N[v] /= l; N[v + 1] /= l; N[v + 2] /= l; }
    }
  }
  if (line > 0) B.hulls.push([base, base + n * cols, i0, B.idx.length, line]);
  return base;
}

// An ellipsoid: r = [across (along side), along the axis, across the other way].
export function ball(B, c, r, o = {}) {
  const { nseg = 12, nring = 6, axis = Y_AXIS, side = X_AXIS } = o, ax = _t.copy(axis).normalize().clone(), S = [];
  for (let i = 0; i <= nring; i++) {
    const a = (i / nring) * Math.PI, y = -Math.cos(a) * r[1], k = i === 0 || i === nring ? 1e-4 : Math.sin(a);
    S.push({ p: V(c.x + ax.x * y, c.y + ax.y * y, c.z + ax.z * y), rx: r[0] * k, rz: r[2] * k });
  }
  return loft(B, S, nseg, { ...o, axis: ax, side });
}
// A bar or a limb through points, of one radius or one per point, flattened by `flat` across `side`; closed at both ends
// unless told (cap0, cap1: false where the end is buried in a joint).
export function tube(B, pts, r, o = {}) {
  const { nseg = 5, cap0 = true, cap1 = true, flat = 1, round = 0.5 } = o, n = pts.length, S = [];
  const rad = (i) => (Array.isArray(r) ? r[i] : r);
  const end = (i, j, sgn) => { const d = _c.subVectors(pts[i], pts[j]).normalize(); S[sgn < 0 ? 'unshift' : 'push']({ p: pts[i].clone().addScaledVector(d, rad(i) * round), rx: 1e-4, rz: 1e-4 }); };
  for (let i = 0; i < n; i++) S.push({ p: pts[i], rx: rad(i), rz: rad(i) * flat });
  if (cap0) end(0, 1, -1);
  if (cap1) end(n - 1, n - 2, 1);
  return loft(B, S, nseg, o);
}
// A stroke: a thin tube in one colour (the ink unless told), no hull; its skin never thins under a pixel of radius.
// o.detail (0..1): a small mark that is drawn in to nothing where it would be held fatter than 1 / detail of its true width.
export function stroke(B, pts, r, o = {}) { return tube(B, pts, r, { nseg: 3, cap0: false, cap1: false, col: INK, ...o, line: -r }); }
// A ring in the plane across X about c (a tyre, a hoop): R to the middle of the band, r the band's half thickness.
// line < 0: a stroke (floored); line > 0: a filled ring with its hull; line 0: a plain fill.
export function ring(B, c, R, r, o = {}) {
  const { nR = 20, nr = 5, col = INK, part = 0, rig = NORIG, tint = 0, line = 0, squash = 1 } = o, base = B.pos.length / 3, i0 = B.idx.length;
  for (let i = 0; i <= nR; i++) {
    const f = (i / nR) * Math.PI * 2, cy = Math.cos(f), cz = Math.sin(f);
    for (let j = 0; j <= nr; j++) {
      const t = (j / nr) * Math.PI * 2, e = Math.cos(t), x = Math.sin(t);
      B.pos.push(c.x + x * r * squash, c.y + cy * (R + e * r), c.z + cz * (R + e * r)); B.nor.push(x, cy * e, cz * e);
      B.col.push(col[0], col[1], col[2]); B.k.push(line < 0 ? line : 0, part, tint, line < 0 && o.far ? 2 : 1); B.rig.push(rig[0], rig[1], rig[2], rig[3]);
    }
  }
  for (let i = 0; i < nR; i++) for (let j = 0; j < nr; j++) { const a = base + i * (nr + 1) + j, b = a + 1, c2 = a + nr + 1, d = c2 + 1; B.idx.push(a, c2, b, b, c2, d); }
  if (line > 0) B.hulls.push([base, B.pos.length / 3, i0, B.idx.length, line]);
  return base;
}
// A box between two corners (a pedal, a crate): eight corners, each carrying the sum of its three faces so the line stays mitred.
export function box(B, lo, hi, o = {}) {
  const { col = [1, 1, 1], part = 0, rig = NORIG, tint = 0, line = INK_W } = o, base = B.pos.length / 3, i0 = B.idx.length, k = 1 / Math.sqrt(3);
  for (let q = 0; q < 8; q++) {
    const sx = q & 1 ? 1 : -1, sy = q & 2 ? 1 : -1, sz = q & 4 ? 1 : -1;
    B.pos.push(sx > 0 ? hi.x : lo.x, sy > 0 ? hi.y : lo.y, sz > 0 ? hi.z : lo.z); B.nor.push(sx * k, sy * k, sz * k);
    B.col.push(col[0], col[1], col[2]); B.k.push(0, part, tint, 1.35); B.rig.push(rig[0], rig[1], rig[2], rig[3]);   // 1.35, not root 3: an edge seen cornerwise then wears the line's own weight, not root 2 of it
  }
  for (const f of [[0, 2, 3, 1], [4, 5, 7, 6], [0, 1, 5, 4], [2, 6, 7, 3], [0, 4, 6, 2], [1, 3, 7, 5]]) B.idx.push(base + f[0], base + f[1], base + f[2], base + f[0], base + f[2], base + f[3]);
  if (line > 0) B.hulls.push([base, base + 8, i0, B.idx.length, line]);
  return base;
}
// A cone or a drum from a to b (radius r0 at a, r1 at b; o.flat squashes it across `side`): its rims stay sharp (mitred),
// a tip takes a normal along the axis.
export function cone(B, a, b, r0, r1, o = {}) {
  const { nseg = 10, cap0 = true, cap1 = true, m = 1.3, flat = 1 } = o, S = [], e = 1e-4;
  if (cap0 && r0 > 1e-3) S.push({ p: a, rx: e, rz: e });
  S.push({ p: a, rx: Math.max(r0, e), rz: Math.max(r0 * flat, e), m: r0 > 1e-3 ? m : 1 });
  S.push({ p: b, rx: Math.max(r1, e), rz: Math.max(r1 * flat, e), m: r1 > 1e-3 ? m : 1 });
  if (cap1 && r1 > 1e-3) S.push({ p: b, rx: e, rz: e });
  return loft(B, S, nseg, { ...o, axis: b.clone().sub(a).normalize() });
}
// A flat quad a, b, c, d (counter-clockwise seen from its front): a bib, a sail, the blank card. o.line (W, metres) adds a
// rim strip in the quad's own plane that wears the one line; o.two (default true) draws both faces.
export function plate(B, a, b, c, d, o = {}) {
  const { col = [1, 1, 1], part = 0, rig = NORIG, tint = 0, line = 0, two = true } = o, Q = [a, b, c, d], base = B.pos.length / 3;
  const nrm = b.clone().sub(a).cross(d.clone().sub(a)).normalize();
  const put = (p, nn, kx, kw) => { B.pos.push(p.x, p.y, p.z); B.nor.push(nn.x, nn.y, nn.z); B.col.push(col[0], col[1], col[2]); B.k.push(kx, part, tint, kw); B.rig.push(rig[0], rig[1], rig[2], rig[3]); };
  const quad = (i, j, k, l) => { B.idx.push(i, j, k, i, k, l); if (two) B.idx.push(i, k, j, i, l, k); };
  for (const p of Q) put(p, nrm, 0, 1);
  quad(base, base + 1, base + 2, base + 3);
  if (line > 0) {
    const r0 = B.pos.length / 3;
    for (let q = 0; q < 4; q++) {
      const e0 = Q[q].clone().sub(Q[(q + 3) % 4]).normalize(), e1 = Q[(q + 1) % 4].clone().sub(Q[q]).normalize();
      const o0 = e0.cross(nrm), o1 = e1.cross(nrm), md = o0.clone().add(o1).normalize(), mit = 1 / Math.max(md.dot(o0), 0.3);
      put(Q[q], md, line, 0); put(Q[q], md, line, mit);                  // the inner corner stays; the outer one goes out by the held line
    }
    for (let q = 0; q < 4; q++) { const i = r0 + q * 2, j = r0 + ((q + 1) % 4) * 2; quad(i, i + 1, j + 1, j); }
  }
  return base;
}
// One to three digits as flat rounded strokes in the plane (right, up) about `at`, h tall: ribbons with mitred joins whose
// skin obeys the stroke's law (never under a pixel and a half). A nought is an oval with a slash, a one has a flag and a
// foot. No texture, no word: digits only.
const GLYPH = [
  [[[0.5, 0], [0.2, 0.14], [0.1, 0.5], [0.2, 0.86], [0.5, 1], [0.8, 0.86], [0.9, 0.5], [0.8, 0.14], [0.5, 0]], [[0.22, 0.2], [0.78, 0.8]]],
  [[[0.18, 0.7], [0.5, 1], [0.5, 0]], [[0.18, 0], [0.82, 0]]],
  [[[0.1, 0.78], [0.3, 1], [0.7, 1], [0.9, 0.8], [0.88, 0.6], [0.1, 0], [0.9, 0]]],
  [[[0.1, 0.88], [0.3, 1], [0.7, 1], [0.9, 0.8], [0.88, 0.66], [0.55, 0.52], [0.9, 0.36], [0.9, 0.2], [0.7, 0], [0.3, 0], [0.1, 0.12]]],
  [[[0.7, 0], [0.7, 1], [0.1, 0.32], [0.95, 0.32]]],
  [[[0.85, 1], [0.2, 1], [0.15, 0.56], [0.6, 0.6], [0.9, 0.42], [0.9, 0.2], [0.66, 0], [0.3, 0], [0.1, 0.12]]],
  [[[0.8, 0.94], [0.5, 1], [0.25, 0.85], [0.1, 0.5], [0.1, 0.22], [0.3, 0], [0.7, 0], [0.9, 0.2], [0.9, 0.38], [0.7, 0.56], [0.3, 0.56], [0.1, 0.4]]],
  [[[0.1, 1], [0.9, 1], [0.4, 0]]],
  [[[0.5, 0.54], [0.22, 0.66], [0.22, 0.88], [0.5, 1], [0.78, 0.88], [0.78, 0.66], [0.5, 0.54], [0.14, 0.4], [0.14, 0.14], [0.5, 0], [0.86, 0.14], [0.86, 0.4], [0.5, 0.54]]],
  null,
];
GLYPH[9] = GLYPH[6].map((l) => l.map(([x, y]) => [1 - x, 1 - y]));
export function digits(B, n, at, right, up, h, o = {}) {
  const { col = INK, part = 0, rig = NORIG, two = false, weight = 0.075, detail = 0.45 } = o, base = B.pos.length / 3;
  const ds = String(Math.max(0, Math.round(n))).slice(0, 3).split('').map(Number), wd = 0.52 * h, step = 0.68 * h, hw = weight * h;
  const put = (x, y, mx, my) => {
    B.pos.push(at.x + right.x * x + up.x * y, at.y + right.y * x + up.y * y, at.z + right.z * x + up.z * y);
    B.nor.push(right.x * mx + up.x * my, right.y * mx + up.y * my, right.z * mx + up.z * my);
    B.col.push(col[0], col[1], col[2]); B.k.push(-hw, part, 0, detail); B.rig.push(rig[0], rig[1], rig[2], rig[3]);
  };
  ds.forEach((d, di) => {
    const x0 = (di - (ds.length - 1) / 2) * step;
    for (const line of GLYPH[d]) {
      const pts = line.map(([x, y]) => [x0 + (x - 0.5) * wd, (y - 0.5) * h]), m = pts.length, v0 = B.pos.length / 3;
      for (let i = 0; i < m; i++) {
        const a = pts[Math.max(0, i - 1)], b = pts[Math.min(m - 1, i + 1)], c = pts[i];
        const seg = (p, q) => { const dx = q[0] - p[0], dy = q[1] - p[1], l = Math.hypot(dx, dy) || 1; return [-dy / l, dx / l]; };   // the left hand of a run
        const n0 = seg(i === 0 ? c : a, i === 0 ? b : c), n1 = seg(i === m - 1 ? a : c, i === m - 1 ? c : b);
        let mx = n0[0] + n1[0], my = n0[1] + n1[1]; const ml = Math.hypot(mx, my) || 1; mx /= ml; my /= ml;
        const mit = Math.min(1.8, 1 / Math.max(mx * n0[0] + my * n0[1], 0.4));
        put(c[0] + mx * hw * mit, c[1] + my * hw * mit, mx, my); put(c[0] - mx * hw * mit, c[1] - my * hw * mit, -mx, -my);
      }
      for (let i = 0; i < m - 1; i++) {
        const q = v0 + i * 2;                                           // left, right, next left, next right
        B.idx.push(q + 1, q + 3, q, q, q + 3, q + 2);
        if (two) B.idx.push(q + 1, q, q + 3, q, q + 2, q + 3);
      }
    }
  });
  return base;
}
// Give every vertex laid since `from` a part and its rig (for shapes made with the plain helpers and then set moving).
export function setPart(B, from, part, rig) { for (let v = from; v < B.pos.length / 3; v++) { B.k[v * 4 + 1] = part; if (rig) for (let q = 0; q < 4; q++) B.rig[v * 4 + q] = typeof rig === 'function' ? rig(v, q) : rig[q]; } }

// Give every vertex laid since `from` its ROW (the merged one-off riders carry iA and iB on every vertex): a = [lane n,
// offset o, own number, size], b = [tint r, g, b, glitch id]. Call it before the hulls are appended (they copy it).
const padRows = (B, n) => { while (B.ia.length < n * 4) { B.ia.push(0, 0, 0, PP.SCALE); B.ib.push(1, 1, 1, 0); } };
export function setRow(B, from, a, b) {
  const n = B.pos.length / 3; if (!B.ia) { B.ia = []; B.ib = []; }
  padRows(B, from); B.ia.length = from * 4; B.ib.length = from * 4;
  for (let v = from; v < n; v++) { B.ia.push(a[0], a[1], a[2], a[3]); B.ib.push(b[0], b[1], b[2], b[3]); }
}
// The hulls: for every filled solid the same skin again with its winding reversed, to be pushed out as the line. A hull
// vertex keeps its shape's colour and tint (the shader picks ink or fill). `max` shapes a call.
export function appendHulls(B, max = Infinity) {
  const list = B.hulls.splice(0, Math.min(max, B.hulls.length));
  if (B.ia) padRows(B, B.pos.length / 3);
  for (const [v0, v1, i0, i1, w] of list) {
    const off = B.pos.length / 3 - v0;
    for (let v = v0; v < v1; v++) {
      B.pos.push(B.pos[v * 3], B.pos[v * 3 + 1], B.pos[v * 3 + 2]); B.nor.push(B.nor[v * 3], B.nor[v * 3 + 1], B.nor[v * 3 + 2]);
      B.col.push(B.col[v * 3], B.col[v * 3 + 1], B.col[v * 3 + 2]); B.k.push(w, B.k[v * 4 + 1], B.k[v * 4 + 2], B.k[v * 4 + 3]);
      B.rig.push(B.rig[v * 4], B.rig[v * 4 + 1], B.rig[v * 4 + 2], B.rig[v * 4 + 3]);
      if (B.ia) { B.ia.push(B.ia[v * 4], B.ia[v * 4 + 1], B.ia[v * 4 + 2], B.ia[v * 4 + 3]); B.ib.push(B.ib[v * 4], B.ib[v * 4 + 1], B.ib[v * 4 + 2], B.ib[v * 4 + 3]); }
    }
    for (let q = i0; q < i1; q += 3) B.idx.push(B.idx[q] + off, B.idx[q + 2] + off, B.idx[q + 1] + off);
  }
  return B.hulls.length;
}
// finish(B, Y, opts) -> BufferGeometry, or InstancedBufferGeometry (opts.instanced). The hulls are appended 60 shapes at
// a time with `await Y()` between (Y: the context's yield). geometry.userData.triangles counts hulls.
export async function finish(B, Y, opts = {}) {
  while (B.hulls.length) { appendHulls(B, 60); if (Y) await Y(); }
  const g = opts.instanced ? new THREE.InstancedBufferGeometry() : new THREE.BufferGeometry(), n = B.pos.length / 3;
  const big = Y && n > 6000;                                             // a big merged geometry: its arrays are made in stretches
  g.setAttribute('position', new THREE.Float32BufferAttribute(B.pos, 3));
  if (big) await Y();
  g.setAttribute('normal', new THREE.Float32BufferAttribute(B.nor, 3));
  if (big) await Y();
  g.setAttribute('aCol', new THREE.Float32BufferAttribute(B.col, 3));
  if (big) await Y();
  g.setAttribute('aK', new THREE.Float32BufferAttribute(B.k, 4));
  if (big) await Y();
  g.setAttribute('aRig', new THREE.Float32BufferAttribute(B.rig, 4));
  if (big) await Y();
  if (B.ia && !opts.instanced) {
    padRows(B, n);                                                      // any vertex laid after the last row
    g.setAttribute('iA', new THREE.Float32BufferAttribute(B.ia, 4)); g.setAttribute('iB', new THREE.Float32BufferAttribute(B.ib, 4));
  }
  g.setIndex(n > 65000 ? new THREE.Uint32BufferAttribute(B.idx, 1) : new THREE.Uint16BufferAttribute(B.idx, 1));
  g.userData.triangles = B.idx.length / 3;
  return g;
}
// iA, iB from rows of [a0, a1, a2, a3, b0, b1, b2, b3] on an InstancedBufferGeometry
export function setInstances(g, rows) {
  const iA = new Float32Array(rows.length * 4), iB = new Float32Array(rows.length * 4);
  rows.forEach((r, i) => { iA.set([r[0], r[1], r[2], r[3]], i * 4); iB.set([r[4], r[5], r[6], r[7]], i * 4); });
  g.setAttribute('iA', new THREE.InstancedBufferAttribute(iA, 4)); g.setAttribute('iB', new THREE.InstancedBufferAttribute(iB, 4));
  g.instanceCount = rows.length;
  return g;
}
// ---------------------------------------------------------------------------------------------
// makeDiscs(list, look, opts) -> THREE.Group: things that are only circles (cloud circles, splash drops, flower heads),
// each a quad turned to the eye about its own place and cut round in the fragment shader.
//   list: [{ p: [x, y, z], r, col: a palette name or [r, g, b] linear, sway: metres it bobs on the world's time }]
//   opts.ring (metres): every disc is drawn FIRST in the line (a held line's width larger, opts.back metres further off:
//     default 0.3), then in its colour, so the line shows only round the union of discs that lie within `back` of each other;
//     opts.backShare holds the line no further back than that share of the disc's distance (near discs keep their own lines)
//   opts.vertexPre / opts.vertexMove: GLSL as flatMaterial's; vertexMove may change `c` (the centre, world) and `r`
//   opts.uniforms; opts.attributes: { name: { array, size } } more per-disc numbers for vertexMove
// A radius of 0 draws nothing (the quad is scaled to nothing; the fragment never divides by it).
// ---------------------------------------------------------------------------------------------
export function makeDiscs(list, look, opts = {}) {
  const n = list.length, iP = new Float32Array(n * 4), iC = new Float32Array(n * 4), g = new THREE.InstancedBufferGeometry();
  list.forEach((d, i) => {
    const p = d.p.isVector3 ? [d.p.x, d.p.y, d.p.z] : d.p, c = typeof d.col === 'string' ? look.col(d.col) : d.col || [1, 1, 1];
    iP.set([p[0], p[1], p[2], d.r], i * 4); iC.set([c[0], c[1], c[2], d.sway || 0], i * 4);
  });
  g.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3)); g.setIndex([0, 1, 2, 0, 2, 3]);
  g.setAttribute('iP', new THREE.InstancedBufferAttribute(iP, 4)); g.setAttribute('iC', new THREE.InstancedBufferAttribute(iC, 4));
  for (const [name, a] of Object.entries(opts.attributes || {})) g.setAttribute(name, new THREE.InstancedBufferAttribute(new Float32Array(a.array), a.size));
  g.instanceCount = n;
  const mat = (ring) => new THREE.ShaderMaterial({
    uniforms: { ...look.U, uRing: { value: ring }, uBack: { value: ring > 0 ? opts.back ?? 0.3 : 0 }, uBackK: { value: ring > 0 ? opts.backShare ?? 0 : 0 }, ...(opts.uniforms || {}) },
    vertexShader: /* glsl */`
      attribute vec4 iP, iC;
      ${PP_GLSL}
      uniform float uRing, uBack, uBackK;
      varying vec2 vUv; varying vec3 vCol;
      ${opts.vertexPre || ''}
      void main(){
        vec3 c = (modelMatrix * vec4(iP.xyz, 1.)).xyz; float r = iP.w;
        c.y += iC.w * sin(uTime * 0.9 + iP.x * 0.37 + iP.z * 0.23);
        ${opts.vertexMove || ''}
        vec3 toC = c - cameraPosition; float dl = max(length(toC), 1e-4); vec3 fw = toC / dl;
        vec3 rt = cross(fw, vec3(0., 1., 0.)); float rl = length(rt); rt = rl > 1e-4 ? rt / rl : vec3(1., 0., 0.);
        vec3 up = cross(rt, fw);
        vCol = iC.rgb;
        if (uRing > 0. && r > 0.) {
          vec2 l = ppLine(uRing, ppPixel(projectionMatrix * viewMatrix * vec4(c, 1.)));
          r += l.x * mix(0.75 / max(uLine.x, 0.75), 1., l.y); vCol = mix(iC.rgb, uInk, l.y);
          float bk = uBackK > 0. ? min(uBack, uBackK * dl) : uBack;      // opts.backShare: no further back than that share of its distance
          c += fw * bk; r *= (dl + bk) / dl;                             // a hair further off, the same size on the picture
        }
        vUv = position.xy;
        gl_Position = projectionMatrix * viewMatrix * vec4(c + (rt * position.x + up * position.y) * r, 1.);
      }`,
    fragmentShader: /* glsl */`
      varying vec2 vUv; varying vec3 vCol;
      void main(){ float d = dot(vUv, vUv); gl_FragColor = vec4(vCol, 1.); if (d > 1.) discard; }`,
  });
  const group = new THREE.Group(); group.name = opts.name || 'pp-discs';
  if (opts.ring > 0) { const ink = new THREE.Mesh(g, mat(opts.ring)); ink.frustumCulled = false; ink.name = group.name + '-line'; ink.renderOrder = (opts.renderOrder ?? 0) - 1; group.add(ink); }
  const fill = new THREE.Mesh(g, mat(0)); fill.frustumCulled = false; fill.name = group.name + '-fill'; fill.renderOrder = opts.renderOrder ?? 0; group.add(fill);
  return group;
}
// ---------------------------------------------------------------------------------------------
// buildHero(ctx, opts): THE LEADER alone on 12 m of road, pedalling on time (the part viewer has no route, so the
// metres ridden here are the viewer's own clock times 14 m a second; in the world they are the pack law's).
//   node tools/shot.mjs _part --query "part=pelican-peloton&bg=day&flat=1" --tag pelican-peloton-hero --u <places round the orbit>
// ---------------------------------------------------------------------------------------------
const HERO_PRE = /* glsl */`
  #define PP_BEGIN
  void ppBegin(){
    gSize = iA.w / ${f1(PP.SCALE)};
    gTrav = uTime * 14.; gWheelT = 0.; gCrank = gTrav / (2.5 * 0.6); gOwn = 0.;
    gTurn = 0.6109 * smoothstep(0.55, 0.95, sin(uTime * 0.5));          // the head turns toward the open lane and back, as it does on the last straight
    gPx = ppPixel(projectionMatrix * modelViewMatrix * vec4(0., 2., 0., 1.));
  }
`;
export async function buildHero(ctx, opts = {}) {
  const look = makeLook(opts.look || 'day'), Y = async () => { if (ctx && ctx.yield) await ctx.yield(); }, object = new THREE.Group();
  object.name = 'pp-hero';
  const k = PP.LEADER / PP.SCALE, half = 6, wide = 3.2;
  // 12 m of road with its two edge lines and a dash, and the leader's drawn shadow lying on it
  const R = makeBuilder(), road = look.col('road'), dash = look.col('dash'), up = 0.02;
  plate(R, V(wide, up, -half), V(wide, up, half), V(-wide, up, half), V(-wide, up, -half), { col: road, two: true, line: 0 });
  for (const sx of [-1, 1]) plate(R, V(sx * wide + 0.07, up + 0.01, -half), V(sx * wide + 0.07, up + 0.01, half), V(sx * wide - 0.07, up + 0.01, half), V(sx * wide - 0.07, up + 0.01, -half), { col: INK, two: true });
  for (const z of [-4.2, 1.8]) plate(R, V(-1.9 + 0.17, up + 0.01, z), V(-1.9 + 0.17, up + 0.01, z + 3.2), V(-1.9 - 0.17, up + 0.01, z + 3.2), V(-1.9 - 0.17, up + 0.01, z), { col: dash, two: true });
  const sh = look.col('shadow'), s0 = R.pos.length / 3, N = 16;
  R.pos.push(0.5, up + 0.02, 0.3);
  for (let i = 0; i < N; i++) { const a = (i / N) * Math.PI * 2; R.pos.push(0.5 + Math.sin(a) * 1.1 + 0.9 * (1 - Math.cos(a)) * 0.5, up + 0.02, 0.3 + Math.cos(a) * 3.3); }
  for (let v = 0; v <= N; v++) { R.nor.push(0, 1, 0); R.col.push(sh[0], sh[1], sh[2]); R.k.push(0, 0, 0, 1); R.rig.push(0, 0, 0, 0); }
  for (let i = 0; i < N; i++) R.idx.push(s0, s0 + 1 + i, s0 + 1 + ((i + 1) % N));
  const ground = new THREE.Mesh(await finish(R, Y), flatMaterial(look.U)); ground.name = 'pp-hero-road'; object.add(ground);
  await Y();
  const B = makeBuilder(), row = { n: 0, o: 0, own: 0, size: PP.LEADER, livery: 'red', bib: 1, band: 'leader', kind: 'leader' };
  const at = await leaderGeometry(B, look, row, Y);
  const mat = flatMaterial(look.U, B.rigs || at.rig, { vertexPre: HERO_PRE, vertexMove: 'p *= gSize;' });
  const leader = packMesh(await finish(B, Y), null, mat); leader.name = 'pp-hero-leader'; object.add(leader);
  const size = new THREE.Vector2(), cam = new THREE.Vector3();
  return {
    object, radius: 4.4, height: 6.3, center: V(0, 3.0, 0.2),
    anchors: { saddle: V(0, 1.78 * k, -0.62 * k), headTop: V(0, 4.84 * k, 0.5 * k), billTip: V(0, 3.78 * k, 2.3 * k), ahead: V(0, 0, 1) },
    triangles: leader.geometry.userData.triangles,
    update(dt, time, camera) {
      look.U.uTime.value = time;
      if (ctx && ctx.renderer) look.U.uResY.value = ctx.renderer.getDrawingBufferSize(size).y;
      if (camera) look.U.uCamP.value.copy(camera.getWorldPosition(cam));
    },
    dispose() {},
    ground: true, groundY: 0,
  };
}
