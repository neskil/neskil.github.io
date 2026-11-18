// Perihelion: hero set piece. SUNRISE ON A COMET: the waking terrace.
//
// What it is
//   The crown terrace of the comet's body lobe (a rounded 600 x 1000 m slab of layered charcoal
//   crust: contour scarps, pits, dust ponds, two fracture lines, an undercut cliff) and everything
//   that happens to it when the terminator crosses: a ruled line of light with real long shadows
//   (per-vertex horizon angles, so crests and boulder tops light before the ground and every shadow
//   shortens as the sun climbs), frost that glitters in the dark and smokes off two seconds after
//   the light touches it, 28+ vents on the fracture lines that ignite one after another behind the
//   line as collimated fountains of ice grains (streak sprites on ballistic arcs bent down-sun, plus
//   two crossed limb-bright cards with a dark core), fountain shadows striping the crust, far
//   plumes, dust ponds lifting as sheets, boulders floating up and tumbling, and a 60 m undercut
//   cliff of slabs that lets go and slumps in slow motion into its own fountain.
//
// Local space
//   Origin at the centre of the terrace, +Y up, y = 0 is roughly the crust under the camera line.
//   FRONT is +Z: the camera enters at (0, 14, +325) flying toward -Z; the sun rises beyond -Z,
//   15 degrees to the LEFT of that heading (left = -X). The cliff is on the right (+X) at z = -235.
//   (Brief coordinates, path start (0,14,0) heading +z: set object.rotation.y = Math.PI and
//   object.position = (0, 0, 325).) Do not scale the object: the shaders work in local space.
//
// Script time and the progress hook
//   Everything that must coincide with the camera is a function of SCRIPT TIME s (seconds of the
//   brief's 40 s journey), never of wall-clock time. Call hero.setProgress(u) every frame with the
//   path progress (s = u * opts.duration), or hero.setScriptTime(s) if speed varies along the path.
//   Until one of them is called the piece runs a demo loop (s = time mod 40) so it can be judged in
//   the viewer. Ambient flow inside a fountain (grains cycling) uses `time` from update().
//     terminator: reaches the camera line at z = opts.arriveZ at s = opts.arriveTime, moving +Z at
//     opts.lineSpeed. Vents ignite 0.4-1.2 s after it crosses them. The cliff lets go at cliffTime.
//   hero.sunDirAt(pos, out) gives the local direction to the sun as seen from a local position at
//   the current script time (elevation rises from below the horizon to 16 degrees as the line moves
//   on): use it for the sky dome's sun and the sail highlight. hero.uniforms is the shared block.
//
// opts
//   palette     7 hex strings in brief order (black, crust, frost, sun, grain white, dust, ion blue)
//   duration    40     seconds mapped by setProgress
//   arriveTime  10.5   arriveZ -21   lineSpeed 30   cliffTime 13.6 (first slab starts; 6.5 s slump)
//   vents       28     near vents on the two fracture lines (20-34); farVents 40 (cards only)
//   vigor       seeded 0.75-1.35: fountain height and brightness (thin / default / violent)
//   crust       seeded 'charcoal' | 'rust' (rust-brown body with bright ice patches, 1 seed in 4)
//   detail      ctx.quality.detail: thins grains, wisps and floating boulders only
//
// anchors (local space, plain arrays)
//   entry        { position, heading }           where the brief's path starts
//   flyThrough   ordered camera line over the terrace, >= 9 m clear of crust, rocks and boulders
//                (static rocks and floaters keep |x| > 14; the nearest fountain is 25 m away)
//   exitHeading  unit vector exactly down-sun, climbing 5 degrees (the brief's last leg). The exit
//                portal is 2 km out in the tail, not on this piece, so there is no portalSeat.
//   sunAzimuth   horizontal unit vector toward the sun;  awayFromSun the opposite
//   landerSeat   { position, normal }  floor of the hollow 15 m right of the path, 150 m in
//   nearBoulder  the house-sized boulder that passes 8 m to the left of the line
//   cliff        { center, top, foot, poi }       the undercut cliff (poi for 13-16 s)
//   fractures    { left:[...], right:[...] }      polylines of the two fracture lines
//   vents        [{ position, ignite, height }]   near vents, ignite in script seconds
//   farVents     same for the far plumes
//   viewpoints   { entry, avenue, cliff, above }  camera positions; look at hero.center or cliff.poi
//   Also hero.heightAt(x, z) (local crust height, for seating things), hero.terminatorQ(s) and
//   hero.lineTime(x, z): the script second at which the line reaches a point (it slows after passing the camera).
//
// Size and cost
//   radius 200 (viewer framing; the slab itself is 300 x 500 half-extents), fountains to ~300 m.
//   About 143k triangles, 6 draw calls, no lights, no textures, no render targets; ~250 ms build.
//
// Lighting
//   Self-lit: all materials are ShaderMaterials with their own sun (white-gold, intensity ~7, linear
//   HDR, direction from the terminator model) and ignore scene lights. Wants true black around it,
//   no fog (fog is supported if the scene has it), bloom threshold high (~0.9). The sun reaches 16
//   degrees about 630 m behind the line (RC = 2200), so shadows near the line are very long. Grain fountains and
//   frost glitter are the only things that bloom.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { clamp, lerp, smoothstep, makeNoise } from '../kit/core.js';

const DEFAULT_PALETTE = ['#020308', '#17130F', '#8FA6C4', '#FFE9B0', '#FFF8E6', '#EAD9B0', '#3FA8FF'];
const HX = 300, HZ = 500, NX = 136, NZ = 236;      // terrace half extents and grid segments
const MAXJ = 30;                                    // near jets that cast stripes

// ---------------------------------------------------------------- shared GLSL
const GLSL_COMMON = /* glsl */`
uniform float uS, uTime, uLineQ, uRc, uPen, uElevMax, uSunI, uSpeed, uIce;
uniform vec2 uAway;
uniform vec3 uSunCol, uFrostCol, uIonCol;
float h21(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(h21(i), h21(i + vec2(1., 0.)), f.x), mix(h21(i + vec2(0., 1.)), h21(i + vec2(1., 1.)), f.x), f.y); }
float fbm3(vec2 p){ return vn(p) * .5 + vn(p * 2.03 + 7.1) * .27 + vn(p * 4.1 + 3.3) * .15 + vn(p * 8.3 + 1.7) * .08; }
float tanElev(vec2 xz){ return clamp((uLineQ - dot(xz, uAway)) / uRc, -0.4, uElevMax); }
vec3 sunL(float te){ return normalize(vec3(-uAway.x, max(te, 0.04), -uAway.y)); }
`;
const GLSL_CRUST = /* glsl */`
// alb: albedo, N: local normal, P: local position, hor: tan of the horizon angle toward the sun,
// frostM: frost mask, dip: how much earlier this point lights (height above its base), dist: to eye
vec3 crustShade(vec3 alb, vec3 N, vec3 P, float hor, float frostM, float dip, float dist, float shade){
  float te = tanElev(P.xz);
  float d = te - hor + dip;
  float lit = smoothstep(-uPen, uPen, d) * shade;
  vec3 L = sunL(te);
  float ndl = max(dot(N, L), 0.);
  float since = max(d, 0.) * uRc / uSpeed;
  float frost = frostM * (1. - smoothstep(0.15, 2.2, since));
  vec3 a = mix(alb, mix(uFrostCol, uSunCol, 0.4) * 0.11, frost * 0.85 * (1. - smoothstep(0.015, 0.06, te)));
  vec3 col = a * uSunCol * uSunI * ndl * lit;
  col += a * uSunCol * uSunI * 0.8 * exp(-since / 1.5) * lit * (0.35 + 0.65 * max(N.y, 0.));     // the ruled line: the crust burns for a second where the light has just arrived
  // from the air the same burn is drawn ruled, without the terrain's own shadows: one line of light across the plain
  float tb = te + 0.035;
  col += a * uSunCol * uSunI * 0.9 * smoothstep(-uPen, uPen, tb) * exp(-max(tb, 0.) * uRc / uSpeed / 1.5) * smoothstep(220., 800., dist) * (0.35 + 0.65 * max(N.y, 0.));
  col += a * uSunCol * uSunI * 0.018 * smoothstep(0.0, 0.08, te) * (0.4 + 0.6 * max(N.y, 0.));   // bounce in the day shadows
  col += a * (uIonCol * 0.05 * max(N.y, 0.) + vec3(0.004, 0.005, 0.007));                        // night: ion-tail breath
  float up = max(N.y, 0.);
  col += mix(uIonCol, uFrostCol, 0.5) * 0.028 * up * up * (1. - 0.9 * smoothstep(-0.02, 0.05, te));   // the same breath, seen: upward faces hold a little blue before dawn
  float nearK = 1. - smoothstep(60., 220., dist);
  col += uFrostCol * frost * (0.075 + 0.05 * nearK) * (0.4 + 0.6 * max(N.y, 0.));               // frost in starlight
  // (polish) the night ground reads: the fountains already burning sunward and the coma light the frost, and every scarp and
  // boulder carries a cold lit edge on the side toward them
  float nightK = 1. - smoothstep(-0.03, 0.04, d);
  vec3 Vn = normalize(cameraPosition - P + vec3(0., 1e-4, 0.));
  vec3 Lg = normalize(vec3(-uAway.x, 0.3, -uAway.y));
  float wrapG = max(dot(N, Lg) * 0.7 + 0.3, 0.);
  float specG = pow(max(dot(N, normalize(Lg + Vn + vec3(0., 1e-3, 0.))), 0.), 22.);
  vec3 glowC = mix(uFrostCol, vec3(0.9, 0.95, 1.), 0.35);
  col += glowC * nightK * (0.03 * wrapG * wrapG * (0.3 + 0.7 * frost) + 0.2 * specG * (0.2 + 0.8 * frost));
  float fresG = 1. - max(dot(N, Vn), 0.); fresG *= fresG; fresG *= fresG;
  col += mix(uIonCol, uFrostCol, 0.4) * nightK * 0.04 * fresG * (0.5 + 0.5 * N.y);
  vec2 gp = P.xz * 1.6, c = floor(gp); float hh = h21(c);
  float tw = 0.5 + 0.5 * sin(uTime * (2. + hh * 5.) + hh * 50.);
  float gr = clamp(dist * 0.0032, 0.07, 0.42);
  float gd = length(gp - c - 0.5 - (vec2(h21(c + 3.7), h21(c + 9.1)) - 0.5) * (0.9 - 2. * gr));
  col += uFrostCol * frost * step(0.94 + 0.045 * smoothstep(40., 350., dist), hh) * (1. - smoothstep(gr * 0.4, gr, gd)) * tw * tw * (3.2 + 3.6 * nearK) * min(1., 0.16 / gr);   // glitter, thickest round the path
  return col;
}
`;
const FOG_V = '#include <fog_pars_vertex>';
const FOG_F = /* glsl */`
#include <fog_pars_fragment>
float fogAmount(){
  #ifdef USE_FOG
    #ifdef FOG_EXP2
      return 1. - exp(-fogDensity * fogDensity * vFogDepth * vFogDepth);
    #else
      return smoothstep(fogNear, fogFar, vFogDepth);
    #endif
  #else
    return 0.;
  #endif
}`;
function fogUniforms() { return THREE.UniformsUtils.clone(THREE.UniformsLib.fog); }

// ---------------------------------------------------------------- hero
export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng.fork('perihelion-hero');
  const noise = makeNoise(rng.int(1, 1e9));
  const detail = opts.detail ?? ctx.quality?.detail ?? 1;
  const pal = (opts.palette && opts.palette.length >= 7 ? opts.palette : DEFAULT_PALETTE).map((h) => new THREE.Color(h));
  const duration = opts.duration ?? 40, arriveTime = opts.arriveTime ?? 10.5, arriveZ = opts.arriveZ ?? -21;
  const lineSpeed = opts.lineSpeed ?? 30, cliffTime = opts.cliffTime ?? 13.6;
  const vigor = opts.vigor ?? rng.pick([0.78, 1.0, 1.0, 1.32]);
  const crustKind = opts.crust ?? (rng.chance(0.25) ? 'rust' : 'charcoal');
  const nNear = clamp(Math.round(opts.vents ?? rng.int(26, 30)), 20, MAXJ - 2) & ~1;
  const nFar = clamp(Math.round(opts.farVents ?? 40), 0, 60);
  const RC = 2200, PEN = 0.0065, ELEV_MAX = Math.tan(16 * Math.PI / 180);

  // sun geometry: away = horizontal unit vector pointing down-sun, in (x, z)
  const az = 15 * Math.PI / 180;
  const away = new THREE.Vector2(Math.sin(az), Math.cos(az));
  const qOf = (x, z) => x * away.x + z * away.y;
  const qCam = qOf(0, arriveZ);
  // The line comes at us at lineSpeed; two seconds after it has passed (it is behind us by then) it slows to LATE_V, so
  // that from the climb it is still crossing the plain, the fountains still igniting in its wake, the far third still night.
  const LATE_T = 2, LATE_V = 12.5;   // (polish) slower still: from the climb the line lies across the middle of the crown, half of it night
  const terminatorQ = (s) => { const t = s - arriveTime; return qCam + (t <= LATE_T ? lineSpeed * t : lineSpeed * LATE_T + LATE_V * (t - LATE_T)); };
  const sinceArrive = (dq) => (dq <= lineSpeed * LATE_T ? dq / lineSpeed : LATE_T + (dq - lineSpeed * LATE_T) / LATE_V);
  const lineTime = (x, z, hor = 0) => arriveTime + sinceArrive(qOf(x, z) + hor * RC - qCam);

  // ------------------------------------------------------------ layout (seeded)
  const fOff = [rng.range(0, 50), rng.range(0, 50)];
  const fracX = (side, z) => {
    let x = 42 + 13 * noise.n2(z / 170 + fOff[side > 0 ? 1 : 0], 3.1 * side) + 3 * noise.n2(z / 23, 9.7 * side);
    if (side > 0) x = lerp(x, 47, smoothstep(-130, -175, z) * smoothstep(-345, -300, z));   // runs along the cliff foot
    return side * x;
  };
  const cliff = { x0: 62, x1: 140, z0: -298, z1: -172, top: rng.range(54, 62) };
  const pits = [], ponds = [];
  for (let i = 0, tries = 0; i < 9 && tries < 200; tries++) {
    const x = rng.range(-240, 240), z = rng.range(-420, 420), r = rng.range(17, 26);
    if (Math.abs(x) < 75 || (x > 30 && z < -140 && z > -330)) continue;
    if (pits.some((p) => Math.hypot(p.x - x, p.z - z) < 90)) continue;
    pits.push({ x, z, r, depth: rng.range(7, 12) }); i++;
  }
  for (let i = 0, tries = 0; i < 9 && tries < 300; tries++) {
    const x = rng.range(-230, 230), z = rng.range(-400, 400), r = rng.range(26, 52);
    if (Math.abs(x) < 20 + r * 0.4 || (x > 20 && z < -130 && z > -340)) continue;
    if (pits.some((p) => Math.hypot(p.x - x, p.z - z) < p.r + r + 15)) continue;
    if (ponds.some((p) => Math.hypot(p.x - x, p.z - z) < p.r + r + 20)) continue;
    ponds.push({ x, z, r, level: 0 }); i++;
  }
  // near vents: alternate along the two fracture lines from far (sunward, -Z) to near
  const vents = [];
  const perSide = nNear / 2, zA = -330, zB = 285;
  for (let side = -1; side <= 1; side += 2) {
    for (let i = 0; i < perSide; i++) {
      const z = lerp(zA, zB, (i + 0.5 + rng.range(-0.28, 0.28) + (side > 0 ? 0.25 : -0.25)) / perSide);
      vents.push({ x: fracX(side, z), z, side, H: (170 + rng.range(0, 150)) * vigor, near: true });
    }
  }
  const cliffVent = { x: 49, z: -236, side: 1, H: 150 * vigor, near: true, cliff: true };
  // drop the regular vent nearest the cliff vent so the fountain there is the cliff's own
  for (let i = vents.length - 1; i >= 0; i--) if (vents[i].side > 0 && Math.abs(vents[i].z - cliffVent.z) < 26) vents.splice(i, 1);
  vents.push(cliffVent);
  const farVents = [];
  for (let i = 0, tries = 0; i < nFar && tries < 600; tries++) {
    const x = rng.range(-270, 270), z = rng.range(-470, 430);
    if (Math.abs(x) < 105 || Math.hypot(x / HX, z / HZ) > 0.93) continue;
    if (x > 40 && x < 170 && z < -140 && z > -330) continue;
    if (farVents.some((v) => Math.hypot(v.x - x, v.z - z) < 45)) continue;
    farVents.push({ x, z, H: (150 + rng.range(0, 380)) * vigor, near: false }); i++;
  }

  // ------------------------------------------------------------ height field
  const sA = rng.range(0, 100), sB = rng.range(0, 100), stepH = rng.range(6.5, 9);
  function rawHeight(x, z) {
    let h = noise.fbm2(x / 260 + sA, z / 260, 3) * 7;
    const t = noise.fbm2(x / 210 + sB, z / 210 + sA, 3) * 2.6 + noise.n2(x / 37, z / 37) * 0.06;
    const k = Math.floor(t), f = t - k;
    h += (k + smoothstep(0.36, 0.64, f) + f * 0.12) * stepH;                 // contour scarps
    h += noise.fbm2(x / 46, z / 46 + 20, 4) * 1.7 + noise.n2(x / 9, z / 9) * 0.35;
    return h;
  }
  const pondCache = ponds.map((p) => { p.level = rawHeight(p.x, p.z) - 1.2; return p; });
  const info = { pond: 0 };
  function heightFn(x, z) {
    let h = rawHeight(x, z), pond = 0;
    for (const p of pondCache) {
      const dx = x - p.x, dz = z - p.z; if (Math.abs(dx) > p.r * 1.4 || Math.abs(dz) > p.r * 1.4) continue;
      const d = Math.hypot(dx, dz) / (p.r * (1 + 0.22 * noise.n2(x / 31 + p.x, z / 31)));
      const w = 1 - smoothstep(0.72, 1.0, d);
      h = lerp(h, p.level + 0.25 * Math.sin(d * 9), w); pond = Math.max(pond, w);
    }
    for (const p of pits) {
      const dx = x - p.x, dz = z - p.z; if (Math.abs(dx) > p.r * 1.8 || Math.abs(dz) > p.r * 1.8) continue;
      const d = Math.hypot(dx, dz) / (p.r * (1 + 0.12 * noise.n2(x / 17, z / 17 + p.z)));
      h -= p.depth * (1 - smoothstep(0.5, 1.0, d)) - 2.4 * Math.exp(-(((d - 1.08) / 0.2) ** 2));
    }
    // corridor under the camera line: keep the crust low and gentle
    const c = 1 - smoothstep(9, 36, Math.abs(x));
    h = lerp(h, clamp(h, -3.5, 3.5) * 0.55, c * 0.9);
    // fracture trenches with raised lips
    for (let side = -1; side <= 1; side += 2) {
      const d = Math.abs(x - fracX(side, z));
      if (d < 22) h += -3.6 * Math.exp(-((d / 3.2) ** 2)) + 1.3 * Math.exp(-(((d - 7) / 3) ** 2));
    }
    // cliff mesa on the right
    {
      const mx = smoothstep(cliff.x0 - 1, cliff.x0 + 9, x) * (1 - smoothstep(cliff.x1, cliff.x1 + 70, x));
      const mz = smoothstep(cliff.z0 - 45, cliff.z0 + 4, z) * (1 - smoothstep(cliff.z1 - 4, cliff.z1 + 45, z));
      const m = mx * mz;
      if (m > 0) h = lerp(h, cliff.top - 3 + noise.fbm2(x / 30, z / 30, 3) * 3 - (x - cliff.x0) * 0.06, m);
    }
    // vent mounds: a cone with a throat
    for (const v of vents) {
      const dx = x - v.x, dz = z - v.z; if (Math.abs(dx) > 20 || Math.abs(dz) > 20) continue;
      const d = Math.hypot(dx, dz);
      h += 3.2 * Math.exp(-((d / 7.5) ** 2)) - 4.6 * Math.exp(-((d / 2.8) ** 2));
    }
    for (const v of farVents) {
      const dx = x - v.x, dz = z - v.z; if (Math.abs(dx) > 26 || Math.abs(dz) > 26) continue;
      const d = Math.hypot(dx, dz);
      h += 5 * Math.exp(-((d / 10) ** 2)) - 6 * Math.exp(-((d / 3.6) ** 2));
    }
    // the lander's hollow, 15 m right of the line, 150 m in
    { const d = Math.hypot(x - 15, z - 175) / 9; if (d < 2) h -= 2.6 * (1 - smoothstep(0.4, 1.2, d)); }
    // the slab's edges roll off into the lobe's curve
    const r = Math.hypot(x / HX, z / HZ), e = Math.max(0, r - 0.58) / 0.42;
    h -= e * e * 32 + Math.max(0, r - 1) * 260;      // a gentle shoulder: the lobe under it rises to meet this rim, so from the air the crown is part of the body, not a mesa
    info.pond = pond;
    return h;
  }

  await ctx.yield();
  const VX = NX + 1, VZ = NZ + 1, nV = VX * VZ;
  const Hh = new Float32Array(nV), pondA = new Float32Array(nV);
  for (let j = 0; j < VZ; j++) {
    const z = -HZ + (2 * HZ * j) / NZ;
    for (let i = 0; i < VX; i++) { const x = -HX + (2 * HX * i) / NX; Hh[j * VX + i] = heightFn(x, z); pondA[j * VX + i] = info.pond; }
    if (j & 1) await ctx.yield();
  }
  const cellX = (2 * HX) / NX, cellZ = (2 * HZ) / NZ;
  function sampleArr(A, x, z) {
    const fx = clamp((x + HX) / cellX, 0, NX - 0.001), fz = clamp((z + HZ) / cellZ, 0, NZ - 0.001);
    const i = Math.floor(fx), j = Math.floor(fz), u = fx - i, v = fz - j, o = j * VX + i;
    return lerp(lerp(A[o], A[o + 1], u), lerp(A[o + VX], A[o + VX + 1], u), v);
  }
  const heightAt = (x, z) => sampleArr(Hh, x, z);
  for (const v of vents) v.y = heightAt(v.x, v.z) + 0.5;
  for (const v of farVents) v.y = heightAt(v.x, v.z) + 0.5;

  // horizon angle toward the sun (tan), per vertex: this is what makes the shadows long and true
  const Hor = new Float32Array(nV);
  {
    const sxd = -away.x, szd = -away.y, steps = [];
    for (let d = 3.5; d < 520; d *= 1.13) steps.push(d);
    for (let j = 0; j < VZ; j++) {
      const z = -HZ + j * cellZ;
      for (let i = 0; i < VX; i++) {
        const x = -HX + i * cellX, h0 = Hh[j * VX + i]; let m = -0.035;
        for (let k = 0; k < steps.length; k++) {
          const d = steps[k], px = x + sxd * d, pz = z + szd * d;
          if (px < -HX || px > HX || pz < -HZ || pz > HZ) break;
          const t = (sampleArr(Hh, px, pz) - h0) / d; if (t > m) m = t;
        }
        Hor[j * VX + i] = Math.min(m, 0.8);
      }
      if (j & 1) await ctx.yield();
    }
  }
  await ctx.yield();
  const HorGround = Hor.slice();   // before rocks are splatted in: used to seat instances
  const horAt = (x, z) => sampleArr(HorGround, x, z);

  // ------------------------------------------------------------ rocks: placement
  // kind 0 static, 1 floater (rises behind the line), 2 cliff shard (hidden until the cliff goes)
  const rocks = [];
  const tmpQ = new THREE.Quaternion(), tmpE = new THREE.Euler();
  const inCliff = (x, z, m = 8) => x > cliff.x0 - 22 - m && x < cliff.x1 + 40 && z > cliff.z0 - 40 && z < cliff.z1 + 40;
  const nearVent = (x, z, m) => vents.some((v) => Math.hypot(v.x - x, v.z - z) < m);
  function addRock(x, z, r, o = {}) {
    const squat = o.squat ?? rng.range(0.55, 1.0);
    const y = (o.y ?? heightAt(x, z)) - r * squat * (o.sink ?? rng.range(0.12, 0.35));
    tmpE.set(rng.range(-0.3, 0.3), rng.range(0, 6.283), rng.range(-0.3, 0.3)); tmpQ.setFromEuler(tmpE);
    const rk = { x, y, z, r, sx: r * rng.range(0.8, 1.25), sy: r * squat, sz: r * rng.range(0.8, 1.25),
      q: [tmpQ.x, tmpQ.y, tmpQ.z, tmpQ.w], move: o.move || [0, 0, 0], t0: o.t0 ?? 0, tau: o.tau ?? 1, spin: o.spin ?? 0,
      kind: o.kind ?? 0, hor: o.hor ?? Math.max(horAt(x, z), -0.02), tone: rng.range(0, 1) };
    rocks.push(rk); return rk;
  }
  // the boulder that passes 8 m to the left of the line
  const nearB = addRock(-14.5, 232, 6.2, { squat: 0.9, sink: 0.2 });
  for (let i = 0, tries = 0; i < 34 && tries < 900; tries++) {          // house-sized
    const x = rng.range(-250, 250), z = rng.range(-430, 430), r = rng.range(4, 9.5);
    if (Math.abs(x) < 16 + r || inCliff(x, z) || nearVent(x, z, r + 9) || Math.hypot(x / HX, z / HZ) > 0.9) continue;
    if (sampleArr(pondA, x, z) > 0.2 && rng.chance(0.7)) continue;
    addRock(x, z, r); i++;
  }
  for (let i = 0, tries = 0; i < 110 && tries < 2000; tries++) {         // medium rubble, denser near the line
    const x = rng.gauss() * 95, z = rng.range(-440, 420), r = rng.range(1.2, 3.6);
    if (Math.abs(x) < 14.5 + r || Math.abs(x) > 270 || inCliff(x, z, 0) || nearVent(x, z, r + 5)) continue;
    addRock(x, z, r); i++;
  }
  for (let c = 0; c < 5; c++) {                                          // goosebump knob fields
    let cx = 0, cz = 0;
    for (let t = 0; t < 40; t++) { cx = rng.sign() * rng.range(20, 120); cz = rng.range(-380, 300); if (!inCliff(cx, cz, 20)) break; }
    for (let i = 0; i < 24; i++) {
      const a = rng.range(0, 6.283), d = Math.sqrt(rng()) * 30, x = cx + Math.cos(a) * d, z = cz + Math.sin(a) * d * 1.5;
      if (Math.abs(x) < 15.5 || nearVent(x, z, 7) || inCliff(x, z, 0)) continue;
      addRock(x, z, rng.range(1.6, 2.6), { squat: 1.0, sink: 0.4 });
    }
  }
  for (let i = 0; i < 30; i++) {                                         // low knobs under the camera line
    const x = rng.range(-13, 13), z = rng.range(-20, 320);
    addRock(x, z, rng.range(1.0, 1.9), { squat: 1.1, sink: 0.4 });
  }
  for (let i = 0; i < 26; i++) {                                         // talus at the cliff foot
    const z = rng.range(cliff.z0 - 10, cliff.z1 + 10), x = rng.range(36, 55);
    if (nearVent(x, z, 7)) continue;
    addRock(x, z, rng.range(1.2, 3.4));
  }
  const nStatic = rocks.length;
  await ctx.yield();
  // floaters: the comet's own rubble, lifted by the jets
  const nFloat = Math.round(200 * Math.max(0.6, detail));
  for (let i = 0, tries = 0; i < nFloat && tries < 4000; tries++) {
    const v = rng.chance(0.75) ? rng.pick(vents) : rng.pick(farVents.length ? farVents : vents);
    const a = rng.range(0, 6.283), d = rng.range(7, v.near ? 42 : 70);
    const x = v.x + Math.cos(a) * d, z = v.z + Math.sin(a) * d * 1.4, r = rng.range(0.7, 2.6) * (rng.chance(0.08) ? 1.8 : 1);
    if (Math.abs(x) < 15 + r || inCliff(x, z, -4) || Math.abs(x) > HX * 0.9 || Math.abs(z) > HZ * 0.9) continue;
    const up = rng.range(10, 95) * (0.6 + 0.4 * vigor), dr = rng.range(4, 30);
    let mx = away.x * dr + rng.range(-6, 6), mz = away.y * dr + rng.range(-6, 6);
    if (Math.abs(x + mx) < 15 + r) mx = 0;                               // never drift into the corridor
    addRock(x, z, r, { kind: 1, sink: 0.3, move: [mx, up, mz], t0: lineTime(x, z, clamp(horAt(x, z), 0, 0.03)) + rng.range(0.8, 6),
      tau: rng.range(5, 13), spin: rng.range(0.08, 0.5) * rng.sign() });
    i++;
    if ((i & 63) === 0) await ctx.yield();
  }
  // cliff shards
  const nShard = 110;
  for (let i = 0; i < nShard; i++) {
    const z = rng.range(cliff.z0 + 4, cliff.z1 - 4), y = rng.range(4, cliff.top - 2), x = cliff.x0 - rng.range(1, 6);
    const slab = clamp(Math.floor(((z - cliff.z0) / (cliff.z1 - cliff.z0)) * 5), 0, 4);
    addRock(x, z, rng.range(0.6, 2.4), { kind: 2, y, sink: 0, hor: -0.05,
      move: [-rng.range(6, 30), rng.range(-0.5, 0.9) * 40 - y * 0.25, rng.range(-18, 18)],
      t0: cliffTime + slabDelay(slab) + rng.range(0.2, 3.5), tau: rng.range(3.5, 8), spin: rng.range(0.15, 0.8) * rng.sign() });
  }
  function slabDelay(i) { return [1.1, 0.0, 0.5, 1.7, 2.4][i]; }

  // splat the static rocks into the horizon field so they throw real, shortening shadows
  await ctx.yield();
  for (let n = 0; n < nStatic; n++) {
    if ((n & 15) === 15) await ctx.yield();
    const rk = rocks[n]; if (rk.r < 1.4) continue;
    const top = rk.y + rk.sy * 0.92, rad = Math.max(rk.sx, rk.sz) * 0.95, len = Math.min(380, rk.sy * 2 / 0.045);
    const ex = rk.x + away.x * len, ez = rk.z + away.y * len;
    const i0 = Math.max(0, Math.floor((Math.min(rk.x, ex) - rad * 2 + HX) / cellX)), i1 = Math.min(NX, Math.ceil((Math.max(rk.x, ex) + rad * 2 + HX) / cellX));
    const j0 = Math.max(0, Math.floor((Math.min(rk.z, ez) - rad * 2 + HZ) / cellZ)), j1 = Math.min(NZ, Math.ceil((Math.max(rk.z, ez) + rad * 2 + HZ) / cellZ));
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
      const dx = -HX + i * cellX - rk.x, dz = -HZ + j * cellZ - rk.z;
      const al = dx * away.x + dz * away.y, pe = Math.abs(dx * away.y - dz * away.x);
      if (al < rad * 0.3 || pe > rad * 1.5) continue;
      const w = 1 - smoothstep(rad * 0.55, rad * 1.5, pe), o = j * VX + i;
      const t = ((top - Hh[o]) / al) * w; if (t > Hor[o]) Hor[o] = Math.min(t, 0.8);
    }
  }

  // ------------------------------------------------------------ shared uniforms
  const crustCol = pal[1].clone();
  { const l = 0.2126 * crustCol.r + 0.7152 * crustCol.g + 0.0722 * crustCol.b; crustCol.multiplyScalar(0.043 / Math.max(l, 1e-4)); crustCol.lerp(new THREE.Color(0.085, 0.043, 0.024), 0.55); }
  if (crustKind === 'rust') crustCol.lerp(new THREE.Color(0.2, 0.075, 0.032), 0.75);
  crustCol.offsetHSL(rng.range(-0.012, 0.012), 0, 0);
  const dustCol = pal[5].clone().multiplyScalar(0.075).lerp(crustCol.clone().multiplyScalar(1.5), 0.5);
  const U = {
    uS: { value: 0 }, uTime: { value: 0 }, uLineQ: { value: terminatorQ(0) }, uRc: { value: RC }, uPen: { value: PEN },
    uElevMax: { value: ELEV_MAX }, uSunI: { value: 5.2 }, uSpeed: { value: lineSpeed }, uIce: { value: crustKind === 'rust' ? 1 : 0 },
    uAway: { value: away }, uSunCol: { value: pal[3].clone() }, uFrostCol: { value: pal[2].clone() }, uIonCol: { value: pal[6].clone() },
    uCrust: { value: crustCol }, uDust: { value: dustCol }, uGrain: { value: pal[4].clone() },
    uCliffT: { value: cliffTime }, uRes: { value: new THREE.Vector2(800, 450) }, uVigor: { value: vigor },
  };
  const shared = (extra = {}) => Object.assign(fogUniforms(), U, extra);

  // ------------------------------------------------------------ crust mesh
  const group = new THREE.Group(); group.name = 'perihelion-hero';
  const jetArr = [];
  for (let i = 0; i < MAXJ; i++) jetArr.push(new THREE.Vector4(0, 0, 1e6, 1));
  {
    const pos = new Float32Array(nV * 3), aHor = new Float32Array(nV), aMat = new Float32Array(nV * 3);
    for (let j = 0; j < VZ; j++) { if (j & 1) await ctx.yield(); for (let i = 0; i < VX; i++) {
      const o = j * VX + i, x = -HX + i * cellX, z = -HZ + j * cellZ, h = Hh[o];
      pos[o * 3] = x; pos[o * 3 + 1] = h; pos[o * 3 + 2] = z; aHor[o] = Hor[o];
      const ia = Math.max(i - 3, 0), ib = Math.min(i + 3, NX), ja = Math.max(j - 3, 0), jb = Math.min(j + 3, NZ);
      const conc = (Hh[j * VX + ia] + Hh[j * VX + ib] + Hh[ja * VX + i] + Hh[jb * VX + i]) * 0.25 - h;
      const frost = clamp(0.3 + conc * 0.45 + HorGround[o] * 2.5 + noise.fbm2(x / 55, z / 55 + 40, 3) * 0.7 + pondA[o] * 0.25, 0, 1);
      aMat[o * 3] = pondA[o]; aMat[o * 3 + 1] = frost; aMat[o * 3 + 2] = 0.5 + 0.5 * noise.fbm2(x / 120 + 9, z / 120, 3);
    } }
    await ctx.yield();
    const idx = new Uint32Array(NX * NZ * 6); let k = 0;
    for (let j = 0; j < NZ; j++) for (let i = 0; i < NX; i++) {
      const a = j * VX + i, b = a + 1, c = a + VX, d = c + 1;
      if ((i + j) & 1) { idx[k++] = a; idx[k++] = c; idx[k++] = b; idx[k++] = b; idx[k++] = c; idx[k++] = d; }
      else { idx[k++] = a; idx[k++] = c; idx[k++] = d; idx[k++] = a; idx[k++] = d; idx[k++] = b; }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('aHor', new THREE.BufferAttribute(aHor, 1));
    g.setAttribute('aMat', new THREE.BufferAttribute(aMat, 3));
    g.setIndex(new THREE.BufferAttribute(idx, 1));
    await ctx.yield();
    g.computeVertexNormals();
    await ctx.yield();
    g.computeBoundingSphere();
    await ctx.yield();
    const mat = new THREE.ShaderMaterial({
      fog: true, uniforms: shared({ uJets: { value: jetArr } }),
      defines: { MAXJ },
      vertexShader: /* glsl */`
        attribute float aHor; attribute vec3 aMat;
        varying vec3 vP, vN, vMat, vEye; varying float vHor;
        ${FOG_V}
        void main(){
          vP = position; vN = normal; vMat = aMat; vHor = aHor;
          vEye = (inverse(modelMatrix) * vec4(cameraPosition, 1.)).xyz - position;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.);
          gl_Position = projectionMatrix * mvPosition;
          #include <fog_vertex>
        }`,
      fragmentShader: /* glsl */`
        ${GLSL_COMMON}
        uniform vec3 uCrust, uDust; uniform vec4 uJets[MAXJ];
        varying vec3 vP, vN, vMat, vEye; varying float vHor;
        ${GLSL_CRUST}
        ${FOG_F}
        float uKnob;
        // (polish) from the air: bowls with raised rims at two sizes, so the crown carries the same crisp marks as the body under it
        float crat(vec2 p){
          vec2 i = floor(p), f = fract(p);
          float h = h21(i + 7.3);
          vec2 c = 0.5 + (vec2(h21(i + 1.7), h21(i + 9.2)) - 0.5) * 0.36;
          float r = 0.1 + 0.16 * h21(i + 4.4);
          float d = length(f - c) / r, dm = d - 1.;
          return step(0.66, h) * r * (-0.7 * max(1. - d * d, 0.) + 0.3 * exp(-dm * dm / 0.045));
        }
        float reliefC(vec2 q, float w2, float w3){ return 62. * crat(q / 62. + 5.3) * w2 + 21. * crat(q / 21. + 11.7) * w3; }
        float bumpH(vec2 p, float pond){
          float b = fbm3(p * 0.29) * 0.9 + fbm3(p * 1.25 + 11.) * 0.3;
          float kn = vn(p * 0.5 + 3.); kn = kn * kn * kn * 2.4 * smoothstep(0.5, 0.68, fbm3(p * 0.021 + 8.)) * uKnob;
          b += fbm3(p * 4.3 + 2.) * 0.085;
          float rip = sin(dot(p, vec2(0.8, 0.45)) * 1.5 + fbm3(p * 0.07) * 9.) * 0.07 + fbm3(p * 0.6) * 0.08;
          return mix(b + kn, rip, pond);
        }
        void main(){
          vec2 p = vP.xz; float dist = length(vEye);
          float pond = smoothstep(0.35, 0.8, vMat.x);
          float e = 0.22 + dist * 0.004;
          uKnob = 1. - smoothstep(120., 320., dist);
          float b0 = bumpH(p, pond), bx = bumpH(p + vec2(e, 0.), pond), bz = bumpH(p + vec2(0., e), pond);
          float amp = 1.0 / (1. + dist * 0.0022);
          vec3 Ng = normalize(vN);
          float farD = smoothstep(120., 420., dist);
          float cw2 = farD * (1. - smoothstep(900., 1900., dist)) * (1. - pond), cw3 = farD * (1. - smoothstep(260., 520., dist)) * (1. - pond);
          float cmask = smoothstep(0.4, 0.62, fbm3(p * 0.0035 + 13.)); cw2 *= cmask; cw3 *= cmask;
          float ce = clamp(dist * 0.004, 0.6, 6.), cr0 = reliefC(p, cw2, cw3);
          vec3 gcr = vec3(cr0 - reliefC(p + vec2(ce, 0.), cw2, cw3), 0., cr0 - reliefC(p + vec2(0., ce), cw2, cw3)) / ce;
          vec3 N = normalize(Ng + vec3(-(bx - b0), 0., -(bz - b0)) / e * amp + gcr * 1.1);
          float steep = smoothstep(0.07, 0.38, 1. - Ng.y);
          float strata = vn(vec2(vP.y * 0.8 + fbm3(p * 0.03) * 3., 0.5));
          float strata2 = vn(vec2(vP.y * 3.1 + fbm3(p * 0.05) * 2., 7.5));
          float farK = smoothstep(220., 800., dist), rimK = smoothstep(0.72, 0.98, length(p / vec2(${HX}., ${HZ}.)));
          float grainK = (1. - 0.85 * farK) * (1. - rimK);              // strata and pebble shadows are a close-up texture: from the air they read as wood grain
          vec3 alb = uCrust * (0.55 + 0.9 * vMat.z) * mix(1., (0.4 + 0.9 * strata) * (0.55 + 0.6 * smoothstep(0.4, 0.6, strata2)), steep * grainK);
          alb *= 0.7 + 0.6 * fbm3(p * 0.8 + 3.);
          float soot = smoothstep(0.42, 0.62, fbm3(p * 0.035 + 17.));
          alb *= mix(1., mix(0.36, 0.64, farK), soot * (1. - steep));                  // charcoal lag patches on the flats (softer from the air: no camouflage)
          alb = mix(alb, alb.ggg * vec3(1.05, 1., 0.95) * 0.95, steep * 0.35 * grainK);   // greyer scarp faces
          alb = mix(alb, uDust * (0.85 + 0.3 * fbm3(p * 0.11)), pond * 0.85);
          alb = mix(alb, vec3(dot(alb, vec3(0.3, 0.5, 0.2))) * vec3(1.08, 0.96, 0.84), 0.3 * farK) * (1. - 0.18 * farK);   // from the air: burnt toast, not orange
          float ice = uIce * smoothstep(0.6, 0.66, fbm3(p * 0.014 + 5.) + b0 * 0.03);
          alb = mix(alb, vec3(0.15, 0.17, 0.19) * (0.6 + 0.8 * fbm3(p * 0.5 + 1.)), ice * 0.85);
          // fountain shadows: long stripes down-sun of every lit vent
          float te = max(tanElev(p), 0.05), sh = 0.;
          vec2 perp = vec2(uAway.y, -uAway.x);
          for (int i = 0; i < MAXJ; i++) {
            vec4 J = uJets[i]; vec2 r = p - J.xy;
            float al = dot(r, uAway), pe = abs(dot(r, perp));
            float env = smoothstep(0., 2.5, uS - J.z), len = J.w * env / te, w = 3. + al * 0.05 + 3.5 * farK;
            sh += env * smoothstep(2., 9., al) * (1. - smoothstep(w * 0.45, w * 1.2, pe)) * (1. - smoothstep(len * 0.5, len, al)) * 0.66;
          }
          float frostM = clamp(vMat.y * (0.6 + 0.8 * fbm3(p * 0.21 + 2.)) + (0.5 - b0 * 0.4) * 0.3, 0., 1.);
          // every pebble throws a shadow twenty times its height: noise stretched down-sun, longer when the sun is lower
          vec2 sp = vec2(dot(p, perp), dot(p, uAway));
          float stretch = mix(0.05, 0.16, smoothstep(0.03, 0.28, te));
          float peb = smoothstep(0.56, 0.7, fbm3(vec2(sp.x * 0.75, sp.y * stretch) + 3.3)) * 0.6
                    + smoothstep(0.6, 0.72, fbm3(vec2(sp.x * 2.6, sp.y * stretch * 3.) + 8.1)) * 0.45 / (1. + dist * 0.01);
          float shade = (1. - min(sh, 0.78)) * (1. - min(peb, 0.8) * (1. - pond) * (1. - steep) * grainK);
          // (polish) from the air: boulder fields with their shadows thrown down-sun, hairline cracks, and shadow edges broken up
          // by the ground's own grain instead of the soft blobs a 4 m grid gives
          vec2 bq = p / 11., bi = floor(bq), bf = fract(bq) - 0.5 - (vec2(h21(bi + 2.1), h21(bi + 6.6)) - 0.5) * 0.5;
          float brr = 0.08 + 0.1 * h21(bi + 3.3), bon = step(0.6, h21(bi + 9.9)) * smoothstep(0.42, 0.6, fbm3(p * 0.007 + 2.)) * farD * (1. - smoothstep(500., 1000., dist)) * (1. - pond);
          float bould = bon * (1. - smoothstep(brr * 0.7, brr, length(bf)));
          vec2 bs = bf - uAway * brr * 2.4;
          float bshad = bon * (1. - smoothstep(brr * 0.8, brr * 2.8, length(bs - uAway * dot(bs, uAway) * 0.55)));
          float ck = abs(fbm3(p * 0.023 + 5.) - 0.5), ckw = 0.006 + dist * 0.000012;
          float crack = (1. - smoothstep(ckw * 0.4, ckw, ck)) * farD * (1. - smoothstep(900., 2200., dist)) * (1. - pond);
          alb *= (1. + 0.9 * bould) * (1. - 0.5 * crack);
          shade *= (1. - 0.75 * bshad * (1. - bould)) * (1. - 0.5 * crack);
          float horB = vHor + (fbm3(p * 0.11 + 4.) - 0.47) * 0.05 * farD;
          vec3 col = crustShade(alb, N, vP, horB, frostM, 0., dist, shade);
          #ifdef USE_FOG
            col = mix(col, fogColor, fogAmount());
          #endif
          gl_FragColor = vec4(col, 1.);
        }`,
    });
    const mesh = new THREE.Mesh(g, mat); mesh.name = 'crust'; mesh.frustumCulled = false; group.add(mesh);
  }
  await ctx.yield();

  // ------------------------------------------------------------ rocks: one instanced draw
  {
    const base = new THREE.IcosahedronGeometry(1, 1);          // non-indexed, 80 faces
    const bp = base.attributes.position, rn = makeNoise(rng.int(1, 1e9));
    for (let i = 0; i < bp.count; i++) {
      let x = bp.getX(i), y = bp.getY(i), z = bp.getZ(i);
      const d = 1 + 0.28 * rn.n3(x * 1.1, y * 1.1, z * 1.1) + 0.14 * rn.n3(x * 2.7 + 5, y * 2.7, z * 2.7);
      x *= d; y *= d; z *= d;
      // chisel two flats so the silhouette is angular, not a ball
      const f1 = x * 0.62 + y * 0.5 + z * 0.6; if (f1 > 0.72) { const o = f1 - 0.72; x -= 0.62 * o; y -= 0.5 * o; z -= 0.6 * o; }
      const f2 = -x * 0.8 + y * 0.3 - z * 0.52; if (f2 > 0.66) { const o = f2 - 0.66; x += 0.8 * o; y -= 0.3 * o; z += 0.52 * o; }
      bp.setXYZ(i, x, y, z);
    }
    base.computeVertexNormals();
    const g = new THREE.InstancedBufferGeometry();
    g.setAttribute('position', bp); g.setAttribute('normal', base.attributes.normal);
    const n = rocks.length; g.instanceCount = n;
    const aPos = new Float32Array(n * 3), aScl = new Float32Array(n * 3), aMove = new Float32Array(n * 3), aQuat = new Float32Array(n * 4), aAnim = new Float32Array(n * 4), aTone = new Float32Array(n * 2);
    rocks.forEach((r, i) => {
      aPos.set([r.x, r.y, r.z], i * 3); aScl.set([r.sx, r.sy, r.sz], i * 3); aMove.set(r.move, i * 3); aQuat.set(r.q, i * 4);
      aAnim.set([r.t0, r.tau, r.spin, r.kind], i * 4); aTone.set([r.hor, r.tone], i * 2);
    });
    const ia = (arr, s) => new THREE.InstancedBufferAttribute(arr, s);
    g.setAttribute('aPos', ia(aPos, 3)); g.setAttribute('aScl', ia(aScl, 3)); g.setAttribute('aMove', ia(aMove, 3));
    g.setAttribute('aQuat', ia(aQuat, 4)); g.setAttribute('aAnim', ia(aAnim, 4)); g.setAttribute('aTone', ia(aTone, 2));
    const mat = new THREE.ShaderMaterial({
      fog: true, uniforms: shared(),
      vertexShader: /* glsl */`
        ${GLSL_COMMON}
        attribute vec3 aPos, aScl, aMove; attribute vec4 aQuat, aAnim; attribute vec2 aTone;
        varying vec3 vP, vN, vL, vEye; varying vec3 vInfo; varying float vFl;
        ${FOG_V}
        vec3 qrot(vec4 q, vec3 v){ return v + 2. * cross(q.xyz, cross(q.xyz, v) + q.w * v); }
        vec3 axrot(vec3 v, vec3 k, float a){ float c = cos(a), s = sin(a); return v * c + cross(k, v) * s + k * dot(k, v) * (1. - c); }
        void main(){
          float kind = aAnim.w, t = uS - aAnim.x, tt = max(t, 0.);
          float fl = min(kind, 1.);
          float e = fl * (1. - exp(-tt / aAnim.y));
          vec3 lp = position * aScl, n = normalize(mix(normal, normalize(position), 0.5) / aScl);
          lp = qrot(aQuat, lp); n = qrot(aQuat, n);
          vec3 k = normalize(vec3(0.31, 0.2, 0.12) + abs(aMove.zxy) * 0.02 + aQuat.xyz);
          float ang = fl * aAnim.z * tt * smoothstep(0., 3., tt);
          lp = axrot(lp, k, ang); n = axrot(n, k, ang);
          if (kind > 1.5) lp *= smoothstep(0., 0.3, t);
          vec3 mv = aMove * e; mv.y += fl * sin(uTime * 0.35 + aAnim.x * 7.) * 0.7 * e;
          vec3 P = aPos + lp + mv;
          vL = position; vP = P; vN = n;
          vInfo = vec3(aTone.x, aTone.y, (lp.y + mv.y) * 0.0035 + (kind > 1.5 ? 0.2 : 0.)); vFl = fl;
          if (kind > 0.5) vInfo.x = mix(aTone.x, -0.1, smoothstep(0., 0.15, e));
          vEye = (inverse(modelMatrix) * vec4(cameraPosition, 1.)).xyz - P;
          vec4 mvPosition = modelViewMatrix * vec4(P, 1.);
          gl_Position = projectionMatrix * mvPosition;
          #include <fog_vertex>
        }`,
      fragmentShader: /* glsl */`
        ${GLSL_COMMON}
        uniform vec3 uCrust;
        varying vec3 vP, vN, vL, vEye; varying vec3 vInfo; varying float vFl;
        ${GLSL_CRUST}
        ${FOG_F}
        void main(){
          vec3 N = normalize(vN);
          vec2 q = vL.xz * 2.3 + vL.y * 1.9;
          float n1 = fbm3(q * 1.3 + vInfo.y * 30.), n2 = fbm3(q * 4. + 9.);
          N = normalize(N + (vec3(n1, n2, fbm3(q * 2.1 + 4.)) - 0.5) * 0.9);
          float band = vn(vec2(vL.y * 4. + n1 * 2., vInfo.y * 9.));
          vec3 alb = uCrust * (0.35 + 0.5 * vInfo.y) * (0.45 + 0.7 * n1 + 0.5 * band * n2);
          alb = mix(alb, alb.ggg * 1.2, 0.3 * band);
          float frostM = clamp(0.25 + 0.7 * dot(N, vec3(uAway.x, 0.5, uAway.y)), 0., 1.) * (0.5 + 0.8 * n2) * (1. - vFl);
          vec3 col = crustShade(alb, N, vP, vInfo.x, frostM, vInfo.z, length(vEye), 1.);
          #ifdef USE_FOG
            col = mix(col, fogColor, fogAmount());
          #endif
          gl_FragColor = vec4(col, 1.);
        }`,
    });
    const mesh = new THREE.Mesh(g, mat); mesh.name = 'rocks'; mesh.frustumCulled = false; group.add(mesh);
    base.dispose();
  }
  await ctx.yield();

  // ------------------------------------------------------------ the undercut cliff: five slabs
  const cliffFoot = [];
  {
    await ctx.yield();
    const geos = [], depth = 17, cuts = [0, 0.17, 0.41, 0.58, 0.82, 1].map((c, i) => (i > 0 && i < 5 ? c + rng.range(-0.035, 0.035) : c));
    for (let i = 0; i < 5; i++) {
      const segW = (cuts[i + 1] - cuts[i]) * (cliff.z1 - cliff.z0), zc = cliff.z0 + (cuts[i] + cuts[i + 1]) * 0.5 * (cliff.z1 - cliff.z0), w = segW * 1.03;
      const baseY = heightAt(cliff.x0 - 9, zc) - 3, H = cliff.top - baseY + rng.range(-7, 4);
      const xc = cliff.x0 + rng.range(-3, 2.5);
      const g = new THREE.BoxGeometry(depth, H, w, 3, 13, 6);
      const p = g.attributes.position, sd = rng.range(0, 100);
      for (let v = 0; v < p.count; v++) {
        let x = p.getX(v), y = p.getY(v) + H / 2, z = p.getZ(v);
        const u = y / H, front = clamp(-x / (depth / 2), 0, 1), zs = z / (w / 2);
        // undercut: the base is eaten back, the brow hangs out, the top is rounded off
        x -= front * (lerp(-2.5, 6.5, smoothstep(0.05, 0.62, u)) - 3.5 * smoothstep(0.86, 1, u));
        x -= front * (Math.round(noise.n2(y / 6.5 + sd, z / 40) * 2.2) * 0.9 + noise.fbm2(y / 9 + sd, z / 9, 3) * 1.6);   // ledges
        x += front * (zs * zs * 0.9 + noise.fbm2((z + zc) / 26, y / 40 + sd, 3) * 3.2);                                                                                   // faces bow, so the joints read as dark cracks
        z *= 1 - 0.05 * front - 0.04 * u;
        if (u > 0.97) y += noise.fbm2(x / 8 + sd, z / 8, 2) * 2.5 - front * 1.5;
        p.setXYZ(v, x, y, z);
      }
      g.computeVertexNormals();
      const n = p.count, aSlab = new Float32Array(n * 4), aRnd = new Float32Array(n * 3);
      const ang = rng.range(0.3, 0.5), sink = rng.range(11, 20), yaw = rng.range(-0.12, 0.12);
      for (let v = 0; v < n; v++) { aSlab.set([xc - depth * 0.3, baseY, zc, slabDelay(i)], v * 4); aRnd.set([ang, sink, yaw], v * 3); }
      g.setAttribute('aSlab', new THREE.BufferAttribute(aSlab, 4)); g.setAttribute('aRnd', new THREE.BufferAttribute(aRnd, 3));
      g.translate(depth * 0.3, 0, 0);        // local x measured from the pivot line (front foot)
      geos.push(g); cliffFoot.push([xc - depth * 0.5, baseY + 3, zc]);
      await ctx.yield();
    }
    const g = mergeGeometries(geos); geos.forEach((x) => x.dispose());
    const mat = new THREE.ShaderMaterial({
      fog: true, uniforms: shared(),
      vertexShader: /* glsl */`
        ${GLSL_COMMON}
        uniform float uCliffT;
        attribute vec4 aSlab; attribute vec3 aRnd;
        varying vec3 vP, vN, vL, vEye; varying float vK;
        ${FOG_V}
        void main(){
          float t = uS - (uCliffT + aSlab.w);
          float k = pow(smoothstep(0., 6.5, t), 1.4);
          float a = k * aRnd.x, c = cos(a), s = sin(a);
          float ya = k * aRnd.z, cy = cos(ya), sy = sin(ya);
          vec3 lp = position, n = normal;
          lp = vec3(lp.x * c - lp.y * s, lp.x * s + lp.y * c, lp.z); n = vec3(n.x * c - n.y * s, n.x * s + n.y * c, n.z);
          lp = vec3(lp.x * cy + lp.z * sy, lp.y, -lp.x * sy + lp.z * cy); n = vec3(n.x * cy + n.z * sy, n.y, -n.x * sy + n.z * cy);
          vec3 P = aSlab.xyz + lp + vec3(-6. * k, -aRnd.y * k, 0.);
          P.x += sin(t * 9. + aSlab.z) * 0.12 * smoothstep(-0.8, 0., t) * (1. - smoothstep(0., 2.5, t)) * position.y * 0.03;   // the shudder before it goes
          vL = position + aSlab.zzz; vP = P; vN = n; vK = k;
          vEye = (inverse(modelMatrix) * vec4(cameraPosition, 1.)).xyz - P;
          vec4 mvPosition = modelViewMatrix * vec4(P, 1.);
          gl_Position = projectionMatrix * mvPosition;
          #include <fog_vertex>
        }`,
      fragmentShader: /* glsl */`
        ${GLSL_COMMON}
        uniform vec3 uCrust;
        varying vec3 vP, vN, vL, vEye; varying float vK;
        ${GLSL_CRUST}
        ${FOG_F}
        void main(){
          vec3 N = normalize(vN);
          vec2 q = vec2(vL.z * 0.35 + vL.x * 0.3, vL.y * 0.9);
          float n1 = fbm3(q * 0.6), n2 = fbm3(q * 2.4 + 5.);
          float band = vn(vec2(vL.y * 0.55 + n1 * 1.5, 3.5)), fine = vn(vec2(vL.y * 2.6 + n2 * 1.2, 8.5));
          float e = 0.25;
          float bx = fbm3((q + vec2(e, 0.)) * 2.4 + 5.), by = fbm3((q + vec2(0., e)) * 2.4 + 5.);
          float led = vn(vec2(vL.y * 0.55 + 0.12 + n1 * 1.5, 3.5)) - band;                      // slope of the layering: ledges
          N = normalize(N + vec3(0.25 * (bx - n2) / e, led * 7. + (by - n2) / e * 0.3, 0.25 * (bx - n2) / e) * 0.4);
          float lay = smoothstep(0.35, 0.65, band);
          vec3 alb = uCrust * mix(0.38, 1.25, lay) * (0.75 + 0.5 * fine) * (0.7 + 0.6 * n1);
          alb = mix(alb, alb.ggg * 1.1, 0.35 * (1. - lay));
          float frostM = clamp(0.2 + 0.6 * n2 + 0.5 * (1. - band), 0., 1.) * 0.8;
          vec3 col = crustShade(alb, N, vP, -0.03, frostM, vP.y * 0.003, length(vEye), 1.);
          #ifdef USE_FOG
            col = mix(col, fogColor, fogAmount());
          #endif
          gl_FragColor = vec4(col, 1.);
        }`,
    });
    const mesh = new THREE.Mesh(g, mat); mesh.name = 'cliff'; mesh.frustumCulled = false; group.add(mesh);
  }

  await ctx.yield();
  // ------------------------------------------------------------ jets: ignition order
  const nearJets = vents.slice().sort((a, b) => a.z - b.z);
  for (const v of nearJets) v.ignite = v.cliff ? cliffTime + 1.4 : lineTime(v.x, v.z, 0) + rng.range(0.4, 1.2);
  nearJets.sort((a, b) => a.ignite - b.ignite);
  for (let i = 1; i < nearJets.length; i++) if (!nearJets[i].cliff && nearJets[i].ignite - nearJets[i - 1].ignite < 0.36) nearJets[i].ignite = nearJets[i - 1].ignite + 0.36;
  for (const v of farVents) v.ignite = lineTime(v.x, v.z, 0) + rng.range(0.5, 3);
  // (polish) four fountains near the entry never sleep: their heads stand in sunlight above the night, so the arrival has
  // tall jets close by on both sides of the avenue
  {
    const taken = new Set();
    for (const [zt, side] of [[215, -1], [150, 1], [85, -1], [20, 1]]) {
      let best = null, bd = 1e9;
      for (const v of nearJets) { if (v.cliff || v.side !== side || taken.has(v)) continue; const dd = Math.abs(v.z - zt); if (dd < bd) { bd = dd; best = v; } }
      if (best) { taken.add(best); best.ignite = -6; }
    }
    nearJets.sort((a, b) => a.ignite - b.ignite);
  }
  nearJets.forEach((v, i) => { v.tau = rng.range(1.35, 1.9); v.seed = rng(); if (i < MAXJ) jetArr[i].set(v.x, v.z, v.ignite, v.H); });
  farVents.forEach((v) => { v.tau = rng.range(1.8, 3.2); v.seed = rng(); });
  const allJets = nearJets.concat(farVents);

  const GLSL_JET = /* glsl */`
    vec3 jetAxis(float seed){ float a = seed * 43.; return normalize(vec3(cos(a) * 0.1, 1., sin(a) * 0.1)); }
  `;
  // grains: streak sprites on ballistic arcs, pushed down-sun
  {
    const per = Math.round(400 * detail), n = nearJets.length * per;
    const g = new THREE.InstancedBufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array([-0.5, 0, 0, 0.5, 0, 0, -0.5, 1, 0, 0.5, 1, 0]), 3));
    g.setIndex([0, 1, 2, 2, 1, 3]); g.instanceCount = n;
    const aVent = new Float32Array(n * 3), aJ = new Float32Array(n * 4), aR = new Float32Array(n * 4);
    let o = 0;
    for (const v of nearJets) {
      for (let i = 0; i < per; i++, o++) {
        aVent.set([v.x, v.y, v.z], o * 3); aJ.set([v.ignite, v.H, v.tau, v.seed], o * 4); aR.set([rng(), rng(), rng(), rng()], o * 4);
      }
      await ctx.yield();
    }
    g.setAttribute('aVent', new THREE.InstancedBufferAttribute(aVent, 3));
    g.setAttribute('aJ', new THREE.InstancedBufferAttribute(aJ, 4));
    g.setAttribute('aR', new THREE.InstancedBufferAttribute(aR, 4));
    const mat = new THREE.ShaderMaterial({
      fog: true, uniforms: shared(), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
      vertexShader: /* glsl */`
        ${GLSL_COMMON}
        ${GLSL_JET}
        uniform vec2 uRes; uniform vec3 uGrain;
        attribute vec3 aVent; attribute vec4 aJ, aR;
        varying vec2 vUv; varying vec3 vCol;
        ${FOG_V}
        vec3 grainPos(float age, vec3 axis, vec3 s1, vec3 s2, float rr){
          float H = aJ.y * (0.45 + 0.55 * aR.z), tau = aJ.z * (0.8 + 0.4 * aR.x);
          float hN = 1. - exp(-age / tau), h = H * hN, ang = aR.w * 6.2832;
          float spread = 0.8 + h * 0.03 + H * 0.3 * hN * hN * hN * hN * hN;
          vec3 P = aVent + axis * h + (s1 * cos(ang) + s2 * sin(ang)) * spread * rr;
          P.xz += uAway * (1.25 * age * age) * (0.5 + 0.9 * aR.x);
          P.y -= 0.22 * age * age;
          return P;
        }
        void main(){
          float tj = uS - aJ.x;
          float T = 7. + 3.5 * aR.x, ph = fract(uTime / T + aR.y), age = ph * T;
          float rr = sqrt(fract(aR.x * 17.31 + aR.w * 5.7));
          vec3 axis = jetAxis(aJ.w), s1 = normalize(cross(axis, vec3(0., 0., 1.))), s2 = cross(axis, s1);
          vec3 P0 = grainPos(age, axis, s1, s2, rr), P1 = grainPos(max(age - 0.055, 0.), axis, s1, s2, rr);
          vec4 c0 = projectionMatrix * modelViewMatrix * vec4(P0, 1.), c1 = projectionMatrix * modelViewMatrix * vec4(P1, 1.);
          vec4 mvPosition = modelViewMatrix * vec4(P0, 1.);
          float alive = smoothstep(0., 0.35, tj - age) * smoothstep(0., 0.8, tj) * smoothstep(0., 0.02, ph) * (1. - smoothstep(0.55, 1., ph));
          vec2 d = (c1.xy / max(c1.w, 0.01) - c0.xy / max(c0.w, 0.01)) * uRes;
          float dl = length(d); d = dl > 0.01 ? d / dl : vec2(0., 1.);
          float pxPerM = uRes.y * 0.5 * projectionMatrix[1][1] / max(c0.w, 0.01);
          float truePx = (0.16 + 0.2 * aR.z) * pxPerM, px = clamp(truePx, 1.7, 9.);
          vec4 c = mix(c0, c1, position.y);
          vec2 off = (vec2(-d.y, d.x) * position.x * px + d * (position.y - 0.5) * px) / uRes * 2.;
          c.xy += off * c.w;
          if (c0.w < 0.2 || c1.w < 0.2 || alive < 0.003) c = vec4(2., 2., 2., 1.);
          gl_Position = c;
          vec3 cam = (inverse(modelMatrix) * vec4(cameraPosition, 1.)).xyz;
          vec3 V = normalize(P0 - cam), L = sunL(tanElev(P0.xz) + 0.05);
          float fs = pow(max(dot(V, L), 0.), 5.);
          float core = mix(0.3, 1., rr) * (0.15 + 0.85 * smoothstep(0., 0.14, 1. - exp(-age / (aJ.z * (0.8 + 0.4 * aR.x)))));   // (polish) grains pile up in the throat: seen from above that sum is a white-hot pixel the glow turns into a square
          float I = (2.5 + 4. * fs + 2.6 * smoothstep(0.15, 0.6, -V.y)) * core * (0.5 + 0.9 * aR.y) * alive * clamp(truePx / 1.7, 0.14, 1.) * min(1., 9. / max(truePx, 9.));
          vCol = mix(uGrain, uSunCol, 0.3) * I;
          vUv = position.xy + vec2(0.5, 0.);
          #include <fog_vertex>
        }`,
      fragmentShader: /* glsl */`
        varying vec2 vUv; varying vec3 vCol;
        ${FOG_F}
        void main(){
          float x = vUv.x * 2. - 1., y = vUv.y * 2. - 1.;
          float a = max(1. - x * x, 0.) * max(1. - y * y, 0.) * 1.2;         // (polish) round at both ends: a grain seen end-on is a soft dot, never a square
          gl_FragColor = vec4(vCol * (1. - fogAmount()), a);
        }`,
    });
    const mesh = new THREE.Mesh(g, mat); mesh.name = 'grains'; mesh.frustumCulled = false; mesh.renderOrder = 3; group.add(mesh);
  }
  await ctx.yield();
  // cards: two crossed limb-bright sheets per jet with a dark core and scrolling streaks
  {
    const SEG = 8, pos = [], idx = [];
    for (let c = 0; c < 2; c++) for (let j = 0; j <= SEG; j++) for (let i = 0; i < 2; i++) pos.push(i * 2 - 1, j / SEG, c);
    for (let c = 0; c < 2; c++) for (let j = 0; j < SEG; j++) { const a = c * (SEG + 1) * 2 + j * 2; idx.push(a, a + 1, a + 2, a + 2, a + 1, a + 3); }
    const g = new THREE.InstancedBufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(pos), 3)); g.setIndex(idx);
    const n = allJets.length; g.instanceCount = n;
    const aVent = new Float32Array(n * 3), aJ = new Float32Array(n * 4), aK = new Float32Array(n);
    allJets.forEach((v, i) => { aVent.set([v.x, v.y - 1.5, v.z], i * 3); aJ.set([v.ignite, v.H, v.tau, v.seed], i * 4); aK[i] = v.near ? 1 : 0; });
    g.setAttribute('aVent', new THREE.InstancedBufferAttribute(aVent, 3));
    g.setAttribute('aJ', new THREE.InstancedBufferAttribute(aJ, 4));
    g.setAttribute('aK', new THREE.InstancedBufferAttribute(aK, 1));
    const mat = new THREE.ShaderMaterial({
      fog: true, uniforms: shared(), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
      vertexShader: /* glsl */`
        ${GLSL_COMMON}
        ${GLSL_JET}
        attribute vec3 aVent; attribute vec4 aJ; attribute float aK;
        varying vec3 vC; varying vec4 vJ; varying float vFace, vScat, vDown, vNear;
        ${FOG_V}
        void main(){
          float yN = position.y, side = position.x, H = aJ.y, tau = aJ.z;
          float ca = position.z * 1.5708 + aJ.w * 6.2832;
          vec3 sd = vec3(cos(ca), 0., sin(ca)), axis = jetAxis(aJ.w);
          float wid = (aK > 0.5 ? 1.5 : 3.) + H * 0.035 * yN + H * (aK > 0.5 ? 0.27 : 0.15) * yN * yN * yN * yN;
          vec3 P = aVent + axis * (H * 0.95 * yN) + sd * side * wid;
          float age = -tau * log(1. - yN * 0.93);
          P.xz += uAway * (1.25 * age * age);
          vec3 cam = (inverse(modelMatrix) * vec4(cameraPosition, 1.)).xyz;
          vec3 V = P - cam; float vl = max(length(V.xz), 0.001);
          vFace = abs(dot(vec2(-sd.z, sd.x), V.xz / vl));
          vec3 L = sunL(tanElev(P.xz) + 0.05);
          vScat = pow(max(dot(normalize(V), L), 0.), 4.);
          vDown = smoothstep(0.15, 0.6, -normalize(V).y);
          vNear = smoothstep(16., 75., length(V));                                // (polish) a card at the lens is a pane of glass: let it go, the grains carry the fountain there
          vC = vec3(side, yN, aK); vJ = aJ;
          vec4 mvPosition = modelViewMatrix * vec4(P, 1.);
          gl_Position = projectionMatrix * mvPosition;
          #include <fog_vertex>
        }`,
      fragmentShader: /* glsl */`
        ${GLSL_COMMON}
        uniform vec3 uGrain;
        varying vec3 vC; varying vec4 vJ; varying float vFace, vScat, vDown, vNear;
        ${FOG_F}
        void main(){
          float side = vC.x, yN = vC.y, tj = uS - vJ.x, H = vJ.y;
          float front = (1. - exp(-max(tj, 0.) / vJ.z)) / 0.93;
          float head = 1. - smoothstep(front - 0.26, front, yN);                        // a feathered crown, never a flat-topped bar
          float s2 = side * side;
          float prof = (1. - s2) * (1. - s2);
          float limb = prof * mix(0.22 + 2.6 * s2, 1., smoothstep(0.35, 0.9, yN));     // dark core low down, filled where it fans
          float st = vn(vec2(side * 6. + vJ.w * 31., yN * H * 0.0045 - uTime * 0.16));
          float st2 = vn(vec2(side * 17. + vJ.w * 11., yN * H * 0.013 - uTime * 0.5));
          vec2 gc = vec2(side * (10. + H * 0.05 * yN), yN * H * 0.55 - uTime * 26. * (1. - 0.6 * yN));
          float spk = step(0.86, h21(floor(gc) + vJ.w * 17.)) * (1. - smoothstep(0.1, 0.5, length(fract(gc) - 0.5)));
          float body = limb * (0.16 + 0.5 * st * st + 0.4 * st2 * st2 * st2) + prof * spk * 1.5 * mix(0.5, 1., vC.z);
          float fadeY = (1. - smoothstep(0.5, 1., yN)) * (0.35 + 0.65 * exp(-yN * 3.5)) * smoothstep(0., 0.012, yN);
          float I = body * fadeY * head * smoothstep(0., 0.8, tj) * mix(smoothstep(0.08, 0.55, vFace), 1., 0.6 * vDown);
          I *= (0.5 + 1.7 * vScat + 1.6 * vDown) * mix(0.75, 1.1, vC.z) * vNear * mix(1., 0.25 + 0.75 * smoothstep(0.02, 0.22, yN), vDown);
          I = min(I * 1.5, 7.);            // (polish) bounded: single sparkle pixels used to reach the hundreds, and the glow pass turned each into a white square
          // dim warm white on black reads as olive: the faint outskirts stay cool, the body white-gold
          vec3 col = mix(vec3(0.8, 0.88, 1.0), mix(uGrain, uSunCol, 0.35), smoothstep(0.02, 0.4, I)) * I * (1. - fogAmount());
          gl_FragColor = vec4(col, 1.);
        }`,
    });
    const mesh = new THREE.Mesh(g, mat); mesh.name = 'jet-cards'; mesh.frustumCulled = false; mesh.renderOrder = 2; group.add(mesh);
  }
  await ctx.yield();
  // (polish) halos: the mist of fines round every fountain, one soft sprite each, so the field glows as a whole and lights the
  // crust round it. (The glow used to come from stray sparkle pixels hundreds of times too bright; this is the same light, made on purpose.)
  {
    const g = new THREE.InstancedBufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array([-1, -1, 0, 1, -1, 0, -1, 1, 0, 1, 1, 0]), 3));
    g.setIndex([0, 1, 2, 2, 1, 3]);
    const n = allJets.length; g.instanceCount = n;
    const aVent = new Float32Array(n * 3), aJ = new Float32Array(n * 4);
    allJets.forEach((v, i) => { aVent.set([v.x, v.y, v.z], i * 3); aJ.set([v.ignite, v.H, v.tau, v.seed], i * 4); });
    g.setAttribute('aVent', new THREE.InstancedBufferAttribute(aVent, 3));
    g.setAttribute('aJ', new THREE.InstancedBufferAttribute(aJ, 4));
    const mat = new THREE.ShaderMaterial({
      fog: true, uniforms: shared(), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
      vertexShader: /* glsl */`
        ${GLSL_COMMON}
        uniform float uVigor;
        attribute vec3 aVent; attribute vec4 aJ;
        varying vec2 vUv; varying float vI;
        ${FOG_V}
        void main(){
          float tj = uS - aJ.x, H = aJ.y;
          float grow = 1. - exp(-max(tj, 0.) / max(aJ.z, 0.1));
          vec3 C = aVent + vec3(0., H * 0.36 * grow, 0.);
          C.xz += uAway * H * 0.1 * grow;
          vec4 mvPosition = modelViewMatrix * vec4(C, 1.);
          float dist = length(mvPosition.xyz);
          mvPosition.xy += position.xy * vec2(H * 0.42, H * 0.6) * (0.25 + 0.75 * grow);
          gl_Position = projectionMatrix * mvPosition;
          vec3 cam = (inverse(modelMatrix) * vec4(cameraPosition, 1.)).xyz;
          vec3 V = normalize(C - cam + vec3(0., 1e-4, 0.));
          float fs = max(dot(V, sunL(tanElev(C.xz) + 0.05)), 0.); fs *= fs; fs *= fs;
          float pulse = 0.85 + 0.15 * sin(uTime * (0.7 + aJ.w) + aJ.w * 40.);
          vI = smoothstep(0., 1.2, tj) * grow * (0.55 + 1.1 * fs) * smoothstep(50., 240., dist) * pulse;
          vUv = position.xy;
          #include <fog_vertex>
        }`,
      fragmentShader: /* glsl */`
        ${GLSL_COMMON}
        uniform vec3 uGrain;
        varying vec2 vUv; varying float vI;
        ${FOG_F}
        void main(){
          float r2 = dot(vUv, vUv);
          float a = exp(-r2 * 3.2) * max(1. - r2, 0.);
          float low = exp(-(vUv.y + 0.55) * (vUv.y + 0.55) * 6. - vUv.x * vUv.x * 9.);          // hotter round the throat
          vec3 col = mix(vec3(0.82, 0.9, 1.0), mix(uGrain, uSunCol, 0.35), 0.6) * (0.03 * a + 0.04 * low * max(1. - r2, 0.)) * vI * (1. - fogAmount());
          gl_FragColor = vec4(col, 1.);
        }`,
    });
    const mesh = new THREE.Mesh(g, mat); mesh.name = 'jet-halos'; mesh.frustumCulled = false; mesh.renderOrder = 1; group.add(mesh);
  }
  await ctx.yield();

  // ------------------------------------------------------------ veils: frost smoke and lifting pond dust
  {
    const list = [];
    const nW = Math.round(520 * detail);
    for (let i = 0, tries = 0; i < nW && tries < 6000; tries++) {
      const x = rng.gauss() * 110, z = rng.range(-440, 430);
      if (Math.abs(x) > 270 || inCliff(x, z, -6)) continue;
      const hz = horAt(x, z), pd = sampleArr(pondA, x, z);
      if (hz > 0.2 || (hz < 0.015 && pd < 0.3 && rng.chance(0.75))) continue;        // frost lives in hollows and shadowed faces
      list.push({ x, y: heightAt(x, z) + 0.5, z, t0: lineTime(x, z, Math.max(hz, 0)) + rng.range(0.1, 1.3), size: rng.range(4, 11), kind: 0 }); i++;
      if ((i & 127) === 0) await ctx.yield();
    }
    await ctx.yield();
    for (const p of ponds) for (let i = 0; i < 4; i++) {
      const a = rng.range(0, 6.283), d = rng.range(0, p.r * 0.35), x = p.x + Math.cos(a) * d, z = p.z + Math.sin(a) * d;
      list.push({ x, y: p.level + 0.6, z, t0: lineTime(p.x, p.z) + 0.8 + i * 1.7 + rng.range(0, 0.8), size: p.r * rng.range(0.75, 1.05), kind: 1 });
    }
    const n = list.length, g = new THREE.InstancedBufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array([-1, -1, 0, 1, -1, 0, -1, 1, 0, 1, 1, 0]), 3));
    g.setIndex([0, 1, 2, 2, 1, 3]); g.instanceCount = n;
    const aP = new Float32Array(n * 3), aV = new Float32Array(n * 4);
    list.forEach((w, i) => { aP.set([w.x, w.y, w.z], i * 3); aV.set([w.t0, w.size, w.kind, rng()], i * 4); });
    g.setAttribute('aP', new THREE.InstancedBufferAttribute(aP, 3)); g.setAttribute('aV', new THREE.InstancedBufferAttribute(aV, 4));
    const mat = new THREE.ShaderMaterial({
      fog: true, uniforms: shared(), transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending,
      vertexShader: /* glsl */`
        ${GLSL_COMMON}
        attribute vec3 aP; attribute vec4 aV;
        varying vec2 vUv; varying vec4 vI;
        ${FOG_V}
        void main(){
          float t = uS - aV.x, kind = aV.z, life = kind > 0.5 ? 16. : 3.4;
          float k = clamp(t / life, 0., 1.);
          vec3 C = aP; vec4 mvPosition; float a;
          if (kind > 0.5) {
            C.y += 1. + 46. * pow(k, 0.8); C.xz += uAway * 30. * k * k;
            float rot = aV.w * 6.28 + k * 0.6, cr = cos(rot), sr = sin(rot);
            vec2 q = vec2(position.x * cr - position.y * sr, position.x * sr + position.y * cr) * aV.y * (1. + 0.5 * k);
            C += vec3(q.x, sin(q.x * 0.11 + uTime * 0.4 + aV.w * 9.) * 2.5 * k + (position.x * position.y) * 6. * k, q.y);
            mvPosition = modelViewMatrix * vec4(C, 1.);
            a = smoothstep(0., 0.08, k) * (1. - k) * 0.5;
          } else {
            C.y += 1.5 + 17. * pow(k, 0.7); C.xz += uAway * 7. * k + vec2(sin(aV.w * 40.), cos(aV.w * 33.)) * 3. * k;
            mvPosition = modelViewMatrix * vec4(C, 1.);
            mvPosition.xy += position.xy * aV.y * (0.35 + 1.1 * k) * vec2(0.8, 1.7);
            a = smoothstep(0., 0.12, k) * pow(1. - k, 1.4) * 0.5;
          }
          if (t < 0. || t > life) mvPosition = vec4(0., 0., 1e6, 1.);
          gl_Position = projectionMatrix * mvPosition;
          vec3 cam = (inverse(modelMatrix) * vec4(cameraPosition, 1.)).xyz;
          float fs = pow(max(dot(normalize(C - cam), sunL(tanElev(C.xz) + 0.05)), 0.), 3.);
          vUv = position.xy; vI = vec4(a, kind, aV.w, 0.5 + 1.6 * fs);
          #include <fog_vertex>
        }`,
      fragmentShader: /* glsl */`
        ${GLSL_COMMON}
        uniform vec3 uDust;
        varying vec2 vUv; varying vec4 vI;
        ${FOG_F}
        void main(){
          float r = length(vUv);
          vec2 q = vUv * (vI.y > 0.5 ? vec2(2.6) : vec2(2.4, 0.8)) + vI.z * 23. + vec2(0., -uTime * (vI.y > 0.5 ? 0.02 : 0.1));
          float n = fbm3(q) + 0.5 * fbm3(q * 2.7 + 4.);
          float a = vI.x * (1. - smoothstep(0.3, 1., r)) * smoothstep(0.62, 1.1, n + (vI.y > 0.5 ? 0.1 : 0.12));
          vec3 tint = vI.y > 0.5 ? uDust * 6. : mix(uFrostCol, vec3(1.), 0.6) * 0.8;
          vec3 col = tint * uSunCol * 0.5 * vI.w * a * (1. - fogAmount());
          gl_FragColor = vec4(col, 1.);
        }`,
    });
    const mesh = new THREE.Mesh(g, mat); mesh.name = 'veils'; mesh.frustumCulled = false; mesh.renderOrder = 1; group.add(mesh);
  }
  await ctx.yield();

  // ------------------------------------------------------------ anchors, hooks
  const fracLine = (side) => { const a = []; for (let z = 320; z >= -340; z -= 30) { const x = fracX(side, z); a.push([x, heightAt(x, z), z]); } return a; };
  const cliffC = [cliff.x0, cliff.top * 0.5, (cliff.z0 + cliff.z1) / 2];
  const landerY = heightAt(15, 175);
  const el5 = 5 * Math.PI / 180;
  const anchors = {
    entry: { position: [0, 14, 325], heading: [0, 0, -1] },
    flyThrough: [[0, 14, 325], [0, 14, 150], [0, 14, -25], [0, 21, -110], [0, 37, -200], [0, 52, -280], [0, 60, -325]],
    exitHeading: [away.x * Math.cos(el5), Math.sin(el5), away.y * Math.cos(el5)],
    sunAzimuth: [-away.x, 0, -away.y], awayFromSun: [away.x, 0, away.y],
    landerSeat: { position: [15, landerY, 175], normal: [0, 1, 0] },
    nearBoulder: { position: [nearB.x, nearB.y + nearB.sy, nearB.z], radius: nearB.r },
    cliff: { center: cliffC, top: [cliff.x0 + 6, cliff.top, cliffC[2]], foot: cliffFoot, poi: [cliff.x0 - 6, cliff.top * 0.45, cliffC[2]] },
    fractures: { left: fracLine(-1), right: fracLine(1) },
    vents: nearJets.map((v) => ({ position: [v.x, v.y, v.z], ignite: v.ignite, height: v.H })),
    farVents: farVents.map((v) => ({ position: [v.x, v.y, v.z], ignite: v.ignite, height: v.H })),
    viewpoints: { entry: [0, 14, 325], avenue: [0, 22, -100], cliff: [4, 44, -215], above: [-270, 420, -90] },
  };

  let driven = false, sNow = 0;
  const applyS = (s) => { sNow = s; U.uS.value = s; U.uLineQ.value = terminatorQ(s); };
  applyS(0);
  const size = new THREE.Vector2();
  const hero = {
    object: group, radius: 200, height: 230, center: new THREE.Vector3(0, 45, -60),
    anchors, ground: false, groundY: 0, uniforms: U, heightAt, terminatorQ, lineTime,
    info: { vigor, crust: crustKind, vents: nearJets.length, farVents: farVents.length, rocks: rocks.length },
    setProgress(u) { driven = true; applyS(clamp(u, 0, 1) * duration); },
    setScriptTime(s) { driven = true; applyS(s); },
    get scriptTime() { return sNow; },
    sunDirAt(p, out = new THREE.Vector3()) {
      const te = clamp((U.uLineQ.value - qOf(p.x, p.z)) / RC, -0.4, ELEV_MAX);
      return out.set(-away.x, te, -away.y).normalize();
    },
    update(dt, time, camera) {
      U.uTime.value = time;
      if (!driven) applyS(time % 40);
      if (ctx.renderer) { ctx.renderer.getDrawingBufferSize(size); U.uRes.value.copy(size); }
    },
    dispose() {},
  };
  return hero;
}
