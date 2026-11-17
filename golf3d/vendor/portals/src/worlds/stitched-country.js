// THE STITCHED COUNTRY: an embroidered valley on stretched linen made of one crimson thread. A steeple-sized needle
// leaps through the cloth sewing the red road we follow; the flank hills unravel row by row into the strand overhead;
// a train of cotton reels rattles alongside on a zipper railway; beyond the unsewn edge the land stitches itself in
// behind the needle, which dives through a standing embroidery hoop (the exit).
//
// Everything is cloth or thread, shaded by this file's own ShaderMaterials in the hero's style (see the header of
// src/parts/stitched-country.js), so the realistic kit materials are not used and the world returns style: 'none'.
// Layout: the road runs toward -Z, d = -z is the distance along it, x = roadX(d). `sx` mirrors the whole country per seed.
import * as THREE from 'three';
import { makePath, clamp, lerp, smoothstep } from '../kit/core.js';
import { buildHero, GLSL_COMMON, OVERHEAD_GLSL, PITCH } from '../parts/stitched-country.js';

const TAU = Math.PI * 2;
const C = (h) => new THREE.Color(h);
const V3 = (x, y, z) => new THREE.Vector3(x, y, z);

// palette order: linen, cream, blue, green, gold, brown, crimson
const LOOKS = {
  afternoon: { pal: ['#E6DCC8', '#F7F2E6', '#7FA8B8', '#8DAA5B', '#D9A441', '#8A5A3C', '#C4283C'], sky: '#E4D9C3', glow: '#FFF4DC', sun: [1.0, 0.94, 0.84, 0.64], amb: [0.5, 0.49, 0.5], shade: [0.66, 0.62, 0.72],
    el: 40, az: 0.72, exposure: 1.0, fogD: 0.00050, lamp: 0, glowK: 0.25, moon: 0, precip: 0, flowers: ['#f3b6c4', '#F7F2E6', '#EBCB6A', '#E58CA4'], tint: '#fff8ee', sat: 1.1 },
  morning: { pal: ['#DEDDD2', '#F4F4EE', '#7BA6BC', '#86AC72', '#D4B25E', '#86604A', '#C4283C'], sky: '#D5DAD6', glow: '#F2F7F6', sun: [0.93, 0.96, 1.0, 0.66], amb: [0.46, 0.5, 0.56], shade: [0.56, 0.63, 0.78],
    el: 21, az: 1.0, exposure: 1.0, fogD: 0.00072, lamp: 0, glowK: 0.3, moon: 0, precip: 0, flowers: ['#F7F2E6', '#C9DCF0', '#F0E08A', '#f3b6c4'], tint: '#f2f8ff', sat: 1.04 },
  evening: { pal: ['#D9C6A6', '#F2E6CC', '#6E93A8', '#7E9A54', '#D9A441', '#7A4E34', '#C4283C'], sky: '#6F5A4E', glow: '#E8B678', sun: [1.0, 0.78, 0.56, 0.2], amb: [0.36, 0.3, 0.31], shade: [0.38, 0.32, 0.4],
    el: 30, az: 0.6, exposure: 1.12, fogD: 0.00062, lamp: 1, glowK: 3.2, moon: 1, precip: 0, flowers: ['#f3b6c4', '#F7F2E6', '#EBCB6A', '#E58CA4'], tint: '#ffe9cf', sat: 1.08 },
  spring: { pal: ['#E9E1CF', '#FBF5EE', '#86BACB', '#9CC76C', '#F0A6BC', '#8A5A3C', '#C4283C'], sky: '#E3DFCF', glow: '#FFF8EA', sun: [1.0, 0.97, 0.9, 0.64], amb: [0.5, 0.51, 0.5], shade: [0.64, 0.66, 0.74],
    el: 44, az: 0.5, exposure: 1.0, fogD: 0.00048, lamp: 0, glowK: 0.25, moon: 0, precip: 0, flowers: ['#F59CB8', '#FFFFFF', '#F7D9E4', '#F0E08A'], tint: '#fffaf4', sat: 1.12 },
  autumn: { pal: ['#E4D5BA', '#F5EAD6', '#7896A4', '#8F9B45', '#D9A23A', '#84482E', '#BA242F'], sky: '#E2CFAE', glow: '#FFE7BC', sun: [1.0, 0.9, 0.74, 0.68], amb: [0.5, 0.46, 0.44], shade: [0.62, 0.55, 0.62],
    el: 26, az: 0.85, exposure: 1.0, fogD: 0.00060, lamp: 0, glowK: 0.4, moon: 0, precip: 0, flowers: ['#E0913A', '#E9C46A', '#F5EAD6', '#F5EAD6'], tint: '#fff5e6', sat: 1.06 },
  winter: { pal: ['#EFEEE9', '#FCFCFA', '#BCD2E8', '#E3ECF2', '#F3D7DE', '#B9AFA8', '#C4283C'], sky: '#F0F0EC', glow: '#FFFFFF', sun: [1.0, 0.98, 0.95, 0.75], amb: [0.52, 0.55, 0.62], shade: [0.62, 0.68, 0.86],
    el: 28, az: 0.75, exposure: 1.1, fogD: 0.00045, fogK: 0.95, lamp: 0, glowK: 0.3, moon: 0, precip: 2, flowers: ['#FFFFFF', '#DCE8F4', '#F6DDE4', '#C4283C'], tint: '#f8fbff', sat: 1.06 },
};

// ---------- geometry helpers: every felt geometry carries position, normal, color and aFx (tint by iCol, glow, leg swing)
function paint(g, col, o = {}) {
  const aoK = o.aoK ?? 0.6;
  if (g.index) { const t = g.toNonIndexed(); g.dispose(); g = t; }
  const P = g.attributes.position, n = P.count, c = new Float32Array(n * 3), f = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const y = P.getY(i), k = o.ao ? aoK + (1 - aoK) * smoothstep(o.ao[0], o.ao[1], y) : 1;
    c[i * 3] = col.r * k; c[i * 3 + 1] = col.g * k; c[i * 3 + 2] = col.b * k;
    f[i * 3] = o.tint || 0; f[i * 3 + 1] = o.emis || 0; f[i * 3 + 2] = o.leg ? o.leg(P.getX(i), y, P.getZ(i)) : 0;
  }
  g.setAttribute('color', new THREE.BufferAttribute(c, 3)); g.setAttribute('aFx', new THREE.BufferAttribute(f, 3));
  if (g.attributes.uv) g.deleteAttribute('uv');
  return g;
}
function merge(list) {
  let n = 0; for (const g of list) n += g.attributes.position.count;
  const out = new THREE.BufferGeometry();
  for (const name of ['position', 'normal', 'color', 'aFx']) {
    const a = new Float32Array(n * 3); let o = 0;
    for (const g of list) { a.set(g.attributes[name].array, o); o += g.attributes[name].array.length; }
    out.setAttribute(name, new THREE.BufferAttribute(a, 3));
  }
  for (const g of list) g.dispose();
  return out;
}
const box = (w, h, d, x, y, z, ry = 0) => { const g = new THREE.BoxGeometry(w, h, d); if (ry) g.rotateY(ry); return g.translate(x, y, z); };
const ball = (r, x, y, z, sx = 1, sy = 1, sz = 1, det = 1) => new THREE.IcosahedronGeometry(r, det).scale(sx, sy, sz).translate(x, y, z);
const cyl = (r0, r1, h, x, y, z, seg = 8) => new THREE.CylinderGeometry(r0, r1, h, seg).translate(x, y + h / 2, z);
// soften an icosphere's facets (pom-poms are fuzzy, not faceted)
const puff = (g) => { const t = g.toNonIndexed(); g.dispose(); const P = t.attributes.position, N = t.attributes.normal; t.computeBoundingSphere(); const c = t.boundingSphere.center, v = new THREE.Vector3();
  for (let i = 0; i < P.count; i++) { v.fromBufferAttribute(P, i).sub(c).normalize(); N.setXYZ(i, v.x, v.y, v.z); } return t; };

// an InstancedMesh for the felt material: per-instance colour (iCol) and motion (iP: phase, sway per metre, hop, flag)
function inst(geo, mat, n, name) {
  const m = new THREE.InstancedMesh(geo, mat, n); m.name = name; m.frustumCulled = false;
  geo.setAttribute('iCol', new THREE.InstancedBufferAttribute(new Float32Array(n * 3).fill(1), 3));
  geo.setAttribute('iP', new THREE.InstancedBufferAttribute(new Float32Array(n * 4), 4));
  return m;
}
const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _p = new THREE.Vector3(), _s = new THREE.Vector3();
function put(m, i, x, y, z, yaw, sx, sy, sz, col, phase = 0, sway = 0, hop = 0, flag = 0, pitch = 0, roll = 0) {
  m.setMatrixAt(i, _m.compose(_p.set(x, y, z), _q.setFromEuler(_e.set(pitch, yaw, roll, 'YXZ')), _s.set(sx, sy, sz)));
  if (col) m.geometry.attributes.iCol.setXYZ(i, col.r, col.g, col.b);
  m.geometry.attributes.iP.setXYZW(i, phase, sway, hop, flag);
}

// ---------- shared GLSL: the hero's ripple + the road, the railway and the common cloth lighting
const ROAD_GLSL = /* glsl */`
  uniform vec4 uRoad; uniform vec4 uRoad2;      // a1, k1, p1, a2 | k2, p2, sx, river d
  float roadX(float d){ return uRoad.x * sin(d * uRoad.y + uRoad.z) + uRoad.w * sin(d * uRoad2.x + uRoad2.y); }
  float railLat(float d){ float k = smoothstep(1000., 1380., d); return uRoad2.z * (14. + 190. * k * k); }
  float riverD(float x){ return uRoad2.w + 46. * sin(x * 0.0058 + 1.1); }
  // the new land is sewn outward from the road: how many metres the stitching front trails at a lateral distance
  // the new land is sewn outward from each new red stitch: metres behind the spreading front (negative = not yet sewn)
  uniform float uSewD;                          // how far down the road the stitching front has got
  float sewAt(float d, float lat){ float al = abs(lat); return uSewD - d - 0.75 * min(al, 88.) - 0.45 * max(al - 88., 0.); }
  // felt-cloud shadows sliding over the country: x = shade, y = the blanket-stitched rim
  vec2 cloudSh(vec2 p, float t){
    vec2 q = p * 0.0036 + vec2(t * 0.021, 7. + t * 0.006);
    float n = vnoise(q) * 0.78 + vnoise(q * 2.3 + 11.) * 0.22;
    return vec2(smoothstep(0.575, 0.62, n), smoothstep(0.545, 0.56, n) * (1. - smoothstep(0.56, 0.575, n)));
  }`;
const LIGHT_GLSL = /* glsl */`
  uniform vec3 uSunDir, uSun, uAmb, uLampC; uniform vec4 uLampP; uniform float uTime, uGlow;
  vec3 lampAt(vec3 w){ vec2 q = w.xz - uLampP.xz; return uLampC * exp(-dot(q, q) / (uLampP.w * uLampP.w)); }
  vec3 feltLight(vec3 alb, vec3 N, vec3 V, vec3 w){
    float dif = smoothstep(-0.4, 0.9, dot(N, uSunDir)), rim = pow(1. - max(dot(N, V), 0.), 2.);
    vec3 lamp = lampAt(w);
    return alb * (uAmb * 1.1 + uSun * dif + lamp) + alb * rim * 0.35 * (uSun + lamp);
  }`;
const FOG_U = () => THREE.UniformsUtils.clone(THREE.UniformsLib.fog);

// ---------- felt: pom-poms, knots, tassels, cottages, sheep, reels, fish... one program for all of them
function makeFeltMaterial(U) {
  return new THREE.ShaderMaterial({
    fog: true, side: THREE.DoubleSide,
    uniforms: { ...FOG_U(), ...U },
    vertexShader: /* glsl */`
      ${GLSL_COMMON}
      ${ROAD_GLSL}
      attribute vec3 color, aFx, iCol; attribute vec4 iP;
      uniform float uTime, uFrontD, uEdgeD; uniform vec3 uTrainP;
      varying vec3 vN; varying vec3 vCol; varying vec3 vW; varying float vE; varying vec3 vLp; varying float vSh;
      #include <fog_pars_vertex>
      void main(){
        vec4 o = modelMatrix * instanceMatrix * vec4(0., 0., 0., 1.);
        vec3 lp = position;
        lp.z += sin(uTime * 2.6 + iP.x * 5. + (aFx.z > 0. ? 0. : 3.14159)) * abs(aFx.z);          // legs
        float dI = -o.z, latI = o.x - roadX(dI);
        float rev = (iP.w < 0. || dI < uEdgeD) ? 1. : smoothstep(0., 18., sewAt(dI, latI) - 34. + (fract(iP.x * 3.7) - .5) * 14.);   // sewn in behind the spreading front
        float pop = rev * (1. + 0.9 * sin(3.14159 * rev));
        vec3 wp = mat3(instanceMatrix) * lp * pop;
        float hgt = abs(position.y);
        float sw = sin(uTime * 1.7 + iP.x + o.x * 0.05) * iP.y;                                    // wind in wheat, wobble of pom-poms
        wp.x += sw * hgt; wp.z += sw * 0.6 * hgt * cos(iP.x);
        vec2 tq = o.xz - uTrainP.xz; float flt = max(iP.w, 0.) * exp(-dot(tq, tq) / 420.);         // wheat flattens as the train passes
        wp.x -= uRoad2.z * flt * hgt * 0.8; wp.y *= 1. - 0.6 * flt;
        float rp = ripple(o.xz);
        float hopT = abs(sin(uTime * (2.2 + fract(iP.x) * 1.4) + iP.x * 7.));
        vec3 base = o.xyz;
        base.xz += vec2(sin(uTime * 0.21 + iP.x * 3.), cos(uTime * 0.17 + iP.x * 5.)) * iP.z * 5.;  // bobbling about the field
        base.y += rp + hopT * iP.z * 0.9 + max(rp, 0.) * iP.z * 3.5;                                // and bouncing on the ripple ring
        vec4 w = vec4(base + wp, 1.);
        vN = normalize(mat3(instanceMatrix) * normal); vCol = color * mix(vec3(1.), iCol, aFx.x); vW = w.xyz; vE = aFx.y; vLp = position; vSh = cloudSh(o.xz, uTime).x;
        vec4 mvPosition = viewMatrix * w; gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      ${LIGHT_GLSL}
      uniform vec3 uShade;
      varying vec3 vN; varying vec3 vCol; varying vec3 vW; varying float vE; varying vec3 vLp; varying float vSh;
      #include <fog_pars_fragment>
      void main(){
        vec3 N = normalize(vN), V = normalize(cameraPosition - vW); if (!gl_FrontFacing) N = -N;
        float fib = 0.9 + 0.1 * sin(vW.y * 9. + vW.x * 7.);
        vec3 alb = vCol * fib;
        float kfw = fwidth(length(vLp.xz) * 16.);
        if (vE < -0.5) {                                                    // a French knot: thread wound round and round, sunk into the cloth at its foot
          float sp = sin(atan(vLp.z, vLp.x + 1e-5) + length(vLp.xz) * 16. + vLp.y * 6.);
          float sf = 1. - smoothstep(0.25, 0.8, kfw);
          alb *= mix(0.9, 0.66 + 0.4 * smoothstep(-0.5, 0.5, sp), sf) * (0.5 + 0.5 * smoothstep(0.02, 0.26, vLp.y));
        }
        vec3 col = feltLight(alb, N, V, vW);
        col = mix(col, alb * uShade * 0.92, vSh * 0.42);
        col += vCol * clamp(vE, 0., 1.) * uGlow;
        if (vE > 1.5) { float sp = pow(max(0., sin(uTime * 3.1 + vW.x * 1.3 + vW.z * 1.7 + vW.y * 2.)), 24.); col += vec3(1., 0.95, 0.85) * sp * 3.5 + vCol * 0.25; }
        gl_FragColor = vec4(col, 1.);
        #include <fog_fragment>
      }`,
  });
}

// ---------- the zipper railway: brass teeth and cloth tapes, splayed ahead of the slider and meshed shut behind it
function makeZipMaterial(U) {
  return new THREE.ShaderMaterial({
    fog: true,
    uniforms: { ...FOG_U(), ...U },
    vertexShader: /* glsl */`
      ${GLSL_COMMON}
      ${ROAD_GLSL}
      attribute vec3 color; attribute vec2 iZ;       // d along the rail, side
      uniform float uTrainD, uPinD;
      varying vec3 vN; varying vec3 vCol; varying vec3 vW;
      #include <fog_pars_vertex>
      void main(){
        float d = iZ.x, e = 2.;
        vec2 c = vec2(roadX(d) + railLat(d), -d), c2 = vec2(roadX(d + e) + railLat(d + e), -d - e);
        vec2 t = normalize(c2 - c), nrm = vec2(-t.y, t.x);
        float ahead = d - uTrainD, open = smoothstep(-1.5, 16., ahead);
        float snap = exp(-ahead * ahead / 30.) * 0.5;                              // each tooth kicks as the slider bites it
        float off = mix(0.22, 2.0, open);
        vec3 lp = position; lp.x += off; lp.y *= 1. + snap; lp.x *= iZ.y;
        float yaw = mix(0., 0.5, open) * iZ.y;                                     // splayed tapes toe outward
        vec2 r = vec2(lp.x * cos(yaw) - lp.z * sin(yaw), lp.x * sin(yaw) + lp.z * cos(yaw));
        vec2 xz = c + nrm * r.x + t * (r.y + (iZ.y > 0. ? 0. : 0.65) * (1. - open));
        float deck = 2.3 * smoothstep(uPinD - 34., uPinD - 22., d) * (1. - smoothstep(uPinD + 22., uPinD + 34., d));   // over the safety pin
        vec4 w = vec4(xz.x, lp.y + 0.12 + deck + ripple(c), xz.y, 1.);
        vN = normalize(vec3(normal.x * iZ.y, normal.y, normal.z)); vCol = color; vW = w.xyz;
        vec4 mvPosition = viewMatrix * w; gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      ${LIGHT_GLSL}
      varying vec3 vN; varying vec3 vCol; varying vec3 vW;
      #include <fog_pars_fragment>
      void main(){
        vec3 N = normalize(vN), V = normalize(cameraPosition - vW);
        vec3 col = feltLight(vCol, N, V, vW);
        float brass = step(0.9, vCol.r / max(vCol.b, 0.05) * 0.4);
        col += brass * uSun * pow(max(dot(reflect(-V, N), uSunDir), 0.), 12.) * 1.4;
        gl_FragColor = vec4(col, 1.);
        #include <fog_fragment>
      }`,
  });
}

// ---------- the valley floor: linen, satin patchwork fields, the ribbon river, pencil lines where nothing is sewn
function makeGroundMaterial(U) {
  return new THREE.ShaderMaterial({
    fog: true,
    uniforms: { ...FOG_U(), ...U },
    vertexShader: /* glsl */`
      ${GLSL_COMMON}
      varying vec3 vW; varying vec3 vN; varying float vRip;
      #include <fog_pars_vertex>
      void main(){
        vec4 w = modelMatrix * vec4(position, 1.);
        float h = ripple(w.xz), e = 3.;
        float hx = ripple(w.xz + vec2(e, 0.)), hz = ripple(w.xz + vec2(0., e));
        w.y += h; vRip = h;
        vN = normalize(normalize(normal) + vec3(h - hx, 0., h - hz) / e);
        vW = w.xyz;
        vec4 mvPosition = viewMatrix * w; gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      #define CELL 118.
      #define ROWW 2.2
      ${GLSL_COMMON}
      ${ROAD_GLSL}
      ${LIGHT_GLSL}
      uniform float uNeedleD, uFrontD, uEdgeD, uBareD;
      uniform vec3 uShade, uLinen, uPencil, uCrimson, uRiverC, uGold, uNe0, uNe1;
      uniform vec3 uPal[6]; uniform vec4 uSt[6]; uniform float uStW[6];
      varying vec3 vW; varying vec3 vN; varying float vRip;
      #include <fog_pars_fragment>
      ${OVERHEAD_GLSL}
      float segShadow(vec2 p){                    // soft shadow of the needle on the cloth
        vec3 a = uNe0, b = uNe1; if (a.y < vW.y && b.y < vW.y) return 0.;
        float sy = max(uSunDir.y, 0.15);
        vec2 sa = a.xz - uSunDir.xz * (a.y - vW.y) / sy, sb = b.xz - uSunDir.xz * (b.y - vW.y) / sy;
        vec2 ab = sb - sa; float t = clamp(dot(p - sa, ab) / max(dot(ab, ab), 1e-3), 0., 1.);
        float hgt = mix(a.y, b.y, t) - vW.y; if (hgt < 0.) return 0.;
        float soft = 1.2 + hgt * 0.07, d = length(p - (sa + ab * t));
        return (1. - smoothstep(2.6 - soft * .3, 2.6 + soft * 1.3, d)) * (1. / (1. + hgt * 0.012));
      }
      void main(){
        vec2 p = vW.xz; vec3 N = normalize(vN);
        vec3 V = normalize(cameraPosition - vW);
        float d = -p.y, lat = p.x - roadX(d);
        vec2 fwp = fwidth(p); float px = max(fwp.x, fwp.y);                 // metres per pixel
        // ---- linen: over-under weave near, slubby streaks far
        vec2 uv = p / 0.3; float wf = 1. - smoothstep(0.2, 0.7, px / 0.3);
        float chk = mod(floor(uv.x) + floor(uv.y), 2.);
        float warpT = abs(sin(3.14159 * uv.x)), weftT = abs(sin(3.14159 * uv.y));
        float weave = mix(warpT * (0.75 + 0.25 * weftT), weftT * (0.75 + 0.25 * warpT), chk);
        float slub = vnoise(vec2(p.x * 0.9, p.y * 0.035)) * 0.5 + vnoise(vec2(p.x * 0.03, p.y * 1.1)) * 0.5;
        float mott = vnoise(p * 0.021) * 0.6 + vnoise(p * 0.11) * 0.4;
        vec3 linen = uLinen * (0.9 + 0.1 * slub) * (0.93 + 0.1 * mott);
        linen *= mix(1., 0.7 + 0.42 * weave, wf);
        N = normalize(N + vec3(vnoise(p * 0.06) - .5, 0., vnoise(p * 0.06 + 31.7) - .5) * 0.22);
        vec2 wg = vec2(cos(3.14159 * uv.x) * sign(sin(3.14159 * uv.x)), cos(3.14159 * uv.y) * sign(sin(3.14159 * uv.y)));
        N = normalize(N - vec3(wg.x * (1. - chk), 0., wg.y * chk) * 0.45 * wf);
        // ---- the patchwork: jittered Voronoi fields, each with its own stitch direction
        vec2 gp = p / CELL, gi = floor(gp), gf = fract(gp); float b1 = 9., b2 = 9.; vec2 bc = vec2(0.), bid = vec2(0.);
        for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) { vec2 o = vec2(float(x), float(y)), id = gi + o;
          vec2 c = o + 0.14 + 0.72 * vec2(hash21(id), hash21(id + 17.3)); float dd = length(c - gf);
          if (dd < b1) { b2 = b1; b1 = dd; bc = c; bid = id; } else if (dd < b2) b2 = dd; }
        float fe = (b2 - b1) * CELL * 0.5;                                   // metres-ish to the field border
        vec2 cc = (gi + bc) * CELL; float h1 = hash21(bid + 5.7), h2 = hash21(bid + 11.1);
        float ang = h1 * 3.14159; vec2 dir = vec2(cos(ang), sin(ang)), prp = vec2(-dir.y, dir.x), q = p - cc;
        float u = dot(q, dir), v = dot(q, prp), Rf = CELL * 0.85, rows = floor(2. * Rf / ROWW);
        float ri = clamp(floor((Rf - v) / ROWW), 0., rows - 1.);
        float dc = -cc.y, clat = cc.x - roadX(dc);
        float unsewn = step(uEdgeD, dc);
        float rj = hash21(vec2(ri * 1.7, h1 * 91.));
        float fwv = px / ROWW, rf = 1. - smoothstep(0.15, 0.6, fwv);
        // metres behind the stitching front. Every row ends on a whole stitch (1.1 m), a few stitches before or after its
        // neighbours, so the front is a crisp comb of row ends near the lens and one clean line once rows are too fine to see
        vec2 ps = mix(p, cc + dir * (floor(u / 1.1) * 1.1 + 0.55) + prp * (Rf - (ri + .5) * ROWW), rf);
        float dS = -ps.y;
        float fr = sewAt(dS, ps.x - roadX(dS)) + (rj - .5) * 5. * rf + (h2 - .5) * 26. + (vnoise(ps * 0.02 + 3.) - .5) * 10.;
        float bareE = uBareD - max(abs(lat) - 28., 0.) * 1.0 + (rj - .5) * 26. + (vnoise(p * 0.035) - .5) * 30.; // where the unpicking has got to: every row ends at its own place
        fr -= mix(22., mod(ri, 2.) * 44., rf);                                  // sewn in two passes: every other row first, the rows between them 44 m behind
        float st = unsewn < .5 ? smoothstep(-0.5, 0.5, d - bareE) : smoothstep(-mix(24., 0.4, rf), mix(24., 0.4, rf), fr);
        float fresh = unsewn * st * (1. - smoothstep(0.5, 5., fr));                                            // thread just laid shines
        float blush = unsewn * st * (1. - smoothstep(3., 16., fr));                                            // and is still the crimson of the strand it came from
        float bz = 1. - smoothstep(uBareD + 30., uBareD + 110., d);                                            // the unpicked cloth behind the country
        // the bare corridor: road and railway, and only the road where no railway runs (before its first tooth, and up the last stitch)
        float ck = max(smoothstep(1040., 1150., d), 1. - smoothstep(150., 200., d));
        float ce = abs(lat - 6. * uRoad2.z * (1. - ck)) - mix(14.5, 7.5, ck), corr = smoothstep(0., 2., ce);   // ce: metres outside the corridor's edge
        // the new land under the needle: a strip of thread still hot from the strand lies along both edges of the road cloth,
        // from the needle's point back 130 m, widening as it trails and cooling to crimson at its rim
        float bk = uNeedleD - d, hw = 7. + 0.13 * clamp(bk, 0., 135.);
        float hk = unsewn * st * smoothstep(-25., 5., bk) * (1. - smoothstep(55., 135., bk));
        float hot = hk * (1. - smoothstep(hw * 0.5, hw, ce));
        blush = max(blush, hk * (1. - smoothstep(hw, hw * 1.7, ce)) * 1.2);
        st *= corr;
        // bare cloth under the design: needle holes along each row, blue pencil outlines, the pencilled road
        float rv = fract((Rf - v) / ROWW), ru = fract(u / 1.1);
        float dots = (1. - smoothstep(0.05, 0.16, length(vec2(rv - .5, (ru - .5) * 0.5)))) * (1. - smoothstep(0.1, 0.4, fwv));
        vec3 bare = linen * (1. - 0.45 * dots * corr);
        float dash = step(0.35, fract((p.x + p.y) * 0.11));
        float pk = max(unsewn, bz);                                                                            // the drawn design ahead, its unpicked ghost behind
        float pwT = 0.2 + min(px, 1.6) * mix(1.3, mix(1.9, 1.5, bz), pk), pw = max(pwT, px * 0.8);                 // a pencil line is never wider than a pencil: far off it stays one pixel and only gets fainter
        float pencil = (1. - smoothstep(pw, pw + mix(0.9, 0.4, bz), fe)) * mix(dash, 1., unsewn) * mix(0.6, 1., pk) * corr * (0.35 + 0.65 * pwT / pw);
        pencil = max(pencil, (1. - smoothstep(pw * 0.5, pw * 0.5 + 0.5, abs(lat))) * step(0.4, fract(d * 0.09)) * step(uNeedleD + 8., d) * 0.9);
        { // pencilled trees waiting to be sewn: a ring on a stalk, one to a 34 m square
          vec2 tg = p / 34., ti = floor(tg); vec2 tc = (ti + 0.25 + 0.5 * vec2(hash21(ti + 2.9), hash21(ti + 8.1))) * 34.;
          float tr = 3. + 2. * hash21(ti + 4.4), dd = length(p - tc), tw = 0.2 + px * 1.6;
          float ring = 1. - smoothstep(tw, tw + 0.5, abs(dd - tr));
          ring = max(ring, (1. - smoothstep(tw, tw + 0.5, abs(p.x - tc.x))) * step(abs(p.y - tc.y - tr - 2.5), 2.5));
          float gate = max(unsewn, bz) * corr * step(0.4, hash21(ti + 6.6));
          pencil = max(pencil, ring * gate * 0.95 * (1. - smoothstep(1.4, 3.6, px)));
          bare = mix(bare, uPal[0], (1. - smoothstep(tr - 1.2, tr, dd)) * gate * 0.12);          // a wash of colour inside each pencilled tree
        }
        pencil = max(pencil, (1. - smoothstep(pw * 0.4, pw * 0.4 + 0.4, abs(abs(fract(v / 11.) - .5) - .25) * 11.)) * mix(0.16, 0.42, max(bz, unsewn * 0.6)) * corr * (1. - smoothstep(0.4, 1.8, px)));
        bare = mix(bare, uPencil * mix(1., 0.9, pk), pencil * (1. - 0.4 * smoothstep(3.6, 11., px)));              // far lines stay pencil-thin and faint, never slabs
        // satin: one colour per field, each row a slightly different dye lot, floss stripes along the stitch
        float wave = sin(dot(p, vec2(0.05, 0.031)) - uTime * 0.9) * 0.5 + 0.5;       // sheen wave, like wind over a crop
        vec3 fc = uPal[int(min(h2 * 6., 5.))]; float rh = hash21(vec2(ri, h2 * 7.1 + cc.x));
        fc *= 0.8 + 0.34 * rh; fc *= 0.9 + 0.2 * wave;
        float rowB = 0.5 + 0.5 * cos(6.2832 * rv);
        fc *= mix(1., 0.72 + 0.36 * rowB, rf);
        fc *= 0.94 + 0.06 * vnoise(vec2(u * 0.5, v * 6.));
        vec3 T = vec3(dir.x, 0., dir.y); T = normalize(T - N * dot(T, N));
        vec3 Hh = normalize(uSunDir + V); float th = dot(normalize(T + N * (wave - .5) * 0.5), Hh);
        float sth = sqrt(max(1. - th * th, 0.)), kk = 0.25 + 0.75 * mix(pow(sth, 70.), pow(sth, 4.), 0.5);   // the tight highlight alone left satin dull and muddy right under the lens
        float hedge = (1. - smoothstep(1.0, 2.4 + px, fe + sin(u * 2.2) * 0.5));
        vec3 hedgeCol = uPal[1] * vec3(0.4, 0.55, 0.36) + uLinen * 0.08;
        vec3 sat = mix(fc, hedgeCol, hedge * 0.85);
        sat = mix(sat, uCrimson * (0.85 + 0.35 * rowB), min(blush * 0.6, 0.9));
        sat = mix(sat, sat * 1.2 + vec3(0.08, 0.06, 0.04), fresh);
        sat = mix(sat, vec3(1.32, 0.46, 0.09) * (0.74 + 0.4 * rowB), hot * 0.92);
        { // the corridor's cloth is hemmed where the fields end: the shade of the raised satin on the linen, a blanket stitch of
          // brown thread (a line and its teeth) and, a metre and a half inside it, a gold running stitch
          float in1 = -ce, lf = 1. - smoothstep(0.25, 1.1, px);
          bare *= 1. - 0.2 * (1. - smoothstep(0., 2.6, in1)) * (1. - corr);
          float hemL = 1. - smoothstep(0.1, 0.2 + px, abs(in1 - 1.0));
          float tooth = (1. - smoothstep(0.1, 0.2 + px, abs(fract(d / 1.5) - .5) * 1.5)) * step(-0.2, in1) * step(in1, 1.0);
          float run = (1. - smoothstep(0.11, 0.2 + px, abs(in1 - 2.5))) * step(0.42, fract(d / 2.4));
          bare = mix(bare, mix(uCrimson, uGold, 0.4) * 0.6, max(hemL, tooth) * 0.85 * lf);
          bare = mix(bare, uGold * 0.95, run * 0.9 * lf);
          // between the road's stitch and the railway, where both run: a row of cross stitches, crimson and gold by turns
          float xd = d / 2.6; vec2 xq = vec2(lat * uRoad2.z - 7., (fract(xd) - .5) * 2.6);
          float arm = min(abs(xq.x - xq.y), abs(xq.x + xq.y)) * 0.7071;
          float xst = (1. - smoothstep(0.1, 0.18 + px, arm)) * step(max(abs(xq.x), abs(xq.y)), 0.62);
          bare = mix(bare, mix(uCrimson, uGold, mod(floor(xd), 2.)) * 0.85, xst * 0.8 * lf * (1. - ck));
        }
        vec3 alb = mix(bare, sat, st);
        float spec = st * (1. - hedge) * kk * (0.1 + 0.3 * wave) + fresh * 0.22; vec3 specCol = mix(vec3(1.), fc, 0.7) * 1.2;
        N = normalize(N + vec3(prp.x, 0., prp.y) * (rv - .5) * 0.5 * rf * st);
        // ---- the ribbon river: blue satin flowing across the valley, gold running stitch down both selvedges
        float rd = abs(d - riverD(p.x));
        float rm = 1. - smoothstep(19.2, 20. + px, rd);
        if (rm > 0.) {
          float flow = sin(p.x * 0.21 - uTime * 1.6 + sin(rd * 0.5 + p.x * 0.05) * 1.5) * 0.5 + 0.5;
          float ribs = 0.5 + 0.5 * cos(rd * 6.2832 / 1.3); float rbf = 1. - smoothstep(0.2, 0.7, px / 1.3);
          vec3 rc = uRiverC * (0.74 + 0.36 * flow) * mix(1., 0.8 + 0.3 * ribs, rbf);
          float sel = (1. - smoothstep(0.35, 0.6, abs(rd - 17.6))) * step(0.4, fract(p.x * 0.3));
          rc = mix(rc, uGold, sel * 0.9);
          float glint = pow(flow, 6.) * (0.5 + 0.5 * vnoise(vec2(p.x * 0.4 - uTime * 2., rd)));
          alb = mix(alb, rc, rm); spec = mix(spec, glint * 0.5, rm); specCol = mix(specCol, vec3(1.), rm);
          N = normalize(mix(N, vec3(0., 1., 0.) + vec3(0.25 * (flow - .5), 0., 0.), rm));
        }
        // ---- light: broad soft window key, coloured shade, cloud-applique shadows, pucker where the needle has pierced
        float nl = dot(N, uSunDir); float dif = smoothstep(-0.2, 1.0, nl) * 1.16;                                    // a decided key: slopes toward the window glow, slopes away go lavender
        float sh = segShadow(p) * 0.72;
        float puck = clamp(-vRip * 0.16, 0., 0.5);
        float st2 = 0.;
        for (int i = 0; i < 6; i++) { vec4 sg = uSt[i]; if (uStW[i] <= 0.) continue; vec2 ab = sg.zw - sg.xy, pq = p + uSunDir.xz * 0.9 - sg.xy;
          float t = clamp(dot(pq, ab) / max(dot(ab, ab), 1e-3), 0., 1.); st2 = max(st2, (1. - smoothstep(0.4, 3.2, length(pq - ab * t))) * uStW[i]); }
        sh = max(sh, st2 * 0.5);
        sh = max(sh, overheadShadow(p, vW.y) * 0.8);                                                                                    // the knot overhead, the strand down to the needle, the strands the hills feed it
        vec2 cs = cloudSh(p, uTime);
        alb = mix(alb, alb * uShade * 0.7, cs.y * step(0.45, fract((p.x - p.y) * 0.1)) * 0.6 * (1. - smoothstep(1.5, 6., px)));       // the blanket stitch round each cloud shadow
        vec3 lamp = lampAt(vW);
        vec3 light = uShade * (0.44 + 0.2 * N.y) + uSun * dif * (1. - sh) + lamp * (0.6 + 0.4 * dif);
        light = max(light, (uShade * 0.95 + uSun * 0.2) * 0.74 * (1. - 0.45 * sh));                                                       // satin never shades to mud: the shade is lavender
        light = mix(light, uShade * 0.82 + uSun * 0.06, cs.x * 0.5);                                                                     // under a felt cloud
        light = mix(light, uShade * 0.45, puck);
        float fres = pow(1. - max(dot(N, V), 0.), 3.);
        vec3 col = alb * light + alb * fres * 0.12 * uSun + specCol * spec * (uSun + lamp) * (1. - sh);
        gl_FragColor = vec4(col, 1.);
        #include <fog_fragment>
      }`,
  });
}

// ---------- the sky: a dome of back-lit linen with felt cloud appliques and a mother-of-pearl button for a sun
function makeSkyMaterial(U) {
  return new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, depthTest: false, fog: false,
    uniforms: U,
    vertexShader: /* glsl */`
      varying vec3 vDir;
      void main(){ vDir = position; vec4 p = projectionMatrix * viewMatrix * vec4(cameraPosition + position, 1.); gl_Position = p; }`,
    fragmentShader: /* glsl */`
      uniform vec3 uSkyC, uSkyLow, uSkyTop, uGlowC, uFogC, uSunDir, uButton, uGold, uCloudC, uStitchC; uniform float uTime, uMoon; uniform vec4 uCl[9];
      varying vec3 vDir;
      float h11(float x){ return fract(sin(x * 127.1) * 43758.5453); }
      float hash21(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
      float vnoise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
        return mix(mix(hash21(i), hash21(i + vec2(1., 0.)), f.x), mix(hash21(i + vec2(0., 1.)), hash21(i + vec2(1., 1.)), f.x), f.y); }
      float cloudSD(vec2 q, float seed, out vec2 nearC){
        float d = 9.; nearC = vec2(0.);
        for (int k = 0; k < 4; k++) { float fk = float(k); vec2 c = vec2((fk - 1.5) * 0.52 + (h11(seed + fk) - .5) * 0.2, (h11(seed + fk * 3.7) - .5) * 0.3 + (fk == 1. || fk == 2. ? 0.14 : 0.));
          float r = 0.34 + 0.2 * h11(seed + fk * 9.1) + (fk == 1. || fk == 2. ? 0.1 : 0.); float dk = length((q - c) * vec2(1., 1.25)) - r; if (dk < d) { d = dk; nearC = c; } }
        return max(d, -(q.y + 0.34) * 1.2);      // flat felt base
      }
      void main(){
        vec3 r = normalize(vDir);
        float az = atan(r.x, -r.z), el = asin(clamp(r.y, -1., 1.));
        float su = dot(r, uSunDir);
        // the sky cloth is warm where it meets the land and cooler overhead
        vec3 col = mix(uSkyLow, uSkyTop, smoothstep(0.0, 0.5, r.y) * 0.75 + smoothstep(0.3, 0.95, r.y) * 0.25);
        col += uGlowC * (0.2 * pow(max(su * 0.5 + 0.5, 0.), 6.) + 0.05 * exp(-el * el * 14.));       // cloth held up to a window
        // the weave of the sky cloth and its slubs
        vec2 wuv = vec2(az, el) * 95.; vec2 fwv = fwidth(wuv); float wf = (1. - smoothstep(0.25, 0.8, max(fwv.x, fwv.y))) * step(max(fwv.x, fwv.y), 5.);
        float weave = abs(sin(3.14159 * wuv.x)) * 0.5 + abs(sin(3.14159 * wuv.y)) * 0.5;
        col *= mix(1., 0.9 + 0.14 * weave, wf);
        { // the coarse weave over it: warp and weft a hand apart, each thread round where it passes over, sunk where it passes under
          vec2 cw = vec2(az, el) * 52., cfw = fwidth(cw), ci = floor(cw), cf = fract(cw); float cwf = 1. - smoothstep(0.2, 0.7, min(max(cfw.x, cfw.y), 5.));
          float over = mod(ci.x + ci.y, 2.), warp = sin(3.14159 * cf.x), weft = sin(3.14159 * cf.y);
          float th = mix(warp * (0.55 + 0.45 * weft), weft * (0.55 + 0.45 * warp), over);
          float slub = smoothstep(0.8, 0.97, vnoise(vec2(az * 2.2, ci.y * 7.3))) * weft;                     // here and there a thicker weft thread
          col *= mix(1., 0.91 + 0.12 * th + 0.05 * slub, cwf);
        }
        col *= 0.96 + 0.05 * vnoise(vec2(az * 60., el * 3.)) + 0.035 * vnoise(vec2(az * 2.5, el * 90.));
        // quilted felt clouds, blanket-stitched on, sliding slowly over the cloth
        float cd = 9., cs = 9., ca = 0., csz = 1.; vec2 cq = vec2(0.);
        for (int i = 0; i < 9; i++) {
          vec4 c = uCl[i]; if (c.z <= 0.) continue;
          float a = az - c.x - uTime * 0.0035 * (0.6 + 0.8 * h11(c.w)); a = mod(a + 3.14159, 6.28318) - 3.14159;
          vec2 q = vec2(a * cos(c.y), el - c.y) / c.z; if (dot(q, q) > 6.) continue;
          vec2 nr, nr2; float dk = cloudSD(q, c.w, nr), ds = cloudSD(q + vec2(-0.05, 0.11), c.w, nr2);
          if (dk < cd) { cd = dk; cq = q; ca = atan(q.y - nr.y, q.x - nr.x); csz = c.z; }
          cs = min(cs, ds);
        }
        float aa = min(fwidth(cd), 0.04) + 1e-4;
        float cm = 1. - smoothstep(-aa, aa, cd);
        col *= 1. - 0.3 * (1. - smoothstep(-0.02, 0.1, cs)) * (1. - cm);                               // the shadow a raised applique casts on the cloth
        vec2 dq = vec2(cq.x + cq.y, cq.x - cq.y) * 3.2; vec2 df = abs(fract(dq) - .5);
        float quilt = smoothstep(0.0, 0.16, min(df.x, df.y));                                         // pinched quilting lines, puffed between
        float pfy = 0.86 + 0.14 * quilt * (0.7 + 0.3 * (1. - 2. * max(df.x, df.y)));
        vec3 felt = uCloudC * pfy * (0.9 + 0.12 * smoothstep(0.2, -0.5, cd)) * (0.97 + 0.05 * vnoise(cq * 40.));
        felt *= 0.9 + 0.14 * smoothstep(-0.4, 0.5, cq.y);
        float edge = smoothstep(-0.105, -0.085, cd) * (1. - smoothstep(-0.075, -0.055, cd));           // blanket stitch: a line and its teeth
        float teeth = smoothstep(-0.085, -0.075, cd) * step(0.72, fract(ca * 7.));
        felt = mix(felt, uStitchC, clamp(edge + teeth, 0., 1.) * 0.8 * (1. - smoothstep(0.012, 0.03, aa)));
        col = mix(col, felt, cm);
        // the button: mother-of-pearl, four holes, sewn on with gold thread, a little loose
        if (su > 0.9) {
          vec3 rt = normalize(cross(vec3(0., 1., 0.), uSunDir)), up = cross(uSunDir, rt);
          vec2 b = vec2(dot(r, rt), dot(r, up)) / 0.0785; float rock = 0.2 * sin(uTime * 0.8) + 0.07 * sin(uTime * 2.1);
          b = vec2(b.x * cos(rock) - b.y * sin(rock), b.x * sin(rock) + b.y * cos(rock));
          float rr = length(b), ba = fwidth(rr) + 1e-4;
          float disc = 1. - smoothstep(1. - ba, 1. + ba, rr);
          float ang = atan(b.y, b.x);
          float sw = 0.5 + 0.5 * sin(ang * 2. + rr * 6. + vnoise(b * 2.5) * 2.5);
          vec3 pearl = uButton * mix(vec3(0.965, 0.79, 0.84), vec3(0.81, 0.914, 0.84), sw);                    // pink '#F6C9D6' to green '#CFE9D6'
          pearl *= 0.9 + 0.1 * sin(ang * 5. + rr * 9. + 2.);
          float rim = smoothstep(0.74, 0.82, rr) * (1. - smoothstep(0.93, 1., rr));
          float dish = 1. - smoothstep(0.58, 0.72, rr);
          pearl *= 1. - 0.16 * dish + 0.12 * dish * smoothstep(-0.6, 0.6, b.y - b.x);
          pearl *= 1. - 0.22 * smoothstep(0.66, 0.72, rr) * (1. - smoothstep(0.72, 0.78, rr));                 // the groove inside the rim
          float cres = smoothstep(0.84, 0.9, rr) * (1. - smoothstep(0.92, 0.98, rr)) * smoothstep(0.2, 0.9, dot(normalize(b + 1e-4), vec2(-0.6, 0.8)));
          pearl += uButton * (0.14 * rim + 0.9 * cres);
          vec2 hb = abs(b) - 0.27; float hole = 1. - smoothstep(0.125 - ba, 0.125 + ba, length(hb));
          float th = min(abs(b.x - b.y), abs(b.x + b.y)) * 0.7071;
          float thread = (1. - smoothstep(0.045, 0.045 + ba * 1.5, th)) * step(max(abs(b.x), abs(b.y)), 0.29);
          pearl = mix(pearl, uStitchC * 0.32, hole);
          pearl = mix(pearl, uGold * (0.85 + 0.3 * fract(th * 60.)), thread);
          col = mix(col * (1. - 0.16 * (1. - smoothstep(1., 1.25, length(b + vec2(-0.05, 0.1))))), pearl, disc);
          col += uGlowC * 0.16 * exp(-rr * rr * 0.12) * (1. - disc);
        }
        col = mix(uFogC, col, smoothstep(-0.02, 0.07, r.y));
        gl_FragColor = vec4(col, 1.);
      }`,
  });
}

// ---------- satin-stitch clouds: each a flat piece of padded embroidery standing in the air, five round pads worked side by
// side on one straight base, every pad filled with long stitches laid in its own direction, the whole outlined in stem stitch
function makeSatinCloudMaterial(U) {
  return new THREE.ShaderMaterial({
    fog: true, side: THREE.DoubleSide, transparent: true,
    uniforms: { ...FOG_U(), ...U },
    vertexShader: /* glsl */`
      attribute float aSeed; uniform float uTime;
      varying vec2 vQ; varying float vSeed; varying vec3 vRt; varying vec3 vFw;
      #include <fog_pars_vertex>
      void main(){
        vQ = position.xy; vSeed = aSeed;
        vRt = normalize(mat3(instanceMatrix) * vec3(1., 0., 0.)); vFw = normalize(mat3(instanceMatrix) * vec3(0., 0., 1.));
        vec4 w = modelMatrix * instanceMatrix * vec4(position, 1.);
        w.y += sin(uTime * 0.13 + aSeed) * 1.5;                                  // a slow breathing up and down, the same at any hour
        vec4 mvPosition = viewMatrix * w; gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uCloudC, uShade, uSun, uStitchC, uSunDir;
      varying vec2 vQ; varying float vSeed; varying vec3 vRt; varying vec3 vFw;
      #include <fog_pars_fragment>
      float h11(float x){ return fract(sin(x * 127.1) * 43758.5453); }
      void main(){
        vec2 q = vQ; float d1 = 9., d2 = 9., ri = 1., fi = 0.; vec2 ci = vec2(0.);
        for (int k = 0; k < 5; k++) { float fk = float(k), mid = 1. - abs(fk - 2.) * 0.5;
          float r = 0.25 + 0.13 * h11(vSeed + fk * 9.1) + 0.17 * mid;
          vec2 c = vec2((fk - 2.) * 0.42 + (h11(vSeed + fk) - .5) * 0.14, r * 0.62 - 0.3 + 0.1 * h11(vSeed + fk * 3.7) * mid);
          float dk = length(q - c) - r; if (dk < d1) { d2 = d1; d1 = dk; ri = r; ci = c; fi = fk; } else if (dk < d2) d2 = dk; }
        float d = max(d1, -(q.y + 0.3));                                          // the straight base
        float aa = clamp(fwidth(d), 1e-4, 0.05), a = 1. - smoothstep(-aa, aa, d);
        if (a < 0.02) discard;
        // the pad: a low dome, lit from the window's side
        vec2 e = (q - ci) / ri; float z = sqrt(clamp(1. - dot(e, e), 0., 1.));
        vec3 n = normalize(vec3(e * 0.9, z + 0.35)), N = normalize(n.x * vRt + n.y * vec3(0., 1., 0.) + n.z * vFw);
        vec3 Lc = normalize(uSunDir + vec3(0., 0.7, 0.) + vFw * 0.9);
        float dif = smoothstep(-0.25, 0.95, dot(N, Lc));
        // long stitches side by side, each pad's laid in a direction of its own
        float ph = (h11(vSeed + fi * 5.3) - .5) * 1.5 + (mod(fi, 2.) - .5) * 0.7; vec2 t = vec2(sin(ph), cos(ph)), pr = vec2(t.y, -t.x);
        float s = dot(q - ci, pr) * 15., sf = 1. - smoothstep(0.25, 0.75, fwidth(s));
        float ridge = abs(sin(3.14159 * s)), lot = 0.93 + 0.1 * h11(floor(s) + vSeed + fi * 17.);
        float sheen = pow(clamp(1. - abs(dot(n.xy, t) - 0.3) * 1.5, 0., 1.), 3.) * (0.5 + 0.5 * z);
        vec3 col = uCloudC * mix(uShade * 0.86, vec3(1.02), dif) * mix(1., (0.82 + 0.2 * ridge) * lot, sf);
        col += uSun * 0.14 * sheen;
        col *= 1. - 0.3 * (1. - smoothstep(0., 0.05, d2 - d1));                    // the crease where two pads meet
        col *= 0.8 + 0.2 * smoothstep(-0.3, 0.02, q.y);                           // the underside, in its own shade
        // the outline: a stem stitch a little inside the edge, each stitch slanting over the last
        float arc = atan(e.y, e.x) * ri * 24. + q.x * 9.;
        float rope = smoothstep(-0.075, -0.06, d) * (1. - smoothstep(-0.03, -0.015, d)) * step(0.22, fract(arc - d * 30.));
        col = mix(col, uStitchC * 0.9, rope * 0.75 * (1. - smoothstep(0.01, 0.03, aa)));
        gl_FragColor = vec4(col, a);
        #include <fog_fragment>
      }`,
  });
}

// ---------- cross-stitch mountains: a ring of 600 m ranges drawn as one X per 26 m cell, one thread colour per X
function makeMountainMaterial(U) {
  return new THREE.ShaderMaterial({
    side: THREE.BackSide, fog: false, transparent: false,
    uniforms: U,
    vertexShader: /* glsl */`
      varying vec3 vL;
      void main(){ vL = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`,
    fragmentShader: /* glsl */`
      uniform vec3 uFogC, uM0, uM1, uM2, uM3, uMc, uMg; uniform float uMSeed, uHaze;
      varying vec3 vL;
      float hash21(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
      float ridge(float a){ return 0.5 + 0.2 * sin(a * 3. + uMSeed) + 0.15 * sin(a * 7. + 1.7 * uMSeed) + 0.09 * sin(a * 17. + uMSeed * 3.) + 0.05 * sin(a * 41. + uMSeed); }
      void main(){
        float R = length(vL.xz), a = atan(vL.z, vL.x), cell = 6.28318 / 470.;      // 470 cells round the ring, about 40 m each, so the X of every stitch reads
        vec2 uv = vec2(a / cell, vL.y / (R * cell)); vec2 id = floor(uv), f = fract(uv) - .5;
        float aaw = fwidth(uv.y) * 1.2;
        float top = ridge((id.x + .5) * cell) * 660. / (R * cell);
        if (id.y + .5 > top) discard;
        float hn = (id.y + .5) / max(top, 1.), hj = hash21(id);
        vec3 tc = hn > 0.74 + 0.1 * hj ? uM3 : (hn > 0.42 + 0.14 * hj ? uM2 : (hn > 0.16 + 0.1 * hj ? uM1 : uM0));
        tc *= 0.85 + 0.3 * hash21(id + 3.3);
        tc = max(mix(vec3(dot(tc, vec3(0.3, 0.55, 0.15))), tc, 1.35), 0.);
        // sampler motifs: a border row of gold with crimson along the ridge, a gold zigzag across the middle
        float zig = abs(mod(id.x, 8.) - 4.) - 2.;
        if (abs(id.y - floor(top * 0.46) - zig) < 0.5) tc = uMg;
        if (id.y + 1.5 > top) tc = mod(id.x, 4.) < 1. ? uMc : uMg;
        float dx = min(abs(f.x - f.y), abs(f.x + f.y)) * 0.7071;
        float stroke = 1. - smoothstep(0.14 - aaw, 0.14 + aaw, dx);
        stroke *= step(max(abs(f.x), abs(f.y)), 0.44);
        float cover = mix(stroke, 0.55, smoothstep(0.25, 0.6, aaw));              // too fine to draw: flat thread coverage
        vec3 col = mix(uFogC * 0.985, tc, cover);
        col = mix(col, uFogC, clamp(uHaze + 0.2 * (1. - hn) * (1. - hn), 0., 0.95));
        gl_FragColor = vec4(col, 1.);
      }`,
  });
}

// ---------- soft cast shadows: a blob on the cloth for each tree, cottage and reel, away from the window light
function makeShadowMaterial(U) {
  return new THREE.ShaderMaterial({
    fog: false, transparent: true, depthWrite: false, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4,
    uniforms: U,
    vertexShader: /* glsl */`
      ${GLSL_COMMON}
      ${ROAD_GLSL}
      attribute vec2 iR;             // 1 = stands on land that is sewn in during the flight, strength
      uniform float uEdgeD, uFogD, uK;
      varying vec2 vQ; varying float vA;
      void main(){
        vec4 o = modelMatrix * instanceMatrix * vec4(0., 0., 0., 1.);
        float dI = -o.z, latI = o.x - roadX(dI);
        float rev = (iR.x < .5 || dI < uEdgeD) ? 1. : smoothstep(0., 18., sewAt(dI, latI) - 34.);
        vec4 w = modelMatrix * instanceMatrix * vec4(position, 1.);
        w.y += ripple(w.xz);
        float fd = distance(cameraPosition, w.xyz) * uFogD;
        vQ = position.xz; vA = rev * iR.y * uK * exp(-fd * fd);
        gl_Position = projectionMatrix * viewMatrix * w;
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uShadeC; varying vec2 vQ; varying float vA;
      void main(){ gl_FragColor = vec4(uShadeC, (1. - smoothstep(0.42, 1., length(vQ))) * vA); }`,
  });
}

// ---------- swallows: stitched V shapes, each trailing eight running stitches that fade
function makeSwallowMaterial(U) {
  return new THREE.ShaderMaterial({
    fog: true, side: THREE.DoubleSide, transparent: true, depthWrite: false,
    uniforms: { ...FOG_U(), ...U },
    vertexShader: /* glsl */`
      attribute vec4 iA, iB; attribute float iSc;        // iA: centre xyz, phase   iB: rx, rz, speed, trail index (0 = the bird)   iSc: size
      uniform float uTime;
      varying float vA;
      #include <fog_pars_vertex>
      vec3 route(float t){ float a = t * iB.z + iA.w; return iA.xyz + vec3(cos(a) * iB.x, sin(a * 2. + iA.w) * 6. + sin(a * 5.) * 2., sin(a) * iB.y + sin(a * 3.) * iB.y * 0.25); }
      void main(){
        float k = iB.w, t = uTime - k * 0.22 * (0.6 + 0.4 * iSc) / max(abs(iB.z) * 3., 0.2);
        vec3 c = route(t), tg = normalize(route(t + 0.05) - c);
        vec3 sd = normalize(cross(tg, vec3(0., 1., 0.)));
        float flap = k < 0.5 ? 0.55 + 0.35 * sin(uTime * 9. + iA.w * 5.) : 0.;
        // position.x: -1/1 = which wing, position.y: 0..1 along the stroke, position.z: -1/1 across it
        vec3 strokeDir = k < 0.5 ? normalize(-tg * 0.7 + sd * position.x * 0.8 + vec3(0., 1., 0.) * flap * 0.5) : -tg;
        float len = (k < 0.5 ? 2.4 : 0.8) * iSc;
        vec3 wc = c + strokeDir * position.y * len;
        vec3 vdir = normalize(cameraPosition - wc);
        float w = max((k < 0.5 ? 0.16 : 0.1) * iSc, distance(cameraPosition, wc) * (k < 0.5 ? 0.0018 : 0.0012));
        vec3 w3 = wc + normalize(cross(strokeDir, vdir) + 1e-4) * position.z * w;
        vA = (k < 0.5 ? 1. : (1. - k / 9.) * 0.85) * smoothstep(12., 42., distance(cameraPosition, c));   // a stitch brushing the lens is a black brick: fade it
        vec4 mvPosition = viewMatrix * vec4(w3, 1.); gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uBirdC; varying float vA;
      #include <fog_pars_fragment>
      void main(){ gl_FragColor = vec4(uBirdC, vA); 
        #include <fog_fragment>
      }`,
  });
}

// ---------- what drifts in the air: lint motes, bugle-bead rain or sequin snow, wrapped round the camera
function makePrecipMaterial(U) {
  return new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, fog: false,
    uniforms: U,
    vertexShader: /* glsl */`
      attribute vec4 iS;            // seed xyz, size
      uniform float uTime, uMode; uniform vec3 uCamP;
      varying vec2 vQ; varying float vF, vTw;
      void main(){
        vec3 bx = uMode > 0.5 && uMode < 1.5 ? vec3(120., 70., 120.) : vec3(150., 60., 150.);
        vec3 vel = uMode < 0.5 ? vec3(0.9, 0.25 * sin(iS.x * 40.), 0.4) : (uMode < 1.5 ? vec3(0., -46., 0.) : vec3(0.8, -3.4, 0.3));
        vec3 p = iS.xyz * bx + vel * uTime;
        if (uMode != 1.) p += vec3(sin(uTime * 0.6 + iS.y * 30.), sin(uTime * 0.45 + iS.x * 50.) * 0.6, cos(uTime * 0.5 + iS.z * 40.)) * 1.6;
        p = mod(p - uCamP + bx * 0.5, bx) - bx * 0.5 + uCamP;
        vec4 mv = viewMatrix * vec4(p, 1.);
        float dist = -mv.z, sz = iS.w * max(1., dist * 0.012);
        vec2 q = position.xy;
        vec2 ext = uMode > 0.5 && uMode < 1.5 ? vec2(0.05, 1.3) : vec2(sz * (uMode > 1.5 ? 0.16 : 0.1));
        if (uMode > 1.5) { float sp = uTime * (1.5 + iS.w * 3.) + iS.x * 60.; q.x *= cos(sp); }     // sequins tumble
        mv.xy += q * ext * (uMode > 0.5 && uMode < 1.5 ? max(1., dist * 0.02) * vec2(1., 1.) : vec2(1.));
        vQ = position.xy; vF = smoothstep(1.5, 5., dist) * (1. - smoothstep(bx.x * 0.34, bx.x * 0.5, dist));
        vTw = pow(max(0., sin(uTime * (2. + iS.w * 4.) + iS.x * 90.)), 8.);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uMoteC; uniform float uMode;
      varying vec2 vQ; varying float vF, vTw;
      void main(){
        float r = length(vQ);
        float a = uMode > 0.5 && uMode < 1.5 ? (1. - abs(vQ.x)) * (1. - vQ.y * vQ.y) * 0.5 : (uMode > 1.5 ? (1. - smoothstep(0.8, 1., r)) * 0.9 : (1. - smoothstep(0.2, 1., r)) * 0.5);
        vec3 col = uMoteC * (uMode > 1.5 ? 0.8 + 2.2 * vTw : (uMode > 0.5 ? 1.0 + 1.6 * step(0.6, vQ.y) : 1.));
        gl_FragColor = vec4(col, a * vF);
      }`,
  });
}

// =====================================================================================================
export default {
  id: 'stitched-country',
  name: 'The Stitched Country',
  category: 'domestic',
  weirdness: 0.75,
  media: ['air', 'rail'],
  async build(ctx) {
    const rng = ctx.rng, noise = ctx.noise, vary = ctx.vary || {};
    const detail = ctx.quality?.detail ?? 1, dens = clamp(vary.density ?? 1, 0.7, 1.3) * detail;
    // a stream of its own for a thing added to the country: made of the world's seed and the thing's name, it draws from no other stream
    const own = (name) => ctx.core.makeRng(ctx.core.hashSeed(name + ':' + ctx.seed));

    // ---- which country this visit: hour, season, weather, cast, layout
    const hour = vary.hour || 'any';
    const lookId = hour === 'dawn' ? 'morning' : hour === 'night' ? 'evening' : hour === 'golden' ? rng.pick(['autumn', 'autumn', 'evening'])
      : hour === 'day' ? rng.pick(['afternoon', 'afternoon', 'spring', 'autumn', 'winter'])
      : rng.pick(['afternoon', 'afternoon', 'afternoon', 'morning', 'morning', 'evening', 'evening', 'spring', 'spring', 'autumn', 'autumn', 'winter', 'winter']);
    const L = LOOKS[lookId], pal = L.pal.map(C);
    const [cLinen, cCream, cBlue, cGreen, cGold, cBrown, cCrimson] = pal;
    const precipMode = lookId === 'morning' && rng.chance(0.55) ? 1 : L.precip;          // bugle-bead rain on some mornings, sequin snow in winter
    const sx = rng.chance(0.5) ? 1 : -1;                                                  // mirror: railway on the +sx side, village on the other
    const flock = rng.pick(['sheep', 'sheep', 'geese', 'rabbits']), leapers = rng.pick(['fish', 'fish', 'frogs']);
    const nReels = rng.int(4, 7);
    const EDGE = 980, BARE = 48, RISE = 16, RIVER = rng.range(770, 790);
    // the gateway we come in by stands GATE metres down the road, that is 34 m short of the road's first stitch at d = 0: those
    // 34 m are the gateway's approach. The rise the hoop stands on begins at RISE_FOOT
    const GATE = -34, RISE_FOOT = 1010;
    const ARR0 = -100;                                                                    // the worked cloth begins here, behind the gateway
    const rd = [rng.range(20, 32), TAU / rng.range(720, 900), rng.range(0, TAU), rng.range(5, 8), TAU / rng.range(360, 460), rng.range(0, TAU)];
    const roadX = (d) => rd[0] * Math.sin(d * rd[1] + rd[2]) + rd[3] * Math.sin(d * rd[4] + rd[5]);
    const railLat = (d) => { const k = smoothstep(1000, 1380, d); return sx * (14 + 190 * k * k); };
    const railX = (d) => roadX(d) + railLat(d);
    const riverD = (x) => RIVER + 46 * Math.sin(x * 0.0058 + 1.1);

    // the unravelling flank hills (the hero builds them), alternating sides, and the village
    // (the last one stands inside the entry view, already half pulled out as we arrive)
    const mounds = [[300, -1, 195, 80, 1.4], [458, 1, 205, 76, 1], [628, -1, 262, 70, 1], [926, 1, 205, 67, 1], [150, -1, 102, 58, 0.9]].map(([d, side, lat, r, hk]) =>
      ({ x: roadX(d) + side * sx * (lat + rng.range(-12, 25)), z: -d, r: r * rng.range(0.92, 1.06), h: rng.range(28, 40) * hk }));
    const vil = { x: roadX(525) - sx * 128, z: -525 };
    const hills = [];
    for (let tries = 0; tries < 500 && hills.length < 28; tries++) {
      const d = rng.range(-300, 2000), side = rng.sign(), lat = rng.range(170, 950), r = rng.range(110, 230) * (1 + lat / 1500), h = rng.range(18, 44) * (0.7 + lat / 500);
      const x = roadX(clamp(d, 0, 1400)) + side * lat, z = -d;
      if (lat - r * 0.8 < 105) continue;
      if (mounds.some((m) => Math.hypot(x - m.x, z - m.z) < m.r + r + 6)) continue;
      if (Math.hypot(x - vil.x, z - vil.z) < r + 60) continue;
      hills.push({ x, z, r, h });
    }
    const H = (x, z) => {
      const d = -z, lat = x - roadX(d); let h = 0;
      for (const hl of hills) { const q2 = ((x - hl.x) * (x - hl.x) + (z - hl.z) * (z - hl.z)) / (hl.r * hl.r); if (q2 < 1) h += hl.h * Math.pow(1 - q2, 1.5); }
      if (h > 0) h *= (1 + 0.14 * noise.n2(x * 0.011, z * 0.011)) * smoothstep(25, 90, Math.abs(d - riverD(x)));
      const al = Math.abs(lat);
      if (al > 500) h += 30 * smoothstep(500, 1700, al) * (0.6 + 0.4 * noise.n2(x * 0.0015, z * 0.0015));
      h += RISE * smoothstep(RISE_FOOT, 1235, d) * (1 - smoothstep(1500, 2000, d)) * Math.exp(-(lat * lat) / (150 * 150));
      return h;
    };
    const onLand = (x, z, pad = 0) => {                 // free of mounds, river, corridor and village
      const d = -z, lat = (x - roadX(d)) * sx;
      const ck = smoothstep(1040, 1150, d);
      if (lat > lerp(-15, -9.5, ck) - pad && lat < lerp(27, 9.5, ck) + pad) return false;
      if (d > 950 && Math.abs(x - railX(d)) < 9 + pad) return false;
      if (Math.abs(d - riverD(x)) < 23 + pad) return false;
      for (const m of mounds) if (Math.hypot(x - m.x, z - m.z) < m.r + 3 + pad) return false;
      return true;
    };
    // the same for what is added to the country: the corridor is only as wide as the road until the railway begins (the zipper's
    // first tooth lies 196 m down the road; the cloth is cleared for it from 150 to 200 m, as the ground shader has it)
    const railless = (d) => 1 - smoothstep(150, 200, d);
    const onLandNew = (x, z, pad = 0) => {
      const d = -z, lat = (x - roadX(d)) * sx, k = Math.max(smoothstep(1040, 1150, d), railless(d));
      if (lat > lerp(-15, -9.5, k) - pad && lat < lerp(27, 9.5, k) + pad) return false;
      if (d > 950 && Math.abs(x - railX(d)) < 9 + pad) return false;
      if (Math.abs(d - riverD(x)) < 23 + pad) return false;
      for (const m of mounds) if (Math.hypot(x - m.x, z - m.z) < m.r + 3 + pad) return false;
      return true;
    };

    // ---- the hero: needle, thread, unravelling hills, hoop. Its road is ours.
    const skyEl = THREE.MathUtils.degToRad(L.el * 0.62 + 2), skyAz = L.az * 0.55, litEl = skyEl + 0.3;
    const sunAt = (el) => V3(-sx * Math.sin(skyAz) * Math.cos(el), Math.sin(el), -Math.cos(skyAz) * Math.cos(el));
    const skySun = sunAt(skyEl), litSun = sunAt(litEl);
    await ctx.yield();
    // how far ahead of us down the road the needle sews: about 200 m, and 30 m more at the gateway, given back over
    // the first 200 m of the road. `head` is a further start in metres at the gateway, given back over the same stretch.
    const lead = (d, head = 0) => 205 + (30 + head) * (1 - smoothstep(GATE, 200, d));
    // how far the flank hills are pulled out (0 stitched .. 1 bare) when we are d metres down the road; one field takes UNRAVEL_SPAN of it
    const unravelAt = (d) => (d + lead(d) - 0.1 * PITCH - 100) / 1150, UNRAVEL_SPAN = 0.3;
    // the gathering knot trails KNOT_BACK metres behind the needle, and KNOT_REST once the needle is through the hoop
    const KNOT_BACK = 70, KNOT_REST = 25;
    // the strand overhead is a metre in radius (the stitch it lays on the road 0.7 m, the strands the hills feed it 0.66 m), and
    // those hang only a little slack, so that where several hills are being pulled out at once they stand as rays about the knot
    const THREAD_R = 1.0;
    const entryHill = mounds[mounds.length - 1];
    const hero = await buildHero(ctx, {
      palette: L.pal, lightDir: litSun.toArray(), cloth: false, roadLength: 8 * PITCH, knots: Math.round(420 * dens), threadHeight: 96, gatherBack: KNOT_BACK, threadRadius: THREAD_R, feederSag: 0.07, feederSagMax: 20, gatherSide: -16 * sx, layRadius: 0.8, stitchRadius: 0.7, darkField: 0.9, moundRings: 30, moundSegs: 80, needleWiden: 0.012, needleRim: 0.2,
      road: (d, out) => { const x = roadX(d); return out.set(x, H(x, -d), -d); },
      // the hills unravel in the order we come to them. A field of the hill beside the entry is finished by the time we are level
      // with that field (unravelAt of its own place), so that its strands, rising to a knot that is by then ahead of us, never cross our way
      mounds, fieldOrder: (x, z) => { const o = clamp((-z - 150) / 850, 0, 1); return Math.hypot(x - entryHill.x, z - entryHill.z) < entryHill.r ? Math.min(o, (unravelAt(-z) - UNRAVEL_SPAN) / (1 - UNRAVEL_SPAN)) : o; }, unravelSpan: UNRAVEL_SPAN,
    });
    const hU = hero.uniforms;
    hU.uSun.value.setRGB(L.sun[0], L.sun[1], L.sun[2]).multiplyScalar(L.sun[3]); hU.uAmb.value.setRGB(...L.amb); hU.uShade.value.setRGB(...L.shade);
    if (L.moon) hU.uButton.value.setRGB(0.8, 0.86, 1.0);
    const A = hero.anchors, hoopC = A.portalSeat.position, hoopT = A.portalSeat.direction;
    await ctx.yield();

    const scene = new THREE.Scene();
    const skyC = C(L.sky), glowC = C(L.glow), fogC = skyC.clone().multiplyScalar(L.fogK ?? 0.76).add(glowC.clone().multiplyScalar(0.06));
    scene.fog = new THREE.FogExp2(fogC, L.fogD);
    scene.background = fogC.clone();
    scene.add(hero.object);
    // the hoop is the only thing lit by real lights
    const hemi = new THREE.HemisphereLight(C(L.glow), cBrown.clone().lerp(cLinen, 0.5), L.lamp ? 0.7 : 1.5);
    const key = new THREE.DirectionalLight(C(L.glow).lerp(new THREE.Color(L.sun[0], L.sun[1], L.sun[2]), 0.6), L.lamp ? 1.1 : 2.2);
    key.position.copy(hoopC).addScaledVector(litSun, 100); key.target.position.copy(hoopC); scene.add(hemi, key, key.target);

    const U = {
      uRip: hU.uRip, uTime: { value: 0 }, uSunDir: hU.uSunDir, uSun: hU.uSun, uAmb: hU.uAmb,
      uRoad: { value: new THREE.Vector4(rd[0], rd[1], rd[2], rd[3]) }, uRoad2: { value: new THREE.Vector4(rd[4], rd[5], sx, RIVER) },
      uNeedleD: { value: 0 }, uFrontD: { value: 0 }, uEdgeD: { value: EDGE }, uSewD: { value: 0 }, uShade: hU.uShade, uTrainP: { value: V3(0, 0, 1e4) }, uTrainD: { value: 0 }, uPinD: { value: 0 },
      uLampC: { value: new THREE.Color(1.0, 0.72, 0.42).multiplyScalar(L.lamp * 0.95) }, uLampP: { value: new THREE.Vector4(0, 0, 0, 62) }, uGlow: { value: L.glowK },
    };
    const felt = makeFeltMaterial(U), zip = makeZipMaterial(U);

    // ---- the valley floor: one grid that follows the road, fine near it and coarse toward the mountains
    {
      const lats = [0]; for (let l = 3; l < 2700; l += Math.max(3, l * 0.1)) { lats.push(l); lats.unshift(-l); }
      const ds = []; for (let d = -1900; d < -70; d += Math.max(8, (-70 - d) * 0.22)) ds.push(d);
      for (let d = -70; d <= 1425; d += 6.5) ds.push(d);
      for (let d = 1434; d < 3200; d += Math.max(8, (d - 1425) * 0.22)) ds.push(d);
      const nx = lats.length, nz = ds.length, pos = new Float32Array(nx * nz * 3), idx = new Uint32Array((nx - 1) * (nz - 1) * 6);
      for (let i = 0, k = 0; i < nz; i++) { const d = ds[i], x0 = roadX(d); for (let j = 0; j < nx; j++) { const x = x0 + lats[j]; pos[k++] = x; pos[k++] = H(x, -d); pos[k++] = -d; } if (i % 2 === 1) await ctx.yield(); }
      for (let i = 0, k = 0; i < nz - 1; i++) { for (let j = 0; j < nx - 1; j++) { const a = i * nx + j, b = a + 1, c = a + nx, e = c + 1; idx[k++] = a; idx[k++] = b; idx[k++] = c; idx[k++] = b; idx[k++] = e; idx[k++] = c; } if (i % 32 === 31) await ctx.yield(); }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setIndex(new THREE.BufferAttribute(idx, 1)); await ctx.yield();
      { // the grid's normals, as computeVertexNormals() works them out (each face's cross product summed at its corners, then
        // made unit length), but a few thousand faces at a time
        const nor = new Float32Array(pos.length);
        for (let t = 0; t < idx.length; t += 3) {
          const a = idx[t] * 3, b = idx[t + 1] * 3, c = idx[t + 2] * 3;
          const cx = pos[c] - pos[b], cy = pos[c + 1] - pos[b + 1], cz = pos[c + 2] - pos[b + 2], ax = pos[a] - pos[b], ay = pos[a + 1] - pos[b + 1], az = pos[a + 2] - pos[b + 2];
          const fx = cy * az - cz * ay, fy = cz * ax - cx * az, fz = cx * ay - cy * ax;
          nor[a] += fx; nor[a + 1] += fy; nor[a + 2] += fz; nor[b] += fx; nor[b + 1] += fy; nor[b + 2] += fz; nor[c] += fx; nor[c + 1] += fy; nor[c + 2] += fz;
          if (t % 9000 === 8997) await ctx.yield();
        }
        for (let i = 0; i < nor.length; i += 3) { const k = 1 / (Math.sqrt(nor[i] * nor[i] + nor[i + 1] * nor[i + 1] + nor[i + 2] * nor[i + 2]) || 1); nor[i] *= k; nor[i + 1] *= k; nor[i + 2] *= k; }
        g.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
      }
      await ctx.yield();
      const riverC = lookId === 'winter' ? C('#AFC6D6') : cBlue.clone().lerp(C('#4F8FB8'), 0.35);
      const ground = new THREE.Mesh(g, makeGroundMaterial({ ...U, uBareD: { value: ARR0 - 160 }, uShade: hU.uShade, uLinen: hU.uLinen, uPencil: { value: C('#7FA8B8').lerp(cBlue, 0.3).multiplyScalar(0.8) }, uCrimson: hU.uCrimson, uPal: hU.uPal,
        uNe0: hU.uNe0, uNe1: hU.uNe1, uSt: hU.uSt, uStW: hU.uStW, uKnot: hU.uKnot, uSup: hU.uSup, uFeed: hU.uFeed, uRiverC: { value: riverC }, uGold: { value: cGold.clone() } }));
      ground.name = 'linen'; ground.frustumCulled = false; scene.add(ground);
    }
    await ctx.yield();

    // ---- sky dome, button sun, felt clouds; the ring of cross-stitch mountains
    const clouds = [];
    for (let tries = 0; tries < 140 && clouds.length < 9; tries++) {
      const low = clouds.length < 5, az = low ? rng.range(-1.15, 1.15) : rng.range(-3.1, 3.1), el = low ? rng.range(0.12, 0.3) : rng.range(0.3, 0.6), sz = rng.range(0.07, 0.14);
      const dAz = Math.atan2(Math.sin(az + sx * skyAz), Math.cos(az + sx * skyAz));
      if (Math.hypot(dAz, el - skyEl) < 0.2 + sz * 1.6) continue;
      if (clouds.some((c) => Math.hypot(Math.atan2(Math.sin(az - c.x), Math.cos(az - c.x)), el - c.y) < (sz + c.z) * 1.7)) continue;
      clouds.push(new THREE.Vector4(az, el, sz, rng.range(1, 90)));
    }
    while (clouds.length < 9) clouds.push(new THREE.Vector4(0, 0, 0, 0));
    // the sky cloth's two dyes: at the land's edge the sky colour warmed toward the window's glow and the gold of the fields,
    // overhead the same colour cooled toward the blue of the river fields
    const skyLow = skyC.clone().lerp(glowC, 0.22).lerp(cGold, 0.1).multiplyScalar(0.86), skyTop = skyC.clone().lerp(cBlue, 0.4).multiplyScalar(0.7);
    const skyU = { uSkyC: { value: skyC }, uSkyLow: { value: skyLow }, uSkyTop: { value: skyTop }, uGlowC: { value: glowC }, uFogC: { value: fogC }, uSunDir: { value: skySun }, uTime: U.uTime, uMoon: { value: L.moon },
      uButton: { value: L.moon ? new THREE.Color(0.9, 0.92, 1.0).multiplyScalar(1.02) : new THREE.Color(1.0, 0.95, 0.88).multiplyScalar(0.95) },
      uGold: { value: cGold.clone() }, uCloudC: { value: cCream.clone().multiplyScalar(L.moon ? 0.7 : 1.08) }, uStitchC: { value: cBrown.clone().lerp(cCrimson, 0.25) }, uCl: { value: clouds } };
    const sky = new THREE.Mesh(new THREE.SphereGeometry(4800, 48, 24), makeSkyMaterial(skyU)); sky.name = 'sky'; sky.renderOrder = -10; sky.frustumCulled = false; scene.add(sky);
    await ctx.yield();
    {
      const mU = { uFogC: { value: fogC }, uMSeed: { value: rng.range(0, 50) }, uHaze: { value: lookId === 'evening' ? 0.26 : 0.13 }, uMc: { value: cCrimson.clone().lerp(fogC, 0.12) }, uMg: { value: cGold.clone().lerp(fogC, 0.1) },
        uM0: { value: cGreen.clone().lerp(cGold, 0.2) }, uM1: { value: cGreen.clone().lerp(cBlue, 0.55) }, uM2: { value: cBlue.clone().lerp(C('#9A8FB8'), 0.4) }, uM3: { value: cCream.clone().lerp(cBlue, 0.15) } };
      const mg = new THREE.CylinderGeometry(2950, 2950, 800, 160, 1, true).translate(0, 400, 0);
      const mts = new THREE.Mesh(mg, makeMountainMaterial(mU)); mts.name = 'mountains'; mts.position.set(roadX(650), -12, -650); mts.frustumCulled = false; mts.renderOrder = -5; scene.add(mts);
    }
    await ctx.yield();
    // ---- satin-stitch clouds standing in the air in three ranks, in each rank one to every `every` metres of road at a seeded
    //      place: the near rank a hundred-odd metres to either side, above the height the gathering knot rides at; the middle
    //      rank out over the fields; the far rank before the mountains. Each faces back up the road, turned a little toward it
    {
      const cr = own('satin-clouds'), ranks = [
        { every: 250, d0: -150, d1: 1950, lat: [95, 185], y: [106, 138], w: [72, 112] },
        { every: 230, d0: -300, d1: 2350, lat: [250, 540], y: [130, 205], w: [125, 195] },
        { every: 280, d0: -400, d1: 2800, lat: [680, 1500], y: [200, 370], w: [230, 390] }];
      const n = ranks.reduce((a, k) => a + Math.ceil((k.d1 - k.d0) / k.every), 0);
      const cg = new THREE.PlaneGeometry(2.6, 1.24).translate(0, 0.2, 0), seeds = new Float32Array(n);
      const cm = new THREE.InstancedMesh(cg, makeSatinCloudMaterial({ uTime: U.uTime, uCloudC: skyU.uCloudC, uShade: hU.uShade, uSun: hU.uSun, uStitchC: skyU.uStitchC, uSunDir: hU.uSunDir }), n);
      cm.name = 'satin-clouds'; cm.frustumCulled = false;
      let i = 0;
      for (const k of ranks) for (let d = k.d0 + cr.range(0, k.every); d < k.d1; d += k.every) {
        const side = cr.sign(), lat = side * cr.range(k.lat[0], k.lat[1]), y = cr.range(k.y[0], k.y[1]), S = cr.range(k.w[0], k.w[1]) / 2.6, dd = d + cr.range(-0.3, 0.3) * k.every;
        _m.compose(_p.set(roadX(dd) + lat, y + 0.3 * S, -dd), _q.setFromEuler(_e.set(0, -side * cr.range(0.1, 0.5), 0)), _s.set(S, S * cr.range(0.9, 1.15), 1));
        cm.setMatrixAt(i, _m); seeds[i++] = cr.range(1, 90);
      }
      cm.count = i; cg.setAttribute('aSeed', new THREE.InstancedBufferAttribute(seeds, 1)); scene.add(cm);
    }
    await ctx.yield();

    // ---- the flight: in over the first fields, a rising swing that reveals the needle and the country, down beside the reel
    //      train, low over the river between its trees, up over the unsewn edge, then along the last stitch and through the hoop
    const cl = -sx;                                             // the village side of the road, where the flight begins and ends
    const Rp = (d, lat, y) => { const x = roadX(d) + lat * cl; return V3(x, H(x, -d) + y, -d); };
    const fly = A.flyThrough;
    // the road is what we follow: whatever line the flight is drawn beside, its points are laid no further than REACH metres from
    // the road (as far out as the reveal swings), and the line flown through them then keeps within 40 m of it
    const REACH = 37, byRoad = (p) => { const x0 = roadX(-p.z); p.x = x0 + clamp(p.x - x0, -REACH, REACH); return p; };
    // The middle of the flight leaves the road. From the wide view over the village we come down across the road and the zipper
    // railway and fly beside the reel train, OUT metres outside the rail and no higher than its funnel; then out along the edge of
    // the grove on the river's banks and low over the ribbon river, the grove's trees on one hand and the train on the other;
    // then back to the road (and across it, where the flight ends on the village side: see es), climbing to the second wide view
    // before the unsewn edge. Rq is a point `off` metres outside the railway, Rg one GROVE_LAT metres from the road on the
    // railway's side at `along` metres past the river's own line there.
    const OUT = 8.5, GROVE_LAT = 38;
    const Rq = (d, off, y) => { const x = railX(d) + sx * off; return V3(x, H(x, -d) + y, -d); };
    let dBank = RIVER; for (let k = 0; k < 6; k++) dBank = riverD(roadX(dBank) + sx * GROVE_LAT);     // where the river's own line crosses the grove's lane
    const Rg = (along, y) => Rp(dBank + along, -GROVE_LAT, y);
    // The way down is given by places. We leave the road level with the village (pVil). The low run beside the rail ends LOW_END
    // metres before the river's line on the lane: 40 m of that is the lane's own run-in to the river, the other 60 m are for
    // swinging out from the rail to the lane without a turn that is felt. The low run is as long as the reel train (its engine
    // and its reels, 6.5 m apart) and 20 m more, so that somewhere in it the whole train is alongside. We cross the railway
    // half way down the road between the two (dCross): half the way down is flown on the village's side of the rail, half beyond it.
    const TRAIN_LEN = 8.6 + 6.5 * nReels, LOW_END = 100, LOW_RUN = TRAIN_LEN + 20;
    const pVil = Rp(-vil.z, 9, 24), pLow0 = Rq(dBank - LOW_END - LOW_RUN, OUT, 6.5), pLow1 = Rq(dBank - LOW_END, OUT, 5.5);
    const dCross = (-pVil.z - pLow0.z) / 2;
    // The hoop's line (through the needle's last two holes) and the road part company some way short of the hoop. We come in beside
    // that line on the side of it where the road is (es: 1 the village side, -1 the railway's), so the needle and its thread stand
    // beside the hoop and the flight keeps by the road. The way back from the river is a straight slant from the far bank to the
    // first point beside the line (pF), climbing above the reel train's steam before it passes over the railway.
    const es = (fly[1].x - roadX(-fly[1].z)) * cl > 0 ? -1 : 1, by = (p, off, dy) => byRoad(p.clone().add(V3(cl * es * off, dy, 0)));
    const pF = by(fly[1], 24, 1.5), dF = -pF.z, latF = (pF.x - roadX(dF)) * cl;
    const back = (k, y) => Rp(lerp(dBank + 20, dF, k), lerp(-GROVE_LAT, latF, k), y);
    const route = [
      Rp(GATE, 14, 4), Rp(28, 14, 5), Rp(92, 14, 8), Rp(165, 18, 18), Rp(250, 30, 25), Rp(345, 37, 35), Rp(440, 28, 37),
      pVil, Rq(dCross, 0, 13), pLow0, pLow1, Rg(-40, 6), Rg(20, 7), back(0.3, 23.5), back(0.6, 27.5),
      pF, by(fly[2], 17, -1.5), by(fly[2].clone().lerp(fly[3], 0.55), 6.5, -1), fly[3].clone(), fly[4].clone(),   // beside the hoop's line until the last 80 m
    ];
    const path = makePath(route), dTop = -route[3].z;                         // dTop: the top of the first climb, metres down the road
    const farFrom = (x, y, z, r) => path.distanceTo(x, y, z) > r;
    await ctx.yield();

    // ---- flora: French knots by the thousand, pom-pom trees on chain-stitch trunks, tassel wheat.
    // One stream (fr) deals the country: far knots, verge knots, trees, wheat, in that order and with the draws it has always
    // taken, so every cluster, tree and tassel it deals keeps its place whatever else changes here. Nothing new may draw from it:
    // what has been added to the country comes from forks of it (kr, tr, wr, mr) taken after its last draw.
    const flowerCols = L.flowers.map(C), treeAt = [];
    {
      const fr = rng.fork('flora');
      // the stream's country begins FLORA0 metres down the road, where the unpicked cloth used to end. The strip of fields the cloth
      // has since given up (BARE .. FLORA0) is dealt by the same rules, at the same densities, from the forks: strip(n, len) is its
      // share of a count n that the stream spreads over len metres of road
      const FLORA0 = 70, strip = (n, len) => Math.max(0, Math.round(n * (FLORA0 - BARE) / len));
      // the cloth we arrive over is worked like the rest, from ARR0 metres down the road (behind the gateway) to where that strip
      // begins: the same rules at the same densities, dealt by streams of their own. arrive(n, len) is its share of a count n
      const ARRIVE = BARE - ARR0, arrive = (n, len) => Math.round(n * ARRIVE / len);
      // the line the flight used to take beside the road. The stream's trees have always been dealt 15 m clear of it and still are,
      // so that the line we fly now (path) decides only which of them are left out, never where the others stand
      const oldLine = makePath([
        Rp(-34, 14, 4), Rp(28, 14, 5), Rp(92, 14, 8), Rp(165, 18, 18), Rp(250, 30, 30), Rp(345, 37, 43), Rp(440, 28, 44),
        Rp(540, 15, 30), Rp(640, 14, 16), Rp(RIVER - 10, 15, 12.5), Rp(880, 15, 13), Rp(965, 14, 15),
        fly[1].clone().add(V3(cl * 20, -3.5, 0)), fly[2].clone().add(V3(cl * 16, -3.5, 0)), fly[2].clone().lerp(fly[3], 0.55).add(V3(cl * 4.5, -1, 0)), fly[3].clone(), fly[4].clone(),
      ]);
      await ctx.yield();
      const kgFar = paint(puff(new THREE.OctahedronGeometry(0.5, 0).scale(1, 0.7, 1).translate(0, 0.3, 0)), C('#ffffff'), { tint: 1, ao: [0, 0.6], aoK: 0.5 });
      const kgNear = paint(puff(new THREE.IcosahedronGeometry(0.5, 1).scale(1, 0.6, 1).translate(0, 0.27, 0)), C('#ffffff'), { tint: 1, emis: -1 });
      await ctx.yield();
      // the rounded knots are the verge knots (nVerge) and, while they last, the far knots nearest the flight (nWound)
      const nNear = Math.round(820 * dens), nFar = Math.round(6000 * dens), nVerge = Math.round(540 * dens), nWound = nNear - nVerge;
      const nFarS = strip(nFar, 1500 - (FLORA0 + 5)), nVergeS = strip(nVerge * 0.75, 1262 - (FLORA0 + 5));
      const nFarA = arrive(nFar * 0.6, 1500 - (FLORA0 + 5)), nVergeA = arrive(nVerge * 0.75, 1262 - (FLORA0 + 5)), nFill = Math.round(110 * dens);
      const knots = inst(kgFar, felt, nFar + nFarS + nFarA, 'french-knots'), knotsNear = inst(kgNear, felt, nNear + nVergeS, 'french-knots-near');
      // the knots of the cloth we arrive over are wound knots of a quarter the triangles (the budget of triangles is spent)
      const kgMid = paint(puff(new THREE.IcosahedronGeometry(0.5, 0).scale(1, 0.6, 1).translate(0, 0.27, 0)), C('#ffffff'), { tint: 1, emis: -1 });
      const knotsMid = inst(kgMid, felt, nFarA + nVergeA + nFill, 'french-knots-arrival');
      // JS twin of the ground shader's patchwork: metres to the nearest field border, so knots can gather along the hedges
      const frc = (v) => v - Math.floor(v);
      const h21 = (x, y) => { let px = frc(x * 123.34), py = frc(y * 456.21); const dd = px * (px + 45.32) + py * (py + 45.32); px += dd; py += dd; return frc(px * py); };
      const fieldEdge = (x, z) => { const gx = x / 118, gy = z / 118, ix = Math.floor(gx), iy = Math.floor(gy), fx = gx - ix, fy = gy - iy; let b1 = 9, b2 = 9;
        for (let oy = -1; oy <= 1; oy++) for (let ox = -1; ox <= 1; ox++) { const cx = ox + 0.14 + 0.72 * h21(ix + ox, iy + oy), cy = oy + 0.14 + 0.72 * h21(ix + ox + 17.3, iy + oy + 17.3), dd = Math.hypot(cx - fx, cy - fy);
          if (dd < b1) { b2 = b1; b1 = dd; } else if (dd < b2) b2 = dd; }
        return (b2 - b1) * 59; };
      await ctx.yield();
      let iN = 0, iF = 0, iM = 0;
      // n far knots between d0 and d1 down the road: five to nine to a tight cluster, on the verges and along the field borders
      // (cap: how many places the rounded knots may fill; land: the test of free land the stream uses; mid: the arrival's knots,
      // wound ones within 50 m of the flight's side of the road)
      const sowFar = async (r, d0, d1, n, cap = nWound, land = onLand, mid = false) => {
        for (let c = 0, t = 0; c < n && t < n * 3; t++) {
          if ((t & 15) === 15) await ctx.yield();
          const d = r.range(d0, d1), verge = r.chance(0.4);
          const lat = verge ? (r.chance(0.5) ? -32 - Math.abs(r.gauss()) * 9 : 44 + Math.abs(r.gauss()) * 9) : r.range(30, 330) * r.sign();
          const cx = roadX(d) + lat * sx, cz = -d;
          if (!verge && fieldEdge(cx, cz) > 4.5) continue;
          if (!land(cx, cz, 1.5)) continue;
          const m = r.int(5, 9), col = r.pick(flowerCols);
          const near = mid ? Math.abs(lat + 20) < 50 : Math.abs(lat + 20) < 120 && d < 1420 && iN + m <= cap;     // within about 120 m of the flight a knot is a wound, rounded knot, not a chip
          for (let k = 0; k < m && c < n; k++, c++) {
            const a = r.range(0, TAU), q = k ? r.range(0.4, 1.2) : 0, x = cx + Math.cos(a) * q, z = cz + Math.sin(a) * q, s = r.range(0.6, 1.2) * (k ? 0.85 : 1.25);
            if (near) put(mid ? knotsMid : knotsNear, mid ? iM++ : iN++, x, H(x, z), z, r.range(0, TAU), s * 1.2, s * 1.2, s * 1.2, col.clone().multiplyScalar(r.range(0.82, 1)), r.range(0, TAU), 0.03, 0, 0);
            else put(knots, iF++, x, H(x, z), z, r.range(0, TAU), s, s, s, col.clone().multiplyScalar(r.range(0.82, 1)), r.range(0, TAU), 0.05, 0, 0);
          }
        }
      };
      // n verge knots between d0 and d1: three to five to a cluster, along the verges and (toHoop) up the last stitch to the hoop
      // (land: the test of free land; narrow(d): 0 where the corridor carries road and railway .. 1 where it is only the road)
      const sowVerge = async (r, d0, d1, n, toHoop, land = onLand, narrow = (d) => smoothstep(1040, 1150, d), mid = false) => {
        for (let c = 0, t = 0; c < n && t < n * 4; t++) {
          const d = toHoop && t % 4 === 0 ? r.range(1100, 1262) : r.range(d0, d1), ck = narrow(d), lat = r.chance(0.5) ? lerp(-16.5, -10.5, ck) - Math.abs(r.gauss()) * 9 : lerp(28.5, 10.5, ck) + Math.abs(r.gauss()) * 9;
          const cx = roadX(d) + lat * sx, cz = -d, m = r.int(3, 5), col = r.pick(flowerCols);
          for (let k = 0; k < m && c < n; k++) {
            const a = r.range(0, TAU), q = k ? r.range(0.75, 1.5) : 0, x = cx + Math.cos(a) * q, z = cz + Math.sin(a) * q; if (!land(x, z, 0.5)) continue;
            const s = r.range(0.95, 1.6) * (k ? 0.85 : 1.15);
            put(mid ? knotsMid : knotsNear, mid ? iM++ : iN++, x, H(x, z), z, r.range(0, TAU), s, s, s, col.clone().multiplyScalar(r.range(0.82, 1)), r.range(0, TAU), 0.03, 0, 0); c++;
          }
          if ((t & 127) === 127) await ctx.yield();
        }
      };
      await sowFar(fr, FLORA0 + 5, 1500, nFar);
      await sowVerge(fr, FLORA0 + 5, 1262, nVerge, true);
      await ctx.yield();

      const parts = [paint(puff(ball(3.6, 0, 8.2, 0, 1, 0.92, 1)), C('#ffffff'), { tint: 1, ao: [5, 11] })];
      for (let k = 0; k < 3; k++) parts.push(paint(ball(0.62, 0, 0.95 + k * 1.75, 0, 0.75, 1.6, 0.75, 0), cBrown.clone().multiplyScalar(0.8 + 0.12 * (k % 2))));
      // besides the stream's trees: the strip's share of them, and one more for every MORE_EVERY metres of road from the river to the far side of the hoop
      const MORE_EVERY = 20, nT = Math.round(340 * dens), nTS = strip(nT * 0.8, 1560 - (FLORA0 + 15)), nMore = Math.round(dens * (1330 - RIVER) / MORE_EVERY);
      const GROVE_ROWS = 5, GROVE_DEEP = 3, nTA = arrive(nT * 0.4, 1560 - (FLORA0 + 15));
      const GROVE_NEAR = 2;                                        // the grove's rows nearest the flight
      const trees = inst(merge(parts), felt, nT + nTS + nMore + 2 * (GROVE_ROWS - GROVE_NEAR) * GROVE_DEEP + nTA, 'pom-pom-trees');
      // those rows are flown beside, under their crowns: their pom-pom is a rounder ball (more than twice the triangles of the others')
      const partsR = [paint(puff(ball(3.6, 0, 8.2, 0, 1, 0.92, 1, 2)), C('#ffffff'), { tint: 1, ao: [5, 11] })];
      for (let k = 0; k < 3; k++) partsR.push(paint(ball(0.62, 0, 0.95 + k * 1.75, 0, 0.75, 1.6, 0.75, 0), cBrown.clone().multiplyScalar(0.8 + 0.12 * (k % 2))));
      const groveTrees = inst(merge(partsR), felt, 2 * GROVE_NEAR * GROVE_DEEP, 'grove-trees');
      const leafCols = lookId === 'winter' ? [C('#F4F6F4'), C('#DDE5E8'), C('#EDEAE0')] : lookId === 'autumn' ? [C('#CE7E2C'), C('#D99A2E'), C('#8A5A3C'), C('#8A8A3A')]
        : lookId === 'spring' ? [C('#F2A6BE'), C('#9CC76C'), C('#F6D2DC'), C('#7FB067')] : [cGreen.clone().multiplyScalar(0.7), cGreen.clone().lerp(cGold, 0.3).multiplyScalar(0.75), cGreen.clone().multiplyScalar(0.55)];
      // a dealt tree stands unless its crown is nearer than `clear` m to the flight, or its trunk nearer than `trunk` m;
      // then it is left out, and nothing is dealt in its place
      let nt = 0, iT = 0, iG = 0;
      const stand = (r, x, y, z, s, sewn, clear = 22, trunk = 7, round = false) => {
        const yaw = r.range(0, TAU), sy = s * r.range(0.9, 1.15), col = r.pick(leafCols).clone().multiplyScalar(r.range(0.85, 1.1)), ph = r.range(0, TAU);
        if (!farFrom(x, y + 8 * s, z, clear) || (clear < 22 && !farFrom(x, y + 3 * s, z, trunk))) return;   // (a crown 22 m clear has its trunk clear too)
        treeAt.push(x, y, z, s, sewn ? 1 : 0);
        put(round ? groveTrees : trees, round ? iG++ : iT++, x, y, z, yaw, s, sy, s, col, ph, 0.03, 0, 0);
      };
      for (let t = 0; nt < nT && t < nT * 12; t++) {
        const sewn = nt >= 14 && nt % 5 === 2;                      // one in five stands on the new land, to loop up as the stitching front passes
        const d = nt < 14 ? fr.range(70, 150) : sewn ? fr.range(EDGE + 10, 1330) : fr.range(FLORA0 + 15, 1560), lat = nt < 14 ? fr.range(46, 120) * (nt % 2 ? 1 : -1) : sewn ? fr.range(24, 135) * fr.sign() : (25 + Math.pow(fr(), 1.6) * 470) * fr.sign();
        const x = roadX(d) + lat, z = -d, y = H(x, z), s = fr.range(0.8, 1.35);
        if (!onLand(x, z, 6) || Math.hypot(x - vil.x, z - vil.z) < 62 || !(oldLine.distanceTo(x, y + 8 * s, z) > 15)) continue;
        if (noise.n2(x * 0.008, z * 0.008) < -0.25) continue;
        nt++; stand(fr, x, y, z, s, sewn);
        if ((t & 7) === 7) await ctx.yield();
      }
      await ctx.yield();

      const stubble = lookId === 'autumn';
      const wg = paint(new THREE.CylinderGeometry(0.2, 0.05, 1.7, 3, 1, true).translate(0, 0.8, 0), C('#ffffff'), { tint: 1, ao: [0, 1.4] });
      const nW = Math.round(4600 * dens), nWS = strip(nW, 1350 - (FLORA0 + 10)), nWA = arrive(nW, 1350 - (FLORA0 + 10)), wheat = inst(wg, felt, nW + nWS + nWA + nFill, 'tassel-wheat');
      const wheatC = lookId === 'winter' ? C('#F2F0E8') : cGold.clone().lerp(cCream, 0.25);
      let nw = 0;
      // n tassels of wheat between d0 and d1 down the road
      const sowWheat = async (r, d0, d1, n, land = onLand) => {
        for (let k = 0, t = 0; k < n && t < n * 10; t++) {
          if ((t & 511) === 511) await ctx.yield();
          const d = r.range(d0, d1), lat = r.chance(0.5) ? r.range(-170, -17) : r.range(29, 150);
          const x = roadX(d) + lat * sx, z = -d;
          if (noise.n2(x * 0.007 + 40, z * 0.007) < 0.12 || !land(x, z, 1) || Math.hypot(x - vil.x, z - vil.z) < 58) continue;
          const s = r.range(0.9, 1.5); k++;
          put(wheat, nw++, x, H(x, z), z, r.range(0, TAU), s, s * (stubble ? 0.3 : 1), s, wheatC.clone().multiplyScalar(r.range(0.75, 1.05)), r.range(0, TAU), 0.2, 0, 1);
        }
      };
      await sowWheat(fr, FLORA0 + 10, 1350, nW);

      // ---- the stream's last draw is taken. What follows is added from its forks, each a stream of its own.
      const kr = fr.fork('knots'), tr = fr.fork('trees'), wr = fr.fork('wheat'), mr = fr.fork('more-trees');
      await sowFar(kr, BARE + 5, FLORA0 + 5, nFarS);
      await sowVerge(kr, BARE + 5, FLORA0 + 5, nVergeS, false);
      await sowWheat(wr, BARE + 10, FLORA0 + 10, nWS);
      // n more trees by the tests the stream's trees pass (land, village, the thinning noise); place(r) deals [d, offset from the road]
      const plant = (r, n, place, land = onLand) => {
        for (let k = 0, t = 0; k < n && t < n * 12; t++) {
          const [d, lat] = place(r), x = roadX(d) + lat, z = -d, y = H(x, z), s = r.range(0.8, 1.35);
          if (!land(x, z, 6) || Math.hypot(x - vil.x, z - vil.z) < 62 || noise.n2(x * 0.008, z * 0.008) < -0.25) continue;
          k++; stand(r, x, y, z, s, d > EDGE);
        }
      };
      plant(tr, nTS, (r) => [r.range(BARE + 15, FLORA0 + 15), (25 + Math.pow(r(), 1.6) * 470) * r.sign()]);
      plant(mr, nMore, (r) => [r.range(RIVER, 1330), r.range(24, 135) * r.sign()]);    // from the river to the far side of the hoop, within 135 m of the road like the trees of the new land

      // ---- added since, each from a stream of its own (the world's seed and a name)
      // the cloth we arrive over: knots, wheat and trees from behind the gateway to where the strip above begins
      const narrow = (d) => Math.max(smoothstep(1040, 1150, d), railless(d));
      const ak = own('arrival-knots'), aw = own('arrival-wheat'), ar = own('arrival-trees');
      await sowFar(ak, ARR0 + 5, BARE + 5, nFarA, 0, onLandNew, true);
      await sowVerge(ak, ARR0 + 5, BARE + 5, nVergeA, false, onLandNew, narrow, true);
      await sowWheat(aw, ARR0 + 10, BARE + 10, nWA, onLandNew);
      plant(ar, nTA, (r) => [r.range(ARR0 + 15, BARE + 15), (25 + Math.pow(r(), 1.6) * 470) * r.sign()], onLandNew);
      // the strip beside the road that the railway does not need before it begins: tufts of knots or of wheat, as on the other verge
      const fk = own('railless-verge');
      for (let c = 0, t = 0; c < nFill && t < nFill * 4; t++) {
        const d = fk.range(ARR0 + 5, 196), lat = fk.range(10.5, 28), cx = roadX(d) + lat * sx, cz = -d, m = fk.int(3, 5), col = fk.pick(flowerCols), tuft = fk.chance(0.5);
        for (let k = 0; k < m; k++) {
          const a = fk.range(0, TAU), q = k ? fk.range(0.75, 1.5) : 0, x = cx + Math.cos(a) * q, z = cz + Math.sin(a) * q, s = fk.range(0.95, 1.6) * (k ? 0.85 : 1.15), yaw = fk.range(0, TAU), sh = fk.range(0.82, 1), ph = fk.range(0, TAU);
          if (c >= nFill || !onLandNew(x, z, 0.5)) continue;
          if (tuft) put(wheat, nw++, x, H(x, z), z, yaw, s * 0.9, s * 0.9 * (stubble ? 0.3 : 1), s * 0.9, wheatC.clone().multiplyScalar(sh), ph, 0.2, 0, 1);
          else put(knotsMid, iM++, x, H(x, z), z, yaw, s, s, s, col.clone().multiplyScalar(sh), ph, 0.03, 0, 0);
          c++;
        }
      }
      // the grove on the river's banks, on the railway's side: tall old pom-pom trees in rows, GROVE_DEEP deep on each bank, from
      // 18 m outside the lane we fly (the side away from the railway, so the reel train and the needle stay in the open) out to
      // a hundred metres from the road; each `off` metres up or down the valley from the river's line
      const gv = own('grove');
      for (const bank of [-1, 1]) for (let j = 0; j < GROVE_DEEP; j++) for (let k = 0; k < GROVE_ROWS; k++) {
        const lat = GROVE_LAT + 18.5 + k * 11.5 + gv.range(-2.5, 2.5), off = bank * (29 + j * 15 + gv.range(-5, 5)), s = gv.range(1.2, 1.6);
        let d = RIVER; for (let i = 0; i < 4; i++) d = riverD(roadX(d) + sx * lat) + off;
        const x = roadX(d) + sx * lat;
        stand(gv, x, H(x, -d), -d, s, false, 3.6 * s + 11, 11, k < GROVE_NEAR);
      }
      knots.count = iF; knotsNear.count = iN; knotsMid.count = iM; trees.count = iT; groveTrees.count = iG; wheat.count = nw;
      scene.add(knotsNear); scene.add(knotsMid); scene.add(knots); scene.add(trees); scene.add(groveTrees); scene.add(wheat);
    }
    await ctx.yield();

    // ---- the felt village: applique cottages, a church with a glass bead on its spire, bunting, a patchwork windmill
    let sails = null; const millAt = V3(), blobs = [];
    {
      const vr = rng.fork('village'), parts = [], wallCols = [cCream, C('#E9C9B4'), C('#CFE0D6'), C('#EAD9A8'), C('#D9C4D6')], roofCols = [cBrown.clone().lerp(cGold, 0.35), cBrown, cBlue.clone().multiplyScalar(0.8), cGold.clone().multiplyScalar(0.85)];
      const winC = C('#F3C94F'), roofs = [];
      const cottage = (x, z, yaw, w, dp, h) => {
        const g = [paint(box(w, h, dp, 0, h / 2, 0), vr.pick(wallCols).clone().multiplyScalar(0.92), { ao: [0, h] }),
          paint(new THREE.CylinderGeometry(0, 0.78, 1, 4, 1).rotateY(Math.PI / 4).scale(w * 1.02, h * 0.75, dp * 1.05).translate(0, h + h * 0.375, 0), vr.pick(roofCols).clone().multiplyScalar(0.9)),
          paint(box(1.3, 2.4, 0.3, 0, 1.2, dp / 2 + 0.1), cBrown.clone().multiplyScalar(0.8))];
        for (const sxw of [-1, 1]) { g.push(paint(box(1.3, 1.3, 0.3, sxw * w * 0.3, h * 0.6, dp / 2 + 0.1), winC, { emis: 1 }), paint(box(0.3, 1.3, 1.3, sxw * (w / 2 + 0.1), h * 0.6, 0), winC, { emis: 1 })); }
        const y = H(x, z); for (const p of g) { p.rotateY(yaw).translate(x, y, z); parts.push(p); }
        roofs.push(V3(x, y + h * 1.75, z)); blobs.push([x, y, z, h * 1.3, w * 0.62, 0, 0.9]);
      };
      for (let i = 0; i < 14; i++) {
        const ring = i < 5 ? 0 : 1, a = (i / (ring ? 9 : 5)) * TAU + vr.range(-0.2, 0.2), r = (ring ? 44 : 21) + vr.range(-4, 4);
        const x = vil.x + Math.cos(a) * r, z = vil.z + Math.sin(a) * r;
        cottage(x, z, Math.atan2(vil.x - x, vil.z - z) + vr.range(-0.3, 0.3), vr.range(7, 10), vr.range(6, 7.5), vr.range(4.2, 5.6));
        if (i % 4 === 3) await ctx.yield();
      }
      { // church
        const y = H(vil.x, vil.z), g = [paint(box(8, 9, 17, 0, 4.5, 0), cCream.clone().multiplyScalar(0.95), { ao: [0, 9] }),
          paint(new THREE.CylinderGeometry(0, 0.78, 1, 4, 1).rotateY(Math.PI / 4).scale(8.3, 5, 17.6).translate(0, 11.5, 0), cBlue.clone().multiplyScalar(0.7)),
          paint(box(5.2, 19, 5.2, 0, 9.5, -10.5), cCream.clone().multiplyScalar(0.9), { ao: [0, 19] }),
          paint(new THREE.ConeGeometry(3.9, 11, 4).rotateY(Math.PI / 4).translate(0, 24.5, -10.5), cCrimson.clone().lerp(cBrown, 0.35)),
          paint(ball(1.0, 0, 30.6, -10.5), C('#CFEFFF'), { emis: 2 }),
          paint(box(1.6, 3.4, 0.4, 0, 12, -7.8), winC, { emis: 1 })];
        for (const s of [-1, 1]) for (let k = -1; k <= 1; k++) g.push(paint(box(0.3, 3, 1.6, s * 4.1, 5, k * 5), winC, { emis: 1 }));
        for (const p of g) { p.rotateY(vr.range(0, TAU) * 0 + (sx > 0 ? 0.6 : -0.6)).translate(vil.x, y, vil.z); parts.push(p); }
      }
      // the windmill stands toward the road so its turning sails read from the flight
      millAt.set(vil.x + sx * 62, 0, vil.z - 34); millAt.y = H(millAt.x, millAt.z);
      blobs.push([vil.x, H(vil.x, vil.z), vil.z, 15, 9, 0, 0.9], [millAt.x, millAt.y, millAt.z, 17, 3.6, 0, 1]);
      const patch = [cCream, cGold, cBlue, C('#E9C9B4'), cGreen];
      for (let k = 0; k < 4; k++) parts.push(paint(new THREE.CylinderGeometry(3.3 - k * 0.45, 3.75 - k * 0.45, 4.2, 10, 1, true).translate(millAt.x, millAt.y + 2.1 + k * 4.2, millAt.z), patch[(k + vr.int(0, 3)) % 5].clone().multiplyScalar(0.9)));
      parts.push(paint(new THREE.ConeGeometry(2.6, 3.4, 10).translate(millAt.x, millAt.y + 18.5, millAt.z), cBrown.clone().multiplyScalar(0.9)));
      const village = inst(merge(parts), felt, 1, 'felt-village'); put(village, 0, 0, 0, 0, 0, 1, 1, 1, null, 0, 0, 0, -1); scene.add(village);
      const sp = [paint(ball(0.7, 0, 0, 0.5, 1, 1, 1, 0), cBrown)];
      for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2;
        sp.push(paint(box(0.35, 10.5, 0.25, 0, 5.25, 0.4).rotateZ(a), cBrown.clone().multiplyScalar(0.8)));
        for (let j = 0; j < 3; j++) sp.push(paint(box(2.6, 2.3, 0.12, 1.5, 3.6 + j * 2.5, 0.5).rotateZ(a), patch[(k + j) % 5].clone().multiplyScalar(0.95))); }
      sails = inst(merge(sp), felt, 1, 'windmill-sails'); millAt.y += 16.2; scene.add(sails);
      await ctx.yield();
      // bunting of tiny triangles strung between neighbouring roofs
      const tri = new THREE.BufferGeometry(); tri.setAttribute('position', new THREE.Float32BufferAttribute([-0.55, 0, 0, 0.55, 0, 0, 0, -1.3, 0], 3)); tri.setAttribute('normal', new THREE.Float32BufferAttribute([0, 0, 1, 0, 0, 1, 0, 0, 1], 3));
      const flags = []; const bcols = [cCrimson, cGold, cBlue, cCream, cGreen];
      for (let i = 0; i < roofs.length; i++) { const a = roofs[i]; let b = null, bd = 1e9; for (let j = 0; j < roofs.length; j++) { if (j === i) continue; const dd = a.distanceTo(roofs[j]); if (dd < bd && (j > i || dd > 0)) { bd = dd; b = roofs[j]; } }
        const b2 = roofs[(i + 1) % roofs.length];
        for (const e of [b, b2]) { if (!e || e === a) continue; const n = Math.floor(a.distanceTo(e) / 1.5); const yaw = Math.atan2(e.x - a.x, e.z - a.z) + Math.PI / 2;
          for (let k = 1; k < n; k++) { const t = k / n; flags.push([lerp(a.x, e.x, t), lerp(a.y, e.y, t) - 1.2 - Math.sin(Math.PI * t) * 2.2, lerp(a.z, e.z, t), yaw]); } } }
      const bunting = inst(paint(tri, C('#ffffff'), { tint: 1 }), felt, flags.length, 'bunting');
      flags.forEach((f, i) => put(bunting, i, f[0], f[1], f[2], f[3], 1, 1, 1, bcols[i % 5], i * 0.9, 0.35, 0, -1));
      scene.add(bunting);
    }
    await ctx.yield();

    // ---- the flock near the village: pom-pom sheep, felt geese or pom-pom rabbits, bobbling, bouncing on the ripple ring
    {
      const sr = rng.fork('flock'), dark = C('#3A3030'), g = [];
      const legSwing = (w) => (x, y, z) => (y < 0.7 ? w : 0) * (x * z > 0 ? 1 : -1);
      let hop = 0.55, scl = 1.25, col = cCream.clone();
      if (flock === 'sheep') {
        g.push(paint(puff(ball(1.15, 0, 1.55, 0, 1, 0.85, 1.25)), C('#ffffff'), { tint: 1, ao: [0.6, 2.2] }), paint(ball(0.5, 0, 1.95, 1.4, 0.85, 1, 1.1), dark), paint(puff(ball(0.42, 0, 2.45, 1.05)), C('#ffffff'), { tint: 1 }));
        for (const a of [-1, 1]) { g.push(paint(box(0.5, 0.14, 0.26, a * 0.5, 2.1, 1.3), dark)); for (const b of [-1, 1]) g.push(paint(box(0.2, 0.9, 0.2, a * 0.5, 0.45, b * 0.75), dark, { leg: legSwing(0.3) })); }
      } else if (flock === 'geese') {
        hop = 0.3; scl = 1.2; col = C('#FBFBF6');
        g.push(paint(puff(ball(0.85, 0, 1.25, 0, 0.8, 0.8, 1.5)), C('#ffffff'), { tint: 1, ao: [0.5, 1.8] }), paint(cyl(0.2, 0.26, 1.3, 0, 1.5, 1.0, 6).rotateX(0.25), C('#ffffff'), { tint: 1 }),
          paint(ball(0.33, 0, 2.95, 1.6), C('#ffffff'), { tint: 1 }), paint(new THREE.ConeGeometry(0.15, 0.6, 5).rotateX(Math.PI / 2).translate(0, 2.9, 2.1), C('#E8862E')), paint(new THREE.ConeGeometry(0.5, 1, 4).rotateX(-Math.PI / 2.4).translate(0, 1.5, -1.5), C('#ffffff'), { tint: 1 }));
        for (const a of [-1, 1]) g.push(paint(box(0.14, 0.7, 0.14, a * 0.3, 0.35, 0), C('#E8862E'), { leg: (x, y) => (y < 0.5 ? 0.3 : 0) * a }));
      } else {
        hop = 1.2; scl = 1.0; col = rng.pick([C('#E9DCC6'), C('#C9B49A'), C('#F6F2EA')]);
        g.push(paint(puff(ball(0.9, 0, 1.0, 0, 0.9, 0.9, 1.2)), C('#ffffff'), { tint: 1, ao: [0.2, 1.6] }), paint(puff(ball(0.55, 0, 1.75, 0.95)), C('#ffffff'), { tint: 1 }), paint(puff(ball(0.34, 0, 1.0, -1.15)), C('#FFFFFF')));
        for (const a of [-1, 1]) g.push(paint(box(0.24, 1.3, 0.12, a * 0.25, 2.75, 0.85).rotateZ(-a * 0.12), C('#ffffff'), { tint: 1 }), paint(box(0.1, 0.1, 0.1, a * 0.26, 1.85, 1.45), dark));
      }
      const n = 60, herd = inst(merge(g), felt, n, 'flock');
      const f0 = [vil.x + sx * 66, vil.z + 52], f1 = [vil.x + sx * 60, vil.z - 86];
      for (let i = 0, t = 0; i < n && t < 2000; t++) {
        const c = t % 2 ? f0 : f1, a = sr.range(0, TAU), r = Math.sqrt(sr()) * 30, x = c[0] + Math.cos(a) * r, z = c[1] + Math.sin(a) * r;
        if (!onLand(x, z, 7)) continue; const s = scl * sr.range(0.85, 1.2);
        put(herd, i++, x, H(x, z), z, sr.range(0, TAU), s, s, s, col.clone().multiplyScalar(sr.range(0.86, 1.0)), sr.range(0, 40), 0, hop * sr.range(0.7, 1.2), -1); herd.count = i;
      }
      scene.add(herd);
    }
    await ctx.yield();

    // ---- loose ends on the unpicked cloth we arrive over: cut loops of thread still standing in their holes, nodding
    {
      const cr = rng.fork('cut-threads'), n = Math.round(130 * clamp(dens, 0.7, 1.2));
      // (and the red road's own slack: LOOP_EVERY metres apart down both edges of the road cloth from the gateway to the railway's first tooth)
      const LOOP_EVERY = 7, LOOP0 = -40, LOOP1 = 150, nRoad = 2 * Math.ceil((LOOP1 - LOOP0) / LOOP_EVERY);
      const loops = inst(paint(new THREE.TorusGeometry(1, 0.11, 4, 8, Math.PI), C('#ffffff'), { tint: 1, ao: [-0.1, 0.5] }), felt, n + nRoad, 'cut-threads');
      const cols = [cCrimson, cCrimson, cCrimson, cCream, cGold.clone().lerp(cCream, 0.4), cGreen.clone().lerp(cCream, 0.3)]; let k = 0;
      for (let t = 0; k < n && t < n * 8; t++) {
        const d = cr.range(-70, BARE + 34), lat = cr.gauss() * 27, x = roadX(d) + lat, z = -d, y = H(x, z), big = cr.chance(0.15), s = cr.range(0.7, 1.9) * (big ? 1.6 : 1);
        // (every die of a loop is cast before it is tried, so the deal is the same whatever line we fly)
        const yaw = cr.range(0, TAU), tall = cr.range(0.5, 1.5), col = cr.pick(cols).clone().multiplyScalar(cr.range(0.85, 1.05)), ph = cr.range(0, TAU), roll = cr.range(-0.5, 0.5);
        if (Math.abs(lat) < 2.8 || !farFrom(x, y + 1, z, big ? 17 : 9)) continue;
        put(loops, k++, x, y - 0.06, z, yaw, s, s * tall, s, col, ph, 0.3, 0, -1, 0, roll);
      }
      // loops of the crimson thread standing along both edges of the road cloth, one every LOOP_EVERY metres with an offset of its
      // own, each turned roughly along the road like a slack running stitch; one nearer than 7 m to the flight is left out
      const lr = own('road-loops');
      for (const side of [-1, 1]) for (let i = 0, d0 = LOOP0 + lr.range(0, LOOP_EVERY); i < nRoad / 2; i++) {
        const d = d0 + i * LOOP_EVERY + lr.range(-1.5, 1.5), lat = side * lr.range(4.6, 6.4), s = lr.range(1.3, 2.6), tall = lr.range(0.8, 1.5), yaw = Math.PI / 2 + lr.range(-0.45, 0.45), sh = lr.range(0.88, 1.06), ph = lr.range(0, TAU), roll = lr.range(-0.35, 0.35);
        const x = roadX(d) + lat, z = -d, y = H(x, z);
        if (d > LOOP1 || !farFrom(x, y + s * tall * 0.6, z, 7)) continue;
        put(loops, k++, x, y - 0.06, z, yaw + Math.atan2(roadX(d) - roadX(d + 4), 4), s, s * tall, s, cCrimson.clone().multiplyScalar(sh), ph, 0.3, 0, -1, 0, roll);
      }
      loops.count = k; scene.add(loops);
    }
    // ---- soft cast shadows on the cloth: trees, cottages, church, windmill, and (moved every frame) the train
    const shadow = { mesh: null, n0: 0, set: null };
    {
      const ct = Math.min(1.5, 1 / Math.tan(litEl)), sd = V3(-litSun.x, 0, -litSun.z).normalize(), nrm = V3(), ax = V3(), az = V3(), e = 2;
      for (let i = 0; i < treeAt.length; i += 5) blobs.push([treeAt[i], treeAt[i + 1], treeAt[i + 2], 8.2 * treeAt[i + 3], 3.7 * treeAt[i + 3], treeAt[i + 4], 1]);
      const nS = blobs.length + nReels + 1, g = new THREE.CircleGeometry(1, 14).rotateX(-Math.PI / 2), iR = new Float32Array(nS * 2).fill(1);
      const mesh = new THREE.InstancedMesh(g, makeShadowMaterial({ uRip: U.uRip, uRoad: U.uRoad, uRoad2: U.uRoad2, uSewD: U.uSewD, uEdgeD: U.uEdgeD, uFogD: { value: L.fogD },
        uK: { value: L.lamp ? 0.36 : lookId === 'winter' ? 0.42 : 0.6 }, uShadeC: { value: new THREE.Color(...L.shade).multiplyScalar(0.24) } }), nS);
      mesh.name = 'cast-shadows'; mesh.frustumCulled = false; mesh.renderOrder = 1;
      shadow.set = (i, x, z, hgt, rad) => {
        const a = (hgt * ct + 1.6 * rad) / 2, off = a - 0.6 * rad, cx = x + sd.x * off, cz = z + sd.z * off;
        nrm.set(H(cx - e, cz) - H(cx + e, cz), 2 * e, H(cx, cz - e) - H(cx, cz + e)).normalize();
        ax.copy(sd).addScaledVector(nrm, -sd.dot(nrm)).normalize(); az.crossVectors(ax, nrm);
        mesh.setMatrixAt(i, _m.makeBasis(ax.multiplyScalar(a), nrm, az.multiplyScalar(rad * 1.05)).setPosition(cx, H(cx, cz) + 0.1, cz));
      };
      for (let i = 0; i < blobs.length; i++) { const b = blobs[i]; shadow.set(i, b[0], b[2], b[3], b[4]); iR[i * 2] = b[5]; iR[i * 2 + 1] = b[6]; if ((i & 63) === 63) await ctx.yield(); }
      g.setAttribute('iR', new THREE.InstancedBufferAttribute(iR, 2));
      shadow.mesh = mesh; shadow.n0 = blobs.length; scene.add(mesh);
    }
    await ctx.yield();

    // ---- the zipper railway and the safety-pin bridge that carries it over the ribbon river
    let pinD = RIVER; for (let k = 0; k < 8; k++) pinD = riverD(railX(pinD));
    U.uPinD.value = pinD;
    const deck = (d) => 2.3 * smoothstep(pinD - 34, pinD - 22, d) * (1 - smoothstep(pinD + 22, pinD + 34, d));
    const railPose = (d, out) => { const x = railX(d), x2 = railX(d + 2); out.pos.set(x, H(x, -d) + deck(d), -d); out.yaw = Math.atan2(-(x2 - x), 2); return out; };
    {
      const brass = cGold.clone().lerp(C('#C9A24A'), 0.5).multiplyScalar(1.05), tapeC = lookId === 'winter' ? C('#E6E6E2') : cBlue.clone().lerp(cLinen, 0.35).multiplyScalar(0.8);
      const mk = (base, step, name) => {
        const g = new THREE.InstancedBufferGeometry(); g.index = base.index; for (const k of ['position', 'normal', 'color']) g.setAttribute(k, base.attributes[k]);
        const arr = []; for (let d = 196; d < 1520; d += step) arr.push(d, 1, d, -1);
        g.setAttribute('iZ', new THREE.InstancedBufferAttribute(new Float32Array(arr), 2)); g.instanceCount = arr.length / 2;
        const m = new THREE.Mesh(g, zip); m.name = name; m.frustumCulled = false; scene.add(m);
      };
      mk(paint(box(0.6, 0.38, 0.6, 0.28, 0.19, 0), brass), 1.5, 'zip-teeth');
      mk(paint(box(1.7, 0.12, 4.3, 1.25, 0.0, 0), tapeC), 4.1, 'zip-tapes');
      // the safety pin: two steel bars, the sprung coil at one end and the clasp at the other, mirror-bright like the needle
      const pp = railPose(pinD, { pos: V3(), yaw: 0 }), parts = [];
      for (const s of [-1, 1]) parts.push(new THREE.CylinderGeometry(0.6, 0.6, 62, 10).rotateX(Math.PI / 2).translate(s * 2.9, 0, 0));
      parts.push(new THREE.TorusGeometry(2.9, 0.6, 8, 28).rotateX(Math.PI / 2).translate(0, 0, 31), new THREE.TorusGeometry(2.2, 0.6, 8, 28).rotateX(Math.PI / 2).translate(0, 0.9, 32.5));
      parts.push(new THREE.SphereGeometry(1, 14, 10).scale(4.3, 1.5, 3.4).translate(0, 0.2, -31.5));
      const pg = merge(parts.map((g) => paint(g, C('#ffffff')))); pg.deleteAttribute('color'); pg.deleteAttribute('aFx'); pg.translate(0, -300, 0);   // far below its origin so the needle's travelling flash never fires here
      const pin = new THREE.Mesh(pg, hero.object.getObjectByName('needle').material); pin.name = 'safety-pin'; pin.frustumCulled = false;
      pin.position.set(pp.pos.x, 300 + 1.15, pp.pos.z); pin.rotation.y = pp.yaw; scene.add(pin);
    }
    await ctx.yield();

    // ---- the reel train: a zip-slider locomotive with a swinging pull-tab, cotton-wool steam, and cotton reels
    const train = { n: nReels, reels: null, loco: null, tab: null, steam: null, pose: { pos: V3(), yaw: 0 } };
    {
      const tr = rng.fork('train'), brass = cGold.clone().lerp(C('#C9A24A'), 0.4), wood = cBrown.clone().lerp(cGold, 0.3).multiplyScalar(1.25);
      const taper = (g, k) => { const P = g.attributes.position; for (let i = 0; i < P.count; i++) { const z = P.getZ(i); if (z < 0) P.setX(i, P.getX(i) * (1 + z * k)); } return g; };
      const lg = [paint(taper(box(3.6, 0.6, 7.2, 0, 0.7, 0), 0.07), brass.clone().multiplyScalar(0.85)), paint(taper(box(2.7, 1.7, 5.4, 0, 1.85, -0.3), 0.1), brass, { ao: [0.8, 2.6] }),
        paint(box(0.9, 1.1, 2.6, 0, 3.2, -0.2), brass.clone().multiplyScalar(1.1)), paint(cyl(0.42, 0.55, 2.4, 0, 2.6, -2.4, 10), brass.clone().multiplyScalar(0.9)), paint(cyl(0.75, 0.5, 0.5, 0, 5.0, -2.4, 10), brass),
        paint(box(2.6, 2.1, 1.9, 0, 3.7, 2.3), cCrimson.clone().multiplyScalar(0.9), { ao: [2.6, 4.8] }), paint(box(2.9, 0.25, 2.3, 0, 4.85, 2.3), cCream.clone().multiplyScalar(0.9)), paint(box(0.3, 3.4, 0.3, 0, 5.3, 0.4), brass)];
      for (const s of [-1, 1]) lg.push(paint(box(0.12, 0.9, 1.0, s * 1.33, 3.9, 2.3), C('#F3C94F'), { emis: 1 }));
      train.loco = inst(merge(lg), felt, 1, 'zip-slider'); scene.add(train.loco);
      const tg = [paint(box(1.7, 3.0, 0.26, 0, -2.3, 0), brass.clone().multiplyScalar(1.05)), paint(new THREE.TorusGeometry(0.62, 0.17, 6, 14).translate(0, -0.45, 0), brass), paint(box(0.9, 1.3, 0.3, 0, -2.6, 0), brass.clone().multiplyScalar(0.6))];
      train.tab = inst(merge(tg), felt, 1, 'pull-tab'); scene.add(train.tab);
      await ctx.yield();
      // cotton reel: wooden flanges with turned rings and painted sectors (so the spin reads), thread wound on the core
      const rg = [];
      for (const s of [-1, 1]) {
        const fl = new THREE.CylinderGeometry(2.5, 2.5, 0.4, 16).rotateZ(Math.PI / 2).translate(s * 1.7, 0, 0);
        const p = paint(fl, wood), P = p.attributes.position, Cc = p.attributes.color;
        for (let i = 0; i < P.count; i++) { const a = Math.atan2(P.getZ(i), P.getY(i)), r = Math.hypot(P.getZ(i), P.getY(i)), k = (Math.floor((a + Math.PI) / TAU * 6 + 0.01) % 2 ? 0.72 : 1.05) * (r < 0.1 ? 0.6 : 1); Cc.setXYZ(i, Cc.getX(i) * k, Cc.getY(i) * k, Cc.getZ(i) * k); }
        rg.push(p, paint(new THREE.CylinderGeometry(0.55, 0.55, 0.3, 8).rotateZ(Math.PI / 2).translate(s * 2.0, 0, 0), wood.clone().multiplyScalar(0.6)));
      }
      const core = new THREE.CylinderGeometry(1.95, 1.95, 3.0, 18, 6).rotateZ(Math.PI / 2);
      { const P = core.attributes.position; for (let i = 0; i < P.count; i++) { const x = P.getX(i), k = 1 + 0.06 * Math.cos(x * 2.2) - 0.0 ; P.setY(i, P.getY(i) * k); P.setZ(i, P.getZ(i) * k); } core.computeVertexNormals(); }
      const cp = paint(core, C('#ffffff'), { tint: 1 }); { const P = cp.attributes.position, Cc = cp.attributes.color; for (let i = 0; i < P.count; i++) { const k = 0.82 + 0.18 * Math.abs(Math.sin(P.getX(i) * 9 + Math.atan2(P.getZ(i), P.getY(i)))); Cc.setXYZ(i, k, k, k); } }
      rg.push(cp);
      train.reels = inst(merge(rg), felt, nReels, 'cotton-reels'); scene.add(train.reels);
      const threadCols = tr.shuffle([cCrimson, cGold, cBlue, cGreen, C('#E58CA4'), cCream, C('#8E6FB0'), C('#E8862E')].map((c) => c.clone()));
      for (let i = 0; i < nReels; i++) put(train.reels, i, 0, -50, 0, 0, 1, 1, 1, lookId === 'winter' ? [cCrimson, C('#F4F4F0'), cGold.clone().lerp(C('#D9A441'), 0.8), C('#DCE8F4'), C('#F6DDE4'), C('#F4F4F0'), C('#BCD2E8')][i % 7] : threadCols[i], i, 0, 0, -1);
      train.steam = inst(paint(puff(ball(1, 0, 0, 0)), C('#ffffff'), { tint: 1 }), felt, 16, 'cotton-steam'); scene.add(train.steam);
    }
    await ctx.yield();

    // ---- on the river: sequins, and felt fish (or frogs) leaping in sequin-flashing arcs where we cross
    const leap = [], LEAP_RUN = 7, LEAP_UP = 3.6;                    // a leap: its length along the river and its height, metres
    let fishMesh = null;
    {
      const wr = rng.fork('river'), x0 = roadX(RIVER);
      const nS = Math.round(420 * dens), seq = inst(paint(new THREE.CircleGeometry(0.55, 6).rotateX(-Math.PI / 2), C('#ffffff'), { tint: 1, emis: 2 }), felt, nS, 'sequins');
      const sc = [C('#DCEBF4'), C('#F6E7B0'), cBlue.clone().lerp(C('#ffffff'), 0.4), C('#F3B6C4')];
      for (let i = 0; i < nS; i++) { const x = x0 + wr.range(-330, 330), d = riverD(x) + wr.range(-16, 16), s = wr.range(0.6, 1.5);
        put(seq, i, x, H(x, -d) + 0.3, -d, wr.range(0, TAU), s, s, s, wr.pick(sc), wr.range(0, TAU), 0, 0, -1, wr.range(-0.3, 0.3), wr.range(-0.3, 0.3)); }
      scene.add(seq);
      const frog = leapers === 'frogs', bodyC = frog ? C('#7FB85A') : wr.pick([C('#E8862E'), C('#E58CA4'), C('#F3C94F')]);
      const g = frog ? [paint(puff(ball(0.9, 0, 0, 0, 1, 0.7, 1.15)), C('#ffffff'), { tint: 1 }), paint(ball(0.26, 0.4, 0.5, 0.75, 1, 1, 1, 0), C('#FFFFFF'), { emis: 2 }), paint(ball(0.26, -0.4, 0.5, 0.75, 1, 1, 1, 0), C('#FFFFFF'), { emis: 2 }),
        paint(box(0.3, 0.2, 1.6, 0.8, -0.3, -0.9), C('#ffffff'), { tint: 1 }), paint(box(0.3, 0.2, 1.6, -0.8, -0.3, -0.9), C('#ffffff'), { tint: 1 })]
        : [paint(puff(ball(1, 0, 0, 0, 0.42, 0.75, 1.7)), C('#ffffff'), { tint: 1 }), paint(new THREE.ConeGeometry(0.9, 1.3, 3).rotateX(-Math.PI / 2).scale(0.2, 1, 1).translate(0, 0, -2.1), C('#ffffff'), { tint: 1 }),
          paint(box(0.08, 0.5, 0.9, 0, 0.8, -0.1), C('#ffffff'), { tint: 1 }), paint(ball(0.13, 0.33, 0.2, 1.1, 1, 1, 1, 0), C('#2A2A30'))];
      if (!frog) for (let k = 0; k < 5; k++) for (const s of [-1, 1]) g.push(paint(new THREE.CircleGeometry(0.2, 6).rotateY(s * Math.PI / 2).translate(s * (0.4 - Math.abs(k - 2) * 0.05), 0.1 * (k % 2), -0.9 + k * 0.42), C('#F6F0D8'), { emis: 2 }));
      fishMesh = inst(merge(g), felt, 12, 'leapers'); scene.add(fishMesh);
      // twelve leapers, from a stream of their own. Every die of a leaper is cast before it is tried; one is left out (and the next
      // tried in its place) if any part of its leap would come within LEAP_CLEAR metres of the line we fly: its arc is LEAP_RUN
      // metres long and rises LEAP_UP metres from 0.7 m under the water, and its body reaches 2.8 m from its middle at size 1
      const lw = own('river-leapers'), LEAP_CLEAR = 12;
      for (let t = 0; leap.length < 12 && t < 60; t++) {
        let x, lat; do { x = x0 + lw.range(-75, 75); lat = (x - x0) * sx; } while ((lat > -5 && lat < 24) || Math.abs(lat + 8) < 4);
        const f = { x, d: riverD(x) + lw.range(-12, 12), dir: lw.sign(), T: lw.range(2.0, 3.4), ph: lw.range(0, 4), s: lw.range(0.8, 1.25) * (frog ? 1 : 1.1), col: bodyC.clone().multiplyScalar(lw.range(0.8, 1.1)) };
        let clear = true;
        for (let j = 0; j <= 6 && clear; j++) clear = farFrom(f.x + (j / 6 - 0.5) * LEAP_RUN, H(f.x, -f.d) + Math.sin(Math.PI * j / 6) * LEAP_UP - 0.7, -f.d, LEAP_CLEAR + 2.8 * f.s + 0.5);   // (half a metre for the spacing of the route's samples)
        if (clear) leap.push(f);
      }
      fishMesh.count = leap.length;
    }

    // ---- swallows: twenty-four stitched Vs, each trailing eight running stitches
    {
      const br = rng.fork('swallows'), nLow = Math.max(10, Math.round(24 * clamp(dens, 0.7, 1.2))), nB = nLow + 12, base = new THREE.BufferGeometry();
      const pos = [], idx = []; for (const w of [-1, 1]) { const o = pos.length / 3; pos.push(w, 0, -1, w, 0, 1, w, 1, -1, w, 1, 1); idx.push(o, o + 1, o + 2, o + 1, o + 3, o + 2); }
      const g = new THREE.InstancedBufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx);
      const iA = new Float32Array(nB * 9 * 4), iB = new Float32Array(nB * 9 * 4), iSc = new Float32Array(nB * 9);
      for (let b = 0; b < nB; b++) {
        const high = b >= nLow;                                   // a second, higher flock wheels over the far half of the valley, across the upper frame
        const d = high ? br.range(700, 1300) : br.range(60, 1230), side = br.sign(), lat = high ? br.range(0, 90) : br.range(18, 110), x = roadX(d) + side * lat, y = H(x, -d) + (high ? br.range(58, 96) : br.range(16, 46)), ph = br.range(0, TAU);
        const rx = high ? br.range(70, 150) : br.range(26, 70), rz = high ? br.range(90, 180) : br.range(40, 95), sp = (high ? br.range(0.16, 0.28) : br.range(0.3, 0.55)) * br.sign(), sc = high ? br.range(1.5, 2.1) : 1;
        for (let k = 0; k < 9; k++) { iA.set([x, y, -d, ph], (b * 9 + k) * 4); iB.set([rx, rz, sp, k], (b * 9 + k) * 4); iSc[b * 9 + k] = sc; }
      }
      g.setAttribute('iA', new THREE.InstancedBufferAttribute(iA, 4)); g.setAttribute('iB', new THREE.InstancedBufferAttribute(iB, 4)); g.setAttribute('iSc', new THREE.InstancedBufferAttribute(iSc, 1)); g.instanceCount = nB * 9; base.dispose();
      const birds = new THREE.Mesh(g, makeSwallowMaterial({ uTime: U.uTime, uBirdC: { value: lookId === 'evening' ? C('#2A2230') : C('#34405E') } }));
      birds.name = 'swallows'; birds.frustumCulled = false; scene.add(birds);
    }

    // ---- the air: lint motes, bugle-bead rain or sequin snow
    const airU = { uTime: U.uTime, uMode: { value: precipMode }, uCamP: { value: V3() },
      uMoteC: { value: precipMode === 1 ? new THREE.Color(0.8, 0.9, 1.0).multiplyScalar(1.1) : precipMode === 2 ? new THREE.Color(1, 1, 1) : cCream.clone().lerp(C(L.glow), 0.5).multiplyScalar(L.lamp ? 1.5 : 1.02) } };
    {
      const ar = rng.fork('air'), n = Math.round((precipMode === 0 ? 700 : 1500) * dens), g = new THREE.InstancedBufferGeometry();
      const q = new THREE.PlaneGeometry(2, 2); g.index = q.index; g.setAttribute('position', q.attributes.position);
      const iS = new Float32Array(n * 4); for (let i = 0; i < n; i++) iS.set([ar(), ar(), ar(), ar.range(0.5, 1.5)], i * 4);
      g.setAttribute('iS', new THREE.InstancedBufferAttribute(iS, 4)); g.instanceCount = n;
      const air = new THREE.Mesh(g, makePrecipMaterial(airU)); air.name = 'air'; air.frustumCulled = false; air.renderOrder = 5; scene.add(air);
    }
    await ctx.yield();

    // ---- RARE: a caravan of five wool-roving mammoths plods along the far side of the valley; the last is unravelling into the thread
    let caravan = null;
    if (vary.rare) {
      const wool = (lookId === 'autumn' || lookId === 'evening' ? ['#D8CDBC', '#C9BCAA', '#E4DACA', '#BDB0A0', '#D2C6B6'] : lookId === 'winter' ? ['#8A6248', '#9C6E4C', '#74523E', '#A87A54', '#80604A'] : ['#9A6A48', '#B07A4E', '#7E5A44', '#C08A5A', '#8C6650']).map(C), g = [];
      const B = (r, x, y, z, sx_, sy_, sz_, o) => g.push(paint(puff(ball(r, x, y, z, sx_, sy_, sz_)), C('#ffffff'), { tint: 1, ...o }));
      B(4.2, 0, 6.3, 0, 0.85, 0.9, 1.35, { ao: [2.5, 9] }); B(2.7, 0, 9.4, 1.8, 0.9, 0.9, 1); B(2.6, 0, 8.4, 5.4, 0.9, 1.1, 0.95);
      for (let k = 0; k < 6; k++) B(1.05 - k * 0.11, 0, 6.6 - k * 1.0, 7.5 + Math.sin(k * 0.6) * 1.1, 1, 1.2, 1, { leg: () => 0.12 * k });
      for (const s of [-1, 1]) {
        for (let k = 0; k < 5; k++) g.push(paint(ball(0.42 - k * 0.05, s * (1.3 + k * 0.25), 6.4 - Math.sin(k * 0.7) * 1.6, 7.0 + k * 0.9, 1, 1, 1, 0), C('#F4EBD6')));
        g.push(paint(puff(ball(1.7, s * 2.5, 8.6, 4.6, 0.25, 1, 0.8)), C('#ffffff'), { tint: 1 }));
        for (const b of [-1, 1]) g.push(paint(cyl(1.0, 1.25, 5.4, s * 1.9, 0, b * 2.7, 8), C('#d8d8d8'), { tint: 1, leg: (x, y) => Math.max(0, (4.8 - y) / 4.8) * 1.1 * s * b }));
      }
      const mesh = inst(merge(g), felt, 5, 'mammoths'); for (let i = 0; i < 5; i++) put(mesh, i, 0, -80, 0, 0, 1, 1, 1, wool[i], i * 1.3, 0, 0, -1); scene.add(mesh);
      const beads = inst(paint(puff(ball(0.75, 0, 0, 0, 1, 1, 1.5)), C('#ffffff'), { tint: 1 }), felt, 40, 'roving'); scene.add(beads);
      caravan = { mesh, beads, wool: wool[4] };
    }

    // ---- the gathering knot: where the strands from the hills are wound into the one strand, a ball of crimson thread
    //      KNOT_R metres in radius that rides overhead behind the needle and turns as the thread is drawn through it
    const KNOT_R = 5;
    const knotBody = inst(paint(puff(new THREE.IcosahedronGeometry(0.5, 2).scale(1, 0.86, 1).translate(0, 0.3, 0)), C('#ffffff'), { tint: 1, emis: -1 }), felt, 1, 'gathering-knot');
    put(knotBody, 0, 0, -80, 0, 0, 1, 1, 1, cCrimson.clone().multiplyScalar(0.92), 0, 0, 0, -1); scene.add(knotBody);

    // ---- per-frame state
    const hoopD = -hoopC.z;
    // the needle's last leap, the one through the hoop: from the phase its point breaks the cloth to the phase it has gone through
    const lastLeap = Math.floor(hero.hoopPhase), throughHoop = hero.hoopClearPhase;
    // the stitching front keeps SEW_LEAD metres ahead of us down the road; from the unsewn edge on it draws away, to be SEW_RUN
    // metres further ahead by the hoop, the place the needle goes through
    const SEW_LEAD = 230, SEW_RUN = 260;
    const camP = V3(), rp = { pos: V3(), yaw: 0 }, gA = V3(), gM = V3(), tmpC = new THREE.Color();
    const flag = (m) => { m.instanceMatrix.needsUpdate = true; };
    const mound0 = A.mounds[0].center.clone().add(V3(0, 12, 0));

    // ---- where things are when we are a share u of the way: pure functions of u (and of the clock for what rocks on it).
    //      update() and the gaze both ask these, so the look at a place never depends on the frames that ran before it
    const _c = V3(), _g = V3();
    const roadDist = (u) => -path.pointAt(u, _c).z;                           // how far down the road we are
    const uAtRoad = (d) => { let lo = 0, hi = 1; for (let k = 0; k < 24; k++) { const m = (lo + hi) / 2; if (roadDist(m) < d) lo = m; else hi = m; } return lo; };
    // the needle stays about 200 m ahead of us down the road (so the strand it is laying never rises beside the lens), and has gone through the hoop before we reach it
    // at the gateway it is a third of a stitch further on than that, so that from there it is seen hanging mid-leap, rocking
    // (the rocking dies away over the gateway's approach: from the gateway to the road's first stitch)
    const needlePhase = (dc, u, time) => {
      const s0 = (dc + lead(dc, 0.3 * PITCH)) / PITCH - 0.1 + 0.07 * Math.sin(time * 0.8) * (1 - smoothstep(GATE, 0, dc)), si = Math.floor(s0), sf = s0 - si;
      // the buried part of each leap (fraction 0.88 .. 1.1) passes three times faster than the airborne part
      return Math.min(si + (sf < 0.914 ? 0.1 + sf * (0.78 / 0.914) : 0.88 + (sf - 0.914) * (0.22 / 0.086)), hero.hoopClearPhase);
    };
    // the reel train paces us on the zipper, then peels away round the foot of the hoop rise: how far down the rail its slider is
    // (trainRun), how far it has got up to speed (trainSpeed), and with its surging to and fro on the clock (trainDist)
    const trainRun = (dc) => { const x = dc - 160; return dc > 1010 ? 1065.4 + (dc - 1010) * 0.72 : 215 + 0.5 * (x + Math.sqrt(x * x + 1600)); };
    const trainSpeed = (dT) => smoothstep(216, 262, dT);
    const trainDist = (dc, time) => { const dT = trainRun(dc); return dT + 5 * Math.sin(time * 0.35) * trainSpeed(dT); };
    // where mammoth i of the caravan walks, and how big it is (the last one dwindles as it unravels)
    const mammothAt = (i, u, time, out) => {
      const k = clamp((roadDist(u) - GATE) / (hoopD - GATE), 0, 1);              // how far we are from the gateway to the hoop, by the road
      const d = 912 - k * 120 + i * 32, lx = roadX(d) + cl * (90 + 4 * Math.sin(i * 2.2)), sc = (i === 4 ? lerp(0.98, 0.6, k) : 1.05 - i * 0.03) * 1.8;
      out.set(lx, H(lx, -d) + 0.25 * Math.sin(time * 2.6 + i * 1.3) * sc, -d); return sc;
    };
    // what the gaze turns to, each worked out from u at the moment it is asked for.
    // The needle: a point that rides down the road with it at half its height, rising and sinking once a leap, and moving on
    // without a jump while the needle is under the cloth between two leaps
    const rpG = { pos: V3(), yaw: 0 };
    const lookNeedle = (time, u) => { const s = needlePhase(roadDist(u), u, time), f = s - Math.floor(s), k = Math.sin(Math.PI * clamp((f - 0.05) / 0.9, 0, 1)); hero.road(s * PITCH - 27, _g); _g.y += 17 + 31 * k * k; return _g; };
    const GROUND_AHEAD = 140;                                                 // the look onto the land falls this far ahead of us on the road
    const lookGround = (time, u) => { const d = roadDist(u) + GROUND_AHEAD; _g.set(roadX(d), 0, -d); _g.y = H(_g.x, _g.z) + 8; return _g; };
    const lookTrain = (time, u) => { railPose(trainDist(roadDist(u), time) - 24, rpG); return _g.copy(rpG.pos).setY(rpG.pos.y + 3); };   // the middle of the reel train
    const lookMammoth = (time, u) => { const sc = mammothAt(4, u, time, _g); _g.y += 9 * sc; _g.z += 20; return _g; };

    // A window of the gaze is given by two places, d0 and d1 metres down the road; it opens where we pass the first and closes
    // where we pass the second, and eases in and out over RAMP metres of road (the engine takes the ramp as a share of the window)
    const RAMP = 60, dIn = roadDist(0), dOut = roadDist(1);
    const win = (at, d0, d1, weight) => ({ at, from: d0 <= dIn ? 0 : uAtRoad(d0), to: d1 >= dOut ? 1 : uAtRoad(d1), weight,
      fade: clamp(RAMP / Math.max(Math.min(d1, dOut) - Math.max(d0, dIn), 1), 0, 0.5) });
    // The first flank hill is 160 m across and stands some 190 m off the road. We turn to it from HILL_IN metres before we are
    // abreast of it, where it is still well ahead (a third of a right angle off the road's line), until HILL_OUT metres before
    // abreast, where its near slope is about to pass abeam and the look is given back to the road
    const HILL_IN = 300, HILL_OUT = 100, dHill = -mounds[0].z;

    function update(dt, time, camera, u) {
      U.uTime.value = time;
      path.pointAt(u, camP); const dc = -camP.z;
      const s = needlePhase(dc, u, time), nd = s * PITCH;
      // the gathering knot closes up on the needle during the needle's last leap, so it is past the hoop when the needle is, and rests there
      hero.setPhase(s); hero.setGatherBack(lerp(KNOT_BACK, KNOT_REST, smoothstep(lastLeap, throughHoop, s))); hero.setUnravel(unravelAt(dc)); hero.setFinalTaut(smoothstep(hero.hoopPhase, throughHoop, s));   // and the last stitch is drawn tight as the needle is pulled through the hoop: from its point entering to its eye leaving
      hero.update(dt, time, camera);
      { const G = hero.gather; put(knotBody, 0, G.x, G.y - 0.6 * KNOT_R, G.z, s * 2.1, 2 * KNOT_R, 2 * KNOT_R, 2 * KNOT_R, null, 0, 0, 0, -1); flag(knotBody); }
      U.uNeedleD.value = nd; U.uFrontD.value = dc + 150;
      // beyond the unsewn edge the land is sewn outward from the red stitches just laid
      U.uSewD.value = dc + SEW_LEAD + SEW_RUN * smoothstep(EDGE, hoopD, dc);          // the front crosses the whole valley a couple of hundred metres ahead of us, and runs on past the hoop as we close on it
      U.uLampP.value.set(camP.x, 0, camP.z - 24, 66);
      if (camera && camera.matrixWorld) airU.uCamP.value.setFromMatrixPosition(camera.matrixWorld); else airU.uCamP.value.copy(camP);

      // the reel train paces us on the zipper, then peels away round the foot of the hoop rise
      const spd = trainSpeed(trainRun(dc)), dT = trainDist(dc, time);
      U.uTrainD.value = dT + 3.6;
      railPose(dT, rp); const ty = rp.pos.y + hero.rippleAt(rp.pos.x, rp.pos.z) * 0;
      U.uTrainP.value.set(rp.pos.x, ty, rp.pos.z);
      put(train.loco, 0, rp.pos.x, ty + 0.3 + 0.05 * Math.sin(time * 13), rp.pos.z, rp.yaw, 1, 1, 1, null, 0, 0, 0, -1, 0, 0.02 * Math.sin(time * 9));
      put(train.tab, 0, rp.pos.x + Math.sin(rp.yaw) * 0.75, ty + 7.0, rp.pos.z + Math.cos(rp.yaw) * 0.75, rp.yaw, 1, 1, 1, null, 0, 0, 0, -1, 0, 0.55 * Math.sin(time * 3.3) * (0.4 + 0.6 * spd) + 0.12 * Math.sin(time * 7.7));
      flag(train.loco); flag(train.tab);
      for (let i = 0; i < train.n; i++) {
        const d = dT - 8.6 - i * 6.5; railPose(d, rp);
        put(train.reels, i, rp.pos.x, rp.pos.y + 2.95 + 0.14 * Math.abs(Math.sin(time * 11 + i * 2.1)) * spd, rp.pos.z, rp.yaw, 1, 1, 1, null, i, 0, 0, -1, -d / 2.5, 0.03 * Math.sin(time * 6 + i));
      }
      flag(train.reels);
      railPose(dT, rp); shadow.set(shadow.n0, rp.pos.x, rp.pos.z, 4.5, 3.2);
      for (let i = 0; i < train.n; i++) { railPose(dT - 8.6 - i * 6.5, rp); shadow.set(shadow.n0 + 1 + i, rp.pos.x, rp.pos.z, 4.6, 2.5); }
      flag(shadow.mesh);
      for (let k = 0; k < 16; k++) {
        const ph = (time * 0.5 + k / 16) % 1, d = dT + 2.4 - ph * (6 + 44 * spd); railPose(d, rp);
        const sc = (0.5 + 1.5 * ph) * (1 - smoothstep(0.8, 1, ph)) * smoothstep(0, 0.06, ph);
        put(train.steam, k, rp.pos.x + cl * ph * ph * 6 + Math.sin(k * 2.4) * ph * 2.5, rp.pos.y + 6.2 + ph * (5 + 6 * spd) + Math.abs(Math.sin(ph * 10 + k * 1.7)) * 2.6 * (1 - ph), rp.pos.z, k, sc, sc, sc, k === 0 ? cCream : null, k, 0, 0, -1);
      }
      flag(train.steam);

      // windmill, leapers
      put(sails, 0, millAt.x + sx * 3.9, millAt.y, millAt.z + 0.6, sx * Math.PI / 2 - 0.15 * sx, 1, 1, 1, null, 0, 0, 0, -1, 0, time * TAU / 6); flag(sails);
      for (let i = 0; i < leap.length; i++) {
        const f = leap[i], t = ((time + f.ph) / f.T) % 1, a = t / 0.44;
        if (a >= 1) { put(fishMesh, i, f.x, -30, -f.d, 0, 0.001, 0.001, 0.001, f.col, i, 0, 0, -1); continue; }
        const hx = (a - 0.5) * LEAP_RUN * f.dir, hy = Math.sin(Math.PI * a) * LEAP_UP - 0.7, vy = Math.cos(Math.PI * a) * LEAP_UP * Math.PI, vx = LEAP_RUN;
        put(fishMesh, i, f.x + hx, H(f.x, -f.d) + hy, -f.d, f.dir * Math.PI / 2, f.s, f.s, f.s, f.col, i, 0, 0, -1, -Math.atan2(vy, vx), Math.sin(a * 9) * 0.3);
      }
      flag(fishMesh); fishMesh.geometry.attributes.iCol.needsUpdate = true;

      if (caravan) {
        let tail = null;
        for (let i = 0; i < 5; i++) {
          const sc = mammothAt(i, u, time, gM), lx = gM.x, y = gM.y, d = -gM.z, yaw = Math.atan2(roadX(d - 4) - roadX(d), 4);
          put(caravan.mesh, i, lx, y, -d, yaw, sc, sc, sc, null, i * 1.3, 0, 0, -1, 0.025 * Math.sin(time * 2.6 + i), 0.02 * Math.sin(time * 1.3 + i));
          if (i === 4) tail = gA.set(lx, y + 6.2 * sc, -d - 5.6 * sc);
        }
        flag(caravan.mesh);
        const G = hero.gather; gM.lerpVectors(tail, G, 0.3); gM.y = tail.y + 34;
        const ic = caravan.beads.geometry.attributes.iCol;
        for (let k = 0; k < 40; k++) {
          const t = ((k + time * 1.4) % 40) / 40, a = (1 - t) * (1 - t), b = 2 * t * (1 - t), c = t * t, sc = lerp(1.5, 1.0, t) * smoothstep(0, 0.04, t) * (1 - smoothstep(0.96, 1, t));
          const tx = 2 * ((1 - t) * (gM.x - tail.x) + t * (G.x - gM.x)), tyy = 2 * ((1 - t) * (gM.y - tail.y) + t * (G.y - gM.y)), tz = 2 * ((1 - t) * (gM.z - tail.z) + t * (G.z - gM.z)), tl = Math.hypot(tx, tyy, tz) || 1;
          put(caravan.beads, k, a * tail.x + b * gM.x + c * G.x + Math.sin(t * 20 + time * 2) * 0.6, a * tail.y + b * gM.y + c * G.y, a * tail.z + b * gM.z + c * G.z, Math.atan2(tx, tz), sc, sc, tl / 40 / 2.1,
            tmpC.copy(caravan.wool).lerp(cCrimson, smoothstep(0.12, 0.55, t)), k, 0, 0, -1, -Math.asin(clamp(tyy / tl, -1, 1)));
        }
        flag(caravan.beads); ic.needsUpdate = true;
      }
    }
    update(0, 0, null, 0);

    return {
      scene, path,
      duration: 44,
      ride: 'none',
      style: 'none',                                   // embroidery is the style: no lens on top
      camera: { fov: 62, near: 0.3, nearThrough: 0.3, far: 6500, lookAhead: 30, sway: 0.6, bank: 0.2 },
      // every window of the gaze opens and closes where we pass a place of the country (see win)
      pois: [
        win(lookNeedle, dIn, dTop, 0.3),                                    // from the gateway to the top of the first climb: the needle hanging ahead
        win(mound0, dHill - HILL_IN, dHill - HILL_OUT, 0.4),                // the first flank hill being pulled out row by row, while it stands ahead of us
        win(lookNeedle, dTop, -vil.z, 0.5),                                 // from the top of the climb to where we leave the road, level with the village: the strand overhead round to the needle mid-leap
        win(lookTrain, dCross, dBank + 20, 0.4),                            // from where we cross the railway until the river is crossed: the reels
        win(lookNeedle, dBank, dF, 0.3),                                    // from the river back to the hoop's line, over the road and the unsewn edge: the chase
        ...(caravan ? [win(lookMammoth, dBank, EDGE, 0.4)] : []),           // from the river to the unsewn edge: the caravan
        win(lookGround, EDGE - GROUND_AHEAD, RISE_FOOT, 0.35),              // from where that look first falls beyond the unsewn edge to the foot of the hoop's rise: the new land as it is sewn in
        win(hoopC.clone(), EDGE, dOut, 0.55),                               // from the unsewn edge on: the hoop
      ],
      portal: { shape: 'circle', radius: 7, color: L.lamp ? '#ffcf8a' : '#fff0d0', glow: 0.9, revealDistance: 320 },
      post: {
        exposure: L.exposure * 0.84,
        bloom: { strength: 0.34, radius: 0.6, threshold: 0.92 },
        grade: { saturation: L.sat, contrast: 1.04, tint: L.tint, shadowTint: L.lamp ? '#241a26' : '#1a1626', vignette: 0.3, grain: 0.035, aberration: 0 },
      },
      update,
      dispose() { hero.dispose(); },
    };
  },
};
