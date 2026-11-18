// Alighting among the Towers (flying-boat-karst-bay): riding the float strut of a 1930s flying boat down a banked
// spiral between limestone towers and onto jade water in a burst of gold spray, then on alone into a sea tunnel.
//
// MAP OF THIS FILE
//   1. GLSL          far towers (instanced; the corridor towers' weathered rock and light, green roofs, own per-rank haze that
//                    never dissolves a tower) and the crown heads on the nearest of them, soft sprites (rain shreds hanging
//                    from the ceiling, mist skeins, thunderheads, rain curtain, dawn wisps, glows; no sprite has a square
//                    edge), birds (body + bent wings; a flock can thin out with distance, uFar), props (junks with bellied
//                    batwing sails, fish farms with net-green pen water, sampans, squid boats with lamp gantries), water
//                    decals (tower shadows, reflections, 7 the corridor's water: one sheet that mirrors both walls and the
//                    Pierced Tower in broad soft wave-shaped lenses and carries the one path of light with its sparkle,
//                    squid-lamp streaks, winding tide lines of froth and pale petals, our wake train as broken flecks, the
//                    portal's long mint spill, cat's-paws, 8 our own mirror image under the float and bow, 9 cloud shadows
//                    over the open bay (none by moonlight); ranges in the fragment shader are worked out per pixel, dEye), rain
//                    streaks whipping past the strut in the first seconds (RAIN), cooking-smoke threads (SMOKE),
//                    the rain ceiling (slate with lit torn edges
//                    and lit bellies, across the whole entry run; it thins with distance, at grazing angles and far toward
//                    the corridor), the dawn fog floor, shafts.
//   2. geometry      FAR_V / farRoof / farTowerGeo(variant) in three plan shapes with terraces, Soup (flat-shaded builder with
//                    aFlex and aPan channels, beam() for stays), junkGeo, raftGeo (a fish farm: plank walkways on blue barrels,
//                    a sheet of pen water, hut, lamp, washing, nets, skiff), sampanGeo, squidGeo (plain builders, no rng draws
//                    inside loops that yield).
//   3. build()       a. MOODS (seeded looks: golden / dawn / day / night; sail colour, livery; wallRef and glit are the
//                       colours of the wall's mirror and of the path of light, squid how brightly the squid lamps burn),
//                       weather from ctx.vary.mood (< 0.3 a trailing rain curtain, > 0.7 sheet lightning; mist and haze scale
//                       with it), seeded wall heights
//                    b. sky, fog (scene.fog), sea (Water.makeOcean)
//                    c. HERO: buildHero, then the Pierced Tower at the origin (its +Z face is the tunnel); the PATH
//                       is laid from the tower's anchors: entry run, right-hand spiral (R 445), then the corridor due
//                       north (-Z), dead straight on x = 0 from Z0+700 to the portal; the walls stand on lines of the
//                       bay (wallLine: the lit east wall 44 m east of that axis from the mouth to Z0+260, 64 m from there
//                       on; the west wall 64 m west), so the east cliff slides by about 40 m from the lens; it ends on
//                       anchors.portalSeat. `K` holds the key distances (kiss, depart).
//                    d. corridor wall towers + the Sentinel (buildTower; the walls carry lip trees), far towers (three
//                       instanced draws, one per plan shape) and one instanced draw of crown heads on the roofs of those
//                       within about a kilometre of the path, which also holds four clumps of low dark mangrove heads in
//                       the coves between the wall towers
//                    e. decals, sprites (among them long thin mist veils in the lee of far towers, each by its own roll) and glows,
//                       ceiling, shafts, the waterfall (Water.makeWaterfall, placed from the starboard wall's own vertices),
//                       junks (the six in file and the one at the corridor's mouth each with a smoke thread), rafts, sampans,
//                       four squid boats; `feet` (every tower's outline at the water) and the rafts' margin: each raft
//                       keeps 8 m of open water from rock, moved to the nearest place that has it where its typed place
//                       has not; birds (4,500 swiftlets in one standing stream, the world's own flock from the parts
//                       file on a line of four points, 250 m long and level at the height of the cave 40 m up the
//                       west wall: from a far end 171 to 248 m from the mouth (the corridor's seaward opening lies 254 to 269 m from it) straight for the mouth, through
//                       two turns of 9 m, and into the mouth along the mouth's own axis; that last run, on the axis
//                       at the mouth's height, is 21 m from the lip of the rock about the mouth (the stream's half
//                       width and two of its spreads along the line) or longer, and over it a funnel draws the flock
//                       inside the painted arch; line and flock are the same at every graphics tier, which sets
//                       only how many of the flock's birds are drawn; the line keeps 6 m off rock, on its axis run
//                       as much of that as the mouth's own axis has, and is bent the least that keeps the flock,
//                       where the vessel flies at its heights, 1 m clear of the airframe: for the flock as it flies,
//                       stragglers and wobble counted, that is 32 to 40 m in plan from the keel's track (the track
//                       is asked of flyAt, the vessel's one placement), and no line has it, level or sloped, on any
//                       seed of 1 to 124; so the line keeps the like margin for the stream's body alone (25 m,
//                       where the vessel flies within 8 m of its height), and over the stretch of it that lies
//                       within the flock's margin of the track the flock is drawn in about the centre line by the
//                       funnel's law, as wide as the line's measured distance from the skin leaves with 1 m to
//                       spare (all 24 seeds of 1 to 24); on the inside of each turn a bird's offset across is held
//                       under 5.4 m, so that no bird turns on the spot; the rule and its cases stand at THE
//                       SWIFTLETS' LINE; buildTower's caveAt
//                       puts the mouth at that height for every seed; egrets lifting from the first raft, kites, flying fish); `pace` and `secOf` (seconds
//                       of flight at u); and when ctx.vary.rare the sister flying boat (the hero's own skin and disc
//                       geometry drawn again) with her plume: a straight take-off run down the next channel east of the
//                       lit wall (SIS, sisX), off the water at 31 s of flight and abeam of the Pierced Tower at 35 s
//                    f. return: camera, POIS, portal, POST (exposure, bloom, grade), pace, update, dispose
//   The corridor's water carries light in every mood: decal kind 7 works out, for each point of the water, where the eye's
//                    reflected ray meets a corridor wall or the Pierced Tower and lays that wall's light there in broad,
//                    soft-edged lenses carried by five trains of wavelets fixed to the water (each train fades to its mean
//                    where a pixel can no longer resolve it, so the far image is whole): the lit east wall cream-gold by day
//                    and silver-blue by moonlight to the right, the shaded west wall dimmer and cooler to the left, the
//                    tower's jade-blue face ahead on the run-in. One path of light, a wandering lane up to a quarter of the channel wide fixed
//                    on the water down the middle of the channel from its mouth to the tunnel, with fine sparkle (glints
//                    at drawn places) only inside it. The same rules hold at every moment: nothing here is keyed to u. At night only the
//                    squid boats burn green-white lamps with a small glow and a long streak each (dark hulls in every other hour).
//   Dawn only: FLOOR_FRAG sheet at 9 m: kilometre lanes over the bay, only thin torn threads in the corridor; it fades as the
//                    eye sinks toward it (below 110 m) and the haze low down stays thin (0.0011), so the corridor is dark
//                    textured water with drifting wisps (30 soft sprites along the cliff feet), never a white slab. Run-in: the
//                    sea's uReflect is eased down by the eye's place (between the reach of the Pierced Tower's shade and one
//                    tower-depth from its face: mirFar, mirNear) so the water under the shaded Pierced Tower is dark jade, not sky.
//   update()         hides every aircraft mesh while ctx.through is true (the world seen through the previous portal: the
//                    portal's plane would slice what rides with the camera; the aircraft carries no light), otherwise
//                    poses the aircraft at the camera every frame along the track (flyAt, the vessel's one placement, which
//                    the swiftlets' search asks as well: hero.seatPose with roll/pitch/shift; see SEAT): the roll goes on from u 0.035, before the track bends, and the gaze (POIS) looks round inside the
//                    airframe: the whole layout at the entry, float and strut over the wheeling bay down the spiral, the
//                    lit cliff to starboard into the corridor, the whole layout again for the flare; maps u to
//                    the alighting clock s (hero.setProgress), rocks the boats, lifts the egrets and the near kite (uLift), runs the
//                    wake train (uWake, uWakeK), the sister boat and her plume (u), eased sheet lightning (uFlash, one flash per 2.7 s from a drawn phase).
//                    Also: the rain streaks ride the eye, as dense as the ceiling's own cover over it (showerAt: CEIL_FRAG's
//                    terms in JS) and reaching down as far as the rain shreds hang (shredLo, shredMid: none below the
//                    lowest shred's foot), so they thin out as the spiral sinks under the shreds (uRain, uRel); our mirror
//                    image is laid from the aircraft's keel (uOwn, uOwnK).
//   Scripted uniforms: hero.setProgress(s) (spray, wake, rpm), birds uLift, decal uWake / uWakeK / uOwn, sprite uTime / uFlash, boat matrices.
//   Antialiasing: a sliver triangle is shaded outside its own area, so FAR, CROWN and PROP clamp what feeds exponents and
//                    products and cap their colour; a prop triangle's kind (cloth, lamp, pen water) rides its own varying.
import * as THREE from 'three';
import { makePath, makeRng, hashSeed } from '../kit/core.js';
import { makeSky, skyDirection } from '../kit/sky.js';
import * as Water from '../kit/water.js';
import { buildHero, buildTower, swiftLine, swiftAt, swiftFlock, swiftWob, swiftMouth, buildSwiftlets } from '../parts/flying-boat-karst-bay.js';

const PALETTE = ['#2F8F78', '#17574C', '#C9C6B8', '#1E3B24', '#F2B27A', '#2B3340', '#B3402A'];
const sat = (x) => Math.min(1, Math.max(0, x));
const sstep = (a, b, x) => { const t = sat((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const lerp = (a, b, t) => a + (b - a) * t;

const NOISE = /* glsl */`
float h21(vec2 p){ p = fract(p*vec2(123.34, 456.21)); p += dot(p, p+45.32); return fract(p.x*p.y); }
float vnoise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.-2.*f);
  return mix(mix(h21(i), h21(i+vec2(1.,0.)), f.x), mix(h21(i+vec2(0.,1.)), h21(i+vec2(1.,1.)), f.x), f.y); }
float fbm3(vec2 p){ return vnoise(p)*0.55 + vnoise(p*2.13+7.1)*0.3 + vnoise(p*4.31+3.7)*0.15; }
`;
// ---- far towers: one instanced block per plan shape. The same rock as the corridor towers (weathered limestone: a dark
// grey to grey-green skin in irregular curtains over warm grey stone, broad flutes, beds of unequal thickness that pinch
// out, a few distinct black and rust runs, a wet near-black tide band at the foot; each layer fades before it is finer than
// a pixel and the skin settles to its mean, so a far tower stays dark), the same light, a green jungle roof (yellow-green
// toward the sun, dark green away from it, never brown) with painted crown heads and curtains; then its own haze (stronger
// than the scene fog, gold toward the sun and blue-green away from it), which steps each rank paler than the one in front
const FAR_VERT = /* glsl */`
uniform vec3 uSunDir;
varying vec3 vN; varying vec3 vL; varying vec3 vW; varying float vDepth; varying vec2 vInst;
void main(){
  mat4 m = modelMatrix;
  #ifdef USE_INSTANCING
  m = modelMatrix * instanceMatrix;
  #endif
  vec4 wp = m * vec4(position, 1.);
  vec3 s2 = vec3(dot(m[0].xyz, m[0].xyz), dot(m[1].xyz, m[1].xyz), dot(m[2].xyz, m[2].xyz));
  vN = mat3(m) * (normal / max(s2, vec3(1e-6))); vL = position; vW = wp.xyz;
  float rad = sqrt(max(s2.x, 1e-6));
  vec2 sx = uSunDir.xz / max(length(uSunDir.xz), 1e-3);
  vInst = vec2(rad, clamp(dot(wp.xz - m[3].xz, sx) / max(rad, 1.), -1., 1.));     // the tower's radius; how far toward the sun on its own roof
  vec4 mvPosition = viewMatrix * wp;
  vDepth = -mvPosition.z;
  gl_Position = projectionMatrix * mvPosition;
}`;
const FAR_FRAG = /* glsl */`
uniform vec3 uSunDir; uniform vec3 uSunCol; uniform vec3 uSkyCol; uniform vec3 uShadeCol; uniform vec3 uHorizonCol; uniform vec3 uRockCol; uniform vec3 uLeafCol;
uniform vec3 uHazeSun; uniform vec3 uHazeAway; uniform float uHaze;
varying vec3 vN; varying vec3 vL; varying vec3 vW; varying float vDepth; varying vec2 vInst;
${NOISE}
float h11(float n){ return fract(sin(n*127.1)*43758.5453); }
float sabs(float x){ return sqrt(x*x + 0.02); }
// where bedding joint k lies (units of the mean bed, 17 m): the corridor towers' own beds of unequal thickness that pinch out
float jointAt(float k, float u){ return k + 0.5 + 0.62*(h11(k*1.31 + 0.7) - 0.5) + 0.34*(vnoise(vec2(u*0.013 + k*7.3, k*3.1)) - 0.5); }
// one water stain hanging from a ledge (the corridor towers' own): d metres below the ledge, row its id, cw the spacing of
// possible runs, thr the share left out, a length range and the widest width
float run(float u, float d, float row, float cw, float thr, float lmin, float lmax, float wmax){
  float q = u/cw + h11(row*1.37 + cw)*9.;
  float ci = floor(q), cf = fract(q);
  float hx = h21(vec2(ci, row*3.1 + cw)), hy = h21(vec2(ci + hx*17.3 + 3.1, row*3.1 + cw));
  float k = fract(hx*57.3 + hy*13.1);
  float len = mix(lmin, lmax, hy);
  float w = mix(0.3, 1., k)*wmax*(1. - 0.6*smoothstep(0., len, d));
  float cx = (cf - (0.25 + 0.5*k))*cw + (vnoise(vec2(ci*7.7 + row, d*0.22)) - 0.5)*0.9;
  return step(thr, hx)*(1. - smoothstep(w*0.3, w, abs(cx)))*(1. - smoothstep(len*0.4, len, d))*smoothstep(-0.05, 0.3, d);
}
void main(){
  vec3 n = normalize(vN + vec3(0., 1e-4, 0.));
  vec3 L = normalize(uSunDir);
  // metres round the tower (the seam is a vertical line, where streaks and flutes are vertical too) and metres up
  float u = atan(vL.z, vL.x + 1e-5) * vInst.x * 0.9 + vInst.x * 7.3, y = vW.y;
  float fw = fwidth(y) + abs(dFdx(vW.x)) + abs(dFdx(vW.z));
  float tfade = 1. - smoothstep(0.7, 3., fw), cfade = 1. - smoothstep(2.5, 9., fw);
  float wall = 1. - smoothstep(0.35, 0.75, abs(n.y));
  float big = fbm3(vec2(u*0.03, y*0.045) + 3.);
  float jfade = 1. - smoothstep(2.4, 9., fw), ffade = 1. - smoothstep(1.6, 5.5, fw), sfade = 1. - smoothstep(1.4, 4., fw);     // (beds read as bands for kilometres: a parting's shadow broadens with range instead of fading)
  // the corridor towers' weathered limestone: warm grey stone under a rain-blackened, lichened skin (dark grey to grey-green)
  // hanging in irregular curtains, paler ribs between broad flutes, a few pale scars, beds of unequal thickness that pinch
  // out (a parting along part of each joint), distinct black and rust runs from a bed's top or the shoulder. Far off the
  // skin settles to its mean: a distant tower stays dark and solid.
  float f0 = sabs(fbm3(vec2(u*0.15, y*0.034))*2. - 1.), f1 = sabs(fbm3(vec2((u + 1.2)*0.15, y*0.034))*2. - 1.);
  float fl = (0.35 + 0.65*smoothstep(0.25, 0.6, vnoise(vec2(u*0.017 + 5., y*0.021))))*ffade*wall;
  // (with antialiasing a sliver is shaded outside its own area and its varyings run on past their ends: the height is kept
  // from going negative here, or the exponents below would run away, and the colour is capped at the end)
  float rimD = min(max(0.955 - vL.y, 0.)*max(y, 0.)/max(vL.y, 0.02), 600.);                   // metres below the shoulder
  float bq = (y + (vnoise(vec2(u*0.011, 1.)) - 0.5)*7. + (vnoise(vec2(u*0.06, 3.)) - 0.5)*1.6)/17.;
  float bk = floor(bq);
  float bed = bq < jointAt(bk, u) ? bk : bk + 1.;
  float jlo = jointAt(bed - 1., u), jhi = jointAt(bed, u);
  float bm = max(jhi - jlo, 0.02)*17.;
  float dTop = (jhi - bq)*17., dBot = (bq - jlo)*17.;
  float jrow = dTop < dBot ? bed : bed - 1., jd = dTop < dBot ? dTop : -dBot;
  float thick = smoothstep(2.5, 8., bm);
  float nearF = 1. - smoothstep(250., 600., vDepth);                        // the second rank next to the path: darker, its beds and runs as bold as the Sentinel's
  vec3 rock = uRockCol*(0.5 + 0.42*big)*mix(1., 0.8 + 0.2*smoothstep(0., 0.55, f0), fl)*(0.9 + 0.2*vnoise(vec2(u*0.9, y*0.6))*tfade)*mix(1., 0.76, nearF);
  rock *= 1. + (vnoise(vec2(u*0.2, y*0.21) + 9.) - 0.5)*0.34*nearF*(1. - smoothstep(1.2, 3.6, fw));     // joint blocks' tone, close to
  // every bed has a tone of its own (one a little darker, the next paler), meeting its neighbour's half-way at the joint: the
  // banding that tells a far stack is bedded limestone, there until a bed is thinner than a pixel
  float bedO = dTop < dBot ? bed + 1. : bed - 1.;
  float bedT = mix(0.5*(h11(bed*5.3 + 1.7) + h11(bedO*5.3 + 1.7)), h11(bed*5.3 + 1.7), smoothstep(0., max(fw*0.8, 0.3), abs(jd))) - 0.5;
  rock *= 1. + bedT*0.3*wall*thick*(1. - smoothstep(5., 15., fw));
  float under = max(exp(-rimD/40.), 0.6*exp(-dTop/9.)*thick);
  float st = fbm3(vec2(u*0.1 + 11., y*0.021))*0.75 + vnoise(vec2(u*0.42 + 3., y*0.05))*0.35;
  float skin = mix(0.74, smoothstep(0.4, 0.6, st + 0.15*under), ffade)*mix(1., 0.75 + 0.25*under, wall);
  rock *= mix(0.72, 1., ffade);                                             // (with the grooves' own shade, which a far wall no longer shows)
  float scar = smoothstep(0.62, 0.72, fbm3(vec2(u*0.035 + bed*0.9, y*0.05) + 23.))*(1. - smoothstep(2.4, 7., fw))*wall;
  skin *= 1. - 0.85*scar;
  rock = mix(rock, rock*vec3(0.27, 0.31, 0.31), skin*mix(0.9, 1., nearF)*(0.3 + 0.7*wall));     // (the skin's curtains at full contrast on the rank next to the path)
  rock = mix(rock, rock*vec3(0.86, 1., 0.8), 0.6*smoothstep(0.35, 0.7, vnoise(vec2(u*0.05 + 40., y*0.06)))*skin);
  rock = mix(rock, rock*vec3(1.12, 1.04, 0.9), scar*0.7);
  float jline = smoothstep(0.36, 0.66, vnoise(vec2(u*0.038 + jrow*7.3, jrow*5.1)))*jfade*wall*thick;
  rock *= 1. - mix(0.3, 0.7, nearF)*jline*smoothstep(-0.2 - fw*0.3, 0.15, jd)*exp(-max(jd, 0.)/max(1.5, fw*1.3));     // the parting's shadow, never thinner than a pixel
  float streak = max(run(u, dTop, bed, 12., 0.55, 7., 30., 2.2), run(u, dTop + bm, bed + 1., 12., 0.6, 7., 30., 2.2));
  streak = max(streak, run(u, rimD, 77., 13., 0.4, 16., 55., 3.2))*wall*sfade;
  rock = mix(rock, rock*vec3(0.2, 0.21, 0.24), streak*0.9);
  float rust = max(run(u + 5., dTop, bed + 40., 19., 0.66, 5., 16., 3.6), run(u + 5., rimD, 91., 23., 0.5, 8., 26., 4.6))*wall*sfade;
  rock = mix(rock, vec3(0.25, 0.07, 0.02)*(0.6 + 0.6*big), rust*0.8);
  rock = mix(rock, rock*vec3(1.1, 0.9, 0.74), 0.5*exp(-rimD/16.)*smoothstep(0.35, 0.7, big)*wall);
  // the jungle cap: every up-facing roof and terrace, and ragged curtains hanging from the shoulder down the top of the wall
  float drip = vnoise(vec2(u*0.09, 1.7)), drip2 = vnoise(vec2(u*0.31, 4.2));
  float capLine = 0.87 - 0.22*drip*drip - 0.08*drip2 - 0.05*smoothstep(700., 2600., vDepth) + (vnoise(vec2(u*0.9, 7.)) - 0.5)*0.05*tfade + (vnoise(vec2(u*2.7, y*0.2)) - 0.5)*0.03*tfade;     // (the curtain's foot frays into strands close to: no jagged painted fringe)
  float roof = smoothstep(0.2, 0.45, n.y)*smoothstep(0.3, 0.4, vL.y);
  float leaf = max(smoothstep(capLine-0.015, capLine+0.015, vL.y), roof);
  leaf = max(leaf, smoothstep(0.66, 0.8, vnoise(vec2(u*0.06, y*0.035+5.)))*smoothstep(0.3, 0.6, vL.y)*0.7*(1. - nearF));     // (painted bushes on the wall far off only: close to they were round blobs)
  // crown heads on the roof: two sets of jittered cells of unlike size, the grid itself bent by a slow warp (no tiling to read)
  vec2 cq = vW.xz/9. + (vec2(vnoise(vW.xz*0.031), vnoise(vW.xz*0.031 + 17.)) - 0.5)*1.5; vec2 cf = fract(cq) - 0.5;
  float crownB = 1. - smoothstep(0.2, 0.5, length(cf + (vec2(h21(floor(cq)), h21(floor(cq) + 7.3)) - 0.5)*0.4));
  vec2 cq2 = vec2(vW.x*0.8 + vW.z*0.6, vW.z*0.8 - vW.x*0.6)/5.7 + 3.3; vec2 cf2 = fract(cq2) - 0.5;
  crownB = max(crownB, 0.8*(1. - smoothstep(0.16, 0.46, length(cf2 + (vec2(h21(floor(cq2) + 3.1), h21(floor(cq2) + 11.7)) - 0.5)*0.5)))*(1. - smoothstep(1.6, 5., fw)));
  crownB = mix(0.55, crownB, cfade);
  float mott = vnoise(vW.xz*0.13 + y*0.1)*vnoise(vW.xz*0.33 - y*0.2);
  vec3 lf = uLeafCol*(0.3 + 1.05*mott)*mix(0.62, 1.3, crownB*roof);
  // light, as on the corridor towers: relief from the height field in sun and in shade
  float ndl = dot(n, L);
  float rel = (f1 - f0)*1.9*fl;
  float groove = mix(1., 0.74 + 0.26*smoothstep(0.1, 0.6, f0), fl);
  vec3 shd = mix(uShadeCol, vec3(dot(uShadeCol, vec3(0.3333))), 0.5);
  float sunSide = 0.5 + 0.5*dot(normalize(n.xz + vec2(1e-4)), normalize(L.xz + vec2(1e-4)));
  vec3 amb = (shd*(1.3 + 0.3*n.y) + uSkyCol*(0.37 + 0.4*max(n.y, 0.)))*mix(1., 0.8 + 0.22*smoothstep(0., 0.6, sunSide), wall) + uHorizonCol*(0.1 + 0.16*sunSide)*wall;
  float cjour = max(dot(normalize(vW.xz - cameraPosition.xz + vec2(1e-4)), normalize(L.xz + vec2(1e-4))), 0.);
  amb += (mix(uShadeCol, vec3(dot(uShadeCol, vec3(0.3333))), 0.15)*1.05 + uSkyCol*0.15 - uHorizonCol*0.05)*wall*(1. - smoothstep(0.15, 0.6, sunSide))*(1. - 0.5*cjour*cjour);     // jade-blue shade, as on the corridor towers (less of it seen against the light)
  vec3 colR = rock*(uSunCol*smoothstep(-0.05, 0.5, ndl)*(0.3 + 0.24*max(ndl, 0.))*clamp(1. + rel*1.25, 0.45, 1.65)*(0.3 + 0.7*groove) + amb*clamp(1. + rel*0.85, 0.6, 1.45)*groove);
  float side = mix(sunSide*2. - 1., vInst.y, roof);
  float litL = smoothstep(-0.2, 0.55, mix(ndl, 0.25 + 0.5*crownB, roof*0.6))*mix(0.42, 1.1, smoothstep(-0.9, 0.7, side));
  float skyL = dot(uSkyCol + shd, vec3(0.3333));
  vec3 colL = lf*(uSunCol*litL*0.85 + shd*1.2 + uSkyCol*0.6*max(n.y, 0.) + skyL*(1.5 + 1.1*n.y))
    + vec3(0.26, 0.31, 0.04)*uSunCol*0.2*litL*litL*(0.35 + mott*2.2)*mix(0.5, 1.2, crownB);
  vec3 col = mix(colR, colL, leaf);
  // the foot: wet near-black notch, a pale barnacle line, slop and foam
  // (the tide band is five or six metres of wet near-black rock and never under a pixel or two, so every foot stands on a dark base)
  float tideTop = 5.8 + 1.8*(vnoise(vec2(u*0.12, 4.)) - 0.5) + min(fw, 5.)*1.3;
  col *= mix(0.2, 1., smoothstep(tideTop - 1.4, tideTop, y));
  col = mix(col, vec3(0.5, 0.48, 0.4)*(shd*2. + uSkyCol*0.6 + uSunCol*0.12), 0.5*(1. - smoothstep(0.3, 1.1, abs(y - 2.6)))*(1. - smoothstep(0.5, 2., fw)));
  col = mix(col, vec3(0.6, 0.58, 0.5)*(uSkyCol + uSunCol*0.2), 0.5*(1. - smoothstep(0.2, 1.1 + min(fw, 5.)*0.25, y)));
  vec3 V = normalize(vW - cameraPosition);
  float toSun = max(dot(normalize(V.xz + vec2(1e-5)), normalize(uSunDir.xz + vec2(1e-5))), 0.);
  float haze = 1. - exp(-vDepth*uHaze);
  vec3 hz = mix(uHazeAway, uHazeSun, toSun*toSun);
  col = mix(col, mix(hz, hz*vec3(0.72, 0.98, 0.74), 0.6*leaf), clamp(haze, 0., 0.72)*(1. - 0.62*leaf));     // haze tints and lightens a far tower; it never dissolves it, and its cap stays green
  gl_FragColor = vec4(clamp(col, vec3(0.), uSunCol*1.1 + 0.3), 1.);
}`;
// ---- modelled crown heads on the roofs of the far towers nearest the path: one instanced draw, the far towers' leaf light and haze
const CROWN_VERT = /* glsl */`
attribute vec4 aC; attribute vec4 aT;                 // centre and radius; tone, sway phase, sunward share (-1..1), squash
uniform float uTime;
varying vec3 vN; varying vec3 vW; varying vec3 vT; varying float vDepth;
void main(){
  vec3 p = position * vec3(aC.w, aC.w*aT.w, aC.w);
  float top = max(position.y + 0.4, 0.);
  p.x += sin(uTime*1.1 + aT.y)*0.5*top; p.z += cos(uTime*0.9 + aT.y*1.7)*0.4*top;
  vec3 wp = aC.xyz + p;
  vN = normalize(vec3(position.x*0.85, position.y*0.8 + 0.45, position.z*0.85)); vW = wp; vT = vec3(aT.x*(position.y < -0.2 ? 0.5 : 0.8 + 0.35*position.y), aT.z, 0.);
  vec4 mvPosition = viewMatrix * vec4(wp, 1.);
  vDepth = -mvPosition.z;
  gl_Position = projectionMatrix * mvPosition;
}`;
const CROWN_FRAG = /* glsl */`
uniform vec3 uSunDir; uniform vec3 uSunCol; uniform vec3 uSkyCol; uniform vec3 uShadeCol; uniform vec3 uLeafCol;
uniform vec3 uHazeSun; uniform vec3 uHazeAway; uniform float uHaze;
varying vec3 vN; varying vec3 vW; varying vec3 vT; varying float vDepth;
${NOISE}
void main(){
  vec3 n = normalize(vN + vec3(0., 1e-4, 0.)), L = normalize(uSunDir);
  float mott = vnoise(vW.xz*0.5 + vW.y*0.4)*vnoise(vW.xz*1.3 - vW.y);
  vec3 lf = uLeafCol*(0.32 + 1.1*mott)*clamp(vT.x, 0., 1.6);
  float ndl = dot(n, L);
  float litL = smoothstep(-0.2, 0.55, ndl)*mix(0.42, 1.1, smoothstep(-0.9, 0.7, vT.y));
  vec3 shd = mix(uShadeCol, vec3(dot(uShadeCol, vec3(0.3333))), 0.4);
  float skyL = dot(uSkyCol + shd, vec3(0.3333));
  vec3 col = lf*(uSunCol*litL*0.85 + shd*1.2 + uSkyCol*0.6*max(n.y, 0.) + skyL*(1.5 + 1.1*n.y)) + vec3(0.26, 0.31, 0.04)*uSunCol*0.2*litL*litL*(0.35 + mott*2.2)*clamp(vT.x, 0., 1.6);
  vec3 V = normalize(vW - cameraPosition);
  float toSun = max(dot(normalize(V.xz + vec2(1e-5)), normalize(uSunDir.xz + vec2(1e-5))), 0.);
  float haze = 1. - exp(-vDepth*uHaze);
  vec3 hz = mix(uHazeAway, uHazeSun, toSun*toSun);
  col = mix(col, mix(hz, hz*vec3(0.72, 0.98, 0.74), 0.6), clamp(haze, 0., 1.)*0.5);
  gl_FragColor = vec4(clamp(col, vec3(0.), uSunCol*0.8 + 0.3), 1.);
}`;

// ---- soft sprites: camera-facing quads eroded by scrolling noise. aSize = (width, height, fog share, seed); a fog share
// of 2 or more marks a glow that follows uFlash (sheet lightning); skeins (fog share >= 0.5) are torn harder than clouds
const SPR_VERT = /* glsl */`
attribute vec3 aPos; attribute vec4 aSize; attribute vec4 aCol;
uniform float uTime; uniform float uFlash;
varying vec2 vUv; varying vec4 vCol; varying float vSeed; varying float vFogK; varying float vNear; varying float vTear; varying float vRain;
#include <fog_pars_vertex>
void main(){
  vec3 right = vec3(viewMatrix[0][0], viewMatrix[1][0], viewMatrix[2][0]);
  vec3 up = vec3(viewMatrix[0][1], viewMatrix[1][1], viewMatrix[2][1]);
  float flash = step(1.5, aSize.z);
  vec3 c = aPos; c.x += sin(uTime*0.03 + aSize.w*6.3)*aSize.x*0.06; c.z += uTime*0.6*fract(aSize.w*7.3)*(1. - flash);
  // a skein or veil (fog share >= 0.5) looked down on lies level in the air, its long side across the view: a layer of
  // mist across the towers' middles, never a puff standing on the water; seen from its own height it faces the eye
  float tearV = step(0.5, aSize.z)*(1. - flash);
  vec3 toE = cameraPosition - c; float hd = max(length(toE.xz), 1.);
  float flatK = tearV*smoothstep(0.07, 0.28, toE.y/max(length(toE), 1.));
  vec3 upV = normalize(mix(mix(up, vec3(0.,1.,0.), 0.6), vec3(-toE.x, 0., -toE.z)/hd, flatK) + vec3(0., 1e-3, 0.));
  vec3 wp = c + right*position.x*aSize.x + upV*position.y*aSize.y*mix(1., 1.6, flatK);
  vUv = position.xy; vCol = aCol; vSeed = aSize.w; vFogK = mix(aSize.z, 0.2, flash);
  vCol.a *= mix(1., uFlash*(0.5 + 0.5*sin(aSize.w*40. + floor(uTime*0.4)*2.4)), flash);
  vTear = step(0.5, aSize.z)*(1. - flash);
  vRain = step(0.255, aSize.z)*step(aSize.z, 0.275);                    // a rain shred under the shower's base
  // a skein right under the eye thins (seen from above at close range it is a floe on the water); further off, across the
  // middle-distance towers, it keeps its body and hides their feet
  float dSk = length(cameraPosition.xz - c.xz);
  float veil = step(0.85, aSize.z)*step(aSize.z, 0.95);                   // a long veil across a tower (fog share 0.9) keeps its body from above too
  vCol.a *= mix(1., 0.16, smoothstep(-10., 100., cameraPosition.y - c.y)*(1. - smoothstep(150., 400., dSk))*vTear*(1. - veil));
  vCol.a *= mix(1., 1.5, smoothstep(300., 520., dSk)*vTear);                 // and beyond 300 m a skein is half as dense again: a veil across the towers, not a puff
  vec4 mvPosition = viewMatrix * vec4(wp, 1.);
  vNear = smoothstep(6., 0.25*aSize.x + 30., -mvPosition.z);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const SPR_FRAG = /* glsl */`
uniform float uTime; uniform float uFade;
varying vec2 vUv; varying vec4 vCol; varying float vSeed; varying float vFogK; varying float vNear; varying float vTear; varying float vRain;
#include <fog_pars_fragment>
${NOISE}
void main(){
  float r = length(vUv*2.);
  vec2 q = vUv*mix(mix(vec2(2.6), vec2(8.5, 0.8), vRain), vec2(5.2, 1.7), vTear) + vec2(vSeed*31., vSeed*17.) + vec2(uTime*0.012, uTime*0.05*vRain);
  q.x += vRain*vUv.y*2.6;                                                  // (a shred's streaks slant downwind)
  float n = fbm3(q);
  float a = (1. - smoothstep(0.25, 1., r + (0.5 - n)*mix(0.9, 1.5, vTear))) * smoothstep(mix(0.18, 0.37, vTear), mix(0.6, 0.73, vTear), n);
  // skeins are torn right through: open holes and long rents that drift
  float holes = smoothstep(0.34, 0.58, vnoise(q*vec2(1.3, 2.9) + vec2(uTime*0.02, 9.)));
  a *= mix(1., 0.4 + 0.6*holes, vTear);
  // a rain shred hangs from the base as a fringe that narrows downward; its streaks slant downwind, each ends at its own
  // level, and its sides are ragged: no straight side, no level foot
  float lean = vUv.x + 0.3*vUv.y + (n - 0.5)*0.12;
  float foot = -0.46 + 0.55*vnoise(vec2(lean*6. + vSeed*17., 4.3));
  float fringe = (1. - smoothstep(0.16, 0.46, abs(vUv.x)*(1.25 - 1.1*vUv.y) + (n - 0.5)*0.16)) * smoothstep(foot, foot + 0.4, vUv.y) * (0.4 + 0.6*smoothstep(0.25, 0.7, vnoise(vec2(lean*11. + vSeed*31., 1.7))));
  a *= mix(1., fringe, vRain);
  a *= 1. - smoothstep(0.36, 0.5, max(abs(vUv.x), abs(vUv.y)));          // never a square edge
  a *= vCol.a * vNear * uFade;
  if (a < 0.003) discard;
  vec3 col = vCol.rgb * (0.75 + 0.5*n);
  col *= mix(1., 1.6 - 0.6*smoothstep(-0.4, 0.3, vUv.y), vRain);                // its trailing foot is lit, its root is the slate of the base
  col *= mix(vec3(1.), mix(vec3(0.6, 0.72, 0.86), vec3(1.12, 1.04, 0.9), smoothstep(-0.22, 0.26, vUv.y + (n - 0.5)*0.25)), vTear);     // a skein's top catches the light, its underside is cool
  gl_FragColor = vec4(col, a);
  #ifdef USE_FOG
    float ff = (1. - exp(-fogDensity*fogDensity*vFogDepth*vFogDepth)) * vFogK;
    gl_FragColor.rgb = mix(gl_FragColor.rgb, fogColor, clamp(ff, 0., 1.));
  #endif
}`;

// ---- birds: two-triangle flappers streaming along a quadratic curve (loop) or lifting along it (uLift)
const BIRD_VERT = /* glsl */`
attribute vec4 aA; attribute vec3 aOff;
uniform float uTime; uniform float uLift; uniform float uLoop; uniform float uRate; uniform float uSize; uniform float uFar; uniform float uNear;
uniform vec3 uP0; uniform vec3 uP1; uniform vec3 uP2;
varying float vShade; varying float vFade;
#include <fog_pars_vertex>
void main(){
  float t = uLoop > 0.5 ? fract(aA.x + uTime*uRate*(0.8 + 0.4*aA.w)) : clamp(uLift*1.5 - aA.x*0.5, 0., 1.);
  vec3 c = mix(mix(uP0, uP1, t), mix(uP1, uP2, t), t);
  vec3 tg = (uP1 - uP0)*(1. - t) + (uP2 - uP1)*t + vec3(0., 0., 1e-3);
  vec3 f = normalize(tg);
  vec3 s = normalize(cross(f, vec3(0., 1., 0.)) + vec3(1e-3, 0., 0.));
  vec3 u = cross(s, f);
  float spread = uLoop > 0.5 ? 1. : (0.25 + 1.6*t);
  c += (s*aOff.x + u*aOff.y + f*aOff.z) * spread;
  c += s*sin(uTime*1.3 + aA.y*40.)*0.6 + u*sin(uTime*1.7 + aA.z*40.)*0.5;
  float flap = sin(uTime*(9. + 6.*aA.w) + aA.y*60.);
  float sc = uSize * (0.75 + 0.5*aA.z);
  if (uLoop > 0.5) sc *= smoothstep(0., 0.04, t) * (1. - smoothstep(0.96, 1., t));
  float dEye = length(c - cameraPosition);
  sc *= mix(uNear, 1., smoothstep(6., 55., dEye));
  vFade = 1. - smoothstep(uFar*0.4, uFar, dEye);                             // a flock thins out with distance: birds near the lens, never pepper on a far wall
  float wx = abs(position.x);
  vec3 p = c + (s*position.x*(1. - 0.25*wx*abs(flap)) + f*position.z + u*(wx*0.45 + wx*wx*0.5)*flap) * sc;
  vShade = 0.55 + 0.45*flap*wx + 0.25*step(wx, 0.14);
  vec4 mvPosition = viewMatrix * vec4(p, 1.);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const BIRD_FRAG = /* glsl */`
uniform vec3 uCol; uniform vec3 uRim;
varying float vShade; varying float vFade;
#include <fog_pars_fragment>
void main(){
  if (vFade < 0.02) discard;
  gl_FragColor = vec4(uCol*vShade + uRim*max(vShade - 0.7, 0.), vFade);
  #include <fog_fragment>
}`;

// ---- props (junks, rafts): vertex colour, shared light uniforms, sail flex and backlight, lamps (aFlex < 0)
const PROP_VERT = /* glsl */`
attribute float aFlex; attribute vec2 aPan;          // aPan: on a sail, (0..1 from one batten up to the next, 0..1 from luff to leech); else x < 0
uniform float uTime;
varying vec3 vN; varying vec3 vCol; varying vec3 vL; varying vec2 vPan; varying float vKind;
#include <fog_pars_vertex>
void main(){
  mat4 m = modelMatrix;
  float ph = 0.;
  #ifdef USE_INSTANCING
  m = modelMatrix * instanceMatrix; ph = instanceMatrix[3][2]*0.37;
  #endif
  vec3 p = position;
  float fl = max(aFlex, 0.);
  p.x += fl * (sin(uTime*1.6 + p.y*0.55 + ph)*0.32 + sin(uTime*4.3 + p.y*1.9 + p.z + ph)*0.07 + 0.35);
  vec4 wp = m * vec4(p, 1.);
  vec3 nl = normal;
  // a sail panel bellies between its battens: the normal of that belly, smooth across the panel's facets
  if (aPan.x > -0.5) nl = normalize(vec3(1., -0.95*cos(3.1416*aPan.x)*sin(3.1416*min(aPan.y*1.1, 1.)), 0.22*sin(3.1416*aPan.x)*cos(3.1416*aPan.y)));
  vN = mat3(m) * nl; vCol = color; vL = position; vPan = aPan;
  vKind = aFlex < -1.5 ? 2. : (aFlex < -0.5 ? 1. : 0.);                  // 0 hull and cloth, 1 a lamp, 2 pen water: the same at a triangle's three corners (a sail's flex is not, and read past a sliver's end with antialiasing it once turned cloth into a lamp)
  vec4 mvPosition = viewMatrix * wp;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const PROP_FRAG = /* glsl */`
uniform vec3 uSunDir; uniform vec3 uSunCol; uniform vec3 uSkyCol; uniform vec3 uShadeCol; uniform float uLamp; uniform float uTime; uniform float uPenK;
varying vec3 vN; varying vec3 vCol; varying vec3 vL; varying vec2 vPan; varying float vKind;
#include <fog_pars_fragment>
${NOISE}
void main(){
  vec3 n = normalize(vN + vec3(0., 1e-4, 0.));
  if (!gl_FrontFacing) n = -n;
  float fwLamp = fwidth(vL.x) + fwidth(vL.y) + fwidth(vL.z);
  vec3 col, vc = clamp(vCol, 0., 1.);
  if (vKind > 1.5) {
    // a fish farm's pens: net-green water a shade lighter than the bay, the netting showing against the walkways, ripples,
    // and a feeding ring opening now and then in some of the pens
    vec2 pc = vec2((vL.x + 12.)/6., (vL.z + 20.)/6.667); vec2 pf = fract(pc) - 0.5; vec2 pid = floor(pc);
    float edge = max(abs(pf.x), abs(pf.y))*2.;
    float fwp = fwidth(vL.x) + fwidth(vL.z);
    vec2 mg = abs(fract(vL.xz*1.5) - 0.5);
    float mesh = (1. - smoothstep(0.05, 0.11 + fwp*1.5, min(mg.x, mg.y)))*(1. - smoothstep(0.1, 0.4, fwp))*smoothstep(0.3, 0.95, edge);
    float rip = vnoise(vL.xz*1.2 + vec2(uTime*0.5, -uTime*0.33))*0.6 + vnoise(vL.xz*3.1 - vec2(uTime*0.7, uTime*0.4))*0.4;
    float hp = h21(pid + 3.7), ph = fract(uTime*0.31 + hp*7.);
    float rr = length(pf - (vec2(h21(pid + 1.3), h21(pid + 9.1)) - 0.5)*0.4);
    float ring = (1. - smoothstep(0.012, 0.05, abs(rr - ph*0.36)))*(1. - ph)*step(0.45, hp)*(1. - smoothstep(0.2, 0.6, fwp));
    vec3 lightW = (uSkyCol*1.15 + uShadeCol*0.6 + uSunCol*0.14)*uPenK;
    col = vc*lightW*(0.78 + 0.44*rip)*(1. - 0.3*mesh)*mix(1., 0.74, smoothstep(0.55, 1., edge)) + (uSkyCol + uSunCol*0.15)*0.22*ring;
  }
  else if (vKind > 0.5) {
    // a lamp smaller than a pixel keeps its light, not its brightness: no lone hot sample that sparks (and blooms) with antialiasing
    col = vc * uLamp * clamp(0.5 / max(fwLamp, 1e-4), 0.16, 1.);
  }
  else {
    float grain = 0.8 + 0.4*vnoise(vL.zy*vec2(3., 9.) + vL.x);
    vec3 alb = vc * grain;
    float sail = step(-0.5, vPan.x);
    // sail cloth: weave, stains run down from each batten, sewn patches (double cloth: paler in sun, darker against it), the
    // bamboo batten itself and the seam shadow under it
    float sv = clamp(vPan.x, 0., 1.);
    float bat = 1. - smoothstep(0.035, 0.085, min(sv, 1. - sv));
    float stain = smoothstep(0.35, 0.8, vnoise(vec2(vL.z*1.7, vL.y*0.35) + 4.))*(1. - sv);
    vec2 pq = vec2(vL.z*0.62, vL.y*0.5 + floor(vL.z*0.62)*0.37); vec2 pf = fract(pq); float ph = h21(floor(pq) + 3.1);
    float sewn = step(0.74, ph)*(1. - smoothstep(0.42, 0.5, abs(pf.x - 0.5)*(1.1 + ph)))*(1. - smoothstep(0.4, 0.5, abs(pf.y - 0.5)*(1.6 - ph*0.5)));
    float weave = 0.9 + 0.2*vnoise(vL.zy*vec2(14., 5.));
    alb = mix(alb, alb*weave*(1. - 0.42*stain)*(1. + 0.5*sewn*(ph - 0.84)*6.), sail);
    alb *= mix(1., 0.8 + 0.36*sv, sail);                                   // each panel hangs from its batten: fuller and paler toward the top
    alb.g += 0.05*alb.r*sail;
    alb = mix(alb, vec3(0.44, 0.34, 0.19)*grain, sail*bat*0.85);            // pale bamboo battens
    alb *= 1. - sail*0.3*(1. - smoothstep(0.06, 0.2, sv))*(1. - bat);
    alb *= mix(1., 1. + 0.22*smoothstep(0.75, 1., vPan.y), sail);            // a paler, sun-bleached leech
    float ndl = max(dot(n, uSunDir), 0.);
    float back = max(dot(-n, uSunDir), 0.) * sail;
    // the cloth is thin: lit from either side it glows with its own colour, warmer and fuller where it is single (mid-panel),
    // not at battens or patches; strongest against the light
    vec3 thru = (alb*vec3(1.6, 1.3, 1.0) + alb.r*vec3(0.02, 0.07, 0.01))*(0.35 + 0.65*sin(3.1416*sv))*(1. - 0.7*sewn)*(1. - bat);
    col = alb*(uSunCol*ndl*mix(0.5, 0.42, sail) + mix(uShadeCol, uSkyCol, 0.5 + 0.5*n.y)*mix(0.8, 0.78, sail)) + thru*uSunCol*(back*0.5 + ndl*0.17)*sail;
    col *= mix(0.45, 1., smoothstep(-0.3, 1.2, vL.y));
    col = clamp(col, vec3(0.), uSunCol*1.2 + 0.3);
  }
  gl_FragColor = vec4(col, 1.);
  #include <fog_fragment>
}`;

// ---- water decals, one instanced draw lying just above the sea. aXf = (x, z, heading, seed), aDim = (width, length, kind, extra)
//   kind 0 tower shadows   1 tide lines (winding, broken into flecks of froth and small pale petals)
//   2 reflections: a streak from a foot toward the eye, length d x h / (eye height + h), gold where the mirrored face is
//   sunlit (extra 1 = a junk: sail colour; extra 3 = a squid boat's lamps: a long wandering streak of winking slivers)
//   3 our own wake train running on up the corridor (uWake = metres it has reached): two broken V arms of foam over dark
//   troughs whose crests wander (blue-green flecks at night, the troughs cut to a third)   4 the portal's mint spill at the
//   tunnel   5 cat's-paws: dark ruffled gust patches racing downwind (aXf.z is the wind heading; each wraps over 760 m and
//   fades at both ends of its run; its ruffle lies in rows that wander, pale streaks inside)   7 the corridor's
//   water (one sheet: both walls and the Pierced Tower mirrored in broad lenses, the path of light and its sparkle; uWalls,
//   uEnd, uLane; the image is worked out per pixel)   8 our own mirror image   9 cloud shadows
const DEC_VERT = /* glsl */`
attribute vec4 aXf; attribute vec4 aDim;
uniform float uTime; uniform vec2 uSunXZ; uniform vec4 uOwn; uniform float uOwnK;
varying vec2 vUv; varying vec4 vDim; varying vec2 vWxz; varying vec3 vFx; varying float vEye;
#include <fog_pars_vertex>
void main(){
  float kind = aDim.z, ang = aXf.z, len = aDim.y, wid = aDim.x, sunw = 0.;
  vec2 org = aXf.xy;
  if ((kind > 4.5 && kind < 5.5) || (kind > 8.5 && kind < 9.5)) {
    // (a cat's-paw wraps over 760 m at its own 7 to 12 m/s; a cloud's shadow, kind 9, over 2600 m at 5 m/s)
    float wrapL = kind > 8.5 ? 2600. : 760., spd = kind > 8.5 ? 5. : 7. + 5.*fract(aXf.w*7.3);
    float ph = fract(uTime*spd/wrapL + aXf.w*3.7);
    org += vec2(sin(ang), cos(ang))*(ph - 0.5)*wrapL;
    sunw = smoothstep(0., 0.14, ph)*(1. - smoothstep(0.86, 1., ph));
  }
  if (kind > 7.5 && kind < 8.5) { org = uOwn.xy; ang = uOwn.z; }           // our own mirror image: laid from the aircraft's keel each frame
  if (kind > 1.5 && kind < 2.5) {
    vec2 d = cameraPosition.xz - org; float dl = max(length(d), 1.); d /= dl;
    ang = atan(d.x, d.y + 1e-5);
    float r = wid*0.5;
    len = min(min(dl*0.94, aDim.y*1.5 + r), max(dl - r, 0.)*aDim.y/(max(cameraPosition.y, 1.) + aDim.y) + r);
    if (aDim.w > 2.5) len = clamp(dl*0.62, 18., 170.);     // a lamp's streak: the lamps burn by night only, when ripples draw each streak out far beyond its mirror image
    sunw = dot(d, uSunXZ);
  }
  float c = cos(ang), s = sin(ang);
  vec2 l = vec2(position.x*wid, position.z*len);
  // tide lines wind (three waves, up to a tenth of their length off the axis): never a ruled line across the bay
  if (kind > 0.5 && kind < 1.5) l.x += (sin(position.z*5.3 + aXf.w*40.)*0.55 + sin(position.z*11.9 + aXf.w*91. + uTime*0.05)*0.3 + sin(position.z*23.7 + aXf.w*17.)*0.15)*len*0.095;
  vec2 w = org + vec2(l.x*c + l.y*s, -l.x*s + l.y*c);
  // (the mirror image of a point as high above the water as the eye lies half-way between the eye's foot and its own: the
  // whole plan is drawn in toward the eye's foot by uOwnK)
  if (kind > 7.5 && kind < 8.5) w = cameraPosition.xz + (w - cameraPosition.xz)*uOwnK;
  vUv = vec2(position.x + 0.5, position.z); vDim = vec4(wid, len, kind, aDim.w); vWxz = w;
  float dist = length(cameraPosition - vec3(w.x, 0., w.y)); vEye = dist;
  vFx = vec3((1. - smoothstep(300., 1000., dist))*smoothstep(0.03, 0.14, cameraPosition.y/max(dist, 1.)), sunw, aXf.w);   // x: tide lines fade at grazing angles, where flecks could only read as a ruled line
  vec4 mvPosition = viewMatrix * vec4(w.x, 0.3 + kind*0.03, w.y, 1.);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const DEC_FRAG = /* glsl */`
uniform float uTime; uniform vec3 uShadowCol; uniform vec3 uFoamCol; uniform vec3 uGoldCol; uniform vec3 uSailCol; uniform vec3 uMint;
uniform float uShadowA; uniform float uReflA; uniform float uWake; uniform float uPawA; uniform vec3 uPawCol; uniform float uGlitA;
uniform vec4 uOwn; uniform vec3 uOwnCol; uniform float uCloudA; uniform vec4 uWalls[6]; uniform vec4 uEnd; uniform vec3 uEndCol; uniform vec4 uLane;
uniform vec3 uWallCol; uniform vec3 uWestCol; uniform float uWestA; uniform vec3 uGlitCol; uniform vec3 uLampCol; uniform vec3 uWakeCol; uniform float uMirA; uniform float uLampA; uniform float uWakeDark; uniform float uWakeK; uniform float uRunZ;
varying vec2 vUv; varying vec4 vDim; varying vec2 vWxz; varying vec3 vFx; varying float vEye;
#include <fog_pars_fragment>
${NOISE}
float h11(float n){ return fract(sin(n*127.1)*43758.5453); }
// one train of wavelets fixed to the water (kind 7): crests lie across the corridor in rows about a wavelength apart, bend
// and die out, but no two rows are alike: each crest has its own drawn place in its row (up to 0.15 of the spacing either
// way), its own drawn breadth, and its own drawn lengths along the row (one row's lit faces never line up with the
// next row's), so the lit faces are lenses some four times wider than long with soft pointed ends that make neither a
// ladder of equal rungs nor a grid. Returns (crest 0..1, the crest's envelope along its row 0..1).
vec2 wavelet(vec2 p, float lam, float t, float sd){
  float rot = 0.26*sin(sd*1.9 + 0.6);                                        // each train runs a little off the corridor's line: crests cross and fork
  p = vec2(p.x*cos(rot) - p.y*sin(rot), p.x*sin(rot) + p.y*cos(rot));
  float q = p.y/lam + (8.*(vnoise(vec2(p.x/(lam*2.2) + sd, p.y/(lam*2.6))) - 0.5) + 9.*(vnoise(vec2(p.x/(lam*6.) + sd*3., p.y/(lam*9.) + 5.)) - 0.5) + t)/6.2832;      // (the rows are bent by bounded warps)
  float k = floor(q), f = q - k, hk = h11(k*1.37 + sd*3.1), hw = h11(k*2.11 + sd*5.7 + 0.4);
  float crest = 1. - smoothstep(0.1, 0.24 + 0.1*hw, abs(f - 0.5 - (hk - 0.5)*0.3));      // (nothing at a row's edge: 0.15 + 0.34 < 0.5)
  return vec2(crest, smoothstep(0.22, 0.78, vnoise(vec2(p.x/(lam*(0.8 + 0.7*hw)) + hk*37. + sd, k*0.71 - t*0.12))));
}
// one layer of the path of light's glints (kind 7): the water is cut into cells (cell: metres across and along), each
// file of cells slid along by its own drawn share of a cell. A cell rolls its own dice against the path's density there
// (dens 0..1) and, if it wins, holds one glint at a drawn place, of a drawn size, winking at its own drawn rate: bright
// points with no rows or columns, crowded where the path is dense and thinning out to nothing at its sides
float glint(vec2 p, vec2 cell, float t, float sd, float dens){
  vec2 q = p/cell + vec2(sd*0.37, sd*0.61);
  q.y += h11(mod(floor(q.x), 199.)*0.713 + sd);
  vec2 id = floor(q), f = q - id;
  vec2 hid = mod(id, 199.)*0.0101 + sd*0.13;                                 // (a cell's number kept small, so the hash keeps its digits)
  float h1 = h21(hid), h2 = h21(hid + vec2(3.7, 1.9)), h3 = h21(hid*1.9 + 9.1), h4 = h21(hid*2.3 + vec2(5.3, 1.1)), rad = 0.2 + 0.2*h3;
  float wink = smoothstep(-1., 0., sin(t*(1.5 + 4.*h2) + h1*40.) + (h3 - 0.5)*0.8) * smoothstep(h4 - 0.06, h4 + 0.06, dens);
  return (1. - smoothstep(rad*0.55, rad, length(f - 0.5 - (vec2(h1, h2) - 0.5)*(1. - 2.*rad))))*wink;
}
void main(){
  float kind = vDim.z;
  float n = fbm3(vWxz*0.03 + vec2(uTime*0.02, vFx.z*9.));
  float ex = abs(vUv.x - 0.5)*2.;
  float xm = (vUv.x - 0.5)*vDim.x, ym = vUv.y*vDim.y;
  float fwz = fwidth(vWxz.y), fwx = fwidth(vWxz.x);
  // (the true range from the eye to this point of the water: vEye comes from the quad's corners, and across a wide quad it
  // reads tens of metres even under the float)
  float dEye = length(cameraPosition - vec3(vWxz.x, 0., vWxz.y));
  vec3 col; float a;
  if (kind > 8.5) {
    // a cloud's shadow drifting over the open bay: a broad soft-edged darkening, torn at its rim; none in the corridor
    float nn = fbm3(vWxz*0.0045 + vec2(uTime*0.004, vFx.z*9.));
    a = (1. - smoothstep(0.3, 1., length(vUv - vec2(0.5))*2. + (nn - 0.5)*1.1)) * vFx.y * uCloudA;
    a *= 1. - (1. - smoothstep(230., 380., abs(vWxz.x)))*(1. - smoothstep(520., 700., abs(vWxz.y - uRunZ - 60.)));
    col = uShadowCol;
  } else if (kind > 7.5) {
    // our own mirror image racing below: the flying boat's plan (hull, wing, floats, tail) as a pale shape on the water, pulled
    // about and torn into fine slivers by the ripples; it shows low down only, right under the float's nose and the bow
    // (within a dozen metres of the eye: further out the water mirrors sky and cliffs, and the wing's image spread over the
    // corridor read as pale blotches)
    float rp = vnoise(vec2(xm*1.3 + uTime*0.7, ym*5.2 - uTime*2.3)), rp2 = vnoise(vec2(xm*3.1 - uTime*0.5, ym*11. + uTime*1.9));
    float ax = xm + (rp - 0.5)*1.6, az = ym - 15. + (rp2 - 0.5)*0.7;
    float hullW = 1.75*sqrt(max(1. - az*az/210., 0.));
    float sh = (1. - smoothstep(hullW - 0.5, hullW + 0.3, abs(ax)))*step(abs(az), 14.4);
    float chord = mix(3.15, 1.5, clamp(abs(ax)/20., 0., 1.));
    sh = max(sh, (1. - smoothstep(chord - 0.5, chord + 0.3, abs(az - 0.15 - 0.05*abs(ax))))*(1. - smoothstep(19.3, 20.2, abs(ax))));
    sh = max(sh, (1. - smoothstep(0.35, 0.95, abs(abs(ax) - 11.9)))*(1. - smoothstep(2.4, 3.2, abs(az - 1.3))));
    sh = max(sh, (1. - smoothstep(0.9, 1.5, abs(az + 12.4)))*(1. - smoothstep(4.8, 5.6, abs(ax))));
    a = sh * smoothstep(0.46, 0.7, rp*0.6 + rp2*0.4) * (1. - smoothstep(8., 19., dEye)) * uOwn.w;
    col = uOwnCol*(0.6 + 0.3*rp2);
  } else if (kind < 0.5) {
    // a tower's shadow: a stripe as wide as the tower, straight-sided and hard-edged at the foot, its edge softening with the
    // distance the light has run (a penumbra), its far end fading out: a cast shadow, never a drifting blot
    a = (1. - smoothstep(mix(0.88, 0.5, vUv.y), 1., ex + (n - 0.5)*0.2*(0.25 + 0.75*vUv.y))) * (1. - smoothstep(0.62, 1., vUv.y + (n - 0.5)*0.2)) * smoothstep(0., 0.04, vUv.y);
    a *= uShadowA * (0.85 + 0.15*vnoise(vWxz*0.25 + uTime*0.15)) * mix(0.72, 1., smoothstep(4., 30., cameraPosition.y));     // (seen from low over it a shadowed reach keeps its jade)
    col = uShadowCol;
  } else if (kind < 1.5) {
    float line = (1. - smoothstep(0.1, 1., ex));
    // leaves, petals and froth as small flecks and winding threads (never blobs): finer close to, coarser far off
    float nearK = 1. - smoothstep(12., 40., vEye);
    float fs = mix(mix(7., 10., nearK), 1.7, smoothstep(25., 140., vEye));
    float fleck = smoothstep(0.58, 0.7, fbm3(vWxz*fs + vec2(uTime*0.04, vFx.z*7.)));
    float thr = 1. - abs(vnoise(vec2(xm*1.4 + vFx.z*30., ym*0.22 + uTime*0.03))*2. - 1.);
    fleck = max(fleck, smoothstep(0.9, 0.98, thr)*0.8*smoothstep(15., 42., vEye));     // threads only beyond 40 m: close to, a thread would swell into a blob
    float gaps = smoothstep(0.38, 0.62, vnoise(vec2(ym*0.045 + vFx.z*20., 3.)));
    a = line*line * fleck * gaps * smoothstep(0., 0.12, vUv.y) * (1. - smoothstep(0.88, 1., vUv.y)) * mix(0.52, 0.3, smoothstep(60., 160., vEye)) * vFx.x * smoothstep(9., 26., vEye);
    // small pale petals among the froth (pink-white and straw), never dark blotches
    float pet = vnoise(vWxz*mix(2.9, 6.5, nearK) + 5.);
    vec3 petal = mix(vec3(0.86, 0.62, 0.6), vec3(0.74, 0.72, 0.46), step(0.5, fract(pet*9.)));
    col = mix(uFoamCol, petal*(uFoamCol.g/0.7), smoothstep(0.62, 0.74, pet)*0.4);
  } else if (kind < 2.5) {
    float sc = 24./clamp(vEye, 12., 400.) + 0.25;                                  // ripples stay slivers at any range
    float rip = vnoise(vec2(xm*0.05*sc + vFx.z*9., ym*0.42*sc - uTime*0.5));
    float rip2 = vnoise(vec2(xm*0.16*sc, ym*1.3*sc + uTime*0.8));
    float edge = (1. - smoothstep(0.3, 1., ex + (n - 0.5)*0.7));
    float torn = mix(1., smoothstep(0.28, 0.7, rip*0.7 + rip2*0.3), 0.3 + 0.7*vUv.y);
    float tower0 = step(1.5, vDim.w);                                              // the Pierced Tower: its dark mirror runs right up to the eye
    float gold = smoothstep(-0.15, 0.55, vFx.y)*(1. - tower0);        // the Pierced Tower's face toward the run-in is in shade: a dark mirror
    // (a sunlit face's streak comes within 12 m of a low eye on the descent; dark mirrors keep off the water under the eye)
    a = edge * (1. - smoothstep(mix(0.7, 0.93, tower0), 1., vUv.y)) * smoothstep(0., 0.03, vUv.y) * mix(torn, 1., tower0*0.6) * mix(2.5, 1., smoothstep(6., 90., cameraPosition.y)) * smoothstep(mix(7., 2., tower0), mix(mix(34., 12., gold*(1. - smoothstep(6., 14., cameraPosition.y))*smoothstep(4.5, 8., cameraPosition.y)), 8., tower0), vEye);
    col = mix(uShadowCol*1.5, uGoldCol, gold);
    a *= uReflA * mix(1., 0.5, gold);
    if (vDim.w > 0.5 && vDim.w < 1.5) {                                             // a junk: her sails' colour wobbling under her, right up to the eye
      col = uSailCol; a = edge * (1. - smoothstep(0.75, 1., vUv.y)) * smoothstep(0., 0.03, vUv.y) * torn * smoothstep(4., 14., vEye) * uReflA * 2.6 * (0.6 + 0.4*sin(ym*1.3 + uTime*2. + rip*5.)); }
    if (vDim.w > 2.5) {                                                             // a squid boat's lamps: a long green-white streak of winking slivers, wandering as it comes
      float wig = (vnoise(vec2(ym*0.07 + vFx.z*5., uTime*0.35)) - 0.5)*(0.25 + 0.9*vUv.y);
      float core = 1. - smoothstep(0.05, 0.9, abs(vUv.x - 0.5 + wig)*2.);
      float sliv = smoothstep(0.4, 0.68, vnoise(vec2(xm*0.9 + vFx.z*9., ym*1.1*sc - uTime*1.3)));        // (slivers narrower than the streak: it never reads as a ruled bar)
      col = uLampCol; a = core * sliv * (0.35 + 0.65*exp(-vUv.y*3.5)) * (1. - smoothstep(0.6, 1., vUv.y)) * smoothstep(0., 0.03, vUv.y) * smoothstep(5., 16., vEye) * uLampA; }
  } else if (kind < 3.5) {
    float env = (1. - smoothstep(uWake - 36., uWake + 12., ym)) * smoothstep(0., 24., ym) * (1. - smoothstep(0.9, 1., vUv.y)) * (1. - smoothstep(0.72, 1., ex));
    float wave = sin((ym + abs(xm)*1.25)*0.62 - uTime*1.5 + (n - 0.5)*3. + (vnoise(vec2(xm*0.2, ym*0.15)) - 0.5)*4.);     // crests wander: no ruled chevrons
    float inV = (1. - smoothstep(-1.5, 1.5, abs(xm) - (2.5 + ym*0.075)));
    float sgn = xm < 0. ? -1. : 1., farK = smoothstep(25., 90., vEye);
    // a narrow V whose arms wander (each on its own, more the further they have run) and break into flecks: never two ruled lines
    float wob = (vnoise(vec2(ym*0.085 + sgn*3.7, sgn*5.1 + uTime*0.03)) - 0.5)*(2.4 + ym*0.02) + (vnoise(vec2(ym*0.31 - uTime*0.12, sgn*9.3)) - 0.5)*1.3;
    float armD = abs(abs(xm) - (2.5 + ym*0.075) - (n - 0.5)*2.2 - wob - sin(ym*0.33 + xm*0.2 - uTime*0.7)*0.3);
    float arm = 1. - smoothstep(0.05, 0.5 + ym*0.004 + fwz*0.6, armD);
    float gaps = smoothstep(0.3 + 0.2*farK, 0.62 + 0.14*farK, vnoise(vec2(xm*0.4 + 9., ym*0.3 - uTime*0.05))) * (0.55 + 0.45*vnoise(vec2(ym*1.3, xm*0.7 + uTime*0.3)));
    gaps *= smoothstep(0.25, 0.6, vnoise(vec2(ym*0.055 + sgn*11., 2.3 - uTime*0.02)) + 0.35*(1. - farK));          // whole stretches of an arm die away
    gaps *= 0.35 + 0.65*smoothstep(0.35, 0.62, vnoise(vec2(ym*0.8 - uTime*0.4, xm*0.9)));                         // flecks, not a band
    float fine = 0.05 + 0.95*smoothstep(0.5, 0.7, vnoise(vec2(xm*6. + 1., ym*4.5 - uTime*1.2))*0.7 + vnoise(vec2(xm*1.7 + 5., ym*1.3 - uTime*0.5))*0.3);      // close to, froth is flecks a hand wide: never a smooth blob
    float bright = clamp(arm*gaps, 0., 1.)*mix(fine, 0.32, farK);              // broken foam, not a painted line
    // and between the arms the crests of the wake's own waves carry broken froth: pale chevrons running on ahead of us
    bright = max(bright, smoothstep(0.78, 0.98, wave)*inV*smoothstep(0.42, 0.7, vnoise(vec2(xm*0.8 + 4., ym*1.1 - uTime*0.5)))*smoothstep(0.3, 0.6, vnoise(vec2(xm*0.13, ym*0.07 + 7.)))*fine*mix(0.55, 0.3, farK));
    float dark = (1. - smoothstep(-0.95, -0.3, wave))*0.4*(0.35 + 0.65*inV)*uWakeDark*smoothstep(0.2, 0.5, vnoise(vec2(xm*0.11 + 2., ym*0.09)));
    a = env * max(min(bright*uWakeK, 0.95), dark) * smoothstep(3., 12., vEye);
    col = mix(uShadowCol*2.2, uWakeCol, bright/(bright + dark + 1e-3));
  } else if (kind > 6.5) {
    // THE CORRIDOR'S WATER, one sheet from the mouth to the tunnel, the same rule at every height of the eye. The eye's ray,
    // reflected at this point of the water, runs on level over it and meets the east wall, the west wall or the Pierced
    // Tower's face (uWalls: each wall tower's place, half length, height and the x of its face; uEnd): what stands there is
    // what the water mirrors. The mirror is carried by the wavelets (five trains fixed to the water): each lit face is a
    // broad soft lens lying level, big and round close to, thin far off, and beyond the range at which a train can be
    // resolved it gives its mean instead, so far down the corridor the image is whole and calm. Down the middle of the
    // channel lies the one path of light, a lane fixed on the water (uLane): glints of fine sparkle only inside it.
    vec2 rel = vWxz - cameraPosition.xz; float r = max(length(rel), 0.5); vec2 dr = rel / r;
    float fp = max(fwz, fwx * 0.33), t = uTime;
    vec2 w0 = wavelet(vWxz + 11., 21., t * 0.7, 12.), w1 = wavelet(vWxz, 13., t * 0.9, 0.), w2 = wavelet(vWxz + 31., 5.2, t * 1.4, 3.), w3 = wavelet(vWxz + 57., 2.1, t * 2.1, 6.), w4 = wavelet(vWxz + 83., 0.85, t * 3.0, 9.);
    vec4 wr = 1. - smoothstep(vec4(13., 5.2, 2.1, 0.85) / 9., vec4(13., 5.2, 2.1, 0.85) / 3.5, vec4(fp));       // how well each train is resolved here
    float wr0 = 1. - smoothstep(21. / 9., 21. / 3.5, fp);
    vec4 lv = smoothstep(0.2, 0.5, vec4(w1.x * (0.12 + 1.1 * w1.y), w2.x * (0.12 + 1.1 * w2.y), w3.x * (0.12 + 1.1 * w3.y), w4.x * (0.12 + 1.1 * w4.y)));
    vec4 lk = mix(vec4(0.36), lv, wr);                                          // (a train too fine to resolve gives its mean)
    float lk0 = mix(0.36, smoothstep(0.2, 0.5, w0.x * (0.12 + 1.1 * w0.y)), wr0);
    float lens = clamp(dot(lk, vec4(0.44, 0.36, 0.22, 0.14)) + 0.4 * lk0 - 0.14, 0., 1.);     // broad lenses of two lengths, finer ones riding on them and lying between them
    float wob = (w0.x - 0.4) * 0.24 * wr0 + (w1.x - 0.4) * 0.24 * wr.x + (w2.x - 0.4) * 0.2 * wr.y + (w3.x - 0.4) * 0.1 * wr.z;                    // the image shivers with the swell
    float rag = (n - 0.5) * 22. + (vnoise(vWxz * 0.21 + vec2(0., uTime * 0.2)) - 0.5) * 14.;      // a mirrored crown or corner frays (a broad wander and a finer one): never a ruled line down the water
    float rise = cameraPosition.y / r * (1. + wob);                             // metres the reflected ray climbs for each metre it runs
    float sd = dr.x < 0. ? -1. : 1.;
    float best = 0., bh = 0., bz = 0., bH = 1., bt = 1e4;
    for (int i = 0; i < 6; i++) {
      vec4 W = uWalls[i];
      float tw = (abs(W.w) - sd * vWxz.x) / max(sd * dr.x, 2e-3);
      float zh = vWxz.y + dr.y * tw + wob * 14., h = rise * tw;
      float ins = step(0., sd * W.w) * step(0., tw) * (1. - smoothstep(W.y - 16., W.y + 6., abs(zh - W.x) + rag * 0.5)) * (1. - smoothstep(W.z * 0.72, W.z, h + rag * 1.3));
      if (ins > 0.01 && tw < bt) { bt = tw; best = ins; bh = h; bz = zh; bH = W.z; }
    }
    float te = (vWxz.y - uEnd.x) / max(-dr.y, 2e-3), xe = vWxz.x + dr.x * te + wob * 14., he = rise * te;
    float insE = step(0., te) * (1. - smoothstep(uEnd.y - 16., uEnd.y + 6., abs(xe) + rag * 0.5)) * (1. - smoothstep(uEnd.z * 0.78, uEnd.z, he + rag));
    float endK = (insE > 0.01 && te < bt) ? 1. : 0.;
    // the wall's own light where the ray lands: paler ribs, dark curtains, creepers, level beds
    float face = fbm3(vec2(bz * 0.035, bh * 0.03) + 5.);
    float curt = smoothstep(0.3, 0.72, vnoise(vec2(bz * 0.11, bh * 0.045) + 3.));
    vec3 wallC = sd > 0. ? uWallCol : uWestCol;
    vec3 cM = wallC * (0.62 + 0.55 * face) * (1. - 0.22 * curt) * (0.9 + 0.1 * sin(bh * 0.4 + face * 6.));
    cM = mix(cM, wallC * vec3(0.25, 0.42, 0.2), 0.55 * smoothstep(0.62, 0.75, vnoise(vec2(bz * 0.06 + 9., bh * 0.045))));
    float upK = mix(1., 0.45, smoothstep(0.3, 0.85, bh / bH));                  // the wall's upper half, hung with creepers, gives a dimmer image: the band lies under the cliff
    float aW = best * upK * smoothstep(1.5, 7., bh) * (sd > 0. ? uMirA : uWestA);
    vec3 cE = mix(uEndCol * (0.8 + 0.4 * n), uMint * 0.7, exp(-xe * xe / 300.) * exp(-he / 26.) * 0.7);
    float aE = insE * 0.7 * (1. - smoothstep(120., 330., te));                 // the Pierced Tower's shaded face and the tunnel's glow, on the water in front of it
    float aM0 = mix(aW, aE, endK);
    cM = mix(cM, cE, endK);
    float graze = 1. - smoothstep(0.3, 1.3, cameraPosition.y / max(dEye, 1.));       // a mirror at grazing angles; looked down on, the water keeps more of its own colour
    float rng = smoothstep(4., 13., dEye) * (1. - smoothstep(520., 900., dEye));
    float aM = aM0 * lens * mix(0.45, 1., graze) * rng;
    // THE PATH OF LIGHT is the water's own: a lane fixed on the water down the middle of the channel (uLane: its mean
    // centre line's x, its half width, its north end at the tunnel and its south end at the corridor's mouth). Its centre
    // line wanders and its breadth swells and narrows along the corridor, by noise that lies on the water; it is dense
    // down its middle and thins out to nothing at its sides, is broken into long patches, and is denser on the lit faces of
    // the wavelets. It is the same lane from any eye; like any mirror it is brightest at grazing angles. Its light is
    // glints: bright points, each at a drawn place in its own cell of the water, of a drawn size, winking at its own rate
    // (two layers, the second turned and a third coarser). A cell is four pixels of water across the corridor and two
    // along it, stepping in octaves that cross-fade each way, so the sparkle is fine at any range and never blocks; where
    // a cell would be far longer than the waves are (far off at grazing angles) the lane shows the glints' mean light
    // instead, a faint pale path.
    float lc = uLane.x + (vnoise(vec2(vWxz.y * 0.013, 7.3)) - 0.5) * 1.2 * uLane.y, lw0 = uLane.y * (0.7 + 0.6 * vnoise(vec2(vWxz.y * 0.021 + 3.1, 1.7)));
    float prof = 1. - smoothstep(0.05, 1., abs(vWxz.x - lc) / lw0 + (n - 0.5) * 0.5);
    float laneK = prof * smoothstep(uLane.z + 4., uLane.z + 40., vWxz.y) * (1. - smoothstep(uLane.w - 110., uLane.w, vWxz.y));
    float dens = laneK * sqrt(prof) * smoothstep(0.18, 0.5, vnoise(vec2(vWxz.x * 0.11 + 3.9, vWxz.y * 0.012 + uTime * 0.02))) * (0.45 + 0.55 * smoothstep(0.1, 0.55, lens));
    float gz = clamp(2. * fwz, 0.03, 64.), gw = clamp(4. * fwx, 0.03, 64.);
    float lz = log2(gz), lzi = floor(lz), lzf = lz - lzi, lw = log2(gw), lwi = floor(lw), lwf = lw - lwi;
    vec2 c0 = vec2(exp2(lwi), exp2(lzi)), p2 = vec2(vWxz.x * 0.825 - vWxz.y * 0.565, vWxz.x * 0.565 + vWxz.y * 0.825);
    float sA = lwi * 7. + lzi * 3., G = 0.;
    if (dens > 0.002) for (int i = 0; i < 4; i++) {
      float ix = mod(float(i), 2.), iz = floor(float(i) / 2.);
      float g1 = glint(vWxz, c0 * vec2(1. + ix, 1. + iz), t, sA + ix * 7. + iz * 3., dens), g2 = glint(p2, c0 * vec2(1. + ix, 1. + iz) * 1.3, t, sA + ix * 7. + iz * 3. + 41., dens);
      G += (g1 + g2 - g1 * g2) * mix(1. - lwf, lwf, ix) * mix(1. - lzf, lzf, iz);
    }
    float res = 1. - smoothstep(20., 60., gz);
    float aL = clamp((0.1 * lens * laneK + mix(0.24 * dens, G, res)) * mix(0.5, 1., graze) * rng * uGlitA, 0., 0.95);
    a = aM + aL - aM * aL;
    col = (cM * aM * (1. - aL) + uGlitCol * aL) / max(a, 1e-3);
  } else if (kind > 4.5) {
    float body = (1. - smoothstep(0.2, 1., ex + (n - 0.5)*0.9)) * smoothstep(0., 0.3, vUv.y + (n - 0.5)*0.3) * (1. - smoothstep(0.55, 1., vUv.y + (n - 0.5)*0.4));
    float sc = clamp(vEye/70., 1., 10.);
    float yw = ym + (vnoise(vec2(xm*0.19 + vFx.z*31., ym*0.07 + vFx.z*17.)) - 0.5)*1.6*sc;        // the ruffle's rows wander, each paw's by its own noise: never ruled lines across the water
    float ruff = vnoise(vec2(xm*0.5, yw*2.0 - uTime*3.)/sc);
    float spark = smoothstep(0.62, 0.9, vnoise(vec2(xm*0.45 + 3., yw*4.6 - uTime*6.)/sc));        // pale capillary streaks across the ruffle
    a = min(smoothstep(0.08, 0.5, body) * vFx.y * uPawA * (0.72 + 0.28*ruff) * mix(1.3, 1., smoothstep(4., 14., cameraPosition.y)), 0.9);
    a *= 1. - (1. - smoothstep(uRunZ - 70., uRunZ + 20., vWxz.y))*(1. - smoothstep(70., 130., abs(vWxz.x)));     // none darkens the alighting run (uRunZ: where the keel kisses), whatever the wind: clean jade from there to the portal
    col = mix(uPawCol*(0.8 + 0.4*ruff), mix(uFoamCol, uPawCol*4., 0.6)*0.5, spark*0.3*body);
  } else {
    // the portal's light lying on the water: bright at the tunnel, a long thin streak down the corridor's axis, broken by ripples
    // (ripples in world space, coarser with range: perspective alone flattens them into slivers; nothing under the eye)
    float sc = clamp(45./max(vEye, 1.), 0.3, 1.4);
    float torn = smoothstep(0.3, 0.68, fbm3(vec2(xm*0.33 + 3., ym*0.24 - uTime*0.35)*sc));
    float along = 0.6*exp(-vUv.y*9.) + 0.5*(1. - vUv.y)*(1. - vUv.y);
    a = min(along * (1. - smoothstep(mix(0.1, 0.55, vUv.y), 1., ex)) * (0.22 + 1.0*torn) * (1. - smoothstep(0.9, 1., vUv.y)), 0.85) * smoothstep(14., 60., vEye);
    col = uMint;
  }
  if (a < 0.004) discard;
  gl_FragColor = vec4(col, a);
  #include <fog_fragment>
}`;

// ---- the departing shower's ragged base overhead at the entry: solid slate inside, torn and gold-rimmed at its edge
const CEIL_VERT = /* glsl */`
varying vec3 vW;
void main(){ vec4 wp = modelMatrix * vec4(position, 1.); vW = wp.xyz; gl_Position = projectionMatrix * viewMatrix * wp; }`;
const CEIL_FRAG = /* glsl */`
uniform float uTime; uniform vec3 uCol; uniform vec3 uRim; uniform vec4 uEdge;
varying vec3 vW;
${NOISE}
void main(){
  vec2 q = vW.xz*0.0016 + vec2(uTime*0.004, uTime*0.002);
  float n = fbm3(q) * 0.7 + fbm3(q*3.7 + 5.)*0.3;
  vec2 rel = vW.xz - uEdge.xy;
  float d = dot(rel, uEdge.zw), b = dot(rel, vec2(-uEdge.w, uEdge.z));       // metres ahead of the entry, metres to its right (toward the corridor)
  float fine = fbm3(q*8.3 + 3.);
  float e = d + (n - 0.5)*480. + (fine - 0.5)*130.;
  float eb = b + (fbm3(q*1.4 + 11.) - 0.5)*420. + (fine - 0.5)*110.;
  float a = 1. - smoothstep(700., 930., e);
  a *= 1. - smoothstep(380., 760., eb);                                       // the shower covers the sky over the entry run; it has drawn off the corridor, far to the right
  float cov = n + 0.6*(1. - smoothstep(250., 820., d)) + (fine - 0.5)*0.14;
  a *= smoothstep(0.1, 0.36, cov);
  float rim = max(smoothstep(560., 930., e), smoothstep(200., 760., eb));
  float thin = (1. - smoothstep(0.36, 0.66, cov)) * 0.6;                       // where the base is thin the light comes through: lit, torn edges round every rent
  float belly = smoothstep(0.42, 0.78, fbm3(q*5.1 + 17.));                        // hanging bellies of the base catch the low light from the open sky ahead
  vec3 col = mix(uCol*(0.62 + 0.6*n)*(0.85 + 0.3*fine) + uRim*0.07*belly, uRim, max(rim*rim*0.75, thin));
  // no hard line where the sheet runs to the horizon or to its own end: it thins with distance and at grazing angles
  vec3 V = vW - cameraPosition; float dist = length(V);
  a *= smoothstep(0.035, 0.15, abs(V.y)/max(dist, 1.)) * (1. - smoothstep(1700., 2900., dist)) * mix(1., 0.8, rim);
  if (a < 0.004) discard;
  gl_FragColor = vec4(col, a*0.98);
}`;

// ---- dawn only: the milk floor of sea fog the towers stand in, a sheet 9 m up seen from above, in kilometre lanes with open
// glittering water between and billows lit from the sun's side; it thins as the eye sinks
// toward it (uFade) while the scene fog thickens instead, so the junks' sails stay clear of it
const FLOOR_FRAG = /* glsl */`
uniform float uTime; uniform vec3 uCol; uniform vec3 uShade; uniform vec3 uHazeSun; uniform vec3 uHazeAway; uniform vec3 uSunDir; uniform float uFade; uniform vec2 uMid; uniform vec3 uClear; uniform vec2 uCorr;
varying vec3 vW;
${NOISE}
float billow(vec2 p){ return fbm3(p)*0.62 + fbm3(p*3.1 + 9.)*0.38; }
void main(){
  vec2 sx = normalize(uSunDir.xz + vec2(1e-5));
  float lanes = fbm3(vW.xz*0.0011 + vec2(uTime*0.003, -uTime*0.0015) + 3.);          // kilometre lanes of fog and open water
  vec2 q = vW.xz*0.0062 + vec2(uTime*0.008, uTime*0.003);
  float bil = billow(q), bilS = billow(q + sx*0.22);
  float fine = fbm3(vW.xz*0.036 + vec2(uTime*0.02, 0.)), fineS = fbm3((vW.xz + sx*7.)*0.036 + vec2(uTime*0.02, 0.));
  float clearing = exp(-dot(vW.xz - uClear.xy, vW.xz - uClear.xy)/(uClear.z*uClear.z));    // open dark water round the Sentinel: the entry keeps its contrast
  float canyon = (1. - smoothstep(150., 270., abs(vW.x))) * smoothstep(uCorr.x - 40., uCorr.x + 30., vW.z) * (1. - smoothstep(uCorr.y - 60., uCorr.y + 60., vW.z));
  // in the corridor the floor is torn into wisps over dark water (the rafts and junks stay in view)
  // (thin torn threads lying along it, thicker against the cliff feet: under half of it covered, soft wide edges)
  float thread = 1. - abs(fbm3(vec2(vW.x*0.021, vW.z*0.0065) + vec2(uTime*0.012, uTime*0.004))*2. - 1.);
  float hug = smoothstep(12., 52., abs(vW.x))*(1. - 0.6*smoothstep(70., 110., abs(vW.x)));     // thickest at the corridor's cliff feet, thin again in the side channels between the wall towers
  float coverC = smoothstep(0.8, 1.0, thread + 0.03*hug)*smoothstep(0.3, 0.7, fine*0.75 + bil*0.35)*(0.24 + 0.26*hug);
  float cover = mix(smoothstep(0.37, 0.6, lanes*0.74 + bil*0.4 - 0.5*clearing), coverC, canyon);
  float dC = length(vW.xz - uMid);
  float a = cover * (0.6 + 0.4*smoothstep(0.3, 0.7, bil)) * (1. - smoothstep(3200., 4500., dC)) * uFade;
  vec3 V = vW - cameraPosition; float d = length(V);
  float toSun = max(dot(normalize(V.xz + vec2(1e-5)), sx), 0.);
  float lit = clamp(0.5 + (bil - bilS)*4.5 + (fine - fineS)*2.2, 0., 1.);             // billows lit from the sun's side
  lit = mix(lit, clamp(0.25 + (fine - fineS)*5. + 0.5*smoothstep(0., 40., vW.x), 0., 1.), canyon);   // in the corridor: rose on the wisps' sunward tops (the lit east side), blue-grey beneath
  vec3 col = mix(uShade, uCol, lit) * (0.8 + 0.2*bil + (0.16 + 0.3*canyon)*(fine - 0.4)) + uHazeSun*0.2*toSun*toSun*(1. - canyon);
  col = mix(col, mix(uHazeAway, uHazeSun, toSun*toSun), 1. - exp(-d*0.00035));
  a *= smoothstep(4., 30., d);
  if (a < 0.004) discard;
  gl_FragColor = vec4(col, a*0.8);
}`;

// ---- sun shafts leaning down from the edge of the shower: ribbons turned to face the eye about their own axis, additive
const SHAFT_VERT = /* glsl */`
attribute vec3 aTop; attribute vec4 aW;
uniform vec3 uSunDir; uniform float uTime;
varying vec2 vUv; varying float vSeed; varying float vA;
void main(){
  vec3 top = aTop + vec3(sin(uTime*0.02 + aW.z*9.)*30., 0., uTime*0.5);
  vec3 ax = -normalize(uSunDir);
  float len = (top.y + 2.) / max(uSunDir.y, 0.12);
  vec3 c = top + ax*len*position.y;
  vec3 toEye = cameraPosition - c;
  vec3 sd = cross(ax, toEye); float sl = length(sd); sd = sl > 1e-3 ? sd/sl : vec3(1., 0., 0.);
  vec3 wp = c + sd*position.x*mix(aW.x, aW.y, position.y);
  vUv = vec2(position.x*2., position.y); vSeed = aW.z;
  float along = abs(dot(normalize(toEye + vec3(1e-4)), ax));
  vA = aW.w * (1. - 0.6*smoothstep(0.92, 1., along)) * smoothstep(20., 160., length(toEye));
  gl_Position = projectionMatrix * viewMatrix * vec4(wp, 1.);
}`;
const SHAFT_FRAG = /* glsl */`
uniform vec3 uCol; uniform float uTime;
varying vec2 vUv; varying float vSeed; varying float vA;
${NOISE}
void main(){
  float ex = abs(vUv.x);
  float ray = 0.55 + 0.45*vnoise(vec2(vUv.x*3.5 + vSeed*13., uTime*0.05 + vSeed));
  float a = (1. - smoothstep(0.62, 1., ex)) * ray * smoothstep(0., 0.07, vUv.y) * (1. - smoothstep(0.55, 1., vUv.y)) * vA;
  gl_FragColor = vec4(uCol * a, 1.);
}`;

// ---- the last of the shower whipping past the strut in the first seconds: short streaks in a box that wraps round the eye,
// drawn out along the air's speed past us (uRel), coming in shreds (gusts), never under a pixel and a half wide
const RAIN_VERT = /* glsl */`
attribute vec4 aR;
uniform float uTime; uniform float uRain; uniform vec3 uRel;
varying float vA; varying vec2 vUv;
void main(){
  vec3 box = vec3(52., 30., 52.);
  vec3 c = mod(aR.xyz*box + vec3(1.5, -9., 1.)*uTime - cameraPosition, box) - box*0.5;          // metres from the eye: drops falling in the world, which we fly through
  float dist = length(c);
  vec3 dir = uRel/max(length(uRel), 1e-3);
  vec3 sd = cross(dir, c); float sl = length(sd); sd = sl > 1e-4 ? sd/sl : vec3(1., 0., 0.);
  float len = 1.3 + 2.2*aR.w, wid = max(0.012, 0.0042*dist);
  vec3 wp = cameraPosition + c + dir*(position.y - 0.5)*len + sd*position.x*wid;
  float gust = 0.5 + 0.5*sin((cameraPosition.x + c.x)*0.11 + uTime*1.9 + aR.w*2.)*sin((cameraPosition.z + c.z)*0.13 - uTime*1.4);
  vA = uRain*smoothstep(1.2, 4., dist)*(1. - smoothstep(16., 25., dist))*smoothstep(0.2, 0.7, gust)*(0.35 + 0.65*aR.w)*clamp(0.03/wid, 0.45, 1.);
  vUv = position.xy;
  gl_Position = uRain < 0.004 ? vec4(2., 2., 2., 1.) : projectionMatrix*viewMatrix*vec4(wp, 1.);
}`;
const RAIN_FRAG = /* glsl */`
uniform vec3 uCol;
varying float vA; varying vec2 vUv;
void main(){
  float a = vA*(1. - smoothstep(0.2, 0.5, abs(vUv.x)))*smoothstep(0., 0.25, vUv.y)*(1. - smoothstep(0.6, 1., vUv.y));
  if (a < 0.004) discard;
  gl_FragColor = vec4(uCol, a);
}`;
// ---- a cooking fire's smoke thread from a junk: a ribbon that rises, bends downwind and widens, turned to the eye, its
// body torn by noise that climbs with it
const SMOKE_VERT = /* glsl */`
attribute vec4 aS;                                  // foot (x, y, z) and seed
uniform float uTime; uniform vec2 uWind;
varying vec2 vUv; varying float vSeed;
#include <fog_pars_vertex>
void main(){
  float t = position.y;
  vec3 c = aS.xyz + vec3(0., t*24., 0.);
  c.xz += uWind*(t*t*15. + t*2.) + vec2(sin(t*6.5 - uTime*0.9 + aS.w*9.), cos(t*5.1 - uTime*0.7 + aS.w*5.))*0.9*t;
  vec3 up = normalize(vec3(uWind.x*(t*30. + 2.), 24., uWind.y*(t*30. + 2.)));
  vec3 sd = cross(up, cameraPosition - c); float sl = length(sd); sd = sl > 1e-4 ? sd/sl : vec3(1., 0., 0.);
  float dist = length(cameraPosition - c);
  vec3 wp = c + sd*position.x*max(0.5 + 5.*t, 0.006*dist);
  vUv = vec2(position.x*2., t); vSeed = aS.w;
  vec4 mvPosition = viewMatrix*vec4(wp, 1.);
  gl_Position = projectionMatrix*mvPosition;
  #include <fog_vertex>
}`;
const SMOKE_FRAG = /* glsl */`
uniform float uTime; uniform vec3 uCol; uniform vec3 uLit;
varying vec2 vUv; varying float vSeed;
#include <fog_pars_fragment>
${NOISE}
void main(){
  float t = vUv.y;
  float n = fbm3(vec2(vUv.x*1.3 + vSeed*13., t*5. - uTime*0.45)), n2 = vnoise(vec2(vUv.x*3.1 + vSeed*7., t*13. - uTime*0.9));
  float a = (1. - smoothstep(0.25, 1., abs(vUv.x) + (n - 0.5)*0.7))*smoothstep(0., 0.05, t)*(1. - smoothstep(0.45, 1., t))*smoothstep(0.25, 0.6, n*0.7 + n2*0.3 + 0.25*(1. - t))*mix(0.62, 0.3, t);
  if (a < 0.004) discard;
  gl_FragColor = vec4(mix(uCol, uLit, smoothstep(-0.6, 0.8, vUv.x + (n - 0.5))*0.7), a);
  #include <fog_fragment>
}`;

// ================================================================ 2. geometry
// a far tower in the unit box, in three plan shapes (variant 0 squarish, 1 a long block, 2 a lobed one): sheer sides to a hard
// shoulder at 0.955, a 3% lip, a nearly flat hummocked roof, and one or two lower terraces (stepped blocks standing out from
// the wall with their own flat tops), so every silhouette has a dark top and a notch in its shoulder line
const FAR_V = [{ ex: 2.5, el: 1.0, steps: [[0.9, 1.5, 0.66, 1.2]], ph: 0 }, { ex: 2.1, el: 1.38, steps: [[3.3, 1.2, 0.74, 1.14]], ph: 2.1 },
  { ex: 2.9, el: 0.84, steps: [[5.2, 1.1, 0.58, 1.26], [2.2, 0.9, 0.8, 1.1]], ph: 4.4 }];
// a point on a far tower's roof in its unit box: angle a, rw = share of the shoulder radius (kept inside the main roof where a
// terrace cuts the shoulder). Follows farTowerGeo's own outline and hummocks.
function farRoof(variant, a, rw) {
  const V = FAR_V[variant % 3], ca = Math.cos(a), sa = Math.sin(a);
  for (const st of V.steps) { let d = Math.abs(a - st[0]); d = Math.min(d, Math.PI * 2 - d); if (d < st[1] * 0.5 + 0.12) rw = Math.min(rw, 0.56); }
  const sq = 1 / Math.pow(Math.pow(Math.abs(ca), V.ex) + Math.pow(Math.abs(sa / V.el), V.ex), 1 / V.ex) / Math.max(1, V.el);
  const f = rw > 0.66 ? 0.99 : (rw > 0.36 ? lerp(1.0, 0.993, (rw - 0.36) / 0.3) : 1.0);
  const lump = 1 + 0.07 * Math.sin(2 * a + 1 + V.ph + f * 1.2) + 0.055 * Math.sin(3 * a + 2.3 + V.ph) + 0.045 * Math.sin(7 * a + f * 5 + V.ph) + 0.03 * Math.sin(11 * a + V.ph * 2);
  const rr = rw * lump * sq * 0.95;
  return [ca * rr, f + 0.022 * Math.sin(5 * a + V.ph) * (rw / 0.9) + 0.016 * Math.sin(9 * a + 1.3 + V.ph) * (rw / 0.9) + 0.018 * (1 - rw), sa * rr];
}
function farTowerGeo(variant = 0) {
  const SEG = 24, rows = [[0, 0.9], [0.01, 0.83], [0.028, 1.0], [0.3, 1.0], [0.62, 0.99], [0.86, 0.985], [0.955, 0.98], [0.978, 0.95], [0.988, 0.87], [0.993, 0.66], [1.0, 0.36], [1.0, 0.02]];
  const V = FAR_V[variant % 3];
  const pos = [], idx = [];
  for (let r = 0; r < rows.length; r++) for (let k = 0; k <= SEG; k++) {
    const a = (k / SEG) * Math.PI * 2, ca = Math.cos(a), sa = Math.sin(a), f = rows[r][0], rw = rows[r][1];
    const sq = 1 / Math.pow(Math.pow(Math.abs(ca), V.ex) + Math.pow(Math.abs(sa / V.el), V.ex), 1 / V.ex) / Math.max(1, V.el);
    const lump = 1 + 0.07 * Math.sin(2 * a + 1 + V.ph + f * 1.2) + 0.055 * Math.sin(3 * a + 2.3 + V.ph) + 0.045 * Math.sin(7 * a + f * 5 + V.ph) + 0.03 * Math.sin(11 * a + V.ph * 2);
    let rr = rw * lump * sq * 0.95, y = f;
    // terraces: inside a sector the wall stands out and stops at the terrace height; the roof rows keep the full height
    let low = 1, out = 1;
    for (const st of V.steps) { let d = Math.abs(a - st[0]); d = Math.min(d, Math.PI * 2 - d); if (d < st[1] * 0.5) { low = Math.min(low, st[2]); out = Math.max(out, st[3]); } }
    if (rw > 0.8) { rr *= out; if (low < 1) y = f < 0.3 ? f : 0.3 + (f - 0.3) * (low - 0.3) / 0.7; }
    else if (low < 1 && rw > 0.6) { rr *= 0.5 + 0.5 * out; }
    // the roof rolls a few per cent (hummocks), never to a point
    if (rw < 0.9) y += 0.022 * Math.sin(5 * a + V.ph) * (rw / 0.9) + 0.016 * Math.sin(9 * a + 1.3 + V.ph) * (rw / 0.9) + 0.018 * (1 - rw);
    pos.push(ca * rr, y, sa * rr);
  }
  for (let r = 0; r < rows.length - 1; r++) for (let k = 0; k < SEG; k++) {
    const a = r * (SEG + 1) + k, b = a + 1, c = a + SEG + 1, d = c + 1;
    idx.push(a, c, b, b, c, d);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
  return g;
}

// flat-shaded soup builder with colour and a flex channel
class Soup {
  constructor() { this.p = []; this.n = []; this.c = []; this.f = []; this.q = []; }
  tri(a, b, c, col, fa = 0, fb = 0, fc = 0, pa = null, pb = null, pc = null) {
    const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
    let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
    this.p.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2]);
    for (let i = 0; i < 3; i++) { this.n.push(nx, ny, nz); this.c.push(col[0], col[1], col[2]); }
    this.f.push(fa, fb, fc);
    if (pa) this.q.push(pa[0], pa[1], pb[0], pb[1], pc[0], pc[1]); else this.q.push(-1, 0, -1, 0, -1, 0);     // sail-panel coordinates, or none
  }
  quad(a, b, c, d, col, fa = 0, fb = 0, fc = 0, fd = 0, pa = null, pb = null, pc = null, pd = null) { this.tri(a, b, c, col, fa, fb, fc, pa, pb, pc); this.tri(a, c, d, col, fa, fc, fd, pa, pc, pd); }
  // a stay or thin spar from a to b: two crossed ribbons w wide
  beam(a, b, w, col) {
    const dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2]; let sx = -dz, sz = dx; const sl = Math.hypot(sx, sz);
    if (sl < 1e-4) { sx = 1; sz = 0; } else { sx /= sl; sz /= sl; }
    let tx = dy * sz, ty = dz * sx - dx * sz, tz = -dy * sx; const tl = Math.hypot(tx, ty, tz) || 1; tx /= tl; ty /= tl; tz /= tl;
    const h = w / 2, q = (ox, oy, oz) => this.quad([a[0] - ox * h, a[1] - oy * h, a[2] - oz * h], [a[0] + ox * h, a[1] + oy * h, a[2] + oz * h], [b[0] + ox * h, b[1] + oy * h, b[2] + oz * h], [b[0] - ox * h, b[1] - oy * h, b[2] - oz * h], col);
    q(sx, 0, sz); q(tx, ty, tz);
  }
  box(cx, cy, cz, sx, sy, sz, col, fl = 0) {
    const x0 = cx - sx / 2, x1 = cx + sx / 2, y0 = cy - sy / 2, y1 = cy + sy / 2, z0 = cz - sz / 2, z1 = cz + sz / 2;
    const q = (a, b, c, d) => this.quad(a, b, c, d, col, fl, fl, fl, fl);
    q([x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]); q([x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0]);
    q([x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1]); q([x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0]);
    q([x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0]); q([x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1]);
  }
  build() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(this.n, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(this.c, 3)); g.setAttribute('aFlex', new THREE.Float32BufferAttribute(this.f, 1));
    g.setAttribute('aPan', new THREE.Float32BufferAttribute(this.q, 2));
    return g;
  }
}
const C3 = (hex, k = 1) => { const c = new THREE.Color(hex); return [c.r * k, c.g * k, c.b * k]; };

// a 22 m three-masted junk: lofted hull with sheer, cabin, awning, rail clutter, stern lamp, three batwing sails
function junkGeo(sailHex) {
  const S = new Soup(), wood = C3('#4a3524'), woodD = C3('#2a1e15'), rail = C3('#7a5a36'), canvas = C3('#b9ab8a'), sail = C3(sailHex);
  const st = [];
  for (let i = 0; i <= 10; i++) {
    const z = -11 + 2.2 * i, t = z / 11.4, w = 3.3 * Math.pow(Math.max(0.02, 1 - t * t), 0.6) * (z < 0 ? 1.0 : 0.92);
    const d = 1.5 + 2.1 * t * t * (z < 0 ? 1.25 : 0.8);
    st.push([[-w, d, z], [-w * 0.94, 0.3, z], [-w * 0.5, -0.6, z], [w * 0.5, -0.6, z], [w * 0.94, 0.3, z], [w, d, z], [w * 0.9, d - 0.4, z], [-w * 0.9, d - 0.4, z]]);
  }
  for (let i = 0; i < 10; i++) for (let k = 0; k < 8; k++) {
    const k2 = (k + 1) % 8, col = k === 0 || k === 4 ? wood : (k === 6 ? rail : (k === 5 || k === 7 ? rail : woodD));
    S.quad(st[i][k], st[i + 1][k], st[i + 1][k2], st[i][k2], col);
  }
  S.quad(st[0][0], st[0][1], st[0][4], st[0][5], wood); S.quad(st[0][1], st[0][2], st[0][3], st[0][4], woodD);
  S.box(0, 4.6, -8.6, 4.4, 2.2, 4.2, wood); S.box(0, 5.8, -8.6, 5.0, 0.2, 4.8, canvas);
  S.box(0, 3.2, -3.2, 4.2, 0.12, 3.6, canvas);
  for (const sx of [-1.9, 1.9]) for (const sz of [-4.8, -1.6]) S.box(sx, 2.3, sz, 0.12, 1.8, 0.12, woodD);
  S.box(0, 0.6, -11.6, 0.25, 3.4, 1.6, woodD);
  for (let i = 0; i < 6; i++) { const z = -7 + i * 2.7, w = 3.3 * Math.pow(Math.max(0.02, 1 - (z / 11.4) ** 2), 0.6);
    S.box(w + 0.12, 1.0, z, 0.3, 0.8, 0.8, C3('#15171a')); S.box(-w - 0.12, 1.0, z + 1.2, 0.3, 0.8, 0.8, C3('#15171a')); }
  S.box(1.2, 1.75, 3.2, 0.9, 0.7, 0.9, C3('#a07a3a')); S.box(-1.0, 1.7, 4.6, 0.8, 0.6, 0.8, C3('#8a6a34')); S.box(0.4, 1.7, 8.2, 1.4, 0.5, 1.0, C3('#3c5a6a'));
  S.box(0, 7.3, -10.9, 0.5, 0.6, 0.5, [5.0, 3.0, 1.1], -1); S.box(0, 6.6, -10.9, 0.08, 1.2, 0.08, woodD);
  // three batwing sails: each panel between two bamboo battens is a small grid that bellies to leeward and scallops in at
  // the leech (aPan carries the panel coordinates: PROP_VERT makes the belly's normal, PROP_FRAG the battens, seams, patches
  // and the light through the cloth); slim two-part masts, two stays each
  const masts = [[6.6, 10.5], [0.6, 15.5], [-6.4, 11.5]], NS = 4, NC = 4;
  const deep = [sail[0] * 0.96, sail[1] * 0.9, sail[2] * 0.86];                      // the brief's own sail colour, a touch deeper: sun-bleached panels and the light through the cloth vary it
  for (let m = 0; m < 3; m++) {
    const mz = masts[m][0], H = masts[m][1];
    S.box(0, H * 0.3 + 0.5, mz, 0.24, H * 0.6 + 1, 0.24, woodD); S.box(0, H * 0.8 + 0.6, mz, 0.16, H * 0.4 + 0.8, 0.16, woodD);
    const mw = 3.3 * Math.pow(Math.max(0.02, 1 - (mz / 11.4) ** 2), 0.6);
    S.beam([0, H + 0.9, mz], [mw * 0.92, 1.9, mz - 2.4], 0.08, woodD); S.beam([0, H + 0.9, mz], [-mw * 0.92, 1.9, mz - 2.4], 0.08, woodD);
    const R = 8, row = [];
    for (let r = 0; r < R; r++) {
      const f = r / (R - 1), y = 2.8 + f * (H - 2.6), zl = mz + 1.1 + 0.5 * f, zt = mz - (3.0 + 2.9 * Math.sin(Math.PI * (f * 0.8 + 0.12))) * (H / 15.5) - (r % 2 ? 0.35 : 0);
      row.push([[0.26, y, zl], [0.26, y + (r % 2 ? 0.1 : 0.5), zt], 0.35 + 0.65 * f]);
    }
    const ph = (H - 2.6) / (R - 1);
    for (let r = 0; r < R - 1; r++) {
      const a = row[r], b = row[r + 1], hsh = ((r * 7 + m * 13) % 5) / 5, k = 0.74 + 0.36 * hsh, col = (r + m) % 4 === 1 ? [deep[0] * 0.9 + 0.09, deep[1] * 0.9 + 0.075, deep[2] * 0.9 + 0.06] : [deep[0] * k, deep[1] * k, deep[2] * k];
      const pt = (i, j) => { const sv = i / NS, cu = j / NC, la = a[0], ta = a[1], lb = b[0], tb = b[1], bel = Math.sin(Math.PI * sv) * Math.sin(Math.PI * Math.min(cu * 1.1, 1));
        const x0 = lerp(lerp(la[0], ta[0], cu), lerp(lb[0], tb[0], cu), sv), y0 = lerp(lerp(la[1], ta[1], cu), lerp(lb[1], tb[1], cu), sv), z0 = lerp(lerp(la[2], ta[2], cu), lerp(lb[2], tb[2], cu), sv);
        return [[x0 + 0.24 * ph * bel, y0, z0 + 0.45 * Math.sin(Math.PI * sv) * cu * cu], lerp(0.12, 1, cu) * lerp(a[2], b[2], sv), [sv, cu]]; };
      for (let i = 0; i < NS; i++) for (let j = 0; j < NC; j++) { const A = pt(i, j), B = pt(i, j + 1), C = pt(i + 1, j + 1), D = pt(i + 1, j);
        S.quad(A[0], B[0], C[0], D[0], col, A[1], B[1], C[1], D[1], A[2], B[2], C[2], D[2]); }
    }
  }
  return S.build();
}

// a fish farm, 24 x 40 m: 4 x 6 pens framed by plank walkways (1.2 m wide, 1.7 m round the outside, a lit weathered top)
// riding on blue barrels that show at every crossing, net-green water inside the pens (one sheet, aFlex -2: PROP_FRAG draws
// the netting, the ripples and the feeding rings), a decked corner with a tin-roofed hut, a lit window and a lamp on the
// side the flight comes from, washing on a line, drums and crates, three nets drying over rails, a tethered skiff
function raftGeo() {
  const S = new Soup(), tA = C3('#a39378'), tB = C3('#8e7f68'), tC = C3('#b3a58c'), barrel = C3('#4a8ad0'), barrelD = C3('#3368a8'), tin = C3('#b4c0c0'), tinR = C3('#9a8672'),
    netA = C3('#9cc8b8'), netB = C3('#7fa99c'), hut = C3('#85735b'), hutD = C3('#5e4f3d'), pole = C3('#6b5a44'), cream = C3('#cdbf9c');
  S.quad([-12, 0.24, -20], [-12, 0.24, 20], [12, 0.24, 20], [12, 0.24, -20], C3('#68BCA4'), -2, -2, -2, -2);
  for (let i = 0; i <= 4; i++) { const w = i === 0 || i === 4 ? 1.7 : 1.2; S.box(-12 + i * 6, 0.6, 0, w, 0.22, 41.7, i % 2 ? tB : tA); }
  for (let j = 0; j <= 6; j++) { const w = j === 0 || j === 6 ? 1.7 : 1.2; S.box(0, 0.64, -20 + j * 6.667, 25.7, 0.2, w, j % 2 ? tA : tC); }
  for (let i = 0; i <= 4; i++) for (let j = 0; j <= 6; j++) { const edge = i === 0 || i === 4;
    S.box(-12 + i * 6, 0.24, -20 + j * 6.667, edge ? 3.3 : 2.7, 0.66, 1.0, (i + j) % 3 ? barrel : barrelD);
    if (j < 6) S.box(-12 + i * 6, 0.24, -16.67 + j * 6.667, edge ? 2.5 : 2.0, 0.66, 1.3, (i + j) % 2 ? barrelD : barrel); }
  // the decked corner and the hut (its lit face looks up the corridor, toward the flight)
  S.box(-9, 0.72, 16.67, 6.2, 0.16, 6.9, tC);
  S.box(-9.2, 2.0, 16.2, 4.4, 2.4, 3.8, hut);
  S.quad([-8.4, 0.85, 18.12], [-7.5, 0.85, 18.12], [-7.5, 2.65, 18.12], [-8.4, 2.65, 18.12], hutD);
  S.quad([-10.9, 1.8, 18.12], [-9.6, 1.8, 18.12], [-9.6, 2.7, 18.12], [-10.9, 2.7, 18.12], [1.5, 0.95, 0.38], -1, -1, -1, -1);
  S.quad([-12.0, 3.1, 19.2], [-6.4, 3.1, 19.2], [-6.4, 4.25, 16.2], [-12.0, 4.25, 16.2], tin); S.quad([-12.0, 4.25, 16.2], [-6.4, 4.25, 16.2], [-6.4, 3.1, 13.6], [-12.0, 3.1, 13.6], tinR);
  for (const x of [-11.4, -7.0]) S.tri([x, 3.2, 18.1], [x, 3.2, 14.3], [x, 4.2, 16.2], hut);
  S.box(-6.9, 2.75, 18.5, 0.3, 0.42, 0.3, [3.6, 2.3, 0.95], -1); S.box(-6.9, 3.0, 18.5, 0.06, 0.3, 0.06, hutD);
  S.box(-11.3, 1.2, 19.2, 0.7, 0.95, 0.7, barrel); S.box(-10.4, 1.1, 19.4, 0.62, 0.8, 0.62, barrelD); S.box(-6.7, 1.05, 14.6, 0.9, 0.6, 0.9, cream); S.box(-6.8, 1.55, 14.7, 0.6, 0.4, 0.6, tA);
  // washing between the hut and a pole
  S.box(-1.6, 2.0, 19.6, 0.16, 2.9, 0.16, pole); S.beam([-6.5, 3.15, 19.2], [-1.6, 3.3, 19.6], 0.07, pole);
  for (let k = 0; k < 4; k++) { const x = -5.6 + k * 1.0, c = [cream, C3('#7f9fc0'), C3('#d9d2c2'), C3('#9c6a4c')][k];
    S.quad([x, 2.2 + 0.15 * (k % 2), 19.3 + k * 0.08], [x + 0.75, 2.2 + 0.15 * (k % 2), 19.36 + k * 0.08], [x + 0.75, 3.18, 19.36 + k * 0.08], [x, 3.16, 19.3 + k * 0.08], c, 0.3, 0.3, 0, 0); }
  // nets drying: draped over a rail between two posts, hanging to both sides
  for (const z of [-15.5, -8.8, -2.1]) { S.box(9, 1.9, z, 0.16, 2.6, 0.16, pole); S.box(9, 1.9, z + 5.2, 0.16, 2.6, 0.16, pole); S.box(9, 3.15, z + 2.6, 0.12, 0.12, 5.4, pole);
    for (let k = 0; k < 4; k++) { const z0 = z + 0.2 + k * 1.2, z1 = z0 + 1.2, d0 = 0.9 + 0.5 * ((k * 7 + 3) % 4) / 3, d1 = 0.9 + 0.5 * ((k * 5 + 1) % 4) / 3, c = k % 2 ? netA : netB;
      S.quad([9, 3.2, z0], [9, 3.2, z1], [9 + d1 * 0.8, 3.2 - d1 * 1.5, z1], [9 + d0 * 0.8, 3.2 - d0 * 1.5, z0], c, 0, 0, 0.25, 0.25);
      S.quad([9, 3.2, z1], [9, 3.2, z0], [9 - d0 * 0.7, 3.2 - d0 * 1.4, z0], [9 - d1 * 0.7, 3.2 - d1 * 1.4, z1], k % 2 ? netB : netA, 0, 0, 0.25, 0.25); } }
  for (const [x, z] of [[12, -20], [-12, -20], [12, 20]]) S.box(x, 1.5, z, 0.18, 1.9, 0.18, pole);
  for (let k = 0; k < 5; k++) S.box(3 + (k % 2) * 0.5, 0.95, -19.6 + k * 0.1 + (k > 2 ? 39 : 0), 0.5, 0.5, 0.5, k % 2 ? cream : C3('#d9a070'));     // floats and a coiled line on the cross walks
  // the skiff: a small lofted hull with two thwarts, on a painter
  const st = [];
  for (let i = 0; i <= 5; i++) { const z = -2.7 + i * 5.4 / 5, t = z / 2.8, w = 0.82 * Math.pow(Math.max(0.03, 1 - t * t), 0.5), d = 0.5 + 0.38 * t * t;
    st.push([[14.6 - w, d, z - 3], [14.6 - w * 0.6, -0.1, z - 3], [14.6 + w * 0.6, -0.1, z - 3], [14.6 + w, d, z - 3], [14.6 + w * 0.8, d - 0.1, z - 3], [14.6 - w * 0.8, d - 0.1, z - 3]]); }
  const skA = C3('#9b8a66'), skB = C3('#4e6d78');
  for (let i = 0; i < 5; i++) for (let k = 0; k < 6; k++) { const k2 = (k + 1) % 6; S.quad(st[i][k], st[i + 1][k], st[i + 1][k2], st[i][k2], k === 0 || k === 2 ? skB : (k === 4 ? C3('#6e5e44') : skA)); }
  S.box(14.6, 0.42, -3.9, 1.3, 0.07, 0.3, cream); S.box(14.6, 0.42, -2.0, 1.4, 0.07, 0.3, cream); S.beam([13.0, 0.75, -1.2], [14.3, 0.55, -1.4], 0.1, pole);
  return S.build();
}


// a 7 m sampan: lofted hull, an arched mat roof on hoops, a sculling oar, a lamp under the roof
function sampanGeo() {
  const S = new Soup(), wood = C3('#57412b'), woodD = C3('#2e2218'), mat = C3('#a48a56'), matD = C3('#7d6840');
  const st = [];
  for (let i = 0; i <= 6; i++) { const z = -3.5 + i * 7 / 6, t = z / 3.6, w = 1.05 * Math.pow(Math.max(0.03, 1 - t * t), 0.55), d = 0.55 + 0.5 * t * t;
    st.push([[-w, d, z], [-w * 0.7, -0.15, z], [w * 0.7, -0.15, z], [w, d, z], [w * 0.82, d - 0.12, z], [-w * 0.82, d - 0.12, z]]); }
  for (let i = 0; i < 6; i++) for (let k = 0; k < 6; k++) { const k2 = (k + 1) % 6; S.quad(st[i][k], st[i + 1][k], st[i + 1][k2], st[i][k2], k === 1 ? woodD : (k === 4 ? woodD : wood)); }
  const arch = (z, r) => { const o = []; for (let k = 0; k <= 6; k++) { const a = Math.PI * k / 6; o.push([-Math.cos(a) * r, 0.55 + Math.sin(a) * 1.25, z]); } return o; };
  const zs = [-1.9, -0.9, 0.1, 1.1];
  for (let i = 0; i < zs.length - 1; i++) { const A = arch(zs[i], 0.98), B = arch(zs[i + 1], 0.98); for (let k = 0; k < 6; k++) S.quad(A[k], B[k], B[k + 1], A[k + 1], (i + k) % 2 ? mat : matD); }
  S.box(0.5, 0.9, -3.4, 0.07, 0.07, 3.4, woodD); S.box(0, 0.62, 2.4, 1.1, 0.1, 0.5, C3('#3c5a6a'));
  S.box(0, 1.35, 1.2, 0.22, 0.26, 0.22, [4.2, 2.6, 1.0], -1);
  return S.build();
}

// a 13 m squid boat: lofted hull, a wheelhouse aft with a lit window, and over the deck a gantry carrying two rails of six
// lamps. lit (0..1) is how brightly they burn: green-white at night (PROP_FRAG multiplies by uLamp), pale unlit glass by day
function squidGeo(lit) {
  const S = new Soup(), hullC = C3('#3b5a66'), hullD = C3('#1d2c33'), deck = C3('#8a7a5c'), house = C3('#c9c2a8'), pole = C3('#4a4034');
  const st = [];
  for (let i = 0; i <= 8; i++) { const z = -6.5 + i * 13 / 8, t = z / 6.7, w = 2.0 * Math.pow(Math.max(0.03, 1 - t * t), 0.55) * (z < 0 ? 1 : 0.9), d = 1.1 + 0.9 * t * t * (z > 0 ? 1.3 : 0.7);
    st.push([[-w, d, z], [-w * 0.8, -0.2, z], [w * 0.8, -0.2, z], [w, d, z], [w * 0.86, d - 0.15, z], [-w * 0.86, d - 0.15, z]]); }
  for (let i = 0; i < 8; i++) for (let k = 0; k < 6; k++) { const k2 = (k + 1) % 6; S.quad(st[i][k], st[i + 1][k], st[i + 1][k2], st[i][k2], k === 1 ? hullD : (k === 4 ? deck : hullC)); }
  S.quad(st[0][0], st[0][1], st[0][2], st[0][3], hullC);
  S.box(0, 2.1, -3.6, 2.6, 2.0, 3.0, house); S.box(0, 3.2, -3.6, 3.1, 0.14, 3.5, C3('#7f9aa0'));
  S.box(0, 2.35, -2.07, 1.8, 0.6, 0.06, [0.05 + lit * 2.2, 0.06 + lit * 1.5, 0.07 + lit * 0.6], -1);
  S.box(1.1, 1.5, 3.4, 0.8, 0.7, 0.8, C3('#a07a3a')); S.box(-0.9, 1.45, 1.0, 1.1, 0.6, 0.9, C3('#3c5a6a')); S.box(0, 1.6, 5.4, 0.5, 0.9, 0.5, pole);
  for (const z of [-1.6, 5.2]) { S.box(0, 3.3, z, 0.14, 4.2, 0.14, pole); S.box(0, 5.05, z, 3.5, 0.1, 0.1, pole); }
  S.box(0, 5.4, 1.8, 0.1, 0.1, 7.0, pole);
  const bulb = [0.25 + lit * 1.7, 0.3 + lit * 2.6, 0.28 + lit * 2.0];
  for (const x of [-1.6, 1.6]) { S.box(x, 5.05, 1.8, 0.06, 0.06, 6.9, pole); for (let k = 0; k < 6; k++) S.box(x, 4.74, -1.2 + k * 1.2, 0.36, 0.44, 0.36, bulb, -1); }
  return S.build();
}


// ================================================================ 3. the world
const MOODS = {
  golden: { preset: 'goldenHour', elev: 22, sunCol: ['#FFD9A0', 2.4], sky: '#6E97A8', horizon: '#E8C89A', shade: '#2C5560', water: '#2F8F78', spray: '#FFCF8A',
    fog: '#C4C3A6', dens: 0.00028, deep: '#2A7B73', scatter: '#55A596', glow: '#000000', mist: '#F3DFB8', ceil: '#2B3340', rim: '#E9C48E', exposure: 0.92, cabin: 0, lamp: 2.4, lampK: 1.0, shadowA: 0.72,
    thunder: ['#F2B27A', '#6F8494'], hazeSun: '#E8C89A', hazeAway: '#9DB8B4', haze: 0.00023, reflA: 0.34, wallRef: ['#EDBE80', 0.56], glit: ['#FFDCA6', 0.95], squid: 0 },
  dawn: { preset: 'dawn', elev: 9, sunCol: ['#FFC4B4', 1.9], sky: '#9AAAC6', horizon: '#F2D2CC', shade: '#4A5873', water: '#6FA39A', spray: '#FFB4C0',
    fog: '#E2D0D2', dens: 0.00045, deep: '#356A68', scatter: '#86BDB2', glow: '#000000', mist: '#F6E4E4', ceil: '#46435C', rim: '#F4C6C0', exposure: 1.0, cabin: 0.6, lamp: 2.6, lampK: 1.3, shadowA: 0.42,
    thunder: ['#F6BFC0', '#8088A6'], hazeSun: '#F4D6CE', hazeAway: '#CFC8D8', haze: 0.00032, reflA: 0.26, wallRef: ['#F6CEC6', 0.5], glit: ['#FFD8D0', 0.8], squid: 0 },
  day: { preset: 'day', elev: 55, sunCol: ['#FFF3DA', 2.5], sky: '#5C9CCB', horizon: '#CFE3E6', shade: '#56706C', water: '#1FA383', spray: '#F4F2E4',
    fog: '#BCD6D8', dens: 0.0002, deep: '#17907A', scatter: '#4FD9B0', glow: '#000000', mist: '#F4F6F2', ceil: '#39424E', rim: '#E6ECEC', exposure: 0.95, cabin: 0, lamp: 2.0, lampK: 0.8, shadowA: 0.72,
    thunder: ['#FFFFFF', '#8AA0B4'], hazeSun: '#DDEAE6', hazeAway: '#B2CEDA', haze: 0.0002, reflA: 0.36, wallRef: ['#F0EAD6', 0.66], glit: ['#FFFFF0', 1.0], squid: 0 },
  night: { preset: 'night', elev: 35, sunCol: ['#B4C8F4', 1.45], sky: '#46639C', horizon: '#4A6690', shade: '#34507E', water: '#1E5A6E', spray: '#7FF0D8',
    fog: '#27405E', dens: 0.00026, deep: '#14506A', scatter: '#3A93A0', glow: '#0b6b78', mist: '#7C98B8', ceil: '#141C2A', rim: '#4E6C90', exposure: 1.36, cabin: 1, lamp: 3.2, lampK: 2.2, shadowA: 0.56,
    thunder: ['#6C86B4', '#26344E'], hazeSun: '#3E5C88', hazeAway: '#22344E', haze: 0.00024, reflA: 0.4, wallRef: ['#A9C0F0', 0.4], glit: ['#C8DCFF', 0.62], squid: 1 },
};

export default {
  id: 'flying-boat-karst-bay',
  name: 'Alighting among the Towers',
  category: 'ocean',
  weirdness: 0.25,
  media: ['air', 'water'],
  async build(ctx) {
    const rng = ctx.rng, vary = ctx.vary || {}, detail = (ctx.quality && ctx.quality.detail) || 1, density = vary.density || 1;
    const mood = vary.mood !== undefined ? vary.mood : 0.5, rare = !!vary.rare;
    // a lot added later draws from a stream of its own, made from the world's seed and the lot's name (rng.fork takes a draw
    // from its parent, which would move every draw after it): the veils, the cloud shadows, the smoke and the lightning
    const own = (name) => makeRng(hashSeed('flying-boat-karst-bay:' + name + ':' + ctx.seed));
    const scene = new THREE.Scene();
    // ---- a. seeded moods, cast and weather
    const drawn = rng.pick(['golden', 'day', 'golden', 'dawn', 'golden', 'night']);
    const hour = MOODS[vary.hour] ? vary.hour : drawn;
    const M = MOODS[hour];
    const sailHex = rng.pick(['#B3402A', '#B3402A', '#C08A2E', '#4C66AE']);          // rust red (twice as likely), ochre, faded indigo
    const livery = rng.pick(['silver', 'white', 'cream']);
    const weather = mood < 0.3 ? 'rain' : (mood > 0.7 ? 'lightning' : 'clear');     // the shower still trailing a curtain / sheet lightning
    const hv = rng.fork('heights'), wallDH = [0, 1, 2, 3, 4, 5].map(() => hv.range(-26, 22)), sentH = hv.range(205, 255);
    const col = (h, k = 1) => new THREE.Color(h).multiplyScalar(k);
    const sunDir = skyDirection(M.elev, -65).clone().normalize();
    const sunCol = col(M.sunCol[0], M.sunCol[1]);

    // ---- b. sky, fog, sea
    const skyOpts = { rng, preset: M.preset, sunIntensity: 0 };
    if (hour === 'night') skyOpts.bodyOverrides = { 0: { elevation: M.elev, azimuth: -65 } };
    else { skyOpts.sunElevation = M.elev; skyOpts.sunAzimuth = -65; }
    if (hour === 'golden') { skyOpts.zenith = '#6E97A8'; skyOpts.horizon = '#E6D2A6'; }
    const sky = makeSky(skyOpts); scene.add(sky.object);
    scene.fog = new THREE.FogExp2(new THREE.Color(M.fog), M.dens);
    await ctx.yield();
    const wLight = Water.waterLight(sky);
    const sea = Water.makeOcean({ rng, light: wLight, preset: 'calm', radius: 5500, rings: 100, segments: 140,
      deep: M.deep, scatter: M.scatter, glow: M.glow, reflectivity: 0.5, detail: 0.62, roughness: 0.04 });
    scene.add(sea.object);
    await ctx.yield();

    // ---- c. hero, the Pierced Tower, and the path laid from its anchors
    const hero = await buildHero(ctx, { palette: PALETTE, livery, sprayColor: M.spray, sprayGain: 1.15, progress: -10, cabin: M.cabin, lamp: M.lamp });
    hero.setLight({ sunDir, sunColor: sunCol, sky: col(M.sky), horizon: col(M.horizon), shade: col(M.shade), water: col(M.water), spray: col(M.spray),
      foam: hour === 'night' ? col(M.spray, 0.5) : col('#e9dcc0', hour === 'dawn' ? 0.7 : 0.85), fleck: hour === 'night' ? 0.9 : 0, ambient: hour === 'night' ? 1.7 : 1 });   // by moonlight the airframe's fill is lifted so hull and nacelles stand off the water, and its foam glows blue-green
    scene.add(hero.object);
    await ctx.yield();
    const PIERCED = { height: 190, width: 240, depth: 150 };
    const pierced = await buildTower(ctx, { pierced: true, ...PIERCED, uniforms: hero.uniforms, palette: PALETTE, rng: rng.fork('pierced') });
    scene.add(pierced.object);
    // by moonlight the stone is taken down a little, so the lit wall is silver-grey with its curtains and runs showing
    const rockK = hour === 'night' ? 0.9 : 1;
    if (rockK < 1) for (const m of [pierced.materials.rock, pierced.object.children[0].material]) m.uniforms.uRockCol.value.multiplyScalar(rockK);
    if (hour === 'night') for (const m of [pierced.materials.rock, pierced.object.children[0].material]) if (m.uniforms.uBumpK) m.uniforms.uBumpK.value = 0.6;      // and its close relief is calmer: moonlit stone, not crumpled foil
    if (hour === 'night') {                                              // the foam line at every foot a dim blue-green glow; the propeller discs a faint cool shimmer, no warm rim
      pierced.materials.slop.uniforms.uFoamCol.value.copy(col(M.spray, 0.35));
      const dU = hero.parts.disc.material.uniforms; dU.uDim.value = 0.42; dU.uTipCol.value.copy(col(M.sunCol[0], 0.5));
    }
    await ctx.yield();
    const Z0 = pierced.anchors.front.z, seatP = pierced.anchors.portalSeat.position;
    const R = 445, cx = R, cz = Z0 + 700, pts = [];
    const h0 = 85 * Math.PI / 180, dE = new THREE.Vector3(-Math.sin(h0), 0, -Math.cos(h0));
    const arc = (h) => new THREE.Vector3(cx - Math.cos(h) * R, 0, cz + Math.sin(h) * R);
    const a85 = arc(h0), entry = a85.clone().addScaledVector(dE, -180); entry.y = 300;
    pts.push([entry.x, 300, entry.z], [entry.x + dE.x * 90, 300, entry.z + dE.z * 90]);
    for (let i = 0; i < 5; i++) { const h = h0 * (1 - i / 5), p = arc(h); pts.push([p.x, lerp(296, 96, Math.pow(i / 5, 1.1)), p.z]); }
    // the turn rolls out due north on the corridor's line x = 0 and the track is dead straight from there to the portal. The
    // lit east wall's line lies 44 m east of that axis down to Z0+260 (wallLine below; the west wall's 64 m west), so its face
    // slides by about 40 m from the lens down the corridor
    pts.push([0, 90, Z0 + 700], [0, 62, Z0 + 600], [0, 32, Z0 + 500], [0, 9, Z0 + 400], [0, 3.4, Z0 + 340], [0, 3.0, Z0 + 300], [0, 3.0, Z0 + 225], [0, 3.0, Z0 + 150],
      [0, 3.1, Z0 + 96], [0, 4.2, Z0 + 40], [seatP.x, 5.5, seatP.z]);
    const path = makePath(pts);
    const L = path.length || 1540;
    const K = { kiss: path.nearestXZ(0, Z0 + 300).u * L, depart: 168, uT0: path.nearestXZ(a85.x, a85.z).u, uT1: path.nearestXZ(0, Z0 + 700).u };
    const sentinelP = entry.clone().addScaledVector(dE, 700); sentinelP.y = 0;

    // ---- d. corridor walls and the Sentinel (real towers), then the far ranks (one instanced draw)
    const shadows = [];   // [x, z, width, height] of everything that throws a shadow stripe and a reflection
    shadows.push([0, 0, 220, 190]);
    const walls = [[-1, 660, 190, 150, 170], [1, 592, 236, 150, 160], [-1, 440, 180, 140, 150], [1, 350, 180, 150, 175], [-1, 235, 170, 150, 180], [1, 140, 170, 140, 140]];
    // THE WALLS' LINES, a rule of the bay, the same on every seed. The corridor's axis is x = 0. The shaded west wall's face
    // stands on the line 64 m west of it for the corridor's whole length. The lit east wall's face stands on the line 44 m east
    // of the axis from the corridor's mouth down to Z0+260 (CORR: its first two towers from the mouth, from the first one's
    // south end at Z0+710 to the second one's north end, 450 m of wall by the towers' own lengths with the cleft between
    // them; the flight's straight run from Z0+700 passes 440 m of it: 108 m wide there, so the cliff slides by about 40 m
    // from the lens), and on the line 64 m east from there to the Pierced Tower (its third tower), where the
    // corridor opens for the alighting water and the junks in file. A tower's unevenness about its line is its own: its
    // seeded outline, bulges and clefts (buildTower's fork); its caves, creepers and the waterfall fall where its rules put them.
    const CORR = { n: walls[3][1] - walls[3][2] / 2, s: walls[1][1] + walls[1][2] / 2 };      // the narrow corridor's two ends, metres past Z0: the north end of the east wall's second tower (260) and the south end of its first (710, the mouth)
    const wallLine = (side, z) => (side > 0 && z > CORR.n ? 44 : 64);            // metres from the axis to the wall's line, at z past Z0
    const towers = [pierced];
    for (let i = 0; i < walls.length; i++) {
      const w = walls[i], H = w[4] + wallDH[i];
      const t = await buildTower(ctx, { height: H, width: w[2], depth: w[3], segments: i === 1 ? 86 : 72, rows: 24, crowns: 260, lipTrees: w[0] > 0 ? 34 : 14, caveAt: i === 2 ? { x: -15, y: 40, hw: 7.5, hh: 10 } : null, materials: pierced.materials, uniforms: hero.uniforms, palette: PALETTE, rng: rng.fork('wall' + i) });
      t.object.position.set(w[0] * (wallLine(w[0], w[1]) + w[3] / 2), 0, Z0 + w[1]); t.object.rotation.y = w[0] < 0 ? Math.PI / 2 : -Math.PI / 2;
      scene.add(t.object); towers.push(t); shadows.push([t.object.position.x, t.object.position.z, w[2] * 0.8, H]);
      await ctx.yield();
    }
    {
      const t = await buildTower(ctx, { height: sentH, width: 120, depth: 100, segments: 56, rows: 22, crowns: 150, materials: pierced.materials, uniforms: hero.uniforms, palette: PALETTE, rng: rng.fork('sentinel') });
      t.object.position.copy(sentinelP); t.object.rotation.y = Math.atan2(dE.x, dE.z);   // seam (-Z local) turned away from the entry
      scene.add(t.object); towers.push(t); shadows.push([sentinelP.x, sentinelP.z, 95, sentH]);
      await ctx.yield();
    }
    const LU = hero.uniforms;
    const instGeo = (base, attrs) => { const g = new THREE.InstancedBufferGeometry(); g.index = base.index; g.setAttribute('position', base.getAttribute('position'));
      for (const k in attrs) g.setAttribute(k, new THREE.InstancedBufferAttribute(new Float32Array(attrs[k][0]), attrs[k][1])); g.instanceCount = attrs[Object.keys(attrs)[0]][0].length / attrs[Object.keys(attrs)[0]][1]; return g; };
    const fogU = () => THREE.UniformsUtils.clone(THREE.UniformsLib.fog);
    const farMat = new THREE.ShaderMaterial({ vertexShader: FAR_VERT, fragmentShader: FAR_FRAG,
      uniforms: { uSunDir: LU.uSunDir, uSunCol: LU.uSunCol, uSkyCol: LU.uSkyCol, uShadeCol: LU.uShadeCol, uHorizonCol: LU.uHorizonCol, uRockCol: { value: col(PALETTE[2], rockK) }, uLeafCol: { value: col(PALETTE[3], 1.5) },
        uHazeSun: { value: col(M.hazeSun) }, uHazeAway: { value: col(M.hazeAway) }, uHaze: { value: M.haze * (0.8 + 0.4 * mood) } } });
    const farList = [];
    {
      const fr = rng.fork('far'), CELL = 400, HALF = 4600, zc = Z0 + 500;
      for (let gx = -HALF; gx < HALF; gx += CELL) { await ctx.yield(); for (let gz = -HALF; gz < HALF; gz += CELL) {      // (the fork is this loop's own: a yield between its draws changes nothing)
        const keep = fr() < 0.5 * density, x = gx + CELL / 2 + fr.range(-150, 150), z = zc + gz + CELL / 2 + fr.range(-150, 150);
        const r = fr.range(34, 105), h = fr.range(80, 250), sq = fr.range(0.7, 1.25), rot = fr.range(0, 6.28);
        if (!keep) continue;
        if (Math.abs(x) < 245 + r && z > Z0 - 260 && z < Z0 + 860) continue;
        if (path.nearestXZ(x, z).dist < 215 + r) continue;
        if (Math.hypot(x - sentinelP.x, z - sentinelP.z) < 230 + r) continue;
        if (Math.hypot(x, z - zc) > HALF) continue;
        farList.push([x, z, r, h, sq, rot]);
      } }
    }
    {
      const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0), p = new THREE.Vector3(), s = new THREE.Vector3();
      for (let v = 0; v < 3; v++) {                                         // three plan shapes, one instanced draw each
        const list = farList.filter((f, i) => i % 3 === v);
        const farMesh = new THREE.InstancedMesh(farTowerGeo(v), farMat, Math.max(1, list.length));
        list.forEach((f, i) => { q.setFromAxisAngle(up, f[5]); p.set(f[0], 0, f[1]); s.set(f[2], f[3], f[2] * f[4]); m4.compose(p, q, s); farMesh.setMatrixAt(i, m4); });
        farMesh.count = list.length; farMesh.frustumCulled = false; scene.add(farMesh);
        await ctx.yield();
      }
      farList.forEach((f) => shadows.push([f[0], f[1], f[2] * 1.7, f[3]]));
    }
    await ctx.yield();
    // modelled crown heads on the roofs of the far towers nearest the path (one instanced draw of 20-triangle heads), so the
    // second rank carries the same lumpy green roof as the corridor towers. Placed by a hash, not by ctx.rng: no draw order changes.
    {
      const hsh = (i, k) => { const x = Math.sin(i * 127.1 + k * 311.7 + sentH) * 43758.5453; return x - Math.floor(x); };
      const near = farList.map((f, i) => ({ f, v: i % 3, d: path.nearestXZ(f[0], f[1]).dist })).filter((o) => o.d < 1050).sort((a, b) => a.d - b.d);
      const aC = [0, -500, 0, 1], aT = [1, 0, 0, 0.6], MAXC = Math.round(1700 * detail), sl2 = Math.hypot(sunDir.x, sunDir.z) || 1;
      // a few mangroves in the lee of the bigger towers: low dark heads standing in the coves between the wall towers
      for (const [mx, mz, n, lit] of [[72, 456, 11, 0.5], [-92, 547, 9, -0.6], [84, 242, 9, 0.5], [-92, 335, 8, -0.6]]) for (let j = 0; j < n; j++) {
        const q = mx * 7.1 + j * 3.3, rad = 2.2 + 1.6 * hsh(q, 1) * hsh(q, 2);
        aC.push(mx + (hsh(q, 3) - 0.5) * 16, 1.3 + rad * 0.42, Z0 + mz + (hsh(q, 4) - 0.5) * 18, rad); aT.push(0.5 + 0.2 * hsh(q, 5), hsh(q, 6) * 6.28, -0.15 + 0.6 * lit, 0.5 + 0.16 * hsh(q, 7)); }
      let k = 0;
      for (const o of near) {
        const x = o.f[0], z = o.f[1], r = o.f[2], h = o.f[3], sq = o.f[4], rot = o.f[5], n = Math.min(84, Math.round(r * r * sq / 100));
        if (aC.length / 4 + n > MAXC) break;
        const cr = Math.cos(rot), sn = Math.sin(rot);
        for (let j = 0; j < n; j++, k++) {
          const lipC = hsh(k, 2) < (o.d < 600 ? 0.6 : 0.4), P = farRoof(o.v, hsh(k, 1) * 6.2832, lipC ? 0.8 + 0.07 * hsh(k, 3) : Math.sqrt(hsh(k, 3)) * 0.76);
          const X = P[0] * r, Z = P[2] * r * sq, wx = X * cr + Z * sn, wz = -X * sn + Z * cr, rad = 4.5 + 5.5 * hsh(k, 4) * hsh(k, 5) + (lipC ? 0 : 1);
          aC.push(x + wx, P[1] * h + rad * 0.15, z + wz, rad);
          aT.push(0.7 + 0.7 * hsh(k, 6), hsh(k, 7) * 6.28, sat(0.5 + 0.5 * (wx * sunDir.x + wz * sunDir.z) / sl2 / r) * 2 - 1, 0.55 + 0.25 * hsh(k, 8));
        }
        await ctx.yield();
      }
      const FU = farMat.uniforms;
      const crownMat = new THREE.ShaderMaterial({ vertexShader: CROWN_VERT, fragmentShader: CROWN_FRAG,
        uniforms: { uTime: LU.uTime, uSunDir: LU.uSunDir, uSunCol: LU.uSunCol, uSkyCol: LU.uSkyCol, uShadeCol: LU.uShadeCol, uLeafCol: FU.uLeafCol, uHazeSun: FU.uHazeSun, uHazeAway: FU.uHazeAway, uHaze: FU.uHaze } });
      const ico = new THREE.IcosahedronGeometry(1, 0);
      const farCrowns = new THREE.Mesh(instGeo(ico, { aC: [aC, 4], aT: [aT, 4] }), crownMat); farCrowns.frustumCulled = false; scene.add(farCrowns);
    }
    await ctx.yield();

    // ---- e. water decals: shadow stripes away from the sun, reflections toward the eye, tide lines, our wake train, the mint spill
    const decalBase = new THREE.PlaneGeometry(1, 1, 1, 48); decalBase.rotateX(-Math.PI / 2); decalBase.translate(0, 0, 0.5);
    const squidAt = [[-24, 612, 0.25], [20, 640, -0.2], [-15, 486, 0.12], [22, 428, -0.3]];      // x, z past Z0, heading
    const junkAt = [[21, 282, 0.35], [25, 250, 0.5], [22, 222, 0.3], [26, 172, 0.55], [22, 142, 0.4], [27, 116, 0.6], [-52, 815, 1.9], [230, 900, 2.6], [-420, 380, 0.8], [330, 250, 1.2]];
    let decMat;
    {
      const xf = [], dim = [], dr = rng.fork('decal');
      const sl = Math.hypot(sunDir.x, sunDir.z) || 1, ang = Math.atan2(-sunDir.x / sl, -sunDir.z / sl), tanE = Math.max(0.2, sunDir.y / sl);
      // cloud shadows drifting downwind over the open bay (kind 9, laid first: everything else lies on top): up to six broad
      // soft patches from a stream of their own. Each one's place is drawn over the bay (from 1900 m west to 1500 m east of the
      // corridor's axis, from 260 m north of the Pierced Tower's face to 2300 m south of it), its size in 620 to 900 m and
      // its phase; then (the dice first) a patch whose home ground reaches the corridor's box is not laid: none over the
      // corridor (the box is DEC_FRAG's own for cloud: 230 m either side of the axis, 520 m either way along it from Z0+360)
      const wAng0 = Math.PI / 2 - (sea.windAngle || 0), cl = own('clouds');
      for (let i = 0; i < 6; i++) { const cx = cl.range(-1900, 1500), cz = Z0 + cl.range(-260, 2300), cs = cl.range(620, 900), cp = cl();
        const hx = cx + Math.sin(wAng0) * cs * 0.625, hz = cz - cs * 0.5 + Math.cos(wAng0) * cs * 0.625;      // the middle of its home ground (the patch lies from its place downwind)
        if (Math.abs(hx) < 230 + cs * 0.625 && Math.abs(hz - (Z0 + 360)) < 520 + cs * 0.625) continue;
        xf.push(cx, cz - cs * 0.5, wAng0, cp); dim.push(cs, cs * 1.25, 9, 0); }
      for (const s of shadows) { xf.push(s[0], s[1], ang, dr()); dim.push(s[2], Math.min(720, s[3] / tanE) + s[2] * 0.5, 0, 0); }
      // the corridor's water (kind 7: one sheet from the tunnel to the mouth, laid before everything that lies on top of it);
      // it carries the images of the six wall towers and of the Pierced Tower, so those seven get no streak of kind 2 and
      // take no draw: the decal fork deals one seed to each tower that has a streak, then the junks' streaks and the tide lines
      xf.push(0, Z0 - 2, 0, 0.17); dim.push(124, 800, 7, 0);
      shadows.forEach((s, i) => { if (i > 6) { xf.push(s[0], s[1], 0, dr()); dim.push(s[2] * 0.95, s[3], 2, 0); } });
      for (let i = 0; i < 6; i++) { xf.push(junkAt[i][0], Z0 + junkAt[i][1], 0, dr()); dim.push(8, 15, 2, 1); }
      const nT = Math.round(40 * detail);
      for (let i = 0; i < nT; i++) { const near = i < 14;
        xf.push(near ? dr.range(-56, 56) : dr.range(-900, 900), Z0 + (near ? dr.range(20, 560) : dr.range(-200, 1700)), dr.range(-0.12, 0.12) + (near ? 0 : 0.7), dr());
        dim.push(near ? dr.range(3.5, 6) : dr.range(9, 18), near ? dr.range(90, 220) : dr.range(250, 600), 1, 0); }
      for (const t of [[-11, 18, 0.07, 0.13, 5.5, 120], [6, 30, -0.05, 0.47, 6.5, 110], [17, 8, 0.1, 0.83, 5, 135], [-3, 70, -0.12, 0.29, 6, 90]]) { xf.push(t[0], Z0 + t[1], t[2], t[3]); dim.push(t[4], t[5], 1, 0); }   // petals and froth on the run-in
      xf.push(0, Z0 + 300, Math.PI, 0.37); dim.push(64, 300, 3, 0);
      xf.push(0, Z0 - 6, 0, 0.61); dim.push(21, 430, 4, 0);
      for (const q of squidAt) { xf.push(q[0], Z0 + q[1], 0, 0.3 + q[2]); dim.push(4.6, 5, 2, 3); }                              // the squid boats' lamp streaks
      // cat's-paws: gust patches racing downwind across the bay and along the corridor (their own rng fork, drawn last; the last
      // four of the corridor's twelve start in its upper half, and every one fades out over the alighting run (uRunZ), so
      // the water from the kiss to the portal stays clean jade). The corridor funnels the draught along its walls: its paws
      // run along its axis, the way the seeded wind's own component along that axis points (toward the mouth on some seeds,
      // toward the tunnel on others), each with its small drawn spread
      const pr = rng.fork('paws'), wAng = Math.PI / 2 - (sea.windAngle || 0), nP = Math.round(36 * detail);
      const cAng = Math.cos(wAng) >= 0 ? 0 : Math.PI;                       // a decal's heading runs along (sin, cos): 0 is +Z (toward the mouth), pi is -Z (toward the tunnel)
      for (let i = 0; i < nP; i++) { const inC = i < 12, len = inC ? pr.range(70, 150) : pr.range(200, 440), pa = pr.range(0, 6.283), pd = Math.sqrt(pr()) * 1000;
        xf.push(inC ? pr.range(-50, 50) : 445 + Math.cos(pa) * pd, Z0 + (inC ? pr.range(i < 8 ? 60 : 300, 640) : 700 + Math.sin(pa) * pd), (inC ? cAng : wAng) + pr.range(-0.15, 0.15), pr());
        dim.push(inC ? pr.range(24, 44) : len * pr.range(0.35, 0.6), len, 5, 0); }
      xf.push(0, 0, 0, 0.5); dim.push(42, 30, 8, 0);                          // our own mirror image (kind 8: placed by uOwn each frame)
      decMat = new THREE.ShaderMaterial({ vertexShader: DEC_VERT, fragmentShader: DEC_FRAG, fog: true, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
        uniforms: { ...fogU(), uTime: LU.uTime, uSunXZ: { value: new THREE.Vector2(sunDir.x / sl, sunDir.z / sl) }, uShadowCol: { value: col(M.deep, 0.2).lerp(col(M.shade, 0.4), 0.45) }, uPawCol: { value: col(M.deep, 0.26).lerp(col(M.shade, 0.5), 0.5) }, uPawA: { value: hour === 'night' ? 0.46 : 0.66 }, uFoamCol: { value: col('#e9dcc0', hour === 'night' ? 0.25 : 0.8) },
          uWallCol: { value: col(M.wallRef[0], M.wallRef[1]) }, uWestCol: { value: col(M.shade).lerp(col(M.wallRef[0]), 0.3).multiplyScalar(hour === 'night' ? 0.8 : 0.5) }, uWestA: { value: hour === 'night' ? 0.42 : 0.16 }, uGlitCol: { value: col(M.glit[0], M.glit[1]) }, uLampCol: { value: col('#BFFFE0', 1.5) }, uLampA: { value: M.squid }, uMirA: { value: 0.85 },
          uWalls: { value: walls.map((w, i) => new THREE.Vector4(Z0 + w[1], w[2] * 0.47, w[4] + wallDH[i], w[0] * (wallLine(w[0], w[1]) - 5))) }, uEnd: { value: new THREE.Vector4(Z0, 108, 190, 0) }, uLane: { value: new THREE.Vector4((wallLine(1, CORR.s) - wallLine(-1, CORR.s)) / 2, (wallLine(1, CORR.s) + wallLine(-1, CORR.s)) / 8, Z0, Z0 + CORR.s) },      // the path of light: down the middle of the narrow channel between its walls' lines, a quarter of the channel wide, from the tunnel to the mouth
          uEndCol: { value: col(M.shade, hour === 'night' ? 0.9 : 0.95).lerp(col(M.sky), 0.3).multiplyScalar(0.8) },
          uOwn: { value: new THREE.Vector4(0, 0, 0, 0) }, uOwnK: { value: 0.6 }, uOwnCol: { value: col(livery === 'silver' ? '#AEB6B8' : (livery === 'white' ? '#D9DCD8' : '#D8CDA8'), hour === 'night' ? 0.3 : 0.62).lerp(col(M.horizon, hour === 'night' ? 0.4 : 0.8), 0.3) },
          uCloudA: { value: hour === 'day' ? 0.3 : (hour === 'night' ? 0 : 0.17) },      // cloud shadows under the day's cumulus, fainter at dawn and in the golden hour (the sky's drifting cloud), none by moonlight
          uWakeCol: { value: hour === 'night' ? col(M.spray, 0.5) : col('#e9dcc0', 0.8) }, uWakeDark: { value: hour === 'night' ? 0.33 : 1 }, uWakeK: { value: 0.75 }, uRunZ: { value: Z0 + 300 },
          uGoldCol: { value: col(M.horizon, hour === 'night' ? 0.5 : 0.85) }, uSailCol: { value: col(sailHex, 0.55).lerp(col(M.spray), 0.25) }, uMint: { value: col('#BFF0E0', 1.25) },
          uShadowA: { value: M.shadowA }, uReflA: { value: M.reflA }, uWake: { value: -100 }, uGlitA: { value: hour === 'dawn' ? 0.6 : 1 } } });
      const dec = new THREE.Mesh(instGeo(decalBase, { aXf: [xf, 4], aDim: [dim, 4] }), decMat); dec.frustumCulled = false; dec.renderOrder = 2; scene.add(dec);
    }
    await ctx.yield();

    // ---- sprites: thunderheads to the north-east, mist skeins among the towers (kept off the corridor axis), rain shreds under
    // the ceiling, a trailing rain curtain (weather), and additive glows: the portal's halo at the tunnel, sheet lightning (weather)
    const sprU = { ...fogU(), uTime: LU.uTime, uFade: { value: 1 }, uFlash: { value: 1 } };
    const glowU = { ...fogU(), uTime: LU.uTime, uFade: { value: 1 }, uFlash: { value: 0 } };
    const side = new THREE.Vector3(-dE.z, 0, dE.x);
    let floorMat = null, wispU = null;
    let shredLo = 330 - 75, shredMid = 365 - 55;      // the rain shreds' feet, read below from the shreds as built (these are the ends of their draws: lowest centre less the tallest half, mean less mean)
    {
      const pos = [], size = [], colr = [], sr = rng.fork('sprites');
      const add = (x, y, z, w, h, c, a, fk) => { pos.push(x, y, z); size.push(w, h, fk, sr()); colr.push(c.r, c.g, c.b, a); };
      const th0 = col(M.thunder[0]), th1 = col(M.thunder[1]);
      for (let i = 0; i < 34; i++) { const a = sr.range(0.2, 1.0), d = sr.range(4700, 5300), f = sr(), y = 250 + f * f * 3300, lit = sr();
        add(Math.sin(a) * d, y, Z0 - Math.cos(a) * d, sr.range(1300, 2300) * (1 + f * 0.6), sr.range(900, 1500), th1.clone().lerp(th0, 0.25 + 0.75 * lit * (0.4 + 0.6 * f)).multiplyScalar(0.95), 0.92, 0.3); }
      const mistC = col(M.mist);
      const nM = Math.round(46 * detail * density * (0.5 + 1.0 * mood));
      for (let i = 0; i < nM; i++) { let x = sr.range(-1500, 1500); const y = sr.range(55, 125), z = Z0 + sr.range(-300, 1900), w = sr.range(230, 470), asp = sr.range(5, 8), al = sr.range(0.24, 0.44);
        if (Math.abs(x) < 330 && z > Z0 - 220 && z < Z0 + 800) x = (x < 0 ? -1 : 1) * (330 + Math.abs(x));      // never across the corridor: the portal must glow from afar
        add(x, y, z, w, w / asp, mistC, al, 0.8); }
      // long thin veils (6:1) lying across far towers 70-110 m up, by a rule of the bay: every far tower over 120 m tall is a
      // candidate, wherever in the bay it stands. Each candidate rolls its dice from the veils' own stream (the dice first,
      // then the test): with the chance VEIL_P it carries a veil, hung on its lee side by the seeded wind (sea.windAngle),
      // at the height and of the size its tower gives it, with a drawn phase. Like the skeins, no veil hangs across the
      // corridor's box: the portal must glow from afar. (Pushed last in their own arrays below.)
      const veils = [], VEIL_P = 0.8;                                         // (four in five: about as many veils within 900 m of the corridor's axis as stood there before this rule)
      await ctx.yield();
      { const vd = own('veils'), wA = sea.windAngle || 0, lee = [Math.cos(wA), Math.sin(wA)];
        for (const f of farList) { if (f[3] <= 120) continue;
          const roll = vd(), ph = vd(), off = f[2] * Math.max(1, f[4]) + 16, w = Math.max(300, f[2] * 4.6), x = f[0] + lee[0] * off, z = f[1] + lee[1] * off;
          if (roll >= VEIL_P || (Math.abs(x) < 330 && z > Z0 - 220 && z < Z0 + 800)) continue;
          veils.push([x, Math.min(110, Math.max(70, f[3] * 0.45)), z, w, w / 6, ph]); } }
      await ctx.yield();
      const ceilC = col(M.ceil, 2.0).lerp(col(M.rim), 0.16);                // rain shreds under the base: slate with a lit trailing foot, never black
      const shred0 = pos.length / 3;
      for (let i = 0; i < 30; i++) { const a = sr.range(-420, 800), b = sr.range(-560, 560); if (Math.abs(b) < 50) continue;
        add(entry.x + dE.x * a + side.x * b, sr.range(330, 400), entry.z + dE.z * a + side.z * b, sr.range(160, 380), sr.range(70, 150), ceilC, b > 520 ? 0 : 0.5, 0.26); }   // none where the ceiling has drawn off
      // the feet of the shreds that are drawn (each one's lower edge): the lowest of them and their mean. The rain streaks
      // past the strut are these shreds' rain, so they reach as far down as the shreds do (update)
      { let lo = 1e9, sum = 0, n = 0;
        for (let i = shred0; i < pos.length / 3; i++) { if (colr[i * 4 + 3] <= 0) continue; const ft = pos[i * 3 + 1] - size[i * 4 + 1] * 0.5; lo = Math.min(lo, ft); sum += ft; n++; }
        if (n > 1 && sum / n > lo) { shredLo = lo; shredMid = sum / n; } }
      if (weather === 'rain') for (let i = 0; i < 16; i++) { const a = sr.range(300, 760), b = sr.range(-900, -160);
        add(entry.x + dE.x * a + side.x * b, sr.range(170, 230), entry.z + dE.z * a + side.z * b, sr.range(220, 420), sr.range(360, 460), col(M.ceil, 0.9).lerp(col(M.rim), 0.25), sr.range(0.22, 0.4), 0.45); }
      // dawn: the sea fog low in the corridor is torn wisps hugging the cliff feet and drifting across dark water (placed by a
      // hash so no rng draw order changes): rose where the low sun reaches them on the east side, blue-grey on the shaded west
      // They are their own draw of the sprite shader with their own uFade: seen from high above a soft sprite is a pale disc
      // lying on the water, so they fade in only as the eye sinks below 70 m
      if (hour === 'dawn') { const hsh = (i, k) => { const x = Math.sin(i * 91.7 + k * 271.3 + sentH) * 43758.5453; return x - Math.floor(x); };
        const pos = [], size = [], colr = [];
        const wLit = col(M.mist, 0.95).lerp(col(M.hazeSun), 0.35), wSh = col(M.shade, 1.5).lerp(col(M.mist), 0.45);
        for (let i = 0; i < 30; i++) { const sd = i % 2 ? 1 : -1, mid = i % 6 === 5, w = 70 + 80 * hsh(i, 1);
          pos.push(mid ? (hsh(i, 2) - 0.5) * 40 : (sd > 0 ? 22 + 12 * hsh(i, 2) : -(44 + 16 * hsh(i, 2))), 3 + 4 * hsh(i, 3), Z0 + 40 + 660 * ((i + hsh(i, 4)) / 30));
          size.push(w, w * (0.09 + 0.06 * hsh(i, 5)), 0.6, hsh(i, 6)); const c = wSh.clone().lerp(wLit, sd > 0 ? 0.8 : 0.25); colr.push(c.r, c.g, c.b, (mid ? 0.16 : 0.3) + 0.14 * hsh(i, 7)); }
        wispU = { ...fogU(), uTime: LU.uTime, uFade: { value: 0 }, uFlash: { value: 1 } };
        const wisps = new THREE.Mesh(instGeo(new THREE.PlaneGeometry(1, 1), { aPos: [pos, 3], aSize: [size, 4], aCol: [colr, 4] }),
          new THREE.ShaderMaterial({ vertexShader: SPR_VERT, fragmentShader: SPR_FRAG, fog: true, transparent: true, depthWrite: false, uniforms: wispU }));
        wisps.frustumCulled = false; wisps.renderOrder = 4; scene.add(wisps); }
      for (const v of veils) { pos.push(v[0], v[1], v[2]); size.push(v[3], v[4], 0.9, v[5]); colr.push(mistC.r, mistC.g, mistC.b, 0.7); }
      const sprMat = new THREE.ShaderMaterial({ vertexShader: SPR_VERT, fragmentShader: SPR_FRAG, fog: true, transparent: true, depthWrite: false, uniforms: sprU });
      const spr = new THREE.Mesh(instGeo(new THREE.PlaneGeometry(1, 1), { aPos: [pos, 3], aSize: [size, 4], aCol: [colr, 4] }), sprMat); spr.frustumCulled = false; spr.renderOrder = 4; scene.add(spr);
      // glows
      const gp = [], gs = [], gc = [], mint = col('#BFF0E0');
      gp.push(0, 9, Z0 + 2); gs.push(60, 45, 0, 0.31); gc.push(mint.r, mint.g, mint.b, 0.25);
      if (M.squid > 0) squidAt.forEach((q, i) => { gp.push(q[0], 5.2, Z0 + q[1] + 1.5); gs.push(15, 9, 0, (i + 1.02) / 7.3); gc.push(0.62, 1.0, 0.8, 0.26 * M.squid); });     // a soft green-white glow round each squid boat's lamps (a seed that does not drift)
      if (weather === 'lightning') { const lc = col(hour === 'night' ? '#9FB4FF' : '#FFE9C8');
        for (let i = 0; i < 5; i++) { const a = sr.range(0.3, 0.95), d = 4600; gp.push(Math.sin(a) * d, sr.range(900, 2600), Z0 - Math.cos(a) * d); gs.push(sr.range(1500, 2400), sr.range(1000, 1600), 2, sr()); gc.push(lc.r, lc.g, lc.b, 0.5); } }
      const glowMat = new THREE.ShaderMaterial({ vertexShader: SPR_VERT, fragmentShader: SPR_FRAG, fog: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, uniforms: glowU });
      const glow = new THREE.Mesh(instGeo(new THREE.PlaneGeometry(1, 1), { aPos: [gp, 3], aSize: [gs, 4], aCol: [gc, 4] }), glowMat); glow.frustumCulled = false; glow.renderOrder = 5; scene.add(glow);
      await ctx.yield();
      // the ceiling and the shafts that lean down from its edge
      const ceilMat = new THREE.ShaderMaterial({ vertexShader: CEIL_VERT, fragmentShader: CEIL_FRAG, transparent: true, depthWrite: false, side: THREE.DoubleSide,
        uniforms: { uTime: LU.uTime, uCol: { value: col(M.ceil, 2.3) }, uRim: { value: col(M.rim) }, uEdge: { value: new THREE.Vector4(entry.x, entry.z, dE.x, dE.z) } } });
      const cg = new THREE.PlaneGeometry(8400, 8400); cg.rotateX(Math.PI / 2);
      const ceil = new THREE.Mesh(cg, ceilMat); ceil.position.set(entry.x - dE.x * 2800, 420, entry.z - dE.z * 2800); ceil.frustumCulled = false; ceil.renderOrder = 3; scene.add(ceil);
      if (hour === 'dawn') {
        const fg = new THREE.PlaneGeometry(9400, 9400); fg.rotateX(-Math.PI / 2);
        floorMat = new THREE.ShaderMaterial({ vertexShader: CEIL_VERT, fragmentShader: FLOOR_FRAG, transparent: true, depthWrite: false, side: THREE.DoubleSide,
          uniforms: { uTime: LU.uTime, uCol: { value: col(M.mist, 0.9) }, uShade: { value: col(M.shade, 1.0).lerp(col(M.mist), 0.42) }, uHazeSun: { value: col(M.hazeSun) }, uHazeAway: { value: col(M.hazeAway) }, uSunDir: LU.uSunDir, uFade: { value: 1 }, uMid: { value: new THREE.Vector2(0, Z0 + 500) },
            uClear: { value: new THREE.Vector3(sentinelP.x, sentinelP.z, 330) }, uCorr: { value: new THREE.Vector2(Z0, Z0 + 760) } } });
        const floor = new THREE.Mesh(fg, floorMat); floor.position.set(0, 9, Z0 + 500); floor.frustumCulled = false; floor.renderOrder = 3; scene.add(floor);
      }
      const st = [], sw = [];
      for (let i = 0; i < 8; i++) { const a = sr.range(620, 1050), b = -1000 + i * 260 + sr.range(-70, 70);
        st.push(entry.x + dE.x * a + side.x * b, 418, entry.z + dE.z * a + side.z * b); sw.push(sr.range(26, 60), sr.range(90, 170), sr(), sr.range(0.19, 0.3) * (hour === 'night' ? 0.5 : 1) * (b > 560 ? 0.45 : 1)); }   // fainter where the ceiling has drawn off
      const shaftBase = new THREE.PlaneGeometry(1, 1, 1, 6); shaftBase.translate(0, 0.5, 0);
      const shaftMat = new THREE.ShaderMaterial({ vertexShader: SHAFT_VERT, fragmentShader: SHAFT_FRAG, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
        uniforms: { uSunDir: LU.uSunDir, uTime: LU.uTime, uCol: { value: col(M.rim, 1.0) } } });
      const shafts = new THREE.Mesh(instGeo(shaftBase, { aTop: [st, 3], aW: [sw, 4] }), shaftMat); shafts.frustumCulled = false; shafts.renderOrder = 4; scene.add(shafts);
    }
    await ctx.yield();

    // ---- the last rain whipping past the strut for the first seconds (one instanced draw of streaks wrapped round the eye;
    // placed by a hash), and the cooking fires' smoke threads: one on each of the six junks in file and on the one at the corridor's mouth
    let rainU = null;
    // the shower cloud's cover over a place: CEIL_FRAG's own terms worked in JS (the same noise, drift, edge ahead, edge to the
    // right and density), 1 under the solid base and 0 where the ceiling has ended. The streaks are thinned by it.
    const fr1 = (x) => x - Math.floor(x), f32 = Math.fround;
    const h21 = (x, y) => { let px = fr1(f32(x * 123.34)), py = fr1(f32(y * 456.21)); const d = px * (px + 45.32) + py * (py + 45.32); px += d; py += d; return fr1(f32(px * py)); };
    const vnoise = (x, y) => { const ix = Math.floor(x), iy = Math.floor(y); let fx = x - ix, fy = y - iy; fx = fx * fx * (3 - 2 * fx); fy = fy * fy * (3 - 2 * fy);
      return lerp(lerp(h21(ix, iy), h21(ix + 1, iy), fx), lerp(h21(ix, iy + 1), h21(ix + 1, iy + 1), fx), fy); };
    const fbm3 = (x, y) => vnoise(x, y) * 0.55 + vnoise(x * 2.13 + 7.1, y * 2.13 + 7.1) * 0.3 + vnoise(x * 4.31 + 3.7, y * 4.31 + 3.7) * 0.15;
    const showerAt = (x, z, time) => {
      const qx = x * 0.0016 + time * 0.004, qy = z * 0.0016 + time * 0.002;
      const n = fbm3(qx, qy) * 0.7 + fbm3(qx * 3.7 + 5, qy * 3.7 + 5) * 0.3, fine = fbm3(qx * 8.3 + 3, qy * 8.3 + 3);
      const rx = x - entry.x, rz = z - entry.z, d = rx * dE.x + rz * dE.z, b = rx * side.x + rz * side.z;      // metres ahead of the entry, metres to its right
      const e = d + (n - 0.5) * 480 + (fine - 0.5) * 130, eb = b + (fbm3(qx * 1.4 + 11, qy * 1.4 + 11) - 0.5) * 420 + (fine - 0.5) * 110;
      const cov = n + 0.6 * (1 - sstep(250, 820, d)) + (fine - 0.5) * 0.14;
      return (1 - sstep(700, 930, e)) * (1 - sstep(380, 760, eb)) * sstep(0.1, 0.36, cov);
    };
    {
      const hsh = (i, k) => { const x = Math.sin(i * 53.3 + k * 197.1) * 43758.5453; return x - Math.floor(x); };
      const aR = [], nR = Math.round(520 * detail);
      for (let i = 0; i < nR; i++) aR.push(hsh(i, 1), hsh(i, 2), hsh(i, 3), hsh(i, 4));
      rainU = { uTime: LU.uTime, uRain: { value: 0 }, uRel: { value: new THREE.Vector3(44, -9, 6) }, uCol: { value: col(M.rim, hour === 'night' ? 0.6 : 0.85).lerp(col(M.sky), 0.35) } };
      const rg = new THREE.PlaneGeometry(1, 1); rg.translate(0, 0.5, 0);
      const rain = new THREE.Mesh(instGeo(rg, { aR: [aR, 4] }), new THREE.ShaderMaterial({ vertexShader: RAIN_VERT, fragmentShader: RAIN_FRAG, transparent: true, depthWrite: false, side: THREE.DoubleSide, uniforms: rainU }));
      rain.frustumCulled = false; rain.renderOrder = 6; scene.add(rain);
      const aS = [], smk = own('smoke');                                   // each thread's seed from the smoke's own stream
      for (let ji = 0; ji < 7; ji++) { const j = junkAt[ji]; aS.push(j[0] - 7.4 * Math.sin(j[2]), 6.1, Z0 + j[1] - 7.4 * Math.cos(j[2]), smk()); }
      const wA = sea.windAngle || 0;
      const sg = new THREE.PlaneGeometry(1, 1, 1, 18); sg.translate(0, 0.5, 0);
      const smoke = new THREE.Mesh(instGeo(sg, { aS: [aS, 4] }), new THREE.ShaderMaterial({ vertexShader: SMOKE_VERT, fragmentShader: SMOKE_FRAG, fog: true, transparent: true, depthWrite: false, side: THREE.DoubleSide,
        uniforms: { ...fogU(), uTime: LU.uTime, uWind: { value: new THREE.Vector2(Math.cos(wA), Math.sin(wA)).multiplyScalar(0.55) }, uCol: { value: col(M.shade, 1.0).lerp(col(M.sky), 0.5) }, uLit: { value: col(M.mist, hour === 'night' ? 0.5 : 0.95) } } }));
      smoke.frustumCulled = false; smoke.renderOrder = 4; scene.add(smoke);
    }
    await ctx.yield();

    // ---- the rain-fed waterfall down the starboard cliff (its lip read from the vertices of the east wall's second tower, towers[4])
    let fall = null;
    {
      // the cliff face at the lip, read straight from the tower's vertices (the wall is turned -90 degrees about Y: world x = px - local z,
      // world z = pz + local x); no raycast, which would walk every triangle in one long step
      const fz = Z0 + 372, wt = towers[4].object, pa = wt.children[0].geometry.getAttribute('position').array;
      let hx = 1e9;
      for (let i = 0; i < pa.length; i += 3) { const wy = pa[i + 1]; if (wy < 62 || wy > 78) continue; const wz = wt.position.z + pa[i]; if (Math.abs(wz - fz) > 7) continue; hx = Math.min(hx, wt.position.x - pa[i + 2]); }
      if (hx > 1e8) hx = 66;
      await ctx.yield();
      fall = Water.makeWaterfall({ rng: rng.fork('fall'), light: wLight, top: [hx - 0.4, 74, fz], dir: [-1, 0, 0], launch: 2.0, height: 74, width: 9.5, pool: false, rainbow: 0, mistCount: 170, mistOpacity: 0.32, layers: 4, glow: 1.7,
        tint: M.deep, density: 1.0 });
      scene.add(fall.object);
    }
    await ctx.yield();

    // ---- junks in file to starboard of the alighting run, fish rafts, sampans crossing, all on the shared light
    const propMat = new THREE.ShaderMaterial({ vertexShader: PROP_VERT, fragmentShader: PROP_FRAG, fog: true, vertexColors: true, side: THREE.DoubleSide,
      uniforms: { ...fogU(), uTime: LU.uTime, uSunDir: LU.uSunDir, uSunCol: LU.uSunCol, uSkyCol: LU.uSkyCol, uShadeCol: LU.uShadeCol, uLamp: { value: M.lampK }, uPenK: { value: hour === 'dawn' ? 0.55 : (hour === 'night' ? 0.8 : 1) } } });
    const junks = new THREE.InstancedMesh(junkGeo(sailHex), propMat, junkAt.length); junks.frustumCulled = false; scene.add(junks);
    await ctx.yield();
    const raftAt = [[43, 197, 0], [-45, 430, 0.1], [13, 548, -0.08], [-46, 640, 0.05], [-300, 300, 0.7], [280, 760, 1.2]];
    const rafts = new THREE.InstancedMesh(raftGeo(), propMat, raftAt.length); rafts.frustumCulled = false; scene.add(rafts);
    const sampAt = [[-40, 215, 0.05, 1.3], [-44, 120, 3.1, 1.2], [23, 330, 0.05, 1.0], [-38, 345, 0.1, 0.9], [40, 70, 1.2, 0.7], [-40, 520, 2.9, 1.3], [130, 800, 1.0, 1.5], [-210, 600, 2.0, 1.5]];
    const sampans = new THREE.InstancedMesh(sampanGeo(), propMat, sampAt.length); sampans.frustumCulled = false; scene.add(sampans);
    const squids = new THREE.InstancedMesh(squidGeo(M.squid), propMat, squidAt.length); squids.frustumCulled = false; scene.add(squids);
    // ---- the rock's feet. For every tower its outline at the water: the outermost rock within 8 m of the surface at 48
    // bearings round the tower's own centre (the eight modelled towers from their vertices, the far ranks from their plan
    // shape and instance). What floats or flies low keeps a margin in metres from these outlines: every raft 8 m of open
    // water, the sister boat's lane her half span and 8 m.
    const NB = 48, TAU = Math.PI * 2, feet = [];
    const footNew = (x, z) => ({ x, z, R: new Float32Array(NB), vx: new Float32Array(NB), vz: new Float32Array(NB), max: 0 });
    const footAdd = (F, wx, wz) => { const dx = wx - F.x, dz = wz - F.z, r = Math.hypot(dx, dz), k = Math.min(NB - 1, Math.floor((Math.atan2(dz, dx) / TAU + 0.5) * NB)); if (r > F.R[k]) F.R[k] = r; };
    const footEnd = (F) => {
      const R0 = Float32Array.from(F.R);      // a bearing no vertex fell on takes its radius from the nearest ones on either side
      for (let k = 0; k < NB; k++) { if (R0[k] > 0) continue; let a = 1, b = 1; while (a < NB && R0[(k - a + NB) % NB] <= 0) a++; while (b < NB && R0[(k + b) % NB] <= 0) b++;
        F.R[k] = a < NB ? (R0[(k - a + NB) % NB] * b + R0[(k + b) % NB] * a) / (a + b) : 0; }
      for (let k = 0; k < NB; k++) { const a = ((k + 0.5) / NB - 0.5) * TAU; F.vx[k] = F.x + Math.cos(a) * F.R[k]; F.vz[k] = F.z + Math.sin(a) * F.R[k]; F.max = Math.max(F.max, F.R[k]); }
      feet.push(F); };
    for (const t of towers) { const o = t.object, pa = o.children[0].geometry.getAttribute('position').array, c = Math.cos(o.rotation.y), sn = Math.sin(o.rotation.y), F = footNew(o.position.x, o.position.z);
      for (let i = 0; i < pa.length; i += 3) if (pa[i + 1] < 8) footAdd(F, o.position.x + pa[i] * c + pa[i + 2] * sn, o.position.z - pa[i] * sn + pa[i + 2] * c);
      footEnd(F); await ctx.yield(); }
    { const geos = scene.children.filter((o) => o.isInstancedMesh && o.material === farMat).map((o) => o.geometry.getAttribute('position').array);
      for (let i = 0; i < farList.length; i++) { const f = farList[i], pa = geos[i % 3], c = Math.cos(f[5]), sn = Math.sin(f[5]), F = footNew(f[0], f[1]);
        for (let j = 0; j < pa.length; j += 3) if (pa[j + 1] * f[3] < 8) { const X = pa[j] * f[2], Z = pa[j + 2] * f[2] * f[4]; footAdd(F, f[0] + X * c + Z * sn, f[1] - X * sn + Z * c); }
        footEnd(F); if (i % 24 === 23) await ctx.yield(); } }
    await ctx.yield();
    // metres of open water between a point and one tower's foot (negative inside the rock): the nearest of the outline's
    // sides within a quarter turn of the point's own bearing
    const footGap = (F, px, pz) => { const dx = px - F.x, dz = pz - F.z, q = (Math.atan2(dz, dx) / TAU + 0.5) * NB - 0.5, k0 = Math.floor(q), f = q - k0; let best = 1e18;
      for (let i = -12; i <= 12; i++) { const k = (k0 + i + NB) % NB, j = (k + 1) % NB, ax = F.vx[k], az = F.vz[k], bx = F.vx[j] - ax, bz = F.vz[j] - az, t = sat(((px - ax) * bx + (pz - az) * bz) / (bx * bx + bz * bz + 1e-9)), ex = px - ax - bx * t, ez = pz - az - bz * t;
        best = Math.min(best, ex * ex + ez * ez); }
      return Math.hypot(dx, dz) < lerp(F.R[(k0 + NB) % NB], F.R[(k0 + 1) % NB], f) ? -Math.sqrt(best) : Math.sqrt(best); };
    // every raft keeps 8 m of open water from rock. A raft's plan (walkways, hut, nets and the skiff on its painter) is the
    // rectangle x -13 to 15.5, z -21 to 21 in its own frame. A raft whose typed place has less water than that is moved to the
    // nearest place (rings of 2 m about the typed place, out to 40 m) that has it, that is not under the airframe where it
    // flies low (under 12 m of track height the floats' and hull's plan, 26 m to port of the track and 6 m to starboard; under
    // 6 m the whole wing's, 33 m and 13 m: a hut roof stands 4.3 m high and the keels ride 3 m under the eye) and that keeps
    // 2 m from every other boat's plan and from the sampans' courses; if the boats leave no such place within 40 m, the nearest
    // there that has the rock's margin and is clear of the airframe; and if rock fills all of that (a far tower standing on
    // a raft's typed place), the same two searches in rings of 4 m out to 200 m. A raft that has the rock's margin where it
    // is typed stays there. No draw is taken: the same rule on every seed. The egrets lift from the first raft wherever it lies.
    {
      const rim = []; for (let i = 0; i <= 6; i++) { const x = -13 + 28.5 * i / 6; rim.push([x, -21], [x, 21]); } for (let j = 1; j < 9; j++) { const z = -21 + 42 * j / 9; rim.push([-13, z], [15.5, z]); }
      const boats = [];                                                     // [x0, z0, x1, z1, radius] of a hull's plan or a sampan's whole course
      for (const j of junkAt) boats.push([j[0] - Math.sin(j[2]) * 8, Z0 + j[1] - Math.cos(j[2]) * 8, j[0] + Math.sin(j[2]) * 8, Z0 + j[1] + Math.cos(j[2]) * 8, 3]);
      for (const q of squidAt) boats.push([q[0] - Math.sin(q[2]) * 4, Z0 + q[1] - Math.cos(q[2]) * 4, q[0] + Math.sin(q[2]) * 4, Z0 + q[1] + Math.cos(q[2]) * 4, 2.5]);
      for (const q of sampAt) boats.push([q[0], Z0 + q[1], q[0] + Math.sin(q[2]) * 90 * q[3], Z0 + q[1] + Math.cos(q[2]) * 90 * q[3], 2]);
      const pv = new THREE.Vector3(); let low12 = -1e9, low6 = -1e9;
      for (let m = 0; m <= L; m += 2.5) { path.pointAt(m / L, pv); if (pv.y < 12) low12 = Math.max(low12, pv.z); if (pv.y < 6) low6 = Math.max(low6, pv.z); }      // the low stretches of the track (dead straight on x = 0 there), found every 2.5 m of route
      await ctx.yield();
      for (let ri = 0; ri < raftAt.length; ri++) { const r = raftAt[ri], c = Math.cos(r[2]), sn = Math.sin(r[2]), x0 = r[0], z0 = Z0 + r[1];
        const near = feet.filter((F) => Math.hypot(x0 - F.x, z0 - F.z) < F.max + 34 + 200);
        const okAt = (x, z, moved, withBoats) => {
          for (const q of rim) { const wx = x + q[0] * c + q[1] * sn, wz = z - q[0] * sn + q[1] * c;
            if (moved && ((wz < low6 && wx > -33 && wx < 13) || (wz < low12 && wx > -26 && wx < 6))) return false;
            for (const F of near) if (Math.hypot(wx - F.x, wz - F.z) < F.max + 8 && footGap(F, wx, wz) < 8) return false; }
          if (!moved) return true;
          for (let o = 0; o < raftAt.length; o++) if (o !== ri && Math.hypot(x - raftAt[o][0], z - Z0 - raftAt[o][1]) < 54) return false;
          if (withBoats) for (const b of boats) { const n = Math.ceil(Math.hypot(b[2] - b[0], b[3] - b[1]) / 4);
            for (let k = 0; k <= n; k++) { const dx = lerp(b[0], b[2], k / n) - x, dz = lerp(b[1], b[3], k / n) - z, lx = dx * c - dz * sn, lz = dx * sn + dz * c;
              if (Math.hypot(Math.max(0, Math.abs(lx - 1.25) - 14.25), Math.max(0, Math.abs(lz) - 21)) < b[4] + 2) return false; } }
          return true; };
        if (okAt(x0, z0, false, false)) continue;                           // a raft with the rock's margin stays where it is typed
        let done = false;
        for (const [withBoats, r0, r1, dr] of [[true, 2, 40, 2], [false, 2, 40, 2], [true, 44, 200, 4], [false, 44, 200, 4]]) { for (let rad = r0; rad <= r1 && !done; rad += dr) { const n = Math.round(TAU * rad / dr);
            for (let k = 0; k < n && !done; k++) { const a = k / n * TAU, x = x0 + Math.cos(a) * rad, z = z0 + Math.sin(a) * rad; if (okAt(x, z, true, withBoats)) { r[0] = x; r[1] = z - Z0; done = true; } if (k % 16 === 15) await ctx.yield(); }
            await ctx.yield(); }
          if (done) break; }
        await ctx.yield(); }
    }
    const jm = new THREE.Matrix4(), jq = new THREE.Quaternion(), je = new THREE.Euler(), jp = new THREE.Vector3(), js = new THREE.Vector3(1, 1, 1);
    const poseBoats = (time, wakeD) => {
      for (let i = 0; i < junkAt.length; i++) { const j = junkAt[i];
        const kick = i < 6 ? sat(1 - Math.abs(wakeD - (300 - j[1]) - 18) / 60) : 0;      // the wake V reaches each junk in turn
        je.set(Math.sin(time * 0.7 + i * 1.7) * 0.03 * (1 + 2 * kick), j[2], Math.sin(time * 0.9 + i * 2.3) * (0.04 + 0.1 * kick));
        jq.setFromEuler(je); jp.set(j[0], 0.1 + Math.sin(time * 0.8 + i) * (0.12 + 0.25 * kick), Z0 + j[1]); jm.compose(jp, jq, js); junks.setMatrixAt(i, jm); }
      junks.instanceMatrix.needsUpdate = true;
      for (let i = 0; i < raftAt.length; i++) { const r = raftAt[i]; je.set(Math.sin(time * 0.6 + i) * 0.012, r[2], Math.sin(time * 0.8 + i * 2) * 0.015); jq.setFromEuler(je);
        jp.set(r[0], Math.sin(time * 0.7 + i * 1.3) * 0.06, Z0 + r[1]); jm.compose(jp, jq, js); rafts.setMatrixAt(i, jm); }
      rafts.instanceMatrix.needsUpdate = true;
      for (let i = 0; i < sampAt.length; i++) { const r = sampAt[i], d = Math.min(time, 90) * r[3]; je.set(Math.sin(time * 1.1 + i) * 0.03, r[2], Math.sin(time * 1.3 + i * 2) * 0.05); jq.setFromEuler(je);
        jp.set(r[0] + Math.sin(r[2]) * d, Math.sin(time * 1.0 + i * 1.3) * 0.08, Z0 + r[1] + Math.cos(r[2]) * d); jm.compose(jp, jq, js); sampans.setMatrixAt(i, jm); }
      sampans.instanceMatrix.needsUpdate = true;
      for (let i = 0; i < squidAt.length; i++) { const r = squidAt[i]; je.set(Math.sin(time * 0.9 + i * 2.1) * 0.035, r[2], Math.sin(time * 1.1 + i * 1.3) * 0.06); jq.setFromEuler(je);
        jp.set(r[0], Math.sin(time * 0.85 + i * 1.9) * 0.1, Z0 + r[1]); jm.compose(jp, jq, js); squids.setMatrixAt(i, jm); }
      squids.instanceMatrix.needsUpdate = true;
    };
    poseBoats(0, -999);
    await ctx.yield();

    // ---- birds: the swiftlet ribbon down the corridor, egrets lifting from the first raft, kites over the summits and one
    // sliding past the float in the spiral, flying fish skittering ahead of the float at the flare
    const birdBase = new THREE.BufferGeometry();
    birdBase.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0.5, 0.13, 0, 0.05, -0.13, 0, 0.05, 0, 0, -0.5,   0.48, 0, 0.2, 1, 0, -0.32, 0.1, 0, -0.14,   -0.48, 0, 0.2, -1, 0, -0.32, -0.1, 0, -0.14], 3));
    birdBase.setIndex([0, 1, 2, 1, 3, 2, 1, 4, 6, 4, 5, 6, 2, 9, 7, 7, 9, 8]);
    const makeBirds = (n, o, br) => { const A = [], O = [];
      for (let i = 0; i < n; i++) { const k = o.stray && i % o.stray === 0 ? 3.2 : 1;      // (a few stragglers fly wide of the stream)
        A.push(br(), br(), br(), br()); O.push(br.gauss() * o.spread[0] * k, br.gauss() * o.spread[1] * k, br.gauss() * o.spread[2]); }
      const mat = new THREE.ShaderMaterial({ vertexShader: BIRD_VERT, fragmentShader: BIRD_FRAG, fog: true, side: THREE.DoubleSide, transparent: !!o.far,
        uniforms: { ...fogU(), uTime: LU.uTime, uFar: { value: o.far || 1e6 }, uNear: { value: o.near || 0.3 }, uLift: { value: 0 }, uLoop: { value: o.loop }, uRate: { value: o.rate }, uSize: { value: o.size }, uP0: { value: o.p[0] }, uP1: { value: o.p[1] }, uP2: { value: o.p[2] }, uCol: { value: o.col }, uRim: { value: o.rim } } });
      const m = new THREE.Mesh(instGeo(birdBase, { aA: [A, 4], aOff: [O, 3] }), mat); m.frustumCulled = false; scene.add(m); return m; };
    const V = (x, y, z) => new THREE.Vector3(x, y, z);
    const through = (a, m, b) => m.clone().multiplyScalar(2).addScaledVector(a, -0.5).addScaledVector(b, -0.5);   // control point so the curve passes through m
    const dawnOut = hour === 'dawn';
    // THE VESSEL'S PLACEMENT, one function for every caller (flyAt: update() below poses the airframe with it in every
    // frame, and the swiftlets' search asks it where the keel flies): the airframe as it stands when the eye is at `eye`,
    // u of the way along the route, at the clock `time`. It leaves the airframe posed and gives back what update() goes
    // on to use (fly: metres past the kiss, the alighting clock s, the turn, metres past the departure; flyTan is the
    // airframe's heading).
    // SEAT (laid along the track: the engine's gaze is free to look round inside it, so the spiral shows float, strut and
    // wingtip only with the bay wheeling below, and entry, corridor and flare show the whole layout): the eye rides the strut seat half a metre inboard of the brief's (10.4 m from the keel, 1.5 m inside the float struts),
    // nose 8 degrees to starboard of the track so hull, chine and the outboard propeller disc fill the left third and the float,
    // strut and wires the lower right; for the held breath the nose swings 5 degrees more and the spray sheet stands in the left 40%.
    const flyUp = new THREE.Vector3(0, 1, 0), flyTan = new THREE.Vector3(), flyShift = new THREE.Vector3(), fly = { dk: 0, s: 0, turn: 0, dep: 0 };
    const flyAt = (u, time, eye) => {
      path.tangentAt(u, flyTan);
      const dk = u * L - K.kiss;                                    // metres past the kiss
      const s = dk < 0 ? dk / 32 : (dk < 150 ? dk / 25 : 6 + (dk - 150) / 14);
      const turn = sstep(0.035, 0.125, u) * (1 - sstep(K.uT1 - 0.1, K.uT1 + 0.01, u));        // the roll goes on before the track bends: by u 0.08 the wing is half-way down
      const roll = 0.436 * turn + Math.sin(time * 0.6) * 0.012 * (s < 0 ? 1 : 0);
      const pitch = hero.pitch(s) - 0.11 * turn - 0.05 * sstep(K.uT1, K.uT1 + 0.05, u) * (1 - sstep(-4, -1.5, s));
      const dep = Math.max(0, dk - K.depart);
      const held = sstep(-1.5, 0.6, s) * (1 - sstep(6.5, 9, s));
      const inboard = 0.14 + 0.085 * held + 0.17 * turn;
      flyTan.y = 0; flyTan.applyAxisAngle(flyUp, -inboard);
      flyShift.set(-0.5 + sstep(0, 30, dep) * 2.6, s > 0 ? (3.0 - eye.y) + hero.heave(s) : 0, -dep * 0.93);
      hero.seatPose(eye, flyTan, roll, pitch, flyShift);
      fly.dk = dk; fly.s = s; fly.turn = turn; fly.dep = dep; return fly;
    };
    // (4,500 birds, half as many again as the brief's 3,000, by the designers' ruling: its body must read as one dark
    // ribbon some 6 m thick; it is a standing stream, the same at every phase of the clock, on a line fixed in the bay.
    // THE SAME AT EVERY GRAPHICS TIER: the flock is the whole 4,500 at every tier, so its reach, which the lip, the
    // funnel and the vessel's margin read, and with them the line, are the same on every device; a lower tier draws
    // fewer of those same birds, the first 4,500 x detail of them)
    // THE SWIFTLETS' LINE is of the bird and the cave (the designers' rule): swiftlets fly into a cave level and on the
    // mouth's axis, they do not stoop from height. The cave is the second west tower's own mouth 40 m up the west wall
    // (buildTower's caveAt: at that height on every seed; the tower's seeded outline carries the mouth some metres along
    // the wall and before or behind the wall's line, and turns its face). The ribbon is the world's own flock on A LINE
    // OF FOUR POINTS (the parts file's swiftFlock, swiftLine, buildSwiftlets: THE SWIFTLETS' STREAM there. The bird is
    // makeBirds's bird above, which the egrets, the kites and the fish keep: its count, size, colours, spreads, loop,
    // rate, wingbeat, wobble, near and far, and the stragglers), level at the mouth's own height on every seed but
    // those of (b) and (d) below. The line is three straight runs joined by two turns of SW.rho, so it has no corner; its own
    // length is SW.len (250 m).
    //   swW, the mouth's end, stands in the mouth. THE AXIS RUN, the last of the three runs, lies ON THE MOUTH'S OWN
    // OUTWARD AXIS swN (the cave tower's outward normal at the mouth in plan: by the seed 35 to 120 degrees from the
    // corridor's bay-ward axis, turned toward the corridor) at the mouth's height, from the end of the second turn to
    // the mouth's end, and the birds fly on along it into the rock. Its least length swRun is measured from THE LIP
    // outward, by the stream's own measures: SW.run, the body's half thickness (SW.body, 3 m: a bird of the stream's
    // edge flies that far beside the centre line, and passes the lip's rock that far beside it) and two spreads along
    // the line (2 x SW.along, 18 m: the length of the stream's body about any one place of it, over which the funnel
    // below does its drawing in): 21 m. THE LIP swLip is where the rock about the mouth ends, out along the axis: how
    // far out of the mouth's end the outermost rock stands that is in the way of the flock as its birds are drawn
    // (swiftMouth: under a metre where the wall is flat about the mouth, 9 of the seeds 1 to 24; 1.7 to 28 m on the
    // others, where the mouth lies back in a hollow or a fold of the wall). So the axis run is 21 to 49 m long.
    //   THE FAR END stands on the bearing from the mouth of swG, the middle of the corridor's seaward opening: the
    // middle of the gap between the walls' lines (the west 64 m and the east 44 m from the axis: 10 m west of the
    // axis) at the corridor's bay end Z0 + CORR.s, where the east wall's first tower (towers[2]) ends and the west
    // wall's first (towers[1]) stands across from it; as far along that bearing as makes the line SW.len long (171 to 248 m
    // from the mouth; swG lies 254 to 269 m from it). It is not moved to get a crossing: on every seed of 1 to 24 the
    // line stays west of the eye's track throughout, and the beat is the stream alongside to port. Over those seeds it
    // stands 33 to 98 m from the eye from 17 to 22 s of flight, at its nearest then 33 to 36 m, and at no time of the
    // flight nearer than 26.8 m (seed 22): where the eye has sunk under the line's height the stream passes over the vessel.
    //   THE TWO POINTS BETWEEN carry the bend. A stands on the straight run from the mouth's end to the far end, m out
    // of the mouth's end; B stands on the mouth's axis, as far out as makes the axis run r long. The stream leaves the
    // far end straight for the mouth, turns at A toward B, and turns at B onto the axis. r and m are all that is free.
    // THE BEND of a line is both its turns' angles together. The search's order of bend is the shortest axis run first
    // (r from swRun up in steps of SW.step) and at each the least turn (m from the far end toward the mouth in steps of
    // SW.step: the nearer A stands to the mouth, the more both turns turn); on every seed of 1 to 24 the first line it
    // finds has the least bend of every axis run's (measured). r and m are set by TWO MARGINS and nothing else:
    //   (i) THE ROCK: the centre line keeps SW.clear (6 m) in space from all rock of the six wall towers other than the
    // mouth's own frame (the rock within the frame's half width of the mouth's place on the wall in plan, and within its
    // half height of the mouth's height). The axis run is not free: where the mouth lies in a fold or a hollow of the
    // wall, rock outside the frame stands nearer than that to the axis itself, and there the margin OVER THE AXIS RUN
    // is what the axis run's least length has (swNeed: 3 of the seeds 1 to 24, 1.3 to 5.7 m; 15 of the next hundred,
    // 3.5 to 6.0 m): on its axis run no line is nearer rock than the mouth's own axis is. From the head of its axis
    // run to its far end every line keeps the whole of SW.clear on every seed (swRk).
    //   (ii) THE VESSEL, treated as the rock is, with THE FLOCK COUNTED AS IT FLIES. The flock is wider than the
    // stream's body: every SW.stray-th bird is a straggler 3.2 times as wide, and every bird wobbles. swFar is the
    // farthest any bird stands from the centre line across it, over it and under it: the greatest offsets of the
    // flock's own draws (swiftFlock's reach) with the wobble's reach (swiftWob), as the shader lays them about the
    // line; a bird's offset along the line is laid along the line itself, turns and all, so it carries no bird wide of
    // the line: it only lengthens the stream past the line's ends (swFar.along). By the seed's flock that is 10.9 to
    // 18.0 m across, 8.8 to 15.5 m over and 7.7 to 15.7 m under the centre line (seeds 1 to 24), reached at any place
    // of the line where nothing draws the flock in. Wherever the vessel flies at a height where the flock can touch
    // it (the eye's track no more than swUp over the line there or swDn under it: SW.near, 8 m, the airframe's own
    // reach above and below the eye's track: see SW; and the flock's reach over or under its centre line), the centre
    // line keeps swWing in plan from THE KEEL'S TRACK, the vessel's own centre line: the airframe's reach swTip (the
    // farthest point of its own skin from its own origin on the keel, a wing tip, 20.64 m: however the flight turns
    // the airframe, no point of the skin stands farther than that from the keel's place in plan; the half span is
    // 20.02 m and, as the flight poses it, the tip stands 20.0 to 20.4 m out), the flock's reach across, and SW.gap, 1 m
    // of clear air between a bird and the skin: 32.5 to 39.7 m. The keel's track is where the airframe's own placement
    // puts its keel at every metre of the route (swFly below: flyAt, the one function update() poses the vessel with);
    // the eye rides the starboard strut 10.4 m from the keel, whose track runs 10.1 to 10.2 m west of the eye's down
    // the corridor. Within SW.near of the mouth's height the vessel flies the corridor from Z0 + 554 down to Z0 + 500,
    // where the eye's track sinks from 48 to 32 m over the sea; at the flock's heights it flies a longer stretch about
    // that one. Where the vessel is higher the ribbon may pass under it; where it is lower the ribbon passes over it
    // on its way to the mouth.
    // THE RULE, in this order:
    //   (a) Of the lines level at the mouth's height, the one of THE LEAST BEND among those that have both margins,
    // the vessel's for the flock as it flies. None of the seeds 1 to 124: the mouth's end stands 36 to 73 m in plan
    // from the keel's track where the vessel flies at the flock's heights, the margin is 32 to 40 m, and on 94 of the
    // 124 seeds the axis run's own least length already lies within the margin of the track.
    //   (b) Where no level line has both: THE LEAST CHANGE OF THE LINE'S LEVEL that gives both. At each length of the
    // axis run, the least bend that has the rock's margin as a level line is tried with its far end at every level in
    // steps of SW.fine down and up as far as swReach (swTilt, swBar); the least change is taken, of two equal changes
    // the lower (a far end under the mouth's height climbs to it; one over it comes down from height, and the
    // designers' rule of the bird is against that), and at it the shortest axis run. THE AXIS RUN STAYS LEVEL: the
    // change is made and unmade outside it, by the smooth step's own curve over the whole of the line from the far end
    // to the head of the axis run (level at both, steepest midway: the parts file's law). swReach, how far the far
    // end's level may leave: the cave's own height over the sea less SW.clear (34 m): so far down, the far end, the
    // line's lowest point, still keeps SW.clear over the sea, the margin it keeps from rock; and no farther up than
    // down. None of the seeds 1 to 124.
    //   (c) Where no line has the vessel's margin for the flock as it flies, THE FLOCK IS DRAWN IN where the vessel
    // passes (below), and the line keeps the vessel's margin for the stream's body (half width SW.body; the flock drawn in is 3.9 to 7.3 m wide): the level line of least bend
    // that has the rock's margin and, where the vessel flies within SW.near of the mouth's height, keeps in plan from
    // the keel's track the airframe's reach, SW.gap, the wobble's reach and the stream's half width SW.body, two
    // spreads across (SW.tuck's first: 25.2 m); where no level line has that, the same with one spread across
    // (SW.tuck's second: 23.7 m). The two widths are the stream's own measures (a first edit tried five widths and a height band on the margin; both were cut to this between counts over seeds 1 to 124). 23 and 1 of the seeds 1
    // to 24; 95 and 2 of the next hundred.
    //   (d) Where no level line has even that: the least change of the line's level, found as in (b), that gives the
    // rock's margin and the last of those margins. None of the seeds 1 to 24; 3 of the next hundred.
    //   NO NEARER: a line of (a) to (d) is kept only where the vessel is then no nearer the stream's centre line than
    // with THE LINE BEFORE, which is one line by its own rule: the least bend at the mouth's height that has the
    // rock's margin alone (the first such line in the search's order; where no line has it, of the shortest axis
    // run's lines the one with the greatest rock clearance, the least bend among equals: on no seed of 1 to 124). Both
    // are measured the same way, the least distance in space between the centre line and the airframe's skin over the
    // whole flight (swNigh below). A line that would bring the vessel nearer is not taken and the seed falls under (e).
    //   (e) Where none of these gives a line, or the line found would bring the vessel nearer: the line before, the
    // flock drawn in about it as in (c). None of the seeds 1 to 124.
    // The rock's margin is never given up for the vessel's.
    //   THE FLOCK DRAWN IN (the parts file's tuck; the lines of (c), (d) and (e)). THE STRETCH is the part of the
    // line, from the first to the last of its stations, that stands within the flock's whole margin of (ii) from the
    // keel's track: there, and nowhere else, a bird of the flock as it flies could reach the airframe. Over the
    // stretch every bird's offset across and up is drawn toward the centre line by the funnel's own law; the drawing
    // in is eased on and off by the smooth step over SW.ease (18 m, the length of the stream's body about any one
    // place of it) beyond the stretch's two ends, where the line has the whole margin. HOW FAR IN is measured, not
    // chosen: swSkin, the least distance in space between the line and the airframe's skin over the whole flight
    // (swNigh), less SW.gap is how far from the centre line a bird may stand, and the flock is drawn inside the widest
    // ellipse of its own shape (so many spreads across by as many up, in steps of SW.fine, the wobble's reach added)
    // that lies within that. On the seeds 1 to 24 the stretch begins 7.5 to 49 m out of the mouth's end and ends 159
    // to 250 m out of it, of the line's 250 m; swSkin is 5.6 to 9.1 m; and over the stretch the flock flies no wider
    // than 3.9 to 7.3 m across the line and 3.2 to 5.9 m over and under it: the stream's body all but as it is, its
    // stragglers beside it. The flock flies at its whole width only beyond the stretch, toward the line's far end.
    //   NO BIRD TURNS ON THE SPOT (the parts file's bend). A turn of SW.rho (9 m) is tighter than the flock is wide:
    // a bird as far inside the centre line as the turn's radius would stand still at the turn's centre, and one
    // farther in would fly its own arc backward. So on the inside of each turn a bird's offset across is held under
    // SW.inner (5.4 m: the radius less the body's half width and the wobble's reach, so that the innermost bird
    // still flies a round no tighter than the body's half width, at a third of its own pace or more) by the funnel's
    // own law, eased on and off over SW.ease before and after the turn; the outside of a turn is left as it was. (The
    // other way, turns as wide as the flock's reach and a margin, 14 to 21 m, was measured and not taken: with such
    // turns two of the six seeds it was tried on (1 and 4 of 1 to 6) have no line that keeps even the airframe's reach from the keel's track.)
    //   THE FUNNEL AT THE MOUTH (the parts file's law): the mouth is painted on the wall, and a bird goes in where its
    // path crosses the wall inside the painted arch. From the head of the axis run in to the lip every bird's offset
    // across and up is drawn toward the line, so that the flock passes the lip inside the arch that holds no rock
    // about the axis there (swiftMouth's free arch, less the painted rim's raggedness and the birds' wobble; never
    // tighter than the flock's own spread), and a bird that has gone in is drawn no farther than the rock is deep. By
    // the reader's measure (each bird's path against every rock face, at half size or more) no bird of the seeds 1
    // to 24 crosses rock outside the arch. (With the birds' wobble as the clock gives it, the same holds on all but one
    // of them: there the mouth lies in a fold whose flank runs out beside the axis nearer than the flock's own spread,
    // and some three birds in a hundred touch that flank.)
    //   What this flight does that makeBirds's does not: it is even in metres along the line (makeBirds flies its
    // curve evenly in the curve's own measure: fast and thin at the far end, slow and thick into the mouth); a bird's
    // offset along the line is laid along the line itself, turns and all (makeBirds lays it along the heading at the
    // bird's place: wide of a bent line); the funnel, the drawing in where the vessel passes, and the hold on the
    // inside of the turns. The brief's stragglers close by the eye are left out.
    // Nothing of the line is timed, lifted or placed for a view: (ii) is a margin in space from the vessel's own
    // track. At dawn they pour out instead.
    const swT = towers[3]; swT.object.updateMatrixWorld(true);
    const swC = swT.anchors.caves[swT.anchors.caves.length - 1];
    const swW = swC.position.clone().applyMatrix4(swT.object.matrixWorld); swW.x += 1.5;
    const SW = { len: 250, clear: 6, near: 8, gap: 1, count: 4500, across: 1.5, up: 1.2, along: 9, stray: 37, tuck: [2, 1], out: 1.5, step: 1, fine: 0.125, sta: 0.5 };      // (metres; near is the airframe's reach above and below the eye's track: buildHero's fin top stands 5.55 m over the strut seat and its keel 3.55 m under it, 6.1 and 3.8 m as the flight poses it where the vessel flies at the flock's heights, and no more than 6.9 and 6.4 m at any height where a line of the search can meet it; gap is the clear air kept between a bird and the airframe's skin; count is the flock's birds, the same at every graphics tier; across, up, along are the flock's spreads, makeBirds's own for this flock, and stray its every 37th bird flying 3.2 times as wide; tuck: the stream's widths, in spreads across, that rule (c) keeps the vessel's margin for: its body's two, then one; out is the 1.5 m the mouth's end stands off the wall, the line above; step is the search's step in r and in m, fine its step in the line's level and in the width the flock is drawn in to; sta the distance between the stations along a line at which the margins are measured)
    SW.body = 2 * SW.across; SW.rho = SW.along; SW.run = 2 * SW.along + SW.body; SW.ease = 2 * SW.along; SW.inner = SW.rho - SW.body - swiftWob[0];      // body, the stream's half width: twice its spread across, the ribbon "some 6 m thick" above; rho, the turns' radius: the stream's own spread along the line, so its body, a spread long before and behind any place of it, takes a turn no tighter than its own length (chosen by that measure of the stream's own, not searched); run, the axis run's least length from the lip: the rule above; ease, the length over which the drawing in and the turns' hold come on and go off: the stream's body's own length about a place, as the funnel's; inner, how far inside the centre line a bird may fly a turn: the rule above
    const swFlk = swiftFlock(SW.count, { spread: [SW.across, SW.up, SW.along], stray: SW.stray }, rng.fork('swift'));      // THE WHOLE FLOCK at every graphics tier: the flock's own draws (the same, in the same order, as makeBirds would make for it). The lip, the funnel and the margins below read its reach; buildSwiftlets draws the first SW.count x detail of its birds
    await ctx.yield();
    const swG = V((wallLine(1, CORR.s) - wallLine(-1, CORR.s)) / 2, swW.y, Z0 + CORR.s);      // the middle of the corridor's seaward opening, at the mouth's height
    const swD = Math.hypot(swG.x - swW.x, swG.z - swW.z), swGx = (swG.x - swW.x) / swD, swGz = (swG.z - swW.z) / swD;      // the bearing of the opening's middle from the mouth
    const swHW = swC.halfWidth, swN = [0, 0], swRock = new Map(), swTall = new Map();         // the mouth's frame's half width (buildTower's caveAt: 7.5 m); the mouth's own outward axis in plan; the rock the line keeps off (below)
    let swTip = 0; { const a = hero.parts.skin.geometry.getAttribute('position'); for (let q = 0; q < a.count; q++) swTip = Math.max(swTip, Math.hypot(a.getX(q), a.getY(q), a.getZ(q)) * hero.object.scale.x); }      // the airframe's reach: the farthest point of its own skin from its own origin on the keel (buildHero: a wing tip, 20.64 m; the wing's half span is 20.02 m)
    const swFar = { across: swFlk.reach.across + swiftWob[0], up: swFlk.reach.up + swiftWob[1], down: swFlk.reach.down + swiftWob[1], along: swFlk.reach.along };      // THE FLOCK AS IT FLIES: the farthest any bird stands across the centre line, over it and under it (the flock's own greatest offsets, the stragglers' among them, with the wobble's reach), and along the line past its ends
    const swWing = swTip + swFar.across + SW.gap, swUp = SW.near + swFar.up, swDn = SW.near + swFar.down, swReach = swW.y - SW.clear, swNL = Math.floor(swReach / SW.fine);      // THE VESSEL'S MARGIN for the flock as it flies: swWing in plan from the keel's track (32.5 to 39.7 m by the seed's flock) wherever the eye's track is no more than swUp over the line or swDn under it; how far the far end's level may leave the mouth's height (34 m: see the rule above), and the count of steps of SW.fine in that
    const swFaces = (i, h, fn, k0 = 0, k1 = Infinity) => { const o = towers[i].object, pa = o.children[0].geometry.getAttribute('position').array, ix = o.children[0].geometry.index.array, co = Math.cos(o.rotation.y), si = Math.sin(o.rotation.y);      // every rock face of towers[i] (of its faces k0 to k1, all of them if not said) that reaches within h of the mouth's height: its first corner and its two edges from there (x, height, z from the mouth's end swW)
      const wx = (q) => o.position.x + pa[q] * co + pa[q + 2] * si - swW.x, wz = (q) => o.position.z - pa[q] * si + pa[q + 2] * co - swW.z;
      for (let k = k0; k < Math.min(ix.length, k1); k += 3) { const a = ix[k] * 3, b = ix[k + 1] * 3, d = ix[k + 2] * 3;
        if (Math.min(pa[a + 1], pa[b + 1], pa[d + 1]) > swW.y + h || Math.max(pa[a + 1], pa[b + 1], pa[d + 1]) < swW.y - h) continue;
        const x0 = wx(a), y0 = pa[a + 1] - swW.y, z0 = wz(a); fn(x0, y0, z0, wx(b) - x0, pa[b + 1] - swW.y - y0, wz(b) - z0, wx(d) - x0, pa[d + 1] - swW.y - y0, wz(d) - z0); } };
    swFaces(3, swC.halfHeight, (x0, y0, z0, ux, uy, uz, vx, vy, vz) => { const cx = x0 + (ux + vx) / 3, cz = z0 + (uz + vz) / 3;      // THE MOUTH'S AXIS: every face of the cave's own tower whose middle lies in the mouth's frame gives its outward normal, weighed by its area
      if (Math.hypot(cx + SW.out, cz) > swHW || Math.abs(y0 + (uy + vy) / 3) > swC.halfHeight) return;
      const nx = uy * vz - uz * vy, nz = ux * vy - uy * vx, s = nx * (cx + swW.x - swT.object.position.x) + nz * (cz + swW.z - swT.object.position.z) < 0 ? -1 : 1; swN[0] += s * nx; swN[1] += s * nz; });
    { const l = Math.hypot(swN[0], swN[1]); if (l > 1e-6) { swN[0] /= l; swN[1] /= l; } else { const o = swT.object.position, r = Math.hypot(swW.x - SW.out - o.x, swW.z - o.z); swN[0] = (swW.x - SW.out - o.x) / r; swN[1] = (swW.z - o.z) / r; } }      // (no face in the frame: the bearing of the mouth from the tower's own axis; on no seed of 1 to 24)
    await ctx.yield();
    const swMo = await swiftMouth(ctx, swT, swC, swW, swN[0], swN[1], swFlk.reach, SW.len / 4), swLip = Math.max(0, swMo.lip), swRun = swLip + SW.run;      // THE LIP and THE AXIS RUN's least length (above); swMo.free is the funnel's
    await ctx.yield();
    // THE ROCK the line keeps off: all rock of the six wall towers that is not the mouth's own frame (the upright round
    // of swHW about the mouth's place on the wall, within the frame's half height of the mouth's height), as points no
    // more than 1 m apart over its faces and along the frame's bound on them (x, height, z from swW, in cells SW.clear
    // wide in plan). swRock holds the rock within SW.clear of the mouth's height, which is all a level line can come
    // near; swTall the rock under and over that, as far as a sloped line of rule (b) or (d) can come within SW.clear of (in layers
    // SW.clear thick), gathered only where a sloped line is asked for. Faces wholly more than SW.clear outside the ground that every
    // line of the search lies in are left out (swTri: the triangle of the mouth's end, the farthest second point and the
    // farthest far end; its three sides, each as its outward normal and the distance along it beyond which rock is out
    // of every line's reach).
    const swTri = [[0, 0], [SW.len / 2 * swN[0], SW.len / 2 * swN[1]], [SW.len * swGx, SW.len * swGz]].map((p, e, t) => { const q = t[(e + 1) % 3], r = t[(e + 2) % 3], l = Math.hypot(q[0] - p[0], q[1] - p[1]) || 1, mx = (q[1] - p[1]) / l, mz = (p[0] - q[0]) / l, s = mx * (r[0] - p[0]) + mz * (r[1] - p[1]);
      return Math.abs(s) < 1e-6 ? [0, 0, 1] : s > 0 ? [-mx, -mz, -mx * p[0] - mz * p[1] + SW.clear] : [mx, mz, mx * p[0] + mz * p[1] + SW.clear]; });
    let swLo = -1, swHi = SW.clear;                                       // the rock now being gathered: over swLo and no more than swHi above or below the mouth's height
    const swPut = (x, y, z) => { const ay = Math.abs(y); if (ay > swHi || ay <= swLo) return; const key = (Math.floor(x / SW.clear) + 64) * 128 + Math.floor(z / SW.clear) + 64, m = swLo < 0 ? swRock : swTall, k = swLo < 0 ? key : key * 16 + Math.floor(y / SW.clear) + 8; let c = m.get(k); if (!c) m.set(k, c = []); c.push(x, y, z); };
    const swCut = (x0, y0, z0, x1, y1, z1) => { const ax = x0 + SW.out, dx = x1 - x0, dz = z1 - z0, l2 = dx * dx + dz * dz, qb = ax * dx + z0 * dz, qd = qb * qb - l2 * (ax * ax + z0 * z0 - swHW * swHW);      // where a line on a face crosses the frame's bound (its round, or its top or its foot): the nearest rock of that face that is not the frame's own
      if (l2 > 0 && qd >= 0) for (const s of [(-qb - Math.sqrt(qd)) / l2, (-qb + Math.sqrt(qd)) / l2]) if (s >= 0 && s <= 1) swPut(x0 + dx * s, y0 + (y1 - y0) * s, z0 + dz * s);
      for (const b of [-swC.halfHeight, swC.halfHeight]) if ((y0 - b) * (y1 - b) < 0) { const s = (b - y0) / (y1 - y0); swPut(x0 + dx * s, b, z0 + dz * s); } };
    const swTake = async (some) => { for (let i = 1; i <= 6; i++) for (let k = 0, nk = towers[i].object.children[0].geometry.index.count; k < nk; k += some) {      // gathers that rock of the six wall towers, `some` corners of faces at a time, the engine resting between
        swFaces(i, swHi, (x0, y0, z0, ux, uy, uz, vx, vy, vz) => { if (Math.max(Math.abs(y0), Math.abs(y0 + uy), Math.abs(y0 + vy)) <= swLo) return;
          for (const m of swTri) if (m[0] * x0 + m[1] * z0 > m[2] && m[0] * (x0 + ux) + m[1] * (z0 + uz) > m[2] && m[0] * (x0 + vx) + m[1] * (z0 + vz) > m[2]) return;
          const n = Math.max(1, Math.ceil(Math.max(Math.hypot(ux, uy, uz), Math.hypot(vx, vy, vz), Math.hypot(ux - vx, uy - vy, uz - vz)))), cut = Math.min(Math.hypot(x0 + SW.out, z0), Math.hypot(x0 + ux + SW.out, z0 + uz), Math.hypot(x0 + vx + SW.out, z0 + vz)) <= swHW + n;
          for (let u = 0; u <= n; u++) for (let v = 0; v <= n - u; v++) { const x = x0 + (ux * u + vx * v) / n, y = y0 + (uy * u + vy * v) / n, z = z0 + (uz * u + vz * v) / n;
            if (Math.hypot(x + SW.out, z) > swHW || Math.abs(y) > swC.halfHeight) swPut(x, y, z);
            if (cut && u + v < n) { swCut(x, y, z, x + ux / n, y + uy / n, z + uz / n); swCut(x, y, z, x + vx / n, y + vy / n, z + vz / n); swCut(x + ux / n, y + uy / n, z + uz / n, x + vx / n, y + vy / n, z + vz / n); } } }, k, k + some);
        await ctx.yield(); } };
    await swTake(Infinity);                                               // (the rock within SW.clear of the mouth's height: a tower at a time)
    const swGap = (x, z) => { let g = SW.clear; const cx = Math.floor(x / SW.clear) + 64, cz = Math.floor(z / SW.clear) + 64;      // the distance in space from the point x, z of a line level at the mouth's height to the nearest of that rock, no more than SW.clear
      for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) { const c = swRock.get((cx + i) * 128 + cz + j); if (c) for (let q = 0; q < c.length; q += 3) { const dx = c[q] - x, dz = c[q + 2] - z, e = Math.sqrt(dx * dx + c[q + 1] * c[q + 1] + dz * dz); if (e < g) g = e; } }
      return g; };
    // THE VESSEL'S OWN TRACK (swFly: for every metre of the route, where the airframe stands and how it is turned when the
    // eye is there: its origin on the keel as x, height, z from swW, the nine numbers of its turn, and the eye's height
    // from swW). It is the airframe's own placement, CALLED, not written again: flyAt above, the one function that
    // update() poses the vessel with in every frame, is asked for every metre of the route with the eye on the route's
    // point (where the engine puts it) and the clock at nought (the roll's sway in time, under a degree, at rest).
    const swFly = [];
    { const p = V(0, 0, 0), n = Math.ceil(path.length), o = hero.object, op = o.position.clone(), oq = o.quaternion.clone();
      for (let i = 0; i <= n; i++) { const u = i / n; path.pointAt(u, p); flyAt(u, 0, p); o.updateMatrix(); const e = o.matrix.elements;
        swFly.push(e[12] - swW.x, e[13] - swW.y, e[14] - swW.z, e[0], e[4], e[8], e[1], e[5], e[9], e[2], e[6], e[10], p.y - swW.y); if (i % 400 === 399) await ctx.yield(); }
      o.position.copy(op); o.quaternion.copy(oq); o.updateMatrix(); }                 // (the airframe is left as it stood)
    await ctx.yield();
    // THE KEEL'S TRACK by the search's ground (swRt: the keel's places a metre of route apart, each as x, z from swW with
    // the height of the eye's track there, which SW.near is measured about; from the first to the last of them that a
    // line of the search could come within the vessel's widest margin of in plan while the vessel is at a height the
    // flock on such a line can reach; swRb: the ground within that margin of them, x from and to, z from and to), and
    // of it, for a stream that reaches so far across, over and under its centre line (swKeel), THE STRETCH where the
    // vessel flies within SW.near and that reach of the mouth's height (lv: its metres as x, z to x, z, the end ones
    // cut at those heights; lb: the ground within the margin `wing` of it). swS: that for the flock as it flies, then
    // for the stream at each of SW.tuck's widths (the flock itself is drawn in to its measured width, 3.2 to 5.9 m over and under; the margin's height band counts none of that).
    const swRt = [], swRb = [Infinity, -Infinity, Infinity, -Infinity];
    { const n = swFly.length / 13 - 1, all = [], top = swReach + Math.max(swUp, swDn); let i0 = -1, i1 = -1;
      for (let i = 0; i <= n; i++) { const x = swFly[i * 13], y = swFly[i * 13 + 12], z = swFly[i * 13 + 2]; all.push(x, y, z);
        if (Math.abs(y) <= top && !swTri.some((m) => m[0] * x + m[1] * z > m[2] - SW.clear + swWing)) { if (i0 < 0) i0 = i; i1 = i; } }
      if (i0 >= 0) for (let q = Math.max(0, i0 - 1) * 3; q < Math.min(n, i1 + 1) * 3 + 3; q++) swRt.push(all[q]);
      for (let q = 0; q < swRt.length; q += 3) { swRb[0] = Math.min(swRb[0], swRt[q] - swWing); swRb[1] = Math.max(swRb[1], swRt[q] + swWing); swRb[2] = Math.min(swRb[2], swRt[q + 2] - swWing); swRb[3] = Math.max(swRb[3], swRt[q + 2] + swWing); } }
    const swKeel = (across, up, down) => { const wing = swTip + across + SW.gap, hi = SW.near + up, lo = -SW.near - down, lv = [], lb = [Infinity, -Infinity, Infinity, -Infinity];
      for (let q = 0; q + 5 < swRt.length; q += 3) { const y0 = swRt[q + 1], dy = swRt[q + 4] - y0; if (Math.min(y0, y0 + dy) > hi || Math.max(y0, y0 + dy) < lo) continue;
        const sa = dy ? (lo - y0) / dy : -Infinity, sb = dy ? (hi - y0) / dy : Infinity, a = Math.max(0, Math.min(sa, sb)), b = Math.min(1, Math.max(sa, sb)); if (a > b) continue;
        const dx = swRt[q + 3] - swRt[q], dz = swRt[q + 5] - swRt[q + 2]; lv.push(swRt[q] + dx * a, swRt[q + 2] + dz * a, swRt[q] + dx * b, swRt[q + 2] + dz * b);
        for (const s of [a, b]) { lb[0] = Math.min(lb[0], swRt[q] + dx * s - wing); lb[1] = Math.max(lb[1], swRt[q] + dx * s + wing); lb[2] = Math.min(lb[2], swRt[q + 2] + dz * s - wing); lb[3] = Math.max(lb[3], swRt[q + 2] + dz * s + wing); } }
      return { wing, lv, lb }; };
    const swS = [swKeel(swFar.across, swFar.up, swFar.down), ...SW.tuck.map((k) => swKeel(k * SW.across + swiftWob[0], 0, 0))];
    await ctx.yield();
    const swOff = (S, x, z) => { let o = Infinity; const v = S.lv; if (x < S.lb[0] || x > S.lb[1] || z < S.lb[2] || z > S.lb[3]) return o;      // the distance in plan from x, z to S's stretch of the keel's track (Infinity outside lb)
      for (let q = 0; q < v.length; q += 4) { const dx = v[q + 2] - v[q], dz = v[q + 3] - v[q + 1], l2 = dx * dx + dz * dz, s = l2 > 0 ? Math.min(1, Math.max(0, ((x - v[q]) * dx + (z - v[q + 1]) * dz) / l2)) : 0, e = Math.hypot(v[q] + dx * s - x, v[q + 1] + dz * s - z); if (e < o) o = e; }
      return o; };
    // THE LINE of the search (swMk: x and z from swW; the parts file's swiftLine through its four points): the mouth's
    // end; B out on the mouth's axis, as far as makes the axis run, from the end of the turn at B to the mouth's end, r
    // long; A, m out of the mouth's end on the straight run toward the opening's middle; and the far end beyond A on
    // that same straight run, as far as makes the whole line SW.len long. null where the turns do not fit, where the
    // line would be longer than SW.len with no first run at all, or where B would stand farther out than SW.len / 2.
    const swO = [0, 0, 0, 0];
    const swMk = (r, m) => { const ax = m * swGx, az = m * swGz; let b = r + SW.rho;
      for (let it = 0; it < 12; it++) { const bx = b * swN[0] - ax, bz = b * swN[1] - az; b = r + SW.rho * Math.tan(Math.atan2(Math.abs(bx * swN[1] - bz * swN[0]), -(bx * swN[0] + bz * swN[1])) / 2); if (!(b < SW.len)) return null; }
      if (b > SW.len / 2) return null;
      const L0 = swiftLine((m + SW.len) * swGx, (m + SW.len) * swGz, ax, az, b * swN[0], b * swN[1], 0, 0, SW.rho); if (!L0) return null;
      const d = m + L0.tA + SW.len - (L0.len - L0.s1); if (d < m + L0.tA) return null;
      return swiftLine(d * swGx, d * swGz, ax, az, b * swN[0], b * swN[1], 0, 0, SW.rho); };
    const swLev = (ln, q) => { const t = sat((ln.len - q) / ln.s4); return 1 - t * t * (3 - 2 * t); };      // the share of the far end's change of level that the line still has q metres of line from the mouth's end (the parts file's law: none from the head of the axis run in)
    const swClr = (ln) => { let g = SW.clear; for (let q = 0; q <= ln.len; q += SW.sta) { swiftAt(ln, ln.len - q, swO); g = Math.min(g, swGap(swO[0], swO[1])); } return g; };      // a level line's rock clearance, the least over its stations from the mouth outward (asked only where no line has the rock's margin)
    // Has a level line the vessel's margin of S? Its stations from the mouth's end outward, SW.sta apart, and on past
    // the far end as far as the flock reaches along the line, each S.wing or more in plan from S's stretch of the
    // keel's track. (First every sixteenth station against every eighth metre of the track: a line within the margin
    // there has not got it; then every station, eight passed over at a time where the first of them stands more than
    // their length outside lb.)
    const swHas = (S, ln) => { const n = Math.floor((ln.len + swFar.along) / SW.sta), b = S.lb, v = S.lv, w2 = S.wing * S.wing;
      for (let i = 0; i <= n; i += 16) { swiftAt(ln, ln.len - i * SW.sta, swO); const x = swO[0], z = swO[1]; if (x < b[0] || x > b[1] || z < b[2] || z > b[3]) continue;
        for (let q = 0; q < v.length; q += 32) if ((v[q] - x) * (v[q] - x) + (v[q + 1] - z) * (v[q + 1] - z) < w2) return false; }
      for (let i = 0; i <= n; i += 8) { swiftAt(ln, ln.len - i * SW.sta, swO); if (swO[0] < b[0] - 8 * SW.sta || swO[0] > b[1] + 8 * SW.sta || swO[1] < b[2] - 8 * SW.sta || swO[1] > b[3] + 8 * SW.sta) continue;
        for (let j = i; j < i + 8 && j <= n; j++) { swiftAt(ln, ln.len - j * SW.sta, swO); if (swOff(S, swO[0], swO[1]) < S.wing) return false; } }
      return true; };
    let swAx = SW.clear; for (let q = 0; q <= swRun; q += SW.sta) swAx = Math.min(swAx, swGap(q * swN[0], q * swN[1]));      // the axis run's own rock clearance over its least length: no line can have more
    const swNeed = swAx >= SW.clear ? SW.clear : swAx - 1e-6;      // THE ROCK'S MARGIN OVER THE AXIS RUN: SW.clear, or as much of it as the mouth's own axis has over the axis run's least length
    const swAxL = swS.map((S) => { for (let q = 0; q <= SW.len / 2; q += SW.sta) if (swOff(S, q * swN[0], q * swN[1]) < S.wing) return q; return Infinity; });      // how far out along the mouth's own axis each of swS's margins from the keel's track ends: no line with an axis run as long as that has the margin
    const swRk = (ln) => { for (let q = 0; q <= ln.len; q += SW.sta) { swiftAt(ln, ln.len - q, swO); if (swGap(swO[0], swO[1]) < (q <= ln.run ? swNeed : SW.clear)) return false; } return true; };      // THE ROCK'S MARGIN of a level line, at its stations from the mouth outward: swNeed over its own axis run, the whole of SW.clear from the head of the axis run to the far end (see the rule above)
    // THE SEARCH, in the rule's order of bend: the axis run from its least length up in steps of SW.step, and at each
    // length A from the far end toward the mouth in steps of SW.step. [the first line that has the rock's margin: the
    // line before; for each of swS's margins from the keel's track, the first line that has the rock's margin and it].
    // The narrowest of those margins is asked for first: a line that has a wider one has every narrower one, so the
    // first line with a wider margin stands no earlier in the order. The search ends where no axis run so long can
    // have the margin asked for (swAxL).
    const swSeek = async () => { let bef = null, u = swS.length - 1, w = 0; const got = swS.map(() => null);
      for (let r = swRun; r <= SW.len / 2 && u >= 0 && (!bef || r < swAxL[u]); r += SW.step) for (let m = Math.floor(SW.len); m >= SW.step && u >= 0; m -= SW.step) { const ln = swMk(r, m); if (!ln) continue;
        if (++w % 48 === 0) await ctx.yield();
        const ves = swHas(swS[u], ln); if (bef && !ves) continue;
        if (swRk(ln)) { if (!bef) bef = ln; if (ves) { got[u] = ln; while (u > 0 && swHas(swS[u - 1], ln)) got[--u] = ln; u--; } }
        await ctx.yield(); }
      return [bef, got]; };
    // (b)'s and (d)'s measure: for a line, every level of its far end in steps of SW.fine from swReach under the
    // mouth's height to swReach over it, and whether the line with its far end at that level has lost a margin (1) or
    // has both (0). The line's point q metres from the mouth's end stands at g = swLev of the far end's change over
    // the mouth's height (the far end at the whole of it, the axis run at none). Each rock point within the rock's
    // margin of that point in plan (swNeed over the axis run, SW.clear beyond it) bars it from the heights within
    // that margin of the rock point, and each piece of the keel's track within `wing` of it in plan bars it from the
    // heights at which the stream there could touch the vessel (from `up` under the eye's track there to `dn` over
    // it); a barred height over g is a barred level. (The engine rests every 32 stations, and the measure ends as
    // soon as every level is barred.)
    const swBar = async (ln, wing, up, dn) => { const dif = new Int32Array(2 * swNL + 2), bar = new Uint8Array(2 * swNL + 1), n = Math.floor(ln.len / SW.sta), nv = Math.floor((ln.len + swFar.along) / SW.sta);
      const ban = (lo, hi, g) => { let a = 0, b = 2 * swNL; if (g < 1e-6) { if (lo > 0 || hi < 0) return; } else { a = Math.max(a, Math.ceil(lo / g / SW.fine) + swNL); b = Math.min(b, Math.floor(hi / g / SW.fine) + swNL); }
        if (a <= b) { dif[a]++; dif[b + 1]--; } };
      const all = () => { for (let j = 0, s = 0; j <= 2 * swNL; j++) { s += dif[j]; if (s <= 0) return false; } return true; };      // is every level barred by now?
      for (let i = 0; i <= nv; i++) { const g = swLev(ln, i * SW.sta); swiftAt(ln, ln.len - i * SW.sta, swO); const x = swO[0], z = swO[1]; if (x < swRb[0] || x > swRb[1] || z < swRb[2] || z > swRb[3]) continue;      // the vessel first
        for (let q = 0; q + 5 < swRt.length; q += 3) { const ax = swRt[q] - x, az = swRt[q + 2] - z, a2 = ax * ax + az * az; if (a2 > (wing + 2) * (wing + 2)) continue;
          const dx = swRt[q + 3] - swRt[q], dz = swRt[q + 5] - swRt[q + 2], l2 = dx * dx + dz * dz, qb = ax * dx + az * dz, qd = qb * qb - l2 * (a2 - wing * wing); if (l2 <= 0 || qd <= 0) continue;
          const s0 = Math.max(0, (-qb - Math.sqrt(qd)) / l2), s1 = Math.min(1, (-qb + Math.sqrt(qd)) / l2); if (s0 >= s1) continue;
          const y0 = swRt[q + 1] + (swRt[q + 4] - swRt[q + 1]) * s0, y1 = swRt[q + 1] + (swRt[q + 4] - swRt[q + 1]) * s1; ban(Math.min(y0, y1) - up, Math.max(y0, y1) + dn, g); }
        if (i % 32 === 31) { if (all()) return bar.fill(1); await ctx.yield(); } }
      let done = all();
      if (!done && swLo < 0) { swLo = SW.clear; swHi = SW.clear + swReach; await swTake(768); }
      for (let i = 0; i <= n && !done; i++) { const g = swLev(ln, i * SW.sta), need = i * SW.sta <= ln.run ? swNeed : SW.clear; swiftAt(ln, ln.len - i * SW.sta, swO); const x = swO[0], z = swO[1], kx = Math.floor(x / SW.clear) + 64, kz = Math.floor(z / SW.clear) + 64, top = swReach * g + SW.clear; let hit = false;      // then the rock, from the mouth outward, no further once every level is barred (top: rock higher or lower than that bars no level within swReach)
        for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) for (let e = Math.floor(-top / SW.clear) + 7; e <= Math.floor(top / SW.clear) + 8; e++) { const key = (kx + a) * 128 + kz + b, c = e < Math.floor(-top / SW.clear) + 8 ? swRock.get(key) : swTall.get(key * 16 + e);      // (the rock in the cells about the point: that within SW.clear of the mouth's height, then that under and over it as far as `top`)
          if (c) for (let q = 0; q < c.length; q += 3) { const dx = c[q] - x, dz = c[q + 2] - z, r2 = need * need - dx * dx - dz * dz; if (r2 > 0) { const r = Math.sqrt(r2); ban(c[q + 1] - r, c[q + 1] + r, g); hit = true; } } }
        if (hit) done = all();
        if (i % 16 === 0) await ctx.yield(); }
      if (done) return bar.fill(1);
      for (let j = 0, s = 0; j <= 2 * swNL; j++) { s += dif[j]; bar[j] = s > 0 ? 1 : 0; }
      return bar; };
    // THE VESSEL'S LEAST DISTANCE from a line (its far end h over the mouth's height): the least distance in space, over
    // the whole flight (every metre of the route: swFly), between the line's stations (on past the far end as far as
    // the flock reaches along the line) and the points of the airframe's own skin as the airframe stands there. swSk
    // holds the skin's points in the airframe's own frame, each with its
    // distance from the airframe's origin, the farthest first: where the origin stands dc from the line, only the points
    // farther from the origin than dc less the least distance found so far can undercut it. The engine rests after
    // every hundred metres of the route and every 256 points of the skin.
    let swSk = null;
    const swNigh = async (ln, h) => { const N = Math.floor((ln.len + swFar.along) / SW.sta) + 1, X = new Float64Array(N), Y = new Float64Array(N), Z = new Float64Array(N), dc = new Float64Array(swFly.length / 13);
      if (!swSk) { const a = hero.parts.skin.geometry.getAttribute('position'), sc = hero.object.scale.x, v = []; for (let q = 0; q < a.count; q++) v.push([a.getX(q), a.getY(q), a.getZ(q), Math.hypot(a.getX(q), a.getY(q), a.getZ(q)) * sc]);
        await ctx.yield(); swSk = new Float64Array(v.sort((p, q) => q[3] - p[3]).flat()); await ctx.yield(); }
      for (let i = 0; i < N; i++) { swiftAt(ln, ln.len - i * SW.sta, swO); X[i] = swO[0]; Y[i] = h * swLev(ln, i * SW.sta); Z[i] = swO[1]; }
      let best = Infinity;                                               // (first where the origin stands from the line at every metre: no skin point is farther from the line than that and the skin's reach swSk[3])
      for (let j = 0; j < dc.length; j++) { const f = j * 13; let m = Infinity; for (let i = 0; i < N; i++) { const dx = X[i] - swFly[f], dy = Y[i] - swFly[f + 1], dz = Z[i] - swFly[f + 2], d = dx * dx + dy * dy + dz * dz; if (d < m) m = d; } dc[j] = Math.sqrt(m); best = Math.min(best, dc[j] + swSk[3]); if (j % 100 === 99) await ctx.yield(); }
      await ctx.yield();
      for (const j of Array.from(dc.keys()).sort((p, q) => dc[p] - dc[q])) { if (dc[j] - swSk[3] >= best) break; const f = j * 13, near = [], lim = (best + swSk[3]) * (best + swSk[3]); let b2 = best * best;      // (the places of the flight nearest the line first, and no further once the skin cannot reach)
        for (let i = 0; i < N; i++) { const dx = X[i] - swFly[f], dy = Y[i] - swFly[f + 1], dz = Z[i] - swFly[f + 2]; if (dx * dx + dy * dy + dz * dz < lim) near.push(i); }
        for (let q = 0; q < swSk.length && swSk[q + 3] > dc[j] - best; q += 4) { const a = swSk[q], b = swSk[q + 1], c = swSk[q + 2];
          const x = swFly[f] + swFly[f + 3] * a + swFly[f + 4] * b + swFly[f + 5] * c, y = swFly[f + 1] + swFly[f + 6] * a + swFly[f + 7] * b + swFly[f + 8] * c, z = swFly[f + 2] + swFly[f + 9] * a + swFly[f + 10] * b + swFly[f + 11] * c;
          for (let e = 0; e < near.length; e++) { const i = near[e], dx = X[i] - x, dy = Y[i] - y, dz = Z[i] - z, d = dx * dx + dy * dy + dz * dz; if (d < b2) { b2 = d; best = Math.sqrt(d); } }
          if (q % 1024 === 1020) await ctx.yield(); }
        await ctx.yield(); }
      return best; };
    let [swB, swGot] = await swSeek(), swK = swGot[0], swH = 0, swIn = 0, swTk = null;      // THE LINE BEFORE: the least bend that has the rock's margin alone; swGot: for each of swS's margins the least bend that has the rock's margin and it, and of them (a), the flock as it flies
    if (!swB) { for (let m = Math.floor(SW.len); m >= SW.step; m -= SW.step) { const ln = swMk(swRun, m); if (!ln) continue; const g = swClr(ln); if (!swB || g > swB.gap) { swB = ln; swB.gap = g; } await ctx.yield(); } }      // (no line reaches that: of the least axis run's lines the one with the greatest rock clearance, the least bend among equals; on no seed of 1 to 124)
    // (b) and (d), swTilt: at each length of the axis run short of `out` (where the margin from the keel's track ends
    // on the axis itself), the least bend that has the rock's margin as a level line (swRows, found once) is tried
    // with its far end at every level (swBar) for a stream with the margin `wing` and the reach `up` and `dn`. [the
    // line, its far end's level] of the least change, of two equal changes the lower, and at it the shortest axis run;
    // null where no level within swReach has both margins.
    const swRows = [];
    const swTilt = async (wing, up, dn, out) => { const bars = [], lines = [];
      for (let r = swRun, e = 0; r <= SW.len / 2 && r < out; r += SW.step, e++) { let w = 0;
        if (swRows[e] === undefined) { swRows[e] = null; for (let m = Math.floor(SW.len); m >= SW.step; m -= SW.step) { const c = swMk(r, m); if (++w % 8 === 0) await ctx.yield(); if (c && swRk(c)) { swRows[e] = c; break; } } }
        if (swRows[e]) { lines.push(swRows[e]); bars.push(await swBar(swRows[e], wing, up, dn)); } await ctx.yield(); }
      for (let k = 1; k <= swNL; k++) for (const g of [-1, 1]) { const i = bars.findIndex((b) => !b[swNL + g * k]); if (i >= 0) return [lines[i], g * k * SW.fine]; }
      return null; };
    if (!swK) { const t = await swTilt(swWing, swUp, swDn, swAxL[0]); if (t) [swK, swH] = t; }      // (b)
    if (!swK) { const j = swGot.findIndex((c, i) => i > 0 && c); if (j > 0) { swK = swGot[j]; swIn = SW.tuck[j - 1]; } }      // (c): the widest of SW.tuck's widths that a level line has the margin for
    if (!swK) { const t = await swTilt(swS[swS.length - 1].wing, SW.near, SW.near, swAxL[swS.length - 1]); if (t) { [swK, swH] = t; swIn = SW.tuck[SW.tuck.length - 1]; } }      // (d)
    let swSkin = swK && (swIn || swH || swK !== swB) ? await swNigh(swK, swH) : Infinity;      // swSkin: the line's least distance from the airframe's skin (not asked for a line of (a) that is the line before)
    if (swK && (swH || swK !== swB) && swSkin < await swNigh(swB, 0)) swK = null;      // NO NEARER
    if (!swK) { swK = swB; swH = 0; swIn = SW.tuck[SW.tuck.length - 1]; swSkin = await swNigh(swB, 0); }      // (e)
    // THE FLOCK DRAWN IN (the lines of (c), (d), (e)). The stretch: from the first (a) to the last (b) of the line's
    // stations, counted from the mouth's end outward, that stand within swWing in plan of a piece of the keel's track
    // at whose height the flock as it flies could touch the vessel (P: the pieces of the track that are at such a
    // height for any station of the line). tube(k): how far from the centre line a bird can stand when the flock is
    // drawn inside k spreads across by k spreads up, the wobble's reach added. swIn: the widest k, in steps of
    // SW.fine from the flock's own whole width down, whose tube lies within swSkin less SW.gap.
    if (swIn) { let a = Infinity, b = -Infinity; const n = Math.floor((swK.len + swFar.along) / SW.sta), P = [];
      for (let q = 0; q + 5 < swRt.length; q += 3) if (Math.min(swRt[q + 1], swRt[q + 4]) <= Math.max(0, swH) + swUp && Math.max(swRt[q + 1], swRt[q + 4]) >= Math.min(0, swH) - swDn) P.push(q);
      for (let i = 0; i <= n; i++) { swiftAt(swK, swK.len - i * SW.sta, swO); const x = swO[0], z = swO[1], y = swH * swLev(swK, i * SW.sta); if (x < swRb[0] || x > swRb[1] || z < swRb[2] || z > swRb[3]) continue;
        for (const q of P) { if (Math.min(swRt[q + 1], swRt[q + 4]) > y + swUp || Math.max(swRt[q + 1], swRt[q + 4]) < y - swDn) continue;
          const dx = swRt[q + 3] - swRt[q], dz = swRt[q + 5] - swRt[q + 2], l2 = dx * dx + dz * dz, g = l2 > 0 ? Math.min(1, Math.max(0, ((x - swRt[q]) * dx + (z - swRt[q + 2]) * dz) / l2)) : 0;
          if (Math.hypot(swRt[q] + dx * g - x, swRt[q + 2] + dz * g - z) < swWing) { a = Math.min(a, i); b = Math.max(b, i); break; } }
        if (i % 64 === 63) await ctx.yield(); }
      const tube = (k) => { let t = 0; for (let e = 0; e <= 32; e++) t = Math.max(t, Math.hypot(k * SW.across * Math.cos(e * Math.PI / 64) + swiftWob[0], k * SW.up * Math.sin(e * Math.PI / 64) + swiftWob[1])); return t; };
      for (swIn = Math.ceil(Math.max(swFlk.reach.across / SW.across, swFlk.reach.up / SW.up, swFlk.reach.down / SW.up) / SW.fine) * SW.fine; swIn > SW.fine && tube(swIn) > swSkin - SW.gap; swIn -= SW.fine);
      if (a <= b) swTk = { from: swK.len - (b + 1) * SW.sta, to: swK.len - (a - 1) * SW.sta, ease: SW.ease, across: swIn * SW.across, up: swIn * SW.up }; }
    await ctx.yield();
    const swifts = buildSwiftlets({ base: birdBase, flock: swFlk, count: Math.round(SW.count * detail), tuck: swTk, bend: { lim: SW.inner, ease: SW.ease }, line: swiftLine(swW.x + swK.x0, swW.z + swK.z0, swW.x + swK.x1, swW.z + swK.z1, swW.x + swK.x2, swW.z + swK.z2, swW.x, swW.z, SW.rho), y: swW.y, lift: swH, dir: dawnOut ? -1 : 1,
      rate: 0.07, size: 0.76, near: 0.55, far: 420, col: col(hour === 'night' ? '#0a0f18' : '#141a1c'), rim: col(M.horizon, 0.9), time: LU.uTime, funnel: { lip: swLip, head: swK.run, free: swMo.free, deep: swMo.deep, back: swMo.back, hw: swMo.hw, hh: swMo.hh } });
    scene.add(swifts);
    const egrets = makeBirds(150, { spread: [7, 1.3, 9], loop: 0, rate: 0, size: 1.05, p: [V(raftAt[0][0], 1.6, Z0 + raftAt[0][1]), V(raftAt[0][0] + 9, 10, Z0 + raftAt[0][1] - 29), V(raftAt[0][0] - 9, 30, Z0 + raftAt[0][1] - 101)], col: col('#F4EFE2', hour === 'night' ? 0.35 : 1.25), rim: col(M.spray, 1.5) }, rng.fork('egret'));
    const kites = makeBirds(12, { spread: [60, 14, 120], loop: 1, rate: 0.012, size: 2.0, p: [V(-170, 205, Z0 + 760), V(60, 150, Z0 + 420), V(190, 215, Z0 + 120)], col: col('#7A3A1E', 0.9), rim: col('#F4EFE2') }, rng.fork('kite'));
    const U13 = 0.414, kC = path.pointAt(U13), kT = path.tangentAt(U13); kT.y = 0; kT.normalize(); const kR = V(-kT.z, 0, kT.x);      // (U13: 13 s of flight by the pace line)
    const kA = kC.clone().addScaledVector(kT, 95).addScaledVector(kR, 24).add(V(0, -30, 0)), kM = kC.clone().addScaledVector(kT, 13).addScaledVector(kR, 7).add(V(0, -4.5, 0)), kB = kC.clone().addScaledVector(kT, -55).addScaledVector(kR, 9).add(V(0, 6, 0));
    const kiteNear = makeBirds(3, { spread: [1.5, 1.0, 5], loop: 0, rate: 0, size: 1.3, near: 1, p: [kA, through(kA, kM, kB), kB], col: col('#8A4220', 1.0), rim: col('#F4EFE2', 1.2) }, rng.fork('kite1'));
    const fish = makeBirds(40, { spread: [3.5, 0.25, 16], loop: 1, rate: 0.13, size: 0.2, p: [V(22, 0.5, Z0 + 430), V(15, 2.3, Z0 + 350), V(17, 0.4, Z0 + 268)], col: col('#C8DCE4', hour === 'night' ? 0.8 : 1.9), rim: col(M.spray, 2.5) }, rng.fork('fish'));
    await ctx.yield();

    // ---- the flight's own clock. 45 -> 58 m/s down the spiral, 43 in the corridor, 35 at the flare, then the held breath
    // (24 -> 15) and a slow run-in at 12: the kiss (u 0.805) falls at about 26 s
    const pace = (u) => 1.29 + 0.42 * sstep(0.08, 0.16, u) - 0.42 * sstep(0.5, 0.6, u) - 0.25 * sstep(0.7, 0.78, u) - 0.3 * sstep(0.79, 0.84, u) - 0.25 * sstep(0.88, 0.92, u) - 0.07 * sstep(0.94, 0.97, u);
    // seconds of flight at u by that line, laid as the engine lays it (64 steps, each pace kept within 0.35 and 2.5): a second
    // S of the design is the place the flight has reached at the share S / 44 of its time, whatever the world's clock says
    const PN = 64, pS = [], pT = [0];
    for (let i = 0; i <= PN; i++) pS.push(Math.min(2.5, Math.max(0.35, pace(i / PN))));
    for (let i = 0; i < PN; i++) pT.push(pT[i] + 2 / (pS[i] + pS[i + 1]));
    const secOf = (u) => { const x = sat(u) * PN, i = Math.min(PN - 1, Math.floor(x)), f = x - i; return 44 * (pT[i] + 2 * f / (2 * pS[i] + (pS[i + 1] - pS[i]) * f)) / pT[PN]; };

    // ---- the rare event: a sister boat taking off the other way down the next channel, the water east of the lit wall. Her
    // course is her own: a straight take-off run heading +Z (we fly -Z) down the first lane east of the wall that is clear of
    // all rock by her half span and 8 m (sisX, from the feet above), from rest at a steady 2 m/s2 (a 400 m run to her unstick
    // speed of 40 m/s), then a climb of 1 in 10 at no more than 50 m/s. The design's seconds place her: she leaves the water
    // at 31 s of flight and passes the Pierced Tower's own centre line at 35 s, by then clear of a junk's masthead, with a
    // tapering white comet of spray and falling water 300 m long behind her. From our corridor the next channel shows only
    // through the gap between the Pierced Tower and the last tower of the east wall, so that is where she is seen, far off
    // to starboard of the tunnel; south of the Pierced Tower the wall hides her. She is driven by u (secOf), never by the clock.
    const SIS = { acc: 2, vOff: 40, vMax: 50, climb: 0.1, sOff: 31, sMid: 35, comet: 300, half: 28 };
    SIS.run = SIS.vOff * SIS.vOff / (2 * SIS.acc); SIS.t0 = SIS.sOff - SIS.vOff / SIS.acc; SIS.tMax = SIS.vMax / SIS.acc;
    const sisRun = (sec) => { const t = Math.max(0, sec - SIS.t0); return t < SIS.tMax ? 0.5 * SIS.acc * t * t : 0.5 * SIS.acc * SIS.tMax * SIS.tMax + SIS.vMax * (t - SIS.tMax); };   // metres run since rest
    const sisUp = (d) => { const m = Math.max(0, d - SIS.run); return SIS.climb * m * sstep(0, 60, m); };      // her keel's height after d metres (she rotates into the climb over two hull lengths)
    const sisZ0 = pierced.object.position.z - sisRun(SIS.sMid);                                                // where she lies at rest before her run
    let sister = null, plume = null, plumePos = null, sisX = 0, sisPh = 0;
    if (rare) {
      // her lane: from the east wall's outermost foot plus the margin, the first line eastward that no foot comes within the margin of, over her whole course
      const zA = sisZ0 - SIS.half, zB = sisZ0 + sisRun(44) + SIS.half;
      const laneClear = (X) => { for (const F of feet) { if (Math.abs(F.x - X) > F.max + SIS.half || F.z + F.max < zA || F.z - F.max > zB) continue;
        for (let k = 0; k < NB; k++) { const j = (k + 1) % NB, a = F.vx[k] - X, b = F.vx[j] - X; if (Math.max(F.vz[k], F.vz[j]) < zA || Math.min(F.vz[k], F.vz[j]) > zB) continue;
          if (a * b < 0 || Math.min(Math.abs(a), Math.abs(b)) < SIS.half) return false; } } return true; };
      for (const i of [2, 4, 6]) for (let k = 0; k < NB; k++) sisX = Math.max(sisX, feet[i].vx[k] + SIS.half);
      for (let i = 0; i < 200 && !laneClear(sisX); i++) sisX += 2;
      await ctx.yield();
      sister = new THREE.Group();
      for (const src of [hero.parts.skin, hero.parts.disc]) { const m = new THREE.Mesh(src.geometry, src.material); m.frustumCulled = false; m.renderOrder = src.renderOrder; sister.add(m); }
      sister.position.set(sisX, 0, sisZ0); scene.add(sister);
      const N = 44, pp = new Float32Array(N * 3), ps = [], pc = [], pr = rng.fork('plume'), c = col(M.mist, 1.05).lerp(col(M.spray), 0.25);
      for (let i = 0; i < N; i++) { const f = i / (N - 1); pp[i * 3 + 1] = -300; ps.push(9 + 15 * f, (5 + 5 * Math.sin(Math.PI * Math.min(1, f * 1.4))) * (1 - 0.5 * f), 0.3, pr()); pc.push(c.r, c.g, c.b, 0.9 * (1 - f * 0.75)); }      // (a comet: bright and narrow at her keel, thinning aft)
      sisPh = pr() * 6.2832;                                                // the phase of her rocking, from her own fork
      const pg = instGeo(new THREE.PlaneGeometry(1, 1), { aPos: [pp, 3], aSize: [ps, 4], aCol: [pc, 4] });
      plumePos = pg.getAttribute('aPos'); plumePos.setUsage(THREE.DynamicDrawUsage);
      plume = new THREE.Mesh(pg, new THREE.ShaderMaterial({ vertexShader: SPR_VERT, fragmentShader: SPR_FRAG, fog: true, transparent: true, depthWrite: false, uniforms: { ...fogU(), uTime: LU.uTime, uFade: { value: 1 }, uFlash: { value: 1 } } }));
      plume.frustumCulled = false; plume.renderOrder = 4; scene.add(plume);
    }
    const poseSister = (u, time, from) => {
      if (!sister) return;
      const d = sisRun(secOf(u)), y = sisUp(d), air = sstep(0.4, 4, y);
      sister.position.set(sisX, y + (1 - air) * Math.sin(time * 5 + sisPh) * 0.05, sisZ0 + d);
      sister.rotation.set(-0.03 - 0.12 * air, 0, Math.sin(time * 0.8 + sisPh) * 0.02, 'YXZ');
      // the comet: spray along the last of her run and the water still streaming off the hull, trailing down behind her
      const n = plumePos.count;
      for (let i = 0; i < n; i++) { const di = d - 6 - i * SIS.comet / n;
        if (di <= 0) { plumePos.setXYZ(i, sisX, -300, sisZ0); continue; }
        plumePos.setXYZ(i, sisX + Math.sin(i * 1.7) * 1.5, Math.max(2.6 + (i % 3) * 0.5, sisUp(di) * (0.92 - 0.012 * i) - 1), sisZ0 + di); }
      plumePos.needsUpdate = true;
      // a soft sprite close to the lens is a blob, so the comet thins by her range from the eye: whole beyond five widths
      // of its widest puff (24 m), a tenth within two
      plume.material.uniforms.uFade.value = lerp(0.1, 1, sstep(2 * 24, 5 * 24, sister.position.distanceTo(from)));
    };
    poseSister(0, 0, entry);
    await ctx.yield();

    // ---- f. flight, gaze, post
    const eye = new THREE.Vector3(), mouth = V(0, 9, Z0 - 2), ownF = new THREE.Vector3();
    const sentTop = sentinelP.clone(); sentTop.y = 175;
    // THE DARK MIRROR ON THE RUN-IN, by the Pierced Tower's own place and size. In front of its shaded face the water stops
    // mirroring sky and mirrors dark rock between two places past its face: as far south of the face as the tower's shade
    // reaches (its height over the sun's slope, no longer than the shadow stripe the bay lays for it, times the share of
    // the sun's bearing that lies along the corridor) and one tower-depth out from the face. The ease begins at the farther
    // of the two and is complete at the nearer (by the hour: 199 to 150 m golden, 304 to 150 dawn, 150 to 56 day, 150 to 115 moonlit)
    const slS = Math.hypot(sunDir.x, sunDir.z) || 1, shadeZ = Math.min(720, PIERCED.height / Math.max(0.2, sunDir.y / slS)) * Math.abs(sunDir.z) / slS;
    const mirFar = Z0 + Math.max(shadeZ, PIERCED.depth), mirNear = Z0 + Math.min(shadeZ, PIERCED.depth);
    const flashPh = own('lightning')() * 2.7;                           // where in its 2.7 s loop the sheet lightning stands when the world's clock starts: drawn once
    const bayLook = V(120, 0, Z0 + 760), wallLook = V(66, 40, Z0 + 600), eyeAt = V();
    return {
      scene, path, duration: 44,
      pace,                                                        // (the pace line stands above, with the clock taken from it)
      camera: { fov: 68, near: 0.3, far: 6000, lookAhead: 34, sway: 0, bank: 0.6 },
      pois: [
        { at: sentTop, from: 0, to: 0.11, weight: 0.45 },
        { at: bayLook, from: 0.05, to: 0.5, weight: 0.22 },                    // right and down over the float as the roll goes on: the bay wheels below
        // into the corridor the gaze turns some 15 degrees to starboard, onto the lit cliff 110 m ahead (caves, creepers, ledges),
        // and comes back to the axis for the flare
        { at: (time, u) => { path.pointAt(u, eyeAt); return wallLook.set(eyeAt.x + 58, Math.max(34, eyeAt.y - 22), eyeAt.z - 110); }, from: 0.44, to: 0.64, weight: 0.5 },
        { at: mouth, from: 0.54, to: 1, weight: 0.55 },
      ],
      portal: { shape: 'arch', width: 14, height: 12, color: '#BFF0E0', glow: 1, revealDistance: 420 },
      post: { exposure: M.exposure, bloom: { strength: 0.32, radius: 0.6, threshold: 0.93 },
        grade: { saturation: 1.04, contrast: 1.06, tint: '#fff6ea', shadowTint: '#06181a', vignette: 0.3, grain: 0.02, aberration: 0 } },
      ride: 'none', companion: 'none',
      update(dt, time, camera, u) {
        camera.getWorldPosition(eye);
        const { dk, s, turn, dep } = flyAt(u, time, eye), tan = flyTan;      // the airframe posed at the eye (flyAt above: heading, roll, pitch, shift)
        hero.setProgress(s);
        hero.set({ aileron: 0.18 * turn });
        hero.update(dt, time, camera);
        // seen through the previous world's portal the aircraft would be cut by the portal's plane: every mesh that rides with the
        // camera is hidden until the crossing (ctx.through is read here each frame; there is no light on the aircraft)
        const riding = !ctx.through; for (const part of hero.object.children) part.visible = riding;
        LU.uTime.value = time;
        // the last rain past the strut (hidden while the world is seen through the previous portal), drawn out along the air's
        // speed past us. It is the shower's own rain: as dense as the ceiling's cover over the eye (showerAt), and it reaches
        // down as far as the shreds hang: full at the level of their mean foot, none below the lowest foot (so it thins as the
        // spiral sinks under them). Our own mirror image under the float and the bow low down (drawn in toward the eye's foot)
        rainU.uRain.value = riding ? showerAt(eye.x, eye.z, time) * sstep(shredLo, shredMid, eye.y) * (weather === 'rain' ? 0.95 : 0.75) : 0;
        rainU.uRel.value.set(-tan.x * 46 + 1.5, -9, -tan.z * 46 + 1);
        ownF.set(0, 0, 1).applyQuaternion(hero.object.quaternion); const ownH = Math.atan2(ownF.x, ownF.z), DU = decMat.uniforms;
        DU.uOwn.value.set(hero.object.position.x - Math.sin(ownH) * 15, hero.object.position.z - Math.cos(ownH) * 15, ownH, riding ? (1 - sstep(9, 30, eye.y)) * 0.4 * (1 - 0.6 * sstep(0.5, 3, s)) * (1 - sstep(0, 12, dep)) : 0);
        DU.uOwnK.value = Math.min(1, Math.max(0.5, eye.y / Math.max(2 * eye.y - 2.4, 1)));
        if (hour === 'day') DU.uPawA.value = lerp(0.66, 0.86, 1 - sstep(8, 22, eye.y));
        egrets.material.uniforms.uLift.value = sstep(-10, 120, dk);
        kiteNear.material.uniforms.uLift.value = sat((u - (U13 - 0.1)) / 0.2);
        decMat.uniforms.uWake.value = dk - 40 + 120 * sstep(90, 190, dk);        // our wake outruns us once the hull comes off the step
        decMat.uniforms.uWakeK.value = lerp(0.75, 1, sstep(0.88, 0.93, u));       // on the run-in its froth shows a little more: a broken pale V leading to the portal's spill
        // on the run-in, under the shaded Pierced Tower, the water mirrors dark rock, not sky: a rule of place (mirFar, mirNear above)
        sea.uniforms.uReflect.value = lerp(0.5, 0.07, sstep(mirFar, mirNear, eye.z) * (1 - sstep(70, 160, Math.abs(eye.x))));
        if (wispU) wispU.uFade.value = 1 - sstep(28, 70, eye.y);
        if (floorMat) { const low = 1 - sstep(25, 110, eye.y); floorMat.uniforms.uFade.value = 1 - 0.97 * low; scene.fog.density = lerp(M.dens, 0.0011, low); }   // low in the corridor the floor is gone and the dawn haze stays thin: dark water, not a white slab
        if (weather === 'lightning') { const ph = (time + flashPh) % 2.7; glowU.uFlash.value = sstep(0, 0.1, ph) * Math.exp(-Math.max(0, ph - 0.1) / 0.3); }
        poseBoats(time, dk); poseSister(u, time, eye);
        sky.update(dt, time, camera); sea.update(dt, time, camera); fall.update(dt, time, camera);
      },
      dispose() { if (sky.dispose) sky.dispose(); },
    };
  },
};
