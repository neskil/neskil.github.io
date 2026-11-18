// THE CROWN: hero set piece of "The Iron Tide".
//
// About 1,500 spires of black magnetic fluid on a perfect hexagonal lattice 1 km across, 20 m at the
// rim and 300 m at the central needle, under the Great Lodestone: a 150 m black octahedron hanging
// point-down 60 m above the central tip. Two spiral arms wheel round with the lodestone: where an arm
// passes, a spire stretches by half, narrows to a needle and flashes teal thin-film; behind the arm it
// sinks back to a rounded dome and goes black. A cage of glittering filings streams along dipole arcs
// from the lodestone's upper point round to the central spire, and a bristling black portal frame
// hangs in the gap between the needle tip and the lodestone. Everything is doubled in the mirror sea.
// On the axis stands the field column: a shaft of teal light from the mirror up through the columns to the gap (brightest
// round the portal) and on from the lodestone's upper point into the vault; it lights the flanks turned to it (uBeam scales it).
// The plan is a real crown: central needle + 12 attendants + 35 tall attendant columns that reach the gap
// under the lodestone, a "moat" of low domes (the camera's half-turn happens there, 20-40 m from the
// columns), a tall wall of spires round it, then heights falling to the rim.
//
// LOCAL SPACE  origin = sea level under the central spire, +Y up, front = +Z (the camera arrives from
//   +Z flying toward -Z; the sky's one light is a low disc 8.5 degrees up, ahead (-Z) and 30 degrees to the side
//   away from the half-turn).
// SIZE   radius 500, height 510 (lodestone top). center = (0, 200, 0).
// COST   about 190k triangles, 11 draw calls with everything on (9 with sky:false, sea:false), no lights,
//        build well under 200 ms. All animation is in vertex/fragment shaders. Spires near the fly-through
//        line and inside r = 160 use a finer mesh; the rest are 48-triangle hex cones.
// WORLD HOOKS  hero.skyUniforms.uField (1 = spires up, 0 = melted into the mirror: the field-reversal event),
//        hero.detailMeshes (the fine spire meshes; the world hides them while the Crown is lost in haze),
//        hero.lodestone / hero.lodestoneReflection (meshes), anchors.spin.phiLane, and the shader chunks exported at the
//        end of this file so the world's sea, blooms and barges shade exactly like the Crown.
//
// opts
//   palette     [horizon, zenith, leafSeam, chrome, matteBlack, fluidBlack, teal] hex strings (brief default)
//   sky         true: draws a preview gold-leaf dome (follows the camera). PASS false IN THE WORLD.
//   sea         true: draws a preview mirror disc (radius 2600). Pass false if the world has its own sea;
//               see "MIRROR" below for what that sea must do so the flipped reflection shows.
//   fogTint     0..1, how far the hero pulls scene fog colour toward palette[0] (default 1 when sky is on,
//               0 when sky is false, so in the world the fog is exactly scene.fog).
//   portalFrame true: the bristling fluid torus (7.4 m opening radius) at anchors.portalSeat.
//   reflection  true: flipped low-detail copies of spires and lodestone below y = 0.
//   period      seconds per lodestone turn (24).
//
// anchors (local space)
//   portalSeat   { position:(0,330,0), facing: unit vector from the portal toward the arriving camera,
//                  tilt: 55 degrees (the last 75 m climb at 55 degrees, so the opening faces the whole half-turn), radius: 7 }
//   flyThrough   ordered Vector3 list: outside the rim at 25 m -> climbing over the rim (85 m) up a lane between lattice
//                rows -> level with the wall's crest at 190 m, 330 m out -> a wide banked turn-in over the wall (240 m up)
//                -> climbing half-turn round the central spire (r 104 -> 51) ->
//                75 m straight at +55 degrees into the portal seat. Spires near this line are lowered
//                at build time so every spire state (dome..needle) keeps >= 6.5 m from it.
//   rimEntry     where the fly-through crosses the rim; revealViewpoint: 300 m outside the rim at 25 m
//   lodestoneCenter, lodestoneLowerPoint, lodestoneUpperPoint, centralTip
//   lanePoint    point on the lane (r = 300) that setProgress() makes an arm cross
//   viewpoints   a few good outside views
//   lattice      { spacing, rows: 'along Z', laneX }   so sea dimples / other spikes can continue the grid
//
// PROGRESS HOOK  By default the lodestone and arms free-run on `time`. Call hero.setProgress(u) every
//   frame (u = world path progress) to drive the spin from u instead: an arm front then sweeps across
//   anchors.lanePoint exactly at u = opts.armAtU (default 0.8). hero.setSpin(radians) is the raw control;
//   hero.setProgress(null) returns to free-running. hero.spinAt reports the current angle.
//
// LIGHTING  none needed: every material is a custom shader lit by the analytic gold-leaf sky
//   (IRON_TIDE_SKY_GLSL, exported so the world's sky and sea can match the reflections exactly; uniforms
//   from hero.skyUniforms). Scene fog is honoured (pale champagne, about 900 m to 2 km visibility).
//   Wants bloom: teal film, lodestone seams, portal lip and filings are emissive 2..6.
//
// MIRROR  Reflections are real flipped geometry under the sea plane. The sea must be drawn BEFORE them
//   with depthWrite:false (renderOrder -0.5; reflections are at -0.4), so anything under y = 0 is seen
//   "through" the mirror and real geometry still occludes it by depth.
//
// STYLE (lacquer and gold leaf)  Sky = hand-laid leaf on a vault: a ceiling grid, squares about 9 degrees across
//   overhead and shrinking steeply to hundreds of small ones in the last degrees, every square a little off the
//   grid, tone in sheets, seams that come and go, glints that switch with camera position; a band of deeper bronze
//   with three thin strata at the foot (a dark horizon line); one low white-gold disc in its own bloom; three stops
//   of tone (pale leaf, full gold, deep bronze overhead) and a red-bronze side away from the light, the vault deepening overhead and away from it; every square is beaten metal
//   (a sheen from its own tilt, creases, a lip where it overlaps the next); tarnish lies in clouds across several squares; the leaf lies on bole (opts.bole), which shows in
//   the seams, in ragged worn patches that eat in from corners and seams (most high on the dome and away from the light) and deep overhead; beads of fluid carry the smear as a gold highlight. The sea is a mirror (itSeaFresnel 0.32..1) and
//   every mirror image is shaded as the thing itself seen from the mirrored eye. Fluid = glossy black: a faint sky
//   in the flanks, a sharp gold rim at the silhouette, a chrome line toward the smear, white-gold tips, and thin
//   film = teal where fresh, a little of it (turning violet) wherever the skin thins toward a tip. No shadows.
import * as THREE from 'three';

const DEFAULT_PALETTE = ['#EFE2B0', '#D9B95A', '#9A8440', '#D4D7DC', '#1B1A17', '#0A0A0C', '#2FD6C0'];
const TAU = Math.PI * 2;

// ---------------------------------------------------------------- shared GLSL
export const IRON_TIDE_SKY_GLSL = /* glsl */`
uniform vec3 uSkyHor, uSkyTop, uSkySeam, uSkySun, uSkyBole;
uniform vec2 uSkyShift;
float itHash(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
// the smooth vault: gold deepening overhead; ONE light in it (uSkySun, a low white-gold disc ahead to one side),
// the leaf brightest round it and tarnishing to red bronze and umber away from it, so every view has a bright
// side and a dark side
float itNearSun(vec3 d){ return smoothstep(-0.12, 0.95, dot(d, uSkySun)); }
vec3 itSkyBase(vec3 d, float e){
  // three stops: pale leaf low down, full gold a third of the way up, deep bronze overhead (the metal's own
  // colour multiplied by itself, so every look deepens toward its own bronze)
  vec3 deep = uSkyTop * uSkyTop * 1.2;
  vec3 col = mix(mix(uSkyHor, uSkyTop, 0.62), uSkyTop, smoothstep(0.0, 0.26, e));
  col = mix(col, deep, 0.84 * smoothstep(0.1, 0.66, e));
  float lit = itNearSun(d);
  // the side away from the light goes to bronze, the side round it is brighter and warmer
  col = mix(mix(col, deep, 0.62) * 0.56, col * 1.04, lit);
  // leaf is laid on bole: far from the light and high overhead the clay under the gold shows through
  float far = clamp(0.6 * smoothstep(0.3, 1.0, e) + 0.42 * (1.0 - lit) * smoothstep(0.03, 0.4, e), 0.0, 0.86);
  col = mix(col, uSkyBole * (0.8 + 0.5 * lit), far);
  // the vault deepens overhead and away from the light: a rule of elevation and of nearness to the light over the whole dome
  col *= 1.0 - (0.26 * smoothstep(0.2, 0.8, e) + 0.08 * smoothstep(0.03, 0.3, e)) * (1.0 - 0.8 * lit);
  return col;
}
// smooth value noise, 0..1 (four hashes)
float itVN(vec2 p){
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(itHash(i), itHash(i + vec2(1.0, 0.0)), f.x), mix(itHash(i + vec2(0.0, 1.0)), itHash(i + vec2(1.0, 1.0)), f.x), f.y);
}
// gold leaf on a vault: hand-laid squares a little off the grid, large overhead and shrinking steeply toward the
// horizon (the perspective of a ceiling: hundreds of small squares in the last degrees). Every square is BEATEN METAL,
// never one flat tone: its own tilt lays a sheen across it that moves with the eye, it is crinkled and creased, it
// overlaps its neighbour with a dark thread and a bright lip, it rubs through to the bole in ragged patches that start
// at corners and seams, and tarnish lies over it in soft clouds that cross several squares and break at the seams.
vec3 itLeaf(vec3 col, vec3 d, float e, float amt){
  vec2 uv = d.xz / (max(d.y, 0.0) + 0.2) * 7.6;
  vec2 fwv = fwidth(uv);
  float wv = max(fwv.x, fwv.y);
  vec2 c0 = floor(uv), f = fract(uv);
  float jl = (itHash(c0 + vec2(0.0, 0.37)) - 0.5) * 0.16, jr = (itHash(c0 + vec2(1.0, 0.37)) - 0.5) * 0.16;
  vec2 id = c0;
  id.x += step(1.0 + jr, f.x) - step(f.x, jl);
  float jb = (itHash(vec2(id.x, c0.y) + vec2(0.61, 0.0)) - 0.5) * 0.16, jt = (itHash(vec2(id.x, c0.y) + vec2(0.61, 1.0)) - 0.5) * 0.16;
  id.y += step(1.0 + jt, f.y) - step(f.y, jb);
  float dl = abs(f.x - jl), dr = abs(1.0 + jr - f.x), db = abs(f.y - jb), dt = abs(1.0 + jt - f.y);
  float gx = step(0.4, itHash(vec2(c0.x + step(dr, dl), c0.y) + 1.7));
  float gy = step(0.4, itHash(vec2(id.x, c0.y + step(dt, db)) + 4.3));
  float h = itHash(id);
  vec2 pu = uv / 5.0, pi = floor(pu), pf = fract(pu);
  pf = pf * pf * (3.0 - 2.0 * pf);
  float pn = mix(mix(itHash(pi + 11.3), itHash(pi + vec2(1.0, 0.0) + 11.3), pf.x),
                 mix(itHash(pi + vec2(0.0, 1.0) + 11.3), itHash(pi + vec2(1.0, 1.0) + 11.3), pf.x), pf.y);
  // what the pixel can still resolve: soft = a whole square, mid = a quarter of one, fine = a tenth
  float soft = clamp(0.3 / (wv + 1e-4), 0.0, 1.0), mid = clamp(0.11 / (wv + 1e-4), 0.0, 1.0), fine = clamp(0.04 / (wv + 1e-4), 0.0, 1.0);
  float lit = itNearSun(d);
  vec2 q = uv - id - 0.5;                       // the place inside this leaf, -0.5..0.5
  float ex = min(dl, dr), ey = min(db, dt), ed = min(ex, ey), cd = length(vec2(ex, ey));
  vec2 tilt = vec2(itHash(id + 3.1), itHash(id + 7.7)) - 0.5;      // each leaf's own slight tilt
  float ph = h * 40.0 + dot(uSkyShift, tilt) * 6.0;
  // crinkle: long buckles that run one way across each leaf (its own way), with a crease along each (a bright side
  // and a dark side), and fine beating marks; the pattern belongs to the leaf, so it breaks at every seam
  vec2 grainDir = tilt / max(length(tilt), 1e-3);
  vec2 qg = vec2(dot(q, grainDir), dot(q, vec2(-grainDir.y, grainDir.x)));
  float c1 = itVN(vec2(qg.x * 6.5, qg.y * 1.5 + 0.9 * sin(qg.x * 5.0 + h * 9.0)) + h * 37.0 + 3.0), c2 = itVN(uv * 12.3 + h * 31.0);
  float cr = c1 - 0.5;
  float crease = smoothstep(0.0, 0.035, cr) * (1.0 - smoothstep(0.035, 0.13, cr)) - 0.8 * smoothstep(0.0, 0.035, -cr) * (1.0 - smoothstep(0.035, 0.1, -cr));
  vec3 leaf = col * (1.0 + ((h - 0.5) * 0.36 + (pn - 0.5) * 0.4) * soft);
  // (sheen) one side of the square brighter than the other, by the leaf's tilt; it swings as the eye moves
  float cr2 = c2 - 0.5;
  float dimple = smoothstep(0.0, 0.05, cr2) * (1.0 - smoothstep(0.05, 0.16, cr2)) - smoothstep(0.0, 0.05, -cr2) * (1.0 - smoothstep(0.05, 0.16, -cr2));
  leaf *= 1.0 + (1.25 * dot(q, tilt) * (1.0 + 0.7 * cos(ph)) + 0.3 * cr + 0.36 * crease) * mid + (0.3 * cr2 + 0.2 * dimple) * fine;
  // tarnish lies in soft clouds that cross several squares; each leaf takes it a little differently (the cloud breaks
  // at the seams) and it gathers in the creases. Darker, a little green-blue, and it never glints. Low on the side
  // away from the light it has gone to verdigris in whole pools: the cool side of every view
  float cool = (1.0 - lit) * (1.0 - smoothstep(0.06, 0.46, e));
  vec3 verd = (vec3(0.07, 0.34, 0.31) + uSkyTop * 0.1) * (0.55 + 0.9 * h);
  leaf = mix(leaf, verd, 0.3 * cool * (1.0 - soft));
  float cloud = itVN(uv / 2.7 + 40.3) + (itHash(id + 21.7) - 0.5) * 0.34 - 0.2 * cr * mid + (0.5 - 2.0 * ed) * 0.07;
  float tThr = 0.73 - 0.13 * (1.0 - lit) - 0.5 * cool * (0.4 + 0.9 * pn);
  float tarn = smoothstep(tThr, tThr + 0.1 + 0.3 * wv, cloud) * soft;
  vec3 tcol = mix(leaf * vec3(0.4, 0.62, 0.6), verd * (0.75 + 0.5 * c2 + 0.5 * dot(q, tilt)), clamp(0.15 + 0.8 * cool, 0.0, 1.0));
  leaf = mix(leaf, tcol, tarn * (0.6 + 0.4 * itHash(id + 2.9)));
  // wear: the leaf rubs through to the bole in ragged patches that begin at the corners and seams and eat into the
  // square, more on one side of each leaf; a few squares are mostly gone, most are only nicked. More of it high on the
  // vault, away from the light and in patches
  float wearAmt = (0.02 + 0.34 * smoothstep(0.45, 0.95, e) + 0.24 * (1.0 - lit) * smoothstep(0.06, 0.4, e)) * (0.35 + 1.3 * pn);
  float hw = itHash(id + 33.3);
  float reach = mix((0.05 + 0.3 * hw * hw) * (0.7 + 1.5 * wearAmt), 0.72 + 0.6 * itHash(id + 5.5), step(1.0 - wearAmt, hw));
  vec2 wdir = vec2(itHash(id + 14.1), itHash(id + 27.3)) - 0.5;
  float rag = 0.7 * itVN(uv * 2.9 + 17.0) + 0.3 * c1 + 0.25 * (c2 - 0.5) * fine;
  float wedge = reach * (0.1 + 1.8 * rag) - min(ed * 2.8, cd * 1.4) - 0.9 * dot(q, wdir);
  float ww = 0.02 + 1.5 * wv;
  float worn = smoothstep(-ww, ww, wedge) * soft * (1.0 - 0.6 * tarn);
  // the bole has its own tone, with flecks of leaf left on it; the torn edge of the leaf lifts and catches the light
  vec3 bole = uSkyBole * (0.5 + 0.6 * h + 0.5 * (c2 - 0.5) * fine + 0.3 * cr * mid);
  bole = mix(bole, leaf, 0.55 * smoothstep(0.74, 0.8, c2) * fine);
  float torn = smoothstep(-ww, ww, wedge + 0.045) * (1.0 - smoothstep(-ww, ww, wedge)) * mid * soft;
  leaf = mix(leaf, bole, worn * 0.84) * (1.0 + 0.5 * torn * (1.0 - tarn));
  // squares of fresh leaf stand out bright against the old, most of them round the light
  float freshSq = step(0.95 - 0.07 * lit, itHash(id + 51.9)) * soft * (1.0 - tarn) * (1.0 - worn);
  leaf = mix(leaf, leaf * 1.22 + uSkyHor * 0.14, freshSq);
  // the glint: a leaf catches the light as the eye moves, in a highlight that lies where its tilt puts it
  float gl = sin(ph);
  float hot = mix(1.0, 0.3 + 1.5 * exp(-7.0 * dot(q - tilt * 0.7, q - tilt * 0.7)), mid);
  leaf *= 1.0 + mix(0.16, 0.6, step(0.9, itHash(id + 9.2))) * smoothstep(0.55, 1.0, gl) * hot * soft * (1.0 - tarn) * (1.0 - 0.8 * worn);
  // seams, where one leaf overlaps the next: a dark thread with the bole in it, a thin bright lip on the upper leaf's
  // edge and a soft shadow on the leaf beneath
  float wl = 0.012 + wv * 0.8;
  float sx = dl < dr ? f.x - jl : f.x - 1.0 - jr, sy = db < dt ? f.y - jb : f.y - 1.0 - jt;
  float seamFade = clamp(0.05 / (wv + 1e-4), 0.0, 1.0);
  float kx = mix(0.3, 1.0, gx), ky = mix(0.3, 1.0, gy);
  float lip = max(smoothstep(0.7 * wl, 1.3 * wl, sx) * (1.0 - smoothstep(2.0 * wl, 3.4 * wl, sx)) * kx,
                  smoothstep(0.7 * wl, 1.3 * wl, sy) * (1.0 - smoothstep(2.0 * wl, 3.4 * wl, sy)) * ky);
  float under = max(smoothstep(-9.0 * wl, 0.0, sx) * step(sx, 0.0) * kx, smoothstep(-9.0 * wl, 0.0, sy) * step(sy, 0.0) * ky);
  leaf *= 1.0 + (0.42 * lip * (1.0 - 0.7 * worn) - 0.2 * under) * seamFade * mid;
  float seam = max((1.0 - smoothstep(0.0, wl, ex)) * kx, (1.0 - smoothstep(0.0, wl, ey)) * ky);
  leaf = mix(leaf, mix(uSkySeam * 0.62, uSkyBole, 0.55), seam * 0.62 * seamFade);
  return mix(col, leaf, amt * smoothstep(0.004, 0.03, e));
}
// the leaf's seams and glints alone, for the lacquer of the mirror: the same squares, the same seam hairlines and the same
// glint (its phase, its one-in-ten bright squares, the place of its highlight) as itLeaf above, read without the leaf's
// tone, tarnish or wear. Returns (seam, glint), each weighed as itLeaf weighs it and faded where a pixel cannot resolve it
vec2 itLeafLines(vec3 d){
  d.y = abs(d.y); d = normalize(d);
  float e = d.y;
  vec2 uv = d.xz / (max(d.y, 0.0) + 0.2) * 7.6;
  vec2 fwv = fwidth(uv);
  float wv = max(fwv.x, fwv.y);
  vec2 c0 = floor(uv), f = fract(uv);
  float jl = (itHash(c0 + vec2(0.0, 0.37)) - 0.5) * 0.16, jr = (itHash(c0 + vec2(1.0, 0.37)) - 0.5) * 0.16;
  vec2 id = c0;
  id.x += step(1.0 + jr, f.x) - step(f.x, jl);
  float jb = (itHash(vec2(id.x, c0.y) + vec2(0.61, 0.0)) - 0.5) * 0.16, jt = (itHash(vec2(id.x, c0.y) + vec2(0.61, 1.0)) - 0.5) * 0.16;
  id.y += step(1.0 + jt, f.y) - step(f.y, jb);
  float dl = abs(f.x - jl), dr = abs(1.0 + jr - f.x), db = abs(f.y - jb), dt = abs(1.0 + jt - f.y);
  float gx = step(0.4, itHash(vec2(c0.x + step(dr, dl), c0.y) + 1.7));
  float gy = step(0.4, itHash(vec2(id.x, c0.y + step(dt, db)) + 4.3));
  float h = itHash(id);
  float soft = clamp(0.3 / (wv + 1e-4), 0.0, 1.0), mid = clamp(0.11 / (wv + 1e-4), 0.0, 1.0);
  vec2 q = uv - id - 0.5;
  float ex = min(dl, dr), ey = min(db, dt);
  vec2 tilt = vec2(itHash(id + 3.1), itHash(id + 7.7)) - 0.5;
  float ph = h * 40.0 + dot(uSkyShift, tilt) * 6.0;
  float hot = mix(1.0, 0.3 + 1.5 * exp(-7.0 * dot(q - tilt * 0.7, q - tilt * 0.7)), mid);
  float glint = mix(0.16, 0.6, step(0.9, itHash(id + 9.2))) * smoothstep(0.55, 1.0, sin(ph)) * hot * soft;
  float wl = 0.012 + wv * 0.8;
  float seamFade = clamp(0.05 / (wv + 1e-4), 0.0, 1.0);
  float kx = mix(0.3, 1.0, gx), ky = mix(0.3, 1.0, gy);
  float seam = max((1.0 - smoothstep(0.0, wl, ex)) * kx, (1.0 - smoothstep(0.0, wl, ey)) * ky) * seamFade;
  return vec2(seam, glint) * smoothstep(0.004, 0.03, e);
}
// the foot of the vault: a band of deeper bronze and tarnish in the last degrees (a dark horizon line), three thin
// strata in it, and the light itself: a low white-gold disc in its own bloom
vec3 itSkyFinish(vec3 col, vec3 d, float e){
  float sd2 = max(dot(d, uSkySun), 0.0);
  float s2 = sd2 * sd2, s4 = s2 * s2, s16 = s4 * s4 * s4 * s4, s64 = s16 * s16 * s16 * s16;
  float low = 1.0 - smoothstep(0.0, 0.085, e);
  float fb = fract(e * 60.0);
  float strata = smoothstep(0.25, 0.4, fb) * (1.0 - smoothstep(0.6, 0.75, fb)) * low;
  vec3 bronze = mix(uSkyBole, uSkyTop * uSkyTop, 0.45);
  // away from the light the foot of the vault has gone to verdigris: a cool band on the dark side of every view
  bronze = mix(bronze, vec3(0.05, 0.3, 0.29) + uSkyTop * 0.12, 0.7 * (1.0 - itNearSun(d)));
  float band = low * sqrt(low) * (1.0 - 0.8 * s64);
  col = mix(col, col * 0.2 + bronze * 0.3, band * 0.94);
  col *= 1.0 + 0.22 * strata;
  float disc = smoothstep(0.99915, 0.99945, sd2);
  col += vec3(1.0, 0.95, 0.84) * (2.8 * disc + 0.7 * s64 * s64 * s64 * s64 + 0.16 * s64 + 0.03 * s4) + vec3(1.0, 0.7, 0.3) * (0.2 * s16 + 0.05 * s2 * sd2);
  return col;
}
// detail = 1.0: leaf tiles with seams and glints (sky dome); 0.0: smooth (curved reflectors). Pass a constant.
vec3 itSky(vec3 d, float detail){
  d.y = abs(d.y); d = normalize(d);
  float e = d.y;
  vec3 col = itSkyBase(d, e);
  if (detail > 0.5) col = itLeaf(col, d, e, 1.0);
  return itSkyFinish(col, d, e);
}
// for the flat mirror: amt may vary from pixel to pixel
vec3 itSkyMirror(vec3 d, float amt){
  d.y = abs(d.y); d = normalize(d);
  float e = d.y;
  return itSkyFinish(itLeaf(itSkyBase(d, e), d, e, amt), d, e);
}
// the sea is a mirror: it gives the sky back at every angle, most of all at a glance; it is black only as
// lacquer is, in the images of dark things and on the back of a ripple
float itSeaFresnel(float nv){
  float k = 1.0 - clamp(nv, 0.0, 1.0);
  return 0.32 + 0.68 * k * k;
}
`;

const FOG_PARS = /* glsl */`
#include <fog_pars_fragment>
uniform vec4 uFogTint;
uniform float uSeaY;
float itFogAt(float d){
  #ifdef USE_FOG
    #ifdef FOG_EXP2
      return 1.0 - exp(-fogDensity * fogDensity * d * d);
    #else
      return smoothstep(fogNear, fogFar, d);
    #endif
  #else
    return 0.0;
  #endif
}
float itFog(){
  #ifdef USE_FOG
    return itFogAt(vFogDepth);
  #else
    return 0.0;
  #endif
}
// a mirror image: haze the object over the whole folded path toward what the mirror shows behind it
// (so a reflection is never crisper than its object), weight it by the mirror's fresnel over lacquer
// black, then haze the surface point itself. glow = the object's own light, which the black still returns.
vec3 itMirrorFog(vec3 body, vec3 glow, vec3 behind, vec3 lacquer, float F, float camY, float fragY){
  #ifdef USE_FOG
    // the image is hazed over its whole folded path toward the haze the mirror itself fades into, so far off the
    // image and the sea round it meet in one tone (never a pale ghost on a darker sea)
    vec3 fc = mix(fogColor, uFogTint.rgb, uFogTint.a);
    float fo = itFogAt(vFogDepth);
    vec3 seen = mix(lacquer, mix(body, behind, 0.25 * fo), F) + glow * (1.0 - fo) * max(F, 0.3);
    return mix(seen, fc, fo);
  #else
    return mix(lacquer, body, F) + glow * max(F, 0.3);
  #endif
}
vec3 itApplyFog(vec3 c){
  #ifdef USE_FOG
    return mix(c, mix(fogColor, uFogTint.rgb, uFogTint.a), itFog());
  #else
    return c;
  #endif
}
`;

// arm function shared by spires and the sea dimples: returns (sharpness, freshness)
const ARM_GLSL = /* glsl */`
uniform float uPhi, uTwist, uArms;
vec2 itArm(float theta, float rad){
  float q = (theta + uTwist * rad - uPhi) * uArms / 6.2831853;
  float tau = fract(-q);                       // 0 just after the arm front passed, 1 just before the next
  float rise = smoothstep(0.87, 1.0, tau);
  float s = max(rise, exp(-tau * 4.2));
  float fresh = max(rise * rise * rise, exp(-tau * 24.0));
  return vec2(s, fresh);
}
`;

// ---------------------------------------------------------------- spires
const SPIRE_VERT = /* glsl */`
attribute vec4 aI;   // x, z, base height, base circumradius
attribute vec4 aJ;   // seed, lock (always needle), theta * dir, radius from centre
uniform float uFlip, uPixH, uField, uSeaY, uTime;
varying vec3 vN, vW;
varying float vFresh, vT, vS, vSeed;
#include <fog_pars_vertex>
${ARM_GLSL}
float prof(float t, float s){
  float dome = 0.88 * sqrt(max(1.0 - t * t, 0.0)) + 0.12 * exp(-t * 14.0);
  float nd = 0.52 * pow(1.0 - t, 3.4) + 0.48 * (1.0 - t) * exp(-t * 10.0);
  return mix(dome, nd, s);
}
void main(){
  float t = position.y;
  float a = 0.5235988 + position.x * 6.2831853;
  vec2 arm = itArm(aJ.z, aJ.w);
  float s = mix(arm.x, 1.0, aJ.y);
  float fld = clamp(uField, 0.0, 1.3);
  float fresh = arm.y * (1.0 - 0.75 * aJ.y) * min(fld, 1.0);
  // attendant columns (lock strictly between 0 and 1) keep a tapering body even as needles; every free
  // spire breathes a little, so the lattice is never quite still
  float sat = step(0.01, aJ.y) * step(aJ.y, 0.99);
  float br = 1.0 + 0.03 * sin(uTime * (0.8 + aJ.x) + aJ.x * 40.0) * step(aJ.y, 0.005);
  float H = aI.z * mix(0.5, 1.5, s) * max(fld, 0.015) * br;
  float R0 = aI.w * smoothstep(0.0, 0.25, fld);
  float t0 = min(t, 0.985);
  float r = (prof(t, s) + sat * 0.2 * pow(max(1.0 - t, 0.0), 0.6)) * R0;
  float dr = (prof(t0 + 0.012, s) - prof(t0, s)) * R0 / 0.012 - sat * 0.12 * R0 * pow(max(1.0 - t0, 1e-3), -0.4);
  float hx = 0.8660254 / cos(mod(a + 0.5235988, 1.0471976) - 0.5235988);   // hexagon -> circle with height
  float m = mix(hx, 0.9, smoothstep(0.0, 0.22, t));
  r *= m;
  vec3 dir = vec3(sin(a), 0.0, cos(a));
  vec3 lp = vec3(aI.x, t * H, aI.y) + dir * r;
  vec3 n = normalize(vec3(dir.x * H, -dr, dir.z * H));
  lp.y *= uFlip; n.y *= uFlip;
  vec4 wp = modelMatrix * vec4(lp, 1.0);
  // keep needles at least ~0.9 px wide so they never crawl
  vec4 cp0 = projectionMatrix * viewMatrix * wp;
  float pix = cp0.w / (projectionMatrix[1][1] * uPixH * 0.5);
  float want = max(r, 0.45 * pix * step(t, 0.999) * step(0.02, fld));
  wp.xyz += mat3(modelMatrix) * dir * (want - r);
  if (fld < 0.02) wp.y = uSeaY - 3.0;           // the field has let go: nothing stands on the mirror
  vW = wp.xyz;
  vN = normalize(mat3(modelMatrix) * n);
  vFresh = fresh; vT = t; vS = s; vSeed = aJ.x;
  vec4 mvPosition = viewMatrix * wp;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}
`;

const SPIRE_FRAG = /* glsl */`
uniform vec3 uBlack, uChrome, uTeal;
uniform float uRefl, uSheen, uField, uBeam;
varying vec3 vN, vW;
varying float vFresh, vT, vS, vSeed;
${IRON_TIDE_SKY_GLSL}
${FOG_PARS}
void main(){
  vec3 Ve = normalize(cameraPosition - vW);
  vec3 col;
  {
    // a mirror image under the sea plane is shaded as the spike itself, seen from the mirrored eye: the same gold
    // rim and film, upside down
    vec3 N = normalize(vN);
    vec3 V = Ve;
    if (uRefl > 0.5) { N.y = -N.y; V.y = -V.y; }
    float nv = clamp(dot(N, V), 0.0, 1.0);
    // the mirror copies are coarse (three or four sides), so their normals sweep too far for a rim: keep the sheen only
    if (uRefl > 0.5) nv = max(nv, 0.58);
    vec3 R = reflect(-V, N);
    float k1 = 1.0 - nv, k2 = k1 * k1, k4 = k2 * k2;
// liquid: the whole flank gives the sky back a little, the silhouette edge gives it back whole (a sharp gold rim)
    // a dome is a bead of liquid: its crown gives the leaf back, squares and all; a needle stays lacquer with a rim
    float bead = (1.0 - vS) * smoothstep(-0.1, 0.55, N.y);
    float fr = min(0.07 + 0.15 * bead + 0.25 * k2 + 0.68 * k4 * k1, 1.0);
    vec3 sky = itSky(R, 1.0);
    // black lacquer gives the leaf back as gold, never as white
    sky = min(sky, vec3(1.15)) * mix(vec3(1.0), uSkyTop * 1.35, 0.6);
    // low on a spire a sideways reflection sees the neighbours, not the sky
    float open = mix(mix(0.3, 1.0, smoothstep(0.0, 0.7, vT)), 1.0, smoothstep(0.15, 0.75, R.y));
    open *= mix(1.0, 0.45, smoothstep(0.0, -0.3, R.y));
    col = uBlack * 0.55 + sky * (fr + uSheen * k2 * 0.2) * open;
    // the skirt is the mirror it melts into: over the lowest eighth of its height a spike (dome or needle, bloom or Crown)
    // gives the vault back as the sea does, by the mirror's own fresnel on the mirror's own lacquer, with no neighbours'
    // shade; from an eighth to a quarter of its height that eases to the body's own black above. By the spike's height only
    float skirt = 1.0 - smoothstep(0.125, 0.25, vT);
    float Fs = itSeaFresnel(nv);
    col = mix(col, uBlack * 0.6 * (1.0 - Fs) + sky * Fs, skirt);
    col += (uSkyTop * 1.1 + uSkyHor * 0.45) * k4 * k4 * k2 * open * (0.35 + 0.6 * smoothstep(0.06, 0.4, vT));
    // the smear of light stands on every bead as one hot gold highlight, with a wide warm sheen round it
    float sg = max(dot(R, uSkySun), 0.0), sg2 = sg * sg, sg8 = sg2 * sg2 * sg2 * sg2;
    col += (uSkyHor * 1.25 + uChrome * 0.35) * (sg8 * sg8 * sg8 * 1.7 + sg8 * 0.1) * (0.2 + 0.8 * bead) * mix(0.5, 1.0, open);
    // chrome line down the lit edge: an anisotropic highlight that only cares about the normal's azimuth
    float w = clamp(length(fwidth(N)) * 5.0, 0.0, 1.0);
    vec3 Hh = normalize(V + uSkySun);
    float az = max(dot(normalize(N.xz + 1e-5), normalize(Hh.xz + 1e-5)), 0.0);
    float sp = pow(az, mix(700.0, 60.0, w)) * mix(1.0, 0.16, w) * smoothstep(0.02, 0.2, vT) * (1.0 - 0.6 * smoothstep(0.75, 1.0, N.y));
    col += (uChrome * 0.7 + uSkyHor * 0.6) * sp * 1.9 * mix(0.45, 1.0, open);
    // thin film: teal where the fluid is fresh, and wherever the skin thins toward a needle's tip a little of it
    // stays, turning violet as the film gets thinner still
    // every spike wears a little film: a cool rim inside the gold one, so a spike is a lit body and never a cut-out
    float thin = max(vFresh, 0.2 + 0.3 * vS * smoothstep(0.2, 0.95, vT));
    float film = pow(1.0 - nv, mix(1.9, 2.3, vFresh)) * thin;
    float irid = 0.85 + 0.15 * sin(vT * 30.0 + vSeed * 6.0);
    vec3 violet = vec3(0.5, 0.22, 1.0) * dot(uTeal, vec3(0.45, 0.45, 0.45));
    float vio = 0.42 * smoothstep(0.1, 0.9, 0.5 + 0.5 * sin(vT * 7.0 + nv * 5.0 + vSeed * 19.0)) * (1.0 - 0.5 * vFresh);
    col += mix(uTeal, violet, vio) * (film * 3.0 * irid + vFresh * 0.08);
    col += (uChrome * 0.5 + uSkyHor * 0.9) * smoothstep(0.92, 1.0, vT) * vS * vS * vS * 1.1;      // needle tips: white-gold glints
    // the field column at the Crown's axis lights every flank that is turned to it, cool against the gold
    float rAx = length(vW.xz);
    vec2 toAx = -vW.xz / max(rAx, 1.0);
    float ax = max(dot(N.xz, toAx), 0.0);
    col += uTeal * (ax * ax + 0.4 * k2) * (0.5 * exp(-rAx / 150.0) + 0.16 * exp(-rAx / 520.0)) * clamp(uField, 0.0, 1.0) * uBeam;
  }
  if (uRefl > 0.5) {
    float F = itSeaFresnel(abs(Ve.y));
    vec3 behind = itSky(vec3(Ve.x, abs(Ve.y), Ve.z) * -1.0, 0.0);
    gl_FragColor = vec4(itMirrorFog(col * 0.74, uTeal * vFresh * (0.2 + 0.5 * vT), behind, uBlack * 0.6, F, cameraPosition.y, vW.y), 1.0);
    return;
  }
  gl_FragColor = vec4(itApplyFog(col), 1.0);
}
`;

function spireGeometry(radial, ts, inst) {
  const g = new THREE.InstancedBufferGeometry();
  const pos = [], idx = [];
  const rows = ts.length;
  for (let j = 0; j < rows; j++) for (let i = 0; i < radial; i++) pos.push(i / radial, ts[j], 0);
  for (let j = 0; j < rows - 1; j++) for (let i = 0; i < radial; i++) {
    const a = j * radial + i, b = j * radial + (i + 1) % radial, c = a + radial, d = b + radial;
    if (j === rows - 2) idx.push(a, b, c);          // collapsed tip ring: one triangle per side
    else idx.push(a, b, c, b, d, c);
  }
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  const n = inst.length;
  const aI = new Float32Array(n * 4), aJ = new Float32Array(n * 4);
  for (let k = 0; k < n; k++) {
    const s = inst[k];
    aI.set([s.x, s.z, s.h, s.R0], k * 4);
    aJ.set([s.seed, s.lock, s.theta, s.rad], k * 4);
  }
  g.setAttribute('aI', new THREE.InstancedBufferAttribute(aI, 4));
  g.setAttribute('aJ', new THREE.InstancedBufferAttribute(aJ, 4));
  g.instanceCount = n;
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), 700);
  return g;
}

// envelope radius of a spire at altitude y for sharpness s (mirrors prof() in the shader)
function spireRadiusAt(h, R0, y, s, sat) {
  const H = h * (0.5 + s) * (sat ? 1 : 1.03);
  if (sat && y < H) return ((0.88 * Math.sqrt(Math.max(1 - (y / H) * (y / H), 0)) + 0.12 * Math.exp(-(y / H) * 14)) * (1 - s)
    + (0.52 * Math.pow(1 - y / H, 3.4) + 0.48 * (1 - y / H) * Math.exp(-(y / H) * 10)) * s + 0.2 * Math.pow(1 - y / H, 0.6)) * R0;
  if (y >= H) return 0;
  const t = Math.max(0, y / H);
  const dome = 0.88 * Math.sqrt(Math.max(1 - t * t, 0)) + 0.12 * Math.exp(-t * 14);
  const nd = 0.52 * Math.pow(1 - t, 3.4) + 0.48 * (1 - t) * Math.exp(-t * 10);
  return (dome + (nd - dome) * s) * R0;
}

// ---------------------------------------------------------------- lodestone + portal frame material
const SOLID_VERT = /* glsl */`
attribute float aGlow;
attribute float aTone;     // 0 matte magnetite .. 1 mirror fluid / polished chamfer
attribute vec4 aSw;        // sway direction * weight, phase
uniform float uTime;
varying vec3 vN, vW, vO;
varying float vGlow, vTone;
#include <fog_pars_vertex>
void main(){
  vec3 p = position + aSw.xyz * sin(uTime * 1.7 + aSw.w);
  vO = position;
  vec4 wp = modelMatrix * vec4(p, 1.0);
  vW = wp.xyz;
  vN = normalize(mat3(modelMatrix) * normal);
  vGlow = aGlow; vTone = aTone;
  vec4 mvPosition = viewMatrix * wp;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}
`;

const SOLID_FRAG = /* glsl */`
uniform vec3 uBlack, uMatte, uChrome, uTeal;
uniform float uRefl, uTime, uGrain, uGlowAmp, uBounce;
varying vec3 vN, vW, vO;
varying float vGlow, vTone;
${IRON_TIDE_SKY_GLSL}
${FOG_PARS}
float h3(vec3 p){ p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float vnoise(vec3 x){
  vec3 i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(h3(i), h3(i + vec3(1,0,0)), f.x), mix(h3(i + vec3(0,1,0)), h3(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(h3(i + vec3(0,0,1)), h3(i + vec3(1,0,1)), f.x), mix(h3(i + vec3(0,1,1)), h3(i + vec3(1,1,1)), f.x), f.y), f.z);
}
void main(){
  vec3 Ve = normalize(cameraPosition - vW);
  float pulse = 0.75 + 0.25 * sin(uTime * 1.3 + vO.y * 0.05);
  vec3 glow = uTeal * vGlow * uGlowAmp * pulse;
  vec3 col;
  {
    // a mirror image is shaded as the thing itself, seen from the mirrored eye
    vec3 N = normalize(vN);
    vec3 V = Ve;
    if (uRefl > 0.5) { N.y = -N.y; V.y = -V.y; }
    if (dot(N, V) < 0.0) N = -N;
    float nv = clamp(dot(N, V), 0.0, 1.0);
    vec3 R = reflect(-V, N);
    vec3 sky = itSky(R, 0.0) * mix(1.0, 0.45, smoothstep(0.0, -0.3, R.y));
    float n = vnoise(vO * uGrain) * 0.6 + vnoise(vO * uGrain * 3.7) * 0.4;
    float strata = 0.5 + 0.5 * sin(dot(vO, vec3(0.31, 0.83, 0.2)) * uGrain * 2.2 + n * 5.0);
    // matte magnetite: dome light on a rough dark stone, a weak blurred sheen that the grain breaks up
    float hemi = 0.35 + 0.65 * (N.y * 0.5 + 0.5);
    vec3 matte = uMatte * (0.5 + 0.9 * n) * hemi * uSkyHor * 1.6;
    matte += sky * (0.012 + 0.45 * pow(1.0 - nv, 3.5)) * (0.2 + 0.6 * strata * n);
    // the mirror sea throws the leaf's gold back up: a face that looks down is lit from below, warm, the grain and
    // strata of the stone showing in it (so the underside of a slab is a lit hull, never a flat black shape)
    float dn = clamp(0.45 - 0.55 * N.y, 0.0, 1.0);
    matte += (uSkyTop * 0.75 + uSkyHor * 0.25) * uSkyTop * dn * (0.35 + 0.65 * dn) * (0.3 + 0.9 * n) * (0.55 + 0.45 * strata) * uBounce;
    // mirror fluid / polished edge
    vec3 mir = uBlack * 0.55 + sky * (0.05 + 0.95 * pow(1.0 - nv, 3.4)) * 0.9;
    mir += uChrome * pow(max(dot(R, uSkySun), 0.0), 40.0) * 2.0;
    col = mix(matte, mir, vTone);
    // aTone 2 is chrome (a tether's wound strand, the portal ring's rim): polished metal, chrome white on the black it is
    // laid on, lit on the side turned to the one light and giving the vault back; aTone 0..1 is untouched by this line
    col = mix(col, uChrome * (0.5 + 0.5 * max(dot(N, uSkySun), 0.0)) + sky * 0.5, clamp(vTone - 1.0, 0.0, 1.0));
  }
  if (uRefl > 0.5) {
    float F = itSeaFresnel(abs(Ve.y));
    vec3 behind = itSky(vec3(Ve.x, abs(Ve.y), Ve.z) * -1.0, 0.0);
    gl_FragColor = vec4(itMirrorFog(col * 0.76, glow * 0.8, behind, uBlack * 0.6, F, cameraPosition.y, vW.y), 1.0);
    return;
  }
  gl_FragColor = vec4(itApplyFog(col + glow), 1.0);
}
`;

// Great Lodestone: a chamfered octahedron whose faces are cut into stepped triangular terraces with
// teal-lit risers. half = half-extent in X/Z, halfY = half-extent in Y.
function lodestoneGeometry(rng, half, halfY) {
  const P = [], G = [], T = [];
  const v = (x, y, z) => new THREE.Vector3(x, y, z);
  const ab = v(), ac = v(), nn = v(), cc = v();
  const tri = (p, q, r, glow, tone) => {
    ab.subVectors(q, p); ac.subVectors(r, p); nn.crossVectors(ab, ac);
    cc.copy(p).add(q).add(r);
    if (nn.dot(cc) < 0) { const t = q; q = r; r = t; }
    P.push(p.x, p.y, p.z, q.x, q.y, q.z, r.x, r.y, r.z);
    G.push(glow, glow, glow); T.push(tone, tone, tone);
  };
  const quad = (p, q, r, s, glow, tone) => { tri(p, q, r, glow, tone); tri(p, r, s, glow, tone); };
  // terrace profile: inset fraction f (0 = face edge, 1 = centroid), offset d along the face normal
  const sc = half / 75;
  const steps = rng.int(2, 3);
  const levels = [{ f: 0.06, d: 0 }];
  let f = 0.15 + rng.range(0, 0.04), d = 0;
  for (let i = 0; i < steps; i++) {
    levels.push({ f, d });
    const nd = (i % 2 === 0 ? -1 : 1) * rng.range(2.2, 3.6) * sc + (i % 2 === 0 ? 0 : d);
    levels.push({ f: f + 0.012, d: nd, riser: true });
    d = nd; f += rng.range(0.2, 0.27);
  }
  levels.push({ f: Math.min(f, 0.86), d });
  const apexD = d + rng.range(3, 7) * sc;             // a low pyramid boss at each face centre
  const faces = {};
  for (const sx of [1, -1]) for (const sy of [1, -1]) for (const sz of [1, -1]) {
    const V = [v(sx * half, 0, 0), v(0, sy * halfY, 0), v(0, 0, sz * half)];
    const cen = v().add(V[0]).add(V[1]).add(V[2]).multiplyScalar(1 / 3);
    const nrm = v().crossVectors(v().subVectors(V[1], V[0]), v().subVectors(V[2], V[0])).normalize();
    if (nrm.dot(cen) < 0) nrm.negate();
    const ring = (L) => V.map((q) => q.clone().lerp(cen, L.f).addScaledVector(nrm, L.d));
    let prev = ring(levels[0]);
    faces[`${sx},${sy},${sz}`] = prev;
    for (let i = 1; i < levels.length; i++) {
      const cur = ring(levels[i]);
      const glow = levels[i].riser ? 1 : 0, tone = levels[i].riser ? 0.2 : (i % 4 === 1 ? 0.0 : 0.12);
      for (let k = 0; k < 3; k++) quad(prev[k], prev[(k + 1) % 3], cur[(k + 1) % 3], cur[k], glow, tone);
      prev = cur;
    }
    const apex = cen.clone().addScaledVector(nrm, apexD);
    for (let k = 0; k < 3; k++) tri(prev[k], prev[(k + 1) % 3], apex, 0, 0.35);
  }
  const key = (s) => `${s[0]},${s[1]},${s[2]}`;
  // chamfers along the 12 edges (polished)
  for (let i = 0; i < 3; i++) for (let j = i + 1; j < 3; j++) {
    const k = 3 - i - j;
    for (const si of [1, -1]) for (const sj of [1, -1]) {
      const s1 = [0, 0, 0], s2 = [0, 0, 0];
      s1[i] = s2[i] = si; s1[j] = s2[j] = sj; s1[k] = 1; s2[k] = -1;
      const f1 = faces[key(s1)], f2 = faces[key(s2)];
      quad(f1[i], f1[j], f2[j], f2[i], 0, 0.9);
    }
  }
  // caps at the 6 points; the two poles glow faintly (that is where the filings leave and arrive)
  for (let i = 0; i < 3; i++) {
    const j = (i + 1) % 3, k = (i + 2) % 3;
    for (const si of [1, -1]) {
      const c = [[1, 1], [1, -1], [-1, -1], [-1, 1]].map(([a, b]) => { const s = [0, 0, 0]; s[i] = si; s[j] = a; s[k] = b; return faces[key(s)][i]; });
      const tip = v(); tip.setComponent(i, si * (i === 1 ? halfY : half) * 0.985);
      for (let q = 0; q < 4; q++) tri(c[q], c[(q + 1) % 4], tip, i === 1 ? 0.7 : 0.0, 0.9);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
  g.setAttribute('aGlow', new THREE.Float32BufferAttribute(G, 1));
  g.setAttribute('aTone', new THREE.Float32BufferAttribute(T, 1));
  g.setAttribute('aSw', new THREE.Float32BufferAttribute(new Float32Array(P.length / 3 * 4), 4));
  g.computeVertexNormals();
  return g;
}

// Portal frame: a torus of black fluid in the local XY plane (opening faces +Z), bristling outward with
// small combed spikes, a teal inner lip. Opening radius about 7.4 m.
async function portalFrameGeometry(rng, pause) {
  const P = [], G = [], T = [], S = [], I = [];
  const push = (p, glow, tone, sw) => { P.push(p.x, p.y, p.z); G.push(glow); T.push(tone); S.push(sw[0], sw[1], sw[2], sw[3]); return P.length / 3 - 1; };
  const none = [0, 0, 0, 0];
  const torus = (R, r, segs, sides, glow, tone, squash) => {
    const base = P.length / 3;
    for (let i = 0; i < segs; i++) for (let j = 0; j < sides; j++) {
      const a = (i / segs) * TAU, b = (j / sides) * TAU;
      const rr = R + Math.cos(b) * r;
      push(new THREE.Vector3(Math.cos(a) * rr, Math.sin(a) * rr, Math.sin(b) * r * squash), glow, tone, none);
    }
    for (let i = 0; i < segs; i++) for (let j = 0; j < sides; j++) {
      const a = base + i * sides + j, b = base + ((i + 1) % segs) * sides + j;
      const c = base + i * sides + (j + 1) % sides, d = base + ((i + 1) % segs) * sides + (j + 1) % sides;
      I.push(a, b, c, c, b, d);
    }
  };
  const RM = 8.1, RT = 0.62;
  torus(RM, RT, 72, 10, 0, 1, 1.25);
  await pause();
  // teal inner lip, 0.6 m wide as the arriving eye sees it: the inner face of the black tube itself is lit, a shell
  // 0.08 m proud of it from the tube's innermost line (7.4 m from the centre) out to 8.0 m, on the front and on the back
  {
    const RL = RT + 0.08, bMax = Math.acos(1 - 0.6 / RL), NB = 6, base = P.length / 3;
    for (let i = 0; i < 72; i++) for (let j = 0; j <= NB; j++) {
      const a = (i / 72) * TAU, b = Math.PI + bMax * (2 * j / NB - 1);
      const rr = RM + Math.cos(b) * RL;
      push(new THREE.Vector3(Math.cos(a) * rr, Math.sin(a) * rr, Math.sin(b) * RL * 1.25), 1, 1, none);
    }
    for (let i = 0; i < 72; i++) for (let j = 0; j < NB; j++) {
      const a = base + i * (NB + 1) + j, b = base + ((i + 1) % 72) * (NB + 1) + j;
      I.push(a, b, a + 1, a + 1, b, b + 1);
    }
  }
  await pause();
  const comb = rng.sign();
  const n = 150, e1 = new THREE.Vector3(), e2 = new THREE.Vector3(), dir = new THREE.Vector3(), q = new THREE.Vector3();
  for (let s = 0; s < n; s++) {
    if ((s & 31) === 31) await pause();
    const a = ((s + rng.range(-0.35, 0.35)) / n) * TAU;
    const b = rng.gauss() * 0.75;                           // around the tube, 0 = straight outward
    const cb = Math.cos(b), sb = Math.sin(b);
    const rad = new THREE.Vector3(Math.cos(a), Math.sin(a), 0), tan = new THREE.Vector3(-Math.sin(a), Math.cos(a), 0);
    const out = new THREE.Vector3(rad.x * cb, rad.y * cb, sb);
    const base = rad.clone().multiplyScalar(RM).add(new THREE.Vector3(out.x * RT * 0.8, out.y * RT * 0.8, out.z * RT));
    const L = (0.5 + 2.4 * Math.pow(rng(), 1.6)) * (0.45 + 0.55 * Math.max(0, cb));
    const br = 0.22 + 0.1 * rng() + L * 0.05;
    dir.copy(out).addScaledVector(tan, comb * 0.45).normalize();
    e1.crossVectors(dir, new THREE.Vector3(0, 0, 1)).normalize(); e2.crossVectors(dir, e1);
    const ph = rng() * TAU, sides = 5, rings = [[0, 1], [0.16, 0.42], [0.5, 0.14], [1, 0]];
    const b0 = P.length / 3;
    for (let k = 0; k < rings.length; k++) for (let j = 0; j < sides; j++) {
      const an = (j / sides) * TAU, t = rings[k][0], r = rings[k][1] * br;
      q.copy(base).addScaledVector(dir, t * L).addScaledVector(tan, comb * 0.25 * L * t * t)
        .addScaledVector(e1, Math.cos(an) * r).addScaledVector(e2, Math.sin(an) * r);
      const w = 0.07 * L * t * t;
      push(q, 0, 1, [tan.x * w, tan.y * w, 0, ph]);
    }
    for (let k = 0; k < rings.length - 1; k++) for (let j = 0; j < sides; j++) {
      const A = b0 + k * sides + j, B = b0 + k * sides + (j + 1) % sides, C = A + sides, D = B + sides;
      if (k === rings.length - 2) I.push(A, B, C); else I.push(A, B, C, C, B, D);
    }
  }
  // chrome rim: a clean line of polished metal 0.25 m wide round the ring's outer crest (8.72 m from the centre), a fifth
  // of the black tube's thickness; the bristles stand out through it (aTone 2 = chrome, see SOLID_FRAG)
  torus(RM + RT, 0.125, 72, 4, 0, 2, 1);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
  g.setAttribute('aGlow', new THREE.Float32BufferAttribute(G, 1));
  g.setAttribute('aTone', new THREE.Float32BufferAttribute(T, 1));
  g.setAttribute('aSw', new THREE.Float32BufferAttribute(S, 4));
  g.setIndex(I);
  await pause();
  g.computeVertexNormals();
  return g;
}

// ---------------------------------------------------------------- filings (dipole cage)
const ARC_GLSL = /* glsl */`
uniform float uPhiC, uTopY;
// A = (azimuth, width, end height on the central spire, skew); u = 0 at the lodestone's upper point
vec3 itArc(float u, vec4 A){
  float th = u * 3.14159265;
  float sn = max(sin(th), 0.0);
  float y = mix(uTopY, A.z, 0.5 - 0.5 * cos(th));
  float rho = A.y * pow(sn, 1.25) * (1.0 + A.w * cos(th));
  float az = A.x + uPhiC;
  return vec3(sin(az) * rho, y, cos(az) * rho);
}
`;

const FILING_VERT = /* glsl */`
attribute vec4 aA;
attribute vec4 aB;   // phase, speed, size, seed
uniform float uTime, uPixH;
varying vec2 vUv;
varying float vI, vSeed;
#include <fog_pars_vertex>
${ARC_GLSL}
void main(){
  float u = fract(aB.x + uTime * aB.y);
  vec3 p = itArc(u, aA);
  float sd = aB.w;
  vec3 j = vec3(sin(sd * 91.7 + uTime * 0.6), sin(sd * 57.3 + uTime * 0.45), cos(sd * 33.1 + uTime * 0.5));
  p += j * (1.5 + 5.0 * fract(sd * 7.31)) * sin(u * 3.14159);
  vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
  float pix = -mvPosition.z / (projectionMatrix[1][1] * uPixH * 0.5);
  float size = max(aB.z, 1.25 * pix);
  float dim = clamp((aB.z * aB.z) / (size * size), 0.2, 1.0);
  mvPosition.xy += position.xy * size;
  vUv = position.xy;
  float tw = pow(0.5 + 0.5 * sin(uTime * (5.0 + 9.0 * fract(sd * 3.7)) + sd * 100.0), 5.0);
  vI = (0.35 + 3.2 * tw) * dim * smoothstep(0.0, 0.07, u) * smoothstep(1.0, 0.95, u);
  vSeed = sd;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}
`;

const FILING_FRAG = /* glsl */`
uniform vec3 uChrome, uGold, uTeal;
varying vec2 vUv;
varying float vI, vSeed;
${FOG_PARS}
void main(){
  float d2 = dot(vUv, vUv);
  float core = exp(-d2 * 7.0);
  float star = exp(-abs(vUv.x) * 9.0) * exp(-abs(vUv.y) * 2.2) + exp(-abs(vUv.y) * 9.0) * exp(-abs(vUv.x) * 2.2);
  float a = (core + star * 0.55) * (1.0 - smoothstep(0.7, 1.0, d2));
  vec3 c = mix(uChrome, uGold, fract(vSeed * 13.7));
  c = mix(c, uTeal * 1.3, step(0.88, fract(vSeed * 5.3)));
  gl_FragColor = vec4(c * a * vI * 2.6 * (1.0 - itFog()), 1.0);
}
`;

const RIBBON_VERT = /* glsl */`
attribute vec4 aA;
attribute vec3 aU;   // u along the arc, side (-1 / +1), seed
uniform float uPixH;
varying float vU, vSide, vSeed;
#include <fog_pars_vertex>
${ARC_GLSL}
void main(){
  vec3 p = itArc(aU.x, aA), p2 = itArc(aU.x + 0.012, aA);
  vec4 wp = modelMatrix * vec4(p, 1.0);
  vec3 tg = normalize(mat3(modelMatrix) * (p2 - p));
  vec3 vd = normalize(cameraPosition - wp.xyz);
  vec3 sdir = normalize(cross(tg, vd));
  vec4 cp0 = projectionMatrix * viewMatrix * wp;
  float pix = cp0.w / (projectionMatrix[1][1] * uPixH * 0.5);
  wp.xyz += sdir * aU.y * max(0.7, 1.15 * pix);
  vU = aU.x; vSide = aU.y; vSeed = aU.z;
  vec4 mvPosition = viewMatrix * wp;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}
`;

const RIBBON_FRAG = /* glsl */`
uniform vec3 uBlack;
uniform float uTime;
varying float vU, vSide, vSeed;
${FOG_PARS}
void main(){
  float dash = 0.5 + 0.5 * sin(vU * 150.0 - uTime * (5.0 + 3.0 * vSeed) + vSeed * 40.0);
  float a = (0.34 + 0.5 * dash) * (1.0 - vSide * vSide * 0.5) * smoothstep(0.0, 0.05, vU) * smoothstep(1.0, 0.93, vU);
  gl_FragColor = vec4(uBlack, a * (1.0 - itFog()));
}
`;

// ---------------------------------------------------------------- the field column
// A shaft of the field's own light on the Crown's axis: from the mirror up through the columns to the gap under the
// Great Lodestone (where it is brightest, round the portal), and on from the lodestone's upper point into the vault.
// One quad strip turned to the eye about the axis; additive, depth-tested, so the columns in front stand dark on it.
const BEAM_VERT = /* glsl */`
uniform float uFlip, uTopY, uGapY;
varying vec2 vB;      // across (-1..1), height in metres
varying float vK, vAb;
#include <fog_pars_vertex>
void main(){
  float y = position.y;
  vec3 c = (modelMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
  vec2 toCam = cameraPosition.xz - c.xz;
  float dxz = length(toCam);
  vec2 f = toCam / max(dxz, 1e-3);
  float above = step(uTopY - 1.0, y);
  float W = mix(mix(170.0, 96.0, smoothstep(0.0, uGapY, y)), 34.0 + (y - uTopY) * 0.02, above);
  vAb = above;
  vec3 wp = c + vec3(-f.y * position.x * W, y * uFlip, f.x * position.x * W);
  vB = vec2(position.x, y);
  // flying up the axis into the portal the strip would turn edge-on and flare: it thins out as the eye comes to the axis
  vK = smoothstep(15.0, 130.0, dxz) * mix(0.5, 1.0, smoothstep(130.0, 520.0, dxz));
  vec4 mvPosition = viewMatrix * vec4(wp, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}
`;
const BEAM_FRAG = /* glsl */`
uniform vec3 uTeal, uChrome;
uniform float uTime, uTopY, uGapY, uField, uBeam, uFlip;
varying vec2 vB;
varying float vK, vAb;
${FOG_PARS}
void main(){
  float x = vB.x, y = vB.y;
  float x2 = x * x;
  float sh = mix(3.2, 1.0, vAb);      // the strip is wide below the lodestone (a glow among the columns), narrow above it
  float core = exp(-x2 * 90.0 * sh * sh), mid = exp(-x2 * 14.0 * sh * sh), halo = exp(-x2 * 3.2) * (1.0 - x2) * (1.0 - x2);
  // filings ride up the shaft: bright threads that climb, never a flat bar of light
  float th = 0.5 + 0.5 * sin(x * 37.0 + sin(y * 0.021 + x * 5.0) * 2.2);
  float run = 0.5 + 0.5 * sin(y * 0.11 - uTime * 2.6 + th * 4.0 + x * 9.0);
  float flow = 0.62 + 0.38 * th * run + 0.25 * run * run * run * core;
  float gap = exp(-(y - uGapY - 30.0) * (y - uGapY - 30.0) / 2400.0);
  float low = smoothstep(-40.0, 120.0, y) * (0.55 + 0.45 * smoothstep(40.0, uGapY, y));
  float up = step(uTopY, y) * exp(-(y - uTopY) / 620.0);
  float body = mix(low, 0.85 * up + 0.3 * step(uTopY, y) * exp(-(y - uTopY) / 90.0), step(uTopY - 1.0, y));
  float I = (core * 1.25 + mid * 0.55 + halo * 0.34) * flow * body + gap * (mid * 0.7 + halo * 0.5 + core * 0.4);
  vec3 col = (uTeal * vec3(0.7, 1.0, 1.0) + uChrome * 0.22 * core) * I;
  float fo = itFogAt(vFogDepth * 0.55);
  float refl = uFlip < 0.0 ? 0.55 : 1.0;
  gl_FragColor = vec4(col * (1.0 - fo) * vK * refl * clamp(uField, 0.0, 1.0) * uBeam, 1.0);
}
`;

// ---------------------------------------------------------------- preview sea + sky
const SEA_VERT = /* glsl */`
varying vec3 vW, vL;
#include <fog_pars_vertex>
void main(){
  vL = position;
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vW = wp.xyz;
  vec4 mvPosition = viewMatrix * wp;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}
`;

const SEA_FRAG = /* glsl */`
uniform vec3 uBlack;
uniform float uRim, uLatK, uDir;
varying vec3 vW, vL;
${IRON_TIDE_SKY_GLSL}
${ARM_GLSL}
${FOG_PARS}
void main(){
  vec3 V = normalize(cameraPosition - vW);
  vec2 p = vL.xz;
  float r = length(p);
  // the lattice continues past the rim as hexagonal dimples where the field is weak but not zero;
  // the spiral arms run out onto the mirror as a swell in the dimples
  float mask = 1.0 - smoothstep(uRim - 20.0, uRim + 190.0, r);
  vec2 g = vec2(0.0);
  if (mask > 0.001) {
    vec2 arm = itArm(atan(p.x, p.y) * uDir, r);
    vec2 k1 = vec2(1.0, 0.0) * uLatK, k2 = vec2(0.5, 0.8660254) * uLatK, k3 = vec2(-0.5, 0.8660254) * uLatK;
    g = -(k1 * sin(dot(k1, p)) + k2 * sin(dot(k2, p)) + k3 * sin(dot(k3, p)));
    float fw = max(fwidth(p.x), fwidth(p.y)) * uLatK;
    g *= mask * mask * (0.12 + 0.75 * arm.x) / (1.0 + fw * fw * 6.0);
  }
  vec3 N = normalize(vec3(-g.x, 1.0, -g.y));
  float F = itSeaFresnel(dot(N, V));
  vec3 R = reflect(-V, N);
  vec3 col = uBlack * 0.6 * (1.0 - F) + itSkyMirror(R, smoothstep(0.45, 0.12, R.y)) * F;
  gl_FragColor = vec4(itApplyFog(col), 1.0);
}
`;

const SKY_VERT = /* glsl */`
varying vec3 vD;
void main(){ vD = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
`;
const SKY_FRAG = /* glsl */`
varying vec3 vD;
${IRON_TIDE_SKY_GLSL}
void main(){
  vec3 d = normalize(vD);
  vec3 col = itSky(d, 1.0);
  if (d.y < 0.0) col *= 0.9;
  gl_FragColor = vec4(col, 1.0);
}
`;

// ---------------------------------------------------------------- build
export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng.fork ? ctx.rng.fork('iron-tide-crown') : ctx.rng;
  const noise = ctx.noise;
  const pal = (opts.palette && opts.palette.length >= 7 ? opts.palette : DEFAULT_PALETTE).map((h) => new THREE.Color(h));
  const [cHor, cTop, cSeam, cChrome, cMatte, cBlack, cTeal] = pal;
  const useSky = opts.sky !== false, useSea = opts.sea !== false;
  const period = opts.period ?? 24;
  const armAtU = opts.armAtU ?? 0.8;

  // ---- per-seed character
  const RIM = 500;
  const spacing = rng.range(23.8, 25.4);
  const spinDir = rng.sign();                 // which way the lodestone and the arms wheel
  const orbit = rng.sign();                   // which side the fly-through passes the central spire
  const arms = rng.chance(0.12) ? 3 : 2;
  const twist = rng.range(0.0095, 0.0145) * rng.sign();
  const profP = rng.range(1.45, 1.95);
  const moatOut = rng.range(112, 124);
  const wallPeak = rng.range(240, 265);
  const phi0 = rng.range(0, TAU);
  const lodeHalfY = 75, lodeHalf = 75 * rng.range(0.8, 0.98);
  const lodeY = 300 + 60 + lodeHalfY;
  const TOP_Y = lodeY + lodeHalfY;
  const hexR = spacing / Math.sqrt(3);
  const laneX = orbit * spacing * Math.sqrt(3) / 4;

  // ---- fly-through line (local space)
  const pol = (deg, r, y) => { const a = deg * Math.PI / 180; return new THREE.Vector3(orbit * r * Math.sin(a), y, r * Math.cos(a)); };
  // the last 75 m rise at 55 degrees through the attendant columns' tips, so the portal faces down and outward
  // and shows its face to the whole climbing half-turn below it
  const seatY = 330, endDeg = 200, TILT = 55 * Math.PI / 180, cT = Math.cos(TILT), sT = Math.sin(TILT);
  // over the rim climbing (85 m at the rim, looking down into the Crown), level with the wall's crest 330 m out (the Great
  // Lodestone ahead with the low light behind it), a wide banked turn-in high over the wall, then the half-turn round the columns
  const flyThrough = [
    new THREE.Vector3(laneX, 25, RIM + 300), new THREE.Vector3(laneX, 26, RIM + 150), new THREE.Vector3(laneX, 29, RIM + 100),
    new THREE.Vector3(laneX, 46, RIM + 46), new THREE.Vector3(laneX, 84, RIM - 14), new THREE.Vector3(laneX, 140, 412),
    new THREE.Vector3(laneX, 186, 345), new THREE.Vector3(laneX + orbit * 6, 208, 292),
    pol(17, 218, 226), pol(40, 156, 238), pol(66, 104, 243), pol(100, 80, 247), pol(135, 68, 254), pol(165, 58, 261), pol(187, 51, 266),
    pol(endDeg, 75 * cT, seatY - 75 * sT), pol(endDeg, 37.5 * cT, seatY - 37.5 * sT), new THREE.Vector3(0, seatY, 0),
  ];
  await ctx.yield?.();
  const flyCurve = new THREE.CatmullRomCurve3(flyThrough, false, 'centripetal');
  const flyS = flyCurve.getSpacedPoints(420);
  await ctx.yield?.();

  // ---- lattice
  const spires = [];
  const jMax = Math.ceil(RIM / (spacing * 0.8660254)), iMax = Math.ceil(RIM / spacing) + 1;
  for (let j = -jMax; j <= jMax; j++) for (let i = -iMax; i <= iMax; i++) {
    if (i === -iMax && (j & 1) === 0) await ctx.yield?.();
    const x = j * spacing * 0.8660254, z = (i + (j & 1 ? 0.5 : 0)) * spacing;
    const r = Math.hypot(x, z);
    if (r > RIM) continue;
    if (r > 0.1 && r < spacing * 1.2) continue;           // the central needle's skirt takes the first ring
    const sp = { x, z, rad: r, theta: Math.atan2(x, z) * spinDir, seed: rng(), lock: 0, R0: hexR, tier: 2, h: 20 };
    if (r < 0.1) { sp.h = 200; sp.lock = 1; sp.R0 = hexR * 2.15; sp.tier = 0; }
    else if (r < spacing * 2.1) { sp.h = rng.range(118, 150); sp.tier = 0; }
    else {
      const wall = 20 + (wallPeak - 20) * Math.pow(1 - r / RIM, profP);
      const m = 1 - ctx.core.smoothstep(moatOut - 30, moatOut, r);
      const n = noise.n2(x / 110 + 7.3, z / 110 - 2.1);
      sp.h = (wall * (1 - m) + (22 + 7 * n) * m) * (1 + 0.1 * n * (1 - m) + (sp.seed - 0.5) * 0.06);
      sp.h *= 0.3 + 0.7 * ctx.core.smoothstep(RIM, RIM - 38, r);      // the last ring melts into the mirror
      sp.tier = r < 160 ? 1 : 2;
    }
    spires.push(sp);
  }
  // attendant columns: tall stalks of fluid that stand round the central needle up to the gap under the
  // lodestone (and a few outside the camera's half-turn), so the climb passes through a forest, not open air.
  // lock 0.72: never a dome; they swell to blunt columns and thin to hairlines as the arms go by.
  {
    const sr = rng.fork ? rng.fork('satellites') : rng;
    const sat = (a, r, top, R0) => {
      const x = r * Math.sin(a), z = r * Math.cos(a);
      spires.push({ x, z, rad: r, theta: Math.atan2(x, z) * spinDir, seed: sr(), lock: 0.72, R0, tier: 0, h: top / 1.5, sat: true });
    };
    const nIn = 26;
    for (let k = 0; k < nIn; k++) {
      const outer = k % 2 === 1;
      sat((k / nIn) * TAU + sr.range(-0.08, 0.08), outer ? sr.range(36, 47) : sr.range(21, 31), outer ? sr.range(268, 345) : sr.range(298, 345), outer ? sr.range(10, 13) : sr.range(9, 12));
    }
    for (let k = 0; k < 9; k++) {
      const deg = 42 + k * 17.5 + sr.range(-5, 5);
      sat(orbit * deg * Math.PI / 180, sr.range(92, 110), sr.range(290, 392), sr.range(8, 11));
    }
  }
  // keep the camera line clear in every state a spire can take
  await ctx.yield?.();
  let minClear = Infinity;
  const SS = [0, 0.25, 0.5, 0.75, 1];
  for (let si = 0; si < spires.length; si++) {
    const sp = spires[si];
    if ((si & 31) === 31) await ctx.yield?.();
    let dFly = Infinity;
    for (let k = 0; k < flyS.length; k += 3) { const q = flyS[k], dx = q.x - sp.x, dz = q.z - sp.z, d = Math.sqrt(dx * dx + dz * dz); if (d < dFly) dFly = d; }
    if (sp.tier === 2 && dFly < 62) sp.tier = 1;                      // more detail where the camera passes
    if (dFly > sp.R0 + 16) continue;                                  // nowhere near the line (flyS points are under 6 m apart)
    for (let it = 0; it < 40; it++) {
      let worst = Infinity;
      for (let k = 0; k < flyS.length; k++) {
        const q = flyS[k], dx = q.x - sp.x, dz = q.z - sp.z, d = Math.sqrt(dx * dx + dz * dz);
        if (d > sp.R0 + 10) continue;
        const y = Math.max(0, q.y - 6.5);
        for (const s of SS) {
          if (sp.lock === 1 && s < 1) continue;
          const c = d - spireRadiusAt(sp.h, sp.R0, y, s + (1 - s) * sp.lock, sp.sat);
          if (c < worst) worst = c;
        }
      }
      if (worst >= (sp.sat ? 9 : 6.8) || sp.lock === 1) { if (worst < minClear) minClear = worst; break; }
      sp.h *= 0.9;
    }
  }
  await ctx.yield?.();

  // ---- shared uniforms
  // the one light in the vault: a low disc 8.5 degrees up, ahead of the arriving camera and 30 degrees to the side away from the half-turn
  const sunEl = 8.5 * Math.PI / 180, sunAz = 30 * Math.PI / 180;
  const sunDir = new THREE.Vector3(-orbit * Math.sin(sunAz) * Math.cos(sunEl), Math.sin(sunEl), -Math.cos(sunAz) * Math.cos(sunEl));
  const U = {
    uSkyHor: { value: cHor }, uSkyTop: { value: cTop }, uSkySeam: { value: cSeam }, uSkySun: { value: sunDir },
    uSkyBole: { value: new THREE.Color(opts.bole || '#5e1f10') },
    uSkyShift: { value: new THREE.Vector2() },
    uFogTint: { value: new THREE.Vector4(cHor.r, cHor.g, cHor.b, opts.fogTint ?? (useSky ? 1 : 0)) },
    uPhi: { value: phi0 }, uTwist: { value: twist }, uArms: { value: arms },
    uPhiC: { value: 0 }, uTopY: { value: TOP_Y },
    uTime: { value: 0 }, uPixH: { value: 720 }, uSeaY: { value: 0 }, uField: { value: 1 }, uSheen: { value: 0.3 }, uBeam: { value: 1 }, uBounce: { value: 0.5 },
    uBlack: { value: cBlack }, uMatte: { value: cMatte }, uChrome: { value: cChrome }, uTeal: { value: cTeal }, uGold: { value: cHor },
  };
  const mat = (vs, fs, extra = {}, params = {}) => new THREE.ShaderMaterial({
    vertexShader: vs, fragmentShader: fs, fog: true,
    uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...U, ...extra }, ...params,
  });

  const object = new THREE.Group();
  object.name = 'iron-tide-crown';
  const add = (m, order = 0) => { m.frustumCulled = false; m.renderOrder = order; object.add(m); return m; };

  // ---- spires: three detail tiers + the mirror copy
  const heroT = []; for (let i = 0; i <= 16; i++) heroT.push(Math.pow(i / 16, 1.55));
  const tiers = [
    { radial: 24, ts: heroT },
    { radial: 12, ts: [0, 0.03, 0.08, 0.16, 0.3, 0.5, 0.75, 0.93, 1] },
    { radial: 8, ts: [0, 0.08, 0.5, 0.866, 1] },
  ];
  const spireMat = mat(SPIRE_VERT, SPIRE_FRAG, { uFlip: { value: 1 }, uRefl: { value: 0 } });
  const detailMeshes = [];
  for (let k = 0; k < tiers.length; k++) {
    const t = tiers[k], inst = spires.filter((s) => s.tier === k);
    await ctx.yield?.();
    if (!inst.length) continue;
    const m = add(new THREE.Mesh(spireGeometry(t.radial, t.ts, inst), spireMat));
    if (k < 2) detailMeshes.push(m);
  }
  await ctx.yield?.();
  const reflOn = opts.reflection !== false;
  if (reflOn) {
    const reflMat = mat(SPIRE_VERT, SPIRE_FRAG, { uFlip: { value: -1 }, uRefl: { value: 1 } }, { side: THREE.DoubleSide });
    await ctx.yield?.();
    add(new THREE.Mesh(spireGeometry(3, [0, 0.14, 1], spires), reflMat), -0.4);
  }

  // ---- the Great Lodestone
  await ctx.yield?.();
  const lodeGeo = lodestoneGeometry(rng, lodeHalf, lodeHalfY);
  await ctx.yield?.();
  const lodeMat = mat(SOLID_VERT, SOLID_FRAG, { uRefl: { value: 0 }, uGrain: { value: 0.09 }, uGlowAmp: { value: 1.0 } }, { side: THREE.DoubleSide });
  const lode = add(new THREE.Mesh(lodeGeo, lodeMat));
  lode.position.set(0, lodeY, 0);
  let lodeRefl = null;
  if (reflOn) {
    lodeRefl = add(new THREE.Mesh(lodeGeo, mat(SOLID_VERT, SOLID_FRAG, { uRefl: { value: 1 }, uGrain: { value: 0.09 }, uGlowAmp: { value: 1.0 } }, { side: THREE.DoubleSide })), -0.4);
    lodeRefl.position.set(0, -lodeY, 0); lodeRefl.scale.y = -1;
  }

  // ---- portal frame
  await ctx.yield?.();
  const facing = pol(endDeg, 1, 0).normalize().multiplyScalar(cT);
  facing.y = -sT; facing.normalize();
  if (opts.portalFrame !== false) {
    const frameGeo = await portalFrameGeometry(rng, async () => { await ctx.yield?.(); });
    await ctx.yield?.();
    const frame = add(new THREE.Mesh(frameGeo, mat(SOLID_VERT, SOLID_FRAG, { uRefl: { value: 0 }, uGrain: { value: 1.2 }, uGlowAmp: { value: 3.0 }, uBounce: { value: 0.3 } }, { side: THREE.DoubleSide })));
    frame.position.set(0, seatY, 0);
    frame.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), facing);
  }
  await ctx.yield?.();

  // ---- filings: dipole cage of arcs
  const nAz = rng.int(13, 17), arcs = [];
  for (let s = 0; s < 2; s++) for (let i = 0; i < nAz; i++) {
    const az = ((i + (s ? 0.5 : 0)) / nAz) * TAU + rng.range(-0.05, 0.05);
    arcs.push(s === 0
      ? [az, rng.range(125, 165), rng.range(255, 296), rng.range(0.1, 0.25)]
      : [az, rng.range(225, 285), rng.range(150, 215), rng.range(0.15, 0.32)]);
  }
  {
    const N = 4400, g = new THREE.InstancedBufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3));
    g.setIndex([0, 1, 2, 0, 2, 3]);
    const aA = new Float32Array(N * 4), aB = new Float32Array(N * 4);
    for (let k = 0; k < N; k++) {
      if ((k & 1023) === 1023) await ctx.yield?.();
      const arc = arcs[k % arcs.length];
      aA.set(arc, k * 4);
      const sp = (0.05 + 0.03 * ((k % arcs.length) * 0.618 % 1)) * (0.9 + 0.2 * rng());
      aB.set([rng(), sp, rng.range(0.5, 1.1) * (rng.chance(0.08) ? 2.2 : 1), rng()], k * 4);
    }
    g.setAttribute('aA', new THREE.InstancedBufferAttribute(aA, 4));
    g.setAttribute('aB', new THREE.InstancedBufferAttribute(aB, 4));
    g.instanceCount = N;
    add(new THREE.Mesh(g, mat(FILING_VERT, FILING_FRAG, {}, { transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })), 3);
  }
  await ctx.yield?.();
  {
    const SEG = 44, P = [], A = [], Uu = [], I = [];
    arcs.forEach((arc, ai) => {
      const b = P.length / 3, sd = rng();
      for (let k = 0; k <= SEG; k++) for (const side of [-1, 1]) { P.push(0, 0, 0); A.push(...arc); Uu.push(k / SEG, side, sd); }
      for (let k = 0; k < SEG; k++) { const o = b + k * 2; I.push(o, o + 1, o + 2, o + 1, o + 3, o + 2); }
    });
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
    g.setAttribute('aA', new THREE.Float32BufferAttribute(A, 4));
    g.setAttribute('aU', new THREE.Float32BufferAttribute(Uu, 3));
    g.setIndex(I);
    add(new THREE.Mesh(g, mat(RIBBON_VERT, RIBBON_FRAG, {}, { transparent: true, depthWrite: false, side: THREE.DoubleSide })), 2);
  }

  // ---- the field column on the axis, and its image in the mirror
  await ctx.yield?.();
  {
    const P = [], I = [], ys = [];
    for (let i = 0; i <= 12; i++) ys.push(-40 + (300 + 100) * i / 12);            // sea to the lodestone's lower point
    const y0 = ys.length;
    for (let i = 0; i <= 10; i++) ys.push(TOP_Y + 1700 * (i / 10) * (i / 10));    // upper point to the vault
    ys.forEach((y) => { P.push(-1, y, 0, 1, y, 0); });
    for (let i = 0; i + 1 < ys.length; i++) { if (i + 1 === y0) continue; const o = i * 2; I.push(o, o + 1, o + 2, o + 1, o + 3, o + 2); }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setIndex(I);
    const bp = { transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide };
    add(new THREE.Mesh(g, mat(BEAM_VERT, BEAM_FRAG, { uFlip: { value: 1 }, uGapY: { value: 300 } }, bp)), 1);
    if (reflOn) add(new THREE.Mesh(g, mat(BEAM_VERT, BEAM_FRAG, { uFlip: { value: -1 }, uGapY: { value: 300 } }, bp)), 0.5);
  }

  // ---- preview dressing: mirror sea and gold-leaf dome
  await ctx.yield?.();
  let sky = null;
  if (useSea) {
    const g = new THREE.CircleGeometry(2600, 64); g.rotateX(-Math.PI / 2);
    add(new THREE.Mesh(g, mat(SEA_VERT, SEA_FRAG, { uRim: { value: RIM }, uLatK: { value: 4 * Math.PI / (Math.sqrt(3) * spacing) }, uDir: { value: spinDir } }, { depthWrite: false })), -0.5);
  }
  if (useSky) {
    sky = add(new THREE.Mesh(new THREE.SphereGeometry(2800, 32, 16), new THREE.ShaderMaterial({
      vertexShader: SKY_VERT, fragmentShader: SKY_FRAG, uniforms: U, side: THREE.BackSide, depthWrite: false, depthTest: false })), -0.9);
  }

  // ---- animation
  const lanePoint = new THREE.Vector3(laneX, 0, 300);
  const phiLane = Math.atan2(laneX, 300) * spinDir + twist * Math.hypot(laneX, 300);
  let spin = null, progress = null;
  const tmp = new THREE.Vector3(), camW = new THREE.Vector3();
  const hero = {
    object, radius: RIM, height: TOP_Y, center: new THREE.Vector3(0, 200, 0),
    ground: false, groundY: 0,
    skyUniforms: U, spinAt: phi0, lodestone: lode, lodestoneReflection: lodeRefl, detailMeshes,
    anchors: {
      portalSeat: { position: new THREE.Vector3(0, seatY, 0), facing: facing.clone(), tilt: 55, radius: 7 },
      flyThrough, flyThroughClearance: minClear,
      rimEntry: flyThrough[4].clone(), revealViewpoint: flyThrough[0].clone(),
      orbit, lanePoint, lodestoneCenter: new THREE.Vector3(0, lodeY, 0),
      lodestoneLowerPoint: new THREE.Vector3(0, lodeY - lodeHalfY, 0), lodestoneUpperPoint: new THREE.Vector3(0, TOP_Y, 0),
      centralTip: new THREE.Vector3(0, 300, 0),
      viewpoints: [new THREE.Vector3(laneX, 25, RIM + 300), new THREE.Vector3(-orbit * 620, 90, 520), new THREE.Vector3(orbit * 150, 420, 760)],
      lattice: { spacing, rows: 'along Z', laneX },
      spin: { dir: spinDir, arms, twist, period, phiLane: 0, phi0 },
    },
    setSpin(a) { spin = a; },
    setProgress(u) { progress = u; if (u == null) spin = null; },
    update(dt, time, camera) {
      let phi = phi0 + (time * TAU) / period;
      if (progress != null) phi = phiLane + (progress - armAtU) * (TAU * 42) / period;   // 42 s nominal flight
      if (spin != null && progress == null) phi = spin;
      hero.spinAt = phi;
      U.uPhi.value = phi; U.uPhiC.value = spinDir * phi; U.uTime.value = time;
      lode.rotation.y = spinDir * phi;
      if (lodeRefl) lodeRefl.rotation.y = spinDir * phi;
      const el = ctx.renderer && ctx.renderer.domElement;
      if (el && el.height) U.uPixH.value = el.height;
      U.uSeaY.value = object.getWorldPosition(tmp).y;
      if (camera) {
        camera.getWorldPosition(camW);
        U.uSkyShift.value.set(camW.x * 0.004, camW.z * 0.004);
        if (sky) { object.updateWorldMatrix(true, false); sky.position.copy(object.worldToLocal(tmp.copy(camW))); }
      }
    },
    dispose() {},
  };
  hero.anchors.spin.phiLane = phiLane;
  hero.update(0, 0, null);
  return hero;
}

export { FOG_PARS as IRON_TIDE_FOG_GLSL, ARM_GLSL as IRON_TIDE_ARM_GLSL, SPIRE_FRAG as IRON_TIDE_SPIRE_FRAG, SOLID_VERT as IRON_TIDE_SOLID_VERT,
  SOLID_FRAG as IRON_TIDE_SOLID_FRAG, FILING_FRAG as IRON_TIDE_FILING_FRAG, RIBBON_FRAG as IRON_TIDE_RIBBON_FRAG };
