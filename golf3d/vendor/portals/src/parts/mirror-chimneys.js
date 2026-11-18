// THE SPIRE AND ITS MIRRORS: hero set piece for the world "mirror-chimneys" (The Upside-Down Pools).
//
// What it is
//   A 55 m sulphide tower: a bundle of fused pipes (fluted, 5-9 lobes that drop out one by one as snapped
//   spires), botryoidal knobs, beehive diffusers, side pipes, talus at the foot, five crown chimneys with
//   ember-lit throats, and six shelf-fungus flanges. Under every flange hangs a dead-level pool of hot water:
//   an analytic total-reflection mirror (silver at grazing angles with an upside-down scene of lamp-lit rock
//   and tubeworms in it, a wobbling window onto bone-white stone when looked at steeply), crossed by swells
//   that break each lamp into a glitter road. On the spill arc of each rim the pool rolls up round the lip as
//   a chrome roll (a lofted section: a moulding hanging under the lip, then the bead round its edge) carrying
//   images of the two headlamps, a long highlight drawn out along the lip (attribute aTl, the way the lip
//   runs) and the dome's brass collar (all three only within about 7 m: from further off the roll is quiet
//   silver, never a white line round the pool), and shimmering threads rise from it. Away from the spill arc
//   each pool is held by the stone lip, and every sheet darkens to a soft meniscus at its edge (mcMeniscus). The three lowest shelves (F1, F2, F3: the ones the route passes under, flanges[i].pass)
//   are broad and square-shouldered (a superellipse outline, n 3.2) and their pools are sheets, not windows:
//   never less than half silver, blue-silver sheen on the swell faces, a sparkling glitter road under each
//   headlamp, the lamp-lit sea bed far below painted in (mcBelow), and the REAL trunk, ledges and tubeworms under the shelf drawn again upside down (the
//   MIRROR shader variants: geometry reflected in the vertex shader, kept only where the sight line crosses
//   the sheet, finished as the sheet, laid just in front of it in depth; the mirrored worms are drawn nearly twice as
//   thick, so they read as tubes from 20 m). Seen from the side and 8 m or more off, a pass sheet is liquid silver: what
//   hangs in it is given back brighter and the sheet carries a pale slate of its own on the swells. A shimmer thread
//   loses its bright edge wherever the tower stands behind it (it is seen against dark water only). Above: five black jets merging into
//   one boiling, leaning, opaque smoke column with a flat lid, modelled in cold light by the lander's lamp.
//   On the ledges and flange tops: ~1,000 tubeworms (bowed, tapering, ringed white tubes, each with a
//   crimson feather: two crossed blades cut to a serrated spindle with a dark heart, the blade that faces the
//   lamps lit and the other in shadow with a glowing fringe, the red dying with distance) that snap shut in a
//   travelling wave when the lamps come within opts.wormReach (default 5 m) and creep out again behind.
//   The roll of each spill lip leans ALONG the lip with the pool's own swell (POOL_F: the sheet's swell slope at that place,
//   taken along aTl), so what the roll shows wavers at the swell's own size in metres, and a lamp's pinpoint image in it is a
//   short glint on each swell. The long highlight along the lip stays one line; the lean dims it, by under a tenth at nine places in ten.
//
// Local space = THE BRIEF'S WORLD AXES. Place hero.object at the world origin, unrotated, unscaled.
//   Tower axis at the origin, sea bed y = 0, x east, y up, z south. A bearing b (anticlockwise from west:
//   W 0, S 90, E 180, N 270) at radius r is (-cos b * r, y, sin b * r); bearing(b, r, y) is exported.
//
// Light: lamps only. Nothing here uses scene lights. Every material includes LAMP_GLSL (exported) and
//   shares ONE uniforms object, hero.lamps (also exported factory lampUniforms()):
//     uLampPos[2], uLampDir   the two headlamps, taken every frame in update() from camera.matrixWorld
//                             (0.9 m either side of the eye, 0.25 m below, looking down the gaze)
//     uLampCol, uLampI, uLampFall   colour (default #EAF2FF), intensity 2.4, falloff length 4.5 m
//     uLandPos[2], uLandDir[2], uLandCol, uLandI, uLandFall   the lander's two cold lamps (defaults from the
//                             brief: at (-46,11.5,-3), one raking east along the fissure, one tilted up at
//                             the great flange). hero.setLander(pos, dirA, dirB, intensity) moves them.
//     uAbsorb                 per-metre absorption, red first (0.036, 0.019, 0.014)
//     uScatter                back-scatter fill colour (slate #0B1826), uSurvey (see below)
//   GLSL: vec3 mcLight(P, N, dEye) returns irradiance at world point P (lamps, cones, falloff, absorption on
//   lamp->P->eye, slate fill); multiply by albedo. vec3 mcWater(col, dEye) is not needed: absorption to the
//   eye is already inside mcLight. Use LAMP_GLSL + hero.lamps for the bed, the lesser chimneys, the lander
//   and the creatures so everything agrees. Scene fog (fog chunks) is honoured on top: use #03060C.
//   SURVEY LIGHT: the part viewer orbits at 40-65 m where honest lamps reach nothing, so when buildHero is
//   called with NO opts at all (the viewer) uSurvey is 1: lamps reach five times further and a faint slate
//   ambient is added. Any opts object with at least one key gives survey 0 (honest lamps); or pass
//   opts.survey / call hero.setSurvey(v).
//
// opts
//   palette   brief palette [water, ochre, rust, bone, slate-white, crimson, cold lamp]
//   mineral   'ochre' | 'sulphide' | 'white' (default: seeded 3:1:1; the part viewer also takes &hm=ochre|sulphide|white)
//   lean      smoke lean in radians down-current, toward +x (default seeded 0.17-0.26; hard current 0.6)
//   lampColor hex for the headlamps (default '#EAF2FF'; warm sodium '#FFD9A0')
//   worms     false to leave the tubeworms out (default true); wormCount (default 1100 * detail); wormReach (m, default 5)
//   passThickets  up to 16 extra thickets placed by the world (same wave, same shader), each either
//                 { p: [x,y,z], o: [ox,oz], r } (foot and outward direction given) or { b, y, off, r } (at bearing b
//                 degrees and height y, stood `off` m out from the trunk wall); their feet come back as hero.passThickets
//   smoke     false to leave the smoke out
//   survey    0..1 (see above)
//   ring      false: no portal-ring image in the great mirror (default: ring at anchors.portalSeat)
//
// hero.*
//   lamps                    the shared uniforms object (give it to your own materials)
//   setLander(pos, dirA, dirB, intensity), setSurvey(v), setLampIntensity(v)
//   setRing(pos, normal, radius, hex, intensity)   the exit ring whose reflection the great mirror shows
//   setCurrent(lean)         smoke lean, radians
//   setSmokeRim(v)           cold rim of the lander's lamp on the smoke column (0 = only what the lamps really reach)
//   setTowerLight(v)         0..1: the long-view light on the tower and its shelves (rock within 21 m of the axis, more
//                            than 16-30 m from the eye): a warm face from our lamps and the lander's cold light down the side
//                            that faces it. 0 = off (default); the world raises it at the reveal and across its far vantage
//   setFieldRim(v)           slate rim on rock more than 15 m from the axis and over 12 m from the eye (the world's lesser
//                            chimneys share the spire's material): 0 = off (default), about 1-5 in the world
//   flanges[i]               { name, bearing, y, jut, width, pass, center:Vector3 (pool centre), top(rho, phi), yc (pool
//                            level), o/t (outward and tangent unit vectors, xz), r0, Lr, Lw, E(phi) (rim radius), at(m, phi, y, out) }
//   passThickets[i]          Vector3 foot of each thicket the world asked for, in order (stand a ledge under it)
//   mirrorRock(geometry, i)  draw the world's own rock (position, normal, aMat as the spire's) upside down in pass
//                            shelf i's sheet as well: call it in build() with the triangles that stand under that shelf
//   wormThickets[i]          { center:Vector3, radius, count } so the world does not plant on top of them
//   trunkRadius(theta, y)    the trunk's radius (m) at math angle theta (x = r cos, z = r sin), for placing
//                            shrimp, crabs and bubbles on the wall
//   No progress hook: nothing here is staged against the clock. The worm wave is driven by the real
//   distance of the lamps (camera) in update(), so it coincides with arrival by construction.
//
// anchors (local = world)
//   portalSeat    { position (-8.3,45,8.6), normal: unit vector facing back down the 60 degree rise,
//                   radius 3.75 }: the ring's top edge touches the great mirror (y 47)
//   flyThrough    the brief's path points in order (notch, helix, fall away, rise); >= 6 m from all stone
//                 (the three shelf passes run 4-5.3 m under a mirror, as the brief asks)
//   heroPool      centre of the F3 mirror; heroView: eye point under it at 26-27 s; heroGaze: where to look
//   greatPool     centre of the F6 mirror
//   throats[5]    the crown chimney mouths (for extra particles or sound)
//   smokeBase, smokeTop, lander (default lander lamp position)
//
// Size: radius 19 (great flange rim), height 55 (tower; smoke lid at ~150). Cost: about 170k triangles at
// 1,000 worms in 5 draw calls (rock, pools, threads, smoke, worms), plus, only while the eye is under a pass
// shelf and within reach of it, that shelf's mirror set (2 draw calls and about 25-30k triangles; one more
// call for rock given to mirrorRock; at most two sets at a time). All of it is made in buildHero; update()
// only flips mesh.visible.
// No lights, no textures. Build ~300 ms, yielding.
// The mirror turns from window to silver between about 21 and 39 degrees off the vertical (not the
// physical 60): from 5 m under a shelf the physical angle would leave the whole pool a window.
import * as THREE from 'three';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import { clamp, lerp, smoothstep, makeNoise } from '../kit/core.js';

const DEFAULT_PALETTE = ['#03060C', '#B8862F', '#7A3418', '#E9E2CF', '#C4D3DA', '#D21F2B', '#BFE6FF'];
const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
const RAD = Math.PI / 180;
export const bearing = (deg, r, y = 0) => V3(-Math.cos(deg * RAD) * r, y, Math.sin(deg * RAD) * r);

// ---------------------------------------------------------------------------------------------
// shared GLSL
// ---------------------------------------------------------------------------------------------
export const NOISE_GLSL = /* glsl */`
float mcH(vec3 p){ p = fract(p * 0.3183099 + vec3(0.1, 0.2, 0.3)); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float mcH1(float n){ return fract(sin(n * 127.1) * 43758.5453); }
vec3 mcH3(vec3 p){ return vec3(mcH(p), mcH(p + 19.7), mcH(p + 41.3)); }
float mcN(vec3 x){ vec3 i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(mcH(i), mcH(i + vec3(1,0,0)), f.x), mix(mcH(i + vec3(0,1,0)), mcH(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(mcH(i + vec3(0,0,1)), mcH(i + vec3(1,0,1)), f.x), mix(mcH(i + vec3(0,1,1)), mcH(i + vec3(1,1,1)), f.x), f.y), f.z); }
float mcF(vec3 p){ return 0.5 * mcN(p) + 0.25 * mcN(p * 2.03 + 7.1) + 0.125 * mcN(p * 4.1 + 3.3) + 0.0625 * mcN(p * 8.2 + 1.7); }
float mcF2(vec3 p){ return 0.6 * mcN(p) + 0.4 * mcN(p * 2.1 + 5.3); }
// distance to the nearest feature point, 0..~1 (botryoidal knobs)
float mcCell(vec3 p){ vec3 i = floor(p), f = fract(p); float d = 1.0;
  for (int z = -1; z <= 1; z++) for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) {
    vec3 g = vec3(float(x), float(y), float(z)); vec3 o = mcH3(i + g) * 0.8 + 0.1; vec3 r = g + o - f; d = min(d, dot(r, r)); }
  return sqrt(d); }
// the same, with the way to that feature point: xyz = vector from p to it (in cell units), w = its distance. The slope of a
// knob then comes from the knob itself, not from screen-space differences (which shade in 2 x 2 pixel blocks close to)
vec4 mcCellV(vec3 p){ vec3 i = floor(p), f = fract(p); float d = 8.0; vec3 rv = vec3(0.0);
  for (int z = -1; z <= 1; z++) for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) {
    vec3 g = vec3(float(x), float(y), float(z)); vec3 o = mcH3(i + g) * 0.8 + 0.1; vec3 r = g + o - f; float dq = dot(r, r); if (dq < d) { d = dq; rv = r; } }
  return vec4(rv, sqrt(d)); }
`;

export const LAMP_GLSL = /* glsl */`
uniform vec3 uLampPos[2]; uniform vec3 uLampDir; uniform vec3 uLampCol; uniform float uLampI; uniform float uLampFall;
uniform vec3 uLandPos[2]; uniform vec3 uLandDir[2]; uniform vec3 uLandCol; uniform float uLandI; uniform float uLandFall;
uniform vec3 uAbsorb; uniform vec3 uScatter; uniform float uSurvey;
vec3 mcSpot(vec3 P, vec3 N, vec3 lp, vec3 ld, float c0, float c1, float fall, float dE, float sv){
  vec3 L = lp - P; float d = length(L); L /= max(d, 1e-3);
  float cone = smoothstep(c0, c1, dot(-L, ld)) * 0.94 + 0.06;
  float ndl = max(dot(N, L), 0.0);
  float k = mix(1.0, 0.3, uSurvey);
  return cone * ndl / (1.0 + d / (fall * mix(1.0, 5.0, sv))) * exp(-uAbsorb * (d + dE) * k);
}
// irradiance at P (world space) for a surface with normal N seen from dE metres away
vec3 mcLight(vec3 P, vec3 N, float dE){
  vec3 c = uLampCol * uLampI * (mcSpot(P, N, uLampPos[0], uLampDir, 0.50, 0.90, uLampFall, dE, uSurvey) + mcSpot(P, N, uLampPos[1], uLampDir, 0.50, 0.90, uLampFall, dE, uSurvey));
  c += uLandCol * uLandI * (mcSpot(P, N, uLandPos[0], uLandDir[0], 0.80, 0.97, uLandFall, dE, 0.0) + mcSpot(P, N, uLandPos[1], uLandDir[1], 0.62, 0.95, uLandFall, dE, 0.0));
  float k = mix(1.0, 0.3, uSurvey);
  c += (uScatter * 0.5 + vec3(0.09, 0.10, 0.11) * uSurvey) * (0.35 + 0.65 * (N.y * 0.5 + 0.5)) * exp(-uAbsorb * dE * k);
  return c;
}
// direction and strength of the brighter headlamp glint: Blinn lobe of both lamps on normal N
float mcGlint(vec3 P, vec3 N, vec3 V, float power){
  vec3 L0 = normalize(uLampPos[0] - P), L1 = normalize(uLampPos[1] - P);
  float a = pow(max(dot(N, normalize(L0 + V)), 0.0), power), b = pow(max(dot(N, normalize(L1 + V)), 0.0), power);
  return a + b;
}
`;

export function lampUniforms(palette = DEFAULT_PALETTE, lampColor = '#EAF2FF') {
  const lander = V3(-46, 11.5, -3);
  return {
    uLampPos: { value: [V3(-0.9, 20, 40), V3(0.9, 20, 40)] }, uLampDir: { value: V3(0, 0, -1) },
    uLampCol: { value: new THREE.Color(lampColor) }, uLampI: { value: 2.4 }, uLampFall: { value: 4.5 },
    uLandPos: { value: [lander.clone(), lander.clone()] },
    uLandDir: { value: [V3(1, -0.06, 0.07).normalize(), V3(-8.3, 47, 8.6).sub(lander).normalize()] },
    uLandCol: { value: new THREE.Color(palette[6]) }, uLandI: { value: 4.0 }, uLandFall: { value: 14 },
    uAbsorb: { value: V3(0.036, 0.019, 0.014) }, uScatter: { value: new THREE.Color('#0B1826').multiplyScalar(0.5) },
    uSurvey: { value: 0 },
  };
}

const FOG_V = /* glsl */`#include <common>
#include <fog_pars_vertex>
`;
const FOG_F = /* glsl */`#include <common>
#include <fog_pars_fragment>
`;

// ---------------------------------------------------------------------------------------------
// geometry accumulator: one merged, indexed mesh with position, normal and a material vec3
// (x heat 0..1: anhydrite collar -> ember throat at 1; y kind 0 old ochre .. 1 fresh sulphide; z occlusion)
// ---------------------------------------------------------------------------------------------
function makeAcc() {
  const pos = [], nrm = [], mat = [], idx = [];
  return {
    pos, nrm, mat, idx,
    get count() { return pos.length / 3; },
    vert(x, y, z, nx, ny, nz, heat, kind, ao) { pos.push(x, y, z); nrm.push(nx, ny, nz); mat.push(heat, kind, ao); return pos.length / 3 - 1; },
    tri(a, b, c) { idx.push(a, b, c); },
    // a (cols+1) x (rows+1) grid already pushed starting at vertex `base`, row-major
    grid(base, cols, rows, flip) {
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
        const a = base + r * (cols + 1) + c, b = a + 1, d = a + cols + 1, e = d + 1;
        if (flip) { idx.push(a, b, d, b, e, d); } else { idx.push(a, d, b, b, d, e); }
      }
    },
  };
}
// smooth normals for a vertex range from its triangles (area weighted)
function rangeNormals(acc, v0, i0) {
  const { pos, nrm, idx } = acc;
  for (let i = v0 * 3; i < nrm.length; i++) nrm[i] = 0;
  for (let i = i0; i < idx.length; i += 3) {
    const a = idx[i] * 3, b = idx[i + 1] * 3, c = idx[i + 2] * 3;
    const ux = pos[b] - pos[a], uy = pos[b + 1] - pos[a + 1], uz = pos[b + 2] - pos[a + 2];
    const vx = pos[c] - pos[a], vy = pos[c + 1] - pos[a + 1], vz = pos[c + 2] - pos[a + 2];
    const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
    nrm[a] += nx; nrm[a + 1] += ny; nrm[a + 2] += nz; nrm[b] += nx; nrm[b + 1] += ny; nrm[b + 2] += nz; nrm[c] += nx; nrm[c + 1] += ny; nrm[c + 2] += nz;
  }
  for (let i = v0 * 3; i < nrm.length; i += 3) {
    const l = Math.hypot(nrm[i], nrm[i + 1], nrm[i + 2]) || 1; nrm[i] /= l; nrm[i + 1] /= l; nrm[i + 2] /= l;
  }
}
// make the two seam columns of a wrapped grid share normals
function weldSeam(acc, base, cols, rows) {
  const n = acc.nrm;
  for (let r = 0; r <= rows; r++) {
    const a = (base + r * (cols + 1)) * 3, b = (base + r * (cols + 1) + cols) * 3;
    let x = n[a] + n[b], y = n[a + 1] + n[b + 1], z = n[a + 2] + n[b + 2]; const l = Math.hypot(x, y, z) || 1; x /= l; y /= l; z /= l;
    n[a] = n[b] = x; n[a + 1] = n[b + 1] = y; n[a + 2] = n[b + 2] = z;
  }
}

// ---------------------------------------------------------------------------------------------
// the trunk: a bundle of fused pipes. Radius at (theta, y) = soft maximum over the pipes of where a ray
// from the axis leaves each pipe's circle, so flutes, lobes and snapped shoulders come from the form itself.
// ---------------------------------------------------------------------------------------------
const ENV = [[-1, 11.2], [0, 10.4], [3, 9.0], [8, 8.0], [18, 7.0], [27, 6.0], [36, 4.7], [45, 3.0], [50, 2.2], [60, 2.0]];
function envR(y) {
  for (let i = 1; i < ENV.length; i++) if (y <= ENV[i][0]) { const a = ENV[i - 1], b = ENV[i]; return lerp(a[1], b[1], clamp((y - a[0]) / (b[0] - a[0]), 0, 1)); }
  return 2.0;
}
function makeTrunkField(rng, nz) {
  const nP = rng.int(6, 8), pipes = [], crown = [];
  const pick = rng.shuffle([...Array(nP).keys()]).slice(0, 5).sort((a, b) => a - b);
  const tops = rng.shuffle([13, 19, 25, 31, 37, 41]);
  let k = 0;
  for (let i = 0; i < nP; i++) {
    const isCrown = pick.includes(i);
    const p = { a0: (i + rng.range(-0.28, 0.28)) / nP * Math.PI * 2, wob: rng.range(0.1, 0.3), ph: rng.range(0, 6.28), fr: rng.range(0.06, 0.12),
      dk: rng.range(0.58, 0.68), rk: rng.range(0.33, 0.46), top: isCrown ? 99 : tops[k++ % tops.length] + rng.range(-2, 2), crown: isCrown };
    pipes.push(p); if (isCrown) crown.push(p);
  }
  const K = 3.0, ox = rng.range(0, 50), oz = rng.range(0, 50);
  const R = (th, y) => {
    const e = envR(y); let acc = Math.exp(K * e * 0.55);
    for (let i = 0; i < nP; i++) {
      const p = pipes[i]; let fade = 1; if (y > p.top - 2.4) { fade = 1 - (y - (p.top - 2.4)) / 2.4; if (fade <= 0) continue; }
      const a = p.a0 + p.wob * Math.sin(y * p.fr + p.ph), d = e * p.dk, rp = e * p.rk * Math.sqrt(fade);
      const s = Math.sin(th - a), disc = rp * rp - d * d * s * s; if (disc <= 0) continue;
      acc += Math.exp(K * (d * Math.cos(th - a) + Math.sqrt(disc)));
    }
    let r = Math.log(acc) / K + 2.4 * Math.exp(-Math.max(y, 0) / 1.5);
    const cx = Math.cos(th) * e, sz = Math.sin(th) * e;
    r += 0.5 * nz.fbm3(cx * 0.28 + ox, y * 0.3, sz * 0.28 + oz, 3) + 0.16 * nz.n3(cx * 1.0 + oz, y * 1.1, sz * 1.0 + ox);
    return Math.max(r, 0.3);
  };
  return { R, pipes, crown };
}

// lobed tube: centre line c(t) -> [x,y,z], radius r(t, ang), fixed cross-section frame (ex, ez)
function addTube(acc, cols, rows, cFn, rFn, ex, ez, mFn, closeTop) {
  const base = acc.count, i0 = acc.idx.length, c = [0, 0, 0], m = [0, 0, 1];
  for (let r = 0; r <= rows; r++) {
    const t = r / rows; cFn(t, c);
    for (let q = 0; q <= cols; q++) {
      const a = (q % cols) / cols * Math.PI * 2, rr = (closeTop && r === rows) ? 0.02 : rFn(t, a), ca = Math.cos(a) * rr, sa = Math.sin(a) * rr;
      mFn(t, a, m);
      acc.vert(c[0] + ex[0] * ca + ez[0] * sa, c[1] + ex[1] * ca + ez[1] * sa, c[2] + ex[2] * ca + ez[2] * sa, 0, 1, 0, m[0], m[1], m[2]);
    }
  }
  acc.grid(base, cols, rows, false); rangeNormals(acc, base, i0); weldSeam(acc, base, cols, rows);
  return base;
}
function frameFor(dir) { // two unit vectors perpendicular to dir (dir is never horizontal here)
  const d = V3(dir[0], dir[1], dir[2]).normalize(), ex = V3(1, 0, 0).cross(d).normalize(), ez = d.clone().cross(ex).normalize();
  return [[ez.x, ez.y, ez.z], [ex.x, ex.y, ex.z], [d.x, d.y, d.z]];
}

function icoTemplate(detail) {
  const g = new THREE.IcosahedronGeometry(1, detail); g.deleteAttribute('uv'); g.deleteAttribute('normal');
  const m = mergeVertices(g, 1e-3); const t = { p: Array.from(m.getAttribute('position').array), i: Array.from(m.index.array) };
  g.dispose(); m.dispose(); return t;
}
// lumpy blob; (ox,oy,oz) is the outward direction used for occlusion on its hidden side
function addBlob(acc, tpl, nz, cx, cy, cz, sx, sy, sz, lump, heat, kind, ox, oy, oz, aoMin) {
  const base = acc.count, P = tpl.p;
  for (let i = 0; i < P.length; i += 3) {
    const x = P[i], y = P[i + 1], z = P[i + 2];
    const k = 1 + lump * nz.n3(cx + x * 1.7, cy + y * 1.7, cz + z * 1.7);
    const ao = clamp(aoMin + (1 - aoMin) * (0.55 + 0.6 * (x * ox + y * oy + z * oz)), aoMin, 1);
    const nx = x / sx, ny = y / sy, nz2 = z / sz, nl = Math.hypot(nx, ny, nz2) || 1;
    acc.vert(cx + x * sx * k, cy + y * sy * k, cz + z * sz * k, nx / nl, ny / nl, nz2 / nl, heat, kind, ao);
  }
  const I = tpl.i; for (let i = 0; i < I.length; i += 3) acc.tri(base + I[i], base + I[i + 1], base + I[i + 2]);
}

// ---------------------------------------------------------------------------------------------
// a flange: shelf-fungus bracket, rough on top, hollow underneath, with a rolled lip and corbel ribs
// ---------------------------------------------------------------------------------------------
function makeFlange(rng, nz, def, trunkR) {
  const b = def.bearing * RAD, o = [-Math.cos(b), Math.sin(b)], t = [Math.sin(b), Math.cos(b)];
  const yc = def.y, r0 = def.r0 ?? Math.max(trunkR(Math.atan2(o[1], o[0]), yc) - 1.3, 0.8);
  const Lr = def.jut + (def.reach ?? 1.3), Lw = def.width / 2, Lb = Math.min(2.6, Lw * 0.5), rl = 0.28;
  const sc1 = rng.range(0, 6.28), sc2 = rng.range(0, 6.28), nRib = rng.int(5, 9), ribPh = rng.range(0, 3), seedN = rng.range(0, 90);
  const phi0 = rng.range(-0.18, 0.18), phis = Math.max(def.spill ?? rng.range(0.6, 0.85), def.spillMin ?? 0);
  const Hroot = Math.min(1.2 + 0.25 * Lr, 4.2), depth = clamp(0.1 * Lr, 0.45, 1.35), Cdepth = Math.min(0.3 * Lr, 5.0);
  const nE = def.n ?? 2;      // outline exponent: 2 an ellipse (the old shelves), about 3 a fuller, squarer bracket (the three pass shelves)
  const E = (phi) => { const c = Math.abs(Math.cos(phi)), s = Math.abs(Math.sin(phi)), A = Math.cos(phi) > 0 ? Lr : Lb;
    return Math.pow(Math.pow(Math.max(c / A, 1e-5), nE) + Math.pow(Math.max(s / Lw, 1e-5), nE), -1 / nE) * (1 + 0.06 * Math.sin(phi * 5 + sc1) + 0.035 * Math.sin(phi * 11 + sc2)); };
  const spill = (phi) => 1 - smoothstep(phis * 0.72, phis, Math.abs(phi - phi0));
  const skirt = (phi) => lerp(0.32, -0.06, spill(phi)) + 0.08 * Math.sin(phi * 9 + sc2);
  const at = (m, phi, y, out) => { const u = m * Math.cos(phi) + r0, v = m * Math.sin(phi); out[0] = o[0] * u + t[0] * v; out[1] = y; out[2] = o[1] * u + t[1] * v; return out; };
  const hTop = (rho, phi) => {
    const e = E(phi), hr = 2 * rl - skirt(phi), x = rho * e * Math.cos(phi), z = rho * e * Math.sin(phi);
    return lerp(Hroot, hr, Math.pow(rho, 1.1)) + (0.3 * nz.fbm3(x * 0.5 + seedN, 3.3, z * 0.5, 3) + 0.2 * Math.abs(Math.sin(phi * nRib + ribPh)) * Math.sin(rho * Math.PI)) * (1 - 0.7 * rho * rho);
  };
  const under = (rho, phi) => {
    const front = smoothstep(0.0, 0.3, Math.cos(phi)), sp = spill(phi);
    const mask = smoothstep(0.3, 0.5, rho) * (1 - smoothstep(0.55, 0.955, rho) * (1 - 0.85 * sp)) * front;
    const rib = 0.5 + 0.5 * Math.pow(Math.abs(Math.sin(phi * nRib * 0.5 + ribPh)), 0.6);
    let u = -0.12 + (depth + 0.12) * mask * (0.85 + 0.3 * nz.n3(rho * 4 + seedN, phi * 3, 1.5)) - Cdepth * (1 - smoothstep(0, 0.32, rho)) * rib;
    u = Math.min(u, hTop(rho, phi) - 0.3);
    const e = E(phi), edge = 1 - rl / e;
    return lerp(u, -skirt(phi), smoothstep(0.93, edge, rho));
  };
  const top = (rho, phi, out = V3()) => { const a = [0, 0, 0]; at(rho * E(phi), phi, yc + hTop(rho, phi), a); return out.set(a[0], a[1], a[2]); };
  const center = V3(); { const a = [0, 0, 0]; at(0.62 * Lr, 0, yc, a); center.set(a[0], a[1], a[2]); }
  return { ...def, yc, r0, Lr, Lw, Lb, rl, o, t, E, nE, sc1, sc2, spill, skirt, at, hTop, under, top, center, phi0, phis, depth };
}
function addFlange(acc, F, kindBase) {
  const cols = F.width > 12 ? 60 : 40, nT = F.pass ? 12 : 9, nL = 4, nU = F.pass ? 12 : 10, rows = nT + nL + nU - 1;
  const base = acc.count, i0 = acc.idx.length, p = [0, 0, 0];
  for (let q = 0; q <= cols; q++) {
    const phi = -Math.PI + (q % cols) / cols * Math.PI * 2, e = F.E(phi), edge = 1 - F.rl / e, sk = F.skirt(phi), sp = F.spill(phi);
    for (let j = 0; j < nT; j++) { const rho = j / (nT - 1) * edge; F.at(rho * e, phi, F.yc + F.hTop(rho, phi), p); acc.vert(p[0], p[1], p[2], 0, 1, 0, 0.12 + 0.3 * rho * rho, kindBase, 0.75 + 0.25 * rho); }
    for (let j = 0; j < nL; j++) { const a = (0.5 - (j + 0.5) / nL) * Math.PI; F.at(e - F.rl + F.rl * Math.cos(a), phi, F.yc + F.rl - sk + F.rl * Math.sin(a), p); acc.vert(p[0], p[1], p[2], 0, 1, 0, 0.38 + 0.24 * sp, kindBase * 0.5, 1); }
    for (let j = 0; j < nU; j++) { const rho = (1 - j / (nU - 1)) * edge; const u = F.under(rho, phi); F.at(rho * e, phi, F.yc + u, p);
      acc.vert(p[0], p[1], p[2], 0, -1, 0, u > 0.02 ? 0.36 : 0.16 + 0.2 * rho, kindBase * 0.6, rho < 0.3 ? 0.45 + rho : (u > 0.02 ? 0.8 : 0.95)); }
  }
  // columns were pushed one after another: (rows+1) per column, so this is a grid with cols <-> rows swapped
  acc.grid(base, rows, cols, true); rangeNormals(acc, base, i0);
  // weld the wrap column
  const n = acc.nrm; for (let r = 0; r <= rows; r++) { const a = (base + r) * 3, c = (base + cols * (rows + 1) + r) * 3; for (let k = 0; k < 3; k++) { const v = (n[a + k] + n[c + k]) * 0.5; n[a + k] = n[c + k] = v; } }
}

// ---------------------------------------------------------------------------------------------
// the mirrors' shared GLSL
//   SWELL_GLSL  the slow swells that cross every pool (height and gradient), used by vertex and fragment stages
//   MIR_GLSL    one pass shelf's level sheet for the MIRROR variants of the rock and worm shaders: uMirA = (y of the
//               sheet, r0, Lr, Lw), uMirB = (outward x, z, tangent x, z), uMirC = (Lb, sc1, sc2, lip radius), uMirN the
//               outline exponent; mcPoolRT(xz) is makeFlange's outline in GLSL (x: inside the sheet, y: 0 at its trunk side .. 1 at its rim). A MIRROR material draws its geometry
//               reflected in that sheet (y -> 2 yc - y), lit as the real thing, kept only where the sight line crosses
//               the sheet inside the outline, with its depth laid just in front of the sheet (gl_FragDepth) so that real
//               things in front still hide it and the hollow rock above the pool does not.
//   POOL_GLSL   mcSheet(): what the eye gets from a point of a level sheet, given what the mirror shows there: the
//               silvering, the dim rippled window at steep angles, the blue-silver sheen of the lit water on the swells,
//               and the two glitter roads (one under each headlamp's beam, running away along the gaze).
// ---------------------------------------------------------------------------------------------
const SWELL_GLSL = /* glsl */`
float mcSw(vec2 x, float t){ return 0.14 * mcN(vec3(x * 1.3 + vec2(t * 0.11, 0.0), t * 0.22)) + 0.05 * mcN(vec3(x * 3.1 - vec2(0.0, t * 0.17), t * 0.35 + 7.0)); }
vec2 mcSwGrad(vec2 x, float t){ vec2 ee = vec2(0.06, 0.0); return vec2(mcSw(x + ee.xy, t) - mcSw(x - ee.xy, t), mcSw(x + ee.yx, t) - mcSw(x - ee.yx, t)) / 0.12; }
`;
const MIR_GLSL = /* glsl */`
uniform vec4 uMirA; uniform vec4 uMirB; uniform vec4 uMirC; uniform float uMirN;
vec2 mcPoolRT(vec2 xz){
  float u = dot(xz, uMirB.xy) - uMirA.y, v = dot(xz, uMirB.zw);
  float m = length(vec2(u, v)); if (m < 0.05) return vec2(0.0);
  float phi = atan(v, u);
  float c = abs(cos(phi)), sn = abs(sin(phi)), A = u > 0.0 ? uMirA.z : uMirC.x;
  float e = pow(pow(max(c / A, 1e-5), uMirN) + pow(max(sn / uMirA.w, 1e-5), uMirN), -1.0 / uMirN) * (1.0 + 0.06 * sin(phi * 5.0 + uMirC.y) + 0.035 * sin(phi * 11.0 + uMirC.z));
  float rho = m / e, edge = 1.0 - uMirC.w / e;
  return vec2(step(0.28, rho) * step(rho, edge - 0.012) * step(abs(phi), 1.5), clamp((rho - 0.27) / max(edge - 0.27, 0.05), 0.0, 1.0));
}
`;
const POOL_GLSL = /* glsl */`
uniform float uMirDesat;
// what a mirror of hot water does to colour: everything in it drifts to blue-silver (more under sodium lamps)
vec3 mcSilver(vec3 c){ float l = dot(c, vec3(0.30, 0.55, 0.15)); return mix(c, vec3(l) * vec3(0.78, 0.92, 1.08), uMirDesat) * vec3(0.90, 0.96, 1.0); }
// the meniscus: toward its rim (t 1) and where it meets the trunk (t 0) the sheet curls up to the stone and shows only dark
// water, so a pool sits in its shelf with a soft dark margin, not a ruled bright line
vec3 mcMeniscus(vec3 c, float t){ float m = clamp(smoothstep(0.76, 1.0, t) + 0.6 * smoothstep(0.10, 0.0, t), 0.0, 1.0); return mix(c, c * 0.35 + uScatter * 0.10, m * 0.8); }
// refl: what the mirror shows at P (already lit). P on the sheet, V unit vector to the eye (below), dE eye distance,
// gr the swell gradient there, hot the depth of hot water above the sheet, passK 1 on the three pass shelves (the camera
// goes under those: silver at every angle, a dim window) and 0 on the others (seen from afar: a clear window when steep)
vec3 mcSheet(vec3 refl, vec3 P, vec3 V, float dE, vec2 gr, float hot, float passK){
  vec3 Np = normalize(vec3(gr.x, -1.0, gr.y));
  float cs = max(dot(Np, V), 0.0);
  float mirror = mix(smoothstep(0.93, 0.78, cs), max(smoothstep(0.985, 0.90, cs), 0.55), passK);   // pass shelves: the upside-down scene shows at every angle
  float kP = mix(0.35, 1.0, passK);
  // the window: looked at steeply the sheet half clears onto the bone-white stone above, dim and wobbling with the swell
  vec2 sx = P.xz + gr * (hot * 2.4 + 0.5);
  float stn = mcF(vec3(sx.x * 1.3, 1.0, sx.y * 1.3)); float crk = mcCell(vec3(sx.x * 1.1, 2.0, sx.y * 1.1));
  vec3 stone = uBone * (0.35 + 0.5 * stn) * (0.55 + 0.45 * smoothstep(0.05, 0.3, crk));
  vec3 Lw = normalize(vec3(V.x * 0.3, -1.0, V.z * 0.3));
  vec3 win = stone * mcLight(P + vec3(0.0, hot, 0.0), Lw, dE + hot);
  // under warm (sodium) lamps the window would go khaki: there it is pulled nearly all the way to cold silver
  vec3 winS = mix(win, vec3(dot(win, vec3(0.30, 0.55, 0.15))) * vec3(0.74, 0.92, 1.12), 0.88);
  win = mix(mix(win, winS, step(0.5, uMirDesat)) * 0.3, mcSilver(win) * 0.10, passK);
  // a pass sheet seen whole and from the side (8 m and more off) is liquid silver: what hangs in it is given back brighter,
  // and the sheet has a pale slate of its own that rides the swells, about twice the water behind it. (Without them the
  // hero pool was a mid-blue lens no brighter than the rock round it.)
  float sideK = passK * smoothstep(7.0, 15.0, dE);
  vec2 vhS = V.xz / max(length(V.xz), 1e-3);
  vec3 col = mix(win, mcSilver(refl) * (1.0 + 0.7 * sideK) + uScatter * 0.06, mirror);
  col += vec3(0.052, 0.062, 0.080) * sideK * (0.62 + 0.76 * clamp(0.5 + 1.9 * dot(gr, vhS), 0.0, 1.0)) * exp(-uAbsorb * dE * 0.25);
  col += uScatter * 0.35 * pow(max(1.0 - cs, 0.0), 3.0) * exp(-uAbsorb * dE);
  // the sheet itself: lamp-lit haze and floc below it, caught on the faces of the swells that lean toward us
  vec3 beam = uLampI * (mcSpot(P, normalize(uLampPos[0] - P), uLampPos[0], uLampDir, 0.40, 0.92, uLampFall, dE, uSurvey)
                      + mcSpot(P, normalize(uLampPos[1] - P), uLampPos[1], uLampDir, 0.40, 0.92, uLampFall, dE, uSurvey));
  vec2 vh = V.xz / max(length(V.xz), 1e-3);
  float face = clamp(0.5 + 1.9 * dot(gr, vh), 0.0, 1.4);
  // (on a pass shelf the sheen on the swell faces is laid over dark water only: over the lit trunk and worms hanging in the
  // mirror it broke the reflection into flakes)
  float dk = 1.0 - passK * 0.88 * smoothstep(0.015, 0.16, dot(refl, vec3(0.30, 0.55, 0.15)));
  float farS = 1.0 - 0.45 * passK * smoothstep(10.0, 22.0, dE);      // (a pass pool seen whole from the side: less of the lit haze, so what hangs in the mirror reads)
  col += vec3(0.50, 0.68, 0.90) * beam * (mix(0.030, 0.060, passK) * mix(0.5, 1.0, dk) + 0.105 * face * face * dk) * kP * farS;
  // two glitter roads: under each headlamp's beam the swell crests flash, in a band that runs away along the gaze
  vec2 fwd = uLampDir.xz / max(length(uLampDir.xz), 1e-3);
  vec2 d0 = P.xz - uLampPos[0].xz, d1 = P.xz - uLampPos[1].xz;
  float a0 = dot(d0, fwd), a1 = dot(d1, fwd), l0 = d0.x * fwd.y - d0.y * fwd.x, l1 = d1.x * fwd.y - d1.y * fwd.x;
  float w0 = 0.20 + 0.050 * max(a0, 0.0), w1 = 0.20 + 0.050 * max(a1, 0.0);
  float road = exp(-l0 * l0 / (w0 * w0)) * smoothstep(0.3, 2.2, a0) / (1.0 + max(a0, 0.0) / 11.0)
             + exp(-l1 * l1 / (w1 * w1)) * smoothstep(0.3, 2.2, a1) / (1.0 + max(a1, 0.0) / 11.0);
  float fwp = length(fwidth(P.xz));
  float g1 = mcN(vec3(P.xz * 8.0 + vec2(uTime * 0.9, 0.0), uTime * 1.7)), g2 = mcN(vec3(P.xz * 15.0 - vec2(0.0, uTime * 1.3), uTime * 2.3 + 5.0));
  float spk = mix(0.28, smoothstep(0.50, 0.82, g1 * 0.6 + g2 * 0.4 + 0.22 * face), 1.0 - smoothstep(0.02, 0.10, fwp));
  vec3 lampS = mcSilver(uLampCol);                      // the lamps as the mirror gives them back: silver, whatever their colour
  col += lampS * vec3(0.92, 0.96, 1.0) * min(road * (0.22 + 3.4 * spk * spk) * uLampI * 0.6, 2.5) * (1.0 - 0.7 * smoothstep(18.0, 45.0, dE)) * kP * mix(0.45, 1.0, dk);
  // and the broad dazzle straight overhead, where the level sheet really does show us our own lamps
  col += lampS * vec3(0.82, 0.92, 1.0) * min(mcGlint(P, normalize(vec3(gr.x * 2.6, -1.0, gr.y * 2.6)), V, 320.0) * 1.5 * uLampI / (1.0 + dE / 7.0), 2.0) * mix(0.35, 1.0, dk);
  return col;
}
`;

// ---------------------------------------------------------------------------------------------
// materials
// ---------------------------------------------------------------------------------------------
// the reflected position of world point w in the sheet of uMirA, pushed about a little by the swell where its sight line crosses the sheet
const MIR_V_GLSL = /* glsl */`
uniform float uTime;
vec3 mcMirrored(vec3 w){
  vec3 eyeM = vec3(cameraPosition.x, 2.0 * uMirA.x - cameraPosition.y, cameraPosition.z);
  vec3 dv = w - eyeM; float kk = clamp((uMirA.x - eyeM.y) / min(dv.y, -1e-3), 0.0, 1.0);
  vec2 gr = mcSwGrad((eyeM + dv * kk).xz, uTime);
  vec2 wob = clamp(gr * (1.0 - kk) * length(dv) * 0.05, vec2(-0.10), vec2(0.10));      // a gentle sway: the reflected thicket stays a thicket
  return vec3(w.x + wob.x, 2.0 * uMirA.x - w.y, w.z + wob.y);
}
`;
// the end of a MIRROR fragment shader: keep only what shows in the sheet, finish it as the sheet, lay its depth just in front of the sheet
const MIR_F_END = /* glsl */`
    vec3 dvM = vW - MC_EYE; float kM = (uMirA.x - MC_EYE.y) / min(dvM.y, -1e-3);
    vec3 Pp = MC_EYE + dvM * kM;
    vec2 rtM = mcPoolRT(Pp.xz);
    if (cameraPosition.y > uMirA.x - 0.05 || vW.y > uMirA.x - 0.03 || rtM.x < 0.5) discard;
    vec3 Vp = cameraPosition - Pp; float dP = length(Vp); Vp /= max(dP, 1e-3);
    col = mcMeniscus(mcSheet(col, Pp, Vp, dP, mcSwGrad(Pp.xz, uTime) * (1.0 - smoothstep(25.0, 70.0, dP) * 0.7), 0.6, 1.0), rtM.y);
    vec4 cpM = projectionMatrix * viewMatrix * vec4(Pp, 1.0);
    gl_FragDepth = clamp(cpM.z / max(cpM.w, 1e-4) * 0.5 + 0.5 - 0.00002 - 0.00010 * (1.0 - clamp(dE / 60.0, 0.0, 1.0)), 0.0, 1.0);
`;
const MIR_EYE = /* glsl */`
#ifdef MIRROR
  uniform mat4 projectionMatrix;
  #define MC_EYE vec3(cameraPosition.x, 2.0 * uMirA.x - cameraPosition.y, cameraPosition.z)
#else
  #define MC_EYE cameraPosition
#endif
`;
const ROCK_V = /* glsl */`
${FOG_V}
#ifdef MIRROR
${NOISE_GLSL}
${SWELL_GLSL}
${MIR_GLSL}
${MIR_V_GLSL}
#endif
attribute vec3 aMat; varying vec3 vW; varying vec3 vN; varying vec3 vM;
void main(){
  vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; vN = normalize(mat3(modelMatrix) * normal); vM = aMat;
  #ifdef MIRROR
    w.xyz = mcMirrored(w.xyz);
  #endif
  vec4 mvPosition = viewMatrix * w; gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const ROCK_F = /* glsl */`
${FOG_F}
${NOISE_GLSL}
${LAMP_GLSL}
uniform float uTime, uKindAdd, uWhite, uFieldRim, uTower; uniform vec3 uOchre, uRust, uBone, uMat, uEmber; uniform vec4 uPool[6];
#ifdef MIRROR
${SWELL_GLSL}
${MIR_GLSL}
${POOL_GLSL}
#endif
${MIR_EYE}
varying vec3 vW; varying vec3 vN; varying vec3 vM;
void main(){
  vec3 N = normalize(vN); vec3 V = MC_EYE - vW; float dE = length(V); V /= max(dE, 1e-3);
  // the limb: lit from where we sit, a round thing falls away toward its edge, so the trunk never ends in a ruled bright
  // line against black water (the smooth normal, before the knobs)
  float limb = clamp(dot(N, V), 0.0, 1.0), limbK = smoothstep(0.0, 0.42, limb);
  float heat = vM.x, kind = clamp(vM.y + uKindAdd, 0.0, 1.0), ao = vM.z;
  // procedural form: botryoidal knobs, pores, vertical flow lines
  float near = 1.0 - smoothstep(22.0, 55.0, dE);
  float fw = length(fwidth(vW)); float k1 = 1.0 - smoothstep(0.10, 0.32, fw), k2 = 1.0 - smoothstep(0.03, 0.10, fw);
  vec4 cv = mcCellV(vW * 1.6); float cell = cv.w, dm = sqrt(max(1.0 - cell * cell * 1.6, 0.0)); float dome = mix(0.6, dm, k1);
  vec4 cv2 = mcCellV(vW * 5.3 + 3.1); float cell2 = cv2.w, dm2 = sqrt(max(1.0 - cell2 * cell2 * 1.8, 0.0)); float dome2 = mix(0.6, dm2, k2);
  float streak = mcF(vec3(vW.x * 1.6, vW.y * 0.11, vW.z * 1.6));
  float big = mcF(vW * 0.42 + 5.0);
  float fine = mcF(vW * 7.0);
  // the knobs' slopes are worked out from the knobs (smooth at any size on screen); only the faint flow lines and grain
  // still use screen differences, and the grain only where a pixel is smaller than it
  float hk = 0.35 + 0.65 * near, k3 = 1.0 - smoothstep(0.010, 0.026, fw);
  float h = (streak * 0.07 + fine * 0.03 * near * k3) * hk;
  vec3 dpx = dFdx(vW), dpy = dFdy(vW); float hx = dFdx(h), hy = dFdy(h);
  vec3 r1 = cross(dpy, N), r2 = cross(N, dpx); float det = dot(dpx, r1);
  vec3 sg = sign(det) * (hx * r1 + hy * r2);
  vec3 G = (cv.xyz * (2.56 * 0.16 * k1 / max(dm, 0.4)) * smoothstep(0.0, 0.25, dm) + cv2.xyz * (9.54 * 0.05 * near * k2 / max(dm2, 0.4)) * smoothstep(0.0, 0.25, dm2)) * hk;
  G -= N * dot(G, N);
  N = normalize(abs(det) * (N - G * 1.3) - sg * 1.3 + N * 1e-5);
  // minerals
  float old = smoothstep(0.22, 0.70, big * 0.55 + streak * 0.75 - 0.12);
  vec3 alb = mix(uRust, uOchre * 0.8, old) * (0.55 + 0.6 * fine);
  alb = mix(alb, uRust * 0.35, smoothstep(0.55, 0.8, streak) * 0.6);
  vec3 sulph = vec3(0.085, 0.078, 0.066) * (0.55 + 0.9 * dome);
  float fresh = smoothstep(0.35, 0.75, kind + (big - 0.5) * 0.5);
  alb = mix(uRust * 0.45, alb, smoothstep(0.05, 0.6, dome));
  alb = mix(alb, sulph, fresh);
  float collar = smoothstep(0.42, 0.72, heat + (mcF(vW * 1.1 + 9.0) - 0.5) * 0.7 + (dome - 0.5) * 0.15);
  alb = mix(alb, uBone * (0.72 + 0.3 * fine), max(collar * 0.9, uWhite * (0.45 + 0.4 * streak)));
  float pock = smoothstep(0.76, 0.84, mcN(vW * 1.3 + 21.0)) * smoothstep(0.55, 0.2, cell);
  alb *= 1.0 - 0.6 * pock;
  float up = smoothstep(0.45, 0.9, N.y) * smoothstep(0.42, 0.62, mcF(vW * 0.9 + 31.0)) * (1.0 - collar);
  alb = mix(alb, uMat * 0.8, up * 0.75);
  alb *= mix(0.25, 1.0, ao) * (0.6 + 0.4 * smoothstep(0.0, 0.5, dome + streak * 0.5)) * smoothstep(-0.4, 1.6, vW.y + big);
  vec3 alb0 = alb;
  alb = mix(alb, vec3(dot(alb, vec3(0.35, 0.5, 0.15))) * vec3(0.66, 0.88, 1.16), smoothstep(18.0, 70.0, dE) * 0.85);   // beyond the lamps' reach colour drifts to blue-grey, never green
  vec3 E = mcLight(vW, N, dE) * mix(0.30, 1.0, limbK);
  vec3 col = alb * E;
  // the tower and its shelves (within 21 m of the axis): the edge of every round form takes a thread of the water's slate,
  // and in the long views (uTower: the reveal at the notch, the north vantage) the whole tower stands lit from foot to
  // crown: a warm face from our lamps, which the survey reach alone leaves dim at 40 m, and cold light from the lander
  // down the side that faces it
  float tw = 1.0 - smoothstep(17.0, 23.0, length(vW.xz));
  col += uScatter * tw * (1.0 - limbK) * (1.0 - limbK) * 1.3 * exp(-uAbsorb * dE * 0.5);
  float farT = smoothstep(16.0, 30.0, dE) * tw * uTower;
  vec3 LlT = normalize(uLandPos[1] - vW); float wrapT = clamp((dot(N, LlT) + 0.25) / 1.25, 0.0, 1.0), sameT = max(dot(LlT, V), 0.0);
  vec3 coldA = mix(alb, vec3(dot(alb, vec3(0.35, 0.5, 0.15))), 0.65) * 1.5 + 0.012;
  col += alb0 * mix(uLampCol, vec3(1.0, 0.84, 0.60), 0.5) * farT * 0.85 * (0.25 + 0.75 * max(dot(N, V), 0.0)) * mix(0.35, 1.0, limbK)      // (the stone's own colour, not the blue-grey of distance: a gold face)
       + coldA * uLandCol * farT * (1.0 * wrapT * wrapT * (1.0 - 0.8 * sameT * sameT) + 0.6 * pow(1.0 - limb, 2.5))
       + uLandCol * vec3(0.72, 0.92, 1.2) * farT * 0.65 * pow(1.0 - limb, 1.6) * smoothstep(-0.1, 0.5, dot(N, LlT)) * (1.0 - 0.8 * sameT * sameT);      // and a blue-white edge down the limb on the lander's side
  col += vec3(1.0, 0.80, 0.42) * fresh * mcGlint(vW, N, V, 22.0) * 0.07 * uLampI * exp(-uAbsorb * 2.0 * dE * mix(1.0, 0.3, uSurvey)) / (1.0 + dE / (uLampFall * mix(1.0, 5.0, uSurvey)));
  // mica / brassy glitter turning with the lamps (only near, where a grain is bigger than a pixel)
  vec3 gp = vW * 70.0; vec3 g = floor(gp); vec3 hn = normalize(mcH3(g) - 0.5 + N * 0.35);
  float gl = mcGlint(vW, hn, V, 40.0) * step(0.92, mcH(g + 7.0)) * smoothstep(0.5, 0.15, length(fract(gp) - 0.5)) * (1.0 - smoothstep(4.0, 10.0, dE));
  col += mix(vec3(1.0, 0.78, 0.35), vec3(0.9, 0.95, 1.0), 1.0 - fresh) * gl * (0.4 + 1.4 * fresh) * dot(E, vec3(0.33)) * 2.0;
  // wobbling net of light thrown down by each mirror on the wall beneath it
  float net = 0.0;
  for (int i = 0; i < 6; i++) { vec3 d = vW - uPool[i].xyz;
    net += smoothstep(-8.0, -1.0, d.y) * (1.0 - smoothstep(-0.4, 0.2, d.y)) * (1.0 - smoothstep(uPool[i].w * 0.5, uPool[i].w * 1.25, length(d.xz))); }
  vec3 q = vW * 1.1 + vec3(0.0, uTime * 0.22, 0.0);
  float c1 = 1.0 - abs(2.0 * mcN(q) - 1.0), c2 = 1.0 - abs(2.0 * mcN(q * 1.7 + vec3(4.0, -uTime * 0.3, 2.0)) - 1.0);
  col += alb * E * min(net, 1.0) * pow(max(c1 * c2, 0.0), 3.0) * 2.2;
  // the field (rock more than 15 m from the axis, below the great flange): beyond the lamps every chimney is drawn by the
  // slate of the lit water behind it, a cold rim on each silhouette and a breath of it on the upward faces, so ochre and
  // black sulphide chimneys stand as readably as white ones, in or out of the headlamps' cone
  float fieldK = smoothstep(15.0, 21.0, length(vW.xz)) * (1.0 - smoothstep(34.0, 42.0, vW.y)) * smoothstep(12.0, 34.0, dE);
  float rim1 = 1.0 - max(dot(N, V), 0.0), rimF = rim1 * rim1 * sqrt(rim1);
  col += uScatter * uFieldRim * fieldK * (rimF + 0.20 * rim1 + 0.10 * (0.5 + 0.5 * N.y)) * exp(-uAbsorb * dE * 0.5);
  // ember in the throats
  float em = smoothstep(0.93, 0.99, heat);
  col += uEmber * em * (0.9 + 0.5 * mcN(vec3(vW.xz * 3.0, uTime * 2.3)) * mcN(vec3(uTime * 0.9, vW.y * 2.0, 3.0)) * 1.4);
  #ifdef MIRROR
${MIR_F_END}
  #endif
  gl_FragColor = vec4(col, 1.0);
  #include <fog_fragment>
}`;

const POOL_V = /* glsl */`
${FOG_V}
attribute vec4 aK; attribute vec2 aTl; varying vec3 vW; varying vec3 vN; varying vec4 vK; varying vec2 vTl;
void main(){
  vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; vN = normalize(mat3(modelMatrix) * normal); vK = aK; vTl = aTl;      // aTl: on the roll the way the lip runs (xz); on the sheet x = 0 at the trunk side .. 1 at the rim
  vec4 mvPosition = viewMatrix * w; gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
// aK: x 0 pool sheet / 1 rolled bead, y depth of hot water above (m), z y of the thicket the mirror shows (-60 on the
// pass shelves: their scene is real reflected geometry, so the painted floor is switched off), w trunk radius there
const POOL_F = /* glsl */`
${FOG_F}
${NOISE_GLSL}
${LAMP_GLSL}
uniform float uTime, uKindAdd, uWhite; uniform vec3 uOchre, uRust, uBone, uMat, uCrimson, uBrass;
uniform vec3 uRingPos, uRingN, uRingCol; uniform float uRingR;
${SWELL_GLSL}
${POOL_GLSL}
varying vec3 vW; varying vec3 vN; varying vec4 vK; varying vec2 vTl;
// what a ray leaving the mirror downward sees: the tower wall, or a lamp-lit tubeworm thicket, upside down
vec3 mcBelow(vec3 P, vec3 R, float dE, float floorY, float rT, float stripeFade){
  vec3 water = uScatter * 0.22 * exp(-uAbsorb * dE);
  if (R.y > -0.03) return water;
  float tF = (floorY - P.y) / R.y;
  vec2 d2 = R.xz; float a = dot(d2, d2), b = dot(P.xz, d2), c = dot(P.xz, P.xz) - rT * rT, disc = b * b - a * c;
  float tC = 1e9; if (disc > 0.0 && a > 1e-5) { float t = (-b - sqrt(disc)) / a; if (t > 0.0) tC = t; }
  if (tC < tF) {
    vec3 Q = P + R * tC; vec3 Nw = normalize(vec3(Q.x, 0.0001, Q.z));
    float st = mcF(vec3(Q.x * 1.6, Q.y * 0.11, Q.z * 1.6)), bg = mcF(Q * 0.42 + 5.0);
    vec3 alb = mix(uRust, uOchre, smoothstep(0.3, 0.62, bg + (st - 0.5) * 0.7)) * (0.6 + 0.5 * mcF(Q * 2.0));
    alb = mix(alb, uRust * 0.35, smoothstep(0.55, 0.8, st) * 0.6);
    alb = mix(alb, vec3(0.03, 0.031, 0.036), smoothstep(0.35, 0.75, uKindAdd + (bg - 0.5) * 0.5));
    alb = mix(alb, uBone * 0.85, max(uWhite * (0.45 + 0.4 * st), smoothstep(0.5, 0.75, mcF(Q * 1.1 + 9.0) + smoothstep(-4.0, 0.0, Q.y - P.y) * 0.5)));
    alb *= 1.0 - 0.6 * smoothstep(0.76, 0.84, mcN(Q * 1.3 + 21.0));
    // tubeworms standing on the wall: white strokes with crimson tips, upside down in the mirror
    float wa = atan(Q.z, Q.x) * rT / 0.21, wid = floor(wa), wf = fract(wa);
    float wl = 0.9 + 1.2 * mcH1(wid * 1.7), wc = wl + 0.8 + 3.0 * mcH1(wid + 3.1);
    float wk = fract((Q.y + mcH1(wid * 5.3) * wc) / wc) * wc, wu = wk / wl;
    float wth = smoothstep(0.46, 0.54, mcF2(vec3(Q.xz * 0.5, Q.y * 0.35))) * stripeFade * step(wu, 1.0);
    alb = mix(alb, uBone * 0.8, smoothstep(0.36, 0.2, abs(wf - 0.5)) * wth);
    alb = mix(alb, uCrimson, smoothstep(0.80, 0.86, wu) * smoothstep(0.5, 0.25, abs(wf - 0.5)) * wth);
    return alb * mcLight(Q, normalize(Nw - R * 0.6), dE + tC);
  }
  if (floorY < -30.0) {
    // a pass shelf: beyond the trunk its mirror shows the lamp-lit sea bed far below, upside down (pale mat on dark pillows),
    // so the sheet is a ceiling of silver over a lit floor and never a pane of black glass
    float tB = (0.6 - P.y) / R.y; vec3 Qb = P + R * tB;
    float mt = smoothstep(0.40, 0.64, mcF(vec3(Qb.x * 0.45, 3.0, Qb.z * 0.45))), pil = mcCell(vec3(Qb.x * 0.37, 1.0, Qb.z * 0.37));
    vec3 gbd = mix(vec3(0.10, 0.10, 0.115) * (0.5 + 0.9 * pil), uMat * 0.66, mt);
    return mix(water, gbd * mcLight(Qb, normalize(vec3(-R.x * 0.5, 1.0, -R.z * 0.5)), dE + tB), smoothstep(0.05, 0.30, -R.y));
  }
  vec3 Q = P + R * tF;
  vec2 dir = normalize(R.xz + vec2(1e-4, 0.0)); vec2 prp = vec2(-dir.y, dir.x);
  float s = dot(Q.xz, prp) / 0.21, id = floor(s), fs = fract(s), al = dot(Q.xz, dir);
  float stretch = clamp(length(R.xz) / max(-R.y, 0.05), 0.25, 1.9);
  float len = (0.9 + 1.3 * mcH1(id * 1.7)) * stretch, cellL = len + 0.8 + 3.0 * mcH1(id + 3.1);
  float k = fract((al + mcH1(id * 5.3) * cellL) / cellL) * cellL, u = k / max(len, 1e-3);
  float thk = smoothstep(0.40, 0.50, mcF2(vec3(Q.xz * 0.32, floorY)));
  stripeFade *= 1.0 - smoothstep(18.0, 36.0, dE + tF);
  float tube = step(u, 1.0) * smoothstep(0.36, 0.2, abs(fs - 0.5)) * thk * stripeFade;
  float plume = step(u, 1.0) * smoothstep(0.76, 0.84, u) * smoothstep(0.5, 0.25, abs(fs - 0.5)) * thk * mix(0.5, 1.0, stripeFade);
  vec3 ground = mix(vec3(0.02, 0.022, 0.028), uMat * 0.45, smoothstep(0.52, 0.72, mcF(vec3(Q.xz * 0.8, 3.0))));
  ground = mix(ground, uBone * 0.45, thk * (1.0 - stripeFade) * 0.6);
  vec3 alb = mix(ground, uBone * (0.75 + 0.25 * mcH1(id)), tube);
  alb = mix(alb, uCrimson, plume);
  vec3 Nq = normalize(vec3(-R.x * 0.6, 1.0, -R.z * 0.6));
  float ledge = (1.0 - smoothstep(rT + 6.0, rT + 10.0, length(Q.xz))) * smoothstep(0.06, 0.28, -R.y);
  return mix(water, alb * mcLight(Q, Nq, dE + tF), ledge);
}
void main(){
  vec3 V = cameraPosition - vW; float dE = length(V); V /= max(dE, 1e-3);
  float bead = step(0.5, vK.x);
  // slow swells 0.3-1 m long, slopes to ~20 degrees, seen from underneath
  float t = uTime;
  vec2 gr = mcSwGrad(vW.xz, t) * (1.0 - smoothstep(25.0, 70.0, dE) * 0.7);
  vec3 Ng = normalize(vN); if (dot(Ng, V) < 0.0) Ng = -Ng;
  vec3 Np = normalize(vec3(gr.x, -1.0, gr.y)); if (V.y > 0.0) Np.y = -Np.y;
  float tr = 0.25 * (mcN(vec3(vW * 5.0 + vec3(0.0, t * 1.4, 0.0))) - 0.5);
  vec3 N = normalize(mix(Np, Ng + vec3(tr, tr * 0.5, -tr), bead));
  // (the roll is the pool's own water, and the swells that cross the sheet run on into it: its normal leans ALONG the lip by
  // the slope the swell has there, a ripple 0.3 to 1 m long in the world's own metres from any eye. As a ruled extrusion it
  // drew out along the whole lip whatever it showed, each lamp's image into a bright streak metres long, and from 6 m beside
  // a shelf it read as a stretched band; now a lamp is a short glint on each swell, and the roll's bands waver with the pool)
  N = normalize(N + vec3(vTl.x, 0.0, vTl.y) * (dot(gr, vTl) * bead));
  float cs = max(dot(N, V), 0.0);
  float swK = mix(0.6, 0.14, step(vK.z, -30.0));                // a pass sheet's scene sways, it does not shatter
  vec3 Nm = normalize(mix(vec3(gr.x * swK, Np.y, gr.y * swK), N, bead));
  vec3 R = reflect(-V, Nm);
  vec3 Rp = dFdx(vW), Rq = dFdy(vW);
  float sf = 1.0 - smoothstep(0.25, 0.9, (abs(dFdx(R.x)) + abs(dFdy(R.x)) + abs(dFdx(R.z)) + abs(dFdy(R.z))) * 30.0 + (length(Rp) + length(Rq)) * 2.0);
  vec3 refl = mcBelow(vW, R, dE, vK.z, vK.w, sf);
  vec3 col;
  float att = 1.0 / (1.0 + dE / 7.0);
  float spark = 1.0 - 0.6 * smoothstep(14.0, 40.0, dE);
  if (bead > 0.5) {
    // the rolled lip: a chrome bead with the tiny images of the two lamps and the brass collar of the dome in it
    col = mcSilver(refl) + uScatter * 0.06;
    col += uScatter * 0.35 * pow(max(1.0 - cs, 0.0), 3.0) * exp(-uAbsorb * dE);
    // the two lamp images: pinpoints close to, widening with distance so each stays about a pixel across at 10 m
    float farK = smoothstep(2.5, 9.0, dE), att2 = 1.0 / (1.0 + dE / 14.0);
    float farK2 = smoothstep(9.0, 22.0, dE);
    float dots = mcGlint(vW, N, V, mix(mix(1400.0, 100.0, farK), 34.0, farK2)) * mix(mix(3.0, 7.0, farK), 5.0, farK2);
    float ringB = smoothstep(0.9915, 0.9935, cs) * (1.0 - smoothstep(0.9960, 0.9975, cs));
    col += uLampCol * vec3(0.82, 0.92, 1.0) * min(dots * mix(att, att2, farK) * uLampI * 0.5, 2.5) * (1.0 - smoothstep(18.0, 32.0, dE)) + uBrass * ringB * att * uLampI * 0.6 * (1.0 - smoothstep(3.5, 7.0, dE));
    // and the lamps drawn out along the roll, as any bright thing is along a chrome rod: the thin bright line of the lip
    vec3 Tl = normalize(vec3(vTl.x, 0.0, vTl.y) + vec3(1e-4, 0.0, 2e-4));
    vec3 Hl = normalize(normalize(0.5 * (uLampPos[0] + uLampPos[1]) - vW) + V); Hl = normalize(Hl - Tl * dot(Hl, Tl) + N * 1e-4);
    col += uLampCol * vec3(0.72, 0.86, 1.0) * min(pow(max(dot(N, Hl), 0.0), 12.0) * uLampI * mix(att2, 0.55, farK2) * 0.30, 0.50) * (1.0 - 0.7 * smoothstep(20.0, 36.0, dE));   // seen from the side at 10 to 25 m it is the pool's bright rounded rim; beyond that the roll is quiet silver
  } else {
    col = mcMeniscus(mcSheet(refl, vW, V, dE, gr, vK.y, step(vK.z, -30.0)), vTl.x);
  }
  // the lander's cold lamps glint too
  vec3 Ll = normalize(uLandPos[1] - vW);
  col += uLandCol * pow(max(dot(N, normalize(Ll + V)), 0.0), 90.0) * 0.6 * spark * step(0.5, uLandI);
  // image of the exit ring
  float dn = dot(R, uRingN); float tt = dot(uRingPos - vW, uRingN) / (abs(dn) > 1e-3 ? dn : 1e-3);
  if (tt > 0.0) { float dr = length(vW + R * tt - uRingPos); float e = (dr - uRingR) / 0.28;
    col += uRingCol * (exp(-e * e) + 0.10 * (1.0 - smoothstep(0.0, uRingR, dr))) * max(smoothstep(0.985, 0.90, cs), bead); }
  gl_FragColor = vec4(col, 1.0);
  #include <fog_fragment>
}`;

// shimmer threads: ribbons that face the eye, a bright edge and a dark edge side by side
// (aT.w is the thread's seed: 0..1 a fine thread, 1..2 one of the world's broad threads, wider and brighter, 2..3 a
// feeder, finer and dimmer, that keeps its light all the way up to the pool it climbs into). Any thread loses its bright
// edge where the tower stands behind it.
const THREAD_V = /* glsl */`
${FOG_V}
attribute vec4 aT; uniform float uTime, uLeanT; varying vec3 vW; varying vec3 vT;
void main(){
  float t = aT.x, len = aT.z, sd = aT.w;
  vec3 p = (modelMatrix * vec4(position, 1.0)).xyz;
  float h = t * len;
  p.y += h;
  float fdv = step(2.0, sd);
  p.x += sin(h * 2.3 - uTime * 1.9 + sd * 40.0) * 0.22 * t + sin(h * 0.8 - uTime * 0.7 + sd * 13.0) * 0.6 * t * t + uLeanT * h * t * 0.6 * (1.0 - 0.75 * fdv);      // (a feeder leans a quarter as far: it has to reach its pool)
  p.z += cos(h * 1.9 - uTime * 1.6 + sd * 23.0) * 0.22 * t + sin(h * 0.7 - uTime * 0.6 + sd * 7.0) * 0.5 * t * t;
  vec3 toC = cameraPosition - p; float d = length(toC);
  vec3 right = normalize(cross(vec3(0.0, 1.0, 0.0), toC / max(d, 1e-3)) + vec3(1e-4, 0.0, 0.0));
  float bo = min(floor(sd), 1.0);
  float w = (0.035 + 0.0028 * d + bo * (0.025 + 0.0032 * d) * (1.0 - 0.6 * fdv)) * (0.6 + 0.8 * t);
  p += right * aT.y * w;
  vW = p; vT = vec3(t, aT.y, sd + h * 0.0);
  vec4 mvPosition = viewMatrix * vec4(p, 1.0); gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const THREAD_F = /* glsl */`
${FOG_F}
${NOISE_GLSL}
${LAMP_GLSL}
uniform float uTime; varying vec3 vW; varying vec3 vT;
void main(){
  vec3 V = cameraPosition - vW; float dE = length(V); V /= max(dE, 1e-3);
  float t = vT.x, s = vT.y;
  float fd = step(2.0, vT.z);                                       // a feeder: hot water climbing into a pool from below
  float fade = smoothstep(0.0, mix(0.06, 0.55, fd), t) * (1.0 - smoothstep(mix(0.25, 0.86, fd), 1.0, t));      // (a feeder gathers as it climbs)
  float bead = 0.45 + 0.55 * mcN(vec3(vT.z * 31.0, vW.y * 1.6 - uTime * 1.5, 1.0)); bead = mix(bead, bead * bead * 1.5, fd);
  float e1 = (s - 0.42) / 0.30, e2 = (s + 0.42) / 0.30;
  float bright = exp(-e1 * e1), dark = exp(-e2 * e2);
  vec3 E = mcLight(vW, V, dE);
  float bo = min(floor(vT.z), 1.0);                                 // 1 on the world's broad threads
  // (broad threads also carry the slate of the lit water and are brighter beyond 8 m: off F3's lip they stand as wavering
  // glass ribbons against black water from across the shelf; close to, they are held under white)
  vec3 col = (min(E, vec3(mix(1.6, 0.8, bo))) * vec3(0.55, 0.62, 0.70) * (0.50 + 0.45 * bo) * (1.0 + 0.6 * bo * smoothstep(8.0, 16.0, dE)) * (1.0 - 0.5 * fd) + uScatter * 1.5 * bo) * bright * fade * bead;
  float a = dark * fade * bead * 0.5;
  // a thread of hot water is seen against dark water. Where the lit tower stands behind it, it only bends what is there:
  // no bright edge (three feeders crossing the gold trunk read as white wires hung on it). The sight line is followed
  // past the thread to where it comes nearest the tower's axis
  vec2 hx = -V.xz; float hl2 = max(dot(hx, hx), 1e-4), tcA = -dot(cameraPosition.xz, hx) / hl2;
  float dAx = length(cameraPosition.xz + hx * tcA), yAx = cameraPosition.y - V.y * tcA;
  float Rt = max(11.2 - 0.17 * clamp(yAx, 0.0, 46.0), 4.2);
  float onT = smoothstep(dE - 0.5, dE + 1.5, tcA) * (1.0 - smoothstep(Rt, Rt + 2.2, dAx)) * (1.0 - smoothstep(50.0, 58.0, yAx));
  col *= 1.0 - 0.94 * onT; a *= 1.0 - 0.55 * onT;
  gl_FragColor = vec4(col, a);
  #include <fog_fragment>
}`;

// smoke: opaque, displaced, velvet: black core, rims in the colour of whatever lamp is behind it
const SMOKE_GLSL = /* glsl */`
float mcBillow(vec3 q){ return 0.62 * abs(2.0 * mcN(q) - 1.0) + 0.38 * abs(2.0 * mcN(q * 2.3 + vec3(3.1, 7.7, 1.3)) - 1.0); }
`;
const SMOKE_V = /* glsl */`
${FOG_V}
${NOISE_GLSL}
${SMOKE_GLSL}
attribute vec3 aQ; attribute vec2 aS; uniform float uTime, uLeanT; varying vec3 vW; varying vec3 vN; varying vec3 vQ; varying float vR;
void main(){
  vec3 p = (modelMatrix * vec4(position, 1.0)).xyz; vec3 n = normalize(mat3(modelMatrix) * normal);
  float r = aS.x, rise = aS.y;
  vec3 q = aQ + vec3(0.0, -uTime * rise, 0.0);
  float b = mcBillow(q);
  p += n * r * (0.55 * b - 0.12);
  float s = max(p.y - 50.0, 0.0); p.x += uLeanT * s * s / (s + 6.0);
  vW = p; vN = n; vQ = q; vR = r;
  vec4 mvPosition = viewMatrix * vec4(p, 1.0); gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const SMOKE_F = /* glsl */`
${FOG_F}
${NOISE_GLSL}
${SMOKE_GLSL}
${LAMP_GLSL}
uniform vec3 uSoot; uniform float uTime, uSmokeRim, uSmokeLit; varying vec3 vW; varying vec3 vN; varying vec3 vQ; varying float vR;
void main(){
  vec3 V = cameraPosition - vW; float dE = length(V); V /= max(dE, 1e-3);
  float e = 0.12; float b0 = mcBillow(vQ);
  vec3 gb = vec3(mcBillow(vQ + vec3(e, 0.0, 0.0)), mcBillow(vQ + vec3(0.0, e, 0.0)), mcBillow(vQ + vec3(0.0, 0.0, e))) - b0;
  float fineB = mcBillow(vQ * 3.7 + 11.0);
  vec3 N = normalize(vN); vec3 gt = gb - N * dot(gb, N);
  N = normalize(N - gt * (0.55 / e) * 0.55 + vec3(0.0, 1e-5, 0.0));
  if (dot(N, V) < 0.0) N = normalize(N - 2.0 * dot(N, V) * V);
  float crease = smoothstep(0.0, 0.35, b0) * (0.6 + 0.4 * fineB);
  float rim = pow(max(1.0 - max(dot(N, V), 0.0), 0.0), 2.2);
  vec3 E = mcLight(vW, N, dE);
  vec3 Eb = mcLight(vW, normalize(N - V * 1.2), dE);
  vec3 col = uSoot * (E * (0.5 + 0.5 * crease) + Eb * rim * 3.0 * crease) + uScatter * (0.10 + 0.5 * rim) * crease * exp(-uAbsorb * dE * mix(1.0, 0.3, uSurvey)) * (0.4 + 0.6 * uSurvey);
  // the lander's cold lamps on the column: a wrapped diffuse from where the lander stands, so every billow is modelled
  // (lit cheek, black crease) from the west and from below, plus a little on the rim (the world turns this up for the long views)
  vec3 Ll = normalize(uLandPos[1] - vW);
  float wrap = clamp((dot(N, Ll) + 0.45) / 1.45, 0.0, 1.0);
  float hgt = 1.0 - 0.5 * smoothstep(75.0, 150.0, vW.y);
  col += uLandCol * uSmokeRim * uSmokeLit * hgt * ((0.25 + 0.75 * crease) * (0.25 + 0.75 * wrap * wrap) * (0.65 + 0.35 * fineB) + rim * rim * 0.35 * crease);
  gl_FragColor = vec4(col, 1.0);
  #include <fog_fragment>
}`;

// tubeworms: instanced white tubes, crimson plumes that snap shut in a wave travelling through each thicket
const N_THICKET = 40;   // 24 of the hero's own + up to 16 that the world asks for (opts.passThickets)
const WORM_V = /* glsl */`
${FOG_V}
#ifdef MIRROR
${NOISE_GLSL}
${SWELL_GLSL}
${MIR_GLSL}
${MIR_V_GLSL}
#else
uniform float uTime;
#endif
attribute vec3 aBase; attribute vec3 aAxis; attribute vec3 aInfo;
uniform vec4 uThA[${N_THICKET}]; uniform float uThB[${N_THICKET}];
varying vec3 vW; varying vec3 vN; varying vec3 vC; varying vec2 vWp;
void main(){
  float H = length(aAxis); vec3 A = aAxis / max(H, 1e-3);
  vec3 ex = normalize(cross(A, vec3(0.31, 0.12, 0.94))); vec3 ez = cross(A, ex);
  int ti = int(aInfo.y + 0.5);
  vec4 th = uThA[ti]; float rel = uThB[ti];
  float delay = distance(aBase, th.xyz) / 3.0 + aInfo.x * 0.08;
  float shut = smoothstep(0.0, 0.25, uTime - (th.w + delay));
  float open = smoothstep(0.0, 4.0, uTime - (rel + delay + 0.8));
  float r = rel > th.w ? shut * (1.0 - open) : shut;
  float isPl = uv.x; float hgt = isPl > 0.5 ? 1.0 : position.y;
  float sway = sin(uTime * 0.7 + aInfo.x * 37.0) * 0.05 + sin(uTime * 1.9 + aInfo.x * 11.0) * 0.015;
  vec3 lp = position;
  if (isPl > 0.5) { float k = 1.0 - 0.93 * r; lp.xz *= k * (0.85 + 0.15 * sin(uTime * 2.1 + aInfo.x * 50.0)); lp.y = (position.y - 1.0) * (1.0 - 0.9 * r) - 0.05 * r; }
  else lp.y = position.y * H;
  #ifdef MIRROR
    // (hanging in a sheet they are seen from 15 to 30 m: nearly twice as thick, more with distance, or they are white flecks)
    lp.xz *= mix(max(1.9, 0.075 * distance(cameraPosition, aBase)), 1.5, isPl);
  #endif
  float along = isPl > 0.5 ? H + lp.y : lp.y;
  // every tube has its own slight bow (4 to 9 degrees at the tip); the plume carries on along the bowed tip
  float bw = aInfo.x * 91.0, bend = 0.035 + 0.045 * fract(aInfo.x * 13.7);
  vec3 bd = ex * cos(bw) + ez * sin(bw);
  vec3 p = aBase + A * along + ex * lp.x + ez * lp.z + ex * sway * hgt * hgt * H + bd * bend * (hgt * hgt * H + (isPl > 0.5 ? 2.0 * lp.y : 0.0));
  vWp = vec2(uv.y, (position.y - 1.0) / 0.32);
  vec3 w = (modelMatrix * vec4(p, 1.0)).xyz;
  vec3 n = normalize(ex * normal.x + ez * normal.z + A * normal.y);
  vW = w; vN = normalize(mat3(modelMatrix) * n);
  vC = vec3(isPl, aInfo.x, hgt * (1.0 - isPl) + isPl * (1.0 - r));
  #ifdef MIRROR
    w = mcMirrored(w);
  #endif
  vec4 mvPosition = viewMatrix * vec4(w, 1.0); gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const WORM_F = /* glsl */`
${FOG_F}
${NOISE_GLSL}
${LAMP_GLSL}
uniform vec3 uBone, uCrimson; uniform float uWhite; varying vec3 vW; varying vec3 vN; varying vec3 vC; varying vec2 vWp;
#ifdef MIRROR
uniform float uTime;
${SWELL_GLSL}
${MIR_GLSL}
${POOL_GLSL}
#endif
${MIR_EYE}
void main(){
  vec3 V = MC_EYE - vW; float dE = length(V); V /= max(dE, 1e-3);
  vec3 N = normalize(vN); if (dot(N, V) < 0.0) N = -N;
  float pl = step(0.5, vC.x);
  // the plume: a feather, two crossed blades (quads) cut to a serrated spindle here. vWp = (across -1..1, along 0..1)
  float pt = clamp(vWp.y, 0.0, 1.0), pa = abs(vWp.x);
  float tooth = abs(fract(pt * 9.0) - 0.5) * 2.0, tf = 1.0 - smoothstep(0.25, 0.9, fwidth(vWp.y * 9.0));
  float ph = pt * 64.0 - pa * 20.0, lf = 1.0 - smoothstep(0.5, 1.7, fwidth(vWp.y * 64.0) + fwidth(vWp.x) * 20.0);      // lamellae: gone before they can alias
  float prof = 0.8 * pow(max(sin(3.14159 * pow(pt + 1e-4, 0.72)), 0.0) + 1e-5, 0.75) * (1.0 - 0.26 * tooth * tf);
  if (pl > 0.5 && pa > prof) discard;
  float pe = pa / max(prof, 1e-3);
  // the tube: growth rings (drawn as grooves, faded by their own footprint), a pale flared collar, soot and stain toward the foot
  float rp = vC.z * (9.0 + 7.0 * mcH1(vC.y * 5.0)) + vC.y * 3.0, rw = fwidth(rp);
  float groove = smoothstep(0.62 - rw, 0.92, abs(fract(rp) - 0.5) * 2.0) * (1.0 - smoothstep(0.3, 0.8, rw));
  float foot = smoothstep(0.0, 0.5, vC.z);
  vec3 tube = mix(uBone * vec3(0.50, 0.44, 0.36), uBone * (0.74 + 0.22 * mcH1(vC.y * 7.0)), foot) * mix(0.5, 1.0, smoothstep(0.0, 0.3, vC.z));
  tube *= (1.0 - mix(0.42, 0.62, uWhite) * groove) * (1.0 + 0.16 * smoothstep(0.955, 0.985, vC.z));
  tube *= mix(vec3(1.0), vec3(0.66, 0.74, 0.84), uWhite);           // on white stone a tube is a shade darker and cooler than the rock, so each worm is a tube with a plume
  // the feather: a dark heart along the quill, barbs running out and up from it, darker toward the foot; of its two crossed
  // blades the one that faces the lamps is lit and the one turned away is in shadow, with only its thin fringe glowing through
  float nl = max(dot(N, V), 0.0);
  vec3 crim = uCrimson * (0.70 + 0.42 * mcH1(vC.y * 3.0));
  float heart = mix(0.30, 1.0, smoothstep(0.0, 0.55, pe)) * mix(0.60, 1.06, pt);
  vec3 plume = crim * heart * mix(1.0, 0.60 + 0.40 * sin(ph), lf) * (0.36 + 0.64 * nl);
  plume += crim * vec3(1.0, 0.42, 0.36) * 0.50 * smoothstep(0.66, 1.0, pe) * (1.0 - 0.55 * nl);
  // red dies first: beyond a dozen metres a plume is a dull maroon, further still slate
  plume = mix(plume, vec3(dot(plume, vec3(0.5, 0.35, 0.15))) * vec3(0.72, 0.62, 0.74), smoothstep(11.0, 34.0, dE) * 0.72);
  tube = mix(tube, vec3(dot(tube, vec3(0.4, 0.45, 0.15))) * vec3(0.8, 0.9, 1.1), smoothstep(16.0, 55.0, dE) * 0.7);
  vec3 alb = mix(tube, plume, pl);
  vec3 E = mix(mcLight(vW, normalize(N + V * 0.35), dE), mcLight(vW, V, dE), pl);     // the plume's own blade shading is above: here it takes only the lamps' falloff
  E /= 1.0 + mix(0.3, 0.55, pl) * max(E.r, max(E.g, E.b));           // bone-white a metre from the lamps must keep its rings, not burn out; nor the crimson go poster-flat
  vec3 col = alb * E;
  #ifdef MIRROR
${MIR_F_END}
  #endif
  gl_FragColor = vec4(col, 1.0);
  #include <fog_fragment>
}`;

// chimney: a lumpy tube along `dir` from `base`, ending in an orifice (a short throat turned back inside)
function addChimney(acc, base, dir, len, cols, rows, rOut, rThroat, depth, mFn) {
  const [ex, ez, d] = frameFor(dir);
  return addTube(acc, cols, rows,
    (t, c) => { const u = t <= 0.9 ? t / 0.9 * len : len - (t - 0.9) / 0.1 * depth; c[0] = base[0] + d[0] * u; c[1] = base[1] + d[1] * u; c[2] = base[2] + d[2] * u; },
    (t, a) => t <= 0.9 ? rOut(t / 0.9, a) : rThroat * (1 - 0.3 * (t - 0.9) / 0.1),
    ex, ez, mFn, true);
}

const FLANGE_DEFS = [
  // the three pass shelves are big, full brackets: the path runs UNDER them (4 m below, 6 m inside the rim), so that from
  // the dome each mirror is a ceiling across the upper half of the frame and not a card seen edge-on beside it
  { name: 'F1', bearing: 75, y: 12.5, jut: 11.5, width: 13, n: 3.2, pass: true },
  { name: 'F2', bearing: 125, y: 17.5, jut: 12.5, width: 15, n: 3.2, pass: true },
  { name: 'F3', bearing: 203, y: 23.5, jut: 14, width: 22, n: 3.2, pass: true, spillMin: 0.95 },      // the pool spills round a broad arc of the rim; the rest of it is held by the stone lip
  { name: 'F4', bearing: 290, y: 30, jut: 5.5, width: 8 },
  { name: 'F5', bearing: 150, y: 37, jut: 5.5, width: 8 },
  { name: 'F6', bearing: 46, y: 47, jut: 16, width: 16, r0: 1.4, reach: 1.6, spill: 0.8 },
];

export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng.fork ? ctx.rng.fork('mirror-chimneys-hero') : ctx.rng;
  const nz = ctx.noise ?? makeNoise(7741);
  const detail = ctx.quality?.detail ?? 1;
  const pal = (opts.palette && opts.palette.length >= 7) ? opts.palette : DEFAULT_PALETTE;
  const C = (h) => new THREE.Color(h);
  const viewer = Object.keys(opts).length === 0;
  let hm = null; try { const q = new URLSearchParams(globalThis.location?.search || ''); if (q.get('world') === '_part') hm = q.get('hm'); } catch (e) { /* no DOM */ }
  const seeded = rng.pick(['ochre', 'ochre', 'ochre', 'sulphide', 'white']);
  const mineral = opts.mineral ?? hm ?? seeded;
  const lean = opts.lean ?? rng.range(0.17, 0.26);
  const lamps = lampUniforms(pal, opts.lampColor ?? '#EAF2FF');
  lamps.uSurvey.value = opts.survey ?? (viewer ? 1 : 0);
  const uTime = { value: 0 }, uLeanT = { value: Math.tan(lean) }, uSmokeRim = { value: 0 }, uFieldRim = { value: 0 }, uTower = { value: 0 };
  const object = new THREE.Group(); object.name = 'mirror-chimneys-hero';

  // ---------- the rock: trunk, crown, knobs, beehives, pipes, talus, flanges (one mesh) ----------
  const field = makeTrunkField(rng, nz), TR = field.R;
  const flanges = FLANGE_DEFS.map((d) => makeFlange(rng, nz, d, TR));
  const local = (F, x, z) => { const dx = x, dz = z, u = dx * F.o[0] + dz * F.o[1] - F.r0, v = dx * F.t[0] + dz * F.t[1]; return [Math.hypot(u, v), Math.atan2(v, u)]; };
  const inFlange = (x, y, z, pad = 0.3) => {
    for (const F of flanges) { if (y < F.yc - 6 || y > F.yc + 5) continue; const [m, phi] = local(F, x, z), rho = m / F.E(phi); if (rho >= 1) continue;
      if (y > F.yc + F.under(Math.min(rho, 0.99), phi) - pad && y < F.yc + F.hTop(rho, phi) + pad) return true; }
    return false;
  };
  const heatAt = (x, y, z) => {
    let h = 0;
    for (const F of flanges) { const dy = y - F.yc; if (dy < -3 || dy > 1) continue; const [m, phi] = local(F, x, z);
      h = Math.max(h, 0.8 * (1 - smoothstep(F.Lw * 0.5, F.Lw * 1.1, m)) * smoothstep(-3, -0.8, dy) * (Math.cos(phi) > -0.2 ? 1 : 0.4)); }
    return h + 0.22 * Math.max(0, nz.n3(x * 0.15, y * 0.5, z * 0.15));
  };
  const kindAt = (y) => 0.85 * smoothstep(33, 45, y);
  const acc = makeAcc();
  {
    const cols = 128, rows = 118, base = acc.count, i0 = acc.idx.length;
    for (let r = 0; r <= rows; r++) {
      const y = -0.6 + r / rows * 47.2, shrink = Math.max(Math.sqrt(1 - smoothstep(44.2, 46.6, y)), 0.02), e = envR(y);
      for (let q = 0; q <= cols; q++) {
        const th = (q % cols) / cols * Math.PI * 2, R = TR(th, y) * shrink, x = Math.cos(th) * R, z = Math.sin(th) * R;
        const ao = lerp(0.18, 1, smoothstep(0.80, 1.04, R / (e * shrink * 1.02)));
        acc.vert(x, y, z, 0, 1, 0, heatAt(x, y, z), kindAt(y), ao);
      }
      if (r % 3 === 2) await ctx.yield();
    }
    acc.grid(base, cols, rows, false); await ctx.yield(); rangeNormals(acc, base, i0); await ctx.yield(); weldSeam(acc, base, cols, rows);
  }
  await ctx.yield();
  // crown chimneys with ember throats
  const throats = [], crownTops = rng.shuffle([55, 53.6, 52.4, 51.2, 50]);
  field.crown.forEach((p, i) => {
    const a = p.a0 + p.wob * Math.sin(40 * p.fr + p.ph), d0 = envR(40) * p.dk * 0.85, yT = crownTops[i], H = yT - 39;
    const base = [Math.cos(a) * d0, 39, Math.sin(a) * d0], out = rng.range(0.04, 0.14), tw = rng.range(-0.06, 0.06);
    const dir = [Math.cos(a) * out - Math.sin(a) * tw, 1, Math.sin(a) * out + Math.cos(a) * tw];
    const rT = rng.range(0.32, 0.6), ph = rng.range(0, 6.28), lob = rng.int(2, 4), bf = rng.range(1.5, 2.4), L = H * Math.hypot(dir[0], 1, dir[2]);
    addChimney(acc, base, dir, L, 14, 26,
      (t, an) => lerp(1.35, rT * 1.55, Math.pow(t, 0.8)) * (1 + 0.17 * Math.sin(t * H * bf + ph)) * (1 + 0.07 * Math.cos(lob * an + ph)) * (1 + 0.1 * nz.n3(Math.cos(an) * 1.3 + i * 9, t * H * 0.7, Math.sin(an) * 1.3)),
      rT, 1.3,
      (t, an, m) => { const body = t <= 0.9, tb = t / 0.9; m[0] = body ? 0.62 * Math.pow(Math.max(0, Math.sin(tb * H * bf + ph + 1.2)), 3) * smoothstep(0.15, 0.5, tb) + 0.5 * smoothstep(0.93, 1, tb) * 0 : 1.0; m[1] = 1; m[2] = body ? lerp(0.5, 1, smoothstep(0, 0.25, tb)) : 1; });
    const nrm = Math.hypot(dir[0], dir[1], dir[2]);
    throats.push({ position: V3(base[0] + dir[0] / nrm * L, base[1] + dir[1] / nrm * L, base[2] + dir[2] / nrm * L), radius: rT });
  });
  await ctx.yield();
  // botryoidal knobs in clusters
  const ico1 = icoTemplate(1), ico0 = icoTemplate(0);
  for (let c = 0; c < 46; c++) {
    const th0 = rng.range(0, 6.283), y0 = 1 + Math.pow(rng(), 1.3) * 42, big = rng.range(0.28, 0.5);
    for (let k = 0; k < 4; k++) {
      const y = y0 + (k ? rng.range(-1.1, 1.1) : 0), R0 = TR(th0, y), th = th0 + (k ? rng.range(-1.0, 1.0) / R0 : 0), R = TR(th, y);
      const s = k ? big * rng.range(0.35, 0.8) : big, cx = Math.cos(th) * (R - 0.25 * s), cz = Math.sin(th) * (R - 0.25 * s), sy = s * rng.range(0.75, 1.1);
      if (inFlange(cx, y, cz, 0.6)) continue;
      addBlob(acc, ico1, nz, cx, y, cz, s, sy, s, 0.2, heatAt(cx, y, cz) + 0.1, kindAt(y), Math.cos(th), 0.15, Math.sin(th), 0.4);
    }
    if (c % 12 === 11) await ctx.yield();
  }
  // beehive diffusers
  for (let i = 0; i < 12; i++) {
    const th = rng.range(0, 6.283), y = rng.range(3, 38), R = TR(th, y), h = rng.range(1.2, 2.6), rb = rng.range(0.45, 0.85), ph = rng.range(0, 6), lean2 = rng.range(0.15, 0.38);
    const base = [Math.cos(th) * (R - 0.3), y - 0.2, Math.sin(th) * (R - 0.3)], dir = [Math.cos(th) * lean2, 1, Math.sin(th) * lean2];
    if (inFlange(base[0], y + h * 0.5, base[2], 1.0)) continue;
    const [ex, ez, d] = frameFor(dir);
    addTube(acc, 10, 9, (t, c) => { c[0] = base[0] + d[0] * t * h; c[1] = base[1] + d[1] * t * h; c[2] = base[2] + d[2] * t * h; },
      (t, a) => rb * Math.pow(Math.sin(Math.PI * (0.18 + 0.82 * t)), 0.6) * (1 - 0.45 * t) * (1 + 0.15 * Math.sin(t * h * 9 + ph)) + 0.03,
      ex, ez, (t, a, m) => { m[0] = 0.5 + 0.3 * Math.sin(t * h * 9 + ph); m[1] = 0.15; m[2] = lerp(0.45, 1, smoothstep(0, 0.3, t)); }, true);
  }
  // side pipes and snapped spires
  for (let i = 0; i < 26; i++) {
    const th = rng.range(0, 6.283), y = 1 + Math.pow(rng(), 0.8) * 37, R = TR(th, y), len = rng.range(2, y < 26 ? 4.5 : 7), r0 = rng.range(0.3, 0.62), ph = rng.range(0, 6);
    const out = rng.range(0.08, y < 26 ? 0.2 : 0.4), tw = rng.range(-0.15, 0.15);
    const base = [Math.cos(th) * (R - 0.45), y - 0.3, Math.sin(th) * (R - 0.45)], dir = [Math.cos(th) * out - Math.sin(th) * tw, 1, Math.sin(th) * out + Math.cos(th) * tw];
    if (inFlange(base[0], y + len * 0.5, base[2], 1.2) || inFlange(base[0] + dir[0] * len, y + len, base[2] + dir[2] * len, 1.2)) continue;
    const hk = kindAt(y + len), hot = rng.chance(0.35) ? 0.6 : 0.05;
    const lenG = Math.min(len, 4.2);      // (drawn shorter, stouter at the foot and knobbed: seen end-on from the rise a 7 m pipe of one thickness was a plain rod)
    addChimney(acc, base, dir, lenG, 9, 10, (t, a) => lerp(r0 * 1.3, r0 * 0.5, Math.pow(t, 0.7)) * (1 + 0.24 * Math.sin(t * lenG * 2.6 + ph)) * (1 + 0.1 * Math.cos(2 * a + ph)) * (1 + 0.18 * nz.n3(Math.cos(a) * 1.4 + ph, t * lenG * 0.9, Math.sin(a) * 1.4 + i * 3.1)), r0 * 0.3, 0.5,
      (t, a, m) => { m[0] = t <= 0.9 ? hot * smoothstep(0.6, 0.9, t) : 0.1; m[1] = hk; m[2] = t <= 0.9 ? lerp(0.45, 1, smoothstep(0, 0.3, t)) : 0.08; });
    if (i % 9 === 8) await ctx.yield();
  }
  // talus at the foot
  for (let i = 0; i < 150; i++) {
    const a = rng.range(0, 6.283), rad = 7.5 + Math.pow(rng(), 1.6) * 8.5, s = rng.range(0.3, 1.25) * (1 - (rad - 7.5) / 14), el = rng.range(0.7, 1.9);
    const R = Math.max(TR(a, 0.5) - 0.8, rad), x = Math.cos(a) * R, z = Math.sin(a) * R, flip = rng.chance(0.5);
    addBlob(acc, ico0, nz, x, s * 0.25 + Math.max(0, 1.6 - (R - 9) * 0.5) * rng(), z, s * (flip ? el : 1), s * 0.5, s * (flip ? 1 : el), 0.7, 0.05, rng.chance(0.2) ? 0.8 : 0.1, 0, 1, 0, 0.35);
  }
  await ctx.yield();
  for (const F of flanges) { F.v0 = acc.count; addFlange(acc, F, F.name === 'F6' ? 0.18 : kindAt(F.yc) * 0.8); F.v1 = acc.count; await ctx.yield(); }

  const colors = { uOchre: { value: C(pal[1]) }, uRust: { value: C(pal[2]) }, uBone: { value: C(pal[3]).multiplyScalar(0.9) }, uMat: { value: C(pal[4]) },
    uCrimson: { value: C(pal[5]).multiplyScalar(1.25) }, uBrass: { value: C(pal[1]).multiplyScalar(1.6) }, uEmber: { value: C('#FF7A2E').multiplyScalar(1.1) } };
  const uPool = { value: flanges.map((F) => new THREE.Vector4(F.center.x, F.yc, F.center.z, F.Lw)) };
  const fogU = THREE.UniformsUtils.clone(THREE.UniformsLib.fog);
  const mkMat = (vs, fs, extra, o = {}) => new THREE.ShaderMaterial({ vertexShader: vs, fragmentShader: fs, fog: true,
    uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...lamps, ...colors, uTime, uLeanT, ...extra }, ...o });
  void fogU;
  const rockGeo = new THREE.BufferGeometry();
  rockGeo.setAttribute('position', new THREE.Float32BufferAttribute(acc.pos, 3));
  rockGeo.setAttribute('normal', new THREE.Float32BufferAttribute(acc.nrm, 3));
  rockGeo.setAttribute('aMat', new THREE.Float32BufferAttribute(acc.mat, 3));
  rockGeo.setIndex(acc.idx);
  rockGeo.boundingSphere = new THREE.Sphere(V3(0, 28, 0), 36);
  const minU = { uKindAdd: { value: mineral === 'sulphide' ? 0.42 : 0 }, uWhite: { value: mineral === 'white' ? 1 : 0 } };
  const rockMat = mkMat(ROCK_V, ROCK_F, { uPool, uFieldRim, uTower, ...minU });
  const rock = new THREE.Mesh(rockGeo, rockMat); rock.name = 'spire'; object.add(rock);
  await ctx.yield();

  // ---------- the pools: level mirror sheets and the chrome bead rolled round each spill lip ----------
  const pp = [], pn = [], pk = [], pi = [], ptl = [], threadSites = [];
  const pv = [0, 0, 0];
  for (const F of flanges) {
    const floorY = F.pass ? -60 : Math.max(F.yc - 5.5, 0.6), rT = envR(F.yc - 3) * (F.pass ? 0.8 : 1.05), nr = F.pass ? 10 : 8, np = F.pass ? 56 : 34, b0 = pp.length / 3;
    for (let j = 0; j <= np; j++) {
      const phi = -1.5 + 3.0 * j / np, e = F.E(phi), edge = 1 - F.rl / e;
      for (let i = 0; i <= nr; i++) { const rho = lerp(0.27, edge, i / nr); F.at(rho * e, phi, F.yc, pv); pp.push(pv[0], pv[1], pv[2]); pn.push(0, -1, 0); pk.push(0, F.depth * (0.4 + 0.6 * Math.sin(Math.PI * i / nr)), floorY, rT); ptl.push(i / nr, 0); }
    }
    for (let j = 0; j < np; j++) for (let i = 0; i < nr; i++) { const a = b0 + j * (nr + 1) + i, b = a + 1, c = a + nr + 1, d = c + 1; pi.push(a, b, c, b, d, c); }
    // bead: the roll of the spill. In section (x outward from the end of the sheet, y from the level of the sheet) it leaves
    // the sheet, hangs a third of a metre below it as a round chrome moulding with a steep inner face (the face a dome under
    // the pool looks at: it carries the lamp images there), turns under the lip and rolls up round the stone nosing.
    const ns = F.width > 12 ? 56 : 40, b1 = pp.length / 3;
    const PRO = [[-0.50, 0.0], [-0.40, -0.02], [-0.345, -0.09], [-0.30, -0.20], [-0.20, -0.30], [-0.05, -0.345], [0.10, -0.32], [0.23, -0.23], [0.32, -0.08], [0.345, 0.10], [0.31, 0.28], [0.22, 0.44], [0.10, 0.54]], na = PRO.length - 1;
    for (let j = 0; j <= ns; j++) {
      const s = j / ns, phi = F.phi0 + (s * 2 - 1) * F.phis, e = F.E(phi), yl = F.yc + F.rl - F.skirt(phi), cphi = Math.cos(phi), sphi = Math.sin(phi);
      const dx = F.o[0] * cphi + F.t[0] * sphi, dz = F.o[1] * cphi + F.t[1] * sphi;
      const sc = lerp(0.45, 1, smoothstep(0, 0.14, s) * smoothstep(1, 0.86, s)), lift = yl - F.yc - 0.34;       // the top of the roll follows the stone lip
      for (let i = 0; i <= na; i++) {
        const q = PRO[i], q0 = PRO[Math.max(i - 1, 0)], q1 = PRO[Math.min(i + 1, na)], tx = q1[0] - q0[0], ty = q1[1] - q0[1], tl = Math.hypot(tx, ty) || 1;
        const nx = ty / tl, ny = -tx / tl;
        F.at(e - F.rl + q[0] * sc, phi, F.yc + q[1] * sc + lift * smoothstep(-0.1, 0.3, q[1]), pv); pp.push(pv[0], pv[1], pv[2]); pn.push(dx * nx, ny, dz * nx); pk.push(1, F.depth, floorY, rT); ptl.push(-dz, dx);
      }
      if (j % 2 === 0 && s > 0.12 && s < 0.88) { F.at(e - F.rl + (F.rl + 0.05) * 0.64, phi, yl + (F.rl + 0.05) * 0.77, pv); const site = { p: [pv[0], pv[1], pv[2]], w: F.width, F }; threadSites.push(site); if (F.spillMin) threadSites.push(site, site); }
    }
    for (let j = 0; j < ns; j++) for (let i = 0; i < na; i++) { const a = b1 + j * (na + 1) + i, b = a + 1, c = a + na + 1, d = c + 1; pi.push(a, b, c, b, d, c); }
  }
  const seat = V3(-8.3, 45, 8.6), seatN = V3(-25.2, 6, -7.7).sub(seat).normalize();
  const ringU = { uRingPos: { value: seat.clone() }, uRingN: { value: seatN.clone() }, uRingR: { value: 3.75 }, uRingCol: { value: C(pal[6]).multiplyScalar(opts.ring === false ? 0 : 1.6) } };
  const poolGeo = new THREE.BufferGeometry();
  poolGeo.setAttribute('position', new THREE.Float32BufferAttribute(pp, 3)); poolGeo.setAttribute('normal', new THREE.Float32BufferAttribute(pn, 3));
  poolGeo.setAttribute('aK', new THREE.Float32BufferAttribute(pk, 4)); poolGeo.setAttribute('aTl', new THREE.Float32BufferAttribute(ptl, 2)); poolGeo.setIndex(pi);
  poolGeo.boundingSphere = new THREE.Sphere(V3(0, 30, 0), 34);
  const lampC = new THREE.Color(opts.lampColor ?? '#EAF2FF'), uMirDesat = { value: lampC.r - lampC.b > 0.2 ? 0.62 : 0.3 };   // warm lamps: pull the mirror harder to silver
  const pools = new THREE.Mesh(poolGeo, mkMat(POOL_V, POOL_F, { ...ringU, ...minU, uMirDesat }, { side: THREE.DoubleSide })); pools.name = 'mirrors'; object.add(pools);
  // ---------- the pass shelves' reflected scene: the rock under each of them drawn again upside down in its sheet ----------
  const passF = flanges.filter((F) => F.pass), mirrorSets = [];
  const underShelf = (F, x, y, z, deep = 11.5, pad = 5) => { if (y > F.yc - 0.03 || y < F.yc - deep) return false; const u = x * F.o[0] + z * F.o[1] - F.r0, v = x * F.t[0] + z * F.t[1]; return u > -7 && u < F.Lr + pad && Math.abs(v) < F.Lw + pad + 1; };
  for (const F of passF) {
    const U = { uMirA: { value: new THREE.Vector4(F.yc, F.r0, F.Lr, F.Lw) }, uMirB: { value: new THREE.Vector4(F.o[0], F.o[1], F.t[0], F.t[1]) }, uMirC: { value: new THREE.Vector4(F.Lb, F.sc1, F.sc2, F.rl) }, uMirN: { value: F.nE }, uMirDesat };
    const rockM = mkMat(ROCK_V, ROCK_F, { uPool, uFieldRim, uTower, ...minU, ...U }, { side: THREE.BackSide, defines: { MIRROR: 1 } });      // reflected: the winding is reversed
    const set = { F, U, rockM, meshes: [] };
    const sub = [], P = acc.pos, I = acc.idx;
    for (let i = 0; i < I.length; i += 3) {
      const a = I[i], b = I[i + 1], c = I[i + 2];
      if (a >= F.v0 && a < F.v1) continue;                                   // not the shelf's own stone
      if (underShelf(F, (P[a * 3] + P[b * 3] + P[c * 3]) / 3, (P[a * 3 + 1] + P[b * 3 + 1] + P[c * 3 + 1]) / 3, (P[a * 3 + 2] + P[b * 3 + 2] + P[c * 3 + 2]) / 3)) sub.push(a, b, c);
      if (i % 60000 === 59997) await ctx.yield();
    }
    const g = new THREE.BufferGeometry(); for (const k of ['position', 'normal', 'aMat']) g.setAttribute(k, rockGeo.getAttribute(k)); g.setIndex(sub);
    const m = new THREE.Mesh(g, rockM); m.name = 'mirror-rock-' + F.name; m.frustumCulled = false; object.add(m); set.meshes.push(m);
    mirrorSets.push(set);
    await ctx.yield();
  }
  await ctx.yield();

  // ---------- shimmer threads rising from the spill ----------
  {
    const nTh = Math.round(84 * detail), seg = 12, tp = [], ta = [], ti = [];
    for (let n = 0; n < nTh; n++) {
      const site = threadSites[Math.floor(rng() * threadSites.length)], len = rng.range(2, 6), sd = rng(), jx = rng.range(-0.12, 0.12), jz = rng.range(-0.12, 0.12), b = tp.length / 3;
      for (let i = 0; i <= seg; i++) for (let s = -1; s <= 1; s += 2) { tp.push(site.p[0] + jx, site.p[1], site.p[2] + jz); ta.push(i / seg, s, len, sd); }
      for (let i = 0; i < seg; i++) { const a = b + i * 2; ti.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(tp, 3)); g.setAttribute('aT', new THREE.Float32BufferAttribute(ta, 4)); g.setIndex(ti);
    g.boundingSphere = new THREE.Sphere(V3(0, 32, 0), 40);
    const m = mkMat(THREAD_V, THREAD_F, {}, { transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor });
    const threads = new THREE.Mesh(g, m); threads.name = 'threads'; threads.renderOrder = 3; object.add(threads);
  }

  // ---------- smoke: five jets merging into one leaning column with a flat lid ----------
  const smokeTop = 152; let smoke = null;
  if (opts.smoke !== false) {
    const sa = makeAcc(), ss = [];
    const ring = (cx, cy, cz, r, cols, yq, off, rise, tilt) => { // one ring of the lathe; tilt = normal's vertical part
      const sc = 0.85 * Math.min(r, 12) + 0.4;
      for (let q = 0; q <= cols; q++) { const a = (q % cols) / cols * Math.PI * 2, c = Math.cos(a), s = Math.sin(a);
        sa.vert(cx + c * r, cy, cz + s * r, c, tilt, s, c * r / sc + off, yq, s * r / sc); ss.push(Math.min(r, 12), rise / sc); }
    };
    throats.forEach((T, j) => {
      const base = sa.count, i0 = sa.idx.length, rows = 12, cols = 12; let yq = 0;
      for (let r = 0; r <= rows; r++) { const t = r / rows, rad = r === 0 ? T.radius * 0.5 : lerp(T.radius * 0.95, 2.7, Math.pow(t, 1.3)), y = lerp(T.position.y - 0.5, 67, t);
        yq += r ? (67 - T.position.y + 0.5) / rows / (0.85 * rad + 0.4) : 0;
        ring(lerp(T.position.x, 0, t * t), y, lerp(T.position.z, 0, t * t), rad, cols, yq, 10 + j * 7.3, 2.4, 0); }
      sa.grid(base, cols, rows, false); rangeNormals(sa, base, i0); weldSeam(sa, base, cols, rows);
    });
    {
      const base = sa.count, i0 = sa.idx.length, rows = 104, cols = 48; let yq = 0, py = 60, pr = 3.0;
      for (let r = 0; r <= rows; r++) {
        const s = r / rows; let y, rad;
        if (s < 0.78) { const u = s / 0.78; y = lerp(60, 144, u); rad = lerp(3.0, 11.5, Math.pow(u, 0.85)); }
        else if (s < 0.92) { const u = (s - 0.78) / 0.14; y = 144 + 5 * Math.sin(u * Math.PI * 0.5); rad = 11.5 + 36 * Math.pow(u, 0.8); }
        else { const u = (s - 0.92) / 0.08; y = 149 + 4.5 * Math.sin(u * Math.PI * 0.5); rad = Math.max(47.5 * Math.cos(u * Math.PI * 0.5), 0.05); }
        yq += Math.hypot(y - py, rad - pr) / (0.85 * Math.min(rad, 12) + 0.4); py = y; pr = rad;
        ring(0, y, 0, rad, cols, yq, 0, lerp(2.0, 0.9, s), 0);
        if (r % 26 === 25) await ctx.yield();
      }
      sa.grid(base, cols, rows, false); rangeNormals(sa, base, i0); weldSeam(sa, base, cols, rows);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(sa.pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(sa.nrm, 3));
    g.setAttribute('aQ', new THREE.Float32BufferAttribute(sa.mat, 3)); g.setAttribute('aS', new THREE.Float32BufferAttribute(ss, 2)); g.setIndex(sa.idx);
    g.boundingSphere = new THREE.Sphere(V3(20, 100, 0), 130);
    const soot = mineral === 'white' ? C(pal[4]).multiplyScalar(0.55) : new THREE.Color(0.05, 0.052, 0.058);
    smoke = new THREE.Mesh(g, mkMat(SMOKE_V, SMOKE_F, { uSoot: { value: soot }, uSmokeRim, uSmokeLit: { value: mineral === 'white' ? 0.40 : 0.24 } })); smoke.name = 'smoke'; object.add(smoke);
    await ctx.yield();
  }

  // ---------- tubeworms: thickets on the flange tops, the trunk ledges and round the foot ----------
  const wormThickets = [], thA = [], thB = [];
  for (let i = 0; i < N_THICKET; i++) { thA.push(new THREE.Vector4(0, 0, 0, -1000)); thB.push(-990); }
  const wormU = { uThA: { value: thA }, uThB: { value: thB } };
  if (opts.worms !== false) {
    const total = Math.round((opts.wormCount ?? 1100) * detail), per = Math.ceil(total / 24);
    const wb = [], wa = [], wi = [];
    const plan = [[0, 2], [1, 3], [2, 4], [3, 1], [4, 1], [5, 4]];
    const sites = [];
    for (const [fi, n] of plan) for (let k = 0; k < n; k++) sites.push({ F: flanges[fi], rho: rng.range(0.4, 0.78), phi: (n === 1 ? rng.range(-0.5, 0.5) : lerp(-1.0, 1.0, (k + rng.range(0.2, 0.8)) / n)) });
    for (let k = 0; k < 5; k++) sites.push({ wall: true, th: rng.range(0, 6.283), y: rng.range(3, 21) });
    for (let k = 0; k < 4; k++) sites.push({ foot: true, th: (k + rng.range(0, 0.8)) / 4 * 6.283, r: rng.range(10.5, 12.5) });
    // the world's own thickets (the ones that stand 3 m from the dome at each shelf pass): { p: [x,y,z] foot of the clump, o: [ox,oz] outward lean, r: radius }
    // or { b: bearing, y, off, r }: the part stands it `off` metres out from the trunk wall at that bearing and height
    for (const P of (opts.passThickets || [])) {
      if (P.b !== undefined) { const th = Math.atan2(Math.sin(P.b * RAD), -Math.cos(P.b * RAD)), R = Math.min(TR(th, P.y) + (P.off ?? 0.9), 9.6); sites.push({ at: true, pass: true, p: [Math.cos(th) * R, P.y, Math.sin(th) * R], o: [Math.cos(th), Math.sin(th)], r: P.r ?? 1.3 }); }
      else sites.push({ at: true, pass: true, p: P.p, o: P.o || [0, 0], r: P.r ?? 1.3 });
    }
    sites.length = Math.min(sites.length, N_THICKET);
    for (let si = 0; si < sites.length; si++) {
      const S = sites[si]; const cen = V3(); let n = 0;
      if (S.F) S.F.top(S.rho, S.phi, cen);
      else if (S.at) cen.set(S.p[0], S.p[1], S.p[2]);
      else if (S.wall) { const R = TR(S.th, S.y); cen.set(Math.cos(S.th) * R, S.y, Math.sin(S.th) * R); }
      else cen.set(Math.cos(S.th) * S.r, 0.3, Math.sin(S.th) * S.r);
      for (let tries = 0; tries < per * 3 && n < per; tries++) {
        const rr = 2.3 * Math.sqrt(rng()), aa = rng.range(0, 6.283), H = rng.range(0.8, 2.2) * (1 - 0.25 * rr / 2.3), sd = rng();
        let x, y, z, ax = rng.range(-0.18, 0.18), ay = 1, az = rng.range(-0.18, 0.18);
        if (S.at) {
          const q = rr / 2.3 * S.r; x = cen.x + Math.cos(aa) * q; z = cen.z + Math.sin(aa) * q; y = cen.y - 0.25 * q * q / (S.r * S.r) - 0.05;
          ax += S.o[0] * 0.3 + Math.cos(aa) * 0.12 * q; az += S.o[1] * 0.3 + Math.sin(aa) * 0.12 * q;
        } else if (S.F) {
          x = cen.x + Math.cos(aa) * rr; z = cen.z + Math.sin(aa) * rr; const [m, phi] = local(S.F, x, z), rho = m / S.F.E(phi);
          if (rho > 0.9 || Math.cos(phi) < -0.3) continue; y = S.F.yc + S.F.hTop(rho, phi) - 0.06;
          const d = Math.hypot(x, z) || 1; if (d < TR(Math.atan2(z, x), Math.min(y, 46)) + 0.2 && y < 46) continue;
          ax += S.F.o[0] * Math.cos(phi) * 0.2; az += S.F.o[1] * Math.cos(phi) * 0.2;
        } else if (S.wall) {
          y = S.y + Math.sin(aa) * rr * 0.8; const R0 = TR(S.th, y), th = S.th + Math.cos(aa) * rr / R0, R = TR(th, y);
          x = Math.cos(th) * (R - 0.08); z = Math.sin(th) * (R - 0.08); if (y < 0.5 || inFlange(x, y + 0.5, z, 2.4)) continue;
          ax += Math.cos(th) * 0.6; az += Math.sin(th) * 0.6;
        } else {
          x = cen.x + Math.cos(aa) * rr; z = cen.z + Math.sin(aa) * rr; const d = Math.hypot(x, z), th = Math.atan2(z, x);
          if (d > 13.4 || d < TR(th, 0.6) - 0.3) continue; y = 0.15 + Math.max(0, 1.2 - (d - 9) * 0.4); ax += Math.cos(th) * 0.15; az += Math.sin(th) * 0.15;
        }
        const l = H / Math.hypot(ax, ay, az);
        wb.push(x, y, z); wa.push(ax * l, ay * l, az * l); wi.push(sd, si, 0); n++;
      }
      wormThickets.push({ center: cen.clone(), radius: 2.6, count: n, inside: false, pass: !!S.pass });
      if (si % 6 === 5) await ctx.yield();
    }
    // template: a 6-sided, tapering tube in three lengths (y 0..1, scaled by the instance; the shader bows it) and the plume:
    // two crossed quads (y 1..1.32, half-width 0.125) that the fragment shader cuts to a serrated feather. uv.x = 1 on the
    // plume, uv.y = across the blade (-1..1)
    const tp = [], tn = [], tu = [], tix = [], NS = 6;
    const rings = [[0, 0.066], [0.34, 0.060], [0.67, 0.054], [1, 0.049]];
    rings.forEach(([y, r], ri) => { for (let q = 0; q < NS; q++) { const a = q / NS * 6.283 + ri * 0.2, c = Math.cos(a), s = Math.sin(a); tp.push(c * r, y, s * r); tn.push(c, 0, s); tu.push(0, 0); } });
    for (let r0 = 0; r0 < rings.length - 1; r0++) for (let q = 0; q < NS; q++) { const a = r0 * NS + q, b = r0 * NS + (q + 1) % NS, c = a + NS, d = b + NS; tix.push(a, c, b, b, c, d); }
    for (const [bx, bz] of [[1, 0], [0, 1]]) {
      const b = tp.length / 3;
      for (const [sx, y] of [[-1, 1.0], [1, 1.0], [-1, 1.32], [1, 1.32]]) { tp.push(bx * sx * 0.125, y, bz * sx * 0.125); tn.push(bz, 0, bx); tu.push(1, sx); }
      tix.push(b, b + 2, b + 1, b + 1, b + 2, b + 3);
    }
    const g = new THREE.InstancedBufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(tp, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(tn, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(tu, 2)); g.setIndex(tix);
    g.setAttribute('aBase', new THREE.InstancedBufferAttribute(new Float32Array(wb), 3)); g.setAttribute('aAxis', new THREE.InstancedBufferAttribute(new Float32Array(wa), 3)); g.setAttribute('aInfo', new THREE.InstancedBufferAttribute(new Float32Array(wi), 3));
    g.instanceCount = wb.length / 3; g.boundingSphere = new THREE.Sphere(V3(0, 26, 0), 36);
    const worms = new THREE.Mesh(g, mkMat(WORM_V, WORM_F, { ...wormU, uWhite: minU.uWhite }, { side: THREE.DoubleSide })); worms.name = 'tubeworms'; worms.frustumCulled = false; object.add(worms);
    // the same worms again, upside down in each pass shelf's sheet (same thicket uniforms: they shut and open with the real ones)
    for (const set of mirrorSets) {
      const mb = [], ma = [], mi = [];
      for (let k = 0; k < wb.length; k += 3) if (underShelf(set.F, wb[k], wb[k + 1], wb[k + 2], 9.5, 2.5)) { mb.push(wb[k], wb[k + 1], wb[k + 2]); ma.push(wa[k], wa[k + 1], wa[k + 2]); mi.push(wi[k], wi[k + 1], wi[k + 2]); }
      if (!mb.length) continue;
      const gm = new THREE.InstancedBufferGeometry();
      for (const k of ['position', 'normal', 'uv']) gm.setAttribute(k, g.getAttribute(k)); gm.setIndex(g.index);
      gm.setAttribute('aBase', new THREE.InstancedBufferAttribute(new Float32Array(mb), 3)); gm.setAttribute('aAxis', new THREE.InstancedBufferAttribute(new Float32Array(ma), 3)); gm.setAttribute('aInfo', new THREE.InstancedBufferAttribute(new Float32Array(mi), 3));
      gm.instanceCount = mb.length / 3;
      const mm = new THREE.Mesh(gm, mkMat(WORM_V, WORM_F, { ...wormU, uWhite: minU.uWhite, ...set.U }, { side: THREE.DoubleSide, defines: { MIRROR: 1 } })); mm.name = 'mirror-worms-' + set.F.name; mm.frustumCulled = false; object.add(mm); set.meshes.push(mm);
    }
    await ctx.yield();
  }

  // ---------- anchors ----------
  const F3 = flanges[2], F6 = flanges[5];
  const flyThrough = [V3(-88, 15, 4), V3(-44, 13.5, 2), V3(-28, 9.5, 6), bearing(30, 15, 7.5), bearing(75, 13, 8.5), bearing(125, 13, 12.5), bearing(195, 12.5, 18.2),
    bearing(235, 13, 19.5), bearing(290, 20, 12), bearing(343, 26.4, 6), seat.clone()];
  const anchors = {
    portalSeat: { position: seat.clone(), normal: seatN.clone(), radius: 3.75 },
    flyThrough,
    heroPool: V3(F3.center.x, F3.yc, F3.center.z), heroView: bearing(205, 12.6, 18.6), heroGaze: V3(F3.center.x * 0.9, F3.yc - 0.4, F3.center.z * 0.9),
    greatPool: V3(F6.center.x, F6.yc, F6.center.z),
    throats: throats.map((t) => t.position.clone()),
    smokeBase: V3(0, 67, 0), smokeTop: V3(Math.tan(lean) * 96, smokeTop, 0), lander: V3(-46, 11.5, -3),
  };

  // ---------- per-frame ----------
  const _eye = V3(), _r = V3(), _u = V3(), _f = V3(), _mid = V3(), _inv = new THREE.Matrix4(), wormReach = opts.wormReach ?? 5;
  let landI = lamps.uLandI.value;
  const hero = {
    object, radius: 19, height: 55, center: V3(0, 27, 0), anchors, ground: true, groundY: 0,
    lamps, flanges, wormThickets, mineral, lean, smokeTop,
    passThickets: wormThickets.filter((T) => T.pass).map((T) => T.center.clone()),      // feet of the world's own thickets, in the order given
    // more rock for a pass shelf's mirror: a geometry (position, normal, aMat, in the hero's space) that stands under shelf fi
    // (0 F1, 1 F2, 2 F3); it is drawn reflected in that shelf's sheet with the rock's own shader. Call it in build().
    mirrorRock(geometry, fi) { const set = mirrorSets[fi]; if (!set) return null; const m = new THREE.Mesh(geometry, set.rockM); m.name = 'mirror-rock-extra-' + set.F.name; m.frustumCulled = false; object.add(m); set.meshes.push(m); return m; },
    trunkRadius: (theta, y) => TR(theta, clamp(y, 0, 46)),
    setLander(pos, dirA, dirB, intensity) {
      if (pos) { lamps.uLandPos.value[0].copy(pos); lamps.uLandPos.value[1].copy(pos); }
      if (dirA) lamps.uLandDir.value[0].copy(dirA).normalize(); if (dirB) lamps.uLandDir.value[1].copy(dirB).normalize();
      if (intensity !== undefined) landI = intensity;
    },
    setSurvey(v) { lamps.uSurvey.value = v; },
    setLampIntensity(v) { lamps.uLampI.value = v; },
    setRing(pos, normal, radius, hex, intensity = 1.6) {
      if (pos) ringU.uRingPos.value.copy(pos); if (normal) ringU.uRingN.value.copy(normal).normalize(); if (radius) ringU.uRingR.value = radius;
      ringU.uRingCol.value.set(hex ?? pal[6]).multiplyScalar(intensity);
    },
    setCurrent(l) { uLeanT.value = Math.tan(l); },
    setSmokeRim(v) { uSmokeRim.value = v; },
    setFieldRim(v) { uFieldRim.value = v; },
    setTowerLight(v) { uTower.value = v; },
    update(dt, time, camera) {
      uTime.value = time;
      const e = camera.matrixWorld.elements;
      _eye.set(e[12], e[13], e[14]); _r.set(e[0], e[1], e[2]).normalize(); _u.set(e[4], e[5], e[6]).normalize(); _f.set(-e[8], -e[9], -e[10]).normalize();
      lamps.uLampPos.value[0].copy(_eye).addScaledVector(_r, -0.9).addScaledVector(_u, -0.25);
      lamps.uLampPos.value[1].copy(_eye).addScaledVector(_r, 0.9).addScaledVector(_u, -0.25);
      lamps.uLampDir.value.copy(_f);
      lamps.uLandI.value = landI * (1 + 0.08 * Math.sin(time * 0.7) * Math.sin(time * 0.23 + 1.0));
      // a pass shelf's reflected scene is drawn only while the eye is under the level of its sheet and near enough to see into it
      // a pass shelf's mirror set is drawn only while the eye is under its sheet, within 12.5 m of it in height and within
      // reach; never more than two sets at once: the lowest is let go once the highest comes into reach (it is astern by then)
      let shown = 0;
      for (let i = mirrorSets.length - 1; i >= 0; i--) {
        const set = mirrorSets[i], F = set.F;
        const show = shown < 2 && _eye.y < F.yc - 0.1 && _eye.y > F.yc - 12.5 && Math.hypot(_eye.x - F.center.x, _eye.z - F.center.z) < F.Lr + F.Lw + 9;
        if (show) shown++;
        for (const m of set.meshes) m.visible = show;
      }
      // the worm wave: a thicket shuts when the lamps come within 5 m of it and reopens behind us
      _mid.copy(_eye).addScaledVector(_f, 0.5).applyMatrix4(_inv.copy(object.matrixWorld).invert());
      for (let i = 0; i < wormThickets.length; i++) {
        const T = wormThickets[i], inside = T.center.distanceTo(_mid) < T.radius + wormReach;
        if (inside && !T.inside) { thA[i].set(_mid.x, _mid.y, _mid.z, time); }
        else if (!inside && T.inside) { thB[i] = time; }
        T.inside = inside;
      }
    },
    dispose() {},
  };

  // ---------- viewer aid (src/worlds/_part.js only): ?hv=out|f3|great|trunk|foot|crown reframes the orbit ----------
  let hv = opts.view;
  try { const q = new URLSearchParams(globalThis.location?.search || ''); if (q.get('world') === '_part') hv = hv || q.get('hv') || 'out'; } catch (e) { /* no DOM */ }
  if (hv === 'f3') { hero.radius = 0.4; hero.height = -15; hero.center = V3(F3.center.x * 1.1, F3.yc - 0.5, F3.center.z * 1.1); hero.ground = false; lamps.uSurvey.value = opts.survey ?? 0; }
  else if (hv === 'great') { hero.radius = 2.5; hero.height = -22; hero.center = V3(F6.center.x, F6.yc - 1, F6.center.z); hero.ground = false; lamps.uSurvey.value = opts.survey ?? 0; }
  else if (hv === 'trunk') { hero.radius = 1.0; hero.height = 6; hero.center = V3(0, 11, 0); lamps.uSurvey.value = opts.survey ?? 0; }
  else if (hv === 'foot') { hero.radius = 3.5; hero.height = 14; hero.center = V3(0, 5, 0); lamps.uSurvey.value = opts.survey ?? 0; }
  else if (hv === 'crown') { hero.radius = 8; hero.height = 20; hero.center = V3(0, 50, 0); hero.ground = false; }
  else if (hv === 'smoke') { hero.radius = 40; hero.height = 150; hero.center = V3(10, 85, 0); }
  return hero;
}
