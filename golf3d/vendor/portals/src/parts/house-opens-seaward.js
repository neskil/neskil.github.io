// HERO SET PIECE for "house-opens-seaward": THE OPENING WAVE.
//
// What it is
//   The whole long Malay timber house (four times life size) as one hinged machine: the hall shell (boards,
//   posts, tie beams, king posts, rafters, singgora-tiled roof, plank walls with pierced bands, gable with a
//   gilt sunburst, three carved cross screens, pierced end wall, stilts, the seaward verandah) and, hung on
//   it, every leaf that opens: 2 front door leaves, 12 folding-door leaves in the screens, 12 folding-wall
//   leaves, the shutters of 22 wall openings (paired, top-hung, split, pivoting vanes, drop flaps: no two
//   bays alike), 8 roof flaps, the falling end-wall panel and about 200 small vents. All leaves are ONE
//   InstancedMesh turned about their hinges in the vertex shader by one travelling phase (uWaveZ).
//   The light is part of the piece: one analytic GLSL chunk (no three.js lights) traces each shaded point
//   toward the sun through the wall openings, roof flaps and door, multiplied by the same carving function
//   the leaves are pierced by, so shut bays are constellations of sun coins and an opening leaf slides a
//   slab of white light across the boards. Slanting shafts of dusty light stand in every open opening.
//
// Coordinates (hero-local = the brief's own): the hall is x -32..32, z 0..-480, floor y = 16, wall plate
//   y = 52, ridge y = 76; sand is y = 0. Origin = centre of the front threshold on the sand, +Y up, the
//   front (door, gable sunburst) faces +Z, the camera travels toward -Z, the sea side is +X.
//   Place hero.object at the world origin with no rotation or scale (the light is computed in hero-local
//   space from the vertex positions, so it survives a translation, but then pass the same offset to your own
//   materials' positions).
//
// opts
//   palette   [chengal dark, chengal mid, cream, jade, leaf green, songket gold, magenta] (brief default)
//   look      'afternoon' (default) | 'morning' (silver, sun 16 deg, strong shafts) | 'copper' (sun 12 deg)
//   rare      true: setProgress() plays the lull (u 0.71-0.78): the wind drops, the newest leaves swing half shut
//   shafts    0..1 strength of the dusty light shafts (default by look)
//   verandah  true   build the seaward verandah (z -160..-320)       stilts  true   posts under the floor
//
// anchors (hero-local)
//   portalSeat    { position (0,24.5,-556), normal (0,0,1), radius 13, color }   the portal on its dune beyond the end wall,
//                 raised and enlarged so that from the hall axis it sits dead centre in the moon gate of the end panel
//   moonGate      { center (0,23.95,-480), radius 9.4 }   the round opening in the falling end panel
//   flyThrough    ordered points of the brief's journey (>= 6 m clear of everything when the leaves ahead are open)
//   door          { z 0, width 22, height 28, floorY 16 }      screens  [-120,-320,-400] with doorway 22 x 28
//   foldingWalls  [{ bay 5, z0, z1 }, { bay 8, ... }] openings in the right wall; the camera leaves by the first and comes
//                 back in under the propped-up panels of bay 7 (top-hung, pushed out to 75 degrees), so that it is on the axis before the screen at z = -320
//   bays          [{ k, zc, left:{type}, right:{type} }]    bayCenter(k) = (0,16,-40k+20)
//   roofFlaps     centres of the 8 flaps (bays 4 and 10)       cageHooks  5 points under the tie beams of bay 4
//   cradle        (14,21,-190)    verandah { x0 32, x1 64, y 15, z0 -160, z1 -320 }   rampTip (0,6,-508)
//   viewpoints    a few camera positions with look-at targets
//
// Extra API on the returned object
//   setProgress(u, camZ)  the whole schedule, keyed to the camera's z (if you do not pass it, the brief's own table of
//                         z against u is used): wave front 44 m ahead of the camera (72 m as it comes up to the first
//                         screen), door z 69..42, first screen as the front reaches it, the two inner screens at camera
//                         z -250..-278 (the turn back in from the verandah), end wall z -405..-447, the rare lull z -357..-408.
//                         Call it every frame, with u = 0 while seen through the previous portal (house shut).
//   setWaveZ(z), setChannel(i, s), setCalm(c)   the raw controls, if the world wants its own timing.
//                         channels: 0 door, 1..3 screens, 4 end wall; s = 0 shut, 1 swung, > 1 rattling, 4 at rest.
//   openAt(z) / bayOpen(k, side)   CPU copies of the opening amount (0..1) for keying cloth, cages, dust.
//   light = { uniforms, glsl }      the shared light: add light.uniforms to your ShaderMaterial and paste
//                         light.glsl into its fragment shader, then  col = hosShade(albedo, P, N, V)  with P, N
//                         in hero-local space. Furniture, cloth and creatures lit this way sit in the same
//                         slabs, coins, amber bounce and jade ripple as the house.
//   woodMaterial()        a new material with the hero's wood shader for the world's own merged geometry
//                         (attributes position, normal, color, aUV (metres, u along the grain), aMat (kind, pattern, scale, seed)).
//
// Size and cost: radius 250, height 80. About 51k triangles, 8 draw calls (5 shell chunks, leaves, louvred leaves,
//   shafts), one program each for shell, leaves and shafts, no lights, no textures, ~220 ms build.
// Lighting it expects: none from the scene (its materials ignore three.js lights). Give it a bright sky and
//   sea behind the holes (HDR 1-3) and a dark-to-warm fog; all materials honour scene fog.
import * as THREE from 'three';

const DEFAULT_PALETTE = ['#24160E', '#6E4424', '#F3E9D2', '#2FA58A', '#3E7B3C', '#D8A12C', '#B5245C'];

// ---- the brief's dimensions
const HW = 32, FLOOR = 16, PLATE = 52, RIDGE = 76, LEN = 480, BAY = 40, NB = 12;
const OPW = 20, OPH = 28, OPTOP = FLOOR + OPH;          // wall openings 20 x 28 (y 16..44)
const SCREENS = [-120, -320, -400];
const FOLD_BAYS = [5, 8];                                // right wall: folding walls 30 m wide
const FLAP_BAYS = [4, 10];                               // left roof slope: four flaps each
const SLOPE = Math.hypot(HW, RIDGE - PLATE);             // 40 m of roof slope
const GATE_Y = 23.95, GATE_R = 9.4;                       // the moon gate in the falling end panel (centre height, radius)
const PORTAL = [0, 24.5, -556, 13];                      // the portal the gate frames: x, y, z, radius
const SWING = 22;                                        // metres of wave travel for one swing (0.9 s at 25 m/s)
// carving / surface pattern ids (must match pierce() in the GLSL)
const PAT = { vine: 0, star: 1, hibiscus: 2, louvre: 3, diamond: 4, slat: 5, sunburst: 6, lozenge: 7, gate: 8 };
// surface kinds (aMat.x)
const KIND = { timber: 0, boards: 1, pierced: 2, relief: 3, tiles: 4, gilt: 5, paint: 6, iron: 7 };

const v3 = (x, y, z) => new THREE.Vector3(x, y, z);
const sm = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

// ---- geometry accumulator: position, normal, colour, aUV (metres), aMat (kind, pattern, scale, seed)
class Acc {
  constructor() { this.p = []; this.n = []; this.c = []; this.uv = []; this.m = []; this.count = 0; }
  // one quad a,b,c,d (counter-clockwise seen from the normal side); uvs as [u,v] pairs
  quad(a, b, c, d, n, col, ua, ub, uc, ud, mat) {
    const P = this.p, N = this.n, C = this.c, U = this.uv, M = this.m;
    const vs = [a, b, c, a, c, d], us = [ua, ub, uc, ua, uc, ud];
    for (let i = 0; i < 6; i++) {
      P.push(vs[i][0], vs[i][1], vs[i][2]); N.push(n[0], n[1], n[2]);
      const cc = Array.isArray(col[0]) ? col[i === 0 || i === 3 ? 0 : i === 1 ? 1 : i === 2 || i === 4 ? 2 : 3] : col;
      C.push(cc[0], cc[1], cc[2]); U.push(us[i][0], us[i][1]); M.push(mat[0], mat[1], mat[2], mat[3]);
    }
    this.count += 2;
  }
  // flat panel: origin corner o, in-plane unit vectors U, V, size w x h; uv = uv0 + (s, t) in metres.
  // Single-sided geometry, drawn double-sided by the material (the shader flips the normal).
  panel(o, U, V, w, h, col, mat, uv0 = [0, 0]) {
    const a = o, b = [o[0] + U[0] * w, o[1] + U[1] * w, o[2] + U[2] * w];
    const c = [b[0] + V[0] * h, b[1] + V[1] * h, b[2] + V[2] * h], d = [o[0] + V[0] * h, o[1] + V[1] * h, o[2] + V[2] * h];
    const n = [U[1] * V[2] - U[2] * V[1], U[2] * V[0] - U[0] * V[2], U[0] * V[1] - U[1] * V[0]];
    this.quad(a, b, c, d, n, col, uv0, [uv0[0] + w, uv0[1]], [uv0[0] + w, uv0[1] + h], [uv0[0], uv0[1] + h], mat);
  }
  // a chamfered timber from a to b: cross-section w (along side) x h (along up), chamfer ch (0 = square).
  // u runs along the grain, v round the section. Ends are capped unless caps === false.
  beam(a, b, w, h, up, col, mat, ch = 0.12, caps = true) {
    const ax = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], len = Math.hypot(ax[0], ax[1], ax[2]) || 1;
    ax[0] /= len; ax[1] /= len; ax[2] /= len;
    let sx = ax[1] * up[2] - ax[2] * up[1], sy = ax[2] * up[0] - ax[0] * up[2], sz = ax[0] * up[1] - ax[1] * up[0];
    const sl = Math.hypot(sx, sy, sz) || 1; sx /= sl; sy /= sl; sz /= sl;
    const ux = sy * ax[2] - sz * ax[1], uy = sz * ax[0] - sx * ax[2], uz = sx * ax[1] - sy * ax[0];   // true up = side x axis
    const hw = w / 2, hh = h / 2, c = Math.min(ch, hw * 0.45, hh * 0.45);
    const ring = c > 0
      ? [[-hw + c, -hh], [hw - c, -hh], [hw, -hh + c], [hw, hh - c], [hw - c, hh], [-hw + c, hh], [-hw, hh - c], [-hw, -hh + c]]
      : [[-hw, -hh], [hw, -hh], [hw, hh], [-hw, hh]];
    const pt = (q, e) => { const o = e ? b : a; return [o[0] + sx * q[0] + ux * q[1], o[1] + sy * q[0] + uy * q[1], o[2] + sz * q[0] + uz * q[1]]; };
    let per = 0; const nr = ring.length;
    for (let i = 0; i < nr; i++) {
      const q0 = ring[i], q1 = ring[(i + 1) % nr], dx = q1[0] - q0[0], dy = q1[1] - q0[1], dl = Math.hypot(dx, dy) || 1;
      const nx = dy / dl, ny = -dx / dl;                 // outward normal in section space (ring is counter-clockwise seen from +axis... flipped below)
      const n = [sx * nx + ux * ny, sy * nx + uy * ny, sz * nx + uz * ny];
      this.quad(pt(q0, 0), pt(q0, 1), pt(q1, 1), pt(q1, 0), n, col, [0, per], [len, per], [len, per + dl], [0, per + dl], mat);
      per += dl;
    }
    if (caps) for (let e = 0; e < 2; e++) {
      const n = e ? ax : [-ax[0], -ax[1], -ax[2]], em = [mat[0], mat[1], mat[2], mat[3] + 7.3];
      for (let i = 1; i + 1 < nr; i += 2) {
        const q = [ring[0], ring[i], ring[i + 1], ring[(i + 2) % nr]];
        const pp = q.map((r) => pt(r, e)), uu = q.map((r) => [r[0] + 40, r[1] + 40]);
        if (!e) this.quad(pp[0], pp[1], pp[2], pp[3], n, col, uu[0], uu[1], uu[2], uu[3], em);
        else this.quad(pp[3], pp[2], pp[1], pp[0], n, col, uu[3], uu[2], uu[1], uu[0], em);
      }
    }
  }
  geometry() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(this.n, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(this.c, 3));
    g.setAttribute('aUV', new THREE.Float32BufferAttribute(this.uv, 2));
    g.setAttribute('aMat', new THREE.Float32BufferAttribute(this.m, 4));
    g.computeBoundingSphere(); g.computeBoundingBox();
    return g;
  }
}

// =====================================================================================================
// GLSL, part 1: hashes, the carving function pierce() and the analytic light. Shared by every material
// of the piece and handed to the world as hero.light.glsl.
// =====================================================================================================
const GLSL_LIGHT = /* glsl */`
#define GATE_UV_Y ${(GATE_Y - FLOOR).toFixed(2)}
#define GATE_RR ${GATE_R.toFixed(2)}
uniform vec3 uSun;          // unit vector toward the sun (x < 0, y > 0, z > 0)
uniform vec3 uSunCol;       // sun colour x intensity inside the hall
uniform vec3 uOutSun;       // sun colour x intensity on outside surfaces
uniform vec3 uAmbDark;      // what a shut bay has
uniform vec3 uBounce;       // amber bounce off a lit floor
uniform vec3 uJade;         // light off the sea through the right wall
uniform vec3 uSkyIn;        // sky light through the left openings
uniform vec3 uOutAmb;       // shade outside (verandah, right wall, under the eaves)
uniform vec3 uUnder;        // under the house
uniform vec4 uBayL[13];     // per bay, left wall: pattern, reveal mode, seed, open (index 0 = the front door)
uniform float uOpenR[13];   // per bay, right wall: open
uniform float uOpenRoof[13];// per bay, roof flaps: open (only the flap bays ever rise)
uniform vec4 uHos;          // time, sheen, door open, end wall open
uniform vec4 uGate;         // the portal beyond the end wall: centre y, z, radius; w = radius of the moon gate that frames it
uniform vec3 uPortalCol;    // the portal's light (colour x strength)
uniform vec4 uScr;          // xyz: how far the three cross screens have folded (0..1): what stands between a board and the gate; w: bounce filling the boards of an opened bay
uniform vec4 uLook2;        // sun kept on upright timber indoors, bounce reaching the roof, jade reaching the roof, daylight through the gate
float hosWallK = 1.;         // set to uLook2.x by the timber shaders: only the boards take the full sun
float hosSoft = 0.;          // 1 = replace the carving by its average opening (the shafts use this)
float hosExtT = 1.;          // the world's own shadow term (set before hosShade)
float hosHash(vec2 p){ vec3 q = fract(vec3(p.xyx) * .1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
float hosNoise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(hosHash(i), hosHash(i + vec2(1., 0.)), f.x), mix(hosHash(i + vec2(0., 1.)), hosHash(i + vec2(1., 1.)), f.x), f.y); }
float hosAtan(float y, float x){ return atan(y, (abs(x) < 1e-5 && abs(y) < 1e-5) ? 1e-5 : x); }
// Carving. q in metres on the panel; returns a signed size in metres, > 0 inside a hole.
float pierce(vec2 q, float type, float seed){
  float h;
  if (type < .5) {                       // vine scroll: warped leaf-shaped cuts
    vec2 a = q * 1.57 + seed;
    vec2 w = a + .95 * vec2(sin(a.y * 1. + seed), sin(a.x * 1. - seed * 1.7));
    float f = cos(w.x) * cos(w.y);
    h = (abs(f) - .68) * .7;
    h = max(h, .16 - length(fract(a / 3.1416 + .5) - .5) * 2.);     // a bud where four leaves meet
  } else if (type < 1.5) {               // eight-pointed stars and dots
    vec2 c = (fract(q / 3.2) - .5) * 3.2;
    float th = hosAtan(c.y, c.x), r = length(c);
    h = .62 + .3 * cos(8. * th) - r;
    vec2 d = abs(c) - 1.6; h = max(h, .3 - length(d));
  } else if (type < 2.5) {               // hibiscus rosettes, rows staggered
    vec2 g = q / 4.4; g.x += .5 * floor(g.y);
    vec2 c = (fract(g) - .5) * 4.4;
    float th = hosAtan(c.y, c.x), r = length(c);
    h = min(.5 + .95 * abs(cos(2.5 * th + seed)) - r, r - .34);
    vec2 d = abs(c) - 2.2; h = max(h, .26 - length(d));
  } else if (type < 3.5) {               // louvre: horizontal slits
    h = .27 - abs(fract(q.y / 1.5) - .5) * 1.5;
    h = min(h, abs(fract(q.x / 10. ) - .5) * 10. - .45);
  } else if (type < 4.5) {               // diamond lattice
    float d1 = abs(fract((q.x + q.y) / 2.6) - .5) * 2.6, d2 = abs(fract((q.x - q.y) / 2.6) - .5) * 2.6;
    h = (min(d1, d2) - .62) * .7;
  } else if (type < 5.5) {               // slatted grille: tall slots between rails
    h = .3 - abs(fract(q.x / 2.6) - .5) * 2.6;
    h = min(h, abs(fract(q.y / 7.) - .5) * 7. - .5);
  } else if (type < 6.5) {               // sunburst: rays from the foot of the doorway
    vec2 c = vec2(mod(q.x, 22.) - 11., q.y + .5);
    float th = hosAtan(c.y, c.x), r = length(c);
    h = min((cos(th * 18.) - .42) * r * .055, abs(fract(r / 6.5) - .5) * 6.5 - .5);
    h = min(h, r - 3.2);
  } else if (type > 7.5) {               // the end panel: diamond lattice with a solid collar where the moon gate is cut
    float d1 = abs(fract((q.x + q.y) / 2.6) - .5) * 2.6, d2 = abs(fract((q.x - q.y) / 2.6) - .5) * 2.6;
    h = (min(d1, d2) - .62) * .7;
    h = min(h, length(q - vec2(15., GATE_UV_Y)) - (GATE_RR + 1.));
  } else {                               // lozenge rows
    vec2 g = q / vec2(2.3, 3.6); g.x += .5 * floor(g.y);
    vec2 c = (fract(g) - .5) * vec2(2.3, 3.6);
    h = (1. - abs(c.x) / .72 - abs(c.y) / 1.25) * .5;
  }
  return h;
}
float hosRoofY(float x){ return 52. + 24. * (1. - min(abs(x) / 32., 1.4)); }
// How much of an opening its leaves have uncovered: q in opening coords (0..20, 0..28), o = open 0..1.
float hosReveal(vec2 q, float mode, float o){
  float d;
  if (mode < .5) d = o * 10.4 - abs(q.x - 10.);                               // paired leaves part in the middle
  else if (mode < 1.5) d = o * 29. - q.y;                                      // top-hung: daylight climbs from the sill
  else if (mode < 2.5) d = q.y < 10. ? o * 10.6 - (10. - q.y) : o * 18.6 - (q.y - 10.);   // split: flap drops, leaf lifts
  else if (mode < 3.5) d = abs(fract(q.x / 4.) - .5) * 4. - (1. - o) * 2.1;    // vanes pivot together
  else d = q.y < 14. ? o * 14.6 - (14. - q.y) : -1.;                             // drop flaps under a fixed grille
  return smoothstep(-.5, .5, d) * step(.004, o);
}
// transmission of the left wall at a point of its plane
float hosWallT(vec3 q){
  float kf = floor(-q.z / 40.);
  if (q.z > 0. || kf > 11.5 || q.y < 16. || q.y > 51.6) return 0.;
  vec4 B = uBayL[int(kf) + 1];
  vec2 o = vec2(-40. * kf - 10. - q.z, q.y - 16.);
  float hole = mix(smoothstep(-.12, .14, pierce(o, B.x, B.z)), .16, hosSoft);
  if (q.y > 44.6) return hole * step(abs(o.x - 10.), 17.6) * smoothstep(0., .4, min(q.y - 44.6, 51.6 - q.y));
  if (q.y > 44.) return 0.;
  float inside = smoothstep(0., .5, min(min(o.x, 20. - o.x), min(o.y + .3, 28. - o.y)));
  return inside * max(hosReveal(o, B.y, B.w), hole);
}
// transmission of the left roof slope: flaps in the flap bays, a few slipped tiles elsewhere
float hosRoofT(vec3 q){
  float kf = floor(-q.z / 40.);
  if (q.z > 0. || kf > 11.5) return 0.;
  float s = (q.x + 32.) * 1.25;                           // metres up the slope, 0..40
  float zl = -40. * kf - q.z;                             // 0..40 along the bay
  float open = uOpenRoof[int(kf) + 1];
  float has = step(-.5, open); open = max(open, 0.);     // -1 = this bay has no flaps
  vec2 l = vec2(zl - 20., s - 19.);
  l -= vec2(9., 8.) * sign(l);                            // four flaps 12 m square, centres +-9 and +-8; l = flap-local
  float inside = smoothstep(0., .5, 6. - max(abs(l.x), abs(l.y)));
  vec2 f = vec2(zl, s);
  float star = mix(smoothstep(-.1, .12, pierce(l + 1.6, 1., 3.)), .12, hosSoft);
  float flap = has * inside * max(smoothstep(-.5, .5, open * 12.8 - (l.y + 6.)) * step(.004, open), star);
  vec2 tc = f / vec2(1.6, 1.9);
  float leak = step(.972, hosHash(floor(tc) + kf * 7.)) * (1. - smoothstep(.12, .26, length((fract(tc) - .5) * vec2(1.6, 1.9))));
  return max(flap, leak * (1. - hosSoft));
}
// palm fronds tossing between the sun and whatever they shade: a moving dapple
float hosPalm(vec2 q){
  float n = hosNoise(vec2(q.x * .075 + uHos.x * .55, q.y * .12 - uHos.x * .21)) * .65 + hosNoise(vec2(q.x * .31 - uHos.x * .9, q.y * .22)) * .35;
  return 1. - .5 * smoothstep(.5, .66, n);
}
// the net shed in front (slatted floor at y = 16, z 92..170): sun stripes between the slats, running along the lane
float hosShed(vec3 P){
  if (P.y > 15.9) return 1.;
  float t = (16. - P.y) / max(uSun.y, .05); vec3 q = P + uSun * t;
  float in_ = smoothstep(0., 1.5, min(min(q.x + 29., 29. - q.x), min(q.z - 91., 171. - q.z)));
  float w = .03 + t * .0035;
  float stripe = smoothstep(.3 - w, .3 + w, abs(fract(q.x / 3.) - .5));
  stripe = max(stripe, .5 * smoothstep(.47, .5, abs(fract(q.z / 19.5 + .2) - .5)));     // a gap between two runs of slats
  return 1. - in_ * (1. - stripe) * .95;
}
// Sun reaching a point (0..1). P is hero-local and already pushed a little off its surface.
float hosSunT(vec3 P){
  float roofY = hosRoofY(P.x);
  if (P.y < 15.6 && abs(P.x) < 33. && P.z < 1. && P.z > -481.) return 0.;            // under the house
  if (P.z < -480.3) {                                                                 // beyond the end wall: the house's shadow
    float t = (-480. - P.z) / max(uSun.z, .05); vec3 q = P + uSun * t;
    return smoothstep(-1., 1.5, max(abs(q.x) - 32., q.y - hosRoofY(q.x)));
  }
  if (P.y > roofY + .25 && abs(P.x) < 34.) return 1.;                                 // on the roof
  if (P.z > .3) return hosShed(P);                                                    // the front, the stair, the net shed
  if (P.x > 32.3) {                                                                   // the seaward side: the house's own shadow
    float sx = max(-uSun.x, .05); vec3 q = P + uSun * ((P.x - 32.) / sx), q0 = P + uSun * (P.x / sx);
    float clear = min(q.y - 52., q0.y - 76.);
    float zin = smoothstep(-2., 2., min(-q.z, q.z + 480.));
    return 1. - zin * (1. - smoothstep(-1., 2.5, clear));
  }
  if (P.x < -32.3) return P.y < 30. ? hosPalm(vec2(P.z + P.x * .5, P.x * .7 + P.y)) : 1.;   // the sunny wall and the sand under the grove
  float tW = (P.x + 32.) / max(-uSun.x, .05), tF = -P.z / max(uSun.z, .05);
  if (tF < tW) {                                                                      // out through the front: the door
    vec3 q = P + uSun * tF; vec2 o = vec2(q.x + 11., q.y - 16.);
    if (abs(q.x) > 11. || o.y < 0. || o.y > 28.) return 0.;
    float hole = mix(smoothstep(-.12, .14, pierce(o, 6., 1.)), .16, hosSoft);
    float rev = smoothstep(-.5, .5, uHos.z * 11.5 - abs(q.x)) * step(.004, uHos.z);
    return max(rev, hole) * smoothstep(0., .5, min(11. - abs(q.x), 28. - o.y));
  }
  vec3 q = P + uSun * tW;
  if (q.y < 52.) return hosWallT(q) * hosPalm(q.zy);
  float tR = (.6 * (P.x + 32.) - .8 * (P.y - 52.)) / max(dot(vec3(-.6, .8, 0.), uSun), .05);
  q = P + uSun * tR;
  if (q.x > 0.) return 0.;
  return hosRoofT(q);
}
// The whole light. alb = albedo, P, N = hero-local position and facing normal, V = unit vector to the eye.
vec3 hosShade(vec3 alb, vec3 P, vec3 N, vec3 V, float gloss){
  vec3 Ps = P + N * .45;
  vec3 fp = fwidth(P); hosSoft = max(hosSoft, smoothstep(.7, 2.4, length(fp)));   // far away the carving becomes its average
  float inside = step(15.6, Ps.y) * step(abs(Ps.x), 32.3) * step(Ps.z, .3) * step(-480.3, Ps.z) * step(Ps.y, hosRoofY(Ps.x) + .25);
  float under = step(Ps.y, 15.6) * step(abs(Ps.x), 33.) * step(Ps.z, 1.) * step(-481., Ps.z);
  float T = hosSunT(Ps) * hosExtT;
  T *= mix(1., mix(hosWallK, 1., smoothstep(.5, .9, N.y)), inside);                // upright timber never blooms; the slab on the boards may
  float ndl = max(dot(N, uSun), 0.);
  vec3 Hv = uSun + V; Hv /= max(length(Hv), 1e-3);
  float spec = pow(max(dot(N, Hv), 0.), 26.) * gloss;
  vec3 sunc = mix(uOutSun, uSunCol, inside);
  vec3 col = sunc * T * (alb * ndl + vec3(1., .95, .88) * (spec * .22 + inside * uHos.y * ndl * .05));
  // ambient: a shut bay is nearly black; every open leaf adds amber from the boards, sky from the left, jade from the sea
  float zf = clamp(-P.z / 40. + .5, 0., 12.), i0 = floor(min(zf, 11.999)), fr = zf - i0; fr = fr * fr * (3. - 2. * fr);
  int k0 = int(i0);
  float oL = mix(uBayL[k0].w, uBayL[k0 + 1].w, fr), oR = mix(uOpenR[k0], uOpenR[k0 + 1], fr);
  int kb = k0 > 0 ? k0 - 1 : 0;                                                     // the bay behind us (already open): its lit boards reach this bay's truss
  float oLb = mix(uBayL[kb].w, uBayL[k0].w, fr), oRb = mix(uOpenR[kb], uOpenR[k0], fr);
  float hgt = clamp((P.y - 16.) / 60., 0., 1.);
  vec3 amb = uAmbDark * (.6 + .4 * N.y);
  float up = smoothstep(.42, .8, hgt);                                              // the truss and the roof over an opened bay
  float oLu = mix(oL, max(oL, .8 * oLb), up), oRu = mix(oR, max(oR, .8 * oRb), up);
  amb += uBounce * oLu * (.6 - .4 * N.y) * mix(1. - .55 * hgt, uLook2.y, up);
  amb += uBounce * oL * uScr.w * max(N.y, 0.) * (1. - up);                          // the boards of an opened bay are never black
  amb += uSkyIn * oL * max(.1, .3 - N.x * .7 + N.y * .2) * (.55 + .45 * hgt);
  float rip = .72 + .28 * sin(P.z * .31 + P.y * .22 + uHos.x * 2.1) * sin(P.z * .12 - P.x * .17 - uHos.x * 1.4);
  float rip2 = .55 + .45 * sin(P.z * .47 + P.x * .31 + uHos.x * 2.6) * sin(P.z * .19 - P.x * .43 - uHos.x * 1.7);
  amb += uJade * oRu * max(.08 + .34 * up * step(N.y, .2), .25 + N.x * .7 - N.y * .45) * mix(rip, rip2, up) * (.45 + .55 * hgt) * (1. + uLook2.z * up);
  amb += uSkyIn * uHos.z * exp(min(P.z, 0.) / 70.) * max(.08, N.z) * .5;
  amb += uSkyIn * uHos.w * exp(min(-480. - P.z, 0.) / 60.) * max(.08, -N.z) * .8;
  // the moon gate: a pool of daylight on the boards inside it, and the portal's colour laid down the boards toward
  // the eye like a moon path (the mirror image of the ring, drawn out by the grain of the floor)
  float gz = max(P.z + 480., 0.);
  amb += uSkyIn * uLook2.w * (1. - uHos.w) * exp(-gz / 24.) * exp(-P.x * P.x / (70. + gz * 7.)) * (.35 + .65 * max(N.y, 0.));
  vec3 streak = vec3(0.);
  if (inside > .5 && N.y > .6 && V.z > .02) {
    float tp = (P.z - uGate.y) / V.z, tw = (P.z + 480.) / V.z;                      // along the mirrored view ray: to the portal, to the end wall
    vec2 hp = vec2(P.x - V.x * tp, P.y + V.y * tp - uGate.x);
    float R = uGate.z;
    float wx = exp(-hp.x * hp.x / (R * R * .45));
    float wy = smoothstep(-2.4 * R, -.7 * R, hp.y) * exp(-max(hp.y - .4 * R, 0.) / (R * 5.));
    float gate = mix(1. - smoothstep(uGate.w - 2.5, uGate.w, abs(P.x - V.x * tw)), 1., uHos.w);
    float fres = .12 + .88 * pow(1. - clamp(V.y, 0., 1.), 3.);
    float seen = mix(uScr.x, 1., step(P.z, -120.)) * mix(uScr.y, 1., step(P.z, -320.)) * mix(uScr.z, 1., step(P.z, -400.));
    streak = uPortalCol * (wx * wy * gate * fres * seen) * (.03 + alb * 2.6) * smoothstep(.6, .9, N.y);
  }
  vec3 out_ = uOutAmb * (.62 + .38 * N.y) + uOutSun * .2 * max(-N.y, 0.);
  amb = mix(mix(out_, uUnder * (.75 - .25 * N.y), under), amb, inside);
  return col + alb * amb + streak;
}
`;

// =====================================================================================================
// GLSL, part 2: the timber surface (grain, boards, pegs, pierced and relief carving, singgora tiles, gilt).
// in: uv in metres (u along the grain), mat = (kind, pattern, scale, seed), vertex colour, P, N.
// out: albedo, emission, gloss. Discards inside a pierced hole.
// =====================================================================================================
const GLSL_WOOD = /* glsl */`
uniform vec3 uGold; uniform vec3 uLeak; uniform vec3 uOil;   // uOil: oiled chengal weathers darker and warmer out of doors
void hosSurface(vec2 uv, vec4 mat, vec3 vc, vec3 P, vec3 N, float px, out vec3 alb, out vec3 emis, out float gloss){
  float kind = mat.x, seed = mat.w;
  emis = vec3(0.); gloss = .5;
  float g1 = hosNoise(vec2(uv.x * .22 + seed * 3.1, uv.y * 7. + seed));
  float g2 = hosNoise(vec2(uv.x * 1.1 - seed, uv.y * 23. + seed * 5.));
  float grain = .78 + .3 * g1 + .14 * g2;
  alb = vc * grain;
  if (kind < .5) {                                    // plain timber, a darker check line here and there
    alb *= 1. - .35 * smoothstep(.62, .7, hosNoise(vec2(uv.x * .09 + seed * 9., uv.y * 3.1 + seed * 2.)));
  } else if (kind < 1.5) {                            // boards: width mat.z across v, butt joints along u, pegs
    float bw = max(mat.z, .2), bi = floor(uv.y / bw), bf = fract(uv.y / bw);
    float hb = hosHash(vec2(bi, seed * 17. + 3.));
    float ju = uv.x / 13. + hb * 7.; float jf = fract(ju), ji = floor(ju);
    float tint = hosHash(vec2(bi * 3.7 + ji, seed + 11.));
    alb = vc * (.74 + .34 * hosNoise(vec2(uv.x * .22 + hb * 40., uv.y * 7.)) + .14 * g2) * (.72 + .5 * tint);
    alb = mix(alb, vec3(dot(alb, vec3(.4, .4, .2))), .3 * step(.7, tint));        // a weathered board now and then
    float aa = min(1., .1 / (px + .05));               // keep the seam's coverage when it is thinner than a pixel
    float seam = (1. - smoothstep(0., .04 + px * .6, min(bf, 1. - bf) * bw)) * aa;
    float joint = (1. - smoothstep(0., .04 + px * .6, min(jf, 1. - jf) * 13.)) * aa;
    float sj = max(seam, joint);
    alb *= 1. - .7 * sj;
    vec2 pg = vec2(min(jf, 1. - jf) * 13. - .45, (bf - .5) * bw); pg.y = abs(pg.y) - bw * .28;
    alb *= 1. - .6 * (1. - smoothstep(.07, .12 + px, length(pg))) * (1. - smoothstep(.04, .16, px));
    alb *= .9 + .1 * smoothstep(0., .25, min(bf, 1. - bf));                 // cupped boards: edges a little darker
    emis += uLeak * seam * step(.01, mat.y) * mat.y * smoothstep(.45, .9, hosNoise(vec2(bi * 1.7, uv.x * .21)));   // floor seams lit from the sand below
    gloss = .9;
  } else if (kind < 3.5) {                            // carving: pierced (2) or relief (3)
    float h = pierce(uv, mat.y, mat.z);
    if (kind < 2.5) {
      float cover = smoothstep(.25, .9, px);          // too far to resolve: glow by the open share instead of sparkling
      vec2 gc = uv - vec2(15., GATE_UV_Y); float gr = mat.y > 7.5 ? length(gc) : 1e3;
      if (gr < GATE_RR) discard;                      // the moon gate: always clear, whatever the distance
      if (h > 0. && hosHash(gl_FragCoord.xy) >= cover) discard;
      float rim = smoothstep(-.3, -.03, h);
      alb = mix(alb, vc * 1.5 + .02, rim * .5);
      alb *= .8 + .2 * smoothstep(-.9, -.4, h) + .25 * smoothstep(-.7, -.62, h) * (1. - smoothstep(-.56, -.48, h));
      float collar = 1. - smoothstep(GATE_RR + .78, GATE_RR + .92, gr);                // a gilt collar round the gate, beaded
      float bead = .7 + .3 * sin(hosAtan(gc.y, gc.x) * 44.) * smoothstep(GATE_RR + .2, GATE_RR + .4, gr);
      alb = mix(alb, uGold * bead * (.6 + .4 * smoothstep(GATE_RR, GATE_RR + .3, gr)), collar);
      emis += uGold * .1 * collar;
      rim *= 1. - collar;
      emis += uLeak * (rim * .22 + cover * .5 * step(0., h));
    } else {
      float cut = smoothstep(-.12, .06, h);           // sunk ground of the relief
      alb *= 1. - .4 * cut;
      alb += vc * .5 * smoothstep(-.2, -.1, h) * (1. - smoothstep(-.1, -.02, h));
    }
    gloss = .35;
  } else if (kind < 4.5) {                            // singgora tiles: pointed clay scales, rows staggered
    vec2 t = uv / vec2(1.7, 2.1); t.x += .5 * floor(t.y);
    vec2 ti = floor(t), tf = fract(t);
    float th = hosHash(ti + seed), th2 = hosHash(ti * 1.7 + 5.);
    float tip = tf.y - abs(tf.x - .5) * .9;           // lower pointed end of each scale
    vec3 clay = vc * (.62 + .6 * th);
    clay = mix(clay, clay.rrr * vec3(.55, .6, .5), .5 * step(.72, th2) * hosNoise(uv * .6));   // lichen and weather
    alb = clay * (.55 + .45 * smoothstep(-.05, .28, tip)) * (.8 + .25 * hosNoise(uv * vec2(.7, 2.)));
    alb *= .93 + .07 * smoothstep(.0, .1, abs(tf.x - .5));
    if (N.y < 0.) {                                   // seen from inside: battens and the pale backs of the tiles
      float bat = smoothstep(.0, .1, tf.y) * (1. - smoothstep(.86, .96, tf.y));
      alb = mix(vec3(.2, .13, .08), vec3(.36, .23, .135) * (.7 + .5 * th), bat) * (.8 + .3 * hosNoise(uv * vec2(.5, 3.)));
    }
    gloss = .25;
  } else if (kind < 5.5) {                            // gilt
    float h = pierce(uv, mat.y, mat.z);
    alb = uGold * (.5 + .5 * smoothstep(-.25, .05, h)) * (.85 + .3 * g2);
    emis = uGold * .22 * smoothstep(-.1, .1, h);
    gloss = 1.3;
  } else if (kind < 6.5) {                            // paint, worn at the grain
    alb = mix(vc, vc * .55, smoothstep(.55, .8, g1) * .6) * (.9 + .15 * g2);
    gloss = .7;
  } else { alb = vc * (.8 + .3 * g2); gloss = 1.6; }  // iron, brass
}
`;

// =====================================================================================================
// Shaders: the shell (static timber) and the leaves (instanced, hinged in the vertex shader)
// =====================================================================================================
const WOOD_VERT = /* glsl */`
attribute vec2 aUV; attribute vec4 aMat;
varying vec3 vP; varying vec3 vN; varying vec3 vC; varying vec3 vV; varying vec2 vUV; varying vec4 vMat;
#include <fog_pars_vertex>
void main(){
  vP = position; vN = normal; vC = color; vUV = aUV; vMat = aMat;
  vec4 wp = modelMatrix * vec4(position, 1.);
  vV = cameraPosition - wp.xyz;
  vec4 mvPosition = viewMatrix * wp;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const WOOD_FRAG = /* glsl */`
varying vec3 vP; varying vec3 vN; varying vec3 vC; varying vec3 vV; varying vec2 vUV; varying vec4 vMat;
#include <fog_pars_fragment>
${GLSL_LIGHT}
${GLSL_WOOD}
void main(){
  vec3 N = vN / max(length(vN), 1e-4); if (!gl_FrontFacing) N = -N;
  vec2 fw = fwidth(vUV); float px = max(fw.x, fw.y);
  vec3 alb, emis; float gloss;
  hosSurface(vUV, vMat, vC, vP, N, px, alb, emis, gloss);
  vec3 Po = vP + N * .45;
  float ins = step(15.6, Po.y) * (1. - smoothstep(31.8, 33., abs(Po.x))) * (1. - smoothstep(-.2, 1., Po.z)) * smoothstep(-481., -479.8, Po.z) * step(Po.y, hosRoofY(Po.x) + .25);
  if (vMat.x < 3.5) alb *= mix(mix(uOil, vec3(1.), .6 * smoothstep(31., 34., Po.x)), vec3(1.), ins);   // (milder on the shaded seaward side)
  vec3 V = vV / max(length(vV), 1e-3);
  hosWallK = uLook2.x;
  vec3 col = hosShade(alb, vP, N, V, gloss) + emis;
  gl_FragColor = vec4(col, 1.);
  #include <fog_fragment>
}`;

// Leaf-local frame: x from the hinge (0..L), y along the hinge (0..S), z = thickness. The instance matrix
// puts the shut leaf in place; the shader turns it about its hinge (local y axis) and, for folding leaves,
// slides the hinge along the track.
const GLSL_SWING = /* glsl */`
uniform float uWaveZ; uniform float uChan[6]; uniform vec4 uCalm;   // uCalm.x = the lull (0..1)
// s: 0 = the gust arrives, 1 = swung (0.9 s). Spring: shove, overshoot 8 degrees, two rattles on the stay.
float hosSpring(float s){
  if (s <= 0.) return 0.;
  float x = min(s / .85, 1.);
  float a = x * x * (2.2 - 1.2 * x);
  a += .09 * sin(3.1416 * clamp((s - .85) / .4, 0., 1.));
  float r = clamp((s - 1.25) / .6, 0., 1.);
  a -= .05 * abs(sin(6.2832 * r)) * (1. - .55 * step(.5, r));
  return a;
}
// a leaf that falls under its own weight and bounces once
float hosFall(float s){
  if (s <= 0.) return 0.;
  float x = min(s, 1.);
  return x * x * (.55 + .45 * x) - .075 * sin(3.1416 * clamp((s - 1.) / .5, 0., 1.));
}`;
const LEAF_VERT = /* glsl */`
attribute vec2 aInset; attribute float aPart;
attribute vec4 aSize; attribute vec4 aSwing; attribute vec4 aFold; attribute vec4 aUVM; attribute vec4 aTint; attribute vec4 aTrim;
varying vec3 vP; varying vec3 vN; varying vec3 vC; varying vec3 vV; varying vec2 vUV; varying vec4 vMat;
uniform vec4 uHos;
${GLSL_SWING}
#include <fog_pars_vertex>
void main(){
  float L = aSize.x, S = aSize.y, is = aSize.z;
  float code = aSwing.w, curve = floor(code / 10. + .01), chan = code - curve * 10.;
  float fy = position.y;
  if (code > 14.5) fy = abs(fy - .38) < .01 ? .147 : abs(fy - .72) < .01 ? .853 : fy;    // the end panel: its two inner rails stand clear of the moon gate
  vec3 l = vec3((position.x - aSize.w) * L + aInset.x * is, fy * S + aInset.y * is, position.z * is);
  int ci = int(clamp(chan, 1., 6.) + .5) - 1;
  float s = chan < .5 ? (aSwing.y - uWaveZ) / ${SWING.toFixed(1)} - aSwing.z : uChan[ci] - aSwing.z;
  float a = curve < .5 ? hosSpring(s) : hosFall(s);
  float seed = aTint.w;
  if (curve < .5) {
    a *= 1. - .5 * uCalm.x * (1. - smoothstep(3.3, 4.6, s)) * step(chan, .5);
    a += .014 * sin(uHos.x * 6.3 + seed * 41.) * sin(uHos.x * 2.3 + seed * 13.) * smoothstep(1.2, 2.4, s);   // trembling in the wind
  }
  float ang = aSwing.x * a, c = cos(ang), sn = sin(ang);
  vec3 r = vec3(c * l.x + sn * l.z, l.y, -sn * l.x + c * l.z);
  r.x += aFold.x * L * (c - 1.);
  vec3 nr = vec3(c * normal.x + sn * normal.z, normal.y, -sn * normal.x + c * normal.z);
  vec4 hp = instanceMatrix * vec4(r, 1.);
  vP = hp.xyz; vN = mat3(instanceMatrix) * nr;
  // surface: 0 stile, 1 rail, 2 pierced panel, 3 iron, 4 trim bead
  vC = aTint.rgb; vMat = vec4(0., 0., 1., seed);
  vUV = aPart < .5 ? vec2(l.y, l.x + seed * 9.) : vec2(l.x, l.y + seed * 5.);
  if (aPart > 1.5 && aPart < 2.5) { vUV = aFold.zw + aUVM.xy * l.x + aUVM.zw * l.y; vMat = vec4(2., aFold.y, seed, seed); vC = aTint.rgb * 1.08; }
  else if (aPart > 2.5 && aPart < 3.5) { vC = vec3(.03, .028, .026); vMat = vec4(7., 0., 1., seed); }
  else if (aPart > 3.5) { vC = aTrim.rgb; vMat = vec4(aTrim.w, 7., seed, seed); vUV = vec2(l.x + l.y, l.z) ; }
  else if (aPart > .5) vC = aTint.rgb * .88;
  vec4 wp = modelMatrix * hp;
  vV = cameraPosition - wp.xyz;
  vec4 mvPosition = viewMatrix * wp;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;

// unit leaf: every vertex = (fx, fy, z) selectors + an inset in metres, so frame widths do not stretch with the leaf
function leafBaseGeometry(louvre = false) {
  const pos = [], nor = [], ins = [], part = [];
  const fw = 0.75;
  const V = (x, y, z) => ({ x, y, z });                       // x, y = [selector, inset]
  const quad = (a, b, c, d, n, pt) => {
    for (const v of [a, b, c, a, c, d]) { pos.push(v.x[0], v.y[0], v.z); ins.push(v.x[1], v.y[1]); nor.push(n[0], n[1], n[2]); part.push(pt); }
  };
  const box = (x0, x1, y0, y1, z0, z1, pt, ends = true) => {
    quad(V(x0, y0, z1), V(x1, y0, z1), V(x1, y1, z1), V(x0, y1, z1), [0, 0, 1], pt);
    quad(V(x1, y0, z0), V(x0, y0, z0), V(x0, y1, z0), V(x1, y1, z0), [0, 0, -1], pt);
    quad(V(x0, y0, z0), V(x0, y0, z1), V(x0, y1, z1), V(x0, y1, z0), [-1, 0, 0], pt);
    quad(V(x1, y0, z1), V(x1, y0, z0), V(x1, y1, z0), V(x1, y1, z1), [1, 0, 0], pt);
    if (ends) {
      quad(V(x0, y1, z1), V(x1, y1, z1), V(x1, y1, z0), V(x0, y1, z0), [0, 1, 0], pt);
      quad(V(x0, y0, z0), V(x1, y0, z0), V(x1, y0, z1), V(x0, y0, z1), [0, -1, 0], pt);
    }
  };
  box([0, 0], [0, fw], [0, 0], [1, 0], -0.24, 0.24, 0);                         // hinge stile
  box([1, -fw], [1, 0], [0, 0], [1, 0], -0.24, 0.24, 0);                        // free stile
  box([0, fw], [1, -fw], [0, 0], [0, fw * 1.35], -0.2, 0.2, 1);                 // bottom rail
  box([0, fw], [1, -fw], [1, -fw], [1, 0], -0.2, 0.2, 1);                       // top rail
  if (!louvre) {
    box([0, fw], [1, -fw], [0.38, -fw * 0.5], [0.38, fw * 0.5], -0.2, 0.2, 1);    // lock rail
    box([0, fw], [1, -fw], [0.72, -fw * 0.4], [0.72, fw * 0.4], -0.2, 0.2, 1);    // upper rail
    // the pierced panel: two skins 0.2 m apart, so the carving has thickness when seen aslant
    quad(V([0, fw * 0.5], [0, fw * 0.5], 0.1), V([1, -fw * 0.5], [0, fw * 0.5], 0.1), V([1, -fw * 0.5], [1, -fw * 0.5], 0.1), V([0, fw * 0.5], [1, -fw * 0.5], 0.1), [0, 0, 1], 2);
    quad(V([1, -fw * 0.5], [0, fw * 0.5], -0.1), V([0, fw * 0.5], [0, fw * 0.5], -0.1), V([0, fw * 0.5], [1, -fw * 0.5], -0.1), V([1, -fw * 0.5], [1, -fw * 0.5], -0.1), [0, 0, -1], 2);
  } else {
    // a louvred leaf: eighteen real slats tilted to shed rain, and a tilt rod
    const n = 18, ny = 0.798, nz = -0.603;
    for (let i = 0; i < n; i++) {
      const fy = 0.05 + 0.9 * (i + 0.5) / n, x0 = [0, fw * 0.8], x1 = [1, -fw * 0.8];
      const A0 = [fy, -0.4], A1 = [fy, 0.28], B0 = [fy, -0.28], B1 = [fy, 0.4];          // (z -0.45: A0 under, B0 over) (z 0.45: A1 under, B1 over)
      quad(V(x1, B0, -0.45), V(x0, B0, -0.45), V(x0, B1, 0.45), V(x1, B1, 0.45), [0, ny, nz], 1);
      quad(V(x0, A0, -0.45), V(x1, A0, -0.45), V(x1, A1, 0.45), V(x0, A1, 0.45), [0, -ny, -nz], 1);
      quad(V(x0, A1, 0.45), V(x1, A1, 0.45), V(x1, B1, 0.45), V(x0, B1, 0.45), [0, 0, 1], 1);
      quad(V(x1, A0, -0.45), V(x0, A0, -0.45), V(x0, B0, -0.45), V(x1, B0, -0.45), [0, 0, -1], 1);
    }
    box([0.5, -0.12], [0.5, 0.12], [0.06, 0], [0.94, 0], 0.5, 0.72, 0, false);
  }
  const bd = 0.16;                                                               // trim bead round the inside of the frame
  box([0, fw], [0, fw + bd], [0, fw * 1.35], [1, -fw], -0.3, 0.3, 4, false);
  box([1, -fw - bd], [1, -fw], [0, fw * 1.35], [1, -fw], -0.3, 0.3, 4, false);
  box([0, fw], [1, -fw], [0, fw * 1.35], [0, fw * 1.35 + bd], -0.3, 0.3, 4, false);
  box([0, fw], [1, -fw], [1, -fw - bd], [1, -fw], -0.3, 0.3, 4, false);
  for (const fy of [0.1, 0.5, 0.9]) box([0, -0.3], [0, 0.2], [fy, -0.6], [fy, 0.6], -0.36, 0.36, 3);   // hinge knuckles
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('aInset', new THREE.Float32BufferAttribute(ins, 2));
  g.setAttribute('aPart', new THREE.Float32BufferAttribute(part, 1));
  return g;
}

// =====================================================================================================
// The plan: what each bay's openings are (the brief fixes most; the seed fills the rest and all carving seeds)
// =====================================================================================================
const REVEAL = { paired: 0, tophung: 1, split: 2, vanes: 3, dropflap: 4, foldwall: 0 };
function makePlan(rng) {
  const free = ['paired', 'tophung', 'split'], freePat = [PAT.vine, PAT.star, PAT.hibiscus, PAT.lozenge, PAT.diamond];
  const fixed = {
    1: ['paired', PAT.louvre, PAT.vine], 2: ['tophung', PAT.star, PAT.star], 3: ['split', PAT.hibiscus, PAT.hibiscus],
    6: ['paired', PAT.louvre, PAT.lozenge], 7: ['paired', PAT.louvre, PAT.diamond], 9: ['vanes', PAT.diamond, PAT.diamond],
    11: ['dropflap', PAT.slat, PAT.lozenge],
  };
  const bays = [null];
  for (let k = 1; k <= NB; k++) {
    const f = fixed[k] || [rng.pick(free), rng.pick(freePat), rng.pick(freePat)];
    const seedL = rng.range(0.3, 6), seedR = rng.range(0.3, 6);
    const left = { type: f[0], pat: f[1], seed: seedL, reveal: REVEAL[f[0]] };
    const right = FOLD_BAYS.includes(k)
      ? { type: 'foldwall', pat: rng.pick([PAT.vine, PAT.lozenge, PAT.hibiscus]), seed: seedR, reveal: 0 }
      : k === 7 ? { type: 'tophung', pat: f[2], seed: seedR, reveal: REVEAL.tophung, awning: true }
      : { type: f[0], pat: f[1], seed: seedR, reveal: REVEAL[f[0]] };
    // no two bays the same timber: pale new chengal, then dark old posts, then honey, bay after bay
    const TONE = [1.2, 0.86, 1.34, 0.98, 1.26, 0.9, 1.16, 0.82, 1.36, 0.94, 1.22, 0.88];
    bays.push({ k, zc: -BAY * k + BAY / 2, left, right, panelPat: f[2], tone: TONE[k - 1] * (0.94 + 0.12 * (rng.range(0.82, 1.18) - 0.82) / 0.36), warm: rng.range(-1, 1), nVanes: 5 });
  }
  return bays;
}

// =====================================================================================================
// Leaves: the list of instances
// =====================================================================================================
function makeLeaves(rng, plan, pal, opts) {
  const list = [];
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const UP = [0, 1, 0], DOWN = [0, -1, 0];
  const timber = (tone, warm) => { const c = pal.timber.clone().lerp(pal.dark, 0.28 - 0.16 * warm).multiplyScalar(tone * rng.range(0.9, 1.1)); return [c.r, c.g, c.b]; };
  const trims = () => {
    const r = rng();
    if (r < 0.34) return [pal.gold.r, pal.gold.g, pal.gold.b, KIND.gilt];
    if (r < 0.5) return [pal.magenta.r * 0.8, pal.magenta.g * 0.8, pal.magenta.b * 0.8, KIND.paint];
    if (r < 0.62) return [pal.jade.r * 0.7, pal.jade.g * 0.7, pal.jade.b * 0.7, KIND.paint];
    if (r < 0.74) return [pal.cream.r * 0.7, pal.cream.g * 0.7, pal.cream.b * 0.7, KIND.paint];
    return null;
  };
  // o = hinge origin, X = leaf direction when shut, Y = hinge axis, out = the way it swings
  const add = (q) => {
    const Z = cross(q.X, q.Y), sign = q.pivot ? 1 : -Math.sign(dot(Z, q.out) || 1);
    const eu = q.eu, ev = q.ev || UP;
    const uv0 = q.uv0 || [dot([q.o[0] - q.ref[0], q.o[1] - q.ref[1], q.o[2] - q.ref[2]], eu), dot([q.o[0] - q.ref[0], q.o[1] - q.ref[1], q.o[2] - q.ref[2]], ev)];
    const tint = q.tint || timber(1, 0);
    list.push({
      m: [q.X[0], q.X[1], q.X[2], 0, q.Y[0], q.Y[1], q.Y[2], 0, Z[0], Z[1], Z[2], 0, q.o[0], q.o[1], q.o[2], 1],
      size: [q.L, q.S, q.is || 1, q.pivot || 0],
      swing: [sign * q.angle * Math.PI / 180, q.phaseZ ?? 0, q.delay || 0, (q.chan || 0) + 10 * (q.curve || 0)],
      fold: [q.slideK || 0, q.pat, uv0[0], uv0[1]],
      uvm: [dot(q.X, eu), dot(q.X, ev), dot(q.Y, eu), dot(q.Y, ev)],
      tint: [tint[0], tint[1], tint[2], q.seed],
      trim: q.trim || [tint[0] * 0.7, tint[1] * 0.7, tint[2] * 0.7, KIND.timber],
      kind: q.kind || 'leaf', louvre: !!q.louvre,
    });
  };
  // ---- one wall opening
  const wallOpening = (b, side) => {
    const sx = side < 0 ? -HW : HW, out = [side, 0, 0], eu = [0, 0, -1], d = side < 0 ? b.left : b.right;
    const ref = [sx, FLOOR, b.zc + OPW / 2], base = { out, eu, ref, pat: d.pat, seed: d.seed, phaseZ: b.zc };
    const dl = side < 0 ? 0 : 0.11, tint0 = timber(b.tone, b.warm), trim0 = trims() || undefined;
    // the sea side is painted against the salt: jade green leaves with cream beads, and cream leaves with green beads, bay about
    const seaG = [0.07, 0.3, 0.19], seaC = [pal.cream.r * 0.62, pal.cream.g * 0.6, pal.cream.b * 0.5], gr = (b.k % 2) === 1;
    const tint = side > 0 ? (gr ? seaG : seaC) : tint0;
    const trim = side > 0 ? (gr ? [seaC[0] * 1.2, seaC[1] * 1.2, seaC[2] * 1.2, KIND.paint] : [seaG[0] * 1.15, seaG[1] * 1.15, seaG[2] * 1.15, KIND.paint]) : trim0;
    const at = (u, y) => [sx, y, b.zc + OPW / 2 - u];
    if (d.type === 'paired') {
      const ang = rng.range(98, 116);
      const louvre = d.pat === PAT.louvre, lt = louvre && side < 0 ? [tint[0] * 0.8, tint[1] * 0.74, tint[2] * 0.7] : tint;
      add({ ...base, o: at(0, FLOOR), X: eu, Y: UP, L: 10, S: OPH, angle: ang, delay: dl, tint: lt, trim, louvre });
      add({ ...base, o: at(OPW, FLOOR), X: [0, 0, 1], Y: UP, L: 10, S: OPH, angle: ang - rng.range(0, 14), delay: dl + 0.04, tint: lt, trim, louvre });
    } else if (d.type === 'tophung') {
      for (let i = 0; i < 2; i++) { const a = rng.range(46, 58); add({ ...base, o: at(i * 10, OPTOP), X: DOWN, Y: eu, L: OPH, S: 10, angle: d.awning ? 73 + 3 * i : a, delay: dl + i * 0.05, tint, trim }); }
    } else if (d.type === 'split') {
      add({ ...base, o: at(0, FLOOR), X: UP, Y: eu, L: 10, S: OPW, angle: 92, curve: 1, delay: dl, tint, trim });
      add({ ...base, o: at(0, OPTOP), X: DOWN, Y: eu, L: 18, S: OPW, angle: rng.range(62, 76), delay: dl + 0.06, tint, trim });
    } else if (d.type === 'vanes') {
      for (let i = 0; i < 5; i++) add({ ...base, o: at(2 + 4 * i, FLOOR), X: eu, Y: UP, L: 4, S: OPH, pivot: 0.5, angle: 62, delay: dl + i * 0.02, tint, trim, is: 0.7 });
    } else if (d.type === 'dropflap') {
      for (let i = 0; i < 2; i++) add({ ...base, o: at(i * 10, FLOOR), X: UP, Y: eu, L: 14, S: 10, angle: 96, curve: 1, delay: dl + i * 0.07, tint, trim });
    } else if (d.type === 'foldwall') {
      const far = false, L = 5, n = 6, tr = far ? [0, 0, 1] : [0, 0, -1];
      const a0 = [sx, FLOOR, b.zc + (far ? -15 : 15)], r2 = [sx, FLOOR, b.zc + 15];
      for (let i = 0; i < n; i++) {
        const j = i >> 1, odd = i & 1, kk = odd ? 2 * j + 2 : 2 * j;
        add({ ...base, ref: r2, o: [a0[0], a0[1], a0[2] + tr[2] * kk * L], X: odd ? [0, 0, -tr[2]] : tr, Y: UP, L, S: OPH,
          angle: 84, slideK: odd ? -kk : kk, delay: dl + 0.03 * j, tint, trim: trim || [pal.gold.r, pal.gold.g, pal.gold.b, KIND.gilt] });
      }
    }
    // four small vents in the pierced band above
    if (d.type !== 'foldwall') for (let i = 0; i < 4; i++) {
      add({ ...base, o: [sx + side * 0.35, 50.2, b.zc + OPW / 2 - (1.2 + i * 5.1)], X: DOWN, Y: eu, L: 4.6, S: 3.4, is: 0.4, pat: PAT.lozenge,
        angle: rng.range(48, 72), delay: 0.2 + rng.range(0, 0.12), tint, kind: 'vent' });
    }
  };
  for (let k = 1; k <= NB; k++) { wallOpening(plan[k], -1); wallOpening(plan[k], 1); }
  // ---- front door: two leaves, sunburst (channel 0)
  const doorTint = timber(1.05, 0.5), gilt = [pal.gold.r, pal.gold.g, pal.gold.b, KIND.gilt];
  for (const s of [-1, 1]) add({ o: [s * 11, FLOOR, 0], X: [-s, 0, 0], Y: UP, out: [0, 0, 1], eu: [1, 0, 0], ref: [-11, FLOOR, 0], L: 11, S: OPH,
    angle: 96, chan: 1, delay: s > 0 ? 0.05 : 0, pat: PAT.sunburst, seed: 1, tint: doorTint, trim: gilt, is: 1.25, kind: 'door' });
  // ---- three cross screens: four-leaf folding doors (channels 1..3)
  const scrPat = [PAT.vine, PAT.sunburst, PAT.lozenge];
  SCREENS.forEach((zs, i) => {
    const tint = timber(1.1, 0.3), seed = rng.range(0.3, 6);
    for (const s of [-1, 1]) for (let j = 0; j < 2; j++) {
      const kk = j ? 2 : 0;
      add({ o: [s * 11 - s * kk * 5.5, FLOOR, zs], X: j ? [s, 0, 0] : [-s, 0, 0], Y: UP, out: [0, 0, 1], eu: [1, 0, 0], ref: [-11, FLOOR, zs], L: 5.5, S: OPH,
        angle: 80, slideK: j ? -kk : kk, chan: 2 + i, delay: (s > 0 ? 0.04 : 0) + j * 0.02, pat: scrPat[i], seed, tint, trim: i === 1 ? gilt : trims() || gilt, kind: 'screen' });
    }
  });
  // ---- eight roof flaps on the left slope (hinged along their upper edge)
  const upS = [0.8, 0.6, 0], dnS = [-0.8, -0.6, 0], nrm = [-0.6, 0.8, 0];
  for (const k of FLAP_BAYS) for (const cz of [-9, 9]) for (const cs of [-8, 8]) {
    const s = 19 + cs + 6, zl = 20 + cz - 6;
    add({ o: [-HW + 0.8 * s + nrm[0] * 0.25, PLATE + 0.6 * s + nrm[1] * 0.25, -BAY * (k - 1) - zl], X: dnS, Y: [0, 0, -1], out: nrm, eu: [0, 0, -1], ev: upS, uv0: [-4.4, 7.6],
      L: 12, S: 12, angle: rng.range(50, 62), phaseZ: plan[k].zc, delay: 0.3 + rng.range(0, 0.1), pat: PAT.star, seed: 3, tint: timber(0.9, -0.5), kind: 'flap' });
  }
  // ---- the end wall's centre panel: falls outward whole (channel 4)
  add({ o: [-15, FLOOR, -LEN], X: UP, Y: [1, 0, 0], out: [0, 0, -1], eu: [1, 0, 0], ref: [-15, FLOOR, -LEN], L: 30, S: 30, angle: 109.6, chan: 5, curve: 1,
    pat: PAT.gate, seed: 2, tint: timber(1, 0.2), trim: gilt, is: 1.2, kind: 'endwall' });
  // ---- gable vents (front and back), on the wave
  for (const [z, o] of [[0, 1], [-LEN, -1]]) for (let i = -1; i <= 1; i++) {
    add({ o: [i * 15 - 2.2 * o, i ? 62 : 73.2, z + o * 0.4], X: DOWN, Y: [o, 0, 0], out: [0, 0, o], eu: [1, 0, 0], ref: [0, 50, z], L: 5.2, S: 4.4, is: 0.45,
      angle: 58, phaseZ: z < 0 ? -LEN + 20 : -20, delay: 0.25 + 0.03 * i, pat: PAT.star, seed: 2 + i, tint: timber(1, 0), kind: 'vent' });
  }
  return list;
}

function makeLeafMesh(list, base, material) {
  const n = list.length, mesh = new THREE.InstancedMesh(base, material, n);
  const f = (key, size) => { const a = new Float32Array(n * size); list.forEach((l, i) => a.set(l[key], i * size)); return new THREE.InstancedBufferAttribute(a, size); };
  base.setAttribute('aSize', f('size', 4)); base.setAttribute('aSwing', f('swing', 4)); base.setAttribute('aFold', f('fold', 4));
  base.setAttribute('aUVM', f('uvm', 4)); base.setAttribute('aTint', f('tint', 4)); base.setAttribute('aTrim', f('trim', 4));
  const m4 = new THREE.Matrix4();
  list.forEach((l, i) => { m4.fromArray(l.m); mesh.setMatrixAt(i, m4); });
  mesh.instanceMatrix.needsUpdate = true; mesh.frustumCulled = false;
  return mesh;
}

// =====================================================================================================
// The shell: one bay at a time into an accumulator (floor, stilts, posts, truss, roof), then the walls
// =====================================================================================================
function makeShellTools(rng, pal) {
  const UP = [0, 1, 0], ZM = [0, 0, -1], XP = [1, 0, 0];
  const shade = (c, f) => [c.r * f, c.g * f, c.b * f];
  const wood = (tone = 1, darkMix = 0.35) => { const c = pal.timber.clone().lerp(pal.dark, darkMix * 0.8); const f = tone * rng.range(0.88, 1.12); return [c.r * f, c.g * f, c.b * f]; };
  const sd = () => rng.range(0, 9);
  const T = (seed) => [KIND.timber, 0, 1, seed ?? sd()];
  return { UP, ZM, XP, shade, wood, sd, T, rng };
}

function buildBayStructure(A, t, pal, plan, k, opts) {
  const { UP, ZM, shade, wood, sd, T, rng } = t, b = plan[k];
  const z0 = -BAY * (k - 1), z1 = -BAY * k, tone = b.tone;
  // floor boards (run the length of the hall), seams lit from the sand below
  const fc = wood(tone * 1.15, 0.12);
  A.panel([HW, FLOOR, z0], ZM, [-1, 0, 0], BAY, 2 * HW, fc, [KIND.boards, 0.3, 1.25, 3.3], [-z0, 0]);
  // under the floor: joists across, bearers along, stilts on stone pads
  for (let i = 0; i < 5; i++) { const z = z0 - 4 - i * 8; A.beam([-HW, FLOOR - 0.9, z], [HW, FLOOR - 0.9, z], 1.1, 1.6, UP, wood(tone * 0.8, 0.6), T(), 0.1, false); }
  for (const x of [-27, -9, 9, 27]) A.beam([x, FLOOR - 2.5, z0], [x, FLOOR - 2.5, z1], 1.6, 1.8, UP, wood(tone * 0.8, 0.6), T(), 0.14, false);
  if (opts.stilts !== false) for (const x of [-27, -9, 9, 27]) {
    A.beam([x, 1.2, z1], [x, FLOOR - 3.4, z1], 2.4, 2.4, [0, 0, 1], wood(tone * 0.85, 0.5), T(), 0.3, false);
    A.beam([x, -0.4, z1], [x, 1.2, z1], 4.2, 4.2, [0, 0, 1], [0.2, 0.185, 0.16], [KIND.paint, 0, 1, sd()], 0.5);
    if (k === 1) { A.beam([x, 1.2, z0], [x, FLOOR - 3.4, z0], 2.4, 2.4, [0, 0, 1], wood(tone * 0.85, 0.5), T(), 0.3, false); A.beam([x, -0.4, z0], [x, 1.2, z0], 4.2, 4.2, [0, 0, 1], [0.2, 0.185, 0.16], [KIND.paint, 0, 1, sd()], 0.5); }
  }
  // posts 2 m square on the bay line z1 (and the front line for bay 1), with a base block and a bracket cap
  const postLine = (z) => {
    for (const s of [-1, 1]) {
      const x = s * (HW - 1.1), pc = wood(tone, 0.3);
      A.beam([x, FLOOR, z], [x, PLATE - 0.6, z], 2, 2, [0, 0, 1], pc, T(), 0.24, false);
      A.beam([x, FLOOR, z], [x, FLOOR + 1.5, z], 2.7, 2.7, [0, 0, 1], shade(pal.dark, 1.5), T(), 0.3);
      A.beam([x, PLATE - 3.6, z], [x, PLATE - 2.6, z], 2.5, 2.5, [0, 0, 1], shade(pal.gold, 0.55), [KIND.gilt, PAT.lozenge, 1, sd()], 0.2);
      // carved corner bracket under the tie beam: a pierced triangle and its curved-looking brace
      const xi = x - s * 1.0, by = PLATE - 0.7, bw = 9.5, bh = 10.5, zb = z + 0.5;
      A.quad([xi, by, zb], [xi - s * bw, by, zb], [xi, by - bh, zb], [xi, by - bh, zb], [0, 0, s], shade(pal.timber, 1.15), [xi, by], [xi - s * bw, by], [xi, by - bh], [xi, by - bh], [KIND.pierced, PAT.vine, 1.3 + k, sd()]);
      A.beam([xi - s * 0.3, by - bh + 0.4, zb], [xi - s * (bw - 0.4), by - 0.5, zb], 0.7, 0.8, [0, 0, 1], pc, T(), 0.1);
    }
    // tie beam, king post, struts
    const tc = wood(tone * 1.05, 0.3);
    A.beam([-HW, PLATE + 0.5, z], [HW, PLATE + 0.5, z], 1.7, 2.3, UP, tc, T(), 0.22, false);
    A.beam([0, PLATE + 1.6, z], [0, RIDGE - 1.2, z], 1.5, 1.5, [0, 0, 1], tc, T(), 0.18, false);
    A.beam([0, PLATE + 1.6, z], [0, PLATE + 3.4, z], 2.3, 2.3, [0, 0, 1], shade(pal.gold, 0.5), [KIND.gilt, PAT.star, 1, sd()], 0.25);
    for (const s of [-1, 1]) A.beam([s * 1, PLATE + 3.2, z], [s * 15, PLATE + 11.2, z], 1.1, 1.3, UP, tc, T(), 0.14);
  };
  postLine(z1); if (k === 1) postLine(z0 - 1.0);
  // wall plates, ridge, purlins
  for (const s of [-1, 1]) {
    A.beam([s * (HW - 0.6), PLATE + 0.3, z0], [s * (HW - 0.6), PLATE + 0.3, z1], 1.5, 1.5, UP, wood(tone, 0.4), T(), 0.16, false);
    for (const sl of [10, 20, 30]) A.beam([s * (HW - 0.8 * sl), PLATE + 0.6 * sl - 1.9, z0], [s * (HW - 0.8 * sl), PLATE + 0.6 * sl - 1.9, z1], 0.9, 1.2, UP, wood(tone * 0.9, 0.45), T(), 0.1, false);
  }
  A.beam([0, RIDGE - 1.5, z0], [0, RIDGE - 1.5, z1], 1.3, 1.9, UP, wood(tone, 0.4), T(), 0.16, false);
  // a threshold strip across the boards on the bay line, and a pierced fascia under each eave
  A.panel([HW - 2, FLOOR + 0.04, z1 - 0.6], [-1, 0, 0], [0, 0, 1], 2 * HW - 4, 1.2, wood(tone * 1.05, 0.16), [KIND.boards, 0, 0.6, sd()], [0, 0]);
  for (const side of [-1, 1]) A.panel([side * 36.9, 46.4, z0], ZM, UP, BAY, 2.0, wood(tone * 1.05, 0.25), [KIND.pierced, PAT.lozenge, 1.3, sd()], [-z0, 0.8]);
  // rafters (under the roof plane); the flap bays get trimmers round the four holes instead
  const flaps = FLAP_BAYS.includes(k);
  const rp = (s, zl, side, off) => [side * (HW - 0.8 * s) + side * 0.6 * off, PLATE + 0.6 * s + 0.8 * off, z0 - zl];
  const raf = (zl, side, s0 = -5, s1 = 39.4) => A.beam(rp(s0, zl, side, -0.75), rp(s1, zl, side, -0.75), 0.8, 1.2, [0, 0, 1], wood(tone * 0.92, 0.5), T(), 0.1, false);
  for (const side of [-1, 1]) {
    const zs = flaps && side < 0 ? [2, 20, 38] : [4, 12, 20, 28, 36];
    for (const zl of zs) raf(zl, side);
    if (flaps && side < 0) {
      for (const zl of [4.6, 17.4, 22.6, 35.4]) raf(zl, side, 4, 34);
      for (const s of [4.6, 17.4, 20.6, 33.4]) A.beam(rp(s, 2, -1, -0.75), rp(s, 38, -1, -0.75), 0.8, 1.2, [0.6, -0.8, 0], wood(tone * 0.92, 0.5), T(), 0.1, false);
    }
  }
  // roof: singgora tiles, eaves 6 m beyond the plate; holes for the flaps
  const tile = (f) => { const c = pal.mid.clone().lerp(new THREE.Color(0.42, 0.2, 0.11), 0.55).multiplyScalar(f * rng.range(0.9, 1.1)); return [c.r, c.g, c.b]; };
  const roofQuad = (side, sa, sb, za, zb) => {
    // corner at (sa, za); U along -z, V up the slope
    const o = rp(sa, za, side, 0), V = [-side * 0.8, 0.6, 0];
    if (side < 0) A.panel(rp(sa, zb, side, 0), [0, 0, 1], [0.8, 0.6, 0], zb - za, sb - sa, tile(1), [KIND.tiles, 0, 1, 2.2], [-(z0 - zb), sa + 40]);
    else A.panel(o, ZM, V, zb - za, sb - sa, tile(0.92), [KIND.tiles, 0, 1, 5.1], [-(z0 - za) + 200, sa + 40]);
  };
  roofQuad(1, -6, 40, 0, BAY);
  if (!flaps) roofQuad(-1, -6, 40, 0, BAY);
  else {
    const S = [-6, 5, 17, 21, 33, 40], Z = [0, 5, 17, 23, 35, BAY];
    for (let i = 0; i < 5; i++) for (let j = 0; j < 5; j++) if (!((i === 1 || i === 3) && (j === 1 || j === 3))) roofQuad(-1, S[i], S[i + 1], Z[j], Z[j + 1]);
  }
  // ridge cap and eave boards
  A.beam([0, RIDGE + 0.5, z0], [0, RIDGE + 0.5, z1], 2.2, 1.3, UP, tile(0.7), [KIND.paint, 0, 1, sd()], 0.4, false);
  for (const side of [-1, 1]) A.beam(rp(-5.6, 0, side, -0.5), rp(-5.6, BAY, side, -0.5), 0.5, 1.6, [side * 0.6, 0.8, 0], wood(tone, 0.5), T(), 0.08, false);
}

function buildBayWalls(A, t, pal, plan, k) {
  const { UP, ZM, shade, wood, sd, T } = t, b = plan[k], z0 = -BAY * (k - 1), tone = b.tone;
  for (const side of [-1, 1]) {
    const x = side * HW, d = side < 0 ? b.left : b.right, half = d.type === 'foldwall' ? 15 : OPW / 2;
    const a0 = BAY / 2 - half, a1 = BAY / 2 + half;                 // opening in zl (0..40 along the bay)
    const P = (zl, y) => [x, y, z0 - zl];
    const wc = wood(tone * 0.95, 0.35), fr = wood(tone * 1.1, 0.25);
    // side panels: board wainscot, a rail, a relief-carved panel above
    for (const [za, zb] of [[1, a0 - 0.6], [a1 + 0.6, BAY - 1]]) {
      const w = zb - za; if (w < 1) continue;
      A.panel(P(za, FLOOR), ZM, UP, w, 6.4, wood(tone * 0.9, 0.4), [KIND.boards, 0, 1.3, sd()], [za, 0]);
      A.beam(P(za, FLOOR + 6.7), P(zb, FLOOR + 6.7), 1.0, 0.9, UP, fr, T(), 0.12, false);
      A.panel(P(za, FLOOR + 7.1), ZM, UP, w, 21, wc, [KIND.relief, b.panelPat, d.seed, sd()], [za + k * 3.7, 0.4]);
      A.beam(P(za + w / 2, FLOOR + 7.1), P(za + w / 2, OPTOP), 0.7, 0.9, [0, 0, 1], fr, T(), 0.1, false);
    }
    // jambs, sill, lintel
    for (const zl of [a0 - 0.8, a1 + 0.8]) A.beam(P(zl, FLOOR), P(zl, OPTOP + 0.6), 1.3, 1.5, [0, 0, 1], fr, T(), 0.16, false);
    A.beam(P(1, OPTOP + 0.6), P(BAY - 1, OPTOP + 0.6), 1.3, 1.2, UP, fr, T(), 0.14, false);
    A.beam(P(a0, FLOOR + 0.1), P(a1, FLOOR + 0.1), 1.7, 0.5, UP, shade(pal.dark, 1.6), T(), 0.1, false);
    // the pierced band (y 45.2..51.2) with cut-outs for the four vents, between two rails
    const bandMat = [KIND.pierced, d.pat, d.seed, sd()], bc = wood(tone * 1.05, 0.3);
    const band = (za, zb) => A.panel(P(za, 45.2), ZM, UP, zb - za, 6, bc, bandMat, [za - a0 - (half - 10), 45.2 - FLOOR]);
    if (d.type === 'foldwall') band(1, BAY - 1);
    else {
      const cuts = [0, 1, 2, 3].map((i) => [10 + 1.2 + i * 5.1, 10 + 1.2 + i * 5.1 + 3.4]);
      let za = 1;
      for (const [c0, c1] of cuts) {
        band(za, c0); za = c1;
        A.beam(P(c0, 45.4), P(c1, 45.4), 0.5, 0.5, UP, fr, T(), 0.06, false);
        A.beam(P(c0, 50.7), P(c1, 50.7), 0.5, 1.0, UP, fr, T(), 0.06, false);
      }
      band(za, BAY - 1);
    }
    A.beam(P(1, 51.4), P(BAY - 1, 51.4), 0.9, 0.5, UP, fr, T(), 0.08, false);
  }
}

function buildEnds(A, B, t, pal, plan) {
  const { UP, XP, shade, wood, sd, T } = t;
  // ---------- front wall (z = 0, into A): vertical planks, door frame, gable, gilt sunburst
  const fc = wood(1.05, 0.3), fr = wood(1.15, 0.2);
  for (const s of [-1, 1]) {
    A.panel([s < 0 ? -31 : 11.8, FLOOR, 0], XP, UP, 19.2, 36, fc, [KIND.boards, 0, 1.4, 1.7], [s * 30, 0]);
    A.beam([s * 11.8, FLOOR, 0.1], [s * 11.8, OPTOP + 1, 0.1], 1.8, 1.8, [0, 0, 1], fr, T(), 0.25);
    A.panel([s < 0 ? -30 : 13.5, FLOOR + 5, 0.15], XP, UP, 16.5, 20, wood(1, 0.3), [KIND.relief, plan[1].panelPat, 2.2, sd()], [s * 40, 3]);
  }
  A.panel([-11.8, OPTOP + 0.4, 0], XP, UP, 23.6, PLATE - OPTOP - 0.4, fc, [KIND.relief, PAT.lozenge, 1.3, sd()], [0, 0]);
  A.beam([-13, OPTOP + 1, 0.2], [13, OPTOP + 1, 0.2], 2.0, 1.8, UP, fr, T(), 0.25);
  A.beam([-33, PLATE + 0.4, 0.3], [33, PLATE + 0.4, 0.3], 1.4, 1.8, UP, fr, T(), 0.2);
  // threshold
  A.beam([-12, FLOOR - 0.1, 0.6], [12, FLOOR - 0.1, 0.6], 2.4, 0.8, UP, shade(pal.dark, 1.6), T(), 0.15);
  const gable = (z, o, G) => {
    const gc = wood(1, 0.35), m = [KIND.boards, 0, 1.4, sd()];
    const a = [-HW * o, PLATE, z], bb = [0, PLATE, z], c = [0, RIDGE, z], d = [HW * o, PLATE, z];
    G.quad(a, bb, c, c, [0, 0, o], gc, [PLATE, -HW], [PLATE, 0], [RIDGE, 0], [RIDGE, 0], m);
    G.quad(bb, d, c, c, [0, 0, o], gc, [PLATE, 0], [PLATE, HW], [RIDGE, 0], [RIDGE, 0], m);
    // bargeboards with upswept feet and a finial
    for (const s of [-1, 1]) {
      G.beam([s * 38.6, PLATE - 4.7, z + o * 1.2], [0, RIDGE + 0.6, z + o * 1.2], 0.9, 2.6, [0, 0, 1], wood(1.1, 0.2), T(), 0.2);
      G.beam([s * 38.2, PLATE - 4.4, z + o * 1.5], [s * 2, RIDGE - 0.9, z + o * 1.5], 0.5, 0.7, [0, 0, 1], shade(pal.gold, 0.7), [KIND.gilt, PAT.lozenge, 1, sd()], 0.1, false);
      G.beam([s * 38.4, PLATE - 4.9, z + o * 1.2], [s * 42.5, PLATE - 3.4, z + o * 1.2], 0.9, 2.0, [0, 0, 1], wood(1.1, 0.2), T(), 0.2);
    }
    G.beam([0, RIDGE - 1, z + o * 1.2], [0, RIDGE + 7, z + o * 1.2], 1.2, 1.2, [0, 0, 1], wood(1.1, 0.2), T(), 0.25);
    G.beam([0, RIDGE + 2.6, z + o * 1.2], [0, RIDGE + 4.4, z + o * 1.2], 2.1, 2.1, [0, 0, 1], shade(pal.gold, 0.8), [KIND.gilt, PAT.star, 1, sd()], 0.5);
    G.beam([0, RIDGE + 5.6, z + o * 1.2], [0, RIDGE + 6.4, z + o * 1.2], 1.7, 1.7, [0, 0, 1], shade(pal.gold, 0.8), [KIND.gilt, PAT.star, 1, sd()], 0.4);
    for (let i = -1; i <= 1; i++) G.panel([i * 15 - 2.2 * o, (i ? 62 : 73.2) - 5.2, z + o * 0.12], [o, 0, 0], UP, 4.4, 5.2, [0.004, 0.003, 0.003], [KIND.paint, 0, 1, 1], [0, 0]);
  };
  gable(0, 1, A);
  // the gilt sunburst: a half disc of rays over the door, its pattern centred on the foot of the gable
  const R = 10.9, n = 14, gm = [KIND.gilt, PAT.sunburst, 1, 2.5], gcol = [pal.gold.r, pal.gold.g, pal.gold.b], cz = 0.5, cy = PLATE + 2.2;
  for (let i = 0; i < n; i++) {
    const t0 = Math.PI * i / n, t1 = Math.PI * (i + 1) / n;
    const p0 = [Math.cos(t0) * R, cy + Math.sin(t0) * R, cz], p1 = [Math.cos(t1) * R, cy + Math.sin(t1) * R, cz];
    A.quad([0, cy, cz], p0, p1, p1, [0, 0, 1], gcol, [11, -0.5], [11 + p0[0], p0[1] - cy - 0.5], [11 + p1[0], p1[1] - cy - 0.5], [11 + p1[0], p1[1] - cy - 0.5], gm);
  }
  // ---------- end wall (z = -480, into B): pierced all over; the centre 30 x 30 is the falling leaf
  const ec = wood(1, 0.3), em = [KIND.pierced, PAT.lozenge, 2.4, sd()];
  for (const s of [-1, 1]) {
    B.panel([s < 0 ? -31 : 15.8, FLOOR, -LEN], XP, UP, 15.2, 36, ec, em, [s * 30, 0]);
    B.beam([s * 15.8, FLOOR, -LEN], [s * 15.8, 47.2, -LEN], 1.8, 1.8, [0, 0, 1], fr, T(), 0.25);
  }
  B.panel([-15, 47.4, -LEN], XP, UP, 30, PLATE - 47.4, ec, [KIND.pierced, PAT.star, 1.1, sd()], [0, 0]);
  B.beam([-17, 46.8, -LEN], [17, 46.8, -LEN], 1.8, 1.6, UP, fr, T(), 0.25);
  B.beam([-33, PLATE + 0.4, -LEN - 0.3], [33, PLATE + 0.4, -LEN - 0.3], 1.4, 1.8, UP, fr, T(), 0.2);
  B.beam([-16, FLOOR - 0.1, -LEN - 0.4], [16, FLOOR - 0.1, -LEN - 0.4], 2.0, 0.8, UP, shade(pal.dark, 1.6), T(), 0.15);
  gable(-LEN, -1, B);
}

// a carved screen across the hall at z: board wainscot, pierced carving, a grille over the doorway
function buildScreen(A, t, pal, z, pat, seed) {
  const { UP, XP, shade, wood, sd, T } = t, fr = wood(1.15, 0.2), sc = wood(1.05, 0.3);
  for (const s of [-1, 1]) {
    const x0 = s < 0 ? -30.4 : 11.9, w = 18.5;
    A.panel([x0, FLOOR, z], XP, UP, w, 8, wood(0.95, 0.4), [KIND.boards, 0, 1.3, sd()], [x0, 0]);
    A.beam([x0, FLOOR + 8.4, z], [x0 + w, FLOOR + 8.4, z], 1.2, 1.0, UP, fr, T(), 0.14, false);
    A.panel([x0, FLOOR + 8.9, z], XP, UP, w, 19.6, sc, [KIND.pierced, pat, seed, sd()], [x0 + 11, 8.9]);
    A.beam([x0 + w / 2, FLOOR + 8.9, z], [x0 + w / 2, OPTOP + 0.4, z], 0.8, 1.0, [0, 0, 1], fr, T(), 0.1, false);
    A.beam([s * 11.9, FLOOR, z], [s * 11.9, OPTOP + 0.8, z], 1.7, 1.9, [0, 0, 1], fr, T(), 0.24, false);
    A.beam([s * 11.9, FLOOR + 12, z], [s * 11.9, FLOOR + 13.2, z], 2.2, 2.4, [0, 0, 1], shade(pal.gold, 0.6), [KIND.gilt, PAT.lozenge, 1, sd()], 0.2);
  }
  A.beam([-30.4, OPTOP + 0.8, z], [30.4, OPTOP + 0.8, z], 1.6, 1.9, UP, fr, T(), 0.22, false);
  A.panel([-30.4, OPTOP + 1.7, z], XP, UP, 60.8, PLATE - OPTOP - 2.6, sc, [KIND.pierced, PAT.slat, 1, sd()], [0.65, 3.6]);
  A.beam([-11, FLOOR - 0.05, z], [11, FLOOR - 0.05, z], 1.5, 0.5, UP, shade(pal.dark, 1.6), T(), 0.1, false);
}

// the seaward verandah: boards, joists, posts to a lean-to roof of tiles, a rail with balusters
function buildVerandah(A, t, pal, za, zb) {
  const { UP, ZM, XP, shade, wood, sd, T } = t, Y = 15, X0 = HW + 0.4, X1 = 64;
  A.panel([X1, Y, za], ZM, [-1, 0, 0], za - zb, X1 - X0, wood(1.2, 0.1), [KIND.boards, 0.12, 1.25, sd()], [-za, 70]);
  A.beam([X1 + 0.2, Y - 0.6, za], [X1 + 0.2, Y - 0.6, zb], 0.8, 1.5, UP, wood(1, 0.4), T(), 0.12);
  const tl = [0.36, 0.17, 0.09];
  A.panel([X0 - 0.2, 47.5, zb], [0, 0, 1], [0.9648, -0.2631, 0], za - zb, 36.5, tl, [KIND.tiles, 0, 1, 7.7], [0, 0]);
  A.beam([X1, 39.1, za], [X1, 39.1, zb], 1.2, 1.4, UP, wood(1, 0.3), T(), 0.14);
  for (let z = za, i = 0; z >= zb - 0.01; z -= 20, i++) {
    const pc = wood(1.05, 0.3);
    A.beam([X1, 1.2, z], [X1, 38.7, z], 1.5, 1.5, [0, 0, 1], pc, T(), 0.2, false);
    A.beam([X1, -0.4, z], [X1, 1.2, z], 3.2, 3.2, [0, 0, 1], [0.2, 0.185, 0.16], [KIND.paint, 0, 1, sd()], 0.4);
    A.beam([X1, Y, z], [X1, Y + 1.2, z], 2.1, 2.1, [0, 0, 1], shade(pal.dark, 1.5), T(), 0.25);
    A.beam([X0, 46.7, z], [X1 + 3.4, 37.8, z], 0.8, 1.2, UP, wood(0.95, 0.45), T(), 0.1);                    // lean-to rafter
    A.beam([X1 - 0.2, 34.7, z], [X1 - 4.5, 38.5, z], 0.8, 1.0, UP, pc, T(), 0.1);                           // bracket
    A.beam([X0, Y - 1.0, z], [X1, Y - 1.0, z], 1.0, 1.5, UP, wood(0.8, 0.6), T(), 0.1, false);
    if (z - 10 > zb) A.beam([X0, 46.7, z - 10], [X1 + 3.4, 37.8, z - 10], 0.7, 1.0, UP, wood(0.95, 0.45), T(), 0.08, false);
  }
  // rail 5 m high: top and mid rails, balusters; the two ends closed the same way
  const rail = (a, b) => {
    const rc = wood(1.1, 0.25), len = Math.hypot(b[0] - a[0], b[2] - a[2]), n = Math.round(len / 2.5);
    A.beam([a[0], Y + 5, a[2]], [b[0], Y + 5, b[2]], 0.9, 0.7, UP, rc, T(), 0.12, false);
    A.beam([a[0], Y + 0.9, a[2]], [b[0], Y + 0.9, b[2]], 0.6, 0.6, UP, rc, T(), 0.08, false);
    for (let i = 1; i < n; i++) {
      const f = i / n, x = a[0] + (b[0] - a[0]) * f, z = a[2] + (b[2] - a[2]) * f;
      if (i % 8 === 0) continue;
      A.beam([x, Y + 0.9, z], [x, Y + 4.7, z], 0.42, 0.42, [0.7, 0, 0.7], rc, T(), i % 2 ? 0 : 0.1, false);
    }
  };
  rail([X1, 0, za], [X1, 0, zb]); rail([X0, 0, za], [X1, 0, za]); rail([X0, 0, zb], [X1, 0, zb]);
}

// =====================================================================================================
// Shafts: slices across the hall that show the same analytic sun in the dusty air (additive, soft)
// =====================================================================================================
const SHAFT_VERT = /* glsl */`
varying vec3 vP; varying vec3 vV;
#include <fog_pars_vertex>
void main(){
  vP = position;
  vec4 wp = modelMatrix * vec4(position, 1.);
  vV = cameraPosition - wp.xyz;
  vec4 mvPosition = viewMatrix * wp;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const SHAFT_FRAG = /* glsl */`
varying vec3 vP; varying vec3 vV;
uniform vec4 uShaft;        // strength, dust drift, -, -
uniform vec3 uShaftCol;
#include <fog_pars_fragment>
${GLSL_LIGHT}
void main(){
  if (vP.y > hosRoofY(vP.x) - .6) discard;
  hosSoft = 1.;
  float T = hosSunT(vP);
  float d = length(vV);
  float near = smoothstep(5., 22., d);                                   // a slice never slaps the lens
  float dust = .62 + .38 * hosNoise(vP.xy * .11 + vec2(uHos.x * .05, -uHos.x * .03) + vP.z * .37);
  dust *= .8 + .2 * hosNoise(vP.xy * .6 + vP.z);
  float low = smoothstep(16., 19., vP.y);
  float far = mix(1., .28, smoothstep(50., 200., d));                    // sixty slices in line must not add up to white
  vec3 col = uShaftCol * (uShaft.x * T * near * far * dust * low);
  #ifdef USE_FOG
    #ifdef FOG_EXP2
      col *= exp(-fogDensity * fogDensity * vFogDepth * vFogDepth);
    #else
      col *= 1. - smoothstep(fogNear, fogFar, vFogDepth);
    #endif
  #endif
  gl_FragColor = vec4(col, 1.);
}`;
function shaftGeometry(look, detail) {
  const pos = [], per = Math.max(3, Math.round(6 * detail));
  const full = look.sun.y < 0.5;                        // a low sun crosses the whole hall
  for (let k = 1; k <= NB; k++) {
    const wide = full || FLAP_BAYS.includes(k) || FLAP_BAYS.includes(k - 1);
    const x1 = wide ? HW : -HW + Math.min(2 * HW, 30 * Math.abs(look.sun.x) / look.sun.y + 3), y1 = wide ? RIDGE : 47;
    for (let i = 0; i < per; i++) {
      const z = -BAY * (k - 1) - (i + 0.5) * BAY / per;
      pos.push(-HW, FLOOR, z, x1, FLOOR, z, x1, y1, z, -HW, FLOOR, z, x1, y1, z, -HW, y1, z);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.computeBoundingSphere();
  return g;
}

// ---- the three looks (hour of day)
const LOOKS = {
  afternoon: { sun: [-0.70, 0.64, 0.32], sunCol: [1.0, 0.93, 0.8], sunI: 6.3, outI: 2.4, dark: [0.15, 0.14, 0.185], bounce: [1.0, 0.78, 0.54], bounceI: 1.2,
    jade: null, jadeI: 1.5, sky: [0.5, 0.68, 1.0], skyI: 0.6, out: [0.5, 0.62, 0.74], outAmb: 1.45, shaft: 0.038, sheen: 1.25, leak: [1.0, 0.9, 0.75], leakI: 0.8,
    wallK: 0.8, roof: 1.2, roofJade: 1.2, gate: 0.9, portal: '#8ff2d2', portalI: 1.0, floorFill: 0.32, oil: [0.5, 0.37, 0.29] },
  morning: { sun: [-0.865, 0.276, 0.419], sunCol: [1.0, 0.88, 0.72], sunI: 5.2, outI: 2.1, dark: [0.14, 0.155, 0.21], bounce: [1.0, 0.8, 0.56], bounceI: 0.85,
    jade: [0.5, 0.68, 0.82], jadeI: 0.9, sky: [0.6, 0.76, 1.0], skyI: 0.6, out: [0.5, 0.62, 0.84], outAmb: 1.4, shaft: 0.045, sheen: 1.4, leak: [0.95, 0.95, 1.0], leakI: 1.2,
    wallK: 0.6, roof: 1.5, roofJade: 1.2, gate: 0.9, portal: '#ffd9a0', portalI: 1.0, floorFill: 0.12, oil: [0.74, 0.62, 0.54] },
  copper: { sun: [-0.88, 0.208, 0.427], sunCol: [1.0, 0.5, 0.2], sunI: 7.5, outI: 2.6, dark: [0.115, 0.1, 0.175], bounce: [1.0, 0.6, 0.32], bounceI: 0.82,
    jade: [0.5, 0.36, 0.78], jadeI: 0.7, sky: [0.62, 0.56, 0.82], skyI: 0.5, out: [0.46, 0.55, 0.78], outAmb: 1.55, shaft: 0.05, sheen: 1.2, leak: [1.1, 0.75, 0.6], leakI: 1.2,
    wallK: 0.42, roof: 1.5, roofJade: 1.4, gate: 0.8, portal: '#e9a6ff', portalI: 1.1, floorFill: 0.1, oil: [0.85, 0.74, 0.72] },
};

// =====================================================================================================
// buildHero
// =====================================================================================================
export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng.fork ? ctx.rng.fork('house-opens-seaward-hero') : ctx.rng;
  const detail = ctx.quality?.detail ?? 1;
  const hex = opts.palette && opts.palette.length >= 7 ? opts.palette : DEFAULT_PALETTE;
  const pal = { dark: new THREE.Color(hex[0]), mid: new THREE.Color(hex[1]), cream: new THREE.Color(hex[2]), jade: new THREE.Color(hex[3]),
    green: new THREE.Color(hex[4]), gold: new THREE.Color(hex[5]), magenta: new THREE.Color(hex[6]) };
  pal.timber = pal.mid.clone().lerp(new THREE.Color(0.27, 0.19, 0.125), 0.66);
  const lookName = opts.look || 'afternoon';
  const LK = LOOKS[lookName] || LOOKS.afternoon;
  const sun = v3(LK.sun[0], LK.sun[1], LK.sun[2]).normalize();
  const look = { ...LK, sun };
  const plan = makePlan(rng);

  // ---- uniforms shared by every material of the piece (and by the world's, through hero.light)
  const col = (a, f) => new THREE.Vector3(a[0] * f, a[1] * f, a[2] * f);
  const jade = LK.jade || [pal.jade.r * 2.2, pal.jade.g * 1.6, pal.jade.b * 1.7];
  const U = {
    uSun: { value: sun }, uSunCol: { value: col(LK.sunCol, LK.sunI) }, uOutSun: { value: col(LK.sunCol, LK.outI) },
    uAmbDark: { value: col(LK.dark, 1) }, uBounce: { value: col(LK.bounce, LK.bounceI) }, uJade: { value: col(jade, LK.jadeI) },
    uSkyIn: { value: col(LK.sky, LK.skyI) }, uOutAmb: { value: col(LK.out, LK.outAmb) }, uUnder: { value: col([0.55, 0.45, 0.3], 0.4) },
    uBayL: { value: Array.from({ length: 13 }, () => new THREE.Vector4(0, 0, 1, 0)) },
    uOpenR: { value: new Float32Array(13) }, uOpenRoof: { value: new Float32Array(13).fill(-1) },
    uHos: { value: new THREE.Vector4(0, LK.sheen, 0, 0) },
    uGold: { value: new THREE.Vector3(pal.gold.r, pal.gold.g, pal.gold.b) }, uLeak: { value: col(LK.leak, LK.leakI) },
    uWaveZ: { value: 200 }, uChan: { value: new Float32Array(6) }, uCalm: { value: new THREE.Vector4(0, 0, 0, 0) },
    uShaft: { value: new THREE.Vector4((opts.shafts ?? 1) * LK.shaft, 0, 0, 0) }, uShaftCol: { value: col(LK.sunCol, 1) },
    uGate: { value: new THREE.Vector4(PORTAL[1], PORTAL[2], PORTAL[3], GATE_R) }, uScr: { value: new THREE.Vector4(0, 0, 0, LK.floorFill ?? 0.1) }, uOil: { value: col(LK.oil || [1, 1, 1], 1) }, uLook2: { value: new THREE.Vector4(LK.wallK, LK.roof, LK.roofJade, LK.gate) },
    uPortalCol: { value: (() => { const c = new THREE.Color(LK.portal); return new THREE.Vector3(c.r, c.g, c.b).multiplyScalar(LK.portalI); })() },
  };
  U.uBayL.value[0].set(PAT.sunburst, 0, 1, 0);
  for (let k = 1; k <= NB; k++) { const l = plan[k].left; U.uBayL.value[k].set(l.pat, l.reveal, l.seed, 0); }
  for (const k of FLAP_BAYS) U.uOpenRoof.value[k] = 0;
  const fogU = () => THREE.UniformsUtils.merge([THREE.UniformsLib.fog]);
  const share = (extra) => { const u = fogU(); for (const key in U) u[key] = U[key]; return Object.assign(u, extra || {}); };   // same uniform objects everywhere
  const woodMaterial = () => new THREE.ShaderMaterial({ uniforms: share(), vertexShader: WOOD_VERT, fragmentShader: WOOD_FRAG, vertexColors: true, fog: true, side: THREE.DoubleSide });
  const woodMat = woodMaterial();
  const leafMat = new THREE.ShaderMaterial({ uniforms: share(), vertexShader: LEAF_VERT, fragmentShader: WOOD_FRAG, fog: true, side: THREE.DoubleSide });
  const shaftMat = new THREE.ShaderMaterial({ uniforms: share(), vertexShader: SHAFT_VERT, fragmentShader: SHAFT_FRAG, fog: true, side: THREE.DoubleSide,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });

  const object = new THREE.Group(); object.name = 'house-opens-seaward-hero';
  const tools = makeShellTools(rng, pal);
  await ctx.yield();

  // ---- the shell in four chunks of three bays (so the far end culls), walls in the same chunks
  const NCH = 4, accs = [];
  for (let c = 0; c < NCH; c++) accs.push(new Acc());
  const chunkOf = (k) => accs[Math.min(NCH - 1, Math.floor((k - 1) / 3))];
  for (let k = 1; k <= NB; k++) {
    buildBayStructure(chunkOf(k), tools, pal, plan, k, opts);
    await ctx.yield();
    buildBayWalls(chunkOf(k), tools, pal, plan, k);
    await ctx.yield();
  }
  buildEnds(accs[0], accs[NCH - 1], tools, pal, plan);
  await ctx.yield();
  const scrPat = [PAT.vine, PAT.sunburst, PAT.lozenge];
  SCREENS.forEach((z, i) => buildScreen(chunkOf(Math.round(-z / BAY) + 1), tools, pal, z, scrPat[i], rng.range(0.3, 6)));
  await ctx.yield();
  if (opts.verandah !== false) { const va = new Acc(); buildVerandah(va, tools, pal, -160, -320); accs.push(va); }
  await ctx.yield();
  let tris = 0;
  for (const a of accs) {
    const m = new THREE.Mesh(a.geometry(), woodMat); m.name = 'hos-shell'; object.add(m); tris += a.count;
    await ctx.yield();
  }

  // ---- the leaves
  const list = makeLeaves(rng, plan, pal, opts);
  for (const lv of [false, true]) {
    const part = list.filter((l) => l.louvre === lv), base = leafBaseGeometry(lv);
    if (!part.length) continue;
    const leaves = makeLeafMesh(part, base, leafMat); leaves.name = lv ? 'hos-louvres' : 'hos-leaves'; object.add(leaves);
    tris += part.length * (base.attributes.position.count / 3);
  }
  await ctx.yield();

  // ---- the shafts
  const shafts = new THREE.Mesh(shaftGeometry(look, detail), shaftMat); shafts.name = 'hos-shafts'; shafts.renderOrder = 5; shafts.frustumCulled = false;
  object.add(shafts);
  await ctx.yield();

  // ---- controls: one travelling phase, five channels, the lull
  const st = { waveZ: 200, chan: [0, 0, 0, 0, 0], calm: 0, lead: 44, driven: false, openL: new Float32Array(13), openR: new Float32Array(13) };
  const curve = (s) => { if (s <= 0) return 0; const x = Math.min(s / 0.85, 1); return Math.min(1, x * x * (2.2 - 1.2 * x)); };
  const lull = (s) => 1 - 0.5 * st.calm * (1 - sm(3.3, 4.6, s));
  const refresh = () => {
    U.uWaveZ.value = st.waveZ; U.uCalm.value.x = st.calm;
    for (let i = 0; i < 5; i++) U.uChan.value[i] = st.chan[i];
    const door = curve(st.chan[0]);
    st.openL[0] = st.openR[0] = door; U.uBayL.value[0].w = door; U.uOpenR.value[0] = door;
    for (let k = 1; k <= NB; k++) {
      const s = (plan[k].zc - st.waveZ) / SWING;
      st.openL[k] = curve(s) * lull(s); st.openR[k] = curve(s - 0.11) * lull(s - 0.11);
      U.uBayL.value[k].w = st.openL[k]; U.uOpenR.value[k] = st.openR[k];
      if (U.uOpenRoof.value[k] >= 0) U.uOpenRoof.value[k] = curve(s - 0.3) * lull(s - 0.3);
    }
    U.uHos.value.z = door; U.uHos.value.w = sm(0.2, 1, st.chan[4]);
    U.uScr.value.x = curve(st.chan[1]); U.uScr.value.y = curve(st.chan[2]); U.uScr.value.z = curve(st.chan[3]);
  };
  // the brief's journey: camera z against u (used when the world does not pass the camera's z)
  const ZT = [[0, 160], [0.10, 90], [0.21, 14], [0.37, -120], [0.46, -188], [0.61, -302], [0.70, -350], [0.88, -480], [1, -556]];
  const zOfU = (u) => { for (let i = 1; i < ZT.length; i++) if (u <= ZT[i][0]) { const a = ZT[i - 1], b = ZT[i]; return a[1] + (b[1] - a[1]) * (u - a[0]) / (b[0] - a[0]); } return -556; };
  const setProgress = (u, camZ) => {
    st.driven = true;
    const z = camZ ?? zOfU(u);
    // the front runs 44 m ahead; coming up to the first cross screen the breeze outruns us (72 m ahead), so the screen
    // has folded and the bay behind it is opening while we are still a bay away; it falls back to 44 m by the cradle
    // (round three) the breeze now runs two bays ahead in the hall, so the bay we look into stands open to the sea and the
    // one beyond it is the one mid-swing; on the verandah it falls back to a bay and a half (the shutters there swing out
    // beside us), and it outruns us again down the tunnel
    const lead = 86 - 26 * sm(-120, -215, z) + 40 * sm(-250, -290, z);
    st.lead = lead;
    st.waveZ = u <= 0 ? 200 : z - lead;
    st.chan[0] = u <= 0 ? 0 : Math.max(0, (69.3 - z) / 27.7);
    st.chan[1] = u <= 0 ? 0 : Math.max(0, (SCREENS[0] - 4 - st.waveZ) / 26);     // folds as the front reaches it: camera z -60 .. -78
    st.chan[2] = u <= 0 ? 0 : Math.max(0, (-250 - z) / 20);                      // the two inner screens fold as we turn back in from the verandah
    st.chan[3] = u <= 0 ? 0 : Math.max(0, (-258 - z) / 20);
    st.chan[4] = u <= 0 ? 0 : Math.max(0, (-405 - z) / 42);                      // the end wall: starts at z -405, lands at -447
    st.calm = opts.rare && u > 0 ? sm(-357, -375, z) * (1 - sm(-390, -408, z)) : 0;
    refresh();
  };
  const setWaveZ = (z) => { st.driven = true; st.waveZ = z; refresh(); };
  const setChannel = (i, s) => { st.driven = true; st.chan[i] = s; refresh(); };
  const setCalm = (c) => { st.calm = c; refresh(); };
  const bayOpen = (k, side = -1) => (side < 0 ? st.openL : st.openR)[Math.max(0, Math.min(NB, k))];
  const openAt = (z, side = -1) => {
    const zf = Math.min(12, Math.max(0, -z / BAY + 0.5)), i0 = Math.min(11, Math.floor(zf)), f = zf - i0, a = side < 0 ? st.openL : st.openR;
    return a[i0] + (a[i0 + 1] - a[i0]) * f * f * (3 - 2 * f);
  };
  refresh();

  // ---- anchors (hero-local = the brief's coordinates)
  const anchors = {
    portalSeat: { position: v3(PORTAL[0], PORTAL[1], PORTAL[2]), normal: v3(0, 0, 1), radius: PORTAL[3], color: LK.portal },
    moonGate: { center: v3(0, GATE_Y, -LEN), radius: GATE_R },
    flyThrough: [v3(0, 7, 160), v3(0, 7, 92), v3(0, 23, 14), v3(0, 23, -60), v3(0, 23, -120), v3(4, 23, -150), v3(20, 23, -176), v3(39, 23, -190),
      v3(47.5, 23, -208), v3(49.5, 23, -222), v3(49, 23, -235), v3(43.5, 23, -247.5), v3(33, 23, -256.5), v3(22, 23, -264), v3(12.5, 23, -273.5), v3(5.5, 23, -285.5), v3(1.5, 23, -299), v3(0, 23, -314), v3(0, 23, -350), v3(0, 23.36, -400), v3(0, 23.73, -450),
      v3(0, 23.95, -480), v3(0, 24.2, -515), v3(PORTAL[0], PORTAL[1], PORTAL[2])],
    door: { z: 0, width: 22, height: OPH, floorY: FLOOR },
    screens: SCREENS.map((z) => ({ z, width: 22, height: OPH })),
    foldingWalls: FOLD_BAYS.map((k) => ({ bay: k, x: HW, z0: plan[k].zc + 15, z1: plan[k].zc - 15, stackZ: plan[k].zc + 15 })),
    bays: plan.slice(1).map((b) => ({ k: b.k, zc: b.zc, left: { ...b.left }, right: { ...b.right } })),
    bayCenter: (k) => v3(0, FLOOR, -BAY * k + BAY / 2),
    roofFlaps: FLAP_BAYS.flatMap((k) => [-9, 9].flatMap((cz) => [-8, 8].map((cs) => v3(-HW + 0.8 * (19 + cs), PLATE + 0.6 * (19 + cs), -BAY * (k - 1) - 20 - cz)))),
    cageHooks: [-18, -9, 0, 9, 18].map((x, i) => v3(x, PLATE - 0.8, -140 + (i % 2 ? -6 : 6))),
    cradle: v3(14, 21, -190),
    verandah: { x0: HW, x1: 64, y: 15, z0: -160, z1: -320, railY: 20, roofY0: 47.5, roofY1: 39 },
    endWall: { z: -LEN, hinge: v3(0, FLOOR, -LEN), width: 30, height: 30 },
    rampTip: v3(0, 6, -508),
    sunDir: sun.clone(),
    viewpoints: [
      { name: 'entry', position: v3(0, 7, 160), target: v3(0, 30, 0) },
      { name: 'three states', position: v3(0, 23, -40), target: v3(-6, 24, -130) },
      { name: 'verandah', position: v3(48, 23, -215), target: v3(36, 26, -270) },
      { name: 'tunnel', position: v3(0, 23, -332), target: v3(0, 24, -480) },
      { name: 'outside, sunny side', position: v3(-150, 60, 120), target: v3(0, 40, -200) },
    ],
  };

  const radius = 250, height = 80, center = v3(0, 40, -LEN / 2);

  const hero = {
    object, radius, height, center, anchors, ground: true, groundY: 0,
    setProgress, setWaveZ, setChannel, setCalm, bayOpen, openAt,
    light: { uniforms: U, glsl: GLSL_LIGHT }, woodMaterial, uniforms: U, plan, lead: () => st.lead,
    stats: { triangles: tris, leaves: list.length },
    update(dt, time, camera) {
      U.uHos.value.x = time;
      if (!st.driven) {
        // nobody is driving (the set-piece viewer): play the wave on a loop, every channel keyed to it
        const z = 70 - ((time * 26) % 760);
        st.waveZ = z;
        st.chan[0] = Math.max(0, (20 - z) / SWING); st.chan[4] = Math.max(0, (-LEN + 44 - z) / (SWING * 1.6));
        for (let i = 0; i < 3; i++) st.chan[1 + i] = Math.max(0, (SCREENS[i] + 20 - z) / SWING);
        refresh();
      }
    },
    dispose() {},
  };
  return hero;
}
