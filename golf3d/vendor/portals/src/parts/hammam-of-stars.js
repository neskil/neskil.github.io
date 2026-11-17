// HERO SET PIECE for "hammam-of-stars": THE HOT ROOM, light being made visible.
//
// What it is
//   The whole hot room of the bathhouse as one instrument of light: an octagon 110 m across of eight pointed
//   arches in ablaq (honey limestone and basalt courses, striped voussoirs), a muqarnas ring at 32-40 m, the
//   great plaster dome (90 m across, crown 85 m) with 120 star and hexagon glass eyes, four corner chambers
//   each under a 30 m dome with 45 eyes, the wet star-and-hexagon marble floor, the heated marble platform
//   (octagon 28 m across, 2.5 m high) at the centre, the round pool (34 m across) with its kerb and channel
//   mouth, eight scalloped marble basins with brass swan-neck taps and overflow sheets, six pierced brass
//   floor grilles with steam columns, and THE FOREST: 300 leaning pencil beams, one per eye, that grow down
//   out of the descending steam layer, each laying a hard star or hexagon of light (with a blurred wet halo)
//   on floor, platform, water, wall or dome, one in ten in the accent glass colour.
//   THE STANDING FOREST: of the 300 eyes about a dozen own a principal shaft (aSel near 1): a soft-edged column of light a
//   metre and more wide, brightest where a billow of steam drifts through it, fading as the eye comes within 9 m of its axis,
//   with ONE crisp star at its foot (a patch of glints where that is water). About ten more own a pale, thinner far shaft
//   (aSel about 0.25); the rest are glass only, and keep their soft star where it falls on a wall or a dome. The shafts are
//   chosen at build (per look: the sun differs) so that they stand beside the way we fly, well apart, and so that none crosses
//   the line of sight from opts.views (camera positions along the flight, [{ p: [x,y,z], u }]) to the east arch.
//   Where a star lands on a wall or a dome it multiplies
//   the stone (a second mesh of the same program with another blend), so courses and joints show through it.
//   Water: calm, dark, glassy water over inlaid marble (the bed faint beneath, a faint net of caustics only near the eye, fine ripples),
//   mirroring the wall ahead with its arch, the portal, a fountain (uFount) and every lamp as a long amber path. Drips fall through the
//   beams as sparks, soap bubbles flash as they cross a beam, a cloud edge dims a travelling band of eyes.
//
// Frame of reference (hero-local)
//   Origin = centre of the room at floor level (the platform centre). +Y up. The camera ARRIVES FROM +Z and
//   travels toward -Z: brief "east" = -Z, brief "south" (the sun side, right of travel) = +X.
//   Brief x (metres from the entry) -> local z = 241 - x.  Octagon walls at apothem 55; arch passages are
//   8.3 m deep (to 63.3). West (entry) arch on +Z, east (exit) arch on -Z, both 20 m wide and 34 m high and
//   open; north and south arches end in a back wall (iwans); the four diagonal arches open into the corner
//   chambers (centres 74.5 m out on the diagonals). The pool is centred on (0, 34), water at y = 0.3; the
//   channel mouth (12 m wide) runs from the pool through the west arch to z = 63.3, where the world's river
//   takes over (water y 0.3, kerb top 0.6).
//
// opts
//   palette     [pearl white, pearl steam, honey stone, basalt, accent glass, copper/brass, blue-grey shade]
//   look        'noon' | 'afternoon' | 'winter'  (default: picked by seed; returned as hero.look)
//   accent      hex colour of the one-in-ten glass (default by seed: palette[4] bottle green, cobalt or amber)
//   sunElevation, sunAzimuth   degrees; azimuth 0 = sun due south (+X), positive = sun swung toward the west
//               (+Z) so light also travels east (-Z). Defaults per look: noon 66/12, afternoon 34/33, winter 57/40 (the azimuth when the forest is complete).
//               Each look also sets the rods' width and strength, how far the light may lean in the cool hall (lean), and the
//               tint of the light in the world's cool hall and warm room (uniforms.uRoomKey, uRoomAmb).
//   growFrom, growTo   journey u between which the steam layer falls from the crown to the floor (0.40, 0.57)
//   haze        multiplier on the steam haze laid over the stone (1)
//   driftRate   radians per second of sun azimuth drift (0.014: floor stars creep east at about 0.4 m/s)
//   blobs       up to 20 soft contact shadows for the floor shader, [x, z, radius, strength] each (the world's props)
//   glow        strength of the exit portal's glow mirrored down the wet floor of the recess, and of the clear
//               window the beams leave round the line of sight to the portal (0 = neither; uniforms.uGlow.xyz = its centre)
//   uniforms.uFount (x, z, landing radius, strength): a fountain standing in the water; the water shader rings it.
//   Sheets with uv.x >= 100 are drawn as threads off a scalloped lip (uv.x - 100 counts scallops, fract 0.5 = a cusp).
//
// anchors (hero-local)
//   entry        (0, 1.9, 63.3) centre of the west arch at eye height above the water
//   portalSeat   { position (0,16,-131), normal (0,0,1), width 14 }: the brief's portal at the end of the exit
//                recess (the recess itself is the world's to build; my east passage ends at z = -63.3)
//   flyThrough   ordered points: on the water through the west arch, out onto the pool, lift, 24 m left of
//                the platform at 14 m, over its east edge to 10 m right at 22 m, on the axis at 16 m, straight
//                out through the east arch. At least 6 m clear of all solids (beams are light, they fade
//                within 7 m of the eye).
//   frame57      { position, target }: the frame to remember (pool at our feet, platform, dome, east arch)
//   platformTop  (0,2.5,0), radius 14      pool { center (0,0.3,34), radius 17 }      waterY 0.3
//   basins[8], grilles[6] (steam columns stand on these), chambers[4] (centres), archE, archW
//   eastArch { width 20, height 34, z -55..-63.3 }      sunDir(): current unit direction the light travels
//
// Extra API on the returned object
//   setProgress(u)   journey progress 0..1: lowers the steam underside (beams grow), thickens the haze and
//                    starts the sun's drift. Call every frame from world.update. If it is never called (the
//                    set-piece viewer) the piece loops the growth by itself over 48 s.
//   setSteamBase(y)  direct control of the steam underside in metres (overrides setProgress until called with null)
//   setCloud(c0,c1)  the rare event: c0 0..1 sweeps a cloud over west to east (beams, eyes and stars go out
//                    in a wave), c1 0..1 uncovers them the same way. (0,0) = clear sky.
//   setSun(elevDeg, azDeg)   stoneMaterial (the shell ShaderMaterial; reusable on world geometry that has
//                    attributes position, normal, uv, aCol (vec3), aMat (float), see MAT below)   uniforms   look
//
// For the world that builds the rest of the bathhouse round this room (all share this file's programs)
//   waterMaterial, sheetMaterial   the pool water and falling-sheet materials (water is double sided: the
//                    sheets are wound facing down). addEyes(list) adds roof eyes, floor stars and beams for
//                    other rooms: { p, n, dome: [half width, east z, west z, water y or 0], gain, shape,
//                    scale, accent, rnd }; they land on that room's floor, water or north wall and are always
//                    fully grown. Call it during build; addEyes(list, { stars: false, beams: false }) adds the glass only.
//                    setCoolEyes(list) (at most maxCoolEyes, { p, shape, scale, accent }): eyes of the cool hall, whose
//                    stars the stone and water shaders throw onto whatever stands under them (uniforms.uCEye);
//                    coolSunAt(u) is the direction their light travels at journey u (leaning 24 degrees at most).
//   Named exports: makeBuilder() (merged geometry: tint, grid, lathe, build), buildCell() (one muqarnas
//   cell), archBay(b, o) (a striped pointed arch bay), basinInto / basinSheetInto / basinWaterInto,
//   ARCH, archH, and MAT: 0 ablaq, 1 plaster, 2 floor, 3 marble, 4 brass, 5 voussoir, 6 medallion,
//   7 carved band, 8 muqarnas, 9 plain (uv = sway weight, gloss), 10 cloth (uv = metres along the weave,
//   sway weight), 11 beaten metal (uv = metres round, metres up; v 10..11 = an engraved knot band).
//   The stone shader lights by region: cool hall z > 127, warm room z > 63.2, exit recess east of the east arch's passage
//   (opts.eastDepth, default 8.3: z < -63.2). opts.portalZ / portalColor: where the world's portal stands and its glow.
//   Ablaq (MAT 0) is cut stone: courses 1.25 m high in colour bands of two, thin joints, a shallow drafted margin, veins, damp.
//   East of uRecZ (the world's chamber of honour) muqarnas cells are painted turquoise and cobalt with gilt lips and glow; the wet floor
//   there carries every lamp as a long amber streak; water there mirrors the portal.
//   uniforms.uLamp[i] (x, y, z, strength; negative strength = a pair mirrored in x), at most maxLamps: hanging lamps the
//   stone and water take amber light from (uLampCol). uGlass[5]: clear, emerald, cobalt, amber, ruby glass; an eye's
//   accent is an index into it. uDeep: the blue-violet that shade, vaults, domes and unlit steam fall to.
//
// Size and cost: true extent radius about 92 (corner chambers), height 85: read them from hero.bounds.
//   radius (13) / height (-70) / center RETURNED are hints for the orbit viewer only: they keep its camera inside
//   the room and below its target, so that it looks up through the beams into the dome. Do not size anything by them.
//   About 52k triangles, 12 draw calls, no lights, no textures, build 110-220 ms in steps well under 30 ms.
//   ctx.quality.detail thins only drips, bubbles and steam puffs.
// Lighting it expects: none. Every material is a self-lit ShaderMaterial (pearl fill from the glowing steam
//   above, blue-grey shade below and in the corners, haze that thickens above the steam underside) and honours
//   scene fog. Give the world pearl fog (#E2DDD2), a visibility of about 160 m, and bloom with a threshold
//   near 1: eyes (HDR up to 6), floor stars (about 2.2), drips and bubble flashes bloom, stone stays under 0.8.
import * as THREE from 'three';

const DEFAULT_PALETTE = ['#F7F2E7', '#E2DDD2', '#D9A65C', '#2E2925', '#2F7F5C', '#B96A3B', '#7C8FA0'];
const AP = 55, DEPTH = 8.3, WALL_TOP = 32, SPRING = 40, DOME_R = 45, CH_D = 74.5, CH_R = 15, CH_SPRING = 26;
const POOL_Z = 34, POOL_R = 17, WATER_Y = 0.3, PLAT_A = 14, PLAT_H = 2.5;
const NBLOB = 20;      // contact-shadow blobs the floor shader takes (opts.blobs)
const NLAMP = 28;      // hanging lamps (and the furnace mouth) whose amber light the stone and water shaders take (uniforms.uLamp)
const NCE = 60;        // eyes of the world's cool hall whose light the stone and water shaders throw as stars (setCoolEyes)
// arch classes: 0 east/west, 1 north/south, 2 diagonal   -> [springing height, centre offset c] (half-width 10, R = 10 + c)
const ARCH = [[18, 4.8], [17, 3.45], [14, 2.2]];
const archClass = (k) => (k % 2 === 1 ? 2 : (k % 4 === 0 ? 0 : 1));
const archH = (cls, s) => { const [hs, c] = ARCH[cls], R = 10 + c, x = Math.abs(s) + c; return hs + Math.sqrt(Math.max(R * R - x * x, 0)); };
// material ids (attribute aMat) of the stone shader
// PLAIN: vertex-coloured prop, uv = (sway weight, gloss).  CLOTH: striped towel, uv = (metres along the weave, sway weight).
// METAL: hammered copper or tin, uv = (metres round, metres up; 10..11 = the engraved knotwork band)
// GLOW: lit glass behind pierced brass, uv = (metres round, 0..1 up; 2..3 = a fire behind bars), colour = the vertex colour.  TILE: a glazed tile panel, uv in metres
const MAT = { ABLAQ: 0, PLASTER: 1, FLOOR: 2, MARBLE: 3, BRASS: 4, VOUSSOIR: 5, MEDALLION: 6, CARVED: 7, MUQARNAS: 8, PLAIN: 9, CLOTH: 10, METAL: 11, GLOW: 12, TILE: 13 };

// ---------------------------------------------------------------- shared GLSL
const GLSL_COMMON = /* glsl */`
uniform vec3 uSunL;        // unit direction the light travels
uniform vec3 uSunC;        // the same in the cool hall, where the roof is low: leaning 24 degrees at most
uniform float uSteamBase;  // height of the steam underside
uniform float uTime;
uniform vec4 uCloud;       // x: z of the drifting cloud edge, y: its depth 0..0.33, z,w: rare event fronts 0..1
uniform float uDarkFrac;   // share of eyes that are dark (snow on the domes)
uniform vec3 uGlass[5];    // glass colours: 0 clear, 1 emerald, 2 cobalt, 3 amber, 4 ruby
uniform vec3 uDeep;        // the blue-violet of deep shade
float hOctD(vec2 q){ q = abs(q); return max(max(q.x, q.y), (q.x + q.y) * 0.70710678); }
float hHash(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
float hHash3(vec3 p){ p = fract(p * 0.1031); p += dot(p, p.zyx + 31.32); return fract((p.x + p.y) * p.z); }
float hNoise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(hHash(i), hHash(i + vec2(1., 0.)), f.x), mix(hHash(i + vec2(0., 1.)), hHash(i + vec2(1., 1.)), f.x), f.y); }
float hNoise3(vec3 p){ vec3 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  float a = mix(mix(hHash3(i), hHash3(i + vec3(1., 0., 0.)), f.x), mix(hHash3(i + vec3(0., 1., 0.)), hHash3(i + vec3(1., 1., 0.)), f.x), f.y);
  float b = mix(mix(hHash3(i + vec3(0., 0., 1.)), hHash3(i + vec3(1., 0., 1.)), f.x), mix(hHash3(i + vec3(0., 1., 1.)), hHash3(i + vec3(1., 1., 1.)), f.x), f.y);
  return mix(a, b, f.z); }
float hFbm(vec2 p){ return 0.5 * hNoise(p) + 0.3 * hNoise(p * 2.13 + 7.1) + 0.2 * hNoise(p * 4.31 + 3.7); }
float hCloud(float z, float rnd){
  float amb = 1. - uCloud.y * exp(-(z - uCloud.x) * (z - uCloud.x) / 700.);
  float zn = (60. - z) / 120.;
  float dark = smoothstep(-0.1, 0.1, uCloud.z * 1.2 - 0.1 - zn) * (1. - smoothstep(-0.1, 0.1, uCloud.w * 1.2 - 0.1 - zn));
  return amb * (1. - dark) * mix(1., 0.04, step(rnd, uDarkFrac));
}
float hCaustic(vec2 p){            // a net of light crawling: bright where two drifting fields agree
  float a = hNoise(p + vec2(uTime * 0.31, uTime * 0.17)), b = hNoise(p * 1.37 + 5.3 - vec2(uTime * 0.23, -uTime * 0.19));
  float c = 1. - abs(a - b); c *= c; c *= c; return c * c;
}
float hStar(vec2 p, float r){ float a = max(abs(p.x) * 0.8660254 + p.y * 0.5, -p.y), b = max(abs(p.x) * 0.8660254 - p.y * 0.5, p.y); return min(a, b) - r * 0.5; }
float hHex(vec2 p, float r){ p = abs(p); return max(p.x * 0.8660254 + p.y * 0.5, p.y) - r; }
vec4 hHexCell(vec2 p){
  const vec2 s = vec2(1., 1.7320508);
  vec4 hC = floor(vec4(p, p - vec2(0.5, 1.)) / s.xyxy) + 0.5;
  vec4 h = vec4(p - hC.xy * s, p - (hC.zw + 0.5) * s);
  return dot(h.xy, h.xy) < dot(h.zw, h.zw) ? vec4(h.xy, hC.xy) : vec4(h.zw, hC.zw + 0.5);
}
float hVor(vec2 p){                // distance between the two nearest of a field of wandering points: 0 on the net between cells
  vec2 i = floor(p), f = fract(p); float d1 = 4., d2 = 4.;
  for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) {
    vec2 g = vec2(float(x), float(y));
    vec2 o = vec2(hHash(i + g + 1.7), hHash(i + g + 23.1));
    o = 0.5 + 0.38 * sin(uTime * 1.15 + 6.2831853 * o);
    vec2 r = g + o - f; float d = dot(r, r);
    if (d < d1) { d2 = d1; d1 = d; } else if (d < d2) d2 = d;
  }
  return sqrt(d2) - sqrt(d1);
}
`;

// where a beam from eye e along L lands: returns distance t; n = surface normal there, show = 0 where no star is drawn
const GLSL_LAND = /* glsl */`
float hArchH(float cls, float s){
  float hs = cls < 0.5 ? 18. : (cls < 1.5 ? 17. : 14.), c = cls < 0.5 ? 4.8 : (cls < 1.5 ? 3.45 : 2.2);
  float R = 10. + c, x = abs(s) + c; return hs + sqrt(max(R * R - x * x, 0.));
}
float hLand(vec3 e, vec4 dome, float kind, vec3 L, out vec3 n, out float show){
  float dn = max(-L.y, 0.05);
  n = vec3(0., 1., 0.); show = 1.;
  if (kind > 1.5) {            // the world's rooms: dome = (half width, east end z, west end z, water level or 0)
    float tf = e.y / dn; vec3 pf = e + L * tf;
    if (dome.w > 0.01) { float tw2 = (e.y - dome.w) / dn; vec3 pw2 = e + L * tw2;
      if (abs(pw2.x) < 6. || hOctD(pw2.xz - vec2(0., 191.)) < 18.) { tf = tw2; pf = pw2; } }
    if (L.x < -0.001) { float tn = (e.x + dome.x) / (-L.x);
      if (tn < tf) { tf = tn; pf = e + L * tn; n = vec3(1., 0., 0.); if (pf.y > 19.) show = 0.; } }
    if (pf.z < dome.y || pf.z > dome.z) show = 0.;
    return tf;
  }
  vec3 c = vec3(dome.x, dome.w, dome.y);
  float ts = max(-2. * dot(e - c, L), 0.);                 // second crossing of the dome sphere
  vec3 ps = e + L * ts;
  if (ps.y > dome.w + 0.5) { n = (c - ps) / dome.z; return ts; }
  float t = e.y / dn;
  vec3 p = e + L * t;
  float tp = (e.y - ${PLAT_H.toFixed(1)}) / dn; vec3 pp = e + L * tp;
  float tw = (e.y - ${WATER_Y.toFixed(1)}) / dn; vec3 pw = e + L * tw;
  if (hOctD(pp.xz) < ${PLAT_A.toFixed(1)}) t = tp;
  else if (length(pw.xz - vec2(0., ${POOL_Z.toFixed(1)})) < ${POOL_R.toFixed(1)}) t = tw;
  if (kind < 0.5) {
    for (int k = 0; k < 8; k++) {
      float a = float(k) * 0.78539816; vec2 nk = vec2(sin(a), cos(a)), tk = vec2(cos(a), -sin(a));
      float den = dot(nk, L.xz);
      if (den > 0.001) {
        float tt = (${AP.toFixed(1)} - dot(nk, e.xz)) / den; vec3 pk = e + L * tt; float s = dot(pk.xz, tk);
        if (tt < t && abs(s) < 22.9) {
          float cls = mod(float(k), 2.) > 0.5 ? 2. : (mod(float(k), 4.) < 0.5 ? 0. : 1.);
          if (!(abs(s) < 10. && pk.y < hArchH(cls, s))) { t = tt; n = vec3(-nk.x, 0., -nk.y); if (pk.y > ${WALL_TOP.toFixed(1)} - 3.2) show = 0.; }
        }
      }
    }
    if (hOctD((e + L * t).xz) > 70.) show = 0.;
  } else {
    vec2 o = e.xz - dome.xy; vec2 d = L.xz; float dd = dot(d, d);
    if (dd > 1e-5) {
      float b = dot(o, d), cc = dot(o, o) - dome.z * dome.z, disc = b * b - dd * cc;
      if (disc > 0.) { float tt = (-b + sqrt(disc)) / dd; vec3 pk = e + L * tt;
        if (tt < t && tt > 0.) { vec2 rd = normalize(pk.xz - dome.xy + vec2(1e-4)); vec2 toC = -normalize(dome.xy);
          if (!(dot(rd, toC) > 0.72 && pk.y < 24.)) { t = tt; n = vec3(-rd.x, 0., -rd.y); } else if (length(pk.xz) < 60.) show = 0.; } }
    }
  }
  return t;
}
`;

// the cool hall's eyes throw their stars and hexagons onto whatever stands under them: floor, kerb, water, fountain, cloth
// (no beams there: the air is clear). uCEye: eye x, y, z; w = scale + 10 (hexagon) + 100 * glass colour (0..4)
const GLSL_COOL = /* glsl */`
uniform vec4 uCEye[${NCE}];
uniform vec3 uAccentBeam;
uniform float uStarGain;
vec3 hCoolStars(vec3 p, float ew){
  vec3 L = uSunC;
  vec3 A = normalize(cross(L, vec3(1e-3, 0., 1.))), B = cross(L, A);
  float pa = dot(p, A), pb = dot(p, B), pt = dot(p, L), dn = max(-L.y, 0.05);
  vec3 s = vec3(0.);
  for (int i = 0; i < ${NCE}; i++) {
    vec4 e = uCEye[i];
    float ci = floor(e.w / 100. + 1e-3), w = e.w - 100. * ci, shp = step(10., w), sc = w - 10. * shp;
    float t = pt - dot(e.xyz, L);
    float rad = max(sc * mix(0.6, 1., clamp(t * dn / max(e.y, 1.), 0., 1.)), 0.05);
    vec2 q = vec2(pa - dot(e.xyz, A), pb - dot(e.xyz, B)) / rad;
    float sd = shp < 0.5 ? hStar(q, 1.25) : hHex(q, 0.86);
    float er = min(ew, 0.3 * rad) / rad;
    float c = (1. - smoothstep(-er, er, sd)) * step(0.5, t);
    vec3 gc = uGlass[int(ci + 0.5)];
    s += mix(uBeamCol, gc * gc * 1.1 - 0.16, step(0.5, ci)) * c;   // (a coloured pane also takes a little of the other colours out, so it stays coloured on pale water)
  }
  return s * hCloud(p.z, 1.);
}
`;

const GLSL_FOGFADE = /* glsl */`
float hFogKeep(){
#ifdef USE_FOG
  #ifdef FOG_EXP2
    return exp(-fogDensity * fogDensity * vFogDepth * vFogDepth);
  #else
    return 1. - smoothstep(fogNear, fogFar, vFogDepth);
  #endif
#else
  return 1.;
#endif
}
`;

// ---------------------------------------------------------------- the stone shader (shell, furniture, muqarnas)
const STONE_VERT = /* glsl */`
attribute vec3 aCol; attribute float aMat;
uniform float uTime;
varying vec3 vW, vN, vCol; varying vec2 vUv; varying float vMat;
#include <fog_pars_vertex>
void main(){
  vec4 lp = vec4(position, 1.); vec3 ln = normal;
#ifdef USE_INSTANCING
  lp = instanceMatrix * lp; ln = mat3(instanceMatrix) * ln;
#endif
  vec4 wp = modelMatrix * lp;
  float sw = aMat > 9.5 && aMat < 10.5 ? uv.y : (aMat > 8.5 && aMat < 9.5 ? uv.x : 0.);   // a draught in cloth and leaves
  if (sw > 0.) { float ph = dot(wp.xz, vec2(0.23, 0.19));
    wp.x += sw * (sin(uTime * 1.3 + ph) * 0.34 + sin(uTime * 2.9 + ph * 2.3) * 0.1);
    wp.z += sw * (cos(uTime * 1.1 + ph * 1.4) * 0.3 + sin(uTime * 2.3 + ph * 3.1) * 0.08); }
  vW = wp.xyz; vN = mat3(modelMatrix) * ln; vCol = aCol; vUv = uv; vMat = aMat;
  vec4 mvPosition = viewMatrix * wp;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;

const STONE_FRAG = /* glsl */`
uniform vec3 uPearl, uSteam, uHoney, uBasalt, uAccent, uBrass, uShade, uBeamCol;
uniform float uHaze, uLight, uSeed;
uniform vec4 uBlob[${NBLOB}];      // x, z, radius, strength of a contact shadow on the floor
uniform vec4 uGlow;                // the exit portal's glow as the wet floor mirrors it: x, y, z of its centre, strength
uniform vec4 uLamp[${NLAMP}];      // a hanging lamp: x, y, z, strength (negative: a pair, mirrored in x)
uniform vec3 uLampCol, uPortalCol;
uniform vec3 uRoomKey, uRoomAmb;   // this hour's tint of the light in the cool hall and the warm room: what their roofs let in, and their shade
uniform float uRecZ;               // the exit recess begins east of this z
varying vec3 vW, vN, vCol; varying vec2 vUv; varying float vMat;
#include <fog_pars_fragment>
${GLSL_COMMON}
${GLSL_COOL}
vec3 marble(vec2 p, vec3 base){
  float v = hFbm(p * 0.35 + uSeed); float vein = smoothstep(0.035, 0., abs(hFbm(p * 0.22 + 11.3 + v) - 0.5));
  return base * (0.9 + 0.14 * v) * (1. - 0.22 * vein);
}
vec3 stripes(float u, float w, vec2 id){     // ablaq: honey / basalt alternating blocks with joints
  float i = floor(u / w), f = fract(u / w) * w;
  float joint = smoothstep(0., 0.07, min(f, w - f));
  float h = hHash(vec2(i, 3.7) + id);
  vec3 c = mod(i, 2.) < 0.5 ? uHoney * (0.86 + 0.24 * h) : uBasalt * (0.85 + 0.4 * h);
  return c * mix(0.55, 1., joint);
}
uniform float uThrough;
void main(){
  if (uThrough > 0.5 && vW.z > 289.5 && vW.y > 0.7) discard;   // seen through the previous portal from behind the entry, the hall's west wall stands aside
  vec3 V = normalize(cameraPosition - vW);
  vec3 N = normalize(vN + vec3(0., 1e-5, 0.));
  if (dot(N, V) < 0.) N = -N;
  float od = hOctD(vW.xz);
  int m = int(vMat + 0.5);
  vec3 alb = uPearl; float gloss = 0.; float wetGlint = 0.;
  vec2 bump = vec2(0.);                          // faked relief: tilt of the normal along the wall (x) and upward (y)
  float lodK = clamp(0.045 / max(fwidth(vUv.x) + fwidth(vUv.y), 1e-4), 0., 1.);   // fine detail fades with distance
  float fwy = max(fwidth(vUv.y), 1e-4);
  float ewS = clamp(0.45 * length(fwidth(vW)), 0.03, 0.22);             // edge softness of a thrown star, in metres
  if (m == 0) {                                  // ablaq courses below 20 m, plaster above
    float y = vUv.y;
    if (y < 20.) {
      // cut stone: courses 2.5 m high, blocks 2.9 to 3.8 m long, pillow-faced with dark recessed joints; over every
      // basalt course a thin inlaid fillet of pale stone set with honey lozenges
      // (courses 1.25 m high in bands of two, blocks 1.5 to 2.3 m long, thin joints, a shallow drafted margin: cut stone, not pillows)
      float band = floor(y / 2.5), course = floor(y / 1.25), fy = y - course * 1.25;
      bool dk = mod(band, 2.) < 0.5; bool upper = mod(course, 2.) > 0.5;
      float bl = 1.5 + 0.8 * hHash(vec2(course, 4.3));
      float u = vUv.x + hHash(vec2(course, 9.1)) * 7.;
      float bi = floor(u / bl), fx = u - bi * bl;
      float topC = dk && upper ? 0.95 : 1.25;
      // now and then one great block takes the height of both courses of its band
      float ub = vUv.x + hHash(vec2(band, 2.7)) * 9., bgi = floor(ub / 3.3);
      if (hHash(vec2(bgi, band) + uSeed + 11.) < 0.24 && !(dk && y > band * 2.5 + 2.2)) {
        course = band * 2. + 0.5; fy = y - band * 2.5; bl = 3.3; u = ub; bi = bgi + 40.; fx = ub - bgi * 3.3; topC = dk ? 2.2 : 2.5; upper = false;
      }
      float h = hHash(vec2(bi, course) + uSeed), h2 = hHash(vec2(course, bi) + 5.7);
      vec3 honeyS = mix(vec3(dot(uHoney, vec3(0.3, 0.55, 0.15))), uHoney, 0.74);                // cut limestone, not paint
      vec3 stone = dk ? uBasalt * (0.6 + 0.6 * h) : honeyS * (0.62 + 0.5 * h);
      stone *= 0.8 + 0.42 * hFbm(vec2(vUv.x * 0.11, y * 0.16) + uSeed);                       // the wall's own weathering, over many blocks
      float vn = hFbm(vec2(u * 0.9 + h * 13., y * 2.6 + h2 * 7.));
      stone *= 1. - 0.28 * smoothstep(0.05, 0., abs(vn - 0.5)) * step(0.45, h2) * lodK;      // a vein through some blocks
      if (!dk) stone = mix(stone, stone * vec3(1.1, 0.88, 0.7), step(0.7, h2) * 0.55);     // a redder block now and then
      else stone = mix(stone, stone * vec3(0.9, 1.0, 1.14), step(0.6, h2) * 0.6);          // a bluer one in the basalt
      stone *= 0.74 + 0.5 * hFbm(vec2(u, y) * 1.3 + h * 9.);                               // mottling
      float tool = hNoise(vec2(u * 7. + y * 4. + h * 31., y * 13.)) * 0.6 + hNoise(vec2(u * 23. - y * 9., y * 31.)) * 0.4;
      stone *= 1. + (tool - 0.5) * 0.34 * lodK;                                            // slanting chisel strokes
      stone *= 1. - 0.45 * step(0.9, hNoise(vec2(u, y) * 9.7 + 3.)) * lodK;                // pits
      stone *= 1. - 0.2 * smoothstep(0.5, 0.85, hFbm(vec2(u * 2.1, y * 0.33) + 7.));       // streaks of old water
      float top = topC;
      float jx = min(fx, bl - fx), jy = min(fy, top - fy), jd = min(jx, jy);
      float joint = smoothstep(0.018, 0.05, jd);
      stone *= 0.93 + 0.12 * smoothstep(0., top, fy);
      float bev = 1. - smoothstep(0.03, 0.14, jd);
      bump = (jx < jy ? vec2(fx < bl * 0.5 ? -1. : 1., 0.) : vec2(0., fy < top * 0.5 ? -1. : 1.)) * bev * joint * 0.3;
      stone *= 1. + 0.05 * bev * joint * step(top * 0.5, fy) * step(jy, jx) * (0.3 + 1.4 * hNoise(vec2(u * 0.8, course)));   // the worn upper arris catches the light, here and there
      stone *= 1. - 0.08 * bev * joint * step(fy, top * 0.5) * step(jy, jx);              // and the lower one is in its own shade
      float field = smoothstep(0.14, 0.2, jd);                                            // inside a smooth drafted margin the face is picked rough
      stone *= 1. - field * (0.04 + 0.16 * hNoise(vec2(u, y) * 15. + h * 7.) * lodK);
      stone *= 1. - 0.16 * smoothstep(0.03, 0., abs(jd - 0.17)) * lodK;                   // the margin's cut line
      stone *= 1. - 0.22 * smoothstep(0.75, 0.95, hNoise(vec2(u, y) * 1.9 + h * 40.)) * (1. - smoothstep(0.02, 0.16, jd)) * lodK;   // chipped arrises
      stone *= 1. - 0.14 * smoothstep(0.45, 0.8, hFbm(vec2(u * 0.6, y * 0.12) + 17.)) * smoothstep(21., 14., y);      // damp running down from the carved band
      stone *= 1. - 0.34 * smoothstep(15.5, 20., y) * (0.45 + 0.55 * hFbm(vec2(vUv.x * 0.45, y * 0.1) + 9.));      // damp under the carved band
      stone *= 1. - 0.3 * smoothstep(9.5, 5., y) * (0.4 + 0.6 * hFbm(vec2(vUv.x * 0.37, y * 0.12) + 3.));           // and at the foot, over the tiles
      alb = mix(stone * 0.3, stone, joint);
      if (y > 12.5 && y < 13.75) {                                                         // an inlaid frieze at mid-height: cream stone set with basalt stars, turquoise eyes, honey lozenges between
        float t = (y - 12.5) / 1.25; vec2 fq = vec2(fract(vUv.x / 1.25) - 0.5, t - 0.5);
        float s8 = min(max(abs(fq.x), abs(fq.y)), (abs(fq.x) + abs(fq.y)) * 0.7071) - 0.27;
        vec3 fr = uPearl * 0.7 * (0.9 + 0.16 * hNoise(vec2(vUv.x * 2.3, y * 3.)));
        fr = mix(fr, uBasalt * 0.8, smoothstep(0.02, -0.01, s8));
        fr = mix(fr, vec3(0.03, 0.38, 0.4), smoothstep(0.1, 0.07, length(fq)));
        fr = mix(fr, honeyS * 0.9, smoothstep(0.02, 0., abs(abs(fq.x) - 0.5) + abs(fq.y) * 0.6 - 0.1));
        fr *= smoothstep(0., 0.07, t) * smoothstep(1., 0.93, t) * 0.7 + 0.3;               // seated between two shadow lines
        alb = mix(alb, fr, clamp(0.4 / fwy, 0., 1.)); bump = vec2(0.);
      }
      if (dk && upper && fy > 0.95) {                                                      // the inlaid fillet
        float t = (fy - 0.95) / 0.3, lu = abs(fract(u / 0.62) - 0.5) * 0.62;
        vec3 fil = uPearl * 0.74 * (0.92 + 0.12 * hNoise(vec2(u * 3., course)));
        fil = mix(fil, uHoney * 0.85, smoothstep(0.02, 0., lu + abs(t - 0.5) * 0.3 - 0.115));
        fil *= smoothstep(0., 0.14, t) * (0.72 + 0.28 * smoothstep(1., 0.82, t));          // seated in a shadow line
        alb = mix(uBasalt * 0.9, fil, clamp(0.3 / fwy, 0., 1.));
        bump = vec2(0.);
      }
      float glaze = 0.;
      if (y < 5.) {                                                                        // a dado of glazed tiles: turquoise ground, cobalt and emerald stars, a cobalt border
        vec3 turq = vec3(0.02, 0.36, 0.38), emer = vec3(0.015, 0.25, 0.1), cob = vec3(0.028, 0.075, 0.44), cream = uPearl * 0.8;
        vec3 tc;
        if (y < 0.5) tc = uBasalt * 0.55;
        else if (y > 4.3) {
          float bz = (y - 4.3) / 0.7, zz = abs(fract(vUv.x / 0.7) - 0.5) * 2.;
          tc = mix(cob, cream, smoothstep(0.12, 0.05, abs(zz * 0.5 + 0.28 - bz)));
          tc = mix(tc, turq * 1.25, step(bz, 0.16)); tc = mix(tc, cream * 0.9, step(0.88, bz));
        } else {
          vec2 tq = vec2(vUv.x, y - 0.5) / 0.95, ti = floor(tq), tf = fract(tq) - 0.5;
          float keep = clamp(0.35 / max(fwidth(tq.x) + fwidth(tq.y), 1e-4), 0., 1.);
          float s8 = min(max(abs(tf.x), abs(tf.y)), (abs(tf.x) + abs(tf.y)) * 0.7071) - 0.3;      // an eight-pointed star: a square and a diamond together
          tc = turq * (0.8 + 0.4 * hHash(ti + 3.));
          tc = mix(tc, mod(ti.x + ti.y, 2.) < 0.5 ? cob : emer, smoothstep(0.02, -0.02, s8));
          tc = mix(tc, cream, smoothstep(0.045, 0.012, abs(s8)));
          tc = mix(tc, vec3(0.8, 0.42, 0.05), smoothstep(0.1, 0.07, length(tf)));
          tc *= 0.55 + 0.45 * smoothstep(0.5, 0.455, max(abs(tf.x), abs(tf.y)));
          tc = mix(vec3(0.03, 0.25, 0.33), tc, keep);
        }
        alb = tc * (0.88 + 0.24 * hNoise(vec2(vUv.x, y) * 2.3)); bump = vec2(0.); glaze = 1.;
      }
      float damp = smoothstep(8., 0., y) * (0.35 + 0.65 * hFbm(vec2(u * 0.3, y * 0.08) + 5.)) * (1. - 0.75 * glaze);
      alb = mix(alb, alb * vec3(0.5, 0.6, 0.54), damp * 0.7);
      alb = mix(alb, uAccent * 0.4 + alb * 0.4, smoothstep(0.62, 0.9, hFbm(vec2(u * 0.5, 3.))) * smoothstep(2.4, 0.2, y) * 0.5);
      gloss = mix(0.24 * smoothstep(7., 0., y), 0.6, glaze);
    } else {
      alb = uPearl * (0.74 + 0.1 * hFbm(vec2(vUv.x, y) * 0.6 + uSeed)) * (0.94 + 0.06 * hNoise(vec2(vUv.x, y) * 5.));
      alb *= 1. - 0.25 * smoothstep(0.5, 0., y - 20.);                       // shadow line over the last course
      alb *= mix(1., 0.86, smoothstep(0.55, 0.8, hFbm(vec2(vUv.x * 0.25, y * 0.05) + 2.)));   // old damp
      if (vW.z > 127.) {                                                    // the cool hall: no bare plaster. A painted scroll over the arcade, a row of painted blind niches under the ceiling
        vec3 turq = vec3(0.03, 0.4, 0.42), cob = vec3(0.04, 0.1, 0.5);
        float sv = (y - 27.0) / 3.4;
        if (sv > 0. && sv < 1.) {
          float su = vUv.x * 0.85;
          float w1 = abs(sv - 0.5 - 0.27 * sin(su)), w2 = abs(sv - 0.5 + 0.27 * sin(su));
          vec3 bc = cob * (0.75 + 0.3 * hNoise(vec2(vUv.x * 0.7, y * 1.3)));
          bc = mix(bc, turq, smoothstep(0.16, 0.1, length(vec2((fract(su / 3.14159 + 0.5) - 0.5) * 2.2, sv - 0.5))));
          bc = mix(bc, uPearl * 0.82, smoothstep(0.085, 0.05, min(w1, w2)));
          bc = mix(bc, uHoney * 0.8, step(sv, 0.09) + step(0.91, sv));
          alb = mix(alb, bc, 0.9);
        }
        float nv = (y - 32.6) / 6.4;
        if (nv > 0. && nv < 1.) {
          float nu = (fract(vUv.x / 5.6) - 0.5) * 5.6, ax = abs(nu), yy = nv * 6.4 - 0.7;
          float d = yy < 2.6 ? ax - 1.75 : length(vec2(ax + 1.05, yy - 2.6)) - 2.8; d = max(d, -yy);
          vec3 nc = mix(turq * 0.9, cob * 0.8, smoothstep(0.5, 4.6, yy));                  // deeper colour toward the head of the niche
          nc *= 0.72 + 0.28 * smoothstep(0., 0.7, -d);                                     // a shadow under its rim
          vec2 sq = vec2(nu, yy - 2.1);
          nc = mix(nc, uPearl * 0.85, smoothstep(0.05, 0., abs(hStar(sq, 1.5)) - 0.05));
          nc = mix(nc, uHoney * 0.85, smoothstep(0.03, -0.03, hHex(sq, 0.42)));
          vec3 pl = mix(alb, cob * 0.9, smoothstep(0.03, -0.03, abs(ax - 2.8) + abs(yy - 2.6) * 0.6 - 0.42));      // a lozenge between niches
          pl = mix(pl, uHoney * 0.75, smoothstep(0.08, 0.02, abs(d - 0.28)));              // a honey line round each
          alb = mix(pl, nc, smoothstep(0.04, -0.04, d));
        }
      }
      // inlaid roundels in the spandrels of the eight great arches
      float sW = mod(vUv.x + 22.78, 45.56) - 22.78;
      vec2 rq = vec2(abs(sW) - 16.4, y - 24.3); float rd = length(rq);
      if (rd < 2.7 && od < 56.) {
        vec3 rc = uPearl * 0.8;
        rc = mix(rc, uHoney * 0.9, smoothstep(0.05, 0., hStar(rq, 1.9)));
        rc = mix(rc, hHash(vec2(floor(vUv.x / 45.56), sign(sW)) + uSeed) < 0.3 ? uAccent * 0.75 : uBasalt * 1.1, smoothstep(0.05, 0., hHex(rq, 0.62)));
        rc = mix(rc, uBasalt * 1.1, smoothstep(2.05, 2.1, rd) * (1. - smoothstep(2.3, 2.35, rd)));
        rc = mix(rc, uHoney * 0.9, smoothstep(2.35, 2.4, rd));
        alb = mix(rc, alb * 0.7, smoothstep(2.6, 2.7, rd));
      }
    }
  } else if (m == 1) {                           // plaster (domes): meridian ribs and trowel marks
    float rib = abs(fract(vUv.x) - 0.5);
    alb = uPearl * (0.62 + 0.1 * hFbm(vW.xz * 0.21 + vW.y * 0.13)) * (1. - 0.14 * smoothstep(0.03, 0., rib));
    alb *= 0.95 + 0.05 * hNoise(vW.xz * 2.3 + vW.y);
    if (vW.z < uRecZ) {                                       // the recess vault: raised cross ribs, a carved band along each springing, an inlaid star at the crown of every bay
      alb = mix(alb, uHoney * 0.52, smoothstep(0.062, 0.05, rib));
      alb *= 1. - 0.4 * smoothstep(0.022, 0., abs(rib - 0.072));
      float bv = (vW.y - 22.15) / 2.7;
      if (bv > 0. && bv < 1.) {
        float bu = vW.z * 1.25;
        float s1 = abs(bv - 0.5 - 0.27 * sin(bu)), s2 = abs(bv - 0.5 + 0.27 * sin(bu)), s3 = abs(bv - 0.5 - 0.27 * sin(bu * 0.5 + 1.57));
        float strand = smoothstep(0.1, 0.06, min(min(s1, s2), s3)), border = step(bv, 0.1) + step(0.9, bv);
        alb = uPearl * mix(0.42, 0.8, max(strand, border)) * (1. - 0.2 * smoothstep(0.035, 0., min(min(s1, s2), s3)));
        alb = mix(alb, uHoney * 0.75, border * 0.55);
      }
      vec2 mq = vec2(vW.x, (vUv.x - floor(vUv.x + 0.5)) * 7.7); float mr = length(mq);
      if (mr < 3.6) {
        vec3 mc = uPearl * 0.7;
        mc = mix(mc, uHoney * 0.85, smoothstep(0.07, 0., hStar(mq, 2.5)));
        mc = mix(mc, hHash(vec2(floor(vUv.x + 0.5), 3.) + uSeed) < 0.34 ? uAccent * 0.75 : uBasalt * 1.2, smoothstep(0.06, 0., hHex(mq, 0.8)));
        mc = mix(mc, uBasalt * 1.2, smoothstep(0.1, 0.03, abs(mr - 3.05)));
        alb = mix(mc, alb, smoothstep(3.3, 3.5, mr));
      }
    }
    if (vW.z > 127. && vW.y < 40.5 && vW.y > 39.5) {         // the cool hall's flat ceiling: painted coffers between dark beams
      vec2 cq = vec2(vW.x, vW.z - 131.) / 6.36, cf = fract(cq) - 0.5, ci = floor(cq);
      float cb = max(abs(cf.x), abs(cf.y));                    // 0 at the middle of a coffer, 0.5 on a beam
      vec3 panel = uPearl * 0.62 * (0.9 + 0.1 * hHash(ci + 2.));
      panel = mix(panel, uHoney * 0.8, smoothstep(0.03, 0., hStar(cf * 1.9, 0.52)));
      panel = mix(panel, hHash(ci + uSeed) < 0.25 ? uAccent * 0.7 : uBasalt * 1.2, smoothstep(0.025, 0., hHex(cf * 1.9, 0.14)));
      panel = mix(panel, uShade * 0.75, smoothstep(0.03, 0., abs(cb - 0.33) - 0.012));       // a painted line round each panel
      panel *= 0.62 + 0.38 * smoothstep(0.42, 0.24, cb);                                     // the coffer is sunk: its edges are in shade
      vec3 beam = uHoney * 0.34 * (0.8 + 0.4 * hNoise(vec2(cq.x * 14., cq.y * 1.3) + (abs(cf.x) > abs(cf.y) ? 0. : 9.)));
      alb = mix(panel, beam, smoothstep(0.415, 0.43, cb));
    }
  } else if (m == 2) {                           // wet floor: star-and-hexagon marble, striped borders
    vec2 p = vW.xz;
    vec4 hc = hHexCell(p / 5.4);
    float ds = hStar(hc.xy, 0.43), dh = hHex(hc.xy, 0.15), db = hHex(hc.xy.yx, 0.468);
    float hid = hHash(hc.zw + uSeed);
    vec3 white = marble(p, uPearl * 0.8), honey = marble(p * 1.3, uHoney * 0.92), dark = marble(p * 0.7, uBasalt * 1.15);
    vec3 c = white;
    c = mix(c, honey, smoothstep(0.012, 0., ds));
    c = mix(c, hid < 0.09 ? uAccent * 0.75 : dark, smoothstep(0.012, 0., dh));
    c = mix(c, dark, smoothstep(0., 0.012, db));
    c *= 1. - 0.35 * smoothstep(0.014, 0.002, min(min(abs(ds), abs(dh)), abs(db)));     // grout
    float pd = hOctD(p), ang = atan(p.x, p.y);
    float band1 = smoothstep(15.4, 15.6, pd) * smoothstep(21.2, 21., pd);               // striped collar round the platform
    c = mix(c, stripes(ang * 9.2, 1., vec2(floor(pd / 1.4), 2.)), band1 * step(0.12, fract(pd / 1.4)));
    c = mix(c, dark, band1 * (1. - step(0.12, fract(pd / 1.4))));
    float band2 = smoothstep(47.8, 48., pd) * smoothstep(53.2, 53., pd);                // striped margin under the walls
    c = mix(c, stripes(ang * 28. + floor(pd / 1.3) * 0.5, 1., vec2(floor(pd / 1.3), 5.)), band2);
    float pl = length(p - vec2(0., ${POOL_Z.toFixed(1)}));
    float band3 = smoothstep(18.3, 18.5, pl) * smoothstep(21.3, 21.1, pl) * step(pd, 47.8); // honey and basalt ring round the pool
    c = mix(c, stripes(atan(p.x, p.y - ${POOL_Z.toFixed(1)}) * 10.5, 1., vec2(1., 8.)), band3);
    alb = c;
    // contact shadows: platform foot, pool kerb, walls; moss and old overflow round the basins
    float sh = 1. - 0.42 * smoothstep(17.4, 15.2, pd) - 0.3 * (1. - smoothstep(18.2, 20.4, pl)) * step(18., pl);
    sh *= 1. - 0.3 * smoothstep(51., 55., pd) * step(pd, 56.);
    float ba = (floor(ang / 0.78539816) + 0.5) * 0.78539816;
    float bd = length(p - vec2(sin(ba), cos(ba)) * 51.5);
    sh *= 1. - 0.45 * smoothstep(6.2, 3.6, bd);
    float moss = smoothstep(8.5, 4.2, bd) * smoothstep(0.35, 0.7, hFbm(p * 0.45 + 4.));
    alb = mix(alb, alb * vec3(0.5, 0.74, 0.5) + uAccent * 0.08, moss * 0.6);
    for (int i = 0; i < ${NBLOB}; i++) {                                       // soft contact shadows under what stands on the floor
      vec4 bl = uBlob[i]; float bq = length(p - bl.xy);
      sh *= 1. - bl.w * (1. - smoothstep(bl.z * 0.45, bl.z, bq));
    }
    alb *= sh;
    float puddle = smoothstep(0.3, 0.62, hFbm(p * 0.085 + uSeed * 0.37));
    gloss = 0.55 + 0.45 * puddle; wetGlint = 1.;
    alb *= mix(0.8, 0.64, puddle);                                           // wet stone is darker: the stars stand out on it
    { float hotF = smoothstep(66., 57., vW.z) * smoothstep(uRecZ - 3., uRecZ + 5., vW.z); alb = mix(alb, alb * alb * 1.25 + alb * 0.12, 0.8 * hotF); }   // the hot room's floor runs with water: dark, deep-coloured marble
    if (vW.z > 127.) { gloss *= 0.4; wetGlint = 0.; alb *= 1.3; }            // the cool hall's floor is dry
  } else if (m == 3) {                           // white marble with inlaid bands (vUv.y = band coordinate 0..1)
    alb = marble(vUv * vec2(1., 6.) + vW.xz * 0.3, uPearl * 0.86);
    alb *= 1. - 0.3 * smoothstep(0.05, 0., abs(hFbm(vW.xz * 0.55 + vW.y * 0.9 + 3.1) - 0.5)) * (0.4 + 0.6 * hNoise(vW.xz * 0.2 + 7.));   // grey veins
    float v = vUv.y;
    if (v > 0.3 && v < 0.7) {
      float t = (v - 0.3) / 0.4; float u = vUv.x / 0.9; float tri = abs(fract(u) - 0.5) * 2.;
      vec3 inl = tri > t ? uBasalt * 1.1 : uHoney * 0.9;
      if (hHash(vec2(floor(u), 4.) + uSeed) < 0.12 && tri <= t) inl = uAccent * 0.7;
      float edge = min(min(t, 1. - t), abs(tri - t));
      alb = mix(alb * 0.6, inl, smoothstep(0., 0.05, edge));
    }
    gloss = 0.5;
  } else if (m == 4) {                           // brass (taps, grilles: vUv.y > 0.5 marks the pierced disc)
    alb = uBrass * 0.5 + uHoney * 0.45; gloss = 0.9;
    if (vUv.y > 0.5) {
      vec4 hc = hHexCell(vW.xz / 0.9);
      float hole = min(hStar(hc.xy, 0.36), 1.);
      alb *= mix(0.12, 1., smoothstep(-0.02, 0.03, hole)) * (0.8 + 0.2 * smoothstep(0.03, 0.08, abs(hole - 0.07)));
    }
    alb *= 0.85 + 0.3 * hNoise(vW.xz * 6. + vW.y * 4.);
  } else if (m == 5) {                           // striped voussoirs (vUv.x metres round the arch)
    float vf = mod(vUv.x, 2.3), vi = floor(vUv.x / 2.3);
    alb = stripes(vUv.x, 2.3, vec2(1.)) * (0.86 + 0.28 * hFbm(vUv * vec2(1.5, 3.) + vi * 3.7));
    alb *= 1. + (hNoise(vec2(vUv.x * 9. + vUv.y * 11., vUv.y * 30.)) - 0.5) * 0.3 * lodK;      // tooling
    alb *= 1. + 0.2 * (smoothstep(0.36, 0.09, vf) - smoothstep(0.36, 0.09, 2.3 - vf)) * step(0.07, min(vf, 2.3 - vf));   // each voussoir is cushioned: one arris lit, one in shade
    float ve = min(vUv.y, 1. - vUv.y) * 2.4;
    alb *= mix(0.62, 1., smoothstep(0.06, 0.14, abs(ve - 0.22))) * mix(0.8, 1., smoothstep(0., 0.1, ve));   // a cut moulding line inside each edge of the ring
  } else if (m == 6) {                           // platform top: a great rosette of inlay on white marble
    vec2 p = vW.xz; float r = length(p), a = atan(p.x, p.y);
    vec3 white = marble(p * 1.5, uPearl * 0.82), honey = uHoney * 0.92, dark = uBasalt * 1.15;
    vec3 c = white;
    float pet = abs(fract(a * 16. / 6.2831853 + 0.5) - 0.5) * 2.;
    float starR = mix(6.2, 10.6, pet);
    c = mix(c, honey, smoothstep(0.06, 0., r - starR) * step(4.9, r));
    float star2 = mix(4.9, 8.4, abs(fract(a * 16. / 6.2831853) - 0.5) * 2.);
    c = mix(c, dark, smoothstep(0.06, 0., r - star2) * step(4.9, r) * step(r, starR));
    c = mix(c, dark, smoothstep(0.1, 0.02, abs(r - 11.4)) + smoothstep(0.1, 0.02, abs(r - 4.9)));
    c = mix(c, stripes(a * 12.6, 1., vec2(3., 1.)), smoothstep(11.9, 12., hOctD(p)) * smoothstep(13.3, 13.2, hOctD(p)));
    vec4 hc = hHexCell(p / 1.5);
    float inner = step(r, 4.9);
    c = mix(c, mix(honey, hHash(hc.zw) < 0.2 ? uAccent * 0.75 : dark, smoothstep(0.01, 0., hHex(hc.xy, 0.2))), inner * smoothstep(0.012, 0., hStar(hc.xy, 0.42)));
    alb = c * 0.82; gloss = 0.7; wetGlint = 1.;
  } else if (m == 7) {                           // carved interlace band (vUv.x metres, vUv.y 0..1)
    float u = vUv.x * 1.25, v = vUv.y;
    float s1 = abs(v - 0.5 - 0.27 * sin(u)), s2 = abs(v - 0.5 + 0.27 * sin(u)), s3 = abs(v - 0.5 - 0.27 * sin(u * 0.5 + 1.57));
    float strand = smoothstep(0.1, 0.06, min(min(s1, s2), s3));
    float core = smoothstep(0.035, 0.0, min(min(s1, s2), s3));
    float border = step(v, 0.1) + step(0.9, v);
    alb = uPearl * mix(0.5, 0.8, max(strand, border)) * (1. - 0.2 * core);
    alb = mix(alb, uHoney * 0.75, border * 0.55);
    alb *= 0.93 + 0.1 * hNoise(vUv * vec2(3., 9.));
  } else if (m == 9) {                           // plain vertex-coloured prop
    alb = vec3(0.88 + 0.14 * hNoise(vW.xz * 3.1 + vW.y * 2.3)); gloss = vUv.y;
  } else if (m == 10) {                          // striped cloth
    float s = fract(vUv.x / 1.7);
    float stripe = step(0.5, s) * step(s, 0.84) + step(0.07, s) * step(s, 0.13) + step(0.91, s) * step(s, 0.95);
    alb = mix(uPearl * 0.84 / max(vCol, vec3(0.04)), vec3(1.), stripe) * (0.9 + 0.12 * hNoise(vUv * vec2(9., 40.)));
  } else if (m == 11) {                          // hammered metal: every dimple is a small facet that turns the light
    float sat = clamp((max(vCol.r, max(vCol.g, vCol.b)) - min(vCol.r, min(vCol.g, vCol.b))) / max(max(vCol.r, max(vCol.g, vCol.b)), 1e-3) * 2.2, 0., 1.);   // copper 1, tin 0
    vec2 hq = vUv * mix(21., 13., sat), hi = floor(hq);
    vec2 hc2 = fract(hq) - 0.5 - 0.36 * (vec2(hHash(hi), hHash(hi + 7.3)) - 0.5);
    float hd = length(hc2);
    float dim = smoothstep(0.5, 0.12, hd);
    alb = vec3(0.8 + 0.2 * dim) * (0.86 + 0.28 * hNoise(vUv * 2.3));
    alb *= 1. - 0.3 * smoothstep(0.42, 0.5, hd);                                // tarnish in the creases between dimples
    bump = ((vec2(hHash(hi + 1.7), hHash(hi + 4.9)) - 0.5) * 0.5 * dim + hc2 * 0.5) * mix(0.4, 1., sat);
    float bv = vUv.y - 10.;
    if (bv > 0. && bv < 1.) {                      // the engraved band of knotwork: dark-cut strands between two ruled lines
      float u = vUv.x * 5.2;
      float s1 = abs(bv - 0.5 - 0.25 * sin(u)), s2 = abs(bv - 0.5 + 0.25 * sin(u)), s3 = abs(bv - 0.5 - 0.25 * sin(u * 0.5 + 1.57));
      float cut = smoothstep(0.075, 0.03, min(min(s1, s2), s3));
      float rule = smoothstep(0.03, 0.0, abs(bv - 0.1) - 0.02) + smoothstep(0.03, 0.0, abs(bv - 0.9) - 0.02);
      alb = vec3(1.02) * (1. - 0.72 * max(cut, rule));
      alb *= 0.9 + 0.2 * step(0.5, hHash(floor(vec2(u * 2.2, bv * 9.))));         // punched ground between the strands
      bump = vec2(0.);
    }
    gloss = 0.85; wetGlint = 2.;
  } else if (m == 12) {                          // lit glass (set below)
    alb = vec3(0.);
  } else if (m == 13) {                          // a glazed tile panel (vUv in metres): a lattice of stars in cobalt and turquoise, a zigzag border
    vec3 turq = vec3(0.02, 0.38, 0.4), emer = vec3(0.015, 0.26, 0.1), cob = vec3(0.028, 0.075, 0.46), cream = uPearl * 0.82, ruby = vec3(0.42, 0.03, 0.05);
    vec4 hc = hHexCell(vUv / 1.25);
    float keep = clamp(0.3 / max(fwidth(vUv.x) + fwidth(vUv.y), 1e-4), 0., 1.);
    float ds = hStar(hc.xy, 0.44), dh = hHex(hc.xy, 0.13), hid = hHash(hc.zw + uSeed);
    vec3 tc = cob * (0.85 + 0.3 * hid);
    tc = mix(tc, hid < 0.5 ? turq : emer, smoothstep(0.012, -0.012, ds));
    tc = mix(tc, cream, smoothstep(0.04, 0.012, abs(ds)));
    tc = mix(tc, hid < 0.3 ? ruby : vec3(0.8, 0.44, 0.05), smoothstep(0.012, -0.012, dh));
    tc = mix(vec3(0.03, 0.17, 0.4), tc, keep);
    alb = tc * (0.88 + 0.24 * hNoise(vUv * 2.1)); gloss = 0.6;
  } else {                                       // muqarnas cell: plaster, honey lip
    alb = uPearl * 0.8 * (0.92 + 0.1 * hNoise(vW.xz * 1.7 + vW.y));
    alb = mix(alb, uHoney * 0.9, smoothstep(0.8, 0.93, vUv.y) * 0.85);
    alb = mix(alb, uBasalt * 1.3, smoothstep(0.1, 0.02, vUv.y) * 0.35);
    if (vW.z < uRecZ) {                          // the half-dome over the portal is painted: turquoise and cobalt hollows tier by tier, a cream line, gilded lips
      float tj = floor(asin(clamp((vW.y - 20.8) / 9.5, 0., 1.)) / 1.5237 * 8.);
      vec3 hol = mod(tj, 2.) < 0.5 ? vec3(0.02, 0.34, 0.38) : vec3(0.03, 0.09, 0.46);
      hol *= 0.75 + 0.5 * vUv.y + 0.2 * hNoise(vW.xz * 2.3 + vW.y * 1.7);
      alb = mix(hol, uPearl * 0.85, smoothstep(0.035, 0.015, abs(vUv.y - 0.74)));
      alb = mix(alb, vec3(0.95, 0.6, 0.14), smoothstep(0.8, 0.86, vUv.y));
      float au = abs(vUv.x - 0.5);
      alb = mix(alb, vec3(0.95, 0.6, 0.14), smoothstep(0.06, 0.03, au) * smoothstep(0.1, 0.3, vUv.y) * (1. - smoothstep(0.55, 0.7, vUv.y)) * 0.8);   // a gilt rib up the middle of each cell
    }
  }
  alb *= vCol;

  // ---- relief: cushioned stones and hammer dimples tilt the normal
  if (bump.x != 0. || bump.y != 0.) {
    vec3 T = cross(vec3(0., 1., 0.), N); float tl = length(T);
    T = tl > 0.05 ? T / tl : vec3(1., 0., 0.);
    vec3 B = cross(N, T);
    N = normalize(N + (T * bump.x + B * bump.y) * 0.75);
  }
  // ---- light: no lamps. Pearl fill from the glowing steam under the domes, blue-grey shade below and in corners.
  float up = N.y * 0.5 + 0.5;
  vec3 lc = vec3(0., 72., 0.); float chamber = 0.;
  float room = 0., reach = 1.;
  if (od > 61. && abs(abs(vW.x) - abs(vW.z)) < 24.) { lc = vec3(sign(vW.x) * 52.7, 38., sign(vW.z) * 52.7); chamber = 1.; }
  else if (vW.z > 127.) { lc = vec3(8., 70., 191.); room = 1.; reach = 105.; }       // the world's cool hall: its dome
  else if (vW.z > 63.2) { lc = vec3(8., 44., 93.3); room = 1.; reach = 56.; }        // the warm room: its vault
  else if (vW.z < uRecZ) { lc = vec3(9., 40., -108.); room = 1.; reach = 72.; }      // the exit recess: its south haunch
  vec3 toL = lc - vW; float dl = length(toL) + 1e-3; float ndl = max(dot(N, toL / dl), 0.);
  float fall = 1. / (1. + dl * dl / (reach * reach));
  ndl = mix(ndl, (0.2 + 0.8 * ndl) * 1.75 * fall, room);                   // rooms: the corners fall off
  float passage = smoothstep(54., 60., od) * (1. - chamber) * (1. - room);
  float lift = smoothstep(0., 70., vW.y);
  float upS = up * up * (3. - 2. * up);
  upS = mix(upS, max(upS, 0.4), room);                                     // rooms: the floor's bounce reaches ceilings and soffits
  vec3 fill = mix(uDeep * 0.5, uPearl, upS) * mix(0.46, 0.4, lift) * (1. + room * (0.62 * fall + 0.02));
  vec3 key = uPearl * ndl * mix(0.44, 0.3, chamber);
  if (vW.z > 63.2) { fill *= uRoomAmb; key *= uRoomKey; }
  float hush = clamp(uCloud.z - uCloud.w, 0., 1.);                         // the real cloud is over the domes
  vec3 light = (fill * mix(1., 0.92, passage) + key * mix(1., 0.8, passage)) * uLight;   // passages and iwans: dimmer, never dark
  float hot = (1. - room) * (1. - chamber);
  light += uHoney * (0.07 + 0.07 * hot) * (1. - up) * smoothstep(24., 0., vW.y);   // warm bounce off the stone floor band
  light += uBeamCol * uHoney * 0.3 * hot * smoothstep(9., 0.5, vW.y) * (1. - 0.6 * up) * hCloud(vW.z, 1.) * smoothstep(40., 2., uSteamBase);   // the floor's stars thrown back up the lowest courses
  if (vW.z > 63.2) {                                                        // shade deepens into the side bays of the cool hall and warm room
    float bay = vW.z > 127. ? smoothstep(24., 45., abs(vW.x)) : smoothstep(15., 30., abs(vW.x));
    light *= mix(vec3(1.), uDeep * 1.6, 0.7 * bay * (1. - 0.6 * smoothstep(24., 40., vW.y)));
  }
  // the light lies on the floor: walls climb into blue-violet shade, and the vaults and domes keep only that and their eyes
  float deepK = smoothstep(6., mix(30., 22., room), vW.y) * 0.95;
  light = mix(light, light * uDeep * mix(0.85, 1.1, room), deepK);
  if (m == 8) light += (uDeep / max(uDeep.b, 0.2) * (0.15 + 0.2 * hush) + uPearl * (0.04 + 0.04 * hush)) * uLight;
  if (m == 8 && vW.z < uRecZ) light += (uPortalCol * 0.3 + vec3(0.5, 0.52, 0.56) + uLampCol * 0.55 * smoothstep(0.7, 0.9, vUv.y)) * (0.75 + 0.25 * sin(uTime * 0.9 + vW.x * 0.4 + vW.y * 0.7)) * uLight;   // the half-dome over the portal: turquoise in every hollow, gold on every lip             // the honeycomb catches the floor's bounce: no darker than lit basalt
  light += (uDeep * 0.2 + uPearl * 0.035) * hush * hot * uLight;           // under the cloud the room is hushed, not dark: the steam's own glow fills it
  light *= mix(vec3(1.), uDeep * 1.6, 0.5 * (1. - ndl) * (1. - up));       // cool the faces turned away
  vec3 sunAdd = vec3(0.);
  if (vW.z > 127.) {
    // the cool hall is lit by its dome and by nothing else: a pool of pearl light under it, falling off toward the ends;
    // blind bays, the arch passage and every soffit are out of its sight and keep only blue-grey shade
    vec3 toD = vec3(0., 62., 191.) - vW; float dd = length(toD) + 1e-3; vec3 Dn = toD / dd;
    float rdc = length(vW.xz - vec2(0., 191.));
    float see = max(dot(N, Dn), 0.), lobe = max(Dn.y, 0.); lobe *= sqrt(lobe);
    float occ = max(smoothstep(45.3, 47.4, abs(vW.x)), smoothstep(130.7, 128.8, vW.z));
    float kd = 1.35 * see * lobe / (1. + dd * dd / 5200.) * (1. - 0.8 * occ) * (1. - 0.75 * smoothstep(7., 28., vW.y));   // the upper walls stand in shade
    float upc = up * up * (3. - 2. * up);
    vec3 amb = mix(uDeep * 0.5 + uHoney * 0.02, uPearl * 0.36, upc * (0.4 + 0.6 * upc)) * (1. - 0.3 * occ);
    amb += uPearl * 0.2 * (1. - up) / (1. + rdc * rdc / 1500.);               // the bright floor under the dome, thrown back up
    vec3 lcool = amb * uRoomAmb + uPearl * uRoomKey * kd;
    // the fountain stands in the sun the eyes let in: its flank toward the sun is lit by what the water throws up, crawling
    float fz = (1. - smoothstep(6.5, 9.5, rdc)) * (1. - smoothstep(9.5, 12., vW.y));
    vec2 hs = normalize(-uSunC.xz + vec2(1e-4, 0.)); hs = vec2(hs.x * 0.825 - hs.y * 0.565, hs.x * 0.565 + hs.y * 0.825);   // (from the sun's side, swung west: the side we come from)
    vec3 Kf = normalize(vec3(hs.x, 0.3, hs.y));
    float sideK = smoothstep(-0.25, 0.65, dot(N, Kf));
    lcool *= 1. - 0.35 * fz * (1. - sideK);
    lcool += uBeamCol * fz * sideK * (0.5 + 0.85 * hCaustic(vW.xz * 0.5 + vW.y * 0.37));
    // inside the dome the plaster glows with what the floor sends back
    float inD = smoothstep(41., 48., vW.y);
    lcool = mix(lcool, uDeep * (0.62 + 0.3 * smoothstep(46., 78., vW.y)) + uPearl * 0.05, inD);
    light = lcool * uLight;
    float nl = dot(N, -uSunC);
    if (nl > 0.) sunAdd = hCoolStars(vW, ewS) * (0.3 + 0.7 * smoothstep(0., 0.5, nl)) * uStarGain * uLight * (1. - inD);
  }
  if (vW.z < uRecZ) {                                                       // the recess: dimmer, and the portal's glow on what faces it
    vec3 tp = uGlow.xyz - vW; float dp = length(tp) + 1e-3;
    light = light * 0.8 + uPortalCol * (0.2 + 0.8 * max(dot(N, tp / dp), 0.)) * 0.5 / (1. + dp * dp / 300.) * uLight;
  }
  if (vW.z > 63.2) {                                                        // caustics thrown up from the water of the cool hall and warm room
    float cw = vW.z > 127. ? ((m == 3 ? 1.1 * smoothstep(0.1, -0.5, N.y) * smoothstep(11., 6., vW.y) : 0.) + (m == 1 ? 0.11 * smoothstep(44., 50., vW.y) : 0.) + (m == 0 ? 0.1 * smoothstep(21., 27., vW.y) : 0.))
                           : (m == 1 ? 0.2 * smoothstep(17., 24., vW.y) : 0.);
    if (cw > 0.) light += uPearl * cw * hCaustic(vW.xz * 0.42 + vW.y * 0.3) * uLight;
  }
  if (vW.z < uRecZ && m == 1) light += uPearl * 0.14 * smoothstep(22., 27., vW.y) * hCaustic(vW.xz * 0.36 + vW.y * 0.3) * uLight;   // the wet floor's light crawling on the recess vault
  alb += vec3(0.03, 0.031, 0.035) * room * (1. - alb);                      // the world's rooms: no black basalt
  // hanging lamps and the furnace mouth: amber pools on whatever is near them
  vec3 Rl = reflect(-V, N); float lampD = 0., lampS = 0.;
  for (int i = 0; i < ${NLAMP}; i++) {
    vec4 l = uLamp[i];
    vec3 d = vec3(l.w < 0. && vW.x < 0. ? -l.x : l.x, l.y, l.z) - vW;
    float d2 = dot(d, d) + 1e-3;
    float att = abs(l.w) * max(1. / (1. + d2 / 26.) - 0.08, 0.) * (1. + 0.07 * sin(uTime * (4.3 + float(i) * 0.37) + float(i) * 2.1));
    vec3 dn = d / sqrt(d2);
    lampD += att * (0.22 + 0.78 * max(dot(N, dn), 0.));
    float sp = max(dot(Rl, dn), 0.); sp *= sp; sp *= sp; sp *= sp; lampS += att * sp * sp;
  }
  light += uLampCol * lampD * (1. + 0.45 * hush);
  vec3 col = alb * light;
  if (m == 8) col += uDeep * uLight * (0.12 * smoothstep(0.76, 0.95, vUv.y) + 0.07 * pow(max(1. - max(dot(N, V), 0.), 0.), 2.));   // a faint blue rim on every cell

  // ---- wet sheen: the pearl dome mirrored in the film of water, with the eyes as soft glints
  if (gloss > 0.) {
    vec3 Ng = N;
    if (wetGlint > 0.5 && wetGlint < 1.5) {                                 // the film is never still: slow ripples tilt the mirror
      vec2 rip = vec2(hNoise(vW.xz * 0.55 + uTime * vec2(0.5, 0.3)), hNoise(vW.xz * 0.55 + 31. - uTime * vec2(0.35, 0.45))) - 0.5;
      Ng = normalize(N + vec3(rip.x, 0., rip.y) * 0.11);
    }
    vec3 R = reflect(-V, Ng);
    float fres = 0.04 + 0.96 * pow(max(1. - max(dot(Ng, V), 0.), 0.), 5.);
    vec3 env = mix(uDeep * 0.3, uDeep * 0.5 + uPearl * (wetGlint > 0.5 && wetGlint < 1.5 ? 0.1 : 0.24), smoothstep(-0.1, 0.5, R.y)) * uLight;
    float spec = pow(max(dot(R, toL / dl), 0.), 28.);                       // the glowing dome itself, as a soft highlight
    if (wetGlint > 0.5) {
      vec2 q = R.xz / max(R.y + 0.35, 0.2) * 3.1 + vW.xz * 0.012;
      vec4 hc = hHexCell(q + 0.25 * hFbm(vW.xz * 0.6 + uTime * 0.05));
      float eye = smoothstep(0.16, 0.05, length(hc.xy)) * step(0.05, R.y) * step(hHash(hc.zw + 3.), 0.75);
      env += uBeamCol * eye * (wetGlint < 1.5 ? 0.22 : 1.6) * hCloud(vW.z, 1.);      // (on the wet floor only a faint memory of the roof: the stars at the shafts' feet are the lights there)
      if (wetGlint < 1.5) {
        // drip rings widening on the film, two sizes
        vec2 g = vW.xz / 11.; vec2 gi = floor(g); vec2 gc = (gi + 0.25 + 0.5 * vec2(hHash(gi + 1.3), hHash(gi + 7.7))) * 11.;
        float ph = fract(uTime * 0.31 + hHash(gi + 2.9)); float rr = length(vW.xz - gc);
        float rings = (1. - ph) * smoothstep(0.35, 0., abs(rr - ph * 3.6)) * step(hHash(gi + 5.1), 0.7);
        g = vW.xz / 6.3 + 3.7; gi = floor(g); gc = (gi + 0.25 + 0.5 * vec2(hHash(gi + 4.3), hHash(gi + 8.1)) - 3.7) * 6.3;
        ph = fract(uTime * 0.47 + hHash(gi + 6.9)); rr = length(vW.xz - gc);
        rings += 0.8 * (1. - ph) * smoothstep(0.22, 0., abs(rr - ph * 2.2)) * step(hHash(gi + 1.1), 0.55);
        env *= 1. + 1.1 * rings;
        // the portal's glow laid down the wet floor of the recess as a long broken streak
        if (uGlow.w > 0. && vW.z < uRecZ + 3. && R.z < -0.02) {
          float tg = (uGlow.z - vW.z) / R.z; vec3 hp = vW + R * tg;
          float sx = (hp.x - uGlow.x) / 6.2, sy = (hp.y - uGlow.y) / 12.;
          env += uPortalCol * 1.25 * uGlow.w * exp(-sx * sx - sy * sy) * (0.55 + 0.9 * hNoise(vW.xz * 1.3 + vec2(0., uTime * 0.8)));
        }
        if (vW.z < uRecZ + 3.) {                                              // the chamber's polished floor carries every lamp as a long amber streak laid toward the eye
          float rl = max(length(R.xz), 1e-3); vec2 rn = R.xz / rl; float rel = R.y / rl; float streak = 0.;
          for (int i = 0; i < ${NLAMP}; i++) {
            vec4 l = uLamp[i];
            vec3 d = vec3(l.w < 0. && vW.x < 0. ? -l.x : l.x, l.y, l.z) - vW;
            float dl = max(length(d.xz), 1e-3); vec2 dn = d.xz / dl; float del = d.y / dl;
            float ea = (rn.x * dn.y - rn.y * dn.x) / 0.034, ee = (rel - del) / (0.12 + 0.5 * del);
            streak += abs(l.w) * exp(-ea * ea - ee * ee) * step(0., dot(rn, dn)) / (1. + dl * dl / 2600.);
          }
          env += uLampCol * streak * 0.75 * (0.45 + 1.1 * hNoise(vW.xz * 2.7 + uTime * vec2(0.3, -0.4)));
        }
      }
    }
    if (m == 11) {                                                          // metal: mostly mirror, tinted by itself
      col = alb * (light * 0.5 + env * 0.8 + uPearl * spec * 1.6 * uLight + uPearl * pow(max(1. - max(dot(Ng, V), 0.), 0.), 3.) * 0.25 * uLight + uLampCol * lampS * 1.5);
    } else {
      col = mix(col, env, clamp(fres * gloss * 1.25 + 0.05 * gloss, 0., 1.));
      if (m == 3 || m == 4) col += uPearl * spec * gloss * 0.5 * uLight;
      col += uLampCol * lampS * gloss * 0.9;
    }
  }
  if (m == 12) {                                                            // lit glass behind a brass lattice; a fire behind bars
    float flick = 0.88 + 0.12 * sin(uTime * 6.3 + vW.x * 1.7 + vW.z * 2.3) * sin(uTime * 2.1 + vW.z);
    if (vUv.y < 1.5) {
      vec2 lg = vec2(vUv.x * 2.2, vUv.y * 3.);
      float lat = min(abs(fract(lg.x + lg.y) - 0.5), abs(fract(lg.x - lg.y) - 0.5));
      float open = smoothstep(0.05, 0.14, lat) * smoothstep(0., 0.08, vUv.y) * smoothstep(1., 0.92, vUv.y);
      float facing = max(dot(N, V), 0.);
      col = mix(uBrass * 0.3 * (light + uLampCol * 0.4), vCol * (0.7 + 0.9 * facing * facing) * flick, open);
    } else {
      float fv = vUv.y - 2.;
      float f1 = hFbm(vec2(vUv.x * 1.1, fv * 2.2 - uTime * 1.5) + 3.), f2 = hNoise(vec2(vUv.x * 2.7 + 9., fv * 4. - uTime * 3.1));
      float fire = smoothstep(0.25, 0.85, f1 * 0.7 + f2 * 0.3 + (1. - fv) * 0.55 - 0.25);
      col = vCol * (0.12 + 1.5 * fire) * mix(0.05, 1., smoothstep(0.1, 0.17, abs(fract(vUv.x / 0.9) - 0.5))) * flick;
    }
  }

  col = max(col + mix(alb * 1.5 + 0.03, alb * 2.4 + 0.25, smoothstep(0.3, 0.7, N.y)) * sunAdd, 0.);      // (on a wall it is light on stone: the stone shows through)                                        // a star or hexagon of sun from one of the cool hall's eyes
  // ---- steam: the layer above the underside glows pearl and thickens with the length of sight through it
  vec3 seg = vW - cameraPosition; float sl = length(seg);
  float yhi = max(vW.y, cameraPosition.y), ylo = min(vW.y, cameraPosition.y);
  float frac = clamp((yhi - max(ylo, uSteamBase)) / max(yhi - ylo, 0.5), 0., 1.);
  frac = max(frac, 0.2 * smoothstep(0., 1., uHaze));
  float haze = 1. - exp(-sl * frac * 0.0042 * uHaze);
  col = mix(col, (uSteam * 0.07 + uDeep * 0.3) * uLight, haze);
  gl_FragColor = vec4(col, 1.);
  #include <fog_fragment>
}`;

// ---------------------------------------------------------------- light: eyes, beams, floor stars
const INST_PARS = /* glsl */`
attribute vec3 aEye; attribute vec3 aNrm; attribute vec4 aDome; attribute vec4 aParam; attribute vec2 aShape; attribute float aSel;   // aSel: 1 a principal shaft, about 0.3 a pale far one, 0 glass only
// aParam: x delay (m), y 1 = accent glass, z random, w 0 great dome / 1 corner dome / 2 + beam gain: a room of the world.   aShape: x 0 star / 1 hexagon, y scale
`;
const EYE_VERT = /* glsl */`
${INST_PARS}
varying vec2 vQ; varying vec3 vW, vTint; varying vec4 vP; varying float vShape;
#include <fog_pars_vertex>
${GLSL_COMMON}
void main(){
  vTint = uGlass[int(clamp(aParam.y, 0., 4.) + 0.5)];
  vec3 n = aNrm; vec3 t1 = normalize(cross(n, abs(n.y) > 0.95 ? vec3(1., 0., 0.) : vec3(0., 1., 0.))); vec3 t2 = cross(n, t1);
  vW = aEye + n * 0.15 + (t1 * position.x + t2 * position.y) * 1.9 * aShape.y;
  vQ = position.xy / 0.316; vShape = aShape.x;
  vP = vec4(aParam.y, aParam.z, hCloud(aEye.z, aParam.z), 0.);
  vec4 mvPosition = viewMatrix * vec4(vW, 1.);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const EYE_FRAG = /* glsl */`
uniform vec3 uPearl, uShade, uBeamCol, uAccentGlow, uSunL;
uniform float uEyeGain;
varying vec2 vQ; varying vec3 vW, vTint; varying vec4 vP; varying float vShape;
#include <fog_pars_fragment>
float eStar(vec2 p, float r){ float a = max(abs(p.x) * 0.8660254 + p.y * 0.5, -p.y), b = max(abs(p.x) * 0.8660254 - p.y * 0.5, p.y); return min(a, b) - r * 0.5; }
float eHex(vec2 p, float r){ p = abs(p); return max(p.x * 0.8660254 + p.y * 0.5, p.y) - r; }
float eHash(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
${GLSL_FOGFADE}
void main(){
  float sd = vShape < 0.5 ? eStar(vQ, 1.25) : eHex(vQ, 0.86);
  float r = length(vQ);
  vec3 tint = vTint;
  vec3 V = normalize(cameraPosition - vW);
  float lit = vP.z;
  float hot = pow(max(dot(V, uSunL), 0.), 60.) * 5. + exp(-r * r * 5.) * 2.2;
  float bub = step(0.83, eHash(floor(vQ * 9.) + vP.y * 31.)) * smoothstep(0.25, 0.05, abs(r - 0.62));
  vec3 glass = tint * (2.6 + hot * 1.4 + bub * 1.6) * lit * uEyeGain + uShade * 0.2 * (1. - lit);
  float collar = clamp(sd / 1.1, 0., 1.);
  vec3 reveal = uPearl * mix(0.2, 0.5, collar) + tint * 0.5 * exp(-sd * 3.5) * lit;
  vec3 col = mix(glass, reveal, smoothstep(-0.03, 0.03, sd));
  float a = 1. - smoothstep(1.0, 1.9, sd);
  float keep = sqrt(hFogKeep());
#ifdef USE_FOG
  col = mix(fogColor, col, keep);
#endif
  gl_FragColor = vec4(col * a, a);
}`;

const BEAM_VERT = /* glsl */`
${INST_PARS}
uniform float uBeamW;
varying vec3 vW, vN, vTint; varying vec4 vP;
#include <fog_pars_vertex>
${GLSL_COMMON}
${GLSL_LAND}
void main(){
  vec3 L = uSunL; vec3 n; float show;
  vTint = uGlass[int(clamp(aParam.y, 0., 4.) + 0.5)] * (aParam.y > 0.5 ? 1.35 : 1.);
  float len = hLand(aEye, aDome, aParam.w, L, n, show);
  vec3 A = normalize(cross(L, vec3(0., 0., 1.) + vec3(1e-3, 0., 0.))), B = cross(L, A);
  float t = position.y * len;
  float dAxis = length(cross(cameraPosition - aEye, L));
  float gainW = aParam.w > 1.5 ? aParam.w - 2. : 1.;      // the world's rooms: 2 + gain (0 = clear air, no beam)
  float hall = step(1.5, aParam.w);
  // a principal shaft of the hot room is a metre and more of light, widening toward the floor; a pale far one a third of that
  float rad = aShape.y * mix(uBeamW * 2.3 * mix(0.58, 1., smoothstep(0.2, 0.8, aSel)), uBeamW, hall) * mix(0.62, 1.0, clamp(t / max(aEye.y / max(-L.y, 0.05), 1.), 0., 1.));
  rad = min(rad, max(mix(0.3, 0.026, hall) * dAxis, 0.04));      // (a shaft we pass close by keeps its width and fades instead: see vP.z)
  rad *= mix(1., mix(0.72, 0.45, hall), smoothstep(22., 70., dAxis));   // the far ones draw in
  vN = A * position.x + B * position.z;
  vW = aEye + L * t + vN * rad * step(0.01, aSel);
  vP = vec4(aParam.x, aParam.y, hCloud(aEye.z, aParam.z) * smoothstep(mix(3., 5., hall), mix(9., 17., hall), dAxis) * gainW * aSel, aParam.z);
  vec4 mvPosition = viewMatrix * vec4(vW, 1.);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const BEAM_FRAG = /* glsl */`
uniform vec3 uBeamCol, uAccentBeam;
uniform float uBeamGain;
uniform vec4 uGlow;
varying vec3 vW, vN, vTint; varying vec4 vP;
#include <fog_pars_fragment>
${GLSL_COMMON}
${GLSL_FOGFADE}
void main(){
  vec3 V = normalize(cameraPosition - vW);
  float f = abs(dot(normalize(vN + vec3(1e-5)), V));
  f = clamp(f / max(length(cross(V, uSunL)), 0.3), 0., 1.);      // the same core-and-skin profile however obliquely the rod is seen
  float nz = hNoise3(vec3(vW.xz * 1.3, vW.y * 0.3 + uTime * 0.9) + vP.w * 17.);
  float cx = clamp(sqrt(max(1. - f * f, 0.)) + 0.13 * (nz - 0.5), 0., 1.);   // 0 on the rod's axis, 1 at its skin
  float edge = max(exp(-cx * cx * 4.4) - 0.012, 0.);                        // bright along the axis, falling softly to nothing at the skin: a rod with clear air beside it
  float gh = vW.y - (uSteamBase + vP.x);
  float grow = smoothstep(0., 6., gh);
  grow *= 1. + 2.2 * (1. - smoothstep(5., 26., gh)) * smoothstep(-13., 2., uSteamBase);   // the growing end is the brightest: the steam is thickest at its underside
  // steam rolling through the shaft: slow billows sinking, finer wisps sliding down the rod
  float r1 = hNoise3(vec3(vW.xz * 0.14 + uTime * vec2(0.22, 0.15), vW.y * 0.1 + uTime * 0.4) + vP.w * 9.);
  float r2 = hNoise3(vec3(vW.xz * 0.45 - uTime * vec2(0.4, 0.5), vW.y * 0.33 + uTime * 1.7));
  float roll = clamp(0.26 + 1.7 * smoothstep(0.22, 0.78, r1) * (0.45 + 1.1 * r2), 0.26, 1.9);         // light shows where the steam is: brightest where a billow drifts through the shaft, never quite gone between
  // near shafts stand bright, far ones pale in the haze
  float far = mix(0.24, 1., exp(-max(length(cameraPosition - vW) - 16., 0.) * 0.021));
  // no beam veils the way out: where a rod crosses the line of sight to the portal it thins
  vec3 toP = uGlow.xyz - cameraPosition; float lp = length(toP) + 1e-3;
  float win = mix(1., mix(0.1, 1., smoothstep(0.9976, 0.9877, dot(-V, toP / lp))), step(0.001, uGlow.w));
  float a = edge * grow * roll * vP.z * uBeamGain * far * win * hFogKeep();
  a = 0.5 * a / (1. + 1.1 * a);                                // always see-through: the room shows through every shaft, and the steam's texture stays in it
  gl_FragColor = vec4(vTint * a, 1.);
}`;

const STAR_VERT = /* glsl */`
${INST_PARS}
uniform float uWallStar;      // 0: this mesh draws the stars that land on floors and water, 1: those on walls and domes
varying vec2 vQ; varying vec4 vP; varying float vShape; varying vec3 vTint;
#include <fog_pars_vertex>
${GLSL_COMMON}
${GLSL_LAND}
void main(){
  vec3 L = uSunL; vec3 n; float show;
  float len = hLand(aEye, aDome, aParam.w, L, n, show);
  vec3 hit = aEye + L * len;
  vTint = uGlass[int(clamp(aParam.y, 0., 4.) + 0.5)] * (aParam.y > 0.5 ? 1.6 : 1.);
  vec3 A = normalize(cross(L, vec3(0., 0., 1.) + vec3(1e-3, 0., 0.))), B = cross(L, A);
  float ln = dot(L, n); ln = ln < 0. ? min(ln, -0.17) : 0.17;
  vec3 A2 = A - L * dot(A, n) / ln, B2 = B - L * dot(B, n) / ln;
  float rad = aShape.y * mix(0.6, 1.0, clamp(len / max(aEye.y / max(-L.y, 0.05), 1.), 0., 1.));
  float wall = 1. - step(0.5, n.y), pick = (1. - abs(wall - uWallStar)) * max(step(0.01, aSel), wall);      // on the floor one star for each standing shaft and none for the rest; walls and domes keep the soft light of every eye
  float selK = smoothstep(0.2, 0.8, aSel); rad *= mix(0.7, mix(1.5, 1., step(1.5, aParam.w)), selK);
  vec3 wp = hit + n * 0.07 + (A2 * position.x + B2 * position.y) * rad * 2.8 * pick;
  vQ = position.xy * 2.8; vShape = aShape.x;
  float grown = 1. - smoothstep(-4., 2., uSteamBase + aParam.x - hit.y);
  vP = vec4(grown * show * hCloud(aEye.z, aParam.z) * clamp(abs(dot(L, n)) * 1.25, 0.12, 1.) * pick * mix(0.5, 1., selK), aParam.y, aParam.z, wall);
  float wy = aParam.w > 1.5 ? aDome.w : ${WATER_Y.toFixed(1)};
  if (wall < 0.5 && wy > 0.01 && abs(hit.y - wy) < 0.03) vP.w = 0.25;      // it lies on water: the fragment shader breaks it into glints
  vec4 mvPosition = viewMatrix * vec4(wp, 1.);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const STAR_FRAG = /* glsl */`
uniform vec3 uBeamCol, uAccentBeam;
uniform float uStarGain, uTime;
varying vec2 vQ; varying vec4 vP; varying float vShape; varying vec3 vTint;
#include <fog_pars_fragment>
float sStar(vec2 p, float r){ float a = max(abs(p.x) * 0.8660254 + p.y * 0.5, -p.y), b = max(abs(p.x) * 0.8660254 - p.y * 0.5, p.y); return min(a, b) - r * 0.5; }
float sHex(vec2 p, float r){ p = abs(p); return max(p.x * 0.8660254 + p.y * 0.5, p.y) - r; }
${GLSL_FOGFADE}
void main(){
  float sd = vShape < 0.5 ? sStar(vQ, 1.25) : sHex(vQ, 0.86);
  if (vP.w > 0.5) {      // on a wall or a dome it is light on stone: soft-edged, and (by this mesh's blending) it multiplies what is there, so courses, joints and block colour show through
    float soft = smoothstep(0.3, -0.22, sd) * (0.85 + 0.15 * sin(uTime * 1.9 + vP.z * 40. + vQ.x * 2.1));
    gl_FragColor = vec4(vTint * soft * 3.4 * vP.x * min(uStarGain, 1.), 1.);
    return;
  }
  if (vP.w > 0.1) {      // on water a star is a patch of glints: the ripples break its outline and only their crests carry the light
    float w1 = sin(vQ.x * 5.1 + uTime * 1.3 + vP.z * 30.) * sin(vQ.y * 4.3 - uTime * 1.1 + vP.z * 17.);
    float w2 = sin((vQ.x + vQ.y) * 8.7 + uTime * 2.1) * sin((vQ.x - vQ.y) * 7.3 - uTime * 1.7 + vP.z * 9.);
    float soft = smoothstep(0.3, -0.25, sd + 0.3 * w1);
    float crest = max(w2, 0.) * max(w1 + 0.45, 0.);
    gl_FragColor = vec4(vTint * soft * (0.1 + 1.9 * crest) * vP.x * uStarGain * hFogKeep(), 1.);
    return;
  }
  float core = smoothstep(0.05, -0.03, sd);
  float r2 = dot(vQ, vQ);
  float halo = exp(-r2 * 1.1) * 0.16 * (1. - smoothstep(5., 7.8, r2));       // a little of itself blurred in the wet, close in: the marble round it stays dark
  halo *= 1. + 0.55 * sin(sqrt(r2) * 5.5 - uTime * 3.6 + vP.z * 20.);                        // rings running out through the wet
  core *= 0.74 + 0.36 * sin(uTime * 2.3 + vP.z * 40. + vQ.x * 2.1) * sin(uTime * 1.6 + vQ.y * 1.7 + vP.z * 13.)
        + 0.22 * sin(uTime * 5.1 + vP.z * 71. + (vQ.x + vQ.y) * 3.3);                        // steam crossing the shaft
  vec3 col = vTint * (core * 2.3 + halo) * vP.x * uStarGain * hFogKeep();
  gl_FragColor = vec4(col, 1.);
}`;

// ---------------------------------------------------------------- water, overflow sheets, steam, drips, bubbles
const SIMPLE_VERT = /* glsl */`
varying vec3 vW; varying vec2 vUv;
#include <fog_pars_vertex>
void main(){
  vec4 wp = modelMatrix * vec4(position, 1.); vW = wp.xyz; vUv = uv;
  vec4 mvPosition = viewMatrix * wp; gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const WATER_FRAG = /* glsl */`
uniform vec3 uPearl, uSteam, uHoney, uBasalt, uShade, uBeamCol, uPortalCol, uRoomKey, uRoomAmb;
uniform float uHaze, uLight;
uniform vec4 uFount;      // a fountain standing in the water: x, z, the radius where its water lands, strength
uniform vec4 uGlow;       // the exit portal: x, y, z of its centre, strength
uniform vec4 uLamp[${NLAMP}]; uniform vec3 uLampCol;
varying vec3 vW; varying vec2 vUv;
#include <fog_pars_fragment>
${GLSL_COMMON}
${GLSL_COOL}
float wH(vec2 p){ return hFbm(p * 0.42 + vec2(uTime * 0.14, -uTime * 0.1)) + 0.2 * hFbm(p * 1.5 - vec2(uTime * 0.23, uTime * 0.07)); }
float wArch(float cls, float s){ float hs = cls < 0.5 ? 18. : 17., c = cls < 0.5 ? 4.8 : 3.45; float R = 10. + c, x = min(abs(s), 10.) + c; return hs + sqrt(max(R * R - x * x, 0.)); }
void main(){
  vec2 p = vW.xz; vec3 V = normalize(cameraPosition - vW);
  float fw = length(fwidth(p));                                            // metres of water under one pixel
  float ewS = clamp(0.45 * length(fwidth(vW)), 0.03, 0.22);
  float room = vW.z > 127. ? 2. : (vW.z > 63.2 ? 1. : 0.);                 // 2 the cool hall, 1 the warm room, 0 the hot room
  float e = 0.3; float h0 = wH(p);
  vec2 g = vec2(wH(p + vec2(e, 0.)) - h0, wH(p + vec2(0., e)) - h0) / e;
  // fine wavelets near the eye: four trains of crests bent by a slow noise, each fading out where a pixel can no longer hold it
  vec2 pq = p + 0.5 * vec2(hNoise(p * 0.6 + uTime * 0.11), hNoise(p * 0.6 + 9.3 - uTime * 0.09));
  vec2 wv = vec2(0.8, 0.6) * cos(dot(pq, vec2(0.8, 0.6)) * 4.7 - uTime * 2.2) * 0.2 * (1. - smoothstep(0.9, 2.2, 4.7 * fw));
  wv += vec2(-0.6, 0.8) * cos(dot(pq, vec2(-0.6, 0.8)) * 7.9 - uTime * 3.0) * 0.2 * (1. - smoothstep(0.9, 2.2, 7.9 * fw));
  wv += vec2(0.28, -0.96) * cos(dot(pq, vec2(0.28, -0.96)) * 12.7 - uTime * 3.9) * 0.18 * (1. - smoothstep(0.9, 2.2, 12.7 * fw));
  wv += vec2(-0.96, -0.28) * cos(dot(pq, vec2(-0.96, -0.28)) * 19.3 - uTime * 5.3) * 0.15 * (1. - smoothstep(0.9, 2.2, 19.3 * fw));
  g += wv;
  // rings from drips and from the basins' running taps
  vec2 c = vW.xz / 7.; vec2 ci = floor(c); vec2 cc = (ci + 0.25 + 0.5 * vec2(hHash(ci + 1.3), hHash(ci + 7.7))) * 7.;
  float ph = fract(uTime * 0.36 + hHash(ci + 2.9)); vec2 dv = p - cc; float rr = length(dv) + 1e-3;
  float ring = (1. - ph) * sin((rr - ph * 4.) * 5.) * smoothstep(1.4, 0., abs(rr - ph * 4.));
  g += dv / rr * ring * 1.2;
  // rings running out from where the fountain's threads land, and the broken white water there
  vec2 fv = p - uFount.xy; float fr = length(fv) + 1e-3;
  float fk = uFount.w * smoothstep(uFount.z + 14., uFount.z + 1., fr) * smoothstep(uFount.z - 1.4, uFount.z - 0.2, fr);
  g += fv / fr * sin((fr - uTime * 2.4) * 4.2 + 1.5 * hNoise(p * 0.6)) * fk * 2.2;
  float foam = uFount.w * smoothstep(1.2, 0., abs(fr - uFount.z - 0.15)) * (0.25 + 0.75 * hNoise(p * 3.1 + uTime * vec2(1.3, -0.9)))
             * (0.55 + 0.45 * cos(atan(fv.x, fv.y + 1e-4) * 12. + 3.14159));
  vec3 N = normalize(vec3(-g.x * 0.085, 1., -g.y * 0.085));      // calm water: fine ripples, long unbroken reflections
  vec3 R = reflect(-V, N); R.y = abs(R.y) + 1e-3;
  float fres = 0.05 + 0.95 * pow(max(1. - max(dot(N, V), 0.), 0.), 5.);
  // ---- what the surface mirrors: the vault or dome overhead ...
  vec3 env = mix(uDeep * 0.3, uPearl * 0.08 + uDeep * 0.5, smoothstep(-0.05, 0.55, R.y)) * uLight;
  float domeRef = 1., poolK = 1.;
  if (room > 1.5) {                                                        // the cool hall's water mirrors a dark ceiling with one bright dome in it
    vec2 hp = p + R.xz * (40. - vW.y) / max(R.y, 0.03); float rdh = length(hp - vec2(0., 191.));
    domeRef = 1. - smoothstep(27., 37., rdh);
    env = mix(uDeep * 0.36 + uPearl * 0.03, uPearl * 0.14 + uDeep * 0.55, domeRef) * uLight;
    float rdc = length(p - vec2(0., 191.)); poolK = 0.5 + 0.7 / (1. + rdc * rdc / 1500.);
  }
  // ... the wall we travel toward, its striped courses, tiled dado and arch, and what glows beyond the opening ...
  if (R.z < -0.03) {
    float zw = room > 1.5 ? 131. : (room > 0.5 ? 63.3 : -55.);
    float tw = (zw - vW.z) / R.z; vec3 hp = vW + R * tw;
    float top = room > 1.5 ? 40. : (room > 0.5 ? 38. : 32.), halfW = room > 1.5 ? 45. : (room > 0.5 ? 30. : 62.);
    float aH = wArch(room > 1.5 ? 1. : 0., hp.x);
    float open = (1. - smoothstep(9.6, 10.2, abs(hp.x))) * (1. - smoothstep(aH - 0.4, aH + 0.4, hp.y));
    float course = floor(hp.y / 2.5);
    vec3 wc = (mod(course, 2.) < 0.5 ? uBasalt * 0.95 : uHoney * 0.85) * (0.78 + 0.44 * hHash(vec2(floor(hp.x / 3.3 + course * 0.37), course)));
    wc = mix(wc, vec3(0.03, 0.3, 0.34), step(hp.y, 5.));                   // the tiled dado
    wc = mix(wc, uPearl * 0.6, step(20., hp.y));                           // plaster above the courses
    float ringK = step(abs(hp.x), 12.4) * step(hp.y, aH + 2.4) * step(14., hp.y);
    wc = mix(wc, mod(floor(atan(hp.x + 1e-4, hp.y - 16.) * 8.), 2.) < 0.5 ? uHoney * 0.9 : uBasalt * 0.95, ringK);   // the striped ring of the arch
    vec3 wl = mix(vec3(0.52), uDeep * 0.6, smoothstep(5., 24., hp.y)) * uLight * (room > 0.5 ? 0.5 * (uRoomKey + uRoomAmb) : vec3(1.));
    vec3 thru = room > 1.5 ? uDeep * 0.24 + uLampCol * 0.1 : (room > 0.5 ? uDeep * 0.3 + uSteam * 0.1 + uBeamCol * 0.1 * hCloud(0., 1.) : uDeep * 0.24 + uLampCol * 0.05);
    if (room < 0.5 && uGlow.w > 0.) {                                      // the portal at the end of the recess
      float tg = (uGlow.z - vW.z) / R.z; vec3 gp = vW + R * tg;
      float gx = (gp.x - uGlow.x) / 7., gy = (gp.y - uGlow.y) / 9.5;
      thru += uPortalCol * 1.3 * exp(-gx * gx - gy * gy);
      float tq = (14.4 - vW.z) / R.z, py = vW.y + R.y * tq;                  // the platform stands before that wall
      float pk = step(0., tq) * (1. - smoothstep(2.3, 2.6, py)) * (1. - smoothstep(5.6, 6.2, abs(vW.x + R.x * tq)));
      wc = mix(wc, uPearl * 0.8, pk); open *= 1. - pk;
    }
    float wm = (1. - smoothstep(top - 1., top + 1., hp.y)) * (1. - smoothstep(halfW - 1., halfW + 1., abs(hp.x))) * step(0., tw);
    env = mix(env, mix(wc * wl, thru * uLight, open), wm * 0.9);
  }
  if (vW.z < -57. && uGlow.w > 0. && R.z < -0.02) {                       // the chamber's pool mirrors the portal
    float tg = (uGlow.z - vW.z) / R.z; vec3 gp = vW + R * tg;
    float gx = (gp.x - uGlow.x) / 7., gy = (gp.y - uGlow.y) / 9.5;
    env += uPortalCol * 1.1 * exp(-gx * gx - gy * gy) * uLight;
  }
  // ... and the fountain, standing white in the pool
  if (uFount.w > 0.) {
    vec2 fo = uFount.xy - p; float tF = dot(fo, R.xz) / max(dot(R.xz, R.xz), 1e-4);
    float dm = length(fo - R.xz * tF), hF = vW.y + R.y * tF;
    float pr = 0.95 + 4.3 * exp(-(hF - 3.3) * (hF - 3.3) * 2.2) + 2.6 * exp(-(hF - 5.8) * (hF - 5.8) * 3.) + 1.3 * exp(-(hF - 7.85) * (hF - 7.85) * 4.);
    float fm = smoothstep(pr + 0.3, pr - 0.3, dm) * step(0., tF) * (1. - smoothstep(8.8, 9.6, hF));
    float veil = 0.4 * smoothstep(5.9, 5.2, dm) * step(0., tF) * (1. - smoothstep(3.0, 3.6, hF)) * (0.6 + 0.4 * sin(atan(fo.x, fo.y + 1e-4) * 24.));   // the threads falling from its lowest lip
    env = mix(env, uPearl * (0.5 + 0.2 * smoothstep(2., 8., hF)) * uLight * uRoomKey, max(fm, veil) * uFount.w);
  }
  vec2 q = R.xz / max(R.y + 0.3, 0.2) * 2.5 + p * 0.012;                   // the eyes overhead, as soft glints
  const vec2 s = vec2(1., 1.7320508);
  vec4 hC = floor(vec4(q, q - vec2(0.5, 1.)) / s.xyxy) + 0.5; vec4 hh = vec4(q - hC.xy * s, q - (hC.zw + 0.5) * s);
  bool first = dot(hh.xy, hh.xy) < dot(hh.zw, hh.zw);
  vec2 hl = first ? hh.xy : hh.zw; vec2 hid2 = first ? hC.xy : hC.zw + 0.5;
  // (only where the water is seen steeply, near the bowl: far water keeps broad calm reflections)
  env += uBeamCol * smoothstep(0.2, 0.05, length(hl)) * 0.7 * smoothstep(0.09, 0.34, R.y) * domeRef * step(hHash(hid2 + 1.9), 0.6) * hCloud(vW.z, 1.);
  // ---- the bed: inlaid marble a hand's depth down, swimming under the ripples, a fine net of caustics crawling over it
  vec2 pb = p + g * 0.16 + wv * 0.08;
  vec4 hc = hHexCell(pb / 2.6);
  float ew = clamp(fw / 2.6 * 1.2, 0.012, 0.3);
  float ds = hStar(hc.xy, 0.43), dh = hHex(hc.xy, 0.15), db = hHex(hc.xy.yx, 0.468);
  float hid = hHash(hc.zw + 3.1);
  vec3 turq = vec3(0.04, 0.36, 0.4), cob = vec3(0.03, 0.08, 0.42);
  vec3 bed = uPearl * (0.5 + 0.14 * hFbm(pb * 0.6 + 3.));
  bed = mix(bed, room > 0.5 && room < 1.5 ? uHoney * 0.8 : turq, smoothstep(ew, -ew, ds));
  bed = mix(bed, hid < 0.28 ? (room > 0.5 && room < 1.5 ? turq : uHoney * 0.85) : cob, smoothstep(ew, -ew, dh));
  bed = mix(bed, uBasalt * 0.8, smoothstep(-ew, ew, db));
  bed *= 1. - 0.3 * smoothstep(ew * 1.5, 0., min(abs(ds), abs(dh)));
  bed = mix(vec3(dot(bed, vec3(0.3, 0.5, 0.2))), bed, 0.7) * vec3(0.3, 0.5, 0.56);        // seen through deep green water: a step darker and quieter than the floors beside it
  vec2 cq = pb * 2.1 + 0.6 * vec2(hNoise(p * 0.5 + uTime * 0.2), hNoise(p * 0.5 + 5.1 - uTime * 0.17));
  float ce = hVor(cq);
  float net = smoothstep(0.13, 0., ce); net = net * net + 0.22 * smoothstep(0.42, 0., ce);
  bed *= mix(1., 0.9 + 0.5 * net, (1. - smoothstep(0.06, 0.22, fw * 2.1)) * exp(-length(vW - cameraPosition) / 16.));      // a faint net, only near the eye
  vec3 col = mix(bed * uLight * 0.6 * poolK * (room > 0.5 ? 0.5 * (uRoomKey + uRoomAmb) : vec3(1.)), env, clamp(fres * 1.5 + 0.16, 0., 1.));      // the mirror leads, the inlay shows faint beneath
  col += uPearl * foam * 0.55 * uLight;
  // ---- the lamps: long broken amber paths laid toward the eye
  float rl = max(length(R.xz), 1e-3); vec2 rn = R.xz / rl; float rel = R.y / rl;
  float lampS = 0.;
  for (int i = 0; i < ${NLAMP}; i++) {
    vec4 l = uLamp[i];
    vec3 d = vec3(l.w < 0. && vW.x < 0. ? -l.x : l.x, l.y, l.z) - vW;
    float dl = max(length(d.xz), 1e-3); vec2 dn = d.xz / dl; float del = d.y / dl;
    float ea = (rn.x * dn.y - rn.y * dn.x) / 0.026, ee = (rel - del) / (0.1 + 0.45 * del);
    lampS += abs(l.w) * exp(-ea * ea - ee * ee) * step(0., dot(rn, dn)) / (1. + dl * dl / 2600.);
  }
  col += uLampCol * lampS * 0.6 * (0.25 + 1.5 * hNoise(p * 5.5 + uTime * vec2(0.9, -1.3)));
  if (room > 1.5) {      // the eyes' stars lying on the water: glints, never a flat patch. The ripples break the outline and only the crests carry the light
    float crest = hNoise(p * 2.3 + uTime * vec2(0.7, -0.5)) * hNoise(p * 5.1 - uTime * vec2(0.9, 0.6) + 4.);
    vec3 st = hCoolStars(vW + vec3(g.x, 0., g.y) * 0.55, max(ewS, 0.3));
    col = max(col + st * (0.16 + 2.6 * crest) * mix(vec3(1.), uPearl, 0.5) * uStarGain * uLight, 0.);
  }
  vec3 seg = vW - cameraPosition; float sl = length(seg);
  float yhi = max(vW.y, cameraPosition.y), ylo = min(vW.y, cameraPosition.y);
  float frac = max(clamp((yhi - max(ylo, uSteamBase)) / max(yhi - ylo, 0.5), 0., 1.), 0.25 * uHaze);
  col = mix(col, (uSteam * 0.07 + uDeep * 0.3) * uLight, 1. - exp(-sl * frac * 0.0042 * uHaze));
  gl_FragColor = vec4(col, 1.);
  #include <fog_fragment>
}`;
const SHEET_FRAG = /* glsl */`
uniform vec3 uPearl; uniform float uLight;
uniform vec4 uFount;
varying vec3 vW; varying vec2 vUv;
#include <fog_pars_fragment>
${GLSL_COMMON}
void main(){
  float a; vec3 col;
  if (vUv.x >= 100.) {
    // water leaving a scalloped lip: one bright thread from each cusp fraying into beads, a dribble that comes and goes
    // from each lobe, almost nothing between (vUv.x - 100 counts scallops, fract 0.5 = the cusp; vUv.y runs down the fall)
    float u = vUv.x - 100., id = floor(u), s = fract(u) - 0.5, v = vUv.y;
    float h = hHash(vec2(id, 7.3));
    float w = mix(0.04, 0.085, v) * (0.8 + 0.4 * h);
    float wob = (hNoise(vec2(id * 3.1, v * 3. - uTime * 2.6)) - 0.5) * 0.1 * v;
    float ds = abs(s - wob);
    float th = smoothstep(w, w * 0.55, ds);
    float rim = th * (0.45 + 0.55 * smoothstep(w * 0.25, w * 0.8, ds));         // a thread of water is clear in the middle and bright at its edges
    float bd = hNoise(vec2(id * 5.7, v * (9. + 6. * h) - uTime * (4.5 + 2. * h)));
    float beads = smoothstep(0.34, 0.62, bd);                                    // lower down it breaks into drops with air between
    rim *= mix(1., beads, smoothstep(0.12, 0.7, v));
    float id2 = floor(u + 0.5), s2 = 0.5 - abs(s);
    float gate = smoothstep(0.42, 0.6, hNoise(vec2(id2 * 1.9 + 3., uTime * 0.35)));
    float dr = smoothstep(0.03, 0.008, s2) * gate * smoothstep(0.35, 0.65, hNoise(vec2(id2 * 9.1, v * 11. - uTime * 6.)));
    float veil = 0.03 * (0.4 + 0.6 * hNoise(vec2(u * 3., v * 4. - uTime * 2.2)));
    a = clamp(rim * 0.5 + dr * 0.5 + veil, 0., 1.) * smoothstep(0., 0.04, v);
    float glint = hNoise(vec2(u * 31., v * 23. - uTime * 9.)); glint *= glint; glint *= glint;
    col = uPearl * (0.75 + 0.5 * rim + 3.2 * glint * (rim + dr)) * uLight;
  } else {
    float lane = hNoise(vec2(vUv.x * 1.6, 3.));
    float run = hNoise(vec2(vUv.x * 7., vUv.y * 3. - uTime * 2.2)) * 0.6 + hNoise(vec2(vUv.x * 19., vUv.y * 5. - uTime * 3.1)) * 0.4;
    a = smoothstep(0.3, 0.62, lane) * (0.3 + 0.5 * run) * smoothstep(0., 0.06, vUv.y) * (1. - 0.4 * vUv.y);
    col = uPearl * (0.7 + 0.5 * run) * uLight;
  }
  if (vW.z > 127.) {                                // the cool hall's fountain: the threads toward the sun catch it, the others stand in shade
    vec2 fd = vW.xz - uFount.xy, hs = normalize(-uSunC.xz + vec2(1e-4, 0.)); hs = vec2(hs.x * 0.825 - hs.y * 0.565, hs.x * 0.565 + hs.y * 0.825);
    float sk = smoothstep(-0.35, 0.8, dot(fd, hs) / (length(fd) + 1e-3));
    col *= mix(0.5, 1.5, sk); a = min(a * mix(0.85, 1.1, sk), 1.);
  }
  col *= 1. + 0.5 * clamp(uCloud.z - uCloud.w, 0., 1.);        // under the real cloud the running water is what glints
  gl_FragColor = vec4(col * a, a);
  #include <fog_fragment>
}`;
const LAYER_VERT = /* glsl */`
attribute float aMat;
uniform float uSteamBase;
varying vec3 vW; varying float vLayer;
#include <fog_pars_vertex>
void main(){
  vec3 p = position; p.y = max(uSteamBase, 9.) + aMat * 7.;
  vec4 wp = modelMatrix * vec4(p, 1.); vW = wp.xyz; vLayer = aMat;
  vec4 mvPosition = viewMatrix * wp; gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const LAYER_FRAG = /* glsl */`
uniform vec3 uSteam; uniform float uLight, uSheet;
varying vec3 vW; varying float vLayer;
#include <fog_pars_fragment>
${GLSL_COMMON}
void main(){
  vec2 p = vW.xz * 0.03 + vLayer * 17.3 + vec2(uTime * 0.07, uTime * 0.045) * (1. + vLayer * 0.4);
  float n = hFbm(p + 0.6 * hFbm(p * 1.9 - uTime * 0.03));
  float a = smoothstep(0.36, 0.72, n) * 0.12 * (1. - smoothstep(38., 60., length(vW.xz)));
  a *= smoothstep(1.5, 9., abs(cameraPosition.y - vW.y)) * (1. - smoothstep(60., 80., vW.y)) * uSheet;
  vec3 col = (uSteam * 0.3 + uDeep * 0.25) * (0.6 + 0.25 * n) * uLight;
  gl_FragColor = vec4(col * a, a);
  #include <fog_fragment>
}`;
const PUFF_VERT = /* glsl */`
attribute vec4 aPuff;     // x, z of the grille, phase, random
uniform float uSteamBase, uTime;
varying vec2 vQ; varying float vA, vR;
#include <fog_pars_vertex>
void main(){
  float t = fract(uTime * 0.05 * (0.8 + 0.4 * aPuff.w) + aPuff.z);
  float top = clamp(uSteamBase + 6., 18., 62.);
  vec3 c = vec3(aPuff.x, t * top, aPuff.y);
  c.xz += vec2(sin(uTime * 0.21 + aPuff.w * 40. + t * 5.), cos(uTime * 0.17 + aPuff.w * 23. + t * 4.)) * t * 3.5;
  float size = mix(1.8, 8.5, sqrt(t)) * (0.8 + 0.5 * aPuff.w);
  vA = smoothstep(0., 0.1, t) * (1. - smoothstep(0.55, 1., t)) * 0.11; vQ = position.xy; vR = aPuff.w;
  vec4 mvPosition = viewMatrix * modelMatrix * vec4(c, 1.);
  vA *= smoothstep(8., 24., -mvPosition.z);                       // a column the eye passes close by thins: it never veils the room
  mvPosition.xy += position.xy * size;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const PUFF_FRAG = /* glsl */`
uniform vec3 uSteam; uniform float uLight;
varying vec2 vQ; varying float vA, vR;
#include <fog_pars_fragment>
${GLSL_COMMON}
void main(){
  float d = length(vQ);
  float a = smoothstep(1., 0.15, d) * (0.45 + 0.55 * hNoise(vQ * 2.1 + vR * 30. + uTime * 0.07)) * vA;
  float hush = clamp(uCloud.z - uCloud.w, 0., 1.);                // while the real cloud passes the steam is what glows
  vec3 col = (uSteam * (0.44 + 0.3 * hush) + uDeep * 0.3) * uLight;
  a = min(a * (1. + 0.45 * hush), 1.);
  gl_FragColor = vec4(col * a, a);
  #include <fog_fragment>
}`;
const DRIP_VERT = /* glsl */`
attribute vec3 aEye; attribute vec4 aD;      // yc (height where it crosses its beam), phase, speed, delay
varying vec2 vQ; varying float vB;
#include <fog_pars_vertex>
${GLSL_COMMON}
void main(){
  vec3 L = uSunL; float dn = max(-L.y, 0.05);
  vec3 c = aEye + L * ((aEye.y - aD.x) / dn);
  float y0 = min(aEye.y - 1., aD.x + 24.);
  float s = fract(uTime * aD.z + aD.y);
  float y = y0 - (y0 - 0.3) * s * s;
  vec3 wp = vec3(c.x, y, c.z);
  vec3 toC = cameraPosition - wp; float dist = length(toC);
  vec3 right = normalize(cross(vec3(0., 1., 0.), toC) + vec3(1e-4, 0., 0.));
  float w = max(0.1, dist * 0.003), len = 0.22 + 0.5 * s;      // a spark, not a streak
  wp += right * position.x * w + vec3(0., position.y * len, 0.);
  float grown = smoothstep(0., 6., aD.x - (uSteamBase + aD.w));
  float dy = (y - aD.x) / 1.7;
  vB = (0.07 + 9. * exp(-dy * dy) * grown) * hCloud(aEye.z, 1.);      // all but unseen until it falls through its shaft: there it is a spark
  vQ = position.xy;
  vec4 mvPosition = viewMatrix * vec4(wp, 1.);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const DRIP_FRAG = /* glsl */`
uniform vec3 uBeamCol;
varying vec2 vQ; varying float vB;
#include <fog_pars_fragment>
${GLSL_FOGFADE}
void main(){
  float a = max(1. - abs(vQ.x), 0.) * max(1. - vQ.y * vQ.y, 0.);      // max: multisampling extrapolates vQ past the quad when it is edge-on
  gl_FragColor = vec4(uBeamCol * a * a * vB * 0.5 * hFogKeep(), 1.);
}`;
const BUBBLE_VERT = /* glsl */`
attribute vec3 aEye; attribute vec4 aB; attribute vec4 aB2;   // aB: yc, phase, speed, heading.  aB2: size, delay, random, accent
varying vec2 vQ; varying vec3 vP;
#include <fog_pars_vertex>
${GLSL_COMMON}
void main(){
  vec3 L = uSunL; float dn = max(-L.y, 0.05);
  vec3 c = aEye + L * ((aEye.y - aB.x) / dn);
  float off = (fract(uTime * aB.z + aB.y) * 2. - 1.) * 16.;
  c += vec3(cos(aB.w), 0., sin(aB.w)) * off;
  c.y += sin(uTime * 0.6 + aB2.z * 20.) * 0.25 + off * 0.05;
  float grown = smoothstep(0., 6., aB.x - (uSteamBase + aB2.y));
  float flash = exp(-off * off / 1.2) * grown * hCloud(aEye.z, 1.);
  vP = vec3(flash, aB2.z, (1. - smoothstep(11., 16., abs(off))));
  vQ = position.xy;
  vec4 mvPosition = viewMatrix * vec4(c, 1.);
  float dist = -mvPosition.z;
  mvPosition.xy += position.xy * max(aB2.x, dist * 0.004);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const BUBBLE_FRAG = /* glsl */`
uniform vec3 uBeamCol;
varying vec2 vQ; varying vec3 vP;
#include <fog_pars_fragment>
${GLSL_FOGFADE}
void main(){
  float d = length(vQ);
  float rim = smoothstep(0.5, 0.92, d) * (1. - smoothstep(0.92, 1., d));
  vec3 irid = uBeamCol * 0.7 + 0.3 * cos(6.2831853 * (d * 1.3 + vP.y + vec3(0., 0.33, 0.67)));
  float spot = smoothstep(0.22, 0.05, length(vQ - vec2(-0.36, 0.4))) + 0.5 * smoothstep(0.14, 0.03, length(vQ - vec2(0.4, -0.38)));
  vec3 col = (irid * rim * 0.42 + uBeamCol * spot * 0.7) * (0.4 + vP.x * 4.) * vP.z * hFogKeep();
  gl_FragColor = vec4(col, 1.);
}`;

// ---------------------------------------------------------------- geometry builder
export function makeBuilder() {
  const P = [], Nn = [], C = [], U = [], M = [];
  const b = { tint: [1, 1, 1], count: 0 };
  function vert(q, n, m) {
    P.push(q[0], q[1], q[2]); Nn.push(n[0], n[1], n[2]);
    const ao = q[5] === undefined ? 1 : q[5];
    C.push(b.tint[0] * ao, b.tint[1] * ao, b.tint[2] * ao); U.push(q[3] || 0, q[4] || 0); M.push(m);
  }
  const cross = (a, c, d, e) => {     // (a - c) x (d - e)
    const ux = a[0] - c[0], uy = a[1] - c[1], uz = a[2] - c[2], vx = d[0] - e[0], vy = d[1] - e[1], vz = d[2] - e[2];
    const n = [uy * vz - uz * vy, uz * vx - ux * vz, ux * vy - uy * vx], l = Math.hypot(n[0], n[1], n[2]);
    if (l < 1e-9) return null;
    n[0] /= l; n[1] /= l; n[2] /= l; return n;
  };
  // f(u, v) -> [x, y, z, texU, texV, ao]
  b.grid = (nu, nv, f, mat, flat = false) => {
    const W = nu + 1, pts = [];
    for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) pts.push(f(i / nu, j / nv));
    const nor = [];
    if (!flat) for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) {
      nor.push(cross(pts[j * W + Math.min(i + 1, nu)], pts[j * W + Math.max(i - 1, 0)], pts[Math.min(j + 1, nv) * W + i], pts[Math.max(j - 1, 0) * W + i]) || [0, 1, 0]);
    }
    for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) {
      const ia = j * W + i, ib = ia + 1, ic = ia + W + 1, id = ia + W;
      if (flat) {
        const n = cross(pts[ib], pts[ia], pts[id], pts[ia]) || cross(pts[ic], pts[ia], pts[id], pts[ia]) || cross(pts[ib], pts[ia], pts[ic], pts[ia]) || [0, 1, 0];
        vert(pts[ia], n, mat); vert(pts[ib], n, mat); vert(pts[ic], n, mat); vert(pts[ia], n, mat); vert(pts[ic], n, mat); vert(pts[id], n, mat);
      } else {
        vert(pts[ia], nor[ia], mat); vert(pts[ib], nor[ib], mat); vert(pts[ic], nor[ic], mat); vert(pts[ia], nor[ia], mat); vert(pts[ic], nor[ic], mat); vert(pts[id], nor[id], mat);
      }
      b.count += 2;
    }
  };
  // lathe round (cx, cz): profile [[r, y], ...]; one grid per profile segment so mouldings keep their creases.
  // band = index of the segment that carries the inlay band; scallop(alpha, y) multiplies r.
  b.lathe = (cx, cz, prof, a0, a1, nseg, mat, band = -1, scallop = null, flat = false) => {
    for (let s = 0; s < prof.length - 1; s++) {
      const [r0, y0] = prof[s], [r1, y1] = prof[s + 1];
      b.grid(nseg, 1, (u, v) => {
        const a = a0 + (a1 - a0) * u, y = y0 + (y1 - y0) * v; let r = r0 + (r1 - r0) * v;
        if (scallop) r *= scallop(a, y);
        return [cx + Math.sin(a) * r, y, cz + Math.cos(a) * r, a * Math.max(r0, 2), s === band ? v : 0, 1];
      }, mat, flat);
    }
  };
  b.build = () => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(Nn, 3));
    g.setAttribute('aCol', new THREE.Float32BufferAttribute(C, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(U, 2));
    g.setAttribute('aMat', new THREE.Float32BufferAttribute(M, 1));
    return g;
  };
  return b;
}

const HS = AP * Math.tan(Math.PI / 8);            // half the length of an octagon side
const sideN = (k) => [Math.sin(k * Math.PI / 4), Math.cos(k * Math.PI / 4)];
// point in the frame of wall k: s along the wall, y up, d outward from the inner face
function wallPt(k, s, y, d) { const a = k * Math.PI / 4, nx = Math.sin(a), nz = Math.cos(a); return [nx * (AP + d) + nz * s, y, nz * (AP + d) - nx * s]; }
const octR = (th) => { const w = Math.PI / 4; let a = ((th + w / 2) % w + w) % w - w / 2; return AP / Math.cos(a); };
export { MAT, ARCH, archH };
const sm = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

// ---------------------------------------------------------------- one wall bay with its pointed arch (the world reuses it)
// o.pt(s, y, d) -> [x, y, z]: s along the wall, y up, d outward from the inner face, all in the bay's own units; one unit
// is o.sc metres (the arch is 20 units wide). o: { pt, cls (0, 1, 2: see ARCH), hs (half the bay's length), uo (offset of
// the stone pattern), sc, top (wall top), depth (of the passage), back (true: the arch is a blind recess with a marble
// panel), open (true: a through passage, lit from both ends), band (false: no carved band under the wall top) }
export function archBay(b, o) {
  const { pt, cls, uo = 0, sc = 1, back = false, band = true } = o, hsz = o.hs ?? HS, top = o.top ?? WALL_TOP, depth = o.depth ?? DEPTH, open = o.open ?? cls === 0;
  const [hs, c] = ARCH[cls], R = 10 + c;
  const Q = (s, y, d, u, v, ao) => { const p = pt(s, y, d); return [p[0], p[1], p[2], u, v, ao]; };
  const W = (s, y, d, ao = 1) => Q(s, y, d, s * sc + uo, y * sc, ao);
  const wallAo = (s, y) => (0.74 + 0.26 * sm(0, 7, y)) * (0.8 + 0.2 * sm(hsz, hsz - 6, Math.abs(s)));
  // piers either side of the arch, and the wall over it
  for (const sg of [-1, 1]) {
    b.grid(4, 6, (u, v) => { const s = sg * (10 + (hsz - 10) * u), y = v * top; return W(s, y, 0, wallAo(s, y)); }, MAT.ABLAQ);
    // projecting basalt plinth with a chamfer, and the pilaster that frames the arch
    b.grid(2, 1, (u, v) => { const s = sg * (12.4 + (hsz - 12.4) * u); return W(s, v * 2.5, -0.45, 0.8 + 0.2 * v); }, MAT.ABLAQ, true);
    b.grid(2, 1, (u, v) => { const s = sg * (12.4 + (hsz - 12.4) * u); return W(s, 2.5 + v * 0.45, -0.45 + 0.45 * v, 1); }, MAT.ABLAQ, true);
    b.grid(1, 5, (u, v) => { const s = sg * (10 + 2.4 * u), y = v * hs; return W(s, y, -0.35, 0.8 + 0.2 * sm(0, 6, y)); }, MAT.ABLAQ, true);
    b.grid(1, 5, (u, v) => Q(sg * 12.4, v * hs, -0.35 * (1 - u), uo + (sg * 12.4 + u * 0.4) * sc, v * hs * sc, 0.72), MAT.ABLAQ, true);
    // jamb of the passage
    b.grid(3, 5, (u, v) => { const d = -0.35 + (depth + 0.35) * u, y = v * hs; return Q(sg * 10, y, d, uo + (60 + d * sg) * sc, y * sc, (0.86 - 0.3 * u * (open ? 0.4 : 1)) * (0.8 + 0.2 * sm(0, 6, y))); }, MAT.ABLAQ, true);
  }
  b.grid(20, 3, (u, v) => { const s = -10 + 20 * u, y0 = archH(cls, s * 0.9999), y = y0 + (Math.max(top, y0) - y0) * v; return W(s, y, 0, 1); }, MAT.ABLAQ);
  // striped voussoir ring, proud of the wall, its rim, and the striped soffit of the passage
  const fa = Math.acos(-c / R), fb = Math.acos(-c / (R + 2.4)), arcLen = R * (Math.PI - fa);
  for (const sg of [-1, 1]) {
    const ring = (u, v, d) => { const rho = R + 2.4 * v, f = Math.PI + ((fa + (fb - fa) * v) - Math.PI) * u; const x = sg * (c + rho * Math.cos(f)), y = hs + rho * Math.sin(f); const al = R * (Math.PI - f); return Q(x, y, d, (sg < 0 ? al : 2 * arcLen - al) * sc, v, 1); };
    b.grid(12, 1, (u, v) => ring(u, v, -0.35), MAT.VOUSSOIR);
    b.grid(12, 1, (u, v) => { const q = ring(u, 1, -0.35 * (1 - v)); q[4] = 0.5; q[5] = 0.62; return q; }, MAT.VOUSSOIR);
    b.grid(12, 3, (u, v) => { const q = ring(u, 0, -0.35 + (depth + 0.35) * v); q[4] = 0.08 + 0.84 * v; q[5] = 0.84 - (open ? 0.12 : 0.34) * v; return q; }, MAT.VOUSSOIR);
  }
  // carved interlace band under the wall top
  if (band) {      // (it stops either side of an arch whose striped ring rises into it)
    const crown = hs + Math.sqrt(R * R - c * c) + 2.4;
    const runs = crown > top - 3.6 ? [[-hsz + 0.1, -12.45], [12.45, hsz - 0.1]] : [[-hsz + 0.1, hsz - 0.1]];
    for (const [sa, se] of runs) {
      const n = Math.max(2, Math.round((se - sa) / 5.5));
      b.grid(n, 1, (u, v) => { const s = sa + (se - sa) * u; return Q(s, top - 3.6 + 3.4 * v, -0.3, s * sc + uo, v, 1); }, MAT.CARVED, true);
      b.grid(n, 1, (u, v) => { const s = sa + (se - sa) * u; return Q(s, top - 3.6, -0.3 * v, s * sc + uo, 0.02, 0.55); }, MAT.CARVED, true);
    }
  }
  if (back) {   // a blind recess: back wall and a marble panel
    b.grid(10, 6, (u, v) => { const s = -10 + 20 * u, y = v * archH(cls, s * 0.9999); return Q(s, y, depth, s * sc + uo, y * sc, 0.62 * (0.8 + 0.2 * sm(0, 6, y))); }, MAT.ABLAQ);
    b.grid(1, 1, (u, v) => Q(-7 + 14 * u, 5.6 + 8.2 * v, depth - 0.25, (u * 14 - 7) * sc, v * 8.2 * sc, 0.9), MAT.TILE, true);
  }
}

// ---------------------------------------------------------------- the room: walls, arches, domes
async function buildShell(b, ctx, eastDepth) {
  // floor: one polar sheet, patterned and shaded in the shader
  b.grid(48, 12, (u, v) => { const a = u * Math.PI * 2, r = v * 97; return [Math.sin(a) * r, 0, Math.cos(a) * r, 0, 0, 1]; }, MAT.FLOOR, true);
  await ctx.yield();
  for (let k = 0; k < 8; k++) {
    const cls = archClass(k);
    archBay(b, { pt: (s, y, d) => wallPt(k, s, y, d), cls, uo: k * 45.56, back: cls === 1, open: cls === 0, depth: k === 4 ? eastDepth : DEPTH });
    await ctx.yield();
  }
  // corbelled backing behind the muqarnas, the great dome and its carved band
  b.grid(80, 4, (u, v) => { const th = u * Math.PI * 2, r = octR(th) + (DOME_R - octR(th)) * Math.pow(v, 0.8); return [Math.sin(th) * r, WALL_TOP + (SPRING - WALL_TOP) * v, Math.cos(th) * r, 0, 0, 0.66]; }, MAT.PLASTER);
  await ctx.yield();
  b.grid(64, 16, (u, v) => { const th = u * Math.PI * 2, f = v * Math.PI / 2, r = DOME_R * Math.cos(f); return [Math.sin(th) * r, SPRING + DOME_R * Math.sin(f), Math.cos(th) * r, u * 32, v, 0.88 + 0.12 * v]; }, MAT.PLASTER);
  await ctx.yield();
  b.grid(64, 1, (u, v) => { const th = u * Math.PI * 2, y = SPRING + 0.2 + 3.3 * v, r = Math.sqrt(DOME_R * DOME_R - (y - SPRING) * (y - SPRING)) - 0.28; return [Math.sin(th) * r, y, Math.cos(th) * r, th * DOME_R, v, 1]; }, MAT.CARVED);
  await ctx.yield();
  // corner chambers: drum, carved band, dome
  for (let q = 0; q < 4; q++) {
    const k = 1 + q * 2, [nx, nz] = sideN(k), cx = nx * CH_D, cz = nz * CH_D;
    const back = Math.atan2(-nx, -nz), gap = Math.asin(10 / CH_R);
    b.grid(22, 3, (u, v) => { const a = back + gap + (Math.PI * 2 - 2 * gap) * u; return [cx + Math.sin(a) * CH_R, 23 * v, cz + Math.cos(a) * CH_R, a * CH_R + q * 31, 23 * v, 0.72 + 0.2 * sm(0, 8, 23 * v)]; }, MAT.ABLAQ);
    b.grid(22, 1, (u, v) => { const a = back + gap + (Math.PI * 2 - 2 * gap) * u; return [cx + Math.sin(a) * (CH_R - 0.2), 23 + 3 * v, cz + Math.cos(a) * (CH_R - 0.2), a * CH_R, v, 0.9]; }, MAT.CARVED);
    b.grid(28, 8, (u, v) => { const th = u * Math.PI * 2, f = v * Math.PI / 2, r = CH_R * Math.cos(f); return [cx + Math.sin(th) * r, CH_SPRING + CH_R * Math.sin(f), cz + Math.cos(th) * r, u * 16, v, 0.85]; }, MAT.PLASTER);
    await ctx.yield();
  }
}

// a scalloped marble basin at (bs.x, bs.z) with a brass swan-neck tap standing on its (ox, oz) side; sets bs.spout
const BASIN_PROFILE = [[2.3, 0], [2.3, 0.3], [2.0, 0.42], [1.5, 0.5], [0.9, 1.05], [0.82, 1.7], [1.25, 2.1], [2.9, 2.5], [3.85, 2.98], [4.05, 3.22], [3.9, 3.32], [3.6, 3.16], [3.0, 2.82], [2.2, 2.62], [0, 2.5]];
export function basinInto(b, bs, ox, oz) {
  const sc = (a, y) => 1 + 0.1 * sm(2.0, 2.9, y) * (Math.pow(Math.abs(Math.cos(6 * a)), 0.6) - 0.6);      // twelve deep scallops round the lip
  b.lathe(bs.x, bs.z, BASIN_PROFILE, 0, Math.PI * 2, 48, MAT.MARBLE, 5, sc);
  // tap: a tube swept up from the floor behind the basin and over its lip
  const cur = (t) => { if (t < 0.5) return [4.7, t * 2 * 4.5, 0, 1]; const f = (t - 0.5) * 2 * 3.5; return [3.2 + 1.5 * Math.cos(f), 4.5 + 1.5 * Math.sin(f), -Math.sin(f), Math.cos(f)]; };
  b.grid(6, 16, (u, v) => {
    const [o, y, to, ty] = cur(v), a = u * Math.PI * 2, rr = 0.2 * (v < 0.04 ? 1.8 : v > 0.96 ? 1.25 : 1);
    const rad = Math.cos(a) * rr, tan = Math.sin(a) * rr;        // radial offset is across the tangent, in the sweep plane
    const oo = o + rad * ty, yy = y - rad * to;
    return [bs.x + ox * oo - oz * tan, yy, bs.z + oz * oo + ox * tan, 0, 0, 1];
  }, MAT.BRASS);
  const e = cur(1); bs.spout = [bs.x + ox * e[0], e[1], bs.z + oz * e[0]];
}
// the overflow sheet round a basin and the stream from its tap; the water in it (both: position and uv only)
export function basinSheetInto(b, bs, i) {
  b.grid(48, 3, (u, v) => { const a = u * Math.PI * 2, r = 4.08 + 0.22 * v * v, sc = 1 + 0.1 * (1 - v) * (Math.pow(Math.abs(Math.cos(6 * a)), 0.6) - 0.6); return [bs.x + Math.sin(a) * r * sc, 3.22 - 3.2 * (v * 0.3 + 0.7 * v * v), bs.z + Math.cos(a) * r * sc, a * 12 / (Math.PI * 2) + 100 + i * 17, v, 1]; }, 0);
  const [sx, sy, sz] = bs.spout;
  for (let j = 0; j < 2; j++) { const dx = j ? 0.16 : 0, dz = j ? 0 : 0.16; b.grid(1, 2, (u, v) => [sx + (u - 0.5) * 2 * dx, sy - (sy - 2.7) * v, sz + (u - 0.5) * 2 * dz, 3.3 + i, v * 0.4 + 0.1, 1], 0); }
}
export function basinWaterInto(b, bs) {
  b.grid(14, 1, (u, v) => { const a = u * Math.PI * 2, r = 2.3 * v; return [bs.x + Math.sin(a) * r, 2.67, bs.z + Math.cos(a) * r, 0, 0, 1]; }, 0, true);
}

// ---------------------------------------------------------------- platform, pool, basins, taps, grilles
async function buildFurniture(b, basins, grilles, ctx) {
  const T8 = Math.tan(Math.PI / 8);
  const prism8 = (prof, bandSeg, uScale = 1) => {
    for (let k = 0; k < 8; k++) {
      const [nx, nz] = sideN(k);
      for (let s = 0; s < prof.length - 1; s++) {
        const [a0, y0] = prof[s], [a1, y1] = prof[s + 1];
        b.grid(4, 1, (u, v) => { const ap = a0 + (a1 - a0) * v, l = (u * 2 - 1) * ap * T8; return [nx * ap + nz * l, y0 + (y1 - y0) * v, nz * ap - nx * l, (l + k * 13) * uScale, s === bandSeg ? v : 0, y1 === y0 ? 1 : 0.92]; }, MAT.MARBLE, true);
      }
    }
  };
  const top8 = (ap, y) => b.grid(8, 3, (u, v) => { const a = (u * 8 - 0.5) * Math.PI / 4, r = ap / Math.cos(Math.PI / 8) * v; return [Math.sin(a) * r, y, Math.cos(a) * r, 0, 0, 1]; }, MAT.MEDALLION, true);
  // the heated platform: plinth step, banded body, bevel, rosette top, navel stone
  prism8([[15.3, 0], [15.3, 0.5], [15.1, 0.6], [14.45, 0.6], [14.45, 0.85], [14.3, 0.9], [14.3, 2.1], [14.42, 2.2], [14.42, 2.38], [14.2, 2.5], [14.0, PLAT_H]], 5);
  top8(14.0, PLAT_H);
  prism8([[5.0, PLAT_H], [5.0, PLAT_H + 0.3], [4.75, PLAT_H + 0.42]], -1);
  top8(4.75, PLAT_H + 0.42);
  // pool kerb (open toward +Z for the channel) and the channel kerbs through the west arch
  const gap = Math.asin(6 / 17.6);
  const kerb = [[POOL_R, -0.1], [POOL_R, 0.5], [POOL_R + 0.12, 0.62], [POOL_R + 1.1, 0.62], [POOL_R + 1.25, 0.5], [POOL_R + 1.25, 0.12], [POOL_R + 1.4, 0]];
  b.lathe(0, POOL_Z, kerb, gap, Math.PI * 2 - gap, 60, MAT.MARBLE, 4, null, true);
  const z0 = POOL_Z + 17.6 * Math.cos(gap), z1 = AP + DEPTH;
  for (const sg of [-1, 1]) {
    const cp = [[6, -0.1], [6, 0.5], [6.12, 0.62], [7.1, 0.62], [7.25, 0.5], [7.25, 0]];
    for (let s = 0; s < cp.length - 1; s++) b.grid(4, 1, (u, v) => [sg * (cp[s][0] + (cp[s + 1][0] - cp[s][0]) * v), cp[s][1] + (cp[s + 1][1] - cp[s][1]) * v, z0 + (z1 - z0) * u, u * (z1 - z0), s === 4 ? v : 0, 1], MAT.MARBLE, true);
  }
  await ctx.yield();
  // eight scalloped basins against the piers, each with a brass swan-neck tap
  for (const bs of basins) { const h = Math.hypot(bs.x, bs.z); basinInto(b, bs, bs.x / h, bs.z / h); await ctx.yield(); }   // (a basin is a few ms: yield after each)
  // six pierced brass grilles in basalt frames
  for (const g of grilles) {
    b.grid(20, 1, (u, v) => { const a = u * Math.PI * 2, r = 2.5 * v; return [g.x + Math.sin(a) * r, 0.06, g.z + Math.cos(a) * r, 0, 1, 1]; }, MAT.BRASS, true);
    b.tint = [0.32, 0.3, 0.29];
    b.lathe(g.x, g.z, [[2.5, 0.06], [2.5, 0.16], [3.0, 0.16], [3.12, 0]], 0, Math.PI * 2, 20, MAT.MARBLE, -1, null, true);
    b.tint = [1, 1, 1];
  }
}

// one muqarnas cell: a pointed niche that corbels forward as it rises (x across, y up, z into the room)
export function buildCell() {
  const b = makeBuilder();
  b.grid(6, 4, (u, v) => {
    const a = u * 2 - 1, y = v * (1 - 0.32 * Math.pow(Math.abs(a), 1.6));
    const z = v * v * 0.95 - 0.34 * (1 - a * a) * (1 - v * v);
    return [0.5 * a, y, z, u, v, 0.56 + 0.44 * v * (0.7 + 0.3 * a * a)];
  }, MAT.MUQARNAS);
  return b.build();
}

// overflow sheets round the basins and the streams from the taps (position + uv only)
function buildSheets(basins) {
  const b = makeBuilder();
  basins.forEach((bs, i) => basinSheetInto(b, bs, i));
  return b.build();
}

function buildWater(basins) {
  const b = makeBuilder();
  b.grid(40, 1, (u, v) => { const a = u * Math.PI * 2, r = (POOL_R + 0.02) * v; return [Math.sin(a) * r, WATER_Y, POOL_Z + Math.cos(a) * r, 0, 0, 1]; }, 0, true);
  b.grid(1, 1, (u, v) => [-6.02 + 12.04 * u, WATER_Y, POOL_Z + 15 + (AP + DEPTH - POOL_Z - 15) * v, 0, 0, 1], 0, true);
  for (const bs of basins) basinWaterInto(b, bs);
  return b.build();
}

// ---------------------------------------------------------------- the hero
export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng.fork('hammam-hero');
  const detail = ctx.quality?.detail ?? 1;
  const pal = (opts.palette || DEFAULT_PALETTE).map((h) => new THREE.Color(h));
  const look = opts.look || (() => { const r = rng(); return r < 0.5 ? 'noon' : r < 0.78 ? 'afternoon' : 'winter'; })();
  const accentHex = opts.accent || (() => { const r = rng(); return r < 0.6 ? '#' + pal[4].getHexString() : r < 0.8 ? '#2B5FB8' : '#D98A1E'; })();
  const eastDepth = opts.eastDepth ?? DEPTH;      // depth of the east arch's passage (a thin wall lets the recess open straight off the room)
  const accent = new THREE.Color(accentHex);
  const accentIdx = /2B5FB8/i.test(accentHex) ? 2 : /D98A1E/i.test(accentHex) ? 3 : 1;      // the glass colour this visit has most of
  const LOOKS = {
    noon: { elev: 66 + rng.range(-2, 2), az: 12 + rng.range(-8, 8), beam: '#F7F2E7', light: 1.0, haze: 1.0, dark: 0, beamGain: 0.62, beamW: 0.5, lean: 0.445, roomKey: [1, 1, 1], roomAmb: [1, 1, 1], shade: 1.0, warm: 0, deep: '#6A70D4', lamp: '#FFBE5C', lampGain: 1.45 },
    afternoon: { elev: 34 + rng.range(-2, 2), az: 33 + rng.range(-6, 6), beam: '#FFD9A0', light: 0.94, haze: 1.0, dark: 0, beamGain: 0.62, beamW: 0.6, lean: 0.62, roomKey: [1.34, 0.9, 0.5], roomAmb: [0.92, 0.84, 0.98], shade: 0.8, warm: 1, deep: '#5656C8', lamp: '#FFB050', lampGain: 1.45 },
    winter: { elev: 57 + rng.range(-2, 2), az: 40 + rng.range(-6, 6), beam: '#E6F0FF', light: 0.9, haze: 1.4, dark: 0.5, beamGain: 0.76, beamW: 0.58, lean: 0.5, roomKey: [0.66, 0.86, 1.2], roomAmb: [0.66, 0.8, 1.1], shade: 1.1, warm: 0, deep: '#4A84CC', lamp: '#FFC468', lampGain: 1.8 },
  };
  const LK = LOOKS[look] || LOOKS.noon;
  let elev = (opts.sunElevation ?? LK.elev) * Math.PI / 180, az0 = (opts.sunAzimuth ?? LK.az) * Math.PI / 180;
  const growFrom = opts.growFrom ?? 0.40, growTo = opts.growTo ?? 0.57, driftRate = opts.driftRate ?? 0.014, hazeK = opts.haze ?? 1;

  const beamCol = new THREE.Color(LK.beam);
  const am = Math.max(accent.r, accent.g, accent.b, 1e-3);
  const accentN = accent.clone().multiplyScalar(1 / am);
  const basalt = pal[3].clone().multiplyScalar(2).addScalar(0.11);
  const shade = pal[6].clone(); if (LK.warm) shade.lerp(new THREE.Color('#4466a8'), 0.45);
  const honey = pal[2].clone(); if (LK.warm) honey.lerp(new THREE.Color('#F0A040'), 0.3);
  const pearl = pal[0].clone(); if (LK.warm) pearl.lerp(new THREE.Color('#FFE2B8'), 0.35); if (look === 'winter') pearl.lerp(new THREE.Color('#E8EEF8'), 0.5);
  const steam = pal[1].clone(); if (LK.warm) steam.lerp(new THREE.Color('#F2D9B4'), 0.4); if (look === 'winter') steam.lerp(new THREE.Color('#DDE4EE'), 0.6);
  const U = {
    uSunL: { value: new THREE.Vector3(0, -1, 0) }, uSunC: { value: new THREE.Vector3(0, -1, 0) },
    uCEye: { value: Array.from({ length: NCE }, () => new THREE.Vector4(0, -1e5, 0, 1)) }, uSteamBase: { value: -14 }, uTime: { value: 0 }, uCloud: { value: new THREE.Vector4(200, 0.33, 0, 0) },
    uDarkFrac: { value: LK.dark }, uPearl: { value: pearl }, uSteam: { value: steam }, uHoney: { value: honey }, uBasalt: { value: basalt },
    uAccent: { value: accent }, uBrass: { value: pal[5] }, uShade: { value: shade.multiplyScalar(LK.shade) }, uBeamCol: { value: beamCol },
    uAccentGlow: { value: accentN.clone().multiplyScalar(0.92).addScalar(0.04) }, uAccentBeam: { value: accentN.clone().lerp(beamCol, 0.2) },
    uHaze: { value: LK.haze }, uLight: { value: LK.light }, uSeed: { value: rng.range(0, 50) }, uEyeGain: { value: 1 }, uBeamGain: { value: LK.beamGain },
    uStarGain: { value: 1 }, uSheet: { value: 1 }, uBeamW: { value: LK.beamW }, uWallStar: { value: 0 }, uThrough: { value: 0 },
    uRoomKey: { value: new THREE.Vector3(...LK.roomKey) }, uRoomAmb: { value: new THREE.Vector3(...LK.roomAmb) },
    uBlob: { value: Array.from({ length: NBLOB }, (_, i) => { const q = (opts.blobs || [])[i]; return q ? new THREE.Vector4(q[0], q[1], q[2], q[3]) : new THREE.Vector4(0, 1e4, 1, 0); }) },
    uGlow: { value: new THREE.Vector4(0, 16, (opts.portalZ ?? -131) + 1.5, opts.glow ?? 0) },
    uGlass: { value: [beamCol, new THREE.Color(0.2, 1.0, 0.48), new THREE.Color(0.22, 0.42, 1.0), new THREE.Color(1.0, 0.66, 0.16), new THREE.Color(1.0, 0.16, 0.26)] },
    uDeep: { value: new THREE.Color(LK.deep) }, uLampCol: { value: new THREE.Color(LK.lamp).multiplyScalar(LK.lampGain) },
    uLamp: { value: Array.from({ length: NLAMP }, () => new THREE.Vector4(0, -1e4, 0, 0)) },
    uPortalCol: { value: new THREE.Color(opts.portalColor || '#F6E6C2') }, uRecZ: { value: -(AP + eastDepth) + 0.1 },
    uFount: { value: new THREE.Vector4(0, 1e4, 1, 0) },
  };
  const mk = (vs, fs, extra = {}) => new THREE.ShaderMaterial(Object.assign({ vertexShader: vs, fragmentShader: fs, fog: true,
    uniforms: Object.assign(THREE.UniformsUtils.clone(THREE.UniformsLib.fog), U) }, extra));
  const root = new THREE.Group(); root.name = 'hammam-of-stars-hero';
  const add = (m, order = 0) => { m.frustumCulled = false; m.renderOrder = order; root.add(m); return m; };

  // ---- layout
  const basins = [], grilles = [], chambers = [];
  for (let k = 0; k < 8; k++) { const a = (k + 0.5) * Math.PI / 4; basins.push({ x: Math.sin(a) * 51.5, z: Math.cos(a) * 51.5 }); }
  for (const deg of [50, 100, 150, 210, 260, 310]) { const a = deg * Math.PI / 180; grilles.push({ x: Math.sin(a) * 33, z: Math.cos(a) * 33 }); }
  for (let q = 0; q < 4; q++) { const [nx, nz] = sideN(1 + q * 2); chambers.push({ x: nx * CH_D, z: nz * CH_D }); }

  // ---- the room
  const stoneMaterial = mk(STONE_VERT, STONE_FRAG, { side: THREE.DoubleSide });
  let triangles = 0;
  {   // two meshes, so that neither upload of the merged arrays holds the page long
    const b = makeBuilder();
    await buildShell(b, ctx, eastDepth);
    await ctx.yield();
    const g = b.build(); await ctx.yield();
    add(new THREE.Mesh(g, stoneMaterial)); triangles += b.count;
    await ctx.yield();
    const f = makeBuilder();
    await buildFurniture(f, basins, grilles, ctx);
    await ctx.yield();
    add(new THREE.Mesh(f.build(), stoneMaterial)); triangles += f.count;
  }
  await ctx.yield();

  // ---- muqarnas: six honeycomb tiers corbelling from the octagon out to the dome's circle
  {
    const cell = buildCell(), TIERS = 6, PER = 80, n = TIERS * PER;
    const mesh = new THREE.InstancedMesh(cell, stoneMaterial, n);
    const m4 = new THREE.Matrix4(); let i = 0;
    const rAt = (th, v) => octR(th) + (DOME_R - octR(th)) * Math.pow(Math.min(v, 1), 0.8);
    for (let j = 0; j < TIERS; j++) for (let c = 0; c < PER; c++) {
      const th = (c + 0.5 * (j % 2)) / PER * Math.PI * 2, v = j / TIERS;
      const r = rAt(th, v) - 0.1, w = Math.PI * 2 * r / PER * 1.03, h = (SPRING - WALL_TOP) / TIERS * 1.32, d = (r - rAt(th, v + 1 / TIERS)) + 0.9;
      const sx = Math.sin(th), cz = Math.cos(th);
      m4.set(cz * w, 0, -sx * d, sx * r,   0, h, 0, WALL_TOP + (SPRING - WALL_TOP) * v - 0.1,   -sx * w, 0, -cz * d, cz * r,   0, 0, 0, 1);
      mesh.setMatrixAt(i++, m4);
    }
    mesh.instanceMatrix.needsUpdate = true;
    add(mesh); triangles += n * 48;
  }
  await ctx.yield();

  // ---- the eyes: 120 in the great dome, 45 in each corner dome
  const eyes = [];
  const ring = (cx, cy, cz, R, rings, kind, scale) => {
    const mode = rng.int(0, 2);
    rings.forEach(([deg, cnt], ri) => {
      const th = (deg + (ri ? rng.range(-1.5, 1.5) : 0)) * Math.PI / 180, off = rng() * Math.PI * 2;
      for (let i = 0; i < cnt; i++) {
        const f = off + (i + (cnt > 1 ? rng.range(-0.12, 0.12) : 0)) / cnt * Math.PI * 2;
        const dx = Math.sin(th) * Math.cos(f), dy = Math.cos(th), dz = Math.sin(th) * Math.sin(f);
        const shape = mode === 0 ? ri % 2 : mode === 1 ? i % 2 : (rng() < 0.5 ? 0 : 1);
        eyes.push({ p: [cx + dx * R, cy + dy * R, cz + dz * R], n: [-dx, -dy, -dz], dome: [cx, cz, R, cy], kind, shape, scale: scale * rng.range(0.92, 1.08), delay: rng.range(0, 9), accent: 0, rnd: rng() });
      }
    });
  };
  ring(0, SPRING, 0, DOME_R, [[0, 1], [10, 6], [21, 12], [32, 18], [43, 24], [54, 28], [65, 31]], 0, 1);
  for (const c of chambers) ring(c.x, CH_SPRING, c.z, CH_R, [[0, 1], [24, 6], [47, 13], [70, 25]], 1, 0.72);
  {   // coloured glass among the clear: about one eye in six in this visit's colour, one in twenty in each of the other three
    const idx = rng.shuffle(eyes.map((_, i) => i)), n1 = Math.round(eyes.length * 0.17), n2 = Math.round(eyes.length * 0.05), others = [1, 2, 3, 4].filter((c) => c !== accentIdx);
    for (let i = 0; i < n1 + 3 * n2; i++) eyes[idx[i]].accent = i < n1 ? accentIdx : others[Math.floor((i - n1) / n2) % 3];
  }
  if (LK.dark > 0) {
    // snow on the domes: about half the eyes are dark, but not the ones whose beams stand between the pool and the
    // east arch, the frame to remember (a beam counts if three quarters of the way down it is inside that wedge)
    const ce = Math.cos(elev), Lx = -ce * Math.cos(az0), Ly = -Math.sin(elev), Lz = -ce * Math.sin(az0);
    for (const e of eyes) {
      const t = 0.75 * e.p[1] / Math.max(-Ly, 0.05), qx = e.p[0] + Lx * t + 0.9, qz = 22.3 - (e.p[2] + Lz * t);
      const inWedge = e.kind === 0 && qz > 5 && qz < 90 && Math.abs(qx) < 0.55 * qz + 4;
      const lit = inWedge ? e.rnd > 0.1 : e.rnd > (e.kind === 0 ? 0.86 : 0.55);
      e.rnd = (lit ? LK.dark : 0) + e.rnd * (lit ? 1 - LK.dark : LK.dark) * 0.999;
    }
  }
  // ---- the standing forest: about a dozen principal shafts, a few pale thin ones far off, open dark air between.
  // Each eye gets sel: 1 = a principal shaft (wide, bright, one crisp star at its foot), about 0.3 = a pale far one, 0 = glass only.
  // None may cross the line of sight from the way we fly (opts.views) to the east arch and the portal in it.
  {
    const views = opts.views || [{ p: [5.5, 2.3, 34], u: 0.5 }, { p: [-12, 11.5, 10], u: 0.6 }, { p: [-8, 18.5, -14], u: 0.68 }];
    const octD = (x, z) => { x = Math.abs(x); z = Math.abs(z); return Math.max(x, z, (x + z) * 0.70710678); };
    const dirAt = (u) => { const az = az0 + driftRate * 50 * (u - (opts.growTo ?? 0.57)), ce = Math.cos(elev); return [-ce * Math.cos(az), -Math.sin(elev), -ce * Math.sin(az)]; };
    const L0 = dirAt(opts.growTo ?? 0.57), hr = (x) => { const f = Math.sin(x * 127.1 + 311.7) * 43758.5453; return f - Math.floor(f); };
    const cand = [];
    eyes.forEach((e, i) => {
      e.sel = 0;
      const c = [e.dome[0], e.dome[3], e.dome[1]];
      const ts = Math.max(-2 * ((e.p[0] - c[0]) * L0[0] + (e.p[1] - c[1]) * L0[1] + (e.p[2] - c[2]) * L0[2]), 0);
      if (e.p[1] + L0[1] * ts > e.dome[3] + 0.5) return;                            // falls straight back onto its own dome
      const t = e.p[1] / Math.max(-L0[1], 0.05), fx = e.p[0] + L0[0] * t, fz = e.p[2] + L0[2] * t;
      let wall = 0, lx = fx, lz = fz, len = t;
      if (e.kind === 0 && octD(fx, fz) > AP - 2) { wall = 1; const k = (AP - 2) / octD(fx, fz); if (octD(e.p[0], e.p[2]) < AP - 2) { const o = octD(e.p[0], e.p[2]); const f = (AP - 2 - o) / Math.max(octD(fx, fz) - o, 1e-3); lx = e.p[0] + (fx - e.p[0]) * f; lz = e.p[2] + (fz - e.p[2]) * f; len = t * f; } else { lx = fx * k; lz = fz * k; } }
      if (len < 26 && e.kind === 0) return;                                         // too short to stand
      // does it cross the east arch as seen from the way we fly?
      let blocked = false;
      for (const v of views) {
        const Lv = dirAt(v.u), C = v.p, dz = Math.max(C[2] + AP, 1);
        const hw = v.u < 0.55 || look === 'afternoon' ? 5.5 : 10.5;      // (from the pool the arch is far and narrow: there only the chamber and the portal in it must stay clear)
        const y0 = Math.atan2(-hw - C[0], dz), y1 = Math.atan2(hw - C[0], dz), p0 = Math.atan2(-1 - C[1], dz), p1 = Math.atan2(35.5 - C[1], dz);
        const tv = e.p[1] / Math.max(-Lv[1], 0.05) * (len / t);
        for (let j = 0; j <= 24 && !blocked; j++) {
          const q = tv * j / 24, x = e.p[0] + Lv[0] * q - C[0], y = e.p[1] + Lv[1] * q - C[1], z = -(e.p[2] + Lv[2] * q - C[2]);
          if (z < 1.5 || z > dz + 4) continue;
          const m = 1.4 / Math.hypot(x, z) + 0.008, yaw = Math.atan2(x, z), pit = Math.atan2(y, Math.hypot(x, z));
          if (yaw > y0 - m && yaw < y1 + m && pit > p0 - m && pit < p1 + m) blocked = true;
        }
      }
      if (blocked) return;
      cand.push({ i, e, lx, lz, wall, len, r: hr(e.rnd * 91.7 + i * 0.37) });
    });
    const chosen = [];
    const far = (c, d) => chosen.every((o) => Math.hypot(o.lx - c.lx, o.lz - c.lz) >= d && Math.hypot(o.e.p[0] - c.e.p[0], o.e.p[2] - c.e.p[2]) >= d * 0.6);
    // the shafts we want most stand near the way we fly: beside the pool, either side of the platform, either side of the east arch
    const want = opts.stand || [[10, -23], [-27, -34], [-21, 9], [13, -7], [-31, -13], [-12, 30], [9, 9], [-40, -44], [-45, -16], [-33, 34], [-37, 12], [-51, -2], [-4, 46], [-16, -52]];
    { const run = 59 / Math.tan(elev), sx = L0[0] / Math.hypot(L0[0], L0[2]) * run, sz = L0[2] / Math.hypot(L0[0], L0[2]) * run;      // (where the outermost ring's light comes down: a circle of radius 40.8 about this point)
      const arc = [-0.39, 0, 0.42].map((th) => [sx + 40.2 * Math.cos(th), sz + 40.2 * Math.sin(th)]); want.unshift(arc[0]); want.splice(3, 0, arc[1]); want.splice(6, 0, arc[2]); }
    let nMain = 0;
    for (const [wx, wz] of want) {
      let best = null, bd = 7.5;
      for (const c of cand) { if (c.e.kind !== 0 || c.wall || !far(c, 10)) continue; const d = Math.hypot(c.lx - wx, c.lz - wz); if (d < bd) { bd = d; best = c; } }
      if (best) { best.e.sel = 0.86 + 0.28 * best.r; chosen.push(best); nMain++; }
    }
    // (another hour, another sun: where the wanted places have no eye over them, the nearest free shafts to the way we fly stand in)
    const nearWay = (c) => { let d = 1e9; for (const v of views) d = Math.min(d, Math.abs(Math.hypot(c.lx - v.p[0], c.lz - v.p[2]) - 22)); return d; };
    const spare = cand.filter((c) => !c.e.sel && c.e.kind === 0 && !c.wall).sort((a, b) => nearWay(a) - nearWay(b));
    for (const c of spare) { if (nMain >= 13) break; if (far(c, 10.5)) { c.e.sel = 0.86 + 0.28 * c.r; chosen.push(c); nMain++; } }
    if (nMain < 12) for (const c of cand.filter((c) => !c.e.sel && c.e.kind === 0 && c.wall).sort((a, b) => nearWay(a) - nearWay(b))) { if (nMain >= 12) break; if (far(c, 6.5)) { c.e.sel = 0.8 + 0.2 * c.r; chosen.push(c); nMain++; } }
    const rest = cand.filter((c) => !c.e.sel).sort((a, b) => a.r - b.r);
    let nFar = 0, nCh = [0, 0, 0, 0];
    for (const c of rest) {
      if (c.e.kind === 0) { if (nFar < (look === 'afternoon' ? 16 : 10) && far(c, 12)) { c.e.sel = (c.wall && look === 'afternoon' ? 0.5 : 0.2) + 0.1 * c.r; chosen.push(c); nFar++; } }
      else { const q = chambers.findIndex((ch) => Math.hypot(ch.x - c.e.dome[0], ch.z - c.e.dome[1]) < 1); if (q >= 0 && nCh[q] < 2 && far(c, 7)) { c.e.sel = 0.24 + 0.1 * c.r; chosen.push(c); nCh[q]++; } }
    }
  }
  if (LK.dark > 0) for (const e of eyes) if (e.sel > 0 && e.rnd <= LK.dark) e.rnd = LK.dark + (1 - LK.dark) * (0.15 + 0.7 * e.rnd / LK.dark);      // under snow, the eyes whose shafts stand are the ones swept clear
  const NE = eyes.length;
  const aSelArr = new Float32Array(NE); eyes.forEach((e, i) => { aSelArr[i] = e.sel; });
  const aEye = new Float32Array(NE * 3), aNrm = new Float32Array(NE * 3), aDome = new Float32Array(NE * 4), aParam = new Float32Array(NE * 4), aShape = new Float32Array(NE * 2);
  eyes.forEach((e, i) => { aEye.set(e.p, i * 3); aNrm.set(e.n, i * 3); aDome.set(e.dome, i * 4); aParam.set([e.delay, e.accent, e.rnd, e.kind], i * 4); aShape.set([e.shape, e.scale], i * 2); });
  const instAttrs = { aEye: new THREE.InstancedBufferAttribute(aEye, 3), aNrm: new THREE.InstancedBufferAttribute(aNrm, 3), aDome: new THREE.InstancedBufferAttribute(aDome, 4),
    aParam: new THREE.InstancedBufferAttribute(aParam, 4), aShape: new THREE.InstancedBufferAttribute(aShape, 2), aSel: new THREE.InstancedBufferAttribute(aSelArr, 1) };
  const instanced = (base, count, attrs) => { const g = new THREE.InstancedBufferGeometry(); g.index = base.index; g.setAttribute('position', base.getAttribute('position'));
    for (const k in attrs) g.setAttribute(k, attrs[k]); g.instanceCount = count; return g; };
  const quad = new THREE.PlaneGeometry(2, 2);
  const tube = new THREE.CylinderGeometry(1, 1, 1, 8, 1, true).translate(0, 0.5, 0);
  const blendAdd = { transparent: true, depthWrite: false, blending: THREE.AdditiveBlending };
  // beams: dst + src * (1 - dst): however many overlap, the sum eases toward 1 and never burns out
  const blendScreen = { transparent: true, depthWrite: false, blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneMinusDstColorFactor, blendDst: THREE.OneFactor,
    blendSrcAlpha: THREE.ZeroFactor, blendDstAlpha: THREE.OneFactor };
  const blendPre = { transparent: true, depthWrite: false, premultipliedAlpha: true };
  const eyeMat = mk(EYE_VERT, EYE_FRAG, { ...blendPre, side: THREE.DoubleSide });
  const starMat = mk(STAR_VERT, STAR_FRAG, { ...blendAdd, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
  // the same stars where they land on a wall or a dome: dst * (1 + src), light on stone (the same program, another blend)
  const starWallMat = mk(STAR_VERT, STAR_FRAG, { transparent: true, depthWrite: false, blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.DstColorFactor, blendDst: THREE.OneFactor,
    blendSrcAlpha: THREE.ZeroFactor, blendDstAlpha: THREE.OneFactor, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
  starWallMat.uniforms.uWallStar = { value: 1 };
  const beamMat = mk(BEAM_VERT, BEAM_FRAG, { ...blendScreen, side: THREE.DoubleSide });
  add(new THREE.Mesh(instanced(quad, NE, instAttrs), eyeMat), 1);
  add(new THREE.Mesh(instanced(quad, NE, instAttrs), starMat), 4);
  add(new THREE.Mesh(instanced(quad, NE, instAttrs), starWallMat), 4);
  add(new THREE.Mesh(instanced(tube, NE, instAttrs), beamMat), 5);
  triangles += NE * 20;
  // more eyes for the world's own rooms, drawn with the same three materials (no new shader programs).
  // list: [{ p, n, dome: [half width, east z, west z, water level or 0], gain (beam strength 0..1.5), shape, scale, accent, rnd }]
  const addEyes = (list, o = {}) => {
    const n = list.length, e3 = new Float32Array(n * 3), n3 = new Float32Array(n * 3), d4 = new Float32Array(n * 4), p4 = new Float32Array(n * 4), s2 = new Float32Array(n * 2);
    list.forEach((e, i) => { e3.set(e.p, i * 3); n3.set(e.n, i * 3); d4.set(e.dome, i * 4); p4.set([-400, e.accent || 0, e.rnd ?? 0.5, 2 + (e.gain ?? 0)], i * 4); s2.set([e.shape || 0, e.scale || 1], i * 2); });
    const at = { aEye: new THREE.InstancedBufferAttribute(e3, 3), aNrm: new THREE.InstancedBufferAttribute(n3, 3), aDome: new THREE.InstancedBufferAttribute(d4, 4),
      aParam: new THREE.InstancedBufferAttribute(p4, 4), aShape: new THREE.InstancedBufferAttribute(s2, 2), aSel: new THREE.InstancedBufferAttribute(new Float32Array(n).fill(1), 1) };
    add(new THREE.Mesh(instanced(quad, n, at), eyeMat), 1);
    if (o.stars !== false) { add(new THREE.Mesh(instanced(quad, n, at), starMat), 4); add(new THREE.Mesh(instanced(quad, n, at), starWallMat), 4); }
    if (o.beams !== false) add(new THREE.Mesh(instanced(tube, n, at), beamMat), 5);
    triangles += n * (2 + (o.stars !== false ? 2 : 0) + (o.beams !== false ? 16 : 0));
  };
  // the cool hall's eyes (clear air: no beams): the stone and water shaders throw their stars themselves, onto whatever
  // stands under each eye. list: [{ p, shape, scale, accent }], at most NCE of them
  const setCoolEyes = (list) => { list.slice(0, NCE).forEach((e, i) => U.uCEye.value[i].set(e.p[0], e.p[1], e.p[2], (e.scale || 1) + (e.shape ? 10 : 0) + 100 * (e.accent | 0))); };
  await ctx.yield();

  // ---- water, overflow, steam
  const waterMaterial = mk(SIMPLE_VERT, WATER_FRAG, { side: THREE.DoubleSide });   // (its sheets face down: single-sided it was culled from above)
  const sheetMaterial = mk(SIMPLE_VERT, SHEET_FRAG, { ...blendPre, side: THREE.DoubleSide });
  add(new THREE.Mesh(buildWater(basins), waterMaterial));
  add(new THREE.Mesh(buildSheets(basins), sheetMaterial), 1);
  {
    const lb = makeBuilder();
    for (let l = 0; l < 4; l++) lb.grid(40, 1, (u, v) => { const a = u * Math.PI * 2, r = 62 * v; return [Math.sin(a) * r, 0, Math.cos(a) * r, 0, 0, 1]; }, l, true);
    add(new THREE.Mesh(lb.build(), mk(LAYER_VERT, LAYER_FRAG, { ...blendPre, side: THREE.DoubleSide })), 2);
    const per = Math.max(8, Math.round(16 * detail)), np = grilles.length * per, ap = new Float32Array(np * 4);
    for (let i = 0; i < np; i++) { const g = grilles[i % grilles.length]; ap.set([g.x, g.z, (Math.floor(i / grilles.length) + rng()) / per, rng()], i * 4); }
    add(new THREE.Mesh(instanced(quad, np, { aPuff: new THREE.InstancedBufferAttribute(ap, 4) }), mk(PUFF_VERT, PUFF_FRAG, blendPre)), 3);
    triangles += 600 + np * 2;
  }
  await ctx.yield();

  // ---- drips falling through beams, bubbles drifting through beams (each belongs to one long beam)
  {
    let longEyes = eyes.filter((e) => e.kind === 0 && e.sel > 0.6);
    if (!longEyes.length) longEyes = eyes.filter((e) => e.kind === 0 && e.p[1] > 56);
    const nd = Math.round(90 * detail), de = new Float32Array(nd * 3), dd = new Float32Array(nd * 4);
    for (let i = 0; i < nd; i++) { const e = rng.pick(longEyes); de.set(e.p, i * 3); dd.set([rng.range(5, Math.min(e.p[1] - 14, 46)), rng(), rng.range(0.16, 0.3), e.delay], i * 4); }
    add(new THREE.Mesh(instanced(quad, nd, { aEye: new THREE.InstancedBufferAttribute(de, 3), aD: new THREE.InstancedBufferAttribute(dd, 4) }), mk(DRIP_VERT, DRIP_FRAG, blendAdd)), 6);
    const nb = Math.round(120 * detail), be = new Float32Array(nb * 3), b1 = new Float32Array(nb * 4), b2 = new Float32Array(nb * 4);
    for (let i = 0; i < nb; i++) { const e = rng.pick(longEyes); be.set(e.p, i * 3); b1.set([rng.range(2.5, 26), rng(), rng.range(0.012, 0.03), rng() * Math.PI * 2], i * 4); b2.set([rng.range(0.22, 0.6), e.delay, rng(), e.accent], i * 4); }
    add(new THREE.Mesh(instanced(quad, nb, { aEye: new THREE.InstancedBufferAttribute(be, 3), aB: new THREE.InstancedBufferAttribute(b1, 4), aB2: new THREE.InstancedBufferAttribute(b2, 4) }), mk(BUBBLE_VERT, BUBBLE_FRAG, blendAdd)), 7);
    triangles += (nd + nb) * 2;
  }
  await ctx.yield();

  // ---- state
  let progress = -1, steamOverride = null, driftT = 0, cloud0 = 0, cloud1 = 0;
  const sun = new THREE.Vector3();
  // in the cool hall (a low roof) the light leans 24 degrees at most, whatever the hour: its stars stay on the floor round the fountain
  const coolOf = (v, out) => { const h = Math.hypot(v.x, v.z), k = Math.min(1, LK.lean * Math.abs(v.y) / Math.max(h, 1e-4)); return out.set(v.x * k, v.y, v.z * k).normalize(); };
  // (and it comes a little more from the west there, so that some of its stars stand on the wall we travel toward)
  const coolAt = (az, out) => { const ce = Math.cos(elev); return coolOf(out.set(-ce * Math.cos(az + 0.4), -Math.sin(elev), -ce * Math.sin(az + 0.4)), out); };
  const setSunDir = (az) => { const ce = Math.cos(elev); sun.set(-ce * Math.cos(az), -Math.sin(elev), -ce * Math.sin(az)); U.uSunL.value.copy(sun); coolAt(az, U.uSunC.value); };
  const azAt = (u) => az0 + driftRate * 50 * (u - growTo);
  setSunDir(az0 - driftRate * 26);
  const baseAt = (s) => 88 - 102 * Math.pow(Math.min(1, Math.max(0, s)), 0.85);
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const anchors = {
    entry: V(0, 1.9, AP + DEPTH),
    portalSeat: { position: V(0, 16, opts.portalZ ?? -131), normal: V(0, 0, 1), width: 14 },
    flyThrough: [V(0, 1.9, 63.3), V(0, 1.9, 52), V(3.5, 1.9, 40), V(1, 3.2, 28), V(-12, 8, 18), V(-24, 14, 2), V(-12, 19, -14), V(10, 22, -24), V(4, 18, -40), V(0, 16, -52), V(0, 16, -63.3), V(0, 16, -131)],
    frame57: { position: V(1, 3.2, 28), target: V(0, 24, -55) },
    platformTop: V(0, PLAT_H, 0), platformRadius: PLAT_A, pool: { center: V(0, WATER_Y, POOL_Z), radius: POOL_R }, waterY: WATER_Y,
    basins: basins.map((p) => V(p.x, 3.2, p.z)), grilles: grilles.map((p) => V(p.x, 0, p.z)), chambers: chambers.map((p) => V(p.x, 0, p.z)),
    archW: V(0, 0, AP), archE: V(0, 0, -AP), eastArch: { width: 20, height: 34, zFrom: -AP, zTo: -AP - eastDepth },
    domeCrown: V(0, SPRING + DOME_R, 0), sunDir: () => sun.clone(),
    viewpoints: [V(1, 3.2, 28), V(-24, 14, 2), V(10, 22, -24), V(0, 16, -52)],
  };
  return {
    object: root, radius: 13, height: -70, center: V(0, 40, 0), bounds: { radius: 92, height: 85 }, anchors, look, accent: accentHex,
    ground: false, groundY: 0, stoneMaterial, waterMaterial, sheetMaterial, addEyes, setCoolEyes, maxCoolEyes: NCE, maxLamps: NLAMP, accentIndex: accentIdx, uniforms: U,
    // unit direction the light travels in the cool hall when the journey is at u (for placing its eyes over chosen landings)
    coolSunAt(u) { return coolAt(azAt(u), new THREE.Vector3()); }, get triangles() { return triangles; }, MAT,
    setProgress(u) { progress = u; },
    setSteamBase(y) { steamOverride = y; },
    setCloud(c0, c1) { cloud0 = c0; cloud1 = c1; },
    setSun(elevDeg, azDeg) { elev = elevDeg * Math.PI / 180; az0 = azDeg * Math.PI / 180; },
    update(dt, time) {
      const t = time % 3600;
      U.uTime.value = t;
      let base, hz;
      if (progress < 0) {                      // the viewer: loop the growth
        const tt = t % 48, s = tt < 20 ? tt / 20 : tt < 42 ? 1 : 1 - sm(42, 48, tt);
        base = baseAt(s); hz = 0.3 + 0.7 * sm(0, 1, s); driftT = Math.min(driftT + dt, 70);
        setSunDir(az0 + driftRate * (driftT - 26));    // az0 is the azimuth at the linger, 26 s in
      } else {
        const s = (progress - growFrom) / (growTo - growFrom);
        base = baseAt(s); hz = 0.3 + 0.7 * sm(growFrom - 0.04, growTo, progress);
        setSunDir(azAt(progress));               // the sun drifts with the journey: az0 when the forest is complete
      }
      U.uSteamBase.value = steamOverride === null ? base : steamOverride;
      U.uHaze.value = LK.haze * hz * hazeK;
      const ph = (t % 20) / 20;                // a thin cloud edge crosses west to east every 20 s
      U.uCloud.value.set(300 - 470 * Math.min(ph * 1.5, 1), 0.33, cloud0, cloud1);    // from the cool hall to the recess
    },
    dispose() { quad.dispose(); tube.dispose(); },
  };
}
