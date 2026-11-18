// MUD-TOWER HABOOB: "The Wall of Dust". A lanner falcon stoops off a canyon rim in the Hadhramaut, down a cleft in the
// cliff, over date groves, through the south gate of a walled town of five hundred mud-brick towers, up a lane of
// lattices and laundry, and bursts over the lime-white parapets as an 800 m dust front eats the town behind it.
// World coordinates are the brief's: +X east (the storm comes from +X), +Z south, wadi floor y = 0, town on the origin.
// The hero (src/parts/mud-tower-haboob.js) is turned -90 degrees: world X = -local z, world Z = local x.
// Looks by seed / ctx.vary.hour: hard noon (default), late afternoon (sun in the west, the front lit gold, no shadow
// line), first light (lamps in the lattices, a violet-brown front). Weather: dry, a thin pale front, a wet front with
// fat drops. Season: green alfalfa, date harvest, bare summer stubble. Cast: doves, a wedding lane, a long caravan.
// Rare event: a rent opens in the wall and one shaft of clean sun sweeps the darkened roofs and comes to rest on the portal.
// Light: no shadow map. The hero sweeps a 1 m height map of towers, walls, gate, mosque and palm crowns along the key light
// once at build (hero.bakeShadows), and every lit material reads it, so the lane, the roofs and the groves have cast shadows
// at noon and 100 m tower shadows in the late look. Ground detail (ruts, hoof marks, cobbles, bedded rock on every slope,
// sand snakes, heat shimmer) is painted after the lights by GROUND_LIT. The entry looks over a bay cut under the rim's lip,
// past a ruined watchtower on a rock stack, straight at the town; the cleft below it is benched, with ledges of slab rock.
// The cleft's east wall is laid back and filled by a canyon bounce (it faces away from the noon sun); the north cliff has 60 m
// benches on an even 16 m mesh (lodFocus). At the reveal the gaze first takes the shadow line, then pans north to the portal.
// The roof run is flown 22 m above the parapets so the far crowns show, with the shadow line 50 to 60 m to the right; pace() hurries
// the stoop and lingers over the roofs. The kit's wind material replaces the projection chunk, so the hero's patch is told where
// to write its world position (palms, acacias and tamarisk take the storm shadow, the town's shadows and the dust where they stand).
// Round seven: the entry heads 28 degrees east of north (town centred); below the lip the stoop eases to a glide that rises out of
// the cleft, and one poi holds a level gaze, so town, groves, far cliff and the wall of dust share the frame all the way down (the
// cleft is still cut along the old line, bedLine). The plots are no board (makePlots: tilted rows, staggered cross walls, merged and
// split plots, a second band outside the west wall, a burial ground); the open floor carries braided washes, trodden roads, ripples.
// An outlying quarter (the hero's opts.extraTowers, low houses, gardens, palms) lines the caravan track to the portal, the front comes
// on to 95 m with its shadow 150 m ahead, and lit dust and sheets of sand cross the track. Things too small to see from the rim
// (roof kit, shutters, sand sheets, the gravel's bushes) are hidden until the flight is near them.
// Round eight: the grade no longer crushes the darks (contrast near 1, a little blue in the shadow tint) and the town's own shadows
// are filled by the bounce (hero.setBounce); the mud is a paler tan; palms within 22 m of the flight are a closer model (closePalm:
// twelve narrow fronds, a skirt of dry ones); shutter leaves have louvres and a frame; the mosque sits in the town kit so the lane
// kit and the cloth can stay hidden until the cleft's mouth; the pebbles off the lip fall in a shallow box below the eye.
// Round ten: the entry heads 36 degrees east of north and the front starts 1,600 m off, so it already towers behind the town's east end
// from the rim (and in the picture through the portal); the stoop is flown lower in the notch and its gaze pans: over the town, east to
// the wall of dust, down to the gate. Palm shadows are dappled shade, never brighter than the sun. The wingtips rest as a slim wedge in
// each bottom corner (broad barred vanes, dark ends) and sweep in only on a beat: one snap open out of the stoop, beats on the climb.
// A thin front is a veil with a dark core (hero opts.thin). The lane's ground storey, the two flanks of the climb, the low house and
// the court inside the gate carry more (a second lane mesh); a clap of pigeons leaves the low house, goats are driven up the track.
// Round eleven: the noon sun stands lower and further south (38 degrees up in the south-east), so every tower has a lit face, a shaded
// side and a shadow as long as itself, and seven landmark houses and a 45 m minaret break the roof line. The late look's wall of dust
// is modelled (lit heads, dark throats) and palms and their trunks bar the track with shade. The cleft has two steep shoulders. The
// wingtips are out of the frame while gliding and sweep in on a beat. The lane has a second storey of lattices; date mats are woven.
// Round thirteen: light with a direction and a second colour. Bars of sun are let into the street every 14 m (hero.bakeShadows sunSlots)
// and the town's own shade is cooler; the gatehouse throws an exact, crenellated shadow with the sun through its arch (hbGate in the
// ground shader; the gate towers are out of the baked map, which rounded them to a blob). The storm in the last third: a broad torn
// shadow edge on the ground, curtains in the dust, modelled billows on the face over us, eight streamers pouring off it over the
// outlying towers (kind 2 of the portal-dust sprites), the sky overhead darkening by degrees. The stoop is flown deeper in the notch;
// its gaze swings further east so the front fills the right of the frame in mid-stoop; a pair of ravens wheels ahead as we tip over
// the lip; tall acacias stand on the notch's west crest; ten camels walk up the track under their own dust. The lane's ground storey
// has shop hatches, second doors and fanlights of coloured glass (lit at first light), lattice pairs between the windows, and a
// second tier of washing lines (lane-kit3). From the rim the lanes are dark slots, one roof in four carries a carpet or a mat of
// dates, and the landmark houses stand 55 to 66 m.
// Round fourteen: the storm is lit and sculpted. The noon sun stands to one side of the wall, so the flank of every billow turned to it is
// gilded over a brown-black throat (hero opts.gild; the puffs take the same light and are no longer sliced by the shell), the face over us
// has a third, 4 m grain, the streamers are thin torn dust of the front's own colour, and pale sand snakes over the ground under the
// shadow. Where a side lane opens off the street the house front beyond it is dressed (doors, lattices, shutters, washing down the side
// lane), the court inside the gate has a market on the ground, acacias cling to the notch's east wall, the camel string comes down the
// track toward us on the verge, goats are black and brown, the folded wingtips show through the stoop, the south-west quarter
// of the town is low, and the reveal's gaze reaches the portal sooner.
import * as THREE from 'three';
import { makePath } from '../kit/core.js';
import { makeSky, makeLightRig, skyDirection } from '../kit/sky.js';
import * as T from '../kit/terrain.js';
import * as S from '../kit/structures.js';
import * as flora from '../kit/flora.js';
import * as F from '../kit/fauna.js';
import * as fx from '../kit/fx.js';
import { buildHero } from '../parts/mud-tower-haboob.js';

const TAU = Math.PI * 2, DEG = Math.PI / 180;
const sat = (x) => Math.min(1, Math.max(0, x));
const sstep = (a, b, x) => { const t = sat((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const mix = (a, b, t) => a + (b - a) * t;
const hash1 = (n) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
const PALETTE = ['#F7F1E3', '#C79A63', '#7A4A2A', '#2E1D14', '#D9822B', '#6FA9D8', '#4E7A3A'];
const MUD = '#C9A884', HERO_PALETTE = PALETTE.map((c, i) => (i === 1 ? MUD : c));      // the mud as it renders: a paler tan than the brief's swatch, which the sun and the tone map turn orange
const L = (hex, k = 1) => { const c = S.lin(hex); return [c[0] * k, c[1] * k, c[2] * k]; };
// kinds carried in the kit geometry's `win.x` and read by the kit material
const K = { MUD: 0, FEATHER: 8, WOOD: 11, LATTICE: 12, LIME: 14, POT: 15, DATES: 17, GLASS: 19 };

// ---------- looks ----------
const LOOKS = {
  noon: {
    title: 'The Wall of Dust', el: 38, az: 136, shadow: 1, wallLit: 0, lamps: 0, exposure: 1.08, dapMin: 0, shadeAmb: 0.12,
    skyA: { preset: 'day', zenith: '#4f8fd6', mid: '#86b6e6', horizon: '#f1f2ec', ground: '#d3bc94', horizonPow: 7, sunColor: '#fff6e0', sunSize: 0.75, sunIntensity: 12,
      sunGlow: 0.5, scatter: 0.12, scatterColor: '#fff4e0', clouds: false, clouds2: false,
      lightColor: '#ffe8c2', lightIntensity: 4.3, ambientColor: '#9dbcea', groundLight: '#c7a273', ambientIntensity: 1.0 },
    skyB: { preset: 'day', zenith: '#8c8873', mid: '#ad9873', horizon: '#9fb4c4', ground: '#8a6a48', horizonPow: 2.2, sunColor: '#e08a34', sunSize: 0.9, sunIntensity: 9,
      sunGlow: 0.35, scatter: 1.0, scatterColor: '#c08a50', scatterPow: 1.4, scatterHigh: 0.8, scatterFall: 1.2, clouds: false, clouds2: false,
      lightColor: '#ffd3a6', lightIntensity: 3.1, ambientColor: '#c2ad92', groundLight: '#9a7c5c', ambientIntensity: 1.05 },
    fogA: '#e6dcc4', fogB: '#b9946c', density: 0.0004, bounceA: ['#fff0d0', 0.16], bounceB: ['#ffd8b0', 0.18],
    grade: { tint: '#fff8ea', shadowTint: '#141624', saturation: 0.92, contrast: 1.03 }, portal: '#fff0c8', wall: null,
  },
  afternoon: {
    title: 'The Wall of Dust, Late Light', el: 13, az: 258, shadow: 0, wallLit: 1.2, lamps: 0, exposure: 1.04, dapMin: 0.75, shadeAmb: 0.42,
    skyA: { preset: 'goldenHour', zenith: '#5a8cc4', mid: '#a9bccb', horizon: '#f0d4a2', ground: '#b9966a', horizonPow: 3, sunColor: '#ffd9a0', sunSize: 1.1, sunIntensity: 12,
      sunGlow: 0.8, scatter: 0.7, scatterColor: '#ffc880', clouds: false, clouds2: false,
      lightColor: '#ffd29a', lightIntensity: 3.9, ambientColor: '#9aaedc', groundLight: '#a8947e', ambientIntensity: 1.3, lightElevationMin: 20 },
    skyB: { preset: 'goldenHour', zenith: '#8a8c88', mid: '#b5a482', horizon: '#e2b87e', ground: '#94704a', horizonPow: 2.4, sunColor: '#ffb766', sunSize: 1.2, sunIntensity: 10,
      sunGlow: 0.7, scatter: 0.9, scatterColor: '#e09a50', scatterPow: 2, scatterHigh: 0.5, clouds: false, clouds2: false,
      lightColor: '#ffd8ac', lightIntensity: 3.1, ambientColor: '#b4a898', groundLight: '#a08462', ambientIntensity: 1.15, lightElevationMin: 20 },
    fogA: '#e6cfa6', fogB: '#cfa474', density: 0.00042, bounceA: ['#ffe6c8', 0.3], bounceB: ['#ffdcb4', 0.28],
    grade: { tint: '#fff6e6', shadowTint: '#14121e', saturation: 0.92, contrast: 1.03 }, portal: '#ffe6b0',
    wall: { dark: '#4a2e1c', mid: '#754a2a', tan: '#d9a25e', ochre: '#f0b050', dust: '#8a623c' },
  },
  dawn: {
    title: 'The Wall of Dust, First Light', el: 7, az: 112, shadow: 1, wallLit: 0, lamps: 1.6, exposure: 1.22, dapMin: 0.7, shadeAmb: 0.22,
    skyA: { preset: 'dawn', zenith: '#34416f', mid: '#7c6c8e', horizon: '#e8aa8e', ground: '#5c4e5c', horizonPow: 2.6, sunColor: '#ffb48a', sunSize: 1.0, sunIntensity: 7,
      sunGlow: 0.6, scatter: 0.8, scatterColor: '#ff9a70', clouds: false, clouds2: false, stars: 0.12,
      lightColor: '#ffc4a6', lightIntensity: 2.3, ambientColor: '#9a90b6', groundLight: '#74627c', ambientIntensity: 1.72, lightElevationMin: 22 },
    skyB: { preset: 'dawn', zenith: '#3a3652', mid: '#5c4a5c', horizon: '#8f7078', ground: '#3c2e36', horizonPow: 2.2, sunColor: '#c97858', sunSize: 1.0, sunIntensity: 4,
      sunGlow: 0.3, scatter: 0.9, scatterColor: '#7a4a48', scatterPow: 1.5, scatterHigh: 0.7, clouds: false, clouds2: false,
      lightColor: '#e6bcae', lightIntensity: 1.35, ambientColor: '#827ca4', groundLight: '#64505a', ambientIntensity: 1.65, lightElevationMin: 22 },
    fogA: '#b79a9c', fogB: '#6c5258', density: 0.00046, bounceA: ['#ffc8b4', 0.25], bounceB: ['#c79888', 0.22],
    grade: { tint: '#fbf0f4', shadowTint: '#12101e', saturation: 1.0, contrast: 1.03 }, portal: '#ffd9c0',
    wall: { dark: '#291c2c', mid: '#49323f', tan: '#7c5b5e', ochre: '#c9785a', dust: '#3e2c34' },
  },
};

// ---------- kit material: one lit program for every small built thing, the shutters and the wingtips ----------
function makeKitMaterial(KU) {
  const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.92, metalness: 0, side: THREE.DoubleSide });
  mat.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, KU);
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', /* glsl */`#include <common>
attribute vec3 win; attribute vec2 iSh;
uniform float uKTime, uKSlamZ, uKFold, uKRuffle, uKFlap, uKWingX, uKSnap, uKShow;
varying vec3 vKit; varying vec2 vKUv; varying vec3 vKL;`)
      .replace('#include <beginnormal_vertex>', /* glsl */`#include <beginnormal_vertex>
  float kSw = 0.0;
  #ifdef USE_INSTANCING
  if (abs(iSh.x) > 0.01) {                 // a shutter leaf: hinged on its local Y axis, slammed shut by the gust wave
    float kz = instanceMatrix[3].z;
    float shut = smoothstep(0.0, 9.0, kz - uKSlamZ);
    float rattle = shut * exp(-max(kz - uKSlamZ - 9.0, 0.0) * 0.05) * sin(uKTime * 31.0 + iSh.y * 40.0) * 0.14;
    kSw = iSh.x * (1.0 - shut) * (1.0 + 0.12 * sin(uKTime * (0.9 + iSh.y) + iSh.y * 50.0)) + rattle;
    float kc0 = cos(kSw), ks0 = sin(kSw);
    objectNormal = vec3(objectNormal.x * kc0 + objectNormal.z * ks0, objectNormal.y, -objectNormal.x * ks0 + objectNormal.z * kc0);
  }
  #endif`)
      .replace('#include <begin_vertex>', /* glsl */`#include <begin_vertex>
  vKit = win; vKUv = uv; vKL = vec3(0.0);
  #ifdef USE_INSTANCING
  if (abs(iSh.x) > 0.01) { float kc1 = cos(kSw), ks1 = sin(kSw); transformed = vec3(position.x * kc1 + position.z * ks1, position.y, -position.x * ks1 + position.z * kc1);
    vKL = vec3(position.xy, 1.0); }                                    // a shutter leaf: its own coordinates, for the louvres and the frame
  #endif
  if (win.x > 7.5 && win.x < 8.5) {        // wingtip feather: position = spread pose, color = folded pose
    transformed = mix(position, color, uKFold);
    transformed.x += sign(position.x) * uKWingX * transformed.z;      // on a narrow frame the two tips move in instead of being squeezed
    float kBeat = sin(uKTime * 7.5) * uKFlap + uKSnap;                // a wing beat (or the snap open out of the stoop) sweeps the tip up and in; at rest it lies at the frame's edge
    transformed.y += (sin(uKTime * 13.0 + uv.x * 7.0 + win.y * 60.0) * uKRuffle + kBeat) * uv.x * uv.x;
    transformed.x -= sign(position.x) * max(kBeat, 0.0) * 0.5 * uv.x;
    transformed.xy += vec2(sign(position.x) * 0.7, -0.9) * (1.0 - uKShow);     // gliding, a falcon's wings are out beside it: the tips come into the frame only on a beat
  }`);
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vKit; varying vec2 vKUv; varying vec3 vKL; uniform vec3 uKBounce; uniform float uKLamp;')
      .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n  { vec3 kE = (uHbInv * vec4(vHbW, 1.0)).xyz; totalEmissiveRadiance += diffuseColor.rgb * uKBounce * (vKit.x > 7.5 && vKit.x < 8.5 ? 2.0 : 1.0) * (1.0 - 0.8 * hbShadow(kE)) * (1.0 - 0.5 * hbTownW(kE)) + (vKit.x > 18.0 ? diffuseColor.rgb * (0.22 + 2.2 * uKLamp) : vec3(0.0)); }')
      .replace('#include <color_fragment>', /* glsl */`#include <color_fragment>
  { float kk = vKit.x; vec3 kc = diffuseColor.rgb; vec3 kp = vHbW;
    float kn = hbN2(kp.xz * 0.9 + kp.y * 1.3), kn2 = hbN2(vec2(kp.x + kp.z, kp.y) * 5.0);
    float kpx = fwidth(vKUv.x) + fwidth(vKUv.y), kly = fwidth(vKL.y);
    if (kk < 0.5) {                        // mud plaster: blotches, courses, a dusty stained foot
      kc *= (0.8 + 0.28 * kn) * (0.92 + 0.16 * kn2);
      kc = mix(kc, kc * vec3(0.76, 0.68, 0.6), smoothstep(0.5, 0.72, hbN2(kp.xz * 0.33 + kp.y * 0.47 + 3.7)) * 0.3);
      kc *= 0.86 + 0.26 * hbN2(vec2((kp.x + kp.z) * 2.3, kp.y * 0.13));
      kc *= 1.0 - 0.1 * smoothstep(0.4, 0.48, abs(fract(kp.y / 0.42) - 0.5)) * clamp(1.0 - fwidth(kp.y) * 6.0, 0.0, 1.0);
      kc = mix(kc, kc * vec3(0.7, 0.64, 0.58), (1.0 - smoothstep(0.0, 1.4, vKUv.y + kn * 0.8)) * 0.45 * vKit.z);
    } else if (kk < 8.5) {                 // feather: slate brown with four cream bars, a pale shaft, a cream trailing edge
      float fv = vKUv.y + 0.12;                                  // the shaft sits off-centre: narrow leading vane, wide trailing vane
      float barb = abs(fv) * 3.0 - vKUv.x * 9.0;                   // barbs sweep back from the shaft
      float bar = smoothstep(0.27, 0.4, abs(fract(vKUv.x * 4.0 - abs(fv) * 0.7 + vKit.y * 3.0) - 0.5));
      float tipK = smoothstep(0.84, 0.95, vKUv.x);                 // dark ends: the row of overlapping tips in the corner of the frame is plainly feathers
      kc = mix(vec3(0.2, 0.17, 0.14), vec3(0.7, 0.6, 0.43), bar * 0.9 * (1.0 - tipK));
      kc *= 0.9 + 0.1 * smoothstep(0.2, 0.5, abs(fract(barb * 2.5) - 0.5));
      kc = mix(kc, vec3(0.72, 0.63, 0.47), smoothstep(0.36, 0.5, vKUv.y) * 0.85 * (1.0 - 0.7 * tipK));  // cream trailing edge
      kc = mix(kc, vec3(0.11, 0.092, 0.078), tipK * 0.85);
      kc = mix(kc, vec3(0.74, 0.68, 0.56), (1.0 - smoothstep(0.0, 0.035, abs(fv))) * 0.8);             // shaft
      kc *= 0.62 + 0.38 * (1.0 - smoothstep(0.28, 0.5, abs(vKUv.y)));                                    // each vane darkens to its edges, so overlapping feathers stay separate
      kc *= 0.86 + 0.14 * smoothstep(0.0, 0.25, 1.0 - vKUv.x);
    } else if (kk < 11.5) {                // planks with iron studs
      float pl = 0.5 - abs(fract(vKUv.x * 3.0) - 0.5);
      kc *= (0.7 + 0.3 * smoothstep(0.02, 0.08, pl)) * (0.8 + 0.3 * hbN2(vec2(vKUv.x * 40.0, vKUv.y * 2.0)));
      vec2 sq = fract(vKUv * vec2(3.0, 2.4)) - 0.5;
      kc = mix(kc, vec3(0.025), (1.0 - smoothstep(0.06, 0.1, length(sq))) * vKit.z * clamp(1.0 - kpx * 4.0, 0.0, 1.0));
      if (vKL.z > 0.5) {                   // a shutter leaf: louvres 11 cm apart inside a 6 cm frame, with a rail across the middle
        float kfr = min(min(vKL.x, 0.47 - vKL.x), min(min(vKL.y, 1.26 - vKL.y), abs(vKL.y - 0.63) + 0.03));
        float slat = mix(smoothstep(0.3, 0.5, abs(fract(vKL.y * 9.0) - 0.5)), 0.55, clamp(kly * 14.0, 0.0, 1.0));
        kc *= mix(0.7, 0.66 + 0.4 * slat, smoothstep(0.05, 0.07, kfr));
      }
    } else if (kk < 12.5) {                // carved lattice: dark holes between the bars
      vec2 q = vec2(vKUv.x + vKUv.y, vKUv.x - vKUv.y) * 4.0;
      float hole = smoothstep(0.2, 0.3, abs(fract(q.x) - 0.5)) * smoothstep(0.2, 0.3, abs(fract(q.y) - 0.5));
      hole = mix(hole, 0.42, clamp(kpx * 6.0, 0.0, 1.0));
      kc = mix(kc * (0.9 + 0.3 * kn2), vec3(0.085, 0.052, 0.034), hole * 0.8);                           // the dark of the room behind is umber, never black
    } else if (kk < 14.5) {                // lime wash: chalky, with ochre dirt creeping up from the ground
      kc *= 0.86 + 0.16 * kn;
      kc = mix(kc, kc * vec3(0.82, 0.7, 0.56), (1.0 - smoothstep(0.0, 1.5, vKUv.y + kn * 0.7)) * 0.5 * vKit.z);
    } else if (kk < 16.0) {                // pottery, rope, baskets, straw
      kc *= 0.82 + 0.3 * kn2;
    } else if (kk < 18.0) {                // dates spread to dry: a darker speckle of fruit, heaped unevenly
      float kd = hbN2(kp.xz * 8.0), kf = clamp(1.0 - (fwidth(kp.x) + fwidth(kp.z)) * 5.0, 0.0, 1.0);
      kc *= (1.0 - 0.32 * smoothstep(0.42, 0.62, kd) * kf) * (0.84 + 0.3 * hbN2(kp.xz * 1.7 + 3.0)) * (0.92 + 0.16 * kn2);
    } else {                               // a fanlight of coloured glass set in gypsum: panes of four colours between pale bars
      vec2 gq = vKUv * vec2(5.5, 4.2) + vKit.y * 7.0, gi = floor(gq), gf = abs(fract(gq) - 0.5);
      float gh = hbHash(gi + vKit.y * 31.0), bar = smoothstep(0.34, 0.42, max(gf.x, gf.y)) * clamp(1.0 - kpx * 3.0, 0.0, 1.0);
      vec3 pane = gh < 0.3 ? vec3(0.62, 0.07, 0.05) : gh < 0.55 ? vec3(0.85, 0.5, 0.06) : gh < 0.8 ? vec3(0.07, 0.36, 0.16) : vec3(0.08, 0.16, 0.6);
      kc = mix(pane, vec3(0.62, 0.59, 0.5), bar);
    }
    diffuseColor.rgb = kc; }`);
  };
  mat.customProgramCacheKey = () => 'haboob-kit';
  return mat;
}

// ---------- cloth: laundry, curtains, banners, carpets and awnings in one instanced, self-lit draw ----------
const CLOTH_VERT = /* glsl */`
attribute vec4 iA; attribute vec4 iB; attribute vec3 iC; attribute vec3 iD;   // anchor + width | yaw, drop, kind, seed | colours
uniform float uCTime, uCSlamZ; uniform vec3 uCWind;
varying vec3 vP; varying vec3 vN; varying vec2 vSt; varying vec3 vCa; varying vec3 vCb; varying float vKind; varying float vVis;
#include <fog_pars_vertex>
void main(){
  float s = position.x, t = position.y, seed = iB.w, kind = iB.z;
  vec3 W = vec3(cos(iB.x), 0., sin(iB.x)), O = vec3(-W.z, 0., W.x), down = vec3(0., -1., 0.);
  float past = iA.z - uCSlamZ;                               // metres the gust wave has run past this cloth
  float g = smoothstep(0., 14., past);
  float calm = sin(uCTime * 1.4 + seed * 40. + s * 2.5) * 0.35 + sin(uCTime * 2.3 + seed * 17.) * 0.14;
  float fl = sin(t * 7. - uCTime * (10. + 6. * seed) + seed * 30. + s * 3.);
  vec3 dir, p;
  if (kind < 0.5) {                                          // hung from its top edge: sags, then flags downwind
    dir = mix(down + O * calm * 1.3, uCWind, g * 0.94); dir = dir / max(length(dir), 1e-4);
    p = iA.xyz + W * s * iA.w + dir * t * iB.y + O * fl * 0.18 * t * g + vec3(0., fl * 0.1 * t * g, 0.);
    p += O * cos(s * 3.1416 + seed * 6.) * 0.16 * t * (1. - g) - vec3(0., 0.6 * (0.25 - s * s) * (1. - t) * (1. - g), 0.);   // a soft fold, and the line sags between its pegs
  } else {                                                   // awning: top edge on the wall, outer edge on poles until the gust lifts it
    vec3 d0 = O * 0.92 + down * 0.4; d0 = d0 / max(length(d0), 1e-4);
    vec3 d1 = O * 0.5 + vec3(0., 0.75 + 0.3 * fl, 0.) + uCWind * 0.5; d1 = d1 / max(length(d1), 1e-4);
    dir = mix(d0, d1, g); dir = dir / max(length(dir), 1e-4);
    p = iA.xyz + W * s * iA.w + dir * t * iB.y;
    p.y += sin(s * 6.28 + uCTime * 2. + seed * 9.) * 0.04 * t - sin(t * 3.1416) * 0.14 * (1. - g) + fl * 0.12 * t * g;
  }
  float vis = 1.;
  float torn = step(fract(seed * 7.31), 0.34) * step(kind, 0.5);
  float d = max(past - 30. - 170. * fract(seed * 3.7), 0.) * 0.55 * torn;
  if (d > 0.) {                                              // torn off: carried downwind, tumbling about its own width axis
    vec3 rel = p - iA.xyz;
    float a = d * 0.14, c = cos(a), sn = sin(a);
    rel = rel * c + cross(W, rel) * sn + W * dot(W, rel) * (1. - c);
    float lift = smoothstep(0., 20., d);
    p = iA.xyz + rel + vec3(uCWind.x, 0., uCWind.z) * d + vec3(sin(d * 0.05 + seed * 30.) * 4. * lift, 7. * (1. - exp(-d / 30.)) - d * d * 0.0005, 0.);
    vis = 1. - smoothstep(240., 300., d);
    p = mix(iA.xyz + vec3(uCWind.x, 0., uCWind.z) * d, p, vis);
  }
  vec3 nn = cross(W, dir);
  vN = nn / max(length(nn), 1e-4); vP = p; vSt = vec2(s, t); vCa = iC; vCb = iD; vKind = kind; vVis = vis;
  vec4 mvPosition = modelViewMatrix * vec4(p, 1.);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const clothFrag = (glsl) => /* glsl */`
uniform vec3 uCSun, uCAmb, uCSunDir, uKBounce;
varying vec3 vP; varying vec3 vN; varying vec2 vSt; varying vec3 vCa; varying vec3 vCb; varying float vKind; varying float vVis;
#include <fog_pars_fragment>
${glsl}
void main(){
  if (vVis < 0.02) discard;
  float var = fract(vCa.r * 37.7 + vCb.g * 91.3);
  float band = step(0.5, fract(vSt.x * 5.5));
  if (vKind < 0.5) {
    band = step(0.86, vSt.y) + step(abs(vSt.y - 0.1), 0.025);                                    // plain cloth with a hem and a top stripe
    if (var < 0.3) band = step(0.5, fract(vSt.y * 6. + 0.25 * sin(vSt.x * 31.))) * step(0.12, vSt.y) * step(vSt.y, 0.9);        // ikat bands with wavering edges
    else if (var < 0.5) band = step(0.42, abs(fract(vSt.x * 4.) - 0.5)) + step(0.9, vSt.y);     // thin warp stripes
  }
  vec3 col = mix(vCa, vCb, clamp(band, 0., 1.)) * (0.8 + 0.2 * hbN2(vSt * vec2(9., 17.) + vCa.xy * 20.));
  col = mix(col, vec3(dot(col, vec3(0.3, 0.55, 0.15))) * vec3(1.06, 1.0, 0.9), 0.24 + 0.2 * step(0.75, var));   // sun-faded dye
  col *= 0.88 + 0.12 * sin(vSt.x * 19. + vSt.y * 3. + var * 40.);                                  // soft folds
  vec3 hp = (uHbInv * vec4(vP, 1.)).xyz;
  float sh = hbShadow(hp);
  float ndl = abs(dot(vN / max(length(vN), 1e-4), uCSunDir));
  float tw = hbTownW(hp);
  col *= uCSun * ((0.4 + 0.6 * ndl) * (1. - 0.95 * sh) * (1. - 0.7 * tw) + 0.25 * (1. - sh)) + uCAmb * mix(vec3(1.), uHbUmber * 1.3, sh) + uKBounce * (1.5 - 0.6 * sh);
  col = mix(col, uHbDust, hbFog(hp, (uHbInv * vec4(cameraPosition, 1.)).xyz));
  gl_FragColor = vec4(col, 1.);
  #include <fog_fragment>
}`;
function makeClothGeometry() {
  const NU = 3, NV = 6, P = [], I = [];
  for (let j = 0; j <= NV; j++) for (let i = 0; i <= NU; i++) P.push(i / NU - 0.5, j / NV, 0);
  for (let j = 0; j < NV; j++) for (let i = 0; i < NU; i++) { const a = j * (NU + 1) + i, b = a + 1, c = a + NU + 1, d = c + 1; I.push(a, c, b, b, c, d); }
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setIndex(I);
  return g;
}

// ---------- the sun shaft of the rare event: a soft additive column ----------
const SHAFT_VERT = /* glsl */`
varying vec3 vN; varying vec3 vV; varying vec3 vSW; varying float vH; varying float vA;
void main(){ vec4 w = modelMatrix * vec4(position, 1.); vN = mat3(modelMatrix) * normal; vN = vN / max(length(vN), 1e-4); vV = cameraPosition - w.xyz; vSW = w.xyz; vH = uv.y; vA = uv.x;
  gl_Position = projectionMatrix * viewMatrix * w; }`;
const shaftFrag = (glsl) => /* glsl */`
uniform vec3 uShaftCol; uniform float uShaftK, uShaftIn, uShaftSoft;   // uShaftSoft 1: the thin beams of the arrival (soft across, grained along, drifting)
varying vec3 vN; varying vec3 vV; varying vec3 vSW; varying float vH; varying float vA;
${glsl}
void main(){ float f = abs(dot(vN / max(length(vN), 1e-4), vV / max(length(vV), 1e-3)));
  float st = 0.62 + 0.38 * sin(vA * 43.98 + 2.2 * sin(vA * 18.85)) * sin(vA * 12.57 + 1.3);            // streaks of dust in the beam
  float a = f * (0.35 + 0.65 * f) * st * uShaftK * smoothstep(0., 0.04, vH) * (1. - smoothstep(0.25, 0.85, vH)) * mix(1., smoothstep(0.015, 0.12, vH), uShaftIn);   // seen from inside, only the beam overhead
  a *= mix(1., f * (0.55 + 0.9 * hbN2(vec2(vA * 9., vH * 14. - uHbTime * 0.06))), uShaftSoft);
  float dustK = 1. - hbFog((uHbInv * vec4(vSW, 1.)).xyz, (uHbInv * vec4(cameraPosition, 1.)).xyz);   // the beam is lost in the dust it comes out of: no hard arc where it meets the wall
  gl_FragColor = vec4(uShaftCol * a * dustK, 1.); }`;

// ---------- lit dust rolling west over the caravan track at the portal: soft billboards and low sheets of saltating sand ----------
const DUST_VERT = /* glsl */`
attribute vec4 iA; attribute vec4 iB;           // phase, y, z, radius | seed, speed, kind, alpha. Kinds: 0 billow, 1 sheet on the ground (both roll west past the portal),
uniform float uDTime, uDFront; uniform vec3 uDKs;  // 2 streamer pouring off the front's face (iA: -, height, z, length), 3 dust hanging where the caravan treads (iA: x, y, z, radius)
varying vec2 vUv; varying vec3 vW; varying vec4 vQ;
#include <fog_pars_vertex>
void main(){
  float span = 430., f = fract(uDTime * iB.y / span + iA.x), kind = iB.z, env = sin(f * 3.1416);       // billows and sheets start 200 m east of the town's axis, under the shadow, and roll west past the portal
  float kk = kind < 1.5 ? uDKs.x : (kind < 2.5 ? uDKs.y : uDKs.z);
  vec3 c = vec3(200. - f * span, iA.y, iA.z + 7. * sin(f * 9. + iB.x * 40.));
  vec4 mvPosition;
  if (kind < 0.5) {
    float rad = iA.w * (0.75 + 0.5 * f);
    c.y += rad * 0.25;
    mvPosition = viewMatrix * vec4(c, 1.); mvPosition.xy += position.xy * rad;
    vW = c + vec3(0., position.y * rad, 0.);
  } else if (kind < 1.5) {
    vec3 p = c + vec3(position.x * iA.w * 3.2, 0.12 * sin(position.x * 3. + uDTime * 3. + iB.x * 9.), position.y * iA.w * 0.55);
    mvPosition = viewMatrix * vec4(p, 1.); vW = p;
  } else if (kind < 2.5) {                      // a ribbon from high on the front, bending down and west over the roofs, always edge-on to the eye
    float s = position.x * 0.5 + 0.5, sd0 = iB.x, len = iA.w, drop = iA.y - 20.;
    vec3 p = vec3(uDFront - 25. - 40. * sd0 - len * s, iA.y - drop * s * sqrt(s), iA.z);
    p.y += 4. * sin(s * 7. - uDTime * 1.1 + sd0 * 20.) * s;
    p.z += (10. * sin(s * 4. - uDTime * 0.7 + sd0 * 30.) - 30. * s) * s;
    vec3 tg = vec3(-len, -1.5 * drop * sqrt(s), -30.), sdv = cross(tg, cameraPosition - p);
    p += sdv / max(length(sdv), 1e-3) * (position.y * (1.5 + 2.5 * sd0) * (0.3 + 1.1 * s));
    mvPosition = viewMatrix * vec4(p, 1.); vW = p; env = 1.;
  } else {
    float g = fract(uDTime * iB.y + iB.x), rad = iA.w * (0.5 + 0.9 * g);
    c = iA.xyz + vec3(-4. * g, 0.3 * rad + 1.6 * g, -2.5 * g);
    mvPosition = viewMatrix * vec4(c, 1.); mvPosition.xy += position.xy * rad;
    vW = c + vec3(0., position.y * rad, 0.); env = sin(g * 3.1416);
  }
  vUv = position.xy; vQ = vec4(iB.x, env, kind, iB.w * (kind > 1.5 && kind < 2.5 ? smoothstep(80., 220., -mvPosition.z) : smoothstep(3., 22., -mvPosition.z)) * kk);   // (a streamer is gone within 200 m of the eye: close to, it was a flat band)
  gl_Position = kk < 0.003 ? vec4(2., 2., 2., 1.) : projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const dustFrag = (glsl) => /* glsl */`
uniform vec3 uDLit, uDStr; uniform float uDTime, uDStrK;
varying vec2 vUv; varying vec3 vW; varying vec4 vQ;
#include <fog_pars_fragment>
${glsl}
void main(){
  float r2 = dot(vUv, vUv), fall, n, ball = vQ.z < 0.5 || vQ.z > 2.5 ? 1. : 0.;
  if (ball > 0.5) {
    if (r2 > 1.) discard;
    fall = (1. - r2) * (1. - r2) * smoothstep(-1., 7., vW.y);
    n = hbN2(vUv * 2.2 + vQ.x * 31. + vec2(uDTime * 0.12, 0.)) * 0.62 + hbN2(vUv * 5.6 + vQ.x * 57. + vec2(uDTime * 0.3, -uDTime * 0.05)) * 0.38;
  } else if (vQ.z < 1.5) {
    fall = (1. - vUv.x * vUv.x) * (1. - vUv.y * vUv.y); fall *= fall;
    n = hbN2(vec2(vUv.x * 2.5 + uDTime * 0.6 + vQ.x * 13., vUv.y * 9. + vQ.x * 7.));        // streaks along the wind
  } else {
    float s = vUv.x * 0.5 + 0.5;
    fall = 1. - vUv.y * vUv.y; fall *= fall * smoothstep(0., 0.14, s) * (1. - smoothstep(0.5, 1., s));
    n = hbN2(vec2(s * 7. - uDTime * 0.55 + vQ.x * 13., vUv.y * 2.2 + vQ.x * 7.)) * 0.6 + hbN2(vec2(s * 19. - uDTime * 1.3, vUv.y * 5. + vQ.x * 3.)) * 0.4;   // grain pouring down the ribbon
    fall *= smoothstep(0.25, 0.6, n);                              // its long edges are eaten away: torn dust, not a band of light
  }
  float a = (vQ.z > 1.5 && vQ.z < 2.5 ? 0.4 * smoothstep(0.34, 0.8, n * 0.9 + fall * 0.25) : smoothstep(0.12, 0.7, n * 0.75 + fall * 0.5)) * fall * vQ.y * vQ.w;
  if (a < 0.004) discard;
  vec3 hp = (uHbInv * vec4(vW, 1.)).xyz;
  float sh = hbShadow(hp), up = 0.5 + 0.5 * vUv.y * ball;
  vec3 col = (vQ.z > 1.5 && vQ.z < 2.5 ? mix(uDLit, uDStr, uDStrK) : uDLit) * (0.62 + 0.5 * up + 0.3 * (n - 0.5));     // (a streamer is the front's own dust, not lit air)
  col = mix(col, col * uHbUmber * (vQ.z > 0.5 && vQ.z < 1.5 ? 1.25 : 0.8), sh * (vQ.z > 1.5 && vQ.z < 2.5 ? 0.55 : 1.));       // (a sheet of sand stays pale under the shadow: it is what shows on the dark ground)       // (a streamer keeps some light of its own inside the shadow: it is seen against the dark face)
  col = mix(col, uHbDust, hbFog(hp, (uHbInv * vec4(cameraPosition, 1.)).xyz) * 0.7);
  gl_FragColor = vec4(col, a);
  #include <fog_fragment>
}`;

// ---------- ground detail painted after the lights on the terrain: ruts, hoof marks, cobbles, sand snakes, heat shimmer ----------
const GROUND_PARS = /* glsl */`
uniform float uTrkX[17]; uniform float uGndLift, uDapMin, uShadeAmb;
float hbTrkX(float z){ float f = clamp((z - 200.) / 20., 0., 15.999); int i = int(floor(f)); return mix(uTrkX[i], uTrkX[i + 1], f - float(i)); }
float hbSeg(vec2 p, vec2 a, vec2 b){ vec2 pa = p - a, ba = b - a; return length(pa - ba * clamp(dot(pa, ba) / max(dot(ba, ba), 1e-4), 0., 1.)); }
// The gatehouse's own shadow, drawn exactly (the 1 m shadow map rounds it to a blob): its two towers with their merlons, the lintel
// and its merlons between them, and the sun coming through the arch. q is a point on the gate's face (x across, y up).
uniform vec3 uGateSun;
float hbGateSil(vec2 q){
  float ax = abs(q.x), ft = 0.14;
  float tw = smoothstep(5.1 - ft, 5.1 + ft, ax) * (1. - smoothstep(11.7 - ft, 11.7 + ft, ax));
  tw *= 1. - smoothstep(-ft, ft, q.y - 13.5 - 1.1 * (1. - smoothstep(0.21, 0.33, abs(fract((ax - 8.4) / 2.4 + 0.5) - 0.5))));
  float lt = (1. - smoothstep(5.1 - ft, 5.1 + ft, ax)) * smoothstep(-ft, ft, q.y - 10.3);
  lt *= 1. - smoothstep(-ft, ft, q.y - 12.8 - 1.05 * (1. - smoothstep(0.485, 0.575, fract((q.x + 4.3) / 3.2))));
  return max(tw, lt);
}
float hbGate(vec3 w){
  if (uGateSun.z < 0.05 || w.z > 221. || w.z < 150. || w.y > 3.) return 0.;
  float t1 = (211.6 - w.z) / uGateSun.z, t2 = (220.4 - w.z) / uGateSun.z;
  vec3 q1 = w + uGateSun * t1, q2 = w + uGateSun * t2;
  return max(step(0., t1) * hbGateSil(q1.xy), step(0., t2) * hbGateSil(q2.xy));
}
`;
const GROUND_LIT = /* glsl */`
  { vec3 w = vHbW; float ny = vTNormal.y / max(length(vTNormal), 1e-5);
    float dC = distance(cameraPosition, w), flat_ = smoothstep(0.8, 0.96, ny);
    float nearA = 1. - smoothstep(35., 90., dC), nearB = 1. - smoothstep(90., 260., dC);
    vec3 tint = vec3(1.);
    vec2 pc = floor(w.xz * 3.2), pf = fract(w.xz * 3.2) - 0.5; float ph = hbHash(pc);                  // pebbles
    float peb = step(0.8, ph) * (1. - smoothstep(0.14, 0.3, length(pf + (vec2(hbHash(pc + 3.1), hbHash(pc + 7.7)) - 0.5) * 0.4)));
    tint *= 1. + (fract(ph * 13.) > 0.45 ? -0.3 : 0.28) * peb * nearA * flat_;
    tint *= 1. + (0.26 * (hbN2(w.xz * 0.9) - 0.5) + 0.2 * (hbN2(w.xz * 0.19 + 7.) - 0.5)) * nearB * flat_;
    // bedded sandstone on the slopes of the rim, the bay and the cleft: beds about 6 m thick, paler hard beds, thin dark seams
    // (far away the 6 m beds would shimmer, so they give way to 20 m groups of beds)
    { float mouth = smoothstep(450., 470., w.z) * (1. - smoothstep(550., 570., w.z));                  // the talus at the cleft's mouth carries beds on its gentler slopes too
      float slopeK = 1. - smoothstep(mix(0.86, 0.93, mouth), mix(0.965, 0.995, mouth), ny), farK = smoothstep(260., 800., dC), warp = hbN2(w.xz * 0.018) - 0.5;
      float by = w.y * 0.165 + 0.8 * warp, bi = floor(by), bf = fract(by);
      float b1 = hbHash(vec2(bi, 3.7)) - 0.5 - 0.4 * step(0.72, hbHash(vec2(bi, 9.1)));
      float by2 = w.y * 0.05 + 0.25 * warp, bi2 = floor(by2), bf2 = fract(by2);
      float b2 = (hbHash(vec2(bi2, 5.3)) - 0.5 - 0.35 * step(0.7, hbHash(vec2(bi2, 1.9)))) * smoothstep(0., 0.1, bf2) * (1. - smoothstep(0.9, 1., bf2));
      float seam = (1. - smoothstep(0.03, 0.1, min(bf, 1. - bf))) * (1. - smoothstep(140., 420., dC));
      float sub = hbN2(vec2(w.y * 1.9 + 2. * hbN2(w.xz * 0.04), 0.5)) - 0.5;
      float cleftZ = smoothstep(486., 530., w.z) * (1. - smoothstep(770., 800., w.z));
      float bb = mix(b1, b2 * 1.25, farK);
      // (floored: the darkest soft bed under a seam on a cleft wall used to multiply out below zero, a black slit in the rock)
      tint *= max(1. + slopeK * (1. + 0.25 * cleftZ) * ((bb > 0. ? vec3(0.5, 0.44, 0.34) * bb : vec3(0.4, 0.44, 0.5) * max(bb, -0.7)) * (1. + 0.5 * cleftZ) + 0.16 * sub * nearB - (0.26 + 0.14 * cleftZ) * seam), vec3(0.4, 0.38, 0.4));
      { float by3 = w.y * 1.15 + 3.2 * warp + 0.5 * hbN2(w.xz * 0.11), bf3 = fract(by3);             // the talus at the mouth: thin beds, 0.9 m, paler hard ones and darker soft ones, each on a dark seam
        float b3 = (hbHash(vec2(floor(by3), 7.9)) - 0.5) * smoothstep(0., 0.14, bf3) * (1. - smoothstep(0.86, 1., bf3));
        float s3 = (1. - smoothstep(0.02, 0.13, min(bf3, 1. - bf3))) * (0.6 + 0.4 * hbN2(w.xz * 0.7));
        float thinK = max(mouth * nearB, 0.9 * (1. - smoothstep(40., 105., dC)));                   // and every steep face close to the eye shows them too, with a grain
        tint *= max(1. + thinK * slopeK * ((b3 > 0. ? vec3(1.0, 0.9, 0.72) : vec3(0.85, 0.92, 1.0)) * b3 * 1.3 - 0.3 * s3), vec3(0.5));
        tint *= 1. + 0.16 * (hbN2(w.xz * 6. + w.y * 2.3) - 0.5) * slopeK * nearA; }
      { float gs = w.x * 0.8 + w.z * 0.6 + 30. * warp;                                                // goat tracks: pale threads zig-zagging up the mid slopes
        float gy = w.y - 13. * abs(fract(gs / 110.) - 0.5) * 2., gq = abs(fract(gy / 46. + 0.3) - 0.5) * 46., gw = max(fwidth(gy), 1e-3);
        float gl = (1. - smoothstep(0.35, 0.8 + gw, gq)) * smoothstep(0.5, 0.68, ny) * (1. - smoothstep(0.93, 0.975, ny)) * smoothstep(6., 14., w.y) * (1. - smoothstep(180., 300., dC)) * clamp(1.6 / gw, 0., 1.);
        tint *= 1. + 0.25 * gl; }
      // sunlight thrown back and forth between the walls of the cleft: its shaded side glows warm instead of going to blotches
      #if NUM_DIR_LIGHTS > 0
      float cleftK = cleftZ * slopeK;
      reflectedLight.indirectDiffuse += diffuseColor.rgb * vec3(0.5, 0.43, 0.33) * directionalLights[0].color * (0.29 * cleftK);
      #endif
    }
    // alfalfa: crop rows 0.6 m apart, irrigation bunds every 6 m, damp patches where the water was let in
    float green = smoothstep(1.04, 1.2, diffuseColor.g / max(diffuseColor.r, 1e-3)) * flat_;
    { float along = w.x, across = w.z + 1.2 * sin(w.x * 0.07);
      float rw = fwidth(along) / 0.6, row = (smoothstep(0.2, 0.45, abs(fract(along / 0.6) - 0.5)) - 0.5) * clamp(1.5 - rw * 2.5, 0., 1.);
      float bund = 1. - smoothstep(0.16, 0.34, abs(fract(across / 6. + 0.5) - 0.5) * 6.);
      float bund2 = 1. - smoothstep(0.12, 0.26, abs(fract(along / 12. + 0.5) - 0.5) * 12.);
      float damp = smoothstep(0.5, 0.7, hbN2(w.xz * 0.085));
      vec3 gt = vec3(1.) * (1. + 0.36 * row) * (1. - 0.34 * damp) * (0.8 + 0.4 * hbN2(w.xz * 0.6 + 9.)) * (0.86 + 0.28 * hbN2(w.xz * 0.045 + 3.));
      gt = mix(gt, vec3(1.7, 1.2, 0.8), max(bund, bund2) * 0.7);
      tint = mix(tint, tint * gt, green); }
    // the cleared track and the lane: two wheel ruts, hoof marks between them, a paler crown, litter under the walls
    float inLane = step(w.z, 216.);
    float d = w.x - mix(hbTrkX(w.z), -10. * (1. - smoothstep(97., 123., w.z)), inLane), ad = abs(d);
    float road = mix((1. - smoothstep(505., 520., w.z)) * (1. - smoothstep(7.4, 8.4, ad)), step(16., w.z) * (1. - smoothstep(3.6, 4.4, ad)), inLane);
    float inBed = step(w.z, -226.);                              // the caravan track over the gravel to the portal
    d = mix(d, w.x + 110. - 2.5 * sin((w.z + 440.) * 0.02), inBed); ad = abs(d);
    road = mix(road, (1. - smoothstep(2.2, 3.2, ad)) * step(-640., w.z), inBed);
    tint *= 1. + 0.22 * road * inBed * (0.7 + 0.6 * hbN2(w.xz * vec2(1.3, 0.25)));
    float wob = 0.24 * (hbN2(vec2(w.z * 0.11, 3.)) - 0.5);
    float rut = (1. - smoothstep(0.14, 0.42, abs(abs(d + wob) - 1.1))) * (0.45 + 0.55 * hbN2(vec2(w.z * 0.4, d * 2.)));
    tint *= 1. - 0.5 * rut * road * nearB;
    tint *= 1. + 0.35 * road * (hbN2(w.xz * vec2(0.5, 0.12) + 5.) - 0.5);                               // long drifts of paler dust and darker trodden earth
    vec2 hc = floor(w.xz * 2.4), hf = fract(w.xz * 2.4) - 0.5; float hh = hbHash(hc + 17.);
    float hoof = step(0.7, hh) * (1. - smoothstep(0.1, 0.2, length(hf + (vec2(hbHash(hc + 1.3), hbHash(hc + 5.9)) - 0.5) * 0.5)));
    tint *= 1. - 0.45 * hoof * road * nearA * (1. - smoothstep(2.2, 4.6, ad));
    tint *= 1. + 0.1 * road * (1. - smoothstep(0.2, 0.9, ad));
    tint *= 1. - 0.24 * road * (1. - inLane) * smoothstep(5.6, 7.6, ad) * (0.4 + 0.6 * hbN2(w.xz * 0.6 + 3.));
    // open ground: plough furrows in the bare plots, wind ripples near the eye, long sand streaks out to 200 m
    float open_ = flat_ * (1. - step(abs(w.x), 290.) * step(abs(w.z), 218.)) * (1. - road);
    float plots_ = (step(232., w.z) * step(w.z, 500.) * step(abs(w.x), 436.) + step(w.x, -304.) * step(-436., w.x) * step(26., w.z) * step(w.z, 232.)) * open_;
    tint *= 1. + 0.14 * (smoothstep(0.25, 0.45, abs(fract(w.x / 0.9) - 0.5)) - 0.5) * plots_ * (1. - green) * nearB * clamp(1.5 - fwidth(w.x) * 2.2, 0., 1.);
    tint *= 1. + 0.08 * sin((w.x * 0.94 + w.z * 0.34) * 5.2 + 5. * hbN2(w.xz * 0.21)) * nearA * open_ * (1. - plots_);
    tint *= 1. + 0.07 * sin((w.x * 0.94 + w.z * 0.34) * 0.8 + 6. * hbN2(w.xz * 0.035)) * (1. - smoothstep(110., 200., dC)) * open_ * (1. - plots_);
    // the wadi floor away from the town: braided dry washes running to the riverbed, and three trodden roads from the east and west walls to the cliffs
    { float far_ = open_ * (1. - plots_) * step(w.y, 8.) * (1. - (1. - smoothstep(300., 340., abs(w.x))) * (1. - smoothstep(228., 262., abs(w.z))))
        * (1. - smoothstep(-640., -610., w.z) * (1. - smoothstep(-300., -270., w.z))) * (1. - step(w.x, -322.) * step(-432., w.x) * step(-114., w.z) * step(w.z, -4.));
      vec2 wq = vec2(w.x * 0.033 + 4.8 * hbN2(w.xz * vec2(0.012, 0.004)), w.z * 0.0105 + 0.9 * hbN2(w.xz * 0.006 + 4.));
      float wr = abs(hbN2(wq) - 0.5) * 2., chan = 1. - smoothstep(0.04, 0.22, wr), bank = smoothstep(0.2, 0.3, wr) * (1. - smoothstep(0.3, 0.5, wr));
      tint *= 1. + far_ * (0.42 * chan - 0.2 * bank + 0.2 * (hbN2(w.xz * 0.02 + 11.) - 0.5));
      vec2 rp = w.xz + 9. * (vec2(hbN2(w.xz * 0.013), hbN2(w.xz * 0.013 + 7.3)) - 0.5);
      float rdd = min(min(hbSeg(rp, vec2(-288., 8.), vec2(-455., 18.)), hbSeg(rp, vec2(-455., 18.), vec2(-560., 510.))), min(hbSeg(rp, vec2(-288., -60.), vec2(-470., -250.)), hbSeg(rp, vec2(-470., -250.), vec2(-600., -800.))));
      rdd = min(rdd, min(hbSeg(rp, vec2(288., 20.), vec2(470., 30.)), hbSeg(rp, vec2(470., 30.), vec2(600., 510.))));
      float troad = (1. - smoothstep(2.2, 4.2, rdd)) * flat_;
      tint *= 1. + 0.26 * troad - 0.1 * (1. - smoothstep(4.2, 8., rdd)) * (1. - troad) * flat_; }
    // the riverbed: cobbles in braided bars
    float bed = smoothstep(-606., -570., w.z) * (1. - smoothstep(-318., -290., w.z));
    vec2 rw = vec2(w.x * 0.8 + w.z * 0.6, -w.x * 0.6 + w.z * 0.8) * 1.07 + 3. * hbN2(w.xz * 0.07);   // a turned, bent lattice: no rows
    vec2 cc = floor(rw), cf = fract(rw) - 0.5; float ch = hbHash(cc + 41.), cr = 0.08 + 0.2 * fract(ch * 7.3);
    float cob = step(0.5, ch) * (1. - smoothstep(cr * 0.55, cr, length(cf + (vec2(hbHash(cc + 2.2), hbHash(cc + 8.4)) - 0.5) * 0.42)));
    tint *= 1. + bed * flat_ * nearB * cob * (fract(ch * 3.7) - 0.42) * 0.7;
    tint *= 1. + bed * 0.22 * (hbN2(vec2(w.x * 0.02 + 2. * hbN2(w.xz * vec2(0.006, 0.02)), w.z * 0.11)) - 0.5);
    // sand snakes running west along the ground once the gust is up
    float fl = hbN2(vec2(w.z * 0.42, (w.x + uHbTime * 19.) * 0.05)) * hbN2(vec2(w.z * 0.13 + 4., (w.x + uHbTime * 12.) * 0.02));
    tint *= 1. + vec3(0.7, 0.62, 0.5) * clamp(fl * fl * 3.2, 0., 0.85) * mix(0.25 * open_ * (1. - plots_), 1., uHbGust) * flat_ * (1. - 0.6 * hbT);   // a few already run over the plain in the calm
    { float under = hbS * uHbGust * flat_ * (1. - step(abs(w.x), 290.) * step(abs(w.z), 218.));     // under the storm's shadow the open ground is no flat dark plane: pale sand runs over it in long snakes and drifts
      float sn = clamp(fl * fl * 3.2, 0., 0.85);                                                     // (in the arrival the shadow is dark again and the sand runs over it in thin bright threads)
      reflectedLight.indirectDiffuse *= 1. + under * (0.5 * (1. - uHbNear) + mix(2.6 * sn, 3.6 * sn * sn, uHbNear) + mix(1.0, 0.45, uHbNear) * (hbN2(vec2(w.z * 0.045, (w.x + uHbTime * 9.) * 0.011)) - 0.5)); }
    // heat shimmer: a trembling pale mirage low on the far flats while the air is still
    float vy = (cameraPosition.y - w.y) / max(dC, 1.);
    float mir = (1. - smoothstep(0.012, 0.045, vy)) * smoothstep(90., 260., dC) * flat_ * (1. - uHbGust) * (1. - hbS) * step(w.y, 12.);
    mir *= 0.35 + 0.65 * hbN2(vec2(w.x * 0.06 + w.z * 0.05, w.z * 0.01 + uHbTime * 1.7));
    tint = mix(tint, tint * vec3(1.3, 1.5, 1.9), mir * 0.7);
    // under the palms the fronds let the sun through: the baked crown shadows are dappled, never solid
    { float grove = clamp(step(228., w.z) * step(w.z, 520.) + step(w.x, -304.) * step(-436., w.x) * step(26., w.z) * step(w.z, 232.), 0., 1.);
      vec2 dq = vec2(w.x * 0.8 + w.z * 0.6, w.z * 0.8 - w.x * 0.6);                                   // a turned lattice: the dapple shows no rows
      float dap = max(clamp(0.45 + 0.55 * (0.65 * hbN2(dq * 0.9 + vec2(uHbTime * 0.3, 0.)) + 0.35 * hbN2(dq.yx * 2.3 + 5.)), 0., 0.9), uDapMin);     // (a low sun's long bars of shade keep their strength)
      reflectedLight.directDiffuse *= mix(1., (1. - 0.88 * hbT * dap) / max(1. - 0.88 * hbT, 0.12), grove); }
    // under a low sun the ground takes most of its light from the sky, and a cast shadow would hardly show: outside the town the long shadows of palms, walls and towers are deepened
    reflectedLight.indirectDiffuse *= 1. - uShadeAmb * hbT * (1. - hbS) * flat_ * (1. - step(abs(w.x), 290.) * step(abs(w.z), 218.));
    { float gs = hbGate(w) * (1. - hbT) * (1. - hbS);                                                 // the gatehouse's shadow lies across the street inside the gate, crenellated, with the sun through the arch beside it
      reflectedLight.directDiffuse *= 1. - 0.88 * gs;
      reflectedLight.indirectDiffuse = reflectedLight.indirectDiffuse * mix(vec3(1.), vec3(0.8, 0.94, 1.22), gs) + diffuseColor.rgb * uHbBounce * gs; }
    // from the rim and the groves the lanes between the towers are dark slots, not more pale ground: the town reads as towers, not as a board
    reflectedLight.indirectDiffuse *= 1. - 0.55 * hbT * (1. - hbS) * step(abs(w.x), 290.) * step(abs(w.z), 218.) * smoothstep(70., 260., dC);
    tint *= 1. + 0.8 * uHbSpot.w * (1. - smoothstep(uHbSpot.z * 0.45, uHbSpot.z, distance(hbP.xz, uHbSpot.xy)));      // the rare shaft's pool of sun
    // the last pool of clean sun, round the portal
    tint *= mix(vec3(1.), vec3(1.42, 1.28, 1.02), (1. - smoothstep(10., 45., distance(w.xz, vec2(-110., -440.)))) * (1. - hbS));
    reflectedLight.directDiffuse *= tint * (1. + uGndLift * flat_ * (1. - smoothstep(-262., -206., w.z))); reflectedLight.indirectDiffuse *= tint; }
`;

const curveFn = (pts) => (u) => {
  if (u <= pts[0][0]) return pts[0][1];
  for (let i = 1; i < pts.length; i++) if (u <= pts[i][0]) { const a = pts[i - 1], b = pts[i]; return a[1] + (b[1] - a[1]) * (u - a[0]) / Math.max(1e-6, b[0] - a[0]); }
  return pts[pts.length - 1][1];
};
// lane centre line (world x at world z), the hero's dog-leg
const laneX = (z) => -10 * (1 - sstep(97, 123, z));

export default {
  id: 'mud-tower-haboob',
  name: 'The Wall of Dust',
  category: 'city',
  weirdness: 0.1,
  media: ['air', 'open'],
  async build(ctx) {
    const rng = ctx.rng, N = ctx.noise, vary = ctx.vary || {}, detail = ctx.quality?.detail ?? 1;
    const dens = Math.min(1.3, Math.max(0.7, vary.density ?? 1));
    const scene = new THREE.Scene();
    const v0 = new THREE.Vector3(), v1 = new THREE.Vector3(), v2 = new THREE.Vector3();

    // ---- which visit is this ----
    const vr = rng.fork('visit'), hp = vr(), cv = vr(), wr = vr(), sr = vr(), dv = vr(), wd = vr();
    let lookName = hp < 0.5 ? 'noon' : hp < 0.76 ? 'afternoon' : 'dawn';
    if (vary.hour === 'day') lookName = 'noon'; else if (vary.hour === 'golden') lookName = 'afternoon'; else if (vary.hour === 'dawn' || vary.hour === 'night') lookName = 'dawn';
    const rare = !!vary.rare;
    if (rare && lookName === 'afternoon') lookName = hp < 0.63 ? 'noon' : 'dawn';     // the rent in the wall needs a look with a storm shadow to open
    const look = LOOKS[lookName];
    const weather = wr < 0.58 ? 'dry' : wr < 0.8 ? 'thin' : 'wet';
    const season = sr < 0.45 ? 'green' : sr < 0.75 ? 'harvest' : 'summer';
    const cast = { doves: dv < 0.25, wedding: wd < 0.22, caravan: cv < 0.25 };
    const xr = (label) => ctx.core.makeRng('haboob-extra:' + label + ':' + ctx.seed);   // later additions draw from their own streams: the shared one is left as it was
    let wallColors = look.wall;
    if (weather === 'thin' && lookName !== 'dawn') wallColors = { dark: '#48321f', mid: '#7a5833', tan: '#cdb07a', ochre: '#f4d890', dust: '#96805a' };   // a veil with a dark core and a pale burning crest
    else if (weather === 'wet' && !wallColors) wallColors = { dark: '#231a18', mid: '#4a362a', tan: '#8f7256', ochre: '#c98a48', dust: '#4a382c' };

    // ---- the flight ----
    // The entry heads 36 degrees east of north: the town sits left of centre in the first view and the front stands in its right third. The stoop keeps its 50 degree
    // slant under the lip, then eases to a 30 degree glide that rises out of the cleft over the palm crowns: the gaze can be level
    // (town, groves and the wall of dust in one frame) instead of looking into the slope. The cleft itself is still cut along the
    // old, lower line (bedLine), so it stays the notch the town is seen in.
    const KN_HEAD = [[-192, 311, 801], [-178, 308.6, 782], [-152.5, 303, 755], [-146.5, 293, 735], [-143, 276, 715], [-137.5, 246, 689], [-125, 190, 648]];   // off the rim prow, tipping over the lip
    const KN_FLY = KN_HEAD.map((k, i) => (i === 0 ? [k[0], k[1] + 3, k[2]] : i === 1 ? [k[0], k[1] + 2.4, k[2]] : k));   // the entry is flown 3 m higher than the line the rim is cut along: the whole watchtower stands inside the portal's opening
    const path = makePath([
      ...KN_FLY, [-108, 137, 612], [-82, 80, 571], [-56, 40, 526],                                              // the stoop, deep in the notch: its banded shoulders stand above the eye on both sides
      [-33, 24, 474], [-17.5, 16, 420], [-7, 9.5, 360], [-1.5, 5.8, 304], [0, 5, 250],                           // gliding out over the groves, down to the track
      [0, 5, 205], [0, 5, 160], [0, 5, 128], [-5, 5, 110], [-9.7, 5, 94], [-10, 5, 80], [-10, 5, 60], [-10, 5.4, 34],          // gate, lane, square, lane
      [-10, 9.5, 14], [-10, 20, -8], [-10.5, 33.5, -32], [-12, 44.5, -56],                                          // the climb over the low house
      [-19, 58, -86], [-30, 57, -120], [-45, 54, -160], [-66, 45.5, -196],                                      // the roof run
      [-88, 35.5, -228], [-103, 26, -258], [-109, 17.5, -290], [-110, 11.8, -325], [-110, 9.4, -362], [-110, 9, -402], [-110, 9, -440],   // over the north wall, north by z = -290, to the portal
    ]);
    const duration = 44;
    const uAtZ = (z0) => { for (let i = 0; i <= 2000; i++) { path.pointAt(i / 2000, v0); if (v0.z <= z0) return i / 2000; } return 1; };
    const uRim = uAtZ(756), uCleft = uAtZ(512);
    await ctx.yield();
    const uGate = uAtZ(210), uSquare = uAtZ(110);
    await ctx.yield();
    const uLaneEnd = uAtZ(26), uTop = uAtZ(-56);
    await ctx.yield();
    const uWall = uAtZ(-210), uLevel = uAtZ(-380);
    await ctx.yield();
    // the cleft's bed and the track as a table over z (z falls monotonically there): the line the ground is cut along, 1 m or less from the flight in plan
    const ZT0 = 200, NTAB = 312, tabX = new Float32Array(NTAB), tabY = new Float32Array(NTAB).fill(-1);
    const bedLine = makePath([...KN_HEAD, [-106, 132, 608], [-82, 76, 571], [-62, 38, 541], [-46, 21, 512], [-30, 13, 470], [-16, 8.5, 415], [-6, 6, 355], [-1, 5, 300], [0, 5, 250], [0, 5, 205], [0, 5, 160], [0, 5, 128]]);
    let uBedEnd = 1; for (let i = 0; i <= 2000; i++) { bedLine.pointAt(i / 2000, v0); if (v0.z <= 196) { uBedEnd = i / 2000; break; } }
    await ctx.yield();
    for (let i = 0; i <= 3000; i++) {
      bedLine.pointAt(uBedEnd * i / 3000, v0);
      const k = Math.round((v0.z - ZT0) / 2); if (k >= 0 && k < NTAB) { tabX[k] = v0.x; tabY[k] = v0.y; }
    }
    for (let k = 1; k < NTAB; k++) if (tabY[k] < 0) { tabX[k] = tabX[k - 1]; tabY[k] = tabY[k - 1]; }
    if (tabY[0] < 0) { tabX[0] = tabX[1]; tabY[0] = tabY[1]; }
    await ctx.yield();
    const pxz = [0, 0];
    const pathXY = (z) => { const f = Math.min(NTAB - 1.001, Math.max(0, (z - ZT0) / 2)), i = Math.floor(f), k = f - i; pxz[0] = mix(tabX[i], tabX[i + 1], k); pxz[1] = mix(tabY[i], tabY[i + 1], k); return pxz; };

    // ---- fields and groves south of the wall ----
    const FX0 = -432, FZ0 = 238, FW = 36, FD = 31, FNX = 24, FNZ = 8;
    const fieldType = new Int8Array(FNX * FNZ);                    // 0 alfalfa, 1 stubble, 2 fallow, 3 palm grove
    const frng = rng.fork('fields');
    for (let j = 0; j < FNZ; j++) for (let i = 0; i < FNX; i++) {
      const r = frng(), cx = FX0 + (i + 0.5) * FW, cz = FZ0 + (j + 0.5) * FD, nearTrack = Math.abs(cx - pathXY(cz)[0]) < 60;
      let t = r < 0.42 ? 3 : r < 0.74 ? 0 : r < 0.9 ? 1 : 2;
      if (nearTrack && cz > 380) t = 3; else if (nearTrack && cz < 300 && t === 3) t = 0;
      if (season === 'summer' && t === 0) t = r < 0.6 ? 1 : 2;
      fieldType[j * FNX + i] = t;
    }
    // The plots are not a board: the rows have unequal depths and their boundaries tilt, the cross walls of every row stand at
    // their own places, about a fifth of the plots are thrown together with their neighbour and a fifth are cut in two.
    const makePlots = (X0, Z0, W, D, NX, NZ, r, type) => {
      const rowOff = new Float32Array(NZ + 1), rowTilt = new Float32Array(NZ + 1), colOff = new Float32Array((NX + 1) * NZ);
      const merged = new Uint8Array(NX * NZ), split = new Int8Array(NX * NZ).fill(-1), val = new Float32Array(NX * NZ), xc = X0 + NX * W / 2;
      for (let j = 1; j <= NZ; j++) { rowOff[j] = r.range(-5, 5); rowTilt[j] = r.range(-5.5, 5.5) / (NX * W / 2); }
      for (let j = 0; j < NZ; j++) for (let i = 1; i < NX; i++) colOff[j * (NX + 1) + i] = r.range(-6, 6) + (j % 2 ? 7 : -7);
      const rowZ = (j, x) => Z0 + j * D + rowOff[j] + rowTilt[j] * (x - xc), colX = (j, i) => X0 + i * W + colOff[j * (NX + 1) + i];
      const G = { X0, Z0, W, D, NX, NZ, type, merged, split, val, rowZ, colX, sub: 0, edge: 9 };
      G.cell = (x, z) => {                                         // index of the plot at (x, z), or -1; G.sub = 1 in the cut-off north half
        if (x < X0 || x >= X0 + W * NX) return -1;
        let j = Math.max(0, Math.min(NZ - 1, Math.floor((z - Z0) / D)));
        if (z < rowZ(j, x)) j--; else if (z >= rowZ(j + 1, x)) j++;
        if (j < 0 || j >= NZ || z < rowZ(j, x) || z >= rowZ(j + 1, x)) return -1;
        let i = Math.max(0, Math.min(NX - 1, Math.floor((x - X0) / W)));
        if (x < colX(j, i)) i--; else if (x >= colX(j, i + 1)) i++;
        if (i < 0 || i >= NX) return -1;
        const k = j * NX + i;
        G.sub = split[k] >= 0 && z < (rowZ(j, x) + rowZ(j + 1, x)) / 2 ? 1 : 0;
        G.edge = merged[k] ? 9 : x - colX(j, i);
        return k;
      };
      return G;
    };
    const PL = makePlots(FX0, FZ0, FW, FD, FNX, FNZ, xr('plots'), fieldType);
    { const r = xr('plotmix');
      for (let j = 0; j < FNZ; j++) for (let i = 0; i < FNX; i++) {
        const k = j * FNX + i, cx = FX0 + (i + 0.5) * FW, cz = FZ0 + (j + 0.5) * FD, nearTrack = Math.abs(cx - pathXY(cz)[0]) < 80, q = r(), q2 = r(), q3 = r();
        PL.val[k] = 0.8 + 0.4 * q3;
        if (nearTrack) continue;
        if (q < 0.22 && i > 0 && !PL.merged[k - 1]) { PL.merged[k] = 1; fieldType[k] = fieldType[k - 1]; PL.val[k] = PL.val[k - 1]; }
        else if (q > 0.8) PL.split[k] = season === 'summer' ? 1 + Math.floor(q2 * 2) : Math.floor(q2 * 3) === fieldType[k] ? (fieldType[k] + 1) % 3 : Math.floor(q2 * 3);
      } }
    // a second band of walled plots outside the west wall
    const WNX = 3, WNZ = 6, westType = new Int8Array(WNX * WNZ);
    const PW = makePlots(-432, 30, 42, 34, WNX, WNZ, xr('westplots'), westType);
    { const r = xr('westmix');
      for (let k = 0; k < WNX * WNZ; k++) { const q = r(), q2 = r(); westType[k] = q < 0.5 ? 3 : q < 0.72 ? (season === 'summer' ? 1 : 0) : q < 0.88 ? 1 : 2; PW.val[k] = 0.8 + 0.4 * q2; } }
    let fVal = 1, fEdge = 9;                                       // set by fieldAt: the plot's own brightness, metres from its west wall
    const fieldAt = (x, z) => {
      let G = PL, k = -1;
      if (z >= FZ0 - 12) { if (Math.abs(x - pathXY(z)[0]) < 8.5) return -1; k = PL.cell(x, z); }
      if (k < 0 && x < -304) { G = PW; k = PW.cell(x, z); }
      if (k < 0) return -1;
      fVal = G.val[k] * (G.sub ? 0.9 : 1); fEdge = G.edge;
      return G.sub ? G.split[k] : G.type[k];
    };
    // the outlying quarter on the caravan track north of the wall: plots for the hero's extra towers (world metres). A cross street
    // is left at z -341 to -375 for the herds, and the last 30 m before the portal stay open.
    const quarter = [];
    { const r = xr('quarter');
      const plot = (x, z, hLo, hHi) => quarter.push({ x: x + r.range(-1.5, 1.5), z: z + r.range(-1.2, 1.2), hx: r.range(6, 7), hz: r.range(6, 6.6), h: r.range(hLo, hHi),
        seed: r(), variant: r.int(0, 2), tint: r(), white: r.chance(0.6) ? 1 : (r.chance(0.6) ? 0.35 : 2), warm: r(), cloth: r() });
      for (const sd of [1, -1]) {
        const zs = [-272, -291, -310, -329, -386, -402];
        for (let i = 0; i < zs.length; i++) plot(-110 + sd * (28.5 + (sd > 0 && i < 2 ? 1.5 : 0)), zs[i] + (sd < 0 ? -2 : 0), i > 3 ? 19 : 21, i > 3 ? 23 : 28);
        for (const [dx, z] of [[49, -281], [51, -318], [48, -393], [68, -300]]) plot(-110 + sd * dx, z + (sd < 0 ? 3 : 0), 27, 34);
      } }
    const qLow = [];                                              // low houses that join the towers of the inner rows into street fronts
    for (let i = 0; i < quarter.length; i++) for (let j = 0; j < quarter.length; j++) {
      const a = quarter[i], b = quarter[j];
      if (Math.abs(a.x - b.x) > 5 || a.z <= b.z || a.z - b.z > 24) continue;
      const z0 = b.z + b.hz - 0.3, z1 = a.z - a.hz + 0.3, sd = a.x > -110 ? 1 : -1, x0 = (a.x + b.x) / 2;
      if (z1 - z0 > 1.5) qLow.push({ x: x0 + sd * 0.8, z: (z0 + z1) / 2, hx: Math.min(a.hx, b.hx) - 0.6, hz: (z1 - z0) / 2, h: 5.2 + 3.6 * hash1(i * 7.3 + j) });
    }
    const inQuarter = (x, z, m = 0) => {
      for (const q of quarter) if (Math.abs(x - q.x) < q.hx + m && Math.abs(z - q.z) < q.hz + m) return true;
      for (const q of qLow) if (Math.abs(x - q.x) < q.hx + m && Math.abs(z - q.z) < q.hz + m) return true;
      return false; };

    // ---- the land: wadi floor, two terraced cliffs, the spur and its cleft, mesas down-canyon ----
    const stepF = T.stepper({ step: 15, sharp: 0.85, slope: 0.2 }), stepN = T.stepper({ step: 60, sharp: 0.55, slope: 0.3 }), benchF = T.stepper({ step: 7, sharp: 0.7, slope: 0.3 });
    const mesas = [];
    { const mr = rng.fork('mesas');
      for (let i = 0; i < 7; i++) { const mx = i < 5 ? 860 + i * 300 + mr.range(-70, 70) : -800 - (i - 5) * 360, mz = mr.range(-540, 380);
        mesas.push([mx, i < 5 ? mz : 60 + (mz + 540) / 920 * 320, mr.range(80, 150), mr.range(110, 230)]); } }
    // The cleft's two shoulders: between z 512 and 688 its walls stand steep, 40 m above the bed on the west and 30 m on the east, 14 to 20 m
    // either side of the line, so banded rock streaks past both edges of the frame in the stoop and the town is seen in the notch.
    const shoulderK = (z) => sstep(512, 548, z) * (1 - sstep(648, 688, z));
    // Round sixteen: the stoop is flown down an open face. East of the line (the side the gaze swings to) the cliff is laid back into a
    // wide benched bay between z 548 and 742: its floor rises 9 m in 84 m and only then climbs to the cliff, so nothing stands above the
    // eye there; the west shoulder between z 512 and 640 is a low bench (never cut below 36 m: the terraces at the mouth stand as they
    // did). bayOn: the land is first built as it was and brought down at the end of build, see "the bay" below.
    let bayOn = false;
    const openE = (z) => sstep(548, 586, z) * (1 - sstep(700, 742, z)), openW = (z) => sstep(512, 540, z) * (1 - sstep(606, 640, z));
    const cleftWall = (e, east, K, z, bed) => {
      if (east) { const o = bayOn ? openE(z) : 0, wd = 84 * o; return 0.11 * Math.min(e, wd) + mix(0.8 + 1.9 * K, 1.25, o) * Math.max(0, e - wd); }
      const w = (1.3 * Math.min(e, 7) + 1.1 * Math.max(0, e - 7)) * (1 + 1.7 * K), o = bayOn ? openW(z) : 0;
      return o > 0 ? mix(w, Math.min(w, Math.max(5 + 0.22 * Math.min(e, 60) + 1.6 * Math.max(0, e - 60), 36 - bed)), o) : w;
    };
    const cliffProfile = (t) => 300 * (0.15 * sstep(-0.28, 0.24, t) + 0.85 * Math.pow(sstep(0.1, 1.0, t), 0.85));
    const height = (x, z) => {
      const town = Math.max(Math.abs(x) - 300, Math.abs(z) - 230), fl = sstep(0, 60, town);
      const qf = z < -226 && z > -470 ? (1 - sstep(78, 118, Math.abs(x + 110))) * sstep(-470, -446, z) * (1 - sstep(-250, -226, z)) : 0;   // the firm spit the outlying quarter stands on
      // (the noise is only asked for where it can matter: not under the town, and the two cliffs only within reach of their feet)
      let h = fl > 0 ? fl * (0.55 * N.fbm2(x * 0.006, z * 0.006, 3) + 0.14 * N.n2(x * 0.05, z * 0.05)) * (1 - 0.9 * qf) + 0.12 * qf : 0.12 * qf;
      const bedK = fl * sstep(-600, -548, z) * (1 - sstep(-322, -286, z)) * (1 - qf);
      if (bedK > 0) h += bedK * (-2.1 + 1.6 * N.ridged2(x * 0.007 + 0.25 * N.n2(x * 0.004, z * 0.01), z * 0.03) + 0.12 * N.n2(x * 0.21, z * 0.33));   // the dry riverbed: braided gravel bars
      const ts = z > 380 ? (z - 520 - (38 * N.n2(x * 0.0017, 3.1) + 13 * N.n2(x * 0.0065, 7.7)) * sstep(120, 330, Math.abs(x + 105))) / 210 : -1;
      if (ts > -0.3) {
        let c = cliffProfile(ts);
        c += sstep(1.0, 1.5, ts) * (7 + 11 * N.fbm2(x * 0.003, z * 0.003, 3)) * sstep(35, 140, Math.abs(x + 150));
        h += mix(c, stepF(c), 0.75);
      }
      const tn = z < -620 ? (-800 - 30 * N.n2(x * 0.0019, 9.4) - 5 * N.n2(x * 0.007, 2.2) - z) / 200 : -1;
      if (tn > -0.55) {
        let c = cliffProfile(tn); c += sstep(1.0, 1.5, tn) * (8 + 12 * N.fbm2(x * 0.003, z * 0.003, 3));
        const fan = Math.max(0, N.n2(x * 0.0085, 5.5)) * 46 * sstep(-0.55, 0.02, tn) * (1 - sstep(0.02, 0.4, tn));       // talus fans at the foot
        h += Math.max(mix(c, stepN(c), 0.6), fan);
      }
      for (let i = 0; i < mesas.length; i++) {
        const m = mesas[i], dx = x - m[0], dz = z - m[1], d2 = dx * dx + dz * dz, R = m[2] * 1.9;
        if (d2 < R * R) { const c = m[3] * sstep(R, m[2] * 0.55, Math.sqrt(d2) + 26 * N.n2(x * 0.008, z * 0.008)); h += mix(c, stepF(c), 0.8); }
      }
      if (z > 470 && z < 800 && x > -420 && x < 220) {
        const p = pathXY(z), d = Math.abs(x - p[0]);
        const bed = p[1] - 8.5 - 1.6 * Math.abs(N.n2(z * 0.07, 1.7));
        const east = x > p[0], K = shoulderK(z);
        let want = Math.min(300, bed + 30 + (east ? 0 : 12) * K + 6 * N.n2(x * 0.011, z * 0.011)); want = mix(want, stepF(want), 0.85 - 0.5 * K);
        if (want > h) h = mix(h, want, sstep(125, 45, d) * sstep(486, 545, z));                       // the spur the cleft is cut into
        const e = Math.max(0, d - 5.5 - 3 * K);
        let wall = cleftWall(e, east, K, z, bed); wall = Math.max(0, mix(wall, benchF(wall), 0.55));
        const cut = bed + wall;
        if (cut < h) h = cut;                                                                        // the cleft itself
        if (z > 660 && z < 792) {                                                                    // the bay under the lip: nothing stands between the entry and the town
          const t = 800 - z, sx = p[0], lat = Math.max(0, Math.abs(x - sx) - (9 + 0.4 * t));
          let cap = 309.5 - 0.56 * t + lat * (0.95 + 0.25 * N.n2(x * 0.02, z * 0.02)) + 1.2 * N.n2(x * 0.03, z * 0.03) * sstep(18, 40, t);
          cap = mix(cap, benchF(cap), 0.8 * sstep(20, 44, t));
          if (cap < h) h = mix(h, cap, sstep(660, 690, z));
        }
      }
      return h;
    };
    const cTown = L('#c9aa80', 0.6), cFloor = L('#d8c29c', 0.6), cGravel = L('#efe6d2', 0.7), cTrack = L('#e0cca6', 0.62), cRock = L('#b3946e', 0.72), cRockB = L('#cfb48c', 0.72),
      cTop = L('#c7a57a', 0.66), cAlfalfa = L('#6f7f45', 0.7), cStubble = L('#c9a860', 0.62), cFallow = L('#a07c54', 0.62), cWet = L('#5e4a34', 0.6), cGrove = L('#a08258', 0.62), cRut = L('#b79c78', 0.6), cBar = L('#fbf6ea', 0.78), cWash = L('#ead9b8', 0.7);
    const lerp3 = (o, c, k) => { o.r += (c[0] - o.r) * k; o.g += (c[1] - o.g) * k; o.b += (c[2] - o.b) * k; };
    const groundColor = (x, z, h, ny, out) => {
      const n = 0.5 + 0.5 * N.n2(x * 0.021, z * 0.021), n2 = 0.5 + 0.5 * N.n2(x * 0.13, z * 0.13);
      out.setRGB(cFloor[0], cFloor[1], cFloor[2]);
      const town = Math.max(Math.abs(x) - 290, Math.abs(z) - 220);
      lerp3(out, cTown, 1 - sstep(-6, 22, town));
      const bed = sstep(-610, -560, z) * (1 - sstep(-300, -232, z));
      if (bed > 0) { const br = 0.5 + 0.5 * N.n2(x * 0.0035 + 0.4 * N.n2(x * 0.011, z * 0.02), z * 0.034);
        lerp3(out, cGravel, bed * (0.85 + 0.15 * n2)); lerp3(out, cRut, bed * sstep(0.6, 0.74, br) * 0.6); lerp3(out, cBar, bed * (1 - sstep(0.25, 0.45, br)) * 0.8); }
      if (z < -226 && z > -640) lerp3(out, cBar, (1 - sstep(1.6, 4.2, Math.abs(x + 110 - 2.5 * Math.sin((z + 440) * 0.02)))) * 0.5);   // the caravan track: trodden paler than the gravel
      if (z < -226 && z > -470) lerp3(out, cTown, 0.55 * (1 - sstep(60, 100, Math.abs(x + 110))) * sstep(-470, -446, z) * (1 - sstep(4, 9, Math.abs(x + 110 - 2.5 * Math.sin((z + 440) * 0.02)))));   // trodden earth between the houses of the quarter
      const f = fieldAt(x, z);
      if (f >= 0) { lerp3(out, f === 0 ? cAlfalfa : f === 1 ? cStubble : f === 2 ? cFallow : cGrove, 0.92);
        if (f === 0 && fEdge < 2.6) lerp3(out, cWet, 0.7);            // wet dark soil along the runnel at the plot's west wall
        const fv = f === 3 ? 0.5 + 0.5 * fVal : fVal; out.r *= fv; out.g *= fv; out.b *= fv; }
      else if (z > 215 && z < 520) lerp3(out, cTrack, 1 - sstep(6, 9.5, Math.abs(x - pathXY(z)[0])));
      const k = 0.78 + 0.3 * n + 0.14 * (n2 - 0.5);
      out.r *= k; out.g *= k; out.b *= k;
      const rock = Math.max(sstep(5, 16, h), sstep(0.9, 0.72, ny));
      if (rock > 0) { lerp3(out, cRock, rock); lerp3(out, cRockB, rock * n); if (h > 285 && ny > 0.9) lerp3(out, cTop, 0.7 * n2); }
      if (z > 486 && z < 760) { const pp = pathXY(z); lerp3(out, cWash, (1 - sstep(2.5, 8, Math.abs(x - pp[0]))) * sstep(4, 12, pp[1] - h) * 0.8); }   // pale wash down the cleft bed
      return out;
    };
    await ctx.yield();

    // ---- sky, light, haze ----
    const sunW = skyDirection(look.el, look.az).clone();
    const skyA = makeSky({ rng, ...look.skyA, sunElevation: look.el, sunAzimuth: look.az });
    await ctx.yield();
    const skyB = makeSky({ rng, ...look.skyB, sunElevation: look.el, sunAzimuth: look.az });
    skyB.material.transparent = true;                           // the dome is faded with setOpacity: it must be in the transparent pass from the start, or three.js draws it with no blending and it cuts in at full strength
    skyB.setOpacity(0);
    await ctx.yield();
    scene.add(skyA.object, skyB.object);
    const fogA = new THREE.Color(look.fogA), fogB = new THREE.Color(wallColors?.dust || look.fogB).lerp(new THREE.Color(look.fogB), 0.6);
    scene.fog = new THREE.FogExp2(fogA.clone(), look.density * (weather === 'thin' ? 0.85 : 1));
    const rig = makeLightRig(skyA, { bounce: 0.55, follow: false });     // follow would reset the engine's portal camera (kit rig calls getWorldDirection)
    const sunL = skyDirection(Math.max(look.el, look.skyA.lightElevationMin || 0), look.az).clone();   // where the key light really stands
    scene.add(rig.object);
    await ctx.yield();

    // ---- the hero: front, shadow line, towers, kites ----
    const frontX = curveFn([[0, 1600], [0.1, 1450], [uCleft, 1150], [uGate, 1000], [uTop, 350], [uWall, 230], [1, 95]]);     // the front already towers behind the town's east end from the rim, and comes on to the track: its shadow reaches the east row of the quarter as we cross
    const uGust0 = uSquare - 0.035, uGust1 = uGust0 + 0.06, uTear0 = uLaneEnd - 0.01;
    const hero = await buildHero(ctx, {
      palette: HERO_PALETTE, ground: false, kites: 40, wallColors, thin: weather === 'thin' ? 1 : 0, progress: 0, bake: false, gild: weather === 'wet' ? 0.7 : weather === 'thin' ? 1.0 : 0.9, gildLow: lookName === 'dawn' ? 0.5 : 0,
      sunDir: [sunW.z, sunW.y, -sunW.x], sunColor: look.skyA.lightColor, bounce: look.bounceA[1],
      frontX, gust: (u) => sstep(uGust0, uGust1, u), tearX: (u) => 300 - 600 * (u - uTear0) / 0.3,
      extraTowers: quarter.map((q) => ({ x: q.z, z: -q.x, w: q.hz * 2, d: q.hx * 2, h: q.h, seed: q.seed, variant: q.variant, tint: q.tint, white: q.white, warm: q.warm, cloth: q.cloth })),
      // round sixteen: four kites on their strings close beside the flight as the wall arrives, east of the track, against the dark face. [u, metres east, up, along z (north is minus) of the track there, size, paper]
      kitesAt: [[0.745, 20, 18, -48, 5.0, 2], [0.745, 36, 9, -40, 4.6, 0], [0.79, 19, 11, -45, 4.8, 1], [0.79, 31, 11, -42, 4.8, 2]].map(([ku, e, up, n, size, col]) => { path.pointAt(ku, v0); return { x: v0.z + n, y: v0.y + up, z: -(v0.x + e), size, col }; }),
    });
    hero.object.rotation.y = -Math.PI / 2;
    hero.object.updateMatrixWorld(true);
    scene.add(hero.object);
    hero.setWallLit(look.wallLit); hero.setLamps(look.lamps);
    if (rare) hero.uniforms.uHbUmber.value.setRGB(1.35, 1.32, 1.36);   // the whole town goes under the shadow: keep the roofs readable for the spot to sweep
    const HU = hero.uniforms;
    await ctx.yield();

    const strata = T.makeStrata({ rng: rng.fork('strata'), rock: '#b3946e', rockB: '#dcc29c', accent: '#96724c', beds: 18, thickness: 8, base: 0, contrast: 1.0 });
    const lodPts = []; for (let i = 0; i <= 260; i++) { path.pointAt(i / 260, v0); lodPts.push(v0.x, v0.z); }
    const lodFocus = (x, z) => {
      let d2 = 1e18; for (let i = 0; i < lodPts.length; i += 2) { const dx = lodPts[i] - x, dz = lodPts[i + 1] - z, d = dx * dx + dz * dz; if (d < d2) d2 = d; }
      return Math.min(Math.sqrt(d2), 190 + Math.hypot(Math.max(-760 - x, 0, x - 480), Math.max(-1010 - z, 0, z + 800)));
    };
    const terrain = await T.makeTerrainAsync({
      rng: rng.fork('terrain'), noise: N, path, focus: lodFocus, corridor: false, height, color: groundColor, bounds: [-1500, -1350, 2700, 1150],
      cell: 4, near: 34, levels: 5, maxTriangles: Math.round(52000 * (0.7 + 0.3 * detail)), biome: 'canyon', strata, sunDir: skyDirection(Math.max(look.el, 28), look.az).clone(), shadow: 0.4, shadowSoftness: 0.6, skirt: 30,
      palette: { clouds: 0, drift: 0.16, wind: [-0.8, -0.6], rock: '#b3946e', rockB: '#cfb48c', patch: '#ecd9b6', patchAmount: 0.12, rockSlope: [0.5, 0.66], strataWarp: 0.4, varnish: 0, strata: 0.9, bedRelief: 0.25, joints: 0.1, bounceAmount: lookName === 'noon' ? 1.5 : 0.8, cracks: 0, pebbles: 0.08, detail: 0.2, streaks: 0, bump: 0.15 },
    }, ctx.yield, 2);
    { const trk = []; for (let i = 0; i < 17; i++) trk.push(pathXY(200 + i * 20)[0]);
      hero.patchMaterial(terrain.material, 'terrain', { uniforms: { uGateSun: { value: sunL.clone() }, uTrkX: { value: trk }, uGndLift: { value: lookName === 'afternoon' ? 0.7 : lookName === 'dawn' ? 0.6 : 0 }, uDapMin: { value: look.dapMin }, uShadeAmb: { value: look.shadeAmb } }, fragPars: GROUND_PARS, lit: GROUND_LIT }); }
    scene.add(terrain.object);
    const groundY = (x, z) => terrain.surfaceAt(x, z);
    await ctx.yield();
    // ---- the bay (round sixteen) ----
    // The land above is built exactly as it was, and everything scattered on it further down is placed as it was, so that no stone
    // elsewhere in the world moves. Here the new shape of the stoop's flanks is worked out: which vertices of the mesh come down and
    // how far (bayV; applied at the end of build, see bayApply) and a 4 m table of the drop (bayD), by which whatever stands there is
    // brought down with its ground (seatBay, bayDrop). bayS is the new surface on the same table, for the normals.
    const BX0 = -296, BZ0 = 506, BNX = 96, BNZ = 62, bayD = new Float32Array(BNX * BNZ), bayS = new Float32Array(BNX * BNZ), bayV = [];
    { const P = terrain.geometry.attributes.position.array, nv = P.length / 3;
      bayOn = true;
      for (let i = 0; i < nv; i++) {
        const x = P[i * 3], z = P[i * 3 + 2]; if (z < 510 || z > 746 || x < -292 || x > 80) continue;
        const hN = height(x, z); if (hN < P[i * 3 + 1] - 0.03) bayV.push(i, P[i * 3 + 1], hN);
      }
      bayOn = false;
      await ctx.yield();
      for (let k = 0; k < bayD.length >> 1; k++) bayD[k] = terrain.surfaceAt(BX0 + (k % BNX) * 4, BZ0 + Math.floor(k / BNX) * 4);
      await ctx.yield();
      for (let k = bayD.length >> 1; k < bayD.length; k++) bayD[k] = terrain.surfaceAt(BX0 + (k % BNX) * 4, BZ0 + Math.floor(k / BNX) * 4);
      await ctx.yield();
      for (let q = 0; q < bayV.length; q += 3) P[bayV[q] * 3 + 1] = bayV[q + 2];
      const bayRow = (k0, k1) => { for (let k = k0; k < k1; k++) { bayS[k] = terrain.surfaceAt(BX0 + (k % BNX) * 4, BZ0 + Math.floor(k / BNX) * 4); bayD[k] = Math.max(0, bayD[k] - bayS[k]); } };
      bayRow(0, bayD.length >> 1); await ctx.yield(); bayRow(bayD.length >> 1, bayD.length);
      for (let q = 0; q < bayV.length; q += 3) P[bayV[q] * 3 + 1] = bayV[q + 1];
    }
    const bayAt = (A, x, z) => {
      const fx = (x - BX0) / 4, fz = (z - BZ0) / 4; if (!(fx >= 0 && fz >= 0 && fx < BNX - 1 && fz < BNZ - 1)) return NaN;
      const i = Math.floor(fx), j = Math.floor(fz), u = fx - i, v = fz - j, k = j * BNX + i;
      return (A[k] * (1 - u) + A[k + 1] * u) * (1 - v) + (A[k + BNX] * (1 - u) + A[k + BNX + 1] * u) * v;
    };
    const bayDrop = (x, z) => bayAt(bayD, x, z) || 0;
    const seatBay = (set) => { for (let i = 0; i < set.count; i++) { const d = bayDrop(set.positions[i * 3], set.positions[i * 3 + 2]); if (d > 0.02) { set.positions[i * 3 + 1] -= d; set.matrices[i * 16 + 13] -= d; } } return set; };
    const bayApply = () => {
      const G = terrain.geometry, P = G.attributes.position.array, Nn = G.attributes.normal.array;
      for (let q = 0; q < bayV.length; q += 3) {
        const i3 = bayV[q] * 3, x = P[i3], z = P[i3 + 2]; P[i3 + 1] = bayV[q + 2];
        const xl = bayAt(bayS, x - 4, z), xr2 = bayAt(bayS, x + 4, z), zl = bayAt(bayS, x, z - 4), zr = bayAt(bayS, x, z + 4);
        if (xl === xl && xr2 === xr2 && zl === zl && zr === zr) { const gx = (xr2 - xl) / 8, gz = (zr - zl) / 8, l = 1 / Math.sqrt(gx * gx + gz * gz + 1); Nn[i3] = -gx * l; Nn[i3 + 1] = l; Nn[i3 + 2] = -gz * l; }
      }
      G.attributes.position.needsUpdate = true; G.attributes.normal.needsUpdate = true; bayOn = true;
    };
    await ctx.yield();

    // ---- kit geometry: everything small and built, merged per area into one lit material ----
    const KU = { uKTime: { value: 0 }, uKSlamZ: { value: 1e5 }, uKFold: { value: 0 }, uKRuffle: { value: 0.012 }, uKFlap: { value: 0 }, uKSnap: { value: 0 }, uKShow: { value: 0 }, uKWingX: { value: 0 }, uKLamp: { value: look.lamps / 1.6 }, uKBounce: { value: new THREE.Color(0.2, 0.19, 0.16) } };
    const kitMat = makeKitMaterial(KU);
    hero.patchMaterial(kitMat, 'kit');
    const cMud = L(MUD, 0.8), cMudD = L('#AE8A62', 0.8), cLime = L(PALETTE[0], 0.74), cWood = L('#6e4a2c'), cWoodL = L('#a67a4e'), cPot = L('#b0683c', 0.8),
      cRope = L('#8a7350'), cStone = L('#b39a78', 0.75), cDark = L('#120c08'), cBasket = L('#c9a25a', 0.8);
    const dyes = [L('#44589f'), L('#d9a548'), L('#b4463c'), L('#eee7d6', 0.8), L('#5a8a62'), L('#96587f'), L('#d6c29a', 0.8), L('#7a96b4'), L('#c98a5e')];
    const krng = rng.fork('kit');
    const cloths = [];                                          // [ax, ay, az, width, yaw, drop, kind, seed, colourA, colourB]
    const addCloth = (x, y, z, w, yaw, drop, kind, ca, cb, sd) => cloths.push([x, y, z, w, yaw, drop, kind, sd ?? krng(), ca, cb || L('#e9e2d0', 0.75)]);
    const shutters = [];                                        // [matrix, swing, seed, colour]
    const jar = (b, x, y, z, s = 1) => { b.surf(K.POT, 0, 1).col(krng.pick([cPot, L('#c98a54', 0.8), L('#8f5a36', 0.8)]), 0.7, 1.05);
      b.lathe(x, y, z, [[0.12 * s, 0], [0.3 * s, 0.24 * s], [0.34 * s, 0.5 * s], [0.22 * s, 0.76 * s], [0.12 * s, 0.86 * s], [0.17 * s, 0.93 * s]], 7); };
    const basket = (b, x, y, z, s = 1) => { b.surf(K.LATTICE, 0, 1).col(cBasket, 0.75, 1); b.lathe(x, y, z, [[0.22 * s, 0], [0.36 * s, 0.34 * s], [0.38 * s, 0.4 * s], [0, 0.36 * s]], 8); };
    // a mat of dates drying on the ground (in the builder's current frame, lying at y 0): a woven straw border, the fruit a darker
    // speckled brown, and on some a pair of low heaps
    const cStraw = L('#c8b078', 0.85), cDates = L('#a0572a', 0.72);
    const dateMat = (b, hw, hd, tone, heap) => {
      b.surf(K.POT, 0, 1).col(cStraw, 0.85, 1.02).box(-hw, 0, -hd, hw, 0.05, hd, { capM: 1 });
      b.surf(K.DATES, 0, 1).col([cDates[0] * tone, cDates[1] * tone, cDates[2] * tone], 0.92, 1).box(-hw + 0.15, 0.03, -hd + 0.15, hw - 0.15, 0.085, hd - 0.15, { capM: 1 });
      if (heap) for (const [hx, hz, hr] of [[-hw * 0.4, hd * 0.2, 0.5], [hw * 0.38, -hd * 0.25, 0.42]]) b.sphere(hx, 0.07, hz, hr, 7, 4, { sy: 0.5 });
    };
    const M4 = new THREE.Matrix4(), M4b = new THREE.Matrix4(), Q4 = new THREE.Quaternion(), YA = new THREE.Vector3(0, 1, 0), ONE = new THREE.Vector3(1, 1, 1);

    // the lane: every tower face on the 9 m street gets a door, lattice boxes, shuttered windows, beam ends, a bench and clutter
    const bLane = S.makeBuilder(16384), bTown = S.makeBuilder(16384);
    const towersW = hero.anchors.towers.filter((t) => !t.extra).map((t) => ({ x: -t.z, z: t.x, hx: t.d / 2, hz: t.w / 2, h: t.h, low: t.low }));
    const laneTowers = [];
    for (const t of towersW) {
      if (t.low || t.z < 20 || t.z > 212) continue;
      const lx = laneX(t.z), side = Math.sign(t.x - lx), face = t.x - side * t.hx;
      if (Math.abs(face - (lx + side * 4.5)) < 0.7) laneTowers.push({ ...t, side, face });
    }
    const doorSpots = [], upperRng = xr('upperwindows'); let nLaneT = 0;
    for (const t of laneTowers) {
      if (++nLaneT % 4 === 0) await ctx.yield();
      const ry = t.side > 0 ? -Math.PI / 2 : Math.PI / 2, half = t.hz - 0.9, b = bLane;
      const shutCol = krng.pick([L('#4a8f78'), L('#4a7cb4'), cWoodL, L('#96703e'), L('#8c9c4c')]);
      b.tr(t.face, 0, t.z, ry);
      const zb = (y) => -0.052 * y;                               // the battered wall plane in facade space
      const doorX = krng.range(-half + 1.6, half - 1.6), raised = krng.chance(0.35) ? krng.range(0.5, 0.9) : 0;
      t.doorX = doorX; t.bays = []; t.rugs = [];
      // door: lime surround, studded leaves, carved lintel, threshold or steps
      b.surf(K.LIME, 0, 1).col(cLime, 0.85, 1).box(doorX - 1.05, 0, -0.4, doorX + 1.05, 3.35 + raised, 0.1, { m: 1 });
      b.surf(K.WOOD, 0, 1).col(cWood, 0.9, 1.1).box(doorX - 0.74, 0.12 + raised, 0.1, doorX + 0.74, 2.7 + raised, 0.19, { m: 1 });
      b.surf(K.LATTICE, 0, 1).col(cWoodL).box(doorX - 0.9, 2.74 + raised, 0.08, doorX + 0.9, 3.14 + raised, 0.24, { m: 1 });
      b.surf(K.WOOD, 0, 0).col(cWoodL).box(doorX + 0.18, 1.2 + raised, 0.19, doorX + 0.52, 1.36 + raised, 0.3);
      b.surf(K.MUD, 0, 1).col(cMudD, 0.8, 1);
      if (raised) { const n = Math.ceil(raised / 0.26); for (let i = 0; i < n; i++) b.box(doorX - 1.2, 0, 0, doorX + 1.2, raised * (n - i) / n, 0.42 + 0.34 * i); }
      else b.box(doorX - 1.15, 0, 0, doorX + 1.15, 0.16, 0.6);
      if (krng.chance(0.6)) {                                    // striped awning on two poles over the door
        const ay = 3.75 + raised, w = krng.range(2.4, 3.2);
        v0.set(doorX, ay, 0.05 + zb(ay)).applyAxisAngle(YA, ry);
        addCloth(t.face + v0.x, ay, t.z + v0.z, w, t.side > 0 ? Math.PI / 2 : -Math.PI / 2, 1.1, 1, krng.pick(dyes), krng.pick([dyes[3], dyes[6], dyes[3]]));
        b.surf(K.WOOD, 0, 0).col(cWoodL);
        for (const sx of [-1, 1]) b.beam([doorX + sx * w * 0.48, 0, 1.0], [doorX + sx * w * 0.48, ay - 0.42, 1.02 + zb(ay)], 0.07);
      }
      // mud bench along the foot of the wall, with jars, baskets, bundles
      for (const sgn of [-1, 1]) {
        const x0 = sgn < 0 ? -half : doorX + 1.5, x1 = sgn < 0 ? doorX - 1.5 : half;
        if (x1 - x0 < 1.2) continue;
        b.surf(K.MUD, 0, 1).col(cMud, 0.75, 1).box(x0, 0, 0, x1, 0.46, 0.62);
        const n = Math.floor((x1 - x0) / 1.5);
        for (let i = 0; i < n; i++) {
          const px = x0 + 0.5 + i * 1.5 + krng.range(-0.2, 0.2), r = krng();
          if (r < 0.4) jar(b, px, 0.46, 0.3, krng.range(0.8, 1.25)); else if (r < 0.58) basket(b, px, 0.46, 0.3, krng.range(0.8, 1.2));
          else if (r < 0.72) { b.surf(K.POT, 0, 1).col(cRope, 0.7, 1); for (let q = 0; q < 5; q++) b.beam([px + q * 0.09 - 0.2, 0.46, 0.5], [px + q * 0.07 - 0.1 + krng.range(-0.1, 0.1), 3.4 + krng.range(-0.4, 0.3), 0.06 + zb(3.4)], 0.06); }   // palm ribs
        }
      }
      // shuttered windows at two levels, beam ends, projecting lattice boxes
      const nb = Math.max(2, Math.floor((2 * half) / 3.1));
      for (let i = 0; i < nb; i++) {
        const wx = -half + (i + 0.5) * (2 * half) / nb + krng.range(-0.25, 0.25);
        t.bays.push(wx);
        for (const y0 of [4.3, 12.2, 20]) {
          if (y0 > 5 && krng.chance(0.15)) continue;
          const zf = zb(y0 + 0.7);
          if (krng.chance(y0 < 5 ? 0.32 : 0.45)) {               // a mashrabiya instead of a plain window
            const bw = krng.range(0.75, 1.05), bh = krng.range(1.5, 2.0), out = krng.range(0.55, 0.78), boxCol = krng.pick([cWoodL, cWood, shutCol]);
            if (y0 < 5) {                                        // at the eye's own height the storey has windows only: a 2 m lattice box 3 m off fills the edge of the frame (the same draws are taken)
              b.surf(K.LIME, 0, 0).col(cLime, 0.9, 1);
              b.box(wx - 0.64, y0 - 0.1, zf - 0.3, wx - 0.47, y0 + 1.42, zf + 0.33, { bottom: false }); b.box(wx + 0.47, y0 - 0.1, zf - 0.3, wx + 0.64, y0 + 1.42, zf + 0.33, { bottom: false });
              b.box(wx - 0.47, y0 + 1.26, zf - 0.3, wx + 0.47, y0 + 1.42, zf + 0.33, { bottom: true }); b.box(wx - 0.74, y0 - 0.16, zf - 0.3, wx + 0.74, y0, zf + 0.44, { bottom: true });
              b.surf(K.LATTICE, 0, 1).col(boxCol === shutCol ? cWoodL : boxCol, 0.8, 1).box(wx - 0.47, y0, zf - 0.3, wx + 0.47, y0 + 1.26, zf + 0.03, { m: 1 });
              for (const sx of [-1, 1]) {
                M4.makeRotationY(ry).setPosition(t.face, 0, t.z);
                M4b.makeRotationY(sx > 0 ? Math.PI : 0).setPosition(wx + sx * 0.47, y0, zf + 0.35);
                shutters.push([M4.clone().multiply(M4b), sx * (1.3 + 0.7 * (sx > 0 ? (bw - 0.75) / 0.3 : (bh - 1.5) / 0.5)), (out - 0.55) / 0.23 * (sx > 0 ? 1 : 0.61), shutCol]);
              }
              continue;
            }
            b.surf(K.LATTICE, 0, 1).col(boxCol).box(wx - bw, y0, zf - 0.5, wx + bw, y0 + bh, zf + out, { m: 1 });
            b.surf(K.WOOD, 0, 0).col(cWood).box(wx - bw - 0.12, y0 + bh, zf - 0.5, wx + bw + 0.12, y0 + bh + 0.14, zf + out + 0.14);
            b.box(wx - bw * 0.7, y0 - 0.34, zf - 0.5, wx + bw * 0.7, y0, zf + out * 0.6, { top: false, bottom: true });
            continue;
          }
          // a window: the lattice sits 0.3 m back between lime-washed jambs, under a lintel and over a sill that throws a shadow
          b.surf(K.LIME, 0, 0).col(cLime, 0.9, 1);
          b.box(wx - 0.64, y0 - 0.1, zf - 0.3, wx - 0.47, y0 + 1.42, zf + 0.33, { bottom: false }); b.box(wx + 0.47, y0 - 0.1, zf - 0.3, wx + 0.64, y0 + 1.42, zf + 0.33, { bottom: false });
          b.box(wx - 0.47, y0 + 1.26, zf - 0.3, wx + 0.47, y0 + 1.42, zf + 0.33, { bottom: true }); b.box(wx - 0.74, y0 - 0.16, zf - 0.3, wx + 0.74, y0, zf + 0.44, { bottom: true });
          b.surf(K.LATTICE, 0, 1).col(cWoodL, 0.8, 1).box(wx - 0.47, y0, zf - 0.3, wx + 0.47, y0 + 1.26, zf + 0.03, { m: 1 });
          for (const sx of [-1, 1]) {
            M4.makeRotationY(ry).setPosition(t.face, 0, t.z);
            M4b.makeRotationY(sx > 0 ? Math.PI : 0).setPosition(wx + sx * 0.47, y0, zf + 0.35);
            shutters.push([M4.clone().multiply(M4b), sx * krng.range(1.3, 2.0), krng(), shutCol]);
          }
        }
        b.surf(K.WOOD, 0, 0).col(cWood, 0.8, 1.1);
        for (const yv of [8.2, 16.1, 24]) b.box(wx - 0.09 + 1.4, yv, zb(yv) - 0.3, wx + 0.09 + 1.4, yv + 0.18, zb(yv) + 0.5);
      }
      { const ur = upperRng;                                      // the upper storeys: small deep-set windows, and a drain spout with its grey stain
        for (let i = 0; i < nb; i++) for (const y0 of [16.3, 24.4]) {
          const wx = -half + (i + 0.5) * (2 * half) / nb + ur.range(-0.5, 0.5), keep = ur.chance(0.6), zf = zb(y0 + 0.5);
          if (!keep) continue;
          b.surf(K.LIME, 0, 0).col(cLime, 0.9, 1).box(wx - 0.5, y0 - 0.12, zf - 0.3, wx + 0.5, y0 + 1.0, zf + 0.26, { bottom: true });
          b.surf(K.LATTICE, 0, 1).col(cWoodL, 0.75, 1).box(wx - 0.34, y0 + 0.04, zf, wx + 0.34, y0 + 0.86, zf + 0.29, { m: 1 });
        }
        const sx0 = ur.range(-half + 1, half - 1), sy = ur.range(26, 28);
        b.surf(K.WOOD, 0, 0).col(cWood, 0.8, 1.1).box(sx0 - 0.1, sy, zb(sy) - 0.3, sx0 + 0.1, sy + 0.16, zb(sy) + 1.1, { bottom: true });
        b.surf(K.MUD, 0, 0).col(L('#8f8474', 0.62), 0.9, 1).quad([sx0 - 0.22, sy - 9, zb(sy - 9) + 0.03], [sx0 + 0.22, sy - 9, zb(sy - 9) + 0.03], [sx0 + 0.12, sy, zb(sy) + 0.03], [sx0 - 0.12, sy, zb(sy) + 0.03]);
      }
      doorSpots.push([t, doorX, raised, ry]);
      b.pop();
    }
    { const cr = xr('curtains');                                  // door curtains: hung in half the doorways, stirring in the calm and streaming in the gust
      for (const [t, doorX, raised, ry] of doorSpots) {
        const keep = cr.chance(0.55), ca = cr.pick(dyes), cb = cr.pick(dyes), sd = cr();
        if (!keep) continue;
        v0.set(doorX, 0, 0.4).applyAxisAngle(YA, ry);
        addCloth(t.face + v0.x, 2.72 + raised, t.z + v0.z, 1.36, Math.PI / 2, 2.25, 0, ca, cb, sd);
      } }
    await ctx.yield();
    // Round ten. The ground storey of the lane carries more: lime string courses, dark vents with lime surrounds, striped rugs pegged
    // flat to the wall, a ladder here and there. (Their own random stream: everything laid before keeps its place.)
    const bLane2 = S.makeBuilder(16384);                          // a second lane mesh, so neither is long to pack
    { const lr = xr('lanemore'), b = bLane2, zb = (y) => -0.052 * y; let nT = 0;
      const jar2 = (x, y, z, s2) => { b.surf(K.POT, 0, 1).col(lr.pick([cPot, L('#c98a54', 0.8), L('#8f5a36', 0.8)]), 0.7, 1.05);
        b.lathe(x, y, z, [[0.12 * s2, 0], [0.3 * s2, 0.24 * s2], [0.34 * s2, 0.5 * s2], [0.22 * s2, 0.76 * s2], [0.12 * s2, 0.86 * s2], [0.17 * s2, 0.93 * s2]], 7); };
      for (const t of laneTowers) {
        const ry = t.side > 0 ? -Math.PI / 2 : Math.PI / 2, half = t.hz - 0.6;
        b.tr(t.face, 0, t.z, ry);
        b.surf(K.LIME, 0, 0).col(cLime, 0.8, 0.98);
        for (const yy of [3.62, 7.7, 11.55]) b.box(-half, yy, zb(yy) - 0.3, half, yy + 0.2, zb(yy) + 0.07);
        const nv = 2 + lr.int(0, 2);
        for (let i = 0; i < nv; i++) {                            // vents low in the wall
          const vx = lr.range(-half + 0.8, half - 0.8), vy = lr.range(1.5, 2.3);
          b.surf(K.LIME, 0, 0).col(cLime, 0.85, 1).box(vx - 0.3, vy - 0.12, zb(vy) - 0.3, vx + 0.3, vy + 0.52, zb(vy) + 0.06);
          b.surf(K.POT, 0, 1).col(cDark).box(vx - 0.16, vy, zb(vy) - 0.3, vx + 0.16, vy + 0.4, zb(vy) + 0.075);
        }
        const hb = t.hz - 0.9, nbay = Math.max(2, Math.floor((2 * hb) / 3.1));
        for (let i = 1; i < nbay; i++) {                          // a rug pegged to the wall under a pole, between two windows: bands of two dyes and a fringe
          const rx = -hb + i * (2 * hb) / nbay + lr.range(-0.1, 0.1), top = lr.range(5.9, 7.2), rw = lr.range(0.42, 0.56), rh = lr.range(1.9, 2.6), ca = lr.pick(dyes), cb = lr.pick(dyes), nbnd = 7, keep = lr.chance(0.55);
          if (!keep) continue;
          t.rugs.push(rx);
          b.surf(K.WOOD, 0, 0).col(cWoodL).box(rx - rw - 0.2, top, zb(top) - 0.05, rx + rw + 0.2, top + 0.08, zb(top) + 0.2);
          for (let q = 0; q < nbnd; q++) {
            const y1 = top - rh * q / nbnd, y0 = top - rh * (q + 1) / nbnd, edge = q === 0 || q === nbnd - 1;
            b.surf(K.POT, 0, 1).col(edge ? dyes[3] : q % 2 ? ca : cb, 0.75, 1).quad([rx - rw, y0, zb(y0) + 0.12], [rx + rw, y0, zb(y0) + 0.12], [rx + rw, y1, zb(y1) + 0.12], [rx - rw, y1, zb(y1) + 0.12]);
          }
        }
        if (lr.chance(0.3)) {                                     // a ladder left leaning
          const lx0 = lr.range(-half + 1, half - 1), lh = lr.range(3.6, 5.2);
          b.surf(K.WOOD, 0, 0).col(cWoodL, 0.8, 1.05);
          for (const sx of [-0.28, 0.28]) b.beam([lx0 + sx, 0, 1.25], [lx0 + sx, lh, zb(lh) + 0.1], 0.07);
          for (let q = 1; q < lh / 0.42 - 0.5; q++) { const k = q * 0.42 / lh; b.beam([lx0 - 0.28, q * 0.42, mix(1.25, zb(lh) + 0.1, k)], [lx0 + 0.28, q * 0.42, mix(1.25, zb(lh) + 0.1, k)], 0.045); }
        }
        b.pop();
        if (++nT % 6 === 0) await ctx.yield();
      }
      await ctx.yield();
      // The two flanks we climb between behind the low house: the street's own kit carried up them (lattice boxes, shuttered windows,
      // beam ends, spouts with their grey stains), three more lines of washing, and the low house itself made a house.
      for (const t of towersW) {
        if (t.low || t.z >= 20 || t.z < -68) continue;
        const side = Math.sign(t.x + 10) || 1, face = t.x - side * t.hx;
        if (Math.abs(face - (-10 + side * 4.5)) > 0.9) continue;
        const ry = side > 0 ? -Math.PI / 2 : Math.PI / 2, half = t.hz - 0.9, nb = Math.max(2, Math.floor((2 * half) / 3.1));
        const shutCol = lr.pick([L('#4a8f78'), L('#4a7cb4'), cWoodL, L('#96703e'), L('#8c9c4c')]);
        b.tr(face, 0, t.z, ry);
        for (let i = 0; i < nb; i++) {
          const wx = -half + (i + 0.5) * (2 * half) / nb + lr.range(-0.25, 0.25);
          for (const y0 of [4.3, 8.3, 12.2, 16.1, 20, 23.9]) {
            const q = lr(), bw = lr.range(0.75, 1.05), bh = lr.range(1.5, 2.0), out = lr.range(0.55, 0.78), sw1 = lr.range(1.3, 2.0), sw2 = lr.range(1.3, 2.0), sd1 = lr(), sd2 = lr();
            if (q < 0.14 || y0 + 4.2 > t.h) continue;
            const zf = zb(y0 + 0.7);
            if (q < 0.5) {                                        // a mashrabiya
              b.surf(K.LATTICE, 0, 1).col(q < 0.26 ? cWoodL : q < 0.38 ? cWood : shutCol).box(wx - bw, y0, zf - 0.5, wx + bw, y0 + bh, zf + out, { m: 1 });
              b.surf(K.WOOD, 0, 0).col(cWood).box(wx - bw - 0.12, y0 + bh, zf - 0.5, wx + bw + 0.12, y0 + bh + 0.14, zf + out + 0.14);
              b.box(wx - bw * 0.7, y0 - 0.34, zf - 0.5, wx + bw * 0.7, y0, zf + out * 0.6, { top: false, bottom: true });
              continue;
            }
            b.surf(K.LIME, 0, 0).col(cLime, 0.9, 1);
            b.box(wx - 0.64, y0 - 0.1, zf - 0.3, wx - 0.47, y0 + 1.42, zf + 0.33, { bottom: false }); b.box(wx + 0.47, y0 - 0.1, zf - 0.3, wx + 0.64, y0 + 1.42, zf + 0.33, { bottom: false });
            b.box(wx - 0.47, y0 + 1.26, zf - 0.3, wx + 0.47, y0 + 1.42, zf + 0.33, { bottom: true }); b.box(wx - 0.74, y0 - 0.16, zf - 0.3, wx + 0.74, y0, zf + 0.44, { bottom: true });
            b.surf(K.LATTICE, 0, 1).col(cWoodL, 0.8, 1).box(wx - 0.47, y0, zf - 0.3, wx + 0.47, y0 + 1.26, zf + 0.03, { m: 1 });
            for (const sx of [-1, 1]) {
              M4.makeRotationY(ry).setPosition(face, 0, t.z);
              M4b.makeRotationY(sx > 0 ? Math.PI : 0).setPosition(wx + sx * 0.47, y0, zf + 0.35);
              shutters.push([M4.clone().multiply(M4b), sx * (sx > 0 ? sw1 : sw2), sx > 0 ? sd1 : sd2, shutCol]);
            }
          }
          b.surf(K.WOOD, 0, 0).col(cWood, 0.8, 1.1);
          for (const yv of [7.4, 11.3, 15.2, 19.1, 23]) if (yv + 3 < t.h) {
            const sh = side < 0 && yv === 11.3 && Math.abs(t.z - wx - 1.4 - 16.8) < 0.45 ? 1.9 : 0;     // (round sixteen) the one beam end that stood at the frame's left edge as the climb begins sits two metres on, over the lattice box
            b.box(wx - 0.09 + 1.4 + sh, yv, zb(yv) - 0.3, wx + 0.09 + 1.4 + sh, yv + 0.18, zb(yv) + 0.5); }
        }
        b.surf(K.LIME, 0, 0).col(cLime, 0.8, 0.98);
        for (const yy of [3.62, 11.55, 19.4]) if (yy + 4 < t.h) b.box(-half - 0.3, yy, zb(yy) - 0.3, half + 0.3, yy + 0.2, zb(yy) + 0.07);
        for (const sgn of [-1, 1]) {                              // two spouts a side, each over its stain
          const sx0 = sgn * lr.range(1.2, half - 0.6), sy = t.h - lr.range(3.2, 5.5);
          b.surf(K.WOOD, 0, 0).col(cWood, 0.8, 1.1).box(sx0 - 0.1, sy, zb(sy) - 0.3, sx0 + 0.1, sy + 0.16, zb(sy) + 1.1, { bottom: true });
          b.surf(K.MUD, 0, 0).col(L('#8f8474', 0.62), 0.9, 1).quad([sx0 - 0.24, sy - 9, zb(sy - 9) + 0.03], [sx0 + 0.24, sy - 9, zb(sy - 9) + 0.03], [sx0 + 0.12, sy, zb(sy) + 0.03], [sx0 - 0.12, sy, zb(sy) + 0.03]);
        }
        b.pop();
        await ctx.yield();
      }
      await ctx.yield();
      for (const [lz, ly] of [[13.5, 18.6], [-13, 12.2], [-29, 20.4]]) {     // washing across the street behind the low house: one line over the eye, two below the climb
        const reach = 4.6 + 0.052 * ly;
        b.surf(K.POT, 0, 1).col(cRope);
        b.beam([-10 - reach, ly + 0.03, lz], [-10, ly - 0.1, lz], 0.05); b.beam([-10, ly - 0.1, lz], [-10 + reach, ly + 0.03, lz], 0.05);
        let x = -10 - reach + 0.6;
        while (x < -10 + reach - 1.1) {
          const w = lr.range(0.9, 1.8), drop = lr.range(1.1, 2.2), ca = lr.pick(dyes), cb = lr.pick(dyes), sd = lr(), gap = lr.range(0.15, 0.7);
          addCloth(x + w / 2, ly - 0.1 + 0.13 * Math.abs(x + w / 2 + 10) / reach, lz, w, 0, drop, 0, ca, cb, sd);
          x += w + gap;
        }
      }
      { // the low house that closes the lane: a studded door in a lime surround, two lattices, a bench with jars, a carpet over the
        // parapet, and on its terrace a pigeon loft, jars and a mat of dates
        const hx0 = -10, hzS = 9.5, top = 8.6, ter = 7.0;
        b.tr(hx0, 0, hzS, 0);
        b.surf(K.LIME, 0, 1).col(cLime, 0.85, 1).box(-1.15, 0, -0.3, 1.15, 3.5, 0.12, { m: 1 });
        b.surf(K.WOOD, 0, 1).col(cWood, 0.9, 1.1).box(-0.8, 0.14, 0.12, 0.8, 2.8, 0.2, { m: 1 });
        b.surf(K.LATTICE, 0, 1).col(cWoodL).box(-0.95, 2.86, 0.1, 0.95, 3.28, 0.26, { m: 1 });
        b.surf(K.MUD, 0, 1).col(cMudD, 0.8, 1).box(-1.3, 0, 0, 1.3, 0.18, 0.7);
        for (const sx of [-1, 1]) {
          b.surf(K.LIME, 0, 0).col(cLime, 0.9, 1).box(sx * 2.9 - 0.66, 3.9, -0.6, sx * 2.9 + 0.66, 5.6, -0.12);
          b.surf(K.LATTICE, 0, 1).col(cWoodL, 0.8, 1).box(sx * 2.9 - 0.47, 4.06, -0.6, sx * 2.9 + 0.47, 5.4, -0.08, { m: 1 });
          b.surf(K.MUD, 0, 1).col(cMud, 0.75, 1).box(sx * 2.9 - 1.3, 0, 0, sx * 2.9 + 1.3, 0.46, 0.62);
          jar2(sx * 2.5, 0.46, 0.3, 1.2); basket(b, sx * 3.5, 0.46, 0.3, 1.0);
        }
        b.surf(K.LIME, 0, 0).col(cLime, 0.8, 0.98).box(-4.2, 6.3, -0.7, 4.2, 6.5, -0.26);
        b.pop();
        addCloth(hx0 + 2.1, top + 0.14, hzS + 0.12, 2.3, 0, 2.5, 0, dyes[2], dyes[1], 0.77);
        addCloth(hx0 - 2.4, top + 0.14, hzS + 0.12, 1.5, 0, 1.7, 0, dyes[0], dyes[3], 0.91);
        const lx = hx0 + 2.4, lz = -1.2;
        b.surf(K.WOOD, 0, 0).col(cWoodL); for (const ax of [-0.75, 0.75]) for (const az of [-0.45, 0.45]) b.beam([lx + ax, ter, lz + az], [lx + ax, ter + 1.2, lz + az], 0.07);
        b.surf(K.WOOD, 0, 1).col(cWoodL, 0.8, 1).box(lx - 0.9, ter + 1.2, lz - 0.6, lx + 0.9, ter + 2.1, lz + 0.6, { m: 1, bottom: true });
        b.surf(K.LATTICE, 0, 1).col(cWood).box(lx - 0.8, ter + 1.33, lz - 0.63, lx + 0.8, ter + 1.97, lz + 0.63, { m: 1 });
        b.surf(K.LIME, 0, 0).col(cLime, 0.85, 1).box(lx - 1.0, ter + 2.1, lz - 0.7, lx + 1.0, ter + 2.18, lz + 0.7);
        for (let q = 0; q < 3; q++) jar2(hx0 - 3.2 + q * 0.8, ter, 6.6 - 0.3 * (q % 2), 1.0 + 0.15 * q);
        b.surf(K.LATTICE, 0, 1).col(L(PALETTE[4], 0.85)).push(M4.makeRotationY(0.2).setPosition(hx0 - 1.2, ter + 0.04, 2.2)); b.box(-1.5, 0, -1.0, 1.5, 0.07, 1.0, { capM: 1 }); b.pop();
        b.surf(K.LATTICE, 0, 1).col(dyes[5], 0.8, 1).push(M4.makeRotationY(-0.3).setPosition(hx0 + 1.6, ter + 0.04, 5.2)); b.box(-1.1, 0, -1.6, 1.1, 0.06, 1.6, { capM: 1 }); b.pop();
      }
      await ctx.yield();
      for (const sd of [-1, 1]) {                                 // the two towers that face the court inside the gate: their south fronts are dressed too
        let t = null; for (const q of laneTowers) if (q.side === sd && (!t || q.z > t.z)) t = q;
        if (!t || t.z + t.hz < 190) continue;
        const half = t.hx - 0.8, zS = t.z + t.hz, nb = Math.max(2, Math.floor((2 * half) / 3.1));
        b.tr(t.x, 0, zS, 0);
        b.surf(K.LIME, 0, 0).col(cLime, 0.8, 0.98);
        for (const yy of [3.62, 7.7, 11.55, 15.5]) b.box(-half - 0.3, yy, zb(yy) - 0.3, half + 0.3, yy + 0.2, zb(yy) + 0.07);
        b.surf(K.MUD, 0, 1).col(cMud, 0.75, 1).box(-half, 0, 0, half, 0.46, 0.62);
        for (let i = 0; i < nb; i++) {
          const wx = -half + (i + 0.5) * (2 * half) / nb + lr.range(-0.25, 0.25);
          for (const y0 of [4.3, 8.3, 12.2, 16.1, 20]) {
            const q = lr(), bw = lr.range(0.75, 1.05), bh = lr.range(1.5, 2.0), out = lr.range(0.55, 0.78), zf = zb(y0 + 0.7);
            if (q < 0.16) continue;
            if (q < 0.56) {
              b.surf(K.LATTICE, 0, 1).col(q < 0.3 ? cWoodL : q < 0.42 ? cWood : L('#4a7cb4')).box(wx - bw, y0, zf - 0.5, wx + bw, y0 + bh, zf + out, { m: 1 });
              b.surf(K.WOOD, 0, 0).col(cWood).box(wx - bw - 0.12, y0 + bh, zf - 0.5, wx + bw + 0.12, y0 + bh + 0.14, zf + out + 0.14);
              b.box(wx - bw * 0.7, y0 - 0.34, zf - 0.5, wx + bw * 0.7, y0, zf + out * 0.6, { top: false, bottom: true });
              continue;
            }
            b.surf(K.LIME, 0, 0).col(cLime, 0.9, 1);
            b.box(wx - 0.64, y0 - 0.1, zf - 0.3, wx - 0.47, y0 + 1.42, zf + 0.33, { bottom: false }); b.box(wx + 0.47, y0 - 0.1, zf - 0.3, wx + 0.64, y0 + 1.42, zf + 0.33, { bottom: false });
            b.box(wx - 0.47, y0 + 1.26, zf - 0.3, wx + 0.47, y0 + 1.42, zf + 0.33, { bottom: true }); b.box(wx - 0.74, y0 - 0.16, zf - 0.3, wx + 0.74, y0, zf + 0.44, { bottom: true });
            b.surf(K.LATTICE, 0, 1).col(cWoodL, 0.8, 1).box(wx - 0.47, y0, zf - 0.3, wx + 0.47, y0 + 1.26, zf + 0.03, { m: 1 });
          }
          const jq = lr(), js = lr.range(0.9, 1.3);
          if (jq < 0.5) jar2(wx + 0.9, 0.46, 0.3, js); else if (jq < 0.8) basket(b, wx + 0.9, 0.46, 0.3, js);
        }
        b.pop();
        for (let i = 0; i < 2; i++) {                             // two long banners from poles high on the front
          const bx = t.x - sd * (half - 2.2 - i * 3.4), by = 11.2 - i * 0.8, ca = lr.pick(dyes), cb = lr.pick(dyes), sdd = lr();
          b.surf(K.WOOD, 0, 0).col(cWoodL).beam([bx, by, zS + zb(by) - 0.2], [bx, by + 0.25, zS + 1.5], 0.07);
          addCloth(bx, by + 0.22, zS + 1.35, 1.25, 0, 4.2, 0, ca, cb, sdd);
        }
      }
    }
    await ctx.yield();
    // Round eleven. The lane's second storey (9 to 11 m), which was bare between the string courses: a lattice box or a shuttered
    // window in a lime surround at the bay lines, and two drain spouts with their grey stains higher up. (Their own random stream.)
    { const ur = xr('laneupper'), b = bLane2, zb = (y) => -0.052 * y; let nT = 0;
      for (const t of laneTowers) {
        const ry = t.side > 0 ? -Math.PI / 2 : Math.PI / 2, half = t.hz - 0.9, nb = Math.max(2, Math.floor((2 * half) / 3.1));
        const shutCol = ur.pick([L('#4a8f78'), L('#4a7cb4'), cWoodL, L('#96703e'), L('#8c9c4c')]);
        b.tr(t.face, 0, t.z, ry);
        for (let i = 1; i < nb; i++) {
          const wx = -half + i * (2 * half) / nb + ur.range(-0.2, 0.2), y0 = 8.75 + ur.range(0, 0.2), q = ur(), bw = ur.range(0.7, 0.95), bh = ur.range(1.45, 1.85), out = ur.range(0.5, 0.72),
            sw1 = ur.range(1.3, 2.0), sw2 = ur.range(1.3, 2.0), sd1 = ur(), sd2 = ur(), keep = ur.chance(0.8), zf = zb(y0 + 0.7);
          if (!keep) continue;
          if ((i + nT) % 2 ? q < 0.7 : q < 0.3) {                 // a mashrabiya
            b.surf(K.LATTICE, 0, 1).col(q < 0.15 ? cWood : q < 0.45 ? cWoodL : shutCol).box(wx - bw, y0, zf - 0.5, wx + bw, y0 + bh, zf + out, { m: 1 });
            b.surf(K.WOOD, 0, 0).col(cWood).box(wx - bw - 0.12, y0 + bh, zf - 0.5, wx + bw + 0.12, y0 + bh + 0.14, zf + out + 0.14);
            b.box(wx - bw * 0.7, y0 - 0.34, zf - 0.5, wx + bw * 0.7, y0, zf + out * 0.6, { top: false, bottom: true });
            continue;
          }
          b.surf(K.LIME, 0, 0).col(cLime, 0.9, 1);
          b.box(wx - 0.64, y0 - 0.1, zf - 0.3, wx - 0.47, y0 + 1.42, zf + 0.33, { bottom: false }); b.box(wx + 0.47, y0 - 0.1, zf - 0.3, wx + 0.64, y0 + 1.42, zf + 0.33, { bottom: false });
          b.box(wx - 0.47, y0 + 1.26, zf - 0.3, wx + 0.47, y0 + 1.42, zf + 0.33, { bottom: true }); b.box(wx - 0.74, y0 - 0.16, zf - 0.3, wx + 0.74, y0, zf + 0.44, { bottom: true });
          b.surf(K.LATTICE, 0, 1).col(cWoodL, 0.8, 1).box(wx - 0.47, y0, zf - 0.3, wx + 0.47, y0 + 1.26, zf + 0.03, { m: 1 });
          for (const sx of [-1, 1]) {
            M4.makeRotationY(ry).setPosition(t.face, 0, t.z);
            M4b.makeRotationY(sx > 0 ? Math.PI : 0).setPosition(wx + sx * 0.47, y0, zf + 0.35);
            shutters.push([M4.clone().multiply(M4b), sx * (sx > 0 ? sw1 : sw2), sx > 0 ? sd1 : sd2, shutCol]);
          }
        }
        for (const sgn of [-1, 1]) {                              // two spouts a facade, each over its stain
          const sx0 = sgn * ur.range(0.7, Math.max(0.9, half - 0.5)), sy = ur.range(13.3, 15.3);
          b.surf(K.WOOD, 0, 0).col(cWood, 0.8, 1.1).box(sx0 - 0.1, sy, zb(sy) - 0.3, sx0 + 0.1, sy + 0.16, zb(sy) + 1.0, { bottom: true });
          b.surf(K.MUD, 0, 0).col(L('#8f8474', 0.62), 0.9, 1).quad([sx0 - 0.24, sy - 5.6, zb(sy - 5.6) + 0.03], [sx0 + 0.24, sy - 5.6, zb(sy - 5.6) + 0.03], [sx0 + 0.12, sy, zb(sy) + 0.03], [sx0 - 0.12, sy, zb(sy) + 0.03]);
        }
        b.pop();
        if (++nT % 5 === 0) await ctx.yield();
      } }
    await ctx.yield();
    // Round thirteen. No bare wall at the eye's height. Every bay of the ground storey without the door gets a shop hatch (a dark recess
    // in a lime surround, a plank flap propped open over it, goods on its sill, a fanlight of coloured glass) or a low second door under a
    // fanlight; between the windows above, where no rug hangs, a pair of narrow lattices under one fanlight; and a second set of washing
    // lines crosses the street higher up, half way between the first. (Its own mesh and its own random stream.)
    const bLane3 = S.makeBuilder(16384);
    { const dr = xr('lanedress'), b = bLane3, zb = (y) => -0.052 * y; let nT = 0;
      const goods = [L('#d9822b'), L('#b4463c'), L('#5a8a62'), L('#d9a548'), L('#7a4a2a'), L('#eee7d6', 0.8)];
      for (const t of laneTowers) {
        const ry = t.side > 0 ? -Math.PI / 2 : Math.PI / 2, half = t.hz - 0.9, nb = Math.max(2, Math.floor((2 * half) / 3.1));
        b.tr(t.face, 0, t.z, ry);
        for (const wx of t.bays || []) {
          const q = dr(), q2 = dr(), q3 = dr(), q4 = dr();
          if (Math.abs(wx - t.doorX) < 2.2 || Math.abs(wx) > half - 0.9) continue;
          if (q < 0.52) {                                         // a shop hatch
            const y0 = 0.95, y1 = 2.45, hw = 0.74, zf = zb(1.7);
            b.surf(K.LIME, 0, 0).col(cLime, 0.85, 1).box(wx - hw - 0.2, y0 - 0.18, zf - 0.3, wx + hw + 0.2, y1 + 0.2, zf + 0.08);
            b.surf(K.POT, 0, 1).col(cDark).box(wx - hw, y0, zf - 0.3, wx + hw, y1, zf + 0.1);
            b.surf(K.WOOD, 0, 1).col(cWoodL, 0.8, 1).box(wx - hw - 0.12, y0 - 0.08, zf, wx + hw + 0.12, y0, zf + 0.5, { m: 1, bottom: true });
            b.surf(K.WOOD, 0, 1).col(q2 < 0.5 ? cWood : cWoodL, 0.85, 1.05).quad([wx - hw, y1 + 0.02, zf + 0.1], [wx + hw, y1 + 0.02, zf + 0.1], [wx + hw, y1 - 0.42, zf + 1.15], [wx - hw, y1 - 0.42, zf + 1.15]);
            b.surf(K.WOOD, 0, 0).col(cWoodL); for (const sx of [-1, 1]) b.beam([wx + sx * (hw - 0.08), y0, zf + 0.46], [wx + sx * (hw - 0.08), y1 - 0.4, zf + 1.1], 0.045);
            const ng = 3 + Math.floor(q3 * 2);
            for (let g = 0; g < ng; g++) {
              const gx = wx - hw + 0.22 + g * (2 * hw - 0.44) / (ng - 1), gc = goods[Math.floor(((q4 * 7 + g * 0.37) % 1) * goods.length)];
              b.surf(K.POT, 0, 1).col(gc, 0.75, 1.1).sphere(gx, y0 + 0.15, zf + 0.27, 0.17, 6, 4, { sy: 0.85 });
            }
            if (q3 > 0.35) {
              b.surf(K.LIME, 0, 0).col(cLime, 0.9, 1).box(wx - 0.68, y1 + 0.3, zf - 0.3, wx + 0.68, y1 + 0.74, zf + 0.05);
              b.surf(K.GLASS, q4, 1).col([1, 1, 1]).box(wx - 0.6, y1 + 0.36, zf - 0.3, wx + 0.6, y1 + 0.68, zf + 0.09, { m: 1 });
            }
          } else if (q < 0.82) {                                  // a low second door on the bench's step, under a fanlight of coloured glass
            b.surf(K.LIME, 0, 1).col(cLime, 0.85, 1).box(wx - 0.76, 0.46, -0.3, wx + 0.76, 3.1, 0.07, { m: 1 });
            b.surf(K.WOOD, 0, 1).col(q2 < 0.5 ? cWood : cWoodL, 0.9, 1.1).box(wx - 0.5, 0.5, 0, wx + 0.5, 2.34, 0.14, { m: 1 });
            b.surf(K.GLASS, q4, 1).col([1, 1, 1]).box(wx - 0.5, 2.46, 0, wx + 0.5, 2.92, 0.12, { m: 1 });
          }
        }
        for (let i = 1; i < nb; i++) {                            // a pair of narrow lattices under one fanlight, between two windows of the storey below
          const bx = -half + i * (2 * half) / nb, q = dr(), q2 = dr(), q3 = dr(), y0 = 5.95, zf = zb(y0 + 0.7);
          if (q > 0.86 || (t.rugs || []).some((rx) => Math.abs(rx - bx) < 0.9)) continue;
          b.surf(K.LIME, 0, 0).col(cLime, 0.9, 1).box(bx - 0.76, y0 - 0.12, zf - 0.3, bx + 0.76, y0 + 1.5, zf + 0.09);
          b.box(bx - 0.86, y0 - 0.24, zf - 0.3, bx + 0.86, y0 - 0.12, zf + 0.3, { bottom: true });
          b.surf(K.LATTICE, 0, 1).col(q2 < 0.5 ? cWoodL : cWood, 0.8, 1);
          b.box(bx - 0.62, y0, zf - 0.3, bx - 0.05, y0 + 0.95, zf + 0.13, { m: 1 }); b.box(bx + 0.05, y0, zf - 0.3, bx + 0.62, y0 + 0.95, zf + 0.13, { m: 1 });
          b.surf(K.GLASS, q3, 1).col([1, 1, 1]).box(bx - 0.62, y0 + 1.03, zf - 0.3, bx + 0.62, y0 + 1.38, zf + 0.13, { m: 1 });
        }
        b.surf(K.WOOD, 0, 0).col(cWood, 0.8, 1.1);                 // the floor beams of the first storey show as a row of stubs, each over its streak
        for (let bx = -half + 0.55; bx < half - 0.3; bx += 1.24) b.box(bx - 0.08, 7.32, zb(7.4) - 0.3, bx + 0.08, 7.5, zb(7.4) + 0.42, { bottom: true });
        b.pop();
        if (++nT % 4 === 0) await ctx.yield();
      }
      await ctx.yield();
      for (let z = 191; z > 36; z -= 14) {                        // washing higher up, half way between the lines over the eye
        if (z < 128 && z > 94) continue;
        const cx = laneX(z), y = 11.1 + dr.range(-0.2, 0.4), reach = 4.53 + 0.052 * y;
        b.surf(K.POT, 0, 1).col(cRope);
        b.beam([cx - reach, y + 0.03, z], [cx, y - 0.12, z], 0.05); b.beam([cx, y - 0.12, z], [cx + reach, y + 0.03, z], 0.05);
        let x = cx - reach + 0.8;
        while (x < cx + reach - 1.3) {
          const w = dr.range(0.8, 1.6), drop = dr.range(0.9, 1.7), ca = dr.pick(dyes), cb = dr.pick(dyes), sd = dr(), gap = dr.range(0.3, 1.4);
          addCloth(x + w / 2, y - 0.12 + 0.15 * Math.abs(x + w / 2 - cx) / reach, z, w, 0, drop, 0, ca, cb, sd);
          x += w + gap;
        }
      }
    }
    await ctx.yield();
    // Round fourteen. Where a side lane opens off the street, the south front of the house beyond it faces the eye as it comes up the
    // street (it was a blank mud plane across a third of the frame). Every such front is dressed like the street: lime string courses,
    // rows of latticed and shuttered windows, a plank door under a fanlight, a bench with jars, beam stubs, a spout over its stain, and
    // a line of washing down the side lane. The court inside the gate gets a small market on the ground: rugs spread for sale, mats of
    // dates, sacks, jars and baskets, clear of the track. (lane-kit3; its own random stream.)
    { const sr4 = xr('lanesouth'), b = bLane3, zb = (y) => -0.052 * y; let nF = 0;
      const jar4 = (x, y, z, s2) => { b.surf(K.POT, 0, 1).col(sr4.pick([cPot, L('#c98a54', 0.8), L('#8f5a36', 0.8)]), 0.7, 1.05);
        b.lathe(x, y, z, [[0.12 * s2, 0], [0.3 * s2, 0.24 * s2], [0.34 * s2, 0.5 * s2], [0.22 * s2, 0.76 * s2], [0.12 * s2, 0.86 * s2], [0.17 * s2, 0.93 * s2]], 7); };
      const shutCols = [L('#4a8f78'), L('#4a7cb4'), L('#4a7cb4'), L('#8c9c4c'), cWoodL];
      for (const sd of [-1, 1]) {
        let first = null; for (const q of laneTowers) if (q.side === sd && (!first || q.z > first.z)) first = q;
        for (const t of laneTowers) {
          if (t.side !== sd) continue;
          const zS = t.z + t.hz;
          if (t === first && zS >= 190) continue;                 // (the fronts on the court were dressed in round ten)
          let gap = 60; for (const q of laneTowers) if (q.side === sd && q !== t && q.z > t.z) gap = Math.min(gap, q.z - q.hz - zS);
          const q0 = sr4(), q1 = sr4(), q2 = sr4(), shutCol = sr4.pick(shutCols);
          if (gap < 2.6) continue;
          // facade space: x along the front (world x), z out of it (south); the lane's edge is at x = xe, and the front is dressed inward from there
          const wide = gap > 8 ? 2 * t.hx - 1.2 : Math.min(2 * t.hx - 1.2, 9.6), xe = -sd * t.hx, dir = sd, xa = xe + dir * 0.6, nb = Math.max(2, Math.floor(wide / 3.1));
          const X = (k) => xa + dir * k;                          // k metres in from the lane's corner
          b.tr(t.x, 0, zS, 0);
          b.surf(K.LIME, 0, 0).col(cLime, 0.8, 0.98);
          for (const yy of [3.62, 7.7, 11.55, 15.5]) if (yy + 4 < t.h) b.box(Math.min(X(-0.3), X(wide + 0.3)), yy, zb(yy) - 0.3, Math.max(X(-0.3), X(wide + 0.3)), yy + 0.2, zb(yy) + 0.07);
          const doorBay = Math.min(nb - 1, 1 + Math.floor(q0 * (nb - 1)));
          for (let i = 0; i < nb; i++) {
            const wx = X((i + 0.5) * wide / nb + sr4.range(-0.2, 0.2));
            for (const y0 of [4.3, 8.3, 12.2, 16.1, 20]) {
              const q = sr4(), bw = sr4.range(0.75, 1.0), bh = sr4.range(1.5, 1.95), out = sr4.range(0.5, 0.72), sw1 = sr4.range(1.3, 2.0), sw2 = sr4.range(1.3, 2.0), s1 = sr4(), s2 = sr4();
              if (q < 0.1 || y0 + 4.2 > t.h || (y0 > 17 && gap < 8)) continue;
              const zf = zb(y0 + 0.7);
              if (q < 0.42) {                                     // a mashrabiya
                b.surf(K.LATTICE, 0, 1).col(q < 0.2 ? cWoodL : q < 0.3 ? cWood : shutCol).box(wx - bw, y0, zf - 0.5, wx + bw, y0 + bh, zf + out, { m: 1 });
                b.surf(K.WOOD, 0, 0).col(cWood).box(wx - bw - 0.12, y0 + bh, zf - 0.5, wx + bw + 0.12, y0 + bh + 0.14, zf + out + 0.14);
                b.box(wx - bw * 0.7, y0 - 0.34, zf - 0.5, wx + bw * 0.7, y0, zf + out * 0.6, { top: false, bottom: true });
                continue;
              }
              b.surf(K.LIME, 0, 0).col(cLime, 0.9, 1).box(wx - 0.66, y0 - 0.12, zf - 0.3, wx + 0.66, y0 + 1.44, zf + 0.16);
              b.box(wx - 0.76, y0 - 0.2, zf - 0.3, wx + 0.76, y0 - 0.06, zf + 0.44, { bottom: true });
              b.surf(K.LATTICE, 0, 1).col(cWoodL, 0.8, 1).box(wx - 0.47, y0, zf - 0.3, wx + 0.47, y0 + 1.26, zf + 0.22, { m: 1 });
              if (q > 0.62) for (const sx of [-1, 1]) {           // a pair of shutter leaves, slammed with the rest when the gust comes
                M4.makeTranslation(t.x, 0, zS);
                M4b.makeRotationY(sx > 0 ? Math.PI : 0).setPosition(wx + sx * 0.47, y0, zf + 0.35);
                shutters.push([M4.clone().multiply(M4b), sx * (sx > 0 ? sw1 : sw2), sx > 0 ? s1 : s2, shutCol]);
              }
            }
            if (i === doorBay) {                                  // the door: a gypsum surround, studded planks, a carved lintel, a fanlight of coloured glass, a step
              b.surf(K.LIME, 0, 1).col(cLime, 0.85, 1).box(wx - 1.0, 0, -0.4, wx + 1.0, 3.5, 0.1, { m: 1 });
              b.surf(K.WOOD, 0, 1).col(q1 < 0.5 ? cWood : cWoodL, 0.9, 1.1).box(wx - 0.72, 0.14, 0.1, wx + 0.72, 2.6, 0.19, { m: 1 });
              b.surf(K.GLASS, q2, 1).col([1, 1, 1]).box(wx - 0.66, 2.74, 0.02, wx + 0.66, 3.28, 0.15, { m: 1 });
              b.surf(K.MUD, 0, 1).col(cMudD, 0.8, 1).box(wx - 1.15, 0, 0, wx + 1.15, 0.16, 0.6);
              if (q1 > 0.35) { const aw = 2.5 + 0.6 * q2;         // a striped awning on two poles
                addCloth(t.x + wx, 3.85, zS + 0.05 + zb(3.85), aw, 0, 1.1, 1, dyes[Math.floor(q0 * 6.99) % dyes.length], q2 < 0.5 ? dyes[3] : dyes[6], q1);
                b.surf(K.WOOD, 0, 0).col(cWoodL); for (const sx of [-1, 1]) b.beam([wx + sx * aw * 0.48, 0, 1.0], [wx + sx * aw * 0.48, 3.43, 0.82], 0.07); }
            } else {                                              // a mud bench with a jar or a basket, and a vent over it
              b.surf(K.MUD, 0, 1).col(cMud, 0.75, 1).box(wx - 1.3, 0, 0, wx + 1.3, 0.46, 0.62);
              const jq = sr4(), js = sr4.range(0.9, 1.3);
              if (jq < 0.55) jar4(wx + 0.5, 0.46, 0.3, js); else if (jq < 0.85) basket(b, wx + 0.5, 0.46, 0.3, js);
              if (jq > 0.3) jar4(wx - 0.4, 0.46, 0.3, 0.8 + 0.3 * jq);
              b.surf(K.LIME, 0, 0).col(cLime, 0.85, 1).box(wx - 0.3, 1.7, zb(1.8) - 0.3, wx + 0.3, 2.34, zb(1.8) + 0.06);
              b.surf(K.POT, 0, 1).col(cDark).box(wx - 0.16, 1.82, zb(1.8) - 0.3, wx + 0.16, 2.22, zb(1.8) + 0.075);
            }
          }
          b.surf(K.WOOD, 0, 0).col(cWood, 0.8, 1.1);              // the floor beams of the first storey, and a spout over its grey stain
          for (let k = 0.5; k < wide - 0.2; k += 1.24) b.box(X(k) - 0.08, 7.32, zb(7.4) - 0.3, X(k) + 0.08, 7.5, zb(7.4) + 0.42, { bottom: true });
          { const sx0 = X(wide * (0.3 + 0.4 * q2)), sy = Math.min(t.h - 4, 14 + 1.5 * q1);
            b.box(sx0 - 0.1, sy, zb(sy) - 0.3, sx0 + 0.1, sy + 0.16, zb(sy) + 1.0, { bottom: true });
            b.surf(K.MUD, 0, 0).col(L('#8f8474', 0.62), 0.9, 1).quad([sx0 - 0.24, sy - 5.6, zb(sy - 5.6) + 0.03], [sx0 + 0.24, sy - 5.6, zb(sy - 5.6) + 0.03], [sx0 + 0.12, sy, zb(sy) + 0.03], [sx0 - 0.12, sy, zb(sy) + 0.03]); }
          b.pop();
          if (gap < 9) {                                          // washing on a line down the side lane, from this front to the house across it
            const lx2 = t.x + xe + dir * (2.0 + 1.6 * q0), ly = 7.0 + 0.5 * q1, z0 = zS - 0.36, z1 = zS + gap + 0.36;
            b.surf(K.POT, 0, 1).col(cRope).beam([lx2, ly + 0.03, z0], [lx2, ly - 0.08, (z0 + z1) / 2], 0.05); b.beam([lx2, ly - 0.08, (z0 + z1) / 2], [lx2, ly + 0.03, z1], 0.05);
            let z = z0 + 0.5;
            while (z < z1 - 1.1) { const w = sr4.range(0.8, 1.5), drop = sr4.range(0.9, 1.8), ca = sr4.pick(dyes), cb = sr4.pick(dyes), sdd = sr4(), gp = sr4.range(0.2, 0.7);
              if (z + w < z1 - 0.3) addCloth(lx2, ly - 0.06, z + w / 2, w, Math.PI / 2, drop, 0, ca, cb, sdd);
              z += w + gp; }
          }
          if (++nF % 3 === 0) await ctx.yield();
        }
      }
      await ctx.yield();
      // the market on the ground of the court inside the gate (z 189 to 208), either side of the track: nothing within 3.7 m of its middle
      const band = (x0, z0, x1, z1, y, c, g) => b.surf(K.POT, 0, 1).col(c, g, g).quad([x0, y, z1], [x1, y, z1], [x1, y, z0], [x0, y, z0]);
      for (const sd of [-1, 1]) {
        let zc = 208.8, zN = 189; for (const q of laneTowers) if (q.side === sd) zN = Math.max(zN, Math.min(205.6, q.z + q.hz + 1.5));
        for (let i = 0; i < 4 && zc - 3 > zN; i++) {
          const kind = sr4(), cx = sd * sr4.range(5.6, 7.4), rot = sr4.range(-0.22, 0.22), ca = sr4.pick([dyes[2], dyes[0], dyes[1], dyes[5], dyes[2]]), cb = sr4.pick([dyes[3], dyes[1], dyes[0], dyes[4]]), hw = sr4.range(1.0, 1.35), hd = sr4.range(1.5, 2.1), tone = sr4.range(0.85, 1.1);
          b.push(M4.makeRotationY(rot).setPosition(cx, 0.03, zc - hd));
          if (kind < 0.62) {                                      // a rug spread on the ground: a border, bands of two dyes, a medallion
            band(-hw, -hd, hw, hd, 0.02, dyes[3], 0.8);
            for (let q = 0; q < 6; q++) band(-hw + 0.14, -hd + 0.14 + q * (2 * hd - 0.28) / 6, hw - 0.14, -hd + 0.14 + (q + 1) * (2 * hd - 0.28) / 6, 0.05, q % 2 ? ca : cb, 0.95);
            band(-hw * 0.4, -hd * 0.3, hw * 0.4, hd * 0.3, 0.08, dyes[kind < 0.3 ? 1 : 3], 1);
            if (kind < 0.3) { for (let q = 0; q < 3; q++) b.surf(K.POT, 0, 1).col(sr4.pick(dyes), 0.8, 1).box(hw + 0.25, 0.14 * q, -0.5 + 0.06 * q, hw + 0.95, 0.14 * (q + 1), 0.5 - 0.06 * q); }   // folded rugs stacked beside it
          } else if (kind < 0.84) dateMat(b, hw, hd * 0.8, tone, kind < 0.74);
          else { b.surf(K.POT, 0, 1).col(L('#b8a37c', 0.8), 0.7, 1); for (let q = 0; q < 4; q++) b.sphere(-0.6 + 0.62 * (q % 2) + 0.3 * (q > 1 ? 1 : 0), 0.3 + 0.36 * (q > 2 ? 1 : 0), -0.4 + 0.5 * (q % 3), 0.42, 7, 4, { sy: 0.72 }); }   // sacks
          b.pop();
          const ox = cx + sd * (hw + 0.9), oz = zc - hd + sr4.range(-0.8, 0.8), os = sr4.range(0.9, 1.3);
          if (sr4.chance(0.6)) jar4(ox, 0, oz, os); else basket(b, ox, 0, oz, os);
          if (sr4.chance(0.5)) basket(b, ox + sd * 0.2, 0, oz + 0.9, 1.0);
          zc -= 2 * hd + sr4.range(0.5, 1.3);
        }
      }
    }
    await ctx.yield();
    // The leaf atlas that windMaterial would make itself, drawn in steps of a few ms by flora.prepareLeafTexture (it keeps the pixels,
    // so makeLeafTexture after it draws nothing).
    const leafOpts = {};
    await flora.prepareLeafTexture(leafOpts, ctx.yield);
    const leafMap = flora.makeLeafTexture(leafOpts);
    await ctx.yield();

    // laundry and dyed cloth on lines across the lane, 3.5 m above the eye, every 14 m (every 7 m at a wedding)
    const weddingDyes = [L('#c2362e'), L('#3c9456')];
    { let li = 0;
      for (let z = 198; z > 30; z -= cast.wedding ? 7 : 14, li++) {
        if (!cast.wedding && z < 126 && z > 96) continue;
        const cx = laneX(z), y = 8.5 + krng.range(-0.15, 0.35), reach = z < 126 && z > 96 ? 9 : 4.95;
        bLane.surf(K.POT, 0, 1).col(cRope);
        bLane.beam([cx - reach, y + 0.03, z], [cx, y - 0.1, z], 0.05); bLane.beam([cx, y - 0.1, z], [cx + reach, y + 0.03, z], 0.05);
        const wed = cast.wedding && (li % 2 === 1 || rng.chance(0.5));
        let x = cx - reach + 0.7;
        while (x < cx + reach - 1.2) {
          const w = wed ? 0.9 : krng.range(0.8, 1.7), drop = wed ? 1.1 : krng.range(0.9, 1.9);
          addCloth(x + w / 2, y - 0.1 + 0.13 * Math.abs(x + w / 2 - cx) / reach, z, w, 0, drop, 0, wed ? weddingDyes[(li + Math.round(x)) & 1] : krng.pick(dyes), wed ? L('#e8c040') : krng.pick(dyes));
          x += w + (wed ? 0.25 : krng.range(0.15, 0.9));
        }
      }
    }
    // the square: well, mosque with its minaret, a donkey cart, a dropped basket
    { const b = bLane;
      b.tr(-13, 0, 119, 0.4);
      b.surf(K.MUD, 0, 1).col(cStone, 0.75, 1).lathe(0, 0, 0, [[1.5, 0], [1.45, 0.85], [1.15, 0.9], [1.1, 0.2]], 12);
      b.surf(K.POT, 0, 1).col(cDark).disc(0, 0.25, 0, 1.1, 10);
      b.surf(K.WOOD, 0, 0).col(cWoodL); b.beam([-1.4, 0, 0], [-1.3, 2.6, 0], 0.16); b.beam([1.4, 0, 0], [1.3, 2.6, 0], 0.16); b.beam([-1.6, 2.6, 0], [1.6, 2.6, 0], 0.14);
      b.surf(K.POT, 0, 1).col(cRope).beam([0.2, 2.6, 0], [0.2, 0.9, 0], 0.045); basket(b, 0.2, 0.55, 0, 0.9); jar(b, 2.1, 0, 0.6, 1.3); jar(b, 2.5, 0, -0.3, 1.0);
      b.surf(K.MUD, 0, 1).col(cStone, 0.75, 1).box(-3.6, 0, 1.4, -1.2, 0.5, 2.3);
      b.pop();
      { const b = bTown;                                          // (in the town kit: it shows from the rim, the lane kit does not)
      b.tr(-30, 0, 111, 0);                                       // mosque: all white, stepped parapet, a small dome, a 30 m minaret
      b.surf(K.LIME, 0, 1).col(cLime, 0.8, 1).box(-6.5, 0, -6, 6.5, 6.4, 6, { m: 1 });
      for (let i = -6; i <= 6; i++) for (const zz of [-5.85, 5.85]) b.box(i - 0.32, 6.4, zz - 0.15, i + 0.32, 7.3 - 0.35 * (Math.abs(i) % 2), zz + 0.15);
      for (let i = -5; i <= 5; i++) for (const xx of [-6.35, 6.35]) b.box(xx - 0.15, 6.4, i - 0.32, xx + 0.15, 7.3 - 0.35 * (Math.abs(i) % 2), i + 0.32);
      b.cyl(-1, 6.4, 0, 3.0, 3.0, 1.1, 12, { cap: false }); b.sphere(-1, 7.5, 0, 3.0, 12, 8, { sy: 0.95 });
      b.surf(K.LATTICE, 0, 1).col(cWood);
      for (const zz of [-3.4, 0, 3.4]) b.box(6.45, 1.6 + (zz === 0 ? -1.6 : 0.6), zz - 0.75, 6.62, 4.2, zz + 0.75, { m: 1 });
      b.surf(K.LIME, 0, 1).col(cLime, 0.8, 1);
      b.frustum(8.6, -10.4, 3.6, 3.6, 3.1, 3.1, 0, 7.5, { m: 1 });
      b.lathe(8.6, 7.5, -10.4, [[1.55, 0], [1.3, 12], [1.25, 21.5], [2.0, 22.3], [2.0, 23.5], [1.08, 23.55], [0.95, 31.6], [1.35, 32.1], [1.15, 32.6], [0.5, 35.4], [0, 37.4]], 10);     // (taller than the brief's 30 m: it has to stand clear of 34 m roofs)
      b.surf(K.LATTICE, 0, 1).col(cWoodL).cyl(8.6, 30.8, -10.4, 1.3, 1.3, 1.1, 10, { cap: false });
      b.surf(K.LATTICE, 0, 1).col(cWood); for (const yy of [16, 26.5]) b.box(8.6 - 0.3, 7.5 + yy, -10.4 + 1.1, 8.6 + 0.3, 7.5 + yy + 1.3, -10.4 + 1.42, { m: 1 });
      b.pop(); }
      b.tr(3.5, 0, 103, 1.9);                                     // donkey cart, shafts on the ground
      b.surf(K.WOOD, 0, 1).col(cWoodL, 0.8, 1).box(-1.1, 0.75, -0.7, 1.1, 0.9, 0.7, { m: 1, bottom: true });
      b.box(-1.1, 0.9, -0.7, 1.1, 1.3, -0.62); b.box(-1.1, 0.9, 0.62, 1.1, 1.3, 0.7);
      b.beam([1.1, 0.8, -0.5], [3.1, 0.15, -0.5], 0.09); b.beam([1.1, 0.8, 0.5], [3.1, 0.15, 0.5], 0.09);
      for (const zz of [-0.82, 0.82]) { b.surf(K.WOOD, 0, 0).col(cWood); b.push(M4.makeRotationX(Math.PI / 2).setPosition(-0.2, 0.62, zz)); b.cyl(0, -0.05, 0, 0.62, 0.62, 0.1, 10); b.pop(); }
      basket(b, -0.5, 0.9, 0, 1.3); basket(b, 0.4, 0.9, 0.1, 1.0); jar(b, 2.2, 0, 1.4, 1.1);
      b.pop();
      basket(b, -13.6, 0, 86, 1.1); jar(b, -6.4, 0, 70, 1.2); jar(b, -6.9, 0, 70.7, 0.9);
      { const sr2 = xr('stalls');                                 // four market stalls under awnings along the east side of the square
        for (const sz of [97.6, 109.4, 115.8, 122.2]) {
          const x1 = 8.3, wv = sr2.range(2.6, 3.2), ca = sr2.pick(dyes), sd = sr2();
          b.surf(K.WOOD, 0, 0).col(cWoodL);
          for (const dz of [-1, 1]) { b.beam([x1, 0, sz + dz * wv * 0.48], [x1, 3.05, sz + dz * wv * 0.48], 0.09); b.beam([x1 - 1.55, 0, sz + dz * wv * 0.48], [x1 - 1.55, 2.4, sz + dz * wv * 0.48], 0.08); }
          b.beam([x1, 3.0, sz - wv * 0.5], [x1, 3.0, sz + wv * 0.5], 0.08);
          addCloth(x1, 3.02, sz, wv, Math.PI / 2, 1.7, 1, ca, dyes[3], sd);
          b.surf(K.WOOD, 0, 1).col(cWoodL, 0.8, 1).box(x1 - 1.3, 0.72, sz - wv * 0.4, x1 - 0.2, 0.82, sz + wv * 0.4, { m: 1, bottom: true });
          b.surf(K.WOOD, 0, 0).col(cWood); for (const dz of [-1, 1]) for (const dx of [-1.2, -0.3]) b.beam([x1 + dx, 0, sz + dz * wv * 0.36], [x1 + dx, 0.72, sz + dz * wv * 0.36], 0.07);
          for (let q = 0; q < 3; q++) { const qz = sz + (q - 1) * wv * 0.27; if (sr2.chance(0.5)) basket(b, x1 - 0.75, 0.82, qz, sr2.range(0.8, 1.1)); else jar(b, x1 - 0.75, 0.82, qz, sr2.range(0.7, 1.0)); }
          jar(b, x1 - 1.9, 0, sz + wv * 0.3, sr2.range(1.0, 1.3)); basket(b, x1 - 2.1, 0, sz - wv * 0.25, sr2.range(1.0, 1.3));
          b.surf(K.LATTICE, 0, 1).col(L(PALETTE[4], sr2.range(0.6, 0.9))).box(x1 - 2.9, 0.03, sz - 0.7, x1 - 1.6, 0.1, sz + 0.5, { capM: 1 });
        } }
    }
    await ctx.yield();

    // gatehouse, town wall with bastions, field walls and the track's walls, a field well
    const terracePts = [];                                       // points on the dry-stone terraces at the cleft's mouth (trees stand on them)
    { const b = bTown;
      const merlons = (x0, x1, y, z, t = 0.5) => { b.surf(K.LIME, 0, 0).col(cLime, 0.85, 1); for (let x = x0 + 0.9; x < x1 - 0.8; x += 3.2) b.box(x, y, z - t / 2, x + 1.7, y + 1.05, z + t / 2); };
      for (const sx of [-1, 1]) {                                 // two battered gate towers and the lintel between them
        b.surf(K.MUD, 0, 1).col(cMud, 0.72, 1).frustum(sx * 8.4, 216, 7, 9.5, 6.2, 8.7, 0, 13, { m: 1 });
        b.surf(K.LIME, 0, 0).col(cLime, 0.85, 1).cbox(sx * 8.4, 13, 216, 6.6, 0.5, 9.1);
        for (const zz of [212, 220]) for (let i = -1; i <= 1; i++) b.cbox(sx * 8.4 + i * 2.4, 13.5, zz, 1.3, 1.1, 0.5);
        for (const xx of [-3, 3]) for (let i = -1; i <= 1; i++) b.cbox(sx * 8.4 + xx, 13.5, 216 + i * 3, 0.5, 1.1, 1.3);
        b.surf(K.LATTICE, 0, 1).col(cWoodL).box(sx * 8.4 - 0.8, 7.6, 220.3, sx * 8.4 + 0.8, 9.6, 221.0, { m: 1 });
        b.surf(K.LIME, 0, 0).col(cLime, 0.85, 1).cbox(sx * 8.4, 10.6, 216, 6.9, 0.4, 9.4); b.box(sx * 8.4 - 1.0, 7.4, 220.2, sx * 8.4 + 1.0, 9.8, 220.5);
        b.surf(K.POT, 0, 1).col(cDark); for (const yy of [3.2, 5.4]) b.box(sx * 8.4 - 0.16, yy, 220.6, sx * 8.4 + 0.16, yy + 1.1, 220.78);
        b.surf(K.WOOD, 0, 0).col(cWood); for (let i = -2; i <= 2; i++) b.box(sx * 8.4 + i * 1.2 - 0.09, 11.6, 220.2, sx * 8.4 + i * 1.2 + 0.09, 11.78, 221.0);
        b.surf(K.MUD, 0, 1).col(cMudD, 0.75, 1).box(sx * 8.4 - 3.2, 0, 220.6, sx * 8.4 + 3.2, 0.5, 221.5);
        jar(b, sx * 7.2, 0.5, 221.05, 1.25); jar(b, sx * 8.3, 0.5, 221.05, 0.95); basket(b, sx * 9.8, 0.5, 221.05, 1.2);
        b.surf(K.WOOD, 0, 1).col(cWood, 0.85, 1.1); b.push(M4.makeRotationY(sx * 0.35).setPosition(sx * 4.85, 0, 220.6)); b.box(-0.12, 0.2, 0, 0.12, 8.6, 4.4, { m: 1 }); b.pop();
        b.surf(K.WOOD, 0, 0).col(cWoodL).beam([sx * 8.4, 13.5, 216], [sx * 8.4, 18.5, 216], 0.12);
        addCloth(sx * 8.4, 18.4, 216, 1.5, Math.PI / 2, 2.4, 0, dyes[sx > 0 ? 2 : 4], dyes[1]);
      }
      b.surf(K.MUD, 0, 1).col(cMud, 0.85, 1).box(-5.2, 10.3, 213, 5.2, 12.8, 219, { bottom: true });
      merlons(-5.2, 5.2, 12.8, 218.7); b.surf(K.LIME, 0, 0).col(cLime, 0.85, 1).box(-5.3, 10.0, 218.9, 5.3, 10.35, 219.15);
      const run = (ax, az, bx, bz) => {                           // one straight run of the 9 m wall, outer face to the right of a -> b
        const len = Math.hypot(bx - ax, bz - az), ry = Math.atan2(-(bz - az), bx - ax);
        b.tr(ax, 0, az, ry);
        b.surf(K.MUD, 0, 1).col(cMud, 0.7, 1).frustum(len / 2, 0, len, 2.6, len, 1.7, 0, 8, { m: 1 });
        merlons(0, len, 8, 0.6, 0.45);
        for (let x = 36; x < len - 20; x += 72) { b.surf(K.MUD, 0, 1).col(cMudD, 0.7, 1).frustum(x, 1.4, 6.5, 6.5, 5.6, 5.6, 0, 11, { m: 1 }); b.surf(K.LIME, 0, 0).col(cLime, 0.85, 1).cbox(x, 11, 1.4, 6, 0.9, 6, { top: true }); }
        b.pop();
      };
      run(-288, 216, -11.6, 216); run(11.6, 216, 288, 216); run(288, 216, 288, -216);
      await ctx.yield();
      run(288, -216, -288, -216); run(-288, -216, -288, 216);
      await ctx.yield();
      // mud field walls on the grid, and along both sides of the cleared track
      b.surf(K.MUD, 0, 1).col(cMud, 0.7, 1);
      // a wall of hand-laid mud courses: lengths of uneven height near the eye, with gaps and fallen blocks
      const cWall = (() => { const a = L('#b9966c', 0.8); return [mix(a[0], cFloor[0], 0.4), mix(a[1], cFloor[1], 0.4), mix(a[2], cFloor[2], 0.4)]; })();
      const cCap = [cFloor[0] * 1.05, cFloor[1] * 1.05, cFloor[2] * 1.05];
      const wallTop = (x, z) => 1.02 + 0.3 * N.n2(x * 0.11 + z * 0.07, 3.3) + 0.12 * N.n2(x * 0.7, z * 0.7);
      const wrng = xr('fwalls');
      const fwall = (ax, az, bx, bz, near = path.nearestXZ((ax + bx) / 2, (az + bz) / 2).dist) => {
        const krng = wrng;
        const len = Math.hypot(bx - ax, bz - az), broken = near < 44, close = near < 27;
        if (len < 0.8) return;
        if (!broken) { const ya = groundY(ax, az), yb = groundY(bx, bz); b.col(cWall, 0.7, 1.08).beam([ax, ya + 0.15, az], [bx, yb + 0.15, bz], 0.5, 1.9); return; }
        const n = Math.max(2, Math.round(len / (close ? 2.0 : 3.3))), nx = -(bz - az) / len, nz = (bx - ax) / len;
        const J = []; for (let i = 0; i <= n; i++) { const t = (i + (i > 0 && i < n ? krng.range(-0.2, 0.2) * (close ? 1.7 : 1) : 0)) / n, o = i > 0 && i < n ? krng.range(-0.14, 0.14) : 0, x = mix(ax, bx, t) + nx * o, z = mix(az, bz, t) + nz * o; J.push([x, z, groundY(x, z), wallTop(x, z)]); }
        for (let i = 0; i < n; i++) {
          const A = J[i], B = J[i + 1];
          if (krng.chance(0.06)) {                               // a gap, with what fell out of it
            for (let q = 0; q < 2; q++) { const fx = mix(A[0], B[0], krng()) + krng.range(-1, 1), fz = mix(A[1], B[1], krng()) + krng.range(-1, 1);
              b.col(cWall, 0.65, 0.95).tr(fx, groundY(fx, fz), fz, krng.range(0, 3)); b.box(-0.45, -0.1, -0.28, 0.45, krng.range(0.2, 0.42), 0.28); b.pop(); }
            continue;
          }
          const drop = krng.chance(0.16) ? krng.range(0.15, 0.4) : 0, ta = A[2] + A[3] - drop, tb = B[2] + B[3] - drop - krng.range(0, 0.08), w = krng.range(0.46, 0.6), k = krng.range(0.9, 1.08);
          b.col([cWall[0] * k, cWall[1] * k, cWall[2] * k], 0.7, 1.05).beam([A[0], ta - 1.0, A[1]], [B[0], tb - 1.0, B[1]], w, 2.0);
          if (close) b.col(cCap, 0.95, 1.05).beam([A[0], ta + 0.02, A[1]], [B[0], tb + 0.02, B[1]], w + 0.1, 0.12);   // wind-laid dust on its slumped top
        }
      };
      // an east-west wall from xa to xb on the line zAt(x), cut where the track passes
      const ewall = (xa, xb, zAt, track) => {
        const tx = track ? pathXY(zAt((xa + xb) / 2))[0] : 1e6, lo = tx - 8.6, hi = tx + 8.6;
        if (xb <= lo || xa >= hi) { fwall(xa, zAt(xa), xb, zAt(xb)); return; }
        if (lo - xa > 1.5) fwall(xa, zAt(xa), lo, zAt(lo));
        if (xb - hi > 1.5) fwall(hi, zAt(hi), xb, zAt(xb));
      };
      const plotWalls = async (G, track) => {
        for (let j = 0; j <= G.NZ; j++) { for (let i = 0; i < G.NX; i++) ewall(G.X0 + i * G.W, G.X0 + (i + 1) * G.W, (x) => G.rowZ(j, x), track); await ctx.yield(); }
        for (let j = 0; j < G.NZ; j++) {
          for (let i = 0; i <= G.NX; i++) {
            const x = G.colX(j, i), z0 = G.rowZ(j, x), z1 = G.rowZ(j + 1, x);
            if (i < G.NX && G.merged[j * G.NX + i]) continue;
            if (track && Math.abs(x - pathXY((z0 + z1) / 2)[0]) < 12) continue;
            fwall(x, z0, x, z1);
          }
          for (let i = 0; i < G.NX; i++) if (G.split[j * G.NX + i] >= 0) ewall(G.colX(j, i), G.colX(j, i + 1), (x) => (G.rowZ(j, x) + G.rowZ(j + 1, x)) / 2, track);
          await ctx.yield();
        }
      };
      await plotWalls(PL, true);
      await plotWalls(PW, false);
      { const gr = xr('graves');                                 // the burial ground outside the west wall: lime-washed mounds, each with a head stone
        for (let i = 0; i < 150; i++) {
          const gx = -420 + (i % 15) * 6 + gr.range(-1.2, 1.2), gz = -104 + Math.floor(i / 15) * 9.5 + gr.range(-1.5, 1.5), hh = gr.range(0.8, 1.5), ry = 0.25 + gr.range(-0.15, 0.15);
          b.tr(gx, groundY(gx, gz), gz, ry);
          b.surf(K.LIME, 0, 0).col(cLime, 0.8, 1).box(-0.55, -0.1, 0.1, 0.55, 0.36, 2.3);
          b.surf(K.MUD, 0, 0).col(cStone, 0.8, 1).box(-0.34, -0.1, -0.14, 0.34, hh, 0.1); b.surf(K.LIME, 0, 0).col(cLime, 0.9, 1).box(-0.38, hh, -0.17, 0.38, hh + 0.24, 0.13);
          b.pop();
        }
        b.surf(K.MUD, 0, 1).col(cMud, 0.7, 1); }
      await ctx.yield();
      // low garden walls either side of the caravan track through the outlying quarter, open at the cross street
      { const tX = (z) => -110 + 2.5 * Math.sin((z + 440) * 0.02);
        for (const sx of [-1, 1]) for (let z = -240; z > -402; z -= 11.5) { if (z < -333 && z > -378) continue; fwall(tX(z) + sx * 9, z, tX(z - 11.5) + sx * 9, z - 11.5, 20); }
        for (const sx of [-1, 1]) for (const z of [-340.5, -375.5]) fwall(tX(z) + sx * 9, z, tX(z) + sx * 21, z, 30);
        for (const q of qLow) {                                   // the low houses between the towers: mud, a lime band and parapet, a door to the gardens
          const sd = q.x > -110 ? -1 : 1, fx = q.x + sd * q.hx;
          b.surf(K.MUD, 0, 1).col(cMud, 0.72, 1).box(q.x - q.hx, 0, q.z - q.hz, q.x + q.hx, q.h, q.z + q.hz, { m: 1 });
          b.surf(K.LIME, 0, 0).col(cLime, 0.85, 1).box(q.x - q.hx - 0.08, q.h - 0.5, q.z - q.hz - 0.08, q.x + q.hx + 0.08, q.h + 0.5, q.z + q.hz + 0.08, { bottom: true });
          b.surf(K.WOOD, 0, 1).col(cWood, 0.9, 1.1).box(Math.min(fx, fx + sd * 0.12), 0, q.z - 0.7, Math.max(fx, fx + sd * 0.12), 2.4, q.z + 0.7, { m: 1 });
          b.surf(K.LIME, 0, 0).col(cLime, 0.85, 1).box(Math.min(fx, fx + sd * 0.07), 2.4, q.z - 1.0, Math.max(fx, fx + sd * 0.07), 2.9, q.z + 1.0);
        }
        b.surf(K.MUD, 0, 1).col(cMud, 0.7, 1);
        for (const sx of [-1, 1]) for (const [za, zb2] of [[-258, -337], [-379, -410]]) fwall(-110 + sx * 21.2, za, -110 + sx * 21.2, zb2, 60);   // compound walls along the fronts
        // dry-stone terraces on the talus either side of the cleft's mouth: five contours, 8 to 32 m up
        const terr = (side, yT) => {
          let prev = null;
          for (let d = 14; d <= 92; d += 9.75) {
            let z0 = 472, z1 = 548; const xAt = (z) => pathXY(z)[0] + side * d;
            if (height(xAt(z0), z0) > yT || height(xAt(z1), z1) < yT) { prev = null; continue; }
            for (let q = 0; q < 12; q++) { const zm = (z0 + z1) / 2; if (height(xAt(zm), zm) < yT) z0 = zm; else z1 = zm; }
            const zc = (z0 + z1) / 2, cur = [xAt(zc), zc];
            if (prev && Math.hypot(cur[0] - prev[0], cur[1] - prev[1]) < 22) fwall(prev[0], prev[1], cur[0], cur[1], 60);
            prev = cur; terracePts.push(cur);
          }
        };
        for (const side of [-1, 1]) { for (const yT of [8, 14, 20, 26, 32]) terr(side, yT); await ctx.yield(); } }
      await ctx.yield();
      for (const sx of [-1, 1]) for (let z = 228; z < 486; z += 12) { fwall(pathXY(z)[0] + sx * 8.6, z, pathXY(z + 12)[0] + sx * 8.6, z + 12, 8.6); if (z === 348) await ctx.yield(); }
      await ctx.yield();
      { const wx = pathXY(330)[0] + 12.5, wz = 330, wy = groundY(wx, wz);                // the field well by the track, with a trough and jars
        b.tr(wx, wy, wz, 0.3);
        b.surf(K.MUD, 0, 1).col(cStone, 0.75, 1).lathe(0, 0, 0, [[1.3, 0], [1.25, 0.8], [0.95, 0.85], [0.9, 0.2]], 10); b.box(1.8, 0, -0.5, 4.4, 0.45, 0.5);
        b.surf(K.WOOD, 0, 0).col(cWoodL); b.beam([-1.2, 0, 0], [0.2, 3.4, 0], 0.14); b.beam([1.2, 0, 0], [-0.2, 3.4, 0], 0.14); b.beam([-1.6, 3.9, 1.2], [2.6, 2.2, -1.9], 0.1);
        jar(b, 0.3, 0, 1.9, 1.3); jar(b, -0.6, 0, 2.3, 1.0); basket(b, 2.4, 0.45, 0, 1.0);
        b.surf(K.POT, 0, 1).col(L('#1a2a30')).box(1.95, 0.4, -0.36, 4.25, 0.46, 0.36);                                  // water standing in the trough
        for (const [mx, mz, mr] of [[5.6, 2.6, 0.3], [6.4, -2.2, 1.2], [3.2, -4.2, 2.1]]) {                              // mats of drying dates beside it, in every season
          b.push(M4.makeRotationY(mr).setPosition(mx, 0.05, mz)); dateMat(b, 1.5, 1.0, 0.95 + 0.1 * mr, mr > 1); b.pop(); }
        basket(b, 4.6, 0, 3.6, 1.2); basket(b, 7.6, 0, -1.0, 1.0);
        b.pop(); }
      { const cz = 352, cx = pathXY(cz)[0] - 5.3, cy = groundY(cx, cz);                 // a loaded donkey cart left on the track, shafts down
        b.tr(cx, cy, cz, 1.3);
        b.surf(K.WOOD, 0, 1).col(cWoodL, 0.8, 1).box(-1.1, 0.75, -0.7, 1.1, 0.9, 0.7, { m: 1, bottom: true });
        b.box(-1.1, 0.9, -0.7, 1.1, 1.3, -0.62); b.box(-1.1, 0.9, 0.62, 1.1, 1.3, 0.7);
        b.beam([1.1, 0.8, -0.5], [3.1, 0.15, -0.5], 0.09); b.beam([1.1, 0.8, 0.5], [3.1, 0.15, 0.5], 0.09);
        for (const zz of [-0.82, 0.82]) { b.surf(K.WOOD, 0, 0).col(cWood); b.push(M4.makeRotationX(Math.PI / 2).setPosition(-0.2, 0.62, zz)); b.cyl(0, -0.05, 0, 0.62, 0.62, 0.1, 10); b.pop(); }
        b.surf(K.POT, 0, 1).col(L('#c9b48a', 0.8), 0.7, 1.05);                           // sacks of dates, roped down
        for (const [sx, sy, sz] of [[-0.6, 0.9, -0.25], [0.1, 0.9, 0.2], [0.65, 0.9, -0.2], [-0.2, 1.3, 0]]) b.sphere(sx, sy + 0.3, sz, 0.48, 7, 5, { sy: 0.7 });
        basket(b, -0.75, 0.9, 0.32, 1.1); jar(b, 2.3, 0, 1.3, 1.2); jar(b, 2.9, 0, 1.0, 0.9); basket(b, -2.0, 0, -0.6, 1.2);
        b.surf(K.POT, 0, 1).col(cRope, 0.7, 1);
        for (let q = 0; q < 6; q++) b.beam([-1.2 + q * 0.1, 1.45, -0.6], [2.6 + q * 0.06, 1.2 + 0.05 * q, 0.5 - q * 0.2], 0.05);   // palm ribs laid across the load
        b.pop();
        for (const [bz, sd] of [[306, 1], [334, -1], [378, 1], [402, -1], [428, 1]]) {     // bundles of palm ribs leaning on the track's walls
          const wx0 = pathXY(bz)[0] + sd * 8.25, gy = groundY(wx0, bz);
          b.surf(K.POT, 0, 1).col(cRope, 0.7, 1);
          for (let q = 0; q < 7; q++) b.beam([wx0 - sd * (1.1 + 0.05 * q), gy, bz + q * 0.16 - 0.5], [wx0 + sd * 0.1, gy + 2.5 + krng.range(-0.3, 0.5), bz + q * 0.13 - 0.4 + krng.range(-0.15, 0.15)], 0.06);
          basket(b, wx0 - sd * 1.5, gy, bz + 1.4, 1.1); jar(b, wx0 - sd * 0.9, gy, bz - 1.5, 1.2);
        } }
      if (season === 'harvest') {                                 // mats of drying dates beside the track and in the groves
        for (let i = 0; i < 46; i++) {
          const z = krng.range(250, 480), x = pathXY(z)[0] + krng.pick([-1, 1]) * krng.range(11, 60);
          const tone = 0.78 + 0.9 * (krng.range(0.6, 0.95) - 0.6); b.tr(x, groundY(x, z) + 0.06, z, krng.range(0, 3));
          dateMat(b, 1.6, 1.1, tone, i % 3 === 0); b.pop();
        }
      }
    }
    await ctx.yield();
    const PROW = { x: -140.5, z: 755.8, top: 297.6 };            // a rock stack standing out of the bay, 9 m right of the flight, carries the watchtower
    // rim: the ruined watchtower and two cairns beside the first seconds of the flight; cairns at the portal
    const bRim = S.makeBuilder(2048);
    { const b = bRim, wx = PROW.x, wz = PROW.z, wy = PROW.top - 0.4, NSEG = 40, cTower = L('#cdb48e', 0.78), R0 = 3.3, R1 = 2.4, DOOR = 3.9;
      const angD = (a, c) => Math.abs(((a - c + Math.PI * 3) % TAU) - Math.PI);
      // the broken top: tall to the north-east, a breach to the south, two octaves of raggedness, in 0.4 m courses
      const topAt = (a) => { const br = Math.exp(-Math.pow(angD(a, 5.0) / 0.42, 2));
        let hh = 6.4 + 2.2 * Math.cos(a - 0.9) + 1.3 * N.n2(Math.cos(a) * 1.3 + 7, Math.sin(a) * 1.3) + 0.4 * N.n2(Math.cos(a) * 3 + 3, Math.sin(a) * 3) - 4.2 * br;
        if (angD(a, DOOR) < 0.4) hh = Math.max(hh, 3.4);
        return Math.max(1.2, Math.round(hh / 0.4) * 0.4); };
      const P = (a, r, y) => [wx + Math.cos(a) * r, wy + y, wz - Math.sin(a) * r];
      b.surf(K.MUD, 0, 1);
      for (let i = 0; i < NSEG; i++) {
        const a0 = i / NSEG * TAU, a1 = (i + 1) / NSEG * TAU, am = (a0 + a1) / 2, hh = topAt(am), ro = R0 - 0.03 * hh;
        const k = 0.94 + 0.09 * Math.cos(am * 2 + 0.6) + 0.05 * N.n2(Math.cos(am) * 2, Math.sin(am) * 2 + 5), u0 = i * 0.52, u1 = u0 + 0.52;
        const c = [cTower[0] * k, cTower[1] * k, cTower[2] * k];
        b.col(c, 0.72, 1.02).quad(P(a0, R0, 0), P(a1, R0, 0), P(a1, ro, hh), P(a0, ro, hh), [u0, 0, u1, hh]);
        b.col(c, 0.5, 0.78).quad(P(a1, R1, 0), P(a0, R1, 0), P(a0, R1, hh), P(a1, R1, hh), [u0, 0, u1, hh]);
        b.col(c, 1.05, 1.05).quad(P(a0, ro, hh), P(a1, ro, hh), P(a1, R1, hh), P(a0, R1, hh));
        b.col(c, 0.8, 0.8);
        for (const [aa, an] of [[a0, am - TAU / NSEG], [a1, am + TAU / NSEG]]) {    // the broken ends of the courses where the neighbour stands lower
          const hn = topAt(an); if (hn < hh - 0.05) b.quad(P(aa, R0 - 0.03 * hn, hn), P(aa, R1, hn), P(aa, R1, hh), P(aa, ro, hh));
        }
      }
      b.surf(K.POT, 0, 1).col(cDark).quad(P(DOOR - 0.17, R0 - 0.02, 0), P(DOOR + 0.17, R0 - 0.02, 0), P(DOOR + 0.17, R0 - 0.08, 2.1), P(DOOR - 0.17, R0 - 0.08, 2.1));   // doorway
      b.surf(K.MUD, 0, 0).col(cStone, 0.9, 1.1).tr(wx + Math.cos(DOOR) * (R0 - 0.05), wy, wz - Math.sin(DOOR) * (R0 - 0.05), DOOR + Math.PI / 2);
      b.box(-0.85, 2.1, -0.2, 0.85, 2.42, 0.2); b.box(-0.82, 0, -0.16, -0.56, 2.1, 0.16); b.box(0.56, 0, -0.16, 0.82, 2.1, 0.16); b.pop();
      const cairn = (x, z, s, col, kind, cap = col) => {            // a base ring of boulders and four stacked on it, the top ones lime-washed
        const y = groundY(x, z) - 0.15 * s; b.surf(kind, 0, 0);
        for (let q = 0; q < 4; q++) { const a = q / 4 * TAU + krng.range(-0.3, 0.3), rr = 0.6 * s * krng.range(0.85, 1.1);
          b.col(col, 0.68, 1).sphere(x + Math.cos(a) * 0.58 * s, y + rr * 0.5, z + Math.sin(a) * 0.58 * s, rr, 6, 4, { sy: 0.72 }); }
        let yy = y + 0.5 * s;
        for (let q = 0; q < 4; q++) { const r = s * (0.64 - 0.115 * q);
          b.col(q >= 1 ? cap : col, 0.78, 1.04).sphere(x + krng.range(-0.1, 0.1) * s, yy + r * 0.62, z + krng.range(-0.1, 0.1) * s, r, 6, 4, { sy: 0.74 }); yy += r * 1.06; }
      };
      b.surf(K.MUD, 0, 1);
      for (let i = 0; i < 15; i++) {                              // its fallen blocks: round its foot, and down the stack onto the slope
        const top = i < 8, a = krng.range(0, TAU), rr = top ? krng.range(3.7, 5.0) : krng.range(7.5, 12), x = wx + Math.cos(a) * rr, z = wz + Math.sin(a) * rr * (top ? 0.8 : 1) - (top ? 1.2 : 0), sz = krng.range(0.3, 0.7) * (top ? 1 : 1.4);
        b.surf(K.MUD, 0, 1).col(cTower, 0.62, 1).tr(x, top ? wy + 0.15 : groundY(x, z) - 0.15, z, krng.range(0, 3)); b.box(-sz, 0, -sz * 0.7, sz, sz * krng.range(0.6, 1.1), sz * 0.7); b.pop();
      }
      cairn(-158.5, 789, 1.0, cTower, K.MUD); cairn(-150, 775.5, 0.8, cTower, K.MUD);
      const cLimeC = L(PALETTE[0], 0.95), cLimeB = L('#efe6d2', 0.88);
      // the portal's gateway: two square way-markers of mud-plastered stone, lime-washed on the upper third, with stepped caps
      // (8.7 m tall, clear of the 7 m ring), each on a plinth with a few boulders rolled against it
      for (const mx of [-121.6, -98.4]) {
        const my = groundY(mx, -440) - 0.2, cPl = L('#b89c74', 0.78);
        b.surf(K.MUD, 0, 1).col(cPl, 0.7, 1).frustum(mx, -440, 3.4, 3.4, 3.0, 3.0, my, my + 0.7, { m: 1 });
        b.surf(K.MUD, 0, 1).col(cTower, 0.75, 1.02).frustum(mx, -440, 2.6, 2.6, 2.0, 2.0, my + 0.7, my + 5.2, { m: 1 });
        b.surf(K.LIME, 0, 1).col(cLimeC, 0.85, 1).frustum(mx, -440, 2.0, 2.0, 1.7, 1.7, my + 5.2, my + 7.0, { m: 1 });
        b.surf(K.LIME, 0, 0).col(cLimeC, 0.9, 1); b.cbox(mx, my + 5.05, -440, 2.3, 0.3, 2.3); b.cbox(mx, my + 7.0, -440, 2.1, 0.32, 2.1); b.cbox(mx, my + 7.32, -440, 1.5, 0.36, 1.5); b.cbox(mx, my + 7.68, -440, 0.9, 0.42, 0.9); b.cbox(mx, my + 8.1, -440, 0.4, 0.7, 0.4);
        b.surf(K.LATTICE, 0, 1).col(cWood).box(mx - 0.42, my + 3.0, -438.76, mx + 0.42, my + 4.1, -438.6, { m: 1 });        // a niche for a lamp on the side we come from
        for (let q = 0; q < 5; q++) { const a = q * 1.3 + (mx < -110 ? 0.4 : 2.1), rr = krng.range(0.45, 0.8);
          b.surf(K.MUD, 0, 0).col(cLimeB, 0.6, 0.9).sphere(mx + Math.cos(a) * 2.3, my + 0.45 + rr * 0.3, -440 + Math.sin(a) * 2.3, rr, 6, 4, { sy: 0.7 }); }
      }
    }
    await ctx.yield();
    for (const [b, name] of [[bLane, 'lane-kit'], [bLane2, 'lane-kit2'], [bLane3, 'lane-kit3'], [bTown, 'town-kit'], [bRim, 'rim-kit']]) { const m = new THREE.Mesh(b.toGeometry(), kitMat); m.name = name; scene.add(m); await ctx.yield(); }

    // shutters: one instanced leaf, hinged and slammed in the vertex shader
    { const lb = S.makeBuilder(64); lb.surf(K.WOOD, 0, 0).col([1, 1, 1], 0.85, 1.05).box(0, 0, -0.025, 0.47, 1.26, 0.025, { m: 1, bottom: true });
      const g = lb.toGeometry(), n = shutters.length, sh = new Float32Array(n * 2);
      const im = new THREE.InstancedMesh(g, kitMat, n), col = new THREE.Color();
      shutters.forEach((s, i) => { im.setMatrixAt(i, s[0]); sh[i * 2] = s[1]; sh[i * 2 + 1] = s[2]; const lm = 0.3 * s[3][0] + 0.55 * s[3][1] + 0.15 * s[3][2]; im.setColorAt(i, col.setRGB(mix(s[3][0], lm, 0.25) * 0.8, mix(s[3][1], lm, 0.25) * 0.8, mix(s[3][2], lm, 0.25) * 0.8)); });
      g.setAttribute('iSh', new THREE.InstancedBufferAttribute(sh, 2));
      im.name = 'shutters'; im.frustumCulled = false; scene.add(im); }
    await ctx.yield();

    // airing carpets on poles over the roofs beside the roof run
    { const b = S.makeBuilder(1024); b.surf(K.WOOD, 0, 0).col(cWoodL);
      for (const t of towersW) {
        if (t.low || t.z > 0 || path.nearestXZ(t.x, t.z).dist > 42 || !krng.chance(0.55 * dens)) continue;
        const a = krng.range(0, Math.PI), w = krng.range(2.4, 3.6), ca = Math.cos(a), sa = Math.sin(a), y = t.h - 1.6;
        b.beam([t.x - ca * w / 2, y, t.z - sa * w / 2], [t.x - ca * w / 2, y + 2.5, t.z - sa * w / 2], 0.09); b.beam([t.x + ca * w / 2, y, t.z + sa * w / 2], [t.x + ca * w / 2, y + 2.5, t.z + sa * w / 2], 0.09);
        addCloth(t.x, y + 2.45, t.z, w * 0.94, a, krng.range(1.5, 2.2), 0, krng.pick(dyes), krng.pick(dyes));
      }
      await ctx.yield();
      // the terraces we skim: water jars, drying dates, basil in pots, a pigeon loft with perches, a carpet over the parapet
      for (const t of towersW) {
        if (t.low || t.z > 4 || path.nearestXZ(t.x, t.z).dist > 42) continue;
        const y = t.h - 1.6, ex = t.hx - 0.052 * t.h - 1.5, ez = t.hz - 0.052 * t.h - 1.5;
        if (ex < 2 || ez < 2) continue;
        const cx = krng.pick([-1, 1]), cz = krng.pick([-1, 1]);
        for (let q = 0; q < 3; q++) jar(b, t.x + cx * (ex - 0.3 - q * 0.75), y, t.z + cz * (ez - 0.2 - 0.3 * (q % 2)), krng.range(0.9, 1.4));
        b.surf(K.LATTICE, 0, 1).col(L(PALETTE[4], krng.range(0.7, 0.95))).push(M4.makeRotationY(krng.range(-0.3, 0.3)).setPosition(t.x - cx * ex * 0.35, y + 0.04, t.z + cz * ez * 0.3));
        b.box(-1.5, 0, -1.0, 1.5, 0.07, 1.0, { capM: 1 }); b.pop();
        for (let q = 0; q < 4; q++) {                              // basil
          const px = t.x - cx * (ex - 0.25), pz = t.z - cz * ez + cz * (0.5 + q * 0.8);
          b.surf(K.POT, 0, 1).col(cPot, 0.7, 1).cyl(px, y, pz, 0.16, 0.22, 0.3, 6); b.col(L(PALETTE[6], 0.9), 0.6, 1.1).sphere(px, y + 0.5, pz, 0.3, 6, 4);
        }
        if (krng.chance(0.6)) {                                    // pigeon loft on four legs
          const lx = t.x + cx * ex * 0.2, lz = t.z - cz * (ez - 0.9);
          b.surf(K.WOOD, 0, 0).col(cWoodL); for (const ax of [-0.75, 0.75]) for (const az of [-0.45, 0.45]) b.beam([lx + ax, y, lz + az], [lx + ax, y + 1.3, lz + az], 0.07);
          b.surf(K.WOOD, 0, 1).col(cWoodL, 0.8, 1).box(lx - 0.9, y + 1.3, lz - 0.6, lx + 0.9, y + 2.3, lz + 0.6, { m: 1, bottom: true });
          b.surf(K.LATTICE, 0, 1).col(cWood).box(lx - 0.8, y + 1.45, lz - 0.63, lx + 0.8, y + 2.15, lz + 0.63, { m: 1 });
          b.surf(K.LIME, 0, 0).col(cLime, 0.85, 1).box(lx - 1.0, y + 2.3, lz - 0.7, lx + 1.0, y + 2.38, lz + 0.7);
          b.surf(K.WOOD, 0, 0).col(cWood); b.beam([lx - 1.3, y + 1.3, lz + 0.75], [lx + 1.3, y + 1.3, lz + 0.75], 0.04); b.beam([lx - 1.3, y + 1.8, lz - 0.78], [lx + 1.3, y + 1.8, lz - 0.78], 0.04);
        }
        if (krng.chance(0.7)) {                                    // a carpet aired over the parapet on the side we pass
          const n = path.nearestXZ(t.x, t.z), toP = v0.set(0, 0, 0); path.pointAt(n.u, toP); const dx = toP.x - t.x, dz = toP.z - t.z;
          const onX = Math.abs(dx) > Math.abs(dz), sg = Math.sign(onX ? dx : dz) || 1, top = t.h + 0.12, off = (onX ? t.hx : t.hz) - 0.052 * t.h + 0.1;
          addCloth(t.x + (onX ? sg * off : krng.range(-0.4, 0.4) * ex), top, t.z + (onX ? krng.range(-0.4, 0.4) * ez : sg * off), krng.range(1.6, 2.4), onX ? Math.PI / 2 : 0, krng.range(1.6, 2.3), 0, krng.pick(dyes), krng.pick(dyes));
        }
        await ctx.yield();
      }
      { const qr = xr('qroofs'); let n = 0;                       // laundry and carpets on the roofs of the outlying quarter
        for (const q of quarter) {
          if (n >= 8 || Math.abs(q.x + 110) > 40) continue; n++;
          const a = qr.range(0, Math.PI), w = qr.range(2.4, 3.4), ca = Math.cos(a), sa = Math.sin(a), y = q.h - 1.6, sg = q.x > -110 ? -1 : 1;
          b.surf(K.WOOD, 0, 0).col(cWoodL);
          b.beam([q.x - ca * w / 2, y, q.z - sa * w / 2], [q.x - ca * w / 2, y + 2.5, q.z - sa * w / 2], 0.09); b.beam([q.x + ca * w / 2, y, q.z + sa * w / 2], [q.x + ca * w / 2, y + 2.5, q.z + sa * w / 2], 0.09);
          addCloth(q.x, y + 2.45, q.z, w * 0.94, a, qr.range(1.5, 2.2), 0, qr.pick(dyes), qr.pick(dyes));
          addCloth(q.x + sg * (q.hx - 0.052 * q.h + 0.1), q.h + 0.12, q.z + qr.range(-2, 2), qr.range(1.8, 2.6), Math.PI / 2, qr.range(1.8, 2.6), 0, qr.pick(dyes), qr.pick(dyes));
        } }
      const m = new THREE.Mesh(b.toGeometry(), kitMat); m.name = 'roof-poles'; scene.add(m); }
    await ctx.yield();

    // cloth
    const CU = { uCTime: { value: 0 }, uCSlamZ: { value: 1e5 }, uCWind: { value: new THREE.Vector3(-0.72, 0.16, -0.67).normalize() },
      uCSun: { value: new THREE.Color() }, uCAmb: { value: new THREE.Color() }, uCSunDir: { value: sunW } };
    { const g = makeClothGeometry(), n = cloths.length, A = new Float32Array(n * 4), B = new Float32Array(n * 4), C = new Float32Array(n * 3), D = new Float32Array(n * 3);
      cloths.forEach((c, i) => { A.set([c[0], c[1], c[2], c[3]], i * 4); B.set([c[4], c[5], c[6], c[7]], i * 4); C.set(c[8], i * 3); D.set(c[9], i * 3); });
      g.setAttribute('iA', new THREE.InstancedBufferAttribute(A, 4)); g.setAttribute('iB', new THREE.InstancedBufferAttribute(B, 4));
      g.setAttribute('iC', new THREE.InstancedBufferAttribute(C, 3)); g.setAttribute('iD', new THREE.InstancedBufferAttribute(D, 3));
      g.instanceCount = n; g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 20, 0), 600);
      const mat = new THREE.ShaderMaterial({ uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...HU, ...CU, uKBounce: KU.uKBounce }, vertexShader: CLOTH_VERT, fragmentShader: clothFrag(hero.glsl), fog: true, side: THREE.DoubleSide });
      const m = new THREE.Mesh(g, mat); m.name = 'cloth'; m.frustumCulled = false; scene.add(m); }
    await ctx.yield();

    // the falcon's two wingtips: nine barred primaries a side, held at the outer edges of the frame
    const wings = (() => {
      const b = S.makeBuilder(512), HX = 1.068, HY = 0.6009, TROW = [0, 0.14, 0.28, 0.42, 0.56, 0.7, 0.8, 0.88, 0.94, 0.98, 1], NROW = TROW.length - 1;      // frame half-extents at unit depth (62 degrees, 16:9)
      const ndc = (x, y, z) => [x * -z * HX, y * -z * HY, z];
      const poses = [[ndc(1.45, -1.35, -1.5), ndc(0.93, -0.66, -2.3)], [ndc(1.56, -1.7, -1.5), ndc(0.98, -0.93, -2.2)]];   // spread, folded: base -> tip. At rest only a slim wedge shows in each bottom corner; a beat sweeps the tip in
      // six primaries whose vanes overlap (each lies a little further from the eye than the one inside it and fans 4 degrees from
      // its neighbour), and four short coverts laid over their bases
      const feathers = [];
      for (let k = 0; k < 6; k++) feathers.push({ off: 0.085 * k, len: 1 - 0.085 * k, fan: (k - 2.5) * 0.06, w: 0.118, lift: 0.015 * k, id: k / 6 });
      for (let k = 0; k < 4; k++) feathers.push({ off: 0.085 * (k + 0.7), len: 0.33 - 0.035 * k, fan: (k - 1.5) * 0.08, w: 0.12, lift: 0.012 * k - 0.03, id: 0.53 + k * 0.11 });
      for (const sx of [1, -1]) for (const fe of feathers) {
        b.surf(K.FEATHER, fe.id + (sx > 0 ? 0 : 0.07), 1);
        const row = [];
        for (let i = 0; i <= NROW; i++) {
          const t = TROW[i], pose = [];
          for (let pi = 0; pi < 2; pi++) {
            const [Bc, Tc] = poses[pi];
            v0.set(Tc[0] - Bc[0], Tc[1] - Bc[1], Tc[2] - Bc[2]); const len = v0.length(); v0.normalize();
            v1.set((Bc[0] + Tc[0]) / 2, (Bc[1] + Tc[1]) / 2, (Bc[2] + Tc[2]) / 2).normalize();
            v2.crossVectors(v0, v1).normalize(); if (v2.x < 0) v2.negate();                  // across the blade, pointing out of the frame
            const fa = fe.fan * (pi ? 0.2 : 1), cf = Math.cos(fa), sf = Math.sin(fa), dx = v0.x * cf + v2.x * sf, dy = v0.y * cf + v2.y * sf, dz = v0.z * cf + v2.z * sf;
            const reach = len * fe.len * t, off = fe.off, w = fe.w * (1 - 0.2 * t) * (0.72 + 0.28 * sstep(0, 0.2, t)) * Math.max(0.1, t < 0.7 ? 1 : Math.sqrt(Math.max(0, 1 - Math.pow((t - 0.7) / 0.3, 2))));   // a broad vane that keeps most of its width, then rounds to its tip
            pose.push([Bc[0] + dx * reach + v2.x * off + v1.x * fe.lift, Bc[1] + dy * reach + v2.y * off + v1.y * fe.lift + 0.05 * Math.sin(t * 2.4), Bc[2] + dz * reach + v2.z * off + v1.z * fe.lift],
              [v2.x * w, v2.y * w, v2.z * w]);
          }
          const ids = [];
          for (const e of [-1, 0, 1]) ids.push(b.v(sx * (pose[0][0] + e * pose[1][0]), pose[0][1] + e * pose[1][1], pose[0][2] + e * pose[1][2], -sx * 0.2, 0.7, 0.65,
            sx * (pose[2][0] + e * pose[3][0]), pose[2][1] + e * pose[3][1], pose[2][2] + e * pose[3][2], t, e * 0.5));
          row.push(ids);
        }
        for (let i = 0; i < NROW; i++) for (let e = 0; e < 2; e++) { if (sx > 0) b.quad4(row[i][e + 1], row[i][e], row[i + 1][e], row[i + 1][e + 1]); else b.quad4(row[i][e], row[i][e + 1], row[i + 1][e + 1], row[i + 1][e]); }
      }
      const m = new THREE.Mesh(b.toGeometry(), kitMat); m.name = 'wingtips'; m.frustumCulled = false; m.renderOrder = 6; scene.add(m);
      return m;
    })();
    await ctx.yield();

    // ---- flora: date palms in the groves, acacias and thorn on the rim and the talus, tamarisk on the riverbed ----
    const wind = flora.makeWind({ direction: [-0.8, -0.6], strength: 0.3, speed: 0.8, gustiness: 0.5 });
    await ctx.yield();
    const prng = rng.fork('palms');
    const palmCol = season === 'harvest' ? { leaf: '#5a7838', leafLight: '#aeb468', dry: '#c98a2e' } : season === 'summer' ? { leaf: '#5e763c', leafLight: '#a8ac6a', dry: '#b09848' } : { leaf: '#56753a', leafLight: '#a3b06a', dry: '#a08a3a' };
    const palmNear = [0, 1, 2].map((i) => flora.palmGeometry({ rng: prng, detail: 0, fronds: 7, height: 9.5 + i * 2.2, ...palmCol }));
    await ctx.yield();
    // the gravel's height on an 8 m grid, so the tumbleweed rides the bars
    const BGX = 58, BGZ = 34, bedGrid = new Float32Array(BGX * BGZ);
    for (let j = 0; j < BGZ; j++) { for (let i = 0; i < BGX; i++) bedGrid[j * BGX + i] = groundY(-250 + i * 8, -494 + j * 8); if (j % 12 === 11) await ctx.yield(); }
    const bedY = (x, z) => { const fx = Math.min(BGX - 1.001, Math.max(0, (x + 250) / 8)), fz = Math.min(BGZ - 1.001, Math.max(0, (z + 494) / 8)), i = Math.floor(fx), j = Math.floor(fz), a = fx - i, b = fz - j, k = j * BGX + i;
      return mix(mix(bedGrid[k], bedGrid[k + 1], a), mix(bedGrid[k + BGX], bedGrid[k + BGX + 1], a), b); };
    await ctx.yield();
    const leafMat = flora.windMaterial({ wind, map: leafMap, backlight: 0.7, backlightTint: '#d6da9c' });
    hero.patchMaterial(leafMat, 'flora', {
      fragPars: 'float gHbLit = 1.0;\n', lit: 'gHbLit = (1.0 - 0.95 * hbS) * (1.0 - 0.85 * hbT);',
      vert: (s) => s.replace('vec4 mvPosition = viewMatrix * fWorld;', 'vHbW = fWorld.xyz;\n        vec4 mvPosition = viewMatrix * fWorld;'),
      frag: (s) => s.replace('* (RECIPROCAL_PI * fLeaf) *', '* (RECIPROCAL_PI * fLeaf * gHbLit) *'),
    });
    await ctx.yield();
    // far palms: a three-sided trunk and six bent frond cards from the leaf atlas (about 30 triangles)
    const farPalm = (H) => {
      const src = palmNear[0], suv = [src.getAttribute('uv').getX(0), src.getAttribute('uv').getY(0)], cell = flora.LEAF_CELLS.frond;
      const P = [], Nn = [], C = [], U = [], W = [], I = [], bark = L('#8a7458'), lf = L(palmCol.leaf), lfl = L(palmCol.leafLight, 0.8), lfDk = L('#2e4526');
      const lean = [prng.range(-0.8, 0.8), prng.range(-0.8, 0.8)];
      for (let j = 0; j < 2; j++) for (let i = 0; i < 3; i++) {
        const a = i / 3 * TAU, r = j ? 0.14 : 0.24;
        P.push(Math.cos(a) * r + lean[0] * j, j * H * 0.8, Math.sin(a) * r + lean[1] * j); Nn.push(Math.cos(a), 0, Math.sin(a)); C.push(bark[0] * (0.6 + 0.4 * j), bark[1] * (0.6 + 0.4 * j), bark[2] * (0.6 + 0.4 * j)); U.push(suv[0], suv[1]); W.push(0.25 * j, 0, 0, 0);
      }
      for (let i = 0; i < 3; i++) { const a = i, b = (i + 1) % 3; I.push(a, b, b + 3, a, b + 3, a + 3); }
      for (let k = 0; k < 6; k++) {
        const a = k * 2.4 + prng.range(-0.3, 0.3), el = 0.9 - 0.22 * k, Lf = H * 0.4, wv = H * 0.1, base = P.length / 3;
        const dx = Math.cos(a), dz = Math.sin(a), sxv = -dz, szv = dx;
        for (let i = 0; i <= 2; i++) {
          const t = i / 2, out = Lf * (t * Math.cos(el * (1 - t)) ), up = Lf * (Math.sin(el) * t - (0.8 + 0.14 * k) * t * t);
          for (const sgn of [-1, 1]) {
            P.push(lean[0] + dx * out + sxv * sgn * wv, H * 0.8 + up, lean[1] + dz * out + szv * sgn * wv); Nn.push(dx * 0.3, 0.95, dz * 0.3);
            const c = t < 0.25 ? lfDk : t < 0.75 ? lf : lfl; C.push(c[0], c[1], c[2]); U.push(sgn < 0 ? cell[0] : cell[2], mix(cell[3], cell[1], t)); W.push(0.25 + 0.5 * t, 0.6 * t, 1, 0);
          }
        }
        for (let i = 0; i < 2; i++) { const q = base + i * 2; I.push(q, q + 1, q + 3, q, q + 3, q + 2); }
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(Nn, 3));
      g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(U, 2)); g.setAttribute('wind', new THREE.Float32BufferAttribute(W, 4));
      g.setIndex(I); g.userData = { triangles: I.length / 3, height: H, radius: H * 0.4, kind: 'palm', glowColor: null };
      return g;
    };
    const palmFar = [10, 12, 14].map(farPalm);
    await ctx.yield();
    // close palms, for the trees within 22 m of the flight: a ringed trunk, twelve narrow folded fronds that arch and droop, a skirt
    // of four dry fronds hanging against the trunk, and clusters of dates in the harvest season (about 390 triangles)
    const closePalm = (H, r) => {
      const src = palmNear[0], suv = [src.getAttribute('uv').getX(0), src.getAttribute('uv').getY(0)], cell = flora.LEAF_CELLS.frond;
      const P = [], Nn = [], C = [], U = [], W = [], I = [];
      const bark = L('#8a7458'), barkD = L('#5c4c3a'), lfD = L('#2e4526'), lf = L(palmCol.leaf), lfl = L(palmCol.leafLight), dry = L(palmCol.dry), dryD = L(palmCol.dry, 0.6);
      const vtx = (x, y, z, nx, ny, nz, c, k, u0, v0, w0, w1, w2) => { P.push(x, y, z); Nn.push(nx, ny, nz); C.push(c[0] * k, c[1] * k, c[2] * k); U.push(u0, v0); W.push(w0, w1, w2, 0); return P.length / 3 - 1; };
      const m3 = (a, b2, t) => [mix(a[0], b2[0], t), mix(a[1], b2[1], t), mix(a[2], b2[2], t)];
      const az = r.range(0, TAU), bend = r.range(0.15, 0.5) * H * 0.3, NR = 8, NSD = 6, sTop = 0.045 * H;
      const axis = (t) => { const off = bend * (Math.pow(t, 1.4) - 0.25 * Math.sin(t * Math.PI)); return [Math.cos(az) * off, H * 0.8 * t, Math.sin(az) * off]; };
      for (let j = 0; j <= NR; j++) {                              // the trunk: rings of old leaf bases
        const t = j / NR, c = axis(t), rad = H * 0.019 * (1 + 0.9 * Math.exp(-t * 9)) * (1 - 0.3 * t) * (j % 2 ? 1.14 : 0.92);
        for (let i = 0; i < NSD; i++) { const a2 = i / NSD * TAU + j * 0.26; vtx(c[0] + Math.cos(a2) * rad, c[1], c[2] + Math.sin(a2) * rad, Math.cos(a2), 0.1, Math.sin(a2), j % 2 ? bark : barkD, 0.85 + 0.15 * t, suv[0], suv[1], sTop * t * t, 0, 0); }
      }
      for (let j = 0; j < NR; j++) for (let i = 0; i < NSD; i++) { const a2 = j * NSD + i, b2 = j * NSD + (i + 1) % NSD; I.push(a2, b2, b2 + NSD, a2, b2 + NSD, a2 + NSD); }
      const top = axis(1);
      { const base = P.length / 3, rb = H * 0.036;                 // the boss the fronds spring from
        for (let i = 0; i < 6; i++) { const a2 = i / 6 * TAU; vtx(top[0] + Math.cos(a2) * rb, top[1] - H * 0.012, top[2] + Math.sin(a2) * rb, Math.cos(a2), 0.3, Math.sin(a2), dryD, 1, suv[0], suv[1], sTop, 0, 0); }
        const ap = vtx(top[0], top[1] + H * 0.04, top[2], 0, 1, 0, m3(dryD, lfD, 0.5), 1, suv[0], suv[1], sTop, 0, 0);
        for (let i = 0; i < 6; i++) I.push(base + i, ap, base + (i + 1) % 6); }
      const frondStrip = (a2, el, len, hw, droop, segs, fold, cA, cB, cC) => {
        const dx = Math.cos(a2), dz = Math.sin(a2), sx = -dz, sz = dx, base = P.length / 3, um = (cell[0] + cell[2]) / 2;
        let px = top[0] + dx * H * 0.014, py = top[1], pz = top[2] + dz * H * 0.014;
        for (let i = 0; i <= segs; i++) {
          const t = i / segs, ang = el - droop * Math.pow(t, 1.4), ca = Math.cos(ang), sa = Math.sin(ang), ux = -sa * dx, uy = ca, uz = -sa * dz;
          const w = hw * (0.5 + 0.5 * Math.sin(Math.PI * Math.min(1, 0.14 + 0.72 * t))), c = t < 0.5 ? m3(cA, cB, t * 2) : m3(cB, cC, t * 2 - 1);
          const sway = sTop + Math.pow(t, 1.6) * len * 0.07, vv = mix(cell[3], cell[1], t);
          for (const e of [-1, 0, 1]) {
            const f = Math.abs(e) * fold * w, nl = Math.hypot(1, e * 0.45);
            vtx(px + sx * e * w + ux * f, py + uy * f, pz + sz * e * w + uz * f, (ux + sx * e * 0.45) / nl, uy / nl, (uz + sz * e * 0.45) / nl, c, e === 0 ? 0.92 : 1, e < 0 ? cell[0] : e > 0 ? cell[2] : um, vv, sway, 0.8 * t, 1);
          }
          px += ca * dx * len / segs; py += sa * len / segs; pz += ca * dz * len / segs;
        }
        for (let i = 0; i < segs; i++) for (let e = 0; e < 2; e++) { const q = base + i * 3 + e; I.push(q, q + 1, q + 4, q, q + 4, q + 3); }
      };
      let a = r.range(0, TAU);
      for (let k = 0; k < 12; k++) {
        const t = k / 11, el = mix(1.2, -0.25, Math.pow(t, 0.8)) + r.range(-0.1, 0.1), old = sstep(0.75, 1, t); a += 2.4 + r.range(-0.3, 0.3);
        frondStrip(a, el, H * 0.4 * r.range(0.88, 1.1) * (1 - 0.12 * old), H * 0.062, mix(0.8, 1.7, t), 5, 0.42, m3(lfD, dry, old * 0.5), m3(lf, dry, old * 0.8), m3(lfl, dry, old));
      }
      for (let k = 0; k < 4; k++) frondStrip(k * 1.571 + r.range(-0.4, 0.4), -0.8 + r.range(-0.15, 0.1), H * r.range(0.24, 0.31), H * 0.05, 0.85, 3, 0.25, dryD, m3(dryD, dry, 0.6), dry);
      if (season === 'harvest') for (let k = 0; k < 3; k++) {       // clusters of ripe dates hanging under the crown
        const a2 = k * 2.1 + r.range(0, 1), cx = top[0] + Math.cos(a2) * H * 0.05, cy = top[1] - H * 0.075, cz = top[2] + Math.sin(a2) * H * 0.05, rx = H * 0.022, ry = H * 0.05, co = L(PALETTE[4], 0.9), base = P.length / 3;
        for (const [ox, oy, oz] of [[0, 1, 0], [1, 0, 0], [0, 0, 1], [-1, 0, 0], [0, 0, -1], [0, -1, 0]]) vtx(cx + ox * rx, cy + oy * ry, cz + oz * rx, ox, oy, oz, co, oy < 0 ? 0.6 : 1, suv[0], suv[1], sTop, 0, 0);
        for (let i = 0; i < 4; i++) { const p1 = base + 1 + i, p2 = base + 1 + (i + 1) % 4; I.push(base, p2, p1, base + 5, p1, p2); }
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(Nn, 3));
      g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(U, 2)); g.setAttribute('wind', new THREE.Float32BufferAttribute(W, 4));
      g.setIndex(I); g.userData = { triangles: I.length / 3, height: H, radius: H * 0.4, kind: 'palm', glowColor: null };
      return g;
    };
    const palmClose = [];
    for (let i = 0; i < 3; i++) { palmClose.push(closePalm(9.5 + i * 2.2, xr('closepalm' + i))); await ctx.yield(); }
    await ctx.yield();
    const palmPts = [];
    const palmLattice = async (G, pr, chance) => {               // a palm every 8.6 m in the plots that are groves, clear of their walls
      for (let gz = G.Z0 - 8; gz < G.Z0 + G.D * G.NZ + 10; gz += 8.6) {
        for (let gx = G.X0 + 3; gx < G.X0 + G.W * G.NX - 2; gx += 8.6) {
          const x = gx + pr.range(-2, 2), z = gz + pr.range(-2, 2);
          if (fieldAt(x, z) !== 3 || fieldAt(x - 1.8, z - 1.8) !== 3 || fieldAt(x + 1.8, z + 1.8) !== 3) continue;
          if (!pr.chance(chance)) continue;
          const n = path.nearestXZ(x, z);
          if (n.dist < 11.5) continue;
          palmPts.push({ x, y: groundY(x, z), z, s: pr.range(0.82, 1.2), rot: pr.range(0, TAU), d: n.dist, u: n.u, v: pr.int(0, 2) });
        }
        await ctx.yield();
      }
    };
    await palmLattice(PL, prng, Math.min(0.8, 0.8 * dens));
    await palmLattice(PW, xr('westpalms'), 0.75);
    { const pr = xr('qpalms'), tX = (z) => -110 + 2.5 * Math.sin((z + 440) * 0.02);   // two groves in the gardens either side of the caravan track
      for (let i = 0; i < 78; i++) {
        const z = -247 - i * 2.36 + pr.range(-1.5, 1.5), lat = pr.chance(0.4) ? pr.range(22, 64) : pr.range(12.6, 17.5), x = tX(z) + (i % 2 ? 1 : -1) * lat;
        const sc = pr.range(0.85, 1.15), rot = pr.range(0, TAU), vv = pr.int(0, 2);
        if ((z < -348 && z > -368) || (z < -418 && z > -432) || inQuarter(x, z, 2.2)) continue;
        const n = path.nearestXZ(x, z);
        if (n.dist > 11.8) palmPts.push({ x, y: groundY(x, z), z, s: sc, rot, d: n.dist, u: n.u, v: vv });
      } }
    for (let i = 0; i < 10; i++) {                              // a few tall palms just outside the track's walls: their shadows bar the track
      const z = 296 + i * 10.5 + prng.range(-3, 3), lat0 = prng.range(9.8, 10.6), s = prng.range(0.92, 1.1), rot = prng.range(0, TAU);
      // under a low sun all ten stand on the sunward side: every other one close by (its trunk's bar crosses the track),
      // the rest far enough out that the shade of the crown itself lands on the track
      const lowSun = sunL.y < 0.5, side = lowSun ? (sunL.x > 0 ? 1 : -1) : (i % 2 ? -1 : 1);
      const lat = lowSun && i % 2 ? Math.min(30, Math.max(14, Math.abs(sunL.x) / Math.max(sunL.y, 0.02) * 0.72 * 13.9 * s)) : lat0;
      const x = pathXY(z)[0] + side * lat, n = path.nearestXZ(x, z);
      palmPts.push({ x, y: groundY(x, z), z, s, rot, d: n.dist, u: n.u, v: 1 + (i % 2) });
    }
    await ctx.yield();
    for (const q of palmPts) if (q.d < 22) q.v = (q.v % 3) + 3;       // the trees beside the flight take the close model (variants 3 to 5)
    { // sun shadows: the hero sweeps one height map of towers, walls, gate, mosque and palm crowns along the key light
      const occ = [], ob = (x, z, hxW, hzW, h) => occ.push({ x: z, z: -x, hx: hzW, hz: hxW, h });
      ob(-150, 216, 138.5, 1.1, 8.6); ob(150, 216, 138.5, 1.1, 8.6); ob(0, -216, 288, 1.1, 8.6); ob(288, 0, 1.1, 216, 8.6); ob(-288, 0, 1.1, 216, 8.6);
      ob(-30, 111, 6.3, 5.8, 6.6); ob(-21.4, 100.6, 1.5, 1.5, 29); ob(-21.4, 100.6, 1.0, 1.0, 42);
      const crownR = sunL.y < 0.5 ? 2.0 : 0.9;                    // under a low sun the crown's shade is one long patch
      for (const q of palmPts) {                                 // a crown is a boss and four fronds, not one black disc
        const hh = 0.72 * (9.5 + 2.2 * (q.v % 3)) * q.s; occ.push({ x: q.z, z: -q.x, r: crownR * q.s, h: hh, thin: true });
        for (let k = 0; k < 4; k++) { const a = q.rot + k * 1.571 + 0.6, rr = 2.3 * q.s; occ.push({ x: q.z + Math.sin(a) * rr, z: -(q.x + Math.cos(a) * rr), r: 0.9 * q.s, h: hh - 0.4, thin: true }); }
        occ.push({ x: q.z, z: -q.x, r: 0.85, h: hh, thin: true, post: true });                // the trunk: its bar of shade crosses the track
      }
      await hero.bakeShadows(v0.set(sunL.z, sunL.y, -sunL.x), occ, { sunSlots: true });
    }
    await ctx.yield();
    const palms = flora.makeScatter({ rng: prng, points: palmPts, variants: [...palmNear, ...palmClose], farVariants: palmFar, farDistance: 28, material: leafMat, tint: 0.14, hue: 0.03 });
    scene.add(palms.object);
    await ctx.yield();
    const srng = rng.fork('scrub');
    const acaciaG = [0, 1].map((i) => flora.pineGeometry({ rng: srng, detail: 0, height: 5 + i * 1.6, leaf: '#657040', leafLight: '#929a5e', leafDark: '#434b2a', bark: '#8a745c' }));
    const bushG = [0, 1].map(() => flora.bushGeometry({ rng: srng, detail: 0, size: 1.1, leaf: '#b0a862', leafLight: '#d8cf8e', leafDark: '#807a48', bark: '#8a7a5e' }));
    const tamG = [0, 1].map(() => flora.bushGeometry({ rng: srng, detail: 0, size: 1.5, leaf: '#7d8a5c', leafLight: '#93a06e', leafDark: '#5f6c46', bark: '#a8957a', barkDark: '#7a6a56' }));
    for (const g of tamG) { g.scale(0.78, 1.6, 0.78); if (g.userData.height) g.userData.height *= 1.6; }      // tamarisk: dusty olive plumes, taller than they are wide
    await ctx.yield();
    const bushG1 = [0, 1].map((i) => flora.bushGeometry({ rng: xr('bush1' + i), detail: 1, size: 1.1, leaf: '#b0a862', leafLight: '#d8cf8e', leafDark: '#807a48', bark: '#8a7a5e' }));
    await ctx.yield();
    const acaciaPts = [], bushPts = [], bushNearPts = [], tamPts = [], gravelBushPts = [];
    // ledges of bedded rock on the benches of the cleft walls, 10 to 24 m either side of the stoop: thin slabs lying with the slope
    const ledgeSpots = T.scatter({ rng: rng.fork('ledges'), terrain, path, count: 60, band: [9, 16], clearance: 8, scale: [1.3, 2.9], scalePower: 1.4, stretch: [0.55, 0.9],
      slope: [0.2, 1], align: 0.9, tilt: 0.05, sink: 0.22, footprint: 0.3, attempts: 80, density: (x, z) => {
        if (z < 500 || z > 765) return 0;
        const px = pathXY(z)[0], K = shoulderK(z), e = Math.max(0, Math.abs(x - px) - 5.5 - 3 * K), wall = cleftWall(e, x > px, K, z, 0), q = wall / 7 - Math.floor(wall / 7);
        return q > 0.05 && q < 0.75 ? 1 : 0; } });                  // only on the treads of the 7 m benches
    seatBay(ledgeSpots);
    await ctx.yield();
    for (let i = 0; i < ledgeSpots.count; i += 4) {
      const x = ledgeSpots.positions[i * 3] + srng.range(-1, 1), z = ledgeSpots.positions[i * 3 + 2] + srng.range(-1, 1), y = groundY(x, z);
      if (path.distanceTo(x, y + 3, z) > 9) acaciaPts.push({ x, y: y - 0.2, z, s: srng.range(0.7, 1.05), rot: srng.range(0, TAU), d: 20, u: 0.1, v: i % 2 });
    }
    for (let i = 0; i < 40; i++) {                              // acacias beside the rim run, on the cleft's ledges and the talus
      const z = srng.range(486, 792), lat = srng.pick([-1, 1]) * srng.range(10.5, 24), x = pathXY(z)[0] + lat, y = groundY(x, z);
      if (path.distanceTo(x, y + 3, z) > 10) acaciaPts.push({ x, y, z, s: srng.range(0.8, 1.3), rot: srng.range(0, TAU), d: 20, u: 0.1, v: i % 2 });
    }
    for (const [ax, az, as] of [[-207, 786, 1.5], [-209, 772, 1.2], [-213, 812, 1.3], [-136, 793, 1.35], [-127, 777, 1.1], [-221, 795, 1.0]])   // and framing the first view
      acaciaPts.push({ x: ax, y: groundY(ax, az), z: az, s: as, rot: srng.range(0, TAU), d: 20, u: 0.02, v: acaciaPts.length % 2 });
    for (const [az, lat, as] of [[646, -19.5, 1.75], [630, -21, 1.5], [612, -19, 1.9], [588, 18.5, 1.6]]) { const ax = pathXY(az)[0] + lat; acaciaPts.push({ x: ax, y: groundY(ax, az) - 0.3, z: az, s: as, rot: az * 0.37, d: 20, u: 0.16, v: acaciaPts.length % 2 }); }
    // (round fourteen) the east wall of the notch beside the stoop was 40 m of bare banded rock in mid-frame: acacias cling to its benches
    for (const [az, lat, as] of [[644, 24, 1.5], [636, 19, 1.6], [630, 27, 1.9], [622, 16.5, 1.4], [618, 32, 1.8], [610, 23, 1.6], [602, 29, 1.5], [596, 17.5, 1.3], [656, 30, 1.7], [664, 21, 1.4],
      [648, 15, 1.4], [640, 13.5, 1.3], [632, 14.5, 1.5], [624, 13, 1.2], [616, 15, 1.5], [606, 13.5, 1.3], [598, 14, 1.4],
      [566, -19, 1.5], [558, -23, 1.8], [550, -20, 1.4], [543, -25, 1.7], [536, -20, 1.5], [528, -23, 1.3], [572, -24, 1.6]]) {      // (the last seven stand on the west shoulder, lower down, where the town shows in the notch)
      const ax = pathXY(az)[0] + lat, ay = groundY(ax, az);
      if (path.distanceTo(ax, ay + 3, az) > 11) acaciaPts.push({ x: ax, y: ay - 0.3, z: az, s: as, rot: az * 0.53, d: 20, u: 0.16, v: acaciaPts.length % 2 }); }
    { const tr = xr('terracetrees'); let n = 0;                 // acacias on the dry-stone terraces at the cleft's mouth
      for (const tp of terracePts) {
        const keep = tr.chance(0.42), x = tp[0] + tr.range(-1.5, 1.5), z = tp[1] + 1.6, sc = tr.range(0.8, 1.25), rot = tr.range(0, TAU);
        if (!keep || n >= 22) continue;
        const y = groundY(x, z);
        if (path.distanceTo(x, y + 3, z) > 12) { acaciaPts.push({ x, y: y - 0.2, z, s: sc, rot, d: 20, u: 0.3, v: n % 2 }); n++; }
      } }
    await ctx.yield();
    for (let i = 0; i < 110; i++) {                             // thorn bushes and tussocks
      const z = srng.range(470, 815), lat = srng.pick([-1, 1]) * (7.5 + 60 * srng() * srng()), x = pathXY(z)[0] + lat, y = groundY(x, z);
      if (path.distanceTo(x, y + 0.5, z) > 6.5) (Math.abs(lat) < 22 && z < 580 ? bushNearPts : bushPts).push({ x, y, z, s: srng.range(0.5, 1.2), rot: srng.range(0, TAU), d: 20, u: 0.1, v: i % 2 });
    }
    { const br = xr('mouthbushes');                             // more thorn on the talus either side of the cleft's mouth, in clumps
      for (let i = 0; i < 30; i++) {
        const z = br.range(472, 548), lat = br.pick([-1, 1]) * br.range(8.5, 26), x = pathXY(z)[0] + lat, y = groundY(x, z), sc = br.range(0.6, 1.3), rot = br.range(0, TAU);
        if (path.distanceTo(x, y + 0.5, z) > 7) bushNearPts.push({ x, y, z, s: sc, rot, d: 20, u: 0.1, v: i % 2 });
      } }
    { const tr = xr('gravelbush');                              // low thorn in clumps on the gravel and in the gardens of the quarter
      for (let i = 0; i < 40; i++) {
        const cz = tr.range(-458, -236), cx = -110 + tr.pick([-1, 1]) * tr.range(5, 48), n = 2 + tr.int(0, 2);
        for (let q = 0; q < n; q++) {
          const x = cx + tr.range(-2.2, 2.2), z = cz + tr.range(-2.2, 2.2), sc = tr.range(0.32, 0.8), rot = tr.range(0, TAU);
          if (inQuarter(x, z, 1.5) || Math.abs(x + 110) < 4.2 || path.nearestXZ(x, z).dist < 4.5) continue;
          gravelBushPts.push({ x, y: groundY(x, z), z, s: sc, rot, d: 30, u: 0.92, v: q % 2 });
        }
      } }
    for (let i = 0; i < 46; i++) {                              // tamarisk along both banks of the dry river and round the portal track
      const x = srng.range(-420, 260), z = (i % 2 ? -292 : -592) + srng.range(-16, 16) + (i % 5 === 0 ? (i % 2 ? -60 : 60) : 0);
      if (Math.abs(x + 110) < 14) continue;
      tamPts.push({ x, y: groundY(x, z), z, s: srng.range(1.3, 2.6), rot: srng.range(0, TAU), d: 60, u: 0.9, v: i % 2 });
    }
    for (let i = 0; i < 12; i++) {                              // clumps beside the caravan track on the last run to the portal
      const z = -298 - i * 10.5 + srng.range(-3, 3), x = -110 + (i % 2 ? 1 : -1) * srng.range(9.5, 17), sc = srng.range(1.0, 1.8), rot = srng.range(0, TAU);
      if (path.nearestXZ(x, z).dist > 8.8 && !inQuarter(x, z, 2)) tamPts.push({ x, y: groundY(x, z), z, s: sc, rot, d: 60, u: 0.9, v: i % 2 });
    }
    await ctx.yield();
    for (const pl of [acaciaPts, bushPts, bushNearPts]) for (const p of pl) p.y -= bayDrop(p.x, p.z);        // (round sixteen) what grows on the flanks of the stoop comes down with the bay
    const acacias = flora.makeScatter({ rng: srng, points: acaciaPts, variants: acaciaG, material: leafMat, tint: 0.12 });
    await ctx.yield();
    const bushes = flora.makeScatter({ rng: srng, points: bushPts, variants: bushG, material: leafMat, tint: 0.2 });
    await ctx.yield();
    const tamarisk = flora.makeScatter({ rng: srng, points: tamPts, variants: tamG, material: leafMat, tint: 0.15 });
    await ctx.yield();
    const bushesNear = flora.makeScatter({ rng: xr('bushesNear'), points: bushNearPts, variants: bushG1, material: leafMat, tint: 0.2 });
    await ctx.yield();
    const gravelBushes = flora.makeScatter({ rng: xr('gravelBushes'), points: gravelBushPts, variants: bushG, material: leafMat, tint: 0.2 });
    scene.add(acacias.object, bushes.object, tamarisk.object, bushesNear.object, gravelBushes.object);

    await ctx.yield();
    // ---- rocks on the rim, in the cleft and on the talus ----
    const rockMat = T.makeRockMaterial({ terrain, varnish: 0, strata: 0.35, bedRelief: 0.3, detail: 0.25, cracks: 0.12, bump: 0.6 });
    hero.patchMaterial(rockMat, 'rock');
    await ctx.yield();
    const spots = T.scatter({ rng: rng.fork('rocks'), terrain, path, count: Math.round(92 * detail), band: [9, 75], clearance: 8.5, scale: [0.7, 3.4],
      density: (x, z) => (z > 468 ? 1 : 0) });
    await ctx.yield();
    const rockGA = T.rockGeometry({ rng: rng.fork('rockA'), detail: 2, color: '#b98a5e', colorB: '#d3ab7c' }), rockGB = T.rockGeometry({ rng: rng.fork('rockB'), detail: 1, color: '#b98a5e', colorB: '#d3ab7c' });
    const rocks = T.makeInstances(rockGA, rockMat, seatBay(spots), { lod: rockGB, path, lodRatio: 9 });
    scene.add(rocks.object);
    await ctx.yield();
    // the talus at the cleft's mouth: more fallen rock close beside the flight, and slabs on its lowest benches
    const mouthSpots = T.scatter({ rng: xr('mouthrocks'), terrain, path, count: Math.round(22 * detail), band: [9, 25], clearance: 8.5, scale: [0.8, 2.6], attempts: 60,
      density: (x, z) => (z > 470 && z < 530 ? 1 : 0) });
    await ctx.yield();
    scene.add(T.makeInstances(rockGB, rockMat, seatBay(mouthSpots), {}).object);
    await ctx.yield();
    { const y0 = groundY(PROW.x, PROW.z) - 3;
      const g = T.seaStackGeometry({ rng: rng.fork('prow'), height: PROW.top - y0, radius: 6, segments: 14, ledges: 6, undercut: 0.14, flute: 0.08, lobes: 0.16, waist: 0.06, lean: 0.01, top: 'flat',
        sink: 4, color: '#b98a5e', colorB: '#dcbc90', colorTop: '#c7a57a', wetBase: 0 });
      const m = new THREE.Mesh(g, rockMat); m.position.set(PROW.x, y0, PROW.z); m.name = 'prow-stack'; scene.add(m); }
    await ctx.yield();
    { const flatSpots = []; for (let i = 0; i < spots.count; i++) { const x = spots.positions[i * 3], z = spots.positions[i * 3 + 2];
        if (terrain.surfaceNormalAt(x, z, v1).y > 0.8) flatSpots.push([x, z, spots.scales[i]]); }
      terrain.addContact(flatSpots); }                          // contact discs are projected straight down: only on level ground
    await ctx.yield();
    const ledgeGA = T.rockGeometry({ rng: rng.fork('ledgeA'), kind: 'slab', detail: 1, color: '#b98a5e', colorB: '#dcbc90' });
    const ledges = T.makeInstances(ledgeGA, rockMat, ledgeSpots,
      { lod: T.rockGeometry({ rng: rng.fork('ledgeB'), kind: 'slab', detail: 0, color: '#b98a5e', colorB: '#dcbc90' }), path, lodRatio: 14 });
    scene.add(ledges.object);
    await ctx.yield();
    const mouthLedges = T.scatter({ rng: xr('mouthledges'), terrain, path, count: 22, band: [9, 20], clearance: 8, scale: [1.3, 2.9], scalePower: 1.4, stretch: [0.55, 0.9],
      slope: [0.2, 1], align: 0.9, tilt: 0.05, sink: 0.22, footprint: 0.3, attempts: 80, density: (x, z) => (z > 470 && z < 512 && Math.abs(x - pathXY(z)[0]) > 7 ? 1 : 0) });
    await ctx.yield();
    scene.add(T.makeInstances(ledgeGA, rockMat, mouthLedges, {}).object);
    await ctx.yield();
    const stones = T.scatter({ rng: rng.fork('stones'), terrain, path, count: Math.round(380 * detail), band: [3, 75], clearance: 3.5, scale: [0.2, 0.95], attempts: 30,
      density: (x, z) => (z > 728 || (z < -226 && z > -596 && !inQuarter(x, z, 1.5)) ? 1 : 0) });
    await ctx.yield();
    const stoneGA = T.rockGeometry({ rng: rng.fork('stoneA'), kind: 'boulder', detail: 1, color: '#e6dcc6', colorB: '#c4b496' }), stoneGB = T.rockGeometry({ rng: rng.fork('stoneB'), kind: 'boulder', detail: 0, color: '#e6dcc6', colorB: '#c4b496' });
    const stoneMesh = T.makeInstances(stoneGA, rockMat, seatBay(stones), { lod: stoneGB, path, lodRatio: 7 });
    scene.add(stoneMesh.object);
    await ctx.yield();
    terrain.addContact(stones);
    await ctx.yield();
    // scree: fans of fallen rock below the benches of the bay and the cleft, and more slabs and stones on the east side of its mouth
    const screeG = T.rockGeometry({ rng: xr('screeG'), kind: 'rock', detail: 0, color: '#c79a6c', colorB: '#e3c08e' });
    const scree = T.scatter({ rng: xr('scree'), terrain, path, count: Math.round(400 * detail), band: [10, 70], clearance: 8, scale: [0.3, 1.2], slope: [0.3, 1], attempts: 40,
      density: (x, z) => { if (z < 520 || z > 790) return 0; const lat = x - pathXY(z)[0]; return N.n2(z * 0.075 + (lat > 0 ? 9 : 0), Math.abs(lat) * 0.014) > 0.05 ? 1 : 0.1; } });
    await ctx.yield();
    scene.add(T.makeInstances(screeG, rockMat, seatBay(scree), {}).object);
    await ctx.yield();
    const mouthE = T.scatter({ rng: xr('mouthE'), terrain, path, count: 30, band: [10, 64], clearance: 9, scale: [1.3, 2.9], scalePower: 1.4, stretch: [0.55, 0.9],
      slope: [0.2, 1], align: 0.9, tilt: 0.05, sink: 0.22, footprint: 0.3, attempts: 80, density: (x, z) => (z > 470 && z < 540 && x > pathXY(z)[0] + 9 ? 1 : 0) });
    await ctx.yield();
    scene.add(T.makeInstances(T.rockGeometry({ rng: xr('mouthEslab'), kind: 'slab', detail: 0, color: '#b98a5e', colorB: '#dcbc90' }), rockMat, mouthE, {}).object);
    await ctx.yield();
    const mouthS = T.scatter({ rng: xr('mouthS'), terrain, path, count: 60, band: [9, 70], clearance: 8, scale: [0.35, 1.3], slope: [0.25, 1], attempts: 40,
      density: (x, z) => (z > 468 && z < 542 && x > pathXY(z)[0] + 8 ? 1 : 0) });
    await ctx.yield();
    scene.add(T.makeInstances(screeG, rockMat, mouthS, {}).object);
    await ctx.yield();
    // the riverbed: water-worn boulders and flat slabs on the bars, darker than the gravel so they stand off it, and cobbles under the flight
    const bedRocks = T.scatter({ rng: rng.fork('bedrocks'), terrain, path, count: 26, band: [10.5, 40], clearance: 10, scale: [1.3, 2.7], attempts: 60,
      density: (x, z) => (z < -262 && z > -436 && !inQuarter(x, z, 3) ? 1 : 0) });
    await ctx.yield();
    const bedRockMesh = T.makeInstances(T.rockGeometry({ rng: rng.fork('bedrockA'), kind: 'boulder', detail: 2, color: '#cbb894', colorB: '#a8946e' }), rockMat, bedRocks,
      { lod: T.rockGeometry({ rng: xr('bedrockB'), kind: 'boulder', detail: 1, color: '#cbb894', colorB: '#a8946e' }), path, lodRatio: 9 });
    scene.add(bedRockMesh.object);
    await ctx.yield();
    terrain.addContact(bedRocks);
    await ctx.yield();
    const bedSlabs = T.scatter({ rng: xr('bedslabs'), terrain, path, count: 16, band: [10.5, 40], clearance: 10, scale: [1.6, 3.2], stretch: [0.5, 0.8], align: 0.8, tilt: 0.08, sink: 0.3, attempts: 60,
      density: (x, z) => (z < -262 && z > -436 && !inQuarter(x, z, 3) ? 1 : 0) });
    await ctx.yield();
    const bedSlabMesh = T.makeInstances(T.rockGeometry({ rng: xr('bedslabA'), kind: 'slab', detail: 1, color: '#c2ad88', colorB: '#a08a66' }), rockMat, bedSlabs, {});
    scene.add(bedSlabMesh.object);
    await ctx.yield();
    terrain.addContact(bedSlabs);
    await ctx.yield();
    const bedCobbles = T.scatter({ rng: xr('bedcobbles'), terrain, path, count: Math.round(150 * detail), band: [2.5, 34], clearance: 3.2, scale: [0.25, 0.85], attempts: 30,
      density: (x, z) => (z < -236 && z > -470 && !inQuarter(x, z, 1.5) ? 1 : 0) });
    await ctx.yield();
    const bedCobbleMesh = T.makeInstances(T.rockGeometry({ rng: xr('bedcobbleA'), kind: 'boulder', detail: 1, color: '#cbb894', colorB: '#9c8a68' }), rockMat, bedCobbles,
      { lod: stoneGB, path, lodRatio: 9 });
    scene.add(bedCobbleMesh.object);
    await ctx.yield();
    terrain.addContact(bedCobbles);
    await ctx.yield();
    const pebbleSpots = T.scatter({ rng: rng.fork('trackpebbles'), terrain, path, count: Math.round(240 * detail), band: [1.2, 9], clearance: 2.2, scale: [0.1, 0.4], attempts: 60,
      density: (x, z) => (z > 228 && z < 486 ? 1 : 0) });
    await ctx.yield();
    const pebbleMesh = T.makeInstances(T.rockGeometry({ rng: rng.fork('pebbleA'), kind: 'pebble', detail: 0, color: '#d9c8a6', colorB: '#a8926e' }), rockMat, pebbleSpots, {});
    scene.add(pebbleMesh.object);
    await ctx.yield();
    const grass = await flora.makeGrassAsync({ rng: rng.fork('grass'), path, uRange: [0, uRim + 0.035], radius: 48, count: Math.round(3000 * detail), heightAt: (x, z) => groundY(x, z) - bayDrop(x, z), wind, map: leafMat.map,
      density: (x, z) => (terrain.surfaceNormalAt(x, z, v1).y > 0.93 ? 1 : 0),
      root: '#b7a26c', tip: '#ead9a0', dry: '#e0cd94', dryAmount: 0.8, height: [0.45, 0.95], width: [0.7, 1.3], flowers: 0, chunks: 1, fade: [120, 160] }, ctx.yield);
    await ctx.yield();
    // dry tufts at the foot of the track's walls and on the field margins; tussocks on the gravel bars
    const tufts = await flora.makeGrassAsync({ rng: rng.fork('tufts'), path, uRange: [uCleft - 0.01, uGate - 0.004], radius: 17, bias: 0.55, count: Math.round(3600 * detail), heightAt: groundY, wind, map: leafMat.map,
      density: (x, z) => { const lat = Math.abs(x - pathXY(z)[0]); return z < 497 && lat > 7.3 && (lat < 8.3 || lat > 9.1) ? 1 : 0; }, root: '#5a5230', tip: '#d2c282', dry: '#cdb878', dryAmount: 0.6, height: [0.24, 0.58], width: [0.42, 0.85], flowers: 0, chunks: 1, fade: [90, 130] }, ctx.yield);
    await ctx.yield();
    const tussocks = await flora.makeGrassAsync({ rng: rng.fork('tussocks'), path, uRange: [uWall + 0.005, 1], radius: 34, bias: 1.0, count: Math.round(1000 * detail), heightAt: groundY, wind, map: leafMat.map,
      density: (x, z, lat) => (z < -228 && lat > 3.5 && N.n2(x * 0.12, z * 0.12) > 0.18 && !inQuarter(x, z, 1) ? 1 : 0), root: '#62583a', tip: '#e6d9a8', dry: '#e0cf9c', dryAmount: 0.85, height: [0.3, 0.68], width: [0.48, 0.9], flowers: 0, chunks: 1, fade: [110, 150] }, ctx.yield);
    await ctx.yield();
    const alfalfa = await flora.makeGrassAsync({ rng: rng.fork('alfalfa'), path, uRange: [uCleft, uGate], radius: 40, bias: 1.0, count: Math.round(2100 * detail), heightAt: groundY, wind, map: leafMat.map,
      density: (x, z) => (fieldAt(x, z) === 0 ? 1 : 0), root: '#4a6630', tip: '#9aa85c', dry: '#b9b060', dryAmount: 0.25, height: [0.3, 0.6], width: [0.8, 1.5], flowers: 0, chunks: 1, fade: [100, 140] }, ctx.yield);
    scene.add(grass.object, tufts.object, tussocks.object, alfalfa.object);
    await ctx.yield();
    const ridges = T.makeHorizonRidges({ rng: rng.fork('ridges'), layers: 3, radius: [3300, 4700], height: [200, 430], base: 120, jagged: 0.22, coverage: 0.6,
      fog: scene.fog, sunDir: sunW, sunColor: look.skyA.lightColor, colorNear: '#a8845e', rim: 0.3 });
    scene.add(ridges.object);
    await ctx.yield();

    // ---- fauna ----
    const sk = look.skyA;
    const fSun = new THREE.Color(sk.lightColor), fSunB = new THREE.Color(look.skyB.lightColor);
    const fLight = { sunDir: sunL.clone(), sunColor: fSun.clone(), sunIntensity: sk.lightIntensity, sky: sk.ambientColor, skyIntensity: sk.ambientIntensity, ground: sk.groundLight, groundIntensity: sk.ambientIntensity };
    const fauna = F.makeFauna(scene, { light: fLight, rng: rng.fork('fauna') });
    await ctx.yield();
    // (flock cure 1) every bird keeps 2.0 m of clear air from the flown line, BY PLACE, bird by bird: each course stays where it is laid and each spread is
    // live's; a bird whose own reach comes within 2 m of the line is moved by what it alone lacks (the kit's keepClear with each, walked for the crossings
    // and the flocks that fly with us over the stretch they fly and a little more; a soaring raven straight up, since one moved down goes into the rock),
    // the deal is held at three scatters, the wheel over the town, both crossings and both flocks that fly with us have a small wander of their own, and
    // each clearing is made in slices
    const clearOf = (from, to, up) => ({ path, dist: 2, each: true, from, to, step: 2, ...(up ? { up: true } : {}) });
    const pig = cast.doves ? { body: '#efeae0', belly: '#f4f0e8', wingC: '#e6e0d4', tip: '#cfc8ba', head: '#f0ece2', neckC: '#eae4d8', tailC: '#e9e3d6', trail: '#d9d2c4' }
      : { body: '#7d8794', belly: '#9aa3ad', wingC: '#8d97a3', tip: '#2a2c33', head: '#5a6470', neckC: '#4f6a5c', tailC: '#6a737f', trail: '#d0d4d8' };
    fauna.add(await F.makeFlockAsync({ rng: rng.fork('ravens'), species: 'eagles', count: 3, size: 1.5, center: [-143, 315, 733], radius: 10, spread: [70, 22, 70], soarRadius: 12, soarLift: 2.5, keepClear: clearOf(0, 0.3, true),
      body: '#0d0d12', belly: '#15151a', wingC: '#101016', tip: '#08080a', head: '#0d0d12', tailC: '#0b0b0f' }, ctx.yield), { always: true });
    await ctx.yield();
    fauna.add(await F.makeFlockAsync({ rng: xr('lipravens'), species: 'eagles', count: 3, size: 1.5, center: [-139, 265, 690], radius: 4, spread: [70, 22, 70], soarRadius: 6.5, soarLift: 1.5, keepClear: clearOf(0, 0.3, true),
      body: '#0d0d12', belly: '#17171c', wingC: '#111117', tip: '#08080a', head: '#0d0d12', tailC: '#0b0b0f' }, ctx.yield), { always: true });      // a pair of ravens wheeling 20 m ahead and left of the eye as it tips over the lip (flock cure 1: by place their course's centre stands 17.6 m over the line; a raven that lacks air is lifted clear of it, 41 m at the median)
    await ctx.yield();
    fauna.add(await F.makeFlockAsync({ rng: rng.fork('townbirds'), species: 'gulls', count: Math.round(50 * dens * detail), size: 0.75, speed: 12, center: [20, 54, 60], radius: 130, height: 10, spread: [34, 12, 34], wander: [1.2, 0.8, 1.6, 0.35], maxSigma: 3, keepClear: clearOf(0, 1), ...pig }, ctx.yield));
    await ctx.yield();
    fauna.add(await F.makeFlockAsync({ rng: rng.fork('flush'), species: 'gulls', count: Math.round(34 * dens), size: 0.75, speed: 13, spread: [5, 4, 26], wander: [0.8, 0.5, 0.8, 0.35], maxSigma: 3, keepClear: clearOf(uGate - 0.08, uGate + 0.12), ...pig,
      cross: { path, u: uGate + 0.02, lead: 30, angle: 22, side: 1, height: 1.5, rise: 24, span: 150, duration } }, ctx.yield));
    await ctx.yield();
    fauna.add(await F.makeFlockAsync({ rng: rng.fork('escort'), species: 'gulls', count: Math.round(46 * dens), size: 0.75, spread: [16, 7, 30], wander: [0.8, 0.5, 0.8, 0.35], maxSigma: 3, keepClear: clearOf(uLaneEnd - 0.04, 1), flap: 4, glide: 0.2, ...pig,
      along: { path, side: -14, up: 0.5, lead: 28, from: uLaneEnd - 0.01, to: 0.975, drift: 7 } }, ctx.yield));
    await ctx.yield();
    fauna.add(await F.makeFlockAsync({ rng: rng.fork('swifts'), species: 'swifts', count: 12, spread: [4.5, 2.2, 14], wander: [0.8, 0.5, 0.8, 0.7], maxSigma: 3, keepClear: clearOf(uGate - 0.1, uLaneEnd + 0.05), along: { path, side: 1.8, up: 2, lead: 32, from: uGate - 0.07, to: uLaneEnd + 0.02, drift: 6 } }, ctx.yield));
    await ctx.yield();
    fauna.add(await F.makeFlockAsync({ rng: xr('clap'), species: 'gulls', count: Math.round(30 * dens), size: 0.75, speed: 13, spread: [4, 2.5, 12], wander: [0.8, 0.5, 0.8, 0.35], maxSigma: 3, keepClear: clearOf(uLaneEnd - 0.07, uLaneEnd + 0.1), ...pig,
      cross: { path, u: uLaneEnd + 0.014, lead: 20, angle: 26, side: -1, height: 3, rise: 20, span: 110, duration } }, ctx.yield));       // a clap of pigeons off the low house as we rise over it
    await ctx.yield();
    const goat = { ...F.HERD_PRESETS.antelope, h: 0.72, hip: 0.72, bodyLen: 1.12, depth: 0.56, width: 0.36, neckLen: 0.18, neckAng: 32, neck: [0.2, 0.14], headLen: 0.28, headPitch: 34, ears: 0.2, tail: 0.14, tailType: 'scut', horns: 0.3, leg: [0.07, 0.05, 0.035] };
    const goatCol = { coat: '#3a2c24', belly: '#54402f', legs: '#2a201a', sock: '#cdbfa6', accent: '#e6dccb', tints: ['#2c2420', '#3a2c24', '#553c28', '#6e5238', '#d9cdb6', '#30261f'], pattern: 'patches', fill: 0.5 };      // black and dark brown, a few piebald: they read against the pale bed and the track
    fauna.add(F.makeHerd({ rng: rng.fork('wellgoats'), preset: goat, count: Math.round(7 * dens), size: 0.95, mode: 'graze', center: [pathXY(320)[0] + 15.5, 0, 320], radius: 6, heightAt: groundY, path, clear: 9.5, ...goatCol }), { range: 480 });
    await ctx.yield();
    fauna.add(F.makeHerd({ rng: xr('trackgoats'), preset: goat, count: Math.round(12 * dens), size: 0.95, mode: 'migrate', gait: 'walk', spread: [2.2, 30], maxSigma: 3, closed: false, start: 0.42, heightAt: groundY, ...goatCol,
      route: [[pathXY(452)[0], 0, 452], [pathXY(400)[0], 0, 400], [pathXY(350)[0], 0, 350], [pathXY(300)[0], 0, 300], [0, 0, 262], [0, 0, 232]] }), { range: 480 });      // a dozen driven home up the track, under the flight
    await ctx.yield();
    fauna.add(F.makeHerd({ rng: rng.fork('lanegoats'), preset: goat, count: Math.round(14 * dens), size: 0.95, mode: 'migrate', gait: 'run', spread: [2.6, 34], maxSigma: 3, closed: false, ...goatCol,
      route: [[0, 0, 214], [0, 0, 170], [0, 0, 128], [-6, 0, 108], [-10, 0, 92], [-10, 0, 50], [-10, 0, 14]] }), { range: 480 });
    await ctx.yield();
    fauna.add(F.makeHerd({ rng: rng.fork('goats'), preset: goat, count: Math.round(21 * dens), size: 0.98, mode: 'migrate', gait: 'run', spread: [12, 36], maxSigma: 3, heightAt: groundY, ...goatCol,
      cross: { path, u: 0.9, lead: 60, angle: 90, side: -1, span: 300, duration } }), { range: 480 });
    await ctx.yield();
    fauna.add(F.makeHerd({ rng: rng.fork('camels'), preset: { ...F.HERD_PRESETS.horse, h: 1.95, hump: 0.3, neckLen: 0.9, neckAng: 54, neck: [0.17, 0.1], headLen: 0.36, headPitch: 10, bodyLen: 1.15, depth: 0.6, leg: [0.07, 0.045, 0.035], mane: 0, tail: 0.3, tailType: 'tuft', chest: 1.2, croup: 0.02 },
      count: cast.caravan ? 30 : 6, mode: 'migrate', gait: cast.caravan ? 'walk' : 'run', spread: cast.caravan ? [2, 170] : [5, 34], maxSigma: 3, heightAt: groundY,
      coat: '#c9ae84', belly: '#d8c4a0', legs: '#a8906c', accent: '#b89a70', pattern: 'none', fill: 0.5, tints: ['#c9ae84', '#b89c76', '#d6c09a'],
      cross: { path, u: cast.caravan ? 0.9 : 0.95, lead: cast.caravan ? 60 : 56, angle: cast.caravan ? 90 : 88, side: -1, span: cast.caravan ? 420 : 320, duration } }), { range: cast.caravan ? 700 : 480 });

    await ctx.yield();
    // (round fourteen) the string comes down the track toward us on the west verge: heads and long necks first, then side-on as the eye passes 6 m off;
    // it weaves a little, so no two walk in the same line. Duller coats, a higher hump, a deeper chest. (flock cure 1) live's track began at the gate, and
    // the kit sets the animals that lag behind its first point on a straight run-on, which lay down the lane under the flown line: seven points now lead
    // the track in from the west over the open ground north of the town wall (z 225.2) to live's first point, so that run-on lies west of the line (the track is 49.6 m longer, and the kit deals the string's place by the track's length: on any seed it walks elsewhere along it than live's at the same moment, on seed 7 about 37 m behind)
    { const cr2 = [[225.2, -46], [225.2, -28], [225.2, -16], [225.2, -9.5], [226.1, -7.05], [228.2, -5.65], [232.1, -4.9], [236, -4.6], [262, -5.6], [290, -6.2], [318, -5.2], [346, -6.2], [374, -5.3], [402, -6.3], [430, -5.4], [452, -6.2]].map(([z, o]) => [pathXY(z)[0] + o, 0, z]);
      fauna.add(F.makeHerd({ rng: xr('trackcamels'), preset: { ...F.HERD_PRESETS.horse, h: 1.95, hump: 0.45, neckLen: 0.9, neckAng: 54, neck: [0.17, 0.1], headLen: 0.36, headPitch: 10, bodyLen: 1.15, depth: 0.6, leg: [0.07, 0.045, 0.035], mane: 0, tail: 0.3, tailType: 'tuft', chest: 1.5, croup: 0.02 },
        count: 12, mode: 'migrate', gait: 'walk', spread: [1.1, 124], maxSigma: 3, closed: false, start: 0.5, heightAt: groundY, route: cr2,
        coat: '#7c6a54', belly: '#96826a', legs: '#5e4e3e', accent: '#4a3c2e', pattern: 'none', fill: 0.45, tints: ['#7c6a54', '#8a7860', '#6a5a48', '#94806a'] }), { range: 700 }); }      // dark coats: they read against the pale track from the cleft
    await ctx.yield();
    // ---- air: motes, falling pebbles in the cleft, grit streaks behind the gust, dust devils, tumbleweed ----
    const time = { value: 0 }, set = fx.fxGroup(); scene.add(set.object);
    set.add(fx.makeParticles({ rng: rng.fork('motes'), preset: 'dust', time, count: Math.round(1500 * detail), box: [42, 24, 42], colors: ['#d9c49a', '#c9a878', '#b08a58'] }));
    await ctx.yield();
    const pebbles = set.add(fx.makeParticles({ rng: rng.fork('pebbles'), preset: 'ash', time, count: Math.round(800 * detail), box: [20, 12, 20], follow: 'xz', center: [0, 300, 0], velocity: [0, -10, 0], velocityRandom: [1.5, 4, 1.5],
      size: [0.06, 0.2], colors: ['#b98a5e', '#8a6a4a', '#d3ab7c'], opacity: 1 }));
    await ctx.yield();
    const grit = set.add(fx.makeParticles({ rng: rng.fork('grit'), preset: 'rain', time, count: Math.round(1700 * detail), box: [46, 26, 46], velocity: [-26, 1.5, -22], velocityRandom: [5, 2, 5],
      size: [0.03, 0.08], stretch: 0.045, colors: ['#e8c890', '#c09a66', '#8a6238'], additive: 0.15, opacity: 0.8 }));
    const rain = weather === 'wet' ? set.add(fx.makeParticles({ rng: rng.fork('drops'), preset: 'rain', time, count: Math.round(900 * detail), velocity: [-9, -20, -7], size: [0.05, 0.11], colors: ['#b9a58a', '#8f7a62', '#d9c8a8'], opacity: 0.7 })) : null;
    pebbles.setOpacity(0); grit.setOpacity(0); if (rain) rain.setOpacity(0);
    await ctx.yield();
    const devilOpt = { time, color: '#d9bf94', colorTop: '#ead8b6', shadowColor: '#8f7050', sunDir: sunW, sunColor: look.skyA.lightColor };
    const devilA = set.add(fx.makeDustDevil({ rng: rng.fork('devilA'), ...devilOpt, position: [118, groundY(118, 368), 368], height: 48, radius: [1, 8.5], wander: 16 }));
    const devilB = set.add(fx.makeDustDevil({ rng: rng.fork('devilB'), ...devilOpt, position: [-196, groundY(-196, -404), -404], height: 40, radius: [0.9, 7], wander: 10 }));
    await ctx.yield();
    const DU = { uDTime: time, uDKs: { value: new THREE.Vector3() }, uDFront: { value: 1600 }, uDLit: { value: new THREE.Color() },
      uDStr: { value: new THREE.Color(wallColors?.tan || MUD).multiplyScalar(lookName === 'dawn' ? 1.0 : 1.25) }, uDStrK: { value: lookName === 'dawn' ? 1 : 0.6 } };
    const dustLit = new THREE.Color('#ffe0a8');
    { const dr = xr('portaldust'), NB = Math.round(24 * (0.6 + 0.4 * detail)), NSH = Math.round(44 * (0.6 + 0.4 * detail)), n0 = NB + NSH, NST = 8, NCD = 14, n = n0 + NST + NCD, A = new Float32Array(n * 4), B = new Float32Array(n * 4);
      const sr3 = xr('streamers');
      for (let i = n0; i < n; i++) {
        if (i < n0 + NST) {                                       // streamers of grit pouring off the front's face over the outlying towers
          const k = (i - n0 + sr3()) / NST;
          A.set([0, sr3.range(75, 165), -236 - 215 * k, sr3.range(140, 230)], i * 4); B.set([sr3(), 0, 2, sr3.range(0.34, 0.5)], i * 4);
        } else {                                                  // dust hanging over the track where the caravan treads
          const z = 246 + 188 * (i - n0 - NST + sr3()) / NCD, x = pathXY(z)[0] - 5.7 + sr3.range(-1.4, 1.4);
          A.set([x, groundY(x, z) + 1.2, z, sr3.range(3.6, 6.5)], i * 4); B.set([sr3(), sr3.range(0.09, 0.16), 3, sr3.range(0.3, 0.44)], i * 4);
        }
      }
      for (let i = 0; i < n0; i++) {
        const sheet = i >= NB;
        A.set([dr(), sheet ? 0.55 : dr.range(1.5, 6), sheet ? dr.range(-455, -245) : dr.range(-445, -285), sheet ? dr.range(6, 11) : dr.range(12, 25)], i * 4);
        B.set([dr(), sheet ? dr.range(18, 28) : dr.range(9, 16), sheet ? 1 : 0, sheet ? dr.range(0.3, 0.46) : dr.range(0.15, 0.25)], i * 4);
      }
      const g = new THREE.InstancedBufferGeometry();
      { const P = [], I = [], NC = 8;                              // a strip of eight quads: billows and sheets use it as one square, a streamer bends along it
        for (let q = 0; q <= NC; q++) P.push(-1 + 2 * q / NC, -1, 0, -1 + 2 * q / NC, 1, 0);
        for (let q = 0; q < NC; q++) I.push(q * 2, q * 2 + 2, q * 2 + 3, q * 2, q * 2 + 3, q * 2 + 1);
        g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setIndex(I); }
      g.setAttribute('iA', new THREE.InstancedBufferAttribute(A, 4)); g.setAttribute('iB', new THREE.InstancedBufferAttribute(B, 4));
      g.instanceCount = n; g.boundingSphere = new THREE.Sphere(new THREE.Vector3(-110, 5, -350), 900);
      const mat = new THREE.ShaderMaterial({ uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...HU, ...DU }, vertexShader: DUST_VERT, fragmentShader: dustFrag(hero.glsl),
        fog: true, transparent: true, depthWrite: false, side: THREE.DoubleSide });
      const m = new THREE.Mesh(g, mat); m.name = 'portal-dust'; m.frustumCulled = false; m.renderOrder = 4; scene.add(m); }
    await ctx.yield();
    const NTW = 36, tumble = (() => {
      const b = S.makeBuilder(256); b.surf(K.LATTICE, 0, 1).col(L('#e0cc98'), 0.85, 1.2).sphere(0, 0, 0, 0.62, 8, 5);
      const g = b.toGeometry(); { const uv = g.getAttribute('uv'), p = g.getAttribute('position'); for (let i = 0; i < uv.count; i++) uv.setXY(i, p.getX(i) * 1.3 + p.getZ(i), p.getY(i) * 1.3); }
      const im = new THREE.InstancedMesh(g, kitMat, NTW); im.frustumCulled = false; im.name = 'tumbleweed'; scene.add(im); return im;
    })();
    const tw = []; { const r = rng.fork('tw'); for (let i = 0; i < NTW; i++) tw.push({ z: r.range(-470, -250), ph: r.range(0, 1), sp: r.range(13, 24), s: r.range(0.6, 1.5), hop: r.range(0.3, 1.6) }); }
    const E4 = new THREE.Euler(), P4 = new THREE.Vector3(), S4 = new THREE.Vector3();
    // the rare sun shaft
    const shaft = rare ? (() => {
      const m = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 1, 32, 1, true), new THREE.ShaderMaterial({ uniforms: { ...HU, uShaftCol: { value: new THREE.Color('#ffe9b8') }, uShaftK: { value: 0 }, uShaftIn: { value: 0 } },
        vertexShader: SHAFT_VERT, fragmentShader: shaftFrag(hero.glsl), transparent: true, depthWrite: false, depthTest: true, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }));
      m.quaternion.setFromUnitVectors(YA, sunW); m.frustumCulled = false; m.renderOrder = 5; m.name = 'sun-shaft'; scene.add(m); return m;
    })() : null;
    // round sixteen: three rents in the wall as it arrives: a pool of low warm sun on the dark ground under each (hero.setRent) and a beam standing in the dust above it. [metres inside the shadow's edge, z, radius]
    const rents = !rare && look.shadow && look.el > 20 ? (() => {       // (under a sun that stands high enough to come down through a rent: the noon look)
      const geo = new THREE.CylinderGeometry(2.4, 1, 1, 24, 1, true), mat = new THREE.ShaderMaterial({ uniforms: { ...HU, uShaftCol: { value: new THREE.Color('#ffb060') }, uShaftK: { value: 0 }, uShaftIn: { value: 0 }, uShaftSoft: { value: 1 } },
        vertexShader: SHAFT_VERT, fragmentShader: shaftFrag(hero.glsl), transparent: true, depthWrite: false, depthTest: true, blending: THREE.AdditiveBlending, side: THREE.DoubleSide });
      { const P = geo.attributes.position.array, Nn = geo.attributes.normal.array; for (let i = 0; i < P.length; i += 3) { const l = Math.hypot(P[i], P[i + 2]) || 1; Nn[i] = P[i] / l; Nn[i + 1] = 0; Nn[i + 2] = P[i + 2] / l; } }   // the beam widens upward; its normals stay square to the axis (the shader reads the soft profile from them)
      return [[85, -380, 16], [58, -268, 12], [135, -470, 20]].map(([dx, z, R], i) => { const m = new THREE.Mesh(geo, mat); m.quaternion.setFromUnitVectors(YA, sunW); m.scale.set(1e-4, 420, 1e-4); m.frustumCulled = false; m.renderOrder = 5; m.name = 'rent-' + i; scene.add(m); return { m, dx, z, R }; });
    })() : null;
    await ctx.yield();

    bayApply();                                                   // (round sixteen) everything is placed: the flanks of the stoop come down
    // ---- per-frame: one clock for the storm (u), ambient loops on time ----
    const heroSun = new THREE.Vector3(sunW.z, sunW.y, -sunW.x), tmpC = new THREE.Color();
    const bA = new THREE.Color(look.bounceA[0]).multiplyScalar(look.bounceA[1] / 0.24 * 0.24), bB = new THREE.Color(look.bounceB[0]).multiplyScalar(look.bounceB[1]);
    const storm = { front: 2400, shadow: 2100, tear: 900, gust: 0 }; let fauQ = -1;
    const skyBZ = skyB.uniforms.uZenith.value.clone(), skyBM = skyB.uniforms.uMid.value.clone();
    // things far too small to tell from the rim (jars and lofts on the roofs, shutter leaves, the sand sheets that only run once the
    // gust is up) are left out of the picture until the flight is down in the groves: about 45k triangles off the stoop's frames
    const lateKit = ['roof-poles', 'shutters'].map((n) => scene.getObjectByName(n)).filter(Boolean), midKit = ['lane-kit', 'lane-kit2', 'lane-kit3', 'cloth'].map((n) => scene.getObjectByName(n)).filter(Boolean), sandMesh = hero.object.getObjectByName('parapet-sand');
    const tearX = (u) => 300 - 600 * (u - uTear0) / 0.3;
    const windU = wind.uniforms.uFloraWind.value;
    const spotKeys = rare ? [[uTop - 0.03, 190, -215], [uTop + 0.03, 120, -160], [uTop + 0.075, 10, -150], [uWall, -66, -212], [uLevel - 0.03, -106, -400], [uLevel, -110, -436], [1, -110, -440]] : null;
    const spotX = rare ? curveFn(spotKeys.map((k) => [k[0], k[1]])) : null, spotZ = rare ? curveFn(spotKeys.map((k) => [k[0], k[2]])) : null;
    function update(dt, t, camera, u) {
      time.value = t; KU.uKTime.value = t; CU.uCTime.value = t;
      const gust = sstep(uGust0, uGust1, u);
      // the veil runs ahead of the front: sky, key, fill and haze slide to copper
      const veil = sstep(uGate - 0.04, uLaneEnd + 0.07, u);
      skyB.setOpacity(veil); rig.match(skyA, skyB, veil * 0.65);
      { const dk = sstep(uTop, 0.95, u);                           // the sky overhead darkens by degrees as the front comes over us; the pale strip along the western horizon stays
        skyB.uniforms.uZenith.value.copy(skyBZ).multiplyScalar(1 - 0.42 * dk); skyB.uniforms.uMid.value.copy(skyBM).multiplyScalar(1 - 0.3 * dk); }
      scene.fog.color.lerpColors(fogA, fogB, veil * 0.8);
      hero.setSun(heroSun, rig.sun.color, rig.sun.intensity / look.skyA.lightIntensity);
      hero.setBounce(tmpC.lerpColors(bA, bB, veil), 1); KU.uKBounce.value.copy(tmpC);
      { const q = Math.round(veil * 12 + 6 * sstep(uWall - 0.02, 0.97, u));          // creatures take the copper light, then the storm's shade (in a few steps, not every frame)
        if (q !== fauQ) { fauQ = q; const kv = Math.min(12, q) / 12, ks = Math.max(0, q - 12) / 6;
          fLight.sunColor.lerpColors(fSun, fSunB, kv * 0.65); fLight.sunIntensity = mix(sk.lightIntensity, look.skyB.lightIntensity, kv * 0.65) * (1 - 0.45 * ks); fauna.setLight(fLight); } }
      CU.uCSun.value.copy(rig.sun.color).multiplyScalar(rig.sun.intensity / Math.PI);
      CU.uCAmb.value.copy(rig.hemi.color).lerp(rig.hemi.groundColor, 0.4).multiplyScalar(rig.hemi.intensity / Math.PI);
      // front, shadow line, tear line, gust
      storm.front = frontX(u); storm.tear = tearX(u); storm.gust = gust;
      storm.shadow = look.shadow ? storm.front - mix(300, 150, sstep(uWall, 1, u)) - (rare ? 190 * sstep(uTop - 0.06, uTop + 0.03, u) : 0) : 9000;
      hero.setStorm(storm);
      if (rare) {
        const k = sstep(uTop - 0.03, uTop + 0.02, u), sx = spotX(u), sz = spotZ(u), R = 45;
        hero.setSpot(sz, -sx, R, k * look.shadow);
        shaft.position.set(sx, 0, sz).addScaledVector(sunW, 700); shaft.scale.set(R * 0.9, 1400, R * 0.9);
        v0.setFromMatrixPosition(camera.matrixWorld).sub(shaft.position); v0.addScaledVector(sunW, -v0.dot(sunW));
        shaft.material.uniforms.uShaftK.value = 1.0 * k * (0.5 + 0.5 * sstep(R * 0.7, R * 2.4, v0.length())); shaft.material.uniforms.uShaftIn.value = 1 - sstep(R * 0.7, R * 1.7, v0.length());
      }
      if (rents) {
        const k = sstep(uTop - 0.005, uTop + 0.03, u);
        rents.forEach((r, i) => { const x = storm.shadow + r.dx + 10 * Math.sin(t * 0.07 + i * 2.3), z = r.z + 14 * Math.sin(t * 0.045 + i * 1.7), w = k > 0 ? r.R * 0.5 : 1e-4;
          hero.setRent(i, z, -x, r.R, 0.9 * k); r.m.position.set(x, 0, z).addScaledVector(sunW, 210); r.m.scale.set(w, 420, w); });
        rents[0].m.material.uniforms.uShaftK.value = 0.32 * k;
      }
      hero.update(dt, t, camera);
      // the gust wave runs up the lane 2.6 times faster than we fly and overtakes us in the square
      const slam = u < uGust0 ? 1e5 : 232 - (u - uGust0) * path.length * 2.6;
      KU.uKSlamZ.value = slam; CU.uCSlamZ.value = slam;
      windU.z = 0.9 + 2.5 * gust; windU.w = 0.8 + 1.4 * gust;
      // wingtips: spread and still, blades in the stoop, snapped open after it, beating on the climb
      const fold = sstep(uRim - 0.012, uRim + 0.02, u) * (1 - sstep(uCleft - 0.035, uCleft + 0.008, u));
      const climb = sstep(uLaneEnd - 0.012, uLaneEnd + 0.012, u) * (1 - sstep(uTop - 0.05, uTop - 0.022, u));
      const snapShow = sstep(uCleft, uCleft + 0.006, u) * (1 - sstep(uCleft + 0.014, uCleft + 0.026, u));
      KU.uKFold.value = fold; KU.uKRuffle.value = 0.012 + 0.03 * fold + 0.022 * gust; KU.uKFlap.value = 0.45 * climb;
      KU.uKSnap.value = 0.5 * sstep(uCleft + 0.002, uCleft + 0.009, u) * (1 - sstep(uCleft + 0.01, uCleft + 0.024, u));     // one snap open out of the stoop
      KU.uKShow.value = Math.max(climb, snapShow, fold);                                                        // the folded blades show through the stoop; gliding, a falcon's wings are out beside it (at rest the tips were two dark blobs in the corners)
      path.tangentAt(u, v0); path.tangentAt(Math.min(1, u + 0.012), v1);
      const turn = v0.z * v1.x - v0.x * v1.z;
      wings.visible = u > 1e-5 && KU.uKShow.value > 0.003;
      { const down = u > uGate - 0.06, mid = u > uCleft - 0.02, mid2 = u > uCleft + 0.05; for (const m of lateKit) m.visible = down; for (const m of midKit) m.visible = mid2;      // (the lane's kit and the cloth wait until the groves: nothing of them can be told from the cleft)
        pebbleMesh.object.visible = mid; bedRockMesh.object.visible = bedSlabMesh.object.visible = bedCobbleMesh.object.visible = u > uLaneEnd;      // pebbles on the track and the riverbed's boulders: far too small from the rim, and behind the town until the climb
        if (sandMesh) sandMesh.visible = u > uGate; gravelBushes.object.visible = u > uTop - 0.03; }
      camera.matrixWorld.decompose(wings.position, wings.quaternion, v2);
      { const pm = camera.projectionMatrix.elements;              // keep the tips in the outer tenth of any frame shape
        const hw = 1 / Math.max(pm[0], 0.05);
        const ws = Math.min(1.25, Math.max(0.6, (1 / Math.max(pm[5], 0.05)) / 0.6009), 0.62 + 0.6 * hw / 1.068);   // one scale for both axes: a feather keeps its shape on a tall frame, where the wedge is kept slim
        wings.scale.set(ws, ws, 1); KU.uKWingX.value = 0.93 * (1.068 - hw / ws); }
      wings.rotateZ(Math.max(-0.16, Math.min(0.16, -turn * 1.1)) + 0.014 * Math.sin(t * 0.9) + 0.01 * gust * Math.sin(t * 5.3));
      // particles
      pebbles.uniforms.uCenter.value.y = camera.matrixWorld.elements[13] - 7.5;                              // a shallow box below the eye: nothing of it crosses the sky
      pebbles.setOpacity(0.3 * sstep(uRim, uRim + 0.03, u) * (1 - sstep(uRim + 0.04, uRim + 0.09, u)));     // pebbles knocked off the lip fall with us only under the rim: the glide beyond is in clear air
      grit.setOpacity(0.8 * gust * (0.7 + 0.3 * sstep(uTop, uWall, u)));
      DU.uDKs.value.set(gust * sstep(uWall, 0.9, u), gust * sstep(uTop, uWall, u), (1 - sstep(uGate - 0.03, uGate + 0.01, u)) * sstep(uRim, uRim + 0.05, u));
      DU.uDFront.value = storm.front;
      hero.setNearBillows(gust * sstep(uTop - 0.02, uWall, u));
      hero.setArrival(sstep(uLaneEnd + 0.01, uLaneEnd + 0.047, u));                                           // (round sixteen) the arrival: from the climb over the low house on
      DU.uDLit.value.copy(dustLit).multiply(rig.sun.color).multiplyScalar(rig.sun.intensity * 0.23);
      if (rain) rain.setOpacity(0.75 * sstep(uLaneEnd, uTop + 0.05, u));
      // tumbleweed bowls west over the gravel once the gust is up
      for (let i = 0; i < NTW; i++) {
        const w = tw[i], f = (t * w.sp / 420 + w.ph) % 1, x = 190 - f * 420, r = 0.62 * w.s * gust;
        const hop = Math.abs(Math.sin(f * 60 + w.ph * 9)) * w.hop;
        E4.set(0.3 * Math.sin(f * 40), 0, f * 420 / (0.62 * w.s));
        Q4.setFromEuler(E4);
        const tz = w.z + 9 * Math.sin(f * 7 + w.ph * 20);
        M4.compose(P4.set(x, bedY(x, tz) + 0.55 * w.s + hop, tz), Q4, S4.set(r / 0.62, r / 0.62 * 0.85, r / 0.62));
        tumble.setMatrixAt(i, M4);
      }
      tumble.instanceMatrix.needsUpdate = true;
      skyA.update(dt, t, camera); skyB.update(dt, t, camera); rig.update(dt, t, null); ridges.update(dt, t, camera);
      terrain.update(dt, t);
      grass.update(dt, t, camera); tufts.update(dt, t, camera); tussocks.update(dt, t, camera); alfalfa.update(dt, t, camera); palms.update(dt, t, camera); acacias.update(dt, t, camera); bushes.update(dt, t, camera); bushesNear.update(dt, t, camera); gravelBushes.update(dt, t, camera); tamarisk.update(dt, t, camera);
      fauna.update(dt, t, camera, u);
      set.update(dt, t, camera);
    }
    { const c0 = new THREE.PerspectiveCamera(62, ctx.aspect || 1.78, 0.3, 7000); path.pointAt(0, c0.position); c0.lookAt(-150, 300, 700); c0.updateMatrixWorld(); update(0, 0, c0, 0); }
    await skyA.prewarm(ctx.renderer, null, scene);
    await skyB.prewarm(ctx.renderer, null, scene);

    const stoopA = new THREE.Vector3(260, 160, -200), stoopB = new THREE.Vector3(400, 100, -120), stoopC = new THREE.Vector3(20, 25, 100), stoopGaze = new THREE.Vector3();
    const revealA = new THREE.Vector3(200, 30, -230), revealB = new THREE.Vector3(20, 30, -440), revealGaze = new THREE.Vector3(), frontGaze = new THREE.Vector3();
    // the stoop is flown fast, the roof run with the shadow line is lingered over, the last tenth is unhurried
    const pace = (u) => 1 + 0.7 * sstep(uRim + 0.005, uRim + 0.05, u) * (1 - sstep(uCleft - 0.05, uCleft + 0.01, u))
      - 0.35 * sstep(uTop - 0.05, uTop - 0.01, u) * (1 - sstep(uWall - 0.01, uWall + 0.04, u));
    const titleBits = [look.title];
    if (rare) titleBits.push('The Rent in the Wall'); else if (cast.wedding) titleBits.push('A Wedding Day'); else if (weather === 'wet') titleBits.push('Mud Rain');
    return {
      scene, path, duration, pace,
      title: titleBits.join(': '),
      ride: 'none',
      camera: { fov: 62, near: 0.3, far: 7000, lookAhead: 26, sway: 0.8, bank: 1 },
      pois: [
        { at: [-10, 0, 120], from: -0.05, to: uRim + 0.035, weight: 0.85, fade: 0.2 },                     // the town far below, dead centre
        { at: (time, u) => stoopGaze.lerpVectors(stoopA, stoopB, sstep(uRim + 0.05, uRim + 0.105, u)).lerp(stoopC, sstep(uCleft - 0.115, uCleft - 0.06, u)), from: uRim - 0.012, to: uCleft + 0.03, weight: 0.8, fade: 0.11 },
        // (the stoop: first a level gaze over the town to the far cliff, then east to the wall of dust standing behind the town's east end, then down to the gate and the skyline over the groves)
        { at: [-26, 22, 100], from: uSquare - 0.035, to: uSquare + 0.012, weight: 0.6, fade: 0.3 },      // the white minaret in the square
        { at: (time, u) => revealGaze.lerpVectors(revealA, revealB, sstep(uTop + 0.005, uTop + 0.035, u)), from: uTop - 0.035, to: uWall - 0.012, weight: 0.7, fade: 0.24 },                // THE REVEAL: the wall and the shadow line
        { at: (time, u) => frontGaze.set(mix(150, -40, sstep(0.84, 0.91, u)), mix(70, 30, sstep(0.84, 0.91, u)), -420), from: uWall - 0.05, to: 0.92, weight: 0.4, fade: 0.25 },                   // the front's foot and its shadow edge coming over the quarter
      ],
      portal: { shape: 'circle', radius: 7, color: look.portal, glow: 1.6 },
      post: {
        exposure: look.exposure,
        bloom: { strength: 0.3, radius: 0.6, threshold: 0.97 },
        grade: { saturation: look.grade.saturation, contrast: look.grade.contrast, tint: look.grade.tint, shadowTint: look.grade.shadowTint, vignette: 0.3, grain: 0.025, aberration: 0 },
      },
      update,
      dispose() { skyA.dispose?.(); skyB.dispose?.(); hero.dispose?.(); },
    };
  },
};
