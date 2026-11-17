// THE WEB: hero set piece of "dew-garden".
//
// An orb web 46 m across strung between two giant foxglove stems 55 m apart (the garden is built
// at 100x scale). It stands in the local XY plane (z = 0) and faces +Z, the side the camera comes
// from; the sun is expected directly behind it (local -Z, low). Open hub 16 m across, 36 radial
// threads, a 15 m band of 28 spiral turns, about 6000 dew drops beaded on every thread, each a
// small lens holding an inverted garden and sun. Rainbow glints slide along the silk as the camera
// moves; every 6 s one drop lets go, falls, and a tremor runs outward through the web.
//
// SIZE     radius ~38 m (stems at x = +-27.5, leaf rosettes reach ~40), height ~62 m.
//          Hub centre at (0, hubHeight, 0), default hubHeight 26 (web bottom needs ~2 m of air).
// COST     ~54k triangles, 4 draw calls (two foxgloves, silk, dew), 0 lights, 0 textures, ~150 ms build
//          in steps of a few milliseconds (it yields inside each foxglove).
// LIGHTING Self-lit: all three materials are custom shaders using their own sun direction/colour and
//          sky/ground ambient (they ignore scene lights) and honour scene fog (Fog or FogExp2).
//          They expect a low sun BEHIND the web: default opts.sunDir = (0, 0.2, -1) in local space.
//          Put the world's sky sun there and add bloom (drops and glints emit 2-8).
//
// OPTS     palette    array of 7 hex strings (brief order: sun/mist, lime, grass, deep green, soil,
//                     dew white, accent). Accent tints the foxglove bells.
//          hubHeight  height of the hub centre above the base (default 26)
//          sunDir     [x,y,z] local direction TOWARD the sun (default [0, 0.2, -1])
//          sunColor   hex (default palette[0])
//          drops      target number of dew drops on the web (default 6000)
//          period     seconds between falling drops (default 6)
//          scale      the whole piece larger or smaller (default 1): sets object.scale, and silk and beads grow with it;
//                     hubHeight and the anchors stay in local units, so the hub stands at scale * hubHeight above the base
//          sky        [horizon, overhead] hex colours of the sky the drops hold (default a plain morning blue)
//
// ANCHORS  (all local space)
//   portalSeat   { position, normal, radius }  centre of the open hub; a 14 m portal (radius 7) fits
//                inside the 8 m hub ring with the radial threads converging on it. normal = +Z.
//   hubRadius    8
//   flyThrough   ordered Vector3s: a straight, level line down the clearing and through the hub
//                (z = 170 -> -40 at hub height). Nothing of the piece is within 7 m of it.
//   approachDir  (0,0,-1) direction of travel along flyThrough
//   viewpoints   { reveal, mid, close, oblique } good camera positions, all looking at `center`
//   damselCross  two [from, to] lines 25-35 m in front of the web for the damselflies to cross
//   stemBases / stemTops   the two foxgloves (for placing terrain, moss, grass around them)
//   sunDir       the local direction toward the sun the shaders are using
//   fallingDrop  Vector3 updated every frame: position of the drop that is currently falling
//
// HOOKS    hero.setProgress(u)  0..1 over the final approach (world sets it from path u). Raises
//                               the sparkle gain and sends ripples out from the hub as the camera
//                               closes on the portal. Never driven by wall-clock time.
//          hero.setSun(dirLocal, colorHex)   re-aim the back-light at any time.
//          hero.uniforms                     shared uniforms (uGain, uWind, ...) for fine tuning.
import * as THREE from 'three';
import { clamp, lerp, smoothstep } from '../kit/core.js';

const DEFAULT_PALETTE = ['#ffe6b8', '#bfe3a0', '#5f9e3a', '#2e5a22', '#3a2a1a', '#e8f4ff', '#ff5a7a'];
const TAU = Math.PI * 2;
const V3 = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);

// ------------------------------------------------------------------ shared GLSL
const GLSL_FOG_FACTOR = /* glsl */`
  float fogF() {
    #ifdef USE_FOG
      #ifdef FOG_EXP2
        return 1.0 - exp(-fogDensity * fogDensity * vFogDepth * vFogDepth);
      #else
        return smoothstep(fogNear, fogFar, vFogDepth);
      #endif
    #else
      return 0.0;
    #endif
  }`;

const GLSL_SWAY = /* glsl */`
  vec3 floraSway(vec3 q, float s) {
    vec3 p = q;
    p.x += s * (sin(uTime * 0.8 + q.y * 0.11) * 0.35 + sin(uTime * 2.1 + q.y * 0.4 + q.z) * 0.08);
    p.z += s * (sin(uTime * 0.63 + q.y * 0.09 + 1.7) * 0.3);
    p.y += s * sin(uTime * 1.3 + q.x * 0.3) * 0.08;
    return p;
  }`;

// Out-of-plane motion of the web: breeze billow, the tremor ring from the falling drop and the
// hub ripples driven by setProgress(). `pin` is 0 at the anchors and 1 in the free middle.
const GLSL_WEB_DISP = /* glsl */`
  uniform float uTime;
  uniform vec4 uTremor;   // xy origin in the web plane, z seconds since release, w strength
  uniform vec3 uHub;      // xy hub centre, z pluck amount (progress driven)
  uniform float uWind;
  float gWave = 0.0;      // 0..1 where the tremor front is passing (drives a flash of sparkle)
  vec3 webDisp(vec3 p, float pin) {
    float d = distance(p.xy, uTremor.xy), t = uTremor.z;
    float front = d - t * 15.0;
    float w = sin(front * 1.5) * exp(-front * front * 0.035) * exp(-t * 0.45);
    w += sin(t * 10.0 - d * 0.3) * exp(-t * 1.3) * exp(-d * 0.07) * 0.6;
    w *= uTremor.w;
    gWave = exp(-front * front * 0.03) * exp(-t * 0.4) * uTremor.w * pin * step(0.02, t);
    float dh = distance(p.xy, uHub.xy);
    float hubW = sin(dh * 0.9 - uTime * 5.0) * uHub.z * exp(-dh * 0.04);
    w += hubW * 0.35; gWave += max(hubW, 0.0) * pin * 0.6;
    float breeze = sin(uTime * 0.55 + p.x * 0.06) * 0.32 + sin(uTime * 0.91 + p.y * 0.08 + 1.3) * 0.2
                 + sin(uTime * 2.3 + p.x * 0.21 + p.y * 0.17) * 0.05;
    return p + vec3(0.0, w * 0.3, w * 0.5 + breeze * uWind) * pin;
  }`;

const GLSL_HUE = /* glsl */`
  vec3 hue(float h) { return clamp(abs(fract(h + vec3(0.0, 0.6667, 0.3333)) * 6.0 - 3.0) - 1.0, 0.0, 1.0); }
  float hash11(float n) { return fract(sin(n * 127.1) * 43758.5453); }
  float hash21(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }`;

// ------------------------------------------------------------------ flora material
// Self-lit plant shader: sky/ground ambient, wrapped sun, back-light transmission through thin
// tissue and a bright rim when looking toward the sun. aLoc.z selects procedural detail:
// >= 0 foxglove bell (spots inside the lower lip), -2 leaf (veins), -3 moss (mottle), -1 plain.
function makeFloraMaterial(U) {
  return new THREE.ShaderMaterial({
    fog: true, side: THREE.DoubleSide, vertexColors: true,
    uniforms: { ...THREE.UniformsUtils.merge([THREE.UniformsLib.fog]), uTime: U.uTime, uWind: U.uWind, uSunDirW: U.uSunDirW,
      uSunCol: U.uSunCol, uSkyCol: U.uSkyCol, uGroundCol: U.uGroundCol, uSpotCol: U.uSpotCol },
    vertexShader: /* glsl */`
      attribute vec3 aLoc; attribute vec2 aData;
      uniform float uTime; uniform float uWind;
      varying vec3 vCol; varying vec3 vN; varying vec3 vW; varying vec3 vLoc; varying vec2 vData;
      #include <fog_pars_vertex>
      ${GLSL_SWAY}
      void main() {
        vCol = color; vLoc = aLoc; vData = aData;
        vec3 p = floraSway(position, aData.y * uWind);
        vec4 wp = modelMatrix * vec4(p, 1.0);
        vW = wp.xyz; vN = normalize(mat3(modelMatrix) * normal);
        vec4 mvPosition = viewMatrix * wp;
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uSunDirW, uSunCol, uSkyCol, uGroundCol, uSpotCol;
      varying vec3 vCol; varying vec3 vN; varying vec3 vW; varying vec3 vLoc; varying vec2 vData;
      #include <fog_pars_fragment>
      ${GLSL_HUE}
      void main() {
        vec3 N = normalize(vN); if (!gl_FrontFacing) N = -N;
        vec3 V = normalize(cameraPosition - vW), L = normalize(uSunDirW);
        vec3 alb = vCol; float thin = vData.x;
        if (vLoc.z >= 0.0) {                       // foxglove bell
          float t = vLoc.z, inside = gl_FrontFacing ? 0.0 : 1.0;
          float lower = smoothstep(0.05, 0.7, vLoc.y);
          vec2 g = vec2(atan(vLoc.x, abs(vLoc.y) < 1e-5 ? 1e-5 : vLoc.y) * 2.6, t * 7.0);
          vec2 c = floor(g), f = fract(g) - 0.5;
          vec2 o = (vec2(hash21(c), hash21(c + 7.3)) - 0.5) * 0.45;
          float dsp = length(f - o), sz = 0.12 + 0.14 * hash21(c + 3.1);
          float zone = lower * smoothstep(0.3, 0.55, t) * step(0.25, hash21(c + 1.7));
          float spot = (1.0 - smoothstep(sz, sz + 0.05, dsp)) * zone;
          float halo = (1.0 - smoothstep(sz + 0.08, sz + 0.2, dsp)) * zone;
          alb = mix(alb, mix(alb, vec3(0.78, 0.72, 0.7), 0.55), inside * (0.35 + 0.65 * lower));
          alb = mix(alb, vec3(0.8, 0.76, 0.74), halo * mix(0.25, 0.9, inside));
          alb = mix(alb, uSpotCol, spot * mix(0.62, 1.0, inside));
          alb *= 0.9 + 0.1 * sin(atan(vLoc.x, abs(vLoc.y) < 1e-5 ? 1e-5 : vLoc.y) * 10.0);
          alb *= mix(1.0, 0.35 + 0.65 * smoothstep(0.25, 0.95, t), inside);
          thin *= mix(1.0, 0.55 + 0.45 * t, inside);       // faint ribs
        } else if (vLoc.z < -1.5 && vLoc.z > -2.5) { // leaf veins
          float u = vLoc.x, v = vLoc.y;
          float side = abs(fract(v * 8.0 - abs(u) * 1.6) - 0.5) * 2.0;
          float vein = smoothstep(0.82, 1.0, side) * 0.6 + (1.0 - smoothstep(0.0, 0.07, abs(u)));
          float cell = abs(fract(v * 40.0 + u * 13.0) - 0.5) * abs(fract(u * 9.0 - v * 7.0) - 0.5);
          alb *= 0.86 + 0.5 * cell;
          alb = mix(alb, alb * 1.5 + vec3(0.03, 0.05, 0.0), clamp(vein, 0.0, 1.0) * 0.5);
        } else if (vLoc.z < -2.5) {                // moss
          vec2 q = vW.xz * 2.2; float m = hash21(floor(q)) * 0.5 + hash21(floor(q * 3.1)) * 0.5;
          alb *= 0.65 + 0.7 * m; thin *= m;
        }
        float ndl = dot(N, L);
        vec3 amb = mix(uGroundCol, uSkyCol, N.y * 0.5 + 0.5);
        vec3 col = alb * (amb + uSunCol * max(ndl * 0.8 + 0.2, 0.0) * 1.3);
        float toSun = max(dot(-V, L), 0.0);
        vec3 through = alb * (0.35 + 0.65 * alb) * uSunCol * max(-ndl, 0.0) * thin * (0.9 + 1.3 * toSun * toSun);
        col += through;
        float rim = pow(clamp(1.0 - dot(N, V), 0.0, 1.0), 3.0);
        col += mix(uSunCol, alb * 2.2, 0.6) * rim * (0.1 + 1.2 * toSun * toSun * toSun) * (0.35 + 0.65 * thin);
        gl_FragColor = vec4(col, 1.0);
        #include <fog_fragment>
      }`,
  });
}

// ------------------------------------------------------------------ mesh accumulator
function makeAcc() { return { p: [], c: [], l: [], d: [], i: [], n: 0 }; }
function vtx(a, x, y, z, col, lx, ly, lz, thin, sway) {
  a.p.push(x, y, z); a.c.push(col.r, col.g, col.b); a.l.push(lx, ly, lz); a.d.push(thin, sway);
  return a.n++;
}
function accToGeometry(a) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(a.p, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(a.c, 3));
  g.setAttribute('aLoc', new THREE.Float32BufferAttribute(a.l, 3));
  g.setAttribute('aData', new THREE.Float32BufferAttribute(a.d, 2));
  g.setIndex(a.i);
  g.computeVertexNormals();
  return g;
}
// computeVertexNormals of an indexed geometry, in steps (tick hands the page back): the same sums, a few thousand triangles at a time
export async function stepNormals(g, tick) {
  const pos = g.attributes.position.array, idx = g.index.array, n = new Float32Array(pos.length);
  for (let i = 0; i < idx.length; i += 3) {
    const a = idx[i] * 3, b = idx[i + 1] * 3, c = idx[i + 2] * 3;
    const cx = pos[c] - pos[b], cy = pos[c + 1] - pos[b + 1], cz = pos[c + 2] - pos[b + 2], ax = pos[a] - pos[b], ay = pos[a + 1] - pos[b + 1], az = pos[a + 2] - pos[b + 2];
    const x = cy * az - cz * ay, y = cz * ax - cx * az, z = cx * ay - cy * ax;
    n[a] += x; n[a + 1] += y; n[a + 2] += z; n[b] += x; n[b + 1] += y; n[b + 2] += z; n[c] += x; n[c + 1] += y; n[c + 2] += z;
    if (i % 3000 === 2997) await tick?.();
  }
  for (let i = 0; i < n.length; i += 3) {
    const l = Math.hypot(n[i], n[i + 1], n[i + 2]) || 1; n[i] /= l; n[i + 1] /= l; n[i + 2] /= l;
    if (i % 9000 === 8997) await tick?.();
  }
  g.setAttribute('normal', new THREE.BufferAttribute(n, 3));
}
const _c = new THREE.Color();
function mixCol(a, b, t, mul = 1) { return _c.copy(a).lerp(b, t).multiplyScalar(mul).clone(); }

// Tube swept along sample points with wrapped rings (smooth normals, no seam).
// pts: [{p:Vector3, r:number}], colFn(t, k) -> Color, extra {thin, swayFn(t), ridges}
function addTube(a, pts, sides, colFn, ex = {}) {
  const n = pts.length, T = V3(), N = V3(), B = V3(), ref = V3(0.13, 0.2, 0.97).normalize();
  const base = a.n;
  for (let j = 0; j < n; j++) {
    const p0 = pts[Math.max(0, j - 1)].p, p1 = pts[Math.min(n - 1, j + 1)].p;
    T.subVectors(p1, p0).normalize();
    N.crossVectors(T, ref).normalize(); B.crossVectors(T, N).normalize();
    const t = j / (n - 1), r = pts[j].r;
    for (let k = 0; k < sides; k++) {
      const an = (k / sides) * TAU, rr = r * (1 + (ex.ridges || 0) * Math.cos(an * (ex.ridgeN || 5)));
      const cx = Math.cos(an) * rr, sy = Math.sin(an) * rr;
      vtx(a, pts[j].p.x + N.x * cx + B.x * sy, pts[j].p.y + N.y * cx + B.y * sy, pts[j].p.z + N.z * cx + B.z * sy,
        colFn(t, k), 0, 0, -1, ex.thin ?? 0.15, ex.swayFn ? ex.swayFn(t) : 0);
    }
  }
  for (let j = 0; j < n - 1; j++) for (let k = 0; k < sides; k++) {
    const k1 = (k + 1) % sides, A = base + j * sides + k, Bq = base + j * sides + k1, C = A + sides, D = Bq + sides;
    a.i.push(A, Bq, C, Bq, D, C);
  }
}

// ------------------------------------------------------------------ foxglove
// One giant foxglove: ridged tapering stem with a nodding tip, basal rosette and stem leaves,
// a one-sided raceme of spotted bells shrinking to buds, on a moss cushion.
// Returns { stemAt(t) -> Vector3, radiusAt(t), height, tips: [{p, r}] } (tips = places for hanging dew).
// One corolla (and its calyx): bb = where the pedicel ends, A = the axis from the base to the mouth, Dn = the side of the
// lower lip, S = across. open 1 = an open bell, 0 = a closed bud. Shared by the racemes and by the bells caught in the Web.
function addCorolla(a, col, bb, A, Dn, S, L, open, tint, pale, sway = 1, ns = 14, nr = 11) {
  const first = a.n, cen = V3(), q = V3();
  for (let j = 0; j < nr; j++) {
    const tt = j / (nr - 1);
    const rOpen = 0.07 + 0.165 * smoothstep(0, 0.42, tt) + 0.085 * Math.pow(smoothstep(0.68, 1, tt), 1.6);
    const rBud = 0.06 + 0.15 * Math.sin(Math.PI * Math.pow(tt, 0.7)) - 0.03 * tt;
    const flare = smoothstep(0.66, 1, tt) * open;
    cen.copy(bb).addScaledVector(A, tt * L).addScaledVector(Dn, 0.12 * L * tt * tt);
    for (let k = 0; k < ns; k++) {
      const ph = (k / ns) * TAU, cp = Math.cos(ph), sn = Math.sin(ph);
      let r = L * lerp(rBud, rOpen, open) * (1 + 0.1 * Math.cos(ph * 4 + 0.6) * flare);
      const belly = 1 + 0.16 * Math.max(cp, 0) * Math.sin(Math.PI * Math.min(1, tt * 1.1));
      const lip = L * 0.2 * Math.pow(Math.max(cp, 0), 1.5) * flare - L * 0.05 * Math.max(-cp, 0) * flare;
      q.copy(cen).addScaledVector(Dn, cp * r * belly).addScaledVector(S, sn * r).addScaledVector(A, lip)
        .addScaledVector(Dn, 0.06 * L * flare * flare * Math.max(cp, 0));
      // calyx green -> pale throat -> accent -> lighter lip; buds stay greener
      let cc = mixCol(col.cream, col.accent, smoothstep(0.08, 0.42, tt) * (1 - pale) * (0.86 + 0.14 * Math.max(-cp, 0)), tint);
      cc = mixCol(cc, col.cream, 0.22 * smoothstep(0.88, 1, tt) * open);
      cc = mixCol(cc, col.bud, (1 - open) * (0.75 - 0.5 * tt));
      cc = mixCol(cc, col.calyx, 1 - smoothstep(0.05, 0.2, tt));
      vtx(a, q.x, q.y, q.z, cc, sn, cp, tt, 0.95, (0.45 + 0.55 * tt) * sway);
    }
  }
  for (let j = 0; j < nr - 1; j++) for (let k = 0; k < ns; k++) {
    const k1 = (k + 1) % ns, Aq = first + j * ns + k, B = first + j * ns + k1;
    a.i.push(Aq, Aq + ns, B, B, Aq + ns, B + ns);
  }
  return cen;       // the centre of the mouth
}

// P.bias = the azimuth the raceme faces (default: a little toward the Web), P.leafK = how long the rosette leaves are,
// P.free = it stands alone, so its leaves may point anywhere, P.lite = the upper bells and the buds in fewer facets.
async function addFoxglove(a, rng, noise, P, tick) {
  const { bx, H, sideSign, col } = P;
  const leanX = rng.range(-1.6, 1.6) + sideSign * 0.8, leanZ = rng.range(-0.6, 0.6);
  const nod = rng.range(3.5, 6.5), bowPh = rng.range(0, TAU);
  const stemAt = (t, out = V3()) => {
    const k = Math.max(0, t - 0.86) / 0.14;
    return out.set(
      bx + leanX * t * t + Math.sin(t * 5.0 + bowPh) * 0.35 * t,
      H * (t - 0.035 * k * k),
      leanZ * t * t + nod * k * k);
  };
  const radiusAt = (t) => lerp(1.0, 0.17, Math.pow(t, 0.75)) * (1 + 0.5 * Math.exp(-t * 30));
  const purple = new THREE.Color('#4a2a3a');

  // stem
  const sp = [];
  for (let j = 0; j <= 44; j++) { const t = j / 44; sp.push({ p: stemAt(t), r: radiusAt(t) }); }
  addTube(a, sp, 10, (t, k) => {
    const n = noise.n2(t * 23 + bx, k * 0.9) * 0.5 + 0.5;
    return mixCol(mixCol(col.deep, col.grass, 0.25 + 0.5 * t + 0.25 * n), purple, 0.35 * smoothstep(0.3, 0.9, t) * n, 0.75 + 0.3 * n);
  }, { ridges: 0.07, ridgeN: 5, thin: 0.25 });

  // moss cushion
  {
    const R = rng.range(5.5, 7.5), Hm = rng.range(1.3, 2.1), rings = 8, sides = 22, ox = rng.range(-1, 1), oz = rng.range(-1, 1);
    const top = vtx(a, bx + ox, Hm, oz, mixCol(col.grass, col.lime, 0.3, 0.7), 0, 0, -3, 0.5, 0);
    const base = a.n;
    for (let j = 1; j <= rings; j++) for (let k = 0; k < sides; k++) {
      const u = j / rings, an = (k / sides) * TAU;
      const rr = R * u * (1 + 0.22 * noise.n2(Math.cos(an) * 1.3 + bx, Math.sin(an) * 1.3 + u));
      const x = bx + ox + Math.cos(an) * rr, z = oz + Math.sin(an) * rr;
      const bump = noise.fbm2(x * 0.45, z * 0.45, 3);
      const y = Math.max(-0.3, Hm * Math.pow(Math.cos(u * Math.PI * 0.5), 0.7) * (1 + 0.35 * bump) + 0.35 * bump * (1 - u) - 0.3 * u * u);
      vtx(a, x, y, z, mixCol(mixCol(col.deep, col.grass, 0.5 + 0.5 * bump), col.soil, smoothstep(0.75, 1, u) * 0.7, 0.6 + 0.25 * bump), 0, 0, -3, 0.5, 0);
    }
    for (let k = 0; k < sides; k++) a.i.push(top, base + (k + 1) % sides, base + k);
    for (let j = 0; j < rings - 1; j++) for (let k = 0; k < sides; k++) {
      const k1 = (k + 1) % sides, A = base + j * sides + k, B = base + j * sides + k1;
      a.i.push(A, B, A + sides, B, B + sides, A + sides);
    }
  }

  const tips = [];
  const up = V3(0, 1, 0), out = V3(), Sd = V3(), T = V3(), Nl = V3(), c0 = V3(), c1 = V3(), q = V3();

  // leaves
  const addLeaf = (base, ang, L, W, rise, dTip, twist, shade) => {
    out.set(Math.sin(ang), 0, Math.cos(ang));
    const nu = 6, nv = 12, ph = rng.range(0, TAU), fold = rng.range(0.22, 0.4), first = a.n;
    const centre = (v, o) => o.copy(base).addScaledVector(out, L * v * Math.cos(rise))
      .addScaledVector(up, L * (Math.sin(rise) * v - (Math.sin(rise) * 0.9 + dTip) * v * v));
    for (let j = 0; j <= nv; j++) {
      const v = j / nv; centre(v, c0); centre(v + 0.02, c1); T.subVectors(c1, c0).normalize();
      Sd.crossVectors(up, out).normalize();
      Sd.applyAxisAngle(T, twist * v);
      Nl.crossVectors(Sd, T).normalize();
      const w = W * 0.5 * Math.pow(Math.sin(Math.PI * Math.pow(v, 0.72)), 0.85) + 0.12 * (1 - v);
      for (let i = 0; i <= nu; i++) {
        const u = (i / nu) * 2 - 1, au = Math.abs(u);
        const lift = au * w * fold + Math.sin(v * 17 + ph + u * 2) * 0.09 * w * u * u - 0.25 * w * au * au * v;
        q.copy(c0).addScaledVector(Sd, u * w).addScaledVector(Nl, lift);
        if (q.y < 0.3) q.y = 0.3 + (q.y - 0.3) * 0.1;
        const n = noise.n2(q.x * 0.5, q.z * 0.5 + q.y * 0.3) * 0.5 + 0.5;
        const cc = mixCol(mixCol(col.deep, col.grass, 0.35 + 0.45 * v + 0.2 * n), col.lime, 0.25 * (1 - au) * n, shade * (0.8 + 0.25 * n - 0.12 * au));
        vtx(a, q.x, q.y, q.z, cc, u, v, -2, 0.9, 0.5 * v * v);
        if (i === nu / 2 && j === nv) tips.push({ p: q.clone(), r: rng.range(0.22, 0.42), kind: 'leaf' });
      }
    }
    for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) {
      const A = first + j * (nu + 1) + i, B = A + 1, C = A + nu + 1, D = C + 1;
      a.i.push(A, B, C, B, D, C);
    }
  };
  const inward = sideSign > 0 ? -Math.PI / 2 : Math.PI / 2;   // azimuth pointing at the web centre
  const okAng = (ang) => { if (P.free) return true; let d = Math.atan2(Math.sin(ang - inward), Math.cos(ang - inward)); return Math.abs(d) > 0.62; };
  const leafK = P.leafK ?? 1;
  const nBasal = rng.int(8, 10), a0 = rng.range(0, TAU);
  for (let i = 0; i < nBasal; i++) {
    await tick?.();
    let ang = a0 + (i / nBasal) * TAU + rng.range(-0.2, 0.2);
    if (!okAng(ang)) ang += (rng.chance(0.5) ? 1 : -1) * 0.75;
    const b = stemAt(0.012 + 0.012 * (i % 3)); b.x += Math.sin(ang) * 0.8; b.z += Math.cos(ang) * 0.8;
    addLeaf(b, ang, rng.range(13, 19) * leafK, rng.range(4.6, 6.6) * leafK, rng.range(0.55, 0.95), rng.range(0.0, 0.05), rng.range(-0.5, 0.5), rng.range(0.85, 1.05));
  }
  const nStemLeaves = rng.int(5, 7);
  for (let i = 0; i < nStemLeaves; i++) {
    await tick?.();
    const t = 0.07 + (i / nStemLeaves) * 0.25 + rng.range(-0.01, 0.01);
    let ang = a0 + i * 2.4 + rng.range(-0.3, 0.3);
    if (!okAng(ang)) ang += Math.PI * 0.6;
    if (!okAng(ang)) ang += Math.PI * 0.6;
    const b = stemAt(t); const r = radiusAt(t) * 0.8; b.x += Math.sin(ang) * r; b.z += Math.cos(ang) * r;
    const s = 1 - i / nStemLeaves * 0.45;
    addLeaf(b, ang, rng.range(8, 11) * s, rng.range(2.6, 3.6) * s, rng.range(0.5, 0.85), rng.range(0.1, 0.3), rng.range(-0.6, 0.6), rng.range(0.9, 1.1));
  }

  // bells
  const A = V3(), Dn = V3(), S = V3(), cen = V3(), bb = V3(), sP = V3();
  const nb = rng.int(40, 46), t0 = 0.37, t1 = 0.965, bias = P.bias ?? sideSign * 0.4;
  await tick?.();
  for (let i = 0; i < nb; i++) {
    await tick?.();
    const f = i / (nb - 1), t = lerp(t0, t1, Math.pow(f, 0.92));
    const open = 1 - smoothstep(0.72, 0.9, f);                 // 1 = open bell, 0 = closed bud
    const az = bias + (((i * 0.618034 + P.phase) % 1) - 0.5) * 2 * lerp(1.15, 0.7, f) + rng.range(-0.12, 0.12);
    const L = lerp(5.4, 1.5, Math.pow(f, 1.15)) * rng.range(0.9, 1.1);
    const droop = lerp(rng.range(0.55, 0.85), rng.range(-0.25, 0.25), 1 - open);
    out.set(Math.sin(az), 0, Math.cos(az));
    stemAt(t, sP); const sr = radiusAt(t);
    A.copy(out).multiplyScalar(Math.cos(droop)).addScaledVector(up, -Math.sin(droop)).normalize();
    Dn.copy(up).multiplyScalar(-1).addScaledVector(A, A.y).normalize();
    S.crossVectors(A, Dn).normalize();
    // pedicel
    bb.copy(sP).addScaledVector(out, sr + 0.22 * L).addScaledVector(up, 0.1 * L);
    const pc = mixCol(col.deep, col.grass, 0.6, 0.8);
    addTube(a, [
      { p: sP.clone().addScaledVector(out, sr * 0.7), r: 0.07 * L * 0.5 + 0.05 },
      { p: sP.clone().addScaledVector(out, sr + 0.1 * L).addScaledVector(up, 0.09 * L), r: 0.045 * L * 0.5 + 0.04 },
      { p: bb.clone().addScaledVector(A, 0.02 * L), r: 0.07 * L },
    ], 5, () => pc, { thin: 0.2, swayFn: (tt) => 0.4 * tt });
    // corolla
    const tint = rng.range(0.8, 1.1), pale = rng.range(0, 0.18) + (P.blush || 0);
    if (P.lite) cen.copy(addCorolla(a, col, bb, A, Dn, S, L, open, tint, pale, 1, f > 0.7 ? 8 : f > 0.4 ? 10 : 12, f > 0.7 ? 6 : f > 0.4 ? 8 : 10));      // the small bells and the buds up the spire in fewer facets
    else cen.copy(addCorolla(a, col, bb, A, Dn, S, L, open, tint, pale));
    if (open > 0.9) tips.push({ p: cen.clone().addScaledVector(Dn, L * 0.3).addScaledVector(A, L * 0.2), r: rng.range(0.16, 0.34) * (0.6 + L / 9), kind: 'bell', f, L });
  }
  return { stemAt, radiusAt, height: H, tips };
}

// ------------------------------------------------------------------ web layout
// Builds every thread as a polyline in the z = 0 plane (plus guys that run to the stems), then
// turns them into camera-facing ribbon quads and beads them with dew.
async function buildWeb(rng, noise, P, tick) {
  const { hy, stems, nDrops } = P;
  const hx = 0, R0 = 8.0;
  const lines = [];                                   // { pts:[Vector3], width, rand, s0, kind, w }
  const pinOf = (p) => {
    const rho = Math.max(Math.abs(p.x - hx) / 25.0, Math.abs(p.y - hy) / 24.4);
    return (1 - smoothstep(0.5, 1.04, rho)) * (1 - smoothstep(0.0, 1.5, Math.abs(p.z)));
  };
  const subdiv = (a, b, step, sag = 0) => {
    const len = a.distanceTo(b), n = Math.max(1, Math.round(len / step)), out = [];
    for (let j = 0; j <= n; j++) { const t = j / n, q = a.clone().lerp(b, t); q.y -= sag * len * 4 * t * (1 - t); out.push(q); }
    return out;
  };
  // lod: 0 = always drawn; 1, 2 = spiral turns that fade in as the camera nears and the turns become wider apart than a pixel or two
  const addLine = (pts, width, kind, rand, s0 = 0, w = 1, lod = 0) => { lines.push({ pts, width, kind, rand, s0, w, lod, emph: kind === 'radial' ? 1.7 : kind === 'spiral' ? (lod === 0 ? 1 : lod === 1 ? 0.8 : 0.62) : 1.4 }); };

  // --- frame polygon: three attachment heights on each stem, sagging top and bottom spans
  const stemSurf = (st, y, sign) => {
    let t = clamp(y / st.height, 0, 1);
    for (let k = 0; k < 3; k++) t = clamp(t + (y - st.stemAt(t).y) / st.height, 0, 1);
    const p = st.stemAt(t); p.x += sign * st.radiusAt(t) * 0.85; return p;
  };
  const [SL, SR] = stems;
  const yTop = hy + 24.3, yBot = Math.max(1.9, hy - 24.0);
  const inL = (y, d) => { const p = stemSurf(SL, y, 1); p.x += d; p.z = 0; return p; };
  const inR = (y, d) => { const p = stemSurf(SR, y, -1); p.x -= d; p.z = 0; return p; };
  const j = () => rng.range(-2.2, 2.2);
  const BL = V3(-16 + j(), yTop + rng.range(-0.4, 0.5), 0), BR = V3(16 + j(), yTop + rng.range(-0.4, 0.5), 0);
  const FTM = V3(hx + rng.range(-4, 4), hy + 23.6, 0), FBM = V3(hx + rng.range(-4, 4), Math.max(2.3, hy - 23.6), 0);
  const AL1 = inL(hy + 14 + j(), 2.7), AL2 = inL(hy - 13 + j(), 2.7), AR1 = inR(hy + 14 + j(), 2.7), AR2 = inR(hy - 13 + j(), 2.7);
  const CL = V3(-15 + j(), yBot + rng.range(0, 0.5), 0), CR = V3(15 + j(), yBot + rng.range(0, 0.5), 0);
  const poly = [BL, FTM, BR, AR1, AR2, CR, FBM, CL, AL2, AL1];
  for (let i = 0; i < poly.length; i++) addLine(subdiv(poly[i], poly[(i + 1) % poly.length], 1.4, 0.004), 0.055, 'frame', rng(), 0, 0.5);
  // guys: every frame corner is moored to a stem by a small fan of threads; a bridge line above
  const guy = (from, to) => addLine(subdiv(from, to, 1.2, 0.012), 0.045, 'guy', rng(), 0, 0.45);
  const moor = (pt, st, sign, ys) => { for (const y of ys) guy(pt, stemSurf(st, y, sign)); };
  moor(BL, SL, 1, [hy + 28.2, hy + 24.5]); moor(BR, SR, -1, [hy + 28.2, hy + 24.5]);
  moor(AL1, SL, 1, [AL1.y + 2.4, AL1.y - 2.0]); moor(AR1, SR, -1, [AR1.y + 2.4, AR1.y - 2.0]);
  moor(AL2, SL, 1, [AL2.y + 2.0, AL2.y - 2.6]); moor(AR2, SR, -1, [AR2.y + 2.0, AR2.y - 2.6]);
  moor(CL, SL, 1, [4.6, 1.3]); moor(CR, SR, -1, [4.6, 1.3]);
  const brL = stemSurf(SL, hy + 30.5, 1), brR = stemSurf(SR, hy + 30.5, -1);
  const bridge = subdiv(brL, brR, 1.5, 0.014);
  addLine(bridge, 0.06, 'guy', rng(), 0, 0.5);
  const nearest = (x) => { let bm = bridge[0]; for (const q of bridge) if (Math.abs(q.x - x) < Math.abs(bm.x - x)) bm = q; return bm; };
  guy(FTM, nearest(FTM.x)); guy(BL, nearest(BL.x - 3)); guy(BR, nearest(BR.x + 3));

  // --- radials
  const NR = 36, th0 = rng.range(0, TAU), dirs = [], ends = [];
  const rayPoly = (dx, dy) => {
    let best = 60;
    for (let i = 0; i < poly.length; i++) {
      const a = poly[i], b = poly[(i + 1) % poly.length], ex = b.x - a.x, ey = b.y - a.y;
      const den = dx * ey - dy * ex; if (Math.abs(den) < 1e-6) continue;
      const t = ((a.x - hx) * ey - (a.y - hy) * ex) / den, s = ((a.x - hx) * dy - (a.y - hy) * dx) / den;
      if (t > 0 && s >= -0.001 && s <= 1.001 && t < best) best = t;
    }
    return best;
  };
  let minEnd = 99;
  for (let i = 0; i < NR; i++) {
    const th = th0 + ((i + rng.range(-0.22, 0.22)) / NR) * TAU;
    const d = { x: Math.cos(th), y: Math.sin(th) }; dirs.push(d);
    const e = rayPoly(d.x, d.y); ends.push(e); minEnd = Math.min(minEnd, e);
  }
  const R1 = Math.min(23.0, minEnd - 0.5), rS0 = R0 + 1.0, TURNS = 28, pitch = (R1 - rS0) / TURNS;
  const at = (i, r) => V3(hx + dirs[i].x * r, hy + dirs[i].y * r, 0);
  for (let i = 0; i < NR; i++) addLine(subdiv(at(i, R0), at(i, ends[i]), 1.3), 0.06, 'radial', rng(), 0, 0.8);

  // --- hub rings (the portal sits inside the inner one)
  for (const [rr, wd] of [[R0, 0.08], [R0 + 0.5, 0.04]]) {
    const pts = [];
    for (let i = 0; i <= NR; i++) { const s = subdiv(at(i % NR, rr), at((i + 1) % NR, rr), 0.8, 0.01); if (i < NR) pts.push(...s.slice(0, -1)); else pts.push(s[0]); }
    addLine(pts, wd, 'hub', rng(), 0, rr === R0 ? 1.6 : 1.0);
  }

  await tick?.();
  // --- sticky spiral: straight sagging chords from radial to radial, a few torn patches
  const tears = [], nT = rng.int(0, 2);
  for (let k = 0; k < nT; k++) tears.push({ i0: rng.int(0, NR - 1), span: rng.int(2, 3), t0: rng.int(8, 22), n: rng.int(3, 6) });
  const spiralRand = rng();
  let s = 0, prev = null;
  for (let k = 0; k <= TURNS * NR; k++) {
    if (k % 36 === 35) await tick?.();
    const i = k % NR, turn = k / NR;
    const r = Math.min(R1, rS0 + pitch * turn + noise.n2(k * 0.37, 3.1) * 0.08 + noise.n2(i * 0.9, turn * 0.25) * 0.1);
    const p = at(i, r);
    if (prev) {
      let torn = false;
      for (const t of tears) { const di = (i - t.i0 + NR) % NR; if (di < t.span && turn >= t.t0 && turn < t.t0 + t.n) torn = true; }
      const len = prev.distanceTo(p);
      const tn = Math.floor((k - 1) / NR);
      if (!torn) addLine(subdiv(prev, p, len / 3 + 0.01, 0.03 + 0.02 * rng()), 0.03, 'spiral', spiralRand, s, 1, tn % 4 === 0 ? 0 : tn % 2 === 0 ? 1 : 2);
      s += len;
    }
    prev = p;
  }

  // --- emit ribbons and drops
  await tick?.();
  let total = 0;
  for (const L of lines) { L.len = 0; for (let j = 1; j < L.pts.length; j++) L.len += L.pts[j].distanceTo(L.pts[j - 1]); total += L.len * L.w; }
  const spacing = total / nDrops;
  const TH = { pos: [], dir: [], a: [], lod: [], idx: [], n: 0 }, DR = { pos: [], dat: [], lod: [], n: 0, cands: [] };
  const T0 = V3(), T1 = V3(), q = V3();
  const tangent = (pts, j, out) => out.subVectors(pts[Math.min(pts.length - 1, j + 1)], pts[Math.max(0, j - 1)]).normalize();
  let li = 0;
  for (const L of lines) {
    if (++li % 12 === 0) await tick?.();
    let sAcc = L.s0;
    const pts = L.pts;
    for (let j = 0; j < pts.length - 1; j++) {
      const a = pts[j], b = pts[j + 1], len = a.distanceTo(b);
      tangent(pts, j, T0); tangent(pts, j + 1, T1);
      const pa = pinOf(a), pb = pinOf(b);
      TH.pos.push(a.x, a.y, a.z, a.x, a.y, a.z, b.x, b.y, b.z, b.x, b.y, b.z);
      TH.dir.push(T0.x, T0.y, T0.z, L.width, T0.x, T0.y, T0.z, L.width, T1.x, T1.y, T1.z, L.width, T1.x, T1.y, T1.z, L.width);
      TH.a.push(-1, sAcc, L.rand, pa, 1, sAcc, L.rand, pa, -1, sAcc + len, L.rand, pb, 1, sAcc + len, L.rand, pb);
      for (let v = 0; v < 4; v++) TH.lod.push(L.lod, L.emph);
      TH.idx.push(TH.n, TH.n + 1, TH.n + 2, TH.n + 2, TH.n + 1, TH.n + 3); TH.n += 4;
      sAcc += len;
    }
    // drops, evenly beaded with a little jitter
    const n = Math.max(L.kind === 'spiral' ? 1 : 0, Math.round((L.len * L.w) / spacing + rng.range(-0.3, 0.3)));
    for (let k = 0; k < n; k++) {
      const d = ((k + 0.5 + rng.range(-0.18, 0.18)) / n) * L.len;
      let acc = 0, j = 0;
      while (j < pts.length - 2 && acc + pts[j].distanceTo(pts[j + 1]) < d) { acc += pts[j].distanceTo(pts[j + 1]); j++; }
      const seg = pts[j].distanceTo(pts[j + 1]) || 1;
      q.copy(pts[j]).lerp(pts[j + 1], clamp((d - acc) / seg, 0, 1));
      let r;
      if (L.kind === 'spiral') r = rng.chance(0.11) ? rng.range(0.14, 0.3) : 0.032 + 0.075 * Math.pow(rng(), 2.0);
      else if (L.kind === 'hub') r = 0.06 + 0.1 * Math.pow(rng(), 1.5);
      else if (L.kind === 'radial') r = rng.chance(0.1) ? rng.range(0.12, 0.26) : 0.035 + 0.06 * Math.pow(rng(), 2);
      else r = 0.04 + 0.09 * Math.pow(rng(), 2);
      const pin = pinOf(q);
      DR.pos.push(q.x, q.y - r * 0.6, q.z, r);
      DR.dat.push(rng(), pin, rng(), 0); DR.lod.push(L.lod);
      if (r > 0.1 && pin > 0.45 && L.kind !== 'hub' && q.y > 6) DR.cands.push(DR.n);
      DR.n++;
    }
  }
  return { TH, DR, R0, R1, pitch, poly, hub: V3(hx, hy, 0) };
}

// ------------------------------------------------------------------ a second, small orb web
// Strung low between two grass blades beside the route (the world gives the centre, the horizontal axis of its plane and
// the points on the blades it is moored to, all in this piece's local space). Its threads and beads go into the big
// Web's own buffers, so it costs no draw call; its turns are given the lods of the big spiral so that it fades in from
// a glint to a beaded lace as the camera comes up to it.
function addMiniWeb(TH, DR, rng, M) {
  const c = V3().fromArray(M.c), ex = V3().fromArray(M.ex).normalize(), ey = V3(0, 1, 0), R = M.R, NR = 17, r0 = 0.42, TURNS = 13;
  const at = (x, y, out = V3()) => out.copy(c).addScaledVector(ex, x).addScaledVector(ey, y);
  const lines = [];
  const seg = (a, b, n, sag, width, kind, lod, emph, pin) => {
    const pts = [];
    for (let j = 0; j <= n; j++) { const t = j / n, q = a.clone().lerp(b, t); q.y -= sag * a.distanceTo(b) * 4 * t * (1 - t); pts.push(q); }
    lines.push({ pts, width, kind, lod, emph: emph * 2.3, pin, rand: rng() });
  };
  // frame: an uneven hexagon whose corners run out to the blades
  const corners = [];
  for (let k = 0; k < 6; k++) { const an = (k / 6) * TAU + 0.5 + rng.range(-0.16, 0.16), rr = R * rng.range(1.06, 1.22); corners.push(V3(Math.cos(an) * rr, Math.sin(an) * rr, 0)); }
  for (let k = 0; k < 6; k++) seg(at(corners[k].x, corners[k].y), at(corners[(k + 1) % 6].x, corners[(k + 1) % 6].y), 5, 0.006, 0.05, 'frame', 0, 1.3, 0.2);
  for (const m of M.moor) {                       // each mooring point takes the corner nearest to it, by two threads
    const mp = V3().fromArray(m); let best = 0, bd = 1e9;
    for (let k = 0; k < 6; k++) { const d = at(corners[k].x, corners[k].y).distanceTo(mp); if (d < bd) { bd = d; best = k; } }
    seg(at(corners[best].x, corners[best].y), mp, 5, 0.012, 0.045, 'guy', 0, 1.3, 0);
    const nb = (best + (rng() < 0.5 ? 1 : 5)) % 6, mid = corners[best].clone().lerp(corners[nb], 0.42);
    seg(at(mid.x, mid.y), mp.clone().add(V3(0, rng.range(-1.1, 1.1), 0)), 5, 0.014, 0.04, 'guy', 0, 1.2, 0);
  }
  const rayEnd = (dx, dy) => {
    let best = R * 1.3;
    for (let i = 0; i < 6; i++) {
      const a = corners[i], b = corners[(i + 1) % 6], exx = b.x - a.x, eyy = b.y - a.y, den = dx * eyy - dy * exx; if (Math.abs(den) < 1e-6) continue;
      const t = (a.x * eyy - a.y * exx) / den, q = (a.x * dy - a.y * dx) / den;
      if (t > 0 && q >= -0.001 && q <= 1.001 && t < best) best = t;
    }
    return best;
  };
  const dirs = [], th0 = rng.range(0, TAU);
  for (let i = 0; i < NR; i++) {
    const th = th0 + ((i + rng.range(-0.2, 0.2)) / NR) * TAU, d = { x: Math.cos(th), y: Math.sin(th) }; dirs.push(d);
    seg(at(d.x * r0, d.y * r0), at(d.x * rayEnd(d.x, d.y), d.y * rayEnd(d.x, d.y)), 5, 0, 0.05, 'radial', 0, 1.6, 0.3);
  }
  { const pts = []; for (let i = 0; i <= NR; i++) pts.push(at(dirs[i % NR].x * r0, dirs[i % NR].y * r0)); lines.push({ pts, width: 0.06, kind: 'hub', lod: 0, emph: 3.0, pin: 0.3, rand: rng() }); }
  const pitch = (R - 0.9) / TURNS; let prev = null, sAcc = 0;
  for (let k = 0; k <= TURNS * NR; k++) {
    const i = k % NR, turn = k / NR, r = Math.min(R, 0.9 + pitch * turn + 0.05 * Math.sin(k * 1.7)), p = at(dirs[i].x * r, dirs[i].y * r);
    if (prev) { const tn = Math.floor((k - 1) / NR); lines.push({ pts: [prev, prev.clone().lerp(p, 0.5).add(V3(0, -0.035 * prev.distanceTo(p), 0)), p], width: 0.03, kind: 'spiral', lod: tn % 3 === 0 ? 0 : tn % 3 === 1 ? 1 : 2, emph: 2.6, pin: 0.3, rand: 0.37, s0: sAcc }); sAcc += prev.distanceTo(p); }
    prev = p;
  }
  // ribbons and beads
  const T0 = V3(), T1 = V3(), q = V3();
  const tangent = (pts, j, out) => out.subVectors(pts[Math.min(pts.length - 1, j + 1)], pts[Math.max(0, j - 1)]).normalize();
  for (const L of lines) {
    let s = L.s0 || 0, len = 0; const pts = L.pts;
    for (let j = 0; j < pts.length - 1; j++) {
      const a = pts[j], b = pts[j + 1], l = a.distanceTo(b); tangent(pts, j, T0); tangent(pts, j + 1, T1);
      TH.pos.push(a.x, a.y, a.z, a.x, a.y, a.z, b.x, b.y, b.z, b.x, b.y, b.z);
      TH.dir.push(T0.x, T0.y, T0.z, L.width, T0.x, T0.y, T0.z, L.width, T1.x, T1.y, T1.z, L.width, T1.x, T1.y, T1.z, L.width);
      TH.a.push(-1, s, L.rand, L.pin, 1, s, L.rand, L.pin, -1, s + l, L.rand, L.pin, 1, s + l, L.rand, L.pin);
      for (let v = 0; v < 4; v++) TH.lod.push(L.lod, L.emph);
      TH.idx.push(TH.n, TH.n + 1, TH.n + 2, TH.n + 2, TH.n + 1, TH.n + 3); TH.n += 4;
      s += l; len += l;
    }
    const every = (L.kind === 'spiral' ? 0.24 : L.kind === 'guy' ? 0.8 : 0.42) / (M.detail ?? 1), n = Math.max(L.kind === 'spiral' ? 1 : 0, Math.round(len / every + rng.range(-0.3, 0.3)));
    for (let k = 0; k < n; k++) {
      const d = ((k + 0.5 + rng.range(-0.2, 0.2)) / n) * len; let acc = 0, j = 0;
      while (j < pts.length - 2 && acc + pts[j].distanceTo(pts[j + 1]) < d) { acc += pts[j].distanceTo(pts[j + 1]); j++; }
      q.copy(pts[j]).lerp(pts[j + 1], clamp((d - acc) / (pts[j].distanceTo(pts[j + 1]) || 1), 0, 1));
      const r = L.kind === 'spiral' ? (rng.chance(0.07) ? rng.range(0.13, 0.22) : 0.035 + 0.06 * Math.pow(rng(), 2)) : rng.chance(0.1) ? rng.range(0.13, 0.24) : 0.04 + 0.06 * Math.pow(rng(), 2);
      DR.pos.push(q.x, q.y - r * 0.6, q.z, r); DR.dat.push(rng(), L.pin, rng(), 0); DR.lod.push(L.lod); DR.n++;
    }
  }
}

// ------------------------------------------------------------------ silk material
// Camera-facing ribbons, additive. Thin threads are widened to ~1 px and dimmed so the distant web
// reads as a soft back-lit disc instead of crawling. Glints: bright beads of spectral colour whose
// phase depends on arc length AND camera position, so they slide along the silk as the camera moves.
function makeThreadMaterial(U) {
  return new THREE.ShaderMaterial({
    fog: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    uniforms: { ...THREE.UniformsUtils.merge([THREE.UniformsLib.fog]), uTime: U.uTime, uTremor: U.uTremor, uHub: U.uHub, uWind: U.uWind,
      uViewH: U.uViewH, uScl: U.uScl, uPitch: U.uPitch, uSunDirW: U.uSunDirW, uSunCol: U.uSunCol, uDewCol: U.uDewCol, uGain: U.uGain },
    vertexShader: /* glsl */`
      attribute vec4 aDir; attribute vec4 aA; attribute vec2 aLod;
      uniform float uViewH, uScl, uPitch;
      varying float vVis;
      varying float vS; varying float vRand; varying float vSide; varying float vFade; varying vec3 vW; varying float vWave;
      #include <fog_pars_vertex>
      ${GLSL_WEB_DISP}
      void main() {
        vec3 p = webDisp(position, aA.w);
        vec4 wp = modelMatrix * vec4(p, 1.0);
        vec4 mvPosition = viewMatrix * wp;
        vec3 tv = normalize(mat3(modelViewMatrix) * aDir.xyz);
        vec3 side = cross(tv, normalize(mvPosition.xyz));
        side = side / max(length(side), 1e-4);
        float pxPerM = projectionMatrix[1][1] * uViewH * 0.5 / max(-mvPosition.z, 0.1);
        float minW = 1.25 / pxPerM;
        float w = max(aDir.w * uScl, minW);
        vFade = clamp(aDir.w * uScl / minW, 0.0, 1.0);
        // from far off only every fourth turn of the spiral is drawn, so that it reads as separate rings and not as a haze;
        // the turns between fade in as they come to stand a few pixels apart
        float pitchPx = uPitch * uScl * pxPerM;
        float vis = aLod.x < 0.5 ? 1.0 : (aLod.x < 1.5 ? smoothstep(2.2, 4.0, 2.0 * pitchPx) : smoothstep(2.2, 4.0, pitchPx));
        vVis = vis * aLod.y;
        mvPosition.xyz += side * aA.x * w * 0.5;
        vS = aA.y; vRand = aA.z; vSide = aA.x; vW = wp.xyz; vWave = gWave;
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uSunDirW, uSunCol, uDewCol; uniform float uGain;
      varying float vVis;
      varying float vS; varying float vRand; varying float vSide; varying float vFade; varying vec3 vW; varying float vWave;
      #include <fog_pars_fragment>
      ${GLSL_FOG_FACTOR}
      ${GLSL_HUE}
      void main() {
        float prof = smoothstep(0.0, 0.6, 1.0 - min(abs(vSide), 1.0));      // the across coordinate held to its own range
        vec3 V = normalize(vW - cameraPosition);
        float toSun = max(dot(V, normalize(uSunDirW)), 0.0); toSun *= toSun;
        vec3 col = uDewCol * 0.05 + uSunCol * (0.04 + 0.24 * toSun);       // the silk itself: fine silver lines
        float cam = dot(cameraPosition, vec3(0.31, 0.23, 0.17));
        float ph = vS * 0.55 + cam * 0.9 + vRand * 40.0;
        float g = pow(max(0.5 + 0.5 * sin(ph), 0.0), 18.0);
        float g2 = pow(max(0.5 + 0.5 * sin(ph * 0.37 + vRand * 17.0 + 1.3), 0.0), 56.0);
        vec3 rb = hue(vS * 0.045 + cam * 0.11 + vRand);
        col += mix(uSunCol, rb * 1.4, 0.85) * (g * 0.3 + g2 * 6.0) * uGain * (0.35 + 0.65 * toSun);
        col *= 1.0 + 1.8 * vWave;
        float fd = clamp(vFade, 0.0, 1.0);
        col *= prof * mix(0.3, 1.0, fd * fd) * vVis * (1.0 - fogF());      // a thread thinner than a pixel is drawn a pixel wide and that much dimmer: seen from inside, the Web is a lace over the garden, not a veil
        gl_FragColor = vec4(col, 1.0);
      }`,
  });
}

// ------------------------------------------------------------------ dew material
// Instanced billboards. Near: a sphere impostor acting as a ball lens (inverted procedural garden and
// sun, fresnel sky reflection, dark edge, back-lit rim). Far: a soft bright point. Both carry a
// view-dependent rainbow sparkle with a small star flare that reaches past the drop's edge.
function makeDropMaterial(U) {
  return new THREE.ShaderMaterial({
    fog: true, transparent: true, depthWrite: false, premultipliedAlpha: true,
    uniforms: { ...THREE.UniformsUtils.merge([THREE.UniformsLib.fog]), uTime: U.uTime, uTremor: U.uTremor, uHub: U.uHub, uWind: U.uWind,
      uViewH: U.uViewH, uScl: U.uScl, uPitch: U.uPitch, uSunDirW: U.uSunDirW, uSunCol: U.uSunCol, uDewCol: U.uDewCol, uGain: U.uGain, uFall: U.uFall,
      uSkyZen: U.uSkyZen, uSkyHor: U.uSkyHor, uGrassA: U.uGrassA, uGrassB: U.uGrassB, uSoil: U.uSoil },
    vertexShader: /* glsl */`
      attribute vec4 iPos; attribute vec4 iData;
      uniform vec4 uFall;   // x falling instance, y seconds since release, z regrowing instance, w gravity
      uniform float uViewH, uScl, uPitch;
      attribute float iLod; varying float vVis;
      varying vec2 vUv; varying vec4 vData; varying float vLod; varying float vDim; varying float vFallF; varying vec3 vW; varying float vWave; varying vec3 vCls;
      #include <fog_pars_vertex>
      ${GLSL_WEB_DISP}
      ${GLSL_SWAY}
      const float Q = 3.0;
      void main() {
        float id = float(gl_InstanceID);
        float isFall = 1.0 - step(0.5, abs(id - uFall.x));
        float isPrev = 1.0 - step(0.5, abs(id - uFall.z));
        float t = uFall.y;
        vec3 p = webDisp(iPos.xyz, iData.y);
        p = floraSway(p, iData.w * uWind);
        float r = iPos.w * uScl * (1.0 + 0.05 * sin(uTime * 3.1 + iData.x * 40.0));
        r *= mix(1.0, smoothstep(0.2, 5.0, t), isPrev);
        r *= mix(1.0, 1.8, isFall);
        p.y -= isFall * 0.5 * uFall.w * t * t;
        float gone = isFall * (1.0 - step(0.3, p.y));
        vec4 wp = modelMatrix * vec4(p, 1.0);
        vec4 mvPosition = viewMatrix * wp;
        float pxPerM = projectionMatrix[1][1] * uViewH * 0.5 / max(-mvPosition.z, 0.1);
        float rpx = r * pxPerM;
        float rr = max(r, 1.5 / pxPerM);
        vLod = smoothstep(1.8, 5.0, rpx);
        vDim = clamp(rpx / 1.5, 0.0, 1.0);
        float pitchPx = uPitch * uScl * pxPerM;
        vVis = iLod < 0.5 ? 1.0 : (iLod < 1.5 ? smoothstep(2.2, 4.0, 2.0 * pitchPx) : smoothstep(2.2, 4.0, pitchPx));
        // the fat beads (about one in nine) carry the sparks; a quarter of those throw a long star flare (a bigger quad)
        float fat = smoothstep(0.1, 0.16, iPos.w), starI = step(0.72, iData.z) * step(0.5, fat) * (1.0 - smoothstep(3.0, 9.0, rpx)), qs = 1.0 + 2.6 * starI;
        vCls = vec3(fat, starI, qs);
        vec2 ext = position.xy * Q * rr * qs * (1.0 - gone);
        ext.y *= 1.0 + isFall * min(t, 1.2) * 0.6;
        mvPosition.xy += ext;
        vUv = position.xy * Q * qs; vData = iData; vFallF = isFall; vWave = gWave;
        vW = wp.xyz + vec3(viewMatrix[0][0], viewMatrix[1][0], viewMatrix[2][0]) * ext.x + vec3(viewMatrix[0][1], viewMatrix[1][1], viewMatrix[2][1]) * ext.y;
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uSunDirW, uSunCol, uDewCol, uSkyZen, uSkyHor, uGrassA, uGrassB, uSoil;
      uniform float uGain, uTime;
      varying float vVis;
      varying vec2 vUv; varying vec4 vData; varying float vLod; varying float vDim; varying float vFallF; varying vec3 vW; varying float vWave; varying vec3 vCls;
      #include <fog_pars_fragment>
      ${GLSL_FOG_FACTOR}
      ${GLSL_HUE}
      const float Q = 3.0;
      vec3 env(vec3 d, vec3 L) {
        float h = d.y, az = atan(d.x, abs(d.z) < 1e-5 ? 1e-5 : d.z);
        vec3 sky = mix(uSkyHor, uSkyZen, smoothstep(0.0, 0.55, h));
        float blades = 0.7 + 0.3 * sin(az * 37.0 + h * 9.0) * sin(az * 11.0 + 2.0);
        vec3 grd = mix(uGrassA * blades, uGrassB, smoothstep(0.0, 0.4, -h));
        grd = mix(grd, uSoil, smoothstep(0.4, 0.85, -h));
        vec3 c = mix(grd, sky, smoothstep(-0.03, 0.03, h - 0.05 - 0.05 * sin(az * 23.0) * sin(az * 7.0 + 1.0)));
        float sd = max(dot(d, L), 0.0);
        c += uSunCol * (9.0 * smoothstep(0.972, 0.994, sd) + 1.5 * pow(sd, 30.0) + 0.3 * pow(sd, 6.0));
        return c;
      }
      void main() {
        float r = length(vUv);
        vec3 L = normalize(uSunDirW);
        vec3 V = normalize(vW - cameraPosition);
        float toSun = max(dot(V, L), 0.0); toSun = toSun * toSun * toSun;
        vec3 rdir = normalize(vec3(hash11(vData.x * 91.0), hash11(vData.x * 57.0 + 3.0), hash11(vData.z * 33.0 + 7.0)) - 0.5 + vec3(0.0, 0.0, 1e-4));
        float sp = max(0.5 + 0.5 * sin(vData.x * 6.283 + dot(cameraPosition, rdir) * 1.1 + uTime * 0.7), 0.0);
        float spark = max(pow(sp, mix(46.0, 20.0, vCls.x)) + vWave * (0.15 + 0.6 * sp * sp), vFallF);
        vec3 rb = mix(vec3(1.0), hue(vData.z + dot(cameraPosition, vec3(0.043, 0.031, 0.027))) * 1.35, 0.62);
        vec4 near = vec4(0.0);
        if (r < 1.0) {
          vec3 n = vec3(vUv, sqrt(max(1.0 - r * r, 0.0)));
          vec3 right = vec3(viewMatrix[0][0], viewMatrix[1][0], viewMatrix[2][0]);
          vec3 upv = vec3(viewMatrix[0][1], viewMatrix[1][1], viewMatrix[2][1]);
          vec3 fwd = vec3(viewMatrix[0][2], viewMatrix[1][2], viewMatrix[2][2]);
          vec3 tang = right * n.x + upv * n.y;
          vec3 Nw = tang + fwd * n.z;
          vec3 c = env(normalize(V - tang * 1.75), L) * vec3(0.95, 1.0, 1.05) * 1.25;
          vec3 rf = reflect(V, Nw);
          float fres = pow(clamp(1.0 - n.z, 0.0, 1.0), 3.0);
          c = mix(c, env(rf, L), 0.06 + 0.6 * fres);
          // glass: a dark outline, the gathered light as a crescent inside the edge away from the sun, a thread of rim light
          c *= mix(1.0, 0.26, smoothstep(0.5, 0.93, r));
          vec2 sdir = vec2(dot(L, right), dot(L, upv)); float sl = length(sdir); sdir = sl > 1e-3 ? sdir / sl : vec2(0.0, 1.0);
          float away = clamp(0.5 - 0.5 * dot(vUv / max(r, 1e-3), sdir), 0.0, 1.0);
          float cres = smoothstep(0.6, 0.88, r) * (1.0 - smoothstep(0.92, 1.0, r)) * away * away;
          c += uSunCol * (cres * (0.5 + 2.2 * toSun) + smoothstep(0.93, 0.985, r) * (0.1 + 0.8 * toSun));
          c += uSunCol * 8.0 * pow(clamp(dot(rf, L), 0.0, 1.0), 160.0);
          vec2 wq = vUv - vec2(-0.4, 0.44); wq = vec2(wq.x * 0.77 + wq.y * 0.64, -wq.x * 0.64 + wq.y * 0.77) * vec2(3.6, 9.0);
          c += (uSkyZen + vec3(0.35)) * 0.55 * (1.0 - smoothstep(0.5, 1.0, length(wq)));
          float a = 1.0 - smoothstep(1.0 - max(fwidth(r), 1e-4) * 1.5, 1.0, r);
          near = vec4(c * a, a);
        }
        float aT = mix(9.0, 4.5, vCls.y), aL = mix(1.7, 0.42, vCls.y), reach = Q * vCls.z;
        float arms = exp(-abs(vUv.x) * aT - abs(vUv.y) * aL) + exp(-abs(vUv.y) * aT - abs(vUv.x) * aL);
        float star = exp(-r * r * 2.4) + 0.6 * arms;
        star *= 1.0 - smoothstep(reach * 0.55, reach, r);
        near.rgb += rb * uSunCol * spark * star * 3.0 * uGain * (0.3 + 0.7 * toSun) * (0.6 + 0.4 * vCls.x + 1.2 * vCls.y);
        float fa = exp(-r * r * 4.5);
        float fstar = fa + (0.3 + 0.5 * vCls.y) * arms;
        fstar *= 1.0 - smoothstep(reach * 0.5, reach, r);
        // sub-pixel drops are drawn at a minimum size, so their light is cut by the area they really cover:
        // from far away the web stays a lace of threads with separate glints instead of a solid bright disc
        float dim = mix(0.05, 1.0, pow(vDim, 1.5));
        vec3 fc = (uDewCol * 0.2 + uSunCol * (0.1 + 0.5 * toSun)) * fa * dim * (0.3 + 2.0 * vCls.x)
                + rb * uSunCol * spark * fstar * 9.0 * uGain * (0.35 + 0.65 * toSun) * mix(0.4, 1.0, vDim) * (0.35 + 0.75 * vCls.x + 1.3 * vCls.y);
        vec4 far = vec4(fc, fa * 0.5 * dim) * vVis;     // the beads of the turns not yet drawn are not drawn either
        vec4 o = mix(far, near, vLod);
        float ff = fogF();
        o.rgb = mix(o.rgb, fogColor * o.a, ff);
        gl_FragColor = o;
      }`,
  });
}

// ------------------------------------------------------------------ hero
export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng.fork ? ctx.rng.fork('dew-garden-web') : ctx.rng;
  // round 3's things (the caught bells and fat beads, the small web, the wilding) draw from streams of their own, each made
  // from the world's seed and a name: they take nothing from the Web's stream or from any other
  const named = (name) => ctx.core.makeRng(ctx.core.hashSeed(name + ':' + ctx.seed));
  const rngX = named('dew-garden-web-round3'), rngW = named('dew-garden-wilding');
  const noise = ctx.noise;
  const pal = (opts.palette && opts.palette.length >= 7 ? opts.palette : DEFAULT_PALETTE).map((h) => new THREE.Color(h));
  const hy = opts.hubHeight ?? 26, period = opts.period ?? 6, nDrops = opts.drops ?? 6000;
  const sunLocal = V3().fromArray(opts.sunDir || [0, 0.2, -1]).normalize();
  const sunCol = new THREE.Color(opts.sunColor || opts.palette?.[0] || DEFAULT_PALETTE[0]);

  const white = new THREE.Color(1, 1, 1);
  const zen = pal[5].clone().lerp(new THREE.Color('#6fa8e8'), 0.6).multiplyScalar(0.8);
  const U = {
    uTime: { value: 0 }, uTremor: { value: new THREE.Vector4(0, hy - 12, 0, 1) }, uHub: { value: V3(0, hy, 0) },
    uWind: { value: 1 }, uViewH: { value: 1080 }, uScl: { value: opts.scale ?? 1 }, uPitch: { value: 0.5 }, uGain: { value: 1 }, uFall: { value: new THREE.Vector4(-1, 0, -1, 5.5) },
    uSunDirW: { value: sunLocal.clone() }, uSunCol: { value: sunCol },
    uDewCol: { value: pal[5].clone() },
    // the sky the drops hold: opts.sky = [horizon, overhead] (the host world's hour), else a plain morning blue
    uSkyZen: { value: opts.sky ? new THREE.Color(opts.sky[1]) : zen }, uSkyHor: { value: opts.sky ? new THREE.Color(opts.sky[0]) : pal[0].clone().multiplyScalar(0.95) },
    uGrassA: { value: pal[1].clone().multiplyScalar(0.95) }, uGrassB: { value: pal[3].clone().multiplyScalar(0.8) },
    uSoil: { value: pal[4].clone().multiplyScalar(0.5) },
    uSkyCol: { value: zen.clone().lerp(pal[0], 0.35).multiplyScalar(0.5) }, uGroundCol: { value: pal[3].clone().multiplyScalar(0.3) },
    uSpotCol: { value: pal[6].clone().multiplyScalar(0.14) },
  };

  const object = new THREE.Group(); object.name = 'dew-garden-web'; object.scale.setScalar(opts.scale ?? 1);

  // --- foxgloves
  // per-seed flower variety: pink (palette accent), deeper magenta, or pale blush with a pink throat
  const variety = rng(), blush = variety > 0.8 ? 0.5 : 0;
  const accent = pal[6].clone().offsetHSL(variety > 0.5 && variety <= 0.8 ? rng.range(-0.09, -0.05) : rng.range(-0.03, 0.03), 0, variety > 0.5 && variety <= 0.8 ? -0.06 : rng.range(-0.03, 0.04)).multiplyScalar(0.78);
  const col = {
    deep: pal[3], grass: pal[2], lime: pal[1], soil: pal[4].clone().multiplyScalar(0.7), accent,
    cream: pal[0].clone().lerp(white, 0.35).multiplyScalar(0.78), bud: pal[1].clone().lerp(pal[2], 0.45), calyx: pal[2].clone().lerp(pal[3], 0.35),
  };
  const stems = [], caught = [], tick = () => ctx.yield?.(), floraMat = makeFloraMaterial(U);
  for (const sideSign of [-1, 1]) {            // one mesh each, so that no single step of the build is long
    const acc = makeAcc();
    stems.push(await addFoxglove(acc, rng, noise, { bx: sideSign * 27.5, H: hy + 23 + rng.range(11, 15), sideSign, col, phase: rng(), blush }, tick));
    await ctx.yield?.();
    if (sideSign > 0 && opts.caught !== false) {
      // bells that fell from the racemes and were caught in the spiral beside the hub, each still carrying a drop on its lip:
      // the foxgloves' colour stays in the picture when the stems have left it
      for (const [cx, cy, L, sx] of [[-12.6, 6.4, 4.3, -1], [13.4, -5.6, 3.9, 1], [-9.8, -11.2, 3.1, -1]]) {
        const A = V3(sx * rngX.range(0.15, 0.4), -0.84, 0.46).normalize(), Dn = V3(sx * 0.2, -0.25, -1); Dn.addScaledVector(A, -Dn.dot(A)).normalize();
        const S = V3().crossVectors(A, Dn).normalize(), bb = V3(cx, hy + cy, 0.5).addScaledVector(A, -0.5 * L);
        const mouth = addCorolla(acc, col, bb, A, Dn, S, L, 1, rngX.range(0.85, 1.05), rngX.range(0, 0.12) + blush, 0.25);
        caught.push({ p: mouth.clone().addScaledVector(Dn, L * 0.3).addScaledVector(A, L * 0.2), r: rngX.range(0.34, 0.5) });
      }
    }
    const fg = new THREE.BufferGeometry();          // accToGeometry, in steps: one foxglove is some 25k triangles
    fg.setAttribute('position', new THREE.Float32BufferAttribute(acc.p, 3)); fg.setAttribute('color', new THREE.Float32BufferAttribute(acc.c, 3));
    await ctx.yield?.();
    fg.setAttribute('aLoc', new THREE.Float32BufferAttribute(acc.l, 3)); fg.setAttribute('aData', new THREE.Float32BufferAttribute(acc.d, 2)); fg.setIndex(acc.i);
    await ctx.yield?.();
    await stepNormals(fg, tick);
    await ctx.yield?.();
    const flora = new THREE.Mesh(fg, floraMat); flora.name = 'foxgloves';
    object.add(flora);
    await ctx.yield?.();
  }

  // --- web
  const web = await buildWeb(rng, noise, { hy, stems, nDrops }, tick);
  await ctx.yield?.();
  {
    // a few fat beads on the innermost turns: the lenses that pass close to the camera as it enters the hub
    const TH = web.TH, n = TH.pos.length / 12, want = opts.fatBeads ?? 28;
    for (let t = 0, made = 0; t < 600 && made < want; t++) {
      const i = Math.floor(rngX() * n) * 12, x = (TH.pos[i] + TH.pos[i + 6]) / 2, y = (TH.pos[i + 1] + TH.pos[i + 7]) / 2, rr = Math.hypot(x, y - hy);
      if (rr < web.R0 + 0.8 || rr > web.R0 + 5.2 || Math.abs(TH.pos[i + 2]) > 0.01) continue;
      const r = rngX.range(0.24, 0.4); web.DR.pos.push(x, y - r * 0.6, 0, r); web.DR.dat.push(rngX(), 1, rngX(), 0); web.DR.lod.push(0); web.DR.n++; made++;
    }
    for (const cb of caught) { web.DR.pos.push(cb.p.x, cb.p.y - cb.r * 0.8, cb.p.z, cb.r); web.DR.dat.push(rngX(), 0, rngX(), 0.25); web.DR.lod.push(0); web.DR.n++; }
  }
  if (opts.miniWeb) addMiniWeb(web.TH, web.DR, named('dew-garden-mini-web'), opts.miniWeb);
  await ctx.yield?.();
  // the wilding: a third, self-sown foxglove standing in the clearing (opts.wild = { x, z, rot, H }; rot turns the whole
  // plant about its foot, 0 = its raceme faces +z as the two parents' do); fat drops on the lips of its lower bells
  let wild = null;
  if (opts.wild) {
    const Wd = opts.wild, acc = makeAcc(), cr = Math.cos(Wd.rot), sr = Math.sin(Wd.rot);
    const st = await addFoxglove(acc, rngW, noise, { bx: 0, H: Wd.H, sideSign: Wd.lean ?? 1, col, phase: rngW(), blush, bias: 0, leafK: Wd.leafK ?? 0.6, free: true, lite: true }, tick);
    await ctx.yield?.();
    for (let i = 0; i < acc.p.length; i += 3) { const x = acc.p[i], z = acc.p[i + 2]; acc.p[i] = Wd.x + x * cr + z * sr; acc.p[i + 2] = Wd.z - x * sr + z * cr; }
    await ctx.yield?.();
    for (const tp of st.tips) {
      const bell = tp.kind === 'bell', low = bell && tp.f < 0.55;
      if (!low && !rngW.chance(0.4)) continue;
      const r = low ? rngW.range(0.3, 0.5) * (0.6 + tp.L / 9) : tp.r, x = tp.p.x, z = tp.p.z;
      web.DR.pos.push(Wd.x + x * cr + z * sr, tp.p.y - r * 0.8, Wd.z - x * sr + z * cr, r);
      web.DR.dat.push(rngW(), 0, rngW(), bell ? 1.0 : 0.5); web.DR.lod.push(0); web.DR.n++;
    }
    const fg = new THREE.BufferGeometry();
    fg.setAttribute('position', new THREE.Float32BufferAttribute(acc.p, 3)); fg.setAttribute('color', new THREE.Float32BufferAttribute(acc.c, 3));
    await ctx.yield?.();
    fg.setAttribute('aLoc', new THREE.Float32BufferAttribute(acc.l, 3)); fg.setAttribute('aData', new THREE.Float32BufferAttribute(acc.d, 2)); fg.setIndex(acc.i);
    await ctx.yield?.();
    await stepNormals(fg, tick);
    await ctx.yield?.();
    wild = new THREE.Mesh(fg, floraMat); wild.name = 'foxglove-wild';
    object.add(wild);
    await ctx.yield?.();
  }
  const tg = new THREE.BufferGeometry();
  tg.setAttribute('position', new THREE.Float32BufferAttribute(web.TH.pos, 3));
  tg.setAttribute('aDir', new THREE.Float32BufferAttribute(web.TH.dir, 4));
  tg.setAttribute('aA', new THREE.Float32BufferAttribute(web.TH.a, 4));
  tg.setAttribute('aLod', new THREE.Float32BufferAttribute(web.TH.lod, 2));
  U.uPitch.value = web.pitch;
  tg.setIndex(web.TH.idx);
  tg.boundingSphere = new THREE.Sphere(V3(0, hy, 0), 42);
  const threads = new THREE.Mesh(tg, makeThreadMaterial(U)); threads.name = 'silk'; threads.renderOrder = 1;
  if (opts.miniWeb) threads.frustumCulled = false;      // the small web's threads are in this mesh and stand far from the big one
  object.add(threads);

  // dew on the plants too: a fat drop on some bell lips and leaf tips (iData.w = sway weight)
  const DR = web.DR;
  for (const st of stems) for (const tp of st.tips) {
    if (!rng.chance(tp.kind === 'bell' ? 0.42 : 0.5)) continue;
    DR.pos.push(tp.p.x, tp.p.y - tp.r * 0.8, tp.p.z, tp.r);
    DR.dat.push(rng(), 0, rng(), tp.kind === 'bell' ? 1.0 : 0.5); DR.lod.push(0); DR.n++;
  }
  const dg = new THREE.InstancedBufferGeometry();
  dg.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, -1, 1, 0, 1, 1, 0], 3));
  dg.setIndex([0, 1, 2, 2, 1, 3]);
  dg.setAttribute('iPos', new THREE.InstancedBufferAttribute(new Float32Array(DR.pos), 4));
  dg.setAttribute('iData', new THREE.InstancedBufferAttribute(new Float32Array(DR.dat), 4));
  dg.setAttribute('iLod', new THREE.InstancedBufferAttribute(new Float32Array(DR.lod), 1));
  dg.instanceCount = DR.n;
  const drops = new THREE.Mesh(dg, makeDropMaterial(U)); drops.name = 'dew'; drops.frustumCulled = false; drops.renderOrder = 2;
  object.add(drops);
  await ctx.yield?.();

  // --- falling-drop schedule (deterministic per seed)
  const cands = DR.cands.length ? rng.shuffle(DR.cands.slice()) : [0];
  const fallingDrop = V3(0, hy, 0);
  const anchors = {
    portalSeat: { position: V3(0, hy, 0), normal: V3(0, 0, 1), radius: 7 },
    hubRadius: web.R0,
    flyThrough: [V3(0, hy, 170), V3(0, hy, 110), V3(0, hy, 50), V3(0, hy, 0), V3(0, hy, -40)],
    approachDir: V3(0, 0, -1),
    viewpoints: { reveal: V3(0, hy - 2, 165), mid: V3(-6, hy, 90), close: V3(4, hy + 1, 34), oblique: V3(44, hy - 8, 62) },
    damselCross: [[V3(-34, hy + 5, 26), V3(34, hy - 4, 33)], [V3(30, hy - 9, 24), V3(-32, hy + 8, 30)]],
    stemBases: stems.map((s) => s.stemAt(0)), stemTops: stems.map((s) => s.stemAt(1)),
    sunDir: sunLocal.clone(), fallingDrop,
  };

  const size = new THREE.Vector2(); let progress = 0;
  const hero = {
    object, radius: 38, height: Math.max(stems[0].height, stems[1].height), center: V3(0, hy, 0), anchors, wild,
    ground: true, groundY: 0, uniforms: U,
    setProgress(u) { progress = clamp(u, 0, 1); U.uHub.value.z = progress * progress * 0.6; U.uGain.value = 1 + 0.8 * progress; },
    setSun(dirLocal, colorHex) {
      if (dirLocal) { sunLocal.copy(dirLocal.isVector3 ? dirLocal : V3().fromArray(dirLocal)).normalize(); anchors.sunDir.copy(sunLocal); }
      if (colorHex !== undefined) sunCol.set(colorHex);
    },
    update(dt, time) {
      U.uTime.value = time;
      U.uSunDirW.value.copy(sunLocal).transformDirection(object.matrixWorld);
      if (ctx.renderer?.getDrawingBufferSize) U.uViewH.value = ctx.renderer.getDrawingBufferSize(size).y || 1080;
      const cyc = Math.max(0, Math.floor(time / period)), t = Math.max(0, time - cyc * period);
      const idx = cands[(cyc * 7) % cands.length], prev = cyc > 0 ? cands[((cyc - 1) * 7) % cands.length] : -1;
      const x = DR.pos[idx * 4], y = DR.pos[idx * 4 + 1];
      U.uFall.value.set(idx, t, prev, 5.5);
      U.uTremor.value.set(x, y, t, 1);
      fallingDrop.set(x, Math.max(0, y - 0.5 * 5.5 * t * t), 0);
    },
    dispose() {},
  };
  hero.update(0, 0);
  return hero;
}
