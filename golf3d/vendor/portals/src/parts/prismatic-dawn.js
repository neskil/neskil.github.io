// THE EYE AND ITS GEYSER - hero set piece for the world "prismatic-dawn" (The Prismatic Eye).
//
// A Grand-Prismatic-type hot spring 110 m across lying on grey-white sinter: a sapphire vent that wells up
// and domes, turquoise, an emerald ring, a yellow shelf scalloped with tiny terraces, an orange and rust
// bacterial skirt that frays into flame-shaped tendrils and a fan of braided, steaming rivulets, its edge
// crossed by one stitched line of bison hoofprints. Vapour lifts off every ring in that ring's colour and
// gathers into a column that leans away south. 125 m to the east-south-east stands a Beehive-type cone
// geyser (4 m cone whose mesh fades out at 14 m; the stepped sinter apron round it is painted by the ground
// shader, so there is no disc outline) whose jet goes from 3-8 m preplay splashes to a 60 m white
// tower of dense billows (a sunlit flank, a blue-grey one) round a solid white core, spray lobes arcing over, a veil of
// falling drops and mist that carries a rainbow at 42 degrees from the antisolar point, and a steam
// cloud to 160 m. The spring boils at its centre and spills an overflow creek (a channel of clear hot water between cream
// lips, orange mats and green margins) round its south side; the sinter round it is stepped in rimstone terraces and drained
// by braided threads. Some forty bleached "bobby-sock" snags stand on the runoff flats (opts.snagCount, kept clear of opts.route); they, the jet and anything
// the world registers (bison, elk) throw long analytic blue shadows westward across the mats.
//
// LOCAL SPACE  origin = the vent (centre of the spring) at ground level, +Y up, +X = EAST, +Z = SOUTH
//   (north is -Z; "front" +Z is the side the brief's camera arrives from). Brief metres (east E, north N of
//   the entry) map to local x = E + 131, z = 268 - N: put hero.object at the spring centre, unrotated, in a
//   world whose +X is east and -Z is north. The ground sheet is y = 0; keep the world's terrain at
//   y <= -0.25 under the footprint (the sheet fades to transparent over its outer ~20 m, through a band of
//   frosted meadow colour, so the terrain takes over without a seam: see anchors.blend).
// SIZE   spring rings to r ~90 m (+ tendrils to ~110), runoff fan 200 m toward the south-east, geyser at
//   local (111, 0, 58): cone 4 m, jet 60 m, steam to ~160 m. hero.radius 105 / height 160 are the viewer's
//   framing about center (35,40,20); the footprint is x -175..245, z -175..215.
// COST   ~27k triangles, 9 draw calls (ground sheet, pool, cone, snags, jet, veil, steam, spray,
//   glitter), no lights, no textures, build ~80 ms in steps under 30 ms. Everything is ShaderMaterial, linear
//   HDR, scene fog. Close to the ground the sheet draws rimstone dams, rust filaments, moss edges, nodules and
//   wet glints (gated by pixel footprint). Seen against the sun the eruption's heart is blue-grey and its
//   fringe burns (jetThick in GLSL_COMMON); the world hides the sky's sun disc behind the jet at that moment.
// LIGHT  All materials are lit by shared uniforms, not by scene lights: a low warm sun (default due east,
//   5 deg up, cream-gold x2.6), a sky-blue fill, and uShadowY, the brief's "shadow line": a local height
//   below which nothing receives sun. Call hero.setLight({ sunDir, sunColor, skyColor, zenith, horizon,
//   shadowY }) every frame or once. Default shadowY is -100 (everything lit).
//   Bloom falls on backlit steam edges, spray, the jet's lit flank, frost glitter and water glints only.
//
// OPTS   palette  7 hex strings, brief order: sapphire, emerald/teal, yellow, orange, sinter, sun cream, dark
//        hour     'dawn' (default) | 'evening' (sun west) | 'day' (high sun, thin steam, fierce orange) |
//                 'night' (full moon: silver-blue, vent a dark well)
//        season   'autumn' (default) | 'winter' (steam x3, mats dark green and russet, hard frost) | 'summer'
//        weather  'breeze' (default: light north air, everything leans south) | 'still' (columns vertical)
//        sunDir   [x,y,z] local direction toward the sun (overrides hour)
//        geyser   [x,z] local position of the cone (default [111,58])      jetHeight (default 60)
//        steam    0..3 vapour density multiplier (default 1)                 snags: false to omit the trees
//        surge    [u0,u1] path progress over which the geyser breaks out (default [0.16,0.23])
//        casters  [{x,z,height,radius}] extra static shadow casters (see setCasters)
//        river    [x0, zBend, k, halfWidth] the world's river (see riverD in GLSL_COMMON): the sheet is cut away over it
// HERO API (besides the contract)
//   hero.setProgress(u)   path progress 0..1: preplay splashes below surge[0], eased surge to the full tower at
//                         surge[1], held to the end. If never called the geyser stands fully erupted.
//   hero.setEruption(e)   0..1 directly (overrides setProgress).
//   hero.setLight({...})  see LIGHT.   hero.setShadowLine(y)  the shadow line alone.
//   hero.setCasters([{x,z,height,radius}, ...])  up to 10 moving shadow casters (bison, elk) in local metres;
//                         each throws a soft shadow height/tan(sunElevation) long over ground, mats and pool.
//   hero.setPortal({ color, strength, position, normal, radius })  the pool mirrors the exit portal as a glow
//                         streak under it; give it the portal's colour (default cream, strength 1).
//   hero.uniforms (shared), hero.stats, hero.colors (linear THREE.Colors of sinter/meadow for the terrain).
//   hero.uniforms.uCloud  (alpha of the cloud above the jet, size of all the jet's vapour, alpha of spray and veil; w 0..1
//   holds that cloud down to a short column that neither climbs nor drifts far), 1,1,1,0 by
//                         default; the world tightens them while the camera crosses the plume's lee, so the Eye reads beside
//                         a shaped column instead of through a white-out.
//   hero.addSteam(puffs)  one more draw call of vapour sprites with the hero's steam shader (fumaroles, mist, breath).
//   GLSL_COMMON is exported so the world's own ground and animals share the light, shadow line and noise.
// ANCHORS (local space)
//   portalSeat  { position [0,9,0], facing (unit, toward the arriving camera), heading (dive direction: south-
//               west, 50 deg below level), radius 7, tilt 50 }: the 14 m portal as the pupil, lowest rim 4.5 m
//               above the water. Use portal { tilt: true }.
//   flyThrough  the brief's route in local metres: entry, level run, rise, one anticlockwise turn round the
//               geyser (37 m out for the first half, so that due west of it, 43 m up, the sun stands exactly
//               behind the jet; opening to 55 m while it climbs 12 -> 97 m), over the top east of the geyser, a
//               spiral in over the Eye from the north-east descending to 60 m, the 70 m dive at 50 deg from the
//               north-north-east. Clear of every solid by > 6 m (solids are only the 4 m cone and the snags,
//               all checked at build); the jet and its spray lobes stay > 25 m from it.
//   viewpoints  { bull, firstSpray, north, backlit, south, crest, tipOver, dive } camera positions of the
//               brief's beats.     geyser { base, vent, top, coneRadius, coneHeight, sprayRadius }
//   vent [0,0,0], rings { sapphire, turquoise, emerald, yellow, orange, rust } radii in metres,
//   fan { direction [x,z], halfAngle, length } of the rivulets, hoofprints { from, to }, snags [{x,z,height}],
//   wind [x,z] m/s, sunDir, columnTop (where the spring's vapour column ends), blend { fadeStart, sinter,
//   meadow } for matching the terrain.
import * as THREE from 'three';

const DEFAULT_PALETTE = ['#0F5FB4', '#1FA88A', '#F2C62E', '#D4581C', '#C9CCD1', '#FFE9C4', '#1B222E'];
const NCAST = 24;

// ------------------------------------------------------------------ shared GLSL
const GLSL_NOISE = /* glsl */`
float hash12(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * .1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
float vnoise(vec2 p){ vec2 i = floor(p), f = fract(p); vec2 u = f*f*(3. - 2.*f);
  return mix(mix(hash12(i), hash12(i + vec2(1., 0.)), u.x), mix(hash12(i + vec2(0., 1.)), hash12(i + vec2(1., 1.)), u.x), u.y); }
float fbm2(vec2 p){ return vnoise(p)*.6667 + vnoise(p*2.07 + 17.13)*.3333; }
float fbm3(vec2 p){ return vnoise(p)*.5714 + vnoise(p*2.07 + 17.13)*.2857 + vnoise(p*4.19 + 41.7)*.1429; }
float fbm4(vec2 p){ return vnoise(p)*.5333 + vnoise(p*2.07 + 17.13)*.2667 + vnoise(p*4.19 + 41.7)*.1333 + vnoise(p*8.31 + 7.9)*.0667; }
// band-limited noise: an octave whose lattice cell (cell, metres) shrinks under about three pixels (px = metres per pixel) is
// replaced by its mean, so nothing in the ground turns into per-pixel speckle from the air
float bnz(vec2 q, float cell, float px){ return mix(0.5, vnoise(q), 1. - smoothstep(cell*0.2, cell*0.45, px)); }
float fbm2b(vec2 q, float cell, float px){ return bnz(q, cell, px)*.6667 + bnz(q*2.07 + 17.13, cell/2.07, px)*.3333; }
float fbm3b(vec2 q, float cell, float px){ return bnz(q, cell, px)*.5714 + bnz(q*2.07 + 17.13, cell/2.07, px)*.2857 + bnz(q*4.19 + 41.7, cell/4.19, px)*.1429; }
// tone of the meadow floor (a multiplier on the meadow colour): tussock mottling, darker sedge hollows, thatch up close.
// The world's grass tufts take the same tone at their feet, so ground and tufts read as one carpet.
vec3 meadowTone(vec2 p, float px){
  float t = 0.65 + 0.5*fbm3b(p*0.25 + 77., 4., px) + 0.25*(bnz(p*vec2(5., 1.7), 0.2, px) - 0.5);
  t += 0.22*(bnz(p*vec2(21., 6.3) + 3., 0.048, px) + bnz(p*vec2(6.7, 24.) + 11., 0.042, px) - 1.);
  t *= 0.84;                                    // the floor of a meadow lies in the shade of its own blades
  return mix(vec3(t), t*vec3(0.74, 0.66, 0.58), smoothstep(0.52, 0.72, fbm3(p*0.035 + 19.))*0.65);
}
`;

export const GLSL_COMMON = /* glsl */`
uniform float uTime;
uniform vec4 uRiver;
uniform vec3 uSunDir, uSunCol, uSkyCol, uZenith, uHorizon;
uniform vec2 uSunXZ;
uniform float uShadowY, uShadowLen, uNight;
uniform vec4 uSeed, uRingA, uRingB, uGey;
uniform vec2 uWind;
uniform vec4 uCast[${NCAST}];
${GLSL_NOISE}
// warped radius of the Eye (metres) and the radial "flame" field of its skirt
float eyeD(vec2 p, out float tend){
  float r = length(p);
  float k = smoothstep(6., 60., r);
  float n1 = fbm3(p*0.021 + uSeed.xy) - 0.5;
  float n2 = fbm2(p*0.085 + uSeed.zw) - 0.5;
  vec2 dir = p / max(r, 1e-3);
  tend = fbm3(dir*(13. + r*0.035) + uSeed.yx*3.);
  return r + n1*15.*k + n2*5.*k*k;
}
// soft shadows of thin vertical casters (snags, animals): sun-aligned capsule test
float castShadow(vec2 p, float px){
  vec2 pr = vec2(-uSunXZ.y, uSunXZ.x);
  float sh = 0.;
  for (int i = 0; i < ${NCAST}; i++){
    vec4 c = uCast[i];
    vec2 q = p - c.xy;
    float s = -dot(q, uSunXZ), t = abs(dot(q, pr));
    // a pole's shadow is sharp at its foot and gone into its own penumbra within some forty metres (never a ruled scratch)
    float L = max(min(c.z*uShadowLen, 26. + c.z*2.4), 0.02), w = max(c.w, 0.02);
    float blur = 0.2 + max(s, 0.)*0.034 + px*0.9;
    float m = (1. - smoothstep(max(w - blur, 0.), w + blur, t)) * (2.*w/(2.*w + blur));
    m *= smoothstep(-w, w, s) * (1. - smoothstep(L*0.8, L, s));
    sh = max(sh, m);
  }
  return sh;
}
// the jet's own long shadow (keyed to the current jet height)
float geyShadow(vec2 p){
  vec2 q = p - uGey.xy;
  float s = -dot(q, uSunXZ), t = dot(q, vec2(-uSunXZ.y, uSunXZ.x));
  float H = max(uGey.z, 0.5), h = s/max(uShadowLen, 0.01);
  float v = clamp(h/H, 0., 1.4);
  float wob = fbm2(vec2(s*0.014 - uTime*0.06, t*0.04 + 3.)) - 0.5;
  float w = 1.6 + 5.5*v + 8.*smoothstep(0.55, 1.1, v);
  float m = 1. - smoothstep(w*0.45, w*1.5 + 1.2 + max(s, 0.)*0.012, abs(t + wob*w*1.6));
  m *= smoothstep(0., 4., s) * (1. - smoothstep(0.85, 1.3, v));
  return m*(0.7 + 0.25*fbm2(vec2(s*0.05 - uTime*0.35, t*0.2)));
}
float sunGate(float y){ return smoothstep(uShadowY - 0.7, uShadowY + 0.7, y); }
// 0..1: how nearly the line of sight through pv (view space) passes through the heart of the jet (y: local height of the vapour)
float jetThick(vec3 pv, float y){
  float H = max(uGey.z, 0.3), v = clamp(y/H, 0., 1.5), k = sqrt(clamp(H/60., 0.01, 1.3)), ln = min(v*v, 1.6)*2.2*k;
  vec3 g = (viewMatrix*vec4(uGey.x + uWind.x*ln, y, uGey.y + uWind.y*ln, 1.)).xyz;
  vec3 c = cross(normalize(pv), (viewMatrix*vec4(0., 1., 0., 0.)).xyz);
  float d = abs(dot(g, c))/max(length(c), 1e-3), R = (2.5 + 6.*v)*k;
  return (1. - smoothstep(R*0.8, R*1.9, d))*smoothstep(0.03, 0.5, uGey.w)*(1. - smoothstep(H*1.05, H*1.4, y));
}
// signed distance (m, negative inside) to the world's river: centre x = uRiver.x + s*s/(s + uRiver.z), s = max(0, uRiver.y - z)
float riverD(vec2 p){
  float s = max(uRiver.y - p.y, 0.), q = s + uRiver.z;
  float xc = uRiver.x + s*s/q, dx = (s*s + 2.*s*uRiver.z)/(q*q);
  return abs(p.x - xc)/sqrt(1. + dx*dx) - uRiver.w;
}
// Sinter flats from the air: low stepped terraces. A riser that faces the low sun is a bright line, one that faces away is a
// dark line with its shadow on the tread below, and water stands behind every lip. Returns (multiplier on the sunlit colour,
// pond 0..1, lip line 0..1, position across the tread 0..1). Lines are never under 1.6 pixels and fade out before they merge.
vec4 terraces(vec2 p, float px){
  vec2 q = p*0.035 + 7.3;
  float h0 = fbm3(q), hx = fbm3(q + vec2(0.035, 0.)), hz = fbm3(q + vec2(0., 0.035));
  vec2 g = vec2(hx - h0, hz - h0);
  float gl = max(length(g), 1e-5), f = fract(h0*6.5);
  float w0 = 1.6*px*gl*6.5, w = clamp(w0, 0.03, 0.5), amp = 1. - smoothstep(0.2, 0.5, w0);
  float line = (1. - smoothstep(w*0.5, w, min(f, 1. - f)))*amp;
  float facing = dot(-g/gl, uSunXZ)*clamp(1.4 - 2.5*uSunDir.y, 0.3, 1.);
  float shadow = smoothstep(0.8 - w, 1. - w, f)*max(-facing, 0.)*amp;
  float pond = (1. - smoothstep(0.06, 0.3, f))*smoothstep(0., w, f)*amp;
  return vec4(1. + 0.55*line*max(facing, 0.) - 0.5*shadow - 0.25*line*max(-facing, 0.), pond, line, f);
}
// The Eye's overflow creek: an arc of braided strands that leaves the pool at its south-west rim and swings out round the south
// side toward the runoff fan (uCreek: centre x, z, radius, strength). Returns (metres along it, metres across it, how much of it is here)
uniform vec4 uCreek;
vec3 creekST(vec2 p){
  vec2 q = p - uCreek.xy;
  float r = length(q), phi = atan(q.x, max(q.y, 1e-3));
  float k = smoothstep(-1.36, -1.22, phi)*(1. - smoothstep(0.12, 0.42, phi))*step(1., q.y)*uCreek.w;
  return vec3(phi*uCreek.z, r - uCreek.z, k);
}
`;
// fragment shaders only (screen derivatives). Braided strands from two noise fields: x = water (never thinner than about 2.5
// pixels, losing contrast instead of breaking into dashes), y = the warm stained band round it
export const GLSL_BRAID = /* glsl */`
vec2 braid(float v1, float v2){
  float a1 = abs(v1 - 0.5), a2 = abs(v2 - 0.5);
  float f1 = max(fwidth(v1), 1e-5), f2 = max(fwidth(v2), 1e-5);
  float o1 = max(0.07, 1.7*f1), o2 = max(0.05, 1.7*f2);
  float k2 = 0.8*(1. - smoothstep(0.14, 0.32, f2));
  float ch = max((1. - smoothstep(max(0.015, 0.5*f1), o1, a1))*clamp(0.12/o1, 0.45, 1.), (1. - smoothstep(max(0.0075, 0.5*f2), o2, a2))*clamp(0.09/o2, 0.45, 1.)*k2);
  float halo = max(1. - smoothstep(0.04, 0.18, a1), (1. - smoothstep(0.025, 0.13, a2))*k2);
  return vec2(ch, halo);
}
`;

function col(hex) { return new THREE.Color(hex); }
function smooth(a, b, x) { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); }
function v3(c) { return new THREE.Vector3(c.r, c.g, c.b); }
function mixc(a, b, t) { return a.clone().lerp(b, t); }

// ------------------------------------------------------------------ ground sheet (sinter, mats, rivulets)
const GROUND_FRAG = /* glsl */`
varying vec3 vP, vW;
uniform vec3 uCSinter, uCYel, uCOra, uCRust, uCMeadow, uCFrost, uCDark, uCMoss;
uniform vec3 uFan;
uniform vec4 uHoof;
uniform float uFrost, uHaze, uSteamK, uEdge;
#include <fog_pars_fragment>
${GLSL_COMMON}
${GLSL_BRAID}
void main(){
  vec2 p = vP.xz;
  vec2 dpx = dFdx(p), dpy = dFdy(p);
  float px = max(length(dpx), length(dpy));
  float tend0; float d = eyeD(p, tend0);
  if (d < 40.) discard;
  float rr = length(p); vec2 dirp = p/max(rr, 1e-3);
  // the skirt's flame field, band-limited. Its lookup slides with the radius and wanders with a slow warp, so the tongues of
  // mat are short curling lobes a few metres wide, never rays drawn out from the vent
  vec2 sw = vec2(fbm2(p*0.045 + 3.), fbm2(p*0.045 + 37.)) - 0.5;
  float tfq = 13. + rr*0.035;
  float tend = 0.6*fbm3b(dirp*tfq + sw*1.6 + vec2(rr*0.17, -rr*0.11) + uSeed.yx*3., rr/tfq, px) + 0.4*fbm2b(dirp*tfq*1.5 + sw*2.6 - vec2(rr*0.14, rr*0.21) + 9., rr/(tfq*1.5), px);
  tend = clamp(0.5 + (tend - 0.5)*1.35, 0., 1.);
  vec2 gq = p - uGey.xy; float gd = length(gq);
  float a = dot(p, uFan.xy), c = dot(p, vec2(-uFan.y, uFan.x));
  float nA = fbm3(p*0.013 + uSeed.zw*1.7);
  float nB = vnoise(p*0.07 + 9.);
  // footprint: spring apron + geyser apron + runoff fan, ragged edge, fades to nothing
  float sFan = max(max(abs(c) - (12. + max(a, 0.)*0.24), a - 205.), -a);
  float sR = min(min(d - 116., gd - 46.), sFan) + (nA - 0.5)*30. + (nB - 0.5)*10.;
  float alpha = 1. - smoothstep(20., 38., sR);
  float rvd = uRiver.w > 0. ? riverD(p) : 99.;
  alpha *= smoothstep(-0.6, 2.4, rvd);
  if (alpha < 0.004) discard;
  // every detail term is faded out before its feature is smaller than about three pixels: from 100 m up a pixel is 0.3 m
  float mid = 1. - smoothstep(0.6, 3.0, px);
  float rel = 1. - smoothstep(0.07, 0.22, px);           // relief shading only where the relief itself is resolved
  float n1 = fbm3(p*0.06 + 3.1);
  float n2 = fbm3b(p*0.33 + 11., 3.03, px);
  float n3 = bnz(p*2.6, 0.385, px);
  // sinter: pale crust, low stepped terracettes, cool damp hollows
  float st = n1*2.75, stf = fract(st), fst = fwidth(st);
  float T0 = floor(st) + smoothstep(0.7, 1., stf);
  float stx = fbm3((p + vec2(0.5, 0.))*0.06 + 3.1)*2.75, stz = fbm3((p + vec2(0., 0.5))*0.06 + 3.1)*2.75;
  vec2 gT = (vec2(floor(stx) + smoothstep(0.7, 1., fract(stx)), floor(stz) + smoothstep(0.7, 1., fract(stz))) - T0)*(0.07/0.5);
  float wst = max(0.1, 2.5*fst);
  float tline = smoothstep(1. - wst, 1. - wst*0.35, stf)*(1. - smoothstep(1. - clamp(fst, 0.002, 0.3), 1., stf))*(0.1/wst)*(1. - smoothstep(0.12, 0.3, fst));
  float H = (n3 - 0.5)*0.008 + (n2 - 0.5)*0.03;
  vec3 colr = uCSinter*(0.64 + 0.32*n1 + 0.10*(n2 - 0.5)*mid);
  colr = mix(colr, colr*vec3(0.78, 0.87, 1.0), (1. - smoothstep(0.22, 0.5, n1))*0.8);
  colr *= 1. - 0.22*tline*mid;
  vec4 ter = terraces(p, px);
  colr = mix(colr, colr*vec3(0.6, 0.73, 0.94), ter.y*0.6);
  // bacterial mats: yellow shelf, orange, rust skirt with flame tendrils
  float tfl = smoothstep(0.28, 0.80, tend);
  float lobe = fbm2(dirp*2.6 + uSeed.zw*0.7 + rr*0.004);
  float m = d - ((lobe - 0.45)*30. + (tfl - 0.35)*(7. + 15.*lobe))*smoothstep(52., 76., d);
  float e1 = (bnz(p*0.45 + 5., 2.2, px) - 0.5)*2.6 + (n2 - 0.5)*4.;
  float wY = 1. - smoothstep(uRingA.w - 0.5, uRingA.w + 4., d + e1);
  float wO = 1. - smoothstep(uRingB.x - 4., uRingB.x + 6., m + e1*1.5);
  float wR = 1. - smoothstep(uRingB.y - 14., uRingB.y + 10., m + e1*2. + (n1 - 0.5)*16.);
  float ffq = 31. + rr*0.06;
  float fil = fbm2b(dirp*ffq + sw*3. + vec2(rr*0.2, -rr*0.13) + 7., rr/ffq, px);
  vec3 rust = mix(uCRust*0.62, uCRust*1.15, n2);
  rust = mix(rust, uCOra*0.9, smoothstep(0.5, 0.85, fil)*0.55);
  rust = mix(rust, uCDark*1.6 + uCRust*0.2, (1. - smoothstep(0.3, 0.62, fil))*0.35*n1);
  vec3 ora = mix(uCOra, mix(uCOra, uCYel, 0.45), smoothstep(0.35, 0.8, fil)*0.6)*(0.9 + 0.2*n2);
  vec3 yel = uCYel*(0.92 + 0.16*n2);
  float matA = max(wR*(0.8 + 0.2*n2), max(wO, wY));
  colr = mix(colr, rust, wR*(0.82 + 0.18*n2));
  colr = mix(colr, ora, wO);
  colr = mix(colr, yel, wY);
  float streak = smoothstep(0.60, 0.88, tend)*(1. - smoothstep(86., 138., d))*(1. - wR);
  colr = mix(colr, mix(uCRust, uCOra, 0.4), streak*0.3);
  H += matA*0.03 + wR*n2*0.03;
  // rimstone scallops on the shelf and the inner skirt: concentric lips whose spacing doubles with distance (two levels
  // cross-faded), so a lip is always at least 2.5 pixels wide and the lips at least 7 pixels apart
  float tz = smoothstep(44., 49., d)*(1. - smoothstep(58., 70., m));
  float sc0 = d*0.55 + vnoise(p*0.33 + 2.)*3.0 + bnz(p*0.9, 1.1, px)*1.2;
  float fsc = max(px*0.9, 1e-4);
  float lvl = clamp(log2(fsc*7.), 0., 5.), l0 = floor(lvl), lf = lvl - l0;
  float ka = exp2(-l0), kb = ka*0.5, fa = fsc*ka, fb = fsc*kb;
  float da = abs(fract(sc0*ka - 0.35) - 0.5), db = abs(fract(sc0*kb - 0.35) - 0.5);
  float ha = max(0.085, 1.25*fa), hb = max(0.085, 1.25*fb);
  float lipA = 1. - smoothstep(ha - fa*0.75, ha + fa*0.75, da), lipB = 1. - smoothstep(hb - fb*0.75, hb + fb*0.75, db);
  float dkA = (1. - smoothstep(ha, ha + 0.16, da))*(1. - lipA), dkB = (1. - smoothstep(hb, hb + 0.16, db))*(1. - lipB);
  float far5 = 1. - smoothstep(4.4, 5., lvl);
  float lip = mix(lipA, lipB, lf)*tz*far5, lipDk = mix(dkA, dkB, lf)*tz*far5;
  H += lip*0.05;
  colr = mix(colr, colr*1.22 + 0.05, lip*mix(0.8, 0.4, rel));
  colr *= 1. - 0.14*lipDk;
  // braided rivulets fanning away, and fine drainage threads all round the skirt. Channels are drawn as the distance to an
  // isoline measured in pixels: never thinner than 2.5 pixels, losing contrast instead of breaking into dashes
  float fang = atan(c, abs(a) + 1e-3);
  float fanW = uFan.z*(0.8 + 0.45*nA);
  float fanM = (1. - smoothstep(fanW*0.8, fanW*1.5, abs(fang)))*smoothstep(0., 20., a)*smoothstep(52., 80., d)*(1. - smoothstep(198., 232., a));
  vec2 bq = vec2(rr*0.13, fang*34.);
  vec2 bw = vec2(fbm2(p*0.035 + 21.), fbm2(p*0.035 + 57.)) - 0.5;
  vec2 brF = braid(vnoise(bq + bw*3.2 + uSeed.xy), vnoise(bq*vec2(2.1, 2.6) + bw*4.5 + uSeed.zw + 13.));
  // the same strands drain the skirt all the way round, in the sectors where the ground falls away (a lookup on the direction
  // circle that slides with the radius: no seam and no straight rays)
  vec2 rq = dirp*21. + vec2(rr*0.085, -rr*0.055) + bw*5. + uSeed.xy;
  vec2 brA = braid(vnoise(rq), vnoise(rq*2.3 + bw*3.5 + 13.));
  float allM = smoothstep(58., 84., d)*(1. - smoothstep(150., 215., d))*smoothstep(0.4, 0.62, fbm2(dirp*2.1 + uSeed.xy + 5.))*(1. - fanM)*0.9;
  // and the overflow creek: three strands weaving down one stained bed
  vec3 ck = creekST(p);
  float cS = ck.x, cT = ck.y, cw = max(0.32, 1.6*px), creekCh = 0., creekE = 9.;
  for (int i = 0; i < 3; i++){
    float fi = float(i), mainK = step(fi, 0.5);
    float ti = (2.7*sin(cS*0.15 + fi*2.1 + uSeed.x) + 1.1*sin(cS*0.43 + fi*4.3) + (vnoise(vec2(cS*0.3, fi*7.3 + 2.)) - 0.5)*2.2)*mix(1., 0.5, mainK);
    float ce = abs(cT - ti);
    creekCh = max(creekCh, (1. - smoothstep(cw*0.55, cw*1.3, ce))*(1. - mainK));
    if (i == 0) creekE = ce - (1.5 + 0.6*sin(cS*0.07 + 2.) + (n2 - 0.5)*0.5);
  }
  creekCh *= clamp(0.45/cw, 0.4, 1.)*ck.z;
  float creekW = (1. - smoothstep(-0.2, 0.15 + px, creekE))*ck.z;     // the main channel: two to four metres of clear hot water
  float creekH = (1. - smoothstep(3.2, 7.5, abs(cT) + (n2 - 0.5)*2.5))*ck.z;
  float halo = max(max(brF.y*fanM, brA.y*allM), creekH);
  float haloM = halo, chM = max(max(brF.x*fanM, brA.x*allM), creekCh);
  // green margins where the creek's bed cools
  colr = mix(colr, uCMoss*(0.7 + 0.5*n2), ck.z*smoothstep(3., 5.5, abs(cT) + (n2 - 0.5)*2.)*(1. - smoothstep(6.5, 10., abs(cT) + (n2 - 0.5)*3.))*0.75*(1. - uNight*0.5));
  colr = mix(colr, mix(uCRust*1.1, uCOra, halo), haloM*0.85);
  float flow = mix(bnz(vec2(rr*0.9 - uTime*1.4, fang*rr*0.5), 1.1, px), bnz(vec2(cS*0.9 + uTime*1.6, cT*1.2), 1.1, px), creekH);
  vec3 film = mix(uCYel, vec3(0.85, 0.88, 0.8), 0.18 + 0.22*flow);
  colr = mix(colr, film, chM*0.9);
  vec3 cwat = mix(vec3(0.34, 0.74, 0.70), vec3(0.05, 0.40, 0.62), smoothstep(0.1, 0.9, clamp(-creekE/1.6, 0., 1.)))*(0.85 + 0.3*flow);
  colr = mix(colr, vec3(0.95, 0.88, 0.66), smoothstep(-0.3, 0., creekE)*(1. - smoothstep(0.1, 0.7, creekE))*ck.z*0.85);   // a cream lip of fresh sinter along the water
  colr = mix(colr, cwat, creekW*0.94);
  float af = abs(fil - 0.5), ff = max(fwidth(fil), 1e-5), ot = max(0.05, 1.7*ff);
  float tch = (1. - smoothstep(max(0.01, 0.5*ff), ot, af))*clamp(0.08/ot, 0.35, 1.)*(1. - smoothstep(0.10, 0.26, ff))*smoothstep(50., 58., d)*(1. - smoothstep(92., 120., m));
  colr = mix(colr, mix(uCYel, uCOra, 0.35), tch*0.4);
  H -= chM*0.05 + tch*0.03;
  float wet = max(max(chM, creekW*0.55), tch*0.7);
  wet = max(wet, wY*0.3 + lip*0.4*(0.5 + 0.5*sin(uTime*1.7 + sc0*6.)));
  // the geyser's apron: wet where the curtain falls, stained by its own runoff
  vec2 gdir = gq/max(gd, 1e-3);
  float gfq = 10. + gd*0.05;
  float gst = fbm2b(gdir*gfq + sw*2. + vec2(gd*0.09, -gd*0.05) + 31., gd/gfq, px);
  float gdw = length(gq - uWind*4.);
  float gwet = (1. - smoothstep(10., 34., gdw))*(0.25 + 0.75*uGey.w);
  float gmat = 1. - smoothstep(14., 40., gd + (gst - 0.5)*18.);
  colr = mix(colr, mix(uCRust, uCOra, gst)*0.9, gmat*smoothstep(0.45, 0.8, gst)*0.7);
  colr *= 1. - 0.35*gwet*(0.6 + 0.4*n2);
  wet = max(wet, gwet*0.8);
  // the apron's outer terraces are painted here (the cone mesh fades out by 14 m): stepped geyserite lips that break up into
  // the mats over the last eight metres, so the cone never sits on a disc
  float ap = 1. - smoothstep(12., 23., gd + (gst - 0.5)*10. + (n2 - 0.5)*5.);
  float at0 = gd*0.8 + vnoise(gq*0.19 + 5.)*2.6 + bnz(gq*0.8 + 2., 1.25, px)*0.9;
  float fat = max(fwidth(at0), 1e-4), ae = abs(fract(at0) - 0.5), aw = max(0.09, 1.3*fat);
  float alip = (1. - smoothstep(aw - fat*0.75, aw + fat*0.75, ae))*(1. - smoothstep(0.22, 0.5, fat));
  vec3 apc = uCSinter*(0.66 + 0.24*gst + 0.14*(n2 - 0.5)*mid);
  apc = mix(apc, mix(uCRust, uCOra, gst)*0.9, smoothstep(0.5, 0.8, gst)*0.55);
  apc *= 1. - 0.3*gwet*(0.6 + 0.4*n2);
  colr = mix(colr, apc, ap*0.92);
  colr = mix(colr, colr*1.25 + 0.04, alip*ap*0.65);
  colr *= 1. - 0.16*ap*(1. - alip)*(1. - smoothstep(aw, aw + 0.22, ae));
  H += alip*ap*0.045;
  float bankW = 1. - smoothstep(1.5, 9., rvd);
  colr = mix(colr, mix(uCRust*0.7, uCDark*1.4 + uCRust*0.25, n2), bankW*0.3);
  wet = max(wet, bankW*0.7);
  // ---- close range. The breakout flies 6 to 20 m above the fan, where a pixel is 3 to 15 cm of ground: rimstone dams stepping
  // across the flow, rust filaments streaming down it, moss on the cool edge of every rivulet, sinter nodules with their own
  // little shadows. Every term is gated by the pixel footprint (no screen derivatives in here), so none of it reaches the air
  float near = 1. - smoothstep(0.09, 0.30, px), near2 = 1. - smoothstep(0.035, 0.13, px);
  float matK = clamp(max(max(matA, haloM), gmat*0.7), 0., 1.)*(1. - ap*0.7);
  float edge = smoothstep(0.05, 0.2, halo)*(1. - smoothstep(0.28, 0.6, halo));
  float mossN = smoothstep(0.38, 0.62, bnz(p*0.7 + 23., 1.43, px));
  colr = mix(colr, uCMoss*(0.62 + 0.5*n2), edge*mossN*(0.3 + 0.5*near)*(1. - uNight*0.5));
  // along the creek the dams step across its own flow and the filaments stream down it; elsewhere both follow the vent's rings.
  // The two patterns fade out toward the line where one takes over from the other
  float inCreek = step(0.5, creekH), selK = smoothstep(0., 0.5, abs(creekH - 0.5)*2.);
  vec2 fq = mix(vec2(rr, fang*rr), vec2(cS, cT), inCreek);
  float dm0 = rr*1.15 + vnoise(fq*vec2(0.33, 0.5) + 4.)*2.8 + vnoise(fq*vec2(1.1, 1.7) + 9.)*0.7;
  float fdm = 1.7*px;          // the dams' own footprint: they run across the view, where a pixel is longest
  if (near > 0.004){
    float fw1 = vnoise(fq*0.27 + 31.)*3.;
    float dl = clamp(log2(max(fdm*7., 1.)), 0., 4.), d0 = floor(dl), df = dl - d0;
    float qa = exp2(-d0), qb = qa*0.5;
    float fa = fract(dm0*qa), ea = abs(fa - 0.5), eb = abs(fract(dm0*qb) - 0.5);
    float wa = max(0.085, 1.3*fdm*qa), wb = max(0.085, 1.3*fdm*qb);
    float damA = 1. - smoothstep(wa - fdm*qa, wa + fdm*qa, ea), damB = 1. - smoothstep(wb - fdm*qb, wb + fdm*qb, eb);
    float dam = mix(damA, damB, df);
    float bead = 0.6 + 0.4*bnz(vec2(fq.y*7., fq.x*2.) + 3., 0.14, px);
    float damK = matK*near*(1. - 0.6*chM)*(1. - creekW)*mix(0.2 + 0.8*smoothstep(0.3, 0.62, vnoise(p*0.085 + 40.)), 0.5, inCreek)*selK;       // in patches: smooth films lie between the terraced reaches
    float pond = smoothstep(0.5 - wa - 0.32, 0.5 - wa, fa)*step(fa, 0.5)*(1. - damA)*(1. - df);
    colr *= 1. - 0.22*pond*damK;
    colr = mix(colr, mix(uCSinter*0.9, uCYel, 0.35)*bead, dam*damK*0.8);
    H += dam*damK*0.04*bead;
    wet = max(wet, pond*damK*0.8);
    float fl1 = bnz(vec2(fq.y*3.6 + fw1, fq.x*0.95 - uTime*0.04), 0.28, px);
    float fl2 = bnz(vec2(fq.y*9.5 + fw1*2. + 5., fq.x*2.4 - uTime*0.09), 0.105, px);
    float fila = smoothstep(0.5, 0.78, fl1*0.62 + fl2*0.38)*selK*(1. - creekW);
    colr = mix(colr, uCRust*0.5 + uCDark*0.35, fila*matK*near*0.6*(1. - dam));
    float pale = smoothstep(0.6, 0.86, fl2*0.7 + fl1*0.3)*near2;
    colr = mix(colr, mix(uCYel, vec3(0.86, 0.84, 0.76), 0.45), pale*matK*0.35);
    colr = mix(colr, mix(uCOra, uCYel, 0.6)*(0.85 + 0.3*fl2), chM*near*0.45*smoothstep(0.35, 0.65, fl1));
    H += (fl2 - 0.5)*0.012*wet*near2;
    // sinter nodules and stones: only where each is four pixels or more across, soft-edged, in the mats' own warm tones
    vec2 nc = p*1.05 + 7.3, ni = floor(nc), nf = fract(nc);
    float nh = hash12(ni + 17.3), nk = step(mix(0.9, 0.66, n1), nh)*step(creekW, 0.5), nearN = 1. - smoothstep(0.035, 0.085, px);
    vec2 no = vec2(hash12(ni + 3.1), hash12(ni + 9.7))*0.4 + 0.3;
    float nr = 0.15 + 0.14*hash12(ni + 31.7), nsoft = clamp(px*1.05*2.5/nr, 0.12, 0.6);
    float nd = length(nf - no)/nr, dome = sqrt(max(1. - nd*nd, 0.));
    float nod = nk*(1. - smoothstep(1. - nsoft, 1., nd))*nearN;
    float nsh = nk*(1. - smoothstep(0.5, 1.9, length(nf - no + uSunXZ*nr*1.5)/nr))*(1. - nod)*nearN*sunGate(vP.y);
    vec3 ncol = mix(mix(uCSinter*0.8, uCYel*0.75, 0.3 + 0.4*hash12(ni + 5.9)), uCRust*0.8, step(0.72, hash12(ni + 41.3))*0.6);
    colr = mix(colr, ncol*(0.75 + 0.3*nh)*(0.8 + 0.25*dome), nod*0.92);
    colr *= 1. - 0.45*nsh;
    H += nod*dome*0.09;
  }
  // one stitched line of hoofprints across the skirt
  vec2 hd = uHoof.zw - uHoof.xy; float hl = max(length(hd), 1.); hd /= hl;
  vec2 hq = p - uHoof.xy; float hs = dot(hq, hd), ht = dot(hq, vec2(-hd.y, hd.x));
  ht += 2.2*sin(hs*0.045 + uSeed.x) + 0.5*sin(hs*0.21 + uSeed.y);
  float hOn = smoothstep(0., 4., hs)*(1. - smoothstep(hl - 4., hl, hs));
  float side = step(0., ht)*2. - 1.;
  float stp = fract(hs/0.95 + 0.25*side + 0.25) - 0.5;
  float prints = 1. - smoothstep(0.10, 0.19, length(vec2(stp*0.95, abs(ht) - 0.24)));
  float lw = max(0.5, px*1.5);
  float trail = 1. - smoothstep(lw*0.6, lw, abs(ht));
  float lod = smoothstep(0.05, 0.25, px);
  float hoof = mix(prints, trail*min(1., 0.6/lw)*(0.65 + 0.35*step(0.35, fract(hs/1.9))*(1. - smoothstep(0.3, 0.6, px))), lod)*hOn;
  colr = mix(colr, colr*0.38 + uCSinter*0.08, hoof*(0.55 + 0.4*matA));
  H -= hoof*0.04*(1. - lod);
  // cold ground: hoar frost outside the warm halos, frosted meadow at the rim
  float warm = max(max(1. - smoothstep(92., 128., m + (nA - 0.5)*20.), haloM), 1. - smoothstep(22., 46., gd));
  float frost = (1. - warm)*uFrost;
  float meadow = smoothstep(-6., 8., sR);
  // green summer grass against pale sinter: the edge is broken at tussock scale (clumps three metres and half a metre
  // across) and is a metre wide, not a fourteen-metre fade
  float eM = max(0.8, px*1.6);
  meadow = mix(meadow, smoothstep(-eM, eM, sR - 1. + (n2 - 0.5)*9. + (n3 - 0.5)*3.5), uEdge);
  vec3 grass = uCMeadow*meadowTone(p, px);
  colr = mix(colr, mix(grass, uCMoss*(0.8 + 0.4*n2), warm*0.8), meadow);
  float fr = clamp(frost*(0.28 + 0.35*n1 + 0.25*meadow), 0., 0.6);
  colr = mix(colr, uCFrost*(0.80 + 0.15*n3), fr);
  // relief from the height field (screen-space gradient mapped back to metres), close range only
  float dhx = dFdx(H), dhy = dFdy(H);
  float det = dpx.x*dpy.y - dpx.y*dpy.x;
  det = (det < 0. ? -1. : 1.)*max(abs(det), 1e-9);
  vec2 g = vec2(dhx*dpy.y - dhy*dpx.y, dhy*dpx.x - dhx*dpy.x)/det;
  float aniso = px*px/max(abs(det), 1e-9);
  g = clamp(g*rel*(1. - smoothstep(3., 12., aniso)), -0.5, 0.5)*1.3;
  g += clamp(gT, -0.2, 0.2)*rel*1.5;
  vec3 N = normalize(vec3(-g.x, 1., -g.y));
  vec3 V = normalize(cameraPosition - vW);
  float lit = sunGate(vP.y);
  float sh = max(castShadow(p, px), geyShadow(p));
  float along = -dot(p, uSunXZ), across = dot(p, vec2(-uSunXZ.y, uSunXZ.x));
  float veil = fbm2(vec2(along*0.011 - uTime*0.02, across*0.045) + 40.);
  sh = max(sh, smoothstep(0.52, 0.85, veil)*smoothstep(-20., 60., along)*(1. - smoothstep(60., 110., abs(across)))*0.5*min(uSteamK, 1.5));
  // the grazing sun exaggerates slopes threefold up close; from the air the gain falls and the flat tone stays the same
  float ndl = max(dot(N, uSunDir), 0.), n0 = max(uSunDir.y, 0.);
  float sunT = clamp(min(n0*3. + 0.07, 0.85) + (ndl - n0)*mix(1.5, 3., rel), 0.07, 0.85);
  float terK = (1. - matA)*(1. - ap*0.9)*(1. - meadow)*(1. - haloM);
  wet = max(wet, ter.y*terK*0.6);
  vec3 E = uSunCol*sunT*lit*(1. - sh*0.92)*mix(1., ter.x, terK) + uSkyCol*(0.8 + 0.2*N.y);
  vec3 c3 = colr*E;
  vec3 R = reflect(-V, N);
  float fres = pow(1. - max(dot(N, V), 0.), 4.);
  c3 += wet*mix(uHorizon, uZenith, clamp(R.y*1.5, 0., 1.))*(0.04 + 0.5*fres);
  c3 += wet*uSunCol*pow(max(dot(R, uSunDir), 0.), 90.)*1.6*lit*(1. - sh);
  vec2 cell = floor(p*7.);
  float tw = hash12(cell + floor(dot(V.xz, vec2(37., 23.)) + V.y*31.)*vec2(1.3, 2.7));
  c3 += uSunCol*step(0.994, tw)*clamp(fr*1.6, 0., 1.)*lit*(1. - sh)*(1. - smoothstep(0.07, 0.22, px))*2.0;
  // wet films sparkle: glint cells that blink as the film crawls
  vec2 gc = floor(p*8.5);
  float gsp = hash12(gc + floor(uTime*2.2 + hash12(gc + 5.)*9.)*vec2(3.1, 1.7));
  c3 += uSunCol*step(0.972, gsp)*wet*(1. - smoothstep(0.03, 0.11, px))*lit*(1. - sh)*(0.35 + 0.65*max(dot(-V, uSunDir), 0.))*1.3;
  // in summer the sheet ends at that broken edge: beyond it the world's own ground decides between sinter and grass, so no
  // green fades away across the flats
  gl_FragColor = vec4(max(c3, 0.), alpha*(1. - uEdge*meadow));
  vec3 pre = gl_FragColor.rgb;
  #include <fog_fragment>
  gl_FragColor.rgb = mix(gl_FragColor.rgb, pre, uHaze*max(matA, haloM));
}`;

const PLAIN_VERT = /* glsl */`
varying vec3 vP, vW;
#include <fog_pars_vertex>
void main(){
  vP = position;
  vec4 w = modelMatrix*vec4(position, 1.);
  vW = w.xyz;
  vec4 mvPosition = viewMatrix*w;
  gl_Position = projectionMatrix*mvPosition;
  #include <fog_vertex>
}`;

// ------------------------------------------------------------------ the pool
const GLSL_WATERH = /* glsl */`
float waterH(vec2 p, float t){
  float r = length(p);
  float dome = 0.72*exp(-r*r/22.)*(0.76 + 0.24*sin(t*1.1) + 0.14*sin(t*2.7 + 1.));
  float rip = 0.065*sin(r*1.15 - t*1.7)*exp(-r*0.03)*smoothstep(1., 6., r);
  return dome + rip;
}`;
const POOL_VERT = /* glsl */`
varying vec3 vP, vW;
uniform float uTime;
${GLSL_WATERH}
#include <fog_pars_vertex>
void main(){
  vec3 q = position; q.y += waterH(q.xz, uTime);
  vP = q;
  vec4 w = modelMatrix*vec4(q, 1.);
  vW = w.xyz;
  vec4 mvPosition = viewMatrix*w;
  gl_Position = projectionMatrix*mvPosition;
  #include <fog_vertex>
}`;
const POOL_FRAG = /* glsl */`
varying vec3 vP, vW;
uniform vec3 uCSapph, uCTurq, uCEmer, uCDeep, uPortalPos, uPortalN;
uniform vec4 uPortalCol;
uniform float uHaze, uPoolGain;
#include <fog_pars_fragment>
${GLSL_COMMON}
${GLSL_WATERH}
float waterHf(vec2 p){
  float r = length(p); vec2 dr = p/max(r, 1e-3);
  float boil = (vnoise(p*0.55 + vec2(uTime*0.23, -uTime*0.19)) + vnoise(p*1.3 - vec2(uTime*0.31, uTime*0.27)))*exp(-r*r/240.);
  return waterH(p, uTime) + 0.15*boil + 0.022*vnoise(dr*9. + vec2(r*0.55 - uTime*0.75)) + 0.008*vnoise(p*2.3 + uTime*0.4);
}
void main(){
  vec2 p = vP.xz;
  float px = max(length(dFdx(p)), length(dFdy(p)));
  float tend; float d = eyeD(p, tend);
  float rr = length(p); vec2 dirp = p/max(rr, 1e-3);
  float e = (vnoise(p*0.3 + 3.) - 0.5)*2.5;
  float sc = mix(fract(d*0.55 + vnoise(p*0.33 + 2.)*3.0 + bnz(p*0.9, 1.1, px)*1.2), 0.5, smoothstep(0.08, 0.24, px));
  float aEdge = 1. - smoothstep(uRingA.w - 3.5, uRingA.w + 0.5, d + e*0.6 + sc*1.2);
  if (aEdge < 0.004) discard;
  float t1 = smoothstep(uRingA.x - 6., uRingA.x + 6., d + e);
  float t2 = smoothstep(uRingA.y - 3.5, uRingA.y + 2., d + e);
  float t3 = smoothstep(uRingA.z - 2.5, uRingA.z + 2.5, d + e);
  float core = 1. - smoothstep(2., 14., d);
  vec3 body = mix(uCSapph, uCTurq, t1);
  body = mix(body, uCEmer, t2);
  body = mix(body, uCDeep, core*mix(0.7, 1., uNight));
  float ledge = smoothstep(0.7, 1., fract(d*0.21 + e*0.25))*smoothstep(18., 28., d)*(1. - t3);
  body *= 1. + 0.2*ledge;
  float up = fbm2(dirp*7. + vec2(rr*0.12 - uTime*0.10) + uSeed.xy);
  body *= 0.86 + 0.3*up;
  body *= 1. + 0.16*sin(rr*1.15 - uTime*1.7)*exp(-rr*0.03)*smoothstep(1., 6., rr);
  float boil = vnoise(p*0.55 + vec2(uTime*0.23, -uTime*0.19))*vnoise(p*1.3 - vec2(uTime*0.31, uTime*0.27));
  body = mix(body, uCTurq*1.5 + 0.12, clamp(boil*3.4*exp(-rr*rr/110.), 0., 0.62)*(1. - uNight));   // the boil: pale water welling up and rolling outward
  // ripple normal
  float h0 = waterHf(p), hx = waterHf(p + vec2(0.2, 0.)), hz = waterHf(p + vec2(0., 0.2));
  vec2 g = vec2(hx - h0, hz - h0)/0.2;
  g *= 1. - smoothstep(0.3, 1.6, px)*0.85;
  vec3 N = normalize(vec3(-g.x, 1., -g.y));
  vec3 V = normalize(cameraPosition - vW);
  float lit = sunGate(vP.y);
  float sh = max(castShadow(p, px), geyShadow(p));
  vec3 E = uSunCol*0.34*lit*(1. - sh*0.8) + uSkyCol;
  vec3 c3 = body*E*uPoolGain;
  c3 *= 1. + clamp(-dot(g, uSunXZ)*5., -0.3, 0.6)*lit;
  vec3 R = reflect(-V, N); R.y = abs(R.y);
  vec3 sky = mix(uHorizon, uZenith, pow(clamp(R.y, 0., 1.), 0.6));
  float F = 0.02 + 0.98*pow(1. - max(dot(N, V), 0.), 5.);
  c3 = mix(c3, sky, F*0.85);
  c3 += uSunCol*pow(max(dot(R, uSunDir), 0.), 220.)*1.5*lit*(1. - sh);
  // the exit portal mirrored as a glow under it
  float dn = dot(R, uPortalN); dn = (dn < 0. ? -1. : 1.)*max(abs(dn), 1e-3);
  float tt = dot(uPortalPos - vP, uPortalN)/dn;
  vec3 hit = vP + R*tt;
  float pr = length(hit - uPortalPos)/max(uPortalCol.w, 0.1);
  float pg = step(0., tt)*(1. - smoothstep(0.6, 1.5, pr))*(0.35 + 0.65*smoothstep(0.3, 1.0, pr));
  c3 += uPortalCol.rgb*pg*(0.10 + F);
  gl_FragColor = vec4(max(c3, 0.), aEdge*(1. - 0.55*t3));
  vec3 pre = gl_FragColor.rgb;
  #include <fog_fragment>
  gl_FragColor.rgb = mix(gl_FragColor.rgb, pre, uHaze);
}`;

// ------------------------------------------------------------------ solids (cone, snags)
const SOLID_VERT = /* glsl */`
attribute vec4 aCol;
#ifdef SNAG
attribute vec3 aCenter;
uniform float uPxAngle;
#endif
#ifdef CONE
attribute float aFade;
varying float vFade;
#endif
varying vec3 vP, vW, vN;
varying vec4 vC;
#include <fog_pars_vertex>
void main(){
  vec3 q = position;
  #ifdef CONE
  vFade = aFade;
  #endif
  #ifdef SNAG
  vec3 off = q - aCenter;
  float rad = length(off);
  float dist = length(cameraPosition - (modelMatrix*vec4(aCenter, 1.)).xyz);
  float want = max(rad, 0.8*aCol.a*dist*uPxAngle);
  q = aCenter + off*(want/max(rad, 1e-4));
  #endif
  vP = q; vC = aCol;
  vN = normalize(mat3(modelMatrix)*normal + vec3(0., 1e-5, 0.));
  vec4 w = modelMatrix*vec4(q, 1.);
  vW = w.xyz;
  vec4 mvPosition = viewMatrix*w;
  gl_Position = projectionMatrix*mvPosition;
  #include <fog_vertex>
}`;
const SOLID_FRAG = /* glsl */`
varying vec3 vP, vW, vN;
varying vec4 vC;
#ifdef CONE
varying float vFade;
#endif
#include <fog_pars_fragment>
${GLSL_COMMON}
void main(){
  vec3 N = normalize(vN + vec3(0., 1e-5, 0.));
  if (!gl_FrontFacing) N = -N;
  vec3 V = normalize(cameraPosition - vW);
  float nz = fbm3(vP.xz*1.4 + vP.y*0.9);
  float bead = vnoise(vP.xz*6. + vP.y*5.);
  vec3 alb = vC.rgb*(0.78 + 0.3*nz + 0.14*(bead - 0.5));
  float lit = sunGate(vP.y);
  float ndl = max(dot(N, uSunDir), 0.);
  float sunT = mix(ndl*0.85 + 0.04, min(ndl*3. + 0.07, 0.85), smoothstep(0.3, 0.9, N.y));
  vec3 E = uSunCol*sunT*lit + uSkyCol*(0.55 + 0.45*N.y);
  vec3 c3 = alb*E;
  vec3 R = reflect(-V, N);
  #ifdef SNAG
  float wet = 0.;
  #else
  float wet = vC.a*(0.3 + 0.7*uGey.w);
  float gdr = length(vP.xz - uGey.xy);
  c3 *= 1. - 0.3*(1. - smoothstep(10., 34., length(vP.xz - uGey.xy - uWind*4.)))*(0.25 + 0.75*uGey.w)*smoothstep(5., 12., gdr);
  #endif
  c3 *= 1. - 0.3*wet;
  c3 += wet*(uSunCol*pow(max(dot(R, uSunDir), 0.), 40.)*0.9*lit + mix(uHorizon, uZenith, clamp(R.y, 0., 1.))*0.10);
  float rim = pow(1. - max(dot(N, V), 0.), 3.)*max(dot(-V, uSunDir), 0.);
  c3 += uSunCol*rim*0.35*lit;
  gl_FragColor = vec4(max(c3, 0.), 1.);
  #ifdef CONE
  gl_FragColor.a = vFade;
  #endif
  #include <fog_fragment>
}`;

function stair(y, step, sharp) { const s = y / step, f = s - Math.floor(s); return (Math.floor(s) + Math.min(1, Math.max(0, (f - (1 - sharp)) / sharp))) * step; }

// Beehive cone on the inner steps of its sinter apron, baked at geyser position (gx, gz) in spring-local space. The mesh
// ends at 14 m and fades out over its last five (aFade): the apron's outer terraces are drawn by the ground shader.
async function buildCone(ctx, rng, noise, gx, gz, C) {
  const NA = 96, rs = [];
  for (let i = 0; i < 5; i++) rs.push(0.75 * i / 5);
  for (let i = 0; i < 4; i++) rs.push(0.75 + 0.4 * i / 4);
  for (let i = 0; i < 18; i++) rs.push(1.15 + 3.35 * Math.pow(i / 18, 0.9));
  for (let i = 0; i < 6; i++) rs.push(4.5 + 2.5 * i / 6);
  for (let i = 0; i <= 7; i++) rs.push(7 + 7 * Math.pow(i / 7, 1.15));
  const NR = rs.length, a0 = rng.range(0, 6.28), a1 = rng.range(0, 6.28), a2 = rng.range(0, 6.28), ox = rng.range(0, 90), oz = rng.range(0, 90);
  const pos = new Float32Array(NR * NA * 3), colr = new Float32Array(NR * NA * 4), fade = new Float32Array(NR * NA), idx = [];
  const sinter = C.sinter, rust = C.rust, ora = C.orange, dark = C.dark, tmp = new THREE.Color();
  for (let j = 0; j < NR; j++) for (let i = 0; i < NA; i++) {
    if (i === 0 && (j & 1) === 1) await ctx.yield?.();                // every second ring
    const a = i / NA * Math.PI * 2, r = rs[j], ca = Math.cos(a), sa = Math.sin(a);
    const ell = 1 + 0.12 * Math.cos(a - a0) + 0.07 * Math.cos(2 * a + a1);
    const knob = noise.fbm2(ca * 2.2 + ox, sa * 2.2 + oz + r * 0.35, 3);
    const rb = r / (ell * (1 + 0.10 * knob * Math.min(1, r / 2)));
    const top = 4.0 * (1 + 0.10 * Math.cos(a - a2));
    let y;
    if (rb < 0.75) y = top - 0.12 - 2.6 * Math.pow(1 - rb / 0.75, 0.7);
    else if (rb < 4.5) {
      const s = (rb - 0.75) / 3.75; y = 0.55 + (top - 0.55) * (1 - Math.pow(s, 1.55)) - 0.18 * Math.exp(-s * 30);
      y = y * 0.5 + stair(y, 0.42, 0.45) * 0.5;
    } else {
      const s = Math.min(1, (rb - 4.5) / 18.5); y = 0.55 * Math.pow(1 - s, 1.7) * (1 - s * 0.2) - 0.09 * s;
      y = y * 0.3 + stair(y + 0.03 * knob, 0.075, 0.3) * 0.7;
    }
    const x = r * ca, z = r * sa;
    const flank = Math.min(1, Math.max(0, (r - 0.6) / 0.8)) * Math.min(1, Math.max(0, (9 - r) / 4));
    y += flank * (noise.fbm2(x * 0.9 + ox, z * 0.9 + oz, 3) * 0.22 + noise.n2(x * 4.5 + oz, z * 4.5 + ox) * 0.05);
    const k = (j * NA + i) * 3;
    pos[k] = gx + x; pos[k + 1] = y; pos[k + 2] = gz + z;
    // colour: pale geyserite, wet dark crown, rusty runoff streaks, dark throat
    const streak = noise.fbm2(ca * 5 + oz, sa * 5 + ox + r * 0.08, 2) * 0.5 + 0.5;
    const hi = Math.min(1, Math.max(0, y / 4));
    tmp.copy(sinter).multiplyScalar(0.72 + 0.2 * streak + 0.12 * hi);
    tmp.lerp(mixc(rust, ora, streak), Math.max(0, streak - 0.46) * 2.2 * (1 - hi * 0.6) * (r < 20 ? 1 : 0.4));
    if (rb < 0.75) tmp.lerp(dark, 0.85 * (1 - rb / 0.75) + 0.1);
    const c4 = (j * NA + i) * 4;
    fade[j * NA + i] = 1 - Math.min(1, Math.max(0, (r - 9 - 1.2 * knob) / 4.6));
    colr[c4] = tmp.r; colr[c4 + 1] = tmp.g; colr[c4 + 2] = tmp.b;
    colr[c4 + 3] = Math.min(1, Math.max(0, hi * 0.9 + (r < 9 ? 0.25 : 0.1) * streak));
  }
  for (let j = 0; j < NR - 1; j++) for (let i = 0; i < NA; i++) {
    const i1 = (i + 1) % NA, a = j * NA + i, b = j * NA + i1, c = (j + 1) * NA + i, d = (j + 1) * NA + i1;
    idx.push(a, b, c, b, d, c);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('aCol', new THREE.BufferAttribute(colr, 4));
  g.setAttribute('aFade', new THREE.BufferAttribute(fade, 1));
  await ctx.yield?.();
  g.setIndex(idx); g.computeVertexNormals();
  return g;
}

// Bleached "bobby-sock" snags: tapered leaning trunks, broken stubs, white silica socks. list: [{x,z,h,seed}]
function buildSnags(rng, list, C) {
  const pos = [], cen = [], colr = [], idx = [];
  const silver = C.snag, sock = C.sock, tc = new THREE.Color();
  const tube = (pts, radii, sides, ref, tint, widen) => {
    const base = pos.length / 3, n = pts.length;
    for (let j = 0; j < n; j++) {
      const p = pts[j], dir = (j < n - 1 ? pts[j + 1].clone().sub(p) : p.clone().sub(pts[j - 1])).normalize();
      const u = ref.clone().cross(dir).normalize(), v = dir.clone().cross(u);
      for (let i = 0; i < sides; i++) {
        const a = i / sides * Math.PI * 2, cu = Math.cos(a) * radii[j], sv = Math.sin(a) * radii[j];
        pos.push(p.x + u.x * cu + v.x * sv, p.y + u.y * cu + v.y * sv, p.z + u.z * cu + v.z * sv);
        cen.push(p.x, p.y, p.z);
        const k = Math.min(1, Math.max(0, (1.35 - p.y) / 0.45));
        tc.copy(silver).multiplyScalar(tint * (0.8 + 0.25 * ((i * 7 + j * 3) % 5) / 4)).lerp(sock, k);
        colr.push(tc.r, tc.g, tc.b, widen);
      }
    }
    for (let j = 0; j < n - 1; j++) for (let i = 0; i < sides; i++) {
      const i1 = (i + 1) % sides, a = base + j * sides + i, b = base + j * sides + i1, c = a + sides, d = b + sides;
      idx.push(a, b, c, b, d, c);
    }
  };
  const Z = new THREE.Vector3(0, 0, 1), Y = new THREE.Vector3(0, 1, 0);
  for (const t of list) {
    const r0 = 0.15 + 0.013 * t.h, lean = new THREE.Vector3(rng.range(-0.06, 0.06), 0, rng.range(-0.06, 0.06)), bend = rng.range(-0.5, 0.5);
    const spine = (s) => new THREE.Vector3(t.x + lean.x * s * t.h + bend * s * s * 0.5, s * t.h, t.z + lean.z * s * t.h - bend * s * s * 0.3);
    const pts = [], rad = [], M = 8;
    for (let j = 0; j < M; j++) { const s = Math.pow(j / (M - 1), 0.9); pts.push(spine(s)); rad.push(r0 * (1 - 0.82 * s) * (j === 0 ? 1.7 : j === 1 ? 1.15 : 1)); }
    pts[0].y = -0.3; pts[1].y = Math.max(pts[1].y * 0.35, 0.35);
    tube(pts, rad, 7, Z, rng.range(0.85, 1.05), 1);
    const nb = rng.int(5, 10);
    for (let b = 0; b < nb; b++) {
      const s = rng.range(0.3, 0.95), a = rng.range(0, 6.283), len = rng.range(0.5, 2.0) * (1.15 - s * 0.6), rb = r0 * (1 - 0.82 * s) * 0.42;
      const p0 = spine(s), out = new THREE.Vector3(Math.cos(a), rng.range(-0.25, 0.3), Math.sin(a));
      const p1 = p0.clone().addScaledVector(out, len * 0.55), p2 = p1.clone().addScaledVector(out, len * 0.45); p2.y += rng.range(-0.25, 0.12) * len;
      tube([p0, p1, p2], [rb, rb * 0.6, 0.012], 4, Y, rng.range(0.7, 1.0), 0.4);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('aCenter', new THREE.Float32BufferAttribute(cen, 3));
  g.setAttribute('aCol', new THREE.Float32BufferAttribute(colr, 4));
  g.setIndex(idx); g.computeVertexNormals();
  return g;
}

// ------------------------------------------------------------------ the eruption: jet, veil, spray
const JET_VERT = /* glsl */`
varying vec3 vP, vW, vN, vQ;
#include <fog_pars_vertex>
${GLSL_COMMON}
void main(){
  float ang = position.x, v = position.y, shell = position.z;
  float H = max(uGey.z, 0.3)*(1. - 0.07*shell), y = v*H;
  float k = sqrt(clamp(H/60., 0.01, 1.3));
  vec2 cs = vec2(cos(ang), sin(ang));
  float pulse = vnoise(cs*1.4 + vec2(y*0.06 - uTime*1.2, y*0.09 - uTime*1.7) + shell*7.);
  float r = (0.7 + 2.3*pow(v, 1.3))*k*(1. + 0.7*shell)*(0.75 + 0.55*pulse);
  float top = smoothstep(0.72, 1., v);
  float lobe = vnoise(cs*1.1 + uSeed.xy + uTime*0.12);
  r += top*top*(1. + 3.5*lobe)*k*(1. + 0.5*shell);
  y -= top*top*H*0.06*(1. - lobe);
  vec3 q = vec3(uGey.x + cs.x*r, y, uGey.y + cs.y*r);
  q.xz += uWind*(v*v*2.2*k) + vec2(sin(uTime*0.5 + v*3.), cos(uTime*0.4 + v*2.))*v*0.6*k;
  vP = q; vQ = vec3(ang, y, shell);
  vN = normalize(vec3(cs.x, -0.2 - top, cs.y));
  vec4 w = modelMatrix*vec4(q, 1.);
  vW = w.xyz;
  vec4 mvPosition = viewMatrix*w;
  gl_Position = projectionMatrix*mvPosition;
  #include <fog_vertex>
}`;
const JET_FRAG = /* glsl */`
varying vec3 vP, vW, vN, vQ;
uniform vec3 uSteamShade;
#include <fog_pars_fragment>
${GLSL_COMMON}
void main(){
  float y = vQ.y, shell = vQ.z, v = clamp(y/max(uGey.z, 0.3), 0., 1.);
  vec2 cs = vec2(cos(vQ.x), sin(vQ.x));
  vec3 N = normalize(vN + vec3(0., 1e-5, 0.));
  vec3 V = normalize(cameraPosition - vW);
  // the water itself: rolling knots climbing the jet, broad and soft. It is solid (no gaps to see through) and is lost in the
  // billows from two thirds of its height
  float s1 = fbm3(cs*1.6 + vec2(y*0.21 - uTime*2.4, y*0.26 - uTime*3.1) + shell*3.);
  float nv = abs(dot(N, V));
  float bk1 = max(dot(-V, uSunDir), 0.), bk = bk1*bk1;
  float lit = sunGate(vP.y);
  float a = smoothstep(0.04, 0.5, nv + (s1 - 0.5)*0.45)*(1. - smoothstep(0.6, 0.9, v))*mix(1., 0.55, shell);
  if (a < 0.004) discard;
  float wrap = clamp(dot(N, uSunDir)*0.75 + 0.35, 0., 1.);
  // under a high sun (the day look) the side away from it is a darker, greyer blue than the pale sky behind, and the lit
  // side is whiter
  float hiSun = smoothstep(0.3, 0.7, uSunDir.y)*(1. - uNight);
  vec3 shd = mix(uSteamShade, dot(uSteamShade, vec3(0.3333))*vec3(0.86, 0.93, 1.08), 0.5*hiSun)*(1. - 0.34*hiSun);
  float wr2 = mix(wrap*wrap, clamp(dot(cs, uSunXZ)*0.6 + 0.55, 0., 1.), hiSun);
  vec3 c3 = shd*(0.5 + 0.3*s1) + uSunCol*wr2*mix(0.4, 0.52, hiSun)*lit;
  c3 *= (0.8 + 0.4*s1)*(1. - 0.78*bk*lit*(1. - 0.5*hiSun));
  c3 = mix(c3, shd*(0.55 + 0.3*s1), 0.6*bk*lit*hiSun);              // seen against the sun the heart of the column is blue-grey
  gl_FragColor = vec4(max(c3, 0.), a);
  #include <fog_fragment>
}`;
// The veil: fine droplets falling all round the tower and drifting downwind (kind 1: streaks never under 1.6 pixels wide), in a
// soft haze of mist (kind 0: big faint discs). Where the eye, a drop and the sun make 42 degrees the veil carries a rainbow:
// it is worked out per pixel from the angle to the antisolar point, so the bow stands where a real one would.
const VEIL_VERT = /* glsl */`
attribute vec4 aA, aB;
uniform vec4 uCloud;
uniform float uPxAngle;
varying vec2 vUv;
varying vec4 vS;
varying vec3 vMV;
varying float vTh;
#include <fog_pars_vertex>
${GLSL_COMMON}
void main(){
  float kind = aB.x, T = aB.z, ph = fract(uTime/T + aB.w), t = ph*T;
  float H = max(uGey.z, 0.3), gk = clamp(H/60., 0.03, 1.2), sg = sqrt(gk);
  vec3 c = vec3(uGey.x + aA.x*sg, aA.y*gk, uGey.y + aA.z*sg);
  vec2 hw = vec2(aB.y);
  vec2 al = vec2(0., 1.);
  float alpha;
  if (kind < 0.5){
    c.y -= 5.*ph*gk; c.xz += uWind*t*0.55 + vec2(sin(t*0.4 + aA.w*30.), cos(t*0.33 + aA.w*17.))*1.5;
    hw *= mix(0.45, 1., gk)*(0.75 + 0.5*ph);
    alpha = smoothstep(0., 0.2, ph)*(1. - smoothstep(0.6, 1., ph));
  } else {
    float fall = 7.5*t;
    c.y = max(c.y - fall, 0.) + 0.4; c.xz += uWind*t*0.85;
    alpha = smoothstep(0., 0.08, ph)*smoothstep(0.3, 3., aA.y*gk - fall);
  }
  vec4 w = modelMatrix*vec4(c, 1.);
  vec4 mvPosition = viewMatrix*w;
  float dist = max(-mvPosition.z, 0.1);
  if (kind > 0.5){
    vec2 vv = (viewMatrix*modelMatrix*vec4(uWind.x*0.85, -7.5, uWind.y*0.85, 0.)).xy;
    float vl = length(vv); al = vl > 1e-3 ? vv/vl : vec2(0., -1.);
    float wpx = 0.8*dist*uPxAngle;                       // half of 1.6 pixels, in metres at this distance
    alpha *= min(1., hw.x/max(wpx, 1e-4))*0.75 + 0.25;
    hw = vec2(max(hw.x, wpx), hw.x*(7. + 6.*aA.w));
  }
  mvPosition.xy += al*position.y*hw.y + vec2(-al.y, al.x)*position.x*hw.x;
  vUv = position.xy; vMV = mvPosition.xyz;
  vTh = jetThick(mvPosition.xyz, c.y);
  alpha *= smoothstep(0.03, 0.55, uGey.w)*uCloud.z*smoothstep(3., kind < 0.5 ? 20. : 9., dist);
  vS = vec4(alpha, aA.w, c.y, kind);
  gl_Position = projectionMatrix*mvPosition;
  #include <fog_vertex>
}`;
const VEIL_FRAG = /* glsl */`
varying vec2 vUv;
varying vec4 vS;
varying vec3 vMV;
varying float vTh;
uniform vec3 uSteamShade;
#include <fog_pars_fragment>
${GLSL_COMMON}
void main(){
  float r2 = dot(vUv, vUv), lit = sunGate(vS.z);
  vec3 Vr = normalize(vMV), sv = normalize((viewMatrix*vec4(uSunDir, 0.)).xyz);
  float ca = dot(Vr, -sv), fw = max(-ca, 0.);
  // the primary bow, 42 degrees from the antisolar point: red outside, violet inside, about two degrees across
  float tb = (acos(clamp(ca, -1., 1.)) - 0.733)/0.034;
  vec3 bow = max(vec3(smoothstep(-0.7, 0.6, tb), 1. - abs(tb + 0.05)*0.85, smoothstep(0.45, -0.85, tb)), 0.)*exp(-tb*tb*1.3);
  bow *= uSunCol*0.42*lit*(1. - uNight*0.75);
  float a; vec3 c3, add;
  if (vS.w < 0.5){
    if (r2 > 1.) discard;
    float body = 1. - r2, n = fbm3(vUv*1.7 + vS.y*vec2(31., 57.) + vec2(0., uTime*0.05));
    float soft = body*body*smoothstep(0.15, 0.75, body*0.7 + n*0.6);
    a = soft*vS.x*0.04*(1. - 0.85*vTh);
    c3 = uSteamShade*0.85 + uSunCol*lit*(0.1 + 0.3*fw*fw*fw);
    add = bow*soft*vS.x*0.34;
  } else {
    float ax = 1. - vUv.x*vUv.x, ay = 1. - vUv.y*vUv.y;
    a = ax*ay*ay*vS.x*0.24*(1. - 0.9*vTh);
    c3 = uSteamShade*0.9 + uSunCol*lit*(0.2 + 0.55*fw*fw);
    add = bow*a*2.2;
  }
  if (a < 0.002 && dot(add, vec3(1.)) < 0.004) discard;
  gl_FragColor = vec4(max(c3, 0.)*a + add, a);
  #ifdef USE_FOG
  float ff = 1. - exp(-fogDensity*fogDensity*vFogDepth*vFogDepth);
  gl_FragColor.rgb = mix(gl_FragColor.rgb, fogColor*a, ff);
  #endif
}`;
const SPRAY_VERT = /* glsl */`
attribute vec4 aA, aB;
uniform vec4 uCloud;
varying vec2 vUv;
varying vec4 vS;
varying float vTh;
#include <fog_pars_vertex>
${GLSL_COMMON}
void main(){
  float T = aB.y, ph = fract(uTime/T + aB.x), t = ph*T;
  float H = max(uGey.z, 0.3), k = sqrt(clamp(H/60., 0.01, 1.3));
  float tau = 1.3, vt = 6.5, ex = exp(-t/tau), kk = tau*(1. - ex);
  vec2 dir = vec2(cos(aA.x), sin(aA.x));
  float vh = aA.z*k, vy = aA.w*k;
  vec3 c = vec3(uGey.x, H*aA.y, uGey.y);
  c.xz += dir*(1.2*k + vh*kk) + uWind*(t - kk);
  c.y += (vy + vt)*kk - vt*t;
  vec3 vel = vec3(dir.x*vh*ex + uWind.x*(1. - ex), (vy + vt)*ex - vt, dir.y*vh*ex + uWind.y*(1. - ex));
  vec4 w = modelMatrix*vec4(c, 1.);
  vec4 mvPosition = viewMatrix*w;
  vec2 al = (viewMatrix*modelMatrix*vec4(vel, 0.)).xy;
  float sl = length(al); al = sl > 1e-3 ? al/sl : vec2(0., -1.);
  float sz = aB.z*(0.9 + 1.3*ph)*mix(0.45, 1., k);
  float len = sz*(1.0 + 0.05*length(vel));
  mvPosition.xy += al*position.y*len + vec2(-al.y, al.x)*position.x*sz*0.55;
  vUv = position.xy;
  float alpha = smoothstep(0., 0.06, ph)*smoothstep(0., 5.*k + 0.3, c.y)*(1. - smoothstep(0.9, 1., ph))*smoothstep(4., 24., -mvPosition.z);
  vec3 toP = w.xyz - cameraPosition;
  float fw = max(dot(toP/max(length(toP), 1e-3), uSunDir), 0.);
  vS = vec4(alpha*uCloud.z, aB.w, c.y, fw*fw*fw);
  vTh = jetThick(mvPosition.xyz, c.y);
  gl_Position = projectionMatrix*mvPosition;
  #include <fog_vertex>
}`;
const SPRAY_FRAG = /* glsl */`
varying vec2 vUv;
varying vec4 vS;
varying float vTh;
uniform vec3 uSteamShade;
#include <fog_pars_fragment>
${GLSL_COMMON}
void main(){
  float r2 = dot(vUv, vUv);
  if (r2 > 1.) discard;
  float body = 1. - r2, ax = body, ay = body;
  float n = vnoise(vUv*1.6 + vS.y*vec2(31., 17.)), n2 = vnoise(vUv*3.4 + vS.y*vec2(5., -9.));
  float a = body*smoothstep(0.3, 0.8, body*0.75 + n*0.4 + n2*0.2)*vS.x*0.3*(1. - 0.6*vTh);
  if (a < 0.003) discard;
  float lit = sunGate(vS.z);
  float th = vTh*vS.w;
  vec3 c3 = (uSteamShade*0.7*(1. - 0.6*th) + uSunCol*0.2*lit*(1. - 0.95*th + (0.6*vS.w + 1.5*vS.w*vS.w*vS.w*vS.w)*(1. - th)*(1. - th))*(1. - 0.5*vS.w*ax*ay))*(0.75 + 0.5*n2);
  gl_FragColor = vec4(max(c3, 0.), a);
  #include <fog_fragment>
}`;

// ------------------------------------------------------------------ vapour sprites and ice glitter
const STEAM_VERT = /* glsl */`
attribute vec3 aO, aTint;
attribute vec4 aP, aQ;
uniform float uSteamK, uVeilK;
uniform vec4 uCloud;
varying vec2 vUv;
varying vec4 vS;
varying vec3 vTint, vSunS;
varying float vY, vR, vSoft, vTh, vColL;
#include <fog_pars_vertex>
${GLSL_COMMON}
void main(){
  float ph = fract(uTime/aP.y + aP.x), t = ph*aP.y;
  float kind = aQ.y, gk = 1., al = aQ.w;
  vec3 c = aO;
  bool gey = kind > 1.5 && kind < 2.5;
  float grow = sqrt(ph), drift = 0.3 + 0.7*ph, szk = 1., rise = 1.;
  if (gey){
    gk = clamp(max(uGey.z, 0.3)/60., 0.03, 1.2);
    float sg = sqrt(gk);
    c = vec3(uGey.x + aO.x*sg, aO.y*gk, uGey.y + aO.z*sg);
    // the cloud above the jet (rise > 40 m) stays a column, opens out only toward its top and leans away late;
    // uCloud = (its alpha, size of all the jet's vapour, alpha of spray and veil) lets the world draw the eruption
    // tighter while the camera crosses its lee
    float hi = step(40., aQ.x);
    al *= mix(0.3, 1., smoothstep(0.03, 0.6, uGey.w))*mix(1., uCloud.x, hi);
    grow = mix(grow, ph, hi);
    drift = mix(drift, (0.05 + 0.95*ph*ph)*(1. - 0.7*uCloud.w), hi);
    szk = uCloud.y*(1. - 0.34*hi*uCloud.w);
    rise = 1. - 0.74*hi*uCloud.w;
    // the tower's own billows (rise under 40 m) lean with the jet, drift little, and are lit as one column: bright on the
    // side of the axis that faces the sun, blue-grey on the other
    float vv = aO.y/60.;
    c.xz += uWind*(vv*vv*2.2*sg)*(1. - hi);
    drift *= mix(0.5, 1., hi);
    vColL = mix(clamp(dot(aO.xz/max(length(aO.xz), 1e-3), uSunXZ)*smoothstep(0.2, 2., length(aO.xz))*0.5 + 0.5, 0., 1.), -1., hi);
  } else {
    vColL = -1.;
    if (kind < 0.9) al *= uVeilK;                 // the spring's veil and column: the world thins them while it flies low across the pool
  }
  float sk = gey ? mix(0.3, 1., gk) : 1.;
  float size = mix(aP.z, aP.w, grow)*sk*szk;
  c.y += aQ.x*sk*rise*(1. - pow(1. - ph, 1.6));
  c.xz += uWind*t*drift + vec2(sin(t*0.37 + aQ.z*40.), cos(t*0.31 + aQ.z*23.))*size*0.12;
  vec4 w = modelMatrix*vec4(c, 1.);
  vec4 mvPosition = viewMatrix*w;
  float ra = aQ.z*6.283 + t*0.04*(aQ.z - 0.5);
  float cr = cos(ra), sr = sin(ra);
  vec2 off = vec2(cr*position.x - sr*position.y, sr*position.x + cr*position.y);
  mvPosition.xy += off*size;
  vec3 sv = (viewMatrix*vec4(uSunDir, 0.)).xyz;
  vSunS = vec3(cr*sv.x + sr*sv.y, -sr*sv.x + cr*sv.y, sv.z);
  vUv = position.xy;
  vY = c.y + off.y*size*0.9;
  vR = size;
  vSoft = step(kind, 0.5) + step(2.5, kind);
  float alpha = al*smoothstep(0., 0.12, ph)*(1. - smoothstep(0.5, 1., ph))*smoothstep(2., 12. + size*2., -mvPosition.z);
  vec3 toP = w.xyz - cameraPosition;
  float fw = max(dot(toP/max(length(toP), 1e-3), uSunDir), 0.);
  // thin summer steam is for the fumaroles and the spring's veil: the tower's own billows never fall below their dawn
  // weight, and the cloud standing above it thins only a little
  float stK = gey ? max(uSteamK, mix(1., 0.8, step(40., aQ.x))) : uSteamK;
  vS = vec4(min(alpha*stK, 0.9), aQ.z, c.y, fw*fw);
  vTh = gey ? jetThick(mvPosition.xyz, c.y)*smoothstep(0.25, 0.8, fw*fw) : 0.;
  vTint = mix(vec3(1.), aTint, (1. - smoothstep(2., 27., c.y))*step(kind, 0.5) + 0.25*step(0.5, kind)*step(kind, 1.5)*(1. - smoothstep(10., 60., c.y)) + step(2.5, kind));
  gl_Position = projectionMatrix*mvPosition;
  #include <fog_vertex>
}`;
const STEAM_FRAG = /* glsl */`
uniform vec3 uSteamShade;
varying vec2 vUv;
varying vec4 vS;
varying vec3 vTint, vSunS;
varying float vY, vR, vSoft, vTh, vColL;
#include <fog_pars_fragment>
${GLSL_COMMON}
void main(){
  float r2 = dot(vUv, vUv);
  if (r2 > 1.) discard;
  float body = 1. - r2;
  float n = fbm4(vUv*2.3 + vS.y*vec2(37., 91.) + vec2(0., -uTime*0.035));
  float core = smoothstep(mix(0.25, 0.06, vSoft), mix(0.62, 0.92, vSoft), body*0.85 + (n - 0.5)*mix(1.25, 0.5, vSoft));
  float a = core*smoothstep(0., 0.35, body)*mix(1., body, vSoft*0.65)*vS.x*smoothstep(0., min(3., vR*0.4), vY);
  if (a < 0.003) discard;
  vec3 nrm = normalize(vec3(vUv*0.95, 0.5));
  float ndl = clamp(dot(nrm, vSunS)*0.6 + 0.4, 0., 1.);
  float lit = sunGate(vS.z);
  vec3 c3 = mix(uSteamShade, uSteamShade*0.45 + uSunCol*0.3, ndl*lit);
  // under a high sun the sky behind the tower is pale, so its shaded side is drawn a darker, greyer blue than the sky
  float hiSun = smoothstep(0.3, 0.7, uSunDir.y)*(1. - uNight);
  vec3 shd = mix(uSteamShade, dot(uSteamShade, vec3(0.3333))*vec3(0.86, 0.93, 1.08), 0.5*hiSun)*(1. - 0.34*hiSun);
  if (vColL >= 0.){
    // the tower: each billow is round (its own shading) and the column as a whole has a sunlit flank and a blue-grey one
    float nd2 = clamp(mix(ndl, vColL, 0.6)*1.15 - 0.05, 0., 1.);
    nd2 = mix(nd2, smoothstep(0.3, 0.9, nd2), hiSun);      // midday: every billow has a lit crown and a clear blue-grey underside
    c3 = mix(shd*(0.5 + 0.2*body), uSteamShade*0.3 + uSunCol*mix(0.5, 0.62, hiSun), nd2*lit);
  }
  c3 *= (0.8 + 0.36*n)*vTint;
  float f6 = vS.w*vS.w*vS.w; f6 *= f6;             // straight toward the sun: a dim blue-grey heart inside a burning edge
  float dk = max(0.45*f6*core*body, 0.86*vTh)*lit;
  c3 = mix(c3*(1. - dk), mix(c3, shd*0.72, dk*0.85), hiSun);
  c3 += uSunCol*lit*(vS.w*0.5 + f6*0.7)*(1. - core*body)*(1. - 0.6*core*vS.w)*(1. - vTh)*(1. - vTh);
  a = min(a*(1. + 0.8*vTh), 0.95);                       // and it closes up: no bright sky through the column's heart
  // the torn fringe round that dark heart burns gold. It is added light (the output is premultiplied), so it shows however
  // thin the vapour is there
  float band = 4.*vTh*(1. - vTh);
  vec3 add = uSunCol*lit*f6*band*(0.08 + 0.24*(1. - core))*smoothstep(0., 0.3, body);
  gl_FragColor = vec4(max(c3, 0.)*a + add, a);
  #ifdef USE_FOG
  float ff = 1. - exp(-fogDensity*fogDensity*vFogDepth*vFogDepth);
  gl_FragColor.rgb = mix(gl_FragColor.rgb, fogColor*a, ff);
  #endif
}`;
const GLITTER_VERT = /* glsl */`
attribute vec3 aO;
attribute vec4 aP;
uniform vec2 uPx;
varying vec2 vUv;
varying float vA;
${GLSL_COMMON}
void main(){
  float t = uTime + aP.x*40.;
  vec3 c = aO;
  c.y = aO.y - mod(t*aP.z, 60.) + 30.;
  c.xz += uWind*mod(t, 30.)*0.6 + vec2(sin(t*0.6 + aP.w*20.), cos(t*0.5 + aP.w*31.))*2.;
  vec4 w = modelMatrix*vec4(c, 1.);
  vec4 mvPosition = viewMatrix*w;
  gl_Position = projectionMatrix*mvPosition;
  gl_Position.xy += position.xy*uPx*1.8*gl_Position.w;
  float tw = max(sin(t*aP.y + aP.w*50.), 0.); tw *= tw; tw *= tw; tw *= tw;
  float dz = -mvPosition.z;
  vA = tw*smoothstep(1.5, 6., dz)*(1. - smoothstep(60., 130., dz))*sunGate(c.y)*smoothstep(4., 12., c.y)*(1. - uNight*0.6);
  vUv = position.xy;
}`;
const GLITTER_FRAG = /* glsl */`
varying vec2 vUv;
varying float vA;
${GLSL_COMMON}
void main(){
  float d = max(1. - dot(vUv, vUv), 0.);
  gl_FragColor = vec4(uSunCol*1.3*d*d*max(vA, 0.), 1.);
}`;

function quadGeometry(instanced) {
  const g = instanced ? new THREE.InstancedBufferGeometry() : new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, -1, 1, 0, 1, 1, 0], 3));
  g.setIndex([0, 1, 2, 2, 1, 3]);
  return g;
}
function inst(g, name, arr, size) { g.setAttribute(name, new THREE.InstancedBufferAttribute(new Float32Array(arr), size)); }

// ------------------------------------------------------------------ build
export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng.fork('prismatic-eye'), noise = ctx.noise, detail = ctx.quality?.detail ?? 1;
  const pal = (opts.palette && opts.palette.length >= 7 ? opts.palette : DEFAULT_PALETTE).map(col);
  const hour = opts.hour || 'dawn', season = opts.season || 'autumn', weather = opts.weather || 'breeze';
  const night = hour === 'night', winter = season === 'winter', summer = season === 'summer' || hour === 'day';
  pal[0].offsetHSL(rng.range(-0.015, 0.015), 0, 0); pal[3].offsetHSL(rng.range(-0.012, 0.014), 0, 0);
  const C = {
    sapph: pal[0].clone(), emer: pal[1].clone(), yel: pal[2].clone(), orange: mixc(pal[3], pal[2], 0.16),
    sinter: pal[4].clone(), cream: pal[5].clone(), dark: pal[6].clone(),
    turq: mixc(mixc(pal[0], pal[1], 0.5), col('#35c2e0'), 0.3), deep: mixc(pal[0], pal[6], 0.55), rust: mixc(pal[3], pal[6], 0.38),
    meadow: col('#A8925A'), moss: col('#5E7A34'), frost: col('#D2DAE6'), snag: col('#8E8A82'), sock: col('#E9E7E0'),
  };
  if (winter) { C.yel.lerp(col('#4d6b2f'), 0.75); C.orange.lerp(col('#8a4a22'), 0.7); C.rust.lerp(col('#3a2416'), 0.5); C.meadow.lerp(C.frost, 0.6); }
  if (summer) { C.orange.offsetHSL(0, 0.05, 0.03); C.meadow.copy(col('#6f8a3c')); }
  const L = ({
    dawn: { dir: [Math.cos(0.0873), Math.sin(0.0873), 0], sun: ['#FFDDAE', 2.6], sky: ['#6F93C8', 1.1], zen: '#2A4E86', hor: '#E8B9A0' },
    evening: { dir: [-Math.cos(0.105), Math.sin(0.105), 0.05], sun: ['#FFC58A', 2.6], sky: ['#6A86C0', 1.0], zen: '#27437A', hor: '#F0A878' },
    day: { dir: [0.45, 0.8, 0.4], sun: ['#FFF3DC', 1.5], sky: ['#86AEE6', 1.0], zen: '#2F68C0', hor: '#BFD8F0' },
    night: { dir: [-0.5, 0.62, 0.6], sun: ['#A9BEEA', 0.55], sky: ['#22345C', 0.6], zen: '#050A18', hor: '#16233F' },
  })[hour] || null;
  const L0 = L || { dir: [Math.cos(0.0873), Math.sin(0.0873), 0], sun: ['#FFDDAE', 2.6], sky: ['#6F93C8', 1.1], zen: '#2A4E86', hor: '#E8B9A0' };

  const gxz = opts.geyser || [111, 58], gx = gxz[0], gz = gxz[1], jetH = opts.jetHeight ?? 60;
  const surge = opts.surge || [0.16, 0.23];
  const steamK = (opts.steam ?? 1) * (winter ? 3 : 1) * (summer ? 0.5 : 1);
  const windSpeed = weather === 'still' ? 0 : rng.range(1.7, 2.3);
  const wind = new THREE.Vector2(rng.range(-0.22, 0.22) * windSpeed, windSpeed);       // toward the south
  const rs = 1 + rng.range(-0.035, 0.035);
  const rings = { sapphire: 30 * rs, turquoise: 42 * rs * rng.range(0.97, 1.03), emerald: 48 * rs, yellow: 54 * rs, orange: 66 * rs * rng.range(0.97, 1.04), rust: 90 * rs };
  const fanAng = (36 + rng.range(-5, 5)) * Math.PI / 180, fanDir = [Math.cos(fanAng), Math.sin(fanAng)], fanHalf = rng.range(0.22, 0.29);
  const hoofA = rng.range(-1.25, -0.4), hoofT = hoofA + Math.PI / 2 + rng.range(-0.3, 0.3), hoofR = rings.orange + rng.range(3, 9);
  const hoofM = [Math.cos(hoofA) * hoofR, Math.sin(hoofA) * hoofR], hoofD = [Math.cos(hoofT) * 72, Math.sin(hoofT) * 72];
  const hoof = new THREE.Vector4(hoofM[0] - hoofD[0], hoofM[1] - hoofD[1], hoofM[0] + hoofD[0], hoofM[1] + hoofD[1]);

  const casts = []; for (let i = 0; i < NCAST; i++) casts.push(new THREE.Vector4(1e5, 1e5, 0, 0.02));
  const U = {
    uTime: { value: 0 }, uSunDir: { value: new THREE.Vector3(1, 0.09, 0).normalize() }, uSunCol: { value: new THREE.Vector3(2.6, 2, 1.3) },
    uSkyCol: { value: new THREE.Vector3(0.18, 0.32, 0.63) }, uZenith: { value: new THREE.Vector3() }, uHorizon: { value: new THREE.Vector3() },
    uSunXZ: { value: new THREE.Vector2(1, 0) }, uShadowY: { value: -100 }, uShadowLen: { value: 11.4 }, uNight: { value: night ? 1 : 0 },
    uSeed: { value: new THREE.Vector4(rng.range(0, 50), rng.range(0, 50), rng.range(0, 50), rng.range(0, 50)) },
    uRingA: { value: new THREE.Vector4(rings.sapphire, rings.turquoise, rings.emerald, rings.yellow) },
    uRingB: { value: new THREE.Vector4(rings.orange, rings.rust, 0, 0) },
    uGey: { value: new THREE.Vector4(gx, gz, jetH, 1) }, uWind: { value: wind }, uCast: { value: casts },
    uSteamK: { value: steamK }, uEdge: { value: summer ? 1 : 0 }, uVeilK: { value: 1 }, uCloud: { value: new THREE.Vector4(1, 1, 1, 0) }, uSteamShade: { value: new THREE.Vector3(0.3, 0.42, 0.7) },
    uHaze: { value: opts.hazeExempt ?? 0.7 }, uFrost: { value: summer ? 0 : winter ? 1.3 : 1 }, uPoolGain: { value: night ? 0.9 : 1.55 },
    uCSinter: { value: C.sinter }, uCYel: { value: C.yel }, uCOra: { value: C.orange }, uCRust: { value: C.rust }, uCMeadow: { value: C.meadow },
    uCFrost: { value: C.frost }, uCDark: { value: C.dark }, uCMoss: { value: C.moss }, uCSapph: { value: C.sapph }, uCTurq: { value: C.turq },
    uCEmer: { value: C.emer }, uCDeep: { value: C.deep },
    uFan: { value: new THREE.Vector3(fanDir[0], fanDir[1], fanHalf) }, uHoof: { value: hoof },
    uRiver: { value: new THREE.Vector4(...(opts.river || [0, 0, 90, -1])) },
    uPortalPos: { value: new THREE.Vector3(0, 9, 0) }, uPortalN: { value: new THREE.Vector3(0.4545, 0.766, -0.4545).normalize() },
    uCreek: { value: new THREE.Vector4(...(opts.creek || [38.6, 16.6, 86.9, 1])) },
    uPortalCol: { value: new THREE.Vector4(1.0, 0.88, 0.7, 7) }, uPx: { value: new THREE.Vector2(0.0025, 0.0044) }, uPxAngle: { value: 0.0027 },
  };
  const sunDirLocal = new THREE.Vector3();
  function setLight(o = {}) {
    if (o.sunDir) {
      const d = o.sunDir.isVector3 ? o.sunDir : new THREE.Vector3(o.sunDir[0], o.sunDir[1], o.sunDir[2]);
      sunDirLocal.copy(d).normalize(); U.uSunDir.value.copy(sunDirLocal);
      const h = Math.hypot(sunDirLocal.x, sunDirLocal.z);
      if (h > 1e-3) U.uSunXZ.value.set(sunDirLocal.x / h, sunDirLocal.z / h);
      U.uShadowLen.value = Math.min(19, 1 / Math.tan(Math.max(0.052, Math.asin(Math.min(1, Math.max(0, sunDirLocal.y))))));
    }
    const setC = (u, c, k = 1) => { if (c == null) return; const cc = c.isColor ? c : Array.isArray(c) ? new THREE.Color(c[0], c[1], c[2]) : col(c); u.value.set(cc.r * k, cc.g * k, cc.b * k); };
    setC(U.uSunCol, o.sunColor, o.sunIntensity ?? 1); setC(U.uSkyCol, o.skyColor, o.skyIntensity ?? 1); setC(U.uZenith, o.zenith); setC(U.uHorizon, o.horizon);
    if (o.skyColor != null) { const s = U.uSkyCol.value, l = (s.x + s.y + s.z) / 3; U.uSteamShade.value.set(s.x + (l - s.x) * 0.45, s.y + (l - s.y) * 0.45, s.z + (l - s.z) * 0.45).multiplyScalar(1.45); }
    if (o.shadowY != null) U.uShadowY.value = o.shadowY;
  }
  setLight({ sunDir: opts.sunDir || L0.dir, sunColor: L0.sun[0], sunIntensity: L0.sun[1], skyColor: L0.sky[0], skyIntensity: L0.sky[1], zenith: L0.zen, horizon: L0.hor });

  const root = new THREE.Group(); root.name = 'prismatic-eye';
  const fogU = () => THREE.UniformsUtils.clone(THREE.UniformsLib.fog);
  const mat = (vs, fs, extra = {}) => new THREE.ShaderMaterial({ uniforms: { ...fogU(), ...U }, vertexShader: vs, fragmentShader: fs, fog: true, ...extra });
  let tris = 0;
  const add = (mesh, order, cull = false) => { mesh.renderOrder = order; mesh.frustumCulled = cull; root.add(mesh); const g = mesh.geometry, n = (g.index ? g.index.count : g.attributes.position.count) / 3; tris += n * (g.isInstancedBufferGeometry ? g.instanceCount : 1); return mesh; };

  // ground sheet: one quad, everything per pixel
  {
    const g = new THREE.BufferGeometry(), x0 = -195, x1 = 292, z0 = -195, z1 = 258;
    g.setAttribute('position', new THREE.Float32BufferAttribute([x0, 0, z0, x1, 0, z0, x0, 0, z1, x1, 0, z1], 3));
    g.setIndex([0, 2, 1, 1, 2, 3]);
    add(new THREE.Mesh(g, mat(PLAIN_VERT, GROUND_FRAG, { transparent: true })), -6);
  }
  // pool: polar disc, denser toward the vent, displaced by the dome and ripples
  {
    const NA = 96, NR = 40, R = rings.yellow + 12, pos = [], idx = [];
    for (let j = 0; j <= NR; j++) for (let i = 0; i < NA; i++) { const r = R * Math.pow(j / NR, 1.35), a = i / NA * Math.PI * 2; pos.push(Math.cos(a) * r, 0.08, Math.sin(a) * r); }
    for (let j = 0; j < NR; j++) for (let i = 0; i < NA; i++) { const i1 = (i + 1) % NA, a = j * NA + i, b = j * NA + i1, c = a + NA, d = b + NA; idx.push(a, b, c, b, d, c); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx);
    add(new THREE.Mesh(g, mat(POOL_VERT, POOL_FRAG, { transparent: true, depthWrite: false })), -5);
  }
  await ctx.yield?.();
  // cone
  add(new THREE.Mesh(await buildCone(ctx, rng.fork('cone'), noise, gx, gz, C), mat(SOLID_VERT, SOLID_FRAG, { defines: { CONE: 1 }, transparent: true })), 0, true);
  await ctx.yield?.();

  // the route in local metres (see header): bank run, rise, the turn round the tower, the spiral in over the Eye, the dive.
  // The turn is drawn round the jet where the sun's ray crosses it (the jet leans downwind), sized so that the camera, the tower
  // and a sun in the east line up at the same place on the path whatever the wind: u = 0.42 of the world's route
  const fly = [[131, 3, 268], [131, 3, 213], [131, 3, 158], [gx + 34, 7, gz + 62]];
  const lean = wind.y * 1.45, r1 = 37.2 - lean * 0.7, r2 = 55;
  const turnH = [12, 16.5, 21, 26, 31.5, 37, 43, 52, 62, 73, 84, 92.5, 97, 97];       // height every 30 degrees of the turn
  for (let i = 0; i <= 13; i++) {
    const th = i * 30, a = th * Math.PI / 180, r = th <= 150 ? r1 : th >= 300 ? r2 : r1 + (r2 - r1) * (0.5 - 0.5 * Math.cos((th - 150) / 150 * Math.PI));
    fly.push([gx + r * Math.cos(a), turnH[i], gz - r * Math.sin(a)]);
  }
  const crest = fly[fly.length - 1].slice();
  {
    // spiral in: the vent stays 60 degrees to the left of the heading, closing to 13 as the rings come under us (the tip-over)
    const beta = Math.PI / 3, rEnd = 45, yEnd = 9 + 70 * Math.sin(50 * Math.PI / 180), run = [[crest[0], crest[2]]];
    let x = crest[0], z = crest[2];
    for (let k = 0; k < 4000 && Math.hypot(x, z) > rEnd; k++) {
      const hd = Math.atan2(-z, -x) + beta * (0.22 + 0.78 * smooth(rEnd + 4, 110, Math.hypot(x, z)));
      x += Math.cos(hd) * 0.25; z += Math.sin(hd) * 0.25; run.push([x, z]);
    }
    const n = Math.round((run.length - 1) * 0.25 / 21);
    for (let i = 1; i <= n; i++) { const t = i / n, q = run[Math.round(t * (run.length - 1))]; fly.push([q[0], crest[1] + (yEnd - crest[1]) * t * (0.4 + 0.6 * t), q[1]]); }
  }
  const hookEnd = fly[fly.length - 1];
  const diveLen = 70, dive = new THREE.Vector3(-hookEnd[0], 0, -hookEnd[2]).normalize().multiplyScalar(Math.cos(50 * Math.PI / 180)); dive.y = -Math.sin(50 * Math.PI / 180);
  const seat = new THREE.Vector3(0, 9, 0);
  hookEnd[0] = seat.x - dive.x * diveLen; hookEnd[1] = seat.y - dive.y * diveLen; hookEnd[2] = seat.z - dive.z * diveLen;
  fly.push([seat.x - dive.x * 35, seat.y - dive.y * 35, seat.z - dive.z * 35], [seat.x, seat.y, seat.z]);
  U.uPortalPos.value.copy(seat); U.uPortalN.value.copy(dive).negate();
  const flyDist = (x, y, z) => { let best = 1e9; for (let i = 0; i < fly.length - 1; i++) { const a = fly[i], b = fly[i + 1]; for (let k = 0; k <= 8; k++) { const t = k / 8, dx = a[0] + (b[0] - a[0]) * t - x, dy = a[1] + (b[1] - a[1]) * t - y, dz = a[2] + (b[2] - a[2]) * t - z; best = Math.min(best, Math.hypot(dx, dy, dz)); } } return best; };
  await ctx.yield?.();

  // snags on the runoff flats and round the skirt (sun side first, so their shadows cross the mats)
  const snags = [];
  if (opts.snags !== false) {
    const want0 = rng.int(11, 14), want = opts.snagCount ?? want0, sr = rng.fork('snags'), flyS = opts.route || null;
    const clear = (x, y, z) => { if (!flyS) return flyDist(x, y, z); let best = 1e9; for (let i = 0; i < flyS.length - 1; i++) { const a = flyS[i], b = flyS[i + 1]; for (let k = 0; k < 4; k++) { const t = k / 4, dx = a[0] + (b[0] - a[0]) * t - x, dy = a[1] + (b[1] - a[1]) * t - y, dz = a[2] + (b[2] - a[2]) * t - z; best = Math.min(best, Math.hypot(dx, dy, dz)); } } return best; };
    for (let tries = 0; tries < 900 && snags.length < want; tries++) {
      let x, z; const zone = sr();
      if (zone < 0.3) { const a = sr.range(70, 150), c = sr.range(-1, 1) * (8 + a * 0.2); x = fanDir[0] * a - fanDir[1] * c; z = fanDir[1] * a + fanDir[0] * c; }
      else if (zone < 0.62 || snags.length < 12) { const a = sr() < 0.7 ? sr.range(-1.0, 1.3) : sr.range(1.3, 5.2), r = sr.range(rings.rust - 8, rings.rust + 34); x = Math.cos(a) * r; z = Math.sin(a) * r; }
      else { const a = sr.range(1.75, 5.76), r = sr.range(124, 186); x = Math.cos(a) * r; z = Math.sin(a) * r; }      // the far flats south, west and north: loose groups of silver poles
      const h = sr.range(6.5, 14);
      if (x > 86 || Math.hypot(x - gx, z - gz) < 56 || Math.hypot(x, z) < rings.orange + 10) continue;
      if (snags.some((s) => Math.hypot(s.x - x, s.z - z) < 7)) continue;
      if (clear(x, h * 0.5, z) < 13 || clear(x, h, z) < 13) continue;
      snags.push({ x, z, height: h, h });
      if (tries % 60 === 59) await ctx.yield?.();
    }
    await ctx.yield?.();
    if (snags.length) add(new THREE.Mesh(buildSnags(sr, snags, C), mat(SOLID_VERT, SOLID_FRAG, { defines: { SNAG: 1 } })), 0);
    snags.forEach((s, i) => { if (i < NCAST - 10) casts[i].set(s.x, s.z, s.h, 0.17 + 0.012 * s.h); });
  }
  const staticCasts = Math.min(snags.length, NCAST - 10);
  (opts.casters || []).slice(0, NCAST - 10 - staticCasts).forEach((c, i) => casts[staticCasts + i].set(c.x, c.z, c.height ?? 2, c.radius ?? 0.6));
  await ctx.yield?.();

  // ---- the eruption
  const tm = { transparent: true, depthWrite: false, side: THREE.DoubleSide };
  {
    const NA = 24, NV = 44, pos = [], idx = [];
    for (let s = 0; s < 2; s++) {
      const base = pos.length / 3;
      for (let j = 0; j <= NV; j++) for (let i = 0; i <= NA; i++) pos.push(i / NA * Math.PI * 2, j / NV, s);
      for (let j = 0; j < NV; j++) for (let i = 0; i < NA; i++) { const a = base + j * (NA + 1) + i, b = a + 1, c = a + NA + 1, d = c + 1; idx.push(a, c, b, b, c, d); }
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx);
    add(new THREE.Mesh(g, mat(JET_VERT, JET_FRAG, tm)), 2);
  }
  await ctx.yield?.();
  const windAz = windSpeed > 0 ? Math.atan2(wind.y, wind.x) : rng.range(0, 6.283);
  {
    // the veil: 64 discs of mist within 32 m of the tower (thicker downwind) and 1300 falling drops
    const vr = rng.fork('veil'), nM = Math.round(64 * detail), nD = Math.round(420 * detail), aA = [], aB = [];
    for (let i = 0; i < nM; i++) {
      const r = 4 + 22 * Math.sqrt(vr()), a = vr() < 0.45 ? windAz + vr.gauss() * 0.9 : vr.range(0, 6.283);
      aA.push(Math.cos(a) * r, vr.range(5, 46), Math.sin(a) * r, vr()); aB.push(0, vr.range(7, 12), vr.range(9, 14), vr());
    }
    for (let i = 0; i < nD; i++) {
      const r = 4 + 15 * Math.pow(vr(), 0.7), a = vr() < 0.62 ? windAz + vr.gauss() * 0.8 : vr.range(0, 6.283), h0 = 60 * vr.range(0.35, 0.98);
      aA.push(Math.cos(a) * r, h0, Math.sin(a) * r, vr()); aB.push(1, vr.range(0.035, 0.06), h0 / 7.5 + vr.range(0.2, 1.4), vr());
    }
    const g = quadGeometry(true); inst(g, 'aA', aA, 4); inst(g, 'aB', aB, 4); g.instanceCount = nM + nD;
    add(new THREE.Mesh(g, mat(VEIL_VERT, VEIL_FRAG, { ...tm, premultipliedAlpha: true })), 6);
  }
  await ctx.yield?.();
  {
    const n = Math.round(520 * detail), aA = [], aB = [], nl = rng.int(6, 8), lobes = [];
    let wsum = 0;
    for (let i = 0; i < nl; i++) { const az = i / nl * 6.283 + rng.range(-0.3, 0.3), down = 0.5 + 0.5 * Math.cos(az - windAz); const w = 0.6 + 1.6 * down; wsum += w; lobes.push({ az, vh: rng.range(5, 10.5), vy: rng.range(3, 9), w }); }
    for (let i = 0; i < n; i++) {
      if (rng() < 0.16) aA.push(rng.range(0, 6.283), rng.range(0.88, 1.0), rng.range(0.4, 2), rng.range(8, 14));
      else { let r = rng() * wsum, l = lobes[0]; for (const q of lobes) { r -= q.w; if (r <= 0) { l = q; break; } } aA.push(l.az + rng.gauss() * 0.2, rng.range(0.72, 0.98), l.vh * rng.range(0.6, 1.15), l.vy * rng.range(0.6, 1.2)); }
      aB.push(rng(), rng.range(9, 12), rng.range(1.5, 3.2), rng());
    }
    const g = quadGeometry(true); inst(g, 'aA', aA, 4); inst(g, 'aB', aB, 4); g.instanceCount = n;
    add(new THREE.Mesh(g, mat(SPRAY_VERT, SPRAY_FRAG, tm)), 6);
  }
  await ctx.yield?.();

  // ---- vapour: the spring's coloured veil and leaning column, the geyser's cloud, the cone's idle breath
  {
    const aO = [], aP = [], aQ = [], aT = [], white = col('#ffffff');
    const tintOf = (c, w) => { const t = mixc(c, white, w), m = Math.max(t.r, t.g, t.b, 1e-3); return [t.r / m * 1.1, t.g / m * 1.1, t.b / m * 1.1]; };
    const T = { blue: tintOf(C.sapph, 0.3), green: tintOf(C.emer, 0.25), amber: tintOf(C.yel, 0.2), orange: tintOf(C.orange, 0.22), pale: tintOf(C.turq, 0.75) };
    let count = 0;
    const push = (o, p, q, t) => { aO.push(...o); aP.push(...p); aQ.push(...q); aT.push(...t); count++; };
    const nVeil = Math.round(210 * detail), nCol = Math.round(90 * detail), nCloud = Math.round(105 * detail), nTower = Math.round(120 * detail);
    for (let i = 0; i < nVeil; i++) {
      const r = Math.sqrt(rng()) * (rings.rust - 4), a = rng.range(0, 6.283), x = Math.cos(a) * r, z = Math.sin(a) * r;
      if ((x > 0 && z < 0 && rng() < 0.4) || (r < rings.turquoise && rng() < 0.45)) continue;                        // thin on the hook / dive side
      const t = r < rings.sapphire ? T.blue : r < rings.emerald ? T.green : r < rings.yellow + 3 ? T.amber : T.orange;
      const s0 = rng.range(4, 7);
      push([x, rng.range(1.5, 3), z], [rng(), rng.range(7, 11), s0, s0 * rng.range(2.0, 2.6)], [rng.range(14, 30), 0, rng(), rng.range(0.09, 0.15) * (r < rings.turquoise ? 0.65 : 1)], t);
    }
    for (let i = 0; i < nCol; i++) {
      const s0 = rng.range(8, 13);
      push([rng.gauss() * 11 - wind.x * 4, rng.range(8, 18), 12 + rng.gauss() * 12], [rng(), rng.range(22, 30), s0, rng.range(26, 40)], [rng.range(115, 150), 0.75, rng(), rng.range(0.14, 0.21)], T.pale);
    }
    for (let i = 0; i < nCloud; i++) {                              // the cloud that stands above the jet and leans away
      const s0 = rng.range(5, 9);
      push([rng.gauss() * 2, 60 * rng.range(0.7, 1.02), rng.gauss() * 2], [rng(), rng.range(16, 24), s0, rng.range(22, 36)], [rng.range(55, 100), 2, rng(), rng.range(0.22, 0.32)], [1, 1, 1]);
    }
    {                                                               // the tower itself: dense quick billows from the cone to the top, wider with height
      const tr2 = rng.fork('tower');
      for (let i = 0; i < nTower; i++) {
        const v = tr2.range(0.02, 1), sp = 0.7 + 2.3 * v;
        push([tr2.gauss() * sp, 60 * v, tr2.gauss() * sp], [tr2(), tr2.range(3.2, 5.4), 1.5 + 2.6 * v, (4.2 + 5.2 * v) * tr2.range(0.85, 1.2)], [tr2.range(9, 16), 2, tr2(), tr2.range(0.5, 0.78)], [1, 1, 1]);
      }
      for (let i = 0; i < 14; i++)                                  // and the breath of the boil at the vent, curling up through the pupil
        push([tr2.gauss() * 2.6, 1.2, tr2.gauss() * 2.6], [tr2(), tr2.range(5, 7.5), 2.4, tr2.range(7, 10)], [tr2.range(15, 24), 0, tr2(), tr2.range(0.16, 0.24)], T.blue);
    }
    for (let i = 0; i < 16; i++) push([gx + rng.gauss() * 0.7, rng.range(3.6, 5), gz + rng.gauss() * 0.7], [rng(), rng.range(6, 9), 1.6, rng.range(7, 11)], [rng.range(12, 22), 1.2, rng(), rng.range(0.22, 0.32)], [1, 1, 1]);
    const g = quadGeometry(true); inst(g, 'aO', aO, 3); inst(g, 'aP', aP, 4); inst(g, 'aQ', aQ, 4); inst(g, 'aTint', aT, 3); g.instanceCount = count;
    add(new THREE.Mesh(g, mat(STEAM_VERT, STEAM_FRAG, { transparent: true, depthWrite: false, premultipliedAlpha: true })), 5);
  }
  await ctx.yield?.();
  {
    const n = Math.round(260 * detail), aO = [], aP = [];
    for (let i = 0; i < n; i++) { aO.push(rng.range(-70, 175), rng.range(30, 130), rng.range(-90, 110)); aP.push(rng(), rng.range(2.5, 7), rng.range(0.25, 0.8), rng()); }
    const g = quadGeometry(true); inst(g, 'aO', aO, 3); inst(g, 'aP', aP, 4); g.instanceCount = n;
    const m = new THREE.ShaderMaterial({ uniforms: U, vertexShader: GLITTER_VERT, fragmentShader: GLITTER_FRAG, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
    add(new THREE.Mesh(g, m), 7);
  }
  await ctx.yield?.();

  // extra vapour for the world (fumaroles, river mist, breath, dust): puffs [{ o:[x,y,z], p:[phase, period, size0, size1],
  // q:[rise, kind (1 white column | 3 fully tinted), seed, alpha], tint:[r,g,b] }] -> one more draw call with the hero's steam shader
  function addSteam(puffs, order = 5) {
    const aO = [], aP = [], aQ = [], aT = [];
    for (const f of puffs) { aO.push(f.o[0], f.o[1], f.o[2]); aP.push(f.p[0], f.p[1], f.p[2], f.p[3]); aQ.push(f.q[0], f.q[1], f.q[2], f.q[3]); const t = f.tint || [1, 1, 1]; aT.push(t[0], t[1], t[2]); }
    const g = quadGeometry(true); inst(g, 'aO', aO, 3); inst(g, 'aP', aP, 4); inst(g, 'aQ', aQ, 4); inst(g, 'aTint', aT, 3); g.instanceCount = puffs.length;
    return add(new THREE.Mesh(g, mat(STEAM_VERT, STEAM_FRAG, { transparent: true, depthWrite: false, premultipliedAlpha: true })), order);
  }

  // ---- hooks
  let progress = null, eruptOverride = null;
  const bufSize = new THREE.Vector2();
  const sm = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  function update(dt, time, camera) {
    U.uTime.value = time;
    const e = eruptOverride != null ? eruptOverride : progress == null ? 1 : sm(surge[0], surge[1], progress);
    const pulse = Math.pow(0.5 + 0.5 * Math.sin(time * 1.9 + 2 * Math.sin(time * 0.7)), 2);
    const splash = 3 + 5 * pulse, full = jetH * (0.955 + 0.03 * Math.sin(time * 0.83) + 0.015 * Math.sin(time * 2.1));
    U.uGey.value.z = splash + (full - splash) * e; U.uGey.value.w = e;
    if (camera && ctx.renderer) {
      ctx.renderer.getDrawingBufferSize(bufSize);
      if (bufSize.x > 0 && bufSize.y > 0) { U.uPx.value.set(2 / bufSize.x, 2 / bufSize.y); U.uPxAngle.value = 2 / (Math.max(0.2, camera.projectionMatrix.elements[5]) * bufSize.y); }
    }
  }
  update(0, 0, null);
  function setCasters(list = []) {
    for (let i = 0; i < 10; i++) { const c = list[i], v = casts[NCAST - 10 + i]; if (c) v.set(c.x, c.z, c.height ?? 2, c.radius ?? 0.6); else v.set(1e5, 1e5, 0, 0.02); }
  }
  function setPortal(o = {}) {
    if (o.position) U.uPortalPos.value.copy(o.position.isVector3 ? o.position : new THREE.Vector3(...o.position));
    if (o.normal) U.uPortalN.value.copy(o.normal.isVector3 ? o.normal : new THREE.Vector3(...o.normal)).normalize();
    if (o.radius) U.uPortalCol.value.w = o.radius;
    if (o.color != null || o.strength != null) { const c = o.color != null ? (o.color.isColor ? o.color : col(o.color)) : null, k = (o.strength ?? 1) * 1.5, v = U.uPortalCol.value; if (c) v.set(c.r * k, c.g * k, c.b * k, v.w); else { const m = Math.max(v.x, v.y, v.z, 1e-3); v.set(v.x / m * k, v.y / m * k, v.z / m * k, v.w); } }
  }

  const P = (a) => a.slice();
  const anchors = {
    portalSeat: { position: [seat.x, seat.y, seat.z], facing: [-dive.x, -dive.y, -dive.z], heading: [dive.x, dive.y, dive.z], radius: 7, tilt: 50 },
    flyThrough: fly.map(P),
    viewpoints: {
      bull: [131, 3, 268], firstSpray: [gx + 36, 10, gz + 44], north: P(fly[7]), backlit: P(fly[10]), south: P(fly[13]),
      crest: P(crest), tipOver: P(fly[fly.length - 5]), dive: P(hookEnd),
    },
    vent: [0, 0, 0], rings,
    geyser: { base: [gx, 0, gz], vent: [gx, 4, gz], top: [gx, jetH, gz], coneRadius: 4.5, coneHeight: 4.4, apronRadius: 16, sprayRadius: 14, sprayDownwind: 20 },
    fan: { direction: fanDir.slice(), halfAngle: fanHalf, length: 205 },
    hoofprints: { from: [hoof.x, 0, hoof.y], to: [hoof.z, 0, hoof.w] },
    snags: snags.map((s) => ({ x: s.x, z: s.z, height: s.h })),
    wind: [wind.x, wind.y], sunDir: [sunDirLocal.x, sunDirLocal.y, sunDirLocal.z],
    columnTop: [wind.x * 26, 150, 10 + wind.y * 26],
    blend: { fadeStart: 136, sinter: '#' + C.sinter.getHexString(), meadow: '#' + C.meadow.getHexString(), frost: '#' + C.frost.getHexString() },
  };
  const view = { c: new THREE.Vector3(35, 40, 20), r: 105, h: 160 };
  return {
    object: root, radius: view.r, height: view.h, center: view.c, anchors,
    update, dispose() {}, ground: true, groundY: -0.3,
    setProgress(u) { progress = u; }, setEruption(e) { eruptOverride = e == null ? null : Math.min(1, Math.max(0, e)); },
    setLight, setShadowLine(y) { U.uShadowY.value = y; }, setCasters, setPortal, addSteam,
    uniforms: U, colors: C, get stats() { return { triangles: Math.round(tris), drawCalls: root.children.length }; },
  };
}
