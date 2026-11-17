// THE FALLEN GIANT - hero set piece for the world "redwood-dawn".
//
// A toppled elder redwood, 120 m long, lying along the local Z axis. Its root plate (a 26 m wheel of
// tangled roots standing on edge) faces +Z, toward the arriving camera; fire has burnt out the heart,
// so the wheel is a ragged sunburst around a black mouth 13 m across. The bore runs dead straight for
// 75 m (radius 6.5 m, never under 6.2) with cracked charcoal walls carrying an ember sheen, a mossy
// floor with ferns and pale glowing mushrooms, and three burn-through skylights that drop slanting
// gold shafts. The exit portal fills the far end of the bore.
//
// LOCAL SPACE  origin = ground level under the middle of the log, +Y up, front (root wheel) = +Z.
//   log axis: x = 0, y = AXIS_Y (6.6). Root wheel / mouth at z = +60, portal end of the bore at
//   z = -15, broken tip at z = -60. The camera flies toward -Z.
// SIZE   radius ~64 m (it is 120 m long), wheel reaches ~20 m above ground (26 m wheel, part buried).
// COST   ~115k triangles, 7 draw calls (trunk, root wheel, bore, ferns, mushrooms, shafts, points),
//   no lights of its own, ~300-400 ms build.
// LIGHT  Outside surfaces are MeshStandardMaterial and take the scene's lights and fog: a low warm
//   key from ahead-left of the camera (i.e. from -Z, -X) rim-lights the wheel as the brief asks.
//   The inside of the bore is self-lit analytically (daylight falling in from the mouth, gold pools
//   under the skylights, portal glow, embers) because the worlds have no shadow maps; it only uses
//   scene fog. Shaft direction is opts.shaftDir (direction the light TRAVELS, default down, toward
//   +Z and slightly +X, i.e. sun ahead-left of a camera flying -Z).
//
// OPTS   palette   array of 7 hex strings (brief order: cream, sage, moss, deep green, bark, char, gold)
//        shaftDir  [x,y,z] travel direction of the skylight shafts (default [0.18,-0.77,0.60])
//        skyColor  hex, colour of daylight falling into the mouth and skylights (default palette[0])
//        portalColor hex, glow the portal throws on the bore walls and the ember seat ring (palette[6])
//        ember     0..2 ember sheen strength (default 1)
//        shaft     skylight shaft / pool strength multiplier (default 1.4)
//        bounce    0..1 warm fog light bounced onto the bark and the face of the root wheel (default 0.4), so the
//                  backlit wheel never goes to a black cut-out
//        bounceIn  the same once the camera is at the mouth (setProgress eases to it from u 0.78 to 0.86; default = bounce)
//        view      viewer-only framing hint ('mouth' | 'flank' | 'inside')
// HERO API (besides the contract)
//   hero.setProgress(u)   world progress 0..1. Ember sheen, shaft strength and mushroom glow swell as
//                         the camera closes in (peaks from u ~0.6). Defaults to the fully awake look.
//   hero.uniforms         shared uniforms: uSkyCol, uGold, uPortalCol, uPortalI (portal glow on the
//                         walls, 0..2), uShaftI, uEmberI. Set uPortalCol to your portal colour.
// ANCHORS (all local space)
//   portalSeat   { position, facing, radius: 6 } centre of the 12 m circular portal at the far end of
//                the bore, facing +Z (back up the tunnel). A charred end wall sits 2 m behind it and
//                an ember ring of radius 6.25 frames it (visible down the mouth from 200 m away).
//   flyThrough   ordered points of the final straight: 125 m out, down the axis, to the portal seat.
//                Clearance >= 6.2 m all the way (soft ferns on the floor come to within ~5.4 m).
//   mouth        { position, radius: 6.5 } centre of the black mouth in the root wheel.
//   skylights    [{ position, radius, floor }] hole centres on the roof and where each shaft lands.
//   shaftDir     unit vector, light travel direction used for the shafts.
//   owlPerch     { position, launch } tip of a high root on the wheel and a launch direction (+Z, up).
//   wheelTop     top of the root wheel (for a poi / composition).
//   viewpoints   { reveal, threeQuarter, inside } good camera positions.
//   axis         { origin, dir, axisY, boreRadius, mouthZ, portalZ }
//   gully        half-width profile hint: keep terrain below y = 0.3 for |x| < 5 on the approach.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { clamp, lerp, smoothstep } from '../kit/core.js';

const AXIS_Y = 6.6, ZM = 60, ZP = -15, ZT = -60, LEN = 120, BORE_R = 6.5, HOLE_K = 7.0;
const DEFAULT_PALETTE = ['#f6d9a4', '#b8c9b4', '#56704e', '#2a3a2a', '#5a3423', '#1b1410', '#ffb347'];

// ---------- shared GLSL ----------
const GLSL_NOISE = /* glsl */`
float h21(vec2 p){ p=fract(p*vec2(123.34,456.21)); p+=dot(p,p+45.32); return fract(p.x*p.y); }
vec2 h22(vec2 p){ float n=h21(p); return vec2(n,h21(p+n+17.1)); }
float vn(vec2 p){ vec2 i=floor(p),f=fract(p); f=f*f*(3.-2.*f);
  return mix(mix(h21(i),h21(i+vec2(1.,0.)),f.x),mix(h21(i+vec2(0.,1.)),h21(i+vec2(1.,1.)),f.x),f.y); }
float fbm(vec2 p){ float a=.5,s=0.; for(int i=0;i<4;i++){ s+=a*vn(p); p=p*2.03+vec2(17.,9.); a*=.5; } return s; }
vec3 voro(vec2 p,float jit){
  vec2 i=floor(p),f=fract(p),mg=vec2(0.),mr=vec2(0.); float md=8.;
  for(int y=-1;y<=1;y++)for(int x=-1;x<=1;x++){ vec2 g=vec2(float(x),float(y)); vec2 r=g+.5+jit*(h22(i+g)-.5)-f; float d=dot(r,r); if(d<md){ md=d; mr=r; mg=g; } }
  float ed=8.;
  for(int y=-2;y<=2;y++)for(int x=-2;x<=2;x++){ vec2 g=mg+vec2(float(x),float(y)); vec2 r=g+.5+jit*(h22(i+g)-.5)-f; vec2 dr=r-mr; if(dot(dr,dr)>1e-5) ed=min(ed,dot(.5*(mr+r),normalize(dr))); }
  return vec3(ed,h21(i+mg),sqrt(md)); }
`;
const GLSL_INTERIOR = /* glsl */`
uniform vec4 uHole[3];      // z, theta (from up, toward +x), radius, phase
uniform vec3 uShaftDir, uSkyCol, uGold, uPortalCol, uEmber, uChar;
uniform vec4 uDims;         // axisY, mouthZ, portalZ, boreR
uniform float uTime, uPortalI, uShaftI, uEmberI, uBounce;
float holeSDF(vec3 p){
  float th=atan(p.x,p.y-uDims.x), d=1e3;
  for(int i=0;i<3;i++){ vec2 q=vec2(p.z-uHole[i].x,(th-uHole[i].y)*${HOLE_K.toFixed(1)}); float a=atan(q.y,q.x), w=uHole[i].w;
    float r=uHole[i].z*(1.+.16*sin(3.*a+w)+.09*sin(7.*a+w*2.3)+.05*sin(13.*a+w*4.1)); d=min(d,length(q)-r); }
  return d; }
vec3 interiorLight(vec3 P,vec3 N){
  float depth=max(uDims.y-P.z,0.);
  vec3 tm=normalize(vec3(0.,uDims.x+2.,uDims.y+6.)-P);
  vec3 L=uSkyCol*(.95*exp(-depth/8.)+.14*exp(-depth/45.))*(.3+.7*max(dot(N,tm),0.));
  vec3 tp=vec3(0.,uDims.x,uDims.z)-P; float dp=length(tp);
  L+=uPortalCol*uPortalI*(1.0/(1.+dp*dp*.0055))*(.25+.75*max(dot(N,tp/dp),0.));
  for(int i=0;i<3;i++){
    float th=uHole[i].y; vec3 Hc=vec3(sin(th)*7.2,uDims.x+cos(th)*7.2,uHole[i].x);
    vec3 d=P-Hc; float t=dot(d,uShaftDir); float r=length(d-uShaftDir*t), rh=uHole[i].z*.85;
    float pool=smoothstep(rh*1.12,rh*.5,r)*smoothstep(1.,3.,t);
    L+=uGold*uShaftI*(3.4*pool*max(dot(N,-uShaftDir),0.)+.1*exp(-r*r/(rh*rh*5.))*smoothstep(0.,4.,t));
    L+=uSkyCol*.38*exp(-dot(d,d)/45.);
  }
  return L+uEmber*.03*(.6+.4*sin(uTime*.7+P.z*.35+P.x))+vec3(.04,.034,.028);
}
`;
const GLSL_FOGFADE = /* glsl */`
  float fogK=1.;
  #ifdef USE_FOG
    #ifdef FOG_EXP2
      fogK=exp(-fogDensity*fogDensity*vFogDepth*vFogDepth);
    #else
      fogK=1.-smoothstep(fogNear,fogFar,vFogDepth);
    #endif
  #endif
`;

// ---------- geometry helpers ----------
function makeBuf() { return { p: [], n: [], c: [], a: [], i: [], count: 0 }; }
function vtx(b, x, y, z, nx, ny, nz, col, a0, a1, a2) {
  b.p.push(x, y, z); b.n.push(nx, ny, nz); b.c.push(col.r, col.g, col.b); b.a.push(a0, a1, a2); return b.count++;
}
function bufGeo(b, computeNormals) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(b.p, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(b.n, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(b.c, 3));
  g.setAttribute('aAux', new THREE.Float32BufferAttribute(b.a, 3));
  g.setIndex(b.i);
  if (computeNormals) g.computeVertexNormals();
  return g;
}
const _T = new THREE.Vector3(), _N = new THREE.Vector3(), _B = new THREE.Vector3(), _P = new THREE.Vector3(), _col = new THREE.Color();
// Sweeps a tapered tube along pts. radFn(t, ang) -> radius, colFn(t, ang, out) -> char amount (aAux.z).
function sweep(b, pts, radFn, sides, colFn, capTip = true) {
  const n = pts.length, base = b.count; let len = 0;
  _N.set(0.31, 0.83, 0.47);
  for (let k = 0; k < n; k++) {
    _T.subVectors(pts[Math.min(n - 1, k + 1)], pts[Math.max(0, k - 1)]).normalize();
    _N.addScaledVector(_T, -_N.dot(_T)).normalize(); _B.crossVectors(_T, _N);
    if (k > 0) len += pts[k].distanceTo(pts[k - 1]);
    const t = k / (n - 1);
    for (let s = 0; s <= sides; s++) {
      const ang = (s / sides) * Math.PI * 2, ca = Math.cos(ang), sa = Math.sin(ang), r = radFn(t, ang);
      const nx = ca * _N.x + sa * _B.x, ny = ca * _N.y + sa * _B.y, nz = ca * _N.z + sa * _B.z;
      const ch = colFn(t, ang, _col, ny);
      vtx(b, pts[k].x + nx * r, pts[k].y + ny * r, pts[k].z + nz * r, nx, ny, nz, _col, len, ang * Math.max(r, 0.15), ch);
    }
  }
  const w = sides + 1;
  for (let k = 0; k < n - 1; k++) for (let s = 0; s < sides; s++) {
    const a = base + k * w + s, c = a + w;
    b.i.push(a, a + 1, c, a + 1, c + 1, c);
  }
  if (capTip) {
    const ch = colFn(1, 0, _col, _T.y), tip = vtx(b, pts[n - 1].x + _T.x * 0.05, pts[n - 1].y + _T.y * 0.05, pts[n - 1].z + _T.z * 0.05, _T.x, _T.y, _T.z, _col, len, 0, ch);
    for (let s = 0; s < sides; s++) { const a = base + (n - 1) * w + s; b.i.push(a, a + 1, tip); }
  }
}
// point on / around the log axis: theta measured from straight up, toward +x
const polar = (r, th, z, out = new THREE.Vector3()) => out.set(Math.sin(th) * r, AXIS_Y + Math.cos(th) * r, z);

export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng.fork ? ctx.rng.fork('fallen-giant') : ctx.rng, noise = ctx.noise;
  const palHex = (opts.palette && opts.palette.length >= 7) ? opts.palette : DEFAULT_PALETTE;
  const pal = palHex.map((h) => new THREE.Color(h));
  const [cCream, cSage, cMoss, cDeep, cBark, cChar, cGold] = pal;
  const group = new THREE.Group(); group.name = 'fallen-giant';

  // ---------- per-seed character ----------
  const nFlutes = rng.int(9, 14), nButt = rng.int(5, 8), buttPh = rng.range(0, 6.28), twist = rng.range(-0.006, 0.006);
  const mossAmt = rng.range(0.75, 1.15), barkHue = rng.range(-0.02, 0.025), nMain = rng.int(15, 20);
  const shroomTint = cSage.clone().lerp(cCream, rng.range(0.25, 0.8));
  // the shafts travel toward +x: holes 1 and 3 sit right of the crown (pools on the right wall), hole 2 well to the left (its pool lands on
  // the left of the floor); all three are holes, not windows: each drops one distinct beam into the dark
  const holes = [15, 35, 55].map((d, i) => ({
    z: ZM - d + rng.range(-1.5, 1.5), th: [0.2, -0.85, 0.42][i] + 0.5 * rng.range(-0.3, 0.12),
    r: rng.range(2.1, 2.9) * [1, 1.1, 1.15][i], ph: rng.range(0, 6.28) }));
  const holeR = (h, a) => h.r * (1 + 0.16 * Math.sin(3 * a + h.ph) + 0.09 * Math.sin(7 * a + h.ph * 2.3) + 0.05 * Math.sin(13 * a + h.ph * 4.1));
  const holeDist = (z, th) => { let d = 1e3; for (const h of holes) { const qx = z - h.z, qy = (th - h.th) * HOLE_K; d = Math.min(d, Math.hypot(qx, qy) - holeR(h, Math.atan2(qy, qx))); } return d; };
  const shaftDir = new THREE.Vector3().fromArray(opts.shaftDir || [0.18, -0.77, 0.60]).normalize();

  // ---------- shared uniforms ----------
  const U = {
    uHole: { value: holes.map((h) => new THREE.Vector4(h.z, h.th, h.r, h.ph)) },
    uShaftDir: { value: shaftDir }, uSkyCol: { value: new THREE.Color(opts.skyColor || palHex[0]) },
    uGold: { value: cGold.clone().lerp(cCream, 0.25) }, uPortalCol: { value: new THREE.Color(opts.portalColor || palHex[6]) },
    uEmber: { value: new THREE.Color('#ff8a3a') }, uChar: { value: cChar.clone() },
    uDims: { value: new THREE.Vector4(AXIS_Y, ZM, ZP, BORE_R) },
    uTime: { value: 0 }, uPortalI: { value: 1 }, uShaftI: { value: opts.shaft ?? 1.4 }, uEmberI: { value: opts.ember ?? 1 }, uGlowI: { value: 1 }, uBounce: { value: opts.bounce ?? 0.4 },
  };

  // ---------- wood / bark / root material (scene lit) ----------
  const woodMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.94, metalness: 0 });
  woodMat.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, U);
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nattribute vec3 aAux; varying vec3 vAux; varying vec3 vObj;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvAux=aAux; vObj=position;');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vAux; varying vec3 vObj; float gHgt; float gEmber; float gFw;\n' + GLSL_NOISE + GLSL_INTERIOR)
      .replace('#include <color_fragment>', /* glsl */`#include <color_fragment>
        if(holeSDF(vObj)<0.) discard;
        { float u=vAux.x, v=vAux.y, ch=max(vAux.z,0.), ms=max(-vAux.z,0.);
          float wp=vn(vec2(v*.4,u*.05));
          vec2 bp=vec2(v*1.05+wp*1.3,u*.095+.6*vn(vec2(v*.9,u*.03)));
          float fw=max(fwidth(bp.x),fwidth(bp.y)); gFw=fw;
          float a1=clamp(fw*2.4-.15,0.,1.), a2=clamp(fw*10.-.1,0.,1.);
          vec3 b1=voro(bp,.9), b2=voro(bp*vec2(3.1,2.3)+4.,.9);
          float p1=mix(smoothstep(.015,.12,b1.x),.84,a1), p2=mix(smoothstep(0.,.15,b2.x),.85,a2);
          float fib=mix(vn(vec2(v*17.,u*.9)),.5,clamp(fwidth(v)*17.-.2,0.,1.));
          float bark=p1*(.68+.32*p2), fur=bark*(.82+.36*b1.y);
          float mott=fbm(vObj.xz*1.3+vObj.y*.7);
          gHgt=mix(bark,mott*.6,ms*.8);
          vec3 bc=diffuseColor.rgb*mix(.3,1.12,fur)*mix(vec3(.82,.92,1.04),vec3(1.22,1.02,.86),fib);
          vec3 mc=diffuseColor.rgb*(.5+1.05*mott)*mix(mix(.62,1.,fur),1.,ms*ms);
          diffuseColor.rgb=mix(bc,mc,ms);
          float chm=smoothstep(.3,.7,ch+(fbm(vec2(v*.7,u*.3))-.5)*.45);
          vec3 cv=vec3(1.,.5,1.); if(ch>.02) cv=voro(vec2(v*2.7,u*1.5),.95);
          float fwc=1.-clamp(max(fwidth(v)*2.7,fwidth(u)*1.5)*4.-.3,0.,1.);                 // 1 near, 0 where a char plate is under ~3 pixels
          diffuseColor.rgb=mix(diffuseColor.rgb,uChar*(1.2+2.6*cv.y),chm);
          float crack=(1.-smoothstep(0.,.06,cv.x))*chm, halo_=pow(1.-smoothstep(0.,.3,cv.x),2.)*chm;
          diffuseColor.rgb*=1.-.75*crack;
          float patch_=smoothstep(.5,.78,fbm(vec2(v*.2,u*.2)+uTime*.015));
          gEmber=(crack+halo_*.3)*patch_*smoothstep(.42,.8,fbm(vec2(v,u)*.9+5.))*1.6*(.65+.35*sin(uTime*.8+cv.y*6.28))*smoothstep(.6,1.,ch);
          gHgt=mix(gHgt,mix(.5,cv.y*.5+smoothstep(0.,.12,cv.x)*.5,fwc),chm); }`)
      .replace('#include <normal_fragment_maps>', /* glsl */`#include <normal_fragment_maps>
        { vec3 sx=dFdx(-vViewPosition), sy=dFdy(-vViewPosition);
          vec3 r1=cross(sy,normal), r2=cross(normal,sx); float det=dot(sx,r1)*faceDirection;
          float k=.22/(1.+length(vViewPosition)*.05)*(1.-clamp(gFw*6.-.12,0.,.92));
          vec3 gr=sign(det)*(dFdx(gHgt*k)*r1+dFdy(gHgt*k)*r2);
          gr*=min(1.,abs(det)*1.1/max(length(gr),1e-9));                                      // never tilt past ~48 degrees: no sparkle of flipped normals
          vec3 nn=abs(det)*normal-gr; if(dot(nn,nn)>1e-12) normal=normalize(nn); }`)
      .replace('#include <emissivemap_fragment>', /* glsl */`#include <emissivemap_fragment>
        totalEmissiveRadiance+=uEmber*gEmber*1.1*uEmberI;
        { // fog light bounced back onto the wood: strongest on faces turned up or toward the eye, so relief survives
          float bf=.45+.35*clamp(normal.y,0.,1.)+.4*pow(clamp(dot(normal,normalize(vViewPosition)),0.,1.),1.5);
          totalEmissiveRadiance+=diffuseColor.rgb*uSkyCol*(uBounce*bf); }`);
  };
  woodMat.customProgramCacheKey = () => 'fallen-giant-wood';

  // ---------- 1. trunk (outer bark) ----------
  const cBarkV = cBark.clone().multiplyScalar(1.9).lerp(cSage, 0.05).offsetHSL(barkHue, 0.05, 0), cBarkGrey = cBarkV.clone().lerp(cSage, 0.2), cHeart = cBarkV.clone().lerp(cGold, 0.4);
  const cMossHi = cMoss.clone().lerp(cSage, 0.45).lerp(cGold, 0.15).multiplyScalar(1.2), cDamp = cDeep.clone().lerp(cBark, 0.4), cSoil = cChar.clone().lerp(cBark, 0.6).multiplyScalar(1.5);
  const trunkR = (z, th) => {
    const d = ZM - z, t = d / LEN, c = Math.cos(th), s = Math.sin(th);
    let r = lerp(8.5, 6.5, t);
    const fl = Math.exp(-d / 6.5);
    r += fl * (1.5 + 0.8 * Math.sin(th * nButt + buttPh) + 0.4 * Math.sin(th * (nButt * 2 + 1) + buttPh * 2));
    const tw = th + d * twist + 0.25 * noise.n2(th * 0.8, d * 0.015);
    r += 0.34 * Math.pow(0.5 + 0.5 * Math.sin(tw * nFlutes), 1.6);
    r += 0.42 * noise.fbm3(c * 1.3, s * 1.3, z * 0.045, 3) + 0.13 * noise.n3(c * 5, s * 5, z * 0.22);
    if (z > ZP - 2) r = Math.max(r, 7.05);
    if (d > LEN - 9) r *= 1 - 0.22 * smoothstep(LEN - 9, LEN, d);
    return r;
  };
  const tb = makeBuf();
  {
    const NS = 96, NZ = 136, col = new THREE.Color();
    for (let j = 0; j <= NZ; j++) {
      const zf = j / NZ;
      for (let s = 0; s <= NS; s++) {
        const th = -Math.PI + (s / NS) * Math.PI * 2;
        let z = lerp(ZM - 1.0, ZT, zf);
        if (j > NZ - 4) { const k = (j - (NZ - 4)) / 4; z -= k * (1.2 + 5.5 * Math.pow(Math.abs(noise.n2(th * 2.1, 3.3)), 1.5) + 1.5 * Math.abs(noise.n2(th * 9, 7.7))); }
        const r = trunkR(z, th), up = Math.cos(th), d = ZM - z;
        const m1 = noise.fbm3(Math.cos(th) * 2.2, Math.sin(th) * 2.2, z * 0.09, 3);
        const moss = clamp(smoothstep(0.3, 0.85, up + 0.65 * m1) * mossAmt, 0, 1);
        const hd = holeDist(z, th);
        const char = clamp(Math.max(smoothstep(2.6, 0.2, hd), smoothstep(3.5, 0.5, d) * 0.6), 0, 1);
        col.copy(cBarkV).lerp(cBarkGrey, clamp(0.5 + 0.9 * noise.n3(Math.cos(th) * 3, Math.sin(th) * 3, z * 0.05), 0, 1) * 0.6);
        col.lerp(cDamp, smoothstep(0.0, -0.8, up) * 0.55);
        col.lerp(cMoss, moss * 0.92).lerp(cMossHi, moss * clamp(0.5 + m1 * 1.6, 0, 1) * 0.6);
        col.multiplyScalar(0.85 + 0.3 * noise.n3(Math.cos(th) * 7, Math.sin(th) * 7, z * 0.35));
        vtx(tb, Math.sin(th) * r, AXIS_Y + Math.cos(th) * r, z, 0, 1, 0, col, d, th * 8, char > 0.08 ? char : -moss);
      }
      if ((j & 7) === 7) await ctx.yield();
    }
    await ctx.yield();
    const w = NS + 1;
    for (let j = 0; j < NZ; j++) for (let s = 0; s < NS; s++) {
      const a = j * w + s, c = a + w;
      const zc = lerp(ZM - 1.0, ZT, (j + 0.5) / NZ), thc = -Math.PI + ((s + 0.5) / NS) * Math.PI * 2;
      if (holeDist(zc, thc) < -0.9) continue;                      // quads well inside a skylight (shader discards the ragged edge)
      tb.i.push(a, a + 1, c, a + 1, c + 1, c);
    }
    // broken tip: recessed heartwood cap
    col.copy(cHeart).multiplyScalar(0.55);
    const cen = vtx(tb, 0, AXIS_Y, ZT - 0.5, 0, 0, -1, col, LEN, 0, 0);
    for (let s = 0; s < NS; s++) { const a = NZ * w + s; tb.i.push(a, cen, a + 1); }
  }
  await ctx.yield();
  const trunkGeo = bufGeo(tb, false);
  await ctx.yield();
  trunkGeo.computeVertexNormals();
  await ctx.yield();

  // ---------- 2. branch stubs and the duff berm along both flanks (merged into the trunk mesh) ----------
  const bb = makeBuf();
  {
    const col = new THREE.Color(), NZ = 72, NX = 8;
    for (const side of [-1, 1]) {
      const base = bb.count, off = side * 7.3;
      for (let j = 0; j <= NZ; j++) for (let k = 0; k <= NX; k++) {
        const z = lerp(ZM - 3, ZT + 2, j / NZ), t = k / NX;
        const hTop = 2.4 + 1.5 * noise.fbm2(z * 0.05 + off, 3.1, 3) + 0.4 * noise.n2(z * 0.21, off);
        const th0 = side * Math.acos(clamp((hTop - AXIS_Y) / 8.2, -1, 1)), rr = trunkR(z, th0) - 0.25;
        const x0 = Math.sin(th0) * rr, wOut = 7.5 + 2.5 * noise.n2(z * 0.04, off + 9);
        const x = x0 + side * wOut * t, y = lerp(hTop, -1.1, Math.pow(smoothstep(0, 1, t), 0.8)) + (0.9 * noise.fbm2(x * 0.16 + 3, z * 0.16, 3) + 0.3 * noise.n2(x * 0.5, z * 0.5)) * Math.sin(Math.min(1, t * 1.6) * Math.PI * 0.5) * (t > 0 ? 1 : 0);
        const m = clamp(0.55 + 0.9 * noise.fbm2(x * 0.13, z * 0.13, 3), 0, 1) * mossAmt;
        col.copy(cSoil).lerp(cDeep, 0.35).lerp(cMoss, m * 0.8).lerp(cMossHi, m * m * 0.35).multiplyScalar(0.7 + 0.5 * noise.n2(x * 0.9, z * 0.9 + 5) * 0.5 + 0.2);
        vtx(bb, x, y, z, 0, 1, 0, col, z * 0.3, x * 2.2, -1);
      }
      for (let j = 0; j < NZ; j++) for (let k = 0; k < NX; k++) { const a = base + j * (NX + 1) + k, c = a + NX + 1; bb.i.push(a, a + 1, c, a + 1, c + 1, c); }
    }
  }
  await ctx.yield();
  const bermGeo = bufGeo(bb, true);
  await ctx.yield();
  const trunk = new THREE.Mesh(mergeGeometries([trunkGeo, bermGeo], false), woodMat);
  trunk.name = 'trunk'; group.add(trunk);
  await ctx.yield();

  // ---------- 3. root wheel: plate + tangled roots ----------
  const cRoot = cBark.clone().multiplyScalar(2.5).lerp(cSage, 0.14), cRootDark = cChar.clone().lerp(cBark, 0.22);   // red-brown wood (#5a3423 family), charcoal undersides
  const mains = [];
  for (let i = 0; i < nMain; i++) mains.push({
    ang: (i + rng.range(-0.32, 0.32)) / nMain * Math.PI * 2, len: rng.range(4.3, 6.8) * (rng.chance(0.16) ? 1.25 : 1), r0: rng.range(0.75, 1.3),
    curl: rng.range(-0.55, 0.55), zb: rng.range(-1.2, 2.6), zf: rng.range(-1.5, 2.2), ph: rng.range(0, 6.28), str: rng.range(0.6, 1.2) });
  const angDiff = (a, b) => { let d = a - b; d -= Math.round(d / (Math.PI * 2)) * Math.PI * 2; return d; };
  const lobe = (th) => { let v = 0; for (const m of mains) { const d = angDiff(th, m.ang) / 0.15; v = Math.max(v, m.str * Math.exp(-d * d)); } return v; };
  const rIn = (th) => 6.56 + 0.55 * Math.abs(noise.n2(th * 3.1, 1.7)) + 0.22 * Math.abs(noise.n2(th * 11, 4.2));
  const pb = makeBuf();
  {
    const NS = 132, col = new THREE.Color(), NK = 10;
    for (let s = 0; s <= NS; s++) {
      const th = -Math.PI + (s / NS) * Math.PI * 2, lb = lobe(th), ri = rIn(th);
      const ro = 10.2 + 1.9 * lb + 0.7 * noise.n2(th * 2.3, 8.8) + 0.3 * noise.n2(th * 9, 2.2), rt = trunkR(ZM - 2.6, th) - 0.15;
      const prof = [[ri, -0.4], [ri + 0.04, 0.8], [ri + 0.5, 1.6], [lerp(ri, ro, 0.38), 2.3], [lerp(ri, ro, 0.62), 2.05], [lerp(ri, ro, 0.86), 1.25],
        [ro, 0.2], [ro - 0.35, -1.0], [lerp(ro, rt, 0.55), -1.9], [rt, -2.6]];
      for (let k = 0; k < NK; k++) {
        let [r, dz] = prof[k];
        const mid = Math.sin((k / (NK - 1)) * Math.PI), c = Math.cos(th), sn = Math.sin(th);
        const lump = noise.fbm3(c * r * 0.35, sn * r * 0.35, k * 0.6, 3);
        if (k >= 2 && k <= 7) { dz += 0.95 * lb * smoothstep(1, 4, k) * (k <= 6 ? 1 : 0.4) + 0.75 * lump * mid; r += 0.3 * noise.n3(c * r * 0.8, sn * r * 0.8, k) * (k >= 3 ? 1 : 0); }
        const charK = k <= 2 ? 1 : k === 3 ? 0.72 : k === 4 ? 0.3 : 0;
        const soil = smoothstep(4.5, 6.5, k) * (0.55 + 0.45 * noise.n2(th * 4, k));
        col.copy(cRoot).lerp(cBarkV, 0.35 + 0.3 * lump).lerp(cSoil, soil * 0.8);
        const up = c * (k >= 5 ? 1 : 0.3);
        const mossP = clamp(smoothstep(0.45, 0.9, up + 0.3 * lump), 0, 1) * 0.45 * mossAmt;
        col.lerp(cMoss, mossP).multiplyScalar((0.8 + 0.35 * lump) * (k >= 2 && k <= 6 ? 0.55 + 0.55 * lb : 1));
        vtx(pb, sn * r, AXIS_Y + c * r, ZM + dz, 0, 0, 1, col, r * 1.1, th * 8.5, charK > 0 ? charK : -Math.max(soil * 0.7, mossP));
      }
    }
    for (let s = 0; s < NS; s++) for (let k = 0; k < NK - 1; k++) { const a = s * NK + k, c = a + NK; pb.i.push(a, c, a + 1, a + 1, c, c + 1); }
  }
  const rb = makeBuf();
  const rootTips = [];
  const keepOut = (p) => { const dx = p.x, dy = p.y - AXIS_Y, d = Math.hypot(dx, dy); if (d < 7.35 && d > 1e-3) { p.x = dx / d * 7.35; p.y = AXIS_Y + dy / d * 7.35; } return p; };
  const rootCol = (charFn, dim = 1) => (t, a, out, ny) => {
    out.copy(cRoot).lerp(cRootDark, smoothstep(0.25, -0.7, ny) * 0.65).lerp(cMossHi, clamp(smoothstep(0.45, 0.9, ny) * 0.45 * mossAmt * (1 - t * 0.5), 0, 1));
    out.multiplyScalar((0.82 + 0.3 * Math.sin(a * 2 + t * 9)) * dim); return charFn(t);
  };
  const mainPaths = [];
  for (const m of mains) {
    const pts = [], NP = 18;
    for (let k = 0; k <= NP; k++) {
      const t = k / NP, rr = 7.7 + m.len * t, ang = m.ang + m.curl * t * t + 0.1 * Math.sin(t * 5 + m.ph) * t;
      const p = polar(rr, ang, ZM + 1.3 + m.zb * Math.sin(t * 2.4) + m.zf * t * t + 0.3 * Math.sin(t * 9 + m.ph));
      p.y -= 1.4 * t * t * Math.abs(Math.sin(ang));                                    // side roots sag under their own weight
      pts.push(keepOut(p));
    }
    mainPaths.push(pts); rootTips.push(pts[NP].clone());
    sweep(rb, pts, (t, a) => m.r0 * (Math.pow(1 - t, 0.75) * (1 + 0.16 * Math.sin(a * 3 + m.ph) + 0.22 * Math.sin(t * 17 + m.ph)) + 0.07), 9,
      rootCol((t) => smoothstep(0.42, 0.05, t) * 0.95));
  }
  await ctx.yield();
  const sub = (from, t0, lenS, rad, sides, np, spread, gravity, dim = 1) => {
    const i0 = clamp(Math.floor(t0 * (from.length - 1)), 1, from.length - 2), p = from[i0].clone();
    const dir = new THREE.Vector3().subVectors(from[i0 + 1], from[i0 - 1]).normalize();
    const side = new THREE.Vector3(rng.gauss(), rng.gauss(), rng.gauss() * 0.7).normalize();
    dir.addScaledVector(side, spread).normalize();
    const pts = [p.clone()], ph = rng.range(0, 6.28);
    for (let k = 1; k <= np; k++) {
      dir.x += 0.22 * Math.sin(ph + k * 1.3) * (1 - gravity); dir.z += 0.18 * Math.cos(ph * 1.7 + k * 1.1) * (1 - gravity); dir.y -= gravity * 0.45;
      dir.normalize(); p.addScaledVector(dir, lenS / np); pts.push(keepOut(p.clone()));
    }
    sweep(rb, pts, (t, a) => rad * (Math.pow(1 - t, 0.8) + 0.06) * (1 + 0.15 * Math.sin(a * 2 + ph)), sides, rootCol(() => (from[i0].z > ZM - 1 && from[i0].distanceTo(_P.set(0, AXIS_Y, from[i0].z)) < 9.5 ? 0.6 : 0), dim));
    return pts;
  };
  const seconds = [];
  { let nm = 0; for (const pts of mainPaths) { const n = rng.int(4, 7); for (let i = 0; i < n; i++) seconds.push(sub(pts, rng.range(0.22, 0.85), rng.range(2.4, 5.2), rng.range(0.22, 0.46), 6, 8, rng.range(0.5, 1.2), 0.12)); if ((++nm & 3) === 0) await ctx.yield(); } }
  await ctx.yield();
  for (let i = 0; i < 190; i++) {                                                     // hanging rootlets and root hair
    const from = rng.chance(0.45) ? rng.pick(mainPaths) : rng.pick(seconds);
    if ((i & 31) === 31) await ctx.yield();
    sub(from, rng.range(0.15, 0.95), rng.range(0.9, 3.6), rng.range(0.11, 0.18), 4, 5, 0.8, rng.range(0.55, 0.9), 0.5);   // thick enough to stay over a pixel at 60 m (thinner, they broke into rows of pale dots), and dark
  }
  await ctx.yield();
  for (let i = 0; i < 14; i++) {                                                      // tangential tangles lacing the spokes together
    const a0 = rng.range(0, 6.28), da = rng.range(0.35, 0.95) * rng.sign(), r0 = rng.range(8.6, 11.6), r1 = r0 + rng.range(-1, 1.6), z0 = ZM + rng.range(0.6, 2.6), ph = rng.range(0, 6.28), rad = rng.range(0.2, 0.42);
    const pts = []; for (let k = 0; k <= 10; k++) { const t = k / 10; pts.push(keepOut(polar(lerp(r0, r1, t) + 0.5 * Math.sin(t * Math.PI), a0 + da * t, z0 + 0.8 * Math.sin(t * 6 + ph)))); }
    sweep(rb, pts, (t, a) => rad * (0.55 + 0.45 * Math.sin(t * Math.PI)) * (1 + 0.15 * Math.sin(a * 3 + ph)), 6, rootCol(() => 0.15));
  }
  {                                                                                   // dead branch snags along the back of the log
    const nSnag = rng.int(5, 9);
    for (let i = 0; i < nSnag; i++) {
      const z = rng.range(ZT + 8, ZM - 18), th = rng.range(-1.5, 1.5);
      if (holeDist(z, th) < 3.5) continue;
      const r0 = trunkR(z, th) - 0.6, lenS = rng.range(3, 7.5), rad = rng.range(0.22, 0.42), lean = rng.range(-0.9, 0.3), ph = rng.range(0, 6.28), bend = rng.range(-0.6, 0.6);
      const pts = [];
      for (let k = 0; k <= 10; k++) { const t = k / 10; pts.push(polar(r0 + lenS * t, th + bend * t * t * 0.2 + 0.03 * Math.sin(t * 7 + ph), z + lean * lenS * t + 0.25 * Math.sin(t * 9 + ph * 2))); }
      sweep(rb, pts, (t, a) => rad * (Math.pow(1 - t, 0.6) * (1 + 0.15 * Math.sin(a * 3 + ph) + 0.12 * Math.sin(t * 23 + ph)) + 0.08) * (1 + 0.6 * Math.exp(-t * 8)), 7, rootCol(() => 0));
      const nf = rng.int(2, 4); for (let f = 0; f < nf; f++) sub(pts, rng.range(0.3, 0.85), rng.range(1.2, 3.2), rad * rng.range(0.35, 0.6), 5, 6, rng.range(0.5, 0.9), 0.04);
    }
  }
  await ctx.yield();
  const wheel = new THREE.Mesh(mergeGeometries([bufGeo(pb, true), bufGeo(rb, false)], false), woodMat);
  wheel.name = 'root-wheel'; group.add(wheel);
  await ctx.yield();

  // ---------- 4. the bore: charcoal tube, skylight rims, end wall, ember seat ring (self-lit) ----------
  const boreRad = (z, th) => {            // th from straight up; never under 6.2
    const c = Math.cos(th), s = Math.sin(th);
    let r = BORE_R + 0.32 * Math.abs(noise.n3(c * 2.4, s * 2.4, z * 0.16)) + 0.45 * Math.pow(Math.abs(noise.n3(c * 0.9 + 4, s * 0.9, z * 0.05)), 1.3);
    r = Math.min(r, trunkR(z, th) - 0.35);
    const down = -c;                       // flatten the bottom into a duff floor
    if (down > 0.5) r = Math.min(r, (6.3 - 0.07 * (0.5 + 0.5 * noise.n2(s * 3.0, z * 0.5))) / down);
    return Math.max(r, 6.22);
  };
  const ib = { p: [], s: [], k: [], i: [], count: 0 };
  const iv = (x, y, z, s0, s1, kind) => { ib.p.push(x, y, z); ib.s.push(s0, s1); ib.k.push(kind); return ib.count++; };
  {
    const NS = 72, NZ = 104, z0 = ZM + 0.85, z1 = ZP - 2.4, w = NS + 1;
    for (let j = 0; j <= NZ; j++) for (let s = 0; s <= NS; s++) {
      const z = lerp(z0, z1, j / NZ), th = (s / NS) * Math.PI * 2, r = z > ZM ? Math.max(boreRad(z, th), rIn(th > Math.PI ? th - Math.PI * 2 : th) - 0.02) : boreRad(z, th);
      iv(Math.sin(th) * r, AXIS_Y + Math.cos(th) * r, z, th * BORE_R, z, 0);
    }
    for (let j = 0; j < NZ; j++) for (let s = 0; s < NS; s++) {
      const a = j * w + s, c = a + w, zc = lerp(z0, z1, (j + 0.5) / NZ); let thc = ((s + 0.5) / NS) * Math.PI * 2; if (thc > Math.PI) thc -= Math.PI * 2;
      if (holeDist(zc, thc) < -0.9) continue;
      ib.i.push(a, c, a + 1, a + 1, c, c + 1);
    }
    for (const h of holes) {               // burnt rims joining bore and bark around each skylight
      const base = ib.count, NA = 44, NR = 3;
      for (let a = 0; a <= NA; a++) {
        const ang = (a / NA) * Math.PI * 2, R = holeR(h, ang), z = h.z + Math.cos(ang) * R, th = h.th + Math.sin(ang) * R / HOLE_K;
        const ri = boreRad(z, th) - 0.03, ro = trunkR(z, th) + 0.04;
        for (let k = 0; k <= NR; k++) { const t = k / NR, r = lerp(ri, ro, t); iv(Math.sin(th) * r, AXIS_Y + Math.cos(th) * r, z, ang * h.r, t * (ro - ri), 1); }
      }
      for (let a = 0; a < NA; a++) for (let k = 0; k < NR; k++) { const p = base + a * (NR + 1) + k, q = p + NR + 1; ib.i.push(p, q, p + 1, p + 1, q, q + 1); }
    }
    {                                      // burnt-out end wall behind the portal seat
      const base = ib.count, NA = 36, NR = 6;
      for (let k = 0; k <= NR; k++) for (let a = 0; a <= NA; a++) {
        const ang = (a / NA) * Math.PI * 2, r = (k / NR) * 7.4, x = Math.sin(ang) * r, y = Math.cos(ang) * r;
        iv(x, AXIS_Y + y, ZP - 1.9 - 1.6 * (1 - (r / 7.4) ** 2) + 0.35 * noise.n2(x * 0.4, y * 0.4), x, y, 3);
      }
      for (let k = 0; k < NR; k++) for (let a = 0; a < NA; a++) { const p = base + k * (NA + 1) + a, q = p + NA + 1; ib.i.push(p, p + 1, q, p + 1, q + 1, q); }
    }
    {                                      // ember seat ring framing the portal
      const base = ib.count, NA = 72;
      for (let a = 0; a <= NA; a++) { const ang = (a / NA) * Math.PI * 2, sn = Math.sin(ang), cs = Math.cos(ang);
        iv(sn * 6.02, AXIS_Y + cs * 6.02, ZP - 0.35, ang * 6.2, 0, 2); iv(sn * 6.6, AXIS_Y + cs * 6.6, ZP - 0.5, ang * 6.2, 1, 2); }
      for (let a = 0; a < NA; a++) { const p = base + a * 2; ib.i.push(p, p + 1, p + 2, p + 1, p + 3, p + 2); }
    }
  }
  await ctx.yield();
  const boreGeo = new THREE.BufferGeometry();
  boreGeo.setAttribute('position', new THREE.Float32BufferAttribute(ib.p, 3));
  boreGeo.setAttribute('aS', new THREE.Float32BufferAttribute(ib.s, 2));
  boreGeo.setAttribute('aKind', new THREE.Float32BufferAttribute(ib.k, 1));
  boreGeo.setIndex(ib.i); boreGeo.computeVertexNormals();
  const fogU = () => THREE.UniformsUtils.clone(THREE.UniformsLib.fog);
  const VIEW_VS = 'vec3 camObj=(inverse(modelMatrix)*vec4(cameraPosition,1.)).xyz; vView=camObj-position;';
  const boreMat = new THREE.ShaderMaterial({
    fog: true, side: THREE.DoubleSide,
    uniforms: Object.assign(fogU(), U, { uDuff: { value: cSoil.clone().lerp(cDeep, 0.55) }, uMossC: { value: cMoss.clone().lerp(cSage, 0.15) } }),
    vertexShader: /* glsl */`
      attribute vec2 aS; attribute float aKind; varying vec2 vS; varying float vKind; varying vec3 vObj, vN, vView;
      #include <fog_pars_vertex>
      void main(){ vS=aS; vKind=aKind; vObj=position; vN=normal; ${VIEW_VS}
        vec4 mvPosition=modelViewMatrix*vec4(position,1.); gl_Position=projectionMatrix*mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      varying vec2 vS; varying float vKind; varying vec3 vObj, vN, vView;
      uniform vec3 uDuff, uMossC;
      #include <fog_pars_fragment>
      ${GLSL_NOISE}${GLSL_INTERIOR}
      void main(){
        if(vKind<.5 && holeSDF(vObj)<0.) discard;
        vec3 N=normalize(vN); if(!gl_FrontFacing) N=-N;
        vec3 V=normalize(vView), col;
        if(vKind>1.5 && vKind<2.5){
          float f=fbm(vec2(vS.x*1.3,uTime*.3));
          col=uPortalCol*(1.5+4.5*f)*uPortalI*smoothstep(1.,.1,vS.y);
        } else {
          // cracked charcoal: long checks along the grain (cB), alligator plates (c1), fine crazing (c2). The faces are
          // charcoal with a cool sheen; the orange lives only in the cracks.
          vec2 cs=vS*vec2(5.,2.5);
          vec3 cB=voro(vS*vec2(1.05,.3)+3.,.9), c1=voro(cs,.95), c2=voro(vS*vec2(14.,8.)+7.,.85);
          float px=max(fwidth(cs.x),fwidth(cs.y)), aa=clamp(px*2.6-.25,0.,1.), aa2=clamp(px*7.-.25,0.,1.), pxB=max(fwidth(vS.x)*1.05,fwidth(vS.y)*.3);
          float ckB=1.-smoothstep(0.,.03+pxB*.8,cB.x);
          float ck1=(1.-smoothstep(0.,.055+px*.5,c1.x))*(1.-.75*aa), ck2=(1.-smoothstep(0.,.08,c2.x))*(1.-aa2);
          float crack=max(ckB,max(ck1,.5*ck2));
          float grit=fbm(vS*4.7), grit2=fbm(vS*vec2(19.,6.)+11.);
          float hgt=smoothstep(0.,.25,cB.x)*.9+smoothstep(0.,.22,c1.x)*.5*(1.-.7*aa)+smoothstep(0.,.2,c2.x)*.2*(1.-aa2)+grit*.45+grit2*.12*(1.-aa2)+c1.y*.16*(1.-aa);
          vec3 Nb;
          { vec3 sx=dFdx(vObj), sy=dFdy(vObj), r1=cross(sy,N), r2=cross(N,sx); float det=dot(sx,r1);
            float bk=.2*(1.-.6*aa); vec3 gr=sign(det)*(dFdx(hgt*bk)*r1+dFdy(hgt*bk)*r2); gr*=min(1.,abs(det)*1.1/max(length(gr),1e-9)); vec3 nn=abs(det)*N-gr; Nb=dot(nn,nn)>1e-14?normalize(nn):N; }
          vec3 alb=mix(vec3(.038,.027,.02),vec3(.11,.076,.052),mix(c1.y,.5,aa))*(.7+.9*grit)*(.8+.4*mix(c2.y,.5,aa2))*(.85+.3*cB.y);
          alb*=1.-.85*crack;
          float down=-(vObj.y-uDims.x)/max(length(vec2(vObj.x,vObj.y-uDims.x)),1e-3);
          float fn=fbm(vObj.xz*.45), fl=vKind<.5?smoothstep(.78,.9,down+(fn-.5)*.16):0.;
          vec3 fa=mix(uDuff,uMossC,smoothstep(.35,.7,fbm(vObj.xz*.9+3.)))*(.55+.9*fn);
          alb=mix(alb,fa,fl); crack*=1.-fl; ck1*=1.-fl; ckB*=1.-fl; ck2*=1.-fl; Nb=normalize(mix(Nb,N+vec3(fn-.5,0.,fbm(vObj.zx*.6)-.5)*.5,fl));
          vec3 L=interiorLight(vObj,Nb);
          float gl=1.-fl;
          L+=gl*mix(uSkyCol,vec3(.55,.66,.8),.6)*(.75+.25*Nb.y)*(.22+.30*exp(-max(uDims.y-vObj.z,0.)/9.));                // dim cool ambient: black charcoal, never pure black
          col=alb*L;
          if(vKind<.5) col*=.25+.75*smoothstep(0.,.6,holeSDF(vObj));
          float fres=pow(clamp(1.-dot(Nb,V),0.,1.),3.);
          vec3 R=reflect(-V,Nb), tp=vec3(0.,uDims.x,uDims.z)-vObj, tm=vec3(0.,uDims.x,uDims.y+4.)-vObj;
          float dp=length(tp), dm=length(tm), shine=(1.-.8*crack)*(.5+grit);
          col+=gl*shine*uPortalCol*uPortalI*pow(max(dot(R,tp/dp),0.),9.)*(.2/(1.+dp*dp*.004));
          col+=gl*shine*mix(uSkyCol,vec3(.6,.72,.9),.5)*(pow(max(dot(R,tm/dm),0.),9.)*(.22/(1.+dm*dm*.003))+.028*fres);
          float pat=smoothstep(.46,.74,fbm(vS*.16+vec2(uTime*.02,uTime*.05)));
          float hot=smoothstep(.45,.82,fbm(vS*.85+vec2(3.,uTime*.06)))*pat;
          float wave=.6+.4*sin(uTime*1.3+vS.y*.7+cB.y*6.28), tw=.65+.35*sin(uTime*2.1+c1.y*40.);
          col+=uEmberI*gl*uEmber*((ckB*(.035+1.7*hot)+pow(1.-smoothstep(0.,.12,cB.x),2.)*.16*hot)*wave+(ck1*1.1+ck2*.4)*hot*hot*tw);
          if(vKind>.5&&vKind<1.5) col+=alb*(uGold*2.5*uShaftI*max(dot(Nb,-uShaftDir),0.)+uSkyCol*.25);
          if(vKind>2.5) col*=.3;
        }
        gl_FragColor=vec4(col,1.);
        #include <fog_fragment>
      }`,
  });
  const bore = new THREE.Mesh(boreGeo, boreMat); bore.name = 'bore'; group.add(bore);
  woodMat.side = THREE.DoubleSide;
  await ctx.yield();

  // ---------- 5. sword ferns (floor of the bore, flanks, mossy back of the log) ----------
  const fernSpots = [];                   // { p, up, s, inside }
  const UP = new THREE.Vector3(0, 1, 0);
  const floorSpot = (z, phi) => { const th = Math.PI + phi, p = polar(boreRad(z, th) - 0.06, th, z); return { p, up: new THREE.Vector3(-Math.sin(th), -Math.cos(th), 0).lerp(UP, 0.6).normalize() }; };
  const shaftFloor = holes.map((h) => {   // where each shaft lands on the bore floor / wall
    const p = polar(6.9, h.th, h.z);
    for (let t = 0; t < 40; t += 0.25) { _P.copy(p).addScaledVector(shaftDir, t); const th = Math.atan2(_P.x, _P.y - AXIS_Y); if (t > 2 && Math.hypot(_P.x, _P.y - AXIS_Y) >= boreRad(_P.z, th) - 0.1) break; }
    return { start: p, end: _P.clone(), len: _P.distanceTo(p) };
  });
  for (let i = 0; i < 64; i++) {
    const phi = rng.range(0.12, 0.8) * rng.sign(), z = rng.range(ZP + 1.5, ZM + 0.4), sp = floorSpot(z, phi);
    fernSpots.push({ ...sp, s: lerp(0.5, 1.25, smoothstep(0.2, 0.7, Math.abs(phi))) * rng.range(0.8, 1.2), inside: 1 });
  }
  for (const sf of shaftFloor) for (let i = 0; i < 9; i++) {
    const th = Math.atan2(sf.end.x, sf.end.y - AXIS_Y), phi = clamp(angDiff(th, Math.PI) + rng.range(-0.35, 0.35), -0.85, 0.85), sp = floorSpot(sf.end.z + rng.range(-3, 3), phi);
    fernSpots.push({ ...sp, s: rng.range(0.6, 1.0) * (Math.abs(phi) < 0.25 ? 0.75 : 1.2), inside: 1 });
  }
  for (let i = 0; i < 12; i++) {          // tall ferns banked along both walls of the last 25 m, in the portal's light
    const side = i & 1 ? 1 : -1, sp = floorSpot(ZP + 1.5 + (i >> 1) * 4.2 + rng.range(-1, 1), side * rng.range(0.55, 0.95));
    fernSpots.push({ ...sp, s: rng.range(1.25, 1.75), inside: 1 });
  }
  const bermAt = (side, z, t) => {
    const off = side * 7.3, hTop = 2.4 + 1.5 * noise.fbm2(z * 0.05 + off, 3.1, 3) + 0.4 * noise.n2(z * 0.21, off);
    const th0 = side * Math.acos(clamp((hTop - AXIS_Y) / 8.2, -1, 1)), x0 = Math.sin(th0) * (trunkR(z, th0) - 0.25), wOut = 7.5 + 2.5 * noise.n2(z * 0.04, off + 9);
    const x = x0 + side * wOut * t; return new THREE.Vector3(x, lerp(hTop, -1.1, Math.pow(smoothstep(0, 1, t), 0.8)) + 0.9 * noise.fbm2(x * 0.16 + 3, z * 0.16, 3) * Math.sin(Math.min(1, t * 1.6) * Math.PI * 0.5) - 0.05, z);
  };
  for (let i = 0; i < 120; i++) { const side = rng.sign(), p = bermAt(side, rng.range(ZT + 4, ZM - 4), rng.range(0.05, 0.7)); fernSpots.push({ p, up: new THREE.Vector3(side * 0.35, 1, 0).normalize(), s: rng.range(1.1, 2.2), inside: 0 }); }
  for (let i = 0; i < 26; i++) {
    const z = rng.range(ZT + 5, ZM - 5), th = rng.range(-0.75, 0.75); if (holeDist(z, th) < 1.6) continue;
    fernSpots.push({ p: polar(trunkR(z, th) - 0.1, th, z), up: new THREE.Vector3(Math.sin(th) * 0.5, 1, 0).normalize(), s: rng.range(0.6, 1.1), inside: 0 });
  }
  const fernMat = new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide });
  {
    const P = [], Nn = [], C = [], F = [], I = []; let cnt = 0;
    const q = new THREE.Quaternion(), v = new THREE.Vector3(), col = new THREE.Color(), cTip = cMossHi.clone().lerp(cGold, 0.25), NSEG = 5;
    let nSp = 0;
    for (const sp of fernSpots) {
      if ((++nSp & 63) === 0) await ctx.yield();
      q.setFromUnitVectors(UP, sp.up);
      const nFr = rng.int(6, 9), a0 = rng.range(0, 6.28), ph = rng.range(0, 6.28);
      for (let f = 0; f < nFr; f++) {
        const az = a0 + (f / nFr) * 6.28 + rng.range(-0.3, 0.3), len = sp.s * rng.range(0.8, 1.3), lift = rng.range(0.55, 1.15), ca = Math.cos(az), sa = Math.sin(az), wd = len * 0.2;
        const tone = rng.range(0.7, 1.15), gold = rng.chance(0.12) ? 0.5 : 0;
        for (let k = 0; k <= NSEG; k++) {
          const t = k / NSEG, h = len * 0.85 * Math.sin(t * 1.45), y = len * (0.95 * t - 0.62 * t * t) * lift;
          for (const e of [-1, 1]) {
            v.set(ca * h - sa * wd * e, y + 0.03, sa * h + ca * wd * e).applyQuaternion(q).add(sp.p);
            P.push(v.x, v.y, v.z);
            v.set(-ca * 0.5, 1, -sa * 0.5).normalize().applyQuaternion(q); Nn.push(v.x, v.y, v.z);
            col.copy(cMoss).lerp(cTip, t * 0.8).lerp(cGold, gold * t).multiplyScalar(tone * (0.55 + 0.6 * t));
            C.push(col.r, col.g, col.b); F.push(e, t, ph + f, sp.inside);
          }
        }
        for (let k = 0; k < NSEG; k++) { const a = cnt + k * 2; I.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
        cnt += (NSEG + 1) * 2;
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(Nn, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3)); g.setAttribute('aF', new THREE.Float32BufferAttribute(F, 4)); g.setIndex(I);
    fernMat.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, U);
      sh.vertexShader = sh.vertexShader
        .replace('#include <common>', '#include <common>\nattribute vec4 aF; varying vec4 vF; varying vec3 vObj; uniform float uTime;')
        .replace('#include <begin_vertex>', '#include <begin_vertex>\nvF=aF; { float w=aF.y*aF.y*.16; transformed+=vec3(sin(uTime*1.1+aF.z),.4*sin(uTime*1.7+aF.z*1.3),cos(uTime*.9+aF.z*1.7))*w; } vObj=transformed;');
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>', '#include <common>\nvarying vec4 vF; varying vec3 vObj;\n' + GLSL_INTERIOR)
        .replace('#include <color_fragment>', /* glsl */`#include <color_fragment>
          { float t=clamp(vF.y,0.,1.), x=abs(vF.x); float env=sin(pow(t,.75)*3.14159)*.92+.08;
            float pin=abs(fract(t*12.)-.5)*2.; if(x>max(env*(.2+.8*smoothstep(1.,.15,pin)),.09)) discard;
            diffuseColor.rgb*=.75+.5*(1.-x); }`)
        .replace('#include <opaque_fragment>', 'outgoingLight=mix(outgoingLight,diffuseColor.rgb*interiorLight(vObj,vec3(0.,1.,0.))*2.4,vF.w);\n#include <opaque_fragment>');
    };
    fernMat.customProgramCacheKey = () => 'fallen-giant-fern';
    const ferns = new THREE.Mesh(g, fernMat); ferns.name = 'ferns'; group.add(ferns);
  }
  await ctx.yield();

  // ---------- 6. pale glowing mushrooms ----------
  const halos = [];                       // cluster centres, for the soft glow sprites
  {
    const P = [], Nn = [], M = [], I = []; let cnt = 0;
    const q = new THREE.Quaternion(), v = new THREE.Vector3(), o = new THREE.Vector3();
    const shroom = (base, up, R, H, ph) => {
      q.setFromUnitVectors(UP, up);
      const rings = [[0.3 * R + 0.02, 0, 0, 0.1], [0.2 * R + 0.015, H * 0.6, 0, 0.35], [0.22 * R + 0.015, H, 0, 0.6],     // stem
        [R, H + 0.04 * R, 1, 0.75], [0.92 * R, H + 0.3 * R, 1, 1], [0.55 * R, H + 0.52 * R, 1, 1]];                         // cap
      const S = 7, start = cnt;
      for (const [r, y, cap, glow] of rings) for (let s = 0; s < S; s++) {
        const a = (s / S) * 6.283, c = Math.cos(a), sn = Math.sin(a), rr = r * (cap ? 1 + 0.08 * Math.sin(a * 3 + ph) : 1);
        v.set(c * rr, y, sn * rr).applyQuaternion(q).add(base); P.push(v.x, v.y, v.z);
        o.set(c, cap ? 0.6 : 0, sn).normalize().applyQuaternion(q); Nn.push(o.x, o.y, o.z); M.push(glow, ph, cap); cnt++;
      }
      v.set(0, H + 0.6 * R, 0).applyQuaternion(q).add(base); P.push(v.x, v.y, v.z); o.copy(up); Nn.push(o.x, o.y, o.z); M.push(1, ph, 1); const top = cnt++;
      for (let k = 0; k < rings.length - 1; k++) for (let s = 0; s < S; s++) { const a = start + k * S + s, b = start + k * S + (s + 1) % S; I.push(a, a + S, b, b, a + S, b + S); }
      for (let s = 0; s < S; s++) I.push(start + 5 * S + s, top, start + 5 * S + (s + 1) % S);
    };
    const cluster = (c, nrm, spread, n, big) => {
      halos.push(c.clone().addScaledVector(nrm, 0.5));
      const tA = new THREE.Vector3().crossVectors(nrm, new THREE.Vector3(0, 0, 1)).normalize(), tB = new THREE.Vector3().crossVectors(nrm, tA);
      for (let i = 0; i < n; i++) {
        const R = rng.range(0.08, 0.2) * big * (i === 0 ? 1.5 : 1), da = rng.gauss() * spread, db = rng.gauss() * spread;
        const base = c.clone().addScaledVector(tA, da).addScaledVector(tB, db), up = nrm.clone().lerp(UP, 0.55).add(v.set(rng.gauss(), 0, rng.gauss()).multiplyScalar(0.18)).normalize();
        shroom(base, up, R, R * rng.range(1.2, 2.6), rng.range(0, 6.28));
      }
    };
    for (let i = 0; i < 26; i++) {        // inside: floor edges and lower walls
      const phi = rng.range(0.3, 1.15) * rng.sign(), z = rng.range(ZP + 1, ZM - 1), th = Math.PI + phi, r = boreRad(z, th);
      cluster(polar(r - 0.02, th, z), new THREE.Vector3(-Math.sin(th), -Math.cos(th), 0), 0.45, rng.int(5, 10), 1);
      if ((i & 7) === 7) await ctx.yield();
    }
    await ctx.yield();
    for (let i = 0; i < 12; i++) {        // both walls of the last 25 m
      const phi = (i & 1 ? 1 : -1) * rng.range(0.75, 1.3), z = ZP + 1 + (i >> 1) * 4.3 + rng.range(-1.2, 1.2), th = Math.PI + phi, r = boreRad(z, th);
      cluster(polar(r - 0.02, th, z), new THREE.Vector3(-Math.sin(th), -Math.cos(th), 0), 0.5, rng.int(6, 11), 1.25);
    }
    for (let i = 0; i < 9; i++) {         // outside: on the charred lip and lower roots of the wheel
      const th = rng.range(1.75, 2.75) * rng.sign(), r = rng.range(7.0, 8.4);
      cluster(polar(r, th, ZM + lerp(1.6, 2.6, smoothstep(6.8, 8.4, r))), new THREE.Vector3(Math.sin(th) * -0.3, 0.3, 1).normalize(), 0.4, rng.int(4, 8), 1.1);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(Nn, 3));
    g.setAttribute('aM', new THREE.Float32BufferAttribute(M, 3)); g.setIndex(I);
    const mat = new THREE.ShaderMaterial({
      fog: true, uniforms: Object.assign(fogU(), U, { uTint: { value: shroomTint } }),
      vertexShader: /* glsl */`attribute vec3 aM; varying vec3 vM, vN, vView, vObj;
        #include <fog_pars_vertex>
        void main(){ vM=aM; vN=normal; vObj=position; ${VIEW_VS}
          vec4 mvPosition=modelViewMatrix*vec4(position,1.); gl_Position=projectionMatrix*mvPosition;
          #include <fog_vertex>
        }`,
      fragmentShader: /* glsl */`varying vec3 vM, vN, vView, vObj; uniform vec3 uTint; uniform float uGlowI;
        #include <fog_pars_fragment>
        ${GLSL_INTERIOR}
        void main(){ vec3 N=normalize(vN), V=normalize(vView);
          float pulse=.75+.25*sin(uTime*.6+vM.y), rim=pow(clamp(1.-abs(dot(N,V)),0.,1.),2.);
          vec3 col=uTint*(.22*interiorLight(vObj,N)+vec3(.05));
          col+=uTint*vec3(.92,1.,.8)*uGlowI*pulse*vM.x*vM.x*(.34+.5*rim+.26*vM.z);
          gl_FragColor=vec4(col,1.);
          #include <fog_fragment>
        }`,
    });
    const mush = new THREE.Mesh(g, mat); mush.name = 'mushrooms'; group.add(mush);
  }
  await ctx.yield();

  // ---------- 7. skylight shafts (additive soft cylinders with drifting fog) ----------
  {
    const P = [], Nn = [], S = [], I = []; let cnt = 0; const SIDES = 22, SEG = 8;
    holes.forEach((h, hi) => {
      const sf = shaftFloor[hi], a = sf.start.clone().addScaledVector(shaftDir, -0.6), L = sf.len + 1.2;
      _N.set(1, 0, 0).addScaledVector(shaftDir, -shaftDir.x).normalize(); _B.crossVectors(shaftDir, _N);
      for (const shell of [1, 0.55]) {
        const base = cnt;
        for (let k = 0; k <= SEG; k++) for (let s = 0; s <= SIDES; s++) {
          const t = k / SEG, ang = (s / SIDES) * 6.2832, r = h.r * 0.85 * shell * (1 + 0.12 * t);
          const nx = Math.cos(ang) * _N.x + Math.sin(ang) * _B.x, ny = Math.cos(ang) * _N.y + Math.sin(ang) * _B.y, nz = Math.cos(ang) * _N.z + Math.sin(ang) * _B.z;
          P.push(a.x + shaftDir.x * L * t + nx * r, a.y + shaftDir.y * L * t + ny * r, a.z + shaftDir.z * L * t + nz * r);
          Nn.push(nx, ny, nz); S.push(t, shell + (hi ? 2 : 0), hi + ang); cnt++;
        }
        for (let k = 0; k < SEG; k++) for (let s = 0; s < SIDES; s++) { const p = base + k * (SIDES + 1) + s, q = p + SIDES + 1; I.push(p, p + 1, q, p + 1, q + 1, q); }
      }
    });
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(Nn, 3));
    g.setAttribute('aSh', new THREE.Float32BufferAttribute(S, 3)); g.setIndex(I);
    const mat = new THREE.ShaderMaterial({
      fog: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, uniforms: Object.assign(fogU(), U),
      vertexShader: /* glsl */`attribute vec3 aSh; varying vec3 vSh, vN, vView, vObj;
        #include <fog_pars_vertex>
        void main(){ vSh=aSh; vN=normal; vObj=position; ${VIEW_VS}
          vec4 mvPosition=modelViewMatrix*vec4(position,1.); gl_Position=projectionMatrix*mvPosition;
          #include <fog_vertex>
        }`,
      fragmentShader: /* glsl */`varying vec3 vSh, vN, vView, vObj; uniform vec3 uGold; uniform float uTime, uShaftI;
        #include <fog_pars_fragment>
        ${GLSL_NOISE}
        void main(){ float nv=abs(dot(normalize(vN),normalize(vView)));
          float a=pow(clamp(nv,0.,1.),1.8)*smoothstep(0.,.1,vSh.x)*smoothstep(1.,.72,vSh.x);
          float f=fbm(vec2(vSh.z*2.2+vObj.x*.25,vSh.x*2.5-uTime*.17))*fbm(vObj.xz*.3+vec2(uTime*.11,uTime*.05)+3.);
          a*=.35+2.6*f; float deep=step(2.,vSh.y), sh=vSh.y-2.*deep; a*=mix(.55,1.,sh<.8?1.:0.)*smoothstep(4.,18.,length(vView));   // three beams of one kind; they thin out within 18 m of the lens, so none floods the frame
          ${GLSL_FOGFADE}
          gl_FragColor=vec4(uGold*uShaftI*a*.3*fogK,1.); }`,
    });
    const shafts = new THREE.Mesh(g, mat); shafts.name = 'skylight-shafts'; shafts.renderOrder = 3; group.add(shafts);
  }

  // ---------- 8. mushroom halos and motes that light up inside the shafts ----------
  const ptU = Object.assign(fogU(), U, { uVh: { value: 720 }, uTint: { value: shroomTint } });
  {
    const P = [], A = [];
    for (const c of halos) { P.push(c.x, c.y, c.z); A.push(rng.range(2.2, 3.4), rng.range(0, 1), 0, 0); }
    for (let i = 0; i < 1500; i++) {
      if (i < 700) { const sf = rng.pick(shaftFloor), t = rng.range(0, sf.len), a = rng.range(0, 6.28), r = Math.sqrt(rng()) * 2.6; _P.copy(sf.start).addScaledVector(shaftDir, t); P.push(_P.x + Math.cos(a) * r, _P.y + rng.range(-1, 1), _P.z + Math.sin(a) * r); }
      else { const a = rng.range(0, 6.28), r = Math.sqrt(rng()) * 5.6; P.push(Math.sin(a) * r, AXIS_Y + Math.cos(a) * r, rng.range(ZP, ZM + 8)); }
      A.push(rng.range(0.035, 0.09), rng.range(0, 1), 1, 0);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('aP', new THREE.Float32BufferAttribute(A, 4));
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, AXIS_Y, 25), 50);
    const mat = new THREE.ShaderMaterial({
      fog: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, uniforms: ptU,
      vertexShader: /* glsl */`attribute vec4 aP; uniform float uVh; varying vec3 vCol; varying float vKind;
        uniform vec4 uHole[3]; uniform vec3 uShaftDir, uGold, uSkyCol, uTint; uniform vec4 uDims; uniform float uTime, uShaftI, uGlowI;
        #include <fog_pars_vertex>
        void main(){ vec3 p=position; vKind=aP.z; float px=aP.x;
          if(aP.z>.5){ float t=uTime, h=aP.y;
            p+=vec3(sin(t*.21+h*61.),sin(t*.17+h*93.)*.7,cos(t*.19+h*41.))*.9;
            float lit=0.;
            for(int i=0;i<3;i++){ float th=uHole[i].y; vec3 Hc=vec3(sin(th)*7.2,uDims.x+cos(th)*7.2,uHole[i].x); vec3 d=p-Hc; float tt=dot(d,uShaftDir); float r=length(d-uShaftDir*tt), rh=uHole[i].z*.85; lit+=smoothstep(rh,rh*.7,r)*step(0.,tt); }
            vCol=uGold*uShaftI*lit*(1.2+2.5*fract(h*7.7))+uSkyCol*.12*exp(-max(uDims.y-p.z,0.)/9.);
          } else vCol=uTint*uGlowI*.07*(.8+.2*sin(uTime*.6+aP.y*6.28));
          vec4 mvPosition=modelViewMatrix*vec4(p,1.); gl_Position=projectionMatrix*mvPosition;
          float sz=px*projectionMatrix[1][1]*uVh*.5/max(-mvPosition.z,.2);
          if(aP.z>.5){ vCol*=min(sz*sz,1.); sz=max(sz,1.); }
          gl_PointSize=min(sz,260.);
          #include <fog_vertex>
        }`,
      fragmentShader: /* glsl */`varying vec3 vCol; varying float vKind;
        #include <fog_pars_fragment>
        void main(){ float d=length(gl_PointCoord-.5)*2.; if(d>1.) discard;
          float a=vKind>.5?smoothstep(1.,.3,d):pow(clamp(1.-d,0.,1.),2.4);
          ${GLSL_FOGFADE}
          gl_FragColor=vec4(vCol*a*fogK,1.); }`,
    });
    const pts = new THREE.Points(g, mat); pts.name = 'motes-and-halos'; pts.renderOrder = 4; group.add(pts);
  }

  // ---------- anchors, hooks ----------
  let perch = rootTips[0];
  for (const t of rootTips) if (t.y - Math.abs(t.x) * 0.3 > perch.y - Math.abs(perch.x) * 0.3) perch = t;
  let wheelTop = 0; for (const t of rootTips) wheelTop = Math.max(wheelTop, t.y);
  const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
  const anchors = {
    portalSeat: { position: V3(0, AXIS_Y, ZP), facing: V3(0, 0, 1), radius: 6 },
    flyThrough: [V3(0, AXIS_Y, ZM + 125), V3(0, AXIS_Y, ZM + 70), V3(0, AXIS_Y, ZM + 25), V3(0, AXIS_Y, ZM + 3), V3(0, AXIS_Y, 45), V3(0, AXIS_Y, 25), V3(0, AXIS_Y, 5), V3(0, AXIS_Y, ZP)],
    mouth: { position: V3(0, AXIS_Y, ZM + 2), radius: BORE_R },
    skylights: holes.map((h, i) => ({ position: polar(7.4, h.th, h.z), radius: h.r, floor: shaftFloor[i].end.clone() })),
    shaftDir: shaftDir.clone(),
    owlPerch: { position: perch.clone().add(V3(0, 0.4, 0.3)), launch: V3(0, 0.25, 1).normalize() },
    wheelTop: V3(0, wheelTop, ZM + 1.5),
    viewpoints: { reveal: V3(0, AXIS_Y + 0.5, ZM + 125), threeQuarter: V3(-34, 13, ZM + 42), inside: V3(0, AXIS_Y, ZM - 8) },
    axis: { origin: V3(0, AXIS_Y, ZM), dir: V3(0, 0, -1), axisY: AXIS_Y, boreRadius: BORE_R, mouthZ: ZM, portalZ: ZP },
    gully: { halfWidth: 5, floorY: 0.3 },
  };
  const emberBase = opts.ember ?? 1, shaftBase = opts.shaft ?? 1.4, bounceBase = opts.bounce ?? 0.4, bounceIn = opts.bounceIn ?? bounceBase, size = new THREE.Vector2();
  const setProgress = (u) => {
    const a = smoothstep(0.35, 0.8, u);
    U.uEmberI.value = emberBase * (0.55 + 0.45 * a); U.uShaftI.value = shaftBase * (0.78 + 0.22 * a) * (1 + 0.2 * smoothstep(0.84, 0.88, u)); U.uGlowI.value = 0.7 + 0.3 * a;
    U.uBounce.value = lerp(bounceBase, bounceIn, smoothstep(0.78, 0.86, u));
  };
  // viewer-only framing hints (opts.view) for judging the piece up close
  const view = opts.view || null;
  let radius = 64, height = 20, center = V3(0, 8, 0), ground = true;
  if (view === 'mouth') { radius = 14; height = 14; center = V3(0, 8, ZM + 2); }
  else if (view === 'inside') { radius = -4.2; height = 0.01; center = V3(0, AXIS_Y, 30); ground = false; }
  else if (view === 'flank') { radius = 22; height = 14; center = V3(0, 8, 28); }

  return {
    object: group, radius, height, center, anchors, uniforms: U, setProgress,
    update(dt, time) {
      U.uTime.value = time;
      if (ctx.renderer && ctx.renderer.getDrawingBufferSize) ptU.uVh.value = ctx.renderer.getDrawingBufferSize(size).y;
    },
    dispose() {},
    ground, groundY: 0,
  };
}
