// THE UMBRA: hero set piece "Totality, and the edge that brings it" (everything procedural; imports three + kit/core only).
//
// WHAT     Three things that share ONE shadow function, so sky, sun and cloud go dark along the same travelling edge:
//          1. umbra(): a GLSL chunk (exported as UMBRA_GLSL, uniforms in hero.uniforms) that tells any world-space
//             point whether the Moon's shadow has reached it. Lit where s = z + lean*y (measured from the piece's
//             origin) is ahead of the front F or behind the trailing edge F-3400; 260 m soft edge, 35% pre-dimming
//             over 1500 m, drifting shadow bands for ~900 m ahead of each edge. Low cloud goes first, crowns last.
//          2. The dome and the sun: a dome drawn at infinity (cobalt sky; the indigo wall of night climbing from under
//             the sun = the exact integral of umbra() along each view ray, no loop, no steps; the totality dome with
//             the copper horizon ring), 58 stars + Venus + Jupiter, and ONE quad 50 degrees across carrying the
//             crescent, Baily's beads, both diamonds, the chromosphere arc, 2-5 rose prominences, the thread-built
//             corona (streamer envelopes x field-line threads) and the black notched disc of the Moon (6 degrees).
//          3. Exit anvil A3: a cumulonimbus as displaced meshes (stalk sheared downwind toward +X, anvil crown
//             overhanging far to +X, mammatus underside, a shoulder tower on the -Z side, the canyon between them
//             and the saddle mound whose crest seats the portal), three more scales of cellular cauliflower in the
//             fragment shader, analytic sun shadows from the shoulder and the anvil plate (the canyon stays in
//             shade up to the mammatus: a third, taller occluder stands over the shoulder; only the shoulder's
//             sunward half and crest catch the returning gold), lightning breathing inside (3 cores, eased 0.1 s up
//             and 0.3 s down, at most 2 flashes a second; a glow that lights creases first), the portal's pearl
//             light inside the cloud (uSeat, level = hero.seatGlow) and on whatever faces the seat.
//             THE CANYON (buildStorm, in this order): the floor is a height field 70-90 m under the line (fine under
//             the line, coarse where it falls into the deck, a dozen big lobes); ~80 HEADS, separate round
//             cauliflower bodies 16-50 m across, are half sunk in the floor and both walls (seeded on the finished
//             sheets, none nearer than 36 m to the line); the fillet over the camera's side is rebuilt twice as fine
//             (a welded patch); the portal's COLLAR is a torus of cauliflower (lobes on lobes, heavier underneath,
//             inner face 10.9 m from the axis) with a ragged dozen small heads on it and four big ones under it.
//             No impostor cloudlets are left anywhere. The camera line is kept clear by shortening lobes along
//             their own normals (see shapeSheet): no vertex is pushed sideways and no triangle is ever deleted.
//             SEEDS: the floor, heads and collar draw from their own streams, and the floor this piece had before
//             is still shaped (never drawn) to count its share of one shuffle, so every choice made from ctx.rng
//             after this piece (the world's whole turret field) is exactly what it was before these were added.
// SIZE     Local frame = world axes, translated only (DO NOT rotate or scale: the shadow runs along world +Z).
//          Origin = centre of the stalk's base. Brief placement: hero.object.position.set(395, -300, -1370), so the
//          world's cruise height y=0 is local y=300 and the portal lands at world (645, ~105, -1705). Stalk ~530 m
//          across, crown at local y 630-700, anvil from x -300 to about +1150, z +-480; everything below local
//          y ~ 30 melts into haze (bury it in the turret field). radius 620, height 700, center (60, 330, -60).
// OPTS     palette     7 hex strings in the brief's order: cobalt, cloud white, indigo, slate-violet, pearl, copper, rose
//          sunElev     (26) sun height in degrees: 12 low/golden, 34 high;   sunAz (8) degrees from -Z toward -X
//          corona      'minimum' | 'maximum' | 'skewed' (default: by seed);  prominences (by seed, 2-5)
//          contactS    (940) local s = z + lean*y of the place where second contact meets the camera (brief: u 0.39)
//          frontPerU   (7700) metres the front travels per unit of path progress (175 m/s x 44 s)
//          hazeMix     (1) 0 = fog to scene.fog.color, 1 = fog to this piece's own azimuth-coloured haze
//          deckY       (10) local height around which the cloud melts into haze (-1e5 switches it off)
//          portalRing  (true) the sculpted collar round the seat;  fringe (0) extra sphere-impostor puffs on lobe tops (left
//                      at 0 by the world: on a backlit wall they read as pasted discs);  seatGlow (0.35) starting
//                      level of the portal's light in the cloud
//          skyDist     (3600) distance at which sun and stars are drawn (kept under 0.78 x camera.far)
//          soft        (0.2) how far the fine cauliflower relief is blended back to the soft body (0 crisp .. 1 smooth)
// PER SEED corona type and streamer angles, prominence count/places/kinds, star field, stalk lobes, shear, anvil
//          reach and scallops, overshooting top, mammatus cell size, shoulder crest, portal height, lightning rhythm.
// PROGRESS hero.setPhase(u)        path progress 0..1: front F = contactS + frontPerU*(u-0.39), trail = F-3400.
//          hero.setFront(F, trail) the same directly, in the piece's s units.   hero.release() back to self-cycling.
//          Until one of them is called the piece cycles by itself (40 s) relative to the camera, so it can be judged
//          alone. Everything about the sun (crescent width, beads, diamonds, chromosphere, corona, stars, the
//          exposure opening uUmbra.w) is derived every frame from where the camera given to update() stands
//          between the two edges, so the contacts happen exactly when an edge reaches the camera, at any speed.
// ANCHORS  (local space; the camera arrives from +Z heading -Z, west of the stalk)
//          portalSeat   { position, normal, radius 10, tilt 20 }: head of the canyon; normal faces the arriving camera
//          canyonLine   7 points, straight 20-degree climb heading +X, 267 m, ending in portalSeat (>= 30 m clear)
//          flankArc     10 points, quarter turn of radius 345 m round the stalk, wall 70-120 m to starboard
//          flyThrough   approach + flankArc + canyonLine in order (the storm was carved clear of exactly this line)
//          sunDir       unit vector toward the sun;  sunPoint  a far point that way (poi for the reveal)
//          bolts        the three lightning cores;   crest  the shoulder tower's crest;   cruiseY  300
//          viewpoints   [{ position, target, phase }]: entry, the front, totality, the storm wall, the canyon
// HOOKS    hero.uniforms (uUmbra = front, trail, lean, open; uSunDir; uOrg; uTime ...): add them, with UMBRA_GLSL, to
//          the world's own shaders. hero.makeCloudMaterial() = the anvil's material for other displaced cloud meshes
//          (attributes position, normal, aO 0..1 crease shade, aBoil 0..1). hero.haze = THREE.Color updated every
//          frame (copy into scene.fog.color). hero.state = { d2, d3, camIn, open, light } (metres to second contact,
//          metres past third, camera inside 0..1, exposure opening, light level at the camera). hero.flash = current
//          lightning level; hero.boltOverride = [a, b, c] forces the three cores (null = automatic).
//          hero.cloudUniforms({ hgt }) + the exported UMBRA_CHUNKS let a world write shaders lit like this piece;
//          makeCloudMaterial({ hgt, lobe3 }) takes its own base/deck vector for clouds that stand elsewhere.
//          hero.makePuffs(pos, nrm, sz, { hgt }) = a mesh of impostor cloudlets lit the same way (a normal shorter than
//          0.7 makes a round cloudlet, a unit normal a patch shaded like the surface it sits on).
//          hero.seatGlow = level of the portal's pearl light inside the cloud (the world raises it from u 0.6).
// LIGHTING Self-lit shaders: scene lights are ignored. Before: one silver key from uSunDir, cobalt shadow sides,
//          silver linings. In the umbra: copper skirts, violet crowns, pearl rim. After third contact: pale gold.
//          Scene fog density is honoured (fog: true); the fog COLOUR is this piece's haze unless hazeMix = 0.
//          The dome is opaque with renderOrder -0.5 and no depth: give the world no other sky. Below the horizon the
//          dome shows plain haze: that half belongs to the world's cloud decks. Wants bloom threshold ~1.2,
//          strength ~0.3: only the crescent, the diamond, the prominences and the lightning creases exceed 1.
// COST     ~168k triangles at detail 1 (~115k at 0.6), 5 draw calls (dome, stars, sun, storm mesh, one buried puff
//          that keeps the impostor program alive for makePuffs), ~300 ms build in steps of a few ms (every loop
//          yields), no lights, no textures, nothing to dispose beyond what hangs off `object`.
import * as THREE from 'three';
import { clamp, lerp, smoothstep, makeRng } from '../kit/core.js';

const TAU = Math.PI * 2, D2R = Math.PI / 180;
const PALETTE = ['#1B4FA8', '#EEF1F6', '#1A1B3A', '#4A4668', '#F2EEE4', '#E8823A', '#FF5C8A'];

// ---------------------------------------------------------------------------------------------------------------
// Shared GLSL. umbra(): 1 = sunlit (the thin-crescent light the scene starts in), 0 = inside the Moon's shadow.
export const UMBRA_GLSL = /* glsl */`
uniform vec4 uUmbra;   // x front F, y trailing edge, z lean (cot of sun elevation), w open (exposure 0..1 in totality)
uniform vec3 uSunDir;  // toward the sun (world)
uniform float uTime;
uniform vec3 uOrg;     // world position of the piece's origin (s is measured in the piece's frame)
float umbraS(vec3 p){ return (p.z - uOrg.z) + uUmbra.z * (p.y - uOrg.y); }
vec2 umbra2(vec3 p){   // x light 0..1, y 1 where that light is the returning (post-totality) sun
  float s = umbraS(p);
  float a = smoothstep(-130., 130., s - uUmbra.x) * (0.65 + 0.35 * smoothstep(0., 1500., s - uUmbra.x));
  float b = smoothstep(-130., 130., uUmbra.y - s) * (0.65 + 0.35 * smoothstep(0., 1500., uUmbra.y - s));
  return vec2(max(a, b), step(a + 1e-4, b));
}
float umbra(vec3 p){ return umbra2(p).x; }
// shadow bands: stripes 2 m apart drifting 4 m/s for ~900 m ahead of each edge; px = metres per pixel at p
float umbraBands(vec3 p, float px){
  float s = umbraS(p);
  float w = max(1. - abs(s - uUmbra.x - 420.) / 520., 1. - abs(uUmbra.y - s - 420.) / 520.);
  w = clamp(w * 1.6, 0., 1.) * (1. - smoothstep(0.3, 0.8, px));
  float ph = dot(p, vec3(0.42, 0.17, 0.89)) * 3.14159 - uTime * 12.566 + 3.6 * sin(dot(p, vec3(-0.11, 0.03, 0.07)) + uTime * 0.7) + 2.4 * sin(dot(p, vec3(0.085, -0.15, 0.036)) - uTime * 0.4);
  float bpat = 0.55 + 0.45 * sin(dot(p, vec3(0.031, 0.02, -0.027)) + uTime * 0.9);   // they come and go in patches
  return 1. + 0.085 * w * bpat * sin(ph);
}
`;

const NOISE_GLSL = /* glsl */`
float h31(vec3 p){ p = fract(p * vec3(0.1031, 0.1030, 0.0973)); p += dot(p, p.yzx + 33.33); return fract((p.x + p.y) * p.z); }
vec3 h33(vec3 p){ p = fract(p * vec3(0.1031, 0.1030, 0.0973)); p += dot(p, p.yxz + 33.33); return fract((p.xxy + p.yxx) * p.zyx); }
// cellular lobes with a smooth minimum: 1 on a lobe's crown, falling into soft curved creases (cauliflower)
float cell(vec3 p){
  vec3 i = floor(p), f = fract(p); float acc = 0.;
  for (int x = -1; x <= 1; x++) for (int y = -1; y <= 1; y++) for (int z = -1; z <= 1; z++) {
    vec3 o = vec3(float(x), float(y), float(z));
    vec3 r = o + h33(i + o) * 0.8 + 0.1 - f;
    acc += exp(-12. * dot(r, r));
  }
  return 1. - clamp(-log(acc + 1e-6) * 0.185, 0., 1.);
}
float vn3(vec3 p){
  vec3 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(mix(h31(i), h31(i + vec3(1,0,0)), f.x), mix(h31(i + vec3(0,1,0)), h31(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(h31(i + vec3(0,0,1)), h31(i + vec3(1,0,1)), f.x), mix(h31(i + vec3(0,1,1)), h31(i + vec3(1,1,1)), f.x), f.y), f.z);
}
`;

// Sky colours as functions of elevation (degrees) and of the angle to the sun's azimuth; shared by dome and haze.
const SKY_GLSL = /* glsl */`
uniform vec3 uSkyA[4];   // before: zenith, cobalt at 30 deg, silver horizon, indigo wall
uniform vec3 uSkyB[5];   // totality: zenith, slate-violet at 12, rose-peach at 6, copper at 0, thin line at 1
uniform vec4 uCam;       // x camIn (camera inside the umbra 0..1), y pre-dimming at the camera, z gold (after C3), w spare
vec3 skyBefore(float el, float saz){
  vec3 c = mix(uSkyA[2], uSkyA[1], smoothstep(0., 30., el));
  c = mix(c, uSkyA[0], smoothstep(30., 85., el));
  c += uSkyA[2] * 0.3 * pow(max(saz, 0.), 8.) * (1. - smoothstep(0., 32., el));
  c = mix(c, uSkyA[2] * vec3(0.52, 0.6, 0.74), 1. - smoothstep(-14., 0., el));
  return c;
}
vec3 skyTotal(float el, float saz){
  vec3 c = mix(uSkyB[3], uSkyB[2], smoothstep(1.2, 6., el));
  c = mix(c, uSkyB[1], smoothstep(5., 12., el));
  c = mix(c, uSkyB[0], smoothstep(12., 50., el));
  float d = (el - 1.) / 0.8;
  c += uSkyB[4] * 0.55 * exp(-d * d);
  c *= 0.86 + 0.14 * saz;
  c = mix(c, uSkyB[1] * 0.42, 1. - smoothstep(-9., 0.3, el));
  return c;
}
vec3 skyDark(float el, float saz){   // what the shadow looks like: an indigo bank from outside, the copper ring from inside
  vec3 wall = uSkyA[3] * (1.0 + 0.6 * (1. - smoothstep(0., 12., abs(el))));
  return mix(wall, skyTotal(el, saz) * mix(0.5, 1., uUmbra.w), uCam.x);
}
vec3 skyLitC(float el, float saz){   // sunlit air: from inside the umbra it is far away, dim and reddened
  vec3 c = skyBefore(el, saz) * uCam.y;
  vec3 far = skyTotal(el, saz) * 1.12 * mix(0.5, 1., uUmbra.w);
  return mix(c, mix(far, c * 0.3, smoothstep(8., 50., el)), uCam.x);
}
`;

// Cloud lighting shared by the displaced meshes and the impostor puffs.
const CLOUD_GLSL = /* glsl */`
uniform vec3 uKey, uGold, uShade, uWarm, uCool, uPearl, uBoltCol;
uniform vec4 uBolt[3];   // xyz world position of a lightning core, w its level 0..1
uniform vec4 uSeat;      // xyz world position of the portal seat, w level of its pearl light inside the cloud
uniform vec4 uOwn;       // shoulder tower: axis x, z (world), radius
uniform vec4 uHgt;       // x world y of the base, y 1/height, z deck y (world), w haze mix
uniform vec4 uOccA;      // shoulder tower as a sun occluder: xyz world, w radius
uniform vec4 uOccB;      // anvil plate as a sun occluder: x,z world centre, y underside (world), w downwind reach
vec3 hazeAt(vec3 P, vec3 dir, float lit){
  vec3 dn = dir / max(length(dir), 1e-3);
  float el = min(degrees(asin(clamp(dn.y, -1., 1.))), 2.5);
  float saz = dot(normalize(dir.xz + vec2(1e-5, 0.)), normalize(uSunDir.xz));
  vec3 steel = mix(vec3(1.), vec3(0.6, 0.7, 0.88), smoothstep(-6., 1., el));
  vec3 dark = skyDark(el, saz) + uSkyB[1] * 0.95 * (1. - uCam.x) * (1. - smoothstep(-10., 0., el));
  return mix(dark, skyLitC(el, saz) * mix(steel, vec3(1.), uCam.x), lit);
}
// how much of the sun reaches P past the shoulder tower and the anvil plate (soft analytic shadows)
float sunOcc(vec3 P){
  float o = 1.;
  vec3 d = uOccA.xyz - P;
  float t = dot(d, uSunDir);
  if (t > 0.) o *= smoothstep(uOccA.w * 0.72, uOccA.w * 1.2, length(d - uSunDir * t));
  d.y -= 150.; t = dot(d, uSunDir);
  if (t > 0.) o *= smoothstep(uOccA.w * 0.9, uOccA.w * 1.45, length(d - uSunDir * t));
  d += vec3(-40., 450., 0.); t = dot(d, uSunDir);        // the shoulder's boiling top, 300 m up: only what stands close behind it
  if (t > 0.) o *= mix(1., smoothstep(uOccA.w * 1.2, uOccA.w * 2.05, length(d - uSunDir * t)), 1. - smoothstep(430., 640., t));
  float ty = (uOccB.y - P.y) / max(uSunDir.y, 0.05);
  if (ty > 0.) {
    vec2 q = P.xz + uSunDir.xz * ty - uOccB.xz;
    float rho = length(q) + 1e-3;
    float R = 380. + uOccB.w * pow(max(q.x / rho, 0.) + 1e-4, 1.3);
    o *= smoothstep(R - 110., R + 30., rho);
  }
  return o;
}
// N shading normal (with the fine cauliflower), Ng smooth normal (for the soft linings), V toward the eye
vec3 cloudShade(vec3 P, vec3 N, vec3 Ng, vec3 V, float ao, float px, float thin){
  vec2 um = umbra2(P);
  float lit = um.x * umbraBands(P, px);
  float ndl = dot(N, uSunDir);
  float fg = 1. - max(dot(Ng, V), 0.); fg *= fg;
  float toSun = max(dot(-V, uSunDir), 0.);
  float up = N.y * 0.5 + 0.5;
  float hRel = clamp((P.y - uHgt.x) * uHgt.y, 0., 1.);
  // sunlit state: thin hard key, cobalt shadow sides, silver lining toward the sun
  float sunward = dot(Ng, uSunDir);
  float own = (1. - smoothstep(uOwn.z * 1.15, uOwn.z * 1.4, length(P.xz - uOwn.xy))) * smoothstep(0.05, 0.4, sunward);
  own *= smoothstep(-0.5, 0., dot(P.xz - uOwn.xy, normalize(uSunDir.xz)) / uOwn.z + 0.9 * smoothstep(uOccA.y + 40., uOccA.y + 130., P.y));
  vec3 key = mix(uKey, uGold, um.y) * mix(sunOcc(P), 1., own);
  float dif = smoothstep(-0.15, 0.78, ndl);
  vec3 sh = uShade * (0.2 + 0.19 * up + 0.25 * up * up + 0.5 * max(dot(N, vec3(-0.45, 0.35, 0.82)), 0.)) * (0.7 + 0.45 * hRel) * ao;
  vec3 cl = sh * (1. - 0.55 * dif * dot(key, vec3(0.33))) + key * 0.56 * dif * (0.5 + 0.5 * ao);
  cl += key * (fg * (0.7 * toSun * toSun + 0.07 + 0.5 * um.y * smoothstep(-0.2, 0.3, sunward)) + 0.32 * thin * toSun * toSun * toSun);
  // umbra state: slate-violet lobes, copper on every flank that faces the horizon ring, dark creases, pearl rim from
  // the corona. The fine normal N carries it, so the cauliflower relief reads in the dark as it does in sunlight.
  float k = smoothstep(0.22, 0.85, up * 0.7 + hRel * 0.5);
  float hor = 1. - abs(N.y); hor *= hor;
  vec3 cd = mix(uWarm * 0.85, uCool, k) * (0.5 + 0.62 * ao) * (0.8 + 0.5 * (1. - up) * (1. - hRel));
  float mn = max(ndl * 0.6 + 0.4, 0.);
  cd += uPearl * (0.15 * mn * mn * ao + 0.3 * fg * toSun + 0.04 * fg);
  cd += mix(uWarm, uCool, 0.5) * 0.3 * max(dot(N, vec3(-0.45, 0.35, 0.82)), 0.) * ao;
  cd += uSkyB[3] * 0.3 * hor * ao * (0.55 + 0.45 * smoothstep(-0.5, 0.3, N.y));
  cd *= (0.42 + 0.78 * ao) * (0.8 + 0.2 * smoothstep(-0.7, 0.1, N.y));
  cd *= mix(0.5, 1., uUmbra.w);
  // from outside the shadow is indigo, no copper yet; crowns stay a paler violet so near turrets never go to black holes
  vec3 co = mix(uSkyA[3] * 2.0, uSkyB[1] * 1.25 + uSkyA[2] * 0.035, up * up) * (0.5 + 0.6 * ao);
  cd = mix(co, cd, uCam.x);
  vec3 col = mix(cd, cl, clamp(lit, 0., 1.2));
  // light inside the cloud: lightning cores, and the portal's pearl. Both show where the cloud is thin (creases and
  // the folds between lobes) and are broken by a lobe-scale field, so they light relief instead of sitting as a disc
  float crs = 0.03 + 1.5 * thin + 0.5 * (1. - ao) * (1. - ao);
  float pat = 0.3 + 0.7 * smoothstep(0.25, 0.75, vn3(P / 37. + vec3(0., uTime * 0.05, 0.)));
  float g = 0.;
  for (int i = 0; i < 3; i++) { vec3 d = P - uBolt[i].xyz; g += uBolt[i].w * exp(-dot(d, d) / 13000.); }
  col += uBoltCol * g * (0.18 * (1. - 0.7 * um.x) + crs) * pat * 1.8 * mix(1., 0.45, um.x);
  vec3 ds = uSeat.xyz - P;
  float sl = length(ds) + 1e-3;
  float fw = max(dot(-V, ds / sl), 0.);
  float gs = min(uSeat.w * (exp(-sl / 170.) * 1.5 + exp(-sl * sl / 2600.) * 0.9), 1.6) * (0.22 + 0.78 * fw * fw) * smoothstep(15., 60., sl);
  col += mix(uPearl, vec3(0.72, 0.8, 1.), 0.45) * gs * (0.1 + crs) * (0.45 + 0.55 * pat);
  col += mix(uPearl, vec3(0.72, 0.8, 1.), 0.3) * (max(dot(N, ds / sl), 0.) * 0.7 / (1. + sl * sl / 260.)) * (0.35 + 0.65 * ao);
  return col;
}
`;

const FOG_APPLY = /* glsl */`
  #ifdef USE_FOG
    #ifdef FOG_EXP2
      float fogF = 1. - exp(-fogDensity * fogDensity * vFogDepth * vFogDepth);
    #else
      float fogF = smoothstep(fogNear, fogFar, vFogDepth);
    #endif
    col = mix(col, mix(fogColor, hz, uHgt.w), fogF);
  #endif
`;

// the chunks a world needs to shade its own things exactly like this piece (include after UMBRA_GLSL; uniforms from hero.cloudUniforms())
export const UMBRA_CHUNKS = { NOISE_GLSL, SKY_GLSL, CLOUD_GLSL, FOG_APPLY };

const CLOUD_VERT = /* glsl */`
attribute float aO, aBoil;
uniform float uTime;
varying vec3 vW, vN; varying float vAO;
#include <fog_pars_vertex>
${NOISE_GLSL}
void main(){
  vec3 p = position;
  // crowns boil and roll outward: two slow noise fields climbing through the cloud push lobes along their normals
  float b1 = vn3(p * 0.019 + vec3(0., -uTime * 0.12, uTime * 0.03)) - 0.5;
  float b2 = vn3(p * 0.047 + vec3(uTime * 0.07, -uTime * 0.18, 0.)) - 0.5;
  p += normal * (b1 * 18. + b2 * 6.) * aBoil;
  vec4 wp = modelMatrix * vec4(p, 1.);
  vW = wp.xyz; vN = mat3(modelMatrix) * normal; vAO = aO;
  vec4 mvPosition = viewMatrix * wp;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;

const CLOUD_FRAG = /* glsl */`
varying vec3 vW, vN; varying float vAO;
uniform float uSoftK;   // 0 = crisp cauliflower, 1 = smooth: how far the fine relief is blended back to the soft body
#include <fog_pars_fragment>
${UMBRA_GLSL}${NOISE_GLSL}${SKY_GLSL}${CLOUD_GLSL}
void main(){
  vec3 dpx = dFdx(vW), dpy = dFdy(vW);
  float px = max(length(dpx), length(dpy));
  vec3 N = normalize(vN + vec3(0., 1e-5, 0.));
  vec3 Vv = cameraPosition - vW;
  vec3 V = Vv / max(length(Vv), 1e-3);
  // third and fourth scale of cauliflower: creased value noise as a height field, faded out before it can alias
  vec3 q = vW - uOrg + vec3(0., -uTime * 1.2, uTime * 0.5);
  float f0 = 1. - smoothstep(2.6, 7., px), f1 = 1. - smoothstep(0.7, 2., px), f2 = 1. - smoothstep(0.12, 0.4, px);
  vec3 qw = q + (vec3(vn3(q / 31.), vn3(q / 31. + 5.2), vn3(q / 31. + 9.7)) - 0.5) * 18.;
  vec3 q0 = qw + (vec3(vn3(q / 9.7 + 1.7), vn3(q / 9.7 + 4.1), vn3(q / 9.7 + 8.3)) - 0.5) * 7. * f1;
  float l0 = cell(q0 / 26.), l1 = cell(qw / 9. + 3.1), l2 = 1.;
  #if LOBE3 > 0
  if (f2 > 0.01) l2 = cell(qw / 3.3 + 7.3);
  float f3 = 1. - smoothstep(0.035, 0.12, px), l3 = 1.;
  if (f3 > 0.01) l3 = cell(qw / 1.15 + 2.9);          // the last scale, only within ~40 m (the collar, the skimmed crown)
  #else
  float f3 = 0., l3 = 1.;
  #endif
  float h = l0 * 9.5 * f0 + l1 * 3.0 * f1 + l2 * 0.75 * f2 + l3 * 0.26 * f3;
  vec3 r1 = cross(dpy, N), r2 = cross(N, dpx);
  float det = dot(dpx, r1);
  vec3 sg = sign(det) * (dFdx(h) * r1 + dFdy(h) * r2);
  vec3 Ng = N;
  N = normalize(abs(det) * N - sg + N * 1e-7);
  float cr = mix(1., smoothstep(0., 0.7, l0), f0 * 0.8) * mix(1., smoothstep(0., 0.7, l1), f1 * 0.6) * mix(1., smoothstep(0., 0.7, l2), f2 * 0.4) * mix(1., smoothstep(0., 0.7, l3), f3 * 0.3);
  N = normalize(mix(N, Ng, uSoftK) + Ng * 1e-5);
  float ao = mix(mix(0.66, 1.05, vAO) * (0.56 + 0.44 * cr), 0.97, uSoftK * 0.55);
  float thin = (1. - vAO) * (1. - vAO) * 0.4 + (1. - cr) * 0.45;
  vec3 col = cloudShade(vW, N, Ng, V, ao, px, thin);
  vec3 hz = hazeAt(vW, -Vv, umbra(vW));
  float fz = 1. - max(dot(Ng, V), 0.);
  col = mix(col, hz, 0.4 * fz * fz * fz * (0.25 + 0.75 * smoothstep(50., 420., length(Vv))));   // soft far silhouettes; near walls keep their relief
  col = mix(col, hz, 1. - smoothstep(uHgt.z + 15., uHgt.z + 140., vW.y));
  ${FOG_APPLY}
  gl_FragColor = vec4(col, 1.);
}`;

// Fringe puffs: camera-facing sphere impostors with eroded edges, sphere normals and sphere depth, shaded exactly
// like the mesh, so they read as further lobes and soften every silhouette they sit on. Opaque: nothing is sorted.
const PUFF_VERT = /* glsl */`
attribute vec3 aPos, aNrm; attribute vec2 aSz;
uniform float uTime;
varying vec2 vUv; varying vec3 vC, vRt, vUpv, vSn; varying vec4 vZ;
#include <fog_pars_vertex>
void main(){
  vec4 c = modelMatrix * vec4(aPos, 1.);
  vRt = vec3(viewMatrix[0][0], viewMatrix[1][0], viewMatrix[2][0]);
  vUpv = vec3(viewMatrix[0][1], viewMatrix[1][1], viewMatrix[2][1]);
  float r = aSz.x * (1. + 0.07 * sin(uTime * 0.35 + aSz.y * 40.));
  vec3 wp = c.xyz + (vRt * position.x + vUpv * position.y) * r;
  vUv = position.xy; vC = c.xyz; vSn = mat3(modelMatrix) * aNrm;
  vec4 mvPosition = viewMatrix * vec4(wp, 1.);
  vZ = vec4(mvPosition.z, r, projectionMatrix[2][2], projectionMatrix[3][2]);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;

const PUFF_FRAG = /* glsl */`
varying vec2 vUv; varying vec3 vC, vRt, vUpv, vSn; varying vec4 vZ;
#include <fog_pars_fragment>
${UMBRA_GLSL}${NOISE_GLSL}${SKY_GLSL}${CLOUD_GLSL}
void main(){
  float r = length(vUv);
  float sd = fract(vC.x * 0.137 + vC.z * 0.291);
  vec3 sp = vec3(vUv * 1.5, sd * 17.) + vec3(0., -uTime * 0.02, uTime * 0.015);
  float n = vn3(sp * 1.4) * 0.6 + vn3(sp * 3.3 + 5.) * 0.4;
  float edge = r + (n - 0.5) * 0.75;
  float al = 1. - smoothstep(0.66, 0.8, edge);
  if (al < 0.5) discard;
  float nz = sqrt(max(1. - r * r, 0.03));
  vec3 Vv = cameraPosition - vC;
  vec3 fw = Vv / max(length(Vv), 1e-3);
  float gx = vn3(sp * 1.4 + vec3(0.35, 0., 0.)) - vn3(sp * 1.4), gy = vn3(sp * 1.4 + vec3(0., 0.35, 0.)) - vn3(sp * 1.4);
  vec3 Ng = normalize(vRt * vUv.x + vUpv * vUv.y + fw * nz);
  float nl = length(vSn), ball = 1. - smoothstep(0.7, 0.9, nl);
  vec3 Nb = normalize(Ng - (vRt * gx + vUpv * gy) * 1.3 + vSn * 0.9);
  vec3 Ns = normalize(vSn / max(nl, 1e-3) + Ng * 0.35 - (vRt * gx + vUpv * gy) * 0.8);
  vec3 N = normalize(mix(Ns, Nb, ball) + Ng * 1e-4);
  vec3 P = vC + N * vZ.y * 0.7;
  float px = -vZ.x * 0.0026;
  float cr = smoothstep(0.1, 0.6, abs(n * 2. - 1.));
  vec3 col = cloudShade(P, N, mix(N, Ng, 0.3 + 0.7 * ball), fw, mix(0.72 + 0.22 * cr, 0.8 + 0.28 * cr, ball), px, smoothstep(0.35, 0.8, edge) * mix(0.15, 0.5, ball));
  vec3 hz = hazeAt(P, -Vv, umbra(P));
  col = mix(col, hz, mix(0.12, 0.3, ball) * smoothstep(0.3, 0.8, edge));
  col = mix(col, hz, 1. - smoothstep(uHgt.z + 15., uHgt.z + 140., P.y));
  ${FOG_APPLY}
  float zv = min(vZ.x + nz * vZ.y * 0.7, -0.5);
  gl_FragDepth = clamp(((vZ.z * zv + vZ.w) / (-zv)) * 0.5 + 0.5, 0., 1.);
  gl_FragColor = vec4(col, 1.);
}`;

// The dome is drawn at infinity straight from the view rotation, so it needs no following and never clips.
const DOME_VERT = /* glsl */`
varying vec3 vDir;
void main(){
  vDir = position;
  vec4 p = projectionMatrix * vec4(mat3(viewMatrix) * position, 1.);
  if (abs(p.w) < 1e-4) p.w = 1e-4;     // a vertex exactly beside a level camera (the pole): keep it off w = 0
  gl_Position = vec4(p.xy, p.w * 0.99999, p.w);
}`;

const DOME_FRAG = /* glsl */`
varying vec3 vDir;
uniform vec2 uDomeE;   // front and trail as the dome sees them (the far edge is pushed away while the camera is outside)
${UMBRA_GLSL}${SKY_GLSL}
void main(){
  vec3 rd = normalize(vDir);
  float el = degrees(asin(clamp(rd.y, -1., 1.)));
  float saz = dot(normalize(rd.xz + vec2(1e-5, 0.)), normalize(uSunDir.xz));
  // share of the air along this ray that stands in the shadow: the exact integral of umbra() along the ray under
  // exponential extinction (thinner air upward), so the wall of night is one soft arched edge with no steps
  float s0 = umbraS(cameraPosition);
  float ds = rd.z + uUmbra.z * rd.y;
  ds = abs(ds) < 1e-4 ? 1e-4 : ds;
  float k = 0.00012 + max(rd.y, 0.) / 1100.;
  float sf = 0.;
  for (int i = 0; i < 5; i++) {
    float e = (float(i) - 2.) * 75.;
    float ta = (uDomeE.y - e - s0) / ds, tb = (uDomeE.x + e - s0) / ds;
    float t1 = max(min(ta, tb), 0.), t2 = min(max(max(ta, tb), 0.), 1e6);
    sf += 0.2 * (exp(-k * t1) - exp(-k * t2));
  }
  float lit = smoothstep(0.3, 0.85, 1. - sf);
  lit = mix(lit, 1., 1. - smoothstep(-0.28, -0.015, rd.y));   // below the horizon belongs to the world's cloud decks
  vec3 col = mix(skyDark(el, saz), skyLitC(el, saz), lit);
  // a breath of shimmer along the copper line, and 1/255 of dither against banding in the dark dome
  float n = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453);
  col *= 1. + (n - 0.5) * 0.03;
  gl_FragColor = vec4(col, 1.);
}`;

const SUN_VERT = /* glsl */`
uniform vec3 uSunDir, uSunR, uSunU; uniform float uSkyDist;
varying vec2 vUv;
void main(){
  vUv = position.xy;
  vec3 wp = cameraPosition + (uSunDir + (uSunR * position.x + uSunU * position.y) * 0.4663) * uSkyDist;
  gl_Position = projectionMatrix * viewMatrix * vec4(wp, 1.);
}`;

// One quad, 50 degrees across, in degrees from the sun's centre. Premultiplied alpha: light adds, the Moon covers.
const SUN_FRAG = /* glsl */`
uniform vec4 uSunA;    // x Moon's offset in degrees along uCdir, y corona visibility, z disc opacity, w chromosphere (+C2, -C3)
uniform vec4 uDia;     // xy diamond position (deg), z its level, w crescent glow
uniform vec2 uCdir;
uniform vec4 uStr[9];  // streamers: angle, length (solar radii), half width (rad), strength
uniform vec4 uProm[5]; // prominences: limb angle, kind (0 loop, 1 hedge, 2 detached arch), height (deg), level
uniform vec3 uPearl, uRose;
uniform float uTime;
varying vec2 vUv;
${NOISE_GLSL}
float angd(float a, float b){ return atan(sin(a - b), cos(a - b)); }
float tnoise(float x, float y, float per){
  float i = floor(x), f = fract(x), j = floor(y), g = fract(y);
  f = f * f * (3. - 2. * f); g = g * g * (3. - 2. * g);
  float i0 = mod(i, per), i1 = mod(i + 1., per);
  return mix(mix(h31(vec3(i0, j, 3.)), h31(vec3(i1, j, 3.)), f), mix(h31(vec3(i0, j + 1., 3.)), h31(vec3(i1, j + 1., 3.)), f), g);
}
void main(){
  vec2 p = vUv * 25. + vec2(1.3e-5, 0.);
  float r = length(p), th = atan(p.y, p.x);
  float aa = max(fwidth(r), 1e-4);
  const float RS = 3.;
  vec2 pn = p / r;
  vec2 pm = p - uCdir * uSunA.x + vec2(0., 1.7e-5);
  float rm = length(pm), thm = atan(pm.y, pm.x);
  float RM = 3.1 + 0.035 * (sin(thm * 23. + 1.3) * 0.5 + sin(thm * 41. + 4.) * 0.3 + sin(thm * 67. + 2.) * 0.2);
  float outside = smoothstep(RM - aa, RM + aa, rm);
  // photosphere: what the Moon has not covered yet (the notched limb breaks the last sliver into beads)
  float sun = (1. - smoothstep(RS - aa, RS + aa, r)) * outside;
  vec3 col = vec3(6., 5.6, 4.9) * sun;
  float side = 0.5 + 0.5 * dot(pn, -uCdir * sign(uSunA.x));
  col += vec3(1., 0.95, 0.86) * uDia.w * exp(-abs(r - RS) / 0.8) * side * side * mix(1., outside, uSunA.z);
  // corona: inner ring + streamer envelopes, both carried by threads that follow the bending field lines
  float rho = r / RS;
  float vis = uSunA.y;
  if (vis > 0.002 && rho < 8.4) {
    float S = 0., warp = 0.;
    for (int i = 0; i < 9; i++) {
      vec4 st = uStr[i];
      float d = angd(th, st.x);
      float w = st.z * mix(1., 0.16, smoothstep(1., st.y, rho));
      float tp = (1. - smoothstep(0.72 * st.y, st.y, rho)) / pow(rho, 0.6);
      S += st.w * exp(-(d * d) / (w * w)) * tp;
      warp += sin(d) * exp(-(d * d) / (st.z * st.z * 6.)) * (st.y > 3.3 ? 0.34 : -0.5) * step(0.001, st.w);
    }
    float tc = (th + warp * min(rho - 1., 4.5)) / 6.28318;
    float t1 = tnoise(tc * 110., rho * 0.5 - uTime * 0.012, 110.);
    float t2 = tnoise(tc * 260., rho * 1.1 + 3. - uTime * 0.02, 260.);
    float f2 = 1. - smoothstep(0.45, 1.1, aa / max(r * 0.0242, 1e-4));
    float thr = 0.22 + 1.25 * t1 * t1;
    thr = mix(thr, thr * (0.4 + 1.2 * t2), f2);
    float breathe = 0.93 + 0.07 * sin(uTime * 0.5 + th * 2.);
    float inner = 1.0 * exp(-(rho - 1.) * 3.) * (0.72 + 0.28 * t1);
    float cor = (inner + S * thr * 1.25 * breathe) * (1. - smoothstep(7.2, 8.3, rho));
    col += mix(uPearl, vec3(0.74, 0.82, 1.), 0.4 * smoothstep(1.5, 6., rho)) * min(cor, 1.1) * vis * outside;
  }
  // prominences and the chromosphere arc: the one rose accent
  float pv = max(vis, abs(uSunA.w));
  if (pv > 0.002 && rho < 1.6) {
    float prom = 0.; float y = r - RS;
    for (int i = 0; i < 5; i++) {
      vec4 pr = uProm[i];
      float x = angd(th, pr.x) * RS, H = max(pr.z, 0.05), I = 0.;
      if (pr.y < 0.5) { float q = length(vec2(x, y * 0.85)) / H - 1.; I = exp(-q * q / 0.04) * step(-0.06, y); }
      else if (pr.y < 1.5) { float top = H * (0.5 + 0.5 * (0.5 + 0.5 * sin(x * 11. + uTime * 1.3 + pr.x * 7.))); I = exp(-(x * x) / (H * H * 2.4)) * (1. - smoothstep(top * 0.55, top, y)) * step(-0.06, y); }
      else { float q = length(vec2(x, (y - 0.3 * H) * 1.4)) / (0.75 * H) - 1.; I = exp(-q * q / 0.035) * smoothstep(0.15 * H, 0.4 * H, y); }
      prom += I * pr.w * (0.82 + 0.18 * sin(uTime * 2.3 + pr.x * 11.));
    }
    float dc = (r - RS - 0.07) / 0.1;
    float arc = exp(-dc * dc) * smoothstep(0.35, 0.92, dot(pn, -uCdir * sign(uSunA.w))) * abs(uSunA.w);
    col = mix(col, vec3(0.), min(prom, 1.) * pv * outside * 0.7) + uRose * (2.2 * min(prom, 1.2) * pv + 2.4 * arc) * outside;
  }
  // the diamond: a small six-rayed star on the limb, no ghosts
  if (uDia.z > 0.002) {
    vec2 q = p - uDia.xy + vec2(2.1e-5, 0.);
    float dq = length(q), an = atan(q.y, q.x);
    float star = 6. * exp(-dq * dq / 0.12) + 0.8 / (1. + dq * dq * 3.5) + 1.5 * pow(abs(cos(an * 3. + 0.5)), 26.) * exp(-dq / 1.2);
    col += vec3(1., 0.97, 0.92) * star * uDia.z;
  }
  float a = (1. - outside) * uSunA.z;
  gl_FragColor = vec4(col + vec3(0.0015, 0.0015, 0.003) * a, a);
}`;

const STAR_VERT = /* glsl */`
attribute vec3 aS;   // size in px at 450 lines, brightness, seed (planets have seed < 0: no twinkle)
uniform float uTime, uSkyDist, uPx, uStar;
varying float vI;
void main(){
  float tw = aS.z < 0. ? 1. : 0.72 + 0.28 * sin(uTime * (2.5 + aS.z * 4.) + aS.z * 60.);
  vI = aS.y * tw * uStar * smoothstep(0.02, 0.2, position.y);
  gl_Position = projectionMatrix * viewMatrix * vec4(cameraPosition + position * uSkyDist, 1.);
  gl_PointSize = max(2., aS.x * uPx);
}`;
const STAR_FRAG = /* glsl */`
uniform vec3 uPearl; varying float vI;
void main(){
  vec2 c = gl_PointCoord * 2. - 1.;
  float d = dot(c, c);
  gl_FragColor = vec4(mix(vec3(0.8, 0.88, 1.), uPearl, 0.5) * vI * exp(-d * 2.6) * (1. - smoothstep(0.6, 1., d)), 1.);
}`;

// ---------------------------------------------------------------------------------------------------------------
// Geometry. Every cloud body is a parametric sheet (rows x columns, optionally wrapped), pushed along its own
// normals by three scales of creased noise + big lobes (shortened where they would reach the camera line), sagged
// into mammatus where asked. All sheets land in one indexed geometry with their own smooth normals.
const sab = (n) => Math.sqrt(n * n + 0.012) - 0.11;      // creased noise: round tops, sharp valleys
function makeSheet(ni, nj, wrap) {
  const cols = wrap ? nj : nj + 1, nv = (ni + 1) * cols;
  return { ni, nj, wrap, cols, nv, pos: new Float32Array(nv * 3), cw: new Float32Array(nv), mam: new Float32Array(nv), boil: new Float32Array(nv), ao: new Float32Array(nv), nor: new Float32Array(nv * 3) };
}

async function sheetNormals(ctx, S) {
  const { ni, nj, wrap, cols, pos, nor } = S;
  for (let i = 0; i <= ni; i++) {
    if ((i & 7) === 7) await ctx.yield();
    const ia = Math.max(i - 1, 0), ib = Math.min(i + 1, ni);
    for (let j = 0; j < cols; j++) {
      const ja = wrap ? (j + nj - 1) % nj : Math.max(j - 1, 0), jb = wrap ? (j + 1) % nj : Math.min(j + 1, nj);
      const a = (i * cols + ja) * 3, b = (i * cols + jb) * 3, c = (ia * cols + j) * 3, d = (ib * cols + j) * 3;
      const ux = pos[b] - pos[a], uy = pos[b + 1] - pos[a + 1], uz = pos[b + 2] - pos[a + 2];
      const vx = pos[d] - pos[c], vy = pos[d + 1] - pos[c + 1], vz = pos[d + 2] - pos[c + 2];
      let nx = vy * uz - vz * uy, ny = vz * ux - vx * uz, nz = vx * uy - vy * ux;
      const l = Math.hypot(nx, ny, nz), o = (i * cols + j) * 3;
      if (l < 1e-6) { nx = 0; ny = 1; nz = 0; } else { nx /= l; ny /= l; nz /= l; }
      nor[o] = nx; nor[o + 1] = ny; nor[o + 2] = nz;
    }
  }
}

// nearest point on the fly line: returns distance, writes the point into out
function makeLine(pts) {
  const n = pts.length;
  return (x, y, z, out) => {
    let best = 1e18;
    for (let k = 0; k < n - 1; k++) {
      const a = pts[k], b = pts[k + 1];
      const dx = b.x - a.x, dy = b.y - a.y, dz = b.z - a.z;
      let t = ((x - a.x) * dx + (y - a.y) * dy + (z - a.z) * dz) / (dx * dx + dy * dy + dz * dz);
      t = t < 0 ? 0 : t > 1 ? 1 : t;
      const qx = a.x + dx * t, qy = a.y + dy * t, qz = a.z + dz * t;
      const d = (x - qx) * (x - qx) + (y - qy) * (y - qy) + (z - qz) * (z - qz);
      if (d < best) { best = d; if (out) { out.x = qx; out.y = qy; out.z = qz; } }
    }
    return Math.sqrt(best);
  };
}

// Pushes every vertex of a sheet along its own normal (cauliflower + lobes), sags the mammatus and keeps the camera
// line clear WITHOUT ever moving a vertex sideways: a lobe that would reach into the corridor is only shortened along
// its normal. The last `band` metres before the clear radius hold whatever relief is left, compressed (so the wall
// keeps its lobes instead of being planed to a tube), and because the limit is a continuous function of position,
// neighbours shorten together: no membranes, no spikes, nothing to delete afterwards.
async function shapeSheet(ctx, S, env) {
  const { N, off, lobes, mcell, mseed, lineDist, minClear } = env, band = env.band ?? 48, fine = env.fine ?? 1;
  const { nv, pos, nor, cw, mam, ao } = S, lim = minClear + band, lim2 = lim + 55;
  let cbx = 0, cby = 0, cbz = 0, cnx = 0, cny = 0, cnz = 0;
  const distAt = (tt) => lineDist(cbx + cnx * tt, cby + cny * tt, cbz + cnz * tt);
  await sheetNormals(ctx, S);
  const hash2 = (ix, iz) => { let h = (ix * 374761393 + iz * 668265263 + mseed) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
  const sab = (n) => Math.sqrt(n * n + 0.012) - 0.11;
  for (let v = 0; v < nv; v++) {
    if ((v & 255) === 255) await ctx.yield();
    const o = v * 3, bx = pos[o], by = pos[o + 1], bz = pos[o + 2], nx = nor[o], ny = nor[o + 1], nz = nor[o + 2];
    const w = cw[v];
    // three scales of cauliflower: |noise| has round tops and sharp creases; flattened in y so lobes stack in tiers
    const a = sab(N.n3(bx / 170 + off, by / 112, bz / 170)), b = sab(N.n3(bx / 62, by / 43 + off, bz / 62)), c = sab(N.n3(bx / 30, by / 22, bz / 30 + off));
    let d = a * 48 + b * 18 + c * 5 * fine, shade = a * 0.95 + b * 0.6 + c * 0.38;
    if (w > 0.4) for (let k = 0; k < lobes.length; k++) {
      const L = lobes[k], dx = bx - L.x, dy = (by - L.y) * 1.25, dz = bz - L.z, rr = (dx * dx + dy * dy + dz * dz) / (L.r * L.r);
      if (rr < 1) { const hgt = Math.sqrt(1 - rr); d += L.r * 0.55 * hgt; shade += 0.25 * hgt; }
    }
    d *= w;
    // the corridor. A lobe travels along its normal; what matters is the closest approach of that travel to the line
    // (at tc, distance m). Passing wider than lim2: untouched. Passing between lim and lim2: it may go on beyond the
    // closest approach, the less the nearer it passes. Passing inside lim: it stops short, with only a compressed
    // remainder inside the band. Every case joins the next continuously.
    const ad = Math.abs(d), sg = d < 0 ? -1 : 1;
    let t = d;
    if (by - ad < 640 && by + ad > 60) {
      const d0 = lineDist(bx, by, bz);
      if (d0 - ad < lim2) {
        cbx = bx; cby = by; cbz = bz; cnx = nx * sg; cny = ny * sg; cnz = nz * sg;
        let m = d0, kb = 0;
        for (let k = 1; k <= 8; k++) { const dd = distAt(ad * k / 8); if (dd < m) { m = dd; kb = k; } }
        let lo = ad * Math.max(kb - 1, 0) / 8, hi = ad * Math.min(kb + 1, 8) / 8;
        for (let k = 0; k < 5; k++) { const m1 = lo + (hi - lo) / 3, m2 = hi - (hi - lo) / 3; if (distAt(m1) < distAt(m2)) hi = m2; else lo = m1; }
        const tc = kb === 8 && distAt(ad) <= distAt((lo + hi) * 0.5) ? ad : (lo + hi) * 0.5;
        m = distAt(tc);
        let tt = ad;
        if (m < lim2) {
          tt = tc + (ad - tc) * smoothstep(lim, lim2, m);
          if (m < lim) {
            let t1 = 0, dT = d0;
            if (d0 >= lim) { let ta = 0, tb = tc; for (let k = 0; k < 7; k++) { const mid = (ta + tb) * 0.5; if (distAt(mid) < lim) tb = mid; else ta = mid; } t1 = ta; dT = lim; }
            const room = Math.min(Math.max(dT - minClear, 0), band) * 0.88, rem = tc - t1;
            const fr = Math.min(rem / 105, 1);
            tt = t1 + (rem > 0 ? Math.min(room * (1 - (1 - fr) * (1 - fr)), rem) : 0);
          }
        }
        t = sg * tt;
        shade *= 0.72 + 0.28 * Math.min(1, tt / Math.max(ad, 1e-3));          // a pressed lobe is a shallower, darker fold
      }
    }
    let x = bx + nx * t, y = by + ny * t, z = bz + nz * t;
    shade = Math.min(1, shade);
    if (mam[v] > 0) {   // mammatus: hemispherical pouches hung from a jittered cell pattern
      const gx = x / mcell, gz = z / mcell, ix = Math.floor(gx), iz = Math.floor(gz); let best = 9;
      for (let ax = -1; ax <= 1; ax++) for (let az = -1; az <= 1; az++) {
        const fx = ix + ax + 0.15 + 0.7 * hash2(ix + ax, iz + az), fz = iz + az + 0.15 + 0.7 * hash2(iz + az + 91, ix + ax - 37);
        const dd = (gx - fx) * (gx - fx) + (gz - fz) * (gz - fz); if (dd < best) best = dd;
      }
      const pouch = Math.sqrt(Math.max(0, 1 - best / 0.34));
      let sag = pouch * 0.36 * mcell * mam[v];
      if (y - sag < 560) sag = Math.min(sag, Math.max(0, lineDist(x, y, z) - minClear - 6));   // pouches never hang into the corridor
      y -= sag;
      shade = lerp(shade, 0.18 + 0.82 * pouch, Math.min(1, mam[v] * 1.2));
    }
    pos[o] = x; pos[o + 1] = y; pos[o + 2] = z;
    ao[v] = Math.pow(Math.max(shade, 0), 0.75);
  }
  await sheetNormals(ctx, S);     // smooth normals of the finished sheet (replaces a whole-mesh computeVertexNormals)
}

function makeOut(sheetSizes) {
  let nv = 0, nt = 0;
  for (const [ni, nj, wrap] of sheetSizes) { nv += (ni + 1) * (wrap ? nj : nj + 1); nt += ni * nj * 2; }
  return { pos: new Float32Array(nv * 3), nor: new Float32Array(nv * 3), ao: new Float32Array(nv), boil: new Float32Array(nv), cw: new Float32Array(nv), idx: new Uint32Array(nt * 3), nv: 0, ni: 0 };
}

async function appendSheet(ctx, S, out, skip) {
  const base = out.nv, { ni, nj, wrap, cols } = S;
  out.pos.set(S.pos, base * 3); out.nor.set(S.nor, base * 3); out.ao.set(S.ao, base); out.boil.set(S.boil, base); out.cw.set(S.cw, base);
  out.nv += S.nv;
  const idx = out.idx; let n = out.ni;
  for (let i = 0; i < ni; i++) {
    if ((i & 7) === 7) await ctx.yield();
    for (let j = 0; j < nj; j++) {
      if (skip && skip(i, j)) continue;
      const j1 = wrap ? (j + 1) % nj : j + 1;
      const a = base + i * cols + j, b = base + (i + 1) * cols + j, c = base + i * cols + j1, d = base + (i + 1) * cols + j1;
      idx[n++] = a; idx[n++] = b; idx[n++] = c; idx[n++] = b; idx[n++] = d; idx[n++] = c;
    }
  }
  out.ni = n;
}

// The storm itself: main body (stalk -> fillet -> mammatus underside -> rim -> top, one wrapped sheet), the
// shoulder tower and the saddle between them. Returns the merged geometry and where puffs may sit.
async function buildStorm(ctx, P) {
  const N = ctx.noise, rng = P.rng;
  const env = { N, off: rng.range(0, 40), lobes: P.lobes, mcell: P.mcell, mseed: rng.int(1, 1e6), lineDist: P.lineDist, minClear: 44, band: 48 };
  const o1 = rng.range(0, 50), o2 = rng.range(0, 50);
  const lineDist = P.lineDist;

  // ---- main body
  const rows = [];
  const seg = (kind, n, last) => { for (let k = 0; k < n; k++) rows.push([kind, last ? k / (n - 1) : k / n]); };
  seg(0, Math.round(84 * P.res)); seg(1, 22); seg(2, 34); seg(3, 8); seg(4, 10, true);   // the top is never seen from above: 10 rows
  const nj = Math.round(20 * P.res) * 16, body = makeSheet(rows.length - 1, nj, true);
  const SI = Math.round(80 * P.res), SJ = Math.round(48 * P.res), TJ = Math.round(144 * P.res), NH = Math.round(74 * P.res * P.res), NC = 14;
  const n0 = Math.round(84 * P.res), FJ0 = Math.round(nj * 0.305), FJ1 = Math.round(nj * 0.86), FW = FJ1 - FJ0, FR = 44;   // the fillet patch (below)
  const sizes = [[rows.length - 1, nj, true], [52, 128, true], [SI, SJ, false], [FR, FW, false], [Math.round(32 * P.res), TJ, true]];
  for (let k = 0; k < NH; k++) sizes.push([10, 16, true]);
  for (let k = 0; k < NC; k++) sizes.push([9, 14, true]);
  const out = makeOut(sizes);
  const yU0 = P.yUnder, tk = 46;
  const rs = (y, c, s) => (252 + 100 * Math.exp(-Math.max(y, 0) / 150)) * (1 + 0.08 * N.n3(c * 1.2 + o1, y / 210, s * 1.2)) * (1 - 0.1 * smoothstep(0.7, 0.92, -s) * smoothstep(120, 260, y));
  const cxAt = (y) => P.shear * Math.pow(clamp(y / 560, 0, 1), 1.6);
  for (let j = 0; j < nj; j++) {
    if ((j & 3) === 3) await ctx.yield();
    const th = (j / nj) * TAU, c = Math.cos(th), s = Math.sin(th), ce = Math.max(c, 0);
    const Rrim = (400 + P.reach * Math.pow(ce, 1.3) + 80 * Math.max(-s, 0) * (1 - ce)) * (1 + 0.06 * N.n3(c * 1.7, s * 1.7, o2)) + 55 * ce * N.n3(c * 5, s * 5, o2 + 9);
    const rT = rs(400, c, s);
    const fil = Math.min(210, (Rrim - rT - 30) * 0.8), filH = Math.max(50, fil * 0.95), y0 = yU0 - filH;
    const yRimC = yU0 + 40 + tk / 2;
    for (let i = 0; i < rows.length; i++) {
      const kind = rows[i][0], f = rows[i][1], v = i * nj + j;
      let rho, y, w, m = 0, bl;
      if (kind === 0) { y = f < 0.1 ? lerp(-150, 0, f / 0.1) : lerp(0, y0, (f - 0.1) / 0.9); rho = lerp(rs(y, c, s), rT, smoothstep(300, y0, y)) + Math.max(-y, 0) * 0.9; w = 1; bl = 0.35 + 0.5 * smoothstep(60, 320, y); }
      else if (kind === 1) { const a = f * Math.PI / 2; rho = rT + fil * (1 - Math.cos(a)); y = y0 + filH * Math.sin(a); w = lerp(1, 0.3, f); m = smoothstep(0.55, 1, f) * 0.7; bl = 0.5; }
      else if (kind === 2) { rho = lerp(rT + fil, Rrim - tk / 2, Math.pow(f, 0.9)); y = yU0 + 40 * f; w = 0.2; m = (0.7 + 0.3 * smoothstep(0, 0.3, f)) * (1 - smoothstep(0.82, 1, f)); bl = 0.2; }
      else if (kind === 3) { const a = -Math.PI / 2 + f * Math.PI; rho = Rrim - tk / 2 + (tk / 2) * Math.cos(a); y = yRimC + (tk / 2) * Math.sin(a); w = 0.45; bl = 0.35; }
      else { rho = (Rrim - tk / 2) * (1 - f); y = yRimC + tk / 2 + 24 * (1 - (rho / Rrim) * (rho / Rrim)) + P.overshoot * Math.exp(-(rho * rho) / (170 * 170)); w = 0.45 * (1 - smoothstep(0.9, 1, f)) + 0.05; bl = 0.3; }
      const cx = cxAt(y);
      body.pos[v * 3] = cx + rho * c; body.pos[v * 3 + 1] = y; body.pos[v * 3 + 2] = rho * s;
      body.cw[v] = w; body.mam[v] = m; body.boil[v] = bl;
    }
  }
  await ctx.yield();
  await shapeSheet(ctx, body, env); await appendSheet(ctx, body, out, (i, j) => i >= n0 && i < n0 + 22 && j >= FJ0 && j < FJ1);
  await ctx.yield();

  // ---- shoulder tower (a cumulus congestus turret with a boiling dome)
  const sh = makeSheet(52, 128, true), SH = P.shoulder;
  for (let j = 0; j < 128; j++) {
    if ((j & 15) === 15) await ctx.yield();
    const th = (j / 128) * TAU, c = Math.cos(th), s = Math.sin(th);
    const wob = 1 + 0.09 * N.n3(c * 1.4, s * 1.4, o1 + 20);
    for (let i = 0; i <= 52; i++) {
      const v = i * 128 + j; let rho, y;
      if (i <= 28) { const f = i / 28; y = lerp(15, SH.y0, f); rho = SH.r * lerp(1.28, 1, Math.pow(f, 0.7)); }
      else { const a = ((i - 28) / 24) * Math.PI / 2; rho = SH.r * Math.cos(a); y = SH.y0 + (SH.crest - SH.y0 - 30) * Math.sin(a); }
      rho *= wob;
      sh.pos[v * 3] = SH.x + 0.07 * (y - 80) + rho * c; sh.pos[v * 3 + 1] = y; sh.pos[v * 3 + 2] = SH.z + rho * s;
      sh.cw[v] = i === 52 ? 0.3 : 1; sh.boil[v] = 0.45 + 0.55 * smoothstep(200, SH.y0 + 40, y);
    }
  }
  await ctx.yield();
  await shapeSheet(ctx, sh, { ...env, off: env.off + 13 }); await appendSheet(ctx, sh, out);
  await ctx.yield();

  // ---- (keeps the seeded stream) the floor sheet this piece had before is still shaped, only to count its lobe-top
  // vertices: the shuffle in buildHero draws once per candidate, and every seeded choice made after it (here and in
  // the world: the turret field) stays exactly as it was. 2.7k vertices, a few ms; it is never drawn.
  const xc = P.portal.x + 8, yc = P.portal.y - 44, zc = P.portal.z;
  let ghost = 0;
  {
    const g = makeSheet(76, 34, false);
    for (let i = 0; i <= 76; i++) {
      const x = lerp(-240, 480, i / 76);
      let fy = x < xc ? yc - 150 * Math.pow(smoothstep(0, 440, xc - x), 1.2) : yc - 130 * smoothstep(0, 180, x - xc);
      fy -= 330 * smoothstep(-60, -220, x) + 290 * smoothstep(340, 470, x);
      const wz = 1 - 0.6 * Math.pow(Math.max(smoothstep(-90, -240, x), smoothstep(350, 480, x)), 1.6);
      for (let j = 0; j <= 34; j++) {
        const f = j / 34, v = i * 35 + j, e = 2 * f - 1, ae = Math.abs(e);
        g.pos[v * 3] = x; g.pos[v * 3 + 1] = fy - 14 + 40 * e * e - 390 * Math.pow(smoothstep(0.62, 1, ae), 1.5); g.pos[v * 3 + 2] = -345 + (lerp(-170, SH.z + 40, f) + 345) * wz;
        g.cw[v] = 0.75; g.boil[v] = 0.5;
      }
    }
    await shapeSheet(ctx, g, { ...env, off: env.off + 29, minClear: 32, band: 22 });
    for (let v = 0; v < g.nv; v++) if (g.ao[v] > 0.6 && g.pos[v * 3 + 1] > 70 && g.pos[v * 3 + 1] < 600) ghost++;
  }
  await ctx.yield();

  // ---- the canyon floor: a height field, fine under the line and coarser where it falls away into the deck. It lies
  // 70-90 m under the line, so its own relief (three scales + a dozen big lobes) is never pressed flat by the
  // corridor, rises to the portal seat at the head of the canyon and rounds off into the haze on every side.
  const fl = makeRng('umbra-floor:' + (ctx.seed ?? 1));
  const floorY = (x, dz) => {
    let fy = x < xc ? yc - 150 * Math.pow(smoothstep(0, 440, xc - x), 1.2) - 35 * smoothstep(0, 50, xc - x) : yc - 130 * smoothstep(0, 180, x - xc);
    fy -= 200 * smoothstep(-40, -240, x) + 290 * smoothstep(340, 470, x);   // both ends go down into the deck: no free edges
    const u2 = (dz / 120) * (dz / 120), t = Math.max(Math.abs(dz) - 125, 0);
    return fy - 14 + 40 * Math.min(u2, 1.5) - 1.5 * t * t / (t + 45);
  };
  const floorLobes = [];
  for (let k = 0; k < 14; k++) {
    const x = lerp(-75, 228, (k + fl()) / 14), dz = (k & 1 ? 1 : -1) * fl.range(16, 96), r = fl.range(24, 44);
    floorLobes.push({ x, y: floorY(x, dz) - r * 0.1, z: zc + dz, r });
  }
  floorLobes.push({ x: xc - 8, y: yc - 22, z: zc + 17, r: 31 }, { x: xc - 4, y: yc - 22, z: zc - 19, r: 29 });   // the seat under the collar
  const dens = (f) => f + 0.5 * Math.sin(TAU * f) / TAU;                    // rows and columns crowd toward the middle
  const sd = makeSheet(SI, SJ, false);
  for (let i = 0; i <= SI; i++) {
    const x = lerp(-240, 480, dens(i / SI));
    const wz = 1 - 0.6 * Math.pow(Math.max(smoothstep(-90, -240, x), smoothstep(350, 480, x)), 1.6);   // round off in plan
    for (let j = 0; j <= SJ; j++) {
      const f = j / SJ, v = i * (SJ + 1) + j, dz = lerp(200, -330, dens(f)) * wz, ae = Math.abs(2 * f - 1);
      sd.pos[v * 3] = x; sd.pos[v * 3 + 1] = floorY(x, dz) - 140 * Math.pow(smoothstep(0.86, 1, ae), 1.5); sd.pos[v * 3 + 2] = zc + dz;
      sd.cw[v] = 0.75; sd.boil[v] = 0.5;
    }
  }
  await ctx.yield();
  await shapeSheet(ctx, sd, { ...env, lobes: [...P.lobes, ...floorLobes], off: env.off + 29, minClear: 32, band: 22, fine: 2.2 }); await appendSheet(ctx, sd, out);
  await ctx.yield();
  const nvSheets = out.nv;

  // ---- the fillet, where the stalk flares into the plate, built again twice as fine over the faces the camera passes
  // under (west round to the canyon): the same surface through the same shaping, welded to the body along its edges.
  // The body's own triangles there are left out of the index; its vertices stay as they were (the seeded stream
  // counts them), they are simply not drawn.
  const fp = makeSheet(FR, FW, false);
  for (let jj = 0; jj <= FW; jj++) {
    const th = ((FJ0 + jj) / nj) * TAU, c = Math.cos(th), s = Math.sin(th), ce = Math.max(c, 0);
    const Rrim = (400 + P.reach * Math.pow(ce, 1.3) + 80 * Math.max(-s, 0) * (1 - ce)) * (1 + 0.06 * N.n3(c * 1.7, s * 1.7, o2)) + 55 * ce * N.n3(c * 5, s * 5, o2 + 9);
    const rT = rs(400, c, s), fil = Math.min(210, (Rrim - rT - 30) * 0.8), filH = Math.max(50, fil * 0.95), y0 = yU0 - filH;
    for (let k = 0; k <= FR; k++) {
      const f = k / FR, a = f * Math.PI / 2, rho = rT + fil * (1 - Math.cos(a)), y = y0 + filH * Math.sin(a), v = k * (FW + 1) + jj;
      fp.pos[v * 3] = cxAt(y) + rho * c; fp.pos[v * 3 + 1] = y; fp.pos[v * 3 + 2] = rho * s;
      fp.cw[v] = lerp(1, 0.3, f); fp.mam[v] = smoothstep(0.55, 1, f) * 0.7; fp.boil[v] = 0.5;
    }
  }
  await ctx.yield();
  await shapeSheet(ctx, fp, env);
  for (let k = 0; k <= FR; k++) for (let jj = 0; jj <= FW; jj += (k === 0 || k === FR ? 1 : FW)) {   // weld the four edges
    const v = k * (FW + 1) + jj, j = (FJ0 + jj) % nj, ia = n0 + (k >> 1), ib = n0 + ((k + 1) >> 1), a = ia * nj + j, b = ib * nj + j;
    for (let q = 0; q < 3; q++) { fp.pos[v * 3 + q] = (body.pos[a * 3 + q] + body.pos[b * 3 + q]) * 0.5; fp.nor[v * 3 + q] = (body.nor[a * 3 + q] + body.nor[b * 3 + q]) * 0.5; }
    fp.ao[v] = (body.ao[a] + body.ao[b]) * 0.5; fp.boil[v] = (body.boil[a] + body.boil[b]) * 0.5;
  }
  await appendSheet(ctx, fp, out);
  await ctx.yield();

  // ---- the portal's collar: a wreath of cauliflower round the seat (a torus sheet, heavier underneath), lobes on
  // lobes from the same creased noise at 8.5 / 4 / 2.1 m, shaded like the walls. Its inner face keeps 10.6 m from the
  // portal's axis; its seam is at the back of the tube, where it is never seen.
  const po = P.portal, axx = Math.cos(P.climb), axy = Math.sin(P.climb), upx = -axy, upy = axx;
  const TI = Math.round(32 * P.res), tor = makeSheet(TI, TJ, true), cr = makeRng('umbra-collar:' + (ctx.seed ?? 1)), tl = [];
  const ringAt = (a) => { const ca = Math.cos(a), sa = Math.sin(a), low = Math.max(0, -sa); return { ca, sa, low, Rm: 17 + 2.4 * low + 1.3 * N.n3(ca * 1.6 + o1, sa * 1.6, o2), rt: 5 + 2.6 * low + 0.8 * N.n3(ca * 2.3, sa * 2.3 + o2, o1), back: 2.5 + 2.5 * low }; };
  for (let k = 0; k < 46; k++) {   // heads on the wreath itself: round lobes 4-9 m across, most of them on the side the camera sees
    const g = ringAt((k + cr()) / 46 * TAU), b = cr.range(0.2, 1.25) * Math.PI, cb = Math.cos(b), sb = Math.sin(b), rdx = upx * g.sa, rdy = upy * g.sa, r = cr.range(2.1, 4.4) * (1 + 0.35 * g.low);
    const tx = axx * cb + rdx * sb, ty = axy * cb + rdy * sb, tz = g.ca * sb, rr = g.rt * 1.08;
    tl.push({ x: po.x + axx * g.back + rdx * g.Rm + tx * rr, y: po.y + axy * g.back + rdy * g.Rm + ty * rr, z: po.z + g.ca * g.Rm + tz * rr, r });
  }
  for (let j = 0; j < (P.ring ? TJ : 0); j++) {
    if ((j & 7) === 7) await ctx.yield();
    const g = ringAt((j / TJ) * TAU), ca = g.ca, sa = g.sa, Rm = g.Rm, rt = g.rt, back = g.back;
    const rdx = upx * sa, rdy = upy * sa, rdz = ca;                              // outward from the axis, in the ring's plane
    const cx = po.x + axx * back + rdx * Rm, cy = po.y + axy * back + rdy * Rm, cz = po.z + rdz * Rm;
    for (let i = 0; i <= TI; i++) {
      const b = (i / TI) * TAU, cb = Math.cos(b), sb = -Math.sin(b);
      const tx = axx * cb + rdx * sb, ty = axy * cb + rdy * sb, tz = rdz * sb;   // round the tube, starting at its back
      const bx = cx + tx * rt, by = cy + ty * rt, bz = cz + tz * rt;
      const n1 = sab(N.n3(bx / 7.5 + o1, by / 7.5, bz / 7.5)), n2 = sab(N.n3(bx / 3.6, by / 3.6 + o1, bz / 3.6));
      let d = rt * (0.34 * n1 + 0.17 * n2), shade = n1 * 0.95 + n2 * 0.7 + 0.1;
      for (let k = 0; k < tl.length; k++) {
        const L = tl[k], lx = bx - L.x, ly = by - L.y, lz = bz - L.z, rr = (lx * lx + ly * ly + lz * lz) / (L.r * L.r);
        if (rr < 1) { const h = Math.sqrt(1 - rr); d += L.r * 0.62 * h; shade += 0.3 * h; }
      }
      d *= lerp(0.3, 1, smoothstep(-0.6, 0.3, sb));                               // lobes that face the axis stay short
      let x = bx + tx * d, y = by + ty * d, z = bz + tz * d;
      const rx = x - po.x, ry = y - po.y, rz = z - po.z, al = rx * axx + ry * axy, qx = rx - axx * al, qy = ry - axy * al, ql = Math.max(Math.hypot(qx, qy, rz), 1e-3);
      const k = (10.9 + Math.log(1 + Math.exp(Math.min((ql - 10.9) * 2, 40))) / 2) / ql;   // a smooth floor on the distance to the axis
      x = po.x + axx * al + qx * k; y = po.y + axy * al + qy * k; z = po.z + rz * k;
      const v = i * TJ + j;
      tor.pos[v * 3] = x; tor.pos[v * 3 + 1] = y; tor.pos[v * 3 + 2] = z;
      tor.ao[v] = 0.22 + 0.78 * Math.pow(clamp(shade, 0, 1), 0.75); tor.boil[v] = 0.05;
    }
  }
  if (P.ring) { await sheetNormals(ctx, tor); await appendSheet(ctx, tor, out, (i) => i < 4 || i >= TI - 4); }   // the back of the tube is never seen: not drawn
  await ctx.yield();

  // ---- heads: separate round cauliflower bodies, half sunk in the canyon's floor and both its walls (seeded on the
  // finished sheets, none nearer than 36 m to the line), a few under the collar and a ragged dozen round it
  const hr = makeRng('umbra-heads:' + (ctx.seed ?? 1)), heads = [];
  for (let k = 0; k < 9000 && heads.length < NH; k++) {
    if ((k & 511) === 511) await ctx.yield();
    const v = Math.floor(hr() * nvSheets), o = v * 3, x = out.pos[o], y = out.pos[o + 1], z = out.pos[o + 2], r1 = hr(), r2 = hr(), r3 = hr();
    if (out.cw[v] < 0.4 || x < -165 || x > po.x + 30 || Math.abs(z - zc) > 175) continue;
    const ly = P.lineY(x);
    if (y < ly - 125 || y > ly + 80) continue;
    const dl = lineDist(x, y, z);
    if (dl < 44 || dl > 160) continue;
    let R = lerp(9, 14, r1) + 11 * smoothstep(60, 135, dl) * r2, cx = 0, cy = 0, cz = 0, ok = false;
    for (let t = 0; t < 4; t++) {
      cx = x - out.nor[o] * R * 0.35; cy = y - out.nor[o + 1] * R * 0.35 + R * 0.08; cz = z - out.nor[o + 2] * R * 0.35;
      if (lineDist(cx, cy, cz) - R * 1.42 >= 36) { ok = true; break; }
      R *= 0.82;
    }
    if (!ok) continue;
    for (const h of heads) { const q = 0.62 * (R + h.R), ex = cx - h.x, ey = cy - h.y, ez = cz - h.z; if (ex * ex + ey * ey + ez * ez < q * q) { ok = false; break; } }
    if (!ok) continue;
    heads.push({ x: cx, y: cy, z: cz, R, off: r3 * 50, ni: dl < 95 || R > 15 ? 10 : 8, nj: dl < 95 || R > 15 ? 16 : 13, boil: 0.22 });
  }
  for (let k = 0; k < (P.ring ? NC : 0); k++) {
    const under = k < 4, a = under ? -Math.PI / 2 + (k - 1.5) * 0.44 + hr.range(-0.08, 0.08) : hr.range(0, TAU), sa = Math.sin(a), low = Math.max(0, -sa);
    const R = under ? hr.range(8.5, 11) : hr.range(3, 5.2), rad = under ? 18 + R * 1.05 : 17 + 2.4 * low + (5 + 2.6 * low) * hr.range(0.7, 1.15) + R * 0.25, back = under ? hr.range(3, 9) : 2.5 + 2.5 * low + hr.range(-1.5, 3.5);
    heads.push({ x: po.x + axx * back + upx * sa * rad, y: po.y + axy * back + upy * sa * rad, z: po.z + Math.cos(a) * rad, R, off: hr.range(0, 50), ni: 9, nj: 14, boil: under ? 0.12 : 0.05 });
  }
  // (written straight into the merged buffers: no sheet of its own, nothing for the collector)
  for (let k = 0; k < heads.length; k++) {
    const h = heads[k], q = 1 / h.R, base = out.nv, ni = h.ni, nj = h.nj, P3 = out.pos, Q3 = out.nor;
    for (let i = 0; i <= ni; i++) {
      const la = lerp(-0.8, Math.PI / 2, i / ni), cl = Math.cos(la), sl = Math.sin(la);
      for (let j = 0; j < nj; j++) {
        const th = (j / nj) * TAU, dx = cl * Math.cos(th), dz = cl * Math.sin(th), v = base + i * nj + j;
        const px = h.x + dx * h.R, py = h.y + sl * h.R * 0.94, pz = h.z + dz * h.R;
        const a = sab(N.n3(px * q * 0.95 + h.off, py * q * 1.2, pz * q * 0.95)), b = sab(N.n3(px * q * 2.1, py * q * 2.5 + h.off, pz * q * 2.1));
        const d = h.R * (0.36 * a + (nj > 14 ? 0.15 : 0.08) * b);
        P3[v * 3] = px + dx * d; P3[v * 3 + 1] = py + sl * d; P3[v * 3 + 2] = pz + dz * d;
        out.ao[v] = 0.3 + 0.7 * Math.pow(clamp(a * 0.95 + b * 0.7 + 0.12, 0, 1), 0.75) * (0.66 + 0.34 * smoothstep(-0.5, 0.45, sl)); out.boil[v] = h.boil;
      }
    }
    for (let i = 0; i <= ni; i++) {
      const ia = Math.max(i - 1, 0), ib = Math.min(i + 1, ni);
      for (let j = 0; j < nj; j++) {
        const a = (base + i * nj + (j + nj - 1) % nj) * 3, b = (base + i * nj + (j + 1) % nj) * 3, c = (base + ia * nj + j) * 3, d = (base + ib * nj + j) * 3, o = (base + i * nj + j) * 3;
        const ux = P3[b] - P3[a], uy = P3[b + 1] - P3[a + 1], uz = P3[b + 2] - P3[a + 2], vx = P3[d] - P3[c], vy = P3[d + 1] - P3[c + 1], vz = P3[d + 2] - P3[c + 2];
        let nx = vy * uz - vz * uy, ny = vz * ux - vx * uz, nz = vx * uy - vy * ux; const l = Math.hypot(nx, ny, nz);
        if (l < 1e-6) { nx = 0; ny = 1; nz = 0; } else { nx /= l; ny /= l; nz /= l; }
        Q3[o] = nx; Q3[o + 1] = ny; Q3[o + 2] = nz;
      }
    }
    let n = out.ni; const idx = out.idx;
    for (let i = 0; i < ni; i++) for (let j = 0; j < nj; j++) {
      const j1 = (j + 1) % nj, a = base + i * nj + j, b = base + (i + 1) * nj + j, c = base + i * nj + j1, d = base + (i + 1) * nj + j1;
      idx[n++] = a; idx[n++] = b; idx[n++] = c; idx[n++] = b; idx[n++] = d; idx[n++] = c;
    }
    out.ni = n; out.nv += (ni + 1) * nj;
    if ((k & 7) === 7) await ctx.yield();
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(out.pos.subarray(0, out.nv * 3), 3));
  geo.setAttribute('normal', new THREE.BufferAttribute(out.nor.subarray(0, out.nv * 3), 3));
  geo.setAttribute('aO', new THREE.BufferAttribute(out.ao.subarray(0, out.nv), 1));
  geo.setAttribute('aBoil', new THREE.BufferAttribute(out.boil.subarray(0, out.nv), 1));
  geo.setIndex(new THREE.BufferAttribute(out.idx.subarray(0, out.ni), 1));
  geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(350, 330, -40), 1300);
  return { geo, cw: out.cw, nvOld: nvSheets - sd.nv, ghost, heads };
}

// ---------------------------------------------------------------------------------------------------------------
export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng, detail = ctx.quality?.detail ?? 1;
  const pal = (Array.isArray(opts.palette) && opts.palette.length >= 7 ? opts.palette : PALETTE).map((h) => new THREE.Color(h));
  const C = (h, k = 1) => new THREE.Color(h).multiplyScalar(k);
  const sunElev = (opts.sunElev ?? 26) * D2R, sunAz = (opts.sunAz ?? 8) * D2R, lean = 1 / Math.tan(sunElev);
  const sunDir = new THREE.Vector3(-Math.sin(sunAz) * Math.cos(sunElev), Math.sin(sunElev), -Math.cos(sunAz) * Math.cos(sunElev));
  const sunR = new THREE.Vector3().crossVectors(sunDir, new THREE.Vector3(0, 1, 0)).normalize();
  const sunU = new THREE.Vector3().crossVectors(sunR, sunDir).normalize();
  const contactS = opts.contactS ?? 940, frontPerU = opts.frontPerU ?? 7700, skyDist = opts.skyDist ?? 3600, deckY = opts.deckY ?? 10;

  // ---- the camera line (local): approach, quarter turn round the stalk, straight climb up the canyon
  const portal = new THREE.Vector3(250, 405 + rng.range(-6, 6), -335);
  const climb = 20 * D2R, cStart = new THREE.Vector3(-17, portal.y - 267 * Math.tan(climb), -335);
  const canyonLine = [], flankArc = [];
  for (let i = 0; i <= 6; i++) canyonLine.push(new THREE.Vector3().lerpVectors(cStart, portal, i / 6));
  const yArc0 = cStart.y - 53;
  for (let i = 0; i <= 9; i++) { const f = i / 9, a = Math.PI * (1 + 0.5 * f); flankArc.push(new THREE.Vector3(-17 + 345 * Math.cos(a), yArc0 + 53 * Math.pow(f, 3.2), 10 + 345 * Math.sin(a))); }
  const approach = [new THREE.Vector3(-362, yArc0 - 50, 560), new THREE.Vector3(-362, yArc0 - 26, 300)];
  const flyThrough = [...approach, ...flankArc, ...canyonLine.slice(1)];
  const beyond = portal.clone().add(new THREE.Vector3(Math.cos(climb), Math.sin(climb), 0).multiplyScalar(90));
  const lineDist = makeLine([...flyThrough, beyond]);

  // ---- per-seed storm
  const shear = rng.range(90, 130);
  const P = {
    rng, lineDist, portal, shear, climb, ring: opts.portalRing !== false, lineY: (x) => cStart.y + (x - cStart.x) * Math.tan(climb), res: Math.sqrt(clamp(detail, 0.5, 1)), reach: rng.range(640, 760), yUnder: 540, overshoot: rng.range(35, 65), mcell: rng.range(72, 96),
    shoulder: { x: 115 + rng.range(-12, 12), z: -578, r: 150 * rng.range(0.95, 1.05), y0: 330, crest: rng.range(455, 480) }, lobes: [],
  };
  const nLobe = rng.int(7, 10);
  for (let i = 0; i < nLobe; i++) { const a = rng.range(0, TAU), y = rng.range(110, 470); P.lobes.push({ x: shear * Math.pow(y / 560, 1.6) + Math.cos(a) * 262, y, z: Math.sin(a) * 262, r: rng.range(70, 115) }); }
  for (let i = 0; i < 3; i++) { const a = rng.range(0, TAU), y = rng.range(290, 400); P.lobes.push({ x: P.shoulder.x + Math.cos(a) * 118, y, z: P.shoulder.z + Math.sin(a) * 118, r: rng.range(60, 90) }); }

  // ---- corona, prominences (per seed)
  const clock = (h) => Math.PI / 2 - h * (Math.PI / 6), jit = (k) => rng.range(-k, k);
  const kind = opts.corona || rng.pick(['minimum', 'minimum', 'maximum', 'skewed']);
  const str = [];
  if (kind === 'maximum') {
    const n = rng.int(7, 9), a0 = rng.range(0, TAU);
    for (let i = 0; i < n; i++) str.push([a0 + (i / n) * TAU + jit(0.16), rng.range(3.6, 6.2), rng.range(0.2, 0.3), rng.range(0.7, 1)]);
  } else if (kind === 'skewed') {
    str.push([clock(3.5) + jit(0.1), 6.6, 0.4, 1], [clock(9) + jit(0.1), 5.2, 0.36, 0.9], [clock(12.6) + jit(0.1), 4.4, 0.3, 0.8]);
    str.push([clock(6.2) + jit(0.1), 2.7, 0.5, 0.5], [clock(1.8) + jit(0.1), 2.5, 0.35, 0.4]);
  } else {
    str.push([clock(4) + jit(0.07), 6.0, 0.42, 1], [clock(10) + jit(0.07), 6.67, 0.42, 0.95], [clock(1) + jit(0.08), 3.9, 0.3, 0.72]);
    str.push([clock(12.1) + jit(0.08), 2.8, 0.5, 0.55], [clock(6.9) + jit(0.08), 2.8, 0.55, 0.6]);
  }
  while (str.length < 9) str.push([0, 4, 1, 0]);
  const proms = [], nProm = clamp(opts.prominences ?? rng.int(2, 5), 0, 5), pa0 = rng.range(0, TAU);
  for (let i = 0; i < 5; i++) proms.push(i < nProm ? [pa0 + (i / nProm) * TAU + jit(0.45), [0, 1, 2, 1, 0][i], rng.range(0.55, 0.9), 1] : [0, 0, 0.5, 0]);

  // ---- shared uniforms
  const V4 = (a) => new THREE.Vector4(a[0], a[1], a[2], a[3]);
  const U = {
    uUmbra: { value: new THREE.Vector4(-1e5, -2e5, lean, 0) }, uSunDir: { value: sunDir }, uTime: { value: 0 }, uOrg: { value: new THREE.Vector3() },
    uSkyA: { value: [C('#0E2A66'), pal[0].clone(), C('#9DB4D6'), pal[2].clone()] },
    uSkyB: { value: [C('#1C1B38'), pal[3].clone(), C('#C9705A'), pal[5].clone(), C('#FFB36B')] },
    uCam: { value: new THREE.Vector4(0, 1, 0, 0) }, uDomeE: { value: new THREE.Vector2() },
    uKey: { value: new THREE.Color(1.0, 1.03, 1.1) }, uGold: { value: new THREE.Color(1.05, 0.8, 0.48) },
    uShade: { value: C('#4E6FA8') }, uWarm: { value: C('#8A5A4E') }, uCool: { value: C('#5A5880') }, uPearl: { value: pal[4].clone() },
    uBoltCol: { value: C('#C9C4FF', 1.5) }, uBolt: { value: [new THREE.Vector4(), new THREE.Vector4(), new THREE.Vector4()] }, uSeat: { value: new THREE.Vector4() }, uOwn: { value: new THREE.Vector4(0, 0, 1, 0) },
    uHgt: { value: new THREE.Vector4(0, 1 / 640, deckY, opts.hazeMix ?? 1) }, uOccA: { value: new THREE.Vector4() }, uOccB: { value: new THREE.Vector4() },
    uSunR: { value: sunR }, uSunU: { value: sunU }, uSkyDist: { value: skyDist },
    uSunA: { value: new THREE.Vector4(0.7, 0, 0, 0) }, uDia: { value: new THREE.Vector4(0, 0, 0, 0) }, uCdir: { value: new THREE.Vector2(-0.7071, 0.7071) },
    uStr: { value: str.map(V4) }, uProm: { value: proms.map(V4) }, uRose: { value: pal[6].clone() }, uPx: { value: 1 }, uStar: { value: 0 }, uSoftK: { value: opts.soft ?? 0.2 },
  };
  const pick = (...names) => { const o = {}; for (const n of names) o[n] = U[n]; return o; };
  const shared = ['uUmbra', 'uSunDir', 'uTime', 'uOrg', 'uSkyA', 'uSkyB', 'uCam'];
  const cloudU = [...shared, 'uKey', 'uGold', 'uShade', 'uWarm', 'uCool', 'uPearl', 'uBoltCol', 'uBolt', 'uSeat', 'uOwn', 'uHgt', 'uOccA', 'uOccB', 'uSoftK'];
  const withFog = (o) => Object.assign(THREE.UniformsUtils.clone(THREE.UniformsLib.fog), o);
  // o.hgt: a THREE.Vector4 the caller owns (x world y of the base, y 1/height, z world y where the cloud melts into haze, w haze mix)
  const cloudUniforms = (o = {}) => { const u = withFog(pick(...cloudU)); if (o.hgt) u.uHgt = { value: o.hgt }; if (o.soft != null) u.uSoftK = { value: o.soft }; if (o.override) Object.assign(u, o.override); return u; };
  const makeCloudMaterial = (o = {}) => new THREE.ShaderMaterial({ vertexShader: CLOUD_VERT, fragmentShader: CLOUD_FRAG, uniforms: cloudUniforms(o), fog: true, defines: { LOBE3: detail >= 0.99 && o.lobe3 !== false ? 1 : 0 } });

  const object = new THREE.Group(); object.name = 'the-umbra';

  // ---- dome, stars, sun
  const dome = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 3), new THREE.ShaderMaterial({ vertexShader: DOME_VERT, fragmentShader: DOME_FRAG, uniforms: pick(...shared, 'uDomeE'), side: THREE.BackSide, depthTest: false, depthWrite: false }));
  dome.renderOrder = -0.5; dome.frustumCulled = false; object.add(dome);

  const nStar = 58, sp = new Float32Array((nStar + 2) * 3), sa = new Float32Array((nStar + 2) * 3), tv = new THREE.Vector3();
  for (let i = 0; i < nStar + 2; i++) {
    if (i === 0) { tv.copy(sunDir).addScaledVector(sunR, 0.187).addScaledVector(sunU, -0.165).normalize(); sa.set([5.5, 5, -1], 0); }                // Venus, 14 degrees lower right
    else if (i === 1) { tv.copy(sunDir).addScaledVector(sunR, -1.1).addScaledVector(sunU, 0.2).normalize(); sa.set([4.2, 2.6, -1], 3); }            // Jupiter, far left
    else {
      do { const a = rng.range(0, TAU), y = rng.range(0.1, 0.98), h = Math.sqrt(1 - y * y); tv.set(Math.cos(a) * h, y, Math.sin(a) * h); } while (tv.dot(sunDir) > 0.955);
      const m = Math.pow(rng(), 2.2); sa.set([2 + 1.6 * m, 0.3 + 1.5 * m, rng()], i * 3);
    }
    sp.set([tv.x, tv.y, tv.z], i * 3);
  }
  const starGeo = new THREE.BufferGeometry();
  starGeo.setAttribute('position', new THREE.BufferAttribute(sp, 3)); starGeo.setAttribute('aS', new THREE.BufferAttribute(sa, 3));
  const stars = new THREE.Points(starGeo, new THREE.ShaderMaterial({ vertexShader: STAR_VERT, fragmentShader: STAR_FRAG, uniforms: pick('uTime', 'uSkyDist', 'uPx', 'uStar', 'uPearl'), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  stars.renderOrder = -6; stars.frustumCulled = false; object.add(stars);

  const sun = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({
    vertexShader: SUN_VERT, fragmentShader: SUN_FRAG, uniforms: pick('uSunDir', 'uSunR', 'uSunU', 'uSkyDist', 'uSunA', 'uDia', 'uCdir', 'uStr', 'uProm', 'uPearl', 'uRose', 'uTime'),
    transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor }));
  sun.renderOrder = -5; sun.frustumCulled = false; object.add(sun);
  await ctx.yield();

  // ---- the storm
  const { geo, cw, nvOld, ghost, heads } = await buildStorm(ctx, P);
  const cloudMat = makeCloudMaterial();
  const storm = new THREE.Mesh(geo, cloudMat); storm.frustumCulled = false; object.add(storm);
  await ctx.yield();

  // ---- fringe puffs on lobe tops (more of them, and smaller, near the camera line) + the wreath round the portal seat
  const gp = geo.attributes.position, gn = geo.attributes.normal, gao = geo.attributes.aO;
  const cand = [], wantFringe = (opts.fringe ?? 0) > 0;
  let nCand = ghost;                                   // + the old floor's share of the shuffle (see buildStorm)
  await ctx.yield();
  for (let v = 0; v < nvOld; v++) { if ((v & 8191) === 8191) await ctx.yield(); if (cw[v] >= 0.45 && gao.getX(v) > 0.6 && gp.getY(v) > 70 && gp.getY(v) < 600) { nCand++; if (wantFringe) cand.push(v); } }
  // the shuffle draws once per candidate after the first; with no fringe asked for only the draws are taken, so the
  // seeded stream stays in step (every later choice, here and in the world, is as it always was) without the work
  if (wantFringe) { for (let k = 0; k < ghost; k++) cand.push(-1); rng.shuffle(cand); } else for (let i = nCand - 1; i > 0; i--) rng();
  await ctx.yield();
  // (the fringe draws from its own stream, so asking for it does not move any other seeded choice)
  const want = Math.round((opts.fringe ?? 0) * detail), pp = [], ps = [], pn = [], fr = makeRng('umbra-fringe:' + (ctx.seed ?? 1));
  for (let k = 0; k < cand.length && pp.length / 3 < want; k++) {
    if ((k & 255) === 255) await ctx.yield();
    const v = cand[k]; if (v < 0) continue;
    const x = gp.getX(v), y = gp.getY(v), z = gp.getZ(v), d = lineDist(x, y, z);
    if (d > 420) continue;
    if (d > 190 && fr() > 0.3) continue;
    const sz = d < 110 ? fr.range(5, 10) : d < 300 ? fr.range(9, 16) : fr.range(14, 24);
    if (d - sz * 0.85 < 40) continue;
    pp.push(x + gn.getX(v) * sz * 0.1, y + gn.getY(v) * sz * 0.1, z + gn.getZ(v) * sz * 0.1); ps.push(sz, fr()); pn.push(gn.getX(v), gn.getY(v), gn.getZ(v));
  }
  // (the collar and the canyon floor used to carry impostor cloudlets here: they are sculpted geometry now, see
  // buildStorm. The collar's old draws are still taken so that every later seeded choice stays as it was.)
  const seatN = new THREE.Vector3(-Math.cos(climb), -Math.sin(climb), 0);
  if (opts.portalRing !== false) for (let i = 0; i < 220; i++) rng();
  if (!ps.length) { pp.push(0, 120, 0); ps.push(1, 0); pn.push(0, 1, 0); }   // one puff buried in the stalk keeps the mesh and its program alive
  // makePuffs(pos, nrm, sz, o): a set of impostor puffs lit like the storm (pos/nrm xyz per puff, sz = size, seed per
  // puff; o.hgt as for makeCloudMaterial). One draw call, 2 triangles a puff. The world uses it for its own turrets.
  function makePuffs(pos, nrm, sz, o = {}) {
    const g = new THREE.InstancedBufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0]), 3));
    g.setIndex([0, 1, 2, 0, 2, 3]);
    g.setAttribute('aPos', new THREE.InstancedBufferAttribute(new Float32Array(pos), 3));
    g.setAttribute('aNrm', new THREE.InstancedBufferAttribute(new Float32Array(nrm), 3));
    g.setAttribute('aSz', new THREE.InstancedBufferAttribute(new Float32Array(sz), 2));
    g.instanceCount = sz.length / 2;
    const m = new THREE.Mesh(g, new THREE.ShaderMaterial({ vertexShader: PUFF_VERT, fragmentShader: PUFF_FRAG, uniforms: cloudUniforms(o), fog: true }));
    m.frustumCulled = false;
    return m;
  }
  const puffs = makePuffs(pp, pn, ps); object.add(puffs);

  // ---- anchors
  const boltsL = [new THREE.Vector3(-150, 290, -110), new THREE.Vector3(shear * 0.5 + 30, 470, 150), new THREE.Vector3(120, 385, -170)];
  const crest = new THREE.Vector3(P.shoulder.x + 26, P.shoulder.crest, P.shoulder.z);
  const center = new THREE.Vector3(60, 330, -60);
  const anchors = {
    portalSeat: { position: portal.clone(), normal: seatN.clone(), radius: 10, tilt: 20 },
    canyonLine, flankArc, flyThrough, sunDir: sunDir.clone(), sunPoint: sunDir.clone().multiplyScalar(3000).add(new THREE.Vector3(-362, 260, 200)),
    bolts: boltsL.map((b) => b.clone()), crest, cruiseY: 300,
    viewpoints: [
      { position: new THREE.Vector3(-395, 300, 1370), target: new THREE.Vector3(-330, 290, 0), phase: 0.0 },
      { position: new THREE.Vector3(-395, 225, 710), target: new THREE.Vector3(-380, 215, 0), phase: 0.3 },
      { position: new THREE.Vector3(-375, 232, 270), target: new THREE.Vector3(-375, 232, 270).addScaledVector(sunDir, 900).add(new THREE.Vector3(60, -120, 0)), phase: 0.5 },
      { position: flankArc[5].clone(), target: flankArc[7].clone().add(new THREE.Vector3(30, 20, 25)), phase: 0.74 },
      { position: canyonLine[2].clone(), target: portal.clone(), phase: 0.93 },
    ],
  };

  // ---- state and driving
  const state = { d2: 3000, d3: -6400, camIn: 0, open: 0, light: 1 };
  const haze = new THREE.Color(), hLit = C('#9DB4D6'), hDark = pal[5].clone().lerp(C('#C9705A'), 0.5).multiplyScalar(0.55);
  const org = new THREE.Vector3(), cl = new THREE.Vector3(), buf = new THREE.Vector2(), lv = [0, 0, 0];
  const lseed = rng.int(1, 1e9);
  const hashI = (k) => { let h = Math.imul(k ^ lseed, 2654435761); h ^= h >>> 15; h = Math.imul(h, 2246822519); h ^= h >>> 13; return (h >>> 0) / 4294967296; };
  let driven = false, F = 0, T = -3400;
  const edge = (d) => smoothstep(-130, 130, d) * (0.65 + 0.35 * smoothstep(0, 1500, d));

  function update(dt, time, camera) {
    object.updateWorldMatrix(true, false);
    org.setFromMatrixPosition(object.matrixWorld);
    cl.setFromMatrixPosition(camera.matrixWorld).sub(org);
    const sC = cl.z + lean * cl.y;
    if (!driven) { const p = (time / 40 + 0.15) % 1; F = sC - (3000 - 8400 * p); T = F - 3400; }
    const d2 = sC - F, d3 = T - sC;                       // metres to second contact, metres past third contact
    const camIn = smoothstep(600, -300, d2) * smoothstep(600, -300, d3);
    const open = smoothstep(-135, -700, d2) * smoothstep(-40, -420, d3);
    const pre = 0.65 + 0.35 * smoothstep(0, 1500, Math.max(d2, d3));
    U.uOrg.value.copy(org); U.uTime.value = time;
    U.uUmbra.value.set(F, T, lean, open);
    U.uCam.value.set(camIn, pre, d3 > -200 ? 1 : 0, 0);
    U.uDomeE.value.set(F + 40000 * smoothstep(-1500, 300, d3), T - 40000 * smoothstep(-1500, 300, d2));
    U.uHgt.value.x = org.y; U.uHgt.value.z = org.y + deckY;
    U.uOccA.value.set(P.shoulder.x + org.x, P.shoulder.y0 + org.y, P.shoulder.z + org.z, P.shoulder.r);
    U.uOccB.value.set(shear + org.x, P.yUnder + org.y, org.z, P.reach);
    U.uSkyDist.value = Math.min(skyDist, (camera.far || 6000) * 0.78);
    U.uPx.value = ctx.renderer ? ctx.renderer.getDrawingBufferSize(buf).y / 450 : 1;
    U.uStar.value = camIn * open;
    // the sun: everything follows from where the camera stands between the two edges
    const off = d2 > 0 ? 0.1 + 0.62 * Math.min(d2, 3500) / 3500 : d3 > 0 ? -(0.1 + 0.62 * Math.min(d3, 3500) / 3500) : 0.1 * (1 - 2 * clamp(-d2 / Math.max(F - T, 1), 0, 1));
    const vis = smoothstep(160, -220, d2) * smoothstep(430, -220, d3) * (0.45 + 0.55 * open);
    const chr = smoothstep(40, -40, d2) * (1 - smoothstep(-200, -300, d2)) - smoothstep(40, -40, d3) * (1 - smoothstep(-200, -300, d3));
    const i2 = smoothstep(300, 110, d2) * (1 - smoothstep(-50, -140, d2)), i3 = smoothstep(-130, -30, d3) * (1 - smoothstep(170, 420, d3));
    U.uSunA.value.set(off, vis, Math.pow(camIn, 0.6), chr);
    const sgn = i3 > i2 ? 3 : -3;
    U.uDia.value.set(U.uCdir.value.x * sgn, U.uCdir.value.y * sgn, Math.max(i2, i3), clamp((Math.abs(off) - 0.1) / 0.62, 0, 1));
    // lightning: one eased pulse at most per half-second slot, in one of three cores
    lv[0] = lv[1] = lv[2] = 0;
    const k0 = Math.floor(time / 0.5);
    for (let k = k0 - 1; k <= k0; k++) {
      if (hashI(k) > 0.62) continue;
      const t = time - (k + 0.1 + 0.3 * hashI(k * 13 + 5)) * 0.5;
      if (t <= 0 || t >= 0.42) continue;
      const e = t < 0.1 ? smoothstep(0, 0.1, t) : 1 - smoothstep(0.1, 0.4, t), w = Math.floor(hashI(k * 7 + 3) * 3);
      lv[w] = Math.max(lv[w], e * (0.55 + 0.45 * hashI(k * 3 + 1)));
    }
    if (hero.boltOverride) for (let i = 0; i < 3; i++) lv[i] = hero.boltOverride[i] ?? lv[i];
    for (let i = 0; i < 3; i++) U.uBolt.value[i].set(boltsL[i].x + org.x, boltsL[i].y + org.y, boltsL[i].z + org.z, lv[i]);
    U.uOwn.value.set(P.shoulder.x + 14 + org.x, P.shoulder.z + org.z, P.shoulder.r, 0);
    U.uSeat.value.set(portal.x + org.x, portal.y + org.y, portal.z + org.z, hero.seatGlow);
    state.d2 = d2; state.d3 = d3; state.camIn = camIn; state.open = open; state.light = Math.max(edge(d2), edge(d3));
    hero.flash = Math.max(lv[0], lv[1], lv[2]);
    haze.copy(hDark).multiplyScalar(0.5 + 0.5 * open).lerp(hLit, state.light);
  }

  const hero = {
    object, radius: 620, height: 700, center, anchors, update, ground: false, groundY: 0,
    uniforms: U, state, haze, heads: heads.length, flash: 0, boltOverride: null, seatGlow: opts.seatGlow ?? 0.35, makePuffs, makeCloudMaterial, cloudUniforms, material: cloudMat,
    setPhase(u) { driven = true; F = contactS + frontPerU * (u - 0.39); T = F - 3400; },
    setFront(front, trail) { driven = true; F = front; T = trail ?? front - 3400; },
    release() { driven = false; },
    dispose() {},
  };
  object.userData.hero = hero;
  return hero;
}
