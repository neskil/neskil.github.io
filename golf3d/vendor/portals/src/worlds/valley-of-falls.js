// VALLEY OF FALLS
// A glacial U-valley at mid-morning. The camera comes up the braided river between a shaded left wall and a sunlit right
// wall, banks left past a 180 m side fall 40 m from its sheet (its spray drifts across the flight line with its own scrap of
// rainbow), climbs to 40 m over a tree island as the Great Fall (the hero set piece, src/parts/valley-of-falls.js) fills the
// view and the rainbow brightens across its plume, then comes down to the plunge pool and flies the last 120 m straight and
// level to the portal that hangs under the bow in the spray. The sun is low and BEHIND the camera so the bow stands ahead.
// The flight (route, 46 s, gaze points, bank, lens, portal) is the owner's and is not to be changed here.
//
// Layout: the hero sits at the world origin facing +Z; the valley runs out along +Z; the camera flies toward -Z.
//
// Random streams: R (the valley's main stream) carries the valley's character and layout and the kit forks, in the owner's order.
// Every loop whose number of draws follows the land has a stream of its own, made from the seed and its name (own(label), listed
// at the head of build()): 'cliff', 'polish', 'falls', 'puffs', 'shade'. Add new things on a stream of their own, never on R.
//
// Nothing here is placed, hidden or timed for a place on the flight: things stand by rules of the land (distance to the river, to
// a wall, to a fall, height, slope) and are thinned only by their distance from the flight line. The only things driven by u are
// the design's own beats (the bow coming up between 0.35 and 0.55, the owner's switches for herds and flocks) and the Great Fall's
// spray, which follows the traveller's place on the route (dR, the distance over the ground from the route's own point at u to the
// fall's foot: the world's one declared pacing by the route); the cloud shadows, the swallows and the mist run on the world's clock.
//
// Map of this file (in build order):
//   GLSL_VN, GLSL_VALLEY     noise; what every lit material knows of the valley: the cumulus lattice's shadow (vofShade), a fall's wet streak (vofWet)
//   GLSL_GRANITE_MAIN        the hook that lays the hero part's granite (roofs, ledges, blocks, streaks) on the terrain shader; a fall's wet band is the rock under the wet tint, nothing painted on it
//   addCloudShadow()         hook on every lit material: the clouds' shadows over the whole floor, the island and the walls;
//                            with look: warm/cool wall split, wet streaks at falls
//   courseTable()            x(z) lookup for river curves
//   cellTable()              hashed-once jittered cells for the slab fields (they run for every terrain sample and every cliff vertex)
//   build(): per-seed character and ctx.vary (hour: not followed, the bow needs this sun; rare: a dewy morning, river mist and a stronger outer bow;
//            density: a lush visit has more birch and a few more trees and flowers, never fewer than the design's; mood: cloud, haze, wind;
//            counts scale with ctx.quality.detail)
//          sky, haze, light, the cumulus lattice (SHADE) -> hero -> river courses -> valley shape (the falls, wallAt, slabOff, siteFall, ground)
//          -> the flight path -> terrain (groundColor paints the meadow quilt: flower drifts, gravel bars, old channels, cut banks)
//          -> wall-shadow map (sunAt) -> the cliffs (buildCliff: the right wall as meshes of its own, in the terrain's material: slabs, roofs, ledges,
//             blocks, chimneys, their own shadows baked and smoothed; the near cliff beside the side fall, and a coarser up-valley cliff
//             from there to the head wall's wing)
//          -> water (kit rivers, the side fall's kit sheets) -> the falls (one ribbon mesh in the hero's water shader; the side fall's
//             ribbon is solid white water behind the kit's sheets, the others broken threads; the side fall's cascade down its stream)
//          -> vegetation (one forest by the land, a band of the tallest spruce beside the river over the whole floor, spruce under the path on the
//             tree island, birch groves, spruce on the near cliff's ledges, far cones, 16,500 tufts of grass with flowering tufts, 3,200 flowers,
//             ferns, talus round the basin and along the cliff foot, cobbles and long grass on the river's banks)
//          -> creatures (eagles, swallows along the path, in the side fall's spray, over the pool and across the upper river, deer)
//          -> air (spray, wisps off the side fall, a mist bank on each shore of the pool, river mist, pollen, cumulus over the head wall, the
//             cumulus of the lattice) -> the side fall's small bow (hero.addBow)
//          -> AP (the distances from the fall's foot at which its spray changes: the spray's own reaches and the places at the foot)
//          -> the outer bow's strength, set once
//          -> return { portal, post, update: shapes the Great Fall's spray from the traveller's place on the route }
import * as THREE from 'three';
import { makePath, clamp, lerp, smoothstep as sst } from '../kit/core.js';
import { makeSky, makeCloudField, makeLightRig, skyDirection } from '../kit/sky.js';
import * as T from '../kit/terrain.js';
import * as Water from '../kit/water.js';
import * as flora from '../kit/flora.js';
import * as F from '../kit/fauna.js';
import * as fx from '../kit/fx.js';
import { buildHero, boulderBuilder, boulderMaterial, GLSL_WATER, GLSL_NOISE, GLSL_GRANITE, GRANITE } from '../parts/valley-of-falls.js';

const PALETTE = ['#3f78c9', '#cfe2f2', '#8d949c', '#f4f7fa', '#3f7a3a', '#d9c24a', '#ff6fa8'];
const GRAV = 9.81;
const C = (h) => new THREE.Color(h);

const GLSL_VN = /* glsl */`
float vofH(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float vofN(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(vofH(i), vofH(i + vec2(1.0, 0.0)), f.x), mix(vofH(i + vec2(0.0, 1.0)), vofH(i + vec2(1.0, 1.0)), f.x), f.y); }
float vofRs(float hi, float lo, float x){ return 1.0 - smoothstep(lo, hi, x); }   // a falling smoothstep, written the way Direct3D accepts
`;
// What every lit material knows about the valley: the shadows of its cumulus and the wet streak behind each fall.
// vofShade: the cumulus are a lattice of clouds (SHADE in build(): 5 across the wind, 6 rows along it, then the same again), every
// cloud a blob in its cell; a point is in shadow where the sun ray through it meets a cloud. vofWet: 0..1 inside a fall's streak.
const GLSL_VALLEY = /* glsl */`
uniform vec4 uVofCloud;      // xy: where the cloud lattice lies now (metres: its drawn start minus the wind's run), w: how dark a shadow is
uniform vec4 uVofLat;        // xy: unit vector across the wind, zw: 1 / cell size across and along the wind
uniform vec4 uVofBlob[30];   // per cloud of the 5 x 6 tile: its centre's offset in its cell (across, along), its radius (cells), how ragged its edge is
uniform vec2 uVofSun; uniform vec3 uVofTint, uVofHaze, uVofKey; uniform vec4 uVofFalls[10]; uniform float uVofSplit; uniform vec2 uVofZone;
float vofShade(vec3 w){
  vec2 gp = w.xz - uVofSun * w.y + uVofCloud.xy;            // down the sun ray to the level the clouds are laid out on
  vec2 q = vec2(gp.x * uVofLat.x + gp.y * uVofLat.y, gp.y * uVofLat.x - gp.x * uVofLat.y) * uVofLat.zw;
  float er = (vofN(q * 2.7 + 3.1) - 0.5) * 0.5 + (vofN(q * 6.3 + 11.7) - 0.5) * 0.22;
  float j0 = floor(q.y), s = 0.0;
  for (int a = 0; a < 2; a++) {                             // this row and the nearer of its neighbours
    float j = j0 + (a == 0 ? 0.0 : (q.y - j0 > 0.5 ? 1.0 : -1.0));
    float jm = j - 6.0 * floor(j / 6.0);
    float xr = q.x - 0.5 * jm, i0 = floor(xr);              // (rows are staggered by half a cell)
    for (int b = 0; b < 2; b++) {
      float i = i0 + (b == 0 ? 0.0 : (xr - i0 > 0.5 ? 1.0 : -1.0));
      float im = i - 5.0 * floor(i / 5.0);
      vec4 B = uVofBlob[int(jm + 0.5) * 5 + int(im + 0.5)];
      vec2 d = vec2(xr - (i + 0.5 + B.x), q.y - (j + 0.5 + B.y)) / max(B.z, 0.05);
      s = max(s, 1.0 - smoothstep(0.72, 1.08, length(d) + er * B.w));
    }
  }
  return s;
}
float vofWet(vec3 w, out float edge){
  float wet = 0.0; edge = 0.0;
  for (int i = 0; i < 10; i++) {
    vec4 f = uVofFalls[i];
    if (f.y <= 0.0 || f.z * w.x < 0.0) continue;
    float n = vofN(vec2(w.z * 0.19 + float(i) * 13.0, w.y * 0.011));
    float d = abs(w.z - f.x) / f.y + (n - 0.5) * 1.1;
    float k = vofRs(f.w + 16.0, f.w - 8.0, w.y) * smoothstep(3.0, 26.0, w.y);
    wet = max(wet, vofRs(1.5, 0.5, d) * k);
    edge = max(edge, vofRs(2.6, 1.6, d) * smoothstep(0.9, 1.6, d) * k);
  }
  return wet;
}
`;

// Granite on every steep face of the valley walls and of the near cliff, from the world position: the paint itself is the
// hero part's GLSL_GRANITE (one rock for all three walls); here it is laid on the kit's terrain shader (world normal in
// vTNormal, bump gradient in gTGrad) and its relief is turned into a bump from the screen derivatives of the height.
const GLSL_GRANITE_MAIN = /* glsl */`{
  vec3 vofNw = normalize(vTNormal);
  float vofAl = vVofW.z + vVofW.x * 0.3, vofY = vVofW.y;
  float vofAlF = vVofW.z + abs(vVofW.x);      // a second along-wall coordinate for the broad stains and streaks: on a face that turns toward the camera vofAl nearly stands still (the fine mottling is 3D noise on vVofW and has no such direction)
  float vofPa = length(vec2(dFdx(vofAl), dFdx(vofY))), vofPb = length(vec2(dFdy(vofAl), dFdy(vofY)));
  float vofPx = sqrt(max(vofPa, vofPb) * max(min(vofPa, vofPb), 0.3 * max(vofPa, vofPb)));      // metres per pixel on the face (on a face seen along its length the two differ: between them, so the paint there is not all faded to a blur)
  float rockK = (1.0 - smoothstep(0.55, 0.8, vofNw.y)) * smoothstep(5.0, 30.0, vofY);
  float vofGh = 0.0;
  if (rockK > 0.01) {
    float vofGeo = step(0.0, vVofW.x) * smoothstep(uVofZone.x + 24.0, uVofZone.x + 62.0, vVofW.z) * vofRs(uVofZone.y - 24.0, uVofZone.y - 62.0, vVofW.z) * vofRs(304.0, 240.0, vofY);   // on the near cliff the beds are real
    vec3 c = gnGranite(diffuseColor.rgb, vofAl, vofAlF, vVofW, vofY, vofPx, vofGeo, smoothstep(0.25, 0.6, abs(vofNw.x)), vofGh);   // (streaks only on faces that look across the valley: on a slot wall they would run as sideways strokes)
    diffuseColor.rgb = mix(diffuseColor.rgb, c, rockK);
    vofGh *= rockK;
  }
  // behind and beside a fall the face is soaked: no dry mottling relief there (lit from the side its fine bump combed the dark face with
  // short dashes). Nothing is painted on the soaked face: as on live it is the rock under the wet tint of addCloudShadow, and no more
  float vofWedge = 0.0, vofWetK = vofWet(vVofW, vofWedge) * rockK;
  if (vofWetK > 0.01) {
    vofGh *= 1.0 - 0.9 * vofWetK;
  }
  vec3 vofDx = dFdx(vVofW), vofDy = dFdy(vVofW);
  float vofHx = dFdx(vofGh), vofHy = dFdy(vofGh);
  vec3 vofR1 = cross(vofDy, vofNw), vofR2 = cross(vofNw, vofDx);
  float vofDet = dot(vofDx, vofR1);
  if (abs(vofDet) > 1e-7) {
    vec3 vofG = (vofHx * vofR1 + vofHy * vofR2) / vofDet;
    float vofGl = length(vofG);
    gTGrad += vofG * (min(vofGl, 1.3) / max(vofGl, 1e-4)) * 0.4;      // roofs face down, ledge tops face the sky, joints are grooves (kept gentle: a hard bump draws ink lines)
  }
  // Two places where any bump (the kit's fine rock grain as much as this one) does harm, and is taken away:
  // a face the key light only grazes, seen from further than about 100 m: the grain is finer than a pixel there and tips each
  // pixel row into or out of the light, which filled a slab or a niche with dark stripes two pixels tall;
  // and the metre-tall facet under a roof's lip, whose shading normal (the wall's) lies nearly in the facet's own plane
  vec3 vofNg = cross(vofDx, vofDy);
  float vofAgree = abs(dot(vofNg, vofNw)) / max(length(vofNg), 1e-9);
  float vofNdl = dot(vofNw, uVofKey);                                // (grazed, or turned a little away: the bump tips those into the light as well)
  float vofGraze = smoothstep(5.0, 30.0, vofY) * (1.0 - smoothstep(0.1, 0.34, vofNdl)) * (1.0 - smoothstep(0.3, 0.55, -vofNdl)) * smoothstep(50.0, 110.0, length(vViewPosition));
  gTGrad *= (1.0 - 0.9 * vofGraze) * smoothstep(0.55, 0.8, vofAgree) * (1.0 - 0.9 * vofWetK);
}
`;

// Drifting cloud shadows on any lit three.js material (terrain, trees, grass, the hero's rock): the clouds' lattice lies on
// one level and is projected along the sun ray, so walls and floor agree. Chains the kit's own shader hook.
// With look (terrain, hero rock) the same hook also grades the rock by where it stands: the sunlit right wall warm,
// the shaded left wall a readable slate blue with pale haze toward its foot, and a dark wet streak with mossy edges
// behind every side fall. look = 'terrain' adds the painted granite above (kit terrain material only).
function addCloudShadow(mat, U, look = false) {
  if (!mat || !mat.isMaterial || mat.isShaderMaterial || mat.userData.vofCloud) return;
  mat.userData.vofCloud = true;
  const prev = mat.onBeforeCompile;
  const prevKey = Object.prototype.hasOwnProperty.call(mat, 'customProgramCacheKey') ? mat.customProgramCacheKey.bind(mat) : () => (prev ? prev.toString() : '');
  mat.onBeforeCompile = (sh, renderer) => {
    if (prev) prev.call(mat, sh, renderer);
    sh.uniforms.uVofCloud = U.cloud; sh.uniforms.uVofLat = U.lat; sh.uniforms.uVofBlob = U.blob; sh.uniforms.uVofSun = U.slope; sh.uniforms.uVofTint = U.tint; sh.uniforms.uVofFalls = U.falls; sh.uniforms.uVofSplit = U.split; sh.uniforms.uVofZone = U.zone; sh.uniforms.uVofHaze = U.haze; sh.uniforms.uVofKey = U.key;
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vVofW;')
      .replace('#include <fog_vertex>', '#include <fog_vertex>\nvVofW = cameraPosition + transpose(mat3(viewMatrix)) * mvPosition.xyz;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vVofW;\n' + GLSL_VN + GLSL_VALLEY + (look === 'terrain' ? GLSL_NOISE + GLSL_GRANITE : ''))
      .replace('#include <opaque_fragment>', /* glsl */`{
        // the clouds' shadows cross the whole floor, the tree island and the ground under the plume at full depth. Up the walls they are faint
        // (a wall's own light, the warm raking key or its blue shade, carries it: at full depth the lattice striped the walls), and on the
        // shaded left wall, where there is no sun to take away, there are none
        float vofCk = uVofCloud.w * mix(1.0, 0.3, smoothstep(30.0, 170.0, vVofW.y)) * mix(1.0, smoothstep(-150.0, 40.0, vVofW.x), smoothstep(10.0, 70.0, vVofW.y));
        outgoingLight *= mix(vec3(1.0), uVofTint, vofCk * vofShade(vVofW));
      }` + (look ? /* glsl */`{
        float wallK = smoothstep(10.0, 70.0, vVofW.y) * uVofSplit;
        outgoingLight *= mix(vec3(1.0), mix(vec3(0.97, 1.03, 1.16), vec3(1.08, 1.0, 0.9), smoothstep(-150.0, 150.0, vVofW.x)), wallK);
        float leftK = wallK * vofRs(60.0, -140.0, vVofW.x);
        outgoingLight = mix(outgoingLight, uVofHaze, leftK * (0.1 + 0.16 * vofRs(330.0, 30.0, vVofW.y)));   // blue air in front of the shaded wall, thicker toward its foot
        float edge = 0.0, wet = vofWet(vVofW, edge);
        outgoingLight *= mix(vec3(1.0), vec3(0.36, 0.41, 0.5), wet);       // dark wet rock behind the white water (but not a black slot)
        outgoingLight *= mix(vec3(1.0), vec3(0.6, 0.92, 0.46), edge * 0.75 * smoothstep(0.3, 0.7, vofN(vVofW.zy * 0.08 + 5.0)));
        outgoingLight = max(outgoingLight, uVofHaze * 0.04);                // the deepest shade on a wall is slate, never a black hole
      }` : '') + /* glsl */`
      #include <opaque_fragment>`);
    if (look === 'terrain') sh.fragmentShader = sh.fragmentShader.replace('#include <roughnessmap_fragment>', GLSL_GRANITE_MAIN + '\n#include <roughnessmap_fragment>');
  };
  mat.customProgramCacheKey = () => prevKey() + (look === 'terrain' ? '|vof-granite' : look ? '|vof-look' : '|vof-cloud');
  mat.needsUpdate = true;
}

// x as a function of z for a curve that runs monotonically along z (river courses)
function courseTable(curve, n = 700) {
  const p = new THREE.Vector3(), xs = [], zs = [];
  for (let i = 0; i <= n; i++) { curve.getPoint(i / n, p); xs.push(p.x); zs.push(p.z); }
  const z0 = zs[0], z1 = zs[n], step = 3, m = Math.max(2, Math.ceil((z1 - z0) / step)), tab = new Float32Array(m + 1);
  for (let k = 0, i = 0; k <= m; k++) {
    const z = z0 + (z1 - z0) * (k / m);
    while (i < n - 1 && zs[i + 1] < z) i++;
    const f = clamp((z - zs[i]) / Math.max(1e-4, zs[i + 1] - zs[i]), 0, 1);
    tab[k] = xs[i] + (xs[i + 1] - xs[i]) * f;
  }
  return { z0, z1, at(z) { const f = clamp((z - z0) / (z1 - z0), 0, 1) * m, i = Math.min(m - 1, Math.floor(f)); return tab[i] + (tab[i + 1] - tab[i]) * (f - i); } };
}

// Jittered slab cells: each cell's five numbers (its centre, its offset, its two tilts) are hashed once and kept. The slab
// functions run for every terrain sample and, several times over, for every vertex of the cliffs: hashing nine cells afresh
// on each call was a quarter of the whole build. at(ci, cj) returns the cell's index into c (a spare slot for a cell outside
// the table, good until the next call).
function cellTable(hash, W, H, ox, oy, k0, kx, ky) {
  const c = new Float64Array((W * H + 1) * 5).fill(NaN), spare = W * H * 5;
  return { c, at(ci, cj) {
    const ix = ci + ox, iy = cj + oy, inside = ix >= 0 && ix < W && iy >= 0 && iy < H, k = inside ? (iy * W + ix) * 5 : spare;
    if (inside && c[k] === c[k]) return k;
    c[k] = ci + 0.5 + 0.8 * (hash(ci, cj, 1) - 0.5); c[k + 1] = cj + 0.5 + 0.8 * (hash(ci, cj, 2) - 0.5);
    c[k + 2] = k0 * (hash(ci, cj, 4) - 0.5); c[k + 3] = kx * (hash(ci, cj, 5) - 0.5); c[k + 4] = ky * (hash(ci, cj, 6) - 0.5);
    return k;
  } };
}

export default {
  id: 'valley-of-falls',
  name: 'Valley of Falls',
  category: 'wilderness',
  media: ['air'],
  weirdness: 0,
  async build(ctx) {
    const { noise: N } = ctx;
    const R = ctx.rng.fork('valley');
    // streams of their own, each from the seed and its own name, so a loop that draws more or fewer times moves nothing else. The whole list:
    // 'cliff' (RX: ledge trees, the talus along the cliff foot), 'polish' (RN: the tall spruce band, bank grass, cobbles, small talus, the
    // side fall's swallows, the second pool bank), 'falls' (RF: a new site for a fall that has no lip, each ribbon's wobble, thickness and
    // clock, the cascade), 'puffs' (the spray puffs where a ribbon lands), 'shade' (RS: the cumulus lattice and its shadows)
    const own = (label) => ctx.core.makeRng(ctx.core.hashSeed('vof-' + label + ':' + ctx.seed));
    const RX = own('cliff'), RN = own('polish'), RF = own('falls'), RS = own('shade');
    const scene = new THREE.Scene();
    const updaters = [];

    // ---------- per-seed character, and what the visit asks for (ctx.vary) ----------
    const vary = ctx.vary || {}, Q = clamp(ctx.quality?.detail ?? 1, 0.5, 1);
    // (vary.hour is not followed: the design is mid-morning with the sun behind the camera, front-lighting the Great Fall, and the bow needs
    // exactly that sun; every visit keeps it. rare: a dewy morning, mist on the river and the bow at its brightest)
    const rare = !!vary.rare, lush = clamp(vary.density ?? 1, 0.7, 1.3), mood = clamp(vary.mood ?? 0.5, 0, 1);
    const sunEl = R.range(20, 26);                                  // lower = earlier, warmer, hazier
    const early = 1 - (sunEl - 20) / 6;
    const shadowReach = R.range(0.4, 0.56);                         // how far the left wall's shadow crosses the floor
    const sunAz = Math.asin(clamp(shadowReach * Math.tan(sunEl * Math.PI / 180), 0.1, 0.4)) * 180 / Math.PI;
    const V = {
      early, haze: lerp(0.00045, 0.00058, early) * R.range(0.95, 1.05) * lerp(0.9, 1.22, mood),
      HL: R.range(640, 800), HR: R.range(570, 740), Wd: R.range(105, 135),
      cover: R.range(0.2, 0.37), towers: R.int(3, 6), wind: R.range(0.8, 1.45),
      falls: R.int(7, 10), autumn: R.chance(0.22), pink: R.range(0.25, 0.75),
      eagles: R.int(2, 3), deer: R.int(6, 11), swifts: R.int(9, 16), stags: R.range(0.15, 0.4),
      riverMist: early > 0.45 || R.chance(0.3), snow: R.range(0.42, 0.6),
      o: [R.range(0, 90), R.range(0, 90), R.range(0, 90), R.range(0, 90)],
    };
    V.cover = clamp(V.cover + (mood - 0.5) * 0.3, 0.1, 0.5); V.wind *= lerp(0.8, 1.3, mood); V.towers += Math.round(mood * 2);   // mood: a still clear morning .. a fresh one with cloud building
    if (rare) V.riverMist = true;

    // ---------- sky, haze, light ----------
    const sunColor = C('#ffe3bb').lerp(C('#ffd7a4'), early * 0.8);
    const zen = C('#2f68c0').lerp(C('#3f78c9'), early * 0.6), hor = C('#bcd6f0').lerp(C('#e6dccb'), early * 0.3);
    const sky = makeSky({ rng: R.fork('sky'), preset: 'day', sunElevation: sunEl, sunAzimuth: 180 + sunAz,
      zenith: zen, horizon: hor, scatter: 0.3 + 0.25 * early, sunColor, lightColor: sunColor,
      clouds: { coverage: V.cover, scale: 1.3, haze: 0.3, softness: 0.26 }, clouds2: { opacity: 0.16 } });
    scene.add(sky.object);
    const S = sky.sunDirection.clone().normalize();                 // toward the sun: +Z (behind the camera), a little -X (left)
    const fogColor = sky.colorAt(new THREE.Vector3(0, 0.05, -1).normalize(), new THREE.Color()).lerp(C('#9fbde0'), 0.55);
    scene.fog = new THREE.FogExp2(fogColor, V.haze);
    // The key that shades the scene comes from further left than the sun disc (which is behind the camera and never
    // seen): the right wall and the head wall take warm raking light, the left wall stays in cool shade.
    const KEY = skyDirection(sunEl + 5, 180 + sunAz + R.range(22, 28)).normalize();
    // (follow: false: the kit rig's follow mode calls camera.getWorldDirection(), which resets the engine's portal camera
    // to the world origin, so this world seen through a portal was drawn from the foot of the fall)
    // (a strong warm key over a low cool fill, so the lit right wall and the blue shade of the left wall part clearly)
    const rig = makeLightRig(sky, { intensity: 1.5, ambient: 1.22, bounce: 0.3, follow: false });
    rig.direction.copy(KEY); rig.sun.position.copy(KEY).multiplyScalar(500);
    rig.hemi.color.set('#6f8fc0');                                  // cool fill: the shade is blue, the light is warm
    scene.add(rig.object);
    updaters.push(sky, rig);
    // The cumulus that shade the valley. They stand on the sun's side of it, a kilometre up, in a lattice across the wind: 5 clouds to a row,
    // rows staggered by half a cell, 6 rows and then the same 6 again; each cloud sits off its cell's centre and has its own girth, so about
    // three tenths of any stretch of floor is in shade whatever the clock reads (the lattice's place at clock 0 is its own draw; of the 500 m
    // of floor ahead of the camera 24 to 38 percent is shaded at ten clocks on three seeds). The shadow
    // on a point is the cloud the sun ray through it meets (GLSL_VALLEY), and the clouds themselves are drawn where the lattice says (see 'air').
    const WIND = [0.8, 7], windLen = Math.hypot(WIND[0], WIND[1]);       // m/s over the ground, down-valley: the clouds, and so their shadows
    const SHADE = { nx: 5, nz: 6, cu: R.range(120, 140), cv: 0, blobs: [], alt: 1000 };     // (cu: a cloud's cell across the wind, metres; the clouds are some 85 m across)
    SHADE.cv = SHADE.cu * RS.range(1.02, 1.12);
    for (let k = 0; k < SHADE.nx * SHADE.nz; k++) SHADE.blobs.push(new THREE.Vector4(RS.range(-0.1, 0.1), RS.range(-0.1, 0.1), RS.range(0.33, 0.36), RS.range(0.7, 1.3)));
    const CS = {                                                    // cloud shadow uniforms shared by every lit material
      cloud: { value: new THREE.Vector4(RS.range(0, SHADE.nx * SHADE.cu), RS.range(0, SHADE.nz * SHADE.cv), 0, R.range(0.9, 1)) },      // pools of sun and moving shade, not 'this wall is dark'
      lat: { value: new THREE.Vector4(WIND[1] / windLen, -WIND[0] / windLen, 1 / SHADE.cu, 1 / SHADE.cv) }, blob: { value: SHADE.blobs },
      key: { value: KEY.clone() },                         // (key: the key light's direction, for the granite's bump)
      slope: { value: new THREE.Vector2(S.x / S.y, S.z / S.y) },
      tint: { value: new THREE.Color(0.36, 0.44, 0.66) },
      haze: { value: fogColor.clone().lerp(C('#6f8fc0'), 0.5).multiplyScalar(0.62) },
      falls: { value: Array.from({ length: 10 }, () => new THREE.Vector4(0, 0, 0, 0)) }, split: { value: 1 }, zone: { value: new THREE.Vector2(1e6, 1e6) },
    };
    await ctx.yield();

    // ---------- the hero: the Great Fall at the origin, facing +Z ----------
    // (the hero's bow is given a sun a little nearer the valley axis than the real one, so the arch stands over the fall and the portal rather than off to the right)
    const hero = await buildHero(ctx, { palette: PALETTE, sunDir: skyDirection(sunEl, 180 + sunAz * 0.4).normalize(), sunColor: '#' + sunColor.getHexString(), rainbow: rare ? 1.08 : 1.0, mist: 1.0, detail: Q });
    scene.add(hero.object);
    hero.object.traverse((o) => { if (o.isMesh) addCloudShadow(o.material, CS, o.name === 'head-wall'); });
    const A = hero.anchors, px = A.portalSeat.position.x, pz = A.portalSeat.position.z;
    const dressObj = hero.object.getObjectByName('trees-and-boulders'), dressMat = dressObj ? dressObj.material : boulderMaterial({ side: THREE.DoubleSide });   // shared by the talus and the far cones
    addCloudShadow(dressMat, CS);
    await ctx.yield();

    // ---------- river courses (flow = +Z, away from the fall) ----------
    const RC = A.riverCourse, zs = RC.z1 - 44, jit = (a) => R.range(-a, a);
    const isl = { z: pz + 470 + jit(18), x: px + 20 + jit(8), side: R.sign(), half: R.range(84, 100), w: R.range(27, 32) };
    const zf = pz + 752 + jit(14);                                  // the side fall the camera passes
    const WATER_Y = 0.34;
    const mainXZ = [
      [RC.xAt(zs), zs], [lerp(RC.xAt(zs), isl.x - isl.side * isl.w, 0.5), isl.z - isl.half - 22], [isl.x - isl.side * isl.w, isl.z],
      [isl.x - isl.side * isl.w * 0.3 + jit(6), isl.z + isl.half + 28], [px + 22 + jit(8), zf - 45], [px + 20 + jit(8), zf + 40],
      [px - 12 + jit(20), pz + 900], [px + 6 + jit(16), pz + 1010], [jit(38), pz + 1170], [jit(55), pz + 1350], [jit(55), pz + 1530],
    ];
    const mainCurve = new THREE.CatmullRomCurve3(mainXZ.map((p) => new THREE.Vector3(p[0], WATER_Y, p[1])), false, 'centripetal');
    const mainTab = courseTable(mainCurve), rx = (z) => (z < zs ? RC.xAt(z) : mainTab.at(z));
    await ctx.yield();
    const bz0 = isl.z - isl.half, bz1 = isl.z + isl.half, bo = isl.x + isl.side * isl.w;
    const braidCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(rx(bz0 - 16), WATER_Y, bz0 - 16), new THREE.Vector3(lerp(rx(bz0 + 10), bo, 0.72), WATER_Y, isl.z - isl.half * 0.5),
      new THREE.Vector3(bo + isl.side * 4, WATER_Y, isl.z), new THREE.Vector3(lerp(rx(bz1 - 10), bo, 0.72), WATER_Y, isl.z + isl.half * 0.5),
      new THREE.Vector3(rx(bz1 + 16), WATER_Y, bz1 + 16)], false, 'centripetal');
    const braidTab = courseTable(braidCurve, 300);
    await ctx.yield();

    // ---------- valley shape ----------
    // z-only profiles are tabulated (4 m steps): floor half-widths of both walls and their heights
    const ZT0 = -860, ZTN = 640, tabL = new Float32Array(ZTN + 1), tabR = new Float32Array(ZTN + 1), tabHL = new Float32Array(ZTN + 1), tabHR = new Float32Array(ZTN + 1);
    for (let i = 0; i <= ZTN; i++) {
      const z = ZT0 + i * 4;
      tabL[i] = 180 + 24 * N.n2(z * 0.0034 + V.o[0], 1.3);
      tabR[i] = 174 + 22 * N.n2(z * 0.0034 + V.o[1], 4.1) - 82 * Math.exp(-(((z - zf) / 92) ** 2));
      tabHL[i] = V.HL * (0.84 + 0.3 * N.fbm2(z * 0.0017 - 11 + V.o[3], 0.7, 2));
      tabHR[i] = V.HR * (0.84 + 0.3 * N.fbm2(z * 0.0017 + 11 + V.o[3], 0.7, 2));
    }
    await ctx.yield();
    const tabAt = (tab, z) => { const f = clamp((z - ZT0) * 0.25, 0, ZTN - 1e-3), i = Math.floor(f); return tab[i] + (tab[i + 1] - tab[i]) * (f - i); };
    const hwL = (z) => tabAt(tabL, z), hwR = (z) => tabAt(tabR, z);
    // other falls: hanging valleys cut into the walls, or thin strands straight off the rim
    const falls = [{ side: 1, z: zf, kind: 'hang', lipY: R.range(172, 196), halfW: R.range(44, 54), w: R.range(12.5, 15), v0: 4.6, close: true }];
    for (let tries = 0; falls.length < V.falls + 1 && tries < 200; tries++) {
      const side = falls.length % 2 ? -1 : 1, z = R.range(pz + 190, pz + 1090);
      if (falls.some((f) => f.side === side && Math.abs(f.z - z) < (f.close ? 190 : 120))) continue;
      const hang = R.chance(0.55);
      falls.push({ side, z, kind: hang ? 'hang' : 'rim', lipY: hang ? R.range(170, 340) : 0, rimK: R.range(0.62, 0.9), halfW: R.range(38, 60), w: hang ? R.range(6, 11) : R.range(3, 5.5), v0: hang ? R.range(2.5, 4) : R.range(1, 2) });
    }
    const notches = falls.filter((f) => f.kind === 'hang');
    const PK = { h: R.range(950, 1200), x: jit(160), w: R.range(380, 520) };       // snow summit behind the head wall
    const POOL = A.pool;
    const basin = { x: 0, z: zf, y: 3.6, r: 15, on: false };                         // filled in once the side fall's lip is known
    const trib = { ax: 0, az: 0, bx: 0, bz: 0, len: 1 };
    const smin = (a, b, k) => { const h = clamp(0.5 + 0.5 * (b - a) / k, 0, 1); return lerp(b, a, h) - k * h * (1 - h); };

    // granite slabs: jittered cells ~52 m along the wall and ~120 m up it, each a tilted plane standing a few metres in front of
    // or behind its neighbours, so the walls break into buttresses, flakes and corners instead of one draped sheet
    const slabHash = (i, j, k) => { const t = Math.sin(i * 127.1 + j * 311.7 + k * 74.7 + V.o[2]) * 43758.5453; return t - Math.floor(t); };
    const slabT = cellTable(slabHash, 128, 96, 48, 32, 18, 52 * 0.5, 120 * 0.12), slabTc = slabT.c;
    function slabOff(z, hgt, side) {
      const su = z / 52 + side * 7.3, sv = hgt / 120 + su * 0.35, iu = Math.floor(su), iv = Math.floor(sv);
      let best = 1e9, second = 1e9, vB = 0, vS = 0;
      for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) {
        const k = slabT.at(iu + a, iv + b), dx = su - slabTc[k], dy = sv - slabTc[k + 1], dd = dx * dx + dy * dy;
        if (dd >= second) continue;
        const v = slabTc[k + 2] + dx * slabTc[k + 3] + dy * slabTc[k + 4];
        if (dd < best) { second = best; vS = vB; best = dd; vB = v; } else { second = dd; vS = v; }
      }
      // (each slab is its own plane; at a border the two planes meet at their mean, so the wall has corners but no tears:
      // a tear on a sheer face is spanned by sliver triangles that stand out of the cliff foot as fins)
      return lerp(0.5 * (vB + vS), vB, sst(0, 0.8, Math.sqrt(second) - Math.sqrt(best)));   // (rounded corners: at 0.3 the coarse far mesh drew them as hard low-poly creases)
    }
    // the stretch of the right wall that the camera passes at 40-150 m gets a mesh of its own (the near cliff, below): there the
    // heightfield stays a plain backing, without slabs or benches
    const CLN = { z0: zf - 300, z1: zf + 236 };                    // the near cliff (beside the side fall)
    const CL = { z0: A.wing + 50, z1: CLN.z1, y0: 0, y1: 304 };    // both cliffs: from the head wall's wing to beyond the side fall
    const cliffZone = (z) => sst(CL.z0, CL.z0 + 46, z) * sst(CL.z1, CL.z1 - 46, z);
    CS.zone.value.set(CL.z0, CL.z1);
    function wallAt(x, z) {                                         // ground height without water channels
      const side = x > 0 ? 1 : -1, d = Math.abs(x);
      const gf = Math.exp(-(((z - zf) / 78) ** 2)) * (side > 0 ? 1 : 0);              // sheer face under the close fall
      const w1 = (50 * N.fbm2(z * 0.0052 + side * 31 + V.o[2], d * 0.0016, 3) + 15 * N.n2(z * 0.021 + side * 9, d * 0.012)
        + 26 * (N.ridged2(z * 0.012 + side * 17, d * 0.002 + 3, 2) - 0.45)) * (1 - 0.75 * gf);   // buttresses, gullies, aretes
      const t = d - (side > 0 ? hwR(z) : hwL(z)) + w1;
      const meadow = t > 110 ? 7 : 2.2 + 1.3 * N.fbm2(x * 0.011 + 3, z * 0.011, 3) + 0.6 * N.n2(x * 0.045, z * 0.045 + 9) + 5 * sst(70, 175, d)
        + 2.4 * Math.exp(-(((x - isl.x) / 16) ** 2) - (((z - isl.z) / (isl.half * 0.6)) ** 2));   // the tree island stands a little proud
      const tal = sst(-58, 88, t); let h = meadow + 60 * tal * tal * (0.75 + 0.25 * tal) * (1 - 0.8 * gf);
      if (t > 16) {
        const Hw = tabAt(side > 0 ? tabHR : tabHL, z);
        const Wd = lerp(V.Wd, 34, gf);
        let wall = Hw * (1 - Math.exp(-(t - 16) / Wd));
        const plain = side > 0 ? cliffZone(z) : 0;
        if (wall > 18 && plain < 0.99) wall = Hw * (1 - Math.exp(-(Math.max(t + slabOff(z, wall, side) * sst(18, 90, wall) * (1 - 0.7 * gf) * (1 - plain), 16) - 16) / Wd));
        const step = 86, q = (wall + 36 * N.n2(z * 0.0045 + side * 7, 2.5)) / step, fl = Math.floor(q), fr = q - fl;   // glacial benches that rise, dip and die out along the wall
        wall = lerp(wall, wall + (sst(0.22, 0.8, fr) - fr) * step, 0.6 * sst(40, 140, wall) * (1 - gf) * (1 - 0.85 * plain) * sst(-0.5, 0.25, N.n2(z * 0.009 + fl * 3.1, side * 5 + fl)));
        wall += 16 * (N.ridged2(x * 0.011 + 5, z * 0.011, 2) - 0.35) * sst(30, 160, wall) + 0.22 * Math.max(0, t - 230);
        if (wall > 330) wall += 55 * N.fbm2(x * 0.0035, z * 0.0035 + 20, 2) * sst(330, 620, wall);
        for (const f of notches) {
          if (f.side !== side) continue;
          const dz = (z - f.z) / f.halfW; if (dz * dz > 7) continue;
          wall = smin(wall, f.lipY - 20 + dz * dz * 120 + 0.11 * Math.max(0, t - 30) + 7 * N.n2(x * 0.03, z * 0.03), 40);   // (a broad, round-shouldered notch: coarse cells far from the path can follow it)
        }
        h += wall;
        if (z < A.wing + 40 && d > 240) h += 18 * sst(A.wing + 40, A.wing - 10, z) * sst(240, 275, d);   // the valley walls rise a little over the ends of the head wall's wings and bury them
      }
      if (z < -250) {                                                // the summit beyond the fall's lip
        const k = sst(-250, -620, z) * Math.exp(-(((x - PK.x) / PK.w) ** 2));
        h = Math.max(h, PK.h * k * (0.78 + 0.3 * N.fbm2(x * 0.004 + 9, z * 0.004, 3)) + 90 * N.ridged2(x * 0.006, z * 0.006, 3) * k);
      }
      return h;
    }

    // the talus apron under the near cliff: 0..1, a band some 25 m wide in front of the face (the same t as wallAt, right side)
    const talusK = (x, z) => {
      if (x <= 0) return 0;
      const ap = cliffZone(z); if (ap <= 0) return 0;
      const t0 = x - hwR(z); if (t0 < -110 || t0 > 110) return 0;
      const t = t0 + (50 * N.fbm2(z * 0.0052 + 31 + V.o[2], x * 0.0016, 3) + 15 * N.n2(z * 0.021 + 9, x * 0.012) + 26 * (N.ridged2(z * 0.012 + 17, x * 0.002 + 3, 2) - 0.45)) * (1 - 0.75 * Math.exp(-(((z - zf) / 78) ** 2)));
      return ap * sst(-19, -9, t + 4 * N.n2(x * 0.07 + 2, z * 0.07));
    };

    // where each fall leaves the wall. All of the valley's falls run on every visit (the design's dozen, with the Great Fall and its strands):
    // one whose drawn place has no lip to leave, or less than a hundred metres to fall, is given another place on its wall from the falls'
    // own stream, as a strand off the rim after four tries
    const siteFall = (f) => {
      const sd = f.side, b0 = (sd > 0 ? hwR(f.z) : hwL(f.z)) - 70;
      const target = f.kind === 'hang' ? f.lipY - 30 : f.rimK * wallAt(sd * (b0 + 380), f.z);
      let x = b0; for (; x < b0 + 460; x += 1.5) if (wallAt(sd * x, f.z) >= target) break;
      f.x = sd * x; f.y = wallAt(f.x, f.z);
      f.ok = f.y >= target - 1 && f.y > 90 && (f.close || f.y - Math.max(10, wallAt(f.x - sd * 235, f.z) + 3) > 108);
    };
    for (const f of falls) {
      siteFall(f);
      await ctx.yield();
      for (let tries = 0; !f.ok && !f.close && tries < 10; tries++) {
        const z = RF.range(pz + 190, pz + 1090);
        if (falls.some((g) => g !== f && g.side === f.side && Math.abs(g.z - z) < (g.close ? 190 : 120))) continue;
        f.z = z;
        if (tries >= 4 && f.kind === 'hang') { f.kind = 'rim'; f.lipY = 0; f.w = Math.min(f.w, 5.5); f.v0 = Math.min(f.v0, 2); notches.splice(notches.indexOf(f), 1); }
        siteFall(f);
        await ctx.yield();
      }
    }
    const cf = falls[0];                                             // the close fall: a kit waterfall into its own basin
    {
      const probe = cf.x - cf.v0 * Math.sqrt((2 * (cf.y - 5)) / GRAV);
      basin.y = clamp(wallAt(probe - 16, zf) - 0.6, 3, 7.5);
      cf.drop = cf.y - basin.y; cf.land = cf.x - cf.v0 * Math.sqrt((2 * cf.drop) / GRAV);
      basin.x = cf.land - 1; basin.on = true;
      trib.ax = basin.x - 9; trib.az = zf; trib.bz = zf + 16; trib.bx = rx(trib.bz) + 8;
      trib.len = Math.hypot(trib.bx - trib.ax, trib.bz - trib.az);
    }
    const mainHalf = (z) => (11.5 + 2.6 * N.n2(z * 0.011, 5.5)) * (1 - 0.22 * sst(isl.half * 1.1, isl.half * 0.4, Math.abs(z - isl.z)));
    const tribLevel = (q) => lerp(basin.y, WATER_Y, sst(0.08, 0.96, q));

    function ground(x, z) {
      let h = wallAt(x, z);
      if (Math.abs(x) < 190) {                                       // rivers, the hero's pool and outflow: keep the bed under the water
        let e = 1e9;
        if (z >= zs - 4 && z <= mainTab.z1) e = Math.abs(x - mainTab.at(z)) - mainHalf(z);
        if (z <= RC.z1 && z >= RC.z0 - 30) { const q = clamp((z - RC.z0) / (RC.z1 - RC.z0), 0, 1); e = Math.min(e, Math.abs(x - RC.xAt(z)) - (lerp(RC.w0, RC.w1, Math.sqrt(q)) * 0.5 + 1.5)); }
        if (z >= braidTab.z0 && z <= braidTab.z1) e = Math.min(e, Math.abs(x - braidTab.at(z)) - 6.5 * sst(0, 14, Math.min(z - braidTab.z0, braidTab.z1 - z) + 6));
        if (z < POOL.z + POOL.rz * 1.3) e = Math.min(e, (Math.hypot((x - POOL.x) / POOL.rx, (z - POOL.z) / POOL.rz) - 1.05) * Math.min(POOL.rx, POOL.rz));
        if (e < 5) h = lerp(-2.3, h, sst(-4, 5, e));
        if (basin.on && Math.abs(z - zf) < 60) {
          const db = Math.hypot(x - basin.x, z - basin.z);
          if (db < basin.r + 16) h = Math.min(h, lerp(basin.y - 1.5, h, sst(basin.r - 4, basin.r + 16, db)));
          const ux = (trib.bx - trib.ax) / trib.len, uz = (trib.bz - trib.az) / trib.len, q = clamp(((x - trib.ax) * ux + (z - trib.az) * uz) / trib.len, 0, 1);
          const dt = Math.hypot(x - (trib.ax + ux * q * trib.len), z - (trib.az + uz * q * trib.len));
          if (dt < 15) h = Math.min(h, lerp(tribLevel(q) - 1.1, h, sst(6.5, 15, dt)));
        }
      }
      return h;
    }

    // ---------- the flight ----------
    const ez = pz + 1012, ex = rx(ez) - 14;
    const passX = cf.land - 43;                                      // 40 m from the side fall's sheet
    const path = makePath([
      [ex, 24, ez],                                                  // entry: beside the river, aimed straight at the Great Fall
      [lerp(ex + (px - ex) * (112 / (ez - pz)), passX, 0.035), 24.5, ez - 112],
      [passX, 24, zf + 30],
      [lerp(passX, isl.x, 0.6), 29, pz + 640],
      [isl.x + 2, 35.5, isl.z + 78],
      [isl.x, 40, isl.z - 38],
      [px + 3, 27, pz + 240], [px, 14, pz + 150], [px, 12, pz + 120], [px, 12, pz + 60], [px, 12, pz],
    ]);
    // How deep a pool of cumulus shade is, for every lit material alike (the pools' places, shapes, drift and clouds are the
    // lattice's, untouched): 0.6 of the written depth, a number of this version's own. Live writes the same depth (R.range(0.9, 1))
    // over a soft field of noise that can reach it whole; over the river's flown reach through the flight's 46 s that field happens
    // to shade no deeper than 0.62 to 0.67 (seeds 7, 3, 11, 21). These pools have flat floors that reached the whole written depth
    // on a tenth to a third of the ground, and the firs inside them went black.
    CS.cloud.value.w *= 0.6;
    await ctx.yield();

    // ---------- terrain ----------
    const gA = C('#3f7a3a').lerp(C('#4a6a3c'), 0.3), gB = C('#6a8a3e').lerp(C('#4a6a3c'), 0.15), gWarm = C('#b9a58c'), gDry = C('#8b8a4e'), gScree = C('#868a84'), gRock = C('#8d949c').multiplyScalar(0.9),
      gGravel = C('#9d9a8b'), gBed = C('#3c5852'), gMoss = C('#4c6b3a');
    const gEarth = C('#3d3226'), gTalus = C('#aaa89d'), gYel = C('#d9c24a'), gPink = C('#ff78cc'), gBar = C('#b3ae9c');
    // where the wildflowers stand: broad drifts (also read by the flower scatter), yellow or pink by the patch
    const drift = (x, z) => sst(0.02, 0.42, N.n2(x * 0.012 + 9, z * 0.012 - 5) + 0.45 * N.n2(x * 0.03 + 9, z * 0.03 - 5));
    const pinkAt = (x, z) => N.n2(x * 0.007 + 40, z * 0.007) * 0.5 + 0.5 < V.pink;
    const inNotch = (x, z, h) => { for (const f of notches) if ((x > 0) === (f.side > 0) && Math.abs(z - f.z) < f.halfW * 1.25 && h > f.lipY - 70 && h < f.lipY + 240) return true; return false; };
    function groundColor(x, z, h, ny, out) {
      const n1 = N.n2(x * 0.006 + 11, z * 0.006 - 4) + 0.5 * N.n2(x * 0.02 + 3, z * 0.02 + 17);
      out.copy(gA).lerp(gB, sst(-0.6, 0.8, n1)).lerp(gDry, 0.6 * sst(0.0, 0.9, N.n2(x * 0.013 - 20, z * 0.013 + 6)));
      if (h < 24) {                                                  // the meadow, seen from 40 m up: a quilt of flower drifts, gravel bars and old channels
        const fl = drift(x, z) * sst(22, 9, h) * sst(1.2, 2.4, h - WATER_Y);
        if (fl > 0.01) { if (pinkAt(x, z)) out.lerp(gPink, 0.1 * fl * fl); else out.lerp(gYel, (0.22 + 0.08 * N.n2(x * 0.09, z * 0.09 + 30)) * fl); }   // a glow under the flowering tufts (see gTuft)
        if (z > zs - 4 && z < mainTab.z1) {
          const xr = mainTab.at(z), dr = Math.abs(x - xr) - mainHalf(z), sd = x > xr ? 1 : -1;
          if (dr < 16) out.lerp(gBar, 0.72 * sst(13, 2, dr - 6 * N.n2(z * 0.03, sd * 3.3)) * sst(-0.25, 0.3, N.n2(z * 0.013 + 5, sd * 1.7 + 9)));   // point bars on alternate banks
          const oc = Math.abs(x - xr - sd * (30 + 16 * N.n2(z * 0.008, sd * 2.2 + 4))) - 2.2 - 1.6 * N.n2(z * 0.05, 7.7);
          if (oc < 3) out.lerp(gBar, 0.5 * sst(3, 0, oc) * sst(0, 0.35, N.n2(z * 0.006 + sd * 11, 3.1)));                 // dry side channels
        }
        if (basin.on && Math.abs(z - zf) < 50 && x > trib.bx - 14) {                 // gravel round the side fall's basin and along its stream
          const ux = (trib.bx - trib.ax) / trib.len, uz = (trib.bz - trib.az) / trib.len, q = clamp(((x - trib.ax) * ux + (z - trib.az) * uz) / trib.len, 0, 1);
          const dt = Math.min(Math.hypot(x - (trib.ax + ux * q * trib.len), z - (trib.az + uz * q * trib.len)) - 3, Math.hypot(x - basin.x, z - basin.z) - basin.r);
          if (dt < 9) out.lerp(gBar, 0.75 * sst(9, 2, dt + 3 * N.n2(x * 0.08, z * 0.08)));
        }
      }
      out.lerp(gScree, 0.8 * sst(28, 72, h + 14 * n1)).lerp(gRock, sst(95, 190, h));
      const tk = h < 70 ? talusK(x, z) : 0;                          // under the near cliff the meadow ends at a talus apron, with a clean edge
      if (tk > 0) out.lerp(gScree, 0.85 * tk).lerp(gTalus, 0.5 * tk * sst(-0.3, 0.4, N.n2(x * 0.19 + 7, z * 0.19)));   // (with patches of paler, fresher rubble)
      if (h > 60 && ny > 0.8 && !(x > 0 && h < 150 && Math.abs(z - zf) < 110) && !inNotch(x, z, h)) out.lerp(gMoss, 0.55 * sst(0.8, 0.96, ny) * sst(520, 380, h));   // (not on the sheer face beside the close fall, nor in a fall's notch, where a coarse cell lies flat and showed as a green fin)
      if (h > 40 && x > 0) out.lerp(gWarm, 0.2 * sst(40, 150, h));                // the sunlit wall
      out.multiplyScalar(1 + 0.13 * N.n2(x * 0.05 + 5, z * 0.05 + 70));
      const d = h - WATER_Y;
      if (d < 2.8) {                                                 // a cut bank: dark wet earth under the turf, pale cobbles at the waterline, both broken along the bank (an even band was a brown smear)
        const bn = N.n2(x * 0.5, z * 0.5), bw = N.n2(x * 0.11 + 7, z * 0.11 - 3);
        out.lerp(gEarth, 0.62 * sst(2.5 + 0.3 * bw, 1.5, d + 0.5 * bn) * sst(0.2, 0.9, d + 0.3 * bn));
        out.lerp(gGravel, sst(1.35 + 0.35 * bw, 0.45, d + 0.5 * bn));
      }
      if (d < 0) out.lerp(gBed, 1 - Math.exp(d / 1.1));
      return out;
    }
    // mesh detail follows the path (which runs monotonically along -Z) and the side fall's cliff
    const pathTab = courseTable({ getPoint: (t, out) => path.pointAt(1 - t, out) }, 400), zP0 = path.end.z, zP1 = path.start.z;
    const lodFalls = falls.filter((f) => f.ok && !f.close && !(f.side > 0 && cliffZone(f.z) > 0.5));   // the notches of the falls that stand on the heightfield itself get finer cells
    const lodDist = (x, z) => {
      const zc = z < zP0 ? zP0 : z > zP1 ? zP1 : z, ax = x - pathTab.at(zc), az = z - zc, bx = x - (cf.x - 12), bz = z - zf;
      let d = Math.min(Math.sqrt(ax * ax + az * az), 1.6 * Math.sqrt(bx * bx + bz * bz));
      for (let i = 0; i < lodFalls.length; i++) { const f = lodFalls[i], fx_ = x - f.x, fz = z - f.z, q = fx_ * fx_ + fz * fz; if (q < (d - 20) * (d - 20) && d > 20) d = 20 + Math.sqrt(q); }
      return d;
    };
    const Z_OUT = pz + 1560;
    // (the kit's default bed relief + seams draw hard black lines on bed boundaries when a cliff is seen from 40 m: soften both)
    const strata = T.makeStrata ? T.makeStrata({ rng: R.fork('strata'), rock: '#8d949c', rockB: '#6c727b', thickness: R.range(11, 18), base: WATER_Y, seams: 0.1, contrast: 0.8 }) : undefined;
    const landOpts = { rng: R.fork('land'), strata, noise: N, path, height: ground, bounds: [-640, -760, 640, Z_OUT],
      corridor: { clearance: 8, width: 14, slope: 0.6 }, cell: 5, near: 48, levels: 5, focus: lodDist, refine: 1, refineTolerance: 0.1, maxTriangles: 46000,   // (the near cliff carries the close wall)
      color: groundColor, waterLevel: WATER_Y, heightRange: [0, 1000], sunDir: S, shadow: 0.5, shadowSoftness: 0.22, ao: 0.45,   // (no shared detailTexture: makeTerrainAsync then paints its own in short steps)
      biome: 'alpine', palette: { rock: '#8d949c', rockB: '#6c727b', rockSlope: [0.6, 0.8], strata: 0.12, strataScale: 14, bedRelief: 0.12, joints: 0, varnish: 0.22,   // (joints and bed-keyed varnish tile the walls into masonry at this scale)
        detail: 0.85, bump: 1.1, streaks: 0.35,   // (the kit's streaks smear into wax on a 700 m wall: the granite painted by addCloudShadow carries the faces)
        snow: '#f4f7fa', snowLine: V.snow + 0.14, snowBlend: 0.04, snowNoise: 0.1, patch: '#c9c48a', patchAmount: 0.3 } };
    const land = T.makeTerrainAsync ? await T.makeTerrainAsync(landOpts, ctx.yield) : T.makeTerrain(landOpts);
    scene.add(land.object);
    addCloudShadow(land.material, CS, 'terrain');
    updaters.push(land);
    const hAt = land.heightAt;
    await ctx.yield();

    // ---------- where the left wall's shadow lies (for everything that is not the terrain mesh) ----------
    // Hs(x,z) = height above which a point sees the sun; swept row by row toward -Z (away from the sun).
    const SH = { x0: -420, x1: 420, z0: -60, z1: Z_OUT - 20, c: 24 };
    SH.nx = Math.round((SH.x1 - SH.x0) / SH.c); SH.nz = Math.round((SH.z1 - SH.z0) / SH.c);
    SH.dx = (SH.x1 - SH.x0) / SH.nx; SH.dz = (SH.z1 - SH.z0) / SH.nz;
    const shF = new Float32Array((SH.nx + 1) * (SH.nz + 1)).fill(-1e4), hGrid = new Float32Array((SH.nx + 1) * (SH.nz + 1));   // (the ground heights of the same grid are kept: scatter callbacks read them instead of the terrain function)
    {
      const dzr = SH.dz, dxr = SH.dx, shift = (S.x / S.z) * dzr / dxr, rise = (S.y / S.z) * dzr;
      let prevH = new Float32Array(SH.nx + 1), curH = new Float32Array(SH.nx + 1);
      for (let i = 0; i <= SH.nx; i++) hGrid[SH.nz * (SH.nx + 1) + i] = prevH[i] = hAt(SH.x0 + i * dxr, SH.z1);
      for (let j = SH.nz - 1; j >= 0; j--) {
        const z = SH.z0 + j * dzr, row = j * (SH.nx + 1), up = (j + 1) * (SH.nx + 1);
        for (let i = 0; i <= SH.nx; i++) {
          const f = clamp(i + shift, 0, SH.nx - 1e-3), a = Math.floor(f), t = f - a;
          const hs = Math.max(lerp(shF[up + a], shF[up + a + 1], t), lerp(prevH[a], prevH[a + 1], t)) - rise;
          shF[row + i] = hs; hGrid[row + i] = curH[i] = hAt(SH.x0 + i * dxr, z);
        }
        const sw = prevH; prevH = curH; curH = sw;
        if (j % 2 === 0) await ctx.yield();
      }
    }
    const gridAt = (g, x, z) => {
      const fx_ = clamp((x - SH.x0) / SH.dx, 0, SH.nx - 1e-3), fz = clamp((z - SH.z0) / SH.dz, 0, SH.nz - 1e-3), i = Math.floor(fx_), j = Math.floor(fz), u = fx_ - i, v = fz - j, k = j * (SH.nx + 1) + i;
      return lerp(lerp(g[k], g[k + 1], u), lerp(g[k + SH.nx + 1], g[k + SH.nx + 2], u), v);
    };
    const hG = (x, z) => gridAt(hGrid, x, z);                        // ground height from the 24 m grid (cheap; for density and shade callbacks)
    const sunAt = (x, y, z) => { const hs = gridAt(shF, x, z); return sst(hs - 5, hs + 9, y); };   // 0 in the wall's shadow .. 1 in sun
    const shadeRGB = [1, 1, 1];
    const shadeAtGround = (x, z) => { const s = sunAt(x, hG(x, z) + 4, z); shadeRGB[0] = lerp(0.68, 1, s); shadeRGB[1] = lerp(0.76, 1, s); shadeRGB[2] = lerp(0.95, 1, s); return shadeRGB; };   // shade on the meadow is blue air, not darkness

    // ---------- the cliffs: the right wall where the camera passes it, as real relief ----------
    // A heightfield cannot carry a cliff: its triangles stand 100 m tall on a sheer face, so the wall was a smooth sheet with
    // lines drawn on it. Here the face is its own grid over (z, height), standing a few metres proud of the heightfield, pushed
    // in and out by the same beds the granite paint draws (GRANITE: roofs that overhang, ledges that stand proud), by slabs that
    // meet in corners, by jointed blocks and chimneys. It wears the terrain's material, so paint, light and cloud shadow are one.
    // Two grids: the near cliff beside the side fall (fine: the camera passes at 40 m) and the up-valley cliff from there to the
    // head wall's wing (coarser: the flight passes it at 150 m and more). Each sinks into the heightfield at its
    // ends; where they meet the up-valley one stands a little behind and sinks under the near one.
    const sAt = land.surfaceAt || hAt;                              // the drawn mesh (also handed to the kit's scatters, shadows and herds: cheaper than the height function)
    const cliff = { foot: [], ledges: [], faces: [], outerX: (z, y, halfW) => { let x = Infinity; for (const f of cliff.faces) x = Math.min(x, f(z, y, halfW)); return x; } };
    const cHash = (i, j, k) => { const t = Math.sin(i * 127.1 + j * 311.7 + k * 74.7 + V.o[1]) * 43758.5453; return t - Math.floor(t); };
    let cSoft = 0;                                                  // 0 on the near cliff, 1 on the up-valley cliff away from their seam: rounder slabs, shallower blocks (its grid is coarse, and sharp corners on it are hard panels)
    const slabCT = cellTable(cHash, 160, 96, 40, 24, 11, 36 * 0.24, 84 * 0.07), slabCc = slabCT.c;
    const slabC = (al, y) => {                                     // slabs 36 m along and 84 m up: tilted planes that meet in corners
      const su = al / 36, sv = y / 84 + su * 0.3, iu = Math.floor(su), iv = Math.floor(sv);
      let best = 1e9, second = 1e9, vB = 0, vS = 0;
      for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) {
        const k = slabCT.at(iu + a, iv + b), dx = su - slabCc[k], dy = sv - slabCc[k + 1], dd = dx * dx + dy * dy;
        if (dd >= second) continue;
        const v = slabCc[k + 2] + dx * slabCc[k + 3] + dy * slabCc[k + 4];
        if (dd < best) { second = best; vS = vB; best = dd; vB = v; } else { second = dd; vS = v; }
      }
      return lerp(0.5 * (vB + vS), vB, sst(0, lerp(0.14, 0.7, cSoft), Math.sqrt(second) - Math.sqrt(best)));
    };
    const blk = {};
    const blkOff = (ji, course) => { const h = cHash(ji, course, 11); return h < 0.24 ? -2.4 - 2.4 * cHash(ji, course, 13) : 2.6 * (h - 0.62); };   // one block in four has fallen away and left a niche 2.5-5 m deep; the rest stand a metre in or out
    const bedK = (b) => 0.62 + 1.05 * cHash(b, 3, 21);                // a roof or a ledge is 2 to 5.3 m deep
    const bedTab = new Float64Array(192).fill(NaN);                   // per bed: its kind (roof 1, ledge -1, none 0) times its depth factor
    const bedKK = (b) => { const k = b + 32; if (k < 0 || k >= 192) return GRANITE.kind(b) * bedK(b); if (bedTab[k] !== bedTab[k]) bedTab[k] = GRANITE.kind(b) * bedK(b); return bedTab[k]; };
    const bedD = (al, bi, bf) => { const b1 = 1 - bf, kA = bedKK(bi), kB = bedKK(bi + 1);
      return GRANITE.D * ((kA > 0 ? kA * GRANITE.str(bi, al) * b1 * Math.sqrt(b1) : 0) + (kB < 0 ? -kB * GRANITE.str(bi + 1, al) * bf * Math.sqrt(bf) : 0)); };
    const relief = (al, y, bi, bf) => {
      GRANITE.block(al, y, bi, blk);
      const h = blkOff(blk.ji, blk.course), hn = blkOff(blk.jb === blk.ji ? blk.ji - 1 : blk.ji + 1, blk.course);
      let r = slabC(al, y) + bedD(al, bi, bf) + lerp(0.5 * (h + hn), h, sst(0, 2.4, blk.jd)) * (1 - 0.6 * cSoft);   // (a block's step is spread over a column or two: a corner, not a saw-tooth)
      if (cHash(blk.jb, blk.course, 12) > 0.6) r -= 1.5 * (1 - cSoft) * sst(3.4, 0.6, blk.jd);                  // a chimney in some joints
      return r + 0.9 * N.n2(al * 0.05, y * 0.05 + 7) + 0.3 * N.n2(al * 0.21, y * 0.21);
    };
    const cTop = C('#a39f8c'), cMoss = C('#566b3c');
    // o: { z0, z1, y0, y1, lattice (m, the grid the drawn wall is found on), step(z) column spacing, rows(yMid) rows per bed, facet(yMid) how far inside its bed a
    // boundary row lies (share of the bed), base (m proud of the heightfield), rays (self-shadow samples, m along the key), name }
    async function buildCliff(o) {
      const wetFalls = falls.filter((f) => f.side > 0 && f.ok && f.z > o.z0 + 30 && f.z < o.z1 - 30);
      // (1) where the drawn wall is: the first crossing of each height, marching in from the valley, on a lattice of o.lattice metres
      const KC = Math.round((o.z1 - o.z0) / o.lattice), MC = Math.round((o.y1 - o.y0) / o.lattice), W1 = KC + 1, cz = (o.z1 - o.z0) / KC, cy = (o.y1 - o.y0) / MC;
      const cbx = new Float32Array(W1 * (MC + 1)), cby = new Float32Array(W1 * (MC + 1)), cbv = new Float32Array(W1 * (MC + 1));
      for (let k = 0; k <= KC; k++) {
        const z = o.z0 + k * cz, xa = hwR(z) - 64, xb = xa + 400;
        let x = xa;
        for (let m = 0; m <= MC; m++) {
          const y = o.y0 + m * cy, i = m * W1 + k;
          let a = Math.max(xa, x - 3), ok = false;
          if (sAt(a, z) < y) for (; a < xb; a += 3) if (sAt(a + 3, z) >= y) { ok = true; break; }
          if (ok) { let b = a + 3; for (let it = 0; it < 5; it++) { const mid = (a + b) * 0.5; if (sAt(mid, z) >= y) b = mid; else a = mid; } x = (a + b) * 0.5; }
          cbx[i] = x; cby[i] = y; cbv[i] = ok ? 1 : 0;
        }
        await ctx.yield();
      }
      // (2) a face only where the wall is steep. Below its lowest face a column runs straight down into the talus; above a face
      // that ends at a bench or at the hanging valley's floor the grid folds in under the lip and stays there
      for (let k = 0; k <= KC; k++) {
        for (let m = 0; m <= MC; m++) {
          const i = m * W1 + k;
          if (cbv[i] === 0) continue;
          const run = m > 0 && cbv[i - W1] > 0 ? cbx[i] - cbx[i - W1] : m < MC && cbv[i + W1] > 0 ? cbx[i + W1] - cbx[i] : 99;
          if (run > cy * 1.25) cbv[i] = 0.5;                           // found, but on a slope gentler than about 40 degrees
        }
        let lastX = NaN, lastY = 0;
        for (let m = 0; m <= MC; m++) {
          const i = m * W1 + k;
          if (cbv[i] === 1) {
            if (Number.isNaN(lastX)) { for (let q = 0; q < m; q++) { cbx[q * W1 + k] = cbx[i]; cbv[q * W1 + k] = 1; } cliff.foot.push([cbx[i], o.z0 + k * cz, cby[i], o.sparse ? 1 : 0]); }
            lastX = cbx[i]; lastY = cby[i];
          } else if (!Number.isNaN(lastX)) { cbx[i] = lastX + 8; cby[i] = lastY - 3.5; cbv[i] = 0; }
        }
        if (Number.isNaN(lastX)) for (let m = 0; m <= MC; m++) { cbx[m * W1 + k] += 12; cby[m * W1 + k] = -6; cbv[m * W1 + k] = 0; }
        if (k % 16 === 15) await ctx.yield();
      }
      await ctx.yield();
      for (let m = 0; m <= MC; m++) for (let k = 0; k <= KC; k++) cby[m * W1 + k] -= o.y0 + m * cy;   // (from here on: how far a folded node was lowered)
      // (3) the grid. Columns: o.step(z) apart. Rows: laid along the beds, not level, with a row just under and a row just over
      // every bed boundary, so a roof or a ledge is one clean facet and never a staircase.
      const zs = [], rb = [], rf = [];
      for (let z = o.z0 + 24; z < o.z1 - 24; z += o.step(z)) zs.push(z);
      let wLo = 1e9, wHi = -1e9;
      for (let i = 0; i < zs.length; i += 4) { const w = GRANITE.warp(zs[i] + 0.3 * (hwR(zs[i]) + 30), 100); wLo = Math.min(wLo, w); wHi = Math.max(wHi, w); }
      for (let bi = Math.floor((wLo - 22) / 15); bi <= Math.floor((o.y1 + wHi + 22) / 15); bi++) {
        const yMid = bi * 15 + 7 - 0.5 * (wLo + wHi), n = o.rows(yMid), e0 = o.facet(yMid);
        for (let q = 0; q < n; q++) { rb.push(bi); rf.push(e0 + (1 - 2 * e0) * (q / (n - 1))); }   // (the two rows at a boundary stand a metre apart, 1.6 m low on the near cliff: at 0.45 m the underside of a roof was thinner than a pixel from across the meadow and drew as a dotted line)
      }
      const nz = zs.length, nr = rb.length, nv = nz * nr, P = new Float32Array(nv * 3), Rf = new Float32Array(nv), Vf = new Float32Array(nv);
      await ctx.yield();
      for (let i = 0; i < nz; i++) {
        const z = zs[i], fk = clamp((z - o.z0) / cz, 0, KC - 1e-3), k = Math.floor(fk), tk = fk - k;
        const eZ = sst(o.z0 + 26, o.z0 + 62, z) * sst(o.z1 - 26, o.z1 - 62, z), al0 = z + 0.3 * (hwR(z) + 30);
        cSoft = o.sparse ? sst(CLN.z0 + 60, CLN.z0 - 20, z) : 0;
        let chute = 0, chuteY = 0;                                   // the water has worn a slot under each fall: nothing stands in the way of the falling sheet
        for (const f of wetFalls) { const c = sst(f.w * 0.75 + 12, f.w * 0.75 + 2, Math.abs(z - f.z)); if (c > chute) { chute = c; chuteY = f.y; } }
        let offPrev = o.base, biPrev = 1e9;
        for (let r = 0; r < nr; r++) {
          const bi = rb[r], bf = rf[r], yb = (bi + bf) * 15, v = i * nr + r;
          // (the search starts from the row below when it lies in the same bed: two rounds then land where three did from a cold start)
          let y = yb - GRANITE.warp(al0, yb - 0.5 * (wLo + wHi)), off = bi === biPrev ? offPrev : o.base, bx = 0, dl = 0, vis = 0;
          for (let it = 0; it < o.iters; it++) {                     // the paint reads the face where it ends up, so the point is found on the moved face
            const yc = y < o.y0 ? o.y0 : y > o.y1 ? o.y1 : y, fm0 = (yc - o.y0) / cy, fm = fm0 < 0 ? 0 : fm0 > MC - 1e-3 ? MC - 1e-3 : fm0, m = Math.floor(fm), tm = fm - m, a = m * W1 + k;
            const x0 = cbx[a] + (cbx[a + 1] - cbx[a]) * tk, x1 = cbx[a + W1] + (cbx[a + W1 + 1] - cbx[a + W1]) * tk; bx = x0 + (x1 - x0) * tm;
            if (it === o.iters - 1) {
              dl = lerp(lerp(cby[a], cby[a + 1], tk), lerp(cby[a + W1], cby[a + W1 + 1], tk), tm);
              vis = lerp(lerp(cbv[a], cbv[a + 1], tk), lerp(cbv[a + W1], cbv[a + W1 + 1], tk), tm);
            }
            off = Math.max(1.2, o.base + relief(z + 0.3 * (bx - off), y, bi, bf));
            y = yb - GRANITE.warp(z + 0.3 * (bx - off), y);
          }
          offPrev = off; biPrev = bi;
          vis = sst(0.3, 0.9, vis);
          const yc = y < -3 ? -3 : y > o.y1 ? o.y1 : y, e = eZ * sst(o.y1, o.y1 - 64, yc);
          if (chute > 0) off = lerp(off, Math.min(off, Math.max(0.3, 2.5 * Math.sqrt(Math.max(0, chuteY - yc) * 0.2) - 0.8)), chute);
          off = lerp(-5, off * vis, e);
          P[v * 3] = bx - off; P[v * 3 + 1] = yc + dl - 4 * (1 - e); P[v * 3 + 2] = z; Rf[v] = off; Vf[v] = vis * e;
        }
        if (i % 3 === 2) await ctx.yield();
      }
      // (4) normals, baked light and colours, in the form the terrain's material reads (color, aShade = sun, ambient)
      const nor = new Float32Array(nv * 3), col = new Float32Array(nv * 3), shd = new Float32Array(nv * 2), hid = new Uint8Array(nv), shOut = {};
      // the face's own shadows: from every point a few short rays toward the key light, tested against the face itself, so a roof
      // darkens the two or three metres under it and a block that stands proud shades the corner behind it. The result is
      // smoothed along the rows and along the columns: at grazing light the raw test flips from one mesh row or column to the
      // next, and a shadow's edge was a row of dots
      const lit = new Float32Array(nv), TS = o.rays, nT = TS.length;
      let fq = 0;                                                    // the row the last lookup ended on: the next one starts there
      const faceX = (i, y) => {                                      // the face's x in column i at height y
        let q = fq < nr - 2 ? fq : nr - 2; const b = i * nr;
        while (q < nr - 2 && P[(b + q + 1) * 3 + 1] <= y) q++;
        while (q > 0 && P[(b + q) * 3 + 1] > y) q--;
        fq = q;
        const ya = P[(b + q) * 3 + 1], yb = P[(b + q + 1) * 3 + 1], xa = P[(b + q) * 3];
        if (yb - ya <= 1e-3) return xa;
        const t = (y - ya) / (yb - ya);
        return xa + (P[(b + q + 1) * 3] - xa) * (t < 0 ? 0 : t > 1 ? 1 : t);
      };
      for (let i = 0; i < nz; i++) {
        for (let r = 0; r < nr; r++) {
          const v = i * nr + r, x = P[v * 3], y = P[v * 3 + 1], z = P[v * 3 + 2];
          let occ = 0, sum = 0, ic = i; fq = r;
          for (let k = 0; k < nT; k++) {
            const t = TS[k], qz = z + KEY.z * t, qy = y + KEY.y * t;
            while (ic < nz - 2 && zs[ic + 1] <= qz) ic++;
            while (ic > 0 && zs[ic] > qz) ic--;
            const tz0 = (qz - zs[ic]) / (zs[ic + 1] - zs[ic]), tz = tz0 < 0 ? 0 : tz0 > 1 ? 1 : tz0;
            const fa = faceX(ic, qy), fxq = fa + (faceX(ic + 1, qy) - fa) * tz;
            const oc0 = (x + KEY.x * t - fxq - 0.3) / (0.5 + 0.1 * t), oc = oc0 < 0 ? 0 : oc0 > 1 ? 1 : oc0;
            if (oc > occ) occ = oc; sum += oc;
          }
          lit[v] = 1 - (0.6 * occ + 0.4 * sum / nT);                 // (any ray that is blocked shades the point; how many are says how deep in shade it is)
        }
        if (i % 4 === 3) await ctx.yield();
      }
      {
        const tmp = new Float32Array(nv);
        for (let pass = 0; pass < 2; pass++) {
          for (let i = 0; i < nz; i++) {                             // 1-2-1 up and down each column
            const b = i * nr;
            for (let r = 0; r < nr; r++) tmp[b + r] = 0.25 * lit[b + (r > 0 ? r - 1 : 0)] + 0.5 * lit[b + r] + 0.25 * lit[b + (r < nr - 1 ? r + 1 : r)];
          }
          await ctx.yield();
          for (let i = 0; i < nz; i++) {                             // and along each row
            const b = i * nr, bl = (i > 0 ? i - 1 : 0) * nr, br = (i < nz - 1 ? i + 1 : i) * nr;
            for (let r = 0; r < nr; r++) lit[b + r] = 0.25 * tmp[bl + r] + 0.5 * tmp[b + r] + 0.25 * tmp[br + r];
          }
          await ctx.yield();
        }
      }
      const cc = new THREE.Color();
      for (let i = 0; i < nz; i++) {
        const i0 = Math.max(i - 1, 0), i1 = Math.min(i + 1, nz - 1), i2 = Math.max(i - 2, 0), i3 = Math.min(i + 2, nz - 1);
        for (let r = 0; r < nr; r++) {
          const r0 = r > 0 && rb[r - 1] === rb[r] ? r - 1 : r, r1 = r < nr - 1 && rb[r + 1] === rb[r] ? r + 1 : r, v = i * nr + r;   // (within its own bed: the lip of a roof is a hard edge)
          const a = (i1 * nr + r) * 3, b = (i0 * nr + r) * 3, c = (i * nr + r1) * 3, d = (i * nr + r0) * 3;
          const ux = P[a] - P[b], uy = P[a + 1] - P[b + 1], uz = P[a + 2] - P[b + 2], wx = P[c] - P[d], wy = P[c + 1] - P[d + 1], wz = P[c + 2] - P[d + 2];
          let nx = uy * wz - uz * wy, nY = uz * wx - ux * wz, nZ = ux * wy - uy * wx; const l = Math.sqrt(nx * nx + nY * nY + nZ * nZ);
          if (l > 1e-6) { nx /= l; nY /= l; nZ /= l; } else { nx = -1; nY = 0; nZ = 0; }
          nor[v * 3] = nx; nor[v * 3 + 1] = nY; nor[v * 3 + 2] = nZ;
          const x = P[v * 3], y = P[v * 3 + 1], z = P[v * 3 + 2];
          const cav = Rf[v] - 0.25 * (Rf[i2 * nr + r] + Rf[i3 * nr + r] + Rf[i * nr + Math.max(r - 3, 0)] + Rf[i * nr + Math.min(r + 3, nr - 1)]);
          land.shadeAt(x, z, shOut);
          shd[v * 2] = Math.max(shOut.sun ?? 1, sst((shOut.top ?? 0) - 1, (shOut.top ?? 0) + 7, y)) * (0.08 + 0.92 * lit[v]);
          shd[v * 2 + 1] = clamp(0.92 + 0.07 * cav, 0.5, 1) * (0.72 + 0.28 * sst(-0.5, 0.2, nY)) * (0.86 + 0.14 * lit[v]);     // hollows and the undersides of roofs sit in their own shade
          cc.copy(gRock).lerp(cTop, sst(0.45, 0.75, nY)).lerp(cMoss, sst(0.6, 0.85, nY) * sst(-0.1, 0.35, N.n2(z * 0.06, y * 0.06 + 40)) * 0.8);
          col[v * 3] = cc.r; col[v * 3 + 1] = cc.g; col[v * 3 + 2] = cc.b;
          hid[v] = Vf[v] < 0.02 || y < sAt(x, z) - 4 ? 1 : 0;            // folded away, or under the ground
        }
        // the two rows at a bed boundary (the underside of a roof, the top of a ledge: a facet a metre tall) take the same baked light:
        // that of the row beneath them (lit differently, or by their own mean, they drew the facet as a dark hairline that broke into
        // dashes). The soft shadow under a roof is carried by the rows below it and by the paint
        for (let r = 0; r < nr - 1; r++) {
          if (rb[r + 1] === rb[r]) continue;
          const a = (i * nr + r) * 2, b = r > 0 && rb[r - 1] === rb[r] ? a - 2 : a;
          const sunM = b === a ? 0.5 * (shd[a] + shd[a + 2]) : shd[b], ambM = b === a ? 0.5 * (shd[a + 1] + shd[a + 3]) : shd[b + 1];
          shd[a] = shd[a + 2] = sunM; shd[a + 1] = shd[a + 3] = ambM;
        }
        if (i % 4 === 3) await ctx.yield();
      }
      const ci = [];
      for (let i = 0; i < nz - 1; i++) {
        for (let r = 0; r < nr - 1; r++) {
          const a = i * nr + r, b = a + nr;
          if (hid[a] && hid[b] && hid[a + 1] && hid[b + 1]) continue;
          ci.push(a, b, a + 1, b, b + 1, a + 1);
        }
        if (i % 16 === 15) await ctx.yield();
      }
      await ctx.yield();
      const cg = new THREE.BufferGeometry();
      cg.setAttribute('position', new THREE.BufferAttribute(P, 3)); cg.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
      cg.setAttribute('color', new THREE.BufferAttribute(col, 3)); cg.setAttribute('aShade', new THREE.BufferAttribute(shd, 2));
      cg.setIndex(ci); cg.computeBoundingSphere();
      const cliffMesh = new THREE.Mesh(cg, land.material); cliffMesh.name = o.name; scene.add(cliffMesh);
      await ctx.yield();
      // (5) where a small tree can stand: on the top of a ledge (the facet between the row under a boundary and the row over it)
      for (let i = 2; i < nz - 2; i += 2) {
        if (wetFalls.some((f) => Math.abs(zs[i] - f.z) < f.w * 0.75 + 10)) continue;
        for (let r = 0; r < nr - 1; r++) {
          if (rb[r + 1] === rb[r]) continue;                             // (a ledge, or the floor of a niche)
          const v = i * nr + r, w = v + 1;
          if (Vf[v] < 0.99 || Vf[w] < 0.99 || hid[v] || P[v * 3 + 1] < 18) continue;
          if (P[w * 3] - P[v * 3] < 1.6) continue;                       // (a ledge at least 1.6 m deep here)
          cliff.ledges.push([lerp(P[v * 3], P[w * 3], 0.42), P[v * 3 + 1] - 0.3, P[v * 3 + 2]]);
        }
        if (i % 16 === 14) await ctx.yield();
      }
      // the face's outermost x across a ribbon's width at this height (Infinity where there is no face)
      const idx = (arr, val) => { let lo = 0, hi = arr.length - 1; while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (arr[mid] <= val) lo = mid; else hi = mid; } return lo; };
      cliff.faces.push((z, y, halfW) => {
        if (z < zs[0] || z > zs[nz - 1]) return Infinity;
        const i0 = idx(zs, z - halfW), i1 = Math.min(nz - 1, idx(zs, z + halfW) + 1); let x = Infinity;
        for (let i = i0; i <= i1; i++) {
          let lo = 0, hi = nr - 1; while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (P[(i * nr + mid) * 3 + 1] <= y) lo = mid; else hi = mid; }   // rows rise with their index
          for (let q = lo; q <= hi; q++) { const v = i * nr + q; if (Vf[v] > 0.5 && Math.abs(P[v * 3 + 1] - y) < 8) x = Math.min(x, P[v * 3]); }
        }
        return x;
      });
    }
    // (columns 2 m apart within 40 m of the side fall, where the flight passes at 40 m and looks along the face; 3 m by 70 m, 7 m at the ends)
    await buildCliff({ name: 'near-cliff', z0: CLN.z0, z1: CLN.z1, y0: 0, y1: 304, base: 9, iters: 2, lattice: 8, rays: [1.3, 3, 6.5, 13],
      step: (z) => 2 + sst(40, 70, Math.abs(z - zf)) + 4 * sst(70, 190, Math.abs(z - zf)), rows: (yMid) => (yMid < 96 ? 8 : yMid < 180 ? 5 : 4), facet: (yMid) => (yMid < 96 ? 0.055 : 0.035) });
    await ctx.yield();
    await buildCliff({ name: 'up-valley-cliff', sparse: true, z0: CL.z0, z1: CLN.z0 + 124, y0: 0, y1: 304, base: 8.3, iters: 2, lattice: 12, rays: [1.8, 4.5, 11],
      step: (z) => 6 + 2.5 * sst(CLN.z0 - 40, CLN.z0 - 220, z), rows: (yMid) => (yMid < 120 ? 4 : 3), facet: () => 0.035 });   // (the flight passes it at 150 m and more, over the tree island)
    await ctx.yield();

    // ---------- water: the braided river, the side fall and its stream ----------
    const time = { value: 0 };
    const L = Water.waterLight(sky);
    const zOfT = new THREE.Vector3();
    const mirror = { horizon: '#4f7fb8', mid: '#2f62a8' };          // rivers mirror the walls and the deep sky, not the pale horizon haze
    const river = Water.makeRiver({ rng: R.fork('river'), light: L, ...mirror, curve: mainCurve, segments: 500, across: 10, speed: 3.3, foam: 0.42, bankFoam: 0.6,
      deep: '#0c4a5c', shallow: '#5db4ad', width: (t) => { mainCurve.getPointAt(clamp(t, 0, 1), zOfT); return 2 * (mainHalf(zOfT.z) + 1.9); } });
    await ctx.yield();
    const braid = Water.makeRiver({ rng: R.fork('braid'), light: L, ...mirror, curve: braidCurve, across: 8, speed: 2.6, foam: 0.5, deep: '#0f5262', shallow: '#66bab0',
      width: (t) => 3 + 13.5 * sst(0, 0.14, t) * sst(1, 0.86, t) });
    await ctx.yield();
    // the side fall's stream wanders between rocks from the basin to the river: the kit river is its dark, fast bed (foam 1 and speed 6 make it rapids);
    // the white water on it is a ribbon of this world's own falling water, laid with the other ribbons below
    const tribZ = (q) => lerp(trib.az, trib.bz, q) + 4.2 * Math.sin(q * 7) * Math.sin(q * Math.PI);
    const tribPts = [[basin.x + 2, basin.y + 0.06, zf]];
    for (let k = 0; k <= 8; k++) { const q = k / 8; tribPts.push([lerp(trib.ax, trib.bx, q), tribLevel(q) + 0.05 + 0.18 * Math.sin(Math.PI * Math.min(1, q * 1.15)), tribZ(q)]); }   // (it rides a hand higher than its bed's gravel: half sunk, it was a pale strip that read as a path)
    tribPts.push([rx(trib.bz + 14) + 2, WATER_Y + 0.02, trib.bz + 15]);
    const stream = Water.makeRiver({ rng: R.fork('trib'), light: L, ...mirror, points: tribPts, across: 6, speed: 6, foam: 1.0, bankFoam: 0.8, deep: '#0a3f50', shallow: '#3f8f95', width: (t) => lerp(12, 7.4, sst(0, 0.3, t)) + 2.2 * Math.sin(t * 19) });
    await ctx.yield();
    // (the kit's sheets and mist ride in front of this world's own solid white ribbon, see below: strands and falling clumps over a body with weight)
    const sideFall = Water.makeWaterfall({ rng: R.fork('fall'), light: L, top: [cf.x + 0.5, cf.y + 0.5, zf], height: cf.y + 0.5 - (basin.y + 0.06), width: cf.w, dir: [-1, 0, 0], launch: cf.v0,
      rows: 44, lipLength: 9, tint: '#0f5464', density: 0.5, glow: 1.15, mistCount: Math.round(150 * Q), mistOpacity: 0.17, mistRise: 36, rainbow: 0, poolSize: 0.95 });   // (rainbow 0: the kit tints every mist sprite, which gave blotches of pink and blue; the fall's one clean arc is the hero's bow shader, below)
    river.object.name = 'river'; braid.object.name = 'braid'; stream.object.name = 'stream'; sideFall.object.name = 'side-fall';
    sideFall.object.renderOrder = 3;                                 // after the ribbons (a group's order comes first in the sort)
    for (const w of [river, braid, stream, sideFall]) { scene.add(w.object); updaters.push(w); }
    await ctx.yield();

    // ---------- the other falls: ribbons draped over the walls, one mesh ----------
    const fP = [], fA = [], fB = [], fL = [], fI = [], mistAt = [], cascadeRocks = []; let fN = 0;
    // (the ribbons are draped on the rendered mesh, not on the height function: far from the path the mesh is coarser than the
    // slabs in the function, and a ribbon laid on the function dips in and out of the drawn rock as white scraps)
    // where the drawn wall stands at height y (6 bisections from the row above: the wall only steps out as it goes down)
    const surfX = (f, y, from) => {
      let a = from, w = 12, b = a - f.side * w;
      while (w < 200 && sAt(b, f.z) >= y) { a = b; w *= 2; b = a - f.side * w; }
      for (let k = 0; k < 6; k++) { const m = (a + b) * 0.5; if (sAt(m, f.z) >= y) a = m; else b = m; }
      return (a + b) * 0.5;
    };
    const sxRow = [];
    // (the three numbers each ribbon draws come off the falls' own stream, three for every fall on the list whether it is built or not)
    for (const f of falls) { f.wob = RF.range(0, 50); f.thin = RF.range(0.5, 0.72); f.tau = RF.range(0, 9); }
    for (const f of falls) {
      if (!f.ok) continue;                                             // (the close fall gets a ribbon too: the white body behind the kit's sheets)
      const s = f.side, ncol = f.close ? 8 : 4, base = fN, dy = 4, wob = f.wob, thin = f.kind === 'hang' ? 1 : f.thin;
      const yEnd = f.close ? basin.y + 1.5 : Math.max(10, hAt(f.x - s * 235, f.z) + 3), faceLit = clamp((-s * 0.95 * S.x + 0.3 * S.y) * 1.5 + 0.25, 0.05, 1);
      let rows = 0, tau = f.tau, cX = f.x, cY = f.y, cv = f.v0 * (f.close ? 0.88 : 1), freeDrop = 0; const mist0 = mistAt.length;
      // the wall under the fall, row by row, then smoothed: a ribbon laid on the raw mesh kinks at every coarse triangle
      sxRow.length = 0;
      for (let y = f.y, from = f.x, n = 0; n < 220; y -= dy, n++) {
        let sx = surfX(f, y, from); from = sx;
        if (s > 0) sx = Math.min(sx, cliff.outerX(f.z, y, f.w * 0.6 + 1.5) + 1.6);      // on the near cliff: stand on its face, not on the heightfield behind it
        sxRow.push(sx);
        if (n % 6 === 5) await ctx.yield();
        if (y - dy < yEnd || Math.abs(sx - f.x) > 232) break;
      }
      for (let pass = 0; pass < 2; pass++) for (let r = 1, prev = sxRow[0]; r < sxRow.length - 1; r++) { const cur = sxRow[r]; sxRow[r] = 0.25 * prev + 0.5 * cur + 0.25 * sxRow[r + 1]; prev = cur; }
      for (let y = f.y; rows < sxRow.length; y -= dy) {
        const sx = sxRow[rows] - s * 2.6, ball = cX - s * cv * Math.sqrt((2 * Math.max(0, cY - y)) / GRAV);
        let x, free;
        if ((ball - sx) * s < 0) { x = ball; free = sst(0, 7, Math.abs(ball - sx)); freeDrop = cY - y; }
        else {
          x = sx; free = 0;
          if (freeDrop > 70) mistAt.push([x - s * 6, y + 9, f.z, clamp(freeDrop / 150, 0.5, 1.3)]);
          freeDrop = 0; cX = sx; cY = y; cv = Math.max(1.5, cv * 0.6);
        }
        tau += dy / (free > 0.5 ? clamp(Math.sqrt(2 * GRAV * (cY - y)) + 3, 7, 46) : 9);
        const drop = f.y - y, w = f.w * (1 + drop / (f.close ? 520 : 260)) * (0.82 + 0.18 * free) * (f.close ? 1 : lerp(0.5, 1, sst(0, 36, drop))), zc = f.z + 2.4 * N.n2(y * 0.013, wob) * Math.min(1, drop / 40);
        const lit = Math.max(f.close ? 0.62 : 0, faceLit * (0.25 + 0.75 * sunAt(x, y, zc)));   // (the fall the camera passes is white water even when the wall's own shadow lies on it)
        for (let i = 0; i <= ncol; i++) {
          const cc = (i / ncol) * 2 - 1;
          fP.push(x, y + (rows === 0 ? 1 : free > 0.2 ? 0 : 1.2), zc + cc * w * 0.5); fA.push(cc, cc * w * 0.5, tau); fB.push(drop, free, thin, f.close ? 1 : 0); fL.push(lit); fN++;
        }
        rows++;
        if (rows % 4 === 3) await ctx.yield();
      }
      if (rows < 25) {                                               // a fall that dies on a ledge within 100 m would hang on the wall as a white scrap: leave it out
        fP.length = base * 3; fA.length = base * 3; fB.length = base * 4; fL.length = base; fN = base; mistAt.length = mist0; f.ok = false;
        continue;
      }
      for (let r = Math.max(0, rows - 5); r < rows; r++) for (let i = 0; i <= ncol; i++) fB[(base + r * (ncol + 1) + i) * 4 + 2] *= (rows - 1 - r) / 5;
      f.foot = [fP[(base + (rows - 1) * (ncol + 1)) * 3], fP[(base + (rows - 1) * (ncol + 1)) * 3 + 1], f.z];
      for (let r = 0; r < rows - 1; r++) for (let i = 0; i < ncol; i++) { const a = base + r * (ncol + 1) + i, b = a + ncol + 1; fI.push(a, a + 1, b, a + 1, b + 1, b); }
      await ctx.yield();
    }
    // the side fall's cascade: white water breaking down its stream from the basin to the river, between and over the rocks that stand in it
    // (the same heavy water as the fall itself: a ribbon three to five metres wide that rides a hand above the kit stream, the rocks stand through it)
    {
      for (let k = 0; k < 13; k++) {                                 // its rocks: every third one stands in the water and splits it, the others line its banks
        const q = 0.08 + 0.07 * k, in_ = k % 3 === 0;
        cascadeRocks.push([lerp(trib.ax, trib.bx, q) + RF.range(-1.6, 1.6), tribLevel(q) - (in_ ? 0.15 : 0.1), tribZ(q) + (in_ ? RF.range(-1.5, 1.5) : RF.sign() * RF.range(4.5, 7.5)), in_ ? RF.range(1.0, 1.6) : RF.range(1.1, 2.1), in_]);
      }
      const NR = 64, ph1 = RF.range(0, 6.28), ph2 = RF.range(0, 6.28), base = fN, cP = new THREE.Vector3(), cQ = new THREE.Vector3();
      const cAt = (q, out) => out.set(lerp(trib.ax, trib.bx, q), tribLevel(q) + 0.05 + 0.18 * Math.sin(Math.PI * Math.min(1, q * 1.15)) + 0.16, tribZ(q));
      let tauC = RF.range(0, 9);
      for (let r = 0; r <= NR; r++) {
        const q = r / NR; cAt(q, cP); cAt(Math.min(1, q + 0.01), cQ);
        if (q > 0.99) { cAt(0.98, cQ); cQ.sub(cP).negate(); } else cQ.sub(cP);
        const tl = Math.hypot(cQ.x, cQ.z) || 1, nx = -cQ.z / tl, nz = cQ.x / tl;
        const w = 3.9 + 1.2 * Math.sin(q * 21 + ph1) + 0.6 * Math.sin(q * 47 + ph2), off = 0.9 * Math.sin(q * 13 + ph2) * Math.sin(q * Math.PI);
        const fade = sst(0, 0.06, q) * sst(1, 0.9, q) * (0.3 + 0.7 * sst(-0.5, 0.2, Math.sin(q * 19 + ph1) + 0.5 * Math.sin(q * 43 + ph2)));   // chutes of white water with a quieter pool between them
        tauC += (trib.len / NR) / 6;
        for (let i = 0; i <= 4; i++) {
          const cc = (i / 4) * 2 - 1;
          const vx = cP.x + nx * (off + cc * w * 0.5), vz = cP.z + nz * (off + cc * w * 0.5);
          let open = 1;                                               // the water parts round a rock that stands in it
          for (const c of cascadeRocks) if (c[4]) open = Math.min(open, sst(0.5, 1.1, Math.hypot(vx - c[0], vz - c[2]) / c[3]));
          fP.push(vx, cP.y, vz); fA.push(cc, cc * w * 1.5, tauC); fB.push(12 + q * trib.len, 0.12, fade * open, 0.3); fL.push(0.9); fN++;   // (aA.y: three times its metres across, so the water's threads are a third of a metre wide here; aB.w 0.3: broken water, the dark bed shows between its threads)
        }
        if (r % 16 === 15) await ctx.yield();
      }
      for (let r = 0; r < NR; r++) for (let i = 0; i < 4; i++) { const a = base + r * 5 + i, b = a + 5; fI.push(a, a + 1, b, a + 1, b + 1, b); }
    }
    falls.filter((f) => f.ok).slice(0, 10).forEach((f, i) => CS.falls.value[i].set(f.z, f.w * (f.close ? 1.5 : 1.9) + 3, f.side, f.y));   // the wet streak behind each fall that was built
    const fallGeo = new THREE.BufferGeometry();
    fallGeo.setAttribute('position', new THREE.Float32BufferAttribute(fP, 3));
    fallGeo.setAttribute('aA', new THREE.Float32BufferAttribute(fA, 3));
    fallGeo.setAttribute('aB', new THREE.Float32BufferAttribute(fB, 4));
    fallGeo.setAttribute('aLit', new THREE.Float32BufferAttribute(fL, 1));
    fallGeo.setIndex(fI);
    const fallMat = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, side: THREE.DoubleSide, fog: true, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -260,
      uniforms: { ...fx.fogUniforms(), uTime: time, uSunCol: hero.uniforms.sunColor, uSkyCol: hero.uniforms.skyColor },
      vertexShader: /* glsl */`
        attribute vec3 aA; attribute vec4 aB; attribute float aLit;
        varying vec3 vA; varying vec4 vB; varying float vSun, vDist, vFace;
        uniform float uTime;
        #include <fog_pars_vertex>
        void main(){
          vA = aA; vB = aB; vSun = aLit;
          vec3 p = position;
          float swy = aB.y * min(aB.x, 170.0) * 0.02;                  // free-falling water sways in the wind
          p.z += sin(uTime * 0.45 + aB.x * 0.02 + aA.z * 0.3) * swy;
          vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
          vDist = length(mvPosition.xyz);
          vec3 toC = cameraPosition - (modelMatrix * vec4(p, 1.0)).xyz;                 // every ribbon faces across the valley (+-X): how squarely is it seen?
          vFace = smoothstep(0.08, 0.5, abs(toC.x) / max(length(toC), 1e-3));
          gl_Position = projectionMatrix * mvPosition;
          #include <fog_vertex>
        }`,
      fragmentShader: /* glsl */`
        uniform float uTime; uniform vec3 uSunCol, uSkyCol;
        varying vec3 vA; varying vec4 vB; varying float vSun, vDist, vFace;
        #include <fog_pars_fragment>
        ${GLSL_NOISE}
        ${GLSL_WATER}
        void main(){
          // vB.w = 1 on the side fall the camera passes at 40 m: heavy, opaque white water. Every other ribbon is a far fall.
          vec4 w = gfWater(vA, vec4(vB.x, vB.y, min(vB.z * 1.6, 1.0), 0.0), vSun, uTime, vDist, uSunCol, uSkyCol, vB.w);   // the same comet-streaked water as the Great Fall
          // from across the valley a fall is a broken thread: bright knots where it leaps clear, near nothing where it slides on the rock, never a strip of paper
          float far = smoothstep(150.0, 480.0, vDist) * (1.0 - vB.w), surge = fb(vec2(vB.x * 0.09 + 3.0, uTime * 0.06 + vB.x * 0.004));
          w.a *= mix(1.0, smoothstep(0.0, 0.8, 1.0 - abs(vA.x)) * mix(0.12, 1.0, smoothstep(0.3, 0.6, surge)) * (0.36 + 0.64 * vB.y), far);
          w.a *= mix(1.0, 0.35 + 0.65 * vFace, 1.0 - vB.w);          // a ribbon seen edge-on is not a pale band
          w.rgb *= mix(1.0, 0.86, far * (1.0 - vSun));
          float heavy = vB.w * (1.0 - smoothstep(90.0, 240.0, vDist));   // close up: big clumps that fall with the water, brighter than the body between them
          w.rgb *= mix(1.0, 0.8 + 0.5 * gfComet(vec2(vA.y / 4.2 + 2.0, (uTime - vA.z) * 0.42), 4.0), heavy);
          if (w.a < 0.01) discard;
          gl_FragColor = w;
          #include <fog_fragment>
        }`,
    });
    const fallMesh = new THREE.Mesh(fallGeo, fallMat); fallMesh.name = 'side-falls'; fallMesh.renderOrder = 2; fallMesh.frustumCulled = false;
    if (fN > 0) scene.add(fallMesh);
    await ctx.yield();

    // ---------- vegetation ----------
    const wind = flora.makeWind({ direction: [0.25, 1], strength: V.wind });
    if (flora.prepareLeafTexture) await flora.prepareLeafTexture({ wind }, ctx.yield);
    const treeMat = flora.windMaterial({ wind });
    addCloudShadow(treeMat, CS);
    const tr = R.fork('trees');
    // dark, slim spruce and grey-barked pine, kept small: against 700 m walls a tree is a scale bar, not a subject
    const leafP = { leaf: '#2f5a33', leafLight: '#456f3c', leafDark: '#1b3a25', bark: '#6b5546', barkDark: '#43352c' };
    const conifers = async (detail) => {                            // (one geometry per build step)
      const a = [];
      a.push(flora.coniferGeometry({ rng: tr, detail, slim: 1.2, height: 16, ...leafP })); await ctx.yield();
      a.push(flora.coniferGeometry({ rng: tr, detail, slim: 1.5, height: 20, ...leafP })); await ctx.yield();
      a.push(flora.coniferGeometry({ rng: tr, detail, slim: 1.1, height: 13, ...leafP })); await ctx.yield();
      a.push(flora.pineGeometry({ rng: tr, detail, height: 15, ...leafP })); await ctx.yield();
      return a;
    };
    const coniferNear = await conifers(1);
    const coniferFar = await conifers(0);
    const birchO = V.autumn ? { autumn: true } : {};
    const birchNear = [flora.birchGeometry({ rng: tr, detail: 1, height: 13, ...birchO })];
    await ctx.yield();
    birchNear.push(flora.birchGeometry({ rng: tr, detail: 1, height: 15, ...birchO }));
    await ctx.yield();
    const birchFar = [flora.birchGeometry({ rng: tr, detail: 0, height: 14, ...birchO })];
    await ctx.yield();
    const islandK = (x, z) => Math.exp(-(((x - isl.x) / 15) ** 2) - (((z - isl.z) / (isl.half * 0.6)) ** 2));
    const inPlume = (x, z) => z < 190 && Math.hypot(x - POOL.x, z - 40) < 200;
    const stand = (x, z, o) => sst(0.24, 0.42, N.n2(x * 0.017 + o, z * 0.017 - o) + 0.35 * N.n2(x * 0.05 - o, z * 0.05));   // tight stands of a dozen trees with open meadow between (not lone trees on a lawn)
    const steep = (x, z) => Math.abs(hG(x + (x > 0 ? 8 : -8), z) - hG(x, z)) > 6.5;   // nothing grows on a cliff face
    // spruce stand along both banks of the river over the whole valley floor, in clumps with gaps between: a band in space
    const riverEdge = (x, z) => Math.abs(x - rx(z)) - (z < zs ? lerp(RC.w0, RC.w1, Math.sqrt(clamp((z - RC.z0) / (RC.z1 - RC.z0), 0, 1))) * 0.5 : mainHalf(z));
    const bank = (x, z) => { const e = riverEdge(x, z); return e > 42 ? 0 : sst(42, 20, e) * sst(0.0, 0.3, N.n2(z * 0.021 + 30, x > rx(z) ? 2.2 : 7.7)); };
    // (one forest for the whole valley, laid by the land alone: stands on the talus under both walls, groves on the open floor, a band along both
    // banks of the river, the tree island; the same number of trees to the metre of valley from the entry to the pool)
    const forestDensity = (x, z) => {
      if (inPlume(x, z)) return 0;
      const t = Math.abs(x) - (x > 0 ? hwR(z) : hwL(z));
      const d = clamp(sst(-84, -20, t) * sst(120, 50, t) * stand(x, z, 40) + 0.9 * islandK(x, z) + 0.5 * stand(x, z, 7) * sst(-50, -95, t) * sst(0.1, 0.5, N.n2(x * 0.006 + 3, z * 0.006)) + 0.85 * bank(x, z), 0, 1);
      return d < 0.03 || steep(x, z) ? 0 : d;
    };
    // (spruce is the valley's tree and pine the rarer one: one tree in seven. The lists name the three spruces twice and the pine once)
    const mix7 = (a) => [a[0], a[1], a[2], a[3], a[0], a[1], a[2]];
    const nForest = Math.round(340 * clamp(lush, 0.97, 1.03) * Q);
    const forest = flora.makeForest({ rng: R.fork('forest'), path, heightAt: sAt, material: treeMat, variants: mix7(coniferNear), farVariants: mix7(coniferFar), farDistance: 30,
      count: nForest, radius: 250, falloff: 0.3, corridor: 13, spacing: 2.1, scale: [0.7, 1.15], yRange: [1.1, 45], chunks: 4, cullDistance: 540, shade: shadeAtGround, density: forestDensity });
    await ctx.yield();
    // the tree island: spruce right under the flight line where it climbs to 40 m, their crowns passing close below the camera
    const underPath = flora.makeScatter({ rng: R.fork('island'), path, heightAt: sAt, material: treeMat, variants: coniferNear.slice(0, 2), count: Math.round(22 * Math.max(Q, 0.8)), radius: 14, corridor: 0, clear: 0, falloff: 0,
      spacing: 2.6, scale: [0.9, 1.15], yRange: [1.4, 20], shade: shadeAtGround, uRange: [path.nearestXZ(isl.x, isl.z + isl.half * 0.7).u, path.nearestXZ(isl.x, isl.z - isl.half * 0.55).u],
      density: (x, z) => clamp(1.4 * islandK(x, z), 0, 1) });
    await ctx.yield();
    // birch in tight bright groves on the open floor
    const birches = flora.makeForest({ rng: R.fork('birch'), path, heightAt: sAt, material: treeMat, variants: birchNear, farVariants: birchFar, farDistance: 32,
      count: Math.round(66 * clamp(lush, 0.95, 1.12) * Q), radius: 165, falloff: 0.3, corridor: 12, spacing: 2.3, scale: [0.8, 1.15], yRange: [1.2, 30], chunks: 3, cullDistance: 520, shade: shadeAtGround,
      density: (x, z) => (inPlume(x, z) ? 0 : sst(0.36, 0.5, N.n2(x * 0.016 + 70, z * 0.016 + 12)) * sst(-40, -80, Math.abs(x) - (x > 0 ? hwR(z) : hwL(z))) * (1 - islandK(x, z)) * (1 - 0.8 * bank(x, z))) });
    forest.object.name = 'forest'; underPath.object.name = 'island-trees'; birches.object.name = 'birches';
    await ctx.yield();
    {
      // blob shadows only for trees on the valley floor: draped over a cliff the long low-sun blobs cut through the rock as black lines
      const sx = -S.x / Math.hypot(S.x, S.z), sz = -S.z / Math.hypot(S.x, S.z), casters = [];
      for (const [f, r0] of [[forest, coniferNear[0].userData.radius || 3.4], [birches, birchNear[0].userData.radius || 3]]) {
        for (const p of f.points || []) {
          const y = hG(p.x, p.z);
          if (y < 40 && Math.abs(hG(p.x + sx * 14, p.z + sz * 14) - y) < 4) casters.push({ x: p.x, z: p.z, r: r0 * (p.s || 1) });
        }
        await ctx.yield();
      }
      if (casters.length) { const sh = flora.makeGroundShadows({ points: casters, heightAt: sAt, sunDir: S, strength: 0.5, cell: 7 }); sh.object.name = 'tree-shadows'; scene.add(sh.object); }
    }
    for (const f of [forest, underPath, birches]) { scene.add(f.object); updaters.push(f); }
    await ctx.yield();
    {
      // small spruce on the ledges of the near cliff: they give the wall its scale, and they sway
      const pts = [], want = Math.round(64 * Q);
      for (const c of RX.shuffle(cliff.ledges.slice())) {
        if (pts.length >= want) break;
        if (pts.some((p) => (p.x - c[0]) ** 2 + (p.y - c[1]) ** 2 + (p.z - c[2]) ** 2 < 34)) continue;
        pts.push({ x: c[0], y: c[1], z: c[2], s: RX.range(0.3, 0.52), rot: RX() * 6.28, d: 0, u: 0, v: RX.int(0, 2) });
      }
      if (pts.length) {
        const lt = flora.makeScatter({ rng: RX.fork('ledge'), points: pts, variants: coniferFar.slice(0, 3), material: treeMat, chunks: 1, sink: 0.02, tilt: 0.08 });
        lt.object.name = 'ledge-trees'; scene.add(lt.object); updaters.push(lt);
      }
    }
    await ctx.yield();

    // the tallest spruce of the valley stand in a band beside the river, 5 to 34 m from the water, over the WHOLE floor (their height is the
    // species' own, 21 to 28 m): all the way up the valley crowns pass below and beside the camera, and the river runs between trees
    const tallBand = (x, z) => {
      if (inPlume(x, z)) return 0;
      const e = riverEdge(x, z);
      return e < 4 || e > 36 ? 0 : sst(4, 9, e) * sst(36, 24, e) * (0.3 + 0.7 * sst(-0.3, 0.2, N.n2(z * 0.016 + 61, x > rx(z) ? 5.4 : 9.9) + 0.3 * N.n2(x * 0.05, z * 0.05 + 13)));   // (thicker and thinner along the bank, never a bare reach)
    };
    const tall = flora.makeForest({ rng: RN.fork('tall'), path, heightAt: sAt, material: treeMat, variants: [coniferNear[1]], farVariants: [coniferFar[1]], farDistance: 30,
      count: Math.round(56 * Q), radius: 62, falloff: 0.1, corridor: 13, spacing: 2.4, scale: [1.05, 1.4], yRange: [1.2, 14], chunks: 2, cullDistance: 560, shade: shadeAtGround, density: tallBand });
    tall.object.name = 'tall-spruces';
    scene.add(tall.object); updaters.push(tall);
    await ctx.yield();

    // distant stands on the talus and benches of both walls: one mesh of simple cones for scale
    {
      const cP = [], cC = [], cr = R.fork('cones'), dk = C('#14301d'), lt = C('#2f5a33').multiplyScalar(0.8), a = new THREE.Color(), b = new THREE.Color();
      let placed = 0;
      const coneMax = Math.round(460 * Q);
      for (let n = 0; n < 2600 && placed < coneMax; n++) {
        if (n % 30 === 29) await ctx.yield();
        const x = cr.range(-600, 600), z = cr.range(-40, pz + 1280), d = Math.abs(x), t = d - (x > 0 ? hwR(z) : hwL(z));
        if (t < 30 || (z < A.wing + 40 && d < 300) || N.n2(x * 0.009 + 3, z * 0.009) < -0.12) continue;      // stands on the benches and talus
        const y = sAt(x, z); if (y > 470 || Math.abs(sAt(x + 6, z) - y) > 5.2) continue;
        const h = cr.range(10, 16), r = h * cr.range(0.15, 0.2), yaw = cr() * 6.28, k = lerp(0.42, 1, sunAt(x, y + 8, z)) * cr.range(0.8, 1.1);
        a.copy(dk).lerp(lt, cr.range(0.1, 0.5)).multiplyScalar(k); b.copy(dk).lerp(lt, cr.range(0.6, 1)).multiplyScalar(k);
        for (let tier = 0; tier < 2; tier++) {
          const y0 = y - 1 + h * (0.12 + 0.36 * tier), y1 = y - 1 + h * (0.68 + 0.32 * tier), rr = r * (1 - 0.3 * tier);
          for (let sd = 0; sd < 5; sd++) {
            const a0 = yaw + tier + (sd / 5) * 6.2832, a1 = a0 + 6.2832 / 5;
            cP.push(x + Math.cos(a0) * rr, y0, z + Math.sin(a0) * rr, x, y1, z, x + Math.cos(a1) * rr, y0, z + Math.sin(a1) * rr);
            cC.push(a.r, a.g, a.b, b.r, b.g, b.b, a.r, a.g, a.b);
          }
        }
        placed++;
      }
      await ctx.yield();
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(cP, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(cC, 3));
      await ctx.yield();
      g.computeVertexNormals();
      await ctx.yield();
      const mesh = new THREE.Mesh(g, dressMat); mesh.name = 'far-conifers'; scene.add(mesh);   // (the hero's trees-and-boulders material: one shader program for all three)
    }
    await ctx.yield();

    const tmpC = new THREE.Color();
    // in a drift, four tufts in ten are in flower: seen from 40 m up the drift is a stipple of yellow or pink over the green, not a painted patch
    const gFlY = C('#ecd04a'), gFlP = C('#ff6fa8');
    const gTuft = (x, z, y) => {
      groundColor(x, z, y, 1, tmpC);
      if (y < 22 && y - WATER_Y > 1.4) {
        const fl = drift(x, z) * sst(22, 9, y), hs = Math.sin(x * 12.9898 + z * 78.233) * 43758.5453;
        if (hs - Math.floor(hs) < 0.42 * fl) tmpC.lerp(pinkAt(x, z) ? gFlP : gFlY, 0.6);
      }
      return tmpC;
    };
    const flowerCols = ['#f4f7fa']; for (let i = 0; i < 6; i++) flowerCols.push(i / 6 < V.pink ? '#ff6fa8' : '#d9c24a'); flowerCols.push('#d9c24a', '#ff6fa8');
    // the design's dense wind-blown grass: 16,500 tufts within 62 m of the flight line and thickest beside it (blades, not blobs, in the first 35 m);
    // beyond that the meadow's painted quilt carries. It grows on all the open floor: not on the talus, not on the spray-beaten gravel round the pool
    const poolShore = (x, z) => sst(1.3, 1.12, Math.hypot((x - POOL.x) / POOL.rx, (z - POOL.z) / POOL.rz));
    const grassO = { rng: R.fork('grass'), path, radius: 62, count: Math.round(16500 * Q), bias: 2.0, width: [1.3, 2.5], height: [0.75, 1.5], heightAt: sAt, heightStep: 4,   // (the drawn mesh: the tufts stand on what is seen, and it is a tenth of the cost of the height function)
      groundColor: gTuft, yRange: [1.1, 45], density: (x, z) => (1 - 0.92 * talusK(x, z)) * (1 - poolShore(x, z)), shade: shadeAtGround, wind, map: treeMat.map, flowers: 0, flowerColors: flowerCols, fade: [120, 155], chunks: 8 };
    const grass = flora.makeGrassAsync ? await flora.makeGrassAsync(grassO, ctx.yield) : flora.makeGrass(grassO);
    addCloudShadow(grass.material, CS);
    await ctx.yield();
    // one more patch of the same carpet (the same material): tall tufts overhanging the cut banks of the river, wherever a bank lies within 46 m of the flight line
    const bankHalf = (z) => (z < zs ? lerp(RC.w0, RC.w1, Math.sqrt(clamp((z - RC.z0) / (RC.z1 - RC.z0), 0, 1))) * 0.5 : mainHalf(z));
    const grassBank = await flora.makeGrassAsync({ rng: RN.fork('grass-bank'), path, radius: 46, count: Math.round(1700 * Q), bias: 1, width: [1.3, 2.3], height: [0.9, 1.7], heightAt: sAt, heightStep: 3,
      groundColor: gTuft, yRange: [0.74, 9], density: (x, z) => { const e = Math.abs(x - rx(z)) - bankHalf(z); return sst(0.2, 1.4, e) * sst(7.5, 3, e) * (1 - poolShore(x, z)); }, shade: shadeAtGround, material: grass.material, flowers: 0, chunks: 2 }, ctx.yield);
    await ctx.yield();
    // (a flower's leaves take the meadow's colour only: the cheap part of groundColor, without bars, basin or talus)
    const gMeadow = (x, z) => { const n1 = N.n2(x * 0.006 + 11, z * 0.006 - 4) + 0.5 * N.n2(x * 0.02 + 3, z * 0.02 + 17); return tmpC.copy(gA).lerp(gB, sst(-0.6, 0.8, n1)).lerp(gDry, 0.3); };
    // the design's drifts of wildflowers: 3,200 within 56 m of the flight line, in the same drifts that are painted into the meadow
    const flowers = flora.makeFlowers({ rng: R.fork('flowers'), path, heightAt: sAt, wind, map: treeMat.map, count: Math.round(3200 * clamp(lush, 1, 1.02) * Q), radius: 56, scale: [0.8, 1.3], yRange: [1.2, 30],
      density: (x, z) => (0.1 + 0.9 * drift(x, z)) * (1 - poolShore(x, z)),
      groundColor: gMeadow, shade: shadeAtGround, colors: flowerCols, chunks: 7, materialOptions: { fade: [125, 160], detail: 0, ambient: 1.2, leafAmbient: 1.2 } });
    addCloudShadow(flowers.material, CS);
    await ctx.yield();
    const flowerSets = [flowers];
    // the foot of the side fall: ferns in the spray and a talus of boulders round the basin and along the cliff foot
    const nearFall = (x, z) => Math.exp(-(((x - basin.x - 8) / 46) ** 2) - (((z - zf) / 58) ** 2));
    const ferns = flora.makeFerns({ rng: R.fork('ferns'), path, heightAt: sAt, wind, map: treeMat.map, count: 160, radius: 80, corridor: 4, scale: [1.5, 2.6], yRange: [1.5, 40], chunks: 1,
      uRange: [path.nearestXZ(basin.x, zf + 125).u, path.nearestXZ(basin.x, zf - 125).u], shade: shadeAtGround, density: (x, z) => clamp(1.5 * nearFall(x, z), 0, 1) });   // (the reach of the path abreast of the fall, as far as the fall's own ground reaches)
    addCloudShadow(ferns.material, CS);
    await ctx.yield();
    {
      const bb = boulderBuilder({ rng: R.fork('talus'), noise: N, base: C('#8d949c').multiplyScalar(0.78).lerp(C('#b9a58c'), 0.15), moss: C('#3f7a3a').multiplyScalar(0.55), dark: '#262e38', wet: 0.6 }), br = R.fork('talus-at');
      const bbSmall = boulderBuilder({ rng: RN.fork('talus-s'), noise: N, base: C('#8d949c').multiplyScalar(0.78).lerp(C('#b9a58c'), 0.15), moss: C('#3f7a3a').multiplyScalar(0.55), dark: '#262e38', wet: 0.6, detail: 1, P: bb.P, C: bb.C, N: bb.N, I: bb.I });
      const bbRubble = boulderBuilder({ rng: RX.fork('rubble'), noise: N, base: C('#8d949c').multiplyScalar(0.78).lerp(C('#b9a58c'), 0.15), moss: C('#3f7a3a').multiplyScalar(0.55), dark: '#262e38', wet: 0.6, detail: 0, P: bb.P, C: bb.C, N: bb.N, I: bb.I });   // (the small rubble against the cliff's foot: 20 triangles a stone)
      for (let n = 0; n < 900 && bb.count + bbSmall.count < 54; n++) {
        if (n % 12 === 11) await ctx.yield();
        const x = basin.x + br.range(-34, 46), z = zf + br.range(-72, 72);
        if (br() > nearFall(x, z) * 1.4 + 0.08) continue;
        if (Math.hypot(x - basin.x, z - zf) < basin.r - 3 && br() < 0.8) continue;      // a few stand in the basin itself and split the foam
        const y = hAt(x, z), r = br.range(1.3, 3.6) * (br.chance(0.12) ? 1.9 : 1);
        if (y > 40 || path.distanceTo(x, y, z) < 10 + r) continue;
        (r > 3.0 ? bb : bbSmall).add(x, y - r * 0.12, z, r, y < basin.y + 1.2 ? 1.6 : 0.5);
        if ((bb.count + bbSmall.count) % 2 === 1) await ctx.yield();
      }
      await ctx.yield();
      // a talus of fallen blocks along the foot of the near cliff, and a few stones in the side fall's stream
      const ft = RX.fork('foot');
      for (let n = 0; n < cliff.foot.length; n++) {
        const c = cliff.foot[n];
        for (let q = 0; q < (c[3] ? n % 2 : 2); q++) {                                  // big blocks lie furthest out, the small rubble against the wall
          const far = ft() ** 1.5, x = c[0] - 8.5 - 22 * far, z = c[1] + ft.range(-4, 4), r = (0.8 + 1.5 * far + ft.range(0, 0.7)) * (ft.chance(0.08) ? 1.6 : 1);
          if (ft() > 0.92 || Math.hypot(x - basin.x, z - zf) < basin.r + 5) continue;    // (the basin has its own)
          const y = hAt(x, z);
          if (y > 58 || path.distanceTo(x, y, z) < 10 + r) continue;
          (r > 3.2 ? bb : r > 2.1 ? bbSmall : bbRubble).add(x, y - r * 0.18, z, r, 0.5);   // (the cliff's foot is 40 m and more from the flight line)
        }
        if (n % 3 === 2) await ctx.yield();
      }
      const xr = RN.fork('rocks-at'), bkO = { rng: RN.fork('rocks'), noise: N, base: C('#8d949c').multiplyScalar(0.78).lerp(C('#b9a58c'), 0.15), moss: C('#3f7a3a').multiplyScalar(0.55), dark: '#262e38', wet: 0.6, P: [], C: [], N: [], I: [] };
      const bbK = boulderBuilder({ ...bkO, rng: RN.fork('bank-rocks'), detail: 1 });
      const cobble = boulderBuilder({ ...bkO, rng: RN.fork('cobbles'), base: C('#b4b0a2'), moss: C('#8f937f'), wet: 0.75, detail: 0 });   // pale river cobbles: 20 triangles each
      let nx_ = 0;
      // cobbles and small boulders along both banks of the whole river, from the pool's mouth to beyond the entry, one to every two metres of
      // valley: a cut bank, not a smear (built only where a bank lies within 60 m of the flight line: further off a cobble is under a pixel)
      {
        const zA = RC.z0, zB = ez + 80, RCq = (z) => clamp((z - RC.z0) / (RC.z1 - RC.z0), 0, 1), nCob = Math.round(0.55 * (zB - zA));
        for (let k = 0; k < nCob; k++) {
          const z = lerp(zA, zB, xr()), sd = xr.sign(), big = xr() < 0.22, off = big ? xr.range(0.5, 4.5) : xr.range(-0.6, 2.4), r = big ? xr.range(0.7, 1.5) : xr.range(0.3, 0.7);
          const half = z < zs ? lerp(RC.w0, RC.w1, Math.sqrt(RCq(z))) * 0.5 : mainHalf(z), x = rx(z) + sd * (half + off), y = sAt(x, z);
          const dp = path.distanceTo(x, y, z);
          if (y > 3.2 || y < WATER_Y - 0.5 || dp < 9 || dp > 60 || Math.hypot((x - POOL.x) / POOL.rx, (z - POOL.z) / POOL.rz) < 1.1) continue;
          (big && dp < 28 ? bbK : cobble).add(x, Math.max(y, WATER_Y - 0.1) - r * 0.2, z, r, 0.45);
          if (++nx_ % 6 === 5) await ctx.yield();
        }
        await ctx.yield();
        if (bbK.count + cobble.count > 0) { const bankRocks = new THREE.Mesh(bbK.geometry(), dressMat); bankRocks.name = 'bank-cobbles'; scene.add(bankRocks); }
      }
      await ctx.yield();
      for (let k = 0; k < cascadeRocks.length; k++) {                // rocks in and beside the cascade: it breaks white round them
        const c = cascadeRocks[k];
        bbSmall.add(c[0], c[1], c[2], c[3], 1.2);
        if (k % 4 === 3) await ctx.yield();
      }
      await ctx.yield();
      const talusGeo = bb.geometry();
      await ctx.yield();
      const talus = new THREE.Mesh(talusGeo, dressMat); talus.name = 'talus'; scene.add(talus);
    }
    grass.object.name = 'grass'; flowerSets.forEach((f, i) => { f.object.name = 'flowers-' + i; }); ferns.object.name = 'ferns'; grassBank.object.name = 'grass-bank';
    for (const f of [grass, grassBank, ...flowerSets, ferns]) { scene.add(f.object); updaters.push(f); }
    await ctx.yield();

    // ---------- creatures ----------
    const light = F.lightFrom(scene);
    const eagles = F.makeFlock({ rng: R.fork('eagles'), species: 'eagles', count: V.eagles, light, size: 5.5,
      body: '#2e2118', belly: '#3a2a1f', wingC: '#2a1d15', trail: '#1e150f', tip: '#120c09', head: '#efe9dc', tailC: '#efe9dc', beak: '#d9a53a',   // dark birds with white heads: silhouettes against the rock, not orange blobs
      center: [px + 30 + jit(15), 80 + jit(8), pz + 520 + jit(25)], radius: 44, soarRadius: 42, soarLift: 12 });   // a thermal over the tree island: they wheel above the camera as it climbs over the trees
    await ctx.yield();
    const swiftC = { body: '#27303a', belly: '#cfcabd', wingC: '#1e2630', trail: '#161c24', tip: '#10151b', head: '#27303a', tailC: '#1e2630' };   // slate-dark swallows with pale bellies (the kit's default reads purple against the meadow)
    const swifts = F.makeFlock({ rng: R.fork('swifts'), species: 'swifts', count: V.swifts, light, size: 1.6, ...swiftC,
      along: { path, side: R.sign() * 6, up: -7, lead: 22, from: 0, to: 0.5 } });
    await ctx.yield();
    const skimmers = F.makeFlock({ rng: R.fork('skim'), species: 'swifts', count: 8, light, size: 1.3, ...swiftC, center: [px + 50 * R.sign(), 5.5, pz + 78], radius: 24 });   // low over the pool, off the portal's axis
    await ctx.yield();
    const crossing = F.makeFlock({ rng: R.fork('cross'), species: 'swifts', count: R.int(10, 16), light, size: 1.5, ...swiftC,
      cross: { path, u: 0.74, lead: 56, span: 300, angle: 68, side: R.sign(), height: 5, window: 0.2 } });
    await ctx.yield();
    // swallows live in the spray of a fall: six of the valley's (the same number the escort gives up) hawk through the side fall's, anywhere
    // between its basin and its lip, on a loop in front of the sheet; the skimmers above are the Great Fall's. They fly on the world's clock
    const fallBirds = F.makeFlock({ rng: RN.fork('fall-birds'), species: 'swifts', count: 6, light, size: 1.6, ...swiftC, center: [cf.land - 14, basin.y + cf.drop * 0.5, zf], radius: 13, height: cf.drop * 0.2,
      spread: [8, cf.drop * 0.36, 22], wander: [4, 6, 5, 0.8] });
    await ctx.yield();
    const deerZ = pz + 885 + jit(28);
    const deer = F.makeHerd({ rng: R.fork('deer'), species: 'deer', count: V.deer, light, heightAt: sAt, path, clear: 40,
      center: [rx(deerZ) + 45, 0, deerZ], radius: 26, size: 1.8, varieties: V.stags, coat: '#7a5234', belly: '#b39672', legs: '#4f3523' });
    await ctx.yield();
    const creatures = [eagles, swifts, skimmers, crossing, fallBirds, deer];
    let deer2 = null;
    if (R.chance(0.6)) {
      deer2 = F.makeHerd({ rng: R.fork('deer2'), species: 'deer', count: R.int(3, 5), light, heightAt: sAt, path, clear: 40,
        center: [px + 82, 0, pz + 330 + jit(20)], radius: 22, size: 1.6, varieties: 0.5 });
      creatures.push(deer2);
    }
    for (const c of creatures) { scene.add(c.object); updaters.push(c); }
    await ctx.yield();

    // ---------- air: spray at every fall, mist on the river, pollen, cumulus beyond the head wall ----------
    const air = fx.fxGroup(); scene.add(air.object);
    const puffs = [];
    const RP = own('puffs');                                         // (how many there are follows the walls: their jitter is their own stream)
    for (const m of mistAt) for (let k = 0; k < 5; k++) puffs.push([m[0] + RP.range(-14, 14) * m[3], m[1] + RP.range(-4, 16) * m[3], m[2] + RP.range(-16, 16) * m[3]]);
    if (puffs.length) air.add(fx.makeMist({ rng: R.fork('spray'), time, positions: puffs, size: [20, 40], color: '#e6eff8', opacity: 0.08, flatten: 1 }));   // haze where a ribbon leaps and lands, not plates
    await ctx.yield();
    // the side fall's spray drifts off the sheet and across the flight line as thin torn wisps: small, sparse and faint, so the valley
    // shows through them and the sheet behind stays crisp (a bank of big soft puffs here was a pale smear over half the view)
    air.add(fx.makeMist({ rng: R.fork('lens'), time, count: 30, center: [cf.land - 24, basin.y + 17, zf + 5], area: [58, 22, 64], size: [9, 22], color: '#eef5fb', opacity: 0.11, drift: [-2.6, 0.2, 1.2], flatten: 0.55 }));
    await ctx.yield();
    // low spray scudding over the pool: a bank along each of its two shores, by the pool's own outline (from 0.47 to 0.97 of its half-width
    // out, over its length). The cone of clear air in front of the ring is at most 22 m across where the banks end; they stand 45 m and more from its axis
    for (const [sd, mr] of [[1, R.fork('pool')], [-1, RN.fork('pool2')]]) {
      air.add(fx.makeMist({ rng: mr, time, count: 11, center: [POOL.x + sd * POOL.rx * 0.72, 5, POOL.z + POOL.rz * 0.35], area: [POOL.rx * 0.5, 6, POOL.rz * 1.5], size: [14, 30], color: '#eef5fb', opacity: 0.1, drift: [0.4 * sd, 0, 2.6] }));
      await ctx.yield();
    }
    if (V.riverMist) air.add(fx.makeMist({ rng: R.fork('rmist'), time, count: 26, center: [px - 40, 4, pz + 640], area: [150, 4, 760], size: [46, 90], color: '#d8e4f2', opacity: rare ? 0.08 : 0.05, drift: [0.25, 0, 1.2] }));
    await ctx.yield();
    air.add(fx.makeParticles({ rng: R.fork('pollen'), preset: 'pollen', time, size: [0.035, 0.1], density: Q }));
    await ctx.yield();
    const towers = makeCloudField({ rng: R.fork('cumulus'), sky, count: V.towers, altitude: 600, altitudeJitter: 110, size: [430, 760], center: [0, 0, -1080], extent: [2000, 900], wind: [0.4, 0, 3] });
    scene.add(towers.object);
    updaters.push(air, towers);
    await ctx.yield();
    // the cumulus whose shadows cross the valley, drawn where the lattice puts them: each stands on the sun ray through its shadow, a
    // kilometre up, so with this low sun behind the camera they hang over the valley's mouth, two kilometres down the sun's side of it. Listed
    // for the floor and the lower walls (ground-level x -450..600, z -900..1620) and one whole period down-wind; the field runs on the
    // clock modulo that period (two minutes or so), so the clouds over the valley are always the ones whose shadows lie in it
    {
      const cl = CS.cloud.value, la = CS.lat.value, period = SHADE.nz * SHADE.cv, slope = CS.slope.value, at = [];
      for (let j = -40; j <= 40; j++) {
        const jm = ((j % SHADE.nz) + SHADE.nz) % SHADE.nz;
        for (let i = -16; i <= 16; i++) {
          const B = SHADE.blobs[jm * SHADE.nx + (((i % SHADE.nx) + SHADE.nx) % SHADE.nx)];
          const U_ = (i + 0.5 + B.x + 0.5 * jm) * SHADE.cu, V_ = (j + 0.5 + B.y) * SHADE.cv;
          const gx_ = U_ * la.x - V_ * la.y - cl.x, gz_ = U_ * la.y + V_ * la.x - cl.y, width = 1.8 * B.z * SHADE.cu;
          if (gx_ < -450 || gx_ > 600 || gz_ < -900 - period || gz_ > 1620) continue;
          at.push([gx_ + slope.x * (SHADE.alt + 0.3 * width), SHADE.alt, gz_ + slope.y * (SHADE.alt + 0.3 * width), width]);
        }
        if (j % 8 === 0) await ctx.yield();
      }
      // (built as three fields of a third of the clouds each, with a pause between: one field of them all was a 66 ms step in the kit)
      const rc = RS.fork('clouds'), third = Math.ceil(at.length / 3);
      for (let k = 0; k < at.length; k += third) {
        const shadeClouds = makeCloudField({ rng: rc, sky, at: at.slice(k, k + third), puffs: 6, wind: [WIND[0], 0, WIND[1]], sort: false, noiseTexture: towers.noiseTexture, farFade: [6000, 9000] });
        shadeClouds.object.name = 'shade-cumulus'; scene.add(shadeClouds.object);
        updaters.push({ update(dt, t, camera) { shadeClouds.update(dt, t % (period / windLen), camera); } });
        await ctx.yield();
      }
    }
    await ctx.yield();

    // the side fall's own scrap of rainbow: ONE small clean scrap of an arc low in its spray, half as strong as the Great Fall's, the true bow
    // of this sun, seen only where the line of sight crosses the spray at the fall's foot (the hero's bow shader on a second small volume, so it is the same bow and no new program)
    hero.addBow({ center: [cf.land - 9, basin.y + 11, zf], radius: [15, 16, 18], gain: 0.8 });
    await ctx.yield();

    // The Great Fall's spray answers to how near the traveller has come up the valley: to dR, the distance over the ground from the route's own
    // point at u to the foot of the fall (made in update() below). Every distance at which something changes is one of the spray's own reaches
    // or a place at the fall's foot, or twice that:
    const AP = {
      veil: A.sprayReach.veil,             // the furthest the thin high veil drifts in front of the foot: nearer than this the traveller is inside it
      skirt: A.sprayReach.skirt,           // the furthest the low skirt rolls down the pool and the river
      shore: POOL.z + POOL.rz - A.footZ,   // the pool's near shore
      seat: pz - A.footZ,                  // the ring (90 m)
    };
    // the outer bow: set ONCE, here at build, and never again: 0.07 of the inner one, as live has it (0.08 on the rare dewy morning)
    hero.uniforms.second.value = rare ? 0.08 : 0.07;
    const cloudOff = [CS.cloud.value.x, CS.cloud.value.y];
    const gaze = new THREE.Vector3(), routeAt = new THREE.Vector3(), gx = (A.lookAt.x + px) * 0.5;
    return {
      scene, path, duration: 46,
      camera: { fov: 62, near: 0.5, far: 5600, lookAhead: 34, sway: 0.8, bank: 1 },
      pois: [
        { at: [cf.x - 6, cf.y * 0.26, zf], from: 0.08, to: 0.34, weight: 0.75 },
        { at: (t, u) => gaze.set(gx, lerp(215, 85, sst(0.42, 0.8, u)), A.footZ), from: 0.37, to: 0.82, weight: 0.5 },
      ],
      portal: { shape: 'circle', radius: 7, color: '#dff0ff', glow: 1.4, revealDistance: 320 },
      post: { exposure: 1.0, bloom: { strength: 0.32, radius: 0.6, threshold: 1.0 },
        grade: { saturation: 1.04, contrast: 1.05, tint: '#fffaf3', shadowTint: '#0b1728', vignette: 0.28, grain: 0.02, aberration: 0 } },
      update(dt, t, camera, u) {
        time.value = t;
        deer.object.visible = u < 0.42; if (deer2) deer2.object.visible = u > 0.25 && u < 0.85;
        swifts.object.visible = u < 0.58; crossing.object.visible = u > 0.45 && u < 0.88;
        for (const o of updaters) if (!o.object || o.object.visible !== false) o.update(dt, t, camera, u);
        hero.setProgress(u);                                         // the bow comes up as the design has it
        // dR: how near the traveller has come to the Great Fall, over the ground from the route's own point at u to the fall's foot. This is the
        // world's ONE declared pacing by the traveller's place on the route: the spray follows it, and nothing here reads the camera
        path.pointAt(u, routeAt);
        const dR = Math.hypot(routeAt.x - A.foot.x, routeAt.z - A.footZ);
        const open = sst(AP.skirt, 2 * AP.skirt, dR);                // the cloud at the foot seen from outside: 0 while the traveller is inside the skirt's own reach, 1 from twice that reach
        const last = sst(AP.seat, 2 * AP.seat, dR);                  // 1 .. 0 over the last stretch, where the traveller is nearer the ring than the ring is to the foot
        hero.uniforms.ceil.value = lerp(0.58 * A.tiers.lower, A.plumeSize.y / 1.1, open);   // from afar the cloud stands the design's 140 m at its tallest puffs; under it, its ceiling is at 0.58 of the bottom tier, whose upper part stays dark rock and white water
        hero.uniforms.gust.value = lerp(0.9, 1.0, open) * lerp(0.8, 1, last);               // (thinner by a fifth at the ring: mist drifts past it, never thick enough to hide it)
        hero.uniforms.veil.value = lerp(0.12, 1, sst(AP.veil, 2 * AP.veil, dR));            // the high veil carries the arch across the wall; it is thin while the traveller is inside the veil's own reach, where it would whiten everything
        hero.uniforms.reach.value = sst(AP.shore, AP.skirt, dR);                            // the skirt's roll: its full length from the skirt's own reach out, kept to the foot by the pool's near shore
        hero.uniforms.near.value = 2 - sst(AP.veil, 2 * AP.veil, dR) - last;                // (see the hero: how the cloud squats and the lane before the column widens as the traveller comes inside the veil's reach, and again over the last stretch to the ring)
        hero.uniforms.bow.value *= lerp(0.78, 1, sst(AP.shore, AP.skirt, dR));              // inside the spray the bow is a veil of colour over the fall, not a painted band across it
        hero.update(dt, t, camera);
        CS.cloud.value.x = cloudOff[0] - WIND[0] * t; CS.cloud.value.y = cloudOff[1] - WIND[1] * t;      // the clouds, and their shadows, go down-valley with the wind
      },
      dispose() { hero.dispose(); if (strata && strata.texture) strata.texture.dispose(); },
    };
  },
};
