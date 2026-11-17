// THE GOLDEN CITY AND ITS BRIDGE: the gate house's own materials (the gate house's builder keeps them here; nothing else uses them).
// GOLD BY NIGHT (gold): polished metal has no colour of its own in the dark, it holds what stands round it. So each face shows
// the night it is turned to (the sky's violet above, a pale band at the level, warm dark below, the brightest star cloud as a broad
// warm light and a small glint), tinted by the gold, whiter toward a grazing edge; over that a little broad light so forms keep
// their shape, the warm light of the house's own lamps on what stands near the deck, the doorway's light near the doorway and the
// bridge's passing colours on what faces its end.
// THE PLATES: the surface is cut in plates round the thing's axis and along it (by its uv): a rounded rib down each plate (a tilt
// of the normal), each plate a little its own tone and tilt (so plates catch the light one after another as a band turns), a fine
// seam of warm light between plates, a bright lip beside each seam, and in some plates a small port of light (round, or a tall
// slot), and a fine sunk line round each plate's inner panel. All of it is filtered by the pixel's footprint: where a plate is too small in the picture its seams and ports fade into
// an even glow and its relief into the plain face. Nothing here is timed but the bridge's colours (a ninth of a turn a second).
import * as THREE from 'three';
import * as fx from '../kit/fx.js';
import { BRIDGE } from './asgard-bridge-of-light-plan.js';

const VERT = /* glsl */`
varying vec3 vW, vN; varying vec2 vUv;
void main(){
  vec4 w = modelMatrix*vec4(position, 1.); vW = w.xyz; vN = mat3(modelMatrix)*normal; vUv = uv;
  gl_Position = projectionMatrix*viewMatrix*w;
}`;
const HEAD = /* glsl */`
precision highp float;
varying vec3 vW, vN; varying vec2 vUv;
uniform float uTime, uFogDensity; uniform vec3 uFogColor;
float ghPow(float x, float k){ return pow(clamp(x, 1e-4, 1.), k); }
float ghAir(){ float d = length(vW - cameraPosition)*uFogDensity; return exp(-d*d); }      // the share of a thing's light that comes through the air (the scene's own fog)
vec3 ghHue(float h){ return clamp(abs(fract(h + vec3(0., .6667, .3333))*6. - 3.) - 1., 0., 1.); }
`;
const GOLD = /* glsl */`${HEAD}
uniform float uLampY; uniform vec3 uTint, uAxis; uniform vec4 uPlate, uPort, uShade, uDoor;
${fx.GLSL_HASH}
const vec3 GH_KEY = vec3(-.418, .518, -.746), GH_ARM = vec3(.5, .45, -.74);      // toward the brightest star cloud; along the galaxy's arm
vec3 ghNight(vec3 r){      // what a polished face holds of the night, by where it is turned
  vec3 c = mix(mix(vec3(.105, .052, .017), vec3(.030, .014, .006), smoothstep(0., .9, -r.y)), vec3(.040, .035, .135), smoothstep(-.14, .08, r.y));
  c += vec3(.15, .12, .30)*exp(-r.y*r.y*24.) + vec3(.13, .06, .21)*smoothstep(.15, .95, r.y);
  float k = dot(r, GH_KEY);
  c += vec3(1., .80, .52)*(.27*ghPow(k, 15.) + 9.*ghPow(k, 260.)) + vec3(.55, .62, 1.)*.3*ghPow(dot(r, GH_ARM), 20.);
  return c;
}
void main(){
  vec3 ev = cameraPosition - vW, n = vN*inversesqrt(max(dot(vN, vN), 1e-8)), v = ev*inversesqrt(max(dot(ev, ev), 1e-8));
  vec3 t = cross(uAxis, n); t *= inversesqrt(max(dot(t, t), 1e-4)); vec3 b = cross(n, t);
  vec2 pc = vUv*uPlate.xy, pf = fract(pc), id = floor(pc), fw = max(fwidth(pc), vec2(1e-5));
  float h1 = hash12(id + 3.7), h2 = hash12(id*1.7 + 11.3), h3 = hash12(id + 91.);
  float fine = 1. - smoothstep(.18, .55, max(fw.x, fw.y));
  n = normalize(n + (t*(sin((pf.x - .5)*6.2832)*uShade.x + (h1 - .5)*.30) + b*(h2 - .5)*.20)*fine);
  // the seams between plates, the plate's own face, the bright lip beside a seam
  vec2 e = min(pf, 1. - pf);
  vec2 sm = (1. - smoothstep(uPlate.zw, uPlate.zw + fw*1.5, e))*clamp(2.*uPlate.zw/fw, 0., 1.);
  vec2 lp = smoothstep(uPlate.zw, uPlate.zw*2.2 + fw, e), lq = 1. - smoothstep(uPlate.zw*2.2, uPlate.zw*4.5 + fw, e);
  float seam = max(sm.x, sm.y), plate = lp.x*lp.y, lip = max(lq.x, lq.y)*plate*fine;
  float groove = (1. - smoothstep(.011, .011 + max(fw.x, fw.y)*1.5, abs(min(e.x, e.y) - .16)))*fine*plate*clamp(.03/max(fw.x, fw.y), 0., 1.);      // a fine sunk line round each plate's inner panel
  // a port of light in some plates: round, or a tall slot
  vec2 d = (pf - .5)*vec2(1., uPort.z); d.y *= mix(1., .36, uPort.w);
  float pw = max(fw.x, fw.y*uPort.z), dl = sqrt(dot(d, d) + 1e-6), has = step(h3, uPort.x);
  float port = (1. - smoothstep(uPort.y - pw, uPort.y + pw, dl))*has*clamp(uPort.y/pw, 0., 1.);
  float surround = (1. - smoothstep(uPort.y*1.6, uPort.y*1.6 + pw + .02, dl))*has*(1. - port)*fine;
  // the light
  vec3 r = reflect(-v, n); float nv = clamp(dot(n, v), 0., 1.);
  vec3 F = uTint + (vec3(1.) - uTint)*ghPow(1. - nv, 5.);
  vec3 sky = ghNight(r), col = F*sky + sky*.25 + uTint*(vec3(.030, .032, .085)*(.6 + .4*n.y) + vec3(1., .84, .58)*.09*max(dot(n, GH_KEY), 0.));
  col += uTint*vec3(1., .52, .20)*uShade.z*exp(-abs(vW.y - uLampY)*.075)*(.62 - .38*n.y);
  vec3 td = uDoor.xyz - vW; float dd = dot(td, td);
  col += uTint*vec3(1., .66, .30)*uDoor.w*(.35 + .65*max(dot(n, td*inversesqrt(dd + 1.)), 0.))*90./(dd + 90.);
  vec3 tb = vec3(0., ${BRIDGE.y.toFixed(1)}, ${BRIDGE.z1.toFixed(1)}) - vW; float db = dot(tb, tb);
  col += uTint*ghHue(${(BRIDGE.z1 * 0.0031).toFixed(4)} - uTime*.11)*(.3 + .7*max(dot(n, tb*inversesqrt(db + 1.)), 0.))*160./(db + 600.);
  col *= mix(.94, .68 + .52*h1, fine)*(.35 + .65*plate)*(1. - .3*groove);      // each plate its own tone (where a plate is too small to hold one: the mean)
  col += uTint*vec3(1., .8, .55)*(.15*lip + .12*ghPow(.5 + .5*cos((pf.x - .5)*6.2832), 8.)*plate*fine*uShade.x*3.);      // the lip beside a seam; the rib's crest
  col = mix(col, vec3(.02, .012, .006), surround*.8);
  col += vec3(1., .50, .16)*uShade.y*seam*(.7 + .3*h2) + vec3(1., .74, .40)*uShade.w*port*(.55 + .45*h1);
  gl_FragColor = vec4(mix(uFogColor, col, ghAir()), 1.);
}`;
// gold(shared, o): o.axis the thing's axis in the world; o.plates [round, along]; o.seam the seam's half width as a share of a
// plate's [width, height]; o.rib the rib's strength; o.glow the seams' light; o.lamp the lamps' light; o.port [the share of plates
// that carry one, its radius in plate widths, a plate's height over its width, 0 round or 1 a tall slot]; o.portGlow its light
export function gold(shared, o = {}) {
  return new THREE.ShaderMaterial({ name: 'ghGold', vertexShader: VERT, fragmentShader: GOLD, side: o.side ?? THREE.FrontSide,
    uniforms: { ...shared, uTint: { value: new THREE.Color(o.tint || '#ffc45e') }, uAxis: { value: new THREE.Vector3(...(o.axis || [0, 1, 0])) },
      uPlate: { value: new THREE.Vector4(...(o.plates || [1, 1]), ...(o.seam || [0.03, 0.05])) }, uPort: { value: new THREE.Vector4(...(o.port || [0, 0.1, 1, 0])) },
      uShade: { value: new THREE.Vector4(o.rib ?? 0.3, o.glow ?? 0.9, o.lamp ?? 0.3, o.portGlow ?? 1.6) }, uLampY: { value: o.lampY ?? BRIDGE.y },
      uDoor: { value: new THREE.Vector4(...(o.door || [0, 0, 0, 0])) } } });
}
// A LIGHT (light): a face that only shines (the doorway's inside, the globe's inside): o.grad [at its foot, at its head, how far it dims toward its sides]
export function light(shared, o = {}) {
  return new THREE.ShaderMaterial({ name: 'ghLight', vertexShader: VERT, side: o.side ?? THREE.FrontSide,
    uniforms: { ...shared, uCol: { value: new THREE.Color(o.color || '#ffb45e') }, uGrad: { value: new THREE.Vector3(...(o.grad || [1, 1, 0])) } },
    fragmentShader: /* glsl */`${HEAD}
      uniform vec3 uCol, uGrad;
      void main(){ float g = mix(uGrad.x, uGrad.y, clamp(vUv.y, 0., 1.))*(1. - uGrad.z*abs(vUv.x*2. - 1.));
        gl_FragColor = vec4(mix(uFogColor, uCol*g, ghAir()), 1.); }` });
}
// A GLOW (glow): a soft light round a thing, added to the picture on a round shell (a sheen, no body: it stands in nobody's way
// and writes no depth). o.round 0: strongest where the shell faces the eye, nothing at its edge. o.round > 1 (the shell's radius
// over a globe's within it): a faint veil over the globe, strongest just outside the globe's edge, dying away to the shell's
export function glow(shared, o = {}) {
  return new THREE.ShaderMaterial({ name: 'ghGlow', vertexShader: VERT, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { ...shared, uCol: { value: new THREE.Color(o.color || '#ff9a3c') }, uK: { value: new THREE.Vector4(o.strength ?? 0.1, o.power ?? 3, o.round ?? 0, o.veil ?? 0.25) } },
    fragmentShader: /* glsl */`${HEAD}
      uniform vec3 uCol; uniform vec4 uK;
      void main(){ vec3 ev = cameraPosition - vW; float nv = clamp(dot(vN*inversesqrt(max(dot(vN, vN), 1e-8)), ev*inversesqrt(max(dot(ev, ev), 1e-8))), 0., 1.), pr = uK.z*sqrt(1.0001 - nv*nv);
        float edge = mix(uK.w, 1., smoothstep(.86, 1., pr))*exp(-max(pr - 1., 0.)*uK.y);
        gl_FragColor = vec4(uCol*uK.x*mix(ghPow(nv, uK.y), edge, step(.5, uK.z))*ghAir(), 1.); }` });
}
// THE BEAM (beam): a steady shaft of rainbow light from the spike's point. Drawn on a long widening tube; each sight line is
// coloured by where it passes across the shaft (red at one edge through every colour to violet at the other, near white through
// the middle) and is as bright as the shaft is deep there, so the shaft has soft edges and no skin. It swells and eases over
// 12.6 s (ph: where in that swell it begins, dealt by the world); slow waves of light 400 m long run out along it, one passing a
// place every 5 s. o.from, o.dir: the shaft's start and its unit direction; o.r [radius at its start, at its end]; o.length
export function beam(shared, o) {
  return new THREE.ShaderMaterial({ name: 'ghBeam', vertexShader: VERT, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { ...shared, uA: { value: new THREE.Vector3(...o.from) }, uD: { value: new THREE.Vector3(...o.dir) },
      uR: { value: new THREE.Vector4(o.r[0], o.r[1], o.length, o.strength ?? 1) }, uPh: { value: o.ph ?? 0 }, uWhite: { value: o.white ?? 0.5 } },
    fragmentShader: /* glsl */`${HEAD}
      uniform vec3 uA, uD; uniform vec4 uR; uniform float uPh, uWhite;
      void main(){
        vec3 V = vW - cameraPosition; V *= inversesqrt(max(dot(V, V), 1e-4));
        vec3 nx = cross(V, uD); float along = clamp(dot(vW - uA, uD), 0., uR.z), q = along/uR.z, rad = mix(uR.x, uR.y, q);
        float s = clamp(dot(uA - cameraPosition, nx)*inversesqrt(max(dot(nx, nx), 1e-6))/rad, -1., 1.);      // where across the shaft this sight line passes: -1 and 1 are its two edges
        float deep = sqrt(1.0001 - s*s), swell = .80 + .20*sin(uTime*.5 + uPh), wave = .86 + .14*sin(along*.0157 - uTime*1.26 + s*2.);
        vec3 hue = mix(ghHue(.02 + .40*(s + 1.)), vec3(1., .96, .9), uWhite*ghPow(1. - abs(s), 2.5));
        float lit = uR.w*deep*deep*swell*wave*(1. + 1.6*exp(-along*.004))*(1. - smoothstep(.45, 1., q));
        gl_FragColor = vec4(hue*lit*ghAir(), 1.); }` });
}
