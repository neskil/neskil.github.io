// THOUSAND-TREE MOUNTAIN ("petal-storm"): a spring morning on Mount Yoshino. Up a jade stream paved with flower rafts
// to a thousand-year weeping cherry on its mossy terrace, under its hanging curtain, out past a troop of macaques, round
// a climbing loop past a serow on its crag, back over the tree as one gust lifts last week's fallen petals off the whole
// mountain, and up the slope inside the petal storm to a saddle between two wind-bent cherries.
//
// THE STORM STRIPS NOTHING. Every crown stays full to the last frame and the weeping cherry stays whole: its curtain swings
// up and streams like hair, intact. What flies is what had already fallen: the rafts on the stream, the litter on the
// terrace and under the groves, the drifts in the saddle's hollows. The front crosses the mountain and the ground behind it
// clears from pink to green, band by band (terrain, stream, moss and drift shaders all read the same front), while round
// the great tree the fall goes up in four braided bands that wind slowly up about the crown (the part's own petals).
//
// LAYOUT  +X east (stream, morning sun), +Z south (entry side), the mountain rises to the west. The hero stands at the
//         origin on a terrace 14 m above the stream, drawn 1.4 times its part's size; the banks below the terrace lie
//         back (an apron), a thread fall steps down wet ledges on its south-east face. A spur closes the valley head
//         to the north: a hill with its own skyline (the mountain behind it rounds off, so there is sky over it), clad
//         from its foot in sugi that stand in ranks, each paler and bluer than the one before, with threads of mist
//         between; from the stream the rose dome stands against that dark cedar. The serow's crag is a knoll on the west
//         slope at (-45, -100), ringed by cherries on the sides the flight looks toward. The wind blows toward
//         (-0.664, 0.748): south-west and up the slope.
// BEATS   u 0-0.25 the stream: jade water that mirrors its dark banks, boulders with foam pillows, petal rafts (three sika
//         hinds on the west bank: one lifts her head as we come within 36 m, one browses until we are 15 m off, all watch us pass;
//         the tree ahead stands open to the south, trunk and limbs in a hall of blossom, its curtain in tiers);
//         0.265-0.32 under the crown (white-eyes lift at 0.29; a great mossy limb closes the left, the way out is a slot
//         in the curtain); 0.34 macaques on their rock roof at the lens's height, left, two juveniles leaping to and
//         fro on their own clocks; 0.36-0.52 a wide climbing left turn over the orchard, the eye on the
//         fall that steps down the spur (0.372-0.462); 0.52-0.555 round the serow's crag, 8.5 m off at its eye level;
//         0.56-0.59 homeward down the slope, the tree whole and still against the dark east bank; the gust overtakes us
//         at 0.575 and reaches the tree at 0.59: over 0.59-0.75 the curtain swings up and streams, the fallen petals
//         climb round the crown and the moss, the terrace and the stream clear to green, as we pass above it with the
//         eye held on the tree (rare: a hawk-eagle stoops through the petals at 0.672-0.688); 0.75-1 the climb in the
//         storm (the grove floors give up their fall ahead of the lens, swallows from 0.76; from 0.705 three braided
//         streams of petals come up off the sasa and pour into the ring); the ring between two wind-bent cherries in
//         full blossom, blue ridges either side.
// COST    what cannot be seen is not drawn: the saddle's sasa and the ring's streams from u 0.70, the loop's sasa over
//         0.47-0.745, the great tree's true blossoms over 0.165-0.80; the tree's strands, blossoms and petals are culled.
import * as THREE from 'three';
import { makePath, clamp, lerp, smoothstep, makeRng, hashSeed } from '../kit/core.js';
import { makeSky, skyDirection } from '../kit/sky.js';
import * as T from '../kit/terrain.js';
import * as flora from '../kit/flora.js';
import * as F from '../kit/fauna.js';
import * as fx from '../kit/fx.js';
import { buildHero, GLSL_LIGHT, GLSL_SHAPE } from '../parts/petal-storm.js';

const PALETTE = ['#F6E6E8', '#F2B8C6', '#D4567A', '#A8553A', '#1F3B30', '#5FA08C', '#BCD3E0'];
const TY = 14, WHX = -0.664, WHZ = 0.748, P0 = [-136, 71, 150], SP = 330, HW = 5.2;
const HS = 1.4;                                     // the hero stands larger than its part was drawn: 26 m tall, 39 m across
const LX = 8 * HS, LY = TY + 2.5 * HS, PX = -22 * HS, PY = TY + 20 * HS;      // the corridor under the crown; the pass beside it
const CRAG = [-45, -100], RO = 8.4, RB = 62.5;         // the serow's crag; the orbit round it; the wide turn that leads into the orbit
const ROOF = [3.6, -35.4], FRONT_V = 19, RR = 9;      // RR: the ring's radius (a great ring: it has to read from the tree, 190 m off)
const FALL = [-36, -164, -41, -232];                // the spur's fall: foot x, z; head x, z
const SPUR = [-25, 160, 92, 100];                   // the cedar spur that closes the valley head: centre x, half width east, height, half width west
const MAPBOX = [-760, -760, 1420, 1420];            // forest map: x0, z0, width, depth
const SHBOX = [-200, -190, 336, 416], SHN = [336, 416];   // shade map: one texel a metre

// ---------- the looks: hour and weather ----------
const LOOKS = {
  morning: {
    title: 'Thousand-Tree Mountain', hero: { hour: 'morning', weather: 'clear' }, el: 30, az: 100,
    sky: { preset: 'day', zenith: '#4f86c6', mid: '#86b0d8', horizon: '#bcd3e0', ground: '#8fa4a6', clouds: { coverage: 0.3, scale: 1.25, lit: '#f6f1ea', shade: '#8b9bb6' }, clouds2: { opacity: 0.22 } },
    sun: '#fff1dc', sunI: 3.0, hemiSky: '#a8c8e4', hemiGround: '#5e8270', hemiI: 1.5, fog: '#a9c3d8', fogD: 0.0007, haze: 1,
    shade: [-1e4, 10, 1], heroSun: 1, mist: 0.16, exposure: 0.92, bloom: 0.26, sat: 1.08, tint: '#fffaf4', shadow: '#0f1e22', portal: '#ffd9e2', cloudShadow: 0.5, snow: 0,
  },
  dawn: {
    title: 'Thousand-Tree Mountain, First Light', hero: { hour: 'dawn', weather: 'clear' }, el: 8, az: 97,
    // the sun is just over the east wall: it reaches down to the crowns along the stream and lies in warm pools on the banks,
    // and the sky overhead is already blue between a few rose clouds
    sky: { preset: 'dawn', zenith: '#27509c', mid: '#6c90d4', horizon: '#f0b9a8', horizonPow: 4.6, clouds: { coverage: 0.24, lit: '#ffd2c2', shade: '#6f76a6' }, clouds2: { opacity: 0.16, coverage: 0.42 } },
    sun: '#ffc39a', sunI: 3.0, hemiSky: '#c6bee2', hemiGround: '#6e6884', hemiI: 1.8, fog: '#a9aed2', fogD: 0.0015, haze: 0.55,
    shade: [10, 10, 0.2], pools: 0.85, heroSun: 0.75, mist: 0.34, exposure: 1.1, bloom: 0.3, sat: 1.06, tint: '#fff6f6', shadow: '#141a30', portal: '#ffd0c8', cloudShadow: 0, snow: 0,
  },
  golden: {
    title: 'Thousand-Tree Mountain, Last Light', hero: { hour: 'afternoon', weather: 'clear' }, el: 9, az: 287,
    sky: { preset: 'goldenHour', zenith: '#2a55a4', mid: '#7594cc', horizon: '#f0c68c', clouds: { coverage: 0.3, lit: '#ffd9a8', shade: '#6d6890' } },
    sun: '#ffb46a', sunI: 3.2, hemiSky: '#c2c0de', hemiGround: '#6c6678', hemiI: 1.75, fog: '#9fb0d2', fogD: 0.0009, haze: 0.8,
    shade: [24, 12, 0.16], heroSun: 0.55, mist: 0.2, exposure: 1.06, bloom: 0.32, sat: 1.08, tint: '#fff4ea', shadow: '#161c32', portal: '#ffd8a0', cloudShadow: 0, snow: 0,
  },
  snow: {
    title: 'Thousand-Tree Mountain, Late Snow', hero: { hour: 'morning', weather: 'snow' }, el: 30, az: 100,
    sky: { preset: 'day', zenith: '#7f9cbe', mid: '#a9bcd0', horizon: '#ccd6de', ground: '#9aa6aa', clouds: { coverage: 0.62, scale: 1.1, lit: '#eceae6', shade: '#8590a4' }, clouds2: { opacity: 0.4 }, sunIntensity: 7 },
    sun: '#f6efe6', sunI: 2.3, hemiSky: '#b4c4d8', hemiGround: '#5c6a60', hemiI: 1.55, fog: '#b6c4d2', fogD: 0.0012, haze: 0.7,
    shade: [-1e4, 10, 1], heroSun: 0.85, mist: 0.2, exposure: 0.95, bloom: 0.24, sat: 1.0, tint: '#f6faff', shadow: '#161e26', portal: '#e8f0ff', cloudShadow: 0.6, snow: 1,
  },
  moon: {
    title: 'Thousand-Tree Mountain by Moonlight', hero: { hour: 'moon', weather: 'clear' }, el: 34, az: 100,
    sky: { preset: 'night', zenith: '#0b1634', mid: '#18274e', horizon: '#33456f', bodyOverrides: { 0: { elevation: 34, azimuth: 100, size: 2.6, phase: 1 } }, clouds: { coverage: 0.2 }, milkyWay: 0.3, starDensity: 0.4, stars: 0.7 },
    sun: '#c9d6ff', sunI: 3.1, hemiSky: '#5a6ea6', hemiGround: '#222e48', hemiI: 1.2, fog: '#1a2440', fogD: 0.0006, haze: 0.5, contrast: 1.05,
    shade: [-1e4, 10, 1], heroSun: 1, mist: 0.12, exposure: 1.5, bloom: 0.42, sat: 0.9, tint: '#eef2ff', shadow: '#060c20', portal: '#c8d8ff', cloudShadow: 0, snow: 0,
  },
};

// ---------- shared GLSL ----------
const GLSL_PS = /* glsl */`
  uniform vec4 uPsShade;      // terminator height, softness, sun kept in the shade, 0
  uniform vec4 uPsFront;      // gust front: metres along the wind, wind x, wind z, time
  float psLit(float y){ return mix(uPsShade.z, 1.0, smoothstep(uPsShade.x - uPsShade.y, uPsShade.x + uPsShade.y, y)); }
  float psGust(vec2 xz){ return (uPsFront.x - dot(xz, uPsFront.yz))/${FRONT_V.toFixed(1)}; }      // seconds since the front passed
  float psH1(vec2 p){ p = fract(p*vec2(0.1031, 0.1030)); p += dot(p, p.yx + 33.33); return fract((p.x + p.y)*p.y); }
  vec2 psH2(vec2 p){ vec3 q = fract(vec3(p.xyx)*vec3(0.1031, 0.1030, 0.0973)); q += dot(q, q.yzx + 33.33); return fract((q.xx + q.yz)*q.zy); }
  float psVN(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0 - 2.0*f);
    return mix(mix(psH1(i), psH1(i + vec2(1.0, 0.0)), f.x), mix(psH1(i + vec2(0.0, 1.0)), psH1(i + vec2(1.0, 1.0)), f.x), f.y); }
`;
// blue aerial haze on the dark forest and the land: it thickens with distance and toward the ridge lines, so each rank of
// cedar steps back paler and bluer than the one in front of it
const GLSL_HAZE = /* glsl */`
  uniform vec4 uPsHaze;
  float psHazeK(vec3 w){ float d = distance(w, cameraPosition); return clamp(uPsHaze.w*(1.0 - exp(-d/3800.0))*(1.0 + 1.0*smoothstep(40.0, 180.0, w.y)), 0.0, 0.8); }
`;
// the far canopy and the petal litter, painted into the kit terrain
const GLSL_LAND = /* glsl */`
  uniform sampler2D tPsForest, tPsShade; uniform vec4 uPsMapBox, uPsShBox; uniform vec3 uPsStage[5]; uniform vec3 uPsCedar, uPsPale, uPsMoss, uPsSunC; uniform vec4 uPsCan, uPsDap, uPsKnoll; uniform vec2 uPsSunXZ;
  vec3 psStageCol(float s){ s = clamp(s, 0.0, 3.999); int i = int(s); return mix(uPsStage[i], uPsStage[i + 1], fract(s)); }
`;
const fogU = () => THREE.UniformsUtils.clone(THREE.UniformsLib.fog);
const lightU = () => THREE.UniformsUtils.clone(THREE.UniformsLib.lights);

// Adds this world's terminator (valley in shade, sun above a height) to a lit kit material; on the terrain it also
// paints the canopy of the thirty thousand, the gust front crossing it, and fallen petals.
function psPatch(mat, S, kind) {
  const prev = mat.onBeforeCompile, prevKey = mat.customProgramCacheKey;
  mat.onBeforeCompile = function (shader, renderer) {
    if (prev) prev.call(mat, shader, renderer);
    shader.uniforms.uPsShade = S.uShade; shader.uniforms.uPsFront = S.uFront;
    let fs = shader.fragmentShader, vs = shader.vertexShader;
    if (kind === 'terrain') {
      Object.assign(shader.uniforms, { tPsForest: S.tForest, tPsShade: S.tShade, uPsShBox: S.uShBox, uPsMapBox: S.uMapBox, uPsStage: S.uStage, uPsCedar: S.uCedar, uPsPale: S.uPale, uPsCan: S.uCan, uPsSunXZ: S.uSunXZ, uPsHaze: S.uHaze, uPsMoss: S.uMoss, uPsSunC: S.uSunCol, uPsDap: S.uDap, uPsKnoll: S.uKnoll });
      fs = fs.replace('#include <common>', '#include <common>\n' + GLSL_PS + GLSL_LAND + GLSL_HAZE);
      fs = fs.replace('#include <fog_fragment>', 'gl_FragColor.rgb = mix(gl_FragColor.rgb, uPsHaze.rgb, psHazeK(vTWorld));\n#include <fog_fragment>');
      // (uPsDap: pools of low sun lying on the ground between the trees, drifting as the crowns sway; y is their strength below the terminator, at first light)
      fs = fs.replace('#include <aomap_fragment>', `{ float psM = psLit(vTWorld.y); reflectedLight.directDiffuse *= psM; reflectedLight.directSpecular *= psM;
          float psDp = smoothstep(0.46, 0.72, psVN(vTWorld.xz*0.15 + vec2(uPsFront.w*0.015, 0.0))*0.62 + psVN(vTWorld.xz*0.47 + 4.0)*0.38);
          reflectedLight.directDiffuse += diffuseColor.rgb*RECIPROCAL_PI*uPsSunC*(psDp*(uPsDap.x*psM + uPsDap.y*(1.0 - psM))); }
#include <aomap_fragment>`);
      const anchor = 'gTSnow = sn; gTWet = wet; gTSpark *= 1. - rock;';
      // (the kit lays its ground relief on the map, so on a steep face it is drawn out down the slope into streaks: there it is
      // mostly smoothed away, and this world's own cover does the work)
      { const grad = 'gTGrad = (gMid + gFine + gNear * (1. - sn) + vec3(0., bed * 1.2, 0.)) * (1. + .8 * rock) * (1. - .7 * sn);';
        if (fs.includes(grad)) fs = fs.replace(grad, grad + '\n  gTGrad *= mix(1.0, 0.3, smoothstep(0.9, 0.72, wnS.y))*(1.0 - 0.92*psGz)*(1.0 - 0.92*psDeg)*(1.0 - psKn)*(1.0 - 0.85*psOb);'); }
      // (and where the eye meets the ground at a low angle, a metre or two above it, every fine pattern laid on the map is drawn
      // out along the horizon into streaks: there the kit's grain and relief give way to the ground's plain colour, psGz)
      { const base = '  vec3 c = diffuseColor.rgb;\n  float macro';
        if (fs.includes(base)) fs = fs.replace(base, '  vec3 c = diffuseColor.rgb; vec3 psBase = c;\n  float macro'); else fs = fs.replace(anchor, 'vec3 psBase = diffuseColor.rgb;\n' + anchor); }
      if (fs.includes(anchor)) fs = fs.replace(anchor, /* glsl */`
        float psGz = (1.0 - smoothstep(0.06, 0.26, abs(dot(normalize(cameraPosition - wp), wnS))))*(1.0 - smoothstep(30.0, 70.0, distance(wp, cameraPosition)));
        diffuseColor.rgb = mix(diffuseColor.rgb, psBase*mix(vec3(1.0), uTPatch, 0.35*uTDetail.z), 0.9*psGz*(1.0 - rock)*(1.0 - sn));
        // (THE SMEAR beside the crag: on steep ground the kit lays its fine grain on from the side, along one fixed axis; a face
        // that looks along that axis gets the grain drawn out along its contours into streaks metres long. There the fine grain
        // is taken back out, and the mid grain, which runs down a steep face, is thinned)
        // (and on the serow's knoll, flown round at nine metres, the kit's rock mask is not used at all: its edge is cut by the
        // same grain, so moss and ground came out in stripes along the flank; the knoll takes a smooth mask and the plain ground colour)
        float psKn = 1.0 - smoothstep(24.0, 34.0, distance(wp.xz, uPsKnoll.xy));
        float psRk = mix(rock, 1.0 - smoothstep(uTSlope.x, uTSlope.y, wnS.y + (tM.r - 0.5)*0.12), psKn);
        // (THE STREAKS BESIDE THE CRAG were the kit's ground relief: bumps laid on the map, lit three times over near the lens;
        // seen aslant from close by, each bump is squeezed to a dark line, and the lines run together across the slope. Near
        // the lens the relief now fades as the ground turns away from the eye, and the knoll carries none: its moss cushions,
        // drifts and petals are painted along the slope instead)
        float psOb = (1.0 - smoothstep(0.25, 0.65, abs(dot(normalize(cameraPosition - wp), wnS))))*(1.0 - smoothstep(30.0, 70.0, distance(wp, cameraPosition)));
        float psDeg = (side ? 1.0 : 0.0)*smoothstep(0.45, 0.85, abs(dot(wnS.xz/max(length(wnS.xz), 1e-4), vec2(0.8, 0.6))));
        { float psG0 = 1.0 + uTDetail.x*grain*(1.0 + 0.6*rock);
          float psG1 = 1.0 + uTDetail.x*(grain - (fR - 0.5)*0.9*psDeg - (dR - 0.5)*0.5*steep)*(1.0 + 0.6*rock);
          float psA0 = 1.0 - uTDetail.x*0.3*smoothstep(0.55, 0.95, fA)*(0.1 + 0.9*rock)*(0.4 + 1.2*tM.r);
          diffuseColor.rgb *= (psG1/max(psG0, 0.2))*mix(1.0, 1.0/max(psA0, 0.2), psDeg)*(1.0 - sn) + sn; }
        { vec4 psF = texture2D(tPsForest, (wp.xz - uPsMapBox.xy)/uPsMapBox.zw);
          float psD = distance(wp, cameraPosition);
          // the ground's patterns are laid on the map; on the serow's knoll, whose flank is steep and seen from beside it, they
          // are laid along the slope instead (the map is drawn out from the crag by the height fallen), so nothing there is smeared
          vec2 psKv = wp.xz - uPsKnoll.xy; float psKr = length(psKv), psKq = psKr/11.5;
          vec2 psX = wp.xz + psKv/max(psKr, 0.05)*(0.45*uPsKnoll.z*(1.0 - exp(-psKq*psKq*psKq))*(1.0 - smoothstep(20.0, 75.0, psKr)));
          diffuseColor.rgb = mix(diffuseColor.rgb, psBase, psKn*(1.0 - sn));
          vec2 psQ = wp.xz/8.5, psI = floor(psQ), psFr = fract(psQ);
          float psW = fwidth(psQ.x) + fwidth(psQ.y);
          float psMd = 9.0, psMh = 0.5; vec2 psMo = vec2(0.0);
          for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
            vec2 g = vec2(float(i), float(j)), o = psH2(psI + g), r = g + o - psFr; float d = dot(r, r);
            if (d < psMd) { psMd = d; psMo = r; psMh = o.x; } }
          float psFlat = smoothstep(0.5, 1.6, psW);                                   // cells under a pixel: their mean
          float psDome = mix(1.0 - smoothstep(0.0, 0.6, psMd), 0.5, psFlat);
          float psSun = mix(clamp(0.5 - dot(psMo, uPsSunXZ)*1.2, 0.0, 1.0), 0.5, psFlat);
          float psTau = psGust(wp.xz), psWave = smoothstep(0.0, 0.5, psTau)*(1.0 - smoothstep(1.2, 4.5, psTau));
          float psSt = psF.b*4.0 + (psMh - 0.5)*0.8*(1.0 - psFlat);
          vec3 psCrown = psStageCol(psSt)*(0.5 + 0.75*psSun*psDome + 0.2*psDome);
          psCrown = mix(psCrown, uPsPale, 0.5*psWave);
          vec3 psCed = uPsCedar*(0.26 + 0.74*psSun*psDome + 0.14*psDome)*mix(vec3(0.82, 1.0, 1.12), vec3(1.12, 1.04, 0.8), psSun)*(1.0 + 0.5*psWave);
          float psCm = smoothstep(0.42, 0.58, psF.r + (psMh - 0.5)*0.25*(1.0 - psFlat));
          vec3 psCan = mix(psCrown, psCed, psCm);
          // cedar closes its canopy from near at hand: between the spires the ground is more crowns, never bare floor
          float psK = mix(smoothstep(uPsCan.x, uPsCan.y, psD), smoothstep(22.0, 70.0, psD), psCm)*max(psF.g, psF.r)*(1.0 - 0.75*rock*(1.0 - psF.r))*(1.0 - sn);
          psK *= mix(mix(smoothstep(0.95, 0.45, psMd), 1.0, 0.7*psCm), 0.8, psFlat);
          vec3 psC = mix(diffuseColor.rgb, psCan, psK);
          psC = mix(psC, psCed*0.8, psF.r*rock*0.85*(1.0 - sn));                       // under cedar a steep face is forest, not bare stone
          psC = mix(psC, uPsMoss*(0.7 + 0.55*psVN(psX*1.9)), psRk*(1.0 - psF.r)*(1.0 - sn)*0.9*max(smoothstep(0.1, 0.34, psVN(psX*0.33 + 11.0)*0.6 + psVN(psX*1.3)*0.4), 1.0 - smoothstep(22.0, 32.0, distance(wp.xz, vec2(${CRAG[0].toFixed(1)}, ${CRAG[1].toFixed(1)})))));   // thick moss on every rock, and the serow's knoll is moss all over
          // LAST WEEK'S FALL lies in drifts on moss and rock, pink over green, until the gust front reaches it: then it goes up
          // (a pale band runs with the front) and the ground behind the front is green again
          vec2 psP = psX*7.0, psPi = floor(psP), psPf = fract(psP) - 0.5; float psPw = fwidth(psP.x) + fwidth(psP.y);
          vec2 psPo = psH2(psPi); float psDot = 1.0 - smoothstep(0.1 + 0.1*psPo.y, 0.2 + 0.1*psPo.y + psPw*0.5, length(psPf - (psPo - 0.5)*0.82));
          float psGone = smoothstep(0.2, 3.6, psTau - 1.2*psVN(psX*0.07 + 3.0)), psKeep = 1.0 - 0.9*psGone;
          float psDrift = smoothstep(0.44, 0.7, psVN(psX*0.3)*0.6 + psVN(psX*1.3 + 7.0)*0.4 + 0.2*(psF.a - 0.5))*psF.a*uPsCan.z*(1.0 - sn)*psKeep*(1.0 - mix(0.92, 0.5, smoothstep(22.0, 32.0, distance(wp.xz, vec2(${CRAG[0].toFixed(1)}, ${CRAG[1].toFixed(1)}))))*psRk);
          float psNear = 1.0 - smoothstep(0.5, 1.6, psPw);
          vec3 psPink = mix(uPsPale, uPsStage[3], 0.8)*vec3(1.06, 0.9, 0.98);
          float psRag = smoothstep(0.3, 0.6, psVN(psX*0.8 + 17.0)*0.6 + psVN(psX*2.6 + 3.0)*0.4 + 0.3*(psDrift - 0.5));       // a drift is ragged: green shows through it
          float psThick = smoothstep(0.45, 0.8, psDrift + 0.5*(psVN(psX*4.3 + 2.0) - 0.5))*(0.62 + 0.3*psVN(psX*11.0))*(0.35 + 0.65*psRag);
          // sasa thickets, moss cushions and leaf litter: the ground is a broken carpet, mottled at two scales, never brushed
          { float psNearK = (1.0 - smoothstep(70.0, 170.0, psD))*psF.g*(1.0 - 0.45*rock)*(1.0 - sn);
            float psTh = smoothstep(0.4, 0.62, psVN(psX*0.19 + 3.0)*0.65 + psVN(psX*0.83)*0.35);
            float psBl = psVN(psX*2.1 + 3.0*psVN(psX*0.47));
            psC = mix(psC, psC*mix(vec3(0.38, 0.52, 0.34), vec3(1.02, 1.08, 0.84), psBl), psTh*0.8*psNearK);
            vec2 psMq = psX*2.3 + 1.7*vec2(psVN(psX*0.8 + 5.0), psVN(psX*0.8 + 13.0)), psMi = floor(psMq), psMf = fract(psMq);
            float psMw = fwidth(psMq.x) + fwidth(psMq.y), psCd = 9.0, psCh = 0.5;
            for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
              vec2 g = vec2(float(i), float(j)), o = psH2(psMi + g), r = g + o - psMf; float d = dot(r, r);
              if (d < psCd) { psCd = d; psCh = o.y; } }
            float psMk = (1.0 - smoothstep(0.3, 1.1, psMw))*(1.0 - 0.5*rock)*(1.0 - sn)*psF.g;
            psC *= mix(1.0, (0.58 + 0.66*(1.0 - smoothstep(0.0, 0.5, psCd)))*(0.84 + 0.32*psCh), psMk);                 // cushions of moss, dark between
            psC = mix(psC, vec3(0.15, 0.11, 0.065)*(0.7 + 0.6*psPo.y), 0.6*psMk*step(0.83, psCh)*(1.0 - smoothstep(0.04, 0.26, psCd))); }   // last year's leaves
          // (the petals lie ON the moss and the leaves, so they go on last)
          psC = mix(psC, psPink*(0.92 + 0.3*psPo.y), mix(0.85*psDrift*psRag, max(psDot*step(psPo.x, 0.012 + 0.03*psKeep + 0.3*psDrift), psThick), psNear)*psF.a*(1.0 - smoothstep(110.0, 260.0, psD)));
          psC = mix(psC, uPsPale, 0.3*psWave*psF.a*min(uPsCan.z, 1.0)*(1.0 - sn)*(1.0 - 0.6*psCm));
          // a soft pool of shade under every tree and stone
          { float psS = texture2D(tPsShade, (wp.xz - uPsShBox.xy)/uPsShBox.zw).r;
            psC = mix(psC, psC*vec3(0.4, 0.5, 0.6), psS); }
          diffuseColor.rgb = psC; }
        ` + anchor);
    } else if (kind === 'flora') {
      fs = fs.replace('#include <common>', '#include <common>\n' + GLSL_PS);
      const anchor = 'reflectedLight.indirectDiffuse *= mix(uFloraLight.y, uFloraLight.z, fLeaf);';
      if (fs.includes(anchor)) fs = fs.replace(anchor, 'reflectedLight.directDiffuse *= psLit(vFloraWorld.y);\n' + anchor);
      else fs = fs.replace('#include <aomap_fragment>', '#include <aomap_fragment>\nreflectedLight.directDiffuse *= psLit(vFloraWorld.y);');
    } else {
      vs = vs.replace('#include <common>', '#include <common>\nvarying float vPsY;').replace('#include <project_vertex>', `#include <project_vertex>
        { vec4 psW = vec4(transformed, 1.0);
          #ifdef USE_INSTANCING
            psW = instanceMatrix*psW;
          #endif
          vPsY = (modelMatrix*psW).y; }`);
      fs = fs.replace('#include <common>', '#include <common>\nvarying float vPsY;\n' + GLSL_PS);
      fs = fs.replace('#include <aomap_fragment>', '{ float psM = psLit(vPsY); reflectedLight.directDiffuse *= psM; reflectedLight.directSpecular *= psM; }\n#include <aomap_fragment>');
    }
    shader.fragmentShader = fs; shader.vertexShader = vs;
  };
  mat.customProgramCacheKey = function () { return (prevKey ? prevKey.call(mat) : '') + '|ps-' + kind; };
  mat.needsUpdate = true;
  return mat;
}

// ---------- blossom clumps: every cherry, maple and azalea crown is a cloud of these camera-facing cards ----------
// atlas 2 x 2: cells 0, 1 blossom clusters with a few young leaves; 2 thin blossom among leaves; 3 leaves only.
// r = shade, g = leaf, b = dark heart, a = cover
function makeClumpAtlas(rng) {
  const N = 512, C = N / 2, cv = document.createElement('canvas'); cv.width = N; cv.height = N;
  const g = cv.getContext('2d'); g.clearRect(0, 0, N, N);
  const leafAt = (x, y, a, len, sh) => {
    g.save(); g.translate(x, y); g.rotate(a); g.fillStyle = `rgb(${Math.round(sh * 255)},255,0)`;
    g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(len * 0.5, -len * 0.3, len, 0); g.quadraticCurveTo(len * 0.5, len * 0.3, 0, 0); g.fill(); g.restore();
  };
  const blossom = (x, y, r, sh) => {
    const a0 = rng.range(0, 6.28);
    for (let k = 0; k < 5; k++) {
      const a = a0 + k * 1.2566, px = x + Math.cos(a) * r * 0.5, py = y + Math.sin(a) * r * 0.5;
      g.save(); g.translate(px, py); g.rotate(a); g.fillStyle = `rgb(${Math.round(clamp(sh + rng.range(-0.08, 0.08), 0, 1) * 255)},0,0)`;
      g.beginPath(); g.ellipse(0, 0, r * 0.56, r * 0.4, 0, 0, 6.2832); g.fill(); g.restore();
    }
    g.fillStyle = `rgb(${Math.round(sh * 200)},0,255)`; g.beginPath(); g.arc(x, y, r * 0.2, 0, 6.2832); g.fill();
  };
  for (let cell = 0; cell < 4; cell++) {
    const ox = (cell % 2) * C + C / 2, oy = Math.floor(cell / 2) * C + C / 2, R = C * 0.4;
    const nB = cell < 2 ? 34 : cell === 2 ? 12 : 0, nL = cell < 2 ? 3 : cell === 2 ? 12 : 26;
    if (cell < 2) for (let i = 0; i < 30; i++) {                                    // the mass of the clump: blossom behind blossom, in its own shade
      const a = rng.range(0, 6.28), d = R * 0.78 * Math.sqrt(rng()), r = rng.range(15, 27) * (1 - 0.35 * d / R);
      g.fillStyle = `rgb(${Math.round(rng.range(0.42, 0.62) * 255)},0,0)`; g.beginPath(); g.arc(ox + Math.cos(a) * d, oy + Math.sin(a) * d, r, 0, 6.2832); g.fill();
    }
    for (let i = 0; i < nL; i++) {
      const a = rng.range(0, 6.28), d = R * Math.sqrt(rng()) * 0.85;
      leafAt(ox + Math.cos(a) * d, oy + Math.sin(a) * d, a + rng.range(-0.9, 0.9), rng.range(22, 36) * (cell === 3 ? 1.25 : 1), rng.range(0.45, 1));
    }
    for (let i = 0; i < nB; i++) {
      const a = rng.range(0, 6.28), d = R * Math.sqrt(rng());
      blossom(ox + Math.cos(a) * d, oy + Math.sin(a) * d, rng.range(11, 17), lerp(1, 0.74, d / R) * rng.range(0.86, 1));
    }
  }
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.NoColorSpace; tex.anisotropy = 2;
  return tex;
}

function clumpMaterial(S, atlas) {
  return new THREE.ShaderMaterial({
    fog: true, side: THREE.DoubleSide, alphaToCoverage: true,
    uniforms: { ...fogU(), uPsShade: S.uShade, uPsFront: S.uFront, uSunDir: S.uSunDir, uSunCol: S.uSunCol, uSky: S.uSky, uGround: S.uGround, uPale: S.uPale, uLeaf: S.uLeaf, tAtlas: { value: atlas } },
    vertexShader: /* glsl */`
      attribute vec4 iP, iN, iC, iR;   // centre, size | outward normal, ao | petal colour, cell + 4 x leaf colour | spin, phase, sway, shed
      varying vec2 vUv; varying vec3 vN, vCol, vW; varying vec4 vK;
      #include <common>
      #include <fog_pars_vertex>
      ${GLSL_PS}
      void main(){
        float tm = uPsFront.w; vec3 c = iP.xyz;
        float tau = psGust(c.xz), tp = max(tau, 0.0), gk = smoothstep(0.0, 0.6, tau);
        float heave = gk*(0.5 + 1.3*exp(-0.45*tp)*sin(tp*2.6 + iR.y));
        float calm = sin(tm*1.1 + iR.y + dot(c.xz, vec2(0.07, 0.05)))*0.5 + sin(tm*2.3 + iR.y*1.7)*0.25;
        float fl = sin(tm*(5.0 + 3.0*fract(iR.y)) + iR.y*3.0);
        c.xz += uPsFront.yz*((calm*0.13 + heave*0.9 + gk*fl*0.12)*iR.z);
        c.y += (gk*fl*0.08 - heave*0.12 + calm*0.03)*iR.z;
        float sz = iP.w*(1.0 + 0.05*calm);                 // every crown stays full: the gust heaves it and takes nothing
        vec4 mvPosition = viewMatrix*vec4(c, 1.0);
        float a = iR.x + 0.07*calm + 0.22*gk*fl;
        vec2 q = position.xy*sz, r = vec2(q.x*cos(a) - q.y*sin(a), q.x*sin(a) + q.y*cos(a));
        mvPosition.xy += r;
        gl_Position = projectionMatrix*mvPosition;
        float cell = mod(iC.w, 4.0);
        vUv = (uv + vec2(mod(cell, 2.0), floor(cell*0.5)))*0.5;
        vN = iN.xyz; vCol = iC.rgb; vW = c;
        vK = vec4(mix(0.42, 0.2, smoothstep(40.0, 220.0, -mvPosition.z)), floor(iC.w*0.25), iN.w, smoothstep(0.0, 0.5, tau)*(1.0 - smoothstep(1.2, 4.0, tau)));
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      uniform sampler2D tAtlas; uniform vec3 uSunDir, uSunCol, uSky, uGround, uPale; uniform vec3 uLeaf[4];
      varying vec2 vUv; varying vec3 vN, vCol, vW; varying vec4 vK;
      #include <common>
      #include <fog_pars_fragment>
      ${GLSL_PS}
      void main(){
        vec4 t = texture2D(tAtlas, vUv);
        if (t.a < vK.x) discard;
        float lf = step(0.5, t.g);
        vec3 alb = mix(vCol*mix(vec3(0.66, 0.5, 0.55), vec3(1.0), smoothstep(0.4, 0.95, t.r)), uLeaf[int(vK.y)]*(0.45 + 0.65*t.r), lf);
        alb = mix(alb, alb*vec3(0.8, 0.55, 0.62), step(0.5, t.b)*(1.0 - lf)*0.45);
        alb = mix(alb, uPale, 0.22*vK.w*(1.0 - lf));
        vec3 N = normalize(vN), V = normalize(vW - cameraPosition);
        float nl = dot(N, uSunDir), wrap = max((nl + 0.45)/1.45, 0.0), toSun = max(dot(V, uSunDir), 0.0);
        vec3 sun = uSunCol*psLit(vW.y);
        vec3 hemi = mix(uGround, uSky, N.y*0.5 + 0.5);
        float ao = vK.z;
        vec3 c = alb*RECIPROCAL_PI*(sun*wrap*(0.35 + 0.65*ao) + hemi*(0.3 + 0.7*ao))*mix(0.6, 1.0, smoothstep(-0.55, 0.3, N.y));      // the underside of a crown hangs in its own shade
        c += alb*vec3(1.05, 0.68, 0.78)*RECIPROCAL_PI*sun*(0.45*max(-nl, 0.0) + 0.55*toSun*toSun)*(1.0 - 0.4*lf)*(0.4 + 0.6*ao);
        gl_FragColor = vec4(c, 1.0);
        #include <fog_fragment>
      }`,
  });
}

// ---------- airborne petals: one triangle each ----------
// kind 'air': a treadmill round the lens. A fifth fall in still air until the gust front reaches them; the rest fly
// behind the front, packed into streams with clear lanes between, and skim the ground from a baked height map.
// kind 'burst': bound to the slope crowns, thrown up as a plume when the front passes each tree.
const GLSL_PETAL_OUT = /* glsl */`
        float spin = h1*40.0 + tm*(4.0 + 7.0*h2), be = h2*6.2832 + tm*(1.0 + 2.0*h1);
        vec3 e1 = vec3(cos(be), 0.0, -sin(be)), e2 = vec3(sin(be)*cos(spin), -sin(spin), cos(be)*cos(spin));
        vec4 mvPosition = viewMatrix*vec4(p, 1.0);
        float depth = max(-mvPosition.z, 0.05), pxw = 2.0*depth/(projectionMatrix[1][1]*uViewH);
        float sz = uSize*(0.8 + 0.5*h3)*mix(0.56, 1.0, smoothstep(1.5, 8.0, depth)), need = 3.0*pxw;      // by the lens a petal is three centimetres
        float keep = step(fract(h1*91.7 + h3*13.1), clamp(12.0*sz*sz/(need*need), 0.0, 1.0));
        float s = max(sz, need)*vis*keep*smoothstep(1.0, 2.2, depth);
        p += (e1*position.x + e2*(position.y - 0.5))*s;
        mvPosition = viewMatrix*vec4(p, 1.0);
        gl_Position = projectionMatrix*mvPosition;
        vQ = position.xy; vN = cross(e1, e2); vW = p; vTint = h2;
        #include <fog_vertex>`;
function petalMaterial(S, kind, extra) {
  const air = kind === 'air', stream = kind === 'stream';
  return new THREE.ShaderMaterial({
    fog: true, side: THREE.DoubleSide,
    uniforms: { ...fogU(), uPsShade: S.uShade, uPsFront: S.uFront, uSunDir: S.uSunDir, uSunCol: S.uSunCol, uSky: S.uSky, uGround: S.uGround, uPale: S.uPale, uShell: S.uShell, uRose: S.uRose,
      uViewH: S.uViewH, uSize: { value: air ? 0.05 : stream ? 0.072 : 0.046 }, uWindV: S.uWindV, ...extra },
    vertexShader: /* glsl */`
      attribute vec4 aS;
      uniform float uViewH, uSize; uniform vec3 uWindV;
      ${air ? 'uniform vec3 uCtr, uBox; uniform vec2 uAmt; uniform sampler2D tH; uniform vec4 uHBox;' : stream ? 'uniform vec3 uBzA[4], uBzB[4], uBzC[4], uSplit; uniform vec4 uStr;' : 'attribute vec3 aH;'}
      varying vec2 vQ; varying vec3 vN, vW; varying float vTint;
      #include <common>
      #include <fog_pars_vertex>
      ${GLSL_PS}
      void main(){
        float tm = uPsFront.w, h1 = fract(aS.w*17.3), h2 = fract(aS.w*59.1), h3 = fract(aS.w*113.7);
        ${air ? /* glsl */`
        float calm = step(aS.w, 0.2);
        vec3 vel = mix(uWindV*(0.72 + 0.56*h1), vec3(0.3*sin(h1*40.0), -0.8 - 0.35*h2, 0.3*cos(h2*40.0)), calm);
        vec3 p = aS.xyz*uBox + vel*tm;
        p += mix(vec3(1.1*sin(tm*1.7 + h1*31.0), 0.6*sin(tm*2.3 + h2*17.0), 1.1*cos(tm*1.3 + h3*23.0)), vec3(0.5*sin(tm*0.9 + h1*30.0), 0.0, 0.5*cos(tm*0.7 + h2*30.0)), calm);
        p = uCtr + mod(p - uCtr + 0.5*uBox, uBox) - 0.5*uBox;
        vec3 e = abs(p - uCtr)/(0.5*uBox); float edge = 1.0 - smoothstep(0.8, 1.0, max(e.x, max(e.y, e.z)));
        float g = textureLod(tH, (p.xz - uHBox.xy)/uHBox.zw, 0.0).r;
        float under = step(p.y, g + 0.3);
        p.y = mix(p.y, g + 0.3 + 3.0*h3 + 0.6*sin(tm*2.0 + h1*20.0), under*(1.0 - calm));
        float tau = psGust(p.xz);
        vec2 sd = vec2(-uPsFront.z, uPsFront.y); float lc = dot(p.xz, sd), al = dot(p.xz, uPsFront.yz);
        float lane = psVN(vec2(lc*0.13 + 1.0*sin(al*0.021) + 0.35*sin(al*0.063 + 1.7), (p.y - g)*0.12 + al*0.004));
        float storm = smoothstep(0.0, 0.9, tau)*mix(smoothstep(0.585, 0.63, lane), 1.0, step(0.992, h2))*step(h3, uAmt.y)*1.3;
        float still = (1.0 - smoothstep(-0.4, 0.5, tau))*step(h3, uAmt.x)*(1.0 - under);
        float vis = mix(storm, still, calm)*edge;` : stream ? /* glsl */`
        // THE STORM'S THREE LANES. Each is a long curve its petals run down in three braided strands, packed, with clear air
        // between: the great one leaves the lee of the weeping cherry and runs up the slope beside the flight, to its left and
        // below, the whole way to the ring; one comes over the crowns from the mountain side, one up out of the valley; all
        // three pour into the ring. They meander slowly, so the wind has a shape.
        float pk = aS.x; int si = pk < uSplit.x ? 0 : (pk < uSplit.y ? 1 : (pk < uSplit.z ? 2 : 3));
        vec3 A = si == 0 ? uBzA[0] : (si == 1 ? uBzA[1] : (si == 2 ? uBzA[2] : uBzA[3])), B = si == 0 ? uBzB[0] : (si == 1 ? uBzB[1] : (si == 2 ? uBzB[2] : uBzB[3])), C = si == 0 ? uBzC[0] : (si == 1 ? uBzC[1] : (si == 2 ? uBzC[2] : uBzC[3]));
        float fs = float(si), sp = uStr.y*(si == 0 ? 1.0 : 1.3), sq = fract(aS.y + tm*sp*(0.8 + 0.4*h1));
        vec3 p = mix(mix(A, B, sq), mix(B, C, sq), sq), tg = mix(B - A, C - B, sq);
        tg /= max(length(tg), 1e-4);
        vec3 sdv = cross(tg, vec3(0.0, 1.0, 0.0)); sdv /= max(length(sdv), 1e-4); vec3 upv = cross(sdv, tg);
        float mid = smoothstep(0.0, 0.2, sq)*(1.0 - smoothstep(0.72, 1.0, sq));
        p += sdv*(1.2*mid*sin(sq*9.0 + tm*0.4 + fs*2.0)) + upv*(0.7*mid*sin(sq*6.0 + tm*0.3 + fs));
        float rad = mix(uStr.z, uStr.w, sq)*(si == 0 ? 1.0 : 0.82)*smoothstep(-0.25, 0.25, sq);
        float sub = floor(h3*3.0), ba = sub*2.094 + sq*12.0 + tm*0.35 + fs*1.3, ja = aS.z*6.2832, jr = sqrt(aS.w)*0.5;
        vec2 off = (vec2(cos(ba), sin(ba)*0.7)*0.62*step(0.14, h2) + vec2(cos(ja), sin(ja))*mix(0.6*jr, 1.5*jr + 0.3, step(h2, 0.14)))*rad;
        p += sdv*off.x + upv*off.y + 0.35*vec3(sin(tm*2.3 + h1*31.0), sin(tm*1.9 + h2*29.0), cos(tm*2.1 + h3*17.0));
        float vis = smoothstep(0.0, 0.05, sq)*(1.0 - smoothstep(0.98, 1.0, sq))*uStr.x;` : /* glsl */`
        // last week's fall, lying under the groves: when the front reaches it, it goes up off the ground in a slow curl and
        // is carried away down the wind and up the slope
        float tau = psGust(aH.xz) - 2.2*aS.x, tp = max(tau, 0.0);
        float rise = (1.1 + 3.0*h2)*(tp - (1.0 - exp(-1.4*tp))/1.4);
        float d = ${FRONT_V.toFixed(1)}*(0.3 + 0.45*h1)*(tp - (1.0 - exp(-0.9*tp))/0.9);
        vec3 wn = normalize(uWindV), sdv = vec3(-wn.z, 0.0, wn.x), wh = vec3(wn.x, 0.0, wn.z);
        float ca = tp*1.9 + h3*6.2832, cr = min(1.5, 0.8*tp)*(0.5 + h1);
        vec3 p = aH + wn*d + vec3(0.0, rise + 0.14*d, 0.0) + (sdv*sin(ca) + wh*cos(ca))*cr
          + 0.5*vec3(sin(tm*2.3 + h1*31.0), sin(tm*1.9 + h2*29.0), cos(tm*2.1 + h3*17.0))*smoothstep(0.0, 1.0, tp);
        float vis = step(0.0, tau)*(1.0 - smoothstep(4.0 + 2.5*aS.y, 6.5 + 2.5*aS.y, tau));`}
        ${GLSL_PETAL_OUT}
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uSunDir, uSunCol, uSky, uGround, uPale, uShell, uRose;
      varying vec2 vQ; varying vec3 vN, vW; varying float vTint;
      #include <common>
      #include <fog_pars_fragment>
      ${GLSL_PS}
      ${GLSL_SHAPE}
      void main(){
        if (psPetalMask(vQ) < 0.5) discard;
        vec3 alb = mix(mix(uPale, uShell, smoothstep(0.2, 0.8, vTint)), uRose, smoothstep(0.86, 1.0, vTint)*0.6);
        alb = mix(uRose*0.8, alb, smoothstep(0.0, 0.3, vQ.y));
        vec3 N = normalize(vN), V = normalize(vW - cameraPosition);
        float toSun = max(dot(V, uSunDir), 0.0);
        vec3 sun = uSunCol*psLit(vW.y);
        vec3 c = alb*RECIPROCAL_PI*(sun*(0.5 + 0.5*abs(dot(N, uSunDir))) + mix(uGround, uSky, 0.6 + 0.4*N.y));
        c += alb*vec3(1.05, 0.66, 0.76)*RECIPROCAL_PI*sun*(0.7*toSun*toSun);
        gl_FragColor = vec4(c, 1.0);
        #include <fog_fragment>
      }`,
  });
}

// ---------- far petal streams: ribbons that follow the ground and bend round the spurs ----------
// Seen only from far off (they fade in between 50 and 110 m): each is a soft band of three braided strands that wander, thin
// out and break along its length, so the wind has a shape. Near the lens the storm is carried by true-size petals alone.
function ribbonMaterial(S, gain, uLane = S.uLane) {
  return new THREE.ShaderMaterial({
    fog: true, transparent: true, depthWrite: false, side: THREE.DoubleSide,
    uniforms: { ...fogU(), uPsShade: S.uShade, uPsFront: S.uFront, uSunCol: S.uSunCol, uSky: S.uSky, uGround: S.uGround, uPale: S.uPale, uShell: S.uShell, uLead: S.uLead, uLane, uGain: { value: gain } },
    vertexShader: /* glsl */`
      attribute vec3 aT; attribute vec4 aU;      // tangent | side, metres along, seed, half width
      varying vec4 vU; varying vec3 vW; varying float vDepth;
      #include <common>
      #include <fog_pars_vertex>
      void main(){
        vec3 wp = position, toCam = cameraPosition - wp;
        vec3 sd = cross(aT, toCam); sd /= max(length(sd), 1e-4);
        wp += sd*(aU.x*aU.w);
        vec4 mvPosition = viewMatrix*vec4(wp, 1.0);
        gl_Position = projectionMatrix*mvPosition;
        vU = aU; vW = wp; vDepth = -mvPosition.z;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uSunCol, uSky, uGround, uPale, uShell; uniform float uLead, uGain, uLane;
      varying vec4 vU; varying vec3 vW; varying float vDepth;
      #include <common>
      #include <fog_pars_fragment>
      ${GLSL_PS}
      void main(){
        float tm = uPsFront.w, tau = psGust(vW.xz) + uLead;
        float lane = step(1.5, vU.z);                                                 // one of the storm's three lanes: unbroken, and seen from nearer
        float on = mix(smoothstep(0.0, 2.5, tau), uLane, lane);
        float v = vU.y - tm*${FRONT_V.toFixed(1)}*(0.8 + 0.4*fract(vU.z)), across = vU.x, sd = vU.z*57.0;
        float a = 0.0, tone = 0.0;
        for (int i = 0; i < 3; i++) {
          float fi = float(i), ph = sd + fi*2.1;
          float cx = 0.5*sin(v*0.043 + ph) + 0.22*sin(v*0.107 + ph*1.7);
          float wd = 0.17 + 0.09*sin(v*0.031 + ph*2.3);
          float e = (across - cx)/wd;
          float brk = smoothstep(0.5, 0.74, psVN(vec2(v*0.019 + fi*13.0 + sd, fi*3.1 + 0.5)));
          float k = exp(-e*e)*max(brk, 0.72*lane); tone += k*fi; a = max(a, k);
        }
        float grain = (0.45 + 0.75*psVN(vec2(v*0.31, across*4.0 + sd)))*(0.55 + 0.9*smoothstep(0.35, 0.7, psVN(vec2(v*1.3, across*11.0 + sd))));
        float ends = smoothstep(0.0, 0.16, vU.y/210.0)*(1.0 - smoothstep(mix(0.8, 0.95, lane), 1.0, vU.y/210.0));
        float edge = 1.0 - smoothstep(0.62, 1.0, abs(across));
        float alpha = a*grain*on*ends*edge*mix(smoothstep(50.0, 110.0, vDepth), smoothstep(14.0, 40.0, vDepth), lane)*uGain*(1.0 + 1.0*lane);
        if (alpha < 0.004) discard;
        vec3 alb = mix(uPale, uShell, clamp(0.45 + 0.3*tone, 0.0, 0.9))*vec3(1.0, 0.9, 0.96);
        vec3 c = alb*RECIPROCAL_PI*(uSunCol*psLit(vW.y)*0.8 + mix(uGround, uSky, 0.7));
        gl_FragColor = vec4(c, alpha);
        #include <fog_fragment>
      }`,
  });
}

// ---------- sasa, where the lens runs low over open ground: clumps of broad blades that the gusts flatten in running waves ----------
// Instanced: iP = foot, scale | iC = colour, phase | iR = turn, how far it leans. A wave is a band across the wind in which
// the canes lie over and show the darker undersides of their blades.
function sasaGeometry() {
  const p = [], n = [], k = [], NB = 7;
  for (let b = 0; b < NB; b++) {
    const a = b / NB * 6.2832 + 0.4 * Math.sin(b * 2.7), c = Math.cos(a), s = Math.sin(a), up = 0.3 + 0.28 * ((b * 0.618) % 1), len = 0.5 + 0.22 * ((b * 0.381) % 1), w = 0.085 + 0.03 * ((b * 0.77) % 1);
    // a cane, then a lance-shaped blade that arches out and droops at its tip
    const R = [c * 0.03, 0.0, s * 0.03], M = [c * len * 0.45, up + 0.13, s * len * 0.45], T = [c * len, up + 0.03, s * len], L = [M[0] - s * w, M[1], M[2] + c * w], Rr = [M[0] + s * w, M[1], M[2] - c * w];
    const nx = -c * 0.45, ny = 0.86, nz = -s * 0.45;
    p.push(...R, ...L, ...Rr, ...L, ...T, ...Rr);
    for (let i = 0; i < 6; i++) n.push(nx, ny, nz);
    k.push(0, b, 0.6, b, 0.6, b, 0.6, b, 1, b, 0.6, b);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(n, 3)); g.setAttribute('aK', new THREE.Float32BufferAttribute(k, 2));
  return g;
}
function sasaMaterial(S) {
  return new THREE.ShaderMaterial({
    fog: true, side: THREE.DoubleSide,
    uniforms: { ...fogU(), uPsShade: S.uShade, uPsFront: S.uFront, uSunDir: S.uSunDir, uSunCol: S.uSunCol, uSky: S.uSky, uGround: S.uGround },
    vertexShader: /* glsl */`
      attribute vec2 aK, iR; attribute vec4 iP, iC;
      varying vec3 vN, vW, vCol; varying vec2 vK;
      #include <common>
      #include <fog_pars_vertex>
      ${GLSL_PS}
      void main(){
        float tm = uPsFront.w, ca = cos(iR.x), sa = sin(iR.x), h = aK.x;
        vec3 q = vec3(position.x*ca - position.z*sa, position.y, position.x*sa + position.z*ca)*iP.w;
        vec3 nn = vec3(normal.x*ca - normal.z*sa, normal.y, normal.x*sa + normal.z*ca);
        vec3 c = iP.xyz; vec2 wd = uPsFront.yz;
        float al = dot(c.xz, wd), ac = dot(c.xz, vec2(-wd.y, wd.x));
        float tau = psGust(c.xz), gk = smoothstep(0.0, 0.8, tau);
        float wave = 0.5 + 0.5*sin(al*0.36 - tm*(1.5 + 2.4*gk) + 1.9*sin(ac*0.11 + al*0.04) + 0.8*sin(ac*0.37));     // crests across the wind
        wave = smoothstep(0.35, 0.95, wave);
        float fl = sin(tm*(4.0 + 2.0*fract(iC.w)) + iC.w*7.0 + aK.y*1.3);
        float bend = (0.08 + 0.16*gk) + (0.3 + 0.42*gk)*wave + 0.05*fl*(0.5 + gk);
        q.xz += wd*(bend*h*h*0.95*iP.w) + wd*(iR.y*h*0.3*iP.w);
        q.y *= 1.0 - 0.42*bend*h;
        vec4 mvPosition = viewMatrix*vec4(c + q, 1.0);
        gl_Position = projectionMatrix*mvPosition;
        vN = normalize(nn + vec3(wd.x, 0.0, wd.y)*bend*0.8); vW = c + q; vCol = iC.rgb; vK = vec2(h, wave*(0.45 + 0.55*gk));
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uSunDir, uSunCol, uSky, uGround;
      varying vec3 vN, vW, vCol; varying vec2 vK;
      #include <common>
      #include <fog_pars_fragment>
      ${GLSL_PS}
      void main(){
        vec3 N = normalize(vN); if (!gl_FrontFacing) N = -N; N.y = abs(N.y);
        float h = vK.x;
        vec3 alb = vCol*mix(0.3, 1.18, smoothstep(0.0, 0.85, h));                 // dark in among the canes, bright at the blade tips
        alb = mix(alb, alb*vec3(0.5, 0.64, 0.6), vK.y*smoothstep(0.2, 0.7, h));    // lying over: the undersides show, darker and bluer
        float nl = dot(N, uSunDir), wrap = max((nl + 0.35)/1.35, 0.0);
        vec3 sun = uSunCol*psLit(vW.y);
        vec3 c = alb*RECIPROCAL_PI*(sun*wrap*mix(0.45, 1.0, h) + mix(uGround, uSky, N.y*0.5 + 0.5)*mix(0.5, 1.0, h));
        c += alb*vec3(0.9, 1.05, 0.45)*RECIPROCAL_PI*sun*0.3*max(-nl, 0.0)*h;      // thin blades: a little light comes through
        gl_FragColor = vec4(c, 1.0);
        #include <fog_fragment>
      }`,
  });
}

// ---------- the stream: clear water over a pebble bed, the sky and the blossom of its banks mirrored in it, flower rafts riding the current ----------
// Near the lens and along the banks the eye goes through the surface to the stones of the bed (each its own grey or ochre, the
// sun's net of light sliding over them); out in mid-stream the water deepens to bottle green; further off, where the eye meets
// the surface at a low angle, it is a mirror: the sky down the middle of the valley, the dark banks and their pink crowns
// either side, all broken by the ripples. The surface is drawn out along the flow (long glassy tongues, quick small ripples
// over them), stands in ringed waves upstream of every boulder and trails streaked foam below it. The fallen petals come
// down as hanaikada: long drift lines of single petals that gather along the banks and in every lee and part round the stones.
function streamMaterial(S, bTex, nCells, cellLen, along0) {
  return new THREE.ShaderMaterial({
    fog: true, transparent: true,
    uniforms: { ...fogU(), uPsShade: S.uShade, uPsFront: S.uFront, uSunDir: S.uSunDir, uSunCol: S.uSunCol, uSky: S.uSky, uGround: S.uGround, uPale: S.uPale, uShell: S.uShell,
      uSkyH: S.uSkyH, uSkyZ: S.uSkyZ, uJade: S.uJade, uRaft: S.uRaft, uBank: S.uCedar, uWat: S.uWat, tB: { value: bTex }, uBCell: { value: new THREE.Vector3(cellLen, nCells, along0) } },
    vertexShader: /* glsl */`
      attribute vec4 aSt;             // metres across, metres along, tangent x, tangent z
      varying vec3 vW; varying vec4 vSt;
      #include <common>
      #include <fog_pars_vertex>
      void main(){
        vec4 mvPosition = viewMatrix*vec4(position, 1.0);
        gl_Position = projectionMatrix*mvPosition;
        vW = position; vSt = aSt;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      precision highp sampler2D;
      uniform sampler2D tB; uniform vec3 uBCell, uSunDir, uSunCol, uSky, uGround, uPale, uShell, uSkyH, uSkyZ, uJade, uBank, uWat; uniform float uRaft;
      varying vec3 vW; varying vec4 vSt;
      #include <common>
      #include <fog_pars_fragment>
      ${GLSL_PS}
      // one boulder: x = white water, y = sideways push of the rafts (signed, metres), z = lee (still water behind it), w = inside the rock;
      // nrm takes the slope of the waves that stand round it; edd takes the eddy that turns in its lee (x = how far inside it,
      // y, z = a place on the turning raft: round it, and out from its centre)
      vec4 psBoulder(vec4 b, vec2 xz, vec2 tn, float tm, inout vec2 nrm, inout vec3 edd){
        if (b.z < 0.001) return vec4(0.0);
        vec2 r = xz - b.xy; float rr = max(b.z, 0.05), d = max(length(r), 1e-3);
        float al = dot(r, tn), ac = dot(r, vec2(-tn.y, tn.x)), e = d/rr, alp = max(al, 0.0);
        float up = smoothstep(0.5, -0.55, al/d);
        float ru = floor(b.w/64.0), rd = b.w - 64.0*ru, kn = (1.0 - smoothstep(0.5*rd, 0.85*rd, al))*(1.0 - smoothstep(0.5*ru, 0.85*ru, -al));
        // the pillow: a white crescent that stands a hand clear of the stone's upstream face, and a fainter one before it
        float e1 = (e - 1.5)/0.2, e2 = (e - 2.08)/0.13;
        float pillow = exp(-min(e1*e1, 40.0))*up*(0.82 + 0.18*sin(tm*5.0 + b.x*3.0));
        float wave2 = exp(-min(e2*e2, 40.0))*up*0.5;
        // the wake: two white arms that open down the flow, and churned water between them
        float ev = (abs(ac) - rr*(1.08 + 0.3*alp/rr))/(0.22*rr + 0.08);
        float vee = exp(-min(ev*ev, 40.0))*smoothstep(-0.3*rr, 0.8*rr, al)*exp(-alp/(4.6*rr));
        float tail = smoothstep(0.7*rr, 1.6*rr, al)*exp(-max(al - 1.6*rr, 0.0)/(2.6*rr))*(1.0 - smoothstep(0.3*rr, 1.1*rr, abs(ac)));
        float ring = 1.0 - smoothstep(1.0, 1.25, e);
        float lee = smoothstep(0.0, rr, al)*exp(-alp/(3.0*rr))*(1.0 - smoothstep(0.5*rr, 1.3*rr, abs(ac)));
        float push = sign(ac)*rr*exp(-min(max(e - 1.0, 0.0)*1.1, 40.0))*smoothstep(1.6*rr, -0.5*rr, al)*step(-2.5*rr, al)*0.9;
        // standing waves: rings pressed against its upstream face, and ripples shed down the arms of the wake
        float wv = sin((e - 1.0)*9.0)*exp(-max(e - 1.0, 0.0)*1.3)*up*smoothstep(1.0, 1.2, e) + 0.7*vee*sin(al*5.0/rr - tm*3.0);
        nrm += (r/d)*wv*0.55*kn;
        // the eddy below it, where a raft of petals turns
        vec2 q = r - tn*(3.3*rr) - vec2(-tn.y, tn.x)*(0.35*rr*sin(b.x*7.0)); float er = 1.35*rr, rho = length(q)/er;
        if (rho < 1.0 && (1.0 - rho)*kn > edd.x) edd = vec3((1.0 - rho)*kn, atan(q.y, q.x + 1e-4)*(b.y > 0.0 ? 1.0 : -1.0) + b.x*3.0, rho*er);
        return vec4(max(pillow + wave2, max(vee*0.75, tail*0.55))*kn, push*kn, lee*kn, ring);
      }
      float psWaveS(vec2 s, float tm){ return psVN(vec2(s.x*0.9, s.y*0.2 - tm*0.35)) + 0.5*psVN(vec2(s.x*1.9 + 4.0, s.y*0.42 - tm*0.7)); }
      float psWaveF(vec2 s, float tm){ return psVN(vec2(s.x*4.7 + 7.0, s.y*1.3 - tm*2.0)) + 0.5*psVN(vec2(s.x*10.0 + 3.0, s.y*3.4 - tm*4.4)); }
      void main(){
        float tm = uPsFront.w; vec2 xz = vW.xz, tn = normalize(vSt.zw), ta = vec2(tn.y, -tn.x);     // down the stream; across it
        int ci = int(clamp(floor((vSt.y - uBCell.z)/uBCell.x), 0.0, uBCell.y - 1.0))*3;
        vec2 bn = vec2(0.0); vec3 edd = vec3(0.0);
        vec4 f = psBoulder(texelFetch(tB, ivec2(ci, 0), 0), xz, tn, tm, bn, edd);
        vec4 f2 = psBoulder(texelFetch(tB, ivec2(ci + 1, 0), 0), xz, tn, tm, bn, edd);
        vec4 f3 = psBoulder(texelFetch(tB, ivec2(ci + 2, 0), 0), xz, tn, tm, bn, edd);
        float foam = max(f.x, max(f2.x, f3.x)), push = f.y + f2.y + f3.y, lee = max(f.z, max(f2.z, f3.z)), inside = max(f.w, max(f2.w, f3.w));
        float edge = abs(vSt.x)/${HW.toFixed(1)};
        vec3 Vv = vW - cameraPosition; vec3 V = Vv/max(length(Vv), 1e-3);
        float px = fwidth(vSt.y) + fwidth(vSt.x);
        float rk = 1.0 - smoothstep(0.1, 0.8, px), rk2 = 1.0 - smoothstep(0.45, 2.6, px);
        float lit = psLit(vW.y);
        // RIFFLES: every twenty-odd metres the bed steps down, and the water breaks white over the step in three standing crests
        float rcell = vSt.y/23.0, rid = floor(rcell), rh = psH1(vec2(rid, 5.3));
        float rs = (fract(rcell) - (0.3 + 0.4*rh))*23.0 - 3.2*(psVN(vec2(vSt.x*0.42 + rh*20.0, rid)) - 0.5) - 1.1*(psVN(vec2(vSt.x*1.5, rid + 3.0)) - 0.5) - 0.5*abs(vSt.x - (rh - 0.5)*5.0);
        float rband = smoothstep(-0.5, 0.25, rs)*(1.0 - smoothstep(1.4, 3.2, rs))*step(0.45, rh);
        float cr0 = 0.5 + 0.5*cos(rs*4.4 - 0.35*sin(tm*2.3 + vSt.x*2.0)), crest = mix(cr0*cr0*cr0*cr0*cr0, 0.16, smoothstep(0.25, 0.9, px));
        // (a crest never runs bank to bank: the water breaks where a stone of the step stands near the surface, and slides glassy between)
        float rgap = smoothstep(0.42, 0.62, psVN(vec2(vSt.x*0.85 + rid*7.0, 3.0 + rs*0.35 + tm*0.15)))*(0.55 + 0.45*psVN(vec2(vSt.x*3.1, rs*1.7 - tm*1.4)));
        float riffle = rband*crest*rgap;
        foam = max(foam, riffle*0.9);
        // the surface: long glassy tongues down the flow (they carry the mirror), quick ripples over them (they carry the glitter)
        vec2 sw = vec2(vSt.x - push*0.6, vSt.y);
        float h0 = psWaveS(sw, tm), hA = psWaveS(sw + vec2(0.25, 0.0), tm), hB = psWaveS(sw + vec2(0.0, 0.6), tm);
        vec2 gS = vec2(hA - h0, (hB - h0)*0.42)/0.25;
        float f0 = psWaveF(sw, tm), fA = psWaveF(sw + vec2(0.07, 0.0), tm), fB = psWaveF(sw + vec2(0.0, 0.16), tm);
        vec2 gF = vec2(fA - f0, (fB - f0)*0.44)/0.07*rk;
        vec2 gwS = (ta*gS.x + tn*gS.y)*(0.035 + 0.05*rband) + bn*mix(0.3, 1.0, rk2);
        vec2 gw = gwS + (ta*gF.x + tn*gF.y)*(0.05 + 0.08*foam);
        vec3 Ns = normalize(vec3(-gwS.x, 1.0, -gwS.y)), N = normalize(vec3(-gw.x, 1.0, -gw.y));
        vec3 R = reflect(V, Ns); R.y = abs(R.y) + 0.015;
        float fq = 1.0 - clamp(dot(-V, Ns), 0.0, 1.0), fres = 0.02 + 0.98*fq*fq*fq*fq;
        float ambL = dot(uSky, vec3(0.3, 0.55, 0.15));
        vec3 sunW = uSunCol*lit;
        // THE MIRROR. Up and down the stream the valley stands open: the low ray finds the pale blue of the far slope, a steeper
        // one the sky. To either side each bank is a wall of trees, dark at its foot, blossom above: broad soft shapes
        float rac = dot(R.xz, ta), ral = dot(R.xz, tn), sg = rac < 0.0 ? -1.0 : 1.0;
        float tHit = (${(HW * 1.25 + 1.5).toFixed(2)} - sg*vSt.x)/max(abs(rac), 0.1);
        float cHit = vSt.y + ral*tHit, hHit = R.y*tHit;
        float tr1 = psVN(vec2(cHit*0.07 + sg*17.0, 3.0)), tr2 = psVN(vec2(cHit*0.21 + sg*5.0, 9.0));
        float top = 5.0 + 8.0*tr1 + 3.0*tr2 + uWat.x*20.0;
        float skyK = smoothstep(top - 3.5, top + 3.5, hHit);
        float pinkK = smoothstep(0.42, 0.64, tr1*0.6 + tr2*0.4)*smoothstep(1.0, 4.5, hHit);
        vec3 bankC = mix(uBank*vec3(0.62, 1.0, 0.84)*RECIPROCAL_PI*(sunW*0.22 + vec3(ambL)*0.75), mix(uShell, uPale, 0.35)*RECIPROCAL_PI*(sunW*0.5 + vec3(ambL)*0.8), pinkK);
        vec3 skyC = mix(uSkyH, uSkyZ, smoothstep(0.05, 0.4, R.y));
        float sideK = max(smoothstep(0.08, 0.34, abs(rac)), smoothstep(0.5, 0.98, edge)*0.85);
        vec3 refl = mix(skyC, mix(bankC, skyC, skyK), sideK);
        // THROUGH THE SURFACE: in the shallows and under the lens the pebbles of the bed, the sun's net sliding over them;
        // the channel deepens to jade
        float depth = mix(0.06, 1.6, smoothstep(1.04, 0.22, edge + 0.16*(psVN(vec2(vSt.y*0.11, 2.0)) - 0.5)))*(1.0 - 0.45*rband);
        float vy = max(-V.y, 0.14);
        vec2 bp = xz + V.xz/max(-V.y, 0.3)*depth*0.7 + gw*0.3;
        vec2 q = bp*4.4 + 0.5*vec2(psVN(bp*1.3), psVN(bp*1.3 + 7.0)), qi = floor(q), qf = fract(q); float md = 9.0, md2 = 9.0; vec2 mh = vec2(0.5);
        for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
          vec2 g = vec2(float(i), float(j)), o = psH2(qi + g), r = g + o - qf; float d = dot(r, r);
          if (d < md) { md2 = md; md = d; mh = o; } else if (d < md2) md2 = d; }
        float stone = smoothstep(0.0, 0.2, sqrt(md2) - sqrt(md));
        vec3 pebC = mix(vec3(0.4, 0.39, 0.34), vec3(0.62, 0.55, 0.4), mh.x); pebC = mix(pebC, vec3(0.2, 0.23, 0.24), step(0.72, mh.y))*(0.7 + 0.6*fract(mh.y*7.3));
        vec3 bed = mix(vec3(0.34, 0.33, 0.28), pebC*(0.5 + 0.5*stone)*(0.8 + 0.4*psVN(bp*1.1 + 3.0)), rk2);
        float caust = smoothstep(0.6, 0.95, 1.0 - abs(2.0*psVN(bp*2.1 + vec2(tm*0.3, -tm*0.55)) - 1.0))*rk;
        vec3 inW = sunW*max(uSunDir.y, 0.3);
        vec3 bedL = bed*RECIPROCAL_PI*(inW*(0.9 + 1.5*caust) + vec3(ambL)*vec3(0.95, 1.05, 1.0));
        // amago trout: dark darts holding in the current
        { vec2 tq = vec2(vSt.x, vSt.y/7.0); float id = floor(tq.y), hh = psH1(vec2(id, 3.7)), h2 = psH1(vec2(id, 9.1));
          float dart = smoothstep(0.75, 1.0, sin(tm*0.5 + hh*40.0))*1.6;
          vec2 tp = vec2(tq.x - (hh - 0.5)*${(HW * 1.3).toFixed(1)} - 0.25*sin(tm*1.3 + hh*20.0), (fract(tq.y) - 0.5)*7.0 - 2.0*sin(tm*0.23 + h2*30.0) + dart);
          float wig = 0.03*sin(tp.y*9.0 - tm*9.0);
          float fish = 1.0 - smoothstep(0.7, 1.0, length(vec2((tp.x - wig)/0.06, tp.y/0.26)));
          bedL *= 1.0 - 0.75*fish*step(0.35, h2)*smoothstep(0.75, 0.3, edge)*rk; }
        vec3 Tw = exp(-depth*(0.55 + 0.45/vy)*vec3(2.8, 0.66, 1.5));
        // (the body of the water is lit by the whole sky, whatever its colour: jade stays jade at first light and by the moon)
        vec3 scat = uJade*RECIPROCAL_PI*(inW*0.55 + vec3(0.9, 1.0, 0.94)*ambL*1.5)*mix(1.02, 0.5, smoothstep(0.35, 1.6, depth))*(0.9 + 0.2*h0);
        vec3 c = mix(bedL*Tw + scat*(1.0 - Tw), refl, min(fres, uWat.y));
        // glitter: the quick ripples throw sparks of the sun, thickest on the side of the stream that lies toward it
        { vec3 Rf = reflect(V, N); float gl = max(dot(Rf, uSunDir), 0.0), g2 = gl*gl; g2 *= g2; g2 *= g2;
          float sunSide = smoothstep(-0.9, 0.9, vSt.x/${HW.toFixed(1)}*sign(dot(ta, uSunDir.xz) + 1e-4));
          float spark = smoothstep(0.7, 0.86, psVN(vec2(sw.x*9.0, sw.y*3.2 - tm*3.4))*0.6 + 0.4*psVN(sw*vec2(23.0, 8.0) + tm*2.1));
          c += uSunCol*lit*(g2*g2*g2*2.0 + spark*rk*(0.15 + 1.3*sunSide)*(0.35 + 0.65*g2)); }
        // HANAIKADA: the fallen petals ride down in rafts, long islands of pale pink with clear jade lanes between; they gather
        // along the banks and in every lee, part round the stones, and turn slowly in the eddies below them
        vec2 ru = vec2(vSt.x - push, vSt.y - tm*1.25);
        float lifted = smoothstep(0.4, 4.0, psGust(xz) - 1.5*psVN(xz*0.09));
        float rn = psVN(ru*vec2(0.55, 0.07))*0.6 + psVN(ru*vec2(1.6, 0.22) + 5.0)*0.4;
        float cov = smoothstep(0.0, 0.12, rn + 0.24*smoothstep(0.45, 1.0, edge) + 0.3*lee - mix(0.78, 0.51, uRaft) - 0.5*lifted)*(1.0 - 0.8*rband);
        float eddK = smoothstep(0.0, 0.3, edd.x)*smoothstep(0.3, 0.62, 0.5 + 0.5*sin(2.0*edd.y + 4.0*edd.x - tm*0.8))*(1.0 - 0.6*lifted)*(0.4 + 0.6*uRaft);
        vec2 rv = mix(ru, vec2(edd.y*0.9019 - tm*0.33, edd.z), step(cov + 1e-3, eddK));              // in the eddy the raft's petals go round with it
        cov = max(cov, eddK)*(1.0 - inside);
        float dens = clamp(cov*0.95 + 0.012*(1.0 - lifted), 0.0, 1.0);
        float pw = (fwidth(ru.x) + fwidth(ru.y))*8.0;
        float pet = 0.0; vec2 pcl = vec2(0.5);
        for (int k = 0; k < 2; k++) {
          float fk = float(k); vec2 pq = rv*(9.0 - 2.1*fk) + fk*13.7, pi = floor(pq), pf = fract(pq) - 0.5, po = psH2(pi + fk*31.0);
          float ang = po.x*6.2832, ca = cos(ang), sa = sin(ang); vec2 d = pf - (po - 0.5)*0.5; d = vec2(d.x*ca - d.y*sa, (d.x*sa + d.y*ca)*1.6);
          float a = (1.0 - smoothstep(0.2, 0.26 + pw*0.4, length(d)))*step(fract(po.x*7.31 + po.y*3.7), dens);
          if (a > pet) { pet = a; pcl = po; } }
        // further off the single petals close into the raft itself: a pale island with a soft ragged edge
        float far1 = smoothstep(0.5, 1.5, pw);
        float pa = mix(pet, cov*(0.5 + 0.4*psVN(ru*vec2(1.4, 0.22) + 9.0)) + 0.012, far1);
        vec3 pcol = mix(uPale, uShell, 0.3 + 0.7*pcl.y*(1.0 - far1))*(0.85 + 0.3*pcl.x*(1.0 - far1))*RECIPROCAL_PI*(sunW*(0.35 + 0.65*uSunDir.y) + vec3(ambL)*vec3(1.2, 1.1, 1.15));
        c = mix(c, pcol, pa*(1.0 - 0.85*clamp(foam, 0.0, 1.0)));
        // white water: streaked down the flow, never a soft blot
        float fz = clamp(foam, 0.0, 1.0)*(0.45 + 0.55*smoothstep(0.25, 0.65, psVN(vec2(dot(xz, ta)*5.5, dot(xz, tn)*1.3 - tm*2.6))*0.7 + 0.3*psVN(xz*9.0 + tm*2.0)));
        c = mix(c, vec3(0.92)*RECIPROCAL_PI*(sunW*0.9 + vec3(ambL)*1.9), clamp(fz*1.3, 0.0, 0.95));
        float shore = 1.0 - smoothstep(0.84, 1.0, edge + 0.42*(psVN(xz*0.33) - 0.5) + 0.2*(psVN(xz*1.1 + 3.0) - 0.5) + 0.07*(psVN(xz*4.0) - 0.5));
        gl_FragColor = vec4(c, shore);
        #include <fog_fragment>
      }`,
  });
}

// THE WET BANK: a margin of dark wet shingle either side of the stream, moss cushions creeping down onto it from the grass,
// a few petals stuck to the stones. Laid on the ground, soft at both edges; the water is drawn over its inner edge.
function bankMaterial(S) {
  return new THREE.ShaderMaterial({
    fog: true, transparent: true, depthWrite: false, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4,
    uniforms: { ...fogU(), uPsShade: S.uShade, uPsFront: S.uFront, uSunDir: S.uSunDir, uSunCol: S.uSunCol, uSky: S.uSky, uGround: S.uGround, uMoss: S.uMoss, uPale: S.uPale, uSkyH: S.uSkyH },
    vertexShader: /* glsl */`
      attribute vec2 aB;
      varying vec3 vW; varying vec2 vB;
      #include <common>
      #include <fog_pars_vertex>
      void main(){
        vW = position; vB = aB;
        vec4 mvPosition = viewMatrix*vec4(position, 1.0);
        gl_Position = projectionMatrix*mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uSunDir, uSunCol, uSky, uGround, uMoss, uPale, uSkyH;
      varying vec3 vW; varying vec2 vB;
      #include <common>
      #include <fog_pars_fragment>
      ${GLSL_PS}
      void main(){
        vec2 xz = vW.xz;
        float n = psVN(xz*0.31)*0.6 + psVN(xz*1.3 + 3.0)*0.4;
        float a = smoothstep(0.0, 0.14, vB.x)*(1.0 - smoothstep(0.4, 0.95, vB.x + 0.55*(n - 0.5)));
        float pw = fwidth(xz.x) + fwidth(xz.y), nearK = 1.0 - smoothstep(0.03, 0.12, pw);
        vec2 q = xz*7.5 + 1.1*vec2(psVN(xz*2.3), psVN(xz*2.3 + 7.0)), qi = floor(q), qf = fract(q); float md = 9.0, md2 = 9.0; vec2 mh = vec2(0.5);
        for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
          vec2 g = vec2(float(i), float(j)), o = psH2(qi + g), r = g + o - qf; float d = dot(r, r);
          if (d < md) { md2 = md; md = d; mh = o; } else if (d < md2) md2 = d; }
        float stone = mix(0.72, 0.45 + 0.55*smoothstep(0.0, 0.3, sqrt(md2) - sqrt(md)), nearK);
        float wet = 1.0 - smoothstep(0.12, 0.62, vB.x + 0.3*(n - 0.5));
        vec3 peb = mix(vec3(0.2, 0.21, 0.2), vec3(0.4, 0.37, 0.31), mh.x*nearK + 0.5*(1.0 - nearK))*(0.4 + 0.6*stone)*mix(1.0, 0.5, wet);
        float moss = smoothstep(0.4, 0.6, psVN(xz*0.9 + 11.0)*0.6 + psVN(xz*3.1)*0.4 + 0.45*(vB.x - 0.45));
        vec3 alb = mix(peb, uMoss*(0.55 + 0.75*psVN(xz*6.0)), moss*0.9);
        vec2 pp = xz*6.0, pi = floor(pp), pf = fract(pp) - 0.5, po = psH2(pi);
        float tau = psGust(xz);
        float pet = (1.0 - smoothstep(0.1, 0.17, length(pf - (po - 0.5)*0.7)))*step(po.x, 0.09)*nearK*(1.0 - 0.8*smoothstep(0.2, 3.0, tau));
        alb = mix(alb, uPale*(0.85 + 0.25*po.y), pet);
        vec3 sun = uSunCol*psLit(vW.y);
        vec3 c = alb*RECIPROCAL_PI*(sun*max(uSunDir.y, 0.22) + mix(uGround, uSky, 0.92));
        vec3 V = normalize(cameraPosition - vW); float fq = 1.0 - clamp(V.y, 0.0, 1.0);
        c += uSkyH*(0.22*wet*(1.0 - moss)*fq*fq*fq*(0.5 + 0.5*stone));
        gl_FragColor = vec4(c, a*0.94);
        #include <fog_fragment>
      }`,
  });
}

// the thread fall: one scrolling strip that turns its face to the lens and never gets thinner than two and a half pixels
function fallMaterial(S) {
  return new THREE.ShaderMaterial({
    fog: true, transparent: true, depthWrite: false, side: THREE.DoubleSide,
    uniforms: { ...fogU(), uPsShade: S.uShade, uPsFront: S.uFront, uSunCol: S.uSunCol, uSky: S.uSky, uViewH: S.uViewH },
    vertexShader: /* glsl */`
      attribute vec3 aT; attribute vec4 aU;
      uniform float uViewH;
      varying vec3 vUv; varying float vY;
      #include <common>
      #include <fog_pars_vertex>
      void main(){
        vec3 wp = position, sd = cross(aT, cameraPosition - wp); sd /= max(length(sd), 1e-4);
        float depth = max(-(viewMatrix*vec4(wp, 1.0)).z, 0.05), pxw = 2.0*depth/(projectionMatrix[1][1]*uViewH);
        float w = max(aU.w, 1.3*pxw);
        wp += sd*(aU.x*w);
        vec4 mvPosition = viewMatrix*vec4(wp, 1.0); gl_Position = projectionMatrix*mvPosition; vUv = vec3(aU.x, aU.y, clamp(aU.w/w, 0.0, 1.0)); vY = wp.y;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uSunCol, uSky; varying vec3 vUv; varying float vY;
      #include <common>
      #include <fog_pars_fragment>
      ${GLSL_PS}
      void main(){
        float tm = uPsFront.w, x = vUv.x, y = vUv.y, far = 1.0 - smoothstep(0.35, 0.9, vUv.z);       // far: the ribbon is wider than the water
        // near at hand the water comes down in four threads that wander, thin out and join again; streaks run down each
        float th = 0.0;
        for (int i = 0; i < 4; i++) {
          float fi = float(i), cx = -0.63 + 0.42*fi + 0.34*(psVN(vec2(y*0.85 + fi*7.1, fi*3.3)) - 0.5), wd = 0.15 + 0.1*psVN(vec2(y*0.6 + 3.0, fi*5.7));
          float on = smoothstep(0.22, 0.5, psVN(vec2(y*0.42 - tm*0.05 + fi*3.7, 9.0 + fi)));
          float e = (x - cx)/wd; th = max(th, exp(-e*e)*(0.5 + 0.5*on));
        }
        float st = psVN(vec2(x*7.0, y*1.5 - tm*3.1))*0.55 + psVN(vec2(x*17.0 + 4.0, y*3.6 - tm*5.4))*0.45;
        float body = min(1.0, th*1.25)*(0.6 + 0.4*smoothstep(0.2, 0.6, st));
        float edge = 1.0 - smoothstep(0.55, 1.0, abs(x));
        float a = mix(body*edge, (1.0 - smoothstep(0.1, 1.0, abs(x)))*(0.8 + 0.2*st), far)*smoothstep(0.0, 0.25, y)*(1.0 - smoothstep(9.3, 10.0, y));
        if (a < 0.01) discard;
        vec3 c = vec3(0.84, 0.9, 0.92)*RECIPROCAL_PI*(uSunCol*psLit(vY)*(0.42 + 0.85*st*mix(th, 1.0, far)) + uSky*mix(0.95, 1.35, far));
        gl_FragColor = vec4(c, a*0.94);
        #include <fog_fragment>
      }`,
  });
}

// ---------- outcrops built for this world: fractured, ledged stacks of rock beds ----------
// bed: [x, y0, z, rx, rz, h, rot, seed]. Each bed is a rough-edged block cut by joints, with a bevelled lip and a slightly
// domed top; beds are stacked, each set back on the one below, so every stack has ledges for moss and petals to lie on.
function torGeometry(noise, beds, c0, c1, fine = false, dens = 1) {
  // fine: a bedding crack is cut round the block (a dark pinched ring), the lip is sharper, and each jointed block has its own tone
  const pos = [], col = [], idx = [], ROWS = fine ? [[0, 0.9], [0.13, 1.0], [0.47, 1.025], [0.505, 0.965], [0.54, 1.035], [0.88, 1.045], [1.0, 0.955], [1.05, 0.5]] : [[0, 0.9], [0.14, 1.0], [0.5, 1.02], [0.84, 1.03], [1.0, 0.93], [1.045, 0.52]];
  const TOP = ROWS.length - 2, CRK = fine ? 3 : -1;
  for (const b of beds) {
    const bx = b[0], y0 = b[1], bz = b[2], rx = b[3], rz = b[4], h = b[5], rot = b[6], sd = b[7] ?? 0.37;
    const n = Math.max(18, Math.round(Math.min(fine ? 60 : 52, Math.round((rx + rz) * (fine ? 5.7 : 5.2))) * dens)), base = pos.length / 3;
    const cr = Math.cos(rot), sr = Math.sin(rot), nj = 3 + Math.floor((sd * 7.3) % 3), tk = 0.74 + 0.42 * ((sd * 3.17) % 1), mk = (sd * 5.71) % 1;
    for (let k = 0; k < ROWS.length; k++) {
      const top = k >= TOP;
      for (let i = 0; i < n; i++) {
        const th = (i / n) * 6.2832, cx = Math.cos(th), sz = Math.sin(th);
        let rr = 1 + 0.2 * noise.n2(cx * 1.6 + sd * 9, sz * 1.6 - sd * 5) + 0.09 * noise.n2(cx * 5 + sd * 3, sz * 5 + sd);
        const jn = Math.pow(Math.abs(Math.sin(th * nj * 0.5 + sd * 20)), 14);                  // joints: a few deep notches
        rr *= (1 - 0.22 * jn) * lerp(1, Math.pow(Math.pow(Math.abs(cx), 2.6) + Math.pow(Math.abs(sz), 2.6), -1 / 2.6), 0.6) * ROWS[k][1];
        const lx = cx * rx * rr, lz = sz * rz * rr, y = y0 + h * ROWS[k][0];
        const wx = bx + lx * cr + lz * sr, wz = bz - lx * sr + lz * cr;
        const d1 = noise.n3(wx * 1.7, y * 1.7, wz * 1.7), d2 = noise.n3(wx * 5.1 + 7, y * 5.1, wz * 5.1), d3 = noise.n3(wx * 1.7 + 31, y * 1.7, wz * 1.7 + 5);
        pos.push(wx + 0.11 * d1 + 0.04 * d2, y + (top ? 0.05 : 0.03) * d3 + (top ? 0.04 * d2 : 0), wz + 0.11 * d3 + 0.04 * d2);
        const blk = fine ? 0.86 + 0.3 * (((Math.floor(th * nj / 3.1416 + sd * 6.4 + 0.5) * 0.618 + sd * 3.3 + (k > CRK ? 0.37 : 0)) % 1 + 1) % 1) : 1;      // each block between two joints, above and below the bedding crack
        const g = tk * blk * (k === 0 ? 0.55 : k === CRK ? 0.34 : 0.82 + 0.2 * d2 + (fine ? 0.05 : 0.08) * k) * (1 - (fine ? 0.7 : 0.45) * jn), m = clamp(mk + 0.5 * d1, 0, 1);
        col.push(lerp(c0.r, c1.r, m) * g, lerp(c0.g, c1.g, m) * g, lerp(c0.b, c1.b, m) * g);
      }
    }
    pos.push(bx, y0 + h * 1.06, bz); col.push(c0.r * tk, c0.g * tk, c0.b * tk);
    const ctr = base + ROWS.length * n;
    for (let k = 0; k < ROWS.length - 1; k++) for (let i = 0; i < n; i++) {
      const a = base + k * n + i, bb = base + k * n + (i + 1) % n, c = a + n, d = bb + n;
      idx.push(a, c, bb, bb, c, d);
    }
    for (let i = 0; i < n; i++) idx.push(base + (ROWS.length - 1) * n + i, ctr, base + (ROWS.length - 1) * n + (i + 1) % n);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.setIndex(idx);
  g.computeVertexNormals(); g.computeBoundingSphere();
  return g;
}
// The same beds as river-worn boulders: no joints, no cut faces. Each is a rounded mass, flat enough on top to sit on, its
// shoulder turned over in a quarter round, its flanks swelling and pinched by slow lobes, its foot tucked under; smooth
// normals, and a skin of big soft blotches with lichen-pale patches (the material lays moss on whatever faces up).
function boulderBedGeometry(noise, beds, c0, c1, cm, own = false, nMax = 38) {
  const pos = [], col = [], idx = [], ak = [];
  for (const b of beds) {
    const bx = b[0], y0 = b[1], bz = b[2], rx = b[3], rz = b[4], h = b[5], rot = b[6], sd = b[7] ?? 0.37;
    const rd = Math.min(0.55, 0.3 * h), e = rd / h, er = rd / Math.min(rx, rz);
    const ROWS = [[0, 1 - er * 1.3], [e * 0.45, 1 - er * 0.45], [e, 1 - er * 0.08], [0.34, 1.02], [0.62, 1.03], [1 - e, 1], [1 - e * 0.55, 1 - er * 0.2], [1 - e * 0.2, 1 - er * 0.55], [1.0, 1 - er * 0.95], [1.02, (1 - er) * 0.62], [1.035, (1 - er) * 0.3]];
    const n = Math.max(18, Math.min(nMax, Math.round((rx + rz) * 5.4))), base = pos.length / 3, cr = Math.cos(rot), sr = Math.sin(rot), tk = 0.8 + 0.34 * ((sd * 3.17) % 1), mk = (sd * 5.71) % 1;
    for (let k = 0; k < ROWS.length; k++) {
      const t = ROWS[k][0];
      for (let i = 0; i < n; i++) {
        const th = (i / n) * 6.2832, cx = Math.cos(th), sz = Math.sin(th);
        let rr = 1 + 0.17 * noise.n2(cx * 1.3 + sd * 9, sz * 1.3 - sd * 5) + 0.07 * noise.n2(cx * 3.1 + sd * 3, sz * 3.1 + sd) + 0.06 * noise.n3(cx * 1.7 + sd * 4, t * 2.2, sz * 1.7);
        rr *= lerp(1, Math.pow(Math.pow(Math.abs(cx), 2.4) + Math.pow(Math.abs(sz), 2.4), -1 / 2.4), 0.4) * ROWS[k][1];
        const lx = cx * rx * rr, lz = sz * rz * rr, y = y0 + h * t;
        const wx = bx + lx * cr + lz * sr, wz = bz - lx * sr + lz * cr;
        const d1 = noise.n3(wx * 0.9, y * 0.9, wz * 0.9), d2 = noise.n3(wx * 2.6 + 7, y * 2.6, wz * 2.6), d3 = noise.n3(wx * 0.9 + 31, y * 0.9, wz * 0.9 + 5);
        const top = t > 0.99;
        pos.push(wx + 0.14 * d1 + 0.04 * d2, y + (top ? 0.03 : 0.07) * d3 + (top ? 0.02 * d2 : 0), wz + 0.14 * d3 + 0.04 * d2);
        const lich = smoothstep(0.25, 0.55, noise.n3(wx * 1.4 + 3, y * 1.4, wz * 1.4 - 8)), g = tk * (k === 0 ? 0.5 : 0.84 + 0.16 * d2 + 0.1 * d1) * (1 + 0.28 * lich), m = clamp(mk + 0.55 * d1, 0, 1);
        // moss: thick over the shoulder and the top, and creeping down the flanks in tongues
        const mo = 0.9 * clamp(smoothstep(1 - 1.9 * e, 1 - 0.4 * e, t) + 0.9 * smoothstep(0.05, 0.4, noise.n3(wx * 0.6 + 11, y * 0.45, wz * 0.6 - 4)) * smoothstep(0.12, 0.7, t), 0, 1), mg = 0.75 + 0.5 * (0.5 + 0.5 * d2);
        if (own) { col.push(lerp(c0.r, c1.r, m) * g, lerp(c0.g, c1.g, m) * g, lerp(c0.b, c1.b, m) * g); ak.push(t, mo, sd); }
        else col.push(lerp(lerp(c0.r, c1.r, m) * g, cm.r * mg, mo), lerp(lerp(c0.g, c1.g, m) * g, cm.g * mg, mo), lerp(lerp(c0.b, c1.b, m) * g, cm.b * mg, mo));
      }
    }
    pos.push(bx, y0 + h * 1.04, bz); if (own) { col.push(c0.r * tk, c0.g * tk, c0.b * tk); ak.push(1.04, 0.9, sd); } else col.push(cm.r * 0.9, cm.g * 0.9, cm.b * 0.9);
    const ctr = base + ROWS.length * n;
    for (let k = 0; k < ROWS.length - 1; k++) for (let i = 0; i < n; i++) {
      const a = base + k * n + i, bb = base + k * n + (i + 1) % n, c = a + n, d = bb + n;
      idx.push(a, c, bb, bb, c, d);
    }
    for (let i = 0; i < n; i++) idx.push(base + (ROWS.length - 1) * n + i, ctr, base + (ROWS.length - 1) * n + (i + 1) % n);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.setIndex(idx);
  if (own) g.setAttribute('aK', new THREE.Float32BufferAttribute(ak, 3));
  g.computeVertexNormals(); g.computeBoundingSphere();
  return g;
}
// The stone of those boulders, for the lens at arm's length (the troop's roof, the serow's crag, the outcrops in the orchard).
// aK = [how far up its bed, moss from the geometry, the bed's own number]. The skin is grained at three scales; lichen grows
// on it in pale grey-green and ochre rosettes; moss lies thick over every shoulder and top with a ragged edge, velvet with
// bright tips; where one boulder sits on the next there is a dark crack; and last week's petals lie in the hollows of the
// tops until the gust front takes them.
function mossRockMaterial(S) {
  return new THREE.ShaderMaterial({
    fog: true, vertexColors: true,
    uniforms: { ...fogU(), uPsShade: S.uShade, uPsFront: S.uFront, uSunDir: S.uSunDir, uSunCol: S.uSunCol, uSky: S.uSky, uGround: S.uGround, uPale: S.uPale, uShell: S.uShell, uMoss: S.uMoss, uCan: S.uCan },
    vertexShader: /* glsl */`
      attribute vec3 aK;
      varying vec3 vW, vN, vCol, vK;
      #include <common>
      #include <fog_pars_vertex>
      void main(){
        vec4 mvPosition = viewMatrix*vec4(position, 1.0);
        gl_Position = projectionMatrix*mvPosition;
        vW = position; vN = normal; vCol = color; vK = aK;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uSunDir, uSunCol, uSky, uGround, uPale, uShell, uMoss; uniform vec4 uCan;
      varying vec3 vW, vN, vCol, vK;
      #include <common>
      #include <fog_pars_fragment>
      ${GLSL_PS}
      float psTri(vec3 w, vec3 aw, float sc, float off){ return psVN(w.zy*sc + off)*aw.x + psVN(w.xz*sc + off)*aw.y + psVN(w.xy*sc + off)*aw.z; }
      void main(){
        vec3 N = normalize(vN), aw = abs(N); aw *= aw; aw /= (aw.x + aw.y + aw.z);
        float pxm = fwidth(vW.x) + fwidth(vW.y) + fwidth(vW.z);
        float nearK = 1.0 - smoothstep(0.03, 0.14, pxm), fineK = 1.0 - smoothstep(0.008, 0.04, pxm);
        float n1 = psTri(vW, aw, 1.1, vK.z*9.0), n2 = psTri(vW, aw, 3.9, 5.0), n3 = psTri(vW, aw, 14.0, 11.0), n4 = psTri(vW, aw, 41.0, 3.0);
        // the stone: grained, pitted, a little paler on the weathered flanks
        vec3 alb = vCol*(0.74 + 0.5*n2)*(1.0 + nearK*0.5*(n3 - 0.5) + fineK*0.4*(n4 - 0.5));
        alb *= 1.0 - 0.45*nearK*smoothstep(0.62, 0.8, n3)*smoothstep(0.45, 0.7, n2);                       // pits
        // lichen rosettes
        vec2 lp = (aw.y > 0.5 ? vW.xz : (aw.x > aw.z ? vW.zy : vW.xy))*2.3 + 0.35*vec2(n2, n3), li = floor(lp), lf = fract(lp); float ld = 9.0; vec2 lh = vec2(0.5);
        for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
          vec2 g = vec2(float(i), float(j)), o = psH2(li + g + vK.z*31.0), r = g + o - lf; float d = dot(r, r);
          if (d < ld) { ld = d; lh = o; } }
        float lr = 0.16 + 0.24*lh.x, lich = (1.0 - smoothstep(lr - 0.07, lr, sqrt(ld) + 0.1*(n3 - 0.5)))*step(0.42, lh.y)*nearK;
        vec3 lichC = mix(vec3(0.5, 0.56, 0.47), vec3(0.6, 0.5, 0.24), step(0.8, lh.y))*(0.75 + 0.5*n4);
        alb = mix(alb, lichC, 0.8*lich*(0.6 + 0.4*smoothstep(0.3, 0.6, n3)));
        // moss: over the shoulders and tops, creeping down in tongues; a ragged edge; velvet, dark between its cushions
        float mk = smoothstep(0.42, 0.62, vK.y*0.75 + 0.42*smoothstep(-0.1, 0.8, N.y) + 0.34*(n1 - 0.5) + 0.3*(n2 - 0.5) + 0.2*nearK*(n3 - 0.5));
        vec3 mossC = uMoss*(0.62 + 0.5*n2)*(1.0 + nearK*0.9*(n3 - 0.45) + fineK*0.7*(n4 - 0.5))*mix(vec3(1.0), vec3(1.25, 1.2, 0.7), nearK*smoothstep(0.6, 0.85, n4)*0.6);
        alb = mix(alb, mossC, mk);
        // the crack where this boulder sits on the next, and the shade of its overhang
        float crack = smoothstep(0.16, 0.0, vK.x);
        alb *= mix(1.0, 0.3, crack);
        // fallen petals in the hollows of the tops
        float flat_ = smoothstep(0.7, 0.92, N.y), gone = smoothstep(0.3, 3.4, psGust(vW.xz) - 1.2*psVN(vW.xz*0.07 + 3.0));
        vec2 pp = vW.xz*8.5, pi = floor(pp), pf = fract(pp) - 0.5, po = psH2(pi); float pw = fwidth(pp.x) + fwidth(pp.y);
        float ang = po.x*6.2832, ca = cos(ang), sa = sin(ang); vec2 dd = pf - (po - 0.5)*0.5; dd = vec2(dd.x*ca - dd.y*sa, (dd.x*sa + dd.y*ca)*1.55);
        float hollow = smoothstep(0.42, 0.66, psVN(vW.xz*0.8 + vK.z*17.0)*0.6 + psVN(vW.xz*2.3 + 4.0)*0.4)*flat_*min(uCan.z, 1.0)*(1.0 - 0.92*gone);
        float pk = mix((1.0 - smoothstep(0.2, 0.25 + pw*0.5, length(dd)))*step(fract(po.x*7.31 + po.y*3.7), 0.08 + 0.85*hollow), 0.55*hollow, smoothstep(0.5, 1.6, pw));
        alb = mix(alb, mix(uPale, uShell, 0.3 + 0.7*po.y)*(0.85 + 0.3*po.x), pk*flat_);
        // light
        float nl = dot(N, uSunDir), wrap = max((nl + 0.18)/1.18, 0.0);
        float ao = mix(0.5, 1.0, smoothstep(0.0, 0.5, vK.x))*mix(0.62, 1.0, smoothstep(-0.5, 0.3, N.y));
        vec3 c = alb*RECIPROCAL_PI*(uSunCol*psLit(vW.y)*wrap*ao + mix(uGround, uSky, N.y*0.5 + 0.5)*ao);
        gl_FragColor = vec4(c, 1.0);
        #include <fog_fragment>
      }`,
  });
}
// the top of a stack under (x, z), or -1e9 if no bed lies under it
function torTopAt(beds, x, z, thr = 0.42) {
  let best = -1e9;
  for (const b of beds) {
    const dx = x - b[0], dz = z - b[2], cr = Math.cos(b[6]), sr = Math.sin(b[6]), lx = dx * cr - dz * sr, lz = dx * sr + dz * cr;
    if (Math.pow(Math.abs(lx / b[3]), 2.6) + Math.pow(Math.abs(lz / b[4]), 2.6) < thr) best = Math.max(best, b[1] + b[5] * 1.035);
  }
  return best;
}

// ---------- sugi and hinoki beyond the kit's reach: this world's own spires ----------
// Unit trees: one high, one wide at the lowest boughs; an instance scales them. aK = [bough shade (dark by the stem, light at
// the tips), how far up the tree]. Normals are written as they should stand in the world (the shader only turns them).
// 'spire': skirts of boughs with long and short tips, so no outline is a clean cone. tiers x sides triangles.
function spireGeometry(rj, tiers, boughs) {
  // each skirt is a star of boughs: bright drooping tips, dark notches drawn in to the stem between them. tiers x boughs x 2 triangles
  const p = [], n = [], k = [];
  for (let t = 0; t < tiers; t++) {
    const f = t / tiers, y0 = lerp(0.05, 0.8, Math.pow(f, 0.92)), y1 = t === tiers - 1 ? 1 : Math.min(0.97, y0 + lerp(0.36, 0.24, f)), rr = lerp(1, 0.3, Math.pow(f, 0.8));
    const ph = rj.range(0, 6.28), ring = [], ax = rj.range(-0.05, 0.05) * rr, az = rj.range(-0.05, 0.05) * rr, m = boughs * 2;
    for (let i = 0; i < m; i++) {
      const a = ph + (i + rj.range(-0.2, 0.2)) / m * 6.2832, tip = (i & 1) === 0, r = rr * (tip ? rj.range(0.86, 1.3) : rj.range(0.26, 0.42));
      ring.push([Math.cos(a) * r, tip ? y0 - rj.range(0, 0.04) : lerp(y0, y1, 0.3), Math.sin(a) * r, tip ? 1 : 0.26, Math.cos(a), Math.sin(a)]);
    }
    for (let i = 0; i < m; i++) {
      const a = ring[i], b = ring[(i + 1) % m];
      p.push(ax, y1, az, b[0], b[1], b[2], a[0], a[1], a[2]);
      n.push(0, 1, 0, b[4] * 0.86, 0.5, b[5] * 0.86, a[4] * 0.86, 0.5, a[5] * 0.86);
      k.push(0.55, y1, b[3], b[1], a[3], a[1]);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(n, 3)); g.setAttribute('aK', new THREE.Float32BufferAttribute(k, 2));
  return g;
}
// 'sugi': for the ranks the flight passes near. A dark inner mass, and whorl on whorl of separate drooping boughs standing out
// of it, each a tongue of two triangles: the outline is ragged and the dark shows between the boughs.
function sugiGeometry(rj, whorls, boughs) {
  const p = [], n = [], k = [];
  for (let i = 0; i < 6; i++) {                                                  // the inner mass
    const a0 = i / 6 * 6.2832, a1 = (i + 1) / 6 * 6.2832, c0 = Math.cos(a0), s0 = Math.sin(a0), c1 = Math.cos(a1), s1 = Math.sin(a1);
    p.push(0, 0.98, 0, c1 * 0.2, 0.5, s1 * 0.2, c0 * 0.2, 0.5, s0 * 0.2, c0 * 0.2, 0.5, s0 * 0.2, c1 * 0.2, 0.5, s1 * 0.2, c0 * 0.42, 0.04, s0 * 0.42, c1 * 0.2, 0.5, s1 * 0.2, c1 * 0.42, 0.04, s1 * 0.42, c0 * 0.42, 0.04, s0 * 0.42);
    n.push(0, 1, 0, c1 * 0.9, 0.3, s1 * 0.9, c0 * 0.9, 0.3, s0 * 0.9, c0 * 0.9, 0.3, s0 * 0.9, c1 * 0.9, 0.3, s1 * 0.9, c0 * 0.9, 0.3, s0 * 0.9, c1 * 0.9, 0.3, s1 * 0.9, c1 * 0.9, 0.3, s1 * 0.9, c0 * 0.9, 0.3, s0 * 0.9);
    k.push(0.3, 0.98, 0.26, 0.5, 0.26, 0.5, 0.26, 0.5, 0.26, 0.5, 0.2, 0.04, 0.26, 0.5, 0.2, 0.04, 0.2, 0.04);
  }
  for (let w = 0; w < whorls; w++) {
    const f = w / (whorls - 1), y = lerp(0.07, 0.955, Math.pow(f, 0.95)), reach = lerp(1, 0.13, Math.pow(f, 0.78)), ph = rj.range(0, 6.28), nb = w > whorls - 3 ? boughs - 2 : boughs;
    for (let b = 0; b < nb; b++) {
      const a = ph + (b + rj.range(-0.3, 0.3)) / nb * 6.2832, c = Math.cos(a), s = Math.sin(a), len = reach * rj.range(0.74, 1.22), wd = len * rj.range(0.26, 0.4) + 0.03;
      const yy = y + rj.range(-0.012, 0.012), dr = rj.range(0.012, 0.04) * (0.5 + 0.7 * reach), r0 = 0.07 * reach, rm = len * 0.58;
      const R = [c * r0, yy + 0.022, s * r0], Lf = [c * rm - s * wd, yy - dr * 0.35, s * rm + c * wd], Rt = [c * rm + s * wd, yy - dr * 0.35, s * rm - c * wd], Tp = [c * len, yy - dr, s * len];
      p.push(R[0], R[1], R[2], Tp[0], Tp[1], Tp[2], Lf[0], Lf[1], Lf[2], R[0], R[1], R[2], Rt[0], Rt[1], Rt[2], Tp[0], Tp[1], Tp[2]);
      for (const q of [0.25, 0.8, 0.6, 0.25, 0.6, 0.8]) n.push(c * q, Math.sqrt(1 - q * q), s * q);
      k.push(0.4, yy, 1, yy, 0.8, yy, 0.4, yy, 0.8, yy, 1, yy);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(n, 3)); g.setAttribute('aK', new THREE.Float32BufferAttribute(k, 2));
  return g;
}
// lit on the sun's side and at the tops, blue-green in their own shade, paling with distance and height; they nod in the calm
// and bow when the gust front passes them
function spireMaterial(S) {
  return new THREE.ShaderMaterial({
    fog: true, side: THREE.DoubleSide,
    uniforms: { ...fogU(), uPsShade: S.uShade, uPsFront: S.uFront, uSunDir: S.uSunDir, uSunCol: S.uSunCol, uSky: S.uSky, uGround: S.uGround, uPsHaze: S.uHaze },
    vertexShader: /* glsl */`
      attribute vec2 aK; attribute vec4 iTint;
      varying vec3 vN, vW, vTint; varying vec2 vK;
      #include <common>
      #include <fog_pars_vertex>
      ${GLSL_PS}
      void main(){
        vec4 wp = modelMatrix*(instanceMatrix*vec4(position, 1.0));
        vec3 base = (modelMatrix*instanceMatrix[3]).xyz; float hgt = length(instanceMatrix[1].xyz);
        float tm = uPsFront.w, ph = iTint.w, tau = psGust(base.xz), tp = max(tau, 0.0), gk = smoothstep(0.0, 0.7, tau);
        float bow = 0.011*sin(tm*0.8 + ph) + 0.006*sin(tm*1.9 + ph*1.7) + gk*(0.022 + 0.05*exp(-0.5*tp)*sin(tp*2.2 + ph) + 0.012*sin(tm*2.7 + ph));
        float lift = aK.x*aK.x*(0.5*sin(tm*1.6 + ph*3.0 + position.x*5.0) + gk*sin(tm*5.0 + ph + position.z*7.0));       // the bough tips ride the air
        wp.xz += uPsFront.yz*(position.y*position.y*hgt*bow);
        wp.y += lift*0.012*hgt;
        vec4 mvPosition = viewMatrix*wp;
        gl_Position = projectionMatrix*mvPosition;
        vN = normalize(instanceMatrix[0].xyz)*normal.x + normalize(instanceMatrix[1].xyz)*normal.y + normalize(instanceMatrix[2].xyz)*normal.z;
        vW = wp.xyz; vTint = iTint.rgb; vK = aK;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uSunDir, uSunCol, uSky, uGround;
      varying vec3 vN, vW, vTint; varying vec2 vK;
      #include <common>
      #include <fog_pars_fragment>
      ${GLSL_PS}
      ${GLSL_HAZE}
      void main(){
        vec3 N = normalize(vN); if (!gl_FrontFacing) N.y = abs(N.y);
        float nl = dot(N, uSunDir), wrap = clamp((nl + 0.12)/1.12, 0.0, 1.0);
        float up = smoothstep(0.05, 0.75, vK.y);                                   // the stand shades its own lower boughs
        vec3 alb = vTint*mix(0.42, 1.0, vK.x);
        vec3 sun = uSunCol*psLit(vW.y)*wrap*mix(0.3, 1.0, up)*mix(0.5, 1.55, vK.x);
        vec3 amb = mix(uGround, uSky, N.y*0.5 + 0.5)*vec3(0.8, 1.02, 1.12)*mix(0.5, 0.95, up)*mix(0.7, 1.0, vK.x);
        vec3 c = alb*RECIPROCAL_PI*(sun*vec3(1.12, 1.02, 0.74) + amb);
        c = mix(c, uPsHaze.rgb, psHazeK(vW));
        gl_FragColor = vec4(c, 1.0);
        #include <fog_fragment>
      }`,
  });
}

// ---------- petal drifts on the rock ledges: single fallen petals, thick at the heart of each drift ----------
function litterMaterial(S) {
  return new THREE.ShaderMaterial({
    fog: true, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
    uniforms: { ...fogU(), uPsShade: S.uShade, uPsFront: S.uFront, uSunDir: S.uSunDir, uSunCol: S.uSunCol, uSky: S.uSky, uPale: S.uPale, uShell: S.uShell },
    vertexShader: /* glsl */`
      attribute vec2 aQ;
      varying vec2 vQ; varying vec3 vW;
      #include <common>
      #include <fog_pars_vertex>
      void main(){
        vec4 mvPosition = viewMatrix*vec4(position, 1.0);
        gl_Position = projectionMatrix*mvPosition;
        vQ = aQ; vW = position;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uSunDir, uSunCol, uSky, uPale, uShell;
      varying vec2 vQ; varying vec3 vW;
      #include <common>
      #include <fog_pars_fragment>
      ${GLSL_PS}
      void main(){
        vec2 p = vW.xz*8.5, pi = floor(p), pf = fract(p) - 0.5, o = psH2(pi); float pw = fwidth(p.x) + fwidth(p.y);
        float ang = o.x*6.2832, ca = cos(ang), sa = sin(ang); vec2 d = pf - (o - 0.5)*0.5; d = vec2(d.x*ca - d.y*sa, (d.x*sa + d.y*ca)*1.55);
        float dotA = 1.0 - smoothstep(0.2, 0.25 + pw*0.5, length(d));
        float den = (1.0 - smoothstep(0.25, 1.0, length(vQ)))*(0.5 + 0.5*psVN(vW.xz*2.3));
        float keep = step(fract(o.x*7.31 + o.y*3.7), den*0.95);
        float a = mix(dotA*keep, den*0.46, smoothstep(0.5, 1.6, pw))*(1.0 - 0.5*smoothstep(0.5, 4.0, psGust(vW.xz)));
        if (a < 0.01) discard;
        vec3 alb = mix(uPale, uShell, 0.3 + 0.7*o.y)*(0.82 + 0.3*o.x);
        vec3 c = alb*RECIPROCAL_PI*(uSunCol*psLit(vW.y)*max(uSunDir.y, 0.0)*1.1 + uSky*1.05);
        gl_FragColor = vec4(c, a*0.96);
        #include <fog_fragment>
      }`,
  });
}

// ---------- animals built for this world: big simple forms from lumps and limbs ----------
// part: [kind 's' sphere | 'c' capsule | 'k' cone, [x,y,z], [sx,sy,sz], [rx,ry,rz], colour, colour at the top (optional)]
const makeUnits = () => ({ s: new THREE.SphereGeometry(1, 8, 5), c: new THREE.CapsuleGeometry(1, 2, 2, 6), k: new THREE.ConeGeometry(1, 2, 6, 1) });
function lumps(units, parts, noise, grain = 0.12) {
  const pos = [], nor = [], col = [], m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), v = new THREE.Vector3(), n = new THREE.Vector3(), nm = new THREE.Matrix3();
  for (const P of parts) {
    const src = units[P[0]], ix = src.index.array, sp = src.attributes.position, sn = src.attributes.normal;
    e.set(P[3][0], P[3][1], P[3][2]); q.setFromEuler(e); m.compose(v.set(P[1][0], P[1][1], P[1][2]), q, n.set(P[2][0], P[2][1], P[2][2])); nm.getNormalMatrix(m);
    const c0 = P[4], c1 = P[5] || P[4];
    for (let i = 0; i < ix.length; i++) {
      const k = ix[i]; v.fromBufferAttribute(sp, k); const ly = clamp(v.y * 0.5 + 0.5, 0, 1); v.applyMatrix4(m); n.fromBufferAttribute(sn, k).applyMatrix3(nm).normalize();
      pos.push(v.x, v.y, v.z); nor.push(n.x, n.y, n.z);
      const g = 1 + grain * noise.n3(v.x * 9, v.y * 9, v.z * 9);
      col.push(lerp(c0.r, c1.r, ly) * g, lerp(c0.g, c1.g, ly) * g, lerp(c0.b, c1.b, ly) * g);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  return geo;
}
// a Japanese macaque. pose 'sit' | 'stand' | 'groom' (leaning in, arms forward). Returns body and head geometry; the head turns about headAt.
function macaqueGeo(units, pose, noise, C) {
  const fur = C.fur, furD = C.furD, belly = C.belly, face = C.face, hand = C.hand, B = [], H = [];
  const stand = pose === 'stand', lean = pose === 'groom' ? 0.42 : stand ? -0.05 : 0.22;
  const hipY = stand ? 0.4 : 0.17, sh = stand ? 0.72 : 0.47, fz = Math.sin(lean), fy = Math.cos(lean);
  const shY = hipY + (sh - hipY) * fy, shZ = (sh - hipY) * fz;
  B.push(['s', [0, hipY, -0.02], [0.2, 0.19, 0.21], [0, 0, 0], furD, fur]);                                           // haunches
  B.push(['s', [0, (hipY + shY) / 2 + 0.01, shZ * 0.5], [0.175, (sh - hipY) * 0.62, 0.17], [lean, 0, 0], fur, furD]);   // back
  B.push(['s', [0, (hipY + shY) / 2 - 0.01, shZ * 0.5 + 0.07], [0.13, (sh - hipY) * 0.5, 0.11], [lean, 0, 0], belly]);  // belly
  B.push(['s', [0, shY, shZ], [0.2, 0.13, 0.15], [lean, 0, 0], furD, fur]);                                              // shoulders
  B.push(['s', [0, hipY - 0.06, -0.2], [0.035, 0.035, 0.07], [0.5, 0, 0], furD]);                                        // stub tail
  for (const sgn of [-1, 1]) {
    if (stand) {
      B.push(['c', [0.1 * sgn, 0.2, 0], [0.062, 0.1, 0.062], [0.08, 0, 0.05 * sgn], fur]);                               // legs
      B.push(['s', [0.11 * sgn, 0.025, 0.05], [0.055, 0.03, 0.1], [0, 0, 0], hand]);
      B.push(['c', [0.19 * sgn, shY + 0.14, shZ + 0.05], [0.045, 0.085, 0.045], [-0.25, 0, -0.22 * sgn], fur]);          // arms up to the spray
      B.push(['c', [0.14 * sgn, shY + 0.36, shZ + 0.13], [0.038, 0.075, 0.038], [-0.45, 0, 0.3 * sgn], fur]);
      B.push(['s', [0.1 * sgn, shY + 0.5, shZ + 0.2], [0.04, 0.045, 0.04], [0, 0, 0], hand]);
    } else {
      B.push(['s', [0.17 * sgn, 0.17, 0.1], [0.085, 0.13, 0.15], [-0.5, 0.25 * sgn, 0], fur]);                           // folded thigh
      B.push(['c', [0.19 * sgn, 0.12, 0.24], [0.045, 0.06, 0.045], [0.2, 0, 0], fur]);                                   // shin
      B.push(['s', [0.19 * sgn, 0.025, 0.27], [0.05, 0.028, 0.09], [0, 0, 0], hand]);
      const reach = pose === 'groom' ? 0.16 : 0.05;
      B.push(['c', [0.2 * sgn, shY - 0.11, shZ + 0.04 + reach * 0.5], [0.045, 0.075, 0.045], [-0.3 - reach * 3, 0, 0.1 * sgn], fur]);
      B.push(['c', [0.17 * sgn, shY - 0.27 + reach, shZ + 0.15 + reach], [0.038, 0.07, 0.038], [-0.9 - reach * 3, 0, 0.25 * sgn], fur]);
      B.push(['s', [0.13 * sgn, shY - 0.34 + reach * 1.6, shZ + 0.24 + reach * 1.4], [0.036, 0.03, 0.05], [0, 0, 0], hand]);
    }
  }
  // head, modelled about its pivot (the neck)
  H.push(['s', [0, 0.1, 0.01], [0.118, 0.115, 0.118], [0, 0, 0], fur, furD]);
  H.push(['s', [0, 0.085, 0.035], [0.132, 0.105, 0.09], [0, 0, 0], belly, fur]);                                         // the ruff round the face
  H.push(['s', [0, 0.085, 0.092], [0.075, 0.082, 0.04], [0, 0, 0], face]);
  H.push(['s', [0, 0.05, 0.118], [0.046, 0.04, 0.036], [0, 0, 0], face]);                                                // muzzle
  H.push(['s', [0, 0.132, 0.1], [0.07, 0.018, 0.03], [0, 0, 0], furD]);                                                  // brow
  for (const sgn of [-1, 1]) { H.push(['s', [0.03 * sgn, 0.105, 0.126], [0.011, 0.011, 0.008], [0, 0, 0], hand]); H.push(['s', [0.115 * sgn, 0.1, 0.0], [0.022, 0.03, 0.012], [0, 0, 0], face]); }
  return { body: lumps(units, B, noise), head: lumps(units, H, noise, 0.06), headAt: [0, shY + 0.07, shZ + 0.04], height: shY + 0.3 };
}
// a Japanese serow (rebuilt), standing square: a goat-antelope, not a deer and not a dog. Stocky and deep in the barrel under
// a shaggy charcoal coat that hangs in a skirt below the belly; a thick neck with a pale grey ruff that runs down into the
// chest; a short face with white cheek tufts and a beard; two short black horns that curve back, long ears held out sideways;
// short stout legs, paler below the knee, on big black hooves. 0.8 m at the shoulder, 1.3 m to the horn tips.
function serowGeo(units, noise, C) {
  const d = C.dark, g = C.grey, p = C.pale, hf = C.hoof, B = [], H = [];
  B.push(['s', [0, 0.74, -0.02], [0.235, 0.255, 0.47], [0.03, 0, 0], d, g]);            // barrel
  B.push(['s', [0, 0.81, 0.29], [0.215, 0.25, 0.23], [0, 0, 0], d, g]);                 // the hump of the shoulders
  B.push(['s', [0, 0.76, -0.37], [0.21, 0.235, 0.215], [0, 0, 0], d, g]);               // rump
  B.push(['s', [0, 0.57, 0.0], [0.19, 0.13, 0.43], [0, 0, 0], g, d]);                   // the shaggy belly
  for (let i = 0; i < 9; i++) {                                                         // and the skirt of long hair that hangs from it
    const z = -0.36 + i * 0.09, sgn = i % 2 ? 1 : -1;
    B.push(['k', [0.1 * sgn, 0.47 + 0.02 * ((i * 7) % 3), z], [0.055, 0.1, 0.07], [3.1416, 0, 0.25 * sgn], g, d]);
  }
  B.push(['c', [0, 0.95, 0.5], [0.135, 0.11, 0.145], [0.72, 0, 0], g, p]);              // neck
  B.push(['s', [0, 0.88, 0.5], [0.175, 0.2, 0.15], [0.4, 0, 0], p, g]);                 // the pale ruff, down into the chest
  B.push(['s', [0, 0.7, 0.47], [0.13, 0.15, 0.1], [0.2, 0, 0], p, g]);
  B.push(['s', [0, 0.78, -0.58], [0.06, 0.09, 0.06], [-0.5, 0, 0], d, g]);              // a short bushy tail
  for (const sgn of [-1, 1]) for (const fb of [1, -1]) {
    const z = fb > 0 ? 0.3 : -0.37, x = 0.125 * sgn;
    B.push(['c', [x, 0.52, z], [0.082, 0.1, 0.092], [fb > 0 ? 0 : -0.14, 0, 0], d, g]);           // shaggy to the knee
    B.push(['s', [x, 0.36, z + (fb > 0 ? 0.0 : 0.035)], [0.058, 0.06, 0.06], [0, 0, 0], g]);
    B.push(['c', [x, 0.21, z + (fb > 0 ? 0.005 : 0.04)], [0.043, 0.085, 0.045], [0, 0, 0], p, g]);  // pale cannons
    B.push(['s', [x, 0.055, z + (fb > 0 ? 0.02 : 0.055)], [0.058, 0.055, 0.075], [0, 0, 0], hf]);
  }
  H.push(['s', [0, 0.07, 0.09], [0.095, 0.105, 0.135], [0.35, 0, 0], d, g]);            // skull
  H.push(['s', [0, 0.005, 0.215], [0.062, 0.062, 0.09], [0.35, 0, 0], g, d]);           // the short face
  H.push(['s', [0, -0.03, 0.29], [0.04, 0.034, 0.03], [0, 0, 0], hf]);                  // nose
  H.push(['s', [0, 0.115, 0.15], [0.07, 0.03, 0.07], [0.35, 0, 0], g]);                 // brow
  H.push(['k', [0, -0.115, 0.17], [0.04, 0.075, 0.035], [3.0, 0, 0], p]);               // beard
  for (const sgn of [-1, 1]) {
    H.push(['s', [0.078 * sgn, -0.02, 0.1], [0.05, 0.075, 0.09], [0.3, 0, 0.3 * sgn], p]);          // white cheek tufts
    H.push(['k', [0.042 * sgn, 0.215, 0.0], [0.024, 0.075, 0.024], [-0.5, 0, -0.14 * sgn], hf]);    // horns: up, then curving back
    H.push(['k', [0.052 * sgn, 0.3, -0.075], [0.017, 0.06, 0.017], [-1.15, 0, -0.14 * sgn], hf]);
    H.push(['k', [0.125 * sgn, 0.135, -0.01], [0.036, 0.085, 0.016], [-0.2, 0.3 * sgn, -1.1 * sgn], g, p]);   // long ears, held out
    H.push(['s', [0.068 * sgn, 0.09, 0.165], [0.014, 0.014, 0.011], [0, 0, 0], hf]);
  }
  return { body: lumps(units, B, noise), head: lumps(units, H, noise, 0.08), headAt: [0, 1.04, 0.6] };
}
// a sika hind (rebuilt). Chestnut, with a dark line down the back, rows of pale spots and a white rump patch; a deep chest under
// the root of the neck and a croup that tapers; slim legs with a knee and a hock, the cannons a finger thick, near and off legs
// a hand's breadth apart fore and aft. The neck and head are one piece that swings about the shoulder (headAt), so she can
// browse and look up; the ears stand wide.
function hindGeo(units, noise, C) {
  const t = C.tan, d = C.dark, p = C.pale, hf = C.hoof, B = [], H = [];
  B.push(['s', [0, 0.8, -0.03], [0.165, 0.19, 0.43], [0.03, 0, 0], p, t]);              // barrel, pale below
  B.push(['s', [0, 0.83, 0.27], [0.15, 0.2, 0.2], [0.1, 0, 0], t, t]);                  // shoulders
  B.push(['s', [0, 0.74, 0.38], [0.115, 0.17, 0.13], [0.25, 0, 0], p, t]);              // the deep chest under the neck's root
  B.push(['s', [0, 0.85, -0.33], [0.16, 0.185, 0.2], [-0.12, 0, 0], t]);                // haunches
  B.push(['s', [0, 0.84, -0.5], [0.115, 0.14, 0.12], [-0.35, 0, 0], t, d]);             // the croup tapers to the tail
  B.push(['s', [0, 0.8, -0.585], [0.085, 0.1, 0.05], [0, 0, 0], C.white]);              // the white rump patch
  B.push(['k', [0, 0.8, -0.65], [0.026, 0.065, 0.026], [-2.75, 0, 0], d]);              // tail
  B.push(['s', [0, 0.985, -0.06], [0.03, 0.022, 0.44], [0.03, 0, 0], d]);               // the dark line down the back
  for (let i = 0; i < 14; i++) {                                                        // two rows of pale spots along each flank
    const sgn = i % 2 ? 1 : -1, row = (i >> 1) % 2, z = -0.4 + (i >> 1) * 0.105 + row * 0.03;
    B.push(['s', [sgn * (0.105 + 0.045 * row), 0.925 - 0.085 * row, z], [0.022, 0.03, 0.04], [0, 0, sgn * (0.5 + 0.5 * row)], C.spot]);
  }
  for (const sgn of [-1, 1]) {
    const x = 0.085 * sgn, st = 0.04 * sgn;                                             // near and off legs stand a little apart fore and aft
    // fore: shoulder blade into forearm, the knee, a thin cannon, the hoof
    B.push(['c', [x, 0.6, 0.3 + st], [0.046, 0.085, 0.056], [0.06, 0, 0], t]);
    B.push(['s', [x, 0.42, 0.31 + st], [0.03, 0.036, 0.032], [0, 0, 0], d]);
    B.push(['c', [x, 0.235, 0.31 + st], [0.02, 0.075, 0.02], [0.03, 0, 0], d]);
    B.push(['k', [x, 0.045, 0.325 + st], [0.03, 0.045, 0.04], [0, 0, 0], hf]);
    // hind: the thigh, the gaskin running back and down to the hock, the cannon coming forward under it, the hoof
    B.push(['s', [x * 1.15, 0.7, -0.34 + st], [0.062, 0.17, 0.115], [-0.3, 0, 0], t]);
    B.push(['c', [x, 0.5, -0.4 + st], [0.034, 0.062, 0.036], [0.6, 0, 0], t, d]);
    B.push(['s', [x, 0.385, -0.475 + st], [0.03, 0.036, 0.034], [0, 0, 0], d]);
    B.push(['c', [x, 0.22, -0.445 + st], [0.019, 0.078, 0.019], [-0.2, 0, 0], d]);
    B.push(['k', [x, 0.045, -0.405 + st], [0.03, 0.045, 0.04], [0, 0, 0], hf]);
  }
  // neck and head, about the shoulder: the neck rises out of the chest, thick at its root and slim under the jaw
  H.push(['c', [0, 0.1, 0.045], [0.088, 0.085, 0.1], [0.5, 0, 0], t, t]);
  H.push(['c', [0, 0.28, 0.135], [0.062, 0.09, 0.066], [0.38, 0, 0], t, t]);
  H.push(['s', [0, 0.16, 0.14], [0.05, 0.17, 0.045], [0.45, 0, 0], p]);                 // pale throat
  H.push(['s', [0, 0.47, 0.235], [0.068, 0.07, 0.1], [0.3, 0, 0], t, d]);               // skull
  H.push(['s', [0, 0.435, 0.335], [0.042, 0.04, 0.08], [0.32, 0, 0], t, d]);            // the long face
  H.push(['s', [0, 0.405, 0.41], [0.03, 0.028, 0.03], [0, 0, 0], hf]);                  // dark nose
  H.push(['s', [0, 0.4, 0.33], [0.03, 0.02, 0.06], [0.3, 0, 0], p]);                    // pale chin
  for (const sgn of [-1, 1]) {
    H.push(['k', [0.105 * sgn, 0.565, 0.17], [0.04, 0.095, 0.016], [-0.15, 0.35 * sgn, -1.0 * sgn], t, p]);    // big ears, held wide
    H.push(['s', [0.058 * sgn, 0.485, 0.29], [0.014, 0.014, 0.012], [0, 0, 0], hf]);                             // eye
  }
  return { body: lumps(units, B, noise), head: lumps(units, H, noise, 0.08), headAt: [0, 0.86, 0.4] };
}
function furMaterial(S, rim) {
  const m = new THREE.MeshLambertMaterial({ vertexColors: true });
  m.onBeforeCompile = (shader) => {
    shader.uniforms.uPsShade = S.uShade; shader.uniforms.uPsFront = S.uFront; shader.uniforms.uPsRim = { value: rim };
    shader.vertexShader = shader.vertexShader.replace('#include <common>', '#include <common>\nvarying float vPsY;').replace('#include <project_vertex>', '#include <project_vertex>\nvPsY = (modelMatrix*vec4(transformed, 1.0)).y;');
    shader.fragmentShader = shader.fragmentShader.replace('#include <common>', '#include <common>\nvarying float vPsY; uniform vec3 uPsRim;\n' + GLSL_PS)
      .replace('#include <aomap_fragment>', 'reflectedLight.directDiffuse *= psLit(vPsY);\n#include <aomap_fragment>')
      .replace('#include <opaque_fragment>', '{ float psR = 1.0 - clamp(dot(normalize(normal), normalize(vViewPosition)), 0.0, 1.0); outgoingLight += uPsRim*(psR*psR*psR)*(0.4 + 0.6*clamp(normal.y + 0.5, 0.0, 1.0)); }\n#include <opaque_fragment>');
  };
  m.customProgramCacheKey = () => 'ps-fur';
  return m;
}

export default {
  id: 'petal-storm',
  name: 'Thousand-Tree Mountain',
  category: 'wilderness',
  weirdness: 0.1,
  media: ['air'],
  async build(ctx) {
    const R = ctx.rng, noise = ctx.noise, vary = ctx.vary || {};
    const detail = ctx.quality?.detail ?? 1, density = clamp(vary.density ?? 1, 0.7, 1.3);
    const V3 = (x, y, z) => new THREE.Vector3(x, y, z), col = (h) => new THREE.Color(h);
    const XR = (label) => makeRng(hashSeed('ps:' + label + ':' + (ctx.seed ?? 1)));      // generators for later additions: they leave every older random draw as it was

    // ---------- what this visit is ----------
    const pick = R.fork('look')(), hour = vary.hour || 'any';
    const lookName = hour === 'dawn' ? 'dawn' : hour === 'golden' ? 'golden' : hour === 'night' ? 'moon' : hour === 'day' ? (pick < 0.8 ? 'morning' : 'snow')
      : pick < 0.26 ? 'morning' : pick < 0.42 ? 'dawn' : pick < 0.6 ? 'morning' : pick < 0.74 ? 'golden' : pick < 0.87 ? 'snow' : 'moon';
    const LK = LOOKS[lookName], moon = lookName === 'moon', terminator = LK.shade[2] < 1;
    const sp = R.fork('season')(), season = sp < 0.5 ? 'peak' : sp < 0.75 ? 'early' : 'late';
    const castR = R.fork('cast'), kite = castR() > 0.3, troopN = castR.int(7, 9), warblers = castR() > 0.25;
    const rare = !!vary.rare;
    const seasonShift = season === 'early' ? 0.75 : season === 'late' ? -0.8 : 0;
    const airCalm = (season === 'early' ? 0.22 : season === 'late' ? 1 : 0.6) * (0.75 + 0.25 * density), raftCover = clamp((season === 'early' ? 0.25 : season === 'late' ? 0.95 : 0.6) * density, 0.1, 1);

    const scene = new THREE.Scene();
    const sunDir = skyDirection(LK.el, LK.az);
    const sky = makeSky({ rng: R.fork('sky'), ...LK.sky, ...(moon ? { bake: !!ctx.renderer, renderer: ctx.renderer, bakeSize: 256 } : { sunElevation: LK.el, sunAzimuth: LK.az }) });
    scene.add(sky.object);
    await ctx.yield();
    scene.fog = new THREE.FogExp2(col(LK.fog), LK.fogD);
    const hazeC = col(LK.fog).lerp(col('#8fb4dc'), moon ? 0 : 0.3);
    const sunLight = new THREE.DirectionalLight(col(LK.sun), LK.sunI); sunLight.position.copy(sunDir).multiplyScalar(500); scene.add(sunLight);
    const hemi = new THREE.HemisphereLight(col(LK.hemiSky), col(LK.hemiGround), LK.hemiI); scene.add(hemi);

    // palette (linear albedo); by moonlight blossom goes to silver
    const tone = (hex, k = 1) => { const c = col(hex).multiplyScalar(k); if (moon) { const g = 0.3 * c.r + 0.55 * c.g + 0.15 * c.b; c.lerp(new THREE.Color(g * 0.95, g, g * 1.12), 0.78); } else if (lookName === 'dawn') { const g = 0.3 * c.r + 0.55 * c.g + 0.15 * c.b; c.lerp(new THREE.Color(g * 0.97, g, g * 1.08), 0.18); } return c; };
    const hx = (hex) => '#' + tone(hex, moon ? 0.5 : 1).getHexString();                              // the same, as a colour string for the kit
    const cPale = tone(PALETTE[0], 0.78), cShell = tone(PALETTE[1], 0.86), cRose = tone(PALETTE[2], 0.92), cCopper = tone(PALETTE[3]), cCedar = tone(PALETTE[4]), cJade = tone(PALETTE[5]);
    const cLime = tone('#9cc24a', 0.9), cGreen = tone('#5f8a3a'), cMaroon = tone('#5c3038'), cAzalea = tone('#c05cc4', 0.9), cYama = tone('#f2c21c', 0.9);
    const stageCols = [cCopper.clone().lerp(cGreen, lookName === 'golden' ? 0.82 : 0.55), cPale.clone().lerp(cShell, 0.3), cShell.clone().lerp(cPale, 0.25), cRose.clone().lerp(cShell, 0.5), cMaroon.clone().lerp(cRose, 0.3)];
    const sunC = col(LK.sun).multiplyScalar(LK.sunI), skyC = col(LK.hemiSky).multiplyScalar(LK.hemiI), gndC = col(LK.hemiGround).multiplyScalar(LK.hemiI);
    const windV = V3(-142, 46, 160).normalize();
    // the stream's own colours: the jade of its body (deeper and cleaner than the palette's leaf jade, so that it carries at
    // first light), the blue of the open sky it mirrors, and the pale blue of the far slope a low ray finds up the valley
    const cJadeW = cJade.clone().lerp(tone('#27a874'), 0.7).multiplyScalar(moon ? 0.8 : 1.0);
    const cWaterSky = moon ? col('#3a4c80') : col(LK.sky.mid).lerp(col(LK.sky.zenith), 0.25), cWaterLow = cWaterSky.clone().lerp(col(LK.fog), 0.55).lerp(col('#dfeaf2'), moon ? 0 : 0.2);
    const S = {
      uShade: { value: new THREE.Vector4(LK.shade[0], LK.shade[1], LK.shade[2], 0) }, uFront: { value: new THREE.Vector4(-900, WHX, WHZ, 0) },
      uSunDir: { value: sunDir.clone() }, uSunCol: { value: sunC }, uSky: { value: skyC }, uGround: { value: gndC },
      uPale: { value: cPale }, uShell: { value: cShell }, uRose: { value: cRose }, uLeaf: { value: [cCopper.clone().lerp(cShell, 0.36).lerp(cGreen, lookName === 'golden' ? 0.4 : 0).multiplyScalar(0.95), cLime, cGreen, cMaroon] },
      uViewH: { value: 1080 }, uWindV: { value: windV.clone().multiplyScalar(FRONT_V) }, uLead: { value: 0.4 }, uLane: { value: 0 },
      uSkyH: { value: cWaterLow }, uSkyZ: { value: cWaterSky }, uJade: { value: cJadeW }, uRaft: { value: raftCover }, uWat: { value: terminator ? V3(0.2, 0.42, 0) : moon ? V3(0.12, 0.6, 0) : V3(0.07, 0.62, 0) },
      uStage: { value: stageCols }, uCedar: { value: tone('#3c6a50') }, uMoss: { value: tone('#4b7030') }, uHaze: { value: new THREE.Vector4(0, 0, 0, 0) }, uCan: { value: new THREE.Vector4(120, 290, (season === 'early' ? 0.45 : season === 'late' ? 1.15 : 0.85) * (moon ? 0.4 : 1), 0) },
      uSunXZ: { value: new THREE.Vector2(sunDir.x, sunDir.z).normalize() }, tForest: { value: null }, uMapBox: { value: new THREE.Vector4(...MAPBOX) },
      tShade: { value: null }, uShBox: { value: new THREE.Vector4(...SHBOX) }, uDap: { value: new THREE.Vector4(LK.dapple || 0, LK.pools || 0, 0, 0) }, uKnoll: { value: new THREE.Vector4(CRAG[0], CRAG[1], 0, 0) },
    };
    S.uHaze.value.set(hazeC.r, hazeC.g, hazeC.b, LK.haze);

    // ---------- the hero first ----------
    const hero = await buildHero(ctx, { palette: PALETTE, hour: LK.hero.hour, season, weather: LK.hero.weather, density: Math.min(density, 1.05), demo: false, petals: 30000, blossoms: 5000, strip: 0 });
    hero.object.position.set(0, TY, 0); hero.object.scale.setScalar(HS); scene.add(hero.object);
    const heroLimbs = hero.object.getObjectByName('cherry-limbs');          // hidden while the closed curtain hides them from the loop above
    hero.setSun(LK.heroSun);
    const heroPetalG = hero.parts.petals.geometry, heroPetalN = heroPetalG.instanceCount;   // (thinned while the tree is far up the stream: see update)
    await ctx.yield();

    // ---------- the lie of the land ----------
    const mPh = R.range(0, 6.28), mPh2 = R.range(0, 6.28);
    const waterY = (z) => -0.012 * clamp(z, -900, 900);
    const sx = (z) => {                                                           // stream centre line: south under the entry, east round the terrace, north-east beyond
      let x = 8 + 35 * smoothstep(100, 38, z);
      x += 1.3 * Math.sin(z * 0.036 + mPh) * smoothstep(120, 165, z);
      x += 3.0 * Math.sin(z * 0.021 + mPh2) * smoothstep(-110, -170, z);
      const t = Math.max(0, -138 - z); return x + 2.3 * t * t / (t + 90);        // it comes round the foot of the spur from the east
    };
    const sxT = (z) => (sx(z + 1) - sx(z - 1)) * 0.5;                             // dx/dz

    // the flight: up the stream, under the crown, out and round the loop, back over the tree, up the spur to the saddle
    const pts = [[8, 5.6 + waterY(191.2), 191.2], [8, 4.3 + waterY(165), 165], [8, 3.6 + waterY(130), 130], [8.2, 3.6 + waterY(95), 95], [8.8, 6.2 + waterY(80), 80], [9.4, 7.8 + waterY(65), 65], [9.8, 11.0 + waterY(50), 50],
      [LX, 16.4, 35], [LX, LY, 22], [LX, LY, 8], [LX, LY, -6], [LX, LY + 0.2, -19], [12.6, 18.2, -33], [15.6, 19.8, -40.5]];
    // the wide left turn, north along the stream and round to the west ...
    for (let a = 0; a <= 90; a += 22.5) { const r = a * Math.PI / 180; pts.push([CRAG[0] + RB * Math.cos(r), 21.5 + 23.5 * a / 90, CRAG[1] - RO + RB - RB * Math.sin(r)]); }
    // ... tightening into a quarter orbit of the serow's crag, which leaves us heading south at the tree
    for (const b of [120, 150, 180, 200]) { const r = b * Math.PI / 180; pts.push([CRAG[0] + RO * Math.cos(r), 45.0 + 1.2 * (b - 90) / 90, CRAG[1] - RO * Math.sin(r)]); }
    pts.push([-57.5, 46.6, -86], [-52, 46.4, -70], [-43, 45.4, -54], [PX - 8, 44.4, -37], [PX - 5, PY + 1.2, -18], [PX - 5, PY + 1.5, 0], [-35.5, 42.6, 16], [-42, 45, 34], [-54, 49.5, 54]);
    const F0 = [P0[0] - 59.67 * WHX, P0[1] - 6.27, P0[2] - 59.67 * WHZ];
    pts.push([F0[0] - 35 * WHX, F0[1] - 7.5, F0[2] - 35 * WHZ], F0, [(F0[0] + P0[0]) / 2, (F0[1] + P0[1]) / 2, (F0[2] + P0[2]) / 2], P0);
    const path = makePath(pts), L = path.length;
    const tmpA = V3(), tmpB = V3(), tmpC = new THREE.Color();
    const leg = [];                                                                // the last leg, for the ramp of ground that climbs under it
    for (let i = 0; i <= 72; i++) { const u = 0.72 + 0.28 * i / 72; path.pointAt(u, tmpA); leg.push([tmpA.x, tmpA.y, tmpA.z, u]); }
    const legAx = leg[0][0], legAz = leg[0][2], legDx = P0[0] - legAx, legDz = P0[2] - legAz, legL2 = legDx * legDx + legDz * legDz;
    const uAt = (x, z) => path.nearestXZ(x, z).u;
    const uHit = 0.59, uEnd = uHit + 0.064;                                          // the gust reaches the great tree at uHit; its clock runs three seconds to uEnd

    let knollA = 0;
    const height = (x, z) => {
      const cx = sx(z), d = x - cx, ad = Math.abs(d);
      let h;
      if (d < 0) {
        const dw = Math.max(0, -d - HW);
        const q = ((x - P0[0]) * WHX + (z - P0[2]) * WHZ) / SP;
        let bump = 0;
        if (q < -0.5) { const qf = (q - Math.round(q)) * SP / 62; bump = Math.exp(-qf * qf); }
        const und = noise.n2(x * 0.011 + 3, z * 0.011) * Math.min(dw * 0.05, 7) + noise.n2(x * 0.045, z * 0.045 + 9) * Math.min(dw * 0.02, 1.2);
        // the mountain is measured from a valley line that swings east more gently than the stream does, and it rounds off to
        // a summit ridge: north of the spur there is sky, not a wall
        const tn = Math.max(0, -138 - z), dm = Math.max(0, dw - Math.max(0, 2.3 * tn * tn / (tn + 90) - 0.5 * tn)), dc = Math.min(dm, 700);
        h = (0.36 * dc + 0.00028 * dc * dc + 0.2 * (dm - dc) + Math.min(0.13 * dm, 60) * bump) * (q > 0 ? 1 / (1 + 1.7 * q) : 1) + und;
        if (z < -146) { const sxx = (x - SPUR[0]) / (x < SPUR[0] ? SPUR[3] : SPUR[1]); h += (SPUR[2] * Math.exp(-sxx * sxx) * smoothstep(-146, -252, z) * (1 - 0.45 * smoothstep(-330, -470, z)) + 30 * Math.exp(-((x - 32) ** 2 + (z + 226) ** 2) / 2900)) * smoothstep(0, 50, dw); }   // and a shoulder that stands behind the great tree's east side   // the spur across the valley head
        if (z > 26 && z < 120 && x > -34) h *= 1 - 0.6 * smoothstep(120, 98, z) * smoothstep(26, 40, z) * smoothstep(-34, -14, x);   // the apron below the terrace: the banks lie back so the whole tree stands clear from down the stream
        const kr = Math.hypot(x - CRAG[0], z - CRAG[1]); if (kr < 28) { const kk = kr / 11.5; h += knollA * Math.exp(-kk * kk * kk); }      // the serow's knoll
        h += 0.9 * smoothstep(0, 2.5, dw);
        if (x < -8 && z > -30 && z < 240 && x > -230) {                             // the spur that carries the last leg up to its saddle
          let best = 1e9, bi = 0;
          const ct = clamp(((x - legAx) * legDx + (z - legAz) * legDz) / legL2, 0, 1), cdx = legAx + legDx * ct - x, cdz = legAz + legDz * ct - z;
          if (cdx * cdx + cdz * cdz < 9200) {                                       // near the chord of the leg at all?
            for (let i = 0; i < leg.length; i += 6) { const dx = leg[i][0] - x, dz = leg[i][2] - z, d2 = dx * dx + dz * dz; if (d2 < best) { best = d2; bi = i; } }
            for (let i = Math.max(0, bi - 5), e = Math.min(leg.length - 1, bi + 5); i <= e; i++) { const dx = leg[i][0] - x, dz = leg[i][2] - z, d2 = dx * dx + dz * dz; if (d2 < best) { best = d2; bi = i; } }
          }
          const lu = leg[bi][3], w = best > 6400 ? 0 : smoothstep(80, 16, Math.sqrt(best)) * smoothstep(0.745, 0.8, lu) * smoothstep(-8, -30, x);
          if (w > 0) {
            let tgt = leg[bi][1] - lerp(13, RR + 0.3, smoothstep(0.9, 1, lu)) - 0.9 * noise.n2(x * 0.05, z * 0.05);
            const ax = (x - P0[0]) * WHZ - (z - P0[2]) * WHX, pp = (x - P0[0]) * WHX + (z - P0[2]) * WHZ;
            tgt += 5.5 * (Math.exp(-((ax - 27) ** 2 + pp * pp) / 300) + Math.exp(-((ax + 25) ** 2 + pp * pp) / 260));   // the two shoulders of the saddle
            h = lerp(h, tgt, w);
          }
        }
      } else {
        const de = Math.max(0, d - HW);
        h = 0.6 * smoothstep(0, 2.5, de) + 0.2 * de + 0.24 * Math.max(0, de - 14) + 0.0002 * de * de + 9 * noise.n2(x * 0.006 + 20, z * 0.006) * smoothstep(20, 160, de);   // the far side: steep, and dark with cedar
      }
      if (ad < HW + 0.4) h = Math.min(h, 0) - 1.5 + 1.3 * smoothstep(HW - 2.6, HW + 0.4, ad);                             // the bed
      h += waterY(z);
      const r = Math.hypot(x, z);
      if (r < 43) { const re = r * (1 + 0.07 * Math.sin(Math.atan2(z, x) * 3 + 1)), tw = smoothstep(38, 28.5, re); if (tw > 0) h = lerp(h, TY - 0.45 - 0.5 * smoothstep(26, 19, re), tw); }   // the terrace
      return h;
    };

    const KNOLL_TOP = 40.0; knollA = KNOLL_TOP - height(CRAG[0], CRAG[1]); S.uKnoll.value.z = knollA;
    // the spur's fall: its line on the map, and how far a point lies from it
    const fdX = FALL[2] - FALL[0], fdZ = FALL[3] - FALL[1], fLen = Math.hypot(fdX, fdZ), fuX = fdX / fLen, fuZ = fdZ / fLen;
    const fallDist = (x, z) => { const t = clamp(((x - FALL[0]) * fuX + (z - FALL[1]) * fuZ) / fLen, -0.12, 1.1); return Math.hypot(x - FALL[0] - fdX * t, z - FALL[1] - fdZ * t); };
    // nothing tall stands on the fall's line, nor between its foot and the turn it is seen from
    const fvX = 8 - FALL[0], fvZ = -72 - FALL[1], fvL = Math.hypot(fvX, fvZ);
    const fallClear = (x, z) => { if (fallDist(x, z) < 15) return true; const t = ((x - FALL[0]) * fvX + (z - FALL[1]) * fvZ) / fvL; if (t < 0 || t > 64) return false; return Math.abs((x - FALL[0]) * fvZ - (z - FALL[1]) * fvX) / fvL < 11 + 0.2 * t; };
    // what grows where: out = [cedar, cover, bloom stage 0..4, petal litter]
    const cedOff = R.range(0, 40);
    const forestAt = (x, z, h, out) => {
      const cx = sx(z), d = x - cx, hr = h - waterY(z), r0 = Math.hypot(x, z);
      let cover = smoothstep(HW + 2.5, HW + 8, Math.abs(d)) * smoothstep(36, 43, r0);      // (the saddle keeps its cover: sasa thickets and petal drifts run right up to the ring)
      let ced = smoothstep(0.1, 0.2, noise.n2(x / 150 + 7.3 + cedOff, z / 150 - 2.1) + 0.3 * noise.n2(x / 47 + 1, z / 47));
      const q = ((x - P0[0]) * WHX + (z - P0[2]) * WHZ) / SP;
      if (d < 0) {                                                                 // the dark spur that stands behind the weeping cherry
        const k = Math.exp(-(((q + 1.14) * SP / 78) ** 2)) * smoothstep(-28, -70, d) * smoothstep(-460, -330, d);
        ced = Math.max(ced, smoothstep(0.3, 0.55, k));
        ced *= smoothstep(56, 72, Math.hypot(x + 22, z + 82));                     // the orchard the turn is flown over keeps its sky
        // the spur across the valley head: black cedar from forty metres above the stream to its crest, a band of blossom at its foot
        if (z < -146) ced = Math.max(ced, smoothstep(-156, -184, z) * smoothstep(30, 46, hr) * smoothstep(-270, -190, x), smoothstep(-148, -160, z) * smoothstep(12, 22, hr) * smoothstep(-100, -72, x));   // and, behind the great tree, from its foot
        if (z > -40 && x > -260) ced *= smoothstep(40, 62, Math.abs((x - P0[0]) * WHZ - (z - P0[2]) * WHX));   // and the last leg its blossom
      } else ced = Math.max(ced, 0.97 * smoothstep(20, 54, d));                     // the far side of the valley is cedar from the bank up
      if (z > 20 && Math.abs(x - 8) < 26) ced *= smoothstep(14, 26, Math.abs(x - 8));
      if (z < -140) ced *= smoothstep(7, 20, fallDist(x, z));                         // the fall comes down a scar of wet rock, not through the canopy
      out[0] = ced * cover; out[1] = cover;
      out[2] = clamp(1.05 + 0.85 * smoothstep(34, 120, hr) + 1.1 * smoothstep(170, 270, hr) + smoothstep(310, 390, hr) + 0.75 * smoothstep(-60, -125, z) * smoothstep(0, -30, d) * (1 - smoothstep(30, 60, hr)) + seasonShift + 0.25 * noise.n2(x * 0.02, z * 0.02 + 4), 0, 4);
      out[3] = clamp(cover * (1 - ced) * (1 - 0.3 * Math.max(smoothstep(-18, -40, z), smoothstep(-20, -40, x)) * smoothstep(43, 50, r0)) + smoothstep(38, 28, r0) * 0.9 + 0.85 * smoothstep(HW + 10, HW + 1, Math.abs(d)), 0, 1);
      return out;
    };

    // the forest map: the terrain shader paints its far canopy from it, and the ground takes its needle litter from it
    const F4 = [0, 0, 0, 0];
    const FN = 144, fData = new Uint8Array(FN * FN * 4);
    for (let j = 0; j < FN; j++) {
      for (let i = 0; i < FN; i++) {
        const x = MAPBOX[0] + (i + 0.5) / FN * MAPBOX[2], z = MAPBOX[1] + (j + 0.5) / FN * MAPBOX[3];
        forestAt(x, z, height(x, z), F4); const o = (j * FN + i) * 4;
        fData[o] = F4[0] * 255; fData[o + 1] = F4[1] * 255; fData[o + 2] = F4[2] / 4 * 255; fData[o + 3] = F4[3] * 255;
      }
      if ((j & 1) === 1) await ctx.yield();
    }
    { const tex = new THREE.DataTexture(fData, FN, FN, THREE.RGBAFormat); tex.magFilter = tex.minFilter = THREE.LinearFilter; tex.needsUpdate = true; S.tForest.value = tex; }
    const cedAt = (x, z) => {
      const fx = clamp((x - MAPBOX[0]) / MAPBOX[2] * FN - 0.5, 0, FN - 1.001), fz = clamp((z - MAPBOX[1]) / MAPBOX[3] * FN - 0.5, 0, FN - 1.001);
      const i0 = Math.floor(fx), j0 = Math.floor(fz), u = fx - i0, v = fz - j0, o = (j0 * FN + i0) * 4;
      return ((fData[o] * (1 - u) + fData[o + 4] * u) * (1 - v) + (fData[o + FN * 4] * (1 - u) + fData[o + FN * 4 + 4] * u) * v) / 255;
    };

    const cMoss = tone('#5f8038'), cSasa = tone('#86a352'), cNeedle = tone('#3d4a32'), cGravel = tone('#3f4a3c'), cBed = tone('#4e5f50'), cTerr = tone('#557c2c'), cDeep = tone('#41602c');
    const groundColor = (x, z, h, ny, out) => {
      const n1 = noise.n2(x * 0.09, z * 0.09), n2 = noise.n2(x * 0.31 + 9, z * 0.31), ad = Math.abs(x - sx(z)), r0 = Math.hypot(x, z);
      out.copy(cMoss).lerp(cSasa, clamp(0.5 + 0.7 * n1, 0, 1));
      out.lerp(cDeep, 0.6 * Math.max(smoothstep(-18, -40, z), smoothstep(-20, -40, x)) * smoothstep(43, 50, r0));   // the open ground of the loop: deep sasa green, not lawn
      out.lerp(cNeedle, cedAt(x, z) * 0.85);
      { const dP = Math.hypot(x - P0[0], z - P0[2]); if (dP < 110) { const k = smoothstep(110, 40, dP); out.lerp(cDeep, k * clamp(0.5 + 0.9 * noise.n2(x * 0.19 + 31, z * 0.19), 0.15, 0.9)); out.lerp(cSasa, 0.3 * k * smoothstep(0.1, 0.5, noise.n2(x * 0.07 - 9, z * 0.07 + 2))); } }   // the saddle: deep sasa green in patches, never one lime sheet
      out.lerp(cTerr, smoothstep(36, 27, r0) * 0.9);
      { const wk = 1 - smoothstep(HW + 0.6, HW + 3.8, ad); out.lerp(cGravel, 0.82 * wk); out.lerp(cMoss, 0.55 * wk * smoothstep(-0.1, 0.35, noise.n2(x * 0.23 + 40, z * 0.23 - 13))); }   // the banks: wet dark stone, moss in cushions over it
      if (ad < HW + 0.5) out.lerp(cBed, 0.85);
      return out.multiplyScalar(0.82 + 0.22 * n2);
    };
    await ctx.yield();

    // the ground's detail texture, made here in rising sizes: thumbnails first (the kit's code runs cold, which is most of its cost), then the real one
    const rdw = R.fork('detail-warm');
    for (const size of [24, 32, 48, 64]) { const w = T.makeDetailTexture({ rng: rdw, size }); w.userData.cell?.dispose(); w.dispose(); await ctx.yield(); }
    const detailTex = T.makeDetailTexture({ rng: R.fork('detail'), size: 128 });
    await ctx.yield();
    const terrain = await T.makeTerrainAsync({
      detailTexture: detailTex,
      rng: R.fork('land'), noise, path, height, corridor: false, bounds: [-760, -760, 660, 660], cell: 3, near: 34, levels: 3, refine: 2, maxTriangles: 40000,
      biome: 'meadow', palette: { rock: '#666a70', rockB: '#4e5257', rockSlope: [0.6, 0.8], strata: 0.25, patch: '#b8c88a', patchAmount: 0.25, tufts: 0, streaks: 0, pebbles: 0.3, clouds: LK.cloudShadow,
        ...(LK.snow ? { snow: '#dfe8f2', snowLine: 0.5, snowBlend: 0.07 } : {}) },
      color: groundColor, sunDir, shadow: 0, ao: 0, skirt: 30, heightRange: [-12, 520],
    }, ctx.yield);
    scene.add(terrain.object);
    const groundAt = (x, z) => terrain.surfaceAt(x, z);
    await ctx.yield();

    psPatch(terrain.material, S, 'terrain');
    await ctx.yield();

    // ---------- the stream ----------
    const rowsZ = []; for (let z = -700; z < 640;) { rowsZ.push(z); z += (z > -262 && z < 258) ? 2.5 : 12; }
    const rowsS = new Float32Array(rowsZ.length);
    for (let i = 1; i < rowsZ.length; i++) rowsS[i] = rowsS[i - 1] + Math.hypot(rowsZ[i] - rowsZ[i - 1], sx(rowsZ[i]) - sx(rowsZ[i - 1]));
    const alongAt = (z) => { let lo = 0, hi = rowsZ.length - 1; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (rowsZ[m] <= z) lo = m; else hi = m; } return lerp(rowsS[lo], rowsS[hi], clamp((z - rowsZ[lo]) / (rowsZ[hi] - rowsZ[lo]), 0, 1)); };
    // boulders: pale and mossy, in the water and along the banks
    const rb = R.fork('boulders'), boulders = [];
    for (let z = -250; z < 232;) {
      const cx = sx(z), r = Math.min(1.15, rb.range(0.55, 1.5) * (rb.chance(0.15) ? 1.25 : 1));
      let o = rb.range(-1, 1) * (HW - 0.9), x = cx + o;
      if (z > 20 && Math.abs(x - 8) < 2.8 + r) x = 8 + (rb.chance(0.5) ? 1 : -1) * (2.8 + r), o = x - cx;
      if (Math.abs(o) < HW - 0.2 && !(z > 185)) boulders.push({ x, z, r, y: waterY(z) - r * 0.42, inStream: true });
      z += rb.range(5.5, 10.5);
    }
    for (let i = 0; i < Math.round(46 * (0.8 + 0.2 * detail)); i++) {                // on the banks and up the mossy ramp to the terrace
      const z = rb.range(-240, 215), side = rb.chance(0.5) ? 1 : -1, x = sx(z) + side * (HW + rb.range(0.2, 5.5)), r = rb.range(0.45, 1.25);
      if (path.distanceTo(x, groundAt(x, z) + r, z) < 5 + r || Math.hypot(x, z) < 39) continue;
      boulders.push({ x, z, r, y: groundAt(x, z) - r * 0.3, inStream: false });
    }
    for (let i = 0; i < 16; i++) {
      const x = rb.range(-12, 30), z = rb.range(30, 92), r = rb.range(0.6, 1.15);
      if (Math.abs(x - 8) < 5 + r || Math.abs(x - sx(z)) < HW + 1 || Math.hypot(x, z) < 39) continue;
      boulders.push({ x, z, r, y: groundAt(x, z) - r * 0.35, inStream: false });
    }
    await ctx.yield();
    // pale boulders standing in mid-stream on the first reach and below the terrace, each with its pillow of foam and its wake
    const ford = [[-3.3, 166, 1.1], [3.0, 154, 0.95], [-2.5, 141, 1.05], [2.7, 126, 0.9], [-2.4, 97, 1.05], [2.2, 86, 0.95], [-1.2, 70, 1.1]].map(([o, z, r]) => ({ x: sx(z) + o, z, r, y: waterY(z) - r * 0.38, inStream: true }));
    const CELL = 8, z0c = -256, nCells = 62, along0 = alongAt(z0c);
    const bData = new Float32Array(nCells * 3 * 4), inS = [...boulders.filter((b) => b.inStream), ...ford], cellB = [];
    for (let c = 0; c < nCells; c++) {
      // the cell's centre in the world, then its three nearest boulders
      const sMid = along0 + (c + 0.5) * CELL; let zc = z0c + (c + 0.5) * CELL;
      for (let k = 0; k < 4; k++) zc += (sMid - alongAt(zc)) * 0.9;
      const xc = sx(zc), near = inS.map((b) => ({ b, d: Math.hypot(b.x - xc, b.z - zc) })).filter((e) => e.d < 13).sort((a, b) => a.d - b.d);
      cellB.push(near.slice(0, 3).map((e) => e.b));
    }
    // (a cell knows three stones; where four crowd together a stone's wake would stop dead at the cell's edge. Each stone
    // carries how far down and up the stream it is known, and its white water dies away inside that reach)
    for (let c = 0; c < nCells; c++) cellB[c].forEach((b, k) => {
      const sb = alongAt(b.z), wr = 1.2 * Math.sqrt(Math.max(0.04, b.r * b.r - (b.r * 0.42) ** 2));
      let cd = c + 1; while (cd < nCells && cellB[cd].includes(b)) cd++;
      let cu = c - 1; while (cu >= 0 && cellB[cu].includes(b)) cu--;
      const rd = clamp(along0 + cd * CELL - sb, 0.5, 60), ru = clamp(sb - (along0 + (cu + 1) * CELL), 0.5, 60);
      bData.set([b.x, b.z, wr, Math.min(rd, 63.5) + 64 * Math.floor(ru)], (c * 3 + k) * 4);
    });
    const bTex = new THREE.DataTexture(bData, nCells * 3, 1, THREE.RGBAFormat, THREE.FloatType); bTex.magFilter = bTex.minFilter = THREE.NearestFilter; bTex.needsUpdate = true;
    {
      const acr = [-1.24, -1, -0.62, -0.2, 0.2, 0.62, 1, 1.24], nA = acr.length, pos = [], st = [], idx = [];
      for (let i = 0; i < rowsZ.length; i++) {
        const z = rowsZ[i], cx = sx(z), tx = sxT(z), tl = Math.hypot(tx, 1), tnx = tx / tl, tnz = 1 / tl, y = waterY(z) + 0.02;
        for (let a = 0; a < nA; a++) { const o = acr[a] * HW; pos.push(cx + tnz * o, y, z - tnx * o); st.push(o, rowsS[i], tnx, tnz); }
        if (i > 0) for (let a = 0; a < nA - 1; a++) { const p = (i - 1) * nA + a, q = i * nA + a; idx.push(p, q, p + 1, p + 1, q, q + 1); }
      }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aSt', new THREE.Float32BufferAttribute(st, 4)); g.setIndex(idx);
      const water = new THREE.Mesh(g, streamMaterial(S, bTex, nCells, CELL, along0)); water.name = 'stream'; scene.add(water);
      // the wet margin, either bank, along the reaches the path follows
      { const bo = [0.86, 0.98, 1.1, 1.24, 1.4, 1.58, 1.78], nB = bo.length, bp = [], ba = [], bi = [];
        let row = 0, prev = false;
        for (let i = 0; i < rowsZ.length; i++) {
          const z = rowsZ[i], cx = sx(z), wy = waterY(z);
          const on = z > -262 && z < 258 && path.distanceTo(cx, wy, z) < 95;
          if (on) {
            const tx = sxT(z), tl = Math.hypot(tx, 1), tnx = tx / tl, tnz = 1 / tl;
            for (let sd = -1; sd <= 1; sd += 2) for (let a = 0; a < nB; a++) { const o = bo[a] * HW * sd, x = cx + tnz * o, zz = z - tnx * o; bp.push(x, Math.max(groundAt(x, zz), wy) + 0.09, zz); ba.push(a / (nB - 1), rowsS[i]); }
            if (prev) for (let sd = 0; sd < 2; sd++) for (let a = 0; a < nB - 1; a++) { const p0 = (row - 1) * nB * 2 + sd * nB + a, q0 = p0 + nB * 2; bi.push(p0, q0, p0 + 1, p0 + 1, q0, q0 + 1); }
            row++;
          }
          prev = on;
        }
        if (bi.length) {
          const bg = new THREE.BufferGeometry(); bg.setAttribute('position', new THREE.Float32BufferAttribute(bp, 3)); bg.setAttribute('aB', new THREE.Float32BufferAttribute(ba, 2)); bg.setIndex(bi);
          const bank = new THREE.Mesh(bg, bankMaterial(S)); bank.name = 'wet-banks'; bank.renderOrder = -1; scene.add(bank);
        } }
    }
    await ctx.yield();

    // rocks: kit boulders in and beside the stream (none scaled past one and a half); the macaques' roof, the serow's crag and
    // the wet ledges of the fall are this world's own stacks of beds
    const rockMat = T.makeRockMaterial({ terrain, top: tone('#4f7430'), topAmount: 0.62, topSlope: [0.7, 0.97], strata: 0.15, contact: [0.5, 0.5, -0.1] });
    if (terminator) psPatch(rockMat, S, 'std');
    const rg = R.fork('rocks');
    const gBoulder = T.rockGeometry({ rng: rg, kind: 'boulder', radius: 1, detail: 2, color: '#b4b0a4', colorB: '#8f8c82' });
    const gBoulderC = T.rockGeometry({ rng: rg, kind: 'boulder', radius: 1, detail: 1, color: '#b0ac9f', colorB: '#8c897f' });
    await ctx.yield();
    const gBoulderB = T.rockGeometry({ rng: rg, kind: 'boulder', radius: 1, detail: 3, color: '#aeaa9e', colorB: '#86837a' });
    await ctx.yield();
    const mm = new THREE.Matrix4(), qq = new THREE.Quaternion(), ee = new THREE.Euler();
    const place = (x, y, z, sx_, sy_, sz_, ry, tilt = 0) => new THREE.Matrix4().compose(V3(x, y, z), qq.setFromEuler(ee.set(tilt, ry, tilt * 0.6)), V3(sx_, sy_, sz_));
    const small = [], big = [], farB = [], casters = [];                          // casters: [x, z, radius, strength] of everything that grounds itself with a shadow
    for (const b of boulders) {
      const pd = path.nearestXZ(b.x, b.z).dist, M = place(b.x, b.y, b.z, b.r * rg.range(0.95, 1.3), b.r * rg.range(0.75, 0.95), b.r * rg.range(0.95, 1.3), rg.range(0, 6.28), rg.range(-0.15, 0.15));
      (pd < 9 && b.r > 0.85 && big.length < 3 ? big : pd < 11 && b.r > 0.8 ? small : farB).push(M);
      if (!b.inStream) casters.push([b.x, b.z, b.r * 1.7, 0.5]);
    }
    const rockMeshes = [];
    rockMeshes.push(T.makeInstances(gBoulder, rockMat, small, { rng: rg, brightness: 0.16 }), T.makeInstances(gBoulderB, rockMat, big, { rng: rg, brightness: 0.12 }));
    if (farB.length) rockMeshes.push(T.makeInstances(gBoulderC, rockMat, farB, { rng: rg, brightness: 0.16 }));
    await ctx.yield();
    const lipM = [];
    for (let i = 0; i < 14; i++) {                                                 // stones bedding the terrace rim
      const a = rg.range(-1.0, 1.7), r = rg.range(29.5, 34), x = Math.cos(a) * r, z = Math.sin(a) * r, s = rg.range(0.75, 1.3);
      if (Math.abs(x - LX) < 7.5 + s) continue;
      lipM.push(place(x, groundAt(x, z) - s * 0.3, z, s * 1.15, s, s * 1.1, rg.range(0, 6.28), rg.range(-0.2, 0.2))); casters.push([x, z, s * 1.8, 0.45]);
    }
    rockMeshes.push(T.makeInstances(gBoulder, rockMat, lipM, { rng: rg, brightness: 0.1 }));
    { const rf = XR('ford'); rockMeshes.push(T.makeInstances(gBoulderB, rockMat, ford.map((b) => place(b.x, b.y, b.z, b.r * rf.range(1.0, 1.3), b.r * rf.range(0.8, 0.95), b.r * rf.range(1.0, 1.25), rf.range(0, 6.28), rf.range(-0.12, 0.12))), { rng: rf, brightness: 0.14 })); }
    for (const r of rockMeshes) scene.add(r.object);
    await ctx.yield();

    const cRockA = tone('#a5a49c'), cRockB = tone('#77787a'), cWetA = tone('#7d8589'), cWetB = tone('#4d5459');
    const rs = () => rg.range(0.05, 0.95);
    const stackAt = (x, z, a, b, rot, sink = 0.7) => { const g = groundAt(x, z); return [[x, g - sink, z, a, b, 1.1 + sink, rot, rs()], [x + 0.3 * Math.cos(rot), g + 0.75, z - 0.25, a * 0.7, b * 0.72, 0.95, rot + 0.5, rs()]]; };
    // the crag: five beds stepping up to the flat stone the serow stands on, and outcrops breaking out of the knoll below it
    const CX = CRAG[0], CZ = CRAG[1];
    const cragTop = [[CX, KNOLL_TOP - 1.9, CZ, 4.7, 3.9, 1.8, 0.3, rs()], [CX - 0.4, KNOLL_TOP - 0.5, CZ + 0.3, 3.8, 3.1, 1.3, 1.1, rs()], [CX + 0.3, KNOLL_TOP + 0.55, CZ - 0.2, 3.0, 2.5, 1.2, 0.5, rs()],
      [CX - 0.2, KNOLL_TOP + 1.5, CZ + 0.1, 2.35, 1.8, 1.0, 0.9, rs()], [CX, KNOLL_TOP + 2.28, CZ, 1.95, 1.4, 0.7, 0.35, rs()]];
    const cragBeds = [...cragTop];
    for (const [dx, dz, a, b] of [[1.5, -6.0, 2.3, 1.7], [-4.4, -4.6, 2.4, 1.8], [-6.4, 0.8, 2.2, 1.6], [-4.6, 5.2, 2.0, 1.6], [-2.0, -8.4, 1.8, 1.4], [-7.4, -5.2, 1.7, 1.3], [5.4, -3.4, 1.9, 1.5], [-8.2, 3.4, 1.5, 1.2]])
      { const f = Math.min(1, (dx > 1 && dz > -4 ? 6.2 : 3.3) / Math.hypot(dx, dz)); cragBeds.push(...stackAt(CX + dx * f, CZ + dz * f, Math.min(a, 2.0), b, rg.range(0, 3.14), 0.9)); }   // kept clear of the orbit
    const serowY = torTopAt(cragTop, CX, CZ);
    casters.push([CX, CZ, 7.5, 0.5]);
    // the mossy roof of rock outside the curtain, where the troop sits
    const roofY = groundAt(ROOF[0], ROOF[1]);
    // (its top slab lies a metre under the lens line and is turned so that its long side faces the flight: the troop sits at eye level)
    // (the ground here differs from seed to seed and the flight does not, so the roof is built up to the lens line, not up from the ground)
    const roofT = path.pointAt(0.345, V3()).y + 0.05, roofB = Math.min(roofY - 1.6, roofT - 3.2);
    // (rebuilt: a pile of river-worn boulders. A core, a broad low cap the troop sits on, and round them, on the sides the flight
    // sees, boulders a man's height and more that stand out of the pile at unequal heights, each with its own cap of moss)
    const roofBeds = [[ROOF[0] - 0.9, roofB, ROOF[1] - 0.2, 2.9, 2.8, (roofT - 0.62 - roofB) / 1.035, 0.95, rs(), 1], [ROOF[0] - 0.55, roofT - 1.5, ROOF[1] - 0.25, 2.7, 2.6, 1.08, 1.25, rs(), 1], [ROOF[0] - 0.25, roofT - 0.66, ROOF[1] + 0.05, 2.95, 3.2, 0.64, 0.2, rs(), 1],
      ...stackAt(ROOF[0] - 4.3, ROOF[1] + 2.4, 1.5, 1.2, 1.1, 0.5), ...stackAt(ROOF[0] - 1.6, ROOF[1] - 4.6, 1.4, 1.15, 2.3, 0.5), ...stackAt(ROOF[0] - 2.8, ROOF[1] + 4.9, 1.1, 0.9, 0.4, 0.4)];
    {
      const rr = XR('roof'), a0 = Math.atan2(0.71, 0.70);                                // the bearing of the lens from the roof
      for (let k = 0; k < 8; k++) {
        const a = a0 + (k - 3.5) * 0.52 + rr.range(-0.12, 0.12), d = rr.range(2.5, 3.1), rad = rr.range(1.15, 1.6), x = ROOF[0] - 0.5 + Math.cos(a) * d, z = ROOF[1] + Math.sin(a) * d;
        const y0 = groundAt(x, z) - 0.7, top = roofT - (k % 3 === 0 ? rr.range(0.75, 1.2) : rr.range(1.3, 2.7));
        if (top - y0 > 1.2) roofBeds.push([x, y0, z, rad * rr.range(0.9, 1.15), rad * rr.range(0.9, 1.15), (top - y0) / 1.035, rr.range(0, 3.14), rr.range(0.05, 0.95), 1]);
      }
    }
    const roofTop = (x, z) => { const t = torTopAt(roofBeds, x, z, 0.55); return t > -1e8 ? t : groundAt(x, z); };
    casters.push([ROOF[0], ROOF[1], 5.6, 0.5]);
    await ctx.yield();
    // their own stone, weathered round: mossed shoulders and tops, lichen-pale flanks (the same material as the stream's boulders)
    const cBldA = tone('#9d9a90'), cBldB = tone('#716f6a'), cBldM = tone('#4d7030');
    const mossRockM = mossRockMaterial(S);
    // (the crag's beds in two halves, a hand-back between: together they were this build's longest stretch)
    { const hf = Math.ceil(cragBeds.length / 2);
      const torA = new THREE.Mesh(boulderBedGeometry(noise, cragBeds.slice(0, hf), cBldA, cBldB, cBldM, true), mossRockM); torA.name = 'tors'; scene.add(torA);
      await ctx.yield();
      const torB = new THREE.Mesh(boulderBedGeometry(noise, cragBeds.slice(hf), cBldA, cBldB, cBldM, true), mossRockM); torB.name = 'tors-b'; scene.add(torB); }
    await ctx.yield();
    const torR = new THREE.Mesh(boulderBedGeometry(noise, roofBeds, cBldA, cBldB, cBldM, true), mossRockM); torR.name = 'tors-roof'; scene.add(torR);
    await ctx.yield();

    // the thread fall down the terrace's south-east face, between wet black ledges, and the spray at its foot
    let fallMat = null, wetMat0 = null;
    const fallSpray = [], FA = 0.72, fdx = Math.cos(FA), fdz = Math.sin(FA), fallFoot = V3(41.6 * fdx, waterY(41.6 * fdz) + 0.4, 41.6 * fdz);
    {
      // wet black ledges first: four the water steps down, the rest framing it; the thread rides over their tops, so it shows from down the stream
      const wet = [];
      for (const [r, off, a, b] of [[27.6, 0.3, 1.7, 1.3], [30.6, -0.4, 1.8, 1.4], [33.6, 0.4, 1.9, 1.4], [36.6, -0.3, 1.8, 1.4], [28.8, 3.6, 1.8, 1.4], [29.4, -3.8, 2.0, 1.5], [32.4, 3.7, 1.9, 1.4], [33.8, -3.9, 2.0, 1.5], [36.2, 3.9, 1.7, 1.3], [37.4, -3.6, 1.8, 1.3], [39.2, 1.2, 1.6, 1.2]])
        wet.push(...stackAt(r * fdx - off * fdz, r * fdz + off * fdx, a, b, FA + rg.range(-0.5, 0.5), 0.9));
      const n = 44, pos = [], tan = [], au = [], idx = [], line = [];
      for (let i = 0; i <= n; i++) { const t = i / n, r = lerp(25.5, 41.6, t), x = r * fdx, z = r * fdz, top = torTopAt(wet, x, z); line.push(V3(x, Math.max(groundAt(x, z) + 0.4, waterY(z) + 0.3, top > -1e8 ? top + 0.16 : -1e9), z)); }
      for (let i = n - 1; i >= 0; i--) line[i].y = Math.max(line[i].y, line[i + 1].y + 0.02);       // water does not run uphill
      for (let i = 0; i <= n; i++) {
        const p = line[i], tg = tmpA.subVectors(line[Math.min(n, i + 1)], line[Math.max(0, i - 1)]).normalize(), w = lerp(0.62, 1.15, i / n) * (i < 3 ? 0.6 + 0.13 * i : 1), v = i / n * 10;
        for (const sgn of [-1, 1]) { pos.push(p.x, p.y, p.z); tan.push(tg.x, tg.y, tg.z); au.push(sgn, v, 0, w); }
        if (i > 0) { const a = (i - 1) * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
      }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aT', new THREE.Float32BufferAttribute(tan, 3)); g.setAttribute('aU', new THREE.Float32BufferAttribute(au, 4)); g.setIndex(idx);
      fallMat = fallMaterial(S);
      const m = new THREE.Mesh(g, fallMat); m.name = 'thread-fall'; m.renderOrder = 2; scene.add(m);
      const wetMat = T.makeRockMaterial({ terrain, top: tone('#4a6e34'), topAmount: 0.3, topSlope: [0.86, 0.99], strata: 0.1, cracks: 0.5, roughness: 0.3, contact: [0.4, 0.4, -0.1] });
      if (terminator) psPatch(wetMat, S, 'std');
      const torB = new THREE.Mesh(torGeometry(noise, wet, cWetA, cWetB), wetMat); torB.name = 'fall-ledges'; scene.add(torB);
      for (let i = 9; i < n - 3; i += 6) fallSpray.push([line[i].x + rg.range(-0.4, 0.4), line[i].y + 0.5, line[i].z + rg.range(-0.4, 0.4)]);
      wetMat0 = wetMat;
    }
    await ctx.yield();

    // ---------- the fall on the spur: a white thread stepping ninety metres down wet black ledges at the valley head ----------
    // It is what the wide turn looks at. Great blocks stand out of the slope one above the other; the water slides over each
    // top and drops down its face, a hand's breadth clear of the rock.
    const spurSpray = [];
    {
      const rf = XR('spur-fall'), wet = [], NST = 11, acX = -fuZ, acZ = fuX, rot0 = Math.atan2(-acZ, acX);
      for (let i = 0; i < NST; i++) {
        const t = (i + 0.5) / NST, x = FALL[0] + fdX * t + rf.range(-1.0, 1.0), z = FALL[1] + fdZ * t, g = groundAt(x, z);
        wet.push([x, g - 6.5, z, rf.range(5.4, 7.0), rf.range(3.7, 4.4), rf.range(11.5, 13.2), rot0 + rf.range(-0.3, 0.3), rf.range(0.05, 0.95)]);
        const sgn = (i & 1) ? 1 : -1, off = rf.range(8, 10.5), tt = t + rf.range(-0.03, 0.03), xs = FALL[0] + fdX * tt + acX * off * sgn, zs = FALL[1] + fdZ * tt + acZ * off * sgn;
        wet.push([xs, groundAt(xs, zs) - 6, zs, rf.range(3.6, 4.8), rf.range(3.0, 3.8), rf.range(10, 13.5), rot0 + rf.range(-0.5, 0.5), rf.range(0.05, 0.95)]);
        if (i % 3 === 1) { const xo = FALL[0] + fdX * t - acX * off * sgn * 1.15, zo = FALL[1] + fdZ * t - acZ * off * sgn * 1.15; wet.push([xo, groundAt(xo, zo) - 6, zo, rf.range(3, 4), rf.range(2.6, 3.4), rf.range(9, 11.5), rot0 + rf.range(-0.5, 0.5), rf.range(0.05, 0.95)]); }
      }
      await ctx.yield();
      const n = 210, line = [], pos = [], tan = [], au = [], idx = [];
      for (let i = 0; i <= n; i++) { const t = 1.03 - 1.1 * i / n, x = FALL[0] + fdX * t, z = FALL[1] + fdZ * t, top = torTopAt(wet, x, z, 1.3); line.push(V3(x, Math.max(groundAt(x, z) + 0.6, top > -1e8 ? top + 0.22 : -1e9), z)); }
      for (let i = n - 1; i >= 0; i--) line[i].y = Math.max(line[i].y, line[i + 1].y + 0.03);
      for (let i = 0; i <= n; i++) {
        const q = line[i], tg = tmpA.subVectors(line[Math.min(n, i + 1)], line[Math.max(0, i - 1)]).normalize(), w = lerp(2.2, 4.2, i / n) * (i < 4 ? 0.5 + 0.125 * i : 1), v = i / n * 10;
        for (const sgn of [-1, 1]) { pos.push(q.x, q.y, q.z); tan.push(tg.x, tg.y, tg.z); au.push(sgn, v, 0, w); }
        if (i > 0) { const a = (i - 1) * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
        if (i > 6 && i < n - 4 && line[i - 3].y - q.y > 5 && (spurSpray.length === 0 || q.distanceTo(tmpB.fromArray(spurSpray[spurSpray.length - 1])) > 9)) spurSpray.push([q.x - fuX * 1.5, q.y + 1.5, q.z - fuZ * 1.5]);
      }
      spurSpray.push([line[n].x - fuX * 3, line[n].y + 3, line[n].z - fuZ * 3]);
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aT', new THREE.Float32BufferAttribute(tan, 3)); g.setAttribute('aU', new THREE.Float32BufferAttribute(au, 4)); g.setIndex(idx);
      const m = new THREE.Mesh(g, fallMat); m.name = 'spur-fall'; m.renderOrder = 2; scene.add(m);
      await ctx.yield();
      const torC = new THREE.Mesh(torGeometry(noise, wet, cWetA, cWetB, false, 0.55), wetMat0); torC.name = 'spur-fall-ledges'; scene.add(torC);
    }
    await ctx.yield();

    // ---------- the thirty thousand: every crown near enough to matter is a cloud of blossom cards on dark limbs ----------
    const rt = R.fork('trees'), trees = [], cedars = [], cones = [];
    // from the stream the whole terrace, its fall and the tree stand clear: no crown in the cone between the lens and its foot
    const inEntryCone = (x, z) => z > -24 && z < 112 && x > 8 - 22 * (200 - z) / 200 - 4 && x < 8 + 50 * (200 - z) / 200 + 4;
    // and on the way back the tree is seen whole from above: the ground between the turn and the terrace carries only low things
    // the reveal: from the homeward leg (u 0.56-0.66) nothing tall stands between the lens and the whole of the great tree
    const revealCams = []; for (let u = 0.56; u < 0.671; u += 0.01) { const c = path.pointAt(u, V3()), l = Math.hypot(c.x, c.z); revealCams.push([c.x, c.z, -c.x / l, -c.z / l, l]); }   // every hundredth of that leg
    const inRevealWedge = (x, z) => {
      for (const c of revealCams) { const t = (x - c[0]) * c[2] + (z - c[1]) * c[3]; if (t < -8 || t > c[4] - 24) continue; if (Math.abs((x - c[0]) * c[3] - (z - c[1]) * c[2]) < 9 + 21 * Math.max(0, t) / c[4]) return true; }
      return false;
    };
    const crestX = WHZ, crestZ = -WHX;                                              // along the saddle's crest
    // the ring stands clear on the skyline for the whole of the last leg: no crown rises into the sight lines from the lens to its
    // lower edge. Returns the height a tree at (x, z) on ground y may reach (1e9: no limit).
    const ringCams = []; for (let u = 0.735; u < 0.93; u += 0.015) { const c = path.pointAt(u, V3()), dx = P0[0] - c.x, dz = P0[2] - c.z, l = Math.hypot(dx, dz); ringCams.push([c.x, c.y, c.z, dx / l, dz / l, l]); }
    const ringCap = (x, z, y, rad) => {
      let cap = 1e9;
      for (const c of ringCams) {
        const t = (x - c[0]) * c[3] + (z - c[2]) * c[4]; if (t < 3 || t > c[5] - 5) continue;
        const lat = Math.abs((x - c[0]) * c[4] - (z - c[2]) * c[3]); if (lat > RR - 0.5 + rad) continue;
        cap = Math.min(cap, c[1] + (P0[1] - RR - 1.6 - c[1]) * t / c[5] - 0.6 - y);
      }
      return cap;
    };
    // either side of the ring the skyline is left low, so the blue ridges beyond the saddle show: a crown there may not rise
    // into the sight line from the last leg to the horizon
    const ridgeCap = (x, z, y) => {
      const pp = (x - P0[0]) * WHX + (z - P0[2]) * WHZ, ax = Math.abs((x - P0[0]) * WHZ - (z - P0[2]) * WHX);
      if (pp < -26 || ax < RR + 5 || ax > 46 + 0.5 * Math.max(0, pp)) return 1e9;
      return P0[1] - 2.5 + 0.035 * (pp + 40) - y;
    };
    const addTree = (x, z, H, kind, stage, pn, y = groundAt(x, z)) => {
      const pd = pn.dist, tier = pd < 16 ? 0 : pd < 60 ? 1 : pd < 190 ? 2 : 3;
      trees.push({ x, y, z, H, r: H * (kind === 1 ? 0.5 : 0.43), kind, stage, tier, pd, pu: pn.u, lean: null });
    };
    for (let gz = -430, row = 0; gz < 330; gz += 9.5, row++) {
      for (let gx = -340, col = 0; gx < 270; gx += 9.5, col++) {
        if (col === 22 || col === 43) await ctx.yield();
        const x = gx + rt.range(-4, 4), z = gz + rt.range(-4, 4), keep = rt(), hr = rt(), cr = rt();
        const pn = path.nearestXZ(x, z), pd = pn.dist;
        if (pd > 190 || (pd > 60 && keep > 0.62)) continue;
        const h = height(x, z); forestAt(x, z, h, F4);
        if (F4[1] < 0.5 || keep * 1.02 > F4[1] + 0.4) continue;
        if (z > 24 && z < 215 && Math.abs(x - 8) < 15) continue;                   // the entry looks straight up the stream at the tree
        if (inEntryCone(x, z) || inRevealWedge(x, z)) continue;                    // nothing its own colour stands in front of the tree
        if ((x - 4) ** 2 + (z + 37) ** 2 < 90) continue;                            // the troop's rock stands clear
        if ((x - CRAG[0]) ** 2 + (z - CRAG[1]) ** 2 < 200) continue;                // the knoll is planted by hand
        const y = groundAt(x, z);
        if (F4[0] > 0.35 + 0.3 * cr) {
          const H = lerp(24, 34, hr);
          if (pd < 10 || (z > -46 && z < 40 && x > -80 && x < 0)) continue;
          if (pd > 55 && keep > 0.3) cones.push({ x, y, z, H }); else cedars.push({ x, y, z, H, pd, u: pn.u });
        } else {
          let H = lerp(8, 13, hr) * (F4[2] > 3.3 ? 0.85 : 1);
          if (pd < H * 0.43 + 7) { H = Math.min(H, pn.y - 5.6 - y); if (H < 5.2) continue; }
          if (pn.u > 0.7) { const cap = ringCap(x, z, y, H * 0.43); if (cap < H) { H = cap; if (H < 5.2) continue; } }
          const stg = F4[2] + rt.range(-0.3, 0.3);
          // (rules added later come after the draw above, so that every older tree stands where it stood)
          if ((x - P0[0]) ** 2 + (z - P0[2]) ** 2 < 529 || (x - ROOF[0]) ** 2 + (z - ROOF[1]) ** 2 < 100 || fallClear(x, z)) continue;   // by the ring only the two bent cherries stand
          { const cap = ridgeCap(x, z, y); if (cap < H) { H = cap; if (H < 5.2) continue; } }
          addTree(x, z, H, 0, stg, pn, y);
        }
      }
      await ctx.yield();
    }
    // a few cedars flick past the last leg: one every sixtieth of the flight along it, sides alternating, 15 to 21 m out
    for (let uu = 0.8, k = 0; uu < 0.901; uu += 1 / 60, k++) {
      const hk = Math.sin(k * 12.9898 + 4.1) * 43758.5453, lat = (k % 2 ? -1 : 1) * (15 + 6 * (hk - Math.floor(hk)));
      path.pointAt(uu, tmpA); const x = tmpA.x + crestX * lat, z = tmpA.z + crestZ * lat;
      cedars.push({ x, y: groundAt(x, z), z, H: rt.range(24, 31), pd: Math.abs(lat), u: uu });
    }
    await ctx.yield();
    // the far slopes on a coarser net: two or three big cards a crown, cones for cedar
    for (let gz = -750, row = 0; gz < 650; gz += 20, row++) {
      for (let gx = -750; gx < 650; gx += 20) {
        const x = gx + rt.range(-8, 8), z = gz + rt.range(-8, 8), keep = rt(), hr = rt();
        if (x > -330 && x < 260 && z > -420 && z < 320 && path.nearestXZ(x, z).dist < 186) continue;
        const pc = Math.hypot(x + 20, z - 20); if (pc > 700 || keep > 1.15 - pc / 1400) continue;
        const h = height(x, z); forestAt(x, z, h, F4);
        if (F4[1] < 0.5) continue;
        const y = groundAt(x, z);
        if (F4[0] > 0.5) { if (keep < 0.42) cones.push({ x, y, z, H: lerp(24, 34, hr) }); }
        else trees.push({ x, y, z, H: lerp(9, 13, hr), r: 5.5, kind: 0, stage: F4[2] + rt.range(-0.3, 0.3), tier: 3, pd: 999, pu: 0, lean: null });
      }
      await ctx.yield();
    }
    // iroha maples in fresh lime leaf along the stream
    for (let z = -235; z < 212; z += rt.range(6, 11)) {
      const side = rt.chance(0.5) ? 1 : -1, x = sx(z) + side * (HW + rt.range(2.2, 8)), H = rt.range(4.2, 6.8), pn = path.nearestXZ(x, z);
      if (Math.hypot(x, z) < 43 || (z > 24 && Math.abs(x - 8) < 9.2) || pn.dist < H * 0.5 + 6.5 || inEntryCone(x, z) || (inRevealWedge(x, z) && H > 5)) continue;
      addTree(x, z, H, 1, 0, pn);
    }
    // mitsuba azalea just opening, a few sparks of yamabuki
    const shrub = (x, z, kind) => { const pn = path.nearestXZ(x, z); if (pn.dist < 4.2 || Math.abs(x - sx(z)) < HW + 0.8) return; const y = groundAt(x, z); if (y > pn.y - 2.5 && pn.dist < 8) return; trees.push({ x, y, z, H: rt.range(1.1, 1.9), r: rt.range(0.8, 1.3), kind, stage: 2, tier: pn.dist < 40 ? 0 : 2, pd: pn.dist, pu: pn.u, lean: null }); };
    for (let i = 0; i < 60; i++) { const z = rt.range(-60, 210), side = rt.chance(0.5) ? 1 : -1; shrub(sx(z) + side * (HW + rt.range(1, 12)), z, rt.chance(0.2) ? 3 : 2); }
    for (let i = 0; i < 26; i++) { const a = rt.range(0, 6.28), r = rt.range(27, 35); shrub(Math.cos(a) * r, Math.sin(a) * r, rt.chance(0.15) ? 3 : 2); }
    for (let i = 0; i < 40; i++) { path.pointAt(rt.range(0.74, 0.99), tmpA); const lat = rt.range(5, 22) * (rt.chance(0.5) ? 1 : -1); shrub(tmpA.x + crestX * lat, tmpA.z + crestZ * lat, 2); }
    // the young cherry beside the macaques' roof, whose spray the standing adult pulls down
    // (and with two more it is the pale blossom the troop is seen against from the whole of the pass)
    for (const [dx, dz, H, r, lean] of [[-5.9, 0.0, 7.2, 4.4, [1.9, -1.5]], [-0.1, -6.4, 7.6, 4.6, [-1.5, 1.9]], [-6.4, 3.6, 11, 4.4, [0.9, -0.5]], [-1.0, -9.2, 10.5, 4.2, [0.2, 1.0]], [-7.6, -5.6, 11.5, 4.6, [0.6, 0.8]]]) {
      const x = ROOF[0] + dx, z = ROOF[1] + dz;
      trees.push({ x, y: groundAt(x, z), z, H, r, kind: 0, stage: 1.9, tier: 0, pd: 12, pu: 0.34, lean: null, lobeLean: lean, gl: 1.45, fine: 1 });
    }
    // the cherries on the serow's knoll: they stand behind it from every point of the orbit, so it is charcoal against lit blossom
    for (const [deg, rad] of [[-97, 10.4], [-84, 7.3], [-62, 10.6], [-44, 7.4], [-30, 10.6], [-20, 7.3], [-14, 8.8]]) {
      const a = deg * Math.PI / 180, x = CRAG[0] + rad * Math.cos(a), z = CRAG[1] - rad * Math.sin(a), y = groundAt(x, z), H = clamp(serowY + 6.4 - y, 7.5, 18);   // crowns at the serow's own height
      trees.push({ x, y, z, H, r: Math.min(H * 0.45, 5), kind: 0, stage: 2.05 + rt.range(-0.1, 0.1), tier: 0, pd: 12, pu: 0.53, lean: null, gl: 1.45, fine: 1 });
    }
    // and two great cherries beyond the incoming turn: from the south-west, where the orbit leaves it, they are what stands behind the serow
    for (const [x, z, H] of [[-7.9, -111.6, 23], [-11.5, -119.8, 24.5], [-4.7, -118.4, 22.5], [-15.5, -114.8, 23.5]])
      trees.push({ x, y: groundAt(x, z), z, H, r: 7.5, kind: 0, stage: 2.05 + rt.range(-0.1, 0.1), tier: 0, pd: 20, pu: 0.5, lean: null, gl: 1.6, fine: 1 });
    // low things across the open ground the turn is flown over: azalea in drifts, sparks of yamabuki
    for (let i = 0; i < 150; i++) { path.pointAt(rt.range(0.33, 0.745), tmpA); const a = rt.range(0, 6.28), d = rt.range(4, 34); shrub(tmpA.x + Math.cos(a) * d, tmpA.z + Math.sin(a) * d, rt.chance(0.16) ? 3 : 2); }
    // black cedars on the far bank, behind the fall as the entry sees it
    for (const [x, z] of [[51, 4], [54, -14], [58, -31], [63, -6], [56, 20], [66, -24]]) cedars.push({ x, y: groundAt(x, z), z, H: rt.range(26, 32), pd: path.nearestXZ(x, z).dist, u: 0.3 });
    // the two wind-bent cherries the ring stands between
    const bent = [];
    for (const sgn of [-1, 1]) {
      const x = P0[0] - WHX * 8.2 + crestX * (RR + 6.3) * sgn, z = P0[2] - WHZ * 8.2 + crestZ * (RR + 6.3) * sgn, y = groundAt(x, z), H = sgn < 0 ? 15.0 : 16.2;
      // a quarter of the frame tall from the last leg, both thrown hard down the wind; their crowns hang just before the ring's
      // plane and close on its rim from either side (the ring's disc would hide anything that stood behind it)
      const t = { x, y, z, H, r: 5.7, kind: 0, stage: 2.0, tier: 0, pd: 8, pu: 1, lean: [WHX * 7.0 + crestX * sgn * 0.6, WHZ * 7.0 + crestZ * sgn * 0.6], gl: 1.15, fine: 1, bent: 1 };
      trees.push(t); bent.push(t);
    }
    await ctx.yield();

    // ---------- no two cherries alike ----------
    // Bloom drifts across the slope in groups (white-pink, shell pink, deep rose still in bud); among the grown trees stand
    // young whips half their height, and old many-stemmed trees broader than they are tall; a few lean out toward the flight.
    {
      const rf = XR('forms');
      for (const t of trees) {
        const a = rf(), b = rf(), c = rf();
        if (t.kind !== 0 || t.tier > 1 || t.fine || t.bent) continue;
        const s0 = t.stage;
        t.stage = clamp(s0 + 1.5 * noise.n2(t.x * 0.032 + 13, t.z * 0.032 - 7) + (c - 0.5) * 0.5, Math.min(s0, 0.8), Math.max(s0, 3.3));
        if (a < 0.2) { t.form = 1; t.H *= lerp(0.42, 0.6, b); t.r = t.H * lerp(0.3, 0.38, c); t.stage = clamp(t.stage + (b < 0.55 ? 0.9 : -0.5), Math.min(s0, 0.8), Math.max(s0, 3.3)); }
        else if (a < 0.37 && t.pd > t.H * 0.62 + 9) { t.form = 2; t.r = t.H * lerp(0.56, 0.64, b); }
        else if (a < 0.47 && t.pd > 13 && t.pd < 34 && t.pu > 0.33 && t.pu < 0.9) {
          path.pointAt(t.pu, tmpA); const dx = tmpA.x - t.x, dz = tmpA.z - t.z, dl = Math.hypot(dx, dz) || 1, ln = Math.min(0.24 * t.H, t.pd - t.H * 0.43 - 6.5);
          if (ln > 1 || t.y + t.H < tmpA.y - 4) { const l2 = Math.max(ln, 0.2 * t.H); t.form = 3; t.lean = [dx / dl * l2, dz / dl * l2]; }
        }
      }
    }
    await ctx.yield();
    // mossy outcrops in the orchard the turn is flown over: river-worn boulders half sunk in the sasa, petals in their hollows
    const orchTors = [null, null];
    {
      const ro = XR('outcrops'), bedsA = [], bedsB = [];
      // one every 17 m of the flight from the orchard's near edge to its far one, sides alternating, 12 to 17 m out; the tests below say which stand
      for (let s = 0.36 * path.length, k = 0; s < 0.62 * path.length; s += 17, k++) {
        const u0 = s / path.length, lat = (k % 2 ? 1 : -1) * ro.range(12, 17);
        path.pointAt(u0, tmpA); path.tangentAt(u0, tmpB); const tl = Math.hypot(tmpB.x, tmpB.z) || 1;
        let x = tmpA.x + tmpB.z / tl * lat, z = tmpA.z - tmpB.x / tl * lat;
        for (const t of trees) if (t.tier < 2 && (t.x - x) ** 2 + (t.z - z) ** 2 < 12) { x += 3.2; z += 2.4; }
        if (Math.hypot(x, z) < 46 || Math.hypot(x - CRAG[0], z - CRAG[1]) < 16 || Math.abs(x - sx(z)) < HW + 4) continue;
        const g0 = groundAt(x, z); if (g0 > tmpA.y - 7) continue;
        const a = ro.range(1.7, 2.6), rot = ro.range(0, 3.14), beds = u0 < 0.53 ? bedsA : bedsB;
        beds.push([x, g0 - 0.9, z, a, a * ro.range(0.7, 0.9), ro.range(2.0, 2.9), rot, ro.range(0.05, 0.95)]);
        for (let k = 0; k < 2; k++) { const an = rot + 1.2 + k * 2.6 + ro.range(-0.4, 0.4), d = a * ro.range(0.95, 1.3), xs = x + Math.cos(an) * d, zs = z + Math.sin(an) * d, as = ro.range(0.9, 1.4); beds.push([xs, groundAt(xs, zs) - 0.6, zs, as, as * ro.range(0.75, 0.95), ro.range(1.1, 1.7), ro.range(0, 3.14), ro.range(0.05, 0.95)]); }
        casters.push([x, z, a * 2.1, 0.5]);
      }
      // (two meshes, each drawn only while the flight is among its stones)
      [bedsA, bedsB].forEach((beds, i) => { if (beds.length) { const m = new THREE.Mesh(boulderBedGeometry(noise, beds, cBldA, cBldB, cBldM, true, 26), mossRockM); m.name = 'orchard-tors-' + i; scene.add(m); orchTors[i] = m; } });
    }
    await ctx.yield();

    // ---------- the shade map: a soft dark pool under every near tree, cedar and stone, a metre a texel ----------
    const shx = -sunDir.x / (Math.hypot(sunDir.x, sunDir.z) || 1), shz = -sunDir.z / (Math.hypot(sunDir.x, sunDir.z) || 1);
    for (const t of trees) { if (t.tier > 1) continue; const off = t.kind >= 2 ? 0.3 : Math.min(t.H * 0.34, 4); casters.push([t.x + shx * off, t.z + shz * off, t.kind >= 2 ? t.r * 1.5 : t.r * 1.2, t.kind >= 2 ? 0.42 : 0.6]); }
    for (const c of cedars) if (c.pd < 110) casters.push([c.x + shx * 3, c.z + shz * 3, 5.2, 0.66]);
    casters.push([shx * 11, shz * 11, 30, 0.42]);                                   // the great crown's own shade, beyond its mound
    const shF = new Float32Array(SHN[0] * SHN[1]);
    for (let ci = 0; ci < casters.length; ci++) {
      const c = casters[ci], r = c[2], i0 = Math.max(0, Math.floor(c[0] - r - SHBOX[0])), i1 = Math.min(SHN[0] - 1, Math.ceil(c[0] + r - SHBOX[0])), j0 = Math.max(0, Math.floor(c[1] - r - SHBOX[1])), j1 = Math.min(SHN[1] - 1, Math.ceil(c[1] + r - SHBOX[1]));
      for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
        const d = Math.hypot(SHBOX[0] + i + 0.5 - c[0], SHBOX[1] + j + 0.5 - c[1]) / r; if (d >= 1) continue;
        const v = c[3] * (1 - smoothstep(0.3, 1, d)), o = j * SHN[0] + i; if (v > shF[o]) shF[o] = v;
      }
      if ((ci & 127) === 127) await ctx.yield();
    }
    for (let j = Math.floor(-44 - SHBOX[1]); j <= Math.ceil(44 - SHBOX[1]); j++) for (let i = Math.floor(-44 - SHBOX[0]); i <= Math.ceil(44 - SHBOX[0]); i++) {   // the terrace's wet face
      const x = SHBOX[0] + i + 0.5, z = SHBOX[1] + j + 0.5, re = Math.hypot(x, z) * (1 + 0.07 * Math.sin(Math.atan2(z, x) * 3 + 1));
      const v = 0.36 * smoothstep(27, 30.5, re) * (1 - smoothstep(37.5, 42, re)), o = j * SHN[0] + i; if (v > shF[o]) shF[o] = v;
    }
    await ctx.yield();
    {
      const d8 = new Uint8Array(shF.length); for (let i = 0; i < shF.length; i++) d8[i] = Math.round(shF[i] * 255);
      const tex = new THREE.DataTexture(d8, SHN[0], SHN[1], THREE.RedFormat); tex.magFilter = tex.minFilter = THREE.LinearFilter; tex.needsUpdate = true; S.tShade.value = tex;
    }
    const shadeAt = (x, z) => { const i = Math.floor(x - SHBOX[0]), j = Math.floor(z - SHBOX[1]); return i < 0 || j < 0 || i >= SHN[0] || j >= SHN[1] ? 0 : shF[j * SHN[0] + i]; };
    await ctx.yield();

    // cards and limbs
    // instance attributes per mesh: three stretches of the path, the middle distance, the far slopes
    const iP = [[], [], [], [], []], iN = [[], [], [], [], []], iC = [[], [], [], [], []], iR = [[], [], [], [], []];
    const wPos = [], wNor = [], wCol = [], wIdx = [], homes = [];
    // limbs: dark wet bark flecked with lichen, moss on the upper side of the thick wood. Each is a curve through its control
    // points (Catmull-Rom), tapering from r0 to r1; a trunk flares into its roots.
    const barkD = tone('#241b18'), barkL = tone('#46372f'), lichenC = tone('#7d8a78'), barkMoss = tone('#3c5226'), rl = R.fork('limbs');
    const cA3 = [0, 0, 0], cB3 = [0, 0, 0], cC3 = [0, 0, 0];
    const crv = (P, t, out) => {
      const n = P.length - 1, f = clamp(t, 0, 1) * n, i = Math.min(n - 1, Math.floor(f)), u = f - i, p0 = P[Math.max(0, i - 1)], p1 = P[i], p2 = P[i + 1], p3 = P[Math.min(n, i + 2)];
      for (let k = 0; k < 3; k++) out[k] = 0.5 * (2 * p1[k] + (p2[k] - p0[k]) * u + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * u * u + (3 * p1[k] - p0[k] - 3 * p2[k] + p3[k]) * u * u * u);
      return out;
    };
    const limb = (P, r0, r1, sides, segs, flare, fine) => {
      const base = wPos.length / 3, ph = base * 0.37; let ux = 0.8, uy = 0, uz = 0.6;
      for (let i = 0; i <= segs; i++) {
        const t = i / segs; crv(P, t, cA3); crv(P, Math.max(0, t - 0.03), cB3); crv(P, Math.min(1, t + 0.03), cC3);
        tmpA.set(cC3[0] - cB3[0], cC3[1] - cB3[1], cC3[2] - cB3[2]).normalize();
        tmpB.set(ux, uy, uz).addScaledVector(tmpA, -(ux * tmpA.x + uy * tmpA.y + uz * tmpA.z)); if (tmpB.lengthSq() < 1e-6) tmpB.set(tmpA.y, -tmpA.x, 0.2); tmpB.normalize(); ux = tmpB.x; uy = tmpB.y; uz = tmpB.z;
        const wx = tmpA.y * uz - tmpA.z * uy, wy = tmpA.z * ux - tmpA.x * uz, wz = tmpA.x * uy - tmpA.y * ux;
        const rad = lerp(r0, r1, Math.pow(t, 0.75)) * (1 + flare * Math.exp(-t * segs * 1.25));
        for (let k = 0; k < sides; k++) {
          const an = k / sides * 6.2832, ca = Math.cos(an), sa = Math.sin(an), nx = ux * ca + wx * sa, ny = uy * ca + wy * sa, nz = uz * ca + wz * sa;
          let rr = rad; if (flare > 0 && i === 0) rr *= 1 + 0.24 * Math.sin(an * 5 + ph); if (fine) rr *= 1 + 0.12 * noise.n3(cA3[0] * 1.9 + nx * 1.5, cA3[1] * 1.9, cA3[2] * 1.9 + nz * 1.5);
          const px = cA3[0] + nx * rr, py = cA3[1] + ny * rr, pz = cA3[2] + nz * rr;
          wPos.push(px, py, pz); wNor.push(nx, ny, nz);
          const g1 = noise.n3(px * 1.4, py * 0.6, pz * 1.4), g2 = fine ? noise.n3(px * 5.3 + 9, py * 5.3, pz * 5.3) : ((k * 7 + i * 3) % 5) / 5 - 0.3;
          tmpC.copy(barkD).lerp(barkL, clamp(0.4 + 0.55 * g1, 0, 1));
          if (g2 > 0.46) tmpC.lerp(lichenC, Math.min(0.6, (g2 - 0.46) * 3));
          if (ny > 0.3 && rad > 0.1) tmpC.lerp(barkMoss, 0.5 * clamp((ny - 0.3) * 2, 0, 1) * clamp(0.5 + g1, 0, 1));
          wCol.push(tmpC.r, tmpC.g, tmpC.b);
        }
        if (i > 0) for (let k = 0; k < sides; k++) { const p = base + (i - 1) * sides + k, q = base + (i - 1) * sides + (k + 1) % sides; wIdx.push(p, p + sides, q, q, p + sides, q + sides); }
      }
    };
    const NCL = [Math.round(90 * (0.6 + 0.4 * detail)), Math.round(42 * (0.6 + 0.4 * detail)), 8, 3], SZ = [[1.6, 2.25], [2.1, 2.8], [3.8, 4.8], [8, 11]];
    for (let ti = 0; ti < trees.length; ti++) {
      const t = trees[ti], T0 = t.tier, mesh = T0 === 3 ? 4 : T0 === 2 ? 3 : t.pu < 0.42 ? 0 : t.pu < 0.72 ? 1 : 2;
      const shrubby = t.kind >= 2, maple = t.kind === 1, st = t.stage;
      const lx = t.lean ? t.lean[0] : t.lobeLean ? t.lobeLean[0] : rt.range(-0.8, 0.8), lz = t.lean ? t.lean[1] : t.lobeLean ? t.lobeLean[1] : rt.range(-0.8, 0.8);
      const whip = t.form === 1, old = t.form === 2;
      const cx = t.x + lx, cz = t.z + lz, cy = t.y + (shrubby ? t.H * 0.6 : old ? t.H * 0.6 : t.H * 0.64), ry = shrubby ? t.H * 0.45 : whip ? t.H * 0.42 : old ? t.H * 0.3 : t.H * 0.34;
      // lobes
      const nl = shrubby ? 1 : whip ? 2 : old ? (T0 === 0 ? 6 : 4) : T0 === 0 ? 5 : T0 === 1 ? 3 : 1, lobes = [];
      for (let k = 0; k < nl; k++) {
        const a = old ? k / nl * 6.2832 + rt.range(-0.4, 0.4) : rt.range(0, 6.28), d = nl === 1 ? 0 : t.r * (old ? rt.range(0.42, 0.66) : rt.range(0.3, 0.55));
        lobes.push([cx + Math.cos(a) * d + (t.lean ? t.lean[0] * 0.3 * (k / nl) : 0), cy + rt.range(-0.12, 0.25) * t.H * (nl === 1 ? 0 : 1), cz + Math.sin(a) * d + (t.lean ? t.lean[1] * 0.3 * (k / nl) : 0), t.r * (nl === 1 ? 1 : rt.range(0.52, 0.7))]);
      }
      const farK = T0 === 1 ? smoothstep(16, 58, t.pd) : 0;                         // the middle tier thins and coarsens with distance
      let n = shrubby ? (T0 === 0 ? 11 : 4) : t.bent ? 400 : t.fine ? (t.r > 6 ? 250 : 180) : Math.round((maple ? NCL[T0] * 0.42 : NCL[T0]) * (1 - 0.6 * farK));
      if (whip) n = Math.max(6, Math.round(n * 0.5)); else if (old) n = Math.round(n * 1.4);
      const bare = st > 3.45; if (bare) n = Math.max(1, Math.round(n * 0.3));
      const petal = t.kind === 2 ? cAzalea : t.kind === 3 ? cYama : maple ? cLime : null;
      const szK = (maple ? 0.72 : 1) * (1 + 0.42 * farK), sz = shrubby ? (T0 === 0 ? [0.5, 0.8] : [0.7, 1.0]) : t.bent ? [1.45, 2.1] : t.fine ? (t.r > 6 ? [1.05, 1.5] : [0.8, 1.2]) : [SZ[T0][0] * szK, SZ[T0][1] * szK];   // the trees the serow stands among are seen from a few metres: small sprays, and many
      for (let i = 0; i < n; i++) {
        const lb = lobes[i % nl], a = rt.range(0, 6.28), up = rt.range(-0.35, 1), hz = Math.sqrt(Math.max(0, 1 - up * up)), rr = lb[3] * rt.range(0.72, 1.02);
        const px = lb[0] + Math.cos(a) * hz * rr, py = lb[1] + up * rr * (ry / t.r) * (t.r / lb[3]) * 0.75, pz = lb[2] + Math.sin(a) * hz * rr;
        let nx = px - cx, ny = (py - cy) * 1.3 + 0.25 * t.r, nz = pz - cz; const nlen = Math.hypot(nx, ny, nz) || 1; nx /= nlen; ny /= nlen; nz /= nlen;
        const ao = clamp(0.3 + 0.75 * Math.hypot(px - cx, pz - cz) / t.r * 0.6 + 0.5 * up, 0.25, 1);
        const s2 = st + rt.range(-0.35, 0.35);
        if (petal) tmpC.copy(petal); else { const sc = clamp(s2, 0, 3.999), si = Math.floor(sc); tmpC.copy(stageCols[si]).lerp(stageCols[si + 1], sc - si); }
        const v = rt.range(0.85, 1.12) * (t.gl || 1); tmpC.multiplyScalar(v);
        const cell = maple ? 3 : shrubby ? rt.int(0, 1) : s2 < 0.55 ? 3 : s2 < 1.45 ? (rt.chance(0.6) ? 2 : rt.int(0, 1)) : s2 < 3.4 ? rt.int(0, 1) : 2;
        const leaf = maple ? 1 : shrubby ? 2 : s2 < 0.55 ? 2 : s2 > 3.4 ? 3 : 0;
        iP[mesh].push(px, py, pz, rt.range(sz[0], sz[1]) * (s2 > 2.7 && !petal ? 0.82 : 1));
        iN[mesh].push(nx, ny, nz, ao);
        iC[mesh].push(tmpC.r, tmpC.g, tmpC.b, cell + 4 * leaf);
        iR[mesh].push(rt.range(0, 6.28), rt.range(0, 40), shrubby ? 0.25 : clamp((py - t.y) / 9, 0.2, 1.3), (!petal && s2 > 0.8 && s2 < 2.5) ? 1 : 0.25);
        if (!petal && !bare && T0 < 3 && s2 > 0.7 && s2 < 2.8 && rt() < (T0 === 0 ? 0.55 : T0 === 1 ? 0.8 : 0.5)) homes.push(lerp(t.x, px, 1.3), t.y + 0.25, lerp(t.z, pz, 1.3));   // the grove floor under this crown: where its fall lies
      }
      // limbs
      if (!shrubby && T0 <= 1) {
        const near = T0 === 0, fine = !!t.fine, tr = t.H * (maple ? 0.022 : 0.03) + 0.05, fy = t.y + t.H * 0.36, bx = t.x + lx * 0.45, bz = t.z + lz * 0.45, jx = () => rl.range(-1, 1);
        if (t.lean) limb([[t.x, t.y - 0.4, t.z], [t.x + lx * 0.08, t.y + t.H * 0.13, t.z + lz * 0.08], [t.x + lx * 0.25, t.y + t.H * 0.26, t.z + lz * 0.25], [bx, fy, bz], [t.x + lx * 0.7, fy + t.H * 0.12, t.z + lz * 0.7]], tr * (t.bent ? 1.7 : 1.3), tr * 0.6, t.bent ? 8 : 6, t.bent ? 7 : 5, 0.8, !!t.bent);
        else if (old) {                                                               // three or four stems from one stool, each to its own part of the crown
          for (let k = 0; k < Math.min(4, lobes.length); k++) {
            const lb = lobes[k], ak = Math.atan2(lb[2] - t.z, lb[0] - t.x), ox = Math.cos(ak), oz = Math.sin(ak), wj = 0.35 + 0.03 * t.H;
            limb([[t.x + ox * 0.3, t.y - 0.5, t.z + oz * 0.3], [lerp(t.x, lb[0], 0.22) + jx() * wj, t.y + t.H * 0.2, lerp(t.z, lb[2], 0.22) + jx() * wj], [lerp(t.x, lb[0], 0.6) + jx() * wj, lerp(t.y, lb[1], 0.66), lerp(t.z, lb[2], 0.6) + jx() * wj], [lb[0], lb[1] + 0.2 * lb[3], lb[2]]],
              tr * 0.9, tr * 0.12, near ? 5 : 4, near ? 5 : 3, 0.5, false);
          }
        } else {
          const s1 = t.H * (near ? 0.04 : 0.02);                                      // how far the trunk wanders on its way up
          limb([[t.x, t.y - 0.5, t.z], [t.x + lx * 0.1 + jx() * s1, t.y + t.H * 0.12, t.z + lz * 0.1 + jx() * s1], [t.x + lx * 0.28 + jx() * s1, t.y + t.H * 0.25, t.z + lz * 0.28 + jx() * s1], [bx, fy, bz]],
            tr * (fine ? 1.0 : 1.3), tr * (fine ? 0.66 : 0.85), fine ? 8 : near ? 6 : t.pd < 32 ? 4 : 3, fine ? 6 : near ? 4 : 2, near ? 0.6 : 0.3, fine);
        }
        const nb = old ? 0 : near ? lobes.length : t.pd < 32 ? 2 : 0;
        for (let k = 0; k < nb; k++) {
          const lb = lobes[k % lobes.length];
          if (near) {
            const ex = lerp(lb[0], cx, -0.35), ey = lb[1] + lb[3] * 0.3, ez = lerp(lb[2], cz, -0.35), sag = t.H * 0.03 * rl.range(-0.4, 1.2), wv = fine ? 0.7 : 0.45;
            const ll = Math.hypot(ex - bx, ey - fy, ez - bz), wj = wv * (0.5 + 0.09 * ll), ar = rl.range(0.25, 0.6);          // each limb climbs steeply from the fork, then arches out; none is straight
            const m1 = [lerp(bx, ex, 0.24) + jx() * wj, lerp(fy, ey, 0.24 + ar * 0.5) - sag * 0.3, lerp(bz, ez, 0.24) + jx() * wj], m2 = [lerp(bx, ex, 0.62) + jx() * wj, lerp(fy, ey, 0.62 + ar * 0.42) + sag * 0.3, lerp(bz, ez, 0.62) + jx() * wj];
            limb([[bx, fy - 0.25, bz], m1, m2, [ex, ey, ez]], tr * (fine ? 0.5 : 0.62), tr * 0.09, fine ? 6 : 4, fine ? 4 : 2, 0, fine);
            if (fine) for (let j = 0; j < 2; j++) {                                   // and forks into the blossom
              const a = rl.range(0, 6.28), rr = lb[3] * rl.range(0.5, 0.9), tx = lb[0] + Math.cos(a) * rr, ty = lb[1] + rl.range(-0.2, 0.5) * lb[3], tz = lb[2] + Math.sin(a) * rr, st = j === 0 ? m1 : m2;
              limb([st, [lerp(st[0], tx, 0.5) + jx() * 0.4, lerp(st[1], ty, 0.62), lerp(st[2], tz, 0.5) + jx() * 0.4], [tx, ty, tz]], tr * (j === 0 ? 0.26 : 0.2), tr * 0.045, 3, 2, 0, false);
            }
          } else limb([[bx, fy - 0.2, bz], [lb[0], lb[1] + 0.3, lb[2]]], tr * 0.6, tr * 0.14, 3, 1, 0, false);
        }
      }
      if ((ti & 7) === 7) await ctx.yield();
    }
    await ctx.yield();
    // THE SPRAY OVER THE TROOP'S ROOF. A bough of the young cherry arches over the back of the rock and hangs a wall of pale
    // blossom behind the troop, so every head is dark against it from the whole of the pass; one spray comes down to the
    // hands of the adult that stands to pull it.
    {
      const rsp = XR('spray'), RA2 = (a, d) => [ROOF[0] + 0.71 * a + 0.70 * d, ROOF[1] - 0.70 * a + 0.71 * d];
      const card = (x, y, z, size, ao, st) => {
        const sc = clamp(st + rsp.range(-0.25, 0.25), 0, 3.999), si = Math.floor(sc); tmpC.copy(stageCols[si]).lerp(stageCols[si + 1], sc - si).multiplyScalar(rsp.range(1.2, 1.5));
        const nx = 0.70 + rsp.range(-0.3, 0.3), nz = 0.71 + rsp.range(-0.3, 0.3), ny = rsp.range(0.1, 0.8), nl = Math.hypot(nx, ny, nz);
        iP[0].push(x, y, z, size); iN[0].push(nx / nl, ny / nl, nz / nl, ao); iC[0].push(tmpC.r, tmpC.g, tmpC.b, rsp.int(0, 1)); iR[0].push(rsp.range(0, 6.28), rsp.range(0, 40), 0.7, 1);
      };
      // the bough: from the young cherry west of the roof, up and over, then drooping along the back of the troop
      const b0 = [ROOF[0] - 5.9 + 1.9 * 0.45, groundAt(ROOF[0] - 5.9, ROOF[1]) + 7.2 * 0.36, ROOF[1] - 1.5 * 0.45], pA = RA2(-3.6, -2.5), pB = RA2(-1.0, -2.9), pC = RA2(1.6, -2.6), pD = RA2(3.6, -2.0);
      limb([b0, [pA[0], roofT + 4.6, pA[1]], [pB[0], roofT + 4.9, pB[1]], [pC[0], roofT + 4.3, pC[1]], [pD[0], roofT + 3.2, pD[1]]], 0.13, 0.03, 5, 8, 0, false);
      for (let i = 0; i < 150; i++) {                                                // the wall of blossom hanging from it
        const a = rsp.range(-3.9, 3.9), k = (a + 3.9) / 7.8, d = lerp(-2.5, -2.0, k) - 0.5 * Math.sin(k * 3.1416) + rsp.range(-0.45, 0.45), q = RA2(a, d), top = roofT + lerp(4.7, 3.3, k * k) + 0.4 * Math.sin(k * 3.1416), hang = Math.pow(rsp(), 0.8);
        card(q[0], top - hang * (3.0 + 0.9 * Math.sin(a * 2.3)), q[1], rsp.range(0.55, 0.95), 0.55 + 0.45 * (1 - hang), 1.75);
      }
      // the spray the standing adult pulls down: a twig from the bough to its hands, heavy with blossom
      const hq = RA2(-1.75, -0.35), hy = roofT + 2.25, tq = RA2(-1.9, -2.7);
      limb([[tq[0], roofT + 4.8, tq[1]], [lerp(tq[0], hq[0], 0.5), roofT + 3.9, lerp(tq[1], hq[1], 0.5)], [hq[0], hy + 0.15, hq[1] ]], 0.05, 0.016, 4, 4, 0, false);
      for (let i = 0; i < 26; i++) { const f = rsp(), x = lerp(tq[0], hq[0], f) + rsp.range(-0.35, 0.35), z = lerp(tq[1], hq[1], f) + rsp.range(-0.35, 0.35); card(x, lerp(roofT + 4.5, hy + 0.1, f * f) + rsp.range(-0.3, 0.25), z, rsp.range(0.42, 0.7), 0.8, 1.6); }
    }
    await ctx.yield();
    const atlas = makeClumpAtlas(R.fork('atlas'));
    const clumpMat = clumpMaterial(S, atlas), clumpMeshes = [];
    const quad = new THREE.PlaneGeometry(1, 1);
    for (let m = 0; m < 5; m++) {
      const n = iP[m].length / 4; if (!n) continue;
      const g = new THREE.InstancedBufferGeometry(); g.index = quad.index; g.setAttribute('position', quad.attributes.position); g.setAttribute('uv', quad.attributes.uv);
      const aP = new Float32Array(iP[m]);
      g.setAttribute('iP', new THREE.InstancedBufferAttribute(aP, 4)); g.setAttribute('iN', new THREE.InstancedBufferAttribute(new Float32Array(iN[m]), 4));
      g.setAttribute('iC', new THREE.InstancedBufferAttribute(new Float32Array(iC[m]), 4)); g.setAttribute('iR', new THREE.InstancedBufferAttribute(new Float32Array(iR[m]), 4));
      g.instanceCount = n;
      const bb = new THREE.Box3(); for (let i = 0; i < n; i++) bb.expandByPoint(tmpA.set(aP[i * 4], aP[i * 4 + 1], aP[i * 4 + 2]));
      g.boundingSphere = bb.getBoundingSphere(new THREE.Sphere()); g.boundingSphere.radius += 14;
      const mesh = new THREE.Mesh(g, clumpMat); mesh.name = 'blossom-' + m; scene.add(mesh); clumpMeshes.push(mesh);
      await ctx.yield();
    }
    {
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(wPos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(wNor, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(wCol, 3)); g.setIndex(wIdx);
      const wm = new THREE.MeshLambertMaterial({ vertexColors: true }); if (terminator) psPatch(wm, S, 'std');
      const limbs = new THREE.Mesh(g, wm); limbs.name = 'cherry-limbs'; scene.add(limbs);
    }
    await ctx.yield();

    // sugi and hinoki: dark spires
    const wind = flora.makeWind({ direction: [WHX, WHZ], strength: 0.8, speed: 0.9 });
    await flora.prepareLeafTexture({ size: 512 }, ctx.yield);                       // the atlas is drawn in short steps ...
    const leafTex = flora.makeLeafTexture({ size: 512 });                           // ... so this finds its pixels (half size: a quarter of the work)
    await ctx.yield();
    const treeMat = flora.windMaterial({ wind, map: leafTex, backlight: 0.5, backlightTint: '#9fc27a' });
    if (terminator) psPatch(treeMat, S, 'flora');
    if (moon) treeMat.color.setRGB(0.8, 0.52, 1.25);                                // by moonlight leaf green goes to blue-grey
    await ctx.yield();
    const rc = R.fork('cedars'), cedPal = { leaf: '#41745a', leafLight: '#6a9c66', leafDark: '#27483b', bark: '#6a5244', barkDark: '#3a2b23' };
    const gNear = [flora.coniferGeometry({ rng: rc, detail: 2, height: 28, slim: 1.25, droop: 0.9, ...cedPal })];
    await ctx.yield();
    const gMid = [flora.coniferGeometry({ rng: rc, detail: 1, height: 28, slim: 1.3, ...cedPal }), flora.coniferGeometry({ rng: rc, detail: 1, height: 28, slim: 1.1, ...cedPal })];
    const gFar = [flora.coniferGeometry({ rng: rc, detail: 0, height: 28, slim: 1.25, ...cedPal }), flora.coniferGeometry({ rng: rc, detail: 0, height: 28, slim: 1.05, ...cedPal })];
    await ctx.yield();
    // from the wide turn the whole fall is seen: no crown stands across any line from the lens (u 0.38 to 0.46) to the water
    const sightC = []; for (let u = 0.37; u < 0.471; u += 0.01) sightC.push(path.pointAt(u, V3()));   // every hundredth of the turn
    const sightQ = [0.04, 0.17, 0.3, 0.43, 0.56, 0.69, 0.82, 0.95].map((f) => { const x = FALL[0] + fdX * f, z = FALL[1] + fdZ * f; return V3(x, groundAt(x, z) + 3, z); });
    const fallSight = (x, z, top) => {
      for (const c of sightC) for (const q of sightQ) {
        const ex = q.x - c.x, ez = q.z - c.z, t = ((x - c.x) * ex + (z - c.z) * ez) / (ex * ex + ez * ez);
        if (t > 0.04 && t < 0.97 && Math.abs((x - c.x) * ez - (z - c.z) * ex) / Math.hypot(ex, ez) < 5.5 && top > lerp(c.y, q.y, t) - 1.5) return true;
      }
      return false;
    };
    { const prune = (arr) => { let k = 0; for (const c of arr) if (!fallClear(c.x, c.z) && !fallSight(c.x, c.z, c.y + c.H)) arr[k++] = c; arr.length = k; }; prune(cedars); prune(cones); }   // the fall's scar and the sight lines to it stay open
    cedars.sort((a, b) => a.pd - b.pd);
    const cPts = [[], [], []];
    for (const c of cedars) {
      const pt = { x: c.x, y: c.y, z: c.z, s: c.H / 28, rot: rc.range(0, 6.28), d: c.pd, u: c.u, v: rc.int(0, 1) };
      if (c.pd < 30 && cPts[0].length < 4) cPts[0].push(pt); else if (c.pd < 100 && cPts[1].length < 18) cPts[1].push(pt); else if (cPts[2].length < 30) cPts[2].push(pt); else cones.push({ x: c.x, y: c.y, z: c.z, H: c.H });
    }
    const cedarSets = [];
    [gNear, gMid, gFar].forEach((vs, i) => { if (cPts[i].length) cedarSets.push(flora.makeScatter({ rng: rc.fork('s' + i), points: cPts[i], variants: vs, material: treeMat, tint: 0.12, hue: 0.03, sink: 0.01, tilt: 0.02, stretch: 0.1 })); });
    for (const c of cedarSets) scene.add(c.object);
    await ctx.yield();
    // ---------- the cedar beyond the kit's trees: the spur's face in ranks, the far bank, the far slopes ----------
    const spireSets = [], mistAt = [];
    {
      const spurC = [], bankC = [], restC = [], rm = R.fork('spur-stand');
      for (const c of cones) { const de = c.x - sx(c.z); (de < 0 && c.z < -146 && c.z > -360 && c.x > -240 && c.x < 130 ? spurC : de > 0 && de < 200 && c.z > -150 && c.z < 250 ? bankC : restC).push(c); }
      const take = (arr, n) => { if (arr.length <= n) return arr; const k = arr.length / n, out = []; for (let i = 0; i < n; i++) out.push(arr[Math.floor(i * k)]); return out; };
      // the stand on the spur: no rows, no two alike; close-set where the turn comes near, opening with distance
      const stand = [];
      for (let gz = -150; gz > -266; gz -= 6.4) for (let gx = -156; gx < 80; gx += 6.4) {
        const x = gx + rm.range(-3.2, 3.2), z = gz + rm.range(-3.2, 3.2), hh = rm(), kp = rm();
        if (x > sx(z) - HW - 6 || cedAt(x, z) < 0.45 || fallClear(x, z)) continue;
        const pd = path.nearestXZ(x, z).dist; if (kp > Math.max(lerp(1.0, 0.36, smoothstep(70, 150, pd)), smoothstep(-84, -62, x))) continue;
        const y = groundAt(x, z); if (y - waterY(z) < 13) continue;
        const H = lerp(17, 34, hh * (0.4 + 0.6 * hh)) + 5 * smoothstep(120, 60, pd); if (fallSight(x, z, y + H)) continue;
        stand.push({ x, y, z, H, pd });
      }
      for (const c of spurC) c.pd = path.nearestXZ(c.x, c.z).dist;
      const spur = [...stand, ...take(spurC, Math.max(0, 470 - stand.length))].sort((a, b) => a.pd - b.pd);
      const nNear = Math.min(spur.length, Math.round(86 * (0.7 + 0.3 * detail))), near = spur.slice(0, nNear), mid = take(spur.slice(nNear), 300);
      // the far bank behind the great tree, as the homeward leg and the stripping see it: a closed stand, crown beside crown
      const bankStand = [];
      for (let gz = -66; gz < 118; gz += 9.4) for (let gi = 0; gi < 14; gi++) {
        const z = gz + rm.range(-4.7, 4.7), x = sx(z) + HW + 26 + gi * 9.4 + rm.range(-4.7, 4.7), hh = rm();
        if (cedAt(x, z) < 0.5 || path.nearestXZ(x, z).dist < 30) continue;
        let free = true; for (const c of cedars) if ((c.x - x) ** 2 + (c.z - z) ** 2 < 40) { free = false; break; }
        if (free) bankStand.push({ x, y: groundAt(x, z), z, H: lerp(18, 32, hh) });
      }
      const bank = [...bankStand, ...take(bankC, Math.max(60, 300 - bankStand.length))], far = take(restC, 190);
      cones.length = 0; cones.push(...near, ...mid, ...bank, ...far);
      await ctx.yield();
      const rj = R.fork('cone'), sMat = spireMaterial(S), cA = tone('#32604a'), cB = tone('#42683c'), cC = tone('#2a5149');
      const sets = [[near, sugiGeometry(rj, 8, 6), 'spur-sugi', 0.142], [mid, spireGeometry(rj, 4, 5), 'spur-cedars', 0.155], [bank, spireGeometry(rj, 3, 4), 'bank-cedars', 0.155], [far, spireGeometry(rj, 3, 3), 'far-cedars', 0.16]];
      for (const [arr, geo, name, wide] of sets) {
        if (!arr.length) { geo.dispose(); continue; }
        const im = new THREE.InstancedMesh(geo, sMat, arr.length), tint = new Float32Array(arr.length * 4);
        arr.forEach((c, i) => {
          const w = c.H * wide * rc.range(0.84, 1.18);
          im.setMatrixAt(i, mm.compose(tmpA.set(c.x, c.y - 0.8, c.z), qq.setFromEuler(ee.set(rc.range(-0.035, 0.035), rc.range(0, 6.28), rc.range(-0.035, 0.035))), tmpB.set(w, c.H * rc.range(0.92, 1.1), w * rc.range(0.9, 1.1))));
          const hk = rc(); tmpC.copy(cA).lerp(hk < 0.5 ? cB : cC, Math.abs(hk - 0.5) * 1.5).multiplyScalar(rc.range(0.78, 1.22) * (terminator ? 1.25 : 1));
          tint[i * 4] = tmpC.r; tint[i * 4 + 1] = tmpC.g; tint[i * 4 + 2] = tmpC.b; tint[i * 4 + 3] = rc.range(0, 6.28);
        });
        geo.setAttribute('iTint', new THREE.InstancedBufferAttribute(tint, 4));
        im.instanceMatrix.needsUpdate = true; im.computeBoundingSphere(); im.boundingSphere.radius += 6; im.name = name; scene.add(im); spireSets.push(im);
        await ctx.yield();
      }
      // where the mist threads lie: along the spur's face between the ranks, low, middle and high
      for (const [fx_, hy] of [[-0.42, 0.24], [0.34, 0.47], [-0.2, 0.72]]) {
        const x = -40 + 95 * fx_, z = lerp(-158, -246, hy), y = groundAt(x, z);
        // three overlapping puffs to a thread, stepped in height, so it tapers at both ends and never reads as a bar
        for (let k = -1; k <= 1; k++) { const xk = x + k * 34, zk = z + k * 7 * (hy > 0.5 ? 1 : -1); mistAt.push([xk, Math.max(y, groundAt(xk, zk)) + 19 + k * 5 * (fx_ > 0 ? 1 : -1), zk]); }
      }
    }
    await ctx.yield();

    // sasa the whole way: on the banks, under the orchard the turn is flown over, on the saddle; ferns by the water and in the open ground.
    // Every tuft takes the ground's colour and the shade pooled at its foot.
    const gcol = (x, z, y) => groundColor(x, z, y, 1, tmpC).multiplyScalar(1.25);
    const dry = (x, z) => { const r0 = Math.hypot(x, z); return Math.abs(x - sx(z)) > HW + 0.7 && r0 > 26 ? (r0 > 28.5 && r0 < 40.5 ? 0.6 : 1) : 0; };   // thinner on the terrace's steep face
    const shadeFn = (x, z) => 1 - 0.5 * shadeAt(x, z);
    const grassOpts = { heightAt: groundAt, wind, map: treeMat.map, groundColor: gcol, shade: shadeFn, width: [0.85, 1.5], height: [0.42, 0.9], flowers: 0, fade: [60, 90], tint: 0.16, align: 0.3 };   // (upright: cards laid to a steep slope read from above as a brushed smear)
    // the saddle's hollows and stones are set out here, so that every ground cover leaves them open
    const rs2 = XR('saddle'), sx2 = (pp, ax) => P0[0] + WHX * pp + crestX * ax, sz2 = (pp, ax) => P0[2] + WHZ * pp + crestZ * ax;
    // hollows where the petals have drifted, and stones: [metres along the wind from the ring, across (left of the flight is positive), radius]
    const drifts = [[-11, -4.5, 3.2], [-19, 6.5, 3.8], [-30, -7.5, 4.2], [-27, 3.0, 2.6], [-43, 5.5, 4.4], [-52, -6.0, 3.6], [-66, 4.0, 4.0], [-80, -5.5, 3.6], [-6, 11, 3.0], [-15, -13, 3.4], [-38, -15, 3.8], [-58, 13, 3.6], [-93, 3.5, 3.8]]
    .map(([pp, ax, r]) => [sx2(pp, ax), sz2(pp, ax), r * rs2.range(0.85, 1.15)]);
    const stones = [[-10, 9.2, 2.0], [-19, -8.8, 1.8], [-27, 9.8, 2.4], [-38, -9.0, 1.9], [-50, 9.4, 2.1], [-58, -8.4, 1.6]].map(([pp, ax, r]) => [sx2(pp, ax), sz2(pp, ax), r]);
    const hole = (x, z) => {
      let k = 1;
      for (const d of drifts) { const dx = x - d[0], dz = z - d[1], q = dx * dx + dz * dz; if (q < d[2] * d[2]) k = Math.min(k, smoothstep(0.5, 1.0, Math.sqrt(q) / d[2])); }
      for (const st of stones) { const dx = x - st[0], dz = z - st[1], q = dx * dx + dz * dz; if (q < 1.96 * st[2] * st[2]) k = Math.min(k, smoothstep(0.9, 1.4, Math.sqrt(q) / st[2])); }
      return k;
    };
    const covers = [];
    const sasaA = await flora.makeGrassAsync({ rng: R.fork('sasa-a'), path, uRange: [0, 0.17], count: Math.round(1400 * detail), radius: 21, bias: 1.25, chunks: 2, density: (x, z) => dry(x, z), ...grassOpts }, ctx.yield);
    covers.push(sasaA);
    await ctx.yield();
    covers.push(await flora.makeGrassAsync({ rng: R.fork('sasa-a2'), path, uRange: [0.17, 0.34], count: Math.round(1400 * detail), radius: 21, bias: 1.25, chunks: 2, density: (x, z) => dry(x, z), material: sasaA.material, ...grassOpts }, ctx.yield));
    await ctx.yield();
    const wideOpts = { ...grassOpts, width: [0.8, 1.4], height: [0.5, 1.0], fade: [80, 115], material: sasaA.material, radius: 31, bias: 1.0, chunks: 2, density: (x, z) => dry(x, z) * (0.35 + 0.65 * smoothstep(-0.25, 0.2, noise.n2(x * 0.045 + 5, z * 0.045))) * (x < -60 && z > 60 ? hole(x, z) : 1) * smoothstep(14, 18, Math.hypot(x - CRAG[0], z - CRAG[1])) };
    covers.push(await flora.makeGrassAsync({ rng: R.fork('sasa-c'), path, uRange: [0.34, 0.42], count: Math.round(1200 * detail), ...wideOpts }, ctx.yield));
    await ctx.yield();
    covers.push(await flora.makeGrassAsync({ rng: R.fork('sasa-c2'), path, uRange: [0.42, 0.5], count: Math.round(1200 * detail), ...wideOpts }, ctx.yield));
    await ctx.yield();
    covers.push(await flora.makeGrassAsync({ rng: R.fork('sasa-d'), path, uRange: [0.5, 0.58], count: Math.round(1000 * detail), ...wideOpts }, ctx.yield));
    await ctx.yield();
    covers.push(await flora.makeGrassAsync({ rng: R.fork('sasa-d2'), path, uRange: [0.58, 0.66], count: Math.round(1000 * detail), ...wideOpts }, ctx.yield));
    await ctx.yield();
    covers.push(await flora.makeGrassAsync({ rng: R.fork('sasa-e'), path, uRange: [0.66, 0.76], count: Math.round(1000 * detail), ...wideOpts }, ctx.yield));
    await ctx.yield();
    covers.push(await flora.makeGrassAsync({ rng: R.fork('sasa-e2'), path, uRange: [0.76, 0.86], count: Math.round(1100 * detail), ...wideOpts }, ctx.yield));
    await ctx.yield();
    R.fork('sasa-b');                                                               // (the saddle is this world's own sasa now: the kit's tufts there are gone, their draw is kept)
    if (terminator) psPatch(sasaA.material, S, 'flora');
    await ctx.yield();
    covers.push(flora.makeFerns({ rng: R.fork('ferns'), path, uRange: [0, 0.3], count: Math.round(130 * detail), radius: 17, corridor: 4.5, heightAt: groundAt, material: treeMat, chunks: 2, shade: shadeFn,
      density: (x, z) => (Math.abs(x - sx(z)) > HW + 0.6 && Math.abs(x - sx(z)) < HW + 9 ? 1 : 0.15) * dry(x, z) }));
    await ctx.yield();
    covers.push(flora.makeFerns({ rng: R.fork('ferns-b'), path, uRange: [0.31, 0.74], count: Math.round(170 * detail), radius: 30, corridor: 5, heightAt: groundAt, material: treeMat, chunks: 2, shade: shadeFn, density: (x, z) => dry(x, z) }));
    for (const c of covers) scene.add(c.object);
    await ctx.yield();

    // on the ledges of the crag and of the troop's roof: drifts of fallen petals, and ferns rooted where one bed meets the next
    const litterMat = litterMaterial(S);
    {
      const rd = R.fork('ledges'), beds = [...cragBeds, ...roofBeds], pos = [], aq = [], idx = [], fpts = [];
      for (const b of beds) {
        const cr = Math.cos(b[6]), sr = Math.sin(b[6]), mine = b[1] + b[5] * 1.035, nP = b[3] > 2.5 ? 5 : b[3] > 1.6 ? 3 : 2;
        for (let j = 0; j < nP; j++) {
          const a = rd.range(0, 6.28), f = rd.range(0.42, 0.68) * (b[3] < 2 ? 0.5 : 0.85), lx = Math.cos(a) * b[3] * f, lz = Math.sin(a) * b[4] * f, R0 = rd.range(0.4, 0.85) * Math.min(1, b[3] / 2.2);
          const x = b[0] + lx * cr + lz * sr, z = b[2] - lx * sr + lz * cr, top = torTopAt(beds, x, z);
          if (Math.abs(top - mine) > 0.02) continue;                               // an open ledge: this bed is the top one here
          const y = b[1] + b[5] * 1.05 + 0.05, base = pos.length / 3;
          pos.push(x, y, z); aq.push(0, 0);
          for (let k = 0; k < 8; k++) { const an = k / 8 * 6.2832, r = R0 * rd.range(0.8, 1.25); pos.push(x + Math.cos(an) * r, y - 0.03, z + Math.sin(an) * r); aq.push(Math.cos(an), Math.sin(an)); }
          for (let k = 0; k < 8; k++) idx.push(base, base + 1 + (k + 1) % 8, base + 1 + k);
        }
        const nF = b[3] > 2.5 ? 5 : 2;
        for (let j = 0; j < nF; j++) {
          const a = rd.range(0, 6.28), lx = Math.cos(a) * b[3] * 1.04, lz = Math.sin(a) * b[4] * 1.04, x = b[0] + lx * cr + lz * sr, z = b[2] - lx * sr + lz * cr, top = torTopAt(beds, x, z);
          const y = top > -1e8 ? top - 0.02 : groundAt(x, z); if (y > b[1] + b[5] * 0.75 || path.distanceTo(x, y + 0.4, z) < 5.2) continue;   // at the foot of this bed, on the ledge below it or on the ground
          fpts.push({ x, y, z, s: rd.range(0.55, 0.95), rot: rd.range(0, 6.28), d: 9, u: 0.5, v: fpts.length & 1 });
        }
      }
      if (idx.length) {
        const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aQ', new THREE.Float32BufferAttribute(aq, 2)); g.setIndex(idx);
        const m = new THREE.Mesh(g, litterMat); m.name = 'ledge-petals'; m.renderOrder = 1; scene.add(m);
      }
      if (fpts.length) {
        const fg = [flora.fernGeometry({ rng: rd, size: 0.8, fronds: 7, detail: 0 }), flora.fernGeometry({ rng: rd, size: 1.0, fronds: 8, detail: 1 })];
        const lf = flora.makeScatter({ rng: rd.fork('s'), points: fpts, variants: fg, material: treeMat, tint: 0.14, hue: 0.03, sink: 0.02, tilt: 0.12, stretch: 0.15 });
        scene.add(lf.object); covers.push(lf);
      }
    }
    await ctx.yield();

    // round the rim of the hero's moss: ferns in clumps and a few mossy stones, so the velvet has an edge
    {
      const re = XR('moss-edge'), fpts = [], stM = [], mossY = (x, z) => Math.max(groundAt(x, z), Math.hypot(x, z) < 13.0 * HS ? TY + HS * hero.moundAt(x / HS, z / HS) : -1e9);
      for (let i = 0; i < 110; i++) {
        const a = re.range(0, 6.2832), cl = noise.n2(Math.cos(a) * 3.1 + 7, Math.sin(a) * 3.1), r = HS * re.range(11.9, 14.4) + (cl > 0 ? 0 : 0.6), x = Math.cos(a) * r, z = Math.sin(a) * r, sc = re.range(0.6, 1.15), rot = re.range(0, 6.28);
        if (cl < -0.12 && re() < 0.8) continue;                                        // in clumps, with open lengths of rim between
        const y = mossY(x, z); if (path.distanceTo(x, y + 0.4, z) < 5.4) continue;
        fpts.push({ x, y, z, s: sc, rot, d: 9, u: 0.26, v: fpts.length & 1 });
      }
      for (const [x, z, r, ry] of [[4.0, 18.9, 0.72, 0.4], [2.3, 20.4, 0.42, 1.9], [-6.6, 17.8, 0.8, 2.6], [18.4, 15.4, 0.55, 0.9], [19.9, 12.3, 0.38, 3.3], [-12.6, 14.4, 0.66, 4.1], [-1.2, 19.6, 0.5, 5.2], [18.0, -9.5, 0.6, 1.2]])
        stM.push(place(x, mossY(x, z) - r * 0.3, z, r * 1.2, r * 0.8, r, ry, 0.1 * Math.sin(ry * 3)));
      if (fpts.length) {
        const fg = [flora.fernGeometry({ rng: re, size: 0.85, fronds: 7, detail: 0 }), flora.fernGeometry({ rng: re, size: 1.05, fronds: 8, detail: 1 })];
        const lf = flora.makeScatter({ rng: re.fork('s'), points: fpts, variants: fg, material: treeMat, tint: 0.14, hue: 0.03, sink: 0.02, tilt: 0.12, stretch: 0.15 });
        scene.add(lf.object); covers.push(lf);
      }
      const st = T.makeInstances(gBoulder, rockMat, stM, { rng: re.fork('st'), brightness: 0.12 }); scene.add(st.object);
    }
    await ctx.yield();

    // ---------- the saddle: knee-high sasa in running waves, petal drifts in its hollows, mossy stones, the blue ridges beyond ----------
    const loopN = [0, 0];
    let saddleSasa = null, loopSasa = null, bankSasa = null, orchSasa = null, burstPetals = null, sasaMat = null, streamPetals = null, airGeo = null, airN = [0, 0];
    {
      {
        const pos = [], aq = [], idx = [];
        for (const d of drifts) {
          const base = pos.length / 3, el = rs2.range(1.2, 1.6);                     // drawn out down the wind
          pos.push(d[0], groundAt(d[0], d[1]) + 0.1, d[1]); aq.push(0, 0);
          for (let ring = 1; ring <= 2; ring++) for (let k = 0; k < 12; k++) {
            const an = k / 12 * 6.2832, rr = d[2] * (ring === 1 ? 0.5 : rs2.range(0.85, 1.2)), u = Math.cos(an) * rr * el, v = Math.sin(an) * rr / Math.sqrt(el), x = d[0] + WHX * u + crestX * v, z = d[1] + WHZ * u + crestZ * v;
            pos.push(x, groundAt(x, z) + 0.09, z); aq.push(Math.cos(an) * ring * 0.5, Math.sin(an) * ring * 0.5);
          }
          for (let k = 0; k < 12; k++) { const a = base + 1 + k, b = base + 1 + (k + 1) % 12; idx.push(base, b, a, a, b, a + 12, b, b + 12, a + 12); }
        }
        const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aQ', new THREE.Float32BufferAttribute(aq, 2)); g.setIndex(idx);
        const m = new THREE.Mesh(g, litterMat); m.name = 'saddle-drifts'; m.renderOrder = 1; scene.add(m);
      }
      await ctx.yield();
      {
        const N = Math.round(6200 * (0.6 + 0.4 * detail)), iP = [], iC = [], iR = [], bb = new THREE.Box3();
        for (let i = 0, tries = 0; i < N && tries < N * 6; tries++) {
          if ((tries & 511) === 511) await ctx.yield();
          const pp = lerp(-116, 22, rs2()), sg = rs2() < 0.5 ? -1 : 1, wide = sg < 0 ? 1 + 0.4 * smoothstep(-78, -52, pp) : 1, ax = sg * 27 * wide * Math.pow(rs2(), 1.3), x = sx2(pp, ax), z = sz2(pp, ax), kk = rs2();
          const th = 0.3 + 0.7 * smoothstep(-0.35, 0.2, noise.n2(x * 0.11 + 5, z * 0.11));          // thickets and thinner ground
          if (kk > th * hole(x, z) * (1 - smoothstep(19 * wide, 27 * wide, Math.abs(ax))) * smoothstep(-116, -100, pp)) continue;
          const y = groundAt(x, z), sc = rs2.range(0.85, 1.5) * (0.8 + 0.35 * th);
          groundColor(x, z, y, 1, tmpC).multiplyScalar(1.5).lerp(cSasa, 0.25 + 0.3 * rs2()).multiplyScalar(rs2.range(0.85, 1.2) * (1 - 0.45 * shadeAt(x, z)));
          iP.push(x, y - 0.04, z, sc); iC.push(tmpC.r, tmpC.g, tmpC.b, rs2.range(0, 6.28)); iR.push(rs2.range(0, 6.28), rs2.range(-0.3, 0.7));
          bb.expandByPoint(tmpA.set(x, y, z)); i++;
        }
        const sg = sasaGeometry(), g = new THREE.InstancedBufferGeometry();
        g.setAttribute('position', sg.attributes.position); g.setAttribute('normal', sg.attributes.normal); g.setAttribute('aK', sg.attributes.aK);
        g.setAttribute('iP', new THREE.InstancedBufferAttribute(new Float32Array(iP), 4)); g.setAttribute('iC', new THREE.InstancedBufferAttribute(new Float32Array(iC), 4)); g.setAttribute('iR', new THREE.InstancedBufferAttribute(new Float32Array(iR), 2));
        g.instanceCount = iP.length / 4; g.boundingSphere = bb.getBoundingSphere(new THREE.Sphere()); g.boundingSphere.radius += 3;
        sasaMat = sasaMaterial(S);
        const m = new THREE.Mesh(g, sasaMat); m.name = 'saddle-sasa'; scene.add(m); saddleSasa = m;
      }
      await ctx.yield();
      // the west bank above the first reach (seen to the left of the great tree all the way up the stream): the same sasa in
      // clumps with dark feet, and a few mossed stones, so that slope is cover and not a smooth green face
      {
        const rw = XR('bank-sasa'), N = Math.round(560 * (0.6 + 0.4 * detail)), iP = [], iC = [], iR = [], bb = new THREE.Box3(), stM = [];
        for (let i = 0, tries = 0; i < N && tries < N * 5; tries++) {
          if ((tries & 255) === 255) await ctx.yield();
          const z = rw.range(62, 178), x = sx(z) - HW - 5 - 74 * Math.pow(rw(), 1.25), kk = rw();
          if (Math.hypot(x, z) < 45) continue;
          const th = 0.25 + 0.75 * smoothstep(-0.3, 0.25, noise.n2(x * 0.09 + 31, z * 0.09 - 7));
          if (kk > th * hole(x, z)) continue;
          const y = groundAt(x, z), sc = rw.range(1.0, 1.75) * (0.8 + 0.35 * th);
          groundColor(x, z, y, 1, tmpC).multiplyScalar(1.5).lerp(cSasa, 0.25 + 0.3 * rw()).multiplyScalar(rw.range(0.85, 1.2) * (1 - 0.45 * shadeAt(x, z)));
          iP.push(x, y - 0.05, z, sc); iC.push(tmpC.r, tmpC.g, tmpC.b, rw.range(0, 6.28)); iR.push(rw.range(0, 6.28), rw.range(-0.3, 0.7));
          bb.expandByPoint(tmpA.set(x, y, z)); i++;
        }
        for (let i = 0; i < 12; i++) {
          const z = rw.range(84, 168), x = sx(z) - HW - rw.range(12, 62), r = rw.range(0.6, 1.25);
          if (hole(x, z) < 0.5 || Math.hypot(x, z) < 46) continue;
          stM.push(place(x, groundAt(x, z) - r * 0.3, z, r * 1.25, r * 0.85, r * 1.05, rw.range(0, 6.28), rw.range(-0.12, 0.12)));
        }
        const sg = sasaGeometry(), g = new THREE.InstancedBufferGeometry();
        g.setAttribute('position', sg.attributes.position); g.setAttribute('normal', sg.attributes.normal); g.setAttribute('aK', sg.attributes.aK);
        g.setAttribute('iP', new THREE.InstancedBufferAttribute(new Float32Array(iP), 4)); g.setAttribute('iC', new THREE.InstancedBufferAttribute(new Float32Array(iC), 4)); g.setAttribute('iR', new THREE.InstancedBufferAttribute(new Float32Array(iR), 2));
        g.instanceCount = iP.length / 4; g.boundingSphere = bb.isEmpty() ? new THREE.Sphere(V3(0, 0, 0), 1) : bb.getBoundingSphere(new THREE.Sphere()); g.boundingSphere.radius += 3;
        const m = new THREE.Mesh(g, sasaMat); m.name = 'bank-sasa'; scene.add(m); bankSasa = m;
        if (stM.length) { const st = T.makeInstances(gBoulder, rockMat, stM, { rng: XR('bank-stones'), brightness: 0.12 }); scene.add(st.object); }
      }
      await ctx.yield();
      // under the orchard the wide turn is flown over (u 0.36 to 0.5): bamboo grass in thickets with dark feet and open lanes
      // between, where the petals have drifted; seen from ten to fifteen metres up, so the clumps are big
      {
        const rw = XR('orchard-sasa'), N = Math.round(2000 * (0.6 + 0.4 * detail)), iP = [], iC = [], iR = [], bb = new THREE.Box3();
        for (let i = 0, tries = 0; i < N && tries < N * 5; tries++) {
          if ((tries & 255) === 255) await ctx.yield();
          path.pointAt(rw.range(0.36, 0.505), tmpA); const a = rw.range(0, 6.2832), d = 4 + 24 * Math.pow(rw(), 0.8), x = tmpA.x + Math.cos(a) * d, z = tmpA.z + Math.sin(a) * d, kk = rw(), s0 = rw(), s1 = rw();
          if (Math.hypot(x, z) < 44 || Math.hypot(x - CRAG[0], z - CRAG[1]) < 17 || Math.abs(x - sx(z)) < HW + 2 || Math.hypot(x - ROOF[0], z - ROOF[1]) < 7) continue;
          const th = 0.2 + 0.8 * smoothstep(-0.25, 0.2, noise.n2(x * 0.1 + 9, z * 0.1 + 40));
          if (kk > th) continue;
          const y = groundAt(x, z); if (d < 10 && path.distanceTo(x, y + 0.8, z) < 5.4) continue;
          groundColor(x, z, y, 1, tmpC).multiplyScalar(1.3).lerp(cSasa, 0.1 + 0.25 * s0).multiplyScalar(lerp(0.7, 1.12, s1) * (1 - 0.45 * shadeAt(x, z)));
          iP.push(x, y - 0.05, z, lerp(1.15, 1.9, s0) * (0.8 + 0.35 * th)); iC.push(tmpC.r, tmpC.g, tmpC.b, rw.range(0, 6.28)); iR.push(rw.range(0, 6.28), rw.range(-0.3, 0.7));
          bb.expandByPoint(tmpB.set(x, y, z)); i++;
        }
        const sg = sasaGeometry(), g = new THREE.InstancedBufferGeometry();
        g.setAttribute('position', sg.attributes.position); g.setAttribute('normal', sg.attributes.normal); g.setAttribute('aK', sg.attributes.aK);
        g.setAttribute('iP', new THREE.InstancedBufferAttribute(new Float32Array(iP), 4)); g.setAttribute('iC', new THREE.InstancedBufferAttribute(new Float32Array(iC), 4)); g.setAttribute('iR', new THREE.InstancedBufferAttribute(new Float32Array(iR), 2));
        g.instanceCount = iP.length / 4; g.boundingSphere = bb.isEmpty() ? new THREE.Sphere(V3(0, 0, 0), 1) : bb.getBoundingSphere(new THREE.Sphere()); g.boundingSphere.radius += 3;
        const m = new THREE.Mesh(g, sasaMat); m.name = 'orchard-sasa'; m.visible = false; scene.add(m); orchSasa = m;
      }
      await ctx.yield();
      // the same sasa in clumps on the slope the homeward leg comes down (u 0.5 to 0.72): tufted ground under the lens, with dark feet
      {
        const rl2 = XR('loop-sasa'), N = Math.round(1650 * (0.6 + 0.4 * detail)), iP = [], iC = [], iR = [], bb = new THREE.Box3();
        for (let i = 0, tries = 0; i < N && tries < N * 5; tries++) {
          if ((tries & 255) === 255) await ctx.yield();
          path.pointAt(rl2.range(0.505, 0.72), tmpA); const a = rl2.range(0, 6.2832), d = 17 * Math.pow(rl2(), 0.7), x = tmpA.x + Math.cos(a) * d, z = tmpA.z + Math.sin(a) * d, kk = rl2();
          const r0 = Math.hypot(x, z); if (r0 < 44 || Math.hypot(x - CRAG[0], z - CRAG[1]) < 11 || Math.abs(x - sx(z)) < HW + 2) continue;
          const th = 0.25 + 0.75 * smoothstep(-0.3, 0.25, noise.n2(x * 0.13 + 9, z * 0.13));
          if (kk > th) continue;
          const y = groundAt(x, z); if (path.distanceTo(x, y + 0.7, z) < 4.8) continue;
          const sc = rl2.range(0.9, 1.6) * (0.8 + 0.35 * th);
          groundColor(x, z, y, 1, tmpC).multiplyScalar(1.3).lerp(cSasa, 0.1 + 0.25 * rl2()).multiplyScalar(rl2.range(0.7, 1.12) * (1 - 0.45 * shadeAt(x, z)));
          iP.push(x, y - 0.04, z, sc); iC.push(tmpC.r, tmpC.g, tmpC.b, rl2.range(0, 6.28)); iR.push(rl2.range(0, 6.28), rl2.range(-0.3, 0.7));
          bb.expandByPoint(tmpB.set(x, y, z)); i++;
        }
        // the serow's knoll (the kit's tufts keep off it): upright sasa right up to its rocks, petal drifts lying in the hollows
        // between the clumps, a few mossy stones (its clumps come last in the mesh, and are left out once the knoll is behind us)
        loopN[0] = iP.length / 4;
        {
          const rk = XR('knoll'), kd = [], NK = Math.round(820 * (0.6 + 0.4 * detail));
          for (let k = 0; k < 9; k++) { const a = k * 0.698 + rk.range(-0.2, 0.2), d = rk.range(6.4, 11.8); kd.push([CRAG[0] + Math.cos(a) * d, CRAG[1] + Math.sin(a) * d, rk.range(1.5, 2.4)]); }
          const ks = []; for (let k = 0; k < 8; k++) { const a = k * 0.785 + 0.39 + rk.range(-0.25, 0.25), d = rk.range(5.2, 12.5); ks.push([CRAG[0] + Math.cos(a) * d, CRAG[1] + Math.sin(a) * d, rk.range(0.45, 0.95)]); }
          const kHole = (x, z) => { let k = 1; for (const d of kd) k = Math.min(k, smoothstep(0.5, 1.0, Math.hypot(x - d[0], z - d[1]) / d[2])); for (const st of ks) k = Math.min(k, smoothstep(1.0, 1.6, Math.hypot(x - st[0], z - st[1]) / st[2])); return k; };
          for (let i = 0, tries = 0; i < NK && tries < NK * 5; tries++) {
            if ((tries & 127) === 127) await ctx.yield();
            const a = rk.range(0, 6.2832), d = 3.4 + 13.6 * Math.sqrt(rk()), x = CRAG[0] + Math.cos(a) * d, z = CRAG[1] + Math.sin(a) * d, kk = rk(), s0 = rk();
            if (torTopAt(cragBeds, x, z, 0.95) > -1e8 || kk > kHole(x, z) * (1 - 0.45 * smoothstep(12, 17, d))) continue;
            const y = groundAt(x, z); if (path.distanceTo(x, y + 0.7, z) < 4.8) continue;
            groundColor(x, z, y, 1, tmpC).multiplyScalar(1.3).lerp(cSasa, 0.12 + 0.25 * s0).multiplyScalar(lerp(0.7, 1.12, rk()) * (1 - 0.45 * shadeAt(x, z)));
            iP.push(x, y - 0.04, z, lerp(0.85, 1.45, s0)); iC.push(tmpC.r, tmpC.g, tmpC.b, rk.range(0, 6.28)); iR.push(rk.range(0, 6.28), rk.range(-0.3, 0.7));
            bb.expandByPoint(tmpB.set(x, y, z)); i++;
          }
          await ctx.yield();
          const pos = [], aq = [], idx = [];
          for (const d of kd) {
            const base = pos.length / 3, el = rk.range(1.15, 1.5);
            // (a fan is laid only where the knoll is gentle: on its steep flank the ground's own drifts do the work)
            if (Math.hypot(groundAt(d[0] + 1.2, d[1]) - groundAt(d[0] - 1.2, d[1]), groundAt(d[0], d[1] + 1.2) - groundAt(d[0], d[1] - 1.2)) > 0.9) continue;
            pos.push(d[0], groundAt(d[0], d[1]) + 0.12, d[1]); aq.push(0, 0);
            for (let ring = 1; ring <= 2; ring++) for (let k = 0; k < 12; k++) {
              const an = k / 12 * 6.2832, rr = d[2] * (ring === 1 ? 0.5 : rk.range(0.85, 1.2)), u = Math.cos(an) * rr * el, v = Math.sin(an) * rr / Math.sqrt(el), x = d[0] + WHX * u - WHZ * v, z = d[1] + WHZ * u + WHX * v;
              pos.push(x, groundAt(x, z) + 0.11, z); aq.push(Math.cos(an) * ring * 0.5, Math.sin(an) * ring * 0.5);
            }
            for (let k = 0; k < 12; k++) { const a = base + 1 + k, b = base + 1 + (k + 1) % 12; idx.push(base, b, a, a, b, a + 12, b, b + 12, a + 12); }
          }
          const dg = new THREE.BufferGeometry(); dg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); dg.setAttribute('aQ', new THREE.Float32BufferAttribute(aq, 2)); dg.setIndex(idx);
          if (idx.length) { const dm = new THREE.Mesh(dg, litterMat); dm.name = 'knoll-drifts'; dm.renderOrder = 1; scene.add(dm); }
          const stM = ks.map(([x, z, r], i) => place(x, groundAt(x, z) - r * 0.28, z, r * 1.2, r * 0.9, r * 1.05, i * 2.3 + 0.7, 0.12 * Math.sin(i * 1.9)));
          const st = T.makeInstances(gBoulder, rockMat, stM, { rng: XR('knoll-stones'), brightness: 0.12 }); scene.add(st.object);
        }
        const sg = sasaGeometry(), g = new THREE.InstancedBufferGeometry();
        g.setAttribute('position', sg.attributes.position); g.setAttribute('normal', sg.attributes.normal); g.setAttribute('aK', sg.attributes.aK);
        g.setAttribute('iP', new THREE.InstancedBufferAttribute(new Float32Array(iP), 4)); g.setAttribute('iC', new THREE.InstancedBufferAttribute(new Float32Array(iC), 4)); g.setAttribute('iR', new THREE.InstancedBufferAttribute(new Float32Array(iR), 2));
        g.instanceCount = iP.length / 4; g.boundingSphere = bb.isEmpty() ? new THREE.Sphere(V3(0, 0, 0), 1) : bb.getBoundingSphere(new THREE.Sphere()); g.boundingSphere.radius += 3;
        const m = new THREE.Mesh(g, sasaMat); m.name = 'loop-sasa'; scene.add(m); loopSasa = m; loopN[1] = g.instanceCount;
      }
      await ctx.yield();
      {
        const stM = stones.map(([x, z, r], i) => place(x, groundAt(x, z) - r * 0.1, z, r * 1.2, r * 1.0, r * 1.05, i * 2.3 + 0.7, 0.12 * Math.sin(i * 1.9)));
        const st = T.makeInstances(gBoulder, rockMat, stM, { rng: XR('saddle-stones'), brightness: 0.12 }); scene.add(st.object);
      }
      // the Omine range beyond the saddle: two blue ridges that stand a hand's breadth over the crest either side of the ring,
      // so the petals pouring through have something darker than sky behind them
      {
        const pos = [], colr = [], idx = [], fogC = col(LK.fog), lum = 0.3 * fogC.r + 0.55 * fogC.g + 0.15 * fogC.b;
        const blue = (moon ? col('#16223c') : tone('#3b5c88')).multiplyScalar(moon ? 0.6 : clamp(lum / 0.5, 0.3, 1.1)), a0 = Math.atan2(WHX, WHZ);
        for (const [Rr, e0, e1, pale, sd, pk] of [[1750, 0.1, 0.16, 0.62, 3.1, 0.085], [1080, 0.058, 0.118, 0.34, 7.7, 0.03]]) {
          const NS = 80, b0 = pos.length / 3, cTop = blue.clone().lerp(fogC, pale), cBot = cTop.clone().lerp(fogC, 0.55);
          for (let i = 0; i <= NS; i++) {
            const f = i / NS, a = a0 + (f - 0.5) * 1.5, ed = smoothstep(0, 0.16, f) * smoothstep(1, 0.84, f);
            const prof = clamp(0.5 + 0.36 * noise.n2(f * 5.0 + sd, sd) + 0.2 * noise.n2(f * 14 + sd, 4.4) + 0.08 * noise.n2(f * 40 + sd, 9.1), 0, 1);
            const x = P0[0] + Math.sin(a) * Rr, z = P0[2] + Math.cos(a) * Rr, top = lerp(-50, P0[1] + Rr * (lerp(e0, e1, prof) + pk * (0.7 + 0.6 * prof) * Math.exp(-(((f - 0.33) / 0.1) ** 2))), ed);
            pos.push(x, -80, z, x, top, z); colr.push(cBot.r, cBot.g, cBot.b, cTop.r, cTop.g, cTop.b);
            if (i > 0) { const q = b0 + (i - 1) * 2; idx.push(q, q + 2, q + 1, q + 1, q + 2, q + 3); }
          }
        }
        const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(colr, 3)); g.setIndex(idx);
        const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ vertexColors: true, fog: false, side: THREE.DoubleSide })); m.name = 'omine-ridges'; scene.add(m);
      }
    }
    await ctx.yield();

    // ---------- petals in the air ----------
    const HB = [-300, -260, 470, 600], HN = 96, hData = new Uint16Array(HN * HN);
    for (let j = 0; j < HN; j++) {
      for (let i = 0; i < HN; i++) { const x = HB[0] + (i + 0.5) / HN * HB[2], z = HB[1] + (j + 0.5) / HN * HB[3]; hData[j * HN + i] = THREE.DataUtils.toHalfFloat(Math.max(height(x, z), waterY(z))); }
      if ((j & 1) === 1) await ctx.yield();
    }
    const hTex = new THREE.DataTexture(hData, HN, HN, THREE.RedFormat, THREE.HalfFloatType); hTex.magFilter = hTex.minFilter = THREE.LinearFilter; hTex.wrapS = hTex.wrapT = THREE.ClampToEdgeWrapping; hTex.needsUpdate = true;
    const farSphere = new THREE.Sphere(V3(0, 0, 0), 1e5);
    const petalTri = [0, -0.1, 0, -0.75, 1.15, 0, 0.75, 1.15, 0];
    const airU = { uCtr: { value: V3(0, 0, 0) }, uBox: { value: V3(52, 30, 52) }, uAmt: { value: new THREE.Vector2(airCalm, clamp(0.85 * density + (season === 'late' ? 0.15 : 0), 0.4, 1)) }, tH: { value: hTex }, uHBox: { value: new THREE.Vector4(...HB) } };
    {
      const n0 = Math.round(14000 * detail), n = n0 + Math.round(15000 * detail), rp = R.fork('air'), aS = new Float32Array(n * 4);
      for (let i = 0; i < n * 4; i++) { aS[i] = rp(); if ((i & 32767) === 32767) await ctx.yield(); }
      const g = new THREE.InstancedBufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(petalTri, 3)); g.setAttribute('aS', new THREE.InstancedBufferAttribute(aS, 4));
      g.instanceCount = n0; g.boundingSphere = farSphere;
      const m = new THREE.Mesh(g, petalMaterial(S, 'air', airU)); m.name = 'air-petals'; m.frustumCulled = false; scene.add(m);
      airGeo = g; airN = [n0, n];
    }
    await ctx.yield();
    {
      const nh = homes.length / 3, n = Math.min(nh * 3, Math.round(9000 * detail * density)), rp = R.fork('burst'), aS = new Float32Array(n * 4), aH = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) {
        const h = (nh ? Math.floor(rp() * nh) : 0) * 3;
        aH[i * 3] = homes[h] + rp.range(-0.8, 0.8); aH[i * 3 + 1] = homes[h + 1] + 0.3 * rp.range(-0.5, 0.8); aH[i * 3 + 2] = homes[h + 2] + rp.range(-0.8, 0.8);
        aS[i * 4] = rp(); aS[i * 4 + 1] = rp(); aS[i * 4 + 2] = rp(); aS[i * 4 + 3] = rp();
      }
      const g = new THREE.InstancedBufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(petalTri, 3));
      g.setAttribute('aS', new THREE.InstancedBufferAttribute(aS, 4)); g.setAttribute('aH', new THREE.InstancedBufferAttribute(aH, 3));
      g.instanceCount = Math.max(n, 1); g.boundingSphere = farSphere;
      const m = new THREE.Mesh(g, petalMaterial(S, 'burst', {})); m.name = 'burst-petals'; m.frustumCulled = false; scene.add(m); burstPetals = m;
    }
    await ctx.yield();
    // the storm's three lanes of petals, from the great tree to the ring (see the shader). They run once the gust has passed the tree.
    const strU = { uBzA: { value: [V3(), V3(), V3(), V3()] }, uBzB: { value: [V3(), V3(), V3(), V3()] }, uBzC: { value: [V3(), V3(), V3(), V3()] }, uStr: { value: new THREE.Vector4(0, 0.105, 2.7, 1.5) }, uSplit: { value: V3(0.5, 0.77, 2) } };
    // THE GUST'S OWN STREAMS, seen from the pass above the great tree (u 0.6 to 0.76). From there the wind blows square across the
    // view, so each is a ribbon of packed petals from one side of the frame to the other with clean air between it and the
    // next: one low over the stream behind the tree, against the shaded cedar; one high over the far bank; one off the crown
    // itself, rising up the slope over our right shoulder; one down the valley to the south, against the blue far side.
    const valU = { uBzA: { value: [V3(), V3(), V3(), V3()] }, uBzB: { value: [V3(), V3(), V3(), V3()] }, uBzC: { value: [V3(), V3(), V3(), V3()] }, uStr: { value: new THREE.Vector4(0, 0.095, 3.0, 2.3) }, uSplit: { value: V3(0.3, 0.52, 0.8) } };
    const uValLane = { value: 0 };
    let valPetals = null; const valN = [0, 0];
    {
      const at = (pp, ax, y, out) => out.set(P0[0] + WHX * pp + crestX * ax, y, P0[2] + WHZ * pp + crestZ * ax);
      const gAt = (pp, ax) => groundAt(P0[0] + WHX * pp + crestX * ax, P0[2] + WHZ * pp + crestZ * ax);
      // (metres along the wind from the ring, metres to the left of the flight, height)
      // (they ride above the crowns, so that from the flight they are seen against the sky and the far slope, never lost in blossom)
      at(-176, 15, TY + 14, strU.uBzA.value[0]); at(-100, 13, P0[1] + 3, strU.uBzB.value[0]); at(3, 0, P0[1] - 0.5, strU.uBzC.value[0]);
      at(-168, -30, gAt(-168, -30) + 10, strU.uBzA.value[1]); at(-80, -22, P0[1] + 12, strU.uBzB.value[1]); at(3.5, -2.6, P0[1] + 1.4, strU.uBzC.value[1]);
      at(-128, 56, gAt(-128, 56) + 8, strU.uBzA.value[2]); at(-50, 30, P0[1] + 2, strU.uBzB.value[2]); at(3.5, 2.8, P0[1] - 2.2, strU.uBzC.value[2]);
      const n = Math.round(24000 * (0.6 + 0.4 * detail)), rp = XR('stream'), aS = new Float32Array(n * 4);
      for (let i = 0; i < n * 4; i++) { aS[i] = rp(); if ((i & 32767) === 32767) await ctx.yield(); }
      const g = new THREE.InstancedBufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(petalTri, 3)); g.setAttribute('aS', new THREE.InstancedBufferAttribute(aS, 4));
      g.instanceCount = n; g.boundingSphere = new THREE.Sphere(V3(P0[0] - WHX * 85, P0[1] - 14, P0[2] - WHZ * 85), 135);
      const m = new THREE.Mesh(g, petalMaterial(S, 'stream', strU)); m.name = 'stream-petals'; scene.add(m); streamPetals = m;
    }
    await ctx.yield();
    {
      // (metres down the wind from the great tree, metres across it (the far bank is positive, the flight negative), height)
      const vt = (pp, ax, y, out) => out.set(WHX * pp + crestX * ax, y, WHZ * pp + crestZ * ax);
      const VL = [[[-120, 36, 24], [0, 25, 36], [120, 30, 46]], [[-130, 78, 46], [0, 62, 52], [130, 64, 62]], [[-34, 8, 38], [30, -4, 50], [125, -32, 72]], [[10, 42, 15], [95, 46, 20], [215, 22, 42]]];
      VL.forEach((L3, i) => { vt(...L3[0], valU.uBzA.value[i]); vt(...L3[1], valU.uBzB.value[i]); vt(...L3[2], valU.uBzC.value[i]); });
      const n = Math.round(15000 * (0.6 + 0.4 * detail)), rp = XR('valley-stream'), aS = new Float32Array(n * 4);
      for (let i = 0; i < n * 4; i++) { aS[i] = rp(); if ((i & 32767) === 32767) await ctx.yield(); }
      const g = new THREE.InstancedBufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(petalTri, 3)); g.setAttribute('aS', new THREE.InstancedBufferAttribute(aS, 4));
      g.instanceCount = n; g.boundingSphere = new THREE.Sphere(V3(0, 40, 30), 270);
      const m = new THREE.Mesh(g, petalMaterial(S, 'stream', valU)); m.name = 'valley-stream-petals'; m.visible = false; scene.add(m); valPetals = m; valN[0] = Math.round(n * 0.35); valN[1] = n;
    }
    await ctx.yield();
    // a lane's body: one soft pale ribbon along its curve (the true petals ride inside it). Marked by a seed of 2 and more.
    const laneBody = (pos, tan, au, idx, A, B, C, seed, w0, w1) => {
      const NL = 36, b0 = pos.length / 3;
      for (let j = 0; j <= NL; j++) {
        const t = j / NL, w = 1 - t;
        tmpA.set(2 * (w * (B.x - A.x) + t * (C.x - B.x)), 2 * (w * (B.y - A.y) + t * (C.y - B.y)), 2 * (w * (B.z - A.z) + t * (C.z - B.z))).normalize();
        const px = w * w * A.x + 2 * w * t * B.x + t * t * C.x, py = w * w * A.y + 2 * w * t * B.y + t * t * C.y, pz = w * w * A.z + 2 * w * t * B.z + t * t * C.z;
        for (const sgn of [-1, 1]) { pos.push(px, py, pz); tan.push(tmpA.x, tmpA.y, tmpA.z); au.push(sgn, t * 210, seed, lerp(w0, w1, t)); }
        if (j > 0) { const q = b0 + (j - 1) * 2; idx.push(q, q + 1, q + 2, q + 1, q + 3, q + 2); }
      }
    };
    {
      const pos = [], tan = [], au = [], idx = [];
      for (let si = 0; si < 4; si++) laneBody(pos, tan, au, idx, valU.uBzA.value[si], valU.uBzB.value[si], valU.uBzC.value[si], 2.31 + si * 1.37, 4.6, 3.6);
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aT', new THREE.Float32BufferAttribute(tan, 3)); g.setAttribute('aU', new THREE.Float32BufferAttribute(au, 4)); g.setIndex(idx);
      g.computeBoundingSphere(); g.boundingSphere.radius += 10;
      const m = new THREE.Mesh(g, ribbonMaterial(S, moon ? 0.34 : 0.46, uValLane)); m.name = 'valley-streams'; m.renderOrder = 3; scene.add(m);
    }
    await ctx.yield();
    // far streams: they follow the ground, turn along the contour where a spur stands in the way, and speed over the crests
    {
      const rr = R.fork('ribbons'), NR = Math.round(150 * (0.6 + 0.4 * detail)), J = 21, STEP = 10, pos = [], tan = [], au = [], idx = [];
      for (let k = 0; k < NR; k++) {
        let x, z;
        // (on the last leg never over the flight: most of them round the upslope shoulder)
        if (k < NR * 0.45) { path.pointAt(rr.range(0.6, 1.0), tmpA); const l0 = rr.range(-90, 90), lat = (l0 < 36 ? -1 : 1) * (62 + Math.abs(l0) * 1.2), al = rr.range(-150, 40); x = tmpA.x + crestX * lat + WHX * al; z = tmpA.z + crestZ * lat + WHZ * al; }
        else { x = rr.range(-380, 120); z = rr.range(-260, 260); }
        const alt = rr.range(3, 17), seed = rr(), hw = rr.range(2.2, 5) * 1.7, line = [];
        let dx = WHX, dz = WHZ;
        for (let j = 0; j <= J; j++) {
          const h = Math.max(height(x, z), waterY(z));
          line.push([x, h + alt + 2.5 * Math.sin(j * 0.5 + seed * 20), z]);
          const gx = (height(x + 4, z) - h) / 4, gz = (height(x, z + 4) - h) / 4, climb = gx * WHX + gz * WHZ, over = Math.max(0, climb - 0.22);
          let nx = WHX - gx * over * 2.2 + 0.25 * Math.sin(j * 0.6 + seed * 30) * crestX, nz = WHZ - gz * over * 2.2 + 0.25 * Math.sin(j * 0.6 + seed * 30) * crestZ; const nl = Math.hypot(nx, nz) || 1;
          dx = lerp(dx, nx / nl, 0.6); dz = lerp(dz, nz / nl, 0.6); const dl = Math.hypot(dx, dz) || 1; x += dx / dl * STEP; z += dz / dl * STEP;
        }
        for (let j = 0; j <= J; j++) {
          const a = line[Math.max(0, j - 1)], b = line[Math.min(J, j + 1)], p = line[j]; tmpA.set(b[0] - a[0], b[1] - a[1], b[2] - a[2]).normalize();
          for (const sgn of [-1, 1]) { pos.push(p[0], p[1], p[2]); tan.push(tmpA.x, tmpA.y, tmpA.z); au.push(sgn, j * STEP, seed, hw); }
          if (j > 0) { const q = (k * (J + 1) + j - 1) * 2; idx.push(q, q + 1, q + 2, q + 1, q + 3, q + 2); }
        }
        if ((k & 7) === 7) await ctx.yield();
      }
      // the three lanes of the storm have a body of the same stuff: from far off each is one pale ribbon, and only near the lens
      // does it come apart into petals (the true petals ride inside it). Marked by a seed of 2 and more.
      for (let si = 0; si < 3; si++) laneBody(pos, tan, au, idx, strU.uBzA.value[si], strU.uBzB.value[si], strU.uBzC.value[si], 2.31 + si * 1.37, 4.4 * (si === 0 ? 1 : 0.85), 2.6 * (si === 0 ? 1 : 0.85));
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aT', new THREE.Float32BufferAttribute(tan, 3)); g.setAttribute('aU', new THREE.Float32BufferAttribute(au, 4)); g.setIndex(idx);
      g.computeBoundingSphere(); g.boundingSphere.radius += 10;
      const m = new THREE.Mesh(g, ribbonMaterial(S, moon ? 0.34 : 0.46)); m.name = 'petal-streams'; m.renderOrder = 3; scene.add(m);
    }
    await ctx.yield();

    // ---------- wildlife ----------
    const fauna = F.makeFauna(scene, { light: F.lightFrom(scene, { sunIntensity: LK.sunI * (terminator ? 0.3 : 1) }) });
    // white-eyes feeding in the curtain: they lift as we enter and hang ahead of the lens, sliding from the lit side across
    fauna.add(F.makeFlock({ rng: R.fork('eyes'), species: 'crows', count: 70, size: 0.42, translucency: 0.2, body: hx('#748636'), belly: hx('#dcd9b4'), wingC: hx('#55652a'), tip: hx('#3b4420'), head: hx('#9aad42'), tailC: hx('#5b6a2c'), trail: hx('#788a38'), beak: '#26261e',
      flap: 9, glide: 0.04, cross: { path, u: 0.297, lead: 5.2, angle: 19, side: 1, height: 0.7, span: 64, window: 0.06, rise: 5.5 }, spread: [2.1, 1.5, 3.2], wander: [0.45, 0.35, 0.45, 1.3] }));
    // barn swallows hawking in the petal stream ahead of us on the climb
    fauna.add(F.makeFlock({ rng: R.fork('swallows'), species: 'swifts', count: 5, size: 1.05, body: '#161c34', belly: '#ebe4d6', wingC: '#10152a', tip: '#080a14', head: '#7a2a1c', tailC: '#10152a', trail: '#1c2440',
      along: { path, side: 0.5, up: 0.15, lead: 5.2, from: 0.755, to: 0.975, drift: 1.6 }, spread: [2.6, 1.3, 2.4], wander: [1.3, 0.7, 1.0, 1.1] }));
    if (warblers) fauna.add(F.makeFlock({ rng: R.fork('warblers'), species: 'crows', count: 6, size: 0.3, body: hx('#6a6a3c'), belly: hx('#b8b08a'), wingC: hx('#56562f'), tip: hx('#33331f'), head: hx('#70703f'), tailC: hx('#4c4c2a'), trail: hx('#62623a'), flap: 10, glide: 0.02,
      center: [-2, waterY(150) + 2.4, 150], radius: 9, height: 1.2, spread: [3, 1, 3] }));
    if (kite) fauna.add(F.makeFlock({ rng: R.fork('kite'), species: 'eagles', count: 2, size: 1.15, body: '#3a2a1e', belly: '#5a4634', wingC: '#33251b', tip: '#17110c', center: [70, 82, -60], soarRadius: 50, radius: 40 }));
    await ctx.yield();

    const units = makeUnits(), furM = furMaterial(S, col(LK.hemiSky).multiplyScalar(0.22));
    const MC = { fur: tone('#665c51'), furD: tone('#433b34'), belly: tone('#8d8273'), face: tone('#d25a4e'), hand: tone('#3a312b') };   // dark enough to stand out of lit blossom
    const mGeo = { sit: macaqueGeo(units, 'sit', noise, MC) };
    await ctx.yield();
    mGeo.groom = macaqueGeo(units, 'groom', noise, MC);
    await ctx.yield();
    mGeo.stand = macaqueGeo(units, 'stand', noise, MC);
    await ctx.yield();
    const troop = [];
    const addMacaque = (pose, dx, dz, yaw, scale, role) => {
      const G = mGeo[pose], g = new THREE.Group(), x = ROOF[0] + dx, z = ROOF[1] + dz;
      const body = new THREE.Mesh(G.body, furM), head = new THREE.Mesh(G.head, furM); head.position.set(G.headAt[0], G.headAt[1], G.headAt[2]);
      g.add(body, head); g.position.set(x, roofTop(x, z) - 0.04, z); g.rotation.y = yaw; scale *= 1.75; g.scale.setScalar(scale); scene.add(g);
      const m = { g, head, role, yaw, ph: troop.length * 1.7, base: g.position.clone(), scale }; troop.push(m); return m;
    };
    // set out across the line of sight from the pass ([a across, d toward the lens] turned to x, z), the tall ones behind
    const RA = (a, d) => [0.71 * a + 0.70 * d, -0.70 * a + 0.71 * d], am = (pose, a, d, yaw, scale, role) => { const o = RA(a, d); return addMacaque(pose, o[0], o[1], yaw, scale, role); };
    am('stand', -1.75, -0.35, 1.0, 1.0, 'reach');                                     // upright, pulling the spray down
    am('sit', 0.55, 0.75, 0.2, 1.05, 'sit'); am('groom', -0.35, 0.7, 1.75, 1.0, 'groom');   // a grooming pair
    am('sit', 1.45, 0.8, 1.1, 0.95, 'eat'); am('sit', 2.25, -0.25, 0.4, 1.08, 'sit');
    am('groom', -0.95, -1.05, 0.5, 0.9, 'groom'); am('sit', 0.7, -0.95, 1.2, 0.72, 'eat');
    if (troopN > 7) am('sit', -2.3, -0.75, 1.3, 1.0, 'sit');
    if (troopN > 8) am('sit', 1.65, -1.35, 0.7, 0.6, 'eat');
    const juvA = am('sit', 1.2, 1.1, 1.2, 0.6, 'leap'), juvB = am('sit', 2.1, 0.35, 0.6, 0.5, 'leap');
    { const a = RA(-1.2, 1.25), b = RA(1.2, -0.9); juvA.to = V3(ROOF[0] + a[0], 0, ROOF[1] + a[1]); juvB.to = V3(ROOF[0] + b[0], 0, ROOF[1] + b[1]); }
    for (const j of [juvA, juvB]) j.to.y = roofTop(j.to.x, j.to.z) - 0.04;
    // the serow on its crag: it stands stock still; only the head and ears turn with us
    const unitsF = { s: new THREE.SphereGeometry(1, 11, 7), c: new THREE.CapsuleGeometry(1, 2, 3, 9), k: new THREE.ConeGeometry(1, 2, 8, 1) };      // rounder lumps: it is seen from nine metres
    const sGeo = serowGeo(unitsF, noise, { dark: tone('#2b292c'), grey: tone('#57524e'), pale: tone('#b4aea2'), hoof: tone('#141211') });
    await ctx.yield();
    const serow = new THREE.Group(), serowBody = new THREE.Mesh(sGeo.body, furM), serowHead = new THREE.Mesh(sGeo.head, furM);
    serowHead.position.set(sGeo.headAt[0], sGeo.headAt[1], sGeo.headAt[2]); serow.add(serowBody, serowHead);
    const serowYaw = 3.7;                                                           // it faces out over the orbit: a three-quarter view as we come and as we go
    serow.position.set(CRAG[0], serowY - 0.04, CRAG[1]); serow.rotation.y = serowYaw; serow.scale.setScalar(2.3); scene.add(serow);
    await ctx.yield();

    // three sika hinds browsing the sasa on the west bank of the stream: one lifts her head as we come, all watch us pass; nothing walks
    const hinds = [];
    {
      const hG = hindGeo(units, noise, { tan: tone('#7a563a'), dark: tone('#4a3626'), pale: tone('#b89f7c'), spot: tone('#dccdb0'), white: tone('#efe9dc'), hoof: tone('#1f1a16') });
      for (const [x, z, yaw, sc, down, lift] of [[0.8, 127.6, 1.9, 1.38, 1.7, [30, 20]], [-1.3, 124.0, 0.5, 1.3, 0.1, [0, 0]], [1.1, 120.4, 2.5, 1.2, 1.85, [30, 20]]]) {
        const g = new THREE.Group(), body = new THREE.Mesh(hG.body, furM), head = new THREE.Mesh(hG.head, furM); head.position.set(hG.headAt[0], hG.headAt[1], hG.headAt[2]);
        g.add(body, head); g.position.set(x, groundAt(x, z) - 0.03, z); g.rotation.y = yaw; g.scale.setScalar(sc); scene.add(g);
        hinds.push({ g, head, yaw, down, lift, ph: hinds.length * 2.3, x, z });
      }
      hinds.geo = hG;
    }
    await ctx.yield();

    // the rare visitor: a mountain hawk-eagle stoops through the petal cloud between the lens and the tree at u 0.68. It is built
    // here and flown on u along the sight line, so it is where the eye already is: dark, wings half folded, against the rose.
    let eagle = null;
    if (rare) {
      const E = { back: tone('#6a5038'), wing: tone('#8a6a4c'), under: tone('#c2ad8c'), bar: tone('#3a2a20'), beak: tone('#d9b84e') };      // dark brown, not black: the barring and the pale trailing edge have to read
      // seen from above in its stoop: wrists pushed forward, hands swept back to three fingers, tail closed to a wedge
      const B = [];
      B.push(['s', [0, 0, 0.04], [0.115, 0.1, 0.37], [0.04, 0, 0], E.under, E.back]);                      // body
      B.push(['s', [0, 0.03, 0.43], [0.075, 0.07, 0.1], [0, 0, 0], E.wing, E.back]);                       // head
      B.push(['k', [0, 0.005, 0.55], [0.022, 0.04, 0.022], [1.9, 0, 0], E.beak]);
      const plate = (out, dih, cTop, cTip, cUnder) => {
        const tri = THREE.ShapeUtils.triangulateShape(out.map((q) => new THREE.Vector2(q[0], q[1])), []), pos = [], nor = [], colr = [];
        const Y = (x, z) => dih * Math.abs(x) - 0.05 * x * x + 0.012 * Math.sin(z * 9.0) + 0.07 * Math.min(1, Math.abs(x) * 4) * (1 - Math.min(1, ((z + 0.05) / 0.42) ** 2));      // cambered: the wing is a shallow arch from leading edge to trailing
        for (const side of [1, -1]) for (const f of tri) {
          const a = out[f[0]], b = out[f[1]], c = out[f[2]], up = ((b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0])) < 0;      // true: a,b,c already winds to +y
          const order = (up === (side > 0)) ? [a, b, c] : [a, c, b];
          for (const q of order) {
            pos.push(q[0], Y(q[0], q[1]) + 0.007 * side, q[1]); nor.push(0, side, 0);
            const k = clamp((0.1 - q[1]) / 0.6, 0, 1), bar = 0.42 + 0.58 * smoothstep(-0.25, 0.25, Math.sin(q[1] * 24.0 + Math.abs(q[0]) * 5.0)), C = side > 0 ? tmpC.copy(cTop).lerp(cTip, k * 0.7).multiplyScalar(bar * (1 + 0.5 * smoothstep(0.42, 0.6, Math.abs(q[0])))) : tmpC.copy(cUnder).multiplyScalar(0.6 + 0.4 * bar);
            colr.push(C.r, C.g, C.b);
          }
        }
        const g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(colr, 3));
        return g;
      };
      const wingOut = [[0.07, 0.3], [0.2, 0.36], [0.36, 0.4], [0.52, 0.36], [0.6, 0.24], [0.63, 0.06], [0.6, -0.16], [0.55, -0.36], [0.5, -0.52], [0.47, -0.36], [0.43, -0.5], [0.4, -0.32], [0.35, -0.42], [0.32, -0.22], [0.24, -0.2], [0.15, -0.24], [0.07, -0.2]];
      const tailOut = [[-0.08, -0.2], [0.08, -0.2], [0.11, -0.5], [0.13, -0.72], [0, -0.76], [-0.13, -0.72], [-0.11, -0.5]];
      const tailG = plate(tailOut, 0, E.wing, E.bar, E.under), bodyG = lumps(units, B, noise, 0.1);
      const eg = { body: bodyG, tail: tailG, wl: plate(wingOut, 0.16, E.wing, E.bar, E.under), wr: plate(wingOut.map((q) => [-q[0], q[1]]), 0.16, E.wing, E.bar, E.under) };
      const eM = furMaterial(S, col(LK.hemiSky).multiplyScalar(0.8)); eM.emissive = tone('#2e2218');
      const g = new THREE.Group(), eb = new THREE.Mesh(eg.body, eM), wl = new THREE.Mesh(eg.wl, eM), wr = new THREE.Mesh(eg.wr, eM);
      wl.position.set(0, 0.04, 0); wr.position.set(0, 0.04, 0); g.add(eb, new THREE.Mesh(eg.tail, eM), wl, wr); g.scale.setScalar(1.25); g.position.set(0, -500, 0); scene.add(g);
      const cam0 = path.pointAt(0.68, V3()), dir = V3(0, TY + 10.5 * HS, 0).sub(cam0).normalize(), right = V3().crossVectors(dir, V3(0, 1, 0)).normalize(), up = V3().crossVectors(right, dir).normalize();
      const camV = path.tangentAt(0.68, V3()).multiplyScalar(path.length * 0.016);                          // what the lens travels while the bird crosses
      const vel = V3().copy(camV).multiplyScalar(0.3).addScaledVector(right, 8.2).addScaledVector(up, -7.4).addScaledVector(dir, 1.5).normalize();   // seen three-quarter on, along its stoop
      const quat = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().lookAt(V3(0, 0, 0), V3().copy(vel).negate(), V3().copy(up).multiplyScalar(0.5).addScaledVector(dir, -0.87)));   // banked: its back to the lens
      g.quaternion.copy(quat);
      eagle = { g, wl, wr, dir, right, up, geo: eg };
    }
    await ctx.yield();

    // ---------- far ridges, mist threads off the cedars, weather ----------
    const ridges = T.makeHorizonRidges({ rng: R.fork('ridges'), fog: scene.fog, layers: 3, radius: [1500, 3300], height: [150, 430], base: -60, segments: 150, jagged: 0.35, colorNear: moon ? '#1a2640' : '#4f6a84', sunDir, sunColor: LK.sun, rim: 0.22 });
    scene.add(ridges.object);
    await ctx.yield();
    const time = { value: 0 }, set = fx.fxGroup(); scene.add(set.object);
    {
      const rm = R.fork('mist'), mp = [];
      for (let i = 0; i < cedars.length && mp.length < 26; i += Math.max(1, Math.floor(cedars.length / 26))) { const c = cedars[i]; if (c.pd > 45) mp.push([c.x + rm.range(-8, 8), c.y + c.H * rm.range(0.5, 1.0), c.z + rm.range(-8, 8)]); }
      for (let i = 0; i < cones.length && mp.length < 44; i += Math.max(1, Math.floor(cones.length / 18))) { const c = cones[i]; mp.push([c.x, c.y + c.H * 0.9, c.z]); }
      if (mp.length) set.add(fx.makeMist({ rng: rm, time, count: mp.length, positions: mp, size: [46, 92], color: moon ? '#5a6c9c' : terminator ? '#c6c2e2' : '#e2eaf2', opacity: Math.min(0.11, LK.mist * 0.45), drift: [0.5, 0.35, 0.3], flatten: 0.26 }));
      // threads of mist lying along the spur between its ranks of cedar
      if (mistAt.length) set.add(fx.makeMist({ rng: rm, time, count: mistAt.length, positions: mistAt, size: [52, 104], color: moon ? '#5a6c9c' : terminator ? '#cdc8e6' : '#e6eef6', opacity: clamp(LK.mist * 0.95, 0.12, 0.2), drift: [0.7, 0.12, 0.3], flatten: 0.17 }));
      { const f = fallFoot, sp = []; for (const [al, y, sd] of [[0, 0.9, 0], [-1.2, 1.9, 0.7], [0.6, 1.6, -0.9], [-2.6, 3.0, 0.2], [0.2, 2.8, 0.5], [-4.2, 4.4, -0.3]]) sp.push([f.x + al * fdx - sd * fdz, f.y + y, f.z + al * fdz + sd * fdx]);
        set.add(fx.makeMist({ rng: rm, time, count: sp.length, positions: sp, size: [3.2, 6.2], color: moon ? '#aab8dc' : '#eef3f6', opacity: 0.4, drift: [0.3, 0.5, 0.2], flatten: 0.8 }));
        if (fallSpray.length) set.add(fx.makeMist({ rng: rm, time, count: fallSpray.length, positions: fallSpray, size: [1.5, 2.8], color: moon ? '#aab8dc' : '#eef3f6', opacity: 0.3, drift: [0.3, 0.5, 0.2], flatten: 0.9 })); }
      if (lookName === 'dawn') set.add(fx.makeMist({ rng: rm, time, count: 64, area: [150, 4, 520], center: [30, 1.5, -40], size: [18, 34], color: '#b4c2e6', opacity: 0.2, drift: [0.5, 0, 0.9], flatten: 0.24, heightAt: (x, z) => { const w = waterY(z), h = height(x, z); return h > w + 4 || Math.hypot(x, z) < 60 ? -400 : Math.max(h, w); }, lift: 1.2 }));
      if (spurSpray.length) set.add(fx.makeMist({ rng: XR('spur-mist'), time, count: spurSpray.length, positions: spurSpray, size: [8, 15], color: moon ? '#aab8dc' : '#eef3f6', opacity: 0.34, drift: [0.4, 0.6, 0.3], flatten: 0.75 }));
    }
    let snow = null;
    if (LK.snow) { snow = fx.makeParticles({ rng: R.fork('snow'), preset: 'snow', time, count: Math.round(3600 * detail), box: [64, 40, 64], velocity: [-3.2, -1.6, 3.6], velocityRandom: [1.5, 0.6, 1.5], size: [0.03, 0.07], opacity: 0.7 }); scene.add(snow.object); }
    await ctx.yield();
    if (ctx.renderer && sky.prewarm) { try { await sky.prewarm(ctx.renderer, null, scene); } catch (e) { /* headless */ } }

    // ---------- the flight ----------
    const sTab = new Float32Array(101); for (let i = 0; i <= 100; i++) { path.pointAt(i / 100, tmpA); sTab[i] = tmpA.x * WHX + tmpA.z * WHZ; }
    const sCam = (u) => { const f = clamp(u, 0, 1) * 100, i = Math.min(99, Math.floor(f)); return lerp(sTab[i], sTab[i + 1], f - i); };
    // the gust front, metres along the wind: it comes down the valley, reaches the tree at uHit, then runs 30 m ahead of us
    const frontAt = (u) => Math.min((u - uHit) * 1150, sCam(u) + 30 + 70 * smoothstep(0.8, 1, u));
    const treeAim = V3(0, TY + 10.5 * HS, 0), passAim = V3(), curtainAim = V3(), roofAim = V3(ROOF[0] + 0.5, roofTop(ROOF[0], ROOF[1]) + 0.6, ROOF[1] + 0.3), serowAim = V3(CRAG[0], serowY + 1.25, CRAG[1]), ringAim = V3(P0[0], P0[1], P0[2]), fallAim = V3(lerp(FALL[0], FALL[2], 0.3), groundAt(lerp(FALL[0], FALL[2], 0.3), lerp(FALL[1], FALL[3], 0.3)) + 2, lerp(FALL[1], FALL[3], 0.3));
    const buf = new THREE.Vector2(), camP = V3(), camD = V3(), lp = V3();
    let gustK = -1;
    function update(dt, time_, camera, u) {
      const uu = u ?? 0, t = time_;
      time.value = t; S.uFront.value.x = frontAt(uu); S.uFront.value.w = t;
      if (ctx.renderer && ctx.renderer.getDrawingBufferSize) S.uViewH.value = ctx.renderer.getDrawingBufferSize(buf).y || 1080;
      if (camera) { camera.getWorldPosition(camP); camera.getWorldDirection(camD); airU.uCtr.value.copy(camP).addScaledVector(camD, 15); }
      hero.setGust(clamp(3 * (uu - uHit) / (uEnd - uHit), -30, 60)); hero.update(dt, t, camera);
      strU.uStr.value.x = S.uLane.value = smoothstep(0.66, 0.74, uu);
      // the valley lanes belong to the gust: they come over as the front strikes the great tree (gust clock, seconds) and stay; they fill over its three seconds
      const gs = 3 * (uu - uHit) / (uEnd - uHit);
      valU.uStr.value.x = uValLane.value = smoothstep(-0.25, 2.1, gs); valPetals.visible = gs > -0.25; valPetals.geometry.instanceCount = Math.round(valN[0] + (valN[1] - valN[0]) * smoothstep(1, 3, gs));
      // what cannot be seen is not drawn (meshes only; every one of them was compiled while hidden)
      saddleSasa.visible = uu > 0.72; bankSasa.visible = uu < 0.26; orchSasa.visible = uu > 0.3 && uu < 0.56; if (orchTors[0]) orchTors[0].visible = uu > 0.3 && uu < 0.57; if (orchTors[1]) orchTors[1].visible = uu > 0.44 && uu < 0.64; streamPetals.visible = uu > 0.655; airGeo.instanceCount = uu > 0.755 ? airN[1] : airN[0]; loopSasa.visible = uu > 0.435 && uu < 0.745; loopSasa.geometry.instanceCount = uu > 0.585 ? loopN[0] : loopN[1];
      if (heroLimbs) heroLimbs.visible = !(uu > 0.43 && uu < 0.588);
      heroPetalG.instanceCount = Math.round(heroPetalN * (0.3 + 0.7 * smoothstep(0.03, 0.15, uu)));
      hero.parts.blossoms.visible = uu > 0.165 && uu < 0.4;   // true blossoms only where they are more than a pixel (from the pass above they are not)
      const gk = smoothstep(uHit - 0.04, uHit + 0.04, uu);
      if (Math.abs(gk - gustK) > 0.01) { gustK = gk; wind.set({ strength: lerp(0.8, 2.3, gk), speed: lerp(0.9, 1.5, gk) }); }
      sky.update(dt, t, camera); terrain.update(dt, t); ridges.update(dt, t, camera); rockMeshes[0].update(dt, t);
      for (const c of cedarSets) c.update(dt, t, camera);
      for (const c of covers) c.update(dt, t, camera);
      fauna.update(dt, t, camera, uu); set.update(dt, t, camera); if (snow) snow.update(dt, t, camera);
      // macaques: grooming, chewing, reaching; the juveniles leap between two perches and nothing walks
      for (const m of troop) {
        const p = t + m.ph;
        if (m.role === 'reach') { m.g.rotation.x = -0.05 + 0.05 * Math.sin(p * 1.3); m.head.rotation.x = -0.45 + 0.08 * Math.sin(p * 1.3 + 0.6); m.head.rotation.y = 0.2 * Math.sin(p * 0.5); }
        else if (m.role === 'groom') { m.head.rotation.x = 0.4 + 0.1 * Math.sin(p * 4.3); m.g.rotation.x = 0.04 * Math.sin(p * 2.1); m.head.rotation.y = 0.12 * Math.sin(p * 1.1); }
        else if (m.role === 'eat') { m.head.rotation.x = 0.18 + 0.12 * Math.max(0, Math.sin(p * 5.5)) * smoothstep(-0.2, 0.4, Math.sin(p * 0.6)); m.head.rotation.y = 0.5 * Math.sin(p * 0.37); }
        else if (m.role === 'sit') { m.head.rotation.y = 0.75 * Math.sin(p * 0.31) * smoothstep(0.1, 0.6, Math.abs(Math.sin(p * 0.17))); m.head.rotation.x = 0.06 * Math.sin(p * 0.9); m.g.rotation.z = 0.02 * Math.sin(p * 0.7); }
        else {
          const cyc = (p * 0.42) % 2;                                                   // the leaps run on each juvenile's own clock for the whole flight
          const k = cyc < 1 ? smoothstep(0.62, 0.86, cyc) : 1 - smoothstep(0.62, 0.86, cyc - 1), air = 4 * k * (1 - k);
          m.g.position.lerpVectors(m.base, m.to, k); m.g.position.y += 1.7 * air;
          m.g.rotation.y = Math.atan2(m.to.x - m.base.x, m.to.z - m.base.z) + (cyc < 1 ? 0 : Math.PI); m.g.rotation.x = -0.5 * air * (0.5 - k) * 2;
          m.head.rotation.y = air > 0.02 ? 0 : 0.6 * Math.sin(p * 1.3);
        }
      }
      if (eagle) {
        const k = (uu - 0.672) / 0.016;
        if (k > -0.8 && k < 1.8) {
          path.pointAt(uu, lp); const fl = Math.sin(t * 17);
          eagle.g.position.copy(lp).addScaledVector(eagle.dir, 6.6 + 1.5 * (k - 0.5)).addScaledVector(eagle.right, -4.1 + 8.2 * k).addScaledVector(eagle.up, 3.5 - 7.4 * k);
          eagle.wl.rotation.z = 0.06 * fl - 0.1; eagle.wr.rotation.z = 0.1 - 0.06 * fl;
        } else eagle.g.position.set(0, -500, 0);
      }
      // the hinds: head down in the sasa until we come, then up and following us; an ear flicks
      for (const h of hinds) {
        const up = h.lift[1] > 0 ? 1 - smoothstep(h.lift[1], h.lift[0], Math.hypot(camP.x - h.x, camP.z - h.z)) : 1, p = t + h.ph;   // lift = [metres at which the head starts up, metres at which it is up]
        const a = Math.atan2(camP.x - h.x, camP.z - h.z) - h.yaw, w = Math.atan2(Math.sin(a), Math.cos(a));
        h.head.rotation.x = lerp(h.down + 0.06 * Math.sin(p * 2.6), 0.06 * Math.sin(p * 0.7), up);
        h.head.rotation.y = clamp(w, -1.3, 1.3) * 0.85 * up + 0.1 * Math.sin(p * 0.5) * (1 - up);
        h.head.rotation.z = 0.07 * Math.sin(p * 9.0) * smoothstep(0.75, 1, Math.sin(p * 0.6));
      }
      // the serow watches us round the turn
      if (camera) {
        const a = Math.atan2(camP.x - CRAG[0], camP.z - CRAG[1]) - serowYaw, w = Math.atan2(Math.sin(a), Math.cos(a));
        serowHead.rotation.y = clamp(w, -1.25, 1.25) * 0.9; serowHead.rotation.x = -0.12 + 0.03 * Math.sin(t * 0.8); serowHead.rotation.z = 0.05 * Math.sin(t * 2.7) * smoothstep(0.6, 1, Math.sin(t * 0.43));
      }
    }

    return {
      scene, path, duration: 47, title: LK.title,
      // linger under the tree and past the macaques, ease by the serow and through the stripping, then let the gust carry us
      // linger under the tree (slowest from the parting to the way out) and past the macaques, ease round the serow and through
      // the stripping, then let the gust carry us
      pace: (u) => 1.0 - 0.62 * smoothstep(0.228, 0.268, u) * (1 - smoothstep(0.322, 0.385, u)) - 0.46 * smoothstep(0.47, 0.505, u) * (1 - smoothstep(0.565, 0.6, u))
        - 0.36 * smoothstep(0.585, 0.62, u) * (1 - smoothstep(0.715, 0.76, u)) + 0.4 * smoothstep(0.76, 0.8, u) * (1 - smoothstep(0.85, 0.92, u)),
      camera: { fov: 62, near: 0.3, far: 4300, lookAhead: 22, sway: 1, bank: 0.55 },
      pois: [
        { at: treeAim, from: 0.0, to: 0.25, weight: 0.5 },
        { at: (tt, u) => { path.pointAt(Math.min(1, u + 0.02), lp); return curtainAim.set(lp.x + 7.5 - 4.0 * smoothstep(0.284, 0.3, u), lp.y + 4.2, lp.z); }, from: 0.235, to: 0.332, weight: 0.66 },
        { at: roofAim, from: 0.314, to: 0.384, weight: 0.8 },
        { at: fallAim, from: 0.372, to: 0.462, weight: 0.5 },
        { at: serowAim, from: 0.44, to: 0.572, weight: 0.9, fade: 0.14 },
        // homeward the eye holds the tree; as the gust strips it the gaze drifts down the valley with the petals, so the sky and the far ridges come in
        { at: (tt, u) => { const k = smoothstep(0.6, 0.7, u); return passAim.set(-5 * k, TY + 10.5 * HS + 3.5 * k, 6 * k); }, from: 0.556, to: 0.765, weight: 0.78, fade: 0.1 },
        { at: ringAim, from: 0.735, to: 0.975, weight: 0.55 },
      ],
      portal: { shape: 'circle', radius: RR, color: LK.portal, glow: 1, revealDistance: 260 },
      post: { exposure: LK.exposure, bloom: { strength: LK.bloom, radius: 0.6, threshold: 0.92 },
        grade: { saturation: LK.sat, contrast: LK.contrast ?? 1.0, tint: LK.tint, shadowTint: LK.shadow, vignette: 0.28, grain: 0.02, aberration: 0 } },
      ride: 'none',
      update,
      dispose() {
        if (sky.dispose) sky.dispose();
        hero.dispose();
        detailTex.userData.cell?.dispose(); detailTex.dispose();
        for (const g of [units.s, units.c, units.k, unitsF.s, unitsF.c, unitsF.k, sGeo.body, sGeo.head, quad, gBoulder, gBoulderB, gBoulderC, ...gNear, ...gMid, ...gFar, mGeo.sit.body, mGeo.sit.head, mGeo.groom.body, mGeo.groom.head, mGeo.stand.body, mGeo.stand.head, hinds.geo.body, hinds.geo.head]) g.dispose();
        for (const tx of [atlas, bTex, hTex, leafTex, S.tForest.value, S.tShade.value]) if (tx) tx.dispose();
      },
    };
  },
};
