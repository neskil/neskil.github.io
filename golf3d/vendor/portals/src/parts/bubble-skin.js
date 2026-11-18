// HERO: "The skin and its death" for the world bubble-skin (Skin of a Bubble).
//
// A soap bubble built as a planet (default 300 m radius) whose film is a living thin-film map:
// contour bands dragged into hooks and a street of counter-rotating vortices, feathered plumes,
// black-film spots with silver rims that drift to the thin pole P and merge into a black
// continent, a docked satellite bubble joined by a bright ridge, 800 pollen rafts riding the flow,
// and the burst: a lobed white-gold rolled rim that unzips the planet from P, shedding a hanging
// ring of 3,000 lens droplets and a sinking mist.
//
// LOCAL SPACE  origin = lowest point of the bubble (base centre), +Y up, bubble centre at
//   (0, R, 0). "Front" (+Z) is the sunward shoulder: the sun stands over +Z, the thin pole P is
//   ~30 degrees down from the top toward +Z, the satellite sits on the shaded (-Z) side.
//
// OPTS  palette   [shade, magenta, cyan, gold, silver, leaf, black] hex strings (brief default)
//       radius    planet radius in metres (300)
//       duration  seconds the journey lasts, used to turn progress into film time (40)
//       burstU    progress at which the cap fails at P (default: derived from the route, camera ~100 m from P)
//       progress  initial progress shown until setProgress() is called (0.6)
//       age       0 young thick pastel film .. 1 old, mostly black cap (seeded if omitted)
//       sunDir    THREE.Vector3 toward the sun, local space (50 degrees up over +Z)
//       sunColor  hex, colour of the sun highlight ('#fff6e4'); amber for the evening variant
//       satellites 0 or 1 (1)
//
// PROGRESS  hero.setProgress(u): u = journey progress 0..1 (pass the u given to world.update).
//   Everything scripted hangs on it: film thinning, black spots being born / drifting / merging,
//   the burst front (220 m/s from burstU), the flash, the droplet ring, the mist, the freed
//   satellite. hero.burstU and hero.holeAngle() (radians of colatitude about P already opened,
//   0 before the burst) are there so the world can dim / reveal its portal with the film.
//   Ambient flow (bands sliding, vortices winding, twinkle) runs on `time` in update().
//
// ANCHORS (all local space, THREE.Vector3 unless noted)
//   bubbleCenter            centre of the planet
//   pole, poleNormal        the point P on the skin where black film gathers and the burst starts
//   portalSeat              { position, normal, facing }: ~12 m beneath the skin under P; the portal and
//                           the droplet ring face the arriving camera (ringNormal), which dives 60 degrees
//                           along -ringNormal on the heading it already has (anchors.heading)
//   ringCenter, ringRadius  where the droplet ring hangs (centre, mean radius in metres)
//   satellite               { center, radius, flank }: flank is a point 8 m off its upper side
//   vortexStreet            array of the six street vortex centres on the skin
//   flyThrough              ordered points for the journey: level entry toward the hillside, along the 55
//                           degree parallel across the vortex street, round the satellite's upper flank
//                           (9 m off it), round the summit, down the sunward shoulder to P, crest as the
//                           ground falls away, then the straight 60 degree dive. At least 11 m off the skin
//                           before the burst. burstU is derived from it (camera ~100 m from P) unless given.
//   viewpoints              { entry, closePass, overTop, blackCountry, crest } good camera spots
//   sunDir                  unit vector toward the sun the film is shaded for
//
// STYLE (so the world can match it): the film is self-lit. It reflects an analytic environment
//   (shade green, twinkling leaf bokeh overhead, a pale wall with a dark window, a bright window
//   quadrilateral, a starred sun) multiplied by a fixed soap-film ramp indexed by thickness:
//   black, silver, gold, magenta, deep blue, cyan, then paler repeats. Alpha follows fresnel, so
//   the centre of view is clear and the limb is solid colour. hero.makeMoonMaterial() returns a
//   cut-down film material for the distant bubble-moons (use on any unit-ish sphere geometry).
//   Scene lights do not affect the hero; it needs darkness behind it, not illumination.
//
// SIZE radius 300 (plus satellite bulge ~70 m), height 600.  COST ~112k triangles, 9 draw calls,
//   no lights, ~200 ms build. The cost is fragment shading of the film (16 vortices since L1C: 14 dealt and the two entry swirls; 4 octaves).
// ROUND TWO (world coder): opts.frost (ice ferns grow over the film, the droplets become flakes),
//   opts.lamps (a string of twelve warm garden lights reflected instead of the sun), opts.rimSpeed,
//   opts.flow (film flow-rate multiplier). The droplet ring hangs in a plane tilted to face the
//   arriving camera (anchors.ringNormal); flyThrough was re-routed and flown (see the world file).
//   hero.env = the analytic garden uniforms, ENV_GLSL / NOISE_GLSL are exported for the backdrop.
// POLISH L1 (shots/bubble-skin/polish-l1-1/notes.md): outside reviewers found the opening one view held four
//   times and the black-film country an empty dark slab. (1) Route spots are born a few seconds before the
//   camera reaches them, in three sizes, so the opening hillside is colour film and the black country opens
//   as we arrive. (2) The black film is a country, not a slab: pinpricks being born near every shore (a cell
//   field), swells that cut bays, islands of thick film with their own silver shores, a halo that follows the
//   spot's size. (3) Black film is clear looking down (far inner wall, garden and the portal's ring show
//   through) and a pale mirror at the limb; the far wall's bands are deepened. (4) The wall's dark window is
//   only a soft dimming in reflections; the bright window quadrilateral is bowed, soft-edged, barred, and shows
//   from 19 m. (5) Two finer sets of lamellae at macro range (uFine quiets them on the satellite). (6) The
//   run-in is 100 m shorter. (7) Under garden lights the sun star is off. No rng draw moved.
// POLISH L2 (shots/bubble-skin/polish-l1-2/notes.md): outside reviewers still found the opening one blurry swirl, the window a
//   pasted smudge, the docked dome cut off, thick white outlines in the black country and a washed-out ending.
//   (1) Contour bands a whole colour order deep (uBand, uBandF: 96 on the planet, 34 on the satellite, 26 on the moons), a
//   second 20 m set that fades by pixel size, crisper order edges in the ramp, and single-sample marbling under the camera.
//   (2) Vortices 12 and 13 sit on the entry hillside (same draws, new seats). (3) The window is the barrel-bowed six-pane
//   quadrilateral with its own white light (bsWinV); uEnvWin fades it whole as the camera sinks below 15 m. (4) The satellite
//   is solid from afar (uSolid), the far arc of the join is faint, and a mirrored copy of the dome (uMirK/uMirH/uMirN,
//   uAlphaK) lies in the planet's film near the join. (5) Black shores: a 0.3 m silver line, a one to two pixel rim, feathered
//   orders inland, more islands; the far wall behind the windows is darker. (6) A thin bright limb line on every bubble.
//   (7) The film ahead of the burst rim burns in its own colours; the mist's point size follows the picture's height.
//   No rng draw moved.
// POLISH L1C (shots/bubble-skin/src-l1c/NOTES.md): the two swirls of the entry hillside are swirls of their own (numbers 14 and
//   15 of the film's flow, NV = 16): seats stated in metres from the route's own knots, sign, strengths and three pollen rafts
//   each dealt from a fork of their own ('entry-swirls', made after the last draw of the hero's stream). Vortices 12 and 13
//   are back where their own draws put them (L2 overwrote them; their draws were taken and thrown away). No draw of the
//   hero's stream or of its 'ice' fork is added, removed or moved.
// POLISH L1D (shots/bubble-skin/src-l1d/NOTES.md): the window's bright quadrilateral was a hard white pane on a perfect ball,
//   and the house wall's reflection a flat pale slab (the grey rectangle in the docked bubble). Both are now carried by the
//   film: the mirrored ray is thrown by the film's own tilt (the drag of the storms, the swell of the broad bands, the ripple
//   of the lamellae: bsBend), their edges are feathered (bsSoft), and their light comes back in the film's own colours
//   (the pane: the film's hue at full strength with two fifths of white; the wall: the same amount of light through the
//   film's hue). The backdrop and the droplets see both as before. Shader only: no draw, no geometry, no uniform added.
import * as THREE from 'three';
import { clamp, smoothstep, makePath } from '../kit/core.js';

const DEFAULT_PALETTE = ['#0F2A1C', '#E8308C', '#19C3D6', '#F2B93B', '#F4F1E6', '#6FB34A', '#05080A'];
const NVD = 14, NV = NVD + 2, NS = 28;   // NVD vortices dealt by the hero's stream (and by the satellite's loop), plus the two entry swirls

// ---------- shared GLSL ----------
export const NOISE_GLSL = /* glsl */`
float bsHash(vec3 p){ p = fract(p * 0.3183099 + vec3(0.11, 0.23, 0.37)); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float bsNoise(vec3 x){
  vec3 i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(bsHash(i), bsHash(i + vec3(1,0,0)), f.x), mix(bsHash(i + vec3(0,1,0)), bsHash(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(bsHash(i + vec3(0,0,1)), bsHash(i + vec3(1,0,1)), f.x), mix(bsHash(i + vec3(0,1,1)), bsHash(i + vec3(1,1,1)), f.x), f.y), f.z);
}
float bsFbm(vec3 p){
  float s = 0.0, a = 0.5;
  s += a * bsNoise(p); p = p * 2.03 + vec3(3.1, 1.7, 5.3); a *= 0.5;
  s += a * bsNoise(p); p = p * 2.01 + vec3(1.3, 7.1, 2.9); a *= 0.5;
  s += a * bsNoise(p); p = p * 2.02 + vec3(6.7, 0.9, 4.1); a *= 0.5;
  s += a * bsNoise(p);
  return s * 2.1333 - 1.0;            // ~[-1,1]
}
vec2 bsHash2(vec2 p){ vec3 q = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973)); q += dot(q, q.yzx + 33.33); return fract((q.xx + q.yz) * q.zy); }
`;

// analytic garden environment seen in the film and the droplets; r is a unit direction (local)
export const ENV_GLSL = /* glsl */`
uniform vec3 uSun, uSunCol, uShade, uLeaf, uWhite;
uniform vec3 uLampC, uLampX, uLampCol;
uniform float uLampK, uEnvWin, uWinS;
uniform vec2 uEnvWall;
uniform vec3 uWall, uWallX, uWin, uWinX;
uniform float uTime;
float bsWinK = 1.0;            // the film fades the window at grazing angles
float bsWinV = 0.0;            // the window quadrilateral's own light at this direction (set by bsEnv)
// POLISH L1D: what a film does to the two built things it mirrors, the window's quadrilateral and the house wall the window is
// set in. All three stay 0 for the backdrop and the droplets, which see both exactly as before.
vec3 bsBend = vec3(0.0);       // how far the film's tilt at this fragment throws the mirrored ray (set by the film before bsEnv)
float bsSoft = 0.0;            // 1 on a film: both are feathered at their edges (a film is not a plate of glass)
vec3 bsWallD = vec3(0.0);      // the light the wall added at this direction (set by bsEnv): the film gives it back in its own colours
vec3 bsBokeh(vec2 p, float t, float keep){
  vec2 id = floor(p), f = fract(p) - 0.5;
  vec2 rnd = bsHash2(id);
  vec2 off = (rnd - 0.5) * 0.36;
  float rad = 0.13 + 0.18 * rnd.x;
  float d = length(f - off);
  float disc = 1.0 - smoothstep(rad * 0.82, rad, d);
  disc *= 0.75 + 0.25 * smoothstep(rad * 0.5, rad * 0.9, d);       // brighter edge, like real bokeh
  float tw = 0.55 + 0.45 * sin(t * (0.5 + rnd.y * 1.6) + rnd.x * 40.0);
  float on = step(keep, fract(rnd.x * 7.31 + rnd.y * 3.17));
  vec3 c = mix(uLeaf * 1.5, uWhite * 1.9, rnd.y * rnd.y);
  return c * disc * tw * on;
}
vec3 bsEnv(vec3 r){
  float up = r.y;
  vec3 c = uShade * (1.6 + 1.2 * smoothstep(-0.2, 0.5, up));
  c = mix(c, uLeaf * 0.22, smoothstep(-0.25, -0.85, up));           // sunlit lawn far below
  float can = smoothstep(0.02, 0.4, up);
  c += uLeaf * 0.34 * can * (1.0 - 0.45 * uEnvWall.y);             // light filtering through leaves
  vec2 p = r.xz / (0.4 + max(up, 0.0));
  c += (bsBokeh(p * 2.6, uTime, 0.3) + 0.7 * bsBokeh(p * 5.3 + 7.7, uTime * 1.3, 0.45)) * can * (0.2 - 0.12 * uEnvWall.y);   // the backdrop's canopy is carried by round sprites
  // pale house wall with one dark window, low on one side
  // (POLISH L1D: on a film the wall is thrown by the film's tilt by the same share of its own size as the window, which it is
  // some eight times as wide as; and its edges are a long feather with next to no plateau, a cushion of light, not a slab)
  vec3 rw = r + bsBend * 8.0;
  float wd = dot(rw, uWall);
  bsWallD = vec3(0.0);
  if (wd > 0.05) {
    vec3 wy = cross(uWall, uWallX);
    vec2 q = vec2(dot(rw, uWallX), dot(rw, wy)) / wd;
    float ws = uEnvWall.y;                                             // 0 for reflections, 1 for the blurred backdrop
    float wall = smoothstep(1.5 + 0.5 * ws + 0.35 * bsSoft, 0.9 - 0.6 * ws - 0.45 * bsSoft, abs(q.x)) * smoothstep(0.75 + 0.35 * ws + 0.2 * bsSoft, 0.45 - 0.35 * ws - 0.3 * bsSoft, abs(q.y - 0.05));
    float win = smoothstep(0.26 + 0.1 * ws, 0.2 - 0.1 * ws, abs(q.x - 0.25)) * smoothstep(0.3 + 0.1 * ws, 0.24 - 0.1 * ws, abs(q.y - 0.1));
    wall *= mix(1.0, smoothstep(-0.46, -0.14, up), ws);                  // POLISH L2: in the backdrop the wall stands on the lawn, it does not veil it
    win = mix(0.3 * smoothstep(0.36, 0.1, abs(q.x - 0.25)) * smoothstep(0.4, 0.14, abs(q.y - 0.1)), win, ws);   // POLISH L1: in the film the wall's window is a soft dimming, never a hard dark square
    vec3 c0 = c;
    c = mix(c, uWhite * 0.62 * (1.0 - 0.85 * win), wall * 0.9 * uEnvWall.x);
    bsWallD = c - c0;
  }
  // the classic bright window quadrilateral with its glazing bars
  vec3 rb = r + bsBend;
  float bd = dot(rb, uWin);
  if (bd > 0.05) {
    vec3 by = cross(uWin, uWinX);
    vec2 q = vec2(dot(rb, uWinX), dot(rb, by)) / bd;
    // POLISH L2: the classic curved quadrilateral as a bubble shows it: barrel-bowed sides, keystoned, six panes
    // between glazing bars, a crisp edge with a soft shoulder (it was a soft square that read as a smudge)
    q *= uWinS; q *= 1.0 + 11.0 * dot(q, q); q.x *= 1.0 + 1.3 * q.y; q.y += 1.1 * q.x * q.x;
    // POLISH L1D: on a film the outline is feathered over nearly half a pane's width (0.036; it was 0.016) about the same middle line,
    // so the pane is the size it was; the glazing bars keep their line, they are what says window. The backdrop and the
    // droplets keep the crisp outline
    float box = smoothstep(0.128 + 0.01 * bsSoft, 0.112 - 0.01 * bsSoft, abs(q.x)) * smoothstep(0.168 + 0.01 * bsSoft, 0.152 - 0.01 * bsSoft, abs(q.y));
    float px3 = abs(abs(q.x) - 0.041);
    float bars = (0.1 + 0.9 * smoothstep(0.004, 0.011, px3)) * (0.1 + 0.9 * smoothstep(0.004, 0.011, abs(q.y - 0.012)));
    float sheen = 0.72 + 0.28 * smoothstep(-0.16, 0.16, q.y - 0.5 * q.x);                    // sky in the upper panes
    bsWinV = box * bars * sheen * uEnvWin * bsWinK;
    c += uWhite * 0.8 * bsWinV;
  }
  return c;
}
// a string of twelve garden lights on a sagging line (dusk variant); soft = disc size (1 - cos)
vec3 bsLamps(vec3 r, float soft){
  vec3 acc = vec3(0.0);
  if (uLampK < 0.5) return acc;
  for (int i = 0; i < 12; i++) {
    float t = (float(i) - 5.5) / 5.5;
    vec3 l = normalize(uLampC + uLampX * (t * 0.95) + vec3(0.0, 0.2 * t * t, 0.0));
    float dd = max(1.0 - dot(r, l), 0.0);
    float fl = 0.8 + 0.2 * sin(uTime * (2.0 + float(i) * 0.37) + float(i) * 1.7);
    acc += uLampCol * fl * (1.0 - smoothstep(soft * 0.55, soft, dd)) + uLampCol * 0.25 * exp(-dd / (soft * 6.0));
  }
  return acc;
}
// the sun as a small starred highlight (HDR)
vec3 bsSun(vec3 r){
  float sd = dot(r, uSun);
  if (sd < 0.6) return bsLamps(r, 0.0007) * 7.0;
  vec3 sx = normalize(cross(uSun, vec3(0.31, 0.2, 0.93)));
  vec3 sy = cross(uSun, sx);
  vec2 q = vec2(dot(r, sx), dot(r, sy));
  float rr = length(q);
  float disc = smoothstep(0.03, 0.018, rr) * 9.0 + exp(-rr * 22.0) * 1.3;
  float st = 0.0;
  st += exp(-abs(q.y) * 240.0);
  st += exp(-abs(q.x * 0.5 + q.y * 0.866) * 240.0);
  st += exp(-abs(q.x * 0.5 - q.y * 0.866) * 240.0);
  disc += st * exp(-rr * 9.0) * 2.6;
  return uSunCol * disc * (1.0 - uLampK) + bsLamps(r, 0.0007) * 7.0;      // under the garden lights the sun star is replaced by the dozen lamps
}
`;

// the burst front: colatitude about P already opened, lobed in azimuth
const HOLE_GLSL = /* glsl */`
uniform float uHole;
uniform vec3 uLobe;
uniform vec3 uP, uPx, uPy;
float bsFrontAz(float az){
  float amp = 1.0 - smoothstep(1.3, 2.9, uHole);
  float l = 1.0 + amp * (0.11 * sin(5.0 * az + uLobe.x) + 0.07 * sin(9.0 * az + uLobe.y) + 0.035 * sin(17.0 * az + uLobe.z));
  return uHole * l;
}
float bsAz(vec3 d){
  vec2 e = vec2(dot(d, uPx), dot(d, uPy));
  if (abs(e.x) + abs(e.y) < 1e-6) e = vec2(1e-6, 0.0);
  return atan(e.y, e.x);
}
// > 0 : still film, value = radians ahead of the front;  < 0 : already gone
float bsAhead(vec3 d){
  float colat = acos(clamp(dot(d, uP), -1.0, 1.0));
  return colat - bsFrontAz(bsAz(d));
}
`;

// soap-film colour ramp indexed by thickness (0..6 "orders"), linear colours baked to sRGB8
function makeRamp(pal, rng) {
  const C = (h) => new THREE.Color(h);
  const black = C(pal[6]), silver = C(pal[4]), gold = C(pal[3]), mag = C(pal[1]), cyan = C(pal[2]);
  const blue = C('#2434B4'), sea = C('#22BDC4'), white = C('#F4F1E6');
  const pale = (c, k) => c.clone().lerp(white, k);
  const j = () => rng.range(-0.04, 0.04);
  const stops = [
    [0.0, black], [0.13, black], [0.2, silver.clone().multiplyScalar(0.8)], [0.3, silver.clone().multiplyScalar(0.7)],
    [0.5 + j(), gold], [0.82 + j(), mag], [1.1 + j(), blue], [1.4 + j(), cyan],
    [1.75 + j(), pale(gold, 0.12)], [2.15 + j(), pale(mag, 0.1)], [2.5 + j(), pale(blue, 0.25)], [2.8 + j(), pale(sea, 0.08)],
    [3.2 + j(), pale(gold, 0.3)], [3.65 + j(), pale(mag, 0.32)], [4.1 + j(), pale(sea, 0.3)],
    [4.6, pale(gold, 0.45)], [5.1, pale(mag, 0.5)], [5.6, pale(sea, 0.5)], [6.0, pale(gold, 0.62)],
  ];
  const N = 256, data = new Uint8Array(N * 4), c = new THREE.Color();
  for (let i = 0; i < N; i++) {
    const h = (i / (N - 1)) * 6;
    let k = 0; while (k < stops.length - 2 && stops[k + 1][0] < h) k++;
    const a = stops[k], b = stops[k + 1];
    let t = clamp((h - a[0]) / Math.max(1e-4, b[0] - a[0]), 0, 1); t = t * t * (3 - 2 * t); if (h > 0.4) t = t * t * (3 - 2 * t);   // POLISH L2: colour orders meet at crisper edges
    c.copy(a[1]).lerp(b[1], t);
    // keep albedo under ~0.8 and store as sRGB
    c.multiplyScalar(0.86).convertLinearToSRGB();
    data[i * 4] = Math.round(clamp(c.r, 0, 1) * 255); data[i * 4 + 1] = Math.round(clamp(c.g, 0, 1) * 255);
    data[i * 4 + 2] = Math.round(clamp(c.b, 0, 1) * 255); data[i * 4 + 3] = 255;
  }
  const tex = new THREE.DataTexture(data, N, 1, THREE.RGBAFormat);
  tex.colorSpace = THREE.SRGBColorSpace; tex.minFilter = tex.magFilter = THREE.LinearFilter;
  tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping; tex.generateMipmaps = false; tex.needsUpdate = true;
  return tex;
}

// ---------- the film ----------
const FILM_VERT = /* glsl */`
#include <fog_pars_vertex>
${'$'}{HOLE}
uniform float uWob, uPhase, uTimeV, uLift;
varying vec3 vDir, vPosL, vCamL;
void main(){
  vec3 d = normalize(position);
  float y2 = d.y * d.y;
  float s = 1.0 + uWob * (1.5 * y2 - 0.5) * sin(uTimeV * 0.9 + uPhase) + uWob * 0.4 * d.x * d.z * sin(uTimeV * 1.37 + uPhase * 2.0);
  if (uHole > 0.0) {                       // the film just ahead of the rim piles up and lifts
    float ah = bsAhead(d);
    s += uLift * (1.0 - smoothstep(0.0, 0.05, ah)) * step(0.0, ah);
  }
  vec3 p = d * s;
  vDir = d; vPosL = p;
  mat4 mm = modelMatrix;
  #ifdef USE_INSTANCING
  mm = modelMatrix * instanceMatrix;
  #endif
  vCamL = (inverse(mm) * vec4(cameraPosition, 1.0)).xyz;
  vec4 mvPosition = viewMatrix * mm * vec4(p, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;

const FILM_FRAG = /* glsl */`
precision highp float;
#include <fog_pars_fragment>
${'$'}{NOISE}
${'$'}{ENV}
${'$'}{HOLE}
uniform sampler2D uRamp;
uniform float uR, uBack, uThin, uSpan, uNs, uRot, uFlash, uGain, uClipR, uShearT, uAlpha0, uSpotT, uFine, uBand, uBandF, uSolid, uAlphaK, uMirK, uMirH;
uniform vec3 uMirN;
uniform vec3 uClipC, uFlow, uSeedOff;
#ifdef BS_FROST
uniform vec4 uIce[12];
uniform float uIceRot;
#endif
#ifdef BS_FULL
uniform vec4 uVort[${'$'}{NV}];
uniform float uVortS[${'$'}{NV}];
uniform vec4 uSpot[${'$'}{NS}];
#endif
varying vec3 vDir, vPosL, vCamL;

float bsFineK = 0.0, bsFineK2 = 0.0, bsMidK = 1.0;
float bsHc = 0.0;              // POLISH L1D: the broad thickness at the last direction given to bsThick (the gravity ramp, the two noises, the plumes and the 40 to 50 m contour bands; none of the fine lamellae)
vec3 bsRot(vec3 p, vec3 a, float ang){
  float c = cos(ang), s = sin(ang);
  return p * c + cross(a, p) * s + a * dot(a, p) * (1.0 - c);
}
// film thickness in "orders" at a (flow-warped) direction q
float bsThick(vec3 q){
  float z = dot(q, uP);
  float g = pow(clamp((1.0 - z) * 0.5, 0.0, 1.0), 0.45);            // 0 at the thin pole, 1 at the bottom
  float n = bsFbm(q * uNs + uSeedOff);
  vec3 qm = q * uNs * 3.7 + uSeedOff.yzx;
  float m = bsNoise(qm) * 0.65 + bsNoise(qm * 2.4 + 2.2) * 0.35 - 0.5;
  vec3 qs = (q - uP * z * 0.84) * 10.0 + uSeedOff.zxy;             // stretched along the meridians
  float pn = bsNoise(qs) * 0.65 + bsNoise(qs * 2.3 + 4.1) * 0.35;
  float pl = smoothstep(0.52, 0.78, pn) * smoothstep(0.12, 0.38, g) * (1.0 - smoothstep(0.75, 0.98, g));
  bsHc = uThin + g * uSpan + n * 0.55 * (0.5 + 0.75 * g) + m * 0.5 * (0.35 + g) + pl * 1.25 + uBand * sin(g * uBandF + n * 5.0 + m * 1.6) * smoothstep(0.06, 0.3, g);
  return uThin + g * uSpan + n * 0.55 * (0.5 + 0.75 * g) + m * 0.5 * (0.35 + g) + pl * 1.25
       + bsFineK * 0.4 * sin(g * 420.0 + m * 14.0 + n * 9.0)          // fine lamellae, only where a pixel can resolve them
       + bsFineK2 * 0.28 * sin(g * 520.0 + n * 120.0 + m * 44.0)         // POLISH L1: and a finer set at macro range that follows the thickness contours everywhere, so the near film is razor sharp
       + (uBand * sin(g * uBandF + n * 5.0 + m * 1.6) + 0.17 * bsMidK * sin(g * 232.0 + m * 7.0 + n * 3.0)) * smoothstep(0.06, 0.3, g);   // POLISH L2: broad contour bands 40-50 m wide, a whole colour order deep, for the vortices to wind (was a faint stripe)
}
void main(){
  vec3 d = normalize(vDir);
  float ahead = 1.0;
  if (uHole > 0.0) { ahead = bsAhead(d); if (ahead < 0.0) discard; }
  if (uClipR > 0.0 && length(vPosL - uClipC) < uClipR) discard;
  if (uClipR < 0.0 && length(vPosL - uClipC) > -uClipR) discard;

  float pxm = max(length(fwidth(vPosL)) * uR, 0.02);                 // metres per pixel (taken before any loop)
  bsFineK = (1.0 - smoothstep(0.8, 3.0, pxm)) * uFine; bsFineK2 = (1.0 - smoothstep(0.22, 0.9, pxm)) * uFine; bsMidK = 1.0 - smoothstep(2.5, 7.0, pxm);
  // --- flow: two phase-offset warps, cross-faded so the pattern advects for ever
  vec3 qa = d, qb = d;
#ifdef BS_FULL
  for (int i = 0; i < ${'$'}{NV}; i++) {
    vec4 v = uVort[i];
    float dd = 2.0 * (1.0 - dot(d, v.xyz));
    float f = exp(-dd / max(v.w * v.w, 1e-5)) * uVortS[i];
    if (abs(f) > 0.004) { qa = bsRot(qa, v.xyz, -f * uFlow.x); qb = bsRot(qb, v.xyz, -f * uFlow.y); }
  }
#endif
  vec3 drag = (qa - d) * uFlow.z + (qb - d) * (1.0 - uFlow.z);        // POLISH L1D: how far the storms have carried the film that is here now (0 where no storm reaches; at most 2)
  float zc = dot(d, uP);
  float om = uShearT * (sin(zc * 5.0 + 1.0) + 0.6 * sin(zc * 11.0 + 2.3));
  qa = bsRot(qa, uP, -om * uFlow.x - uRot);
  qb = bsRot(qb, uP, -om * uFlow.y - uRot);
  float wa = uFlow.z, wb = 1.0 - uFlow.z;
  float h = bsThick(qa) * wa; float hc = bsHc * wa;
  h += bsThick(qb) * wb; hc += bsHc * wb;                              // (POLISH L1D: hc, the broad thickness, flows with h)
  { // POLISH L2: the cross-fade of the two phases softens the near film; marbling that rides only the slow turn about P
    // (one sample, so never doubled) keeps the film under the camera razor sharp
    float nk = (1.0 - smoothstep(0.1, 0.42, pxm)) * uFine;
    if (nk > 0.01) {
      vec3 qc = bsRot(d, uP, -uRot) * uNs;
      float dt = bsNoise(qc * 34.0 + uSeedOff) * 0.6 + bsNoise(qc * 81.0 + uSeedOff.zxy) * 0.4 - 0.5;
      h += nk * (0.3 * dt + 0.1 * sin(dt * 34.0 + h * 5.0)) * smoothstep(0.45, 1.0, h);      // thin silver film stays clean: it never marbles into black
    }
  }

  // --- black film: spots merged by smooth minimum, silver rims
  float black = 0.0, rim = 0.0;
#ifdef BS_FULL
  float acc = 0.0, accR = 0.0;
  for (int i = 0; i < ${'$'}{NS}; i++) {
    vec4 s = uSpot[i];
    float dist = length(d - s.xyz) * uR - s.w;
    float e = exp(clamp(-dist * 0.45, -60.0, 40.0));
    acc += e; accR += e * clamp(s.w, 0.0, 60.0);
  }
  float sd = -log(max(acc, 1e-26)) / 0.45;
  float srad = accR / max(acc, 1e-26);                                // radius of the spot that owns this point
  float halo = 0.1 * clamp(22.0 / max(srad, 2.0), 1.0, 5.0);          // a pinprick wears a narrow halo, a continent a broad one
  float aa0 = max(fwidth(sd), 1e-3);
  sd += (bsNoise(d * 26.0 + uSeedOff) - 0.5) * 7.0 + (bsNoise(d * 85.0 + uSeedOff.yzx) - 0.5) * 1.6 / (1.0 + aa0);
  // POLISH L1: the black country is broken, not one slab: broad swells leave islands and bays of colour
  // film inside its shores, and pinpricks are being born in the film within ~70 m of it (a cell field,
  // 8 nearest cells, plain arithmetic in the loop), each growing on its own clock and wearing its own rim
  vec3 dr = bsRot(d, uP, -uRot);                                      // the swells ride the film's slow turn about P
  sd += (bsNoise(dr * 7.5 + uSeedOff.zxy) - 0.5) * 26.0 * smoothstep(-34.0, -3.0, sd) * (1.0 - smoothstep(4.0, 16.0, sd));
  // islands of thick film left standing in the black continent, each with its own silver shore
  float isl = (bsNoise(dr * 8.5 + uSeedOff) * 0.7 + bsNoise(dr * 23.0 + uSeedOff.yzx) * 0.3 - 0.52) * 130.0;
  float isd = min(isl, -sd - 6.0);
  float inIsl = step(sd, isd) * step(0.0, isd);
  halo = mix(halo, 0.6, inIsl);              // an island's film thickens quickly inland: gold, then magenta, within a few metres of its shore
  sd = max(sd, isd);
  float pin = 1e3, best = 1e3;
  {
    float shore = (1.0 - smoothstep(14.0, 52.0, sd)) * smoothstep(1.5, 7.0, sd);
    if (shore > 0.01) {
      vec3 pc = dr * (uR / 25.0) + uSeedOff.yzx;
      vec3 ib = floor(pc - 0.5);
      for (int k = 0; k < 8; k++) {
        float fk = float(k);
        vec3 o = vec3(mod(fk, 2.0), mod(floor(fk * 0.5), 2.0), floor(fk * 0.25));
        vec3 id = ib + o;
        float h1 = bsHash(id), h2 = bsHash(id + 17.3), h3 = bsHash(id + 41.7);
        vec3 fp = id + 0.5 + (vec3(h1, h2, h3) - 0.5) * 0.5;
        float born = h2 * 30.0 - 6.0;
        float rr = (1.5 + 7.5 * h3 * h3) * smoothstep(born, born + 10.0, uSpotT) * shore;
        best = min(best, length(pc - fp) * 25.0 - rr + step(rr, 0.05) * 1e3);
      }
      pin = best;
    }
  }
  sd = min(sd, pin);
  float aa = max(fwidth(sd), aa0);
  h = mix(h, max(h, 0.5 + 0.8 * bsNoise(dr * 26.0 + uSeedOff.zxy) + 0.28 * sin(isd * 0.6 + 1.2) + 0.2), inIsl);     // islands are thick film left standing: gold to magenta, never the cap's own silver
  { // POLISH L2: the silver is a 0.4 m line at the shore (it was a band metres wide that read as a sticker's outline); inland the
    // orders follow at uneven, feathered widths
    float s0 = max(sd, 0.0), hv = halo * (0.55 + 1.7 * bsNoise(dr * 31.0 + uSeedOff.yzx));
    h = min(h, 0.19 + min(s0, 0.32) * 0.8 + max(s0 - 0.32, 0.0) * hv * 1.5); }
  h = min(h, 0.19 + max(pin, 0.0) * 0.55);
  black = 1.0 - smoothstep(-aa, aa, sd);
  float rw = max(0.12, aa * 0.45);
  rim = (1.0 - smoothstep(rw * 0.6, rw * 0.6 + aa * 0.85, abs(sd - rw))) * step(-60.0, -abs(sd));      // POLISH L2: a hair line, one to two pixels
  rim *= clamp(0.2 / max(aa * 0.6, 1e-3), 0.42, 1.0);                 // a 0.4 m line: where a pixel is wider than it, it dims instead of thickening
#endif
  float hb = 1.0 - smoothstep(0.125, 0.15, h);                      // film that has thinned to black by itself
  black = max(black, hb);
  h = clamp(h, 0.0, 5.98);
  vec3 film = texture2D(uRamp, vec2(h / 6.0, 0.5)).rgb;

  // --- shading: fresnel mirror of the garden, coloured by the film
  vec3 N = normalize(vPosL);
  vec3 V = normalize(vCamL - vPosL);
  if (uBack > 0.5) { N = -N; film = film * (0.12 + 1.25 * film); }       // the far inner wall: its bands deepened, so they stay colour when dimmed
  float ndv = clamp(abs(dot(N, V)), 0.0, 1.0);
  vec3 Rr = reflect(-V, N);
  float fr = pow(1.0 - ndv, 2.2);
  bsWinK = (1.0 - 0.7 * fr) * smoothstep(9.0, 15.0, length(vCamL - vPosL) * uR);   // (POLISH L2: the whole pane fades as the camera sinks, see update(); a fade by distance cut it into a smudge)
  { // POLISH L1D: the window's quadrilateral and the house wall are carried by the film. A film is not a ball of glass: it is
    // tilted where the storms drag it and where it thickens and thins, and the mirror image of a thing goes where the tilted
    // film throws it. Three tilts, all of the film at this fragment and nothing of the lens:
    //   the drag of the storms: the same displacement that winds the colour bands. It counts on a storm's flank, where the
    //     film is carried up to some 18 m (0.06 of the radius) and the bands still lie side by side: there it tilts the film
    //     up to 0.010 rad, which throws the pane by a sixth of its half-width, so a storm passing under the reflection
    //     pulls its outline and its bars round and lets them go again. In the eye, where the film has gone round many
    //     times, the pull dies away (it would shred the pane, and the eye of a storm is still);
    //   the swell of the broad bands: 0.006 rad to and fro once in about one and a half colour orders of the broad
    //     thickness (the 40 to 50 m contour bands, the plumes): the pane, some 7 m of film across, is bowed and sheared
    //     by the band it lies on, and as the bands slide it sways with them, by a tenth of its half-width (at a quarter
    //     and a sixth, tried first, the pane over the tightly wound streaks of the entry swirl was torn band from band
    //     and no longer read as a window);
    //   the ripple of the fine lamellae: 0.002 rad on the full thickness, the colours themselves: a tremble of a third of a
    //     glazing bar's width along the edges and bars wherever colour runs under them.
    float dl = min(length(drag), 2.0);
    vec3 tilt = drag * (0.4 * exp(-dl * dl / 0.0036));
    vec3 tx = cross(uP, d); tx /= max(length(tx), 1e-3); vec3 ty = cross(d, tx);
    tilt += (tx * sin(hc * 4.4 + 1.0) + ty * sin(hc * 3.1 + 2.3)) * 0.006 + (tx * sin(h * 4.4 + 1.0) + ty * sin(h * 3.1 + 2.3)) * 0.002;
    bsBend = reflect(-V, normalize(N + tilt)) - Rr; bsSoft = 1.0;
  }
  vec3 E = bsEnv(Rr);
  vec3 S = bsSun(Rr);
  vec3 fl = film / max(max(film.r, max(film.g, film.b)), 0.2);        // POLISH L1D: the film's own hue at full strength (black film stays dark)
  float refl = 0.1 + 0.9 * fr;
  float elum = dot(E, vec3(0.3, 0.55, 0.15));
  // POLISH L1D: the house wall's light comes back in the film's own colours, deepened (it was white light on the film, which
  // washed a flat pale slab into the colours, the grey rectangle strangers saw in the docked bubble): the same amount of
  // light, taken out of the white term and given through the film's hue at full strength
  vec3 col = film * ((E - bsWallD) * 1.25 + vec3(0.55 + 0.4 * fr) + fl * (dot(max(bsWallD, 0.0), vec3(0.3333)) * 1.6)) * (0.55 + 0.45 * refl) * uGain;
  col += film * film * fr * 0.35 * uGain;                           // the limb burns
  { float lm = smoothstep(0.82, 1.0, 1.0 - ndv); col += (uWhite * 0.5 + film * 0.5) * lm * lm * 0.5; }   // POLISH L2: and wears the thin bright line every bubble has, so a flank close to the lens reads as a bubble's limb
  col += S * (0.35 + 0.65 * refl);
  // POLISH L2: the window is a bright pane on the film, not a pale tint of it. POLISH L1D: its light is the film's own colour
  // at full strength with two fifths of white in it (it was plain white), and over the film's dark hues (blue, deep magenta)
  // it is lifted until it is four fifths as light as white, so that the light it lays is that of the white pane
  // (0.55 * 1.15 * 0.8 = 0.506 of white where the old one laid 0.5 * 1.02 = 0.51): a window all over, tinted by the film.
  // (MEND 1, measured in the pictures: a tinted light of the same strength reads mostly 1 to 12 of 255 less light than
  // white, and 17 to 32 less where the pane lies on deep magenta or blue film: the price of the tint; see the notes)
  vec3 lit = mix(fl, uWhite, 0.4);
  lit *= 1.15 * max(1.0, 0.8 * dot(uWhite, vec3(0.2126, 0.7152, 0.0722)) / max(dot(lit, vec3(0.2126, 0.7152, 0.0722)), 0.1));
  col = mix(col, lit, bsWinV * 0.55);
  float alpha = mix(uAlpha0, 0.98, smoothstep(0.0, 0.75, fr)) + 0.25 * clamp(elum - 0.5, 0.0, 1.0);
  alpha = max(alpha, uSolid * smoothstep(40.0, 150.0, length(vCamL - vPosL) * uR));   // POLISH L2: a docked bubble seen from far off is a whole coloured bubble, not an open dome
  // black film reflects almost nothing: a window into the bubble
  // (POLISH L1: clear looking down, so the far inner wall, the garden and the portal's ring show through
  // it; toward the limb it becomes a pale mirror of the garden instead of an opaque black band)
  float fg = fr * fr;
  vec3 bcol = E * (0.03 + 0.9 * fg) + S * 0.25 + uShade * 0.1 * fr + uWhite * 0.3 * fg * fg * fg;
  col = mix(col, bcol, black);
  alpha = mix(alpha, 0.06 + 0.4 * fg, black);
  // silver rim of the black film (blooms a little)
  col += uWhite * rim * (0.5 + 0.5 * refl + 0.3 * clamp(elum, 0.0, 1.0));
  alpha = max(alpha, rim * 0.9);
  alpha = max(alpha, clamp(dot(S, vec3(0.33)), 0.0, 1.0));
#ifdef BS_FROST
  { // fern-shaped ice crystals growing from a dozen seeds, turning slowly with the flow
    float dMin = 1e3, wMin = 0.0, tw = 0.0;
    for (int i = 0; i < 12; i++) {
      vec4 s = uIce[i];
      float rad = s.w;
      vec3 v = d - s.xyz * dot(d, s.xyz);
      float r = length(v) * uR;
      if (rad > 0.5 && r < rad) {
        vec3 tx = normalize(cross(s.xyz, vec3(0.31, 0.2, 0.93)));
        vec3 ty = cross(s.xyz, tx);
        vec2 e = vec2(dot(v, tx), dot(v, ty));
        if (abs(e.x) + abs(e.y) < 1e-7) e = vec2(1e-7, 0.0);
        float az = atan(e.y, e.x) + uIceRot * (mod(float(i), 2.0) * 2.0 - 1.0) + float(i);
        float th = mod(az + 0.5236, 1.0472) - 0.5236;
        float x = r * cos(th), y = r * abs(sin(th));
        float sp = rad * 0.075;
        float w = max(0.07 + 0.3 * (1.0 - x / rad), pxm * 0.75);
        float dd = y;                                                   // the arm
        float xb = max(floor((x - y * 0.577) / sp + 0.5), 1.0) * sp;   // branches leave it at 60 degrees
        float al = (x - xb) * 0.5 + y * 0.866;
        float pr = abs((x - xb) * 0.866 - y * 0.5);
        float len = 0.5 * (rad - xb) * (0.55 + 0.45 * fract(xb / sp * 0.618));
        if (al > 0.0 && al < len) dd = min(dd, pr + 0.12 * al / max(len, 0.01));
        float sb = sp * 0.33, ab = max(floor((al - pr * 0.577) / sb + 0.5), 1.0) * sb;   // barbs on the branches
        float al2 = (al - ab) * 0.5 + pr * 0.866, pr2 = abs((al - ab) * 0.866 - pr * 0.5);
        if (al > 0.0 && ab < len && al2 > 0.0 && al2 < 0.3 * (len - ab)) dd = min(dd, pr2 + 0.1);
        if (dd - w < dMin) { dMin = dd - w; wMin = 1.0 - r / rad; tw = float(i); }
      }
    }
    float ice = 1.0 - smoothstep(-pxm, pxm, dMin);
    float glit = 0.75 + 0.6 * step(0.86, bsNoise(d * 900.0 + tw)) * (0.5 + 0.5 * sin(uTime * 3.0 + tw * 2.0 + dMin * 9.0));
    col = mix(col, uWhite * (0.5 + 0.55 * refl + 0.35 * wMin) * glit + S * 0.5, ice * 0.92);
    alpha = max(alpha, ice * 0.9);
  }
#endif
  // the film just ahead of the burst front brightens to white gold
  if (uHole > 0.0) {
    float k = 1.0 - smoothstep(0.0, 0.04, ahead), k2 = 1.0 - smoothstep(0.0, 0.016, ahead);
    col = col * (1.0 + 1.3 * k) + vec3(1.0, 0.86, 0.55) * ((0.9 + 3.2 * uFlash) * k2 * k2 + 0.25 * uFlash * k);   // POLISH L2: the film ahead of the rim burns in its own colours
    alpha = max(alpha, k);
  }
  if (uBack > 0.5) { col = mix(vec3(dot(col, vec3(0.3, 0.55, 0.15))) * (uShade * 6.0 + 0.3), col, 0.7) * 0.55; alpha = max(alpha, 0.5 * (1.0 - black)) * 0.7; }             // the far inner wall, seen through the near skin
  if (uMirK > 0.0) alpha *= exp(-max(dot(vPosL, uMirN) - uMirH, 0.0) * uMirK);      // a mirror image fades away from the join
  gl_FragColor = vec4(col, clamp(alpha, 0.0, 1.0) * uAlphaK);
  #include <fog_fragment>
}`;

function fill(src, map) { return src.replace(/\$\{(\w+)\}/g, (m, k) => (k in map ? String(map[k]) : m)); }
const GLSL_MAP = { HOLE: HOLE_GLSL, NOISE: NOISE_GLSL, ENV: ENV_GLSL, NV, NS };

// small vector helpers (plain objects kept out of the hot path)
const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
function perp(n) { const a = Math.abs(n.y) < 0.9 ? V3(0, 1, 0) : V3(1, 0, 0); return a.cross(n).normalize(); }
// unit direction at angular distance `ang` from axis n, azimuth `az` in n's tangent frame (tx, ty)
function around(n, tx, ty, ang, az, out = V3()) {
  const s = Math.sin(ang), c = Math.cos(ang);
  return out.set(0, 0, 0).addScaledVector(n, c).addScaledVector(tx, s * Math.cos(az)).addScaledVector(ty, s * Math.sin(az)).normalize();
}

// A unit sphere as six warped grids (n by n quads to a face), filled straight into typed arrays: the
// film shaders read only `position`, and this takes a millisecond or two where a subdivided
// icosahedron of the same density holds the page for a quarter of a second.
export function makeSphereGeo(n) {
  const m = n + 1, pos = new Float32Array(6 * m * m * 3), idx = new Uint32Array(6 * n * n * 6);
  const F = [[0, 1, 2, 1], [0, 1, 2, -1], [1, 2, 0, 1], [1, 2, 0, -1], [2, 0, 1, 1], [2, 0, 1, -1]];
  let k = 0;
  for (let f = 0; f < 6; f++) {
    const [ua, va, wa, sg] = F[f], base = f * m * m;
    for (let j = 0; j < m; j++) {
      const b = Math.tan((j / n * 2 - 1) * Math.PI / 4);
      for (let i = 0; i < m; i++) {
        const a = Math.tan((i / n * 2 - 1) * Math.PI / 4), l = 1 / Math.sqrt(a * a + b * b + 1), o = (base + j * m + i) * 3;
        pos[o + ua] = a * l; pos[o + va] = b * l; pos[o + wa] = sg * l;
      }
    }
    for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
      const p0 = base + j * m + i, p1 = p0 + 1, p2 = p0 + m, p3 = p2 + 1;
      if (sg > 0) { idx[k++] = p0; idx[k++] = p1; idx[k++] = p3; idx[k++] = p0; idx[k++] = p3; idx[k++] = p2; }
      else { idx[k++] = p0; idx[k++] = p3; idx[k++] = p1; idx[k++] = p0; idx[k++] = p2; idx[k++] = p3; }
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setIndex(new THREE.BufferAttribute(idx, 1));
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1.02);
  return g;
}

export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng.fork ? ctx.rng.fork('bubble-skin-hero') : ctx.rng;
  const pal = (opts.palette && opts.palette.length >= 7) ? opts.palette : DEFAULT_PALETTE;
  const R = opts.radius ?? 300;
  const duration = opts.duration ?? 40;
  let burstU = opts.burstU ?? 0.8125;
  const age = opts.age ?? rng.range(0.25, 0.85);
  const nSat = opts.satellites ?? 1;

  // ---- frames -------------------------------------------------------------------------------
  const UP = V3(0, 1, 0);
  const sunDir = (opts.sunDir ? opts.sunDir.clone() : V3(rng.range(-0.12, 0.12), Math.sin(50 * Math.PI / 180), Math.cos(50 * Math.PI / 180))).normalize();
  const sunAz = Math.atan2(sunDir.x, sunDir.z);
  const poleTilt = rng.range(26, 34) * Math.PI / 180;
  // world-ish frame about the top: az 0 = toward the sun
  const topX = V3(Math.sin(sunAz), 0, Math.cos(sunAz)), topY = V3().crossVectors(UP, topX).normalize();
  const dirTop = (colatDeg, az, out) => around(UP, topX, topY, colatDeg * Math.PI / 180, az, out);
  const Pdir = dirTop(poleTilt * 180 / Math.PI, 0);
  const Px = perp(Pdir), Py = V3().crossVectors(Pdir, Px).normalize();
  const satAz = Math.PI - rng.range(0.2, 0.5) * rng.sign();
  const satSide = satAz > Math.PI ? -1 : 1;
  const satDir = dirTop(25, satAz);
  const satR = rng.range(40, 50);
  const satDist = R + satR * rng.range(0.4, 0.52);

  // ---- the route (flown and tuned by the world coder) ---------------------------------------------
  // One long sweep round the summit: in along the 55 degree parallel on the shaded side, upslope
  // across the vortex street, round the satellite's upper flank, on round the top and diagonally
  // down the sunward shoulder at P; pull up as the cap fails, crest above P, dive 60 degrees.
  const CEN = V3(0, R, 0);
  const skin = (colatDeg, az, alt) => dirTop(colatDeg, az).multiplyScalar(R + alt).add(CEN);
  const polePt = Pdir.clone().multiplyScalar(R).add(CEN);
  const satWorld = satDir.clone().multiplyScalar(satDist).add(CEN);
  const tUp = UP.clone().addScaledVector(satDir, -UP.dot(satDir)).normalize();
  const tSide = dirTop(25, satAz + satSide * 0.4); tSide.addScaledVector(satDir, -tSide.dot(satDir)).addScaledVector(tUp, -tSide.dot(tUp)).normalize();
  const satPt = (x, y, alt) => satDir.clone().multiplyScalar(R).addScaledVector(tSide, x).addScaledVector(tUp, y).normalize().multiplyScalar(R + alt).add(CEN);
  const kAz = (k) => satAz + satSide * k;                      // azimuth k radians round from the satellite, entry side positive
  const pAz = (a) => satSide * a;                              // azimuth a radians short of P on the arriving side
  const joinPt = skin(13.5, pAz(1.1), 27);
  const hA = V3(polePt.x - joinPt.x, 0, polePt.z - joinPt.z).normalize();          // final horizontal heading
  const E = (a, b) => polePt.clone().addScaledVector(hA, a).addScaledVector(UP, b);
  const hug = (a, alt) => E(a, 0).sub(CEN).normalize().multiplyScalar(R + alt).add(CEN);
  const ringN = UP.clone().multiplyScalar(0.866).addScaledVector(hA, -0.5).normalize();   // faces the diving camera
  const seat = E(10, -17.32);
  const satRing = (deg, off, alt) => satPt((satR + off) * Math.cos(deg * Math.PI / 180), (satR + off) * Math.sin(deg * Math.PI / 180), alt);
  const flank = satRing(80, 9, 23);
  // the entry flies level and 32 degrees into the hillside, so the film fills most of the first frame
  const in1 = skin(41.5, kAz(1.9), 21), in2 = skin(37, kAz(1.66), 16.5);        // POLISH L1: the run-in is 100 m shorter
  const inAxis = V3(-in1.x, 0, -in1.z).normalize(), inPar = V3(in2.x - in1.x, 0, in2.z - in1.z);
  inPar.addScaledVector(inAxis, -inPar.dot(inAxis)).normalize();
  const in0 = in1.clone().addScaledVector(inPar, -62 * Math.cos(0.56)).addScaledVector(inAxis, -62 * Math.sin(0.56)).addScaledVector(UP, -2);
  const flyThrough = [
    in0, in1, in2,                                                                         // level entry, the hillside rising to meet us
    skin(35, kAz(1.42), 13.5), skin(34.5, kAz(1.2), 12),                                     // along the 55 degree parallel
    skin(31, kAz(0.85), 12), skin(26, kAz(0.56), 12),                                      // sink and curve upslope across the vortex street
    satRing(35, 14, 17), flank.clone(),                                                    // round the satellite's upper flank
    skin(12, pAz(2.0), 29), joinPt,                                                         // round the summit, skin level beneath
    hug(-100, 18),                                                                          // into the black-film country; the cap fails
    E(-40, 31), E(-27.5, 30),                                                         // the ground falls away; crest above P, tip over
    E(-16, 27.71), E(-3, 5.2), seat.clone(),                                                // straight dive at 60 degrees
  ];
  if (opts.burstU == null) {                                    // the cap fails when the camera is ~100 m from P
    const fp = makePath(flyThrough), q = V3();
    let u = 1; while (u > 0.5 && fp.pointAt(u, q).distanceTo(polePt) < 100) u -= 0.002;
    burstU = u;
  }
  await ctx.yield?.();

  const C = (h) => new THREE.Color(h);
  const envU = {
    uSun: { value: sunDir }, uSunCol: { value: C(opts.sunColor || '#fff6e4') },
    uShade: { value: C(pal[0]) }, uLeaf: { value: C(pal[5]) }, uWhite: { value: C(pal[4]) },
    uWall: { value: V3() }, uWallX: { value: V3() }, uWin: { value: V3() }, uWinX: { value: V3() },
    uTime: { value: 0 }, uEnvWin: { value: 1 }, uWinS: { value: 1 }, uEnvWall: { value: new THREE.Vector2(1, 0) },
    uLampC: { value: V3(0, 0.5, 1) }, uLampX: { value: V3(1, 0, 0) }, uLampCol: { value: C(opts.lampColor || '#ffb060') }, uLampK: { value: opts.lamps ? 1 : 0 },
  };
  { // wall low on one side, bright window high on the sun side but off the sun
    const wAz = sunAz + rng.sign() * rng.range(1.5, 2.2);
    envU.uWall.value.set(Math.sin(wAz) * 0.97, -0.02, Math.cos(wAz) * 0.97).normalize();
    envU.uWallX.value.copy(perp(envU.uWall.value));
    const bAz = sunAz - Math.sign(Math.sin(wAz - sunAz)) * rng.range(0.55, 0.85);
    envU.uWin.value.set(Math.sin(bAz) * 0.8, 0.6, Math.cos(bAz) * 0.8).normalize();
    envU.uWinX.value.copy(perp(envU.uWin.value));
    // the string of lights hangs across the sunward side, a little off the sun's azimuth
    const lAz = sunAz + Math.sign(Math.sin(wAz - sunAz)) * 0.25;
    envU.uLampC.value.set(Math.sin(lAz) * 0.8, 0.52, Math.cos(lAz) * 0.8).normalize();
    envU.uLampX.value.set(Math.cos(lAz), 0, -Math.sin(lAz));
  }
  const holeU = { uHole: { value: 0 }, uLobe: { value: V3(rng.range(0, 6.28), rng.range(0, 6.28), rng.range(0, 6.28)) }, uP: { value: Pdir }, uPx: { value: Px }, uPy: { value: Py } };
  const ramp = makeRamp(pal, rng);

  // ---- vortices: six in a street on the shaded side, three planet-scale, five scattered ---------
  const vort = [], vortS = [], street = [];
  const tmp = V3();
  for (let i = 0; i < 6; i++) {
    const az = satAz + satSide * (0.28 + i * 0.2) + rng.range(-0.03, 0.03);
    const d = dirTop(31 + (i % 2 ? 4.5 : -3.5) + rng.range(-1.5, 1.5), az);
    const rad = rng.range(0.075, 0.125);
    vort.push(new THREE.Vector4(d.x, d.y, d.z, rad)); vortS.push((i % 2 ? -1 : 1) * rng.range(9.0, 12.0));
    street.push(d.clone().multiplyScalar(R).add(V3(0, R, 0)));
  }
  for (let i = 0; i < 3; i++) {
    const d = dirTop(rng.range(55, 125), rng.range(0, 6.28));
    vort.push(new THREE.Vector4(d.x, d.y, d.z, rng.range(0.3, 0.5))); vortS.push(rng.sign() * rng.range(1.6, 2.6));
  }
  for (let i = 0; i < 5; i++) {
    const d = i < 2 ? around(Pdir, Px, Py, rng.range(0.35, 0.6), rng.range(0, 6.28)) : dirTop(rng.range(20, 140), rng.range(0, 6.28));
    vort.push(new THREE.Vector4(d.x, d.y, d.z, rng.range(0.1, 0.2))); vortS.push(rng.sign() * rng.range(2.6, 4.2));
  }
  // POLISH L1C: the two swirls of the entry hillside, where the street of storms begins (the opening image). They are
  // swirls of their own, numbers NVD and NVD + 1; the five scattered ones above keep the seats their draws gave them.
  // Seats in metres on the film from the route's own knots (so they follow the track on every seed):
  //   the hook: its eye 6 m upslope of the foot of in2, the knot where the level run-in meets the hillside: on the uphill
  //     side of the track, and nearer to it than the lens is high there (16.5 m), so we come at it along the run-in and
  //     pass over its eye. Radius 45 m, the width of one contour band (40 to 50 m), so one band winds once round the eye;
  //   the counter-turning one: its eye one radius of its own (25.5 m, a street vortex's size: those are 22 to 37 m)
  //     downslope of the foot of the next knot, so the track runs along its upper rim; that puts it 49 m from the hook's
  //     eye, just outside the hook's radius, the two turning against each other like gears.
  // Their strengths (set at the end of the build, from the fork 'entry-swirls') are 0 until then.
  const hillDir = (knot, upslope) => {                           // the film under a knot, carried `upslope` metres toward the summit
    const n = knot.clone().sub(CEN).normalize(), s = UP.clone().addScaledVector(n, -UP.dot(n)).normalize();
    return n.multiplyScalar(Math.cos(upslope / R)).addScaledVector(s, Math.sin(upslope / R)).normalize();
  };
  const HOOK_R = 45, COUNTER_R = 25.5;                            // metres
  { const a = hillDir(flyThrough[2], 6), b = hillDir(flyThrough[3], -COUNTER_R);
    vort.push(new THREE.Vector4(a.x, a.y, a.z, HOOK_R / R), new THREE.Vector4(b.x, b.y, b.z, COUNTER_R / R)); vortS.push(0, 0); }
  let dealEntryPollen = null;                                    // set by the pollen block, called once the fork exists

  // ---- black spots: born as pinpricks, grow, drift to P, merge -----------------------------------
  // The far ones are laid along the ground the camera flies over on its way from the summit to P, so
  // the black-film country is under us from u 0.6, not only at the pole.
  const spotU = [], spots = [];
  const routeP = makePath(flyThrough), routeQ = V3(), routeT = V3(), routeL = V3();
  for (let i = 0; i < NS; i++) {
    spotU.push(new THREE.Vector4(0, 1, 0, -1e3));
    if (i === 0) { spots.push({ cap: true }); continue; }
    const near = i < 12;
    const s = {
      az: rng.range(0, 6.28), dAz: rng.range(-0.5, 0.5),
      ang: near ? rng.range(0.12, 0.38) : rng.range(0.3, 1.1),
      born: (near ? rng.range(-14, 12) : rng.range(-14, 8)) - age * 8,
      rmax: (near ? rng.range(14, 30) : rng.range(8, 20)) * (0.75 + 0.5 * age),
    };
    if (!near && i < 24) {                     // twelve along the route, to either side of the track
      const u = 0.55 + (burstU - 0.04 - 0.55) * ((i - 12 + s.az / 6.28) / 12);
      routeP.pointAt(u, routeQ); routeP.tangentAt(u, routeT);
      const out = routeQ.clone().sub(CEN).normalize();
      routeL.crossVectors(routeT, out).normalize();
      // three sizes in turn (a large one that will merge, a middling one, a small one) and a
      // wider scatter, so colour film is left between them as islands and channels
      const big = (i % 3) === 0, small = (i % 3) === 2;
      const side = (i % 2 ? 1 : -1) * ((big ? 26 : 12) + 95 * Math.abs(s.dAz) + (small ? 10 : 0));
      s.dir = routeQ.clone().addScaledVector(routeL, side).sub(CEN).normalize();
      s.rmax *= big ? 1.45 : (small ? 0.55 : 0.9);
      // born when the camera is still some seconds short of it: a pinprick as it comes into view, grown
      // as we pass (the black country is not spent in the opening frame); an old film is further along
      s.grow = big ? 11 : 8;
      s.born = u * duration - (big ? 10.5 : 7) + (s.born + age * 8 + 3) * 0.22 - age * 3;
    } else if (!near) {
      s.born = 10 + (s.born + age * 8 + 14) * 0.5 - age * 2;     // the outliers open during the flight too, after the opening image
    }
    spots.push(s);
  }
  function placeSpots(t) {
    const tb = burstU * duration;
    const capR = (40 + 40 * age) + (22 + 26 * age) * smoothstep(-5, tb, t);
    spotU[0].set(Pdir.x, Pdir.y, Pdir.z, capR);
    for (let i = 1; i < NS; i++) {
      const s = spots[i], k = clamp((t - s.born) / (s.grow || 14), 0, 1);
      if (k <= 0) { spotU[i].w = -1e3; continue; }
      const drift = smoothstep(s.born, tb + 2, t);
      if (s.dir) tmp.copy(s.dir).lerp(Pdir, 0.3 * drift).normalize();
      else around(Pdir, Px, Py, s.ang * (1 - 0.5 * drift) + 0.01, s.az + s.dAz * drift, tmp);
      spotU[i].set(tmp.x, tmp.y, tmp.z, s.rmax * Math.sqrt(k) * (0.6 + 0.4 * k));
    }
  }

  await ctx.yield?.();

  // ---- film materials ---------------------------------------------------------------------------
  const seedOff = V3(rng.range(0, 40), rng.range(0, 40), rng.range(0, 40));
  // frost variant: a dozen ice seeds (direction, radius in metres) whose ferns grow with progress
  const frost = !!opts.frost, iceU = [], ice = [];
  { const ir = rng.fork ? rng.fork('ice') : rng;
    for (let i = 0; i < 12; i++) {
      const d = i < 5 ? dirTop(ir.range(20, 42), kAz(ir.range(-0.3, 2.0))) : (i < 9 ? around(Pdir, Px, Py, ir.range(0.15, 0.7), ir.range(0, 6.28)) : dirTop(ir.range(4, 60), ir.range(0, 6.28)));
      iceU.push(new THREE.Vector4(d.x, d.y, d.z, 0)); ice.push({ born: ir.range(-0.5, 0.35), rmax: ir.range(34, 78) });
    } }
  function filmUniforms(extra) {
    return Object.assign(THREE.UniformsUtils.merge([THREE.UniformsLib.fog]), envU, holeU, {
      uRamp: { value: ramp }, uR: { value: R }, uBack: { value: 0 }, uThin: { value: 0.3 }, uSpan: { value: 5 },
      uNs: { value: 3.2 }, uRot: { value: 0 }, uFlash: { value: 0 }, uGain: { value: 1 }, uClipR: { value: 0 }, uClipC: { value: V3() },
      uShearT: { value: 0.5 }, uFlow: { value: V3(0, 0.5, 1) }, uSeedOff: { value: seedOff }, uAlpha0: { value: 0.68 }, uSpotT: { value: 0 }, uFine: { value: 1 }, uBand: { value: 0.52 }, uBandF: { value: 96 }, uSolid: { value: 0 }, uAlphaK: { value: 1 }, uMirK: { value: 0 }, uMirH: { value: 0 }, uMirN: { value: V3(0, 1, 0) },
      uWob: { value: 1 / R }, uPhase: { value: 0 }, uTimeV: { value: 0 }, uLift: { value: 2.2 / R },
      uVort: { value: vort }, uVortS: { value: vortS }, uSpot: { value: spotU }, uIce: { value: iceU }, uIceRot: { value: 0 },
    }, extra || {});
  }
  const filmVS = fill(FILM_VERT, GLSL_MAP), filmFS = fill(FILM_FRAG, GLSL_MAP);
  function filmMaterial(uniforms, back, full = true) {
    return new THREE.ShaderMaterial({
      uniforms, vertexShader: filmVS, fragmentShader: filmFS, defines: full ? (frost ? { BS_FULL: 1, BS_FROST: 1 } : { BS_FULL: 1 }) : {},
      side: back ? THREE.BackSide : THREE.FrontSide, transparent: true, depthWrite: false, fog: true,
    });
  }

  const object = new THREE.Group(); object.name = 'bubble-skin-hero';
  const pivot = new THREE.Group(); pivot.position.set(0, R, 0); object.add(pivot);   // bubble centre

  // main planet: one icosphere drawn twice (far inner wall, then the near skin)
  await ctx.yield?.();
  const sphereGeo = makeSphereGeo(60);
  await ctx.yield?.();
  const mainU = filmUniforms();
  const mainBackU = Object.assign({}, mainU, { uBack: { value: 1 } });
  const mainBack = new THREE.Mesh(sphereGeo, filmMaterial(mainBackU, true));
  const mainFront = new THREE.Mesh(sphereGeo, filmMaterial(mainU, false));
  for (const m of [mainBack, mainFront]) { m.scale.setScalar(R); m.frustumCulled = false; pivot.add(m); }
  mainBack.renderOrder = 1; mainFront.renderOrder = 6;
  await ctx.yield?.();

  // satellite bubble: same film, own phase, clipped where it is inside the planet while docked
  const satCenter = satDir.clone().multiplyScalar(satDist);
  let sat = null;
  if (nSat > 0) {
    const sv = [], ss = [];
    for (let i = 0; i < NVD; i++) {
      const d = around(UP, V3(1, 0, 0), V3(0, 0, 1), rng.range(0.3, 2.6), rng.range(0, 6.28));
      sv.push(new THREE.Vector4(d.x, d.y, d.z, i < 5 ? rng.range(0.35, 0.7) : 0.001)); ss.push(i < 5 ? rng.sign() * rng.range(2.5, 4.5) : 0);
    }
    for (let i = NVD; i < NV; i++) { sv.push(new THREE.Vector4(0, 1, 0, 0.001)); ss.push(0); }   // the shader's array is NV long; the satellite has no entry swirls (no draw)
    const sp = []; for (let i = 0; i < NS; i++) sp.push(new THREE.Vector4(0, 1, 0, -1e3));
    const sP = satDir.clone().lerp(UP, 0.5).normalize(), sPx = perp(sP), sPy = V3().crossVectors(sP, sPx);
    const sU = filmUniforms({
      uHole: { value: 0 }, uP: { value: sP }, uPx: { value: sPx }, uPy: { value: sPy }, uLobe: { value: V3() },
      uR: { value: satR }, uThin: { value: 0.55 }, uSpan: { value: 2.3 }, uNs: { value: 2.1 }, uBandF: { value: 34 }, uBand: { value: 0.42 }, uWob: { value: 0.012 }, uPhase: { value: 1.7 },
      uSeedOff: { value: V3(rng.range(0, 40), rng.range(0, 40), rng.range(0, 40)) }, uShearT: { value: 1.4 },
      uFlow: { value: V3(0, 0.5, 1) }, uRot: { value: 0 }, uLift: { value: 0 }, uGain: { value: 1.38 }, uAlpha0: { value: 0.72 }, uFine: { value: 0.15 }, uSolid: { value: 0.93 },
      uClipC: { value: satCenter.clone().multiplyScalar(-1 / satR) }, uClipR: { value: R / satR },
      uVort: { value: sv }, uVortS: { value: ss }, uSpot: { value: sp },
      uIce: { value: iceU.map(() => new THREE.Vector4(0, 1, 0, 0)) },
    });
    const sBU = Object.assign({}, sU, { uBack: { value: 1 } });
    const sGeo = makeSphereGeo(22);
    const sb = new THREE.Mesh(sGeo, filmMaterial(sBU, true)), sf = new THREE.Mesh(sGeo, filmMaterial(sU, false));
    const grp = new THREE.Group(); grp.position.copy(satCenter);
    for (const m of [sb, sf]) { m.scale.setScalar(satR); m.frustumCulled = false; grp.add(m); }
    sb.renderOrder = 3; sf.renderOrder = 4;
    pivot.add(grp);
    // POLISH L2: the planet's film mirrors the docked dome, so it rests on a reflecting skin ("doubled in both
    // skins") instead of reading as geometry cut off at the ridge: the same sphere, reflected in the plane of the join
    const x0m = (satDist * satDist + R * R - satR * satR) / (2 * satDist);
    const mU = Object.assign({}, sU, { uAlphaK: { value: 0.3 }, uSolid: { value: 0 }, uAlpha0: { value: 0.5 }, uMirK: { value: 3.2 }, uMirH: { value: (x0m - satDist) / satR }, uMirN: { value: satDir.clone() } });
    const mir = new THREE.Mesh(sGeo, filmMaterial(mU, false));
    { const n = satDir, M = new THREE.Matrix4().set(
        1 - 2 * n.x * n.x, -2 * n.x * n.y, -2 * n.x * n.z, 2 * x0m * n.x,
        -2 * n.y * n.x, 1 - 2 * n.y * n.y, -2 * n.y * n.z, 2 * x0m * n.y,
        -2 * n.z * n.x, -2 * n.z * n.y, 1 - 2 * n.z * n.z, 2 * x0m * n.z, 0, 0, 0, 1);
      mir.matrixAutoUpdate = false; mir.matrix.copy(M).multiply(new THREE.Matrix4().makeTranslation(satCenter.x, satCenter.y, satCenter.z)).multiply(new THREE.Matrix4().makeScale(satR, satR, satR)); }
    mir.frustumCulled = false; mir.renderOrder = 2.5; pivot.add(mir);
    sat = { grp, mir, mU, joinC: satDir.clone().multiplyScalar(x0m).add(V3(0, R, 0)), U: sU, colat: Math.acos(clamp(satDir.dot(Pdir), -1, 1)), drift: satDir.clone().lerp(UP, 0.35).normalize(), free: 0 };
  }
  mainFront.renderOrder = 2;
  if (sat) { mainU.uClipC.value.copy(satCenter).multiplyScalar(1 / R); mainU.uClipR.value = satR / R; }

  // shared small uniforms
  const viewU = { uPxK: { value: 0.003 }, uTimeV: { value: 0 }, uS: { value: -1 }, uFlash: { value: 0 }, uR: { value: R } };
  const fogU = () => THREE.UniformsUtils.merge([THREE.UniformsLib.fog]);
  // metres covered by one pixel at view depth z (uPxK = 2 / drawing-buffer height)
  const PX_GLSL = 'uniform float uPxK;\nfloat bsPx(float z){ return max(-z, 0.1) * uPxK / max(projectionMatrix[1][1], 0.05); }\n';

  await ctx.yield?.();

  // ---- the bright ridge where the two films meet ---------------------------------------------------
  let ridge = null;
  if (sat) {
    const x0 = (satDist * satDist + R * R - satR * satR) / (2 * satDist), rho = Math.sqrt(Math.max(1, R * R - x0 * x0));
    const ex = perp(satDir), ey = V3().crossVectors(satDir, ex);
    const SEG = 192, CS = 6, pos = [], nrm = [], idx = [];
    for (let i = 0; i <= SEG; i++) {
      const a = (i / SEG) * Math.PI * 2;
      const rad = V3().addScaledVector(ex, Math.cos(a)).addScaledVector(ey, Math.sin(a));
      const c = satDir.clone().multiplyScalar(x0).addScaledVector(rad, rho);
      for (let j = 0; j < CS; j++) {
        const b = (j / CS) * Math.PI * 2;
        const n = rad.clone().multiplyScalar(Math.cos(b)).addScaledVector(satDir, Math.sin(b));
        pos.push(c.x, c.y, c.z); nrm.push(n.x, n.y, n.z);
        if (i < SEG) { const p = i * CS + j, q = i * CS + (j + 1) % CS; idx.push(p, p + CS, q, q, p + CS, q + CS); }
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(nrm, 3));
    g.setIndex(idx);
    const m = new THREE.ShaderMaterial({
      uniforms: Object.assign(fogU(), { uPxK: viewU.uPxK, uTimeV: viewU.uTimeV, uCol: { value: C(pal[4]) }, uGold: { value: C(pal[3]) }, uMag: { value: C(pal[1]) }, uFade: { value: 1 }, uRc: { value: satDir.clone().multiplyScalar(x0) } }),
      vertexShader: `#include <fog_pars_vertex>\n${PX_GLSL}
        uniform float uTimeV; uniform vec3 uRc; varying vec3 vN; varying vec3 vV; varying float vA; varying float vF;
        void main(){ vec4 mc = modelViewMatrix * vec4(position, 1.0);
          float r = max(0.4 * (1.0 + 0.25 * sin(position.x * 0.9 + position.z * 0.7 + uTimeV * 1.3)), bsPx(mc.z) * 1.3);
          vec4 mvPosition = modelViewMatrix * vec4(position + normal * r, 1.0);
          vN = normalize(normalMatrix * normal); vV = normalize(-mvPosition.xyz); vA = position.x + position.y * 1.3 + position.z * 0.7;
          // POLISH L2: the far arc of the join, seen through the dome, is faint: the near arc is the line the dome stands on
          vec3 radW = normalize(mat3(modelMatrix) * (position - uRc)), toC = normalize(cameraPosition - (modelMatrix * vec4(position, 1.0)).xyz + vec3(0.0, 1e-4, 0.0));
          vF = mix(0.1, 1.0, smoothstep(-0.3, 0.15, dot(radW, toC))) * mix(1.0, 0.4, smoothstep(70.0, 230.0, -mc.z));
          gl_Position = projectionMatrix * mvPosition;
          #include <fog_vertex>
        }`,
      fragmentShader: `#include <fog_pars_fragment>
        uniform vec3 uCol, uGold, uMag; uniform float uFade, uTimeV; varying vec3 vN; varying vec3 vV; varying float vA; varying float vF;
        void main(){ float f = abs(dot(normalize(vN), normalize(vV)));
          vec3 tintc = mix(uGold, uMag, smoothstep(-0.3, 0.6, sin(vA * 0.11 + uTimeV * 0.4)) * 0.6);   // a meniscus line carrying the film's colours
          vec3 c = mix(tintc * 0.9, mix(uCol, tintc, 0.3) * 1.3, 0.35 + 0.65 * f * f) * (0.85 + 0.15 * sin(vA * 0.35));
          float ff = uFade * clamp(vF, 0.0, 1.0);
          gl_FragColor = vec4(c * ff, ff);
          #include <fog_fragment>
        }`,
      transparent: true, depthWrite: false, fog: true,
    });
    ridge = new THREE.Mesh(g, m); ridge.frustumCulled = false; ridge.renderOrder = 5; pivot.add(ridge);
  }

  // ---- the rolled rim that rides the burst front --------------------------------------------------
  const rimU = Object.assign(fogU(), holeU, { uPxK: viewU.uPxK, uTimeV: viewU.uTimeV, uFlash: viewU.uFlash, uR: viewU.uR, uRimR: { value: 1 }, uGold: { value: C(pal[3]) } });
  {
    const SEG = 512, CS = 6, a = [], idx = [], pos = [];
    for (let i = 0; i <= SEG; i++) for (let j = 0; j < CS; j++) {
      a.push((i / SEG) * Math.PI * 2 - Math.PI, (j / CS) * Math.PI * 2); pos.push(0, 0, 0);
      if (i < SEG) { const p = i * CS + j, q = i * CS + (j + 1) % CS; idx.push(p, p + CS, q, q, p + CS, q + CS); }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('aRim', new THREE.Float32BufferAttribute(a, 2));
    g.setIndex(idx);
    const m = new THREE.ShaderMaterial({
      uniforms: rimU,
      vertexShader: `#include <fog_pars_vertex>\n${PX_GLSL}${HOLE_GLSL}
        attribute vec2 aRim; uniform float uTimeV, uR, uRimR; varying vec3 vN; varying vec3 vV; varying float vK;
        void main(){
          float az = aRim.x, th = bsFrontAz(az);
          float live = step(1e-4, uHole) * step(th, 3.3);
          th = min(th, 3.1416);
          vec3 e = uPx * cos(az) + uPy * sin(az);
          vec3 dir = uP * cos(th) + e * sin(th), tng = -uP * sin(th) + e * cos(th);
          float bead = 0.5 + 0.5 * sin(az * 61.0 + uTimeV * 11.0) * sin(az * 23.0 - uTimeV * 5.0);
          float rr = uRimR * (0.65 + 0.9 * bead);
          vec3 c = dir * (uR + rr * 0.4);
          vec4 mc = modelViewMatrix * vec4(c, 1.0);
          rr = max(rr, bsPx(mc.z) * 1.5) * live;
          vec3 n = dir * cos(aRim.y) + tng * sin(aRim.y);
          vec4 mvPosition = modelViewMatrix * vec4(c + n * rr, 1.0);
          vN = normalize(normalMatrix * n); vV = normalize(-mvPosition.xyz); vK = bead;
          gl_Position = live > 0.5 ? projectionMatrix * mvPosition : vec4(2.0, 2.0, 2.0, 1.0);
          #include <fog_vertex>
        }`,
      fragmentShader: `#include <fog_pars_fragment>
        uniform vec3 uGold; uniform float uFlash; varying vec3 vN; varying vec3 vV; varying float vK;
        void main(){ float f = abs(dot(normalize(vN), normalize(vV)));
          vec3 c = mix(uGold * 1.6, vec3(1.0, 0.96, 0.86) * 3.4, 0.25 + 0.75 * f * f) * (0.8 + 0.6 * vK) * (1.0 + 1.6 * uFlash);
          gl_FragColor = vec4(c, 1.0);
          #include <fog_fragment>
        }`,
      fog: true,
    });
    const rim = new THREE.Mesh(g, m); rim.frustumCulled = false; rim.renderOrder = 8; pivot.add(rim);
  }
  await ctx.yield?.();

  // ---- pollen rafts riding the flow (closed-form orbits in the vertex shader) -------------------------
  const detail = ctx.quality?.detail ?? 1;
  {
    // POLISH L1C: after the hero's own grains, three rafts of six for each entry swirl (ENTRY_GRAINS slots, filled from the
    // swirls' own fork at the end of the build), so the hook keeps pollen wound into it now that the rafts the hero's
    // law deals to vortices 12 and 13 ride those two where their draws put them
    const ENTRY_RAFTS = 3, RAFT_GRAINS = 6, ENTRY_GRAINS = 2 * ENTRY_RAFTS * RAFT_GRAINS;
    const N0 = Math.round(800 * detail), N = N0 + ENTRY_GRAINS, ax = new Float32Array(N * 3), bs = new Float32Array(N * 4), w = new Float32Array(N * 2);
    const d = V3(), raftC = V3(), rx = V3(), ry = V3();
    let left = 0, axis = Pdir, omega = 0;
    dealEntryPollen = (er) => {
      // the hero's own raft law (grains 3.6 m about a raft's centre, turning with their vortex, faster toward its eye), with one
      // raft in each third of the law's band of 0.25 to 1.5 radii: inner, middle and outer, the least that shows the eye
      // turning faster than the rim
      let i = N0;
      for (let k = 0; k < 2; k++) {
        const v = vort[NVD + k], sg = Math.sign(vortS[NVD + k]) || 1, eye = V3(v.x, v.y, v.z), ex = perp(eye), ey = V3().crossVectors(eye, ex);
        for (let j = 0; j < ENTRY_RAFTS; j++) {
          const ang = v.w * (0.25 + (j + er()) * 1.25 / ENTRY_RAFTS);
          around(eye, ex, ey, ang, er.range(0, 6.28), raftC);
          const om = sg * 0.3 * Math.exp(-(ang * ang) / (v.w * v.w)) + 0.02 * sg;
          rx.copy(perp(raftC)); ry.crossVectors(raftC, rx);
          for (let n = 0; n < RAFT_GRAINS; n++, i++) {
            d.copy(raftC).addScaledVector(rx, er.gauss() * 0.012).addScaledVector(ry, er.gauss() * 0.012).normalize();
            ax.set([eye.x, eye.y, eye.z], i * 3); bs.set([d.x, d.y, d.z, er.range(0.45, 1.05)], i * 4);
            w.set([om * er.range(0.92, 1.08), er()], i * 2);
          }
        }
      }
      for (const name of ['aAxis', 'aBase', 'aW']) g.attributes[name].needsUpdate = true;   // filled after the geometry was made
    };
    for (let i = 0; i < N0; i++) {
      if (left <= 0) {
        left = rng.int(3, 9);
        const vi = rng.chance(0.62) ? rng.int(0, 5 + (rng.chance(0.3) ? 8 : 0)) : -1;
        if (vi >= 0) {
          const v = vort[vi]; axis = V3(v.x, v.y, v.z);
          const ang = v.w * rng.range(0.25, 1.5);
          around(axis, perp(axis), V3().crossVectors(axis, perp(axis)), ang, rng.range(0, 6.28), raftC);
          omega = Math.sign(vortS[vi]) * 0.3 * Math.exp(-(ang * ang) / (v.w * v.w)) + 0.02 * Math.sign(vortS[vi]);
        } else {
          axis = Pdir; around(Pdir, Px, Py, rng.range(0.25, 1.5), rng.range(0, 6.28), raftC);
          omega = 0.017 + rng.range(-0.008, 0.012);
        }
        rx.copy(perp(raftC)); ry.crossVectors(raftC, rx);
      }
      left--;
      d.copy(raftC).addScaledVector(rx, rng.gauss() * 0.012).addScaledVector(ry, rng.gauss() * 0.012).normalize();
      ax.set([axis.x, axis.y, axis.z], i * 3); bs.set([d.x, d.y, d.z, rng.range(0.45, 1.05)], i * 4);
      w.set([omega * rng.range(0.92, 1.08), rng()], i * 2);
    }
    const g = new THREE.InstancedBufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3)); g.setIndex([0, 1, 2, 0, 2, 3]);
    g.setAttribute('aAxis', new THREE.InstancedBufferAttribute(ax, 3)); g.setAttribute('aBase', new THREE.InstancedBufferAttribute(bs, 4));
    g.setAttribute('aW', new THREE.InstancedBufferAttribute(w, 2)); g.instanceCount = N;
    const m = new THREE.ShaderMaterial({
      uniforms: Object.assign(fogU(), holeU, { uPxK: viewU.uPxK, uTimeV: viewU.uTimeV, uR: viewU.uR, uGold: { value: C(pal[3]) }, uWhite: envU.uWhite }),
      vertexShader: `#include <fog_pars_vertex>\n${PX_GLSL}${HOLE_GLSL}
        attribute vec3 aAxis; attribute vec4 aBase; attribute vec2 aW; uniform float uTimeV, uR; varying vec2 vUv; varying float vS;
        void main(){
          float ang = aW.x * uTimeV, c = cos(ang), s = sin(ang);
          vec3 d = aBase.xyz * c + cross(aAxis, aBase.xyz) * s + aAxis * dot(aAxis, aBase.xyz) * (1.0 - c);
          float live = uHole > 0.0 ? step(0.0, bsAhead(d)) : 1.0;
          vec4 mvPosition = modelViewMatrix * vec4(d * (uR + 0.35), 1.0);
          float sz = max(aBase.w, bsPx(mvPosition.z) * 1.15) * live;
          mvPosition.xy += position.xy * sz;
          vUv = position.xy; vS = aW.y;
          gl_Position = projectionMatrix * mvPosition;
          #include <fog_vertex>
        }`,
      fragmentShader: `#include <fog_pars_fragment>
        uniform vec3 uGold, uWhite; varying vec2 vUv; varying float vS;
        void main(){ float r = length(vUv); if (r > 1.0) discard;
          float core = 1.0 - smoothstep(0.3, 0.42, r);
          float halo = smoothstep(1.0, 0.55, r) * smoothstep(0.35, 0.6, r);
          float glint = 1.0 - smoothstep(0.0, 0.16, length(vUv - vec2(-0.1, 0.12)));
          vec3 c = mix(uGold, uWhite, 0.35 + 0.3 * vS) * (1.1 * core + 0.3 * halo) + uWhite * glint * 1.6;
          gl_FragColor = vec4(c, clamp(core + halo * 0.35, 0.0, 1.0));
          #include <fog_fragment>
        }`,
      transparent: true, depthWrite: false, fog: true,
    });
    const pollen = new THREE.Mesh(g, m); pollen.frustumCulled = false; pollen.renderOrder = 7; pivot.add(pollen);
  }

  await ctx.yield?.();

  // ---- the droplet ring: 3,000 lens sprites shed by the first instant of the rim --------------------
  const dropRingR = 12;
  const ringX = perp(ringN), ringY = V3().crossVectors(ringN, ringX).normalize();
  {
    const N = Math.round(3000 * (0.5 + 0.5 * detail)), A = new Float32Array(N * 4), B = new Float32Array(N * 4);
    for (let i = 0; i < N; i++) {
      const far = rng.chance(0.2);
      const rInf = far ? rng.range(15, 42) : clamp(dropRingR + rng.gauss() * 1.4, 7.2, 19);
      A.set([rng.range(0, 6.2832), rng.range(1.5, 11), rInf, rng.gauss() * (far ? 4 : 1.7) + 1.5], i * 4);
      const big = rng() ** 3;
      B.set([0.07 + 1.0 * big * Math.sqrt(big), rng(), Math.floor(rng.range(0, 3.999)), rng.range(0.6, 1.4)], i * 4);
    }
    const g = new THREE.InstancedBufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3)); g.setIndex([0, 1, 2, 0, 2, 3]);
    g.setAttribute('aA', new THREE.InstancedBufferAttribute(A, 4)); g.setAttribute('aB', new THREE.InstancedBufferAttribute(B, 4)); g.instanceCount = N;
    const m = new THREE.ShaderMaterial({
      uniforms: Object.assign(fogU(), envU, { uP: holeU.uP, uPx: holeU.uPx, uPy: holeU.uPy, uRn: { value: ringN }, uRx: { value: ringX }, uRy: { value: ringY }, uFrost: { value: frost ? 1 : 0 }, uPxK: viewU.uPxK, uTimeV: viewU.uTimeV, uS: viewU.uS, uR: viewU.uR,
        uT0: { value: C(pal[3]) }, uT1: { value: C(pal[2]) }, uT2: { value: C(pal[1]) } }),
      vertexShader: `#include <fog_pars_vertex>\n${PX_GLSL}
        attribute vec4 aA, aB; uniform vec3 uP, uPx, uPy, uRn, uRx, uRy; uniform float uTimeV, uS, uR; varying vec2 vUv; varying vec3 vI;
        void main(){
          float s = uS - aB.y * 0.06, live = step(0.0, s); s = max(s, 0.0);
          float k = 1.0 - exp(-5.0 * s);
          float rho = mix(aA.y, aA.z, k) + s * aB.w;
          float h = aA.w * k - 0.22 * s * aB.y + 0.25 * sin(uTimeV * 1.7 + aB.y * 40.0);
          vec3 e = uPx * cos(aA.x) + uPy * sin(aA.x);
          vec3 e2 = uRx * cos(aA.x) + uRy * sin(aA.x);
          float sw = smoothstep(0.05, 1.3, s);                           // the ring swings from the skin's plane to face the dive
          vec3 p = uP * uR + mix(uP * h + e * rho, uRn * h + e2 * rho, sw) + vec3(0.0, -0.035 * s * s, 0.0);
          vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
          float sz = max(aB.x * (0.4 + 0.6 * k), bsPx(mvPosition.z) * 1.7) * live;
          float pear = 0.22 * sin(uTimeV * 6.0 + aB.y * 60.0) * exp(-s * 0.25);
          mvPosition.xy += position.xy * sz * vec2(1.0 - pear * 0.5, 1.0 + pear);
          vUv = position.xy; vI = vec3(aB.z, aB.y, clamp(aB.x * 2.0, 0.3, 1.0));
          gl_Position = projectionMatrix * mvPosition;
          #include <fog_vertex>
        }`,
      fragmentShader: `precision highp float;\n#include <fog_pars_fragment>\n${NOISE_GLSL}${ENV_GLSL}
        uniform vec3 uT0, uT1, uT2; uniform float uFrost; varying vec2 vUv; varying vec3 vI;
        void main(){
          float r2 = dot(vUv, vUv); if (r2 > 1.0) discard;
          if (uFrost > 0.5) {                                              // frost: six-armed flakes that glint as they turn
            float rr = sqrt(r2);
            vec2 q = abs(vUv.x) + abs(vUv.y) < 1e-5 ? vec2(1e-5, 0.0) : vUv;
            float th = mod(atan(q.y, q.x) + vI.y * 6.0 + uTime * (vI.y - 0.5), 1.0472) - 0.5236;
            float arm = 1.0 - smoothstep(0.05, 0.11, rr * abs(sin(th)));
            float barb = (1.0 - smoothstep(0.03, 0.08, abs(fract(rr * 4.0) - 0.5) * 0.3 + abs(rr * abs(sin(th)) - 0.12 * (1.0 - rr)))) * 0.6;
            float fa = max(arm, barb) * (1.0 - smoothstep(0.8, 1.0, rr)) + (1.0 - smoothstep(0.0, 0.2, rr));
            float gl = 0.5 + 2.6 * pow(abs(sin(uTime * 1.3 + vI.y * 40.0)), 12.0);
            gl_FragColor = vec4(mix(uWhite, uSunCol, 0.4) * gl * 1.2, clamp(fa, 0.0, 1.0));
            return;
          }
          vec3 n = vec3(vUv, sqrt(max(1.0 - r2, 0.0)));
          vec3 dv = normalize(vec3(-vUv * 1.25, -0.55));                    // a lens: the garden upside down
          vec3 dw = normalize(dv * mat3(viewMatrix));
          vec3 tint = mix(vec3(1.0), vI.x < 0.5 ? uT0 : (vI.x < 1.5 ? uT1 : (vI.x < 2.5 ? uT2 : vec3(1.0))), 0.62);
          vec3 c = (bsEnv(dw) * 1.0 + uWhite * 0.06) * tint;
          float edge = smoothstep(0.55, 1.0, r2);
          c += uWhite * 0.22 * edge * tint;
          vec3 sv = normalize(mat3(viewMatrix) * uSun + vec3(0.0, 0.0, 1.0));
          float sp = pow(max(dot(n, sv), 0.0), 160.0);
          c += uSunCol * sp * (7.0 + 7.0 * vI.z);
          float cau = 1.0 - smoothstep(0.0, 0.2, length(vUv + sv.xy * 0.55));    // caustic opposite the spark
          c += uSunCol * cau * 0.6 * tint;
          float a = smoothstep(1.0, 0.86, r2) * clamp(0.3 + 0.6 * edge + sp + cau, 0.0, 1.0);
          gl_FragColor = vec4(c, a);
          #include <fog_fragment>
        }`,
      transparent: true, depthWrite: false, fog: true,
    });
    const drops = new THREE.Mesh(g, m); drops.frustumCulled = false; drops.renderOrder = 10; pivot.add(drops);
  }

  await ctx.yield?.();

  // ---- mist released along the whole sweep, sinking away ---------------------------------------------
  const holeRate = (opts.rimSpeed ?? 220) / R;                                             // radians per second
  {
    const N = Math.round(3600 * detail), M = new Float32Array(N * 4);
    for (let i = 0; i < N; i++) M.set([rng.range(-Math.PI, Math.PI), Math.acos(clamp(1 - 1.9 * rng() ** 2.2, -1, 1)), rng(), rng.range(0.25, 0.8)], i * 4);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(N * 3), 3));
    g.setAttribute('aM', new THREE.Float32BufferAttribute(M, 4));
    const m = new THREE.ShaderMaterial({
      uniforms: Object.assign(fogU(), holeU, { uPxK: viewU.uPxK, uTimeV: viewU.uTimeV, uR: viewU.uR, uRate: { value: holeRate }, uCol: { value: C(pal[4]) }, uGold: { value: C(pal[3]) } }),
      vertexShader: `#include <fog_pars_vertex>\n${PX_GLSL}${HOLE_GLSL}
        attribute vec4 aM; uniform float uTimeV, uR, uRate; varying float vA; varying float vG;
        void main(){
          float az = aM.x, l = bsFrontAz(az) / max(uHole, 1e-4);
          float ts = (uHole * l - aM.y) / max(uRate * l, 1e-4);              // seconds since the rim passed here
          float live = step(1e-4, uHole) * step(0.0, ts); ts = max(ts, 0.0);
          vec3 e = uPx * cos(az) + uPy * sin(az);
          vec3 dir = uP * cos(aM.y) + e * sin(aM.y), tng = -uP * sin(aM.y) + e * cos(aM.y);
          float k = 1.0 - exp(-2.2 * ts);
          vec3 p = dir * (uR + (aM.z - 0.3) * 9.0 * k) + tng * (5.0 + 16.0 * aM.z) * k
                 + vec3(sin(aM.z * 50.0 + uTimeV * 0.7), -0.6 * ts - 0.5 * ts * ts * (0.4 + aM.z), cos(aM.z * 31.0 + uTimeV * 0.6)) * (0.5 + ts * 0.4);
          vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
          vA = live * smoothstep(0.0, 0.08, ts) * (1.0 - smoothstep(3.5, 8.5 + 4.0 * aM.z, ts));
          vG = aM.z;
          gl_PointSize = clamp(aM.w * 0.7 * (1.0 + 0.5 * ts) / bsPx(mvPosition.z), 1.5, max(2.0, 0.015 / uPxK)) * step(0.001, vA);   // POLISH L2: the cap follows the picture's height (8 px was a veil on a small screen)
          gl_Position = projectionMatrix * mvPosition;
          #include <fog_vertex>
        }`,
      fragmentShader: `#include <fog_pars_fragment>
        uniform vec3 uCol, uGold; varying float vA; varying float vG;
        void main(){ vec2 q = gl_PointCoord * 2.0 - 1.0; float r = dot(q, q); if (r > 1.0 || vA < 0.002) discard;
          float f = (1.0 - r); vec3 c = mix(uCol, uGold, vG * 0.5) * (0.3 + 1.4 * f * f);
          gl_FragColor = vec4(c * vA, 1.0);
          #include <fog_fragment>
        }`,
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: true,
    });
    const mist = new THREE.Points(g, m); mist.frustumCulled = false; mist.renderOrder = 9; pivot.add(mist);
  }
  await ctx.yield?.();

  // ---- progress-driven state ------------------------------------------------------------------------
  const filmSets = [mainU, mainBackU]; if (sat) filmSets.push(sat.U);
  let progress = opts.progress ?? 0.6, applied = -1, hole = 0;
  const satJoin = sat ? Math.max(0, sat.colat - 0.14) : 0;
  function applyProgress() {
    applied = progress;
    const u = progress, t = u * duration, s = (u - burstU) * duration;
    mainU.uThin.value = 0.5 - 0.2 * age - 0.3 * u;
    mainU.uSpan.value = 4.5 - 1.3 * age - 0.5 * u;
    placeSpots(t); mainU.uSpotT.value = t;
    if (frost) for (let i = 0; i < 12; i++) iceU[i].w = ice[i].rmax * smoothstep(ice[i].born, ice[i].born + 0.55, u);
    hole = s > 0 ? holeRate * s : 0;
    holeU.uHole.value = hole;
    viewU.uS.value = s;
    viewU.uFlash.value = s > 0 ? smoothstep(0, 0.1, s) * Math.exp(-Math.max(0, s - 0.1) / 0.3) : 0;
    mainU.uFlash.value = viewU.uFlash.value;
    rimU.uRimR.value = 0.8 + 2.2 * Math.sqrt(clamp(hole / Math.PI, 0, 1));
    if (sat) {
      const tf = hole > 0 ? (hole - satJoin) / holeRate : -1;
      sat.free = tf;
      if (tf > 0) {                           // freed: springs into a wobbling sphere and drifts off
        const k = 1 - Math.exp(-tf * 0.7);
        sat.grp.position.copy(satCenter).addScaledVector(sat.drift, 26 * k + 3.5 * tf).addScaledVector(topY, 9 * k);
        sat.U.uClipR.value = 0; mainU.uClipR.value = 0; sat.mir.visible = false;
        sat.U.uWob.value = 0.012 + 0.1 * Math.exp(-tf * 0.9);
        ridge.material.uniforms.uFade.value = 1 - smoothstep(0, 0.12, tf);
      } else {
        sat.grp.position.copy(satCenter);
        sat.U.uClipR.value = R / satR; mainU.uClipR.value = satR / R; sat.mir.visible = true;
        sat.U.uWob.value = 0.012; ridge.material.uniforms.uFade.value = 1;
      }
      ridge.visible = ridge.material.uniforms.uFade.value > 0.001;
    }
  }
  applyProgress();

  { // POLISH L1C: the entry swirls' own stream, made once, here, after the last draw of the hero's stream (making a fork
    // takes one draw from its parent, so this is the one place where no draw of any stream moves). Dealt anew on every seed:
    // which way the hook turns (the small one always turns against it), the two strengths, and their pollen rafts.
    // Strengths: the hook 6.5 to 8.5, the small one 7.5 to 9.5: under the street's 9 to 12 and well over the scattered
    // swirls' 2.6 to 4.2, the storms building as we fly in; the hook, twice as wide, winds its band as tightly on less.
    const er = rng.fork ? rng.fork('entry-swirls') : rng, sg = er.sign();
    vortS[NVD] = sg * er.range(6.5, 8.5); vortS[NVD + 1] = -sg * er.range(7.5, 9.5);
    dealEntryPollen(er);
  }

  const FLOW_T = 18, _size = new THREE.Vector2(), _cw = V3();
  function update(dt, time, camera) {
    if (applied !== progress) applyProgress();
    envU.uTime.value = time; viewU.uTimeV.value = time;
    const pa = (time / FLOW_T) % 1, pb = (pa + 0.5) % 1, wa = 1 - Math.abs(2 * pa - 1);
    for (const U of filmSets) U.uTimeV.value = time;
    mainU.uFlow.value.set(pa, pb, wa); mainU.uRot.value = time * 0.016; mainU.uIceRot.value = time * 0.012;
    if (sat) {
      const T2 = 11, qa = (time / T2 + 0.3) % 1, qb = (qa + 0.5) % 1;
      sat.U.uFlow.value.set(qa, qb, 1 - Math.abs(2 * qa - 1)); sat.U.uRot.value = -time * 0.07;
      if (sat.free <= 0) sat.grp.rotation.set(Math.sin(time * 0.8) * 0.012, 0, Math.cos(time * 0.63) * 0.012);
      // the mirror image is strong at a grazing view of the planet's film and nearly gone looking straight down
      camera.getWorldPosition(_cw); object.worldToLocal(_cw); _cw.sub(sat.joinC); const cl = _cw.length();
      const cz = cl > 1e-3 ? Math.abs(_cw.dot(satDir)) / cl : 1;
      sat.mU.uAlphaK.value = (0.05 + 0.3 * (1 - cz) * (1 - cz)) * (1 - smoothstep(95, 170, cl));
    }
    if (ctx.renderer) { ctx.renderer.getDrawingBufferSize(_size); viewU.uPxK.value = 2 / Math.max(64, _size.y); }
    // the window's pane is whole or absent: it fades out as the camera sinks toward the film, where its image would fill the frame
    camera.getWorldPosition(_cw); object.worldToLocal(_cw);
    envU.uEnvWin.value = smoothstep(13.6, 15.4, _cw.distanceTo(CEN) - R);
  }

  // ---- anchors (object-local: bubble centre is at (0, R, 0)) ------------------------------------------
  const anchors = {
    bubbleCenter: CEN.clone(), pole: polePt, poleNormal: Pdir.clone(),
    portalSeat: { position: seat, normal: ringN.clone(), facing: ringN.clone() },
    ringCenter: polePt.clone().addScaledVector(ringN, 1.5), ringRadius: dropRingR, ringNormal: ringN.clone(),
    satDir: satDir.clone(), satSide, satAz, sunAz, heading: hA.clone(),
    satellite: sat ? { center: satWorld, radius: satR, flank } : null,
    vortexStreet: street, flyThrough,
    viewpoints: { entry: flyThrough[0], closePass: flank, overTop: flyThrough[9], blackCountry: flyThrough[11], crest: flyThrough[13] },
    sunDir: sunDir.clone(),
  };

  // cut-down film for the distant bubble-moons (no vortices, no spots): use on any sphere geometry
  function makeMoonMaterial(o = {}) {
    const U = filmUniforms({
      uHole: { value: 0 }, uThin: { value: o.thin ?? 0.5 }, uSpan: { value: o.span ?? 3.5 }, uNs: { value: o.ns ?? 2.4 }, uWob: { value: 0.01 },
      uPhase: { value: o.phase ?? 0 }, uLift: { value: 0 }, uClipR: { value: 0 }, uFlow: { value: V3(0.3, 0.8, 0.6) }, uShearT: { value: 0 }, uBandF: { value: o.bandF ?? 26 }, uBand: { value: 0.4 },
      uSeedOff: { value: V3(o.phase ?? 0, 3.1, 7.7) }, uP: { value: V3(0, 1, 0) }, uPx: { value: V3(1, 0, 0) }, uPy: { value: V3(0, 0, 1) }, uLobe: { value: V3() },
    });
    filmSets.push(U);
    return filmMaterial(U, false, false);
  }

  const radius = R, height = 2 * R, center = CEN.clone();

  return {
    object, radius, height, center, anchors, update,
    setProgress(u) { progress = clamp(u, 0, 1.2); },
    holeAngle: () => hole, burstU, duration, makeMoonMaterial, env: envU, R,
    dispose() { ramp.dispose(); },
    ground: false, groundY: 0,
  };
}
