// THE CLOUD ARMADA: hero set pieces (everything procedural, no kit imports beyond core).
//
//   buildHero(ctx, { piece: 'flagship' })   (default)  THE FLAGSHIP: a 45 m crimson-and-gold envelope (gore bulges,
//       heraldic belt of diamonds, chevrons, scalloped sunburst crown, load tapes and panel seams) over a two-deck
//       wicker gondola (skids, hoops, leather straps, rolled rims, scalloped valance, burner frame and load ring,
//       twin brass burners with coils, fuel tanks, sandbags, three rope ladders, grapnel anchor, crew in hats,
//       lanterns), bunting from the outriggers up to the equator, great pennants at the crown and on two staffs, and
//       six 22 m consort balloons roped to it by sagging hawsers dressed with flags and festoon lamps.
//   buildHero(ctx, { piece: 'guard' })      THE HONOUR GUARD: six 22 m balloons hung at the corners of an upright,
//       flat-topped hexagon 48 m in radius (local XY plane, facing +Z), joined corner to corner by double sagging
//       lines of pennant flags with festoon lamps, tassel pennants at every corner, the portal seat at its centre.
//   Call it once per piece: they are independent objects sharing no state.
//   buildFleet(ctx, { balloons })           THE ARMADA: any number of free balloons drawn with the same shaders, instanced
//       (see the comment on buildFleet at the end of this file).
//
// SIZE     flagship: origin = gondola keel centre (ladder and anchor trail to y -11); envelope mouth y 13, equator
//          y 40 (radius 17.5), crown y 58, mast top y 62. Consorts sit 58-82 m out: two low in front (+Z, baskets
//          at y -33..-21), two beside, two high behind. radius 80, height 62, center (0, 30, 0).
//          guard: origin = base centre under the hexagon; hexagon centre (0, 46, 0); the lower garlands sag to
//          about y -8; top of the upper balloons y 107. radius 62.
// OPTS     palette    7 hex strings in the brief's order (blue, lavender, peach, pale gold, cream, dusk purple,
//                     crimson); gold is derived from the pale gold, crimson is deepened from the accent.
//          piece      'flagship' | 'guard'
//          autoFlare  (default true) until setProgress/setBurn is called the Flagship burner runs a 14 s demo
//                     cycle on world time (it is firing at t = 12). Pass false to start with the pilot light only.
//          sun        optional { direction: Vector3 toward the sun (world), color: linear Color * intensity }.
// PER SEED envelope heraldry (3 variants) and gore count, crimson/gold hue, consort layout, scale, patterns and
//          colourways, wind direction of the pennants, sandbags, crew, which side the ladder and anchor hang.
// PROGRESS hero.setProgress(p), p 0..1 = the flare sequence: pilot light, ignition at 0.12, roaring 0.2-0.7 (envelope
//          fully aglow by 0.36), burner off at 0.74, lantern afterglow fading out by 1. Drive it from the path, e.g.
//          p = remap(u, uLevel - 0.04, uLevel + 0.12, 0, 1) with uLevel = the u where the camera draws level.
//          hero.setBurn(flame, glow) sets both 0..1 directly. hero.setSun(dir, color) overrides the light (see below).
//          Consort and guard burners flare on staggered world-time timers (ambient). Bobbing, spinning, flutter and
//          flame flicker are all in the vertex/fragment shaders, driven by update(dt, time).
// ANCHORS  (local space)
//   flagship: flyThrough     5 points of a safe camera line on the +Z side passing 40 m from the envelope (z 57.5 at
//                            x 0), travelling +X and climbing 21 -> 34 m, so the camera draws level with the burner
//                            mid-pass with the Flagship on its left (reverse the list to have it on the right).
//                            Nothing is within 35 m of this line except the envelope itself at 40 m.
//             burner, envelopeCenter, crown, gondola   look-at targets (Vector3)
//             viewpoints     [{ position, target }] three composed stills
//             consorts       centres of the six consort balloons
//   guard:    portalSeat     { position, normal }: centre of the hexagon, portal faces +Z (camera arrives from +Z
//                            travelling -Z). portalRadius 10. The free opening is ~60 m high between the garlands.
//             flyThrough     straight level approach from z 320 into the seat;  corners  the six hexagon corners
//             viewpoints     two composed stills
// LIGHTING Custom shaders that read the scene's lights (lights: true): the FIRST DirectionalLight is the sun, plus
//          hemisphere/ambient light. Wants a low warm key of intensity 2-3 and a cool hemisphere of 0.5-0.8. If the
//          world has no DirectionalLight, call hero.setSun(dirTowardSun, color) or pass opts.sun. Looking toward the
//          sun the envelopes and flags transmit light like stained glass and pick up a bright rim; the burner flare
//          adds a lantern glow of about 0.6-1.1 (soft bloom) and the flames/lamps emit 4-5. Scene fog (Fog or
//          FogExp2) is honoured by every material. No lights of its own, no textures, nothing to dispose.
// COST     flagship ~79k triangles, 7 draw calls, 5 shader programs, ~100-150 ms build.
//          guard ~50k triangles, 6 draw calls, ~50 ms build.
import * as THREE from 'three';
import { clamp, lerp, smoothstep } from '../kit/core.js';

const DEFAULT_PALETTE = ['#2b3f8f', '#8a6fb5', '#ff9e6b', '#ffd9a8', '#f7efe6', '#5a4a78', '#ff4f3a'];
const V3 = (x, y, z) => new THREE.Vector3(x, y, z);

// ---------------------------------------------------------------- shared GLSL
const GLSL_BOB = /* glsl */`
vec3 bobOff(vec2 b, float t){
  return vec3(sin(t*0.23+b.x*1.7)*0.5, sin(t*0.31+b.x), cos(t*0.19+b.x*2.3)*0.5)*b.y;
}
// staggered burner timer: x = phase within the cycle; flame is short, the envelope glow lingers
float flareX(float seed, float t){ float per = 9.0 + 6.0*fract(seed*7.31); return fract(t/per + seed); }
float flameOf(float x){ return smoothstep(0.0,0.03,x)*(1.0-smoothstep(0.17,0.21,x)); }
float glowOf(float x){ return smoothstep(0.0,0.07,x)*(1.0-smoothstep(0.2,0.46,x)); }
`;
const GLSL_LIGHT = /* glsl */`
uniform vec3 uSunDir, uSunCol; uniform float uSunOn;
void sunLight(out vec3 L, out vec3 col){
  #if NUM_DIR_LIGHTS > 0
    L = directionalLights[0].direction; col = directionalLights[0].color;
  #else
    L = vec3(0.0,1.0,0.0); col = vec3(0.0);
  #endif
  if (uSunOn > 0.5) { L = normalize((viewMatrix*vec4(uSunDir, 0.0)).xyz); col = uSunCol; }
}
vec3 skyLight(vec3 n){
  vec3 irr = ambientLightColor;
  #if NUM_HEMI_LIGHTS > 0
    for (int i = 0; i < NUM_HEMI_LIGHTS; i++) irr += getHemisphereLightIrradiance(hemisphereLights[i], n);
  #endif
  return irr;
}
float hash1(float n){ return fract(sin(n*127.1)*43758.5453); }
float hash2(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
float vnoise(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);
  return mix(mix(hash2(i),hash2(i+vec2(1,0)),f.x), mix(hash2(i+vec2(0,1)),hash2(i+vec2(1,1)),f.x), f.y); }
float tri(float x){ return abs(fract(x)-0.5)*2.0; }
`;

// ---------------------------------------------------------------- geometry builder
// Accumulates merged, vertex-coloured geometry with: uv in metres (for procedural weave / grain / rope twist),
// aMT = (material id, blend t), aBob = (phaseA, ampA, phaseB, ampB): the vertex bobs with mix(bob(A), bob(B), t),
// so one merged mesh can follow several independently bobbing balloons (hawsers stretch between them).
// material ids: 0 wood, 1 wicker, 2 rope, 3 cloth, 4 brass, 5 lamp (emissive), 6 matt (crew, iron, leather)
function makeBuilder(rng) {
  const P = [], N = [], C = [], U = [], MT = [], BB = [], I = [];
  const st = { m: null, nm: new THREE.Matrix3(), bob: [0, 0, 0, 0], t: 0 };
  const v3 = new THREE.Vector3();
  function vert(x, y, z, nx, ny, nz, r, g, b, u, v, mat, t = 0) {
    if (st.m) {
      v3.set(x, y, z).applyMatrix4(st.m); x = v3.x; y = v3.y; z = v3.z;
      v3.set(nx, ny, nz).applyMatrix3(st.nm).normalize(); nx = v3.x; ny = v3.y; nz = v3.z;
    }
    P.push(x, y, z); N.push(nx, ny, nz); C.push(r, g, b); U.push(u, v); MT.push(mat, t || st.t);
    BB.push(st.bob[0], st.bob[1], st.bob[2], st.bob[3]);
    return P.length / 3 - 1;
  }
  function grid(base, rows, cols) { // rows x cols quads over (rows+1) x (cols+1) verts
    for (let i = 0; i < rows; i++) for (let k = 0; k < cols; k++) {
      const a = base + i * (cols + 1) + k, b = a + 1, c = a + cols + 1, d = c + 1;
      I.push(a, c, b, b, c, d);
    }
  }
  const T = new THREE.Vector3(), Nn = new THREE.Vector3(), Bn = new THREE.Vector3(), pT = new THREE.Vector3(), q = new THREE.Quaternion(), tmp = new THREE.Vector3();
  // swept ring along a polyline. rad: number | (t)=>number. o: { closed, cap, rot, t:(t)=>blend, uRep, jit, col2 }
  function tube(pts, rad, sides, col, mat, o = {}) {
    const n = pts.length, base = P.length / 3; let len = 0;
    const j = 1 + (o.jit ?? 0.1) * (rng() - 0.5) * 2;
    for (let i = 0; i < n; i++) {
      const a = o.closed ? pts[i === 0 ? n - 2 : i - 1] : pts[Math.max(i - 1, 0)];
      const b = o.closed ? pts[i === n - 1 ? 1 : i + 1] : pts[Math.min(i + 1, n - 1)];
      T.subVectors(b, a).normalize();
      if (i === 0) { tmp.set(0, 1, 0); if (Math.abs(T.y) > 0.9) tmp.set(1, 0, 0); Nn.crossVectors(T, tmp).normalize(); }
      else { q.setFromUnitVectors(pT, T); Nn.applyQuaternion(q).normalize(); len += pts[i].distanceTo(pts[i - 1]); }
      Bn.crossVectors(T, Nn); pT.copy(T);
      const tt = i / (n - 1), r = typeof rad === 'function' ? rad(tt) : rad, bt = o.t ? o.t(tt) : 0, p = pts[i];
      const cr = o.col2 ? lerp(col.r, o.col2.r, tt) : col.r, cg = o.col2 ? lerp(col.g, o.col2.g, tt) : col.g, cb = o.col2 ? lerp(col.b, o.col2.b, tt) : col.b;
      for (let k = 0; k <= sides; k++) {
        const an = (k / sides) * Math.PI * 2 + (o.rot || 0), c = Math.cos(an), s = Math.sin(an);
        const nx = Nn.x * c + Bn.x * s, ny = Nn.y * c + Bn.y * s, nz = Nn.z * c + Bn.z * s;
        vert(p.x + nx * r, p.y + ny * r, p.z + nz * r, nx, ny, nz, cr * j, cg * j, cb * j, (k / sides) * (o.uRep || 1), len, mat, bt);
      }
    }
    grid(base, n - 1, sides);
    if (o.cap) for (const e of [0, n - 1]) {
      const p = pts[e], s = e === 0 ? -1 : 1; T.subVectors(pts[Math.min(e + 1, n - 1)], pts[Math.max(e - 1, 0)]).normalize();
      const ci = vert(p.x, p.y, p.z, T.x * s, T.y * s, T.z * s, col.r * j, col.g * j, col.b * j, 0.5, 0, mat, o.t ? o.t(e ? 1 : 0) : 0);
      const rb = base + e * (sides + 1);
      for (let k = 0; k < sides; k++) I.push(ci, rb + k, rb + k + 1);
    }
  }
  // lofted superellipse rings. rings: [{ y, a, b?, n?, col? }]. o: { cx, cz, uLen, jit }
  function loft(rings, sides, col, mat, o = {}) {
    const base = P.length / 3, cx = o.cx || 0, cz = o.cz || 0; let vv = 0;
    const j = 1 + (o.jit ?? 0.08) * (rng() - 0.5) * 2;
    for (let i = 0; i < rings.length; i++) {
      const R = rings[i], Rp = rings[Math.max(i - 1, 0)], Rn = rings[Math.min(i + 1, rings.length - 1)];
      const e = 2 / (R.n || 2), ra = Math.max(R.a, 1e-3), rb = Math.max(R.b ?? R.a, 1e-3);
      const dy = Rn.y - Rp.y, da = Rn.a - Rp.a, dl = Math.hypot(dy, da) || 1, nH = dy / dl, nY = -da / dl;
      if (i > 0) vv += Math.hypot(R.y - Rp.y, R.a - Rp.a);
      const cc = R.col || col, uLen = o.uLen ?? Math.PI * (ra + rb);
      for (let k = 0; k <= sides; k++) {
        const th = (k / sides) * Math.PI * 2, c = Math.cos(th), s = Math.sin(th);
        const x = ra * Math.sign(c) * Math.abs(c) ** e, z = rb * Math.sign(s) * Math.abs(s) ** e;
        let nx = Math.sign(c) * Math.abs(c) ** (2 - e) / ra, nz = Math.sign(s) * Math.abs(s) ** (2 - e) / rb;
        const nl = Math.hypot(nx, nz) || 1; nx = (nx / nl) * nH; nz = (nz / nl) * nH;
        vert(cx + x, R.y, cz + z, nx, nY, nz, cc.r * j, cc.g * j, cc.b * j, (k / sides) * uLen, vv, mat, 0);
      }
    }
    grid(base, rings.length - 1, sides);
  }
  // a rounded blob (sandbag, head, lamp glass): radius r, height h, centred on the transform origin
  function blob(r, h, sides, col, mat, sag = 0) {
    const rings = [];
    for (let i = 0; i <= 6; i++) { const t = i / 6, a = Math.sin(t * Math.PI) ** (0.75 + sag * (1 - t)); rings.push({ y: (t - 0.5) * h, a: r * a }); }
    loft(rings, sides, col, mat);
  }
  return {
    st, tube, loft, blob, vert, grid, I,
    setM(m) { st.m = m; if (m) st.nm.getNormalMatrix(m); },
    setBob(a, b) { st.bob = [a[0], a[1], (b || a)[0], (b || a)[1]]; },
    tris: () => I.length / 3,
    geometry(withBob = true) {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
      g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3));
      g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3));
      g.setAttribute('uv', new THREE.Float32BufferAttribute(U, 2));
      g.setAttribute('aMT', new THREE.Float32BufferAttribute(MT, 2));
      if (withBob) g.setAttribute('aBob', new THREE.Float32BufferAttribute(BB, 4));
      g.setIndex(I);
      return g;
    },
  };
}

// sagging line between two points (parabolic catenary), n+1 points
function sagLine(A, B, sag, n) {
  const pts = [];
  for (let i = 0; i <= n; i++) { const t = i / n; const p = V3().lerpVectors(A, B, t); p.y -= sag * 4 * t * (1 - t); pts.push(p); }
  return pts;
}

// ---------------------------------------------------------------- envelope
// Unit envelope: mouth at y 0, crown at y 1. uv = (around, height). Gores bulge between the load tapes.
function envelopeGeometry(radial, lowRings, topRings, gores, o = {}) {
  const Rmax = o.rmax ?? 0.39, mouth = o.mouth ?? 0.09, s0 = o.s0 ?? 0.6, bulge = o.bulge ?? 0.028, fat = o.fat ?? 1.15;
  const prof = [];
  for (let i = 0; i < lowRings; i++) { const x = i / lowRings; prof.push([mouth + (Rmax - mouth) * Math.sin(x * Math.PI / 2) ** fat, x * s0]); }
  for (let i = 0; i <= topRings; i++) { const a = (i / topRings) * Math.PI / 2; prof.push([Math.max(Rmax * Math.cos(a), 0.0015), s0 + (1 - s0) * Math.sin(a)]); }
  const rows = prof.length, P = [], U = [], I = [];
  for (let i = 0; i < rows; i++) {
    const [r, s] = prof[i], w = Math.sin(Math.PI * clamp(s * 1.02, 0, 1)) ** 0.6;
    for (let k = 0; k <= radial; k++) {
      const u = k / radial, th = u * Math.PI * 2, gf = (u * gores) % 1, puff = 1 - (2 * gf - 1) ** 2;
      const rr = r * (1 + bulge * w * (puff - 0.6));
      P.push(Math.cos(th) * rr, s, Math.sin(th) * rr); U.push(u, s);
    }
  }
  for (let i = 0; i < rows - 1; i++) for (let k = 0; k < radial; k++) {
    const a = i * (radial + 1) + k, b = a + 1, c = a + radial + 1, d = c + 1; I.push(a, c, b, b, c, d);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(U, 2));
  g.setIndex(I); g.computeVertexNormals();
  const nrm = g.attributes.normal; // weld the seam normals
  for (let i = 0; i < rows; i++) {
    const a = i * (radial + 1), b = a + radial;
    const x = nrm.getX(a) + nrm.getX(b), y = nrm.getY(a) + nrm.getY(b), z = nrm.getZ(a) + nrm.getZ(b), l = Math.hypot(x, y, z) || 1;
    nrm.setXYZ(a, x / l, y / l, z / l); nrm.setXYZ(b, x / l, y / l, z / l);
  }
  return g;
}

// list: [{ pos:Vector3 (mouth), h, colA, colB, colC, pattern, seed, gores, hero, bob:[phase,amp], spin:[rate,phase] }]
function envelopeMesh(geo, mat, list) {
  const n = list.length, mesh = new THREE.InstancedMesh(geo, mat, n);
  const cA = new Float32Array(n * 3), cB = new Float32Array(n * 3), cC = new Float32Array(n * 3), par = new Float32Array(n * 4), bob = new Float32Array(n * 4);
  const m = new THREE.Matrix4();
  list.forEach((e, i) => {
    m.makeScale(e.h, e.h, e.h).setPosition(e.pos); mesh.setMatrixAt(i, m);
    cA.set([e.colA.r, e.colA.g, e.colA.b], i * 3); cB.set([e.colB.r, e.colB.g, e.colB.b], i * 3); cC.set([e.colC.r, e.colC.g, e.colC.b], i * 3);
    par.set([e.pattern, e.seed, e.gores, e.hero ? 1 : 0], i * 4); bob.set([e.bob[0], e.bob[1], e.spin[0], e.spin[1]], i * 4);
  });
  geo.setAttribute('iColA', new THREE.InstancedBufferAttribute(cA, 3));
  geo.setAttribute('iColB', new THREE.InstancedBufferAttribute(cB, 3));
  geo.setAttribute('iColC', new THREE.InstancedBufferAttribute(cC, 3));
  geo.setAttribute('iPar', new THREE.InstancedBufferAttribute(par, 4));
  geo.setAttribute('iBob', new THREE.InstancedBufferAttribute(bob, 4));
  mesh.frustumCulled = false;
  return mesh;
}

function envelopeMaterial(U) {
  return new THREE.ShaderMaterial({
    side: THREE.DoubleSide, fog: true, lights: true,
    uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.lights, THREE.UniformsLib.fog, { uSunDir: { value: new THREE.Vector3(0, 1, 0) }, uSunCol: { value: new THREE.Color(0, 0, 0) }, uSunOn: { value: 0 }, uTime: { value: 0 }, uGlow: { value: 0 }, uFlame: { value: 0 } }]),
    vertexShader: /* glsl */`
      attribute vec3 iColA, iColB, iColC; attribute vec4 iPar, iBob;
      uniform float uTime, uGlow, uFlame;
      varying vec2 vUv; varying vec3 vN, vV, vA, vB, vC; varying vec4 vPar; varying vec2 vG;
      #include <fog_pars_vertex>
      ${GLSL_BOB}
      void main(){
        float a = iBob.w + uTime*iBob.z, c = cos(a), s = sin(a);
        vec3 p = position, n = normal; p.xz = mat2(c,-s,s,c)*p.xz; n.xz = mat2(c,-s,s,c)*n.xz;
        vec4 wp = instanceMatrix*vec4(p,1.0); wp.xyz += bobOff(iBob.xy, uTime);
        vec4 mvPosition = modelViewMatrix*wp;
        vN = normalMatrix*normalize(mat3(instanceMatrix)*n); vV = mvPosition.xyz;
        vUv = uv; vA = iColA; vB = iColB; vC = iColC; vPar = iPar;
        float x = flareX(iPar.y, uTime);
        vG = mix(vec2(glowOf(x)*0.8, flameOf(x)), vec2(uGlow, uFlame), iPar.w);
        gl_Position = projectionMatrix*mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      uniform float uTime;
      varying vec2 vUv; varying vec3 vN, vV, vA, vB, vC; varying vec4 vPar; varying vec2 vG;
      #include <common>
      #include <lights_pars_begin>
      #include <fog_pars_fragment>
      ${GLSL_LIGHT}
      float band(float x, float a, float b, float f){ return smoothstep(a-f, a+f, x)*(1.0-smoothstep(b-f, b+f, x)); }
      vec3 pattern(vec2 uv, out float tape){
        float gores = vPar.z, id = vPar.x, s = uv.y;
        float g = uv.x*gores, gi = floor(g), td = tri(g), alt = mod(gi, 2.0);
        float fg = fwidth(g)+1e-4, fs = fwidth(s)+1e-5;
        vec3 A = vA, B = vB, C = vC, col;
        if (id < 2.5) {                                   // ---- the Flagship: crimson field, gold heraldry
          col = A*mix(1.0, 0.7, alt);
          if (id > 0.5 && id < 1.5) { float d1 = floor(g*0.5+s*gores*0.33), d2 = floor(g*0.5-s*gores*0.33+64.0); col = A*mix(1.0, 0.58, mod(d1+d2, 2.0)); }
          if (id > 1.5) { float sp = fract((g+s*gores*0.85)/4.0); col = mix(col, B*0.92, band(sp, 0.04, 0.2, 0.012)); }
          col = mix(col, B, band(td, 0.80, 0.90, fg*1.5)*0.9);                     // gold piping beside every seam
          float low = 1.0-smoothstep(0.165-fs, 0.165+fs, s);                       // candy-striped lower cone
          col = mix(col, mix(B, A*0.85, alt), low);
          col = mix(col, C, band(s, 0.165, 0.182, fs));
          float z1 = s+(td-0.5)*0.045;                                              // double chevron
          col = mix(col, B, band(z1, 0.235, 0.262, fs*1.5)); col = mix(col, C, band(z1, 0.285, 0.296, fs*1.5));
          float eq = band(s, 0.485, 0.645, fs);                                     // the great gold belt
          float sb = (s-0.565)/0.08, dia = td+abs(sb);                              // diamonds centred on the gores
          vec3 belt = mix(B, A*0.9, 1.0-smoothstep(0.62-fg, 0.62+fg, dia));
          belt = mix(belt, C, 1.0-smoothstep(0.2-fg, 0.2+fg, dia));
          belt = mix(belt, A*0.75, band(abs(sb), 0.80, 0.90, fs*12.0));
          col = mix(col, belt, eq);
          col = mix(col, C, band(s, 0.468, 0.485, fs)+band(s, 0.645, 0.662, fs));
          float z2 = s-(td-0.5)*0.04; col = mix(col, B, band(z2, 0.745, 0.768, fs*1.5));
          float cr = smoothstep(0.865-fs*2.0, 0.865+fs*2.0, s-(td-0.5)*0.06);      // scalloped gold crown, sunburst
          col = mix(col, mix(B, A*0.9, alt*smoothstep(0.92, 0.925, s)), cr);
          col = mix(col, C, smoothstep(0.972, 0.976, s));
          col = mix(col, A*0.18, 1.0-smoothstep(0.03-fs, 0.03+fs, s));              // scorched skirt
          col = mix(col, B, band(s, 0.03, 0.043, fs));
        } else {                                          // ---- consorts and guard
          if (id < 3.5) col = mix(A, B, alt);
          else if (id < 4.5) { float sp = mod(floor(g+s*gores*0.75), 3.0); col = sp < 0.5 ? A : (sp < 1.5 ? B : C); }
          else if (id < 5.5) { float zz = s*7.0+(tri(g*0.5)-0.5)*0.45; col = mix(A, B, band(fract(zz*0.5), 0.5, 1.0, fs*5.0)); }
          else if (id < 6.5) { float d1 = floor(g*0.5+s*gores*0.4), d2 = floor(g*0.5-s*gores*0.4+64.0); col = mod(d1+d2, 2.0) < 0.5 ? A : B; }
          else { col = A*mix(1.0, 0.78, alt); float bz = abs(s-0.56+(td-0.5)*0.07);
            col = mix(col, B, 1.0-smoothstep(0.075, 0.075+fs*2.0, bz)); col = mix(col, C, band(bz, 0.095, 0.115, fs)); }
          col = mix(col, C, smoothstep(0.9, 0.9+fs*2.0, s+(td-0.5)*0.05));
          col = mix(col, B, smoothstep(0.972, 0.976, s));
          col = mix(col, C, band(s, 0.035, 0.06, fs));
          col = mix(col, A*0.2, 1.0-smoothstep(0.035-fs, 0.035+fs, s));
        }
        tape = smoothstep(0.955-fg, 0.955+fg, td);
        float rows = 30.0, pf = fwidth(s*rows);
        float seam = smoothstep(0.93-pf, 0.93+pf, tri(s*rows+0.5))*(1.0-smoothstep(0.3, 0.9, pf));
        float tone = hash2(vec2(gi, floor(s*rows)));
        col *= mix(1.0, 0.9+0.2*tone, 1.0-smoothstep(0.2, 0.8, pf));               // panel-to-panel dye variation
        col *= 1.0-0.16*seam;
        return col;
      }
      void main(){
        float tape; vec3 alb = pattern(vUv, tape);
        alb *= mix(1.0, 0.5, tape);
        vec3 V = normalize(-vV), n = normalize(vN); bool inside = !gl_FrontFacing; if (inside) n = -n;
        vec3 L, sunC; sunLight(L, sunC);
        float ndl = dot(n, L), vdl = dot(V, -L);
        // gore puff: soft self shading in the valleys beside each tape
        float puff = 1.0-pow(tri(vUv.x*vPar.z), 3.0)*0.22;
        vec3 col = alb*puff*(sunC*saturate((ndl+0.3)/1.3)+skyLight(n))*RECIPROCAL_PI;
        // sunlight carried through the fabric: the shaded side glows with its own dye, most of all against the sun
        vec3 dye = alb*alb*1.6+alb*0.25;
        col += dye*sunC*RECIPROCAL_PI*saturate(0.25-ndl)*(0.3+0.95*pow(saturate(vdl), 1.5))*(inside ? 1.6 : 1.0);
        float fr = pow(1.0-saturate(dot(n, V)), 3.0);
        col += sunC*fr*(0.06+0.9*pow(saturate(vdl), 2.0))*RECIPROCAL_PI*(0.4+alb);
        col += sunC*pow(saturate(dot(n, normalize(L+V))), 30.0)*0.07;
        // the lantern: burner light soaking through the cloth, hot near the mouth, tapes and seams in silhouette
        float s = vUv.y, G = vG.x;
        float fall = mix(1.12, 0.55, smoothstep(0.0, 1.0, s))*smoothstep(0.0, 0.05, s);
        float flick = 0.92+0.08*sin(uTime*19.0+s*9.0)*sin(uTime*7.3+vUv.x*40.0)+0.1*vG.y*vnoise(vec2(vUv.x*14.0, s*6.0-uTime*1.6));
        vec3 warm = vec3(1.0, 0.72, 0.42);
        vec3 lant = alb*(1.15+alb)*warm*fall*flick*mix(0.8, 1.05, saturate(dot(n, V)));
        col += lant*G*(inside ? 1.6 : 0.85)*mix(1.0, 0.35, tape);
        gl_FragColor = vec4(col, 1.0);
        #include <fog_fragment>
      }`,
  });
}

// ---------------------------------------------------------------- gondola / rigging material
function propsMaterial(instanced) {
  return new THREE.ShaderMaterial({
    side: THREE.DoubleSide, fog: true, lights: true, vertexColors: true, defines: instanced ? { INST: 1 } : {},
    uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.lights, THREE.UniformsLib.fog,
      { uSunDir: { value: new THREE.Vector3(0, 1, 0) }, uSunCol: { value: new THREE.Color(0, 0, 0) }, uSunOn: { value: 0 }, uTime: { value: 0 }, uFlame: { value: 0 }, uFirePos: { value: new THREE.Vector3(0, 9.8, 0) }, uFireR2: { value: 40 } }]),
    vertexShader: /* glsl */`
      attribute vec2 aMT;
      #ifdef INST
        attribute vec4 iBob, iPar;
      #else
        attribute vec4 aBob;
      #endif
      uniform float uTime, uFlame, uFireR2; uniform vec3 uFirePos;
      varying vec3 vN, vV, vCol; varying vec2 vUv; varying float vMat, vFire;
      #include <fog_pars_vertex>
      ${GLSL_BOB}
      void main(){
        vec3 p = position, n = normal; vec3 d; float fl, r2;
        #ifdef INST
          float a = iBob.w + uTime*iBob.z, c = cos(a), s = sin(a);
          p.xz = mat2(c,-s,s,c)*p.xz; n.xz = mat2(c,-s,s,c)*n.xz;
          d = p - vec3(0.0, 3.3, 0.0); fl = flameOf(flareX(iPar.y, uTime)); r2 = 5.0;
          vec4 wp = instanceMatrix*vec4(p, 1.0); wp.xyz += bobOff(iBob.xy, uTime);
          n = normalize(mat3(instanceMatrix)*n);
        #else
          d = p - uFirePos; fl = uFlame; r2 = uFireR2;
          vec4 wp = vec4(p + mix(bobOff(aBob.xy, uTime), bobOff(aBob.zw, uTime), aMT.y), 1.0);
        #endif
        vFire = fl*clamp(dot(normal, -normalize(d))*0.6+0.55, 0.0, 1.0)/(1.0+dot(d, d)/r2);
        vec4 mvPosition = modelViewMatrix*wp;
        vN = normalMatrix*n; vV = mvPosition.xyz; vCol = color; vUv = uv; vMat = aMT.x;
        gl_Position = projectionMatrix*mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      uniform float uTime;
      varying vec3 vN, vV, vCol; varying vec2 vUv; varying float vMat, vFire;
      #include <common>
      #include <lights_pars_begin>
      #include <fog_pars_fragment>
      ${GLSL_LIGHT}
      void main(){
        vec3 V = normalize(-vV), n = normalize(vN); if (dot(n, V) < 0.0) n = -n;
        vec3 L, sunC; sunLight(L, sunC);
        vec3 alb = vCol; float spec = 0.03, gloss = 10.0, m = vMat;
        float fw = fwidth(vUv.x)+fwidth(vUv.y);
        if (m < 0.5) { alb *= 0.78+0.4*vnoise(vec2(vUv.x*30.0, vUv.y*2.5)); }
        else if (m < 1.5) {
          float row = vUv.y*9.0, stake = vUv.x*5.0, fade = 1.0-smoothstep(0.1, 0.45, fw*9.0);
          float over = sin((stake+mod(floor(row), 2.0)*0.5)*6.2832);
          float w = (0.58+0.42*over)*(1.0-pow(tri(row+0.5), 3.0)*0.8);
          alb *= mix(0.72, 0.42+0.8*w, fade);
          alb *= 1.0-0.25*smoothstep(0.80, 0.86, tri(vUv.y*0.9+0.5));          // cane hoops that still read far off
          alb *= 0.86+0.28*vnoise(vUv*vec2(0.9, 2.6));
        }
        else if (m < 2.5) { float fade = 1.0-smoothstep(0.1, 0.5, fwidth(vUv.y)*14.0);
          alb *= mix(0.86, 0.68+0.34*sin(vUv.x*12.566+vUv.y*14.0), fade); }
        else if (m < 3.5) { alb *= 0.9+0.2*vnoise(vUv*5.0); }
        else if (m < 4.5) { spec = 1.2; gloss = 36.0; }
        float ndl = dot(n, L);
        vec3 col = alb*(sunC*saturate((ndl+0.2)/1.2)+skyLight(n))*RECIPROCAL_PI;
        col += sunC*alb*pow(saturate(dot(n, normalize(L+V))), gloss)*spec;
        col += sunC*RECIPROCAL_PI*pow(1.0-saturate(dot(n, V)), 3.0)*pow(saturate(dot(V, -L)), 2.0)*0.6;
        col += alb*vec3(1.0, 0.5, 0.17)*vFire*(1.7+0.3*sin(uTime*23.0));
        if (m > 4.5 && m < 5.5) col = vCol*(4.2+0.6*sin(uTime*9.0+vUv.y*30.0));
        gl_FragColor = vec4(col, 1.0);
        #include <fog_fragment>
      }`,
  });
}

// ---------------------------------------------------------------- pennants (bunting triangles and long streamers)
function flagMaterial(streamer) {
  return new THREE.ShaderMaterial({
    side: THREE.DoubleSide, fog: true, lights: true, defines: streamer ? { STREAMER: 1 } : {},
    uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.lights, THREE.UniformsLib.fog, { uSunDir: { value: new THREE.Vector3(0, 1, 0) }, uSunCol: { value: new THREE.Color(0, 0, 0) }, uSunOn: { value: 0 }, uTime: { value: 0 } }]),
    vertexShader: /* glsl */`
      attribute float aFree; attribute vec4 iA, iB, iC, iD, iE;
      uniform float uTime;
      varying vec3 vN, vV, vCol; varying float vFree; varying vec2 vUv;
      #include <fog_pars_vertex>
      ${GLSL_BOB}
      void main(){
        vec3 T = iB.xyz, Nn = iC.xyz, D = cross(Nn, T);
        float size = iA.w, ph = iB.w, asp = iC.w, f = aFree; vec3 lp, n;
        #ifdef STREAMER
          float x = position.x*size*asp, k = x*0.8-uTime*4.4+ph;
          float w1 = sin(k), w2 = sin(x*1.9-uTime*6.8+ph*1.7), env = f*(0.35+0.65*f);
          lp = T*x + D*(position.y*size*(1.0+0.15*w2*f)+f*f*size*asp*0.13+sin(k*0.7+1.3)*0.45*env*size) + Nn*(w1*0.75+w2*0.25)*env*size;
          n = normalize(Nn - T*cos(k)*0.4*env*size + D*w2*0.3*f);
        #else
          float w = sin(uTime*5.3+ph+f*2.6+position.x*2.0), w2 = sin(uTime*3.1+ph*2.3);
          lp = T*position.x*size + D*(-position.y*size*asp*(1.0-0.08*w2*f)) + Nn*(w*0.2+w2*0.14+0.12)*f*size + T*w2*0.07*f*size;
          n = normalize(Nn + D*(w*0.5+0.2)*f - T*cos(uTime*5.3+ph+f*2.6+position.x*2.0)*0.35*f);
        #endif
        vec3 bo = mix(bobOff(iD.xy, uTime), bobOff(iD.zw, uTime), iE.w);
        vec4 mvPosition = modelViewMatrix*vec4(iA.xyz+lp+bo, 1.0);
        vN = normalMatrix*n; vV = mvPosition.xyz; vCol = iE.rgb; vFree = f; vUv = position.xy;
        gl_Position = projectionMatrix*mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      varying vec3 vN, vV, vCol; varying float vFree; varying vec2 vUv;
      #include <common>
      #include <lights_pars_begin>
      #include <fog_pars_fragment>
      ${GLSL_LIGHT}
      void main(){
        vec3 V = normalize(-vV), n = normalize(vN); if (dot(n, V) < 0.0) n = -n;
        vec3 L, sunC; sunLight(L, sunC);
        vec3 alb = vCol;
        #ifdef STREAMER
          alb *= mix(1.0, 0.62, smoothstep(0.24, 0.28, abs(vUv.y)*(1.0+vFree)));   // darker selvedge
          alb = mix(alb, alb*0.7+0.2, step(0.5, fract(vUv.x*5.0))*0.25);           // faint barring along the tail
        #else
          alb *= mix(0.8, 1.08, smoothstep(0.0, 0.12, vFree));                      // hem at the line
        #endif
        float ndl = dot(n, L);
        vec3 col = alb*(sunC*(saturate(ndl)*0.75+0.12)+skyLight(n))*RECIPROCAL_PI;
        col += alb*alb*sunC*RECIPROCAL_PI*saturate(-ndl)*(0.5+1.4*pow(saturate(dot(V, -L)), 2.0));  // back-lit cloth
        gl_FragColor = vec4(col, 1.0);
        #include <fog_fragment>
      }`,
  });
}
function flagGeometry(streamer) {
  const P = [], F = [], I = [];
  if (streamer) { // x 0..1 along the tail, y +-0.5 tapering to a swallow tail
    const n = 22;
    for (let i = 0; i <= n; i++) { const x = i / n, w = 0.5 * (1 - 0.55 * x); for (let k = 0; k < 3; k++) { let y = (k - 1) * w; let xx = x; if (i === n && k === 1) xx = x - 0.09; P.push(xx, y, 0); F.push(x); } }
    for (let i = 0; i < n; i++) for (let k = 0; k < 2; k++) { const a = i * 3 + k, b = a + 1, c = a + 3, d = c + 1; I.push(a, c, b, b, c, d); }
  } else {        // top edge x -0.5..0.5 at y 0, point at y -1
    const n = 4;
    for (let i = 0; i <= n; i++) { const t = i / n, w = 0.5 * (1 - t); for (let k = 0; k < 3; k++) { P.push((k - 1) * w, -t, 0); F.push(t); } }
    for (let i = 0; i < n; i++) for (let k = 0; k < 2; k++) { const a = i * 3 + k, b = a + 1, c = a + 3, d = c + 1; I.push(a, c, b, b, c, d); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
  g.setAttribute('aFree', new THREE.Float32BufferAttribute(F, 1));
  g.setIndex(I);
  return g;
}
// list entries: { pos, size, tan, phase, nrm, asp, bobA, bobB, t, col }
function flagMesh(list, streamer) {
  const n = list.length, geo = flagGeometry(streamer);
  const A = new Float32Array(n * 4), B = new Float32Array(n * 4), C = new Float32Array(n * 4), D = new Float32Array(n * 4), E = new Float32Array(n * 4);
  list.forEach((f, i) => {
    A.set([f.pos.x, f.pos.y, f.pos.z, f.size], i * 4); B.set([f.tan.x, f.tan.y, f.tan.z, f.phase], i * 4); C.set([f.nrm.x, f.nrm.y, f.nrm.z, f.asp], i * 4);
    D.set([f.bobA[0], f.bobA[1], f.bobB[0], f.bobB[1]], i * 4); E.set([f.col.r, f.col.g, f.col.b, f.t], i * 4);
  });
  for (const [k, v] of [['iA', A], ['iB', B], ['iC', C], ['iD', D], ['iE', E]]) geo.setAttribute(k, new THREE.InstancedBufferAttribute(v, 4));
  const mesh = new THREE.InstancedMesh(geo, flagMaterial(streamer), n);
  mesh.frustumCulled = false;
  return mesh;
}
// frame for a flag: tangent T (unit), "down" made orthogonal to it, normal = T x down
function flagFrame(T) {
  const down = V3(0, -1, 0).addScaledVector(T, T.y); if (down.lengthSq() < 1e-4) down.set(1, 0, 0); down.normalize();
  return V3().crossVectors(T, down).normalize();
}

// ---------------------------------------------------------------- burner flames (cone of fire + billboard halo)
// list: [{ pos, r, h, glow, seed, hero, bob }]
function fireMesh(list) {
  const cone = new THREE.CylinderGeometry(1, 1, 1, 14, 10, true); cone.translate(0, 0.5, 0);
  const quad = new THREE.PlaneGeometry(2, 2);
  const P = [], N = [], U = [], K = [], I = [];
  let off = 0;
  for (const [g, kind] of [[cone, 0], [quad, 1]]) {
    const p = g.attributes.position, nn = g.attributes.normal, uv = g.attributes.uv;
    for (let i = 0; i < p.count; i++) { P.push(p.getX(i), p.getY(i), p.getZ(i)); N.push(nn.getX(i), nn.getY(i), nn.getZ(i)); U.push(uv.getX(i), uv.getY(i)); K.push(kind); }
    for (let i = 0; i < g.index.count; i++) I.push(g.index.getX(i) + off);
    off += p.count; g.dispose();
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); geo.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(U, 2)); geo.setAttribute('aKind', new THREE.Float32BufferAttribute(K, 1)); geo.setIndex(I);
  const n = list.length, par = new Float32Array(n * 4), bob = new Float32Array(n * 4);
  const mat = new THREE.ShaderMaterial({
    side: THREE.DoubleSide, fog: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { uTime: { value: 0 }, uFlame: { value: 0 } }]),
    vertexShader: /* glsl */`
      attribute float aKind; attribute vec4 iBob, iPar;
      uniform float uTime, uFlame;
      varying vec2 vUv; varying float vKind, vF, vSeed; varying vec3 vN, vV;
      #include <fog_pars_vertex>
      ${GLSL_BOB}
      void main(){
        float F = max(mix(flameOf(flareX(iPar.y, uTime)), uFlame, iPar.w), 0.06);
        vec3 bo = bobOff(iBob.xy, uTime); vec4 mvPosition;
        if (aKind < 0.5) {
          float v = position.y, prof = mix(0.4, 1.0, smoothstep(0.0, 0.25, v))*(1.0-pow(v, 1.7));
          vec3 p = vec3(position.x*prof, v*(0.14+0.86*F), position.z*prof);
          p.xz += vec2(sin(uTime*13.0+v*8.0+iPar.y*40.0), cos(uTime*11.0+v*7.0+iPar.y*17.0))*0.16*v*v;
          vec4 wp = instanceMatrix*vec4(p, 1.0); wp.xyz += bo; mvPosition = modelViewMatrix*wp;
          vN = normalMatrix*normalize(mat3(instanceMatrix)*normal);
        } else {
          vec4 c = instanceMatrix*vec4(0.0, 0.3, 0.0, 1.0); c.xyz += bo; mvPosition = modelViewMatrix*c;
          mvPosition.xy += position.xy*iPar.x*(0.35+0.65*F); vN = vec3(0.0, 0.0, 1.0);
        }
        vV = mvPosition.xyz; vUv = uv; vKind = aKind; vF = F; vSeed = iPar.y;
        gl_Position = projectionMatrix*mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      uniform float uTime;
      varying vec2 vUv; varying float vKind, vF, vSeed; varying vec3 vN, vV;
      #include <common>
      #include <fog_pars_fragment>
      ${GLSL_LIGHT.slice(GLSL_LIGHT.indexOf('float hash1'))}
      void main(){
        vec3 col;
        if (vKind < 0.5) {
          float v = vUv.y, xx = abs(vUv.x*2.0-1.0);
          float n = vnoise(vec2(xx*7.0, v*3.5-uTime*5.5+vSeed*9.0))*0.6+vnoise(vec2(xx*15.0, v*8.0-uTime*9.5))*0.4;
          float body = saturate(n*1.5+0.6-v*1.5);
          float edge = pow(abs(dot(normalize(vN), normalize(-vV))), 0.7);
          vec3 c = mix(vec3(1.0, 0.3, 0.04), vec3(1.0, 0.78, 0.4), saturate(body*1.7-0.35))*5.0;
          c = mix(c, vec3(0.3, 0.5, 1.0)*4.0, 1.0-smoothstep(0.02, 0.15, v));
          col = c*body*edge*(0.25+0.75*smoothstep(0.0, 0.4, vF));
        } else {
          float r = length(vUv*2.0-1.0), g = exp(-r*r*5.5)*(1.0-smoothstep(0.65, 1.0, r));
          col = vec3(1.0, 0.52, 0.2)*g*(0.55*vF+0.03);
        }
        #ifdef USE_FOG
          #ifdef FOG_EXP2
            col *= exp(-fogDensity*fogDensity*vFogDepth*vFogDepth);
          #else
            col *= 1.0-smoothstep(fogNear, fogFar, vFogDepth);
          #endif
        #endif
        gl_FragColor = vec4(col, 1.0);
      }`,
  });
  const mesh = new THREE.InstancedMesh(geo, mat, n), m = new THREE.Matrix4();
  list.forEach((f, i) => {
    m.makeScale(f.r, f.h, f.r).setPosition(f.pos); mesh.setMatrixAt(i, m);
    par.set([f.glow, f.seed, 0, f.hero ? 1 : 0], i * 4); bob.set([f.bob[0], f.bob[1], 0, 0], i * 4);
  });
  geo.setAttribute('iPar', new THREE.InstancedBufferAttribute(par, 4)); geo.setAttribute('iBob', new THREE.InstancedBufferAttribute(bob, 4));
  mesh.frustumCulled = false; mesh.renderOrder = 6;   // after the world's cloud puffs, which would otherwise paint over the flames
  return mesh;
}

// ---------------------------------------------------------------- rigging helpers
const sePoint = (a, b, n, th, y) => { const e = 2 / n, c = Math.cos(th), s = Math.sin(th); return V3(a * Math.sign(c) * Math.abs(c) ** e, y, b * Math.sign(s) * Math.abs(s) ** e); };
const seRing = (a, b, n, y, count) => { const pts = []; for (let i = 0; i <= count; i++) pts.push(sePoint(a, b, n, (i % count) / count * Math.PI * 2, y)); return pts; };

// a rope with bunting between two (independently bobbing) points
function flagLine(b, flags, rng, A, B, sag, bobA, bobB, o) {
  const len = A.distanceTo(B), n = Math.max(8, Math.round(len / 1.8)), pts = sagLine(A, B, sag, n);
  b.setBob(bobA, bobB); b.tube(pts, o.rad ?? 0.05, 4, o.rope, 2, { t: (t) => t });
  const count = Math.max(1, Math.floor(len * (1 - (o.skip0 || 0) - (o.skip1 || 0)) / (o.size * (o.gap ?? 1.12))));
  const off = rng.int(0, o.cols.length - 1), AB = V3().subVectors(B, A);
  for (let i = 0; i < count; i++) {
    const t = lerp(o.skip0 || 0, 1 - (o.skip1 || 0), (i + 0.5) / count);
    const pos = V3().lerpVectors(A, B, t); pos.y -= sag * 4 * t * (1 - t);
    const T = AB.clone(); T.y -= sag * 4 * (1 - 2 * t); T.normalize();
    const c = o.cols[(i + off) % o.cols.length].clone().multiplyScalar(0.9 + rng() * 0.2);
    flags.push({ pos, size: o.size, tan: T, phase: rng() * 6.283, nrm: flagFrame(T), asp: o.asp ?? 1.35, bobA, bobB, t, col: c });
  }
  if (o.lamps) { // festoon lamps riding on the rope, clear of the flags
    const nl = Math.max(2, Math.round(len / o.lamps));
    for (let i = 1; i < nl; i++) {
      const t = i / nl, pos = V3().lerpVectors(A, B, t); pos.y -= sag * 4 * t * (1 - t) - 0.32;
      b.st.t = t; b.setM(new THREE.Matrix4().setPosition(pos)); b.blob(o.lampR ?? 0.2, (o.lampR ?? 0.2) * 2.1, 6, o.lampCol, 5); b.setM(null); b.st.t = 0;
    }
  }
}
function addStreamer(streamers, rng, pos, wind, len, width, col, bob) {
  const T = wind.clone().add(V3(rng.range(-0.12, 0.12), rng.range(-0.08, 0.05), rng.range(-0.12, 0.12))).normalize();
  streamers.push({ pos, size: width, tan: T, phase: rng() * 6.283, nrm: flagFrame(T), asp: len / width, bobA: bob, bobB: bob, t: 0, col });
}
// gala dress for a free balloon (opts.balloons[i].dressed): bunting sewn up six load tapes from the mouth to the
// equator, a garland of swags round the equator and a long crown pennant. base = basket bottom, s = scale.
// Matches the fleet envelope (mouth at base + 5 s, 17 s tall, widest at 0.6 of its height).
function dressBalloon(flags, streamers, rng, base, s, bob, cols, wind) {
  const H = 17 * s, y0 = base.y + 5 * s, size = 0.85 * s, step = size * 1.14, ph0 = rng() * 6.283;
  const prof = (x) => [H * (0.09 + 0.3 * Math.sin(x * Math.PI / 2) ** 1.1) + 0.1 * s, y0 + H * 0.6 * x];
  const flag = (pos, T, nrm, i) => flags.push({ pos, size, tan: T, phase: rng() * 6.283, nrm, asp: 1.35, bobA: bob, bobB: bob, t: 0, col: cols[i % cols.length].clone().multiplyScalar(0.9 + rng() * 0.2) });
  for (let m = 0; m < 6; m++) {                       // up the tapes: the flags stand off the cloth, trailing to one side
    const th = ph0 + (m + 0.5) / 6 * Math.PI * 2, c = Math.cos(th), sn = Math.sin(th), turn = m % 2 ? 1 : -1;
    let acc = step * 0.5, [pr, py] = prof(0.05), i = m;
    for (let k = 1; k <= 90; k++) {
      const [r, y] = prof(0.05 + 0.92 * k / 90), dr = r - pr, dy = y - py, dl = Math.hypot(dr, dy);
      acc += dl;
      if (acc >= step) {
        acc -= step;
        const T = V3(c * dr / dl, dy / dl, sn * dr / dl), out = V3(c * dy / dl, -dr / dl, sn * dy / dl), az = V3(-sn * turn, 0, c * turn);
        flag(V3(base.x + c * r, y, base.z + sn * r), T, out.multiplyScalar(0.75).addScaledVector(az, 0.66).normalize(), i++);
      }
      pr = r; py = y;
    }
  }
  const R = H * 0.39 * 1.035, yE = y0 + H * 0.6, swags = 12, per = Math.max(3, Math.round(R * Math.PI * 2 / swags / step)), sag = 0.95 * s;
  for (let j = 0; j < swags; j++) for (let k = 0; k < per; k++) {     // the garland: swags hanging from the equator
    const t = (k + 0.5) / per, th = ph0 + (j + t) / swags * Math.PI * 2, c = Math.cos(th), sn = Math.sin(th);
    const dth = Math.PI * 2 / swags, T = V3(-sn * R * dth, -sag * Math.PI * Math.cos(Math.PI * t), c * R * dth).normalize();
    flag(V3(base.x + c * R, yE - sag * Math.sin(Math.PI * t), base.z + sn * R), T, flagFrame(T), j * per + k);
  }
  addStreamer(streamers, rng, V3(base.x, y0 + H + 0.1 * s, base.z), wind, rng.range(11, 14) * s, 1.25 * s, cols[1], bob);
}
function ladder(b, A, B, sag, K, w = 0.42) {
  const n = Math.max(4, Math.round(A.distanceTo(B) / 0.42)), mid = sagLine(A, B, sag, n);
  const side = V3().subVectors(B, A).cross(V3(0, 1, 0)); if (side.lengthSq() < 1e-3) side.set(1, 0, 0); side.normalize().multiplyScalar(w / 2);
  const L = mid.map((p) => p.clone().add(side)), R = mid.map((p) => p.clone().sub(side));
  b.tube(L, 0.035, 4, K.rope, 2); b.tube(R, 0.035, 4, K.rope, 2);
  for (let i = 1; i < n; i++) b.tube([L[i], R[i]], 0.032, 4, K.wood, 0, { jit: 0.3 });
}
function crew(b, rng, K, x, y, z, yaw) {
  const m = new THREE.Matrix4().makeRotationY(yaw).setPosition(x, y, z); b.setM(m);
  const coat = rng.pick(K.coats), hgt = rng.range(0.92, 1.06), sk = K.skin;
  b.loft([{ y: 0, a: 0.11, b: 0.1 }, { y: 0.45 * hgt, a: 0.14, b: 0.12 }, { y: 0.86 * hgt, a: 0.17, b: 0.13 }, { y: 1.15 * hgt, a: 0.2, b: 0.13 },
    { y: 1.42 * hgt, a: 0.23, b: 0.13 }, { y: 1.5 * hgt, a: 0.1, b: 0.09 }, { y: 1.56 * hgt, a: 0.06, b: 0.06, col: sk }], 8, coat, 6, { jit: 0.2 });
  b.setM(new THREE.Matrix4().makeRotationY(yaw).setPosition(x, y + 1.67 * hgt, z)); b.blob(0.115, 0.27, 8, sk, 6);
  if (rng.chance(0.7)) { // hat
    b.setM(new THREE.Matrix4().makeRotationY(yaw).setPosition(x, y + 1.76 * hgt, z));
    const tall = rng.range(0.08, 0.2);
    b.loft([{ y: 0, a: 0.2 }, { y: 0.015, a: 0.115 }, { y: tall, a: 0.12 }, { y: tall, a: 0.01 }], 8, K.hat, 6);
  }
  b.setM(null);
}

// ---------------------------------------------------------------- the Flagship gondola (two decks)
// Returns the outrigger tip positions (one per entry of outAngles) where the hawsers make fast.
function buildFlagshipGondola(b, rng, K, flags, streamers, bob, wind, outAngles, mouthY, mouthR) {
  const SE = 3.1, M4 = () => new THREE.Matrix4();
  b.setBob(bob);
  // skids and bearers
  for (const sz of [-1.9, 1.9]) {
    const pts = []; for (let i = 0; i <= 12; i++) { const x = lerp(-5.9, 5.9, i / 12), up = Math.max(0, Math.abs(x) - 4.3); pts.push(V3(x, 0.14 + up * up * 0.42, sz)); }
    b.tube(pts, 0.15, 6, K.woodDk, 0, { cap: true });
    for (const x of [-3.2, -1.1, 1.1, 3.2]) b.tube([V3(x, 0.14, sz), V3(x, 0.72, sz * 0.96)], 0.09, 5, K.wood, 0);
  }
  for (const x of [-3.2, 0, 3.2]) b.tube([V3(x, 0.52, -2.7), V3(x, 0.52, 2.7)], 0.11, 4, K.woodDk, 0, { rot: Math.PI / 4, cap: true });
  // lower hull: flared wicker tub with hoops, leather straps and a rolled rim
  const hull = [[0.62, 0.02, 0.02], [0.62, 4.3, 2.5], [0.78, 4.75, 2.95], [1.4, 5.0, 3.15], [2.2, 5.15, 3.3], [3.0, 5.38, 3.52]].map(([y, a, bb]) => ({ y, a, b: bb, n: SE }));
  b.loft(hull, 44, K.wicker, 1, { jit: 0 });
  b.loft([{ y: 0.97, a: 0.02, b: 0.02, n: SE }, { y: 0.97, a: 4.8, b: 3.0, n: SE }], 44, K.wood, 0);
  b.tube(seRing(5.4, 3.54, SE, 3.03, 48), 0.19, 7, K.leather, 6, { closed: true });
  b.tube(seRing(5.1, 3.25, SE, 1.8, 48), 0.075, 5, K.woodDk, 0, { closed: true });
  b.tube(seRing(4.82, 3.0, SE, 0.82, 48), 0.09, 5, K.woodDk, 0, { closed: true });
  for (let i = 0; i < 14; i++) {
    const th = (i + 0.5) / 14 * Math.PI * 2;
    b.tube(hull.slice(1).map((r) => sePoint(r.a * 1.012, r.b * 1.018, SE, th, r.y)), 0.07, 4, K.leather, 6);
  }
  // sandbags on short lanyards round the rim
  const nb = 16 + rng.int(0, 4);
  for (let i = 0; i < nb; i++) {
    const th = (i + rng.range(-0.2, 0.2)) / nb * Math.PI * 2, drop = rng.range(0.7, 1.5);
    const top = sePoint(5.42, 3.56, SE, th, 3.0), p = sePoint(5.62, 3.78, SE, th, 3.0 - drop);
    b.tube([top, p.clone().setY(p.y + 0.3)], 0.03, 4, K.rope, 2);
    b.setM(M4().makeRotationY(rng() * 6).setPosition(p)); b.blob(rng.range(0.22, 0.3), rng.range(0.55, 0.72), 7, rng.chance(0.25) ? K.sackDk : K.sack, 3, 0.9); b.setM(null);
  }
  // gallery posts, rope rail, upper deck with wicker parapet
  const np = 12;
  for (let i = 0; i < np; i++) {
    const th = (i + 0.5) / np * Math.PI * 2;
    b.tube([sePoint(5.2, 3.35, SE, th, 3.0), sePoint(4.25, 2.8, SE, th, 4.5)], 0.085, 5, K.wood, 0);
    b.tube([sePoint(5.25, 3.4, SE, th, 3.1), sePoint(4.45, 2.95, SE, th + Math.PI * 2 / np, 4.4)], 0.028, 4, K.rope, 2);
  }
  b.tube(seRing(4.8, 3.12, SE, 3.72, 40), 0.04, 4, K.rope, 2, { closed: true });
  b.tube(seRing(4.3, 2.84, SE, 4.5, 44), 0.13, 6, K.woodDk, 0, { closed: true });
  b.loft([{ y: 4.56, a: 0.02, b: 0.02, n: SE }, { y: 4.56, a: 4.25, b: 2.8, n: SE }], 40, K.wood, 0);
  b.loft([[4.5, 4.25, 2.8], [5.1, 4.34, 2.9], [5.68, 4.5, 3.05]].map(([y, a, bb]) => ({ y, a, b: bb, n: SE })), 40, K.wickerLt, 1, { jit: 0 });
  b.tube(seRing(4.52, 3.07, SE, 5.7, 44), 0.15, 7, K.leather, 6, { closed: true });
  // scalloped crimson-and-gold valance under the upper deck
  const nv = 36;
  for (let i = 0; i < nv; i++) {
    const t0 = i / nv * Math.PI * 2, t1 = (i + 1) / nv * Math.PI * 2, tm = (t0 + t1) / 2, c = i % 2 ? K.gold : K.crimson;
    const p0 = sePoint(4.42, 2.95, SE, t0, 4.42), p1 = sePoint(4.42, 2.95, SE, t1, 4.42), pm = sePoint(4.52, 3.05, SE, tm, 3.62 - (i % 2) * 0.12);
    const nx = Math.cos(tm), nz = Math.sin(tm);
    const a = b.vert(p0.x, p0.y, p0.z, nx, 0, nz, c.r, c.g, c.b, 0, 0, 3), d = b.vert(p1.x, p1.y, p1.z, nx, 0, nz, c.r, c.g, c.b, 1, 0, 3), e = b.vert(pm.x, pm.y, pm.z, nx, 0, nz, c.r * 0.8, c.g * 0.8, c.b * 0.8, 0.5, 1, 3);
    b.I.push(a, d, e);
  }
  // burner frame, load ring, twin brass burners with coils, fuel tanks
  const ringY = 9.0, ringR = 1.9;
  for (let i = 0; i < 6; i++) {
    const th = (i + 0.5) / 6 * Math.PI * 2, A = sePoint(4.4, 2.95, SE, th, 5.7), B = V3(Math.cos(th) * ringR, ringY, Math.sin(th) * ringR), pts = [];
    for (let k = 0; k <= 8; k++) { const t = k / 8, p = V3().lerpVectors(A, B, t); const bow = Math.sin(t * Math.PI) * 0.5; p.x += Math.cos(th) * bow; p.z += Math.sin(th) * bow; pts.push(p); }
    b.tube(pts, (t) => 0.1 - 0.03 * t, 5, K.iron, 6);
  }
  b.tube(seRing(ringR, ringR, 2, ringY, 28), 0.13, 7, K.brass, 4, { closed: true });
  b.tube(seRing(1.35, 1.35, 2, 8.25, 20), 0.07, 5, K.iron, 6, { closed: true });
  for (let i = 0; i < 4; i++) { const th = i / 4 * Math.PI * 2 + 0.4; b.tube([V3(Math.cos(th) * 1.35, 8.25, Math.sin(th) * 1.35), V3(Math.cos(th) * ringR, ringY, Math.sin(th) * ringR)], 0.05, 4, K.iron, 6); }
  for (const sx of [-0.62, 0.62]) {
    b.loft([[8.15, 0.02], [8.15, 0.3], [8.3, 0.36], [9.25, 0.36], [9.4, 0.3], [9.62, 0.44], [9.66, 0.4]].map(([y, a]) => ({ y, a })), 12, K.brass, 4, { cx: sx });
    const coil = []; for (let k = 0; k <= 40; k++) { const a = k / 40 * Math.PI * 7; coil.push(V3(sx + Math.cos(a) * 0.45, 8.45 + k / 40 * 0.8, Math.sin(a) * 0.45)); }
    b.tube(coil, 0.045, 4, K.brassDk, 4);
    b.tube([V3(sx, 8.15, 0), V3(sx * 2.0, 7.2, 0.3), V3(sx * 3.2, 5.9, 0.9)], 0.045, 4, K.iron, 6);
  }
  for (const [sx, sz] of [[-3.1, -1.6], [3.1, -1.6], [-3.1, 1.6], [3.1, 1.6]]) {
    b.loft([[4.58, 0.02], [4.58, 0.36], [5.75, 0.36, K.crimson], [5.9, 0.36], [6.1, 0.24], [6.16, 0.02]].map(([y, a, c]) => ({ y, a, col: c })), 10, K.tank, 4, { cx: sx, cz: sz });
  }
  // suspension: load ring up to the mouth hoop, and long stays from the upper rim
  const nc = 16;
  for (let i = 0; i < nc; i++) {
    const th = i / nc * Math.PI * 2;
    b.tube([V3(Math.cos(th) * ringR, ringY, Math.sin(th) * ringR), V3(Math.cos(th) * mouthR, mouthY + 0.05, Math.sin(th) * mouthR)], 0.04, 4, K.rope, 2);
  }
  for (let i = 0; i < 8; i++) { const th = (i + 0.5) / 8 * Math.PI * 2; b.tube([sePoint(4.5, 3.05, SE, th, 5.75), V3(Math.cos(th) * mouthR, mouthY + 0.05, Math.sin(th) * mouthR)], 0.035, 4, K.rope, 2); }
  b.tube(seRing(mouthR * 1.005, mouthR * 1.005, 2, mouthY, 40), 0.11, 6, K.leather, 6, { closed: true });
  // outriggers with hanging lanterns and stays
  const tips = [];
  outAngles.forEach((th, i) => {
    const root = sePoint(5.3, 3.5, SE, th, 2.75), dir = V3(Math.cos(th), 0, Math.sin(th));
    const tip = root.clone().addScaledVector(dir, 3.3); tip.y = 3.55; tips.push(tip);
    b.tube([root.clone().addScaledVector(dir, -0.6), root, V3().lerpVectors(root, tip, 0.5).setY(3.05), tip], (t) => 0.13 - 0.06 * t, 6, K.wood, 0, { cap: true });
    b.tube([tip, sePoint(4.5, 3.05, SE, th, 5.72)], 0.03, 4, K.rope, 2);
    const lp = tip.clone().addScaledVector(dir, -0.5); lp.y -= 0.75;
    b.tube([tip.clone().addScaledVector(dir, -0.5).setY(3.4), lp.clone().setY(lp.y + 0.2)], 0.02, 4, K.iron, 6);
    b.setM(M4().setPosition(lp)); b.blob(0.2, 0.42, 7, K.lamp, 5); b.loft([{ y: 0.17, a: 0.2 }, { y: 0.3, a: 0.03 }], 7, K.brassDk, 4); b.setM(null);
  });
  // lanterns on the upper rim
  for (let i = 0; i < 6; i++) {
    const p = sePoint(4.55, 3.1, SE, (i + 0.5) / 6 * Math.PI * 2 + 0.26, 6.25);
    b.tube([p.clone().setY(5.7), p], 0.035, 4, K.iron, 6);
    b.setM(M4().setPosition(p.x, p.y + 0.18, p.z)); b.blob(0.17, 0.36, 7, K.lamp, 5); b.setM(null);
  }
  // flag staffs fore and aft with long pennants
  for (const sx of [-1, 1]) {
    const foot = V3(sx * 4.45, 5.6, 0), top = V3(sx * 6.3, 9.6, 0);
    b.tube([foot, top], (t) => 0.09 - 0.045 * t, 5, K.wood, 0, { cap: true });
    b.setM(M4().setPosition(top)); b.blob(0.13, 0.26, 6, K.brass, 4); b.setM(null);
    addStreamer(streamers, rng, top.clone().setY(top.y - 0.5), wind, rng.range(9, 12), 1.25, sx < 0 ? K.crimson : K.gold, bob);
  }
  // rope ladders: one over the side trailing below the keel, one from the load ring up into the mouth
  const side = rng.sign();
  ladder(b, V3(1.6 * side, 3.1, 3.62), V3(1.9 * side, -7.5, 4.3), 0, K);
  ladder(b, V3(-0.4, ringY, ringR), V3(-0.6, mouthY, mouthR * 0.98), -0.35, K);
  ladder(b, V3(-2.2 * side, 1.0, 2.2), V3(-2.4 * side, 4.5, 2.0), 0, K);
  // grapnel anchor on its cable
  const ax = -3.6 * side, ay = -8.5 - rng.range(0, 2.5);
  b.tube(sagLine(V3(ax, 0.6, -1.2), V3(ax - 0.6, ay + 1.3, -1.6), -0.25, 10), 0.045, 4, K.rope, 2);
  b.tube([V3(ax - 0.6, ay + 1.4, -1.6), V3(ax - 0.6, ay, -1.6)], 0.07, 5, K.iron, 6, { cap: true });
  for (let i = 0; i < 4; i++) {
    const th = i / 4 * Math.PI * 2 + 0.5, pts = [];
    for (let k = 0; k <= 5; k++) { const a = k / 5 * 2.0; pts.push(V3(ax - 0.6 + Math.cos(th) * Math.sin(a) * 0.55, ay + 0.05 + (1 - Math.cos(a)) * 0.42 - 0.1, -1.6 + Math.sin(th) * Math.sin(a) * 0.55)); }
    b.tube(pts, (t) => 0.06 - 0.03 * t, 4, K.iron, 6);
  }
  // crew
  const spots = [[3.6, 0.97, 2.2], [-3.9, 0.97, 1.9], [0.6, 0.97, 2.6], [-1.5, 0.97, -2.5], [2.9, 4.56, 2.0], [-2.6, 4.56, 2.1], [0.2, 4.56, -2.2], [-0.2, 4.56, 0.6]];
  rng.shuffle(spots).slice(0, 6).forEach(([x, y, z]) => crew(b, rng, K, x + rng.range(-0.3, 0.3), y, z, rng() * 6.283));
  return tips;
}

// ---------------------------------------------------------------- consort gondola (instanced). Origin = basket bottom,
// load ring at y 3, fire at y 3.3, envelope mouth at y 5 (radius 1.53).
function buildSmallGondola(b, rng, K) {
  const SE = 2.8;
  b.loft([[0, 0.02, 0.02], [0, 0.82, 0.72], [0.12, 0.92, 0.82], [0.7, 0.98, 0.88], [1.3, 1.06, 0.95]].map(([y, a, bb]) => ({ y, a, b: bb, n: SE })), 16, K.wicker, 1, { jit: 0 });
  b.tube(seRing(1.07, 0.96, SE, 1.31, 18), 0.07, 5, K.leather, 6, { closed: true });
  b.tube(seRing(0.94, 0.84, SE, 0.1, 18), 0.05, 4, K.woodDk, 0, { closed: true });
  for (let i = 0; i < 4; i++) {
    const th = (i + 0.5) / 4 * Math.PI * 2, A = sePoint(1.02, 0.92, SE, th, 1.3), B = V3(Math.cos(th) * 0.7, 3.0, Math.sin(th) * 0.7);
    b.tube([A, V3().lerpVectors(A, B, 0.5).multiply(V3(1.12, 1, 1.12)), B], 0.045, 4, K.iron, 6);
  }
  b.tube(seRing(0.7, 0.7, 2, 3.0, 12), 0.05, 5, K.brass, 4, { closed: true });
  b.loft([[2.6, 0.02], [2.6, 0.2], [3.1, 0.2], [3.22, 0.27]].map(([y, a]) => ({ y, a })), 8, K.brass, 4);
  for (let i = 0; i < 8; i++) { const th = i / 8 * Math.PI * 2; b.tube([V3(Math.cos(th) * 0.7, 3.0, Math.sin(th) * 0.7), V3(Math.cos(th) * 1.53, 5.02, Math.sin(th) * 1.53)], 0.022, 3, K.rope, 2); }
  b.tube(seRing(1.535, 1.535, 2, 5.0, 20), 0.045, 4, K.leather, 6, { closed: true });
  for (let i = 0; i < 5; i++) {
    const th = i / 5 * Math.PI * 2 + 0.3, p = sePoint(1.2, 1.08, SE, th, 0.75);
    b.setM(new THREE.Matrix4().setPosition(p)); b.blob(0.14, 0.36, 6, K.sack, 3, 0.9); b.setM(null);
  }
  crew(b, rng, K, 0.3, 0.1, 0.25, 1.0); crew(b, rng, K, -0.35, 0.1, -0.2, 3.6);
}

// ---------------------------------------------------------------- palette
function makeColours(rng, palette) {
  const pal = palette.map((h) => new THREE.Color(h));
  const [blue, lav, peach, pgold, cream, dusk, crim] = pal;
  const hsl = {}; pgold.getHSL(hsl);
  const gold = new THREE.Color().setHSL(lerp(hsl.h, 0.118, 0.7) + rng.range(-0.008, 0.008), 0.92, 0.52);
  crim.getHSL(hsl);
  const crimson = new THREE.Color().setHSL((hsl.h - 0.014 + rng.range(-0.008, 0.006) + 1) % 1, Math.min(1, hsl.s), hsl.l * 0.8).multiplyScalar(0.8);
  const mul = (c, k) => c.clone().multiplyScalar(k), col = (r, g, b) => new THREE.Color(r, g, b);
  const K = {
    blue: mul(blue, 0.95), lav: mul(lav, 0.9), peach: mul(peach, 0.8), pgold: mul(pgold, 0.8), cream: mul(cream, 0.8), dusk: mul(dusk, 0.9), crimson, gold: mul(gold, 0.86),
    wicker: col(0.46, 0.3, 0.14), wickerLt: col(0.56, 0.39, 0.19), wood: col(0.3, 0.17, 0.085), woodDk: col(0.16, 0.09, 0.05),
    rope: col(0.6, 0.5, 0.34), brass: col(0.72, 0.5, 0.18), brassDk: col(0.42, 0.27, 0.1), iron: col(0.07, 0.07, 0.085), leather: col(0.2, 0.09, 0.05),
    sack: col(0.55, 0.47, 0.36), sackDk: col(0.36, 0.28, 0.22), tank: col(0.45, 0.44, 0.46), lamp: col(1.0, 0.6, 0.24), skin: col(0.55, 0.36, 0.26), hat: col(0.05, 0.045, 0.05),
  };
  K.coats = [mul(blue, 0.5), mul(dusk, 0.6), mul(crimson, 0.7), col(0.08, 0.08, 0.1), mul(cream, 0.6), col(0.2, 0.13, 0.08)];
  K.flagCols = [K.crimson, K.gold, K.cream, K.peach, K.blue, K.lav];
  K.ways = [[K.blue, K.cream, K.peach], [K.lav, K.pgold, K.dusk], [K.peach, K.dusk, K.cream], [K.cream, K.crimson, K.gold], [K.blue, K.peach, K.cream], [K.dusk, K.lav, K.cream], [K.gold, K.blue, K.cream], [K.crimson, K.cream, K.gold]];
  return K;
}

// ================================================================ buildHero
export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng.fork ? ctx.rng.fork('cloud-armada-hero') : ctx.rng;
  const K = makeColours(rng, opts.palette && opts.palette.length >= 7 ? opts.palette : DEFAULT_PALETTE);
  const piece = opts.piece === 'guard' ? 'guard' : 'flagship';
  const group = new THREE.Group(); group.name = 'cloud-armada-' + piece;
  const b = makeBuilder(rng), flags = [], streamers = [], fires = [], smallEnv = [], smallGon = [];
  const wind = V3(rng.sign(), -0.2, rng.range(-0.3, 0.3)).normalize();
  const anchors = {}; let radius, height, center, heroEnv = null;

  // one 22 m-class balloon: `base` is the basket bottom. Returns its parts' shared motion.
  const addBalloon = (base, s, way, pattern, bobAmp) => {
    const bob = [rng() * 6.283, bobAmp], spin = [rng.sign() * rng.range(0.025, 0.07), rng() * 6.283], seed = rng();
    smallEnv.push({ pos: base.clone().setY(base.y + 5 * s), h: 17 * s, colA: way[0], colB: way[1], colC: way[2], pattern, seed, gores: rng.pick([12, 12, 24]), hero: false, bob, spin });
    smallGon.push({ pos: base.clone(), s, bob, spin, seed });
    fires.push({ pos: base.clone().setY(base.y + 3.25 * s), r: 0.3 * s, h: 2.7 * s, glow: 3.6 * s, seed, hero: false, bob });
    return bob;
  };

  if (piece === 'flagship') {
    const bobH = [rng() * 6.283, 0.7], mouthY = 13, H = 45, mouthR = 0.09 * H, gores = rng.pick([20, 24, 24, 28]);
    heroEnv = { pos: V3(0, mouthY, 0), h: H, colA: K.crimson, colB: K.gold, colC: K.cream, pattern: rng.int(0, 2), seed: rng(), gores, hero: true, bob: bobH, spin: [0, rng() * 6.283] };
    // consort slots: azimuth (deg, +Z = 90 is the camera side), distance, basket height. The +Z pair ride low so the
    // fly-by line stays open; the pair behind ride high as a backdrop.
    const slots = [[50, 60, 74, -31, -21], [130, 60, 74, -33, -22], [2, 62, 80, 12, 28], [182, 60, 78, 4, 20], [238, 58, 74, 32, 46], [304, 62, 82, 26, 42]];
    const cons = slots.map(([az, d0, d1, y0, y1]) => {
      const th = (az + rng.range(-9, 9)) * Math.PI / 180, d = rng.range(d0, d1);
      return { th, base: V3(Math.cos(th) * d, rng.range(y0, y1), Math.sin(th) * d), s: rng.range(0.86, 1.1) };
    });
    const tips = buildFlagshipGondola(b, rng, K, flags, streamers, bobH, wind, cons.map((c) => c.th), mouthY, mouthR);
    await ctx.yield?.();
    const ways = rng.shuffle(K.ways.slice()), pats = rng.shuffle([3, 4, 5, 6, 7, 3, 4]);
    anchors.consorts = [];
    cons.forEach((c, i) => {
      const bob = addBalloon(c.base, c.s, ways[i], pats[i], rng.range(0.9, 1.6));
      anchors.consorts.push(c.base.clone().setY(c.base.y + 12 * c.s));
      flagLine(b, flags, rng, tips[i], c.base, rng.range(5, 9), bobH, bob, { rad: 0.075, rope: K.rope, size: 1.55, cols: [ways[i][0], ways[i][1], K.cream, K.crimson, K.gold], skip0: 0.05, skip1: 0.06, lamps: 5.5, lampCol: K.lamp });
      addStreamer(streamers, rng, c.base.clone().setY(c.base.y + 0.2), wind, rng.range(6, 9) * c.s, 0.9, rng.pick([ways[i][0], ways[i][1]]), bob);
      // bunting from the outrigger up to the envelope's equator
      const az = Math.atan2(tips[i].z, tips[i].x);
      flagLine(b, flags, rng, tips[i], V3(Math.cos(az) * 17.9, mouthY + 0.585 * H, Math.sin(az) * 17.9), 4.6, bobH, bobH, { rad: 0.04, rope: K.rope, size: 1.4, cols: [K.gold, K.cream, K.crimson], skip0: 0.04, skip1: 0.03 });
    });
    // crown: ring, mast, finial and the two great pennants
    b.setBob(bobH);
    const top = mouthY + H;
    b.tube(seRing(1.7, 1.7, 2, top - 0.22, 24), 0.12, 6, K.brass, 4, { closed: true });
    b.tube([V3(0, top - 0.3, 0), V3(0, top + 4.0, 0)], (t) => 0.13 - 0.07 * t, 6, K.wood, 0, { cap: true });
    for (let i = 0; i < 4; i++) { const th = i / 4 * Math.PI * 2; b.tube([V3(Math.cos(th) * 1.7, top - 0.2, Math.sin(th) * 1.7), V3(0, top + 2.6, 0)], 0.03, 4, K.rope, 2); }
    b.setM(new THREE.Matrix4().setPosition(0, top + 4.1, 0)); b.blob(0.24, 0.5, 8, K.brass, 4); b.setM(null);
    addStreamer(streamers, rng, V3(0, top + 3.7, 0), wind, rng.range(17, 22), 2.1, K.crimson, bobH);
    addStreamer(streamers, rng, V3(0, top + 2.5, 0), wind, rng.range(11, 14), 1.5, K.gold, bobH);
    for (const sx of [-0.62, 0.62]) fires.push({ pos: V3(sx, 9.6, 0), r: 0.62, h: 6.4, glow: 6.5, seed: rng(), hero: true, bob: bobH });
    radius = 80; height = 62; center = V3(0, 30, 0);
    const zf = 17.5 + 40;
    anchors.flyThrough = [V3(-150, 21, zf + 7), V3(-75, 24, zf + 1.5), V3(0, 27, zf), V3(75, 30, zf + 2.5), V3(150, 34, zf + 9)];
    anchors.burner = V3(0, 9.8, 0); anchors.envelopeCenter = V3(0, 38, 0); anchors.crown = V3(0, top, 0); anchors.gondola = V3(0, 3.5, 0);
    anchors.viewpoints = [
      { position: V3(-95, 22, zf + 4), target: V3(0, 30, 0) },   // approach: whole Flagship and its constellation
      { position: V3(-6, 27, zf), target: V3(0, 28, 0) },         // level with the burner as it fires
      { position: V3(48, 6, 44), target: V3(0, 24, 0) },          // low three-quarter, lantern glow overhead
    ];
  } else {
    const R = 48, cy = 46, C = V3(0, cy, 0), corners = [];
    const ways = rng.shuffle([[K.crimson, K.gold, K.cream], [K.blue, K.cream, K.gold], [K.lav, K.peach, K.cream]]);
    const pat = rng.pick([3, 4, 6, 7]), bobs = [];
    for (let i = 0; i < 6; i++) {
      const a = i * Math.PI / 3, corner = V3(Math.cos(a) * R, cy + Math.sin(a) * R, 0); corners.push(corner);
      const base = corner.clone().setY(corner.y - 3);
      const bob = addBalloon(base, 1, ways[i % 3], i % 3 === 0 ? pat : (pat === 3 ? 4 : 3), 0.45); bobs.push(bob);
      addStreamer(streamers, rng, base.clone().setY(base.y + 0.3), wind, rng.range(8, 11), 1.1, ways[i % 3][0], bob);
      addStreamer(streamers, rng, base.clone().setY(base.y + 1.3), wind, rng.range(5, 7), 0.8, ways[i % 3][1], bob);
      addStreamer(streamers, rng, corner.clone(), V3(wind.x * 0.35, -1, 0).normalize(), rng.range(12, 16), 1.3, i % 2 ? K.gold : K.crimson, bob);
    }
    for (let i = 0; i < 6; i++) {
      const j = (i + 1) % 6;
      flagLine(b, flags, rng, corners[i], corners[j], 4.5, bobs[i], bobs[j], { rad: 0.07, rope: K.rope, size: 2.0, cols: [K.crimson, K.gold, K.cream], skip0: 0.03, skip1: 0.03, lamps: 4, lampR: 0.24, lampCol: K.lamp });
      flagLine(b, flags, rng, corners[i], corners[j], 10.5, bobs[i], bobs[j], { rad: 0.05, rope: K.rope, size: 1.25, cols: [K.blue, K.cream, K.peach, K.lav], skip0: 0.04, skip1: 0.04 });
    }
    radius = 62; height = cy + R * 0.866 + 20; center = C.clone();
    anchors.portalSeat = { position: C.clone(), normal: V3(0, 0, 1) }; anchors.portalRadius = 10; anchors.corners = corners;
    anchors.flyThrough = [V3(0, cy, 320), V3(0, cy, 160), V3(0, cy, 60), V3(0, cy, 0)];
    anchors.viewpoints = [{ position: V3(0, cy, 230), target: C.clone() }, { position: V3(40, cy - 6, 110), target: C.clone() }];
  }
  await ctx.yield?.();

  // ---- assemble
  const mats = [];
  const envMat = envelopeMaterial(); mats.push(envMat);
  if (heroEnv) { const g = heroEnv.gores; group.add(envelopeMesh(envelopeGeometry(g * 6, 24, 22, g, { bulge: 0.03 }), envMat, [heroEnv])); }
  await ctx.yield?.();
  // consort envelopes: 12 or 24 gores share one geometry (24 radial bulges, the 12-gore pattern spans two each)
  group.add(envelopeMesh(envelopeGeometry(72, 14, 13, 12, { bulge: 0.034, fat: 1.1 }), envMat, smallEnv));
  const propMat = propsMaterial(false); mats.push(propMat);
  const props = new THREE.Mesh(b.geometry(true), propMat); props.frustumCulled = false; group.add(props);
  await ctx.yield?.();
  { // instanced gondolas
    const sb = makeBuilder(rng); buildSmallGondola(sb, rng, K);
    const geo = sb.geometry(false), n = smallGon.length, m = new THREE.Matrix4(), gm = propsMaterial(true); mats.push(gm);
    const mesh = new THREE.InstancedMesh(geo, gm, n), par = new Float32Array(n * 4), bob = new Float32Array(n * 4);
    smallGon.forEach((g, i) => { m.makeScale(g.s, g.s, g.s).setPosition(g.pos); mesh.setMatrixAt(i, m); par.set([0, g.seed, 0, 0], i * 4); bob.set([g.bob[0], g.bob[1], g.spin[0], g.spin[1]], i * 4); });
    geo.setAttribute('iPar', new THREE.InstancedBufferAttribute(par, 4)); geo.setAttribute('iBob', new THREE.InstancedBufferAttribute(bob, 4));
    mesh.frustumCulled = false; group.add(mesh);
  }
  const fm = flagMesh(flags, false), sm = flagMesh(streamers, true), fire = fireMesh(fires);
  mats.push(fm.material, sm.material, fire.material); group.add(fm, sm, fire);

  // ---- the flare
  let flame = 0, glow = 0, manual = opts.autoFlare === false;
  const setBurn = (f, g = f) => { manual = true; flame = clamp(f, 0, 1); glow = clamp(g, 0, 1); };
  const curve = (p) => { flame = smoothstep(0.12, 0.2, p) * (1 - smoothstep(0.66, 0.74, p)); glow = smoothstep(0.12, 0.36, p) * (1 - smoothstep(0.72, 1.0, p)) ** 1.4; };
  const setProgress = (p) => { manual = true; curve(clamp(p, 0, 1)); };
  // optional: light the piece from an explicit sun instead of the scene's first DirectionalLight.
  // dir: world-space unit vector pointing TOWARD the sun; color: linear THREE.Color already multiplied by intensity.
  const setSun = (dir, color) => { for (const m of mats) if (m.uniforms.uSunOn) { m.uniforms.uSunOn.value = dir ? 1 : 0; if (dir) { m.uniforms.uSunDir.value.copy(dir).normalize(); m.uniforms.uSunCol.value.copy(color); } } };
  if (opts.sun) setSun(opts.sun.direction, opts.sun.color);

  return {
    object: group, radius, height, center, anchors, piece, ground: false, groundY: 0,
    setProgress, setBurn, setSun,
    update(dt, time) {
      if (!manual) curve((((time - 5) / 14) % 1 + 1) % 1);
      const fl = flame * (0.9 + 0.1 * Math.sin(time * 31) * Math.sin(time * 17.3));
      for (const m of mats) {
        m.uniforms.uTime.value = time;
        if (m.uniforms.uFlame) m.uniforms.uFlame.value = fl;
        if (m.uniforms.uGlow) m.uniforms.uGlow.value = glow;
      }
    },
    dispose() {},
  };
}

// ================================================================ buildFleet
// THE ARMADA: free-floating balloons sharing the hero's shaders, all instanced (6 draw calls for any number).
// opts.balloons  [{ pos: Vector3 (basket bottom), s: scale (1 = the 22 m class), near: true for the detailed gondola,
//                   round envelope and a pennant; bob: amplitude in m (optional), hot: 0..1 share of crimson liveries,
//                   dressed: true for gala bunting up the tapes, a garland at the equator and a crown pennant }]
// opts.palette   as buildHero;  opts.wind  Vector3 the pennants trail along;  opts.sun as buildHero.
// opts.theme     0 gold-and-cream, 1 lavender, 2 blue-and-peach: the colourway about half the balloons fly (none = even mix).
// Burners flare on staggered world-time timers; bob, spin, flutter and flame flicker run in the shaders.
// Returns { object, count, triangles, update(dt, time), setSun(dir, color) }. ~2.9k triangles per near balloon,
// ~1.1k per far one. Move `object` freely (the world lifts a few of them out of the cloud sea).
export function buildFleet(ctx, opts = {}) {
  const rng = ctx.rng.fork ? ctx.rng.fork('cloud-armada-fleet') : ctx.rng;
  const K = makeColours(rng, opts.palette && opts.palette.length >= 7 ? opts.palette : DEFAULT_PALETTE);
  const group = new THREE.Group(); group.name = 'cloud-armada-fleet';
  const wind = (opts.wind || V3(1, -0.2, 0.1)).clone().normalize();
  const L = { near: { env: [], gon: [] }, far: { env: [], gon: [] } }, fires = [], streamers = [], flags = [];
  // liveries: mostly the cool and pale colourways so the crimson-and-gold Flagship stays the accent
  const ways = [K.ways[0], K.ways[1], K.ways[2], K.ways[4], K.ways[5], K.ways[6], [K.cream, K.peach, K.lav], [K.pgold, K.dusk, K.cream], [K.peach, K.cream, K.blue], [K.lav, K.cream, K.gold]];
  const hot = [K.ways[3], K.ways[7], [K.gold, K.crimson, K.cream]];
  // opts.theme (0, 1, 2 or none): the armada's dominant colourway this evening; about half the balloons fly it
  const themes = [[[K.gold, K.cream, K.blue], [K.pgold, K.blue, K.cream], [K.peach, K.cream, K.gold], [K.cream, K.gold, K.peach]],
    [K.ways[1], K.ways[5], [K.lav, K.cream, K.peach], [K.cream, K.lav, K.dusk]],
    [K.ways[0], K.ways[4], [K.blue, K.pgold, K.dusk], [K.dusk, K.peach, K.blue]]];
  const theme = opts.theme == null ? null : themes[((opts.theme % 3) + 3) % 3];
  for (const bl of opts.balloons || []) {
    const s = bl.s ?? 1, base = bl.pos, way = rng.chance(bl.hot ?? 0.12) ? rng.pick(hot) : theme && rng.chance(0.55) ? rng.pick(theme) : rng.pick(ways);
    const bob = [rng() * 6.283, bl.bob ?? rng.range(1.2, 2.6)], spin = [rng.sign() * rng.range(0.03, 0.09), rng() * 6.283], seed = rng();
    const T = bl.near ? L.near : L.far;
    T.env.push({ pos: base.clone().setY(base.y + 5 * s), h: 17 * s, colA: way[0], colB: way[1], colC: way[2], pattern: rng.pick([3, 4, 5, 6, 7, 3, 4, 7]), seed, gores: rng.pick([12, 12, 24]), hero: false, bob, spin });
    T.gon.push({ pos: base.clone(), s, bob, spin, seed });
    fires.push({ pos: base.clone().setY(base.y + 3.25 * s), r: 0.3 * s, h: 2.7 * s, glow: 3.6 * s, seed, hero: false, bob });
    if (bl.near) addStreamer(streamers, rng, base.clone().setY(base.y + 0.2 * s), wind, rng.range(7, 11) * s, 0.95 * s, rng.pick([way[0], way[1]]), bob);
    if (bl.dressed) dressBalloon(flags, streamers, rng, base, s, bob, [K.gold, K.crimson, K.cream, way[1]], wind);
  }
  const mats = [], envMat = envelopeMaterial(); mats.push(envMat);
  let triangles = 0;
  const tri = (g, n) => { triangles += (g.index ? g.index.count : g.attributes.position.count) / 3 * n; };
  if (L.near.env.length) { const g = envelopeGeometry(48, 10, 10, 12, { bulge: 0.034, fat: 1.1 }); tri(g, L.near.env.length); group.add(envelopeMesh(g, envMat, L.near.env)); }
  if (L.far.env.length) { const g = envelopeGeometry(24, 6, 7, 12, { bulge: 0.034, fat: 1.1 }); tri(g, L.far.env.length); group.add(envelopeMesh(g, envMat, L.far.env)); }
  const gonMat = propsMaterial(true); mats.push(gonMat);
  const gondolas = (list, geo) => {
    const n = list.length; if (!n) { geo.dispose(); return; }
    const mesh = new THREE.InstancedMesh(geo, gonMat, n), m = new THREE.Matrix4(), par = new Float32Array(n * 4), bob = new Float32Array(n * 4);
    list.forEach((g, i) => { m.makeScale(g.s, g.s, g.s).setPosition(g.pos); mesh.setMatrixAt(i, m); par.set([0, g.seed, 0, 0], i * 4); bob.set([g.bob[0], g.bob[1], g.spin[0], g.spin[1]], i * 4); });
    geo.setAttribute('iPar', new THREE.InstancedBufferAttribute(par, 4)); geo.setAttribute('iBob', new THREE.InstancedBufferAttribute(bob, 4));
    mesh.frustumCulled = false; tri(geo, n); group.add(mesh);
  };
  { const sb = makeBuilder(rng); buildSmallGondola(sb, rng, K); gondolas(L.near.gon, sb.geometry(false)); }
  { // far gondola: basket, four uprights, load ring and the mouth lines, about 150 triangles
    const fb = makeBuilder(rng), SE = 2.8;
    fb.loft([[0, 0.02, 0.02], [0, 0.84, 0.74], [1.3, 1.06, 0.95]].map(([y, a, bb]) => ({ y, a, b: bb, n: SE })), 8, K.wicker, 1, { jit: 0 });
    fb.tube(seRing(1.07, 0.96, SE, 1.31, 8), 0.09, 3, K.leather, 6, { closed: true });
    for (let i = 0; i < 4; i++) {
      const th = (i + 0.5) / 4 * Math.PI * 2, A = sePoint(1.02, 0.92, SE, th, 1.3), B = V3(Math.cos(th) * 0.7, 3.0, Math.sin(th) * 0.7);
      fb.tube([A, B], 0.07, 3, K.iron, 6); fb.tube([B, V3(Math.cos(th) * 1.53, 5.02, Math.sin(th) * 1.53)], 0.05, 3, K.rope, 2);
    }
    fb.tube(seRing(0.7, 0.7, 2, 3.0, 6), 0.09, 3, K.brass, 4, { closed: true });
    gondolas(L.far.gon, fb.geometry(false));
  }
  if (fires.length) { const fire = fireMesh(fires); mats.push(fire.material); tri(fire.geometry, fires.length); group.add(fire); }
  if (streamers.length) { const sm = flagMesh(streamers, true); mats.push(sm.material); tri(sm.geometry, streamers.length); group.add(sm); }
  if (flags.length) { const fm = flagMesh(flags, false); mats.push(fm.material); tri(fm.geometry, flags.length); group.add(fm); }
  const setSun = (dir, color) => { for (const m of mats) if (m.uniforms.uSunOn) { m.uniforms.uSunOn.value = dir ? 1 : 0; if (dir) { m.uniforms.uSunDir.value.copy(dir).normalize(); m.uniforms.uSunCol.value.copy(color); } } };
  if (opts.sun) setSun(opts.sun.direction, opts.sun.color);
  return {
    object: group, count: fires.length, triangles: Math.round(triangles), setSun,
    update(dt, time) { for (const m of mats) m.uniforms.uTime.value = time; },
    dispose() {},
  };
}
