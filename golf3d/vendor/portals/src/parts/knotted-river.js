// Hero set piece for "knotted-river": THE KNOT, AND THE CROSSING.
//
// A river with no banks: a tube of glass-green water 120 m thick and 8.6 km long, tied in a trefoil knot
// laid on a sheet that curls upward like a breaking wave, exactly the brief's function
//   u = 330(sin t + 2 sin 2t), v = 330(cos t - 2 cos 2t), n = 130 sin 3t,
//   w = v + 990, phi = 100deg (w/1980)^2 (+ a further 85deg eased in between w 1020 and 1670: the lip of the wave),
//   world = (u, Y0(w) + n cos phi, Z0(w) - n sin phi).
// LOCAL SPACE IS THE BRIEF'S WORLD SPACE (metres): bottom of the low lobe at the origin, +Y up, the camera
// travels toward +Z and looks INTO the curl, so the face the journey sees looks toward -Z. Put the object at
// the origin unrotated and every waypoint in the brief is true.
//
// What is in it
//   - the water tube (one mesh, finer along the skim and the Crossing): flowing ripples, foam current lines,
//     shoals as dark threads at a parallax depth, dark teal core, aqua transmission on the limb away from
//     the sun, a cream sun glitter on the sunward limb, a glass-rod glow where a strand points at the sun,
//     peach cloud-sea reflection underneath (analytic sky, no scene reflection);
//   - 200 lateen boats (x opts.density), all 12 m: planked hull with cream sheer stripe, stem and stern posts, steering oar,
//     raked 12 m mast, lateen yard, red sail with three seams and a paler patch, rigging ribbons, furled awning, baskets,
//     coiled net, hat on a thwart, laundry line. They are laid out by ONE rule (see "the fleet" in buildHero): each boat is
//     a course held for the whole flight; boats that sail along the river keep to lanes fixed on its girth, evenly spaced,
//     and most of the fleet sails the reaches the route travels; none comes within 10 m of the route's line. Those that come
//     within 56 m of the route's line are drawn in full, the rest as 160-triangle boats; those that stay
//     upright on a crown have a rippling mirror image; every boat trails a V wake wrapped onto the tube;
//   - berths for the reed islets of our stretch (anchors.berths) and, on the bar's belly where the route passes beneath
//     it, the hero's own hanging islet with four herons standing on the ceiling;
//   - where two reaches of the river pass close (surfaces within 90 m: the knot's three crossings): chains of droplet beads
//     and mist arcing slowly from one river to the other, 3,500 beads in all; none anywhere else;
//   - the Eyelet at the portal: a hoop of the same water 17 m across inside and 2.2 m thick, flowing round and through
//     itself, and before it a train of three larger hoops the knot has shed (120, 58 and 38 m across, each standing on the strand it was shed from, its axis the strand's own tangent);
//   - the route (anchors.flyThrough; it replaces the brief's waypoints): arrive on the crown of the low lobe's eastern strand,
//     lift off steeply to see the whole knot, dive to below the bar (the strand that closes the knot's eye) and fly east under
//     it to the East Crossing, climb beside our own strand (the wall of the eye), turn high in the eye, come down along the
//     bar, sail it west under the bridge (the low lobe's western strand) and through the hoops to the Eyelet;
//   - a lantern on every boat's sternpost (opts.lamp) and cool light under the hulls (opts.underLit), for the night look.
// Everything that stands on the river is placed in the vertex shader on the tube's own radial (down is
// toward the centreline); nothing uses world up.
//
// opts
//   palette    7 hex strings in brief order: peach, cream, teal, deep teal, aqua, sail red, lilac
//   detail     0.6..1 (default ctx.quality.detail or 1): thins far boats, beads and mist
//   density    0.7..1.3 (default 1): scales the 200 boats and the 12 berths (the brief: 'Density scales boats and islets')
//   ceilingIslet  false to leave out the reed islet and herons on the ceiling (default true)
//   sunDir     [x,y,z] direction TO the sun (default azimuth 80, elevation 9: [0.973, 0.156, 0.171])
//   sunColor   hex (default '#ffe2b8'), sunIntensity (default 2.4)
//   cast       'red' | 'saffron' | 'indigo' sail livery (default per seed, mostly red)
//   duration   seconds of the journey that setProgress(1) stands for (default 42)
//   glow       scale of the transmitted light in the water (default 1; a high moon wants about 0.5)
//   glowFar    scale of the aqua limb on strands seen from far (default 1; about 2 by day so far strands are lit glass)
//   limbTight  0..1 how strictly the glowing rim keeps to the strand's silhouette (default 0.35; 1 at night)
//
// returned extras
//   setProgress(u)  0..1 path progress. Boats sail on a clock = u * duration, so every frame of the journey is
//                   composed the same for a seed and the corridor stays clear. If never called, the clock is
//                   wall time (the orbit viewer); sails, hulls, water and beads always run on time.
//   setSun(dir, colorHex?, intensity?)   retint the key light of every material at once.
//   frameAt(s, out?) -> { C, T, N }      centreline point, tangent and transported normal at arc length s.
//   place(s, theta, h, out?) -> { position, up, forward, side }   a point h metres above the surface.
//   sOfT(t), tOfS(s), centreAt(t), crownTheta(s) (theta of the highest radial at s), thetaToward(s, point),
//   length (m), tubeRadius (60), cast (the livery this seed chose)
//   radialGLSL      vertex-shader chunk (knotFrame(), radialBasis()), skyGLSL (skyCol(), skyAmbient()) + `uniforms` (uFrames, uLen, uClock,
//                   uTime, uSunDir, ...) so the world's reeds, huts and birds can stand on the same radial.
//                   Add such meshes to hero.object so they share its transform.
//   fleet           { heroes, far }: every boat's course { s, th, vs, vth } (metres along, angle round, m/s, rad/s).
//
// anchors (local space = brief world space)
//   entry        { position, heading } first camera point, 14 m over the crown of our strand at t 3.50
//   flyThrough   the eight waypoints of the brief (verified >= 13 m from any water surface)
//   crossing     { position, upperCentre, lowerCentre, upperS, lowerS } the gap where the river crosses itself
//   portalSeat   { position, facing } centre of the 14 m portal inside the Eyelet; facing looks back down the path
//   viewpoints   { wholeKnot, crossing, eye, hill } each { position, look }
//   pois         { knot, ceiling } the two gaze targets of the journey
//   landmarks    eye, topCrossing, twinCrossing, lobeRight, lobeLeft, lowest; bounds { min, max }
//   sunDir       the direction the piece is lit from
//
// Size: 1920 m wide, ~990 m tall (y -185..800), ~1270 m deep (see anchors.bounds). radius/height/center returned are orbit-viewer
// hints. Cost: ~135k triangles, 8 draw calls, no lights, two small textures (2048x4 half-float frames, 256^2
// noise), ~170 ms build. Lighting: every material is its own ShaderMaterial lit by uSunDir/uSunCol and an analytic dawn sky
// from the palette; scene lights are ignored, scene fog is honoured. Wants a low warm key from +X, thin
// peach haze, bloom threshold ~0.9.
import * as THREE from 'three';

const LAMP_Y = 3.7, LAMP_Z = -6.35;      // where a boat's stern lantern hangs (model space)
const TUBE_R = 60, KA = 330, KN = 130, KW = 1980, KPHI = (100 * Math.PI) / 180;
// Above w = 1020 (beyond everything the journey passes) the sheet rolls a further 85 degrees over, like the lip of the
// wave: seen from the skim the upper lobes then stand clear ABOVE the strand that crosses over ours instead of
// hiding behind it, so the river reads as a knot long before the Crossing.
const KLIP = (85 * Math.PI) / 180, KLIP0 = 1020, KLIP1 = 1670;
const FN = 2048;                      // frame samples along the loop
const TAU = Math.PI * 2;

// ---------------------------------------------------------------------------------------------------
// knot mathematics
// ---------------------------------------------------------------------------------------------------
async function makeKnot(pause) {
  const NT = 2048, Y0 = new Float64Array(NT + 1), Z0 = new Float64Array(NT + 1), h = KW / NT;
  const lip = (w) => { const x = Math.max(0, Math.min(1, (w - KLIP0) / (KLIP1 - KLIP0))); return KLIP * x * x * (3 - 2 * x); };
  const ph = (w) => KPHI * (w / KW) * (w / KW) + lip(w);
  for (let i = 1; i <= NT; i++) {
    const a = (i - 1) * h, b = i * h, m = (a + b) / 2;
    Z0[i] = Z0[i - 1] + (h * (Math.cos(ph(a)) + 4 * Math.cos(ph(m)) + Math.cos(ph(b)))) / 6;
    Y0[i] = Y0[i - 1] + (h * (Math.sin(ph(a)) + 4 * Math.sin(ph(m)) + Math.sin(ph(b)))) / 6;
  }
  const tab = (T, w) => { const x = Math.max(0, Math.min(NT - 1e-6, (w / KW) * NT)), i = Math.floor(x), f = x - i; return T[i] * (1 - f) + T[i + 1] * f; };
  // centreline at parameter t -> [x, y, z]
  const P = (t, o = [0, 0, 0]) => {
    const u = KA * (Math.sin(t) + 2 * Math.sin(2 * t)), v = KA * (Math.cos(t) - 2 * Math.cos(2 * t)), n = KN * Math.sin(3 * t);
    const w = v + 990, phi = ph(w);
    o[0] = u; o[1] = tab(Y0, w) + n * Math.cos(phi); o[2] = tab(Z0, w) - n * Math.sin(phi); return o;
  };
  // arc-length table
  const M = 8192, cum = new Float64Array(M + 1); let prev = P(0), q = [0, 0, 0];
  for (let i = 1; i <= M; i++) { P((i / M) * TAU, q); cum[i] = cum[i - 1] + Math.hypot(q[0] - prev[0], q[1] - prev[1], q[2] - prev[2]); prev = [q[0], q[1], q[2]]; }
  const L = cum[M];
  await pause?.();
  const tOfS = (s) => {
    s = ((s % L) + L) % L; let lo = 0, hi = M;
    while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (cum[mid] <= s) lo = mid; else hi = mid; }
    return ((lo + (s - cum[lo]) / Math.max(1e-9, cum[lo + 1] - cum[lo])) / M) * TAU;
  };
  const sOfT = (t) => { const x = ((((t % TAU) + TAU) % TAU) / TAU) * M, i = Math.min(M - 1, Math.floor(x)); return cum[i] + (cum[i + 1] - cum[i]) * (x - i); };
  // frames at FN equal arc steps: centre, tangent, parallel-transported normal with the closing twist spread out
  const C = new Float64Array(FN * 3), T = new Float64Array(FN * 3), N = new Float64Array(FN * 3);
  for (let i = 0; i < FN; i++) { P(tOfS((i / FN) * L), q); C[i * 3] = q[0]; C[i * 3 + 1] = q[1]; C[i * 3 + 2] = q[2]; if ((i & 1023) === 1023) await pause?.(); }
  await pause?.();
  for (let i = 0; i < FN; i++) {
    const a = ((i + FN - 1) % FN) * 3, b = ((i + 1) % FN) * 3;
    const x = C[b] - C[a], y = C[b + 1] - C[a + 1], z = C[b + 2] - C[a + 2], l = Math.hypot(x, y, z);
    T[i * 3] = x / l; T[i * 3 + 1] = y / l; T[i * 3 + 2] = z / l;
  }
  const proj = (nx, ny, nz, i) => { const d = nx * T[i * 3] + ny * T[i * 3 + 1] + nz * T[i * 3 + 2]; nx -= d * T[i * 3]; ny -= d * T[i * 3 + 1]; nz -= d * T[i * 3 + 2]; const l = Math.hypot(nx, ny, nz); return [nx / l, ny / l, nz / l]; };
  let n = proj(0, 1, 0, 0); N[0] = n[0]; N[1] = n[1]; N[2] = n[2];
  for (let i = 1; i < FN; i++) { n = proj(n[0], n[1], n[2], i); N[i * 3] = n[0]; N[i * 3 + 1] = n[1]; N[i * 3 + 2] = n[2]; }
  const back = proj(n[0], n[1], n[2], 0);       // transported once round; compare with the start
  const bx = T[1] * N[2] - T[2] * N[1], by = T[2] * N[0] - T[0] * N[2], bz = T[0] * N[1] - T[1] * N[0];
  await pause?.();
  const twist = Math.atan2(back[0] * bx + back[1] * by + back[2] * bz, back[0] * N[0] + back[1] * N[1] + back[2] * N[2]);
  for (let i = 0; i < FN; i++) {
    const a = (-twist * i) / FN, c = Math.cos(a), s = Math.sin(a), k = i * 3;
    const tx = T[k], ty = T[k + 1], tz = T[k + 2], nx = N[k], ny = N[k + 1], nz = N[k + 2];
    const cx = ty * nz - tz * ny, cy = tz * nx - tx * nz, cz = tx * ny - ty * nx;
    N[k] = nx * c + cx * s; N[k + 1] = ny * c + cy * s; N[k + 2] = nz * c + cz * s;
  }
  await pause?.();
  // the same two-texel mix the vertex shader does
  const frameAt = (s, out = {}) => {
    const x = ((((s / L) % 1) + 1) % 1) * FN, i0 = Math.floor(x) % FN, f = x - Math.floor(x), i1 = (i0 + 1) % FN, a = i0 * 3, b = i1 * 3;
    const Cc = out.C || (out.C = new THREE.Vector3()), Tt = out.T || (out.T = new THREE.Vector3()), Nn = out.N || (out.N = new THREE.Vector3());
    Cc.set(C[a] + (C[b] - C[a]) * f, C[a + 1] + (C[b + 1] - C[a + 1]) * f, C[a + 2] + (C[b + 2] - C[a + 2]) * f);
    Tt.set(T[a] + (T[b] - T[a]) * f, T[a + 1] + (T[b + 1] - T[a + 1]) * f, T[a + 2] + (T[b + 2] - T[a + 2]) * f).normalize();
    Nn.set(N[a] + (N[b] - N[a]) * f, N[a + 1] + (N[b + 1] - N[a + 1]) * f, N[a + 2] + (N[b + 2] - N[a + 2]) * f);
    Nn.addScaledVector(Tt, -Nn.dot(Tt)).normalize();
    return out;
  };
  const _f = {}, _b = new THREE.Vector3(), _d = new THREE.Vector3();
  // a point h metres above the water at (s, theta): position, its own up, forward (along the river), side
  const place = (s, theta, h = 0, out = {}) => {
    frameAt(s, _f); _b.crossVectors(_f.T, _f.N);
    const up = out.up || (out.up = new THREE.Vector3()), pos = out.position || (out.position = new THREE.Vector3());
    up.copy(_f.N).multiplyScalar(Math.cos(theta)).addScaledVector(_b, Math.sin(theta));
    pos.copy(_f.C).addScaledVector(up, TUBE_R + h);
    (out.forward || (out.forward = new THREE.Vector3())).copy(_f.T);
    (out.side || (out.side = new THREE.Vector3())).crossVectors(_f.T, up);
    return out;
  };
  // theta of the radial that points most nearly at world up
  const crownTheta = (s) => { frameAt(s, _f); _b.crossVectors(_f.T, _f.N); return Math.atan2(_b.y, _f.N.y); };
  // theta of the radial that points most nearly at a given point
  const thetaToward = (s, p) => { frameAt(s, _f); _b.crossVectors(_f.T, _f.N); _d.subVectors(p, _f.C); return Math.atan2(_d.dot(_b), _d.dot(_f.N)); };
  // half-float frame texture: rows 0 = centre rounded to whole metres, 1 = remainder, 2 = tangent, 3 = normal
  const data = new Uint16Array(FN * 4 * 4), hf = THREE.DataUtils.toHalfFloat;
  for (let i = 0; i < FN; i++) {
    for (let k = 0; k < 3; k++) {
      const c = C[i * 3 + k], hi = Math.round(c);
      data[(0 * FN + i) * 4 + k] = hf(hi); data[(1 * FN + i) * 4 + k] = hf(c - hi);
      data[(2 * FN + i) * 4 + k] = hf(T[i * 3 + k]); data[(3 * FN + i) * 4 + k] = hf(N[i * 3 + k]);
    }
    for (let r = 0; r < 4; r++) data[(r * FN + i) * 4 + 3] = hf(1);
  }
  const tex = new THREE.DataTexture(data, FN, 4, THREE.RGBAFormat, THREE.HalfFloatType);
  tex.minFilter = tex.magFilter = THREE.NearestFilter; tex.generateMipmaps = false; tex.needsUpdate = true;
  return { P, L, tOfS, sOfT, frameAt, place, crownTheta, thetaToward, tex };
}

// Vertex-shader chunk shared by everything that stands on the river.
const RADIAL_GLSL = /* glsl */ `
uniform sampler2D uFrames; uniform float uLen; uniform float uTubeR;
void knotFrame(float s, out vec3 C, out vec3 T, out vec3 N) {
  float x = fract(s / uLen) * ${FN}.0;
  float fl = floor(x); float f = x - fl;
  int a = int(fl) & ${FN - 1}; int b = (a + 1) & ${FN - 1};
  vec3 c0 = texelFetch(uFrames, ivec2(a, 0), 0).xyz + texelFetch(uFrames, ivec2(a, 1), 0).xyz;
  vec3 c1 = texelFetch(uFrames, ivec2(b, 0), 0).xyz + texelFetch(uFrames, ivec2(b, 1), 0).xyz;
  vec3 t0 = texelFetch(uFrames, ivec2(a, 2), 0).xyz, t1 = texelFetch(uFrames, ivec2(b, 2), 0).xyz;
  vec3 n0 = texelFetch(uFrames, ivec2(a, 3), 0).xyz, n1 = texelFetch(uFrames, ivec2(b, 3), 0).xyz;
  C = mix(c0, c1, f);
  T = normalize(mix(t0, t1, f));
  vec3 n = mix(n0, n1, f);
  N = normalize(n - T * dot(n, T));
}
// R = the thing's own up, F = its forward (river direction turned by yaw about R), S = its side
void radialBasis(float s, float theta, float yaw, out vec3 C, out vec3 T, out vec3 R, out vec3 F, out vec3 S) {
  vec3 N; knotFrame(s, C, T, N);
  vec3 B = cross(T, N);
  R = cos(theta) * N + sin(theta) * B;
  vec3 A = cross(T, R);
  F = cos(yaw) * T + sin(yaw) * A;
  S = cross(R, F);
}
`;

// Analytic dawn sky + cloud sea, shared by every fragment shader that reflects or is lit by the sky.
const SKY_GLSL = /* glsl */ `
uniform vec3 uSunDir, uSunCol, uPeach, uCream, uLilac, uTeal, uDeep, uAqua, uMoonAmb;
vec3 skyCol(vec3 d) {
  float h = d.y;
  vec3 up = mix(uPeach * 0.86, uCream * 0.84, smoothstep(0.0, 0.2, h));
  up = mix(up, uLilac * 0.9, smoothstep(0.14, 0.8, h));
  float sunSide = 0.5 + 0.5 * dot(d.xz / max(length(d.xz), 1e-3), uSunDir.xz / max(length(uSunDir.xz), 1e-3));
  vec3 dn = mix(uLilac * 0.62, uPeach * 0.74, 0.35 + 0.65 * sunSide);
  dn = mix(dn, uPeach * 0.8, smoothstep(-0.5, -0.02, h) * 0.5);
  return mix(dn, up, smoothstep(-0.05, 0.03, h));
}
// soft ambient from sky above and cloud sea below
vec3 skyAmbient(vec3 n) {
  float k = 0.5 + 0.5 * n.y;
  // uMoonAmb (night only, zero by day): a cool light wrapped round from the moon's side, so dark things keep a lit edge
  return mix(uPeach * 0.50, mix(uCream, uLilac, 0.55) * 0.62, k * k * (3.0 - 2.0 * k)) + uMoonAmb * (0.25 + 0.75 * smoothstep(-0.35, 0.75, dot(n, uSunDir)));
}
`;

// ---------------------------------------------------------------------------------------------------
// tileable noise: RG = gradient of an fbm height, B = the height, A = a second fbm
// ---------------------------------------------------------------------------------------------------
async function makeNoiseTex(rng, renderer, pause) {
  const S = 256, field = async () => {
    const h = new Float32Array(S * S); let amp = 1;
    for (let o = 0; o < 5; o++) {
      const P = 4 << o, lat = new Float32Array(P * P), sc = P / S, m = P - 1;
      for (let i = 0; i < P * P; i++) lat[i] = rng();
      for (let y = 0; y < S; y++) {
        const fy = y * sc, iy = Math.floor(fy), ty = fy - iy, wy = ty * ty * (3 - 2 * ty), r0 = (iy & m) * P, r1 = ((iy + 1) & m) * P;
        for (let x = 0; x < S; x++) {
          const fx = x * sc, ix = Math.floor(fx), tx = fx - ix, wx = tx * tx * (3 - 2 * tx), c0 = ix & m, c1 = (ix + 1) & m;
          const a = lat[r0 + c0] + (lat[r0 + c1] - lat[r0 + c0]) * wx, b = lat[r1 + c0] + (lat[r1 + c1] - lat[r1 + c0]) * wx;
          h[y * S + x] += amp * (a + (b - a) * wy);
        }
        if ((y & 127) === 127) await pause?.();
      }
      amp *= 0.5;
      if (o >= 2) await pause?.();
    }
    let lo = 1e9, hi = -1e9; for (let i = 0; i < S * S; i++) { lo = Math.min(lo, h[i]); hi = Math.max(hi, h[i]); }
    for (let i = 0; i < S * S; i++) h[i] = (h[i] - lo) / (hi - lo);
    return h;
  };
  const h = await field(); await pause?.(); const h2 = await field(); await pause?.();     // (the rng is the hero's own fork: nothing can draw in between)
  const d = new Uint8Array(S * S * 4); let gm = 1e-6;
  const gx = new Float32Array(S * S), gy = new Float32Array(S * S);
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    const i = y * S + x;
    gx[i] = h[y * S + ((x + 1) & 255)] - h[y * S + ((x + 255) & 255)];
    gy[i] = h[((y + 1) & 255) * S + x] - h[((y + 255) & 255) * S + x];
    gm = Math.max(gm, Math.abs(gx[i]), Math.abs(gy[i]));
  }
  for (let i = 0; i < S * S; i++) {
    d[i * 4] = Math.round(255 * (0.5 + (0.5 * gx[i]) / gm)); d[i * 4 + 1] = Math.round(255 * (0.5 + (0.5 * gy[i]) / gm));
    d[i * 4 + 2] = Math.round(255 * h[i]); d[i * 4 + 3] = Math.round(255 * h2[i]);
  }
  const tex = new THREE.DataTexture(d, S, S, THREE.RGBAFormat, THREE.UnsignedByteType);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.magFilter = THREE.LinearFilter; tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.generateMipmaps = true; tex.anisotropy = Math.min(8, renderer?.capabilities?.getMaxAnisotropy?.() || 1); tex.needsUpdate = true;
  return tex;
}

// ---------------------------------------------------------------------------------------------------
// water
// ---------------------------------------------------------------------------------------------------
const WATER_VERT = /* glsl */ `
attribute vec3 aT; attribute vec2 aST;
uniform float uTime, uBulge; uniform vec3 uBulgeK;
varying vec3 vWPos, vR, vT; varying vec2 vST;
#include <fog_pars_vertex>
void main() {
  float bl = uBulge * (0.6 * sin(aST.x * uBulgeK.x - uTime * uBulgeK.y + aST.y) + 0.4 * sin(aST.x * uBulgeK.z + uTime * 1.3 + 2.0 * aST.y));
  vec4 wp = modelMatrix * vec4(position + normal * bl, 1.0);
  vWPos = wp.xyz; vST = aST;
  vR = normalize(mat3(modelMatrix) * normal);
  vT = normalize(mat3(modelMatrix) * aT);
  vec4 mvPosition = viewMatrix * wp;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;

const WATER_FRAG = /* glsl */ `
precision highp float;
uniform sampler2D uNoise;
uniform vec4 uSc, uTc;            // tiles per metre along s / tiles round the girth, four ripple layers
uniform vec2 uOffA, uOffB, uOffC, uOffD, uOffE, uShoal;
uniform float uRipple, uGlow, uDepthM, uCirc, uShoalFar, uLimbP, uGlowK, uFresK, uBodyGain, uFarLines, uFill, uGlowFar;
uniform vec3 uHaze; uniform vec2 uHazeK, uRefl; uniform float uGlitter;    // haze colour; (density per metre, ceiling)
uniform vec2 uStreak;           // current lines: strength, how far they carry (1 = the river's own 50-300 m)
uniform float uCaustK, uTime, uGlitW, uLimbPale, uNetK; uniform vec4 uNet; uniform vec3 uFarCore; uniform vec3 uCaust;      // the far core's own colour; (light let through to the face away from the sun, the sun seen through the glass, fill on undersides)
varying vec3 vWPos, vR, vT; varying vec2 vST;
${SKY_GLSL}
#include <fog_pars_fragment>
void main() {
  vec3 R = normalize(vR);
  vec3 T = normalize(vT - R * dot(vT, R));
  vec3 A = cross(T, R);
  vec3 Vv = cameraPosition - vWPos; float dist = length(Vv); vec3 V = Vv / max(dist, 1e-3);
  float tN = vST.y * 0.15915494;
  vec4 nA = texture2D(uNoise, vec2(vST.x * uSc.x, tN * uTc.x) + uOffA);
  vec4 nB = texture2D(uNoise, vec2(vST.x * uSc.y, tN * uTc.y) + uOffB);
  vec4 nC = texture2D(uNoise, vec2(vST.x * uSc.z, tN * uTc.z) + uOffC);
  vec4 nD = texture2D(uNoise, vec2(vST.x * uSc.w, tN * uTc.w) + uOffD);
  float fineK = 1.0 - 0.6 * smoothstep(90.0, 320.0, dist);       // fine ripples only where they resolve: no grain on far faces
  vec2 g = (nA.rg - 0.5) * 0.9 + (nB.rg - 0.5) * 0.8 * (0.4 + 0.6 * fineK) + (nC.rg - 0.5) * 0.75 * fineK;
  vec3 N = normalize(R + (T * g.x + A * g.y) * uRipple);
  float rdv = clamp(dot(R, V), 0.0, 1.0);
  float ndv = clamp(dot(N, V), 0.0, 1.0);
  vec3 rd = reflect(-V, N);
  rd = normalize(rd + R * max(0.0, -dot(rd, R)) * 1.5);
  float fq = 1.0 - ndv; fq *= fq;
  float fres = (0.025 + 0.62 * fq * fq) * uFresK * uRefl.x;
  vec3 refl = skyCol(rd) * mix(vec3(0.62, 0.8, 0.78), uAqua * 1.3 + uTeal * 0.5, uRefl.y);   // the sky, seen in coloured glass

  // the glass body: teal, deepening to the core where the eye looks through most water. Near, that is measured along
  // the eye's ray; far off it is measured ACROSS the strand, so every distant loop keeps a dark core down its middle
  float farK = smoothstep(120.0, 900.0, dist);
  vec3 Vx = V - T * dot(V, T);
  float rdvX = clamp(dot(R, Vx) / max(length(Vx), 0.05), 0.0, 1.0);
  float coreF = smoothstep(0.22, 0.92, rdvX);                     // far: deepening smoothly to the middle of the strand's width (no kerb)
  float farK2 = smoothstep(100.0, 350.0, dist);                   // from here a strand is seen whole, across its width
  float core = mix(smoothstep(0.2, 0.95, rdv), coreF, max(farK, 0.8 * farK2));
  float coreT = 1.0 - 0.9 * coreF * farK2;                        // light that has come through the thick middle of a strand is spent: the core stays deep, the limb bright
  // (the pipeline's ACES lifts mid-tones about 2x, so the palette is entered at roughly half strength)
  vec3 deepC = mix(uDeep * 0.5, uFarCore, farK);                 // the far core keeps a clear colour of its own under the haze: never slate
  vec3 body = mix(uTeal * (0.5 + 0.25 * farK), deepC, core * 0.94);
  float coreShade = 1.0 - 0.6 * coreF * farK;                     // the far core stays dark under the scattered light and the haze
  float sunSide = 0.5 + 0.5 * dot(R, uSunDir);
  body *= (0.6 + 0.55 * sunSide) * uBodyGain;
  body *= mix(0.86 + 0.28 * nA.b, 1.0, farK2);                   // slow tonal drift along the flow (near only: far off nothing may band a strand)
  float rip = clamp(g.x * 0.5 + g.y * 0.7, -0.5, 0.5) * (1.0 - 0.75 * smoothstep(140.0, 480.0, dist));
  body *= 1.0 + rip * 0.9;                                       // ripples refract the light inside
  body += (uPeach * (0.03 * uFill + 0.1 * uCaust.z) * max(-R.y, 0.0) + uAqua * uAqua * 0.16 * uCaust.z * max(-R.y, 0.0) * (1.0 - 0.6 * farK) + uLilac * 0.015 * max(R.y, 0.0) * uFill) * (1.0 - 0.5 * farK)
     + uAqua * uAqua * (0.03 + 0.07 * sunSide * sunSide) * uFill * coreShade;   // sunlit water scatters its own colour

  // shoals: dark threads turning at a parallax depth
  vec2 par = vec2(dot(V, T), dot(V, A)) / max(rdv, 0.3) * uDepthM;
  vec2 suv = vec2((vST.x - par.x) * uShoal.x, (tN - par.y / uCirc) * uShoal.y) + uOffE;
  float sh = texture2D(uNoise, suv).a;
  float shMask = smoothstep(0.58, 0.76, texture2D(uNoise, suv * vec2(0.5, 1.0) + vec2(0.37, 0.61) - uOffE * 0.4).b);
  float thread = (1.0 - smoothstep(0.012, 0.07, abs(sh - 0.5))) * shMask;
  thread *= (1.0 - smoothstep(uShoalFar * 0.3, uShoalFar, dist)) * smoothstep(0.12, 0.5, rdv);
  body *= 1.0 - 0.2 * thread;                                    // shoals: soft darker ribbons inside the glass, here and there

  // foam current lines streaming with the flow
  vec4 nD2 = texture2D(uNoise, vec2(vST.x * uSc.w * 3.0, tN * uTc.w * 3.0) + uOffD * 3.0 + vec2(0.31, 0.57));
  float l1 = 1.0 - smoothstep(0.0, 0.022, abs(nD.a - 0.5));
  float l2 = 1.0 - smoothstep(0.0, 0.02, abs(nD2.b - 0.5));
  float streak = (l1 * 0.7 * smoothstep(0.42, 0.62, nA.b) + l2 * 0.5 * smoothstep(0.45, 0.68, nD.b)) * (0.5 + 0.5 * nC.b);
  streak *= 1.0 - smoothstep(40.0 * uStreak.y, 190.0 * uStreak.y, dist);   // thin lines only where they resolve
  streak *= 0.3 + 0.7 * smoothstep(0.06, 0.38, rdv);                        // and not where the eye grazes the water (scratches)
  streak += smoothstep(0.66, 0.84, nD2.a) * smoothstep(0.52, 0.72, nD.b) * 0.3 * (1.0 - smoothstep(400.0, 1200.0, dist));
  // far strands: many hair-thin current streaks of unequal length that bunch and fade (never a lane line down the middle).
  // Noise stretched fourteen times along the flow and thresholded at its crests: under minification it falls to its mean
  // and the streaks fade out instead of joining into a band
  vec2 fu = vec2(vST.x * uSc.w * 2.0 + uOffD.x * 2.0, tN);
  float f1 = texture2D(uNoise, vec2(fu.x + 0.13, fu.y * uFarLines * 3.0 + 0.71)).b;
  float f2 = texture2D(uNoise, vec2(fu.x * 0.8 + 0.4, fu.y * uFarLines + 0.2)).a;
  float f4 = texture2D(uNoise, vec2(fu.x * 0.5 + 0.77, fu.y * floor(uFarLines * 0.5) + 0.43)).b;
  float f3 = texture2D(uNoise, vec2(fu.x * 0.31 + uOffD.x * 2.0 + 0.37, fu.y * 4.0 + 0.59)).b;      // the bunching runs down the strand 16 m/s faster than the water (cat's-paws of wind): streaks brighten and fade as they stream
  // three widths of streak, each shown at the distances where it is a few pixels wide (about 3 m, 8 m and 16 m across), so a
  // loop a kilometre off still carries lines that are seen to stream along it
  float w1 = smoothstep(90.0, 200.0, dist) * (1.0 - smoothstep(320.0, 560.0, dist));
  float w2 = smoothstep(260.0, 460.0, dist) * (1.0 - smoothstep(800.0, 1300.0, dist));
  float w3 = smoothstep(700.0, 1150.0, dist) * (1.0 - smoothstep(2600.0, 3600.0, dist));
  float ln1 = smoothstep(0.6, 0.7, f1), ln2 = 1.0 - smoothstep(0.0, 0.036, abs(f2 - 0.5)), ln3 = 1.0 - smoothstep(0.0, 0.05, abs(f4 - 0.5));
  float farLine = (ln1 * 0.5 * w1 + ln2 * 0.55 * w2 + ln3 * 0.7 * w3) * smoothstep(0.26, 0.6, f3) * (0.3 + 0.7 * smoothstep(0.0, 0.45, rdvX));
  streak += farLine * 0.8;
  float lineK = clamp(streak * uStreak.x, 0.0, 1.0) * 0.55;
  body = mix(body, uCream * 0.55 * mix(0.5 + 0.5 * sunSide, 1.0, uLimbPale), lineK);     // (by moonlight the lines are silver whichever way a face is turned)

  // transmitted light: the limb away from the sun glows; a strand aimed at the sun lights like a glass rod
  vec3 Sp = uSunDir - T * dot(uSunDir, T); float spl = length(Sp);
  float k = clamp(dot(R, -Sp) / max(spl, 0.05), 0.0, 1.0);
  float rimSun = clamp(dot(R, Sp) / max(spl, 0.05), 0.0, 1.0);
  float limb = 1.0 - rdv; float limb2 = limb * limb; float limb4 = limb2 * limb2;
  // the bright rim is measured across the strand (uLimbP = 1), not along the eye's ray: looking down the length of a
  // strand, or up at one from just beneath it, every ray grazes the water, and the rim would swell into a glare band.
  // Far strands always measure it across, and widen it to about a tenth of their width so it holds at a kilometre
  float lp = mix(uLimbP, 1.0, farK);
  float lq = 1.0 - mix(rdv, rdvX, lp); float lq2 = lq * lq; float lq4 = lq2 * lq2;
  float wideF = mix(lq2 * (1.0 - 0.55 * lq2), lq2 * lq * 1.25, farK);     // the outer tenth, without doubling the very edge (far: narrower, so the core stays deep)
  float gf = mix(1.0, uGlowFar, farK);
  float trans = (0.07 * (1.0 - 0.75 * farK) * uFill * k * k + (0.22 + 1.5 * farK * gf) * k * wideF + 1.3 * farK * gf * wideF * max(1.0 - 0.75 * rimSun, 0.0) + 2.3 * k * lq4 * gf + 0.12 * mix(limb4, lq4, lp * 0.6)) * smoothstep(0.0, 0.35, spl);
  float pipe = smoothstep(0.78, 0.99, abs(dot(uSunDir, T)));
  trans += pipe * (0.05 * (1.0 - 0.6 * farK) + 0.9 * lq4 + 0.7 * farK * wideF);
  trans *= mix(0.8 + 0.4 * nB.b, 1.0, farK2);
  float rB = 1.0 - abs(2.0 * nB.b - 1.0), rC = 1.0 - abs(2.0 * nC.b - 1.0), rA = 1.0 - abs(2.0 * nA.b - 1.0);
  // light on a belly: broad, soft, uneven bands that lie ALONG the flow and stream with it (never across the strand). The two
  // lookups run a little askew to the river (whole turns round the girth, whole counts along the length, so there is no seam)
  float n1 = texture2D(uNoise, vec2(vST.x * uNet.x + tN, 5.0 * tN - vST.x * uNet.y) + vec2(-uTime * 0.008, uTime * 0.0011)).b;
  float n2 = texture2D(uNoise, vec2(vST.x * uNet.z - tN, 8.0 * tN + vST.x * uNet.w) + (n1 - 0.5) * 0.05 + vec2(-uTime * 0.011, -uTime * 0.0009)).a;
  float r1 = 1.0 - abs(2.0 * n1 - 1.0), r2 = 1.0 - abs(2.0 * n2 - 1.0);
  float net = 1.25 * smoothstep(0.3, 0.72, n1) * (0.5 + 0.5 * r2) + 0.45 * r1 * r1 * r2 + 0.12 * rA * rB * fineK;
  net = mix(net, net * net * 1.6, uNetK);                           // (by moonlight the bands are fewer and stand further apart in tone)
  net = mix(net, 0.5, smoothstep(140.0, 330.0, dist));              // far off the bands are gone: nothing rings or bands a distant strand
  float k2 = k * k;
  float underK = smoothstep(0.25, -0.45, R.y);                     // the bands show on bellies; a top face turned from the light stays deep glass
  float bandK = max(underK, 0.6 * uNetK * (1.0 - farK2));           // (by moonlight the near water turned from the moon carries the bands too)
  trans += uCaust.x * uCaustK * k2 * (0.3 + 0.7 * k2) * mix(0.3, 0.2 + 0.95 * net, bandK) * (1.0 - 0.85 * farK) * coreT * smoothstep(0.0, 0.35, spl);
  float thr = max(dot(-V, uSunDir), 0.0); float thr4 = thr * thr; thr4 *= thr4; float thr16 = thr4 * thr4; thr16 *= thr16;
  trans += uCaust.y * uCaustK * k2 * (thr16 * thr16 * 1.3 + thr16 * 0.22 + thr4 * 0.02) * mix(0.7 + 0.6 * nB.b, 1.0, farK2) * mix(1.0, 0.4 + 1.2 * net, uNetK * (1.0 - farK2)) * (1.0 - 0.5 * farK) * (1.0 - 0.6 * coreF * farK2);       // the sun or moon behind the strand, diffused in it
  trans *= (1.0 + rip * 1.1) * (1.0 - 0.4 * thread) * (1.0 - 0.45 * lineK);     // the light in the glass is rippled, and shoals and current lines show against it
  trans = 1.9 * (1.0 - exp(-max(trans, 0.0) / 1.9));              // a soft ceiling: the rim keeps its colour
  vec3 aquaSat = uAqua * uAqua * 1.7;
  vec3 glow = mix(mix(aquaSat, uAqua, 0.1 + 0.35 * lq4), uCream * 0.9, uLimbPale * lq2) * trans * uGlow * uGlowK;     // (by moonlight the limb pales to silver)

  // sun: a thin cream highlight on the sunward limb and glitter on the ripples
  float sunVis = smoothstep(-0.04, 0.12, dot(R, uSunDir));
  float sd = clamp(dot(rd, uSunDir), 1e-4, 1.0);
  // glitter keeps the sun's colour; the broad sheen is seen through the water's own colour (warm light on blue water went slate)
  vec3 spec = uSunCol * (pow(sd, 700.0) * 5.0 + pow(sd, 48.0) * 0.2 * mix(vec3(1.0), uAqua * 1.6, 0.7)) * sunVis * uGlitter;
  spec += uSunCol * pow(sd, 150.0) * 0.6 * uGlitW * sunVis;      // a low moon's road on the ripples is wider than the sun's
  spec += uCream * uSunCol * rimSun * rimSun * rimSun * (0.2 * limb4 + 0.5 * farK * lq2 * lq) * sunVis;
  // the light's path along a strand: on a wet cylinder the glint of sun or moon is a line that runs the strand's length where
  // the surface halves the angle between the light and the eye. Far off the ripples that break it are too small to see, so
  // it is broken by the streaming streaks instead: a thin path of glitter that travels along the lit side
  vec3 Hh = V + uSunDir; vec3 Hx = Hh - T * dot(Hh, T); float hxl = length(Hx);
  float hl = clamp(dot(R, Hx) / max(hxl, 0.05), 0.0, 1.0); float hl2 = hl * hl; float hl8 = hl2 * hl2; hl8 *= hl8; float hl32 = hl8 * hl8; hl32 *= hl32;
  float hl128 = hl32 * hl32; hl128 *= hl128;
  float pathG = hl128 * hl128 * smoothstep(0.1, 0.5, hxl) * smoothstep(-0.02, 0.1, dot(R, uSunDir)) * smoothstep(60.0, 260.0, dist);      // a thin line: a few degrees of the girth
  spec += uCream * uSunCol * pathG * (0.05 + 1.2 * smoothstep(0.5, 0.66, f1) * (0.4 + 0.6 * f3) + 0.9 * ln2 * w2 + 0.9 * ln3 * w3) * 0.2 * uGlitter;

  spec = 1.7 * (1.0 - exp(-spec / 1.7));                          // a shoulder: glitter sparkles, a path of light never burns to a white band
  vec3 col = mix(body, refl, fres * (1.0 - 0.45 * farK)) + glow + spec;
  // air between us and the strand: far loops go paler toward the horizon's colour, so the knot stacks in depth
  col = mix(col, uHaze, uHazeK.y * (1.0 - exp(-dist * uHazeK.x)) * coreShade * (1.0 - 0.5 * coreF * farK2));
  gl_FragColor = vec4(col, 1.0);
  #include <fog_fragment>
}`;

// One tube mesh in sections: fine rings where the camera comes close, coarse elsewhere; a fine end ring has
// its odd vertices dropped onto the coarse ring's chords so the join has no cracks.
async function buildTube(K, sections, pause) {
  let nv = 0, ni = 0;
  for (const sc of sections) { sc.rings = Math.max(2, Math.ceil((sc.s1 - sc.s0) / sc.step) + 1); nv += sc.rings * (sc.radial + 1); ni += (sc.rings - 1) * sc.radial * 6; }
  const pos = new Float32Array(nv * 3), nor = new Float32Array(nv * 3), tan = new Float32Array(nv * 3), st = new Float32Array(nv * 2), idx = new Uint32Array(ni);
  const f = {}, B = new THREE.Vector3(); let v = 0, ii = 0;
  for (const sc of sections) {
    const base = v, W = sc.radial + 1;
    for (let j = 0; j < sc.rings; j++) {
      const s = sc.s0 + ((sc.s1 - sc.s0) * j) / (sc.rings - 1); K.frameAt(s, f); B.crossVectors(f.T, f.N);
      const snap = sc.snap && (j === 0 || j === sc.rings - 1);
      if (pause && (j & 63) === 63) await pause();
      for (let k = 0; k <= sc.radial; k++, v++) {
        const th = (k / sc.radial) * TAU, c = Math.cos(th), sn = Math.sin(th);
        const rx = f.N.x * c + B.x * sn, ry = f.N.y * c + B.y * sn, rz = f.N.z * c + B.z * sn;
        const rr = snap && (k & 1) ? TUBE_R * Math.cos(TAU / sc.radial) : TUBE_R;
        pos[v * 3] = f.C.x + rx * rr; pos[v * 3 + 1] = f.C.y + ry * rr; pos[v * 3 + 2] = f.C.z + rz * rr;
        nor[v * 3] = rx; nor[v * 3 + 1] = ry; nor[v * 3 + 2] = rz;
        tan[v * 3] = f.T.x; tan[v * 3 + 1] = f.T.y; tan[v * 3 + 2] = f.T.z;
        st[v * 2] = s; st[v * 2 + 1] = th;
      }
    }
    for (let j = 0; j < sc.rings - 1; j++) for (let k = 0; k < sc.radial; k++) {
      const a = base + j * W + k, b = a + 1, c = a + W, d = c + 1;
      idx[ii++] = a; idx[ii++] = b; idx[ii++] = c; idx[ii++] = b; idx[ii++] = d; idx[ii++] = c;
    }
    if (pause) await pause();
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  g.setAttribute('aT', new THREE.BufferAttribute(tan, 3)); g.setAttribute('aST', new THREE.BufferAttribute(st, 2));
  g.setIndex(new THREE.BufferAttribute(idx, 1));
  return g;
}

// ---------------------------------------------------------------------------------------------------
// boats: a small mesh builder and the lateen boat (model space: x = side, y = up, z = forward, metres)
// aMat = (kind, a, b, weight): kind 0 solid, 1 sail (a = seam coordinate, b = yard-to-clew), 2 hanging cloth
// (b = 0 at the line .. 1 at the free hem), 3 rigging ribbon (normal = widening direction, weight = half width)
// ---------------------------------------------------------------------------------------------------
export function makeBuilder(rng) {
  const P = [], Nn = [], Cc = [], M = [], col = new THREE.Color();
  const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const norm = (a) => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
  const rgb = (c, jit = 0) => { col.set(c); const k = 1 + (rng() - 0.5) * 2 * jit; return [col.r * k, col.g * k, col.b * k]; };
  const push = (p, n, c, m) => { P.push(p[0], p[1], p[2]); Nn.push(n[0], n[1], n[2]); Cc.push(c[0], c[1], c[2]); M.push(m[0], m[1], m[2], m[3]); };
  const Z = [0, 0, 0, 0];
  const b = {
    rgb, norm, sub, cross,
    get tris() { return P.length / 9; },
    tri(p0, p1, p2, c, m0 = Z, m1 = m0, m2 = m0, n = null) {
      const fn = n || norm(cross(sub(p1, p0), sub(p2, p0)));
      push(p0, n ? n[0] : fn, c, m0); push(p1, n ? n[1] : fn, c, m1); push(p2, n ? n[2] : fn, c, m2);
    },
    quad(p0, p1, p2, p3, c, m0 = Z, m1 = m0, m2 = m0, m3 = m0) {
      let fn = norm(cross(sub(p1, p0), sub(p3, p0)));
      if (!(Math.abs(fn[0]) + Math.abs(fn[1]) + Math.abs(fn[2]) > 0.5)) fn = norm(cross(sub(p2, p1), sub(p3, p1)));
      push(p0, fn, c, m0); push(p1, fn, c, m1); push(p2, fn, c, m2); push(p0, fn, c, m0); push(p2, fn, c, m2); push(p3, fn, c, m3);
    },
    // tapered round spar between two points, smooth sided
    spar(p0, p1, r0, r1, sides, c, cap = false, m0 = Z, m1 = m0) {
      const ax = norm(sub(p1, p0)), up = Math.abs(ax[1]) > 0.9 ? [1, 0, 0] : [0, 1, 0], u = norm(cross(ax, up)), v = cross(ax, u);
      const ring = (p, r, k) => { const a = (k / sides) * TAU, cs = Math.cos(a), sn = Math.sin(a), n = [u[0] * cs + v[0] * sn, u[1] * cs + v[1] * sn, u[2] * cs + v[2] * sn]; return [[p[0] + n[0] * r, p[1] + n[1] * r, p[2] + n[2] * r], n]; };
      for (let k = 0; k < sides; k++) {
        const [a0, na] = ring(p0, r0, k), [b0, nb] = ring(p0, r0, k + 1), [a1] = ring(p1, r1, k), [b1] = ring(p1, r1, k + 1);
        push(a0, na, c, m0); push(b0, nb, c, m0); push(b1, nb, c, m1); push(a0, na, c, m0); push(b1, nb, c, m1); push(a1, na, c, m1);
        if (cap) { push(a1, ax, c, m1); push(b1, ax, c, m1); push(p1, ax, c, m1); }
      }
    },
    box(cx, cy, cz, sx, sy, sz, c, yaw = 0) {
      const cs = Math.cos(yaw), sn = Math.sin(yaw), q = (x, y, z) => [cx + (x * cs + z * sn) * sx * 0.5, cy + y * sy * 0.5, cz + (-x * sn + z * cs) * sz * 0.5];
      const F = [[[-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]], [[1, -1, -1], [-1, -1, -1], [-1, 1, -1], [1, 1, -1]], [[1, -1, 1], [1, -1, -1], [1, 1, -1], [1, 1, 1]],
        [[-1, -1, -1], [-1, -1, 1], [-1, 1, 1], [-1, 1, -1]], [[-1, 1, 1], [1, 1, 1], [1, 1, -1], [-1, 1, -1]], [[-1, -1, -1], [1, -1, -1], [1, -1, 1], [-1, -1, 1]]];
      for (const f of F) b.quad(q(...f[0]), q(...f[1]), q(...f[2]), q(...f[3]), c);
    },
    // two crossed ribbons that the vertex shader keeps at least ~1.5 px wide
    ribbon(p0, p1, hw, c) {
      const ax = norm(sub(p1, p0)), up = Math.abs(ax[1]) > 0.9 ? [1, 0, 0] : [0, 1, 0], u = norm(cross(ax, up)), v = cross(ax, u);
      for (const e of [u, v]) {
        const ne = [-e[0], -e[1], -e[2]], m = [3, 0, 0, hw];
        push(p0, e, c, m); push(p0, ne, c, m); push(p1, ne, c, m); push(p0, e, c, m); push(p1, ne, c, m); push(p1, e, c, m);
      }
    },
    geometry() {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(Nn, 3));
      g.setAttribute('color', new THREE.Float32BufferAttribute(Cc, 3)); g.setAttribute('aMat', new THREE.Float32BufferAttribute(M, 4));
      return g;
    },
  };
  return b;
}

// lod: 'hero' (about 800 triangles), 'far' (about 130), 'mirror' (hull, spars and sail only, for the reflection)
function buildBoat(rng, lod, pal) {
  const b = makeBuilder(rng), hero = lod === 'hero';
  const TAR = '#3a2c25', TAR2 = '#4a3a30', WOOD = '#8a6a4a', DECK = '#9a8468', CREAM = pal.cream, SPAR = '#7a5c40', ROPE = '#3b3028';
  const NS = hero ? 10 : lod === 'far' ? 5 : 4;
  const zeta = (z) => (z + 0.3) / 6.3;
  const halfW = (z) => 1.75 * Math.pow(Math.max(0, 1 - Math.pow(Math.abs(zeta(z)), 2.4)), 0.75);
  const sheer = (z) => { const q = zeta(z); return 1.05 + 0.75 * q * q + 0.95 * Math.pow(Math.max(q, 0), 3); };
  const keel = (z) => -0.55 + 0.62 * Math.pow(zeta(z), 4);
  const deckY = (z) => Math.min(sheer(z) - 0.42, 0.62 + 0.5 * zeta(z) * zeta(z));
  const section = (z) => {
    const w = halfW(z), hs = sheer(z), yk = keel(z), d = hs - yk, dk = deckY(z);
    const pts = [[0, yk], [0.6 * w, yk + 0.2 * d], [0.92 * w, yk + 0.52 * d], [1.0 * w, hs - 0.34], [1.03 * w, hs], [Math.max(0, 1.03 * w - 0.13), hs + 0.02], [Math.max(0, 1.03 * w - 0.17), dk], [0, dk]];
    return hero ? pts : lod === 'far' ? [pts[0], pts[1], pts[3], pts[4], pts[7]] : [pts[0], pts[2], pts[4]];
  };
  const strakeCol = hero ? [TAR, TAR2, TAR, CREAM, WOOD, TAR2, DECK] : lod === 'far' ? [TAR, TAR2, CREAM, DECK] : [TAR, TAR2];
  const z0 = -5.9, z1 = 6.1;
  for (let i = 0; i < NS; i++) {
    const za = z0 + ((z1 - z0) * i) / NS, zb = z0 + ((z1 - z0) * (i + 1)) / NS, A = section(za), B = section(zb);
    for (let j = 0; j < A.length - 1; j++) for (const sx of [1, -1]) {
      const c = b.rgb(strakeCol[j], strakeCol[j] === CREAM ? 0.05 : 0.16);
      if (strakeCol[j] === CREAM) { c[0] *= 0.82; c[1] *= 0.82; c[2] *= 0.82; }
      b.quad([sx * A[j][0], A[j][1], za], [sx * B[j][0], B[j][1], zb], [sx * B[j + 1][0], B[j + 1][1], zb], [sx * A[j + 1][0], A[j + 1][1], za], c);
    }
  }
  // spars
  const mastB = [0, 0.6, -0.5], mastT = [0, 12.0, 1.3], F = [0.18, 2.7, 6.3], K = [0.18, 13.3, -3.6], Cl = [0.95, 2.3, -5.0];
  const yardM = [(F[0] + K[0]) / 2, (F[1] + K[1]) / 2, (F[2] + K[2]) / 2], sides = hero ? 6 : 3;
  b.spar(mastB, mastT, 0.17, 0.08, sides, b.rgb(SPAR, 0.05), hero);
  b.spar(yardM, F, 0.12, 0.05, hero ? 5 : 3, b.rgb(SPAR, 0.05)); b.spar(yardM, K, 0.12, 0.045, hero ? 5 : 3, b.rgb(WOOD, 0.05));
  // sail: a lateen triangle hung from the yard, bellied to leeward
  const na = hero ? 8 : lod === 'far' ? 4 : 4, nb = hero ? 6 : 3;
  const sp = (a, bb) => {
    const y = [F[0] + (K[0] - F[0]) * a, F[1] + (K[1] - F[1]) * a, F[2] + (K[2] - F[2]) * a];
    const p = [y[0] + (Cl[0] - y[0]) * bb, y[1] + (Cl[1] - y[1]) * bb, y[2] + (Cl[2] - y[2]) * bb];
    const belly = Math.pow(Math.sin(Math.PI * Math.min(1, a * 0.9 + 0.05)), 0.8) * Math.sin(Math.PI * Math.pow(bb, 0.8));
    p[0] += 1.3 * belly; p[1] -= 0.25 * belly;
    return p;
  };
  const sm = (a, bb) => [1, (1 - a) * (1 - bb), bb, Math.min(1, 4 * bb * (1 - bb) * (0.35 + 0.65 * a) + a * a * a * bb)];
  for (let i = 0; i < na; i++) for (let j = 0; j < nb; j++) {
    const a0 = i / na, a1 = (i + 1) / na, b0 = j / nb, b1 = (j + 1) / nb, sh = 0.94 + 0.1 * rng();
    const p00 = sp(a0, b0), p10 = sp(a1, b0), p11 = sp(a1, b1), p01 = sp(a0, b1), c = [sh, sh, sh];
    // smooth normals from the neighbouring grid points
    const nrm = (a, bb) => { const e = 0.02, d1 = b.sub(sp(Math.min(1, a + e), bb), sp(Math.max(0, a - e), bb)), d2 = b.sub(sp(a, Math.min(0.98, bb + e)), sp(a, Math.max(0, bb - e))); return b.norm(b.cross(d1, d2)); };
    const n00 = nrm(a0, b0), n10 = nrm(a1, b0), n11 = nrm(a1, b1), n01 = nrm(a0, b1);
    b.tri(p00, p10, p11, c, sm(a0, b0), sm(a1, b0), sm(a1, b1), [n00, n10, n11]);
    if (j < nb - 1) b.tri(p00, p11, p01, c, sm(a0, b0), sm(a1, b1), sm(a0, b1), [n00, n11, n01]);
  }
  const stemTop = [0, sheer(z1) + 1.25, z1 + 0.42], sternTop = [0, sheer(z0) + 1.0, z0 - 0.3];
  if (lod !== 'mirror' || true) {
    // a lantern on a crook over the stern: dark iron by day, lit at night (kind 5; the vertex shader keeps it a pixel and a half wide far off)
    const L = [0, LAMP_Y, LAMP_Z], hs = 0.17, hh = 0.24, lc = b.rgb('#2a2622', 0.05), K5 = [5, 0, 0, 0];
    const lp = (x, y, z) => [L[0] + x * hs, L[1] + y * hh, L[2] + z * hs];
    for (const f of [[[-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]], [[1, -1, -1], [-1, -1, -1], [-1, 1, -1], [1, 1, -1]], [[1, -1, 1], [1, -1, -1], [1, 1, -1], [1, 1, 1]], [[-1, -1, -1], [-1, -1, 1], [-1, 1, 1], [-1, 1, -1]]])
      b.quad(lp(...f[0]), lp(...f[1]), lp(...f[2]), lp(...f[3]), lc, K5);
    if (lod !== 'mirror') b.spar(sternTop, [0, LAMP_Y + hh, LAMP_Z], 0.045, 0.03, 3, b.rgb(TAR2, 0.1));
  }
  if (lod !== 'mirror') {
    // stem and stern posts
    b.spar([0, sheer(z1) - 0.5, z1 - 0.15], stemTop, 0.13, 0.07, hero ? 4 : 3, b.rgb(TAR2, 0.1), true);
    b.spar([0, sheer(z0) - 0.5, z0 + 0.12], sternTop, 0.12, 0.07, hero ? 4 : 3, b.rgb(TAR2, 0.1), true);
    b.ribbon(mastT, stemTop, 0.025, b.rgb(ROPE));
  }
  if (hero) {
    b.box(0, stemTop[1] - 0.22, stemTop[2] - 0.07, 0.24, 0.16, 0.24, b.rgb(CREAM, 0.05).map((x) => x * 0.8));
    // rigging
    b.ribbon([0, 9.6, 0.92], [1.5, sheer(-2.2), -2.2], 0.022, b.rgb(ROPE)); b.ribbon([0, 9.6, 0.92], [-1.5, sheer(-2.2), -2.2], 0.022, b.rgb(ROPE));
    b.ribbon(sp(1, 1), [0.5, sheer(-5.3) + 0.05, -5.3], 0.025, b.rgb(ROPE)); b.ribbon(F, [0, sheer(6) + 0.3, 6.05], 0.025, b.rgb(ROPE));
    b.ribbon([0.1, 9.0, 0.8], [0.35, 0.8, -1.6], 0.02, b.rgb(ROPE));
    for (const y of [3.2, 6.4]) b.spar([0, y, mastB[2] + ((mastT[2] - mastB[2]) * (y - 0.6)) / 11.4], [0, y + 0.22, mastB[2] + ((mastT[2] - mastB[2]) * (y - 0.38)) / 11.4], 0.2, 0.2, 6, b.rgb(ROPE, 0.1));
    // steering oar and tiller
    b.spar([0.62, 2.35, -4.7], [1.02, -0.5, -6.9], 0.07, 0.06, 4, b.rgb(WOOD, 0.1));
    b.quad([0.92, 0.5, -6.05], [1.2, 0.42, -6.3], [1.3, -0.7, -7.25], [0.98, -0.62, -7.0], b.rgb(WOOD, 0.1));
    b.spar([0.62, 2.35, -4.7], [0.2, 2.2, -3.5], 0.05, 0.035, 4, b.rgb(SPAR, 0.1));
    // thwarts, a hat on one of them
    for (const z of [3.3, 1.5, -2.7]) b.box(0, deckY(z) + 0.42, z, halfW(z) * 1.9, 0.07, 0.34, b.rgb(WOOD, 0.12));
    b.spar([0.62, deckY(1.5) + 0.46, 1.5], [0.62, deckY(1.5) + 0.5, 1.5], 0.36, 0.34, 8, b.rgb('#d8bf7c', 0.06), true);
    b.spar([0.62, deckY(1.5) + 0.5, 1.5], [0.62, deckY(1.5) + 0.66, 1.5], 0.2, 0.02, 8, b.rgb('#cdb06a', 0.06), true);
    // baskets with their loads
    for (const [x, z, load] of [[-0.55, 4.0, '#c9d2d6'], [0.5, 4.4, pal.red], [-0.75, 2.4, '#d9c48a']]) {
      const y = deckY(z);
      b.spar([x, y, z], [x, y + 0.5, z], 0.25, 0.37, 7, b.rgb('#b08a4e', 0.1));
      b.spar([x, y + 0.42, z], [x, y + 0.58, z], 0.34, 0.12, 7, b.rgb(load, 0.08), true);
    }
    // coiled net
    const ny = deckY(-1.2);
    b.spar([-0.6, ny, -1.2], [-0.6, ny + 0.2, -1.2], 0.72, 0.66, 9, b.rgb('#47686a', 0.1), true);
    b.spar([-0.6, ny + 0.2, -1.2], [-0.6, ny + 0.38, -1.2], 0.5, 0.4, 9, b.rgb('#5b7d7a', 0.1), true);
    b.spar([-0.6, ny + 0.38, -1.2], [-0.6, ny + 0.5, -1.2], 0.26, 0.18, 7, b.rgb('#39585c', 0.1), true);
    // furled awning on an A-frame aft
    const rz0 = -4.9, rz1 = -3.0, ry = 3.0;
    for (const z of [rz0, rz1]) for (const sx of [1, -1]) b.spar([sx * halfW(z) * 0.98, sheer(z), z], [0, ry, z], 0.045, 0.04, 3, b.rgb(SPAR, 0.1));
    b.spar([0, ry, rz0 - 0.25], [0, ry - 0.04, (rz0 + rz1) / 2], 0.2, 0.24, 6, b.rgb(CREAM, 0.04).map((x) => x * 0.78));
    b.spar([0, ry - 0.04, (rz0 + rz1) / 2], [0, ry, rz1 + 0.25], 0.24, 0.19, 6, b.rgb(CREAM, 0.04).map((x) => x * 0.72));
    for (const z of [rz0 + 0.3, (rz0 + rz1) / 2, rz1 - 0.3]) b.spar([0, ry - 0.05, z - 0.04], [0, ry - 0.05, z + 0.04], 0.26, 0.26, 6, b.rgb(pal.red, 0.05));
    // laundry on a line from the mast to the stern post
    const l0 = [0, 4.3, -0.05], l1 = sternTop; b.ribbon(l0, l1, 0.018, b.rgb(ROPE));
    const cloths = [[0.2, 0.75, 1.0, CREAM], [0.36, 0.6, 0.8, pal.red], [0.5, 0.8, 1.15, '#d8e6e2'], [0.66, 0.55, 0.7, pal.aqua], [0.8, 0.7, 0.9, CREAM]];
    for (const [t, w, h, cc] of cloths) {
      const at = (q) => [l0[0] + (l1[0] - l0[0]) * q, l0[1] + (l1[1] - l0[1]) * q, l0[2] + (l1[2] - l0[2]) * q];
      const dq = (w * 0.5) / 6.2, a = at(t - dq), c2 = at(t + dq), c = b.rgb(cc, 0.05).map((x) => x * 0.85);
      b.quad(a, c2, [c2[0], c2[1] - h, c2[2]], [a[0], a[1] - h, a[2]], c, [2, 0, 0, 0], [2, 1, 0, 0], [2, 1, 1, 1], [2, 0, 1, 1]);
    }
  }
  return b;
}

// herons: legs, body, folded wings, S neck, head with a dagger bill and a black plume (b = a makeBuilder)
export function addHeron(b, hx, hz, face, size, pose, y0 = 0.45, white = false) {
  const cs = Math.cos(face), sn = Math.sin(face), S = size;
  const q = (x, y, z) => [hx + (z * sn + x * cs) * S, y0 + y * S, hz + (z * cs - x * sn) * S];
  const GREY = white ? '#b9bab4' : '#8d969d', WING = white ? '#a9aaa6' : '#5c6875', LEG = '#7d6c42', BILL = '#b98a2c', BLACK = '#1c1f24', WHITE = '#b4b7b4';
  const sw = (w) => [4, 0, 0, w];
  const sparS = (p0, p1, r0, r1, n, c, w0 = 0, w1 = w0) => b.spar(q(...p0), q(...p1), r0 * S, r1 * S, n, b.rgb(c, 0.05), true, sw(w0), sw(w1));
  for (const lx of [-0.07, 0.07]) { sparS([lx, 0, 0.02], [lx * 1.1, 0.42, lx > 0 ? 0.06 : -0.02], 0.022, 0.026, 4, LEG); sparS([lx * 1.1, 0.42, lx > 0 ? 0.06 : -0.02], [lx, 0.82, 0], 0.026, 0.04, 4, LEG); }
  sparS([0, 0.9, -0.5], [0, 0.92, -0.18], 0.04, 0.15, 6, WING);            // tail
  sparS([0, 0.92, -0.18], [0, 1.0, 0.12], 0.15, 0.17, 6, GREY);             // body
  sparS([0, 1.0, 0.12], [0, 1.12, 0.3], 0.17, 0.08, 6, WHITE);              // breast
  for (const sx of [-1, 1]) b.quad(q(sx * 0.17, 1.08, 0.16), q(sx * 0.19, 0.9, 0.05), q(sx * 0.1, 0.84, -0.52), q(sx * 0.14, 1.04, -0.2), b.rgb(WING, 0.08));
  const n0 = [0, 1.12, 0.3], n1 = [0, 1.32 + 0.1 * pose, 0.2 - 0.05 * pose], n2 = [0, 1.5 + 0.16 * pose, 0.3], n3 = [0, 1.62 + 0.2 * pose, 0.36];
  sparS(n0, n1, 0.075, 0.05, 5, WHITE, 0, 0.05); sparS(n1, n2, 0.05, 0.042, 5, GREY, 0.05, 0.11); sparS(n2, n3, 0.042, 0.06, 5, WHITE, 0.11, 0.16);
  sparS(n3, [0, n3[1] + 0.03, n3[2] + 0.14], 0.065, 0.04, 5, WHITE, 0.16, 0.18);         // head
  sparS([0, n3[1] + 0.02, n3[2] + 0.12], [0, n3[1] - 0.04, n3[2] + 0.42], 0.03, 0.004, 4, BILL, 0.18, 0.2);
  sparS([0, n3[1] + 0.07, n3[2] + 0.06], [0, n3[1] + 0.02, n3[2] - 0.26], 0.03, 0.006, 3, BLACK, 0.17, 0.24);
}

// Everything that stands on the river. Instance attributes: aA = (s, theta, yaw, scale; negative scale mirrors
// the model), aB = (speed along m/s, speed round rad/s, phase, seed). Defines: MIRROR draws the upside-down
// reflection, WRAP bends wide things (islets) round the girth instead of placing them rigidly.
const STAND_VERT = /* glsl */ `
attribute vec3 color; attribute vec4 aMat; attribute vec4 aA; attribute vec4 aB;
uniform float uClock, uTime, uPixAng, uFarGrow, uFarShrink;
varying vec3 vN, vCol, vWPos, vUp; varying vec4 vMat; varying float vSun, vSeed, vFade, vLamp;
${RADIAL_GLSL}
uniform vec3 uSunDir;
#include <fog_pars_vertex>
void main() {
  float s = aA.x + aB.x * uClock, th = aA.y + aB.y * uClock, ph = aB.z, sc = abs(aA.w), mir = aA.w < 0.0 ? -1.0 : 1.0;
  vec3 p = position, n = normal; float kind = aMat.x;
  if (kind > 0.5 && kind < 1.5) {                     // sail: fills, spills and flutters at the leech
    float fill = 0.8 + 0.2 * sin(uTime * 0.45 + ph);
    p.x = 0.18 + (p.x - 0.18) * fill + aMat.w * 0.15 * sin(uTime * 3.0 + aMat.z * 7.0 + aMat.y * 5.0 + ph);
  } else if (kind > 1.5 && kind < 2.5) {              // hanging cloth
    p.x += aMat.z * (0.2 * sin(uTime * 1.6 + ph + p.z * 1.3) + 0.14);
    p.z += aMat.z * 0.07 * sin(uTime * 2.2 + ph + aMat.y * 2.0);
  } else if (kind > 3.5) {                            // reeds, plumes, a heron's neck
    p.x += aMat.w * 0.42 * sin(uTime * 1.25 + p.z * 0.6 + p.x * 0.3 + ph);
    p.z += aMat.w * 0.25 * sin(uTime * 0.85 + p.x * 0.5 + ph * 1.7);
  }
  p.x *= mir; n.x *= mir;
#ifdef WRAP
  float cy = cos(aA.z), sy = sin(aA.z);
  float ds = (p.x * sy + p.z * cy) * sc, dc = (-p.x * cy + p.z * sy) * sc;
  vec3 C, T, R, F, S; radialBasis(s + ds, th + dc / uTubeR, aA.z, C, T, R, F, S);
  vec3 O = C + R * uTubeR;
  vec3 local = O + R * p.y * sc;
  vec3 wO = (modelMatrix * vec4(O, 1.0)).xyz;
  local = mix(local, O, uFarShrink * smoothstep(70.0, 150.0, distance(cameraPosition, wO)));     // float-leaves fold away before they are too small to be leaves
  vLamp = 0.0;
#else
  float roll = 0.05 * sin(uTime * 0.9 + ph) + 0.06 * mir, pitch = 0.024 * sin(uTime * 0.7 + ph * 1.7);
  p = vec3(p.x - roll * p.y, p.y + roll * p.x - pitch * p.z, p.z + pitch * p.y);
  n = vec3(n.x - roll * n.y, n.y + roll * n.x - pitch * n.z, n.z + pitch * n.y);
  vec3 C, T, R, F, S; radialBasis(s, th, aA.z, C, T, R, F, S);
  vec3 O = C + R * uTubeR;
  vec3 wO = (modelMatrix * vec4(O, 1.0)).xyz;
  float od = distance(cameraPosition, wO);
  sc *= 1.0 + uFarGrow * clamp((od - 250.0) / 1100.0, 0.0, 1.0);      // far sails stay readable as beads
  vec3 lampC = vec3(0.0, ${LAMP_Y.toFixed(2)}, ${LAMP_Z.toFixed(2)});
  vec3 dl = position - lampC; vLamp = 1.0 / (1.0 + dot(dl, dl) / 9.0);
  if (kind > 4.5) p = lampC + (p - lampC) * max(1.0, od * uPixAng * 5.0);      // a lantern never shrinks below a pixel and a half
  #ifdef MIRROR
  p.y = -0.86 * p.y - 0.25;
  float wob = sqrt(max(-p.y, 0.0));
  p.x += 0.2 * wob * sin(p.y * 1.9 + uTime * 2.3 + ph); p.z += 0.14 * wob * sin(p.y * 2.6 - uTime * 1.9 + ph);
  #endif
  vec3 local = O + (p.x * S + p.y * R + p.z * F) * sc;
#endif
  mat3 m3 = mat3(modelMatrix);
  vec3 wn = m3 * (n.x * S + n.y * R + n.z * F);
  vec4 wp = modelMatrix * vec4(local, 1.0);
  vec3 wR = normalize(m3 * R), wT = normalize(m3 * T);
  if (kind > 2.5 && kind < 3.5) {                     // rigging: widen to ~1.5 px
    float hw = max(aMat.w * sc, distance(cameraPosition, wp.xyz) * uPixAng * 0.8);
    wp.xyz += normalize(wn + vec3(0.0, 1e-5, 0.0)) * hw;
  }
  // can this point see the sun past its own river?
  float hh = max(p.y * sc, 0.0), q = uTubeR / (uTubeR + hh);
  vec3 Sp = uSunDir - wT * dot(uSunDir, wT);
  vSun = smoothstep(-0.06, 0.08, dot(wR, uSunDir) + sqrt(max(1.0 - q * q, 0.0)) * length(Sp) + 0.03);
  vFade = 1.0;
#ifdef MIRROR
  vec3 toCam = cameraPosition - wO; float dC = length(toCam);
  float face = dot(wR, toCam) / max(dC, 1e-3);
  vFade = smoothstep(0.03, 0.16, face) * (1.0 - smoothstep(0.55, 0.95, face) * 0.55) * (1.0 - smoothstep(300.0, 600.0, dC));
#endif
  vN = wn; vCol = color; vMat = aMat; vWPos = wp.xyz; vUp = wR; vSeed = aB.w;
  vec4 mvPosition = viewMatrix * wp;
  gl_Position = projectionMatrix * mvPosition;
#ifdef MIRROR
  if (vFade < 0.004) gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
#endif
  #include <fog_vertex>
}`;

const STAND_FRAG = /* glsl */ `
precision highp float;
uniform vec3 uSail, uSailPatch, uSailStripe; uniform float uStripeAmt;
varying vec3 vN, vCol, vWPos, vUp; varying vec4 vMat; varying float vSun, vSeed, vFade, vLamp;
uniform float uLamp, uUnderLit, uShadeFill; uniform vec3 uLampCol;
${SKY_GLSL}
#include <fog_pars_fragment>
void main() {
  vec3 V = normalize(cameraPosition - vWPos + vec3(0.0, 1e-5, 0.0));
  vec3 n = normalize(vN + vec3(0.0, 1e-5, 0.0));
  vec3 nf = dot(n, V) < 0.0 ? -n : n;
  vec3 up = normalize(vUp + vec3(0.0, 1e-5, 0.0));
  float kind = vMat.x;
  vec3 alb = vCol;
  vec3 amb = skyAmbient(nf) + uAqua * 0.2 * max(dot(nf, -up), 0.0);
  amb += uAqua * 0.3 * uUnderLit * (0.35 + 0.65 * clamp(0.5 - 0.5 * dot(nf, up), 0.0, 1.0));      // at night the river's own glow lights what floats on it
  float ndl = max(dot(nf, uSunDir), 0.0);
  vec3 col;
  float seamW = max(fwidth(vMat.y) * 1.3, 0.007);
  if (kind > 0.5 && kind < 1.5) {
    float a = vMat.y, b = vMat.z;
    float w = seamW;
    float seam = (1.0 - smoothstep(0.0, w, abs(a - 0.2))) + (1.0 - smoothstep(0.0, w, abs(a - 0.42))) + (1.0 - smoothstep(0.0, w, abs(a - 0.66)));
    seam *= clamp(0.014 / w, 0.0, 1.0);
    alb = uSail * vCol * (0.72 + 0.28 * vSeed) * mix(vec3(1.0), vec3(1.0, 0.8, 0.9), fract(vSeed * 5.3));
    float pa = 0.3 + 0.25 * fract(vSeed * 7.31), pb = 0.22 + 0.3 * fract(vSeed * 3.17);
    float patchK = smoothstep(0.0, 0.012, a - pa) * smoothstep(0.0, 0.012, pa + 0.13 - a) * smoothstep(0.0, 0.015, b - pb) * smoothstep(0.0, 0.015, pb + 0.2 - b);
    alb = mix(alb, uSailPatch, patchK * 0.5);
    alb = mix(alb, uSailStripe, uStripeAmt * smoothstep(0.0, 0.02, b - 0.42) * smoothstep(0.0, 0.02, 0.6 - b));
    alb *= 1.0 - 0.4 * seam;
    alb *= 0.9 + 0.1 * smoothstep(0.0, 0.08, b);                    // darker bolt-rope at the yard
    float back = max(dot(-nf, uSunDir), 0.0);
    float belly = 0.78 + 0.34 * sin(3.1416 * clamp(a, 0.0, 1.0)) * (0.55 + 0.45 * clamp(b, 0.0, 1.0));   // the cloth's own curve: a lit belly, darker at luff and leech
    col = alb * belly * (amb * 0.8 + uSunCol * ndl * 0.4 * vSun);
    col += (alb * vec3(1.15, 0.85, 0.7) + vec3(0.04, 0.006, 0.0)) * uSunCol * back * 0.5 * vSun * belly;   // backlit cloth burns
  } else if (kind > 1.5 && kind < 2.5) {
    float back = max(dot(-nf, uSunDir), 0.0);
    col = alb * (amb + uSunCol * (ndl * 0.8 + back * 0.45) * vSun);
  } else if (kind > 2.5 && kind < 3.5) {
    col = alb * (amb * 0.8 + uSunCol * 0.35 * vSun);
  } else {
    col = alb * (amb * 1.12 + uSunCol * (ndl * 0.86 + 0.16 * (0.5 + 0.5 * dot(nf, uSunDir))) * vSun);   // shaded sides are filled, never black
  }
#ifdef WRAP
  col += alb * uMoonAmb * (0.5 + 1.1 * max(dot(nf, up), 0.0));         // an islet under the moon keeps its own colours: reed gold, pale huts, red cloth
  if (kind > 3.5) {       // reeds far off are under a pixel wide and alias to dark speckle: they go to one soft green-gold lit by the islet's own sky
    float dk = smoothstep(45.0, 190.0, distance(cameraPosition, vWPos));
    vec3 far = mix(alb, vec3(0.3, 0.31, 0.085), 0.7) * (skyAmbient(up) * 1.12 + uSunCol * (0.5 * max(dot(up, uSunDir), 0.0) + 0.22) * vSun);
    col = mix(col, far, dk);
  }
  {   // a garden hanging from a belly is lit by the cloud sea beneath it and by the glow of the water it hangs from: never a dark blot
    float hangK = smoothstep(0.1, -0.5, up.y) * (1.0 - 0.65 * vSun);       // (where the low sun itself reaches under the belly it does the lighting, and this fill stands back: pale huts keep their tone)
    col += (alb * 0.9 + vec3(0.06, 0.07, 0.04)) * (uPeach * 0.7 + uAqua * 0.45) * hangK;
  }
#endif
  {   // in a strand's shade a boat is still lit: warm from the cloud sea below, aqua from the water over it, and brighter on the side toward the light
    vec3 sh = uPeach * (0.2 + 0.8 * max(-nf.y, 0.0)) * 0.6 + uAqua * (0.15 + 0.85 * max(nf.y, 0.0)) * 0.55;
    float side = 0.3 + 0.7 * smoothstep(-0.5, 0.9, dot(nf, normalize(vec3(uSunDir.x, 0.2, uSunDir.z) + vec3(0.0, 1e-4, 0.0))));
    col += alb * sh * side * (1.0 - vSun) * uShadeFill;
  }
  col += uMoonAmb * (0.012 + 0.06 * smoothstep(-0.2, 0.8, dot(nf, uSunDir)));   // moonlight on tarred hulls and dark cloth
  col += alb * uLampCol * (vLamp * uLamp * 2.2);                                 // lantern light on the stern, the deck and the foot of the sail
  if (kind > 4.5) col = mix(col, uLampCol * 5.0, uLamp);
  float alpha = 1.0;
#ifdef MIRROR
  col = mix(col, uTeal * 0.5, 0.15);
  alpha = 0.42 * vFade;
#endif
  gl_FragColor = vec4(col, alpha);
  #include <fog_fragment>
}`;

// V wakes wrapped onto the tube behind every boat
const WAKE_VERT = /* glsl */ `
attribute vec4 aA; attribute vec4 aB;
uniform float uClock, uTime;
varying vec2 vUv; varying vec3 vWPos, vUp; varying float vSeed, vSpeed, vLen;
${RADIAL_GLSL}
#include <fog_pars_vertex>
void main() {
  float s = aA.x + aB.x * uClock, th = aA.y + aB.y * uClock, sc = abs(aA.w);
  float speed = length(vec2(aB.x, aB.y * uTubeR));
  float len = (20.0 + 7.0 * speed) * sc;
  float d = position.z * len;
  float lx = position.x * (1.3 * sc + 0.33 * d), lz = 5.2 * sc - d;
  float cy = cos(aA.z), sy = sin(aA.z);
  float ds = lx * sy + lz * cy, dc = -lx * cy + lz * sy;
  vec3 C, T, N; knotFrame(s + ds, C, T, N);
  float t2 = th + dc / uTubeR;
  vec3 R = cos(t2) * N + sin(t2) * cross(T, N);
  vec4 wp = modelMatrix * vec4(C + R * (uTubeR + 0.22), 1.0);
  vUv = vec2(position.x, position.z); vWPos = wp.xyz; vUp = normalize(mat3(modelMatrix) * R); vSeed = aB.z; vSpeed = speed; vLen = len;
  vec4 mvPosition = viewMatrix * wp;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const WAKE_FRAG = /* glsl */ `
precision highp float;
uniform sampler2D uNoise; uniform float uTime, uLamp; uniform vec3 uLampCol;
varying vec2 vUv; varying vec3 vWPos, vUp; varying float vSeed, vSpeed, vLen;
${SKY_GLSL}
#include <fog_pars_fragment>
void main() {
  float a = abs(vUv.x), v = vUv.y;
  vec4 nz = texture2D(uNoise, vec2(vUv.x * 0.9 + vSeed, v * 3.0 - uTime * 0.11 + vSeed * 3.0));
  vec4 nz2 = texture2D(uNoise, vec2(vUv.x * 2.7 - vSeed, v * 9.0 - uTime * 0.23));
  float arm = smoothstep(0.5, 0.8, a) * (1.0 - smoothstep(0.84, 1.0, a));
  arm *= (0.5 + 0.9 * nz.b) * (1.0 - v) * (1.0 - 0.6 * v);
  float trail = (1.0 - smoothstep(0.05, 0.42, a)) * (1.0 - smoothstep(0.0, 0.55, v)) * smoothstep(0.25, 0.7, nz2.b + nz.a * 0.4);
  float rings = arm * (0.6 + 0.4 * sin(a * 21.0 - v * 34.0));
  float f = clamp(rings * 0.95 + trail * 0.8, 0.0, 1.0) * smoothstep(0.0, 0.05, v) * clamp(vSpeed * 0.4, 0.3, 1.0);
  float sunSide = 0.5 + 0.5 * dot(normalize(vUp), uSunDir);
  vec3 col = uCream * (0.42 + 0.5 * sunSide) + uAqua * 0.12;
  // night: the stern lantern lays a pool of warm light on the water (11.5 m down the strip from its head)
  float dz = v * vLen - 11.5, dx = vUv.x * (1.3 + 0.33 * v * vLen);
  float pool = uLamp * exp(-(dz * dz * 0.9 + dx * dx) / 11.0) * (1.0 - a * a);         // steady: a lantern, not a flame
  float fa = f * 0.85, al = max(fa, pool * 0.55);
  col = mix(col, uLampCol * 1.6, pool * 0.55 / max(al, 1e-3));
  gl_FragColor = vec4(col, al);
  #include <fog_fragment>
}`;

// Beads of water and mist streamers arcing from one river to the other (premultiplied: beads add, mist blends)
const SPRAY_VERT = /* glsl */ `
attribute vec3 aP0; attribute vec3 aP1; attribute vec4 aS;     // aS = (size m, kind 0 bead / 1 mist, phase, rate)
uniform float uTime, uPixAng;
varying vec2 vUv; varying vec4 vS; varying float vLife, vDim, vFogK, vSunK;
uniform vec3 uSunDir;
#include <fog_pars_vertex>
void main() {
  float p = fract(aS.z + uTime * aS.w);
  vec3 d = aP1 - aP0;
  vec3 side = normalize(cross(d, vec3(0.3, 1.0, 0.2)) + vec3(1e-4, 0.0, 0.0));
  float sw = fract(aS.w * 7919.0) - 0.5;          // the bow of the arc is the chain's, so its beads follow one another
  vec3 pos = mix(aP0, aP1, p) + side * sin(3.14159 * p) * sw * 0.45 * length(d);
  pos += vec3(sin(uTime * 0.31 + aS.z * 40.0), sin(uTime * 0.27 + aS.z * 23.0), cos(uTime * 0.23 + aS.z * 31.0)) * (0.4 + aS.y * 2.6);
  vec4 wc = modelMatrix * vec4(pos, 1.0);
  float dist = distance(cameraPosition, wc.xyz);
  float size = aS.x, minS = dist * uPixAng * 1.3;
  vDim = aS.y > 0.5 ? 1.0 - smoothstep(0.0, 1.0, (26.0 - dist) / 16.0) : min(1.0, (size * size) / max(minS * minS, 1e-6));
  size = max(size, aS.y > 0.5 ? size : minS);
  vec4 mvPosition = viewMatrix * wc;
  mvPosition.xy += position.xy * size;
  gl_Position = projectionMatrix * mvPosition;
  vUv = position.xy; vS = aS;
  vLife = smoothstep(0.0, 0.1, p) * (1.0 - smoothstep(0.88, 1.0, p));
  vSunK = max(dot(normalize(wc.xyz - cameraPosition + vec3(0.0, 1e-4, 0.0)), uSunDir), 0.0);
  #include <fog_vertex>
}`;
const SPRAY_FRAG = /* glsl */ `
precision highp float;
uniform sampler2D uNoise; uniform float uTime;
uniform vec3 uSunCol, uPeach, uCream, uLilac, uAqua;
varying vec2 vUv; varying vec4 vS; varying float vLife, vDim, vSunK;
#include <fog_pars_fragment>
void main() {
  float r2 = dot(vUv, vUv);
  vec2 q = vUv * 0.5 + 0.5;
  float n1 = texture2D(uNoise, q * 0.42 + vec2(vS.z * 5.0, uTime * 0.008 + vS.z)).b;
  float n2 = texture2D(uNoise, q * 0.9 - vec2(uTime * 0.012, vS.z * 3.0)).a;
  if (r2 > 1.0) discard;
  vec3 col; float alpha;
  if (vS.y < 0.5) {
    float core = exp(-r2 * 5.5), spark = exp(-r2 * 40.0);
    float tw = 0.75 + 0.25 * sin(uTime * 1.3 + vS.z * 60.0);
    col = (mix(uAqua, uCream, 0.35 + 0.4 * fract(vS.z * 9.7)) * core * 1.1 + uCream * uSunCol * spark * (0.9 + 2.2 * vSunK)) * tw * vLife * vDim;
    alpha = 0.0;
  } else {
    float soft = (1.0 - r2); soft *= soft;
    alpha = soft * smoothstep(0.42, 0.85, n1 * 0.65 + n2 * 0.5) * 0.085 * vLife * vDim;
    vec3 c = mix(uLilac * 0.75, mix(uPeach, uCream, 0.55), 0.55 + 0.45 * n1) * 0.9 + uCream * uSunCol * vSunK * vSunK * 0.22;
    col = c * alpha;
  }
  float keep = 1.0;
#ifdef USE_FOG
  #ifdef FOG_EXP2
  keep = exp(-fogDensity * fogDensity * vFogDepth * vFogDepth);
  #else
  keep = 1.0 - smoothstep(fogNear, fogFar, vFogDepth);
  #endif
#endif
  gl_FragColor = vec4(col * keep, alpha * keep);
}`;

// ---------------------------------------------------------------------------------------------------
// the hero
// ---------------------------------------------------------------------------------------------------
const BRIEF_PALETTE = ['#F6C9A8', '#FBEEDC', '#2E8C8A', '#0F4C5C', '#7FD6C8', '#D9482B', '#6B7FB8'];
// The route. Arrive 8 m over the crown of our strand at t 3.455; climb steeply off it and swing west until the whole knot
// stands ahead; dive steeply north to below the level of the bar's belly while the bar is still 100 m off, and go in under
// it (the strand that closes the eye of the knot); fly east beneath it, rise beside our own strand through the eye, swing
// round under the top crossing and come down onto the bar itself; skim it westward, under the western strand where the
// river crosses itself (the Crossing), and on along the bottom of the west loop through three hoops of water to the Eyelet.
const WAYPOINTS = [[293.6, -37.8, 152.2], [316.9, -41.5, 183.5], [338, -43, 216], [355, -46, 252], [368, -49, 296], [377, -40, 330], [374, -8, 358], [356, 42, 376], [328, 88, 388], [302, 122, 396], [281, 135, 410],
  [268, 116, 438], [258, 72, 468], [249, 30, 506], [242, 6, 552], [243, 1, 602], [258, 3, 642], [292, 6, 652], [340, 20, 650], [372, 38, 654], [398, 54, 670], [440, 66, 712], [444, 74, 768], [400, 86, 812],
  [318, 98, 846], [276, 120, 894], [254, 146, 944], [220, 168, 972], [184, 186, 958], [162, 192, 908], [158, 191, 840], [160, 187, 778], [148, 180, 716], [112, 172, 680], [60, 160, 663], [-30, 114, 663], [-90, 105, 668], [-150.7, 87, 679.1], [-229.9, 69.5, 690.7],
  [-275, 62, 706], [-325, 60, 740], [-375, 60, 782], [-425, 56, 812], [-478, 48, 826], [-530, 42, 832], [-575, 40, 846], [-611.5, 45.2, 870.1], [-654.4, 53.4, 904], [-689.2, 62.9, 934.4], [-707, 70, 951]];

export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng.fork ? ctx.rng.fork('knotted-river-hero') : ctx.rng;
  const P = (opts.palette && opts.palette.length >= 7 ? opts.palette : BRIEF_PALETTE).slice();
  const pal = { peach: P[0], cream: P[1], teal: P[2], deep: P[3], aqua: P[4], red: P[5], lilac: P[6] };
  const detail = Math.max(0.6, Math.min(1, opts.detail ?? ctx.quality?.detail ?? 1)), density = Math.max(0.7, Math.min(1.15, opts.density ?? 1));
  const duration = opts.duration ?? 42;
  const V3 = THREE.Vector3, col = (h) => new THREE.Color(h);
  const object = new THREE.Group(); object.name = 'knotted-river-hero';

  const K = await makeKnot(ctx.yield ? () => ctx.yield() : null);
  const L = K.L;
  await ctx.yield?.();
  const noiseTex = await makeNoiseTex(rng, ctx.renderer, ctx.yield ? () => ctx.yield() : null);
  await ctx.yield?.();

  // per-seed character: water and livery
  const water = rng(); const teal = col(pal.teal), aqua = col(pal.aqua);
  if (water > 0.8) { teal.lerp(col('#2F9A78'), 0.4); aqua.lerp(col('#8FE0B0'), 0.35); }            // jade
  else if (water > 0.62) { teal.lerp(col('#4189A6'), 0.34); aqua.lerp(col('#9FD6E0'), 0.3); }      // milky silt-blue
  const cast = 'red';      // one sail colour, the brief's red
  const sailCol = cast === 'saffron' ? col('#E29A2C') : cast === 'indigo' ? col(pal.cream).multiplyScalar(0.8) : col(pal.red);
  const sailPatch = sailCol.clone().lerp(col(pal.cream), cast === 'indigo' ? 0.5 : 0.42).multiplyScalar(cast === 'indigo' ? 0.8 : 0.9);
  const sunDir = new V3().fromArray(opts.sunDir || [0.973, 0.156, 0.171]).normalize();
  const sunCol = col(opts.sunColor || '#ffe2b8').multiplyScalar(opts.sunIntensity ?? 2.4);

  const U = {
    uFrames: { value: K.tex }, uLen: { value: L }, uTubeR: { value: TUBE_R }, uClock: { value: 0 }, uTime: { value: 0 }, uPixAng: { value: 0.0015 },
    uSunDir: { value: sunDir }, uSunCol: { value: sunCol }, uNoise: { value: noiseTex },
    uPeach: { value: col(pal.peach) }, uCream: { value: col(pal.cream) }, uLilac: { value: col(pal.lilac) },
    uTeal: { value: teal }, uDeep: { value: col(pal.deep) }, uAqua: { value: aqua },
    uGlowK: { value: opts.glow ?? 1 }, uGlowFar: { value: opts.glowFar ?? 1 }, uLimbP: { value: Math.max(0, Math.min(1, opts.limbTight ?? 0.35)) },
    // air: far strands pale toward the horizon's colour (density per metre, ceiling); uFill = sky and cloud-sea fill inside the glass
    uHaze: { value: col(opts.haze || pal.peach).multiplyScalar(opts.haze ? 1 : 0.74).lerp(aqua, opts.haze ? 0 : 0.6).lerp(col(pal.lilac), opts.haze ? 0 : 0.22) }, uHazeK: { value: new THREE.Vector2(opts.hazeDensity ?? 0.00018, opts.hazeMax ?? 0.75) },
    uLamp: { value: opts.lamp ?? 0 }, uLampCol: { value: col(opts.lampColor || '#ffb45e') }, uUnderLit: { value: opts.underLit ?? 0 }, uShadeFill: { value: opts.shadeFill ?? 1 },
    uFarCore: { value: opts.farCore ? col(opts.farCore) : col(pal.deep).multiply(new THREE.Color(0.7, 1.25, 1.3)).multiplyScalar(0.42).add(teal.clone().multiplyScalar(0.092)) }, uCaust: { value: new V3(...(opts.caust || [0.5, 0.5, 0])) },
    uFill: { value: opts.fill ?? 1 }, uGlitter: { value: opts.glitter ?? 1 }, uGlitW: { value: opts.glitterWide ?? 0 }, uLimbPale: { value: opts.limbPale ?? 0 }, uNetK: { value: opts.netContrast ?? 0 }, uRefl: { value: new THREE.Vector2(...(opts.refl || [1, 0])) }, uMoonAmb: { value: col(opts.moonAmb || '#000000') },
  };
  const bodyK = opts.body ?? 1;
  const fogU = () => THREE.UniformsUtils.clone(THREE.UniformsLib.fog);

  // ---- the tube ----
  const sA0 = K.sOfT(0.05), sA1 = K.sOfT(0.5), sB0 = K.sOfT(3.35), sB1 = K.sOfT(4.25);
  const tubeGeo = await buildTube(K, [
    { s0: sA0, s1: sA1, step: 5, radial: 48, snap: true }, { s0: sA1, s1: sB0, step: 9.5, radial: 24 },
    { s0: sB0, s1: sB1, step: 5, radial: 48, snap: true }, { s0: sB1, s1: sA0 + L, step: 9.5, radial: 24 }], ctx.yield ? () => ctx.yield() : null);
  await ctx.yield?.();
  const ks = [Math.round(L / 30), Math.round(L / 12.5), Math.round(L / 5.2), Math.round(L / 460)], ksE = 2 * Math.round(L / 840);
  const flowLayers = [[5 / 30, 0], [6.2 / 12.5, 0.012], [3.8 / 5.2, -0.02], [5 / 460, 0.002], [1.2 / 420, 0.004]];
  const waterUniforms = (o) => ({
    ...fogU(), ...U,
    uSc: { value: new THREE.Vector4(...o.sc) }, uTc: { value: new THREE.Vector4(...o.tc) }, uShoal: { value: new THREE.Vector2(...o.shoal) },
    uOffA: { value: new THREE.Vector2() }, uOffB: { value: new THREE.Vector2() }, uOffC: { value: new THREE.Vector2() }, uOffD: { value: new THREE.Vector2() }, uOffE: { value: new THREE.Vector2() },
    uFresK: { value: o.fres ?? 1 }, uBodyGain: { value: (o.body ?? 1) * bodyK }, uFarLines: { value: o.farLines ?? 8 }, uStreak: { value: new THREE.Vector2((o.streak ? o.streak[0] : 1) * (opts.streak ?? 1), o.streak ? o.streak[1] : 1) },
    uRipple: { value: o.ripple }, uGlow: { value: o.glow }, uDepthM: { value: o.depth }, uCirc: { value: o.circ }, uShoalFar: { value: o.shoalFar },
    uCaustK: { value: o.caust ?? 1 }, uNet: { value: new THREE.Vector4(...(o.net || [2, 1, 1, 2]).map((k) => k / o.len)) }, uBulge: { value: o.bulge }, uBulgeK: { value: new THREE.Vector3(...o.bulgeK) },
  });
  const waterMat = new THREE.ShaderMaterial({
    vertexShader: WATER_VERT, fragmentShader: WATER_FRAG, fog: true,
    uniforms: waterUniforms({ len: L, net: [Math.round(L / 520), Math.round(L / 430), Math.round(L / 370), Math.round(L / 610)], sc: ks.map((k) => k / L), tc: [12, 29, 70, 11], farLines: 12, shoal: [ksE / L, 3], ripple: rng.range(0.5, 0.68), glow: rng.range(0.92, 1.12), depth: 16, circ: TAU * TUBE_R, shoalFar: 800,
      bulge: 0.2, bulgeK: [(Math.round(L / 46) * TAU) / L, 0.7, (Math.round(L / 19) * TAU) / L] }),
  });
  const tube = new THREE.Mesh(tubeGeo, waterMat); tube.frustumCulled = false; tube.renderOrder = 1; tube.name = 'river'; object.add(tube);
  await ctx.yield?.();

  // ---- the camera line (the same curve the world's makePath builds), for seating boats and keeping the corridor clear ----
  const wp = WAYPOINTS.map((p) => new V3(...p));
  const camCurve = new THREE.CatmullRomCurve3(wp, false, 'centripetal', 0.5); camCurve.arcLengthDivisions = Math.max(400, wp.length * 60);
  const camAt = (u, out = new V3()) => camCurve.getPointAt(Math.max(0, Math.min(1, u)), out);
  const nearestS = (p, ta, tb, step = 2) => { let best = 1e9, bs = 0; const f = {}; for (let s = K.sOfT(ta), e = K.sOfT(tb); s <= e; s += step) { const d = K.frameAt(s, f).C.distanceToSquared(p); if (d < best) { best = d; bs = s; } } return bs; };
  // the Crossing the route passes beside on its way into the west loop: the low lobe's western strand goes over the eye's bottom strand
  const crossP = new V3(-436, 60, 720), sUp = nearestS(crossP, 2.2, 2.55), sLow = nearestS(crossP, 5.85, 6.2);
  const upC = K.frameAt(sUp).C.clone(), lowC = K.frameAt(sLow).C.clone(), crossMid = upC.clone().add(lowC).multiplyScalar(0.5);
  await ctx.yield?.();
  // where the route goes under the western strand, and where it passes over the west loop's bottom strand
  // where the route passes closest beneath a strand (centreline between knot parameters ta and tb), looked for every 10 m of route: the place on the route and on the strand
  const passUnder = async (ta, tb) => { let best = 1e18, bu = 0, bs = 0; const q = new V3(), f = {}; const n = Math.ceil(camCurve.getLength() / 10); for (let i = 0; i <= n; i++) { if (i % 50 === 49) await ctx.yield?.(); camAt(i / n, q); const sN = nearestS(q, ta, tb, 6), c = K.frameAt(sN, f).C; if (c.y > q.y + TUBE_R * 0.5) { const d = c.distanceToSquared(q); if (d < best) { best = d; bu = i / n; bs = sN; } } } return { u: bu, s: nearestS(camAt(bu), ta, tb, 1) || bs }; };
  const underBar = await passUnder(0.0, 0.3), U_UNDER = underBar.u, sUnder = underBar.s;
  await ctx.yield?.();
  const U_BRIDGE = (await passUnder(2.2, 2.55)).u;
  const sArm = nearestS(wp[wp.length - 1], 5.6, 6.1), sEntry = nearestS(wp[0], 3.3, 3.7);
  const wrapPi = (a) => a - TAU * Math.round(a / TAU);
  const thDown = (s) => K.crownTheta(s) + Math.PI;
  await ctx.yield?.();

  const _c = new V3();
  // ---- the fleet: one rule of the river for every boat ----
  // 200 lateen boats (x opts.density), all one size, 12 m. A boat is a COURSE: a start anywhere on the river (metres along, angle
  // round) and a steady 4 m/s along the river, round its girth or spiralling, held for the whole flight. Courses are drawn at
  // random over the whole river and kept by rules that are places, never moments:
  //   lanes    a boat that sails along the river is a place in one of twenty-four lanes fixed on its girth (one speed and one
  //            phase to a lane, places evenly spaced along the strand); three in ten sail round the girth or spiral instead;
  //   company  the 200 are shared out by how far the water of a course lies from the route's line (the river's traffic keeps
  //            to the reaches we travel: the crowns we skim and on up and down the river from them, the flanks we climb
  //            beside, the bellies we pass beneath);
  //   the lane no course comes within LANE metres (hull to masthead) of the route's line, anywhere along it: one margin in
  //            space round the whole line, whether a boat sails beside it, beneath it or hangs over it;
  //   room     courses keep clear of the reed islets' berths, of the shed hoops and of one another.
  // Nothing here knows where the lens is at any time: boats sail on the journey's clock only so that a visit replays the same.
  const camLen = camCurve.getLength(), LANE = 10, _pl = {}, _tip = new V3();          // LANE: the design's nearest pass ('boats pass 10-25 m either side'; its 'no boat mast within 8 m' lies inside it)
  const routePts = camCurve.getSpacedPoints(Math.ceil(camLen / 3)), CELL = 16, routeHash = new Map();
  await ctx.yield?.();
  const hkey = (x, y, z) => (Math.floor(x / CELL) + 512) * 1048576 + (Math.floor(y / CELL) + 512) * 1024 + Math.floor(z / CELL) + 512;
  for (const p of routePts) { const k = hkey(p.x, p.y, p.z); let a = routeHash.get(k); if (!a) routeHash.set(k, (a = [])); a.push(p); }
  // metres from p to the route's line when it is under 16 m, else 99
  const lineDist = (p) => {
    let m = 9801;
    for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) for (let dz = -1; dz <= 1; dz++) {
      const a = routeHash.get(hkey(p.x + dx * CELL, p.y + dy * CELL, p.z + dz * CELL)); if (a) for (const q of a) m = Math.min(m, q.distanceToSquared(p));
    }
    return Math.sqrt(m);
  };
  const routeCoarse = routePts.filter((_, i) => i % 8 === 0);
  const routeDist = (p) => { let m = 1e18; for (const q of routeCoarse) m = Math.min(m, q.distanceToSquared(p)); return Math.sqrt(m); };
  // how far each patch of the river's surface lies from the route's line: a table over 12 m along x 24 sectors round
  const FS = Math.ceil(L / 12), FT = 24, field = new Float32Array(FS * FT), belly = new Uint8Array(FS * FT);
  for (let i = 0; i < FS; i++) {
    for (let j = 0; j < FT; j++) { const pl = K.place(((i + 0.5) * L) / FS, ((j + 0.5) / FT) * TAU, 0, _pl); field[i * FT + j] = routeDist(pl.position); belly[i * FT + j] = pl.up.y < -0.3 ? 1 : 0; }
    if ((i & 3) === 3) await ctx.yield?.();
  }
  const fieldAt = (s, th) => field[(Math.floor(((((s % L) + L) % L) / L) * FS) % FS) * FT + (Math.floor(((((th % TAU) + TAU) % TAU) / TAU) * FT) % FT)];
  // the shed hoops stand in the river on the way out (built below): centre, axis, radius, half thickness. Each stands on the
  // strand it was shed from, the west loop's bottom strand that runs to the Eyelet: its centre on the strand's own crown
  // radial, half its radius above the water (so a ring stands in the river sunk to a quarter of its height), its axis the
  // strand's own tangent there. The train's spacing is the hoops' own sizes: each centre lies one sum of the two radii up
  // the strand from the one before, counted from the Eyelet; the first place is seeded (between 0.6 and 1 of that sum)
  const hrng = ctx.core?.makeRng && ctx.core?.hashSeed ? ctx.core.makeRng(ctx.core.hashSeed('knotted-river-hoops:' + ctx.seed)) : rng.fork ? rng.fork('hoops') : rng;
  const HOOP_R = 9.6, HOOP_r = 1.1;       // the Eyelet of the brief: 17 m across inside, 2.2 m thick, round the 14 m portal
  const hoopSpec = []; { let sH = sArm, prevR = HOOP_R, first = hrng.range(0.6, 1);
    for (const [R, r] of [[19, 2.5], [29, 3.4], [60, 6.5]]) { sH += (prevR + R) * first; first = 1; prevR = R; hoopSpec.push({ c: K.place(sH, K.crownTheta(sH), 0.5 * R).position.clone(), n: K.frameAt(sH, {}).T.clone(), R, r, s: sH }); } }
  hoopSpec.push({ c: wp[wp.length - 1].clone(), n: camCurve.getTangentAt(1).normalize(), R: HOOP_R, r: HOOP_r });
  const hoopGap = (p) => { let m = 1e9; for (const h of hoopSpec) { _c.subVectors(p, h.c); const ax = _c.dot(h.n), rad = Math.sqrt(Math.max(0, _c.lengthSq() - ax * ax)) - h.R; m = Math.min(m, Math.hypot(ax, rad) - h.r); } return m; };
  await ctx.yield?.();
  // berths of the reed islets on our stretch: drawn anywhere on the river, kept where the water lies 30 to 125 m from the
  // route's line (so some float on the crowns we skim and some hang as gardens from the bellies we pass beneath), 75 m apart.
  // The hero's own islet, the one with herons standing on the ceiling, is berthed on the bar's belly where the route goes under it.
  const frng = rng.fork ? rng.fork('fleet') : rng;          // the fleet and the berths are dealt from a stream of their own
  const isS = sUnder - 150, isletAt = { s: isS, th: thDown(isS) + 0.1 }, berths = [], berthP = [K.place(isletAt.s, isletAt.th, 0).position.clone()];
  await ctx.yield?.();
  const mk = (s, th, vs, vth) => ({ s, th, vs, vth, scale: 1, yaw: Math.atan2(vth * TUBE_R, vs), phase: frng() * TAU, seed: frng(), mir: frng.sign() });
  // how the 200 are shared out by the distance of a course from the route's line: the fairway beside the lane (under 56 m,
  // or the belly overhead), the water beside it (to 110 m), the same strands further round (to 320 m), and the far loops, beaded with sails
  const NC = 24, heroes = [], far = [], tracks = [], occupied = [], nBoats = Math.round(200 * density);
  const quota = [0.58, 0.07, 0.06 * detail, 0.14 * detail, 0.15].map((q) => Math.round(q * nBoats)), got = [0, 0, 0, 0, 0];      // (the fifth share: the river up and down from a skim, the belly up and down from where we pass beneath)
  // (a reach we skim goes on being sailed for 200 m beyond each end of the skim: the river ahead of us and behind us carries the same traffic)
  const reach = new Uint8Array(FS * FT), RX = Math.round(200 / (L / FS));
  for (let i = 0; i < FS; i++) for (let j = 0; j < FT; j++) if (field[i * FT + j] < 40 && !belly[i * FT + j]) for (let k = -RX; k <= RX; k++) reach[(((i + k) % FS + FS) % FS) * FT + j] = 1;
  // (and a belly we pass beneath carries its hanging fleet for 260 m up and down the strand from there)
  const hung = new Uint8Array(FS * FT), HX = Math.round(260 / (L / FS));
  for (let i = 0; i < FS; i++) for (let j = 0; j < FT; j++) if (field[i * FT + j] < 64 && belly[i * FT + j]) for (let k = -HX; k <= HX; k++) { const m = (((i + k) % FS + FS) % FS) * FT + j; if (belly[m]) hung[m] = 1; }
  await ctx.yield?.();
  // the lane, and room for hoops and berths, over a whole course; null, or its track (and b.upMin, the least its own up leans from world up)
  const tryCourse = (b, near) => {
    const tr = []; let upMin = 1;
    for (let i = 0; i <= NC; i++) {
      const c = (i / NC) * duration, pl = K.place(b.s + b.vs * c, b.th + b.vth * c, 0, _pl), q = pl.position.clone(); tr.push(q); upMin = Math.min(upMin, pl.up.y);
      if (near) for (const h of [0, 5, 10, 14.5]) if (lineDist(_tip.copy(q).addScaledVector(pl.up, h)) < LANE) return null;
      if (hoopGap(q) < 5.5 || hoopGap(_tip.copy(q).addScaledVector(pl.up, 13)) < 3.5) return null;
      for (const bp of berthP) if (bp.distanceToSquared(q) < 27 * 27) return null;
    }
    b.upMin = upMin; return tr;
  };
  const roomFor = (tr, gap) => { for (let k = 0; k < tracks.length; k++) for (let i = 0; i <= NC; i++) if (tracks[k][i].distanceToSquared(tr[i]) < gap * gap) return false; return true; };
  // company: which share a course belongs to. The fairway: the water it sails lies, on average over the whole course, within
  // 56 m of the line, or within 75 m where it is a belly overhead (there the boats hang toward us)
  const classify = (b) => {
    let d = 1e9, dAvg = 0; for (let i = 0; i <= NC; i += 2) { const c = (i / NC) * duration, f = fieldAt(b.s + b.vs * c, b.th + b.vth * c); d = Math.min(d, f); dAvg += f / (NC / 2 + 1); }      // nearest and mean distance of the course from the line
    const sM = b.s + b.vs * duration * 0.5, thM = b.th + b.vth * duration * 0.5;
    const midCell = (Math.floor(((((sM % L) + L) % L) / L) * FS) % FS) * FT + (Math.floor(((((thM % TAU) + TAU) % TAU) / TAU) * FT) % FT);
    const upMid = K.place(sM, thM, 0, _pl).up.y, onBelly = dAvg < 75 && upMid < -0.25;
    const onReach = (b.vth === 0 && reach[midCell] === 1) || (hung[midCell] === 1 && upMid < -0.25);
    b.d = dAvg; b.dMin = d; b.cls = dAvg < 56 || onBelly ? 0 : onReach ? 4 : dAvg < 110 ? 1 : d < 320 ? 2 : 3;
    return b.cls;
  };
  // full detail (planked hull, rigging, deck clutter, laundry) for every course that comes within REACH of the route's line,
  // the fairway's own width: on a 1080-line picture a 5 cm stay is a pixel wide at 45 m and a sail seam (18 cm) three pixels
  // at 56 m; further off rigging cannot be told and the 160-triangle boat shows the same outline, sail and seams. Only a boat
  // that stays upright on a crown within that reach is given a mirror image
  const REACH = 56;
  const take = (b, tr) => { b.hang = !(b.vth === 0 && b.upMin > 0.35 && b.dMin < REACH); got[b.cls]++; tracks.push(tr); (b.dMin < REACH ? heroes : far).push(b); };
  // boats that sail round the girth or spiral along the river: three in ten of each share. A course is drawn anywhere on the
  // river, at any angle round it, and sails from there on the journey's clock; it is kept if its share has room
  const capR = quota.map((q) => Math.round(q * 0.3)), gotR = [0, 0, 0, 0, 0];
  for (let tries = 0, work = 0; tries < 9000 && gotR.some((g, i) => g < capR[i]); tries++) {
    if (work > 30) { await ctx.yield?.(); work = 0; }
    work++;
    const kind = frng(), dir = frng.sign(), v = frng.range(3.6, 4.4), s0 = frng() * L, th0 = frng() * TAU;
    const a = kind < 0.6 ? Math.PI / 2 + frng.range(-0.1, 0.1) : frng.sign() * frng.range(0.5, 1.1);      // round the girth, or spiralling
    const b = { s: s0, th: th0, vs: dir * v * Math.cos(a), vth: (dir * v * Math.sin(a)) / TUBE_R }, cls = classify(b);
    if (gotR[cls] >= capR[cls]) continue;
    work += 8;
    const tr = tryCourse(b, b.dMin < 60); if (!tr || !roomFor(tr, cls < 2 || cls === 4 ? 15 : 50)) continue;
    const bb = Object.assign(mk(b.s, b.th, b.vs, b.vth), { d: b.d, dMin: b.dMin, cls, upMin: b.upMin }); gotR[cls]++; take(bb, tr);
  }
  await ctx.yield?.();
  // boats that sail along the river keep to lanes fixed on its girth: twenty-four, 15.7 m apart, neighbours sailing opposite
  // ways. A lane has one speed and one phase, both drawn from the fleet's stream; its places lie evenly along the strand,
  // SP metres apart (a 12 m boat and the 42 m of wake it trails), and every boat that sails along the river is one of those
  // places, sailing at its lane's speed on the journey's clock. Which places are taken is the fleet's company rule: each
  // place draws a number, and each share (by the distance of the place's whole course from the route's line) is filled from
  // its lowest numbers. The route's line only excludes: a place whose course comes inside the lane's margins anywhere along
  // the line stays empty. Nothing is seated beside a point of the route.
  const LANES = 24, NK = Math.round(L / 54), SP = L / NK, laneV = [], lanePh = [];
  for (let j = 0; j < LANES; j++) { laneV.push((j & 1 ? 1 : -1) * frng.range(3.6, 4.4)); lanePh.push(frng() * SP); }
  const places = [[], [], [], [], []];
  for (let j = 0; j < LANES; j++) {
    for (let k = 0; k < NK; k++) { const b = { s: lanePh[j] + k * SP, th: ((j + 0.5 + frng.range(-0.1, 0.1)) / LANES) * TAU, vs: laneV[j], vth: 0, no: frng() }; places[classify(b)].push(b); }
    if ((j & 3) === 3) await ctx.yield?.();
  }
  // shares are filled nearest first; what a share cannot hold (the fairway is short of free places) is sailed in the next one out
  let carry = 0;
  for (const cls of [0, 4, 1, 2, 3]) {
    const list = places[cls].sort((p, q) => p.no - q.no), want = quota[cls] - got[cls] + carry; let n = 0, work = 0;
    for (const b of list) {
      if (n >= want) break;
      if (++work > 6) { await ctx.yield?.(); work = 0; }
      const tr = tryCourse(b, b.dMin < 60); if (!tr || !roomFor(tr, cls < 2 || cls === 4 ? 11 : 50)) continue;
      take(Object.assign(mk(b.s, b.th, b.vs, 0), { d: b.d, dMin: b.dMin, cls, upMin: b.upMin }), tr); n++;
    }
    carry = want - n;
  }
  await ctx.yield?.();
  // the berths are drawn once the fleet is dealt, so the islets of our stretch lie outside its courses
  for (let tries = 0, want = Math.round(12 * density); berths.length < want && tries < 6000; tries++) {
    if ((tries & 63) === 63) await ctx.yield?.();
    const s = frng() * L, th = frng() * TAU, d0 = fieldAt(s, th); if (d0 < 22 || d0 > 135) continue;
    const pl = K.place(s, th, 0, _pl), p = pl.position, d = routeDist(p); if (d < 30 || d > 125) continue;
    if (lineDist(_tip.copy(p).addScaledVector(pl.up, 8)) < 16 || hoopGap(p) < 22 || berthP.some((q) => q.distanceToSquared(p) < 75 * 75)) continue;
    if (tracks.some((tr) => tr.some((q) => q.distanceToSquared(p) < 27 * 27))) continue;          // outside every course
    berths.push({ s, th, d, upY: pl.up.y }); berthP.push(p.clone());
  }
  await ctx.yield?.();

  // ---- boat meshes ----
  const instanced = (geo, list) => {
    const g = new THREE.InstancedBufferGeometry(); if (geo.index) g.setIndex(geo.index);
    for (const k in geo.attributes) g.setAttribute(k, geo.attributes[k]);
    const a = new Float32Array(list.length * 4), b = new Float32Array(list.length * 4);
    list.forEach((o, i) => { a.set([o.s, o.th, o.yaw, o.scale * o.mir], i * 4); b.set([o.vs, o.vth, o.phase, o.seed], i * 4); });
    g.setAttribute('aA', new THREE.InstancedBufferAttribute(a, 4)); g.setAttribute('aB', new THREE.InstancedBufferAttribute(b, 4));
    g.instanceCount = list.length; return g;
  };
  const standUniforms = () => ({ ...fogU(), ...U, uFarGrow: { value: 0.6 }, uFarShrink: { value: 0 }, uSail: { value: sailCol }, uSailPatch: { value: sailPatch },
    uSailStripe: { value: col('#2B3672') }, uStripeAmt: { value: cast === 'indigo' ? 1 : 0 } });
  const standMat = new THREE.ShaderMaterial({ vertexShader: STAND_VERT, fragmentShader: STAND_FRAG, uniforms: standUniforms(), fog: true, side: THREE.DoubleSide });
  const mirrorMat = new THREE.ShaderMaterial({
    vertexShader: STAND_VERT, fragmentShader: STAND_FRAG, uniforms: standUniforms(), fog: true, side: THREE.DoubleSide, defines: { MIRROR: 1 },
    transparent: false, blending: THREE.CustomBlending, blendSrc: THREE.SrcAlphaFactor, blendDst: THREE.OneMinusSrcAlphaFactor,
    depthFunc: THREE.GreaterDepth, depthWrite: false,
  });
  const brng = rng.fork ? rng.fork('boat') : rng;
  const heroGeo = instanced(buildBoat(brng, 'hero', pal).geometry(), heroes);
  await ctx.yield?.();
  const farBase = buildBoat(brng, 'far', pal).geometry(), farGeo = instanced(farBase, far);
  const mirrorGeo = instanced(buildBoat(brng, 'mirror', pal).geometry(), heroes.filter((b) => !b.hang));   // (a mirror image under a hanging boat showed as a ghost sail)
  const add = (geo, mat, order, name) => { const m = new THREE.Mesh(geo, mat); m.frustumCulled = false; m.renderOrder = order; m.name = name; object.add(m); return m; };
  add(mirrorGeo, mirrorMat, 2, 'boat-reflections'); add(heroGeo, standMat, 3, 'hero-boats'); add(farGeo, standMat, 3, 'far-boats');

  // ---- wakes ----
  {
    const pos = [], idx = [], W = 8;
    for (let j = 0; j <= W; j++) for (const x of [-1, 0, 1]) pos.push(x, 0, j / W);
    for (let j = 0; j < W; j++) for (let k = 0; k < 2; k++) { const a = j * 3 + k; idx.push(a, a + 1, a + 3, a + 1, a + 4, a + 3); }
    const g0 = new THREE.BufferGeometry(); g0.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g0.setIndex(idx);
    const wakeMat = new THREE.ShaderMaterial({ vertexShader: WAKE_VERT, fragmentShader: WAKE_FRAG, uniforms: { ...fogU(), ...U }, fog: true,
      transparent: true, depthWrite: false, side: THREE.DoubleSide });
    add(instanced(g0, heroes.concat(far)), wakeMat, 4, 'wakes');
  }

  // ---- the Eyelet: a hoop of the river round the portal ----
  const portalPos = wp[wp.length - 1].clone(), pathDir = camCurve.getTangentAt(1).normalize();
  // a hoop of river water: centre c, axis n, radius R, thickness 2r. Returns its water material and a frame texture, so boats can sail round it
  const hoops = [];
  const hoopK = (opts.lamp ?? 0) > 0 ? 1.6 : 1;   // by moonlight the arches need more of their own light to read as water, not dark rings
  const makeHoop = (c, n, R, r, name, o) => {
    const e1 = new V3().crossVectors(n, new V3(0, 1, 0)).normalize(), e2 = new V3().crossVectors(e1, n).normalize(), circ = TAU * R;
    const NU = Math.max(72, Math.round(circ / 5)), NV = 14, pos = [], nor = [], tan = [], st = [], idx = [], q = new V3(), t = new V3(), rr = new V3();
    for (let i = 0; i <= NU; i++) {
      const a = (i / NU) * TAU; q.copy(e1).multiplyScalar(Math.cos(a)).addScaledVector(e2, Math.sin(a)); t.copy(e1).multiplyScalar(-Math.sin(a)).addScaledVector(e2, Math.cos(a));
      for (let j = 0; j <= NV; j++) {
        const b = (j / NV) * TAU; rr.copy(q).multiplyScalar(Math.cos(b)).addScaledVector(n, Math.sin(b));
        pos.push(c.x + q.x * R + rr.x * r, c.y + q.y * R + rr.y * r, c.z + q.z * R + rr.z * r);
        nor.push(rr.x, rr.y, rr.z); tan.push(t.x, t.y, t.z); st.push((i / NU) * circ, b);
      }
    }
    for (let i = 0; i < NU; i++) for (let j = 0; j < NV; j++) { const a = i * (NV + 1) + j, b = a + 1, cc = a + NV + 1, d = cc + 1; idx.push(a, b, cc, b, d, cc); }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
    g.setAttribute('aT', new THREE.Float32BufferAttribute(tan, 3)); g.setAttribute('aST', new THREE.Float32BufferAttribute(st, 2)); g.setIndex(idx);
    const k = Math.max(1, Math.round(circ / 72));
    const mat = new THREE.ShaderMaterial({ vertexShader: WATER_VERT, fragmentShader: WATER_FRAG, fog: true, side: THREE.DoubleSide,
      uniforms: waterUniforms({ len: circ, sc: [3 * k, 7 * k, 16 * k, k].map((v) => v / circ), tc: [1, 2, 5, 3], shoal: [(2 * k) / circ, 1], ripple: 0.5, glow: o.glow ?? 0.95, depth: 0.5, circ: TAU * r, shoalFar: 1,
        fres: 0.4, body: o.body ?? 1.9, caust: 0.3, streak: [1.5, 5], bulge: 0.2 * Math.sqrt(r / 1.75), bulgeK: [(5 * k * TAU) / circ, 2.1, (9 * k * TAU) / circ] }) });
    add(g, mat, 1, name);
    // frames for things that stand on it: the same four rows as the knot's texture
    const data = new Uint16Array(FN * 4 * 4), hf = THREE.DataUtils.toHalfFloat;
    for (let i = 0; i < FN; i++) {
      const a = (i / FN) * TAU, ca = Math.cos(a), sa = Math.sin(a);
      const C = [c.x + (e1.x * ca + e2.x * sa) * R, c.y + (e1.y * ca + e2.y * sa) * R, c.z + (e1.z * ca + e2.z * sa) * R], T = [-e1.x * sa + e2.x * ca, -e1.y * sa + e2.y * ca, -e1.z * sa + e2.z * ca], N = [n.x, n.y, n.z];
      for (let q3 = 0; q3 < 3; q3++) { const hi = Math.round(C[q3]); data[(0 * FN + i) * 4 + q3] = hf(hi); data[(1 * FN + i) * 4 + q3] = hf(C[q3] - hi); data[(2 * FN + i) * 4 + q3] = hf(T[q3]); data[(3 * FN + i) * 4 + q3] = hf(N[q3]); }
      for (let row = 0; row < 4; row++) data[(row * FN + i) * 4 + 3] = hf(1);
    }
    const tex = new THREE.DataTexture(data, FN, 4, THREE.RGBAFormat, THREE.HalfFloatType);
    tex.minFilter = tex.magFilter = THREE.NearestFilter; tex.generateMipmaps = false; tex.needsUpdate = true;
    const h = { mat, tex, circ, R, r, c: c.clone(), n: n.clone() }; hoops.push(h); return h;
  };
  const eyeletMat = makeHoop(portalPos, pathDir, HOOP_R, HOOP_r, 'eyelet', {}).mat;
  await ctx.yield?.();
  // three larger hoops the knot shed before it, standing in the river on the way out, each on the strand's own crown: the river's boats sail through them
  const hoopD = makeHoop(hoopSpec[0].c, hoopSpec[0].n, hoopSpec[0].R, hoopSpec[0].r, 'shed-hoop-inner', { glow: 1.7 * hoopK, body: 2.3 * hoopK });
  await ctx.yield?.();
  const hoopB = makeHoop(hoopSpec[1].c, hoopSpec[1].n, hoopSpec[1].R, hoopSpec[1].r, 'shed-hoop', { glow: 1.7 * hoopK, body: 2.2 * hoopK });
  await ctx.yield?.();
  const hoopC = makeHoop(hoopSpec[2].c, hoopSpec[2].n, hoopSpec[2].R, hoopSpec[2].r, 'shed-hoop-outer', { glow: 1.7 * hoopK, body: 1.9 * hoopK });
  await ctx.yield?.();
  // (no boats sail round the hoops: every boat is the one size, on the river, and the river's boats sail through them)

  // ---- beads of water and mist between two reaches of the river wherever they pass close ----
  {
    const nBead = Math.round(3500 * detail), nMist = Math.round(120 * detail), n = nBead + nMist;       // nothing drips from the Eyelet or the hoops
    const p0 = new Float32Array(n * 3), p1 = new Float32Array(n * 3), aS = new Float32Array(n * 4), pa = {}, pb = {};
    // Where two reaches of the river pass close (their surfaces within CLOSE metres of each other: the knot's three crossings,
    // 70 m of air between the strands at each) water leaves one river and arrives at the other: chains of droplet beads
    // streaming along slow bowed arcs, and mist drifting the same way. Nothing leaves the river anywhere else, nothing is
    // strewn along the route, and nothing falls to the cloud sea.
    const CLOSE = 90, passes = [];
    {
      const CS = 10, cl = [], pairs = [], lim = (CLOSE + 2 * TUBE_R) ** 2, far = Math.round(600 / CS); for (let sc = 0; sc < L; sc += CS) cl.push(K.frameAt(sc, {}).C.clone());
      for (let i = 0; i < cl.length; i++) {
        if ((i & 63) === 63) await ctx.yield?.();
        for (let j = i + far; j < cl.length && cl.length - (j - i) >= far; j++) { const d = cl[i].distanceToSquared(cl[j]); if (d < lim) pairs.push([d, i * CS, j * CS]); }
      }
      pairs.sort((x, y) => x[0] - y[0]);
      const apart = (x, y) => { const d = Math.abs(x - y) % L; return Math.min(d, L - d); };
      for (const [, sa, sb] of pairs) if (!passes.some((q) => apart(q.sa, sa) < 400 && apart(q.sb, sb) < 400)) passes.push({ sa, sb, ca: K.frameAt(sa, {}).C.clone(), cb: K.frameAt(sb, {}).C.clone() });
    }
    for (let i = 0; i < nBead + nMist && passes.length;) {
      const mist = i >= nBead, spread = mist ? 95 : 85, ps = passes[Math.floor(rng() * passes.length) % passes.length];
      const s0 = ps.sa + rng.range(-spread, spread), s1 = ps.sb + rng.range(-spread, spread);
      K.place(s0, K.thetaToward(s0, ps.cb) + rng.gauss() * 0.5, mist ? 6 : 0.4, pa); K.place(s1, K.thetaToward(s1, ps.ca) + rng.gauss() * 0.5, mist ? 6 : 0.4, pb);
      const flip = rng.chance(0.5), A = flip ? pb.position : pa.position, B = flip ? pa.position : pb.position;
      const rate = 1 / (mist ? rng.range(70, 150) : rng.range(45, 95)), nCh = mist ? 1 : Math.min(nBead - i, rng.int(14, 28)), ph = rng();
      for (let k = 0; k < nCh; k++, i++) {
        p0.set([A.x, A.y, A.z], i * 3); p1.set([B.x, B.y, B.z], i * 3);
        aS.set([mist ? rng.range(9, 24) : 0.1 + 0.34 * Math.pow(rng(), 2), mist ? 1 : 0, ph + (k + rng.range(-0.3, 0.3)) / nCh, rate], i * 4);
      }
      if ((i & 255) < 28) await ctx.yield?.();
    }
    const g = new THREE.InstancedBufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3)); g.setIndex([0, 1, 2, 0, 2, 3]);
    g.setAttribute('aP0', new THREE.InstancedBufferAttribute(p0, 3)); g.setAttribute('aP1', new THREE.InstancedBufferAttribute(p1, 3)); g.setAttribute('aS', new THREE.InstancedBufferAttribute(aS, 4));
    g.instanceCount = n;
    const sprayMat = new THREE.ShaderMaterial({ vertexShader: SPRAY_VERT, fragmentShader: SPRAY_FRAG, uniforms: { ...fogU(), ...U }, fog: true,
      transparent: true, depthWrite: false, blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor });
    add(g, sprayMat, 6, 'crossing-spray');
  }
  await ctx.yield?.();
  // ---- a reed islet on the ceiling at the Crossing, four herons standing on it ----
  if (opts.ceilingIslet !== false) {
    const b = makeBuilder(brng), irng = brng, K4 = (w) => [4, 0, 0, w];
    // the mat: a low lumpy mound of mud, moss and old reed
    const RN = 22, rad = []; for (let k = 0; k < RN; k++) rad.push(10.5 + 4.5 * irng());
    const FR = [0, 0.3, 0.55, 0.75, 0.9, 1.0], lump = FR.map(() => rad.map(() => irng()));
    const mp = (k, j) => { const a = ((k % RN) / RN) * TAU, f = FR[j], r = rad[k % RN] * f; return [Math.cos(a) * r, j === 5 ? -0.15 : 0.5 * (1 - f * f) + 0.1 + 0.22 * lump[j][k % RN], Math.sin(a) * r]; };
    const matCols = ['#5a5a3a', '#62603c', '#545838', '#5e5a40'], wet = ['#3c4a3a', '#44503c'];
    const mn = (p) => b.norm([p[0] * 0.05, 1, p[2] * 0.05]);
    for (let k = 0; k < RN; k++) for (let j = 0; j < 5; j++) {
      const c = b.rgb(irng.pick(j >= 3 ? wet : matCols), 0.06), p0 = mp(k, j), p1 = mp(k, j + 1), p2 = mp(k + 1, j + 1), p3 = mp(k + 1, j);
      if (j === 0) { const o = [0, 0.75, 0]; b.tri(o, p1, p2, c, undefined, undefined, undefined, [mn(o), mn(p1), mn(p2)]); continue; }
      b.tri(p0, p1, p2, c, undefined, undefined, undefined, [mn(p0), mn(p1), mn(p2)]); b.tri(p0, p2, p3, c, undefined, undefined, undefined, [mn(p0), mn(p2), mn(p3)]);
    }
    // float-leaves with white cup flowers moored round the rim
    for (let i = 0; i < 16; i++) {
      const a = irng() * TAU, rk = rad[Math.floor((a / TAU) * RN) % RN] + irng.range(0.4, 3.2), x = Math.cos(a) * rk, z = Math.sin(a) * rk, lr = irng.range(0.42, 0.6);
      b.spar([x, 0.02, z], [x, 0.06, z], lr, lr * 0.96, 7, b.rgb(irng.pick(['#3a6236', '#46703c', '#34583a']), 0.08), true, K4(0.02));
      if (irng.chance(0.5)) b.spar([x + 0.1, 0.06, z], [x + 0.1, 0.3, z], 0.05, 0.17, 5, b.rgb('#a9a99c', 0.05), false, K4(0.02), K4(0.04));
    }
    // reeds in tufts: slender blades, dark green at the foot, gold at the tip, some with a plume;
    // a clearing toward +z for the herons, and a skirt of short growth to break the rim
    const nTuft = 270, herons = [[-5.5, 11.5, 0.5, 1.05, 1], [-1.6, 8.6, -0.4, 0.95, 0.4], [1.8, 10.4, 0.9, 1.0, 0.8], [4.6, 7.8, -1.1, 0.9, 0.1]];
    for (let i = 0; i < nTuft; i++) {
      const skirt = i >= 185, a = irng() * TAU, rk = rad[Math.floor((a / TAU) * RN) % RN];
      const r = skirt ? rk * irng.range(0.82, 1.0) : Math.sqrt(irng()) * (rk - 1.5), x = Math.cos(a) * r, z = Math.sin(a) * r;
      const glade = !skirt && z > 5.5 && Math.abs(x) < 7.5;            // short turf where the herons stand
      if (glade && herons.some((hp) => Math.hypot(hp[0] - x, hp[1] - z) < 0.9)) continue;
      const y0 = 0.45 * (1 - (r / 14) ** 2) + 0.15, hT = glade ? irng.range(0.3, 0.75) : skirt ? irng.range(0.9, 1.9) : irng.range(2.2, 3.7), nb = skirt || glade ? 4 : 5 + (irng() < 0.4 ? 1 : 0);
      const foot = b.rgb(irng.pick(['#27421f', '#2f4d22', '#365224']), 0.1), tip = b.rgb(irng.pick(['#8a7a34', '#96843a', '#7c7a30']), 0.1);
      const mid = [(foot[0] * 1.3 + tip[0]) / 2.1, (foot[1] * 1.5 + tip[1]) / 2.1, (foot[2] * 1.3 + tip[2]) / 2.1];
      for (let q = 0; q < nb; q++) {
        const h = hT * irng.range(0.7, 1), ya = irng() * Math.PI, w = irng.range(0.05, 0.08), dx = Math.cos(ya) * w, dz = Math.sin(ya) * w;
        const la = irng() * TAU, ll = irng.range(0.15, 0.3) * h, lx = Math.cos(la) * ll, lz = Math.sin(la) * ll, bx = x + irng.range(-0.25, 0.25), bz = z + irng.range(-0.25, 0.25);
        const m = [bx + lx * 0.35, y0 + h * 0.58, bz + lz * 0.35], t = [bx + lx, y0 + h, bz + lz], wm = 0.33 * (h / 3), wt = h / 3;
        b.quad([bx - dx, y0, bz - dz], [bx + dx, y0, bz + dz], [m[0] + dx * 0.75, m[1], m[2] + dz * 0.75], [m[0] - dx * 0.75, m[1], m[2] - dz * 0.75], foot, K4(0), K4(0), K4(wm), K4(wm));
        b.tri([m[0] - dx * 0.75, m[1], m[2] - dz * 0.75], [m[0] + dx * 0.75, m[1], m[2] + dz * 0.75], t, mid, K4(wm), K4(wm), K4(wt));
        if (q === 0 && !skirt && !glade && irng.chance(0.45)) {
          const c = b.rgb('#9c8c6a', 0.08), pw = 0.07;
          b.quad([t[0], t[1] - 0.1, t[2]], [t[0] + pw, t[1] + 0.25, t[2] + pw], [t[0] + lx * 0.12, t[1] + 0.7, t[2] + lz * 0.12], [t[0] - pw, t[1] + 0.25, t[2] - pw], c, K4(wt), K4(wt * 1.1), K4(wt * 1.25), K4(wt * 1.1));
        }
      }
    }
    for (const hp of herons) addHeron(b, ...hp);
    const ig = instanced(b.geometry(), [{ s: isletAt.s, th: isletAt.th, yaw: 0, scale: 1, mir: 1, vs: 0, vth: 0, phase: irng() * TAU, seed: irng() }]);
    const isletMat = new THREE.ShaderMaterial({ vertexShader: STAND_VERT, fragmentShader: STAND_FRAG, uniforms: standUniforms(), fog: true, side: THREE.DoubleSide, defines: { WRAP: 1 } });
    add(ig, isletMat, 3, 'ceiling-islet');
  }

  // ---- anchors ----
  const arr = (v) => [Math.round(v.x * 10) / 10, Math.round(v.y * 10) / 10, Math.round(v.z * 10) / 10];
  const rP = (t) => K.P(t).map((x) => Math.round(x));
  const bounds = { min: [1e9, 1e9, 1e9], max: [-1e9, -1e9, -1e9] };
  for (let i = 0; i < 400; i++) { const q = K.P((i / 400) * TAU); for (let k = 0; k < 3; k++) { bounds.min[k] = Math.min(bounds.min[k], Math.round(q[k] - TUBE_R)); bounds.max[k] = Math.max(bounds.max[k], Math.round(q[k] + TUBE_R)); } }
  const anchors = {
    entry: { position: WAYPOINTS[0].slice(), heading: arr(camCurve.getTangentAt(0)) },
    flyThrough: WAYPOINTS.map((p) => p.slice()),
    crossing: { position: arr(crossMid), upperCentre: arr(upC), lowerCentre: arr(lowC), upperS: sUp, lowerS: sLow },
    under: { u: U_UNDER, s: sUnder, position: arr(camAt(U_UNDER)), islet: { s: isletAt.s, th: isletAt.th } },     // where the route goes under the bar
    bridge: { u: U_BRIDGE, s: sUp, position: arr(camAt(U_BRIDGE)) },                                              // where it skims under the western strand at the Crossing
    arm: { s: sArm }, entryS: sEntry,
    portalSeat: { position: arr(portalPos), facing: arr(pathDir.clone().negate()), hoopRadius: HOOP_R, hoopThickness: HOOP_r * 2 },
    hoops: hoops.map((h) => ({ centre: arr(h.c), axis: arr(h.n), radius: h.R, thickness: h.r * 2 })),
    viewpoints: {
      wholeKnot: { position: WAYPOINTS[10].slice(), look: [-20, 330, 1000] },
      crossing: { position: arr(camAt(U_UNDER - 0.045)), look: arr(K.place(sUnder, thDown(sUnder), 0).position) },
      eye: { position: WAYPOINTS[36].slice(), look: arr(portalPos) },
      hill: { position: WAYPOINTS[0].slice(), look: arr(K.frameAt(K.sOfT(3.8)).C) },
    },
    berths,                                                         // [{ s, th, d, upY }] where the reed islets of our stretch float or hang (the fleet keeps clear of them)
    pois: { knot: [-20, 330, 1000], ceiling: arr(K.place(sUnder, thDown(sUnder), 0).position) },
    landmarks: { eye: [0, 142, 971], topCrossing: rP(1.8235).map((x, i) => Math.round((x + rP(4.4597)[i]) / 2)), twinCrossing: [-429, 60, 737], lobeRight: rP(1.0472), lobeLeft: rP(5.236), archTop: rP(1.5), lowest: rP(3.61) },
    bounds,
    sunDir: sunDir.toArray(),
  };

  // ---- animation ----
  let progress = null; const _sz = new THREE.Vector2(), fr = (x) => x - Math.floor(x), extraWater = [];
  const scroll = (m, time, k) => {
    const u = m.uniforms, names = ['uOffA', 'uOffB', 'uOffC', 'uOffD', 'uOffE'];
    for (let i = 0; i < 5; i++) u[names[i]].value.set(-fr(time * flowLayers[i][0] * k[0]), fr(time * (flowLayers[i][1] * k[1] + k[2])));
  };
  const update = (dt, time, camera) => {
    U.uTime.value = time; U.uClock.value = progress == null ? time : progress * duration;
    if (camera && ctx.renderer) { ctx.renderer.getDrawingBufferSize(_sz); U.uPixAng.value = 2 / ((camera.projectionMatrix.elements[5] || 1.66) * Math.max(1, _sz.y)); }
    scroll(waterMat, time, [1, 1, 0]); scroll(eyeletMat, time, [0.55, 1, 0.07]); scroll(hoopB.mat, time, [0.5, 1, 0.05]); scroll(hoopC.mat, time, [0.6, 1, 0.035]); scroll(hoopD.mat, time, [0.52, 1, 0.06]);
    for (const [m, k] of extraWater) scroll(m, time, [k, 1, 0.05]);
  };
  update(0, 0, null);

  const view = { c: new V3(0, 230, 850), r: 420, h: 500 };     // orbit weaves through the knot, never nearer than 50 m to water
  return {
    object, radius: view.r, height: view.h, center: view.c,      // orbit-viewer hints; the real extent is anchors.bounds
    anchors, update, ground: false, groundY: -750,
    setProgress(u) { progress = u == null ? null : Math.max(0, Math.min(1, u)); },
    setSun(dir, colorHex, intensity = 2.4) { sunDir.copy(dir.isVector3 ? dir : new V3().fromArray(dir)).normalize(); if (colorHex) sunCol.set(colorHex).multiplyScalar(intensity); },
    frameAt: K.frameAt, place: K.place, sOfT: K.sOfT, tOfS: K.tOfS, crownTheta: K.crownTheta, thetaToward: K.thetaToward, centreAt: K.P,
    eyelet: eyeletMat,                                               // the Eyelet's water material (its uniforms may be driven)
    length: L, tubeRadius: TUBE_R, radialGLSL: RADIAL_GLSL, skyGLSL: SKY_GLSL, uniforms: U, occupied, cast,
    // for the world: things that stand on the river with the hero's own shading
    fleet: { heroes, far }, instanced, add, builder: () => makeBuilder(brng), noise: noiseTex, palette: pal,
    standMaterial: (defines) => new THREE.ShaderMaterial({ vertexShader: STAND_VERT, fragmentShader: STAND_FRAG, uniforms: standUniforms(), fog: true, side: THREE.DoubleSide, defines: defines || {} }),
    // a water material for another tube (geometry needs position, normal, aT, aST = (metres along, angle round)); len = its length
    waterMaterial(len, o = {}) {
      const r = o.radius ?? 2, m = new THREE.ShaderMaterial({ vertexShader: WATER_VERT, fragmentShader: WATER_FRAG, fog: true, side: THREE.DoubleSide,
        uniforms: waterUniforms({ len, sc: [3, 7, 16, 2].map((k) => (k * (o.tiles ?? 1)) / len), tc: [1, 2, 5, 1], shoal: [2 / len, 1], ripple: o.ripple ?? 0.5, glow: o.glow ?? 1.4, caust: o.caust ?? 0.4, depth: 0.5, circ: TAU * r, shoalFar: 1,
          bulge: o.bulge ?? 0.15, bulgeK: [(5 * TAU) / len, 2.1, (9 * TAU) / len] }) });
      extraWater.push([m, o.flow ?? 0.5]); return m;
    },
    dispose() { K.tex.dispose(); noiseTex.dispose(); },
  };
}
