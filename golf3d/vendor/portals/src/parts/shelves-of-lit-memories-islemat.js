// SHELVES OF LIT MEMORIES: the islands' builder's own materials (the chasm, the stems, the islands, the tower, the lines of light).
// It is night inside a mind: nothing here is lit by a sun. Every face holds a little of the dome (indigo from above, a dusky rose
// from the level, dark from below: isSky), the light of the lamps that stand by it (each island hands its material eight lamps),
// and its own light where it is a lamp or a lit opening. All of it goes out linear, through the scene's own fog (three's fog
// chunks: whatever fog the world file sets is honoured). Fine pattern is filtered by the pixel's footprint. What moves goes by
// the world's clock (shared.uTime): the window's light (gold at every clock; over it blue, red, green and violet visit in turn,
// each for 10 s: swelling over 3 s, staying 4 s, fading over 3 s; where that round of 40 s stands at the clock's zero is dealt
// by the seed: shared.uRound), the pulses on the lines of light (one passes a place every 4 s), the grey orbs' sinking.
//  solid   : a painted thing (its colour and its own light per corner, attribute aCol), lit by sky, stage and eight lamps; tiles on request
//  chasm   : the pit's wall: strata and ribs in dusky violet stone, sinking into violet-black haze with depth
//  shell   : a smooth shell with fine ribs and a sheen (the tower's pod, the stems, the discs' under-sides)
//  windowGlass : the tower's band of milky glass with its mullions
//  lamps   : round lamps as discs turned to the eye, each with a soft halo (never smaller than a pixel: dimmed instead)
//  greyOrbs: the dim glass balls sinking through the chasm (balls drawn on discs turned to the eye)
//  lineOfLight : a taut ribbon turned to the eye, never thinner than 2 pixels, pulses running along it
import * as THREE from 'three';
import { ORB } from './shelves-of-lit-memories-plan.js';

const FIVE = [ORB.gold, ORB.blue, ORB.red, ORB.green, ORB.violet];
const U = (shared, own) => ({ ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), uTime: shared.uTime, uRound: shared.uRound || { value: 0 }, uOrb: { value: FIVE.map((c) => new THREE.Color(c)) }, ...own });
const VERT = /* glsl */`
attribute vec4 aCol;
varying vec3 vW, vN; varying vec2 vUv; varying vec4 vCol;
#include <fog_pars_vertex>
void main(){
  vec4 w = modelMatrix*vec4(position, 1.); vW = w.xyz; vN = mat3(modelMatrix)*normal; vUv = uv; vCol = aCol;
  vec4 mvPosition = viewMatrix*w; gl_Position = projectionMatrix*mvPosition;
  #include <fog_vertex>
}`;
const LIB = /* glsl */`
uniform float uTime, uRound; uniform vec3 uOrb[5];
#include <fog_pars_fragment>
float isAir(){
  #ifdef USE_FOG
    #ifdef FOG_EXP2
      return exp(-fogDensity*fogDensity*vFogDepth*vFogDepth);
    #else
      return 1. - smoothstep(fogNear, fogFar, vFogDepth);
    #endif
  #else
    return 1.;
  #endif
}
vec3 isFog(vec3 c){
  #ifdef USE_FOG
    return mix(fogColor, c, isAir());
  #else
    return c;
  #endif
}
const vec3 IS_HAZE = vec3(.020, .011, .046);      // the violet-black of the depths
vec3 isDeep(vec3 c, float y){ return mix(c, IS_HAZE, smoothstep(30., 360., -y)); }
float isPow(float x, float k){ return pow(clamp(x, 1e-4, 1.), k); }
vec3 isUnit(vec3 v){ return v*inversesqrt(max(dot(v, v), 1e-8)); }
float isHash(vec2 p){ vec3 q = fract(vec3(p.xyx)*.1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y)*q.z); }
float isVn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3. - 2.*f);
  return mix(mix(isHash(i), isHash(i + vec2(1., 0.)), f.x), mix(isHash(i + vec2(0., 1.)), isHash(i + vec2(1., 1.)), f.x), f.y); }
vec3 isSky(vec3 n){ return mix(vec3(.022, .014, .050), vec3(.10, .075, .21), .5 + .5*n.y) + vec3(.075, .036, .075)*isPow(1. - abs(n.y), 3.); }
// the window's visitor: blue, red, green and violet in turn, each for 10 s (its light swells over 3 s, stays 4 s and fades over
// 3 s; a round of 40 s; uRound: where the round stands at the clock's zero, 0 to 1). Its colour, and how much of it there is (0 to 1)
vec4 isVisit(){
  float p = fract(uTime/40. + uRound)*4., i = floor(p), f = p - i;
  return vec4(i < .5 ? uOrb[1] : (i < 1.5 ? uOrb[2] : (i < 2.5 ? uOrb[3] : uOrb[4])), smoothstep(0., .3, f)*(1. - smoothstep(.7, 1., f)));
}
vec3 isCycle(){ vec4 v = isVisit(); return mix(uOrb[0], v.rgb, .3*v.a); }      // the colour of the window's light: gold, its home at every clock, with at most three tenths of the visitor's colour in it
`;
const HEAD = 'varying vec3 vW, vN; varying vec2 vUv; varying vec4 vCol;' + LIB;
const glowU = (o) => ({ uGlow: { value: new THREE.Vector4(...(o.glow ? [o.glow[0], o.glow[1], o.glow[2], o.glow[3] * o.glow[3]] : [0, 0, 0, 1])) }, uGlowK: { value: o.glow ? o.glow[4] : 0 } });
const GLOW = /* glsl */`
uniform vec4 uGlow; uniform float uGlowK;
vec3 isGlow(vec3 n, vec3 w){      // the light of the tower's window (its colour of the moment, warmed) on a face, from one place, falling off with distance
  vec3 d = uGlow.xyz - w; float dd = dot(d, d);
  return mix(isCycle(), vec3(1., .86, .66), .3)*uGlowK*(.3 + .7*max(dot(n, d*inversesqrt(dd + 1.)), 0.))*uGlow.w/(dd + uGlow.w);
}`;
const lampU = (o) => {
  const L = [], C = [], list = o.lamps || [];
  for (let i = 0; i < 8; i++) { const l = list[i];
    L.push(l ? new THREE.Vector4(l[0], l[1], l[2], (l[3] || 30) * (l[3] || 30)) : new THREE.Vector4(0, -9999, 0, 1));
    C.push(l ? new THREE.Color(l[4] || '#ffb866').multiplyScalar(l[5] ?? 1) : new THREE.Color(0, 0, 0)); }
  return { uLamp: { value: L }, uLampCol: { value: C } };
};
// solid(shared, o): o.glow [x, y, z, reach, strength] the place the tower's window lights it from; o.lamps up to eight [x, y, z, reach in metres, colour, strength]; o.stage how much even light the island's
// many small lamps give everything on it; o.pave [pitch in metres, strength] square tiles on faces that look up
export function solid(shared, o = {}) {
  return new THREE.ShaderMaterial({ name: 'isleSolid', vertexShader: VERT, fog: true, side: o.side ?? THREE.DoubleSide,
    uniforms: U(shared, { ...lampU(o), ...glowU(o), uStage: { value: new THREE.Color(o.stageColor || '#ffd9b0').multiplyScalar(o.stage ?? 0.3) },
      uPave: { value: new THREE.Vector2(...(o.pave || [4, 0])) } }),
    fragmentShader: /* glsl */`${HEAD}
      uniform vec4 uLamp[8]; uniform vec3 uLampCol[8], uStage; uniform vec2 uPave;
      ${GLOW}
      void main(){
        vec3 n = isUnit(vN); if (!gl_FrontFacing) n = -n;
        vec3 base = vCol.rgb;
        vec2 pc = vW.xz/max(uPave.x, .1); pc.x += .5*floor(pc.y); vec2 pf = fract(pc), fw = max(fwidth(pc), vec2(1e-5)), e = min(pf, 1. - pf);
        float fine = 1. - smoothstep(.2, .6, max(fw.x, fw.y)), up = uPave.y*smoothstep(.7, .95, n.y);
        vec2 jn = (1. - smoothstep(vec2(.03), vec2(.03) + fw*1.5, e))*clamp(.06/fw, 0., 1.);
        base *= 1. + up*(fine*(isHash(floor(pc)) - .5)*.5 - .45*max(jn.x, jn.y));
        vec3 lit = base*(isSky(n) + uStage*(.6 + .4*n.y));
        for (int i = 0; i < 8; i++) {
          vec3 d = uLamp[i].xyz - vW; float dd = dot(d, d);
          lit += base*uLampCol[i]*(.3 + .7*max(dot(n, d*inversesqrt(dd + 1.)), 0.))*uLamp[i].w/(dd + uLamp[i].w);
        }
        lit += base*isGlow(n, vW) + vCol.rgb*vCol.a;      // the tower's window on it; its own light (a lit window, a lamp's body)
        gl_FragColor = vec4(isFog(lit), 1.);
      }` });
}
// chasm(shared, o): the pit's wall (o.pit [x, z] its middle; its uv x once round). Stone: broad uneven beds (12 to 30 m) that
// wander round the pit, each a little darker under its lip, broad blotches; no fine pattern (all of it fades by the pixel's
// footprint). Lit by the dome's violet from above (ledge tops and a buttress's shoulders hold more, the open rim most), one flank
// of each buttress more than the other, by o.lamps (the islands' and the tower's glow, as solid's) and from below by the mist
// of the depths, into whose colour it sinks by 200 m down
export function chasm(shared, o = {}) {
  return new THREE.ShaderMaterial({ name: 'isleChasm', vertexShader: VERT, fog: true, side: THREE.FrontSide,
    uniforms: U(shared, { ...lampU(o), uPit: { value: new THREE.Vector2(...(o.pit || [0, 0])) }, uHeap: { value: null }, uLedge: { value: new THREE.Vector4(...(o.ledges || [14, 52, 112, 196])) }, uOrbR: { value: o.orbR ?? 1.5 } }),
    fragmentShader: /* glsl */`${HEAD}
      uniform vec4 uLamp[8], uLedge; uniform vec3 uLampCol[8]; uniform vec2 uPit; uniform sampler2D uHeap; uniform float uOrbR;
      void main(){
        vec3 n = isUnit(vN);
        float depth = max(-vW.y, 0.), a = vUv.x*6.2832;
        vec2 pc = vW.xz - uPit, rad = pc*inversesqrt(dot(pc, pc) + 1e-4);
        float wob = isVn(vec2(a*21., depth*.018));
        float s = depth/19. + .9*sin(depth*.031) + .45*sin(a*3.) + .25*sin(a*7. + 1.7) + .5*wob, si = floor(s), sf = fract(s), fs = max(fwidth(s), 1e-5);
        float fine = 1. - smoothstep(.1, .4, fs);
        float tone = mix(isHash(vec2(si, 7.)), isHash(vec2(si + 1., 7.)), smoothstep(.6, 1., sf));      // a bed's tone, passing softly into the next
        float lip = mix(1., mix(.7 + .3*smoothstep(0., .55, sf), .7, smoothstep(1. - 2.5*fs, 1., sf)), fine);      // darker under a bed's lip, a broad soft shade
        vec2 gq = vec2(a*52., depth*.045); float gf = max(max(fwidth(gq.x), fwidth(gq.y)), 1e-5);
        float grain = mix(.5, isVn(gq)*.65 + isVn(gq*2.3 + 9.1)*.35, 1. - smoothstep(.12, .4, gf));      // blotches 10 m and more across
        vec3 stone = mix(vec3(.33, .22, .50), vec3(.20, .14, .36), mix(.5, tone, fine))*(.74 + .52*grain)*lip;
        float up = .5 + .5*n.y, inw = max(-dot(n.xz, rad), 0.), flank = n.x*rad.y - n.z*rad.x, open = exp(-depth/80.);
        vec3 col = stone*vec3(.60, .50, 1.)*(.10 + .62*up*up)*(.22 + .78*open)*max(.35 + .65*inw + .5*flank, .08);
        col += stone*vec3(1., .72, .46)*.2*exp(-depth/22.)*(.4 + .6*inw);      // the orbs' light spilling over the rim
        for (int i = 0; i < 8; i++) { vec3 d = uLamp[i].xyz - vW; float dd = dot(d, d), f = uLamp[i].w/(dd + uLamp[i].w);      // gathered on what is nearest it (the square of the fall)
          col += stone*uLampCol[i]*(.2 + .8*max(dot(n, d*inversesqrt(dd + 1.)), 0.))*f*f; }
        col += stone*vec3(.34, .40, .78)*.42*smoothstep(40., 150., depth)*(.75 - .25*n.y)*(.5 + .5*inw);      // the mist's glow from below
        // the orbs that lie on the ledges (uHeap: once round the pit, a row a ledge: their mean colour times how much of the band
        // they fill, and that share): where an orb would be under 5 pixels across (by this pixel's footprint) it is not drawn as
        // a ball but melts into one soft dim band of light on the ledge's top and the wall just above it, taller where a heap lies
        float pxw = max(min(length(dFdx(vW)), length(dFdy(vW))), 1e-4), melt = .2 + .8*(1. - smoothstep(2.2, 5., 2.*uOrbR/pxw));
        vec4 hp0 = texture2D(uHeap, vec2(vUv.x, .125)), hp1 = texture2D(uHeap, vec2(vUv.x, .375)), hp2 = texture2D(uHeap, vec2(vUv.x, .625)), hp3 = texture2D(uHeap, vec2(vUv.x, .875));      // the four ledges' rows, read before the loop
        for (int k = 0; k < 4; k++) {
          float D = uLedge[k], h = D - depth; vec4 hp = k == 0 ? hp0 : (k == 1 ? hp1 : (k == 2 ? hp2 : hp3));
          float wgt = step(-.02, h)*exp(-max(h, 0.)/(1.6 + 2.4*hp.a))*melt;
          col = col*(1. - .85*hp.a*wgt) + hp.rgb*(.46 + .5*(.3 + .7*exp(-D/80.)))*wgt*.9;
        }
        col = mix(col, vec3(.058, .040, .130), smoothstep(110., 205., depth));
        gl_FragColor = vec4(isFog(col), 1.);
      }` });
}
// mist(shared, o): a level sheet of slow glowing mist in the pit (several lie one under another). o.pit [x, z, radius]; o.lay
// [its drift in metres a second along x and z, its thickness (0 to 1), its own offset]. Deep violet where thin, a faint
// blue-white where thick; it thins toward the wall. Light falls into it: o.pools up to twelve [x, z, radius, colour, strength]
// (a broad soft pool under an island, and three long soft streaks of its colour toward the eye, like lamps on still water), o.tracks up to six [x, z, x, z] (a faint lit track under a line of light), o.win [x, z,
// radius, strength] (the colour the tower's window holds, on the mist before the tower)
const poolU = (o) => {
  const P = [], C = [], K = [], pools = o.pools || [], tracks = o.tracks || [], w = o.win || [0, 0, 1, 0];
  for (let i = 0; i < 12; i++) { const q = pools[i];
    P.push(q ? new THREE.Vector4(q[0], q[1], 1 / (q[2] * q[2]), 0) : new THREE.Vector4(0, 0, 1, 0)); C.push(q ? new THREE.Color(q[3]).multiplyScalar(q[4]) : new THREE.Color(0, 0, 0)); }
  for (let i = 0; i < 6; i++) { const q = tracks[i]; K.push(q ? new THREE.Vector4(q[0], q[1], q[2], q[3]) : new THREE.Vector4(1e6, 1e6, 1e6, 1e6)); }
  return { uPool: { value: P }, uPoolCol: { value: C }, uTrack: { value: K }, uWin: { value: new THREE.Vector4(w[0], w[1], 1 / (w[2] * w[2]), w[3]) } };
};
export function mist(shared, o = {}) {
  return new THREE.ShaderMaterial({ name: 'isleMist', vertexShader: VERT, fog: true, transparent: true, depthWrite: false,
    uniforms: U(shared, { ...poolU(o), uPit: { value: new THREE.Vector3(...(o.pit || [0, 0, 500])) }, uLay: { value: new THREE.Vector4(...(o.lay || [1, 0, 0.5, 0])) } }),
    fragmentShader: /* glsl */`${HEAD}
      uniform vec4 uPool[12], uTrack[6], uWin, uLay; uniform vec3 uPoolCol[12], uPit;
      void main(){
        vec2 p = vW.xz, q = (p + uLay.xy*uTime)/170. + uLay.w, q2 = (p - uLay.yx*uTime*1.7)/58. + uLay.w*3.;
        float f1 = max(max(fwidth(q.x), fwidth(q.y)), 1e-5), f2 = max(max(fwidth(q2.x), fwidth(q2.y)), 1e-5);
        float cloud = mix(.5, isVn(q), 1. - smoothstep(.15, .5, f1))*.66 + mix(.5, isVn(q2), 1. - smoothstep(.15, .5, f2))*.34;
        float dens = smoothstep(.28, .8, cloud);
        vec3 col = mix(vec3(.046, .028, .115), vec3(.21, .25, .47), dens*dens);
        float hold = .45 + .55*dens;      // thick mist holds more of a light
        vec3 pl = vec3(0.); float pw = 0.;      // a pool takes the place of the mist's own colour, so that it keeps its colour
        vec3 sk = vec3(0.);      // and, like lamps on still water at night, three long soft streaks of each pool's colour from under its lights toward the eye (a sheen)
        for (int i = 0; i < 12; i++) { vec2 d = uPool[i].xy - p; float w = exp(-dot(d, d)*uPool[i].z); pl += uPoolCol[i]*w; pw += w;
          vec2 e = cameraPosition.xz - uPool[i].xy, dir = e*inversesqrt(dot(e, e) + 1.); float al = -dot(d, dir), la = d.y*dir.x - d.x*dir.y, run = smoothstep(-10., 30., al)*exp(-max(al, 0.)/150.);
          for (int k = 0; k < 3; k++) { float lk = la - (float(k) - 1.)*24.; sk += uPoolCol[i]*exp(-lk*lk/(14. + .0016*al*al))*run*(.55 + .45*isHash(vec2(float(i), float(k) + 3.))); } }
        col = col*(1. - .82*clamp(pw, 0., 1.)) + pl*(.55 + .45*dens) + sk*.42;
        for (int i = 0; i < 6; i++) { vec2 ab = uTrack[i].zw - uTrack[i].xy, pa = p - uTrack[i].xy, d = pa - ab*clamp(dot(pa, ab)/max(dot(ab, ab), 1.), 0., 1.);
          col += vec3(1., .82, .52)*.2*exp(-dot(d, d)/300.)*hold; }
        vec2 dw = uWin.xy - p; col += mix(isCycle(), vec3(1., .86, .66), .25)*uWin.w*exp(-dot(dw, dw)*uWin.z)*hold;
        vec2 pc = p - uPit.xy; float pr = sqrt(dot(pc, pc) + 1e-4), edge = 1. - smoothstep(uPit.z - 80., uPit.z - 6., pr);
        gl_FragColor = vec4(isFog(col), clamp(uLay.z*(.4 + .6*dens)*(.35 + .65*edge), 0., 1.));
      }` });
}
// shell(shared, o): o.tint; o.ribs [ribs round, a seam's half width in ribs, the pitch of level seams in metres or 0, sheen];
// o.glow as solid's; o.key [a unit direction, strength] a soft violet light from one side; o.spill the reach in metres of the window's light on the shell beside it;
// o.lift how much of the dome's light it holds (a pale shell more); o.warm [the height of the lamps that light it from below, their reach in metres, strength]; o.win [the tower's x, z, the cosine
// of the window's half angle, the window's foot, its head, strength]: the window's own colour on the shell beside it (it faces -z)
export function shell(shared, o = {}) {
  const w = o.win || [0, 0, 2, 0, 0, 0];
  return new THREE.ShaderMaterial({ name: 'isleShell', vertexShader: VERT, fog: true, side: o.side ?? THREE.FrontSide,
    uniforms: U(shared, { uTint: { value: new THREE.Color(o.tint || '#cfc6e6') }, uRib: { value: new THREE.Vector4(...(o.ribs || [48, 0.02, 0, 0.6])) },
      uWarm: { value: new THREE.Vector3(...(o.warm || [0, 10, 0])) }, uWinA: { value: new THREE.Vector3(w[0], w[1], w[2]) }, uWinB: { value: new THREE.Vector3(w[3], w[4], w[5]) }, uLift: { value: o.lift ?? 1 }, ...glowU(o),
      uKey: { value: new THREE.Vector4(...(o.key || [0, 1, 0, 0])) }, uSpill: { value: o.spill ?? 7 } }),
    fragmentShader: /* glsl */`${HEAD}
      uniform vec3 uTint, uWarm, uWinA, uWinB; uniform vec4 uRib, uKey; uniform float uLift, uSpill;
      ${GLOW}
      void main(){
        vec3 n = isUnit(vN), v = isUnit(cameraPosition - vW);
        vec3 t = cross(vec3(0., 1., 0.), n); t *= inversesqrt(max(dot(t, t), 1e-4));
        float rc = vUv.x*uRib.x, rf = fract(rc), fw = max(fwidth(rc), 1e-5), e = min(rf, 1. - rf), fine = 1. - smoothstep(.2, .6, fw);
        float seam = (1. - smoothstep(uRib.y, uRib.y + fw*1.5, e))*clamp(2.*uRib.y/fw, 0., 1.);
        float by = vW.y/max(uRib.z, .01), bw = max(fwidth(by), 1e-5), be = min(fract(by), 1. - fract(by));
        float band = (1. - smoothstep(.012, .012 + bw*1.5, be))*clamp(.024/bw, 0., 1.)*step(.5, uRib.z);
        n = isUnit(n + t*sin((rf - .5)*6.2832)*.16*fine);
        float nv = clamp(dot(n, v), 0., 1.); vec3 r = reflect(-v, n);
        vec3 col = uTint*isSky(n)*uLift*(1. + .14*fine*(isHash(vec2(floor(rc), 3.)) - .5));
        col += uTint*uRib.w*(vec3(.22, .15, .34)*isPow(1. - nv, 3.) + vec3(.34, .24, .36)*isPow(dot(r, vec3(0., .423, .906)), 10.));
        col += uTint*vec3(1., .62, .30)*uWarm.z*exp(-abs(vW.y - uWarm.x)/max(uWarm.y, 1.))*(.62 - .38*n.y);
        vec2 q = vW.xz - uWinA.xy; float ql = sqrt(dot(q, q) + 1e-4), ca = -q.y/ql;
        float da = max(uWinA.z - ca, 0.)*ql*1.25, dy = max(max(uWinB.x - vW.y, vW.y - uWinB.y), 0.);
        col += uTint*mix(isCycle(), vec3(1., .88, .72), .3)*uWinB.z*exp(-sqrt(da*da + dy*dy + 1e-4)/max(uSpill, 1.));
        col += uTint*(isGlow(n, vW) + vec3(.55, .45, .80)*uKey.w*max(dot(n, uKey.xyz), 0.));      // the window's light from afar; a soft light from one side, so that a round thing reads round
        col *= 1. - .55*max(seam, band);
        gl_FragColor = vec4(isFog(isDeep(col, vW.y)), 1.);
      }` });
}
// windowGlass(shared, o): milky glass over a steady ground that is amber at the sill going to a dusky rose-violet at the top, the
// same at every clock; over it, softly, the light of the round's visitor (isVisit: it never takes the ground over). Behind it, dimly: tier over tier of softly glowing orbs in rows at two depths (10 by 5
// across the band in front, 13 by 6 behind; soft round lights with a bright core, a third gold and the rest blue, red, green and
// violet in runs of four, a few rows travelling slowly; far off they melt into one smooth warm glow, by the pixel's footprint),
// and five broad blurred lights drifting across the band. Light and colour only: no shape.
// Slow soft clouds in the glass, dimmer toward the frame; dark mullions (o.grid [panes across, panes up])
export function windowGlass(shared, o = {}) {
  return new THREE.ShaderMaterial({ name: 'isleWindow', vertexShader: VERT, fog: true,
    uniforms: U(shared, { uGrid: { value: new THREE.Vector4(...(o.grid || [18, 4]), ...(o.mull || [0.05, 0.028])) }, uGain: { value: o.gain ?? 1.45 } }),
    fragmentShader: /* glsl */`${HEAD}
      uniform vec4 uGrid; uniform float uGain;
      void main(){
        vec2 pc = vUv*uGrid.xy, pf = fract(pc), fw = max(fwidth(pc), vec2(1e-5)), e = min(pf, 1. - pf);
        vec2 m = (1. - smoothstep(uGrid.zw, uGrid.zw + fw*1.5, e))*clamp(2.*uGrid.zw/fw, 0., 1.);
        float mull = max(m.x, m.y), h = isHash(floor(pc) + 5.);
        float cloud = isVn(vUv*vec2(14., 4.) + vec2(uTime*.045, -uTime*.03))*.6 + isVn(vUv*vec2(31., 9.) - vec2(uTime*.03, uTime*.02))*.4;
        float body = (.55 + .5*sin(clamp(vUv.y, 0., 1.)*3.14159))*(.45 + 1.1*cloud*cloud)*(.8 + .4*h);
        vec2 ed = min(vUv, 1. - vUv); body *= .55 + .45*smoothstep(0., .06, min(ed.x*2.6, ed.y));
        vec2 cq = (vUv - vec2(.5, .3))*vec2(2.4, 2.2);
        float top = clamp(vUv.y, 0., 1.), milk = .8 + .2*clamp(body, 0., 1.4);
        vec3 ground = mix(mix(vec3(.50, .19, .035), vec3(.20, .065, .19), smoothstep(.05, 1., top)), uOrb[0]*.3, .1)*(.66 + .26*(1. - top));      // between the orbs: a deep warm amber, going to a dusky rose-violet toward the top of the band (steady)
        vec4 vis = isVisit(); vec3 visit = vis.rgb*(.05*vis.a*clamp(body, 0., 1.4));      // the visitor's light over the ground, soft and never much
        vec3 lights = vec3(0.);      // five broad blurred lights in the orbs' colours drift across the band (each in 10 to 18 s, by turns east and west): the glow among the orbs
        for (int i = 0; i < 5; i++) { float fi = float(i), T = 16. + 3.3*fi, way = mod(fi, 2.) < .5 ? 1. : -1.;
          vec2 d = (vUv - vec2(fract(uTime/T*way + fi*.37)*1.6 - .3, .5 + .3*sin(uTime*(.17 + .03*fi) + fi*2.1)))*vec2(1.9, 1.);
          lights += uOrb[i]*exp(-dot(d, d)*5.5); }
        // behind the glass, dimly: tier over tier of great softly glowing orbs in rows (two depths: 4 and 15 m behind it, each
        // shifting against the glass as the eye moves; ten and thirteen across the band), a third of them gold, the rest blue,
        // red, green and violet in runs of four, in the orbs' full colours, each with a bright soft core; a few rows travel
        // slowly. Soft round lights only. Where an orb's cell would be under about 10 pixels it melts into the rows' mean glow
        vec3 nn = isUnit(vN), V = isUnit(cameraPosition - vW), tt = isUnit(vec3(nn.z, 0., -nn.x));
        vec2 par = vec2(dot(V, tt)/112., V.y/58.)/max(dot(V, nn), .3);
        vec3 mean = mix(uOrb[0]*.34 + (uOrb[1] + uOrb[2] + uOrb[3] + uOrb[4])*.165, vec3(1., .5, .14), .6)*.36, orbs = vec3(0.); float ow = 0.;      // far off: the rows' mean light, warmed
        vec2 ga = (vUv - par*4.)*vec2(10., 5.), gb = (vUv - par*15.)*vec2(13., 6.);      // the two depths' footprints, taken before the loop
        float fw0 = max(max(fwidth(ga.x), fwidth(ga.y)), 1e-5), fw1 = max(max(fwidth(gb.x), fwidth(gb.y)), 1e-5);
        for (int L = 0; L < 2; L++) { float fl = float(L), far = L == 0 ? 1. : .55; vec2 n2 = L == 0 ? vec2(10., 5.) : vec2(13., 6.);
          vec2 g = (vUv - par*(4. + 11.*fl))*n2 + vec2(.37*fl, .5*fl); float fwc = L == 0 ? fw0 : fw1, sharp = 1. - smoothstep(.06, .11, fwc);
          g.y += .16*sin(vUv.x*9.4 + 1.3 + fl); float row = floor(g.y), hr = isHash(vec2(row, 3. + fl));
          g.x += hr < .3 ? uTime*(.05 + .16*hr)*(mod(row, 2.) < .5 ? 1. : -1.) : 0.;
          vec2 c = floor(g), f = fract(g) - .5; float hc = isHash(vec2(floor(c.x/4.) + 17.*fl, row + 7.)), sel = floor((hc - .34)*6.);
          vec3 oc = hc < .34 ? uOrb[0] : (sel < .5 ? uOrb[1] : (sel < 1.5 ? uOrb[2] : (sel < 2.5 ? uOrb[3] : uOrb[4])));
          float r2 = dot(f, f), core = exp(-r2*42.), blob = (exp(-r2*9.)*.8 + core*.9)*(.7 + .3*isHash(c + 31.*fl));
          orbs += mix(mean, oc*blob + vec3(.2)*core, sharp)*far; ow += mix(.3, min(blob, 1.), sharp)*far; }
        vec3 glass = (ground*(1. - .65*clamp(ow, 0., 1.)) + orbs*.8 + lights*.1 + visit)*milk*(.55 + .45*smoothstep(0., .06, min(ed.x*2.6, ed.y)))*uGain;
        gl_FragColor = vec4(isFog(mix(glass, glass*.07 + vec3(.05, .04, .08), mull)), 1.);
      }` });
}
const AIR = /* glsl */`
        float air = 1.;
        #ifdef USE_FOG
          #ifdef FOG_EXP2
            air = exp(-fogDensity*fogDensity*vFogDepth*vFogDepth);
          #else
            air = 1. - smoothstep(fogNear, fogFar, vFogDepth);
          #endif
        #endif`;
// lamps(shared, o): one quad drawn once per lamp (aPos its place, aLamp its colour and its radius in metres), turned to the eye:
// a round bright core and a soft halo o.halo times as wide. Far off a lamp is never drawn smaller than a pixel: it is dimmed
export function lamps(shared, o = {}) {
  return new THREE.ShaderMaterial({ name: 'isleLamps', fog: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: U(shared, { uK: { value: new THREE.Vector3(o.halo ?? 3.2, o.gain ?? 2.2, o.haloGain ?? 0.22) } }),
    vertexShader: /* glsl */`
      attribute vec3 aPos; attribute vec4 aLamp; uniform vec3 uK;
      varying vec2 vQ; varying vec3 vL;
      #include <fog_pars_vertex>
      void main(){
        vec4 mvPosition = modelViewMatrix*vec4(aPos, 1.);
        float d = max(-mvPosition.z, .1), px = d*2./(projectionMatrix[1][1]*560.);      // about a pixel's breadth at this distance
        float want = max(aLamp.w, .01)*uK.x, r = max(want, px*1.6), k = clamp(want/r, 1e-4, 1.);
        vQ = position.xy; vL = aLamp.rgb*k*sqrt(k);
        mvPosition.xy += position.xy*r; gl_Position = projectionMatrix*mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      varying vec2 vQ; varying vec3 vL; uniform vec3 uK;
      #include <fog_pars_fragment>
      void main(){
        float q = sqrt(dot(vQ, vQ) + 1e-6), c = 1./max(uK.x, 1.), fw = max(fwidth(q), 1e-4);
        float core = 1. - smoothstep(c - fw, c + fw, q), halo = exp(-q*q*5.)*(1. - smoothstep(.6, 1., q));
        ${AIR}
        gl_FragColor = vec4(vL*(core*uK.y + halo*uK.z)*air, 1.);
      }` });
}
// greyOrbs(shared, o): one quad drawn once per orb, turned to the eye, with a ball drawn on it (opaque; what lies outside the
// ball is cut away last). aPos: x, where in its fall it begins (0 to 1), z; aK: its speed in metres a second, its radius, the
// phase of its small sway (1.2 m at most), its tone. It falls from o.top through o.span metres and begins again at the top,
// swelling from nothing over the first 4 hundredths of its fall, and fades into the haze of the depths as it sinks.
// o.pit [the pit's x, z, the lip's radius, 1 or 0]: with 1 it starts at the lip and leaves the wall as it falls (to aPos by 100 m down)
const FALL = /* glsl */`
      attribute vec3 aPos; attribute vec4 aK; uniform vec2 uFall; uniform vec4 uPit; uniform float uTime;
      vec4 isFall(){      // where the orb is now (xyz) and how far it has swollen (w)
        float f = fract(aPos.y + uTime*aK.x/max(uFall.y, 1.)), fallen = f*uFall.y;
        vec2 dc = aPos.xz - uPit.xy; float dl = sqrt(dot(dc, dc) + 1e-4);
        vec2 xz = aPos.xz + dc/dl*max(uPit.z - dl, 0.)*uPit.w*exp(-fallen/30.);      // poured over the lip, it leaves the wall as it falls
        return vec4(xz.x + sin(uTime*.21 + aK.z)*1.2, uFall.x - fallen, xz.y + cos(uTime*.17 + aK.z*1.7)*1.2, smoothstep(0., .04, f));
      }`;
const fallU = (o) => ({ uFall: { value: new THREE.Vector2(o.top ?? 0, o.span ?? 300) }, uPit: { value: new THREE.Vector4(...(o.pit || [0, 0, 0, 0])) }, uGrey: { value: new THREE.Color(ORB.grey) } });
export function greyOrbs(shared, o = {}) {
  return new THREE.ShaderMaterial({ name: 'isleGreyOrbs', fog: true, transparent: true, depthWrite: false, uniforms: U(shared, fallU(o)),
    vertexShader: /* glsl */`${FALL}
      varying vec2 vQ; varying vec3 vK;
      #include <fog_pars_vertex>
      void main(){
        vec4 c = isFall(), mvPosition = modelViewMatrix*vec4(c.xyz, 1.);
        vQ = position.xy; vK = vec3(c.y, aK.w, c.w);
        mvPosition.xy += position.xy*aK.y*c.w; gl_Position = projectionMatrix*mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      varying vec2 vQ; varying vec3 vK; uniform vec3 uGrey; uniform vec2 uFall;
      ${LIB}
      void main(){
        float q2 = dot(vQ, vQ), z = sqrt(max(1. - q2, 1e-6)), fade = smoothstep(-uFall.y, -uFall.y*.12, vK.x - uFall.x);
        vec3 n = vec3(vQ, z);
        float swirl = isVn(vQ*2.6 + vec2(vK.y*37., vK.x*.02))*.6 + isVn(vQ*5.5 - vec2(vK.y*11., vK.x*.031))*.4;      // a slow dull weather in it, turning as it sinks
        vec3 col = uGrey*(.26 + .30*z*z*(.55 + .9*swirl) + .22*isPow(1. - z, 2.))*(.7 + .6*vK.y);      // dim glass faintly lit within
        col += vec3(.16, .14, .26)*isPow(dot(n, vec3(-.29, .77, .57)), 24.);      // a small glint from the dome
        col = mix(col, vec3(.07, .05, .14), .7*smoothstep(.55, 1., q2));      // soft at its limb
        float seen = smoothstep(1.6, 3.6, 2./max(fwidth(vQ.x), 1e-5))*(1. - smoothstep(105., 150., -vK.x));      // under about 3 pixels across it melts away; it melts into the mist as it reaches it
        gl_FragColor = vec4(isFog(mix(vec3(.058, .040, .130), col, fade)), seen*(1. - smoothstep(.72, 1., q2)));
        if (q2 > 1.) discard;
      }` });
}
// orbTrail(shared, o): on the same quads as greyOrbs (same o), a short soft trail of light above each falling orb (seven radii
// long, its light added to what lies behind), fading as the orb sinks
export function orbTrail(shared, o = {}) {
  return new THREE.ShaderMaterial({ name: 'isleOrbTrail', fog: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, uniforms: U(shared, fallU(o)),
    vertexShader: /* glsl */`${FALL}
      varying vec2 vQ; varying vec3 vK;
      #include <fog_pars_vertex>
      void main(){
        vec4 c = isFall(), mvPosition = modelViewMatrix*vec4(c.xyz, 1.);
        vec3 up = mat3(modelViewMatrix)*vec3(0., 1., 0.);
        vQ = position.xy; vK = vec3(c.y, aK.w, c.w);
        mvPosition.xyz += (up*((position.y*.5 + .5)*7. + .2) + vec3(position.x*.85, 0., 0.))*aK.y*c.w; gl_Position = projectionMatrix*mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      varying vec2 vQ; varying vec3 vK; uniform vec3 uGrey; uniform vec2 uFall;
      #include <fog_pars_fragment>
      void main(){
        float v = vQ.y*.5 + .5, x2 = vQ.x*vQ.x, fade = smoothstep(-uFall.y, -uFall.y*.12, vK.x - uFall.x);
        float t = exp(-x2*3.5)*(1. - x2)*(1. - v)*(1. - v)*smoothstep(0., .06, v);
        ${AIR}
        float seen = smoothstep(1.6, 3.6, 2./(.85*max(fwidth(vQ.x), 1e-5)))*(1. - smoothstep(105., 150., -vK.x));      // as its orb: gone where the orb is under about 3 pixels, and in the mist
        gl_FragColor = vec4(uGrey*vec3(.8, .85, 1.2)*.34*t*fade*vK.z*seen*air, 1.);
      }` });
}
// ledgeOrbs(shared): dim glass balls that lie still (one quad a ball, turned to the eye, opaque; what lies outside the ball is
// cut away last). aPos its middle, aK: its radius, its tone; aTint its colour (grey, or grey with a ghost of an orb's colour).
// Lit by the dome from above (less the deeper it lies), faintly lit within; it sinks into the mist's colour with the wall.
// It is a ball only where it is about 4 pixels across or more: from 5 pixels down to 2.2 it melts away smoothly (the wall's
// own band of the heaps' light, islemat's chasm, takes its place); drawn before the mist's sheets, so that they veil it
export function ledgeOrbs(shared) {
  return new THREE.ShaderMaterial({ name: 'isleLedgeOrbs', fog: true, transparent: true, uniforms: U(shared, {}),
    vertexShader: /* glsl */`
      attribute vec3 aPos, aTint; attribute vec2 aK;
      varying vec2 vQ; varying vec3 vK, vT;
      #include <fog_pars_vertex>
      void main(){
        vec4 mvPosition = modelViewMatrix*vec4(aPos, 1.);
        float r = aK.x;
        vQ = position.xy; vK = vec3(aPos.y, aK.y, 1.); vT = aTint;
        mvPosition.xy += position.xy*r; gl_Position = projectionMatrix*mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      varying vec2 vQ; varying vec3 vK, vT;
      ${LIB}
      void main(){
        float q2 = dot(vQ, vQ), z = sqrt(max(1. - q2, 1e-6)), open = exp(min(vK.x, 0.)/80.);
        vec3 n = vec3(vQ, z);
        vec3 col = vT*(.46 + (.24 + .6*max(n.y, 0.))*(.3 + .7*open) + .2*isPow(1. - z, 2.))*(.75 + .5*vK.y);
        col += vec3(.16, .14, .26)*isPow(max(dot(n, vec3(-.29, .77, .57)), 0.), 24.)*open;
        col = mix(col, vec3(.058, .040, .130), smoothstep(110., 205., -vK.x))*(.45 + .55*vK.z);
        gl_FragColor = vec4(isFog(col), smoothstep(2.2, 5., 2./max(fwidth(vQ.x), 1e-5)));      // its breadth in pixels: full at 5 and more, gone at 2.2
        if (q2 > 1.) discard;
      }` });
}
// lineOfLight(shared, o): a ribbon between two places (aA, aB), turned to the eye; position.x where along it (0 to 1),
// position.y its side (-1 or 1). An unbroken ribbon: its bright core is o.width metres wide near and never thinner than 2 pixels
// far off, soft at its edges, a faint glow beside it. Pulses run from aA toward aB as brighter stretches some 22 m long: one
// every 1 / o.pulses metres, o.rate of them passing a place each second (a quarter of one: nothing flashes); aPh: each line's phase
export function lineOfLight(shared, o = {}) {
  return new THREE.ShaderMaterial({ name: 'isleLine', fog: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    uniforms: U(shared, { uW: { value: new THREE.Vector4(o.width ?? 0.5, o.gain ?? 0.78, o.pulses ?? 0.02, o.rate ?? 0.25) }, uCol: { value: new THREE.Color(o.color || '#ffdc9c') } }),
    vertexShader: /* glsl */`
      attribute vec3 aA, aB; attribute float aPh; uniform vec4 uW;
      varying vec3 vL; varying float vPh;
      #include <fog_pars_vertex>
      void main(){
        vec3 ab = aB - aA; float len = sqrt(max(dot(ab, ab), 1e-4));
        vec4 mvPosition = viewMatrix*modelMatrix*vec4(aA + ab*position.x, 1.);
        vec3 dv = mat3(viewMatrix)*(mat3(modelMatrix)*(ab/len));
        vec2 sd = vec2(-dv.y, dv.x); sd *= inversesqrt(max(dot(sd, sd), 1e-6));
        float d = max(-mvPosition.z, .1), px = d*2./(projectionMatrix[1][1]*560.), hw = max(uW.x*2., px*4.5);
        vL = vec3(position.y, position.x*len, .5*uW.x/hw); vPh = aPh;
        mvPosition.xy += sd*position.y*hw; gl_Position = projectionMatrix*mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      varying vec3 vL; varying float vPh; uniform vec4 uW; uniform vec3 uCol; uniform float uTime;
      #include <fog_pars_fragment>
      void main(){
        float v = abs(vL.x), fw = max(fwidth(vL.x), 1e-5), c = max(vL.z, 1.1*fw);      // the core's half width: never under 1.1 pixels (the ribbon never under two)
        float core = 1. - smoothstep(c*.3, c + fw*1.6, v), halo = exp(-v*v*7.)*(1. - v)*(1. - v)*.2;      // soft at its edges
        float b = fract(vL.y*uW.z - uTime*uW.w + vPh) - .5, bump = exp(-b*b*13.);      // a pulse: a brighter stretch some 22 m long
        ${AIR}
        gl_FragColor = vec4(uCol*uW.y*(core + halo)*(.8 + .95*bump)*air, 1.);
      }` });
}
// the quad every lamp and every orb is drawn on (corners at -1 and 1), drawn `count` times; `attrs`: { name: [Float32Array, size] }
// beams(shared, o): searchlights. A ribbon from aA (the lamp) aQ.w metres out along a direction that sweeps slowly by the clock
// (round its bearing aQ.x in 31 s, about its lean aQ.y from upright in 23 s; aQ.z its phase); position.x where along it,
// position.y its side. Soft across, widening from 2.4 to 30 m, fading along its length; its light added to what lies behind
export function beams(shared, o = {}) {
  return new THREE.ShaderMaterial({ name: 'isleBeams', fog: true, transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending,
    uniforms: U(shared, { uCol: { value: new THREE.Color(o.color || '#ffe6c0').multiplyScalar(o.gain ?? 0.2) } }),
    vertexShader: /* glsl */`
      attribute vec3 aA; attribute vec4 aQ; uniform float uTime; varying vec2 vL;
      #include <fog_pars_vertex>
      void main(){
        float az = aQ.x + .85*sin(uTime*6.2832/31. + aQ.z), tilt = aQ.y + .28*sin(uTime*6.2832/23. + aQ.z*1.7);
        vec3 dir = vec3(sin(tilt)*cos(az), cos(tilt), sin(tilt)*sin(az));
        vec4 mvPosition = viewMatrix*vec4(aA + dir*aQ.w*position.x, 1.);
        vec3 dv = mat3(viewMatrix)*dir; vec2 side = vec2(-dv.y, dv.x); side *= inversesqrt(max(dot(side, side), 1e-6));
        mvPosition.xy += side*position.y*mix(1.2, 15., position.x); vL = vec2(position.y, position.x);
        gl_Position = projectionMatrix*mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      varying vec2 vL; uniform vec3 uCol;
      #include <fog_pars_fragment>
      void main(){
        float x2 = vL.x*vL.x, far = 1. - vL.y;
        ${AIR}
        gl_FragColor = vec4(uCol*exp(-x2*3.2)*(1. - x2)*far*far*smoothstep(0., .03, vL.y)*air, 1.);
      }` });
}
// sparks(shared, o): slow blooms of coloured sparks. One quad a spark, turned to the eye: aC the bloom's middle and its period in
// seconds, aD the spark's own direction and how far it flies (m), aS: the bloom's phase (0 to 1), its colour's number, the
// spark's radius (m). A bloom opens once a period, each time a little elsewhere and in the next colour: its sparks fly out
// over about 2 s and sag, their light swelling over 0.9 s and fading over 3 s (never a flash)
export function sparks(shared, o = {}) {
  return new THREE.ShaderMaterial({ name: 'isleSparks', fog: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: U(shared, { uK: { value: new THREE.Vector3(o.halo ?? 3, o.gain ?? 1.5, o.haloGain ?? 0.3) } }),
    vertexShader: /* glsl */`
      attribute vec4 aC, aD; attribute vec3 aS; uniform float uTime; uniform vec3 uK, uOrb[5];
      varying vec2 vQ; varying vec3 vL;
      #include <fog_pars_vertex>
      float h1(vec2 p){ vec3 q = fract(vec3(p.xyx)*.1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y)*q.z); }
      void main(){
        float T = max(aC.w, 1.), tt = uTime + aS.x*T, n = floor(tt/T), tau = tt - n*T;
        float ha = h1(vec2(n, aS.y*7.3 + 1.)), hb = h1(vec2(n, aS.y*3.1 + 5.)), open = 1. - exp(-tau*1.2);
        vec3 c = aC.xyz + vec3((ha - .5)*44., (hb - .5)*30., (ha*hb - .25)*44.) + aD.xyz*aD.w*open - vec3(0., .55*tau*tau, 0.);
        float bright = smoothstep(0., .9, tau)*(1. - smoothstep(1.8, 5., tau));
        vec4 mvPosition = modelViewMatrix*vec4(c, 1.);
        float d = max(-mvPosition.z, .1), px = d*2./(projectionMatrix[1][1]*560.);
        float want = max(aS.z, .01)*uK.x, r = max(want, px*1.6), k = clamp(want/r, 1e-4, 1.);
        vQ = position.xy; vL = uOrb[int(mod(aS.y + n, 5.))]*bright*k*sqrt(k);
        mvPosition.xy += position.xy*r; gl_Position = projectionMatrix*mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      varying vec2 vQ; varying vec3 vL; uniform vec3 uK;
      #include <fog_pars_fragment>
      void main(){
        float q = sqrt(dot(vQ, vQ) + 1e-6), c = 1./max(uK.x, 1.), fw = max(fwidth(q), 1e-4);
        float core = 1. - smoothstep(c - fw, c + fw, q), halo = exp(-q*q*5.)*(1. - smoothstep(.6, 1., q));
        ${AIR}
        gl_FragColor = vec4(vL*(core*uK.y + halo*uK.z)*air, 1.);
      }` });
}
export function sprites(count, attrs) {
  const base = new THREE.PlaneGeometry(2, 2), g = new THREE.InstancedBufferGeometry();
  g.setIndex(base.index); g.setAttribute('position', base.attributes.position); g.instanceCount = count;
  for (const [name, [arr, size]] of Object.entries(attrs)) g.setAttribute(name, new THREE.InstancedBufferAttribute(arr, size));
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e5);
  return g;
}
