// THE STILLSTONE: hero set piece of "groundswell-country" (The Groundswell).
// The one thing in a rolling country that holds still: a 280 m granite tor of stacked, jointed blocks
// with a pale scoured band round its foot, nine wind-bent pines, ferns and turf rags in the joints, a
// natural arch on its shoulder with a dark bay behind it, and THE BREAK: the land climbs the foot,
// rears into a curling lip of turf (grass outside, soil and roots where it folds back), throws clods
// and a plume of white and magenta petals, then drains down 24 gullies in waterfalls of long grass.
//
// FRAME. Origin at the tor's axis at mean ground (y 0); +Y up; front (+Z) is UPSTREAM, the side the
// swell arrives on (it travels toward -Z locally). In the world the swell travels +Z, so place it with
// rotation.y = Math.PI at (-1100, 0, 1290): the arch then stands at world (-1020, 105, 1240).
// Size: radius ~190 (foot 340 across, waist ~190), rock from y -72 to 280. Angles: x = sin(a) r, z = cos(a) r.
//
// opts: palette (7 hex strings, brief order: grass, dark green, lime, daisy white, granite, sky, magenta),
//   detail 0.6-1 (thins rags, petals, puffs, clods; never the tor, lip, arch or pines),
//   skirt (default true) and skirtRadius (default 640): the ring of meadow the piece draws round its own
//   foot so it stands alone; in the world pass skirtRadius 200 (and cut your terrain inside it) or skirt false.
//
// HOOKS (all in the returned object):
//   setProgress(tw)       the wave clock in seconds; everything about the break is a pure function of it.
//                         Until it is called the piece runs on wall time.
//   setGroundSampler(fn)  fn(xLocal, zLocal, tw) -> ground height. Give it the world's swell() (heights; with
//                         rotation PI, world x = px - xLocal, z = pz - zLocal). The lip, skirt, clods, plume and
//                         waterfalls all follow it, so the break lands exactly where your land meets the rock.
//                         The built-in default is a twin of the brief's three trains whose crest reaches the
//                         upstream foot at tw 12.5 (+30 n): lip up from ~tw 4, plume 8-18, waterfalls 14-26.
//   setLight(dir, sunColor, skyColor)  world-space sun direction and linear colours for the petals, clods and
//                         waterfalls (the rock, pines, lip and skirt are MeshStandardMaterials lit by the scene).
//   contact(angle)        -> { y, r, lip } where the land meets the rock now (for audio, camera shake, cranes).
//   setShade(fn)          fn(xLocal, zLocal, lift, tw) -> 1 in the sun .. 0 in a swell's own shadow (low sun): the comber is then
//                         shaded like the meadow it rises from. setMeadow(tone) gives the meadow's tone at the foot.
// anchors (local space):
//   portalSeat { position, facing, travel, radius 7, tiltDeg 20 }: centre of the arch opening (16 x 18 m clear),
//     the portal's normal, and the camera's direction of travel (radially inward, climbing 20 degrees).
//   flyThrough: six points down that straight from 190 m out to the seat; >= 6 m clear of rock, and the petal
//     shader keeps a 6 m tube round this line empty. The lip passes ~40 m below it.
//   archFeet, bay (the dark recess 16 m behind the portal), summit, upstream (+Z), wind,
//   viewpoints { reveal, surf, waterfalls }, pines (the nine pine bases).
//
// LIGHT. Wants one warm key about 38 degrees up (intensity ~3) and a blue hemisphere fill; shade is held
// off black by a 5 % self-fill. Fog: every material takes scene fog. Petals peak near 1.2-1.8 linear so
// only sunlit ones bloom. No lights of its own.
// THE BREAK, in detail: the lip is a closed slab of turf up to ~48 m long in section and 6 m thick at the foot
// (grass side out); it stands up the rock, crests and leans out over the incoming meadow as one thick comber sewn
// into the land at its foot, turf on its face and top, soil and roots only where it hangs face down under the crest. A foam ring (daisies churned pale, with a soft contact shadow) lies on the sampled ground from the
// rock to 52 m out, so it also dresses a world's own land when skirt is false. Waterfalls remember the last
// crest for 26 s of wave time. The plume gathers on the side away from the arch (angle about +0.45).
// COST. ~125k triangles, 10 draw calls, ~300 ms build; per frame ~2 ms of JS (contact solve + foam + lip).
import * as THREE from 'three';
import { clamp, lerp, smoothstep } from '../kit/core.js';
import { makeRng as gsOwnRng } from '../kit/core.js';   // for streams of their own, seeded from the visit's seed: making one draws nothing from the part's or the world's streams

const DEFAULT_PALETTE = ['#5FA052', '#2F6B45', '#C9DC7A', '#F5F3EA', '#7C8791', '#8FC7E8', '#D9609A'];
const TAU = Math.PI * 2;
const ARCH = { x: -80, y: 96, z: 50 };            // arch feet (local); opening centre is 9 m higher
const ARCH_ANG = Math.atan2(ARCH.x, ARCH.z);      // angle convention everywhere: x = sin(a) r, z = cos(a) r
const ARCH_R = Math.hypot(ARCH.x, ARCH.z);

// ---------------------------------------------------------------- default swell (local frame: it travels toward -Z)
// JS twin of the brief's three trains, heights only (inside 200 m of the axis the brief removes the
// horizontal trochoid offset, so near the tor the land is a plain height field). The world replaces
// this with its own function through hero.setGroundSampler(fn).
function makeDefaultSwell(rng) {
  const tr = [
    { L: 600, A: 33, c: 20, ang: 0 },
    { L: 370, A: 5, c: 16, ang: 22 * Math.PI / 180 },
    { L: 210, A: 2, c: 12, ang: -31 * Math.PI / 180 },
  ].map((t) => ({ k: TAU / t.L, A: t.A, c: t.c, dx: Math.sin(t.ang), dz: -Math.cos(t.ang), ph: rng.range(0, TAU) }));
  tr[0].ph = tr[0].k * 420;                                       // its crest reaches the upstream foot at tw = 12.5 (+30 n)
  return (x, z, tw) => {
    let y = 0;
    for (let i = 0; i < 3; i++) {
      const t = tr[i], th = t.k * (t.dx * x + t.dz * z - t.c * tw) + t.ph;
      const cs = Math.cos(th);
      y += t.A * (cs + 0.22 * (cs * cs - 0.5) * 2 * 0.5);      // peaked crests, wide troughs
    }
    const r = Math.hypot(x, z);
    const up = smoothstep(-0.2, 0.5, z / Math.max(r, 1));       // 1 on the upstream (+Z) side
    const near = 1 - smoothstep(200, 330, r);
    const lee = (1 - up) * (1 - smoothstep(180, 620, r));
    return y * (1 + 0.35 * near * up) * (1 - 0.6 * lee);
  };
}

// ---------------------------------------------------------------- the tor's form: stacked, jointed blocks
// The tor is a radial surface r(angle, y) taken as the outermost hit over a pile of rotated boxes
// (tiers of a core and of buttress stacks), so it has ledges, vertical joints, overhangs and several
// summits instead of a cone.
function profile(y) {                                            // half-width of the mass at height y
  if (y < 0) return 170 - y * 0.32;
  if (y < 110) { const t = y / 110; return 95 + 75 * Math.pow(1 - t, 2.6); }      // a spreading foot, then walls
  if (y < 165) { const t = (y - 110) / 55; return 95 + 13 * Math.sin(t * Math.PI * 0.5); }
  const t = clamp((y - 165) / 70, 0, 1); return 108 - 50 * t * t;
}

function makeTorForm(rng, noise) {
  const boxes = [];
  const addStack = (ang, dist, y0, top, size, squareness) => {
    let y = y0, rot = rng.range(0, TAU);
    while (y < top) {
      const hgt = Math.min(top - y, rng.range(15, 46));
      const P = profile(y + hgt * 0.5);
      const d = dist * P + rng.range(-5, 5), a = ang + rng.range(-0.06, 0.06);
      rot += rng.range(-0.1, 0.1);
      const h = size * P * rng.range(0.88, 1.1);
      boxes.push({ y0: y - 1, y1: y + hgt, cx: Math.sin(a) * d, cz: Math.cos(a) * d,
        hx: h * rng.range(0.9, 1.1) * squareness, hz: h * rng.range(0.9, 1.1) / squareness,
        c: Math.cos(rot), s: Math.sin(rot), bev: rng.range(1.2, 3.2) });
      y += hgt;
    }
  };
  addStack(0, 0, -75, rng.range(196, 214), 0.64, 1);                              // core
  const nB = rng.int(7, 10), a0 = rng.range(0, TAU);
  for (let i = 0; i < nB; i++) {                                                  // buttress stacks
    const a = a0 + (i + rng.range(-0.3, 0.3)) / nB * TAU;
    addStack(a, rng.range(0.42, 0.56), -75, rng.range(120, 236), rng.range(0.36, 0.5), rng.range(0.8, 1.25));
  }
  const nS = rng.int(3, 4), s0 = rng.range(0, TAU);                               // summit stacks
  for (let i = 0; i < nS; i++) {
    const a = s0 + i / nS * TAU + rng.range(-0.4, 0.4), d = i === 0 ? 14 : rng.range(26, 46);
    let y = 185, top = i === 0 ? 280 : rng.range(226, 262), rot = rng.range(0, TAU), h = i === 0 ? 30 : rng.range(17, 25);
    while (y < top) {
      const hgt = Math.min(top - y, rng.range(9, 20)); rot += rng.range(-0.3, 0.3);
      boxes.push({ y0: y - 1, y1: y + hgt, cx: Math.sin(a) * d + rng.range(-3, 3), cz: Math.cos(a) * d + rng.range(-3, 3),
        hx: h * rng.range(0.85, 1.1), hz: h * rng.range(0.85, 1.1), c: Math.cos(rot), s: Math.sin(rot), bev: rng.range(1, 2.5) });
      y += hgt; h *= rng.range(0.8, 0.97);
    }
  }
  const gullies = [];                                                             // 24 drain gullies, upstream 200 deg
  for (let i = 0; i < 24; i++) gullies.push(((i + 0.5 + rng.range(-0.3, 0.3)) / 24 - 0.5) * (200 * Math.PI / 180));
  const jointY = []; for (let y = -70; y < 290;) { jointY.push(y); y += rng.range(6, 15); }
  const stepY = []; for (let i = 0; i < jointY.length; i += 2) stepY.push(jointY[i]);        // every second sheeting joint is a ledge of the worn foot

  let rowY = NaN, row = [];
  const rawR = (ang, y) => {
    const dx = Math.sin(ang), dz = Math.cos(ang);
    let best = 0;
    if (y !== rowY) { rowY = y; row = boxes.filter((b) => y >= b.y0 && y <= b.y1); }
    for (let i = 0; i < row.length; i++) {
      const b = row[i];
      const ox = -(b.cx * b.c + b.cz * b.s), oz = -(-b.cx * b.s + b.cz * b.c);
      const ex = dx * b.c + dz * b.s, ez = -dx * b.s + dz * b.c;
      let t0 = -1e9, t1 = 1e9;
      if (Math.abs(ex) > 1e-6) { const ta = (-b.hx - ox) / ex, tb = (b.hx - ox) / ex; t0 = Math.max(t0, Math.min(ta, tb)); t1 = Math.min(t1, Math.max(ta, tb)); }
      else if (Math.abs(ox) > b.hx) continue;
      if (Math.abs(ez) > 1e-6) { const ta = (-b.hz - oz) / ez, tb = (b.hz - oz) / ez; t0 = Math.max(t0, Math.min(ta, tb)); t1 = Math.min(t1, Math.max(ta, tb)); }
      else if (Math.abs(oz) > b.hz) continue;
      if (t1 <= Math.max(t0, 0)) continue;
      const r = t1 - Math.max(0, b.bev - (b.y1 - y)) * 1.1;                        // chamfered top edge
      if (r > best) best = r;
    }
    return best;
  };
  const surfR = (ang, y) => {
    let r = rawR(ang, y);
    if (r <= 0.5) return 0.02;
    const px = Math.sin(ang) * r, pz = Math.cos(ang) * r;
    const wd = 20 * noise.n2(Math.sin(ang) * 2.2 + 3, Math.cos(ang) * 2.2) + 9 * noise.n2(ang * 7, 5);   // the scour reaches higher in some bays than on the buttresses
    const polish = smoothstep(-45, -30, y) * (1 - smoothstep(44 + wd, 60 + wd, y));         // the scoured band is smoother
    const worn = (1 - smoothstep(36 + wd, 56 + wd, y)) * 0.66;                     // the land has worn the foot's blocks down to rounded steps, not away
    if (worn > 0) {
      const yw = y + noise.n2(ang * 2.3 + 11, y * 0.03) * 5; let ya = -80, yb = 300;     // the course this height lies in: its riser is nearly upright, its tread a ledge
      for (let i = 0; i < stepY.length; i++) { if (stepY[i] <= yw) ya = stepY[i]; else { yb = stepY[i]; break; } }
      const t = clamp((yw - ya) / Math.max(yb - ya, 1), 0, 1), ys = ya + (yb - ya) * (0.5 + 0.5 * Math.pow(t, 2.6)) + (y - yw);
      const stepK = 0.3 + 0.7 * smoothstep(-0.35, 0.3, noise.n2(ang * 4.1 + 2, (ya + yb) * 0.021));
      r = lerp(r, profile(lerp(y, ys, 0.85 * stepK)) * (0.97 + 0.13 * noise.n2(Math.sin(ang) * 1.3 + 5, Math.cos(ang) * 1.3)), worn);
    }
    r += noise.fbm3(px * 0.012, y * 0.02, pz * 0.012, 4) * 9 * (1 - 0.6 * polish);
    r += noise.fbm3(px * 0.06 + 9, y * 0.11, pz * 0.06, 3) * 2.2 * (1 - 0.75 * polish);
    const yj = y + noise.n2(ang * 3, y * 0.04) * 2; let jd = 1e9; for (let i = 0; i < jointY.length; i++) { const d = Math.abs(yj - jointY[i]); if (d < jd) jd = d; }
    r -= 1.6 * (1 - smoothstep(0, 1.3, jd)) * (1 - 0.5 * polish);                 // sheeting joints
    if (y < 72) {                                                                  // gullies
      let g = 0; const aa = ((ang + Math.PI) % TAU + TAU) % TAU - Math.PI;
      for (let i = 0; i < 24; i++) { const d = Math.abs(aa - gullies[i]) * r; if (d < 10) g = Math.max(g, 1 - d / 10); }
      r -= 2.6 * g * g * (3 - 2 * g) * (1 - smoothstep(55, 72, y));                  // broad shallow flutes: the mesh (5 m cells) can carry them without stepping
    }
    // the arch's shoulder: a ledge under it, a dark bay behind it
    let da = ang - ARCH_ANG; da = Math.atan2(Math.sin(da), Math.cos(da));
    const w = 1 - smoothstep(0.15, 0.36, Math.abs(da));
    if (w > 0) {
      const lt = smoothstep(ARCH.y - 17, ARCH.y - 5, y);                           // a weathered shoulder, not a squared plinth
      const ledge = ARCH_R + 15 + (ARCH.y - 5 - y) * 0.5 + 5 * noise.n2(da * 11 + 2, y * 0.07) - 10 * lt * lt + 3 * noise.n2(da * 31, y * 0.21);
      const bay = ARCH_R - 21 - 5 * Math.cos(da * 7) - smoothstep(ARCH.y, ARCH.y + 30, y) * 4 + smoothstep(ARCH.y + 34, ARCH.y + 62, y) * 30;
      const target = y < ARCH.y - 5 ? Math.max(r, ledge) : Math.min(r, bay);
      r = lerp(r, target, w);
    }
    return Math.max(r, 0.02);
  };
  return { surfR, gullies, boxes };
}

const GLSL_NOISE = /* glsl */`
float gsH3(vec3 p){ p = fract(p * 0.3183099 + vec3(0.1, 0.2, 0.3)); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float gsVn(vec3 p){ vec3 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(gsH3(i), gsH3(i + vec3(1,0,0)), f.x), mix(gsH3(i + vec3(0,1,0)), gsH3(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(gsH3(i + vec3(0,0,1)), gsH3(i + vec3(1,0,1)), f.x), mix(gsH3(i + vec3(0,1,1)), gsH3(i + vec3(1,1,1)), f.x), f.y), f.z); }
float gsFb(vec3 p){ return gsVn(p) * 0.5 + gsVn(p * 2.03) * 0.25 + gsVn(p * 4.1) * 0.125 + gsVn(p * 8.3) * 0.0625; }
`;

const NA = 192, NY = 102, Y0 = -72, Y1 = 286;

async function buildTor(form, pal, seedF, R, pause, sunW) {
  const torR = (ang, y) => {                                       // bilinear lookup of the built surface
    const fa = (((ang / TAU) % 1) + 1) % 1 * NA, fy = clamp((y - Y0) / (Y1 - Y0), 0, 1) * (NY - 1);
    const i0 = Math.floor(fa) % NA, i1 = (i0 + 1) % NA, j0 = Math.min(NY - 2, Math.floor(fy)), ta = fa - Math.floor(fa), ty = fy - j0;
    return lerp(lerp(R[j0 * NA + i0], R[j0 * NA + i1], ta), lerp(R[(j0 + 1) * NA + i0], R[(j0 + 1) * NA + i1], ta), ty);
  };
  // foot radius made monotone in height (overhangs filled), used to find where the land meets the rock
  const FY = 56, FY0 = -66, FY1 = 100, foot = new Float32Array(NA * FY);
  for (let i = 0; i < NA; i++) { let m = 0; for (let j = FY - 1; j >= 0; j--) { const y = FY0 + (FY1 - FY0) * j / (FY - 1); m = Math.max(m, torR(i / NA * TAU, y)); foot[j * NA + i] = m; } }
  const footR = (ang, y) => {
    const fa = (((ang / TAU) % 1) + 1) % 1 * NA, fy = clamp((y - FY0) / (FY1 - FY0), 0, 1) * (FY - 1);
    const i0 = Math.floor(fa) % NA, i1 = (i0 + 1) % NA, j0 = Math.min(FY - 2, Math.floor(fy)), ta = fa - Math.floor(fa), ty = fy - j0;
    return lerp(lerp(foot[j0 * NA + i0], foot[j0 * NA + i1], ta), lerp(foot[(j0 + 1) * NA + i0], foot[(j0 + 1) * NA + i1], ta), ty);
  };
  const pos = new Float32Array((NA + 1) * NY * 3), col = new Float32Array((NA + 1) * NY * 3);
  for (let j = 0; j < NY; j++) {
    const y = Y0 + (Y1 - Y0) * j / (NY - 1);
    for (let i = 0; i <= NA; i++) {
      const ii = i % NA, a = ii / NA * TAU, r = R[j * NA + ii], o = (j * (NA + 1) + i) * 3;
      pos[o] = Math.sin(a) * r; pos[o + 1] = y; pos[o + 2] = Math.cos(a) * r;
      let avg = 0, n = 0;                                          // cavity shading: deeper than the neighbourhood = darker
      for (let dj = -3; dj <= 3; dj += 3) for (let di = -4; di <= 4; di += 4) { const jj = clamp(j + dj, 0, NY - 1); avg += R[jj * NA + ((ii + di + NA) % NA)]; n++; }
      const ao = clamp(0.92 + (r - avg / n) / 15, 0.55, 1.06);
      col[o] = col[o + 1] = col[o + 2] = ao;
    }
  }
  await pause?.();
  const idx = new Uint32Array(NA * (NY - 1) * 6); let k = 0;
  for (let j = 0; j < NY - 1; j++) for (let i = 0; i < NA; i++) {
    const a = j * (NA + 1) + i, b = a + 1, c = a + NA + 1, d = c + 1;
    idx[k++] = a; idx[k++] = b; idx[k++] = c; idx[k++] = b; idx[k++] = d; idx[k++] = c;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  geo.setIndex(new THREE.BufferAttribute(idx, 1));
  await pause?.();
  // vertex normals: the same area-weighted face sums computeVertexNormals makes, done in batches of rows
  const nrm = new Float32Array(pos.length);
  const acc = (a, b, c) => {
    const ax = pos[a * 3], ay = pos[a * 3 + 1], az = pos[a * 3 + 2];
    const ux = pos[c * 3] - pos[b * 3], uy = pos[c * 3 + 1] - pos[b * 3 + 1], uz = pos[c * 3 + 2] - pos[b * 3 + 2];
    const vx = ax - pos[b * 3], vy = ay - pos[b * 3 + 1], vz = az - pos[b * 3 + 2];
    const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
    nrm[a * 3] += nx; nrm[a * 3 + 1] += ny; nrm[a * 3 + 2] += nz; nrm[b * 3] += nx; nrm[b * 3 + 1] += ny; nrm[b * 3 + 2] += nz; nrm[c * 3] += nx; nrm[c * 3 + 1] += ny; nrm[c * 3 + 2] += nz;
  };
  for (let j = 0; j < NY - 1; j++) {
    for (let i = 0; i < NA; i++) { const a = j * (NA + 1) + i, b = a + 1, c = a + NA + 1, d = c + 1; acc(a, b, c); acc(b, d, c); }
    if (j % 16 === 15) await pause?.();
  }
  for (let i = 0; i < nrm.length; i += 3) { const l = Math.hypot(nrm[i], nrm[i + 1], nrm[i + 2]) || 1; nrm[i] /= l; nrm[i + 1] /= l; nrm[i + 2] /= l; }
  geo.setAttribute('normal', new THREE.BufferAttribute(nrm, 3));
  geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, (Y0 + Y1) / 2, 0), 320);
  await pause?.();
  const mat = new THREE.MeshStandardMaterial({ color: pal[4], roughness: 0.92, metalness: 0, vertexColors: true });
  const green = new THREE.Color(pal[1]).lerp(new THREE.Color(pal[0]), 0.45);
  mat.onBeforeCompile = (sh) => {
    sh.uniforms.uTurf = { value: green }; sh.uniforms.uSeed = { value: seedF }; sh.uniforms.uSunW = sunW;
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vLp;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvLp = position;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vLp;\nuniform vec3 uTurf, uSunW; uniform float uSeed;\nfloat gsRough, gsHgt;\n' + GLSL_NOISE)
      .replace('#include <color_fragment>', /* glsl */`#include <color_fragment>
      {
        vec3 p = vLp + uSeed;
        vec3 fnr = cross(dFdx(vLp), dFdy(vLp)); float fl = length(fnr); fnr = fl > 1e-9 ? fnr / fl : vec3(0.0, 1.0, 0.0);
        float big = gsFb(p * 0.021), fine = gsFb(p * 0.33);
        float yy = vLp.y + 6.0 * gsVn(p * 0.027) + 2.2 * gsVn(p * 0.12);
        float s = atan(vLp.x, abs(vLp.z) < 1e-4 ? 1e-4 : vLp.z) * 92.0;
        // the scoured band (worked out first: inside it the blocks' tints and joints are polished away); its top
        // breaks into the blocks along ledges at different heights, never along one ruled line
        float bandTop = vLp.y - 20.0 * (gsVn(p * 0.011 + 3.0) - 0.5) - 9.0 * (gsVn(p * 0.04) - 0.5);
        bandTop = floor(bandTop / 6.0) * 6.0 + 6.0 * smoothstep(0.55, 1.0, fract(bandTop / 6.0));       // stepped: a staircase of ledges
        float band = smoothstep(-52.0, -40.0, vLp.y) * (1.0 - smoothstep(46.0, 58.0, bandTop));
        float inBand = smoothstep(0.0, 0.6, band);
        // natural jointing: undulating sheeting joints of uneven spacing (most of them partial), a few leaning master
        // joints, a sparse diagonal set. No courses, no staggered uprights.
        float yA = vLp.y + 16.0 * gsVn(p * 0.014 + 1.0) + 4.0 * gsVn(p * 0.07), yB = vLp.y + 11.0 * gsVn(p * 0.02 + 7.0) + 2.0 * gsVn(p * 0.13);
        float sv = s + 13.0 * gsVn(p * 0.017 + 4.0) + 0.22 * vLp.y * (gsVn(vec3(floor(s / 31.0), 2.0, uSeed)) - 0.5);
        float rowA = floor(yA / 15.0), colA = floor(sv / 31.0);
        float cell = gsH3(vec3(rowA, colA, 7.0 + uSeed));
        float fwA = max(fwidth(yA), 1e-3), fwB = max(fwidth(yB), 1e-3), fs = max(fwidth(sv), 1e-3);
        float dA = abs(fract(yA / 15.0) - 0.5) * 15.0, dB = abs(fract(yB / 4.7 + 0.3) - 0.5) * 4.7;
        float jv = (gsH3(vec3(colA, 9.0, uSeed)) - 0.5) * 0.5, dV = abs(fract(sv / 31.0) - 0.5 - jv) * 31.0;
        float dg = sv * 0.55 + yA * 0.84, dD = abs(fract(dg / 43.0) - 0.5) * 43.0, fd = max(fwidth(dg), 1e-3);
        float mA = smoothstep(0.4, 0.58, gsVn(vec3(sv * 0.045, rowA * 3.1, 2.0)) * 0.75 + 0.25 * gsVn(vec3(sv * 0.21, rowA * 1.3, 12.0)));                         // where each joint is open
        float mB = smoothstep(0.56, 0.7, gsVn(vec3(sv * 0.08, floor(yB / 4.7) * 1.7, 5.0)));
        float mV = smoothstep(0.42, 0.58, gsVn(vec3(colA * 2.3, yA * 0.035, 4.0)));
        float mD = smoothstep(0.6, 0.72, gsVn(vec3(floor(dg / 43.0) * 1.9, sv * 0.02, 11.0)));
        float wA = 0.07 + 0.24 * gsVn(vec3(sv * 0.11, rowA, 3.0)), wV = 0.07 + 0.22 * gsVn(vec3(colA, yA * 0.1, 6.0));
        float lA = (1.0 - smoothstep(wA * 0.4 + fwA * 0.4, wA + fwA * 1.2, dA)) * clamp(0.5 / fwA, 0.12, 1.0) * mA;
        float lB = (1.0 - smoothstep(0.02 + fwB * 0.3, 0.07 + fwB, dB)) * clamp(0.22 / fwB, 0.0, 1.0) * 0.4 * mB;
        float lV = (1.0 - smoothstep(wV * 0.4 + fs * 0.4, wV + fs * 1.2, dV)) * clamp(0.5 / fs, 0.12, 1.0) * mV;
        float lD = (1.0 - smoothstep(0.03 + fd * 0.4, 0.1 + fd * 1.2, dD)) * clamp(0.3 / fd, 0.0, 1.0) * 0.55 * mD;
        float crk = max(max(lA, lV), max(lB, lD)) * (1.0 - 0.5 * inBand);
        // grain: feldspar and mica at arm's length, fading with distance
        float px = fwidth(vLp.x) + fwidth(vLp.y) + fwidth(vLp.z), grainK = clamp(0.1 / max(px, 1e-3), 0.0, 1.0);
        float grain = gsVn(p * 5.3) * 0.55 + gsVn(p * 13.0) * 0.45;
        vec3 g = diffuseColor.rgb * (0.9 + 0.42 * big) * (0.86 + 0.28 * fine) * (0.9 + 0.2 * mix(cell, 0.5, 0.4 * inBand));
        g *= mix(vec3(1.06, 1.0, 0.94), vec3(0.93, 0.99, 1.08), gsVn(p * 0.008 + 5.0));   // warm and cool blocks
        g *= 1.0 + grainK * (0.5 * (grain - 0.5) + 0.3 * step(0.8, grain));
        g *= 1.0 - 0.46 * crk;
        g *= 1.0 - 0.2 * (1.0 - smoothstep(0.0, 1.6, dA)) * mA * (1.0 - inBand) - 0.12 * (1.0 - smoothstep(0.0, 1.2, dV)) * mV * (1.0 - inBand);   // weathered dark along the open joints
        // dark seep streaks
        float sc = s + 3.0 * gsVn(p * 0.05);                                              // round-the-rock coordinate WITHOUT the per-course shift (streaks must run through the courses)
        float seep = smoothstep(0.52, 0.78, gsVn(vec3(sc * 0.21, yy * 0.011, 3.0))) * smoothstep(0.35, 0.7, gsVn(vec3(sc * 0.05, yy * 0.024, 7.0)));
        g *= 1.0 - 0.5 * seep;
        // the scoured band: pale, polished, faintly striated
        // pale, polished, with faint long striations (soft noise stretched round the rock, never ruled lines)
        float stri = gsVn(vec3(sc * 0.035, yy * 0.55, 4.0)) * 0.6 + gsVn(vec3(sc * 0.09, yy * 1.7, 9.0)) * 0.4 * clamp(0.6 / max(fwidth(yy), 1e-3), 0.0, 1.0);
        float lowS = gsFb(vec3(sc * 0.012, yy * 0.05, 2.0));
        float scour = (1.0 - smoothstep(0.0, 0.5, abs(fract(yy * 0.31 + 0.6 * gsVn(vec3(sc * 0.02, 1.0, 5.0))) - 0.5))) * smoothstep(0.45, 0.7, gsVn(vec3(sc * 0.03, floor(yy * 0.31), 8.0))) * clamp(0.5 / max(fwidth(yy), 1e-3), 0.0, 1.0);
        // five to eight broad scour grooves round the foot: a dark cut with a pale lip under it
        float gy = yy / 12.5 + 0.7 * gsVn(vec3(sc * 0.016, 1.0, 5.0)), gd = abs(fract(gy) - 0.5), gfw = max(fwidth(gy), 1e-3);
        float groove = (1.0 - smoothstep(0.02 + gfw * 0.5, 0.07 + gfw * 1.5, gd)) * smoothstep(0.25, 0.5, gsVn(vec3(sc * 0.022, floor(gy) * 1.7, 8.0))) * clamp(0.25 / gfw, 0.0, 1.0);
        float glip = (1.0 - smoothstep(0.06, 0.2, gd)) * (1.0 - groove);
        vec3 pale = mix(vec3(0.5, 0.455, 0.38), vec3(0.4, 0.385, 0.35), smoothstep(0.3, 0.7, lowS)) * (0.86 + 0.2 * fine) * (0.88 + 0.22 * stri) * (1.0 - 0.14 * scour) * (1.0 + grainK * (0.4 * (grain - 0.5) + 0.25 * step(0.8, grain)));
        pale *= (1.0 - 0.5 * groove) * (1.0 + 0.1 * glip) * (0.86 + 0.28 * mix(0.5, cell, 0.7)) * (1.0 - 0.4 * crk);
        pale *= 1.0 - 0.3 * (1.0 - smoothstep(-52.0, -30.0, vLp.y));                               // darker, damp at the very foot
        g = mix(g, pale * mix(vColor.r, 1.0, 0.45) * (1.0 - 0.6 * seep), band * 0.86);
        // ochre lichen above the break line, turf on the ledges
        float lich = smoothstep(0.47, 0.6, gsFb(p * 0.09 + 20.0)) * smoothstep(0.42, 0.6, gsFb(p * 0.6 + 2.0)) * smoothstep(55.0, 85.0, vLp.y) * (1.0 - band);
        g = mix(g, vec3(0.5, 0.4, 0.16) * (0.7 + 0.6 * fine) * vColor.r, lich * 0.65);
        float lich2 = smoothstep(0.5, 0.6, gsFb(p * 0.13 + 41.0)) * smoothstep(0.4, 0.6, gsFb(p * 0.9 + 12.0)) * (1.0 - band);
        g = mix(g, vec3(0.5, 0.54, 0.47) * (0.75 + 0.5 * fine) * vColor.r, lich2 * 0.5);     // grey-green crust
        float upS = dot(normalize(vNormal), normalize((viewMatrix * vec4(0.0, 1.0, 0.0, 0.0)).xyz)) * (gl_FrontFacing ? 1.0 : -1.0);   // the smooth normal: turf must not show the mesh's facets
        float turf = smoothstep(0.7, 0.9, mix(upS, fnr.y, 0.25) + 0.3 * (fine - 0.5) + 0.25 * (gsVn(p * 0.4 + 8.0) - 0.5)) * smoothstep(0.3, 0.5, gsFb(p * 0.045 + 3.0)) * smoothstep(52.0, 68.0, vLp.y) * (1.0 - smoothstep(262.0, 276.0, vLp.y));
        g = mix(g, uTurf * (0.55 + 0.9 * fine) * vColor.r, turf * 0.9);
        diffuseColor.rgb = g;
        gsRough = mix(0.93, 0.8, band * (1.0 - seep)) + 0.05 * turf;
        gsHgt = (-0.5 * crk + 0.9 * gsFb(p * 0.1 + 11.0) + 0.3 * fine + 0.05 * gsVn(p * 2.1) + 0.09 * grainK * grain) * (1.0 - 0.35 * band) * (1.0 - 0.7 * turf) - 0.7 * groove * band;
      }`)
      .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\nroughnessFactor = gsRough;')
      .replace('#include <normal_fragment_begin>', /* glsl */`#include <normal_fragment_begin>
      { vec3 sx = dFdx(-vViewPosition), sy = dFdy(-vViewPosition); vec2 dH = vec2(dFdx(gsHgt), dFdy(gsHgt));
        vec3 r1 = cross(sy, normal), r2 = cross(normal, sx); float det = dot(sx, r1);
        vec3 nn = abs(det) * normal - sign(det) * (dH.x * r1 + dH.y * r2); float nl2 = length(nn);
        normal = nl2 > 1e-9 ? nn / nl2 : normal; }`)
      .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n{ vec3 upV = normalize((viewMatrix * vec4(0.0, 1.0, 0.0, 0.0)).xyz), sunV = normalize((viewMatrix * vec4(uSunW, 0.0)).xyz);\n  float upn = dot(normal, upV) * 0.5 + 0.5, sn = dot(normal, sunV);\n  totalEmissiveRadiance += diffuseColor.rgb * (vec3(0.5, 0.66, 1.0) * (0.03 + 0.17 * upn * upn) + vec3(1.0, 0.8, 0.55) * 0.2 * smoothstep(-0.55, 0.05, sn) * (1.0 - smoothstep(0.05, 0.5, sn))) * vColor.r; }   // shade is slate, never black');
  };
  // the break asks footR at five angles a segment only, 720 columns in all and the same every frame (the segment's own and the four beside it, see lipRock; many fall on a neighbour's), some 29,800 times a frame:
  // footR's lerp round the rock is made here once for each of them at each of the FY heights (its own expression on the same floats), so a lookup lerps two neighbours of one column
  const footC = new Float64Array(NSEG * 5 * FY);
  for (let c = 0; c < NSEG * 5; c++) {
    const a = Math.floor(c / 5) / NSEG * TAU, k = c % 5, ang = k === 0 ? a : k === 1 ? a - LIP_DA * 0.5 : k === 2 ? a + LIP_DA * 0.5 : k === 3 ? a - LIP_DA : a + LIP_DA;
    const fa = (((ang / TAU) % 1) + 1) % 1 * NA, i0 = Math.floor(fa) % NA, i1 = (i0 + 1) % NA, ta = fa - Math.floor(fa);
    for (let j = 0; j < FY; j++) footC[c * FY + j] = lerp(foot[j * NA + i0], foot[j * NA + i1], ta);
  }
  const footSeg = (i, y) => {                                      // footR(i / NSEG * TAU, y) for a whole i in 0 .. NSEG - 1 (a segment's index: the table does not wrap), and so lipRock(i)
    const fy = clamp((y - FY0) / (FY1 - FY0), 0, 1) * (FY - 1), j0 = Math.min(FY - 2, Math.floor(fy)), ty = fy - j0, o = i * 5 * FY + j0;
    return lerp(footC[o], footC[o + 1], ty);
  };
  // the rock's outline that the lip is held clear of: the greatest of footR at segment i's angle a, a -+ LIP_DA / 2 and a -+ LIP_DA, at height LIP_Q[0], left in LIP_Q[1] (no double crosses the call)
  const lipRock = (i) => {
    const fy = clamp((LIP_Q[0] - FY0) / (FY1 - FY0), 0, 1) * (FY - 1), j0 = Math.min(FY - 2, Math.floor(fy)), ty = fy - j0, o = i * 5 * FY + j0;
    LIP_Q[1] = Math.max(lerp(footC[o], footC[o + 1], ty), lerp(footC[o + FY], footC[o + FY + 1], ty), lerp(footC[o + 2 * FY], footC[o + 2 * FY + 1], ty), lerp(footC[o + 3 * FY], footC[o + 3 * FY + 1], ty), lerp(footC[o + 4 * FY], footC[o + 4 * FY + 1], ty));
  };
  const mesh = new THREE.Mesh(geo, mat);
  return { mesh, torR, footR, footSeg, lipRock };
}

// ---------------------------------------------------------------- loose rock: the arch and the clitter
function pushRock(out, noise, cx, cy, cz, sx, sy, sz, rotY, tilt, shade) {
  const g = new THREE.BoxGeometry(1, 1, 1, 3, 3, 3).toNonIndexed();
  const p = g.attributes.position, c = new Float32Array(p.count * 3);
  const m = new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(tilt, rotY, tilt * 0.6));
  const v = new THREE.Vector3(), nv = new THREE.Vector3(), nrm = g.attributes.normal;
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    const l = Math.max(Math.abs(v.x), Math.abs(v.y), Math.abs(v.z)), q = v.length() / Math.max(l, 1e-4);
    v.multiplyScalar(lerp(1, 0.86 / q * 1.3, 0.38));                              // soften the corners
    v.x *= sx; v.y *= sy; v.z *= sz;
    nv.set(v.x / (sx * sx), v.y / (sy * sy), v.z / (sz * sz)).normalize().applyMatrix4(m); nrm.setXYZ(i, nv.x, nv.y, nv.z);   // rounded-boulder normals
    const n = noise.fbm3(v.x * 0.16 + cx, v.y * 0.16 + cy, v.z * 0.16 + cz, 3);
    v.multiplyScalar(1 + n * 0.16); v.applyMatrix4(m);
    p.setXYZ(i, v.x + cx, v.y + cy, v.z + cz);
    const a = shade * clamp(0.72 + (v.y / Math.max(sy, 0.1)) * 0.3 + n * 0.2, 0.45, 1);
    c[i * 3] = c[i * 3 + 1] = c[i * 3 + 2] = a;
  }
  g.setAttribute('color', new THREE.BufferAttribute(c, 3)); g.deleteAttribute('uv');
  out.push(g);
}

// ledges: places where the surface steps in by more than 5 m between two rows of the built grid
function findLedges(torR) {
  const out = [];
  for (let j = 0; j < NY - 1; j++) {
    const yLo = Y0 + (Y1 - Y0) * j / (NY - 1), yHi = Y0 + (Y1 - Y0) * (j + 1) / (NY - 1);
    if (yHi < 58) continue;
    for (let i = 0; i < NA; i++) {
      const a = i / NA * TAU, rEdge = torR(a, yLo), rBack = torR(a, yHi);
      let da = a - ARCH_ANG; da = Math.atan2(Math.sin(da), Math.cos(da));
      if (rEdge - rBack > 5 && rEdge > 10 && !(Math.abs(da) < 0.36 && yHi < 150)) out.push({ a, yLo, yHi, rEdge, rBack });
    }
  }
  return out;
}
const seat = (l, f) => { const r = lerp(l.rEdge, l.rBack, f); return { x: Math.sin(l.a) * r, y: lerp(l.yLo, l.yHi, f), z: Math.cos(l.a) * r, r }; };

async function buildArchAndClitter(rng, noise, ledges, mergeGeometries, pause) {
  const parts = [];
  const nx = Math.sin(ARCH_ANG), nz = Math.cos(ARCH_ANG), tx = nz, tz = -nx;       // outward radial, tangent
  // the rib: a swept, tapered, jointed section along a pointed-arch centreline
  const NS = 46, NR = 8, pos = [], col = [], idx = [];
  const lean = rng.range(-1.6, 1.6), thickLeg = rng.chance(0.5) ? 1 : -1;
  for (let i = 0; i <= NS; i++) {
    const s = i / NS, ph = s * Math.PI, cs = Math.cos(ph), sn = Math.sin(ph);
    const u = -12.2 * Math.sign(cs) * Math.pow(Math.abs(cs), 0.58) + lean * sn;    // across the opening
    const y = ARCH.y - 7 + 29.2 * Math.pow(Math.abs(sn), 0.72) + 1.2 * noise.n2(s * 5, 3);
    const w = 2.2 * noise.n2(s * 4, 9) * sn;                                       // wander in and out of plane
    const joint = 1 - 0.13 * Math.pow(Math.abs(Math.sin(s * NS * 0.45 + noise.n2(s * 7, 1))), 12);
    const legFat = 1 + 0.35 * Math.max(0, thickLeg * cs) + 0.5 * (1 - sn) * (1 - sn);
    const th = lerp(2.7, 2.2, sn) * legFat * joint, dp = lerp(3.8, 3.1, sn) * legFat * joint;   // half sizes
    const dU = 12.2 * 0.58 * Math.pow(Math.max(Math.abs(cs), 0.02), -0.42) * sn, dY = 28.6 * 0.72 * Math.pow(Math.max(sn, 0.02), -0.28) * cs;
    const dl = Math.hypot(dU, dY) || 1, nu = dY / dl, ny = -dU / dl;               // in-plane normal of the centreline
    for (let j = 0; j < NR; j++) {
      const a = j / NR * TAU + Math.PI / 8, ca = Math.cos(a), sa = Math.sin(a);
      const sq = 1 / Math.max(Math.abs(ca), Math.abs(sa)) * 0.92;                  // squared-off section
      const bump = 1 + 0.2 * noise.fbm3(s * 9, j * 1.7, 4, 3);
      const iu = ca * sq * th * bump, id = sa * sq * dp * bump;
      const pu = u + nu * iu, py = y + ny * iu, pd = id + w;
      pos.push(ARCH.x + tx * pu + nx * pd, py, ARCH.z + tz * pu + nz * pd);
      const ao = clamp(0.9 + 0.12 * ny * ca + 0.16 * noise.n3(s * 14, j, 2), 0.7, 1.05); col.push(ao, ao, ao);
    }
  }
  for (let i = 0; i < NS; i++) for (let j = 0; j < NR; j++) {
    const a = i * NR + j, b = i * NR + (j + 1) % NR, c = a + NR, d = b + NR; idx.push(a, c, b, b, c, d);
  }
  let rib = new THREE.BufferGeometry();
  rib.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); rib.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  rib.setIndex(idx); rib.computeVertexNormals(); rib = rib.toNonIndexed(); parts.push(rib);
  await pause?.();
  // the rib is a pile of weathered blocks: big rounded boulders ride its line, each its own size and lean
  for (let k = 0; k < 11; k++) {
    const sK = 0.06 + 0.88 * (k + rng.range(-0.25, 0.25)) / 10, ph = sK * Math.PI, cs = Math.cos(ph), sn = Math.sin(ph);
    const u = (-12.2 * Math.sign(cs) * Math.pow(Math.abs(cs), 0.58) + lean * sn) * 1.07, y = ARCH.y - 7 + 29.2 * Math.pow(Math.abs(sn), 0.72) + 0.9 * sn;
    const sz = rng.range(5.2, 7.4) * (1 + 0.25 * (1 - sn)), d = rng.range(-1.2, 1.2);
    pushRock(parts, noise, ARCH.x + tx * u + nx * d, y, ARCH.z + tz * u + nz * d, sz * rng.range(0.85, 1.1), sz * rng.range(0.7, 0.95), sz * rng.range(1.0, 1.35), ARCH_ANG + rng.range(-0.5, 0.5), rng.range(-0.3, 0.3), rng.range(0.85, 1.02));
  }
  await pause?.();
  // a capstone on the crown and plinth blocks at the feet
  pushRock(parts, noise, ARCH.x + tx * lean, ARCH.y + 24.6, ARCH.z + tz * lean, 11, 4.2, 7.5, ARCH_ANG + 0.2, 0.06, 1.0);
  for (const sgn of [-1, 1]) for (let k = 0; k < 3; k++) {
    const u = sgn * (11.5 + rng.range(-2, 5) + k * 2.5), d = rng.range(-5, 6), sz = rng.range(3, 6.5) / (1 + k * 0.4);
    pushRock(parts, noise, ARCH.x + tx * u + nx * d, ARCH.y - 4 + sz * 0.3, ARCH.z + tz * u + nz * d, sz * 1.3, sz, sz * 1.1, rng.range(0, 3), rng.range(-0.2, 0.2), 0.85);
  }
  // clitter: tumbled blocks perched on ledges all over the upper tor
  let placed = 0;
  for (let tries = 0; tries < 300 && placed < 44 && ledges.length; tries++) {
    const l = rng.pick(ledges); if (l.rEdge - l.rBack < 7 || l.yHi < 62) continue;
    const sz = rng.range(1.6, 5.4), q = seat(l, rng.range(0.25, 0.7));
    pushRock(parts, noise, q.x, q.y + sz * 0.3, q.z, sz * rng.range(1, 1.7), sz * rng.range(0.6, 1.1), sz * rng.range(0.9, 1.4), rng.range(0, 3), rng.range(-0.25, 0.25), 0.9);
    placed++; if (placed % 8 === 0) await pause?.();
  }
  await pause?.();
  return mergeGeometries(parts, false);
}

// ---------------------------------------------------------------- pines, ferns and turf rags (one merged mesh)
function makeFoliage() {
  const pos = [], col = [], sw = [], nfix = [];                    // nfix: (vertex index, smooth normal) set after the flat normals are made
  const tri = (a, b, c, ca, cb, cc, sa, sb, sc, ph) => {
    pos.push(a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z);
    col.push(ca.r, ca.g, ca.b, cb.r, cb.g, cb.b, cc.r, cc.g, cc.b); sw.push(sa, ph, sb, ph, sc, ph);
  };
  return { pos, col, sw, tri, nfix };
}
const V = (x, y, z) => new THREE.Vector3(x, y, z);

function pushTube(F, pts, r0, r1, sides, c0, c1, s0, s1, ph) {
  const rings = [], up = V(0, 1, 0), side = V(), bin = V(), dir = V();
  for (let i = 0; i < pts.length; i++) {
    dir.subVectors(pts[Math.min(i + 1, pts.length - 1)], pts[Math.max(i - 1, 0)]).normalize();
    side.crossVectors(dir, Math.abs(dir.y) > 0.95 ? V(1, 0, 0) : up).normalize(); bin.crossVectors(side, dir);
    const t = i / (pts.length - 1), r = lerp(r0, r1, t), ring = [];
    for (let j = 0; j < sides; j++) { const a = j / sides * TAU; ring.push(pts[i].clone().addScaledVector(side, Math.cos(a) * r).addScaledVector(bin, Math.sin(a) * r)); }
    rings.push(ring);
  }
  for (let i = 0; i < rings.length - 1; i++) for (let j = 0; j < sides; j++) {
    const t0 = i / (rings.length - 1), t1 = (i + 1) / (rings.length - 1), j1 = (j + 1) % sides;
    const ca = c0.clone().lerp(c1, t0).multiplyScalar(0.8 + 0.4 * (j % 2)), cb = c0.clone().lerp(c1, t1).multiplyScalar(0.8 + 0.4 * (j % 2));
    F.tri(rings[i][j], rings[i][j1], rings[i + 1][j], ca, ca, cb, lerp(s0, s1, t0), lerp(s0, s1, t0), lerp(s0, s1, t1), ph);
    F.tri(rings[i][j1], rings[i + 1][j1], rings[i + 1][j], ca, cb, cb, lerp(s0, s1, t0), lerp(s0, s1, t1), lerp(s0, s1, t1), ph);
  }
}

function pushPine(F, rng, noise, base, h, wind, pal, padGeo) {
  const ph = rng.range(0, TAU), bark = new THREE.Color('#5e4733'), barkTop = new THREE.Color('#94714c');
  // evergreen whatever the season: dark olive boughs, each a clump of rounded masses with a warm sunlit top, a deep
  // blue-green underside and a ragged fringe of needle sprays, all flagged downwind
  const dark = new THREE.Color('#25402c'), mid = new THREE.Color('#46633a'), lit = new THREE.Color('#9ea85a'), under = new THREE.Color('#1d3029');
  const pts = [], bend = rng.range(0.18, 0.32) * h, kink = rng.range(0.7, 1.5) * (rng() < 0.5 ? -1 : 1), kf = rng.range(4, 7);
  for (let i = 0; i <= 7; i++) {                                                  // a trunk leaning with the wind, kinked
    const t = i / 7, kk = kink * Math.sin(t * kf) * (0.4 + 0.6 * t);
    pts.push(V(base.x + wind.x * bend * t * t + wind.z * kk, base.y - 1.5 + (h + 1.5) * t, base.z + wind.z * bend * t * t - wind.x * kk));
  }
  pushTube(F, pts, h * 0.046, h * 0.012, 6, bark, barkTop, 0, 0.5, ph);
  const nPad = rng.int(4, 6), tmp = V(), n = V(), pp = padGeo.attributes.position;
  const smooth = (i0, cnt, fn) => { for (let i = 0; i < cnt; i++) { const q = fn(i); F.nfix.push(i0 + i, q.x, q.y, q.z); } };
  for (let k = 0; k < nPad; k++) {                                                // flagged boughs, all blown one way
    const t = lerp(0.42, 1.0, k / (nPad - 1)), at = pts[Math.round(t * 7)];
    const reach = h * rng.range(0.16, 0.38) * (1.15 - t * 0.5), side = rng.range(-0.5, 0.5);
    const c = V(at.x + (wind.x * (0.6 + 0.4 * rng()) - wind.z * side) * reach, at.y + rng.range(-0.3, 0.6), at.z + (wind.z * (0.6 + 0.4 * rng()) + wind.x * side) * reach);
    pushTube(F, [at.clone(), at.clone().lerp(c, 0.5).add(V(0, -0.5, 0)), c.clone().add(V(0, -0.4, 0))], h * 0.013, h * 0.005, 4, bark, barkTop, t * 0.5, t * 0.8, ph);
    const R = h * rng.range(0.2, 0.29) * (1.2 - 0.45 * t), sw = 0.6 + 0.4 * t;
    for (let b = 0; b < 5; b++) {                                                 // the bough's masses
      const oa = rng.range(0, TAU), od = b === 0 ? 0 : R * rng.range(0.4, 0.8), br = R * (b === 0 ? 0.62 : rng.range(0.36, 0.56)), fl = rng.range(0.34, 0.5);
      const ox = Math.cos(oa) * od + wind.x * R * 0.3 * (b ? 1 : 0), oz = Math.sin(oa) * od + wind.z * R * 0.3 * (b ? 1 : 0), oy = rng.range(-0.1, 0.16) * R;
      const i0 = F.pos.length / 3, vs = [], cs = [], ns = [];
      for (let i = 0; i < pp.count; i++) {
        n.fromBufferAttribute(pp, i);
        const d = 1 + 0.34 * noise.n3(n.x * 1.9 + k * 3 + b, n.y * 1.9 + ph, n.z * 1.9);
        tmp.set(n.x * br * d, (n.y > 0 ? n.y : n.y * 0.4) * br * fl * d, n.z * br * d);
        vs.push(V(c.x + ox + tmp.x, c.y + oy + tmp.y, c.z + oz + tmp.z));
        const lightness = clamp(n.y * 0.95 + 0.12 + 0.3 * noise.n3(n.x * 4, n.y * 4 + k, n.z * 4 + b), 0, 1);
        cs.push(n.y < -0.2 ? under.clone() : dark.clone().lerp(mid, Math.min(1, lightness * 2)).lerp(lit, Math.max(0, lightness * 2 - 1) * 0.9));
        ns.push(V(n.x, n.y * 1.6 + 0.35, n.z).normalize());
      }
      for (let i = 0; i < vs.length; i += 3) F.tri(vs[i], vs[i + 1], vs[i + 2], cs[i], cs[i + 1], cs[i + 2], sw, sw, sw, ph + k);
      smooth(i0, vs.length, (i) => ns[i]);
    }
    const nSp = 14;                                                               // needle sprays round the rim: the ragged edge
    for (let j = 0; j < nSp; j++) {
      const a = j / nSp * TAU + rng.range(-0.2, 0.2), ca = Math.cos(a), sa = Math.sin(a), dw = Math.max(0, ca * wind.x + sa * wind.z);
      const r0 = R * rng.range(0.6, 0.9), r1 = r0 + R * rng.range(0.28, 0.5) * (0.7 + 0.9 * dw), w = R * rng.range(0.1, 0.17), y0 = c.y + rng.range(-0.06, 0.1) * R;
      const A = V(c.x + ca * r0 - sa * w, y0, c.z + sa * r0 + ca * w), B = V(c.x + ca * r0 + sa * w, y0, c.z + sa * r0 - ca * w), T = V(c.x + ca * r1, y0 - R * rng.range(0.02, 0.16), c.z + sa * r1);
      const i0 = F.pos.length / 3, cb = dark.clone().lerp(mid, rng.range(0.3, 0.9)), ct = mid.clone().lerp(lit, rng.range(0.2, 0.7));
      F.tri(A, B, T, cb, cb, ct, sw, sw, 1, ph + k);
      smooth(i0, 3, () => V(ca * 0.25, 0.95, sa * 0.25).normalize());
    }
  }
}

// a cluster of drooping fern fronds and turf rags hanging over an edge
function pushRags(F, rng, root, out, n, len, pal, straw) {
  const fern = pal[1].clone().lerp(pal[0], 0.5), tip = pal[2].clone().lerp(pal[0], 0.35), tx = out.z, tz = -out.x;
  for (let k = 0; k < n; k++) {
    const ph = rng.range(0, TAU), L = len * rng.range(0.55, 1.25), w = L * rng.range(0.16, 0.26), yaw = rng.range(-0.9, 0.9);
    const dx = out.x * Math.cos(yaw) + tx * Math.sin(yaw), dz = out.z * Math.cos(yaw) + tz * Math.sin(yaw), ox = rng.range(-1, 1) * len * 0.5;
    const reach = rng.range(0.25, 0.5), isStraw = rng() < straw;
    const k0 = rng.range(0.55, 0.9), k1 = isStraw ? 1 : rng.range(0.8, 1.15), A = isStraw ? STRAW0 : fern, B = isStraw ? STRAW1 : tip;
    let lx = 0, ly = 0, lz = 0, rx = 0, ry = 0, rz = 0, cr = 0, cg = 0, cb = 0, tp = 0;
    for (let i = 0; i <= 4; i++) {
      const t = i / 4, f = reach * L * Math.sin(t * 1.5), drop = L * (0.14 * t - t * t * 0.95), ww = w * (1 - t * t) * 0.5;
      const cx = root.x + tx * ox + dx * f, cy = root.y + 0.25 + drop, cz = root.z + tz * ox + dz * f;
      const ax = cx - dz * ww, az = cz + dx * ww, bx = cx + dz * ww, bz = cz - dx * ww;
      const r = lerp(A.r * k0, B.r * k1, t), g = lerp(A.g * k0, B.g * k1, t), bl = lerp(A.b * k0, B.b * k1, t);
      if (i > 0) {
        F.pos.push(lx, ly, lz, rx, ry, rz, ax, cy, az); F.col.push(cr, cg, cb, cr, cg, cb, r, g, bl); F.sw.push(tp, ph, tp, ph, t, ph);
        if (i < 4) { F.pos.push(rx, ry, rz, bx, cy, bz, ax, cy, az); F.col.push(cr, cg, cb, r, g, bl, r, g, bl); F.sw.push(tp, ph, t, ph, t, ph); }
      }
      lx = ax; ly = cy; lz = az; rx = bx; ry = cy; rz = bz; cr = r; cg = g; cb = bl; tp = t;
    }
  }
}
const STRAW0 = new THREE.Color('#8f8a4e'), STRAW1 = new THREE.Color('#c9c486');

async function buildFoliage(rng, noise, ledges, pal, detail, uTime, pause) {
  const F = makeFoliage(), wind = V(0.2, 0, -0.98);
  const padGeo = new THREE.IcosahedronGeometry(1, 0);
  const pines = [], broad = ledges.filter((l) => l.rEdge - l.rBack > 8 && l.yHi > 74 && l.yHi < 268);
  for (let tries = 0; tries < 600 && pines.length < 9 && broad.length; tries++) {  // nine wind-bent pines above the break line
    const l = rng.pick(broad), q = seat(l, rng.range(0.3, 0.6));
    if (pines.some((p) => Math.hypot(p.x - q.x, p.y - q.y, p.z - q.z) < 26)) continue;
    pines.push(q); pushPine(F, rng, noise, q, rng.range(31, 46), wind, pal, padGeo); await pause?.();
  }
  padGeo.dispose();
  const nRag = Math.round(270 * detail);
  for (let i = 0; i < nRag && ledges.length; i++) {                                // ferns and turf rags over the ledge edges
    const l = rng.pick(ledges), q = seat(l, rng.range(0.0, 0.12));
    pushRags(F, rng, q, V(Math.sin(l.a), 0, Math.cos(l.a)), rng.int(4, 6), rng.range(2.4, 5.5), pal, 0.25);
    if (i % 30 === 29) await pause?.();
  }
  const nx = Math.sin(ARCH_ANG), nz = Math.cos(ARCH_ANG), tx = nz, tz = -nx;       // and hung from the arch
  for (let i = 0; i < 16; i++) {
    const u = rng.range(-9, 9), sgn = rng.chance(0.5) ? 1 : -1;
    const y = ARCH.y + 24 - Math.abs(u) * 0.35 + rng.range(-1.5, 1), root = V(ARCH.x + tx * u + nx * sgn * 2.6, y, ARCH.z + tz * u + nz * sgn * 2.6);
    pushRags(F, rng, root, V(nx * sgn, 0, nz * sgn), rng.int(3, 5), rng.range(2, 4), pal, 0.35);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(F.pos, 3));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(F.col, 3));
  geo.setAttribute('aSw', new THREE.Float32BufferAttribute(F.sw, 2));
  geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 110, 0), 360);
  await pause?.();
  geo.computeVertexNormals();
  { const N = geo.attributes.normal; for (let i = 0; i < F.nfix.length; i += 4) N.setXYZ(F.nfix[i], F.nfix[i + 1], F.nfix[i + 2], F.nfix[i + 3]); }   // the pines' boughs shade as rounded masses, not facets
  await pause?.();
  const mat = new THREE.MeshStandardMaterial({ vertexColors: true, side: THREE.DoubleSide, roughness: 0.82 });
  mat.onBeforeCompile = (sh) => {
    sh.uniforms.uT = uTime;
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute vec2 aSw; uniform float uT;')
      .replace('#include <begin_vertex>', `#include <begin_vertex>
      { float w = aSw.x * aSw.x; float s = 0.34 * sin(uT * 1.1 + aSw.y) + 0.16 * sin(uT * 2.7 + aSw.y * 1.7 + position.x * 0.3);
        transformed += vec3(0.2, 0.05, -0.98) * w * (0.25 + s); }`);
    sh.fragmentShader = sh.fragmentShader.replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n  totalEmissiveRadiance += diffuseColor.rgb * vec3(0.5, 0.6, 0.66) * 0.5;   // sky fill: foliage in shade stays green');
  };
  const mesh = new THREE.Mesh(geo, mat);
  return { mesh, pines };
}

// ---------------------------------------------------------------- where the land meets the rock
const NSEG = 144, HIST = 16, ROW_DT = 0.75;
// the break stays low under the approach line: lip, clods and plume are damped within about 30 degrees of the arch
const archK = (i) => { let da = i / NSEG * TAU - ARCH_ANG; da = Math.abs(Math.atan2(Math.sin(da), Math.cos(da))); return 0.42 + 0.58 * smoothstep(0.1, 0.36, da); };
function makeBreakSolver(footSeg) {
  let sampler = null, rateRef = 7;
  const solve = (i, tw, out) => {                                                  // bisect the height where ground == rock
    const a = i / NSEG * TAU, sx = Math.sin(a), cz = Math.cos(a);
    let lo = -64, hi = 98;
    for (let k = 0; k < 9; k++) {
      const y = (lo + hi) * 0.5, r = footSeg(i, y);
      if (sampler(sx * r, cz * r, tw) > y) lo = y; else hi = y;
    }
    out.y = (lo + hi) * 0.5; out.r = footSeg(i, out.y);
  };
  const tmpA = { y: 0, r: 0 };
  // contact height, radius, rise rate and the lip's strength (0..1) for every segment at wave time tw
  const state = (tw, yc, rc, lip) => {
    for (let i = 0; i < NSEG; i++) {
      solve(i, tw, tmpA);
      const a = i / NSEG * TAU, px = Math.sin(a) * (tmpA.r + 6), pz = Math.cos(a) * (tmpA.r + 6);
      const rate = (sampler(px, pz, tw + 0.3) - sampler(px, pz, tw - 0.3)) / 0.6;
      yc[i] = tmpA.y; rc[i] = tmpA.r;
      lip[i] = smoothstep(0.1 * rateRef, 0.72 * rateRef, rate) * smoothstep(-34, -6, tmpA.y);   // rears as the land climbs fast (measured against this sea's own fastest rise)
    }
  };
  // one segment alone: how high the land (and its lip) stands on the rock at wave time tw
  const reach = (i, tw) => {
    solve(i, tw, tmpA);
    const a = i / NSEG * TAU, px = Math.sin(a) * (tmpA.r + 6), pz = Math.cos(a) * (tmpA.r + 6);
    const rate = (sampler(px, pz, tw + 0.3) - sampler(px, pz, tw - 0.3)) / 0.6;
    return tmpA.y + 16 * smoothstep(0.1 * rateRef, 0.72 * rateRef, rate) * smoothstep(-34, -6, tmpA.y);
  };
  // the fastest rise of the open land upstream over one period of the swell: the scale the lip's strength is read on
  const setSampler = (f) => {
    sampler = f; let m = 0;
    for (let t = 0; t < 30; t += 0.5) m = Math.max(m, Math.abs(f(0, 430, t + 0.3) - f(0, 430, t - 0.3)) / 0.6);
    rateRef = clamp(m, 4.5, 8);
  };
  return { state, reach, setSampler };
}

// shared sun and sky for the hero's own shader materials (the world sets them with hero.setLight)
function makeLightUniforms(pal) {
  return {
    uSunDir: { value: new THREE.Vector3(-0.6, 0.7, 0.4).normalize() },
    uSunCol: { value: new THREE.Color('#FFF4DE').multiplyScalar(2.6) },
    uSkyCol: { value: pal[5].clone().multiplyScalar(0.75) },
    uTone: { value: new THREE.Color(1, 1, 1) },              // the meadow's tone at the tor's foot (the world sets it with setMeadow)
  };
}

// ---------------------------------------------------------------- the land around the foot and the curling lip
const NRAD = 30, NLIP = 22, LIP_LEN = 72, NFOAM = 7, FOAM_R = [-3, 0.6, 4, 10, 20, 34, 52];
function buildSurf(pal, footR, skirtRadius, withSkirt, uTime, seedF, L, uViewH, rng, footSeg, lipRock) {
  const grp = new THREE.Group();
  // --- skirt: a ring of meadow resampled every frame from the ground sampler, sewn to the rock
  const sPos = new Float32Array(NSEG * NRAD * 3), sNor = new Float32Array(NSEG * NRAD * 3), sCap = new Float32Array(NSEG * NRAD * 2);
  const sIdx = [];
  for (let i = 0; i < NSEG; i++) for (let j = 0; j < NRAD - 1; j++) {
    const a = i * NRAD + j, b = ((i + 1) % NSEG) * NRAD + j; sIdx.push(a, a + 1, b, b, a + 1, b + 1);
  }
  const sGeo = new THREE.BufferGeometry();
  sGeo.setAttribute('position', new THREE.BufferAttribute(sPos, 3).setUsage(THREE.DynamicDrawUsage));
  sGeo.setAttribute('normal', new THREE.BufferAttribute(sNor, 3).setUsage(THREE.DynamicDrawUsage));
  sGeo.setAttribute('aCap', new THREE.BufferAttribute(sCap, 2).setUsage(THREE.DynamicDrawUsage));
  sGeo.setIndex(sIdx); sGeo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), skirtRadius + 60);
  const sMat = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.9 });
  sMat.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, { uT: uTime, uG0: { value: pal[0] }, uG1: { value: pal[1] }, uG2: { value: pal[2] }, uW: { value: pal[3] }, uM: { value: pal[6] }, uSeed: { value: seedF } });
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute vec2 aCap; varying vec3 vLp; varying vec3 vCap;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvLp = position; vCap = vec3(aCap, normal.z);');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vLp; varying vec3 vCap; uniform float uT, uSeed; uniform vec3 uG0, uG1, uG2, uW, uM;\n' + GLSL_NOISE)
      .replace('#include <color_fragment>', /* glsl */`#include <color_fragment>
      {
        vec3 p = vec3(vLp.x, 0.0, vLp.z) + uSeed;
        float big = gsFb(p * 0.011), mid = gsFb(p * 0.09 + 4.0), fine = gsVn(p * 1.3);
        float sheen = gsVn(vec3(p.x * 0.012 + uT * 0.05, 1.0, p.z * 0.03 + uT * 0.3));          // wind combing the grass
        float backF = smoothstep(-0.12, 0.2, vCap.z);                                              // sunlit back or dark front face
        vec3 g = mix(uG1, mix(uG0, uG2, 0.35), backF);
        g = mix(g, uG1, 0.3 * smoothstep(0.4, 0.75, big)); g = mix(g, uG2, 0.4 * smoothstep(0.5, 0.85, sheen) * (0.4 + 0.6 * backF) + 0.12 * mid);
        float blades = gsVn(vec3(p.x * 0.9, 3.0, p.z * 4.0 + uT * 0.6));
        g *= (0.72 + 0.26 * fine + 0.3 * blades) * (0.86 + 0.28 * mid);
        float fw = clamp(fwidth(vLp.x) + fwidth(vLp.z), 0.0, 4.0);
        float far = clamp(fw * 1.2, 0.0, 1.0), speck = smoothstep(0.6, 0.72, gsVn(p * 2.6 + 9.0));
        g = mix(g, uG2 * 1.05, smoothstep(0.66, 0.8, gsVn(p * 6.0 + 2.0)) * 0.35 * (1.0 - far));   // seed heads
        float rag = smoothstep(0.47, 0.6, gsFb(vec3(p.x * 0.011, uT * 0.02, p.z * 0.045) + 7.0));   // ragged whitecap streaks
        float streak = smoothstep(0.42, 0.62, gsFb(vec3(p.x * 0.07, 2.0, p.z * 0.3)));
        g = mix(g, uW * 0.78, vCap.x * rag * mix(speck * 0.9, 0.42 * streak, far));
        float camp = smoothstep(0.86, 0.9, gsVn(p * 5.5 + 31.0)) * (1.0 - far);
        g = mix(g, uM * 0.8, camp * 0.7);
        g = mix(g, vec3(0.09, 0.075, 0.05) + 0.25 * g, vCap.y * (0.45 + 0.4 * mid));                // torn, trodden edge at the rock
        diffuseColor.rgb = g;
      }`);
  };
  const skirt = new THREE.Mesh(sGeo, sMat); skirt.frustumCulled = false; skirt.visible = withSkirt; grp.add(skirt);
  // --- lip: a comber of turf. A thick slab climbs the rock grass-side out, stands up and rolls back over the
  // incoming meadow, so its rising face is grass and daisies and the roll shows dark soil and pale roots.
  // Rows 0..NLIP-1 are the grass side from foot to tip, rows NLIP..2 NLIP-1 the soil side from tip back to foot.
  const NROW = NLIP * 2;
  const lPos = new Float32Array(NSEG * NROW * 3), lNor = new Float32Array(NSEG * NROW * 3), lUv = new Float32Array(NSEG * NROW * 4), lArc = new Float32Array(NSEG * NROW), lShd = new Float32Array(NSEG * NROW).fill(1), lIdx = [];
  for (let i = 0; i < NSEG; i++) for (let v = 0; v < NROW - 1; v++) {
    const a = i * NROW + v, b = ((i + 1) % NSEG) * NROW + v; lIdx.push(a, b, a + 1, b, b + 1, a + 1);
  }
  const lGeo = new THREE.BufferGeometry();
  lGeo.setAttribute('position', new THREE.BufferAttribute(lPos, 3).setUsage(THREE.DynamicDrawUsage));
  lGeo.setAttribute('normal', new THREE.BufferAttribute(lNor, 3).setUsage(THREE.DynamicDrawUsage));
  lGeo.setAttribute('aL', new THREE.BufferAttribute(lUv, 4).setUsage(THREE.DynamicDrawUsage));   // (along, across 0..1, strength, side 0 grass / 1 soil)
  lGeo.setAttribute('aArc', new THREE.BufferAttribute(lArc, 1).setUsage(THREE.DynamicDrawUsage));   // metres up the sheet, measured: the roll keeps its size where the comber dies away, so strength is no measure of it
  lGeo.setAttribute('aShd', new THREE.BufferAttribute(lShd, 1).setUsage(THREE.DynamicDrawUsage));   // 1 in the sun .. 0 in the shadow of a swell (setShade)
  lGeo.setIndex(lIdx); lGeo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 300);
  let LIP_XM = 0; for (let i = 0; i < 24; i++) LIP_XM += footR(i / 24 * TAU, 0); LIP_XM = (LIP_XM / 24 + 14) * TAU / NSEG;   // one segment's width on the comber, in metres
  const lMat = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.9, side: THREE.DoubleSide });
  lMat.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, { uT: uTime, uG0: { value: pal[0] }, uG2: { value: pal[2] }, uW: { value: pal[3] }, uM: { value: pal[6] }, uTone: L.uTone });
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute vec4 aL; attribute float aArc, aShd; varying vec4 vL; varying float vArc, vShd;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvL = aL; vArc = aArc; vShd = aShd;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec4 vL; varying float vArc, vShd; uniform float uT; uniform vec3 uG0, uG2, uW, uM, uTone;\nfloat gsFill;\n' + GLSL_NOISE)
      .replace('#include <color_fragment>', /* glsl */`#include <color_fragment>
      {
        float xm = vL.x * ${LIP_XM.toFixed(3)};                                                        // metres round the foot, measured
        float m = vArc;                                                                // metres up the sheet
        float rg = gsVn(vec3(vL.x * 0.9, uT * 0.6, 2.0)) * 0.45 + gsVn(vec3(vL.x * 4.3, uT * 1.1, 5.0)) * 0.55;   // ragged, tearing edge
        float rg2 = gsVn(vec3(xm * 1.3, m * 1.1 - uT * 0.4, 9.0));
        float tipE = 0.84 + 0.15 * rg - 0.13 * step(0.55, rg2) * smoothstep(0.72, 0.9, vL.y);       // the tip is torn in notches
        if (vL.z < 0.03 || vL.y > tipE) discard;
        float curlT = smoothstep(0.4, 0.5, vL.y);                                                   // 0 on the rising face, 1 in the roll
        // the grass side is the ground between the blades (the world plants its own meadow grass on this sheet): the
        // meadow's own tone (uTone), grain the same size in both directions, flecked with daisies
        float g1 = gsVn(vec3(xm * 0.9, m * 0.9, 1.0)), g2 = gsVn(vec3(xm * 3.1, m * 3.1, 6.0)), g3 = gsVn(vec3(xm * 0.21, m * 0.21, 3.0));
        float toneL = dot(uTone, vec3(0.3333));
        vec3 wht = uW * (0.45 + 0.55 * toneL);
        vec3 turf = mix(uG0, uG2, 0.18 + 0.3 * g3) * (0.6 + 0.3 * g1 + 0.28 * g2) * uTone;
        turf = mix(turf, wht * 0.8, smoothstep(0.66, 0.74, gsVn(vec3(xm * 2.3, m * 2.3, 3.0))) * (0.35 + 0.5 * vL.y));    // daisies thicken toward the crest
        turf = mix(turf, uM * 0.8 * toneL, smoothstep(0.86, 0.9, gsVn(vec3(xm * 2.9 + 7.0, m * 2.9, 11.0))) * 0.7);
        float cl = abs(vL.y - 0.43 - 0.05 * (rg - 0.5)), clw = 0.03 + 0.035 * gsVn(vec3(xm * 0.3, 4.0, uT * 0.2));
        turf = mix(turf, wht * 0.95, (1.0 - smoothstep(clw, clw + 0.035, cl)) * smoothstep(0.26, 0.44, gsVn(vec3(xm * 0.4, uT * 0.15, 31.0))) * (0.55 + 0.45 * g2) * smoothstep(0.42, 0.62, gsVn(vec3(xm * 2.3, m * 2.3, 3.0))) * (0.25 + 0.75 * smoothstep(0.3, 0.7, vL.z)));   // the peeling edge: a broken, dotted white line of daisies, faint on the low fringe (never a painted band)
        // the lip thrown out over the meadow wears the meadow on its top (the far side of the sheet) with a torn white line of
        // flowers along its leading edge; what hangs under it, and the hollow at the top of the rising face, is shadowed soil
        float edgeL = (1.0 - smoothstep(0.05, 0.1, abs(vL.y - 0.83 - 0.06 * (rg - 0.5)))) * smoothstep(0.3, 0.46, gsVn(vec3(xm * 0.4, uT * 0.15, 31.0)));
        vec3 topTurf = mix(turf, wht * 0.95, max(edgeL * (0.6 + 0.4 * g2), 0.5 * smoothstep(0.6, 0.7, gsVn(vec3(xm * 2.3, m * 2.3, 3.0))) * smoothstep(0.55, 0.8, vL.y)));
        // the underside of the sod: crumbly earth in three browns, stones, short pale roots each with its own slant, rags of turf
        vec3 sq = vec3(xm, m, 0.0), so = vec3(0.0, 0.0, 1.0);
        float e1 = gsVn(sq * 0.31 + so * 4.0), e2 = gsVn(sq * 1.3 + so * 14.0);
        float clod = gsVn(sq * 2.4 + so * 27.0), clod2 = gsVn(sq * 6.5 + so * 33.0);
        vec3 soil = mix(vec3(0.085, 0.04, 0.018), vec3(0.17, 0.082, 0.036), e1) * (0.75 + 0.5 * e2);
        soil = mix(soil, vec3(0.22, 0.14, 0.07), smoothstep(0.5, 0.7, gsVn(sq * 0.7 + so * 41.0)) * 0.7);           // a third, paler brown: dry crumbs
        soil *= (0.5 + 0.95 * smoothstep(0.3, 0.7, clod)) * (0.8 + 0.4 * clod2);                                          // clods and the pits between them
        // short pale roots: one to a cell in two cells out of five, each turned its own way, so no two run parallel
        vec2 rc = vec2(xm, m) / 1.2, ri = floor(rc), rf = fract(rc) - 0.5; float rh = gsH3(vec3(ri, 5.0)), rh2 = gsH3(vec3(ri, 9.0));
        float ra = rh * 6.2832, rcs = cos(ra), rsn = sin(ra); rf -= (vec2(rh2, fract(rh * 13.7)) - 0.5) * 0.3;
        vec2 rq = vec2(rf.x * rcs - rf.y * rsn, rf.x * rsn + rf.y * rcs);
        float root = (1.0 - smoothstep(0.02, 0.05, abs(rq.y - 0.07 * sin(rq.x * 11.0 + rh * 20.0)))) * (1.0 - smoothstep(0.16, 0.3, abs(rq.x))) * step(0.6, fract(rh2 * 7.3));
        soil = mix(soil, vec3(0.4, 0.33, 0.23), root * 0.6);
        soil = mix(soil, vec3(0.5, 0.48, 0.45), smoothstep(0.8, 0.86, gsVn(sq * 1.9 + so * 21.0)) * 0.7);            // stones
        soil = mix(soil, turf * 1.15, smoothstep(0.64, 0.72, gsVn(sq * 0.5 + so * 19.0) * 0.7 + 0.3 * clod) * 0.85);   // rags of sod still attached
        soil *= 0.8 + 0.25 * smoothstep(0.6, 0.95, vL.y);
        // the crest line, where the sheet stands upright and turns over: the leading edge the eye reads as the top of the wave.
        // It carries the same torn streak of the season's flowers as the swell's own crest; soil begins only under it, in the hollow
        float crestB = vL.w > 0.5 ? 0.0 : smoothstep(-0.2, -0.08, vL.w) * (1.0 - smoothstep(0.1, 0.2, vL.w)) * smoothstep(0.33, 0.42, vL.y) * smoothstep(0.1, 0.3, vL.z);
        crestB *= smoothstep(0.24, 0.4, gsVn(vec3(xm * 0.11, 17.0, uT * 0.05)) * 0.7 + 0.3 * rg2) * (0.7 + 0.3 * g2);
        turf = mix(turf, wht * 0.8, crestB);
        float soilK = vL.w > 0.5 ? 1.0 - smoothstep(0.02, 0.1, vL.y) : smoothstep(0.2, 0.38, vL.w);          // soil and roots only where the sheet hangs face down, in the hollow under the crest
        diffuseColor.rgb = mix(vL.w > 0.5 ? topTurf : turf, soil * (vL.w > 0.5 ? 1.0 : 0.62), soilK);
        // the torn leading edge of the thrown lip, on both sides of the sheet: the last three or four metres before the tear are
        // crowded with the season's flowers, a broken pale band that is the comber's crest line from in front and from below;
        // soil and roots begin behind it, in the hollow
        float tornN = gsVn(vec3(xm * 0.11, 17.0, uT * 0.05)) * 0.7 + 0.3 * rg2;
        float tipB = smoothstep(tipE - 0.36, tipE - 0.2, vL.y) * smoothstep(0.03, 0.12, vL.z) * smoothstep(0.14, 0.3, tornN) * (0.78 + 0.22 * g2);
        // and the top of the thrown lip (the far side of the sheet) carries the streak back from the edge in torn patches, as the swell's crest does
        float topB = vL.w > 0.5 ? smoothstep(0.44, 0.56, vL.y) * smoothstep(0.03, 0.12, vL.z) * smoothstep(0.34, 0.5, gsVn(vec3(xm * 0.07, m * 0.3, 21.0)) * 0.75 + 0.25 * g1) * (0.5 + 0.3 * g2) : 0.0;
        vec3 whtB = uW * (0.7 + 0.3 * toneL);
        float bandB = max(tipB, topB) * (0.72 + 0.28 * smoothstep(0.3, 0.6, gsVn(vec3(xm * 2.3, m * 2.3, 3.0))));   // heads, not paint
        diffuseColor.rgb = mix(diffuseColor.rgb, whtB * 0.95, bandB);
        diffuseColor.rgb *= mix(vec3(0.3, 0.42, 0.58), vec3(1.0), clamp(vShd + 0.6 * bandB, 0.0, 1.0));   // in a swell's shadow the comber is as cool and dark as the meadow it rises from; its flower streak stays the palest thing on it
        gsFill = max(mix(0.05, 0.42, soilK), 0.85 * bandB);                                              // petals pass the sky's light: the streak glows a little on its shaded side
      }`)
      .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\ntotalEmissiveRadiance += diffuseColor.rgb * gsFill;   // sky fill: soil in shade stays brown, never black')
      .replace('#include <opaque_fragment>', 'outgoingLight *= min(1.0, 0.88 / max(max(outgoingLight.r, outgoingLight.g), max(outgoingLight.b, 1e-3)));   // the crest streak stays under the bloom threshold\n#include <opaque_fragment>');
  };
  const lipMesh = new THREE.Mesh(lGeo, lMat); lipMesh.frustumCulled = false; grp.add(lipMesh);
  const lipData = new Uint16Array(NSEG * NLIP * 4), lipTex = new THREE.DataTexture(lipData, NSEG, NLIP, THREE.RGBAFormat, THREE.HalfFloatType);
  lipTex.minFilter = lipTex.magFilter = THREE.NearestFilter; lipTex.wrapS = THREE.RepeatWrapping; lipTex.needsUpdate = true;
  // --- roots: pale threads hanging free off the underside of the roll and past its torn edge, each rooted on the
  // sheet through the lip texture, so the roll's outline is ragged and never a straight polygon edge
  { const nR = 520, rg = new THREE.InstancedBufferGeometry(), aR = new Float32Array(nR * 4);
    rg.setAttribute('position', new THREE.Float32BufferAttribute([-0.5, 0, 0, 0.5, 0, 0, 0.5, 1, 0, -0.5, 0, 0, 0.5, 1, 0, -0.5, 1, 0], 3));
    for (let i = 0; i < nR; i++) {
      const a = clamp(rng.gauss() * 0.8, -2.2, 2.2), tip = rng() < 0.4;                 // crowd the upstream face; two fifths hang from the torn tip
      aR[i * 4] = ((a / TAU) % 1 + 1) % 1 * NSEG; aR[i * 4 + 1] = tip ? rng.range(NLIP - 5.5, NLIP - 1.6) : rng.range(8.2, NLIP - 2.2);
      aR[i * 4 + 2] = rng.range(0.9, 2.4) * (tip ? 1.2 : 0.8); aR[i * 4 + 3] = rng();
    }
    rg.setAttribute('aR', new THREE.InstancedBufferAttribute(aR, 4)); rg.instanceCount = nR; rg.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 320);
    const rMat = new THREE.ShaderMaterial({
      fog: true, side: THREE.DoubleSide,
      uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...L, uT: uTime, uViewH, uLip: { value: lipTex } },
      vertexShader: /* glsl */`
        uniform sampler2D uLip; uniform float uT, uViewH; attribute vec4 aR; varying vec3 vQ; varying float vPx;
        #include <fog_pars_vertex>
        vec4 gsLipT(float i, float v) { return texture2D(uLip, vec2((i + 0.5) / ${NSEG}.0, (v + 0.5) / ${NLIP}.0)); }
        void main() {
          float i0 = floor(aR.x), fi = aR.x - i0, v0 = floor(aR.y), fv = aR.y - v0, vv = aR.y;
          vec4 A = gsLipT(i0, v0), B = gsLipT(i0 + 1.0, v0), C = gsLipT(i0, v0 + 1.0), D = gsLipT(i0 + 1.0, v0 + 1.0);
          vec4 P = mix(mix(A, B, fi), mix(C, D, fi), fv);
          vec3 nn = cross(B.xyz - A.xyz, C.xyz - A.xyz); float nl = length(nn);
          vec3 N = nl > 1e-4 ? nn / nl : vec3(0.0, 1.0, 0.0);
          float t = vv < 7.0 ? 0.45 * vv / 7.0 : 0.45 + 0.55 * (vv - 7.0) / 14.0;
          float thick = 0.6 + 2.4 * pow(max(1.0 - t, 0.0), 0.8) * min(1.0, P.w * 2.2);
          float show = smoothstep(0.24, 0.5, P.w), len = aR.z * show * min(1.0, P.w * 1.5);   // no curtain of roots on the low fringe
          vec4 wp = modelMatrix * vec4(P.xyz + N * 0.05 * thick, 1.0);                 // from the underside of the thrown lip
          vec3 toC = cameraPosition - wp.xyz; float d = max(length(toC), 1e-3);
          vec3 sdv = cross(vec3(0.0, 1.0, 0.0), toC / d); float sl = length(sdv); sdv = sl > 1e-3 ? sdv / sl : vec3(1.0, 0.0, 0.0);
          float pm = 2.0 * d / max(projectionMatrix[1][1] * uViewH, 1.0);              // metres to a pixel at this distance
          float W = max(0.6, 5.0 * pm), y = position.y;
          vec3 outw = normalize(mat3(modelMatrix) * N); vec3 lat = cross(outw, vec3(0.0, 1.0, 0.0)); float ll = length(lat); lat = ll > 1e-3 ? lat / ll : vec3(1.0, 0.0, 0.0);                                // out of the soil side, then drooping
          wp.xyz += sdv * position.x * W * show + (outw * (0.75 * y - 0.3 * y * y) + lat * ((fract(aR.w * 13.7) - 0.5) * 1.5 * y) - vec3(0.0, 1.0, 0.0) * ((0.05 + 0.4 * fract(aR.w * 5.3)) * y + (0.3 + 0.6 * fract(aR.w * 9.1)) * y * y)) * len + vec3(0.24, 0.0, -0.97) * (0.25 * y * y * len * (0.6 + 0.6 * sin(uT * 1.7 + aR.w * 40.0)));
          vQ = vec3(position.x, y, aR.w); vPx = pm / W;
          vec4 mvPosition = viewMatrix * wp;
          gl_Position = projectionMatrix * mvPosition;
          #include <fog_vertex>
        }`,
      fragmentShader: /* glsl */`
        ${GLSL_LIT}
        varying vec3 vQ; varying float vPx;
        void main() {
          float y = vQ.y, sd = vQ.z;
          float th = max(0.055 * (1.0 - 0.7 * y), 0.8 * vPx);                         // half thickness in quad widths: never under about 1.6 pixels
          float x1 = vQ.x - 0.22 * sin(y * 5.0 + sd * 30.0) * y - 0.12, x2 = vQ.x + 0.2 * sin(y * 4.0 + sd * 50.0) * y + 0.15;
          float a = max(1.0 - smoothstep(th * 0.6, th, abs(x1)), (1.0 - smoothstep(th * 0.6, th, abs(x2))) * step(y, 0.4 + 0.5 * fract(sd * 7.3)));
          float crumb = 1.0 - smoothstep(0.1, 0.16, length(vec2(vQ.x - 0.02, (y - 0.05) * 1.6)));     // a crumb of soil where it leaves the sod
          if (max(a, crumb) < 0.5) discard;
          vec3 c = mix(mix(vec3(0.36, 0.3, 0.21), vec3(0.24, 0.17, 0.11), fract(sd * 3.7)), vec3(0.2, 0.12, 0.07), max(crumb, 1.0 - smoothstep(0.0, 0.25, y)));
          gl_FragColor = vec4(c * (uSunCol * 0.2 + uSkyCol * 0.75), 1.0);
          #include <fog_fragment>
        }`,
    });
    const roots = new THREE.Mesh(rg, rMat); roots.frustumCulled = false; roots.name = 'lip-roots'; grp.add(roots); }
  // --- foam: where grass meets rock, a ragged line of daisies churned white (the land's surf) over a soft
  // contact shadow. A thin ring laid on whatever ground the sampler gives, so it also sits on the world's land.
  const fPos = new Float32Array(NSEG * NFOAM * 3), fA = new Float32Array(NSEG * NFOAM * 3), fIdx = [];
  for (let i = 0; i < NSEG; i++) for (let v = 0; v < NFOAM - 1; v++) {
    const a = i * NFOAM + v, b = ((i + 1) % NSEG) * NFOAM + v; fIdx.push(a, b, a + 1, b, b + 1, a + 1);
  }
  const fGeo = new THREE.BufferGeometry();
  fGeo.setAttribute('position', new THREE.BufferAttribute(fPos, 3).setUsage(THREE.DynamicDrawUsage));
  fGeo.setAttribute('aF', new THREE.BufferAttribute(fA, 3).setUsage(THREE.DynamicDrawUsage));     // (metres round the foot, metres out from the rock, lip strength)
  fGeo.setIndex(fIdx); fGeo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 300);
  const fMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, fog: true, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4,
    uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...L, uT: uTime, uW: { value: pal[3] }, uM: { value: pal[6] }, uG1: { value: pal[1] } },
    vertexShader: /* glsl */`
      attribute vec3 aF; varying vec3 vF; varying vec3 vP;
      #include <fog_pars_vertex>
      void main() {
        vec4 wp = modelMatrix * vec4(position, 1.0);
        wp.y += 0.3 + 0.003 * distance(wp.xyz, cameraPosition);                    // stay clear of the coarse far ground
        vF = aF; vP = position;
        vec4 mvPosition = viewMatrix * wp;
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      ${GLSL_LIT}
      ${GLSL_NOISE}
      uniform float uT; uniform vec3 uW, uM, uG1; varying vec3 vF; varying vec3 vP;
      void main() {
        float dr = max(vF.y, 0.0);
        float rag = gsFb(vec3(vF.x * 0.045, uT * 0.05, 3.0)), rag2 = gsVn(vec3(vF.x * 0.31, dr * 0.2 - uT * 0.5, 7.0));
        float reach = 3.0 + 20.0 * rag * rag + 12.0 * vF.z + 5.0 * rag2;
        float foam = 1.0 - smoothstep(0.2 * reach, reach, dr);
        float fw = clamp((fwidth(vP.x) + fwidth(vP.z)) * 0.9, 0.0, 1.0);
        float speck = smoothstep(0.4, 0.6, gsVn(vec3(vP.x * 1.3, vP.z * 1.3, 2.0 + uT * 0.2)));
        float tongue = smoothstep(0.35, 0.7, gsVn(vec3(vF.x * 0.12, dr * 0.08 - uT * 0.25, 1.0)));     // tongues of white sliding along the foot
        float patchy = smoothstep(0.38, 0.62, gsVn(vec3(vP.x * 0.31, vP.z * 0.31, 5.0))) * (0.45 + 0.55 * smoothstep(0.3, 0.6, gsVn(vec3(vP.x * 0.09, vP.z * 0.09, 12.0))));
        float aw = clamp(foam * (0.3 + 0.7 * tongue), 0.0, 1.0) * mix(speck, patchy, fw) * 0.96;
        float flick = smoothstep(0.8, 0.86, gsVn(vec3(vP.x * 0.9 + 5.0, vP.z * 0.9, 9.0))) * foam * (1.0 - fw);
        float sh = (1.0 - smoothstep(0.0, 7.0, dr)) * 0.6;
        vec3 lit = uSunCol * 0.36 + uSkyCol * 0.95;
        vec3 white = mix(mix(uW, vec3(0.95, 0.95, 0.93), 0.8) * 0.9, uM * 0.9, flick) * lit;   // churned pale whatever the season's cap colour
        vec3 dark = uG1 * 0.22 * (uSkyCol * 1.4);
        float r2 = 3.5 + 9.0 * rag2 + 8.0 * gsVn(vec3(vF.x * 0.19, 3.0, 1.0)) + 6.0 * gsVn(vec3(vF.x * 0.9, 5.0, 2.0)) * (1.0 - fw) + 5.0 * vF.z;
        float torn = smoothstep(0.42, 0.6, gsVn(vec3(vF.x * 0.07, 29.0, 3.0)) * 0.6 + 0.4 * gsVn(vec3(vP.x * 0.21, vP.z * 0.21, 8.0))) * (1.0 - smoothstep(0.12, 0.34, vF.z));   // short lengths of torn sod, none where the comber's foot is sewn into the land
        float soil = (1.0 - smoothstep(0.4 * r2, r2, dr)) * (0.3 + 0.5 * smoothstep(0.35, 0.65, gsVn(vec3(vP.x * 0.17, vP.z * 0.17, 23.0)))) * torn;                    // torn turf and soil stain at the contact, ragged
        sh *= 1.0 - smoothstep(0.1, 0.3, vF.z);
        aw *= smoothstep(0.4, 0.62, gsVn(vec3(vF.x * 0.033, 11.0, uT * 0.03))) * (0.3 + 0.7 * patchy) * mix(1.0, speck, 0.6) * (1.0 - smoothstep(0.1, 0.3, vF.z) * (1.0 - smoothstep(12.0, 22.0, dr) * patchy));   // a ragged scatter of flower heads, never a ruled ribbon
        vec3 soilC = mix(vec3(0.13, 0.08, 0.045), vec3(0.22, 0.145, 0.08), gsVn(vec3(vP.x * 0.6, vP.z * 0.6, 3.0))) * lit;
        soilC = mix(soilC, uG1 * 0.5 * lit, smoothstep(0.5, 0.75, gsVn(vec3(vP.x * 0.23, vP.z * 0.23, 17.0))));      // sods still green among the soil
        float aS = max(soil, sh * (1.0 - soil));
        vec3 under = mix(dark, soilC, soil / max(aS, 1e-3));
        float a = max(aw, aS * (1.0 - aw));
        if (a < 0.01) discard;
        gl_FragColor = vec4(mix(under, white, aw / max(a, 1e-3)), a);
        #include <fog_fragment>
      }`,
  });
  const foamMesh = new THREE.Mesh(fGeo, fMat); foamMesh.frustumCulled = false; foamMesh.renderOrder = 1; grp.add(foamMesh);
  return { grp, skirt, sGeo, lGeo, fGeo, fPos, fA, sPos, sNor, sCap, lPos, lNor, lUv, lArc, lShd, footSeg, lipRock, skirtRadius, lipData, lipTex, shade: null, lump: null };
}

// the lip's section, as plain functions (no closures are made per frame or per segment)
const LIP_RISE_ROWS = 8, LIP_FR = 0.45, LIP_DA = TAU / NSEG;
const LIP_Q = new Float64Array(2);                                 // lipRock's height in, the rock's radius out (buildTor)
function lipTOf(v) { return v < LIP_RISE_ROWS ? LIP_FR * v / (LIP_RISE_ROWS - 1) : LIP_FR + (1 - LIP_FR) * (v - LIP_RISE_ROWS + 1) / (NLIP - LIP_RISE_ROWS); }
function lipBend(t, alpha0, curl) { return t < LIP_FR ? alpha0 - 0.3 * (t / LIP_FR) * (t / LIP_FR) : alpha0 - 0.3 - curl * (t - LIP_FR) / (1 - LIP_FR); }
// what a row's place in the section fixes whatever the segment and the hour: its t (LIP_T), and the three factors of the half thickness that t alone enters (LIP_TH)
const LIP_T = new Float64Array(NLIP), LIP_TH = new Float64Array(NLIP * 3);
for (let v = 0; v < NLIP; v++) { const t = lipTOf(v); LIP_T[v] = t; LIP_TH[v * 3] = 2.6 * Math.pow(1 - t, 0.8); LIP_TH[v * 3 + 1] = smoothstep(LIP_FR - 0.2, LIP_FR + 0.1, t); LIP_TH[v * 3 + 2] = 1 - smoothstep(0.82, 1, t); }
function updateSurf(S, sampler, tw, yc, rc, lip, noise, lipTop) {
  const { sPos, sNor, sCap, lPos, lNor, lUv, lArc, lShd, footSeg, lipRock, skirtRadius, lipData, lump: clod } = S, toHalf = THREE.DataUtils.toHalfFloat;
  if (S.skirt.visible) {
    for (let i = 0; i < NSEG; i++) {
      const a = i / NSEG * TAU, sx = Math.sin(a), cz = Math.cos(a), r0 = rc[i];
      for (let j = 0; j < NRAD; j++) {
        const o = (i * NRAD + j) * 3;
        let r, y;
        if (j === 0) { r = r0 - 2.5; y = yc[i] + 1.2; }
        else { const f = (j - 1) / (NRAD - 2); r = r0 + 0.4 + (skirtRadius - r0) * Math.pow(f, 1.75); y = sampler(sx * r, cz * r, tw); if (j === 1) y = Math.max(y, yc[i]); }
        sPos[o] = sx * r; sPos[o + 1] = y; sPos[o + 2] = cz * r;
        const c = (i * NRAD + j) * 2;
        sCap[c] = smoothstep(14, 40, y) * smoothstep(0, 30, r - r0);
        sCap[c + 1] = 1 - smoothstep(1, 11 + 14 * lip[i], r - r0);
      }
    }
    for (let i = 0; i < NSEG; i++) {                                               // normals from the grid
      const ip = ((i + 1) % NSEG) * NRAD, im = ((i + NSEG - 1) % NSEG) * NRAD;
      for (let j = 0; j < NRAD; j++) {
        const o = (i * NRAD + j) * 3, jp = Math.min(j + 1, NRAD - 1), jm = Math.max(j - 1, 0);
        const a3 = (i * NRAD + jp) * 3, b3 = (i * NRAD + jm) * 3, c3 = (ip + j) * 3, d3 = (im + j) * 3;
        const ux = sPos[a3] - sPos[b3], uy = sPos[a3 + 1] - sPos[b3 + 1], uz = sPos[a3 + 2] - sPos[b3 + 2];
        const vx = sPos[c3] - sPos[d3], vy = sPos[c3 + 1] - sPos[d3 + 1], vz = sPos[c3 + 2] - sPos[d3 + 2];
        let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
        if (ny < 0) { nx = -nx; ny = -ny; nz = -nz; }
        const l = Math.hypot(nx, ny, nz) || 1; sNor[o] = nx / l; sNor[o + 1] = ny / l; sNor[o + 2] = nz / l;
      }
    }
    S.sGeo.attributes.position.needsUpdate = true; S.sGeo.attributes.normal.needsUpdate = true; S.sGeo.attributes.aCap.needsUpdate = true;
  }
  // foam ring: laid on the sampled ground from just up the rock to 52 m out
  { const { fPos, fA } = S;
    for (let i = 0; i < NSEG; i++) {
      const a = i / NSEG * TAU, sx = Math.sin(a), cz = Math.cos(a), r0 = rc[i];
      for (let j = 0; j < NFOAM; j++) {
        const o = (i * NFOAM + j) * 3, r = r0 + FOAM_R[j];
        fPos[o] = sx * r; fPos[o + 1] = j === 0 ? yc[i] + 2.6 : Math.max(sampler(sx * r, cz * r, tw), j === 1 ? yc[i] : -1e9); fPos[o + 2] = cz * r;
        fA[o] = ((i + NSEG / 2) % NSEG) * 7.4; fA[o + 1] = FOAM_R[j]; fA[o + 2] = lip[i];
      }
    }
    S.fGeo.attributes.position.needsUpdate = true; S.fGeo.attributes.aF.needsUpdate = true; }
  // lip: a comber in section. It climbs the rock from below the contact line (every row is held clear of the
  // rock's own outline at its height, so the sheet can never dive inside it), leans out, and its last 44 percent
  // peels away in a round curl that rolls back over the incoming meadow: grass on the rising face and over the
  // top, soil and roots on the hanging front of the roll.
  const NROW = NLIP * 2, FR = LIP_FR;
  for (let i = 0; i < NSEG; i++) {
    const a = i / NSEG * TAU, sx = Math.sin(a), cz = Math.cos(a);
    let sm = 0, sw = 0;                                                              // a long comber, not a row of peaks: smooth widely, then saturate
    for (let d = -5; d <= 5; d++) { const w = 6 - Math.abs(d); sm += w * lip[(i + NSEG + d) % NSEG]; sw += w; }
    const aK = archK(i); let s = Math.max(smoothstep(0.02, 0.4, sm / sw), 0.3 + 0.06 * noise.n2(i * 0.21 + 11, 3.3)) * aK;   // turf stands a little way up the rock all round, ragged: never a bare seam
    { let da = a - ARCH_ANG; da = Math.atan2(Math.sin(da), Math.cos(da));           // and its top stays well under the approach line where that passes near
      if (Math.abs(da) < 1.2) {
        const lat = Math.abs(Math.sin(da)) * rc[i], along = Math.cos(da) * rc[i];
        const room = ARCH.y + 9 - Math.max(0, along - ARCH_R) * 0.364 - 26 - yc[i], want = (0.45 * LIP_LEN + 20) * s;
        s *= lerp(clamp(room / Math.max(want, 1), 0.12, 1), 1, smoothstep(40, 85, lat));
      } }
    const rag = 0.94 + 0.2 * noise.n2(i * 0.13, tw * 0.2) + 0.1 * noise.n2(i * 0.6, tw * 0.45);
    const rise = 0.45 * LIP_LEN * s * clamp(rag, 0.72, 1.2), Rc = Math.min(6 + 6.5 * s, 0.4 * rise + 1.2) * smoothstep(0.03, 0.2, s) * clamp(rag, 0.8, 1.15);   // the roll never outgrows the sheet under it   // the roll keeps its size while the sheet under it grows
    const dRdy = (footSeg(i, yc[i] + 3) - footSeg(i, yc[i] - 3)) / 6;
    const alpha0 = Math.atan2(1, Math.min(dRdy, -0.15)) - 0.1;                     // up the rock face
    const curl = (1.3 + 0.2 * smoothstep(-18, 30, yc[i])) * (0.92 + 0.16 * noise.n2(i * 0.11 + 40, tw * 0.15));   // the lip is thrown out and down over the meadow, never rolled right round: its top stays turf
    const hold = 2.4, y0 = yc[i] - 1.5 - 5.5 * smoothstep(0.3, 0.8, s), m22 = Math.min(1, s * 2.2), m34 = 3.4 * m22, sH = toHalf(s);            // a low fringe starts at the contact line, so its face shows and nothing hangs over bare rock
    LIP_Q[0] = y0; lipRock(i); let pr = LIP_Q[1], py = y0, top = py, tPrev = 0, arcG = 0, arcS = 0, pgr = 0, pgy = 0, pbr = 0, pby = 0;
    const shd = S.shade ? S.shade(sx * (rc[i] + 4), cz * (rc[i] + 4), 0.35 * rise, tw) : 1;
    for (let v = 0; v < NLIP; v++) {
      const t = LIP_T[v], al = lipBend(t, alpha0, curl);
      if (v > 0) { const am = lipBend((t + tPrev) * 0.5, alpha0, curl), ds = (t <= FR ? rise / FR : curl * Rc / (1 - FR)) * (t - tPrev) + (v === 1 ? 7 * smoothstep(0.3, 0.8, s) : 0); pr += Math.cos(am) * ds; py += Math.sin(am) * ds; }
      tPrev = t;
      LIP_Q[0] = py; lipRock(i); const rk = LIP_Q[1]; if (pr < rk) pr = rk;                                // never inside the rock
      const nr = Math.sin(al), ny = -Math.cos(al);
      const th = (0.55 + LIP_TH[v * 3] * m22 + m34 * LIP_TH[v * 3 + 1] * LIP_TH[v * 3 + 2]) * 0.5;   // half thickness: thick and round where it crests
      const o = (i * NROW + v) * 3, q = (i * NROW + (NROW - 1 - v)) * 3, o4 = (i * NROW + v) * 4, q4 = (i * NROW + (NROW - 1 - v)) * 4;
      let gr = pr + nr * (hold + 2 * th); const gy = py + ny * (hold + 2 * th);
      if (t <= FR) { LIP_Q[0] = gy; lipRock(i); const rg = LIP_Q[1] + hold; if (gr < rg) gr = rg; }
      let gyy = gy;
      if (v === 0) { const rr0 = gr + 5, g0 = sampler(sx * rr0, cz * rr0, tw) - 1.5; if (g0 < gy) { gr = rr0; gyy = g0; } }   // the comber's foot is sewn into the land in front of it: no edge hangs over a hollow
      lPos[o] = sx * gr; lPos[o + 1] = gyy; lPos[o + 2] = cz * gr; lShd[i * NROW + v] = lShd[i * NROW + (NROW - 1 - v)] = shd;
      { const li = (v * NSEG + i) * 4; lipData[li] = toHalf(sx * gr); lipData[li + 1] = toHalf(gyy); lipData[li + 2] = toHalf(cz * gr); lipData[li + 3] = sH; }
      lNor[o] = sx * nr; lNor[o + 1] = ny; lNor[o + 2] = cz * nr;
      // the underside of the roll is crumbly: clods stand proud of its outline (fixed to the sheet, so they do not crawl)
      const lump = t > FR ? clod[i * NLIP + v] * Math.min(1, s * 3) : 0;
      let br = pr + nr * (hold - lump); const by = py + ny * (hold - lump);
      if (t <= FR) { LIP_Q[0] = by; lipRock(i); const rb = LIP_Q[1] + 0.5; if (br < rb) br = rb; }
      lPos[q] = sx * br; lPos[q + 1] = by; lPos[q + 2] = cz * br;
      lNor[q] = -sx * nr; lNor[q + 1] = -ny; lNor[q + 2] = -cz * nr;
      const along = (i + NSEG / 2) % NSEG;
      lUv[o4] = along; lUv[o4 + 1] = t; lUv[o4 + 2] = s; { const ca = -ny; lUv[o4 + 3] = ca > 0.1 ? 0.45 * smoothstep(0.1, 0.55, ca) : -0.2 * smoothstep(0.1, -0.3, ca); }   // grass side: 0 where it faces out or up .. 0.45 where it hangs face down (the hollow)
      lUv[q4] = along; lUv[q4 + 1] = t; lUv[q4 + 2] = s; lUv[q4 + 3] = 1;
      if (v > 0) { arcG += Math.hypot(gr - pgr, gy - pgy); arcS += Math.hypot(br - pbr, by - pby); }      // each side measured along its own surface
      pgr = gr; pgy = gy; pbr = br; pby = by;
      lArc[i * NROW + v] = arcG; lArc[i * NROW + (NROW - 1 - v)] = arcS;
      if (py > top) top = py;
    }
    lipTop[i] = top;
  }
  S.lGeo.attributes.position.needsUpdate = true; S.lGeo.attributes.normal.needsUpdate = true; S.lGeo.attributes.aL.needsUpdate = true; S.lGeo.attributes.aArc.needsUpdate = true; S.lGeo.attributes.aShd.needsUpdate = true;
  S.lipTex.needsUpdate = true;
}

// ---------------------------------------------------------------- what the break throws: clods and the petal plume
// Both read a small history texture (one row per 0.75 s of wave time, one texel per lip segment:
// contact radius, lip-top height, lip strength, contact height), so every particle keeps the launch
// it was given and the plume outlives the lip that threw it. All motion is a function of wave time.
const GLSL_LAUNCH = /* glsl */`
uniform sampler2D uHist; uniform float uT, uViewH;
attribute vec4 aSeed; attribute vec3 aRnd;
vec4 gsLaunch(float life, out float age) {
  float cyc = floor((uT + aSeed.y) / life), t0 = cyc * life - aSeed.y;
  age = uT - t0;
  float m0 = floor(t0 / ${ROW_DT.toFixed(2)});
  return texture2D(uHist, vec2((aSeed.x + 0.5) / ${NSEG}.0, (mod(m0, ${HIST}.0) + 0.5) / ${HIST}.0));
}
float gsMinSize(float size, vec3 wp, float px) {
  float d = length(wp - cameraPosition);
  return max(size, px * 2.0 * d / max(projectionMatrix[1][1] * uViewH, 1.0));
}`;
const GLSL_LIT = /* glsl */`
uniform vec3 uSunDir, uSunCol, uSkyCol;
#include <common>
#include <fog_pars_fragment>`;

function buildThrown(rng, pal, detail, L, uTime, uHist, uViewH, axisP, axisD) {
  const grp = new THREE.Group();
  const common = () => ({ ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...L, uT: uTime, uHist, uViewH });
  const seeds = (n, lifeMax, mid = 0, spread = 0.75, share = 0) => {
    const s = new Float32Array(n * 4), r = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      // crowd the upstream face (angle 0 = +Z); 'share' of them gather on the side away from the arch
      const g = rng.gauss(), a = i < n * share ? clamp(mid + g * spread, mid - 1.1, 2.4) : clamp(g * 0.75, -2.4, 2.4);
      s[i * 4] = Math.floor(((a / TAU) % 1 + 1) % 1 * NSEG) % NSEG; s[i * 4 + 1] = rng.range(0, lifeMax * 4); s[i * 4 + 2] = rng(); s[i * 4 + 3] = rng();
      r[i * 3] = rng(); r[i * 3 + 1] = rng(); r[i * 3 + 2] = rng();
    }
    return [new THREE.InstancedBufferAttribute(s, 4), new THREE.InstancedBufferAttribute(r, 3)];
  };
  // --- petals: cupped two-sided quads, five white to one magenta, tumbling
  const nP = Math.round(5200 * detail), pg = new THREE.InstancedBufferGeometry();
  pg.setAttribute('position', new THREE.Float32BufferAttribute([-0.5, -0.5, 0, 0, -0.5, 0.22, 0.5, -0.5, 0, -0.5, 0.5, 0, 0, 0.5, 0.22, 0.5, 0.5, 0], 3));
  pg.setIndex([0, 2, 5, 0, 5, 3]);                                                // two triangles each: at plume distances the cup does not show
  const [ps, pr] = seeds(nP, 11, 0.42, 0.5, 0.6); pg.setAttribute('aSeed', ps); pg.setAttribute('aRnd', pr); pg.instanceCount = nP;
  pg.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 80, 0), 420);
  const pMat = new THREE.ShaderMaterial({
    side: THREE.DoubleSide, fog: true,
    uniforms: { ...common(), uWhite: { value: pal[3].clone().multiplyScalar(0.8) }, uMag: { value: pal[6] }, uAxisP: { value: axisP }, uAxisD: { value: axisD } },
    vertexShader: /* glsl */`
      ${GLSL_LAUNCH}
      uniform vec3 uAxisP, uAxisD;
      varying vec3 vN; varying vec2 vQ; varying float vMag;
      #include <fog_pars_vertex>
      void main() {
        float life = 8.0 + 3.0 * aSeed.z, age;
        vec4 h = gsLaunch(life, age);
        float E = h.z * smoothstep(-30.0, 4.0, h.w), an = (aSeed.x + aRnd.x) / ${NSEG}.0 * 6.2831853;
        vec3 outw = vec3(sin(an), 0.0, cos(an)), up = vec3(0.0, 1.0, 0.0);
        float k = 1.0 - exp(-age / 2.6);
        float v0 = (20.0 + 56.0 * aRnd.y * sqrt(aRnd.y)) * sqrt(max(E, 0.0)) * (0.55 + 0.45 * cos(aSeed.x / 144.0 * 6.2831853));   // most of it stays low, thick along the crest it is thrown from; a few fly high
        vec3 p = outw * (h.x + 2.0 + aRnd.z * 5.0) + up * (h.y - 2.0 * aRnd.x);
        p += up * (v0 * 2.6 * k - 1.5 * max(age - 2.5, 0.0)) + outw * (3.0 + 16.0 * aRnd.z) * k * (0.4 + E);
        p += vec3(0.24, 0.0, -0.97) * 8.0 * age * smoothstep(0.3, 3.5, age) * (0.35 + 0.65 * aSeed.w);     // streaming downwind
        p += vec3(outw.z, 0.0, -outw.x) * (aRnd.x - 0.5) * 34.0 * k;                                         // fanning along the crest
        p += vec3(sin(age * 0.9 + aSeed.w * 40.0), 0.6 * sin(age * 1.3 + aRnd.y * 30.0), cos(age * 0.7 + aRnd.x * 50.0)) * (1.0 + 0.6 * age);
        vec3 da = p - uAxisP; float al = dot(da, uAxisD); vec3 rad = da - al * uAxisD; float rl = length(rad);   // clear tube on the approach line
        if (al > -40.0 && al < 320.0 && rl < 6.0) p += (rl > 1e-3 ? rad / rl : up) * (6.0 - rl);
        float show = step(aRnd.z, E * 2.6) * smoothstep(0.0, 0.25, age) * (1.0 - smoothstep(life - 2.5, life, age));
        float size = gsMinSize(0.5 + 0.4 * aRnd.y, (modelMatrix * vec4(p, 1.0)).xyz, 2.7) * show;
        float a1 = aSeed.w * 30.0 + age * (1.5 + 2.0 * aRnd.x), a2 = aRnd.y * 20.0 + age * (1.1 + 1.8 * aRnd.z);
        vec3 X = vec3(cos(a1) * cos(a2), sin(a2), sin(a1) * cos(a2)), Z0 = vec3(-sin(a1), 0.0, cos(a1)), N = cross(X, Z0);
        vec3 wp = p + (X * position.x * 0.8 + Z0 * position.y + N * position.z) * size;
        vN = mat3(modelMatrix) * N; vQ = position.xy; vMag = step(0.833, aSeed.w);
        vec4 mvPosition = viewMatrix * modelMatrix * vec4(wp, 1.0);
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      ${GLSL_LIT}
      uniform vec3 uWhite, uMag; varying vec3 vN; varying vec2 vQ; varying float vMag;
      void main() {
        if (dot(vQ, vQ) > 0.27) discard;
        float nl = abs(dot(vN, uSunDir));
        vec3 alb = mix(uWhite, uMag * 0.9, vMag);
        vec3 sunW = mix(uSunCol, vec3(dot(uSunCol, vec3(0.3, 0.59, 0.11))), 0.75);        // a petal is thin: it glows its own colour from either side, whatever the hour
        vec3 col = alb * (sunW * (0.3 + 0.42 * nl) + uSkyCol * vec3(0.3, 0.28, 0.4));     // sunlit, a cool shadow side; petals wink as they turn
        gl_FragColor = vec4(col, 1.0);
        #include <fog_fragment>
      }`,
  });
  const petals = new THREE.Mesh(pg, pMat); petals.frustumCulled = false; grp.add(petals);
  // --- the plume's body: soft speckled puffs of far petals, faded out near the camera
  const nF = Math.round(900 * detail), fg = new THREE.InstancedBufferGeometry();
  fg.setAttribute('position', new THREE.Float32BufferAttribute([-0.5, -0.5, 0, 0.5, -0.5, 0, 0.5, 0.5, 0, -0.5, 0.5, 0], 3)); fg.setIndex([0, 1, 2, 0, 2, 3]);
  const [fs, fr] = seeds(nF, 11, 0.5, 0.42, 1); fg.setAttribute('aSeed', fs); fg.setAttribute('aRnd', fr); fg.instanceCount = nF;
  fg.boundingSphere = pg.boundingSphere;
  const fMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, fog: true,
    uniforms: { ...common(), uWhite: { value: pal[3].clone().multiplyScalar(0.8) }, uMag: { value: pal[6] } },
    vertexShader: /* glsl */`
      ${GLSL_LAUNCH}
      varying vec2 vQ; varying vec3 vA;
      #include <fog_pars_vertex>
      void main() {
        float life = 8.0 + 3.0 * aSeed.z, age;
        vec4 h = gsLaunch(life, age);
        float E = max(h.z, 0.0) * smoothstep(-30.0, 4.0, h.w), an = (aSeed.x + aRnd.x) / ${NSEG}.0 * 6.2831853;
        vec3 outw = vec3(sin(an), 0.0, cos(an));
        float k = 1.0 - exp(-age / 2.6), v0 = (20.0 + 50.0 * aRnd.y * sqrt(aRnd.y)) * sqrt(E) * (0.55 + 0.45 * cos(an));
        vec3 p = outw * (h.x + 4.0 + aRnd.z * 6.0) + vec3(0.0, h.y + v0 * 2.6 * k - 1.2 * max(age - 3.0, 0.0), 0.0) + outw * (4.0 + 10.0 * aRnd.z) * k;
        p += vec3(0.24, 0.0, -0.97) * 8.0 * age * smoothstep(0.3, 3.5, age) * (0.4 + 0.5 * aSeed.w) + vec3(outw.z, 0.0, -outw.x) * (aRnd.x - 0.5) * 30.0 * k;
        vec4 mvPosition = viewMatrix * modelMatrix * vec4(p, 1.0);
        float size = (13.0 + 17.0 * aRnd.x) * (0.55 + 0.22 * age);
        mvPosition.xy += position.xy * size;
        float show = smoothstep(0.02, 0.26, E) * smoothstep(0.0, 1.2, age) * (1.0 - smoothstep(life * 0.5, life, age)) * smoothstep(45.0, 130.0, -mvPosition.z);
        vQ = position.xy; vA = vec3(show, aSeed.w * 37.0, age);
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      ${GLSL_LIT}
      ${GLSL_NOISE}
      uniform vec3 uWhite, uMag; varying vec2 vQ; varying vec3 vA;
      void main() {
        float r = length(vQ) * 2.0, fall = 1.0 - smoothstep(0.15, 1.0, r);
        float sp2 = gsVn(vec3(vQ * 5.0 - vA.y, vA.z * 0.3));
        // near: separate petals, one to a cell, denser toward the core; far (cells under a pixel): a soft body
        vec2 gq = vQ * 15.0 + vA.y; vec2 ci = floor(gq), cf = fract(gq) - 0.5; float fw = clamp(fwidth(gq.x) * 1.6 - 0.25, 0.0, 1.0);
        float h1 = gsH3(vec3(ci.x, ci.y, 3.0)), h2 = gsH3(vec3(ci.x, ci.y, 11.0)), h3 = gsH3(vec3(ci.x, ci.y, 23.0));
        cf -= (vec2(h2, h3) - 0.5) * 0.45; float pa = h1 * 6.2832 + vA.z * (0.6 + 1.6 * h2), pc = cos(pa), ps = sin(pa);
        vec2 pq = vec2(cf.x * pc - cf.y * ps, cf.x * ps + cf.y * pc);
        float flake = (1.0 - smoothstep(0.75, 1.0, pq.x * pq.x / 0.07 + pq.y * pq.y / 0.022)) * step(h3, fall * (0.55 + 0.7 * sp2));
        float a = vA.x * mix(flake * 0.95, fall * (0.3 + 0.4 * sp2) * 0.8, fw);
        if (a < 0.004) discard;
        vec3 c = mix(uWhite, uMag, mix(step(0.8, h2), 0.3, fw)) * (mix(uSunCol, vec3(dot(uSunCol, vec3(0.3, 0.59, 0.11))), 0.75) * 0.42 + uSkyCol * 0.3) * mix(0.8 + 0.4 * h1, 0.9, fw);   // rose-white petals with their own shade, so they read on a pale sky
        gl_FragColor = vec4(c, a);
        #include <fog_fragment>
      }`,
  });
  const puffs = new THREE.Mesh(fg, fMat); puffs.frustumCulled = false; puffs.renderOrder = 2; grp.add(puffs);
  return { grp, petals, seeds, common };
}

function buildClods(T, rng, pal, detail) {
  const n = Math.round(380 * (0.5 + 0.5 * detail)), base = new THREE.IcosahedronGeometry(1, 0), g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', base.attributes.position); g.setAttribute('normal', base.attributes.normal); if (base.index) g.setIndex(base.index);
  const [cs, cr] = T.seeds(n, 6, 0.42, 0.55, 0.6); g.setAttribute('aSeed', cs); g.setAttribute('aRnd', cr); g.instanceCount = n;
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 30, 0), 300);
  const mat = new THREE.ShaderMaterial({
    fog: true, uniforms: { ...T.common(), uTurf: { value: pal[0] } },
    vertexShader: /* glsl */`
      ${GLSL_LAUNCH}
      varying vec3 vN; varying vec3 vO;
      #include <fog_pars_vertex>
      void main() {
        float life = 4.5 + 1.5 * aSeed.z, age;
        vec4 h = gsLaunch(life, age);
        float E = max(h.z, 0.0), an = (aSeed.x + aRnd.x) / ${NSEG}.0 * 6.2831853;
        vec3 outw = vec3(sin(an), 0.0, cos(an)), up = vec3(0.0, 1.0, 0.0), tang = vec3(cos(an), 0.0, -sin(an));
        vec3 p = outw * (h.x + 1.0 + 4.0 * aRnd.z) + up * (h.y - 3.0 * aRnd.x);
        vec3 v = outw * (5.0 + 15.0 * aRnd.z) * (0.4 + E) + up * (12.0 + 20.0 * aRnd.y) * sqrt(E) + tang * (aSeed.w - 0.5) * 9.0;
        p += v * age - up * 4.9 * age * age;
        float show = step(aRnd.x, E * 1.8) * smoothstep(0.0, 0.15, age) * (1.0 - smoothstep(life - 0.6, life, age));
        float size = gsMinSize(0.55 + 2.3 * aRnd.y * aRnd.y, (modelMatrix * vec4(p, 1.0)).xyz, 1.8) * show;
        vec3 ax = normalize(vec3(aRnd.x - 0.5, 0.35 + aRnd.y, aRnd.z - 0.5));
        float ang = age * (1.5 + 4.0 * aSeed.w), c = cos(ang), s = sin(ang);
        vec3 q = position * vec3(1.0, 0.35 + 0.25 * aSeed.w, 0.8) * (0.62 + 0.7 * fract(sin(dot(position + aRnd, vec3(12.9898, 78.233, 37.719))) * 43758.5453));
        vec3 qr = q * c + cross(ax, q) * s + ax * dot(ax, q) * (1.0 - c);
        vec3 nr = normal * c + cross(ax, normal) * s + ax * dot(ax, normal) * (1.0 - c);
        vN = mat3(modelMatrix) * nr; vO = position;
        vec4 mvPosition = viewMatrix * modelMatrix * vec4(p + qr * size, 1.0);
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      ${GLSL_LIT}
      uniform vec3 uTurf; varying vec3 vN; varying vec3 vO;
      void main() {
        float nl = max(dot(normalize(vN + vec3(0.0, 1e-4, 0.0)), uSunDir), 0.0);
        float rootlet = step(0.82, fract(sin(dot(floor(vO * 5.0), vec3(12.9898, 78.233, 37.719))) * 43758.5453));
        vec3 alb = mix(vec3(0.3, 0.18, 0.095), vec3(0.66, 0.6, 0.46), rootlet * 0.7);
        alb = mix(alb, uTurf * (0.75 + 0.45 * rootlet), smoothstep(0.05, 0.4, vO.y));                // a sod: grass on top, soil and roots below
        gl_FragColor = vec4(alb * (uSunCol * (0.12 + 0.88 * nl) + uSkyCol * 1.2), 1.0);
        #include <fog_fragment>
      }`,
  });
  const m = new THREE.Mesh(g, mat); m.frustumCulled = false; T.grp.add(m); base.dispose();
  return m;
}

// ---------------------------------------------------------------- waterfalls of long grass draining down the gullies
function buildFalls(form, torR, pal, L, uTime) {
  const pos = [], aw = [], idx = [], ROWS = 40, YT = 64, YB = -54;
  form.gullies.forEach((ga, g) => {
    const b = pos.length / 3, hq = Math.abs(Math.sin(g * 12.9898 + 1.7) * 43758.5453) % 1, hw = 4.5 + 19.0 * hq * hq;      // half-width: threads to broad sheets
    for (let j = 0; j <= ROWS; j++) {
      const y = lerp(YT, YB, j / ROWS), r = torR(ga, y) + 1.1 + (g % 3) * 0.3, fan = 1 + 1.0 * smoothstep(0, 1, (36 - y) / 80);
      for (let k = -2; k <= 2; k++) {
        const a = ga + k * 0.5 * hw * fan / Math.max(r, 30), rr = Math.max(r, torR(a, y) + 0.5 + (g % 3) * 0.3) + 0.5 - 0.12 * Math.abs(k);
        pos.push(Math.sin(a) * rr, y, Math.cos(a) * rr); aw.push(k * 0.5, g, ga);
      }
    }
    for (let j = 0; j < ROWS; j++) for (let k = 0; k < 4; k++) { const a = b + j * 5 + k, c = a + 5; idx.push(a, a + 1, c, a + 1, c + 1, c); }
  });
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('aW', new THREE.Float32BufferAttribute(aw, 3)); geo.setIndex(idx); geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), 300);
  const gul = []; for (let i = 0; i < 24; i++) gul.push(new THREE.Vector4(0, 0, 0, 0));
  const mat = new THREE.ShaderMaterial({
    fog: true, side: THREE.DoubleSide,
    uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...L, uT: uTime, uGul: { value: gul }, uG0: { value: pal[0] }, uG2: { value: pal[2] }, uW: { value: pal[3] }, uM: { value: pal[6] } },
    vertexShader: /* glsl */`
      attribute vec3 aW; uniform vec4 uGul[24]; varying vec4 vG; varying vec3 vW; varying vec3 vN;
      #include <fog_pars_vertex>
      void main() {
        vG = uGul[int(aW.y + 0.5)]; vW = vec3(aW.x, position.y, aW.y);
        vN = mat3(modelMatrix) * vec3(sin(aW.z), 0.35, cos(aW.z));
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      ${GLSL_LIT}
      ${GLSL_NOISE}
      uniform float uT; uniform vec3 uG0, uG2, uW, uM; varying vec4 vG; varying vec3 vW; varying vec3 vN;
      void main() {
        float gv2 = fract(vW.z * 0.381 + 0.5);                                     // every gully drains from its own height
        if (vW.y < vG.x - 1.0 || vW.y > vG.y - 24.0 * gv2 * gv2 || vG.z < 0.02) discard;
        float fall = vW.y + uT * (9.0 + 3.0 * fract(vW.z * 0.37));                 // the pattern slides down
        float strand = gsVn(vec3(vW.x * 7.0 + vW.z * 7.0, fall * 0.04, 1.0)) * 0.55 + gsVn(vec3(vW.x * 19.0, fall * 0.11, vW.z)) * 0.45;   // long thin strands: as it drains it thins to threads, never to blocks
        float head = smoothstep(vG.y - 24.0 * gv2 * gv2, vG.y - 24.0 * gv2 * gv2 - 14.0, vW.y);                          // thin at the top where it has drained
        float gv = fract(vW.z * 0.618 + 0.13); float cover = min(1.0, vG.z * 1.6) * (1.0 - 0.75 * vW.x * vW.x) * (0.5 + 0.5 * head) * (0.35 + 0.65 * gv);
        if (strand > cover * 0.95) discard;
        vec3 c = mix(uG0 * 0.85, uG2, smoothstep(0.3, 0.95, strand / max(cover, 0.05)) * 0.7);
        float fl = gsVn(vec3(vW.x * 9.0 + vW.z * 3.0, fall * 0.9, 3.0));
        c = mix(c, uW * 0.85, smoothstep(0.62, 0.7, fl)); c = mix(c, uM * 0.85, smoothstep(0.2, 0.16, fl) * 0.8);
        float nl = max(dot(normalize(vN), uSunDir), 0.0);
        gl_FragColor = vec4(c * (uSunCol * (0.16 + 0.44 * nl) + uSkyCol * 0.8), 1.0);
        #include <fog_fragment>
      }`,
  });
  const mesh = new THREE.Mesh(geo, mat);
  return { mesh, gul };
}

export async function buildHero(ctx, opts = {}) {
  const pal = (opts.palette || DEFAULT_PALETTE).map((h) => new THREE.Color(h));
  while (pal.length < 7) pal.push(new THREE.Color(DEFAULT_PALETTE[pal.length]));
  const detail = clamp(opts.detail ?? ctx.quality?.detail ?? 1, 0.6, 1);
  const rng = ctx.rng.fork ? ctx.rng.fork('stillstone') : ctx.rng, noise = ctx.noise;
  const { mergeGeometries } = await import('three/addons/utils/BufferGeometryUtils.js');
  const object = new THREE.Group(); object.name = 'stillstone';
  const uTime = { value: 0 }, uWall = { value: 0 }, uViewH = { value: 1080 }, L = makeLightUniforms(pal);

  const form = makeTorForm(rng, noise);
  await ctx.yield?.();
  // the radial surface is sampled row by row with the page given back between batches (no step over ~30 ms)
  const torRows = new Float32Array(NA * NY);
  for (let j = 0; j < NY; j++) {
    const y = Y0 + (Y1 - Y0) * j / (NY - 1); for (let i = 0; i < NA; i++) torRows[j * NA + i] = form.surfR(i / NA * TAU, y);
    if (j % 2 === 1) await ctx.yield?.();
  }
  const pause = () => ctx.yield?.();
  const tor = await buildTor(form, pal, rng.range(0, 50), torRows, pause, L.uSunDir);
  object.add(tor.mesh);
  await ctx.yield?.();
  const ledges = findLedges(tor.torR);
  await ctx.yield?.();
  object.add(new THREE.Mesh(await buildArchAndClitter(rng, noise, ledges, mergeGeometries, pause), tor.mesh.material));
  await ctx.yield?.();
  // CLITTER AT THE FOOT: granite blocks lie on the scoured apron all round the tor, a little bedded in it, so the line where the land
  // meets the rock is broken by rock and reads as a foot; the land (and the turf that stands against the rock) rises round them, half
  // buries them and falls away. A rule of the tor alone: 64 blocks, one to each equal step of bearing, jittered within its own step;
  // each at a height drawn in the band the land scours (y -30 to 44) and laid at the nearest height to that where the apron will carry
  // it (where the rock spreads 0.7 m or more for each metre down; the foot is a wall below the mean ground). It lies on the apron's own
  // slope there, its long side along the foot (turned up to half a radian either way, rolled a little), 0.15 to 0.35 of its thickness
  // in the rock. Long sides 5 to 15 m (as large as clitter lies under a tor of this size), down to a third of that where the land
  // heaps against the upstream side and the comber grinds them. Six dice a block from a stream of its own, all drawn before a block
  // is built, all used, no test: every block lies where its dice put it.
  { const cr = gsOwnRng(((ctx.seed | 0) ^ 0x4c17) + 2609), NB = 64, dice = new Float32Array(NB * 6), blocks = [];
    const bx = new THREE.Vector3(), by = new THREE.Vector3(), bz = new THREE.Vector3(), bm = new THREE.Matrix4();
    for (let i = 0; i < NB * 6; i++) dice[i] = cr();
    for (let i = 0; i < NB; i++) {
      const o = i * 6, a = (i + dice[o]) / NB * TAU, sa = Math.sin(a), ca = Math.cos(a);
      const len = (5 + 10 * Math.pow(dice[o + 2], 1.3)) * (1 - 0.65 * smoothstep(0.5, 0.92, ca));
      const thick = len * (0.6 + 0.35 * ((dice[o + 4] * 5.3) % 1)), deep = len * (0.6 + 0.35 * ((dice[o + 5] * 7.7) % 1)), h = Math.max(2.5, 0.35 * deep);
      const spread = (yy) => (tor.torR(a, yy - h) - tor.torR(a, yy + h)) / (2 * h);                 // metres the apron spreads for each metre down, over the block's own footing
      let y = lerp(-30, 44, dice[o + 1]); for (let k = 1; k < 90 && spread(y) < 0.7; k++) y += k % 2 ? -k : k;   // it lies where the apron will carry it, nearest the drawn height (a metre below, a metre above, two below ...)
      const sp = Math.max(spread(y), 0.7), nl = Math.hypot(1, sp), nr = 1 / nl, ny = sp / nl;        // the apron's outward normal there, in the bearing's own plane
      const lift = thick * (0.5 - lerp(0.15, 0.35, dice[o + 3])), r = tor.torR(a, y) + nr * lift, cx = sa * r, cy = y + ny * lift, cz = ca * r;
      pushRock(blocks, noise, cx, cy, cz, len, thick, deep, 0, 0, 0.82);
      const turn = dice[o + 4] - 0.5, ct = Math.cos(turn), st = Math.sin(turn), roll = (dice[o + 5] - 0.5) * 0.7, cr2 = Math.cos(roll), sr2 = Math.sin(roll);
      bx.set(ca * ct + sa * ny * st, -nr * st, -sa * ct + ca * ny * st); by.set(sa * nr, ny, ca * nr);                       // along the foot (turned); out of the apron
      bz.set(-ca * st + sa * ny * ct, -nr * ct, sa * st + ca * ny * ct);                                                    // out and down the apron
      bm.makeBasis(bx.clone().multiplyScalar(cr2).addScaledVector(by, sr2), by.clone().multiplyScalar(cr2).addScaledVector(bx, -sr2), bz);
      blocks[i].translate(-cx, -cy, -cz).applyMatrix4(bm).translate(cx, cy, cz);
      if (i % 16 === 15) await ctx.yield?.();
    }
    const geo = mergeGeometries(blocks, false); geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 7, 0), 230);
    const foot = new THREE.Mesh(geo, tor.mesh.material); foot.name = 'foot-clitter'; object.add(foot); }
  await ctx.yield?.();
  const foliage = await buildFoliage(rng, noise, ledges, pal, detail, uWall, pause);
  object.add(foliage.mesh);
  await ctx.yield?.();

  // the approach: straight in along the arch's radial, climbing 20 degrees
  const nx = Math.sin(ARCH_ANG), nz = Math.cos(ARCH_ANG), c20 = Math.cos(20 * Math.PI / 180), s20 = Math.sin(20 * Math.PI / 180);
  const seatP = new THREE.Vector3(ARCH.x, ARCH.y + 9, ARCH.z), travel = new THREE.Vector3(-nx * c20, s20, -nz * c20), back = travel.clone().negate();
  const at = (d, lift = 0) => seatP.clone().addScaledVector(back, d).add(new THREE.Vector3(0, lift, 0));

  const solver = makeBreakSolver(tor.footSeg);
  let sampler = makeDefaultSwell(rng); solver.setSampler(sampler);
  const surf = buildSurf(pal, tor.footR, opts.skirtRadius ?? 640, opts.skirt !== false, uWall, rng.range(0, 50), L, uViewH, ctx.core?.makeRng ? ctx.core.makeRng(((ctx.seed | 0) ^ 0x3c5) + 77) : rng, tor.footSeg, tor.lipRock);
  // the clods under the roll are fixed to the sheet: what the segment and the row alone decide of them is worked out once here, the same products in the same order (noise.n2 keeps no state and draws nothing)
  { const clod = surf.lump = new Float64Array(NSEG * NLIP);
    for (let i = 0; i < NSEG; i++) for (let v = 0; v < NLIP; v++) { const t = lipTOf(v); if (t > LIP_FR) clod[i * NLIP + v] = 0.45 * (0.6 + 1.5 * noise.n2(i * 0.83 + 7, v * 1.37) + 2.2 * noise.n2(i * 0.29 + 3, v * 0.41)) * smoothstep(LIP_FR, LIP_FR + 0.12, t); } }
  object.add(surf.grp);
  await ctx.yield?.();
  const hist = new Uint16Array(NSEG * HIST * 4), histTex = new THREE.DataTexture(hist, NSEG, HIST, THREE.RGBAFormat, THREE.HalfFloatType);
  histTex.minFilter = histTex.magFilter = THREE.NearestFilter; histTex.needsUpdate = true;
  const uHist = { value: histTex };
  const thrown = buildThrown(rng, pal, detail, L, uTime, uHist, uViewH, seatP, back);
  await ctx.yield?.();
  buildClods(thrown, rng, pal, detail);
  object.add(thrown.grp);
  await ctx.yield?.();
  const falls = buildFalls(form, tor.torR, pal, L, uTime); object.add(falls.mesh);
  await ctx.yield?.();
  const size = new THREE.Vector2();
  thrown.petals.onBeforeRender = (renderer) => { renderer.getDrawingBufferSize(size); uViewH.value = size.y; };

  const yc = new Float32Array(NSEG), rc = new Float32Array(NSEG), lip = new Float32Array(NSEG), lipTop = new Float32Array(NSEG);
  const hy = new Float32Array(NSEG), hr = new Float32Array(NSEG), hl = new Float32Array(NSEG);
  const rowM = new Int32Array(HIST).fill(-1e9), rowTop = new Float32Array(NSEG * HIST), toHalf = THREE.DataUtils.toHalfFloat;
  const gSeg = form.gullies.map((a) => ((Math.round(a / TAU * NSEG) % NSEG) + NSEG) % NSEG);
  const GH = 36, gRowM = new Int32Array(GH).fill(-1e9), gTop = new Float32Array(GH * 24);
  let progress = null;

  const step = (tw) => {
    uTime.value = tw;
    solver.state(tw, yc, rc, lip);
    updateSurf(surf, sampler, tw, yc, rc, lip, noise, lipTop);
    const n = Math.floor(tw / ROW_DT); let dirty = false;
    for (let m = n - HIST + 1; m <= n; m++) {                                       // fill any history rows not yet known
      const slot = ((m % HIST) + HIST) % HIST; if (rowM[slot] === m) continue;
      solver.state(m * ROW_DT, hy, hr, hl); rowM[slot] = m; dirty = true;
      for (let i = 0; i < NSEG; i++) {
        const o = (slot * NSEG + i) * 4, s = (hl[(i + NSEG - 1) % NSEG] + 2 * hl[i] + hl[(i + 1) % NSEG]) / 4 * archK(i), top = hy[i] + 16 * s;
        hist[o] = toHalf(hr[i]); hist[o + 1] = toHalf(top); hist[o + 2] = toHalf(s); hist[o + 3] = toHalf(hy[i]); rowTop[slot * NSEG + i] = top;
      }
    }
    if (dirty) histTex.needsUpdate = true;
    // gullies: how high the last crest reached and how long ago (a 27 s memory, so one swell's waterfalls are
    // still draining when the next is two thirds of the way in); rows are cached per 0.75 s of wave time
    for (let m = n - GH + 1; m <= n; m++) {
      const slot = ((m % GH) + GH) % GH; if (gRowM[slot] === m) continue;
      gRowM[slot] = m; for (let g = 0; g < gSeg.length; g++) gTop[slot * 24 + g] = solver.reach(gSeg[g], m * ROW_DT);
    }
    for (let g = 0; g < gSeg.length; g++) {
      const sg = gSeg[g]; let best = -1e9, bm = n;
      for (let m = n - GH + 1; m <= n; m++) { const v = gTop[(((m % GH) + GH) % GH) * 24 + g]; if (v > best) { best = v; bm = m; } }
      const top = Math.min(63, best), age = Math.max(0, tw - bm * ROW_DT);
      falls.gul[g].set(yc[sg], top, (1 - smoothstep(13, 26, age)) * smoothstep(2, 9, top - yc[sg]), age);
    }
  };
  step(0);

  return {
    object, radius: 190, height: 280, center: new THREE.Vector3(0, 100, 0),
    anchors: {
      portalSeat: { position: seatP.clone(), facing: back.clone(), travel: travel.clone(), radius: 7, tiltDeg: 20 },
      flyThrough: [at(190), at(130), at(80), at(40), at(15), at(0)],
      archFeet: new THREE.Vector3(ARCH.x, ARCH.y - 5, ARCH.z), bay: seatP.clone().addScaledVector(travel, 16),
      summit: new THREE.Vector3(0, 280, 0), upstream: new THREE.Vector3(0, 0, 1), wind: new THREE.Vector3(0.24, 0, -0.97),
      viewpoints: {
        reveal: new THREE.Vector3(-420, 70, 960), surf: new THREE.Vector3(-330, 45, 420), waterfalls: new THREE.Vector3(-260, 40, 250),
      },
      pines: foliage.pines.map((p) => new THREE.Vector3(p.x, p.y, p.z)),
    },
    // wave clock in seconds (the world's tw); until it is set the piece runs on wall time
    setProgress(tw) { progress = tw; },
    setGroundSampler(fn) { sampler = fn || sampler; solver.setSampler(sampler); rowM.fill(-1e9); gRowM.fill(-1e9); },
    // the lip's grass side for things the world plants on it: texel (segment, row) = local position xyz, strength (0 = no lip there)
    lip: { texture: surf.lipTex, segments: NSEG, rows: NLIP, riseRows: 8, riseFrac: 0.45 },
    setShade(fn) { surf.shade = fn || null; },                     // fn(xLocal, zLocal, lift, tw) -> 1 in the sun .. 0 where a swell's own shadow lies (low sun)
    setMeadow(tone) { if (tone) L.uTone.value.copy(tone); },       // the meadow's tone at the tor's foot, so the comber's turf matches the land it rises from
    setLight(dir, sunColor, skyColor) { if (dir) L.uSunDir.value.copy(dir).normalize(); if (sunColor) L.uSunCol.value.copy(sunColor); if (skyColor) L.uSkyCol.value.copy(skyColor); },
    contact(angle) { const i = ((Math.round(angle / TAU * NSEG) % NSEG) + NSEG) % NSEG; return { y: yc[i], r: rc[i], lip: lip[i] }; },
    update(dt, time, camera) { uWall.value = time; step(progress === null ? time : progress); },
    dispose() { histTex.dispose(); surf.lipTex.dispose(); },
    ground: false, groundY: -40,
  };
}
