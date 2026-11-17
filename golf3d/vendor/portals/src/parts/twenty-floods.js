// TWENTY FLOODS: hero set piece. The Great Pyramid assembling itself, then closing white.
//
// WHAT IT IS
//   A 230 m x 146 m pyramid that builds from a pale three-course foundation: stepped honey-limestone
//   courses pop up block by block (each course is laid in a sweep round its perimeter, so the top
//   edge is a moving sawtooth), a mud-brick zigzag ramp (11 legs + a ground causeway) grows up the
//   SOUTH face (+Z) in step with the top course and carries a two-way stream of sledge teams, a twin
//   electrum capstone is lowered on with one eased glint, then a hard-edged casing line descends all
//   four faces turning the steps into smooth white planes while the ramp is unbuilt below the line
//   and the block yards on the ground are cleared. A y-flipped mirror copy (low-detail core, casing,
//   ramp, capstone) is included for the flood reflection.
//
// ORIENTATION / SIZE
//   Origin at the base centre, +Y up. Front = +Z = the south (ramp) face; +X = the east face.
//   Base half-width 115 m, apex at y = 146. radius 165 (base diagonal), height 146. The ground
//   causeway and block yards reach out to z = +215: keep the plateau flat (y = 0) to r ~ 235 on +Z.
//
// PROGRESS (never wall-clock)
//   hero.setProgress(u, years)  path u 0..1 with the brief's schedule: five courses stand at the entry and the
//                        rest rise with the world's calendar (years 0..1: 0 until its first year begins, 1 in
//                        the year the last course is laid, which falls at u 0.60 = schedule.courses; without
//                        years they rise evenly from the entry), capstone + glint u 0.60-0.645, casing line
//                        reaches the ground at u 0.83. Also sets the long-exposure smear of the sledge stream.
//   hero.setBuild(b)     direct control instead: b 0..1 = courses (3 -> all), 1..1.12 = capstone
//                        lowered (glint), 1.12..2 = casing line top -> ground (ramp unbuilt).
//   hero.setSmear(s)     0 = discrete sledge teams (real time), 1 = long-exposure streaks.
//   hero.setGlint(g)     extra capstone flash 0..1 (e.g. answer the capstone on the bow at the end).
//   hero.setMirror(opacity, y)  mirror copy opacity (0 hides it) and water plane height (local y).
//   Until setProgress/setBuild is called the piece stands finished (b = 2); in the _part viewer it
//   demos the build as a function of the orbit angle (or ?heroB=1.4 fixes it).
//
// OPTS
//   palette      brief palette (hex strings): [sky, casing, honey limestone, mud brick, green, violet, electrum]
//   density      1    scales sledge teams and block yards (also scaled by ctx.quality.detail)
//   rampSide     +1/-1 which corner the ramp starts from (default seeded)
//   mirror       true  build the reflection copy;  mirrorY -30 (water level relative to the base);
//                mirrorOpacity 0.6;  mirrorTint '#8fb0c0';  mirrorRipple 0.5 (m of wobble)
//   dust         0.9  opacity of the dust banner off the working top;  wind +1/-1 (its x direction, seeded)
//   blaze        3.0  extra gain on casing/capstone when the first DirectionalLight strikes square
//
// ANCHORS (local space)
//   apex, capstone          summit point / capstone centre (star arcs, glint, look-at)
//   lookAt                  good POI for the gaze (0, 62, 0)
//   corners[4], apexShadow  base corners + apex for the analytic ground-shadow triangle test
//   rampPoints[13]          the causeway + ramp polyline (inner edge of the road), rampFoot, trackStart
//   southNormal, eastNormal outward face normals (for timing the "blaze")
//   viewpoints.entry/.exit  where the brief's barge is at u=0 and u=1 (camera 3.4 m over water at
//                           y = mirrorY), bargeHeading = unit direction of travel. No portalSeat or
//                           flyThrough: the camera never comes nearer than 400 m and the portal sits
//                           in the world's water gate. mirrorY echoes the reflection plane.
//
// COST  about 79k triangles, 12 draw calls (core, casing, ramp, capstone, site, sledge teams, dust
//   banner, glint flare + 4 mirror), no lights, no textures, ~60 ms build (await ctx.yield() x3).
//   Viewed alone and unprogressed it is nearly still (sledge stream + dust only): the motion is the
//   build itself, so drive setProgress(u) every frame.
//
// LIGHTING  MeshStandardMaterial (patched) throughout, so it takes the scene's lights and fog as
//   they are: one DirectionalLight (the racing sun, intensity 2.5-3.5) + a HemisphereLight fill.
//   The casing and capstone get an extra pow(N.L, 8) gain from directionalLights[0], which is what
//   makes a face blaze (and bloom) when the sun crosses it square; keep the sun as light 0.
//   The mirror copy is transparent, depthWrite off, BackSide; draw it before the water surface.
//
// STYLE (long exposure): slow things are crisp geometry; the only fast thing here, the sledge
//   stream, is drawn as instanced boxes stretched along their own path by uSmear (x3.5 length) with
//   their dot pattern averaged out, flowing in the vertex shader, so it reads as a pale thread.
import * as THREE from 'three';
import { clamp, lerp, smoothstep } from '../kit/core.js';

const DEFAULT_PALETTE = ['#6FB4E0', '#F6EFE0', '#D9A95B', '#8C5A32', '#2FA36B', '#4B3A7A', '#FFD25A'];
const HW = 115, H = 146, NP = 13;

// ---------------------------------------------------------------- shader patches
const V_PARS = /* glsl */`
uniform float uCourse, uLineY, uRampHead, uTime, uFlow, uSmear, uCap, uSite, uSide, uRoadW, uDustY, uWind;
uniform vec4 uDim;      // half width, height, capstone base y, course height
uniform vec3 uMirror;   // unused, plane y, ripple
uniform vec3 uRamp[${NP}];
attribute vec4 aD;
varying vec3 vLp; varying vec4 vD; varying vec3 vNl;
vec3 rampAt(float s){ s = clamp(s, 0.0, 11.999); int k = int(s); return mix(uRamp[k], uRamp[k + 1], s - float(k)); }
`;
const V_NORMAL = /* glsl */`
vec3 objectNormal = vec3(normal);
#ifdef K_TEAM
  float tUp = step(0.0, aD.y);
  float tPh = fract(aD.x + uFlow*(0.016 + 0.008*aD.z)*(tUp*2.0 - 1.0));
  float tS = clamp(tPh*uRampHead, 0.0, 11.999);
  int tK = int(tS);
  vec3 tA = uRamp[tK], tB = uRamp[tK + 1];
  vec3 tDir = normalize(tB - tA + vec3(1e-4, 0.0, 0.0));
  vec3 tAx = tK == 0 ? vec3(uSide, 0.0, 0.0) : vec3(0.0, 0.0, 1.0);
  objectNormal = normalize(tDir*normal.x + vec3(0.0, 1.0, 0.0)*normal.y + tAx*normal.z);
#endif
vNl = objectNormal;
#ifdef K_MIRROR
  objectNormal = -objectNormal;
#endif
`;
const V_BEGIN = /* glsl */`
vec3 transformed = vec3(position);
vD = aD;
#ifdef K_CORE
  float cRise = smoothstep(0.0, 1.0, clamp((uCourse - aD.x)*2.2 - aD.z*1.2, 0.0, 1.0));
  transformed.y -= aD.y*(1.0 - cRise);
  if (cRise < 1e-3) transformed = vec3(0.0, 0.2, 0.0);
  vD = vec4(aD.x, aD.y > 1e-4 ? 1.0 : 0.0, cRise, aD.w);
#endif
#ifdef K_CASING
  float cy = aD.z > 0.5 ? clamp(uLineY, 0.0, uDim.z) : uDim.z;
  float chw = uDim.x*(1.0 - cy/uDim.y) - aD.w*3.0*smoothstep(0.0, 2.0, uDim.z - cy);
  transformed = vec3(aD.x*chw, cy - aD.w*0.05, aD.y*chw);
#endif
#ifdef K_RAMP
  transformed += rampAt(min(aD.x, uRampHead)) - rampAt(aD.x);
#endif
#ifdef K_SITE
  float sk = aD.w > 0.5 ? smoothstep(aD.z, aD.z + 0.12, uSite) : 1.0;
  transformed.xz = aD.xy + (transformed.xz - aD.xy)*sk; transformed.y *= sk;
#endif
#ifdef K_CAP
  transformed.xz *= smoothstep(0.0, 0.25, uCap);
  transformed.y += (1.0 - uCap)*(1.0 - uCap)*16.0;
#endif
#ifdef K_TEAM
  vec3 tC = mix(tA, tB, tS - float(tK));
  float tW = uRoadW*mix(1.0, 0.5, clamp(tC.y/uDim.y, 0.0, 1.0));
  float tLane = tUp > 0.5 ? 0.30 + 0.16*aD.z : 0.70 + 0.10*aD.z;
  float tLen = (tUp > 0.5 ? 3.6 : 2.6)*(1.0 + uSmear*2.5);
  // seen from far off a team is widened so the column never thins below a pixel or two: it reads as a thread of ants
  float tWide = clamp(length((modelViewMatrix*vec4(tC, 1.0)).xyz)/300.0, 1.0, 3.0);
  transformed = tC + tDir*(position.x*tLen) + vec3(0.0, position.y*(tUp > 0.5 ? 1.7 : 1.0)*tWide + 0.05, 0.0)
              + tAx*(tLane*tW + position.z*(tUp > 0.5 ? 2.2 : 1.3)*tWide);
  if (aD.w*12.0 > uRampHead) transformed = vec3(0.0, -4.0, 0.0);
  vD = vec4(position.x, tUp, aD.z, position.y);
#endif
#ifdef K_DUST
  float du = position.x, dv = position.y;
  float dW = mix(6.0, 34.0, pow(max(du, 0.0), 0.7));
  float dLift = 20.0*du*du + 5.0*sin(du*7.0 - uTime*0.6)*du;
  transformed = vec3(uWind*du*130.0, uDustY + 2.0 + dLift + dv*dW, sin(du*5.0 - uTime*0.4)*8.0*du);
  vD = vec4(du, dv, 0.0, 0.0);
#endif
vLp = transformed;
#ifdef K_MIRROR
  transformed.y = 2.0*uMirror.y - transformed.y;
  float mDep = uMirror.y - transformed.y;
  float mAmp = uMirror.z*smoothstep(0.0, 50.0, mDep);
  transformed.x += sin(mDep*0.23 + uTime*1.7)*mAmp;
  transformed.z += cos(mDep*0.19 + uTime*1.3)*mAmp;
#endif
`;
const F_PARS = /* glsl */`
uniform float uCourse, uLineY, uTime, uGlint, uSmear, uGranite, uSeed, uBlaze, uDust;
uniform vec4 uDim;
uniform vec3 uMirrorTint, cCasing, cHoney, cMud, cShade, cGold;
varying vec3 vLp; varying vec4 vD; varying vec3 vNl;
float h21(vec2 p){ p = fract(p*vec2(123.34, 345.45)); p += dot(p, p + 34.345); return fract(p.x*p.y); }
float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0 - 2.0*f);
  return mix(mix(h21(i), h21(i + vec2(1.0, 0.0)), f.x), mix(h21(i + vec2(0.0, 1.0)), h21(i + 1.0), f.x), f.y); }
float fbm(vec2 p){ return vn(p)*0.5 + vn(p*2.03 + 7.1)*0.3 + vn(p*4.1 + 3.7)*0.2; }
`;
const F_COLOR = /* glsl */`
#include <color_fragment>
{
  vec3 nl = normalize(vNl);
  float fu = abs(nl.x) > abs(nl.z) ? vLp.z : vLp.x;
  vec3 c = vec3(1.0);
#ifdef K_CORE
  float ci = vD.x, rowH = uDim.w*0.5, row = floor(vLp.y/rowH);
  float bx = fu/2.7 + h21(vec2(row, ci))*7.0;
  float aa = clamp(1.0 - fwidth(fu)/1.2, 0.0, 1.0);
  float tone = h21(vec2(floor(bx), row + uSeed));
  float joint = max(smoothstep(0.43, 0.5, abs(fract(bx) - 0.5)), smoothstep(0.42, 0.5, abs(fract(vLp.y/rowH) - 0.5)));
  float stain = fbm(vec2(fu*0.021 + uSeed, vLp.y*0.034));
  float streak = fbm(vec2(fu*0.12, vLp.y*0.013 + uSeed*3.0));
  c = cHoney*mix(0.66, 1.08, stain);
  c = mix(c, cMud, 0.3*smoothstep(0.5, 0.85, streak));
  c *= 1.0 + aa*((tone - 0.5)*0.24 - 0.28*joint*step(nl.y, 0.5));
  float fresh = 1.0 - clamp((uCourse - ci)/7.0, 0.0, 1.0);
  c = mix(c, cCasing*0.86, 0.62*fresh + 0.15*step(0.5, nl.y));
  c *= mix(cShade, vec3(1.0), mix(0.55, 1.0, smoothstep(0.0, 0.6, vD.y)));
#endif
#ifdef K_CASING
  float rowH = 1.46, row = floor(vLp.y/rowH);
  float bx = fu/3.1 + h21(vec2(row, 3.0))*5.0;
  float aa = clamp(1.0 - fwidth(vLp.y)/0.6, 0.0, 1.0);
  float tone = h21(vec2(floor(bx), row + uSeed));
  float joint = max(smoothstep(0.46, 0.5, abs(fract(bx) - 0.5)), smoothstep(0.45, 0.5, abs(fract(vLp.y/rowH) - 0.5)));
  float sheen = fbm(vec2(fu*0.014 + uSeed, vLp.y*0.021))*0.6 + fbm(vec2(fu*0.06, vLp.y*0.09 + uSeed))*0.4;
  // albedo stays near 0.75 so only the blaze exceeds 1; broad weathering bands, a haze-ward gradient
  // and wind-scour streaks keep the far face from reading as a paper cut-out
  float bandT = h21(vec2(floor(vLp.y/(rowH*6.0)), uSeed));
  float scour = fbm(vec2(fu*0.03 + vLp.y*0.012 + uSeed, vLp.y*0.004));
  c = cCasing*0.78*mix(0.84, 1.0, sheen)*(0.92 + 0.12*bandT)*mix(0.8, 1.05, smoothstep(0.0, uDim.y, vLp.y));
  c *= mix(vec3(0.9, 0.86, 0.8), vec3(1.0), smoothstep(0.3, 0.7, scour));
  c *= 1.0 - 0.13*smoothstep(0.42, 0.5, abs(fract(vLp.y/(rowH*6.0)) - 0.5));
  c *= 1.0 + aa*((tone - 0.5)*0.08 - 0.12*joint);
  c = mix(c, vec3(0.45, 0.2, 0.15)*mix(0.8, 1.1, sheen), step(vLp.y, uGranite));
  float band = (1.0 - smoothstep(0.0, 7.0, vLp.y - uLineY))*smoothstep(0.0, 4.0, uLineY);
  c = mix(c, cHoney*0.85, band*(0.35 + 0.4*h21(vec2(floor(fu/2.2), floor(vLp.y/2.0)))));
  c = mix(c, vec3(1.2, 1.17, 1.08), 0.85*(1.0 - smoothstep(0.0, 2.6, vLp.y - uLineY))*smoothstep(0.0, 4.0, uLineY));   // the working edge: fresh-cut stone, bright
  c = mix(c, cHoney*0.3, smoothstep(0.02, 0.2, vD.w));
#endif
#ifdef K_RAMP
  float top = smoothstep(0.6, 0.8, nl.y);
  float st = fbm(vec2(vLp.x*0.05 + uSeed, vLp.y*0.09 + vLp.z*0.05));
  vec3 wall = mix(cMud, cHoney, 0.08)*mix(0.85, 1.25, st);
  wall *= 0.88 + 0.12*step(0.5, fract(vLp.x/6.0));
  wall *= 1.0 - 0.1*step(0.5, fract(vLp.y/1.1))*clamp(1.0 - fwidth(vLp.y)/0.5, 0.0, 1.0);
  wall *= mix(0.74, 1.0, smoothstep(0.0, 0.5, vD.z));
  vec3 road = mix(cMud, cHoney, 0.3)*mix(0.95, 1.2, st);
  road *= 1.0 + 0.25*(1.0 - smoothstep(0.0, 0.12, vD.y)) + 0.35*smoothstep(0.9, 1.0, vD.y);
  c = mix(wall, road, top);
#endif
#ifdef K_TEAM
  float isBlock = step(vD.x, 0.1)*vD.y;
  vec3 haul = mix(vec3(0.1, 0.065, 0.05), cMud*0.8, step(0.5, fract(vD.x*7.0 + 0.2))*(1.0 - uSmear));
  c = mix(haul, cCasing*0.98, isBlock);
  c = mix(c, mix(cMud*0.35, cCasing*0.95, vD.y), uSmear*0.7);
#endif
#ifdef K_SITE
  vec2 g = vLp.xz/5.0; float tone = h21(floor(g) + uSeed);
  float aa = clamp(1.0 - fwidth(vLp.x)/2.0, 0.0, 1.0), pv = 1.0 - step(0.5, vD.w);
  float jt = max(smoothstep(0.45, 0.5, abs(fract(g.x) - 0.5)), smoothstep(0.45, 0.5, abs(fract(g.y) - 0.5)));
  c = mix(cHoney, cCasing, 0.55)*0.8*(1.0 + pv*aa*((tone - 0.5)*0.18 - 0.16*jt))*mix(0.8, 1.0, fbm(vLp.xz*0.03 + uSeed));
#endif
#ifdef K_DUST
  float dn = fbm(vec2(vD.x*mix(6.0, 2.6, uSmear) - uTime*0.45 + uSeed, vD.y*2.2 + vD.x*3.0));
  float da = smoothstep(0.3, 0.75, dn + 0.25*(1.0 - vD.x))*pow(clamp(1.0 - vD.x, 0.0, 1.0), 0.8)*smoothstep(0.0, 0.06, vD.x)*clamp(1.0 - vD.y*vD.y, 0.0, 1.0);
  diffuseColor.a *= da*uDust;
  c = mix(cCasing, cHoney, 0.3)*0.9;
#endif
#ifdef K_CAP
  c = cGold*0.85*(0.9 + 0.1*step(0.5, fract(vLp.y*0.9)));
#endif
#ifdef K_MIRROR
  c *= uMirrorTint;
#endif
  diffuseColor.rgb *= c;
}
`;
const F_EMISSIVE = /* glsl */`
#include <emissivemap_fragment>
#ifdef K_CAP
  totalEmissiveRadiance += cGold*(0.3 + 5.0*uGlint);
#endif
`;
const F_LIGHTS = /* glsl */`
#include <lights_fragment_end>
#if ( defined( K_CASING ) || defined( K_CAP ) ) && NUM_DIR_LIGHTS > 0
{
  float bl = max(dot(normal, directionalLights[0].direction), 0.0);
  bl *= bl; bl *= bl; bl *= bl;
  reflectedLight.directDiffuse *= 1.0 + uBlaze*bl;
}
#endif
`;

function makeMaterial(U, kind, o = {}) {
  const m = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: o.rough ?? 0.92, metalness: 0, vertexColors: o.vc ?? true });
  m.defines = { ...m.defines, ['K_' + kind]: 1 };
  if (o.mirror) { m.defines.K_MIRROR = 1; m.side = THREE.BackSide; m.transparent = true; m.depthWrite = false; }
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, U);
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\n' + V_PARS)
      .replace('#include <beginnormal_vertex>', V_NORMAL)
      .replace('#include <begin_vertex>', V_BEGIN);
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\n' + F_PARS)
      .replace('#include <color_fragment>', F_COLOR)
      .replace('#include <normal_fragment_maps>', '#include <normal_fragment_maps>\n#ifdef K_DUST\n  normal = normalize((viewMatrix*vec4(0.0, 1.0, 0.0, 0.0)).xyz);\n#endif')
      .replace('#include <emissivemap_fragment>', F_EMISSIVE)
      .replace('#include <lights_fragment_end>', F_LIGHTS);
  };
  return m;
}

// ---------------------------------------------------------------- geometry helpers
function newBuf() { return { p: [], n: [], c: [], d: [], i: [] }; }
// a,b,c,d corner positions; n the wanted normal (winding is fixed to agree with it); col [r,g,b];
// da..dd per-corner aD (vec4).
function quad(B, a, b, c, d, n, col, da, db, dc, dd) {
  const base = B.p.length / 3;
  B.p.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2], d[0], d[1], d[2]);
  const l = Math.hypot(n[0], n[1], n[2]) || 1, nx = n[0] / l, ny = n[1] / l, nz = n[2] / l;
  for (let k = 0; k < 4; k++) { B.n.push(nx, ny, nz); B.c.push(col[0], col[1], col[2]); }
  B.d.push(da[0], da[1], da[2], da[3], db[0], db[1], db[2], db[3], dc[0], dc[1], dc[2], dc[3], dd[0], dd[1], dd[2], dd[3]);
  const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = d[0] - a[0], vy = d[1] - a[1], vz = d[2] - a[2];
  const g = (uy * vz - uz * vy) * nx + (uz * vx - ux * vz) * ny + (ux * vy - uy * vx) * nz;
  if (g >= 0) B.i.push(base, base + 1, base + 2, base, base + 2, base + 3);
  else B.i.push(base, base + 2, base + 1, base, base + 3, base + 2);
}
function toGeometry(B) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(B.p, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(B.n, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(B.c, 3));
  g.setAttribute('aD', new THREE.Float32BufferAttribute(B.d, 4));
  g.setIndex(B.p.length / 3 > 65535 ? new THREE.Uint32BufferAttribute(B.i, 1) : new THREE.Uint16BufferAttribute(B.i, 1));
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 60, 0), 400);
  return g;
}
const SIDES = [[0, 1], [1, 0], [0, -1], [-1, 0]];   // outward (nx, nz): south, east, north, west

// Stepped core: every course is a ring of separate blocks (riser, tread, two ends) plus a fill cap.
// aD = (course index, height of this vertex above the course base, sweep phase 0..1, random).
async function buildCore(rng, P, segLen, lod, pause) {
  const B = newBuf(), { N, Nc, h } = P, UP = [0, 1, 0];
  for (let i = 0; i < Nc; i++) {
    if (pause && (i & 3) === 3) await pause();          // a long build: hand frames back between courses
    const y0 = i * h, a = HW * (1 - (i + 1) / N) - 0.35, S = Math.max(1, Math.round(2 * a / segLen));
    const T = Math.min(3.0, a), start = rng(), courseTone = 0.88 + rng() * 0.18;
    for (let s = 0; s < 4; s++) {
      const nx = SIDES[s][0], nz = SIDES[s][1], dx = -nz, dz = nx;
      const pt = (t, off, y) => [nx * off + dx * t, y, nz * off + dz * t];
      let t0 = -a;
      for (let j = 0; j < S; j++) {
        const t1 = j === S - 1 ? a : -a + (j + 1 + (lod ? 0 : rng.range(-0.28, 0.28))) * (2 * a / S);
        const inset = lod ? 0 : rng() * rng() * 0.5, hh = h * (lod ? 0.98 : rng.range(0.94, 1.0));
        const o1 = a - inset, o0 = o1 + 0.16, y1 = y0 + hh, rnd = rng();
        const sweep = (start + (s + (j + 0.5) / S) / 4) % 1;
        const tn = courseTone * (0.88 + 0.2 * rnd), warm = rng.range(-0.04, 0.04);
        const col = [tn * (1 + warm), tn, tn * (1 - warm * 1.5)];
        const d0 = [i, 0, sweep, rnd], d1 = [i, hh, sweep, rnd];
        quad(B, pt(t0, o0, y0), pt(t1, o0, y0), pt(t1, o1, y1), pt(t0, o1, y1), [nx, 0.1, nz], col, d0, d0, d1, d1);
        quad(B, pt(t0, o1, y1), pt(t1, o1, y1), pt(t1, o1 - T, y1), pt(t0, o1 - T, y1), UP, col, d1, d1, d1, d1);
        if (!lod) {
          quad(B, pt(t0, o0, y0), pt(t0, o1, y1), pt(t0, o1 - T, y1), pt(t0, o1 - T, y0), [-dx, 0, -dz], col, d0, d1, d1, d0);
          quad(B, pt(t1, o0, y0), pt(t1, o1, y1), pt(t1, o1 - T, y1), pt(t1, o1 - T, y0), [dx, 0, dz], col, d0, d1, d1, d0);
        }
        t0 = t1;
      }
    }
    const c = Math.max(a - T + 0.4, 0.2), yc = y0 + h * 0.96, dc = [i, h * 0.96, 1, 0.5], cc = [courseTone, courseTone, courseTone];
    quad(B, [-c, yc, -c], [c, yc, -c], [c, yc, c], [-c, yc, c], UP, cc, dc, dc, dc, dc);
  }
  if (pause) await pause();
  return toGeometry(B);
}

// Casing: four trapezoid faces whose lower edge is clamped to the descending line in the vertex
// shader, plus a dark under-lip at the line. aD = (sign x, sign z, isLower, isLipInner).
function buildCasing() {
  const B = newBuf(), W = [1, 1, 1], k = Math.cos(Math.atan2(H, HW)), up = Math.sin(Math.atan2(H, HW));
  for (let s = 0; s < 4; s++) {
    const nx = SIDES[s][0], nz = SIDES[s][1], dx = -nz, dz = nx;
    const sg = (t) => [nx + dx * t, nz + dz * t];            // corner signs for t = -1 / +1
    const A = sg(-1), Bc = sg(1), z3 = [0, 0, 0];
    const n = [nx * up, k, nz * up];
    quad(B, z3, z3, z3, z3, n, W, [A[0], A[1], 1, 0], [Bc[0], Bc[1], 1, 0], [Bc[0], Bc[1], 0, 0], [A[0], A[1], 0, 0]);
    // shader-made positions: the helper cannot check winding, so set it by hand (this order is CW from outside)
    const ib = B.i.length - 6, b0 = B.i[ib];
    B.i.splice(ib, 6, b0, b0 + 2, b0 + 1, b0, b0 + 3, b0 + 2);
    quad(B, z3, z3, z3, z3, [0, -1, 0], W, [A[0], A[1], 1, 0], [Bc[0], Bc[1], 1, 0], [Bc[0], Bc[1], 1, 1], [A[0], A[1], 1, 1]);
  }
  return toGeometry(B);
}

// Ramp: ground causeway (leg 0) + 11 zigzag legs up the +Z face, with landings at the turns.
// aD = (s along the polyline in legs, across 0..1, 0 bottom / 1 top, random). Vertices beyond the
// current head are slid back to the head in the vertex shader, which closes the end.
function buildRamp(rng, P) {
  const B = newBuf(), { pts, side, roadW } = P, W = [1, 1, 1];
  const wAt = (y) => roadW * lerp(1, 0.5, clamp(y / H, 0, 1));
  for (let k = 0; k < NP - 1; k++) {
    const A = pts[k], Bp = pts[k + 1], len = A.distanceTo(Bp), M = Math.max(1, Math.ceil(len / 7));
    const ax = k === 0 ? [side, 0, 0] : [0, 0, 1], dir = Bp.clone().sub(A).normalize();
    const nTop = new THREE.Vector3(ax[0], ax[1], ax[2]).cross(dir); if (nTop.y < 0) nTop.negate();
    let prev = null;
    for (let m = 0; m <= M; m++) {
      const f = m / M, s = k + f, C = A.clone().lerp(Bp, f), w = wAt(C.y);
      const d = k === 0 ? C.y : Math.min(w / 0.647, C.y), r = rng();
      const I = [C.x, C.y, C.z], O = [C.x + ax[0] * w, C.y, C.z + ax[2] * w];
      const OB = [C.x + ax[0] * (w + d * 0.14), C.y - d, C.z + ax[2] * (w + d * 0.14)], IB = [C.x, C.y - d, C.z];
      const cur = { I, O, OB, IB, s, r };
      if (prev) {
        quad(B, prev.I, prev.O, cur.O, cur.I, [nTop.x, nTop.y, nTop.z], W, [prev.s, 0, 1, prev.r], [prev.s, 1, 1, prev.r], [s, 1, 1, r], [s, 0, 1, r]);
        quad(B, prev.O, prev.OB, cur.OB, cur.O, [ax[0], 0.14, ax[2]], W, [prev.s, 1, 1, prev.r], [prev.s, 1, 0, prev.r], [s, 1, 0, r], [s, 1, 1, r]);
        if (k === 0) quad(B, prev.I, prev.IB, cur.IB, cur.I, [-ax[0], 0.1, -ax[2]], W, [prev.s, 0, 1, prev.r], [prev.s, 0, 0, prev.r], [s, 0, 0, r], [s, 0, 1, r]);
      }
      if (m === M || m === 0) {
        const sg = m === 0 ? -1 : 1;
        quad(B, I, O, OB, IB, [dir.x * sg, 0, dir.z * sg], W, [s, 0, 1, r], [s, 1, 1, r], [s, 1, 0, r], [s, 0, 0, r]);
      }
      prev = cur;
    }
  }
  for (let j = 1; j < NP; j++) {                     // landings
    const C = pts[j], w = wAt(C.y), d = Math.min(w / 0.647 * 1.08, C.y), hx = w * 0.95, r = rng();
    const x0 = C.x - hx, x1 = C.x + hx, z0 = C.z - 0.3, z1 = C.z + w * 1.3, yt = C.y + 0.08, yb = C.y - d, zb = z1 + d * 0.14;
    const dt = (ac, v) => [j, ac, v, r];
    quad(B, [x0, yt, z0], [x1, yt, z0], [x1, yt, z1], [x0, yt, z1], [0, 1, 0], W, dt(0, 1), dt(0, 1), dt(1, 1), dt(1, 1));
    quad(B, [x0, yt, z1], [x1, yt, z1], [x1, yb, zb], [x0, yb, zb], [0, 0.14, 1], W, dt(1, 1), dt(1, 1), dt(1, 0), dt(1, 0));
    quad(B, [x0, yt, z0], [x0, yt, z1], [x0, yb, zb], [x0, yb, z0], [-1, 0.1, 0], W, dt(0, 1), dt(1, 1), dt(1, 0), dt(0, 0));
    quad(B, [x1, yt, z0], [x1, yt, z1], [x1, yb, zb], [x1, yb, z0], [1, 0.1, 0], W, dt(0, 1), dt(1, 1), dt(1, 0), dt(0, 0));
  }
  return toGeometry(B);
}

// Site: bevelled limestone pavement round the base + block yards beside the causeway.
// aD = (pivot x, pivot z, removal threshold, 0 pavement / 1 block).
function buildSite(rng, P, density) {
  const B = newBuf(), Wp = HW + 13, yt = 0.45, z4 = [0, 0, 0, 0], W = [1, 1, 1];
  quad(B, [-Wp, yt, -Wp], [Wp, yt, -Wp], [Wp, yt, Wp], [-Wp, yt, Wp], [0, 1, 0], W, z4, z4, z4, z4);
  for (let s = 0; s < 4; s++) {
    const nx = SIDES[s][0], nz = SIDES[s][1], dx = -nz, dz = nx, o = Wp + 1.6;
    const pt = (t, off, y) => [nx * off + dx * t, y, nz * off + dz * t];
    quad(B, pt(-Wp, Wp, yt), pt(Wp, Wp, yt), pt(o, o, -0.5), pt(-o, o, -0.5), [nx, 0.9, nz], [0.9, 0.9, 0.9], z4, z4, z4, z4);
  }
  const box = (cx, cz, y0, sx, sy, sz, rot, col, th) => {
    const c = Math.cos(rot), s = Math.sin(rot), D = [cx, cz, Math.min(th, 0.85), 1];
    const v = (x, y, z) => [cx + x * c - z * s, y0 + y, cz + x * s + z * c];
    const n = (x, z) => [x * c - z * s, 0, x * s + z * c];
    const hx = sx / 2, hz = sz / 2;
    quad(B, v(-hx, sy, -hz), v(hx, sy, -hz), v(hx, sy, hz), v(-hx, sy, hz), [0, 1, 0], col, D, D, D, D);
    quad(B, v(-hx, 0, hz), v(hx, 0, hz), v(hx, sy, hz), v(-hx, sy, hz), n(0, 1), col, D, D, D, D);
    quad(B, v(-hx, 0, -hz), v(hx, 0, -hz), v(hx, sy, -hz), v(-hx, sy, -hz), n(0, -1), col, D, D, D, D);
    quad(B, v(hx, 0, -hz), v(hx, 0, hz), v(hx, sy, hz), v(hx, sy, -hz), n(1, 0), col, D, D, D, D);
    quad(B, v(-hx, 0, -hz), v(-hx, 0, hz), v(-hx, sy, hz), v(-hx, sy, -hz), n(-1, 0), col, D, D, D, D);
  };
  const G = P.pts[0], P0 = P.pts[1], yards = Math.round(rng.range(6, 9) * density);
  for (let y = 0, tries = 0; y < yards && tries < 80; tries++) {
    const cx = rng.range(-105, 105), cz = rng.range(HW + 34, HW + 92);
    const tx = lerp(P0.x, G.x, clamp((cz - P0.z) / (G.z - P0.z), 0, 1)) + P.side * P.roadW * 0.5;
    const rows = rng.int(3, 5), cols = rng.int(5, 10), sp = rng.range(3.0, 3.6);
    if (Math.abs(cx - tx) < cols * sp * 0.5 + 9) continue;
    y++;
    const rot = rng.range(-0.12, 0.12), th = rng.range(0.05, 0.75), c = Math.cos(rot), s = Math.sin(rot);
    for (let r = 0; r < rows; r++) for (let q = 0; q < cols; q++) {
      if (rng.chance(0.22)) continue;
      const lx = (q - (cols - 1) / 2) * sp, lz = (r - (rows - 1) / 2) * sp, t = rng.range(0.8, 1.02), wm = rng.range(-0.04, 0.04);
      const col = [t * (1 + wm), t, t * (1 - wm)], bx = cx + lx * c - lz * s, bz = cz + lx * s + lz * c;
      const sy = rng.range(1.2, 1.7);
      box(bx, bz, 0, rng.range(2.0, 2.5), sy, rng.range(2.0, 2.5), rot + rng.range(-0.05, 0.05), col, th + rng.range(0, 0.15));
      if (rng.chance(0.3)) box(bx + rng.range(-0.3, 0.3), bz, sy, 2.0, rng.range(1.1, 1.5), 2.0, rot + rng.range(-0.2, 0.2), col, th + rng.range(0.1, 0.2));
    }
  }
  return toGeometry(B);
}

// Capstone: a pyramidion on a thin socket course. aD unused.
function buildCap(P) {
  const B = newBuf(), yc = P.yc, a = HW * (1 - yc / H) + 0.25, z4 = [0, 0, 0, 0], W = [1, 1, 1], g = new THREE.Vector3();
  for (let s = 0; s < 4; s++) {
    const nx = SIDES[s][0], nz = SIDES[s][1], dx = -nz, dz = nx;
    const p0 = [nx * a - dx * a, yc, nz * a - dz * a], p1 = [nx * a + dx * a, yc, nz * a + dz * a], ap = [0, H + 0.3, 0];
    g.set(nx * H, HW, nz * H).normalize();
    quad(B, p0, p1, ap, ap, [g.x, g.y, g.z], W, z4, z4, z4, z4);
    quad(B, [p0[0] * 1.06, yc - 0.9, p0[2] * 1.06], [p1[0] * 1.06, yc - 0.9, p1[2] * 1.06], p1, p0, [nx, 0.3, nz], [0.8, 0.8, 0.8], z4, z4, z4, z4);
  }
  return toGeometry(B);
}

const FLARE_V = /* glsl */`
uniform float uSize;
varying vec2 vUv;
#include <fog_pars_vertex>
void main(){
  vUv = uv*2.0 - 1.0;
  vec4 mvPosition = modelViewMatrix*vec4(0.0, 0.0, 0.0, 1.0);
  mvPosition.xy += position.xy*uSize; mvPosition.z += 14.0;
  gl_Position = projectionMatrix*mvPosition;
  #include <fog_vertex>
}`;
const FLARE_F = /* glsl */`
uniform float uI; uniform vec3 uCol;
varying vec2 vUv;
#include <fog_pars_fragment>
void main(){
  vec2 p = abs(vUv); float r = length(vUv);
  float core = exp(-r*r*45.0);
  float star = exp(-p.y*55.0)*exp(-p.x*3.5) + exp(-p.x*55.0)*exp(-p.y*3.5);
  vec3 col = uCol*(core*6.0 + star*2.5 + exp(-r*5.0)*0.3)*uI*(1.0 - smoothstep(0.6, 1.0, r));
  #ifdef USE_FOG
    #ifdef FOG_EXP2
      float ff = 1.0 - exp(-fogDensity*fogDensity*vFogDepth*vFogDepth);
    #else
      float ff = smoothstep(fogNear, fogFar, vFogDepth);
    #endif
    col *= 1.0 - ff;
  #endif
  gl_FragColor = vec4(col, 1.0);
}`;

export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng.fork('twenty-floods-hero');
  const pal = (opts.palette && opts.palette.length >= 7 ? opts.palette : DEFAULT_PALETTE).map((x) => new THREE.Color(x));
  const detail = ctx.quality?.detail ?? 1, density = opts.density ?? 1;
  const viewer = null, demo = false;   // (viewer-only demo stage retired: no URL reads in shipped code)

  // ---- seeded proportions
  const N = rng.int(50, 60), Nc = N - Math.max(2, Math.round(N * 0.05)), h = H / N, yc = Nc * h;
  const side = opts.rampSide ?? rng.sign(), roadW = rng.range(6.5, 8), blend = rng.range(0.4, 0.7), q = 0.75;
  const hwAt = (y) => HW * (1 - y / H);
  const ys = [], pts = [];
  for (let k = 0; k < NP - 1; k++) {
    const y = Math.max((yc - 1) * (blend * (k / 11) + (1 - blend) * (1 - q ** k) / (1 - q ** 11)), 0.6);
    ys.push(y);
    pts.push(new THREE.Vector3(-side * (k % 2 === 0 ? 1 : -1) * Math.max(hwAt(y) - 7, 1.5), y, hwAt(y) + 0.15));
  }
  pts.unshift(new THREE.Vector3(pts[0].x + side * rng.range(-12, 36), 0.6, HW + rng.range(88, 100)));
  const sOfY = (y) => {
    if (y <= ys[0]) return 1;
    for (let k = 0; k < 11; k++) if (y < ys[k + 1]) return 1 + k + (y - ys[k]) / (ys[k + 1] - ys[k]);
    return 12;
  };
  const P = { N, Nc, h, yc, pts, side, roadW };
  const flood = demo && viewer.get('heroM') !== null;
  const mirrorY0 = demo ? (flood ? -0.5 : -4) : (opts.mirrorY ?? -30);

  // ---- shared uniforms
  const honey = pal[2].clone().offsetHSL(rng.range(-0.012, 0.012), rng.range(-0.05, 0.05), rng.range(-0.03, 0.03));
  const U = {
    uCourse: { value: Nc + 1 }, uLineY: { value: -1.5 }, uRampHead: { value: 0 }, uTime: { value: 0 }, uFlow: { value: 0 },
    uSmear: { value: 0 }, uCap: { value: 1 }, uSite: { value: 0 }, uSide: { value: side }, uRoadW: { value: roadW },
    uDim: { value: new THREE.Vector4(HW, H, yc, h) }, uMirror: { value: new THREE.Vector3(0, mirrorY0, opts.mirrorRipple ?? 0.5) },
    uRamp: { value: pts }, uGlint: { value: 0 }, uGranite: { value: rng.chance(0.3) ? rng.range(3, 7) : -10 },
    uSeed: { value: rng.range(0, 50) }, uDustY: { value: 0 }, uDust: { value: 0 }, uWind: { value: opts.wind ?? rng.sign() }, uBlaze: { value: opts.blaze ?? 3 },
    uMirrorTint: { value: new THREE.Color(opts.mirrorTint ?? '#8fb0c0') },
    cCasing: { value: pal[1] }, cHoney: { value: honey }, cMud: { value: pal[3] },
    cShade: { value: pal[5].clone().lerp(new THREE.Color(1, 1, 1), 0.45) }, cGold: { value: pal[6] },
  };

  const object = new THREE.Group(); object.name = 'twenty-floods-hero';
  const add = (geo, mat, parent = object, order = 0) => {
    const m = new THREE.Mesh(geo, mat); m.renderOrder = order; parent.add(m); return m;
  };

  // ---- the pyramid
  const pause = () => ctx.yield();
  const coreGeo = await buildCore(rng.fork('core'), P, 6.5, false, pause);
  add(coreGeo, makeMaterial(U, 'CORE'));
  await ctx.yield();
  const casingGeo = buildCasing();
  await ctx.yield();
  const rampGeo = buildRamp(rng.fork('ramp'), P);
  await ctx.yield();
  const capGeo = buildCap(P);
  add(casingGeo, makeMaterial(U, 'CASING', { rough: 0.5 }));
  add(rampGeo, makeMaterial(U, 'RAMP'));
  add(capGeo, makeMaterial(U, 'CAP', { rough: 0.35 }));
  await ctx.yield();
  add(buildSite(rng.fork('site'), P, density), makeMaterial(U, 'SITE'));
  await ctx.yield();

  // ---- sledge teams: instanced boxes placed along the ramp polyline in the vertex shader
  {
    const tr = rng.fork('teams'), n = Math.max(200, Math.round(3000 * density * detail));
    const box = new THREE.BoxGeometry(1, 1, 1).translate(0, 0.5, 0), g = new THREE.InstancedBufferGeometry();
    g.index = box.index; g.setAttribute('position', box.attributes.position); g.setAttribute('normal', box.attributes.normal);
    const a = new Float32Array(n * 4);
    const convoys = [...Array(70)].map(() => tr());           // teams travel in convoys, so the thread has moving gaps
    for (let i = 0; i < n; i++) {
      const up = tr.chance(0.72);
      a[i * 4] = up ? (tr.pick(convoys) + tr.gauss() * 0.0035 + 1) % 1 : tr();
      a[i * 4 + 1] = up ? 1 : -1; a[i * 4 + 2] = up ? 0.5 + tr.gauss() * 0.08 : tr(); a[i * 4 + 3] = tr();
    }
    g.setAttribute('aD', new THREE.InstancedBufferAttribute(a, 4)); g.instanceCount = n;
    const m = add(g, makeMaterial(U, 'TEAM', { vc: false })); m.frustumCulled = false;
  }

  await ctx.yield();

  // ---- dust banner streaming downwind from the working top (later from the casing line)
  {
    const nx = 40, ny = 8, pp = [], nn = [], ii = [];
    for (let j = 0; j <= ny; j++) for (let i = 0; i <= nx; i++) { pp.push(i / nx, (j / ny) * 2 - 1, 0); nn.push(0, 1, 0); }
    for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) { const a = j * (nx + 1) + i; ii.push(a, a + 1, a + nx + 2, a, a + nx + 2, a + nx + 1); }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pp, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nn, 3));
    g.setAttribute('aD', new THREE.Float32BufferAttribute(new Float32Array(pp.length / 3 * 4), 4)); g.setIndex(ii);
    const dm = makeMaterial(U, 'DUST', { vc: false }); dm.transparent = true; dm.depthWrite = false; dm.side = THREE.DoubleSide;
    const m = add(g, dm, object, 4); m.frustumCulled = false;
  }

  // ---- reflection copy (y-flipped in the shader; low-detail core)
  let mirror = null; const mirrorMaterials = [];
  if (opts.mirror !== false) {
    mirror = new THREE.Group(); mirror.name = 'mirror'; object.add(mirror);
    const mm = (kind, o) => { const m = makeMaterial(U, kind, { ...o, mirror: true }); m.opacity = opts.mirrorOpacity ?? 0.6; mirrorMaterials.push(m); return m; };
    add(await buildCore(rng.fork('lod'), P, 20, true, pause), mm('CORE'), mirror, -4).frustumCulled = false;
    add(casingGeo, mm('CASING', { rough: 0.5 }), mirror, -3).frustumCulled = false;
    add(rampGeo, mm('RAMP'), mirror, -2).frustumCulled = false;
    add(capGeo, mm('CAP', { rough: 0.35 }), mirror, -1).frustumCulled = false;
  }
  await ctx.yield();

  // ---- capstone glint flare
  const flareU = THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { uI: { value: 0 }, uSize: { value: 70 }, uCol: { value: pal[6].clone() } }]);
  const flare = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({
    uniforms: flareU, vertexShader: FLARE_V, fragmentShader: FLARE_F, fog: true,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  }));
  flare.position.set(0, H - 2, 0); flare.frustumCulled = false; flare.renderOrder = 6; object.add(flare);

  // ---- viewer-only stage: a low plateau and a water sheet so the reflection can be judged
  if (demo) {
    const mesa = new THREE.Mesh(new THREE.CylinderGeometry(224, 236, 4, 72), new THREE.MeshStandardMaterial({ color: '#b39468', roughness: 1 }));
    mesa.position.y = -2.03; if (!flood) object.add(mesa);
    const water = new THREE.Mesh(new THREE.CircleGeometry(2400, 64), new THREE.MeshStandardMaterial({ color: '#2a5870', roughness: 0.25, transparent: true, opacity: flood ? 0.35 : 0.5, depthWrite: false }));
    water.rotation.x = -Math.PI / 2; water.position.y = mirrorY0; water.renderOrder = 5; object.add(water);
  }

  // ---- clocks
  let b = 2, smear = 0, glintExt = 0, driven = false;
  const fixedB = demo && viewer.get('heroB') !== null ? parseFloat(viewer.get('heroB')) : null;
  const _v = new THREE.Vector3();
  function apply(time) {
    const bc = clamp(b, 0, 1);
    U.uCourse.value = 3 + (Nc - 3) * bc + (bc >= 1 ? 1 : 0);
    U.uCap.value = smoothstep(1.0, 1.07, b);
    const gx = clamp((b - 1.05) / 0.09, 0, 1), pulse = Math.sin(Math.PI * gx) ** 2;
    const c = clamp((b - 1.12) / 0.88, 0, 1);
    U.uLineY.value = c <= 0 ? yc : lerp(yc, -1.5, c);
    const yHead = Math.min(clamp((U.uCourse.value - 1) * h, 0.6, yc - 1), U.uLineY.value - 4);
    U.uRampHead.value = sOfY(Math.max(yHead, 0.6)) * (1 - smoothstep(0.94, 1, c));
    U.uSite.value = 1 - smoothstep(0.5, 0.98, c);
    U.uSmear.value = smear;
    U.uDustY.value = b < 1.12 ? Math.min(U.uCourse.value, Nc) * h : U.uLineY.value;
    U.uDust.value = (opts.dust ?? 0.9) * (0.5 + 0.5 * smoothstep(0.02, 0.12, b)) * (1 - 0.45 * smoothstep(1.0, 1.15, b)) * (1 - smoothstep(1.85, 1.98, b));
    const shimmer = U.uCap.value * 0.06 * (0.5 + 0.5 * Math.sin(time * 1.3));
    U.uGlint.value = pulse + glintExt + shimmer;
    flareU.uI.value = pulse + glintExt * 0.8;
    flare.visible = flareU.uI.value > 0.003;
    if (mirror) mirror.visible = mirrorMaterials[0].opacity > 0.003;
  }
  apply(0);

  return {
    object, radius: 165, height: H, center: new THREE.Vector3(0, 58, 0), ground: false, groundY: 0,
    mirror, mirrorMaterials, uniforms: U,
    anchors: {
      apex: new THREE.Vector3(0, H, 0), capstone: new THREE.Vector3(0, (yc + H) / 2, 0), lookAt: new THREE.Vector3(0, 62, 0),
      corners: [[-HW, 0, HW], [HW, 0, HW], [HW, 0, -HW], [-HW, 0, -HW]].map((p) => new THREE.Vector3(...p)),
      apexShadow: new THREE.Vector3(0, H, 0),
      rampPoints: pts.map((p) => p.clone()), rampFoot: pts[1].clone(), trackStart: pts[0].clone(),
      southNormal: new THREE.Vector3(0, HW, H).normalize(), eastNormal: new THREE.Vector3(H, HW, 0).normalize(),
      viewpoints: { entry: new THREE.Vector3(339.4, mirrorY0 + 3.4, 650.5), exit: new THREE.Vector3(84.8, mirrorY0 + 3.4, 395.9) },
      bargeHeading: new THREE.Vector3(-Math.SQRT1_2, 0, -Math.SQRT1_2), mirrorY: mirrorY0,
    },
    setBuild(v) { driven = true; b = clamp(v, 0, 2); },
    schedule: { courses: 0.6 },      // where on the path the last course is laid (the world maps its calendar onto this)
    setProgress(u, years) {
      if (u === null || u === undefined) { driven = false; b = 2; smear = 0; return; }
      driven = true; u = clamp(u, 0, 1);
      // five courses stand at the entry, so the pale square clears the scarp's rim from the canal; every further course
      // rises with the world's years, so the build starts when its calendar does and keeps the calendar's pace
      if (u < 0.6) { const t = clamp(years ?? u / 0.6, 0, 1); b = 0.035 + 0.965 * lerp(t, t * t * (3 - 2 * t), 0.35); }
      else if (u < 0.645) b = 1 + ((u - 0.6) / 0.045) * 0.12;
      else b = 1.12 + clamp((u - 0.645) / 0.185, 0, 1) * 0.88;
      smear = smoothstep(0.1, 0.2, u) * (1 - smoothstep(0.78, 0.86, u));
    },
    setSmear(s) { smear = clamp(s, 0, 1); },
    setGlint(g) { glintExt = clamp(g, 0, 2); },
    setMirror(opacity, y) {
      for (const m of mirrorMaterials) m.opacity = clamp(opacity, 0, 1);
      if (y !== undefined) U.uMirror.value.y = y;
    },
    update(dt, time, camera) {
      if (demo && !driven) {
        if (fixedB !== null) b = fixedB;
        else if (camera) {
          object.worldToLocal(_v.copy(camera.position));
          const t = (Math.atan2(_v.x, _v.z) + 0.35) / 1.3;
          b = clamp((t - Math.floor(t)) * 2.15, 0, 2);
        }
        smear = b > 0.02 && b < 1.98 ? 1 : 0;
      }
      U.uTime.value = time;
      U.uFlow.value += Math.min(dt, 0.1) * (0.25 + smear * 1.2);
      apply(time);
    },
    dispose() {},
  };
}
