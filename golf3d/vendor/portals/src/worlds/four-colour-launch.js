// FOUR-COLOUR LAUNCH ("Launch Row"): a pulp-magazine planet printed in four-colour letterpress halftone on newsprint.
// A rocket sled (built here, round the camera) runs a rail through mesa country and a city of bubble domes on to a
// causeway of twelve finned ships that lift off one after another (the hero, src/parts/four-colour-launch.js).
// Everything is unlit: tone is dot size. Three kinds of mark, all in the surfaces' own materials or real geometry:
//   paper  (flat ink or bare stock + spotted black + the surface's own dot screens, worldPaper below)
//   line   (inverted hulls and ribbons in key black, worldHull below)
//   dots   (real instanced discs on the plain in two travelling rings of scale, multiply blended, slipped by uReg)
// World space: +Z the course, +X port, desert y 0, causeway deck top y 9, sled line y 12.
import * as THREE from 'three';
import { makePath, clamp, lerp, smoothstep } from '../kit/core.js';
import { buildHero, makeStyle, makeGeo, makeDots, buildSky, STYLE_GLSL, SCREEN_GLSL, POST, DEFAULT_PALETTE } from '../parts/four-colour-launch.js';

const DECK_Y = 9, RAIL_Y = 12, ROW_Z = 1135, DUR = 41;
// the launch wave: a ship every IGN_EVERY seconds of the journey clock from 2.5 s, so that ship eleven is 30-60 m up
// while still ahead and beside us; ship twelve lights at IGN_LAST and is flown beside the sled up the climb
const IGN_EVERY = 2.58, IGN_LAST = 33.0;
// The timetable, ship by ship (journey seconds). Down the causeway each ship lights 10.5 s before the sled reaches its
// pad, so the wave runs four pads ahead and the sky over the row holds the staircase (a ship just lit 360 m ahead, the
// next 20 m up, the next 50, the next 80 and leaning away); the lead shortens over the last four so that ship eleven
// is still rising when we come beside it.
const IGNITIONS = [2.5, 5.56, 8.56, 10.56, 12.56, 14.56, 16.56, 19.46, 22.56, 25.72, 28.3, IGN_LAST];
const TAU = Math.PI * 2;
const PART_BUILDERS = [];        // async (env) => void, in build order; each may push { update, dispose } to env.parts
const ease = (x) => { x = clamp(x, 0, 1); return x * x * (3 - 2 * x); };

// ---------------------------------------------------------------- editions (the brief's variations)
// land: the two disc plates of the plain (ink, screen angle, tone) and the far plate; sky: how the dome is printed.
const EDITIONS = {
  noon: { palette: DEFAULT_PALETTE, noon: [0.42, 0.86, -0.29],
    land: { A: ['yellow', 0, 0.8], B: ['magentaOnYellow', 1.309, 0.46], C: ['cyan', 0.2618, 0.3] }, sky: 'cyan', title: 'Launch Row' },
  evening: { palette: DEFAULT_PALETTE, noon: [0.86, 0.4, -0.3],
    land: { A: ['cyan', 0.2618, 0.62], B: ['magenta', 1.309, 0.5], C: ['cyan', 0.2618, 0.42] }, sky: 'evening', title: 'Launch Row, Evening Edition' },
  night: { palette: DEFAULT_PALETTE, noon: [0.3, 0.9, -0.3],
    land: { A: ['cyan', 0.2618, 0.6], B: ['cyan', 1.309, 0.0], C: ['cyan', 0.2618, 0.45] }, sky: 'night', title: 'Launch Row, Night Edition' },
  two: { palette: ['#DDD6C2', '#16120E', '#E4562A', '#DDD6C2', '#16120E', '#E4562A', '#16120E'], noon: [0.42, 0.86, -0.29],
    land: { A: ['magenta', 1.309, 0.5], B: ['cyan', 0.2618, 0.0], C: ['cyan', 0.2618, 0.16] }, sky: 'cyan', title: 'Launch Row, Inside Pages' },
};

// ---------------------------------------------------------------- the world's own paper and line materials
// Geometry comes from the hero's makeGeo() (position, normal, aHullN, color, aMark) plus two attributes added by
// geoBuilder(): aDot (tone of plate A, tone of plate B) and aAnim (kind, amount, phase, speed).
// aAnim kinds: 1 bob (sway in xz), 2 breathe (along the smooth normal), 3 spin about the object's Y axis, 4 flutter.
// The screens are drawn in the surface's own coordinates (uMap: 0 world xz, 1 round the object's Y axis, 2 on the
// ball, by the smooth normal, tone rising toward uAxis), so they foreshorten and travel with the object.
const W_GLSL = /* glsl */`
  attribute vec3 aHullN; attribute vec3 aMark; attribute vec4 aAnim; attribute vec2 aDot;
  vec3 wAnim(vec3 p, vec3 hn, float ph){
    float k = aAnim.x; if (k < 0.5) return p;
    float t = uTime*aAnim.w + aAnim.z + ph;
    if (k < 1.5) return p + vec3(sin(t), 0.25*sin(t*1.7), cos(t*0.8))*aAnim.y;
    if (k < 2.5) return p + hn*aAnim.y*(0.5 + 0.5*sin(t));
    if (k < 3.5){ float c = cos(t), s = sin(t); return vec3(c*p.x + s*p.z, p.y, -s*p.x + c*p.z); }
    return p + vec3(0., sin(t + p.x*1.3 + p.z*1.3), 0.)*aAnim.y;
  }
  vec3 wDir(vec3 n, float ph){ if (aAnim.x > 2.5 && aAnim.x < 3.5){ float t = uTime*aAnim.w + aAnim.z + ph, c = cos(t), s = sin(t); return vec3(c*n.x + s*n.z, n.y, -s*n.x + c*n.z); } return n; }
  mat4 wModel(){
    #ifdef USE_INSTANCING
      return modelMatrix*instanceMatrix;
    #else
      return modelMatrix;
    #endif
  }`;
function worldMaterials(style) {
  const U = style.uniforms, F = style.factor;
  const paper = (o = {}) => new THREE.ShaderMaterial({
    side: o.side ?? THREE.FrontSide, ...(o.glass ? style.plateBlend : {}),
    uniforms: { ...U, uGlass: { value: o.glass ? 1 : 0 }, uFA: { value: F[o.A ?? 'cyan'] }, uFB: { value: F[o.B ?? 'magenta'] }, uAng: { value: new THREE.Vector2(o.angA ?? 0.2618, o.angB ?? 1.309) },
      uRegAB: { value: new THREE.Vector2(o.regA ?? 0.25, o.regB ?? 1) }, uMap: { value: o.map ?? 0 }, uPitch: { value: o.pitch ?? 1.5 }, uSwell: { value: o.swell ?? 0 },
      uAxis: { value: new THREE.Vector3(...(o.axis ?? [0, -1, 0])).normalize() }, uCells: { value: o.cells ?? 9 }, uBall: { value: o.ball ?? 6 },
      uEdge: { value: new THREE.Vector2(...(o.edge ?? [-0.1, 0.75])) }, uTone: { value: new THREE.Vector2(o.toneA ?? 1, o.toneB ?? 1) }, uFade: { value: o.fade ?? 1 } },
    vertexShader: /* glsl */`
      ${STYLE_GLSL} ${W_GLSL}
      attribute vec3 color;
      varying vec3 vCol, vN, vW, vL, vHN; varying vec3 vMk;
      void main(){ mat4 M = wModel(); float ph = M[3][0]*0.37 + M[3][2]*0.23;
        vec3 p = wAnim(position, aHullN, ph); vec4 w = M*vec4(p, 1.);
        vW = w.xyz; vL = position; vHN = aHullN; vCol = color; vMk = vec3(aMark.x, aDot);
        vN = mat3(M)*wDir(normal, ph); gl_Position = projectionMatrix*viewMatrix*w; }`,
    fragmentShader: /* glsl */`
      ${STYLE_GLSL}
      uniform vec3 uFA, uFB, uAxis; uniform vec2 uAng, uRegAB, uEdge, uTone; uniform float uMap, uPitch, uSwell, uCells, uBall, uFade, uGlass;
      varying vec3 vCol, vN, vW, vL, vHN; varying vec3 vMk;
      // one plate: coverage of a dot screen at surface coordinate q (in cells); px = pixels a cell
      float plate(vec2 q, float tone, float px){ vec2 f = fract(q) - 0.5; float rad = sqrt(clamp(tone, 0., 1.)*0.3183)*1.02, aa = 1.1/max(px, 1e-3);
        return mix(clamp(tone, 0., 1.), 1. - smoothstep(rad - aa, rad + aa, length(f)), smoothstep(2.6, 4.6, px)); }
      float plateH(float d, float aa, float tone, float px){ float rad = sqrt(clamp(tone, 0., 1.)*0.3183)*1.02;
        return mix(clamp(tone, 0., 1.), 1. - smoothstep(rad - aa, rad + aa, d), smoothstep(1.6, 2.6, px)); }
      void main(){
        vec3 n = normalize(vN + vec3(0., 1e-5, 0.)); if (!gl_FrontFacing) n = -n;
        float teeth = (tri(dot(vL, vec3(0.37, 0.21, 0.29))) - 0.5)*0.26 + (vn2(vL.xy*0.33 + vL.z*0.19) - 0.5)*0.34;
        float e = dot(n, uNoon) + teeth, thr = mix(-2.2, -0.08, vMk.x), ea = fwidth(e)*0.75 + 1e-4;
        float k = 1. - smoothstep(thr - ea, thr + ea, e);
        vec3 col = mix(vCol, vec3(1.), uGlass); k *= 1. - uGlass; float dist = length(cameraPosition - vW), sh = shadowAt(vW)*uSwell;
        vec2 slip = uReg.x*dist*0.6*uRegAB; float aA = 0., aB = 0.;
        // (derivatives are taken here, outside the branch and the loop below)
        vec2 q = uMap < 0.5 ? vW.xz : vec2(atan(vL.z, abs(vL.x) + abs(vL.z) > 1e-4 ? vL.x : 1.)*uBall, vL.y);
        vec3 fp = uMap < 0.5 ? vW : vL; float pxq = uPitch/max(max(length(dFdx(fp)), length(dFdy(fp))), 1e-6);
        vec2 gA = rot2(uAng.x)*(q + vec2(slip.x, 0.))/uPitch, gB = rot2(uAng.y)*(q + vec2(slip.y, 0.))/uPitch;
        float dA = length(fract(gA) - 0.5), dB = length(fract(gB) - 0.5);
        float eA = clamp(fwidth(dA)*0.7, 1e-4, 0.2), eB = clamp(fwidth(dB)*0.7, 1e-4, 0.2);
        vec3 hn = normalize(vHN + vec3(0., 1e-5, 0.)); float pxBall = 1./max(length(fwidth(hn))*uCells*0.6, 1e-5);
        if (uMap < 1.5){
          aA = plateH(dA, eA, vMk.y*uTone.x + sh*step(0.01, vMk.y), pxq);
          aB = plateH(dB, eB, vMk.z*uTone.y + sh*step(0.01, vMk.z), pxq);
        } else {
          // on the ball: stereographic lattice about uAxis, tone taken at each dot's own centre
          vec3 a = uAxis;
          vec3 t = normalize(cross(a, abs(a.y) > 0.9 ? vec3(1., 0., 0.) : vec3(0., 1., 0.))), b = cross(a, t);
          vec2 s = vec2(dot(hn, t), dot(hn, b))/max(1. + dot(hn, a), 0.06);
          float px = pxBall;
          for (int i = 0; i < 2; i++){
            float ang = i == 0 ? uAng.x : uAng.y; vec2 g = rot2(ang)*(s*uCells) + (i == 0 ? slip.x : slip.y)*uCells/uBall;
            vec2 cc = floor(g) + 0.5, sc = (cc*rot2(ang))/uCells; float q2 = dot(sc, sc), na = (1. - q2)/(1. + q2);
            float tone = (i == 0 ? uTone.x*vMk.y : uTone.y*vMk.z)*smoothstep(uEdge.x, uEdge.y, na);
            float cv = plate(g, tone + sh*step(0.01, tone), px)*step(-0.86, dot(hn, a));
            if (i == 0) aA = cv; else aB = cv;
          }
        }
        col *= mix(vec3(1.), uFA, aA*uFade)*mix(vec3(1.), uFB, aB*uFade);
        gl_FragColor = vec4(mix(col, uK, k), 1.);
      }`,
  });
  const hull = (o = {}) => new THREE.ShaderMaterial({
    side: THREE.BackSide, uniforms: { ...U, uWidth: { value: o.width ?? 1 } },
    vertexShader: /* glsl */`
      ${STYLE_GLSL} ${W_GLSL}
      uniform float uWidth;
      void main(){ mat4 M = wModel(); float ph = M[3][0]*0.37 + M[3][2]*0.23;
        vec3 p = wAnim(position, aHullN, ph); vec4 w = M*vec4(p, 1.);
        vec3 wn = normalize(mat3(M)*wDir(aHullN, ph) + vec3(0., 1e-5, 0.));
        float shade = 0.5 - 0.5*dot(wn, uNoon), dist = length(cameraPosition - w.xyz);
        float wd = aMark.z*uWidth*mix(0.5, 1.55, shade)*wobble(position);
        wd = aMark.z > 0. ? max(wd, 1.5*uPx*dist) : 0.;
        w.xyz += wn*wd; gl_Position = projectionMatrix*viewMatrix*w; }`,
    fragmentShader: /* glsl */`uniform vec3 uK; void main(){ gl_FragColor = vec4(uK, 1.); }`,
  });
  return { paper, hull };
}

// geoBuilder(): the hero's makeGeo() with the two extra attributes; set(dotA, dotB, anim) applies to what is added next.
function geoBuilder() {
  const G = makeGeo(), runs = [];
  G.set = (a = 0, b = 0, anim = [0, 0, 0, 1]) => { runs.push([G.vertexCount, a, b, anim]); return G; };
  G.set();
  G.finish = () => {
    const geo = G.build(), n = G.vertexCount, D = new Float32Array(n * 2), A = new Float32Array(n * 4);
    for (let r = 0; r < runs.length; r++) { const [s, a, b, an] = runs[r], e = r + 1 < runs.length ? runs[r + 1][0] : n;
      for (let i = s; i < e; i++) { D[i * 2] = a; D[i * 2 + 1] = b; A[i * 4] = an[0]; A[i * 4 + 1] = an[1]; A[i * 4 + 2] = an[2]; A[i * 4 + 3] = an[3]; } }
    geo.setAttribute('aDot', new THREE.BufferAttribute(D, 2)); geo.setAttribute('aAnim', new THREE.BufferAttribute(A, 4));
    geo.deleteAttribute('aRig');
    return geo;
  };
  return G;
}

// ---------------------------------------------------------------- the plain: real discs near, the same screens far
// Two plates (A, B) of real instanced discs lie on the desert in two world-anchored lattices each (0.5 m and 1.5 m
// pitch) that wrap by modulo round a point ahead of the sled; radii fall to zero across the hand-over rings, so the
// change of screen scale is seen as two rings travelling with us. Beyond the outer ring one big plane draws the same
// plates at 6, 24 and 96 m pitch in its fragment shader; with distance plate B drops out, then A, and the far plate C
// (cyan) comes in. Tone at each dot swells under the moving shadows (uShadow).
const LAND_GLSL = /* glsl */`
  uniform vec2 uCtr; uniform vec4 uRing;        // ring centre (world xz); near field's outer band, mid field's outer band
  float landVar(vec2 w){ return 0.84 + 0.3*vn2(w*0.011 + 7.3) + 0.12*sin(w.x*0.021 + 2.*vn2(w*0.004)); }
  float underDeck(vec2 w){ return step(abs(w.x), 28.5)*step(566., w.y)*step(w.y, 1700.); }`;
const SCREENH_GLSL = /* glsl */`
  // a dot screen with hard edges: the edge is one pixel wide along its own gradient, so foreshortened dots stay crisp
  // ellipses; only under ~2 px a cell does it fall back to the flat tint (the windows below never let it get there)
  float screenH(vec2 p, float pitch, float angle, float tone){
    vec2 g = rot2(angle)*p/pitch; float d = length(fract(g) - 0.5);
    float px = 1./max(max(length(dFdx(g)), length(dFdy(g))), 1e-5);
    float rad = sqrt(clamp(tone, 0., 1.)*0.3183)*1.02, aa = clamp(fwidth(d)*0.7, 1e-4, 0.2);
    return mix(clamp(tone, 0., 1.), 1. - smoothstep(rad - aa, rad + aa, d), smoothstep(1.6, 2.6, px)); }
`;
function buildLand(style, ed, detail) {
  const U = style.uniforms, F = style.factor, L = ed.land, group = new THREE.Group();
  const P1 = 0.8, P2 = 2.4, nearN = 76, midN = Math.round(52 * Math.sqrt(detail)), rNear = nearN * P1 * 0.5 - 1, rMid = midN * P2 * 0.5 - 2;
  const shared = { uCtr: { value: new THREE.Vector2() }, uRing: { value: new THREE.Vector4(rNear - 9, rNear, Math.min(rMid - 12, 48), Math.min(rMid, 60)) } };
  const regOf = (ink) => (ink === 'yellow' ? [0, 0] : ink === 'cyan' ? [0, 1] : [1, 0]);
  const quad = new Float32Array([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0]);
  const field = (N, pitch, lv, plate, swell) => {
    const [inkName, ang, tone] = plate; if (tone <= 0) return null;
    const cells = new Float32Array(N * N * 2); let n = 0;
    for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) { cells[n++] = i; cells[n++] = j; }
    const geo = new THREE.InstancedBufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(quad, 3)); geo.setIndex([0, 1, 2, 0, 2, 3]);
    geo.setAttribute('iCell', new THREE.InstancedBufferAttribute(cells, 2)); geo.instanceCount = N * N;
    geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e6);
    const mat = new THREE.ShaderMaterial({
      uniforms: { ...U, ...shared, uF: { value: F[inkName] }, uRegW: { value: new THREE.Vector2(...regOf(inkName)) }, uP: { value: new THREE.Vector4(pitch, ang, N, lv) }, uT: { value: new THREE.Vector2(tone, swell) } },
      ...style.plateBlend, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4,
      vertexShader: /* glsl */`
        ${STYLE_GLSL} ${LAND_GLSL}
        uniform vec4 uP; uniform vec2 uT, uRegW; attribute vec2 iCell; varying vec2 vUv; varying vec2 vK;
        void main(){ float pitch = uP.x; mat2 R = rot2(uP.y);
          vec2 cl = R*uCtr/pitch, g = iCell + uP.z*floor((cl - iCell)/uP.z + 0.5) + 0.5;
          vec2 wxz = (g*pitch)*R; vec3 w = vec3(wxz.x, 0.04, wxz.y);
          float d = length(wxz - uCtr);
          float ring = uP.w < 0.5 ? 1. - smoothstep(uRing.x, uRing.y, d) : smoothstep(uRing.x, uRing.y, d)*(1. - smoothstep(uRing.z, uRing.w, d));
          float tone = clamp(uT.x*landVar(wxz) + uT.y*shadowAt(w), 0., 1.)*ring*(1. - underDeck(wxz));
          vec3 toCam = cameraPosition - w; float dist = length(toCam);
          float pxMinor = pitch*abs(toCam.y)/max(dist*dist*uPx, 1e-5), f = smoothstep(1.4, 2.8, pxMinor);
          float r = pitch*sqrt(tone*0.3183)*1.02, hs = tone < 0.004 ? 0. : mix(pitch*0.5, r*1.08, f);
          vec2 o = (position.xy*hs)*R; w.xz += o; w.y += dist*0.0005;
          vUv = position.xy*mix(1., 1.08, f); vK = vec2(f, mix(tone, 1., f));
          gl_Position = projectionMatrix*viewMatrix*vec4(w, 1.); gl_Position.x += dot(uReg, uRegW)*gl_Position.w; }`,
      fragmentShader: /* glsl */`
        uniform vec3 uF; varying vec2 vUv; varying vec2 vK;
        void main(){ float d = length(vUv), aa = fwidth(d)*0.8 + 1e-4;
          float a = mix(1., 1. - smoothstep(1. - aa, 1. + aa, d), vK.x)*vK.y; if (a < 0.004) discard;
          gl_FragColor = vec4(mix(vec3(1.), uF, a), 1.); }`,
    });
    const mesh = new THREE.Mesh(geo, mat); mesh.frustumCulled = false; mesh.renderOrder = 3; group.add(mesh);
    return mesh;
  };
  field(nearN, P1, 0, L.A, 0.1); field(nearN, P1, 0, L.B, 0.5);
  field(midN, P2, 1, L.A, 0.1); field(midN, P2, 1, L.B, 0.5);
  // the far plain
  // (drawn first and without depth: a triangle this large interpolates depth too coarsely to lay 4 cm decals on)
  const far = new THREE.Mesh(new THREE.PlaneGeometry(11000, 11000).rotateX(-Math.PI / 2), new THREE.ShaderMaterial({ depthWrite: false, depthTest: false,
    uniforms: { ...U, ...shared, uFA: { value: F[L.A[0]] }, uFB: { value: F[L.B[0]] }, uFC: { value: F[L.C[0]] },
      uAng: { value: new THREE.Vector3(L.A[1], L.B[1], L.C[1]) }, uTone: { value: new THREE.Vector3(L.A[2], L.B[2], L.C[2]) },
      uRegA: { value: new THREE.Vector2(...regOf(L.A[0])) }, uRegB: { value: new THREE.Vector2(...regOf(L.B[0])) } },
    vertexShader: /* glsl */`varying vec3 vW; void main(){ vec4 w = modelMatrix*vec4(position, 1.); vW = w.xyz; gl_Position = projectionMatrix*viewMatrix*w; }`,
    fragmentShader: /* glsl */`
      ${STYLE_GLSL} ${LAND_GLSL} ${SCREENH_GLSL}
      uniform vec3 uFA, uFB, uFC, uAng, uTone; uniform vec2 uRegA, uRegB; varying vec3 vW;
      void main(){ vec2 p = vW.xz; float dist = length(cameraPosition - vW), d = length(p - uCtr);
        vec2 right = vec2(viewMatrix[0][0], viewMatrix[2][0])*dist*0.6;
        vec2 pa = p + right*dot(uReg, uRegA), pb = p + right*dot(uReg, uRegB);
        float sh = shadowAt(vW), v = landVar(p);
        // each screen is kept only while its dots stand at least ~3 px tall from this eye height; the scale steps out
        // 8 m, 24 m, 96 m, then magenta drops out, then the first plate, and the far plain is bare paper to the horizon line
        float hs = sqrt(max(cameraPosition.y, 12.)/12.), dh = d/hs;
        float w1 = smoothstep(uRing.z, uRing.w, d)*(1. - smoothstep(88., 110., dh)), w2 = smoothstep(88., 110., dh)*(1. - smoothstep(155., 190., dh)), w3 = smoothstep(155., 190., dh);
        float dropB = 1. - smoothstep(190., 320., dh), dropA = 1. - smoothstep(290., 410., dh);
        float tA = clamp(uTone.x*v + 0.1*sh, 0., 1.)*dropA, tB = clamp(uTone.y*v + 0.5*sh, 0., 1.)*dropB*step(0.01, uTone.y);
        float aA = max(screenH(pa, 8., uAng.x, tA*w1), max(screenH(pa, 24., uAng.x, tA*w2), screenH(pa, 96., uAng.x, tA*w3)));
        float aB = max(screenH(pb, 8., uAng.y, tB*w1), max(screenH(pb, 24., uAng.y, tB*w2), screenH(pb, 96., uAng.y, tB*w3)));
        float aC = 0.;
        vec3 col = uPaperC*mix(vec3(1.), uFA, aA)*mix(vec3(1.), uFB, aB)*mix(vec3(1.), uFC, aC);
        gl_FragColor = vec4(col, 1.); }`,
  }));
  far.frustumCulled = false; far.renderOrder = -5; group.add(far);
  const _d = new THREE.Vector3(), _p = new THREE.Vector3();
  return { group, far,
    update(camera) { camera.getWorldPosition(_p); camera.getWorldDirection(_d); const l = Math.hypot(_d.x, _d.z) || 1;
      shared.uCtr.value.set(_p.x + (_d.x / l) * 20, _p.z + (_d.z / l) * 20); far.position.set(Math.round(_p.x / 96) * 96, 0, Math.round(_p.z / 96) * 96); } };
}

// ---------------------------------------------------------------- the printed sky, per edition
function buildEditionSky(style, ed, detail, rng) {
  const ink = style.ink, F = style.factor, deg = Math.PI / 180;
  const moons = [{ dir: [0.62, 0.62, 0.48], size: 9, crescent: true }, { dir: [-0.5, 0.2, 0.84], size: 3.6, ring: true }];   // large one high to port (+X)
  if (ed.sky === 'evening') return buildSky(style, { detail, moons, count: 6500, breathe: 0.09, domeColor: ink.yellow, factor: F.magentaOnYellow,
    tone: (el) => 0.03 + 0.62 * Math.pow(1 - smoothstep(8 * deg, 1.25, el), 1.6) });
  if (ed.sky === 'night') { const r = rng.fork ? rng.fork('stars') : rng;
    return buildSky(style, { detail, moons, domeColor: ink.black, solid: ink.paper, moonFill: ink.paper,
      tone: () => (r() < 0.16 ? 0.02 + 0.2 * Math.pow(r(), 3) : 0) }); }
  return buildSky(style, { detail, moons, count: 6500, breathe: 0.09 });
}

// ---------------------------------------------------------------- helpers for the parts
const M4 = (x, y, z, ry = 0, s = 1, sy = s) => new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), ry), new THREE.Vector3(s, sy, s));
// one geometry drawn as paper + inverted hull (two draw calls); returns the two meshes
function pair(env, geo, po = {}, ho = {}) {
  const a = new THREE.Mesh(geo, env.W.paper(po)), b = new THREE.Mesh(geo, env.W.hull(ho));
  a.frustumCulled = b.frustumCulled = false; env.scene.add(a, b); return [a, b];
}
// the same for many copies: two InstancedMeshes sharing one geometry
function instPair(env, geo, mats, po = {}, ho = {}) {
  const n = Math.max(mats.length, 1), a = new THREE.InstancedMesh(geo, env.W.paper(po), n), b = new THREE.InstancedMesh(geo, env.W.hull(ho), n);
  mats.forEach((m, i) => { a.setMatrixAt(i, m); b.setMatrixAt(i, m); }); a.count = b.count = mats.length;
  a.frustumCulled = b.frustumCulled = false; env.scene.add(a, b);
  return { a, b, set(i, m) { a.setMatrixAt(i, m); b.setMatrixAt(i, m); }, flush() { a.instanceMatrix.needsUpdate = true; b.instanceMatrix.needsUpdate = true; } };
}
// a ball as a lathe profile: [r, y] from the bottom to the top of a sphere radius R centred at height cy
const ballProfile = (R, cy, n = 10, col, a0 = 0, a1 = 1) => Array.from({ length: n + 1 }, (_, i) => { const t = (lerp(a0, a1, i / n) - 0.5) * Math.PI; return col ? [Math.max(R * Math.cos(t), 0), cy + R * Math.sin(t), col] : [Math.max(R * Math.cos(t), 0), cy + R * Math.sin(t)]; });

// ---------------------------------------------------------------- the rail, its pylons, the causeway and what stands on it
PART_BUILDERS.push(async (env) => {
  const { ink, path, edKey } = env, night = edKey === 'night';
  const cWarm = night ? ink.paper : ink.orange, cY = night ? ink.paper : ink.yellow;
  env.cWarm = cWarm; env.cY = cY;
  const G = geoBuilder(), up = new THREE.Vector3(0, 1, 0), t = new THREE.Vector3(), p = new THREE.Vector3(), d = new THREE.Vector3();
  // the rail: one beam hung 2 m under the sled line, from behind the entry to the ring
  const railAt = (s) => { path.posAtDist(s, p); path.tangentAtDist(s, t); d.copy(t).multiplyScalar(t.y).sub(up).normalize(); return [p.x + d.x * 2.3, p.y + d.y * 2.3, p.z + d.z * 2.3]; };
  const rail = { col: cWarm, mark: [0.35, 0, 0.16] }, tie = { col: ink.black, mark: [0, 0, 0] };
  let prev = railAt(-170); const step = 7;
  for (let s = -170 + step; s <= path.length + 0.1; s += step) { const q = railAt(Math.min(s, path.length)); path.tangentAtDist(s, t); d.copy(t).multiplyScalar(t.y).sub(up).normalize();
    G.beam(prev, q, 1.2, 0.6, rail, [-d.x, -d.y, -d.z]);
    const mx = (prev[0] + q[0]) / 2, my = (prev[1] + q[1]) / 2, mz = (prev[2] + q[2]) / 2, rx = t.z, rz = -t.x;                  // a black tie across the beam
    G.beam([mx - rx * 1.25, my - 0.18, mz - rz * 1.25], [mx + rx * 1.25, my - 0.18, mz + rz * 1.25], 0.55, 0.5, tie, [-d.x, -d.y, -d.z]);
    prev = q; }
  await env.ctx.yield();
  // T-pylons every 45 m over the desert; short stands on the deck; raking struts under the climb
  const py = { col: ink.paper, mark: [0.9, 0, 0.24] };
  for (let s = -160; s < path.length - 20; s += 45) { const q = railAt(s);
    if (q[2] < 570) { G.beam([q[0], 0, q[2]], [q[0], q[1] - 1.1, q[2]], 2.2, 2.2, py); G.beam([q[0] - 3.4, q[1] - 0.75, q[2]], [q[0] + 3.4, q[1] - 0.75, q[2]], 1.5, 0.9, py); G.lathe([[3.2, 0], [2.4, 0.9], [1.3, 1.3]], 8, { ...py, m: M4(q[0], 0, q[2]) }); }
    else if (q[1] > DECK_Y + 2.2) { G.beam([q[0], DECK_Y, Math.min(q[2] + (q[1] - DECK_Y) * 0.25, 1694)], [q[0], q[1] - 0.3, q[2]], 1.6, 1.6, py); } }
  for (let z = 577; z < 1560; z += 22.5) G.beam([0, DECK_Y, z], [0, DECK_Y + 0.55, z], 2.2, 1.4, py);
  // the causeway: a deck 60 m wide on legs, cyan screen on top (it swells under smoke), hazard edges, seams, a pipe each side
  G.set(night ? 0.3 : 0.13, 0);
  G.beam([0, DECK_Y - 0.8, 562], [0, DECK_Y - 0.8, 1704], 60, 1.6, { col: ink.paper, mark: [0.75, 0, 0.3] });
  G.set(0, 0);
  G.beam([0, DECK_Y - 0.85, 561.2], [0, DECK_Y - 0.85, 562.3], 60.6, 1.8, { col: ink.paper, mark: [0.9, 0, 0.3] }); G.beam([0, DECK_Y - 0.85, 1703.7], [0, DECK_Y - 0.85, 1704.8], 60.6, 1.8, { col: ink.paper, mark: [0.9, 0, 0.3] });
  for (const sx of [-1, 1]) G.beam([sx * 30.1, DECK_Y - 0.85, 562], [sx * 30.1, DECK_Y - 0.85, 1704], 0.5, 1.8, { col: ink.paper, mark: [0.9, 0, 0.3] });
  for (let z = 580; z < 1700; z += 45) for (const sx of [-1, 1]) G.beam([sx * 23, 0, z], [sx * 23, DECK_Y - 1.6, z], 3, 3, { col: ink.paper, mark: [0.9, 0, 0.26] });
  for (const sx of [-1, 1]) { G.beam([sx * 28.6, DECK_Y + 0.06, 562], [sx * 28.6, DECK_Y + 0.06, 1704], 2.4, 0.12, { col: cY, mark: [0, 0, 0.1] });
    G.beam([sx * 26.4, DECK_Y + 0.7, 566], [sx * 26.4, DECK_Y + 0.7, 1700], 1.1, 1.1, { col: ink.paper, mark: [0.8, 0, 0.16] });
    G.beam([sx * 3.6, DECK_Y + 0.05, 566], [sx * 3.6, DECK_Y + 0.05, 1560], 0.4, 0.1, { col: ink.black, mark: [0, 0, 0] }); }
  for (let z = 573; z < 1700; z += 22.5) G.beam([-27, DECK_Y + 0.05, z], [27, DECK_Y + 0.05, z], 0.1, 0.34, { col: ink.black, mark: [0, 0, 0] }, [0, 0, 1]);
  for (let z = 584; z < 1700; z += 15) for (const sx of [-1, 1]) G.beam([sx * 27.5, DECK_Y + 0.14, z], [sx * 29.7, DECK_Y + 0.14, z + 2.2], 0.1, 1.1, { col: ink.black, mark: [0, 0, 0] }, [0, 0, 1]);   // hazard chevrons
  await env.ctx.yield();
  // drums under the pads (they overhang the deck) and a fuel sphere opposite each pad
  const pads = env.hero.anchors.pads;
  for (const pd of pads) { const x = pd.position[0], z = pd.position[2] + ROW_Z;
    G.lathe([[24, 0], [26.4, 1.2], [26.4, DECK_Y - 1.3]], 22, { col: ink.paper, mark: [0.85, 0, 0.3], m: M4(x, 0, z) }); }
  pair(env, G.finish(), { A: 'cyan', map: 0, pitch: 1.6, swell: 0.75, angA: 0.2618 });
  const S = geoBuilder();
  S.set(1, 0); S.lathe(ballProfile(5.6, 8.4, 12), 16, { col: ink.paper, mark: [0, 0, 0.3] }); S.set(0, 0);
  S.lathe([[6.1, 8.0, cY], [6.1, 8.8, cY]], 16, { col: cY, mark: [0, 0, 0.12] });
  for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + 0.6; S.beam([Math.cos(a) * 5.2, 0, Math.sin(a) * 5.2], [Math.cos(a) * 3.6, 6.2, Math.sin(a) * 3.6], 0.6, 0.6, { col: ink.paper, mark: [0.9, 0, 0.14] }); }
  S.lathe([[0.5, 14], [0.4, 16.2], [0.9, 16.6, cWarm], [0, 17.4, cWarm]], 6, { col: ink.paper, mark: [0, 0, 0.12] });
  instPair(env, S.finish(), pads.map((pd) => M4(-pd.side * 21, DECK_Y, pd.position[2] + ROW_Z + 6, pd.position[2] * 0.01)), { A: 'cyan', map: 2, cells: 7, ball: 5.6, axis: [0.15, -1, 0.25], edge: [-0.25, 0.7], toneA: 0.7 });
});

// ---------------------------------------------------------------- the rocket sled, built round the camera
// Camera space: -Z ahead, +X right, +Y up. Nose spike in the lower centre, a chrome canopy hoop across the top
// corners, two gleams on the glass that slide when we bank, two stub fins with pods and black speed lines.
PART_BUILDERS.push(async (env) => {
  const { ink, style, path } = env, O = ink.orange, Y = ink.yellow, P = ink.paper, K = ink.black;
  const G = geoBuilder(), sled = new THREE.Group(); sled.matrixAutoUpdate = false;
  const fwd = (x, y, z, pitch = 0.07) => new THREE.Matrix4().makeTranslation(x, y, z).multiply(new THREE.Matrix4().makeRotationX(-Math.PI / 2 + pitch));
  const Mn = fwd(0, -1.74, -0.7);
  G.lathe([[0, -0.5, K], [0.8, -0.5, K], [0.99, 0.0, O], [1.02, 0.6, O], [0.95, 1.2, O], [0.95, 1.2, Y], [0.85, 1.65, Y], [0.85, 1.65, O], [0.62, 2.4, O], [0.42, 2.95, O], [0.42, 2.95, P], [0.3, 3.3, P], [0.3, 3.3, O],
    [0.16, 3.9, O], [0.07, 4.3, O], [0.07, 4.3, P], [0.12, 4.42, P], [0, 4.6, P]], 20, { m: Mn, col: O, mark: [0.62, 0, 0.05] });
  // a yellow flash down the spine and the cockpit coaming
  G.plate([[-0.13, 0.1], [0.13, 0.1], [0.05, 2.9], [-0.05, 2.9]], 0.04, { m: Mn.clone().multiply(new THREE.Matrix4().makeTranslation(0, 0, 1.0)), col: Y, mark: [0, 0, 0.022] }, 0.1);
  for (const sx of [-1, 1]) {
    const Mp = fwd(sx * 2.55, -1.3, -1.75, 0.03);
    G.lathe([[0, -0.35, K], [0.2, -0.35, K], [0.3, 0, O], [0.31, 0.7, O], [0.31, 0.7, Y], [0.29, 0.95, Y], [0.29, 0.95, O], [0.18, 1.5, O], [0.18, 1.5, P], [0, 1.95, P]], 12, { m: Mp, col: O, mark: [0.6, 0, 0.035] });
    G.plate([[sx * 1.0, 0.3], [sx * 2.3, 1.75], [sx * 2.3, 2.5], [sx * 1.0, 1.5]], 0.07, { m: new THREE.Matrix4().makeTranslation(0, -1.34, 0).multiply(new THREE.Matrix4().makeRotationX(-Math.PI / 2)), col: O, mark: [0.5, 0, 0.035] }, 0.2, Y);
    // speed lines: tapered black strokes streaming back off the pod toward the corner of the frame
    for (let i = 0; i < 4; i++) { G.set(0, 0, [1, 0.035 + 0.02 * i, i * 1.9 + sx, 19 + i * 5]);
      const y = -1.22 - 0.1 * i, x0 = sx * (2.5 + 0.13 * i - 0.2), x1 = sx * (2.95 + 0.35 * i), w = 0.035 + 0.012 * (i % 2);
      const o = { col: K, mark: [0, 0, 0] }, a = G.vert(o, x0, y + w, -1.45, 0, 0, 1, 0, 0, 1), b = G.vert(o, x0, y - w, -1.45, 0, 0, 1, 0, 0, 1), c = G.vert(o, x1, y - 0.25 - 0.1 * i, -0.15, 0, 0, 1, 0, 0, 1);
      G.tri(a, b, c); G.tri(a, c, b); }
    G.set();
  }
  // canopy hoop: a tube on a circle in the plane z = -1.3 (bare-paper chrome)
  const hz = -1.3, hc = -1.75, hr = 3.05, tr = 0.115, NM = 56, Nm = 8, base = G.vertexCount, ho = { col: P, mark: [0.35, 0, 0.03] };
  for (let i = 0; i <= NM; i++) { const a = lerp(0.12, Math.PI - 0.12, i / NM), cx = Math.cos(a), cy = Math.sin(a);
    for (let j = 0; j <= Nm; j++) { const b = (j / Nm) * TAU, nx = cx * Math.cos(b), ny = cy * Math.cos(b), nz = Math.sin(b);
      G.vert(ho, cx * hr + nx * tr, hc + cy * hr + ny * tr, hz + nz * tr, nx, ny, nz, nx, ny, nz); } }
  for (let i = 0; i < NM; i++) for (let j = 0; j < Nm; j++) { const a = base + i * (Nm + 1) + j, b = a + Nm + 1; G.tri(a, b, a + 1); G.tri(a + 1, b, b + 1); }
  const [pm, hm] = pair(env, G.finish(), { A: 'magentaOnYellow' }); env.scene.remove(pm, hm); sled.add(pm, hm);
  // gleams on the glass: two slanted bare-paper bars in a thin line; they slide across when the sled banks
  const GL = geoBuilder();
  for (const [dx, w] of [[0, 0.04], [0.085, 0.016]]) GL.plate([[dx, 0], [dx + w, 0], [dx + w + 0.13, 0.22], [dx + 0.13, 0.22]], 0.006, { col: P, mark: [0, 0, 0.006] }, 0.02);
  const [gp, gh] = pair(env, GL.finish()); env.scene.remove(gp, gh); const gleam = new THREE.Group(); gleam.add(gp, gh); sled.add(gleam);
  // the sled's own dots: a band of cyan discs round the hoop, magenta discs under the nose's cheeks
  const Dc = makeDots(), Dm = makeDots(), v = new THREE.Vector3(), n = new THREE.Vector3();
  for (let i = 0; i < 150; i++) for (let j = 0; j < 2; j++) { const a = lerp(0.14, Math.PI - 0.14, (i + j * 0.5) / 150), b = 1.25 + j * 0.55, cx = Math.cos(a), cy = Math.sin(a);
    n.set(cx * Math.cos(b), cy * Math.cos(b), Math.sin(b)); v.set(cx * hr, hc + cy * hr, hz).addScaledVector(n, tr);
    Dc.add(v, n, 0.2 + 0.5 * Math.pow(Math.abs(Math.sin(a * 3.0 + 0.4)), 1.5), 0.062); }
  for (let i = 0; i < 26; i++) for (let j = 0; j < 30; j++) { const yy = 0.1 + i * 0.105, th = (j + (i % 2) * 0.5) / 30 * TAU, side = Math.cos(th), up = Math.sin(th);
    if (up < -0.2 || yy > 2.9) continue; const r = yy < 0.6 ? lerp(0.99, 1.02, yy / 0.6) : yy < 1.2 ? lerp(1.02, 0.95, (yy - 0.6) / 0.6) : yy < 1.65 ? lerp(0.95, 0.85, (yy - 1.2) / 0.45) : yy < 2.4 ? lerp(0.85, 0.62, (yy - 1.65) / 0.75) : lerp(0.62, 0.42, (yy - 2.4) / 0.55);
    const tone = 0.62 * smoothstep(0.15, 0.95, Math.abs(side)) * (yy > 1.2 && yy < 1.65 ? 1 : 0.0); if (tone < 0.03) continue;
    v.set(side * r, yy, up * r).applyMatrix4(Mn); n.set(side, 0.1, up).transformDirection(Mn); Dm.add(v, n, tone, 0.105); }
  const dc = Dc.build(style.dotMaterial('cyan', 'paper')), dm = Dm.build(style.dotMaterial('magenta', 'yellow')); sled.add(dc, dm);
  env.scene.add(sled);
  const S = new THREE.Matrix4(), R = new THREE.Matrix4(), t0 = new THREE.Vector3(), t1 = new THREE.Vector3(); let roll = 0;
  env.parts.push({ update(dt, time, camera, u) {
    path.tangentAt(u, t0); path.tangentAt(Math.min(u + 0.012, 1), t1);
    const turn = clamp((t0.z * t1.x - t0.x * t1.z) * 9, -1, 1); roll += (turn - roll) * Math.min(1, dt * 3);
    const aspect = camera.projectionMatrix.elements[5] / Math.max(camera.projectionMatrix.elements[0], 1e-4), kx = clamp(aspect / 1.777, 0.42, 1.35);
    const drop = (1 - ease(u / 0.014)) * 1.9 + 0.012 * Math.sin(time * 23) + 0.02 * Math.sin(time * 7.3);
    S.makeScale(kx, 1, 1).setPosition(0, -drop, 0); R.makeRotationZ(roll * 0.1);
    sled.matrix.copy(camera.matrixWorld).multiply(R).multiply(S); sled.matrixWorldNeedsUpdate = true;
    gleam.position.set(1.15 + roll * 1.0 + 0.04 * Math.sin(time * 0.9), 0.28 + 0.02 * Math.sin(time * 1.3), -1.22);
  } });
});

// ---------------------------------------------------------------- mesa country, the far mesas, their shadows, the horizon line
// A mesa is one of two seeded shapes (local radius about 100, height 140), instanced. Near ones carry the land's own
// two plates round their cliffs; far ones are the far plate only (cyan dots in a black outline): plates drop out with distance.
function mesaGeo(rng, topTone, cliffA, cliffB, talusA, talusB, ink, segs = 30) {
  const G = geoBuilder(), f = [rng.range(0, TAU), rng.range(0, TAU), rng.range(0, TAU), rng.range(0, TAU)];
  const rad = (a) => 1 + 0.2 * Math.sin(2 * a + f[0]) + 0.11 * Math.sin(3 * a + f[1]) + 0.07 * Math.sin(7 * a + f[2]) + 0.045 * Math.sin(13 * a + f[3]);
  const drad = (a) => 0.4 * Math.cos(2 * a + f[0]) + 0.33 * Math.cos(3 * a + f[1]) + 0.49 * Math.cos(7 * a + f[2]) + 0.585 * Math.cos(13 * a + f[3]);
  const rings = [[1.62, 0, 0.55, talusA, talusB], [1.16, 36, 0.55, talusA, talusB], [1.03, 42, 0.05, cliffA, cliffB], [0.99, 92, 0.03, cliffA, cliffB], [0.94, 96, 0.3, cliffA, cliffB * 0.6],
    [0.9, 128, 0.02, cliffA, cliffB], [0.93, 134, -0.2, cliffA, cliffB], [0.86, 140, 0.9, topTone, 0], [0, 141, 1, topTone, 0]];
  const o = { col: ink.paper, mark: [0.92, 0, 0.9] }, idx = [];
  rings.forEach(([k, y, ny, a, b], ri) => { G.set(a, b); const row = [];
    for (let s = 0; s <= segs; s++) { const th = (s / segs) * TAU, r = 100 * k * (ri < 2 ? 1 + (rad(th) - 1) * 0.6 : rad(th)), dr = drad(th) / rad(th);
      const c = Math.cos(th), sn = Math.sin(th); let nx = c + dr * sn, nz = sn - dr * c; const l = Math.hypot(nx, nz) || 1, h = Math.sqrt(Math.max(1 - ny * ny, 0)); nx = (nx / l) * h; nz = (nz / l) * h;
      row.push(G.vert(o, c * r, y, sn * r, nx, ny, nz, nx, ny, nz)); }
    idx.push(row); });
  for (let i = 0; i < rings.length - 1; i++) for (let s = 0; s < segs; s++) { const a = idx[i][s], b = idx[i + 1][s], c = idx[i][s + 1], d = idx[i + 1][s + 1]; G.tri(a, b, c); if (i < rings.length - 2) G.tri(c, b, d); }
  return G.finish();
}
PART_BUILDERS.push(async (env) => {
  const { ink, rng, ed, edKey, style } = env, L = ed.land, night = edKey === 'night';
  const tb = L.B[2] > 0 ? 1 : 0;
  // near set: [x, z, scale, height scale, turn]
  const near = [[150, 150, 0.62, 0.78, 0.3], [-330, 250, 1.0, 1.15, 1.9], [440, 560, 1.25, 1.42, 4.0], [-640, 880, 1.6, 1.55, 2.6], [760, 1250, 1.5, 1.05, 5.2], [-400, 1490, 0.85, 0.86, 0.9],
    [640, 190, 1.3, 1.2, 3.3], [-930, 430, 1.8, 1.3, 1.1]];
  const gA = mesaGeo(rng, 0.25, L.A[2] * 1.1, 0.95 * tb, L.A[2] * 0.9, 0.5 * tb, ink); await env.ctx.yield();
  const gB = mesaGeo(rng, 0.25, L.A[2] * 1.1, 0.95 * tb, L.A[2] * 0.9, 0.5 * tb, ink); await env.ctx.yield();
  const po = { A: L.A[0], B: L.B[0], angA: L.A[1], angB: L.B[1], regA: L.A[0] === 'cyan' ? 0.25 : 0, regB: 1, map: 1, pitch: 7, ball: 100, toneA: 1, toneB: 0.6 };
  instPair(env, gA, near.filter((_, i) => i % 2 === 0).map((m) => M4(m[0], 0, m[1], m[4], m[2], m[3])), po, { width: 1 });
  instPair(env, gB, near.filter((_, i) => i % 2 === 1).map((m) => M4(m[0], 0, m[1], m[4], m[2], m[3])), po, { width: 1 });
  // far set: the far plate only
  const gF = mesaGeo(rng, 0.0, L.C[2] * 1.5, 0, L.C[2] * 0.8, 0, ink, 18), far = [];
  for (let i = 0; i < 13; i++) { const a = (i / 13) * TAU + rng.range(-0.15, 0.15), d = rng.range(1900, 3400), x = Math.sin(a) * d, z = 900 + Math.cos(a) * d * 1.15;
    if (Math.abs(x) < 520 && z > 0) continue;
    far.push(M4(x, 0, z, rng.range(0, TAU), rng.range(1.7, 3.2), rng.range(1.3, 2.6))); }
  instPair(env, gF, far, { A: L.C[0], angA: L.C[1], map: 1, pitch: 26, ball: 100, toneA: 1 }, { width: 1.4 });
  await env.ctx.yield();
  // shadows: solid key black with a toothed edge, thrown away from the sun; and the horizon as one brush line
  const G = geoBuilder(), noon = style.uniforms.uNoon.value, sl = Math.hypot(noon.x, noon.z) / Math.max(noon.y, 0.2), sdx = -noon.x / (Math.hypot(noon.x, noon.z) || 1), sdz = -noon.z / (Math.hypot(noon.x, noon.z) || 1);
  const blob = (x, z, r, len, y = 0.07, n = 40) => { const o = { col: ink.black, mark: [0, 0, 0] }, cx = x + sdx * len * 0.5, cz = z + sdz * len * 0.5, c0 = G.vert(o, cx, y, cz, 0, 1, 0, 0, 1, 0), ring = [];
    for (let i = 0; i < n; i++) { const a = (i / n) * TAU, tooth = (i % 2 ? 1 : 0.86) * (0.92 + 0.16 * rng()), u = Math.cos(a) * (r + len * 0.5) * tooth, w = Math.sin(a) * r * tooth;
      ring.push(G.vert(o, cx + sdx * u - sdz * w, y, cz + sdz * u + sdx * w, 0, 1, 0, 0, 1, 0)); }
    for (let i = 0; i < n; i++) G.tri(c0, ring[(i + 1) % n], ring[i]); };
  env.blob = blob; env.shadowGeo = G;
  if (!night) for (const m of near) blob(m[0], m[1], 100 * m[2] * 1.05, 140 * m[3] * sl * 0.9);
  env.parts.push({ update() {} });
});

// ---------------------------------------------------------------- the city: bubble domes with towers and gardens inside
// A dome is glass, so it is printed as the comic would: the far inside of the shell in bare paper inside a brush
// outline, the towers in flat colour, then the near shell overprinted (multiply) with a crescent of cyan dots, and a
// window-shaped gleam knocked out of everything on the sunny side.
const DOMES = [[70, 430, 55], [62, 325, 22], [152, 360, 30], [118, 520, 27], [215, 470, 38], [70, 548, 16], [-75, 330, 25], [-110, 400, 34], [-95, 475, 20], [-150, 520, 42], [-70, 535, 15]];
PART_BUILDERS.push(async (env) => {
  const { ink, rng, dens, style, edKey, cWarm, cY } = env, night = edKey === 'night';
  const domes = DOMES.filter((d, i) => i < 5 || dens > 0.8 + 0.07 * (i - 5) || i === 6 || i === 9); env.domes = domes;
  const mats = domes.map(([x, z, r]) => M4(x, 0, z, 0, r));
  const SG = geoBuilder(); SG.set(1, 0); SG.lathe(ballProfile(1, 0, 10, undefined, 0.5, 1), 28, { col: ink.paper, mark: [0, 0, 0.5] });
  const shell = SG.finish();
  instPair(env, shell, mats, { side: THREE.BackSide, toneA: 0 }, { width: 1 });
  const noon = style.uniforms.uNoon.value, glass = new THREE.InstancedMesh(shell, env.W.paper({ glass: true, A: 'cyan', map: 2, cells: 15, ball: 40, axis: [-noon.x, -0.25, -noon.z], edge: [0.25, 0.97], toneA: 0.8, swell: 0 }), mats.length);
  mats.forEach((m, i) => glass.setMatrixAt(i, m)); glass.frustumCulled = false; glass.renderOrder = 2; env.scene.add(glass);
  // floors, base rings, towers, gardens and gleams: one merged geometry in world space
  const G = geoBuilder(), cols = night ? [ink.paper, ink.cyan, ink.paper] : [cY, cWarm, ink.cyan, ink.paper, ink.paper];
  let di = 0;
  for (const [x, z, r] of domes) {
    G.lathe([[r * 1.0, 0.05, cY], [r * 1.04, 0.05, cY], [r * 1.04, r * 0.05 + 0.4, cY], [r * 1.0, r * 0.05 + 0.6, cY]], 36, { m: M4(x, 0, z), col: cY, mark: [0.7, 0, 0.3] });
    G.lathe([[r * 0.99, 0.3, night ? ink.paper : ink.green], [0, 0.3, night ? ink.paper : ink.green]], 20, { m: M4(x, 0, z), col: ink.green, mark: [0, 0, 0] });
    const nT = Math.max(3, Math.round(r / 6.5));
    for (let k = 0; k < nT; k++) { const a = rng() * TAU, d = r * (k === 0 ? 0 : rng.range(0.22, 0.68)), tx = x + Math.cos(a) * d, tz = z + Math.sin(a) * d;
      const hmax = Math.sqrt(Math.max(r * r - (d + r * 0.12) * (d + r * 0.12), 1)) * 0.84, h = hmax * rng.range(0.7, 1), w = clamp(r * rng.range(0.05, 0.085), 1.1, 4.5), c1 = cols[(k + di) % cols.length], c2 = cols[(k + di + 1) % cols.length];
      const kind = (k + di) % 3, o = { m: M4(tx, 0.3, tz, rng() * TAU), col: c1, mark: [0.75, 0, 0.3] };
      if (kind === 0) G.lathe([[w, 0], [w * 0.8, h * 0.62], [w * 1.5, h * 0.66, c2], [w * 1.5, h * 0.7, c2], [w * 0.55, h * 0.74], [w * 0.4, h * 0.9], [0.12, h * 0.93, ink.paper], [0.1, h, ink.paper]], 10, o);
      else if (kind === 1) G.lathe([[w * 0.7, 0], [w * 0.55, h * 0.72], ...ballProfile(w * 1.25, h * 0.82, 6, c2).slice(1, 6), [w * 0.3, h * 0.93], [0, h]], 10, o);
      else G.lathe([[w * 1.1, 0], [w * 1.1, h * 0.3], [w * 0.8, h * 0.32, c2], [w * 0.8, h * 0.56, c2], [w * 0.55, h * 0.58], [w * 0.5, h * 0.8], [w * 0.9, h * 0.84, c2], [0, h * 0.97, c2]], 8, o); }
    for (let k = 0; k < Math.round(r / 5); k++) { const a = rng() * TAU, d = r * rng.range(0.3, 0.86), s = rng.range(1.2, 2.6) * Math.min(1, r / 30 + 0.4);
      G.lathe(ballProfile(s, s * 0.55, 5, night ? ink.cyan : ink.green, 0.3, 1), 8, { m: M4(x + Math.cos(a) * d, 0.3, z + Math.sin(a) * d), col: ink.green, mark: [0.5, 0, 0.22] }); }
    // the gleam: four panes of a window, lying on the shell toward the sun and the oncoming sled
    const gd = new THREE.Vector3(noon.x * 0.5 - Math.sign(x) * 0.55, 0.62, -0.42).normalize(), gs = r * 0.105;
    const Mg = new THREE.Matrix4().lookAt(gd, new THREE.Vector3(), new THREE.Vector3(0, 1, 0)).setPosition(x + gd.x * r * 1.012, gd.y * r * 1.012, z + gd.z * r * 1.012);
    for (const [px, py] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) G.plate([[px * 1.1 - 0.9 + py * 0.25, py * 1.1 - 0.9], [px * 1.1 + 0.9 + py * 0.25, py * 1.1 - 0.9], [px * 1.1 + 0.9 + py * 0.25 + 0.4, py * 1.1 + 0.9], [px * 1.1 - 0.9 + py * 0.25 + 0.4, py * 1.1 + 0.9]].map((p) => [p[0] * gs, p[1] * gs]), 0.06,
      { m: Mg, col: ink.paper, mark: [0, 0, 0.12] }, 0.03);
    if (env.blob && !night) env.blob(x, z, r * 0.98, r * 0.55, 0.09);
    di++; if (di % 3 === 0) await env.ctx.yield();
  }
  const [cp, ch] = pair(env, G.finish()); cp.renderOrder = 1; ch.renderOrder = 1;
});

// ---------------------------------------------------------------- two monorail loops and their three-car trains
// Loop one is a long ellipse round the city, 22 m up, that the rail passes under twice (z 300 and z 500); loop two
// circles the great dome higher up. A train's place is keyed to the journey clock so one passes over as we go under.
PART_BUILDERS.push(async (env) => {
  const { ink, path, edKey, cWarm, cY } = env, night = edKey === 'night', G = geoBuilder();
  const loops = [{ f: (a) => [210 * Math.cos(a), 23, 400 + 100 * Math.sin(a)], v: 44, at: [1.676, 10.3], n: 72 }, { f: (a) => [70 + 73 * Math.cos(a), 41, 430 + 73 * Math.sin(a)], v: -27, at: [2.6, 9], n: 48 }];
  const tr = { col: ink.paper, mark: [0.85, 0, 0.2] }, post = { col: ink.paper, mark: [0.9, 0, 0.2] };
  for (const L of loops) { L.pts = []; L.cum = [0];
    for (let i = 0; i <= L.n; i++) { L.pts.push(L.f((i / L.n) * TAU)); if (i) { const a = L.pts[i - 1], b = L.pts[i]; L.cum.push(L.cum[i - 1] + Math.hypot(b[0] - a[0], b[2] - a[2])); } }
    L.len = L.cum[L.n];
    for (let i = 0; i < L.n; i++) { const a = L.pts[i], b = L.pts[i + 1]; G.beam(a, b, 1.5, 1.2, tr);
      if (i % 3 === 0) { const inDome = (env.domes || []).some(([x, z, r]) => Math.hypot(a[0] - x, a[2] - z) < r + 2.5);
        if (!inDome && path.nearestXZ(a[0], a[2]).dist > 13) { G.beam([a[0], 0, a[2]], [a[0], a[1] - 0.6, a[2]], 1.5, 1.5, post); G.lathe([[2.2, 0], [1.4, 1.0], [0.9, 1.2]], 6, { ...post, m: M4(a[0], 0, a[2]) });
          G.beam([a[0], a[1] - 2.2, a[2]], [a[0], a[1] - 0.6, a[2]], 2.6, 2.6, { col: cY, mark: [0.7, 0, 0.16] }); } } }
    // distance d along the loop -> position and heading
    L.at2 = (d, out) => { d = ((d % L.len) + L.len) % L.len; let i = 0; while (i < L.n - 1 && L.cum[i + 1] < d) i++;
      const k = (d - L.cum[i]) / Math.max(L.cum[i + 1] - L.cum[i], 1e-3), a = L.pts[i], b = L.pts[i + 1];
      out.p.set(lerp(a[0], b[0], k), a[1], lerp(a[2], b[2], k)); out.t.set(b[0] - a[0], 0, b[2] - a[2]).normalize(); return out; };
    L.d0 = (L.at[0] / TAU) * L.len; await env.ctx.yield(); }
  pair(env, G.finish());
  // a car: a bullet along its own Y axis (laid along the track by its instance matrix), belts of window, coloured caps
  const C = geoBuilder(), win = night ? ink.paper : ink.cyan;
  C.lathe([[0, -6.6, cWarm], [0.9, -6.1, cWarm], [1.75, -4.6, cWarm], [1.75, -4.6], [1.85, -3.4], [1.85, -3.4, win], [1.85, -2.2, win], [1.85, -2.2], [1.85, -0.6], [1.85, -0.6, win], [1.85, 0.6, win], [1.85, 0.6],
    [1.85, 2.2], [1.85, 2.2, win], [1.85, 3.4, win], [1.85, 3.4], [1.75, 4.6], [1.75, 4.6, cWarm], [0.9, 6.1, cWarm], [0, 6.6, cWarm]], 10, { col: ink.paper, mark: [0.7, 0, 0.26] });
  for (const sg of [1, -1]) C.plate([[sg * 1.6, -5], [sg * 2.5, -4.1], [sg * 2.5, 4.1], [sg * 1.6, 5]], 0.3, { m: new THREE.Matrix4().makeRotationY(-Math.PI / 2), col: cY, mark: [0, 0, 0.1] }, 0.1);     // a fin along the roof and belly
  const cars = instPair(env, C.finish(), Array.from({ length: 6 }, () => new THREE.Matrix4()));
  const o = { p: new THREE.Vector3(), t: new THREE.Vector3() }, m = new THREE.Matrix4(), X = new THREE.Vector3(), Z = new THREE.Vector3(0, 1, 0);
  // speed lines behind the last car of each train
  env.parts.push({ update(dt, time, camera, u, tJ) {
    loops.forEach((L, li) => { for (let c = 0; c < 3; c++) { L.at2(L.d0 + L.v * (tJ - L.at[1]) - Math.sign(L.v) * c * 14.2, o);
      X.crossVectors(o.t, Z).normalize(); m.makeBasis(X, o.t, Z).setPosition(o.p.x, o.p.y + 2.6, o.p.z); cars.set(li * 3 + c, m); } });
    cars.flush();
  } });
});

// ---------------------------------------------------------------- comic-strip plants: bottle trees, trumpet cacti, tumble-burrs
PART_BUILDERS.push(async (env) => {
  const { ink, rng, dens, detail, path, edKey, cWarm, cY, hero } = env, night = edKey === 'night';
  const pads = hero.anchors.pads.map((p) => [p.position[0], p.position[2] + ROW_Z]);
  const free = (x, z, m) => path.nearestXZ(x, z).dist > m && !(env.domes || []).some(([dx, dz, r]) => Math.hypot(x - dx, z - dz) < r + 4) && !pads.some(([px, pz]) => Math.hypot(x - px, z - pz) < 31)
    && !(Math.abs(x) < 33 && z > 556 && z < 1710);
  // bottle tree: a swollen trunk and one ball crown, cyan over yellow (the only green), bobbing on its neck
  const T = geoBuilder();
  T.lathe([[1.0, 0], [1.7, 2.3], [1.3, 5.0], [0.42, 6.7], [0.32, 7.9]], 7, { col: cY, mark: [0.72, 0, 0.17] });
  T.set(1, 0, [1, 0.32, 0, 1.25]); T.lathe(ballProfile(2.3, 9.6, 6), 10, { col: cY, mark: [0.3, 0, 0.2] }); T.set();
  const spots = [], want = Math.round(130 * Math.min(dens, 1.1) * detail);
  const put = (x, z, s, m = 11.5) => { if (spots.length < want && free(x, z, m)) spots.push([x, z, s]); };
  for (let d = 300; d < 560; d += 9.5) for (const sx of [-1, 1]) { const p = path.posAtDist(d + rng.range(-3, 3)); put(p.x + sx * rng.range(12.5, 19), p.z, rng.range(0.75, 1.3), 12); }     // the avenue through the city
  for (let i = 0; i < 26; i++) { const a = rng.range(2.2, 4.4); put(150 + Math.cos(a) * rng.range(98, 128), 150 + Math.sin(a) * rng.range(98, 128), rng.range(0.7, 1.4)); }               // round the nearest mesa's foot
  for (let c = 0; c < 8; c++) { const cx = (c % 2 ? 1 : -1) * rng.range(36, 100), cz = 25 + c * 36 + rng.range(-10, 10); for (let i = 0; i < 6; i++) put(cx + rng.gauss() * 9, cz + rng.gauss() * 12, rng.range(0.6, 1.35)); }
  for (let c = 0; c < 16; c++) { const cx = (c % 2 ? 1 : -1) * rng.range(40, 105), cz = 590 + c * 70 + rng.range(-20, 20); for (let i = 0; i < 6; i++) put(cx + rng.gauss() * 12, cz + rng.gauss() * 16, rng.range(0.8, 1.45)); }
  for (let i = 0; i < 80 && spots.length < want; i++) put(rng.range(-190, 190), rng.range(290, 570), rng.range(0.7, 1.3));
  const axis = [0.25, -1, 0.2];
  instPair(env, T.finish(), spots.map(([x, z, s]) => M4(x, 0, z, rng() * TAU, s, s * rng.range(0.85, 1.2))), { A: 'cyan', map: 2, cells: 5, ball: 2.3, axis, edge: [-1.4, 0.35], toneA: 0.78 });
  if (env.blob && !night) for (const [x, z, s] of spots) env.blob(x, z, 1.9 * s, 3.2 * s, 0.08, 9);
  await env.ctx.yield();
  // trumpet cactus: a ribbed stalk and a tilted bell; the whole plant turns slowly, so the mouths sweep round
  const C = geoBuilder(), stem = night ? ink.paper : ink.green, bell = cWarm;
  C.set(0, 0, [3, 0, 0, 0.35]);
  C.lathe([[0.55, 0], [0.75, 1.4], [0.42, 3.4]], 5, { col: stem, mark: [0.7, 0, 0.12] });
  C.lathe([[0.3, 0, stem], [0.38, 0.9, stem], [0.7, 1.6, bell], [1.45, 2.3, bell], [1.5, 2.45, bell], [1.2, 2.3, ink.black], [0.2, 1.3, ink.black]], 7,
    { m: new THREE.Matrix4().makeTranslation(0, 3.1, 0).multiply(new THREE.Matrix4().makeRotationZ(-0.95)), col: bell, mark: [0.5, 0, 0.13] });
  C.lathe([[0.3, 0], [0.42, 1.0], [0, 2.1]], 4, { m: new THREE.Matrix4().makeTranslation(-0.8, 0.9, 0.3).multiply(new THREE.Matrix4().makeRotationZ(0.5)), col: stem, mark: [0.7, 0, 0.1] });
  const cm = [], nc = Math.round(24 * Math.min(dens, 1.1) * detail);
  for (let c = 0; c < nc; c++) { const d = rng.range(75, 560), p = path.posAtDist(d), sx = rng.chance(0.5) ? 1 : -1, off = rng.range(11, 44), n = rng.int(2, 4);
    for (let i = 0; i < n; i++) { const x = p.x + sx * off + rng.gauss() * 2.6, z = p.z + rng.gauss() * 2.6; if (free(x, z, 9)) cm.push(M4(x, 0, z, rng() * TAU, rng.range(0.8, 1.35))); } }
  instPair(env, C.finish(), cm);
  await env.ctx.yield();
  // tumble-burrs: black scribbled balls bowling over the sand, faster in the gust after each launch
  const B = geoBuilder(), nb = 14;
  for (let i = 0; i < 9; i++) { const a = rng() * TAU, b = rng() * TAU; B.plate(Array.from({ length: 14 }, (_, k) => { const t = (k / 14) * TAU, r = k % 2 ? 0.55 : 1.15; return [Math.cos(t) * r, Math.sin(t) * r]; }), 0.05,
    { m: new THREE.Matrix4().makeRotationY(a).multiply(new THREE.Matrix4().makeRotationX(b)), col: ink.black, mark: [0, 0, 0.03] }, 0.5); }
  const burrGeo = B.finish(), burrs = new THREE.InstancedMesh(burrGeo, env.W.paper({ side: THREE.DoubleSide }), nb); burrs.frustumCulled = false; env.scene.add(burrs);
  const bd = Array.from({ length: nb }, (_, i) => ({ z: 30 + i * 37 + rng.range(-8, 8), x0: rng.range(-90, 90), v: rng.range(5, 9) * (rng.chance(0.5) ? 1 : -1), s: rng.range(0.9, 1.5), ph: rng() * 9, x: 0 }));
  for (const b of bd) b.x = b.x0;
  const q = new THREE.Quaternion(), e = new THREE.Euler(), m = new THREE.Matrix4(), v3 = new THREE.Vector3(), s3 = new THREE.Vector3(), ign = hero.anchors.ignition;
  env.parts.push({ update(dt, time, camera, u, tJ) {
    const since = ((tJ - ign.first) % ign.every + ign.every) % ign.every, gust = tJ > ign.first ? 1 + 2.4 * Math.exp(-since * 0.9) : 1;
    for (let i = 0; i < nb; i++) { const b = bd[i]; b.x += b.v * gust * Math.min(dt, 0.1); if (b.x > 110) b.x -= 220; if (b.x < -110) b.x += 220;
      const hop = Math.abs(Math.sin(time * 2.1 + b.ph)) * 1.3 * b.s; e.set(time * 1.3 + b.ph, 0, -b.x / b.s); q.setFromEuler(e);
      m.compose(v3.set(b.x, 1.1 * b.s + hop, b.z), q, s3.setScalar(b.s)); burrs.setMatrixAt(i, m); }
    burrs.instanceMatrix.needsUpdate = true;
  } });
});

// ---------------------------------------------------------------- gas-bag grazers (or, by seed, stilt-legged striders)
// Thirty animals in three herds. A grazer is a yellow balloon with magenta dot shading underneath (laid on the ball,
// so the dots travel with it), a frill of fins and six feeding trunks; it breathes, vents a scalloped puff and bobs,
// and the herd turns its blunt heads toward each launch. Herd one crosses 30 m over the rail at z 235 as we pass
// under at 5 s; the four animals nearest the sled throw the moving shadows (uShadow 4-7) that swell the plain's dots.
PART_BUILDERS.push(async (env) => {
  const { ink, rng, style, edKey, cWarm, cY, hero, striders } = env, night = edKey === 'night', G = geoBuilder();
  const toZ = new THREE.Matrix4().makeRotationX(Math.PI / 2), LEG = 22;
  G.set(1, 0, [2, 0.45, 0, 1.26]);
  G.lathe(Array.from({ length: 8 }, (_, i) => { const t = (i / 7 - 0.5) * Math.PI; return [Math.max(4.3 * Math.cos(t) * (1 + 0.12 * Math.sin(t)), 0), 9 * Math.sin(t)]; }), 10, { m: toZ, col: cY, mark: [0.25, 0, 0.3] });
  G.set(0, 0, [4, 0.5, 0, 3.1]);
  for (let i = 0; i < 5; i++) { const z = -6.5 + i * 2.9, h = 2.6 - Math.abs(i - 1.6) * 0.45;                      // the dorsal frill
    G.plate([[z - 1.2, 3.2], [z + 0.2, 3.9 + h], [z + 1.3, 3.2]], 0.25, { m: new THREE.Matrix4().makeRotationY(-Math.PI / 2), col: cWarm, mark: [0, 0, 0.14] }, 0.2); }
  for (const sx of [-1, 1]) G.plate([[sx * 3.6, -1.5], [sx * 8.2, -4.6], [sx * 7.4, -0.6], [sx * 3.9, 1.6]], 0.2, { m: new THREE.Matrix4().makeRotationX(Math.PI / 2 - 0.25), col: cWarm, mark: [0, 0, 0.14] }, 0.2);   // side fins
  G.set(0, 0);
  for (const sx of [-1, 1]) { const Me = new THREE.Matrix4().makeTranslation(sx * 2.5, 1.3, 7.1);                   // eyes
    G.lathe(ballProfile(0.85, 0, 4), 6, { m: Me, col: ink.paper, mark: [0, 0, 0.12] }); G.lathe(ballProfile(0.42, 0, 3), 5, { m: new THREE.Matrix4().makeTranslation(sx * 2.75, 1.35, 7.75), col: ink.black, mark: [0, 0, 0] }); }
  const nl = striders ? 4 : 6;
  for (let i = 0; i < nl; i++) { const sx = i % 2 ? 1 : -1, z = striders ? (i < 2 ? 4.5 : -4.5) : -4 + Math.floor(i / 2) * 4.2, x = sx * (striders ? 2.6 : 1.5), len = striders ? LEG : rng.range(7, 11);
    G.set(0, 0, [1, striders ? 0.0 : 0.55, i * 1.7, 0.9]);
    G.lathe(striders ? [[0.9, -len - 3.4, ink.black], [0.28, -len - 2.6], [0.4, -len * 0.5 - 3], [0.55, -len * 0.5 - 2.4, cWarm], [0.4, -len * 0.5 - 1.8], [0.7, -3]] : [[0.42, -len - 3, cWarm], [0.2, -len - 2.6], [0.3, -len * 0.5 - 3], [0.6, -3.2]], 5,
      { m: new THREE.Matrix4().makeTranslation(x, 0, z), col: cY, mark: [0.5, 0, 0.12] }); }
  const N = 30, geo = G.finish(), herd = instPair(env, geo, Array.from({ length: N }, () => new THREE.Matrix4()),
    { A: night ? 'cyan' : 'magentaOnYellow', map: 2, cells: 6, ball: 7, axis: [0, -1, 0], edge: [-0.2, 0.8], toneA: 0.72, regA: 1 });
  // the vented puff: three scallops, grown and let go behind the animal
  const P = geoBuilder(); for (const [x, y, z, r] of [[0, 0, 0, 1], [0.9, 0.4, -0.5, 0.7], [-0.7, 0.5, -0.8, 0.6]]) P.lathe(ballProfile(r, 0, 4), 7, { m: new THREE.Matrix4().makeTranslation(x, y, z), col: ink.paper, mark: [0, 0, 0.16] });
  const puffs = instPair(env, P.finish(), Array.from({ length: N }, () => new THREE.Matrix4().makeScale(0, 0, 0)));
  // herds: centre(tJ, time), animals scattered round it
  const fly = striders ? LEG + 3.4 : 0;
  const herds = [
    striders ? { c: (tJ) => [46 + 2 * Math.sin(tJ * 0.2), fly, 150 + 3.5 * tJ], head: 0, sx: 12, sz: 60 } : { c: (tJ) => [-8 + 6.5 * (tJ - 5), 43, 236], head: Math.PI / 2, sx: 36, sz: 26 },
    { c: (tJ, t) => [striders ? -70 : 62 + 4 * Math.sin(t * 0.05), striders ? fly : 22, 215 + 1.2 * tJ], head: 0.3, sx: 22, sz: 30 },
    { c: (tJ) => [-104, striders ? fly : 36, 760 + 17 * tJ], head: 0, sx: 26, sz: 90 }];
  const A = Array.from({ length: N }, (_, i) => ({ h: i % 3, ox: rng.gauss() * 0.5, oy: rng.range(-1, 1) * (striders ? 0 : 7), oz: rng.gauss() * 0.5, s: rng.range(0.78, 1.33), ph: rng() * 20, vent: rng.range(5, 8), yaw: 0 }));
  A.forEach((a, i) => { if (i < 3) { a.ox = [-0.25, 0.3, 0.05][i]; a.oz = [-0.5, 0.1, 0.75][i]; a.oy = [-2, 1, -1][i]; a.s = [1.2, 1.0, 1.3][i]; } });        // three of herd one right over the rail
  const pads = hero.anchors.pads, ign = hero.anchors.ignition, noon = style.uniforms.uNoon.value, nl2 = Math.hypot(noon.x, noon.z) || 1, sl = nl2 / Math.max(noon.y, 0.25);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(0, 0, 0, 'YXZ'), v = new THREE.Vector3(), s3 = new THREE.Vector3(), cam = new THREE.Vector3(), near = [];
  env.parts.push({ update(dt, time, camera, u, tJ) {
    camera.getWorldPosition(cam); if (near.length !== N) { near.length = 0; for (let i = 0; i < N; i++) near.push([0, 0, 0, 0]); }
    const k = clamp(Math.floor((tJ - ign.first) / ign.every), 0, pads.length - 1), since = tJ - ign.first - k * ign.every, look = tJ > ign.first ? ease(since / 0.8) * (1 - ease((since - 1.9) / 0.9)) : 0;
    for (let i = 0; i < N; i++) { const a = A[i], H = herds[a.h], c = H.c(tJ, time), cyc = ((time + a.ph) % a.vent) / a.vent, pop = Math.exp(-cyc * a.vent * 0.9);
      const x = c[0] + a.ox * H.sx, z = c[2] + a.oz * H.sz, y = c[1] + a.oy + (striders ? 0.5 * Math.sin(time * 1.6 + a.ph) : 1.2 * Math.sin(time * 0.6 + a.ph) + 2.2 * pop);
      const want = Math.atan2(pads[k].position[0] - x, pads[k].position[2] + ROW_Z - z), base = H.head + 0.2 * Math.sin(time * 0.23 + a.ph);
      let dy = want - base; dy = Math.atan2(Math.sin(dy), Math.cos(dy)); a.yaw = base + dy * look * 0.85;
      e.set(0.05 * Math.sin(time * 0.7 + a.ph), a.yaw, 0.06 * Math.sin(time * 0.9 + a.ph * 2)); q.setFromEuler(e);
      m.compose(v.set(x, y, z), q, s3.setScalar(a.s)); herd.set(i, m);
      const g = cyc * a.vent, ps = g < 2.2 ? a.s * 1.5 * ease(g / 0.5) * (1 - ease((g - 1.4) / 0.8)) : 0;
      m.compose(v.set(x - Math.sin(a.yaw) * (9.5 * a.s + g * 3), y + 1 + g * 1.2, z - Math.cos(a.yaw) * (9.5 * a.s + g * 3)), q, s3.setScalar(Math.max(ps, 1e-4))); puffs.set(i, m);
      const dx = x - cam.x, dz = z - cam.z, nr = near[i]; nr[0] = dx * dx + dz * dz; nr[1] = x - (noon.x / nl2) * (y - 1) * sl; nr[2] = z - (noon.z / nl2) * (y - 1) * sl; nr[3] = a.s; }
    herd.flush(); puffs.flush(); near.sort((p, r) => p[0] - r[0]);
    for (let j = 0; j < 4; j++) { const n = near[j]; style.uniforms.uShadow.value[4 + j].set(n[1], n[2], 11 * n[3] * (1 + 0.05 * Math.sin(time * 1.26)), 0.85); }
  } });
});

// ---------------------------------------------------------------- saucer taxis (or finned air-cars) and the dot-storm
PART_BUILDERS.push(async (env) => {
  const { ink, rng, dens, detail, edKey, cWarm, cY, aircars, storm, ed, style } = env, night = edKey === 'night', G = geoBuilder();
  const glass = night ? ink.paper : ink.cyan;
  if (aircars) {            // a finned bullet along +Z
    G.lathe([[0, -4.6, ink.black], [0.7, -4.6, ink.black], [1.25, -3.2, cWarm], [1.5, -0.6, cWarm], [1.5, -0.6], [1.3, 1.6], [1.3, 1.6, glass], [0.95, 3.0, glass], [0.95, 3.0, cY], [0, 5.0, cY]], 8, { m: new THREE.Matrix4().makeRotationX(Math.PI / 2), col: ink.paper, mark: [0.6, 0, 0.2] });
    for (let i = 0; i < 3; i++) G.plate([[1.1, -1.2], [3.0, -4.6], [2.9, -2.9], [1.3, 0.8]], 0.2, { m: new THREE.Matrix4().makeRotationZ(i * TAU / 3 + Math.PI / 2).multiply(new THREE.Matrix4().makeRotationX(Math.PI / 2)), col: cWarm, mark: [0, 0, 0.14] }, 0.2);
  } else {                  // a saucer: yellow rim, paper hull, a cyan bubble
    G.lathe([[0, -1.1, cWarm], [1.6, -1.0, cWarm], [4.6, -0.15, cWarm], [4.6, -0.15, cY], [4.9, 0.1, cY], [4.6, 0.35, cY], [4.6, 0.35], [2.0, 0.9], [2.0, 0.9, glass], [1.5, 2.1, glass], [0, 2.7, glass]], 8, { col: ink.paper, mark: [0.6, 0, 0.2] });
  }
  for (let i = 0; i < 3; i++) { const x = (i - 1) * 1.5, o = { col: ink.black, mark: [0, 0, 0] }, L = 9 + 4 * (i % 2);               // speed lines, astern
    const a = G.vert(o, x - 0.22, 0.1, -4.9, 0, 1, 0, 0, 1, 0), b = G.vert(o, x + 0.22, 0.1, -4.9, 0, 1, 0, 0, 1, 0), c = G.vert(o, x, 0.1, -4.9 - L, 0, 1, 0, 0, 1, 0), d = G.vert(o, x, 0.32, -4.9, 1, 0, 0, 1, 0, 0), f = G.vert(o, x, -0.12, -4.9, 1, 0, 0, 1, 0, 0);
    G.tri(a, b, c); G.tri(a, c, b); G.tri(d, f, c); G.tri(d, c, f); }
  const N = Math.round(40 * clamp(dens, 0.75, 1.2)), craft = instPair(env, G.finish(), Array.from({ length: N }, () => new THREE.Matrix4()));
  // lanes: across the city (x-going), along the causeway between the rail and the ships (z-going), and wide of the row
  const S = Array.from({ length: N }, (_, i) => { const kind = i % 4, dir = rng.chance(0.5) ? 1 : -1;
    if (kind < 2) return { ax: 0, a0: rng.range(-420, 420), v: dir * rng.range(26, 48), span: 840, fx: 0, y: rng.range(58, 92), fz: rng.range(292, 556), s: rng.range(0.9, 1.5), ph: rng() * 9 };
    if (kind === 2) return { ax: 1, a0: rng.range(0, 960), v: dir * rng.range(34, 60), span: 960, fx: (rng.chance(0.5) ? 1 : -1) * rng.range(10, 17), y: rng.range(27, 58), fz: 1080, s: rng.range(0.8, 1.1), ph: rng() * 9 };
    if (i >= N - 5) return { ax: 2, a0: rng() * TAU, v: dir * rng.range(0.5, 0.8), span: 0, fx: rng.range(13, 24), y: rng.range(-9, -2), fz: 0, s: rng.range(0.8, 1.15), ph: rng() * 9 };
    return { ax: 1, a0: rng.range(400, 2000), v: dir * rng.range(40, 70), span: 2000, fx: (rng.chance(0.5) ? 1 : -1) * rng.range(85, 260), y: rng.range(125, 170), fz: 1100, s: rng.range(1.5, 2.5), ph: rng() * 9 }; });
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(0, 0, 0, 'YXZ'), v = new THREE.Vector3(), s3 = new THREE.Vector3(), ringM = env.path.frameAt(true, new THREE.Matrix4(), true);
  // the dot-storm: discs of the plain's first plate lifted off and streamed across the rail in ribbons
  let stormMesh = null;
  if (storm) { const n = Math.round(900 * detail), A = new Float32Array(n * 4);
    for (let i = 0; i < n; i++) { A[i * 4] = Math.floor(rng() * 6); A[i * 4 + 1] = rng(); A[i * 4 + 2] = rng.gauss() * 0.5; A[i * 4 + 3] = rng.range(0.22, 0.55); }
    const geo = new THREE.InstancedBufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0]), 3)); geo.setIndex([0, 1, 2, 0, 2, 3]);
    geo.setAttribute('iA', new THREE.InstancedBufferAttribute(A, 4)); geo.instanceCount = n; geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e6);
    const inkName = ed.land.A[0] === 'yellow' ? 'yellow' : ed.land.A[0] === 'cyan' ? 'cyan' : 'orange';
    stormMesh = new THREE.Mesh(geo, new THREE.ShaderMaterial({ uniforms: { ...style.uniforms, uC: { value: ink[inkName] }, uCamZ: { value: 0 } }, side: THREE.DoubleSide,
      vertexShader: /* glsl */`
        ${STYLE_GLSL}
        uniform float uCamZ; attribute vec4 iA; varying vec2 vUv;
        void main(){ float id = iA.x, s = fract(iA.y + uTime*(0.05 + 0.012*id));
          float z0 = id*52. + 17.*sin(id*3.1), z = mod(z0 - uCamZ + 30., 312.) - 30. + uCamZ;
          vec3 c = vec3(mix(-170., 170., s), 7. + 8.*sin(s*11. + id*2.3 + uTime*0.3) + 5.*sin(s*29. + id), z + 34.*sin(s*5. + id*1.7) + 9.*sin(s*17. + uTime*0.4 + id));
          c += vec3(0., iA.z*3.2, iA.z*5.5 + 2.*sin(iA.y*90.)); c.y = max(c.y, 0.6);
          float fade = smoothstep(0., 0.06, s)*(1. - smoothstep(0.94, 1., s));
          vec4 mv = viewMatrix*vec4(c, 1.); float r = max(iA.w*fade, 0.9*uPx*max(-mv.z, 0.1)*step(0.01, fade));
          mv.xy += position.xy*r*vec2(1., 0.55 + 0.45*sin(uTime*3. + iA.y*70.)); vUv = position.xy; gl_Position = projectionMatrix*mv; }`,
      fragmentShader: /* glsl */`uniform vec3 uC; varying vec2 vUv; void main(){ if (dot(vUv, vUv) > 1.) discard; gl_FragColor = vec4(uC, 1.); }` }));
    stormMesh.frustumCulled = false; env.scene.add(stormMesh); }
  env.parts.push({ update(dt, time, camera) {
    for (let i = 0; i < S.length; i++) { const c = S[i], a = c.a0 + c.v * time, w = c.span ? ((a % c.span) + c.span) % c.span - c.span * 0.5 : 0, bob = Math.sin(time * 1.1 + c.ph);
      if (c.ax === 2) {          // the escort: circling the exit ring, in its tilted plane, a little in front of it
        v.set(Math.cos(a) * c.fx, Math.sin(a) * c.fx, c.y).applyMatrix4(ringM); e.set(-0.5, (c.v > 0 ? -1 : 1) * (Math.sin(a) > 0 ? 1 : -1) * Math.PI / 2, 0.2 * bob); q.setFromEuler(e);
        m.compose(v, q, s3.setScalar(c.s)); craft.set(i, m); continue; }
      if (c.ax === 0) v.set(w, c.y + bob * 0.8, c.fz); else v.set(c.fx, c.y + bob * 0.8, c.fz + w);
      e.set(0.05 * bob, c.ax === 0 ? (c.v > 0 ? Math.PI / 2 : -Math.PI / 2) : (c.v > 0 ? 0 : Math.PI), 0.12 * Math.sin(time * 0.8 + c.ph)); q.setFromEuler(e);
      m.compose(v, q, s3.setScalar(c.s)); craft.set(i, m); }
    craft.flush();
    if (stormMesh) { camera.getWorldPosition(v); stormMesh.material.uniforms.uCamZ.value = v.z; }
  } });
});

// ---------------------------------------------------------------- causeway furniture: lamp masts, turning radar dishes, pennants
PART_BUILDERS.push(async (env) => {
  const { ink, rng, edKey, cWarm, cY, hero } = env, night = edKey === 'night';
  // lamp mast, 7 m from the rail, its arm reaching inboard (+X local)
  const Mg = geoBuilder(), mo = { col: ink.paper, mark: [0.85, 0, 0.11] };
  Mg.lathe([[0.55, 0], [0.55, 0.5], [0.24, 0.7], [0.15, 10.4]], 5, mo);
  Mg.beam([0, 10.3, 0], [1.5, 10.9, 0], 0.22, 0.22, mo); Mg.lathe(ballProfile(0.42, 10.45, 3, cY), 6, { m: new THREE.Matrix4().makeTranslation(1.6, 0, 0), col: cY, mark: [0, 0, 0.09] });
  Mg.lathe([[0.62, 3.0, ink.black], [0.62, 3.5, ink.black]], 5, { col: ink.black, mark: [0, 0, 0] });
  const mm = []; for (let z = 588.25; z < 1545; z += 22.5) for (const sx of [-1, 1]) if (!(sx > 0 && z > 1450)) mm.push(M4(sx * 7, DECK_Y, z, sx > 0 ? Math.PI : 0));
  instPair(env, Mg.finish(), mm);
  // radar: a post with a tilted dish that turns (kind 3: about the object's own Y axis)
  const R = geoBuilder(), ro = { col: ink.paper, mark: [0.8, 0, 0.16] };
  R.lathe([[1.5, 0], [1.1, 0.8], [0.5, 1.2], [0.4, 8.5]], 6, ro);
  R.lathe([[0.9, 8.3, cY], [0.9, 9.1, cY]], 6, { col: cY, mark: [0, 0, 0.1] });
  R.set(0, 0, [3, 0, 0, 1]);
  const Md = new THREE.Matrix4().makeTranslation(0, 10.6, 0).multiply(new THREE.Matrix4().makeRotationZ(-1.05));
  R.lathe([[0, 0.3, ink.paper], [1.6, 0.55], [3.0, 1.25], [3.7, 2.0], [3.7, 2.0, cWarm], [3.9, 2.25, cWarm], [3.7, 2.3, cWarm], [3.7, 2.3], [2.9, 1.6], [1.5, 0.95], [0, 0.7]], 14, { m: Md, col: ink.paper, mark: [0.9, 0, 0.16] });
  R.lathe([[0.12, 0.6], [0.1, 3.2], [0.36, 3.3, ink.black], [0, 3.7, ink.black]], 4, { m: Md, col: ink.paper, mark: [0, 0, 0.07] });
  R.beam([0, 9.0, 0], [0.5, 10.9, 0], 0.5, 0.5, ro);
  const pads = hero.anchors.pads;
  instPair(env, R.finish(), pads.slice(0, 11).map((pd) => M4(-pd.side * 20.5, DECK_Y, pd.position[2] + ROW_Z + 47, rng() * TAU)));
  await env.ctx.yield();
  // pennants: a sagging line between facing mast tops every 90 m, hung with fluttering flags
  const P = geoBuilder(), FG = geoBuilder(), cols = night ? [ink.paper, ink.cyan] : [cWarm, cY, ink.cyan];
  for (let z = 588.25 + 45; z < 1400; z += 90) { let prev = null;
    for (let i = 0; i <= 14; i++) { const t = i / 14, x = lerp(-6.9, 6.9, t), y = DECK_Y + 10.4 - 1.5 * Math.sin(t * Math.PI), q = [x, y, z];
      if (prev) { P.set(0, 0); P.beam(prev, q, 0.06, 0.06, { col: ink.black, mark: [0, 0, 0.03] });
        if (i > 1 && i < 14) { FG.set(0, 0, [4, 0.16, z * 0.37 + i, 7 + (i % 3)]);                 // a flag, and a larger black one behind it as its outline
          for (const [o, g, dz] of [[{ col: cols[i % cols.length], mark: [0, 0, 0] }, 0, 0], [{ col: ink.black, mark: [0, 0, 0] }, 0.11, 0.06]]) {
            const a = FG.vert(o, prev[0] - g * 1.6, prev[1] + g, z + dz, 0, 0, -1, 0, 0, -1), b = FG.vert(o, q[0] + g * 1.6, q[1] + g, z + dz, 0, 0, -1, 0, 0, -1), c = FG.vert(o, (prev[0] + q[0]) / 2, (prev[1] + q[1]) / 2 - 1.25 - g * 2.2, z + dz, 0, 0, -1, 0, 0, -1);
            FG.tri(a, b, c); FG.tri(a, c, b); } } }
      prev = q; } }
  P.set(0, 0);
  pair(env, P.finish());
  const flags = new THREE.Mesh(FG.finish(), env.W.paper({ side: THREE.DoubleSide })); flags.frustumCulled = false; env.scene.add(flags);
});

// ==== LIFE (further parts are inserted above this line)

// a tube bent round a circle in the XY plane of matrix M (hoops, rings): major R, minor r
function addTorus(G, o, R, r, NM = 48, Nm = 8, a0 = 0, a1 = TAU) {
  const base = G.vertexCount;
  for (let i = 0; i <= NM; i++) { const a = lerp(a0, a1, i / NM), cx = Math.cos(a), cy = Math.sin(a);
    for (let j = 0; j <= Nm; j++) { const b = (j / Nm) * TAU, nx = cx * Math.cos(b), ny = cy * Math.cos(b), nz = Math.sin(b);
      G.vert(o, cx * R + nx * r, cy * R + ny * r, nz * r, nx, ny, nz, nx, ny, nz); } }
  for (let i = 0; i < NM; i++) for (let j = 0; j < Nm; j++) { const a = base + i * (Nm + 1) + j, b = a + Nm + 1; G.tri(a, b, a + 1); G.tri(a + 1, b, b + 1); }
}
// ---------------------------------------------------------------- last: shadows, the horizon line, the panel border, the gaze
PART_BUILDERS.push(async (env) => {
  const { ink, path, hero, style } = env;
  // evening edition: the port gantries throw long solid shadows across the causeway
  if (env.edKey === 'evening' && env.blob) for (const pd of hero.anchors.pads) if (pd.side > 0) env.blob(60, pd.position[2] + ROW_Z, 5, 83, DECK_Y + 0.13, 26);
  if (env.shadowGeo && env.shadowGeo.vertexCount > 0) { const m = new THREE.Mesh(env.shadowGeo.finish(), env.W.paper({ side: THREE.DoubleSide })); m.frustumCulled = false; m.renderOrder = -4; env.scene.add(m); }
  // the horizon: one black brush line where the plain meets the paper, kept at least a pixel and a half thick
  const H = geoBuilder(), o = { col: ink.black, mark: [0, 0, 0] }, RH = 5300, n = 72, hb = H.vertexCount;
  for (let i = 0; i <= n; i++) { const a = (i / n) * TAU, c = Math.cos(a), s = Math.sin(a), h = 22 + 9 * Math.sin(a * 5.0) * Math.sin(a * 3.0 + 1);
    H.vert(o, c * RH, 0, s * RH, -c, 0, -s, -c, 0, -s); H.vert(o, c * RH, h, s * RH, -c, 0, -s, -c, 0, -s); }
  for (let i = 0; i < n; i++) { const a = hb + i * 2; H.tri(a, a + 1, a + 2); H.tri(a + 2, a + 1, a + 3); H.tri(a, a + 2, a + 1); H.tri(a + 2, a + 3, a + 1); }
  const horizon = new THREE.Mesh(H.finish(), env.W.paper()); horizon.frustumCulled = false; horizon.renderOrder = -4; env.scene.add(horizon);
  // the exit: a round inset panel with a heavy black border, a paper keyline inside it and an offset drop shadow
  const F = geoBuilder(), Mf = path.frameAt(true, new THREE.Matrix4(), true);
  const nightEd = env.edKey === 'night', cB = nightEd ? ink.paper : ink.black, cKey = nightEd ? ink.black : ink.paper;      // on the black night sky the border is knocked out
  if (!nightEd) addTorus(F, { m: Mf.clone().multiply(new THREE.Matrix4().makeTranslation(0.85, -0.85, 0.7)), col: ink.black, mark: [0, 0, 0] }, 7.75, 0.5, 56, 8);
  addTorus(F, { m: Mf, col: cB, mark: [0, 0, 0.12] }, 7.72, 0.62, 56, 10);
  addTorus(F, { m: Mf.clone().multiply(new THREE.Matrix4().makeTranslation(0, 0, -0.45)), col: cKey, mark: [0, 0, 0] }, 7.3, 0.13, 56, 6);
  // hoops round the climbing rail (9.5 m clear of the sled line): the sled threads them on the way up to the panel
  const tq = new THREE.Vector3(), pq = new THREE.Vector3(), xq = new THREE.Vector3(1, 0, 0), yq = new THREE.Vector3();
  for (let i = 0; i < 5; i++) { const d = path.length - 62 - i * 52; path.posAtDist(d, pq); path.tangentAtDist(d, tq); yq.crossVectors(tq, xq).normalize();
    const Mr = new THREE.Matrix4().makeBasis(xq, yq, tq).setPosition(pq), c = i % 2 ? env.cY : env.cWarm;
    addTorus(F, { m: Mr, col: c, mark: [0.55, 0, 0.16] }, 9.6, 0.42, 40, 6);
    for (const a of [0.5, Math.PI - 0.5]) F.beam([Math.cos(a) * 9.6, Math.sin(a) * 9.6 - 0.2, 0], [Math.cos(a) * 1.2, -2.6, 0], 0.3, 0.3, { m: Mr, col: ink.paper, mark: [0.8, 0, 0.1] }); }
  pair(env, F.finish());
  // the gaze: up at the herd crossing overhead, then to the ships as they rise beside us
  const _a = new THREE.Vector3(), _b = new THREE.Vector3(), pads = hero.anchors.pads, uOf = (z) => z / path.length;
  // (steady camera: pois pull at a third, so the path itself already runs down the row; these only refine the framing)
  const hz = hero.object.position, tailAt = (k, up) => { const v = new THREE.Vector3(); return () => { hero.shipTail(k, v).add(hz); v.y += up; return v; }; };
  const _st = new THREE.Vector3(), stair = (time, u) => _st.set(0, RAIL_Y + 96, Math.min(u * path.length, 1500) + 300);
  env.pois = [
    { at: [0, 40, 252], from: 0.085, to: 0.128, weight: 0.3 },                                   // the herd overhead
    { at: [44, 30, 440], from: 0.145, to: 0.25, weight: 0.5 },                                    // the great dome and its gleam
    { at: stair, from: uOf(640), to: uOf(1345), weight: 0.72 },                                   // up into the staircase of ships over the causeway
    { at: tailAt(10, 6), from: uOf(1350), to: uOf(1575), weight: 0.8 },                         // ship eleven rising beside us: fins and column
    { at: () => hero.shipTail(k12, _a).lerp(hero.shipPosition(k12, _b), 0.35).add(hz), from: uOf(1575), to: 0.985, weight: 0.3 },                              // ship twelve climbing with us
  ];
  // ---- ship twelve is flown by the world: off its pad, then up the rail's own line 38 m to starboard, its fins held
  // ahead of the sled all the way to the panel. Keyed to the distance flown, so it is the same at any pace.
  const k12 = pads.length - 1, pad12 = pads[k12].position, ign = hero.anchors.ignition;
  const dLift = 300 + 45 * ((ign.last ?? 35.5) + (ign.hold ?? 1.2) - 7.5);                     // sled distance when ship twelve leaves its pad
  const dPad = path.nearestXZ(0, pad12[2] + ROW_Z).u * path.length, f0 = Math.max(dPad - dLift, 60), F_END = 36, P_DROP = 3;
  const _q = new THREE.Vector3(), _t = new THREE.Vector3(), easeS = (x) => { x = clamp(x, 0, 1); return x * x * (3 - 2 * x); };
  env.flyLast = (dist, tJ, time) => {
    const sg = dist - dLift;
    if (!(sg > 0) || ign.last == null) { hero.setEscort(null); return; }
    const f = F_END + (f0 - F_END) * Math.exp(-sg / (f0 - F_END)), d = dist + f, w = easeS(sg / 150);
    const dc = Math.min(d, path.length - 0.01); path.posAtDist(dc, _q); path.tangentAtDist(dc, _t); if (d > dc) _q.addScaledVector(_t, d - dc);
    const a = sg / 45, hv = Math.min(2.25 * a * a, 60);                       // what a plain vertical lift would have done
    // (it rides the air beside us: a slow jostle of a metre or two once it is in formation)
    const x = pad12[0] + hz.x + 1.3 * Math.sin(time * 1.3 + 1) * w, y = lerp(DECK_Y + hv, _q.y - P_DROP, w) + 1.7 * Math.sin(time * 1.9) * w, z = lerp(pad12[2] + ROW_Z, _q.z, w);
    hero.setEscort(x - hz.x, y - hz.y, z - hz.z, Math.atan2(_t.z, Math.max(_t.y, 1e-3)) * w * w);
  };
  const _p = new THREE.Vector3();
  env.parts.push({ update(dt, time, camera) { camera.getWorldPosition(_p); horizon.position.set(_p.x, 0, _p.z); } });
});

// ==== PARTS (inserted above this line)

// ---------------------------------------------------------------- the world module
export default {
  id: 'four-colour-launch',
  name: 'Launch Row',
  category: 'alien',
  weirdness: 0.6,
  media: ['rail', 'open'],
  async build(ctx) {
    const rng = ctx.rng, vary = ctx.vary || {}, detail = clamp(ctx.quality?.detail ?? 1, 0.5, 1), dens = clamp(vary.density ?? 1, 0.7, 1.3);
    // ---- the edition: by the hour asked for, else by seed
    const roll = rng(), hour = vary.hour || 'any';
    const edKey = hour === 'night' ? 'night' : hour === 'golden' || hour === 'dawn' ? 'evening' : hour === 'day' ? (roll < 0.1 ? 'two' : 'noon')
      : roll < 0.5 ? 'noon' : roll < 0.72 ? 'evening' : roll < 0.9 ? 'night' : 'two';
    const ed = EDITIONS[edKey];
    const storm = rng.chance(0.3), striders = rng.chance(0.35), aircars = rng.chance(0.4);
    const style = makeStyle(ed.palette);
    style.uniforms.uNoon.value.set(...ed.noon).normalize();
    const W = worldMaterials(style), ink = style.ink;
    const scene = new THREE.Scene(); scene.background = ink.paper.clone();
    await ctx.yield();

    const hero = await buildHero(ctx, { style, stage: false, detail, misprint: !!vary.rare, duration: DUR, rest: 0.010,
      ignitionEvery: IGN_EVERY, lastIgnition: IGN_LAST, ignitions: IGNITIONS, pitchOver: [3.6, 3.6, 3.6, 3.6, 3.6, 3.6, 3.6, 3.6, 3.6, 4.2, 5.7, 3.6] });
    hero.object.position.set(0, DECK_Y, ROW_Z); scene.add(hero.object);
    await ctx.yield();
    const sky = buildEditionSky(style, ed, detail, rng); scene.add(sky.object);
    await ctx.yield();
    const land = buildLand(style, ed, detail); scene.add(land.group);
    await ctx.yield();

    // ---- the route: level through the mesas, round the great dome, down the causeway, up beside the last ship
    const HZ = ROW_Z, fly = hero.anchors.flyThrough, seat = hero.anchors.portalSeat.position;
    const pts = [[0, RAIL_Y, 0], [0, RAIL_Y, 70], [0, RAIL_Y, 190], [0, RAIL_Y, 300], [-8, RAIL_Y, 346], [-29, RAIL_Y, 394], [-40, RAIL_Y, 436],
      [-34, RAIL_Y, 480], [-14, RAIL_Y, 526], [0, RAIL_Y, 564], [0, RAIL_Y, 640], [0, RAIL_Y, 900], [0, RAIL_Y, 1200], [0, RAIL_Y, 1440]];
    for (const p of fly.slice(3)) pts.push([p[0], p[1] + DECK_Y, p[2] + HZ]);
    const path = makePath(pts);
    const parts = [];                       // { update(dt, time, camera, u, tJ) }
    const env = { ctx, rng, detail, dens, style, W, ink, ed, edKey, scene, path, hero, parts, storm, striders, aircars, seat: [seat[0], seat[1] + DECK_Y, seat[2] + HZ] };
    for (const make of PART_BUILDERS) { await make(env); await ctx.yield(); }

    const _cp = new THREE.Vector3();
    return {
      scene, path, duration: DUR, title: ed.title,
      // linger a little where ship eleven rises beside the sled (the hero image), at full pace again before the climb
      pace: (u) => 1 - 0.3 * smoothstep(0.72, 0.765, u) * (1 - smoothstep(0.82, 0.86, u)),
      camera: { fov: 64, near: 0.3, far: 6500, lookAhead: 34, sway: 0.25, bank: 0.5 },
      pois: env.pois || [],
      portal: { shape: 'circle', radius: 7, color: '#' + new THREE.Color(ed.palette[0]).getHexString(), glow: 0, halo: false, revealDistance: 520, tilt: true },
      post: { ...POST, grade: { ...POST.grade } },
      ride: 'none', style: 'none', companion: 'none',
      update(dt, time, camera, u) {
        // the journey clock: the brief's own timetable (40 m/s through the mesas, 45 m/s after), read off the distance
        // flown, so every ignition meets the sled where the storyboard puts it whatever pace the engine flies at
        const dist = u * path.length, tJ = dist < 300 ? dist / 40 : 7.5 + (dist - 300) / 45;
        hero.setClock(tJ); env.flyLast(dist, tJ, time); hero.update(dt, time, camera);
        land.update(camera);
        for (const p of parts) p.update(dt, time, camera, u, tJ);
      },
      dispose() { hero.dispose(); for (const p of parts) if (p.dispose) p.dispose(); },
    };
  },
};
