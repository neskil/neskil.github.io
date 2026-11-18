// NOBODY UP YET: hero set piece. The white summer hotel on the bluff, after Edward Hopper (oil: sunlight on the side of a house).
//
// WHAT IT IS. A clapboard hotel 170 m long (local z -85..85), one room (9 m) deep (x -4.5..4.5), four storeys to an eave at
// 18 m under a mansard with dormers, a three-bay tower pavilion with a fifth storey, cap, pole and plain pennant, a veranda
// along the west flank (the near horizontal), and a dining wing across the path at the south end (x -70..4.5, z 85..99)
// with eight tall windows north and their twins south. The second storey (the one the world's eye rides at) has wide windows
// in four lights, 5.1 m of opening to a 6.8 m bay, sills near the floor, each blind at its own height within the top quarter
// of its window (a rule on the storey's and the bay's numbers: no two neighbours alike, straw or dark green), a sash raised
// here and there, so each room is seen into whole from the flank run and the storey reads as room after room, not as wall.
// The long curtain hangs from its
// rod across one raised sash of that storey and the gust lifts it out over the veranda roof, downwind: the same bending
// cloth as the short curtains, longer (5 m), so it is a curtain from first sight to the pass. Every west window is a real hole
// with a 0.3 m reveal, a sill, a hood,
// a blind at its own height and a real room behind: dark box, one sun parallelogram on the floor from the far window, and
// in the far window a square of sea with a level horizon (painted by the view ray, so it parallaxes like an opening).
// Origin: base centre of the main block, +Y up. The course of the world (+Z, south) runs down the WEST flank (x < 0);
// sun and sea are to +X. radius ~118, height ~39. About 29k triangles, 5 draw calls (slabs, rooms, thrown shadows, cloth,
// apron), build ~90 ms in six short steps, no lights, no textures but one 256 px noise.
//
// HOW THE STYLE IS MADE (flat pipeline: the world must return post { flat: 1, bloom: { strength: 0 }, grade: { saturation: 1,
// contrast: 1, vignette: 0, grain: 0 } }; no inverse tone map anywhere):
//  - every vertex carries aPig (a surface kind, PIG.*); the fragment shader picks ONE of three tones of that kind from the
//    13 x 3 table uTab: sun (plane faces uSun), shade (faces away, or under the headland plane uHead), cast (faces the sun
//    but stands in a thrown shadow). White in shade is the blue-green pigment itself; cast is one step deeper.
//  - thrown shadows of the big masses are exact and ruled: hopCast() intersects the sun ray with six boxes (uBoxMin/Max,
//    hotel-local through uCastM) and steps the tone on a 1.5 px fwidth edge that wanders with the brush noise. Any material
//    that includes STYLE_GLSL gets the hotel's shadow on it (the grass to starboard, the wing's north wall).
//  - thrown shadows of small things (sills, hoods, boards): hopShadowBoard + hopShadowMesh, opaque slabs in the receiver's
//    cast tone slid along the sun ray in the vertex shader (they swing as the sun climbs).
//  - rooms: hopMaterial(U, { room: true }); each vertex stores its window(s) (aWinC/aWinS[,2]); a point is lit where the sun
//    ray leaves by the window, so slabs swing over floor, wall and bed with the sun. PIG.PANE paints sky-over-sea by view ray.
//  - clapboard and grass ranks: hopRule() lines in the cast tone, >= 1.5 px, flat average below 4 px. Brush drag: +-3.5 %
//    from one noise stretched 12:1 along each plane, plus hopDragB, broad streaks a hand wide and metres long (about +-7 %),
//    which also make every tone step and ruled line wander by centimetres. No outline, no gradient on a solid, no fog, no lamp.
//  - the medium moves: setProgress(u) raises the sun 8 -> 20 degrees (every tone step, thrown shadow and room slab follows);
//    blinds lift, curtains blow out and are sucked back, the pennant streams (aWind / cloth shader on uTime, uGust).
//
// EXPORTS for the world coder: HOP_PALETTE, PIG, hopToneTable, makeHopUniforms (one shared uniform set: pass hero.uniforms to
// every material of the world), STYLE_GLSL (hopTone, hopCast, hopRule, hopSky, hopDrag, hopTab), hopMaterial, and the slab
// builders hopGeo / hopQuad / hopBox / hopFrame / hopRect / hopBoard / hopWall / hopWindow / hopFinish, hopShadowBoard /
// hopShadowMesh. Set uniforms.uHead (vec4 plane, lit where dot(p, xyz) + w > 0) for the headland's sweeping shadow edge.
//
// buildHero(ctx, opts): opts.palette (7 hex), opts.detail (0.6-1: fewer curtains, no beds), opts.colourway 'white' | 'straw'
// (default by seed, 22 % straw), opts.october (every blind down, no curtains), opts.evening (sun to starboard),
// opts.apron (default true: a flat of ranked grass for judging alone; the world passes false), opts.curtainU (0.47),
// opts.uniforms (share an existing set). Returns the contract plus uniforms, material, roomMaterial, setProgress(u),
// setSun(elevationDeg, azimuthDeg, starboard), setGust(0..1). Call setProgress(u) every frame from the world's update;
// update(dt, time) only advances the wind and the caster matrix. Per seed: blinds, which windows blow curtains, the long
// curtain's bay, chimneys, cap height, east dormers, the north end's window, colourway.
//
// ANCHORS (local): eyeY 6.3 (ride height: second-floor windows, so set the bluff top 6.3 m under the path); flyThrough
// (7 points down the flank, 14 m off at the north end closing to 6 m, in at the dining window and out of its twin; the
// veranda edge is 2.8 m from the line at the south end and the window jambs 2.5 m: that closeness is the brief's);
// buffers (track end); reveal { position, target }; windowIn / windowOut { center, width 5, height 6, normal };
// diningFloorY 3; curtain (head of the window whose 4.4 m curtain blows 3 m out at curtainU); pennant; perches (26 gull
// standing points); roofTop, eave; portalSeat null (the exit portal is the boathouse door, not here).
// Expects: flat ground at y = 0 around it, the bluff edge just south of z = 99, sea to the east and south.
import * as THREE from 'three';

export const HOP_PALETTE = ['#F3E9C8', '#7FA8A6', '#4F8FB8', '#C2BC6A', '#A5432B', '#234A3A', '#161D1E'];
// Surface kinds (the per-vertex "aPig" value). Each has exactly three tones: sun, shade, cast.
export const PIG = { WHITE: 0, ROOF: 1, SEA: 2, STRAW: 3, RED: 4, GREEN: 5, DARK: 6, STREET: 7, ROOMWALL: 8, ROOMFLOOR: 9, ROOMCEIL: 10, PANE: 11, WALL: 12, GRASS: 13, LEAF: 14, TIN: 15, WALLDEEP: 16, TIE: 17 };
const NROW = 18, NBOX = 22;   // caster boxes: 0-5 are the hotel's, 6-19 are the world's to fill (hotel-local coordinates)

const _hex = (h) => [parseInt(h.slice(1, 3), 16) / 255, parseInt(h.slice(3, 5), 16) / 255, parseInt(h.slice(5, 7), 16) / 255];
const _mx = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const _lin = (c) => c.map((v) => (v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));

// The 13 x 3 tone table, mixed as paint (in display space) from the seven pigments, returned as linear vec3s.
// Flat pipeline (post.flat = 1): what is written is what is shown, so there is no inverse tone map anywhere.
export function hopToneTable(palette = HOP_PALETTE, o = {}) {
  const [C, BG, CE, ST, RD, VD, BB] = palette.map(_hex);
  const wall = o.wall ? _hex(o.wall) : C;                       // colourway: straw-yellow hotel = mix of cream and straw
  const castW = [wall[0] * 0.45, wall[1] * 0.66, wall[2] * 0.78];
  const rows = [
    [C, BG, [C[0] * 0.45, C[1] * 0.66, C[2] * 0.78]],                                             // WHITE (trim, cloth, sills)
    [_mx(BG, BB, 0.46), _mx(BG, BB, 0.64), _mx(BG, BB, 0.74)],                                    // ROOF (fixed mix)
    o.october ? [_mx(CE, VD, 0.22), _mx(CE, VD, 0.55), _mx(CE, VD, 0.68)] : [CE, _mx(CE, VD, 0.4), _mx(CE, VD, 0.55)],   // SEA / sky blue (darker in October)
    [ST, _mx(ST, VD, 0.72), _mx(ST, VD, 0.86)],                                                  // STRAW (grass, blinds)
    [RD, _mx(RD, BB, 0.4), _mx(RD, BB, 0.54)],                                                   // RED
    [_mx(VD, ST, 0.22), VD, _mx(VD, BB, 0.45)],                                                  // GREEN
    [_mx(BB, BG, 0.1), BB, BB],                                                                  // DARK (holes)
    [_mx(C, BB, 0.36), _mx(BG, BB, 0.5), _mx(BG, BB, 0.62)],                                     // STREET (fixed mix)
    [_mx(C, ST, 0.1), _mx(BB, BG, 0.2), _mx(BB, BG, 0.3)],                                       // ROOMWALL: slab / away / unlit
    [C, _mx(BB, VD, 0.4), _mx(BB, VD, 0.4)],                                                     // ROOMFLOOR
    [C, _mx(BB, BG, 0.12), _mx(BB, BG, 0.12)],                                                   // ROOMCEIL
    [CE, CE, CE],                                                                                // PANE (computed)
    [wall, o.wall ? _mx(BG, ST, 0.34) : BG, o.wall ? _mx(_mx(BG, ST, 0.34), VD, 0.16) : castW],  // WALL (the hotel's clapboard: cream, or straw-yellow)
    o.october ? [_mx(ST, RD, 0.2), _mx(_mx(ST, RD, 0.2), VD, 0.7), _mx(_mx(ST, RD, 0.2), VD, 0.84)] : [ST, _mx(ST, VD, 0.72), _mx(ST, VD, 0.86)],   // GRASS (turns toward light red in October)
    o.october ? [_mx(RD, ST, 0.45), _mx(_mx(RD, ST, 0.3), VD, 0.6), _mx(_mx(RD, VD, 0.6), BB, 0.4)] : [_mx(VD, ST, 0.22), VD, _mx(VD, BB, 0.45)],        // LEAF (tree masses; turned in October)
    [_mx(BG, BB, 0.2), _mx(BG, BB, 0.38), _mx(BG, BB, 0.5)],                                      // TIN (the veranda's seamed roof: paler than slate)
    o.wall ? Array(3).fill(_mx(_mx(BG, ST, 0.34), VD, 0.16)) : [castW, castW, castW],            // WALLDEEP (the deeper tone under a sill, a hood, an eave: one tone whatever the sun does)
    [_mx(C, BB, 0.42), _mx(BG, BB, 0.42), _mx(BG, BB, 0.56)],                                    // TIE (the elevated's timber deck: its rule is the gap between ties, blue-black)
  ];
  const out = [];
  for (const r of rows) for (const c of r) { const l = _lin(c); out.push(new THREE.Vector3(l[0], l[1], l[2])); }
  return out;
}

// One set of uniforms shared by every material of the world (pass HOP.uniforms into your own materials).
export function makeHopUniforms(palette = HOP_PALETTE, o = {}) {
  const [C, , CE] = palette.map(_hex);
  const hor = _lin(_mx(CE, C, 2 / 3)), top = _lin(CE);
  const n = 256, d = new Uint8Array(n * n);                    // brush-drag noise: tileable, built once
  let s = (o.seed ?? 7) >>> 0 || 7; const r = () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296);
  const a = new Float32Array(n * n); for (let i = 0; i < n * n; i++) a[i] = r();
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {    // short drag along x so bristles read
    let v = 0; for (let k = -3; k <= 3; k++) v += a[y * n + ((x + k + n) & 255)];
    d[y * n + x] = Math.max(0, Math.min(255, Math.round((v / 7 - 0.5) * 2.2 * 255 + 127.5)));
  }
  const tex = new THREE.DataTexture(d, n, n, THREE.RedFormat, THREE.UnsignedByteType);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.magFilter = THREE.LinearFilter; tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.generateMipmaps = true; tex.needsUpdate = true;
  const boxMin = [], boxMax = [];
  for (let i = 0; i < NBOX; i++) { boxMin.push(new THREE.Vector3(0, -1e4, 0)); boxMax.push(new THREE.Vector3(0, -1e4, 0)); }
  return {
    uSun: { value: new THREE.Vector3(0.9, 0.2, -0.33).normalize() },     // world direction TO the sun
    uTime: { value: 0 }, uGust: { value: 0 },
    uTab: { value: hopToneTable(palette, o) },
    uHead: { value: new THREE.Vector4(0, 0, 0, 1) },                      // headland shadow plane: lit where dot(p,xyz)+w > 0
    uHeadZ: { value: 1e9 },                                               // the headland ends here: everything with world z beyond it is clear of its shadow
    uCar: { value: new THREE.Vector4(0, 0, 0, -1) },                        // the car's shadow screen (hotel-local); off while w < z
    uCastM: { value: new THREE.Matrix4() },                               // world -> hotel-local (set by hero.update)
    uBoxMin: { value: boxMin }, uBoxMax: { value: boxMax },               // caster boxes, hotel-local
    uNoise: { value: tex },
    uSkyTop: { value: new THREE.Vector3(...top) }, uSkyHor: { value: new THREE.Vector3(...hor) },
    uHorizon: { value: 0 }, uWinPer: { value: 7.6 },                                               // dir.y of the sea horizon in window panes
  };
}

// ---- the style, as GLSL. Include STYLE_GLSL in a fragment shader, then call hopTone().
export const STYLE_GLSL = /* glsl */`
uniform vec3 uSun; uniform float uTime; uniform vec3 uTab[${NROW * 3}]; uniform vec4 uHead; uniform float uHeadZ; uniform mat4 uCastM; uniform vec4 uCar;
uniform vec3 uBoxMin[${NBOX}]; uniform vec3 uBoxMax[${NBOX}]; uniform sampler2D uNoise;
uniform vec3 uSkyTop; uniform vec3 uSkyHor; uniform float uHorizon;
vec3 hopTab(float pig, int k){ int i = int(clamp(pig, 0., ${NROW - 1}.) + .5) * 3 + k; return uTab[i]; }
// brush drag: one noise stretched 12:1 along the plane's long (level) axis, in world space. Returns 0..1.
float hopDrag(vec3 p, vec3 n){
  vec2 uv = abs(n.y) > .6 ? vec2(p.x / 12., p.z) : vec2((p.x * n.z - p.z * n.x) / 12., p.y);
  return texture2D(uNoise, uv * .16).r;
}
// the same hand with a loaded brush: streaks a hand wide and metres long. Returns 0..1.
float hopDragB(vec3 p, vec3 n){
  vec2 uv = abs(n.y) > .6 ? vec2(p.x / 12., p.z) : vec2((p.x * n.z - p.z * n.x) / 12., p.y);
  return texture2D(uNoise, uv * .037 + vec2(.37, .61)).r;
}
// the bare sky: the only gradient in the world, cerulean overhead to (2 cream : 1 blue) at the horizon, in level strokes.
vec3 hopSky(vec3 dir){
  float t = clamp(dir.y / .85, 0., 1.);
  t += (texture2D(uNoise, vec2(dir.x * .05 + dir.z * .03, dir.y * 3.)).r - .5) * .05;
  t = clamp(t, 0., 1.); t = 1. - (1. - t) * (1. - t);
  return mix(uSkyHor, uSkyTop, t);
}
// length (m) of the sun ray's chord through the caster boxes: > 0 means the point is in a thrown shadow.
float hopChordL(vec3 p, vec3 s){
  vec3 inv = 1. / (sign(s + 1e-6) * max(abs(s), vec3(1e-4)));
  float v = -1.;
  for (int i = 0; i < ${NBOX}; i++) {
    vec3 t0 = (uBoxMin[i] - p) * inv, t1 = (uBoxMax[i] - p) * inv;
    vec3 a = min(t0, t1), b = max(t0, t1);
    v = max(v, min(min(b.x, b.y), b.z) - max(max(a.x, a.y), max(a.z, 0.)));
  }
  // the unseen car we ride in: a screen in the plane x = uCar.x from z = uCar.z to uCar.w, base at uCar.y, 3.1 m tall, five window holes
  float tc = (uCar.x - p.x) * inv.x; vec3 q = p + s * tc;
  float dc = min(min(q.y - uCar.y, uCar.y + 3.1 - q.y), min(q.z - uCar.z, uCar.w - q.z));
  float per = max(uCar.w - uCar.z, 1e-3) / 5.;
  float dh = min(min(q.y - uCar.y - 1.35, uCar.y + 2.55 - q.y), per * (.36 - abs(fract((q.z - uCar.z) / per) - .5)));
  v = max(v, tc > 0. ? min(dc, -dh) : -1.);
  return v;
}
float hopChord(vec3 pw){ return hopChordL((uCastM * vec4(pw, 1.)).xyz, mat3(uCastM) * uSun); }
float hopCast(vec3 pw, float wob){ float v = hopChord(pw) - .05 + wob; float w = max(fwidth(v), 1e-4) * .75; return smoothstep(-w, w, v); }
// ruled lines (clapboard, ranks): cast-tone, never thinner than 1.5 px, flat average tint when closer than 3 px. c in metres.
// hopRuleW is the same rule with the width of c handed in (cw = fwidth(c)): for a rule laid inside a branch, whose width must be taken before it.
float hopRuleW(float c, float cw, float sp, float hw){
  float fw = max(cw, 1e-5); float d = abs(fract(c / sp + .5) - .5) * sp;
  float h = max(hw, .75 * fw); float a = (1. - smoothstep(h - .5 * fw, h + .5 * fw, d)) * (hw / h);
  return mix(a, 2. * hw / sp, smoothstep(.1, .25, fw / sp));
}
float hopRule(float c, float sp, float hw){ return hopRuleW(c, fwidth(c), sp, hw); }
// THE ROUTINE. pig: surface kind; n: unit world normal of the plane; pw: world position; line: rule spacing (0 = none);
// winLit: for rooms, 1 where the sun comes in at the window (pass -1. outside rooms to use the thrown shadows).
vec3 hopTone(float pig, vec3 n, vec3 pw, float line, float winLit){
  float drag = hopDrag(pw, n), dragB = hopDragB(pw, n);
  float face = step(.03, dot(n, uSun));
  float hd = max(dot(pw, uHead.xyz) + uHead.w, pw.z - uHeadZ); float hw = max(fwidth(hd), 1e-4);
  face *= smoothstep(-hw, hw, hd + (drag - .5) * .04 + (dragB - .5) * .14);
  float thr = winLit < -.5 ? hopCast(pw + n * .04, (drag - .5) * .03 + (dragB - .5) * .12) : 1. - winLit;
  vec3 sunC = hopTab(pig, 0), shC = hopTab(pig, 1), caC = hopTab(pig, 2);
  vec3 col = mix(shC, mix(sunC, caC, thr), face);
  // the rule's wander and its width are taken here, by every pixel, before the branch: taken inside it they are not defined
  // on a pixel whose neighbour lays no rule (the ground, where the ranks stop at a slope)
  float cn = texture2D(uNoise, vec2((pw.x + pw.z) * .11, .37)).r;
  float c = abs(n.y) > .6 ? pw.z : pw.y + (cn - .5) * .034;
  float cw = fwidth(c);
  if (line > .01) {
    float tie = step(16.5, pig);
    float a = hopRuleW(c, cw, line, abs(n.y) > .6 ? mix(.03, line * .29, tie) : .022);
    col = mix(col, mix(mix(caC, mix(shC, caC, .5), face * (1. - thr)), uTab[19], tie), a);
  }
  return col * (1. + (drag - .5) * .07 + (dragB - .5) * .15);
}
`;

const HOP_VERT = /* glsl */`
attribute float aPig; attribute float aLine; attribute vec4 aWind;
#ifdef ROOM
attribute vec3 aWinC; attribute vec3 aWinS; attribute vec3 aWinC2; attribute vec3 aWinS2;
varying vec3 vWinC; varying vec3 vWinS; varying vec3 vWinC2; varying vec3 vWinS2; varying vec3 vL;
#endif
uniform float uTime; uniform float uGust;
varying vec3 vW; varying vec3 vN; varying float vPig; varying float vLine;
void main(){
  vec3 p = position;
  float ph = aWind.w;                                   // wind: xyz = throw (m), w = phase; blinds lift, valances flap
  float g = .5 + .5 * sin(uTime * (1.1 + fract(ph * 3.7)) + ph * 6.283) ; g = g * g * (.6 + .4 * uGust) * (1. + .22 * sin(uTime * 4.3 + ph * 41.));
  p += aWind.xyz * g;
  #ifdef ROOM
  vWinC = aWinC; vWinS = aWinS; vWinC2 = aWinC2; vWinS2 = aWinS2; vL = position;
  #endif
  vec4 w = modelMatrix * vec4(p, 1.); vW = w.xyz; vN = mat3(modelMatrix) * normal; vPig = aPig; vLine = aLine;
  gl_Position = projectionMatrix * viewMatrix * w;
}`;

const HOP_FRAG = /* glsl */`
${STYLE_GLSL}
varying vec3 vW; varying vec3 vN; varying float vPig; varying float vLine;
#ifdef ROOM
varying vec3 vWinC; varying vec3 vWinS; varying vec3 vWinC2; varying vec3 vWinS2; varying vec3 vL; uniform float uWinPer;
// 1 where the sun ray from this point leaves by the window (centre c; s = half width, half height, axis 0:x 1:z)
float winLit(vec3 p, vec3 sl, vec3 c, vec3 s){
  float n = floor(s.z * .5 + .01); float ax = step(.5, s.z - 2. * n);     // s.z = axis + 2 * (windows in the row)
  float pn = mix(p.x, p.z, ax), cn = mix(c.x, c.z, ax), sn = mix(sl.x, sl.z, ax);
  float t = (cn - pn) / (sign(sn + 1e-6) * max(abs(sn), 1e-4));
  vec3 q = p + sl * t;
  float al = mix(q.z, q.x, ax) - mix(c.z, c.x, ax);
  al -= clamp(floor(al / uWinPer + .5), 0., max(n - 1., 0.)) * uWinPer;
  float d = max(abs(al) - s.x, abs(q.y - c.y) - s.y);
  float w = min(max(fwidth(d), 1e-4) * .75, .4);
  float open = 1. - smoothstep(-.05, .05, hopChordL(q + sl * .12, sl) - .1);   // the hotel's own shadow across the window
  return (1. - smoothstep(-w, w, d)) * step(.02, t) * step(.01, s.x) * open;
}
#endif
void main(){
  vec3 n = vN / max(length(vN), 1e-4);
  vec3 col;
  if (abs(vPig - 11.) < .5) {                                    // a far window: sky over a level sea, by the ray, so it parallaxes as a real opening
    vec3 d = vW - cameraPosition; d /= max(length(d), 1e-4);
    float w = max(fwidth(d.y), 1e-5);
    float sea = 1. - smoothstep(-w, w, d.y - uHorizon);
    float rid = hopRule(1. / max(uHorizon - d.y, .004) + uTime * 1.4, 9., .9) * step(d.y, uHorizon);   // the rows march
    col = mix(hopSky(d), mix(mix(uTab[6], uTab[7], .6), uTab[6], rid), sea);
  } else {
    float wl = -1.;
    #ifdef ROOM
    vec3 sl = mat3(uCastM) * uSun;
    wl = max(winLit(vL, sl, vWinC, vWinS), winLit(vL, sl, vWinC2, vWinS2));
    #endif
    col = hopTone(vPig, n, vW, vLine, wl);
  }
  gl_FragColor = vec4(col, 1.);
}`;

// Material factory: the one unlit family. o.room = true adds the window-slab test (needs aWinC/aWinS/aWinC2/aWinS2).
// Geometry must carry position, normal (flat, per plane), aPig, aLine, aWind (vec4, zeros when still).
export function hopMaterial(uniforms, o = {}) {
  return new THREE.ShaderMaterial({
    uniforms, vertexShader: HOP_VERT, fragmentShader: HOP_FRAG, defines: o.room ? { ROOM: 1 } : {},
    side: o.side ?? THREE.FrontSide, fog: false, toneMapped: false,
  });
}

// ---- slab geometry helpers (exported: the world coder builds every other building with these) ----------------------
export function hopGeo() { return { pos: [], nor: [], pig: [], line: [], wind: [], wc: [], ws: [], wc2: [], ws2: [], win: null, win2: null }; }
const Z4 = [0, 0, 0, 0], Z3 = [0, 0, 0];
// one flat slab a,b,c,d (counter-clockwise seen from outside). wind: null, or per-corner [x,y,z,phase] x4.
export function hopQuad(G, a, b, c, d, pig, line = 0, wind = null) {
  const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = d[0] - a[0], vy = d[1] - a[1], vz = d[2] - a[2];
  let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
  const P = [a, b, c, a, c, d], W = wind ? [wind[0], wind[1], wind[2], wind[0], wind[2], wind[3]] : null;
  for (let i = 0; i < 6; i++) {
    G.pos.push(P[i][0], P[i][1], P[i][2]); G.nor.push(nx, ny, nz); G.pig.push(pig); G.line.push(line);
    const w = W ? W[i] : Z4; G.wind.push(w[0], w[1], w[2], w[3]);
    if (G.win) { const a1 = G.win, a2 = G.win2 || Z6; G.wc.push(a1[0], a1[1], a1[2]); G.ws.push(a1[3], a1[4], a1[5]); G.wc2.push(a2[0], a2[1], a2[2]); G.ws2.push(a2[3], a2[4], a2[5]); }
  }
}
const Z6 = [0, 0, 0, 0, 0, 0];
// axis box, outward faces; skip: string of faces to leave out among 'x X y Y z Z' (lower = min side).
export function hopBox(G, x0, y0, z0, x1, y1, z1, pig, line = 0, skip = '', topPig = pig) {
  const q = (a, b, c, d, p = pig, ln = line) => hopQuad(G, a, b, c, d, p, ln);
  if (!skip.includes('x')) q([x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0]);
  if (!skip.includes('X')) q([x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1]);
  if (!skip.includes('y')) q([x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1], pig, 0);
  if (!skip.includes('Y')) q([x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0], topPig, 0);
  if (!skip.includes('z')) q([x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0]);
  if (!skip.includes('Z')) q([x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]);
}
// a wall frame: origin O at the wall's foot, outward normal N (level, unit). u runs to the right seen from outside.
export function hopFrame(O, N) { return { O, N, R: [N[2], 0, -N[0]] }; }
const fp = (F, u, y, d) => [F.O[0] + F.R[0] * u - F.N[0] * d, F.O[1] + y, F.O[2] + F.R[2] * u - F.N[2] * d];
export function hopRect(G, F, u0, y0, u1, y1, d, pig, line = 0, wind = null) {
  if (u1 - u0 < 1e-4 || y1 - y0 < 1e-4) return;
  hopQuad(G, fp(F, u0, y0, d), fp(F, u1, y0, d), fp(F, u1, y1, d), fp(F, u0, y1, d), pig, line, wind);
}
// a board standing proud of the wall by t (front and four edges)
export function hopBoard(G, F, u0, y0, u1, y1, t, pig, line = 0, d0 = 0) {
  hopRect(G, F, u0, y0, u1, y1, d0 - t, pig, line);
  hopQuad(G, fp(F, u0, y1, d0 - t), fp(F, u1, y1, d0 - t), fp(F, u1, y1, d0), fp(F, u0, y1, d0), pig);
  hopQuad(G, fp(F, u0, y0, d0), fp(F, u1, y0, d0), fp(F, u1, y0, d0 - t), fp(F, u0, y0, d0 - t), pig);
  hopQuad(G, fp(F, u0, y0, d0), fp(F, u0, y0, d0 - t), fp(F, u0, y1, d0 - t), fp(F, u0, y1, d0), pig);
  hopQuad(G, fp(F, u1, y0, d0 - t), fp(F, u1, y0, d0), fp(F, u1, y1, d0), fp(F, u1, y1, d0 - t), pig);
}
// a wall with rectangular holes [{u, hw, y0, y1}] (sorted by u)
export function hopWall(G, F, u0, u1, y0, y1, holes, pig, line = 0) {
  let u = u0;
  for (const h of holes) {
    hopRect(G, F, u, y0, h.u - h.hw, y1, 0, pig, line);
    hopRect(G, F, h.u - h.hw, y0, h.u + h.hw, h.y0, 0, pig, line);
    hopRect(G, F, h.u - h.hw, h.y1, h.u + h.hw, y1, 0, pig, line);
    u = h.u + h.hw;
  }
  hopRect(G, F, u, y0, u1, y1, 0, pig, line);
}
// the window: a real reveal 0.3 m deep, a lit sill, a hood, a meeting rail and a blind at its own height.
// o: { blind: 0..1 drop, blindPig, phase, glass: true to close the back with a blue-black slab, rev: reveal depth, big: true for mullions }
export function hopWindow(G, F, h, o = {}) {
  const r = o.rev ?? 0.3, a = h.u - h.hw, b = h.u + h.hw, W = PIG.WHITE;
  hopQuad(G, fp(F, a, h.y0, 0), fp(F, a, h.y0, r), fp(F, a, h.y1, r), fp(F, a, h.y1, 0), W);       // jambs
  hopQuad(G, fp(F, b, h.y0, r), fp(F, b, h.y0, 0), fp(F, b, h.y1, 0), fp(F, b, h.y1, r), W);
  hopQuad(G, fp(F, a, h.y0, 0), fp(F, b, h.y0, 0), fp(F, b, h.y0, r), fp(F, a, h.y0, r), W);       // inner sill (catches sun)
  hopQuad(G, fp(F, a, h.y1, r), fp(F, b, h.y1, r), fp(F, b, h.y1, 0), fp(F, a, h.y1, 0), W);       // head
  hopBoard(G, F, a - 0.14, h.y0 - 0.13, b + 0.14, h.y0, 0.15, W);                                   // sill
  hopBoard(G, F, a - 0.2, h.y1, b + 0.2, h.y1 + 0.16, 0.13, W);                                     // hood
  hopBoard(G, F, a - 0.13, h.y0, a, h.y1, 0.035, W); hopBoard(G, F, b, h.y0, b + 0.13, h.y1, 0.035, W); // casing
  const ym = (h.y0 + h.y1) * 0.5;
  if (o.big) {
    const yt = h.y1 - (h.y1 - h.y0) * 0.3, bar = (u0, y0, u1, y1) => { hopBoard(G, F, u0, y0, u1, y1, 0.08, W, 0, r * 0.55); hopQuad(G, fp(F, u1, y0, r * 0.55), fp(F, u0, y0, r * 0.55), fp(F, u0, y1, r * 0.55), fp(F, u1, y1, r * 0.55), W); };
    const nl = o.lights ?? 3; for (let k = 1; k < nl; k++) { const um = a + (b - a) * k / nl; bar(um - 0.06, h.y0, um + 0.06, h.y1); }
    bar(a, yt, b, yt + 0.12);
  } else if (!o.open) hopBoard(G, F, a, ym - 0.04, b, ym + 0.04, 0.05, W, 0, r * 0.72);              // meeting rail
  else if (!o.clear) hopBoard(G, F, a, h.y1 - 0.5, b, h.y1 - 0.42, 0.05, W, 0, r * 0.72);                          // sash thrown up
  if (o.blind > 0.01) {
    const yb = h.y1 - (h.y1 - h.y0) * o.blind, ph = o.phase ?? 0, lift = [0, 0.42, 0, ph];   // a hand's breadth at the wind's rest level (a third of the throw)
    hopRect(G, F, a, yb, b, h.y1, r * 0.55, o.blindPig ?? PIG.STRAW, 0, [lift, lift, Z4, Z4]);
    hopRect(G, F, h.u - 0.03, yb - 0.16, h.u + 0.03, yb, r * 0.55, PIG.WHITE, 0, [lift, lift, lift, lift]);   // the pull
  }
  if (o.glass) hopRect(G, F, a, h.y0, b, h.y1, r, PIG.DARK);
}
export function hopFinish(G, room = false) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(G.pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(G.nor, 3));
  g.setAttribute('aPig', new THREE.Float32BufferAttribute(G.pig, 1));
  g.setAttribute('aLine', new THREE.Float32BufferAttribute(G.line, 1));
  g.setAttribute('aWind', new THREE.Float32BufferAttribute(G.wind, 4));
  if (room) {
    g.setAttribute('aWinC', new THREE.Float32BufferAttribute(G.wc, 3)); g.setAttribute('aWinS', new THREE.Float32BufferAttribute(G.ws, 3));
    g.setAttribute('aWinC2', new THREE.Float32BufferAttribute(G.wc2, 3)); g.setAttribute('aWinS2', new THREE.Float32BufferAttribute(G.ws2, 3));
  }
  g.computeBoundingSphere(); g.computeBoundingBox();
  return g;
}

// ---- thrown shadows of small things (sills, hoods, boards, brackets, poles): instanced slabs sheared by the sun ----
// Each entry is four points (hotel-local or world if uCastM is identity... they ride the mesh's own matrix) which the
// vertex shader slides along the sun ray onto the receiver plane; points already on the plane stay. The slab is painted
// in the receiver's own cast tone (opaque, 1.5 cm proud), so overlaps never double and a shadow is a colour.
export function hopShadowBoard(list, F, u0, y0, u1, y1, t, pig = PIG.WHITE, line = 0) {
  const pl = [F.N[0], F.N[1], F.N[2], -(F.N[0] * F.O[0] + F.N[2] * F.O[2])];
  const a = [u0, y0], b = [u1, y0], c = [u1, y1], d = [u0, y1], E = [[a, b], [b, c], [c, d], [d, a]];
  for (const [p, q] of E) list.push({ p: [fp(F, p[0], p[1], 0), fp(F, q[0], q[1], 0), fp(F, q[0], q[1], -t), fp(F, p[0], p[1], -t)], pl, pig, line });
  list.push({ p: [a, b, c, d].map((k) => fp(F, k[0], k[1], -t)), pl, pig, line });
}
export function hopShadowMesh(uniforms, list) {
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0, 1, 0, 0, 2, 0, 0, 3, 0, 0], 3)); g.setIndex([0, 1, 2, 0, 2, 3]);
  const at = (name, n, f) => { const a = new Float32Array(Math.max(1, list.length) * n); list.forEach((c, i) => a.set(f(c), i * n)); g.setAttribute(name, new THREE.InstancedBufferAttribute(a, n)); };
  for (let k = 0; k < 4; k++) at('aP' + k, 3, (c) => c.p[k]);
  at('aPl', 4, (c) => c.pl); at('aPg', 2, (c) => [c.pig, c.line]);
  g.instanceCount = list.length;
  const m = new THREE.ShaderMaterial({
    uniforms, side: THREE.DoubleSide, toneMapped: false,
    vertexShader: /* glsl */`
      attribute vec3 aP0; attribute vec3 aP1; attribute vec3 aP2; attribute vec3 aP3; attribute vec4 aPl; attribute vec2 aPg;
      uniform vec3 uSun; uniform mat4 uCastM; varying vec3 vW; varying vec3 vN; varying vec2 vPg;
      void main(){
        vec3 P = position.x < .5 ? aP0 : position.x < 1.5 ? aP1 : position.x < 2.5 ? aP2 : aP3;
        vec3 sl = mat3(uCastM) * uSun; float ns = dot(aPl.xyz, sl);
        float t = (dot(aPl.xyz, P) + aPl.w) / max(ns, .03);
        vec4 w = modelMatrix * vec4(P - sl * t + aPl.xyz * .015, 1.);
        vW = w.xyz; vN = mat3(modelMatrix) * aPl.xyz; vPg = aPg;
        gl_Position = ns < .03 ? vec4(2., 2., 2., 1.) : projectionMatrix * viewMatrix * w;
      }`,
    fragmentShader: /* glsl */`
      ${STYLE_GLSL}
      varying vec3 vW; varying vec3 vN; varying vec2 vPg;
      void main(){ vec3 n = vN / max(length(vN), 1e-4); gl_FragColor = vec4(hopTone(vPg.x, n, vW, vPg.y, 0.), 1.); }`,
  });
  const mesh = new THREE.Mesh(g, m); mesh.frustumCulled = false; mesh.name = 'thrown-shadows';
  return mesh;
}

// ---- the hotel ------------------------------------------------------------------------------------------------------
const WHW0 = 1.3, WHW = WHW0, HL = 85, HW = 4.5, BAY = 6.8, NB = 25, EAVE = 18, FLOORS = [0.3, 3.9, 8.6, 13.3], TOWER_B0 = 11, TOWER_NB = 3, TOWER_X = 6, TOWER_EAVE = 23.2;
// The storey at the eye (s = 1) has the hotel's best rooms: wide windows in four lights, low sills, 5.1 m of opening to a 6.8 m bay,
// so from the flank run each room is seen into whole: the dark box, the slab on its floor, the far window's square of sea.
const BIG_S = 1, BIG_HW = 2.55, BIG_Y0 = 0.45, BIG_H = 3.3;
const WING_X0 = -70, WING_Z1 = HL + 14, WING_EAVE = 10.6, WING_FLOOR = 3.0, EYE_Y = 6.3;

// one facade of nb bays starting at frame-u = 0, with its rooms behind (rooms only when R is given).
// bl: blind drops [storey][bay] of this side; far: those of the opposite side (they shorten each room's slab).
let _Y = null;                                                  // the builder's yield (set by buildHero): a facade is laid a storey to a step
async function facade(G, R, F, nb, depth, tops, bl, far, o) {
  for (let s = 0; s < tops.length - 1; s++) {
    if (_Y) await _Y();
    const fl = tops[s], top = tops[s + 1], gr = s === 0 && !(o && o.upper), big = s === BIG_S && !(o && o.upper), WHW = big ? BIG_HW : WHW0, y0 = fl + (big ? BIG_Y0 : 0.7), y1 = y0 + (gr ? 2.2 : big ? BIG_H : 2.9), holes = [];
    for (let i = 0; i < nb; i++) holes.push({ u: (i + 0.5) * BAY, hw: WHW, y0, y1 });
    hopWall(G, F, 0, nb * BAY, gr ? 0 : fl, top, holes, PIG.WALL, 0.78);
    for (let i = 0; i < nb; i++) {
      const b = bl[s][i], h = holes[i];
      hopWindow(G, F, h, { blind: b.drop, blindPig: b.pig, phase: b.ph, glass: !R, open: b.open, big: big && !b.open, lights: 4 });
      hopQuad(G, fp(F, h.u - WHW - 0.14, y0 - 0.13, -0.012), fp(F, h.u - WHW - 0.4, y0 - 0.42, -0.012), fp(F, h.u + WHW - 0.12, y0 - 0.42, -0.012), fp(F, h.u + WHW + 0.14, y0 - 0.13, -0.012), PIG.WALLDEEP, 0.78);
      if (!R) continue;
      const fb = far[s][nb - 1 - i], u0 = i * BAY + 0.1, u1 = u0 + BAY - 0.2, d0 = 0.3, d1 = depth - 0.3, yf = fl + 0.05, yc = top - 0.3;
      const hl = y1 - (y1 - y0) * fb.drop, c = fp(F, h.u, (y0 + hl) * 0.5, d1);
      R.win = [c[0], c[1], c[2], WHW, Math.max(0, (hl - y0) * 0.5), 0];
      hopQuad(R, fp(F, u0, yf, d0), fp(F, u1, yf, d0), fp(F, u1, yf, d1), fp(F, u0, yf, d1), PIG.ROOMFLOOR);
      hopQuad(R, fp(F, u0, yc, d1), fp(F, u1, yc, d1), fp(F, u1, yc, d0), fp(F, u0, yc, d0), PIG.ROOMCEIL);
      hopQuad(R, fp(F, u0, yf, d0), fp(F, u0, yf, d1), fp(F, u0, yc, d1), fp(F, u0, yc, d0), PIG.ROOMWALL);
      hopQuad(R, fp(F, u1, yf, d1), fp(F, u1, yf, d0), fp(F, u1, yc, d0), fp(F, u1, yc, d1), PIG.ROOMWALL);
      hopRect(R, F, u0, yf, h.u - WHW, yc, d1, PIG.ROOMWALL); hopRect(R, F, h.u + WHW, yf, u1, yc, d1, PIG.ROOMWALL);
      hopRect(R, F, h.u - WHW, yf, h.u + WHW, y0, d1, PIG.ROOMWALL); hopRect(R, F, h.u - WHW, hl, h.u + WHW, yc, d1, PIG.ROOMWALL);
      hopRect(R, F, h.u - WHW, y0, h.u + WHW, hl, d1, PIG.PANE);
      hopRect(R, F, h.u - WHW, y0 - 0.1, h.u + WHW, y0, d1 - 0.12, PIG.ROOMCEIL);              // the far sill, a pale stroke
      if (o && o.bed && o.bed(s, i)) {                                                           // a made bed: one slab and a headboard
        const bu = u0 + 0.5, bw = 1.5; R.win2 = null;
        hopQuad(R, fp(F, bu, yf + 0.55, d0 + 2.2), fp(F, bu + bw, yf + 0.55, d0 + 2.2), fp(F, bu + bw, yf + 0.55, d0 + 4.3), fp(F, bu, yf + 0.55, d0 + 4.3), PIG.ROOMCEIL);
        hopQuad(R, fp(F, bu + bw, yf, d0 + 2.2), fp(F, bu + bw, yf, d0 + 4.3), fp(F, bu + bw, yf + 0.55, d0 + 4.3), fp(F, bu + bw, yf + 0.55, d0 + 2.2), PIG.ROOMWALL);
        hopRect(R, F, bu, yf, bu + bw, yf + 0.55, d0 + 2.2, PIG.ROOMWALL);
        hopRect(R, F, bu, yf, bu + bw, yf + 1.15, d0 + 4.3, PIG.ROOMWALL);
      }
    }
  }
}

export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng.fork ? ctx.rng.fork('nobody-up-yet-hotel') : ctx.rng, detail = opts.detail ?? ctx.quality?.detail ?? 1;
  const palette = opts.palette ?? HOP_PALETTE;
  const strawR = rng() < 0.22;
  const straw = opts.colourway ? opts.colourway === 'straw' : strawR;       // a straw-yellow hotel with white trim, now and then
  const october = !!opts.october;
  const wallHex = straw ? '#' + _mx(_hex(palette[0]), _hex(palette[3]), 0.55).map((v) => Math.round(v * 255).toString(16).padStart(2, '0')).join('') : null;
  const U = opts.uniforms ?? makeHopUniforms(palette, { wall: wallHex, october, seed: Math.floor(rng() * 1e6) });
  await ctx.yield(); _Y = ctx.yield;
  const mat = hopMaterial(U), roomMat = hopMaterial(U, { room: true });
  const root = new THREE.Group(); root.name = 'hotel';
  const G = hopGeo(), R = hopGeo();

  // blinds: no two at the same height. [side][storey][bay]
  const heroBay0 = 21 + Math.floor(rng() * 3), heroBay = opts.heroBay ?? heroBay0, heroStorey = 1;
  const mkBlinds = (nb, west) => FLOORS.map((_, s) => Array.from({ length: nb }, (_, i) => {
    const r = rng(), r2 = rng(), r3 = rng(), r4 = rng();
    return { drop: october ? 0.97 : (r < 0.07 ? 0 : 0.12 + 0.7 * r2 * (0.6 + 0.4 * r)), pig: r3 < 0.42 ? PIG.GREEN : PIG.STRAW, ph: r4, open: false, curtain: west && r4 < (opts.curtainShare ?? 0.13) * (october ? 0.5 : 1) * Math.min(1, detail + 0.2) && s > 0 };
  }));
  const side = TOWER_B0 * BAY;                                                    // length of each flank beside the tower
  const blW = [mkBlinds(TOWER_B0, 1), mkBlinds(TOWER_NB, 1), mkBlinds(NB - TOWER_B0 - TOWER_NB, 1)];
  const blE = [mkBlinds(NB - TOWER_B0 - TOWER_NB, 0), mkBlinds(TOWER_NB, 0), mkBlinds(TOWER_B0, 0)];
  for (const [cs, ci] of opts.openBays || [[1, 1], [1, 3], [2, 2]]) blW[2][cs][ci].curtain = true;   // room after room: at the closest pass a curtain breathes in the nearest windows
  for (const [cs, ci] of opts.curtainBays || []) blW[2][cs][ci].curtain = true;   // south-run windows the world wants a short curtain breathing in
  const hb = heroBay < TOWER_B0 ? blW[0][heroStorey][heroBay] : blW[2][heroStorey][heroBay - TOWER_B0 - TOWER_NB]; hb.drop = 0.1; hb.open = true; hb.curtain = true; hb.hero = true;   // the long curtain's bay may lie north or south of the tower
  for (const [cs, ci] of opts.clearBays || []) { const b = blW[0][cs][ci]; b.drop = 0; b.curtain = false; }   // north-run windows the world wants bare (its rare event)
  for (const [cs, ci] of opts.bareBays || []) { const b = blW[2][cs][ci]; b.drop = Math.min(b.drop, 0.12); b.curtain = false; }   // south-run windows the world wants seen into square-on
  for (const seg of blW) for (const st of seg) for (const b of st) if (b.curtain) { b.open = true; b.drop = Math.min(b.drop, 0.3); }
  for (const [cs, ci] of opts.openBays || []) { const b = blW[2][cs][ci]; b.drop = 0; b.open = true; b.curtain = false; }   // a south-run window the world flies up to: sash thrown up, no blind
  // the storey at the eye (s = 1): most sashes are raised, so each room is seen into as we pass; in October most blinds are
  // down but some rooms keep theirs up. The far blind of such a room is up too, so the sun's slab lies on its floor.
  {
    const hsh = (s, i, k) => { const v = Math.sin(s * 12.9898 + i * 78.233 + k * 37.719) * 43758.5453; return v - Math.floor(v); };
    // THE EYE STOREY'S OWN RULE, from the storey's number (1) and the bay's number n in the building (0 at the north end to 24
    // at the wing) by the hash above, nothing drawn from the seed's stream: each blind hangs at its own height in the top
    // quarter of its window, a hand's breadth (0.03 of 3.3 m) to a quarter. Of up to 48 heights the hash gives for a bay the
    // one with the least fault is taken, the first that has none: the heaviest fault is to hang within 0.18 m of the
    // neighbour's (a quarter of the range), then to make a fourth bay of a rising or falling run at every bay, every second or
    // every third (a stair), then a fourth turn of plain up-down-up-down, then to come back within 5 cm of the height two,
    // three or four bays before (a repeat). Straw or dark green, never a fourth alike in a row; by this rule a sash is raised
    // here and there, never in two neighbours (the seed's own curtained bays stand open besides, as they did), and from half
    // of those a short curtain breathes out past the sill.
    const N0 = [0, TOWER_B0, TOWER_B0 + TOWER_NB], eye = [];
    for (let n = 0, NB = N0[2] + blW[2][1].length; n < NB; n++) {
      const Q = (k) => eye[n - k].q, near = (q, k, d) => n >= k && Math.abs(q - Q(k)) < d;
      const stair = (q, k) => n >= 3 * k && (q - Q(k)) * (Q(k) - Q(2 * k)) > 0 && (Q(k) - Q(2 * k)) * (Q(2 * k) - Q(3 * k)) > 0;
      const zig = (q) => n >= 4 && (q - Q(1)) * (Q(1) - Q(2)) < 0 && (Q(1) - Q(2)) * (Q(2) - Q(3)) < 0 && (Q(2) - Q(3)) * (Q(3) - Q(4)) < 0;
      const fault = (q) => 16 * near(q, 1, 0.25) + 4 * (stair(q, 1) + stair(q, 2) + stair(q, 3)) + 2 * zig(q) + near(q, 2, 0.07) + near(q, 3, 0.07) + near(q, 4, 0.07);
      let q = hsh(1, n, 40), f = fault(q);
      for (let j = 1; j < 48 && f > 0; j++) { const c = hsh(1, n, 40 + j), g = fault(c); if (g < f) { q = c; f = g; } }
      const alike = n >= 3 && eye[n - 1].green === eye[n - 2].green && eye[n - 2].green === eye[n - 3].green;
      const open = !(n && eye[n - 1].open) && hsh(1, n, 23) < 0.36;
      eye.push({ q, green: alike ? !eye[n - 1].green : hsh(1, n, 29) < 0.42, open, curtain: open && hsh(1, n, 31) < 0.5 });
    }
    [[blW[0], blE[2]], [blW[1], blE[1]], [blW[2], blE[0]]].forEach(([w, e], k) => w.forEach((st, s) => st.forEach((b, i) => {
      const h = hsh(s, i, k), up = b.hero || (october ? (s === 1 ? h < 0.5 : h < 0.14) : s === 1), n = N0[k] + i;
      if (!up) return;
      if (s === 1 && !october) {
        const v = eye[n]; b.drop = 0.03 + 0.22 * v.q; b.pig = v.green ? PIG.GREEN : PIG.STRAW;
        if (v.open) { b.open = true; if (v.curtain) b.curtain = true; }
      } else b.drop = Math.min(b.drop, 0.03 + (s === 1 ? 0.22 : 0.3) * hsh(s, i, k + 7));
      const f = e[s][st.length - 1 - i]; f.drop = Math.min(f.drop, 0.04 + 0.3 * hsh(s, i, k + 13));
    })));
  }
  const tops = [...FLOORS, EAVE];
  const bedAt = (s, i) => detail >= 0.8 && ((s * 7 + i * 3) % 5) === 1;
  // west flank (shade): north run, tower front, south run; each with its rooms
  const zT0 = -HL + side, zT1 = zT0 + TOWER_NB * BAY;
  await facade(G, R, hopFrame([-HW, 0, -HL], [-1, 0, 0]), TOWER_B0, 2 * HW, tops, blW[0], blE[2], { bed: bedAt });
  await ctx.yield();
  await facade(G, R, hopFrame([-TOWER_X, 0, zT0], [-1, 0, 0]), TOWER_NB, 2 * TOWER_X, tops, blW[1], blE[1], { bed: bedAt });
  await ctx.yield();
  await facade(G, R, hopFrame([-HW, 0, zT1], [-1, 0, 0]), TOWER_B0, 2 * HW, tops, blW[2], blE[0], { bed: bedAt });
  await ctx.yield();
  // east flank (sun), closed by blue-black slabs
  await facade(G, null, hopFrame([HW, 0, HL], [1, 0, 0]), TOWER_B0, 0, tops, blE[0], null);
  await ctx.yield();
  await facade(G, null, hopFrame([TOWER_X, 0, zT1], [1, 0, 0]), TOWER_NB, 0, tops, blE[1], null);
  await facade(G, null, hopFrame([HW, 0, zT0], [1, 0, 0]), TOWER_B0, 0, tops, blE[2], null);
  await ctx.yield();
  // ends: the north end is the cream slab (one window to a storey), the south end shows above the wing
  const SH = [];
  const endWall = (F, w, us, tops2, y0min, hw = WHW) => {
    for (let s = 0; s < tops2.length - 1; s++) {
      const fl = tops2[s], top = tops2[s + 1], y0 = fl + 0.7, holes = fl < y0min ? [] : us.map((u) => ({ u, hw, y0, y1: y0 + 2.9 }));
      hopWall(G, F, 0, w, s === 0 ? 0 : fl, top, holes, PIG.WALL, 0.78);
      for (const h of holes) {
        hopWindow(G, F, h, { blind: october ? 0.97 : 0.15 + 0.6 * rng(), blindPig: rng() < 0.4 ? PIG.GREEN : PIG.STRAW, phase: rng(), glass: true });
        hopShadowBoard(SH, F, h.u - hw - 0.14, h.y0 - 0.13, h.u + hw + 0.14, h.y0, 0.15, PIG.WALL, 0.78);
        hopShadowBoard(SH, F, h.u - hw - 0.2, h.y1, h.u + hw + 0.2, h.y1 + 0.16, 0.13, PIG.WALL, 0.78);
        hopShadowBoard(SH, F, h.u - hw - 0.13, h.y0, h.u - hw, h.y1, 0.035, PIG.WALL, 0.78); hopShadowBoard(SH, F, h.u + hw, h.y0, h.u + hw + 0.13, h.y1, 0.035, PIG.WALL, 0.78);
      }
      hopShadowBoard(SH, F, 0, 0, 0.32, tops2[tops2.length - 1], 0.06, PIG.WALL, 0.78); hopShadowBoard(SH, F, w - 0.32, 0, w, tops2[tops2.length - 1], 0.06, PIG.WALL, 0.78);
    }
  };
  endWall(hopFrame([HW, 0, -HL], [0, 0, -1]), 2 * HW, [2 * HW * (0.3 + 0.4 * rng())], tops, 0);
  endWall(hopFrame([-HW, 0, HL], [0, 0, 1]), 2 * HW, [HW], tops, 13);
  const tTops = [0, EAVE, TOWER_EAVE];
  endWall(hopFrame([TOWER_X, 0, zT0], [0, 0, -1]), 2 * TOWER_X, [], tTops, 99);
  endWall(hopFrame([-TOWER_X, 0, zT1], [0, 0, 1]), 2 * TOWER_X, [], tTops, 99);
  const upB = () => [Array.from({ length: TOWER_NB }, () => ({ drop: october ? 0.97 : 0.1 + 0.7 * rng(), pig: rng() < 0.4 ? PIG.GREEN : PIG.STRAW, ph: rng() }))];
  await facade(G, null, hopFrame([-TOWER_X, 0, zT0], [-1, 0, 0]), TOWER_NB, 0, [EAVE, TOWER_EAVE], upB(), null, { upper: 1 });
  await facade(G, null, hopFrame([TOWER_X, 0, zT1], [1, 0, 0]), TOWER_NB, 0, [EAVE, TOWER_EAVE], upB(), null, { upper: 1 });
  // trim: corner boards, frieze, water table (boards standing proud, so each keeps its own lit edge)
  const trim = (F, w, top, cornerL = true, cornerR = true) => {
    if (cornerL) hopBoard(G, F, 0, 0, 0.32, top, 0.06, PIG.WHITE);
    if (cornerR) hopBoard(G, F, w - 0.32, 0, w, top, 0.06, PIG.WHITE);
    hopBoard(G, F, 0, top - 0.6, w, top, 0.07, PIG.WHITE); hopBoard(G, F, 0, 0, w, 0.32, 0.09, PIG.WHITE);
  };
  trim(hopFrame([-HW, 0, -HL], [-1, 0, 0]), side, EAVE, true, false); trim(hopFrame([-HW, 0, zT1], [-1, 0, 0]), side, EAVE, false, true);
  trim(hopFrame([HW, 0, HL], [1, 0, 0]), side, EAVE, true, false); trim(hopFrame([HW, 0, zT0], [1, 0, 0]), side, EAVE, false, true);
  trim(hopFrame([-TOWER_X, 0, zT0], [-1, 0, 0]), TOWER_NB * BAY, TOWER_EAVE); trim(hopFrame([TOWER_X, 0, zT1], [1, 0, 0]), TOWER_NB * BAY, TOWER_EAVE);
  trim(hopFrame([HW, 0, -HL], [0, 0, -1]), 2 * HW, EAVE); trim(hopFrame([-HW, 0, HL], [0, 0, 1]), 2 * HW, EAVE);
  trim(hopFrame([TOWER_X, 0, zT0], [0, 0, -1]), 2 * TOWER_X, TOWER_EAVE); trim(hopFrame([-TOWER_X, 0, zT1], [0, 0, 1]), 2 * TOWER_X, TOWER_EAVE);
  // eave slab and brackets
  const OV = 0.85;
  hopBox(G, -HW - OV, EAVE, -HL - OV, HW + OV, EAVE + 0.45, HL + OV, PIG.WHITE, 0, '', PIG.ROOF);
  for (let k = 0; k * 3.4 + 1.7 < 2 * HL; k++) {
    const z = -HL + 1.7 + k * 3.4; if (z > zT0 - 0.5 && z < zT1 + 0.5) continue;
    for (const sx of [-1, 1]) hopBox(G, sx < 0 ? -HW - OV + 0.15 : HW, EAVE - 0.55, z - 0.12, sx < 0 ? -HW : HW + OV - 0.15, EAVE, z + 0.12, PIG.WHITE, 0, sx < 0 ? 'XY' : 'xY');
  }
  await ctx.yield();
  // mansard: a steep slab each side, a flat deck, a curb; dormers on every other bay
  const frustum = (x0, x1, z0, z1, y0, y1, inx, inz, pig, ln) => {
    const a = [x0, y0, z0], b = [x1, y0, z0], c = [x1, y0, z1], d = [x0, y0, z1];
    const A = [x0 + inx, y1, z0 + inz], B = [x1 - inx, y1, z0 + inz], C = [x1 - inx, y1, z1 - inz], D = [x0 + inx, y1, z1 - inz];
    hopQuad(G, b, a, A, B, pig, ln); hopQuad(G, c, b, B, C, pig, ln); hopQuad(G, d, c, C, D, pig, ln); hopQuad(G, a, d, D, A, pig, ln);
    hopQuad(G, D, C, B, A, pig, 0);
  };
  const MY0 = EAVE + 0.45, MY1 = MY0 + 4.1;
  frustum(-HW - 0.3, HW + 0.3, -HL - 0.3, HL + 0.3, MY0, MY1, 1.45, 1.45, PIG.ROOF, 0.52);
  hopBox(G, -HW + 1.05, MY1 - 0.05, -HL + 1.05, HW - 1.05, MY1 + 0.22, HL - 1.05, PIG.WHITE, 0, 'y', PIG.ROOF);
  const dormer = (F, u, y0, hw, hh, out, bl) => {                              // F: frame at the roof's foot plane
    const y1 = y0 + hh, back = 1.5;
    hopWall(G, { ...F, O: [F.O[0] + F.N[0] * out, F.O[1], F.O[2] + F.N[2] * out] }, u - hw - 0.22, u + hw + 0.22, y0, y1 + 0.2, [{ u, hw, y0: y0 + 0.25, y1 }], PIG.WHITE);
    const Fo = { ...F, O: [F.O[0] + F.N[0] * out, F.O[1], F.O[2] + F.N[2] * out] };
    hopWindow(G, Fo, { u, hw, y0: y0 + 0.25, y1 }, { blind: bl, blindPig: rng() < 0.5 ? PIG.GREEN : PIG.STRAW, phase: rng(), glass: true, rev: 0.18 });
    const a = u - hw - 0.22, b = u + hw + 0.22;
    hopQuad(G, fp(Fo, a, y0, back), fp(Fo, a, y0, 0), fp(Fo, a, y1 + 0.2, 0), fp(Fo, a, y1 + 0.2, back), PIG.ROOF);          // cheeks
    hopQuad(G, fp(Fo, b, y0, 0), fp(Fo, b, y0, back), fp(Fo, b, y1 + 0.2, back), fp(Fo, b, y1 + 0.2, 0), PIG.ROOF);
    hopQuad(G, fp(Fo, a - 0.15, y1 + 0.2, -0.2), fp(Fo, b + 0.15, y1 + 0.2, -0.2), fp(Fo, b + 0.15, y1 + 0.45, back), fp(Fo, a - 0.15, y1 + 0.45, back), PIG.ROOF);   // lid
    hopBoard(G, Fo, a - 0.15, y1 + 0.05, b + 0.15, y1 + 0.2, 0.2, PIG.WHITE);
  };
  await ctx.yield();
  for (let i = 0; i < NB; i++) {
    if (i >= TOWER_B0 && i < TOWER_B0 + TOWER_NB) continue;
    const z = -HL + (i + 0.5) * BAY, on = (i % 2 === 0);
    if (on) dormer(hopFrame([-HW - 0.3, 0, -HL], [-1, 0, 0]), z + HL, MY0 + 0.75, 0.6, 2.0, 0.05, october ? 0.97 : 0.2 + 0.6 * rng());
    if (on || rng() < 0.3) dormer(hopFrame([HW + 0.3, 0, HL], [1, 0, 0]), HL - z, MY0 + 0.75, 0.6, 2.0, 0.05, october ? 0.97 : 0.2 + 0.6 * rng());
  }
  // the tower: a fifth storey, its own eave, a steep cap, a pole
  hopBox(G, -TOWER_X - OV, TOWER_EAVE, zT0 - OV, TOWER_X + OV, TOWER_EAVE + 0.45, zT1 + OV, PIG.WHITE, 0, '', PIG.ROOF);
  const TY0 = TOWER_EAVE + 0.45, capH = 5.0 + 1.6 * rng(), TY1 = TY0 + capH;
  frustum(-TOWER_X - 0.3, TOWER_X + 0.3, zT0 - 0.3, zT1 + 0.3, TY0, TY1, 2.3, 2.3, PIG.ROOF, 0.52);
  hopBox(G, -TOWER_X + 1.7, TY1 - 0.05, zT0 + 1.7, TOWER_X - 1.7, TY1 + 0.25, zT1 - 1.7, PIG.WHITE, 0, 'y', PIG.ROOF);
  dormer(hopFrame([-TOWER_X - 0.3, 0, zT0], [-1, 0, 0]), TOWER_NB * BAY * 0.5, TY0 + 0.8, 0.75, 2.3, 0.05, 0.3);
  dormer(hopFrame([TOWER_X + 0.3, 0, zT1], [1, 0, 0]), TOWER_NB * BAY * 0.5, TY0 + 0.8, 0.75, 2.3, 0.05, 0.5);
  const poleTop = TY1 + 8.5, zc0 = (zT0 + zT1) * 0.5;
  hopBox(G, -0.11, TY1 + 0.2, zc0 - 0.11, 0.11, poleTop, zc0 + 0.11, PIG.WHITE, 0, 'y');
  hopBox(G, -0.24, poleTop, zc0 - 0.24, 0.24, poleTop + 0.4, zc0 + 0.24, PIG.WHITE);
  // chimneys, plastered white (light red is never on the hotel)
  const nCh = 5 + Math.floor(rng() * 3);
  for (let k = 0; k < nCh; k++) {
    let z = -HL + 12 + (k + 0.2 + 0.6 * rng()) * (2 * HL - 24) / nCh; if (z > zT0 - 2 && z < zT1 + 2) z = zT0 - 3;
    const x = (rng() < 0.5 ? -1 : 1) * 0.9, h = 2.2 + rng() * 1.2;
    hopBox(G, x - 0.55, MY1 + 0.2, z - 0.7, x + 0.55, MY1 + h, z + 0.7, PIG.WHITE, 0, 'y');
    hopBox(G, x - 0.68, MY1 + h, z - 0.83, x + 0.68, MY1 + h + 0.22, z + 0.83, PIG.WHITE, 0, '', PIG.DARK);
  }
  // the veranda along the west flank: the near horizontal
  const VX = -HW - 3.2, VY0 = 3.05, VY1 = 3.6;
  hopQuad(G, [VX, VY0, HL], [-HW, VY1, HL], [-HW, VY1, -HL], [VX, VY0, -HL], PIG.TIN, 1.36);
  hopQuad(G, [VX, VY0 - 0.12, -HL], [-HW, VY1 - 0.12, -HL], [-HW, VY1 - 0.12, HL], [VX, VY0 - 0.12, HL], PIG.WHITE, 0);
  hopBox(G, VX - 0.06, VY0 - 0.42, -HL, VX, VY0 + 0.02, HL, PIG.WHITE, 0, 'X');
  hopQuad(G, [-HW, VY0 - 0.42, -HL], [VX, VY0 - 0.42, -HL], [VX, VY0, -HL], [-HW, VY1, -HL], PIG.WHITE);
  hopBox(G, VX, 0, -HL, -HW, 0.3, HL, PIG.WHITE, 0, 'yX', PIG.STREET);
  for (let k = 0; k <= 50; k++) {
    const z = -HL + 0.12 + k * (2 * HL - 0.24) / 50;
    hopBox(G, VX + 0.04, 0.3, z - 0.1, VX + 0.24, VY0 - 0.42, z + 0.1, PIG.WHITE, 0, 'yY');
  }
  hopBox(G, VX + 0.1, 1.2, -HL, VX + 0.18, 1.3, HL, PIG.WHITE); hopBox(G, VX + 0.1, 0.5, -HL, VX + 0.18, 0.58, HL, PIG.WHITE, 0, 'Y');
  await ctx.yield();
  // the dining wing across the path: eight tall windows north, their twins south, one open pair to fly through
  const WW = -HW - WING_X0, nWin = 8, wu = (k) => 6 + 7.6 * k, wy0 = WING_FLOOR + 0.3, wy1 = wy0 + 6;
  const nHoles = Array.from({ length: nWin }, (_, k) => ({ u: wu(k), hw: 2.5, y0: wy0, y1: wy1, k }));
  const sHoles = [...nHoles].reverse().map((h) => ({ ...h, u: WW - h.u })).concat([{ u: WW + 1.6, hw: 2.5, y0: wy0, y1: wy1, k: 9 }]);   // the south row runs on at its own pitch past the window we leave by, so the far wall is a row of tall windows full of sea
  const eHoles = [{ u: 3.2, hw: 1.4, y0: wy0, y1: wy1, k: 9 }, { u: 10.8, hw: 1.4, y0: wy0, y1: wy1, k: 9 }];
  const wingWall = (F, w, holes, sunny) => {
    hopWall(G, F, 0, w, 0, WING_EAVE, holes, PIG.WALL, 0.78); trim(F, w, WING_EAVE);
    for (const h of holes) hopWindow(G, F, h, { open: h.k === 0, clear: true, big: h.k !== 0, blind: h.k === 0 || sunny ? 0 : (october ? 0.9 : 0.08 + 0.3 * rng()), blindPig: PIG.STRAW, phase: rng() });
  };
  wingWall(hopFrame([-HW, 0, HL], [0, 0, -1]), WW, nHoles, false);
  wingWall(hopFrame([WING_X0, 0, WING_Z1], [0, 0, 1]), WW + 2 * HW, sHoles, false);
  wingWall(hopFrame([WING_X0, 0, HL], [-1, 0, 0]), 14, eHoles, false);
  wingWall(hopFrame([HW, 0, WING_Z1], [1, 0, 0]), 14, eHoles, true);
  hopBox(G, WING_X0 - 0.7, WING_EAVE, HL, HW + 0.7, WING_EAVE + 0.4, WING_Z1 + 0.7, PIG.WHITE, 0, '', PIG.ROOF);
  hopBox(G, WING_X0 - 0.7, WING_EAVE, HL - 0.7, -HW, WING_EAVE + 0.4, HL, PIG.WHITE, 0, 'Z', PIG.ROOF);
  frustum(WING_X0 - 0.25, HW + 0.25, HL - 0.25, WING_Z1 + 0.25, WING_EAVE + 0.4, WING_EAVE + 3.2, 3.0, 3.0, PIG.ROOF, 0.52);
  // the dining room: one long dark box, sun let in by the two east windows and by the row of north ones
  R.win = [HW, (wy0 + wy1) * 0.5, HL + 3.2, 1.4, 3.0, 0 + 2 * 2];
  R.win2 = [-HW - wu(nWin - 1), (wy0 + wy1) * 0.5, HL, 2.5, 3.0, 1 + 2 * nWin];
  const rx0 = WING_X0 + 0.3, rx1 = HW - 0.3, rz0 = HL + 0.3, rz1 = WING_Z1 - 0.3, ryc = WING_EAVE - 0.4;
  hopQuad(R, [rx0, WING_FLOOR, rz0], [rx0, WING_FLOOR, rz1], [rx1, WING_FLOOR, rz1], [rx1, WING_FLOOR, rz0], PIG.ROOMFLOOR, 0.34);   // bare boards: their joints are ruled across the sun's slab
  hopQuad(R, [rx0, ryc, rz0], [rx1, ryc, rz0], [rx1, ryc, rz1], [rx0, ryc, rz1], PIG.ROOMCEIL);
  const inH = (holes, w) => [...holes].reverse().map((h) => ({ ...h, u: w - h.u }));
  hopWall(R, hopFrame([WING_X0, 0, rz0], [0, 0, 1]), 0.3, WW + 2 * HW - 0.3, WING_FLOOR, ryc, inH(nHoles, WW).map((h) => ({ ...h })), PIG.ROOMWALL);
  hopWall(R, hopFrame([HW, 0, rz1], [0, 0, -1]), 0.3, WW + 2 * HW - 0.3, WING_FLOOR, ryc, inH(sHoles, WW + 2 * HW), PIG.ROOMWALL);
  hopWall(R, hopFrame([rx1, 0, HL], [-1, 0, 0]), 0.3, 13.7, WING_FLOOR, ryc, inH(eHoles, 14), PIG.ROOMWALL);
  hopWall(R, hopFrame([rx0, 0, WING_Z1], [1, 0, 0]), 0.3, 13.7, WING_FLOOR, ryc, inH(eHoles, 14), PIG.ROOMWALL);
  // the room's joinery in white paint (blue-green out of the sun): a casing round each far window, a skirting along the piers
  for (const h of sHoles) {
    const c = WING_X0 + h.u;
    for (const sx of [-1, 1]) hopBox(R, c + sx * (h.hw + 0.16) - 0.16, WING_FLOOR, rz1 - 0.1, c + sx * (h.hw + 0.16) + 0.16, wy1 + 0.36, rz1, PIG.WHITE, 0, 'yZ');
    hopBox(R, c - h.hw - 0.46, wy1 + 0.02, rz1 - 0.13, c + h.hw + 0.46, wy1 + 0.4, rz1, PIG.WHITE, 0, 'Z');
  }
  hopBox(R, rx0, WING_FLOOR, rz1 - 0.06, rx1, WING_FLOOR + 0.28, rz1, PIG.WHITE, 0, 'yZxX');
  R.win = null; R.win2 = null;
  await ctx.yield();
  const body = new THREE.Mesh(hopFinish(G), mat); body.name = 'hotel-slabs'; root.add(body);
  await ctx.yield();
  const rooms = new THREE.Mesh(hopFinish(R, true), roomMat); rooms.name = 'hotel-rooms'; root.add(rooms);
  root.add(hopShadowMesh(U, SH));
  await ctx.yield();
  if (opts.apron !== false) {                                   // a flat of ranked grass so the piece can be judged alone
    const A = hopGeo(); hopQuad(A, [-190, 0, 230], [150, 0, 230], [150, 0, -230], [-190, 0, -230], PIG.STRAW, 0.4);
    const ap = new THREE.Mesh(hopFinish(A), mat); ap.name = 'apron'; root.add(ap);
  }
  // caster boxes (hotel-local): body, eave, mansard, tower, wing, veranda roof
  const bx = [[-HW + 0.35, -1, -HL + 0.35, HW - 0.35, EAVE, HL - 0.35], [-HW - OV, EAVE, -HL - OV, HW + OV, EAVE + 0.45, HL + OV],
    [-HW + 1.15, MY0, -HL + 1.15, HW - 1.15, MY1 + 0.2, HL - 1.15], [-TOWER_X + 0.35, -1, zT0 + 0.35, TOWER_X - 0.35, TY0, zT1 - 0.35],
    [WING_X0 + 0.35, -1, HL + 0.35, HW - 0.35, WING_EAVE + 0.4, WING_Z1 - 0.35], [VX, VY0 - 0.4, -HL, -HW, VY1, HL]];
  bx.forEach((b, i) => { U.uBoxMin.value[i].set(b[0], b[1], b[2]); U.uBoxMax.value[i].set(b[3], b[4], b[5]); });

  // curtains and the pennant: one instanced cloth, waved in the vertex shader
  const cl = [];
  const addCloth = (base, nx, nz, w, len, ph, mode) => cl.push({ base, nx, nz, w, len, ph, mode });
  let heroCurtain = null;
  const segs = [[0, -HW, -HL], [1, -TOWER_X, zT0], [2, -HW, zT1]];
  for (const [si, x, z0] of segs) blW[si].forEach((st, s) => st.forEach((b, i) => {
    if (!b.curtain) return;
    const head = FLOORS[s] + (s === BIG_S ? BIG_Y0 + BIG_H : 0.7 + (s === 0 ? 2.2 : 2.9)) - 0.05, z = z0 + (i + 0.5) * BAY;
    if (b.hero) { heroCurtain = new THREE.Vector3(x, head, z); addCloth([x, head, z + 0.3], -0.97, 0.24, 4.3, 5.0, b.ph, 1); } else addCloth([x, head, z], -1, 0, 2.2, 2.6 + 0.6 * b.ph, b.ph, 0.25);
  }));
  addCloth([0, poleTop - 0.2, zc0], -0.94, 0.34, 1.5, 6.5, rng(), 2);
  addCloth([-HW - wu(1) - 0.9, wy1 - 0.05, WING_Z1 - 0.75], 0, -1, 2.6, 5.5, 0.2, 0);          // the dining room: one long curtain at a far window, blown in over the bare floor
  const cg = new THREE.InstancedBufferGeometry(); cg.copy(new THREE.PlaneGeometry(1, 1, 12, 16));
  const ia = (name, n, f) => { const a = new Float32Array(cl.length * n); cl.forEach((c, i) => a.set(f(c), i * n)); cg.setAttribute(name, new THREE.InstancedBufferAttribute(a, n)); };
  ia('aBase', 3, (c) => c.base); ia('aOut', 4, (c) => [c.nx, c.nz, c.w, c.len]); ia('aCh', 2, (c) => [c.ph, c.mode]);
  cg.instanceCount = cl.length;
  const clothMat = new THREE.ShaderMaterial({
    uniforms: U, side: THREE.DoubleSide, toneMapped: false,
    vertexShader: /* glsl */`
      attribute vec3 aBase; attribute vec4 aOut; attribute vec2 aCh; uniform float uTime; uniform float uGust; varying vec3 vW; varying float vFold; varying float vOut; varying float vKind;
      void main(){
        vFold = 0.; vOut = 0.; vKind = aCh.y;
        float t = 1. - uv.y, sx = uv.x - .5, ph = aCh.x * 6.283, L = aOut.w;
        vec3 N = vec3(aOut.x, 0., aOut.y), Rv = vec3(aOut.y, 0., -aOut.x), p;
        if (aCh.y > 1.5) {                                      // the pennant: streams level, tapers, ripples
          vFold = t * 7. - uTime * 5. + ph + 1.57;
          float rip = sin(t * 7. - uTime * 5. + ph) * .28 * t + sin(t * 13. - uTime * 8.) * .07 * t;
          p = aBase + N * (t * L) + vec3(0., sx * aOut.z * (1. - .8 * t) - t * t * .8 + sin(t * 4. - uTime * 3.) * .15 * t, 0.) + Rv * rip;
        } else {
          float amb = .5 + .5 * sin(uTime * 1.5 + ph); amb *= amb; amb = .12 + .88 * amb;
          // 0 hangs in the room, 1 blown out flat (the short curtains of the flank only breathe out past the sill). THE LONG CURTAIN
          // (mode 1) is the same cloth, longer: it hangs from its rod across the raised sash and the gust lifts it out over the veranda
          // roof, downwind, bellying, its free end flapping, so it is a curtain from the first sight of it to the pass.
          float lg = step(.5, aCh.y), g = mix(amb * (aCh.y > .1 ? .5 : .9), .3 + .52 * uGust + .04 * sin(uTime * 2.1 + ph), lg);
          float a = (g * 1.5 - .22) * (.45 + .55 * t) + sin(t * 8. - uTime * 6. + ph) * .1 * t * (.3 + g);
          float c = 1. - cos(a), s = sin(a);                    // closed-form sweep of a bending strip
          float outw = L * t * s * .92 + sin(t * 3.1416) * .4 * g * (1. - 2.2 * sx * sx), down = L * t * (1. - c * .8);
          vFold = sx * mix(11., 8., lg) + t * 3. - uTime * 2.5 + ph; vOut = t * g - .45;     // how far out of the window this part of the cloth has blown
          float fold = sin(vFold) * .1 * (.35 + t);
          p = aBase + N * (-.45 + outw + fold) + vec3(0., -down, 0.) + Rv * (sx * aOut.z * (1. - .25 * t * g) + sin(t * 5. - uTime * 3.2 + ph) * .14 * t * g);
        }
        vec4 w = modelMatrix * vec4(p, 1.); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w;
      }`,
    fragmentShader: /* glsl */`
      ${STYLE_GLSL}
      varying vec3 vW; varying float vFold; varying float vOut; varying float vKind;
      void main(){                                              // cloth is thin: sun reaches both sides; its folds are painted, one tone each
        float c = cos(vFold), w = max(fwidth(c), 1e-4);
        float f = smoothstep(-w, w, c - (vKind > .5 && vKind < 1.5 ? .62 : 0.));   // the long curtain: narrow strokes of shade in the folds of a cream cloth
        float hd = max(dot(vW, uHead.xyz) + uHead.w, vW.z - uHeadZ);
        float lit = (1. - hopCast(vW, 0.)) * step(0., hd);
        float ow = max(fwidth(vOut), 1e-4);                     // blown clear of the sash, the cloth catches the sun that comes level through the room behind it
        lit = max(lit, smoothstep(-ow, ow, vOut) * step(0., hd));
        vec3 col = mix(mix(uTab[1], uTab[2], f), mix(uTab[0], uTab[1], f), lit);
        gl_FragColor = vec4(col * (1. + (hopDrag(vW, vec3(0., 0., 1.)) - .5) * .07), 1.);
      }`,
  });
  const cloth = new THREE.Mesh(cg, clothMat); cloth.frustumCulled = false; cloth.name = 'curtains'; root.add(cloth);
  await ctx.yield();

  // ---- anchors, progress, update ---------------------------------------------------------------------------------
  const px = -HW - 6;                                            // the fly-in window's centre line (x)
  const perches = [];
  for (let k = 0; k < 26; k++) {
    const r = rng(), z = -HL + 3 + rng() * (2 * HL - 6);
    perches.push(r < 0.4 ? [-HW + 1.05 + 0.1, MY1 + 0.22, z] : r < 0.7 ? [-HW - OV + 0.2, EAVE + 0.45, z] : r < 0.85 ? [VX + 0.3, VY0 + 0.06, z] : [WING_X0 + 4 + rng() * 50, WING_EAVE + 3.2, HL + 7]);
  }
  const anchors = {
    eyeY: EYE_Y,                                                 // ride height above the hotel's base (second-floor windows, 1.6 m over their sills)
    flyThrough: [[px - 9.5, EYE_Y, -HL - 60], [px - 8, EYE_Y, -HL], [px - 4, EYE_Y, 0], [px, EYE_Y, HL - 6], [px, EYE_Y, HL], [px, EYE_Y, WING_Z1], [px, EYE_Y, WING_Z1 + 12]].map((p) => new THREE.Vector3(...p)),
    buffers: new THREE.Vector3(px - 8, 0, -HL),                  // where the track ends beside the north end
    reveal: { position: new THREE.Vector3(-34, 5, -HL - 150), target: new THREE.Vector3(-2, 11, -30) },
    windowIn: { center: new THREE.Vector3(px, WING_FLOOR + 3.3, HL), width: 5, height: 6, normal: new THREE.Vector3(0, 0, -1) },
    windowOut: { center: new THREE.Vector3(px, WING_FLOOR + 3.3, WING_Z1), width: 5, height: 6, normal: new THREE.Vector3(0, 0, 1) },
    diningFloorY: WING_FLOOR,
    curtain: heroCurtain,                                        // head of the window the long curtain blows from (reach 3 m)
    pennant: new THREE.Vector3(0, poleTop, zc0),
    perches: perches.map((p) => new THREE.Vector3(...p)),        // gull standing points (cornice, curb, veranda edge, wing ridge)
    roofTop: MY1 + 0.22, eave: EAVE,
    portalSeat: null,                                            // the exit is the boathouse door, not on the hotel
  };
  const D2R = Math.PI / 180, cu = opts.curtainU ?? 0.47;
  let driven = false;
  const setSun = (elDeg, azDeg = 20, starboard = false) => {     // az: degrees astern of abeam; port by default
    const e = elDeg * D2R, a = azDeg * D2R;
    U.uSun.value.set((starboard ? -1 : 1) * Math.cos(e) * Math.cos(a), Math.sin(e), -Math.cos(e) * Math.sin(a));
  };
  const setGust = (g) => { U.uGust.value = Math.max(0, Math.min(1, g)); };
  const setProgress = (u) => {                                   // u of the world's path: sun climbs 8 -> 20 degrees (reached at u 0.4), the curtain gusts at curtainU
    const k = Math.max(0, Math.min(1, u / 0.4));                // the climb is done by the time we reach the hotel, so its shadow's ruled edge lies on the lawn inside the picture
    driven = true; setSun(8 + 12 * k * k * (3 - 2 * k), 20, !!opts.evening);
    const d = Math.abs(u - cu) / 0.07; setGust(d < 1 ? (1 - d * d) * (1 - d * d) : 0);
  };
  setSun(14, 20, !!opts.evening);
  const inv = new THREE.Matrix4();
  let R0 = 118, C0 = new THREE.Vector3(-20, 9, 8); let H0 = null;
  return {
    object: root, radius: R0, height: H0 ?? poleTop + 0.4, center: C0, anchors, uniforms: U, material: mat, roomMaterial: roomMat,
    setProgress, setSun, setGust,
    update(dt, time) {
      U.uTime.value = time;
      root.updateWorldMatrix(true, false); inv.copy(root.matrixWorld).invert(); U.uCastM.value.copy(inv);
      if (!driven) { const s = 0.5 + 0.5 * Math.sin(time * 0.55); setGust(s * s); setSun(14 + 5 * Math.sin(time * 0.3), 20, !!opts.evening); }   // alone in the viewer: the sun and the gust on a loop
    },
    dispose() { U.uNoise.value.dispose(); },
    ground: false, groundY: 0,
  };
}
