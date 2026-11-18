// The Red Drive Down to the Sea
// Early summer on a western sea coast. The flight crosses one estate once, east to west, low: along a winding gravel
// drive under a nave of beech (a dark vault, a glade of bluebells, red bushes growing to a wall), between two towering
// banks of deep red rhododendron with a long grey house standing small in the gap at their end, out onto the lawn and
// close along the house's whole front at the height of its first-floor sills, the sea coming in wide round its seaward
// end where the lawn falls away, then down a valley of pale azaleas beside a stream to a cove of shingle, where the
// ring stands over the water.
//
// Axes: +X east (inland), -X west (the sea), +Z south, +Y up, sea level y 0. The plan of the estate (route, ground,
// drive, cut, lawn, valley, cove) is plain arithmetic in src/parts/red-drive-down-to-the-sea.js (makeLayout); the red
// banks are that file's bank builder.
//
// The place stands: one hour per visit from the first metre to the last, nothing begins, turns or ends because we
// come. No companion goes with the visitor. What is declared: the camera's own pace by place and its one look (to a
// point out to sea beyond the house: the front while it is abeam, then the sea: see the end of build). Everything that moves
// does so on the world's clock as a habit that reads at any phase. No piece is sized, thinned or switched by the eye's
// distance: built flower heads stand full size and are thinned at build by a dealt draw against their distance from
// the route's LINE; which stretch of the route can see which piece is decided once at build by places (sightTable);
// the vault's shafts keep out of the drive's lane by place (makeVaultShafts). What the eye's distance does do in these
// two files: the haze between the eye and a thing thickens with the length of the eye's line (it pales a shaft's light
// as it pales a trunk); painted grain (the floor's leaves, the daisies, the pebbles, fallen petals, a spray's leaves, a bank's painted flowers, a built head's petals) goes over to a flat tone far off: to its own COUNTED mean for the copper drifts, the mast and a spray's leaves; to a typed tone that is not yet its mean for the plain litter, the bluebells, the daisies, the thrift's cushions, the fallen red flowers and the valley's petals (a step in tone between near and far, left to mend);
// and three specks go to nothing far off, not to a mean: the wrack line's shells and the thrift's flowers.
// Behind the entry the drive, the ground and the wood go on 400 m along the entry's own axis (camera.nearThrough is
// set because we ride 3 m over the gravel); the trunk lane widens with the distance behind the entry and nothing of
// any tree hangs into it.
import * as THREE from 'three';
import { clamp, lerp, smoothstep } from '../kit/core.js';
import { makeSky, makeLightRig } from '../kit/sky.js';
import * as T from '../kit/terrain.js';
import * as flora from '../kit/flora.js';
import * as F from '../kit/fauna.js';
import * as fx from '../kit/fx.js';
import * as Water from '../kit/water.js';
import { layoutSteps, makeEstateUniforms, makeBankMaterials, buildBank, driveUniforms, lifeCourses, stoneRows, ESTATE_GLSL, DRIVE_GLSL, BANK_GLSL, PLACE, BEHIND, VERGE, TAU, lin, vaultTrunks, gapField } from '../parts/red-drive-down-to-the-sea.js';

// THE WOOD'S FLOOR UNDER THE VAULT, by place (the ground's law paints by these numbers and the wood plants by them):
// stretchAt: the floor is of three kinds along the drive, a wave 121 m long down the wood from the entry and bent a
// little across it: over 0.25 to 0.55 a FERNY BANK, under -0.25 to -0.55 FLOWERS under the gaps, and between them bare
// mast and moss; aboutGap: 1 in a pool of light (the vault's standing gaps, gapField of the parts), thinning to nothing
// some metres round it (the field from 0.55 to 0.85: a quarter of the floor in the mean, 0.235 counted).
// heads: the share of a flowers' drift that is flower head, the rest its green: three cells in four carry a head, and
// a head is 0.4147 of its cell (1 - smoothstep(.28, .46, the way from the cell's middle), counted over the cells' own
// pattern at four million places): 0.311.
const FLOOR = { wave: 0.052, bend: 0.5, bendWave: 0.05, about: [0.55, 0.85], heads: 0.311 };
const stretchAt = (x, z) => Math.sin((x - PLACE.entry[0]) * FLOOR.wave + FLOOR.bend * Math.sin(z * FLOOR.bendWave));
const aboutGap = (x, y, z, sun) => { const k = y / Math.max(sun.y, 0.25); return smoothstep(FLOOR.about[0], FLOOR.about[1], gapField(x - sun.x * k, z - sun.z * k)); };

// the three standing hours: where the sun stands, what it and the sky give, how thick the haze is
const HOURS = {
  morning: { preset: 'day', elevation: 42, azimuth: 135, sun: '#fff1d8', sunI: 3.4, sky: '#a9c8ea', gnd: '#5a6a3c', fillI: 2.2, fog: '#b9cfe0', fogD: 0.0011, exposure: 1.1, leafFill: '#a4bf8a',
    skyOpts: { zenith: '#1c58b8', horizon: '#a8cdea' } },
  gold: { preset: 'goldenHour', elevation: 18, azimuth: 212, sun: '#ffc98a', sunI: 4.0, sky: '#a9b6e0', gnd: '#6a5a3c', fillI: 2.6, fog: '#e2c9a4', fogD: 0.0012, exposure: 1.2, leafFill: '#bcb884',
    skyOpts: { sunIntensity: 9, sunGlow: 0.55, scatter: 0.5 } },
  haze: { preset: 'day', elevation: 30, azimuth: 135, sun: '#fff6ea', sunI: 2.5, sky: '#d0dce2', gnd: '#6a7250', fillI: 2.6, fog: '#dfe6e6', fogD: 0.0022, exposure: 1.1, leafFill: '#aec49a',
    skyOpts: { zenith: '#8fb0cc', mid: '#c2d4de', horizon: '#e4eaea', ground: '#c9d2d2', sunIntensity: 7, sunGlow: 1.0, sunGlowTight: 0.2, scatter: 0.5, scatterColor: '#fff6e6',
      clouds: { coverage: 0.3, softness: 0.6, opacity: 0.5 }, clouds2: { opacity: 0.5 } } },
};

export default {
  id: 'red-drive-down-to-the-sea',
  name: 'The Red Drive Down to the Sea',
  category: 'books',
  placeKind: 'domestic',
  book: 'Rebecca',
  author: 'Daphne du Maurier, 1907 to 1989',
  media: ['air'],
  weirdness: 0.25,
  async build(ctx) {
    const scene = new THREE.Scene(), core = ctx.core, vary = ctx.vary || {}, detail = clamp((ctx.quality && ctx.quality.detail) || 1, 0.4, 1);
    // ------------------------------------------------------------ every seeded stream of the world, taken once, here
    const fork = (name) => core.makeRng(core.hashSeed(name + ':' + ctx.seed));
    const R = {};
    for (const name of ['hour', 'sky', 'bank-left', 'bank-right', 'outliers', 'glades', 'vault-places', 'vault-forms', 'vault-depth', 'fronds', 'crowns', 'forest', 'ferns', 'house', 'cedar-places', 'cedar-shapes', 'roses', 'azaleas', 'birches', 'stream',
      'falling', 'pigeons', 'rooks', 'swallows', 'gulls', 'bees', 'butterflies', 'wagtails', 'petals', 'leaves', 'smoke', 'shafts', 'far',
      'border', 'casements', 'cloud-shade', 'azaleas-head', 'birches-head', 'thin-left', 'thin-right', 'thin-outliers', 'thin-azaleas', 'thin-head', 'rock-shapes', 'row-stones', 'bank-stones', 'stream-ferns', 'flank-rocks', 'crags', 'ring-rocks', 'sea', 'gulls-left', 'gulls-right', 'fallen-heads', 'birches-again', 'pools', 'shingle-stones', 'flower-border', 'floor-ferns']) R[name] = fork(name);

    // ------------------------------------------------------------ what this visit is like (standing states)
    const hourName = vary.hour === 'day' ? 'morning' : vary.hour === 'golden' || vary.hour === 'night' ? 'gold' : vary.hour === 'dawn' ? 'haze'
      : (() => { const r = R.hour(); return r < 0.45 ? 'morning' : r < 0.75 ? 'gold' : 'haze'; })();
    const HR = HOURS[hourName], lowGold = vary.hour === 'night';
    // (ctx.quality.detail, under 1 on phones: the small falling things, the lying heads and the insects are thinned by it)
    const heavy = !!vary.rare, density = clamp(vary.density ?? 1, 0.7, 1.3), mood = vary.mood ?? 0.5;
    const windK = lerp(0.6, 1.4, mood), cloudK = lerp(0.25, 0.75, mood), swellK = lerp(0.6, 1.2, mood);
    const lead = ['white', 'gold', 'salmon'][Math.floor(mood * 2.999)];
    await ctx.yield();
    // (the plan is made in steps, the page handed back between them)
    const plan = layoutSteps(ctx.seed); let step = plan.next();
    while (!step.done) { await ctx.yield(); step = plan.next(); }
    const Lo = step.value, path = Lo.path, M = Lo.places, PL = path.length;
    await ctx.yield();

    // ------------------------------------------------------------ sky, light, haze
    const elevation = lowGold ? 10 : HR.elevation;
    const sky = makeSky({ rng: R.sky, preset: HR.preset, sunElevation: elevation, sunAzimuth: HR.azimuth, lightColor: lowGold ? '#ffb884' : HR.sun, lightIntensity: HR.sunI,
      ambientColor: HR.sky, groundLight: HR.gnd, ambientIntensity: HR.fillI, lightElevationMin: 8,
      clouds: { coverage: lerp(0.28, 0.5, cloudK), softness: 0.3 }, ...HR.skyOpts });
    scene.add(sky.object);
    const rig = makeLightRig(sky, { intensity: 1, ambient: 1, bounce: 0.2 });
    scene.add(rig.object);
    const fogCol = new THREE.Color(HR.fog);
    scene.fog = new THREE.FogExp2(fogCol, HR.fogD);
    const sunDir = sky.lightDirection.clone().normalize(), sunCol = new THREE.Color(lowGold ? '#ffb884' : HR.sun).multiplyScalar(HR.sunI);
    const skyCol = new THREE.Color(HR.sky).multiplyScalar(HR.fillI), gndCol = new THREE.Color(HR.gnd).multiplyScalar(HR.fillI), leafFill = new THREE.Color(HR.leafFill).multiplyScalar(HR.fillI * 1.9);
    const wdir = [0.924, -0.383];
    const BOX = [-560, -260, 600, 320];
    const U = makeEstateUniforms({ sunDir: [sunDir.x, sunDir.y, sunDir.z], sunColor: [sunCol.r, sunCol.g, sunCol.b], skyColor: [skyCol.r, skyCol.g, skyCol.b], groundColor: [gndCol.r, gndCol.g, gndCol.b],
      fogColor: [fogCol.r, fogCol.g, fogCol.b], fogDensity: HR.fogD, leafFill: [leafFill.r, leafFill.g, leafFill.b], cloud: [hourName === 'haze' ? 0.3 : lerp(0.5, 0.72, cloudK), 90, 1],
      wind: [wdir[0], wdir[1], windK, 1], placeBox: [BOX[0], BOX[1], 1 / (BOX[2] - BOX[0]), 1 / (BOX[3] - BOX[1])], place: null, canopy: [43, 50],
      cloudOffset: [R['cloud-shade'].range(0, 2000), R['cloud-shade'].range(0, 2000)] });
    await ctx.yield();
    return buildEstate({ ctx, scene, R, fork, Lo, path, M, PL, HR, heavy, density, detail, windK, swellK, lead, sky, rig, sunDir, U, BOX });
  },
};

// ---------------------------------------------------------------- the place map: what stands over each spot of the estate
// One small texture every estate shader reads. R: leaves overhead (0..1). G: the height above which the sun is seen
// (the shade of banks, house, cedars and the valley's sides). B: how red the place is (the cut, an outlying red bush).
// A: pale flowers about (the valley's sides). All of it is written from where things stand.
function makePlaceMap(BOX, W, H) {
  const n = W * H, cover = new Float32Array(n), occ = new Float32Array(n).fill(-50), red = new Float32Array(n), pale = new Float32Array(n), live = new Uint8Array(n);
  const cw = (BOX[2] - BOX[0]) / W, ch = (BOX[3] - BOX[1]) / H;
  const ci = (x) => Math.floor((x - BOX[0]) / cw), cj = (z) => Math.floor((z - BOX[1]) / ch);
  const each = (x, z, r, fn) => {
    for (let j = Math.max(0, cj(z - r)); j <= Math.min(H - 1, cj(z + r)); j++) for (let i = Math.max(0, ci(x - r)); i <= Math.min(W - 1, ci(x + r)); i++) {
      fn(j * W + i, Math.hypot(BOX[0] + (i + 0.5) * cw - x, BOX[1] + (j + 0.5) * ch - z));
    }
  };
  return {
    W, H, cw, ch, cover, occ, red, pale, live,
    centre: (k) => [BOX[0] + ((k % W) + 0.5) * cw, BOX[1] + (Math.floor(k / W) + 0.5) * ch],
    // an occluder's top: a point (the cell it falls in and, with r, the cells round it)
    raise(x, z, y, r = 0) { if (r > 0) each(x, z, r, (k, d) => { if (d <= r && y > occ[k]) occ[k] = y; }); else { const i = ci(x), j = cj(z); if (i >= 0 && j >= 0 && i < W && j < H && y > occ[j * W + i]) occ[j * W + i] = y; } },
    // a rounded top (a crown): y falls from yTop at the middle to yRim at radius r
    dome(x, z, r, yTop, yRim) { each(x, z, r, (k, d) => { if (d <= r) { const y = yRim + (yTop - yRim) * Math.sqrt(1 - (d / r) ** 2); if (y > occ[k]) occ[k] = y; } }); },
    // soft discs into a field: 'max' raises to v, 'cut' lowers toward v
    disc(A, x, z, r0, r1, v, cut) { each(x, z, r1, (k, d) => { const w = 1 - smoothstep(r0, r1, d); if (cut) A[k] = Math.min(A[k], lerp(1, v, w)); else A[k] = Math.max(A[k], v * w); }); },
    // the sun's ceiling over every live cell: the highest line of sight to the sun that something up-sun blocks
    // (cells k0 to k1 of `cells`: the build asks for it a part at a time)
    cells: n,
    bake(sunDir, texture, k0, k1) {
      const hl = Math.hypot(sunDir.x, sunDir.z) || 1e-6, dx = sunDir.x / hl, dz = sunDir.z / hl, tanE = sunDir.y / hl, step = cw;
      const steps = Math.min(30, Math.ceil(27 / Math.max(tanE, 0.05) / step)), data = texture.image.data;
      for (let k = k0; k < Math.min(k1, n); k++) {
        let top = -10;
        if (live[k]) {
          const i0 = k % W, j0 = Math.floor(k / W);
          for (let s = 2; s <= steps; s++) {
            const i = Math.round(i0 + dx * s), j = Math.round(j0 + dz * s);
            if (i < 0 || j < 0 || i >= W || j >= H) break;
            const y = occ[j * W + i] - s * step * tanE; if (y > top) top = y;
          }
        }
        data[k * 4] = Math.round(clamp(cover[k], 0, 1) * 255); data[k * 4 + 1] = Math.round(clamp((top + 10) / 80, 0, 1) * 255);
        data[k * 4 + 2] = Math.round(clamp(red[k], 0, 1) * 255); data[k * 4 + 3] = Math.round(clamp(pale[k], 0, 1) * 255);
      }
      texture.needsUpdate = true;
    },
  };
}

// ---------------------------------------------------------------- the ground: one shader, the kinds of ground chosen by place
// vertex colour = how much lawn (r), valley floor (g), shingle (b); the rest is the wood's floor. aPlace = metres to the
// middle of the gravel, the gravel's half width, metres left of the stream's middle, metres down the valley's axis.
function makeGroundMaterial(U, o) {
  const v3 = (hex, k = 1) => ({ value: new THREE.Vector3(...lin(hex)).multiplyScalar(k) });
  const uniforms = {
    ...U, ...driveUniforms(), uLitterA: v3('#46382a'), uLitterB: v3('#7c6040'), uMoss: v3('#3c6628'), uLawnA: v3('#48773a'), uLawnB: v3('#6f9a44'),
    uEarth: v3('#6a5c46'), uShingle: v3('#e6e2d6', 0.84), uRock: v3('#8e867a'), uPetalCol: v3('#f3ead6', 0.9), uStripe: { value: new THREE.Vector3(o.stripe[0], o.stripe[1], Math.PI / 2) },
    uPetal: { value: o.petals }, uRedAll: { value: o.heavy ? 1 : 0 }, uPools: { value: o.pools.map((q) => new THREE.Vector4(q.x, q.z, q.r, q.turn)) },
    tShade: { value: o.shade.tex }, uShadeBox: { value: new THREE.Vector4(...o.shade.box) },
  };
  const mat = new THREE.ShaderMaterial({
    uniforms, fog: false, vertexColors: true, defines: { RING_R: PLACE.ringRadius.toFixed(1) },
    vertexShader: /* glsl */`
      attribute vec4 aPlace; attribute vec2 aShade, aHeath, aSide;
      varying vec3 vW, vN, vZone; varying vec4 vPl; varying float vAo; varying vec2 vHeath, vSide;
      void main(){
        vec4 wp = modelMatrix * vec4(position, 1.);
        vW = wp.xyz; vN = normal; vZone = color; vPl = aPlace; vAo = aShade.y; vHeath = aHeath; vSide = aSide;
        gl_Position = projectionMatrix * viewMatrix * wp;
      }`,
    fragmentShader: ESTATE_GLSL + BANK_GLSL + DRIVE_GLSL + /* glsl */`
      uniform vec3 uLitterA, uLitterB, uMoss, uLawnA, uLawnB, uEarth, uShingle, uRock, uPetalCol, uStripe; uniform float uPetal, uRedAll;
      uniform vec4 uPools[2], uShadeBox; uniform sampler2D tShade;
      varying vec3 vW, vN, vZone; varying vec4 vPl; varying float vAo; varying vec2 vHeath, vSide;
      void main(){
        vec2 p = vW.xz; vec4 pl = esPlace(vW); vec3 n = normalize(vN);
        // (the vault's measure: 1 under the drive's great beeches, 0 everywhere else; see the light's law)
        float vlt = esVault(pl);
        float lawn = vZone.r, val = vZone.g, shin = vZone.b, wood = clamp(1. - lawn - val - shin, 0., 1.);
        float near = 1. - smoothstep(30., 90., length(vW - cameraPosition));
        float fine = esN(p * 6.) * .6 + esN(p * 21.) * .4, mossy = esF(p * .23);
        // the wood's floor: last year's copper leaves, moss in patches
        vec4 lf = esCell(p / .19);
        vec3 floorC = mix(uLitterA, uLitterB, mix(.5, lf.z * smoothstep(.0, .1, lf.w), near)) * (.8 + .4 * fine);
        // moss in cushions, stippled; close to, its edge is ragged (it stops at a leaf's edge), never a soft smear
        floorC = mix(floorC, uMoss * (.55 + .5 * esN(p * 27.)) * (.8 + .4 * fine), mix(smoothstep(.5, .68, mossy + (fine - .5) * .2), step(.6, mossy + (lf.z - .5) * .22), near));
        // under the vault last year's leaves lie in copper drifts some metres across, leaf by leaf close to. Far off
        // the drifts keep the weight they have close to: the mean of the near weight over the leaves' own pattern,
        // 0.783 (.25 + .6 times the mean of the seam term, 0.888, counted over six million places of the cells by a
        // mirror of esCell in node): the grain goes with the distance, the tone does not
        floorC = mix(floorC, vec3(.3, .14, .055) * (.78 + .4 * lf.z) * (.85 + .3 * fine), vlt * smoothstep(.42, .62, esF(p * .13 + 9.)) * mix(.783, .25 + .6 * smoothstep(0., .1, lf.w), near));
        // WHERE THE LIGHT LANDS, under the vault (every term carries the vault's measure: elsewhere the floor is what
        // it was). about: 1 in a pool of light, thinning to nothing round it (the roof's standing gaps at the foot of
        // the sun's ray: the dapple's own field, so the pool, the shaft over it and what grows in it are one law);
        // stretch: the three kinds of floor along the drive (see FLOOR); the flowers and the ferny moss keep off the drive and its verge (clearD), the mast lies on to the verge as the leaves do
        if (vlt > 0.) {
          float gapF = esGap(p - uSunDir.xz * (vW.y / max(uSunDir.y, .25))), about = smoothstep(${FLOOR.about[0]}, ${FLOOR.about[1]}, gapF) * vlt;
          float stretch = sin((p.x - ${PLACE.entry[0].toFixed(1)}) * ${FLOOR.wave} + ${FLOOR.bend} * sin(p.y * ${FLOOR.bendWave})), ferny = smoothstep(.25, .55, stretch), flowery = smoothstep(.25, .55, -stretch);
          float clearD = smoothstep(vPl.y + 2.6, vPl.y + 3.8, mix(vPl.x, abs(vSide.x), step(.999, vSide.y)));
          // low woodland flowers in drifts in and about the pools (in the flowers' stretch the drifts run on further
          // round each pool; few on the ferny bank): white, yellow or blue-violet, each drift of one kind over its
          // own green; a head to a cell close to (three cells in four), the drift's mean colour far off (the heads'
          // counted share, so the tone holds)
          float wide = smoothstep(.38, .7, gapF) * vlt * flowery;
          float dens = max(about * (.3 + .7 * flowery) * (1. - .8 * ferny), wide) * (.35 + .65 * smoothstep(.25, .55, esF(p * .31 + 61.))) * clearD, sort = esN(p * .09 + 23.);
          vec3 headC = mix(mix(vec3(.9, .9, .8), vec3(.92, .66, .1), smoothstep(.38, .46, sort)), vec3(.2, .13, .85), smoothstep(.6, .68, sort));
          vec4 fc = esCell(p / .17 + 41.);
          floorC = mix(floorC, mix(vec3(.09, .22, .06) * (.8 + .4 * fine), headC, mix(${FLOOR.heads}, step(.25, fc.z) * (1. - smoothstep(.28, .46, length(fc.xy))), near)), dens);
          // the ferny bank: the litter lies green with moss between the clumps
          floorC = mix(floorC, uMoss * (.6 + .5 * esN(p * 27.)) * (.8 + .4 * fine), ferny * vlt * clearD * .45 * smoothstep(.3, .6, esF(p * .4 + 17.)));
          // the bare stretches: beech mast among the leaves, one leaf's place in eight a dark husk (far off, their
          // mean: .12 of the places times the seam term's mean, 0.888)
          floorC = mix(floorC, vec3(.07, .045, .03), (1. - ferny) * (1. - flowery) * vlt * .8 * mix(.12 * .888, step(.88, fract(lf.z * 9.)) * smoothstep(0., .1, lf.w), near));
        }
        // the lawn: fine sward, paler and darker in soft drifts, a faint change of tone every 2 m where the mower went,
        // moss in the damp places, daisies in drifts (each a white head with a yellow eye; far off, their drift's pale haze)
        float stripe = sin(dot(p, uStripe.xy) * uStripe.z);
        vec3 lawnC = mix(uLawnA, uLawnB, .5 + .05 * stripe + .7 * (esF(p * .05 + 7.) - .5)) * (.88 + .24 * fine) * (.93 + .14 * esN(p * .3 + 5.));
        lawnC = mix(lawnC, uMoss * 1.25 * (.8 + .4 * fine), smoothstep(.56, .74, esF(p * .13 + 31.)) * .5);
        // the sward is no one green: clover in darker rounds one to three metres across, paler sun-dried patches between
        float clover = smoothstep(.58, .7, esN(p * .47 + 17.) * .7 + esN(p * 1.3 + 2.) * .3);
        lawnC = mix(lawnC, lawnC * vec3(.62, .8, .66), clover * .75);
        lawnC *= mix(1.1, .9, smoothstep(.35, .65, esF(p * .21 + 3.7)));
        float drift = smoothstep(.4, .62, esF(p * .1 + 13.));
        vec4 dz = esCell(p / .22);
        float dr = length(dz.xy), isDaisy = step(1. - .3 * drift, dz.z), nearD = 1. - smoothstep(14., 46., length(vW - cameraPosition));
        vec3 daisyC = mix(vec3(.96, .8, .2), vec3(.95, .95, .9), smoothstep(.07, .12, dr));
        lawnC = mix(lawnC, mix(vec3(.9, .9, .82), daisyC, nearD), mix(.035 * drift, isDaisy * (1. - smoothstep(.2, .27, dr)), nearD));
        // the flower borders' beds (the garden's map, b): dark dug earth, a crisp edge to the turf
        vec3 gard = texture2D(tShade, (p - uShadeBox.xy) * uShadeBox.zw).rgb;
        lawnC = mix(lawnC, uEarth * (.42 + .3 * fine), smoothstep(.4, .55, gard.b + (fine - .5) * .1));
        // the valley's floor: earth and grass, a trodden path beside the stream, pale petals lying
        vec3 valC = mix(uEarth * (.8 + .4 * fine), esGrass(p) * .85, smoothstep(.16, .42, esF(p * .4 + 3.)));
        float onPath = (1. - smoothstep(.3, .7, abs(vPl.z + 3.4) + (esN(p * 1.7) - .5) * .5)) * smoothstep(14., 24., vPl.w);
        valC = mix(valC, uEarth * 1.5 * (.85 + .3 * fine), onPath * .8);
        // THE BROOK'S BANKS (bz: metres from the brook's middle, the line a little ragged; the water's edge lies 1.2 m
        // out, see makeBrook): the turf comes down green and lush to a lip over the water, dark earth in the lip's
        // shadow, and below it stones and gravel, each stone round (lit on its crown, dark in the chink about it), the
        // darker the nearer the water wets them. No band of bare rock: the bed is under the water
        float bz = abs(vPl.z) + (esN(p * 1.1 + 3.) - .5) * .3, brookIn = smoothstep(10., 16., vPl.w);
        vec4 bst = esCell(p / .21);
        vec3 stoneC = mix(mix(vec3(.14, .13, .115), vec3(.36, .33, .27), bst.z), vec3(.06, .06, .065), step(.86, bst.z)) * mix(.4, 1.05, smoothstep(0., .16, bst.w)) * (.8 + .4 * fine);
        valC = mix(valC, esGrass(p) * vec3(.74, .92, .62), (1. - smoothstep(1.8, 2.3, bz)) * brookIn * .75);
        valC = mix(valC, uEarth * .3 * (.7 + .6 * fine), (1. - smoothstep(1.56, 1.62, bz + (fine - .5) * .12)) * brookIn);
        valC = mix(valC, stoneC * mix(.6, 1., smoothstep(1.15, 1.42, bz)), (1. - smoothstep(1.42, 1.5, bz + (fine - .5) * .12)) * brookIn);
        valC = mix(valC, uPetalCol, esFallenAt(p + 31., clamp(pl.a * uPetal, 0., 1.)) * near + pl.a * uPetal * .22 * (1. - near));
        // THE SHINGLE, in world metres: pebbles (0.16 m) and cobbles (to half a metre) of unlike greys, buffs and whites,
        // each round (lit on its crown, dark in the chink about it), sorted by the sea into long ridges, coarser on the crests
        vec3 shC = vec3(0.); vec4 pc = vec4(0.); float wet = 0., foamOn = 0., poolIn = 0., strewn = 0.;
        if (shin > 0.) {
          pc = esCell(p / .16); vec4 pc2 = esCell(p / .62 + 3.);
          // (yb: the height over the tide, a little uneven along the shore, so that every line the sea leaves wanders)
          float yb = vW.y + (esN(p * .21) - .5) * .16 + (esN(p * .9 + 5.) - .5) * .05;
          // THE SEA SORTS ITS SHORE: cobbles thrown high (the storm beach, bleached and dry), pebbles below them, and
          // below the wrack firm damp sand, ribbed by the last tide, with runnels draining down it to the water
          float high = smoothstep(1.2, 2.8, yb), sand = 1. - smoothstep(.8, 1.08, yb + (esN(p * .37) - .5) * .22);
          float berm = esN(vec2(vPl.w * .33, dot(p, vec2(.03, .05)))), bermFine = esN(vec2(vPl.w * 1.3, dot(p, vec2(.09, .16))));
          float close = 1. - smoothstep(34., 100., length(vW - cameraPosition));
          vec3 tintP = mix(vec3(.62, .64, .68), vec3(1.02, .96, .84), pc.z);
          tintP = mix(tintP, vec3(.34, .36, .4), step(.86, pc.z));
          vec3 pebble = tintP * mix(.42, 1.06, smoothstep(.0, .16, pc.w)) * (.86 + .28 * esN(p * 2.3));
          float cr = length(pc2.xy) / mix(.22, .42, fract(pc2.z * 13.7)), isCob = step(.92 - .4 * berm - .4 * high, fract(pc2.z * 5.3));
          vec3 tintC = mix(vec3(.66, .67, .7), vec3(1.06, 1., .88), pc2.z);
          vec3 cobble = mix(tintC, vec3(.4, .4, .43), step(.84, pc2.z)) * mix(1.14, .62, smoothstep(.2, 1., cr));
          pebble = mix(pebble * mix(1., .5, isCob * (1. - smoothstep(1., 1.3, cr))), cobble, isCob * (1. - smoothstep(.9, 1., cr)));
          shC = uShingle * mix(vec3(.8, .8, .79) * (.9 + .2 * pc2.z), pebble, close) * (.6 + .5 * berm + .16 * bermFine) * mix(vec3(.9, .95, 1.04), vec3(1.06, 1., .9), berm);
          // THE SUN DRIES THE SHORE (dry: 0 while the sun stands lower than 21 degrees, 1 from 38 degrees up; the
          // sun's own height, the same on every seed): under a low sun the shore lies damp as the tide left it; under
          // a high one the shingle dries as pale as the storm beach above it, and the pebbles stand out of the sand
          float dry = smoothstep(.36, .62, uSunDir.y);
          // (damp, the middle beach is darker and warmer than the bleached top; the sand a wet ochre, ribbed a hand apart)
          shC *= mix(vec3(.74, .7, .63), vec3(1.), max(high, dry));
          vec3 sandC = vec3(.46, .38, .27) * (.86 + .22 * esN(p * 1.1)) * (.93 + .14 * fine) * (.9 + .16 * sin(yb * 60. + esN(p * .6) * 7.));
          // PEBBLES STAND OUT OF THE DRIED SAND: of the shingle's own pebbles six in ten just under the pebble bank,
          // one in three by the water (the pebble's own number says which), and none while the shore lies damp; the
          // sand lies between them. Far off, where the pebbles are no longer drawn one by one, the sand gives way by
          // their mean share (0.866 of such a pebble's cell is pebble, counted over the cells' own pattern at four
          // million places), so the tone holds as the grain goes
          float strewShare = mix(.34, .6, smoothstep(.2, 1., yb)) * dry;
          strewn = sand * mix(strewShare * .866, step(1. - strewShare, fract(pc.z * 7.)) * smoothstep(.02, .1, pc.w), close);
          shC = mix(shC, sandC, (sand - strewn) * .9);
          // the wrack at the last high water: dark weed in ragged heaps along one line, white shells among it; an older,
          // thinner line lies higher up the beach
          float heap = smoothstep(.3, .46, esF(p * 1.3 + 9.));
          float wrack = (1. - smoothstep(.05, .2, abs(yb - 1.1))) * heap + (1. - smoothstep(.0, .07, abs(yb - 1.52))) * heap * .6;
          wrack *= smoothstep(2.5, 6., abs(vPl.z));
          shC = mix(shC, mix(mix(vec3(.05, .05, .03), vec3(.14, .08, .04), esN(p * 3.1)), vec3(.09, .12, .04), step(.62, esN(p * 5.3 + 3.))) * (.6 + .8 * fine), wrack * .94);
          vec4 sc = esCell(p / .13 + 17.);
          float shell = step(.9, sc.z) * (1. - smoothstep(.22, .34, length(sc.xy))) * (1. - smoothstep(.08, .24, abs(yb - 1.1))) * smoothstep(2.5, 6., abs(vPl.z)) * close;
          shC = mix(shC, vec3(1.25, 1.2, 1.08), shell);
          // the rock pools at the headlands' feet (uPools: middle x, z; half length; turn): still water in a hollow of
          // the shingle, a dark weedy rim about it
          float poolRim = 0.;
          for (int k = 0; k < 2; k++) {
            vec2 q = p - uPools[k].xy; float cs = cos(uPools[k].w), sn = sin(uPools[k].w);
            float d = length(vec2(q.x * cs + q.y * sn, (q.y * cs - q.x * sn) * 1.7)) / uPools[k].z + (esN(p * .8 + 3.) - .5) * .35;
            poolIn = max(poolIn, 1. - smoothstep(.86, .94, d)); poolRim = max(poolRim, (1. - smoothstep(1., 1.35, d)) * smoothstep(.8, .92, d));
          }
          shC = mix(shC, vec3(.12, .13, .07) * (.7 + .6 * fine), poolRim * .8);
          shC = mix(shC, shC * vec3(.3, .42, .36), poolIn);
          // the band the sea wets: dark and smooth below a scalloped edge where the last waves reached; and three thin
          // lines of surf running up it and sliding back, each on its own time, laced, leaving a film of foam behind
          // (the damp sand above the wet band shines a little; a runnel's thread of water shines as the wet band does)
          float runnel = (1. - smoothstep(.0, .07, abs(esN(vec2(vPl.z * .33 + esN(p * .23) * 1.6, yb * 1.1)) - .5))) * sand * smoothstep(2.5, 5., abs(vPl.z));
          wet = max(max(1. - smoothstep(.62, .78, yb), sand * .3), runnel * .85);
          shC *= mix(vec3(1.), vec3(.4, .47, .52), wet);
          for (int k = 0; k < 3; k++) {
            float fk = float(k), ph = uTime * (.5 + .07 * fk) + fk * 2.1 + 5. * esN(vec2(vPl.z * .045, fk * 7.));
            float reach = .1 + .1 * fk + .22 * (.5 + .5 * sin(ph)), up = .5 + .5 * cos(ph);
            float lace = smoothstep(.25, .6, esN(p * 2.7 + vec2(fk * 9., uTime * .2)));
            float line = (1. - smoothstep(.0, .03, abs(yb - reach))) * mix(.45, 1., up) * mix(.5, 1., lace);
            float film = (1. - smoothstep(.0, .16, reach - yb)) * step(yb, reach) * lace * .4 * up;
            foamOn = max(foamOn, max(line, film));
          }
          shC = mix(shC, vec3(1.5, 1.52, 1.55), foamOn);
        }
        // the headlands and the land by the sea: wind-cut turf, rock where it steepens
        float coast = smoothstep(214., 240., vPl.w);
        float strata = esN(vec2(vW.y * 2.4 + esN(p * .12) * 4., dot(p, vec2(.06, .04))));
        vec4 rc = esCell(vec2(p.x + p.y * .6, vW.y * 1.6) / 1.7);
        vec3 rockC = uRock * (.55 + .5 * strata + .3 * esF(vec2(p.x * .3 + p.y * .2, vW.y * 1.4))) * (.8 + .4 * fine) * mix(.5, 1., smoothstep(0., .12, rc.w));
        // the beds of the rock: a dark parting every metre or so up the face, dipping a little along it, warm and cool beds
        float bedY = vW.y * .9 + dot(p, vec2(.035, .02)) + esN(p * .08) * 1.5;
        rockC *= mix(.4, 1., smoothstep(0., .1, abs(fract(bedY) - .5)));
        rockC *= mix(vec3(1.12, 1.02, .88), vec3(.86, .92, 1.0), esH(vec2(floor(bedY + .5), 3.)));
        // rain-dark seams down the faces, pale lichen toward the tops
        rockC *= mix(.5, 1.08, smoothstep(.3, .62, esF(vec2(dot(p, vec2(.33, .26)), vW.y * .22))));
        rockC = mix(rockC, uRock * vec3(1.25, 1.2, .98), smoothstep(.55, .75, esF(p * .5 + 17.)) * smoothstep(6., 14., vW.y) * .6);
        // thrift in flower on the turf of the headlands
        vec4 tf = esCell(p / .55 + 11.);
        vec3 turfC = mix(esGrass(p) * vec3(1.05, 1., .8), vec3(.84, .5, .64), (1. - smoothstep(.1, .22, length(tf.xy))) * step(.7, tf.z) * smoothstep(.42, .56, esN(p * .1 + 3.)) * near);
        vec3 turf = mix(turfC, rockC, 1. - smoothstep(.9, .975, n.y + (mossy - .5) * .08));
        floorC = mix(floorC, turf, coast);
        // the fall to the sea: rough turf, bents bleached by the wind, dark heather in patches, thrift in flower near the brow
        float hp = esF(p * .09 + 21.), hq = esF(p * .37 + 4.);
        vec3 heathC = mix(esGrass(p) * vec3(1.02, 1., .78), vec3(.36, .34, .17) * (.8 + .4 * fine), smoothstep(.38, .62, hq));
        heathC = mix(heathC, vec3(.17, .12, .13) * (.7 + .6 * fine), smoothstep(.52, .66, hp) * .85);
        vec4 th = esCell(p / .6);
        heathC = mix(heathC, vec3(.8, .46, .6), (1. - smoothstep(.1, .22, length(th.xy))) * step(.72, th.z) * smoothstep(.4, .55, esN(p * .12 + 8.)) * near);
        heathC = mix(heathC, rockC, 1. - smoothstep(.82, .93, n.y + (mossy - .5) * .08));
        floorC = mix(floorC, heathC, vHeath.x);
        // bluebells in and about the wood's great glade: a blue-violet haze over their green, flower by flower close to
        float blue = vHeath.y * smoothstep(.2, .45, esF(p * .21 + 40.) + vHeath.y * .4);
        vec4 bc = esCell(p / .15);
        vec3 bellC = mix(vec3(.1, .26, .07), vec3(.17, .1, .95), mix(.7, step(.3, bc.z) * (1. - smoothstep(.2, .36, length(bc.xy))), near * .8));
        floorC = mix(floorC, bellC * (.8 + .4 * fine), blue);
        vec3 a = floorC * wood + lawnC * lawn + valC * val + shC * shin;
        // thrift along the turf's edge above the shingle: grey-green cushions, each set with pink heads
        float edgeT = smoothstep(.04, .22, shin) * (1. - smoothstep(.45, .8, shin));
        if (edgeT > 0.) {
          vec4 tc = esCell(p / .8 + 23.), th2 = esCell(p / .13);
          float cu = length(tc.xy) / mix(.3, .46, fract(tc.z * 9.1));
          vec3 cushion = mix(vec3(.1, .17, .08), vec3(.2, .3, .14), 1. - cu) * (.8 + .4 * fine);
          cushion = mix(cushion, vec3(.95, .34, .56), mix(.3, step(.5, th2.z) * (1. - smoothstep(.22, .36, length(th2.xy))), near) * (1. - smoothstep(.6, .9, cu)));
          a = mix(a, cushion, edgeT * step(.5, tc.z) * (1. - smoothstep(.85, 1., cu)));
        }
        // the drive, its grass verges, and the spent red flowers lying thick at the banks' feet
        // (aPlace carries the metres to the gravel's middle WITHOUT their side: between two corners of a 2 m cell on
        // either side of the middle that number never reaches 0, which broke the wood's narrow drive into pale blobs and
        // stretched streaks. Along the wood's drive aSide carries the metres to the LEFT of the middle, with their sign,
        // and the side is dropped here, pixel by pixel; its second number is 1 only at corners of the wood's drive, so
        // the cut, the lawn and every other drive take the number they took before)
        float d = mix(vPl.x, abs(vSide.x), step(.999, vSide.y)), hw = vPl.y, cut = pl.b;
        float verge = 1. - smoothstep(hw + mix(1.3, 9.5, cut), hw + mix(2.6, 11., cut), d + (esN(p * .9) - .5) * 1.2);
        // under the trees the verge is moss and litter, and the drive is darker worn gravel: leaves lying on it, two wheel
        // lines worn paler, moss creeping in from its edges
        float inWood = wood * smoothstep(.3, .7, pl.r);
        float vergeW = mix(verge, step(.5, verge + (lf.z - .5) * .5), near * inWood);
        a = mix(a, mix(esGrass(p), mix(floorC, uMoss * (.5 + .5 * esN(p * 27.)), .5), inWood), vergeW * (1. - lawn) * (1. - shin));
        float edge = hw + (esN(p * 1.3) - .5) * .5;
        vec3 grav = esGravel(p), gw = grav * vec3(.36, .33, .27);
        gw = mix(gw, grav * .82, (1. - smoothstep(.1, .34, abs(d - .8))) * .55);
        gw = mix(gw, uLitterB * (.7 + .5 * lf.z), mix(.14, step(.74, lf.z) * smoothstep(0., .1, lf.w) * .6, near));
        gw = mix(gw, uMoss * (.7 + .5 * fine), smoothstep(hw - .8, hw - .1, d + (mossy - .5) * .8) * .8);
        // under the vault the drive is two wheel ruts worn pale with a green crown between them, tuft by tuft
        gw = mix(gw, grav * .95, vlt * (1. - smoothstep(.1, .3, abs(d - .8))) * .4);
        gw = mix(gw, mix(uMoss, esGrass(p), .45) * (.7 + .6 * fine), vlt * (1. - smoothstep(.2, .46, d + (esN(p * 2.3) - .5) * .3)) * smoothstep(.3, .55, esN(p * 5.) * .6 + fine * .4));
        a = mix(a, mix(grav, gw, inWood), (1. - smoothstep(edge - .12, edge + .16, d)) * (1. - shin));
        float redHere = cut * mix(mix(.1, .78, smoothstep(1.5, 10., d)), 1., uRedAll);
        a = mix(a, uFallen * (.75 + .5 * esH(floor(p / .17))), mix(redHere * .45, esFallenAt(p, redHere), near));
        // rock where the land is steep
        float rock = 1. - smoothstep(.7, .84, n.y);
        a = mix(a, mix(uRock * (.7 + .6 * esF(vec2(p.x * .3 + p.y * .2, vW.y * 1.4))), rockC, coast), rock);
        vec3 c = esLight(a, n, vW, vAo, 0.);
        // the garden's own fine shade on the lawn (tShade): the sun's part of the light goes out of a clipped thing's
        // shadow, and some of the sky's out of the ground close under it
        if (lawn > 0.) {
          vec2 sd = gard.rg * lawn;
          vec3 sunE = uSunCol * (clamp(dot(n, uSunDir), 0., 1.) * esSun(vW, pl)), fillE = esFill(n, pl) * (vAo * (.6 + .4 * esCloudShade(vW)));
          c *= (sunE * (1. - sd.r) + fillE * (1. - .6 * sd.g)) / max(sunE + fillE, vec3(1e-4));
        }
        vec3 v = normalize(cameraPosition - vW);
        // by the sea the light comes back off the water: a flank turned from the sun is not left dark
        c += a * (uSkyCol + uSunCol * .12) * (.16 * coast * clamp(.6 - dot(n, uSunDir), 0., 1.));
        // THE MIRROR'S LAW (the wet band and the rock pools alike): what lies wet throws back the sky along its mirrored
        // sight line (haze at the horizon, the sky's own colour above), the sun where its image falls and the ring where
        // its image falls (a disc of the ring's own size, and a soft glow about it); more of it the flatter the sight
        // line lies. The wet pebbles break the image (each tilts its own way); a pool lies still but for the wind's ripple
        float mir = max(wet * (1. - foamOn), poolIn) * shin;
        if (mir > 0.) {
          vec3 tilt = vec3(pc.x, 0., pc.y) * (.22 * (1. - poolIn)) + vec3(esN(p * 2.1 + uTime * .5) - .5, 0., esN(p * 2.1 + 9. - uTime * .4) - .5) * (.05 * poolIn);
          vec3 r = reflect(-v, normalize(n + tilt)); r.y = abs(r.y);
          float fres = .07 + .8 * pow(1. - clamp(dot(n, v), 0., 1.), 3.) + .25 * poolIn;
          vec3 toRing = uPortal.xyz - vW; float rl = length(toRing), ca = dot(r, toRing / rl), ra2 = RING_R * RING_R / (rl * rl);
          vec3 img = mix(uFogCol, uSkyCol * .3183, smoothstep(.02, .55, r.y)) + uSunCol * (.6 * pow(clamp(dot(r, uSunDir), 0., 1.), 180.));
          img += uPortalCol * (.9 * smoothstep(1. - ra2 * .9, 1. - ra2 * .35, ca) + .22 * pow(clamp(ca, 0., 1.), 24.));
          c = mix(c, img, mir * min(fres, 1.));
        }
        // A WET PEBBLE IS ROUND: somewhere on it the sun's own image stands, a point of light, whichever way the sun stands
        // (where the pebble's face turns half way between the sun and the eye): the strewn pebbles of the wet band
        // and, fainter, of the sand above it, at the hours when pebbles stand out of the sand (none while the sun is under 21 degrees)
        float glint = strewn * wet * (1. - foamOn) * shin;
        if (glint > 0.) c += uSunCol * (glint * esSun(vW, pl) * 1.2 * pow(clamp(dot(normalize(vec3(-pc.x * 2.4, 1., -pc.y * 2.4)), normalize(v + uSunDir)), 0., 1.), 260.));
        gl_FragColor = vec4(esFog(c, vW), 1.);
      }`,
  });
  mat.detailMap = U.tPlace.value;
  return mat;
}

// ---------------------------------------------------------------- the estate, piece by piece
async function buildEstate(S) {
  const { ctx, R, Lo, M, BOX } = S, P = PLACE;
  const ra = [0, 0, 0], da = [0, 0];
  // ---- the place map's standing fields: leaves overhead in the wood, the red of the cut, the pale flowers of the valley
  const PM = makePlaceMap(BOX, 384, 192);
  // The wood changes as the drive goes. From the entry to the end of its straight no GLADE (the vault's own standing gaps and the pools of light under them lie all along the wood: see WHERE THE LIGHT LANDS). From
  // there on, glades to one side or the other (a dealt side) at dealt steps of 28 to 44 m of the drive, as far as the
  // cut's east mouth: the first dealt glade is the great one, where the sun falls on bluebells; every later one is a
  // small one among the trunks with red bushes in it, and the bushes grow with the metres from the first glade to the cut.
  const gaps = [], Tg = Lo.tables;
  const glade = (m, side, off, r, blue) => {
    const k = Tg.B + Math.round(m), k2 = Math.min(k + 2, Tg.n - 1), tx = Tg.X[k2] - Tg.X[k], tz = Tg.Z[k2] - Tg.Z[k], tl = Math.hypot(tx, tz) || 1;
    gaps.push({ x: Tg.X[k] + (tz / tl) * side * off, z: Tg.Z[k] - (tx / tl) * side * off, r, m, side, off, blue, tx: tx / tl, tz: tz / tl });
  };
  for (let m = M.straight + R.glades.range(28, 44); m < M.east - 24; m += R.glades.range(28, 44)) {
    const side = R.glades.chance(0.5) ? 1 : -1, off = R.glades.range(13, 21), r = R.glades.range(7, 10.5);
    if (gaps.length) glade(m, side, off, r, false); else glade(m, side, 25, 15, true);
  }
  S.gaps = gaps;
  for (let j = 0; j < PM.H; j++) {
    for (let i = 0; i < PM.W; i++) {
      const k = j * PM.W + i, c = PM.centre(k), x = c[0], z = c[1];
      Lo.routeAt(x, z, ra);
      const lawn = Lo.lawnIn(x, z), nearRoute = ra[0] < 71;
      if (!nearRoute && lawn < 0.02) { PM.cover[k] = x > -330 ? 0.9 : 0; continue; }
      PM.live[k] = 1; PM.occ[k] = Lo.ground(x, z);
      const wood = Lo.woodIn(x, z), v = Lo.toValley(x, z), a = Math.abs(v[1] - Lo.lr(v[0]) - 2.5);
      // THE VAULT of the drive's great beeches (from behind the entry to 12 m short of the cut's east mouth, as far
      // from the line as the place map lives): the leaf cover is written whole there, 0.92 of it everywhere else.
      // IT ENDS ON A RAMP ALONG THE DRIVE'S OWN METRES, the same on every seed: the cover is whole as far as 36 m short
      // of the mouth and falls evenly over the next 24 m to the wood's plain 0.92 at 12 m short of it, where it ended
      // before. By the light law's own thresholds the vault's measure (esVault) is whole to 33 m short of the mouth
      // and none from 16.5 m short, eased over the 16.5 m between: the shade, the dapple, the drifts and the drive's
      // green crown thin out together over those metres and end on no line
      PM.cover[k] = (nearRoute && ra[1] < M.east - 12 ? 1 - 0.08 * clamp((ra[1] - M.east + 36) / 24, 0, 1) : 0.92) * wood;
      if (nearRoute && ra[1] === ra[1]) PM.red[k] = Lo.cutSpan(ra[1]) * (1 - smoothstep(30, 40, ra[0]));
      const valley = smoothstep(Lo.headS - 4, Lo.headS + 14, v[0]) * (1 - smoothstep(205, 222, v[0])) * smoothstep(3, 7, a) * (1 - smoothstep(46, 60, a));
      PM.pale[k] = valley; PM.cover[k] = Math.max(PM.cover[k], 0.4 * valley);
    }
    if (j % 8 === 7) await ctx.yield();
  }
  for (const g of gaps) PM.disc(PM.cover, g.x, g.z, g.r * 0.55, g.r * 1.25, 0.08, true);
  await ctx.yield();
  return buildBanks({ ...S, PM, ra, da });
}

// several built banks (or bushes) as one: their chunks' geometry and instances joined, for one set of draws
function joinBanks(list) {
  const chunks = list.flatMap((b) => b.chunks), cat = (key) => { const out = new Float32Array(chunks.reduce((n, c) => n + c[key].length, 0)); let o = 0; for (const c of chunks) { out.set(c[key], o); o += c[key].length; } return out; };
  const g = new THREE.BufferGeometry(), idx = []; let base = 0;
  for (const name of ['position', 'normal', 'aUv', 'aMask']) {
    const size = chunks[0].geometry.attributes[name].itemSize, out = new Float32Array(chunks.reduce((n, c) => n + c.geometry.attributes[name].array.length, 0)); let o = 0;
    for (const c of chunks) { out.set(c.geometry.attributes[name].array, o); o += c.geometry.attributes[name].array.length; }
    g.setAttribute(name, new THREE.BufferAttribute(out, size));
  }
  for (const c of chunks) { const ia = c.geometry.index.array; for (let i = 0; i < ia.length; i++) idx.push(ia[i] + base); base += c.geometry.attributes.position.count; c.geometry.dispose(); }
  g.setIndex(idx); g.computeBoundingSphere();
  return { chunks: [{ geometry: g, heads: cat('heads'), headTint: cat('headTint'), leaves: cat('leaves'), leafTint: cat('leafTint'), sphere: g.boundingSphere }] };
}

// THE BUILT HEADS OF A BANK, OR OF A SET OF BUSHES, ARE BOUNDED: about `most` of them stand at the most (a stated number
// to a metre of bank, of the wood's drive, of the valley: each caller says its own). Where a year deals more, only the
// share most / dealt may stay, and EACH HEAD ANSWERS FOR ITSELF: the number of its own place (where it stands, to the
// millimetre) against that share. No head's fate hangs on another's or on the order of building, no head that stays
// is moved or dealt again, no stream is drawn from, and the painted layer carries the rest.
function boundHeads(chunks, most) {
  const dealt = chunks.reduce((n, c) => n + c.heads.length / 16, 0);
  if (dealt <= most) return;
  const share = most / dealt;
  for (const c of chunks) {
    let kept = 0;
    for (let i = 0, n = c.heads.length / 16; i < n; i++) {
      const o = i * 16;
      let h = Math.imul(Math.round(c.heads[o + 12] * 1000), 73856093) ^ Math.imul(Math.round(c.heads[o + 13] * 1000), 19349663) ^ Math.imul(Math.round(c.heads[o + 14] * 1000), 83492791);
      h = Math.imul(h ^ (h >>> 15), 0x2c1b3c6d); h = Math.imul(h ^ (h >>> 12), 0x297a2d39);
      if (((h ^ (h >>> 15)) >>> 0) / 4294967296 >= share) continue;
      c.heads.copyWithin(kept * 16, o, o + 16); c.headTint.copyWithin(kept * 4, i * 4, i * 4 + 4); kept++;
    }
    c.heads = c.heads.slice(0, kept * 16); c.headTint = c.headTint.slice(0, kept * 4);
  }
}

async function buildBanks(S) {
  const { ctx, scene, R, Lo, M, heavy, density, detail, U, PM } = S, Tb = Lo.tables;
  const bankMats = makeBankMaterials(U, { heavy }), bushMats = makeBankMaterials(U, { heavy, bush: true });
  // ---- the two banks of the cut, along the route's own line from the east mouth to the west mouth
  const line = []; for (let m = M.east; m <= M.west; m++) line.push([Tb.X[Tb.B + m], Tb.Z[Tb.B + m]]);
  const LEN = M.west - M.east, banks = [];
  for (const [side, rng, off] of [[1, R['bank-left'], 0], [-1, R['bank-right'], 700]]) {
    // feet 11 m from the line; over the last 30 m before the west mouth the banks step back to 17 m and fall to about 9 m
    const bank = await buildBank({ line, side, rng, heavy, uvOffset: off, groundAt: Lo.ground, chunk: 32, thin: R[side > 0 ? 'thin-left' : 'thin-right'], lineDist: Lo.routeDist, headNear: 14, headFar: 21, headSize: [0.3, 0.84],
      foot: (s) => 11 + 6 * smoothstep(LEN - 30, LEN - 6, s), thick: (s) => 12 + 1.6 * Math.sin(s * 0.07 + off), tall: (s) => 1 - 0.36 * smoothstep(LEN - 34, LEN - 8, s) }, ctx.yield);
    // about 44 built heads to a metre of bank at the most (a common year deals 39 to 45, the heavy year 49 to 54): over
    // that, boundHeads keeps the share 44 / dealt, each head for itself, so some tens of heads more or fewer than the bound
    boundHeads(bank.chunks, 44 * LEN);
    const built = bankMats.assemble(bank); scene.add(built.group); banks.push({ bank, built, side });
    bank.eachVertex((x, y, z) => PM.raise(x, z, y, 1.6));
    await ctx.yield();
  }
  // ---- spent flowers lying on the gravel and the verges of the cut: built heads, each laid flat where it fell, thin in
  // the middle of the drive and thick toward the banks' feet (none further from the line than the feet, 11 m)
  const lying = [0, 1, 2, 3].map(() => ({ m: [], t: [] })), l4 = new THREE.Matrix4(), lq = new THREE.Quaternion(), le = new THREE.Euler(), lv = new THREE.Vector3(), ls = new THREE.Vector3();
  for (let i = 0, rf = R['fallen-heads'], n = Math.round((heavy ? 4400 : 3000) * detail); i < n; i++) {
    const m = rf.range(0, LEN), side = rf.sign(), d = 10.6 * Math.pow(rf(), 0.6), size = rf.range(0.13, 0.24), turn = rf.range(0, TAU), tip = rf.range(-0.5, 0.5), tone = rf.range(0.7, 1.15);
    const k = Tb.B + M.east + Math.floor(m), tx = Tb.X[k + 1] - Tb.X[k], tz = Tb.Z[k + 1] - Tb.Z[k], tl = Math.hypot(tx, tz) || 1, x = Tb.X[k] + tz / tl * side * d, z = Tb.Z[k] - tx / tl * side * d;
    const c = lying[Math.min(3, Math.floor(m / LEN * 4))];
    le.set(tip, turn, tip * 0.7); l4.compose(lv.set(x, Lo.ground(x, z) + 0.03, z), lq.setFromEuler(le), ls.set(size, size * 0.6, size));
    for (let e = 0; e < 16; e++) c.m.push(l4.elements[e]);
    c.t.push(tone, 0.3, 0.85, 0);
    if (i % 800 === 799) await ctx.yield();
  }
  const lyingGroup = new THREE.Group(); scene.add(lyingGroup);
  for (const c of lying) {
    const g = bankMats.headGeometry.clone(), mesh = new THREE.InstancedMesh(g, bankMats.head, c.m.length / 16);
    g.setAttribute('aTint', new THREE.InstancedBufferAttribute(new Float32Array(c.t), 4)); mesh.instanceMatrix = new THREE.InstancedBufferAttribute(new Float32Array(c.m), 16);
    mesh.computeBoundingSphere(); lyingGroup.add(mesh);
  }
  await ctx.yield();
  // ---- the outlying red bushes in the wood's glades: one great bush in each glade, one or two lesser ones beside it
  const bushes = [], spots = [];
  for (const g of S.gaps) {
    if (g.blue) continue;
    const grow = smoothstep(S.gaps[0].m, M.east, g.m), n = 1 + (R.outliers.chance(lerp(0.4, 0.9, grow) * density) ? 1 : 0) + (R.outliers.chance(lerp(0.15, 0.6, grow) * density) ? 1 : 0);
    for (let i = 0; i < n; i++) {
      const h = (i === 0 ? lerp(4.6, 9.5, grow) * R.outliers.range(0.9, 1.1) : R.outliers.range(3.2, 3.6 + 2.4 * grow)), w = h * R.outliers.range(1.15, 1.45), a = R.outliers.range(0, TAU);
      // lesser bushes stand beyond the great one, further from the drive
      const along = i === 0 ? 0 : (i === 1 ? -1 : 1) * R.outliers.range(5.5, 8.5), out = i === 0 ? 0 : R.outliers.range(1.5, 5);
      const k = Tb.B + Math.round(g.m), k2 = Math.min(k + 2, Tb.n - 1), tx = Tb.X[k2] - Tb.X[k], tz = Tb.Z[k2] - Tb.Z[k], tl = Math.hypot(tx, tz) || 1;
      const x = g.x + (tx / tl) * along + (tz / tl) * g.side * out, z = g.z + (tz / tl) * along - (tx / tl) * g.side * out, len = w * 0.9;
      const bush = await buildBank({ line: [[x - Math.cos(a) * len / 2, z - Math.sin(a) * len / 2], [x + Math.cos(a) * len / 2, z + Math.sin(a) * len / 2]], side: 0, rng: S.fork('outlier-' + bushes.length), heavy,
        uvOffset: 1400 + bushes.length * 40, groundAt: Lo.ground, chunk: 999, cell: 0.9, rows: 18, thick: () => w, domeHalf: [len, len], domeHigh: [h, h], lean: 0, lumps: 1.2, perM2: 1.5, leafM2: 0.6,
        thin: R['thin-outliers'], lineDist: Lo.routeDist, headNear: 18, headFar: 32 }, null);
      bushes.push(bush); spots.push({ x, z, r: w * 0.5, h });
      bush.eachVertex((vx, vy, vz) => PM.raise(vx, vz, vy, 1.6));
      PM.disc(PM.red, x, z, w * 0.5 + 1, w * 0.5 + 4, 0.85, false);
      if (bushes.length % 3 === 0) await ctx.yield();
    }
  }
  // about 12 built heads to a metre of the wood's drive on these bushes at the most, by the same law (a common year deals 5 to 12, the heavy year up to 16)
  boundHeads(bushes.flatMap((b) => b.chunks), 12 * (M.east - M.straight));
  const outliers = bushMats.assemble(joinBanks(bushes)); scene.add(outliers.group);
  S.spots = spots;
  return buildGround({ ...S, banks, outliers, lyingGroup });
}

async function buildGround(S) {
  const { ctx, scene, R, Lo, path, heavy, U, PM, da } = S, P = PLACE;
  // the place map's texture exists from here on (every estate material reads it); it is filled at the end of build
  const placeTex = new THREE.DataTexture(new Uint8Array(PM.W * PM.H * 4), PM.W, PM.H, THREE.RGBAFormat);
  placeTex.magFilter = placeTex.minFilter = THREE.LinearFilter; placeTex.wrapS = placeTex.wrapT = THREE.ClampToEdgeWrapping; placeTex.generateMipmaps = false;
  U.tPlace.value.dispose(); U.tPlace.value = placeTex;
  const zone = (x, z, h, ny, out) => {
    const v = Lo.toValley(x, z), s = v[0], off = v[1] - Lo.lr(s) - 2.5, a = Math.abs(off) + Lo.flankInset(s, off > 0);
    const shingle = smoothstep(212, 222, s) * (1 - smoothstep(Lo.floorHalf(s), Lo.floorHalf(s) + 4, a));
    const valley = smoothstep(Lo.headS - 10, Lo.headS + 6, s) * (1 - smoothstep(52, 64, a)) * (1 - shingle) * (1 - smoothstep(236, 246, s));
    const lawn = Lo.lawnIn(x, z) * (1 - valley) * (1 - shingle) * (1 - Lo.seaFall(s, v[1]));
    return out.setRGB(lawn, valley, shingle);
  };
  // two rock pools, one at each headland's foot: each dealt along the shingle between the wrack and the wet band
  // (236 to 252 m down the valley's axis), 2.5 to 5 m in from where the headland's flank begins, lying along that flank
  const pools = [1, -1].map((side) => {
    const s = R.pools.range(236, 252), off = side * (Lo.floorHalf(s) - Lo.flankInset(s, side > 0) - R.pools.range(2.5, 5)), q = Lo.fromValley(s, Lo.lr(s) + 2.5 + off);
    return { x: q[0], z: q[1], r: R.pools.range(3, 4.2), turn: Math.atan2(P.valleyAxis[1], P.valleyAxis[0]) + R.pools.range(-0.3, 0.3) };
  });
  const lawnShade = makeLawnShade(S.sunDir);
  const groundMat = makeGroundMaterial(U, { stripe: P.houseFront, petals: heavy ? 1 : 0.34, heavy, pools, shade: lawnShade });
  // the drive's run behind the entry keeps fine ground under it
  const focus = []; for (let d = 10; d <= BEHIND; d += 20) focus.push([P.entry[0] + d, P.entry[1], 2]);
  // and the two headlands keep ground fine enough to carry their ledges
  for (let s = 250; s <= 350; s += 20) for (const a of [45, 65, 85]) for (const side of [-1, 1]) {
    const q = Lo.fromValley(s, Lo.lr(s) + 2.5 + side * a); focus.push([q[0], q[1], 2]);
  }
  await ctx.yield();
  const terrain = await T.makeTerrainAsync({ rng: R.far, noise: ctx.noise, path, height: Lo.ground, corridor: false, bounds: [-720, -420, 960, 540], cell: 2, near: 11, levels: 5,
    refine: 2, refineDistance: 300, maxTriangles: 64000, color: zone, materialInstance: groundMat, ao: 0.4, focus }, ctx.yield, 2);
  const pos = terrain.geometry.attributes.position, place = new Float32Array(pos.count * 4), heath = new Float32Array(pos.count * 2), side = new Float32Array(pos.count * 2), ra = S.ra;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i), v = Lo.toValley(x, z);
    Lo.drive(x, z, da);
    place[i * 4] = Math.min(da[0], 60); place[i * 4 + 1] = da[1]; place[i * 4 + 2] = v[1] - Lo.streamAt(v[0]); place[i * 4 + 3] = v[0];
    // (the wood's drive: metres to the LEFT of its middle, and 1 where that middle is the route's own line before the cut;
    // asked only within 6 m of a drive's middle: no cell further out can lie across it, and there the plain number serves)
    if (da[0] < 6) { Lo.routeAt(x, z, ra); side[i * 2] = ra[2]; side[i * 2 + 1] = ra[1] < S.M.east - 4 && Math.abs(Math.abs(ra[2]) - da[0]) < 0.01 ? 1 : 0; }
    heath[i * 2] = Lo.seaFall(v[0], v[1]);
    // (the bluebells' field lies twice as long along the drive as it is deep: blue beside the line for 40 m and more)
    for (const g of S.gaps) if (g.blue) { const dx = x - g.x, dz = z - g.z; heath[i * 2 + 1] = Math.max(heath[i * 2 + 1], 1 - smoothstep(g.r * 0.5, g.r * 1.8, Math.hypot((dx * g.tx + dz * g.tz) * 0.5, dz * g.tx - dx * g.tz))); }
    if ((i & 1023) === 1023) await ctx.yield();
  }
  terrain.geometry.setAttribute('aPlace', new THREE.BufferAttribute(place, 4));
  terrain.geometry.setAttribute('aHeath', new THREE.BufferAttribute(heath, 2));
  terrain.geometry.setAttribute('aSide', new THREE.BufferAttribute(side, 2));
  terrain.object.name = 'ground'; scene.add(terrain.object);
  await ctx.yield();
  return buildWood({ ...S, placeTex, pools, lawnShade, surface: terrain.surfaceAt });
}

// ---------------------------------------------------------------- kit plant geometry under the estate's light
// (so a trunk under leaves stands in shade with the sun's spots on it, and a crown's top stands in the sun)
function makeFloraMaterial(U, map) {
  return new THREE.ShaderMaterial({
    uniforms: { ...U, map: { value: map } }, fog: false, side: THREE.DoubleSide, vertexColors: true,
    vertexShader: ESTATE_GLSL + /* glsl */`
      attribute vec4 wind; attribute vec4 aTint;
      varying vec3 vW, vN, vC; varying vec2 vUvF, vF;
      void main(){
        mat4 im = modelMatrix * instanceMatrix;
        vec3 org = im[3].xyz; float sc = length(im[1].xyz);
        vec4 wp = im * vec4(position, 1.);
        float ph = dot(org.xz, uWind.xy) * .09 - uTime * uWind.w * .8;
        float g = .55 + .45 * (sin(ph) * .6 + sin(ph * 2.3 + 1.7) * .4);
        vec2 bend = uWind.xy * g + vec2(sin(uTime * 1.3 + org.x), cos(uTime * 1.1 + org.z * 1.3)) * .24;
        float a = wind.x * sc * uWind.z;
        wp.xyz += vec3(bend.x * a, -dot(bend, bend) * a * .12, bend.y * a);
        float f1 = sin(uTime * 5.3 + wp.x * 2.1 + wp.y * 1.3 + wp.z * 1.7), f2 = cos(uTime * 4.1 + wp.z * 2.3 + wp.x * 1.1 - wp.y * .7);
        wp.xyz += vec3(f1, f2 * .7, f1 * f2) * (wind.y * .045 * uWind.z * (.4 + g) * min(sc, 2.5));
        vW = wp.xyz; vN = normalize(mat3(im) * normal); vC = color * aTint.rgb; vUvF = uv; vF = vec2(min(wind.z, 1.), aTint.a);
        gl_Position = projectionMatrix * viewMatrix * wp;
      }`,
    fragmentShader: ESTATE_GLSL + /* glsl */`
      uniform sampler2D map;
      varying vec3 vW, vN, vC; varying vec2 vUvF, vF;
      void main(){
        vec4 tx = texture2D(map, vUvF);
        if (tx.a < .4) discard;
        float leaf = clamp(vF.x, 0., 1.);
        vec3 n = normalize(vN);
        if (!gl_FrontFacing && leaf < .5) n = -n;
        float bark = esN(vec2(vW.x + vW.z, vW.y * .35) * 7.) * .6 + esN(vec2(vW.x - vW.z, vW.y * .2) * 19.) * .4;
        vec3 alb = vC * tx.rgb * mix(.62 + .7 * bark, 1., leaf);
        vec4 pl = esPlace(vW);
        vec3 c = esLight(alb, n, vW, vF.y, mix(.1, .7, leaf));
        vec3 v = normalize(cameraPosition - vW);
        float vl = clamp(dot(-v, uSunDir), 0., 1.);
        float thru = clamp(.25 - dot(n, uSunDir) * .75, 0., 1.) * (.35 + .65 * vl * vl);
        c += uSunCol * alb * vec3(.85, 1., .48) * (thru * leaf * .9 * .3183 * esSun(vW, pl));
        gl_FragColor = vec4(esFog(c, vW), 1.);
      }`,
  });
}

// a kit tree seated high on a great bare trunk of our own: the tree's own stem below cutY is left out and a column
// stands from the ground to that height (lift metres of clear trunk under the first boughs)
function onColumn(g0, lift, cutY, rTop, rBase, rng) {
  const p = g0.attributes.position, n0 = g0.attributes.normal, c0 = g0.attributes.color, u0 = g0.attributes.uv, w0 = g0.attributes.wind, ia = g0.index.array;
  let bark = 0; while (bark < p.count - 1 && w0.getZ(bark) > 0.5) bark++;
  const SEG = 9, hs = [0, 0.05, 0.14, 0.34, 0.68, 1], H = lift + cutY, n = p.count, m = SEG * hs.length, ph = rng.range(0, TAU), k3 = 3 + Math.floor(rng() * 3);
  const pos = new Float32Array((n + m) * 3), nor = new Float32Array((n + m) * 3), col = new Float32Array((n + m) * 3), uv = new Float32Array((n + m) * 2), wind = new Float32Array((n + m) * 4), idx = [];
  pos.set(p.array); nor.set(n0.array); col.set(c0.array); uv.set(u0.array); wind.set(w0.array);
  for (let i = 0; i < n; i++) pos[i * 3 + 1] += lift;
  for (let i = 0; i < ia.length; i += 3) {
    const a = ia[i], b = ia[i + 1], c = ia[i + 2];
    if (p.getY(a) < cutY && p.getY(b) < cutY && p.getY(c) < cutY && w0.getZ(a) < 0.5) continue;
    idx.push(a, b, c);
  }
  for (let r = 0; r < hs.length; r++) for (let j = 0; j < SEG; j++) {
    const k = n + r * SEG + j, a = j / SEG * TAU, h = hs[r] * H, flare = Math.exp(-h / 1.3);
    const rad = (rTop + (rBase - rTop) * flare) * (1 + 0.22 * flare * Math.sin(a * k3 + ph) + 0.05 * Math.sin(a * 2 + h * 0.6 + ph));
    pos[k * 3] = Math.cos(a) * rad; pos[k * 3 + 1] = h - 0.3; pos[k * 3 + 2] = Math.sin(a) * rad;
    nor[k * 3] = Math.cos(a); nor[k * 3 + 1] = 0.25 * flare; nor[k * 3 + 2] = Math.sin(a);
    const shade = 0.62 + 0.38 * smoothstep(0, 3, h);
    col[k * 3] = c0.getX(bark) * shade; col[k * 3 + 1] = c0.getY(bark) * shade; col[k * 3 + 2] = c0.getZ(bark) * shade;
    uv[k * 2] = u0.getX(bark); uv[k * 2 + 1] = u0.getY(bark);
    if (r > 0) { const j2 = (j + 1) % SEG, q = n + (r - 1) * SEG; idx.push(q + j, q + SEG + j, q + j2, q + j2, q + SEG + j, q + SEG + j2); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); g.setAttribute('wind', new THREE.BufferAttribute(wind, 4)); g.setIndex(idx);
  g0.dispose();
  return g;
}

// instances of plant geometry: pts = [{ x, y, z, s, rot, v (which geometry), c (which chunk), tint, ao, lx, lz (lean) }]
function plantSet(mat, geoms, pts, group) {
  const by = new Map();
  for (const p of pts) { const key = (p.c || 0) * 16 + (p.v || 0); if (!by.has(key)) by.set(key, []); by.get(key).push(p); }
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), v = new THREE.Vector3(), sc = new THREE.Vector3(), meshes = [];
  let triangles = 0;
  for (const [key, list] of by) {
    const g0 = geoms[key % 16], g = new THREE.BufferGeometry();
    for (const name in g0.attributes) g.setAttribute(name, g0.attributes[name]);
    g.setIndex(g0.index);
    const tint = new Float32Array(list.length * 4), mesh = new THREE.InstancedMesh(g, mat, list.length);
    list.forEach((p, i) => {
      e.set(p.lx || 0, p.rot || 0, p.lz || 0, 'YXZ');
      m4.compose(v.set(p.x, p.y, p.z), q.setFromEuler(e), sc.set(p.s, p.sy || p.s, p.s)); mesh.setMatrixAt(i, m4);
      const t = p.tint || [1, 1, 1]; tint[i * 4] = t[0]; tint[i * 4 + 1] = t[1]; tint[i * 4 + 2] = t[2]; tint[i * 4 + 3] = p.ao ?? 1;
    });
    g.setAttribute('aTint', new THREE.InstancedBufferAttribute(tint, 4));
    mesh.computeBoundingSphere(); mesh.boundingSphere.radius += 2;
    group.add(mesh); meshes.push(mesh); triangles += (g0.index.count / 3) * list.length;
  }
  return { meshes, triangles };
}

// ---------------------------------------------------------------- our own beeches, built in lots (one mesh to a lot)
// A lot gathers stems, boughs, leaf sprays and fern fronds as plain triangles. aData = (u, v, kind, sway): kind 0 is
// bark (u round the stem, v metres up it); 1 to 1.5 a spray of beech leaves on a flat card (u, v across it), the kind
// carrying the card's half size as 1 + metres / 16; 2 a fern's frond, a bent ribbon (u across it, v along it).
function makeLot() {
  // (the vertices go straight into typed stores that double as they fill: no loose list is kept and turned over at the end)
  let pos = new Float32Array(3 << 12), nor = new Float32Array(3 << 12), col = new Float32Array(3 << 12), dat = new Float32Array(4 << 12), n = 0;
  const idx = [], grown = (a) => { const b = new Float32Array(a.length * 2); b.set(a); return b; };
  const put = (x, y, z, nx, ny, nz, c, u, v, kind, sway) => {
    if (n * 3 === pos.length) { pos = grown(pos); nor = grown(nor); col = grown(col); dat = grown(dat); }
    const i = n * 3, k = n * 4;
    pos[i] = x; pos[i + 1] = y; pos[i + 2] = z; nor[i] = nx; nor[i + 1] = ny; nor[i + 2] = nz; col[i] = c[0]; col[i + 1] = c[1]; col[i + 2] = c[2];
    dat[k] = u; dat[k + 1] = v; dat[k + 2] = kind; dat[k + 3] = sway;
    return n++;
  };
  const L = {
    count: () => idx.length / 3,
    // a tube through pts [[x, y, z, radius, metres up the stem, number of roots], ...]: a stem (roots > 0: the share by
    // which its foot swells into that many roots) or a bough
    tube(pts, sides, c, roots, ph) {
      const base = n;
      for (let r = 0; r < pts.length; r++) {
        const p = pts[r], a = pts[Math.max(r - 1, 0)], b = pts[Math.min(r + 1, pts.length - 1)];
        let tx = b[0] - a[0], ty = b[1] - a[1], tz = b[2] - a[2]; const tl = Math.hypot(tx, ty, tz) || 1; tx /= tl; ty /= tl; tz /= tl;
        // two axes square to the tube's way
        let ux = ty, uy = -tx, uz = 0; if (Math.abs(ty) > 0.9) { ux = 1; uy = 0; uz = 0; }
        const d = ux * tx + uy * ty + uz * tz; ux -= tx * d; uy -= ty * d; uz -= tz * d; const ul = Math.hypot(ux, uy, uz) || 1; ux /= ul; uy /= ul; uz /= ul;
        const vx = ty * uz - tz * uy, vy = tz * ux - tx * uz, vz = tx * uy - ty * ux;
        for (let j = 0; j <= sides; j++) {
          const an = j / sides * TAU, lobe = roots ? 1 + roots * Math.exp(-Math.max(p[4], 0) / 0.55) * (0.5 + 0.5 * Math.sin(an * p[5] + ph)) : 1;
          const cx = Math.cos(an), sn = Math.sin(an), rad = p[3] * lobe, nx = ux * cx + vx * sn, ny = uy * cx + vy * sn, nz = uz * cx + vz * sn;
          put(p[0] + nx * rad, p[1] + ny * rad, p[2] + nz * rad, nx, ny, nz, c, j / sides, p[4] ?? 0, 0, 0);
        }
      }
      for (let r = 0; r < pts.length - 1; r++) for (let j = 0; j < sides; j++) { const k = base + r * (sides + 1) + j, k2 = k + sides + 1; idx.push(k, k + 1, k2, k + 1, k2 + 1, k2); }
    },
    // a flat card about (x, y, z): half sizes a (along ax) and b (along bx), its two axes given; kind 1 or 2
    card(x, y, z, ax, bx, a, b, c, kind, sway) {
      const nx = ax[1] * bx[2] - ax[2] * bx[1], ny = ax[2] * bx[0] - ax[0] * bx[2], nz = ax[0] * bx[1] - ax[1] * bx[0], s = ny < 0 ? -1 : 1, base = n;
      for (const [u, v] of [[0, 0], [1, 0], [1, 1], [0, 1]]) {
        const fa = (u * 2 - 1) * a, fb = (v * 2 - 1) * b;
        put(x + ax[0] * fa + bx[0] * fb, y + ax[1] * fa + bx[1] * fb, z + ax[2] * fa + bx[2] * fb, nx * s, ny * s, nz * s, c, u, v, kind, sway);
      }
      idx.push(base, base + 1, base + 2, base, base + 2, base + 3);
    },
    // a ribbon through pts [[x, y, z, nx, ny, nz, v], ...] (its upper side's normal and its place along itself at each),
    // (wx, wz) its half width across: kind 1 or 2
    ribbon(pts, wx, wz, c, kind, sway) {
      const base = n;
      for (const q of pts) { put(q[0] - wx, q[1], q[2] - wz, q[3], q[4], q[5], c, 0, q[6], kind, sway); put(q[0] + wx, q[1], q[2] + wz, q[3], q[4], q[5], c, 1, q[6], kind, sway); }
      for (let r = 0; r < pts.length - 1; r++) { const k = base + r * 2; idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); }
    },
    mesh(mat) {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos.subarray(0, n * 3), 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor.subarray(0, n * 3), 3));
      g.setAttribute('color', new THREE.Float32BufferAttribute(col.subarray(0, n * 3), 3)); g.setAttribute('aData', new THREE.Float32BufferAttribute(dat.subarray(0, n * 4), 4)); g.setIndex(idx);
      g.computeBoundingSphere(); g.computeBoundingBox();
      return new THREE.Mesh(g, mat);
    },
  };
  return L;
}

// A great limb's way from the fork: its run and its rise (shares of its reach and of its height) and its thickness (a
// share of the stem's) at six places: steep from the fork, then over in an arch. The trees beyond the avenue take four.
const LIMB = [[0, 0, 0.62], [0.1, 0.3, 0.5], [0.28, 0.6, 0.36], [0.55, 0.85, 0.22], [0.8, 0.96, 0.12], [1, 1, 0.05]], LIMB_FAR = [LIMB[0], LIMB[2], LIMB[4], LIMB[5]];
// one beech at (x, z) on ground g: a smooth stem o.r thick that leans a little its own way (o.lean), clear to its fork
// at o.fork; limbs that rise from the fork and arch over to o.top; leaf sprays in layers: under and along the limbs'
// outer parts (the lower the darker), a roof of larger sprays over the whole crown, a few small ones low about the fork. o.toward: the way one limb
// must take (over the drive, to meet the far side's)
function beech(L, rng, x, z, g, o) {
  const r = o.r, h = o.fork, ph = rng.range(0, TAU), lobes = 4 + Math.floor(rng() * 3), la = rng.range(0, TAU), lx = Math.cos(la) * o.lean, lz = Math.sin(la) * o.lean;
  L.tube([-0.5, 0.05, 0.35, 0.9, 2.2, h * 0.55, h].map((y) => [x + lx * y, g + y, z + lz * y, r * (1 + 0.5 * Math.exp(-Math.max(y, 0) / 0.8)) * (1 - 0.18 * y / h), y, lobes]), o.sides, o.bark, 0.42, ph);
  const nb = o.boughs, a0 = rng.range(0, TAU), fx = x + lx * h, fz = z + lz * h, n = [0, 0, 0], ax = [0, 0, 0], bx = [0, 0, 0];
  // a spray about (px, py, pz), sz its half size: a card tilted from the level by `tilt` toward a dealt bearing
  // (it is kept by its extent: its middle and the reach of its card, see the wood's `open`)
  const spray = (px, py, pz, sz, tilt, shade, sway) => {
    const rot = rng.range(0, TAU), ta = rng.range(0, TAU), tone = rng.range(0.78, 1.16) * shade, warm = rng.range(0.85, 1.2);
    if (o.keep && !o.keep(px, pz, sz * 1.281 + 0.45)) return;
    n[0] = Math.sin(tilt) * Math.cos(ta); n[1] = Math.cos(tilt); n[2] = Math.sin(tilt) * Math.sin(ta);
    const hx = Math.cos(rot), hz = Math.sin(rot), d = hx * n[0] + hz * n[2];
    ax[0] = hx - n[0] * d; ax[1] = -n[1] * d; ax[2] = hz - n[2] * d; const al = Math.hypot(ax[0], ax[1], ax[2]); ax[0] /= al; ax[1] /= al; ax[2] /= al;
    bx[0] = n[1] * ax[2] - n[2] * ax[1]; bx[1] = n[2] * ax[0] - n[0] * ax[2]; bx[2] = n[0] * ax[1] - n[1] * ax[0];
    // (a spray's kind carries its half size, 1 + metres / 16: its leaves are drawn at their own size whatever the card's)
    L.card(px, py, pz, ax, bx, sz, sz * 0.8, [o.leaf[0] * tone * warm, o.leaf[1] * tone, o.leaf[2] * tone], 1 + sz / 16, sway);
  };
  for (let b = 0; b < nb; b++) {
    const az = a0 + b / nb * TAU + rng.range(-0.4, 0.4), aim = b === 0 && o.toward, dx = aim ? o.toward[0] : Math.cos(az), dz = aim ? o.toward[1] : Math.sin(az);
    const R = aim ? o.reach : o.reach * rng.range(0.55, 1), rise = o.top * rng.range(0.86, 1) - h;
    // a limb whose run would leave the ground the tree may hang over turns about; one that still would is not grown
    const kept = (sx, sz) => !o.keep || [0.3, 0.68, 1].every((t) => o.keep(fx + sx * R * t, fz + sz * R * t));
    const turn = kept(dx, dz) ? 1 : kept(-dx, -dz) ? -1 : 0, bx0 = dx * turn, bz0 = dz * turn;
    if (!turn) continue;
    L.tube(o.limb.map(([t, k, rad]) => [fx + bx0 * R * t, g + h - 0.4 + rise * k, fz + bz0 * R * t, r * rad, 5, 0]), o.boughSides, o.bark, 0, 0);
    for (let i = 0, ns = aim ? Math.round(o.sprays * 1.5) : o.sprays; i < ns; i++) {
      const t = rng.range(0.3, 1.12), k = t < 0.28 ? 0.6 : t < 0.55 ? lerp(0.6, 0.85, (t - 0.28) / 0.27) : lerp(0.85, 1, Math.min(1, (t - 0.55) / 0.45));
      const side = rng.range(-1, 1) * (1 + 2.6 * t), drop = rng.range(-0.6, 1) + 2.6 * rng() * rng(), sz = o.spray * rng.range(0.75, 1.2), tilt = rng.chance(0.6) ? rng.range(0.1, 0.4) : rng.range(0.5, 1.0);
      spray(fx + bx0 * R * t - bz0 * side, g + h - 0.4 + rise * k - drop, fz + bz0 * R * t + bx0 * side, sz, tilt, lerp(1, 0.72, clamp(drop / 3, 0, 1)), 6 + 8 * t);
    }
  }
  // the roof: larger sprays, nearly level, over the whole crown at the height of the limbs' ends
  for (let i = 0; i < o.roof; i++) {
    const a = rng.range(0, TAU), d = o.reach * Math.sqrt(rng()) * 0.95, y = g + o.top * rng.range(0.9, 1.06);
    spray(fx + Math.cos(a) * d, y, fz + Math.sin(a) * d, o.spray * rng.range(1.3, 1.7), rng.range(0.03, 0.3), 1.08, 12);
  }
  // the lowest layer: smaller sprays round the stem from the fork's height, in the crown's own shade
  for (let i = 0; i < o.under; i++) {
    const a = rng.range(0, TAU), d = rng.range(1.5, 0.75 * o.reach);
    spray(fx + Math.cos(a) * d, g + h + rng.range(0, 4), fz + Math.sin(a) * d, o.spray * rng.range(0.6, 0.85), rng.range(0.1, 0.6), 0.7, 5);
  }
}

// a clump of fern at (x, z): fronds that rise from one crown, arch over and hang at the tip. Each is a strip bent along
// its way at three or four places, so every part of it meets the light at its own angle
function fern(L, rng, x, z, g, size) {
  const nf = 5 + Math.floor(rng() * 3), a0 = rng.range(0, TAU), bends = size > 1 ? 4 : 3, P = [];
  for (let i = 0; i < nf; i++) {
    const az = a0 + i / nf * TAU + rng.range(-0.5, 0.5), len = size * rng.range(0.75, 1.25), up = rng.range(0.85, 1.3), droop = rng.range(1.3, 1.9), tone = rng.range(0.75, 1.2), dx = Math.cos(az), dz = Math.sin(az);
    P.length = 0;
    for (let j = 0, px = 0, py = -0.05; j < bends; j++) {
      const e = up - droop * j / (bends - 1), e2 = up - droop * (j + 0.5) / (bends - 1), step = len / (bends - 1);
      P.push([x + dx * px, g + py, z + dz * px, -Math.sin(e) * dx, Math.cos(e), -Math.sin(e) * dz, j / (bends - 1)]);
      px += Math.cos(e2) * step; py += Math.sin(e2) * step;
    }
    L.ribbon(P, -dz * len * 0.2, dx * len * 0.2, [0.12 * tone, 0.26 * tone, 0.06 * tone], 2, 2.5);
  }
}

// the beeches' one material: smooth grey-green bark with faint level rings, pale lichen and moss at the foot; sprays of
// small leaves that let the sun through when seen from below; bracken fronds
function makeBeechMaterial(U) {
  return new THREE.ShaderMaterial({
    uniforms: U, fog: false, side: THREE.DoubleSide, vertexColors: true,
    vertexShader: ESTATE_GLSL + /* glsl */`
      attribute vec4 aData; varying vec3 vW, vN, vC; varying vec4 vD;
      void main(){
        vec4 wp = modelMatrix * vec4(position, 1.);
        float leafy = step(.5, aData.z), frond = step(1.5, aData.z);
        wp.xyz += esSway(wp.xyz, aData.w * mix(1., aData.y, frond)) * leafy;
        wp.y += leafy * (1. - frond) * .05 * sin(uTime * 2.3 + wp.x * 1.7 + wp.z * 1.3);
        vW = wp.xyz; vN = normalize(mat3(modelMatrix) * normal); vC = color; vD = aData;
        gl_Position = projectionMatrix * viewMatrix * wp;
      }`,
    fragmentShader: ESTATE_GLSL + BANK_GLSL + /* glsl */`
      varying vec3 vW, vN, vC; varying vec4 vD;
      void main(){
        vec3 n = normalize(vN), v = normalize(cameraPosition - vW), c; vec4 pl = esPlace(vW);
        float dist = length(vW - cameraPosition);
        if (vD.z < .5) {
          vec2 bq = vec2(vD.x * 6.2, vD.y);
          float rings = smoothstep(.55, .75, esN(vec2(bq.x * .35, vD.y * 5.5 + esN(bq * .8) * 2.)));
          float blot = esF(bq * .55 + 3.);
          // smooth grey bark: fine rings round the stem, rain-dark streaks down it, pale lichen in blots; the foot dark
          // with moss to a man's height; and the stem's own form (a round thing darkens toward its edges)
          float streak = esN(vec2(bq.x * 2.3, vD.y * .22 + 7.));
          vec3 alb = vC * (.86 + .2 * esN(bq * 3.)) * (1. - .16 * rings) * mix(.74, 1.06, smoothstep(.25, .7, streak));
          alb = mix(alb, vec3(.5, .56, .44), smoothstep(.52, .7, blot) * .3);
          alb = mix(alb, vec3(.1, .18, .06) * (.7 + .6 * esN(bq * 6.)), (1. - smoothstep(.4, 2.6, vD.y + (blot - .5) * 1.6)) * .85);
          if (!gl_FrontFacing) n = -n;
          c = esLight(alb, n, vW, mix(.5, 1., smoothstep(0., 2.5, vD.y)), .25) * mix(.5, 1., pow(clamp(dot(n, v), 0., 1.), .7));
        } else if (vD.z < 1.5) {
          // a spray: an uneven outline, leaves in clumps with gaps between. Close to, its leaves are drawn one by one, in
          // two layers; far off, the clumps alone. Both let the same share of the sky through: 0.376 of a card is leaf
          // either way. Counted by a mirror of this law in node over 12,000 cards of the sizes the build deals (1.8 to
          // 5.6 m): 0.452 of a card lies within its outline and its clumps; close to, 0.83 of that is leaf of one layer
          // or the other, 0.376 of the card; far off the clumps are cut again at .414, which leaves 0.375 (at the .42
          // that stood here: 0.371). Only the grain changes with the distance
          // (size: the card's half size in metres, carried by its kind; its clumps and leaves keep their own size by it)
          vec2 q = vD.xy * 2. - 1.; float seed = vC.g * 61., size = (vD.z - 1.) * 16.;
          float rim = .64 + .36 * esN(vec2(atan(q.y, q.x + 1e-5) * 2.4 + seed, seed));
          float clump = esN(vD.xy * (1.5 * size) + seed);
          vec4 lc = esCell(vD.xy * (6.8 * size) + seed), lc2 = esCell(vD.xy * (6.8 * size) + seed + vec2(5.37, 9.13));
          float ang = lc.z * 6.2832, ca = cos(ang), sa = sin(ang), ang2 = lc2.z * 6.2832, ca2 = cos(ang2), sa2 = sin(ang2);
          vec2 lq = vec2(lc.x * ca + lc.y * sa, -lc.x * sa + lc.y * ca) / vec2(.62, .4), lq2 = vec2(lc2.x * ca2 + lc2.y * sa2, -lc2.x * sa2 + lc2.y * ca2) / vec2(.62, .4);
          float upper = step(dot(lq, lq), 1.) * step(.1, lc.z), under = step(dot(lq2, lq2), 1.) * step(.1, lc2.z) * (1. - upper);
          float leaf = upper + under, fineK = 1. - smoothstep(22., 55., dist);
          if (length(q) > rim || clump < .3 || mix(step(.414, clump), leaf, fineK) < .5) discard;
          lq = mix(lq, lq2, under); lc.z = mix(lc.z, lc2.z, under);
          vec3 alb = vC * (.8 + .4 * lc.z) * mix(1., (.78 + .3 * smoothstep(0., .6, lq.x * lq.x)) * (1. - .2 * under), fineK);
          if (n.y < 0.) n = -n;
          // A spray seen from below shows its underside, which takes the wood's shade alone and stands dark; where the
          // sun reaches its upper side (at a gap of the vault, or in the roof where the cover thins) the light comes
          // through its leaves green-gold. Seen from above it is lit as any leaf is.
          float below = step(dot(n, v), 0.), sunUp = clamp(dot(n, uSunDir) * .6 + .4, 0., 1.) * esSun(vW, pl);
          vec3 shade = esFill(mix(n, -n, below), pl) * (.6 + .4 * esCloudShade(vW)) + esPortal(vW, n);
          c = alb * (shade + uSunCol * mix(vec3(1.), vec3(1.4, 1.5, .6), below) * sunUp) * .3183;
        } else {
          float axd = abs(vD.x - .5) * 2., w = (1. - vD.y) * .95 + .03, pinna = .3 + .7 * smoothstep(.1, .55, abs(fract(vD.y * 19.) - .5) * 2.);
          if (axd > w * pinna) discard;
          vec3 alb = mix(vC * (.8 + .4 * esN(vW.xz * 5.)), vec3(.22, .2, .08), 1. - smoothstep(.02, .07, axd));
          if (n.y < 0.) n = -n;
          c = esLight(alb, n, vW, .55 + .45 * vD.y, .5);
          c += uSunCol * alb * vec3(.9, 1., .4) * (clamp(-dot(n, v), 0., 1.) * .1 * esSun(vW, pl));
        }
        gl_FragColor = vec4(esFog(c, vW), 1.);
      }`,
  });
}

// ---------------------------------------------------------------- the wood: the avenue of great trunks, the trees behind, ferns
async function buildWood(S) {
  const { ctx, scene, R, Lo, M, density, U } = S, Tb = Lo.tables, ra = S.ra;
  await flora.prepareLeafTexture({}, ctx.yield, 12);
  const floraMat = makeFloraMaterial(U, flora.makeLeafTexture({}));
  const wood = new THREE.Group(), cells = await deepCells(S); scene.add(wood);
  // kit trees stand round the lawn, behind the banks and on the valley's tops (plain oaks on bare columns, low-crowned
  // oaks at the wood's edge), kit ferns by the valley's stream, dark bushes among the trunks; the wood of the drive is
  // our own beeches (below)
  const pal = [{ leaf: '#3f7a2c', bark: '#6e5c4a' }, { leaf: '#4a8a30', leafLight: '#7fb84a', bark: '#8a8880', barkDark: '#5a5a54' }, { leaf: '#37702a', bark: '#66564a' }];
  const geoms = [];
  for (let i = 0; i < 3; i++) { geoms.push(onColumn(flora.oakGeometry({ rng: R.crowns, height: 16.5 + i * 1.5, detail: 0, ...pal[i] }), 8.5 + i * 0.5, 3, 0.95, 1.5, R.crowns)); await ctx.yield(); }
  for (let i = 0; i < 2; i++) geoms.push(flora.fernGeometry({ rng: R.ferns, size: 1.25, detail: 1, leaf: '#4a9a3c' }));
  for (let i = 0; i < 2; i++) geoms.push(flora.bushGeometry({ rng: R.ferns, size: 2.2, detail: 0, leaf: '#3f7a34', leafDark: '#24502a' }));
  await ctx.yield();
  for (let i = 0; i < 2; i++) { geoms.push(flora.oakGeometry({ rng: R.crowns, height: 17 + i * 2.5, detail: 0, fullness: 1.25, ...pal[i * 2] })); await ctx.yield(); }
  const pts = [], clearOf = (x, z, pad) => S.gaps.every((g) => Math.hypot(x - g.x, z - g.z) > g.r + pad);
  const tintOf = (r) => { const k = r.range(0.82, 1.08); return [k * r.range(0.92, 1.06), k, k * r.range(0.9, 1.05)]; };
  const beside = (m, side, off) => {
    const k = Tb.B + Math.round(m), k2 = Math.min(k + 2, Tb.n - 1), tx = Tb.X[k2] - Tb.X[k], tz = Tb.Z[k2] - Tb.Z[k], tl = Math.hypot(tx, tz) || 1;
    return [Tb.X[k] + (tz / tl) * side * off, Tb.Z[k] - (tx / tl) * side * off, (tz / tl) * side, -(tx / tl) * side];
  };
  // the beeches are built in lots of 50 m of the drive, of 100 m behind the entry (one mesh to a lot)
  const lots = [], lotOf = (m) => { const i = m < 0 ? clamp(Math.floor((m + BEHIND) / 100), 0, 3) : 4 + Math.floor(m / 50); return lots[i] || (lots[i] = makeLot()); };
  // Behind the entry's plane nothing of any tree, at any height, stands or hangs nearer the entry frame's axis than
  // 4.6 m and 15 m more in every 340 m back (the lane the camera of the opening before ours may stand in)
  const BARK = [0.4, 0.375, 0.37], LEAF = [0.13, 0.3, 0.065];
  // (lane: how far a place lies outside that lane, measured on the level; nothing where it lies inside. A stem's and a
  // limb's places are asked as points; a spray's card is asked BY ITS EXTENT, with its own reach: its furthest corner
  // (1.281 of its half size, the card being 0.8 as deep as it is wide) and the 0.45 m its sway can carry it, so no
  // part of a card hangs into the lane at any height. The glades are kept open by a card's middle, as before: they
  // are the canopy's own gaps and no lane)
  const lane = (x, z) => { const d = x - PLACE.entry[0], a = Math.abs(z - PLACE.entry[1]); return d > 0 ? a - 4.6 - 15 * d / 340 : Math.hypot(d, Math.max(a - 4.6, 0)); };
  const open = (x, z, reach = 0) => clearOf(x, z, 0.5) && lane(x, z) >= reach;
  // THE VAULT: great beeches either side of the drive behind its kept verge and lesser ones beyond them into the wood's
  // depth (their places: vaultTrunks, in the parts; their forms here, on a stream of their own). Each great one leans a
  // little its own way, forks 8.5 to 12 m up and sends limbs arching to 21 to 27 m; one limb goes over the drive, past
  // its middle, to meet the far side's. Behind the entry no limb is sent over the lane.
  const trunks = vaultTrunks(Lo, M, S.gaps, R['vault-places'], R['vault-depth'], density), VF = R['vault-forms'];
  for (let i = 0, work = 0; i < trunks.length; i++) {
    const t = trunks[i], far = t.m < -40, tone = VF.range(0.88, 1.1), g = Lo.ground(t.x, t.z), bark = BARK.map((c) => c * tone);
    if (t.great) beech(lotOf(t.m), VF, t.x, t.z, g, { r: t.r, lean: VF.range(0.01, 0.045), fork: VF.range(8.5, 12), top: VF.range(21, 27), reach: t.m < 0 ? VF.range(7, 9) : Math.hypot(t.x - Tb.X[Tb.B + Math.round(t.m)], t.z - Tb.Z[Tb.B + Math.round(t.m)]) + VF.range(0.5, 2.5),
      toward: t.m < 0 ? null : [t.nx, t.nz], boughs: far ? 3 : 4 + Math.floor(VF() * 2), boughSides: far ? 4 : 5, sides: far ? 6 : 10, sprays: far ? 5 : 8, roof: far ? 8 : 20, under: far ? 2 : 6, spray: 3, limb: far ? LIMB_FAR : LIMB, bark, leaf: LEAF, keep: open });
    // (beyond the avenue: lesser trees; from 35 m off the line, and behind the entry, plainer ones)
    else { const plain = t.m < 0 || t.d > 35; beech(lotOf(t.m), VF, t.x, t.z, g, { r: t.r, lean: VF.range(0.01, 0.06), fork: VF.range(8, 11.5), top: VF.range(19, 25), reach: VF.range(5, 7.5),
      boughs: (plain ? 1 : 2) + Math.floor(VF() * 2), boughSides: 4, sides: plain ? 5 : 6, sprays: plain ? 3 : 5, roof: plain ? 6 : 10, under: plain ? 2 : 4, spray: 3.3, limb: LIMB_FAR, bark, leaf: LEAF, keep: open }); }
    // (asked by the work done: a great beech is about four lesser ones)
    if ((work += trunks[i].great ? 4 : 1) >= 80) { work = 0; await ctx.yield(); }
  }
  // the wood behind the avenue, round the lawn and on the valley's tops: one tree to a 16 m square where the wood stands
  const CW = 16;
  for (let gz = -260, row = 0; gz < 320; gz += CW, row++) {
    for (let gx = -560; gx < 930; gx += CW) {
      const x = gx + R.forest.range(1, CW - 1), z = gz + R.forest.range(1, CW - 1), dr = R.forest(), vv = Math.floor(R.forest() * 3), sc = R.forest.range(0.8, 1.2), rot = R.forest.range(0, TAU), tint = tintOf(R.forest);
      // the wood's edge on the lawn: a second tree to the square, low-crowned, within 26 m of the open grass
      const x2 = gx + R.forest.range(1, CW - 1), z2 = gz + R.forest.range(1, CW - 1), v2 = 7 + Math.floor(R.forest() * 2), s2 = R.forest.range(0.85, 1.3), t2 = tintOf(R.forest);
      const near = (px, pz, d) => Math.max(Lo.lawnIn(px + d, pz), Lo.lawnIn(px - d, pz), Lo.lawnIn(px, pz + d), Lo.lawnIn(px, pz - d)) > 0.5;
      if (Lo.woodIn(x2, z2) > 0.6 && near(x2, z2, 26)) pts.push({ x: x2, y: Lo.ground(x2, z2) - 0.25, z: z2, s: s2, rot, v: v2, c: 8 + Math.floor((x2 + 560) / 320) + 10 * Math.floor((z2 + 260) / 320), tint: t2 });
      if (Lo.woodIn(x, z) < 0.5) continue;
      Lo.routeAt(x, z, ra);
      let keep = 0;
      if (x > PLACE.entry[0]) { const d = x - PLACE.entry[0], a = Math.abs(z - PLACE.entry[1]); keep = a > 8.5 + 15 * d / 340 && a < 56 ? 0.35 : 0; }
      else if (ra[0] < 71) keep = ra[0] > 13.5 ? lerp(1, 0.4, smoothstep(25, 70, ra[0])) : 0;
      else {
        const v = Lo.toValley(x, z);
        keep = near(x, z, 48) ? 1 : v[0] > -30 && v[0] < 300 && Math.abs(v[1]) < 125 ? 0.6 : 0;
      }
      // (the wood of the drive itself, and behind the entry, is beech: see the stems below)
      if (x > PLACE.entry[0] || (ra[0] < 71 && ra[1] < M.east - 8) || cells.at(x, z)) continue;
      if (dr >= keep * density || !clearOf(x, z, 2)) continue;
      pts.push({ x, y: Lo.ground(x, z) - 0.25, z, s: sc, rot, v: vv, c: 8 + Math.floor((x + 560) / 320) + 10 * Math.floor((z + 260) / 320), tint });
    }
    if (row % 6 === 5) await ctx.yield();
  }
  // ferns from 4.2 m off the drive's middle line (outside the kept verge's worn part), dark bushes among the trunks from 10 m
  for (let m = -40, made = 0; m < M.east - 2; m += 0.8) {
    const side = R.ferns.chance(0.5) ? 1 : -1, r1 = R.ferns(), bushy = R.ferns.chance(0.11), sc = R.ferns.range(0.8, 1.5), vv = Math.floor(R.ferns() * 2);
    const off = bushy ? 10 + 22 * r1 : 4.2 + 12.3 * Math.pow(r1, 1.6), q = beside(m, side, off);
    if (!clearOf(q[0], q[1], bushy ? 2.5 : -2)) continue;
    if (bushy) pts.push({ x: q[0], y: Lo.ground(q[0], q[1]) - 0.05, z: q[1], s: sc, rot: R.ferns.range(0, TAU), v: 5 + vv, c: Math.floor((m + 40) / 120), tint: tintOf(R.ferns) });
    else fern(lotOf(m), R.fronds, q[0], q[1], Lo.ground(q[0], q[1]), (vv ? 1.45 : 0.75) * sc);
    if (++made % 150 === 0) await ctx.yield();
  }
  // LOW FERN WHERE THE LIGHT LANDS (a stream of its own, 'floor-ferns': no other draw is moved). Along the wood's
  // drive, from 2 m in to 16 m short of the cut's mouth, a place is tried every quarter metre, to one side or the
  // other, 5.3 to 17.3 m off the drive's middle: on the ferny bank nine in twenty are kept anywhere and all in a pool
  // of light; elsewhere only in and about the pools (half of them; one in five in the flowers' stretch). The fronds
  // are 0.4 to 1.13 m long and rise under 0.6 m; none reaches nearer the drive's middle than 4.2 m
  for (let m = 2, made = 0, rf = R['floor-ferns']; m < M.east - 16; m += 0.25) {
    const side = rf.chance(0.5) ? 1 : -1, r1 = rf(), r2 = rf(), sc = rf.range(0.55, 0.9), q = beside(m, side, 5.3 + 12 * Math.pow(r1, 1.4)), g = Lo.ground(q[0], q[1]);
    const about = aboutGap(q[0], g, q[1], S.sunDir), stretch = stretchAt(q[0], q[1]), ferny = smoothstep(0.25, 0.55, stretch), flowery = smoothstep(0.25, 0.55, -stretch);
    if (r2 >= ferny * (0.45 + 0.55 * about) + (1 - ferny) * about * (0.5 - 0.3 * flowery) || !clearOf(q[0], q[1], -2)) continue;
    fern(lotOf(m), rf, q[0], q[1], g, sc);
    if (++made % 40 === 0) await ctx.yield();
  }
  await ctx.yield();
  const beechMat = makeBeechMaterial(U);
  for (const lot of lots) if (lot && lot.count()) { wood.add(lot.mesh(beechMat)); if (wood.children.length % 3 === 0) await ctx.yield(); }
  plantSet(floraMat, geoms, pts, wood);
  await ctx.yield();
  const deep = await buildDeepWood(S, wood, cells);
  return buildHouse({ ...S, floraMat, geoms, wood, deepWood: deep });
}

// the depth of the wood beyond the trees that are built: a dark leafy wall that stands 24 m and more inside the wood's
// edge and 58 m and more from the route's line, so that no sky shows under the leaves at the far end of a look
// Where it stands (16 m cells): in the wood, 24 m and more inside its edge and 58 m and more from the route's line; and
// close behind the cut's two banks (from 26 m off the line, between 6 m inside the east mouth and 30 m short of the
// west mouth), so that the cut is a way through the wood's dark and nothing is seen round the banks' backs.
async function deepCells(S) {
  const { ctx, Lo, M } = S, C = 16, X0 = -576, Z0 = -272, NX = 95, NZ = 38, deep = new Uint8Array(NX * NZ), ra = [0, 0, 0];
  const inWood = (x, z) => Lo.woodIn(x, z) > 0.5;
  for (let j = 0; j < NZ; j++) {
    for (let i = 0; i < NX; i++) {
      const x = X0 + (i + 0.5) * C, z = Z0 + (j + 0.5) * C;
      Lo.routeAt(x, z, ra);
      if (ra[1] > M.east + 6 && ra[1] < M.west - 30 && ra[0] >= 34 && ra[0] < 71) { deep[j * NX + i] = 1; continue; }
      if (!inWood(x, z) || !inWood(x + 24, z) || !inWood(x - 24, z) || !inWood(x, z + 24) || !inWood(x, z - 24)) continue;
      if (x > PLACE.entry[0] ? Math.abs(z - PLACE.entry[1]) < 62 : Lo.routeDist(x, z) < 58) continue;
      deep[j * NX + i] = 1;
    }
    if (j % 16 === 15) await ctx.yield();
  }
  const at = (x, z) => { const i = Math.floor((x - X0) / C), j = Math.floor((z - Z0) / C); return i >= 0 && j >= 0 && i < NX && j < NZ && deep[j * NX + i] === 1; };
  return { deep, C, X0, Z0, NX, NZ, at };
}

async function buildDeepWood(S, group, cells) {
  const { Lo, U } = S, { deep, C, X0, Z0, NX, NZ } = cells;
  const pos = [], nor = [], uv = [], idx = [], isDeep = (i, j) => i < 0 || j < 0 || i >= NX || j >= NZ || deep[j * NX + i];
  // a corner of the cells, and which way the wall leans back there: toward the deep cells about that corner, the same
  // for every face that meets at it (so the leaning faces stay joined at the corners: no slit of sky between them)
  const corner = (i, j) => {
    const x = X0 + i * C, z = Z0 + j * C; let sx = 0, sz = 0;
    for (const [di, dj] of [[-1, -1], [0, -1], [-1, 0], [0, 0]]) if (isDeep(i + di, j + dj)) { sx += di ? -1 : 1; sz += dj ? -1 : 1; }
    return [x + 5 * (Lo.noise.n2(x * 0.07, z * 0.07) - 0.5), z + 5 * (Lo.noise.n2(x * 0.07 + 40, z * 0.07) - 0.5), Math.sign(sx), Math.sign(sz)];
  };
  const face = (a, b, nx, nz) => {
    const base = pos.length / 3;
    for (const q of [a, b]) {
      const g = Lo.ground(q[0], q[1]), top = 23;
      for (const h of [-1, top * 0.5, top]) { pos.push(q[0] + q[2] * h * 0.12, g + h, q[1] + q[3] * h * 0.12); nor.push(nx, 0.2, nz); uv.push((q[0] + q[1]) * 1, h); }
    }
    idx.push(base, base + 3, base + 1, base + 1, base + 3, base + 4, base + 1, base + 4, base + 2, base + 2, base + 4, base + 5);
  };
  for (let j = 0; j < NZ; j++) for (let i = 0; i < NX; i++) {
    if (!deep[j * NX + i]) continue;
    if (!isDeep(i + 1, j)) face(corner(i + 1, j), corner(i + 1, j + 1), 1, 0);
    if (!isDeep(i - 1, j)) face(corner(i, j + 1), corner(i, j), -1, 0);
    if (!isDeep(i, j + 1)) face(corner(i + 1, j + 1), corner(i, j + 1), 0, 1);
    if (!isDeep(i, j - 1)) face(corner(i, j), corner(i + 1, j), 0, -1);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setAttribute('aUv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx);
  const mat = new THREE.ShaderMaterial({
    uniforms: U, fog: false, side: THREE.DoubleSide,
    vertexShader: /* glsl */`attribute vec2 aUv; varying vec3 vW, vN; varying vec2 vQ;
      void main(){ vec4 wp = modelMatrix * vec4(position, 1.); vW = wp.xyz; vN = normal; vQ = aUv; gl_Position = projectionMatrix * viewMatrix * wp; }`,
    fragmentShader: ESTATE_GLSL + /* glsl */`
      varying vec3 vW, vN; varying vec2 vQ;
      // the wall ends upward in crowns: round heads of differing height side by side, in two ranks
      float crownTop(float u, float w, float k){ float f = fract(u / w) - .5; return (4. + 5.5 * esH(vec2(floor(u / w), k))) * sqrt(max(0., 1. - 4. * f * f)); }
      // one rank of stems along the wall: a stem in most of its places (w apart, each a little off its place), so many metres from its middle to its edge
      float rank(float u, float w, float wide, float k){ float c = floor(u / w), f = (fract(u / w) - .5 + (esH(vec2(c, k)) - .5) * .5) * w; return (1. - smoothstep(wide * .6, wide, abs(f))) * step(.22, esH(vec2(c, k + 5.))); }
      void main(){
        vec2 q = vec2(vW.x + vW.z, vW.y);
        float leafy = esF(q * .22 + 3.) * .6 + esN(q * 1.7) * .4;
        float topLine = 12.5 + max(crownTop(vQ.x, 9., 3.), crownTop(vQ.x + 4.1, 6.5, 8.));
        if (vQ.y > topLine + (esN(q * 1.3) - .5) * 1.6) discard;
        // what stands behind the avenue: stems receding into a green haze. Three ranks of them, each further rank closer
        // set, thinner and paler into the haze (the haze lies lightest over the floor); leaves close over them from 7 m up
        vec3 haze = mix(vec3(.14, .23, .1), vec3(.05, .095, .04), smoothstep(0., 9., vQ.y));
        float up = 1. - smoothstep(6., 11., vQ.y + (leafy - .5) * 4.);
        vec3 alb = mix(haze, mix(haze, vec3(.3, .33, .26), .3), rank(vQ.x + .6, 2.3, .13, 3.));
        alb = mix(alb, mix(haze, vec3(.3, .33, .26), .6), rank(vQ.x + 1.7, 3.4, .2, 2.));
        alb = mix(alb, vec3(.33, .36, .28) * (.75 + .5 * esN(vec2(vQ.x * 3., vQ.y * .4))), rank(vQ.x, 5.2, .3, 1.));
        alb = mix(mix(vec3(.03, .06, .025), vec3(.11, .2, .06), smoothstep(.3, .75, leafy)), alb, up);
        alb = mix(alb, vec3(.15, .28, .08) * (.7 + .6 * leafy), smoothstep(topLine - 7., topLine - 1., vQ.y) * .7) * .62;
        vec3 n = normalize(vN + vec3(0., leafy - .5, 0.));
        gl_FragColor = vec4(esFog(esLight(alb, n, vW, .55 + .45 * smoothstep(2., 14., vQ.y), .6), vW), 1.);
      }`,
  });
  const mesh = new THREE.Mesh(g, mat); group.add(mesh);
  return { mesh, mat, cells };
}

// ---------------------------------------------------------------- the house
// A builder of plain masonry in the house's own frame: u along its length (east end to west end), w out of its south
// front, y up from the lawn. Each vertex carries where it is on its own face: [metres along, metres up, kind, face length];
// kinds: 0 a wall with rows of windows, 1 a gable's front, 2 plain stone, 3 slates, 4 paving, 5 a wall with a door.
function makeMasonry(P) {
  const hc = P.houseCentre, ax = P.houseAxis, fr = P.houseFront, gy = P.groundLawn;
  const pos = [], nor = [], surf = [], idx = [];
  const W = (u, y, w) => [hc[0] + ax[0] * u + fr[0] * w, gy + y, hc[1] + ax[1] * u + fr[1] * w];
  const N = (nu, ny, nw) => { const l = Math.hypot(nu, ny, nw) || 1; return [(ax[0] * nu + fr[0] * nw) / l, ny / l, (ax[1] * nu + fr[1] * nw) / l]; };
  const quad = (pts, n, uvs, kind, span) => {
    const base = pos.length / 3, nn = N(n[0], n[1], n[2]);
    pts.forEach((q, i) => { const w = W(q[0], q[1], q[2]); pos.push(w[0], w[1], w[2]); nor.push(nn[0], nn[1], nn[2]); surf.push(uvs[i][0], uvs[i][1], kind, span); });
    idx.push(base, base + 1, base + 2);
    if (pts.length === 4) idx.push(base, base + 2, base + 3);
  };
  const M = {
    W, quad,
    // an upright wall from (u0, w0) to (u1, w1); its outward side is on the left of that way
    wall(u0, w0, u1, w1, y0, y1, kind) {
      const len = Math.hypot(u1 - u0, w1 - w0);
      quad([[u0, y0, w0], [u1, y0, w1], [u1, y1, w1], [u0, y1, w0]], [-(w1 - w0), 0, u1 - u0], [[0, y0], [len, y0], [len, y1], [0, y1]], kind, len);
    },
    box(u0, u1, w0, w1, y0, y1, kind, top = 2) {
      M.wall(u0, w1, u1, w1, y0, y1, kind); M.wall(u1, w1, u1, w0, y0, y1, kind); M.wall(u1, w0, u0, w0, y0, y1, kind); M.wall(u0, w0, u0, w1, y0, y1, kind);
      quad([[u0, y1, w0], [u1, y1, w0], [u1, y1, w1], [u0, y1, w1]], [0, 1, 0], [[u0, w0], [u1, w0], [u1, w1], [u0, w1]], top, u1 - u0);
    },
    // a pitched roof over a rectangle, its ridge along u (alongU) or along w, with the two gable triangles in wall stone
    roof(u0, u1, w0, w1, yE, yR, alongU, over = 0.45, gableKind = 2) {
      if (alongU) {
        const wm = (w0 + w1) / 2, sl = Math.hypot(wm - w0 + over, yR - yE), a = u0 - over, b = u1 + over, dy = (yR - yE) * over / (wm - w0);
        quad([[a, yE - dy, w1 + over], [b, yE - dy, w1 + over], [b, yR, wm], [a, yR, wm]], [0, wm - w0, yR - yE], [[a, 0], [b, 0], [b, sl], [a, sl]], 3, b - a);
        quad([[b, yE - dy, w0 - over], [a, yE - dy, w0 - over], [a, yR, wm], [b, yR, wm]], [0, wm - w0, -(yR - yE)], [[b, 0], [a, 0], [a, sl], [b, sl]], 3, b - a);
        quad([[u0, yE, w0], [u0, yE, w1], [u0, yR, wm]], [-1, 0, 0], [[0, yE], [w1 - w0, yE], [(w1 - w0) / 2, yR]], gableKind, w1 - w0);
        quad([[u1, yE, w1], [u1, yE, w0], [u1, yR, wm]], [1, 0, 0], [[0, yE], [w1 - w0, yE], [(w1 - w0) / 2, yR]], gableKind, w1 - w0);
      } else {
        const um = (u0 + u1) / 2, sl = Math.hypot(um - u0 + over, yR - yE), a = w0 - over, b = w1 + over, dy = (yR - yE) * over / (um - u0);
        quad([[u1 + over, yE - dy, a], [u1 + over, yE - dy, b], [um, yR, b], [um, yR, a]], [yR - yE, um - u0, 0], [[a, 0], [b, 0], [b, sl], [a, sl]], 3, b - a);
        quad([[u0 - over, yE - dy, b], [u0 - over, yE - dy, a], [um, yR, a], [um, yR, b]], [-(yR - yE), um - u0, 0], [[b, 0], [a, 0], [a, sl], [b, sl]], 3, b - a);
        quad([[u0, yE, w1], [u1, yE, w1], [um, yR, w1]], [0, 0, 1], [[0, yE], [u1 - u0, yE], [(u1 - u0) / 2, yR]], gableKind, u1 - u0);
        quad([[u1, yE, w0], [u0, yE, w0], [um, yR, w0]], [0, 0, -1], [[0, yE], [u1 - u0, yE], [(u1 - u0) / 2, yR]], gableKind, u1 - u0);
      }
    },
    geometry() {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setAttribute('aSurf', new THREE.Float32BufferAttribute(surf, 4));
      g.setIndex(idx);
      return g;
    },
  };
  return M;
}

// the long grey house: a main range 86 m by 16 m with five gabled bays on its south front, two wings behind, eight chimney
// stacks, a terrace before it with a balustrade and steps down to the lawn, a porch on its east end
function houseMasonry(P) {
  const M = makeMasonry(P), L = P.houseLength / 2, D = P.houseDepth / 2, T0 = 1.6, EAVE = 10, RIDGE = 15, GP = 1.6, GW = 4.5;
  const bays = [-34, -17, 0, 17, 34];
  // plinth under the house (the terrace's level), then the main range's walls between the gabled bays
  M.box(-L - 0.3, L + 0.3, -D - 0.3, D + 0.3, -0.5, T0, 2);
  let u = -L;
  for (const c of bays) { M.wall(u, D, c - GW, D, T0, EAVE, 0); u = c + GW; }
  M.wall(u, D, L, D, T0, EAVE, 0);
  M.wall(L, D, L, -D, T0, EAVE, 0); M.wall(L, -D, -L, -D, T0, EAVE, 0); M.wall(-L, -D, -L, D, T0, EAVE, 5);
  M.roof(-L, L, -D, D, EAVE, RIDGE, true, 0.45, 0);
  // the five gabled bays: they stand 1.6 m proud of the front and their roofs run back into the main roof
  for (const c of bays) {
    M.wall(c - GW, D, c - GW, D + GP, T0, EAVE, 2); M.wall(c + GW, D + GP, c + GW, D, T0, EAVE, 2);
    M.wall(c - GW, D + GP, c + GW, D + GP, T0, EAVE, 1);
    M.roof(c - GW, c + GW, 0.5, D + GP, EAVE, 17, false, 0.4, 1);
  }
  // two wings behind, 22 m long
  for (const c of [-27, 27]) { M.wall(c + 5, -D, c + 5, -D - 22, T0, EAVE - 1, 0); M.wall(c + 5, -D - 22, c - 5, -D - 22, T0, EAVE - 1, 0); M.wall(c - 5, -D - 22, c - 5, -D, T0, EAVE - 1, 0); M.roof(c - 5, c + 5, -D - 22, -1, EAVE - 1, 14, false, 0.4, 0); }
  return M;
}

// the terrace, its balustrade and steps, the chimney stacks, the porch; returns where the two smoking stacks' tops are
// and where the balustrade's piers stand (u along the front, w out from the house's middle line; their tops T0 + 1.16)
function houseDressings(M, P, rng) {
  const L = P.houseLength / 2, D = P.houseDepth / 2, T0 = 1.6, TW = D + 12, smoke = [], piers = [];
  M.box(-L - 3, L + 3, D + 0.3, TW, -0.5, T0, 2, 4);
  for (let k = 1; k <= 5; k++) M.box(-4, 4, TW, TW + 0.55 * k, -0.5, T0 - 0.27 * k, 2, 4);
  // balustrade: a plinth, a rail, square balusters every 0.42 m, a pier every 8 to 9 m and at every end
  const run = (u0, w0, u1, w1) => {
    const len = Math.hypot(u1 - u0, w1 - w0), du = (u1 - u0) / len, dw = (w1 - w0) / len, alongU = Math.abs(du) > 0.5;
    const bx = (a, b, half, y0, y1, top) => { const ua = u0 + du * a, ub = u0 + du * b, wa = w0 + dw * a, wb = w0 + dw * b;
      if (alongU) M.box(Math.min(ua, ub), Math.max(ua, ub), wa - half, wa + half, y0, y1, 2, top); else M.box(ua - half, ua + half, Math.min(wa, wb), Math.max(wa, wb), y0, y1, 2, top); };
    bx(0, len, 0.17, T0, T0 + 0.18, 2); bx(0, len, 0.19, T0 + 0.86, T0 + 1.0, 2);
    const np = Math.max(1, Math.round(len / 8.5));
    for (let i = 0; i <= np; i++) { const a = len * i / np; bx(a - 0.27, a + 0.27, 0.27, T0, T0 + 1.16, 2); if (alongU) piers.push([u0 + du * a, w0 + dw * a, T0 + 1.16]); }
    for (let a = 0.42; a < len - 0.2; a += 0.42) { const near = Math.abs((a / (len / np)) - Math.round(a / (len / np))) * (len / np) < 0.4; if (!near) bx(a - 0.07, a + 0.07, 0.07, T0 + 0.18, T0 + 0.86, 2); }
  };
  run(-L - 2.7, TW - 0.3, -4.4, TW - 0.3); run(4.4, TW - 0.3, L + 2.7, TW - 0.3);
  run(-L - 2.7, D + 0.6, -L - 2.7, TW - 0.3); run(L + 2.7, D + 0.6, L + 2.7, TW - 0.3);
  // eight chimney stacks just behind the main ridge, to about 21 m; two of them smoke
  const at = [-39, -28.5, -19.5, -8.5, 8.5, 19.5, 28.5, 39], smoking = [1 + Math.floor(rng() * 2), 4 + Math.floor(rng() * 3)];
  at.forEach((u0, i) => {
    const u = u0 + rng.range(-0.8, 0.8), top = rng.range(19.4, 20.3), hw = rng.range(0.95, 1.25);
    M.box(u - hw, u + hw, -2.3, -0.9, 12.6, top, 2); M.box(u - hw - 0.14, u + hw + 0.14, -2.44, -0.76, top, top + 0.3, 2);
    for (const k of [-0.5, 0.5]) M.box(u + k * hw - 0.2, u + k * hw + 0.2, -1.8, -1.4, top + 0.3, top + 0.95, 2);
    if (smoking.includes(i)) smoke.push(M.W(u + 0.5 * hw, top + 1.0, -1.6));
  });
  // the porch on the east end, where the gravel sweep comes in
  M.wall(-L - 3.2, -2.6, -L - 3.2, 2.6, 0, 4.6, 5); M.wall(-L, -2.6, -L - 3.2, -2.6, 0, 4.6, 2); M.wall(-L - 3.2, 2.6, -L, 2.6, 0, 4.6, 2);
  M.roof(-L - 3.2, -L + 1, -2.6, 2.6, 4.6, 6.6, true, 0.3, 5);
  return { smoke, piers };
}

// grey ashlar, slates, paving and the mullioned windows, all drawn from each face's own metres
function makeHouseMaterial(U) {
  const v3 = (hex) => ({ value: new THREE.Vector3(...lin(hex)) });
  // the house shades itself by its faces' own turn from the sun (the place map's coarse shade would lie on its walls)
  const open = new THREE.DataTexture(new Uint8Array([0, 0, 0, 0]), 1, 1, THREE.RGBAFormat);
  open.needsUpdate = true;
  return new THREE.ShaderMaterial({
    uniforms: { ...U, tPlace: { value: open }, uStone: v3('#bdb39e'), uSlate: v3('#5a6472'), uDoor: v3('#33261a') }, fog: false, side: THREE.DoubleSide,
    vertexShader: /* glsl */`attribute vec4 aSurf; varying vec3 vW, vN; varying vec4 vS;
      void main(){ vec4 wp = modelMatrix * vec4(position, 1.); vW = wp.xyz; vN = normal; vS = aSurf; gl_Position = projectionMatrix * viewMatrix * wp; }`,
    fragmentShader: ESTATE_GLSL + BANK_GLSL + /* glsl */`
      uniform vec3 uStone, uSlate, uDoor;
      varying vec3 vW, vN; varying vec4 vS;
      vec3 esAshlar(vec2 uv){
        float row = floor(uv.y / .36);
        vec2 b = vec2(uv.x / .92 + .5 * mod(row, 2.) + esH(vec2(row, 1.)) * .3, uv.y / .36), f = fract(b);
        float joint = smoothstep(0., .04, f.x) * (1. - smoothstep(.96, 1., f.x)) * smoothstep(0., .1, f.y) * (1. - smoothstep(.9, 1., f.y));
        return uStone * (.8 + .34 * esH(floor(b))) * mix(.7, 1., joint);
      }
      // a mullioned window, q measured from the middle of its sill: x its glass, y its stone, z which light
      vec3 esWin(vec2 q, float hw, float h, float n){
        float inX = 1. - smoothstep(hw - .02, hw + .02, abs(q.x)), inY = smoothstep(-.02, .02, q.y) * (1. - smoothstep(h - .02, h + .02, q.y));
        float outX = 1. - smoothstep(hw + .2, hw + .24, abs(q.x)), outY = smoothstep(-.22, -.18, q.y) * (1. - smoothstep(h + .26, h + .3, q.y));
        float lw = 2. * hw / n, lx = mod(q.x + hw, lw) - lw * .5;
        float bar = max(smoothstep(lw * .5 - .08, lw * .5 - .055, abs(lx)), 1. - smoothstep(.05, .075, abs(q.y - h * .66)));
        float inside = inX * inY;
        return vec3(inside * (1. - bar), max(outX * outY - inside, inside * bar), floor((q.x + hw) / lw));
      }
      void main(){
        vec3 n = normalize(vN);
        float kind = floor(vS.z + .5), a = vS.x, h = vS.y, span = vS.w, ao = 1., lx = a - span * .5, wn = 0.;
        vec3 v = normalize(cameraPosition - vW), alb, w = vec3(0.);
        if (kind > 2.5 && kind < 3.5) {
          float row = floor(h / .3);
          vec2 b = vec2(a / .26 + .5 * mod(row, 2.), h / .3), f = fract(b);
          alb = uSlate * (.78 + .4 * esH(floor(b))) * mix(.62, 1., smoothstep(0., .08, f.x) * smoothstep(0., .14, f.y));
          // lichen on the slates: ochre in patches, grey-white in spots
          alb = mix(alb, vec3(.42, .4, .2), smoothstep(.5, .8, esF(vW.xz * .35 + 5.)) * .5);
          alb = mix(alb, vec3(.56, .58, .5), smoothstep(.6, .8, esF(vW.xz * 1.1 + 11.)) * .35);
        } else if (kind > 3.5 && kind < 4.5) {
          vec2 b = vec2(a, h) / 1.1;
          b.x += .5 * mod(floor(b.y), 2.);
          vec2 f = fract(b);
          alb = uStone * 1.05 * (.86 + .2 * esH(floor(b))) * mix(.72, 1., smoothstep(0., .03, f.x) * smoothstep(0., .03, f.y));
        } else {
          alb = esAshlar(vec2(a, h));
          alb *= mix(1., .78, smoothstep(.45, .8, esF(vec2(a * .7, h * .12) + 2.)));
          alb = mix(alb, vec3(.5, .47, .3), smoothstep(.5, .8, esF(vec2(a, h) * .4 + 9.)) * .3 * (1. - smoothstep(1., 6., h)));
          ao = mix(.7, 1., smoothstep(0., 1.2, h));
          if (kind < .5) {
            float bay = 3.4, nw = max(1., floor((span - 1.2) / bay)), x = a - span * .5 + (nw - 1.) * .5 * bay;
            wn = clamp(floor(x / bay + .5), 0., nw - 1.);
            lx = x - wn * bay;
            w = esWin(vec2(lx, h - 2.7), 1., 2.8, 3.) + esWin(vec2(lx, h - 6.6), 1., 2.4, 3.);
            ao *= mix(.72, 1., smoothstep(0., 1.3, 10. - h));
          } else if (kind < 1.5) {
            w = esWin(vec2(lx, h - 2.5), 1.7, 3.1, 5.) + esWin(vec2(lx, h - 6.5), 1.7, 2.6, 5.) + esWin(vec2(lx, h - 11.6), .7, 1.7, 2.);
          } else if (kind > 4.5) {
            float arch = 2.3 + sqrt(max(0., .9 - lx * lx));
            float door = (1. - smoothstep(.93, .96, abs(lx))) * (1. - smoothstep(arch - .02, arch + .02, h));
            alb = mix(alb, uStone * 1.1, (1. - smoothstep(1.2, 1.24, abs(lx))) * (1. - smoothstep(arch + .28, arch + .32, h)));
            alb = mix(alb, uDoor * (.8 + .4 * esN(vec2(lx * 9., h * .7))) * (.75 + .25 * smoothstep(.0, .03, abs(fract(lx / .31) - .5))), door);
          }
          alb = mix(alb, uStone * 1.12, clamp(w.y, 0., 1.));
          // creeper and climbing roses on the walls that carry windows: they climb from the foot in patches of unlike
          // height along the house's length, keep off the glass and thin over the windows' stone
          if (kind < 1.5) {
            float cu = dot(vW.xz, vec2(-.865, .502)), reach = 1.5 + 9.5 * smoothstep(.42, .78, esF(vec2(cu * .055, 9.)));
            float cm = (1. - smoothstep(reach - 2., reach, h + (esF(vec2(cu, h) * .9) - .5) * 3.)) * smoothstep(.42, .56, esF(vec2(cu * .16, h * .16 + 4.)) + .22 * (1. - h / 12.));
            cm *= (1. - clamp(w.x, 0., 1.)) * (1. - .7 * clamp(w.y, 0., 1.));
            vec4 lfc = esCell(vec2(cu, h) / .3);
            vec3 leafC = mix(vec3(.035, .085, .03), vec3(.11, .2, .065), lfc.z) * mix(.55, 1., smoothstep(0., .14, lfc.w));
            vec4 rs = esCell(vec2(cu, h) / .8 + 7.);
            float rose = (1. - smoothstep(.12, .2, length(rs.xy))) * step(.62, rs.z) * (1. - smoothstep(5., 8.5, h));
            leafC = mix(leafC, mix(vec3(.95, .9, .74), vec3(.94, .68, .72), step(.8, rs.z)), rose);
            alb = mix(alb, leafC, cm);
            ao *= mix(1., .86, cm);
          }
        }
        vec3 c = esLight(alb, n, vW, ao, 0.);
        // GLASS, in leaded lights: behind it the dark of the room, and in some lights a blind half drawn, which stands in
        // the room's shade (a dim cloth seen through the glass, never a lit patch); on it the sky, mirrored by the angle
        // of sight (little of it seen square on, most of it along the wall); over all of it the leading; and the sun's
        // flash only in the quarries that throw it at the eye (each quarry of a leaded light lies a little its own way)
        float gl = clamp(w.x, 0., 1.);
        if (gl > .001) {
          vec4 pl = esPlace(vW);
          vec2 qa = vec2((lx + h) / .19, (lx - h) / .19), tip = esH2(floor(qa) + wn * 17.) - .5;
          vec3 nq = normalize(n + vec3(tip.x, tip.y, -tip.x) * .05), r = reflect(-v, nq);
          float fres = .1 + .7 * pow(1. - clamp(dot(n, v), 0., 1.), 3.);
          float hb = esH(vec2(wn * 3.1 + floor(h / 4.) * 7.3 + w.z, floor(span * 3.)));
          float top = h < 6. ? 5.5 : 9.;
          vec3 room = mix(vec3(.02, .024, .03), vec3(.62, .58, .48) * (uSkyCol + uSunCol * .25) * .035, step(.6, hb) * smoothstep(top - 2.6 * hb, top - 2.6 * hb + .04, h));
          vec3 g = mix(room, mix(uGndCol, uSkyCol, smoothstep(-.1, .3, r.y)) * .45, fres);
          float lead = max(smoothstep(.4, .5, abs(fract(qa.x) - .5)), smoothstep(.4, .5, abs(fract(qa.y) - .5)));
          g *= 1. - .55 * lead;
          g += uSunCol * (.5 * pow(clamp(dot(r, uSunDir), 0., 1.), 500.) * esSun(vW, pl));
          c = mix(c, g, gl);
        }
        gl_FragColor = vec4(esFog(c, vW), 1.);
      }`,
  });
}

async function buildHouse(S) {
  const { ctx, scene, R, U, PM } = S, P = PLACE, M = houseMasonry(P), { smoke, piers } = houseDressings(M, P, R.house);
  const L = P.houseLength / 2, D = P.houseDepth / 2;
  const house = new THREE.Mesh(M.geometry(), makeHouseMaterial(U)); scene.add(house);
  // what the house keeps the sun from: its roofs' heights go into the place map (main range, gabled bays, wings)
  for (let u = -L; u <= L; u += 2) {
    for (let w = -D; w <= D + 1.6; w += 2) { const q = M.W(u, 0, w); PM.raise(q[0], q[2], P.groundLawn + 10 + 5 * (1 - Math.min(1, Math.abs(w) / D)), 1.5); }
  }
  for (const c of [-27, 27]) for (let w = -D - 22; w < -D; w += 2) for (let u = c - 5; u <= c + 5; u += 2.5) { const q = M.W(u, 0, w); PM.raise(q[0], q[2], P.groundLawn + 9 + 5 * (1 - Math.abs(u - c) / 5), 1.5); }
  await ctx.yield();
  return buildLawn({ ...S, house, smoke, piers, masonry: M, plain: makePlainMaterial(U) });
}

// ---------------------------------------------------------------- the lawn's standing things: three cedars, the rose garden
async function buildLawn(S) {
  const { ctx, scene, R, Lo, PM, floraMat } = S, P = PLACE, group = new THREE.Group();
  scene.add(group);
  // three cedars, 22 to 26 m: broad flat tiers on a bare stem. Each is dealt inside a ground of the open lawn, all three
  // on the side of the line away from the house and the sea (to the left of the way): (1) beside the way in, between
  // the cut's west mouth and the turn for the front; (2) before the front, along the house's own length; (3) beside
  // the level run past the house's seaward end. In its ground a cedar stands 26 to 46 m from the route's line (its
  // tiers reach 14 m: 12 m of air and more), on lawn that is neither the fall to the sea nor the valley's flowered
  // hollow, 30 m and more from the house's terrace and 50 m and more from another cedar; a draw that fails is dealt
  // again (twelve times at most, then that cedar is left out). The places are dealt by the stream 'cedar-places', the forms by 'cedar-shapes'.
  const Tb = Lo.tables, rc = R['cedar-places'], L = P.houseLength / 2, TWc = P.houseDepth / 2 + 12, cg = [], cp = [], cedars = [];
  const leftOf = (m, off) => { const k = Tb.B + Math.round(m), tx = Tb.X[k + 2] - Tb.X[k], tz = Tb.Z[k + 2] - Tb.Z[k], tl = Math.hypot(tx, tz) || 1; return [Tb.X[k] + tz / tl * off, Tb.Z[k] - tx / tl * off]; };
  const cedarOk = (x, z) => {
    const v = Lo.toValley(x, z), hu = (x - P.houseCentre[0]) * P.houseAxis[0] + (z - P.houseCentre[1]) * P.houseAxis[1], hw = (x - P.houseCentre[0]) * P.houseFront[0] + (z - P.houseCentre[1]) * P.houseFront[1];
    const fromHouse = Math.hypot(Math.max(0, Math.abs(hu) - L - 3), Math.max(0, Math.abs(hw) - TWc));
    return Lo.lawnIn(x, z) > 0.9 && Lo.seaFall(v[0], v[1]) < 0.02 && v[0] < Lo.headS - 12 && Lo.routeDist(x, z) >= 26 && fromHouse >= 30 && cedars.every((c) => Math.hypot(c[0] - x, c[1] - z) >= 50);
  };
  for (const [m0, m1] of [[S.M.west, S.M.turn], [S.M.onFront, S.M.houseW], [S.M.houseW, S.M.holdEnd]]) {
    for (let tries = 0; tries < 12; tries++) {
      const q = leftOf(rc.range(m0, m1), rc.range(26, 46));
      if (cedarOk(q[0], q[1])) { cedars.push(q); break; }
    }
  }
  for (let i = 0; i < cedars.length; i++) {
    const c = cedars[i], x = c[0], z = c[1], h = R['cedar-shapes'].range(22, 26), g = Lo.ground(x, z);
    cg.push(flora.pineGeometry({ rng: R['cedar-shapes'], height: h, detail: 2, leaf: '#2a5a48', leafLight: '#4f8a66', leafDark: '#173a30', bark: '#6a5a50' }));
    cp.push({ x, y: g - 0.2, z, s: 1.5, sy: 1, rot: R['cedar-shapes'].range(0, TAU), v: i, c: 0 });
    PM.dome(x, z, 14, g + h, g + h * 0.5);
    await ctx.yield();
  }
  plantSet(floraMat, cg, cp, group);
  await ctx.yield();
  // the rose garden east of the house: a clipped hedge 1.5 m high round 40 m by 30 m, four beds of cream and shell-pink roses
  const gc = [-35, -100], ha = P.houseAxis, hf = P.houseFront;
  const at = (a, b) => [gc[0] + ha[0] * a + hf[0] * b, gc[1] + ha[1] * a + hf[1] * b];
  // (the hedge is clipped box in the lawn's own plain material, as the yew is: set out in the house's frame)
  const HG = makeShapes(Lo, P, S.lawnShade), hu = (gc[0] - P.houseCentre[0]) * ha[0] + (gc[1] - P.houseCentre[1]) * ha[1], hw = (gc[0] - P.houseCentre[0]) * hf[0] + (gc[1] - P.houseCentre[1]) * hf[1];
  const hedge = (a0, a1, b0, b1) => HG.hedge(hu + a0, hu + a1, hw + b0, hw + b1, 1.5, [0.1, 0.2, 0.09], [[0, 0], [0.08, 0.72], [0.3, 1]]);
  for (const sg of [-1, 1]) { hedge(-20, -2, sg * 15 - 0.5, sg * 15 + 0.5); hedge(2, 20, sg * 15 - 0.5, sg * 15 + 0.5); hedge(sg * 20 - 0.5, sg * 20 + 0.5, -15, -2); hedge(sg * 20 - 0.5, sg * 20 + 0.5, 2, 15); }
  group.add(HG.mesh(S.plain));
  const rg = ['#f3e6c8', '#f2c4c0'].map((c) => flora.bushGeometry({ rng: R.roses, size: 1.25, detail: 0, flowers: 0.9, flowerColor: c, leaf: '#2f6a30' })), rp = [];
  for (let a = -17.5; a <= 17.5; a += 2.9) for (let b = -12.5; b <= 12.5; b += 2.9) {
    const ja = R.roses.range(-0.5, 0.5), jb = R.roses.range(-0.5, 0.5), v = R.roses.chance(0.5) ? 0 : 1, sc = R.roses.range(0.8, 1.15), rot = R.roses.range(0, TAU);
    if (Math.abs(a + ja) < 2 || Math.abs(b + jb) < 2) continue;
    const q = at(a + ja, b + jb);
    rp.push({ x: q[0], y: Lo.ground(q[0], q[1]) - 0.05, z: q[1], s: sc, rot, v, c: 0 });
  }
  plantSet(floraMat, rg, rp, group);
  await ctx.yield();
  await lawnDressing(S, group);
  await ctx.yield();
  return buildValley({ ...S, lawn: group });
}

// the garden before the front, laid from the house's own measures: a border of flowers along the terrace's foot, urns on
// the balustrade's piers, clipped yew (a long hedge beyond the line with a gap on the steps' axis, cones at its ends, at
// the steps' foot and at the terrace's corners), a sundial on the steps' axis
async function lawnDressing(S, group) {
  const { ctx, R, Lo, PM, floraMat, plain, piers } = S, P = PLACE, L = P.houseLength / 2, TW = P.houseDepth / 2 + 12, FD = P.frontDistance;
  const G = makeShapes(Lo, P, S.lawnShade), YEW = [0.085, 0.16, 0.085], BOXW = [0.12, 0.24, 0.09], STONE = [0.5, 0.48, 0.42];
  const cone = (u, w, k) => { G.turned(u, w, [[1.05 * k, 0], [1.1 * k, 0.5 * k], [0.82 * k, 1.6 * k], [0.42 * k, 2.7 * k], [0.02, 3.5 * k]], 10, YEW); const q = G.at(u, w); PM.raise(q[0], q[1], P.groundLawn + 3 * k, 1); };
  // the yew hedge, 1.9 m high and 1.5 m thick, 15 m beyond the line, its sides battered and its top's edges clipped;
  // a block clipped to a blunt point (3 m) every 11 m along it
  const hw0 = FD + 15, hw1 = FD + 16.5;
  for (const sg of [-1, 1]) {
    const a = 7 * sg, b = (L - 2) * sg;
    G.hedge(Math.min(a, b), Math.max(a, b), hw0, hw1, 1.9, YEW);
    for (let u = 12.5; u < L - 3; u += 11) G.hedge(u * sg - 0.9, u * sg + 0.9, hw0 - 0.25, hw1 + 0.25, 3, YEW, [[0, 0], [0.1, 0.62], [0.82, 1]]);
    G.hedge(Math.min(b, b + 1.5 * sg), Math.max(b, b + 1.5 * sg), hw0 - 6, hw0, 1.9, YEW);
    for (let u = 7; u <= L - 2; u += 2) { const q = G.at(u * sg, hw0 + 0.75); PM.raise(q[0], q[1], P.groundLawn + 1.9, 1); }
    cone(7 * sg, hw0 + 0.75, 1.1); cone(5.9 * sg, TW + 4.2, 0.9); cone((L + 5.2) * sg, TW + 1.6, 1);
  }
  // clipped yew cones in pairs along the way in, every 14 m from the cut's west mouth to the turn for the front, 7.5 m
  // either side of the line
  const Tb = Lo.tables;
  for (let m = S.M.west + 20; m < S.M.turn - 4; m += 14) {
    const k = Tb.B + Math.round(m), tx = Tb.X[k + 2] - Tb.X[k], tz = Tb.Z[k + 2] - Tb.Z[k], tl = Math.hypot(tx, tz);
    for (const sg of [-1, 1]) {
      const x = Tb.X[k] + tz / tl * sg * 7.5 - P.houseCentre[0], z = Tb.Z[k] - tx / tl * sg * 7.5 - P.houseCentre[1];
      cone(x * P.houseAxis[0] + z * P.houseAxis[1], x * P.houseFront[0] + z * P.houseFront[1], 0.85);
    }
  }
  // the sundial: two steps, a turned shaft, a plate and its gnomon
  const sd = FD + 10.5;
  G.turned(0, sd, [[1.0, 0], [1.0, 0.14], [0.72, 0.14], [0.72, 0.28], [0.24, 0.3], [0.17, 0.52], [0.2, 0.98], [0.36, 1.04], [0.36, 1.1], [0.01, 1.1]], 12, STONE);
  G.box(-0.03, 0.03, sd - 0.26, sd + 0.2, 0.28, [0.2, 0.24, 0.2], 1.08);
  // an urn on every pier of the balustrade, a clipped ball of box in each
  const seen = new Set();
  for (const pr of piers) {
    const key = Math.round(pr[0] * 4) + ':' + Math.round(pr[1] * 4); if (seen.has(key)) continue; seen.add(key);
    G.turned(pr[0], pr[1], [[0.17, 0], [0.11, 0.1], [0.12, 0.2], [0.3, 0.42], [0.33, 0.58], [0.27, 0.62], [0.01, 0.62]], 8, STONE, pr[2]);
    G.turned(pr[0], pr[1], [[0.2, 0.56], [0.33, 0.72], [0.34, 0.92], [0.2, 1.1], [0.01, 1.14]], 8, BOXW, pr[2]);
  }
  group.add(G.mesh(plain));
  await ctx.yield();
  // the border: two staggered rows of flowering plants along the terrace's foot, either side of the steps
  const bg = ['#6f74d8', '#f4f1e6', '#f0b4c8'].map((c) => flora.bushGeometry({ rng: R.border, size: 1, detail: 0, flowers: 3, flowerColor: c, leaf: '#3a7434' })), bp = [];
  for (const [w, shift] of [[TW + 0.9, 0], [TW + 2.0, 0.6]]) for (let u = -L - 3 + shift; u <= L + 3; u += 1.6) {
    const ju = R.border.range(-0.3, 0.3), jw = R.border.range(-0.25, 0.25), v = Math.floor(R.border() * 3), sc = R.border.range(0.55, 1) * (shift ? 0.8 : 1.1), rot = R.border.range(0, TAU);
    if (Math.abs(u + ju) < 5.3) continue;
    const q = G.at(u + ju, w + jw);
    bp.push({ x: q[0], y: Lo.ground(q[0], q[1]) - 0.05, z: q[1], s: sc, rot, v, c: 0 });
  }
  plantSet(floraMat, bg, bp, group);
  await ctx.yield();
  // THE FLOWER BORDERS: along both edges of the drive from the cut's west mouth to the turn for the front (0.9 m outside
  // the gravel), and before the shrubs at the terrace's foot: bunches of four clumps (blue, white, pink, yellow), one
  // every 1.25 m, each on its bed of dug earth; dealt from a stream of their own
  const rf = R['flower-border'], cl = [['#6f74d8', -0.5, 0.12, 0.95], ['#f4f1e6', -0.15, -0.2, 0.6], ['#ee8fb4', 0.2, 0.16, 0.75], ['#f0c23a', 0.52, -0.12, 0.5]];
  const fg = [0, 1].map(() => joinGeoms(cl.map(([c, dx, dz, h]) => [flora.flowerGeometry({ rng: rf, color: c, cards: 2, width: 0.8, height: h, root: '#2c5a26' }), dx + rf.range(-0.08, 0.08), dz + rf.range(-0.08, 0.08)]))), fp = [];
  const bunch = (x, z, rot) => { fp.push({ x, y: Lo.ground(x, z) - 0.03, z, s: rf.range(0.9, 1.2), rot: rot + (rf.chance(0.5) ? Math.PI : 0), v: rf.chance(0.5) ? 0 : 1, c: 0 }); S.lawnShade.bed(x, z, 0.75); };
  for (let m = S.M.west + 10; m < S.M.turn - 2; m += 1.25) {
    const k = Tb.B + Math.round(m), tx = Tb.X[k + 2] - Tb.X[k], tz = Tb.Z[k + 2] - Tb.Z[k], tl = Math.hypot(tx, tz);
    for (const sg of [-1, 1]) { const off = sg * (3.4 + rf.range(-0.12, 0.12)); bunch(Tb.X[k] + tz / tl * off, Tb.Z[k] - tx / tl * off, Math.atan2(-tz, tx)); }
  }
  await ctx.yield();
  // (the border goes on along both edges of the gravel's sweep from the turn to the forecourt before the porch)
  for (let k = 0, d = 0, sw = Lo.sweep; k < sw.length - 1; k++) {
    const tx = sw[k + 1][0] - sw[k][0], tz = sw[k + 1][1] - sw[k][1], tl = Math.hypot(tx, tz);
    for (; d < tl; d += 1.25) for (const sg of [-1, 1]) {
      const off = sg * (3.4 + rf.range(-0.12, 0.12)), x = sw[k][0] + tx / tl * d + tz / tl * off, z = sw[k][1] + tz / tl * d - tx / tl * off;
      if (Math.hypot(x - Lo.forecourt[0], z - Lo.forecourt[1]) > Lo.forecourt[2] + 3 && Lo.drive(x, z, S.da)[0] > 3.2 && Lo.routeDist(x, z) > 3.2) bunch(x, z, Math.atan2(-tz, tx));
    }
    d -= tl;
  }
  for (let u = -L - 3; u <= L + 3; u += 1.25) { if (Math.abs(u) < 5.6) continue; const q = G.at(u + rf.range(-0.15, 0.15), TW + 3.1 + rf.range(-0.12, 0.12)); bunch(q[0], q[1], Math.atan2(-P.houseAxis[1], P.houseAxis[0])); }
  for (const b of bp) S.lawnShade.bed(b.x, b.z, 0.8);
  await ctx.yield();
  // island beds cut in the turf, each 9 m by 3.4 m and set with the same bunches: one either side of the way in half
  // way between every second pair of cones (14 m off the line, lying along it), and four before the front between the
  // line and the yew hedge (8 m beyond the line), a pair either side of the steps' axis
  const island = (x, z, ax, az) => {
    for (let a = -3.6; a <= 3.61; a += 1.2) for (const b of [-0.75, 0.75]) { const ja = a + rf.range(-0.25, 0.25), jb = b + rf.range(-0.2, 0.2); bunch(x + ax * ja - az * jb, z + az * ja + ax * jb, Math.atan2(-az, ax)); }
    for (let a = -3.2; a <= 3.21; a += 0.8) S.lawnShade.bed(x + ax * a, z + az * a, 1.7);
  };
  for (let m = S.M.west + 27; m < S.M.turn - 12; m += 28) {
    const k = Tb.B + Math.round(m), tx = Tb.X[k + 2] - Tb.X[k], tz = Tb.Z[k + 2] - Tb.Z[k], tl = Math.hypot(tx, tz);
    for (const sg of [-1, 1]) island(Tb.X[k] + tz / tl * sg * 14, Tb.Z[k] - tx / tl * sg * 14, tx / tl, tz / tl);
  }
  for (const u of [-31, -15, 15, 31]) { const q = G.at(u, FD + 8); island(q[0], q[1], P.houseAxis[0], P.houseAxis[1]); }
  // and beside the level run past the house's seaward end, on its seaward side (12 m off the line, every 20 m), where
  // that is level lawn still (not the fall to the sea, and 6 m and more short of the valley's head)
  for (let m = S.M.houseW + 12; m < S.M.holdEnd; m += 20) {
    const k = Tb.B + Math.round(m), tx = Tb.X[k + 2] - Tb.X[k], tz = Tb.Z[k + 2] - Tb.Z[k], tl = Math.hypot(tx, tz), x = Tb.X[k] - tz / tl * 12, z = Tb.Z[k] + tx / tl * 12, v = Lo.toValley(x, z);
    if (Lo.lawnIn(x, z) > 0.9 && Lo.seaFall(v[0], v[1]) < 0.02 && v[0] < Lo.headS - 6) island(x, z, tx / tl, tz / tl);
  }
  await ctx.yield();
  plantSet(floraMat, fg, fp, group);
  await ctx.yield();
  S.lawnShade.bake();
}

// THE GARDEN'S OWN FINE SHADE: a small map over the lawn before and beside the house (0.5 m a cell) that the ground
// reads. r = the shadow each clipped yew, hedge and turned stone throws by this visit's sun (as long as the sun is low,
// to five times the thing's height), g = the shade close under it at every hour. Every such thing that stands on the
// lawn is written here by the same call that builds it (makeShapes), so none stands on the grass without its shadow.
function makeLawnShade(sunDir) {
  const X0 = -215, Z0 = -140, C = 0.5, W = 520, H = 360, data = new Uint8Array(W * H * 4), tex = new THREE.DataTexture(data, W, H, THREE.RGBAFormat);
  tex.magFilter = tex.minFilter = THREE.LinearFilter; tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping; tex.generateMipmaps = false;
  const hl = Math.hypot(sunDir.x, sunDir.z) || 1, cot = Math.min(hl / Math.max(sunDir.y, 0.05), 5), dx = -sunDir.x / hl * cot, dz = -sunDir.z / hl * cot;
  const put = (i, j, ch, v) => { if (i > 0 && j > 0 && i < W - 1 && j < H - 1) { const k = (j * W + i) * 4 + ch; if (v > data[k]) data[k] = v; } };
  const span = (x0, z0, x1, z1, fn) => {
    for (let j = Math.floor((z0 - Z0) / C); j <= Math.ceil((z1 - Z0) / C); j++) for (let i = Math.floor((x0 - X0) / C); i <= Math.ceil((x1 - X0) / C); i++) fn(X0 + (i + 0.5) * C, Z0 + (j + 0.5) * C, i, j);
  };
  return {
    tex, box: [X0, Z0, 1 / (W * C), 1 / (H * C)],
    // a round thing (a cone, a turned stone): its foot at (x, z), r wide at its foot, h high, tapering to its top
    round(x, z, r, h) {
      const tx = dx * h, tz = dz * h, tl = tx * tx + tz * tz || 1, m = r + 1.6;
      span(Math.min(x, x + tx) - m, Math.min(z, z + tz) - m, Math.max(x, x + tx) + m, Math.max(z, z + tz) + m, (px, pz, i, j) => {
        const t = clamp(((px - x) * tx + (pz - z) * tz) / tl, 0, 1), d = Math.hypot(px - x - tx * t, pz - z - tz * t) - r * (1 - t), d0 = Math.hypot(px - x, pz - z) - r;
        put(i, j, 0, 255 * clamp(0.5 - d / C, 0, 1)); put(i, j, 1, 255 * clamp(1 - d0 / 1.3, 0, 1));
      });
    },
    // a straight-sided thing (a hedge, a block): its four corners in order, h high
    block(q, h) {
      const a = Math.hypot(q[1][0] - q[0][0], q[1][1] - q[0][1]), b = Math.hypot(q[3][0] - q[0][0], q[3][1] - q[0][1]), e1 = [(q[1][0] - q[0][0]) / a, (q[1][1] - q[0][1]) / a], e2 = [(q[3][0] - q[0][0]) / b, (q[3][1] - q[0][1]) / b];
      const tx = dx * h, tz = dz * h, ds = tx * e1[0] + tz * e1[1], dt = tx * e2[0] + tz * e2[1], xs = q.flatMap((c) => [c[0], c[0] + tx]), zs = q.flatMap((c) => [c[1], c[1] + tz]);
      // (a place lies in the shadow when some point of the way from it toward the sun, within the shadow's length, lies in the thing's plan)
      const part = (v, len, d) => (Math.abs(d) < 1e-6 ? (v >= 0 && v <= len ? [0, 1] : [1, 0]) : d > 0 ? [(v - len) / d, v / d] : [v / d, (v - len) / d]);
      span(Math.min(...xs) - 1.6, Math.min(...zs) - 1.6, Math.max(...xs) + 1.6, Math.max(...zs) + 1.6, (px, pz, i, j) => {
        const u = (px - q[0][0]) * e1[0] + (pz - q[0][1]) * e1[1], w = (px - q[0][0]) * e2[0] + (pz - q[0][1]) * e2[1], A = part(u, a, ds), B = part(w, b, dt);
        if (Math.max(A[0], B[0], 0) <= Math.min(A[1], B[1], 1)) put(i, j, 0, 255);
        put(i, j, 1, 255 * clamp(1 - Math.hypot(Math.max(-u, u - a, 0), Math.max(-w, w - b, 0)) / 1.3, 0, 1));
      });
    },
    // a flower bed: dug earth within r metres of (x, z)
    bed(x, z, r) { span(x - r - 1, z - r - 1, x + r + 1, z + r + 1, (px, pz, i, j) => put(i, j, 2, 255 * clamp((r - Math.hypot(px - x, pz - z)) / C + 0.5, 0, 1))); },
    // (the shadows' edges are softened over a cell and a half, once every thing is written)
    bake() {
      const src = data.slice();
      for (let j = 1; j < H - 1; j++) for (let i = 1; i < W - 1; i++) { const k = (j * W + i) * 4; let v = 0; for (let b = -1; b <= 1; b++) for (let a = -1; a <= 1; a++) v += src[k + (b * W + a) * 4]; data[k] = v / 9; }
      tex.needsUpdate = true;
    },
  };
}

// several plants' shapes as one (each moved dx, dz from the middle), so a mixed bunch is one thing to draw
function joinGeoms(parts) {
  const g = new THREE.BufferGeometry(), idx = []; let base = 0;
  for (const name of Object.keys(parts[0][0].attributes)) {
    const size = parts[0][0].attributes[name].itemSize, arr = [];
    for (const [q, dx, dz] of parts) { const a = q.attributes[name].array; for (let i = 0; i < a.length; i++) arr.push(a[i] + (name === 'position' ? (i % 3 === 0 ? dx : i % 3 === 2 ? dz : 0) : 0)); }
    g.setAttribute(name, new THREE.Float32BufferAttribute(arr, size));
  }
  for (const [q] of parts) { for (const k of q.index.array) idx.push(k + base); base += q.attributes.position.count; }
  g.setIndex(idx); g.computeBoundingBox(); g.computeBoundingSphere();
  return g;
}

// plain built shapes for the garden, in the house's own frame (u along the front from its middle, w out from the house's
// middle line): boxes and turned shapes on the ground where they stand, each with its tint
function makeShapes(Lo, P, shade) {
  const pos = [], nor = [], col = [], idx = [], hc = P.houseCentre, ax = P.houseAxis, fr = P.houseFront;
  const at = (u, w) => [hc[0] + ax[0] * u + fr[0] * w, hc[1] + ax[1] * u + fr[1] * w];
  const put = (x, y, z, nx, ny, nz, c) => { pos.push(x, y, z); nor.push(nx, ny, nz); col.push(c[0], c[1], c[2]); };
  return {
    at,
    // a box from the ground (or from y0 over the lawn's level when given) up to its height, its top a little rounded by its normals
    box(u0, u1, w0, w1, h, c, y0) {
      const q = [at(u0, w0), at(u1, w0), at(u1, w1), at(u0, w1)], n = [[0, -1], [1, 0], [0, 1], [-1, 0]];
      const foot = (r) => (y0 === undefined ? Lo.ground(r[0], r[1]) - 0.1 : P.groundLawn + y0);
      if (y0 === undefined && shade) shade.block(q, h);
      for (let k = 0; k < 4; k++) {
        const a = q[k], b = q[(k + 1) % 4], base = pos.length / 3, nx = ax[0] * n[k][0] + fr[0] * n[k][1], nz = ax[1] * n[k][0] + fr[1] * n[k][1];
        put(a[0], foot(a), a[1], nx, 0.15, nz, c); put(b[0], foot(b), b[1], nx, 0.15, nz, c); put(b[0], foot(b) + h, b[1], nx, 0.4, nz, c); put(a[0], foot(a) + h, a[1], nx, 0.4, nz, c);
        idx.push(base, base + 2, base + 1, base, base + 3, base + 2);
      }
      const base = pos.length / 3;
      for (const r of q) put(r[0], foot(r) + h, r[1], 0, 1, 0, c);
      idx.push(base, base + 2, base + 1, base, base + 3, base + 2);
    },
    // a clipped hedge or block: straight-sided in plan, its sides battered in and its top's edges clipped off (rings:
    // [metres in from the plan's edge, share of the height], from the foot up), flat on top
    hedge(u0, u1, w0, w1, h, c, rings = [[0, 0], [0.14, 0.7], [0.42, 1]]) {
      const n = [[0, -1], [1, 0], [0, 1], [-1, 0]], ring = rings.map(([inset, k]) => [[u0 + inset, w0 + inset], [u1 - inset, w0 + inset], [u1 - inset, w1 - inset], [u0 + inset, w1 - inset]].map((r) => { const q = at(r[0], r[1]); return [q[0], q[1], k * h]; }));
      const g = ring[0].map((r) => Lo.ground(r[0], r[1]) - 0.1);
      if (shade) shade.block(ring[0], h);
      for (let r = 0; r < rings.length - 1; r++) for (let k = 0; k < 4; k++) {
        const a = ring[r][k], b = ring[r][(k + 1) % 4], a2 = ring[r + 1][k], b2 = ring[r + 1][(k + 1) % 4], base = pos.length / 3;
        const run = rings[r + 1][0] - rings[r][0], rise = (rings[r + 1][1] - rings[r][1]) * h, l = Math.hypot(run, rise) || 1, nx = (ax[0] * n[k][0] + fr[0] * n[k][1]) * rise / l, nz = (ax[1] * n[k][0] + fr[1] * n[k][1]) * rise / l;
        put(a[0], g[k] + a[2], a[1], nx, run / l, nz, c); put(b[0], g[(k + 1) % 4] + b[2], b[1], nx, run / l, nz, c); put(b2[0], g[(k + 1) % 4] + b2[2], b2[1], nx, run / l, nz, c); put(a2[0], g[k] + a2[2], a2[1], nx, run / l, nz, c);
        idx.push(base, base + 2, base + 1, base, base + 3, base + 2);
      }
      const base = pos.length / 3, top = ring[rings.length - 1];
      top.forEach((r, k) => put(r[0], g[k] + r[2], r[1], 0, 1, 0, c));
      idx.push(base, base + 2, base + 1, base, base + 3, base + 2);
    },
    // a turned shape: prof = [[radius, height], ...] from the foot up, about an upright axis at (u, w)
    turned(u, w, prof, seg, c, y0) {
      const q = at(u, w), g = y0 === undefined ? Lo.ground(q[0], q[1]) - 0.05 : P.groundLawn + y0, base = pos.length / 3;
      if (y0 === undefined && shade) shade.round(q[0], q[1], Math.max(...prof.map((r) => r[0])), prof[prof.length - 1][1]);
      for (let r = 0; r < prof.length; r++) {
        const a0 = prof[Math.max(r - 1, 0)], a1 = prof[Math.min(r + 1, prof.length - 1)], dy = a1[1] - a0[1], dr = a1[0] - a0[0], l = Math.hypot(dy, dr) || 1;
        for (let j = 0; j <= seg; j++) { const a = j / seg * TAU; put(q[0] + Math.cos(a) * prof[r][0], g + prof[r][1], q[1] + Math.sin(a) * prof[r][0], Math.cos(a) * dy / l, -dr / l, Math.sin(a) * dy / l, c); }
      }
      for (let r = 0; r < prof.length - 1; r++) for (let j = 0; j < seg; j++) { const k = base + r * (seg + 1) + j, k2 = k + seg + 1; idx.push(k, k2, k + 1, k + 1, k2, k2 + 1); }
    },
    mesh(mat) {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.setIndex(idx);
      return new THREE.Mesh(g, mat);
    },
  };
}

// ---------------------------------------------------------------- the valley: pale azaleas in tiers up both sides, birches
async function buildValley(S) {
  const { ctx, scene, R, Lo, U, heavy, density, lead, floraMat } = S, group = new THREE.Group();
  scene.add(group);
  const AZ = { white: ['#f4f1e6', '#fff8e0'], gold: ['#f0c23a', '#f6dc7a'], salmon: ['#f09a78', '#f6bca0'], pink: ['#f2c0cc', '#f8dce2'] };
  const names = [lead].concat(Object.keys(AZ).filter((n) => n !== lead)), sets = names.map(() => [[], [], [], [], []]);
  // four tiers either side, by metres from the route's line (the right side's, then the left side's beyond the stream).
  // NO BUSH'S FOLIAGE STANDS NEARER THAN 7 m TO THE LINE (CLEAR): a bush that would is left out, never moved
  const CLEAR = 7, tiers = [{ off: [9.8, 12.8], h: [1.5, 2.2], step: 5 }, { off: [14.2, 17.8], h: [2.2, 3], step: 6.5 }, { off: [19.5, 24.7], h: [3, 4], step: 8 }, { off: [29, 34.2], h: [3.4, 4], step: 10 }];
  // (the valley's head, up the hollow from the lawn's corner to where the first azaleas stand, is laid by the same rule
  // from a stream of its own after the valley's)
  let made = 0;   // (bushes built, over all the stretches: the page is asked back after every twelve)
  const stretch = async (rz, side, t, s0, s1) => {
      for (let s = s0 + rz.range(0, t.step); s < s1; s += t.step * rz.range(0.8, 1.25) / density) {
        const h0 = rz.range(t.h[0], t.h[1]) * (heavy ? 1.08 : 1), w0 = rz.range(1.25, 1.6), a = rz.range(0, TAU), jit = rz.range(-1, 1.4), pick = rz();
        // mounds of unlike height and shape, by each bush's own number: about one in five arches 3 to 4 m, one in five lies low and wide
        const kind = (pick * 7.31) % 1, h = kind < 0.2 ? lerp(3, 4, kind / 0.2) : kind > 0.8 ? h0 * 0.55 : h0, w = h * (kind < 0.2 ? 1.05 : kind > 0.8 ? w0 * 1.5 : w0);
        const off = t.off[side > 0 ? 1 : 0] + jit, q = Lo.fromValley(s, Lo.lr(s) + side * off), len = w * 0.9, far = Lo.routeDist(q[0], q[1]);
        if (far - w * 0.5 < CLEAR || (side > 0 && off - w * 0.5 < Lo.streamAt(s) - Lo.lr(s) + 1.3)) continue;
        const bush = await buildBank({ line: [[q[0] - Math.cos(a) * len / 2, q[1] - Math.sin(a) * len / 2], [q[0] + Math.cos(a) * len / 2, q[1] + Math.sin(a) * len / 2]], side: 0, rng: S.fork((rz === R.azaleas ? 'azalea-' : 'azalea-head-') + sets.flat(2).length), heavy,
          uvOffset: sets.flat(2).length * 23, groundAt: Lo.ground, chunk: 999, cell: 0.9, rows: 12, thick: () => w, domeHalf: [len, len], domeHigh: [h, h], lean: 0, lumps: 1.2, lumpAmp: 0.3, feet: [0.15, 0.6], perM2: 1.7, leafM2: 0.25, headSize: [0.26, 0.46],
          thin: rz === R.azaleas ? R['thin-azaleas'] : R['thin-head'], lineDist: Lo.routeDist, headNear: 12, headFar: 22 }, null);
        // (a built bush reaches at most its own width from its middle: only one that near is measured, leaf by leaf; and
        // of its leaves only those further from its middle than its middle stands clear, since no other can be too near)
        let near = far;
        const slack2 = (far - CLEAR) * (far - CLEAR);
        if (far - w < CLEAR) bush.eachVertex((x, y, z) => { if (near >= CLEAR && (x - q[0]) * (x - q[0]) + (z - q[1]) * (z - q[1]) > slack2) near = Math.min(near, Lo.routeDist(x, z)); });
        if (++made % 12 === 0) await ctx.yield();
        if (near < CLEAR) continue;
        sets[pick < 0.46 ? 0 : pick < 0.64 ? 1 : pick < 0.82 ? 2 : 3][s < 0 ? 0 : 1 + Math.min(3, Math.floor(s / 52))].push(bush);
      }
  };
  for (const side of [1, -1]) for (const t of tiers) await stretch(R.azaleas, side, t, 8, 209);
  for (const side of [1, -1]) for (const t of tiers) await stretch(R['azaleas-head'], side, t, Lo.headS, 8);
  // about 36 built heads to a metre of the valley on its bushes at the most, by the same law (a common year deals 17 to 36, the heavy year up to 55)
  boundHeads(sets.flat(2).flatMap((b) => b.chunks), 36 * (209 - Lo.headS));
  const azaleas = [];
  for (let i = 0; i < names.length; i++) {
    const n = names[i], lots = sets[i].filter((l) => l.length);
    if (!lots.length) continue;
    const mats = makeBankMaterials(U, { red: AZ[n][0], rose: AZ[n][1], redGain: 0.8, through: 0.7, through2: AZ[n][1], leaf: '#3f6e34', full: 1.25, headR: 0.5, heavy, bush: true });
    const built = mats.assemble({ chunks: lots.flatMap((l) => joinBanks(l).chunks) }); group.add(built.group); azaleas.push(built);
    await ctx.yield();
  }
  await ctx.yield();
  // about sixty silver birches, 12 to 16 m. No bough of one reaches nearer than 7 m to the line: each stands off it by
  // CLEAR and its own shape's reach (the furthest of its twigs from its stem, by its size, and its lean at its top). One
  // that would stand nearer is dealt again, up to four times, from a stream of its own (so the others keep their
  // places), and is left out if it fails still; one that would stand in the stream is left out.
  const bg = [0, 1, 2].map((i) => flora.birchGeometry({ rng: R.birches, height: 12.5 + i * 1.6, detail: 1 })).concat([0, 1].map((i) => flora.birchGeometry({ rng: R.birches, height: 13 + i * 2.5, detail: 0 }))), bp = [];
  await ctx.yield();
  const reach = bg.map((g) => { const p = g.attributes.position; let r = 0, top = 0; for (let i = 0; i < p.count; i++) { r = Math.max(r, Math.hypot(p.getX(i), p.getZ(i))); top = Math.max(top, p.getY(i)); } return [r, top]; });
  const birch = (rb, s0, s1) => {
    const s = rb.range(s0, s1), side = rb.chance(0.5) ? 1 : -1, off = 7.5 + 40 * Math.pow(rb(), 1.3), vv = rb(), sc = rb.range(0.9, 1.12), rot = rb.range(0, TAU), lean = rb.range(-0.05, 0.05);
    const q = Lo.fromValley(s, Lo.lr(s) + side * off), v = off < 22 ? Math.floor(vv * 3) : 3 + Math.floor(vv * 2);
    if (Math.abs(side * off - (Lo.streamAt(s) - Lo.lr(s))) < 1.6) return null;
    if (Lo.routeDist(q[0], q[1]) < CLEAR + (reach[v][0] + Math.abs(lean) * reach[v][1]) * sc) return 0;
    return { x: q[0], y: Lo.ground(q[0], q[1]) - 0.15, z: q[1], s: sc, rot, v, c: s < 0 ? 0 : 1 + Math.min(3, Math.floor(s / 52)), lz: lean };
  };
  const birchRun = (rb, n, s0, s1) => {
    for (let i = 0; i < n; i++) {
      let b = birch(rb, s0, s1);
      for (let k = 0; b === 0 && k < 4; k++) b = birch(R['birches-again'], s0, s1);
      if (b) bp.push(b);
    }
  };
  birchRun(R.birches, Math.round(60 * density), -4, 210);
  birchRun(R['birches-head'], Math.round(9 * density), Lo.headS, -4);
  await ctx.yield();
  plantSet(floraMat, bg, bp, group);
  await ctx.yield();
  return buildWater({ ...S, valley: group, azaleas });
}

// a plain lit stuff (stone, timber, paint) for small built things; vertex colour is its tint
function makePlainMaterial(U, rock) {
  return new THREE.ShaderMaterial({
    uniforms: U, fog: false, vertexColors: true, defines: rock ? { ROCK: 1 } : {},
    vertexShader: /* glsl */`varying vec3 vW, vN, vC;
      void main(){
        vec4 p = vec4(position, 1.);
        #ifdef USE_INSTANCING
          p = instanceMatrix * p;
          vN = normalize(mat3(modelMatrix) * mat3(instanceMatrix) * normal);
        #else
          vN = normalize(mat3(modelMatrix) * normal);
        #endif
        vec4 wp = modelMatrix * p; vW = wp.xyz; vC = color; gl_Position = projectionMatrix * viewMatrix * wp;
      }`,
    fragmentShader: ESTATE_GLSL + /* glsl */`
      varying vec3 vW, vN, vC;
      void main(){
        vec3 n = normalize(vN);
        float g = esN(vW.xz * 3.1 + vW.y * 2.3) * .5 + esN(vW.xz * 11. + vW.y * 7.) * .5;
        vec3 alb = vC * (.72 + .5 * g);
        // clipped yew and box (the green tints): a grain of small leaves in world metres, lighter where the shears left
        // the young growth on top
        float clip = step(vC.r * 1.4, vC.g), lv = esN(vW.xz * 23. + vW.y * 17.) * .6 + esN(vW.xz * 47. - vW.y * 31.) * .4, lv2 = esN(vW.xz * 1.3 + vW.y * .9);
        alb *= mix(1., (.7 + .6 * lv) * (.85 + .3 * lv2) * mix(.9, 1.3, clamp(n.y, 0., 1.)), clip);
        // wet and dark where the sea reaches
        alb *= mix(vec3(.55, .6, .62), vec3(1.), smoothstep(.3, 1.6, vW.y));
        vec3 c = esLight(alb, n, vW, .6 + .4 * clamp(n.y * .5 + .5, 0., 1.), .15);
        #ifdef ROCK
          // a boulder: beds a hand or two thick with dark partings, pale lichen above the splash, dark weed at the water;
          // the light off the sea on its shaded side
          float bedY = vW.y * 1.7 + dot(vW.xz, vec2(.09, .05)) + esN(vW.xz * .3) * .8;
          alb *= mix(.55, 1., smoothstep(0., .14, abs(fract(bedY) - .5))) * mix(vec3(1.1, 1.02, .9), vec3(.88, .93, 1.), esH(vec2(floor(bedY + .5), 5.)));
          alb = mix(alb, vec3(.6, .58, .4), smoothstep(.55, .75, esF(vW.xz * .7 + vW.y * .4)) * smoothstep(1.4, 3.5, vW.y) * .5);
          alb = mix(alb, vec3(.05, .065, .04), (1. - smoothstep(.35, 1.1, vW.y + (g - .5) * .5)) * .75);
          c = esLight(alb, n, vW, .6 + .4 * clamp(n.y * .5 + .5, 0., 1.), .15);
          c += alb * (uSkyCol + uSunCol * .12) * (.14 * clamp(.6 - dot(n, uSunDir), 0., 1.));
        #endif
        gl_FragColor = vec4(esFog(c, vW), 1.);
      }`,
  });
}

// white water round the feet of the rocks that stand in the sea: a ring of foam about each, breathing with the swell
function surfRings(U, list) {
  const pos = [], dat = [], idx = [];
  list.forEach((r, i) => {
    const base = pos.length / 3, R2 = r.r * 1.9 + 1.2;
    for (const [a, b] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { pos.push(r.x + a * R2, 0.16, r.z + b * R2); dat.push(a, b, r.r / R2, i * 1.7); }
    idx.push(base, base + 2, base + 1, base, base + 3, base + 2);
  });
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aRing', new THREE.Float32BufferAttribute(dat, 4)); g.setIndex(idx);
  const mesh = new THREE.Mesh(g, new THREE.ShaderMaterial({
    uniforms: U, fog: false, transparent: true, depthWrite: false,
    vertexShader: /* glsl */`attribute vec4 aRing; varying vec4 vR; varying vec3 vW; void main(){ vR = aRing; vec4 wp = modelMatrix * vec4(position, 1.); vW = wp.xyz; gl_Position = projectionMatrix * viewMatrix * wp; }`,
    fragmentShader: ESTATE_GLSL + /* glsl */`
      varying vec4 vR; varying vec3 vW;
      void main(){
        float d = length(vR.xy), breathe = .5 + .5 * sin(uTime * .9 + vR.w);
        float band = smoothstep(vR.z * .75, vR.z, d) * (1. - smoothstep(vR.z + .12 + .3 * breathe, 1., d));
        float lace = smoothstep(.35, .6, esN(vW.xz * 2.3 + vec2(uTime * .3, vR.w)) * .6 + esN(vW.xz * 6.1 - vec2(0., uTime * .5)) * .4 + .25 * band);
        vec3 c = vec3(.95, .97, 1.) * (uSkyCol * .6 + uSunCol * .3 * esCloudShade(vW)) * .3183;
        gl_FragColor = vec4(esFog(c, vW), band * lace * .9);
      }`,
  }));
  mesh.renderOrder = 2; mesh.name = 'surf';
  return mesh;
}

// a boulder: a lumpy ball (80 faces, or 320 for the great ones), grey, its faces shaded as one rounded form
function rockGeometry(rng, detail = 1) {
  const g = new THREE.IcosahedronGeometry(1, detail), p = g.attributes.position, col = new Float32Array(p.count * 3), ph = [rng.range(0, 9), rng.range(0, 9), rng.range(0, 9)];
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i), k = 1 + 0.28 * Math.sin(x * 2.1 + ph[0]) * Math.sin(y * 2.7 + ph[1]) + 0.2 * Math.sin(z * 3.3 + ph[2] + x);
    p.setXYZ(i, x * k, y * k * 0.72, z * k);
    const t = 0.36 + 0.1 * Math.sin(ph[0] + i); col[i * 3] = t; col[i * 3 + 1] = t * 0.97; col[i * 3 + 2] = t * 0.92;
  }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  // each corner's normal looks out from the middle through that corner (the same for every face that shares it), turned a little by the lumps
  const nr = g.attributes.normal, v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) { v.set(p.getX(i), p.getY(i) / 0.52, p.getZ(i)).normalize(); nr.setXYZ(i, v.x, v.y, v.z); }
  return g;
}

// ---------------------------------------------------------------- the valley's brook: clear water over a bed of stones
// A sheet of the world's own, 3 m wide, laid down the bed the ground cuts for the stream (flat for half a metre either
// side of its middle, rising to its banks 2.1 m out), from 14 to 236 m down the valley's axis, a row of it every
// metre. Its level is read off the ground AS IT IS BUILT (surface: the height of the ground's own mesh, which runs up
// to a third of a metre off the ground's law in so narrow a bed): over the bed's lowest line there (the highest of
// that line half a metre up and down the run) by 0.4 of what the bed is cut below its lower bank, 0.05 m at the
// least; and no row stands lower than the row below it down the valley, so the water fills a hollow to its sill and
// comes down a fall with the bed. Where the ground runs true the water's edge lies 1.2 m out. The ground stands
// through the sheet's margin; nothing is dealt for it.
// WHAT IS SEEN, every term a law of the brook's own place (its metres across and along, its stones, its falls):
//  - the bed through the water: round stones of the banks' own greys and buffs, weed on some, darker and greener the
//    deeper the water, shifting a little as the ripples bend the sight line; across the shingle (from 212 to 222 m
//    down the axis on) the beach's own pale pebbles, the water thin and clear over them;
//  - the sky's colour where a ripple turns the surface up to it, the banks' green where the sight line lies flat and
//    along both edges; never more than 0.3 of mirror, so the far run is no bright band; the sun's glint only on a
//    ripple's turned face, and none in shade;
//  - fine flow lines along the run, slower by the banks, moving on the world's clock;
//  - WHITE ONLY WHERE IT BREAKS: down each fall and for 4 m below it, thinning; and about each stone of the rows that
//    lie across it (a collar above the stone, a wake up to 2.2 m below it): laced, running with the water.
// wakes(list): the stones of the rows, as they are dealt (36 at most: nine rows of four).
function makeBrook(U, Lo, surface) {
  const HALF = 1.5, ACROSS = 6, A = PLACE.valleyAxis, FROM = 14, TO = 236;
  const at = (s, a) => { const q = Lo.fromValley(s, Lo.streamAt(s) + a); return surface(q[0], q[1]); };
  const low = [], lv = [], pos = [], place = [], idx = [];
  for (let s = FROM - 1; s <= TO + 1; s += 0.5) low.push(Math.min(at(s, -0.6), at(s, -0.3), at(s, 0), at(s, 0.3), at(s, 0.6)));
  for (let s = FROM, k = 2; s <= TO; s++, k += 2) lv.push(Math.max(low[k - 1], low[k], low[k + 1]) + Math.max(0.05, 0.4 * (Math.min(at(s, 2.1), at(s, -2.1)) - low[k])));
  lv[lv.length - 1] = Math.max(lv[lv.length - 1], 0.2);
  for (let i = lv.length - 2; i >= 0; i--) lv[i] = Math.max(lv[i], lv[i + 1]);
  lv.forEach((y, i) => {
    const s = FROM + i, pool = Lo.pool(s);
    for (let j = 0; j <= ACROSS; j++) {
      const a = (j / ACROSS * 2 - 1) * HALF, q = Lo.fromValley(s, Lo.streamAt(s) + a);
      pos.push(q[0], y, q[1]); place.push(a, s, pool);
    }
    if (i) for (let j = 0; j < ACROSS; j++) { const b = i * (ACROSS + 1) + j, c = b - ACROSS - 1; idx.push(c, b, c + 1, c + 1, b, b + 1); }
  });
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aBrook', new THREE.Float32BufferAttribute(place, 3));
  g.setIndex(idx); g.computeBoundingSphere();
  const stones = []; for (let k = 0; k < 36; k++) stones.push(new THREE.Vector3(-999, 0, 0.5));
  const uniforms = { ...U, uAxes: { value: new THREE.Vector4(A[0], A[1], A[1], -A[0]) }, uStones: { value: stones }, uFalls: { value: new THREE.Vector3(...Lo.falls) } };
  const material = new THREE.ShaderMaterial({
    uniforms, fog: false, transparent: true, depthWrite: false, side: THREE.DoubleSide,
    vertexShader: /* glsl */`
      attribute vec3 aBrook; varying vec3 vW, vB;
      void main(){ vec4 wp = modelMatrix * vec4(position, 1.); vW = wp.xyz; vB = aBrook; gl_Position = projectionMatrix * viewMatrix * wp; }`,
    fragmentShader: ESTATE_GLSL + BANK_GLSL + /* glsl */`
      // uAxes: the valley's axis (x, z) and its left (x, z); uStones: metres down the axis, metres left of the brook's
      // middle, radius; uFalls: the three falls' metres down the axis. vB: metres left of the middle, metres down the
      // axis, 1 along the pool
      uniform vec4 uAxes; uniform vec3 uStones[36], uFalls;
      varying vec3 vW, vB;
      void main(){
        vec2 p = vW.xz; float a = vB.x, s = vB.y, t = uTime;
        // (the water's edge wanders as the banks' line does: the same number as the ground's)
        float bz = abs(a) + (esN(p * 1.1 + 3.) - .5) * .3;
        // dn: the water's depth as a share of its depth mid-stream (the bed's own section), 0 at its edge
        float dn = clamp(1. - smoothstep(.5, 2.1, bz) * 2.5, 0., 1.);
        float al = smoothstep(0., .25, dn) * smoothstep(14., 20., s) * (1. - smoothstep(232., 236., s));
        if (al <= 0.) discard;
        // where it breaks: the falls, and the stones of the rows
        float brk = 0.;
        for (int k = 0; k < 3; k++) { float d = s - uFalls[k]; brk = max(brk, smoothstep(-.5, -.2, d) * (1. - smoothstep(.9, 4.2, d))); }
        for (int k = 0; k < 36; k++) {
          vec3 st = uStones[k]; float d = s - st.x, r = st.z, w = r * (.8 + .3 * max(d, 0.));
          brk = max(brk, smoothstep(-r - .25, -r * .5, d) * (1. - smoothstep(r * .5, r + 2.2, d)) * (1. - smoothstep(w * .6, w, abs(a - st.y))));
        }
        float lace = esN(vec2(a * 4.5, (s - t * 2.3) * 1.5)) * .6 + esN(vec2(a * 11. + 5., (s - t * 3.) * 3.3)) * .4;
        float white = smoothstep(.95 - .75 * brk, 1.15 - .75 * brk, lace) * smoothstep(0., .15, brk);
        // flow lines (their slope across the run) and wavelets (their slope along it): the middle runs faster
        vec2 qm = vec2(a * 6.5 + .5 * sin(s * .45), s * .42 - t * .62), qe = vec2(a * 9. + 4., s * .6 - t * .3);
        float slA = mix(esN(qe + vec2(.04, 0.)) - esN(qe - vec2(.04, 0.)), esN(qm + vec2(.04, 0.)) - esN(qm - vec2(.04, 0.)), dn) * 1.3;
        // (the wavelets run askew of the bed, two sets crossing, so no patch of them lies square to the run)
        vec2 qw = vec2(a * 2.3 + s * .8 + 1.7, s * 3.4 - t * 2.4), qv = vec2(a * 3.9 - s * 1.3 + 8., s * 5.3 - t * 3.4);
        float slS = (esN(qw + vec2(0., .04)) - esN(qw - vec2(0., .04)) + (esN(qv + vec2(0., .04)) - esN(qv - vec2(0., .04))) * .7) * 1.6 * (.6 + 1.2 * brk) * (1. - .6 * vB.z);
        vec2 tilt = uAxes.zw * slA + uAxes.xy * slS;
        vec3 up = vec3(0., 1., 0.), N = normalize(vec3(tilt.x, 1., tilt.y));
        // the bed, seen through the moving water
        vec4 bc = esCell((p + tilt * .5) / .21);
        // (beach: where it crosses the shingle, the ground's own line 212 to 222 m down the axis: there it runs thin
        // and clear over the beach's own pale pebbles, wet; no weed, little depth of colour, the pale shore to mirror)
        float beach = smoothstep(212., 222., s), deep = dn * (1. - .6 * beach);
        vec3 bedC = mix(mix(mix(vec3(.14, .13, .115), vec3(.36, .33, .27), bc.z), mix(vec3(.25, .25, .23), vec3(.4, .37, .28), bc.z), beach), vec3(.06, .06, .065), step(.86, bc.z)) * mix(.4, 1.05, smoothstep(0., .16, bc.w));
        bedC = mix(bedC, vec3(.05, .08, .03), smoothstep(.45, .7, esN(p * .9 + 11.)) * .6 * (1. - beach));
        bedC = bedC * mix(vec3(.8, .9, .74), vec3(.22, .52, .42), deep * (.8 + .2 * vB.z)) + vec3(.008, .05, .04) * deep;
        // the light of the place (the ground's own: sun through the leaves, cloud, sky, the ring)
        vec4 pl = esPlace(vW); float sv = esSun(vW, pl);
        vec3 E = (uSunCol * (uSunDir.y * sv) + esFill(up, pl) * (.6 + .4 * esCloudShade(vW)) + esPortal(vW, up)) * .3183;
        vec3 V = normalize(cameraPosition - vW), R = reflect(-V, N); R.y = abs(R.y);
        float fres = min(.02 + .98 * pow(1. - clamp(dot(N, V), 0., 1.), 5.), .3);
        vec3 img = mix(mix(vec3(.1, .22, .08), vec3(.3, .29, .25), beach) * E, mix(uFogCol, uSkyCol * .3183, .75), smoothstep(.2, .48, R.y) * (.4 + .6 * dn));
        img += uSunCol * (sv * pow(clamp(dot(R, uSunDir), 0., 1.), 300.));
        vec3 c = mix(mix(bedC * E, img, fres), vec3(.92) * E, white);
        gl_FragColor = vec4(esFog(c, vW), al * mix(.93, 1., white));
      }`,
  });
  const object = new THREE.Mesh(g, material); object.name = 'brook';
  return {
    object,
    wakes(list) { list.slice(0, 36).forEach((r, k) => { const v = Lo.toValley(r.x, r.z); stones[k].set(v[0], v[1] - Lo.streamAt(v[0]), r.r); }); },
    update() {},
  };
}

// ---------------------------------------------------------------- water: the stream down the valley, the sea in the cove, stones
async function buildWater(S) {
  const { ctx, scene, R, Lo, U, sky, swellK } = S, P = PLACE, group = new THREE.Group();
  scene.add(group);
  const light = Water.waterLight(sky);
  // the stream: 5 to 9 m left of the route's line, from the valley's head to the tide
  // (a sheet of the world's own, lying in the bed the ground cuts for it: see makeBrook)
  const stream = makeBrook(U, Lo, S.surface);
  S.valley.add(stream.object);
  await ctx.yield();
  // the sea: a long low swell into the cove, shoaling and breaking white on the shingle
  // (its depth map, 16,384 readings of the ground, about 60 ms whole, is made ahead by the kit in slices: the same readings in the same order, the same sea)
  const depthAt = (x, z) => -Lo.ground(x, z), depthRect = [-760, -400, -240, 440], depthRes = 128;
  const depthData = await Water.oceanDepthAsync({ depthAt, depthRect, depthRes }, ctx.yield);
  const sea = Water.makeOcean({ rng: R.sea, light, preset: swellK > 0.9 ? 'swell' : 'breeze', level: 0, radius: 3200, rings: 76, segments: 96, windAngle: Math.atan2(-P.valleyAxis[1], -P.valleyAxis[0]),
    depthAt, depthRect, depthRes, depthData, shoalDepth: 5, shoalWidth: 26, foam: 0.8,
    deep: '#0b4c8e', scatter: '#35c2b0', shallowColor: '#6fe0b8', glitter: 1, shallows: [{ x: Lo.tide[0], z: Lo.tide[1], radius: 46, falloff: 60 }] });
  const seaGroup = new THREE.Group(); seaGroup.add(sea.object); scene.add(seaGroup);
  await ctx.yield();
  // stones: across the stream every 22 to 28 m (the water breaks white on them), along its banks, and great ones at the
  // headlands' feet. Each group is dealt from a stream of its own; a stone under 1.2 m is a ball of 80 faces, a greater one of 320
  const rockMat = makePlainMaterial(U, true), rocks = [1, 1, 1, 2, 2, 2].map((d) => rockGeometry(R['rock-shapes'], d)), rp = [], m4 = new THREE.Matrix4(), q4 = new THREE.Quaternion(), e = new THREE.Euler(), v = new THREE.Vector3(), sc = new THREE.Vector3();
  const stone = (rng, x, y, z, r) => rp.push({ x, y, z, r, v: Math.floor(rng() * 3) + (r >= 1.2 ? 3 : 0), rx: rng.range(-0.4, 0.4), ry: rng.range(0, TAU), k: rng.range(0.7, 1.3) });
  const onGround = (rng, x, z, r, sink) => stone(rng, x, Lo.ground(x, z) - sink * r, z, r);
  for (const s of stoneRows(ctx.seed)) {
    for (let i = 0; i < 4; i++) { const q = Lo.fromValley(s + R['row-stones'].range(-0.8, 0.8), Lo.streamAt(s) + R['row-stones'].range(-1.5, 1.5)); onGround(R['row-stones'], q[0], q[1], R['row-stones'].range(0.35, 0.8), 0.25); }
  }
  // (the brook is told where the stones of its rows stand: it breaks white about each)
  stream.wakes(rp);
  for (let i = 0, rb = R['bank-stones']; i < 130; i++) { const s = rb.range(16, 232), q = Lo.fromValley(s, Lo.streamAt(s) + rb.sign() * rb.range(1.2, 2.8)); onGround(rb, q[0], q[1], rb.range(0.2, 0.55), 0.35); }
  // ferns lean over the stream's banks (none nearer the route's line than 3.5 m)
  const fp = [];
  for (let i = 0, rf = R['stream-ferns']; i < 150; i++) {
    const s = rf.range(16, 214), q = Lo.fromValley(s, Lo.streamAt(s) + rf.sign() * rf.range(1.5, 3.3)), fs = rf.range(0.7, 1.25), rot = rf.range(0, TAU), vv = 3 + Math.floor(rf() * 2);
    if (Lo.routeDist(q[0], q[1]) >= 3.5) fp.push({ x: q[0], y: Lo.ground(q[0], q[1]) - 0.05, z: q[1], s: fs, rot, v: vv, c: s < 110 ? 0 : 1 });
  }
  plantSet(S.floraMat, S.geoms, fp, S.valley);
  await ctx.yield();
  for (let i = 0, rk = R['flank-rocks']; i < 90; i++) {
    const s = rk.range(222, 330), side = rk.sign(), l = Lo.lr(s) + 2.5 + side * (Lo.floorHalf(s) + rk.range(-5, 9)), q = Lo.fromValley(s, l), big = rk.range(0.7, 3.4);
    if (Lo.ground(q[0], q[1]) > -2.6) onGround(rk, q[0], q[1], big, 0.3);
  }
  // crags piled up the headlands' flanks over the cove
  for (let i = 0, rk = R.crags; i < 46; i++) {
    const s = rk.range(226, 345), side = rk.sign(), q = Lo.fromValley(s, Lo.lr(s) + 2.5 + side * (Lo.floorHalf(s) + rk.range(3, 30))), r = rk.range(2.6, 7);
    if (Lo.ground(q[0], q[1]) > -1.5) onGround(rk, q[0], q[1], r, 0.3);
  }
  // rocks standing out of the shallows either side of the ring, 13 m and more from the route's line: the ring's light falls on them
  for (let i = 0, rk = R['ring-rocks']; i < 14; i++) {
    const s = rk.range(262, 306), side = rk.sign(), q = Lo.fromValley(s, Lo.lr(s) + side * rk.range(13, 30)), r = rk.range(1.3, 3.1);
    stone(rk, q[0], Math.max(Lo.ground(q[0], q[1]), -1.1) - 0.1 * r, q[1], r);
  }
  // a few larger stones lying on the shingle (0.2 to 0.6 m), and stones about each rock pool's rim (0.35 to 1 m)
  for (let i = 0, rk = R['shingle-stones']; i < 34; i++) {
    const s = rk.range(224, 262), off = rk.range(-1, 1) * (Lo.floorHalf(s) - 3), q = Lo.fromValley(s, Lo.lr(s) + 2.5 + off);
    onGround(rk, q[0], q[1], rk.range(0.2, 0.6), 0.3);
  }
  for (const pl of S.pools) for (let i = 0; i < 7; i++) {
    const a = (i + R.pools.range(0, 0.8)) / 7 * TAU, d = pl.r * R.pools.range(0.75, 1.2), cs = Math.cos(pl.turn), sn = Math.sin(pl.turn), u = Math.cos(a) * d, w = Math.sin(a) * d / 1.7;
    onGround(R.pools, pl.x + cs * u - sn * w, pl.z + sn * u + cs * w, R.pools.range(0.35, 1), 0.3);
  }
  await ctx.yield();
  for (let k = 0; k < 6; k++) {
    const list = rp.filter((r) => r.v === k), mesh = new THREE.InstancedMesh(rocks[k], rockMat, Math.max(1, list.length));
    list.forEach((r, i) => { e.set(r.rx, r.ry, 0); mesh.setMatrixAt(i, m4.compose(v.set(r.x, r.y, r.z), q4.setFromEuler(e), sc.set(r.r * r.k, r.r, r.r / r.k))); });
    mesh.count = list.length; mesh.computeBoundingSphere(); group.add(mesh);
  }
  seaGroup.add(surfRings(U, rp.filter((r) => r.r >= 0.9 && r.y < 0.5 && Lo.ground(r.x, r.z) < 0.35)));
  await ctx.yield();
  return buildLife({ ...S, water: group, seaGroup, stream, sea });
}

// ---------------------------------------------------------------- life on the wing: birds on their loops, bees, butterflies
async function buildLife(S) {
  const { ctx, scene, R, Lo, density, detail, banks } = S;
  const fauna = F.makeFauna(scene, { light: F.lightFrom(scene) }), courses = lifeCourses(Lo), by = (n) => courses.find((c) => c.name === n);
  // for the sight table (see below): each group of living things with the points of its own course or places
  const lifeSight = [], sightOf = (f, pts, up) => lifeSight.push({ o: f.object, pts: pts.flatMap((q) => [q[0], q[1] + up, q[2]]), skip: 0, live: true });
  const flock = (name, rng, o) => { const c = by(name), f = F.makeFlock({ rng, route: c.pts, closed: true, start: rng(), spread: c.spread, wander: [c.wander[0], c.wander[1], c.wander[2], 0.3], ...o }); fauna.add(f); sightOf(f, c.pts, c.spread[1] + c.wander[1]); };
  flock('pigeons', R.pigeons, { species: 'crows', count: 12, size: 0.9, speed: 11, body: '#8a8f98', wingC: '#6f757e', belly: '#b9a7a4', tip: '#2a2c30', head: '#7f8792', beak: '#d8b070' });
  flock('rooks', R.rooks, { species: 'crows', count: 25, speed: 9 });
  flock('swallows', R.swallows, { species: 'swifts', count: 20, speed: 13, body: '#1c2238', wingC: '#1a2034', belly: '#f0ece0' });
  await ctx.yield();
  flock('gulls-sea', R.gulls, { species: 'gulls', count: 12, speed: 9 });
  flock('gulls-left', R['gulls-left'], { species: 'gulls', count: 9, speed: 8 });
  flock('gulls-right', R['gulls-right'], { species: 'gulls', count: 9, speed: 8 });
  flock('wagtails', R.wagtails, { species: 'swifts', count: 5, size: 0.45, speed: 4, body: '#3a3a3a', wingC: '#2c2c2c', belly: '#e8e4d0' });
  await ctx.yield();
  // bees about the upper faces of the red banks: each keeps to a place on a bank's face, 4.5 m and more from the route's line
  const hives = [];
  for (const b of banks) {
    for (const e of b.bank.edge) {
      const out = R.bees.range(0.4, 1.6), down = R.bees.range(0.5, 6), x = e[0] - e[3] * out, z = e[2] - e[4] * out, keep = R.bees.chance(0.5);
      if (keep && Lo.routeDist(x, z) >= 4.5 + 1.5) hives.push([x, e[1] - down, z]);
    }
  }
  if (hives.length) { const bees = F.makeBees({ rng: R.bees, positions: hives, count: Math.round(120 * density * detail), size: 2.6, roam: [1.3, 0.9, 2.4, 0.06] }); fauna.add(bees); sightOf(bees, hives, 1); }
  // butterflies over the azaleas, each about a bush top 6 m and more from the route's line
  const tops = [];
  for (let i = 0; i < 60; i++) {
    const s = R.butterflies.range(10, 206), side = R.butterflies.sign(), off = R.butterflies.range(8, 30) + (side > 0 ? 5 : 0), q = Lo.fromValley(s, Lo.lr(s) + side * off), up = R.butterflies.range(2, 4.5);
    if (Lo.routeDist(q[0], q[1]) >= 6 + 2) tops.push([q[0], Lo.ground(q[0], q[1]) + up, q[1]]);
  }
  const flies = F.makeButterflies({ rng: R.butterflies, positions: tops, count: Math.round(110 * density * detail), size: 2.4, roam: [1.8, 1, 0.55, 0.03] }); fauna.add(flies); sightOf(flies, tops, 1.5);
  await ctx.yield();
  return buildFalling({ ...S, fauna, lifeSight });
}

// ---------------------------------------------------------------- things that fall and drift: spent flowers, leaves, petals, smoke, sun shafts
// Spent red flowers come loose from the banks' upper edges and fall to the verge at their feet, each down a course of
// its own for ever (a habit on the world's clock): 6 m and more from the route's line.
function makeFallingFlowers(U, banks, rng, Lo, count) {
  const from = [], fall = [], out = [];
  for (let i = 0; i < count; i++) {
    const b = banks[i % banks.length], e = b.bank.edge[Math.floor(rng() * b.bank.edge.length)], fwd = rng.range(0.5, 1.5), drift = rng.range(0, 0.5), a = rng.range(-0.6, 0.6);
    const x = e[0] - e[3] * fwd, z = e[2] - e[4] * fwd, y = e[1] - rng.range(0.3, 2.5), period = rng.range(15, 27), phase = rng(), spin = rng.range(0.6, 1.6) * rng.sign();
    if (Lo.routeDist(x, z) < 6 + drift) continue;
    from.push(x, y, z); fall.push(Math.max(1, y - Lo.ground(x, z) - 0.1), period, phase, spin);
    out.push(-(e[3] * Math.cos(a) - e[4] * Math.sin(a)) * drift, -(e[3] * Math.sin(a) + e[4] * Math.cos(a)) * drift);
  }
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute([-0.5, 0, -0.5, 0.5, 0, -0.5, 0.5, 0, 0.5, -0.5, 0, 0.5, 0, 0.32, 0], 3));
  g.setIndex([0, 1, 4, 1, 2, 4, 2, 3, 4, 3, 0, 4]);
  g.setAttribute('aFrom', new THREE.InstancedBufferAttribute(new Float32Array(from), 3)); g.setAttribute('aFall', new THREE.InstancedBufferAttribute(new Float32Array(fall), 4));
  g.setAttribute('aOut', new THREE.InstancedBufferAttribute(new Float32Array(out), 2));
  g.instanceCount = from.length / 3;
  const mat = new THREE.ShaderMaterial({
    uniforms: { ...U, uRed: { value: new THREE.Vector3(...lin('#b8141e')) } }, fog: false, side: THREE.DoubleSide,
    vertexShader: ESTATE_GLSL + /* glsl */`
      attribute vec3 aFrom; attribute vec4 aFall; attribute vec2 aOut;
      varying vec3 vW, vN; varying float vTone;
      void main(){
        // a third of each flower's period is its fall, the rest it waits unseen on the bank
        float c = fract(uTime / aFall.y + aFall.z), t = clamp(c / .34, 0., 1.);
        float size = .26 * smoothstep(0., .06, t) * (1. - smoothstep(.985, 1., t)) * step(c, .34);
        float ang = aFall.w * t * 14. + aFall.z * 40., ca = cos(ang), sa = sin(ang);
        vec3 q = position * size;
        q = vec3(q.x * ca - q.y * sa, q.x * sa + q.y * ca, q.z);
        vec3 nn = vec3(-sa, ca, 0.);
        float flut = sin(t * 17. + aFall.z * 60.) * .22 * t;
        vec3 wp = aFrom + vec3(aOut.x * t + aOut.y * flut, -aFall.x * (.3 * t + .7 * t * t), aOut.y * t - aOut.x * flut) + q;
        vW = wp; vN = nn; vTone = .75 + .5 * fract(aFall.z * 17.);
        gl_Position = projectionMatrix * viewMatrix * vec4(wp, 1.);
      }`,
    fragmentShader: ESTATE_GLSL + /* glsl */`
      uniform vec3 uRed; varying vec3 vW, vN; varying float vTone;
      void main(){ vec3 n = normalize(vN); if (!gl_FrontFacing) n = -n; gl_FragColor = vec4(esFog(esLight(uRed * vTone, n, vW, 1., .5), vW), 1.); }`,
  });
  const mesh = new THREE.Mesh(g, mat); mesh.frustumCulled = false;
  return mesh;
}

// THE VAULT'S SHAFTS: where a gap of the vault lets the sun through, the light stands in the dim air as a shaft, from the
// leaves to its own gold patch on the floor. The gaps are the light law's own field (esDapple under the vault), which is
// the same along every ray of the sun; so the air is cut by sheets that lie along those rays, and each sheet shows the
// field where it cuts it: a shaft is where a gap is, moves as its patch moves, and ends on it. The sheets stand on a
// lattice of the world's own (two sets: one across the sun's bearing, 22 m apart; one along it, 18 m apart; each sheet
// 14 m wide; it climbs the sun's ray, as the light law slopes it, from the floor to 19 m up, or only as high as 40 m
// of the ray's run along the ground reach where the sun stands lower: 13.0 m at the gold hour, 10.2 m at the low
// gold, 19 m at the morning and haze hours), wherever the lattice falls under the vault within 16 m of the drive's line.
// THE DRIVE'S LANE IS CLEAR OF THEM, BY PLACE: no shaft's light stands in the air over the drive's kept verge. A sheet
// keeps its place on the lattice and is cut back where it crosses the lane: its light is none at any height within
// VERGE metres of the drive's middle line, measured on the level, and whole from twice that; over the drive a gap shows
// as its gold patch on the gravel alone. Behind the entry, where the opening's camera may stand to either side of the
// entry's axis (15 m at 340 m back), the lane is wider by that reach, as the trunks' lane is. The line is the drive's
// own plan: from behind the entry to the cut it runs west all the way, so it is handed to the shafts as its z at
// every LANE.step metres of x (chords that lie within a quarter of a metre of it; behind the entry it runs straight
// on along x).
// The shafts are a medium: what the eye gets of one is by the length of its own line inside it, so a sheet met square
// on shows less than half of what it shows met along its length. Nothing of a shaft answers to the eye's distance but
// the air between: far off it pales as every body of the wood does, by what the wood's own haze (esFog) lets through.
const LANE = { x0: PLACE.eastMouth[0] - 20, step: 8, n: Math.ceil((PLACE.entry[0] - PLACE.eastMouth[0] + 20) / 8) + 2 };
function makeVaultShafts(S) {
  const { Lo, M, U, sunDir } = S, Tb = Lo.tables, ra = [0, 0, 0], pos = [], uv = [], nrm = [], idx = [], mids = [], lane = new Float32Array(LANE.n);
  const fy = Math.max(sunDir.y, 0.25), fl = Math.hypot(sunDir.x, fy, sunDir.z), f = [sunDir.x / fl, fy / fl, sunDir.z / fl], hl = Math.hypot(sunDir.x, sunDir.z) || 1, sx = sunDir.x / hl, sz = sunDir.z / hl;
  const W = 14, rise = Math.min(19, 40 * f[1] / Math.hypot(f[0], f[2])), run = rise / f[1];
  for (const [hx, hz, D] of [[-sz, sx, 22], [sx, sz, 18]]) {
    // (the sheets of a set: every W along their own width, every D across it, the rows staggered; a set's sheets
    // all face one way: across their width and across the sun's ray. That normal goes with each sheet)
    const gx = -hz, gz = hx, nl = Math.hypot(hz * f[1], hz * f[0] - hx * f[2], hx * f[1]), nx = -hz * f[1] / nl, ny = (hz * f[0] - hx * f[2]) / nl, nz = hx * f[1] / nl;
    for (let j = Math.floor(-700 / D); j * D < 700; j++) for (let i = Math.floor(-700 / W); i * W < 700; i++) {
      const a = (i + (j & 1) * 0.5) * W, x = hx * a + gx * j * D, z = hz * a + gz * j * D, mx = x + f[0] * run * 0.5, mz = z + f[2] * run * 0.5;
      Lo.routeAt(mx, mz, ra);
      if (!(ra[0] < 16 && ra[1] < M.east - 12) || Lo.woodIn(mx, mz) < 0.5 || !S.gaps.every((g) => Math.hypot(mx - g.x, mz - g.z) > g.r)) continue;
      const y = Lo.ground(x, z) + 0.15, base = pos.length / 3;
      for (const [e, t] of [[-1, 1], [1, 1], [1, 0], [-1, 0]]) { const k = (1 - t) * run; pos.push(x + hx * e * W / 2 + f[0] * k, y + f[1] * k, z + hz * e * W / 2 + f[2] * k); uv.push(e, t); nrm.push(nx, ny, nz); }
      idx.push(base, base + 1, base + 2, base, base + 2, base + 3); mids.push(mx, y + rise * 0.5, mz);
    }
  }
  // (the drive's line for the lane: the tables' metres fall in x, so the line's z at each even x lies between two of them)
  for (let i = 0, k = Tb.B + M.east + 60; i < LANE.n; i++) {
    const x = LANE.x0 + i * LANE.step;
    while (k > 0 && Tb.X[k] < x) k--;
    lane[i] = lerp(Tb.Z[k], Tb.Z[k + 1], (Tb.X[k] - x) / (Tb.X[k] - Tb.X[k + 1]));
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aQ', new THREE.Float32BufferAttribute(uv, 2)); g.setAttribute('aN', new THREE.Float32BufferAttribute(nrm, 3)); g.setIndex(idx);
  const mat = new THREE.ShaderMaterial({
    uniforms: { ...U, uLane: { value: lane } }, fog: false, side: THREE.DoubleSide, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: /* glsl */`attribute vec2 aQ; attribute vec3 aN; varying vec3 vW, vN; varying vec2 vQ;
      void main(){ vec4 wp = modelMatrix * vec4(position, 1.); vW = wp.xyz; vQ = aQ; vN = mat3(modelMatrix) * aN; gl_Position = projectionMatrix * viewMatrix * wp; }`,
    fragmentShader: ESTATE_GLSL + /* glsl */`
      uniform float uLane[${LANE.n}];
      varying vec3 vW, vN; varying vec2 vQ;
      // (the square of a place's level distance from one length of the drive's line)
      float laneSeg(vec2 p, int i){
        vec2 ab = vec2(${LANE.step.toFixed(1)}, uLane[i + 1] - uLane[i]), w = p - vec2(${LANE.x0.toFixed(1)} + ${LANE.step.toFixed(1)} * float(i), uLane[i]);
        w -= ab * clamp(dot(w, ab) / dot(ab, ab), 0., 1.);
        return dot(w, w);
      }
      void main(){
        // (the lane: how far this place of the sheet lies from the drive's middle line on the level, less the opening
        // camera's reach behind the entry)
        vec2 p = vec2(min(vW.x, ${PLACE.entry[0].toFixed(1)}), vW.z);
        int i = int(clamp((p.x - ${LANE.x0.toFixed(1)}) / ${LANE.step.toFixed(1)}, 1., ${(LANE.n - 2.001).toFixed(3)}));
        float off = sqrt(min(laneSeg(p, i - 1), min(laneSeg(p, i), laneSeg(p, i + 1)))) - max(vW.x - ${PLACE.entry[0].toFixed(1)}, 0.) * ${(15 / 340).toFixed(5)};
        // (the sheet's own edges and the lane come first: where they leave no light the pixel is done, before any
        // lookup of the light's field or of the air)
        float w = (1. - smoothstep(.6, 1., abs(vQ.x))) * smoothstep(0., .15, vQ.y) * (1. - smoothstep(.8, 1., vQ.y)) * smoothstep(${VERGE.toFixed(1)}, ${(2 * VERGE).toFixed(1)}, off);
        if (w <= 0.) discard;
        vec3 e = vW - cameraPosition; float d = length(e);
        // (the light scattered toward the eye is strongest looking up the shaft toward the sun)
        float a = smoothstep(.6, 1., esDapple(vW, 1.)) * esVault(esPlace(vW)) * esCloudShade(vW) * (.45 + 1.6 * pow(clamp(dot(e / d, uSunDir), 0., 1.), 3.));
        a *= w;
        // (no gap of the leaves here, or no vault: nothing to add, and the air is not asked)
        if (a <= 0.) discard;
        // (the length of the eye's line inside the sheet, by the sheet's own normal: it is handed in with the sheet,
        // so it stands where the sheet is met edge-on too)
        a *= min(1., .45 / max(abs(dot(normalize(vN), e / d)), .01));
        // (a gap of the leaves is many small gaps: the light of a wide one comes down as a sheaf of thin rays, by the
        // same field of the rays' feet that the dapple is laid on, read finer)
        vec2 q = vW.xz - uSunDir.xz * (vW.y / max(uSunDir.y, .25));
        a *= .25 + 1.1 * smoothstep(.35, .8, esN(q * 1.7 + 31.) * .65 + esN(q * 4.3 + 7.) * .35);
        // (what the air lets through of a light, taken once: see esAir beside esFog)
        gl_FragColor = vec4(uSunCol * vec3(1., .92, .68) * (.045 * a) * esAir(vW), 1.);
      }`,
  });
  const mesh = new THREE.Mesh(g, mat); mesh.renderOrder = 2;
  return { mesh, mids };
}

async function buildFalling(S) {
  const { ctx, scene, R, Lo, M, U, HR, heavy, detail, windK, sunDir, banks, smoke } = S, Tb = Lo.tables, group = new THREE.Group(), tick = [];
  scene.add(group);
  group.add(makeFallingFlowers(U, banks, R.falling, Lo, heavy ? 720 : 240));
  const wind = [0.924 * windK, 0, -0.383 * windK], sunHex = HR.sun, at = (m, up) => [Tb.X[Tb.B + Math.round(m)], Tb.Y[Tb.B + Math.round(m)] + up, Tb.Z[Tb.B + Math.round(m)]];
  // leaves let go in the wood, pale petals in the valley: fields that stand where their trees and bushes stand
  // (the leaves' fields stand side by side at an even step of 76 m along the wood from the entry, one wherever its
  // middle lies in the wood, short of the cut's east mouth)
  // for the sight table: a field's points are nine over its box at its middle height and nine at its top; a thread of
  // smoke's are three up its rise; a glade's shafts' are their head and their foot
  const fallSight = [], seen = (t, pts) => { fallSight.push({ o: t.object, pts: pts.flat(), skip: 0 }); tick.push(t); };
  const boxPts = (c, b) => [0, 0.5].flatMap((h) => [-0.5, 0, 0.5].flatMap((i) => [-0.5, 0, 0.5].map((j) => [c[0] + i * b[0], c[1] + h * b[1], c[2] + j * b[2]])));
  for (let m = 38; m <= M.east; m += 76) {
    const c = at(m, 7);
    seen(fx.makeParticles({ rng: R.leaves, preset: 'leaves', follow: false, center: c, box: [80, 20, 80], count: Math.round(240 * detail), colors: ['#86b04c', '#a9b94e', '#c6a64a'], size: [0.1, 0.2], velocity: [wind[0] * 0.5, -0.9, wind[2] * 0.5], lightDir: [sunDir.x, sunDir.y, sunDir.z] }), boxPts(c, [80, 20, 80]));
  }
  await ctx.yield();
  for (const k of [0.16, 0.5, 0.84]) {
    const c = at(lerp(M.head, M.mouth, k), 4);
    seen(fx.makeParticles({ rng: R.petals, preset: 'petals', follow: false, center: c, box: [76, 18, 76], count: Math.round((heavy ? 1500 : 700) * detail), colors: ['#fbf4e2', '#f6d6dc', '#f4dc9a'], size: [0.13, 0.26], velocity: [wind[0] * 0.7, -0.6, wind[2] * 0.7], lightDir: [sunDir.x, sunDir.y, sunDir.z] }), boxPts(c, [76, 18, 76]));
  }
  // smoke from two of the stacks: a thin pale blue-grey thread that leans with the wind and is gone within 15 m of its stack
  // (11 m of rise, the lean and the last puff's own half width together), pale in its shade too, at every hour
  for (const p of smoke) seen(fx.makeSmokeColumn({ rng: R.smoke, position: p, height: 11, radius: [0.2, 1.1], size: [0.6, 2.4], count: 26, color: '#c6cfdb', colorTop: '#e2e8ee', shadowColor: '#a3adbd', ambient: '#5c6470',
    opacity: 0.2, wind: [wind[0] * 1.5, 0, wind[2] * 1.5], bend: 1.1, sunDir: [sunDir.x, sunDir.y, sunDir.z], sunColor: sunHex }), [0, 6, 12].map((h) => [p[0] + wind[0] * h * 0.3, p[1] + h, p[2] + wind[2] * h * 0.3]));
  await ctx.yield();
  // the sun's shafts down through the glades of the wood
  const tanE = sunDir.y / Math.hypot(sunDir.x, sunDir.z), hl = Math.hypot(sunDir.x, sunDir.z);
  for (const g of S.gaps) {
    const up = 15, back = Math.min(up / tanE, 44), top = Math.min(up, back * tanE), y = Lo.ground(g.x, g.z);
    const head = [g.x + sunDir.x / hl * back, y + top, g.z + sunDir.z / hl * back];
    seen(fx.makeGodRays({ rng: R.shafts, position: head, direction: [-sunDir.x, -sunDir.y, -sunDir.z], radius: g.r * 0.5, count: 3, length: Math.hypot(back, top) + 2,
      width: [0.7, 1.9], color: sunHex, intensity: 0.3, speed: 0.6 }), [head, [g.x, y + 1, g.z], [(head[0] + g.x) / 2, y + 1 + top / 2, (head[2] + g.z) / 2]]);
  }
  for (const t of tick) group.add(t.object);
  // the vault's own shafts (for the sight table: every sheet's middle)
  const shafts = makeVaultShafts(S);
  group.add(shafts.mesh); fallSight.push({ o: shafts.mesh, pts: shafts.mids, skip: 0 });
  await ctx.yield();
  return buildFinish({ ...S, tick, fallSight });
}

// ---------------------------------------------------------------- the open casements and their curtains; the ring's light on the water
async function buildFinish(S) {
  const { ctx, scene, U, masonry: M, plain, Lo } = S, P = PLACE, D = P.houseDepth / 2, group = new THREE.Group();
  scene.add(group);
  // three or four first-floor casements stand open on the south front, each with its two leaves swung out and a pale
  // curtain blowing out of it. They are dealt from the plain walls' own windows (the walls between the gabled bays, laid
  // as the house's material lays them: one to every 3.4 m of a wall's length), none in the front's seaward quarter
  const wins = [], L = P.houseLength / 2, GW = 4.5, edges = [-L].concat([-34, -17, 0, 17, 34].flatMap((c) => [c - GW, c + GW]), [L]);
  for (let k = 0; k < edges.length; k += 2) {
    const span = edges[k + 1] - edges[k], nw = Math.max(1, Math.floor((span - 1.2) / 3.4));
    for (let i = 0; i < nw; i++) { const u = edges[k] + span / 2 + (i - (nw - 1) / 2) * 3.4; if (u < L / 2) wins.push(u); }
  }
  const open = [], nOpen = 3 + Math.floor(S.R.casements() * 2);
  for (let k = 0; k < nOpen && wins.length; k++) open.push({ u: wins.splice(Math.floor(S.R.casements() * wins.length), 1)[0], swing: S.R.casements.range(1.1, 1.45), phase: S.R.casements.range(0, TAU) });
  const pos = [], nor = [], col = [], idx = [], hang = [], cp = [], ci = [], NI = 6, NJ = 9;
  for (const o of open) {
    for (const sg of [-1, 1]) {
      const uh = o.u + sg * 0.98, uf = uh + sg * 0.62 * Math.cos(o.swing), wf = D + 0.62 * Math.sin(o.swing), base = pos.length / 3;
      for (const q of [M.W(uh, 6.65, D + 0.02), M.W(uf, 6.65, wf), M.W(uf, 8.95, wf), M.W(uh, 8.95, D + 0.02)]) { pos.push(q[0], q[1], q[2]); nor.push(P.houseAxis[0] * -sg, 0.2, P.houseAxis[1] * -sg); col.push(0.5, 0.52, 0.5); }
      idx.push(base, base + 1, base + 2, base, base + 2, base + 3, base, base + 2, base + 1, base, base + 3, base + 2);
    }
    const c0 = cp.length / 3;
    for (let j = 0; j <= NJ; j++) for (let i = 0; i <= NI; i++) { const q = M.W(o.u + (i / NI - 0.5) * 1.5, 8.9 - j / NJ * 2.0, D + 0.12); cp.push(q[0], q[1], q[2]); hang.push(j / NJ, i / NI, o.phase); }
    for (let j = 0; j < NJ; j++) for (let i = 0; i < NI; i++) { const a = c0 + j * (NI + 1) + i, b = a + NI + 1; ci.push(a, b, a + 1, a + 1, b, b + 1); }
  }
  const lg = new THREE.BufferGeometry();
  lg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); lg.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); lg.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); lg.setIndex(idx);
  group.add(new THREE.Mesh(lg, plain));
  const cg = new THREE.BufferGeometry();
  cg.setAttribute('position', new THREE.Float32BufferAttribute(cp, 3)); cg.setAttribute('aHang', new THREE.Float32BufferAttribute(hang, 3)); cg.setIndex(ci);
  const curtain = new THREE.Mesh(cg, new THREE.ShaderMaterial({
    uniforms: { ...U, uOut: { value: new THREE.Vector3(P.houseFront[0], 0, P.houseFront[1]) } }, fog: false, side: THREE.DoubleSide,
    vertexShader: ESTATE_GLSL + /* glsl */`
      attribute vec3 aHang; uniform vec3 uOut; varying vec3 vW, vN; varying float vFold;
      void main(){
        float h = pow(clamp(aHang.x, 0., 1.), 1.3);
        float gust = .55 + .3 * sin(uTime * 1.1 + aHang.y * 2.4 + aHang.z) + .15 * sin(uTime * 2.7 + aHang.x * 5. + aHang.y * 7. + aHang.z * 1.7);
        float b = h * gust * (.6 + .5 * uWind.z);
        vec3 wp = position + uOut * b + vec3(0., .42 * b * h, 0.);
        vW = wp; vN = normalize(uOut + vec3(0., .6 * b, 0.)); vFold = sin(aHang.y * 25. + aHang.x * 3.);
        gl_Position = projectionMatrix * viewMatrix * vec4(wp, 1.);
      }`,
    fragmentShader: ESTATE_GLSL + /* glsl */`
      varying vec3 vW, vN; varying float vFold;
      void main(){ vec3 c = esLight(vec3(.8, .76, .66) * (.82 + .18 * vFold), normalize(vN), vW, 1., .7); gl_FragColor = vec4(esFog(c, vW), 1.); }`,
  }));
  curtain.frustumCulled = false; group.add(curtain);
  // the ring's own light: on the wet shingle, the rocks and the foam through the estate's light law, and a sheen on the water under it
  const ring = Lo.ring, portalCol = new THREE.Color('#cfeee6');
  U.uPortal.value.set(ring[0], P.ringHeight, ring[1], 40); U.uPortalCol.value.set(portalCol.r, portalCol.g, portalCol.b).multiplyScalar(3);
  const pool = new THREE.Mesh(new THREE.CircleGeometry(30, 48).rotateX(-Math.PI / 2), new THREE.ShaderMaterial({
    uniforms: U, fog: false, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: /* glsl */`varying vec3 vW; void main(){ vec4 wp = modelMatrix * vec4(position, 1.); vW = wp.xyz; gl_Position = projectionMatrix * viewMatrix * wp; }`,
    fragmentShader: ESTATE_GLSL + /* glsl */`
      varying vec3 vW;
      void main(){
        vec2 d = vW.xz - uPortal.xz; float r = length(d) / 30.;
        float rip = esN(vW.xz * .9 + vec2(uTime * .7, 0.)) * esN(vW.xz * 2.3 - vec2(0., uTime * .9));
        float k = exp(-r * r * 5.) * (.25 + 1.6 * rip) * (1. - smoothstep(.8, 1., r));
        gl_FragColor = vec4(uPortalCol * (.085 * k), 1.);
      }`,
  }));
  pool.position.set(ring[0], 0.55, ring[1]); pool.renderOrder = 2; group.add(pool);
  await ctx.yield();
  return buildRest(S);
}

// ---------------------------------------------------------------- what each stretch of the route can see
// Decided once, at build, by places. The route is cut into stretches of 20 m. The lens rides the route's own line, and
// an eye stands on that line every 2.5 m. A piece is shown in a stretch when any eye inside that stretch, or inside the
// stretch before or after it, sees one of the piece's points; it is put out only where solid things hide every one of
// its points from every such eye. The solid things: the land, the bodies of the cut's two banks (2 m under their
// surface), the dark wall of the deep wood (to the lowest gap between its crowns, 14 m), the house (to a metre under
// its eaves). THE MARGIN IS IN SPACE: every one of them is shrunk by one 4 m cell on every side (each cell of the
// height field takes the least of itself and its eight neighbours), and a line of sight must pass 1.5 m under the
// shrunk field at two places running. The lens is never more than 1.25 m from an eye, so what the shrunk field hides
// from an eye the thing itself hides from the lens. Behind the entry the eyes stand every 5 m along the entry's axis as
// far back as the opening's camera can (340 m), on lines 5 m apart at most across its reach to either side (15 m at
// 340 m, less in proportion nearer): that camera is never more than 3.6 m from one of them, and they look against the
// same shrunk field; what they see is shown while the world is seen through the opening, until the flight's first metre.
// The avenue's leaves and crowns hide nothing here.
async function sightTable(S, roots, skipObjects, extra) {
  const { ctx, Lo, BOX, banks } = S, P = PLACE, C = 4, X0 = BOX[0], Z0 = BOX[1], NX = Math.ceil((BOX[2] - BOX[0]) / C), NZ = Math.ceil((BOX[3] - BOX[1]) / C);
  const H = new Float32Array(NX * NZ), raise = (x, z, y) => { const i = Math.floor((x - X0) / C), j = Math.floor((z - Z0) / C); if (i >= 0 && j >= 0 && i < NX && j < NZ && y > H[j * NX + i]) H[j * NX + i] = y; };
  for (let j = 0; j < NZ; j += 2) {
    for (let i = 0; i < NX; i += 2) { const g = Lo.ground(X0 + (i + 1) * C, Z0 + (j + 1) * C); for (const k of [0, 1, NX, NX + 1]) if (j * NX + i + k < H.length) H[j * NX + i + k] = g; }
    if (j % 24 === 22) await ctx.yield();
  }
  const dw = S.deepWood.cells;
  for (let j = 0; j < dw.NZ; j++) for (let i = 0; i < dw.NX; i++) if (dw.deep[j * dw.NX + i]) {
    for (let a = 2; a < dw.C; a += C) for (let b = 2; b < dw.C; b += C) { const x = dw.X0 + i * dw.C + a, z = dw.Z0 + j * dw.C + b, ci = Math.floor((x - X0) / C), cj = Math.floor((z - Z0) / C); if (ci >= 0 && cj >= 0 && ci < NX && cj < NZ) H[cj * NX + ci] += 14; }
  }
  for (const b of banks) b.bank.eachVertex((x, y, z) => raise(x, z, y - 2));
  for (let u = -P.houseLength / 2 + 2; u < P.houseLength / 2; u += 3) for (let w = -P.houseDepth / 2 + 2; w < P.houseDepth / 2; w += 3) raise(P.houseCentre[0] + P.houseAxis[0] * u + P.houseFront[0] * w, P.houseCentre[1] + P.houseAxis[1] * u + P.houseFront[1] * w, P.groundLawn + 9);
  await ctx.yield();
  // a field shrunk by r cells on every side: each cell takes the least of the square of cells about it (rows, then columns)
  const shrink = (A, r) => {
    const B = new Float32Array(A.length), D = new Float32Array(A.length);
    for (let j = 0; j < NZ; j++) for (let i = 0; i < NX; i++) { let m = A[j * NX + i]; for (let d = Math.max(0, i - r); d <= Math.min(NX - 1, i + r); d++) { const a = A[j * NX + d]; if (a < m) m = a; } B[j * NX + i] = m; }
    for (let j = 0; j < NZ; j++) for (let i = 0; i < NX; i++) { let m = B[j * NX + i]; for (let d = Math.max(0, j - r); d <= Math.min(NZ - 1, j + r); d++) { const a = B[d * NX + i]; if (a < m) m = a; } D[j * NX + i] = m; }
    return D;
  };
  const H1 = shrink(H, 1);
  await ctx.yield();
  await ctx.yield();
  return sightPieces(S, roots, skipObjects, extra, { H1, C, X0, Z0, NX, NZ });
}

// a piece's points. A mesh: the highest of its vertices over every 8 m square of its plan (what the land and the other
// solid things hide of the highest point over a spot they hide of everything under it). Instances: every one's top,
// and where it reaches over 2.5 m from its stem four points round its shoulder (at 0.8 of its reach, three quarters
// of the way up), eight where it reaches over 5 m, so that no part of its upper side lies further from a point than
// the hiders are shrunk by; of the very many small ones (flower heads, whorls) forty tops at an even step along their mesh.
// THE BUILT HEADS AND WHORLS OF A BANK OR A BUSH ARE NOT ASKED WHILE ITS MASS IS HIDDEN (ride: which mass each stands
// on): they stand on its skin and no drawn part of one reaches more than 0.7 m over it (a head: 0.3 m proud at most
// and a dome 0.29 m high at its largest; a whorl: 0.25 m proud and 0.61 m of drawn reach). So a second set of the
// mass's points is kept, 0.7 m higher (a piece with no object of its own: it shows and hides nothing), and from an eye
// that sees none of those the heads and whorls are hidden (of: that piece). From an eye that sees one they are asked
// by their own tops, as before; the mass itself is asked by its own points, as before.
function sightPoints(roots, skipObjects, ride) {
  const pieces = [], m4 = new THREE.Matrix4(), v = new THREE.Vector3(), Q = 8;
  for (const root of roots) {
    root.updateMatrixWorld(true);
    root.traverse((o) => {
      if (!o.isMesh || skipObjects.includes(o) || !o.geometry.attributes.position) return;
      const pts = [];
      if (o.isInstancedMesh) {
        if (!o.geometry.boundingBox) o.geometry.computeBoundingBox();
        const bb = o.geometry.boundingBox;
        const n = o.count, small = Math.max(bb.max.x - bb.min.x, bb.max.z - bb.min.z) < 1.5, stride = small ? Math.max(1, Math.floor(n / 40)) : 1;
        const rx = 0.8 * Math.max(bb.max.x, -bb.min.x), rz = 0.8 * Math.max(bb.max.z, -bb.min.z), hy = 0.75 * bb.max.y, d = Math.SQRT1_2;
        const one = [[0, bb.max.y, 0]], four = [...one, [rx, hy, 0], [-rx, hy, 0], [0, hy, rz], [0, hy, -rz]], eight = [...four, [rx * d, hy, rz * d], [-rx * d, hy, rz * d], [rx * d, hy, -rz * d], [-rx * d, hy, -rz * d]];
        for (let i = 0; i < n; i += stride) {
          o.getMatrixAt(i, m4);
          const reach = small ? 0 : Math.max(rx, rz) * Math.hypot(m4.elements[0], m4.elements[1], m4.elements[2]);
          for (const [x, y, z] of reach > 5 ? eight : reach > 2.5 ? four : one) { v.set(x, y, z).applyMatrix4(m4).applyMatrix4(o.matrixWorld); pts.push(v.x, v.y, v.z); }
        }
        if (n) pieces.push({ o, pts, skip: 8, of: ride.piece.get(ride.of.get(o)) });
      } else {
        // (its plan's own extent, found in one pass over its vertices)
        const pa = o.geometry.attributes.position, a = pa.array; let x0 = Infinity, z0 = Infinity, x1 = -Infinity, z1 = -Infinity;
        for (let i = 0; i < pa.count; i++) { const x = a[i * 3], z = a[i * 3 + 2]; if (x < x0) x0 = x; if (x > x1) x1 = x; if (z < z0) z0 = z; if (z > z1) z1 = z; }
        const nx = Math.floor((x1 - x0) / Q) + 1, nz = Math.floor((z1 - z0) / Q) + 1;
        const top = new Float32Array(nx * nz).fill(-1e9), at = new Int32Array(nx * nz).fill(-1);
        for (let i = 0; i < pa.count; i++) { const k = Math.floor((a[i * 3 + 2] - z0) / Q) * nx + Math.floor((a[i * 3] - x0) / Q); if (a[i * 3 + 1] > top[k]) { top[k] = a[i * 3 + 1]; at[k] = i; } }
        for (let k = 0; k < nx * nz; k++) if (at[k] >= 0) { v.fromBufferAttribute(pa, at[k]).applyMatrix4(o.matrixWorld); pts.push(v.x, v.y, v.z); }
        pieces.push({ o, pts, skip: 8 });
        if (ride.masses.has(o)) { const gate = { o: null, pts: pts.map((c, i) => (i % 3 === 1 ? c + 0.7 : c)), skip: 8 }; pieces.push(gate); ride.piece.set(o, gate); }
      }
    });
  }
  return pieces;
}

async function sightPieces(S, roots, skipObjects, extra, F) {
  const { ctx, Lo, PL } = S, Tb = Lo.tables, STEP = 20, FINE = 2.5, UNDER = 1.5, NE = Math.ceil(PL / STEP), pieces = [];
  for (const root of roots) { for (const p of sightPoints([root], skipObjects, S.ride)) pieces.push(p); await ctx.yield(); }
  for (const x of extra) pieces.push(x);
  const { H1, C, X0, Z0, NX, NZ } = F, eye = [0, 0, 0], IC = 1 / C;
  // the lens's place at m metres of the route (negative: behind the entry, on the entry's axis)
  const eyeAt = (m) => { const f = clamp(m, -340, Tb.N - 1) + Tb.B, k = Math.floor(f), t = f - k; eye[0] = lerp(Tb.X[k], Tb.X[k + 1], t); eye[1] = lerp(Tb.Y[k], Tb.Y[k + 1], t); eye[2] = lerp(Tb.Z[k], Tb.Z[k + 1], t); };
  // where the line of sight from the eye to a point is stopped: the number of the first of two places running (4 m
  // apart along it, from 12 m out to `skip` short of the point) at which it passes `under` metres beneath the field;
  // 0 where it is not stopped. b: where it was stopped from the eye before (those two places are tried first, then the
  // places about them: a stop found there is a stop, so the answer is the same). lo: the first place that counts (3,
  // or see `any`)
  const stopped = (Hf, under, qx, qy, qz, skip, b, lo) => {
    const dx = qx - eye[0], dz = qz - eye[2], d = Math.sqrt(dx * dx + dz * dz), n = Math.floor((d - skip) * IC), s = 1 / d;
    const ex = (eye[0] - X0) * IC, ey = eye[1] + under, ez = (eye[2] - Z0) * IC, kx = dx * s, kz = dz * s, ky = (qy - eye[1]) * C * s;
    if (b > 0) {
      if (b >= lo && b + 1 < n) {
        const ci = Math.floor(ex + kx * b), cj = Math.floor(ez + kz * b), di = Math.floor(ex + kx * (b + 1)), dj = Math.floor(ez + kz * (b + 1));
        if (ci >= 0 && cj >= 0 && ci < NX && cj < NZ && di >= 0 && dj >= 0 && di < NX && dj < NZ && ey + ky * b < Hf[cj * NX + ci] && ey + ky * (b + 1) < Hf[dj * NX + di]) return b;
      }
      for (let i = Math.max(lo, b - 2), hit = 0; i <= b + 4 && i < n; i++) {
        const ci = Math.floor(ex + kx * i), cj = Math.floor(ez + kz * i);
        if (ci >= 0 && cj >= 0 && ci < NX && cj < NZ && ey + ky * i < Hf[cj * NX + ci]) { if (++hit >= 2) return i - 1; } else hit = 0;
      }
    }
    for (let i = lo, hit = 0; i < n; i++) {
      const ci = Math.floor(ex + kx * i), cj = Math.floor(ez + kz * i);
      if (ci >= 0 && cj >= 0 && ci < NX && cj < NZ && ey + ky * i < Hf[cj * NX + ci]) { if (++hit >= 2) return i - 1; } else hit = 0;
    }
    return 0;
  };
  // the entry (the opening's own plane stands across it) and the way forward from it
  const ax = Tb.X[Tb.B] - Tb.X[Tb.B + 1], az = Tb.Z[Tb.B] - Tb.Z[Tb.B + 1], al = Math.hypot(ax, az), E0x = Tb.X[Tb.B], E0z = Tb.Z[Tb.B], fx = -ax / al, fz = -az / al;
  // (each piece's points are tried from the one last seen: the order of trying changes no answer). back: for an eye
  // that stands so many metres behind the entry's plane on the edge of the opening camera's lane, a point higher than
  // the eye is stopped only by what stands before that plane (see the eyes behind the entry, below); else 0
  const any = (p, Hf, under, back) => {
    const pts = p.pts, at = p.at;
    for (let c = 0, n = at.length, j = p.first; c < n; c++, j = j + 1 < n ? j + 1 : 0) {
      const i = j * 3;
      let lo = 3;
      if (back > 0 && pts[i + 1] > eye[1]) { const dx = pts[i] - eye[0], dz = pts[i + 2] - eye[2]; lo = Math.max(3, Math.ceil(Math.sqrt(dx * dx + dz * dz) * IC * back / (back + (pts[i] - E0x) * fx + (pts[i + 2] - E0z) * fz))); }
      const b = stopped(Hf, under, pts[i], pts[i + 1], pts[i + 2], p.skip, at[j], lo);
      at[j] = b;
      if (!b) { p.first = j; return true; }
    }
    return false;
  };
  for (const p of pieces) { p.raw = new Uint8Array(NE); p.first = 0; p.behind = 0; p.at = new Int16Array(p.pts.length / 3); }
  await ctx.yield();
  for (let e = 0; e < NE; e++) {
    for (let m = e * STEP + FINE / 2; m < (e + 1) * STEP; m += FINE) {
      eyeAt(m);
      for (const p of pieces) if (!p.raw[e] && (!p.of || p.of.raw[e]) && any(p, H1, UNDER, 0)) p.raw[e] = 1;
      if (m < FINE) for (const p of pieces) p.at0 = p.at.slice();
    }
    if (e % 4 === 2) await ctx.yield();   // (after the first three stretches, which warm the test, then after every four: twelve were 25 to 46 ms of work on a cold page)
  }
  await ctx.yield();
  // BEHIND THE ENTRY the opening's camera may stand anywhere in a lane: as far back as 340 m, and to either side of
  // the entry's axis as far as its reach (15 m at 340 m back, less in proportion nearer, never under 2 m). Eyes stand
  // in it every 5 m back on lines 5 m apart at most (the camera is never more than 3.6 m from one), all at the entry's
  // own height, and are asked only about the pieces the flight's first stretch does not show (those are shown in the
  // opening as it is). FOR A PIECE THAT LIES WHOLLY BEFORE THE ENTRY'S PLANE (8 m and more) THE EYES ON THE LANE'S
  // EDGE ANSWER FOR THE REST: on the straight line from a point through the lane, a point no higher than the eyes is
  // seen clearest from the lane's nearest edge (every sight line from further back on that line lies lower all the way
  // to the point), and a higher point from its furthest edge (every line from nearer lies lower between the nearer
  // eye and the point; so for such a point only what stands before the entry's plane, which lies between every
  // camera in the lane and the point, counts as a stop). Any other piece is asked of every eye.
  const rest = pieces.filter((p) => !(p.raw[0] | p.raw[1])), inner = rest.filter((p) => { for (let i = 0; i < p.pts.length; i += 3) if ((p.pts[i] - E0x) * fx + (p.pts[i + 2] - E0z) * fz < 8) return true; return false; });
  const rows = [], within = new Set(inner); for (let d = 2.5; d <= 340; d += 5) rows.push(d);
  const reachAt = (d) => Math.max(2, 15 * d / 340), eyeAtLane = (d, w) => { eye[0] = E0x + (ax * d - az * w) / al; eye[1] = Tb.Y[Tb.B]; eye[2] = E0z + (az * d + ax * w) / al; };
  // (round the edge: across the front, back along one side, across the far end, forward along the other side)
  const edge = [];
  { const d0 = rows[0], dn = rows[rows.length - 1], n0 = Math.ceil(reachAt(d0) / 5), nn = Math.ceil(reachAt(dn) / 5);
    for (let a = -n0; a <= n0; a++) edge.push([d0, reachAt(d0) * a / n0]);
    for (let k = 1; k < rows.length - 1; k++) edge.push([rows[k], reachAt(rows[k])]);
    for (let a = nn; a >= -nn; a--) edge.push([dn, reachAt(dn) * a / nn]);
    for (let k = rows.length - 2; k >= 1; k--) edge.push([rows[k], -reachAt(rows[k])]); }
  // (a head or whorl is asked from behind the entry only once its mass is seen from there, or was seen in the first stretches)
  const seenOf = (p) => !p.of || p.of.behind || p.of.raw[0] || p.of.raw[1];
  for (const p of rest) { p.at.set(p.at0); p.first = 0; }
  for (let k = 0; k < edge.length; k++) {
    eyeAtLane(edge[k][0], edge[k][1]);
    for (const p of rest) if (!p.behind && seenOf(p) && any(p, H1, UNDER, within.has(p) ? 0 : edge[k][0])) p.behind = 1;
    if (k % 36 === 35) await ctx.yield();
  }
  // (the eyes within the lane, to and fro across it row by row, for the pieces that do not lie wholly before the plane)
  for (const p of inner) { p.at.set(p.at0); p.first = 0; }
  for (let k = 0; k < rows.length && inner.length; k++) {
    const d = rows[k], reach = reachAt(d), n = Math.ceil(reach / 5);
    for (let a = -n + 1; a <= n - 1; a++) {
      eyeAtLane(d, reach * (k % 2 ? -a : a) / n);
      for (const p of inner) if (!p.behind && seenOf(p) && any(p, H1, UNDER, 0)) p.behind = 1;
    }
    if (k % 8 === 7) await ctx.yield();
  }
  await ctx.yield();
  // a piece's showing: [0] while the world is seen through the opening, before the flight's first metre (the lens at
  // the entry or behind it: u is 0 then), [e + 1] in stretch e of the flight
  for (const p of pieces) { p.see = new Uint8Array(NE + 1); for (let e = 0; e < NE; e++) p.see[e + 1] = p.raw[Math.max(e - 1, 0)] | p.raw[e] | p.raw[Math.min(e + 1, NE - 1)]; p.see[0] = p.see[1] | p.behind; delete p.raw; delete p.at; delete p.at0; }
  // the eye's stretch by its place on the route (u), never by the clock
  let last = -1;
  // (the living things' own keeper shows them each frame: for them the table only puts out, after it, by the same eye)
  const still = pieces.filter((p) => !p.live && p.o), live = pieces.filter((p) => p.live);
  return { pieces, set(u) { const e = u > 0 ? 1 + clamp(Math.floor(u * PL / STEP), 0, NE - 1) : 0; if (e === last) return; last = e; for (const p of still) p.o.visible = p.see[e] === 1; },
    life() { for (const p of live) if (p.see[Math.max(last, 0)] !== 1) p.o.visible = false; } };
}

async function buildRest(S) {
  const { ctx, scene, Lo, path, M, PL, HR, sky, rig, sunDir, U, PM, placeTex, banks } = S, P = PLACE;
  for (let k = 0; k < PM.cells; k += 24576) { PM.bake(sunDir, placeTex, k, k + 24576); await ctx.yield(); }
  await sky.prewarm(ctx.renderer, null, scene);
  // the sea is one piece: its points lie on the water every 60 m over the cove, the bay and the offing
  const seaPts = [];
  for (let sv = 150; sv <= 930; sv += 60) for (let l = -700; l <= 320; l += 60) { const q = Lo.fromValley(sv, l); if (Lo.ground(q[0], q[1]) < -0.5) seaPts.push(q[0], 0.5, q[1]); }
  const ride = { masses: new Set(), of: new Map(), piece: new Map() };
  for (const built of [...banks.map((b) => b.built), S.outliers, ...S.azaleas]) for (const q of built.parts) { ride.masses.add(q.mass); ride.of.set(q.heads, q.mass); ride.of.set(q.leaves, q.mass); }
  S.ride = ride;
  const sight = await sightTable(S, [S.wood, ...banks.map((b) => b.built.group), S.lyingGroup, S.outliers.group, S.valley, S.house, S.lawn, S.water], [S.deepWood.mesh], [{ o: S.seaGroup, pts: seaPts, skip: 0 }, ...S.lifeSight, ...S.fallSight]);
  // the camera's pace by place (metres of the route between places of the estate): a little quicker through the wood,
  // slow round the cut's bend to its west mouth, easy over the lawn to the house, slow along the front and while the
  // lawn falls away past it (from the turn onto the front's line to the end of the level run), plain from the lawn's corner on
  const pace = (u) => {
    const m = u * PL;
    let p = lerp(1.15, 1, smoothstep(M.east - 40, M.east, m));
    p = lerp(p, 0.75, smoothstep(M.bend - 40, M.bend - 20, m));
    p = lerp(p, 0.9, smoothstep(M.west, M.west + 30, m));
    p = lerp(p, 0.8, smoothstep(M.turn, M.onFront, m));
    return lerp(p, 1, smoothstep(M.holdEnd, M.corner, m));
  };
  // One look, to the right of the way, at one point of the world: a point out to sea, 900 m from the seaward corner of
  // the house's front wall on a bearing SEAWARD degrees to the right of the front's own line. While the house is abeam
  // the line of sight to it crosses the front's wall some 13 m ahead of the eye, so the gaze rests on the front; as
  // the seaward end comes abeam it passes the wall's corner and goes out over the fall of the lawn to the open sea.
  // ITS ENDS ARE PLACES OF THE PLAN, in route metres. It comes on at the cut's west mouth (M.west: from there to the
  // turn its point lies within 10 degrees of the route's own line, on the house ahead, so nothing turns as it comes
  // on). It begins to let go where the house's west end is abeam (M.houseW) and is off at the lawn's corner
  // (M.corner), the gaze coming round to the valley ahead. The engine's window has one ramp for both its ends: this
  // look's is the let-go's own metres, from the west end abeam to the lawn's corner, so it comes on over as many
  // metres from the west mouth and stands whole from there (about where the route turns for the front) until the
  // west end is abeam.
  const hc = P.houseCentre, ha = P.houseAxis, hf = P.houseFront, SEAWARD = 60, far = 900, seaC = Math.cos(SEAWARD * Math.PI / 180), seaS = Math.sin(SEAWARD * Math.PI / 180);
  const sea = [hc[0] + ha[0] * (P.houseLength / 2 + far * seaC) + hf[0] * (P.houseDepth / 2 - far * seaS), 6, hc[1] + ha[1] * (P.houseLength / 2 + far * seaC) + hf[1] * (P.houseDepth / 2 - far * seaS)];
  const pois = [{ at: sea, from: M.west / PL, to: M.corner / PL, fade: (M.corner - M.houseW) / (M.corner - M.west), weight: 0.75 }];
  return {
    scene, path, duration: 48, pace, pois,
    camera: { fov: 62, near: 0.3, far: 4200, lookAhead: 26, sway: 0.7, bank: 0.5, nearThrough: 0.3 },
    portal: { shape: 'circle', radius: P.ringRadius, color: '#cfeee6', glow: 1, revealDistance: 300 },
    post: { exposure: HR.exposure, bloom: { strength: 0.3, radius: 0.6, threshold: 1.0 }, grade: { saturation: 1.04, contrast: 1.03, vignette: 0.22, grain: 0.02 } },
    update(dt, time, camera, u) {
      U.uTime.value = time;
      sight.set(u);
      sky.update(dt, time, camera); rig.update(dt, time, camera);
      S.stream.update(dt, time, camera); S.sea.update(dt, time, camera);
      S.fauna.update(dt, time, camera, u); sight.life();
      for (const t of S.tick) t.update(dt, time, camera);
    },
    dispose() { sky.dispose?.(); },
  };
}
