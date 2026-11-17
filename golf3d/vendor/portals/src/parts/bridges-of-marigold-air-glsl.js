// bridges-of-marigold, the air: GLSL shared by the air's parts. Every number of the place is taken from the plan
// module (never retyped): the three bridges' lines and the towers are written into the shader text from the plan's
// own objects. The hash and the value noise are the kit's (fx.js), imported.
import { GLSL_HASH, GLSL_VALUE_NOISE, GLSL_FBM, GLSL_FOG_PARS_VERT, GLSL_FOG_VERT, GLSL_FOG_PARS_FRAG } from '../kit/fx.js';
import { TOWERS, GREAT_BRIDGE, HIGH_BRIDGE, CANYON_BRIDGE, ring } from './bridges-of-marigold-plan.js';

const f = (x) => { const s = String(Math.round(x * 1e4) / 1e4); return /[.e]/.test(s) ? s : s + '.'; };
export const NOISE = GLSL_HASH + GLSL_VALUE_NOISE + GLSL_FBM;
export const FOG_VERT_PARS = GLSL_FOG_PARS_VERT, FOG_VERT = GLSL_FOG_VERT, FOG_FRAG_PARS = GLSL_FOG_PARS_FRAG;

// The canyon bridge's two ends on the ground plan (it runs straight along one bearing from the great tower outward)
const cb0 = ring(CANYON_BRIDGE.b, CANYON_BRIDGE.r0), cb1 = ring(CANYON_BRIDGE.b, CANYON_BRIDGE.r1);
export const CANYON_LINE = { x0: cb0[0], z0: cb0[1], x1: cb1[0], z1: cb1[1], length: CANYON_BRIDGE.r1 - CANYON_BRIDGE.r0 };

// THE PLACE, for shaders: the height of each bridge's deck line, and for a point of the ground plan how far it lies
// from each bridge's middle line and how high that bridge's underside hangs there.
//   mgBridge(k, xz) -> vec3(metres across from the middle line, deck height at the nearest place of the line, half width)
export const PLACE = /* glsl */`
float mgGreatDeck(float z){ float t=(${f(GREAT_BRIDGE.z0)}-z)/${f(GREAT_BRIDGE.z0 - GREAT_BRIDGE.z1)};
  return ${f(GREAT_BRIDGE.y0)}+${f(GREAT_BRIDGE.y1 - GREAT_BRIDGE.y0)}*t+${f(GREAT_BRIDGE.rise)}*t*(1.-t); }
float mgHighDeck(float z){ float t=(z-${f(HIGH_BRIDGE.z0)})/${f(HIGH_BRIDGE.z1 - HIGH_BRIDGE.z0)};
  return ${f(HIGH_BRIDGE.y0)}+${f(HIGH_BRIDGE.y1 - HIGH_BRIDGE.y0)}*t+${f(HIGH_BRIDGE.rise)}*t*(1.-t); }
float mgCanyonDeck(float s){ return ${f(CANYON_BRIDGE.y0)}+${f(CANYON_BRIDGE.y1 - CANYON_BRIDGE.y0)}*s+${f(CANYON_BRIDGE.rise)}*s*(1.-s); }
vec3 mgBridge(int k, vec2 p){
  if(k==0){ float z=clamp(p.y, ${f(GREAT_BRIDGE.z1)}, ${f(GREAT_BRIDGE.z0 + 14)});
    return vec3(length(p-vec2(${f(GREAT_BRIDGE.x)}, z)), mgGreatDeck(z), ${f(GREAT_BRIDGE.width / 2)}); }
  if(k==1){ float z=clamp(p.y, ${f(HIGH_BRIDGE.z0)}, ${f(HIGH_BRIDGE.z1 + 12)});
    return vec3(length(p-vec2(${f(HIGH_BRIDGE.x)}, z)), mgHighDeck(z), ${f(HIGH_BRIDGE.width / 2)}); }
  vec2 a=vec2(${f(cb0[0])}, ${f(cb0[1])}), d=vec2(${f(cb1[0] - cb0[0])}, ${f(cb1[1] - cb0[1])});
  float s=clamp(dot(p-a, d)/dot(d, d), 0., 1.);
  return vec3(length(p-a-d*s), mgCanyonDeck(s), ${f(CANYON_BRIDGE.width / 2)}); }
`;

// THE TOWERS, for shaders: axis (x, z), the radius of the stack at its foot and at its top, the height where the
// houses begin and where the roofs end. mgTower(k) -> vec4(x, z, the stone foot's radius, the stone foot's top); mgStack(k) ->
// vec4(radius at base, radius at top, base, top).
export const TOWER_COUNT = TOWERS.length;
export const TOWER_GLSL = /* glsl */`
const int MG_TOWERS = ${TOWERS.length};
vec4 mgTower(int k){
${TOWERS.map((t, k) => `  if(k==${k}) return vec4(${f(t.x)}, ${f(t.z)}, ${f(t.footR)}, ${f(t.footTop)});`).join('\n')}
  return vec4(0.); }
vec4 mgStack(int k){
${TOWERS.map((t, k) => `  if(k==${k}) return vec4(${f(t.r)}, ${f(t.r * (1 - t.taper))}, ${f(t.base)}, ${f(t.top)});`).join('\n')}
  return vec4(1.); }
`;

// THE PETAL: one outline for every petal of the world (a marigold's ray floret: narrow at its foot, broad and
// notched at its tip). q is the petal's own square, x across (-1..1), y from foot (0) to tip (1).
//   mgPetal(q) -> signed measure, over 0 inside. mgPetalHue(seed) -> the petal's own orange (deep orange to gold).
export const PETAL = /* glsl */`
float mgPetal(vec2 q){
  float y=clamp(q.y, 0., 1.);
  float w=0.16+0.84*smoothstep(0., 0.62, y);          // narrow foot, broad shoulder
  w*=1.-0.55*smoothstep(0.78, 1.0, y);               // rounded tip
  float notch=0.085*smoothstep(0.75, 1.0, y)*(0.5+0.5*cos(q.x*9.42));   // three soft teeth at the tip
  float tip=1.0-notch-0.04;
  return min(w-abs(q.x), min(q.y+0.0, tip-q.y)); }
vec3 mgPetalHue(float s){
  vec3 deep=vec3(1.0, 0.20, 0.012), mid=vec3(1.0, 0.36, 0.02), gold=vec3(1.0, 0.56, 0.06);
  return s<0.5 ? mix(deep, mid, s*2.) : mix(mid, gold, s*2.-1.); }
`;

// THE HANGINGS' SWAY: a thing hung on a line goes sideways with its line, most at the line's middle.
//   hang = (the line's sideways unit x, z; metres of sway at this place of the span; the line's phase)
export const HANG = /* glsl */`
vec3 mgHang(vec3 rest, vec4 hang, float time){
  float s = hang.z*(0.7*sin(time*0.62 + hang.w) + 0.3*sin(time*1.37 + hang.w*2.3));
  return rest + vec3(hang.x*s, -abs(s)*0.08, hang.y*s); }
`;

// A POINT OF LIGHT with a halo, drawn on a square that faces the eye: a small hot core and a soft halo round it.
// Never smaller than three pixels (far lights keep their place in the picture); fog dims it (it adds light only).
//   aP (rest x, y, z; size in metres)   aHang (as above)   aCol (r, g, b; twinkle seed)
export const SPARK_VERT = /* glsl */`
${GLSL_FOG_PARS_VERT}${HANG}
attribute vec4 aP, aHang, aCol; uniform float uTime, uPx, uDrop; varying vec2 vQ; varying vec3 vCol;
void main(){
  vec3 c = mgHang(aP.xyz, aHang, uTime); c.y -= uDrop;
  vec4 mvPosition = viewMatrix*vec4(c, 1.); float dist = max(-mvPosition.z, 0.05);
  float size = max(aP.w, uPx*dist*3.0), dim = (aP.w/size); dim *= dim;
  float tw = 0.82 + 0.18*sin(uTime*(1.7 + 2.6*aCol.w) + aCol.w*61.);
  vCol = aCol.rgb*tw*mix(1., dim, 0.75); vQ = position.xy*2.;
  mvPosition.xy += position.xy*size; gl_Position = projectionMatrix*mvPosition;
${GLSL_FOG_VERT} }`;
export const SPARK_FRAG = /* glsl */`
${GLSL_FOG_PARS_FRAG}
uniform float uCore, uHalo; varying vec2 vQ; varying vec3 vCol;
void main(){
  float d = length(vQ), core = smoothstep(0.22, 0.07, d), halo = exp(-d*d*5.5)*(1. - smoothstep(0.7, 1., d));
  vec3 col = vCol*(core*uCore + halo*uHalo)*(1. - 0.7*fxFog());
  gl_FragColor = vec4(col, 1.);
}`;
