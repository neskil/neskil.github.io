// The antechamber: the place between worlds that every visit opens in. A still dark hall with a mirror floor, arches
// receding into mist, dust in a shaft of light, and one ring portal straight ahead with the first world behind it.
// Never listed, never picked, never counted: src/main.js loads it by name and the engine knows it by def.antechamber.
// Every visitor waits for this file's first frame, so it costs almost nothing: three small shader programs (stone and
// sky; floor and light shaft; dust and stars), 11,000 to 15,000 triangles, no textures, no lights, no shadows.
// Everything stands mirrored in the floor by construction: the arches are whole rings centred on the floor, the dust,
// the stars and the shaft are drawn a second time upside down, and the floor is a dark sheet over that lower half
// which adds the one thing that cannot be built twice, the portal and the world inside it (ctx.portalView).
import * as THREE from 'three';
import { makePath } from '../kit/core.js';

const H = 7.6, L = 60, PR = 7, DEN = 0.0075, GLOW = 0.6;   // eye and portal height over the floor, metres to the portal, its radius, how thick the mist is, how strong the ring's halo

// the mist as seen in direction d: a band of light on the horizon, brightest down the hall, the same above and below the floor
const SKY = /* glsl */`
  vec3 sky(vec3 d){ float h=abs(d.y), a=max(0.,-d.z);
    return vec3(.0012,.0016,.0034)+uMist*(.03*exp(-h*1.5)+.055*exp(-h*6.)+(.3*exp(-h*11.)+.1*exp(-h*3.5))*pow(a,5.)); }`;

const STONE_VERT = /* glsl */`attribute vec2 aK; varying vec3 vW, vN; varying vec2 vK;
  void main(){ vK=aK; vN=normal; vec3 w=position;
    if(aK.x>.5) w=cameraPosition+position*1800.;               // the sky travels with the eye
    vW=w; gl_Position=projectionMatrix*viewMatrix*vec4(w,1.); }`;
const STONE_FRAG = /* glsl */`precision highp float;
  uniform vec3 uMist, uColor, uShaft; uniform vec4 uPortal; uniform float uDen;
  varying vec3 vW, vN; varying vec2 vK;
  ${SKY}
  void main(){
    vec3 V=vW-cameraPosition; float dist=length(V); V/=max(dist,1e-4);
    vec3 col=sky(V);
    if(vK.x<.5){
      vec3 N=normalize(vN+1e-6); if(dot(N,V)>0.) N=-N;
      float s=vW.y<0.?-1.:1.;                                   // below the floor is the mirror image: its lamp is the portal's reflection
      vec3 Lp=vec3(uPortal.x,uPortal.y*s,uPortal.z)-vW; float dp=length(Lp); Lp/=max(dp,1e-3);
      float lp=max(dot(N,Lp),0.)/(1.+dp*dp*.0018);
      float rim=1.-max(dot(N,-V),0.); rim*=rim*rim;
      vec3 st=vec3(.005,.006,.009)+uColor*lp*.4+uShaft*max(N.y*s,0.)*.012+uMist*rim*.09;
      col=mix(col, st, exp(-dist*uDen*vK.y));
    }
    gl_FragColor=vec4(col,1.);
  }`;

// one material draws the floor (uKind 0) and the shaft of light (uKind 1): premultiplied, so alpha 0 is pure light added
const SHEET_VERT = /* glsl */`varying vec3 vW, vN;
  void main(){ vec4 w=modelMatrix*vec4(position,1.); vW=w.xyz; vN=mat3(modelMatrix)*normal; gl_Position=projectionMatrix*viewMatrix*w; }`;
const SHEET_FRAG = /* glsl */`precision highp float;
  uniform sampler2D tNext; uniform mat4 uNextPV; uniform vec4 uRect, uPortal; uniform vec3 uGain, uMist, uColor, uShaft;
  uniform float uKind, uLive, uTime, uFade, uDen, uGlow;
  varying vec3 vW, vN;
  ${SKY}
  void main(){
    vec3 V=vW-cameraPosition; float dist=length(V); V/=max(dist,1e-4);
    vec2 b=vW.xz-uPortal.xz; float rb=dot(b,b);
    if(uKind>.5){                                               // the shaft: soft at its edges, streaked, thinning upward
      float e=abs(dot(normalize(vN+1e-6),V)), ang=atan(b.y,b.x+1e-5), y=abs(vW.y);
      float st=.62+.38*sin(ang*5.+uTime*.07)*sin(ang*11.-uTime*.05+y*.02);
      gl_FragColor=vec4(uShaft*(e*e*st*exp(-y*.012)*(1.-smoothstep(90.,150.,y))*.075*uFade),0.); return;
    }
    float c=clamp(-V.y,0.,1.), F=.13+.65*pow(1.-c,2.2);          // how much of a mirror the floor is at this angle
    vec3 R=vec3(V.x,-V.y,V.z), col=vec3(0.);
    float t=(uPortal.z-vW.z)/min(R.z,-1e-4);
    if(t>0.){                                                   // the portal as the floor sees it: the opening, its rim and its glow
      vec3 Q=vW+R*t; vec2 q=Q.xy-uPortal.xy; float d=length(q)-uPortal.w, x=max(d,0.)/uPortal.w, r=length(q)/uPortal.w;
      if(d<0.){
        vec4 cp=uNextPV*vec4(Q,1.); vec2 uv=cp.xy/max(cp.w,1e-4)*.5+.5, lo=uRect.xy, hi=uRect.xy+uRect.zw;
        vec3 next=max(textureLod(tNext, clamp(uv,lo,hi), 0.).rgb*uGain, 0.);
        float sw=.5+.5*sin(atan(q.y,q.x+1e-5)*3.+r*5.-uTime*.4);
        vec3 veil=uColor*(.22+.75*sw*sw*(.35+.65*r))*(.35+.9*r);  // no world yet: the swirl of the ring, in broad strokes
        float edge=smoothstep(-.22*uPortal.w,0.,d), e2=edge*edge, e4=e2*e2;
        col=mix(veil,next,uLive)+uColor*(mix(e2*1.2,e4*edge*.22,uLive)+e4*e4*e4*e4*3.);
      }
      if(d>-.05) col+=(uColor*(exp(-x*x*900.)*3.2+exp(-x*7.)*.62+exp(-x*2.2)*.07)+vec3(1.5)*exp(-x*x*4000.))*uGlow;
    }
    vec3 own=uMist*.003+uShaft*.018*exp(-rb*.012)*uFade;        // the little the floor scatters: mist, and a pool where the shaft lands
    own=mix(sky(V), own, exp(-dist*uDen));                      // far off the floor is lost in the mist
    gl_FragColor=vec4(own*(1.-F)+col*F*1.25, 1.-F);
  }`;

// dust (drifting, lit by the shaft and by the portal) and stars (a direction each, fixed in the sky) in one program.
// aD: size (metres for a mote, pixels at 540 lines for a star), phase, 1 for a star, rate
const SPECK_VERT = /* glsl */`attribute vec4 aD;
  uniform float uTime, uPx, uDen, uFade; uniform vec4 uPortal; uniform vec3 uMist, uColor, uShaft;
  varying vec3 vC;
  void main(){
    vec3 c; float px;
    if(aD.z>.5){
      vec3 d=normalize(mat3(modelMatrix)*position);
      gl_Position=projectionMatrix*viewMatrix*vec4(cameraPosition+d*1500.,1.);
      c=mix(vec3(.8,.88,1.),uMist*3.,.3)*(.55+.45*sin(uTime*aD.w+aD.y))*smoothstep(.06,.45,abs(d.y))*(.25+.75*fract(aD.y*7.31));
      px=aD.x*uPx/270.;
    } else {
      vec3 p=position+vec3(sin(uTime*.11*aD.w+aD.y), .4*sin(uTime*.08*aD.w+aD.y*1.7)+uTime*.05, cos(uTime*.09*aD.w+aD.y*2.3))*1.5;
      vec3 w=(modelMatrix*vec4(p,1.)).xyz; vec4 mv=viewMatrix*vec4(w,1.); gl_Position=projectionMatrix*mv;
      float dist=max(-mv.z,.01);
      vec3 m=vec3(w.x,abs(w.y),w.z);                             // a mote under the floor is lit as its twin above
      float inB=1.-smoothstep(.5,1.,length(m.xz-uPortal.xz)/11.), dp=distance(m,uPortal.xyz);
      c=uShaft*(.1+1.3*inB*uFade)+uColor*1.1/(1.+dp*dp*.03)+uMist*.25;
      float want=aD.x*uPx*projectionMatrix[1][1]/dist; px=clamp(want,1.6,10.);
      c*=min(1.,want*want/(px*px))*smoothstep(.8,5.,dist)*exp(-dist*uDen)*(.6+.4*sin(uTime*.9*aD.w+aD.y*5.));
    }
    vC=c; gl_PointSize=px;
  }`;
const SPECK_FRAG = /* glsl */`precision highp float; varying vec3 vC;
  void main(){ vec2 q=gl_PointCoord-.5; gl_FragColor=vec4(vC*exp(-dot(q,q)*16.),1.); }`;

export default {
  id: '_antechamber', name: '', category: 'between', antechamber: true, weirdness: 0,
  async build(ctx) {
    const { rng } = ctx, view = ctx.portalView, scene = new THREE.Scene();
    scene.background = new THREE.Color(0, 0, 0);
    // the hue of the mist differs from visit to visit: mostly the blues from sea green to violet, now and then rose or amber
    const k = rng(), hue = k < 0.8 ? rng.range(0.5, 0.76) : k < 0.9 ? rng.range(0.86, 0.96) : rng.range(0.06, 0.1);
    const mist = new THREE.Color().setHSL(hue, 0.6, 0.5), color = new THREE.Color().setHSL((hue + rng.range(-0.06, 0.06) + 1) % 1, 0.68, 0.46), shaft = new THREE.Color().setHSL((hue + 0.08) % 1, 0.3, 0.85);
    const sh = { uTime: { value: 0 }, uMist: { value: mist }, uColor: { value: color }, uShaft: { value: shaft }, uPortal: { value: new THREE.Vector4(0, H, -L, PR) }, uDen: { value: DEN }, uFade: { value: 1 }, uGlow: { value: GLOW } };

    // ---- stone and sky: one mesh, one draw. Rings are whole circles centred on the floor, so each is its own reflection ----
    const P = [], N = [], K = [], I = [], m = new THREE.Matrix4(), nm = new THREE.Matrix3(), v = new THREE.Vector3();
    const put = (g, kind, fog) => {
      const p = g.attributes.position, n = g.attributes.normal, base = P.length / 3; nm.getNormalMatrix(m);
      for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i).applyMatrix4(m); P.push(v.x, v.y, v.z); v.fromBufferAttribute(n, i).applyMatrix3(nm).normalize(); N.push(v.x, v.y, v.z); K.push(kind, fog); }
      for (let i = 0; i < g.index.count; i++) I.push(base + g.index.getX(i));
    };
    const hoop = new THREE.TorusGeometry(1, 0.021, 6, 56), dome = new THREE.SphereGeometry(1, 20, 12);
    put(dome, 1, 0);
    const ring = (x, z, R, yaw, fog) => { m.makeRotationY(yaw).scale(v.set(R, R, R)).setPosition(x, 0, z); put(hoop, 0, fog); };
    // which rings stand differs too: the first two always (they make the opening picture), then about three in four
    const R0 = rng.range(18.5, 23), step = rng.range(14, 18); let z = -rng.range(25, 30), n = 0;
    while (z > -700) {
      const far = -z / 300;
      if (Math.abs(z + L) > 7 && (n < 2 || rng.chance(0.78))) ring(0, z, R0 * (1 + far * 0.2) + rng.range(-0.6, 0.6), 0, 1);   // none through the portal's own plane
      n++; z -= step * (1 + far);
    }
    // and far off two or three rings the size of hills, half lost in the mist
    for (let i = 0, c = rng.int(2, 3), side = rng.sign(); i < c; i++, side = -side) ring(side * rng.range(520, 1000), -rng.range(750, 1400), rng.range(260, 480), rng.range(-0.7, 0.7), 0.1);   // to either side, never behind the portal
    const sg = new THREE.BufferGeometry();
    sg.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); sg.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3)); sg.setAttribute('aK', new THREE.Float32BufferAttribute(K, 2)); sg.setIndex(I);
    const stone = new THREE.Mesh(sg, new THREE.ShaderMaterial({ name: 'ante-stone', uniforms: sh, vertexShader: STONE_VERT, fragmentShader: STONE_FRAG, side: THREE.DoubleSide, toneMapped: false }));
    stone.frustumCulled = false; scene.add(stone);

    // ---- floor and shaft: the lower half of everything is drawn first, the floor over it, the upper half after ----
    const live = { value: 0 }, pv = { tNext: { value: view.texture }, uNextPV: { value: view.matrix }, uRect: { value: view.rect }, uGain: { value: view.gain }, uLive: live };
    const sheet = (kind) => new THREE.ShaderMaterial({ name: 'ante-sheet', uniforms: { ...sh, ...pv, uKind: { value: kind } }, vertexShader: SHEET_VERT, fragmentShader: SHEET_FRAG, transparent: true, premultipliedAlpha: true, depthWrite: kind === 0, side: THREE.DoubleSide, toneMapped: false });
    const fg = new THREE.PlaneGeometry(6000, 6000); fg.rotateX(-Math.PI / 2);
    const floor = new THREE.Mesh(fg, sheet(0)); floor.position.set(0, 0, -1500); floor.renderOrder = 1; floor.frustumCulled = false; scene.add(floor);
    const bg = new THREE.CylinderGeometry(17, 9.5, 150, 40, 1, true); bg.translate(0, 75, 0);
    const beamMat = sheet(1);
    for (const s of [1, -1]) { const b = new THREE.Mesh(bg, beamMat); b.position.set(0, 0, -L); b.scale.y = s; b.renderOrder = s > 0 ? 2 : 0; b.frustumCulled = false; scene.add(b); }

    // ---- dust and stars: where the dust drifts is the seed's too ----
    const ND = Math.round(1500 * ctx.quality.detail), NS = 420, pp = new Float32Array((ND + NS) * 3), pd = new Float32Array((ND + NS) * 4);
    for (let i = 0; i < ND; i++) {
      let x, y, zz;
      if (i < ND * 0.5) { const a = rng.range(0, 6.2832), r = 10.5 * Math.sqrt(rng()); x = r * Math.cos(a); zz = -L + r * Math.sin(a); y = rng.range(0.3, 46); }   // half of it in the shaft
      else { x = rng.gauss() * 13; y = 0.4 + 24 * rng() * rng(); zz = rng.range(-150, 6); }
      pp[i * 3] = x; pp[i * 3 + 1] = y; pp[i * 3 + 2] = zz;
      pd[i * 4] = rng.range(0.035, 0.09); pd[i * 4 + 1] = rng.range(0, 6.2832); pd[i * 4 + 3] = rng.range(0.5, 1.5);
    }
    for (let i = ND; i < ND + NS; i++) {
      const a = rng.range(0, 6.2832), y = rng.range(0.03, 1), r = Math.sqrt(1 - y * y);
      pp[i * 3] = r * Math.cos(a); pp[i * 3 + 1] = y; pp[i * 3 + 2] = r * Math.sin(a);
      pd[i * 4] = rng.range(1.2, 2.8); pd[i * 4 + 1] = rng.range(0, 6.2832); pd[i * 4 + 2] = 1; pd[i * 4 + 3] = rng.range(0.6, 2.4);
    }
    const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.BufferAttribute(pp, 3)); pg.setAttribute('aD', new THREE.BufferAttribute(pd, 4));
    const px = { value: 270 };
    const speck = new THREE.ShaderMaterial({ name: 'ante-speck', uniforms: { ...sh, uPx: px }, vertexShader: SPECK_VERT, fragmentShader: SPECK_FRAG, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, toneMapped: false });
    for (const s of [1, -1]) { const p = new THREE.Points(pg, speck); p.scale.y = s; p.renderOrder = s > 0 ? 2 : 0; p.frustumCulled = false; scene.add(p); }

    const path = makePath([[0, H, 0], [0, H, -L / 3], [0, H, -2 * L / 3], [0, H, -L]]);
    const buf = new THREE.Vector2(); let liveK = 0, last = -1;
    return {
      scene, path, duration: 7.5, style: 'none', ride: 'none', companion: 'none',
      camera: { fov: 62, lookAhead: 12, sway: 0.8, bank: 0 },
      portal: { shape: 'circle', radius: PR, color, glow: GLOW, style: 'ring', revealDistance: 4 * L, blendDistance: 20 },
      post: { exposure: 1.05, bloom: { strength: 0.5, radius: 0.8, threshold: 0.85 }, grade: { saturation: 1.05, contrast: 1.05, vignette: 0.45, grain: 0.03 } },
      update(dt, time, camera, u) {
        sh.uTime.value = time;
        ctx.renderer.getDrawingBufferSize(buf); px.value = buf.y * 0.5;
        // the engine's own objects, taken afresh every frame (docs/WORLD_GUIDE.md, "Seeing the next world")
        pv.tNext.value = view.texture; pv.uNextPV.value = view.matrix; pv.uRect.value = view.rect; pv.uGain.value = view.gain;
        // the floor shows the first world while the engine holds a picture of it, eased in as the opening itself is (at once on a still)
        const want = view.live ? 1 : 0; liveK = dt > 0 && Math.abs(time - last - dt) < 0.5 ? liveK + (want - liveK) * (1 - Math.exp(-dt * 2.2)) : want; last = time; live.value = liveK;
        const left = (1 - u) * L, f = Math.min(1, Math.max(0, (left - 11) / 16)); sh.uFade.value = f * f * (3 - 2 * f);   // the shaft thins away as the eye enters it
      },
    };
  },
};
