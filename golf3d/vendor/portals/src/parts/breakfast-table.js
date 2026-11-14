// THE HONEY FALL: hero set piece of "breakfast-table" (Breakfast Kingdom), built at 60x scale.
//
// A blue-banded china plate (15 m across) carries a stack of pancakes 10 m wide. Behind it a sage
// enamel gooseneck stand arches over and holds a tilted glass honey jar in a brass cradle. A wooden
// dipper pokes out of the jar mouth; honey runs down it and pours from its head in a 7 m rope that
// whirls into a coiled beehive pile on the top pancake, spreads into a pool round a melting butter
// pat and runs over the edge of the stack in glassy sheets, tongues and falling drops down to
// puddles on the plate. Raspberries give the single red accent.
//
// SIZE     radius ~16.5 m (stand foot at z = -13.5), height ~25 m. Origin = centre of the plate's
//          foot on the cloth, +Y up, front = +Z. The stand is at the BACK (-Z).
// LIGHT    Wants a low warm key from the LEFT (-X), i.e. the window. The honey and glass use their
//          own shaders: opts.lightDir (direction TOWARD the light, WORLD space: the shaders light in world space; default (-0.6,0.7,0.4)),
//          opts.lightColor (linear HDR, default cream x 3), opts.ambient. opts.standardMaterial(params)
//          replaces MeshStandardMaterial for the opaque parts (the world passes rig-lit materials). Seen from +X the rope is
//          back-lit and glows like molten gold (emissive ~2); from -X it is front-lit amber. Free honey (rope, coil, jar,
//          drops: uWet 0) has thin gold edges and a deep amber middle; the sheets on the stack (uWet 0.7) stay wet-glass glossy.
//          Everything else is MeshStandardMaterial lit by the scene's own lights. Fog supported.
// OPTS     palette  : 7 hex strings from the brief (cream, sage, linen, wood, red, dark, amber)
//          chinaBlue: hex for the plate bands (default '#2b4a9c')
//          lightDir, lightColor, ambient: see LIGHT.    progress: initial setProgress value (1)
// PROGRESS hero.setProgress(u01): 0 = honey has only just started over the edge, 1 = sheets and
//          tongues fully run down to the plate. Drive it from the path u (e.g. remap u 0.35..0.6);
//          never wall-clock. Ambient motion (coiling, flow, drops) runs on `time` in update().
// ANCHORS  (hero-local space)
//   lookAt        Vector3: middle of the honey rope: aim the POI here.
//   ropeTop/ropeBase  Vector3: where the rope leaves the dipper / lands on the pile.
//   jar           Vector3: centre of the honey jar.
//   orbit         { center, radius: 12, y, from, to }: the three-quarter circle of the brief. Angles
//                 are measured from +Z toward +X; the missing quarter is the back, where the stand is.
//   flyThrough    ordered Vector3 list along that orbit, 12 m from the rope, >= 6 m of clear air
//                 everywhere. It starts back-left (window side), passes the front and ends back-right
//                 with the rope back-lit; reverse it if the journey comes the other way.
//   viewpoints    { backlit, front, entry }: good still camera positions.
//   steamAcross   { from, to }: a line just beside the rope for the teapot steam to drift along.
//   keepOut       [{ center, radius }]: solid volumes (stack, jar, stand post) for path planning.
//   There is no portalSeat: this world's exit portal sits in the dresser plate, not here.
// COST     ~120k triangles, 13 draw calls (5 honey/glass shader programs + standard materials), no
//          lights, no textures, no render targets; build ~150-250 ms of JS with 4 yields.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { clamp, lerp, smoothstep } from '../kit/core.js';

const TAU = Math.PI * 2;
const DEFAULT_PALETTE = ['#fff1d0', '#8aa48f', '#e4dac4', '#8f5d36', '#c0392b', '#3a2414', '#ffb300'];

// ---------------------------------------------------------------- geometry helpers
// Surface of revolution-like grid: nT columns round (wrapped, no seam), nR+1 rows along a profile.
// fn(j, theta, o) fills o.p = [x,y,z], o.c = [r,g,b] and o.a[k] for every extra attribute.
// Rows traced top-centre -> outward -> down give outward normals; pass flip for the opposite.
function ring(nT, nR, fn, extras = [], flip = false) {
  const n = nT * (nR + 1);
  const pos = new Float32Array(n * 3), col = new Float32Array(n * 3);
  const ex = extras.map((e) => new Float32Array(n * e.size));
  const o = { p: [0, 0, 0], c: [1, 1, 1], a: extras.map((e) => new Array(e.size).fill(0)) };
  for (let j = 0; j <= nR; j++) for (let i = 0; i < nT; i++) {
    const k = j * nT + i;
    fn(j, (i / nT) * TAU, o, i);
    pos[k * 3] = o.p[0]; pos[k * 3 + 1] = o.p[1]; pos[k * 3 + 2] = o.p[2];
    col[k * 3] = o.c[0]; col[k * 3 + 1] = o.c[1]; col[k * 3 + 2] = o.c[2];
    for (let e = 0; e < ex.length; e++) for (let s = 0; s < extras[e].size; s++) ex[e][k * extras[e].size + s] = o.a[e][s];
  }
  const idx = new Uint32Array(nT * nR * 6);
  let q = 0;
  for (let j = 0; j < nR; j++) for (let i = 0; i < nT; i++) {
    const a = j * nT + i, b = j * nT + ((i + 1) % nT), c = a + nT, d = b + nT;
    if (flip) { idx[q++] = a; idx[q++] = c; idx[q++] = b; idx[q++] = b; idx[q++] = c; idx[q++] = d; }
    else { idx[q++] = a; idx[q++] = b; idx[q++] = c; idx[q++] = b; idx[q++] = d; idx[q++] = c; }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  extras.forEach((e, k) => g.setAttribute(e.name, new THREE.BufferAttribute(ex[k], e.size)));
  g.setIndex(new THREE.BufferAttribute(idx, 1));
  g.computeVertexNormals();
  return g;
}

// The same grid built a few rows at a time, handing frames back in between (for the big honey skin).
async function ringY(ctx, nT, nR, fn, extras = []) {
  const n = nT * (nR + 1), pos = new Float32Array(n * 3), col = new Float32Array(n * 3).fill(1);
  const ex = extras.map((e) => new Float32Array(n * e.size));
  const o = { p: [0, 0, 0], c: [1, 1, 1], a: extras.map((e) => new Array(e.size).fill(0)) };
  for (let j = 0; j <= nR; j++) {
    for (let i = 0; i < nT; i++) {
      const k = j * nT + i; fn(j, (i / nT) * TAU, o, i);
      pos[k * 3] = o.p[0]; pos[k * 3 + 1] = o.p[1]; pos[k * 3 + 2] = o.p[2];
      for (let e = 0; e < ex.length; e++) for (let q = 0; q < extras[e].size; q++) ex[e][k * extras[e].size + q] = o.a[e][q];
    }
    if ((j & 7) === 7) await ctx.yield();
  }
  const idx = new Uint32Array(nT * nR * 6); let q = 0;
  for (let j = 0; j < nR; j++) for (let i = 0; i < nT; i++) { const a = j * nT + i, b = j * nT + ((i + 1) % nT), c = a + nT, d = b + nT; idx[q++] = a; idx[q++] = b; idx[q++] = c; idx[q++] = b; idx[q++] = d; idx[q++] = c; }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  extras.forEach((e, k) => g.setAttribute(e.name, new THREE.BufferAttribute(ex[k], e.size)));
  g.setIndex(new THREE.BufferAttribute(idx, 1)); g.computeVertexNormals();
  return g;
}

// Lathe from a profile [[r, y], ...] (bottom -> top = outward normals), densified with a
// Catmull-Rom pass so turned shapes get soft bevels. colorFn(r, y, t, theta) -> [r,g,b].
function lathe(profile, nT, sub, colorFn, radial = null) {
  const pts = profile.map((p) => new THREE.Vector2(p[0], p[1]));
  const curve = new THREE.SplineCurve(pts);
  const nR = (profile.length - 1) * sub;
  const sp = curve.getPoints(nR);
  return ring(nT, nR, (j, th, o) => {
    const p = sp[j], t = j / nR;
    const r = radial ? radial(p.x, p.y, th, t) : p.x;
    o.p[0] = Math.cos(th) * r; o.p[1] = p.y; o.p[2] = Math.sin(th) * r;
    const c = colorFn(p.x, p.y, t, th); o.c[0] = c[0]; o.c[1] = c[1]; o.c[2] = c[2];
  }, [], true);
}

// Tube swept along a list of Vector3 with a radius function; wrapped ring topology.
function sweep(points, nSeg, nT, radiusFn, colorFn, closed = false) {
  const curve = new THREE.CatmullRomCurve3(points, closed, 'centripetal');
  const fr = curve.computeFrenetFrames(nSeg, closed);
  const P = new THREE.Vector3();
  return ring(nT, nSeg, (j, th, o) => {
    const t = j / nSeg; curve.getPointAt(t, P);
    const r = radiusFn(t), N = fr.normals[j], B = fr.binormals[j], cs = Math.cos(th), sn = Math.sin(th);
    o.p[0] = P.x + (N.x * cs + B.x * sn) * r; o.p[1] = P.y + (N.y * cs + B.y * sn) * r; o.p[2] = P.z + (N.z * cs + B.z * sn) * r;
    const c = colorFn(t, th); o.c[0] = c[0]; o.c[1] = c[1]; o.c[2] = c[2];
  }, [], true);
}

// Bake many transformed, flat-coloured copies of one small indexed geometry into a single geometry.
function bake(base, mats, cols) {
  const bp = base.attributes.position, bn = base.attributes.normal, bi = base.index.array, nv = bp.count, n = mats.length;
  const pos = new Float32Array(n * nv * 3), nor = new Float32Array(n * nv * 3), col = new Float32Array(n * nv * 3), idx = new Uint32Array(n * bi.length);
  const v = new THREE.Vector3(), nm = new THREE.Matrix3();
  for (let m = 0; m < n; m++) {
    nm.getNormalMatrix(mats[m]); const c = cols[m], o = m * nv * 3;
    for (let k = 0; k < nv; k++) {
      v.fromBufferAttribute(bp, k).applyMatrix4(mats[m]); pos[o + k * 3] = v.x; pos[o + k * 3 + 1] = v.y; pos[o + k * 3 + 2] = v.z;
      v.fromBufferAttribute(bn, k).applyMatrix3(nm).normalize(); nor[o + k * 3] = v.x; nor[o + k * 3 + 1] = v.y; nor[o + k * 3 + 2] = v.z;
      col[o + k * 3] = c[0]; col[o + k * 3 + 1] = c[1]; col[o + k * 3 + 2] = c[2];
    }
    for (let q = 0; q < bi.length; q++) idx[m * bi.length + q] = bi[q] + m * nv;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.setIndex(new THREE.BufferAttribute(idx, 1));
  return g;
}

const lin = (hex) => { const c = new THREE.Color(hex); return [c.r, c.g, c.b]; };
const mix3 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const mul3 = (a, s) => [a[0] * s, a[1] * s, a[2] * s];
function xform(g, m) { g.applyMatrix4(m); return g; }
const TRS = (x, y, z, rx = 0, ry = 0, rz = 0, s = 1) => new THREE.Matrix4().compose(
  new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz)), new THREE.Vector3(s, s, s));

// ---------------------------------------------------------------- shader pieces
const GLSL_NOISE = /* glsl */`
float h31(vec3 p){ p=fract(p*vec3(.1031,.1030,.0973)); p+=dot(p,p.yxz+33.33); return fract((p.x+p.y)*p.z); }
float vn3(vec3 p){ vec3 i=floor(p), f=fract(p); f=f*f*(3.-2.*f);
  return mix(mix(mix(h31(i),h31(i+vec3(1,0,0)),f.x),mix(h31(i+vec3(0,1,0)),h31(i+vec3(1,1,0)),f.x),f.y),
             mix(mix(h31(i+vec3(0,0,1)),h31(i+vec3(1,0,1)),f.x),mix(h31(i+vec3(0,1,1)),h31(i+vec3(1,1,1)),f.x),f.y),f.z); }
float fbm3(vec3 p){ float a=.5,s=0.; for(int i=0;i<4;i++){ s+=a*vn3(p); p=p*2.03+7.1; a*=.5; } return s; }
`;

// MeshStandardMaterial with procedural colour / roughness detail in object space, so the piece is
// lit by whatever lights the world provides. glsl must define detail() and detailRough().
function detailMat(std, params, glsl, key, uniforms = {}) {
  const m = std(params), prev = m.onBeforeCompile, prevKey = m.customProgramCacheKey;
  m.onBeforeCompile = (sh, r) => {
    if (prev) prev.call(m, sh, r);                                  // e.g. the interior kit's light rig
    Object.assign(sh.uniforms, uniforms);
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vOP; varying vec3 vON;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvOP = position; vON = normal;');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vOP; varying vec3 vON;\n' + GLSL_NOISE + glsl)
      .replace('#include <color_fragment>', '#include <color_fragment>\ndetail(diffuseColor.rgb, vOP, normalize(vON));')
      .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\nroughnessFactor = detailRough(roughnessFactor, vOP);')
      .replace('metalnessFactor=clamp(iMetal,0.,1.);', 'metalnessFactor=clamp(iMetal,0.,1.); roughnessFactor = detailRough(roughnessFactor, vOP);');
  };
  m.customProgramCacheKey = () => 'bt-hero-' + key + '|' + (prevKey ? prevKey.call(m) : '');
  return m;
}

const HONEY_VERT = /* glsl */`
uniform float uTime, uProgress;
varying vec3 vW, vN; varying float vFlow, vThin, vLy;
#include <fog_pars_vertex>
#ifdef ROPE
attribute float aT, aAng;
uniform vec3 uTop; uniform float uFall, uCoilH, uCoilR, uTurns, uSpin, uSplit;
float ropeAng(float t){ float ks=(t-uSplit)/(1.-uSplit); return (ks<0. ? ks*1.6 : ks*uTurns*6.2831853) - uTime*uSpin; }
vec3 ropeC(float t){
  float ks=(t-uSplit)/(1.-uSplit), k=clamp(ks,0.,1.), fall=clamp(t/uSplit,0.,1.);
  float ang=ropeAng(t);
  float rc=uCoilR*smoothstep(-0.45,0.22,ks)*(0.5+0.8*k);
  vec2 sway=vec2(sin(uTime*0.6+t*9.),cos(uTime*0.47+t*11.))*0.09*sin(fall*3.14159);
  return uTop+vec3(cos(ang)*rc+sway.x, -uFall*pow(fall,0.92)-uCoilH*k, sin(ang)*rc+sway.y);
}
float ropeR(float t){
  float fall=clamp(t/uSplit,0.,1.);
  float r=mix(0.66,0.25,smoothstep(0.0,0.5,fall));
  r+=0.085*pow(0.5+0.5*sin(fall*9.-uTime*1.7),8.)*smoothstep(0.1,0.3,fall)*(1.-step(uSplit,t));
  float cap=1.-min(fall/0.06,1.); r*=sqrt(max(0.,1.-cap*cap));     // rounded start inside the dipper's honey
  return r*(1.-0.5*smoothstep(0.97,1.,t));
}
#endif
#ifdef MORPH
attribute vec3 aPos0; attribute vec2 aSkin;
#endif
#ifdef DROP
attribute vec4 aDrop; attribute vec3 aDrop0; attribute float aFallD;
#endif
#ifdef CLIP
uniform mat4 uJarMat;
#endif
void main(){
  vec3 p=position; vec3 n=normal; vFlow=p.y; vThin=1.; vLy=0.;
  #ifdef ROPE
    float e=0.004;
    vec3 c=ropeC(aT); vec3 T=normalize(ropeC(aT+e)-ropeC(aT-e));
    float ang=ropeAng(aT); vec3 R=vec3(cos(ang),0.,sin(ang));
    vec3 B=normalize(cross(T,R)); R=cross(B,T);
    n=cos(aAng)*R+sin(aAng)*B; p=c+n*ropeR(aT);
    vFlow=aT*uTurns*20.; vThin=0.8;
  #endif
  #ifdef MORPH
    float e=uProgress*uProgress*(3.-2.*uProgress);
    if(aSkin.x>50.) e=smoothstep(0.72,1.,e);                     // plate puddles only spread once the sheets arrive
    p=mix(aPos0,position,e);
    vFlow=aSkin.x; vThin=aSkin.y;
    p+=n*0.045*sin(aSkin.x*2.2-uTime*0.8+p.x*0.6+p.z*0.4)*smoothstep(0.3,1.5,aSkin.x)*min(aSkin.y,1.);
  #endif
  #ifdef DROP
    float ph=fract(uTime/(5.+6.*aDrop.w)+aDrop.w*9.7);
    float gr=smoothstep(0.,0.62,ph), f=clamp((ph-0.62)/0.38,0.,1.);
    float sc=gr*(1.-smoothstep(0.86,1.,f));
    float pe=uProgress*uProgress*(3.-2.*uProgress);
    vec3 anchor=mix(aDrop0,aDrop.xyz,pe);
    p=anchor+position*sc*vec3(1.,1.+f*1.2,1.)-vec3(0.,gr*0.22+f*f*(aFallD+anchor.y-aDrop.y),0.);
    vFlow=aDrop.w*10.; vThin=0.6;
  #endif
  vec4 w=modelMatrix*vec4(p,1.); vW=w.xyz; vN=normalize(mat3(modelMatrix)*n);
  #ifdef CLIP
    vLy=(uJarMat*vec4(p,1.)).y;
  #endif
  vec4 mvPosition=viewMatrix*w; gl_Position=projectionMatrix*mvPosition;
  #include <fog_vertex>
}`;

const HONEY_FRAG = /* glsl */`
uniform float uTime, uLevel, uGlow, uWet;
uniform vec3 uLightDir, uLightCol, uAmbient, uAbsorb, uUnder;
varying vec3 vW, vN; varying float vFlow, vThin, vLy;
#include <fog_pars_fragment>
${GLSL_NOISE}
void main(){
  vec3 N=normalize(vN), V=normalize(cameraPosition-vW), L=normalize(uLightDir);
  #ifdef CLIP
    if(vLy>uLevel) discard;
    if(!gl_FrontFacing) N=vec3(0.,1.,0.);
  #else
    if(!gl_FrontFacing) N=-N;
  #endif
  float ndv=clamp(dot(N,V),0.,1.);
  vec3 q=vec3(vW.x*1.3, vFlow*0.55-uTime*0.22, vW.z*1.3);
  float streak=fbm3(q);
  #ifdef MORPH
    streak=0.5+(streak-0.5)*0.8;
  #endif
  { float rp=0.07;                                                // slow ripples break the highlights into glints
    #ifdef MORPH
      rp=0.2;
    #endif
    N=normalize(N+rp*vec3(vn3(q*2.6)-0.5, 0., vn3(q*2.6+11.)-0.5)); ndv=clamp(dot(N,V),0.,1.); }
  float deep=1.-uWet;                                             // 1: free honey (rope, coil, jar): thin gold edges, deep amber middle
  float thick=mix(mix(0.85,0.3,deep),2.5,ndv*ndv)*(0.72+0.56*streak)*max(vThin,0.75);      // optical depth proxy
  #ifdef CLIP
    thick*=1.5;
  #endif
  #ifdef MORPH
    thick*=1.5;
  #endif
  vec3 trans=exp(-thick*uAbsorb)*uUnder;                          // Beer-Lambert amber over what lies beneath
  float back=pow(clamp(0.5-0.5*dot(V,L),0.,1.),1.5);              // 1 when looking into the light
  float wrap=clamp(dot(N,L)*0.5+0.5,0.,1.);
  vec3 core=exp(-thick*0.55*uAbsorb);                             // light that came straight through: gold, not cream
  float rim=1.-ndv; rim*=rim;
  vec3 col=trans*(uAmbient*0.75+uLightCol*(0.09+0.3*wrap*wrap))*(1.-0.5*deep*ndv);
  col+=core*uLightCol*vec3(1.,0.8,0.3)*uGlow*(back*(0.35+0.65*(1.-0.7*ndv))+0.22*rim*(0.35+back))*(1.-0.85*ndv*deep);   // the glow sits on the edges, the middle stays deep
  float bub=smoothstep(0.80,0.92,vn3(q*7.)); col+=trans*uLightCol*bub*0.10*(0.4+back);
  vec3 H=normalize(L+V); float nh=max(dot(N,H),0.);
  float F=0.04+0.96*pow(1.-ndv,5.);
  #ifdef MORPH
    F=0.07+0.93*pow(1.-ndv,3.);                                  // the sheets are wet glass
  #endif
  vec3 R=reflect(-V,N);
  vec3 env=mix(uAmbient*0.5,uAmbient*mix(1.1,1.9,uWet),smoothstep(-0.2,0.6,R.y));
  float win=smoothstep(0.72,0.94,dot(R,normalize(vec3(L.x,L.y*0.35,L.z))));  // the window mirrored in the wet surface
  win*=smoothstep(0.92,0.5,abs(fract(R.y*2.5+streak*0.3)-0.5)*2.);
  col=mix(col,env,F*0.45);
  col+=uLightCol*win*mix(0.06+0.3*F,0.16+0.7*F,uWet);            // uWet 0: no pale window sheen (rope), 1: wet glass (sheets)
  col+=uLightCol*(pow(nh,130.)*1.8+pow(nh,22.)*0.10);
  gl_FragColor=vec4(col,1.);
  #include <fog_fragment>
}`;

const GLASS_VERT = /* glsl */`
varying vec3 vW, vN, vO;
#include <fog_pars_vertex>
void main(){ vO=position; vec4 w=modelMatrix*vec4(position,1.); vW=w.xyz; vN=normalize(mat3(modelMatrix)*normal);
  vec4 mvPosition=viewMatrix*w; gl_Position=projectionMatrix*mvPosition;
  #include <fog_vertex>
}`;
const GLASS_FRAG = /* glsl */`
uniform vec3 uLightDir, uLightCol, uAmbient; uniform vec2 uBand;
varying vec3 vW, vN, vO;
#include <fog_pars_fragment>
// distance to the nearest hexagon edge: the embossed honeycomb band of a honey jar
float hexEdge(vec2 p){ vec2 r=vec2(1.,1.7320508), h=r*.5; vec2 a=mod(p,r)-h, b=mod(p-h,r)-h;
  vec2 g=dot(a,a)<dot(b,b)?a:b; g=abs(g); return 0.5-max(dot(g,normalize(r)),g.x); }
void main(){
  vec3 N=normalize(vN), V=normalize(cameraPosition-vW), L=normalize(uLightDir);
  if(!gl_FrontFacing) N=-N;
  float band=smoothstep(uBand.x,uBand.x+0.25,vO.y)*(1.-smoothstep(uBand.y-0.25,uBand.y,vO.y));
  float he=hexEdge(vec2(atan(vO.z,vO.x)*4.7746, vO.y*1.85));
  float ridge=(1.-smoothstep(0.02,0.11,he))*band;
  float ndv=clamp(dot(N,V),0.,1.);
  float F=0.05+0.95*pow(1.-ndv,3.5);
  vec3 H=normalize(L+V); float nh=max(dot(N,H),0.);
  float back=pow(clamp(0.5-0.5*dot(V,L),0.,1.),2.);
  float spec=pow(nh,320.)*5.+pow(nh,40.)*0.25+ridge*pow(nh,10.)*0.9;
  vec3 col=uAmbient*(0.9*F+0.35*ridge)+uLightCol*(spec+ridge*back*0.25+F*back*0.3);
  float a=clamp(0.07+0.75*F+ridge*0.3+spec,0.,1.);
  gl_FragColor=vec4(col,a);
  #include <fog_fragment>
}`;

// ---------------------------------------------------------------- the hero
export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng.fork ? ctx.rng.fork('honey-fall') : ctx.rng;
  const pal = (opts.palette && opts.palette.length >= 7 ? opts.palette : DEFAULT_PALETTE);
  const [cCream, cSage, cLinen, cWood, cRed, cDark, cAmber] = pal.map(lin);
  const root = new THREE.Group(); root.name = 'honey-fall';
  // opts.standardMaterial(params) lets a world supply its own lit material (e.g. interior-rig lit)
  const std = opts.standardMaterial || ((p) => new THREE.MeshStandardMaterial(p));

  // ---- per-seed character
  const variant = rng.int(0, 2);                                  // china pattern / enamel variant
  const chinaHex = opts.chinaBlue || ['#2b4a9c', '#27407f', '#3a5aa8'][variant];
  const china = lin(chinaHex);
  const enamel0 = [cSage, mix3(cSage, cCream, 0.18), mix3(cSage, china, 0.3)][rng.int(0, 2)];
  const enamel = [enamel0[0] * 0.56, enamel0[1] * 0.72, enamel0[2] * 0.6];   // deep sage: stays sage, not cream, in full window sun
  const nPan = rng.int(5, 7);
  const lightDir = new THREE.Vector3().copy(opts.lightDir || new THREE.Vector3(-0.6, 0.7, 0.4)).normalize();
  const lightCol = opts.lightColor ? new THREE.Color().copy(opts.lightColor) : new THREE.Color(pal[0]).multiplyScalar(3.0);
  const ambient = opts.ambient ? new THREE.Color().copy(opts.ambient) : new THREE.Color(pal[0]).multiplyScalar(0.55);
  const U = { uTime: { value: 0 }, uProgress: { value: clamp(opts.progress ?? 1, 0, 1) },
    uLightDir: { value: lightDir }, uLightCol: { value: lightCol }, uAmbient: { value: ambient } };

  // ---- plate: cream china with a cobalt banded, scalloped and dotted rim (pattern in the shader)
  const PLATE = [[0, 0.5], [2.5, 0.5], [4.9, 0.5], [5.5, 0.6], [6.5, 0.93], [7.3, 1.24], [7.56, 1.31], [7.66, 1.25],
    [7.45, 1.1], [6.4, 0.66], [5.2, 0.27], [4.5, 0.2], [4.38, 0.0], [3.95, 0.0], [3.82, 0.2], [2, 0.26], [0, 0.27]];
  const plateTopY = (r) => { for (let i = 1; i < 7; i++) if (r <= PLATE[i][0]) { const a = PLATE[i - 1], b = PLATE[i]; return lerp(a[1], b[1], (r - a[0]) / (b[0] - a[0])); } return 1.31; };
  {
    const sp = new THREE.SplineCurve(PLATE.map((p) => new THREE.Vector2(p[0], p[1]))).getPoints(96);
    const white = mul3(cCream, 0.78);
    const g = ring(128, 96, (j, th, o) => { const p = sp[j]; o.p[0] = Math.cos(th) * p.x; o.p[1] = p.y; o.p[2] = Math.sin(th) * p.x; o.c = white; });
    const mat = detailMat(std, { vertexColors: true, roughness: 0.16, metalness: 0.0 }, /* glsl */`
      uniform vec3 uChina; uniform vec2 uPat;
      void detail(inout vec3 c, vec3 p, vec3 n){
        float r=length(p.xz), a=atan(p.z,p.x);
        float up=step(0.0,n.y)*step(0.45,p.y), m=0.;
        m=max(m, smoothstep(7.34,7.39,r));
        float sc=6.3+0.3*abs(sin(a*uPat.x));
        m=max(m, smoothstep(sc,sc+0.05,r)*(1.-smoothstep(6.93,6.98,r)));
        m=max(m, smoothstep(7.08,7.11,r)*(1.-smoothstep(7.18,7.21,r)));
        float da=fract(a*uPat.y/6.2831853)-0.5; vec2 dp=vec2(da*6.2831853/uPat.y*5.9, r-5.9);
        m=max(m, 1.-smoothstep(0.09,0.13,length(dp)));
        m=max(m, smoothstep(5.36,5.39,r)*(1.-smoothstep(5.47,5.5,r)));
        c=mix(c, uChina*(0.75+0.5*vn3(p*4.)), m*up*0.94);
        c*=0.93+0.07*vn3(p*1.1);
      }
      float detailRough(float r, vec3 p){ return r+0.08*vn3(p*9.); }`, 'plate',
      { uChina: { value: new THREE.Color(china[0], china[1], china[2]) }, uPat: { value: new THREE.Vector2([12, 16, 20][variant] / 2, [40, 32, 48][variant]) } });
    const plate = new THREE.Mesh(g, mat); plate.name = 'plate'; root.add(plate);
  }
  await ctx.yield();

  // ---- pancake stack
  const pans = []; let y = 0.5;
  for (let i = 0; i < nPan; i++) {
    const h = rng.range(0.56, 0.68), top = i === nPan - 1;
    pans.push({ y0: y, y1: y + h, h, r: (top ? rng.range(4.75, 4.95) : rng.range(4.8, 5.25)),
      ox: rng.range(-0.28, 0.28) * (top ? 0.4 : 1), oz: rng.range(-0.28, 0.28) * (top ? 0.4 : 1),
      p1: rng.range(0, TAU), p2: rng.range(0, TAU), p3: rng.range(0, TAU), p4: rng.range(0, TAU), tone: rng.range(0.85, 1.1) });
    y += h - 0.015;
  }
  const yTop = pans[nPan - 1].y1, stackH = yTop - 0.5;
  const panR = (P, th) => P.r * (1 + 0.022 * Math.sin(2 * th + P.p1) + 0.014 * Math.sin(5 * th + P.p2) + 0.008 * Math.sin(11 * th + P.p3));
  const inset = (q) => 0.24 * (1 - Math.sqrt(Math.max(0, 1 - q * q)));
  // radius of the stack's outer surface seen from the stack axis, at angle th and height yy
  const stackR = (th, yy) => {
    let P = pans[0];
    for (let i = 0; i < nPan; i++) if (yy >= pans[i].y0) P = pans[i];
    const q = clamp(((yy - P.y0) / P.h) * 2 - 1, -1, 1);
    return panR(P, th) - inset(q) + P.ox * Math.cos(th) + P.oz * Math.sin(th);
  };
  {
    const side = mul3(lin('#ecc98c'), 0.86), brown = lin('#a9641f'), deep = lin('#7c4313');
    const F = [0, 0.4, 0.7, 0.88, 0.96], Q = [1, 0.8, 0.45, 0, -0.45, -0.8, -1], FB = [0.95, 0.8];
    const geos = pans.map((P) => ring(96, F.length + Q.length + FB.length - 1, (j, th, o) => {
      const R = panR(P, th); let r, yy, c;
      const wave = 0.05 * Math.sin(3 * th + P.p4);
      if (j < F.length) { r = F[j] * (R - 0.24); yy = P.y1 + 0.03 * (1 - F[j]) + wave * F[j] * F[j];
        c = mix3(brown, deep, 0.5 + 0.5 * Math.sin(th * 3 + P.p2 + F[j] * 4)); if (j === F.length - 1) c = mix3(c, side, 0.45);
      } else if (j < F.length + Q.length) { const q = Q[j - F.length]; r = R - inset(q); yy = (P.y0 + P.y1) / 2 + q * P.h / 2 + wave;
        c = mix3(side, brown, Math.pow(Math.abs(q), 2.2) * 0.85);
      } else { r = FB[j - F.length - Q.length] * (R - 0.24); yy = P.y0 + wave; c = mix3(brown, deep, 0.6); }
      o.p[0] = P.ox + Math.cos(th) * r; o.p[1] = yy; o.p[2] = P.oz + Math.sin(th) * r; o.c = mul3(c, P.tone);
    }));
    const mat = detailMat(std, { vertexColors: true, roughness: 0.82 }, /* glsl */`
      void detail(inout vec3 c, vec3 p, vec3 n){
        float m=fbm3(p*vec3(1.2,3.,1.2)), flat_=abs(n.y);
        float pores=smoothstep(0.6,0.8,vn3(p*vec3(6.,13.,6.)));
        c*=0.74+0.55*m; c*=1.-0.4*pores*(1.-flat_);
        float blot=smoothstep(0.45,0.7,fbm3(p*0.8+3.)); c=mix(c,c*vec3(0.6,0.47,0.36),blot*flat_*0.75);
      }
      float detailRough(float r, vec3 p){ return r; }`, 'pancake');
    const m = new THREE.Mesh(mergeGeometries(geos), mat); m.name = 'pancakes'; root.add(m);
  }

  await ctx.yield();
  // ---- honey layout: where it lands, where it runs over the edge (decided before props are placed)
  const landX = rng.range(-0.25, 0.25), landZ = rng.range(0.1, 0.5);
  const nTong = rng.int(5, 7), tongues = [], t0 = rng.range(0, TAU);
  for (let i = 0; i < nTong; i++) {
    const full = i % 2 === 0 && tongues.filter((t) => t.full).length < 3;
    tongues.push({ th: t0 + (i + rng.range(-0.22, 0.22)) * TAU / nTong, w: full ? rng.range(0.4, 0.62) : rng.range(0.26, 0.44),
      D: full ? stackH * 1.5 : rng.range(0.25, 0.8) * stackH, full });
  }
  const angDiff = (a, b) => { let d = (a - b) % TAU; if (d > Math.PI) d -= TAU; if (d < -Math.PI) d += TAU; return d; };

  // ---- butter pat, slumped and glossy, sitting in the pool
  const butterA = rng.range(0, TAU), butterR = rng.range(1.9, 2.5), butterRot = rng.range(0, TAU);
  {
    const col = mul3(lin('#ffe394'), 0.88), rows = [[0, 1], [0.6, 1], [0.86, 0.97], [0.98, 0.82], [1.03, 0.55], [1.1, 0.25], [1.22, 0.05], [1.3, -0.06]];
    const g = ring(40, rows.length - 1, (j, th, o) => {
      const s = 0.95 / Math.pow(Math.pow(Math.abs(Math.cos(th)), 5) + Math.pow(Math.abs(Math.sin(th)), 5), 0.2);
      const r = rows[j][0] * s * (1 + 0.04 * Math.sin(th * 3 + butterRot));
      o.p[0] = Math.cos(th) * r; o.p[1] = rows[j][1] * 0.62; o.p[2] = Math.sin(th) * r; o.c = mul3(col, 0.9 + 0.1 * rows[j][1]);
    });
    xform(g, TRS(Math.cos(butterA) * butterR, yTop + 0.02, Math.sin(butterA) * butterR, 0.03, butterRot, -0.04));
    const m = new THREE.Mesh(g, std({ vertexColors: true, roughness: 0.28, emissive: new THREE.Color('#ffd76a'), emissiveIntensity: 0.12 })); m.name = 'butter'; root.add(m);
  }

  // ---- raspberries: the one red accent, on the plate rim between the honey tongues
  {
    const mats = [], cols = [], drup = new THREE.SphereGeometry(1, 6, 4);
    const red = cRed, dark = mul3(cRed, 0.45), nB = rng.int(3, 5), M2 = new THREE.Matrix4();
    for (let b = 0; b < nB; b++) {
      let a = 0; for (let k = 0; k < 12; k++) { a = rng.range(0, TAU); if (tongues.every((t) => !t.full || Math.abs(angDiff(a, t.th)) > t.w + 0.3)) break; }
      const r = rng.range(6.05, 6.5), s = rng.range(0.5, 0.64), by = plateTopY(r) + s * 0.72;
      M2.copy(TRS(Math.cos(a) * r, by, Math.sin(a) * r, rng.range(-1.5, 1.5), rng.range(0, TAU), rng.range(-1.5, 1.5)));
      const N = 40;
      for (let k = 0; k < N; k++) {
        const v = 1 - (2 * (k + 0.5)) / N, rr = Math.sqrt(1 - v * v), ph = k * 2.39996, taper = 1 - 0.22 * (v * 0.5 + 0.5);
        mats.push(TRS(Math.cos(ph) * rr * s * taper, v * s * 1.12, Math.sin(ph) * rr * s * taper, 0, rng.range(0, 3), 0, s * rng.range(0.25, 0.31)).premultiply(M2));
        cols.push(mix3(dark, red, rng.range(0.35, 1)));
      }
    }
    const m = new THREE.Mesh(bake(drup, mats, cols), std({ vertexColors: true, roughness: 0.42 })); m.name = 'raspberries'; root.add(m);
  }
  await ctx.yield();

  // ---- honey materials (one shader, four vertex behaviours)
  const absorbK = rng.range(0.85, 1.25);                           // acacia-pale ... buckwheat-dark
  const uAbsorb = { value: new THREE.Vector3(0.11, 0.66, 3.4).multiplyScalar(absorbK) };
  const kDeep = Math.max(absorbK, 1.08) / absorbK;                 // free-falling honey never goes acacia-pale: it would read as custard
  const uLevel = { value: 0 }, uJarMat = { value: new THREE.Matrix4() };
  const honeyMat = (defines, extra = {}, side = THREE.FrontSide) => new THREE.ShaderMaterial({
    defines, side, fog: true, vertexShader: HONEY_VERT, fragmentShader: HONEY_FRAG,
    uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...U, uAbsorb, uLevel, uJarMat, uGlow: { value: 0.7 }, uWet: { value: 0 }, uUnder: { value: new THREE.Vector3(1, 1, 1) }, ...extra } });

  // ---- honey skin: pool on the top pancake + sheets and tongues over the edge + puddles on the plate
  const pA = rng.range(0, TAU), pB = rng.range(0, TAU);
  const poolR = (th) => 4.05 + 0.32 * Math.sin(3 * th + pA) + 0.2 * Math.sin(5 * th + pB) + 0.3 * Math.max(0, Math.cos(th - butterA));
  const cornerD = 0.4, maxSide = stackH - 0.04;
  const skinS = (th, ext) => {
    const Rf = stackR(th, yTop), base = Math.min(poolR(th), Rf - 0.12); let S = base;
    for (const t of tongues) {
      const x = Math.abs(angDiff(th, t.th)) / t.w; if (x >= 1) continue;
      const cb = Math.cos(x * Math.PI / 2), b = t.full ? Math.pow(cb, 1.1) : cb * cb;
      S = Math.max(S, base + (Rf + cornerD + Math.min(t.D * ext, maxSide - 0.31) - base) * b);
    }
    return S;
  };
  const env = (th, yy) => { let m = 0; for (let k = -2; k <= 2; k++) m = Math.max(m, stackR(th, clamp(yy + k * 0.12, 0.5, yTop))); return m; };
  const SP = { x: 0, y: 0, z: 0, t: 0 };
  const skinPoint = (th, s, S) => {
    const Rf = stackR(th, yTop), v = s / S, cs = Math.cos(th), sn = Math.sin(th);
    const tip = Math.sqrt(Math.max(0, 1 - Math.pow(v, 16)));
    let r, yy, beta, c = 0;
    if (s <= Rf) { r = s; yy = yTop; beta = Math.PI / 2; }
    else {
      const d = s - Rf; c = clamp(d / cornerD, 0, 1);
      yy = d < cornerD ? yTop - 0.31 * (1 - Math.cos(c * Math.PI / 2)) : yTop - 0.31 - (d - cornerD);
      yy = Math.max(yy, 0.54); r = lerp(Rf, env(th, yy), smoothstep(0, 1, c)); beta = (Math.PI / 2) * (1 - c);
    }
    const tTop = 0.19 + 0.05 * Math.sin(th * 4 + s * 2.1 + pA), tSide = 0.12 + 0.22 * Math.exp(-Math.pow((S - s) / 0.5, 2));
    const t = lerp(tTop, tSide, c) * tip;
    const x = cs * r, z = sn * r, dl2 = (x - landX) * (x - landX) + (z - landZ) * (z - landZ);
    const mound = c === 0 ? 0.55 * Math.exp(-dl2 / 1.7) : 0;
    SP.x = cs * (r + t * Math.cos(beta)); SP.z = sn * (r + t * Math.cos(beta)); SP.y = yy + t * Math.sin(beta) + mound; SP.t = t + mound * 0.6;
    return SP;
  };
  const skinExtras = [{ name: 'aPos0', size: 3 }, { name: 'aSkin', size: 2 }];
  const EXT0 = 0.1;
  {
    const nR = 64, geos = [];
    const cS1 = new Float32Array(240), cS0 = new Float32Array(240);
    geos.push(await ringY(ctx, 240, nR, (j, th, o, i) => {
      if (j === 0) { cS1[i] = skinS(th, 1); cS0[i] = skinS(th, EXT0); }
      const v = j / nR, S1 = cS1[i], S0 = cS0[i];
      let p = skinPoint(th, v * S0, S0); o.a[0][0] = p.x; o.a[0][1] = p.y; o.a[0][2] = p.z;
      p = skinPoint(th, v * S1, S1); o.p[0] = p.x; o.p[1] = p.y; o.p[2] = p.z;
      o.a[1][0] = v * S1; o.a[1][1] = clamp(p.t / 0.2, 0.3, 1.9);
    }, skinExtras));
    for (const t of tongues) if (t.full) {                          // puddle where a sheet reaches the plate
      const rc = stackR(t.th, 0.6) + 0.25, a = rng.range(1.3, 1.9), k1 = rng.range(0, TAU), st = rng.range(1.4, 1.9) * Math.min(1.3, t.w * 2.2);
      geos.push(ring(30, 7, (j, ph, o) => {
        const f = j / 7, rb = a * (1 + 0.22 * Math.sin(ph * 3 + k1) + 0.12 * Math.sin(ph * 5 + k1 * 2));
        const rr = Math.min(rc + Math.cos(ph) * f * rb, 7.2), aa = t.th + (Math.sin(ph) * f * rb * st) / rc;
        const h = 0.17 * Math.sqrt(1 - Math.pow(f, 5));
        o.p[0] = Math.cos(aa) * rr; o.p[1] = plateTopY(rr) + h; o.p[2] = Math.sin(aa) * rr;
        o.a[0][0] = Math.cos(t.th) * (rc - 0.7); o.a[0][1] = 0.52; o.a[0][2] = Math.sin(t.th) * (rc - 0.7);
        o.a[1][0] = 60 + f * rb; o.a[1][1] = 1.35;
      }, skinExtras));
    }
    const skin = new THREE.Mesh(mergeGeometries(geos), honeyMat({ MORPH: 1 }, { uUnder: { value: new THREE.Vector3(0.92, 0.74, 0.52) }, uGlow: { value: 0.55 }, uWet: { value: 0.7 } })); skin.name = 'honey-skin'; skin.frustumCulled = false; root.add(skin);
  }
  await ctx.yield();

  // ---- jar pose: tilted mouth-down toward the stack, hanging from the stand behind (-Z)
  const tilt = rng.range(0.78, 0.96), yaw = rng.range(-0.22, 0.22);
  const hd = new THREE.Vector3(Math.sin(yaw), 0, Math.cos(yaw));    // horizontal direction stand -> rope
  const dAxis = new THREE.Vector3(hd.x * Math.cos(tilt), -Math.sin(tilt), hd.z * Math.cos(tilt));
  const ropeTop = new THREE.Vector3(landX, yTop + rng.range(7.0, 7.8), landZ);
  const jarC = ropeTop.clone().addScaledVector(dAxis, -6.5);
  const jarGroup = new THREE.Group(); jarGroup.name = 'jar';
  jarGroup.position.copy(jarC); jarGroup.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dAxis);
  jarGroup.updateMatrix(); root.add(jarGroup);
  uJarMat.value.copy(jarGroup.matrix); uLevel.value = jarC.y + rng.range(0.7, 1.3);
  const downL = new THREE.Vector3(0, -1, 0).applyQuaternion(jarGroup.quaternion.clone().invert());

  // ---- the rope: falls, whirls and coils into a beehive pile (all in the vertex shader)
  const coilH = rng.range(1.7, 2.1), turns = rng.range(4.6, 5.8), ropeBase = new THREE.Vector3(landX, yTop + 0.42, landZ);
  {
    const nS = 520, nA = 12, n = (nS + 1) * nA;
    const aT = new Float32Array(n), aAng = new Float32Array(n), idx = new Uint32Array(nS * nA * 6);
    let q = 0;
    for (let j = 0; j <= nS; j++) for (let i = 0; i < nA; i++) { aT[j * nA + i] = j / nS; aAng[j * nA + i] = (i / nA) * TAU; }
    for (let j = 0; j < nS; j++) for (let i = 0; i < nA; i++) {
      const a = j * nA + i, b = j * nA + ((i + 1) % nA), c = a + nA, d = b + nA;
      idx[q++] = a; idx[q++] = b; idx[q++] = c; idx[q++] = b; idx[q++] = d; idx[q++] = c;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
    g.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
    g.setAttribute('aT', new THREE.BufferAttribute(aT, 1)); g.setAttribute('aAng', new THREE.BufferAttribute(aAng, 1));
    g.setIndex(new THREE.BufferAttribute(idx, 1));
    g.boundingSphere = new THREE.Sphere(ropeTop.clone().lerp(ropeBase, 0.5), 6);
    const mat = honeyMat({ ROPE: 1 }, { uAbsorb: { value: new THREE.Vector3(uAbsorb.value.x, uAbsorb.value.y * 1.2 * kDeep, uAbsorb.value.z * 1.8 * kDeep) }, uTop: { value: ropeTop }, uFall: { value: ropeTop.y - ropeBase.y - coilH }, uCoilH: { value: coilH },
      uCoilR: { value: rng.range(0.78, 0.98) }, uTurns: { value: turns }, uSpin: { value: rng.range(1.5, 2.1) * rng.sign() }, uSplit: { value: 0.28 } }, THREE.DoubleSide);
    mat.uniforms.uGlow.value = 0.9;
    const rope = new THREE.Mesh(g, mat); rope.name = 'honey-rope'; rope.frustumCulled = false; root.add(rope);
  }

  await ctx.yield();
  // ---- drops swelling at the tips of the short tongues and falling to the plate
  {
    const tear = lathe([[0, -0.21], [0.14, -0.15], [0.2, 0], [0.14, 0.17], [0.06, 0.34], [0, 0.52]], 8, 2, () => [1, 1, 1]);
    tear.deleteAttribute('color');
    const geos = [], n = tear.attributes.position.count;
    const addDrop = (th, sc) => {
      const S1 = skinS(th, 1), S0 = skinS(th, EXT0);
      const p0 = skinPoint(th, S0 * 0.985, S0), a0 = [p0.x, p0.y - 0.1, p0.z];
      const p1 = skinPoint(th, S1 * 0.985, S1), seed = rng();
      if (p1.y < 1.6) return;
      const g = tear.clone().scale(sc, sc, sc), rr = Math.hypot(p1.x, p1.z) + 0.1, fall = p1.y - 0.1 - plateTopY(rr) - 0.15;
      const d = new Float32Array(n * 4), d0 = new Float32Array(n * 3), f = new Float32Array(n);
      for (let k = 0; k < n; k++) { d[k * 4] = p1.x * (rr / (rr - 0.1)); d[k * 4 + 1] = p1.y - 0.1; d[k * 4 + 2] = p1.z * (rr / (rr - 0.1)); d[k * 4 + 3] = seed;
        d0[k * 3] = a0[0]; d0[k * 3 + 1] = a0[1]; d0[k * 3 + 2] = a0[2]; f[k] = fall; }
      g.setAttribute('aDrop', new THREE.BufferAttribute(d, 4)); g.setAttribute('aDrop0', new THREE.BufferAttribute(d0, 3)); g.setAttribute('aFallD', new THREE.BufferAttribute(f, 1));
      geos.push(g);
    };
    for (const t of tongues) { if (!t.full) addDrop(t.th, rng.range(0.9, 1.3)); else { addDrop(t.th + t.w * 0.78, 0.8); addDrop(t.th - t.w * 0.8, 0.9); } }
    if (geos.length) { const m = new THREE.Mesh(mergeGeometries(geos), honeyMat({ DROP: 1 })); m.name = 'honey-drops'; m.frustumCulled = false; root.add(m); }
  }

  await ctx.yield();
  // ---- honey in the jar (clipped to a level surface), honey running down the dipper
  {
    const g = lathe([[0, -2.8], [1.75, -2.8], [2.18, -2.62], [2.27, -2.2], [2.27, 1.0], [2.2, 1.55], [1.85, 2.08], [1.55, 2.33], [1.5, 2.7], [1.5, 3.02], [0, 3.02]], 48, 3, () => [1, 1, 1]);
    g.deleteAttribute('color');
    const m = new THREE.Mesh(g, honeyMat({ CLIP: 1 }, {}, THREE.DoubleSide)); m.name = 'jar-honey'; jarGroup.add(m);
    // coat: thick on the underside of the tilted dipper, hidden inside the wood on the upper side
    const under = (th) => Math.max(0, Math.cos(th) * downL.x + Math.sin(th) * downL.z) / Math.max(0.2, Math.hypot(downL.x, downL.z));
    const coat = lathe([[1.42, 2.7], [1.38, 3.05], [1.05, 3.5], [0.7, 4.0], [0.6, 4.4], [0.95, 4.75], [1.13, 5.3], [1.12, 5.9], [0.98, 6.4], [0.8, 6.78], [0.62, 7.05], [0.34, 7.22], [0, 7.26]], 28, 3, () => [1, 1, 1],
      (r, yy, th) => r * (lerp(0.94, 0.5, smoothstep(3.0, 4.4, yy)) + lerp(0.1, 0.68, smoothstep(3.0, 4.4, yy)) * Math.pow(under(th), 0.7)) * (1 + 0.05 * Math.sin(yy * 5 + th * 2)));
    coat.deleteAttribute('color');
    const mc = new THREE.Mesh(coat, honeyMat({}, { uAbsorb: { value: new THREE.Vector3(uAbsorb.value.x, uAbsorb.value.y * 1.2 * kDeep, uAbsorb.value.z * 1.6 * kDeep) } })); mc.name = 'dipper-honey'; jarGroup.add(mc);
  }

  await ctx.yield();
  // ---- glass jar with thread rings, a thick foot and an embossed honeycomb band
  {
    const g = lathe([[0, -3.0], [1.85, -3.0], [2.28, -2.88], [2.43, -2.55], [2.46, -1.5], [2.46, 1.0], [2.38, 1.6], [2.02, 2.14], [1.74, 2.36], [1.7, 2.52],
      [1.83, 2.58], [1.83, 2.68], [1.7, 2.73], [1.7, 2.81], [1.83, 2.86], [1.83, 2.96], [1.72, 3.03], [1.56, 3.04], [1.5, 2.9]], 56, 3, () => [1, 1, 1]);
    g.deleteAttribute('color');
    const mat = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, fog: true, side: THREE.DoubleSide, vertexShader: GLASS_VERT, fragmentShader: GLASS_FRAG,
      uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), uLightDir: U.uLightDir, uLightCol: U.uLightCol, uAmbient: U.uAmbient, uBand: { value: new THREE.Vector2(-2.3, 1.1) } } });
    const m = new THREE.Mesh(g, mat); m.name = 'jar-glass'; m.renderOrder = 2; jarGroup.add(m);
  }

  await ctx.yield();
  // ---- wooden dipper: turned beech stick with a grooved beehive head
  {
    const prof = [[0, -2.2], [0.34, -2.15], [0.42, -1.9], [0.3, -1.6], [0.28, 1.0], [0.3, 4.2], [0.36, 4.35]];
    const nG = rng.int(4, 6), y0 = 4.4, y1 = 6.75;
    for (let k = 0; k <= 44; k++) {
      const f = k / 44, yy = lerp(y0, y1, f), e = Math.pow(Math.max(0, 1 - Math.pow((f - 0.48) / 0.52, 2)), 0.55);
      const groove = Math.pow(0.5 + 0.5 * Math.cos(f * nG * TAU), 2.2);
      prof.push([Math.max(0.3, 1.04 * e * (1 - 0.34 * groove)), yy]);
    }
    prof.push([0.2, 6.82], [0, 6.84]);
    const pts = prof.map((p) => new THREE.Vector2(p[0], p[1]));
    const beech = mix3(cWood, cCream, 0.42), shade = mul3(cWood, 0.62);
    const g = ring(28, pts.length - 1, (j, th, o) => {
      const p = pts[j]; o.p[0] = Math.cos(th) * p.x; o.p[1] = p.y; o.p[2] = Math.sin(th) * p.x;
      const inG = p.y > y0 ? clamp(1 - (p.x - 0.55) / 0.45, 0, 1) : 0; o.c = mix3(beech, shade, inG * 0.8);
    }, [], true);
    const mat = detailMat(std, { vertexColors: true, roughness: 0.6 }, /* glsl */`
      void detail(inout vec3 c, vec3 p, vec3 n){
        float g=fbm3(vec3(p.x*4.,p.y*0.5,p.z*4.)); float rings=0.5+0.5*sin(g*20.+p.x*8.+p.z*3.);
        c*=0.7+0.45*g+0.14*rings;
      }
      float detailRough(float r, vec3 p){ return r; }`, 'wood');
    const m = new THREE.Mesh(g, mat); m.name = 'dipper'; jarGroup.add(m);
  }
  await ctx.yield();

  // ---- stand: enamel gooseneck on a turned foot, brass cradle, bail and tilt chain
  const postXZ = (a) => [landX - hd.x * a, landZ - hd.z * a];
  const Yh = jarC.y + 4.9, baseA = 13.4;
  const P3 = (a, yy) => { const p = postXZ(a); return new THREE.Vector3(p[0], yy, p[1]); };
  const postPts = [P3(baseA, 1.9), P3(baseA + 0.05, Yh * 0.38), P3(baseA - 0.15, Yh * 0.72), P3(baseA - 1.5, Yh - 1.5), P3(baseA - 4.2, Yh + 0.55),
    P3(7.0, Yh + 0.95), P3(4.2, Yh + 0.3), P3(2.9, Yh - 1.0), P3(3.1, Yh - 1.9)];
  const postCurve = new THREE.CatmullRomCurve3(postPts, false, 'centripetal');
  const postR0 = (t) => lerp(0.56, 0.26, Math.pow(t, 0.8)), KNUCKLE = 0.6;
  {
    const dark = mul3(mix3(cDark, china, 0.5), 0.6);
    // stepped, dished foot: three turned steps, a dark chipped rim line at the bottom and a cream band on the middle riser
    const creamE = mul3(cCream, 0.66);
    const foot = lathe([[0, 0], [2.95, 0], [3.1, 0.1], [3.1, 0.32], [2.95, 0.44], [2.5, 0.4], [2.15, 0.43], [2.1, 0.7], [2.0, 0.8], [1.55, 0.77], [1.3, 0.82], [1.25, 1.1], [1.15, 1.2],
      [0.9, 1.3], [0.72, 1.55], [0.86, 1.8], [0.9, 1.95], [0.72, 2.15], [0.58, 2.3]], 48, 3,
      (r, yy) => (r > 2.9 && yy < 0.37 ? dark : r > 1.9 && yy > 0.5 && yy < 0.78 ? creamE : mul3(enamel, 0.8 + 0.2 * clamp(yy, 0, 1))));
    const bp = postXZ(baseA); xform(foot, TRS(bp[0], 0, bp[1]));
    await ctx.yield();
    // tapered post with a turned knuckle where the gooseneck bends, a swelling above the foot and a cream band
    const knuck = (t) => 0.85 * Math.exp(-Math.pow((t - KNUCKLE) / 0.013, 2)) - 0.16 * Math.exp(-Math.pow((Math.abs(t - KNUCKLE) - 0.03) / 0.008, 2));
    const post = sweep(postPts, 180, 14, (t) => postR0(t) * (1 + knuck(t) + 0.22 * Math.exp(-Math.pow((t - 0.07) / 0.03, 2)) + 0.5 * Math.exp(-Math.pow((t - 1) / 0.02, 2))),
      (t) => (t > 0.975 ? dark : t > 0.105 && t < 0.15 ? creamE : Math.abs(t - 0.1) < 0.005 || Math.abs(t - 0.155) < 0.005 ? dark : mul3(enamel, 0.92)));
    await ctx.yield();
    const fin = new THREE.SphereGeometry(0.44, 12, 8); fin.deleteAttribute('uv'); const e9 = postPts[postPts.length - 1];
    xform(fin, TRS(e9.x, e9.y - 0.15, e9.z));
    { const n = fin.attributes.position.count, ca = new Float32Array(n * 3); for (let k = 0; k < n; k++) ca.set(dark, k * 3); fin.setAttribute('color', new THREE.BufferAttribute(ca, 3)); }
    const mat = detailMat(std, { vertexColors: true, roughness: 0.3, metalness: 0.05 }, /* glsl */`
      void detail(inout vec3 c, vec3 p, vec3 n){
        c*=0.86+0.26*fbm3(p*0.7);
        c=mix(c, c*0.45, smoothstep(0.84,0.9,vn3(p*13.))*0.7);        // enamel flecks
      }
      float detailRough(float r, vec3 p){ return r+0.25*smoothstep(0.84,0.9,vn3(p*13.)); }`, 'enamel');
    const m = new THREE.Mesh(mergeGeometries([foot, post, fin]), mat); m.name = 'stand'; root.add(m);
  }
  await ctx.yield();
  {
    const brass = lin('#c9953a'), brassD = mul3(brass, 0.7), geos = [], JM = jarGroup.matrix, inv = JM.clone().invert();
    const colour = (g, c) => { g.deleteAttribute('uv'); const n = g.attributes.position.count, ca = new Float32Array(n * 3); for (let k = 0; k < n; k++) ca.set(c, k * 3); g.setAttribute('color', new THREE.BufferAttribute(ca, 3)); return g; };
    const torus = (R, r, yy, c = brass) => colour(xform(new THREE.TorusGeometry(R, r, 8, 48), TRS(0, yy, 0, Math.PI / 2).premultiply(JM)), c);
    geos.push(torus(2.6, 0.15, -0.9), torus(1.86, 0.12, 2.3), torus(2.05, 0.13, -3.08), torus(2.6, 0.07, -0.55, brassD), torus(2.6, 0.07, -1.25, brassD));
    const rod = (pts, r, seg, local = true, c = brass) => { const g = sweep(pts, seg, 8, () => r, () => c); if (local) g.applyMatrix4(JM); return g; };
    const nStrap = 4, s0 = rng.range(0, TAU);
    for (let k = 0; k < nStrap; k++) {                              // straps from the base cup to the neck ring
      const a = s0 + (k / nStrap) * TAU + Math.PI / 4, cs = Math.cos(a), sn = Math.sin(a);
      const V = (r, yy) => new THREE.Vector3(cs * r, yy, sn * r);
      geos.push(rod([V(0.2, -3.12), V(2.0, -3.12), V(2.5, -2.8), V(2.6, -1.5), V(2.6, 0.9), V(2.5, 1.6), V(2.12, 2.12), V(1.86, 2.34)], 0.09, 28));
    }
    await ctx.yield();
    // bail: from the sides of the body ring up to a ring that rides on the gooseneck
    let hookT = 0.8, best = 1e9; const jx = new THREE.Vector3(0, -0.9, 0).applyMatrix4(JM), tmp = new THREE.Vector3();
    for (let k = 60; k <= 96; k++) { postCurve.getPointAt(k / 100, tmp); const d = Math.hypot(tmp.x - jx.x, tmp.z - jx.z); if (d < best) { best = d; hookT = k / 100; } }
    const hookP = postCurve.getPointAt(hookT), apexL = hookP.clone().add(new THREE.Vector3(0, -0.62, 0)).applyMatrix4(inv);
    const side = new THREE.Vector3(1, 0, 0), sA = side.clone().multiplyScalar(2.6).setY(-0.9), sB = side.clone().multiplyScalar(-2.6).setY(-0.9);
    const upL = downL.clone().negate();
    const midA = sA.clone().lerp(apexL, 0.55).addScaledVector(side, 0.9).addScaledVector(upL, -0.2), midB = sB.clone().lerp(apexL, 0.55).addScaledVector(side, -0.9).addScaledVector(upL, -0.2);
    geos.push(rod([sA, midA, apexL, midB, sB], 0.11, 40));
    const tq = postCurve.getTangentAt(hookT), hookRing = new THREE.TorusGeometry(0.62, 0.11, 8, 24);
    hookRing.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), tq)); hookRing.translate(hookP.x, hookP.y, hookP.z); geos.push(colour(hookRing, brass));
    await ctx.yield();
    // tilt chain from the finial down to the neck ring
    const neckTop = new THREE.Vector3(0, 2.3, 0).addScaledVector(new THREE.Vector3(upL.x, 0, upL.z).normalize(), 1.86).applyMatrix4(JM), e9 = postPts[postPts.length - 1].clone().setY(postPts[postPts.length - 1].y - 0.5);
    const chainMid = neckTop.clone().lerp(e9, 0.5).addScaledVector(hd, 0.35);
    geos.push(rod([e9, chainMid, neckTop], 0.06, 12, false, brassD));
    const chain = new THREE.QuadraticBezierCurve3(e9, chainMid, neckTop), nBead = Math.max(4, Math.round(e9.distanceTo(neckTop) / 0.42));
    for (let k = 1; k < nBead; k++) { const p = chain.getPoint(k / nBead); geos.push(colour(xform(new THREE.SphereGeometry(0.15, 6, 4), TRS(p.x, p.y, p.z)), brass)); }
    await ctx.yield();
    // collars on the post
    for (const t of [0.07, 0.3, 0.5, KNUCKLE - 0.045, KNUCKLE + 0.045]) { const p = postCurve.getPointAt(t), tg = postCurve.getTangentAt(t), g = new THREE.TorusGeometry(postR0(t) * (t < 0.1 ? 1.22 : 1) + 0.07, 0.11, 8, 20);
      g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), tg)); g.translate(p.x, p.y, p.z); geos.push(colour(g, brass)); }
    const m = new THREE.Mesh(mergeGeometries(geos), std({ vertexColors: true, roughness: 0.3, metalness: 0.55 })); m.name = 'brass'; root.add(m);
  }
  await ctx.yield();

  // ---- anchors
  const lookAt = ropeTop.clone().lerp(ropeBase, 0.55);
  const orbitY = lookAt.y + 1.2, orbitR = 12, from = -0.75 * Math.PI + yaw, to = 0.75 * Math.PI + yaw, flyThrough = [];
  for (let k = 0; k <= 12; k++) { const a = lerp(from, to, k / 12); flyThrough.push(new THREE.Vector3(landX + Math.sin(a) * orbitR, orbitY + 0.8 * Math.sin((k / 12) * Math.PI), landZ + Math.cos(a) * orbitR)); }
  const vp = (a, r, yy) => new THREE.Vector3(landX + Math.sin(a + yaw) * r, yy, landZ + Math.cos(a + yaw) * r);
  const anchors = {
    lookAt, ropeTop: ropeTop.clone(), ropeBase: ropeBase.clone(), jar: jarC.clone(),
    orbit: { center: new THREE.Vector3(landX, orbitY, landZ), radius: orbitR, y: orbitY, from, to },
    flyThrough,
    viewpoints: { backlit: vp(Math.PI * 0.5, 12, orbitY), front: vp(0, 14, orbitY + 1), entry: vp(-0.6 * Math.PI, 30, orbitY - 2) },
    steamAcross: { from: new THREE.Vector3(landX - 9, lookAt.y + 1, landZ + 2.2), to: new THREE.Vector3(landX + 9, lookAt.y + 3, landZ + 1.2) },
    keepOut: [
      { center: new THREE.Vector3(0, yTop * 0.5, 0), radius: 5.6 },
      { center: jarC.clone(), radius: 4.2 },
      { center: P3(baseA, Yh * 0.5), radius: Yh * 0.5 + 1 },
    ],
  };

  const height = Yh + 1.6;
  return {
    object: root, radius: 13, height, center: new THREE.Vector3(landX, height * 0.42, landZ - 1.5),
    anchors,
    setProgress(u) { U.uProgress.value = clamp(u, 0, 1); },
    uniforms: U,
    update(dt, time, camera) {
      U.uTime.value = time;
    },
    dispose() {},
    ground: true, groundY: 0,
  };
}
