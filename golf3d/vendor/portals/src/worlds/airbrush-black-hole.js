// THE AIRBRUSHED ABYSS: a black hole and its disc as a 1970s airbrushed paperback cover, flown from the back of
// a chrome wedge ship. Styled world: every surface is painted by ShaderMaterials that share the hero's STYLE_GLSL
// (abSpray grain, abFrisket masks, abRampS ramps, abChrome), and it returns style 'none'.
// POST: EXACT COLOURS, as the hero is tuned: post { flat: 1, bloom 0, saturation 1, contrast 1, no vignette, no
//       grain }. No lights, no fog (depth comes from value), exposure 1. Shaders write the paint colour itself.
// SECTIONS, in order
//   1 GLSL shared by this file (UNDER: hides what lies under the disc; CHROME: the ship, wingmen and hoop)
//   2 geometry helpers: wedge hulls, ribbons
//   3 build(): seeded edition and cast (EDITION, ctx.vary.hour / density / rare) -> PATH and PACE (pace table,
//     tOfU / uOfT turn the brief's seconds into u) -> HERO (buildHero at the origin, unscaled; conePass from the
//     pace table) -> moonlet + boulders -> companion star, stream ribbons, puffs (splash, dust, halos) -> SHIP rig
//     -> wingmen + wake -> motes -> hoop, its sprayed halo + ruled glints -> POIS -> return (camera, portal, post)
//   4 update(): scripted moments keyed to u: hero.setProgress(u) (cone 0 sweeps over the camera at 20 s),
//     motes.uBurst (speckle rush under the cone), wingmen (12 s to 31 s), wake.uWakeS, hero.setEinstein (rare,
//     30 s to 40 s), ship pose, lag and shiver, shipU.uUnder (the disc's light climbing the hull from u 0.835). Ambient loops run on time (hero.uniforms.uTime is shared).
// The ship is posed every frame from the camera passed to update() (matrixWorld), never a cached one: it sits at
// the camera and its nose follows the camera's GAZE (75% gaze, 25% the lagged line of flight, at most 9 degrees
// off the gaze). EXCEPT while u is exactly 0 (the world seen through the previous world's portal, drawn by the
// portal's camera and cut at the portal's plane): then it is parked at the path's first point and heading.
import * as THREE from 'three';
import { makePath, clamp, lerp, smoothstep } from '../kit/core.js';
import { buildHero, STYLE_GLSL, DISC_GLSL, styleMaterial, styleUniforms, B_CRIT } from '../parts/airbrush-black-hole.js';

// ------------------------------------------------------------------------------------------------- 1 GLSL
// 1 = visible, 0 = hidden by the painted disc between the eye and a point under its plane
const UNDER_GLSL = /* glsl */`
float abUnder(vec3 wp){
  vec3 cam = cameraPosition;
  if (wp.y >= 0. || cam.y <= 0.) return 1.;
  float t = cam.y / max(cam.y - wp.y, 1e-3);
  vec3 h = mix(cam, wp, t);
  return 1. - abDiscMask(h.xz, 3. + length(h - cam) * .004);
}`;
const CHROME_GLSL = /* glsl */`
vec3 abChromeWorld(vec3 n, vec2 key, float fp){
  vec3 r = reflect(normalize(vView), n);
  float rl = max(length(r), 1e-4); r /= rl;
  // the lanes below run through the under-horizon bands
  vec2 P = vWorldPos.xz + r.xz * (max(vWorldPos.y, 1.) / max(-r.y, .04));
  float lanes = abNoise(vec3(length(P) * .045, atan(P.y, P.x + 1e-3) * 3. - uTime * .35, 3.));
  vec3 rb = r; rb.y += (lanes - .5) * .16 * step(r.y, .0);
  vec3 col = abChrome(rb, key, fp);
  // the hole's shadow and its arch, two analytic shapes in the reflection
  vec3 hd = -vWorldPos; float hl = max(length(hd), 1.); hd /= hl;
  float ang = acos(clamp(dot(r, hd), -1., 1.));
  float th = min(asin(clamp(${B_CRIT.toFixed(1)} / max(hl, ${(B_CRIT + 1).toFixed(1)}), 0., 1.)), .3);
  float wA = max(fwidth(ang), 1e-4);
  float sh = 1. - abFrisket(ang - th, wA);
  float arch = (1. - abFrisket(ang - th * 1.4, wA)) * step(hd.y - .03, r.y);
  col = mix(col, mix(uInk[3], uInk[4], .55), arch);
  col = mix(col, uInk[0], sh);
  return col;
}`;
const SHIP_PAINT = CHROME_GLSL + /* glsl */`
uniform float uUnder;                                 // 0..1: the disc's light climbing the hull on the way out
vec4 abPaint(){
  vec3 n = normalize(vNormal); if (dot(n, vView) > 0.) n = -n;
  vec2 key = vPos.xz * 24.; float fp = max(max(fwidth(key.x), fwidth(key.y)), 1e-4);
  if (vUv.x > 50.){                                   // exhaust plume cards (wingman)
    float s = 1. - abs(vUv.x - 100.), k = 1. - vUv.y;
    float cov = k * k * k * smoothstep(0., .9, s) * (.45 + .6 * abNoise(vec3(vUv.y * 9. - uTime * 6., vUv.x * 3., 1.)));
    if (abSpray(cov, key, fp, 0.) < .45) discard;             // the hull material is opaque: thin spray breaks into specks
    return vec4(abRampS(.55 + .44 * cov, key, fp, 2.), 1.);
  }
  vec3 col = abChromeWorld(n, key, fp);
  // panel seams: frisket lines across the hull and one each side of the spine
  float fz = max(fwidth(vPos.z), 1e-4), fx = max(fwidth(vPos.x), 1e-4);
  float dz = abs(fract(vPos.z / 6.4 + .37) - .5) * 6.4;
  float seam = (1. - smoothstep(.03, .03 + fz, dz)) * min(.06 / fz, 1.);
  float dx = abs(abs(vPos.x) - 2.1);
  seam = max(seam, (1. - smoothstep(.03, .03 + fx, dx)) * min(.06 / fx, 1.) * step(abs(vUv.x), .93));
  col = mix(col, mix(uInk[0], uInk[1], .35), seam * .8);
  // a row of flush rivets inside each chine
  float wl = abs(vPos.x) / max(abs(vUv.x), .05);
  vec2 rv = vec2((abs(vUv.x) - .84) * wl, (fract(vPos.z / 1.3) - .5) * 1.3);
  float rd = length(rv);
  float rw = max(fwidth(rd), 1e-4);
  float vis = min(.11 / rw, 1.);
  col = mix(col, mix(uInk[0], uInk[1], .5), (1. - smoothstep(.1, .1 + rw, rd)) * .85 * vis);
  col = mix(col, vec3(1.), (1. - smoothstep(.035, .035 + rw, length(rv - vec2(.03, -.04)))) * .8 * vis);
  // the pull-up: the floor of fire drops away and its light climbs the hull: sprayed up round both chines, the fins
  // and every face that leans well outward; the spine keeps its clean chrome
  float rim = smoothstep(.15, .78, min(abs(vUv.x), 1.)), lean = 1. - smoothstep(.3, .8, n.y);
  col = mix(col, mix(uInk[3], uInk[4], .3), abSpray(uUnder * max(rim * .62, lean * .8), key, fp, 3.) * .92);
  // fins: a rivet row along the root
  if (abs(vUv.x) > 1.5){
    float am = (abs(vUv.x) - 2.) * 10.;
    vec2 fr = vec2(am - .34, (fract(vUv.y / 1.1) - .5) * 1.1);
    float fd = length(fr), fq = max(fwidth(fd), 1e-4), fv = min(.11 / fq, 1.);
    col = mix(col, mix(uInk[0], uInk[1], .5), (1. - smoothstep(.1, .1 + fq, fd)) * .85 * fv);
    col = mix(col, vec3(1.), (1. - smoothstep(.035, .035 + fq, length(fr - vec2(.03, -.04)))) * .8 * fv);
  }
  // stern plate of a wingman: two frisket-hard exhausts with their under-spray
  if (vUv.y < -.5){
    float de = length(vec2(abs(vPos.x) - 5., vPos.y - .8)) - 1.5;
    float m = 1. - abFrisket(de, max(fwidth(de), 1e-4));
    col = mix(mix(uInk[0], uInk[1], .4), mix(uInk[4], vec3(1.), .5), max(m, abSpray(abHalo(de, 40.) * 2.4, key, fp, 0.)));
  }
  return vec4(col, 1.);
}`;

// ------------------------------------------------------------------------------------------------- 2 geometry
// A chrome wedge. own = the ship we ride (top surface only, built round the eye at the origin, nose at z -30);
// otherwise a closed 60 m delta with a stern plate. uv = (across -1..1, 0..1 stern to nose; -1 on the stern plate).
async function wedgeGeometry(own, pause) {
  const NX = own ? 56 : 22, NZ = own ? 84 : 30;
  const pos = [], uvs = [], idx = [];
  const z0 = own ? 7 : 30, len = own ? 37 : 60;
  const surf = (xi, s, top) => {
    const z = z0 - s * len, w = (own ? 13.5 : 15) * Math.pow(1 - s, 0.8) + 0.04, x = xi * w;
    let y;
    if (own) {
      const spine = -3.3 - 8.2 * Math.pow(clamp(-z / 30, 0, 1), 1.15);
      y = spine - 0.11 * w * xi * xi - 0.9 * Math.pow(Math.abs(xi), 8) * Math.min(w, 3) / 3;
      y += 0.42 * Math.exp(-(x / 0.55) * (x / 0.55)) * Math.pow(1 - s, 0.3);
      const bx = (Math.abs(x) - 4.2) / 1.25, bz = (z + 9.5) / 3.4, d2 = bx * bx + bz * bz;
      if (d2 < 1) y += 0.85 * Math.sqrt(1 - d2);
    } else {
      const lens = Math.pow(Math.max(1 - Math.pow(Math.abs(xi), 2.2), 0), 0.8);
      y = top ? (3.4 * Math.pow(1 - s, 0.9) + 0.05) * lens + 0.5 * Math.exp(-(x / 0.7) * (x / 0.7)) * (1 - s)
        : -(1.2 * Math.pow(1 - s, 0.9) + 0.03) * lens;
      const bx = (Math.abs(x) - 5) / 1.6, bz = (z - 14) / 6, d2 = bx * bx + bz * bz;
      if (top && d2 < 1) y += 1.1 * Math.sqrt(1 - d2);
    }
    return [x, y, z];
  };
  const sheet = async (top) => {
    const base = pos.length / 3;
    for (let j = 0; j <= NZ; j++) {
      for (let i = 0; i <= NX; i++) {
        const xi = (i / NX) * 2 - 1, s = j / NZ, p = surf(xi, s, top);
        pos.push(p[0], p[1], p[2]); uvs.push(xi, s);
      }
      if (j % 12 === 11) await pause();
    }
    for (let j = 0; j < NZ; j++) for (let i = 0; i < NX; i++) {
      const a = base + j * (NX + 1) + i, b = a + 1, c = a + NX + 1, d = c + 1;
      if (top) idx.push(a, b, c, b, d, c); else idx.push(a, c, b, b, c, d);
    }
  };
  await sheet(true);
  await pause();
  const tri = (a, b, c, u) => { const k = pos.length / 3; pos.push(...a, ...b, ...c); uvs.push(u[0], u[1], u[0], u[1], u[0], u[1]); idx.push(k, k + 1, k + 2); };
  if (!own) {
    await sheet(false);
    for (let i = 0; i < NX; i++) {                       // stern plate
      const x0 = (i / NX) * 2 - 1, x1 = ((i + 1) / NX) * 2 - 1;
      const a = surf(x0, 0, true), b = surf(x1, 0, true), c = surf(x0, 0, false), d = surf(x1, 0, false);
      tri(a, c, b, [0, -1]); tri(b, c, d, [0, -1]);
    }
    for (const sx of [-1, 1]) {                          // exhaust plume cards: flat and upright
      const k = pos.length / 3, x = sx * 5;
      pos.push(x - 2.2, 0.8, 30, x + 2.2, 0.8, 30, x - 1, 0.8, 78, x + 1, 0.8, 78, x, -1.2, 30, x, 2.8, 30, x, 0.2, 78, x, 1.4, 78);
      uvs.push(99, 0, 101, 0, 99, 1, 101, 1, 99, 0, 101, 0, 99, 1, 101, 1);
      idx.push(k, k + 2, k + 1, k + 1, k + 2, k + 3, k + 4, k + 6, k + 5, k + 5, k + 6, k + 7);
    }
  }
  for (const sx of [-1, 1]) {                            // two canted fins
    // blades, not flat cards: a lens section along the chord and a curved taper from root to tip (a grid a side,
    // smooth normals), so the chrome bands bend across them. uv = (sx * (2 + metres up the blade / 10), metres along)
    const F = own ? [[sx * 8.9, -7.3, -11.5], [sx * 10.2, -7.2, -5.5], [sx * 9.3, -5.5, -7.4]] : [[sx * 9, 1.2, 8], [sx * 13.5, 0.6, 29], [sx * 15.5, 7.5, 31]];
    const A = own ? 0.55 : 1.2, NS = 10, NT = 5;
    const chord = Math.hypot(F[1][0] - F[0][0], F[1][1] - F[0][1], F[1][2] - F[0][2]);
    const tall = Math.hypot(F[2][0] - (F[0][0] + F[1][0]) / 2, F[2][1] - (F[0][1] + F[1][1]) / 2, F[2][2] - (F[0][2] + F[1][2]) / 2);
    for (const sd of [-1, 1]) {
      const base = pos.length / 3;
      for (let j = 0; j <= NT; j++) for (let i = 0; i <= NS; i++) {
        const sc = i / NS, t = (j / NT) * 0.94, o = sd * (0.03 + A * (1 - t * t) * (0.3 + 0.7 * Math.sin(Math.PI * sc)));
        const bx = lerp(F[0][0], F[1][0], sc), by = lerp(F[0][1], F[1][1], sc), bz = lerp(F[0][2], F[1][2], sc);
        pos.push(lerp(bx, F[2][0], t) + o, lerp(by, F[2][1], t), lerp(bz, F[2][2], t));
        uvs.push(sx * (2 + t * tall / 10), sc * chord);
      }
      for (let j = 0; j < NT; j++) for (let i = 0; i < NS; i++) {
        const a = base + j * (NS + 1) + i, b = a + 1, c = a + NS + 1, d = c + 1;
        if (sd * sx > 0) idx.push(a, b, c, b, d, c); else idx.push(a, c, b, b, c, d);
      }
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  g.setIndex(idx);
  await pause();
  g.computeVertexNormals();
  await pause();
  return g;
}

// Camera-facing ribbons along polylines. lines: [{ pts: [Vector3...], width, kind, seed }]
function ribbonGeometry(lines) {
  const pos = [], tan = [], uvs = [], dat = [], idx = [];
  const t = new THREE.Vector3();
  for (const ln of lines) {
    const n = ln.pts.length, base = pos.length / 3;
    for (let i = 0; i < n; i++) {
      const p = ln.pts[i];
      t.subVectors(ln.pts[Math.min(i + 1, n - 1)], ln.pts[Math.max(i - 1, 0)]).normalize();
      for (const s of [-1, 1]) { pos.push(p.x, p.y, p.z); tan.push(t.x, t.y, t.z); uvs.push(s, i / (n - 1)); dat.push(ln.width, ln.kind, ln.seed); }
    }
    for (let i = 0; i < n - 1; i++) { const a = base + i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('aTan', new THREE.Float32BufferAttribute(tan, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  g.setAttribute('aDat', new THREE.Float32BufferAttribute(dat, 3));
  g.setIndex(idx);
  return g;
}

const BRIEF_PATH = [[-2600, 330, 0], [-2540, 330, 0], [-2260, 322, -10], [-2182, 303, -26], [-1926, 184, -138], [-1747, 92, -227],
  [-1516, 37, -322], [-1082, 34, -440], [-784, 32, -469], [-534, 32, -454], [-346, 32, -391], [-269, 32, -328], [-204, 32, -252],
  [-162, 47, -200], [-134.3, 70.3, -165.7], [-106.7, 93.7, -131.3], [-79, 117, -97]];
const DUR = 47;

// ------------------------------------------------------------------------------------------------- 3 build
export default {
  id: 'airbrush-black-hole',
  name: 'The Airbrushed Abyss',
  category: 'sky',
  weirdness: 0.6,
  media: ['space'],
  async build(ctx) {
    const rng = ctx.rng, noise = ctx.noise, vary = ctx.vary || {};
    const detail = ctx.quality?.detail ?? 1;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#04040C');

    // ---- EDITION and cast (all seeded draws up front, in one fixed order)
    const edRoll = rng(), crackRoll = rng(), wingRoll = rng(), moonSeed = rng.range(0, 50);
    const hour = vary.hour || 'any';
    const edition = hour === 'night' ? 'violet' : hour === 'dawn' ? 'verdigris' : (hour === 'day' || hour === 'golden') ? 'cadmium'
      : edRoll < 0.4 ? 'cadmium' : edRoll < 0.7 ? 'violet' : 'verdigris';
    const cracked = crackRoll < 0.45, nWing = wingRoll < 0.45 ? 1 : wingRoll < 0.8 ? 2 : 3;
    const density = clamp(vary.density ?? 1, 0.7, 1.3);
    const portalColor = edition === 'violet' ? '#FFD27A' : edition === 'verdigris' ? '#FFB27A' : '#9FF5E6';
    const crRng = rng.fork('craters'), bRng = rng.fork('boulders'), pRng = rng.fork('puffs'), mRng = rng.fork('motes');

    // ---- PATH and PACE
    const path = makePath(BRIEF_PATH);
    const paceRaw = (u) => lerp(0.46, 1.43, 1 - smoothstep(0.735, 0.83, u)) + 0.42 * smoothstep(0.88, 1, u);
    const NT = 256, tTab = new Float32Array(NT + 1);
    for (let i = 1; i <= NT; i++) tTab[i] = tTab[i - 1] + 1 / paceRaw((i - 0.5) / NT) / NT;
    for (let i = 1; i <= NT; i++) tTab[i] *= DUR / tTab[NT];
    const tOfU = (u) => { const f = clamp(u, 0, 1) * NT, i = Math.min(Math.floor(f), NT - 1); return lerp(tTab[i], tTab[i + 1], f - i); };
    const uOfT = (t) => { let i = 0; while (i < NT - 1 && tTab[i + 1] < t) i++; return (i + clamp((t - tTab[i]) / Math.max(tTab[i + 1] - tTab[i], 1e-6), 0, 1)) / NT; };
    const speedAt = (u) => paceRaw(u) * (tTab[NT] > 0 ? path.length / DUR : 60) * 0.98;
    const uConePass = uOfT(20);
    const V3 = THREE.Vector3;
    const conePos = path.pointAt(uConePass, new V3());
    await ctx.yield();

    // ---- HERO: the hole and its disc at the origin, unscaled (built metres)
    const heroPath = [];
    for (let i = 0; i <= 96; i++) { const p = path.pointAt(i / 96, new V3()); heroPath.push([p.x, p.y, p.z]); }
    const hero = await buildHero(ctx, { edition, path: heroPath, duration: DUR, conePass: { u: uConePass, position: [conePos.x, conePos.y, conePos.z] },
      clumps: clamp(Math.round(11 * density), 8, 14) });
    scene.add(hero.object);
    const A = hero.anchors, SU = styleUniforms(hero);
    const portalPos = A.portalSeat.position.clone();
    await ctx.yield();

    // ---- MOONLET: a black cratered limb edged in the disc's colour (sphere 375 across, craters at three scales)
    const MC = A.moonlet.clone(), MR = 187.5;
    const L1 = MC.clone().negate().normalize(), L2 = A.companion.clone().sub(MC).normalize();
    await ctx.yield();
    const craters = [];
    for (let i = 0; i < 36; i++) {
      const a = crRng.range(0, Math.PI * 2), y = i < 14 ? crRng.range(0.25, 0.98) : crRng.range(-0.6, 1), s = Math.sqrt(1 - y * y);
      const rad = i < 4 ? crRng.range(0.26, 0.4) : i < 14 ? crRng.range(0.09, 0.18) : crRng.range(0.035, 0.075);
      craters.push(new THREE.Vector4(Math.cos(a) * s, y, Math.sin(a) * s, rad));
    }
    const riftN = new V3(0.3, 0.22, 0.93).normalize();
    const moonH = (x, y, z) => {
      let h = 11 * noise.fbm3(x * 1.4 + moonSeed, y * 1.4, z * 1.4, 3) + 2.2 * noise.n3(x * 8, y * 8 + moonSeed, z * 8);
      for (let i = 0; i < 14; i++) {
        const c = craters[i], dx = x - c.x, dy = y - c.y, dz = z - c.z, d = Math.sqrt(dx * dx + dy * dy + dz * dz) / c.w;
        if (d < 1.5) { const e = (d - 1) / 0.2; h += c.w * MR * (0.22 * (d < 1 ? d * d - 1 : 0) + 0.07 * Math.exp(-e * e)); }
      }
      if (cracked) { const e = (x * riftN.x + y * riftN.y + z * riftN.z - 0.08) / 0.03; h -= 26 * Math.exp(-e * e); }
      return h;
    };
    const moonGeo = new THREE.BufferGeometry();
    {
      const NU = 168, NV = 104, mpos = new Float32Array((NU + 1) * (NV + 1) * 3), mi = new Uint32Array(NU * NV * 6);
      let vi = 0;
      for (let j = 0; j <= NV; j++) {
        const th = (j / NV) * Math.PI, y = Math.cos(th), sn = Math.sin(th);
        for (let i = 0; i <= NU; i++) {
          const ph = (i / NU) * Math.PI * 2, x = Math.cos(ph) * sn, z = Math.sin(ph) * sn;
          let r = MR + moonH(x, y, z);
          const wy = MC.y + y * r;
          if (wy > 262) { const d = path.distanceTo(MC.x + x * r, wy, MC.z + z * r); if (d < 17) r -= (17 - d) * 1.3; }
          mpos[vi * 3] = x * r; mpos[vi * 3 + 1] = y * r; mpos[vi * 3 + 2] = z * r; vi++;
          if (vi % 400 === 0) await ctx.yield();
        }
      }
      let k = 0;
      for (let j = 0; j < NV; j++) {
        for (let i = 0; i < NU; i++) { const a = j * (NU + 1) + i, b = a + 1, c = a + NU + 1, d = c + 1; mi[k++] = a; mi[k++] = b; mi[k++] = c; mi[k++] = b; mi[k++] = d; mi[k++] = c; }
        if (j % 24 === 23) await ctx.yield();
      }
      moonGeo.setAttribute('position', new THREE.BufferAttribute(mpos, 3));
      moonGeo.setAttribute('uv', new THREE.BufferAttribute(new Float32Array((NU + 1) * (NV + 1) * 2), 2));
      moonGeo.setIndex(new THREE.BufferAttribute(mi, 1));
      await ctx.yield();
      moonGeo.computeVertexNormals();
      await ctx.yield();
    }
    const moonLight = /* glsl */`
      uniform vec3 uL1; uniform vec3 uL2;
      vec3 abRock(vec3 n, float sh, float hi, vec2 key, float fp){
        float l1 = dot(n, uL1);
        float c = smoothstep(-.14, .4, l1);
        float rim = pow(1. - abs(dot(n, normalize(vView))), 4.) * smoothstep(-.6, .1, l1);
        float T = c * .8 + rim * .6;
        T = T * (1. - .75 * sh) + hi * smoothstep(-.4, -.06, l1) * .55;
        T += (abNoise(vWorldPos * .11) - .5) * .3 * c;
        vec3 col = abRampS(clamp(T, 0., .98), key, fp, 1.);
        float c2 = smoothstep(.05, .7, dot(n, uL2)) * (1. - sh);
        return mix(col, uInk[6], abSpray(c2 * .5, key, fp, 4.) * .8);
      }`;
    const moonU = { uCr: { value: craters }, uL1: { value: L1 }, uL2: { value: L2 }, uRift: { value: new THREE.Vector4(riftN.x, riftN.y, riftN.z, cracked ? 1 : 0) } };
    const moon = new THREE.Mesh(moonGeo, styleMaterial({ hero, uniforms: moonU, paint: /* glsl */`
      uniform vec4 uCr[36]; uniform vec4 uRift;
      ${moonLight}
      vec4 abPaint(){
        vec3 n = normalize(vNormal); vec3 d = normalize(vPos);
        vec2 key = vPos.xz + vPos.y * vec2(.37, -.61); float fp = max(max(fwidth(key.x), fwidth(key.y)), 1e-3);
        float fpd = max(length(fwidth(d)), 1e-5);
        float sh = 0., hi = 0.;
        for (int i = 0; i < 36; i++){
          vec4 cr = uCr[i]; vec3 q = d - cr.xyz; float dist = length(q) / cr.w;
          if (dist < 1.25){
            vec3 lt = uL1 - cr.xyz * dot(uL1, cr.xyz); lt /= max(length(lt), 1e-3);
            float al = dot(q, lt) / cr.w, pr2 = max(dist * dist - al * al, 0.), w = fpd / cr.w;
            float inside = 1. - abFrisket(dist - 1., w);
            sh = max(sh, inside * abFrisket(sqrt(pr2 + (al + .5) * (al + .5)) - 1., w));
            hi = max(hi, inside * abFrisket(sqrt(pr2 + (al - .45) * (al - .45)) - 1., w));
          }
        }
        vec3 col = abRock(n, sh, hi, key, fp);
        float dr = abs(dot(d, uRift.xyz) - .08) - .009 - .007 * abNoise(d * 9.);
        col = mix(col, mix(uInk[3], uInk[4], .5), uRift.w * (1. - abFrisket(dr, fpd)));
        col = mix(col, uInk[3], uRift.w * abSpray(abHalo(dr, .5) * 1.6, key, fp, 6.) * .7);
        return vec4(col, 1.);
      }` }));
    moon.position.copy(MC); moon.name = 'moonlet';
    scene.add(moon);
    await ctx.yield();

    // boulders on the limb we rake over (and a rubble train off the rift when the moonlet is cracked)
    {
      const bg = new THREE.IcosahedronGeometry(1, 1), bp = bg.attributes.position;
      for (let i = 0; i < bp.count; i++) {
        const x = bp.getX(i), y = bp.getY(i), z = bp.getZ(i), k = 1 + 0.32 * noise.n3(x * 1.7 + 3, y * 1.7, z * 1.7);
        bp.setXYZ(i, x * k, y * k * 0.75, z * k);
      }
      await ctx.yield();
      const nB = Math.round(300 * detail), nR = cracked ? 46 : 0;
      const bm = new THREE.InstancedMesh(bg, styleMaterial({ hero, uniforms: moonU, paint: /* glsl */`
        ${moonLight}
        vec4 abPaint(){
          vec3 n = normalize(cross(dFdx(vWorldPos), dFdy(vWorldPos)) + vec3(0., 1e-6, 0.));
          if (dot(n, vView) > 0.) n = -n;
          vec2 key = vWorldPos.xz + vWorldPos.y * vec2(.37, -.61); float fp = max(max(fwidth(key.x), fwidth(key.y)), 1e-3);
          return vec4(abRock(n, 0., step(.55, n.y) * .5, key, fp), 1.);
        }` }), nB + nR);
      const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), sc = new V3(), p = new V3();
      for (let i = 0; i < nB + nR; i++) {
        if (i < nB) {
          const a = bRng.range(0, Math.PI * 2), y = bRng.range(0.5, 0.995), s = Math.sqrt(1 - y * y), x = Math.cos(a) * s, z = Math.sin(a) * s;
          const size = bRng.range(1.2, 4.2) * (bRng() < 0.08 ? 2 : 1);
          const r = MR + moonH(x, y, z) + size * 0.3;
          p.set(MC.x + x * r, MC.y + y * r, MC.z + z * r);
          sc.setScalar(path.distanceTo(p.x, p.y, p.z) < 12 + size ? 0.001 : size);
        } else {
          const k = (i - nB) / nR, size = bRng.range(3, 13) * (1 - 0.6 * k);
          p.copy(MC).addScaledVector(riftN, 15).add(sc.set(-0.25, -0.45, -0.86).multiplyScalar(170 + k * 520));
          p.x += bRng.range(-30, 30) * (0.4 + k); p.y += bRng.range(-30, 30) * (0.4 + k); p.z += bRng.range(-20, 20);
          sc.setScalar(size);
        }
        q.setFromEuler(e.set(bRng.range(0, 6.28), bRng.range(0, 6.28), bRng.range(0, 6.28)));
        bm.setMatrixAt(i, m4.compose(p, q, sc));
        if (i % 40 === 39) await ctx.yield();
      }
      bm.frustumCulled = false; bm.name = 'boulders';
      scene.add(bm);
    }
    await ctx.yield();

    // ---- COMPANION STAR pulled into a teardrop, boiling in slow cells
    const SC = A.companion.clone(), tip = A.streamTip.clone();
    const tipDir = tip.clone().sub(SC).normalize();
    await ctx.yield();
    const star = new THREE.Mesh(new THREE.SphereGeometry(500, 56, 36), styleMaterial({ hero, disc: true, transparent: true,
      uniforms: { uTip: { value: tipDir } },
      vertex: /* glsl */`uniform vec3 uTip;
        vec3 abMove(vec3 p){ float k = max(dot(normalize(p), uTip), 0.); k *= k; k *= k; return p + uTip * 300. * k * k; }`,
      paint: UNDER_GLSL + /* glsl */`
        vec4 abPaint(){
          vec3 d = normalize(vPos);
          float mu = max(dot(normalize(vNormal), -normalize(vView)), 0.);
          vec2 key = vUv * vec2(3140., 1570.); float fp = max(max(fwidth(key.x), fwidth(key.y)), 1e-3);
          float n1 = abNoise(d * 5. + vec3(0., uTime * .09, 0.)), n2 = abNoise(d * 13. - vec3(uTime * .16, 0., uTime * .07));
          float cells = n1 * .65 + n2 * .35;
          float cm = abFrisket(cells - .5, max(fwidth(cells), 1e-4));          // frisket-cut granulation cells
          float T = .2 + .62 * pow(mu, .6) + (cm - .5) * .2 + (n2 - .5) * .15;
          vec3 dark = mix(uInk[0], uInk[6], .42);
          vec3 col = mix(dark, uInk[6], abSpray(clamp(T * 1.25, 0., 1.), key, fp, 2.));
          col = mix(col, vec3(1.), abSpray(clamp(T * 1.7 - .95, 0., 1.), key, fp, 5.) * .85);
          float a = abUnder(vWorldPos);
          if (a < .01) discard;
          return vec4(col, a);
        }` }));
    star.position.copy(SC); star.renderOrder = 1; star.name = 'companion';
    scene.add(star);
    await ctx.yield();

    // ---- STREAM (twisted strands pouring from the tip to the splash) and two prominences: camera-facing ribbons
    const S0 = tip.clone().addScaledVector(tipDir, 240).setY(30), S1 = new V3(600, 26, -1650), S2 = A.splash.clone().setY(5);
    {
      const lines = [], bez = (t, o) => o.set(0, 0, 0).addScaledVector(S0, (1 - t) * (1 - t)).addScaledVector(S1, 2 * t * (1 - t)).addScaledVector(S2, t * t);
      const c = new V3(), c2 = new V3(), tn = new V3(), nn = new V3();
      for (let s = 0; s < 13; s++) {
        if (s % 4 === 3) await ctx.yield();
        const pts = [];
        for (let i = 0; i <= 56; i++) {
          const t = i / 56; bez(t, c); bez(Math.min(t + 0.01, 1.01), c2);
          tn.subVectors(c2, c).normalize(); nn.set(-tn.z, 0, tn.x);
          const rho = s === 12 ? 0 : lerp(105, 20, Math.pow(t, 0.7)), ph = (s / 12) * Math.PI * 2 + t * 8.5;
          pts.push(c.clone().addScaledVector(nn, Math.cos(ph) * rho).add(new V3(0, Math.sin(ph) * rho * 0.5 + 45 * (1 - t), 0)));
        }
        lines.push({ pts, width: s === 12 ? 150 : 15, kind: s === 12 ? 1 : 0, seed: s / 13 });
      }
      for (let k = 0; k < 2; k++) {                  // prominences: arcs standing off the star's limb
        const pts = [], a0 = k ? 2.3 : 0.5, span = k ? 0.55 : 0.8, ax = new V3(k ? 0.2 : -0.3, 1, 0.1).normalize(), b0 = new V3(-1, 0, 0.35).normalize();
        for (let i = 0; i <= 36; i++) {
          const t = i / 36, d = b0.clone().applyAxisAngle(ax, a0 + (t - 0.5) * span).applyAxisAngle(new V3(1, 0, 0), k ? 0.5 : -0.35);
          pts.push(SC.clone().addScaledVector(d, 500 * (1 + (k ? 0.3 : 0.42) * Math.sin(Math.PI * t))));
        }
        lines.push({ pts, width: 34, kind: 2, seed: 0.3 + k * 0.4 });
      }
      await ctx.yield();
      const ribGeo = ribbonGeometry(lines);
      await ctx.yield();
      const rib = new THREE.Mesh(ribGeo, new THREE.ShaderMaterial({
        uniforms: SU, transparent: true, depthWrite: false, side: THREE.DoubleSide,
        vertexShader: /* glsl */`
          attribute vec3 aTan; attribute vec3 aDat; uniform float uTime;
          varying vec2 vUv2; varying vec3 vDat; varying vec3 vW;
          void main(){
            vec3 c = position;
            c.y += sin(uTime * .7 + uv.y * 9. + aDat.z * 20.) * 7. * step(aDat.y, .5);
            vec4 w = modelMatrix * vec4(c, 1.);
            vec3 toC = w.xyz - cameraPosition; float dist = max(length(toC), 1.);
            vec3 sd = cross(aTan, toC); sd /= max(length(sd), 1e-4);
            w.xyz += sd * uv.x * max(aDat.x, dist * .0026);
            vUv2 = uv; vDat = aDat; vW = w.xyz;
            gl_Position = projectionMatrix * viewMatrix * w;
          }`,
        fragmentShader: /* glsl */`
          precision highp float;
          varying vec2 vUv2; varying vec3 vDat; varying vec3 vW;
          ${STYLE_GLSL}
          ${DISC_GLSL}
          ${UNDER_GLSL}
          void main(){
            float u = vUv2.x, t = vUv2.y;
            vec2 key = vec2(u * vDat.x * .12, t * 320.) + vDat.z * 31.; float fp = max(max(fwidth(key.x), fwidth(key.y)), 1e-4);
            float fu = max(fwidth(u), 1e-4);
            float pulse = abNoise(vec3(t * 16. - uTime * 1.3, vDat.z * 9., 1.));
            float cov; vec3 col;
            if (vDat.y < .5){
              cov = abFrisket(.8 - u, fu) * smoothstep(-1., .2, u) * (.4 + .8 * pulse) * smoothstep(0., .04, t);
              col = mix(mix(uInk[6], uInk[5], smoothstep(0., .3, t)), mix(uInk[4], vec3(1.), .4), smoothstep(.7, 1., t) * .7 + .3 * pulse * pulse);
            } else if (vDat.y < 1.5){
              cov = (1. - u * u) * (.2 + .32 * pulse) * smoothstep(0., .1, t);
              col = mix(uInk[5], uInk[4], smoothstep(.6, 1., t) * .6);
            } else {
              cov = abFrisket(.75 - u, fu) * smoothstep(-1., .3, u) * (.5 + .6 * pulse) * sin(3.14159 * clamp(t, 0., 1.));
              col = mix(uInk[6], vec3(1.), .5 * pulse);
            }
            float a = abSpray(clamp(cov, 0., 1.), key, fp, 0.) * abUnder(vW);
            if (a < .004) discard;
            gl_FragColor = vec4(col, a);
          }`,
      }));
      rib.frustumCulled = false; rib.renderOrder = 1.5; rib.name = 'stream';
      scene.add(rib);
    }
    await ctx.yield();

    // ---- PUFFS: the splash fan throwing sprays that fall back, dust off the moonlet's limb, two under-spray halos
    {
      const nS = Math.round(260 * detail), nD = 90, N = nS + nD + 2;
      const aO = new Float32Array(N * 4), aV = new Float32Array(N * 4), aC = new Float32Array(N * 4);
      const sdir = new V3(S2.x - S1.x, 0, S2.z - S1.z).normalize();
      for (let i = 0; i < N; i++) {
        const k = i * 4;
        if (i < nS) {
          const per = pRng.range(4.5, 8), H = pRng.range(60, 400) * (pRng() < 0.3 ? 1 : 0.6), a = pRng.range(0, Math.PI * 2), vr = pRng.range(4, 44);
          aO.set([S2.x + pRng.range(-60, 60), 2, S2.z + pRng.range(-60, 60), pRng()], k);
          aV.set([Math.cos(a) * vr + sdir.x * 14, 4 * H / per, Math.sin(a) * vr + sdir.z * 14, per], k);
          aC.set([pRng.range(16, 30), pRng.range(40, 78), 8 * H / (per * per), pRng()], k);
        } else if (i < nS + nD) {
          const a = pRng.range(0, Math.PI * 2), y = pRng.range(0.45, 0.98), s = Math.sqrt(1 - y * y), r = MR + 14;
          aO.set([MC.x + Math.cos(a) * s * r, MC.y + y * r, MC.z + Math.sin(a) * s * r, pRng()], k);
          aV.set([Math.cos(a) * s * 3 + 2.5, y * pRng.range(2, 6), Math.sin(a) * s * 3, pRng.range(7, 13)], k);
          aC.set([1.5, pRng.range(5, 10), 0, 1 + pRng() * 0.99], k);
        } else if (i === nS + nD) { aO.set([SC.x, SC.y, SC.z, 0], k); aV.set([0, 0, 0, 1e6], k); aC.set([1050, 1050, 0, 2.5], k); }
        else { aO.set([S2.x, 40, S2.z, 0], k); aV.set([0, 0, 0, 1e6], k); aC.set([520, 520, 0, 3.5], k); }
      }
      const g = new THREE.InstancedBufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3));
      g.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, 1, 0, 1, 1, 0, 1], 2));
      g.setIndex([0, 1, 2, 0, 2, 3]);
      g.setAttribute('aO', new THREE.InstancedBufferAttribute(aO, 4));
      g.setAttribute('aV', new THREE.InstancedBufferAttribute(aV, 4));
      g.setAttribute('aC', new THREE.InstancedBufferAttribute(aC, 4));
      g.instanceCount = N;
      const puffs = new THREE.Mesh(g, new THREE.ShaderMaterial({
        uniforms: SU, transparent: true, depthWrite: false,
        vertexShader: /* glsl */`
          attribute vec4 aO; attribute vec4 aV; attribute vec4 aC; uniform float uTime;
          varying vec2 vUv2; varying vec4 vK; varying vec3 vW;
          void main(){
            float ph = fract(uTime / aV.w + aO.w), tau = ph * aV.w;
            vec3 c = aO.xyz + aV.xyz * tau - vec3(0., .5 * aC.z * tau * tau, 0.);
            float size = mix(aC.x, aC.y, ph);
            vec4 mv = viewMatrix * vec4(c, 1.);
            mv.xy += position.xy * size;
            vW = c; vUv2 = uv; vK = vec4(ph, fract(aC.w), floor(aC.w), size);
            gl_Position = projectionMatrix * mv;
          }`,
        fragmentShader: /* glsl */`
          precision highp float;
          varying vec2 vUv2; varying vec4 vK; varying vec3 vW;
          ${STYLE_GLSL}
          ${DISC_GLSL}
          ${UNDER_GLSL}
          void main(){
            vec2 q = vUv2 * 2. - 1.; float r = length(q);
            vec2 key = q * vK.w * .3 + vK.y * 57.; float fp = max(max(fwidth(key.x), fwidth(key.y)), 1e-4);
            float cov; vec3 col;
            if (vK.z < .5){
              float c0 = max(1. - r * r, 0.);
              cov = c0 * sqrt(c0) * (.22 + .6 * sin(3.14159 * vK.x));
              col = mix(uInk[5], mix(uInk[4], vec3(1.), .5), clamp(cov * 1.7 + .35 * (1. - vK.x), 0., 1.));
            } else if (vK.z < 1.5){
              float c0 = max(1. - r * r, 0.);
              cov = -c0 * c0 * .2 * sin(3.14159 * vK.x);
              col = mix(uInk[3], uInk[4], .3);
            } else {
              cov = .36 * exp(-r * 3.2) * (1. - smoothstep(.8, 1., r));
              col = vK.z < 2.5 ? uInk[6] : mix(uInk[5], uInk[4], .6);
            }
            float a = (cov < 0. ? abSpeck(-cov, key, fp, 0.) * .8 : abSpray(cov, key, fp, 0.)) * abUnder(vW);
            if (a < .004) discard;
            gl_FragColor = vec4(col, a);
          }`,
      }));
      puffs.frustumCulled = false; puffs.renderOrder = 0.5; puffs.name = 'puffs';
      scene.add(puffs);
    }
    await ctx.yield();

    // ---- SHIP: the chrome wedge we ride, posed every frame from the camera given to update()
    const shipU = { uUnder: { value: 0 } };
    const chromeMat = styleMaterial({ hero, uniforms: shipU, paint: SHIP_PAINT, side: THREE.DoubleSide });
    await ctx.yield();
    const ship = new THREE.Mesh(await wedgeGeometry(true, () => ctx.yield()), chromeMat);
    ship.frustumCulled = false; ship.renderOrder = 6; ship.name = 'ship';
    scene.add(ship);
    await ctx.yield();

    // ---- WINGMEN (one to three by seed) and the wake the first one scores in the lanes
    const wingGeo = await wedgeGeometry(false, () => ctx.yield()), wings = [];
    for (let k = 0; k < nWing; k++) {
      const w = new THREE.Mesh(wingGeo, chromeMat);
      w.frustumCulled = false; w.renderOrder = 5; w.name = 'wingman';
      w.userData = { ahead: [120, 215, 300][k], left: [34, 104, 70][k], up: [-16, 4, 24][k], ph: k * 2.1 };
      scene.add(w); wings.push(w);
    }
    const WAKE_U0 = 0.4, WAKE_U1 = 0.82, wakeU = { uWakeS: { value: -1e4 } };
    {
      const pos = [], uvs = [], idx = [], p = new V3(), t = new V3(), NS = 150;
      for (let i = 0; i <= NS; i++) {
        const uu = lerp(WAKE_U0, WAKE_U1, i / NS); path.pointAt(uu, p); path.tangentAt(uu, t);
        const lx = t.z, lz = -t.x, ll = Math.hypot(lx, lz) || 1, s = (uu - WAKE_U0) * path.length;
        for (const sd of [-1, 1]) { pos.push(p.x + (lx / ll) * (34 + sd * 9), 2.5, p.z + (lz / ll) * (34 + sd * 9)); uvs.push(sd, s); }
        if (i < NS) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
      g.setAttribute('normal', new THREE.Float32BufferAttribute(new Float32Array(pos.length).fill(0).map((v, i) => (i % 3 === 1 ? 1 : 0)), 3));
      g.setIndex(idx);
      await ctx.yield();
      const wake = new THREE.Mesh(g, styleMaterial({ hero, uniforms: wakeU, transparent: true, depthWrite: false, side: THREE.DoubleSide, paint: /* glsl */`
        uniform float uWakeS;
        vec4 abPaint(){
          float back = uWakeS - vUv.y;
          vec2 key = vec2(vUv.x * 9., vUv.y); float fp = max(max(fwidth(key.x), fwidth(key.y)), 1e-3);
          // a ragged furrow: it wanders and swells along its length, fades at both edges, and is spray all through
          float wob = abNoise(vec3(vUv.y * .043, 3., 1.)) - .5, wid = .5 + .5 * abNoise(vec3(vUv.y * .11, 7., 2.));
          float x = (vUv.x - wob * .55) / wid;
          float w = max(1. - x * x, 0.); w *= w;
          float on = step(0., back), tear = abNoise(vec3(vUv.y * .19, vUv.x * 2.5, uTime * .5));
          float cov = on * exp(-max(back, 0.) / 330.) * w * (.3 + .75 * tear);
          float core = on * exp(-x * x * 26.) * exp(-max(back, 0.) / 150.) * smoothstep(.3, .75, abNoise(vec3(vUv.y * .31, 1., uTime * .7)));
          return vec4(mix(mix(uInk[3], uInk[4], .7), vec3(1.), core * .6), abSpray(max(cov * .85, core * .7), key, fp, 0.));
        }` }));
      wake.frustumCulled = false; wake.renderOrder = 1.8; wake.name = 'wake';
      scene.add(wake);
    }
    await ctx.yield();

    // ---- MOTES: overspray streaking past, wrapped round whichever camera is drawing
    const moteU = { uTime: SU.uTime, uInk: SU.uInk, uStreak: { value: new V3(1, 0, 0) }, uBurst: { value: 0 } };
    {
      const N = Math.round(1700 * detail), aB = new Float32Array(N * 3), aR = new Float32Array(N * 4);
      for (let i = 0; i < N; i++) { aB.set([mRng(), mRng(), mRng()], i * 3); aR.set([mRng(), mRng(), mRng(), mRng()], i * 4); }
      await ctx.yield();
      const g = new THREE.InstancedBufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3));
      g.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, 1, 0, 1, 1, 0, 1], 2));
      g.setIndex([0, 1, 2, 0, 2, 3]);
      g.setAttribute('aB', new THREE.InstancedBufferAttribute(aB, 3));
      g.setAttribute('aR', new THREE.InstancedBufferAttribute(aR, 4));
      g.instanceCount = N;
      const motes = new THREE.Mesh(g, new THREE.ShaderMaterial({
        uniforms: moteU, transparent: true, depthWrite: false, side: THREE.DoubleSide,
        vertexShader: /* glsl */`
          attribute vec3 aB; attribute vec4 aR; uniform float uTime; uniform vec3 uStreak; uniform float uBurst;
          varying vec2 vUv2; varying vec3 vK;
          void main(){
            vec3 box = vec3(150., 80., 150.);
            vec3 p = aB * box + uTime * (vec3(aR.x - .5, (aR.y - .5) * .4, aR.z - .5) * 7.);
            vec3 rel = mod(p - cameraPosition, box) - box * .5;
            float dist = max(length(rel), .01);
            float sl = length(uStreak);
            vec3 ds = sl > 1e-3 ? uStreak / sl : vec3(0., 1., 0.);
            vec3 sd = cross(ds, rel); sd /= max(length(sd), 1e-4);
            float big = step(aR.w, .1 + .9 * uBurst);
            float w = max((.03 + .07 * aR.y) * (1. + 1.4 * uBurst), dist * .0013) * (.6 + .4 * big);
            float len = max(sl * (.5 + aR.x), w * 2.5);
            vec3 wp = cameraPosition + rel + ds * position.y * len * .5 + sd * position.x * w;
            float fade = smoothstep(1.2, 3.5, dist) * (1. - smoothstep(52., 74., dist)) * mix(step(aR.w, .55), 1., uBurst);
            vUv2 = uv; vK = vec3(aR.z, fade, uBurst);
            gl_Position = fade > 0. ? projectionMatrix * viewMatrix * vec4(wp, 1.) : vec4(2., 2., 2., 1.);
          }`,
        fragmentShader: /* glsl */`
          precision highp float;
          uniform vec3 uInk[7];
          varying vec2 vUv2; varying vec3 vK;
          void main(){
            float x = abs(vUv2.x * 2. - 1.), y = vUv2.y;
            float tp = max(sin(3.14159 * y), 0.); tp = tp * (.4 + .6 * y);
            float a = 1. - smoothstep(.45 * tp, tp + .02, x);
            vec3 col = vK.x < .12 ? uInk[5] : (vK.x < .24 ? uInk[2] : mix(uInk[4], vec3(1.), .35 * vK.z));
            gl_FragColor = vec4(col, a * vK.y * .9);
          }`,
      }));
      motes.frustumCulled = false; motes.renderOrder = 7; motes.name = 'motes';
      scene.add(motes);
    }
    await ctx.yield();

    // ---- HOOP round the exit (chrome, inner radius 8.5, tube 0.9) and the ruled glints: four on the hoop, two far ships
    const exitDir = A.exitDir.clone();
    await ctx.yield();
    const hoop = new THREE.Mesh(new THREE.TorusGeometry(9.4, 0.9, 14, 72), styleMaterial({ hero, paint: CHROME_GLSL + /* glsl */`
      vec4 abPaint(){
        vec3 n = normalize(vNormal);
        vec2 key = vUv * vec2(1400., 130.); float fp = max(max(fwidth(key.x), fwidth(key.y)), 1e-3);
        vec3 col = abChromeWorld(n, key, fp);
        col = mix(col, uInk[3], (1. - smoothstep(-.8, .1, n.y)) * .55);            // the underside catches the disc
        return vec4(col, 1.);
      }` }));
    hoop.position.copy(portalPos).addScaledVector(exitDir, 0.3);
    hoop.quaternion.setFromUnitVectors(new V3(0, 0, 1), exitDir);
    hoop.name = 'hoop';
    scene.add(hoop);
    // a sprayed halo of the portal's colour, 40 m across, standing behind the hoop: empty inside the hoop, so it
    // never covers the opening, thinning outward into separate specks on the black
    const haloM = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), styleMaterial({ hero, transparent: true, depthWrite: false, side: THREE.DoubleSide,
      uniforms: { uPortalCol: { value: new THREE.Color(portalColor) } }, paint: /* glsl */`
      uniform vec3 uPortalCol;
      vec4 abPaint(){
        float r = length(vPos.xy), d = r - 10.2;
        vec2 key = vPos.xy * 5.; float fp = max(max(fwidth(key.x), fwidth(key.y)), 1e-4);
        float ang = atan(vPos.y, vPos.x + 1e-4);
        float rays = .75 + .25 * abNoise(vec3(ang * 5., uTime * .6, 3.));
        float cov = step(0., d) * .62 * exp(-max(d, 0.) / 2.7) * rays * (1. - smoothstep(13., 20., r));
        float a = mix(abSpeck(cov * 1.7, key, fp, 0.), abSpray(cov, key, fp, 0.), smoothstep(.1, .3, cov));   // closed up at the hoop, separate specks further out
        if (a < .004) discard;
        return vec4(mix(uPortalCol, vec3(1.), .3 * smoothstep(.3, .6, cov)), a * .92);
      }` }));
    haloM.position.copy(portalPos).addScaledVector(exitDir, 1.6);
    haloM.quaternion.setFromUnitVectors(new V3(0, 0, 1), exitDir);
    haloM.renderOrder = 1.9; haloM.name = 'hoop-halo';
    scene.add(haloM);
    const hr = new V3().crossVectors(exitDir, new V3(0, 1, 0)).normalize(), hu = new V3().crossVectors(hr, exitDir).normalize();
    const gl = [0, 1, 2, 3, 4, 5].map(() => new THREE.Vector4(0, 0, 0, 1));
    [[hr, 1], [hr, -1], [hu, 1], [hu, -1]].forEach(([d, s], i) => { const p = portalPos.clone().addScaledVector(d, s * 9.4 * 0.72).addScaledVector(i < 2 ? hu : hr, 9.4 * 0.69 * (i % 2 ? -1 : 1) * (i < 2 ? 1 : -1)); gl[i].set(p.x, p.y, p.z, 3.4); });
    const glU = { uGl: { value: gl }, uInk: SU.uInk, uTurn: { value: 0 } };
    {
      const g = new THREE.InstancedBufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3));
      g.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, 1, 0, 1, 1, 0, 1], 2));
      g.setIndex([0, 1, 2, 0, 2, 3]);
      g.setAttribute('aIdx', new THREE.InstancedBufferAttribute(new Float32Array([0, 1, 2, 3, 4, 5]), 1));
      g.instanceCount = 6;
      const glints = new THREE.Mesh(g, new THREE.ShaderMaterial({
        uniforms: glU, transparent: true, depthWrite: false, depthTest: true,
        vertexShader: /* glsl */`
          attribute float aIdx; uniform vec4 uGl[6]; uniform float uTurn;
          varying vec2 vQ; varying float vPx;
          void main(){
            vec4 g = uGl[int(aIdx + .5)];
            vec4 mv = viewMatrix * vec4(g.xyz, 1.);
            float dist = max(-mv.z, 1.), size = max(g.w, dist * (aIdx < 3.5 ? .035 : .022));   // the four on the hoop stay a jewel from afar
            float a = uTurn + aIdx * .7, c = cos(a), s = sin(a);
            vQ = vec2(c * position.x + s * position.y, -s * position.x + c * position.y);
            vPx = dist * .0016 / size;
            mv.xy += position.xy * size; mv.z += min(size, 3.);
            gl_Position = projectionMatrix * mv;
          }`,
        fragmentShader: /* glsl */`
          precision highp float;
          uniform vec3 uInk[7];
          varying vec2 vQ; varying float vPx;
          void main(){
            vec2 ax = abs(vQ);
            float r1 = (1. - smoothstep(0., .06 * max(1. - ax.x, 0.) + vPx, ax.y)) * max(1. - ax.x, 0.);
            float r2 = (1. - smoothstep(0., .06 * max(1. - ax.y / .7, 0.) + vPx, ax.x)) * max(1. - ax.y / .7, 0.);
            float core = 1. - smoothstep(.05, .12 + vPx, length(vQ));
            float a = clamp(max(max(r1, r2), core) + .22 * exp(-length(vQ) * 7.), 0., 1.);
            gl_FragColor = vec4(mix(uInk[4], vec3(1.), .55), a);
          }`,
      }));
      glints.frustumCulled = false; glints.renderOrder = 8; glints.name = 'glints';
      scene.add(glints);
    }
    await ctx.yield();

    // ---- POIS: the hole through the dive and the skim, then the hoop
    const pois = [
      { at: new V3(0, 40, 0), from: 0.07, to: 0.26, weight: 0.45 },      // the reveal (5.5 s): the whole disc inside the frame
      { at: new V3(0, 40, 0), from: 0.10, to: 0.8, weight: 0.6 },
      { at: portalPos.clone(), from: 0.8, to: 1, weight: 0.5 },
    ];

    // --------------------------------------------------------------------------------------------- 4 update
    const cp = new V3(), tg = new V3(), t0 = new V3(), t1 = new V3(), wp = new V3(), UP = new V3(0, 1, 0), ZERO = new V3();
    const m4 = new THREE.Matrix4(), qr = new THREE.Quaternion(), ZAX = new V3(0, 0, 1);
    const L = path.length;
    // where a camera standing at the very start of the path carries the ship: its first point, and the engine's
    // opening gaze (toward the point one look-ahead down the line)
    const P0 = path.pointAt(0, new V3()), G0 = path.pointAt(Math.min(50 / L, 1), new V3()).sub(P0).normalize();
    const gz = new V3(), hd = new V3(), HULL_GAZE = 0.75, HULL_MAX = 9 * Math.PI / 180;
    const pose = (obj, pos, dir, roll) => {
      m4.lookAt(ZERO, dir, UP); obj.quaternion.setFromRotationMatrix(m4);
      obj.quaternion.multiply(qr.setFromAxisAngle(ZAX, roll)); obj.position.copy(pos);
    };
    function update(dt, time, camera, u) {
      u = clamp(u ?? 0, 0, 1);
      const ts = tOfU(u);
      hero.setProgress(u);
      hero.setEinstein(vary.rare ? smoothstep(30, 35, ts) * (1 - smoothstep(38, 40.5, ts)) : 0);
      hero.update(dt, time, camera);
      // the ship: the nose follows the GAZE (so it stays in the bottom fifth through the dive, the hook and the
      // climb) with a quarter of the line of flight a little late, rolling into turns, shivering at the skim.
      // While u is exactly 0 the world is being drawn through the previous world's portal by the portal's camera,
      // and the engine cuts away what lies on the near side of the portal's plane: the ship is then PARKED at the
      // start of the path, still and whole, exactly where the arriving camera will carry it.
      if (u > 0) {
        cp.setFromMatrixPosition(camera.matrixWorld);
        gz.setFromMatrixColumn(camera.matrixWorld, 2).negate();
        if (gz.lengthSq() < 1e-8) gz.copy(G0);
        gz.normalize().lerp(G0, 1 - smoothstep(0, 0.012, u)).normalize();
      } else { cp.copy(P0); gz.copy(G0); }
      path.tangentAt(clamp(u - 0.004, 0, 1), tg);
      hd.copy(tg).lerp(gz, HULL_GAZE).normalize();
      const off = Math.acos(clamp(hd.dot(gz), -1, 1));
      if (off > HULL_MAX) hd.lerp(gz, 1 - HULL_MAX / off).normalize();
      path.tangentAt(clamp(u - 0.014, 0, 1), t0); path.tangentAt(clamp(u + 0.01, 0, 1), t1);
      const turn = t0.z * t1.x - t0.x * t1.z;
      const skim = smoothstep(0.42, 0.47, u) * (1 - smoothstep(0.76, 0.82, u));
      const shiver = skim * (0.5 + 0.5 * Math.sin(time * 2.3));
      cp.y += shiver * 0.03 * Math.sin(time * 43) + 0.05 * Math.sin(time * 1.1);
      shipU.uUnder.value = smoothstep(0.835, 0.9, u);
      pose(ship, cp, hd, clamp(-turn * 1.6, -0.07, 0.07) + shiver * 0.004 * Math.sin(time * 37));
      // motes streak with our speed; under the spray cone they come thick and coarse
      path.tangentAt(u, t0);
      moteU.uStreak.value.copy(t0).multiplyScalar(speedAt(u) * 0.045);
      const dc = (ts - 20) / 1.6;
      moteU.uBurst.value = Math.exp(-dc * dc);
      // wingmen: slide in at 12 s, fly ahead-left through the skim, peel away left from 27 s
      const sIn = smoothstep(9.5, 13, ts), pe = smoothstep(26.5, 32, ts), on = ts > 9.2 && ts < 33;
      for (const w of wings) {
        const d = w.userData;
        w.visible = on;
        const uw = clamp(u + (lerp(-40, d.ahead, sIn) + pe * 150) / L, 0, 1);
        path.pointAt(uw, wp); path.tangentAt(uw, t1);
        const lx = t1.z, lz = -t1.x, ll = Math.hypot(lx, lz) || 1, left = lerp(d.left + 150, d.left, sIn) + pe * pe * 520;
        wp.x += (lx / ll) * left; wp.z += (lz / ll) * left;
        wp.y = Math.max(wp.y + lerp(60, d.up, sIn) + pe * pe * 170 + 1.2 * Math.sin(time * 1.7 + d.ph), 13);
        t1.x += (lx / ll) * pe * 0.9; t1.z += (lz / ll) * pe * 0.9; t1.y += pe * 0.25; t1.normalize();
        pose(w, wp, t1, pe * 0.95 + 0.06 * Math.sin(time * 1.3 + d.ph));
      }
      const d0 = wings[0].userData;
      wakeU.uWakeS.value = on && sIn > 0.6 ? (u - WAKE_U0) * L + d0.ahead + pe * 150 - 34 - pe * 4000 : -1e4;
      // the far ships: ruled glints crossing the far side of the disc
      const a1 = -1.0 + ((time * 0.035) % 2.0), a2 = 1.9 - ((time * 0.028 + 0.8) % 2.2);
      gl[4].set(Math.cos(a1) * 1280, 70, Math.sin(a1) * 1280, 16);
      gl[5].set(Math.cos(a2) * 980, 150, Math.sin(a2) * 980 - 500, 12);
      glU.uTurn.value = 0.0009 * (cp.x + cp.z * 0.7) + 0.05 * time;
    }
    update(0, 0, { matrixWorld: new THREE.Matrix4().setPosition(path.pointAt(0, new V3())) }, 0);

    return {
      scene, path, duration: DUR, pace: paceRaw,
      title: edition === 'cadmium' ? 'The Airbrushed Abyss' : edition === 'violet' ? 'The Airbrushed Abyss (violet edition)' : 'The Airbrushed Abyss (verdigris edition)',
      ride: 'none', style: 'none',
      camera: { fov: 70, near: 0.5, far: 7000, lookAhead: 50, sway: 0.6, bank: 0.8 },
      pois,
      portal: { shape: 'circle', radius: 8, color: portalColor, glow: 0.5, tilt: true, revealDistance: 700 },
      post: { exposure: 1, flat: 1, bloom: { strength: 0, radius: 0.5, threshold: 1 },
        grade: { saturation: 1, contrast: 1, tint: '#ffffff', shadowTint: '#000000', vignette: 0, grain: 0, aberration: 0 } },
      update,
      dispose() { hero.dispose(); },
    };
  },
};
