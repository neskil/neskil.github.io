// NIGHT BY THE SLICE: a night sky cast as a loaf of clear indigo jelly a kilometre long, lying on a cypress board in a
// dim evening room. It has been cut by the slice: five slices stand in a row beside it like a spread hand of cards,
// each a glowing blue pane holding its length of black ridge, its gold leaf and its own moon, a little fuller from
// slice to slice; then we fly in through the cut end and travel the night lengthways, from moon to moon, to the full
// one, which is the colourless core and the way out.
//
// STYLE (set jelly): four stuffs and no fifth (red-black paste, agar, white paste, gold leaf). No line, no shadow,
// no light inside, no fog: colour is thickness. Everything in the loaf is shaded by the hero's STYLE_GLSL (inJelly /
// throughJelly: per-channel absorption along the way in and the way to the eye, then the exact-colour inverse of the
// engine's tone map); everything outside (board, room, steel, loose leaf) is display colour through toScene.
// THE MEDIUM MOVES: one elastic wave per cut rides through every stuff together, the jelly is never quite still
// (uIdle), the skin shivers, the last slice is still settling as we arrive, a pale wash follows each wave.
// FOURTH ROUND (the crew lead's restaging; where it differs from the brief, it wins):
//   THE ROOM is evening: dark brown above, amber low, one paper lantern far to port whose light rakes the board and
//   comes through the slices, so the blue GLOWS; a tea bowl and a pair of chopsticks are far soft shapes; the knife
//   lies on the board, a thin bright blade and a dark handle (it is never a wall).
//   THE ROW OF SLICES is the first picture and the portal picture: thin crescent, fat crescent, half, gibbous, nearly
//   full, and the loaf's own cut end beyond them.
//   INSIDE IS A NIGHT LANDSCAPE: the walls are dark (the room is), the Moon Bar is a thread of paste and at five
//   stations a slice of the moon hangs face on in the sky ahead (shape.moons: crescent to gibbous, one every tenth of the way), the last is
//   the full exit disc; sugar is cloud (banks at mid distance that drift), the leaf is mostly far, the valley has knolls
//   with snow, furrows that break and waver, scraps lying in them, and a lake of clear agar that mirrors the third moon.
// FIFTH ROUND (polish): every slice in the row is seen to be jelly (it sways on its stuck foot, each on its own beat of
//   about two seconds, the last-set one rocking to rest over seven; on the room's clock, so it lives in the portal picture
//   too); the knife is in the scene, bright steel with its temper line and the lamp's one band, and is just being laid
//   down as we arrive; the moons inside are rounds that face the eye (never an egg), the unlit part a faint round of
//   clear jelly, every second one hung across the loaf so they never stand on one ray; leaf lies in the furrows from the
//   wet face on, the ranges stand taller through the blue middle, half the leaf in the air; two snow peaks flank the
//   exit; the rare long blade is that same steel (drag lines, a warm band, a wet line where it meets the jelly).
// SIXTH ROUND (polish, from outside reviewers who saw twelve plain stills): three quarters of the flecks are gone (no leaf
//   in the air on the board, a twentieth of it in the air inside; the leaf lies in the furrows and glints; five figures
//   of four-point stars; two or three banks of cloud); the middle has four subjects: the ROW OF MOONS receding down the
//   port side from the wet face (u 0.34), the LAKE under the half moon holding its whole round (u 0.43), THE LOOK OUT
//   through the port wall over a pass in the range to the lantern, the lamp-lit board and the knife (u 0.52: the hull
//   finds the room by the ray, hero uniforms uWin / uKnife; the knife seen there lies beside the loaf, drawn by the hull,
//   not the mesh at the cut end), and a SKEIN of wild geese of dark paste crossing the gibbous moon (u 0.61); the land
//   is lit (the dawn layer from z 225 on, a rim of moonlight and snow on every slope that faces the moons, finer and
//   softer furrows); the cut face is a sheet of pale blue with one rim line; THE EXIT IS THE FULL MOON, a round of
//   white paste 52 m across on the far face between the two snow peaks, the opening its middle with the same cream as
//   its veil (portal.veil through toScene), bubbles in the core's wall; the Moon Bar is its spooned tip alone (the thread
//   between the moons was a streak in every picture); the long cut shows the room through its fresh wet wall.
// EIGHTH ROUND (polish, the crew lead's directions and review 7): THE INSIDE IS A NIGHT COUNTRY, each stretch with one subject:
//   a lit VILLAGE of chestnut houses with white roofs and warm windows under the row of moons (u 0.34), the lake and the half
//   moon (0.43), THE LOOK OUT as one round window of clear jelly holding the lantern, the board and the knife (0.52), the
//   geese and the gibbous moon over a PAGODA of red bean on its spur (0.61), a low pass over an arched BRIDGE and the STREAM
//   of clear agar that runs from the lake (0.70), a fall of pulled sugar, the spooned tip (0.79), the full moon with its
//   hare, halo and ring. The firs are PIPED (a star nozzle's rosettes, scalloped, each leaning its own way). The ground is
//   furrowed paste near the eye (two flat tones) and tone and form beyond; the sky has a milky band, star clouds, small
//   clouds and a comet. THE JELLY IS SEEN TO WOBBLE: when a wave overtakes us everything set in it leans by its height
//   and springs back, a pale front runs down the valley, the lake breaks into rings; outside the cut end shudders once.
// VARIATIONS (by seed / ctx.vary): the edition's season (snowline), banks of cloud and skein (nine geese, five cranes, three); the room's light (lamplight; a paler paper lantern; embers), recipe (indigo + gold +
// black ridge; plum + silver + chestnut; winter: snow far down the flanks, slanting clear rods instead of the cloud
// banks), cast (nine geese, three long clouds, an empty sky), density (flakes, sugar). RARE: the long cut, a blade
// coming down lengthways 25 m to starboard at 22 s.
import * as THREE from 'three';
import { makePath } from '../kit/core.js';
import { buildHero, createJelly, barGeometry, toScene, pathXY, streamX, STYLE_GLSL, STYLE_VERT_GLSL, PALETTE, LOAF } from '../parts/night-by-the-slice.js';

const { sin, cos, abs, min, max, PI, floor, sqrt, pow } = Math;
const TAU = PI * 2;
const clamp = (x, a, b) => min(b, max(a, x));
const lerp = (a, b, t) => a + (b - a) * t;
const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const DURATION = 42, EXPOSURE = 1;
const STROKE = 2.4;                      // seconds the long blade takes to come down 80 m (the rare event)
const BLADE_REST_Y = 86;
const NIGHT = 1.15;                      // the loaf's tint against its slices'
const KERF = 0.2;                        // the blade's own thickness of jelly is lost: a slice is 19.8 m
const FIR_GROW = 1.6;                    // round 12: every piped fir is laid this many times as tall as the seventh round dealt it, on the same places
// The loaf was cut before we came: the last stroke a second ago (its wave is still going down the loaf and the last
// slice is still settling); two more cuts are heard from far behind while we are inside (their waves overtake us).
// THE WAY IN. From starboard, level with the middle of the slices: the row stands across the view, nearest slice at the
// left, the loaf's cut end at the right; the line runs along the row's near edges, each slice passing large on our
// left, and swings into the cut end.
const FAN = [[300, 8], [260, 34], [220, 60], [180, 86], [140, 112]];          // slice centres (x, z of the near face), nearest first
const FAN_MOON = [0.05, 0.25, 0.5, 0.76, 0.93], FAN_Z0 = [300, 400, 500, 580, 800];      // each slice's moon; the length of the loaf's picture it holds
const ENTRY = [[169, 52, -142], [170, 51.6, -100], [160, 51, -60], [136, 50, -5], [104, 48.5, 50], [70, 47, 100], [56, 46.3, 112], [36, 45.3, 140], [25, 44.7, 163], [18.5, 44.1, 195]];
const INSIDE_Z = [230, 270, 330, 400, 500, 535, 570, 605, 640, 700, 770, 845, 880, 915, 950, 975, 1000, 1030, 1059.4];      // the opening stands 0.6 m before the far face (never coplanar with the hull)
// slow outside (the row deserves it), slowest through the wet face, quick inside, near 1 for the last tenth
const worldPace = (u) => {
  const K = [[0, 0.72], [0.2, 0.66], [0.29, 0.55], [0.37, 1.1], [0.44, 0.86], [0.53, 0.95], [0.61, 1.25], [0.84, 1.25], [0.92, 1], [1, 1]];      // eighth round: it lingers over the lake and at the window
  let i = 0; while (i < K.length - 2 && u > K[i + 1][0]) i++;
  return lerp(K[i][1], K[i + 1][1], sstep(K[i][0], K[i + 1][0], u));
};
// journey seconds at u, from that pace
const T_TAB = new Float32Array(65);
{ let acc = 0; for (let i = 1; i <= 64; i++) { acc += 1 / (64 * worldPace((i - 0.5) / 64)); T_TAB[i] = acc; } for (let i = 1; i <= 64; i++) T_TAB[i] /= acc; }
const secondsAt = (u) => { const f = clamp(u, 0, 1) * 64, i = min(63, floor(f)); return DURATION * lerp(T_TAB[i], T_TAB[i + 1], f - i); };
// The loaf was cut before we came: the last stroke a second ago (its wave is still going down the loaf and the last
// slice is still settling); two more cuts are heard from far behind while we are inside. Their times are the design's
// own: "at 19 s a cut far behind ...; a second cut at 28 s", of its 40 s journey, scaled to this one's DURATION
// (19 * 42 / 40 = 19.95 s and 28 * 42 / 40 = 29.4 s). Each is a cut FAR behind: at 19.95 s the lens is at z 265 and the
// cut plane goes to z 180, 85 m behind it; at 29.4 s the lens is at z 574 and the plane goes to z 200, 374 m behind it.
// Where each wave then overtakes us follows from that and is not set.
// TENTH ROUND (B1): THE CUT IS SEEN ONCE, ON ARRIVAL. The loaf lies 20 m longer than we left it (its end at z 140); at CUT_T0 the
// knife comes down square through it 20 m behind its end, 80 m in STROKE seconds; at CUT_T the slab is off (the third cut).
// CUT_T is the design's time: "The blade comes down at 1.5 s behind a 20 m slab": at 1.5 s it is DOWN (10e). So its stroke is
// under way as we arrive and the knife is never seen in the air clear of the loaf.
// TENTH ROUND, the country: the village stands beside the flight line on the valley floor as it always did (10e);
// three CABINS stand by the pass on the starboard flank
// (z 663 to 689), passed near at the eye's height under the gibbous moon; the far sugar banks are smooth masses (their loose
// grains fold into the bank when they would be under four pixels); where furrows show, a tone's edge steps from furrow to furrow.
const CUT_T = 1.5, CUT_T0 = CUT_T - STROKE;
const CUT_TIMES = [-40, -20, CUT_T, 19 * DURATION / 40, 28 * DURATION / 40];      // journey seconds (the brief's two cuts heard from behind, at 19 and 28 s of its 40)
// the room's light, shared by everything that stands outside the jelly (after STYLE_GLSL, which declares uLamp and uRoomLow)
const ROOM_GLSL = /* glsl */`
  uniform vec3 uLampPos; uniform vec4 uLampK;       // intensity, reach (m), ambient, the flame's slow breathing
  vec3 roomLight(vec3 w, vec3 n, float wrap){
    vec3 L = uLampPos - w; float d = max(length(L), 1e-3);
    float I = uLampK.x*uLampK.w/(1. + d*d/(uLampK.y*uLampK.y));
    return uLamp*I*mix(1., clamp(dot(n, L/d)*0.5 + 0.5, 0., 1.), wrap) + uRoomLow*uLampK.z; }
`;

export default {
  id: 'night-by-the-slice',
  name: 'Night by the Slice',
  category: 'bizarre',
  weirdness: 0.9,
  media: ['tiny', 'interior'],
  async build(ctx) {
    const rng = ctx.rng, vary = ctx.vary || {};
    const dens = clamp(vary.density ?? 1, 0.7, 1.3), detail = clamp(ctx.quality?.detail ?? 1, 0.6, 1);
    const rare = !!vary.rare;
    const scene = new THREE.Scene();

    // ---------- the variation: light, recipe, cast ----------
    const lightR = rng(), recipeR = rng(), castR = rng();
    const light = (vary.hour === 'dawn' || vary.hour === 'day') ? 'lantern' : vary.hour === 'golden' ? 'lamplight' : vary.hour === 'night' ? 'embers'
      : lightR < 0.5 ? 'lamplight' : lightR < 0.75 ? 'lantern' : 'embers';
    const recipe = recipeR < 0.5 ? 'indigo' : recipeR < 0.76 ? 'plum' : 'winter';
    const cast = castR < 0.56 ? 'geese' : castR < 0.84 ? 'clouds' : 'empty';
    // SIXTH ROUND: THE EDITIONS differ inside too: the season on the ranges (how far down the snow lies), how many banks of
    // cloud, and the skein (nine geese in a V, five cranes in a line, three stragglers)
    const er = ctx.core.makeRng(ctx.core.hashSeed(ctx.seed + ':night-by-the-slice-edition'))();      // its own draw: the build's rng order is untouched
    const edition = { season: er < 0.4 ? 'snow' : er < 0.7 ? 'thaw' : 'deep', banks: er < 0.4 ? 3 : er < 0.7 ? 1 : 2 };
    const pal = PALETTE.slice();          // board, the light the jelly holds, ink, slab blue, dark paste, white paste, gold
    if (recipe === 'plum') { pal[2] = '#1B0B33'; pal[3] = '#B7A4E2'; pal[4] = '#3B2414'; pal[6] = '#C6CBD1'; }
    if (recipe === 'winter') { pal[2] = '#0B1638'; pal[3] = '#A3C9E8'; pal[4] = '#241318'; }
    if (light === 'lantern') pal[1] = '#F1F2EF';
    if (light === 'embers') pal[1] = '#EEEEF0';
    const ROOM = { lamplight: ['#120C09', '#3A2413', '#F2B55E'], lantern: ['#100D0B', '#35271B', '#F5D49A'], embers: ['#140908', '#41190F', '#EE9150'] }[light];
    const dayLowHex = light === 'lantern' ? '#E9EBEA' : light === 'embers' ? '#EBDCDD' : '#DDE6EC';
    const C = pal.map((h) => new THREE.Color(h));

    // ---------- the hero: the loaf, the Moon Bar and its moons, the leaf, the core ----------
    const flakes = Math.round(lerp(5400, 7000, (dens - 0.7) / 0.6));     // TENTH ROUND (B3): some six thousand scraps hang in the jelly again, each kept off the lens and out of every sight line (the part places them)     // sixth round: a twentieth of the leaf in the air (it read as dirt on the lens); the leaf lies in the furrows
    const hero = await buildHero(ctx, { palette: pal, detail, flakes, exposure: EXPOSURE, gibbous: rare ? { x: 16, y: 62 } : null });
    hero.object.position.set(0, 0, 580); hero.object.rotation.y = PI;        // loaf space == world space
    scene.add(hero.object); hero.object.updateMatrixWorld(true);
    const U = hero.uniforms, shape = hero.shape, jelly = hero.jelly, loaf = hero.loaf;
    const LAMP = new THREE.Vector3(-430, 170, 760);
    const setRoom = (u) => { u.uDayLow.value.set(dayLowHex); u.uRoomHi.value.set(ROOM[0]); u.uRoomLow.value.set(ROOM[1]); u.uLamp.value.set(ROOM[2]);
      u.uRoomBoard.value.copy(C[0]).multiply(u.uLamp.value).multiplyScalar(0.42); u.uLampDir.value.set(LAMP.x, LAMP.y + 120, LAMP.z - 300).normalize(); };
    setRoom(U);
    U.uLampPos.value.copy(LAMP); U.uLampK.value.set(1.3, 600, 1, 1);      // shared by everything outside (ROOM_GLSL) and by the hull's look out
    U.uWin.value.set(512, 48, 1, 24); U.uKnife.value.set(-140, 542, -0.543, 1);      // eighth round: the look out is one round window; the knife lies in its view
    U.uCapY.value = edition.season === 'thaw' ? 38 : edition.season === 'deep' ? 29 : 33;      // the season: how far down the ranges the snow lies
    if (recipe === 'winter') U.uCapY.value = 24.5;          // the winter loaf: snow far down the flanks, and on the cut faces too
    // sixth round: no leaf dashes on the cut faces (they read as scratches). TENTH ROUND (B2): in the geese edition the nine goose
    // rods are cut on every wet face. The design's cast is "geese (default), three long flat clouds ..., or an empty sky": the
    // cloud edition and the empty-sky edition have no white rod, chevron or ribbon anywhere (the three dark birds stay in all)
    const rods = cast === 'geese';
    U.uHas.value.set(1, 1, rods ? 1 : 0, 0);
    U.uIdleF.value = 2.1;
    U.uK.value.multiplyScalar(NIGHT);                    // the loaf itself is set a little darker than its slices: a night, not a sky
    hero.meshes.core.material.uniforms.uStrength.value = 1.25; hero.meshes.core.material.uniforms.uInGain.value = 0.3; hero.meshes.hull.material.uniforms.uDiscGain.value = 1.6;
    hero.meshes.hull.material.uniforms.uFarDim.value = 0.02; hero.meshes.hull.material.uniforms.uBand.value = 0; hero.meshes.hull.material.uniforms.uSky.value = 1;      // no pale lines along the walls: open sky
    const addLoaf = (geo, mat, order = 0) => { const m = new THREE.Mesh(geo, mat); m.frustumCulled = false; m.renderOrder = order; loaf.add(m); return m; };
    await ctx.yield();

    // ---------- the path ----------
    const pxy = [0, 0];
    const path = makePath(ENTRY.concat(INSIDE_Z.map((z) => { pathXY(z, pxy); return [pxy[0], pxy[1], z]; })));
    await ctx.yield();
    // ---------- the ridge: red-black paste filling the bottom, a 121-point profile swept over 250 rings ----------
    const ridgeGeometry = async (z0, z1, rings, nx = 120) => {
      // the rings stand closer together over the lake, so its shore is a smooth line (sixth round)
      const dense = z1 - z0 > 100;
      const zs = []; { let acc = 0; for (let i = 0; i <= rings; i++) { zs.push(acc); const zz = lerp(z0, z1, i / rings); acc += dense && ((zz > shape.lake.z0 - 12 && zz < shape.lake.z1 + 12) || zz > 990) ? 0.4 : 1; } for (let i = 0; i <= rings; i++) zs[i] = lerp(z0, z1, zs[i] / zs[rings]); }
      const zAt = (t) => zs[Math.round(t * rings)];
      const pos = new Float32Array((rings + 1) * (nx + 1) * 3), nor = new Float32Array(pos.length), idx = new Uint16Array(rings * nx * 6);
      for (let i = 0; i <= rings; i++) {
        if (i % 40 === 39) await ctx.yield();
        const z = zAt(i / rings);
        for (let j = 0; j <= nx; j++) {
          const x = lerp(LOAF.x0, LOAF.x1, j / nx), k = (i * (nx + 1) + j) * 3, h = shape.ridgeH(x, z);
          const hx = shape.ridgeH(x + 0.5, z) - shape.ridgeH(x - 0.5, z), hz = (shape.ridgeH(x, z + 2) - shape.ridgeH(x, z - 2)) / 4;
          const l = Math.hypot(hx, 1, hz);
          pos[k] = x; pos[k + 1] = h; pos[k + 2] = z; nor[k] = -hx / l; nor[k + 1] = 1 / l; nor[k + 2] = -hz / l;
        }
      }
      let q = 0;
      for (let i = 0; i < rings; i++) for (let j = 0; j < nx; j++) {
        const a = i * (nx + 1) + j, b = a + 1, c = a + nx + 1, d = c + 1;
        idx[q++] = a; idx[q++] = c; idx[q++] = b; idx[q++] = b; idx[q++] = c; idx[q++] = d;
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
      g.setIndex(new THREE.BufferAttribute(idx, 1));
      g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 20, (z0 + z1) / 2), (z1 - z0) / 2 + 80);
      return g;
    };
    const m3 = shape.moons[2], m3c = shape.moonC(m3);      // the half moon, which hangs beyond the lake's far end and lies whole in it
    const ridge = addLoaf(await ridgeGeometry(LOAF.z0, LOAF.z1, 290), jelly.pasteMaterial(C[4], { grain: 0.3, furrow: 1, cap: true, keep: 0.5, moonLit: 1, model: 0.18,      // ninth round: flat tones by facing, not soft modelling by thickness (it left dark blots on the knolls)
      
      lake: new THREE.Vector4(shape.lake.z0, shape.lake.z1, shape.lake.y, 1), lakeMoon: new THREE.Vector4(m3c[0], m3c[1], m3.z, m3.R), lakeMoon2: new THREE.Vector2(m3.p, shape.barA(160)) }), 0);
    void ridge;
    await ctx.yield();
    // ---------- EIGHTH ROUND: THE NIGHT COUNTRY. Where its confections stand (the firs, the leaf and the stream keep clear of them) ----------
    // (the pagoda stands where the eighth round set it: on its spur on the starboard range, under the gibbous moon; the tenth round's
    // three cabins stand below it by the pass)
    const SITE = { village: [-9, 328], bridge: 727, pagoda: [38, 670], fall: 794, cabins: [25, 676] };
    const KEEP_OUT = [[SITE.village[0], SITE.village[1], 27], [streamX(SITE.bridge), SITE.bridge, 11], [SITE.pagoda[0], SITE.pagoda[1], 10], [SITE.cabins[0], SITE.cabins[1], 21]];
    U.uStream.value.w = 1;
    // ---------- SEVENTH ROUND: PINES. The land has something standing on it: groves of firs piped in dark paste, each tier
    // tipped with white, on the lower slopes either side of the valley (never on the snow, in the lake or in the leaf's furrows
    // under the flight line). They ride the jelly's wave with the ground they stand on; far off they give way to a texture.
    // (The deal below is the seventh round's own and is not touched: it places each fir and gives it a height of 2.3 to 5.7 m,
    // a quarter more beside the flight line. ROUND 12, further down, lays every one of them FIR_GROW times as tall.) ----------
    let firLaid = null;                    // round 12: the firs as laid, handed on to rule (c) where the built things are made
    {
      const pr = ctx.core.makeRng(ctx.core.hashSeed(ctx.seed + ':night-by-the-slice-pines')), want = Math.round(700 * detail);
      const sets = [{ p: [], q: [] }, { p: [], q: [] }, { p: [], q: [] }]; let n = 0;      // [beside the flight line down the last valley, near, far]
      for (let k = 0; k < want * 16 && n < want; k++) {
        if (k % 500 === 499) await ctx.yield();
        const z = 198 + pr() * 850, side = pr() < 0.5 ? -1 : 1, off = 8.5 + 42 * pow(pr(), 1.4), r3 = pr(), r4 = pr(), r5 = pr();
        pathXY(z, pxy); const x = pxy[0] + side * off;
        if (x < LOAF.x0 + 3 || x > LOAF.x1 - 3) continue;
        if (ctx.noise.n2(x * 0.045 + 31, z * 0.021) < -0.05 + 0.25 * r5) continue;                         // they stand in groves
        const h = shape.ridgeH(x, z), tall = 2.3 + 3.4 * r3 * r3;
        if (h > U.uCapY.value - 2.5 || abs(shape.ridgeH(x + 1, z) - shape.ridgeH(x - 1, z)) > 2.1) continue;      // not on the snow, not on a wall
        if (z > shape.lake.z0 - 5 && z < shape.lake.z1 + 5 && h < shape.lake.y + 1.2) continue;
        if (Math.hypot(x - pxy[0], h + tall - pxy[1]) < 8) continue;
        if (z > 500 && abs(x - streamX(z)) < 4.5) continue;                                                // not in the stream
        if (KEEP_OUT.some((c) => Math.hypot(x - c[0], z - c[1]) < c[2])) continue;                         // not on the village, the bridge, the pagoda's spur
        const S = sets[off < 17 ? (off < 13 && z > 725 && z < 912 ? 0 : 1) : 2]; S.p.push(x, h - 0.2, z, tall * (off < 17 ? 1.25 : 1)); S.q.push(r4 * TAU, r5); n++;
      }
      // EIGHTH ROUND: A FIR IS PIPED. Three rosettes from a star nozzle, one on another: each tier has seven flutes, so its
      // silhouette is scalloped and its skirt is a row of soft lobes that droop; the top is pulled up into a little peak
      // that curls over; a dab of white paste lies on each tier, its lower edge dripping down the lobes. Flat tones only
      // (the side toward the moons, the cooler side, the grooves): the shader takes them from the fluting, not from a light.
      // NINTH ROUND: THE FLUTES ARE ROPES OF PASTE. The nozzle's star leaves round ribs with a narrow crease between them
      // (|sin|, not a cosine sampled at three corners): the geometry follows the ribs' twist so a crease always lies on a
      // column of vertices, and every tone (the crease, the edge between the moonward and the cool side curving round each
      // rib, the white dab hanging in round drips) is worked out per fragment from the angle, so no edge follows a triangle.
      // The firs beside the flight line down the last valley have six columns to a rib, the rest of the near ones three.
      const FL = 7;
      // TENTH ROUND: THE HEM IS A ROW OF ROPE ENDS. The skirt hangs nearly straight down from the tier's widest ring and is cut,
      // per fragment, along a round line worked out from the rib's own angle (so every rib ends in one full drooping curve,
      // whatever the mesh); the firs beside the flight line have eight columns to a rib and four rings in the skirt, the far
      // ones two rings a tier (their triangles pay for the near ones).
      const firGeo = (per, rings) => {
        const sides = FL * per, pos = [], af = [], idx = [], TIER = [[0.07, 0.5, 0.36, 0.42], [0.38, 0.42, 0.265, 0.4], [0.65, 0.36, 0.17, 0]];      // y0, height, radius, neck
        const FINE = [0, 0.1, 0.2, 0.45, 0.72, 1], FINE2 = [0, 0.1, 0.2, 0.4, 0.6, 0.8, 1];
        for (let k = 0; k < 3; k++) { const [y0, hh, R, neck] = TIER[k], base = pos.length / 3;
          const ts = per >= 6 ? (k === 2 ? FINE2 : FINE) : rings === 2 ? (k === 2 ? [0, 0.2, 0.55, 1] : [0, 0.2, 1]) : (k === 2 ? [0, 0.2, 0.4, 0.6, 0.8, 1] : [0, 0.2, 0.45, 0.72, 1]), nr = ts.length - 1;
          for (let i = 0; i <= nr; i++) { const t = ts[i], prof = t < 0.2 ?      // (a ring always at the skirt's widest)
            lerp(0.8, 1, sin((t / 0.2) * PI / 2)) : lerp(1, neck, pow((t - 0.2) / 0.8, k === 2 ? 0.8 : 1.3));
            for (let j = 0; j <= sides; j++) { const ap = (j / sides) * TAU, a = ap - (2.2 * t + k * 1.3) / FL, L = abs(sin(FL * 0.5 * ap)), depth = 0.3 * (1 - 0.5 * t);
              const r = R * prof * (1 + depth * (L - 0.64) * 1.5), curl = k === 2 ? 0.17 * t * t * t : 0;
              pos.push(r * cos(a) + curl, y0 + hh * t - 0.15 * hh * (1 - t) * (1 - t) * L * L - (k === 2 ? 0.07 * t * t * t * t : 0), r * sin(a) + curl * 0.4); af.push(ap, t, k); } }
          for (let i = 0; i < nr; i++) for (let j = 0; j < sides; j++) { const p0 = base + i * (sides + 1) + j, p1 = p0 + 1; idx.push(p0, p0 + sides + 1, p1, p1, p0 + sides + 1, p1 + sides + 1); } }
        const g = new THREE.InstancedBufferGeometry();
        g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aF', new THREE.Float32BufferAttribute(af, 3)); g.setIndex(idx);
        return g;
      };
      const firMat = () => new THREE.ShaderMaterial({
        uniforms: Object.assign({}, U, { uDarkP: { value: C[4] }, uSnowP: { value: C[5] }, uKeep: { value: 0.5 }, uModel: { value: 0 } }), side: THREE.DoubleSide,
        vertexShader: /* glsl */`${STYLE_GLSL}${STYLE_VERT_GLSL}
          uniform float uPx; attribute vec4 aP; attribute vec2 aQ; attribute vec3 aF;
          varying vec3 vP; varying vec3 vEye; varying vec4 vF;
          void main(){
            vEye = eyeLocal(); float c = cos(aQ.x), s = sin(aQ.x), dist = length(vEye - aP.xyz);
            float grow = clamp(2.2*dist/max(aP.w*0.6*uPx, 1e-3), 1., 2.6);                 // never a speck: far off a grove is a texture of the slope
            vec3 l = vec3(position.x*c - position.z*s, position.y, position.x*s + position.z*c)*aP.w*vec3(0.8 + 0.35*aQ.y, 1., 0.8 + 0.35*aQ.y)*grow;
            vF = vec4(aF, aQ.x);                                                           // the rib's own angle, the height in the tier, the tier; how the fir is turned
            l.xz += (vec2(hash11(aQ.x*3.1 + 1.), hash11(aQ.x*7.7 + 2.)) - 0.5)*0.34*l.y;     // no two stand alike: each leans its own way
            vec3 wb = wobble(aP.xyz);
            l.x += (wobble(aP.xyz + vec3(0., 30., 0.)).x - wb.x)*0.2*l.y;                  // soft paste set in jelly: a fir leans with the wave and springs back
            vP = aP.xyz + l;
            gl_Position = projectionMatrix*modelViewMatrix*vec4(vP + wb, 1.);
          }`,
        fragmentShader: /* glsl */`${STYLE_GLSL}
          uniform vec3 uDarkP, uSnowP; varying vec3 vP; varying vec3 vEye; varying vec4 vF;
          void main(){
            if (vP.z < uBoxMin.z || vP.x > uBoxMax.x) discard;
            float ap = vF.x, t = vF.y, ph = ${FL.toFixed(1)}*0.5*ap, L = abs(sin(ph));                 // L: 0 in the crease, 1 on the rib's back
            float aw = clamp(fwidth(ph), 1e-3, 1.), at = clamp(fwidth(t)*1.5, 0.01, 0.3);
            float across = fract(ph/3.14159265) - 0.5;                                         // -0.5 .. 0.5 across one rib
            float th = ap - (2.2*t + vF.z*1.3)/${FL.toFixed(1)} + vF.w + 2.3*across;                 // which way the rib's skin faces there: it turns right round the rope
            float lw = clamp(aw*1.5, 0.03, 0.5);
            float lit = smoothstep(-lw, lw, cos(th - 2.406) + 0.12);                           // two flat tones; their edge is a smooth curve round each rib
            float groove = (1. - smoothstep(0.1, 0.1 + max(aw, 0.04), L))*(1. - smoothstep(0.12, 0.3, aw));      // the crease: narrow, dark; finer than a pixel and a half it is gone
            float se = t - 0.68 + 0.37*L*L + 0.07*(vnoise(vP.xz*2.3 + vP.y*1.7) - 0.5);            // the white dab: it hangs down each rib in a round drip
            float snow = smoothstep(-at, at, se);
            // tenth round: the hem's round cut (far off, where a rib is under a few pixels, its mean), and the little shadow each
            // tier's rope ends lay on the tier beneath: one flat cooler tone whose edge follows those lobes
            float hemK = 1. - smoothstep(0.25, 0.7, aw);
            float hq = 1. - L;                                                                   // 0 on the rib's back, 1 in the crease: a wide round end, a narrow notch between two
            if (t < mix(0.1, 0.2*(0.08 + 0.92*hq*hq*(0.55 + 0.45*hq)), hemK)) discard;
            float LU = abs(sin(${FL.toFixed(1)}*0.5*(ap + (0.44 - 2.2*t + 1.3)/${FL.toFixed(1)})));
            float und = step(vF.z, 1.5)*smoothstep(-at, at, t - 0.72 + 0.1*LU)*hemK;
            vec3 dark = uDarkP*mix(0.5, 1.15, lit)*(1. - 0.45*groove)*(1. - 0.4*und)*(1. + 0.7*frontP(vP));      // the wave's pale front lifts the dark paste only: the white is never whiter than the moon
            vec3 alb = mix(dark, mix(uSnowP*mix(vec3(0.6, 0.69, 0.9), vec3(0.94), lit*(1. - und))*mix(vec3(1.), vec3(0.66, 0.72, 0.86), groove), uSnowP*0.955, 0.42*frontP(vP)), snow);      // tenth round: in the front the white is a step nearer the cream, never past it
            gl_FragColor = vec4(inJelly(alb, vP, vec3(0., 1., 0.), vEye), 1.);
          }`,
      });
      for (const [zf, tf, rf] of [[521, 5.4, 0.7], [529, 6.6, 2.9], [540, 4.8, 4.4], [551, 6.1, 1.6], [563, 5.2, 5.3]]) {      // ninth round: firs on the spur's crest; tenth round: the spur and its firs stand BESIDE the window, ahead of it
        let bx = -30, bh = -1; for (let x = -42; x <= -18; x += 1) { const h = shape.ridgeH(x, zf); if (h > bh) { bh = h; bx = x; } }
        sets[1].p.push(bx, bh - 0.3, zf, tf); sets[1].q.push(rf, 0.3 + 0.1 * rf); }
      // ---------- ROUND 12: EVERY FIR 1.6 TIMES AS TALL, ON LIVE'S PLACES. Strangers said of the firs as dealt: "small sparse trees
      // leave the striped slopes looking bare". Every fir of the block (the three sets and the five on the spur) is laid FIR_GROW
      // times as tall as it was dealt: only the height that goes into its instance (the fourth of aP) is multiplied, and only
      // here, after the deal is done, so the deal's draws, its tests (which read the heights as dealt), its places and its count
      // are the seventh round's own. FIR_GROW is one number for the whole field, tuned for no still, after a plain look.
      // A GROWN FIR THAT WOULD STAND WHERE THE DEALT ONE COULD NOT IS NOT LAID (its draws were taken; nothing replaces it). Three
      // rules of the place, read with the grown fir; (a) and (b) are the deal's own and are read here, (c) is read further down,
      // where the built things are made: (c) a grown fir whose lowest tier's widest ring is inside a built thing's own outline
      // (a village house, a cabin, the pagoda, the bridge) or passes a side wall of the loaf is not laid. No distance is typed
      // for it: inside or not, by the thing's own triangles in plan. (a) the deal's test of the top: the grown top is not within 8 m of
      // the flight line in the cross section; (b) no part of a grown fir comes nearer to the route's line, anywhere along the
      // route, than the nearest part of any fir of this same deal comes to it at its dealt height. A fir's parts are its three
      // tiers as firGeo makes them (every vertex of its own set's mesh, so each tier's hem, widest ring, neck and the peak), leaning
      // as far as they ever can: its own lean either way (the shader's hash is not known here), and the medium's wobble at its
      // fullest either way over the whole journey, whatever the wall clock (twins of the part's wobble() and of update below:
      // the waves, the fresh face's quiver, the idle sway, the cut end's shudder, in the rare edition the long cut's wave). ----------
      await ctx.yield();
      {
        // each set's fir as its own mesh has it (the same three meshes the loop below makes): every vertex, the widest it reaches from its axis, its foot and its peak
        const FPS = [firGeo(6, 4), firGeo(3, 4), firGeo(2, 2)].map((g) => { const a = g.getAttribute('position').array; let r = 0, y0 = 0, y1 = 0;
          for (let i = 0; i < a.length; i += 3) { r = max(r, Math.hypot(a[i], a[i + 2])); y0 = min(y0, a[i + 1]); y1 = max(y1, a[i + 1]); } return { a, r, y0, y1 }; });
        const v3 = new THREE.Vector3(), LN = [];
        for (let d = 0; d <= path.length; d += 0.25) { path.posAtDist(d, v3); LN.push(v3.x, v3.y, v3.z); }      // the route's line, a point every quarter metre (its z only rises)
        const NL = LN.length / 3, BOX_H = LOAF.y1 - LOAF.y0;
        const wobX = (y) => { const hh = clamp(y / BOX_H, 0, 1); return 0.1 + 2.7 * hh * sqrt(hh); };      // wobble(): metres of x per metre of wave, at height y
        // how near the line comes to a box of places (x0..x1, y0..y1, z within zr of z), if nearer than lim
        const boxClear = (x0, x1, y0, y1, z, zr, lim) => {
          let a = 0, b = NL - 1, best = lim * lim; while (b - a > 1) { const m = (a + b) >> 1; if (LN[m * 3 + 2] < z) a = m; else b = m; }
          const l2 = best;
          for (let dir = -1; dir <= 1; dir += 2) for (let j = dir < 0 ? a : a + 1; j >= 0 && j < NL; j += dir) {
            const dz = max(abs(LN[j * 3 + 2] - z) - zr, 0); if (dz * dz >= best) break;
            const X = LN[j * 3], Y = LN[j * 3 + 1], dx = X < x0 ? x0 - X : X > x1 ? X - x1 : 0, dy = Y < y0 ? y0 - Y : Y > y1 ? Y - y1 : 0, d = dx * dx + dy * dy + dz * dz;
            if (d < best) best = d; }
          return best < l2 ? sqrt(best) : lim; };
        // how near the line comes to any part of a fir (F: its set's mesh; its instance: x, y, z, height, turn, girth), if nearer
        // than lim, while the wobble's metres at its foot range from lo (0 or less) to hi (0 or more)
        const partsClear = (F, x, y, z, tall, ang, wid, lo, hi, lim) => {
          const A = wobX(y), S = wobX(y + 30) - A, dy = 0.1 * clamp(y / BOX_H, 0, 1), c = cos(ang), s = sin(ang), k = tall * (0.8 + 0.35 * wid), FP = F.a;
          const R = F.r * k + 0.17 * F.y1 * tall, gT = A + 0.2 * S * F.y1 * tall;                                 // the whole fir in one box first:
          if (boxClear(x - R + lo * gT, x + R + hi * gT, y + F.y0 * tall - dy * hi, y + F.y1 * tall - dy * lo, z, R, lim) >= lim) return lim;      // too far off for any part of it to matter
          let best = lim;
          for (let i = 0; i < FP.length; i += 3) { const lx = (FP[i] * c - FP[i + 2] * s) * k, ly = FP[i + 1] * tall, lz = (FP[i] * s + FP[i + 2] * c) * k, own = 0.17 * abs(ly), g = A + 0.2 * S * ly;
            best = boxClear(x + lx + lo * g - own, x + lx + hi * g + own, y + ly - dy * hi, y + ly - dy * lo, z + lz, own, best); }
          return best; };
        // the wobble's metres at a foot, least and most over the whole journey whatever the wall clock: the part's wave1 and wobble()
        // and update's uIdle and uShud (below), twinned, in steps of a fiftieth of a second
        const wobFull = (x, z) => { let lo = 0, hi = 0;
          for (let t = 0; t <= DURATION; t += 0.02) { let w = 0, face = LOAF.z0;
            for (let i = 0; i < 5; i++) { const age = t - CUT_TIMES[i], dz = z - LOAF.z0 - LOAF.slab * (i + 1); if (age < 0) continue; face += LOAF.slab;
              const h = sin(PI * clamp((dz - LOAF.waveSpeed * age) / LOAF.waveLength, -1, 0));
              w += h * h * LOAF.waveHeight + Math.exp(-age * 1.2 - max(dz, 0) / 70) * sin(age * 8 - dz * 0.07) * 0.3; }
            if (rare && t >= 21) { const h2 = sin(PI * clamp((33 - x - 70 * (t - 21)) / 70, -1, 0)); w -= h2 * h2 * 1.4 * Math.exp(-(t - 21) * 0.35); }      // the long cut's sideways wave (LONG, below: down at 21 s, at x 33)
            const m = 0.3 + 0.67 * (1 - sstep(9, 15, t)) + 0.28 * sstep(33, 37, t) + 1.5 * sstep(CUT_T - 0.2, CUT_T + 0.7, t) * (1 - sstep(CUT_T + 2.2, CUT_T + 6, t)) * Math.exp(-max(z - face, 0) / 110);
            lo = min(lo, w - m); hi = max(hi, w + m); }
          return [lo, hi]; };
        // a fir's whole course against the line: first as if every swing came at once and at its greatest (the wave's height, the
        // quiver, the idle sway, the shudder, the long cut's wave); only a fir that is not clear of lim even so is worked out
        const firClear = (F, x, y, z, tall, ang, wid, lim) => {
          const wm = 0.97 + 0.3 * Math.exp(-max(z - LOAF.z0 - 5 * LOAF.slab, 0) / 70) + 1.5 * Math.exp(-max(z - LOAF.z0 - 3 * LOAF.slab, 0) / 110);
          if (partsClear(F, x, y, z, tall, ang, wid, -wm - (rare ? 1.4 : 0), LOAF.waveHeight + wm, lim) >= lim) return lim;
          const [lo, hi] = wobFull(x, z); return partsClear(F, x, y, z, tall, ang, wid, lo, hi, lim); };
        let least = 1e9;                                                                                          // the nearest any part of any fir comes to the line as dealt
        for (const S of sets) for (let i = 0; i < S.q.length / 2; i++) { if (i % 100 === 99) await ctx.yield();
          least = firClear(FPS[sets.indexOf(S)], S.p[i * 4], S.p[i * 4 + 1], S.p[i * 4 + 2], S.p[i * 4 + 3], S.q[i * 2], S.q[i * 2 + 1], least); }
        await ctx.yield();
        for (const S of sets) { const p = [], q = [], F = FPS[sets.indexOf(S)];
          for (let i = 0; i < S.q.length / 2; i++) { const x = S.p[i * 4], y = S.p[i * 4 + 1], z = S.p[i * 4 + 2], tall = S.p[i * 4 + 3] * FIR_GROW;
            if (i % 50 === 49) await ctx.yield();
            pathXY(z, pxy);
            if (Math.hypot(x - pxy[0], shape.ridgeH(x, z) + tall - pxy[1]) < 8) continue;                         // (a)
            if (firClear(F, x, y, z, tall, S.q[i * 2], S.q[i * 2 + 1], least) < least) continue;                  // (b)
            p.push(x, y, z, tall); q.push(S.q[i * 2], S.q[i * 2 + 1]); }
          S.p = p; S.q = q; }
        firLaid = { sets, ring: FPS[0].r, top: FPS[0].y1 };      // for rule (c): the three sets as laid; a fir's widest ring and its peak as its finest mesh has them, per metre of height
      }
      for (let i = 0; i < 3; i++) { const g = firGeo(i === 0 ? 6 : i === 1 ? 3 : 2, i === 2 ? 2 : 4), S = sets[i], cnt = S.q.length / 2;
        if (!cnt) { S.p.push(0, -50, 400, 1); S.q.push(0, 0); }
        g.setAttribute('aP', new THREE.InstancedBufferAttribute(new Float32Array(S.p), 4)); g.setAttribute('aQ', new THREE.InstancedBufferAttribute(new Float32Array(S.q), 2)); g.instanceCount = max(cnt, 1);
        g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 40, 580), 900);
        addLoaf(g, firMat(), 0); await ctx.yield(); }
    }
    // ---------- EIGHTH ROUND: the confections of the night country, all in the sweet's own stuffs and one draw call: a VILLAGE of
    // little houses of chestnut paste with roofs of white (sugar snow) and warm windows (the lantern's colour, the one warm
    // note inside) on the near shore of the lake; an arched BRIDGE of red bean over the stream; a three-storeyed PAGODA of
    // red bean on a spur under the gibbous moon; a FALL of pulled sugar down the starboard slope into the stream.
    // Flat tones only: each face is the stuff's colour on the side toward the moons, a cooler shade on the side away. ----------
    {
      const cr = ctx.core.makeRng(ctx.core.hashSeed(ctx.seed + ':night-by-the-slice-country'));
      const pos = [], col = [], kd = [], foot = [], uvs = [], tc = new THREE.Color(), MOON = [-0.62, 0.55, 0.56];
      const WALL = recipe === 'plum' ? '#6E4A2A' : '#5E3420', BEAN = '#9A3F36', ROOF = '#F4EEDC', ROOF_COOL = '#D6D8DE', WOOD = '#3A1D18';
      let FT = [0, 0, 0];
      const quad = (A, B, Cc, D, hex, k = 0, uv = null) => {
        const ux = B[0] - A[0], uy = B[1] - A[1], uz = B[2] - A[2], vx = D[0] - A[0], vy = D[1] - A[1], vz = D[2] - A[2];
        let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
        const mid = [(A[0] + Cc[0]) / 2 - FT[0], (A[1] + Cc[1]) / 2 - FT[1] - 2, (A[2] + Cc[2]) / 2 - FT[2]];
        if (nx * mid[0] + ny * mid[1] + nz * mid[2] < 0) { nx = -nx; ny = -ny; nz = -nz; }                // outward from the thing's own middle
        const f = nx * MOON[0] + ny * MOON[1] + nz * MOON[2], tone = k === 1 || k === 2 || k === 3 ? 1 : f > 0.3 ? 1 : ny > 0.6 ? 0.86 : 0.58;
        tc.set(hex); const cool = tone < 0.7 ? [0.92, 0.96, 1.12] : [1, 1, 1];
        const V = [A, B, Cc, A, Cc, D], T = uv ? [uv[0], uv[1], uv[2], uv[0], uv[2], uv[3]] : null;
        for (let i = 0; i < 6; i++) { pos.push(V[i][0], V[i][1], V[i][2]); col.push(tc.r * tone * cool[0], tc.g * tone * cool[1], tc.b * tone * cool[2]); kd.push(k); foot.push(FT[0], FT[1], FT[2]); uvs.push(T ? T[i][0] : 0, T ? T[i][1] : 0); }
      };
      // a box turned by ry about its own middle: half sizes hw, hd; from y0 to y1; taper = how much narrower its top is
      const boxAt = (cx, cz, ry, hw, hd, y0, y1, hex, k = 0, taper = 1, sides = true, top = true, topHex = null) => {
        const c = cos(ry), sn = sin(ry), P = (lx, lz, y, t) => [cx + (lx * c + lz * sn) * t, y, cz + (-lx * sn + lz * c) * t];
        const b = [P(-hw, -hd, y0, 1), P(hw, -hd, y0, 1), P(hw, hd, y0, 1), P(-hw, hd, y0, 1)], t = [P(-hw, -hd, y1, taper), P(hw, -hd, y1, taper), P(hw, hd, y1, taper), P(-hw, hd, y1, taper)];
        if (sides) for (let i = 0; i < 4; i++) quad(b[i], b[(i + 1) % 4], t[(i + 1) % 4], t[i], hex, k);
        if (top) quad(t[0], t[1], t[2], t[3], topHex || hex, k);
        return { b, t, P };
      };
      const win = (cx, cz, ry, lx, lz, y, w, h, alongX) => {          // a warm window, a hand's breadth proud of its wall
        const c = cos(ry), sn = sin(ry), P = (x, z, yy) => [cx + x * c + z * sn, yy, cz - x * sn + z * c];
        if (alongX) quad(P(lx - w / 2, lz, y), P(lx + w / 2, lz, y), P(lx + w / 2, lz, y + h), P(lx - w / 2, lz, y + h), '#ffffff', 1, [[0, 0], [1, 0], [1, 1], [0, 1]]);
        else quad(P(lx, lz - w / 2, y), P(lx, lz + w / 2, y), P(lx, lz + w / 2, y + h), P(lx, lz - w / 2, y + h), '#ffffff', 1, [[0, 0], [1, 0], [1, 1], [0, 1]]);
      };
      // THE VILLAGE: seven houses about a little green on the lake's near shore
      // one house of chestnut paste at (x, z) standing on ground g: walls, two slopes of white, the ridge, gables, five warm windows, a chimney
      const house = (x, z, ry, hw, hd, wh, rh, g, chim) => {
        FT = [x, g, z];
        const B = boxAt(x, z, ry, hw, hd, g - 1.2, g + wh, WALL, 0, 1, true, false);
        const r0 = B.P(0, -hd, g + wh + rh, 1), r1 = B.P(0, hd, g + wh + rh, 1), ov = 0.7;                 // the ridge of the roof runs along its depth
        const e = [B.P(-hw - ov, -hd - ov, g + wh - 0.5, 1), B.P(hw + ov, -hd - ov, g + wh - 0.5, 1), B.P(hw + ov, hd + ov, g + wh - 0.5, 1), B.P(-hw - ov, hd + ov, g + wh - 0.5, 1)];
        const q0 = B.P(0, -hd - ov, g + wh + rh, 1), q1 = B.P(0, hd + ov, g + wh + rh, 1);
        const mw = 0.62 * cos(ry) + 0.56 * sin(ry) > 0;                                                       // which slope is turned to the moons
        const RUV = [[0, 0], [0, 1], [1, 1], [1, 0]];      // tenth round: a roof slope knows where its eave and its ridge are (kind 3: white paste laid on a roof)
        quad(e[0], q0, q1, e[3], mw ? ROOF : ROOF_COOL, 3, RUV); quad(e[1], q0, q1, e[2], mw ? ROOF_COOL : ROOF, 3, RUV);         // two slopes of white, two tones
        { const up = 0.32, rw = 0.5, a0 = B.P(-rw, -hd - ov - 0.25, g + wh + rh - 0.12, 1), a1 = B.P(-rw, hd + ov + 0.25, g + wh + rh - 0.12, 1), b0 = B.P(rw, -hd - ov - 0.25, g + wh + rh - 0.12, 1), b1 = B.P(rw, hd + ov + 0.25, g + wh + rh - 0.12, 1),
            t0 = B.P(0, -hd - ov - 0.25, g + wh + rh + up, 1), t1 = B.P(0, hd + ov + 0.25, g + wh + rh + up, 1);
          quad(a0, t0, t1, a1, WALL, 0); quad(b0, t0, t1, b1, WOOD, 0); }                                      // the ridge: a rope of chestnut paste
        quad(B.t[0], B.t[1], r0, r0, WALL, 0); quad(B.t[3], B.t[2], r1, r1, WALL, 0);                         // the gables
        win(x, z, ry, -hw * 0.45, -hd - 0.14, g + 0.9, 2.3, 2.4, true); win(x, z, ry, hw * 0.45, -hd - 0.14, g + 0.9, 2.3, 2.4, true);
        win(x, z, ry, 0, hd + 0.14, g + 0.9, 3, 2.4, true); win(x, z, ry, -hw - 0.14, 0, g + 0.9, 2.6, 2.4, false); win(x, z, ry, hw + 0.14, 0, g + 0.9, 2.6, 2.4, false);
        if (chim) boxAt(x + 0.5 * hw * cos(ry), z - 0.5 * hw * sin(ry), ry, 0.55, 0.55, g + wh, g + wh + rh + 1.2, WOOD, 0, 1, true, true, ROOF);      // a chimney with a cap of white
      };
      const HOUSES = [];
      for (let i = 0; i < 8; i++) { const an = (i / 8) * TAU + 0.5 * cr(), rad = i === 0 ? 0 : 9.5 + 9 * cr();
        let x = SITE.village[0] + rad * cos(an) * 1.05, z = SITE.village[1] + rad * sin(an) * 1.25; const ry = cr() * PI, hw = 3.3 + 1.6 * cr(), hd = 2.6 + 1.0 * cr(), wh = 3.6 + 1.6 * cr(), rh = 2.6 + 1.6 * cr();
        if (z > shape.lake.z0 - 9) z = shape.lake.z0 - 9 - 3 * cr();
        // (10e: the village stands where the live version has it, beside the flight line on the valley floor: strangers who saw both
        // blind chose its houses large in the foreground with their lit windows over the hill village of the tenth round)
        pathXY(z, pxy); x = min(x, pxy[0] - 9.5);                 // never under the lens: the village lies to port of the flight line
        const g = min(shape.ridgeH(x - 2, z - 2), shape.ridgeH(x + 2, z + 2), shape.ridgeH(x, z));
        if (g > 24.5) continue;                                   // only on the valley floor
        HOUSES.push([x, z]); house(x, z, ry, hw, hd, wh, rh, g, i % 2 === 0);
      }
      { let wx = 0, wz = 0; for (const h of HOUSES) { wx += h[0]; wz += h[1]; } const nh = max(1, HOUSES.length);      // the lamplight lies where the houses stand
        U.uWarm.value.set(HOUSES.length ? wx / nh + 3 : SITE.village[0], HOUSES.length ? wz / nh : SITE.village[1] - 4, 26, HOUSES.length ? 1 : 0); }
      U.uWarm2.value.set(-35, 504, 12, 1);      // ninth round: the room's lamp falls in through the round window onto the spur beneath it
      // TENTH ROUND (new, in the country's own stuffs): THE CABINS BY THE PASS. Three more chestnut houses with white roofs and
      // warm windows stand on the starboard flank where the valley narrows before the bridge (z 663 to 689), some 19 m off the
      // flight line and at the eye's own height, each on a low foot of dark paste, dug into the slope behind: we pass them NEAR,
      // under the gibbous moon, below the pagoda's spur.
      { const hr = ctx.core.makeRng(ctx.core.hashSeed(ctx.seed + ':night-by-the-slice-cabins')), FOOT = pal[4] === '#3B2414' ? '#5A3A22' : '#4A1D22';
        for (let i = 0; i < 3; i++) { const z = SITE.cabins[1] - 13 + 13 * i + 2 * (hr() - 0.5), x = SITE.cabins[0] + 2.2 * (hr() - 0.5) - (i === 1 ? 1.6 : 0);
          const ry = 0.3 + 0.6 * (hr() - 0.5), hw = 1.2 * (3.3 + 1.2 * hr()), hd = 1.2 * (2.6 + 0.8 * hr()), wh = 1.2 * (3.6 + 1.2 * hr()), rh = 1.2 * (2.8 + 1.2 * hr());
          const g = min(shape.ridgeH(x - hw, z - hd), shape.ridgeH(x - hw, z + hd)) + 0.6; FT = [x, g, z];      // it stands on the ground of its valley side and is dug into the slope behind
          boxAt(x, z, ry, hw + 0.7, hd + 0.7, g - 2.6, g - 0.2, FOOT, 0, 0.94);                                  // a low foot of dark paste under it
          house(x, z, ry, hw, hd, wh, rh, g - 0.2, i !== 1); } }
      await ctx.yield();
      // THE BRIDGE: one low arch of red bean across the stream, a rail either side, white along the rails' tops
      { const bz = SITE.bridge, bx = streamX(bz), span = 17, rise = 3.4, hwz = 2.6, N = 12, g0 = min(shape.ridgeH(bx - span / 2, bz), shape.ridgeH(bx + span / 2, bz)) - 0.4;
        FT = [bx, g0, bz];
        const top = (t) => g0 + 0.8 + rise * sin(PI * t), xs = (t) => bx + (t - 0.5) * span;
        for (let i = 0; i < N; i++) { const t0 = i / N, t1 = (i + 1) / N, x0 = xs(t0), x1 = xs(t1), y0 = top(t0), y1 = top(t1), u0 = g0 + 0.2 + (rise - 0.9) * sin(PI * t0), u1 = g0 + 0.2 + (rise - 0.9) * sin(PI * t1);
          quad([x0, y0, bz - hwz], [x1, y1, bz - hwz], [x1, y1, bz + hwz], [x0, y0, bz + hwz], BEAN, 0);       // the deck
          for (const sz of [-1, 1]) { const zz = bz + sz * hwz;
            quad([x0, min(u0, y0) - (i === 0 ? 2 : 0), zz], [x1, min(u1, y1) - (i === N - 1 ? 2 : 0), zz], [x1, y1, zz], [x0, y0, zz], BEAN, 0);                     // its cheek
            quad([x0, y0 + 0.9, zz], [x1, y1 + 0.9, zz], [x1, y1 + 1.45, zz], [x0, y0 + 1.45, zz], BEAN, 0);                                                     // the rail
            quad([x0, y0 + 1.45, zz - 0.3], [x1, y1 + 1.45, zz - 0.3], [x1, y1 + 1.45, zz + 0.3], [x0, y0 + 1.45, zz + 0.3], ROOF, 0);                            // sugar along its top
            if (i % 2 === 0) boxAt(x0, zz, 0, 0.28, 0.28, y0 - 0.1, y0 + 1.9, WOOD, 0, 1, true, true, ROOF); }
        } }
      await ctx.yield();
      // THE PAGODA: three storeys of red bean, each under a wide roof of dark paste snowed white, a spire with a ball of gold
      { const [px, pz] = SITE.pagoda, g = shape.ridgeH(px, pz); FT = [px, g, pz]; let y = g + 0.6, hw = 3.4; const ry = 0.5;
        boxAt(px, pz, ry, 5.4, 5.4, g - 4, y, pal[4] === '#3B2414' ? '#5A3A22' : '#4A1D22', 0, 0.84);                   // its plinth, standing out of the slope: the spur
        for (let k = 0; k < 3; k++) { const bh = 3.6 - 0.3 * k, rw = hw + 2.9 - 0.3 * k;
          boxAt(px, pz, ry, hw, hw, y, y + bh, BEAN, 0, 0.94, true, false);
          for (let f = 0; f < 4; f++) { const c = cos(ry + f * PI / 2), sn = sin(ry + f * PI / 2), ox = (hw * 0.97 + 0.1) * sn, oz = (hw * 0.97 + 0.1) * c;
            quad([px + ox - 0.8 * c, y + 0.9, pz + oz + 0.8 * sn], [px + ox + 0.8 * c, y + 0.9, pz + oz - 0.8 * sn], [px + ox + 0.8 * c, y + 2.7, pz + oz - 0.8 * sn], [px + ox - 0.8 * c, y + 2.7, pz + oz + 0.8 * sn], '#ffffff', 1, [[0, 0], [1, 0], [1, 1], [0, 1]]); }
          y += bh;
          boxAt(px, pz, ry, rw, rw, y - 0.25, y, WOOD, 0, 1, true, false);                                         // the eaves' dark edge
          boxAt(px, pz, ry, rw, rw, y, y + 1.7, ROOF, 0, (hw * 0.78) / rw, true, true);                             // the roof, snowed
          y += 1.7; hw *= 0.78; }
        boxAt(px, pz, ry, 0.3, 0.3, y, y + 4.2, WOOD, 0, 0.5); boxAt(px, pz, ry, 0.75, 0.75, y + 2.1, y + 3.3, pal[6], 0, 1); }
      await ctx.yield();
      // ---------- ROUND 12, rule (c): A GROWN FIR STAYS OUT OF THE BUILT THINGS AND THE LOAF'S SIDES. Read here, where the houses,
      // the cabins, the bridge and the pagoda have just been made and the fall has not (firs stand in the fall as live has them).
      // A built thing's own outline is its own triangles seen in plan, as its mesh will hold them (each thing: the run of
      // triangles made about one foot); a fir's is its lowest tier's widest ring, a round in plan about its axis. A laid fir
      // whose ring is inside such an outline while its height overlaps the thing's, or whose ring passes a side wall of the
      // loaf, is taken out of its set's instances. No distance is typed; no draw is taken; nothing replaces it. ----------
      {
        const P = new Float32Array(pos), TH = [];
        for (let i = 0; i < P.length; i += 9) { let t = TH[TH.length - 1];
          if (!t || t.fx !== foot[i] || t.fz !== foot[i + 2]) TH.push(t = { fx: foot[i], fz: foot[i + 2], i0: i, i1: i, x0: 1e9, x1: -1e9, y0: 1e9, y1: -1e9, z0: 1e9, z1: -1e9 });
          t.i1 = i + 9;
          for (let k = i; k < i + 9; k += 3) { t.x0 = min(t.x0, P[k]); t.x1 = max(t.x1, P[k]); t.y0 = min(t.y0, P[k + 1]); t.y1 = max(t.y1, P[k + 1]); t.z0 = min(t.z0, P[k + 2]); t.z1 = max(t.z1, P[k + 2]); } }
        const segD = (px, pz, ax, az, bx, bz) => { const ux = bx - ax, uz = bz - az, l2 = ux * ux + uz * uz, s = l2 > 0 ? clamp(((px - ax) * ux + (pz - az) * uz) / l2, 0, 1) : 0; return Math.hypot(px - ax - ux * s, pz - az - uz * s); };
        const triD = (px, pz, i) => {      // plan distance from a point to a triangle (0 inside it)
          const sd = (ax, az, bx, bz) => (bx - ax) * (pz - az) - (bz - az) * (px - ax);
          const d1 = sd(P[i], P[i + 2], P[i + 3], P[i + 5]), d2 = sd(P[i + 3], P[i + 5], P[i + 6], P[i + 8]), d3 = sd(P[i + 6], P[i + 8], P[i], P[i + 2]);
          if (!((d1 < 0 || d2 < 0 || d3 < 0) && (d1 > 0 || d2 > 0 || d3 > 0))) return 0;
          return min(segD(px, pz, P[i], P[i + 2], P[i + 3], P[i + 5]), segD(px, pz, P[i + 3], P[i + 5], P[i + 6], P[i + 8]), segD(px, pz, P[i + 6], P[i + 8], P[i], P[i + 2])); };
        const inThing = (t, x, y, z, R, top) => {      // is the ring (R about x, z) inside this thing's outline, the fir (y to top) at its height?
          if (!(top > t.y0 && y < t.y1) || t.x0 - x > R || x - t.x1 > R || t.z0 - z > R || z - t.z1 > R) return false;
          for (let i = t.i0; i < t.i1; i += 9) if (triD(x, z, i) < R) return true;
          return false; };
        const FM = loaf.children.filter((m) => m.geometry && m.geometry.getAttribute('aF') && m.geometry.getAttribute('aP'));      // the three fir meshes, in the sets' order
        firLaid.sets.forEach((S, si) => { const p = [], q = [];
          for (let i = 0; i < S.q.length / 2; i++) { const x = S.p[i * 4], y = S.p[i * 4 + 1], z = S.p[i * 4 + 2], tall = S.p[i * 4 + 3], R = firLaid.ring * (0.8 + 0.35 * S.q[i * 2 + 1]) * tall;
            if (min(x - R - LOAF.x0, LOAF.x1 - x - R) < 0) continue;                                              // (c) a side wall of the loaf
            if (TH.some((t) => inThing(t, x, y, z, R, y + firLaid.top * tall))) continue;                         // (c) a built thing
            p.push(x, y, z, tall); q.push(S.q[i * 2], S.q[i * 2 + 1]); }
          if (q.length === S.q.length) return;
          const g = FM[si].geometry, cnt = q.length / 2; if (!cnt) { p.push(0, -50, 400, 1); q.push(0, 0); }      // (an empty set keeps one fir under the floor, as the meshes' own loop has it)
          g.setAttribute('aP', new THREE.InstancedBufferAttribute(new Float32Array(p), 4)); g.setAttribute('aQ', new THREE.InstancedBufferAttribute(new Float32Array(q), 2)); g.instanceCount = max(cnt, 1);
          S.p = p; S.q = q; });
      }
      // THE FALL: pulled sugar, a ribbon of glassy strands down the starboard slope to the stream
      { const fz = SITE.fall, x1 = streamX(fz) + 1; let x0 = x1 + 30, best = -1;
        for (let x = x1 + 12; x < min(x1 + 44, LOAF.x1 - 8); x += 1) { const h = shape.ridgeH(x, fz); if (h > best) { best = h; x0 = x; } }      // from the crest above
        FT = [x0, shape.ridgeH(x1, fz), fz]; const N = 64; let len = 0, prev = null;
        for (let i = 0; i <= N; i++) { const t = i / N, x = lerp(x0, x1, t), zc = fz + 3 * sin(t * 4.2) * t * (1 - t) * 2, hw = 0.9 + 1.0 * t, y = shape.ridgeH(x, zc) + 0.5 + 0.5 * sin(PI * t);
          const cur = { a: [x, y, zc - hw], b: [x, y, zc + hw], y, x };
          if (prev) { len += Math.hypot(x - prev.x, y - prev.y); quad(prev.a, prev.b, cur.b, cur.a, '#EAF1F6', 2, [[0, prev.len], [1, prev.len], [1, len], [0, len]]); }
          cur.len = len; prev = cur; } }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aCol', new THREE.Float32BufferAttribute(col, 3)); g.setAttribute('aKd', new THREE.Float32BufferAttribute(kd, 1));
      g.setAttribute('aFoot', new THREE.Float32BufferAttribute(foot, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
      g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 40, 580), 900);
      addLoaf(g, new THREE.ShaderMaterial({
        uniforms: Object.assign({}, U, { uKeep: { value: 0.62 }, uModel: { value: 0 } }), side: THREE.DoubleSide,
        vertexShader: /* glsl */`${STYLE_GLSL}${STYLE_VERT_GLSL}
          attribute vec3 aCol, aFoot; attribute float aKd; varying vec3 vP; varying vec3 vEye; varying vec3 vC; varying vec3 vK;
          void main(){ vEye = eyeLocal(); vP = position; vC = aCol; vK = vec3(aKd, uv);
            vec3 wb = wobble(aFoot); wb.x += (wobble(aFoot + vec3(0., 30., 0.)).x - wb.x)*0.2*(position.y - aFoot.y);      // they lean with the wave, as the firs do
            gl_Position = projectionMatrix*modelViewMatrix*vec4(position + wb, 1.); }`,
        fragmentShader: /* glsl */`${STYLE_GLSL}
          varying vec3 vP; varying vec3 vEye; varying vec3 vC; varying vec3 vK;
          void main(){
            if (vP.z < uBoxMin.z || vP.x > uBoxMax.x) discard;
            vec3 col; float aa = clamp(fwidth(vK.y) + fwidth(vK.z), 0.01, 0.5), sw = clamp(fwidth(vK.y)*6., 1e-3, 2.);      // (derivatives before the branches)
            if (vK.x > 0.5 && vK.x < 1.5) {                       // a window: the lantern's own warm light behind paper, a dark cross of glazing bars
              vec2 q = abs(vK.yz - 0.5);
              float bar = (1. - smoothstep(0.045, 0.05 + aa, min(q.x, q.y)))*(1. - smoothstep(0.1, 0.3, aa));
              vec3 T = transmit(eyePath(vP, vEye)*0.22);
              vec3 warm = uLamp*(0.9 + 0.06*sin(uTime*2.1 + vP.x*3. + vP.z))*mix(1., 0.25, bar);
              col = toScene(warm*T + uInk*(1. - T.b));
            } else if (vK.x > 1.5 && vK.x < 2.5) {                // pulled sugar: glassy strands running down, each its own tone, the pull moving along them
              float st = vK.y*6., id = floor(st), fine = 1. - smoothstep(0.3, 0.9, sw);
              float run = vnoise(vec2(id*7.3, vK.z*0.33 - uTime*(1.1 + 0.5*hash11(id))));
              float strand = mix(0.95, mix(0.72, 1.1, hash11(id + 3.))*(0.8 + 0.4*smoothstep(0.45, 0.7, run)), fine);
              float gapS = (1. - smoothstep(0.06, 0.1 + sw, abs(fract(st) - 0.5)*2. - 0.86))*fine;
              col = inJelly(vC*strand*(1. - 0.45*gapS)*(1. + 0.6*frontP(vP)), vP, vec3(0., 1., 0.), vEye);
            } else if (vK.x > 2.5) {
              // TENTH ROUND: WHITE PASTE LAID ON A ROOF. From the ridge down: two strokes of the knife (two close tones, the edge between
              // them wavering along the roof), a thick round lip where the paste stops short of the eave, hanging in lobes, and
              // under it the roof's own chestnut edge. Seen from above a roof is a little house's roof, never a blank slab.
              float ru = vK.y, rv = vK.z, ra = clamp(fwidth(rv)*1.5, 0.004, 0.2), hs = fract(vC.r*37.3 + vC.b*11.1);
              float lipLine = 0.045 + 0.06*abs(sin(ru*(8. + 3.*hs) + hs*20.)) + 0.012*sin(ru*23. + hs*9.);      // (the white comes almost to the eave: a thin chestnut edge, not a beam)
              float eave = 1. - smoothstep(lipLine - ra, lipLine + ra, rv);
              float lip = (1. - smoothstep(lipLine + 0.09 - ra, lipLine + 0.09 + ra, rv))*(1. - eave);
              float sq = rv*2.6 + 0.2*sin(ru*5.3 + hs*13.) + 0.08*sin(ru*14. + 2.) + 0.5*hs, sw2 = clamp(fwidth(sq), 1e-3, 0.5);      // three strokes from the lip to the ridge
              float stroke = mod(floor(sq), 2.), sline = (1. - smoothstep(0.03 + sw2, 0.06 + 2.*sw2, abs(fract(sq + 0.5) - 0.5)))*(1. - smoothstep(0.15, 0.4, sw2));
              vec3 paste = vC*mix(mix(0.86, 1., stroke)*(1. - 0.14*sline), 1.06, lip);
              paste = min(paste*(1. + 0.5*frontP(vP)), max(vC, vec3(0.86, 0.81, 0.68)));
              col = inJelly(mix(paste, vec3(0.085, 0.03, 0.016)*(1. + 0.7*frontP(vP)), eave), vP, vec3(0., 1., 0.), vEye);
            } else col = inJelly(min(vC*(1. + 0.7*frontP(vP)), max(vC, vec3(0.86, 0.81, 0.68))), vP, vec3(0., 1., 0.), vEye);      // tenth round: a white roof in the wave's front stays under the moon's cream
            gl_FragColor = vec4(col, 1.);
          }`,
      }), 0);
    }
    await ctx.yield();
    hero.meshes.skin.material.uniforms.uFilm.value = 1; hero.meshes.skin.material.uniforms.uRoundF.value = 0.26; hero.meshes.skin.material.uniforms.uSheen.value = 0.085;      // the lamp on the wet face: a faint warm sheen, never a veil
    hero.meshes.skin.renderOrder = 4.5;                  // the loaf's wet skin, then the slabs' tint over whatever lies behind them
    await ctx.yield();

    // ---------- the cast: nine goose rods (shallow chevrons whose wings beat once every 55 m), or three clouds ----------
    const gooseGeometry = (z0, z1, rings, thin, taper = 0) => {
      const pos = [], idx = [], c = [0, 0];
      for (let g = 0; g < 9; g++) {
        const base = pos.length / 3; shape.gooseXY(g, c);
        for (let i = 0; i <= rings; i++) {
          const z = lerp(z0, z1, i / rings), a = shape.gooseWing(g, z), tp = taper > 0 ? clamp((z1 - z) / taper, 0, 1) * (0.45 + 0.55 * (1 - sstep(z0 + 2, z0 + 22, z))) : 1, W = (thin ? 1.3 : 3) * (0.25 + 0.75 * tp), B = (thin ? 0.22 : 0.5) * tp, wx = W * cos(a), wy = W * sin(a);      // (taper: the last metres over which a rod thins to a thread)
          if (thin && i === 0) { c[0] = 28 + g * 3.3; c[1] += 3; }
          pos.push(c[0] - wx, c[1] + wy, z, c[0], c[1] + B, z, c[0] + wx, c[1] + wy, z, c[0], c[1] - B, z);
        }
        for (let i = 0; i < rings; i++) for (let j = 0; j < 4; j++) {
          const a = base + i * 4 + j, b = base + i * 4 + ((j + 1) % 4);
          idx.push(a, b, a + 4, b, b + 4, a + 4);
        }
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setIndex(idx); geo.computeVertexNormals();
      return geo;
    };
    // a cloud is a long flat rod of white paste whose section thins and parts along the loaf
    const cloudPh = [rng() * TAU, rng() * TAU, rng() * TAU];
    const cloudW = (k, z) => max(0, 9.5 * (0.42 + 0.58 * sin(z * (0.0105 + 0.002 * k) + cloudPh[k])) + 1.6 * sin(z * 0.043 + k * 2.1)) * sstep(100, 112, z) * (1 - sstep(840, 880, z));
    const cloudGeometry = (z0, z1, rings, thin) => {
      const pos = [], idx = [], M = 12;
      for (let k = 0; k < 3; k++) {
        const base = pos.length / 3, cx = thin ? 30 + k * 10.5 : 11 + k * 13.5, cy = 67 - k * 4.2 + (k === 1 ? 2.5 : 0) + (thin ? 3 : 0);
        for (let i = 0; i <= rings; i++) {
          const z = lerp(z0, z1, i / rings), w = cloudW(k, z) * (thin ? 0.42 : 1), th = min(thin ? 0.9 : 1.9, 0.2 + w * 0.3);
          for (let j = 0; j < M; j++) {
            const a = (j / M) * TAU, lump = 1 + 0.25 * sin(a * 3 + k);
            pos.push(cx + 2 * sin(z * 0.008 + k) + w * cos(a), cy + th * sin(a) * (sin(a) > 0 ? lump : 0.55), z);
          }
        }
        for (let i = 0; i < rings; i++) for (let j = 0; j < M; j++) {
          const a = base + i * M + j, b = base + i * M + ((j + 1) % M);
          idx.push(a, b, a + M, b, b + M, a + M);
        }
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setIndex(idx); geo.computeVertexNormals();
      return geo;
    };
    const castGeometry = (z0, z1, rings, thin) => (rods ? gooseGeometry(z0, min(z1, 830), rings, thin) : cast === 'clouds' ? cloudGeometry(z0, z1, rings, thin) : null);
    const castMat = jelly.pasteMaterial(new THREE.Color(C[5]).multiplyScalar(0.955), { grain: 0.06, keep: 0.2 });      // (a shade under the moon's cream: nothing inside is brighter than the moon)
    // TENTH ROUND (D1): ONE STRETCH OF THE NINE RIBBONS INSIDE. From the cut face to the first bank of sugar the nine rods of
    // white paste run beside us overhead, each rippling with its own wing stroke, the design's "shallow chevron 6 m across in
    // section" where the knife cuts them, slimmer within 20 m of the face so that nine read as nine and the star figures
    // show between them, and drawn out thin toward their far end where they run into the dark (the designer's amendment).
    // (Only here: the rest of the night's sky keeps its figures and its moons.)
    let castMesh = null;
    if (rods) castMesh = addLoaf(gooseGeometry(160.4, 338, 72, false, 120), castMat);
    await ctx.yield();
    // ---------- sugar: clear crystals (cubes; in the winter loaf thin rods slanting like snowfall), a pale edge term ----------
    const sugarMaterial = (uniforms, outside) => new THREE.ShaderMaterial({
      uniforms: Object.assign({}, uniforms, { uOut: { value: outside ? 1 : 0 }, uEdge: { value: new THREE.Color('#F4F8FA') }, uDrift: { value: outside ? 0 : 4 }, uBody: { value: outside ? 0.2 : 0.4 } },
        outside ? {} : { uKeep: { value: 0.55 }, uEyeK: { value: 0.75 } }),
      transparent: !outside, depthWrite: !!outside, side: THREE.DoubleSide,
      vertexShader: /* glsl */`${STYLE_GLSL}${STYLE_VERT_GLSL}
        uniform float uPx, uOut, uDrift;
        attribute vec3 aPos; attribute vec4 aQuat; attribute vec4 aScl;       // aScl: size x,y,z and tone
        varying vec3 vP; varying vec3 vN; varying vec3 vEye; varying vec3 vUvT; varying float vPx; varying vec4 vNl;
        vec3 qrot(vec4 q, vec3 v){ return v + 2.*cross(q.xyz, cross(q.xyz, v) + q.w*v); }
        void main(){
          vEye = eyeLocal();
          float dist = length(vEye - aPos), thin = min(aScl.x, min(aScl.y, aScl.z));
          float grow = max(1., 2.2*dist/max(thin*uPx, 1e-3));          // never thinner than about 2 px
          vec3 sc = aScl.xyz*mix(vec3(grow), vec3(1.), step(thin*4., aScl.xyz));     // rods grow in girth only
          // (tenth round: inside the loaf a small crystal that would be under some four pixels is gone into the bank's own
          // mass: swollen to two pixels each, the loose grains round a far bank stood as a fringe of square dots, a blocky
          // pixelled edge on an otherwise smooth cloud. Near a bank they are crystals again.)
          sc *= mix(1., smoothstep(3., 5., thin*uPx/max(dist, 0.5)), (1. - uOut)*(1. - step(1.2, thin)));
          vec3 l = qrot(aQuat, position*sc);
          vec3 ctr = aPos + vec3(uDrift*sin(uTime*0.06 + aPos.z*0.004), 0., 0.); vP = ctr + l; vN = qrot(aQuat, normal); vUvT = vec3(uv, aScl.w); vPx = thin*uPx/max(dist, 0.5);
          vNl = vec4(abs(normal), step(1.2, thin)*(1. - uOut));       // a large crystal shows its faces, each its own tone
          gl_Position = projectionMatrix*modelViewMatrix*vec4(vP + wobble(ctr)*(1. - uOut), 1.);
        }`,
      fragmentShader: /* glsl */`${STYLE_GLSL}${ROOM_GLSL}
        uniform float uOut, uBody; uniform vec3 uEdge;
        varying vec3 vP; varying vec3 vN; varying vec3 vEye; varying vec3 vUvT; varying float vPx; varying vec4 vNl;
        void main(){
          if (uOut < 0.5 && (vP.z < uBoxMin.z || vP.x > uBoxMax.x)) discard;
          vec3 e = vEye - vP; vec3 d = e/max(length(e), 1e-4); vec3 n = vN/max(length(vN), 1e-4);
          float c = abs(dot(n, d));
          vec2 q = abs(vUvT.xy - 0.5)*2.; float m = max(q.x, q.y), w = clamp(max(fwidth(q.x), fwidth(q.y))*1.5, 0.1, 0.9);
          float edge = smoothstep(1. - w, 1., m)*clamp(0.1/w + 0.3, 0.3, 1.);        // a crystal is its edges
          float f1 = 1. - c, a = clamp(uBody + 0.1*abs(n.y) + 0.3*f1*f1 + 0.6*edge, 0., 1.)*mix(0.55, 1., smoothstep(1.5, 6., vPx));
          vec3 alb = uEdge*vUvT.z*mix(0.86, 1., edge);
          // SEVENTH ROUND: a large crystal is a clear block of sugar: three faces, three flat tones, its edges pale
          if (vNl.w > 0.5) { if (!gl_FrontFacing) discard; float ft = dot(vNl.xyz, vec3(0.7, 1., 0.5)); alb = uEdge*mix(vec3(0.62, 0.7, 0.86)*ft, vec3(1.), edge); a = 0.94; }
          // on the board a grain is clear: the wood shows through it, paler, and its edges are white
          vec3 col = uOut > 0.5 ? toScene(mix(uBoard*1.03, alb, clamp(0.5 + 0.3*f1*f1 + 0.5*edge, 0., 1.))*roomLight(vP, gl_FrontFacing ? n : -n, 0.4)*2.2) : inJelly(alb, vP, gl_FrontFacing ? n : -n, vEye);
          gl_FragColor = vec4(col, uOut > 0.5 ? 1. : a);
        }`,
    });
    const sugarGeometry = (n, fill) => {
      const base = new THREE.BoxGeometry(1, 1, 1), g = new THREE.InstancedBufferGeometry();
      g.setAttribute('position', base.getAttribute('position')); g.setAttribute('normal', base.getAttribute('normal'));
      g.setAttribute('uv', base.getAttribute('uv')); g.setIndex(base.getIndex());
      const aPos = new Float32Array(n * 3), aQuat = new Float32Array(n * 4), aScl = new Float32Array(n * 4), o = { p: [0, 0, 0], q: [0, 0, 0, 1], s: [1, 1, 1], tone: 1 };
      for (let i = 0; i < n; i++) { fill(i, o); aPos.set(o.p, i * 3); aQuat.set(o.q, i * 4); aScl.set(o.s, i * 4); aScl[i * 4 + 3] = o.tone; }
      g.setAttribute('aPos', new THREE.InstancedBufferAttribute(aPos, 3)); g.setAttribute('aQuat', new THREE.InstancedBufferAttribute(aQuat, 4));
      g.setAttribute('aScl', new THREE.InstancedBufferAttribute(aScl, 4)); g.instanceCount = n;
      g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 40, 530), 1200);
      return g;
    };
    const randQuat = (q) => { const u1 = rng(), u2 = rng() * TAU, u3 = rng() * TAU, a = sqrt(1 - u1), b = sqrt(u1); q[0] = a * sin(u2); q[1] = a * cos(u2); q[2] = b * sin(u3); q[3] = b * cos(u3); };
    // SUGAR IS CLOUD (fourth round): banks of small clear crystals formed at mid distance, each a few heaps on one flat
    // base, that drift slowly across the moons and never spill against the lens. The winter loaf keeps its slanting rods.
    // SIXTH ROUND: two or three soft banks, high and to the side, never across a moon or a peak; the winter loaf has them too
    const winter = false, nSugar = Math.round(700 * dens * detail), bandT = 9 * dens;
    // x, base y, z, half-width across the view, height, half-depth: broad across the sky, shallow along the course
    // (the long cut comes down at x 33: in that flight the first bank lies wholly beyond the cut and goes with the offcut)
    const BANKS = [rare ? [47.5, 64, 372, 10.5, 3.4, 13] : [36, 64, 372, 17, 3.4, 13], [-36, 58, 790, 16, 3, 12], [37, 61, 992, 16, 3, 13]].slice(0, edition.banks);
    // SEVENTH ROUND: A BANK IS A HEAP OF SUGAR. Its small crystals fuse into one pale flat mass with a flat bottom, a soft
    // top and a decided silhouette against the ink (one low mesh per bank, the crystals' own average tint, a cooler tone
    // underneath); along its near edge and over its top stand some two dozen large clear crystals, each showing its faces.
    const heapAt = (B, x, z) => { let h = 0; for (let k = -1; k <= 1; k++) { const rr = Math.hypot((x - B[0] - k * 0.5 * B[3]) / (B[3] * 0.62), (z - B[2] - k * 0.4 * B[5]) / (B[5] * 0.85));
      h = max(h, (k === 0 ? 1.3 : 0.85) * pow(max(1 - rr * rr, 0), 0.6)); } return h * B[4] * 1.7 * (0.86 + 0.14 * sin(x * 0.55 + B[2]) * sin(z * 0.6 + B[0])); };
    const rimAt = (B, th) => { const R = 1.5 * max(B[3], B[5]); let lo = 0, hi = R; for (let i = 0; i < 18; i++) { const m = (lo + hi) / 2; if (heapAt(B, B[0] + m * cos(th), B[2] + m * sin(th)) > 0) lo = m; else hi = m; } return lo; };
    const nBig = Math.round(max(18, 26 * detail)) * BANKS.length, nAll = nSugar + nBig;
    const sg = { p: new Float32Array(nAll * 3), s: new Float32Array(nAll * 3), q: new Float32Array(nAll * 4) };
    {
      let n = 0, guard = 0; const q = [0, 0, 0, 1];
      while (n < nSugar && guard < nSugar * 30) {
        guard++; if (guard % 1200 === 0) await ctx.yield();
        let x, y, z, size, len;
        if (winter) {
          z = rng.range(240, 860); const t = (z - 300) / 460, s = rng.range(-95, 95), off = (rng() + rng() - 1) * bandT * 2.2;
          x = -60 + 95 * t + 0.74 * s + 0.68 * off; y = 80 - 50 * t - 0.68 * s + 0.74 * off;
          size = 0.14 + 0.16 * rng(); len = rng.range(4, 10);
        } else {
          const B = BANKS[floor(rng() * BANKS.length)], heap = floor(rng() * 3) - 1;
          x = B[0] + heap * 0.5 * B[3] + rng.gauss() * B[3] * 0.3; z = B[2] + heap * 0.4 * B[5] + rng.gauss() * B[5] * 0.4;
          const rr = Math.hypot((x - B[0] - heap * 0.5 * B[3]) / (B[3] * 0.6), (z - B[2] - heap * 0.4 * B[5]) / (B[5] * 0.8));
          y = B[1] + rng() * rng() * B[4] * 2.6 * max(0.12, 1 - 0.8 * rr) * (heap === 0 ? 1.3 : 0.85);
          const r = rng(); size = 0.25 + 0.5 * r * r; len = size;
        }
        const reach = winter ? len * 0.5 : size;
        if (x < LOAF.x0 + 1 + reach || x > LOAF.x1 - 1 - reach || y > LOAF.y1 - 1 - reach || y < shape.ridgeH(x, z) + 1.5 + reach) continue;
        pathXY(z, pxy); const dp = Math.hypot(x - pxy[0], y - pxy[1]);
        if (dp < (winter ? 10 : 22) + reach) continue;
        if (shape.inBar(x, y, z, 1.5 + reach)) continue;
        if (shape.inSight(x, y, z, 0.72)) continue;                // the face of each moon is seen clear; cloud crosses only its rim
        if (winter) { const a = -0.62 + rng.range(-0.07, 0.07), b = rng.range(-0.12, 0.12); q[0] = sin(b / 2) * cos(a / 2); q[1] = -sin(b / 2) * sin(a / 2); q[2] = cos(b / 2) * sin(a / 2); q[3] = cos(b / 2) * cos(a / 2); }
        else randQuat(q);
        sg.p[n * 3] = x; sg.p[n * 3 + 1] = y; sg.p[n * 3 + 2] = z; sg.q.set(q, n * 4);
        sg.s[n * 3] = size; sg.s[n * 3 + 1] = winter ? len : size * rng.range(0.7, 1.15); sg.s[n * 3 + 2] = size * (winter ? 1 : rng.range(0.8, 1.1)); n++;
      }
      { const br = ctx.core.makeRng(ctx.core.hashSeed(ctx.seed + ':night-by-the-slice-crystals')), per = nBig / BANKS.length;      // its own draw
        for (let b = 0; b < BANKS.length; b++) for (let i = 0; i < per; i++) {
          const B = BANKS[b], top = i % 4 === 3, th = top ? br() * TAU : -PI / 2 + (br() + br() - 1) * 1.9 + (b === 1 ? 0.5 : -0.5);      // the near edge, toward the valley, and a few on top
          const rim = rimAt(B, th), rho = top ? 0.25 + 0.4 * br() : 0.8 + 0.22 * br(), x = B[0] + rho * rim * cos(th), z = B[2] + rho * rim * sin(th), r = br(), size = 0.55 + 0.85 * r * r;      // tenth round: small crystals on a smooth heap (the large ones read as blocks)
          let y = B[1] + heapAt(B, x, z) + size * (0.1 + 0.25 * br());
          if (x < LOAF.x0 + 3 || x > LOAF.x1 - 3 || y > LOAF.y1 - 3) continue;
          if (rare && x < 36 + size) continue;
          const u1 = br(), u2 = br() * TAU, u3 = br() * TAU, qa = sqrt(1 - u1), qb = sqrt(u1);
          sg.p[n * 3] = x; sg.p[n * 3 + 1] = y; sg.p[n * 3 + 2] = z; sg.q[n * 4] = qa * sin(u2); sg.q[n * 4 + 1] = qa * cos(u2); sg.q[n * 4 + 2] = qb * sin(u3); sg.q[n * 4 + 3] = qb * cos(u3);
          sg.s[n * 3] = size; sg.s[n * 3 + 1] = size * (0.75 + 0.4 * br()); sg.s[n * 3 + 2] = size * (0.8 + 0.3 * br()); n++;
        } }
      await ctx.yield();
      { const pos = [], nor = [], tone = [], idx = [], TH = 56, RG = 9;
        for (const B of BANKS) { const base = pos.length / 3;
          for (let j = 0; j < TH; j++) { const th = (j / TH) * TAU, rim = rimAt(B, th) * (1 + 0.09 * sin(th * 5 + B[2]) + 0.04 * sin(th * 11 + 1));
            for (let i = 0; i <= RG; i++) { const rho = pow(i / RG, 0.8), x = B[0] + rho * rim * cos(th), z = B[2] + rho * rim * sin(th), h = heapAt(B, x, z) * (1 - pow(rho, 6)), e = 0.6;
              const hx = heapAt(B, x + e, z) - heapAt(B, x - e, z), hz = heapAt(B, x, z + e) - heapAt(B, x, z - e), l = Math.hypot(hx, 2 * e, hz);
              pos.push(x, B[1] + h, z); nor.push(-hx / l, 2 * e / l, -hz / l); tone.push(1);
              pos.push(x, B[1] - 0.5 * (1 - pow(rho, 4)), z); nor.push(0, -1, 0); tone.push(0); } }
          for (let j = 0; j < TH; j++) for (let i = 0; i < RG; i++) { const a = base + (j * (RG + 1) + i) * 2, b = base + (((j + 1) % TH) * (RG + 1) + i) * 2;
            idx.push(a, a + 2, b, b, a + 2, b + 2, a + 1, b + 1, a + 3, b + 1, b + 3, a + 3); }
          await ctx.yield(); }
        const mg = new THREE.BufferGeometry();
        mg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); mg.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); mg.setAttribute('aTone', new THREE.Float32BufferAttribute(tone, 1)); mg.setIndex(idx);
        mg.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 40, 580), 900);
        addLoaf(mg, new THREE.ShaderMaterial({
          uniforms: Object.assign({}, U, { uEdge: { value: new THREE.Color('#F4F8FA') }, uDrift: { value: 4 }, uKeep: { value: 0.55 }, uEyeK: { value: 0.75 }, uModel: { value: 0 } }), side: THREE.DoubleSide,
          vertexShader: /* glsl */`${STYLE_GLSL}${STYLE_VERT_GLSL}
            uniform float uDrift; attribute float aTone; varying vec3 vP; varying vec3 vN; varying vec3 vEye; varying float vTone;
            void main(){ vEye = eyeLocal(); vN = normal; vTone = aTone;
              vP = position + vec3(uDrift*sin(uTime*0.06 + position.z*0.004), 0., 0.);
              gl_Position = projectionMatrix*modelViewMatrix*vec4(vP + wobble(vP), 1.); }`,
          fragmentShader: /* glsl */`${STYLE_GLSL}
            uniform vec3 uEdge; varying vec3 vP; varying vec3 vN; varying vec3 vEye; varying float vTone;
            void main(){
              if (vP.z < uBoxMin.z || vP.x > uBoxMax.x) discard;
              vec3 n = vN/max(length(vN), 1e-4);
              // two flat tones: the lit top and the cooler belly; close to, the mass is seen to be grains (finer than three pixels: their mean)
              float fw = max(fwidth(vP.x) + fwidth(vP.z), 1e-4);
              float grainK = (hash21(floor(vP.xz*1.6 + vP.y*1.1)) - 0.5)*(1. - smoothstep(0.2, 0.62, fw*1.6));
              vec3 alb = uEdge*mix(vec3(0.5, 0.58, 0.76), vec3(0.8, 0.85, 0.94), step(0.5, vTone))*(1. + 0.22*grainK);
              gl_FragColor = vec4(inJelly(alb, vP, n, vEye), 1.);
            }`,
        }), 2);
      }
      const geo = sugarGeometry(max(n, 1), (i, o) => { o.p[0] = sg.p[i * 3]; o.p[1] = sg.p[i * 3 + 1]; o.p[2] = sg.p[i * 3 + 2]; o.q[0] = sg.q[i * 4]; o.q[1] = sg.q[i * 4 + 1]; o.q[2] = sg.q[i * 4 + 2]; o.q[3] = sg.q[i * 4 + 3];
        o.s[0] = sg.s[i * 3]; o.s[1] = sg.s[i * 3 + 1]; o.s[2] = sg.s[i * 3 + 2]; o.tone = 0.86 + 0.14 * ((i * 0.618) % 1); });
      addLoaf(geo, sugarMaterial(U, false), 3);
    }
    await ctx.yield();
    // ---------- outside: the evening room (no walls, no window), the cypress board under one low lamp, spilled sugar ----------
    const OUT = { uSteel: { value: new THREE.Color('#B4BAC0') }, uGoldOut: { value: C[6] }, uSlabBlue: { value: C[3] },
      uLong: { value: new THREE.Vector4(25, 200, 380, 680) },          // the long blade: plane x, edge y, z0, z1
      uSlabR: { value: [0, 1, 2, 3, 4, 5].map(() => new THREE.Vector4(0, -1e4, 1, 1)) }, uSlabK: { value: [0, 0, 0, 0, 0, 0] },
      uScar: { value: [0, 1, 2, 3, 4, 5].map(() => new THREE.Vector4()) }, uT: { value: 0 } };
    for (const v of OUT.uScar.value) { const x = rng.range(-60, 330), z = rng.range(-150, 220), a = rng.range(-0.5, 0.5) + (rng() < 0.5 ? 0 : 1.2), l = rng.range(24, 34); v.set(x - cos(a) * l, z - sin(a) * l, x + cos(a) * l, z + sin(a) * l); }
    const UO = (extra) => Object.assign({}, U, OUT, extra);
    const dome = new THREE.Mesh(new THREE.SphereGeometry(3200, 24, 12), new THREE.ShaderMaterial({
      uniforms: UO({}), side: THREE.BackSide, depthWrite: false, depthTest: false,
      vertexShader: /* glsl */`varying vec3 vD; void main(){ vD = position; gl_Position = projectionMatrix*modelViewMatrix*vec4(position, 1.); }`,
      fragmentShader: /* glsl */`${STYLE_GLSL}${ROOM_GLSL}
        varying vec3 vD;
        void main(){ vec3 d = vD/max(length(vD), 1e-4);
          vec3 c = mix(uRoomLow, uRoomHi, smoothstep(-0.02, 0.5, d.y));
          vec3 ld = uLampPos - cameraPosition; ld /= max(length(ld), 1e-3);
          float l = max(dot(d, ld), 0.), l2 = l*l, l8 = l2*l2*l2*l2;
          c += uLamp*uLampK.w*(0.07*l2*l2*l2 + 0.12*l8*l8*l8*l8);                   // the lamp's glow hangs in the room's air
          gl_FragColor = vec4(toScene(c), 1.); }`,
    }));
    dome.frustumCulled = false; dome.renderOrder = -20; scene.add(dome);
    const board = new THREE.Mesh(new THREE.PlaneGeometry(9000, 9000).rotateX(-PI / 2), new THREE.ShaderMaterial({
      uniforms: UO({}),
      vertexShader: /* glsl */`varying vec3 vW; void main(){ vW = (modelMatrix*vec4(position, 1.)).xyz; gl_Position = projectionMatrix*viewMatrix*vec4(vW, 1.); }`,
      fragmentShader: /* glsl */`${STYLE_GLSL}${ROOM_GLSL}
        uniform vec4 uSlabR[6], uScar[6]; uniform float uSlabK[6], uT; uniform vec3 uSlabBlue;
        varying vec3 vW;
        float rectD(vec2 p, vec2 c, vec2 h){ return length(max(abs(p - c) - h, 0.)); }
        void main(){
          vec2 p = vW.xz; vec3 ev = cameraPosition - vW; float dist = length(ev);
          float px = max(length(fwidth(p)), 1e-4), pxx = max(fwidth(p.x), 1e-4);
          // boards 40 m wide, grain running along the course; each plank its own tone
          float pid = floor((p.x + 20.)/40.), fx = fract((p.x + 20.)/40.)*40.;
          float tone = 1. + 0.07*(hash11(pid*3.7 + 1.) - 0.5);
          float fineK = 1. - smoothstep(0.12, 0.5, pxx), midK = 1. - smoothstep(0.5, 2.2, pxx);
          float warp = 2.2*vnoise(vec2(p.x*0.11 + pid*7., p.y*0.004)) + 0.5*vnoise(vec2(p.x*0.4, p.y*0.013));
          float g1 = abs(fract(p.x*0.42 + warp) - 0.5)*2.;                              // the long straight grain
          float line = (1. - smoothstep(0.0, 0.16 + pxx*0.8, g1))*midK;
          float g2 = vnoise(vec2(p.x*5.2, p.y*0.045 + pid))*fineK;                       // the fine tooth of the wood
          float flame = vnoise(vec2(p.x*0.045 + pid*3., p.y*0.0025));                    // slow figure across a plank
          tone *= 1. - 0.13*line - 0.07*(g2 - 0.5*fineK) + 0.1*(flame - 0.5);
          float seam = 1. - smoothstep(0.08 + pxx*0.75, 0.2 + pxx*1.5, min(fx, 40. - fx));
          tone *= 1. - 0.3*seam*min(1., 0.5/max(pxx, 0.5) + 0.35);
          float sc = 0.;                                                                  // old knife scars
          for (int i = 0; i < 6; i++){ vec2 a = uScar[i].xy, b = uScar[i].zw, ab = b - a; float h = clamp(dot(p - a, ab)/max(dot(ab, ab), 1e-3), 0., 1.);
            float d = length(p - a - ab*h); sc = max(sc, (1. - smoothstep(0.1 + px*0.7, 0.22 + px*1.5, d))*sin(3.14159*h)); }
          tone *= 1. - 0.25*sc*min(1., 0.4/max(px, 0.4) + 0.3);
          // no cast shadow: only a soft contact breath under the loaf and the slices
          float br = exp(-rectD(p, vec2(0.5*(uBoxMin.x + min(uBoxMax.x, 60.)), 0.5*(uBoxMin.z + uBoxMax.z)), vec2(0.5*(min(uBoxMax.x, 60.) - uBoxMin.x), 0.5*(uBoxMax.z - uBoxMin.z)))/7.);
          // THE BLUE LIES ON THE BOARD: the lamp's light comes through each slice and lays a pool of its colour on the wood
          // on the side away from the lamp; the jelly shivers, so the pool swims a little
          vec2 away = p - uLampPos.xz; away /= max(length(away), 1.);
          vec3 glow = vec3(0.);
          for (int i = 0; i < 6; i++){ br = max(br, uSlabK[i]*exp(-rectD(p, uSlabR[i].xy, uSlabR[i].zw)/5.));
            glow += uSlabBlue*uSlabK[i]*exp(-rectD(p - away*46., uSlabR[i].xy, uSlabR[i].zw + vec2(0., 14.))/22.); }
          glow *= 0.82 + 0.18*sin(p.x*0.19 + p.y*0.15 + uT*1.3 + 2.*sin(p.y*0.08 - uT*0.7));
          // the lamp itself lies along the polished wood as a long soft streak toward the eye
          vec3 v = ev/max(dist, 1e-3); vec3 ld = uLampPos - vW; ld /= max(length(ld), 1e-3);
          float sp = max(dot(reflect(-v, vec3(0., 1., 0.)), ld), 0.); sp *= sp; sp *= sp; sp *= sp; sp *= sp*sp;
          vec3 col = uBoard*tone*(roomLight(vW, vec3(0., 1., 0.), 0.)*(1. - 0.35*br) + glow*0.5) + uLamp*uLampK.w*0.3*sp*(0.75 + 0.5*line);
          col = mix(col, uRoomLow*0.8, smoothstep(500., 2600., dist));                    // the board runs off into the dark of the room
          gl_FragColor = vec4(toScene(col), 1.);
        }`,
    }));
    board.position.set(0, 0, 500); board.frustumCulled = false; board.renderOrder = -10; scene.add(board);
    await ctx.yield();
    {
      const nB = Math.round(26 * dens), q = [0, 0, 0, 1];      // sixth round: a handful of spilled grains
      const geo = sugarGeometry(nB, (i, o) => {
        let x = 0, z = 0;
        for (let k = 0; k < 20; k++) { x = rng.range(-120, 400); z = rng.range(-190, 260) * (rng() < 0.6 ? 0.6 : 1); if ((abs(x) > 66 || z < 94) && !(x > 70 && x < 370 && z > -4 && z < 150)) break; }
        const r = rng(), s = 1 + 4.2 * r * r; randQuat(q); if (rng() < 0.6) { const a = rng() * TAU; q[0] = 0; q[1] = sin(a / 2); q[2] = 0; q[3] = cos(a / 2); }
        o.p[0] = x; o.p[1] = s * 0.46; o.p[2] = z; o.q[0] = q[0]; o.q[1] = q[1]; o.q[2] = q[2]; o.q[3] = q[3]; o.s[0] = s; o.s[1] = s * rng.range(0.8, 1.05); o.s[2] = s * rng.range(0.85, 1.1); o.tone = 0.94 + 0.06 * rng();
      });
      const m = new THREE.Mesh(geo, sugarMaterial(UO({}), true)); m.frustumCulled = false; m.renderOrder = -5; scene.add(m);
    }
    await ctx.yield();
    // ---------- the knife: laid down on the board after the last cut; a thin bright blade, a dark handle (never a wall) ----------
    const KNIFE = { mesh: null };
    {
      // SEVENTH ROUND: ONE TOOL. The blade is one rigid leaf of steel that leaves the ferrule at the handle's own height and
      // comes down to the board at its tip; the handle is turned wood (round, smooth: its normals go round its axis), closed
      // at its butt; the ferrule is a snug pale collar of the handle's own girth that closes onto the blade's heel.
      const pos = [], kind = [], nor = [];
      const quad = (a, b, c, d, k, ac) => { pos.push(...a, ...b, ...c, ...a, ...c, ...d); const q = ac || [0, 0, 0, 0]; kind.push(k, q[0], k, q[1], k, q[2], k, q[0], k, q[2], k, q[3]);
        const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
        let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
        for (let i = 0; i < 6; i++) nor.push(nx, ny, nz); };
      const N = 40, LB = 170, W = 26, wAt = (x) => { const t = max(0, (x - 112) / 58); return W * sqrt(max(1 - t * t, 0)); };
      const HR = 7.3, HY = 0.8, AX = HY * HR, AZ = 9;                       // the handle's axis: its height over the board, its place across the blade
      const lift = (x) => (AX - 0.85) * (1 - x / LB);                       // the heel sits in the ferrule, the tip on the board
      // (the knife's own measures, for where it stands and what must stand clear of it: its tip's x while it stands at x -100;
      // the turn that brings the blade's flat square to the cut, since the lying blade runs down from the ferrule to the board;
      // and how far the flat's far side then stands from the knife's own origin)
      KNIFE.tipX = -100 + LB; KNIFE.sq = Math.atan((AX - 0.85) / LB); KNIFE.thick = (AX - 0.85 + 1.7) * cos(KNIFE.sq);
      for (let i = 0; i < N; i++) {
        const x0 = (i / N) * LB, x1 = ((i + 1) / N) * LB, w0 = wAt(x0), w1 = wAt(x1), t0 = 1.7 * (1 - 0.5 * x0 / LB), t1 = 1.7 * (1 - 0.5 * x1 / LB), l0 = lift(x0), l1 = lift(x1);
        quad([x0, l0 + t0, 0], [x0, l0 + t0 * 0.62, w0 * 0.78], [x1, l1 + t1 * 0.62, w1 * 0.78], [x1, l1 + t1, 0], 0, [0, 0.78, 0.78, 0]);            // the flat
        quad([x0, l0 + t0 * 0.62, w0 * 0.78], [x0, l0 + 0.06, w0], [x1, l1 + 0.06, w1], [x1, l1 + t1 * 0.62, w1 * 0.78], 0, [0.78, 1, 1, 0.78]);      // the ground bevel, down to the edge
        quad([x0, l0 + 0.02, 0], [x0, l0 + t0, 0], [x1, l1 + t1, 0], [x1, l1 + 0.02, 0], 0, [0, 0, 0, 0]);                                              // the spine
      }
      quad([0, lift(0) + 0.02, 0], [0, lift(0) + 0.06, W], [0, lift(0) + 1.05, W * 0.78], [0, lift(0) + 1.7, 0], 0, [0, 1, 0.78, 0]);                  // the heel's own end face
      // a turned piece along the knife's length: profile [x, radius], smooth round the axis, crisp where the profile breaks
      const SIDES = 32;
      const turned = (prof, k) => { for (let i = 0; i < prof.length - 1; i++) { const A = prof[i], B = prof[i + 1], dx = B[0] - A[0], dr = B[1] - A[1], l = Math.hypot(dx, dr) || 1;
        for (let j = 0; j < SIDES; j++) { const a0 = (j / SIDES) * TAU, a1 = ((j + 1) / SIDES) * TAU;
          const P = (X, a) => [X[0], AX + X[1] * HY * sin(a), AZ + X[1] * cos(a)], Nn = (a) => [-dr / l, (dx / l) * sin(a), (dx / l) * cos(a)];
          const vs = [[A, a0], [B, a0], [B, a1], [A, a0], [B, a1], [A, a1]];
          for (const v of vs) { pos.push(...P(v[0], v[1])); nor.push(...Nn(v[1])); kind.push(k, v[1] / TAU); } } } };
      turned([[-76, 0], [-76, 4.4], [-75.2, 5.5], [-73, 6.3], [-40, 6.9], [-9, HR - 0.12]], 1);                                // dark wood, its butt closed and eased
      turned([[-9, HR - 0.12], [-9, HR + 0.1], [-1.4, HR + 0.1], [-0.3, HR - 0.5], [0, HR - 1.6], [0, 0]], 2);                  // the pale ferrule, closing onto the heel
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aKind', new THREE.Float32BufferAttribute(kind, 2)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
      const knife = new THREE.Mesh(g, new THREE.ShaderMaterial({
        uniforms: UO({ uKnifeJ: { value: new THREE.Vector4(140, 1, 0, 0) } }), side: THREE.DoubleSide,
        vertexShader: /* glsl */`attribute vec2 aKind; varying vec3 vW; varying vec3 vN; varying vec2 vL; varying vec2 vK;
          void main(){ vec4 w = modelMatrix*vec4(position, 1.); vW = w.xyz; vN = mat3(modelMatrix)*normal; vL = position.xz; vK = aKind; gl_Position = projectionMatrix*viewMatrix*w; }`,
        fragmentShader: /* glsl */`${STYLE_GLSL}${ROOM_GLSL}
          uniform vec3 uSteel, uSlabBlue, uGoldOut; uniform float uT; uniform vec4 uKnifeJ;
          varying vec3 vW; varying vec3 vN; varying vec2 vL; varying vec2 vK;
          void main(){
            vec3 e = cameraPosition - vW; float dist = length(e); vec3 d = e/max(dist, 1e-4);
            vec3 n = vN/max(length(vN), 1e-4); if (dot(n, d) < 0.) n = -n;
            vec3 ld = uLampPos - vW; ld /= max(length(ld), 1e-3);
            float sp = max(dot(reflect(-d, n), ld), 0.), s4 = sp*sp*sp*sp, px = max(fwidth(vL.x), 1e-4);
            vec3 col;
            if (vK.x < 0.5) {                                       // steel: grind marks across it, the temper line, the lamp as one sliding band
              float grind = (vnoise(vec2(vL.x*2.6, vL.y*0.07)) - 0.5)*(1. - smoothstep(0.1, 0.6, px));
              float ham = vK.y - 0.56 - 0.045*sin(vL.x*0.11) - 0.02*sin(vL.x*0.29 + 1.);
              float temper = smoothstep(-0.02, 0.02, ham), tl = 1. - smoothstep(0.0, 0.035 + fwidth(vK.y), abs(ham));
              float bs = (vL.x + 20. - 12.*sin(uT*0.23) - 0.5*dot(cameraPosition.xz - vec2(-40., 100.), vec2(0.878, -0.479)))/24.;
              float band = exp(-bs*bs);      // the lamp's one band slides along the steel as we pass, always in the part of the blade ahead of us
              float edge = 0.45*smoothstep(0.78, 0.8, vK.y) + 0.55*smoothstep(0.955, 0.975, vK.y);
              vec3 mir = mix(uRoomLow, uRoomHi, clamp(reflect(-d, n).y, 0., 1.));           // polished steel shows the dark of the room
              col = uSteel*(0.2 + 0.17*temper + 0.1*grind + 0.3*tl + 0.5*edge) + mir*0.5
                  + vec3(1., 0.93, 0.8)*uLampK.w*(0.12*s4 + 0.5*s4*s4*s4*s4*s4 + 0.66*band*(0.75 + 0.7*grind)*(0.6 + 0.4*temper));
              // SEVENTH ROUND: what the last cut left on the flat: a wet smear of the night's own blue jelly, dragged along the
              // blade, a paler wet line round it, and three flakes of gold leaf stuck to the steel
              float pz = max(fwidth(vL.y), px);
              float smn = vnoise(vec2(vL.x*0.045 + 2., vL.y*0.16)) + 0.35*vnoise(vec2(vL.x*0.16, vL.y*0.5 + 7.));
              float smd = smn - 1.4 + 0.9*smoothstep(26., 46., vL.x)*(1. - smoothstep(96., 128., vL.x))*smoothstep(1.5, 5., vL.y)*(1. - smoothstep(0.6, 0.74, vK.y));
              float smw = clamp(fwidth(smd)*1.5, 0.004, 0.2);
              float smear = smoothstep(-smw, smw, smd), srim = smear*(1. - smoothstep(0.0, 0.035 + smw, smd));
              vec3 jel = uSlabBlue*(0.2 + 0.25*smoothstep(0., 0.2, smd))*roomLight(vW, n, 0.3)*1.5 + vec3(1., 0.95, 0.85)*uLampK.w*(0.25*band + 0.35*s4*s4);
              col = mix(col, jel, 0.82*smear) + vec3(0.5, 0.56, 0.62)*srim*0.5;
              float flk = 0.;
              for (int i = 0; i < 3; i++) { vec2 fc = i == 0 ? vec2(57., 12.5) : (i == 1 ? vec2(84., 5.5) : vec2(118., 10.)); vec2 fq = vL - fc; vec2 fd = fq/max(length(fq), 1e-3);
                float fr = (i == 1 ? 3.3 : 2.5)*(0.72 + 0.4*vnoise(fd*1.7 + float(i)*7.));
                flk = max(flk, 1. - smoothstep(fr - pz, fr + pz, length(fq))); }
              col = mix(col, uGoldOut*(0.55 + 0.25*vnoise(vL*0.9))*roomLight(vW, n, 0.2)*2.2 + uLamp*0.5*band, flk);
            } else if (vK.x < 1.5) {                                // the handle: dark turned wood, its grain running along it, one soft highlight
              float gr = vnoise(vec2(vL.x*0.07, vK.y*23.)), gl = abs(fract(vK.y*17. + 1.3*gr + 0.2*sin(vL.x*0.11)) - 0.5);
              float gw = clamp(fwidth(vK.y)*17.*1.5, 0.02, 0.5);
              col = vec3(0.17, 0.088, 0.05)*(0.78 + 0.4*gr - 0.3*(1. - smoothstep(0.06, 0.1 + gw, gl))*(1. - smoothstep(0.2, 0.5, gw)))*roomLight(vW, n, 0.7)*1.6
                  + uLamp*uLampK.w*(0.05*sp*sp + 0.16*s4*s4);
            } else col = vec3(0.72, 0.66, 0.55)*(0.92 + 0.08*vnoise(vec2(vK.y*31., vL.x*0.8)))*roomLight(vW, n, 0.6)*1.4 + uLamp*uLampK.w*(0.06*sp*sp + 0.3*s4*s4);
            // TENTH ROUND: the part of the blade that is down in the jelly is seen through the jelly: the slab's own blue (uKnifeJ: the loaf's end z, on/off)
            float inJ = step(abs(vW.x), 60.)*step(vW.y, 80.)*step(uKnifeJ.x, vW.z)*uKnifeJ.y;
            col = mix(col, (col*1.3 + 0.05)*uSlabBlue, 0.88*inJ);
            gl_FragColor = vec4(toScene(col), 1.);
          }`,
      }));
      knife.position.set(-40, 0.04, 100); knife.rotation.y = 0.5;      // before the loaf's cut end, its edge toward it, the handle to port
      knife.frustumCulled = false; knife.renderOrder = -6; scene.add(knife); KNIFE.mesh = knife;
    }
    await ctx.yield();
    // ---------- far soft shapes of the room: the paper lantern (the one light), a tea bowl, a pair of chopsticks on their rest ----------
    {
      const pos = [], col = [], kind = [], tc = new THREE.Color();
      const box = (cx, cy, cz, w, h, d, hex, k = 0, ry = 0) => { const g = new THREE.BoxGeometry(w, h, d).toNonIndexed(); if (ry) g.rotateY(ry); const p = g.getAttribute('position'); tc.set(hex);
        for (let i = 0; i < p.count; i++) { pos.push(p.getX(i) + cx, p.getY(i) + cy, p.getZ(i) + cz); col.push(tc.r, tc.g, tc.b); kind.push(k); } g.dispose(); };
      const LX = LAMP.x, LZ = LAMP.z, HW = 82, Y0 = 36, Y1 = 330, WOOD = '#1E130C';
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) box(LX + sx * HW, 172, LZ + sz * HW, 11, 344, 11, WOOD);
      for (const y of [Y0, 134, 232, Y1]) { const t = y === Y0 || y === Y1 ? 12 : 5; for (const s of [-1, 1]) { box(LX, y, LZ + s * HW, HW * 2, t, t, WOOD); box(LX + s * HW, y, LZ, t, t, HW * 2, WOOD); } }
      for (const s of [-1, 1]) { box(LX, (Y0 + Y1) / 2, LZ + s * HW, 5, Y1 - Y0, 5, WOOD); box(LX + s * HW, (Y0 + Y1) / 2, LZ, 5, Y1 - Y0, 5, WOOD); }
      for (const s of [-1, 1]) { box(LX, (Y0 + Y1) / 2, LZ + s * (HW - 3), HW * 2 - 8, Y1 - Y0, 1, '#ffffff', 1); box(LX + s * (HW - 3), (Y0 + Y1) / 2, LZ, 1, Y1 - Y0, HW * 2 - 8, '#ffffff', 1); }
      box(LX, 347, LZ, HW * 2 + 26, 10, HW * 2 + 26, WOOD); box(LX, 362, LZ, 40, 22, 40, WOOD);
      // the chopsticks: two long lacquered rods to port of the loaf, their thick ends on a rest
      // SEVENTH ROUND: the chopsticks are turned and lacquered (round, tapering, a gold band at the thick end), and their rest
      // is a low glazed arch: nothing in the room is a box but the lantern's frame
      const fixN = [];                                         // [first vertex, count, fn(x, y, z) -> normal]: smooth normals laid over the faceted ones
      const tube = (A, B, ra, rb, hex, k, capA, capB) => { tc.set(hex); const ax = [B[0] - A[0], B[1] - A[1], B[2] - A[2]], L = Math.hypot(ax[0], ax[1], ax[2]) || 1; ax[0] /= L; ax[1] /= L; ax[2] /= L;
        const e1 = [ax[2], 0, -ax[0]], l1 = Math.hypot(e1[0], e1[2]) || 1; e1[0] /= l1; e1[2] /= l1; const e2 = [ax[1] * e1[2], ax[2] * e1[0] - ax[0] * e1[2], -ax[1] * e1[0]];
        const S = 16, first = pos.length / 3, P = (C, r, a) => [C[0] + r * (cos(a) * e1[0] + sin(a) * e2[0]), C[1] + r * (cos(a) * e1[1] + sin(a) * e2[1]), C[2] + r * (cos(a) * e1[2] + sin(a) * e2[2])];
        for (let j = 0; j < S; j++) { const a0 = (j / S) * TAU, a1 = ((j + 1) / S) * TAU;
          for (const v of [P(A, ra, a0), P(B, rb, a0), P(B, rb, a1), P(A, ra, a0), P(B, rb, a1), P(A, ra, a1)]) { pos.push(...v); col.push(tc.r, tc.g, tc.b); kind.push(k); } }
        fixN.push([first, S * 6, (x, y, z) => { const d = [x - A[0], y - A[1], z - A[2]], t = d[0] * ax[0] + d[1] * ax[1] + d[2] * ax[2]; return [d[0] - t * ax[0], d[1] - t * ax[1], d[2] - t * ax[2]]; }]);
        for (const [C, r, on] of [[A, ra, capA], [B, rb, capB]]) if (on) for (let j = 0; j < S; j++) { const a0 = (j / S) * TAU, a1 = ((j + 1) / S) * TAU;
          for (const v of [C, P(C, r, a0), P(C, r, a1)]) { pos.push(...v); col.push(tc.r, tc.g, tc.b); kind.push(k); } } };
      for (const off of [0, 34]) { const A = [-212 - off, 19, 40], B = [-262 - off, 4.2, 960], at = (t) => [lerp(A[0], B[0], t), lerp(A[1], B[1], t), lerp(A[2], B[2], t)];
        tube(at(0), at(0.07), 8.6, 8.4, '#B08A3A', 2, true, false); tube(at(0.07), at(0.075), 8.4, 8.0, '#2A0C0A', 2, false, false); tube(at(0.075), at(1), 8.0, 3.6, '#5C1A13', 2, false, true); }
      { tc.set('#3A4A44'); const S = 14, first = pos.length / 3, X0 = -293, X1 = -183, Z0 = 120, HW = 15, HH = 10;        // the rest: a low arch of celadon lying across under their thick ends
        const P = (x, a) => [x, HH * sin(a), Z0 - HW * cos(a)];
        for (let j = 0; j < S; j++) { const a0 = (j / S) * PI, a1 = ((j + 1) / S) * PI;
          for (const v of [P(X0, a0), P(X1, a0), P(X1, a1), P(X0, a0), P(X1, a1), P(X0, a1)]) { pos.push(...v); col.push(tc.r, tc.g, tc.b); kind.push(2); }
          for (const x of [X0, X1]) for (const v of [[x, 0, Z0], P(x, a0), P(x, a1)]) { pos.push(...v); col.push(tc.r, tc.g, tc.b); kind.push(3); } }
        fixN.push([first, S * 12, (x, y, z) => [0, y / HH, (z - Z0) / HW]]); }
      // the tea bowl, far to starboard beyond the row
      const prof = [[86, 0], [90, 20], [104, 24], [150, 56], [196, 108], [226, 162], [240, 204], [234, 208], [226, 200]], SEG = 36, BX = 650, BZ = 540;
      for (let i = 0; i < prof.length - 1; i++) for (let j = 0; j < SEG; j++) {
        const a0 = (j / SEG) * TAU, a1 = ((j + 1) / SEG) * TAU, A = prof[i], B = prof[i + 1];
        const v = [[A[0] * cos(a0), A[1], A[0] * sin(a0)], [B[0] * cos(a0), B[1], B[0] * sin(a0)], [B[0] * cos(a1), B[1], B[0] * sin(a1)], [A[0] * cos(a1), A[1], A[0] * sin(a1)]];
        tc.set(i < 2 ? '#5A3A24' : '#1D1714');
        for (const k of [0, 1, 2, 0, 2, 3]) { pos.push(v[k][0] + BX, v[k][1], v[k][2] + BZ); col.push(tc.r, tc.g, tc.b); kind.push(i < 2 ? 0 : 2); }
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aCol', new THREE.Float32BufferAttribute(col, 3)); g.setAttribute('aKind', new THREE.Float32BufferAttribute(kind, 1));
      g.computeVertexNormals();
      { const nr = g.getAttribute('normal'), pp = g.getAttribute('position');          // the bowl is turned, not faceted: its normals go round it
        for (const [first, count, fn] of fixN) for (let i = first; i < first + count; i++) { if (kind[i] === 3) continue; const v = fn(pp.getX(i), pp.getY(i), pp.getZ(i)), l = Math.hypot(v[0], v[1], v[2]) || 1; nr.setXYZ(i, v[0] / l, v[1] / l, v[2] / l); }
        for (let i = 0; i < pp.count; i++) if ((kind[i] === 2 && pp.getX(i) > 380) || (pp.getX(i) > 380 && kind[i] === 0)) { const dx = pp.getX(i) - BX, dz = pp.getZ(i) - BZ, l = Math.hypot(dx, dz) || 1, hx = Math.hypot(nr.getX(i), nr.getZ(i)); nr.setXYZ(i, dx / l * hx, nr.getY(i), dz / l * hx); } }
      const room = new THREE.Mesh(g, new THREE.ShaderMaterial({
        uniforms: UO({}), side: THREE.DoubleSide,
        vertexShader: /* glsl */`attribute vec3 aCol; attribute float aKind; varying vec3 vW; varying vec3 vN; varying vec3 vC; varying float vK;
          void main(){ vW = position; vN = normal; vC = aCol; vK = aKind; gl_Position = projectionMatrix*viewMatrix*vec4(position, 1.); }`,
        fragmentShader: /* glsl */`${STYLE_GLSL}${ROOM_GLSL}
          uniform float uT; varying vec3 vW; varying vec3 vN; varying vec3 vC; varying float vK;
          void main(){
            vec3 e = cameraPosition - vW; float dist = length(e); vec3 d = e/max(dist, 1e-4);
            vec3 n = vN/max(length(vN), 1e-4); if (dot(n, d) < 0.) n = -n;
            vec3 col;
            if (vK > 0.5 && vK < 1.5) {                              // paper: the flame behind it, brightest at its own height; the paper's fibres
              float h = (vW.y - uLampPos.y)/120., fib = vnoise(vec2(vW.x*0.05 + vW.z*0.05, vW.y*0.9));
              col = uLamp*uLampK.w*(0.5 + 0.48*exp(-h*h))*(0.94 + 0.1*fib);
            } else {
              vec3 ld = uLampPos - vW; ld /= max(length(ld), 1e-3);
              float sp = max(dot(reflect(-d, n), ld), 0.); sp *= sp; sp *= sp; sp *= sp;
              col = vC*roomLight(vW, n, 1.)*1.5 + uLamp*sp*(vK > 1.5 ? 0.22 : 0.1);      // glaze and lacquer take a soft light
            }
            col = mix(col, uRoomLow*0.9, 0.55*smoothstep(700., 2600., dist));
            gl_FragColor = vec4(toScene(col), 1.);
          }`,
      }));
      room.frustumCulled = false; room.renderOrder = -7; scene.add(room);
    }
    await ctx.yield();
    // ---------- the long cut's blade (rare): the same knife lengthways, 300 m of it, 25 m to starboard; seen only from within ----------
    const bladeGeo = (() => {
      const prof = [[-0.6, 300], [-0.6, 3], [0, 0], [0.6, 3], [0.6, 300]], pos = [], nor = [], L = 75;
      for (let i = 0; i < 4; i++) {
        const a = prof[i], b = prof[i + 1], ny = -(b[0] - a[0]), nz = b[1] - a[1], l = Math.hypot(ny, nz) || 1, n = [0, ny / l, nz / l];
        pos.push(-L, a[1], a[0], L, a[1], a[0], L, b[1], b[0], -L, a[1], a[0], L, b[1], b[0], -L, b[1], b[0]);
        for (let k = 0; k < 6; k++) nor.push(n[0], n[1], n[2]);
      }
      for (const sx of [-1, 1]) { const x = sx * L; pos.push(x, 300, -0.6, x, 3, -0.6, x, 0, 0, x, 300, -0.6, x, 0, 0, x, 300, 0.6, x, 0, 0, x, 3, 0.6, x, 300, 0.6); for (let k = 0; k < 9; k++) nor.push(sx, 0, 0); }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
      return g;
    })();
    const bladeMat = () => new THREE.ShaderMaterial({
      uniforms: UO({}), side: THREE.DoubleSide,
      vertexShader: /* glsl */`varying vec3 vW; varying vec3 vN; varying vec2 vL;
        void main(){ vec4 w = modelMatrix*vec4(position, 1.); vW = w.xyz; vN = mat3(modelMatrix)*normal; vL = vec2(position.x*length(modelMatrix[0].xyz), position.y);
          gl_Position = projectionMatrix*viewMatrix*w; }`,
      fragmentShader: /* glsl */`${STYLE_GLSL}${ROOM_GLSL}
        uniform vec3 uSteel; uniform float uT;
        varying vec3 vW; varying vec3 vN; varying vec2 vL;
        void main(){
          vec3 e = cameraPosition - vW; float dist = length(e); vec3 d = e/max(dist, 1e-4);
          vec3 n = vN/max(length(vN), 1e-4); if (dot(n, d) < 0.) n = -n;
          float px = max(fwidth(vL.x), 1e-4), pe = max(fwidth(vW.y), 1e-4);
          // THE SAME STEEL AS THE KNIFE ON THE BOARD (fifth round): grey with the drag lines of its own stroke near the eye, the
          // lamp's one warm band of sheen across it at the eye's own height, swimming slowly, and a crisp wet line where it
          // meets the cut jelly (along the ridge's section and under the loaf's top); it blues with distance like everything
          float drag = (vnoise(vec2(vL.x*2.6, vL.y*0.035)) - 0.5)*(1. - smoothstep(0.1, 0.5, px)) + 0.7*(vnoise(vec2(vL.x*0.33, vL.y*0.01)) - 0.5);
          float hb = (vW.y - cameraPosition.y - 4. - 3.5*sin(uT*0.55 + 0.6*sin(uT*0.19)) - 2.5*sin(vL.x*0.03 + uT*0.4))/5.;
          float band = exp(-hb*hb);
          float bevel = 1. - smoothstep(3. - pe, 3. + pe, vL.y);                // the ground edge: a brighter flat, and the grind line where it begins
          float gl2 = (1. - smoothstep(0.12 + pe, 0.3 + 2.*pe, abs(vL.y - 3.25)))*min(1., 0.25/pe + 0.3);
          vec3 alb = uSteel*(0.62 + 0.3*drag + 0.3*bevel - 0.14*gl2);
          bool inside = vW.z > uBoxMin.z + 0.02 && vW.z < uBoxMax.z && vW.y < uBoxMax.y && vW.x > uBoxMin.x && vW.x < uBoxMax.x;
          vec3 disp = alb;
          if (inside) {
            vec3 Te = transmit(eyePath(vW, cameraPosition)*0.42);       // sixth round: grey steel a long way down the loaf, blue only far off
            float wet = max(1. - smoothstep(0.2 + pe, 0.45 + 2.*pe, abs(vW.y - ridgeH(vW.x, vW.z) - 0.35)), 1. - smoothstep(0.15 + pe, 0.4 + 2.*pe, uBoxMax.y - vW.y));
            // seventh round: for its nearest 40 m the steel is the room's own steel: amber-grey under the lamp, its band warm
            float nearK = 1. - smoothstep(60., 135., dist);
            Te = mix(Te, vec3(1.), 0.85*nearK);
            disp = alb*mix(vec3(1.), uLamp*1.2, 0.8*nearK)*Te + uInk*(1. - Te.b);
            disp += uLamp*uLampK.w*band*(0.62 + 0.5*drag)*mix(Te, vec3(1.), max(0.72, nearK))*smoothstep(0.03, 0.3, Te.g)*(1. + 0.5*nearK);
            disp = mix(disp, vec3(0.9, 0.93, 0.96)*mix(Te, vec3(1.), 0.25), 0.9*wet*smoothstep(0.02, 0.2, Te.g));
          }
          gl_FragColor = vec4(toScene(disp), 1.);
        }`,
    });
    const LONG_T = 21.0, LONG = { x: 33, z0: 372, z1: 672, t0: LONG_T - STROKE, down: LONG_T };      // 27 m to starboard of the flight line
    const longBlade = new THREE.Mesh(bladeGeo, bladeMat()); longBlade.frustumCulled = false; longBlade.rotation.y = PI / 2; longBlade.scale.x = 2;
    longBlade.position.set(LONG.x + 0.1, 4000, (LONG.z0 + LONG.z1) / 2); longBlade.visible = rare; scene.add(longBlade);
    await ctx.yield();
    // ---------- loose scraps of gold leaf on the board: they lift, flutter and settle in the draught of each stroke ----------
    {
      const n = Math.round(46 * dens), g = new THREE.InstancedBufferGeometry(), pv = [];      // sixth round: a few flakes by the knife, none in the air
      for (let i = 0; i < 5; i++) { const a = (i / 5) * TAU; pv.push(cos(a), sin(a), i + 1); }
      g.setAttribute('position', new THREE.Float32BufferAttribute(pv, 3)); g.setIndex([0, 1, 2, 0, 2, 3, 0, 3, 4]);
      const aS = new Float32Array(n * 4); let cx = 0, cz = 0, clump = 0;
      for (let i = 0; i < n; i++) {
        let x = 0, z = 0;
        for (let k = 0; k < 30; k++) {
          if (clump > 0) { x = cx + rng.gauss() * 5; z = cz + rng.gauss() * 6; }
          else { x = 42 + rng.gauss() * 34; z = 62 + rng.gauss() * 20; }      // about the knife's blade
          if ((abs(x) > 63 || z < 97) && x > -200 && x < 420 && z > -220) break;
        }
        if (clump > 0) clump--; else if (rng() < 0.3) { clump = 2 + floor(rng() * 5); cx = x; cz = z; }
        const r = rng(); aS[i * 4] = x; aS[i * 4 + 1] = z; aS[i * 4 + 2] = 0.7 + 2.6 * r * r; aS[i * 4 + 3] = rng() * 100;
      }
      g.setAttribute('aS', new THREE.InstancedBufferAttribute(aS, 4)); g.instanceCount = n;
      const m = new THREE.Mesh(g, new THREE.ShaderMaterial({
        uniforms: UO({}), side: THREE.DoubleSide,
        vertexShader: /* glsl */`${STYLE_GLSL}${ROOM_GLSL}
          uniform float uT, uPx; uniform vec3 uGoldOut; attribute vec4 aS; varying vec3 vUv; varying vec3 vCol;
          void main(){
            float sd = aS.w, h = hash11(sd), h2 = hash11(sd*1.7 + 3.);
            vec3 c = vec3(aS.x, 0.07, aS.y); float lift = 0., flut = 0.; vec2 drift = vec2(0.);
            for (int i = 0; i < 3; i++){
              vec2 away = c.xz - vec2(0., uCutZ0[i]); float dd = length(away);
              float a = uCutAge[i] - 0.1 - dd/110.;
              if (a > 0.) { float g = a*exp(1. - a*1.15)*1.15*exp(-dd/150.); lift += g; flut += exp(-a*0.5); drift += away/max(dd, 1.)*(1. - exp(-a*0.7)); }
            }
            float trem = step(0.35, h2)*smoothstep(0.1, 1., sin(uT*(0.9 + h) + sd*7. + c.x*0.03));      // the room's own draught, crossing the board
            // some scraps never settle: they drift down through the north light, turning, the whole time
            float air = 0., ay = mod(46.*h2 + 23.*h - uT*(1.3 + 1.6*h), 46.);
            flut = mix(flut, 1., air);
            float th = flut*(1.2 + 2.*h)*sin(uT*(4. + 3.*h2) + sd*9.) + 1.3*trem*sin(uT*3.1 + sd);
            float yaw = sd*6.283 + flut*sin(uT*1.7 + sd);
            float rr = 0.8 + 0.2*hash11(sd*91.7 + position.z*7.3);
            vec2 l = position.xy*rr*aS.z*vec2(mix(0.45, 1., h), 1.)*min(1., 0.03*length(cameraPosition - c)/max(aS.z, 0.1));      // never a card against the lens
            l = vec2(l.x*cos(yaw) - l.y*sin(yaw), l.x*sin(yaw) + l.y*cos(yaw));
            c.xz += drift*(2. + 7.*h) + air*vec2(sin(uT*0.31 + sd), cos(uT*0.23 + sd*1.7))*7.; c.y += lift*(2.5 + 9.*h2) + 0.5*trem*aS.z + air*ay;
            l *= mix(1., smoothstep(0., 4., ay)*(1. - smoothstep(41., 46., ay))*0.8, air);
            vec3 p = c + vec3(l.x, l.y*sin(th) + abs(l.x)*0.04, l.y*cos(th));
            gl_Position = projectionMatrix*viewMatrix*vec4(p, 1.);
            vUv = vec3(position.xy*rr, sd);
            vCol = toScene(min(uGoldOut*(0.82 + 0.26*h)*(1. + 0.25*sin(th))*roomLight(p, vec3(0., 1., 0.), 0.)*2.1, vec3(0.95)));      // leaf throws the lamp back: brighter than the wood it lies on
          }`,
        fragmentShader: /* glsl */`${STYLE_GLSL}
          varying vec3 vUv; varying vec3 vCol;
          void main(){ float th = atan(vUv.y, vUv.x + 1e-5), sd = vUv.z;
            float rad = 0.5 + 0.34*vnoise(vec2(th*1.1 + sd, sd)) + 0.12*vnoise(vec2(th*4.3 - sd, sd + 3.));
            if (length(vUv.xy) > rad) discard;
            gl_FragColor = vec4(vCol, 1.); }`,
      }));
      m.frustumCulled = false; m.renderOrder = -4; scene.add(m);
    }
    await ctx.yield();
    // ---------- the slices: 20 m of the same night each, pale because thin; five stand in a row beside the loaf ----------
    // a slice has no hull of its own: its far faces multiply whatever lies behind them by what 20 m of agar lets through,
    // and 20 m of set jelly is not air: the lamp's light scattered in it gives the block its own pale blue body, so against
    // the dark of the room a slice GLOWS (uDay through its own thickness, laid over what is behind)
    const veilMaterial = (uniforms) => new THREE.ShaderMaterial({
      uniforms, side: THREE.BackSide, transparent: true, depthWrite: false,
      vertexShader: /* glsl */`${STYLE_GLSL}${STYLE_VERT_GLSL}
        varying vec3 vP; varying vec3 vEye; varying vec3 vQ;
        void main(){ vP = mix(uBoxMin, uBoxMax, position); vEye = eyeLocal(); vQ = position;
          vec3 p = vP + wobble(vP); p.y = max(p.y, uBoxMin.y + 0.08);
          gl_Position = projectionMatrix*modelViewMatrix*vec4(p, 1.); }`,
      fragmentShader: /* glsl */`${STYLE_GLSL}
        varying vec3 vP; varying vec3 vEye; varying vec3 vQ;
        void main(){ float m = eyePath(vP, vEye); vec3 T = transmit(m);
          // NINTH ROUND: A SLICE IS A SLAB. Seen through the block, its far faces are distinct tones (the top's underside paler,
          // with the lamp's sheen sliding along it as the eye moves; the far end deeper) and every far edge is a pale wet
          // line, dimmer than the near ones the skin draws: so the block has a thickness and a nearer slice overlaps the next.
          vec3 sz = uBoxMax - uBoxMin, q = vQ*sz, mid = 0.5*(uBoxMin + uBoxMax);
          float aa = max(max(fwidth(q.x), fwidth(q.y)), max(fwidth(q.z), 1e-4)), ed = 1e3, tone = 1., fa = 0., sheen = 0.;
          float endW = 0.;
          if (vQ.y > 0.9999) { ed = min(min(q.x, sz.x - q.x), min(q.z, sz.z - q.z)); tone = 1.22; fa = 0.82;
            sheen = 1. - smoothstep(7., 20., abs(q.x - 0.5*sz.x - 0.55*(vEye.x - mid.x) - 3.*sin(uTime*0.6))); }
          else if (vQ.x < 0.0001 || vQ.x > 0.9999) { ed = min(sz.y - q.y, min(q.z, sz.z - q.z)); endW = 1.; fa = 0.95; }
          else if (vQ.y > 0.0001) ed = min(min(q.x, sz.x - q.x), sz.y - q.y);
          float rl = 0.75*(1. - smoothstep(0.1 + 0.6*aa, 0.18 + 1.6*aa, ed));
          vec3 body = (uDay*T + uInk*(1. - T.b))*(0.9 + 0.1*(vP.y - uBoxMin.y)/max(sz.y, 1.))*tone;
          // 10h (N1): A SLICE'S END IS A DEEP BLUE BAND. Its end wall, met from within, is a mirror (agar's total internal
          // reflection, the loaf's own rule), and what it mirrors is the slab's own length of lit jelly: so it is the colour of
          // the tinted metres to it and the slab's whole length beyond, paler in the colourless top, as the wet end face is from
          // outside. (It was the thin wedge's own pale blue, a shade deeper: the edge of a pale pane.)
          if (endW > 0.5) { vec3 Tn = transmit(m + sz.x*rhoAt(vP.y)*uEyeK); body = uDay*Tn + uInk*(1. - Tn.b); }
          body = mix(body, uLamp*0.9 + uDay*0.25, 0.55*sheen);
          body = mix(body, uDay*0.9 + uLamp*0.15, rl);
          if (fa + rl > 0.) { gl_FragColor = vec4(toScene(body), max(max(0.95*(1. - exp(-m/8.)), fa*(1. - exp(-m/3.))), rl)); return; }
          // paler low down, where the lit board sends the lamp back up into it, and toward the top's colourless band
          float up = (vP.y - uBoxMin.y)/max(uBoxMax.y - uBoxMin.y, 1.);
          gl_FragColor = vec4(toScene((uDay*T + uInk*(1. - T.b))*(0.9 + 0.1*up)), 0.95*(1. - exp(-m/8.))); }`,
    });
    const slabs = [], A0 = shape.barA(160), MOON_AT = [-42, 53], MOON_R = 12.5;
    const LEAN = [0.16, 0.12, 0.19, 0.1, 0.17], YAW = [0.05, -0.03, 0.04, -0.05, 0.02];
    const makeSlice = async (i) => {
      // (tenth round: the sixth is the loaf's own end, z 140..160, with the loaf's own crescent a little thinner than the fresh face's: it is cut off as we arrive)
      const z0 = i < 5 ? FAN_Z0[i] : LOAF.z0 + 2 * LOAF.slab, MP = i < 5 ? FAN_MOON[i] : 0.1, MAT = i < 5 ? MOON_AT : shape.barC(LOAF.z0 + 2.5 * LOAF.slab), MR = i < 5 ? MOON_R : shape.faceMoon.R;
      const j = createJelly({ haze: 0.02, palette: pal, shape, box: { min: [LOAF.x0, 0, z0], max: [LOAF.x1, LOAF.y1, z0 + LOAF.slab - KERF] }, core: false, farFace: true, exposure: EXPOSURE, idle: 1.15 + 0.12 * (i % 3), idleF: 2.7 + 0.22 * ((i * 2) % 5), stick: 1 });
      const SU = j.uniforms; setRoom(SU);
      SU.uK.value.multiplyScalar(1.5);       // 20 m of it is the palette's slab blue
      SU.uCapY.value = U.uCapY.value; SU.uHas.value.copy(U.uHas.value); SU.uWobAmp.value = 2.4;
      SU.uMoonOv.value.set(MP, MR, 1, A0); SU.uMoonAt.value.set(MAT[0], MAT[1], 1);      // this slice's own moon
      for (let k = 0; k < 5; k++) SU.uCutZ0.value[k] = z0 + 1000;          // only the quiver of the wave function, never the travelling crest
      const sh = Object.assign(Object.create(shape), { barR: () => MR, barP: () => MP, barA: () => A0, barC: (z, o = [0, 0]) => { o[0] = MAT[0]; o[1] = MAT[1]; return o; } });
      const g = new THREE.Group(); g.matrixAutoUpdate = false;
      const add = (geo, mat, order) => { const m = new THREE.Mesh(geo, mat); m.frustumCulled = false; m.renderOrder = order; g.add(m); return m; };
      const box = j.boxGeometry(6);
      const veilM = add(box, veilMaterial(SU), 5), skinM = add(box, j.skinMaterial({ slab: 1 }), 5.01);
      add(await ridgeGeometry(z0, z0 + LOAF.slab, 5, 80), j.pasteMaterial(C[4], { grain: 0.3, furrow: 1, cap: true }), 0);
      add(barGeometry(sh, z0, z0 + LOAF.slab - KERF, 2), j.pasteMaterial(C[5], { grain: 0.1, keep: 0.9 }), 0);
      const cg = castGeometry(z0, z0 + LOAF.slab, 6); if (cg) add(cg, j.pasteMaterial(C[5], { grain: 0.06 }), 0);
      const nl = Math.round(120 * detail * dens);
      // (the sixth slab is new: its leaf is dealt from a stream of its own. The five slices' leaf is tried against the ridge, and
      // the ridge's spur beside the window was moved, so the third slice takes a different count of draws than in the version
      // before and everything dealt after it from the world's stream falls anew at every seed; nothing is kept to hold the old deal)
      const rng = i < 5 ? ctx.rng : ctx.core.makeRng(ctx.core.hashSeed('sixth slab:' + ctx.seed));
      add(j.leafGeometry(nl, rng, (k2, o) => {
        for (let k = 0; k < 8; k++) {
          o.pos[0] = rng.range(LOAF.x0 + 2, LOAF.x1 - 2); o.pos[1] = rng.range(4, LOAF.y1 - 2); o.pos[2] = rng.range(z0 + 1, z0 + LOAF.slab - 1);
          if (o.pos[1] > shape.ridgeH(o.pos[0], o.pos[2]) + 2 && Math.hypot(o.pos[0] - MAT[0], o.pos[1] - MAT[1]) > MR + 2) break;
          o.pos[1] = LOAF.y1 - 3;
        }
        const r = rng(); o.size = 0.35 + 1.3 * r * r * r; o.tone = 0.8 + 0.3 * rng();
      }), j.leafMaterial(), 1);
      scene.add(g);
      const s = { i, z0, x: i < 5 ? FAN[i][0] : 0, z: i < 5 ? FAN[i][1] : z0, jelly: j, U: SU, group: g, idle0: SU.uIdle.value, veilM, skinM, d: 0 };
      slabs.push(s); await ctx.yield();
      return s;
    };
    for (let i = 0; i < FAN.length; i++) await makeSlice(i);
    await makeSlice(5);
    // (the sixth comes to stand with its trailing edge 5 m clear of the knife's tip: the knife stands, is tipped and lies clear
    // of every other thing on the board by 5 m or more. The design: slabs "slide to port at 25 m/s", for as far as that is.)
    const HW6 = (LOAF.x1 - LOAF.x0) / 2;
    const NEW = { x: KNIFE.tipX + 5 + HW6, z: 138, lean: 0.12, yaw: 0.03, t1: CUT_T + 0.7 }; NEW.t2 = CUT_T + 0.45 + NEW.x / 25;
    // its sway on its foot: four fifths of the room between its top and its neighbour's (the fifth leans further back)
    const SWAY6 = 0.8 * ((NEW.z - FAN[4][1] - LOAF.slab) / LOAF.y1 + NEW.lean - LEAN[4]);
    //      // where the new slice comes to stand: the row's sixth, beside the loaf's end
    const _eyeW = new THREE.Vector3();
    const _m = new THREE.Matrix4(), _r = new THREE.Matrix4(), _t = new THREE.Matrix4(), _e = new THREE.Euler();
    // a slice stands on the near edge of its foot and leans back a little, each by its own hand; the last (nearest the
    // loaf) was set down a moment ago and is still rocking to rest
    const smooth5 = (f) => f * f * f * (f * (f * 6 - 15) + 10);
    // the sixth: nothing of it until the knife is through; then it leans off the fresh face, is slid clear along the row and
    // set on its foot beside the fifth, where it sways to rest
    const poseNew = (s, t, time) => {
      if (t < CUT_T) {                                                // still part of the loaf (the loaf draws it): parked under the board, no size
        _m.makeScale(1e-4, 1e-4, 1e-4).setPosition(0, -900, 150); s.group.matrix.copy(_m); s.group.matrixWorldNeedsUpdate = true;
        s.U.uRot.value.identity(); OUT.uSlabK.value[5] = 0; s.x = 0; s.z = 140; return; }
      const a = sstep(CUT_T, NEW.t1, t), f = smooth5(clamp((t - CUT_T - 0.45) / (NEW.t2 - CUT_T - 0.45), 0, 1));
      // it runs along the blade's flat, a hand's breadth off it, for as long as any of it is beside the blade; once its trailing
      // edge is past the knife's tip it is set on its foot in the row (g), turned a little, and sways there
      const g = sstep(KNIFE.tipX + HW6, NEW.x, NEW.x * f);
      const sway = SWAY6 * g * Math.exp(-max(t - NEW.t2, 0) * 0.3) * cos(time * 2.5 + 0.4);
      const lean = lerp(-0.05 * a, NEW.lean, sstep(0, 0.25, f)) - sway;
      s.x = NEW.x * f; s.z = lerp(lerp(140, 135, a), NEW.z, g);
      _m.makeTranslation(s.x, 0, s.z).multiply(_r.makeRotationFromEuler(_e.set(lean, NEW.yaw * g, 0, 'YXZ'))).multiply(_t.makeTranslation(0, 0, -s.z0));
      s.group.matrix.copy(_m); s.group.matrixWorldNeedsUpdate = true; s.U.uRot.value.setFromMatrix4(_m);
      OUT.uSlabR.value[5].set(s.x, s.z + 10, 60, 10); OUT.uSlabK.value[5] = a;
      s.U.uCutAge.value[0] = t - CUT_T + 0.2;                          // it quivers from the stroke on
      s.U.uIdle.value = s.idle0 * (1 + 0.9 * Math.exp(-max(t - CUT_T, 0) * 0.3));
    };
    const poseSlice = (s, t, time) => {
      if (s.i === 5) { poseNew(s, t, time); return; }
      // the last was set down a moment ago: it rocks on its foot (on the room's clock, so it is alive in the portal picture
      // too, where journey time stands still) and comes to rest over some seven seconds of the journey
      const last = s.i === FAN.length - 1;
      const lean = LEAN[s.i] - (last ? 0.075 * Math.exp(-t * 0.42) * cos(time * 2.5 + 0.4) : 0);
      _m.makeTranslation(s.x, 0, s.z).multiply(_r.makeRotationFromEuler(_e.set(lean, YAW[s.i], 0, 'YXZ'))).multiply(_t.makeTranslation(0, 0, -s.z0));
      s.group.matrix.copy(_m); s.group.matrixWorldNeedsUpdate = true; s.U.uRot.value.setFromMatrix4(_m);
      OUT.uSlabR.value[s.i].set(s.x, s.z + 10, 60, 10); OUT.uSlabK.value[s.i] = 1;
      s.U.uCutAge.value[0] = last ? t + 1 : -1;        // it quivers as it settles
      s.U.uIdle.value = s.idle0 * (last ? 1 + 0.8 * Math.exp(-t * 0.35) : 1);
    };
    await ctx.yield();
    // ---------- the skein (sixth round): wild geese of dark paste cross the face of the gibbous moon as we come up to it ----------
    const skc = shape.moonC(shape.moons[3]);
    const SKEIN = { n: cast === 'geese' ? 9 : cast === 'clouds' ? 5 : 3, span: cast === 'clouds' ? 5.4 : 4.2, c: new THREE.Vector3(skc[0], skc[1], shape.moons[3].z) };
    {
      const pos = [], ag = [];
      for (let i = 0; i < SKEIN.n; i++) {
        const k = i - (SKEIN.n - 1) / 2, ox = cast === 'clouds' ? -i * 5 + 10 : -abs(k) * 3.1 + 5, oy = cast === 'clouds' ? i * 1.5 - 3 : k * 2.3 + 0.5 * sin(i * 2.3);
        const W = SKEIN.span * (0.9 + 0.2 * rng()), ph = i * 0.9 + rng() * 2;
        for (const sd of [-1, 1]) {                                  // a wing: a tapering stroke from the body to the tip
          const p = [[0, 0.42, 0], [0, -0.42, 0], [sd * W, -0.09, 1], [sd * W, 0.09, 1]];
          for (const q of [0, 1, 2, 0, 2, 3]) { pos.push(ox + p[q][0], oy + p[q][1], 0); ag.push(p[q][2], ph, W); }
        }
        const b = [[1.5, 0, 0], [0, 0.5, 0], [-0.9, 0, 0], [0, -0.5, 0]];      // neck and body: a lozenge pointing the way it flies
        for (const q of [0, 1, 2, 0, 2, 3]) { pos.push(ox + b[q][0], oy + b[q][1], 0); ag.push(0, ph, W); }
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aG', new THREE.Float32BufferAttribute(ag, 3));
      g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 40, 580), 900);
      SKEIN.U = Object.assign({}, U, { uAt: { value: new THREE.Vector3(SKEIN.c.x, SKEIN.c.y, SKEIN.c.z - 7) }, uDarkP: { value: C[4] }, uPx: U.uPx });
      const m = addLoaf(g, new THREE.ShaderMaterial({
        uniforms: SKEIN.U, side: THREE.DoubleSide,
        vertexShader: /* glsl */`${STYLE_GLSL}${STYLE_VERT_GLSL}
          uniform vec3 uAt; uniform float uPx; attribute vec3 aG; varying vec3 vP; varying vec3 vEye;
          void main(){
            vEye = eyeLocal();
            float beat = sin(uTime*3.4 + aG.y), dist = length(vEye - uAt);
            float grow = max(1., 2.2*dist/max(0.5*uPx, 1e-3));          // a wing never thinner than about 2 px
            vec3 l = vec3(position.x, position.y*mix(grow, 1., aG.x) + aG.x*aG.z*(0.42*beat + 0.16), 0.);
            l.y += 0.35*sin(uTime*0.7 + aG.y*1.7);                       // each bird rides the air a little
            vP = uAt + l;
            gl_Position = projectionMatrix*modelViewMatrix*vec4(vP + wobble(uAt), 1.);
          }`,
        fragmentShader: /* glsl */`${STYLE_GLSL}
          uniform vec3 uDarkP; varying vec3 vP; varying vec3 vEye;
          void main(){ if (vP.z < uBoxMin.z || vP.x > uBoxMax.x) discard;
            gl_FragColor = vec4(inJelly(uDarkP*0.8, vP, vec3(0., 0., -1.), vEye), 1.); }`,
      }), 1);
      void m;
    }
    await ctx.yield();
    // ---------- bubbles trapped in the wall of the clear core (sixth round): in the last seconds they slide past within arm's reach ----------
    {
      const nSmall = 56, nb = nSmall + 13, g = new THREE.InstancedBufferGeometry(), aB = new Float32Array(nb * 4);
      g.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3)); g.setIndex([0, 1, 2, 0, 2, 3]);
      for (let i = 0; i < nSmall; i++) { const a = rng() * TAU, r = LOAF.coreR - 0.6 - 1.5 * rng() * rng(), z = lerp(908, 1056, (i + rng()) / nSmall), big = rng();
        aB[i * 4] = LOAF.axis[0] + r * cos(a); aB[i * 4 + 1] = LOAF.axis[1] + r * sin(a); aB[i * 4 + 2] = z; aB[i * 4 + 3] = 0.12 + 0.3 * big * big; }
      // seventh round: a dozen larger bubbles caught in the rod where it springs from the tip, seen from the valley as we come up under it
      { const br = ctx.core.makeRng(ctx.core.hashSeed(ctx.seed + ':night-by-the-slice-rod'));
        for (let i = nSmall; i < nb; i++) { const k = i - nSmall, a = br() * TAU, r = (LOAF.coreR - 1.6) * Math.sqrt(br()), z = 903 + 4.6 * k + 3 * br(), q = br();
          aB[i * 4] = LOAF.axis[0] + r * cos(a); aB[i * 4 + 1] = LOAF.axis[1] + r * sin(a); aB[i * 4 + 2] = z; aB[i * 4 + 3] = 0.5 + 0.55 * q * q; } }
      g.setAttribute('aB', new THREE.InstancedBufferAttribute(aB, 4)); g.instanceCount = nb;
      g.boundingSphere = new THREE.Sphere(new THREE.Vector3(LOAF.axis[0], LOAF.axis[1], 980), 120);
      addLoaf(g, new THREE.ShaderMaterial({
        uniforms: U, transparent: true, depthWrite: false,
        vertexShader: /* glsl */`${STYLE_GLSL}${STYLE_VERT_GLSL}
          uniform float uPx; attribute vec4 aB; varying vec2 vQ; varying float vFade;
          void main(){
            vec3 eye = eyeLocal(), c = aB.xyz; float dist = length(eye - c);
            float grow = max(1., 3.*dist/max(aB.w*uPx, 1e-3));                  // never under about 3 px across its radius
            vec4 mv = modelViewMatrix*vec4(c + wobble(c), 1.);
            mv.xy += position.xy*aB.w*grow;
            vQ = position.xy; vFade = smoothstep(uCore.w - 60., uCore.w - 10., eye.z)*(1. - smoothstep(1., 2.2, grow));      // seen from the shaft, not as specks from the valley
            vFade = mix(vFade, smoothstep(uCore.w - 190., uCore.w - 120., eye.z)*(1. - smoothstep(uCore.w - 30., uCore.w - 6., eye.z)), step(0.45, aB.w));                        // the rod's own bubbles show from under the tip
            gl_Position = projectionMatrix*mv;
          }`,
        fragmentShader: /* glsl */`${STYLE_GLSL}
          varying vec2 vQ; varying float vFade;
          void main(){
            float r = length(vQ); if (r > 1. || vFade < 0.01) discard;
            float aa = clamp(fwidth(r), 1e-3, 0.3);
            float ring = smoothstep(0.8 - aa, 0.88, r)*(1. - smoothstep(1. - aa, 1., r));
            float glint = 1. - smoothstep(0.12, 0.12 + 2.*aa, length(vQ - vec2(-0.36, 0.4)));
            float low = (1. - smoothstep(0.1, 0.5, length(vQ - vec2(0.3, -0.42))))*0.35;      // the light that comes round inside it
            vec3 col = mix(mix(vec3(0.46, 0.58, 0.8), vec3(0.86, 0.9, 0.96), low), vec3(0.98), glint);
            gl_FragColor = vec4(toScene(col), clamp(0.8*ring + glint + low + 0.07, 0., 1.)*vFade);
          }`,
      }), 5);
    }
    // ---------- the clock: everything scripted follows journey seconds, which follow u ----------
    const LAKE_MID = (shape.lake.z0 + shape.lake.z1) / 2;
    const _cp = new THREE.Vector3(), mcs = shape.moons.map((m) => { const c = shape.moonC(m); return new THREE.Vector3(c[0], c[1], m.z); });
    const uAtZ = (z) => { pathXY(z, pxy); return path.nearestXZ(pxy[0], z).u; };
    const _poiCut = new THREE.Vector3(), _poiTmp = new THREE.Vector3();
    SKEIN.u0 = uAtZ(476); SKEIN.u1 = uAtZ(656); SKEIN.u2 = uAtZ(712);
    const update = (dt, time, camera, u = 0) => {
      const t = secondsAt(u);
      hero.setClock(t, CUT_TIMES); hero.update(dt, time, camera);
      camera.getWorldPosition(_cp); dome.position.copy(_cp);
      hero.meshes.skin.material.uniforms.uRoundF.value = 0.05 + 0.21 * sstep(30, 120, 160 - _cp.z);      // ninth round: close to the wet face the moon's unlit round is only a breath (it read as a flat pale cut-out); the crescent is the moon
      OUT.uT.value = time; U.uIdle.value = 0.3 + 0.67 * (1 - sstep(9, 15, t)) + 0.28 * sstep(33, 37, t);
      // EIGHTH ROUND: once, as we come along the row, the loaf's cut end shudders and its crescent swims (the last stroke's wave
      // starting down the loaf); and when a wave passes under the lake its round breaks into rings that run out and die
      U.uShud.value = sstep(CUT_T - 0.2, CUT_T + 0.7, t) * (1 - sstep(CUT_T + 2.2, CUT_T + 6, t));      // (tenth round: from the stroke we have just seen)
      hero.meshes.skin.material.uniforms.uMoonOv.value.x = t < CUT_T ? 0.1 : shape.faceMoon.p;      // the fresh face shows the moon a little fuller
      { let ring = 0; for (let i = 3; i < 5; i++) { const a = t - CUT_TIMES[i] - (LAKE_MID - (LOAF.z0 + LOAF.slab * (i + 1))) / LOAF.waveSpeed; if (a > -0.6) ring = max(ring, sstep(-0.6, 0.3, a) * Math.exp(-max(a, 0) * 1.3)); }
        U.uRing.value = ring; }
      U.uLampK.value.w = 1 + 0.035 * sin(time * 2.3) + 0.02 * sin(time * 5.9 + 1);      // the flame breathes; never a flash
      for (let i = 0; i < slabs.length; i++) { const s = slabs[i]; poseSlice(s, t, time); s.U.uTime.value = time; s.U.uPx.value = U.uPx.value; }
      // ninth round: each slice's far faces, then its near faces, and the slices from the farthest to the nearest, so a nearer slab's edge lies over the one behind
      _eyeW.copy(_cp);
      for (let i = 0; i < slabs.length; i++) { const s = slabs[i]; s.d = Math.hypot(s.x - _eyeW.x, 40 - _eyeW.y, s.z + 10 - _eyeW.z); }
      for (let i = 0; i < slabs.length; i++) { const s = slabs[i]; let rank = 0; for (let k = 0; k < slabs.length; k++) if (slabs[k].d > s.d || (slabs[k].d === s.d && k < i)) rank++;
        s.veilM.renderOrder = 5 + rank * 0.02; s.skinM.renderOrder = 5.01 + rank * 0.02; }
      // the skein crosses the moon's face while we come up the valley toward it (keyed to u), drifting a little on the room's clock
      if (u < SKEIN.u2) SKEIN.U.uAt.value.set(SKEIN.c.x + lerp(-29, 19, sstep(SKEIN.u0, SKEIN.u1, u)) + 1.2 * sin(time * 0.31), SKEIN.c.y - 0.5 + 4 * (sstep(SKEIN.u0, SKEIN.u1, u) - 0.5) + 0.6 * sin(time * 0.23), SKEIN.c.z - 7);
      // and once that moon is behind us the same skein is far ahead, crossing the upper face of the full moon as we fly into it
      // (it changes place while it is dark paste against the ink beside the moon, where it cannot be seen)
      else SKEIN.U.uAt.value.set(LOAF.axis[0] + lerp(-40, 26, sstep(SKEIN.u2, 1, u)) + 1.2 * sin(time * 0.31), LOAF.axis[1] + 13.5 + 2.5 * sstep(SKEIN.u2, 1, u) + 0.6 * sin(time * 0.23), LOAF.z1 - 7);
      // TENTH ROUND (B1): THE KNIFE'S ONE STROKE. The design: "The blade comes down at 1.5 s behind a 20 m slab, rests, and
      // slides the slab out to port". It comes down through the loaf, 80 m in STROKE seconds, and is down at CUT_T; it stands
      // in the cut while the slab is slid away; then it is tipped over onto its flat before the fresh face, laid down, and
      // rattles once.
      // (10e: the knife is no longer taken up from the board in view, and its stroke is already under way when we arrive: its
      // edge is in the loaf from the first frame. Strangers who saw the tenth round blind read the knife on its way up as a
      // thing hanging in mid air.)
      // (the knife rests in the cut for as long as the slab is sliding, the design's "the blade resting in the loaf, a slab sliding
      // out to port"; it is tipped once the slab stands, and laid down where it stood: 7 m clear of the chopsticks' rest)
      // (10g: the blade stands SQUARE in the cut, its flat in the cut's own plane against the fresh face at z 160, so the slab
      // runs along it and is never entered by it; as it is tipped the turn goes out of it and it lies as a knife lies, its tip
      // on the board, its edge 6 m before the fresh face)
      { const K = KNIFE.mesh, KT0 = NEW.t2, KT1 = KT0 + 1.0, KT2 = KT1 + 1.7, KZ = 160 - KNIFE.thick;
        if (t < CUT_T0) { K.rotation.set(PI / 2, 0, KNIFE.sq); K.position.set(-100, 106.04, KZ); }      // (before the stroke: square, its edge on the loaf's top)
        else if (t < KT0) { const s1 = clamp((t - CUT_T0) / STROKE, 0, 1), e1 = s1 * s1 * (3 - 2 * s1);
          K.rotation.set(PI / 2, 0, KNIFE.sq); K.position.set(-100, 26.04 + 80 * (1 - e1) + 0.25 * Math.exp(-max(t - CUT_T, 0) * 3) * sin(max(t - CUT_T, 0) * 14) * sstep(CUT_T, CUT_T + 0.05, t), KZ); }
        else { const a = smooth5(clamp((t - KT0) / (KT1 - KT0), 0, 1)), b = t - KT2;
          const th = lerp(PI / 2, 0.115, a) * (1 - sstep(KT1, KT2, t)) + 0.012 * Math.exp(-max(b, 0) * 1.6) * sin(max(b, 0) * 9) * sstep(0, 0.1, b);
          K.rotation.set(th, 0, KNIFE.sq * (1 - a)); K.position.set(-100, 0.04 + 26 * sin(max(th, 0)), lerp(KZ, 154, a) - 26 * cos(th)); }
        K.material.uniforms.uKnifeJ.value.set(t < CUT_T + 0.5 ? 140 : 1e5, 1, 0, 0); }
      if (rare) {                                    // the long cut: lengthways, 25 m to starboard, at 22 s
        const a = t - LONG.down, p = clamp((t - LONG.t0) / STROKE, 0, 1);
        const y = a < 0 ? BLADE_REST_Y * (1 - 0.5 * (p + p * p * (3 - 2 * p))) : BLADE_REST_Y * sstep(0.5, 2.1, a);
        longBlade.position.y = t < LONG.t0 - 4 ? 4000 : y;        // it is not in the room while we are outside
        U.uBoxMax.value.x = a >= 0 ? LONG.x + 0.6 : LOAF.x1;
        U.uSide.value.set(a >= 0 ? a : -1, LONG.x);
      }
    };
    update(0, 0, { getWorldPosition: (v) => v.set(169, 52, -142), projectionMatrix: { elements: new Float32Array(16).fill(1) } }, 0);

    return {
      scene, path, duration: DURATION, pace: worldPace,
      title: rare ? 'Night by the Slice: The Long Cut' : recipe === 'plum' ? 'Night by the Slice: Plum and Silver' : recipe === 'winter' ? 'Night by the Slice: Winter Loaf' : 'Night by the Slice',
      ride: 'none', style: 'none', companion: 'none',
      camera: { fov: 62, near: 0.4, far: 5000, lookAhead: 34, sway: 0.35, bank: 0.3 },
      pois: [
        { at: [-15, 50, 160], from: 0.13, to: uAtZ(160) - 0.01, weight: 0.4 },                       // the loaf's cut end, the crescent on it
        { at: [mcs[1].x, 52, mcs[1].z], from: uAtZ(196), to: uAtZ(300), weight: 0.3 },                // the row of moons down the port side
        { at: [-8, 28, 540], from: uAtZ(300), to: uAtZ(425), weight: 0.25 },                           // the half moon and its round in the lake
        ...(rare ? [{ at: (tt, uu) => _poiCut.set(LONG.x, 44, path.pointAt(uu, _poiTmp).z + 130), from: uAtZ(262), to: uAtZ(470), weight: 0.24 }] : []),      // the long cut: the blade and the fresh wall, up to starboard
        { at: [LOAF.x0, 44, 524], from: uAtZ(rare ? 440 : 396), to: uAtZ(508), weight: rare ? 0.4 : 0.62 },                   // the look out: the lantern and the knife through the wall
        { at: mcs[3], from: uAtZ(522), to: uAtZ(652), weight: 0.45 },                                  // geese crossing the gibbous moon
        { at: [-15, 46, 980], from: uAtZ(770), to: uAtZ(890), weight: 0.35 },                          // the full moon between the snow peaks, the bar's tip above
      ],
      // the exit is the middle of the full moon: a bare opening holding the moon's own cream until the next world shows
      portal: { shape: 'circle', radius: 7, color: pal[1], frame: 0, glow: 0, halo: false, veil: toScene(C[5].clone().multiplyScalar(0.985), EXPOSURE), revealDistance: 320, blendDistance: 25 },
      post: {
        exposure: EXPOSURE, bloom: { strength: 0.1, radius: 0.5, threshold: 1.4 },
        grade: { saturation: 1, contrast: 1, tint: '#ffffff', shadowTint: '#000000', vignette: 0.06, grain: 0.01, aberration: 0 },
      },
      update,
      dispose() { hero.dispose(); },
    };
  },
};
