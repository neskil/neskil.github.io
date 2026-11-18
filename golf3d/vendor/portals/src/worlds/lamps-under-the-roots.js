// Lamps Under the Roots. Inspired by the television series Lost (2004) and built round six of its known places, each
// made from words alone in forms of our own. THE CAMP: tarpaulin shelters, a ring of stones and a thread of smoke on
// the beach by the wreck. THE SHIP: a wooden sailing ship of long ago lying wrecked in the island's basin, far from
// any sea, heeled over in the grass with its masts broken and the great fall behind it. THE WRECK: the broken middle of an airliner on the beach where the
// stream comes out, a wing stub and an engine pod in the sand. THE HATCH: a heavy steel door with one small window,
// lying in a dug pit in the forest floor, a shaft of pale light standing out of its glass. THE RADIO MAST: a red and
// white lattice mast on the highest roof of the buried concrete Works, a red lamp blinking at its head, seen down the
// court's length and over the trees from the sea. THE HEART OF THE ISLAND: a low wide cave mouth in the far wall of
// the island's basin, pouring warm golden light, the basin's water running into it under falls that drop from the
// rim, the great one beside the way out. A green island alone in an empty sea hides more than it shows. No person, nothing lettered, no numeral, no
// emblem, no copied picture.
//
// REAL SOURCES: a fringing reef, a lagoon and a palm beach; wartime coast-battery casemates, observation slits, vent
// cowls and glass-block light wells; sunk courts and stairs cut in the ground; a weather post; strangler figs and
// buttressed kapoks; clear-water rift fissures and boiling limestone springs under mist.
// THE FIXED HOUR: late golden afternoon on every visit; the sun stands on bearing 292, 12 to 17 degrees up, and is
// seen wherever it is in view, under a sky that burns orange round it and goes rose and then deep blue-violet above
// and away from it. THREE LIGHTS BY PLACE: the sea and the beach open under that sky; the forest, the gully and the
// Works in deep green shade cut by hard gold, where the lamps glow; the basin in cool shade under a blazing upper
// wall. What the low sun reaches is gold, what it does not is blue-green under the sky's fill. In
// the basin the sun reaches the upper east wall only (the peak stands across its rays to the floor): the floor is
// lit by the sky, by its own water and by the heart's gold, which throws long shadows away from the mouth; the west
// wall stands in cool shade. The haze is thin.
// ON THE WORLD'S CLOCK (nothing begins, turns or ends because a visitor comes): the surf and its wash, wind in palms
// and leaves (its gusts from a dealt place in their cycle), the gold streaks trembling under the moving crowns, the
// stream and its cascades, falling leaves, the peak's cloud cap, the lamps' one shared dip running up the spine from
// its dealt place in its cycle and each lamp's own waver, steam breathing from the cowls, sun shafts where steam and
// spray cross a streak, the wind cups, root curtains and lianas swaying, drips ringing the court's rain sheet, each
// rift's own slow brightening along its length, the caustics, the Springhead's domes, the mist, the sedge, two far
// flocks, the camp's smoke, the falls from the rim, the ripples of the basin's water and of the run to the heart, the heart's halo
// breathing, the motes in the hatch's shaft, the mast's red lamp (on and off from a dealt phase); on the rare visit
// one wide cloud's shade crossing the Works.
// MEDIA (vapour and light in the air, never bodies): steam, sun shafts, mist, drips, the lamps' halos, the falls'
// spray, the hatch's shaft, the heart's halo, the red lamp's halo, the camp's smoke. None of them
// opens, thins or fades by the eye's place. Mist, drips and shafts are kept off the line by where they stand. Steam
// alone follows a medium's law (full at 2.5 m, nothing inside 0.6 m), and the cowls' places keep it off the lens. A
// falling leaf is a small BODY on a course known at build; like every body it keeps 2.6 m of clear air from the line.
// THE PLAN (the line, the ground rule, the Works, every dealt thing and every count) lives in the part file.
import * as THREE from 'three';
import { makePath, makeNoise, hashSeed, clamp, lerp, smoothstep } from '../kit/core.js';
import { makeSky, makeLightRig, skyDirection } from '../kit/sky.js';
import * as Water from '../kit/water.js';
import * as T from '../kit/terrain.js';
import * as flora from '../kit/flora.js';
import * as P from '../parts/lamps-under-the-roots.js';

const C3 = (h) => new THREE.Color(h);
const PAL = {
  lagoon: '#1f9c9a', deep: '#0a3f66', surf: '#f6fbff', sand: '#f4ead2', palm: '#7fae4a', lip: '#e9e4d2', root: '#2f3324', moss: '#7f9a5e',
};

export default {
  id: 'lamps-under-the-roots',
  name: 'Lamps Under the Roots',
  category: 'screen',
  placeKind: 'wilderness',
  screen: 'Lost',
  screenYear: '2004',
  screenKind: 'series',
  media: ['air'],
  weirdness: 0.35,

  async build(ctx) {
    const seed = ctx.seed, vary = ctx.vary || { hour: 'any', rare: false, density: 1, mood: 0.5 }, detail = ctx.quality?.detail ?? 1;
    // the one set of streams of this visit, each from the world's seed and its own name: made here once and handed to
    // the plan and the Works; nothing makes a stream a second time
    const S = P.makeStreams(seed);
    // the hour is fixed; the visit's hint only moves the sun inside its 12 to 17 degrees
    const sunBand = { dawn: [12, 13], night: [12, 13], golden: [12.5, 14.5], day: [15, 17] }[vary.hour] || [12, 17];
    const sunElev = lerp(sunBand[0], sunBand[1], S.sun()), SUN_AZ = 292;
    // the weather of the visit: 0 clear gold, 1 after rain (wet, more steam and mist), 2 trade wind (higher surf, tossing palms)
    const weather = vary.mood < 0.34 ? 0 : vary.mood < 0.67 ? 1 : 2, wet = weather === 1 ? 1 : 0, windy = weather === 2 ? 1 : 0;
    // the rare visit: one wide cloud shadow crossing the Works (there is no rain and no rainbow on any visit)
    const rare = !!vary.rare, density = clamp(vary.density ?? 1, 0.7, 1.3), thin = detail < 0.75 ? 0.5 : 1;
    const L = await P.layoutAsync(seed, vary, ctx.yield, S), path = makePath(L.knots.map((k) => new THREE.Vector3(k[0], k[1], k[2])));
    // (the great banyan's plan, dealt on its own stream)
    const BAN = P.dealBanyan(P.streamOf(seed, 'banyan'));
    const scene = new THREE.Scene(), noise = makeNoise(hashSeed('lamps-under-the-roots:ground'));
    const sunDir = skyDirection(sunElev, SUN_AZ);
    // the Works' shared values; the court's west wall lays its shade on the east wall up to this height at this hour
    const U = P.worksUniforms(); U.courtSun.value = P.K.LIP - (P.K.COURT.e1 - P.K.COURT.e0) * sunDir.y / Math.max(0.2, Math.abs(sunDir.x));
    // the rare visit's one wide cloud: [its place along the wind, its half breadth, how much of the sun it takes]
    const cloudU = { value: new THREE.Vector4(-1e5, 100, 0, 0) }, cloudPh = S.rare();
    await ctx.yield();

    // ---------- sky, light, haze ----------
    // THE HOUR: the last hour of sun. A pale face in the sun reads gold (the palette's sun colour), the same face in
    // shade reads blue-green (the palette's fill colour) at a third to two fifths of its brightness: the engine's film
    // curve bleaches bright colours, so the sun's own light is set deeper than the gold it leaves on a wall, and the
    // sky's low band deeper than the peach it shows. The sky is peach-gold low all round (strongest round the sun) and
    // pale aqua only high, with long thin clouds lit from below.
    const sky = makeSky({
      rng: S.clouds, preset: 'goldenHour', zenith: '#33459a', mid: '#e3987e', horizon: '#ffa45c', ground: '#3d5f70', horizonPow: 2.1,
      scatterColor: '#ff7a1c', scatter: 1.25, scatterPow: 2.4, sunElevation: sunElev, sunAzimuth: SUN_AZ, sunColor: '#fff0c4', sunSize: 1.5, sunIntensity: 15, sunGlow: 1.25,
      clouds: { coverage: weather === 1 ? 0.4 : 0.3, stretch: 0.75, softness: 0.4, lit: '#ffb060', shade: '#4b3f68', silver: 1.6 }, clouds2: { lit: '#ff9a94', shade: '#5a4a72', opacity: 0.5 },
      lightColor: '#ffab48', lightIntensity: 6.6, ambientColor: '#7fbfe6', groundLight: '#5f9fa6', ambientIntensity: 1.36,
    });
    scene.add(sky.object);
    const fogCol = C3('#b3b6c6');
    scene.fog = new THREE.FogExp2(fogCol.clone(), 0.00042 + 0.00012 * wet);
    const rig = makeLightRig(sky, { bounce: 0 }); scene.add(rig.object);
    await ctx.yield();

    // ---------- the island's ground ----------
    const H = (x, z) => P.groundAt(x, -z);
    // the ground's mesh is finest (one metre) within some 14 m of the line, at the yard and the room, and along the
    // rifts' edges (finer where a rift lies within 70 m of the line)
    const focus = [[-27, -356, 0.8], [-27, -367, 0.8], [-27, -378, 0.8]];
    for (const R of P.RIFTS) for (let i = 0; i + 1 < R.length; i++) { const a = R[i], b = R[i + 1], len = Math.hypot(b[0] - a[0], b[1] - a[1]), near = P.nearLine((a[0] + b[0]) / 2, (a[1] + b[1]) / 2)[0] < 70, k = Math.ceil(len / (near ? 9 : 14));
      for (let j = 0; j < k; j++) focus.push([lerp(a[0], b[0], j / k), -lerp(a[1], b[1], j / k), near ? 1.9 : 3.6]); }
    // (and at the heart's mouth, and along each fall's head wall and the sides of its recess)
    { const Hh = P.HEART, f = P.onBearing(Hh.face); for (let al = -Hh.hw - 6; al <= Hh.hw + 6; al += 4) for (const out of [1.5, -2.6]) focus.push([Hh.e + f[0] * out + f[1] * al, -(Hh.n + f[1] * out - f[0] * al), 1.5]);
      for (const F of P.FALLS) for (let s = -6; s <= F.len; s += 9) { const hw = lerp(7, F.w0, clamp(s / F.len, 0, 1)) + 2; for (const al of [-hw, 0, hw]) focus.push([F.e + F.o[0] * s + F.o[1] * al, -(F.n + F.o[1] * s - F.o[0] * al), s < 6 ? 2.2 : 3.6]); } }
    const terrain = await T.makeTerrainAsync({
      rng: S.land, noise, height: H, bounds: [-660, -1560, 580, 130], path, corridor: false, focus,
      cell: 1, near: 7, levels: 7, maxTriangles: 80000, biome: 'tropical', sunDir, skirt: 20, shadow: 1.0, ao: 0.15, bounceAmount: 0.04,
      color: (x, z, h, ny, out) => out.setRGB(0.3, 0.4, 0.25),
      palette: { rock: '#76836f', rockB: '#5b695c', patchAmount: 0.15, pebbles: 0.1, clouds: 0.25, strata: 0, strataScale: 2.6 },
      // (the ground kit lays its middle grain and its streaks straight down from above, which pulls them out along
      // every steep bank; those two are switched off here and the island's own detail, laid in metres on each face
      // by that face's own lie, takes their place: see THE GROUND'S DETAIL below)
      material: { detail: 0, varnish: 0, streaks: 0 },
    }, ctx.yield, 18);
    scene.add(terrain.object);
    await ctx.yield();
    // WHERE THE SUN REACHES, BY PLACE. The ground's own long shade (the ridges', the peak's over the basin) is the
    // ground kit's map. The shade of every thing that stands within some 110 m of the line from the beach to the sill
    // is laid once on a plane across the sun's rays (the part's sun map): great plants, palms, tree ferns, shrubs and
    // saplings, stones, fallen trunks, great roots and root curtains, the Works' blocks, and the small things too:
    // kerbs, cowls, pots, lamps. A crown's shade is broken, with gaps of sky; a trunk's and concrete's is whole. Every
    // lit material reads both, so shade falls along the rays on ground, slab, stair, court, walls, trunks and crowns
    // alike, and is the same from every side.
    const hold = [], HA = L.hatch, HE = P.HEART, HEf = P.onBearing(HE.face);
    for (let s = 0; s <= P.LINE_METRES; s += 6) { const q = P.lineAt(s); if (q[1] > 530) break; const b = P.onBearing(q[2] + 90);
      for (const off of [-110, 0, 110]) { const e = q[0] + b[0] * off, n = q[1] + b[1] * off, g = Math.max(0, P.groundAt(e, n)); hold.push([e, g - 2, -n], [e, g + 36, -n]); } }
    const sunMap = P.makeSunMap([sunDir.x, sunDir.y, sunDir.z], hold, 0.3, 0.12);
    await ctx.yield();
    {
      let k = 0; const tick = async (w) => { k += w; if (k >= 150) { k = 0; await ctx.yield(); } };
      for (const b of P.worksBlocks()) if (!/lit core/.test(b.k)) sunMap.block(b);
      // (the earth that the sunken stair, court, yard and room are cut into, west of their west walls: whole shade)
      { const C = P.K.COURT, M = P.K.ROOM, St = P.K.STAIR; sunMap.block({ e: C.e0 - 5, n: (St.n0 + C.n1) / 2, y0: P.K.FLOOR - 0.5, y1: P.K.LIP - 0.05, hl: (C.n1 - St.n0) / 2, hd: 4.6, brg: 0 });
        sunMap.block({ e: M.e0 - 5, n: (C.n1 + M.n1) / 2, y0: P.K.FLOOR - 0.5, y1: P.K.LIP - 0.05, hl: (M.n1 - C.n1) / 2 + 1, hd: 4.6, brg: 0 }); }
      for (const c of BAN.crown) sunMap.disc(c[0], c[1], -c[2], c[3] * 1.1, 0.7, 0.55);
      sunMap.seg([P.BANYAN.e, P.K.LIP - 0.5, -P.BANYAN.n, 2.3], [P.BANYAN.e, P.K.LIP + 11, -P.BANYAN.n, 1.5]);
      for (const c of L.cowls) if (!c.gone) sunMap.seg([c.e, c.y - 0.4, -c.n, 0.3], [c.e, c.y + c.h, -c.n, 0.3]);
      for (const r of L.pots) for (const q of r.pots) sunMap.seg([q[0], q[2], -q[1], 0.2 * q[3]], [q[0], q[2] + 0.5 * q[3], -q[1], 0.24 * q[3]]);
      for (const l of L.lamps) { const q = P.lampPoint(l); sunMap.seg([q[0], q[1], -q[2], 0.13], [l.e, l.y + 0.2 + (l.drop || 0), -l.n, 0.05]); }
      await ctx.yield();
      // (which of a plant's leaf masses are drawn: all of them within 46 m of the line; beyond, three or five, its
      // kind's own number: those cast the shade)
      for (const t of L.trees) { const dl = P.nearLine(t.e, t.n)[0]; t.tier = dl < 26 ? 0 : dl < 46 ? 1 : 2; t.drawn = t.tier < 2 ? t.clumps : t.clumps.slice(0, P.farMasses(t.clumps.length, P.TREE_KINDS[t.kind].far));
        if (!sunMap.holds(t.e, t.y + t.H * 0.5, -t.n, -45)) continue;
        const top = P.trunkTop(t); sunMap.seg([t.e, t.y - 0.5, -t.n, t.thick + 0.1], [top[0], top[1], -top[2], t.thick * 0.6]);
        if (t.kind === 0 || t.kind === 3) sunMap.seg([t.e, t.y - 0.5, -t.n, 2.4 * t.thick], [t.e, t.y + 3.2, -t.n, 1.2 * t.thick]);
        for (const c of t.drawn) sunMap.disc(c.e, c.y, -c.n, c.r * 1.14, 0.6, Math.max(0.36, c.flat)); await tick(1 + t.drawn.length); }
      for (const q of L.palms) { const b = P.onBearing(q.brg), sl = Math.sin(q.lean * Math.PI / 180) * 0.85 * q.H, cl = Math.cos(q.lean * Math.PI / 180) * 0.85 * q.H;
        sunMap.seg([q.e, q.y - 0.3, -q.n, 0.34], [q.e + b[0] * sl, q.y + cl, -(q.n + b[1] * sl), 0.22]); sunMap.disc(q.e + b[0] * sl, q.y + cl, -(q.n + b[1] * sl), 0.4 * q.H, 0.9); await tick(3); }
      for (const f of L.ferns) { sunMap.seg([f.e, f.y - 0.2, -f.n, 0.16], [f.e, f.y + 0.85 * f.H, -f.n, 0.12]); sunMap.disc(f.e, f.y + 0.88 * f.H, -f.n, 0.4 * f.H, 0.8); await tick(2); }
      for (const u of L.under) if (u.kind > 2) { sunMap.disc(u.e, u.y + 0.62 * u.H, -u.n, (u.kind === 3 ? 0.42 : 0.26) * u.H, 0.7, 0.9); await tick(1); }
      for (const q of L.stones) sunMap.seg([q[0], q[2], -q[1], 0.5 * q[3]], [q[0], q[2] + 0.45 * q[3] * q[5], -q[1], 0.3 * q[3]]);
      for (const f of L.fallen) sunMap.seg([f.a[0], f.a[1], -f.a[2], f.r], [f.b[0], f.b[1], -f.b[2], f.r * 0.8]);
      await ctx.yield();
      for (const r of [...L.roots.strands, ...L.sroots]) { for (let i = 0; i + 1 < r.pts.length; i++) { const a = r.pts[i], b = r.pts[i + 1]; sunMap.seg([a[0], a[1], -a[2], r.r], [b[0], b[1], -b[2], r.r]); } await tick(2); }
      for (const c of L.roots.curtains) sunMap.seg([c.e, c.y, -c.n, Math.max(0.06, c.r)], [c.e, c.y - c.len, -c.n, 0.05]);
      for (const v of L.lianas) if (v.fig) sunMap.seg([v.e, v.y, -v.n, v.r], [v.e, v.y - v.len, -v.n, v.r]);
      // (the wreck on the beach: its tube, its wing stub and its engine pod lay their own shade on the sand)
      { const t = L.wreck.tube, w = L.wreck.wing, q = L.wreck.pod, wb = P.onBearing(w.brg), cr = Math.cos(w.rise * Math.PI / 180) * w.span, pb = P.onBearing(q.brg);
        sunMap.seg([t.a[0], t.a[1], -t.a[2], t.r * 0.95], [t.b[0], t.b[1], -t.b[2], t.r * 0.95]); sunMap.seg([w.e, w.y, -w.n, 1.7], [w.e + wb[0] * cr, w.y + Math.sin(w.rise * Math.PI / 180) * w.span, -(w.n + wb[1] * cr), 1.0]);
        sunMap.seg([q.e - pb[0] * 1.5, q.y, -(q.n - pb[1] * 1.5), q.r], [q.e + pb[0] * 1.5, q.y, -(q.n + pb[1] * 1.5), q.r]); }
    }
    const SU = { uSunMap: { value: sunMap.texture() }, uSunTerr: { value: terrain.shadeMap }, uSunBox: { value: new THREE.Vector4(...sunMap.box) }, uSunDep: { value: new THREE.Vector4(...sunMap.dep) }, uSunTerrBox: { value: terrain.shadeBox.clone() },
      uSunAx: { value: new THREE.Vector3(...sunMap.ax) }, uSunAy: { value: new THREE.Vector3(...sunMap.ay) }, uSunSd: { value: sunDir.clone() }, uSunTime: U.time, uSunCloud: cloudU,
      // (the hatch's pale light on what stands round its shaft, by place: its glass's place and its strength)
      uHatch: { value: new THREE.Vector4(HA.e, HA.y + 0.34, -HA.n, 5.0) }, uHatchC: { value: new THREE.Color(0.72, 0.95, 0.9) },
      // (the heart's gold on the meadow, the water, the rock and the crowns before its mouth, by place: the middle of
      // the mouth a pace out from its face, its strength; the way it looks out)
      uHeart: { value: new THREE.Vector4(HE.e + HEf[0], HE.y + 2.2, -(HE.n + HEf[1]), 8.5) }, uHeartC: { value: new THREE.Color(1.0, 0.52, 0.1) }, uHeartF: { value: new THREE.Vector2(HEf[0], -HEf[1]) } };
    P.underSun(terrain.object.material, SU, 'ground');
    // the same shade for the things that are placed by hand of the plan (1 in the sun, 0 in whole shade)
    const shadeOut = {}, sunAt = (x, y, z) => { terrain.shadeAt(x, z, shadeOut); return Math.min(smoothstep(-0.6, 0.9, y - shadeOut.top), 1 - sunMap.shadeAt(x, y, z)); };
    await ctx.yield();

    // THE WATER'S LIGHT ON THINGS, BY PLACE: within some 12 m of a rift the basin's ground, rock and plants take the
    // water's pale aqua on the side that looks toward it, fading with the distance; each takes its own rift's slow
    // swing (period 7 to 12 s and phase, dealt: 'springs'), the Springhead's steady light where that is nearest.
    const riftPh = []; for (let i = 0; i < 5; i++) riftPh.push(new THREE.Vector2(Math.PI * 2 / S.springs.range(7, 12), S.springs.range(0, Math.PI * 2))); riftPh.push(new THREE.Vector2(0, 0), new THREE.Vector2(0, 0));
    const WAT = { uWatT: U.time, uWatPh: { value: riftPh }, uWatC: { value: new THREE.Color(0.14, 0.6, 0.47) } };
    // (a thing built vertex by vertex carries aWat: strength, rift; an instanced plant carries one aWat for the whole
    // of it: the way to the water (x, z), strength, rift)
    const underWater = (mat, key, inst) => { const prev = mat.onBeforeCompile, pk = mat.customProgramCacheKey ? mat.customProgramCacheKey.bind(mat) : () => '';
      mat.onBeforeCompile = (sh, r) => { if (prev) prev.call(mat, sh, r); Object.assign(sh.uniforms, WAT);
        sh.vertexShader = 'attribute ' + (inst ? 'vec4' : 'vec2') + ' aWat;\nuniform float uWatT;\nuniform vec2 uWatPh[7];\nvarying float vWat;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n  { vec2 wph = uWatPh[int(clamp(' + (inst ? 'aWat.w' : 'aWat.y') + ', 0.0, 6.0) + 0.5)];\n    vWat = '
          + (inst ? 'aWat.z * clamp(0.5 + 0.5 * dot(normalize(mat3(instanceMatrix) * normal).xz, aWat.xy) - 0.3 * normal.y, 0.12, 1.0)' : 'aWat.x') + ' * (1.0 + 0.16 * sin(uWatT * wph.x + wph.y)); }');
        sh.fragmentShader = 'uniform vec3 uWatC;\nvarying float vWat;\n' + sh.fragmentShader.replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n  totalEmissiveRadiance += uWatC * diffuseColor.rgb * vWat;'); };
      mat.customProgramCacheKey = () => pk() + '|water:' + key; mat.needsUpdate = true; };
    // how much of it reaches a place on the meadow, and from which water: [strength, rift, the way to the water (x, z)]
    const watOut = [0, 0, 0, 0], waterAt = (e, n) => { const r = P.riftAt(e, n); watOut[0] = r[0] > 12.5 ? 0 : P.waterLightAt(e, n) * Math.pow(smoothstep(12.5, 0.4, Math.max(0, r[0])), 1.6); watOut[1] = r[1];
      if (watOut[0] > 0) { const d = 1.5, gx = P.riftAt(e + d, n)[0] - P.riftAt(e - d, n)[0], gn = P.riftAt(e, n + d)[0] - P.riftAt(e, n - d)[0], gl = Math.hypot(gx, gn) || 1; watOut[2] = -gx / gl; watOut[3] = gn / gl; } return watOut; };

    // A SOFT SHADE AT THE FOOT OF EVERY BODY, BY PLACE: the ground is darker (toward blue-green) close under a trunk,
    // a palm, a fern, a shrub, a stone, a fallen trunk and behind a rift's lip, in the sun's part of the island and in
    // the basin alike. Each body: [e, n, reach, depth], kept in 4 m cells.
    const footCells = new Map(), foot = (e, n, r, k) => { for (let i = Math.floor((e - r) / 4); i <= Math.floor((e + r) / 4); i++) for (let j = Math.floor((n - r) / 4); j <= Math.floor((n + r) / 4); j++) { const key = i * 4096 + j; let c = footCells.get(key); if (!c) footCells.set(key, c = []); c.push(e, n, r, k); } };
    for (const t of L.trees) foot(t.e, t.n, t.kind === 0 || t.kind === 3 ? 3.4 * t.thick + 1 : 2.2 * t.thick + 1, 0.5);
    for (const q of L.palms) foot(q.e, q.n, 1.5, 0.35); for (const f of L.ferns) foot(f.e, f.n, 1.9, 0.42);
    for (const u of L.under) foot(u.e, u.n, u.kind < 3 ? 0.6 * u.H + 0.35 : 0.4 * u.H + 0.5, u.kind < 3 ? 0.28 : 0.4);
    for (const q of L.stones) foot(q[0], q[1], 0.9 * q[3] + 0.3, 0.5);
    for (const f of L.fallen) for (let k = 0; k <= 6; k++) foot(lerp(f.a[0], f.b[0], k / 6), lerp(f.a[2], f.b[2], k / 6), 2.4 * f.r + 0.4, 0.5);
    for (const strip of L.lips) strip.run.forEach((q, i) => { if (!q.gap && i % 2 === 0) foot(q.e + q.nx * (q.w + 0.7), q.n + q.nn * (q.w + 0.7), 1.3 + 0.5 * q.h, 0.25 + 0.2 * q.h); });
    const footAt = (e, n) => { const c = footCells.get(Math.floor(e / 4) * 4096 + Math.floor(n / 4)); if (!c) return 0; let keep = 1; for (let i = 0; i < c.length; i += 4) { const d = Math.hypot(c[i] - e, c[i + 1] - n); if (d < c[i + 2]) keep *= 1 - c[i + 3] * smoothstep(c[i + 2], 0.3 * c[i + 2], d); } return 1 - keep; };
    await ctx.yield();

    const GROUND_DETAIL_GLSL = /* glsl */`
      { vec3 gw = vTWorld; vec3 gn = normalize(vTNormal); vec3 ga = abs(gn); ga *= ga; ga *= ga; ga /= (ga.x + ga.y + ga.z);
        float steepK = smoothstep(0.8, 0.5, gn.y), flatK2 = 1.0 - steepK;
        vec3 pm = gw / 6.3;
        vec4 mx = texture2D(tDetail, pm.zy), my = texture2D(tDetail, pm.xz), mz = texture2D(tDetail, pm.xy);
        vec4 tm = mx * ga.x + my * ga.y + mz * ga.z;
        vec3 pf = gw / 1.13 + 0.37;
        vec4 tf = texture2D(tDetail, pf.zy) * ga.x + texture2D(tDetail, pf.xz) * ga.y + texture2D(tDetail, pf.xy) * ga.z;
        vec3 pc = gw / 2.3 + tm.r * 0.08;
        vec4 tc = texture2D(tCell, pc.zy) * ga.x + texture2D(tCell, pc.xz) * ga.y + texture2D(tCell, pc.xy) * ga.z;
        float sandK = clamp(vKind.x, 0.0, 1.0) * flatK2, pebK = clamp(vKind.y, 0.0, 1.0), meadK = clamp(vKind.z, 0.0, 1.0) * flatK2;
        float forK = clamp(1.0 - vKind.x - vKind.y - vKind.z, 0.0, 1.0) * flatK2;
        float fp = sqrt(length(dFdx(gw)) * length(dFdy(gw)));
        vec3 c = diffuseColor.rgb;
        float fineK = 1.0 - smoothstep(0.06, 0.3, fp), midK = 1.0 - smoothstep(0.4, 1.8, fp);
        c *= 1.0 + 0.27 * (1.0 - 0.8 * sandK) * ((tm.r - 0.5) * 0.9 * midK + (tf.r - 0.5) * 0.9 * fineK);
        vec3 pb = gw / 37.0 + 0.11; float bedN = (texture2D(tDetail, pb.zy) * ga.x + texture2D(tDetail, pb.xz) * ga.y + texture2D(tDetail, pb.xy) * ga.z).r;
                float crk = 1.0 - smoothstep(0.0, 0.09, tc.a);
        float highK = steepK * smoothstep(34.0, 60.0, gw.y);
        c *= 1.0 + steepK * (0.14 * (bedN - 0.5) - 0.3 * crk * fineK);
        c *= mix(vec3(1.0), vec3(1.14, 1.04, 0.84), highK * smoothstep(50.0, 120.0, gw.y));
        vec2 wdir = vec2(0.866, 0.5), wdir2 = vec2(0.94, 0.34);
        float rp = dot(gw.xz, wdir) * 57.0 + tm.r * 10.0 + tf.r * 1.6, rp2 = dot(gw.xz, wdir2) * 7.4 + tm.r * 7.0;
        float ra = sandK * smoothstep(1.7, 0.5, fwidth(rp)), ra2 = sandK * smoothstep(1.4, 0.4, fwidth(rp2));
        c *= 1.0 + 0.02 * ra * sin(rp) + 0.03 * ra2 * sin(rp2);
        c = mix(c, c * 0.8, sandK * smoothstep(0.62, 0.7, tc.r) * 0.3);
        float leafK = forK * smoothstep(0.12, 0.3, tc.r);
        c = mix(c, c * mix(vec3(1.45, 1.1, 0.62), vec3(0.68, 0.6, 0.5), step(0.5, tf.r + (tm.r - 0.5))), leafK * 0.3 * (0.4 + 0.6 * fineK));
        c *= 1.0 - 0.25 * forK * crk * fineK;
        c = mix(c, c * vec3(1.22, 1.28, 0.86), meadK * smoothstep(0.15, 0.45, tc.r) * 0.3);
        c *= 1.0 + meadK * 0.2 * (tf.r - 0.5) * fineK;
        c = mix(c, vec3(dot(c, vec3(0.3, 0.55, 0.15))) * vec3(1.0, 1.03, 0.88), meadK * 0.5);
        float peb = pebK * smoothstep(0.1, 0.3, tc.r);
        c = mix(c, mix(c, vec3(0.5, 0.5, 0.45), 0.6) * (0.7 + 0.6 * tc.r), peb);
        diffuseColor.rgb = c;
        gTGrad += (ga.x * vec3(0.0, mx.b - 0.5, mx.g - 0.5) + ga.y * vec3(my.g - 0.5, 0.0, my.b - 0.5) + ga.z * vec3(mz.g - 0.5, mz.b - 0.5, 0.0)) * (0.45 - 0.35 * sandK) * midK;
        gTGrad += vec3(wdir.x, 0.0, wdir.y) * (cos(rp) * ra * 0.06) + vec3(wdir2.x, 0.0, wdir2.y) * (cos(rp2) * ra2 * 0.08);
        gTGrad += ga.y * vec3(tc.g - 0.5, 0.0, tc.b - 0.5) * (1.0 * (peb + 0.5 * leafK)) * fineK; }`;
    // THE GROUND'S COLOURS BY PLACE (laid on after the mesh is made, in short steps): sea bed and reef, sand, the
    // forest's floor (earth, leaf litter, moss), the far slopes as the forest's roof, rock, the stream's stones, the
    // meadow's sedge ground, the rifts' pale limestone and beds; the soft shade at every body's foot; the lamps' warm
    // pools (from every lamp, lit opening and kerb face, each pool dipping and wavering with its lamp) and the
    // water's light near the rifts.
    const lightPts = P.lightPoints(L);
    {
      const g = terrain.geometry, pos = g.attributes.position.array, nor = g.attributes.normal.array, col = g.attributes.color.array, nv = pos.length / 3;
      const c = new THREE.Color(), k = new THREE.Color(), cSand = C3(PAL.sand), cWet = C3('#d6c8a4'), cBed = C3('#eadfc2'), cReef = C3('#a9b99a'), cFloor = C3('#7c8a66'), cMoss = C3('#86a066'), cLitter = C3('#b09a66'), cEarth = C3('#6e6650'),
        cCanLo = C3('#5f8c64'), cCanHi = C3('#a8bc78'), cRock = C3('#b6baa8'), cSedge = C3('#86a850'), cSedge2 = C3('#5f8c3c'), cLip = C3(PAL.lip), cRift = C3('#7f9a8c'), cPeb = C3('#bcb8a2'), cDark = C3('#56665a'), cCliff = C3('#a6a08a'), cCliff2 = C3('#74796a'), cWall = C3('#33503e'), cWall2 = C3('#4f6652'), cBankS = C3('#8f7f5c'), cBankW = C3('#5c5544');
      const B = P.K.BASIN, lampG = new Float32Array(nv * 4), wat = new Float32Array(nv * 2), kind = new Float32Array(nv * 3);
      // (the loop rests by the work done: a corner of the basin's floor weighs as eight plain corners)
      let spent = 0;
      for (let i = 0; i < nv; i++) {
        const x = pos[i * 3], h = pos[i * 3 + 1], z = pos[i * 3 + 2], e = x, n = -z, ny = nor[i * 3 + 1], sd = P.shoreDist(e, n);
        const f1 = noise.fbm2(e * 0.035, n * 0.035, 3), f2 = noise.n2(e * 0.21, n * 0.21);
        if (sd < 1.5 && h < 0.3) { kind[i * 3] = 1; c.copy(cBed).lerp(cReef, smoothstep(-1.5, -0.4, h) * smoothstep(38, 46, -sd) * (1 - smoothstep(70, 80, -sd)) * (0.6 + 0.4 * f2)); }
        else {
          // (the basin's walls, from the meadow's edge up to the crest, are forest roof too wherever they stand more
          // than some 40 m from the line: the way out stands against a wall in its own shade)
          const dl = sd > 60 ? P.nearLine(e, n)[0] : 0, rho = Math.hypot((e - B.e) / B.re, (n - B.n) / B.rn), far = Math.max(smoothstep(55, 120, dl), smoothstep(1.0, 1.12, rho) * smoothstep(24, 48, dl) * smoothstep(470, 500, n));
          const f3 = noise.n2(e * 0.63 + 9, n * 0.63 - 4);
          c.copy(cFloor).lerp(cMoss, clamp(0.5 + 0.9 * f1, 0, 1)).lerp(cEarth, 0.5 * smoothstep(0.1, 0.5, f3)).lerp(cLitter, 0.55 * smoothstep(-0.05, 0.4, f2 - 0.4 * f3));
          // the far slopes are the forest's roof: gold-green where the low sun reaches a crest, dark blue-green in the
          // ridges' own shade (the basin's north wall behind the way out is such a place)
          k.copy(cCanLo).lerp(cCanHi, clamp(0.5 + 0.8 * f1 + 0.3 * f2, 0, 1)); c.lerp(k, far);
          c.lerp(cRock, (1 - far * 0.8) * smoothstep(0.74, 0.56, ny));
          const sandW = (1 - smoothstep(24, 40, sd + 6 * f1)) * (1 - smoothstep(7, 12, h)); kind[i * 3] = sandW;
          c.lerp(k.copy(cSand).lerp(cWet, smoothstep(2.2, 0.2, h)), sandW);
          if (n > 90 && n < 505 && Math.abs(e - 10) < 34) { const s = P.streamAt(e, n); if (s[0] < 4.5) { kind[i * 3 + 1] = smoothstep(4.5, 2.2, s[0]); c.lerp(n > 398 && n < 450 ? cDark : cPeb, smoothstep(4.5, 2.2, s[0]) * 0.85); c.lerp(cDark, smoothstep(2.4, 1.0, s[0]) * 0.5); } }
          if (rho < 1.1) {
            spent += 7;
            const m = (1 - smoothstep(0.86, 1.06, rho)) * smoothstep(21.2, 21.8, h + 0.6);
            c.lerp(k.copy(cSedge).lerp(cSedge2, clamp(0.5 + f1, 0, 1)), m); kind[i * 3 + 2] = m;
            // (only the meadow's own floor: none of it climbs the basin's wall)
            const w = waterAt(e, n), rr = P.riftAt(e, n), r = rr[0], flat = w[0] > 0 || r < 3.6 ? (1 - smoothstep(22.3, 23.0, h)) * (rho < 0.7 ? 1 : 1 - smoothstep(22.6, 23.6, Math.max(P.groundAt(e + 10, n), P.groundAt(e - 10, n), P.groundAt(e, n + 10), P.groundAt(e, n - 10)))) : 0;
            // (a fissure's edge is the pale limestone; a running stream's bank is sand, dark and wet at the water)
            if (r < 3.6) { c.lerp(rr[1] > 5 ? k.copy(cBankS).lerp(cBankW, smoothstep(1.7, 0.3, r)) : cLip, flat * smoothstep(3.6, 1.4, r) * (0.75 + 0.25 * f2));
              if (rr[1] > 5) { const sb = flat * smoothstep(3.6, 1.4, r); kind[i * 3] = sb; kind[i * 3 + 2] *= 1 - sb; } if (r < 0) c.lerp(cRift, smoothstep(0, -0.8, r)); }
            wat[i * 2] = flat * w[0] * 0.5 * (r < 0 ? 1.5 : 1); wat[i * 2 + 1] = w[1];
          }
          // the basin's walls are dark forest and rock in the peak's shade (the way out stands against them)
          // (rock shows on their steep faces, pale limestone in beds, darker in the hollow under each ledge; the
          // ledges are green)
          if (rho > 0.84 && rho < 1.6 && n > 470) { const wl = smoothstep(0.86, 1.0, rho) * (1 - smoothstep(1.4, 1.6, rho)) * smoothstep(22.6, 25, h), steep = smoothstep(0.84, 0.6, ny);
            c.lerp(k.copy(cWall).lerp(cWall2, clamp(0.5 + f2, 0, 1)), wl * 0.8 * (1 - steep));
            c.lerp(k.copy(cCliff).lerp(cCliff2, clamp(0.5 + 0.9 * f1, 0, 1)), wl * steep * 0.92);
            const an = Math.atan2(e - B.e, n - B.n), ph = (h - 22) / (11 + 2.5 * Math.sin(an * 3 + 1)) * 6.2832 + 2.2 * Math.sin(an * 5 + 0.6), hollow = smoothstep(0.1, 0.9, Math.cos(ph)) * steep * wl;
            c.multiplyScalar(1 - 0.42 * hollow); }
          { const dh = Math.hypot(e - HA.e, n - HA.n); if (dh < 5.6) c.lerp(k.setRGB(0.4, 0.23, 0.12), (1 - smoothstep(3.6, 5.4, dh)) * (0.8 + 0.2 * f2)); }
          const a = footAt(e, n); if (a > 0) { c.r *= 1 - 0.62 * a; c.g *= 1 - 0.5 * a; c.b *= 1 - 0.44 * a; }
        }
        // a lamp's pool lays its warm light on the ground for three to six metres about it, by place (light added to
        // the ground's own, so that it reads in shade; it dips and wavers with its lamp)
        if (n > 128 && n < 462 && e > -44 && e < 36) { const q = P.lampLightAt(lightPts, x, h, z, 0, 1, 0); if (q) { lampG[i * 4] = q[0]; lampG[i * 4 + 1] = q[1]; lampG[i * 4 + 2] = q[2]; lampG[i * 4 + 3] = q[3]; } }
        col[i * 3] = Math.min(1, c.r); col[i * 3 + 1] = Math.min(1, c.g); col[i * 3 + 2] = Math.min(1, c.b);
        if (++spent >= 13500) { spent = 0; await ctx.yield(); }
      }
      g.attributes.color.needsUpdate = true; g.setAttribute('aLampG', new THREE.BufferAttribute(lampG, 4)); g.setAttribute('aWat', new THREE.BufferAttribute(wat, 2));
      P.underLamps(terrain.object.material, U, 'ground'); underWater(terrain.object.material, 'ground', false);
      // THE GROUND'S DETAIL, IN THE WORLD'S OWN METRES ON EVERY FACE (the whole island: sand, banks, the gully's floor,
      // rock, the meadow). Each layer is laid three ways (down each of the world's axes) and each face takes the
      // lay that lies flattest on it, by its own lie: nothing is pulled out along a steep bank. A grain of some
      // half a metre and one of a few centimetres on everything; on sand, ripples a hand wide across the wind and
      // broader ones under them; on the forest's floor, fallen leaves and fine roots; among the stream's stones,
      // pebbles; on the meadow, the grass's own mottle; on steep rock, thin beds lying level and the joints between
      // blocks. The textures' own filtering keeps it crisp near and soft far.
      g.setAttribute('aKind', new THREE.BufferAttribute(kind, 3));
      { const mat = terrain.object.material, prev = mat.onBeforeCompile, pk = mat.customProgramCacheKey ? mat.customProgramCacheKey.bind(mat) : () => '';
        mat.onBeforeCompile = (sh, r) => { if (prev) prev.call(mat, sh, r); const F = sh.fragmentShader;
          if (!['vTWorld', 'vTNormal', 'tDetail', 'tCell', 'gTGrad', '#include <roughnessmap_fragment>'].every((k) => F.includes(k)) || !sh.vertexShader.includes('#include <begin_vertex>')) return;
          sh.vertexShader = 'attribute vec3 aKind;\nvarying vec3 vKind;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n  vKind = aKind;');
          sh.fragmentShader = 'varying vec3 vKind;\n' + sh.fragmentShader.replace('#include <roughnessmap_fragment>', GROUND_DETAIL_GLSL + '\n#include <roughnessmap_fragment>'); };
        mat.customProgramCacheKey = () => pk() + '|metres'; mat.needsUpdate = true; }
    }
    // (no rest here: this step and the next are short, and one frame holds both)

    // ---------- THE WORKS (the part): concrete, openings, fittings, lamps ----------
    const hero = await P.buildHero(ctx, { seed, uniforms: U, sun: SU, plan: L });
    scene.add(hero.object);
    await ctx.yield();

    // ---------- the sea: swell over the reef, the lagoon, the wash on the beach ----------
    const depthAt = (x, z) => -P.groundAt(x, -z), depthRect = [-440, -420, 440, 420], depthRes = 128;
    const depthData = await Water.oceanDepthAsync({ depthAt, depthRect, depthRes }, ctx.yield, 16);
    const ocean = Water.makeOcean({
      rng: S.sea, light: sky, preset: 'breeze', detail: 0.85, roughness: 0.02, glitter: 1.9, height: windy ? 0.62 : 0.42, level: 0, radius: 7000, rings: 76, segments: 112, foam: windy ? 0.4 : 0.22,
      deep: PAL.deep, scatter: PAL.lagoon, shallowColor: PAL.lagoon, foamColor: PAL.surf, windAngle: Math.atan2(-1, 0.22), sunColor: '#ffc474', sunIntensity: 7.5, skyHorizon: '#f0a060', mid: '#5d7fa6', skyZenith: '#2c4590',
      depthAt, depthRect, depthRes, depthData, shoalDepth: 1.6, shoalWidth: 9,
    });
    scene.add(ocean.object);
    // (no rest here: this step and the next are short, and one frame holds both)

    // WHAT THE WORLD'S OWN SMALL SHADERS SHARE: a value noise, and the light at a place (the sky's fill, and the
    // sun's gold wherever the sun map says the sun reaches it)
    const NOISE_GLSL = /* glsl */`
      float wH(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float wN(vec2 p) { vec2 i = floor(p); vec2 f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(wH(i), wH(i + vec2(1.0, 0.0)), f.x), mix(wH(i + vec2(0.0, 1.0)), wH(i + vec2(1.0, 1.0)), f.x), f.y); }`;
    const LIT = { ...SU, uAmbC: { value: C3('#7fbfe6').multiplyScalar(1.36 / Math.PI) }, uSunC: { value: C3('#ffab48').multiplyScalar(6.6 / Math.PI) } };
    const LIT_GLSL = P.SUN_GLSL + /* glsl */`
      uniform vec3 uAmbC; uniform vec3 uSunC;
      vec3 wLit(vec3 w) { return uAmbC + uSunC * lurSun(w, 1.0).x; }`;

    // ---------- the one stream: clear running water from the main rift down five stepped falls to the sea ----------
    // A rill out of the meadow, the cascades' stretch, a brook past the Works: clear water over a pebble bed, dark
    // green where it is deep, white only where it breaks. At each of the five chutes (found on the bed) the water
    // goes over a lip in a white veil with dark gaps, into a churned pool with spray rising from it ('spray').
    const V3 = (p) => new THREE.Vector3(p[0], p[1], p[2]);
    // (under the forest the stream mirrors the crowns over it, dark green, and the sky only between them; the sun's
    // gold glints on it wherever the sun reaches)
    const FOREST_SKY = { skyHorizon: '#a8807c', mid: '#b08aa6', skyZenith: '#8088c8', clouds: false, sunColor: '#ffe2b0', sunIntensity: 1.9, scatter: 0.25 };
    const rill = Water.makeRiver({ rng: S.rill, light: sky, points: P.streamPoints(446, 501, 3).reverse().map(V3), width: 2.6, speed: 1.4, foam: 0.42, bankFoam: 0.55, bankFade: 0.4, opacity: 0.86, deep: '#33625f', shallow: '#86c0b0', ...FOREST_SKY });
    const falls = Water.makeRiver({ rng: S.falls, light: sky, points: P.streamPoints(399, 447, 0.8, 0.12).reverse().map(V3), width: 3.6, speed: 3.4, foam: 0.5, bankFoam: 0.5, bankFade: 0.5, ripple: 1.7, opacity: 0.84, deep: '#0f3a36', shallow: '#3a8a76', ...FOREST_SKY });
    const brook = Water.makeRiver({ rng: S.brook, light: sky, points: P.streamPoints(96, 400, 3).reverse().map(V3), width: (t) => 4.6 + 1.2 * Math.sin(t * 23), speed: 2.1, foam: 0.3, bankFoam: 0.45, bankFade: 0.5, ripple: 2.2, opacity: 0.8, deep: '#1c4a48', shallow: '#4f9c8a', ...FOREST_SKY });
    scene.add(rill.object, falls.object, brook.object);
    {
      const vp = [], va = [], vi = [];
      const vv = (e, y, n, a, b, c, d) => { vp.push(e, y, -n); va.push(a, b, c, d); return vp.length / 3 - 1; };
      P.CHUTES.forEach((c) => { const [nf, nl] = c, ph = (L.spray.find((q) => q.chute === nf) || { ph: 0 }).ph; let prev = null, run = 0, last = null;
        // the veil: from half a metre above the lip down the chute to its foot, the stream's breadth
        for (let k = 0; k <= 9; k++) { const n = lerp(nl + 0.5, nf - 0.3, k / 9), e = P.streamE(n), de = P.streamE(n + 0.3) - P.streamE(n - 0.3), dl = Math.hypot(de, 0.6), px = 0.6 / dl, pn = -de / dl, y = P.cascadeBed(n) + 0.17;
          if (last) run += Math.hypot(e - last[0], y - last[1], n - last[2]); last = [e, y, n];
          const row = [-1, -0.5, 0, 0.5, 1].map((u) => vv(e + px * u * 1.75, y - 0.05 * Math.abs(u), n + pn * u * 1.75, u, run, 0, ph));
          if (prev) for (let q = 0; q < 4; q++) vi.push(prev[q], row[q], row[q + 1], prev[q], row[q + 1], prev[q + 1]);
          prev = row; }
        // the churned pool at its foot
        const pn0 = nf - 1.7, pe0 = P.streamE(pn0), py = c[2] + 0.2, ctr = vv(pe0, py, pn0, 0, 0, 1, ph);
        for (let k = 0; k < 12; k++) { const a = k / 12 * Math.PI * 2; vv(pe0 + Math.cos(a) * 2.2, py, pn0 + Math.sin(a) * 2.7, 1, 0, 1, ph); }
        for (let k = 0; k < 12; k++) vi.push(ctr, ctr + 1 + k, ctr + 1 + (k + 1) % 12); });
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(vp, 3)); g.setAttribute('aV', new THREE.Float32BufferAttribute(va, 4)); g.setIndex(vi); g.computeBoundingSphere();
      const m = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, side: THREE.DoubleSide, uniforms: { ...LIT, uTime: U.time },
        vertexShader: /* glsl */`attribute vec4 aV; varying vec4 vV; varying vec3 vP; void main() { vV = aV; vec4 wp = modelMatrix * vec4(position, 1.0); vP = wp.xyz; gl_Position = projectionMatrix * viewMatrix * wp; }`,
        fragmentShader: NOISE_GLSL + LIT_GLSL + /* glsl */`uniform float uTime; varying vec4 vV; varying vec3 vP;
          void main() { float a;
            if (vV.z < 0.5) { float s = 0.6 * wN(vec2(vV.x * 4.5 + vV.w * 13.0, vV.y * 0.8 - uTime * 2.4)) + 0.4 * wN(vec2(vV.x * 10.0 - vV.w * 7.0, vV.y * 1.9 - uTime * 3.4));
              a = smoothstep(0.36, 0.6, s + 0.1 * vV.y) * (1.0 - smoothstep(0.72, 1.0, abs(vV.x))) * smoothstep(0.3, 1.0, vV.y); }
            else { float s = 0.6 * wN(vP.xz * 1.6 + vec2(uTime * 0.5, -uTime * 0.8)) + 0.4 * wN(vP.xz * 3.7 - vec2(uTime * 0.9, uTime * 0.4));
              a = smoothstep(0.3, 0.62, s + 0.42 * (1.0 - vV.x)) * (1.0 - smoothstep(0.55, 1.0, vV.x)); }
            gl_FragColor = vec4(vec3(0.92, 0.96, 0.95) * wLit(vP), clamp(a, 0.0, 1.0) * 0.94);
            #include <tonemapping_fragment>
            #include <colorspace_fragment>
          }` });
      const mesh = new THREE.Mesh(g, m); mesh.name = 'the cascades\' veils and pools'; mesh.renderOrder = 3; scene.add(mesh);
    }
    await ctx.yield();

    // ---------- THE BASIN'S WATER: five fissures and the Springhead, still, deep, clear and lit from below ----------
    // Its light is the water's own: warm white along a fissure's middle, where it is deepest, pale aqua toward the
    // lips; full within 60 m of the Springhead and two thirds at 150 m, by place. Each rift brightens a little along
    // its own length on its own period and phase (dealt), a small standing swing: no wave runs out of the centre. The
    // Springhead changes only by its caustics and the slow heave of its seven spring domes. Within 30 m of the way
    // out the water is held a step paler, so that the way out stands on dark.
    const ringAt = new THREE.Vector3(P.RING.e, P.RING.y, -P.RING.n);
    const domes = P.SPRINGS.map((q) => new THREE.Vector4(q[0], -q[1], q[2], S.springs.range(0, Math.PI * 2)));
    {
      const wP = [], wA = [], wI = [], wFl = new Map(), WL = P.K.WATER;
      // aW: metres along its rift, which water (0 to 4 a rift, 5 the Springhead's still margin, 6 its heaving sheet),
      // how near the middle (1 on a fissure's middle, 0 at its edge and beyond)
      const wv = (e, n, along, ri, inn, y = WL) => { wP.push(e, y, -n); wA.push(along, ri, inn); return wP.length / 3 - 1; };
      P.RIFTS.forEach((R, ri) => { let run = 0, prev = null;
        for (let i = 0; i + 1 < R.length; i++) { const a = R[i], b = R[i + 1], len = Math.hypot(b[0] - a[0], b[1] - a[1]), k = Math.ceil(len / 3), nx = (b[1] - a[1]) / len, nn = -(b[0] - a[0]) / len;
          for (let j = i ? 1 : 0; j <= k; j++) { const t = j / k, e = lerp(a[0], b[0], t), n = lerp(a[1], b[1], t), half = lerp(a[2], b[2], t) / 2, out = half + 1.1;
            // (where a rift's water runs into the Springhead it is the Springhead's water: steady, index 5)
            const rowV = [-1, -0.5, 0, 0.5, 1].map((sx) => { const ve = e + nx * out * sx, vn = n + nn * out * sx; return wv(ve, vn, run + len * t, P.springLens(ve, vn) > -0.3 ? 5 : ri, clamp(1 - Math.abs(sx) * out / half, 0, 1)); });
            if (prev) for (let q = 0; q < 4; q++) wI.push(prev[q], rowV[q], rowV[q + 1], prev[q], rowV[q + 1], prev[q + 1]);
            prev = rowV; }
          run += len; } });
      // THE TWO RUNS: flowing water (index 7 the run to the heart, down its three steps; 8 the north run from the
      // north fall's pool). No thin crack of lit water crosses the meadow: the rifts, the pool and the runs are all
      [P.HEART_RUN, P.NORTH_RUN].forEach((R, k) => { let run = 0, prev = null;
        for (let i = 0; i + 1 < R.length; i++) { const a = R[i], b = R[i + 1], len = Math.hypot(b[0] - a[0], b[1] - a[1]), kk = Math.ceil(len / 1.5), fe = (b[0] - a[0]) / len, fn = (b[1] - a[1]) / len;
          for (let j = i ? 1 : 0; j <= kk; j++) { const t = j / kk, e = lerp(a[0], b[0], t), n = lerp(a[1], b[1], t), half = lerp(a[2], b[2], t) / 2, out = half + 0.9, y = k ? WL - 0.02 : P.runWater(run + len * t);
            const rowV = [-1, -0.5, 0, 0.5, 1].map((sx) => { const id = wv(e + fn * out * sx, n - fe * out * sx, run + len * t, 7 + k, clamp(1 - Math.abs(sx) * out / half, 0, 1), y); wFl.set(id, [fe, -fn]); return id; });
            if (prev) for (let q = 0; q < 4; q++) wI.push(prev[q], rowV[q], rowV[q + 1], prev[q], rowV[q + 1], prev[q + 1]);
            prev = rowV; }
          run += len; } });
      // the Springhead's own sheet (index 6: it alone heaves over the spring domes), and its pool drawn out north
      // between its mist walls, lies three centimetres over the rifts' sheets where they meet, so that the two are
      // one water there
      const SPc = P.K.SPRING, st = 1.6, e00 = SPc.e - 26, n00 = 636, ids = new Map(), at = (i, j) => { const key = i * 1000 + j; if (!ids.has(key)) { const e = e00 + i * st, n = n00 + j * st; ids.set(key, wv(e, n, 0, 6, clamp(Math.max(P.springLens(e, n) * 2.2, (1.1 - P.riftAt(e, n)[0]) / 3), 0, 1), WL + 0.03)); } return ids.get(key); };
      for (let i = 0; i < 28; i++) for (let j = 0; j < 45; j++) { const e = e00 + (i + 0.5) * st, n = n00 + (j + 0.5) * st; if (P.springLens(e, n) < -0.14) continue; const a = at(i, j), b = at(i + 1, j), c = at(i + 1, j + 1), d = at(i, j + 1); wI.push(a, b, c, a, c, d); }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(wP, 3)); g.setAttribute('aW', new THREE.Float32BufferAttribute(wA, 3)); g.setIndex(wI);
      { const fl = new Float32Array(wP.length / 3 * 2); for (const [id, d] of wFl) { fl[id * 2] = d[0]; fl[id * 2 + 1] = d[1]; } g.setAttribute('aF', new THREE.BufferAttribute(fl, 2)); }
      g.computeBoundingSphere();
      const m = new THREE.ShaderMaterial({
        uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), uTime: U.time, uDome: { value: domes }, uPh: { value: riftPh }, uSpring: { value: new THREE.Vector2(P.K.SPRING.e, -P.K.SPRING.n) }, uRing: { value: new THREE.Vector2(ringAt.x, ringAt.z) },
          uEdgeC: { value: new THREE.Color(0.0, 0.09, 0.08) }, uMidC: { value: new THREE.Color(0.012, 0.1, 0.1) }, uCoreC: { value: new THREE.Color(0.035, 0.19, 0.18) }, uCapC: { value: new THREE.Color(0.3, 0.55, 0.5) },
          uSkyLo: { value: C3('#ff9c5c') }, uSkyHi: { value: C3('#3f58a8') }, uWallC: { value: C3('#0f2a22') }, uSteps: { value: new THREE.Vector3(...P.RUN_STEPS) }, uPools: { value: P.FALLS.map((F) => new THREE.Vector2(F.pool[0], -F.pool[1])) }, uHeart: SU.uHeart, uHeartC: SU.uHeartC, uHeartF: SU.uHeartF },
        fog: true, side: THREE.DoubleSide,
        vertexShader: /* glsl */`attribute vec3 aW; attribute vec2 aF; uniform float uTime; uniform vec4 uDome[7]; uniform vec2 uPh[7]; varying vec3 vW; varying vec3 vPos; varying float vSw; varying float vSpr; varying float vRun; varying vec2 vFl;
          #include <fog_pars_vertex>
          void main() { vec3 p = position; float dome = 0.0;
            if (aW.y > 4.5) { for (int i = 0; i < 7; i++) { vec2 d = p.xz - uDome[i].xy; dome += exp(-dot(d, d) / max(uDome[i].z * uDome[i].z, 0.01)) * (0.2 + 0.12 * sin(uTime * 2.0944 + uDome[i].w)); } }
            p.y += dome * step(5.5, aW.y); vW = vec3(aW.x, aW.z, dome); vSpr = step(4.5, aW.y); vRun = step(6.5, aW.y); vFl = aF;
            vec2 ph = uPh[int(clamp(aW.y, 0.0, 6.0) + 0.5)]; vSw = 1.0 + 0.14 * sin(uTime * ph.x + ph.y) * (0.6 + 0.4 * sin(aW.x * 0.09 + ph.y * 2.7)) * step(0.001, ph.x);
            vec4 wp = modelMatrix * vec4(p, 1.0); vPos = wp.xyz; vec4 mvPosition = viewMatrix * wp; gl_Position = projectionMatrix * mvPosition;
            #include <fog_vertex>
          }`,
        fragmentShader: NOISE_GLSL + /* glsl */`uniform float uTime; uniform vec2 uSpring, uRing; uniform vec3 uEdgeC, uMidC, uCoreC, uCapC, uSkyLo, uSkyHi, uWallC, uSteps; uniform vec2 uPools[3]; uniform vec4 uHeart; uniform vec3 uHeartC; uniform vec2 uHeartF;
          varying vec3 vW; varying vec3 vPos; varying float vSw; varying float vSpr; varying float vRun; varying vec2 vFl;
          float rip(vec2 p, float t) { return 2.2 * wN(p * 0.9 + vec2(t * 0.35, -t * 0.22)) + 1.2 * wN(p * 2.3 - vec2(t * 0.5, t * 0.31) + 5.0) + 0.6 * wN(p * 5.7 + vec2(-t * 0.8, t * 0.6) + 11.0); }
          #include <fog_pars_fragment>
          float caustic(vec2 p, float t) { vec2 q = p * 0.55; float a = sin(q.x * 1.7 + t * 0.9 + sin(q.y * 1.3 - t * 0.6)), b = sin(q.y * 2.1 - t * 0.8 + sin(q.x * 1.9 + t * 0.5)); float c = clamp(1.0 - abs(a + b) * 0.5, 0.0, 1.0); return c * c * c; }
          void main() {
            float full = mix(1.0, 0.66, smoothstep(60.0, 150.0, length(vPos.xz - uSpring))), inn = clamp(vW.y, 0.0, 1.0) * mix(1.0, 0.62, vSpr);
            float ca = caustic(vPos.xz, uTime * 0.6), ca2 = caustic(vPos.xz * 2.3 + 7.0, uTime * 0.8);
            vec3 col = mix(uEdgeC, uMidC, smoothstep(0.12, 0.8, inn)); col = mix(col, uCoreC, clamp(smoothstep(0.6, 1.0, inn) * (0.5 + 0.4 * ca) + 0.16 * ca2 * inn + clamp(vW.z * 2.0, 0.0, 0.5), 0.0, 1.0));
            col *= full * vSw;
            vec2 rp = vPos.xz - (vFl * 1.5 + vec2(0.2, 0.11)) * uTime; float px = length(fwidth(vPos.xz)), ra = 0.034 * (1.0 - 0.75 * smoothstep(0.4, 2.5, px)) * (1.0 + 0.8 * vRun);
            float h0 = rip(rp, uTime), hx = rip(rp + vec2(0.12, 0.0), uTime), hz = rip(rp + vec2(0.0, 0.12), uTime);
            vec3 N = normalize(vec3(-(hx - h0) * ra / 0.12, 1.0, -(hz - h0) * ra / 0.12));
            vec3 V = normalize(cameraPosition - vPos); float fr = 1.0 - clamp(dot(N, V), 0.0, 1.0); float f5 = fr * fr; f5 *= f5 * fr;
            vec3 R = reflect(-V, N); float ry = clamp(R.y, 0.0, 1.0);
            vec3 refl = mix(uWallC, mix(uSkyLo, uSkyHi, smoothstep(0.3, 0.85, ry)), smoothstep(0.16, 0.42, ry));
            col = mix(col, refl, (0.03 + 0.97 * f5) * 0.6);
            vec3 gd = uHeart.xyz - vPos; float gl = dot(gd, gd), gdist = sqrt(gl), gfront = smoothstep(-3.0, 6.0, dot(vPos.xz - uHeart.xz, uHeartF));
            float gwash = uHeart.w * gfront / (1.0 + gl * 0.0016) * (1.0 - smoothstep(120.0, 200.0, gdist));
            float gs = pow(clamp(dot(R, gd / max(gdist, 0.01)), 0.0, 1.0), 24.0);
            col += uHeartC * (0.16 * gwash + 2.2 * gs * gfront * (1.0 - smoothstep(140.0, 230.0, gdist)));
            if (vRun > 0.5) { float st = max(max(1.0 - smoothstep(0.0, 1.5, abs(vW.x - uSteps.x - 0.6)), 1.0 - smoothstep(0.0, 1.5, abs(vW.x - uSteps.y - 0.6))), 1.0 - smoothstep(0.0, 1.5, abs(vW.x - uSteps.z - 0.6))) * step(vW.x, 300.0);
              float fo = clamp(st * (0.5 + 0.7 * wN(vec2(vW.x * 1.3 - uTime * 1.8, vW.y * 5.0))) + 0.4 * smoothstep(0.6, 0.78, wN(vec2(vW.x * 0.5 - uTime * 0.9, vW.y * 7.0 + 3.0))) * (1.0 - 0.6 * vW.y), 0.0, 1.0);
              col = mix(col, vec3(0.62, 0.72, 0.7) + uHeartC * 0.12 * gwash, fo); }
            { float pf = 0.0; for (int i = 0; i < 3; i++) pf = max(pf, 1.0 - smoothstep(1.5, 7.0, length(vPos.xz - uPools[i])));
              col = mix(col, vec3(0.6, 0.72, 0.72), clamp(pf * (0.35 + 0.9 * wN(vPos.xz * 1.7 + vec2(uTime * 0.6, -uTime * 0.4))), 0.0, 1.0)); }
            float way = length(vPos.xz - uRing); col = mix(min(col * 0.55, uCapC), col, smoothstep(30.0, 45.0, way));
            gl_FragColor = vec4(col, 1.0);
            #include <tonemapping_fragment>
            #include <colorspace_fragment>
            #include <fog_fragment>
          }`,
      });
      const mesh = new THREE.Mesh(g, m); mesh.name = 'the basin\'s water'; mesh.renderOrder = 1; scene.add(mesh);
    }
    // (no rest here: this step and the next are short, and one frame holds both)

    // ---------- THE FALLS FROM THE RIM ('rimfalls'): three waterfalls, each coming down a notch from the rim to a lip
    // and falling free from there into its pool at the wall's foot, in the arc of thrown water: a translucent body,
    // brightest along its middle, streaked and torn at its edges, with spray standing over the pool. Water in the
    // basin's shade: it takes the sky's light, the sun's where the sun reaches it, and the heart's gold by place. ----------
    {
      const rfS = S.rimfalls, fp = [], fa = [], fi = [], fv = (e, y, n, u, run, kind, ph) => { fp.push(e, y, -n); fa.push(u, run, kind, ph); return fp.length / 3 - 1; };
      for (const F of P.FALLS) { const GR = F.name === 'north' ? 1 : 0, ph = rfS.range(0, 10), o = F.o, sd = [o[1], -o[0]], at = (s) => [F.e + o[0] * s, F.n + o[1] * s], yPool = P.K.WATER + 0.05, lipS = -2.6, lp = at(lipS), yTop = P.groundAt(lp[0], lp[1]) + 0.25 + 0.8 * GR;
        // the water's way down the notch from the rim to the lip (followed up the wall for as long as the ground climbs)
        const up = [[lp[0], yTop, lp[1]]]; let s = lipS, top = yTop;
        for (let k = 0; k < 14; k++) { s -= 5; const q = at(s), y = P.groundAt(q[0], q[1]) + 0.25 + 0.8 * GR; if (y < top - 0.4) break; top = Math.max(top, y); up.push([q[0], y, q[1]]); }
        up.reverse();
        let prev = null, last = null, run = 0;
        const rowAt = (p, hw, kind) => { if (last) run += Math.hypot(p[0] - last[0], p[1] - last[1], p[2] - last[2]); last = p; const row = [-1, 0, 1].map((u) => fv(p[0] + sd[0] * hw * u, p[1], p[2] + sd[1] * hw * u, u, run, kind, ph));
          if (prev) for (let q = 0; q < 2; q++) fi.push(prev[q], row[q], row[q + 1], prev[q], row[q + 1], prev[q + 1]); prev = row; };
        up.forEach((p, i) => rowAt(p, lerp(1.1, 1.9, i / Math.max(1, up.length - 1)) * (GR ? 6.4 : 1), 0));
        // the free fall: 9.6 m out from the lip by the time it meets its pool
        for (let k = 1; k <= 12; k++) { const d = Math.pow(k / 12, 1.25), q = at(lipS + 9.6 * Math.sqrt(d)); rowAt([q[0], lerp(yTop, yPool, d), q[1]], GR ? lerp(10.5, 12.5, d) : lerp(1.9, 3.7, d), 1); }
        // the spray over the pool: two upright sheets crossed at the pool's middle
        for (const [ax, hw0] of [[sd, 8], [o, 6.5]]) { const hw = hw0 * (GR ? 3.3 : 1), sy = GR ? 31 : 10, c = F.pool, v0 = fv(c[0] - ax[0] * hw, yPool - 0.3, c[1] - ax[1] * hw, -1, 0, 2, ph), v1 = fv(c[0] + ax[0] * hw, yPool - 0.3, c[1] + ax[1] * hw, 1, 0, 2, ph), v2 = fv(c[0] + ax[0] * hw, yPool + sy, c[1] + ax[1] * hw, 1, 1, 2, ph), v3 = fv(c[0] - ax[0] * hw, yPool + sy, c[1] - ax[1] * hw, -1, 1, 2, ph); fi.push(v0, v1, v2, v0, v2, v3); }
      }
      // ONE THIN TALL FALL down the basin's east wall (bearing 78 from the basin's middle): it follows the wall from the
      // rim to the meadow, with a small bright spray at its foot
      { const B = P.K.BASIN, b = P.onBearing(78), sdT = [b[1], -b[0]], ph = rfS.range(0, 10); let prev = null, run = 0, lastY = 0, foot = null;
        for (let k = 0; k <= 20; k++) { const d = 156 - k * 2.4, e = B.e + b[0] * d, n = B.n + b[1] * d, y = P.groundAt(e, n) + 0.7; if (k > 0) run += Math.hypot(2.4, lastY - y); lastY = y;
          if (y < P.K.MEADOW + 1.2 && prev) { foot = foot || [e, n]; break; }
          const hw = lerp(0.8, 1.7, k / 20), row = [-1, 0, 1].map((u) => fv(e + sdT[0] * hw * u, y, n + sdT[1] * hw * u, u, run, 0, ph)); if (prev) for (let q = 0; q < 2; q++) fi.push(prev[q], row[q], row[q + 1], prev[q], row[q + 1], prev[q + 1]); prev = row; foot = [e, n]; }
        if (foot) for (const ax of [sdT, b]) { const hw = 5.5, y0 = P.K.MEADOW - 0.3, v0 = fv(foot[0] - ax[0] * hw, y0, foot[1] - ax[1] * hw, -1, 0, 2, ph), v1 = fv(foot[0] + ax[0] * hw, y0, foot[1] + ax[1] * hw, 1, 0, 2, ph), v2 = fv(foot[0] + ax[0] * hw, y0 + 9, foot[1] + ax[1] * hw, 1, 1, 2, ph), v3 = fv(foot[0] - ax[0] * hw, y0 + 9, foot[1] - ax[1] * hw, -1, 1, 2, ph); fi.push(v0, v1, v2, v0, v2, v3); } }
      // A THIN HAZE between the ship and the dark wall behind it: one wide low sheet north of the hull, across the view from the way in
      { const c = [P.SHIP.e + 4, P.SHIP.n + 24], hw = 46, y0 = P.K.MEADOW - 2, v0 = fv(c[0] - hw, y0, c[1], -1, 0, 2.5, 3.1), v1 = fv(c[0] + hw, y0, c[1], 1, 0, 2.5, 3.1), v2 = fv(c[0] + hw, y0 + 34, c[1], 1, 1, 2.5, 3.1), v3 = fv(c[0] - hw, y0 + 34, c[1], -1, 1, 2.5, 3.1); fi.push(v0, v1, v2, v0, v2, v3); }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(fp, 3)); g.setAttribute('aV', new THREE.Float32BufferAttribute(fa, 4)); g.setIndex(fi); g.computeBoundingSphere();
      const m = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, side: THREE.DoubleSide, uniforms: { ...LIT, uTime: U.time },
        vertexShader: /* glsl */`attribute vec4 aV; varying vec4 vV; varying vec3 vP; void main() { vV = aV; vec4 wp = modelMatrix * vec4(position, 1.0); vP = wp.xyz; gl_Position = projectionMatrix * viewMatrix * wp; }`,
        fragmentShader: NOISE_GLSL + LIT_GLSL + P.PLACE_LIGHT_GLSL + /* glsl */`uniform float uTime; varying vec4 vV; varying vec3 vP;
          void main() { float a; float br;
            if (vV.z < 1.5) { float core = clamp(1.0 - vV.x * vV.x, 0.0, 1.0), fall = clamp(vV.z, 0.0, 1.0), sp = mix(2.6, 5.5, fall);
              float st = 0.6 * wN(vec2(vV.x * 3.0 + vV.w * 7.0, vV.y * 0.3 - uTime * sp * 0.3)) + 0.4 * wN(vec2(vV.x * 8.0 - vV.w * 3.0, vV.y * 0.12 - uTime * sp * 0.22));
              a = smoothstep(0.18, 0.62, core * (0.5 + 0.9 * st)) * mix(0.82, 0.96, fall); br = 0.7 + 0.5 * st + 0.55 * core * core; }
            else { vec2 q = vec2(vV.x, vV.y * 2.0 - 0.55); float r = 1.0 - smoothstep(0.15, 1.0, length(q));
              float nz = 0.6 * wN(vec2(vV.x * 2.2 + vV.w, vV.y * 2.5 - uTime * 0.5)) + 0.4 * wN(vec2(vV.x * 5.0 - vV.w, vV.y * 5.0 - uTime * 0.9));
              a = r * (0.2 + 0.8 * nz) * mix(0.8, 0.36, step(2.25, vV.z)); br = 0.9; }
            vec3 lit = wLit(vP) + lurPlaceLight(vP, vec3(0.0, 1.0, 0.0)); lit = mix(lit, vec3(dot(lit, vec3(0.3333))), 0.5) * 1.9;
            gl_FragColor = vec4(vec3(0.88, 0.95, 0.96) * lit * br, clamp(a, 0.0, 1.0));
            #include <tonemapping_fragment>
            #include <colorspace_fragment>
          }` });
      const mesh = new THREE.Mesh(g, m); mesh.name = 'the falls from the rim'; mesh.renderOrder = 3; scene.add(mesh);
    }
    await ctx.yield();

    // ---------- THE HEART OF THE ISLAND ('heart'): a low wide cave mouth in the basin's far wall, 20 m wide and 6 m
    // high over its water, pouring warm golden light; the run of the basin's water goes in under its brow. The rock
    // about it is the wall's own, broken and leaning back; inside it nothing is made but light: a bright ground
    // 2.6 m in, and the cave's roof and sides taking that light. The gold on the meadow, the water, the mist and the
    // crowns before it is laid by place (the shared rule of the two places' light). ----------
    {
      const rh = S.heart, f = HEf, a = [f[1], -f[0]], hw = HE.hw, y0 = HE.y, top = y0 + HE.h, W3 = (al, y, out) => [HE.e + a[0] * al + f[0] * out, y, -(HE.n + a[1] * al + f[1] * out)];
      const jag = Array.from({ length: 64 }, () => rh.range(-1, 1)), jg = (al) => { const x = (al + 40) * 0.8, i = Math.floor(x), t = x - i; return lerp(jag[i & 63], jag[(i + 1) & 63], t * t * (3 - 2 * t)); };
      // the opening's top over its sill, by the metres along the face: a flattened arch, uneven
      const arch = (al) => Math.abs(al) >= hw ? 0 : HE.h * Math.pow(Math.max(0, 1 - (al / hw) * (al / hw)), 0.38) * (1 + 0.1 * jg(al * 0.7));
      const rp = [], rc = [], rn = [], ri = [], rv = (p, c) => { rp.push(p[0], p[1], p[2]); rc.push(c[0], c[1], c[2]); return rp.length / 3 - 1; };
      const cR1 = [0.36, 0.38, 0.31], cR2 = [0.24, 0.27, 0.22], rock = (al, y) => { const k = clamp(0.5 + 0.5 * noise.n2(al * 0.31 + 4, y * 0.6 - 2), 0, 1), s = 0.8 + 0.3 * noise.n2(al * 1.3, y * 1.7 + 9); return [lerp(cR2[0], cR1[0], k) * s, lerp(cR2[1], cR1[1], k) * s, lerp(cR2[2], cR1[2], k) * s]; };
      // the face: columns a metre apart from 7 m beyond one end of the mouth to 7 m beyond the other; each stands
      // from the opening's top (or from the ground beside the mouth) up to the brow, leaning back as it rises
      let prev = null;
      for (let al = -hw - 7; al <= hw + 7.01; al += 1) { const lo = Math.abs(al) < hw ? y0 + arch(al) : P.groundAt(HE.e + a[0] * al + f[0] * 0.6, HE.n + a[1] * al + f[1] * 0.6) - 0.5, hi = top + 3.6 + 1.1 * jg(al * 0.45 + 9) - 1.6 * smoothstep(hw + 2, hw + 7, Math.abs(al));
        const col = []; for (let r = 0; r <= 4; r++) { const y = lerp(lo, Math.max(hi, lo + 0.6), r / 4), back = 0.5 * Math.max(0, y - top), out = 0.35 + 0.55 * noise.n2(al * 0.42 + 7, y * 0.55) - back - (r === 0 ? 0 : 0.15); col.push(rv(W3(al, y, out), rock(al, y))); }
        col.push(rv(W3(al, Math.max(hi, lo + 0.6) + 0.2, -5.2), rock(al, hi + 2)));
        if (prev) for (let r = 0; r < 5; r++) ri.push(prev[r], col[r], col[r + 1], prev[r], col[r + 1], prev[r + 1]);
        prev = col; }
      { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(rp, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(rc, 3)); g.setIndex(ri); g.computeVertexNormals(); g.computeBoundingSphere();
        const m = new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true, side: THREE.DoubleSide }); P.underSun(m, SU, 'stone');
        const mesh = new THREE.Mesh(g, m); mesh.name = 'the rock about the heart\'s mouth'; scene.add(mesh); }
      // the light: the cave's roof and sides from the face in to the bright ground 2.6 m in, and that ground
      const gp = [], gc = [], gi = [], gv = (p, c) => { gp.push(p[0], p[1], p[2]); gc.push(c[0], c[1], c[2]); return gp.length / 3 - 1; };
      const lipC = [0.5, 0.17, 0.02], deepC = [1.25, 0.52, 0.08], hotC = [1.9, 0.95, 0.2];
      let pv = null, ctr = gv(W3(0, y0 + 0.9, -2.6), hotC);
      for (let k = 0; k <= 24; k++) { const al = lerp(-hw, hw, k / 24), ty = y0 + Math.max(arch(al), 0.0) + 0.05, e0 = gv(W3(al, ty, 0.3), lipC), e1 = gv(W3(al * 0.96, ty - 0.25, -2.6), deepC);
        if (pv) { gi.push(pv[0], e0, e1, pv[0], e1, pv[1]); gi.push(ctr, pv[1], e1); }
        pv = [e0, e1]; }
      { const b0 = gv(W3(-hw * 0.96, y0 - 0.4, -2.6), deepC), b1 = gv(W3(hw * 0.96, y0 - 0.4, -2.6), deepC), bm = gv(W3(0, y0 - 0.4, -2.6), hotC); gi.push(ctr, b0, bm, ctr, bm, b1); }
      { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(gp, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(gc, 3)); g.setIndex(gi); g.computeBoundingSphere();
        const mesh = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide })); mesh.name = 'the heart\'s light'; scene.add(mesh); }
      // THE HEART'S HALO (a medium: the mouth's light in the basin's vapour): a soft gold bloom about the mouth, 88 m
      // wide and 30 m high, brightest at the mouth's middle. It stands at the mouth and turns about its own upright
      // to the eye, as the mist's sheets do; it breathes a little on the world's clock.
      { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute([-1, 0, 0, 1, 0, 0, 1, 1, 0, -1, 1, 0], 3)); g.setIndex([0, 1, 2, 0, 2, 3]);
        const m = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending,
          uniforms: { uTime: U.time, uAt: { value: new THREE.Vector3(HE.e + f[0] * 1.2, y0 - 0.6, -(HE.n + f[1] * 1.2)) }, uC: { value: new THREE.Color(1.0, 0.55, 0.13) } },
          vertexShader: /* glsl */`uniform vec3 uAt; varying vec2 vQ;
            void main() { vec2 tc = cameraPosition.xz - uAt.xz; vec2 right = normalize(vec2(tc.y, -tc.x) + vec2(1e-4, 0.0)); vec3 p = uAt; p.xz += right * (position.x * 44.0); p.y += position.y * 30.0; vQ = position.xy;
              gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0); }`,
          fragmentShader: /* glsl */`uniform float uTime; uniform vec3 uC; varying vec2 vQ;
            void main() { float x = vQ.x, y = vQ.y - 0.12; float core = exp(-(x * x * 33.0 + y * y * 61.0)), wide = exp(-(x * x * 3.2 + y * y * 7.0));
              float a = (0.42 * core + 0.2 * wide) * (0.92 + 0.08 * sin(uTime * 0.7)) * (1.0 - smoothstep(0.7, 1.0, abs(x))) * smoothstep(0.0, 0.05, vQ.y) * (1.0 - smoothstep(0.75, 1.0, vQ.y));
              gl_FragColor = vec4(uC * a, 1.0);
              #include <tonemapping_fragment>
              #include <colorspace_fragment>
            }` });
        const mesh = new THREE.Mesh(g, m); mesh.name = 'the heart\'s halo'; mesh.frustumCulled = false; mesh.renderOrder = 5; scene.add(mesh); }
      // THE HEART'S LONG SHADOWS: the mouth's light is low, so what stands on the floor before it throws a long shade
      // straight away from it across the meadow: each tree fern and each boulder within 135 m of the mouth. Laid on
      // the flat floor only (none over water or rock), darkest at the thing's foot, by the strength of the gold there.
      { const sp = [], sc = [], si = [], lx = HE.e + f[0] * 1.5, ln = HE.n + f[1] * 1.5, MD = P.K.MEADOW;
        const cast = (e, n, w0, w1, len, k0) => { const de = e - lx, dn = n - ln, d = Math.hypot(de, dn); if (d > 135 || d < 6 || de * f[0] + dn * f[1] < 2) return;
          const ux = de / d, un = dn / d, str = k0 * clamp(2.4 / (1 + d * d * 0.0016), 0, 1); let prev = null;
          for (let k = 0; k <= 6; k++) { const t = k / 6, q = 0.4 + t * len, ce = e + ux * q, cn = n + un * q, hw = lerp(w0, w1, t) * 0.5, on = Math.abs(P.groundAt(ce, cn) - MD) < 0.25 && P.riftAt(ce, cn)[0] > hw * 0.5 + 0.3, al = on ? str * (1 - t) * (1 - 0.4 * t) : 0, i0 = sp.length / 3;
            sp.push(ce - un * hw, MD + 0.07, -(cn + ux * hw), ce, MD + 0.07, -cn, ce + un * hw, MD + 0.07, -(cn - ux * hw)); sc.push(0.02, 0.07, 0.05, 0, 0.02, 0.07, 0.05, al, 0.02, 0.07, 0.05, 0);
            if (prev !== null) si.push(prev, i0, i0 + 1, prev, i0 + 1, prev + 1, prev + 1, i0 + 1, i0 + 2, prev + 1, i0 + 2, prev + 2); prev = i0; } };
        for (const q of L.ferns) if (q.basin) cast(q.e, q.n, 0.9, 6, 36, 0.62);
        for (const q of L.boulders) if (q[3] > 1.2) cast(q[0], q[1], q[3] * 0.95, q[3] * 1.5, clamp(q[3] * q[5] * 7, 8, 24), 0.62);
        if (si.length) { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(sc, 4)); g.setIndex(si); g.computeBoundingSphere();
          const mesh = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 })); mesh.name = 'the heart\'s long shadows'; mesh.renderOrder = 2; scene.add(mesh); } }
    }
    await ctx.yield();

    // ---------- THE SHIP ('ship'): a wooden sailing ship of long ago, wrecked and lying in the basin far from any
    // sea: a dark timber hull 50 m long heeled 17 degrees toward the line, its keel in the grass east of the
    // Springhead with the great fall behind it; planks gone in places and the ribs showing, three broken masts
    // with yards askew, hanging ropes and rags of sail, vines over the bow, moss on the decks. No figure, no name,
    // no flag, nothing lettered. It carries no light of its own: it takes the sky's, the sun's and the heart's.
    {
      const rs = S.ship, SH = P.SHIP, u = P.onBearing(SH.bow), v = [u[1], -u[0]], ch = Math.cos(SH.heel * Math.PI / 180), sh = Math.sin(SH.heel * Math.PI / 180), y0 = P.K.MEADOW - 0.55;
      const sp = [], sc = [];
      const W = (x, y, z) => { const yy = y * ch - z * sh, zz = y * sh + z * ch; return [SH.e + u[0] * x + v[0] * zz, y0 + yy, -(SH.n + u[1] * x + v[1] * zz)]; };
      const tri = (a, b, c, col) => { sp.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2]); for (let k = 0; k < 3; k++) sc.push(col[0], col[1], col[2]); };
      const quad = (a, b, c, d, col) => { tri(a, b, c, col); tri(a, c, d, col); };
      const tint = (c, k) => [c[0] * k, c[1] * k, c[2] * k];
      const cPlank = [0.12, 0.095, 0.075], cRib = [0.075, 0.06, 0.045], cDeck = [0.3, 0.24, 0.16], cMoss = [0.17, 0.31, 0.09], cMast = [0.52, 0.36, 0.2], cRope = [0.2, 0.16, 0.11], cSail = [0.52, 0.47, 0.37], cVine = [0.13, 0.34, 0.08];
      // the hull's form: stations from stern to bow, each a half section of strakes from keel to rail
      const NS = 25, NK = 6, HL = SH.len / 2;
      const beam = (t) => Math.max(5.6 * Math.pow(Math.max(0, 1 - Math.pow(Math.abs(t), t > 0 ? 2.4 : 3.4)), 0.55), t < 0 ? 2.3 : 0.12);
      const sheer = (t) => 6.0 + 2.0 * t * t + 2.6 * smoothstep(-0.5, -0.62, t) + 1.2 * smoothstep(0.66, 0.74, t);
      const sect = (i, j, sd) => { const t = (i / (NS - 1)) * 2 - 1, q = j / NK; return W(t * HL, sheer(t) * Math.pow(q, 1.55), sd * beam(t) * (1 - Math.pow(1 - q, 2.3))); };
      for (let i = 0; i < NS - 1; i++) for (const sd of [1, -1]) for (let j = 0; j < NK; j++) { const hole = rs() < (j >= 2 ? 0.2 : 0.07) + (i > 6 && i < 12 && sd > 0 ? 0.42 : 0) + (i > 17 && j > 2 ? 0.18 : 0), k = 0.72 + 0.56 * rs();
        if (!hole) quad(sect(i, j, sd), sect(i + 1, j, sd), sect(i + 1, j + 1, sd), sect(i, j + 1, sd), tint(cPlank, k)); }
      // the ribs: at every station a frame following the section inside the planking; the stern's flat end
      for (let i = 1; i < NS; i++) for (const sd of [1, -1]) for (let j = 0; j < NK; j++) quad(sect(i, j, sd), sect(i, j + 1, sd), sect(i, j + 1, sd * 0.93), sect(i, j, sd * 0.9), cRib);
      for (let j = 0; j < NK; j++) quad(sect(0, j, 1), sect(0, j + 1, 1), sect(0, j + 1, -1), sect(0, j, -1), tint(cPlank, 0.8 + 0.06 * j));
      // the decks: boards under the rail, mossed in patches, some gone
      const dk = (i, sd) => { const t = (i / (NS - 1)) * 2 - 1; return W(t * HL, sheer(t) - 0.55, sd * beam(t) * 0.97); };
      for (let i = 0; i < NS - 1; i++) for (const sd of [1, -1]) { const m = rs(), k = 0.75 + 0.45 * rs(); if (rs() < 0.13) continue; quad(dk(i, sd), dk(i + 1, sd), dk(i + 1, 0), dk(i, 0), m < 0.45 ? tint(cMoss, k) : tint(cDeck, k)); }
      // spars: a tapered round between two places of the ship's own frame
      const spar = (A, B, r0, r1, col, ns = 6) => { const d = [B[0] - A[0], B[1] - A[1], B[2] - A[2]], l = Math.hypot(d[0], d[1], d[2]) || 1, dx = d[0] / l, dy = d[1] / l, dz = d[2] / l, hx = Math.abs(dy) > 0.8 ? 1 : 0, hy = 1 - hx;
        let ax = -dz * hy, ay = dz * hx, az = dx * hy - dy * hx; const al = Math.hypot(ax, ay, az) || 1; ax /= al; ay /= al; az /= al; const bx = dy * az - dz * ay, by = dz * ax - dx * az, bz = dx * ay - dy * ax;
        const ring = (Q, r) => Array.from({ length: ns }, (_, k) => { const a = k / ns * 6.2832, c = Math.cos(a) * r, s = Math.sin(a) * r; return W(Q[0] + ax * c + bx * s, Q[1] + ay * c + by * s, Q[2] + az * c + bz * s); });
        const R0 = ring(A, r0), R1 = ring(B, r1); for (let k = 0; k < ns; k++) quad(R0[k], R0[(k + 1) % ns], R1[(k + 1) % ns], R1[k], tint(col, 0.85 + 0.3 * ((k * 5) % ns) / ns)); };
      // ropes: a sagging band between two places; a rope that hangs is plumb in the world, not in the heeled ship
      const rope = (A, B, sag, w = 0.12, col = cRope, seg = 5) => { const up = Math.abs(B[1] - A[1]) > Math.hypot(B[0] - A[0], B[2] - A[2]), wx = up ? w : 0, wy = up ? 0 : w, wz = up ? w * 0.6 : 0; let prev = null;
        for (let k = 0; k <= seg; k++) { const q = k / seg, x = lerp(A[0], B[0], q), y = lerp(A[1], B[1], q) - sag * 4 * q * (1 - q), z = lerp(A[2], B[2], q), a = W(x - wx, y - wy, z - wz), b = W(x + wx, y + wy, z + wz); if (prev) quad(prev[0], prev[1], b, a, col); prev = [a, b]; } };
      const plumb = (A, l) => [A[0], A[1] - l * ch, A[2] + l * sh];
      spar([-HL, 0.1, 0], [HL - 0.6, 0.1, 0], 0.36, 0.36, cRib, 5); spar([HL - 0.9, 0.2, 0], [HL + 1.2, sheer(1) + 1.7, 0], 0.42, 0.3, cRib); spar([21, 8.7, 0], [31.5, 12.6, 0], 0.4, 0.2, cMast);
      const masts = [[-2, 27, 0.56, 0.32], [11, 19, 0.5, 0.36], [-15, 17, 0.44, 0.32]];
      for (const [mx, top, r0, r1] of masts) { spar([mx, 1, 0], [mx, top, 0], r0, r1, cMast, 7);
        for (const sd of [1, -1]) for (let k = 0; k < 3; k++) { const xr = mx - 1.2 - 2.1 * k, t = xr / HL; rope([mx, top * 0.74, 0], [xr, sheer(t) - 0.2, sd * beam(t) * 0.98], 0.25); } }
      spar([-2, 27, 0], [-0.4, 30.4, 0.9], 0.26, 0.12, cMast); spar([11, 19, 0], [18.6, 11.6, -2.6], 0.3, 0.16, cMast);
      quad(W(-3.3, 17, -1.3), W(-0.7, 17, -1.3), W(-0.7, 17, 1.3), W(-3.3, 17, 1.3), cMast);
      // the yards, askew; ropes and rags of sail hanging from them
      const yards = [[[-2.5, 11.0, -8.6], [-2.5, 15.2, 8.6], 0.27], [[-2.5, 22.7, -5.5], [-2.5, 19.7, 5.5], 0.2], [[10.5, 12.7, -6.9], [10.5, 9.7, 6.9], 0.23]];
      for (const [A, B, r] of yards) { spar(A, B, r, r * 0.8, cMast, 5);
        for (let k = 0; k < 3; k++) { const q = rs.range(0.04, 0.96), at = [lerp(A[0], B[0], q), lerp(A[1], B[1], q), lerp(A[2], B[2], q)]; rope(at, plumb(at, rs.range(3, 9)), 0, 0.1); } }
      { const [A, B] = yards[0]; for (let k = 0; k < 5; k++) { const q0 = 0.08 + 0.17 * k + 0.03 * rs(), q1 = q0 + rs.range(0.07, 0.13), a = [A[0], lerp(A[1], B[1], q0), lerp(A[2], B[2], q0)], b = [A[0], lerp(A[1], B[1], q1), lerp(A[2], B[2], q1)];
        quad(W(...a), W(...b), W(...plumb(b, rs.range(2.5, 7.5))), W(...plumb(a, rs.range(2.5, 7.5))), tint(cSail, 0.7 + 0.5 * rs())); } }
      rope([-2, 26, 0], [11, 18.6, 0], 1.6); rope([11, 18.6, 0], [31, 12.4, 0], 2.2); rope([-2, 22, 0], [-15, 16.6, 0], 1.2);
      // vines over the bow and the rail, down the outside of the planking
      for (let k = 0; k < 13; k++) { const i0 = rs.range(15.5, 23.4), wd = rs.range(0.18, 0.42), sd = rs() < 0.6 ? 1.04 : -1.04, reach = 2 + rs.int(0, 2), kc = 0.7 + 0.6 * rs();
        for (let j = NK; j > NK - reach; j--) quad(sect(i0, j, sd), sect(i0 + wd, j, sd), sect(i0 + wd * (0.5 + rs()), j - 1, sd), sect(i0 + 0.1 * rs(), j - 1, sd), tint(cVine, kc * (0.8 + 0.3 * rs()))); }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(sc, 3)); g.computeVertexNormals(); g.computeBoundingSphere();
      const m = new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide }); P.underSun(m, SU, 'ship');
      const mesh = new THREE.Mesh(g, m); mesh.name = 'the ship in the basin'; scene.add(mesh);
    }
    await ctx.yield();

    // ---------- WHAT GROWS. A plant takes sun and sky only: no plant carries any light of its own ----------
    // the wind blows toward bearing 120; its gusts start from a dealt place in their cycle ('gusts')
    const wind = flora.makeWind({ direction: [0.866, 0.5], strength: windy ? 1.55 : 0.95 }), gustPh = S.gusts.range(0, 600);
    await flora.prepareLeafTexture({}, ctx.yield, 18);
    const plantMat = flora.windMaterial({ wind, glow: 0, ambient: 1.0, leafAmbient: 1.0 }); P.underSun(plantMat, SU, 'plants', true);
    // the basin's plants (tree ferns, sedge) are the same plants; standing by lit water they take its light on the
    // side toward it (light that lands on them: they carry none)
    const basinMat = flora.windMaterial({ wind, glow: 0, ambient: 1.0, leafAmbient: 1.0 }); P.underSun(basinMat, SU, 'basin plants', true); underWater(basinMat, 'basin plants', true);
    const PG = (sc = 1) => { const p = [], n = [], c = [], w = [], t = [], ix = []; return { ix,
      v(pos, nr, col, sway = 0, fl = 0, leaf = 0, tu = 0.875, tv = 0.75) { p.push(pos[0] * sc, pos[1] * sc, pos[2] * sc); n.push(nr[0], nr[1], nr[2]); c.push(col[0], col[1], col[2]); w.push(sway, fl, leaf, 0); t.push(tu, tv); return p.length / 3 - 1; },
      build() { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(n, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(c, 3));
        g.setAttribute('wind', new THREE.Float32BufferAttribute(w, 4)); g.setAttribute('uv', new THREE.Float32BufferAttribute(t, 2)); g.setIndex(ix); g.computeBoundingSphere(); g.userData = { triangles: ix.length / 3 }; return g; } }; };
    const L3 = (h) => { const q = C3(h); return [q.r, q.g, q.b]; }, mixC = (a, b, k) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
    const cBark = L3('#bcb49c'), cRoot = L3('#8f8468'), cLo = L3('#587a66'), cMid = L3('#7a9e72'), cHi = L3('#a8c684');
    // a round of ten sides through rings [x, y, z, radius]; flute: the buttresses' flanges low on the trunk
    const tubeG = (G, rings, sides, colAt, swayAt, flute) => { const base = [];
      rings.forEach((r, ri) => { const row = []; for (let k = 0; k < sides; k++) { const a = (k / sides) * Math.PI * 2, f = flute ? flute(a, ri) : 1; row.push(G.v([r[0] + Math.cos(a) * r[3] * f, r[1], r[2] + Math.sin(a) * r[3] * f], [Math.cos(a), 0.15, Math.sin(a)], colAt(ri, a), swayAt(ri))); } base.push(row); });
      for (let ri = 0; ri + 1 < rings.length; ri++) for (let k = 0; k < sides; k++) { const k2 = (k + 1) % sides; G.ix.push(base[ri][k], base[ri + 1][k], base[ri + 1][k2], base[ri][k], base[ri + 1][k2], base[ri][k2]); } };
    // THE FIVE KINDS OF GREAT PLANT, each modelled in metres at its middle size (so that bark is drawn near its true
    // grain) and stood by the plan at its own height, thickness, turn and lean
    const cPale = L3('#d2cab2'), cFig = L3('#a8946e'), cFigD = L3('#8a7858');
    const trunkGeos = [
      // the giant: a bole 2.2 m thick on five plank buttresses that run 3.3 to 5.7 m out and 4 to 6 m up the bole
      (() => { const G = PG(1);
        tubeG(G, [[0, -0.6, 0, 1.45], [0, 0.9, 0, 1.25], [0, 4.5, 0, 1.1], [0.15, 14, 0.1, 0.95], [0, 26.6, 0, 0.62]], 8, (ri) => mixC(cRoot, cBark, Math.min(1, ri / 2)), (ri) => 0.015 * ri);
        [[0.4, 1.0, 5.2], [1.75, 0.75, 4.2], [2.9, 1.15, 5.6], [4.15, 0.85, 4.4], [5.4, 1.3, 6.0]].forEach(([a, k, hb]) => { const R = 4.4 * k, c = Math.cos(a), sn = Math.sin(a), tx = -sn, tz = c, at = (r, y, w, sd) => [c * r + tx * w * sd, y, sn * r + tz * w * sd];
          for (const sd of [-1, 1]) { const nr = [tx * sd, 0.1, tz * sd], A = G.v(at(1.0, hb, 0.2, sd), nr, cBark), M = G.v(at(1.0 + (R - 1) * 0.42, hb * 0.3, 0.13, sd), nr, mixC(cRoot, cBark, 0.6)), B = G.v(at(R, -0.5, 0.06, sd), nr, cRoot), C0 = G.v(at(0.9, -0.5, 0.24, sd), nr, cRoot);
            if (sd > 0) G.ix.push(A, M, C0, M, B, C0); else G.ix.push(A, C0, M, M, C0, B); }
          const up = [c * 0.5, 0.86, sn * 0.5], T = [[1.0, hb, 0.2], [1.0 + (R - 1) * 0.42, hb * 0.3, 0.13], [R, -0.5, 0.06]].map(([r, y, w]) => [G.v(at(r, y, w, -1), up, cBark), G.v(at(r, y, w, 1), up, cBark)]);
          for (let i = 0; i < 2; i++) G.ix.push(T[i][0], T[i][1], T[i + 1][1], T[i][0], T[i + 1][1], T[i + 1][0]); });
        return G.build(); })(),
      // the canopy tree: a round bole on a small flare
      (() => { const G = PG(1); tubeG(G, [[0, -0.4, 0, 0.62], [0, 0.8, 0, 0.42], [0.1, 8.5, 0.05, 0.33], [0, 14.3, 0, 0.2]], 7, (ri) => mixC(cRoot, cBark, Math.min(1, ri)), (ri) => 0.03 * ri, (a, ri) => 1 + (ri === 0 ? 0.5 : 0) * Math.pow(Math.max(0, Math.cos(a * 2 + 0.7)), 4)); return G.build(); })(),
      // the slender tree: a thin pale stem
      (() => { const G = PG(1); tubeG(G, [[0, -0.3, 0, 0.24], [0.08, 7, 0.05, 0.16], [0, 12.8, 0, 0.08]], 5, () => cPale, (ri) => 0.08 * ri); return G.build(); })(),
      // the strangler fig: seven stems round a hollow, tied by three cross stems, spreading at the foot
      (() => { const G = PG(1);
        for (let k = 0; k < 7; k++) { const a = k * 0.8976 + 0.3 * Math.sin(k * 2.3), w = 0.5 * Math.sin(k * 1.7), at = (r, y, tw) => [Math.cos(a + tw) * r, y, Math.sin(a + tw) * r, 0];
          const R = [at(2.3, -0.5, 0), at(1.55, 1.0, 0.1 * w), at(1.25, 5, 0.5 * w), at(0.7, 9.5, 0.9 * w), at(0.1, 12.5, w)]; [0.5, 0.36, 0.32, 0.27, 0.2].forEach((r, i) => { R[i][3] = r; });
          tubeG(G, R, 5, (ri) => mixC(cFigD, cFig, Math.min(1, ri / 2)), (ri) => 0.01 * ri); }
        for (const [k, y] of [[0, 3.2], [2, 6.4], [5, 4.6]]) { const a0 = k * 0.8976, a1 = (k + 1) * 0.8976, r = 1.4 - 0.07 * y; tubeG(G, [[Math.cos(a0) * r, y, Math.sin(a0) * r, 0.16], [Math.cos(a1) * r, y + 0.9, Math.sin(a1) * r, 0.14]], 4, () => cFig, () => 0); }
        return G.build(); })(),
      // the parasol tree: a bare straight bole
      (() => { const G = PG(1); tubeG(G, [[0, -0.4, 0, 0.5], [0, 1.2, 0, 0.35], [0.1, 12, 0, 0.3], [0, 23.2, 0, 0.2]], 6, (ri) => mixC(cRoot, cPale, Math.min(1, ri)), (ri) => 0.03 * ri); return G.build(); })(),
    ];
    // the middle size each kind is modelled at: [trunk radius, height]
    const MODEL = [[1.1, 36], [0.38, 21], [0.18, 16], [1.4, 25], [0.33, 27]];
    // a limb from a trunk's top to one of its leaf masses: a bent tapering round, one unit long
    const limbGeo = (() => { const G = PG(1); tubeG(G, [[0, 0, 0, 1], [0.06, 0.5, 0.03, 0.72], [0, 1, 0, 0.3]], 4, () => cBark, (ri) => 0.1 + 0.1 * ri); return G.build(); })();
    // a leaf mass at unit radius: a lumpy core under leaf cards that stand out past it (three makes: near the line,
    // further off, far)
    const clumpGeo = (det, cards, rs) => { const G = PG(), ico = new THREE.IcosahedronGeometry(1, det), pa = ico.attributes.position, idx = new Map();
      for (let i = 0; i < pa.count; i++) { const d = [pa.getX(i), pa.getY(i), pa.getZ(i)], key = d.map((q) => Math.round(q * 1e3)).join(','), lump = 1 + 0.2 * Math.sin(d[0] * 3.1 + d[1] * 2.3 + 1.7) * Math.cos(d[2] * 2.7 - d[0] * 1.3);
        let id = idx.get(key); if (id === undefined) { const s = d[1] * 0.5 + 0.5; id = G.v([d[0] * lump * 0.82, d[1] * lump * (d[1] < 0 ? 0.55 : 0.75), d[2] * lump * 0.82], d, s < 0.5 ? mixC(cLo, cMid, s * 2) : mixC(cMid, cHi, s * 2 - 1), 0.12, 0.25, 1); idx.set(key, id); }
        G.ix.push(id); }
      ico.dispose(); const cell = flora.LEAF_CELLS.cluster;
      for (let k = 0; k < cards; k++) { const yy = 0.85 - (k + 0.5) / cards * 1.45, rr = Math.sqrt(Math.max(0, 1 - yy * yy)), th = k * 2.39996 + rs.range(-0.3, 0.3), d = [Math.cos(th) * rr, yy, Math.sin(th) * rr];
        const tg = [-Math.sin(th), 0, Math.cos(th)], up = [d[0] * 0.55, d[1] * 0.55 - 0.35 + 0.8 * rr, d[2] * 0.55], sz = rs.range(0.5, 0.74), s = yy * 0.5 + 0.5, col = s < 0.5 ? mixC(cLo, cMid, s * 2) : mixC(cMid, cHi, s * 2 - 1), cc = [d[0] * 0.84, d[1] * 0.7, d[2] * 0.84];
        const q = (a, b) => [cc[0] + tg[0] * a * sz + up[0] * b * sz, cc[1] + tg[1] * a * sz + up[1] * b * sz, cc[2] + tg[2] * a * sz + up[2] * b * sz];
        const i0 = G.v(q(-1, -1), d, mixC(col, cLo, 0.3), 0.13, 0.5, 1, cell[0], cell[3]), i1 = G.v(q(1, -1), d, mixC(col, cLo, 0.3), 0.13, 0.5, 1, cell[2], cell[3]), i2 = G.v(q(1, 1), d, mixC(col, cHi, 0.3), 0.16, 1.2, 1, cell[2], cell[1]), i3 = G.v(q(-1, 1), d, mixC(col, cHi, 0.3), 0.16, 1.2, 1, cell[0], cell[1]);
        G.ix.push(i0, i1, i2, i0, i2, i3); }
      return G.build(); };
    const massGeos = [clumpGeo(1, 16, S.shapes), clumpGeo(0, 12, S.shapes), clumpGeo(0, 5, S.shapes)];
    // (no rest here: this step and the next are short, and one frame holds both)
    // every plant stands where the plan deals it
    const M4 = new THREE.Matrix4(), Q4 = new THREE.Quaternion(), Q5 = new THREE.Quaternion(), V4 = new THREE.Vector3(), S4 = new THREE.Vector3(), tintC = new THREE.Color(), UP = new THREE.Vector3(0, 1, 0), AX = new THREE.Vector3();
    // (wat: for a plant of the basin, what it takes of the water's light: (item) => [way to the water x, z, strength, rift])
    const instanced = (geo, list, put, mat = plantMat, wat = null) => { const mesh = new THREE.InstancedMesh(geo, mat, Math.max(1, list.length)); mesh.count = list.length; list.forEach((it, i) => put(it, i, mesh)); mesh.instanceMatrix.needsUpdate = true; if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
      if (wat) { const a = new Float32Array(Math.max(1, list.length) * 4); list.forEach((it, i) => a.set(wat(it), i * 4)); geo.setAttribute('aWat', new THREE.InstancedBufferAttribute(a, 4)); }
      mesh.computeBoundingSphere(); mesh.boundingSphere.radius += 4; scene.add(mesh); return mesh; };
    const plants = [];
    // a plant's lean: tilted from its foot toward the bearing it leans on, then turned about its own axis
    const leanQ = (t) => { const b = P.onBearing(t.lb); return Q4.setFromAxisAngle(AX.set(-b[1], 0, -b[0]).normalize(), t.lean * Math.PI / 180).multiply(Q5.setFromAxisAngle(UP, -t.rot)); };
    for (let kd = 0; kd < trunkGeos.length; kd++) plants.push(instanced(trunkGeos[kd], L.trees.filter((t) => t.kind === kd), (t, i, mesh) => {
      mesh.setMatrixAt(i, M4.compose(V4.set(t.e, t.y, -t.n), leanQ(t), S4.set(t.thick / MODEL[kd][0], t.H / MODEL[kd][1], t.thick / MODEL[kd][0]))); const h = 0.92 + 0.16 * (Math.abs(Math.sin(t.e * 5.3 + t.n * 2.9) * 731.7) % 1); mesh.setColorAt(i, tintC.setRGB(h, h, h * 0.98)); }));
    await ctx.yield();
    // LEAF MASSES: each plant's leaves have their own cast of green (olive, yellow-green or deep green), by where it
    // stands. Within 26 m of the line a mass is drawn full; out to 46 m plainer; beyond, a far plant shows three or
    // five plain masses (its kind's own number). LIMBS run from the trunk's top to every mass of a plant within 46 m.
    const mN = [[], [], []], limbs = [];
    for (const t of L.trees) { const hue = Math.abs(Math.sin(t.e * 3.71 + t.n * 1.93) * 9871.3) % 1, top = P.trunkTop(t);
      for (const c of t.drawn) { c.hue = hue; mN[t.kind === 2 && t.tier === 0 ? 1 : t.tier].push(c); if (t.tier < 2) limbs.push({ a: top, c, r: Math.max(0.07, 0.42 * t.thick * (t.kind === 0 || t.kind === 3 ? 0.5 : 1)) }); } }
    // SHRUBS (a leafy mass standing on the ground, 1 to 3 m) and SAPLINGS (a thin stem under three small masses, 2 to
    // 6 m) of the understory are drawn with the same leaf masses and limbs
    for (const u of L.under) { const hue = Math.abs(Math.sin(u.e * 3.71 + u.n * 1.93) * 9871.3) % 1, c0 = Math.cos(u.rot), s0 = Math.sin(u.rot);
      if (u.kind === 3) { mN[1].push({ e: u.e, n: u.n, y: u.y + 0.42 * u.H, r: 0.24 * u.H + 0.18, flat: 1.2, hue }); mN[2].push({ e: u.e + c0 * 0.08 * u.H, n: u.n + s0 * 0.08 * u.H, y: u.y + 0.74 * u.H, r: 0.18 * u.H + 0.12, flat: 1, hue }); }
      if (u.kind === 4) { [[0.1, 0.62, 0.17], [-0.08, 0.8, 0.15], [0.02, 0.95, 0.13]].forEach(([d, up, r], j) => { const c = { e: u.e + c0 * d * u.H * (j ? 1 : -1), n: u.n + s0 * d * u.H, y: u.y + up * u.H, r: r * u.H + 0.12, flat: 0.8, hue }; mN[2].push(c); limbs.push({ a: [u.e, u.y + 0.1, u.n], c, r: 0.03 + 0.012 * u.H }); }); } }
    const putMass = (c, i, mesh) => { const h = Math.abs(Math.sin(c.e * 12.9898 + c.n * 78.233) * 43758.5453) % 1; mesh.setMatrixAt(i, M4.compose(V4.set(c.e, c.y, -c.n), Q4.setFromAxisAngle(UP, h * 6.283), S4.set(c.r * 1.14, c.r * (c.flat || 1) * 1.05, c.r * 1.14)));
      const k = 0.9 + 0.2 * h; mesh.setColorAt(i, tintC.setRGB(k * (0.8 + 0.5 * c.hue), k * (0.92 + 0.12 * c.hue), k * (0.98 - 0.2 * c.hue))); };
    for (let i = 0; i < 3; i++) { plants.push(instanced(massGeos[i], mN[i], putMass)); await ctx.yield(); }
    plants.push(instanced(limbGeo, limbs, (q, i, mesh) => { const dx = q.c.e - q.a[0], dy = q.c.y - q.c.r * (q.c.flat || 1) * 0.45 - q.a[1], dz = -q.c.n + q.a[2], len = Math.hypot(dx, dy, dz) || 1;
      mesh.setMatrixAt(i, M4.compose(V4.set(q.a[0], q.a[1] - 0.3, -q.a[2]), Q4.setFromUnitVectors(UP, AX.set(dx / len, dy / len, dz / len)), S4.set(q.r, len, q.r))); mesh.setColorAt(i, tintC.setRGB(1, 1, 1)); }));
    await ctx.yield();
    // PALMS on the beach's back: three kinds, each leaning as the plan deals it
    const palmPal = { leaf: PAL.palm, leafLight: '#b9d46a', leafDark: '#2f5f38', bark: '#b9ad92', barkDark: '#7f7460' };
    const palmGeos = [[12, 11], [14, 13], [16, 12]].map(([h, fr], i) => flora.palmGeometry({ rng: S.shapes.fork('palm' + i), height: h, detail: 1, fronds: fr, coconuts: false, curve: 0.35, ...palmPal }));
    for (let kd = 0; kd < 3; kd++) plants.push(instanced(palmGeos[kd], L.palms.filter((q) => q.kind === kd), (q, i, mesh) => { const b = P.onBearing(q.brg);
      Q4.setFromAxisAngle(AX.set(-b[1], 0, -b[0]).normalize(), q.lean * Math.PI / 180).multiply(new THREE.Quaternion().setFromAxisAngle(UP, q.rot));
      mesh.setMatrixAt(i, M4.compose(V4.set(q.e, q.y, -q.n), Q4, S4.set(q.s, q.s, q.s))); mesh.setColorAt(i, tintC.setRGB(1, 1, 1)); }));
    // TREE FERNS: by the stream; and in the basin back from the lips, in the place's light (the sky's, the water's on
    // the side toward it and the heart's gold): green, never a black shape; none stands before the way out
    const fernGeos = [0, 1].map((i) => flora.palmGeometry({ rng: S.shapes.fork('fern' + i), height: 5, detail: 0, fronds: 9, coconuts: false, curve: 0.1 + 0.12 * i, leaf: '#3f7f3e', leafLight: '#7fb65a', leafDark: '#24523a', bark: '#5f5a48', barkDark: '#3f4438' }));
    const putFern = (f, i, mesh) => { const sc = f.H / 5; mesh.setMatrixAt(i, M4.compose(V4.set(f.e, f.y, -f.n), Q4.setFromAxisAngle(UP, f.rot), S4.set(sc, sc, sc))); const k = f.basin ? 2.1 : 1; mesh.setColorAt(i, tintC.setRGB(k, k * 1.04, k * 0.9)); };
    const watOf = (e, n, k) => { const w = waterAt(e, n); return [w[2], w[3], w[0] * k, w[1]]; };
    for (let kd = 0; kd < 2; kd++) { plants.push(instanced(fernGeos[kd], L.ferns.filter((f) => f.kind === kd && !f.basin), putFern));
      plants.push(instanced(fernGeos[kd].clone(), L.ferns.filter((f) => f.kind === kd && f.basin), putFern, basinMat, (f) => watOf(f.e, f.n, 1.5))); }
    // (no rest here: this step and the next are short, and one frame holds both)

    // ---------- THE FOREST'S FLOOR: low ferns, broad-leaved plants and seedlings ('understory'), mossed stones ('floor'),
    // and the small plants rooted in the concrete's cracks. Plants and stone: sun and sky only. ----------
    {
      const cL0 = L3('#4f7f48'), cL1 = L3('#78a856'), cL2 = L3('#b8d67e'), cS0 = L3('#8d8f80'), cS1 = L3('#b7b8a6'), cMs = L3(PAL.moss);
      // a broad-leaved plant: seven broad arching leaves from one foot, a metre tall at this size
      const broad = (() => { const G = PG(1);
        for (let k = 0; k < 7; k++) { const a = k * 2.39996 + 0.4 * Math.sin(k * 1.7), up = 0.55 + 0.4 * ((k * 5) % 7) / 7, len = 0.62 + 0.3 * ((k * 3) % 7) / 7, c = Math.cos(a), s = Math.sin(a), w = 0.2 * len;
          const at = (t, sd) => [c * len * t * (1 - 0.25 * t) + -s * w * sd, up * (t * 1.25 - 0.55 * t * t), s * len * t * (1 - 0.25 * t) + c * w * sd], nr = [c * 0.3, 0.9, s * 0.3];
          const i0 = G.v(at(0.05, 0), nr, cL0, 0, 0, 1), i1 = G.v(at(0.5, -1), nr, cL1, 0.1, 0.4, 1), i2 = G.v(at(0.5, 1), nr, cL1, 0.1, 0.4, 1), i3 = G.v(at(1, 0), nr, cL2, 0.2, 0.8, 1), i4 = G.v(at(0.55, 0), nr, cL0, 0.1, 0.4, 1);
          G.ix.push(i0, i1, i4, i0, i4, i2, i1, i3, i4, i4, i3, i2); }
        return G.build(); })();
      // a seedling: a thin stem with five small leaves, a metre tall at this size
      const seedling = (() => { const G = PG(1), st = [G.v([-0.02, 0, 0], [0, 0.2, 1], cL0), G.v([0.02, 0, 0], [0, 0.2, 1], cL0), G.v([0, 0.82, 0], [0, 0.2, 1], cL1, 0.2, 0.2)]; G.ix.push(st[0], st[1], st[2]);
        for (let k = 0; k < 5; k++) { const a = k * 2.39996, y = 0.42 + 0.115 * k, len = 0.3 - 0.03 * k, c = Math.cos(a), s = Math.sin(a), nr = [c * 0.4, 0.85, s * 0.4];
          const i0 = G.v([0, y, 0], nr, cL0, 0.15, 0.3, 1), i1 = G.v([c * len * 0.5 - s * 0.09, y + 0.07, s * len * 0.5 + c * 0.09], nr, cL1, 0.2, 0.6, 1), i2 = G.v([c * len * 0.5 + s * 0.09, y + 0.07, s * len * 0.5 - c * 0.09], nr, cL1, 0.2, 0.6, 1), i3 = G.v([c * len, y + 0.03, s * len], nr, cL2, 0.25, 0.9, 1);
          G.ix.push(i0, i1, i2, i1, i3, i2); }
        return G.build(); })();
      const lowFern = flora.fernGeometry({ rng: S.shapes.fork('lowfern'), size: 1, fronds: 6, detail: 0, leaf: '#78a856', leafLight: '#b8d67e', leafDark: '#4f7f48' });
      // a stone at unit breadth: a lumpy round, grey below and mossed on top
      const stone = (() => { const G = PG(1), ico = new THREE.IcosahedronGeometry(0.5, 1), pa = ico.attributes.position, idx = new Map();
        for (let i = 0; i < pa.count; i++) { const d = [pa.getX(i), pa.getY(i), pa.getZ(i)], key = d.map((q) => Math.round(q * 1e3)).join(','); let id = idx.get(key);
          if (id === undefined) { const lump = 1 + 0.22 * Math.sin(d[0] * 7.1 + d[1] * 4.3 + 1.7) * Math.cos(d[2] * 6.7 - d[0] * 3.3), up = d[1] * 2; id = G.v([d[0] * lump, d[1] * lump, d[2] * lump], [d[0] * 2, d[1] * 2, d[2] * 2], mixC(mixC(cS0, cS1, clamp(up * 0.5 + 0.5, 0, 1)), cMs, smoothstep(0.2, 0.75, up) * 0.8)); idx.set(key, id); }
          G.ix.push(id); }
        ico.dispose(); return G.build(); })();
      const small = [...L.under.filter((u) => u.kind < 3), ...L.cplants], shown = (u, i) => thin === 1 || i % 2 === 0;
      const putSmall = (sx, sy) => (u, i, mesh) => { const h = Math.abs(Math.sin(u.e * 12.9898 + u.n * 78.233) * 43758.5453) % 1; mesh.setMatrixAt(i, M4.compose(V4.set(u.e, u.y, -u.n), Q4.setFromAxisAngle(UP, u.rot), S4.set(sx(u), sy(u), sx(u)))); const k = 1.25 + 0.45 * h; mesh.setColorAt(i, tintC.setRGB(k * (0.9 + 0.25 * h), k, k * (1 - 0.15 * h))); };
      plants.push(instanced(lowFern, small.filter((u, i) => u.kind === 0 && shown(u, i)), putSmall((u) => (0.55 * u.H + 0.2) / 1.45, (u) => 0.8 * u.H / 0.54)));
      plants.push(instanced(broad, small.filter((u, i) => u.kind === 1 && shown(u, i)), putSmall((u) => (0.55 * u.H + 0.2) / 0.95, (u) => u.H * 0.8)));
      plants.push(instanced(seedling, small.filter((u, i) => u.kind === 2 && shown(u, i)), putSmall((u) => (0.55 * u.H + 0.2) / 0.34, (u) => u.H * 0.8)));
      // BOULDERS on the basin's floor ('boulders'): the walls' own rock at two to four metres, in clusters, mossed on
      // top; and ferns grown tall in the shelter of each cluster's great stone ('flowers' deals them)
      const boulder = (() => { const G = PG(1), ico = new THREE.IcosahedronGeometry(0.5, 1), pa = ico.attributes.position;
        const lump = (d) => 1 + 0.3 * Math.sin(d[0] * 5.1 + d[1] * 3.3 + 1.7) * Math.cos(d[2] * 4.7 - d[0] * 2.3) + 0.12 * Math.sin(d[1] * 9 + d[2] * 7);
        for (let i = 0; i < pa.count; i += 3) { const t = [0, 1, 2].map((k) => { const d = [pa.getX(i + k), pa.getY(i + k), pa.getZ(i + k)], l = lump(d); return [d[0] * l, Math.max(d[1] * l, -0.3), d[2] * l]; });
          const ux = t[1][0] - t[0][0], uy = t[1][1] - t[0][1], uz = t[1][2] - t[0][2], vx = t[2][0] - t[0][0], vy = t[2][1] - t[0][1], vz = t[2][2] - t[0][2]; let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
          const col = mixC(mixC(cS0, cS1, clamp(0.5 + 0.5 * ny + 0.3 * Math.sin(i * 1.7), 0, 1)), cMs, smoothstep(0.5, 0.88, ny) * 0.85); for (const p of t) G.ix.push(G.v(p, [nx, ny, nz], col)); }
        ico.dispose(); return G.build(); })();
      plants.push(instanced(boulder, L.boulders, (q, i, mesh) => { const h = Math.abs(Math.sin(q[0] * 9.1 + q[1] * 3.7) * 43.7) % 1; mesh.setMatrixAt(i, M4.compose(V4.set(q[0], q[2] + 0.3 * q[3] * q[5], -q[1]), Q4.setFromAxisAngle(UP, q[4]), S4.set(q[3], q[3] * q[5], q[3] * (0.72 + 0.28 * h))));
        const k = 1.0 + 0.25 * h; mesh.setColorAt(i, tintC.setRGB(k, k, k * 0.95)); }));
      { const rf = S.flowers.fork('ferns'), list = [];
        L.boulders.forEach((q, i) => { if (i > 0 && L.boulders[i - 1][6] === q[6]) return; const set = [], cnt = rf.int(5, 7);
          for (let j = 0; j < cnt; j++) { const a = rf.range(0, 6.2832), d = q[3] * 0.5 + rf.range(0.4, 3.2), e = q[0] + Math.sin(a) * d, n = q[1] + Math.cos(a) * d, H = rf.range(1.0, 1.9), rot = rf.range(0, 6.2832);
            if (P.riftAt(e, n)[0] < 1.2 || P.nearLine(e, n)[0] < 6) continue; set.push({ e, n, y: P.groundAt(e, n) - 0.05, rot, H }); }
          while (P.BARRED.has(set.length)) set.pop(); list.push(...set); });
        plants.push(instanced(lowFern, list, putSmall((u) => (0.55 * u.H + 0.2) / 1.45 * 1.5, (u) => 0.8 * u.H / 0.54))); }
      // STONES IN THE STREAM ('pebbles'): rounded stones breaking the water every few metres from the beach's head to
      // the cascades' foot, each with a tail of foam lying down the current from it
      { const rp = S.pebbles, pts = P.streamPoints(104, 396, 1.5), list = [], tails = [], fp = [], fc = [], fi = [];
        for (let i = 2 + rp.int(0, 2); i < pts.length - 2; i += rp.int(2, 5)) { const p = pts[i], a = pts[i - 1], b = pts[i + 1], dl = Math.hypot(b[0] - a[0], b[2] - a[2]) || 1, tx = (b[0] - a[0]) / dl, tz = (b[2] - a[2]) / dl;
          const off = rp.range(-1.5, 1.5), x = p[0] - tz * off, z = p[2] + tx * off, br = rp.range(0.55, P.nearLine(x, -z)[0] < 6 ? 0.85 : 1.35), hr = rp.range(0.5, 0.75); list.push([x, -z, p[1] - 0.12, br, rp.range(0, 6.283), hr]); tails.push([x, p[1] + 0.035, z, tx, tz, br]); }
        while (P.BARRED.has(list.length)) { list.pop(); tails.pop(); }
        // (each tail a soft round of foam just down the current from its stone, clear at its rim)
        for (const [x, y, z, tx, tz, br] of tails) { const r = br * 0.6, cx = x + tx * br * 0.6, cz = z + tz * br * 0.6, i0 = fp.length / 3; fp.push(cx, y, cz); fc.push(0.66, 0.72, 0.7, 0.55);
          for (let k = 0; k < 8; k++) { const a = k * 0.7854, ca = Math.cos(a) * r * 1.25, sa = Math.sin(a) * r * 0.8; fp.push(cx + tx * ca - tz * sa, y, cz + tz * ca + tx * sa); fc.push(0.66, 0.72, 0.7, 0); fi.push(i0, i0 + 1 + k, i0 + 1 + (k + 1) % 8); } }
        const pebble = (() => { const G = PG(1), ico = new THREE.IcosahedronGeometry(0.5, 0), pa = ico.attributes.position;
          for (let i = 0; i < pa.count; i += 3) { const t = [0, 1, 2].map((k) => { const d = [pa.getX(i + k), pa.getY(i + k), pa.getZ(i + k)], l = 1 + 0.2 * Math.sin(d[0] * 5.1 + d[1] * 3.3 + 1.7) * Math.cos(d[2] * 4.7); return [d[0] * l, d[1] * l, d[2] * l]; });
            const ux = t[1][0] - t[0][0], uy = t[1][1] - t[0][1], uz = t[1][2] - t[0][2], vx = t[2][0] - t[0][0], vy = t[2][1] - t[0][1], vz = t[2][2] - t[0][2]; let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
            const col = mixC(mixC(cS0, cS1, clamp(0.5 + 0.5 * ny, 0, 1)), cMs, smoothstep(0.55, 0.9, ny) * 0.6); for (const p of t) G.ix.push(G.v(p, [nx, ny, nz], col)); }
          ico.dispose(); return G.build(); })();
        plants.push(instanced(pebble, list, (q, i, mesh) => { mesh.setMatrixAt(i, M4.compose(V4.set(q[0], q[2] + 0.3 * q[3] * q[5], -q[1]), Q4.setFromAxisAngle(UP, q[4]), S4.set(q[3], q[3] * q[5], q[3] * 0.85))); mesh.setColorAt(i, tintC.setRGB(0.8, 0.84, 0.8)); }));
        const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(fp, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(fc, 4)); g.setIndex(fi); g.computeBoundingSphere();
        const mesh = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, depthWrite: false, side: THREE.DoubleSide })); mesh.name = 'foam at the stream\'s stones'; mesh.renderOrder = 6; scene.add(mesh); }
      plants.push(instanced(stone, L.stones, (q, i, mesh) => { mesh.setMatrixAt(i, M4.compose(V4.set(q[0], q[2] + 0.3 * q[3] * q[5], -q[1]), Q4.setFromAxisAngle(UP, q[4]), S4.set(q[3], q[3] * q[5], q[3] * (0.7 + 0.3 * (Math.abs(Math.sin(q[0] * 9.1 + q[1] * 3.7) * 43.7) % 1))))); const k = 0.9 + 0.2 * (Math.abs(Math.sin(q[0] * 3.3 + q[1] * 7.9) * 97.3) % 1); mesh.setColorAt(i, tintC.setRGB(k, k, k)); }));
    }
    await ctx.yield();

    // ---------- THE RIFTS' LIPS: the meadow's own limestone, broken at each fissure ----------
    // Nothing built: no block, no row, no stack, no step, no slab. Each side of each rift is one unbroken, irregular
    // edge of the same pale rock, made from the plan's run of places along it: a wet face rising out of the water, a
    // rounded shoulder, a crown that rises and falls by 0.2 to 1.2 m along the run and leans this way or that, and a
    // back that sinks into the meadow; it sinks to nothing at a run's ends. Moss lies in its hollows and on its back,
    // and the sedge grows up through it. The side toward the water takes the water's light (most on the wet face,
    // little on the back). Stone only: nothing that grows is in this mesh.
    {
      const sp = [], sc = [], sw = [], si = [], cLime = C3('#9c9478'), cLime2 = C3('#7a7862'), cMossy = C3(PAL.moss), cWetR = C3('#8d9488'), tc = new THREE.Color(), MD = P.K.MEADOW, WL = P.K.WATER;
      const nAcc = [], ROWS = 6;
      const sv = (e, y, n, face, mossy, wetK) => { const f1 = noise.n2(e * 0.9, n * 0.9), f2 = noise.fbm2(e * 0.23 + 3, n * 0.23, 2), w = waterAt(e, n);
        tc.copy(cLime).lerp(cLime2, clamp(0.5 + f1, 0, 1)).lerp(cMossy, clamp(mossy * smoothstep(-0.15, 0.35, f2), 0, 0.85)).lerp(cWetR, wetK).multiplyScalar(0.9 + 0.16 * f1);
        sp.push(e, y, -n); sc.push(tc.r, tc.g, tc.b); sw.push(P.waterLightAt(e, n) * face, w[1]); nAcc.push(0, 0, 0); return sp.length / 3 - 1; };
      // every triangle is wound to look outward (up, and toward the water on the wet face)
      const tri = (a, b, c, rx, ry, rz) => { const ux = sp[b * 3] - sp[a * 3], uy = sp[b * 3 + 1] - sp[a * 3 + 1], uz = sp[b * 3 + 2] - sp[a * 3 + 2], vx = sp[c * 3] - sp[a * 3], vy = sp[c * 3 + 1] - sp[a * 3 + 1], vz = sp[c * 3 + 2] - sp[a * 3 + 2];
        let fx = uy * vz - uz * vy, fy = uz * vx - ux * vz, fz = ux * vy - uy * vx; if (fx * rx + fy * ry + fz * rz < 0) { si.push(a, c, b); fx = -fx; fy = -fy; fz = -fz; } else si.push(a, b, c);
        for (const q of [a, b, c]) { nAcc[q * 3] += fx; nAcc[q * 3 + 1] += fy; nAcc[q * 3 + 2] += fz; } };
      let steps = 0;
      for (const strip of L.lips) { const run = strip.run; let prev = null, prevQ = null;
        for (let i = 0; i < run.length; i++) { const q = run[i]; if (q.gap) { prev = null; continue; }
          // (how far this place stands from its run's end or from a break in it: the lip sinks to the meadow there)
          let k0 = 0, k1 = 0; while (k0 < 3 && i - k0 - 1 >= 0 && !run[i - k0 - 1].gap) k0++; while (k1 < 3 && i + k1 + 1 < run.length && !run[i + k1 + 1].gap) k1++;
          // (broken rock: every place along the run stands a little higher or lower than its neighbours, and here and
          // there the crown is notched down to a third)
          const hs = Math.abs(Math.sin(q.e * 12.9898 + q.n * 78.233) * 43758.5453) % 1, hs2 = Math.abs(Math.sin(q.e * 39.346 + q.n * 11.135) * 24634.633) % 1;
          const ramp = Math.min(1, (Math.min(k0, k1) + 0.35) / 2.6), h = q.h * ramp * (hs2 < 0.16 ? 0.35 : 0.66 + 0.34 * hs), j1 = noise.n2(q.e * 1.3 + 5, q.n * 1.3), j2 = noise.n2(q.e * 0.7 - 8, q.n * 0.7 + 3), j3 = noise.n2(q.e * 2.1, q.n * 2.1 + 9);
          const at = (d, y, face, mossy, wetK) => sv(q.e + q.nx * d, y, q.n + q.nn * d, face, mossy, wetK);
          const row = [at(-0.55, WL - 0.7, 1, 0, 1), at(-0.06 + 0.1 * j3, WL + 0.04, 1, 0, 0.8), at(0.22 + 0.16 * j1 + 0.2 * (hs - 0.5), MD + 0.5 * h + 0.1 * j3, 0.8, 0.1, 0.25),
            at(q.w * (0.36 + 0.1 * j2 + 0.12 * (hs2 - 0.5)), MD + Math.min(1.2, h * (1 + 0.3 * q.tilt) + 0.07 * j1), 0.34, 0.5, 0), at(q.w * (0.92 + 0.1 * j1 + 0.14 * (hs - 0.5)), MD + h * (0.78 - 0.3 * q.tilt) + 0.07 * j2, 0.14, 0.75, 0), at(q.w + 0.8 + 0.6 * h + 0.3 * j2, MD - 0.14, 0.05, 1, 0)];
          if (prev) for (let r = 0; r + 1 < ROWS; r++) { const a = r < 2 ? 1.6 : 0.25, rx = -(q.nx + prevQ.nx) * a, rz = (q.nn + prevQ.nn) * a; tri(prev[r], row[r], row[r + 1], rx, 2, rz); tri(prev[r], row[r + 1], prev[r + 1], rx, 2, rz); }
          prev = row; prevQ = q; if (++steps % 400 === 0) await ctx.yield(); } }
      for (let i = 0; i < nAcc.length; i += 3) { const l = Math.hypot(nAcc[i], nAcc[i + 1], nAcc[i + 2]) || 1; nAcc[i] /= l; nAcc[i + 1] /= l; nAcc[i + 2] /= l; }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nAcc, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(sc, 3));
      g.setAttribute('aWat', new THREE.Float32BufferAttribute(sw, 2)); g.setIndex(si); g.computeBoundingSphere();
      const m = new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true });
      // the rock's grain, by place: a fine mottle, hairline cracks and small blooms of moss (never a mark or a pattern)
      m.onBeforeCompile = (sh) => { sh.vertexShader = 'varying vec3 vRockW;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n  vRockW = (modelMatrix * vec4(transformed, 1.0)).xyz;');
        sh.fragmentShader = 'varying vec3 vRockW;\n' + NOISE_GLSL + '\n' + sh.fragmentShader.replace('#include <color_fragment>', `#include <color_fragment>
          { vec2 rq = vRockW.xz + vRockW.y * 0.7; float rm = 0.6 * wN(rq * 1.9) + 0.4 * wN(rq * 5.3 + 3.1);
            float rc = (1.0 - smoothstep(0.0, 0.03, abs(wN(rq * 0.9 + 17.0) - 0.5))) * step(0.45, wN(rq * 0.21 + 4.0));
            diffuseColor.rgb *= (0.82 + 0.36 * rm) * (1.0 - 0.5 * rc);
            diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.2, 0.3, 0.13), smoothstep(0.62, 0.8, wN(rq * 0.8 + 9.0)) * 0.6); }`); };
      P.underSun(m, SU, 'stone'); underWater(m, 'stone', false); const mesh = new THREE.Mesh(g, m); mesh.name = 'the rifts\' lips'; scene.add(mesh);
    }
    // (no rest here: this step and the next are short, and one frame holds both)

    // ---------- THE MEADOW'S FLOOR VARIES: sedge in clumps (tall and thick where it gathers, thin between, open grass
    // where it fails), thick by the line and thinner out to 62 m aside; and DRIFTS OF FLOWERS ('flowers') ----------
    // Plants: sun and sky only, the water's light where it lands on them (within some 12 m of a rift) and the
    // heart's gold by their place; nothing here shines of itself.
    {
      const rs = S.sedge, tufts = [0, 1, 2].map((i) => flora.grassTuftGeometry({ rng: rs.fork('t' + i), cards: 2, width: 1.25, height: 0.8, root: '#4f7a2e', tip: '#cfe672' })), lists = [[], [], []];
      const cA = C3('#a6cc5e'), cB = C3('#6fa348'), MD = P.K.MEADOW;
      for (let n = 462; n < 742; n += 1.5) { for (let e = -70; e < 100; e += 1.5) { const j1 = rs(), j2 = rs(), j3 = rs(), aside = P.asideOfWay(e, n);
        if (aside > 62 || j3 > thin * (aside < 20 ? 1 : aside < 40 ? 0.46 : 0.22)) continue;
        // (where the sedge gathers: a field of the place, some 20 m from clump to clump)
        const pe = e + (j1 - 0.5) * 1.4, pn = n + (j2 - 0.5) * 1.4, fld = noise.fbm2(pe * 0.05 + 7, pn * 0.05 - 3, 2), dens = 0.05 + 0.95 * smoothstep(-0.2, 0.1, fld), tall = smoothstep(0.08, 0.34, fld);
        if (j3 > thin * (aside < 20 ? 1 : aside < 40 ? 0.46 : 0.22) * dens) continue;
        const r = P.riftAt(pe, pn); if (r[0] < (r[1] > 5 ? 2.2 : 1.25) || P.nearShip(pe, pn, -4)) continue; const h = P.groundAt(pe, pn); if (h < MD - 0.25 || h > MD + 3.5 || (pn < 505 && P.streamAt(pe, pn)[0] < 2.6)) continue;
        const w = waterAt(pe, pn); lists[Math.floor(j3 * 97) % 3].push({ e: pe, n: pn, y: h - 0.04, s: (0.7 + 0.6 * j1) * (1 + 0.85 * tall), rot: j2 * 6.283, f: noise.n2(pe * 0.08, pn * 0.08), w0: w[0] * 1.5, w1: w[1] }); }
        if (Math.round(n * 2) % 180 === 0) await ctx.yield(); }
      for (let i = 0; i < 3; i++) { const list = lists[i]; await ctx.yield(); plants.push(instanced(tufts[i], list, (q, k, mesh) => { mesh.setMatrixAt(k, M4.compose(V4.set(q.e, q.y, -q.n), Q4.setFromAxisAngle(UP, q.rot), S4.set(q.s, q.s * (0.85 + 0.3 * q.f), q.s)));
        tintC.copy(cA).lerp(cB, clamp(0.5 + q.f, 0, 1)).multiplyScalar(2.5); mesh.setColorAt(k, tintC); }, basinMat, (q) => [0, 0, q.w0, q.w1])); }
      await ctx.yield();
      // FLOWER DRIFTS: each drift is one kind (cream, rose or gold), some 5 to 13 m across, thickest at its middle;
      // a clump is five small heads on thin stems, a third to half a metre tall
      const flower = (() => { const G = PG(1), cSt = [0.3, 0.42, 0.22], cHd = [1, 1, 1];
        for (let k = 0; k < 5; k++) { const a = k * 2.39996 + 0.7, r = 0.1 + 0.34 * ((k * 3) % 5) / 5, hg = 0.34 + 0.2 * ((k * 2) % 5) / 5, c = Math.cos(a), s = Math.sin(a), x = c * r, z = s * r, nr = [c * 0.45, 0.85, s * 0.45], wd = 0.13;
          if (k < 2) G.ix.push(G.v([x * 0.3 - s * 0.012, 0, z * 0.3 + c * 0.012], nr, cSt, 0, 0, 1), G.v([x * 0.3 + s * 0.012, 0, z * 0.3 - c * 0.012], nr, cSt, 0, 0, 1), G.v([x, hg, z], nr, cSt, 0.25, 0.5, 1));
          const h0 = G.v([x + s * wd, hg, z - c * wd], nr, cHd, 0.25, 0.6, 1), h1 = G.v([x + c * wd * 0.8, hg - 0.05, z + s * wd * 0.8], nr, cHd, 0.25, 0.6, 1), h2 = G.v([x - s * wd, hg, z + c * wd], nr, cHd, 0.25, 0.6, 1), h3 = G.v([x - c * wd * 0.8, hg + 0.05, z - s * wd * 0.8], nr, cHd, 0.25, 0.6, 1);
          G.ix.push(h0, h1, h2, h0, h2, h3); }
        return G.build(); })();
      const rf = S.flowers, B = P.K.BASIN, kinds = [C3('#fff1d0'), C3('#f24a3c'), C3('#ffc640')], fl = [];
      for (let d = 0, tries = 0; d < 24 && tries < 300; tries++) { const a = rf.range(0, 6.2832), rho = Math.sqrt(rf.range(0, 0.7)), de = B.e + Math.sin(a) * rho * B.re, dn = B.n + Math.cos(a) * rho * B.rn, R = rf.range(7, 15), kind = rf.int(0, 2), cnt = Math.round(R * R * 0.55 * thin);
        if (dn < 470 || Math.abs(P.groundAt(de, dn) - MD) > 0.4) continue; d++;
        for (let i = 0; i < cnt; i++) { const b = rf.range(0, 6.2832), q = R * Math.pow(rf(), 0.7), pe = de + Math.sin(b) * q, pn = dn + Math.cos(b) * q * 0.7, sc = rf.range(0.9, 1.5), rot = rf.range(0, 6.2832), h = P.groundAt(pe, pn);
          if (Math.abs(h - MD) > 0.5 || P.riftAt(pe, pn)[0] < 1.0) continue; fl.push({ e: pe, n: pn, y: h - 0.02, sc, rot, kind, f: rf() }); }
        if (d % 5 === 0) await ctx.yield(); }
      plants.push(instanced(flower, fl, (q, k, mesh) => { mesh.setMatrixAt(k, M4.compose(V4.set(q.e, q.y, -q.n), Q4.setFromAxisAngle(UP, q.rot), S4.set(q.sc, q.sc, q.sc))); tintC.copy(kinds[q.kind]).multiplyScalar(1.35 + 0.4 * q.f); mesh.setColorAt(k, tintC); }, basinMat, () => [0, 0, 0, 0]));
    }
    // (no rest here: this step and the next are short, and one frame holds both)

    // ---------- THE BASIN'S MIST (a medium, never a body; it stands where the plan deals it and is as thick at any
    // distance from the eye) ----------
    // Vapour lit from below by the water it stands on: brightest, aqua-white, at its foot and fading upward; its
    // light is ADDED to what stands behind it, so that a sheet is always paler than whatever is behind and never a
    // dark form. Low breath over every rift near the line; tall thin sheets, streaked and ragged, over the far ones,
    // many, one behind another; the Springhead's pool between its two low walls. Each rises at a rift's east lip,
    // lives one slow breath (20 to 30 s) and drifts half a metre a second down the wind while it leans.
    const mistDensity = clamp((0.4 + 0.22 * wet) * density, 0.28, 0.75);
    {
      const g = new THREE.InstancedBufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute([-0.5, 0, 0, 0.5, 0, 0, 0.5, 1, 0, -0.5, 1, 0], 3)); g.setIndex([0, 1, 2, 0, 2, 3]);
      const at = [], sz = []; for (const q of L.mist) { at.push(q[0], q[2], -q[1], q[5] === 1 ? 1 : q[5] === 2 ? 0.2 : 0); sz.push(q[3], q[4], q[6], q[7]); }
      g.setAttribute('aAt', new THREE.InstancedBufferAttribute(new Float32Array(at), 4)); g.setAttribute('aSz', new THREE.InstancedBufferAttribute(new Float32Array(sz), 4)); g.instanceCount = L.mist.length;
      const m = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending,
        uniforms: { uTime: U.time, uWind: { value: new THREE.Vector2(0.866, 0.5) }, uK: { value: mistDensity }, uFoot: { value: new THREE.Color(0.4, 0.55, 0.52) }, uHigh: { value: new THREE.Color(0.24, 0.3, 0.32) }, uHeart: SU.uHeart, uHeartC: SU.uHeartC, uHeartF: SU.uHeartF },
        vertexShader: /* glsl */`attribute vec4 aAt; attribute vec4 aSz; uniform float uTime; uniform vec2 uWind; varying vec3 vUv; varying vec3 vP; varying float vA;
          void main() { float life = fract(uTime / aSz.w + aSz.z); vec3 base = aAt.xyz; base.xz += uWind * (0.5 * aSz.w * (life - 0.35));
            vec2 tc = cameraPosition.xz - base.xz; vec2 right = normalize(vec2(tc.y, -tc.x) + vec2(1e-4, 0.0)); vec3 p = base; float y = position.y;
            p.xz += right * position.x * aSz.x * (1.0 + 0.35 * y * aAt.w); p.y += y * aSz.y;
            p.xz += uWind * (y * y * aSz.y * mix(0.3, 0.42, aAt.w)) + right * (sin(uTime * 0.21 + aSz.z * 40.0 + y * 2.0) * 0.4 * y * aAt.w);
            vUv = vec3(position.x * 2.0, y, aAt.w); vP = p; float s = sin(3.14159 * life); vA = s * sqrt(s);
            gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0); }`,
        fragmentShader: NOISE_GLSL + /* glsl */`uniform float uTime, uK; uniform vec3 uFoot, uHigh, uHeartC; uniform vec4 uHeart; uniform vec2 uHeartF; varying vec3 vUv; varying vec3 vP; varying float vA;
          void main() { float x = vUv.x, y = vUv.y;
            float st = 0.55 + 0.45 * wN(vec2(x * 3.1 + vP.x * 0.21 + vP.z * 0.17, y * 1.3 - uTime * 0.06));
            float wv = 0.6 + 0.4 * wN(vec2(x * 1.3 + vP.z * 0.11, y * 4.2 - uTime * 0.11 + vP.x * 0.07));
            float top = 1.0 - smoothstep(mix(0.12, 0.3, vUv.z), mix(0.55, 0.72, vUv.z) + mix(0.4, 0.28, vUv.z) * wN(vec2(x * 2.3 + vP.x * 0.13, uTime * 0.04 + vP.z * 0.09)), y);
            float a = exp(-x * x * 3.4) * (1.0 - smoothstep(0.75, 1.0, abs(x))) * smoothstep(0.0, 0.05, y) * top * st * wv * vA * uK;
            vec2 hd = vP.xz - uHeart.xz; float gl = dot(hd, hd) + (vP.y - uHeart.y) * (vP.y - uHeart.y);
            float hk = smoothstep(-3.0, 6.0, dot(hd, uHeartF)) / (1.0 + gl * 0.0016) * (1.0 - smoothstep(120.0, 200.0, sqrt(gl)));
            gl_FragColor = vec4((mix(uFoot, uHigh, smoothstep(0.0, 0.6, y)) + uHeartC * (1.6 * hk)) * clamp(a * mix(1.1, 2.0, vUv.z), 0.0, 1.0), 1.0);
            #include <tonemapping_fragment>
            #include <colorspace_fragment>
          }` });
      const mesh = new THREE.Mesh(g, m); mesh.name = 'the basin\'s mist'; mesh.frustumCulled = false; mesh.renderOrder = 4; scene.add(mesh);
    }
    await ctx.yield();

    // ---------- THE FAR FOREST ('far'): a layered roof of crown forms on the slopes beyond the near trees, emergent
    // crowns standing over it, the basin's walls among them ----------
    // Plants: sun and sky only; a crown in a ridge's shade is dark blue-green, a crown on a sunlit crest gold-green.
    {
      const rf = S.far, list = [], B = P.K.BASIN, G = PG(), ico = new THREE.IcosahedronGeometry(1, 0), pa = ico.attributes.position, idx = new Map();
      for (let i = 0; i < pa.count; i++) { const d = [pa.getX(i), pa.getY(i), pa.getZ(i)], key = d.map((q) => Math.round(q * 1e3)).join(','); let id = idx.get(key);
        if (id === undefined) { const s = d[1] * 0.5 + 0.5; id = G.v([d[0], d[1] * 0.62 + 0.1, d[2]], d, [0.55 + 0.45 * s, 0.55 + 0.45 * s, 0.55 + 0.45 * s], 0.05, 0.12, 1); idx.set(key, id); } G.ix.push(id);
        if (i % 3 === 2 && pa.getY(i) + pa.getY(i - 1) + pa.getY(i - 2) < -1.6) G.ix.length -= 3; }
      ico.dispose(); const farGeo = G.build();
      const innerWall = (e, n) => { const de = e - B.e, dn = n - B.n, l = Math.hypot(de, dn) || 1; return P.groundAt(e + de / l * 14, n + dn / l * 14) > P.groundAt(e, n) - 0.5; };
      for (let n = 110; n < 1000; n += 17) { for (let e = -420; e < 420; e += 17) { const j1 = rf(), j2 = rf(), j3 = rf(), pe = e + (j1 - 0.5) * 15, pn = n + (j2 - 0.5) * 15;
        if (pn < 520 && Math.abs(pe) < 116 && pn > 124) continue;
        const rho = Math.hypot((pe - B.e) / B.re, (pn - B.n) / B.rn); if (rho < 1.0) continue; if (P.shoreDist(pe, pn) < 52) continue;
        const dl = P.asideOfWay(pe, pn); if (dl < 40 || dl > 372 || j3 > lerp(1, 0.4, smoothstep(150, 400, dl))) continue;
        // (the basin's inner walls, from their foot to the rim's crest, carry rooted trees and no crown form: a wall
        // is inner where the ground still climbs away from the basin's middle)
        if (rho < 1.6 && pn > 490 && innerWall(pe, pn)) continue;
        // (one crown in eight is an emergent: half again as broad, standing clear above the forest's roof)
        const h = P.groundAt(pe, pn), em = (j1 * 8) % 1 < 0.125 ? 1 : 0, r = lerp(7, 11.5, j3 * j1 * 2 % 1) * lerp(1, 1.5, smoothstep(160, 400, dl)) * (1 + 0.5 * em); list.push({ e: pe, n: pn, y: h + r * (0.55 + 0.45 * em), r, f: j2 }); }
        if (Math.round((n - 110) / 17) % 6 === 5) await ctx.yield(); }
      // THE BASIN'S WALLS ARE ROCK AND FOREST IN RELIEF ('walls'): trees ROOTED on the wall's ledges from its foot
      // to the rim's crest, each with its trunk seen and a crown of three leaf masses, leaning out a little over the
      // drop; more of them where the wall is less steep, none in a fall's recess or notch, none in the heart's
      // mouth, none within 45 m of the line. Vines lie down the steeper faces from the ledges' edges.
      {
        const rw = S.walls, wl = [], vines = [], Hh = P.HEART, hf = P.onBearing(Hh.face);
        for (let ring = 0; ring < 11; ring++) { const rho = 0.9 + 0.062 * ring, steps = Math.round((P.K.BASIN.re + P.K.BASIN.rn) * Math.PI * rho / 11.5), turn = rw() * 6.283;
          for (let i = 0; i < steps; i++) { const j1 = rw(), j2 = rw(), j3 = rw(), j4 = rw(), an = turn + (i + (j1 - 0.5) * 0.8) / steps * 6.283, rr = rho + (j2 - 0.5) * 0.055, pe = B.e + Math.sin(an) * B.re * rr, pn = B.n + Math.cos(an) * B.rn * rr;
            if (pn < 478 || P.asideOfWay(pe, pn) < 45) continue; const h = P.groundAt(pe, pn); if (h < P.K.MEADOW + 2.2 || !innerWall(pe, pn)) continue;
            if (P.FALLS.some((F) => { const de = pe - F.e, dn = pn - F.n, s = de * F.o[0] + dn * F.o[1], al = Math.abs(de * F.o[1] - dn * F.o[0]); return s > -72 && s < F.len + 4 && al < lerp(8, F.w0 + 3, clamp(s / F.len, 0, 1)); })) continue;
            { const de = pe - Hh.e, dn = pn - Hh.n, out = de * hf[0] + dn * hf[1], al = Math.abs(de * hf[1] - dn * hf[0]); if (out > -6 && out < 14 && al < Hh.hw + 5) continue; }
            const de = pe - B.e, dn = pn - B.n, l = Math.hypot(de, dn) || 1, ux = de / l, un = dn / l, slope = (P.groundAt(pe + ux * 3, pn + un * 3) - h) / 3;
            // (they stand in groves, with bare rock between: a field of the place)
            const grove = smoothstep(-0.22, 0.16, noise.fbm2(pe * 0.03 + 11, pn * 0.03 + 5, 2));
            if (j3 < (slope < 0.75 ? 0.9 : slope < 1.4 ? 0.58 : 0.18) * grove) wl.push({ e: pe, n: pn, y: h - 0.4, H: lerp(6.5, 15.5, j4) * (slope > 1.4 ? 0.7 : 1) * (0.75 + 0.7 * grove * j2), f: j2, rot: j1 * 6.283, lean: 0.06 + 0.16 * j4, ux, un });
            // (a vine: from a ledge's edge down the steep face below it, toward the basin's middle)
            else if (slope > 1.1 && j3 > 0.72) { const pts = []; for (let k = 0; k <= 4; k++) { const d = k * lerp(1.6, 3.2, j4), qe = pe - ux * d, qn = pn - un * d; pts.push([qe, P.groundAt(qe, qn) + 0.35, qn]); } vines.push({ pts, w: lerp(0.5, 1.1, j1), f: j2, sx: -un, sn: ux }); } }
          if (ring % 3 === 2) await ctx.yield(); }
        // one rooted tree at unit height: a stem to 0.62 of it, three leaf masses over the stem's top
        const G = PG(), cBk = L3('#8f8468'), cD = L3('#3f6a52'), cM = L3('#6f9a66'), cH = L3('#a8c684');
        tubeG(G, [[0, -0.06, 0, 0.04], [0.012, 0.34, 0.006, 0.027], [0, 0.66, 0, 0.016]], 5, () => cBk, (ri) => 0.02 * ri);
        for (const [cx, cy, cz, r, det] of [[0, 0.74, 0, 0.3, 0], [0.2, 0.62, 0.09, 0.21, 0], [-0.17, 0.66, -0.13, 0.19, 0]]) { const ico = new THREE.IcosahedronGeometry(1, det), pa = ico.attributes.position, idx = new Map();
          for (let i = 0; i < pa.count; i++) { const d = [pa.getX(i), pa.getY(i), pa.getZ(i)], key = d.map((q) => Math.round(q * 1e3)).join(','); let id = idx.get(key);
            if (id === undefined) { const s = d[1] * 0.5 + 0.5; id = G.v([cx + d[0] * r, cy + d[1] * r * 0.72, cz + d[2] * r], d, s < 0.5 ? mixC(cD, cM, s * 2) : mixC(cM, cH, s * 2 - 1), 0.05, 0.12, 1); idx.set(key, id); } G.ix.push(id); }
          ico.dispose(); }
        const wallGeo = G.build(), tC = new THREE.Color();
        plants.push(instanced(wallGeo, wl, (q, k, mesh) => { mesh.setMatrixAt(k, M4.compose(V4.set(q.e, q.y, -q.n), Q4.setFromAxisAngle(AX.set(-q.un, 0, -q.ux).normalize(), -q.lean).multiply(Q5.setFromAxisAngle(UP, q.rot)), S4.set(q.H, q.H * (0.9 + 0.2 * q.f), q.H)));
          const s = 0.85 + 0.3 * q.f; mesh.setColorAt(k, tC.setRGB(s, s, s * 0.96)); }));
        const vp = [], vc = [], vi = [], cV1 = L3('#3f6a4c'), cV2 = L3('#6f8a58');
        for (const v of vines) { const c = mixC(cV1, cV2, v.f); let prev = null; v.pts.forEach((p, k) => { const hw = v.w * (1 - 0.18 * k) * 0.5, i0 = vp.length / 3; vp.push(p[0] + v.sx * hw, p[1], -(p[2] + v.sn * hw), p[0] - v.sx * hw, p[1], -(p[2] - v.sn * hw)); const s = 1 - 0.1 * k; vc.push(c[0] * s, c[1] * s, c[2] * s, c[0] * s * 0.8, c[1] * s * 0.8, c[2] * s * 0.8);
          if (prev !== null) vi.push(prev, i0, i0 + 1, prev, i0 + 1, prev + 1); prev = i0; }); }
        if (vi.length) { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(vp, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(vc, 3)); g.setIndex(vi); g.computeVertexNormals(); g.computeBoundingSphere();
          const m = new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide }); P.underSun(m, SU, 'vines'); const mesh = new THREE.Mesh(g, m); mesh.name = 'vines down the basin\'s walls'; scene.add(mesh); }
      }
      const cG1 = C3('#6a9468'), cG2 = C3('#a8bc78');
      plants.push(instanced(farGeo, list, (q, k, mesh) => { mesh.setMatrixAt(k, M4.compose(V4.set(q.e, q.y, -q.n), Q4.setFromAxisAngle(UP, q.f * 6.283), S4.set(q.r, q.r * (0.8 + 0.4 * q.f), q.r)));
        tintC.copy(cG1).lerp(cG2, q.f); mesh.setColorAt(k, tintC); }));
    }
    await ctx.yield();

    // ---------- STEAM AT THE COWLS (a medium): thin pale wisps, one breath every five seconds, gone within four metres ----------
    // Three wisps a cowl, each cowl on its own dealt phase ('steam'). Steam takes the light of its place: blue-grey
    // in shade, gold where the low sun catches it; under two metres over the slab it takes the lamps' warm colour
    // where a lamp stands by (the roof's cowls), no higher. As a medium it thins toward the lens by its true distance
    // alone (full at 2.5 m, nothing inside 0.6 m); the cowls' places keep it off the line.
    const QUAD = () => { const g = new THREE.InstancedBufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute([-0.5, -0.5, 0, 0.5, -0.5, 0, 0.5, 0.5, 0, -0.5, 0.5, 0], 3)); g.setIndex([0, 1, 2, 0, 2, 3]); return g; };
    const IA = (g, name, arr, n) => g.setAttribute(name, new THREE.InstancedBufferAttribute(new Float32Array(arr), n));
    {
      const g = QUAD(), at = [], ph = [];
      for (const w of L.wisps) { const c = L.cowls[w.cowl]; if (c.gone) continue; const b = P.onBearing(c.turn), mouth = c.bent ? (0.2 + 0.05 * (c.h - 0.9)) * 3.8 : 0;
        at.push(c.e + b[0] * mouth, c.y + c.h + 0.25, -(c.n + b[1] * mouth), c.y - (c.plinth || 0)); ph.push(w.ph, w.lag, w.size * (wet ? 1.2 : 1), c.group === 1 ? 1 : 0); }
      IA(g, 'aAt', at, 4); IA(g, 'aPh', ph, 4); g.instanceCount = at.length / 4;
      const m = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, uniforms: { ...LIT, uTime: U.time, uLampDip: U.dip, uWind: { value: new THREE.Vector2(0.866, 0.5) }, uWarm: { value: new THREE.Color(1.0, 0.5, 0.18) }, uK: { value: 0.34 + 0.1 * wet } },
        vertexShader: /* glsl */`attribute vec4 aAt; attribute vec4 aPh; uniform float uTime; uniform vec2 uWind; varying vec2 vUv; varying vec3 vK; varying vec3 vP;` + P.DIP_GLSL + /* glsl */`
          void main() { float life = fract(uTime / 5.0 + aPh.x + aPh.y), breath = 0.7 + 0.3 * sin(6.2832 * (uTime / 5.0 + aPh.x));
            vec3 c = aAt.xyz + vec3(uWind.x * life * life * 1.3, life * 3.3, uWind.y * life * life * 1.3); c.x += 0.12 * sin(uTime * 1.7 + aPh.x * 30.0 + life * 5.0); vP = c;
            vec4 mv = viewMatrix * vec4(c, 1.0); float d = length(mv.xyz); mv.xy += position.xy * vec2(1.0, 1.7) * mix(0.3, 1.1, life) * aPh.z; gl_Position = projectionMatrix * mv; vUv = position.xy * 2.0;
            vK = vec3(smoothstep(0.0, 0.12, life) * (1.0 - smoothstep(0.4, 1.0, life)) * breath * smoothstep(0.6, 2.5, d), aPh.w * (1.0 - smoothstep(aAt.w + 1.1, aAt.w + 2.0, c.y)) * lampDip(-aAt.z - 138.0, uTime, 0.0, 0.0), 0.0); }`,
        fragmentShader: LIT_GLSL + /* glsl */`uniform vec3 uWarm; uniform float uK; varying vec2 vUv; varying vec3 vK; varying vec3 vP;
          void main() { float r2 = dot(vUv, vUv); float a = exp(-r2 * 3.2) * (1.0 - smoothstep(0.6, 1.0, r2)) * vK.x * uK;
            gl_FragColor = vec4(vec3(0.9, 0.93, 0.92) * (uAmbC * 1.5 + uSunC * 0.7 * lurSun(vP, 1.0).x) + uWarm * (vK.y * 0.45), a);
            #include <tonemapping_fragment>
            #include <colorspace_fragment>
          }` });
      const mesh = new THREE.Mesh(g, m); mesh.name = 'steam at the cowls'; mesh.frustumCulled = false; mesh.renderOrder = 5; scene.add(mesh);
    }
    // ---------- SPRAY AT THE CHUTES ('spray'; a medium): two puffs rising from each churned pool, lit by their place ----------
    {
      const g = QUAD(), at = [], ph = []; for (const q of L.spray) { at.push(q.e, q.y, -q.n, q.size); ph.push(q.ph, 0, 0, 0); }
      IA(g, 'aAt', at, 4); IA(g, 'aPh', ph, 4); g.instanceCount = L.spray.length;
      const m = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, uniforms: { ...LIT, uTime: U.time },
        vertexShader: /* glsl */`attribute vec4 aAt; attribute vec4 aPh; uniform float uTime; varying vec2 vUv; varying float vA; varying vec3 vP;
          void main() { float life = fract(uTime / 2.6 + aPh.x); vec3 c = aAt.xyz + vec3(0.0, 0.3 + 1.7 * life, 0.0); vP = c;
            vec4 mv = viewMatrix * vec4(c, 1.0); mv.xy += position.xy * aAt.w * (0.7 + 1.1 * life); gl_Position = projectionMatrix * mv; vUv = position.xy * 2.0; vA = smoothstep(0.0, 0.15, life) * (1.0 - smoothstep(0.45, 1.0, life)); }`,
        fragmentShader: LIT_GLSL + /* glsl */`varying vec2 vUv; varying float vA; varying vec3 vP;
          void main() { float r2 = dot(vUv, vUv); gl_FragColor = vec4(vec3(0.95) * (uAmbC * 1.4 + uSunC * 0.7 * lurSun(vP, 1.0).x), exp(-r2 * 3.0) * (1.0 - smoothstep(0.6, 1.0, r2)) * vA * 0.5);
            #include <tonemapping_fragment>
            #include <colorspace_fragment>
          }` });
      const mesh = new THREE.Mesh(g, m); mesh.name = 'spray at the chutes'; mesh.frustumCulled = false; mesh.renderOrder = 5; scene.add(mesh);
    }
    // ---------- SUN SHAFTS ('shafts'; a medium): thin slanted streaks of lit vapour along the sun's rays, over the roof's
    // cowls and the upper chutes; each shows only where the sun map says the sun reaches along it, and breathes with
    // the vapour that carries it. Its light is added to what is behind. ----------
    {
      const sp = [], sa = [], si = [];
      L.shafts.forEach((q) => { const [a, b] = P.shaftEnds(q, sunElev), i0 = sp.length / 3;
        for (const [pt, v] of [[a, 0], [b, 1]]) for (const u of [-1, 1]) { sp.push(pt[0], pt[1], -pt[2]); sa.push(u, v, q.w * 0.5, q.ph); }
        si.push(i0, i0 + 1, i0 + 3, i0, i0 + 3, i0 + 2); });
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3)); g.setAttribute('aS', new THREE.Float32BufferAttribute(sa, 4)); g.setIndex(si);
      const m = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, uniforms: { ...LIT, uTime: U.time, uRay: { value: sunDir.clone() } },
        vertexShader: /* glsl */`attribute vec4 aS; uniform vec3 uRay; varying vec3 vS; varying vec3 vP;
          void main() { vec3 side = normalize(cross(uRay, cameraPosition - position) + vec3(1e-4, 0.0, 1e-4)); vec3 p = position + side * (aS.x * aS.z); vP = p; vS = vec3(aS.x, aS.y, aS.w); gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0); }`,
        fragmentShader: NOISE_GLSL + LIT_GLSL + /* glsl */`uniform float uTime; varying vec3 vS; varying vec3 vP;
          void main() { float a = (1.0 - vS.x * vS.x) * sin(3.14159 * clamp(vS.y, 0.0, 1.0)) * (0.55 + 0.45 * sin(6.2832 * (uTime / 5.0 + vS.z))) * (0.6 + 0.4 * wN(vec2(vS.y * 5.0 - uTime * 0.3, vS.z * 9.0)));
            gl_FragColor = vec4(uSunC * (0.15 * a * lurSun(vP, 1.0).x), 1.0);
            #include <tonemapping_fragment>
            #include <colorspace_fragment>
          }` });
      const mesh = new THREE.Mesh(g, m); mesh.name = 'sun shafts'; mesh.frustumCulled = false; mesh.renderOrder = 5; scene.add(mesh);
    }
    // ---------- THE WIND CUPS on the post's roof: three cups on a bare pole 1.8 m tall, one turn a second ----------
    const cups = new THREE.Group();
    {
      const pos = [], nor = [], put = (g, m) => { const q = g.toNonIndexed(); q.applyMatrix4(m); pos.push(...q.attributes.position.array); nor.push(...q.attributes.normal.array); q.dispose(); g.dispose(); };
      put(new THREE.CylinderGeometry(0.03, 0.035, 1.8, 6), M4.makeTranslation(0, 0.9, 0)); put(new THREE.CylinderGeometry(0.06, 0.06, 0.1, 6), M4.makeTranslation(0, 1.8, 0));
      for (let k = 0; k < 3; k++) { const a = k * Math.PI * 2 / 3, R = new THREE.Matrix4().makeRotationY(a);
        put(new THREE.BoxGeometry(0.3, 0.02, 0.02), R.clone().multiply(M4.makeTranslation(0.18, 1.8, 0)));
        put(new THREE.SphereGeometry(0.085, 6, 4, 0, Math.PI), R.clone().multiply(M4.makeTranslation(0.36, 1.8, 0))); }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
      const mesh = new THREE.Mesh(g, new THREE.MeshLambertMaterial({ color: '#8f9a92', side: THREE.DoubleSide })); mesh.name = 'the wind cups'; cups.add(mesh);
      cups.position.set(4.5, P.K.POST.floor + P.K.POST.h + 0.45, -451.6); scene.add(cups);
    }
    // (no rest here: this step and the next are short, and one frame holds both)
    // ---------- TWO FAR FLOCKS of white birds ('flocks' deals where; each bird's own draws are on 'birds') ----------
    // One circles over the forested shoulder west of the Works, the other over the basin's north-east wall; each on
    // its own slow loop (40 s) from its dealt place in it, never nearer than 150 m.
    {
      const g = new THREE.InstancedBufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0.3, 0, 0, -0.3, -0.75, 0, -0.05, 0.75, 0, -0.05], 3)); g.setIndex([0, 1, 2, 0, 3, 1]);
      const c = [], b = [], rb = S.birds;
      for (const f of L.flocks) { const way = rb.sign(); for (let i = 0; i < f.birds; i++) { c.push(f.e, f.y + rb.range(-3, 3), -f.n, f.r + rb.range(-9, 9)); b.push(f.phase / (Math.PI * 2) + rb.range(-0.06, 0.06), rb.range(0, 6.283), rb.range(0.85, 1.15), way); } }
      IA(g, 'aC', c, 4); IA(g, 'aB', b, 4); g.instanceCount = c.length / 4;
      const m = new THREE.ShaderMaterial({ side: THREE.DoubleSide, uniforms: { uTime: U.time },
        vertexShader: /* glsl */`attribute vec4 aC; attribute vec4 aB; uniform float uTime; varying float vS;
          void main() { float a = aB.w * 6.2832 * (uTime / 40.0 + aB.x); vec3 ctr = aC.xyz + vec3(cos(a) * aC.w, 1.5 * sin(a * 3.0 + aB.y), sin(a) * aC.w);
            vec3 fw = vec3(-sin(a), 0.0, cos(a)) * aB.w, rt = vec3(fw.z, 0.0, -fw.x); float flap = sin(uTime * 6.5 * aB.z + aB.y) * 0.5 * abs(position.x);
            vec3 p = ctr + (rt * position.x + fw * position.z) * 1.7 + vec3(0.0, flap * 1.7, 0.0); vS = 0.82 + 0.18 * abs(position.x);
            gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0); }`,
        fragmentShader: /* glsl */`varying float vS;
          void main() { gl_FragColor = vec4(vec3(1.5, 1.3, 1.0) * vS, 1.0);
            #include <tonemapping_fragment>
            #include <colorspace_fragment>
          }` });
      const mesh = new THREE.Mesh(g, m); mesh.name = 'two far flocks'; mesh.frustumCulled = false; scene.add(mesh);
    }
    // ---------- THE PEAK'S CLOUD CAP: a lens of cloud in four flat layers, peach-lit from below, breathing slowly ----------
    // Each layer thins toward its own rim: its opacity is set by the metres inward from that rim (40 m to full), on
    // the cloud's own form, the same from every side.
    const cap = (() => { const cp = [], ca = [], ci = [], RX = 170, RZ = 130;
      [[0, 1], [5, 0.84], [10, 0.62], [15, 0.36]].forEach(([y, k], li) => { const i0 = cp.length / 3; cp.push(0, y, 0); ca.push(Math.min(RX, RZ) * k, li);
        for (const [f, ring] of [[0.55, 0], [1, 1]]) for (let s = 0; s < 28; s++) { const a = s / 28 * Math.PI * 2, wob = 1 + 0.1 * Math.sin(a * 3 + li * 1.7) + 0.06 * Math.sin(a * 7 + li); cp.push(Math.cos(a) * RX * k * f * wob, y, Math.sin(a) * RZ * k * f * wob); ca.push(ring ? 0 : Math.min(RX, RZ) * k * 0.45, li); }
        for (let s = 0; s < 28; s++) { const s1 = (s + 1) % 28, a = i0 + 1 + s, b = i0 + 1 + s1, c = i0 + 29 + s, d = i0 + 29 + s1; ci.push(i0, a, b, a, c, d, a, d, b); } });
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(cp, 3)); g.setAttribute('aRim', new THREE.Float32BufferAttribute(ca, 2)); g.setIndex(ci);
      return new THREE.Mesh(g, new THREE.ShaderMaterial({ transparent: true, depthWrite: false, side: THREE.DoubleSide, uniforms: { uLit: { value: new THREE.Color(1.5, 0.95, 0.6) }, uLow: { value: new THREE.Color(0.62, 0.6, 0.62) } },
        vertexShader: /* glsl */`attribute vec2 aRim; varying vec3 vC; void main() { vC = vec3(aRim.x, aRim.y, position.x); vec4 wp = modelMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * viewMatrix * wp; }`,
        fragmentShader: /* glsl */`uniform vec3 uLit, uLow; varying vec3 vC;
          void main() { float a = smoothstep(0.0, 40.0, vC.x) * 0.5; gl_FragColor = vec4(mix(uLow, uLit, clamp(0.55 - vC.z / 300.0 + 0.1 * vC.y, 0.0, 1.0)), a);
            #include <tonemapping_fragment>
            #include <colorspace_fragment>
          }` })); })();
    cap.name = 'the peak\'s cloud cap'; cap.position.set(P.K.PEAK.e + 10, P.K.PEAK.y + 2, -P.K.PEAK.n); cap.renderOrder = 2; cap.frustumCulled = false; scene.add(cap);
    await ctx.yield();

    // ---------- FALLING LEAVES ('leaves'): small bodies, each on the course the plan dealt it from a leaf mass down the wind;
    // none comes within 2.6 m of the line. A leaf takes the light of the place it falls through: it flashes gold
    // where it crosses a streak of sun. ----------
    {
      const N = P.leavesShown(L.leaves.length, thin), g = new THREE.InstancedBufferGeometry(), a0 = [], a1 = [], a2 = [];
      g.setAttribute('position', new THREE.Float32BufferAttribute([-1, 0, 0, 0, -0.45, 0, 1, 0, 0, 0, 0.45, 0], 3)); g.setIndex([0, 1, 2, 0, 2, 3]);
      for (let i = 0; i < N; i++) { const q = L.leaves[i]; a0.push(q.e, q.y, -q.n, q.per); a1.push(q.e1, q.y1, -q.n1, q.ph); a2.push(q.tw, q.size, (q.tw * 3.7) % 1, 0); }
      IA(g, 'aA', a0, 4); IA(g, 'aB', a1, 4); IA(g, 'aC', a2, 4); g.instanceCount = N;
      const m = new THREE.ShaderMaterial({ side: THREE.DoubleSide, uniforms: { ...LIT, uTime: U.time, uA: { value: new THREE.Color(0.62, 0.46, 0.12) }, uB: { value: new THREE.Color(0.36, 0.5, 0.13) } },
        vertexShader: /* glsl */`attribute vec4 aA; attribute vec4 aB; attribute vec4 aC; uniform float uTime; varying vec3 vK; varying vec3 vP;
          void main() { float life = fract(uTime / aA.w + aB.w), t = life * aA.w; vec3 c = mix(aA.xyz, aB.xyz, life); c.xz += vec2(sin(t * 1.9 + aC.x), cos(t * 1.4 + aC.x * 1.7)) * 0.6; vP = c;
            vec4 mv = viewMatrix * vec4(c, 1.0); float tw = t * 3.1 + aC.x, sz = aC.y * smoothstep(0.0, 0.04, life) * (1.0 - smoothstep(0.96, 1.0, life));
            mv.xy += (position.xy * mat2(cos(tw), -sin(tw), sin(tw), cos(tw))) * vec2(sz, sz * (0.35 + 0.65 * abs(sin(t * 2.3 + aC.x))));
            gl_Position = projectionMatrix * mv; vK = vec3(aC.z, 0.75 + 0.25 * sin(t * 2.3 + aC.x), 0.0); }`,
        fragmentShader: LIT_GLSL + /* glsl */`uniform vec3 uA, uB; varying vec3 vK; varying vec3 vP;
          void main() { gl_FragColor = vec4(mix(uA, uB, vK.x) * vK.y * wLit(vP), 1.0);
            #include <tonemapping_fragment>
            #include <colorspace_fragment>
          }` });
      const mesh = new THREE.Mesh(g, m); mesh.name = 'falling leaves'; mesh.frustumCulled = false; scene.add(mesh);
    }
    await ctx.yield();

    // ---------- GREAT ROOTS, ROOT CURTAINS, LIANAS AND FALLEN TRUNKS (plants and dead wood: sun, sky and the lamps' pools
    // that land on them; one mesh) ----------
    // Roots are pale brown, mossed on top wherever they lie in shade. A curtain's root and a liana sway down the wind
    // on a four-second period, each on its own dealt phase, most at its free end.
    {
      const rp = [], rn = [], rc = [], rh = [], rl = [], ri = [], cRt = C3(PAL.root), cRt2 = C3('#383c2a'), cCur = C3('#33372a'), cLog = C3('#2a2d22'), cMs = C3(PAL.moss), tq = new THREE.Vector3(), ta = new THREE.Vector3(), tb = new THREE.Vector3(), tt = new THREE.Vector3(), tc = new THREE.Color();
      const inWorks = (x, z) => -z > 128 && -z < 462 && x > -44 && x < 36;
      // a round through places [x, y, z, (radius)]; hang: [reach of its sway at the free end, phase]; moss: how mossed
      const tubeAlong = (pts, r0, r1, sides, col, hang, moss) => { const rows = [];
        pts.forEach((q, i) => { const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)]; tt.set(b[0] - a[0], b[1] - a[1], b[2] - a[2]).normalize(); ta.set(0, 1, 0); if (Math.abs(tt.y) > 0.9) ta.set(1, 0, 0); tb.crossVectors(tt, ta).normalize(); ta.crossVectors(tb, tt).normalize();
          const t = i / (pts.length - 1), r = q[3] ?? lerp(r0, r1, t), row = [], sun = moss ? sunAt(q[0], q[1] + r, q[2]) : 1, lit = inWorks(q[0], q[2]);
          for (let k = 0; k < sides; k++) { const an = k / sides * Math.PI * 2, cx = Math.cos(an), sx = Math.sin(an); tq.set(ta.x * cx + tb.x * sx, ta.y * cx + tb.y * sx, ta.z * cx + tb.z * sx);
            const x = q[0] + tq.x * r, y = q[1] + tq.y * r, z = q[2] + tq.z * r, v = 0.85 + 0.3 * Math.abs(Math.sin(k * 2.1 + i * 1.3));
            tc.copy(col).multiplyScalar(v).lerp(cMs, moss * smoothstep(0.1, 0.7, tq.y) * (1 - 0.7 * sun));
            rp.push(x, y, z); rn.push(tq.x, tq.y, tq.z); rc.push(tc.r, tc.g, tc.b); rh.push(hang ? hang[0] * t * t : 0, hang ? hang[1] : 0);
            const g = lit ? P.lampLightAt(lightPts, x, y, z, tq.x, tq.y, tq.z) : null; if (g) rl.push(g[0] * 0.35, g[1], g[2], g[3]); else rl.push(0, 0, 0, 0); row.push(rp.length / 3 - 1); }
          rows.push(row); });
        for (let i = 0; i + 1 < rows.length; i++) for (let k = 0; k < sides; k++) { const k2 = (k + 1) % sides; ri.push(rows[i][k], rows[i + 1][k], rows[i + 1][k2], rows[i][k], rows[i + 1][k2], rows[i][k2]); } };
      for (const st of L.roots.strands) tubeAlong(st.pts.map((q) => [q[0], q[1], -q[2]]), st.r, st.r1, 6, /roof/.test(st.on) ? cRt2 : cRt, null, 0.8);
      await ctx.yield();
      for (const st of L.sroots) tubeAlong(st.pts.map((q) => [q[0], q[1], -q[2]]), st.r, st.r1, 5, cRt, null, 0.9);
      for (const c of L.roots.curtains) { const pts = []; for (let k = 0; k <= 4; k++) pts.push([c.e, c.y - c.len * k / 4, -c.n]); tubeAlong(pts, c.r, c.r * 0.45, c.r > 0.06 ? 4 : 3, cCur, [(0.18 + 0.035 * c.len) * (c.r > 0.06 ? 0.5 : 1), c.ph * 6.283], 0); }
      await ctx.yield();
      for (const v of L.lianas) { const pts = [], k1 = v.fig ? 4 : 5; for (let k = 0; k <= k1; k++) pts.push([v.e, v.y - v.len * k / k1, -v.n]); tubeAlong(pts, v.r, v.r * (v.fig ? 1.3 : 0.7), v.fig ? 4 : 3, v.fig ? cRt : cCur, v.amp ? [v.amp, v.ph] : null, 0); }
      for (const f of L.fallen) { const a = [f.a[0], f.a[1], -f.a[2]], b = [f.b[0], f.b[1], -f.b[2]], d = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], pts = [[a[0] - d[0] * 0.02, a[1], a[2] - d[2] * 0.02, f.r * 0.15]];
        for (let k = 0; k <= 5; k++) pts.push([a[0] + d[0] * k / 5, a[1] + d[1] * k / 5 + 0.12 * Math.sin(k * 2.1 + f.r * 9), a[2] + d[2] * k / 5, f.r * (1 - 0.04 * k)]);
        pts.push([b[0] + d[0] * 0.02, b[1], b[2] + d[2] * 0.02, f.r * 0.1]); tubeAlong(pts, f.r, f.r, 8, cLog, null, 1); }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(rp, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(rn, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(rc, 3)); g.setAttribute('aHang', new THREE.Float32BufferAttribute(rh, 2));
      g.setAttribute('aLampG', new THREE.Float32BufferAttribute(rl, 4)); g.setIndex(ri); g.computeBoundingSphere();
      const m = new THREE.MeshLambertMaterial({ vertexColors: true });
      m.onBeforeCompile = (sh) => { sh.uniforms.uTime = U.time; sh.vertexShader = 'attribute vec2 aHang;\nuniform float uTime;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n  transformed.xz += vec2(0.866, 0.5) * (aHang.x * (0.35 + 0.65 * sin(uTime * 1.5708 + aHang.y)));'); };
      P.underSun(m, SU, 'roots'); P.underLamps(m, U, 'roots'); const mesh = new THREE.Mesh(g, m); mesh.name = 'roots, curtains, lianas, fallen trunks'; scene.add(mesh);
    }
    await ctx.yield();

    // ---------- THE WRECK ON THE BEACH ('wreck'): the broken middle of an airliner on the sand east of the stream's
    // mouth, beside the line's landfall ----------
    // One length of white fuselage tube torn open at both ends (ragged edges, ribs and the cabin's floor showing), a
    // row of small window holes along each side, lying a little on its side and half sunk in the sand; a wing stub
    // driven into the sand behind it; an engine pod half buried in the wash; a scatter of pale debris and a few seat
    // frames up the beach. Sun and shade by place, as everything else. No lettering, stripe, fin or mark anywhere;
    // no fire, no smoke, no figure.
    {
      const W = L.wreck, wp = [], wn = [], wc = [], wi = [], cSkin = C3('#eef0ea'), cStain = C3('#cbc4ae'), cRib = C3('#9aa3a2'), cHole = C3('#141a1e'), cSeat = C3('#56646c'), tc = new THREE.Color();
      const va = new THREE.Vector3(), vb = new THREE.Vector3(), vn = new THREE.Vector3(), RAD = Math.PI / 180;
      const hsh = (i, k) => { const s = Math.sin(i * 127.1 + k * 311.7 + W.tube.jag) * 43758.5453; return s - Math.floor(s); };
      const vert = (q, nx, ny, nz, col, sh = 1) => { wp.push(q[0], q[1], q[2]); wn.push(nx, ny, nz); wc.push(col.r * sh, col.g * sh, col.b * sh); return wp.length / 3 - 1; };
      // a flat four-cornered face that looks away from the place `inside`
      const face = (p0, p1, p2, p3, col, sh, inside) => { va.set(p1[0] - p0[0], p1[1] - p0[1], p1[2] - p0[2]); vb.set(p3[0] - p0[0], p3[1] - p0[1], p3[2] - p0[2]); vn.crossVectors(va, vb).normalize();
        const flip = vn.x * (p0[0] - inside[0]) + vn.y * (p0[1] - inside[1]) + vn.z * (p0[2] - inside[2]) < 0; if (flip) vn.negate();
        const i0 = vert(p0, vn.x, vn.y, vn.z, col, sh); vert(flip ? p3 : p1, vn.x, vn.y, vn.z, col, sh); vert(p2, vn.x, vn.y, vn.z, col, sh); vert(flip ? p1 : p3, vn.x, vn.y, vn.z, col, sh); wi.push(i0, i0 + 1, i0 + 2, i0, i0 + 2, i0 + 3); };
      const add = (c, X, x, Y, y, Z, z) => [c[0] + X[0] * x + Y[0] * y + Z[0] * z, c[1] + X[1] * x + Y[1] * y + Z[1] * z, c[2] + X[2] * x + Y[2] * y + Z[2] * z];
      const box = (c, X, Y, Z, hx, hy, hz, col) => { const q = (sx, sy, sz) => add(c, X, hx * sx, Y, hy * sy, Z, hz * sz);
        face(q(-1, -1, -1), q(-1, -1, 1), q(-1, 1, 1), q(-1, 1, -1), col, 0.8, c); face(q(1, -1, -1), q(1, 1, -1), q(1, 1, 1), q(1, -1, 1), col, 0.9, c); face(q(-1, -1, -1), q(1, -1, -1), q(1, -1, 1), q(-1, -1, 1), col, 0.7, c);
        face(q(-1, 1, -1), q(-1, 1, 1), q(1, 1, 1), q(1, 1, -1), col, 1, c); face(q(-1, -1, -1), q(-1, 1, -1), q(1, 1, -1), q(1, -1, -1), col, 0.85, c); face(q(-1, -1, 1), q(1, -1, 1), q(1, 1, 1), q(-1, 1, 1), col, 0.95, c); };
      // a frame about an axis u: side s (level), top t; a round of that frame turned by `roll`
      const frame = (u, roll) => { const s0 = new THREE.Vector3().crossVectors(u, UP).normalize(), t0 = new THREE.Vector3().crossVectors(s0, u).normalize(), c = Math.cos(roll * RAD), sn = Math.sin(roll * RAD);
        return [[s0.x * c + t0.x * sn, s0.y * c + t0.y * sn, s0.z * c + t0.z * sn], [-s0.x * sn + t0.x * c, -s0.y * sn + t0.y * c, -s0.z * sn + t0.z * c], [u.x, u.y, u.z]]; };
      // THE TUBE: 22 rings of 20; its ends torn (the end rings ragged, panels gone); nothing built under the sand
      { const T = W.tube, A0 = [T.a[0], T.a[1], -T.a[2]], B0 = [T.b[0], T.b[1], -T.b[2]], u = new THREE.Vector3(B0[0] - A0[0], B0[1] - A0[1], B0[2] - A0[2]), len = u.length(); u.normalize();
        const [S, Tp, Ux] = frame(u, T.roll), NR = 22, NS = 20, r = T.r, id = [], low = [], dir = (k) => { const a = (k / NS) * Math.PI * 2, c = Math.cos(a), s = Math.sin(a); return [S[0] * c + Tp[0] * s, S[1] * c + Tp[1] * s, S[2] * c + Tp[2] * s]; };
        for (let i = 0; i < NR; i++) for (let k = 0; k < NS; k++) { const d = dir(k), end = i === 0 ? 1 : i === NR - 1 ? -1 : 0, jag = end * (0.3 + 2.3 * hsh(i, k) * (0.45 + 0.55 * Math.abs(Math.sin(k * 0.9 + T.jag)))), dent = 1 + 0.035 * (hsh(i + 40, k) - 0.5);
          const q = add(A0, Ux, (i / (NR - 1)) * len + jag, d, r * dent, d, 0), g = P.groundAt(q[0], -q[2]), over = q[1] - g;
          tc.copy(cSkin).lerp(cStain, smoothstep(1.3, 0.0, over) * 0.8 + 0.25 * hsh(i + 9, k)); id.push(vert(q, d[0], d[1], d[2], tc, (end ? 0.82 : 1) * (0.9 + 0.1 * hsh(i + 3, k + 5)))); low.push(over < -0.35); }
        for (let i = 0; i + 1 < NR; i++) for (let k = 0; k < NS; k++) { const k1 = (k + 1) % NS, a0 = i * NS + k, a1 = (i + 1) * NS + k, a2 = (i + 1) * NS + k1, a3 = i * NS + k1;
          if ((low[a0] && low[a1] && low[a2] && low[a3]) || ((i === 0 || i === NR - 2) && hsh(i + 70, k) > 0.7)) continue; wi.push(id[a0], id[a1], id[a2], id[a0], id[a2], id[a3]); }
        // the window holes: a row along each side, a hand over the tube's middle line (each side's count is the plan's)
        [0.22, Math.PI - 0.22].forEach((a0, sd) => { const n = T.windows[sd], da = 0.19 / r;
          for (let j = 0; j < n; j++) { const al = (0.12 + 0.76 * (j + 0.5) / n) * len, at = (x, a) => { const c = Math.cos(a), s = Math.sin(a), d = [S[0] * c + Tp[0] * s, S[1] * c + Tp[1] * s, S[2] * c + Tp[2] * s]; return [add(A0, Ux, x, d, r + 0.03, d, 0), d]; };
            const q0 = at(al - 0.14, a0 - da), q1 = at(al + 0.14, a0 - da), q2 = at(al + 0.14, a0 + da), q3 = at(al - 0.14, a0 + da), i0 = vert(q0[0], ...q0[1], cHole); vert(q1[0], ...q1[1], cHole); vert(q2[0], ...q2[1], cHole); vert(q3[0], ...q3[1], cHole); wi.push(i0, i0 + 1, i0 + 2, i0, i0 + 2, i0 + 3); } });
        // the ribs that show at the torn ends (three rings an end, seen from within and through the gaps), the cabin's floor
        for (const tr of [0.035, 0.09, 0.145, 0.855, 0.91, 0.965]) for (let k = 0; k < NS; k++) { const d0 = dir(k), d1 = dir(k + 1), x = tr * len, i0 = vert(add(A0, Ux, x - 0.06, d0, r - 0.07, d0, 0), -d0[0], -d0[1], -d0[2], cRib);
          vert(add(A0, Ux, x - 0.06, d1, r - 0.07, d1, 0), -d1[0], -d1[1], -d1[2], cRib); vert(add(A0, Ux, x + 0.06, d1, r - 0.07, d1, 0), -d1[0], -d1[1], -d1[2], cRib); vert(add(A0, Ux, x + 0.06, d0, r - 0.07, d0, 0), -d0[0], -d0[1], -d0[2], cRib); wi.push(i0, i0 + 1, i0 + 2, i0, i0 + 2, i0 + 3); }
        { const hf = -0.3 * r, wf = Math.sqrt(r * r - hf * hf) * 0.97, c = add(A0, Ux, len * 0.5, Tp, hf, S, 0); face(add(c, Ux, -len * 0.44, S, -wf, S, 0), add(c, Ux, -len * 0.44, S, wf, S, 0), add(c, Ux, len * 0.44, S, wf, S, 0), add(c, Ux, len * 0.44, S, -wf, S, 0), cRib, 0.7, add(c, Tp, -1, S, 0, S, 0)); }
      }
      // THE WING STUB: a tapered slab driven into the sand at a slant, its upper end torn ragged
      { const w = W.wing, hb = P.onBearing(w.brg), cr = Math.cos(w.rise * RAD), sr = Math.sin(w.rise * RAD), D = [hb[0] * cr, sr, -hb[1] * cr], Cq = [hb[1], 0, hb[0]], Tn = [D[1] * Cq[2] - D[2] * Cq[1], D[2] * Cq[0] - D[0] * Cq[2], D[0] * Cq[1] - D[1] * Cq[0]], B = [w.e, w.y, -w.n];
        const sec = (s, ch, th, jg) => [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([a, b], i) => add(B, D, s + jg * (0.2 + 1.1 * hsh(90 + i, 3)), Cq, a * ch / 2, Tn, b * th / 2));
        const R = [sec(0, 4.4, 0.55, 0), sec(w.span * 0.55, 3.5, 0.4, 0), sec(w.span, 2.5, 0.22, 1)];
        for (let j = 0; j < 2; j++) { const mid = add(B, D, w.span * (0.28 + 0.5 * j), Cq, 0, Tn, 0); for (let i = 0; i < 4; i++) { const i1 = (i + 1) % 4; face(R[j][i], R[j][i1], R[j + 1][i1], R[j + 1][i], cSkin, i % 2 ? 0.82 : 0.96, mid); } }
        face(R[2][0], R[2][1], R[2][2], R[2][3], cRib, 0.8, add(B, D, w.span * 0.8, Cq, 0, Tn, 0)); }
      // THE ENGINE POD in the wash: a short round nacelle, its nose a little up, the dark intake open to the beach
      { const q = W.pod, pb = P.onBearing(q.brg), ct = Math.cos(q.tilt * RAD), st = Math.sin(q.tilt * RAD), u = new THREE.Vector3(pb[0] * ct, st, -pb[1] * ct), [S, Tp, Ux] = frame(u, 0), c = [q.e, q.y, -q.n], NS = 14, cMet = C3('#c7ccc8');
        // its profile from tail to lip and back into the intake: [along the axis, radius, tone, the normal's share along the axis]
        const prof = [[-1.65, 0.45, cMet, -0.5], [-0.9, 0.95, cSkin, -0.2], [0.2, 1.15, cSkin, 0], [1.3, 1.1, cSkin, 0.15], [1.65, 1.0, cRib, 0.7], [1.6, 0.84, cRib, 0.7], [0.5, 0.8, cHole, 0]], id = [];
        prof.forEach(([x, rad, col, nu], i) => { for (let k = 0; k < NS; k++) { const a = (k / NS) * Math.PI * 2, d = [S[0] * Math.cos(a) + Tp[0] * Math.sin(a), S[1] * Math.cos(a) + Tp[1] * Math.sin(a), S[2] * Math.cos(a) + Tp[2] * Math.sin(a)], sg = i > 4 ? -1 : 1, nr = Math.sqrt(1 - nu * nu) * sg;
          id.push(vert(add(c, Ux, x, d, rad, d, 0), d[0] * nr + Ux[0] * nu, d[1] * nr + Ux[1] * nu, d[2] * nr + Ux[2] * nu, col)); } });
        for (let i = 0; i + 1 < prof.length; i++) for (let k = 0; k < NS; k++) { const k1 = (k + 1) % NS, a0 = i * NS + k, a1 = (i + 1) * NS + k, a2 = (i + 1) * NS + k1, a3 = i * NS + k1; wi.push(id[a0], id[a1], id[a2], id[a0], id[a2], id[a3]); } }
      // THE SCATTER: bent pale panels lying in the sand, and a few seat frames (some fallen on their backs)
      for (const b of W.bits) { const r = b.rot * RAD, t = b.tilt * RAD, X = [Math.cos(r), 0, Math.sin(r)], Z0 = [-Math.sin(r), 0, Math.cos(r)], Y = [Z0[0] * Math.sin(t), Math.cos(t), Z0[2] * Math.sin(t)], Z = [Z0[0] * Math.cos(t), -Math.sin(t), Z0[2] * Math.cos(t)], c = [b.e, b.y, -b.n];
        if (b.kind === 2) { const cc = add(c, Y, 0.05, X, 0, Z, b.tilt > 45 ? -0.3 : 0); box(add(cc, Y, 0.42, X, 0, Z, 0), X, Y, Z, 0.7, 0.05, 0.24, cSeat); box(add(cc, Y, 0.8, X, 0, Z, -0.27), X, Y, Z, 0.7, 0.36, 0.04, cSeat);
          for (const sx of [-0.55, 0.55]) box(add(cc, Y, 0.2, X, sx, Z, 0), X, Y, Z, 0.03, 0.2, 0.22, cRib); continue; }
        const s = b.size, lift = 0.04 + 0.34 * s * Math.abs(Math.sin(t)), cc = add(c, [0, 1, 0], lift, X, 0, Z, 0), under = add(cc, Y, -1, X, 0, Z, 0), sh = 0.86 + 0.14 * hsh(b.e, b.n);
        if (b.kind === 0) face(add(cc, X, -s / 2, Z, -0.34 * s, Y, 0), add(cc, X, s / 2, Z, -0.3 * s, Y, 0), add(cc, X, s * 0.42, Z, 0.34 * s, Y, 0), add(cc, X, -s * 0.5, Z, 0.26 * s, Y, 0), cSkin, sh, under);
        else { const rid = [add(cc, X, -s / 2, Y, 0.16 * s, Z, 0), add(cc, X, s / 2, Y, 0.12 * s, Z, 0)]; face(add(cc, X, -s / 2, Z, -0.36 * s, Y, 0), add(cc, X, s / 2, Z, -0.33 * s, Y, 0), rid[1], rid[0], cSkin, sh, under); face(rid[0], rid[1], add(cc, X, s * 0.45, Z, 0.36 * s, Y, 0), add(cc, X, -s / 2, Z, 0.3 * s, Y, 0), cSkin, sh * 0.9, under); } }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(wp, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(wn, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(wc, 3)); g.setIndex(wi); g.computeBoundingSphere();
      // (a skin is seen from both its sides: what is seen from within is the darker)
      const m = new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide });
      m.onBeforeCompile = (sh) => { sh.fragmentShader = sh.fragmentShader.replace('#include <color_fragment>', '#include <color_fragment>\n  diffuseColor.rgb *= gl_FrontFacing ? 1.0 : 0.5;'); };
      P.underSun(m, SU, 'wreck'); const mesh = new THREE.Mesh(g, m); mesh.name = 'the wreck on the beach'; scene.add(mesh);
      // ---------- THE HATCH IN THE FOREST FLOOR: a heavy round-cornered steel door flat in the ground of the draw, in
      // a thick riveted collar, in a dug pit with its spoil thrown up in three heaps beside it and a few planks left
      // lying; one small window of thick glass in its middle; roots of the bank bared across the pit's edge. The
      // door lies in the draw's own slope, tilted 13 degrees down the draw (toward the stream and the beach), so
      // that its face is seen from the ground below it. Rust-streaked; nothing lettered, no numeral, no mark. ----------
      wp.length = 0; wn.length = 0; wc.length = 0; wi.length = 0;
      { const dA = P.onBearing(P.K.DOOR.face + 18), tilt = new THREE.Matrix4().makeRotationAxis(new THREE.Vector3(-dA[1], 0, -dA[0]).normalize(), 13 * Math.PI / 180), tv = new THREE.Vector3();
        const y0 = HA.y, c0 = [HA.e, y0, -HA.n], NS = 28, cSteel = C3('#8a9692'), cRust = C3('#a8572a'), cDarkS = C3('#59625f'), cRoot = C3(PAL.root), under = [HA.e, y0 - 3, -HA.n];
        // a round-cornered square's edge at the turn a: [x, z] for the half breadth R; f < 0.5: a plain round
        const edge = (a, R, round) => { const ca = Math.cos(a), sa = Math.sin(a), k = round ? 1 : 1 / Math.pow(ca * ca * ca * ca + sa * sa * sa * sa, 0.25); return [HA.e + ca * R * k, -HA.n + sa * R * k]; };
        const tone = (a, R) => { const f = noise.n2(Math.cos(a) * R * 1.9 + 3, Math.sin(a) * R * 1.9 - 7) * 0.5 + 0.5, s = noise.n2(a * 5.1, R * 0.8 + 2) * 0.5 + 0.5; return tc.copy(cSteel).lerp(cRust, smoothstep(0.42, 0.78, 0.6 * f + 0.4 * s) * 0.85).clone(); };
        // rows of the turned profile, from the collar's buried foot over its top, across the door to the glass's rim: [half breadth, height, round?, shade]
        const prof = [[1.55, -0.3, 0, 0.8], [1.55, 0.34, 0, 0.95], [1.16, 0.34, 0, 0.7], [1.16, 0.22, 0, 0.6], [1.1, 0.26, 0, 0.9], [1.05, 0.31, 0, 1], [0.6, 0.34, 0, 1], [0.26, 0.345, 1, 0.9], [0.26, 0.4, 1, 1], [0.17, 0.4, 1, 0.7], [0.17, 0.33, 1, 0.5]];
        for (let i = 0; i + 1 < prof.length; i++) for (let k = 0; k < NS; k++) { const a0 = (k / NS) * Math.PI * 2, a1 = ((k + 1) / NS) * Math.PI * 2, A = prof[i], B = prof[i + 1];
          const q = (a, r) => { const e2 = edge(a, r[0], r[2]); return [e2[0], y0 + r[1], e2[1]]; }; face(q(a0, A), q(a1, A), q(a1, B), q(a0, B), tone((a0 + a1) / 2, (A[0] + B[0]) / 2), B[3], under); }
        // rivets: 22 about the door's edge, 26 on the collar's top (low four-sided studs)
        for (const [n, R, h] of [[22, 0.94, 0.33], [26, 1.36, 0.34]]) for (let k = 0; k < n; k++) { const a = ((k + 0.5) / n) * Math.PI * 2, e2 = edge(a, R, 0), c = [e2[0], y0 + h, e2[1]], top = [c[0], c[1] + 0.035, c[2]], s = 0.04;
          const P4 = [[c[0] - s, c[1], c[2] - s], [c[0] + s, c[1], c[2] - s], [c[0] + s, c[1], c[2] + s], [c[0] - s, c[1], c[2] + s]]; for (let j = 0; j < 4; j++) face(P4[j], P4[(j + 1) % 4], top, top, cDarkS, 0.9 + 0.1 * (j % 2), under); }
        // two heavy hinges across the collar on its north side, a lifting bar on two posts by the south edge
        for (const sx of [-0.55, 0.55]) box([HA.e + sx, y0 + 0.4, -HA.n - 1.2], [1, 0, 0], [0, 1, 0], [0, 0, 1], 0.13, 0.07, 0.34, cDarkS);
        box([HA.e, y0 + 0.46, -HA.n + 0.72], [1, 0, 0], [0, 1, 0], [0, 0, 1], 0.3, 0.025, 0.025, cDarkS); for (const sx of [-0.27, 0.27]) box([HA.e + sx, y0 + 0.39, -HA.n + 0.72], [1, 0, 0], [0, 1, 0], [0, 0, 1], 0.025, 0.06, 0.025, cDarkS);
        // (the door, its collar, rivets, hinges and bar are turned into the slope; what follows lies on the ground)
        for (let i = 0; i < wp.length; i += 3) { tv.set(wp[i] - c0[0], wp[i + 1] - c0[1], wp[i + 2] - c0[2]).applyMatrix4(tilt); wp[i] = tv.x + c0[0]; wp[i + 1] = tv.y + c0[1]; wp[i + 2] = tv.z + c0[2];
          tv.set(wn[i], wn[i + 1], wn[i + 2]).applyMatrix4(tilt); wn[i] = tv.x; wn[i + 1] = tv.y; wn[i + 2] = tv.z; }
        // five planks left by the pit ('pit'): boards lying on the ground on its south and east sides, the first at
        // the pit's very edge
        { const rq = S.pit, cWood = C3('#b39a70'); for (let k = 0; k < 5; k++) { const b = P.onBearing(rq.range(95, 215)), d = k === 0 ? 3.0 : rq.range(3.8, 6.4), x = HA.e + b[0] * d, z = -(HA.n + b[1] * d), yaw = rq.range(0, Math.PI), len = rq.range(1.1, 1.5), cx = Math.cos(yaw), sx = Math.sin(yaw);
          const ya = P.groundAt(x - cx * len, -(z - sx * len)), yb = P.groundAt(x + cx * len, -(z + sx * len)), X = [cx * 2 * len, yb - ya, sx * 2 * len], xl = Math.hypot(X[0], X[1], X[2]); X[0] /= xl; X[1] /= xl; X[2] /= xl;
          const Z = [-sx, 0, cx], Y = [Z[1] * X[2] - Z[2] * X[1], Z[2] * X[0] - Z[0] * X[2], Z[0] * X[1] - Z[1] * X[0]]; box([x + Y[0] * 0.05, (ya + yb) / 2 + 0.05, z + Y[2] * 0.05], X, Y, Z, len, 0.025, 0.12, cWood); } }
        // three roots of the bank bared where the earth was dug away: each lies across the hollow's edge
        for (const [a, bend] of [[0.7, 0.5], [2.9, -0.4], [4.4, 0.6]]) { const pts = []; for (let j = 0; j <= 5; j++) { const d = 1.7 + j * 0.62, an = a + bend * (j / 5) * 0.5, e = HA.e + Math.cos(an) * d, n = HA.n + Math.sin(an) * d; pts.push([e, P.groundAt(e, n) + 0.06 + 0.1 * Math.sin(j * 1.3), -n]); }
          for (let j = 0; j < 5; j++) { const p0 = pts[j], p1 = pts[j + 1], r0 = 0.11 - 0.012 * j, r1 = 0.11 - 0.012 * (j + 1), dx = p1[0] - p0[0], dz = p1[2] - p0[2], l = Math.hypot(dx, dz) || 1, sx = -dz / l, sz = dx / l, mid = [(p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2, (p0[2] + p1[2]) / 2];
            const R4 = (q, r) => [[q[0] + sx * r, q[1], q[2] + sz * r], [q[0], q[1] + r, q[2]], [q[0] - sx * r, q[1], q[2] - sz * r], [q[0], q[1] - r, q[2]]], Ra = R4(p0, r0), Rb = R4(p1, r1); for (let k = 0; k < 4; k++) face(Ra[k], Ra[(k + 1) % 4], Rb[(k + 1) % 4], Rb[k], cRoot, 0.8 + 0.1 * k, mid); } }
        const hg = new THREE.BufferGeometry(); hg.setAttribute('position', new THREE.Float32BufferAttribute(wp, 3)); hg.setAttribute('normal', new THREE.Float32BufferAttribute(wn, 3)); hg.setAttribute('color', new THREE.Float32BufferAttribute(wc, 3)); hg.setIndex(wi); hg.computeBoundingSphere();
        const hm = new THREE.Mesh(hg, m); hm.name = 'the hatch in the forest floor'; scene.add(hm);
        // its one small window of thick glass, lit from within
        const gg = new THREE.CircleGeometry(0.17, 12); gg.rotateX(-Math.PI / 2); gg.translate(0, 0.335, 0); gg.applyMatrix4(tilt); gg.translate(HA.e, y0, -HA.n);
        // (the glass's light spilt on the door about it: brightest at the glass, gone 1.3 m from it; it lies on the door)
        { const sg = new THREE.CircleGeometry(1.3, 16), sc = []; for (let i = 0; i < sg.attributes.position.count; i++) { const k = i === 0 ? 1 : 0; sc.push(0.8 * k, 1.1 * k, 1.0 * k); }
          sg.setAttribute('color', new THREE.Float32BufferAttribute(sc, 3)); sg.rotateX(-Math.PI / 2); sg.translate(0, 0.43, 0); sg.applyMatrix4(tilt); sg.translate(HA.e, y0, -HA.n);
          const sm = new THREE.Mesh(sg, new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide })); sm.name = 'the glass\'s light on the door'; sm.renderOrder = 5; scene.add(sm); }
        const gm = new THREE.Mesh(gg, new THREE.MeshBasicMaterial({ color: new THREE.Color(1.9, 2.5, 2.3) })); gm.name = 'the hatch\'s glass'; scene.add(gm); }
      // THE SHAFT OF PALE LIGHT that stands straight up out of the glass into the canopy's mist (a medium): a soft cone
      // that starts at the glass, no wider than the glass's rim there and far the brightest there, widening to 2.6 m
      // either way at its top; motes drift up in it. Its flat is turned about its own
      // upright axis toward the eye (a round cone is the same from every side); nothing of it is sized, thinned or
      // faded by the eye's distance. What stands round it takes its light by place (see the hatch's light).
      { const NB = 10, bp = [], bi = []; for (let j = 0; j <= NB; j++) { bp.push(-1, j / NB, 0, 1, j / NB, 0); if (j < NB) { const a = j * 2; bi.push(a, a + 1, a + 3, a, a + 3, a + 2); } }
        const bg = new THREE.BufferGeometry(); bg.setAttribute('position', new THREE.Float32BufferAttribute(bp, 3)); bg.setIndex(bi); bg.boundingSphere = new THREE.Sphere(new THREE.Vector3(HA.e, HA.y + HA.beam / 2, -HA.n), HA.beam);
        const bm = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending,
          uniforms: { uTime: U.time, uBase: { value: new THREE.Vector3(HA.e, HA.y + 0.34, -HA.n) }, uH: { value: HA.beam }, uCol: { value: new THREE.Color(0.95, 1.25, 1.18) } },
          vertexShader: /* glsl */`uniform vec3 uBase; uniform float uH; varying vec2 vB; varying float vWd;
            void main() { float t = position.y; vec3 c = uBase + vec3(0.0, t * uH, 0.0); vec3 toEye = cameraPosition - c; vec3 side = normalize(vec3(toEye.z, 0.0, -toEye.x) + vec3(1e-4, 0.0, 0.0));
              float wd = mix(0.22, 2.6, t); vB = vec2(position.x, t); vWd = wd; gl_Position = projectionMatrix * viewMatrix * vec4(c + side * (position.x * wd), 1.0); }`,
          fragmentShader: NOISE_GLSL + /* glsl */`
            uniform float uTime, uH; uniform vec3 uCol; varying vec2 vB; varying float vWd;
            void main() { float x = vB.x, t = vB.y; float core = max(1.0 - x * x, 0.0); core = core * sqrt(core);
              float along = (0.3 + 0.7 * exp(-t * uH / 5.0) + 2.6 * exp(-t * uH / 0.9)) * (1.0 - smoothstep(0.72, 1.0, t)) * smoothstep(0.0, 0.004, t);
              float haze = 0.75 + 0.25 * wN(vec2(x * vWd * 1.3, t * uH * 0.35 - uTime * 0.12));
              vec2 mq = vec2(x * vWd * 2.0, t * uH * 1.6 - uTime * 0.2); vec2 mc = fract(mq) - 0.5; float mote = step(0.86, wH(floor(mq))) * (1.0 - smoothstep(0.0, 0.2, length(mc)));
              gl_FragColor = vec4(uCol * (core * along * (0.42 * haze + 0.9 * mote)), 1.0);
              #include <tonemapping_fragment>
              #include <colorspace_fragment>
            }` });
        const beam = new THREE.Mesh(bg, bm); beam.name = 'the hatch\'s shaft of light'; beam.renderOrder = 5; beam.frustumCulled = false; scene.add(beam); }
    }
    await ctx.yield();

    // ---------- THE CAMP ON THE BEACH ('camp'): three shelters of tarpaulin on poles between the line and the
    // wreck, a ring of nine stones with a thin column of smoke, a few plain cases. No figure, nothing lettered,
    // no light of its own. Every piece stands 9 m and more from the line in the plan, off the wreck and the palms.
    {
      const rc = S.camp, WK = P.WRECK, wa = P.onBearing(WK.brg), cp = [], cc = [], taken = []; let smokeAt = null;
      const tri = (a, b, c, col) => { cp.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2]); for (let k = 0; k < 3; k++) cc.push(col[0], col[1], col[2]); }, quad = (a, b, c, d, col) => { tri(a, b, c, col); tri(a, c, d, col); };
      const pole = (a, b, r, col) => { const dx = b[0] - a[0], dz = b[2] - a[2], l = Math.hypot(dx, dz), up = l < 0.05, sx = up ? r : -dz / l * r, sz = up ? 0 : dx / l * r, o2 = up ? [0, 0, r] : [0, r, 0];
        quad([a[0] - sx, a[1], a[2] - sz], [a[0] + sx, a[1], a[2] + sz], [b[0] + sx, b[1], b[2] + sz], [b[0] - sx, b[1], b[2] - sz], col);
        quad([a[0] - o2[0], a[1] - o2[1], a[2] - o2[2]], [a[0] + o2[0], a[1] + o2[1], a[2] + o2[2]], [b[0] + o2[0], b[1] + o2[1], b[2] + o2[2]], [b[0] - o2[0], b[1] - o2[1], b[2] - o2[2]], col); };
      const axisD = (e, n) => { const de = e - WK.e, dn = n - WK.n, al = clamp(de * wa[0] + dn * wa[1], -WK.half, WK.half); return Math.hypot(de - wa[0] * al, dn - wa[1] * al); };
      const palmsAt = (L.palms || []).map((q) => [q.e ?? q[0], q.n ?? q[1]]);
      const spot = (r) => { for (let t = 0; t < 90; t++) { const e = rc.range(8.5, 23), n = rc.range(103, 129), g = P.groundAt(e, n);
          if (g < 1.7 || g > 3.3 || P.nearLine(e, n)[0] < 9 + r || axisD(e, n) < 5.5 + r || Math.hypot(e - WK.pod[0], n - WK.pod[1]) < 4 + r || P.streamAt(e, n)[0] < 4 + r || palmsAt.some((q) => Math.hypot(q[0] - e, q[1] - n) < 1.6 + r) || taken.some((q) => Math.hypot(q[0] - e, q[1] - n) < q[2] + r + 0.6)) continue;
          taken.push([e, n, r]); return [e, n, g]; } return null; };
      // the shelters: a ridge pole on two uprights, a tarpaulin from it to the ground behind and a short flap held up on two stakes before
      const tarps = [[0.1, 0.27, 0.5], [0.5, 0.44, 0.28], [0.5, 0.53, 0.55]], cPole = [0.3, 0.22, 0.13];
      for (let k = 0; k < 3; k++) { const q = spot(2.6); if (!q) continue; const [e, n] = q, yaw = rc.range(0, 6.283), c = Math.cos(yaw), s = Math.sin(yaw), col = tarps[k];
        const P3 = (a, b, h) => { const pe = e + c * a - s * b, pn = n + s * a + c * b; return [pe, P.groundAt(pe, pn) + h, -pn]; }, r0 = P3(-1.9, 0, 2.05), r1 = P3(1.9, 0, 2.05), f0 = P3(-1.9, 1.3, 1.25), f1 = P3(1.9, 1.3, 1.25);
        pole(P3(-1.9, 0, -0.1), r0, 0.05, cPole); pole(P3(1.9, 0, -0.1), r1, 0.05, cPole); pole(P3(-2.1, 0, 2.05), P3(2.1, 0, 2.05), 0.045, cPole);
        quad(r0, r1, P3(2.1, -2.0, 0.05), P3(-2.1, -2.0, 0.05), col); quad(r1, r0, f0, f1, [col[0] * 0.8, col[1] * 0.8, col[2] * 0.8]); pole(P3(-1.9, 1.3, -0.1), f0, 0.03, cPole); pole(P3(1.9, 1.3, -0.1), f1, 0.03, cPole); }
      // the fire's ring: nine stones, three charred logs across it, and the place its smoke rises from
      { const q = spot(1.6); if (q) { const [e, n, g] = q;
          for (let k = 0; k < 9; k++) { const a = k * 0.698 + rc.range(-0.1, 0.1), sx = e + Math.cos(a) * 0.75, sn = n + Math.sin(a) * 0.75, sr = rc.range(0.14, 0.22), y = P.groundAt(sx, sn) - 0.02, col = [0.3 + 0.1 * rc(), 0.3, 0.28], tp = [sx, y + sr * 1.3, -sn];
            quad([sx - sr, y, -(sn - sr)], [sx + sr, y, -(sn - sr)], [tp[0] + sr * 0.5, tp[1], tp[2]], [tp[0] - sr * 0.5, tp[1], tp[2]], col); quad([sx - sr, y, -(sn + sr)], [sx + sr, y, -(sn + sr)], [tp[0] + sr * 0.5, tp[1], tp[2]], [tp[0] - sr * 0.5, tp[1], tp[2]], col); }
          for (let k = 0; k < 3; k++) { const a = k * 2.1 + 0.4; pole([e - Math.cos(a) * 0.5, g + 0.06, -(n - Math.sin(a) * 0.5)], [e + Math.cos(a) * 0.5, g + 0.16, -(n + Math.sin(a) * 0.5)], 0.06, [0.05, 0.045, 0.04]); }
          smokeAt = [e, g + 0.2, -n]; } }
      // plain cases, none marked
      { const cs = []; for (let k = 0; k < 5; k++) { const q = spot(0.8); if (q) cs.push(q); } while (P.BARRED.has(cs.length)) cs.pop();
        cs.forEach(([e, n, g], k) => { const yaw = rc.range(0, 3.1), c = Math.cos(yaw), s = Math.sin(yaw), hx = rc.range(0.35, 0.55), hz = rc.range(0.22, 0.32), h = rc.range(0.3, 0.5), col = k % 2 ? [0.5, 0.52, 0.53] : [0.2, 0.24, 0.3], C8 = (a, b, yy) => [e + c * a * hx - s * b * hz, g - 0.03 + yy, -(n + s * a * hx + c * b * hz)];
          quad(C8(-1, -1, 0), C8(1, -1, 0), C8(1, -1, h), C8(-1, -1, h), col); quad(C8(1, -1, 0), C8(1, 1, 0), C8(1, 1, h), C8(1, -1, h), col); quad(C8(1, 1, 0), C8(-1, 1, 0), C8(-1, 1, h), C8(1, 1, h), col); quad(C8(-1, 1, 0), C8(-1, -1, 0), C8(-1, -1, h), C8(-1, 1, h), col);
          quad(C8(-1, -1, h), C8(1, -1, h), C8(1, 1, h), C8(-1, 1, h), [col[0] * 1.2, col[1] * 1.2, col[2] * 1.2]); }); }
      if (cp.length) { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(cp, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(cc, 3)); g.computeVertexNormals(); g.computeBoundingSphere();
        const m = new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide }); P.underSun(m, SU, 'camp'); const mesh = new THREE.Mesh(g, m); mesh.name = 'the camp on the beach'; scene.add(mesh); }
      // THE SMOKE (a medium): one thin column from the fire's ring, 11 m tall, widening and leaning down the wind as
      // it rises; it stands at the ring and turns about its own upright to the eye, as the mist's sheets do
      if (smokeAt) { const g2 = new THREE.BufferGeometry(); g2.setAttribute('position', new THREE.Float32BufferAttribute([-1, 0, 0, 1, 0, 0, 1, 1, 0, -1, 1, 0], 3)); g2.setIndex([0, 1, 2, 0, 2, 3]);
        const sm = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, side: THREE.DoubleSide, uniforms: { uTime: U.time, uAt: { value: new THREE.Vector3(smokeAt[0], smokeAt[1], smokeAt[2]) } },
          vertexShader: /* glsl */`uniform vec3 uAt; varying vec2 vQ;
            void main() { vec2 tc = cameraPosition.xz - uAt.xz; vec2 right = normalize(vec2(tc.y, -tc.x) + vec2(1e-4, 0.0)); float h = position.y * 11.0; vec3 p = uAt;
              p.xz += right * (position.x * (0.35 + 0.16 * h)) + vec2(0.866, -0.5) * (0.035 * h * h); p.y += h; vQ = position.xy; gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0); }`,
          fragmentShader: NOISE_GLSL + /* glsl */`uniform float uTime; varying vec2 vQ;
            void main() { float n = wN(vec2(vQ.x * 1.6 + 3.0, vQ.y * 5.0 - uTime * 0.35)) * 0.6 + wN(vec2(vQ.x * 3.4, vQ.y * 11.0 - uTime * 0.6)) * 0.4;
              float a = (1.0 - vQ.x * vQ.x) * smoothstep(0.0, 0.06, vQ.y) * (1.0 - smoothstep(0.55, 1.0, vQ.y)) * smoothstep(0.25, 0.7, n + 0.25 * (1.0 - vQ.y));
              gl_FragColor = vec4(vec3(0.62, 0.64, 0.68), a * 0.5);
              #include <tonemapping_fragment>
              #include <colorspace_fragment>
            }` });
        const smoke = new THREE.Mesh(g2, sm); smoke.name = 'the camp\'s smoke'; smoke.frustumCulled = false; smoke.renderOrder = 5; scene.add(smoke); }
    }
    await ctx.yield();

    // ---------- THE WORKS ARE LIVED IN ('props'): things left on the roof and in the court, none marked or lettered.
    // On the roof: a workbench under a sheet awning with one small lamp, stacks of crates, drums, a cable reel,
    // root fingers come over the slab's west edge, drifts of fallen leaves, blotches of moss, and puddles that show
    // the sky. In the court: crates, drums and a reel against the walls, two cables slung along the west wall, and a
    // steel gallery on the east wall with a stair up to it. All stand 4.5 m and more from the line in the plan. ----------
    {
      const rq = S.props, pp = [], pn = [], pc = [], pi = [], R = P.K.ROOF, C = P.K.COURT, yR = P.K.LIP, yC = P.K.FLOOR; let bulbAt = null;
      const quad = (a, b, c, d, col, c2 = col) => { const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2]; let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
        const i0 = pp.length / 3; [a, b, c, d].forEach((q, k) => { const cc = k < 2 ? col : c2; pp.push(q[0], q[1], q[2]); pn.push(nx, ny, nz); pc.push(cc[0], cc[1], cc[2]); }); pi.push(i0, i0 + 1, i0 + 2, i0, i0 + 2, i0 + 3); };
      // a box: centre of its foot (plan e, n; y), half sizes along a turned axis (hx), up (h) and across (hz)
      const box = (e, n, y, hx, h, hz, yaw, col, top = col) => { const c = Math.cos(yaw), s = Math.sin(yaw), q = (a, b, yy) => [e + c * a * hx - s * b * hz, yy, -(n + s * a * hx + c * b * hz)], y1 = y + h;
        quad(q(-1, -1, y), q(1, -1, y), q(1, -1, y1), q(-1, -1, y1), col); quad(q(1, -1, y), q(1, 1, y), q(1, 1, y1), q(1, -1, y1), col); quad(q(1, 1, y), q(-1, 1, y), q(-1, 1, y1), q(1, 1, y1), col); quad(q(-1, 1, y), q(-1, -1, y), q(-1, -1, y1), q(-1, 1, y1), col);
        quad(q(-1, -1, y1), q(1, -1, y1), q(1, 1, y1), q(-1, 1, y1), top); };
      // a round of ten sides about an axis (ax: 'y' upright, else lying along the plan bearing yaw), with both ends closed
      const drum = (e, n, y, r, len, col, cap, yaw = null) => { const ring = (t) => { const out = []; for (let k = 0; k < 10; k++) { const a = k * 0.6283, ca = Math.cos(a) * r, sa = Math.sin(a) * r;
            out.push(yaw === null ? [e + ca, y + t * len, -(n + sa)] : [e + Math.sin(yaw) * (t - 0.5) * len + Math.cos(yaw) * ca, y + r + sa, -(n + Math.cos(yaw) * (t - 0.5) * len - Math.sin(yaw) * ca)]); } return out; }, a = ring(0), b = ring(1);
        const mid = (ringP) => { const m = [0, 0, 0]; for (const q of ringP) { m[0] += q[0] / 10; m[1] += q[1] / 10; m[2] += q[2] / 10; } return m; }, ma = mid(a), mb = mid(b);
        for (let k = 0; k < 10; k++) { const k2 = (k + 1) % 10; quad(a[k], a[k2], b[k2], b[k], col); quad(b[k], b[k2], mb, mb, cap); quad(a[k2], a[k], ma, ma, cap); } };
      const strip = (pts, w0, w1, col) => { for (let k = 0; k + 1 < pts.length; k++) { const p = pts[k], q = pts[k + 1], dx = q[0] - p[0], dz = q[2] - p[2], l = Math.hypot(dx, dz) || 1, sx = -dz / l, sz = dx / l, wa = lerp(w0, w1, k / (pts.length - 1)) / 2, wb = lerp(w0, w1, (k + 1) / (pts.length - 1)) / 2;
        quad([p[0] - sx * wa, p[1], p[2] - sz * wa], [p[0] + sx * wa, p[1], p[2] + sz * wa], [q[0] + sx * wb, q[1], q[2] + sz * wb], [q[0] - sx * wb, q[1], q[2] - sz * wb], col);
        quad([p[0], p[1] - wa, p[2]], [p[0], p[1] + wa, p[2]], [q[0], q[1] + wb, q[2]], [q[0], q[1] - wb, q[2]], col); } };
      // a blotch lying on a slab: an uneven round of eleven sides, its tones mixed by corner
      const blotch = (e, n, y, r, tones) => { const c0 = [e, y, -n], rim = []; for (let k = 0; k < 11; k++) { const a = k * 0.5712, rr = r * rq.range(0.5, 1); rim.push([e + Math.cos(a) * rr, y, -(n + Math.sin(a) * rr * 0.8)]); }
        for (let k = 0; k < 11; k++) quad(c0, rim[k], rim[(k + 1) % 11], rim[(k + 1) % 11], tones[k % tones.length], tones[(k + 1) % tones.length]); };
      // FLAT THINGS ON A SLAB: each kind lies in its own plane over the slab (never in the slab's own), no two of
      // a kind overlap (each kind keeps the list of what is laid), and no set of them comes to a barred count
      const laid = {}, clearOf = (kind, e, n, r) => { const l = laid[kind] = laid[kind] || []; if (l.some((q) => Math.hypot(q[0] - e, q[1] - n) < q[2] + r + 0.15)) return false; l.push([e, n, r]); return true; };
      const unbar = (list) => { while (P.BARRED.has(list.length)) list.pop(); return list; }; let shadeN = 0;
      const onSlab = (e, n, r) => e - r > R.e0 + 0.15 && e + r < R.e1 - 0.15 && n - r > R.n0 + 0.15 && n + r < R.n1 - 0.15;
      const cCrate = [0.68, 0.47, 0.24], cCrate2 = [0.5, 0.33, 0.17], cDrum = [0.44, 0.58, 0.54], cDrum2 = [0.5, 0.3, 0.2], cRim = [0.3, 0.33, 0.33], cWoodP = [0.72, 0.58, 0.38], cSheet = [0.5, 0.55, 0.53], cSheet2 = [0.4, 0.45, 0.44], cRoot2 = [0.1, 0.085, 0.06], cCable = [0.17, 0.18, 0.18], cSteel = [0.36, 0.39, 0.38];
      const mossT = [[0.24, 0.36, 0.15], [0.33, 0.44, 0.2], [0.19, 0.3, 0.14]], leafT = [[0.52, 0.38, 0.17], [0.62, 0.44, 0.19], [0.4, 0.3, 0.15], [0.56, 0.5, 0.24]];
      const fixed = [...L.kerbs.map((q) => [q[0], q[1], 1.6]), ...L.cowls.map((q) => [q.e, q.n, 1.4]), ...L.pots.flatMap((r) => r.pots.map((q) => [q[0], q[1], 0.8])), ...L.lamps.map((q) => [q.e, q.n, 1.0]), [P.K.ROOFFIG[0], P.K.ROOFFIG[1], 5], [P.BANYAN.e, P.BANYAN.n, 6]], taken = [];
      const freeAt = (e, n, r, off = 4.5) => e > R.e0 + 1.2 + r && e < R.e1 - 1.2 - r && n > R.n0 + 1.5 + r && n < R.n1 - 2 - r && P.nearLine(e, n)[0] > off + r && !fixed.some((q) => Math.hypot(q[0] - e, q[1] - n) < q[2] + r) && !taken.some((q) => Math.hypot(q[0] - e, q[1] - n) < q[2] + r + 0.5);
      const place = (r, zone, off) => { for (let t = 0; t < 40; t++) { const e = rq.range(zone[0], zone[1]), n = rq.range(zone[2], zone[3]); if (freeAt(e, n, r, off)) { taken.push([e, n, r]); return [e, n]; } } return null; };
      const crates = (e, n, y, yaw) => { box(e, n, y, 0.55, 0.7, 0.45, yaw, cCrate2, cCrate); box(e + Math.cos(yaw) * 1.25, n + Math.sin(yaw) * 1.25, y, 0.5, 0.62, 0.5, yaw + 0.3, cCrate, cCrate2); box(e + Math.cos(yaw) * 0.2, n + Math.sin(yaw) * 0.2, y + 0.7, 0.42, 0.5, 0.4, yaw - 0.25, cCrate, cCrate2); };
      const drums = (e, n, y, k) => { for (let j = 0; j < k; j++) { const a = j * 2.2 + 0.4, d = j === 0 ? 0 : 0.72; drum(e + Math.cos(a) * d, n + Math.sin(a) * d, y, 0.3, 0.9, j % 2 ? cDrum2 : cDrum, cRim); } };
      const reel = (e, n, y, yaw) => { const s = Math.sin(yaw), c = Math.cos(yaw); drum(e - s * 0.36, n - c * 0.36, y, 0.7, 0.07, cWoodP, cWoodP, yaw); drum(e + s * 0.36, n + c * 0.36, y, 0.7, 0.07, cWoodP, cWoodP, yaw); drum(e, n, y + 0.36, 0.34, 0.66, cCable, cCable, yaw); };
      const cPale = [1.7, 0.8, 0.44], cPale2 = [1.4, 0.64, 0.34], cHub = [0.36, 0.17, 0.09], cRust = [0.85, 0.44, 0.2], cRust2 = [0.56, 0.31, 0.15], cTank = [0.52, 0.62, 0.6], cShade = [0.2, 0.22, 0.235], sunAway = P.onBearing(112);
      // the shade at a standing thing's foot on its own slab, lying away from the low sun (soft: the crowns already
      // shade most of the roof)
      const shade = (e, n, y0, hw, h, eMax) => { if (eMax === null) return; const y = y0 + 0.003 * shadeN++, len = Math.min(1.5 * h, Math.max(0.5, (eMax - e) / sunAway[0] - hw)), sx = sunAway[1], sn = -sunAway[0];
        quad([e - sx * hw, y + 0.035, -(n - sn * hw)], [e + sx * hw, y + 0.035, -(n + sn * hw)], [e + sx * hw * 0.8 + sunAway[0] * len, y + 0.035, -(n + sn * hw * 0.8 + sunAway[1] * len)], [e - sx * hw * 0.8 + sunAway[0] * len, y + 0.035, -(n - sn * hw * 0.8 + sunAway[1] * len)], cShade); };
      // LARGE THINGS that read at once: a rusted generator house with an exhaust stack and a pipe run to a small tank;
      // a row of big steel drums; a cable drum as tall as a door; a water tank on legs
      const genHouse = (e, n, y, yaw, eMax, hz = 1.5) => { const c = Math.cos(yaw), s = Math.sin(yaw); shade(e, n, y, 2.3, 2.6, eMax); box(e, n, y, 2.2, 2.5, hz, yaw, cRust, cRust2); box(e, n, y + 2.5, 2.35, 0.12, hz + 0.15, yaw, cRust2, cRim);
        drum(e + c * 1.4, n + s * 1.4, y + 2.6, 0.16, 1.9, cRim, cRim); box(e - c * 2.22, n - s * 2.22, y + 0.3, 0.03, 1.7, 0.6 * hz / 1.5, yaw, cRim);
        drum(e + c * 3.3, n + s * 3.3, y + 0.9, 0.14, 2.4, cDrum, cRim, Math.PI / 2 - yaw); drum(e + c * 4.6, n + s * 4.6, y, 0.55, 1.5, cTank, cRim); };
      const bigDrums = (e, n, y, yaw, k, eMax) => { const c = Math.cos(yaw), s = Math.sin(yaw); shade(e, n, y, 0.46 + 0.51 * (k - 1) * Math.abs(c * sunAway[1] - s * sunAway[0]), 1.25, eMax); for (let j = 0; j < k; j++) { const a = (j - (k - 1) / 2) * 1.02, de = e + c * a, dn = n + s * a; drum(de, dn, y, 0.46, 1.25, j % 3 === 1 ? cRust : cDrum, cRim); } };
      const bigReel = (e, n, y, yaw, eMax) => { const s = Math.sin(yaw), c = Math.cos(yaw); shade(e, n, y, 1.0, 2.1, eMax); drum(e - s * 0.55, n - c * 0.55, y, 1.05, 0.1, cPale, cPale2, yaw); drum(e + s * 0.55, n + c * 0.55, y, 1.05, 0.1, cPale, cPale2, yaw); drum(e, n, y + 0.5, 0.55, 1.0, cHub, cHub, yaw); };
      const tank = (e, n, y, eMax) => { shade(e, n, y, 1.3, 4.4, eMax); for (let k = 0; k < 6; k++) { const a = k * 1.0472, a2 = a + 1.0472; box(e + Math.cos(a) * 1.05, n + Math.sin(a) * 1.05, y, 0.07, 2.5, 0.07, 0, cSteel); if (k % 2 === 0) strip([[e + Math.cos(a) * 1.05, y + 0.3, -(n + Math.sin(a) * 1.05)], [e + Math.cos(a2) * 1.05, y + 2.3, -(n + Math.sin(a2) * 1.05)]], 0.06, 0.06, cSteel); }
        box(e, n, y + 2.5, 1.2, 0.08, 1.2, 0, cSteel); drum(e, n, y + 2.58, 1.3, 1.9, cTank, cRust2); drum(e, n, y + 4.48, 0.5, 0.25, cRust2, cRim); };
      // ON THE ROOF
      { const q = place(2.0, [-24, -11, 224, 262], 6); if (q) { const [e, n] = q, yaw = rq.range(-0.4, 0.4), c = Math.cos(yaw), s = Math.sin(yaw);
          box(e, n, yR + 0.8, 1.0, 0.07, 0.36, yaw, [0.62, 0.5, 0.33], [0.84, 0.66, 0.4]); for (const a of [-0.9, 0.9]) box(e + c * a, n + s * a, yR, 0.04, 0.8, 0.3, yaw, cWoodP);
          box(e + c * 0.5, n + s * 0.5, yR + 0.87, 0.14, 0.16, 0.1, yaw, cSteel); box(e - c * 0.4, n - s * 0.4, yR + 0.87, 0.2, 0.1, 0.16, yaw + 0.5, cCrate2, cCrate);
          for (const [a, b] of [[-1.5, -1.0], [0, -1.0], [1.5, -1.0], [1.5, 1.0], [0, 1.0], [-1.5, 1.0]]) box(e + c * a - s * b, n + s * a + c * b, yR, 0.035, b < 0 ? 2.5 : 2.15, 0.035, yaw, cSteel);
          const aw = (a, b) => [e + c * a - s * b, yR + (b < 0 ? 2.52 : 2.17), -(n + s * a + c * b)]; for (let k = 0; k < 6; k++) { const a0 = -1.7 + k * 0.5667, a1 = a0 + 0.5667; quad(aw(a0, -1.15), aw(a1, -1.15), aw(a1, 1.15), aw(a0, 1.15), k % 2 ? cSheet : cSheet2); }
          bulbAt = [e, yR + 1.95, -n]; box(e, n, yR + 2.0, 0.008, 0.34, 0.008, yaw, cCable); } }
      for (let t = 0; t < 6; t++) { const q = place(3.4, [-27, -9, 224, 264], 6.5); if (!q) break; const own = taken.pop(), yaw = rq.range(-0.3, 0.3), te = q[0] + Math.cos(yaw) * 4.0, tn = q[1] + Math.sin(yaw) * 4.0;
        if (freeAt(te, tn, 1.2, 4.5)) { taken.push(own, [te, tn, 1.9]); genHouse(q[0], q[1], yR, yaw, R.e1 - 0.4); break; } }
      { const q = place(2.0, [-30, -7, 222, 266], 6); if (q) tank(q[0], q[1], yR, R.e1 - 0.4); }
      { const q = place(2.8, [-29, -8, 222, 266], 5); if (q) bigDrums(q[0], q[1], yR, rq.range(0, 3.1), 5, R.e1 - 0.4); }
      // (the roof's big cable reel is not built: its place and its turn are still dealt, so that all dealt after it lies where it lay)
      { const q = place(1.7, [-30, 3, 222, 268], 7); if (q) rq.range(0, 3.1); }
      for (let k = 0; k < 7; k++) { const n0 = lerp(R.n0 + 6, R.n1 - 8, (k + rq.range(0.1, 0.9)) / 7), len = rq.range(3, 7), bend = rq.range(-0.5, 0.5), pts = []; if (Math.abs(n0 - P.K.ROOFFIG[1]) < 5) continue;
        for (let j = 0; j <= 6; j++) { const t = j / 6; pts.push([R.e0 - 0.6 + t * len, yR + 0.1 - 0.07 * t + (j === 0 ? -0.5 : 0), -(n0 + bend * len * t * t + 0.95 * Math.sin(j * 1.9 + k))]); } strip(pts, 0.17, 0.05, cRoot2); }
      { const list = []; for (let k = 0; k < 15; k++) { const q = place(1.2, [R.e0 + 2, R.e1 - 2, R.n0 + 3, R.n1 - 4], 1.5), r = rq.range(1.5, 3.0); if (q && onSlab(q[0], q[1], r) && clearOf('leaf', q[0], q[1], r)) list.push([q[0], q[1], r]); }
        for (let k = 0; k < 9; k++) { const a = rq.range(-1.8, 1.8), d = rq.range(3.4, 9.5), e = P.BANYAN.e + Math.cos(a) * d, n = P.BANYAN.n + Math.sin(a) * d, r = rq.range(1.7, 3.2); if (onSlab(e, n, r) && clearOf('leaf', e, n, r)) list.push([e, n, r]); } for (const q of unbar(list)) blotch(q[0], q[1], yR + 0.03, q[2], leafT); }
      { const list = []; for (let k = 0; k < 34; k++) { const edge = rq.int(0, 2), e = edge ? R.e0 + rq.range(1.4, 5.2) : rq.range(R.e0 + 3, R.e1 - 3), n = edge ? rq.range(R.n0 + 4, R.n1 - 6) : rq.range(R.n0 + 2, R.n1 - 4), r = rq.range(1.5, 3.3); if (freeAt(e, n, 0.6, 1.5) && onSlab(e, n, r) && clearOf('moss', e, n, r)) list.push([e, n, r]); } for (const q of unbar(list)) blotch(q[0], q[1], yR + 0.02, q[2], mossT); }
      // IN THE COURT (west wall's face e0, east wall's face e1)
      bigDrums(C.e0 + 0.75, C.n0 + 9, yC, 1.5708, 5, null); bigDrums(C.e1 - 0.75, C.n0 + 47.5, yC, 1.5708, 2, null); genHouse(C.e0 + 1.45, C.n0 + 33, yC, 1.5708, null, 1.2);
      for (const hgt of [3.9, 4.25]) { const pts = []; for (let n = C.n0 + 0.6; n <= C.n1 - 0.6; n += 1.5) { const u = ((n - C.n0 - 0.6) % 6) / 6; pts.push([C.e0 + 0.09, yC + hgt - 0.34 * 4 * u * (1 - u) * (hgt > 4 ? 0.7 : 1), -n]); } strip(pts, 0.035, 0.035, cCable); }
      for (let n = C.n0 + 0.6; n <= C.n1; n += 6) box(C.e0 + 0.1, n, yC + 3.85, 0.1, 0.5, 0.03, 0, cSteel);
      // (leaves drifted against the walls' feet, moss at the damp foot of the west wall)
      { const list = []; for (let k = 0; k < 9; k++) { const sd = k % 2, n = C.n0 + 3 + (k + rq.range(0.1, 0.9)) * 5.4, e = sd ? C.e1 - rq.range(1.3, 2.0) : C.e0 + rq.range(0.9, 1.7), r = rq.range(0.8, 1.5); if (Math.abs(n - (sd ? P.DOORWAYS.east : P.DOORWAYS.west)) < 2.2 || !clearOf('leafC', e, n, r)) continue; list.push([e, n, r]); } for (const q of unbar(list)) blotch(q[0], q[1], yC + 0.03, q[2], leafT); }
      { const list = []; for (let k = 0; k < 13; k++) { const n = C.n0 + 2 + (k + rq.range(0.1, 0.9)) * 3.9, sd = k % 3 === 2, e = sd ? C.e1 - rq.range(0.9, 2.6) : C.e0 + rq.range(0.7, 2.8), r = rq.range(1.0, 2.3); if (clearOf('mossC', e, n, r)) list.push([e, n, r]); } for (const q of unbar(list)) blotch(q[0], q[1], yC + 0.02, q[2], mossT); }
      // the gallery on the east wall: a steel deck a metre wide, 3 m over the floor, from 5 m to 31 m along the wall,
      // on brackets, with a rail; a stair of nine treads up to its south end
      { const g0 = C.n0 + 5, g1 = C.n0 + 31, gy = yC + 3.0, ge = C.e1 - 0.55; box(ge, (g0 + g1) / 2, gy - 0.06, 0.5, 0.06, (g1 - g0) / 2, 0, cSteel, [0.46, 0.5, 0.48]);
        for (let n = g0 + 0.3; n <= g1; n += 3.2) { box(C.e1 - 1.02, n, gy, 0.025, 1.0, 0.025, 0, cSteel); strip([[C.e1 - 0.05, gy - 0.7, -n], [C.e1 - 1.0, gy - 0.06, -n]], 0.06, 0.06, cSteel); }
        for (const hh of [0.55, 1.0]) strip([[C.e1 - 1.02, gy + hh, -(g0 + 0.3)], [C.e1 - 1.02, gy + hh, -g1]], 0.04, 0.04, cSteel);
        for (let k = 0; k < 9; k++) box(ge, g0 - 0.2 - (8 - k) * 0.42, yC + (k + 1) * 0.3333 - 0.04, 0.45, 0.04, 0.14, 0, cSteel, [0.46, 0.5, 0.48]);
        strip([[C.e1 - 1.02, yC + 0.9, -(g0 - 3.9)], [C.e1 - 1.02, gy + 1.0, -(g0 - 0.1)]], 0.04, 0.04, cSteel); strip([[C.e1 - 1.0, yC + 0.02, -(g0 - 3.75)], [C.e1 - 1.0, gy - 0.1, -(g0 - 0.1)]], 0.07, 0.07, cSteel); }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pp, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(pn, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(pc, 3)); g.setIndex(pi); g.computeBoundingSphere();
      const m = new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 }); P.underSun(m, SU, 'props'); const mesh = new THREE.Mesh(g, m); mesh.name = 'things left on the Works'; scene.add(mesh);
      // (the awning's one small lamp: a bare warm bulb on its flex over the bench)
      if (bulbAt) { const bg = new THREE.IcosahedronGeometry(0.075, 0); bg.translate(bulbAt[0], bulbAt[1], bulbAt[2]); const bm = new THREE.Mesh(bg, new THREE.MeshBasicMaterial({ color: new THREE.Color(2.6, 1.7, 0.7) })); bm.name = 'the awning\'s bulb'; scene.add(bm); }
      // PUDDLES on the roof: seven, each an uneven round 1.2 to 2.6 m across lying in the slab's hollows; still
      // water that shows the sky (peach low, pale high) and the dark of the crowns over it
      { const up = [], ud = [], ui = [], pl = []; for (let k = 0; k < 9; k++) { const q = place(1.6, [R.e0 + 3, R.e1 - 2, R.n0 + 4, R.n1 - 5], 0.5), r = rq.range(2.3, 4.3); if (q && onSlab(q[0], q[1], r) && clearOf('puddle', q[0], q[1], r)) pl.push([q[0], q[1], r, yR]); }
        unbar(pl); for (let k = 0; k < 3; k++) pl.push([rq.range(C.e0 + 3.6, C.e1 - 3.6), C.n0 + 7 + k * 15.5 + rq.range(0, 5), rq.range(1.9, 2.7), yC]);
        for (const q of unbar(pl)) { const r = q[2], sd = rq(), i0 = up.length / 3, py = q[3] + 0.014; up.push(q[0], py, -q[1]); ud.push(0, 0, sd);
          for (let j = 0; j < 12; j++) { const a = j * 0.5236; up.push(q[0] + Math.cos(a) * r, py, -(q[1] + Math.sin(a) * r * 0.75)); ud.push(Math.cos(a), Math.sin(a), sd); ui.push(i0, i0 + 1 + j, i0 + 1 + (j + 1) % 12); } }
        const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.Float32BufferAttribute(up, 3)); pg.setAttribute('aD', new THREE.Float32BufferAttribute(ud, 3)); pg.setIndex(ui); pg.computeBoundingSphere();
        const pm = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2, uniforms: { uSkyLo: { value: C3('#ffab72') }, uSkyHi: { value: C3('#b98fc6') } },
          vertexShader: /* glsl */`attribute vec3 aD; varying vec3 vD; varying vec3 vW;
            void main() { vD = aD; vec4 wp = modelMatrix * vec4(position, 1.0); vW = wp.xyz; gl_Position = projectionMatrix * viewMatrix * wp; }`,
          fragmentShader: NOISE_GLSL + /* glsl */`uniform vec3 uSkyLo, uSkyHi; varying vec3 vD; varying vec3 vW;
            void main() { float r = length(vD.xy), n1 = wN(vW.xz * 1.3 + vD.z * 13.0); float a = 1.0 - smoothstep(0.5 + 0.35 * (n1 - 0.5), 0.9, r + 0.4 * (n1 - 0.5));
              vec3 V = normalize(cameraPosition - vW); float f = 1.0 - clamp(V.y, 0.0, 1.0); f = f * f * f;
              vec3 R = reflect(-V, vec3(0.0, 1.0, 0.0)); float crown = smoothstep(0.46, 0.6, wN(R.xz / max(R.y, 0.12) * 1.6 + vW.xz * 0.04));
              vec3 sky = mix(uSkyLo, uSkyHi, smoothstep(0.2, 0.8, R.y)) * mix(1.0, 0.3, crown);
              gl_FragColor = vec4(mix(vec3(0.06, 0.07, 0.065), sky * 1.25, 0.55 + 0.45 * f), a * 0.96);
              #include <tonemapping_fragment>
              #include <colorspace_fragment>
            }` });
        const pmesh = new THREE.Mesh(pg, pm); pmesh.name = 'puddles on the roof'; pmesh.renderOrder = 2; scene.add(pmesh); }
    }
    await ctx.yield();

    // ---------- THE RADIO MAST ('mast'): on the post's roof, the Works' highest, at the far end of the view down the
    // court: a three-legged steel lattice 40 m tall in twelve panels, painted in six faded bands (red and white),
    // narrowing from 1.8 m to half a metre; a small railed platform three quarters of the way up; three thin aerial
    // arms above it, each with two short rods; three stays to the roof and three to the ground west of it; a red
    // lamp at its head, on and off every 2.4 s from a dealt phase (the world's clock). Nothing lettered, no dish. ----------
    {
      const MA = P.MAST, rm = S.mast, mp = [], mn = [], mc = [], mi = [], Hm = MA.H, NP = 12, cRed = [0.6, 0.2, 0.13], cWhite = [0.78, 0.77, 0.7], cSteel = [0.4, 0.43, 0.42], cCable = [0.15, 0.16, 0.16];
      const quad = (a, b, c, d, col) => { const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = d[0] - a[0], vy = d[1] - a[1], vz = d[2] - a[2]; let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
        const i0 = mp.length / 3; for (const q of [a, b, c, d]) { mp.push(q[0], q[1], q[2]); mn.push(nx, ny, nz); mc.push(col[0], col[1], col[2]); } mi.push(i0, i0 + 1, i0 + 2, i0, i0 + 2, i0 + 3); };
      // a thin member from p to q, wd wide: two flat strips crossed along it
      const bar = (p, q, wd, col) => { const dx = q[0] - p[0], dy = q[1] - p[1], dz = q[2] - p[2], l = Math.hypot(dx, dy, dz) || 1, d = [dx / l, dy / l, dz / l], ref = Math.abs(d[1]) > 0.9 ? [1, 0, 0] : [0, 1, 0];
        let a = [d[1] * ref[2] - d[2] * ref[1], d[2] * ref[0] - d[0] * ref[2], d[0] * ref[1] - d[1] * ref[0]]; const al = Math.hypot(a[0], a[1], a[2]) || 1; a = [a[0] / al, a[1] / al, a[2] / al]; const b = [d[1] * a[2] - d[2] * a[1], d[2] * a[0] - d[0] * a[2], d[0] * a[1] - d[1] * a[0]], h = wd / 2;
        for (const s of [a, b]) quad([p[0] - s[0] * h, p[1] - s[1] * h, p[2] - s[2] * h], [p[0] + s[0] * h, p[1] + s[1] * h, p[2] + s[2] * h], [q[0] + s[0] * h, q[1] + s[1] * h, q[2] + s[2] * h], [q[0] - s[0] * h, q[1] - s[1] * h, q[2] - s[2] * h], col); };
      const turn0 = rm.range(0, 2.094), corner = (k, j) => { const t = j / NP, r = lerp(1.5, 0.42, t), a = turn0 + k * 2.0944; return [MA.e + Math.cos(a) * r, MA.y + t * Hm, -MA.n + Math.sin(a) * r]; };
      for (let j = 0; j <= NP; j++) { const col = (5 - Math.min(5, Math.floor(j / 2))) % 2 === 0 ? cRed : cWhite, t = j / NP;
        for (let k = 0; k < 3; k++) { bar(corner(k, j), corner((k + 1) % 3, j), 0.15, col);
          if (j < NP) { bar(corner(k, j), corner(k, j + 1), lerp(0.42, 0.24, t), col); if ((j + k) % 2 === 0) bar(corner(k, j), corner((k + 1) % 3, j + 1), 0.13, col); else bar(corner((k + 1) % 3, j), corner(k, j + 1), 0.13, col); } } }
      // (the ladder up its middle, 0.4 m wide, painted with the bands: from far off the mast reads by it as one line)
      for (let j = 0; j < NP; j++) { const col = (5 - Math.min(5, Math.floor(j / 2))) % 2 === 0 ? cRed : cWhite; bar([MA.e, MA.y + (j / NP) * Hm, -MA.n], [MA.e, MA.y + ((j + 1) / NP) * Hm, -MA.n], 0.6, col); }
      // the lit hut at its foot, on the post's roof south of the mast: 2.6 by 2.2 m and 2.1 m tall, a lit window
      // in its south face and in its west face
      { const he = 3.0, hn = MA.n - 4.3, X = 1.3, Z = 1.1, Hh = 2.1, cHut = [0.46, 0.46, 0.42], cLit = [4.2, 1.7, 0.4], c = (a, b, yy) => [he + a * X, MA.y + yy, -(hn + b * Z)];
        quad(c(-1, -1, 0), c(1, -1, 0), c(1, -1, Hh), c(-1, -1, Hh), cHut); quad(c(1, -1, 0), c(1, 1, 0), c(1, 1, Hh), c(1, -1, Hh), cHut); quad(c(1, 1, 0), c(-1, 1, 0), c(-1, 1, Hh), c(1, 1, Hh), cHut); quad(c(-1, 1, 0), c(-1, -1, 0), c(-1, -1, Hh), c(-1, 1, Hh), cHut);
        quad(c(-1.1, -1.1, Hh), c(1.1, -1.1, Hh), c(1.1, 1.1, Hh), c(-1.1, 1.1, Hh), cSteel);
        quad(c(-0.6, -1.03, 0.85), c(0.6, -1.03, 0.85), c(0.6, -1.03, 1.75), c(-0.6, -1.03, 1.75), cLit); quad(c(-1.03, 0.55, 0.85), c(-1.03, -0.55, 0.85), c(-1.03, -0.55, 1.75), c(-1.03, 0.55, 1.75), cLit); }
      // the platform: a six-sided deck 1.5 m about the mast at the ninth panel's foot, with six rail posts and a rail
      { const py = MA.y + 0.75 * Hm, ring = []; for (let k = 0; k < 6; k++) { const a = turn0 + k * 1.0472; ring.push([MA.e + Math.cos(a) * 1.5, py, -MA.n + Math.sin(a) * 1.5]); }
        for (let k = 0; k < 6; k++) { const p0 = ring[k], p1 = ring[(k + 1) % 6]; quad(p0, p1, [MA.e, py, -MA.n], [MA.e, py, -MA.n], cSteel); bar(p0, [p0[0], py + 1.0, p0[2]], 0.05, cSteel); bar([p0[0], py + 1.0, p0[2]], [p1[0], py + 1.0, p1[2]], 0.05, cSteel); } }
      // three aerial arms, each on its own dealt bearing, with a short rod standing at either end
      [[0.82, 2.4], [0.89, 2.0], [0.96, 1.6]].forEach(([t, half]) => { const a = rm.range(0, Math.PI), y = MA.y + t * Hm, c = Math.cos(a), s = Math.sin(a), p0 = [MA.e - c * half, y, -MA.n - s * half], p1 = [MA.e + c * half, y, -MA.n + s * half];
        bar(p0, p1, 0.07, cSteel); for (const q of [p0, p1]) bar([q[0], y - 0.45, q[2]], [q[0], y + 0.45, q[2]], 0.045, cSteel); });
      // the stays: three to the roof (west, north-north-east, south), three to the ground (south-south-west,
      // west-north-west, north-north-west); none toward the line
      for (const [t, brg, d] of [[0.5, 270, 2.4], [0.5, 30, 2.4], [0.5, 180, 2.4], [0.88, 210, 18], [0.88, 290, 18], [0.88, 345, 18]]) { const b = P.onBearing(brg), e = MA.e + b[0] * d, n = MA.n + b[1] * d;
        bar([MA.e + b[0] * 0.3, MA.y + t * Hm, -(MA.n + b[1] * 0.3)], [e, d < 5 ? MA.y : P.groundAt(e, n) - 0.1, -n], 0.05, cCable); }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(mp, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(mn, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(mc, 3)); g.setIndex(mi); g.computeBoundingSphere();
      const m = new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide }); P.underSun(m, SU, 'mast'); const mesh = new THREE.Mesh(g, m); mesh.name = 'the radio mast'; scene.add(mesh);
      // the red lamp at its head and its halo (a medium: the lamp's light in the air about it, 5 m across, turned
      // to the eye as the lamps' halos are)
      const top = new THREE.Vector3(MA.e, MA.y + Hm + 0.45, -MA.n), ph = rm.range(0, 1), blink = 'smoothstep(0.0, 0.08, fract(uTime / 2.4 + uPh)) * (1.0 - smoothstep(0.5, 0.58, fract(uTime / 2.4 + uPh)))';
      const lg = new THREE.IcosahedronGeometry(0.8, 0); lg.translate(top.x, top.y, top.z);
      const lm = new THREE.ShaderMaterial({ uniforms: { uTime: U.time, uPh: { value: ph } }, vertexShader: /* glsl */`void main() { gl_Position = projectionMatrix * viewMatrix * vec4(position, 1.0); }`,
        fragmentShader: /* glsl */`uniform float uTime, uPh;
          void main() { float on = ` + blink + /* glsl */`; gl_FragColor = vec4(mix(vec3(0.22, 0.02, 0.02), vec3(3.4, 0.3, 0.14), on), 1.0);
            #include <tonemapping_fragment>
            #include <colorspace_fragment>
          }` });
      const lamp = new THREE.Mesh(lg, lm); lamp.name = 'the mast\'s red lamp'; scene.add(lamp);
      const hg = new THREE.BufferGeometry(); hg.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3)); hg.setIndex([0, 1, 2, 0, 2, 3]); hg.boundingSphere = new THREE.Sphere(top.clone(), 3);
      const hm = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, uniforms: { uTime: U.time, uPh: { value: ph }, uAt: { value: top } },
        vertexShader: /* glsl */`uniform vec3 uAt; varying vec2 vQ;
          void main() { vQ = position.xy; vec4 mv = viewMatrix * vec4(uAt, 1.0); mv.xy += position.xy * 4.6; gl_Position = projectionMatrix * mv; }`,
        fragmentShader: /* glsl */`uniform float uTime, uPh; varying vec2 vQ;
          void main() { float on = ` + blink + /* glsl */`; float r2 = dot(vQ, vQ); float a = (exp(-r2 * 5.0) + 1.4 * exp(-r2 * 40.0)) * (1.0 - smoothstep(0.7, 1.0, sqrt(r2))) * on;
            gl_FragColor = vec4(vec3(1.8, 0.17, 0.08) * a, 1.0);
            #include <tonemapping_fragment>
            #include <colorspace_fragment>
          }` });
      const halo = new THREE.Mesh(hg, hm); halo.name = 'the red lamp\'s halo'; halo.renderOrder = 6; scene.add(halo);
    }
    // (no rest here: this step and the next are short, and one frame holds both)

    // ---------- CORAL HEADS on the reef's crest ('reef'): low, broad, many-lobed and knobbed, mottled in three tones ----------
    // Most lie under the water and are seen through it; the few that stand awash carry a broken collar of foam.
    {
      const cp = [], cn = [], cc = [], ci = [], fp = [], fa = [], fi = [], ico = new THREE.IcosahedronGeometry(1, 1), pa = ico.attributes.position, tones = [C3('#8a7a52'), C3('#b09a7c'), C3('#6f7a4e')], tc = new THREE.Color();
      let heads = 0;
      for (const h of L.corals) { const y0 = h.top - h.tall; if (++heads % 9 === 0) await ctx.yield();
        for (const lb of h.lobes) { const le = h.e + lb[0] * 0.55, ln = h.n + lb[1] * 0.55, r = lb[2] * 0.9, base = cp.length / 3;
          for (let i = 0; i < pa.count; i++) { const x = pa.getX(i), y = Math.max(-0.2, pa.getY(i)), z = pa.getZ(i), knob = 1 + 0.16 * Math.sin(x * 9.1 + le) * Math.sin(z * 8.3 + ln) + 0.08 * Math.sin(y * 13 + x * 7);
            const px = le + x * r * knob, pz = ln + z * r * knob, f = noise.n2(px * 1.9, pz * 1.9), f2 = noise.n2(px * 0.8 + 5, pz * 0.8);
            cp.push(px, y0 + Math.pow(Math.max(0, y), 0.7) * lb[3] * knob + Math.min(0, y) * 0.5, -pz); cn.push(x, 0.5 + y * 1.4, -z);
            tc.copy(tones[0]).lerp(tones[1], smoothstep(-0.1, 0.3, f)).lerp(tones[2], smoothstep(0.1, 0.45, f2)).multiplyScalar(0.8 + 0.3 * Math.max(0, y)); cc.push(tc.r, tc.g, tc.b); ci.push(base + i); } }
        if (h.awash) { const i0 = fp.length / 3; fp.push(h.e, 0.06, -h.n); fa.push(0, h.w); for (let s = 0; s < 14; s++) { const a = s / 14 * Math.PI * 2; fp.push(h.e + Math.cos(a) * h.w * 0.95, 0.06, -(h.n + Math.sin(a) * h.w * 0.95)); fa.push(1, h.w); } for (let s = 0; s < 14; s++) fi.push(i0, i0 + 1 + s, i0 + 1 + (s + 1) % 14); } }
      // (and a broken collar of foam about the wreck's engine pod, which lies in the wash)
      { const q = L.wreck.pod, w = 3.1, i0 = fp.length / 3; fp.push(q.e, 0.07, -q.n); fa.push(0, w); for (let s = 0; s < 14; s++) { const a = s / 14 * Math.PI * 2; fp.push(q.e + Math.cos(a) * w, 0.07, -(q.n + Math.sin(a) * w)); fa.push(1, w); } for (let s = 0; s < 14; s++) fi.push(i0, i0 + 1 + s, i0 + 1 + (s + 1) % 14); }
      ico.dispose(); const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(cp, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(cn, 3)); g.normalizeNormals(); g.setAttribute('color', new THREE.Float32BufferAttribute(cc, 3)); g.setIndex(ci); g.computeBoundingSphere();
      const mesh = new THREE.Mesh(g, new THREE.MeshLambertMaterial({ vertexColors: true })); mesh.name = 'coral heads'; scene.add(mesh);
      const fg = new THREE.BufferGeometry(); fg.setAttribute('position', new THREE.Float32BufferAttribute(fp, 3)); fg.setAttribute('aF', new THREE.Float32BufferAttribute(fa, 2)); fg.setIndex(fi); fg.computeBoundingSphere();
      const fm = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, uniforms: { uTime: U.time },
        vertexShader: /* glsl */`attribute vec2 aF; varying vec2 vF; varying vec3 vP; void main() { vF = aF; vec4 wp = modelMatrix * vec4(position, 1.0); vP = wp.xyz; gl_Position = projectionMatrix * viewMatrix * wp; }`,
        fragmentShader: NOISE_GLSL + /* glsl */`uniform float uTime; varying vec2 vF; varying vec3 vP;
          void main() { float s = 0.6 * wN(vP.xz * 1.5 + vec2(uTime * 0.3, -uTime * 0.22)) + 0.4 * wN(vP.xz * 3.6 - vec2(uTime * 0.41, uTime * 0.17));
            float band = smoothstep(0.3, 0.5, vF.x) * (1.0 - smoothstep(0.7, 1.0, vF.x)); gl_FragColor = vec4(vec3(1.25, 1.1, 0.9), smoothstep(0.42, 0.62, s + 0.25 * band) * band * 0.9);
            #include <tonemapping_fragment>
            #include <colorspace_fragment>
          }` });
      const foam = new THREE.Mesh(fg, fm); foam.name = 'foam about the coral heads that stand awash'; foam.renderOrder = 3; scene.add(foam);
    }
    await ctx.yield();
    // ---------- DRIPS ('drips'; a medium): drops falling from the court's root curtains onto its rain sheet (which they
    // ring) and from the room's roof lip. A drop is as plain at any distance from the eye; the scene's haze alone
    // takes the far ones. ----------
    {
      const g = QUAD(), a0 = [], a1 = [];
      for (const q of L.drips) { a0.push(q.e, q.y0, -q.n, q.y0 - q.y1); a1.push(q.ph, q.per, 0, 0); }
      IA(g, 'aAt', a0, 4); IA(g, 'aPh', a1, 4); g.instanceCount = L.drips.length;
      const m = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, uniforms: { uTime: U.time, uK: { value: 0.5 + 0.35 * wet } },
        vertexShader: /* glsl */`attribute vec4 aAt; attribute vec4 aPh; uniform float uTime; varying vec2 vUv; varying float vA;
          void main() { float ts = fract(uTime / aPh.y + aPh.x) * aPh.y, tf = min(1.0, ts / max(0.14, sqrt(max(aAt.w, 0.1) / 4.9))); vec3 c = aAt.xyz; c.y -= aAt.w * tf * tf;
            vec4 mv = viewMatrix * vec4(c, 1.0); mv.xy += position.xy * vec2(0.04, 0.2); gl_Position = projectionMatrix * mv; vUv = position.xy * 2.0; vA = step(tf, 0.999); }`,
        fragmentShader: /* glsl */`uniform float uK; varying vec2 vUv; varying float vA;
          void main() { gl_FragColor = vec4(vec3(0.86, 0.93, 0.92), (1.0 - smoothstep(0.3, 1.0, dot(vUv, vUv))) * vA * uK);
            #include <tonemapping_fragment>
            #include <colorspace_fragment>
          }` });
      const mesh = new THREE.Mesh(g, m); mesh.name = 'drips'; mesh.frustumCulled = false; mesh.renderOrder = 5; scene.add(mesh);
    }
    await ctx.yield();
    // ---------- THE GREAT BANYAN AND ITS LANTERNS ('banyan'): the Works' subject, lamps under roots ----------
    // One mesh of bark and leaf under the sun map; the lanterns, their halos and their warm pools follow below.
    {
      const bp = [], bn = [], bc = [], bi = [], yR = P.K.LIP, BY = P.BANYAN;
      // a tube along points [e, y, n, r] of the plan, k sides, its tone running from col to col2 along it
      const tube = (pts, k, col, col2 = col) => { const i0 = bp.length / 3, m = pts.length;
        for (let j = 0; j < m; j++) { const a = pts[Math.max(0, j - 1)], b = pts[Math.min(m - 1, j + 1)], p = pts[j]; let tx = b[0] - a[0], ty = b[1] - a[1], tz = a[2] - b[2]; const tl = Math.hypot(tx, ty, tz) || 1; tx /= tl; ty /= tl; tz /= tl;
          let ux = Math.abs(ty) > 0.9 ? 1 : 0, uy = Math.abs(ty) > 0.9 ? 0 : 1, uz = 0, sx = ty * uz - tz * uy, sy = tz * ux - tx * uz, sz = tx * uy - ty * ux; const sl = Math.hypot(sx, sy, sz) || 1; sx /= sl; sy /= sl; sz /= sl; ux = sy * tz - sz * ty; uy = sz * tx - sx * tz; uz = sx * ty - sy * tx;
          const t = m > 1 ? j / (m - 1) : 0;
          for (let i = 0; i < k; i++) { const an = i * 6.2832 / k, ca = Math.cos(an), sa = Math.sin(an), nx = sx * ca + ux * sa, ny = sy * ca + uy * sa, nz = sz * ca + uz * sa, sh = 0.8 + 0.2 * ((i * 7 + j * 3) % 5) / 4;
            bp.push(p[0] + nx * p[3], p[1] + ny * p[3], -p[2] + nz * p[3]); bn.push(nx, ny, nz); bc.push((col[0] + (col2[0] - col[0]) * t) * sh, (col[1] + (col2[1] - col[1]) * t) * sh, (col[2] + (col2[2] - col[2]) * t) * sh); } }
        for (let j = 0; j + 1 < m; j++) for (let i = 0; i < k; i++) { const a = i0 + j * k + i, b = i0 + j * k + (i + 1) % k; bi.push(a, b, b + k, a, b + k, a + k); } };
      const cBark = [0.3, 0.235, 0.17], cBark2 = [0.24, 0.2, 0.15], cRootB = [0.33, 0.25, 0.17], cTip = [0.22, 0.17, 0.12], cLeaf = [0.13, 0.24, 0.07], cLeafD = [0.035, 0.075, 0.035];
      for (const s of BAN.stems) tube(s, 7, cBark, cBark2);
      for (const b of BAN.boughs) tube(b, 5, cBark2, [0.17, 0.15, 0.11]);
      // the crown's masses: low domes of leaf, light above and dark beneath
      for (let q = 0; q < BAN.crown.length; q++) { const c = BAN.crown[q], i0 = bp.length / 3, lat = [[0.93, 0.36], [0.5, 0.86], [0, 1], [-0.42, 0.8]];
        bp.push(c[0], c[1] + c[4], -c[2]); bn.push(0, 1, 0); bc.push(cLeaf[0], cLeaf[1], cLeaf[2]);
        for (let j = 0; j < 4; j++) for (let i = 0; i < 7; i++) { const an = i * 0.8976 + j * 0.45 + q, wob = 0.86 + 0.14 * Math.sin(i * 2.3 + j * 1.7 + q * 0.9), x = Math.cos(an) * lat[j][1] * wob, z = Math.sin(an) * lat[j][1] * wob, y = lat[j][0], k = 0.5 + 0.5 * y;
          bp.push(c[0] + x * c[3], c[1] + y * c[4], -c[2] + z * c[3]); const nl = Math.hypot(x, y * 1.6, z) || 1; bn.push(x / nl, y * 1.6 / nl, z / nl); bc.push(cLeafD[0] + (cLeaf[0] - cLeafD[0]) * k, cLeafD[1] + (cLeaf[1] - cLeafD[1]) * k, cLeafD[2] + (cLeaf[2] - cLeafD[2]) * k); }
        bp.push(c[0], c[1] - 0.5 * c[4], -c[2]); bn.push(0, -1, 0); bc.push(cLeafD[0], cLeafD[1], cLeafD[2]);
        for (let i = 0; i < 7; i++) { bi.push(i0, i0 + 1 + i, i0 + 1 + (i + 1) % 7); bi.push(i0 + 29, i0 + 22 + (i + 1) % 7, i0 + 22 + i); }
        for (let j = 0; j < 3; j++) for (let i = 0; i < 7; i++) { const a = i0 + 1 + j * 7 + i, b = i0 + 1 + j * 7 + (i + 1) % 7; bi.push(a, b, b + 7, a, b + 7, a + 7); } }
      // roots under the boughs (to the paving, or still in the air), buttress roots, the great root, the curtains
      for (const r of BAN.props) tube([[r[0], r[1], r[2], r[3] * 0.8], [r[0] + r[4] * 0.6, (r[1] + r[6]) / 2, r[2] + r[5] * 0.6, r[3]], [r[0] + r[4], r[6] - 0.1, r[2] + r[5], r[6] === yR ? r[3] * 1.5 : r[3] * 0.5]], 4, cBark2, cRootB);
      for (const r of BAN.butt) tube(r, 5, cRootB, cTip);
      tube(BAN.arm, 6, cRootB, cTip);
      for (const g of BAN.curtains) for (const s of g.strands) { const hgt = s.top - 0.5 - s.low, pts = [[-23.0, s.top - 0.06, s.n, s.r], [g.face - 0.2, s.top + 0.06, s.n + s.drift * 0.15, s.r], [s.e, s.top - 0.5, s.n + s.drift * 0.3, s.r]];
        for (let j = 1; j <= 4; j++) { const t = j / 4; pts.push([s.e + 0.07 * Math.sin(s.ph + j * 1.9), s.top - 0.5 - hgt * t, s.n + s.drift * (0.3 + 0.7 * t) + 0.14 * Math.sin(s.ph * 2.3 + j * 2.4), s.r * (1 - 0.45 * t)]); }
        tube(pts, 3, cRootB, cTip); }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(bp, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(bn, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(bc, 3)); g.setIndex(bi); g.computeBoundingSphere();
      const m = new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide }); P.underSun(m, SU, 'vines'); const mesh = new THREE.Mesh(g, m); mesh.name = 'the great banyan'; scene.add(mesh);
      await ctx.yield();
      // THE LANTERNS: a small paper body on a thin cord, glowing; each sways a little on the world's clock by its own
      // dealt phase (the cord's foot and the body move, the cord's head is still)
      const lp = [], ls = [], lc = [], li = [], hat = [], hph = [], qp = [], qu = [], qi = [], R = P.K.ROOF, C = P.K.COURT, F = P.K.FLOOR, stairFace = P.K.STAIR.e - P.K.STAIR.w / 2;
      const rings = [[1.2, 0.5, [0.95, 0.33, 0.07]], [0.8, 0.95, [1.45, 0.62, 0.16]], [0, 1.08, [1.8, 0.86, 0.26]], [-0.8, 0.95, [1.45, 0.62, 0.16]], [-1.2, 0.5, [0.95, 0.33, 0.07]]], cDark = [0.05, 0.04, 0.03];
      let lift = 0; const pool = (a, b, c, d, k) => { const i0 = qp.length / 3; qp.push(...a, ...b, ...c, ...d); qu.push(-1, -1, k, 1, -1, k, 1, 1, k, -1, 1, k); qi.push(i0, i0 + 1, i0 + 2, i0, i0 + 2, i0 + 3); lift += 0.0012; };
      for (const l of BAN.lanterns) { const s = l.size, x = l.e, z = -l.n, i0 = lp.length / 3;
        for (const [dy, rr, col] of [[1.5, 0.28, cDark], ...rings]) for (let i = 0; i < 5; i++) { const an = i * 1.2566 + l.ph * 6; lp.push(x + Math.cos(an) * rr * s, l.y + dy * s, z + Math.sin(an) * rr * s); ls.push(l.ph, 1); lc.push(col[0], col[1], col[2]); }
        for (let j = 0; j < 5; j++) for (let i = 0; i < 5; i++) { const a = i0 + j * 5 + i, b = i0 + j * 5 + (i + 1) % 5; li.push(a, b, b + 5, a, b + 5, a + 5); }
        const c0 = lp.length / 3; for (const [yy, wt] of [[l.top, 0], [l.y + 1.5 * s, 1]]) for (let i = 0; i < 3; i++) { const an = i * 2.0944; lp.push(x + Math.cos(an) * 0.014, yy, z + Math.sin(an) * 0.014); ls.push(l.ph, wt); lc.push(cDark[0], cDark[1], cDark[2]); }
        for (let i = 0; i < 3; i++) { const a = c0 + i, b = c0 + (i + 1) % 3; li.push(a, b, b + 3, a, b + 3, a + 3); }
        const onRoof = l.n <= R.n1, inCourt = l.n > C.n0;
        hat.push(x, l.y, z, onRoof ? 2.1 : 1.25); hph.push(l.ph, onRoof ? 1 : 0.8);
        if (onRoof) { const h = l.y - P.K.LIP, r = Math.min(1.6 + 0.55 * h, 5.5, l.e - R.e0 - 0.05, R.e1 - l.e - 0.05, l.n - R.n0 - 0.05, R.n1 - l.n - 0.05), y = P.K.LIP + 0.035 + lift;
          if (r > 0.6) pool([x - r, y, z - r], [x + r, y, z - r], [x + r, y, z + r], [x - r, y, z + r], 0.75 / (1 + h * h / 10)); }
        else { const wallE = (inCourt ? C.e0 : stairFace) + 0.03 + lift; let r = inCourt ? 1.8 : 1.5;
          if (inCourt) { for (const w of P.WINDOWS.west) r = Math.min(r, Math.abs(l.n - w) - 0.8); r = Math.min(r, Math.abs(l.n - P.DOORWAYS.west) - 0.7); }
          if (r > 0.5) pool([wallE, l.y - r, z - r], [wallE, l.y - r, z + r], [wallE, l.y + r, z + r], [wallE, l.y + r, z - r], 0.55);
          if (inCourt) { const h = l.y - F, rf = 1.4 + 0.5 * h, y = F + 0.04 + lift; pool([x - rf, y, z - rf], [x + rf, y, z - rf], [x + rf, y, z + rf], [x - rf, y, z + rf], 0.7 / (1 + h * h / 10)); } } }
      // THREE LIT BANDS OF GLASS BLOCK high on the court's east wall, between its windows and over the gallery's rail: seven
      // blocks a band, each band with its glow and its pool on the floor (they do not sway)
      for (const bn0 of [306.3, 320.6, 344]) { const eW = C.e1 - 0.03, yb = F + 4.62;
        for (let k = 0; k < 7; k++) { const n0 = bn0 - 1.12 + k * 0.32, i0 = lp.length / 3, v = 0.72 + 0.28 * ((k * 5 + Math.round(bn0)) % 4) / 3;
          lp.push(eW, yb, -n0, eW, yb, -(n0 + 0.29), eW, yb + 0.46, -(n0 + 0.29), eW, yb + 0.46, -n0); for (let q = 0; q < 4; q++) { ls.push(0, 0); lc.push(1.5 * v, 0.72 * v, 0.24 * v); } li.push(i0, i0 + 1, i0 + 2, i0, i0 + 2, i0 + 3); }
        hat.push(eW - 0.2, yb + 0.23, -bn0, 1.7); hph.push(0.37, 0.55);
        { const rf = 2.6, y = F + 0.04 + lift, x = eW - 1.4, z = -bn0; pool([x - rf, y, z - rf], [x + rf, y, z - rf], [x + rf, y, z + rf], [x - rf, y, z + rf], 0.3); } }
      { const lg = new THREE.BufferGeometry(); lg.setAttribute('position', new THREE.Float32BufferAttribute(lp, 3)); lg.setAttribute('aSw', new THREE.Float32BufferAttribute(ls, 2)); lg.setAttribute('aCol', new THREE.Float32BufferAttribute(lc, 3)); lg.setIndex(li); lg.computeBoundingSphere();
        const lm = new THREE.ShaderMaterial({ side: THREE.DoubleSide, uniforms: { uTime: U.time },
          vertexShader: /* glsl */`attribute vec2 aSw; attribute vec3 aCol; uniform float uTime; varying vec3 vC;
            void main() { vec3 p = position; float w1 = uTime * 1.15 + aSw.x * 6.2832; p.x += 0.09 * aSw.y * sin(w1); p.z += 0.06 * aSw.y * sin(w1 * 0.83 + aSw.x * 9.0);
              vC = aCol * (0.92 + 0.08 * sin(uTime * 2.3 + aSw.x * 40.0)); gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0); }`,
          fragmentShader: /* glsl */`varying vec3 vC;
            void main() { gl_FragColor = vec4(vC, 1.0);
              #include <tonemapping_fragment>
              #include <colorspace_fragment>
            }` });
        const lmesh = new THREE.Mesh(lg, lm); lmesh.name = 'the banyan\'s lanterns'; scene.add(lmesh); }
      { const hg = QUAD(); IA(hg, 'aAt', hat, 4); IA(hg, 'aPh', hph, 2); hg.instanceCount = hat.length / 4;
        const hm = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, uniforms: { uTime: U.time, uCol: { value: new THREE.Color(1.5, 0.69, 0.21) } },
          vertexShader: /* glsl */`attribute vec4 aAt; attribute vec2 aPh; uniform float uTime; varying vec2 vUv; varying float vK;
            void main() { vec3 c = aAt.xyz; float w1 = uTime * 1.15 + aPh.x * 6.2832; c.x += 0.09 * sin(w1); c.z += 0.06 * sin(w1 * 0.83 + aPh.x * 9.0);
              vec4 mv = viewMatrix * vec4(c, 1.0); mv.xy += position.xy * aAt.w * 2.0; gl_Position = projectionMatrix * mv; vUv = position.xy * 2.0; vK = aPh.y * (0.92 + 0.08 * sin(uTime * 2.3 + aPh.x * 40.0)); }`,
          fragmentShader: /* glsl */`uniform vec3 uCol; varying vec2 vUv; varying float vK;
            void main() { float r2 = dot(vUv, vUv); float a = (0.3 * exp(-r2 * 4.5) + 0.32 * exp(-r2 * 40.0)) * (1.0 - smoothstep(0.55, 1.0, r2)) * vK; gl_FragColor = vec4(uCol * a, 1.0);
              #include <tonemapping_fragment>
              #include <colorspace_fragment>
            }` });
        const hmesh = new THREE.Mesh(hg, hm); hmesh.name = 'the lanterns\' halos'; hmesh.frustumCulled = false; hmesh.renderOrder = 6; scene.add(hmesh); }
      { const qg = new THREE.BufferGeometry(); qg.setAttribute('position', new THREE.Float32BufferAttribute(qp, 3)); qg.setAttribute('aUv', new THREE.Float32BufferAttribute(qu, 3)); qg.setIndex(qi); qg.computeBoundingSphere();
        const qm = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3, uniforms: { uCol: { value: new THREE.Color(1.0, 0.5, 0.17) } },
          vertexShader: /* glsl */`attribute vec3 aUv; varying vec3 vU;
            void main() { vU = aUv; gl_Position = projectionMatrix * viewMatrix * vec4(position, 1.0); }`,
          fragmentShader: /* glsl */`uniform vec3 uCol; varying vec3 vU;
            void main() { float a = max(1.0 - dot(vU.xy, vU.xy), 0.0); gl_FragColor = vec4(uCol * a * a * vU.z, 1.0);
              #include <tonemapping_fragment>
              #include <colorspace_fragment>
            }` });
        const qmesh = new THREE.Mesh(qg, qm); qmesh.name = 'the lanterns\' pools of light'; qmesh.renderOrder = 4; scene.add(qmesh); }
    }
    // ---------- THE TRODDEN PATH on the basin's meadow: a pale worn strip that winds from the rim toward the ship,
    // lying on the turf, soft at its edges, broken where the ground is not meadow or water is near ----------
    { const ctl = [[27, 514], [30.5, 527], [35, 540], [45, 566], [51, 596], [48, 626], [43, 652], [42, 676], [40, 690]], pp2 = [], pc2 = [], pi2 = [], MDp = P.K.MEADOW; let prev = -1;
      for (let i = 0; i + 1 < ctl.length; i++) { const a0 = ctl[i], b0 = ctl[i + 1], len = Math.hypot(b0[0] - a0[0], b0[1] - a0[1]), nseg = Math.ceil(len / 2), tx = (b0[0] - a0[0]) / len, tn = (b0[1] - a0[1]) / len;
        for (let j = 0; j < nseg; j++) { const t = j / nseg, wv = 1.6 * Math.sin((i + t) * 2.1), e = a0[0] + (b0[0] - a0[0]) * t + tn * wv, n = a0[1] + (b0[1] - a0[1]) * t - tx * wv, h = P.groundAt(e, n);
          if (Math.abs(h - MDp) > 0.6 || P.riftAt(e, n)[0] < 2.2) { prev = -1; continue; }
          const i0 = pp2.length / 3; for (const [o, al] of [[-1.7, 0], [-0.7, 0.5], [0.7, 0.5], [1.7, 0]]) { const pe = e + tn * o, pn = n - tx * o; pp2.push(pe, P.groundAt(pe, pn) + 0.07, -pn); pc2.push(0.52, 0.46, 0.31, al * 0.9); }
          if (prev >= 0) for (let q = 0; q < 3; q++) pi2.push(prev + q, i0 + q, i0 + q + 1, prev + q, i0 + q + 1, prev + q + 1); prev = i0; } }
      const pg2 = new THREE.BufferGeometry(); pg2.setAttribute('position', new THREE.Float32BufferAttribute(pp2, 3)); pg2.setAttribute('color', new THREE.Float32BufferAttribute(pc2, 4)); pg2.setIndex(pi2); pg2.computeBoundingSphere();
      const pmesh = new THREE.Mesh(pg2, new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, depthWrite: false, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 })); pmesh.name = 'the trodden path'; pmesh.renderOrder = 2; scene.add(pmesh); }
    // ---------- A SOFT SHADE AT THE FOOT of every small thing that stands on a floor of the Works: kerbs, cowls and
    // their plinths, pots, the piers (the ground's own feet are laid into its colours above) ----------
    {
      const pts = [];
      for (const q of L.kerbs) pts.push({ x: q[0], z: -q[1], r: 0.3 });
      for (const c of L.cowls) if (!c.gone) pts.push({ x: c.e, z: -c.n, r: 0.6 });
      for (const r of L.pots) for (const q of r.pots) if (Math.abs(P.standAt(q[0], q[1]) - q[2]) < 0.12) pts.push({ x: q[0], z: -q[1], r: 0.42 * q[3] + 0.12 });
      for (const b of P.worksBlocks()) if (/piers/.test(b.k)) pts.push({ x: b.e, z: -b.n, r: Math.max(b.hl, b.hd) + 0.35 });
      const feet = flora.makeGroundShadows({ points: pts, heightAt: (x, z) => P.standAt(x, -z), sunDir, strength: 0.42, color: '#22383c', size: 1, stretch: 0, lift: 0.035, cell: 2 });
      feet.object.name = 'soft shade at the feet of the Works\' small things'; scene.add(feet.object);
    }
    await ctx.yield();

    // ---------- what the engine flies ----------
    const pois = P.LOOKS.map((k) => { const v = new THREE.Vector3(); return { at: () => v.set(k.at[0], k.at[2], -k.at[1]), from: P.flownAt(k.from) / P.FLOWN, to: P.flownAt(k.to) / P.FLOWN, weight: k.weight, fade: 0.3 }; });
    const update = (dt, time, camera, u) => {
      U.time.value = time;
      sky.update(dt, time, camera); rig.update(dt, time, camera); terrain.update(dt, time); ocean.update(dt, time, camera);
      rill.update(dt, time, camera); falls.update(dt, time, camera); brook.update(dt, time, camera);
      hero.update(dt, time, camera); wind.update(time + gustPh);
      cups.rotation.y = -time * Math.PI * 2;
      // THE RARE VISIT: one wide cloud (about 200 m across) drifting down the wind at 6 m/s over the Works; it forms,
      // crosses and thins again on an 80 s course of the world's clock ('rare' sets where on that course the clock
      // finds it). Under it the sun's light is taken away, the gold streaks with it; the sky's fill stays.
      if (rare) { const ph = (time / 80 + cloudPh) % 1; cloudU.value.x = -420 + ph * 480; cloudU.value.z = 0.85 * smoothstep(0, 0.12, ph) * (1 - smoothstep(0.88, 1, ph)); }
      cap.scale.set(1 + 0.035 * Math.sin(time * 0.31), 1 + 0.06 * Math.sin(time * 0.23 + 1.3), 1 + 0.03 * Math.sin(time * 0.27 + 0.6));
    };
    return {
      scene, path, duration: 48, pace: L.pace, ride: 'none', companion: 'none',
      camera: { fov: 62, near: 0.3, far: 9000, lookAhead: 30, sway: 0.35, bank: 0.15 },
      pois,
      portal: { shape: 'circle', radius: 7, color: '#3fd0c0', glow: 1, revealDistance: 260 },
      post: { exposure: 0.93, bloom: { strength: 0.36, radius: 0.55, threshold: 0.92 }, grade: { saturation: 1.07, contrast: 1.09 } },
      update,
      dispose() { sky.dispose(); hero.dispose(); SU.uSunMap.value.dispose(); },
    };
  },
};
