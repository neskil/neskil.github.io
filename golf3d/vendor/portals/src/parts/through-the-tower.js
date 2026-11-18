// THROUGH THE TOWER: hero set piece for "The Mountain City Line".
// A cream housing slab 160 m long and nineteen storeys tall standing square across a monorail
// beam, with a lit five-storey hole punched through it (the station the train does not stop at),
// ~500 balconies each loaded with laundry, air-conditioner boxes, plants, cages and awnings, a
// cluttered wet roof, and a battered retaining-wall terrace under it.
//
// SIZE   160 (x) by 16 (z) by 64.6 m tall (19 storeys of 3.4 m) plus ~6 m of roof clutter.
//        Origin = centre of the slab's base on the terrace top (brief y 44), +Y up, the south
//        face with the hole's lit mouth faces +Z. The retaining wall is a skirt from y 0 down to
//        y -14 (groundY) so the world can bury it in its own slope. radius ~84, height ~70.
// LOCAL TO WORLD  local +X = brief east, local +Z = brief south. The hole is 20 m wide and 17 m
//        high, x -10..10, y 17..34, running right through the slab (z 8 to -8).
// ANCHORS (local space; `facing` vectors are unit)
//   portalSeat   { position (0, 25.5, 2), facing (0,0,1), radius 7 }: centre of the 14 m exit
//                portal, 6 m inside the mouth, level, at cab eye height. Put the path end here.
//   flyThrough   ordered points for the last straight, y 25.5, x 0, from z 150 to the seat.
//                Clearance: 6.1 m to the right platform lip, 6.8 m left, 8.5 m to the soffit.
//   eye          (0, 25.5, 8) camera point in the plane of the facade; beamTopY 22.9 (eye - 2.6).
//   twinBeamX    -4.4 (the oncoming beam, left of travel).   holeMin / holeMax: the opening.
//   lintel       (0, 34, 8.4): where the drip curtain falls from.   roofY 64.6.
//   shaftRest / shaftStart  where the sun shaft rests (on the hole) and where it comes from.
//   pigeonRoof   a point on the roof above the hole (for the rare pigeon release).
//   viewpoints   { approach, threeQuarter, close }: good camera positions looking at `center`.
// OPTS   palette  array of 7 hex strings (brief order: mist white, concrete, leaf green, jade,
//                 bamboo brown, red, sun cream).
//        beam     true (default) builds 62 m of the twin concrete beams and three T-piers running
//                 into the hole so the piece reads alone; pass false when the world sweeps its own.
//        bulkhead true (default) closes the throat 0.7 m behind the portal seat with a tiled wall
//                 that has a 14.5 m round aperture, so the 14 m portal sits in a wall, not in a tube.
//        shaftBeam true (default) draws the sun shaft in the air as one additive ribbon (the
//                 returned shaftMesh); pass false if the world's own god ray is steered onto the hole.
//        progress 0..1 start value for the sun shaft (default 1 = resting on the hole).
//        laundry  density multiplier (default 1).  laundryHue  0..1 dominant colour of the day.
//        lit      0..1 share of windows drawn as warm amber room lights, 1.35-2.1 (default 0; dusk ~0.3).
// HOOKS  setProgress(p) p 0..1: the sun shaft slides in from the east end (p 0, absent) to rest
//        on the hole (p 1). Map it from path u (brief: from u 0.66, resting by ~0.88).
//        setGust(g) g 0..1 kicks all laundry (train wash).  setSky(hex) colour of wet sheen.
//        setPlantLift(r, g, b) share of each leaf's colour given back as skylight (default 0).
//        setShaftColor(hex, strength).  setGlow(k) strength of the lamp haze in the two mouths.
//        uniforms: the raw shared uniform object.  Laundry, plants and drips move on update()'s time.
// KIT    hero.kit lets the world build the rest of the city from the same vocabulary, in the same
//        few draw calls: kit.tower(R, o) / kit.strip / kit.cell / kit.roofRun and the small
//        props (pot, creeper, person, addCloth, addDrip, dress) emit into shared buffers in a local
//        frame (balcony face +Z); kit.mark() then kit.place(mark, x, y, z, yaw) moves what was
//        emitted since the mark into the world; await kit.flush(name, { lit }) returns a Group of up to
//        seven meshes drawn with kit.mats(), a second material set without the sun-shaft term.
//        kit.Geo is the quad-soup builder; kit.pal the palette; kit.triangles the running total.
// COST   about 108-116k triangles by seed, 11 draw calls (10 without the beam), no lights, no
//        textures, about 170 ms of build on a quiet machine.
// LIGHT  Wants a soft warm key raking the +Z face from the right (+X) at about 30 degrees and a
//        strong cool skylight fill. Standard and Lambert materials: they take the scene's lights
//        and fog. Nothing glows except the hole (soffit strips ~5, lit walls ~1.3) and the drips.
import * as THREE from 'three';

const DEF_PAL = ['#DCE6DC', '#8E9690', '#3F7A4A', '#3FA08C', '#9A6B3F', '#C8382B', '#FFE9B8'];
const L = 160, HD = 8, WZ = 6.6, ST = 3.4, NS = 19, BAY = 5, NB = 32, TOP = NS * ST;
const HOLE = { b0: 14, b1: 17, s0: 5, s1: 9, x0: -10, x1: 10, y0: 17, y1: 34 };
const EYE_Y = 25.5, BEAM_TOP = 22.9, TWIN_X = -4.4, GROUND_Y = -14;
const NOOPT = {};

const C = (hex) => { const c = new THREE.Color(hex); return [c.r, c.g, c.b]; };
const mixc = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const mul = (a, k) => [a[0] * k, a[1] * k, a[2] * k];

// Indexed quad soup with flat normals and vertex colours. `s` = -1 turns everything emitted by
// half a turn about Y, so the north face is built by the same code as the south face.
class Geo {
  constructor(uv = false) { this.p = []; this.n = []; this.c = []; this.u = uv ? [] : null; this.i = []; this.nv = 0; this.s = 1; }
  vert(x, y, z, nx, ny, nz, col, k) {
    this.p.push(x * this.s, y, z * this.s); this.n.push(nx, ny, nz); this.c.push(col[0] * k, col[1] * k, col[2] * k); return this.nv++;
  }
  // a, b = first edge (shade ka, kb), c, d continue counter-clockwise seen from outside
  quad(a, b, c, d, col, ka = 1, kb = 1, kc = 1, kd = 1, uv = null) {
    const s = this.s, ux = (b[0] - a[0]) * s, uy = b[1] - a[1], uz = (b[2] - a[2]) * s;
    const vx = (d[0] - a[0]) * s, vy = d[1] - a[1], vz = (d[2] - a[2]) * s;
    let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
    if (nx * nx + ny * ny + nz * nz < 1e-12) { // d coincides with a (a triangle): use c instead
      const wx = (c[0] - a[0]) * s, wy = c[1] - a[1], wz = (c[2] - a[2]) * s; nx = uy * wz - uz * wy; ny = uz * wx - ux * wz; nz = ux * wy - uy * wx;
    }
    const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
    const i0 = this.vert(a[0], a[1], a[2], nx, ny, nz, col, ka); this.vert(b[0], b[1], b[2], nx, ny, nz, col, kb);
    this.vert(c[0], c[1], c[2], nx, ny, nz, col, kc); this.vert(d[0], d[1], d[2], nx, ny, nz, col, kd);
    if (this.u) { if (uv) this.u.push(uv[0], uv[1], uv[2], uv[1], uv[2], uv[3], uv[0], uv[3]); else this.u.push(0, 0, 0, 0, 0, 0, 0, 0); }
    this.i.push(i0, i0 + 1, i0 + 2, i0, i0 + 2, i0 + 3);
  }
  // axis-facing rectangle helpers (front-frame): facing +Z at depth z, and facing +Y at height y
  wallZ(x0, x1, y0, y1, z, col, kb = 1, kt = 1, uv = null) { this.quad([x0, y0, z], [x1, y0, z], [x1, y1, z], [x0, y1, z], col, kb, kb, kt, kt, uv); }
  floorY(x0, x1, z0, z1, y, col, k = 1) { this.quad([x0, y, z1], [x1, y, z1], [x1, y, z0], [x0, y, z0], col, k, k, k, k); }
  // box centred at (cx,cy,cz). o: ry, rx, rz (radians), mask (1 +x, 2 -x, 4 +y, 8 -y, 16 +z, 32 -z),
  // taper (top scale), aoB (shade of the bottom edge of the sides), top (colour of the top face)
  box(cx, cy, cz, sx, sy, sz, col, o = NOOPT) {
    const hx = sx / 2, hy = sy / 2, hz = sz / 2, mask = o.mask ?? 63, tp = o.taper ?? 1, aoB = o.aoB ?? 1;
    const ry = o.ry || 0, rx = o.rx || 0, rz = o.rz || 0;
    const cyy = Math.cos(ry), syy = Math.sin(ry), cxx = Math.cos(rx), sxx = Math.sin(rx), czz = Math.cos(rz), szz = Math.sin(rz);
    const P = [];
    for (let i = 0; i < 8; i++) {
      const up = (i & 2) !== 0; let x = (i & 1 ? hx : -hx) * (up ? tp : 1), y = up ? hy : -hy, z = (i & 4 ? hz : -hz) * (up ? tp : 1);
      if (rz) { const t = x * czz - y * szz; y = x * szz + y * czz; x = t; }
      if (rx) { const t = y * cxx - z * sxx; z = y * sxx + z * cxx; y = t; }
      if (ry) { const t = x * cyy + z * syy; z = -x * syy + z * cyy; x = t; }
      P.push([cx + x, cy + y, cz + z]);
    }
    if (mask & 16) this.quad(P[4], P[5], P[7], P[6], col, aoB, aoB, 1, 1);
    if (mask & 32) this.quad(P[1], P[0], P[2], P[3], col, aoB, aoB, 1, 1);
    if (mask & 1) this.quad(P[5], P[1], P[3], P[7], col, aoB, aoB, 1, 1);
    if (mask & 2) this.quad(P[0], P[4], P[6], P[2], col, aoB, aoB, 1, 1);
    if (mask & 4) { const t = o.top || col; this.quad(P[6], P[7], P[3], P[2], t, 1.05, 1.05, 1.05, 1.05); }
    if (mask & 8) this.quad(P[0], P[1], P[5], P[4], col, 0.5, 0.5, 0.5, 0.5);
  }
  // n-sided prism along Y (or along X with o.axis 'x'); o.r2 top radius, o.cap top cap colour
  prism(cx, cy, cz, r, h, n, col, o = NOOPT) {
    const r2 = o.r2 ?? r, ax = o.axis === 'x', aoB = o.aoB ?? 0.8;
    const M = (lx, ly, lz) => (ax ? [cx + ly, cy - lx, cz + lz] : [cx + lx, cy + ly, cz + lz]);
    for (let k = 0; k < n; k++) {
      const a0 = (k / n) * Math.PI * 2, a1 = ((k + 1) / n) * Math.PI * 2;
      const c0 = Math.cos(a0), s0 = Math.sin(a0), c1 = Math.cos(a1), s1 = Math.sin(a1);
      const sh = 0.82 + 0.18 * Math.cos(a0 + 0.6);
      this.quad(M(s0 * r, 0, c0 * r), M(s1 * r, 0, c1 * r), M(s1 * r2, h, c1 * r2), M(s0 * r2, h, c0 * r2), col, aoB * sh, aoB * sh, sh, sh);
      if (o.cap !== false && r2 > 0.001) this.quad(M(0, h, 0), M(s0 * r2, h, c0 * r2), M(s1 * r2, h, c1 * r2), M(0, h, 0), o.cap || col, 1, 1, 1, 1);
    }
  }
  *steps() {   // the geometry, an attribute at a time
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(this.p), 3)); yield;
    g.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(this.n), 3)); yield;
    g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(this.c), 3)); yield;
    if (this.u) g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(this.u), 2));
    g.setIndex(this.nv > 65535 ? new THREE.BufferAttribute(new Uint32Array(this.i), 1) : new THREE.BufferAttribute(new Uint16Array(this.i), 1)); yield;
    g.computeBoundingSphere(); g.computeBoundingBox();
    return g;
  }
  toGeometry() { const it = this.steps(); let r; while (!(r = it.next()).done); return r.value; }
  async toGeometryAsync(pause) { const it = this.steps(); let r; while (!(r = it.next()).done) await pause(); return r.value; }   // the same, handing the page back between attributes
  get tris() { return this.i.length / 3; }
  clear() { this.p = []; this.n = []; this.c = []; if (this.u) this.u = []; this.i = []; this.nv = 0; this.s = 1; }
}

// ---------- shared GLSL ----------
const GL_PARS = /* glsl */`
uniform vec4 uShaft; uniform vec3 uShaftCol; uniform vec3 uSky; uniform float uTime;
varying vec3 vOP; varying vec3 vON; varying vec2 vBuv;
float h21(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(h21(i), h21(i + vec2(1., 0.)), f.x), mix(h21(i + vec2(0., 1.)), h21(i + vec2(1., 1.)), f.x), f.y); }
// the sun shaft: a soft slanted ellipse of warm light lying on the south face
float shaftMask(vec3 p){
  vec2 d = p.xy - uShaft.xy; d = vec2(d.x * 0.848 + d.y * 0.53, -d.x * 0.53 + d.y * 0.848) / (vec2(1.7, 1.0) * max(uShaft.z, 1.));
  float m = 1. - smoothstep(0.25, 1., length(d));
  return m * m * smoothstep(2.5, 6.4, p.z) * uShaft.w;
}
`;

// Patches a built-in lit material: object-space varyings, the shared uniforms, and optional
// snippets at fixed places (o.vpars, o.vert, o.fpars, o.color, o.rough, o.light, o.out).
function patch(mat, U, key, o = NOOPT) {
  mat.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, U);
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nuniform float uTime; uniform float uGust;\nvarying vec3 vOP; varying vec3 vON; varying vec2 vBuv;\n' + (o.vpars || ''))
      .replace('#include <begin_vertex>', '#include <begin_vertex>\n' + (o.vert || '') + `
        #ifdef USE_INSTANCING
          vOP = (instanceMatrix * vec4(transformed, 1.)).xyz;
        #else
          vOP = transformed;
        #endif
        vON = normal; vBuv = uv;`);
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\n' + GL_PARS + (o.fpars || ''))
      .replace('#include <normal_fragment_begin>', '#include <normal_fragment_begin>\n' + (o.norm || ''))
      .replace('#include <color_fragment>', '#include <color_fragment>\n' + (o.color || ''))
      .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\n' + (o.rough || ''))
      .replace('#include <lights_fragment_end>', '#include <lights_fragment_end>\n' + (o.light || ''))
      .replace('#include <opaque_fragment>', (o.out || '') + (o.noShaft ? '' : '\noutgoingLight += diffuseColor.rgb * uShaftCol * shaftMask(vOP) * 2.0;') + '\n#include <opaque_fragment>');
  };
  mat.customProgramCacheKey = () => 'ttt-' + key;
  return mat;
}

const SHELL_COLOR = /* glsl */`
  { vec3 p = vOP; float up = step(0.7, vON.y);
    float w = p.x + p.z * 0.83;
    float streak = vn(vec2(w * 1.9, p.y * 0.16)) * 0.6 + vn(vec2(w * 6.3, p.y * 0.5)) * 0.4;
    float blot = vn(vec2(w * 0.21, p.y * 0.3 + 7.));
    float drip = smoothstep(0.5, 0.82, streak) * (0.35 + 0.65 * blot) * (1. - up);
    diffuseColor.rgb *= 1. - 0.5 * drip;
    diffuseColor.rgb *= mix(vec3(1.), vec3(0.78, 0.93, 0.74), smoothstep(0.5, 0.9, blot * (0.6 + 0.4 * streak)) * 0.4 * (1. - up));
    float low = 1. - smoothstep(-14., 5., p.y);
    diffuseColor.rgb *= mix(vec3(1.), vec3(0.60, 0.74, 0.56), low * (0.15 + 0.35 * blot));
    gPud = up * smoothstep(0.50, 0.60, vn(p.xz * 0.33 + 3.) * 0.7 + vn(p.xz * 1.3) * 0.3);
    diffuseColor.rgb *= mix(1., 0.50, gPud) * mix(1., 0.82, up); }
`;
const SHELL_ROUGH = 'roughnessFactor = mix(mix(roughnessFactor, 0.55, step(0.7, vON.y) * 0.7), 0.06, gPud);';
const SHELL_OUT = 'outgoingLight += gPud * uSky * 0.5 * (0.3 + 0.7 * pow(1. - saturate(dot(normalize(vViewPosition), normal)), 3.));';
const GLASS_OUT = 'outgoingLight += uSky * (0.05 + 0.55 * pow(1. - saturate(dot(normalize(vViewPosition), normal)), 3.)) * (0.6 + 0.4 * vn(vOP.xy * 0.7));\n#ifdef USE_COLOR\n outgoingLight = mix(outgoingLight, vColor.rgb * (0.52 + 0.4 * vn(vOP.xy * 1.3)), step(1.3, vColor.r));\n#endif';
const BARS_PARS = /* glsl */`
float barCov(float x, float s, float w){
  float fw = max(fwidth(x), 1e-4); float d = abs(fract(x / s - 0.5) - 0.5) * s;
  float c = clamp((w * 0.5 - d) / fw + 0.5, 0., 1.);
  return mix(c, w / s, smoothstep(0.25, 0.7, fw / s));
}
`;
const BARS_COLOR = '{ float a = max(barCov(vBuv.x, 0.14, 0.03), barCov(vBuv.y, 0.60, 0.04)); diffuseColor.a *= clamp(a * 1.15, 0., 1.); }';

const CLOTH_VPARS = 'attribute vec4 aCl; varying vec4 vCl; varying vec2 vCuv; varying float vFold;';
const CLOTH_VERT = /* glsl */`
  vCl = aCl; vCuv = vec2(position.x + 0.5, -position.y);
  { float hh = -position.y; float ph = aCl.x;
    float wv = sin(uTime * 1.9 + ph + position.x * 2.4) * 0.6 + sin(uTime * 3.1 + ph * 1.7 + hh * 3.) * 0.4;
    float gust = uGust * (0.6 + 0.4 * sin(uTime * 7. + ph));
    float bend = hh * hh * aCl.z * (0.24 * wv + 0.10 + 0.9 * gust);
    transformed.z += bend; transformed.x += bend * 0.25 * sin(ph * 3.);
    transformed.y += abs(bend) * 0.3 * hh / max(length(instanceMatrix[1].xyz), 0.05);
    vFold = wv * hh; }
`;
const CLOTH_FPARS = 'varying vec4 vCl; varying vec2 vCuv; varying float vFold;';
const CLOTH_COLOR = /* glsl */`
  { vec2 q = vCuv; float x = abs(q.x - 0.5); float t = vCl.y; float a = 1.;
    if (t > 0.5 && t < 1.5) {           // shirt on a hanger
      float sh = step((x - 0.1) * 0.45, q.y);
      float body = step(x, 0.31) * sh;
      float sleeve = step(x, 0.5) * sh * step(q.y, 0.40 - (x - 0.3) * 0.25);
      float neck = step(0.105, length(vec2(x, q.y * 1.15)));
      a = max(body, sleeve) * neck;
    } else if (t > 1.5) {               // trousers by the waistband
      a = step(x, 0.5 - q.y * 0.07);
      a *= mix(1., step(0.035 + (q.y - 0.22) * 0.08, x), step(0.22, q.y));
    }
    if (a < 0.5) discard;
    float pt = vCl.w;
    if (pt > 0.88) diffuseColor.rgb *= mix(1., 0.62, step(0.5, fract(q.y * 7. + pt * 9.)));
    else if (pt > 0.80) diffuseColor.rgb *= mix(1., 0.7, step(0.5, fract(q.x * 5. + pt * 3.)) * step(0.5, fract(q.y * 5.)));
    else if (pt > 0.72) diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.55, 0.54, 0.5), step(abs(q.y - 0.3), 0.07) * 0.7);
    diffuseColor.rgb *= 0.88 + 0.12 * sin(q.x * 15. + vCl.x) * q.y + vFold * 0.08; }
`;
const BACKLIT = /* glsl */`
  #if NUM_DIR_LIGHTS > 0
    reflectedLight.directDiffuse += directionalLights[0].color * BRDF_Lambert(diffuseColor.rgb) * (K_BACK * saturate(dot(-normal, directionalLights[0].direction)) + K_AMB);
  #endif
`;
const PLANT_VPARS = 'attribute vec3 aPl; varying vec3 vPl;';
const PLANT_VERT = /* glsl */`
  vPl = aPl;
  { float k = aPl.z > 0. ? uv.y : 1. - min(uv.y, 1.); float am = abs(aPl.z) * k * k * (1. + 2. * uGust);
    transformed.x += sin(uTime * 1.6 + aPl.x * 40. + position.y) * am;
    transformed.z += sin(uTime * 1.1 + aPl.x * 23.) * am * 0.6; }
`;
const PLANT_FPARS = 'varying vec3 vPl; uniform vec3 uPot; uniform vec3 uLift;';
const PLANT_COLOR = /* glsl */`
  { vec2 q = vBuv; float sd = vPl.x; float a;
    if (vPl.y < 0.5) {                  // potted plant: a pot and a ragged crown
      float pot = step(q.y, 0.24) * step(abs(q.x - 0.5), 0.12 + q.y * 0.2);
      float n = vn(q * 7. + sd * 31.) * 0.6 + vn(q * 17. + sd * 11.) * 0.4;
      float leaf = step(length((q - vec2(0.5, 0.62)) * vec2(1., 1.25)) + (n - 0.5) * 0.5, 0.42);
      a = max(pot, leaf);
      if (leaf < 0.5) diffuseColor.rgb = uPot * (0.6 + 0.6 * fract(sd * 7.3));
      else { diffuseColor.rgb *= 0.55 + 0.9 * n;
        float fl = step(0.72, fract(sd * 5.7)) * step(0.82, vn(q * 23. + sd * 5.));
        diffuseColor.rgb = mix(diffuseColor.rgb, mix(vec3(0.72, 0.08, 0.06), vec3(0.78, 0.55, 0.08), step(0.5, fract(sd * 13.))), fl); }
    } else {                            // hanging creeper: a ragged mat at the top that breaks into clumps and strands, with holes that grow downward
      vec2 w = vec2(vOP.x + vOP.z * 0.8, vOP.y);
      float strands = vn(vec2(w.x * 1.1 + sd * 9., w.y * 0.1)) * 0.7 + vn(vec2(w.x * 3.3, w.y * 0.3 + sd)) * 0.3; float n2 = vn(w * 3.6 + sd * 3.);
      a = step((1. - q.y) * 1.2 - 0.1, strands * 0.95 + n2 * 0.4);
      float gap = vn(w * vec2(.55, .22) + sd * 7.) * .72 + vn(w * vec2(1.9, .8) + sd * 3.) * .28;
      a *= step(.22 + .3 * (1. - q.y), gap);
      float clump = vn(w * .8 + sd * 2.), leafN = 0.6 + 0.7 * vn(w * 6.3);
      diffuseColor.rgb *= leafN * mix(.5, 1.25, clump) * (.7 + .4 * q.y);
      diffuseColor.rgb = mix(diffuseColor.rgb, vec3(.2, .25, .055) * leafN, .28 * smoothstep(.55, .8, clump));
    }
    if (a < 0.5) discard;
    totalEmissiveRadiance += diffuseColor.rgb * uLift; }
`;

export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng.fork ? ctx.rng.fork('through-the-tower') : ctx.rng;
  const pause = async () => { if (ctx.yield) await ctx.yield(); };
  const detail = ctx.quality?.detail ?? 1;
  const pal = (opts.palette && opts.palette.length >= 7 ? opts.palette : DEF_PAL).map(C);
  const [MIST, CONC0, LEAF, JADE, BAMBOO, RED, SUN] = pal, CONC = mul(CONC0, 1.5);
  const WHITE = [0.72, 0.72, 0.70], DARK = [0.035, 0.04, 0.045];
  const jit = (c, a, r = rng) => { const k = 1 + r.range(-a, a); return [c[0] * k * (1 + r.range(-a, a) * 0.3), c[1] * k, c[2] * k * (1 + r.range(-a, a) * 0.3)]; };

  // ---- per-seed character ----
  const CREAM = mul(mixc(SUN, CONC, 0.30), 0.86 + rng.range(-0.04, 0.04));
  const tints = [CREAM, mul(mixc(mixc(MIST, LEAF, 0.3), CREAM, 0.3), 0.8), mul(mixc(mixc(CONC, RED, 0.26), SUN, 0.42), 0.84)];
  const cores = [rng.int(2, 4), rng.int(8, 11), rng.int(20, 23), rng.int(27, 29)];
  const sideTints = rng.shuffle([1, 2]);
  const bayTint = [];
  for (let b = 0; b < NB; b++) {
    let t = b < cores[1] ? sideTints[0] : b > cores[2] ? sideTints[1] : 0;
    if (rng.chance(0.07) && (b < 12 || b > 19)) t = rng.int(0, 2);
    bayTint.push(t);
  }
  const mix4 = [rng.range(0.28, 0.4), rng.range(0.1, 0.18), rng.range(0.2, 0.3), rng.range(0.16, 0.24)]; // solid, rail, cage, enclosed
  const lDensity = (opts.laundry ?? 1) * rng.range(0.9, 1.1);
  const domHue = opts.laundryHue ?? rng();

  // forty laundry colours: whites, the brief's red and jade, and a seeded dominant hue of the day
  const cloths = [], tc = new THREE.Color(), FADE = [0.55, 0.55, 0.5];
  for (let i = 0; i < 40; i++) {
    const r = rng();
    if (r < 0.28) cloths.push(jit([0.64, 0.64, 0.61], 0.1));                               // whites and creams
    else if (r < 0.405) cloths.push(jit(mixc(mul(RED, 0.95), FADE, 0.1), 0.12));             // the one accent: about one cloth in eight
    else if (r < 0.45) cloths.push(jit(mixc(JADE, FADE, 0.4), 0.15));
    else if (r < 0.57) { tc.setHSL(rng.range(0.56, 0.64), rng.range(0.2, 0.45), rng.range(0.3, 0.55), THREE.SRGBColorSpace); cloths.push(mixc([tc.r, tc.g, tc.b], FADE, 0.3)); } // denim, navy, grey-blue
    else {
      let h = r < 0.95 ? (domHue + rng.range(-0.035, 0.035) + 1) % 1 : rng();
      if (h > 0.72 && h < 0.92) h = (h + 0.22) % 1;                                          // no purples
      if (h > 0.2 && h < 0.43) h = (h < 0.31 ? 0.125 : 0.5) + (h - 0.3) * 0.2;                                   // nor the green of the plants: straw or teal instead
      tc.setHSL(h, rng.range(0.3, 0.55), rng.range(0.45, 0.66), THREE.SRGBColorSpace); cloths.push(mixc([tc.r, tc.g, tc.b], FADE, 0.34));   // sun-faded
    }
  }

  // ---- shared uniforms ----
  const U = {
    uShaft: { value: new THREE.Vector4(0, 27, 18, 1) }, uShaftCol: { value: new THREE.Color().setRGB(SUN[0] * 1.35, SUN[1] * 1.25, SUN[2] * 1.1) },
    uSky: { value: new THREE.Color().setRGB(MIST[0], MIST[1], MIST[2]) }, uTime: { value: 0 }, uGust: { value: 0 },
    uPot: { value: new THREE.Color().setRGB(BAMBOO[0] * 1.1, BAMBOO[1] * 0.8, BAMBOO[2] * 0.7) }, uLift: { value: new THREE.Color(0, 0, 0) },
  };

  // ---- geometry buckets ----
  const G = new Geo();          // shell: walls, slabs, fins, parapets, roof, terrace (stained in the shader)
  const GL = new Geo();         // glass: windows, doors, glazed-in balconies
  const GB = new Geo(true);     // bars: cages, railings, mesh (alpha pattern from uv in metres)
  const K = new Geo();          // clutter: air conditioners, poles, awnings, tanks, people...
  const HI = new Geo();         // the lit inside of the hole (baked light, HDR vertex colours)
  let flip = 1;
  const setFlip = (s) => { flip = s; G.s = GL.s = GB.s = K.s = s; };
  const barsZ = (x0, x1, y0, y1, z, col, sc = 1) => GB.wallZ(x0, x1, y0, y1, z, col, 1, 1, [x0 * sc, y0 * sc, x1 * sc, y1 * sc]);

  // laundry instances
  const clM = [], clC = [], clA = [];
  function addCloth(x, y, z, yaw, w, h, type, amp, col, R) {
    const a = yaw + (flip < 0 ? Math.PI : 0), c = Math.cos(a), s = Math.sin(a);
    clM.push(c * w, 0, -s * w, 0, 0, h, 0, 0, s, 0, c, 0, x * flip, y, z * flip, 1);
    clC.push(col[0], col[1], col[2]); clA.push(R() * 6.283, type, amp, R());
  }
  const pickCloth = (R, vivid) => { let c = cloths[(R() * 40) | 0]; if (vivid && c[0] > 0.6 && c[1] > 0.6 && R() < 0.6) c = cloths[(R() * 40) | 0]; return c; };
  function garment(R, x, y, z, yaw, vivid) {
    const r = R(), col = pickCloth(R, vivid);
    if (r < 0.55) addCloth(x, y, z, yaw, R.range(0.62, 0.82), R.range(0.62, 0.84), 1, R.range(0.5, 1.0), col, R);
    else if (r < 0.75) addCloth(x, y, z, yaw, R.range(0.36, 0.46), R.range(0.92, 1.12), 2, R.range(0.4, 0.8), col, R);
    else addCloth(x, y, z, yaw, R.range(0.45, 0.75), R.range(0.7, 1.05), 0, R.range(0.5, 1.0), col, R);
  }
  const bamboo = () => jit(mul(BAMBOO, 0.9), 0.25);
  function poleOut(R, x, y, len, vivid) {     // a bamboo pole reaching out from the balcony, hung with hangers
    const tilt = R.range(0.02, 0.14), st = Math.sin(tilt);
    K.box(x, y + st * len / 2, HD - 0.1 + len / 2, 0.06, 0.06, len, bamboo(), { rx: -tilt, mask: 1 | 2 | 4 | 16 });
    const n = 2 + ((R() * 3) | 0);
    for (let j = 0; j < n; j++) {
      const t = (j + 0.7 + R() * 0.3) / (n + 0.2);
      garment(R, x + R.range(-0.06, 0.06), y + st * t * len - 0.04, HD - 0.1 + t * len, R.range(-0.4, 0.4), vivid);
    }
  }
  function rack(R, xa, xb, y, vivid) {        // two arms and two rods parallel to the face: sheets, towels, shirts
    const col = R.chance(0.5) ? bamboo() : [0.3, 0.32, 0.33], w = xb - xa;
    K.box(xa + 0.3, y, HD + 0.5, 0.05, 0.05, 1.2, col, { mask: 1 | 2 | 4 | 16 }); K.box(xb - 0.3, y, HD + 0.5, 0.05, 0.05, 1.2, col, { mask: 1 | 2 | 4 | 16 });
    for (let j = 0; j < 2; j++) {
      const z = HD + 0.45 + j * 0.6;
      K.box((xa + xb) / 2, y + 0.04, z, w - 0.3, 0.05, 0.05, col, { mask: 4 | 8 | 16 | 32 });
      let x = xa + 0.4 + R() * 0.5;
      while (x < xb - 0.7) {
        if (R.chance(0.45)) { const cw = Math.min(R.range(1.0, 1.9), xb - 0.3 - x); addCloth(x + cw / 2, y + 0.02, z, R.range(-0.08, 0.08), cw, R.range(0.9, 1.5), 0, R.range(0.35, 0.7), pickCloth(R, vivid), R); x += cw + 0.15; }
        else { garment(R, x + 0.35, y + 0.0, z, R.range(-0.2, 0.2), vivid); x += 0.8; }
        if (R.chance(0.25)) x += R.range(0.3, 1.0);
      }
    }
  }

  // plants: crossed alpha-shaped quads (type 0 potted, 1 hanging creeper), swaying in the vertex shader
  const pP = [], pU = [], pA = [], pC = [], pN = [], pI = []; let pnv = 0;
  function plantQuad(x0, z0, x1, z1, y0, y1, u0, u1, seed, type, sway, col, zo = 0) {
    const s = flip;
    pP.push(x0 * s, y0, (z0 + zo) * s, x1 * s, y0, (z1 + zo) * s, x1 * s, y1, z1 * s, x0 * s, y1, z0 * s);
    pU.push(u0, 0, u1, 0, u1, 1, u0, 1);
    for (let i = 0; i < 4; i++) { pA.push(seed, type, sway); pC.push(col[0], col[1], col[2]); pN.push(0, 0.42, 0.9 * s); }
    pI.push(pnv, pnv + 1, pnv + 2, pnv, pnv + 2, pnv + 3); pnv += 4;
  }
  const leafCol = (R) => { const t = R(); return mul(mixc(LEAF, [LEAF[0] * 1.7, LEAF[1] * 1.4, LEAF[2] * 0.55], t * 0.55), R.range(0.6, 1.0)); };
  function pot(R, x, y, z, w, h) {
    const sd = R(), col = leafCol(R), a = R() * 3.14, dx = Math.cos(a) * w / 2, dz = Math.sin(a) * w / 2;
    plantQuad(x - dx, z - dz, x + dx, z + dz, y, y + h, 0, 1, sd, 0, 0.05 * h, col);
    plantQuad(x + dz, z - dx, x - dz, z + dx, y, y + h, 0, 1, sd, 0, 0.05 * h, col);
  }
  function creeper(R, x0, x1, yTop, len, z, uScale = 0.25, zo = 0) {
    plantQuad(x0, z, x1, z, yTop - len, yTop, x0 * uScale, x1 * uScale, R(), 1, -0.03 * len - 0.05, mul(leafCol(R), 0.68), zo);
  }

  // falling water: screen-widened vertical ribbons with beads that accelerate downward
  const dP = [], dA = [], dI = []; let dnv = 0;
  function addDrip(x, yTop, z, len, w, speed) {
    const ph = rng() * 10, s = flip;
    dP.push(x * s, yTop, z * s, x * s, yTop, z * s, x * s, yTop - len, z * s, x * s, yTop - len, z * s);
    dA.push(-1, 0, ph, w, 1, 0, ph, w, 1, len, ph, w, -1, len, ph, w);
    dI.push(dnv, dnv + 2, dnv + 1, dnv, dnv + 3, dnv + 2); dnv += 4; void speed;
  }

  // ---- one balcony's worth of life (front frame: x across, face at z = HD, wall at z = WZ) ----
  const awnCols = [mixc(JADE, [0.2, 0.35, 0.6], 0.7), mixc(LEAF, JADE, 0.5), mul(JADE, 0.9), [0.5, 0.42, 0.3], mul(RED, 0.8)];
  function dress(R, xa, xb, y0, type, front, near, k) {
    const xc = (xa + xb) / 2, yc = y0 + ST - 0.3, vivid = near;
    const pL = (front ? (near ? 1 : 0.8) : 0.34 * detail) * lDensity;
    if (R() < pL) {
      const mode = R();
      if (mode < 0.5) {            // poles straight out, from the parapet top or from under the slab above
        const n = 1 + ((R() * (near ? 3.6 : 2.7)) | 0), hi = R.chance(0.45) && type !== 3;
        for (let j = 0; j < n; j++) poleOut(R, xa + 0.5 + (j + R.range(0.2, 0.8)) * (BAY - 1) / n, hi ? yc - R.range(0.1, 0.5) : y0 + R.range(1.2, 1.45), R.range(1.5, 2.4), vivid);
      } else if (mode < 0.85) rack(R, xa + R.range(0.1, 0.6), xb - R.range(0.1, 0.6), R.chance(0.5) ? yc - 0.25 : y0 + 1.3, vivid);
      else { poleOut(R, xa + R.range(0.6, 1.6), y0 + 1.3, R.range(1.5, 2.2), vivid); rack(R, xc - 0.2, xb - 0.3, yc - 0.3, vivid); }
    }
    if (type !== 2 && R() < (front ? 0.3 : 0.2)) {   // a quilt or two aired over the parapet
      const w = R.range(1.1, 2.0); addCloth(xa + 0.4 + w / 2 + R() * (BAY - 0.8 - w), y0 + 1.27, HD + 0.04, R.range(-0.03, 0.03), w, R.range(0.7, 1.0), 0, 0.18, pickCloth(R, true), R);
    }
    if (R() < (front ? (near ? 0.8 : 0.62) : 0.4)) {  // air conditioner on a bracket, fan grille, drain pipe
      const hiAC = R.chance(0.3), x = R.chance(0.5) ? xa + R.range(0.6, 0.9) : xb - R.range(0.6, 0.9), y = hiAC ? y0 + R.range(2.2, 2.6) : y0 + R.range(0.42, 0.62);
      const col = jit(mixc(WHITE, CONC, R() * 0.5), 0.08, R);
      K.box(x, y, HD + 0.2, 0.84, 0.56, 0.36, col, { mask: 1 | 2 | 4 | 8 | 16, aoB: 0.8 });
      K.wallZ(x - 0.34, x + 0.12, y - 0.2, y + 0.2, HD + 0.385, [0.07, 0.075, 0.08]);
      K.box(x, y - 0.31, HD + 0.2, 0.92, 0.05, 0.42, [0.2, 0.19, 0.18], { mask: 8 | 16 });
      const pl = R.range(1.0, 2.6); K.box(x + 0.46, y - 0.2 - pl / 2, HD + 0.06, 0.045, pl, 0.045, [0.5, 0.5, 0.48], { mask: 1 | 2 | 16 });
      if (R.chance(front ? 0.3 : 0.12)) addDrip(x + 0.46, y - 0.2 - pl, HD + 0.08, R.range(5, 11), 0.02, 1);
    }
    const nP = type === 3 ? (R.chance(0.3) ? 1 : 0) : (R() < (front ? 0.72 : 0.4) ? 1 + ((R() * 4) | 0) : 0);
    if (nP > 0 && R.chance(0.4)) K.box(xc, y0 + 1.2, HD + 0.2, BAY - 0.8, 0.04, 0.4, [0.22, 0.2, 0.18], { mask: 4 | 8 | 16 });  // plant shelf
    for (let j = 0; j < nP; j++) pot(R, xa + 0.5 + R() * (BAY - 1), y0 + 1.22, HD + (R.chance(0.5) ? 0.2 : -0.06), R.range(0.45, 0.95), R.range(0.5, 1.1));
    if (type !== 3 && R.chance(front ? 0.16 : 0.08)) { const x0 = xa + 0.3 + R() * 2.5; creeper(R, x0, x0 + R.range(0.8, 2.2), y0 + 1.3, R.range(1.0, 2.6), HD + 0.05, 0.6); }
    if (front && R.chance(0.13)) {                    // a songbird cage under the slab edge
      const x = xa + 0.5 + R() * (BAY - 1), y = yc - R.range(0.35, 0.7), cc = bamboo();
      K.prism(x, y, HD + 0.25, 0.17, 0.3, 6, cc, { cap: false }); K.prism(x, y + 0.3, HD + 0.25, 0.17, 0.12, 6, cc, { r2: 0.02 });
      K.box(x, y - 0.02, HD + 0.25, 0.36, 0.03, 0.36, mul(cc, 0.6), { mask: 8 | 16 | 1 | 2 });
    }
    if (type !== 3 && R.chance(0.12)) {               // a mop drying, leaning out over the parapet
      const x = xa + 0.4 + R() * (BAY - 0.8);
      K.box(x, y0 + 1.75, HD + 0.2, 0.035, 1.4, 0.035, bamboo(), { rx: 0.5, mask: 1 | 2 | 16 | 32 });
      K.box(x, y0 + 2.36, HD + 0.56, 0.3, 0.26, 0.16, jit([0.45, 0.44, 0.42], 0.3, R), { rx: 0.5, mask: 1 | 2 | 4 | 16 | 32 });
    }
    if (R() < (k === 0 ? 0.6 : front ? 0.13 : 0.06)) { // faded awning with a valance
      const col = jit(mul(mixc(R.pick(awnCols), [0.42, 0.45, 0.44], R.range(0.25, 0.6)), R.range(0.75, 1.05)), 0.08, R), w = BAY - R.range(0.3, 1.6), d = R.range(1.2, 1.8), y = yc + 0.05;
      K.box(xc, y - 0.26 * d, HD + d * 0.47, w, 0.05, d, col, { rx: 0.5, mask: 4 | 8 });
      K.wallZ(xc - w / 2, xc + w / 2, y - 0.5 * d - 0.2, y - 0.46 * d + 0.02, HD + d * 0.9, mul(col, 0.85), 0.8, 1);
    }
  }

  // ---- a long face of the slab ----
  const inHole = (b, k) => b >= HOLE.b0 && b <= HOLE.b1 && k >= HOLE.s0 && k <= HOLE.s1;
  const glassCols = [[0.02, 0.03, 0.035], [0.03, 0.05, 0.05], [0.05, 0.045, 0.035], [0.02, 0.04, 0.06]];
  const slabCol = mul(CONC, 0.9);
  function cell(R, xa, xb, y0, tint, type) {   // one balcony bay: slab edge, recessed wall with door and window, parapet / rail / cage / glazing
    const xc = (xa + xb) / 2;
    // floor slab edge, recessed wall with a door and a window (shaded darker toward the ceiling)
    G.box(xc, y0, (WZ + HD) / 2 + 0.04, BAY, 0.26, HD - WZ + 0.08, jit(slabCol, 0.06, R), { mask: 4 | 8 | 16 });
    const wall = jit(R.chance(0.12) ? mixc(tint, JADE, 0.3) : tint, 0.05, R);
    if (type !== 3) {
      G.wallZ(xa, xb, y0, y0 + ST, WZ, wall, 0.85, 0.5);
      const dx = xa + R.range(0.5, 1.2), wx = dx + R.range(1.4, 1.9), gc = R.pick(glassCols);
      GL.wallZ(dx, dx + 0.9, y0 + 0.13, y0 + 2.3, WZ + 0.04, R.chance(0.3) ? mul(BAMBOO, 0.25) : gc, 0.7, 0.5);
      GL.wallZ(wx, Math.min(wx + R.range(1.3, 2.0), xb - 0.3), y0 + 1.05, y0 + 2.4, WZ + 0.04, R.chance(0.35) ? mul(R.pick(cloths), 0.3) : gc, 0.8, 0.55);
    }
    const par = jit(R.chance(0.2) ? mixc(WHITE, CONC, R()) : R.chance(0.1) ? mixc(tint, JADE, 0.35) : tint, 0.07, R);
    const parapet = () => G.box(xc, y0 + 0.13 + 0.55, HD - 0.07, BAY - 0.24, 1.1, 0.13, par, { mask: 4 | 16 | 32, aoB: 0.85 });
    const barCol = R.chance(0.5) ? [0.12, 0.13, 0.14] : jit(R.pick([[0.3, 0.16, 0.1], mul(JADE, 0.5), [0.4, 0.4, 0.4]]), 0.2, R);
    if (type === 0) parapet();
    else if (type === 1) { barsZ(xa + 0.12, xb - 0.12, y0 + 0.13, y0 + 1.2, HD - 0.05, barCol); G.box(xc, y0 + 1.22, HD - 0.05, BAY - 0.24, 0.06, 0.08, barCol, { mask: 4 | 8 | 16 }); }
    else if (type === 2) {      // security cage, flat or bellied out with a mesh floor full of things
      if (R.chance(0.6)) parapet();
      const bz = R.chance(0.55) ? HD + R.range(0.35, 0.6) : HD + 0.02, yb = y0 + (bz > HD + 0.1 ? R.range(0.3, 1.2) : 0.13), yt = y0 + ST - 0.14;
      barsZ(xa + 0.12, xb - 0.12, yb, yt, bz, barCol);
      if (bz > HD + 0.1) {
        GB.quad([xb - 0.12, yb, bz], [xb - 0.12, yb, HD], [xb - 0.12, yt, HD], [xb - 0.12, yt, bz], barCol, 1, 1, 1, 1, [0, yb, bz - HD, yt]);
        GB.quad([xa + 0.12, yb, HD], [xa + 0.12, yb, bz], [xa + 0.12, yt, bz], [xa + 0.12, yt, HD], barCol, 1, 1, 1, 1, [0, yb, bz - HD, yt]);
        K.box(xc, yb, (HD + bz) / 2, BAY - 0.24, 0.05, bz - HD, mul(barCol, 0.8), { mask: 8 | 16 });
      }
    } else if (type === 3) {    // glazed in with aluminium windows above the parapet
      parapet();
      const gcol = mixc(R.pick(glassCols), R.chance(0.3) ? mul(R.pick(cloths), 0.35) : [0.05, 0.08, 0.08], R() * 0.6);
      GL.wallZ(xa + 0.12, xb - 0.12, y0 + 1.23, y0 + ST - 0.13, HD - 0.1, gcol, 0.85, 0.6);
      const fr = R.chance(0.6) ? [0.55, 0.56, 0.56] : [0.2, 0.14, 0.1], nm = 3 + ((R() * 2) | 0);
      for (let m = 1; m < nm; m++) G.box(xa + (m * BAY) / nm, y0 + 2.25, HD - 0.07, 0.07, 2.05, 0.06, fr, { mask: 1 | 2 | 16 });
      G.box(xc, y0 + 2.75, HD - 0.07, BAY - 0.24, 0.06, 0.06, fr, { mask: 4 | 8 | 16 });
    }
  }
  async function buildFace(front) {
    setFlip(front ? 1 : -1);
    const R = rng.fork(front ? 'south' : 'north');
    const finBase = CONC;
    for (let b = 0; b <= NB; b++) {
      const xa = -L / 2 + b * BAY, xb = xa + BAY, xc = xa + BAY / 2, wb = front ? b : NB - 1 - b;
      const core = cores.includes(wb), tint = tints[bayTint[Math.min(Math.max(wb, 0), NB - 1)]];
      for (let k = 0; k < NS; k++) {
        const y0 = k * ST, hole = inHole(b, k);
        // party-wall fin on this bay's left edge (skipped only inside the hole)
        if (!(k >= HOLE.s0 && k <= HOLE.s1 && b > HOLE.b0 && b <= HOLE.b1)) G.box(xa, y0 + ST / 2, (WZ + HD) / 2 + 0.03, 0.24, ST, HD - WZ + 0.06, jit(mixc(finBase, tint, 0.55), 0.05, R), { mask: 1 | 2 | 16, aoB: 0.92 });
        if (b === NB || hole) continue;
        const near = front && b >= 10 && b <= 21 && k >= 2 && k <= 13;
        if (core) {                 // stair core: flush wall, a stair window at each half landing, down-pipe
          const cc = jit(mixc(tint, CONC, 0.35), 0.03, R);
          G.wallZ(xa, xb, y0, y0 + ST, HD, cc, 0.95, 1);
          GL.wallZ(xa + 1.5, xb - 1.5, y0 + 1.75, y0 + 3.0, HD + 0.04, R.pick(glassCols));
          G.box(xc, y0 + 1.68, HD + 0.08, 2.3, 0.1, 0.2, mul(cc, 0.8), { mask: 4 | 8 | 16 });
          G.box(xa + 0.7, y0 + ST / 2, HD + 0.09, 0.14, ST, 0.14, mul(CONC, 0.5), { mask: 1 | 2 | 16 });
          if (R.chance(0.25)) dress(R, xa, xb, y0, 3, front, false, k);
          continue;
        }
        const r = R(); let type = !front ? 0 : r < mix4[0] ? 0 : r < mix4[0] + mix4[1] ? 1 : r < mix4[0] + mix4[1] + mix4[2] ? 2 : r < mix4[0] + mix4[1] + mix4[2] + mix4[3] ? 3 : 4;
        cell(R, xa, xb, y0, tint, type);
        dress(R, xa, xb, y0, type, front, near, k);
      }
      await pause();   // one bay of balconies per step
    }
  }
  await buildFace(true);
  await buildFace(false);

  // ---- gable ends: blank stained walls, two columns of small windows, pipes, creeper from the roof ----
  for (const s of [1, -1]) {
    setFlip(s); const R = rng.fork('end' + s), tint = tints[bayTint[s > 0 ? NB - 1 : 0]], X = L / 2;
    for (let k = 0; k < NS; k++) {
      const y0 = k * ST, c = jit(mixc(tint, CONC, 0.2), 0.03, R);
      G.quad([X, y0, WZ], [X, y0, -WZ], [X, y0 + ST, -WZ], [X, y0 + ST, WZ], c, 0.97, 0.97, 1, 1);
      for (const z of [-3.2, 2.6]) {
        const gc = R.chance(0.3) ? mul(R.pick(cloths), 0.3) : R.pick(glassCols);
        GL.quad([X + 0.04, y0 + 1.1, z + 0.7], [X + 0.04, y0 + 1.1, z - 0.7], [X + 0.04, y0 + 2.4, z - 0.7], [X + 0.04, y0 + 2.4, z + 0.7], gc);
        G.box(X + 0.1, y0 + 1.04, z, 0.2, 0.08, 1.7, mul(c, 0.8), { mask: 1 | 4 | 8 | 16 | 32 });
        if (R.chance(0.3)) K.box(X + 0.22, y0 + 0.6, z + R.range(-0.3, 0.3), 0.36, 0.56, 0.84, jit(mixc(WHITE, CONC, 0.4), 0.08, R), { mask: 1 | 4 | 8 | 16 | 32 });
      }
    }
    G.box(X + 0.09, TOP / 2, -0.4, 0.16, TOP, 0.16, mul(CONC, 0.5), { mask: 1 | 16 | 32 });
    const n = 1 + ((R() * 2.5) | 0);
    for (let j = 0; j < n; j++) { const z0 = R.range(-6.4, 2), w = R.range(2.5, 6), len = R.range(8, 30); plantQuad(X + 0.15, z0 + w * 0.6, X + 0.15, z0, TOP + 1.2 - Math.min(len, 16), TOP + 1.2, z0 * 0.3, (z0 + w * 0.6) * 0.3, R(), 1, -0.25, mul(leafCol(R), 0.6)); }
  }
  setFlip(1);
  await pause();

  // ---- roof: wet slab, parapet, stair bulkheads, tanks, solar heaters, sheds, lofts, gardens, washing ----
  const roofCol = mul(CONC, 0.6), RY = TOP + 0.3, Rr = rng.fork('roof');
  G.box(0, TOP + 0.15, 0, L + 0.8, 0.3, 2 * HD + 0.8, roofCol, { top: mul(CONC, 0.5) });
  for (const z of [HD + 0.2, -HD - 0.2]) G.box(0, RY + 0.5, z, L + 0.5, 1.0, 0.22, jit(mixc(CREAM, CONC, 0.4), 0.04), { mask: 4 | 16 | 32 });
  for (const x of [L / 2 + 0.2, -L / 2 - 0.2]) G.box(x, RY + 0.5, 0, 0.22, 1.0, 2 * HD + 0.4, mixc(CREAM, CONC, 0.4), { mask: 1 | 2 | 4 });
  const person = (R, x, y, z, parasol) => {
    K.box(x, y + 0.42, z, 0.3, 0.84, 0.22, [0.06, 0.07, 0.09], { mask: 1 | 2 | 16 | 32 });
    K.box(x, y + 1.14, z, 0.42, 0.62, 0.26, mul(R.pick(cloths), 0.9), { mask: 1 | 2 | 4 | 16 | 32, taper: 0.8 });
    K.box(x, y + 1.58, z, 0.2, 0.24, 0.2, [0.3, 0.2, 0.14], { mask: 1 | 2 | 4 | 16 | 32 });
    if (parasol) { const px = x + R.range(-0.15, 0.15), pc = R.chance(0.3) ? jit(WHITE, 0.05, R) : R.pick(cloths);
      K.prism(px, y + 1.95, z, R.range(0.55, 0.72), 0.22, 8, pc, { r2: 0.03, aoB: 1 }); K.box(px, y + 1.6, z, 0.03, 0.9, 0.03, DARK, { mask: 1 | 16 }); }
  };
  for (const cb of cores) {       // stair bulkheads rising out of the cores, a tank on each
    const x = -L / 2 + cb * BAY + BAY / 2, h = Rr.range(3.0, 6.2), c = jit(mixc(tints[bayTint[cb]], CONC, 0.35), 0.04, Rr);
    G.box(x, RY + h / 2, 0, BAY + 0.6, h, 2 * HD - 1.2, c, { mask: 1 | 2 | 16 | 32, aoB: 0.85 });
    G.box(x, RY + h + 0.12, 0, BAY + 1.3, 0.24, 2 * HD - 0.4, roofCol, { top: mul(CONC, 0.48) });
    GL.wallZ(x - 0.5, x + 0.5, RY, RY + 2.1, HD - 0.6 + 0.04, mul(BAMBOO, 0.3));
    K.prism(x + Rr.range(-1, 1), RY + h + 0.24, Rr.range(-3, 3), Rr.range(1.0, 1.4), Rr.range(1.4, 2.1), 10, jit([0.42, 0.44, 0.46], 0.1, Rr), { cap: [0.3, 0.31, 0.33] });
    K.prism(x + 2, RY + h + 0.24, 4, 0.04, Rr.range(3, 6), 3, DARK, { cap: false });
  }
  function roofRun(Rr, xa, xb, RY, skip, overFn) {   // one pass along a flat roof: washing, tanks, heaters, sheds, lofts, gardens, aerials
   for (let x = xa; x <= xb; x += 3.8) {
    if (skip && skip(x)) continue;
    for (const lane of [1, -1]) {
      const z = lane * Rr.range(3.2, 5.2), r = Rr(), xx = x + Rr.range(-0.6, 0.6), over = overFn ? overFn(x, lane) : false;
      if (over ? r < 0.5 : r < 0.12) {          // a line of sheets against the sky
        const w = Rr.range(2.6, 3.4), y = RY + Rr.range(1.9, 2.3), pc = bamboo();
        K.box(xx - w / 2, RY + y / 2 - RY / 2, z, 0.07, y - RY, 0.07, pc, { mask: 1 | 2 | 16 | 32 }); K.box(xx + w / 2, RY + y / 2 - RY / 2, z, 0.07, y - RY, 0.07, pc, { mask: 1 | 2 | 16 | 32 });
        K.box(xx, y, z, w + 0.4, 0.05, 0.05, pc, { mask: 4 | 8 | 16 | 32 });
        let cx = xx - w / 2 + 0.2; while (cx < xx + w / 2 - 0.5) { const cw = Math.min(Rr.range(0.7, 1.7), xx + w / 2 - cx); addCloth(cx + cw / 2, y, z, Rr.range(-0.1, 0.1), cw, Rr.range(0.9, 1.5), Rr.chance(0.7) ? 0 : 1, Rr.range(0.7, 1.2), pickCloth(Rr, true), Rr); cx += cw + 0.12; }
      } else if (r < 0.32) {                     // water tank on a stand (steel or blue plastic)
        const rad = Rr.range(0.7, 1.15), h = Rr.range(1.2, 2.0), blue = Rr.chance(0.35), c = blue ? jit([0.08, 0.2, 0.5], 0.15, Rr) : jit([0.45, 0.47, 0.5], 0.1, Rr);
        K.box(xx, RY + 0.25, z, rad * 1.7, 0.5, rad * 1.7, mul(CONC, 0.5), { mask: 1 | 2 | 16 | 32 });
        K.prism(xx, RY + 0.5, z, rad, h, 10, c, { cap: mul(c, 0.8) }); K.prism(xx, RY + 0.5 + h, z, rad * 0.4, 0.15, 6, mul(c, 0.7));
      } else if (r < 0.46) {                     // solar water heater: tilted dark tubes and a white drum
        const w = Rr.range(1.6, 2.2);
        K.box(xx, RY + 0.75, z, w, 0.07, 1.9, [0.02, 0.035, 0.09], { rx: 0.6, mask: 4 | 8 | 1 | 2, top: [0.03, 0.05, 0.13] });
        K.prism(xx - w / 2 - 0.1, RY + 1.42, z - 0.78, 0.26, w + 0.2, 7, jit(WHITE, 0.05, Rr), { axis: 'x' });
        K.box(xx, RY + 0.6, z - 0.75, w, 1.2, 0.06, [0.25, 0.25, 0.25], { mask: 16 | 32 });
      } else if (r < 0.58) {                     // tin-roofed kitchen or shed with a vent pipe
        const w = Rr.range(2.4, 3.4), d = Rr.range(2.2, 3.0), h = Rr.range(2.0, 2.5), c = jit(Rr.pick([mixc(CREAM, CONC, 0.5), [0.3, 0.2, 0.14], mul(CONC, 0.8)]), 0.08, Rr);
        G.box(xx, RY + h / 2, z, w, h, d, c, { mask: 1 | 2 | 16 | 32, aoB: 0.8 });
        K.box(xx, RY + h + 0.22, z, w + 0.5, 0.06, d + 0.7, jit(Rr.pick([mul(JADE, 0.7), [0.16, 0.25, 0.42], [0.36, 0.18, 0.1], [0.4, 0.42, 0.44]]), 0.12, Rr), { rx: 0.2 * lane });
        GL.wallZ(xx - 0.5, xx + 0.4, RY + 0.9, RY + 1.7, z + d / 2 + 0.03, Rr.pick(glassCols)); GL.wallZ(xx + 0.4, xx - 0.5, RY + 0.9, RY + 1.7, z - d / 2 - 0.03, Rr.pick(glassCols));
        K.prism(xx + w * 0.3, RY + h, z, 0.09, 1.3, 5, [0.2, 0.2, 0.2]);
      } else if (r < 0.68 || (over && r < 0.8)) { // pigeon loft on legs: mesh front, tin roof
        const w = Rr.range(1.8, 2.6), c = jit([0.3, 0.26, 0.2], 0.15, Rr);
        K.box(xx, RY + 1.5, z, w, 1.3, 1.3, c, { mask: 1 | 2 | 8 | 32 }); K.box(xx, RY + 2.25, z, w + 0.3, 0.05, 1.7, [0.36, 0.4, 0.42], { rx: 0.16 });
        barsZ(xx - w / 2, xx + w / 2, RY + 0.85, RY + 2.15, z + 0.66, [0.5, 0.5, 0.48], 2);
        for (const lx of [-1, 1]) K.box(xx + lx * (w / 2 - 0.08), RY + 0.42, z, 0.08, 0.85, 1.2, c, { mask: 1 | 2 | 16 | 32 });
      } else if (r < 0.9) {                      // roof garden: planter, vegetables, citrus, maybe a gourd trellis
        const w = Rr.range(2.4, 3.4);
        K.box(xx, RY + 0.22, z, w, 0.44, 1.3, jit([0.3, 0.2, 0.14], 0.15, Rr), { mask: 1 | 2 | 4 | 16 | 32, top: [0.07, 0.05, 0.035] });
        const np = 3 + ((Rr() * 3) | 0); for (let j = 0; j < np; j++) pot(Rr, xx - w / 2 + 0.3 + Rr() * (w - 0.6), RY + 0.2, z + Rr.range(-0.4, 0.4), Rr.range(0.8, 1.5), Rr.range(0.9, 2.4));
        if (Rr.chance(0.4)) { const ty = RY + 2.3; GB.quad([xx - w / 2, ty, z + 1], [xx + w / 2, ty, z + 1], [xx + w / 2, ty, z - 1], [xx - w / 2, ty, z - 1], bamboo(), 1, 1, 1, 1, [0, 0, w * 0.6, 1.2]);
          for (const lx of [-1, 1]) for (const lz of [-1, 1]) K.box(xx + lx * w / 2, RY + 1.15, z + lz, 0.06, 2.3, 0.06, bamboo(), { mask: 1 | 2 | 16 | 32 });
          creeper(Rr, xx - w / 2, xx + w / 2, ty + 0.05, Rr.range(0.7, 1.4), z + 1, 0.7); creeper(Rr, xx - w / 2, xx + w / 2, ty + 0.05, Rr.range(0.5, 1.2), z - 1, 0.7); }
      } else if (r < 0.96) K.prism(xx, RY, z, 0.045, Rr.range(3, 6.5), 3, DARK, { cap: false });
      if (Rr.chance(0.06)) person(Rr, xx + 1.4, RY, z * 0.5, Rr.chance(0.6));
    }
   }
  }
  roofRun(Rr, -76, 76, RY, (x) => { const bay = Math.floor((x + L / 2) / BAY); return cores.some((c) => Math.abs(c - bay) < 1 || Math.abs(-L / 2 + c * BAY + BAY / 2 - x) < 4.6); }, (x, lane) => Math.abs(x) < 12 && lane > 0);
  for (let j = 0; j < 16; j++) { const x = Rr.range(-78, 78), w = Rr.range(1.5, 6); creeper(Rr, x, x + w, RY + 1.0, Rr.range(1.5, 7), (Rr.chance(0.6) ? 1 : -1) * (HD + 0.36), 0.45); }
  for (let j = 0; j < 46 * detail; j++) addDrip(Rr.range(-79, 79), TOP - 0.05, (Rr.chance(0.7) ? 1 : -1) * (HD + 0.35), Rr.range(8, 20), 0.022, 1);
  await pause();

  // ---- the hole: dark concrete reveal outside, a lit station throat inside ----
  const Rh = rng.fork('hole'), frameCol = mul(CONC, 0.26), FZ = (WZ + HD) / 2 + 0.25, FD = HD - WZ + 0.5;
  for (const s of [1, -1]) {
    setFlip(s);
    for (const x of [HOLE.x0 - 0.5, HOLE.x1 + 0.5]) G.box(x, EYE_Y, FZ, 1.0, 17, FD, frameCol, { mask: 1 | 2 | 16, aoB: 0.8 });
    G.box(0, HOLE.y1 + 0.8, FZ, 22, 1.6, FD, frameCol, { mask: 4 | 8 | 16, aoB: 0.7 });       // transfer girder (lintel)
    G.box(0, HOLE.y0 - 0.45, FZ, 22, 0.9, FD, frameCol, { mask: 4 | 8 | 16 });
    const fz = FZ + FD / 2 + 0.02;
    G.wallZ(-9.4, 9.4, HOLE.y1 + 0.45, HOLE.y1 + 1.25, fz, mul(JADE, 0.85), 0.9, 1);        // jade name band, blank white plate
    G.wallZ(-2.6, 2.6, HOLE.y1 + 0.55, HOLE.y1 + 1.15, fz + 0.02, WHITE);
    for (let x = -9.5; x <= 9.5; x += 1.9) G.box(x, HOLE.y1 - 0.06, fz - 0.1, 0.16, 0.12, 0.34, [0.2, 0.2, 0.2], { mask: 1 | 2 | 8 | 16 }); // drain spouts
    if (s > 0 || detail >= 0.8) for (let x = -9.75; x <= 9.75; x += Rh.range(0.2, 0.42)) addDrip(x, HOLE.y1, fz + Rh.range(-0.05, 0.12), Rh.range(13, 17.5), 0.034, 1);
  }
  setFlip(1);
  const LAMP = [SUN[0] * 6.5, SUN[1] * 6.0, SUN[2] * 5.0], lightAt = (y, z) => {
    const edge = Math.abs(z) > 7.5 ? 0.16 : Math.abs(z) > 6.9 ? 0.62 : 1;       // darkened reveal edge
    return (0.36 + 1.25 * Math.exp(-(HOLE.y1 - y) / 5.5)) * edge + 0.16 * Math.exp(-(HD - Math.abs(z)) / 2);
  };
  const lit = (alb, y, z) => { const l = lightAt(y, z); return [alb[0] * l * 1.12, alb[1] * l * 0.94, alb[2] * l * 0.66]; };
  const hq = (a, b, c, d, alb) => {   // quad with baked light per vertex
    const i0 = HI.nv; HI.quad(a, b, c, d, [1, 1, 1]);
    [a, b, c, d].forEach((p, i) => { const col = lit(alb, p[1], p[2]); HI.c[(i0 + i) * 3] = col[0]; HI.c[(i0 + i) * 3 + 1] = col[1]; HI.c[(i0 + i) * 3 + 2] = col[2]; });
  };
  const zs = [8, 7.5, 6.9, 4, 0, -4, -6.9, -7.5, -8], ys = [17, 20.5, 24, 25.4, 25.7, 28.5, 31.5, 34];
  const tileW = [0.62, 0.62, 0.58], tileJ = mul(JADE, 0.75), PY = 24.0, PR = 5.6, PL = -6.6;
  for (let i = 0; i < zs.length - 1; i++) {
    const z0 = zs[i], z1 = zs[i + 1];
    for (let j = 0; j < ys.length - 1; j++) {     // side walls: jade dado to 1.4 m above the platform, cream tile above
      const y0 = ys[j], y1 = ys[j + 1], alb = y1 <= 25.45 ? tileJ : y0 < 25.5 ? [0.2, 0.2, 0.2] : tileW;
      hq([10, y0, z1], [10, y0, z0], [10, y1, z0], [10, y1, z1], alb); hq([-10, y0, z0], [-10, y0, z1], [-10, y1, z1], [-10, y1, z0], alb);
    }
    for (let m = 0; m < 4; m++) { const x0 = -10 + m * 5, x1 = x0 + 5; hq([x0, 34, z1], [x1, 34, z1], [x1, 34, z0], [x0, 34, z0], [0.5, 0.5, 0.47]); }  // soffit
    hq([PL, 17, z0], [PR, 17, z0], [PR, 17, z1], [PL, 17, z1], [0.1, 0.1, 0.1]);                              // track bed
    hq([PR, PY, z0], [10, PY, z0], [10, PY, z1], [PR, PY, z1], [0.42, 0.42, 0.4]); hq([-10, PY, z0], [PL, PY, z0], [PL, PY, z1], [-10, PY, z1], [0.42, 0.42, 0.4]); // platforms
    hq([PR, PY + 0.01, z0], [PR + 0.4, PY + 0.01, z0], [PR + 0.4, PY + 0.01, z1], [PR, PY + 0.01, z1], [0.75, 0.55, 0.08]); hq([PL - 0.4, PY + 0.01, z0], [PL, PY + 0.01, z0], [PL, PY + 0.01, z1], [PL - 0.4, PY + 0.01, z1], [0.75, 0.55, 0.08]);
    hq([PR, 17, z0], [PR, 17, z1], [PR, PY, z1], [PR, PY, z0], [0.2, 0.2, 0.2]); hq([PL, 17, z1], [PL, 17, z0], [PL, PY, z0], [PL, PY, z1], [0.2, 0.2, 0.2]);  // platform faces
  }
  for (const s of [1, -1]) {            // platform ends closing the plinths toward each mouth
    hq([PR, 17, 8 * s], [10, 17, 8 * s], [10, PY, 8 * s], [PR, PY, 8 * s], [0.2, 0.2, 0.2]); hq([-10, 17, 8 * s], [PL, 17, 8 * s], [PL, PY, 8 * s], [-10, PY, 8 * s], [0.2, 0.2, 0.2]);
  }
  const lampBox = (x, y, z, sx, sy, sz) => { HI.box(x, y, z, sx, sy, sz, mul(LAMP, 0.8), { mask: 1 | 2 | 16 | 32 }); HI.box(x, y, z, sx, sy, sz, mul(LAMP, 2), { mask: 8 }); };
  for (const x of [-8.3, -2.2, 2.9, 7.8]) for (let z = -7.1; z < 7; z += 3.6) lampBox(x, 33.72, z + 1.6, 0.26, 0.1, 3.0);   // strip lights
  for (const s of [1, -1]) lampBox(0, 33.7, 6.6 * s, 18.4, 0.12, 0.26);
  for (let z = -6; z <= 6; z += 4) { const c = lit([0.28, 0.28, 0.27], 32.5, z); HI.box(0, 33.6, z, 20, 0.8, 0.5, c, { mask: 8 | 16 | 32 }); }       // soffit ribs
  for (const [x, z] of [[7.9, 5.2], [-8.3, 4.4], [7.9, -5.2]]) {   // hanging signs: jade board, white plate
    HI.box(x, 30.4, z, 2.6, 0.6, 0.12, lit(mul(JADE, 1.1), 31.5, z), { mask: 16 | 32 | 4 | 8 }); HI.box(x - 0.5, 30.4, z, 1.0, 0.34, 0.16, lit([0.8, 0.8, 0.78], 31.5, z), { mask: 16 | 32 });
    HI.box(x - 1, 32.3, z, 0.05, 3.3, 0.05, [0.1, 0.1, 0.1], { mask: 1 | 16 }); HI.box(x + 1, 32.3, z, 0.05, 3.3, 0.05, [0.1, 0.1, 0.1], { mask: 1 | 16 });
  }
  if (opts.bulkhead !== false) {       // tiled end wall just behind the portal seat with a round jade-trimmed aperture for it
    const BZ = 1.3, RA = 7.25, RB = 7.95, N = 48;
    const edge = (a) => { const c = Math.cos(a), sn = Math.sin(a), k = Math.min(10 / Math.max(Math.abs(c), 1e-6), 8.5 / Math.max(Math.abs(sn), 1e-6)); return [c * k, EYE_Y + sn * k, BZ]; };
    const circ = (a, r, z) => [Math.cos(a) * r, EYE_Y + Math.sin(a) * r, z];
    for (let i = 0; i < N; i++) {
      const a0 = (i / N) * Math.PI * 2, a1 = ((i + 1) / N) * Math.PI * 2;
      hq(circ(a0, RA, BZ + 0.03), circ(a1, RA, BZ + 0.03), circ(a1, RB, BZ + 0.03), circ(a0, RB, BZ + 0.03), i % 6 === 0 ? [0.7, 0.7, 0.66] : tileJ);
      hq(circ(a0, RB, BZ), circ(a1, RB, BZ), edge(a1), edge(a0), Math.sin(a0) < -0.2 ? [0.2, 0.2, 0.2] : tileW);
      hq(circ(a0, RA, BZ - 0.4), circ(a1, RA, BZ - 0.4), circ(a1, RA, BZ + 0.03), circ(a0, RA, BZ + 0.03), [0.12, 0.12, 0.12]);
    }
  }
  // platform lips: railings, potted plants, waiting people under parasols (both mouths, denser at the front)
  for (const [x, d] of [[PR + 0.12, 1], [PL - 0.12, -1]]) {
    GB.quad([x, PY, 7.7], [x, PY, -7.7], [x, PY + 1.15, -7.7], [x, PY + 1.15, 7.7], [0.5, 0.52, 0.5], 1, 1, 1, 1, [-7.7, 0, 7.7, 1.15]);
    K.box(x, PY + 1.17, 0, 0.08, 0.07, 15.4, [0.55, 0.57, 0.55], { mask: 1 | 2 | 4 | 8 });
    for (let z = -7.7; z <= 7.71; z += 2.2) K.box(x, PY + 0.58, z, 0.07, 1.16, 0.07, [0.5, 0.52, 0.5], { mask: 1 | 2 | 16 | 32 });
    const wallX = d > 0 ? 9.5 : -9.55, w = d > 0 ? 3.4 : 2.2;
    for (let z = 7.5; z > -7.6; z -= Rh.range(0.9, 2.2)) {
      if (Rh.chance(0.75)) pot(Rh, wallX + Rh.range(-0.25, 0.1) * d, PY, z, Rh.range(0.7, 1.3), Rh.range(1.0, 2.3));
      if (z > 2.2 ? Rh.chance(0.7) : Rh.chance(0.22)) person(Rh, x + d * Rh.range(0.7, w - 0.6), PY, z + Rh.range(-0.3, 0.3), Rh.chance(0.75));
    }
    K.box(wallX - d * 0.7, PY + 0.25, 4.6, 0.5, 0.5, 1.8, [0.25, 0.17, 0.1], { mask: 1 | 2 | 4 | 16 | 32 });   // a bench
  }
  await pause();

  // ---- terrace and battered retaining wall (skirt down to GROUND_Y) ----
  const Rt = rng.fork('terrace'), TX = 90, TZ0 = -14, TZ1 = 22, BX = 93.5, BZ0 = -17.5, BZ1 = 25.5, wallC = mul(CONC, 0.95);
  G.floorY(-TX, TX, TZ0, TZ1, 0, mul(CONC, 0.85));
  for (let i = 0; i < 20; i++) {
    const a0 = i / 20, a1 = (i + 1) / 20, c = jit(wallC, 0.06, Rt), c2 = jit(wallC, 0.06, Rt);
    const xt0 = -TX + 2 * TX * a0, xt1 = -TX + 2 * TX * a1, xb0 = -BX + 2 * BX * a0, xb1 = -BX + 2 * BX * a1;
    G.quad([xb0, GROUND_Y, BZ1], [xb1, GROUND_Y, BZ1], [xt1, 0, TZ1], [xt0, 0, TZ1], c, 0.8, 0.8, 1, 1);
    G.quad([xb1, GROUND_Y, BZ0], [xb0, GROUND_Y, BZ0], [xt0, 0, TZ0], [xt1, 0, TZ0], c2, 0.8, 0.8, 1, 1);
    if (i % 2 === 1 && Math.abs(xt0) > 8) G.box(xt0 * 1.02, GROUND_Y / 2 - 0.2, (TZ1 + BZ1) / 2 + 0.5, 1.3, 14.2, 1.5, jit(mul(wallC, 0.9), 0.05, Rt), { rx: -0.245, mask: 1 | 2 | 4 | 16, taper: 0.7 });
    if (Rt.chance(0.5)) { const x = xt0 + Rt.range(0, 6), w = Rt.range(3, 9), len = Rt.range(4, 12.5); creeper(Rt, x, Math.min(x + w * 0.45, TX), 1.0, len, TZ1 + 0.3, 0.3, len * 0.25); }
    if (Rt.chance(0.3)) { const x = xt0 + Rt.range(0, 6), w = Rt.range(3, 8), len = Rt.range(4, 12); setFlip(-1); creeper(Rt, x, Math.min(x + w * 0.45, TX), 1.0, len, -TZ0 + 0.3, 0.3, len * 0.25); setFlip(1); }
    if (Rt.chance(0.4)) addDrip(xt0 + Rt.range(0, 8), -3 - Rt.range(0, 3), TZ1 + 1.2, Rt.range(5, 8), 0.03, 1);
  }
  G.quad([BX, GROUND_Y, BZ1], [BX, GROUND_Y, BZ0], [TX, 0, TZ0], [TX, 0, TZ1], jit(wallC, 0.05, Rt), 0.8, 0.8, 1, 1);
  G.quad([-BX, GROUND_Y, BZ0], [-BX, GROUND_Y, BZ1], [-TX, 0, TZ1], [-TX, 0, TZ0], jit(wallC, 0.05, Rt), 0.8, 0.8, 1, 1);
  G.box(0, 0.5, TZ1 - 0.15, 2 * TX, 1.0, 0.3, mul(wallC, 1.05), { mask: 4 | 16 | 32 }); G.box(0, 0.5, TZ0 + 0.15, 2 * TX, 1.0, 0.3, mul(wallC, 1.05), { mask: 4 | 16 | 32 });
  for (const s of [1, -1]) G.box(s * (TX - 0.15), 0.5, (TZ0 + TZ1) / 2, 0.3, 1.0, TZ1 - TZ0, mul(wallC, 1.05), { mask: 1 | 2 | 4 });
  for (let x = -84; x < 84; x += Rt.range(5, 11)) {   // planters, shrubs and a few parasols along the terrace
    if (Math.abs(x + 2.2) < 5) continue;
    const z = TZ1 - Rt.range(1.2, 2.4), w = Rt.range(2, 4.5);
    K.box(x, 0.3, z, w, 0.6, 1.2, jit(mul(CONC, 0.7), 0.1, Rt), { mask: 1 | 2 | 4 | 16 | 32, top: [0.07, 0.05, 0.035] });
    for (let j = 0; j < 3; j++) pot(Rt, x + Rt.range(-w / 2, w / 2), 0.35, z + Rt.range(-0.3, 0.3), Rt.range(1.2, 2.6), Rt.range(1.4, 3.6));
    if (Rt.chance(0.6)) person(Rt, x + Rt.range(2, 4), 0, Rt.range(10, 19), Rt.chance(0.7));
  }

  await pause();

  // ---- the twin beams, walkway and T-piers running into the hole (opts.beam === false to omit) ----
  const BM = new Geo(); let beamMesh = null;
  if (opts.beam !== false) {
    const Rb = rng.fork('beam'), bc = mul(MIST, 0.62), z0 = -HD - 0.5, z1 = 70, zc = (z0 + z1) / 2, len = z1 - z0;
    for (const x of [0, TWIN_X]) {
      BM.box(x, BEAM_TOP - 0.75, zc, 0.85, 1.5, len, bc, { mask: 1 | 2 | 4 | 8 | 16, aoB: 0.82 });
      BM.floorY(x - 0.16, x + 0.16, z0, z1, BEAM_TOP + 0.012, mul(bc, 0.42));                    // wet running stripe
      BM.box(x + 0.46, BEAM_TOP - 0.95, zc, 0.07, 0.14, len, [0.16, 0.1, 0.06], { mask: 1 | 4 | 8 });  // power rail
      for (let z = z0 + 6; z < z1; z += 30) BM.box(x, BEAM_TOP - 0.75, z, 0.87, 1.52, 0.06, mul(bc, 0.35), { mask: 1 | 2 | 4 });
    }
    BM.box(TWIN_X / 2, BEAM_TOP - 1.0, zc, 0.5, 0.16, len, [0.12, 0.12, 0.13], { mask: 1 | 2 | 4 | 8 });   // cable tray
    GB.quad([TWIN_X + 0.75, BEAM_TOP - 0.6, z1], [-0.75, BEAM_TOP - 0.6, z1], [-0.75, BEAM_TOP - 0.6, z0], [TWIN_X + 0.75, BEAM_TOP - 0.6, z0], [0.3, 0.31, 0.32], 1, 1, 1, 1, [0, z0 * 3, 9, z1 * 3]);
    const pier = (z, base, stub) => {
      const pc = jit(mul(MIST, 0.56), 0.05, Rb), topY = BEAM_TOP - 1.5;
      BM.box(TWIN_X / 2, topY - 0.55, z, 7.4, 1.1, 1.8, pc, { mask: 1 | 2 | 4 | 8 | 16 | 32, aoB: 0.85 });
      BM.box(TWIN_X / 2, topY - 1.9, z, 2.5, 1.6, 1.5, pc, { taper: 1.9, mask: 1 | 2 | 16 | 32, aoB: 0.85 });
      if (!stub) BM.box(TWIN_X / 2, (topY - 2.7 + base) / 2, z, 2.5, topY - 2.7 - base, 1.5, pc, { mask: 1 | 2 | 16 | 32, aoB: 0.6 });
      else BM.box(TWIN_X / 2, (topY - 2.7 + base) / 2, z, 2.5, topY - 2.7 - base, 1.5, pc, { mask: 1 | 2 | 16 | 32 });
    };
    pier(5.2, HOLE.y0, true); pier(-5.2, HOLE.y0, true); pier(16, 0, false); pier(42, GROUND_Y, false); pier(68, GROUND_Y, false);
  }

  // ---- materials (the hero's set, and on demand a second set without the sun-shaft term for the rest of the city) ----
  const makeMats = (ns) => {
    const k = ns ? '-w' : '';
    return {
      shell: patch(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.86, metalness: 0 }), U, 'shell' + k,
        { fpars: 'float gPud = 0.;\n', color: SHELL_COLOR, rough: SHELL_ROUGH, out: SHELL_OUT, noShaft: ns }),
      glass: patch(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.22, metalness: 0 }), U, 'glass' + k, { out: GLASS_OUT, noShaft: ns }),
      clutter: patch(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.7, metalness: 0 }), U, 'clutter' + k, { noShaft: ns }),
      bars: patch(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.6, metalness: 0.2, transparent: true, depthWrite: false, side: THREE.DoubleSide }), U, 'bars' + k,
        { fpars: BARS_PARS, color: BARS_COLOR, noShaft: ns }),
      cloth: patch(new THREE.MeshLambertMaterial({ side: THREE.DoubleSide }), U, 'cloth' + k,
        { vpars: CLOTH_VPARS, vert: CLOTH_VERT, fpars: '#define K_BACK 0.6\n#define K_AMB 0.08\n' + CLOTH_FPARS, color: CLOTH_COLOR, light: BACKLIT, noShaft: ns }),
      plant: patch(new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide }), U, 'plant' + k,
        { vpars: PLANT_VPARS, vert: PLANT_VERT, fpars: '#define K_BACK 0.3\n#define K_AMB 0.45\n' + PLANT_FPARS, color: PLANT_COLOR, light: BACKLIT, norm: 'normal = normalize(vNormal);', noShaft: ns }),
    };
  };
  const HM = makeMats(false), shellMat = HM.shell, glassMat = HM.glass, clutterMat = HM.clutter, barsMat = HM.bars, clothMat = HM.cloth, plantMat = HM.plant;
  const holeMat = new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide });
  const dripU = { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), uRes: { value: new THREE.Vector2(1280, 720) }, uTime: U.uTime, uSky: U.uSky };
  const dripMat = new THREE.ShaderMaterial({
    uniforms: dripU, fog: true, transparent: true, depthWrite: false, side: THREE.DoubleSide,
    vertexShader: /* glsl */`
      attribute vec4 aD; uniform vec2 uRes; varying vec3 vD; varying float vFade;
      #include <fog_pars_vertex>
      void main(){
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.);
        gl_Position = projectionMatrix * mvPosition;
        float px = aD.w * projectionMatrix[1][1] * uRes.y * 0.5 / max(-mvPosition.z, 0.1);
        gl_Position.x += aD.x * max(px, 1.6) / max(uRes.x, 1.) * gl_Position.w;
        vD = aD.xyz; vFade = clamp(px / 1.6, 0.03, 1.);
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uSky; uniform float uTime; varying vec3 vD; varying float vFade;
      #include <fog_pars_fragment>
      void main(){
        float s = sqrt(max(vD.y, 0.) + 0.04);
        float f1 = fract(uTime * 1.7 - s * 0.9 + vD.z), f2 = fract(uTime * 2.9 - s * 1.55 + vD.z * 1.7);
        float bead = max(1. - smoothstep(0., 0.13, f1), 0.6 * (1. - smoothstep(0., 0.2, f2)));
        float a = (bead + 0.07) * (1. - vD.x * vD.x) * vFade;
        gl_FragColor = vec4(uSky * (1.1 + 2.4 * bead), clamp(a, 0., 1.) * 0.85);
        #include <fog_fragment>
      }`,
  });
  await pause();

  // ---- meshes ----
  // warm room lights for dusk looks: a share of the window quads becomes HDR warm (opts.lit)
  const lightGlass = (B, frac, R) => { for (let q = 0; q + 3 < B.nv; q += 4) if (R() < frac) { const k = R.range(1.35, 2.1); for (let i = q * 3; i < q * 3 + 12; i += 3) { B.c[i] = k; B.c[i + 1] = k * 0.62; B.c[i + 2] = k * 0.26; } } };
  const plantGeometry = () => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(pP), 3));
    g.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(pN), 3));
    g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(pU), 2));
    g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(pC), 3));
    g.setAttribute('aPl', new THREE.BufferAttribute(new Float32Array(pA), 3));
    g.setIndex(pnv > 65535 ? new THREE.BufferAttribute(new Uint32Array(pI), 1) : new THREE.BufferAttribute(new Uint16Array(pI), 1));
    g.computeBoundingSphere();
    return g;
  };
  const clothMeshOf = (mat) => {
    const n = clC.length / 3, g = new THREE.PlaneGeometry(1, 1, 2, 2); g.translate(0, -0.5, 0);
    g.setAttribute('aCl', new THREE.InstancedBufferAttribute(new Float32Array(clA), 4));
    const m = new THREE.InstancedMesh(g, mat, n);
    m.instanceMatrix.array.set(clM); m.instanceMatrix.needsUpdate = true;
    m.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(clC), 3);
    m.name = 'laundry';
    return m;
  };
  const _sz = new THREE.Vector2();
  const dripMeshOf = () => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(dP), 3));
    g.setAttribute('aD', new THREE.BufferAttribute(new Float32Array(dA), 4));
    g.setIndex(dI.slice()); g.computeBoundingSphere();
    const m = new THREE.Mesh(g, dripMat); m.name = 'drips'; m.renderOrder = 3;
    m.onBeforeRender = (renderer) => { renderer.getDrawingBufferSize(_sz); dripU.uRes.value.copy(_sz); };
    return m;
  };
  if (opts.lit) lightGlass(GL, opts.lit, rng.fork('lit'));
  const object = new THREE.Group(); object.name = 'through-the-tower';
  const add = (geo, mat, name, order = 0) => { const m = new THREE.Mesh(geo, mat); m.name = name; m.renderOrder = order; object.add(m); return m; };
  add(await G.toGeometryAsync(pause), shellMat, 'slab-shell'); await pause();
  add(await GL.toGeometryAsync(pause), glassMat, 'slab-glass'); await pause();
  add(await K.toGeometryAsync(pause), clutterMat, 'slab-clutter'); await pause();
  add(HI.toGeometry(), holeMat, 'hole-interior');
  if (BM.nv) beamMesh = add(BM.toGeometry(), shellMat, 'beam-and-piers');
  await pause();
  add(plantGeometry(), plantMat, 'plants'); await pause();
  const nCloth = clC.length / 3, clothMesh = clothMeshOf(clothMat);
  clothMesh.frustumCulled = false; object.add(clothMesh); await pause();
  add(await GB.toGeometryAsync(pause), barsMat, 'bars', 2); await pause();
  object.add(dripMeshOf());
  const heroTris = G.tris + GL.tris + K.tris + HI.tris + BM.tris + GB.tris + pI.length / 3 + nCloth * 8 + dI.length / 3;

  // ---- kit: the hero's vocabulary (balcony bays, clutter, roofs) offered to the world for the rest of the city.
  // Everything is built in the hero's own frame (balcony face at z = +8, 5 m bays, 3.4 m storeys), then moved with
  // place(mark, x, y, z, yaw), and turned into meshes by flush(), which uses a second material set without the sun shaft.
  const runGen = (it) => { let r; while (!(r = it.next()).done); return r.value; };
  function strip(R, nb, ns, o = NOOPT) { return runGen(stripGen(R, nb, ns, o)); }
  function* stripGen(R, nb, ns, o = NOOPT) {   // the same face, pausing after each column of bays (the draws from R are in the same order either way)
    const x0 = -nb * BAY / 2, tint = o.tint || tints[0], level = o.level, core = o.core ?? -1;
    for (let b = 0; b <= nb; b++) {
      if (b > 0) yield;
      const xa = x0 + b * BAY, xb = xa + BAY, xc = xa + BAY / 2;
      for (let k = 0; k < ns; k++) {
        const y0 = k * ST, lv = level ? level(b, k) : 2;
        G.box(xa, y0 + ST / 2, (WZ + HD) / 2 + 0.03, 0.24, ST, HD - WZ + 0.06, jit(mixc(CONC, tint, 0.55), 0.05, R), { mask: 1 | 2 | 16, aoB: 0.92 });
        if (b === nb) continue;
        if (b === core) {
          const cc = jit(mixc(tint, CONC, 0.35), 0.03, R);
          G.wallZ(xa, xb, y0, y0 + ST, HD, cc, 0.95, 1);
          GL.wallZ(xa + 1.5, xb - 1.5, y0 + 1.75, y0 + 3.0, HD + 0.04, R.pick(glassCols));
          G.box(xa + 0.7, y0 + ST / 2, HD + 0.09, 0.14, ST, 0.14, mul(CONC, 0.5), { mask: 1 | 2 | 16 });
          continue;
        }
        const r = R(), type = r < mix4[0] ? 0 : r < mix4[0] + mix4[1] ? 1 : r < mix4[0] + mix4[1] + mix4[2] ? 2 : r < mix4[0] + mix4[1] + mix4[2] + mix4[3] ? 3 : 4;
        cell(R, xa, xb, y0, tint, lv > 0 ? type : (type === 2 ? 0 : type));
        if (lv >= 2) dress(R, xa, xb, y0, type, true, true, k); else if (lv >= 1) dress(R, xa, xb, y0, type, false, false, k);
      }
    }
  }
  function tower(R, o = NOOPT) { return runGen(towerGen(R, o)); }
  async function towerAsync(R, o, pause) { const it = towerGen(R, o); let r; while (!(r = it.next()).done) await pause(); return r.value; }   // the same block, handing the page back between columns of bays
  function* towerGen(R, o = NOOPT) {   // a slab block: nb bays wide, 16 m deep, ns storeys; origin at the base centre, balcony face +Z
    // o.gableDress(s, k) -> true loads the plain part of that gable storey too (window cages, awnings, a pole of washing, a pipe), fed by o.dressRng.
    // o.gable(s, k) -> -1 | 0 | 0.5 | 1 | 2 dresses the gable ends (-1 leaves that storey bare, 0.5 is a balcony bay with nothing on it) (s = +1 the +X end, -1 the -X end): floor bands, air conditioners with drip pipes,
    // a wider creeper, and where it returns 1 or 2 a cantilevered balcony bay on that storey (2 = fully loaded). o.gableRng feeds all of it,
    // so the main sequence R is drawn exactly as before. o.hut swaps the roof's stair bulkhead for a small hut and plants the roof.
    const nb = o.nb || 5, ns = o.ns || 22, W = nb * BAY, X = W / 2, tint = tints[o.tint ?? ((R() * 3) | 0)], H = ns * ST, skirt = o.skirt ?? 16;
    const GR = o.gableRng || R, gLv = o.gable || null, SZ = 5.5;
    const DR = o.dressRng || GR, gDress = o.gableDress || null;
    setFlip(1); yield* stripGen(R, nb, ns, { tint, level: o.level, core: o.core });
    yield;
    setFlip(-1);
    if (o.back) yield* stripGen(R, nb, ns, { tint, level: o.back });
    else for (let k = 0; k < ns; k++) {
      G.wallZ(-X, X, k * ST, k * ST + ST, HD, jit(tint, 0.04, R), 0.92, 1);
      for (let b = 0; b < nb; b++) if (R.chance(0.8)) GL.wallZ(-X + b * BAY + 1, -X + b * BAY + BAY - 1.2, k * ST + 1.1, k * ST + 2.5, HD + 0.03, R.pick(glassCols));
    }
    for (const s of [1, -1]) {     // gable ends: stained wall, two columns of small windows, a down-pipe, creeper from the roof
      yield;
      setFlip(s);
      let stack = false; if (gLv) for (let k = 0; k < ns && !stack; k++) stack = gLv(s, k) > 0;
      const zWin = stack ? [-3.2 * s, 0.4 * s] : [-3.2, 2.6], zAC = stack ? [-6.1, -1.4, 2.05] : [-6.1, -0.3, 5.6];
      for (let k = 0; k < ns; k++) {
        const y0 = k * ST, c = jit(mixc(tint, CONC, 0.2), 0.03, R);
        G.quad([X, y0, HD], [X, y0, -HD], [X, y0 + ST, -HD], [X, y0 + ST, HD], c, 0.97, 0.97, 1, 1);
        for (const z of zWin) {
          GL.quad([X + 0.04, y0 + 1.1, z + 0.7], [X + 0.04, y0 + 1.1, z - 0.7], [X + 0.04, y0 + 2.4, z - 0.7], [X + 0.04, y0 + 2.4, z + 0.7], R.chance(0.3) ? mul(R.pick(cloths), 0.3) : R.pick(glassCols));
          if (R.chance(0.3)) K.box(X + 0.22, y0 + 0.6, z + R.range(-0.3, 0.3), 0.36, 0.56, 0.84, jit(mixc(WHITE, CONC, 0.4), 0.08, R), { mask: 1 | 4 | 8 | 16 | 32 });
        }
        const lv = gLv ? gLv(s, k) : -1;
        if (lv < 0) continue;
        G.box(X + 0.05, y0 + 0.02, 0, 0.1, 0.3, 2 * HD, mul(c, 0.7), { mask: 1 | 4 | 8 });                      // floor-slab band
        if (GR.chance(0.62)) {                                                                                 // air conditioner, grille, drip pipe
          const z = s * (zAC[(GR() * 3) | 0] + GR.range(-0.25, 0.25)), y = y0 + 0.75 + GR() * 1.5, pl = GR.range(1.2, 3.0), ac = jit(mixc(WHITE, CONC, GR() * 0.5), 0.08, GR);
          K.box(X + 0.24, y, z, 0.38, 0.56, 0.84, ac, { mask: 1 | 4 | 8 | 16 | 32, aoB: 0.8 });
          K.quad([X + 0.435, y - 0.2, z + 0.3], [X + 0.435, y - 0.2, z - 0.14], [X + 0.435, y + 0.2, z - 0.14], [X + 0.435, y + 0.2, z + 0.3], [0.07, 0.075, 0.08]);
          K.box(X + 0.24, y - 0.31, z, 0.44, 0.05, 0.92, [0.2, 0.19, 0.18], { mask: 1 | 8 });
          K.box(X + 0.05, y - 0.28 - pl / 2, z + 0.5, 0.05, pl, 0.05, [0.5, 0.5, 0.48], { mask: 1 | 16 | 32 });
          if (GR.chance(0.22)) addDrip(X + 0.08, y - 0.28 - pl, z + 0.5, GR.range(5, 11), 0.02, 1);
        }
        if (gDress && gDress(s, k)) for (const z of zWin) {                                                    // the plain wall beside the stack, lived in: caged windows, awnings, washing, pipes
          const r = DR();
          if (r < 0.5) {                                                                                       // a cage of bars bellying out round the window, a pot or two inside it
            const xo = X + 0.42, za = z - 0.82, zb = z + 0.82, ya = y0 + 0.95, yb = y0 + 2.5, bc = [0.16, 0.2, 0.19];
            GB.quad([xo, ya, zb], [xo, ya, za], [xo, yb, za], [xo, yb, zb], bc, 1, 1, 1, 1, [za, ya, zb, yb]);
            K.box(X + 0.21, ya, z, 0.42, 0.05, 1.64, [0.2, 0.2, 0.19], { mask: 1 | 4 | 8 | 16 | 32 });
            for (let j = 0; j < 2; j++) if (DR.chance(0.6)) pot(DR, X + 0.22, ya + 0.03, z + DR.range(-0.6, 0.6), DR.range(0.4, 0.7), DR.range(0.45, 0.9));
          } else if (r < 0.8) {                                                                                // a bamboo pole of washing reaching out under the sill
            const len = DR.range(1.5, 2.3), py = y0 + DR.range(0.95, 1.1), pz = z + DR.range(-0.3, 0.3), n = 2 + ((DR() * 2) | 0);
            K.box(X + len / 2, py, pz, len, 0.06, 0.06, bamboo(), { mask: 1 | 4 | 8 | 16 | 32 });
            for (let j = 0; j < n; j++) garment(DR, X + 0.3 + (j + DR.range(0.2, 0.8)) * (len - 0.4) / n, py - 0.04, pz, Math.PI / 2 + DR.range(-0.35, 0.35), true);
          }
          if (DR.chance(0.4)) {                                                                                // a faded awning over the window
            const col = jit(mul(mixc(DR.pick(awnCols), [0.42, 0.45, 0.44], DR.range(0.25, 0.6)), DR.range(0.75, 1.05)), 0.08, DR), d = DR.range(0.8, 1.2), ya = y0 + 2.62;
            K.quad([X + 0.04, ya, z - 0.95], [X + 0.04, ya, z + 0.95], [X + d, ya - 0.45 * d, z + 0.95], [X + d, ya - 0.45 * d, z - 0.95], col, 1, 1, 0.8, 0.8);
            K.quad([X + 0.04, ya, z + 0.95], [X + 0.04, ya, z - 0.95], [X + d, ya - 0.45 * d, z - 0.95], [X + d, ya - 0.45 * d, z + 0.95], mul(col, 0.55));
            K.quad([X + d, ya - 0.45 * d - 0.2, z + 0.95], [X + d, ya - 0.45 * d - 0.2, z - 0.95], [X + d, ya - 0.45 * d, z - 0.95], [X + d, ya - 0.45 * d, z + 0.95], mul(col, 0.85));
          }
          if (DR.chance(0.3)) K.box(X + 0.06, y0 + ST / 2, z + 1.25 + DR.range(0, 0.5), 0.07, ST, 0.07, jit([0.45, 0.46, 0.44], 0.1, DR), { mask: 1 | 16 | 32 });   // a waste pipe
        }
        if (lv > 0) {                                                                                          // one cantilevered balcony bay, built in the front frame and turned onto the gable
          setFlip(1); const mk = kit.mark(), r = GR(), type = r < 0.38 ? 0 : r < 0.54 ? 1 : r < 0.8 ? 2 : 3;
          for (const fx of [-BAY / 2, BAY / 2]) G.box(fx, y0 + ST / 2, (WZ + HD) / 2 + 0.03, 0.24, ST, HD - WZ + 0.06, jit(mixc(CONC, tint, 0.55), 0.05, GR), { mask: 1 | 2 | 16, aoB: 0.92 });
          cell(GR, -BAY / 2, BAY / 2, y0, tint, type);
          if (lv >= 1) dress(GR, -BAY / 2, BAY / 2, y0, type, lv >= 2, lv >= 2, k);
          if (k === ns - 1 || !(gLv(s, k + 1) > 0)) G.box(0, y0 + ST, (WZ + HD) / 2 + 0.04, BAY + 0.24, 0.26, HD - WZ + 0.08, jit(slabCol, 0.06, GR), { mask: 4 | 8 | 16 | 1 | 2 });
          kit.place(mk, s * (X - WZ + 0.06), 0, SZ, s * Math.PI / 2);
          setFlip(s);
        }
      }
      G.box(X + 0.09, H / 2, -0.4, 0.16, H, 0.16, mul(CONC, 0.5), { mask: 1 | 16 | 32 });
      const hiL = stack ? SZ - BAY / 2 - 0.2 : HD - 0.4;
      const sheet = (z0, w, len, seed, col) => {      // three ragged strips of different lengths side by side, never one wide mat
        const span = Math.min(w, 8.4), L0 = Math.min(len, 14), a0 = Math.max(-HD + 0.4, Math.min(hiL - 1, z0));
        for (let j = 0; j < 3; j++) {
          const fr = (seed * (7.3 + j * 3.1)) % 1, a = a0 + span * (j / 3 + 0.04), e = Math.min(hiL, a + span / 3 * (0.55 + 0.4 * fr)), l = L0 * (j === 0 ? 1 : j === 1 ? 0.5 : 0.75) * (0.7 + 0.3 * fr);
          if (e - a > 0.5) plantQuad(X + 0.15, s * e, X + 0.15, s * a, H + 1.2 - l, H + 1.2, a * 0.3, e * 0.3, (seed + j * 0.37) % 1, 1, -0.25, col);
        }
      };
      if (R.chance(0.7)) { const z0 = R.range(-6.4, 1), w = R.range(3, 7), len = R.range(8, 30), seed = R(), col = mul(leafCol(R), gLv ? 0.72 : 0.6); if (gLv) sheet(z0 - 2, w * 1.2, len, seed, col); else plantQuad(X + 0.15, z0 + w, X + 0.15, z0, H + 1.2 - len, H + 1.2, z0 * 0.3, (z0 + w) * 0.3, seed, 1, -0.25, col); }
      else if (gLv && GR.chance(0.67)) sheet(GR.range(-7, 0), GR.range(7, 14), GR.range(8, 30), GR(), mul(leafCol(GR), 0.72));
    }
    setFlip(1);
    G.box(0, -skirt / 2, 0, W + 0.5, skirt, 2 * HD + 0.5, mul(mixc(CONC, tint, 0.3), 0.8), { mask: 1 | 2 | 16 | 32, aoB: 0.7 });
    const RY = H + 0.3, hut = !!o.hut;
    G.box(0, H + 0.15, 0, W + 0.8, 0.3, 2 * HD + 0.8, mul(CONC, 0.6), { top: mul(CONC, 0.5) });
    for (const z of [HD + 0.2, -HD - 0.2]) G.box(0, RY + 0.5, z, W + 0.5, 1.0, 0.22, jit(mixc(tint, CONC, 0.4), 0.04, R), { mask: 4 | 16 | 32 });
    for (const x of [X + 0.2, -X - 0.2]) G.box(x, RY + 0.5, 0, 0.22, 1.0, 2 * HD + 0.4, mixc(tint, CONC, 0.4), { mask: 1 | 2 | 4 });
    const bx = (o.core >= 0 ? -X + o.core * BAY + BAY / 2 : R.range(-X + 4, X - 4)), bh0 = R.range(3, 6), bh = hut ? 2.5 : bh0, bw = hut ? 3.2 : BAY + 0.6, bd = hut ? 4.4 : 2 * HD - 1.2, hk = hut ? 0.35 : 1;
    G.box(bx, RY + bh / 2, 0, bw, bh, bd, jit(mixc(tint, CONC, 0.35), 0.04, R), { mask: 1 | 2 | 16 | 32, aoB: 0.85 });
    G.box(bx, RY + bh + 0.12, 0, bw + 0.7, 0.24, bd + 0.8, mul(CONC, 0.6), { top: mul(CONC, 0.48) });
    K.prism(bx + R.range(-1, 1) * hk, RY + bh + 0.24, R.range(-3, 3) * hk, R.range(1.0, 1.4) * (hut ? 0.7 : 1), R.range(1.4, 2.1) * (hut ? 0.7 : 1), 10, jit([0.42, 0.44, 0.46], 0.1, R), { cap: [0.3, 0.31, 0.33] });
    if (o.roof !== false) roofRun(R, -X + 2.4, X - 2.4, RY, (x) => Math.abs(x - bx) < 4.6, o.sheets ? (x, lane) => lane > 0 : null);
    if (hut) {                     // a low roof seen from the cab: a door in the hut, both lanes filled beside it, a row of planters and citrus down the middle
      GL.wallZ(bx - 0.45, bx + 0.45, RY, RY + 2.0, bd / 2 + 0.04, mul(BAMBOO, 0.3));
      const xa = Math.max(-X + 2.4, bx - 1.9), xb = Math.min(X - 2.4, bx + 1.9);
      roofRun(GR, xa, xb, RY, null, (x, lane) => lane > 0);
      for (let x = -X + 2; x < X - 1.8; x += 2.6) {
        if (Math.abs(x - bx) < 2.8) continue;
        const z = GR.range(-0.5, 0.5);
        K.box(x, RY + 0.2, z, 2.2, 0.4, 1.1, jit([0.3, 0.2, 0.14], 0.15, GR), { mask: 1 | 2 | 4 | 16 | 32, top: [0.07, 0.05, 0.035] });
        for (let j = 0; j < 3; j++) pot(GR, x + GR.range(-0.9, 0.9), RY + 0.3, z + GR.range(-0.35, 0.35), GR.range(0.9, 1.7), GR.range(1.0, 2.7));
      }
    }
    return H;
  }
  let WM = null, kitTris = 0;
  const buckets = [G, GL, GB, K];
  const rotY = (A, from, to, c, s, x, y, z) => { for (let v = from; v < to; v += 3) { const px = A[v], pz = A[v + 2]; A[v] = px * c + pz * s + x; A[v + 1] += y; A[v + 2] = -px * s + pz * c + z; } };
  const kit = {
    Geo, G, GL, GB, K, BAY, ST, HD, NOOPT,
    pal: { MIST, CONC, LEAF, JADE, BAMBOO, RED, SUN, CREAM, WHITE, DARK, tints, cloths, glassCols },
    mixc, mul, jit, pot, creeper, person, addDrip, addCloth, garment, pickCloth, dress, cell, strip, tower, towerAsync, roofRun, setFlip, barsZ, bamboo, leafCol, plantQuad,
    uniforms: U,
    mats() { if (!WM) WM = makeMats(true); return WM; },
    reset() {
      for (const b of buckets) b.clear(); HI.clear(); BM.clear();
      clM.length = clC.length = clA.length = 0; pP.length = pU.length = pA.length = pC.length = pN.length = pI.length = 0; pnv = 0;
      dP.length = dA.length = dI.length = 0; dnv = 0; setFlip(1);
    },
    mark() { return [G.nv, GL.nv, GB.nv, K.nv, clC.length / 3, pnv, dnv]; },
    place(m, x, y, z, yaw = 0) {
      const c = Math.cos(yaw), s = Math.sin(yaw);
      buckets.forEach((b, i) => { rotY(b.p, m[i] * 3, b.nv * 3, c, s, x, y, z); rotY(b.n, m[i] * 3, b.nv * 3, c, s, 0, 0, 0); });
      for (let i = m[4] * 16; i < clM.length; i += 16) { rotY(clM, i, i + 3, c, s, 0, 0, 0); rotY(clM, i + 4, i + 7, c, s, 0, 0, 0); rotY(clM, i + 8, i + 11, c, s, 0, 0, 0); rotY(clM, i + 12, i + 15, c, s, x, y, z); }
      rotY(pP, m[5] * 3, pP.length, c, s, x, y, z); rotY(pN, m[5] * 3, pN.length, c, s, 0, 0, 0);
      rotY(dP, m[6] * 3, dP.length, c, s, x, y, z);
    },
    async flush(name, o = NOOPT) {   // everything accumulated since reset() becomes one group of at most 7 meshes (a step per mesh)
      const M = kit.mats(), g = new THREE.Group(); g.name = name;
      if (o.lit) lightGlass(GL, o.lit, rng.fork('lit-' + name));
      const put = async (B, mat, nm, order = 0) => { if (!B.nv) return; const m = new THREE.Mesh(await B.toGeometryAsync(pause), mat); m.name = name + '-' + nm; m.renderOrder = order; g.add(m); kitTris += B.tris; await pause(); };
      await pause(); await put(G, M.shell, 'shell'); await put(GL, M.glass, 'glass'); await put(K, M.clutter, 'clutter');
      if (pnv) { const m = new THREE.Mesh(plantGeometry(), M.plant); m.name = name + '-plants'; g.add(m); kitTris += pI.length / 3; await pause(); }
      if (clC.length) { const m = clothMeshOf(M.cloth); m.computeBoundingSphere(); m.boundingSphere.radius += 3; m.name = name + '-laundry'; g.add(m); kitTris += clC.length / 3 * 8; await pause(); }
      await put(GB, M.bars, 'bars', 2);
      if (dnv) { g.add(dripMeshOf()); kitTris += dI.length / 3; }
      kit.reset();
      return g;
    },
    get triangles() { return kitTris; },
  };
  kit.reset();

  // ---- lamp light hanging in the damp air of both mouths: a rim glow hugging the reveal ----
  const glowU = { uGlow: { value: new THREE.Color().setRGB(SUN[0] * 1.3, SUN[1] * 1.2, SUN[2] * 1.0) }, uGlowK: { value: 1 } };
  {
    const gg = new THREE.BufferGeometry(), gp = [];
    for (const s of [1, -1]) gp.push(-21 * s, EYE_Y - 17, (HD + 0.75) * s, 21 * s, EYE_Y - 17, (HD + 0.75) * s, 21 * s, EYE_Y + 17, (HD + 0.75) * s, -21 * s, EYE_Y + 17, (HD + 0.75) * s);
    gg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(gp), 3)); gg.setIndex([0, 1, 2, 0, 2, 3, 4, 5, 6, 4, 6, 7]);
    const gm = new THREE.Mesh(gg, new THREE.ShaderMaterial({
      uniforms: glowU, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      vertexShader: `varying vec2 vP; void main(){ vP = position.xy - vec2(0., ${EYE_Y.toFixed(1)}); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`,
      fragmentShader: /* glsl */`
        uniform vec3 uGlow; uniform float uGlowK; varying vec2 vP;
        void main(){
          vec2 q = abs(vP) - vec2(10., 8.5); float d = length(max(q, 0.)) + min(max(q.x, q.y), 0.);
          float g = d > 0. ? exp(-d / 3.0) * 0.5 : exp(d / 2.0);
          g *= 0.55 + 0.45 * smoothstep(-8.5, 8.5, vP.y);
          gl_FragColor = vec4(uGlow * g * 0.2 * uGlowK, 1.);
        }`,
    }));
    gm.renderOrder = 5; gm.name = 'hole-glow'; object.add(gm);
  }

  // ---- the sun shaft: slides in from the east end and comes to rest on the hole ----
  let shaftMesh = null;
  if (opts.shaftBeam !== false) {        // the shaft itself in the wet air: one camera-turned additive ribbon
    const sg = new THREE.BufferGeometry();
    sg.setAttribute('position', new THREE.BufferAttribute(new Float32Array([0, -1, 0, 1, -1, 0, 1, 1, 0, 0, 1, 0]), 3)); sg.setIndex([0, 1, 2, 0, 2, 3]);
    shaftMesh = new THREE.Mesh(sg, new THREE.ShaderMaterial({
      uniforms: { uShaft: U.uShaft, uShaftCol: U.uShaftCol, uTime: U.uTime }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
      vertexShader: /* glsl */`
        uniform vec4 uShaft; varying vec2 vS;
        void main(){
          vec3 dir = vec3(0.768, 0.530, 0.359);
          vec3 P = vec3(uShaft.x, uShaft.y, ${(HD + 0.6).toFixed(1)}) + dir * (position.x * 190. - 4.);
          vec3 Pv = (modelViewMatrix * vec4(P, 1.)).xyz, dv = (modelViewMatrix * vec4(dir, 0.)).xyz;
          vec3 sd = cross(dv, Pv); float l = length(sd); sd = l > 1e-4 ? sd / l : vec3(1., 0., 0.);
          Pv += sd * position.y * uShaft.z * (0.85 + 0.5 * position.x);
          vS = position.xy; gl_Position = projectionMatrix * vec4(Pv, 1.);
        }`,
      fragmentShader: /* glsl */`
        uniform vec4 uShaft; uniform vec3 uShaftCol; uniform float uTime; varying vec2 vS;
        float h1(float n){ return fract(sin(n * 127.1) * 43758.5453); }
        float n1(float x){ float i = floor(x), f = fract(x); f = f * f * (3. - 2. * f); return mix(h1(i), h1(i + 1.), f); }
        void main(){
          float ay = abs(vS.y), ac = (1. - smoothstep(.45, 1., ay)) * (.7 + .3 * (1. - ay));
          float al = smoothstep(0., 0.04, vS.x) * (1. - smoothstep(0.3, 1., vS.x));
          float st = 0.55 + 0.45 * n1(vS.y * 7. + uTime * 0.05);
          gl_FragColor = vec4(uShaftCol * ac * al * st * uShaft.w * 0.42, 1.);
        }`,
    }));
    shaftMesh.frustumCulled = false; shaftMesh.renderOrder = 4; shaftMesh.name = 'sun-shaft'; object.add(shaftMesh);
  }
  let progress = opts.progress ?? 1, shaftK = 1;
  const applyShaft = (breath) => {
    const p = Math.min(1, Math.max(0, progress)), e = p * p * (3 - 2 * p);
    U.uShaft.value.set(118 + (1.5 - 118) * e, 46 + (27.5 - 46) * e, 27 + (17 - 27) * e, Math.min(1, p / 0.12) * shaftK * breath);
  };
  applyShaft(1);

  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const anchors = {
    portalSeat: { position: V(0, EYE_Y, 2), facing: V(0, 0, 1), radius: 7 },
    flyThrough: [V(0, EYE_Y, 150), V(0, EYE_Y, 100), V(0, EYE_Y, 60), V(0, EYE_Y, 25), V(0, EYE_Y, HD), V(0, EYE_Y, 2)],
    eye: V(0, EYE_Y, HD), beamTopY: BEAM_TOP, twinBeamX: TWIN_X,
    holeMin: V(HOLE.x0, HOLE.y0, -HD), holeMax: V(HOLE.x1, HOLE.y1, HD),
    lintel: V(0, HOLE.y1, HD + 0.5), roofY: TOP + 0.3, groundY: GROUND_Y,
    shaftStart: V(118, 46, HD), shaftRest: V(1.5, 27.5, HD),
    pigeonRoof: V(0, TOP + 1.5, 3),
    platformRight: V(7.6, 24, 5), platformLeft: V(-8.2, 24, 5),
    viewpoints: { approach: V(0, EYE_Y, 150), threeQuarter: V(75, 42, 125), close: V(5, 27, 46) },
  };

  return {
    object, radius: 84, height: 70, center: V(0, 29, 0), anchors,
    ground: true, groundY: GROUND_Y,
    uniforms: U, beamMesh, shaftMesh,
    stats: { triangles: heroTris, cloths: nCloth }, kit,
    setProgress(p) { progress = p; },
    setGust(g) { U.uGust.value = Math.min(1, Math.max(0, g)); },
    setSky(hex) { U.uSky.value.set(hex); },
    setPlantLift(r, g, b) { U.uLift.value.setRGB(r, g, b); },       // skylight given back by leaves (share of their own colour), so shaded creeper stays green under a low sun

    setGlow(k) { glowU.uGlowK.value = k; },
    setShaftColor(hex, strength = 1) { U.uShaftCol.value.set(hex); shaftK = strength; },
    update(dt, time) {
      U.uTime.value = time;
      applyShaft(0.86 + 0.14 * Math.sin(time * 0.45));
    },
    dispose() {},
  };
}
