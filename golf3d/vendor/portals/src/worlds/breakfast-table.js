// BREAKFAST KINGDOM: a fly-sized flight across a sunlit farmhouse breakfast table, built at 60x.
// Room shell, window light, shafts and motes come from the interior kit; everything on the table
// (china, toast, jam, flowers, steam, bee, ants) is built here and lit by the same light rig.
// The hero set piece (the Honey Fall) lives in ../parts/breakfast-table.js.
import * as THREE from 'three';
import { TeapotGeometry } from 'three/addons/geometries/TeapotGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { makePath, clamp, lerp, smoothstep } from '../kit/core.js';
import * as INT from '../kit/interior.js';
import * as fx from '../kit/fx.js';
import { buildHero } from '../parts/breakfast-table.js';

const TAU = Math.PI * 2, PI = Math.PI, V3 = THREE.Vector3;
const PALETTE = ['#fff1d0', '#8aa48f', '#e4dac4', '#8f5d36', '#c0392b', '#3a2414', '#ffb300'];
const S_CER = INT.surf(0, 0.8), S_MATTE = INT.surf(0, 0.06), S_SOFT = INT.surf(0, 0.3), S_WOOD = INT.surf(1, 0.42), S_FAB = INT.surf(2, 0.04);
const S_CHROME = INT.surf(0, 0.94, 1), S_BRASS = INT.surf(0, 0.8, 1), S_FRUIT = INT.surf(0, 0.55), S_FUZZ = INT.surf(2, 0.1);
const sph = (r, ws = 14, hs = 10) => new THREE.SphereGeometry(r, ws, hs);
const cyl = (rt, rb, h, seg = 16, open = false) => new THREE.CylinderGeometry(rt, rb, h, seg, 1, open);
const box = (w, h, d) => new THREE.BoxGeometry(w, h, d);
const tube = (pts, r, seg = 16, rad = 6) => new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map((p) => new V3(p[0], p[1], p[2]))), seg, r, rad, false);
const lin3 = (hex) => { const c = new THREE.Color(hex); return new V3(c.r, c.g, c.b); };

// Chains extra GLSL into an interior-kit material: `color` runs right after <color_fragment> (before
// the kit's own surface pattern), `surface` just before roughness/metalness are fixed (may edit
// iGloss, iMetal, iEmis), `pars` is placed in front of main().
function hook(mat, key, { pars = '', color = '', surface = '', uniforms = {} }) {
  const base = mat.onBeforeCompile, baseKey = mat.customProgramCacheKey;
  mat.onBeforeCompile = (sh, r) => {
    base.call(mat, sh, r); Object.assign(sh.uniforms, uniforms);
    let f = sh.fragmentShader.replace('void main() {', pars + '\nvoid main() {');
    if (color) f = f.replace('#include <color_fragment>', '#include <color_fragment>\n' + color);
    if (surface) f = f.replace('roughnessFactor=clamp(mix(.96,.05,iGloss)', surface + '\nroughnessFactor=clamp(mix(.96,.05,iGloss)');
    sh.fragmentShader = f;
  };
  mat.customProgramCacheKey = () => baseKey.call(mat) + '|bt-' + key;
  return mat;
}

// The kit builder drops uv; china patterns need it (uv.x = pattern coordinate, uv.y = angle).
function makeUB() {
  const b = INT.makeBuilder(), uv = [];
  const ub = {
    b,
    add(geo, o = {}) {
      const n0 = b.vertexCount; b.add(geo, o);
      const n = b.vertexCount - n0, src = o.uv && geo.attributes.uv ? geo.attributes.uv.array : null;
      for (let i = 0; i < n; i++) uv.push(src ? src[i * 2] : 0, src ? src[i * 2 + 1] : 0);
      geo.dispose(); return ub;
    },
    build() { const g = b.build(); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); return g; },
    get triangles() { return b.triangles; },
  };
  return ub;
}

// Surface of revolution from a profile [[r, y, colour?], ...] traced so that the visible side is on
// the left of the direction of travel (outside bottom -> top, then inside top -> bottom). Two equal
// consecutive points make a hard colour / pattern edge. px(r, y, k) fills uv.x (china pattern coordinate).
function rev(pts, seg = 32, o = {}) {
  const n = pts.length, ring = seg + 1, pos = new Float32Array(n * ring * 3), nor = new Float32Array(n * ring * 3), col = new Float32Array(n * ring * 3), uv = new Float32Array(n * ring * 2);
  const def = new THREE.Color(o.c ?? '#ffffff'), cc = new THREE.Color(), idx = [];
  const same = (a, b) => pts[a][0] === pts[b][0] && pts[a][1] === pts[b][1];
  for (let k = 0; k < n; k++) {
    let a = k, b = k; while (a > 0 && same(a, k)) a--; while (b < n - 1 && same(b, k)) b++;
    let dr = pts[b][0] - pts[a][0], dy = pts[b][1] - pts[a][1]; const l = Math.hypot(dr, dy) || 1; dr /= l; dy /= l;
    const r = pts[k][0], y = pts[k][1]; if (pts[k][2]) cc.set(pts[k][2]); else cc.copy(def);
    const px = o.px ? o.px(r, y, k) : 0, wob = o.wobble;
    for (let i = 0; i <= seg; i++) {
      const th = (i / seg) * TAU, cs = Math.cos(th), sn = Math.sin(th), q = (k * ring + i) * 3, rr = wob ? r * (1 + wob(th, y, k)) : r;
      pos[q] = cs * rr; pos[q + 1] = y; pos[q + 2] = sn * rr; nor[q] = cs * dy; nor[q + 1] = -dr; nor[q + 2] = sn * dy;
      col[q] = cc.r; col[q + 1] = cc.g; col[q + 2] = cc.b; uv[(k * ring + i) * 2] = px; uv[(k * ring + i) * 2 + 1] = th;
    }
    if (k < n - 1 && !same(k, k + 1)) for (let i = 0; i < seg; i++) { const A = k * ring + i, B = A + 1, C = A + ring, D = C + 1; idx.push(A, C, B, B, C, D); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); g.setIndex(idx);
  return g;
}

// ---------------------------------------------------------------- GLSL
// blue-and-white china: bands, scallops and dots driven by uv.x (0 = plain glaze)
const CHINA_GLSL = /* glsl */`
{ float px=vIntUv.x; if(px>.002){ float pa=vIntUv.y, fwp=fwidth(px)*.75+1e-4, m=0.;
    m=max(m, smoothstep(.962-fwp,.962+fwp,px));
    float sc=.80+.03*abs(sin(pa*uChinaPat.x*.5));
    m=max(m, smoothstep(sc-fwp,sc+fwp,px)*(1.-smoothstep(.915-fwp,.915+fwp,px)));
    float da=(fract(pa*uChinaPat.y/6.2832)-.5)*6.2832/uChinaPat.y*px;
    m=max(m, 1.-smoothstep(.014,.014+fwp*1.5,length(vec2(da,px-.735))));
    m=max(m, smoothstep(.672-fwp,.672+fwp,px)*(1.-smoothstep(.69-fwp,.69+fwp,px)));
    // pale reserve dots inside the band
    float db=(fract(pa*uChinaPat.x/6.2832+.5)-.5)*6.2832/uChinaPat.x*px;
    m*=smoothstep(.012,.012+fwp*1.5,length(vec2(db,px-.875)));
    diffuseColor.rgb=mix(diffuseColor.rgb, uChina*(.8+.4*i_n2(vec2(pa*30.,px*50.))), m*.95); } }
`;
// gingham: uv = flat cloth coordinates in metres
const GINGHAM_GLSL = /* glsl */`
{ vec2 gp=vIntUv/uGing.x; vec2 gs=step(.5,fract(gp*.5)); float cov=(gs.x+gs.y)*.5;
  vec2 th=vIntUv/uGing.y; float tfw=length(fwidth(th)); float fade=clamp(1.4-tfw*2.2,0.,1.);
  float wx=sin(th.x*6.2832), wz=sin(th.y*6.2832), weave=wx*wz;
  vec3 cc=mix(uGingA, uGingB, cov*.92);
  float half_=step(.25,cov)*step(cov,.75);
  cc=mix(cc, mix(uGingA,uGingB,step(0.,weave)*.9+.05), half_*fade*.55);
  cc*=1.+.16*weave*fade;
  cc*=.93+.14*i_n2(vIntUv*.35)+.05*i_n2(vIntUv*3.1);
  diffuseColor.rgb*=cc; }
`;
const FOG_VPARS = '\n#include <fog_pars_vertex>\n', FOG_V = '\n#include <fog_vertex>\n', FOG_FPARS = '\n#include <fog_pars_fragment>\n', FOG_F = '\n#include <fog_fragment>\n';
const VNOISE = /* glsl */`
float bh(vec3 p){ p=fract(p*vec3(.1031,.1030,.0973)); p+=dot(p,p.yxz+33.33); return fract((p.x+p.y)*p.z); }
float bn(vec3 p){ vec3 i=floor(p), f=fract(p); f=f*f*(3.-2.*f);
  return mix(mix(mix(bh(i),bh(i+vec3(1,0,0)),f.x),mix(bh(i+vec3(0,1,0)),bh(i+vec3(1,1,0)),f.x),f.y),
             mix(mix(bh(i+vec3(0,0,1)),bh(i+vec3(1,0,1)),f.x),mix(bh(i+vec3(0,1,1)),bh(i+vec3(1,1,1)),f.x),f.y),f.z); }
`;

// Jam in glass: opaque, glows where the window is behind it. color attribute = jam colour, aH = 0..1 height.
function jamMaterial(L) {
  return new THREE.ShaderMaterial({
    fog: true, uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), uSun: L.uSun, uSunCol: L.uSunCol, uAmb: L.uAmb, uSky: L.uSky, uTime: L.uTime },
    vertexShader: /* glsl */`
      attribute vec3 color; attribute float aH; varying vec3 vW, vN, vC; varying float vH; ${FOG_VPARS}
      void main(){ vC=color; vH=aH; vec4 w=modelMatrix*vec4(position,1.); vW=w.xyz; vN=normalize(mat3(modelMatrix)*normal);
        vec4 mvPosition=viewMatrix*w; gl_Position=projectionMatrix*mvPosition; ${FOG_V} }`,
    fragmentShader: /* glsl */`
      uniform vec3 uSun, uSunCol, uAmb, uSky; uniform float uTime; varying vec3 vW, vN, vC; varying float vH; ${FOG_FPARS} ${VNOISE}
      void main(){ vec3 N=normalize(vN), V=normalize(cameraPosition-vW); float ndv=abs(dot(N,V));
        float back=pow(max(dot(-V,uSun),0.),1.5), side=max(dot(N,uSun),0.);
        float thick=mix(.3,1.,ndv);
        float jam=1.-smoothstep(.80,.815,vH+.012*sin(atan(vW.z,vW.x)*3.));
        float seeds=smoothstep(.72,.8,bn(vW*2.6))*.55+.25*bn(vW*.8);
        vec3 body=pow(vC,vec3(1.+1.3*thick))*(1.-.45*seeds*thick);
        body*=mix(1.,.4,ndv*ndv);                                       // deep centre
        vec3 col=body*(uAmb*1.2+uSunCol*(.10+1.25*back+.22*side));
        float rimT=1.-ndv; vec3 sunH=normalize(vec3(uSun.x,0.,uSun.z)+1e-5);
        float exitL=max(dot(N,-sunH),0.); exitL*=exitL*smoothstep(.02,.3,vH)*(1.-.5*ndv);            // sun gathered by the jar leaves on the far side: stained glass
        col+=vC*uSunCol*(.07+.6*rimT*sqrt(rimT)+.5*exitL)*(1.-.4*seeds);              // light coming through the jam from the window
        vec3 glass=uAmb*.55+uSunCol*(.05+.35*back);                      // the empty neck above the jam
        col=mix(col, glass*vec3(.9,.97,.95), .25*(1.-smoothstep(.12,.3,ndv)));   // the clear glass wall at the silhouette
        col=mix(glass*vec3(.9,.97,.95), col, jam);
        vec3 R=reflect(-V,N); float fres=pow(1.-ndv,3.);
        col+=uSky*(.08+.9*fres)*smoothstep(-.3,.5,R.y);
        float win=smoothstep(.55,.9,dot(R,normalize(vec3(-1.,.35,.1))))*smoothstep(.9,.4,abs(fract(R.y*3.+.5)-.5)*2.);
        col+=uSky*.55*win;
        col+=uSunCol*pow(max(dot(R,uSun),0.),160.)*3.;
        gl_FragColor=vec4(col,1.); ${FOG_F} }`,
  });
}

// Dew drops: instanced beads showing an inverted room and a sun glint; they quiver, some run down.
function dropMaterial(L) {
  return new THREE.ShaderMaterial({
    fog: true, uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), uSun: L.uSun, uSunCol: L.uSunCol, uAmb: L.uAmb, uSky: L.uSky, uTime: L.uTime },
    vertexShader: /* glsl */`
      attribute vec4 aDrop; uniform float uTime; varying vec3 vW, vN; ${FOG_VPARS}
      void main(){ vec3 p=position; float ph=aDrop.x*6.2832;
        p.xz*=1.+.07*sin(uTime*6.+ph); p.y*=1.-.07*sin(uTime*6.+ph);
        vec4 w=modelMatrix*instanceMatrix*vec4(p,1.);
        float run=aDrop.y; if(run>0.){ float f=fract(uTime*.07*(.6+aDrop.x)+aDrop.x); w.y-=run*f*f; float e=sin(3.1416*min(f*1.15,1.)); w.xyz=mix((modelMatrix*instanceMatrix*vec4(0.,0.,0.,1.)).xyz-vec3(0.,run*f*f,0.), w.xyz, .35+.65*e); }
        vW=w.xyz; vN=normalize(mat3(modelMatrix)*mat3(instanceMatrix)*normal);
        vec4 mvPosition=viewMatrix*w; gl_Position=projectionMatrix*mvPosition; ${FOG_V} }`,
    fragmentShader: /* glsl */`
      uniform vec3 uSun, uSunCol, uAmb, uSky; varying vec3 vW, vN; ${FOG_FPARS}
      vec3 env(vec3 d){ vec3 c=mix(uAmb*.5, uSky, smoothstep(-.4,.5,d.y)); c+=uSunCol*.5*smoothstep(.55,.95,dot(d,normalize(vec3(-1.,.3,.15)))); return c; }
      void main(){ vec3 N=normalize(vN), V=normalize(cameraPosition-vW); float ndv=max(dot(N,V),0.);
        vec3 rd=refract(-V,N,.75); vec3 col=env(vec3(rd.x,-rd.y,rd.z))*.75;
        vec3 R=reflect(-V,N); col+=env(R)*(.06+.94*pow(1.-ndv,4.));
        col+=uSunCol*(pow(max(dot(R,uSun),0.),90.)*4.+pow(max(dot(rd,-uSun),0.),6.)*.9);
        gl_FragColor=vec4(col,1.); ${FOG_F} }`,
  });
}

// Steam: instanced soft puffs. aOrg = emitter, aVel = drift (m/s), aPar = (phase, life s, size0, size1), aMisc = (alpha, wobble).
function makeSteam(L, list) {
  const n = list.length, base = new THREE.PlaneGeometry(2, 2), g = new THREE.InstancedBufferGeometry();
  g.index = base.index; g.setAttribute('position', base.attributes.position);
  const org = new Float32Array(n * 3), vel = new Float32Array(n * 3), par = new Float32Array(n * 4), misc = new Float32Array(n * 2);
  list.forEach((p, i) => { org.set(p.org, i * 3); vel.set(p.vel, i * 3); par.set([p.phase, p.life, p.s0, p.s1], i * 4); misc.set([p.alpha, p.wobble], i * 2); });
  g.setAttribute('aOrg', new THREE.InstancedBufferAttribute(org, 3)); g.setAttribute('aVel', new THREE.InstancedBufferAttribute(vel, 3));
  g.setAttribute('aPar', new THREE.InstancedBufferAttribute(par, 4)); g.setAttribute('aMisc', new THREE.InstancedBufferAttribute(misc, 2));
  g.instanceCount = n;
  const uniforms = { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), uSun: L.uSun, uSunCol: L.uSunCol, uAmb: L.uAmb, uTime: L.uTime, uBoost: { value: 1 } };
  const mat = new THREE.ShaderMaterial({
    uniforms, fog: true, transparent: true, depthWrite: false, blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor,
    vertexShader: /* glsl */`
      attribute vec3 aOrg, aVel; attribute vec4 aPar; attribute vec2 aMisc; uniform float uTime, uBoost;
      varying vec2 vUv; varying float vA, vSeed, vAge; varying vec3 vW; ${FOG_VPARS}
      void main(){ float age=fract(uTime/aPar.y+aPar.x); float t=age*aPar.y; vAge=age; vSeed=aPar.x*37.;
        vec3 c=aOrg+aVel*t; float wb=aMisc.y*age;
        c+=vec3(sin(t*.9+vSeed*3.)+.5*sin(t*2.1+vSeed), .35*sin(t*1.3+vSeed*2.), cos(t*.8+vSeed*5.)+.5*cos(t*1.7+vSeed*4.))*wb;
        float s=mix(aPar.z,aPar.w,pow(age,.7));
        vA=aMisc.x*uBoost*smoothstep(0.,.1,age)*(1.-smoothstep(.45,1.,age));
        vUv=position.xy; vW=c;
        vec4 mvPosition=viewMatrix*vec4(c,1.); mvPosition.xy+=position.xy*s;
        float nearFade=smoothstep(1.5,7.,-mvPosition.z); vA*=nearFade;
        gl_Position=projectionMatrix*mvPosition; ${FOG_V} }`,
    fragmentShader: /* glsl */`
      uniform vec3 uSun, uSunCol, uAmb; uniform float uTime; varying vec2 vUv; varying float vA, vSeed, vAge; varying vec3 vW; ${FOG_FPARS} ${VNOISE}
      void main(){ float r=length(vUv); if(r>1.) discard;
        vec3 q=vec3(vUv*1.6+vSeed, uTime*.22+vSeed);
        float nz=bn(q)*.6+bn(q*2.3+3.)*.4;
        float a=smoothstep(1.,.1,r)*smoothstep(.3+.3*vAge,.85,nz+(.5-r)*.6)*vA;
        vec3 V=normalize(cameraPosition-vW); float fwd=pow(max(dot(-V,uSun),0.),3.);
        vec3 col=vec3(1.,.97,.92)*(uAmb*1.35+uSunCol*(.16+.95*fwd)*(.6+.5*nz));
        gl_FragColor=vec4(col*a,a);
        #ifdef USE_FOG
          gl_FragColor.rgb=mix(gl_FragColor.rgb, fogColor*a, smoothstep(fogNear,fogFar,vFogDepth));
        #endif
      }`,
  });
  const mesh = new THREE.Mesh(g, mat); mesh.frustumCulled = false; mesh.renderOrder = 5; mesh.name = 'steam';
  return { mesh, uniforms };
}

// Apple-tree leaves seen through the window panes: alpha-tested procedural leaves that stir in the wind.
function leafMaterial(L, size, mull, bar, bay) {
  return new THREE.ShaderMaterial({
    fog: true, side: THREE.DoubleSide,
    uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), uTime: L.uTime, uSunCol: L.uSunCol, uSize: { value: new THREE.Vector2(size[0], size[1]) }, uMull: { value: new THREE.Vector2(mull[0], mull[1]) }, uBar: { value: bar }, uBay: { value: bay } },
    vertexShader: /* glsl */`
      uniform float uBay; varying vec2 vUv; varying float vK; ${FOG_VPARS}
      void main(){ vUv=uv; vec4 w=modelMatrix*vec4(position,1.); vK=floor(-w.z/uBay);
        vec4 mvPosition=viewMatrix*w; gl_Position=projectionMatrix*mvPosition; ${FOG_V} }`,
    fragmentShader: /* glsl */`
      uniform float uTime, uBar; uniform vec2 uSize, uMull; uniform vec3 uSunCol; varying vec2 vUv; varying float vK; ${FOG_FPARS}
      float lh(vec2 p){ p=fract(p*vec2(123.34,456.21)); p+=dot(p,p+45.32); return fract(p.x*p.y); }
      float ln(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f); return mix(mix(lh(i),lh(i+vec2(1.,0.)),f.x),mix(lh(i+vec2(0.,1.)),lh(i+vec2(1.,1.)),f.x),f.y); }
      vec4 layer(vec2 p, float cell, float seed){
        vec2 q=p/cell, id=floor(q), f=q-id; vec4 best=vec4(0.);
        for(int j=-1;j<=1;j++) for(int i=-1;i<=1;i++){
          vec2 o=vec2(float(i),float(j)), cid=id+o; float r=lh(cid+seed);
          vec2 c=o+.15+.7*vec2(lh(cid*1.3+seed+.7),lh(cid*1.7+seed+3.1));
          vec2 wp=(cid+.5)*cell/uSize+.5;
          float dens=clamp(1.7*(wp.y-.52)+.9*ln(wp*2.6+seed)+.5*smoothstep(.6,1.,abs(wp.x-.5)*2.)-.25,0.,1.);
          if(r>dens) continue;
          float ang=r*6.2832+.3*sin(uTime*(.7+r)+r*40.)+.12*sin(uTime*2.3+r*17.);
          vec2 d=f-c; d=mat2(cos(ang),-sin(ang),sin(ang),cos(ang))*d;
          float e=length(d*vec2(1.,2.2)+vec2(0.,abs(d.x)*.35))-.44;
          if(e<0.){ float lit=lh(cid+seed+9.); lit*=lit;
            vec3 col=mix(vec3(.035,.09,.02), vec3(.42,.66,.12)*uSunCol*.42, lit);
            col*=1.-.45*smoothstep(.06,.0,abs(d.y))*step(lit,.99); best=vec4(col,1.); }
        }
        return best;
      }
      void main(){
        vec2 dl=(.5-abs(fract(vUv*uMull)-.5))*uSize/uMull; if(min(dl.x,dl.y)<uBar+.3) discard;
        vec2 p=(vUv-.5)*uSize; p.x+=1.1*sin(uTime*.55+p.y*.06+vK*2.)+.4*sin(uTime*1.7+p.y*.2); p.y+=.5*sin(uTime*.8+p.x*.07);
        vec4 a=layer(p,9.,vK*7.+1.), b=layer(p+vec2(3.3,1.7),6.2,vK*5.+4.);
        vec4 c=a.a>0.?a:b; if(c.a<.5) discard;
        gl_FragColor=vec4(c.rgb,1.); ${FOG_F} }`,
  });
}

// Gingham table cloth: flat on the top, folded over the edges, hanging in soft pleats that sway.
function clothGeometry(x0, x1, z0, z1, y, drop, noise) {
  const step = 1.5, nx = Math.round((x1 - x0 + 2 * drop) / step), nz = Math.round((z1 - z0 + 2 * drop) / step), n = (nx + 1) * (nz + 1);
  const pos = new Float32Array(n * 3), uv = new Float32Array(n * 2), col = new Float32Array(n * 3).fill(1), sf = new Float32Array(n * 4), idx = [], rr = 0.9, qa = rr * PI / 2;
  for (let j = 0; j <= nz; j++) for (let i = 0; i <= nx; i++) {
    const k = j * (nx + 1) + i, s = x0 - drop + (i / nx) * (x1 - x0 + 2 * drop), t = z0 - drop + (j / nz) * (z1 - z0 + 2 * drop);
    const cx = clamp(s, x0, x1), cz = clamp(t, z0, z1), dx = s - cx, dz = t - cz, d = Math.hypot(dx, dz);
    let X = s, Y = y + 0.05 * noise.n2(s * 0.09, t * 0.09) + 0.03 * noise.n2(s * 0.4, t * 0.4), Z = t, sway = 0;
    if (d > 1e-6) {
      const ux = dx / d, uz = dz / d; let out, down;
      if (d < qa) { out = rr * Math.sin(d / rr); down = rr * (1 - Math.cos(d / rr)); } else { out = rr; down = rr + d - qa; }
      const hang = smoothstep(0, drop * 0.8, down), per = (Math.abs(dx) > Math.abs(dz) ? t : s) * 0.42 + (dx * dz !== 0 ? Math.atan2(dz, dx) * 4 : 0);
      out += hang * (0.9 * Math.sin(per + 1.5 * noise.n2(s * 0.05, t * 0.05)) + 0.5 * noise.n2(s * 0.2 + 9, t * 0.2)) + hang * 0.6;
      X = cx + ux * out; Z = cz + uz * out; Y = y - down; sway = hang;
    }
    pos[k * 3] = X; pos[k * 3 + 1] = Y; pos[k * 3 + 2] = Z; uv[k * 2] = s; uv[k * 2 + 1] = t;
    const su = INT.surf(INT.SURF.FABRIC, 0.04, 0, 0, sway); sf.set(su, k * 4);
    if (i < nx && j < nz) idx.push(k, k + nx + 1, k + 1, k + 1, k + nx + 1, k + nx + 2);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.setAttribute('surf', new THREE.BufferAttribute(sf, 4)); g.setIndex(idx); g.computeVertexNormals();
  return g;
}

export default {
  id: 'breakfast-table', name: 'Breakfast Kingdom', category: 'domestic', weirdness: 0.15,
  async build(ctx) {
    const rng = ctx.rng, noise = ctx.noise, S = 60;
    const scene = new THREE.Scene();

    // ---------------------------------------------------------------- per-seed character
    const vr = rng.fork('variety');
    const sunEl = vr.range(24, 27), sunAhead = -vr.range(0.09, 0.125), warmth = vr.range(0, 1);
    const ging = vr.pick([['#7f9f86', 'sage'], ['#c0392b', 'red'], ['#6f93c4', 'blue'], ['#5f8fa0', 'teal']]);   // never amber: honey is the only gold
    const chinaBlue = vr.pick(['#2b4a9c', '#27407f', '#3a5aa8']);
    const JAMS = [['#c2281e', 'strawberry'], ['#e8860c', 'apricot'], ['#8a1848', 'blackcurrant'], ['#d9b01a', 'lemon curd'], ['#a01a2c', 'raspberry'], ['#5f8a1e', 'greengage']];
    const jams = vr.shuffle(JAMS.slice()).slice(0, 3);
    const nBees = vr.int(1, 3), nAnts = vr.int(32, 46), nToast = vr.int(3, 5), nStems = vr.int(9, 13), haze = vr.range(0.8, 1.25);
    const sunColor = new THREE.Color('#ffe9c4').lerp(new THREE.Color('#ffd09a'), warmth);
    const fogColor = new THREE.Color('#ecd2a6').lerp(new THREE.Color('#f0c48e'), warmth);
    scene.background = fogColor.clone().multiplyScalar(0.55);
    scene.fog = new THREE.Fog(fogColor.clone().multiplyScalar(0.72), 80, 780 / haze);

    // ---------------------------------------------------------------- room shell, window wall, light rig (interior kit)
    const ROOM_L = 270, TY = 45;                                  // room length, table top height
    const TX0 = -112, TX1 = -52, TZ0 = -148, TZ1 = -40;            // table top rectangle
    const room = INT.makeRoom({
      rng: rng.fork('room'), style: 'room', scale: S, bays: 3, length: ROOM_L / S, entry: 'wall',
      sun: { side: -1, elevation: sunEl, ahead: sunAhead, color: sunColor, intensity: 10.5 },
      windows: { w: 1.25, h: 1.5, sill: 1.083, mull: [4, 5], bar: 0.03 }, exit: { w: 0.02, h: 0.02 },
      light: { ambient: 1.15, sky: 2.9, dapple: { amount: 0.17, size: 0.5, speed: 1 } }, floorGloss: 0.5, wallPatternScale: 0.45,
      windowLight: { shaftGain: 0.085, paneGain: 0.3, glare: 0.5, motesPerWindow: 220, maxMotes: 700, outdoor: { zenith: '#5f97e0', horizon: '#f4f1e2', ground: '#5f8a3c', cloud: '#ffffff' } },
    });
    // quiet cool wallpaper (sage to blue-grey on linen, sage wainscot) so honey and wood are the only warm things.
    // Set on the finished material, not through makeRoom's palette, so the room's own random draws stay as they were.
    {
      const wu = room.materials.wall.userData.uniforms, set = (u, c) => u.value.set(c.r, c.g, c.b);
      set(wu.uColA, new THREE.Color('#9db3a0').lerp(new THREE.Color('#a9bcd0'), warmth)); set(wu.uColB, new THREE.Color('#e4dac4').lerp(new THREE.Color('#a3b8b8'), 0.3)); set(wu.uColC, new THREE.Color('#8aa48f'));
    }
    scene.add(room.object);
    const rig = room.rig, sunDir = rig.state.sunDir.clone();
    await ctx.yield();

    // shared light values for the custom shaders (jam, drops, steam, hero honey)
    const sunLin = new THREE.Color(sunColor);
    const L = {
      uSun: { value: sunDir.clone() }, uSunCol: { value: new V3(sunLin.r, sunLin.g, sunLin.b).multiplyScalar(2.5) },
      uAmb: { value: lin3('#fff1d0').multiplyScalar(0.5) }, uSky: { value: lin3('#dfe9ff').multiplyScalar(1.5) }, uTime: { value: 0 },
    };

    // apple-tree leaves moving outside the windows
    {
      const row = room.windows[0];
      if (row) {
        const geos = [];
        for (let k = 0; k < row.count; k++) {
          const g = new THREE.PlaneGeometry(row.width, row.height); g.rotateY(PI / 2);
          const c = row.origin.clone().addScaledVector(row.axis, k * row.spacing).addScaledVector(row.normal, 0.6 - (row.depth ?? 0)); g.translate(c.x, c.y, c.z); geos.push(g);
        }
        const lm = new THREE.Mesh(mergeGeometries(geos), leafMaterial(L, [row.width, row.height], row.mullions, row.bar, Math.min(row.spacing, 1e4))); lm.name = 'apple-leaves'; scene.add(lm); geos.forEach((g) => g.dispose());
      }
    }

    await ctx.yield();
    if (room.windows[0]) { room.windows[0].bar = 0.05 * S; rig.refresh(); }   // light-grid bars a little wider than the joinery so the mullion grid reads on the cloth

    await ctx.yield();
    // ---------------------------------------------------------------- materials
    const uChina = { uChina: { value: lin3(chinaBlue).multiplyScalar(0.72) }, uChinaPat: { value: new THREE.Vector2(vr.pick([18, 22, 26]), vr.pick([28, 36, 44])) } };
    const propMat = hook(INT.propMaterial({ rig }), 'grain', { color: /* glsl */`
{ float isW=step(1.,vSurf.x)*step(vSurf.x,2.); if(isW>.5){ vec3 wp=vObjPos; float across=wp.y*1.1+wp.z*.9;
    float fig=i_n2(vec2(wp.x*.045, across*.9)), fine=i_n2(vec2(wp.x*.22, across*6.)), pore=i_n2(vec2(wp.x*.9, across*14.));
    float band=.5+.5*sin(across*2.6+fig*9.+wp.x*.03);
    diffuseColor.rgb*=(.81+.27*fig)*(.93+.09*band)*(.9+.2*fine)*(.94+.12*pore);
    diffuseColor.rgb=mix(diffuseColor.rgb, diffuseColor.rgb*vec3(1.12,.96,.78), fig); } }` });
    const chinaMat = hook(INT.propMaterial({ rig, sway: { dir: [1, 0, 0.35], amp: 0.011, freq: 1.15, k: 9 } }), 'china', { pars: 'uniform vec3 uChina; uniform vec2 uChinaPat;', color: CHINA_GLSL, uniforms: uChina });
    const floraMat = INT.propMaterial({ rig, side: THREE.DoubleSide, sway: { dir: [1, 0.1, 0.6], amp: 0.0085, freq: 0.85, k: 5 } });
    const gingB = new THREE.Color(ging[0]);
    const clothMat = hook(INT.propMaterial({ rig, side: THREE.DoubleSide, sway: { dir: [0.8, 0, 0.6], amp: 0.0045, freq: 0.7, k: 4 } }), 'gingham', {
      pars: 'uniform vec3 uGingA, uGingB; uniform vec2 uGing;', color: GINGHAM_GLSL,
      uniforms: { uGingA: { value: lin3('#d6cab0') }, uGingB: { value: new V3(gingB.r, gingB.g, gingB.b) }, uGing: { value: new THREE.Vector2(2.4, 0.2) } } });

    await ctx.yield();
    // ---------------------------------------------------------------- furniture from the kit: table, chairs, counter, basil
    const CY = TY + 0.22;                                        // cloth surface
    // Built in five kit calls so no single step holds the page long. Each item's random stream is named after its
    // index in the list, so the later calls get an rng whose fork() restores the index the item had in one call.
    const frng = rng.fork('furniture'), furParts = [];
    const furItems = [
        { kind: 'table', position: [(TX0 + TX1) / 2, 0, (TZ0 + TZ1) / 2], rotation: PI / 2, opts: { width: (TZ1 - TZ0) / S, depth: (TX1 - TX0) / S, height: TY / S, legs: 'turned', color: '#8f5d36' } },
        { kind: 'chair', position: [-30, 0, -70 + vr.range(-6, 6)], rotation: -PI / 2 + vr.range(-0.25, 0.25), opts: { color: '#7a4a28', seatColor: ging[0] } },
        { kind: 'chair', position: [-28, 0, -128 + vr.range(-6, 6)], rotation: -PI / 2 + vr.range(-0.3, 0.3), opts: { color: '#7a4a28', seatColor: ging[0] } },
        { kind: 'chair', position: [-136, 0, -96 + vr.range(-10, 10)], rotation: PI / 2 + vr.range(-0.3, 0.3), opts: { color: '#7a4a28', seatColor: ging[0] } },
        { kind: 'chair', position: [-105 + vr.range(-4, 4), 0, -180 + vr.range(-4, 4)], rotation: vr.range(-0.35, 0.35), opts: { color: '#7a4a28', seatColor: ging[0] } },
        { kind: 'plant', position: [80 + 0 * vr.range(-4, 6), 0, -ROOM_L + 20], rotation: vr.range(0, TAU), occluder: false, opts: { kind: (vr.pick(['palm', 'fig', 'fern']), 'fig'), height: 1.5, potColor: '#b5653a' } },   // always the small fig, well right of the dresser: nothing green near the approach
        { kind: 'clock', position: [-146.5, 0, -ROOM_L + 13], rotation: 0, occluder: false },
        { kind: 'kitchenCounter', position: [-192 + 19.5, 0, -135], rotation: PI / 2, occluder: false, opts: { width: 3.9, range: false, rail: false, color: '#8aa48f', topColor: '#a8763e' } },
        { kind: 'plant', position: [-201, 65, -112 + vr.range(-8, 8)], rotation: vr.range(0, TAU), occluder: false, opts: { kind: 'ficus', height: 0.36, leafColor: '#4f9a2a', potColor: '#b5653a' } },
    ];
    for (const [i0, i1] of [[0, 5], [5, 6], [6, 7], [7, 8], [8, 9]]) {
      const r = () => frng(); Object.assign(r, frng); r.fork = (label) => frng.fork(String(label).replace(/^item(\d+)$/, (m, k) => 'item' + (+k + i0)));
      const f = INT.makeFurniture({ rig, rng: i0 ? r : frng, scale: S, lights: false, occluders: true, items: furItems.slice(i0, i1) });
      scene.add(f.object); furParts.push(f);
      await ctx.yield();
    }

    await ctx.yield();
    const cloth = new THREE.Mesh(clothGeometry(TX0, TX1, TZ0, TZ1, CY, 11, noise), clothMat); cloth.name = 'cloth'; scene.add(cloth);
    await ctx.yield();

    // ---------------------------------------------------------------- tableware
    const china = makeUB(), props = makeUB();
    const P = (x, y, z, ry = 0) => new THREE.Matrix4().makeRotationY(ry).setPosition(x, y, z);
    const CREAM = '#cfc4ac', glints = [], drops = [], steamList = [];
    const _q = new THREE.Quaternion(), _up = new V3(0, 1, 0);
    const addDrop = (p, nrm, s, run = 0) => drops.push({ p: p.clone(), n: nrm.clone().normalize(), s, run });
    const lr = rng.fork('layout');
    const puffs = (org, vel, count, life, s0, s1, alpha, wobble, jitter = 0.4) => {
      for (let i = 0; i < count; i++) steamList.push({ org: [org.x + lr.range(-jitter, jitter), org.y, org.z + lr.range(-jitter, jitter)], vel: [vel[0] * lr.range(0.8, 1.2), vel[1] * lr.range(0.85, 1.15), vel[2] * lr.range(0.8, 1.2)],
        phase: (i + lr()) / count, life: life * lr.range(0.85, 1.15), s0, s1: s1 * lr.range(0.8, 1.25), alpha, wobble });
    };

    const cupBody = (m, y0, tea, sway) => {
      const prof = [[0.01, 0.12], [1.2, 0.12], [1.3, 0], [1.42, 0.05], [1.55, 0.5], [2.2, 2.2], [2.42, 3.0], [2.42, 3.0], [2.58, 3.9], [2.64, 4.6], [2.6, 4.7], [2.6, 4.7], [2.5, 4.6], [2.4, 3.8], [2.0, 2.2], [1.3, 0.9], [0.01, 0.8]];
      china.add(rev(prof, 36, { c: CREAM, px: (r, y, k) => (k >= 7 && k <= 10 ? lerp(0.76, 1.0, (y - 3.0) / 1.7) : 0) }), { pre: m, p: [0, y0, 0], surf: S_CER, uv: true, sway });
      china.add(new THREE.TorusGeometry(1.05, 0.22, 8, 14, PI), { pre: m, p: [2.42, y0 + 2.6, 0], r: [0, 0, -PI / 2], c: CREAM, surf: S_CER, sway });
      if (tea) china.add(new THREE.CircleGeometry(2.46, 24), { pre: m, p: [0, y0 + 4.05, 0], r: [-PI / 2, 0, 0], c: '#8a4a18', surf: INT.surf(0, 0.97, 0, 0.1) });
    };
    const saucer = (m) => china.add(rev([[0.3, 0], [2.0, 0], [2.3, 0.15], [4.1, 0.72], [4.25, 0.88], [4.25, 0.88], [4.1, 0.95], [2.5, 0.42], [2.0, 0.34], [0.01, 0.34]], 40,
      { c: CREAM, px: (r, y, k) => (k >= 5 ? r / 4.25 : 0) }), { pre: m, surf: S_CER, uv: true });
    const cupAt = (x, z, ry) => {
      const m = P(x, CY, z, ry); saucer(m); cupBody(m, 0.34, true);
      // teaspoon on the saucer
      props.add(sph(1, 12, 8), { pre: m, p: [-3.1, 1.0, 1.2], r: [0, 0.5, 0.25], s: [0.55, 0.14, 0.8], c: '#e2e6ea', surf: S_CHROME });
      props.add(cyl(0.12, 0.16, 3.4, 6), { pre: m, p: [-2.2, 0.72, -0.4], r: [PI / 2 - 0.12, 0.5, 0], c: '#e2e6ea', surf: S_CHROME });
      puffs(new V3(x, CY + 4.6, z), [0.25, 1.25, -0.2], 10, 6.5, 0.9, 3.4, 0.2, 0.9, 1.2);
      glints.push([x, CY + 5.1, z + 2.5]);
    };
    const CUP1 = [-103 + lr.range(-1.5, 1.5), -77 + lr.range(-2, 2)], CUP2 = [-71 + lr.range(-1.5, 1.5), -103.5 + lr.range(-1.5, 1.5)];
    cupAt(CUP1[0], CUP1[1], lr.range(0, TAU)); cupAt(CUP2[0], CUP2[1], lr.range(0, TAU));

    await ctx.yield();
    // teapot: the Utah one, blue lid and shoulder, pattern by height
    const TP = [-69, -84], tpYaw = PI + lr.range(0.25, 0.55);
    let spout;
    {
      const tg = new TeapotGeometry(1, 8, true, true, true, true, true); await ctx.yield(); tg.computeBoundingBox();
      const bb = tg.boundingBox, k = 13 / (bb.max.y - bb.min.y); tg.translate(0, -bb.min.y, 0); tg.scale(k, k, k);
      const tp = tg.attributes.position, tuv = tg.attributes.uv, tip = new V3(-1e9, 0, 0);
      for (let i = 0; i < tp.count; i++) { const x = tp.getX(i), y = tp.getY(i), z = tp.getZ(i); tuv.setXY(i, clamp(0.5 + (y / 13 - 0.2), 0.3, 1), Math.atan2(z, x)); if (x > tip.x) tip.set(x, y, z); }
      await ctx.yield();
      const tm = P(TP[0], CY, TP[1], tpYaw); china.add(tg, { pre: tm, c: CREAM, surf: S_CER, uv: true });
      spout = tip.applyMatrix4(tm);
      glints.push([TP[0] - 4, CY + 11.2, TP[1] + 2], [TP[0] - 1, CY + 13.4, TP[1]]);
    }
    puffs(new V3(spout.x, spout.y + 0.3, spout.z), [-0.55, 2.3, -0.8], 34, 10, 0.9, 6.2, 0.36, 1.7, 0.3);

    await ctx.yield();
    // flower jug
    const JUG = [-104, -135.5];
    {
      const m = P(JUG[0], CY, JUG[1], lr.range(0, TAU));
      const prof = [[0.01, 0], [3.4, 0], [3.9, 0.3], [4.55, 3], [4.8, 4.2], [4.8, 4.2], [4.9, 6], [4.55, 8.4], [4.55, 8.4], [4.3, 10], [3.3, 12.5], [3.45, 14.2], [3.45, 14.2], [3.95, 15], [3.95, 15], [3.7, 14.9], [3.1, 12.5], [4.0, 10], [4.6, 6], [4.2, 1.0], [0.01, 0.8]];
      china.add(rev(prof, 44, { c: CREAM, px: (r, y, k) => (k >= 5 && k <= 7 ? lerp(0.7, 0.95, (y - 4.2) / 4.2) : k === 12 || k === 13 ? 0.99 : 0) }), { pre: m, surf: S_CER, uv: true });
      china.add(tube([[-3.3, 13.2, 0], [-6.0, 13.8, 0], [-7.3, 10.5, 0], [-6.4, 6.8, 0], [-4.6, 5.4, 0]], 0.5, 20, 8), { pre: m, c: CREAM, surf: S_CER });
      china.add(new THREE.CircleGeometry(3.2, 20), { pre: m, p: [0, 13.2, 0], r: [-PI / 2, 0, 0], c: '#2a3a2c', surf: INT.surf(0, 0.95) });
      for (let i = 0; i < 26; i++) { const a = lr.range(0, TAU), y = lr.range(4.5, 11.5), r = y < 6 ? 4.85 : lerp(4.9, 3.6, (y - 6) / 5.5); addDrop(new V3(JUG[0] + Math.cos(a) * r, CY + y, JUG[1] + Math.sin(a) * r), new V3(Math.cos(a), 0.25, Math.sin(a)), lr.range(0.1, 0.24), lr.chance(0.25) ? lr.range(1.5, 3.5) : 0); }
      glints.push([JUG[0] + 2.5, CY + 11, JUG[1] + 3.2]);
    }

    await ctx.yield();
    // bowl of oranges and lemons
    const FB = [-64.5, -60];
    {
      const m = P(FB[0], CY, FB[1]);
      china.add(rev([[0.01, 0], [3, 0], [3.3, 0.6], [2.7, 1.1], [5.2, 2.5], [6.9, 3.6], [6.9, 3.6], [8.5, 5.3], [8.7, 5.6], [8.7, 5.6], [8.4, 5.6], [5, 2.9], [0.01, 1.9]], 48,
        { c: CREAM, px: (r, y, k) => (k >= 6 && k <= 8 ? lerp(0.76, 1, (y - 3.6) / 2) : 0) }), { pre: m, surf: S_CER, uv: true });
      const nF = lr.int(6, 8), fn = noise;
      for (let i = 0; i < nF; i++) {
        const top = i >= 5, a = (i / (top ? nF - 5 : 5)) * TAU + lr.range(-0.25, 0.25), rr = top ? (nF - 5 > 1 ? 1.9 : 0) : 4.5, lemon = lr.chance(0.4);
        const c = new V3(Math.cos(a) * rr, (top ? 8.0 : 4.7) + lr.range(-0.2, 0.3), Math.sin(a) * rr), R = lemon ? 1.75 : 2.3 + lr.range(-0.15, 0.15);
        const base = new THREE.Color(lemon ? '#f0d135' : '#ee8a1e').offsetHSL(lr.range(-0.012, 0.012), 0, lr.range(-0.03, 0.03));
        props.add(sph(R, 20, 14), { pre: m, p: [c.x, c.y, c.z], r: [lr.range(-0.5, 0.5), lr.range(0, TAU), lr.range(-0.5, 0.5)], s: lemon ? [1.45, 1, 1] : [1, 0.95, 1], c: base, surf: S_FRUIT,
          tint: (X, Y, Z, col) => { col.multiplyScalar(0.86 + 0.2 * fn.n3(X * 1.3, Y * 1.3, Z * 1.3) + 0.06 * fn.n3(X * 6, Y * 6, Z * 6)); } });
        props.add(sph(0.22, 6, 5), { pre: m, p: [c.x, c.y + R * 0.95, c.z], c: '#4a5a22', surf: S_MATTE });
        const wc = c.clone().applyMatrix4(m);
        for (let d = 0; d < 6; d++) { const n = new V3(lr.range(-1, 1), lr.range(0.35, 1), lr.range(-1, 1)).normalize(); addDrop(wc.clone().addScaledVector(n, R * 0.99), n, lr.range(0.1, 0.26)); }
      }
      glints.push([FB[0] - 5, CY + 6.2, FB[1] + 6.5]);
    }

    await ctx.yield();
    // butter dish with beads of dew
    const BD = [-101, -53];
    {
      const m = P(BD[0], CY, BD[1], lr.range(-0.5, 0.5));
      china.add(rev([[0.01, 0], [2.6, 0], [2.9, 0.25], [3.6, 0.8], [3.7, 1.0], [3.7, 1.0], [3.55, 1.05], [2.8, 0.6], [0.01, 0.5]], 40, { c: CREAM, px: (r, y, k) => (k >= 5 ? r / 3.7 : 0) }), { pre: m, s: [1.4, 1, 0.92], surf: S_CER, uv: true });
      const butter = '#f4d877', bs = INT.surf(0, 0.55, 0, 0.07);
      props.add(box(4.6, 1.9, 2.5), { pre: m, p: [-0.5, 1.5, 0], c: butter, surf: bs, grad: [CY + 0.5, CY + 2.6, 0.82, 1.06] });
      props.add(box(0.5, 1.9, 2.5), { pre: m, p: [2.6, 1.42, 0.1], r: [0, 0.1, -0.45], c: butter, surf: bs });
      props.add(box(0.45, 0.1, 5.2), { pre: m, p: [3.3, 1.25, 0.6], r: [0.05, 0.5, 0.25], c: '#e2e6ea', surf: S_CHROME });
      for (let i = 0; i < 24; i++) { const p = new V3(lr.range(-2.7, 1.7), 2.46, lr.range(-1.15, 1.15)).applyMatrix4(m); addDrop(p, _up, lr.range(0.09, 0.24)); }
      for (let i = 0; i < 12; i++) { const a = lr.range(0, TAU), p = new V3(Math.cos(a) * 3.2 * 1.4, 0.9, Math.sin(a) * 3.2 * 0.92).applyMatrix4(m); addDrop(p, _up, lr.range(0.1, 0.2)); }
      glints.push([BD[0] + 1, CY + 2.7, BD[1] + 1]);
    }

    await ctx.yield();
    // toast rack
    const RK = [-91, -99.5];
    {
      const m = P(RK[0], CY, RK[1], lr.range(-0.12, 0.12));
      const sh = new THREE.Shape(); sh.moveTo(-2.4, 0); sh.lineTo(-2.5, 3.4); sh.bezierCurveTo(-3.4, 3.8, -3.3, 5.6, -1.7, 5.9); sh.bezierCurveTo(-0.9, 6.5, 0.9, 6.5, 1.7, 5.9); sh.bezierCurveTo(3.3, 5.6, 3.4, 3.8, 2.5, 3.4); sh.lineTo(2.4, 0); sh.closePath();
      const tn = noise, cA = new THREE.Color('#e3bd80'), cB = new THREE.Color('#a8662a'), crust = new THREE.Color('#7b4a1f');
      const wire = (pts, r = 0.14, seg = 20) => props.add(tube(pts, r, seg, 6), { pre: m, c: '#dfe3e6', surf: S_CHROME });
      for (let i = 0; i <= nToast; i++) { const z = (i - nToast / 2) * 2.5; wire([[-3.1, 0.5, z], [-3.1, 3.6, z], [-2.4, 4.4, z], [2.4, 4.4, z], [3.1, 3.6, z], [3.1, 0.5, z]]); }
      const hz = nToast * 1.25 + 0.3;
      for (const sx of [-3.1, 3.1]) { wire([[sx, 0.5, -hz], [sx, 0.5, hz]], 0.16, 4); for (const sz of [-hz, hz]) props.add(sph(0.36, 8, 6), { pre: m, p: [sx, 0.36, sz], c: '#dfe3e6', surf: S_CHROME }); }
      wire([[0, 4.4, 0], [0, 7.0, 0]], 0.14, 3); props.add(new THREE.TorusGeometry(0.85, 0.14, 6, 16), { pre: m, p: [0, 7.7, 0], r: [0, PI / 2, 0], c: '#dfe3e6', surf: S_CHROME });
      for (let i = 0; i < nToast; i++) {
        const g = new THREE.ExtrudeGeometry(sh, { depth: 0.7, bevelEnabled: true, bevelThickness: 0.09, bevelSize: 0.09, bevelSegments: 1, curveSegments: 7 }); g.translate(0, 0, -0.35);
        const dark = lr.range(0.15, 0.85), sd = lr.range(0, 50);
        props.add(g, { pre: m, p: [lr.range(-0.2, 0.2), 0.62, (i - (nToast - 1) / 2) * 2.5 + lr.range(-0.3, 0.3)], r: [lr.range(-0.12, 0.12), 0, lr.range(-0.05, 0.05)], surf: INT.surf(0, 0.08),
          tint: (X, Y, Z, col, x, y, z) => {
            if (Math.abs(z) > 0.36) { const d = Math.hypot(x / 2.9, (y - 3.1) / 3.3), t = clamp(1.25 - d * 1.1 + 0.5 * tn.n3(x * 0.7 + sd, y * 0.7, z), 0, 1) * (0.5 + dark * 0.5); col.copy(cA).lerp(cB, t).multiplyScalar(0.92 + 0.16 * tn.n2(x * 5 + sd, y * 5)); }
            else col.copy(crust).multiplyScalar(0.85 + 0.3 * tn.n2(x * 2 + sd, y * 2));
          } });
      }
      glints.push([RK[0], CY + 7.9, RK[1]]);
    }
    await ctx.yield();

    // spoon and knife: long chrome ridges under the entry
    {
      const m = P(-80.5, CY, -51.5, 0.1 + lr.range(-0.08, 0.08)), chrome = '#e2e6ea';
      props.add(sph(1, 20, 12), { pre: m, p: [0, 0.5, -4.4], s: [1.75, 0.42, 2.5], c: chrome, surf: S_CHROME });
      props.add(tube([[0, 0.55, -2.4], [0, 0.95, -0.6], [0, 0.75, 2.5], [0, 0.42, 6.6]], 0.34, 14, 8), { pre: m, s: [1.5, 0.5, 1], c: chrome, surf: S_CHROME });
      props.add(sph(1, 14, 8), { pre: m, p: [0, 0.3, 6.8], s: [0.95, 0.2, 1.5], c: chrome, surf: S_CHROME });
      const k = P(-74.6, CY, -52, -0.07 + lr.range(-0.06, 0.06));
      props.add(box(1.5, 0.14, 7.4), { pre: k, p: [0, 0.2, -3.6], c: chrome, surf: S_CHROME });
      props.add(cyl(0.75, 0.01, 0.14, 12), { pre: k, p: [0, 0.2, -7.3], r: [0, 0, 0], s: [1, 1, 1.2], c: chrome, surf: S_CHROME });
      props.add(cyl(0.6, 0.66, 5.6, 12), { pre: k, p: [0, 0.48, 3.0], r: [PI / 2, 0, 0], s: [1.2, 1, 0.7], c: CREAM, surf: INT.surf(0, 0.6) });
      glints.push([-80.9, CY + 1.0, -55.8], [-74.4, CY + 0.4, -56]);
    }

    await ctx.yield();
    // sugar bowl, cubes and a spill of crystals (where the ants load up)
    const SG = [-57.5, -143.2];
    {
      const m = P(SG[0], CY, SG[1]);
      china.add(rev([[0.01, 0], [1.8, 0], [2.0, 0.2], [3.0, 1.6], [3.0, 1.6], [3.1, 3.4], [2.9, 4.0], [2.9, 4.0], [2.7, 3.9], [2.8, 1.8], [1.8, 0.6], [0.01, 0.5]], 36,
        { c: CREAM, px: (r, y, k) => (k >= 4 && k <= 6 ? lerp(0.76, 1, (y - 1.6) / 2.4) : 0) }), { pre: m, surf: S_CER, uv: true });
      const sug = INT.surf(0, 0.35, 0, 0.03);
      for (let i = 0; i < 10; i++) props.add(box(0.95, 0.95, 0.95), { pre: m, p: [lr.range(-1.5, 1.5), 3.3 + (i % 3) * 0.6 + lr.range(0, 0.3), lr.range(-1.5, 1.5)], r: [lr.range(0, 1), lr.range(0, 3), lr.range(0, 1)], c: '#e6dfd0', surf: sug });
      for (let i = 0; i < 26; i++) { const s = lr.range(0.18, 0.5); props.add(box(s, s, s), { p: [SG[0] - 3.5 + lr.range(-3.2, 2.2), CY + s * 0.5, SG[1] - 1.2 + lr.range(-2.2, 2.2)], r: [lr.range(0, 1), lr.range(0, 3), lr.range(0, 1)], c: '#e6dfd0', surf: sug }); }
    }

    await ctx.yield();
    // three jam jars, lit from behind like stained glass
    const JARS = [[-100.5, -90.5], [-104, -97.5], [-100.5, -104.5]].map((p) => [p[0] + lr.range(-0.8, 0.8), p[1] + lr.range(-0.8, 0.8)]);
    {
      const geos = [], capA = new THREE.Color('#f4ead2');
      JARS.forEach((jp, j) => {
        const g = rev([[0.01, 0], [2.0, 0], [2.3, 0.35], [2.3, 5.0], [2.05, 5.6], [1.85, 5.9], [1.85, 6.4], [0.01, 6.4]], 32, { c: jams[j][0] });
        const n = g.attributes.position.count, aH = new Float32Array(n); for (let i = 0; i < n; i++) aH[i] = g.attributes.position.getY(i) / 6.4;
        g.setAttribute('aH', new THREE.BufferAttribute(aH, 1)); g.translate(jp[0], CY, jp[1]); geos.push(g);
        const capB = new THREE.Color(j === 1 ? ging[0] : jams[j][0]).lerp(capA, 0.15);
        props.add(rev([[2.75, 5.2], [2.08, 6.0], [2.08, 6.6], [1.95, 6.78], [0.01, 6.78]], 36, { wobble: (th, y, k) => (k === 0 ? 0.07 * Math.sin(th * 9) : 0) }), { p: [jp[0], CY, jp[1]], surf: S_FAB,
          tint: (X, Y, Z, col, x, y, z) => { col.copy(((Math.floor(x / 0.55) + Math.floor(z / 0.55)) & 1) ? capA : capB); } });
        props.add(new THREE.TorusGeometry(2.12, 0.08, 5, 24), { p: [jp[0], CY + 6.02, jp[1]], r: [PI / 2, 0, 0], c: '#b89a6a', surf: S_MATTE });
        for (let i = 0; i < 9; i++) { const a = lr.range(0, TAU); addDrop(new V3(jp[0] + Math.cos(a) * 2.31, CY + lr.range(2.2, 5), jp[1] + Math.sin(a) * 2.31), new V3(Math.cos(a), 0.1, Math.sin(a)), lr.range(0.09, 0.2), lr.chance(0.4) ? lr.range(1, 2) : 0); }
      });
      const jm = new THREE.Mesh(mergeGeometries(geos), jamMaterial(L)); jm.name = 'jam'; scene.add(jm); geos.forEach((g) => g.dispose());
    }
    await ctx.yield();

    // ---------------------------------------------------------------- the dresser on the far wall (holds the exit plate)
    const DX = -66, DZ = -ROOM_L, DW = 124, PLATE_R = 9.4, PLATE_Y = 54.4 + PLATE_R + 0.25, PORTAL_Z = DZ + 5.4;
    const dresserStops = [];
    {
      const dr = rng.fork('dresser'), wood = '#a8733f', woodD = '#7a4c26', woodL = '#c08a4e', paint = vr.pick(['#7d9a84', '#8a9fb0', '#b9a98a']);
      const wb = (w, h, d, x, y, z, c = wood, sf = S_WOOD) => props.add(box(w, h, d), { p: [x, y, z], c, surf: sf });
      const round = (len, r, x, y, z, c = woodL, sf = S_WOOD) => props.add(cyl(r, r, len, 10), { p: [x, y, z], r: [0, 0, PI / 2], c, surf: sf });   // half-round moulding along x
      // raised, bevelled panel facing +z (a four-sided frustum)
      const panel = (w, h, d, x, y, z, c = wood, k = 0.84) => { const g = cyl(k, 1, d, 4); g.rotateY(PI / 4); g.rotateX(PI / 2); props.add(g, { p: [x, y, z], s: [w / 1.4142, h / 1.4142, 1], c, surf: S_WOOD }); };
      const knob = (x, y, z, r) => { props.add(sph(r, 10, 8), { p: [x, y, z], c: '#c9a148', surf: S_BRASS }); props.add(cyl(r * 0.5, r * 0.75, r, 8), { p: [x, y, z - r * 0.8], r: [PI / 2, 0, 0], c: '#c9a148', surf: S_BRASS }); };
      // base cupboard
      wb(DW, 50, 26, DX, 27, DZ + 13, woodD); wb(DW + 1.5, 4, 27.5, DX, 2, DZ + 13.75, woodD); round(DW + 1.5, 0.8, DX, 4.2, DZ + 27.2, wood);
      wb(DW + 5, 2.4, 29, DX, 53.2, DZ + 14.5, woodL, INT.surf(1, 0.62)); round(DW + 5, 1.2, DX, 53.2, DZ + 29, woodL, INT.surf(1, 0.62)); round(DW + 1, 0.55, DX, 51.3, DZ + 27.2, wood);
      for (let i = 0; i < 6; i++) {
        const x = DX + (i - 2.5) * 20;
        wb(18.2, 31.6, 0.8, x, 19.5, DZ + 26.3, wood); panel(17.4, 30.8, 0.8, x, 19.5, DZ + 27.0, woodL, 0.93); panel(11.6, 24.6, 0.9, x, 19.5, DZ + 27.6, wood, 0.8);
        wb(18.2, 10, 0.8, x, 43.5, DZ + 26.3, wood); panel(17.4, 9.2, 1.1, x, 43.5, DZ + 27.1, woodL, 0.86);
        knob(x, 43.5, DZ + 28.5, 0.95); knob(x + (i % 2 ? -7.2 : 7.2), 22, DZ + 28.0, 0.8);
        if (i) wb(1.6, 44, 1.2, x - 10, 28, DZ + 26.6, woodD);                                            // stiles between the doors
      }
      await ctx.yield();
      // upper rack: painted boards behind, wooden cheeks, shelves with rounded noses
      for (const sx of [-1, 1]) { wb(2.6, 68, 15, DX + sx * (DW / 2 - 1.3), 88.4, DZ + 7.5); wb(3.4, 1.2, 15.6, DX + sx * (DW / 2 - 1.3), 55.0, DZ + 7.8, woodL); }
      wb(DW, 68, 1, DX, 88.4, DZ + 2.6, paint, S_SOFT);
      for (let i = -15; i <= 15; i++) wb(0.3, 68, 0.3, DX + i * 4, 88.4, DZ + 3.15, new THREE.Color(paint).multiplyScalar(0.62), S_MATTE);   // tongue-and-groove
      const glowS = INT.surf(0, 0.2, 0, 1.3);
      for (const sy of [76.8, 98.8]) {
        wb(DW - 5, 1.6, 14, DX, sy, DZ + 7); round(DW - 5, 0.8, DX, sy, DZ + 14, woodL); wb(DW - 5, 1.1, 0.5, DX, sy - 1.3, DZ + 13.6, woodD);
        wb(DW - 6, 0.45, 0.25, DX, sy + 1.0, DZ + 9.5, woodD);                                             // plate stop
        wb(DW - 8, 0.22, 0.7, DX, sy - 0.95, DZ + 3.9, '#ffcf8a', glowS);                                  // warm light spilling from under the shelf
      }
      wb(DW - 8, 0.22, 0.7, DX, 120.2, DZ + 3.9, '#ffcf8a', glowS);
      // turned posts at the front corners of the rack
      for (const sx of [-1, 1]) {
        const prof = [[0.9, 0], [1.5, 0], [1.5, 2.2], [0.9, 2.8]];
        for (let y = 4; y < 62; y += 9.6) prof.push([0.7, y], [1.25, y + 2.2], [1.4, y + 4.4], [1.0, y + 6.6], [0.62, y + 7.6], [1.05, y + 8.2], [1.05, y + 8.9]);
        prof.push([0.9, 62.8], [1.5, 63.6], [1.5, 66]);
        props.add(rev(prof, 12, { c: woodL }), { p: [DX + sx * (DW / 2 - 1.6), 54.9, DZ + 13.2], surf: INT.surf(1, 0.6) });
      }
      await ctx.yield();
      // cornice: frieze, dentils, cove and a bevelled crown
      wb(DW + 1, 3.2, 15.6, DX, 121.9, DZ + 7.8, wood); round(DW + 1, 0.6, DX, 120.6, DZ + 15.6, woodL);
      for (let i = -15; i <= 15; i++) wb(2.0, 1.5, 1.4, DX + i * 4, 124.0, DZ + 15.7, woodL);
      wb(DW + 3, 1.2, 17.6, DX, 125.3, DZ + 8.8, wood); round(DW + 3, 1.6, DX, 126.6, DZ + 17.2, woodL);
      wb(DW + 7, 2.6, 19.4, DX, 128.6, DZ + 9.7, woodL); round(DW + 7, 1.3, DX, 128.6, DZ + 19.4, woodL, INT.surf(1, 0.62));
      const S_PLATE = INT.surf(0, 0.9);
      const plateAt = (x, yBase, R, lean) => {
        const m = new THREE.Matrix4().makeRotationX(PI / 2 - lean).setPosition(x, yBase + R * Math.cos(lean) + 0.1, DZ + 4.5 + R * Math.sin(lean));
        china.add(rev([[0.01, 0], [0.5 * R, 0], [0.62 * R, 0.04 * R], [R, 0.2 * R], [R, 0.2 * R], [0.985 * R, 0.225 * R], [0.68 * R, 0.14 * R], [0.61 * R, 0.085 * R], [0.53 * R, 0.05 * R], [0.01, 0.042 * R]], 48,
          { c: CREAM, px: (r, y, k) => (k >= 4 ? r / R : 0) }), { m, surf: S_PLATE, uv: true });
      };
      const smallJug = (x, yBase, h, z = DZ + 8) => {
        const k = h / 15, m = P(x, yBase, z, dr.range(0, TAU));
        china.add(rev([[0.01, 0], [3.4 * k, 0], [4.6 * k, 3 * k], [4.8 * k, 4.2 * k], [4.8 * k, 4.2 * k], [4.9 * k, 6 * k], [4.55 * k, 8.4 * k], [4.55 * k, 8.4 * k], [3.3 * k, 12.5 * k], [3.95 * k, 15 * k], [3.6 * k, 14.8 * k], [0.01, 13 * k]], 32,
          { c: CREAM, px: (r, y, kk) => (kk >= 4 && kk <= 6 ? lerp(0.7, 0.95, (y - 4.2 * k) / (4.2 * k)) : 0) }), { pre: m, surf: S_CER, uv: true });
        china.add(tube([[-3.3 * k, 13.2 * k, 0], [-6.0 * k, 13.8 * k, 0], [-7.3 * k, 10.5 * k, 0], [-6.4 * k, 6.8 * k, 0], [-4.6 * k, 5.4 * k, 0]], 0.5 * k, 14, 6), { pre: m, c: CREAM, surf: S_CER });
      };
      // the exit plate: 19 m across, its well is the portal; bold cobalt rim with two gilt lines
      {
        const R = PLATE_R, W = 7.15, m = new THREE.Matrix4().makeRotationX(PI / 2).setPosition(DX, PLATE_Y, PORTAL_Z - 1.0), rimC = '#' + new THREE.Color(chinaBlue).offsetHSL(0, 0.35, 0).getHexString();   // saturated: the portal's halo washes over the rim
        for (let i = 0; i < 30; i++) { const a = (i / 30) * TAU; props.add(sph(0.24, 8, 6), { p: [DX + Math.cos(a) * 8.45, PLATE_Y + Math.sin(a) * 8.45, PORTAL_Z + 0.36], s: [1, 1, 0.3], c: '#efe6d0', surf: S_CER }); }
        china.add(rev([[W - 0.6, -0.6], [W + 0.2, -0.6], [W + 0.6, -0.1], [R, 1.5], [R, 1.5, rimC], [R - 0.15, 1.7, rimC], [W + 0.5, 0.95, rimC], [W + 0.1, 0.6, rimC], [W + 0.1, 0.6], [W, 0.45], [W - 0.25, 0.4]], 72,
          { c: CREAM }), { m, surf: INT.surf(0, 0.9, 0, 0.85), uv: true });        // a little self-glow keeps the cobalt blue inside the portal's halo
        const gilt = INT.surf(0, 0.85, 1, 0.25);
        props.add(new THREE.TorusGeometry(W + 0.75, 0.12, 6, 72), { p: [DX, PLATE_Y, PORTAL_Z + 0.05], c: '#e0b04a', surf: gilt });
        props.add(new THREE.TorusGeometry(R - 0.1, 0.13, 6, 72), { p: [DX, PLATE_Y, PORTAL_Z + 0.62], c: '#e0b04a', surf: gilt });
        glints.push([DX - R * 0.66, PLATE_Y + R * 0.66, PORTAL_Z + 0.9], [DX + R * 0.74, PLATE_Y - R * 0.5, PORTAL_Z + 0.9], [DX + R * 0.3, PLATE_Y + R * 0.9, PORTAL_Z + 0.9]);
      }
      await ctx.yield();
      for (const off of [-43, -22.5, 22.5, 43]) plateAt(DX + off, 54.4, Math.abs(off) > 30 ? 7.0 : 7.5, 0.13);
      const rowA = dr.shuffle(['plate', 'plate', 'jug', 'plate', 'plate']), rowB = dr.shuffle(['jug', 'plate', 'plate', 'jug', 'plate']);
      rowA.forEach((kind, i) => { const x = DX + (i - 2) * 22 + dr.range(-1.5, 1.5); if (kind === 'plate') plateAt(x, 77.6, dr.range(7.2, 8.6), 0.12); else smallJug(x, 77.6, dr.range(10, 13)); });
      await ctx.yield();
      rowB.forEach((kind, i) => { const x = DX + (i - 2) * 22 + dr.range(-1.5, 1.5); if (kind === 'plate') plateAt(x, 99.6, dr.range(6.5, 8), 0.12); else smallJug(x, 99.6, dr.range(9, 12)); });
      await ctx.yield();
      // cups hanging from brass hooks under the shelves: they swing
      for (const [under, offs] of [[76, [-52.5, -31.5, -11.5, 11.5, 31.5, 52.5]], [98, [-44, -22, 0, 22, 44]]]) for (const off of offs) {
        if (dr.chance(0.12) && Math.abs(off) > 12) continue;
        const x = DX + off, z = DZ + 12.4, y = under - 4.6;
        const m = new THREE.Matrix4().makeRotationZ(PI / 2).premultiply(new THREE.Matrix4().makeRotationY(off > 0 ? 0.25 : PI - 0.25)).setPosition(x, y, z);
        cupBody(m, 0, false, [y - 3, under - 0.5, 1, 0]);
        props.add(new THREE.TorusGeometry(0.55, 0.11, 5, 10, PI * 1.5), { p: [x, under - 0.6, z], r: [0, PI / 2, 0], c: '#c9a148', surf: S_BRASS });
      }
      await ctx.yield();
      // foreground on the counter either side of the approach: a steaming jug and a bowl of eggs
      {
        const jx = DX - 14.5, jz = DZ + 19; smallJug(jx, 54.4, 12.5, jz);
        puffs(new V3(jx, 54.4 + 12.2, jz), [0.35, 1.5, 0.25], 14, 8, 1.2, 4.6, 0.3, 1.2, 0.8);
        glints.push([jx + 1.5, 54.4 + 9.5, jz + 3.2]);
        const bx = DX + 15, bz = DZ + 18.5, bm = P(bx, 54.4, bz);
        china.add(rev([[0.01, 0], [2.6, 0], [2.9, 0.3], [4.6, 2.2], [4.6, 2.2], [5.6, 4.3], [5.75, 4.6], [5.75, 4.6], [5.5, 4.55], [4.3, 2.4], [2.6, 0.8], [0.01, 0.7]], 40,
          { c: CREAM, px: (r, y, k) => (k >= 4 && k <= 6 ? lerp(0.76, 1, (y - 2.2) / 2.4) : 0) }), { pre: bm, surf: S_CER, uv: true });
        for (let i = 0; i < 7; i++) { const a = (i / 6) * TAU, rr = i < 6 ? 2.7 : 0;
          props.add(sph(1, 14, 10), { pre: bm, p: [Math.cos(a) * rr, i < 6 ? 3.6 : 5.0, Math.sin(a) * rr], r: [dr.range(-0.6, 0.6), dr.range(0, TAU), 0.9], s: [1.25, 1.65, 1.25], c: dr.pick(['#d9b48c', '#c99a6c', '#e6d3b8', '#b98558']), surf: INT.surf(0, 0.35) }); }
        dresserStops.push(new V3(jx - 7, 70, jz + 3), new V3(DX - 30, 66, DZ + 20), new V3(DX - 21, 85, DZ + 16), new V3(DX - 40, 74, DZ + 22));
      }
      glints.push([DX - 22.5, 54.4 + 13.5, DZ + 7], [DX + 22.5, 54.4 + 13.2, DZ + 7], [DX + 2, 77.6 + 14, DZ + 7]);
      for (let i = 0; i < 6; i++) glints.push([DX + (i - 2.5) * 20, 43.9, DZ + 29.6]);
      for (const off of [-31.5, -11.5, 11.5, 31.5]) glints.push([DX + off + 1.5, 73.2, DZ + 14.2]);
      rig.addLight({ position: [DX - 45, 110, DZ + 60], color: '#ffd9a6', intensity: 8, range: 135 });     // raking key across plates and shelves
      rig.addLight({ position: [DX + 40, 64, DZ + 36], color: '#ffc38a', intensity: 3.2, range: 75 });      // low warm fill from the right
    }

    await ctx.yield();
    // sink under the middle window with a dripping tap
    const SZ = -ROOM_L / 2, TAP = new V3(-174.5, 67.2, SZ);
    {
      props.add(box(27, 3.2, 36), { p: [-172.5, 55.2, SZ], c: '#f1ece0', surf: S_CER });
      props.add(box(22, 0.5, 30), { p: [-172.5, 57.0, SZ], c: '#7f9a9c', surf: INT.surf(0, 0.97) });
      props.add(tube([[-186.5, 55, SZ], [-186.5, 66, SZ], [-184.5, 70.2, SZ], [-178, 70.8, SZ], [-174.5, 68.4, SZ]], 0.95, 20, 8), { c: '#c9a148', surf: S_BRASS });
      props.add(cyl(1.5, 1.8, 2.2, 10), { p: [-186.5, 56, SZ], c: '#c9a148', surf: S_BRASS });
      glints.push([-180, 71.6, SZ + 1]);
    }
    await ctx.yield();

    // ---------------------------------------------------------------- hero: the Honey Fall
    const HC = [-84, -119], heroYaw = -PI / 4;
    const heroStd = (p) => {
      const m = INT.interiorMaterial({ rig, vertexColors: true, surf: INT.surf(0, clamp(1.02 - (p.roughness ?? 0.5), 0, 1), p.metalness ?? 0) });
      if (p.emissive) { m.emissive.copy(p.emissive); m.emissiveIntensity = p.emissiveIntensity ?? 1; }
      return m;
    };
    const hero = await buildHero(ctx, {
      palette: PALETTE, chinaBlue, standardMaterial: heroStd, progress: 0.15,
      lightDir: sunDir.clone(),                                    // the honey shaders light in world space
      lightColor: new THREE.Color(sunColor).lerp(new THREE.Color('#ffb030'), 0.5).multiplyScalar(1.5),
      ambient: new THREE.Color().setRGB(L.uAmb.value.x, L.uAmb.value.y, L.uAmb.value.z).multiplyScalar(0.6),
    });
    hero.object.position.set(HC[0], CY, HC[1]); hero.object.rotation.y = heroYaw; scene.add(hero.object); hero.object.updateMatrixWorld(true);
    const hw = (v) => v.clone().applyMatrix4(hero.object.matrixWorld);
    const heroLook = hw(hero.anchors.lookAt), fly = hero.anchors.flyThrough.map(hw), fy = fly[4].y;
    // widen the front of the orbit to 14 m and lift it so one frame holds jar, rope and stack
    const flyW = fly.map((p, k) => { const s = k < 3 ? 1 : lerp(14, 12.4, clamp((k - 6) / 4, 0, 1)) / 12; return new V3(heroLook.x + (p.x - heroLook.x) * s + (k >= 6 ? 1.5 : 0), p.y + (k < 3 ? 0 : 1.3), heroLook.z + (p.z - heroLook.z) * s); });
    const heroAim = heroLook.clone(); heroAim.y += 1.6;
    { const sa = hero.anchors.steamAcross, a = hw(sa.from), b = hw(sa.to), life = 11;
      puffs(a, [(b.x - a.x) / life, (b.y - a.y) / life + 0.12, (b.z - a.z) / life], 12, life, 2.6, 6.0, 0.1, 1.1, 1.5); }   // thin: back-lit it must not wash the rope or the jug behind
    await ctx.yield();

    // ---------------------------------------------------------------- the flight
    const A = (v) => [v.x, v.y, v.z];
    const pts = [
      [-86, CY + 4.3, -30], [-87.5, CY + 4.3, -43], [-89.5, CY + 4.6, -55], [-85, CY + 5.2, -66], [-90.8, CY + 6.9, -79],
      [-88.5, CY + 9.6, -90], [-84, CY + 12.2, -99.5], [-78, CY + 12.6, -106], [-68.5, CY + 11.8, -109.5], [-60.5, fy + 0.4, -117],
      [-61, fy + 0.2, -128], [-67.5, fy, -137], [-77, fy, -138.5], [-85.5, fy, -135],
      ...flyW.slice(2, 10).map(A),
      [-70.5, fy, -111.5], [-64.5, fy - 0.4, -121], [-63.5, CY + 10, -134], [-64, CY + 12, -147], [-63, CY + 15, -168],
      [-58, PLATE_Y - 2.5, -190], [-61.5, PLATE_Y - 0.6, -210], [DX, PLATE_Y, -238], [DX, PLATE_Y, PORTAL_Z],
    ];
    const path = makePath(pts);
    const lens = path.curve.getLengths(), uAt = (i) => lens[Math.round((i / (pts.length - 1)) * (lens.length - 1))] / path.length;
    const U = { tea: uAt(4), rack: uAt(6), pass: uAt(9), hook: uAt(10), join: uAt(13), orbit0: uAt(14), orbit1: uAt(21), leave: uAt(24), edge: uAt(25), level: uAt(28) };

    // ---------------------------------------------------------------- wildflowers in the jug (stems like trees, daisies 3 m across)
    const flora = INT.makeBuilder(), heads = [], fr = rng.fork('flowers');
    {
      const petal = (len, w, cup, x0) => {
        const prof = [[0, 0.3], [0.35, 0.85], [0.72, 1.0], [1, 0.4]], pos = [], idx = [];
        prof.forEach(([t, k], i) => { const x = x0 + t * len, y = cup * t * t * len, hw = w * 0.5 * k; pos.push(x, y + hw * 0.25, -hw, x, y, 0, x, y + hw * 0.25, hw);
          if (i < 3) { const a = i * 3; idx.push(a, a + 1, a + 3, a + 1, a + 4, a + 3, a + 1, a + 2, a + 4, a + 2, a + 5, a + 4); } });
        const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); return g;
      };
      const KIND = {
        daisy: { n: 22, len: 1.2, w: 0.4, cup: 0.1, a: '#fff8ec', b: '#ffefd6', cr: 0.5, cc: '#f2b414' },
        cornflower: { n: 14, len: 0.9, w: 0.55, cup: 0.4, a: '#4468d6', b: '#6a84ea', cr: 0.32, cc: '#2b2a70' },
        poppy: { n: 6, len: 1.25, w: 1.7, cup: 0.5, a: '#d8301c', b: '#e4472a', cr: 0.36, cc: '#191812' },
        buttercup: { n: 5, len: 0.8, w: 0.95, cup: 0.55, a: '#ffc21a', b: '#ffd648', cr: 0.24, cc: '#b97f0c' },
      };
      const headGeo = (K) => {
        const b = INT.makeBuilder();
        for (let i = 0; i < K.n; i++) b.add(petal(K.len * fr.range(0.85, 1.08), K.w, K.cup * fr.range(0.5, 1.5), K.cr * 0.6), { r: [0, (i / K.n) * TAU + fr.range(-0.07, 0.07), 0], c: i % 2 ? K.a : K.b });
        b.add(sph(K.cr, 12, 8), { p: [0, K.cr * 0.15, 0], s: [1, 0.6, 1], c: K.cc });
        return b.build();
      };
      const extra = vr.pick(['cornflower', 'poppy', 'buttercup']), jx = JUG[0], jz = JUG[1], jy = CY + 15, ramp = [jy, jy + 14, 0.05, 1];
      const petalSurf = INT.surf(0, 0.14, 0, 0.14), stemSurf = INT.surf(0, 0.25), a0 = fr.range(0, TAU);
      for (let i = 0; i < nStems; i++) {
        const kind = i % 4 === 3 ? extra : 'daisy', K = KIND[kind];
        const a = a0 + (i / nStems) * TAU + fr.range(-0.2, 0.2), R = fr.range(2.5, 9.5), H = fr.range(6.5, 15) * (kind === 'daisy' ? 1 : 0.85);
        const ca = Math.cos(a), sa = Math.sin(a), hp = new V3(jx + ca * R, jy + H, jz + sa * R);
        if (path.distanceTo(hp.x, hp.y, hp.z) < 7.5) continue;
        const nrm = new V3(ca * 0.55 - 0.25, 1, sa * 0.55).normalize();
        const s1 = [jx + ca * 2.2, jy + 0.4, jz + sa * 2.2], s2 = [jx + ca * R * 0.62, jy + H * 0.62, jz + sa * R * 0.62];
        flora.add(tube([[jx + ca, jy - 6, jz + sa], s1, s2, [hp.x - nrm.x * 0.2, hp.y - 0.25, hp.z - nrm.z * 0.2]], 0.17, 14, 5), { c: '#5c8f33', surf: stemSurf, sway: ramp, grad: [jy, jy + 16, 0.75, 1.1] });
        const hg = headGeo(K), sc = kind === 'daisy' ? fr.range(1.0, 1.2) : 1;
        flora.add(hg, { m: new THREE.Matrix4().compose(hp, _q.setFromUnitVectors(_up, nrm), new V3(sc, sc, sc)), surf: petalSurf, sway: ramp }); hg.dispose();
        for (let l = 0; l < 2; l++) { const t = fr.range(0.15, 0.8); flora.add(petal(fr.range(2.0, 3.0), 0.85, 0.22, 0), { p: [lerp(s1[0], s2[0], t), lerp(s1[1], s2[1], t), lerp(s1[2], s2[2], t)], r: [0, fr.range(0, TAU), fr.range(0.3, 0.7)], c: '#4f8a2e', surf: stemSurf, sway: ramp }); }
        heads.push({ p: hp, n: nrm });
        await ctx.yield();
      }
      for (let i = 0; i < 6; i++) {                                 // grasses
        const a = fr.range(0, TAU), R = fr.range(5, 10), H = fr.range(8, 16), ca = Math.cos(a), sa = Math.sin(a);
        if (path.distanceTo(jx + ca * R, jy + H * 0.8, jz + sa * R) < 7) continue;
        flora.add(tube([[jx + ca, jy - 5, jz + sa], [jx + ca * 2, jy + 1, jz + sa * 2], [jx + ca * R * 0.5, jy + H * 0.85, jz + sa * R * 0.5], [jx + ca * R, jy + H * 0.8, jz + sa * R]], 0.08, 12, 4), { c: '#86a84c', surf: stemSurf, sway: ramp });
        flora.add(sph(0.22, 6, 5), { p: [jx + ca * R, jy + H * 0.8, jz + sa * R], s: [1, 1, 2.4], r: [0, -a + PI / 2, 0], c: '#c9b56a', surf: stemSurf, sway: ramp });
      }
    }
    await ctx.yield();

    // merged meshes
    const chinaMesh = new THREE.Mesh(china.build(), chinaMat); chinaMesh.name = 'china'; scene.add(chinaMesh);
    await ctx.yield();
    const propsMesh = new THREE.Mesh(props.build(), propMat); propsMesh.name = 'props'; scene.add(propsMesh);
    await ctx.yield();
    const floraMesh = new THREE.Mesh(flora.build(), floraMat); floraMesh.name = 'flowers'; scene.add(floraMesh);
    await ctx.yield();

    // ---------------------------------------------------------------- dew drops
    {
      const g = sph(1, 10, 7), n = drops.length, dm = new THREE.InstancedMesh(g, dropMaterial(L), n), ad = new Float32Array(n * 4), m = new THREE.Matrix4(), sc = new V3();
      drops.forEach((d, i) => { m.compose(d.p, _q.setFromUnitVectors(_up, d.n), sc.set(d.s, d.s * 0.62, d.s)); dm.setMatrixAt(i, m); ad.set([lr(), d.run, 0, 0], i * 4); });
      g.setAttribute('aDrop', new THREE.InstancedBufferAttribute(ad, 4)); dm.frustumCulled = false; dm.name = 'dew'; scene.add(dm);
    }

    await ctx.yield();
    // ---------------------------------------------------------------- bumblebees working the flowers
    const bees = [], br = rng.fork('bees'); let escort;
    {
      const b = INT.makeBuilder(), yel = '#f0b21a', blk = '#17120e';
      b.add(sph(1, 16, 12), { p: [0, 0, -0.34], s: [0.3, 0.29, 0.46], surf: S_FUZZ, tint: (X, Y, Z, col) => { const t = (Z + 0.8) / 0.92; col.set(t < 0.13 ? '#cfc6ae' : t < 0.4 ? blk : t < 0.7 ? yel : blk); } });
      b.add(sph(0.3, 14, 10), { p: [0, 0.03, 0.2], surf: S_FUZZ, tint: (X, Y, Z, col) => { col.set(Math.abs(Z - 0.2) < 0.09 ? blk : yel); } });
      b.add(sph(0.19, 10, 8), { p: [0, -0.02, 0.56], c: blk, surf: INT.surf(0, 0.5) });
      for (const sx of [-1, 1]) {
        b.add(sph(0.08, 8, 6), { p: [sx * 0.13, 0.02, 0.64], c: '#0a0a0c', surf: INT.surf(0, 0.95) });
        b.add(tube([[sx * 0.06, 0.1, 0.66], [sx * 0.12, 0.24, 0.8], [sx * 0.16, 0.2, 0.95]], 0.018, 6, 4), { c: blk, surf: S_MATTE });
        for (let i = 0; i < 3; i++) b.add(tube([[sx * 0.2, -0.15, 0.3 - i * 0.22], [sx * 0.38, -0.36, 0.26 - i * 0.24], [sx * 0.3, -0.62, 0.1 - i * 0.3]], 0.018, 6, 4), { c: blk, surf: S_MATTE });
      }
      const beeGeo = b.build(), blades = [];
      for (const sx of [-1, 1]) for (const [ang, len, zo] of [[-0.3, 1.0, 0.2], [0.2, 1.0, 0.2], [0.7, 1.0, 0.2], [-0.1, 0.7, 0.02], [0.5, 0.7, 0.02]]) {
        const w = new THREE.CircleGeometry(1, 10); w.rotateX(-PI / 2); w.scale(0.5 * len, 1, 0.21 * len); w.translate(0.5 * len, 0, 0); w.rotateZ(ang); w.scale(sx, 1, 1); w.translate(sx * 0.1, 0.27, zo); blades.push(w);
      }
      const wingGeo = mergeGeometries(blades); blades.forEach((w) => w.dispose());
      const wingMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(1.5, 1.4, 1.15), transparent: true, opacity: 0.2, depthWrite: false, side: THREE.DoubleSide });
      const hover = heads.filter((h) => path.distanceTo(h.p.x, h.p.y, h.p.z) > 8.5).map((h) => h.p.clone().addScaledVector(h.n, 1.25));
      while (hover.length < 3) hover.push(new V3(JUG[0] + br.range(-5, 5), CY + 24 + br.range(-3, 5), JUG[1] + br.range(-5, 5)));
      for (let i = 0; i < nBees; i++) {
        const grp = new THREE.Group(), body = new THREE.Mesh(beeGeo, propMat), wings = new THREE.Mesh(wingGeo, wingMat);
        grp.add(body, wings); grp.scale.setScalar(1.15); scene.add(grp);
        const stops = br.shuffle(hover.slice()).slice(0, br.int(3, Math.min(5, hover.length)));
        if (i === 0) { const ex = new V3(JUG[0] + 6, CY + 24, JUG[1] + 6); if (path.distanceTo(ex.x, ex.y, ex.z) > 8) stops.push(ex); }   // a live subject between jug and hero
        bees.push({ grp, wings, stops, dwell: br.range(2.6, 4.2), hop: br.range(1.5, 2.2), phase: br.range(0, 5), ph: br.range(0, 9) });
      }
      { const grp = new THREE.Group(), wings = new THREE.Mesh(wingGeo, wingMat); grp.add(new THREE.Mesh(beeGeo, propMat), wings); grp.scale.setScalar(1.15); scene.add(grp);
        bees.push({ grp, wings, stops: dresserStops, dwell: 2.2, hop: 2.4, phase: br.range(0, 5), ph: br.range(0, 9) }); }
      // one more bee waits by the honey jar and escorts the camera across the gap to the dresser
      const eg = new THREE.Group(), ew = new THREE.Mesh(wingGeo, wingMat); eg.add(new THREE.Mesh(beeGeo, propMat), ew); eg.scale.setScalar(1.15); scene.add(eg);
      escort = { grp: eg, wings: ew, jar: hw(hero.anchors.jar), ph: br.range(0, 9) };
    }
    const _bp = new V3(), _bn = new V3(), _e1 = new V3(), _e2 = new V3();
    const beePos = (bee, time, out) => {
      const T = bee.dwell + bee.hop, n = bee.stops.length, tt = time / T + bee.phase, i = Math.floor(tt) % n, f = (tt - Math.floor(tt)) * T, a = bee.stops[i], b = bee.stops[(i + 1) % n];
      const k = f < bee.dwell ? 0 : smoothstep(0, 1, (f - bee.dwell) / bee.hop);
      bee.near = k < 0.5 ? i : (i + 1) % n;
      out.lerpVectors(a, b, k); out.y += Math.sin(k * PI) * 1.8;
      out.x += 0.28 * Math.sin(time * 2.3 + bee.ph) + 0.1 * Math.sin(time * 7.1 + bee.ph); out.y += 0.2 * Math.sin(time * 3.1 + bee.ph * 2) + 0.07 * Math.sin(time * 9.3); out.z += 0.28 * Math.cos(time * 1.9 + bee.ph);
      return k;
    };

    await ctx.yield();
    // ---------------------------------------------------------------- ants carrying sugar along the far edge
    let ants; const antTrack = [], NS = 220, ar = rng.fork('ants'), antJit = [];
    {
      const b = INT.makeBuilder(), ink = '#2a130c';
      b.add(sph(1, 10, 8), { p: [0, 0.24, -0.24], s: [0.15, 0.13, 0.22], c: ink, surf: INT.surf(0, 0.7) });
      b.add(sph(1, 8, 6), { p: [0, 0.22, 0.02], s: [0.09, 0.085, 0.13], c: '#4a2012', surf: INT.surf(0, 0.6) });
      b.add(sph(1, 8, 6), { p: [0, 0.25, 0.22], s: [0.1, 0.09, 0.1], c: ink, surf: INT.surf(0, 0.7) });
      for (let i = 0; i < 3; i++) for (const sx of [-1, 1]) b.add(tube([[sx * 0.05, 0.2, 0.08 - i * 0.07], [sx * 0.22, 0.3, 0.16 - i * 0.16], [sx * 0.34, 0, 0.22 - i * 0.24]], 0.014, 5, 3), { c: ink, surf: S_MATTE });
      for (const sx of [-1, 1]) b.add(tube([[sx * 0.04, 0.3, 0.28], [sx * 0.1, 0.42, 0.4], [sx * 0.16, 0.36, 0.52]], 0.01, 4, 3), { c: ink, surf: S_MATTE });
      b.add(box(0.27, 0.27, 0.27), { p: [0, 0.54, 0.34], r: [0.5, 0.6, 0.3], c: '#fffaf0', surf: INT.surf(0, 0.6, 0, 0.45) });
      ants = new THREE.InstancedMesh(b.build(), propMat, nAnts); ants.frustumCulled = false; ants.name = 'ants'; scene.add(ants);
      const cp = [new V3(SG[0] - 3.2, CY, SG[1] - 0.8), new V3(-66, CY, -144.9)];
      for (let x = -72; x >= -102; x -= 6) cp.push(new V3(x, CY, -144.6 + ar.range(-0.9, 0.9)));
      cp.push(new V3(-107.2, CY, -142.5), new V3(-108.6, CY, -137.5), new V3(-108.2, CY, -133.5));
      const crv = new THREE.CatmullRomCurve3(cp);
      for (let i = 0; i <= NS; i++) antTrack.push(crv.getPointAt(i / NS));
      for (let i = 0; i < nAnts; i++) antJit.push([ar.range(-0.3, 0.3), ar.range(-0.25, 0.25) / nAnts * 6, ar.range(0, 9), ar.range(0.85, 1.15)]);
    }
    const _am = new THREE.Matrix4(), _as = new V3(), _ap = new V3(), _at = new V3(), _ae = new THREE.Euler();
    const updateAnts = (time) => {
      for (let i = 0; i < nAnts; i++) {
        const j = antJit[i]; let s = (i / nAnts + j[1] + time * 0.011) % 1; if (s < 0) s += 1;
        const f = s * NS, i0 = Math.min(NS - 1, Math.floor(f)), a = antTrack[i0], b = antTrack[i0 + 1];
        _ap.lerpVectors(a, b, f - i0); _at.subVectors(b, a).normalize();
        _ap.x += -_at.z * j[0]; _ap.z += _at.x * j[0]; _ap.y += Math.abs(Math.sin(time * 13 + j[2])) * 0.035;
        const sc = j[3] * smoothstep(0, 0.035, s) * (1 - smoothstep(0.965, 1, s));
        _ae.set(0, Math.atan2(_at.x, _at.z) + 0.14 * Math.sin(time * 9 + j[2]), 0.06 * Math.sin(time * 13 + j[2]));
        _am.compose(_ap, _q.setFromEuler(_ae), _as.set(sc, sc, sc)); ants.setMatrixAt(i, _am);
      }
      ants.instanceMatrix.needsUpdate = true;
    };
    updateAnts(0);

    await ctx.yield();
    // ---------------------------------------------------------------- steam, glints, flour dust, the tap's drip
    const steam = makeSteam(L, steamList); scene.add(steam.mesh);
    const glow = fx.makeGlows({ time: L.uTime, positions: glints, color: '#fff3d6', size: 2.6, sizeJitter: 0.5, intensity: 1.5, flicker: 0.55, spikes: 0.6, halo: 0.6, rng: rng.fork('glints') });
    scene.add(glow.object);
    await ctx.yield();
    const dust = fx.makeParticles({ rng: rng.fork('dust'), preset: 'dust', time: L.uTime, count: 1700, box: [64, 38, 64], size: [0.05, 0.17], intensity: 1.0, opacity: 0.5 });
    scene.add(dust.object);
    await ctx.yield();
    const drip = new THREE.Mesh(sph(0.6, 10, 8), INT.interiorMaterial({ rig, color: '#eaf6ff', surf: INT.surf(0, 0.97, 0, 1.6) })); drip.name = 'drip'; scene.add(drip);
    const portalLook = new V3(DX, PLATE_Y, PORTAL_Z);
    await ctx.yield();

    return {
      scene, path, duration: 46,
      pace: (u) => 1 + 0.3 * smoothstep(U.edge - 0.03, U.edge + 0.03, u) * (1 - smoothstep(0.74, 0.84, u)),   // a little quicker across the gap to the dresser
      camera: { fov: 55, near: 0.1, far: 1400, lookAhead: 12, sway: 0.5, bank: 0.4 },
      pois: [
        { at: [spout.x, spout.y + 5, spout.z], from: 0.01, to: U.tea, weight: 0.35 },
        { at: [JARS[1][0], CY + 3, JARS[1][1]], from: U.tea - 0.06, to: U.rack + 0.01, weight: 0.6 },
        { at: heroLook, from: U.rack - 0.005, to: U.hook + 0.012, weight: 0.85 },
        { at: [JUG[0] + 3, CY + 25, JUG[1] + 1], from: U.hook - 0.012, to: U.join - 0.02, weight: 0.7 },
        { at: heroAim, from: U.join - 0.06, to: U.leave, weight: 0.9 },
        { at: [-52, 22, -236], from: U.edge - 0.05, to: U.edge + 0.06, weight: 0.28 },
        { at: portalLook, from: U.edge + 0.01, to: 0.9, weight: 0.5 },
      ],
      portal: { shape: 'circle', radius: 7, color: '#ffe6b8', glow: 0.55, revealDistance: 230 },
      post: { exposure: 0.84, bloom: { strength: 0.36, radius: 0.7, threshold: 1.05 },
        grade: { saturation: 1.08, contrast: 1.05, tint: '#fff6e6', shadowTint: '#1a0f08', vignette: 0.3, grain: 0.02, aberration: 0 } },
      update(dt, time, camera, u) {
        L.uTime.value = time;
        room.update(dt, time, camera); for (const f of furParts) f.update(dt, time, camera);
        hero.setProgress(clamp((u - U.tea) / Math.max(U.orbit1 - U.tea, 1e-3), 0, 1) * 0.85 + 0.15);
        hero.update(dt, time, camera);
        steam.uniforms.uBoost.value = 1 + 0.5 * smoothstep(0.0, U.tea, u) * (1 - smoothstep(U.rack, U.pass, u));
        glow.update(dt, time, camera); dust.update(dt, time, camera);
        for (const bee of bees) {
          const k = beePos(bee, time, _bp);
          bee.grp.position.copy(_bp);
          const near = bee.near, k2 = beePos(bee, time + 0.12, _bn); void k2;
          if (!(k > 0.02 && k < 0.98)) { const st = bee.stops[near], an = bee.ph + near * 2.1 + 0.15 * Math.sin(time * 0.7); _bn.set(st.x + Math.cos(an), st.y - 0.75, st.z + Math.sin(an)); }
          bee.grp.lookAt(_bn);
          bee.wings.scale.y = Math.sin(time * 61 + bee.ph) >= 0 ? 1 : -0.6; bee.wings.rotation.z = 0.12 * Math.sin(time * 47 + bee.ph);
        }
        {
          const e = smoothstep(U.leave, U.leave + 0.08, u), off = smoothstep(0.86, 0.97, u), ua = Math.min(u + 16 / path.length, 1);
          path.pointAt(ua, _bp); path.tangentAt(ua, _bn);
          const lat = -(2 * Math.sin(time * 0.9 + escort.ph) + 5.5 + off * 9), vert = 0.6 * Math.sin(time * 1.3) - 2.6 + off * 2;
          _bp.x += -_bn.z * lat; _bp.z += _bn.x * lat; _bp.y += vert;
          const j = escort.jar; _e1.set(j.x + 4.6 + 0.5 * Math.sin(time * 1.7), j.y + 2.6 + 0.4 * Math.sin(time * 2.3), j.z + 4.6 + 0.5 * Math.cos(time * 1.3));
          escort.grp.position.lerpVectors(_e1, _bp, e);
          if (e > 0.5) _e1.copy(escort.grp.position).addScaledVector(_bn, 3).add(_e2.set(Math.cos(time * 0.9 + escort.ph) * 2.6 + 1.2, -0.5, 0)); else _e1.copy(j);
          escort.grp.lookAt(_e1);
          escort.wings.scale.y = Math.sin(time * 61 + escort.ph) >= 0 ? 1 : -0.6; escort.wings.rotation.z = 0.12 * Math.sin(time * 47 + escort.ph);
        }
        updateAnts(time);
        const f = (time / 2.8) % 1;
        if (f < 0.55) { const g = f / 0.55; drip.position.copy(TAP); drip.scale.set(0.3 + 0.7 * g, 0.3 + 1.0 * g, 0.3 + 0.7 * g); }
        else { const g = Math.min((f - 0.55) / 0.33, 1); drip.position.set(TAP.x, TAP.y - 9.6 * g * g, TAP.z); drip.scale.set(0.9, 1.5, 0.9).multiplyScalar(g < 1 ? 1 : 0.001); }
      },
      dispose() { hero.dispose(); },
    };
  },
};
