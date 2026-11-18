// THE RAISING OF THE GER
// On the Mongolian steppe a ger (built 10x life size: the camera is a swallow) assembles itself around the camera in
// one take (src/parts/raising-the-ger.js): the lattice races round, the crown wheel rises on its pillars, 81 poles
// swing over and seat, felt is laid and the sky narrows to one beam through the roof ring; then the door opens.
// Space: ground y 0, x east, z south, the ger's centre at the origin, the door facing south.
// Flight: the beats below are written on the brief's scale b (the door's threshold at b 0.87); the way out is longer
// than the brief's, so flight u maps to b by toOld(u) (threshold at u about 0.81; indoors u = 0.93 b) and back by toNew(b).
// b: 0 enter from the north, the wheel going up on its pillars dead ahead (0.045-0.135); 0.16 through the lattice's
// closing gap; 0.245-0.425 THE RAISING, one anticlockwise turn under the poles; 0.35-0.535 felts, the sky closes, the
// pipe rises, the beam is born; 0.50-0.77 THE LAP: east across the finished room, the blade of light from the ring down
// to its oval on the east bed (the gaze holds it); through the beam's edge over the bed (0.646), the painted chests
// (0.70-0.73); 0.70-0.83 the door opens; 0.87-1 out over the grass to the scarf gate, which stands small (z 116)
// against the steppe: three far ranges, cloud shadows on the grass, four bands of running horses round a long loop
// that passes behind the gate, far gers. The grass is this world's own: fine blades drawn on cards,
// wind running through it in waves, the posts' long shadows and the gate's light on it.
// Until the door opens a canvas (the roof cover, hung on the scarf rope) keeps the way out to itself.
// The sun stands west-south-west, so the beam falls east-north-east, onto the head of the east bed and the lamp chests:
// the lap sees it from the south-west (u 0.5), side on from the south (0.56), across the chests from the south-east
// (0.61), flies through its foot (0.63) and has it on the left of the opening door from the north-west (0.70).
// The way out swings east of the door's axis and comes back to the gate at an angle, beside a track worn from the door
// to the hitching posts; the gaze holds the gate, the running bands (dust behind them) crossing beyond it.
// Light indoors: the felt glows (warm and strong on the sun's side, cool and dim opposite), the rugs are shaded under
// and beside every piece of furniture, and the one beam is the brightest thing in the room.
// Looks by seed / ctx.vary.hour: autumn gold evening, green summer, white winter, windy spring, dawn.
// Rare (ctx.vary.rare): first snow, flakes riding down the whole beam, gold, for the lap; sparks outside the door.
import * as THREE from 'three';
import { makePath } from '../kit/core.js';
import { makeSky } from '../kit/sky.js';
import * as F from '../kit/fauna.js';
import * as fx from '../kit/fx.js';
import * as INT from '../kit/interior.js';
import { buildHero, makeGerLight, gerMaterial, makeAtlas, makeGB, cbox, cyl, lathe, ATLAS, GER, GER_GLSL, GER_PALETTE } from '../parts/raising-the-ger.js';

const sstep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const lerp = (a, b, t) => a + (b - a) * t, clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const hexMix = (a, b, t) => '#' + new THREE.Color(a).lerp(new THREE.Color(b), t).getHexString();
const polar = (deg, r) => [Math.sin(deg * Math.PI / 180) * r, Math.cos(deg * Math.PI / 180) * r];   // bearing from south, east positive
const yawIn = (deg) => (deg + 180) * Math.PI / 180;           // rotation that turns a prop's front (+z) to the ger's centre

// warm / cool: the light the glowing felt gives the room from the sun's side and from the far side (cool is the room's
// shadow tone: warm umber in the gold looks, blue-white in winter). feltT: how much sun comes through the felt itself.
// beamElev: how steeply the beam falls indoors (the sun outside may stand lower). beamK: strength of its oval; beamGain:
// of its lit air; beamSigma: how thick the smoke in it is. mtn: the far ranges [rock, low slopes, snow, haze, snow line 0..1].
const LOOKS = {
  autumn: { sky: 'goldenHour', elev: 24, az: 248, sun: [3.5, 2.5, 1.2], skyC: [0.42, 0.55, 0.95], gnd: [0.42, 0.33, 0.18], warm: [0.94, 0.72, 0.42], cool: [0.3, 0.32, 0.47],
    fog: '#e6c78c', fogDen: 0.00042, grassA: '#8a7236', grassB: '#66542a', grassC: '#b69a54', root: '#5e4a20', tip: '#dfb85c', dry: '#ecd490', dryAmt: 0.42, 
    cloud: 0.5, cloudSpd: 1, wind: 1, beam: '#ffb650', beamGain: 1.05, beamK: 0.92, beamElev: 35, steam: 1, exposure: 1.0, tint: '#fff4e2', shadow: '#1a1830', portal: '#bcd8ff', hazeIn: '#7a6040',
    mtn: ['#5a5486', '#77665e', '#ffe9c8', '#bdb9d6', 0.62], flowers: 0.006, flowerColors: ['#8a4c90', '#c8682c', '#e8d8a0', '#a85a9a'],
    skyOpts: { zenith: '#3f6fc0', mid: '#9fb6d8', horizon: '#f1d39a', scatterColor: '#ffc66b', scatter: 0.8, clouds: { coverage: 0.33, softness: 0.2, absorb: 1.5, lit: '#ffe0a8', shade: '#8f8cba', stretch: 0.55 } } },
  summer: { sky: 'day', elev: 35, az: 244, sun: [3.7, 3.05, 2.15], skyC: [0.4, 0.6, 1.05], gnd: [0.3, 0.4, 0.18], warm: [0.92, 0.78, 0.54], cool: [0.31, 0.35, 0.46],
    fog: '#c4d6e6', fogDen: 0.0003, grassA: '#526446', grassB: '#3e4e34', grassC: '#6c7a54', root: '#3c4c2e', tip: '#8c9c60', dry: '#bcb886', dryAmt: 0.3, flowers: 0.03,
    cloud: 0.6, cloudSpd: 1.2, wind: 0.9, beam: '#ffca78', beamGain: 0.8, beamK: 1.05, beamElev: 41, feltT: 0.72, steam: 0.8, exposure: 0.98, tint: '#fff6e6', shadow: '#10203a', portal: '#ffe9b8', hazeIn: '#7c7460',
    mtn: ['#4a6690', '#4e6a48', '#ffffff', '#c9d9e8', 0.66],
    skyOpts: { zenith: '#1a56cc', mid: '#62a0ea', horizon: '#e4e8de', scatterColor: '#ffe2ac', scatter: 0.6, clouds: { coverage: 0.4, softness: 0.17, scale: 0.85, absorb: 1.5, detail: 0.7, lit: '#fff2d6', shade: '#8c9cc6' } } },
  winter: { sky: 'day', elev: 20.5, az: 247, sun: [3.3, 2.9, 2.4], skyC: [0.55, 0.68, 1.0], gnd: [0.6, 0.66, 0.8], warm: [0.84, 0.78, 0.7], cool: [0.46, 0.56, 0.86],
    fog: '#b4c6e4', fogDen: 0.0005, grassA: '#e4eaf4', grassB: '#c2d0ea', grassC: '#f4f6fa', root: '#8a7a50', tip: '#d8c890', dry: '#efe6c8', dryAmt: 0.6, flowers: 0,
    cloud: 0.4, cloudSpd: 0.7, wind: 0.7, beam: '#ffd69a', beamGain: 0.95, beamK: 0.6, beamSigma: 0.04, beamElev: 20.5, feltT: 0.8, steam: 1.35, exposure: 0.9, tint: '#f2f6ff', shadow: '#14203c', portal: '#ffd9a0', hazeIn: '#7c8290', snow: true,
    mtn: ['#3f5a98', '#8ea6d4', '#eef2fc', '#9fb6de', 0.2], mtnGain: 0.6,
    skyOpts: { zenith: '#2c5cb4', mid: '#7ea6dc', horizon: '#d2deee', scatterColor: '#ffdca8', scatter: 0.5, sunColor: '#fff0d0', clouds: { coverage: 0.34, softness: 0.24, lit: '#fff6e8', shade: '#8498c4' } } },
  spring: { sky: 'day', elev: 31, az: 251, sun: [3.6, 3.2, 2.5], skyC: [0.45, 0.62, 1.0], gnd: [0.36, 0.38, 0.2], warm: [0.92, 0.8, 0.58], cool: [0.33, 0.37, 0.47],
    fog: '#cfdce0', fogDen: 0.0004, grassA: '#868644', grassB: '#647034', grassC: '#a6a66c', root: '#566228', tip: '#b4bc66', dry: '#d4cc90', dryAmt: 0.35, flowers: 0.015,
    cloud: 0.92, cloudSpd: 5.5, wind: 2.3, beam: '#ffd08a', beamGain: 0.95, beamK: 1.25, beamElev: 34, feltT: 0.78, steam: 1, exposure: 1.0, tint: '#fbfaf2', shadow: '#16223a', portal: '#ffe2c0', hazeIn: '#7c7660',
    mtn: ['#526c90', '#66783e', '#ffffff', '#d2dfe6', 0.46],
    skyOpts: { zenith: '#2f66c8', horizon: '#d8e6ee', clouds: { coverage: 0.62, softness: 0.22, absorb: 2.2, wind: [0.05, 0.018] } } },
  dawn: { sky: 'dawn', elev: 22, az: 112, sun: [3.5, 2.3, 1.55], skyC: [0.5, 0.52, 0.9], gnd: [0.44, 0.3, 0.26], warm: [0.96, 0.68, 0.52], cool: [0.33, 0.3, 0.46],
    fog: '#eebfb0', fogDen: 0.00055, grassA: '#8e7256', grassB: '#6c5644', grassC: '#b4947c', root: '#74583a', tip: '#d8a880', dry: '#f0c8b0', dryAmt: 0.5, flowers: 0.02,
    cloud: 0.5, cloudSpd: 0.8, wind: 0.8, beam: '#ffa070', beamGain: 1.05, beamK: 1.3, beamElev: 35, steam: 1.3, exposure: 1.0, tint: '#fff0ee', shadow: '#201838', portal: '#cfe4ff', hazeIn: '#7c5c58',
    mtn: ['#665a86', '#7c6254', '#ffd2c2', '#f0c6b8', 0.56],
    skyOpts: { clouds: { coverage: 0.44, stretch: 0.6 } } },
};
// woodwork: orange (the brief's own), cinnabar with more gold, or blue-green with orange for its accent. Ultramarine is
// the one accent; green and cream are thin trim only.
const WOODS = [
  { wood: '#e47326', woodLight: '#ee9848', woodDark: '#6e2a0e', blue: '#1e4fa0', green: '#3a7048', gold: '#d9a044', red: '#9c2c1a' },
  { wood: '#d45c24', woodLight: '#e6843e', woodDark: '#5c1c0c', blue: '#1e4fa0', green: '#3a6a50', gold: '#e2b254', red: '#8a2416' },
  { wood: '#2a807c', woodLight: '#48a096', woodDark: '#103c40', blue: '#d8601e', green: '#c8a040', gold: '#e0b860', red: '#9c2c1a' },
];

// ---------------------------------------------------------------- furniture (10x life size), each built facing +z on the floor
async function chestGeometry(pal, pause) {                   // one chest, built once and set down four times
  const g = makeGB(), W = 10.4, D = 5.4;
  g.add(cbox(W + 0.5, 0.9, D + 0.5, 0.14), { p: [0, 0.45, 0], c: pal.woodDark });
  g.add(cbox(W, 6.3, D, 0.16), { p: [0, 4.0, 0], c: pal.wood, grad: [-3.2, 3.2, 0.82, 1.05] });
  await pause();
  for (const s of [-1, 1]) {
    g.add(new THREE.PlaneGeometry(4.5, 5.5), { p: [s * 2.48, 4.0, D / 2 + 0.03], c: '#ffffff', uv: ATLAS.medallion });
    g.add(cbox(0.46, 6.5, 0.46, 0.08), { p: [s * (W / 2 - 0.05), 4.0, D / 2 - 0.05], c: pal.blue });
    g.add(new THREE.SphereGeometry(0.42, 8, 6), { p: [s * (W / 2 - 0.05), 7.5, D / 2 - 0.05], c: pal.gold });
    g.add(new THREE.TorusGeometry(0.55, 0.1, 6, 12), { p: [s * (W / 2 + 0.12), 4.6, 0], r: [0, Math.PI / 2, 0], c: pal.gold });
  }
  g.add(cbox(0.4, 6.3, 0.3, 0.06), { p: [0, 4.0, D / 2 + 0.05], c: pal.gold });
  await pause();
  for (const s of [-1, 1]) g.add(new THREE.PlaneGeometry(4.6, 5.2), { p: [s * 2.5, 4.0, -D / 2 - 0.03], r: [0, Math.PI, 0], c: '#ffffff', uv: ATLAS.lid, gain: 0.85 });
  g.add(cbox(W + 0.3, 0.5, 0.2, 0.04), { p: [0, 1.4, -D / 2 - 0.06], c: pal.blue }); g.add(cbox(W + 0.3, 0.5, 0.2, 0.04), { p: [0, 6.8, -D / 2 - 0.06], c: pal.green });
  await pause();
  g.add(cbox(W + 0.7, 0.75, D + 0.7, 0.15), { p: [0, 7.6, 0], c: hexMix(pal.wood, pal.woodDark, 0.25) });
  g.add(cbox(W + 0.74, 0.5, 0.2, 0.04), { p: [0, 7.6, D / 2 + 0.36], c: '#ffffff', uv: [0, ATLAS.band[1], 2.5, ATLAS.band[3]] });
  const top = new THREE.PlaneGeometry(W, D - 0.2); top.rotateX(-Math.PI / 2);
  g.add(top, { p: [0, 7.99, 0], c: '#ffffff', uv: ATLAS.lid });
  g.add(cbox(0.9, 1.1, 0.16, 0.05), { p: [0, 6.5, D / 2 + 0.2], c: pal.gold });                     // lock plate
  g.add(new THREE.TorusGeometry(0.3, 0.07, 5, 10), { p: [0, 6.1, D / 2 + 0.3], c: '#8a6a30' });
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.add(cbox(0.9, 0.5, 0.9, 0.1), { p: [sx * (W / 2 - 0.4), 0.05, sz * (D / 2 - 0.4)], c: '#3a1808' });
  await pause();
  return g.build();
}
async function bedGeometry(pal, quiltGain, pause) {
  const g = makeGB(), W = 7.0, L = 18.5;
  g.add(cbox(W, 1.6, L, 0.14), { p: [0, 1.5, 0], c: pal.wood, grad: [-0.8, 0.8, 0.8, 1.05] });
  for (const s of [-1, 1]) {
    g.add(cbox(0.2, 1.1, L - 1.2, 0.04), { p: [s * (W / 2 + 0.06), 1.5, 0], c: '#ffffff', uv: [0, ATLAS.band[1], 2, ATLAS.band[3]] });
    g.add(cbox(W + 0.5, s < 0 ? 4.6 : 3.4, 0.6, 0.14), { p: [0, s < 0 ? 2.9 : 2.3, s * (L / 2 + 0.1)], c: pal.wood });
    g.add(new THREE.PlaneGeometry(W - 1, 2.6), { p: [0, s < 0 ? 3.6 : 2.6, s * (L / 2 + 0.1) - s * 0.33], r: [0, s < 0 ? 0 : Math.PI, 0], c: '#ffffff', uv: ATLAS.lid });
    for (const sx of [-1, 1]) { g.add(cbox(0.8, s < 0 ? 5.2 : 4.0, 0.8, 0.1), { p: [sx * (W / 2 + 0.1), s < 0 ? 2.6 : 2.0, s * (L / 2 + 0.1)], c: pal.blue }); g.add(new THREE.SphereGeometry(0.5, 8, 6), { p: [sx * (W / 2 + 0.1), s < 0 ? 5.5 : 4.3, s * (L / 2 + 0.1)], c: pal.gold }); }
    await pause();
  }
  g.add(cbox(W - 0.4, 1.0, L - 0.8, 0.3), { p: [0, 2.8, 0], c: '#e8dcc0', m: 1 });                         // mattress
  const q = new THREE.PlaneGeometry(W - 0.3, L - 4.5, 6, 12), qp = q.attributes.position;           // quilt, softly rumpled
  for (let i = 0; i < qp.count; i++) qp.setZ(i, 0.16 * Math.sin(qp.getX(i) * 1.7 + qp.getY(i) * 0.9) + 0.12 * Math.sin(qp.getY(i) * 2.3));
  q.rotateX(-Math.PI / 2); q.computeVertexNormals();
  g.add(q, { p: [0, 3.52, 1.6], c: '#ffffff', uv: ATLAS.quilt, gain: quiltGain });
  g.add(cbox(W - 0.2, 0.5, L - 4.4, 0.2), { p: [0, 3.2, 1.6], c: '#c8b08a', m: 1 });
  const bol = cyl(0.95, 0.95, W - 1.2, 12); bol.rotateZ(Math.PI / 2);
  g.add(bol, { p: [0, 4.0, -L / 2 + 1.7], c: pal.red, m: 1 }); g.add(cbox(W - 2.4, 0.7, 2.2, 0.25), { p: [0, 3.7, -L / 2 + 3.4], c: '#f0e6d0', m: 1 });
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.add(cbox(0.9, 0.8, 0.9, 0.1), { p: [sx * (W / 2 - 0.3), 0.4, sz * (L / 2 - 0.6)], c: '#3a1808' });
  await pause();
  return g.build();
}
function stoveInto(b0, pal) {                                  // iron stove at the centre, fire door to the south, the tea pan on top
  const b = { add: (g, o) => b0.add(g, { ...o, m: 1 }) };
  const iron = '#54463c', ironL = '#77665a', Z = 1.2;
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) b.add(cbox(0.5, 1.2, 0.5, 0.08), { p: [sx * 1.9, 0.6, Z + sz * 2.3], c: iron });
  b.add(cbox(4.6, 3.6, 5.6, 0.22), { p: [0, 2.9, Z], c: iron, grad: [-1.8, 1.8, 0.8, 1.1] });
  b.add(cbox(5.0, 0.35, 6.0, 0.1), { p: [0, 4.85, Z], c: ironL });
  for (const y of [1.6, 4.2]) b.add(cbox(4.72, 0.22, 5.72, 0.05), { p: [0, y, Z], c: ironL });
  b.add(cbox(2.2, 1.7, 0.2, 0.06), { p: [0, 2.7, Z + 2.86], c: ironL });                             // fire door, embers through its slots
  for (let i = -2; i <= 2; i++) b.add(new THREE.BoxGeometry(0.2, 1.1, 0.06), { p: [i * 0.38, 2.7, Z + 2.99], c: [4.2, 1.5, 0.35] });
  b.add(cbox(0.5, 0.2, 0.3, 0.04), { p: [0.9, 3.4, Z + 3.0], c: pal.gold });
  b.add(lathe([[0.01, 5.0], [1.3, 5.02], [2.3, 5.5], [2.75, 6.3], [2.9, 6.36], [2.82, 6.44], [2.2, 5.7], [1.2, 5.3], [0.01, 5.28]], 28), { p: [0, 0, Z + 0.9], c: '#6a5a4a' });
  for (const s of [-1, 1]) b.add(new THREE.TorusGeometry(0.42, 0.08, 5, 10), { p: [s * 3.05, 6.2, Z + 0.9], r: [0, 0, Math.PI / 2], c: ironL });
  b.add(cyl(0.72, 0.72, 0.5, 12), { p: [0, 5.2, -0.5], c: ironL });                                  // collar where the pipe leaves
}
async function tableSetInto(b, pal, rng, pause) {                           // low table south of the stove, bowls, a plate of pastry, stools
  const TZ = 10.5;
  b.add(INT.tableGeometry({ scale: 10, width: 0.72, depth: 0.46, height: 0.3, legs: 'square', color: pal.woodLight }), { p: [0, 0, TZ], keep: true });
  b.add(cbox(7.3, 0.3, 0.14, 0.04), { p: [0, 2.72, TZ + 2.36], c: '#ffffff', uv: [0, ATLAS.band[1], 1.5, ATLAS.band[3]] });
  const bowl = (x, z, s, c) => {
    b.add(lathe([[0.01, 0], [0.32, 0], [0.36, 0.06], [0.3, 0.1], [0.62, 0.4], [0.74, 0.7], [0.76, 0.72], [0.7, 0.72], [0.58, 0.44], [0.01, 0.2]], 14), { p: [x, 3.0, z], s, c, m: 1 });
    b.add(cyl(0.6, 0.6, 0.02, 12), { p: [x, 3.0 + 0.56 * s, z], s: [s, 1, s], c: '#d9b98a', m: 1 });                // milk tea
    b.add(cyl(0.755, 0.755, 0.1, 14, true), { p: [x, 3.0 + 0.62 * s, z], s: [s, s, s], c: pal.blue, m: 1 });
  };
  await pause();
  bowl(-2.2, TZ + 0.9, 1.0, '#f0e8d8'); bowl(1.4, TZ + 1.2, 1.0, '#f0e8d8'); bowl(2.6, TZ - 1.0, 0.9, '#e8d8c0'); bowl(-0.6, TZ - 1.2, 1.25, pal.gold);
  b.add(cyl(1.25, 1.0, 0.18, 16), { p: [-2.4, 3.09, TZ - 0.8], c: '#e8dcc8', m: 1 });                                // plate with stacked pastry
  for (let i = 0; i < 9; i++) { const a = i * 2.4, r = 0.5 * (1 - i / 12); b.add(cbox(0.9, 0.26, 0.42, 0.1), { p: [-2.4 + Math.cos(a) * r * 0.5, 3.3 + Math.floor(i / 3) * 0.26, TZ - 0.8 + Math.sin(a) * r * 0.5], r: [0, a, 0], c: hexMix('#d8a850', '#b87830', rng()), m: 1 }); }
  await pause();
  const stool = (x, z, r) => {
    b.add(INT.chairGeometry({ scale: 6.4, style: 'stool', color: pal.woodLight, seatColor: pal.red }), { p: [x, 0, z], r: [0, r, 0], keep: true });
  };
  stool(-6.2, TZ + 0.4, 0.3); stool(6.3, TZ - 0.3, -0.4); stool(7.5, TZ + 8.5, 0.9);
  return { stool: [7.5, TZ + 8.5] };
}
function cupboardInto(b, pal, deg) {
  const g = makeGB(), [x, z] = polar(deg, 27.2);
  g.add(cbox(6.4, 0.8, 3.6, 0.12), { p: [0, 0.4, 0], c: pal.woodDark });
  g.add(cbox(6.0, 9.2, 3.2, 0.16), { p: [0, 5.4, 0], c: pal.wood, grad: [-4.6, 4.6, 0.82, 1.05] });
  for (const s of [-1, 1]) for (let k = 0; k < 2; k++) g.add(new THREE.PlaneGeometry(2.6, 4.0), { p: [s * 1.42, 3.2 + k * 4.4, 1.63], c: '#ffffff', uv: k ? ATLAS.door : ATLAS.medallion });
  for (const s of [-1, 1]) for (let k = 0; k < 2; k++) g.add(new THREE.SphereGeometry(0.16, 6, 5), { p: [s * 0.25, 3.2 + k * 4.4, 1.75], c: pal.gold });
  g.add(cbox(6.6, 0.6, 3.8, 0.14), { p: [0, 10.3, 0], c: pal.blue }); g.add(cbox(6.9, 0.3, 4.0, 0.08), { p: [0, 10.75, 0], c: pal.gold });
  for (let i = -1; i <= 1; i++) g.add(lathe([[0.01, 0], [0.5, 0], [0.9, 0.5], [1.0, 1.0], [0.8, 1.5], [0.45, 1.7], [0.55, 1.9], [0.01, 1.9]], 12), { p: [i * 2, 10.9, 0], s: 0.9 - Math.abs(i) * 0.15, c: i ? '#8a5a3a' : pal.gold, m: 1 });
  b.add(g.build(), { p: [x, 0, z], r: [0, yawIn(deg), 0], keep: true });
}
function pailsInto(b, pal, deg, rng) {
  const [x0, z0] = polar(deg, 25.2);
  for (let i = 0; i < 4; i++) {
    const x = x0 + (i - 1.5) * 2.5 * Math.cos(deg * Math.PI / 180), z = z0 - (i - 1.5) * 2.5 * Math.sin(deg * Math.PI / 180) + (i % 2) * 1.2, s = rng.range(0.85, 1.2);
    b.add(lathe([[0.01, 0], [0.82, 0], [1.0, 2.0], [1.04, 2.05], [0.94, 2.05], [0.78, 0.2], [0.01, 0.2]], 14), { p: [x, 0, z], s, c: i % 2 ? '#b08850' : '#c8a060', grad: [0, 2, 0.8, 1.1] });
    for (const y of [0.5, 1.6]) b.add(cyl(0.99, 0.95, 0.14, 14, true), { p: [x, y * s, z], s: [s * (0.88 + y * 0.07), s, s * (0.88 + y * 0.07)], c: '#4a4038', m: 1 });
    b.add(cyl(0.92, 0.92, 0.03, 12), { p: [x, 1.7 * s, z], s: [s, 1, s], c: i === 1 ? '#f4efe4' : '#e6dcc8', m: 1 });   // milk
    const h = new THREE.TorusGeometry(0.98, 0.05, 4, 14, Math.PI); b.add(h, { p: [x, 2.0 * s, z], r: [0, rng.range(0, 3), 0], s, c: '#4a4038', m: 1 });
  }
}
function churnFrameInto(b, pal, x, z) {                        // two A-frames and a bar; the leather bag hangs from it (separate, rocking)
  for (const s of [-1, 1]) {
    for (const k of [-1, 1]) b.add(cbox(0.36, 7.4, 0.36, 0.06), { p: [x + k * 1.5, 3.5, z + s * 2.6], r: [0, 0, k * 0.4], c: pal.wood });
    b.add(cbox(2.4, 0.3, 0.3, 0.05), { p: [x, 2.2, z + s * 2.6], c: pal.blue });
  }
  const bar = cyl(0.22, 0.22, 6.4, 8); bar.rotateX(Math.PI / 2); b.add(bar, { p: [x, 6.75, z], c: pal.woodDark });
}
function churnBagGeometry(pal) {                               // hangs from the origin
  const g0 = makeGB(), g = { add: (q, o) => g0.add(q, { ...o, m: 1 }), build: () => g0.build() };
  const bag = new THREE.SphereGeometry(1, 14, 10); g.add(bag, { p: [0, -3.2, 0], s: [1.25, 1.9, 1.7], c: '#6a4428', grad: [-1, 1, 0.75, 1.1] });
  g.add(cyl(0.5, 0.75, 0.9, 10), { p: [0, -1.3, 0], c: '#7a5232' }); g.add(cyl(0.56, 0.56, 0.16, 10), { p: [0, -1.0, 0], c: '#3a2a20' });
  g.add(cyl(0.09, 0.09, 3.6, 6), { p: [0, 0.2, 0], c: '#c8a878' });                                  // plunger
  for (const s of [-1, 1]) { g.add(cyl(0.06, 0.06, 1.9, 5), { p: [0, -0.95, s * 0.9], r: [s * 0.45, 0, 0], c: '#2a2018' }); g.add(new THREE.SphereGeometry(0.2, 6, 5), { p: [0, -4.9, s * 0.8], c: '#4a3020' }); }
  return g.build();
}
async function saddlesInto(b, pal, deg, pause) {
  const g = makeGB();
  for (const s of [-1, 1]) for (const k of [-1, 1]) g.add(cbox(0.4, 5.6, 0.4, 0.06), { p: [s * 3.6, 2.6, k * 1.1], r: [k * 0.38, 0, 0], c: pal.woodDark });
  const beam = cyl(0.45, 0.45, 9, 10); beam.rotateZ(Math.PI / 2); g.add(beam, { p: [0, 5.0, 0], c: pal.woodDark, grad: [-0.45, 0.45, 0.8, 1.2] });
  for (const sx of [-1, 1]) {
    const x = sx * 2.0, col = sx < 0 ? '#5a2f18' : '#7a4a26', cloth = sx < 0 ? '#27304a' : '#3a2230', trim = sx < 0 ? '#8a2a1c' : '#9a7a3c';
    const gw = g, g1 = { add: (q, o) => gw.add(q, { ...o, m: 1 }) };
    g1.add(cbox(3.0, 0.25, 4.6, 0.1), { p: [x, 5.5, 0], c: cloth });                               // saddle cloth draped
    for (const k of [-1, 1]) { g1.add(cbox(3.0, 2.6, 0.2, 0.08), { p: [x, 4.3, k * 2.3], r: [k * -0.2, 0, 0], c: cloth, grad: [-1.3, 1.3, 0.75, 1.1] }); g1.add(cbox(3.04, 0.3, 0.24, 0.04), { p: [x, 3.2, k * 2.56], r: [k * -0.2, 0, 0], c: trim }); g1.add(cbox(3.04, 0.12, 0.24, 0.03), { p: [x, 3.75, k * 2.45], r: [k * -0.2, 0, 0], c: '#b9b4a6' }); }
    const seat = cyl(1.0, 1.0, 2.4, 12, false); seat.rotateZ(Math.PI / 2); g1.add(seat, { p: [x, 5.9, 0], s: [1, 0.55, 1.5], c: col, grad: [-1, 1, 0.7, 1.15] });
    for (const e of [-1, 1]) { g1.add(cbox(0.4, 2.0, 2.6, 0.16), { p: [x + e * 1.25, 6.7, 0], r: [0, 0, e * -0.25], c: col }); g1.add(cbox(0.2, 0.5, 2.7, 0.06), { p: [x + e * 1.52, 7.6, 0], r: [0, 0, e * -0.25], c: '#b9b4a6' }); for (let i = -2; i <= 2; i++) g1.add(new THREE.SphereGeometry(0.13, 6, 4), { p: [x + e * 1.42, 6.9, i * 0.5], c: '#d8d4c8' }); }
    for (let i = 0; i < 5; i++) g1.add(new THREE.SphereGeometry(0.14, 6, 4), { p: [x + (i - 2) * 0.42, 6.42, 1.36], c: '#e8e4d8' });      // silver studs
    for (const k of [-1, 1]) { g1.add(cbox(0.16, 2.6, 0.08, 0.02), { p: [x, 3.6, k * 2.75], c: '#3a2a20' }); g1.add(new THREE.TorusGeometry(0.5, 0.09, 5, 12), { p: [x, 1.9, k * 2.75], r: [0, Math.PI / 2, 0], c: '#b8b0a0' }); }
    await pause();
  }
  const [x, z] = polar(deg, 25.3), geo = await g.buildAsync(pause);
  await pause();
  b.add(geo, { p: [x, 0, z], r: [0, yawIn(deg) + Math.PI / 2, 0], keep: true });
}
function fiddleGeometry(pal) {                                 // horse-head fiddle, hangs from the origin (its peg)
  const g = makeGB();
  const body = cbox(2.6, 3.2, 0.9, 0.12), bp = body.attributes.position;
  for (let i = 0; i < bp.count; i++) if (bp.getY(i) > 0) bp.setX(i, bp.getX(i) * 0.72);
  body.computeVertexNormals();
  g.add(body, { p: [0, -8.0, 0], c: '#b9773a', grad: [-1.6, 1.6, 0.8, 1.1] }); g.add(cbox(2.75, 0.3, 1.0, 0.05), { p: [0, -9.55, 0], c: pal.woodDark }); g.add(cbox(1.95, 0.26, 1.0, 0.05), { p: [0, -6.45, 0], c: pal.woodDark });
  g.add(new THREE.PlaneGeometry(1.5, 2.2), { p: [0, -8.0, 0.47], c: '#ffffff', uv: ATLAS.lid });
  g.add(cbox(0.34, 6.6, 0.3, 0.05), { p: [0, -3.4, 0], c: pal.woodDark });
  g.add(cbox(0.5, 1.3, 0.5, 0.1), { p: [0, -0.45, 0.25], r: [0.5, 0, 0], c: pal.wood }); g.add(cbox(0.4, 0.9, 0.4, 0.1), { p: [0, -0.2, 0.75], r: [1.5, 0, 0], c: pal.wood });   // the horse's head
  for (const s of [-1, 1]) { g.add(new THREE.ConeGeometry(0.1, 0.4, 4), { p: [s * 0.14, 0.42, 0.25], c: pal.wood }); g.add(cyl(0.07, 0.07, 1.0, 5), { p: [s * 0.45, -1.3, 0], r: [0, 0, Math.PI / 2], c: '#2a160c' }); g.add(cbox(0.06, 7.6, 0.05, 0.01), { p: [s * 0.09, -5.0, 0.2], c: '#efe6d0' }); }
  g.add(cbox(0.8, 0.14, 0.3, 0.03), { p: [0, -8.6, 0.52], c: '#e8dcc0' });
  const bow = cbox(0.1, 6.4, 0.1, 0.02); g.add(bow, { p: [1.9, -5.6, 0.1], r: [0, 0, 0.12], c: pal.woodDark });
  // a bunch of dried juniper tied to the same peg
  // (thin sprigs fanning from the knot, each with a few side needles)
  for (let i = 0; i < 16; i++) { const len = 1.9 + (i % 4) * 0.35, rz = ((i * 3) % 9 - 4) * 0.13, rx = Math.PI + ((i * 5) % 7 - 3) * 0.1, col = hexMix('#4f6e44', '#8a9a6a', (i % 5) / 4), px = -3.4 + Math.sin(rz) * len * 0.5, py = -0.9 - Math.cos(rz) * len * 0.5;
    g.add(new THREE.ConeGeometry(0.11, len, 4), { p: [px, py, 0.1 + ((i * 3) % 4) * 0.1], r: [rx, 0, rz], c: col, m: 1 });
    for (const sd of [-1, 1]) g.add(new THREE.ConeGeometry(0.07, 0.8, 3), { p: [px + sd * 0.22, py - 0.25, 0.1 + ((i * 3) % 4) * 0.1], r: [rx, 0, rz + sd * 0.6], c: col, gain: 0.85, m: 1 }); }
  g.add(cyl(0.1, 0.1, 3.6, 5), { p: [-1.7, -0.3, 0], r: [0, 0, Math.PI / 2 - 0.2], c: '#c8a878' });
  return g.build();
}
function wallThingsInto(b0, pal, rng) {                        // a deel folded on the west bed
  const b = { add: (g, o) => b0.add(g, { ...o, m: 1 }) };
  b.add(cbox(4.4, 0.7, 3.4, 0.25), { p: [-25.4, 4.0, 3.2], r: [0, 0.2, 0], c: pal.blue }); b.add(cbox(4.5, 0.2, 0.5, 0.06), { p: [-25.4, 4.42, 3.9], r: [0, 0.2, 0], c: pal.gold });
  b.add(cbox(3.0, 0.5, 2.6, 0.2), { p: [-25.2, 4.65, 3.0], r: [0, -0.3, 0], c: hexMix(pal.blue, '#000000', 0.25) }); b.add(cbox(1.2, 0.36, 2.8, 0.1), { p: [-25.2, 5.0, 3.0], r: [0, -0.3, 0], c: pal.wood });
}
async function outsideInto(b, pal, cart, posts, rng, pause) {               // ox cart on its shafts, fuel basket, carved hitching posts
  const g = makeGB();
  for (const s of [-1, 1]) {
    const w = new THREE.TorusGeometry(4.2, 0.34, 6, 24); g.add(w, { p: [0, 4.5, s * 4.6], c: '#8a6a48' });
    for (let i = 0; i < 8; i++) g.add(cbox(0.3, 8.2, 0.3, 0.05), { p: [0, 4.5, s * 4.6], r: [0, 0, i * Math.PI / 8], c: '#a07c54' });
    await pause();
    g.add(cyl(0.7, 0.7, 1.0, 10), { p: [0, 4.5, s * 4.6], r: [Math.PI / 2, 0, 0], c: '#5a4030' });
    g.add(cbox(21, 0.5, 0.5, 0.08), { p: [-5.2, 3.6, s * 3.0], r: [0, 0, 0.19], c: '#9a7850' });                   // shafts down to the grass
    g.add(cbox(13, 1.2, 0.3, 0.06), { p: [0.8, 6.6, s * 3.6], c: '#a58258' });
    for (let i = 0; i < 5; i++) g.add(cbox(0.3, 1.6, 0.3, 0.05), { p: [-4.8 + i * 2.8, 6.0, s * 3.6], c: '#8a6a48' });
    await pause();
  }
  g.add(cyl(0.4, 0.4, 10.4, 8), { p: [0, 4.5, 0], r: [Math.PI / 2, 0, 0], c: '#5a4030' });
  g.add(cbox(13.4, 0.5, 7.4, 0.1), { p: [0.8, 5.3, 0], c: '#b08a5c' });
  g.add(cbox(0.5, 0.5, 7.4, 0.08), { p: [-14.4, 1.1, 0], c: '#8a6a48' });
  await pause();
  const cartGeo = await g.buildAsync(pause);
  await pause();
  b.add(cartGeo, { p: [cart[0] + 4, 0, cart[2] + 14], r: [0, 0.5, 0], keep: true });
  await pause();
  // fuel basket by the door
  b.add(lathe([[0.01, 0], [1.5, 0], [2.3, 2.6], [2.4, 3.0], [2.2, 3.0], [1.4, 0.3], [0.01, 0.3]], 14), { p: [13.5, 0, 37], c: '#9a7a4a', grad: [0, 3, 0.7, 1.1], m: 1 });
  for (let i = 0; i < 12; i++) b.add(new THREE.IcosahedronGeometry(0.6, 0), { p: [13.5 + rng.range(-1.3, 1.3), 2.5 + rng() * 0.9, 37 + rng.range(-1.3, 1.3)], s: [1.2, 0.6, 1], r: [rng() * 3, rng() * 3, 0], c: hexMix('#4a3a2a', '#6a5a40', rng()), m: 1 });
  const pg = makeGB();
  pg.add(lathe([[0.01, 0], [1.3, 0], [1.3, 0.6], [0.8, 1.0], [0.7, 6], [0.95, 6.4], [0.95, 7.2], [0.65, 7.6], [0.6, 18.4], [0.9, 18.8], [0.9, 19.6], [0.5, 20.2], [0.5, 21.6], [0.8, 22.0], [0.5, 22.8], [0.01, 23.0]], 12), { c: pal.wood, grad: [0, 23, 0.8, 1.05] });
  for (const y of [6.8, 19.2]) pg.add(cyl(0.99, 0.99, 0.7, 12, true), { p: [0, y, 0], c: pal.blue });
  for (const y of [10.5, 14.5]) { pg.add(cyl(0.7, 0.7, 0.5, 12, true), { p: [0, y, 0], c: pal.blue }); pg.add(cyl(0.72, 0.72, 0.14, 12, true), { p: [0, y + 0.4, 0], c: pal.gold, m: 1 }); pg.add(cyl(0.72, 0.72, 0.14, 12, true), { p: [0, y - 0.4, 0], c: pal.gold, m: 1 }); }
  for (let k = 0; k < 6; k++) pg.add(cbox(0.16, 3.0, 0.1, 0.03), { p: [Math.sin(k * 1.047) * 0.66, 12.5, Math.cos(k * 1.047) * 0.66], r: [0, k * 1.047, 0], c: pal.woodDark });
  pg.add(new THREE.TorusGeometry(0.6, 0.1, 5, 12), { p: [0, 9, 0.8], c: '#8a8478', m: 1 });
  const postGeo = pg.build();
  for (const p of posts) { await pause(); b.add(postGeo.clone(), { p: [p.x, 0, p.z], s: [0.88, GER.POST_S, 0.88], keep: true }); }
  postGeo.dispose();
}

// a neighbour's ger, finished and lived in, seen far off: felt wall and roof, the orange crown at the ring, girth ropes,
// a painted door to the south, the stove pipe
function farGerGeometry(pal) {
  const g0 = makeGB(), g = { add: (q, o) => g0.add(q, { ...o, m: 1 }) }, felt = '#a9a192';
  g.add(lathe([[30.4, 0], [30.5, 16.2], [31.0, 16.7], [18, 20.9], [6.5, 24.6], [6.3, 25.3], [0.01, 25.5]], 44), { c: felt, grad: [0, 25, 0.86, 1.06] });
  for (const y of [5.4, 10.8]) g.add(cyl(30.62, 30.58, 0.4, 44, true), { p: [0, y, 0], c: '#3c3026' });
  g.add(cyl(31.1, 31.1, 0.5, 44, true), { p: [0, 16.5, 0], c: '#4a3c2e' });
  const ring = new THREE.TorusGeometry(6.5, 0.55, 6, 24); ring.rotateX(Math.PI / 2); g.add(ring, { p: [0, 25.0, 0], c: pal.wood });
  g0.add(cbox(15.4, 17, 1.6, 0.2), { p: [0, 8.5, 30.2], c: pal.wood }); g0.add(cbox(17.4, 1.2, 2.2, 0.2), { p: [0, 17.4, 30.2], c: pal.blue });
  g0.add(cbox(6.2, 14, 0.3, 0.1), { p: [-3.6, 8, 31.1], c: pal.blue, gain: 0.8 }); g0.add(cbox(6.2, 14, 0.3, 0.1), { p: [3.6, 8, 31.1], c: pal.blue, gain: 0.8 });
  g.add(cyl(0.55, 0.55, 7, 8), { p: [0, 27.5, -0.5], c: '#3a3632' });
  return g0.build();
}
// the long shadows of the two hitching posts (a point is shaded when its ray to the sun meets a post) and the pool of
// light the gate throws on the grass
const POST_GLSL = /* glsl */`
uniform vec2 uPost[2]; uniform vec3 uGateC, uPortalC;
float postShade(vec3 P){
  vec2 h = normalize(uSunDir.xz + vec2(1e-5, 0.)); float tn = uSunDir.y / max(length(uSunDir.xz), .05), s = 0.;
  for (int i = 0; i < 2; i++) {
    vec2 rel = uPost[i] - P.xz; float al = dot(rel, h), pe = abs(rel.x * h.y - rel.y * h.x), soft = .3 + .035 * max(al, 0.);
    s = max(s, (1. - smoothstep(.8, .8 + soft, pe)) * smoothstep(-.5, .5, al) * (1. - smoothstep(15.2, 17.6, P.y + al * tn)));
  }
  return s;
}
// the way out: the track worn from the door to the hitching posts and the trodden ground round the gate (metres, x and z)
float wornTrack(vec2 p){
  float t = smoothstep(6.2, 2.4, abs(p.x - 1.2 * sin(p.y * .09))) * smoothstep(33., 42., p.y) * (1. - smoothstep(${(GER.GATE_Z - 5).toFixed(1)}, ${(GER.GATE_Z + 3).toFixed(1)}, p.y));
  return max(t, smoothstep(15., 7.5, length(p - vec2(0., ${(GER.GATE_Z - 2).toFixed(1)}))));
}
// the verges of the way out: full from the track's line out to 12 m and fading to 40 m either side; round the gate full
// out to 20 m from the trodden round's centre and fading to 45 m
float wayVerge(vec2 p){
  float t = smoothstep(40., 12., abs(p.x - 1.2 * sin(p.y * .09))) * smoothstep(33., 42., p.y) * (1. - smoothstep(${(GER.GATE_Z + 3).toFixed(1)}, ${(GER.GATE_Z + 30).toFixed(1)}, p.y));
  return max(t, smoothstep(45., 20., length(p - vec2(0., ${(GER.GATE_Z - 2).toFixed(1)}))));
}
vec3 gateGlow(vec3 P){
  vec2 d = (P.xz - uGateC.xz) * vec2(1., .82); float k = max(1. - length(d) / 21., 0.); k *= k;
  return uPortalC * vec3(1., .92, .78) * (k * k * .75 + k * .12) * (.86 + .14 * gNoise(P.xz * .3 + vec2(uTime * .6, -uTime * .4)));
}`;
const FAR_GERS = [[-182, 286, 1, 0.35], [-262, 352, 0.82, -0.2], [168, 452, 0.9, 0.1]];      // x, z beyond the gate, size, yaw

export default {
  id: 'raising-the-ger',
  name: 'The Raising of the Ger',
  category: 'domestic',
  weirdness: 0.2,
  media: ['interior', 'tiny'],
  async build(ctx) {
    const { rng } = ctx, vary = ctx.vary || {}, detail = ctx.quality?.detail ?? 1, dens = clamp(vary.density ?? 1, 0.7, 1.3), rare = !!vary.rare;
    const scene = new THREE.Scene();

    // ------------------------------------------------------------------ per-seed look and cast
    const V = rng.fork('variety'), hour = vary.hour || 'any', pk = V();
    const turn = Number.isFinite(ctx.seed) ? Math.abs(Math.floor(ctx.seed)) % 7 : Math.floor(pk * 7);       // the looks come round in turn; the gold evening, the brief's own, twice as often
    let lookId = hour === 'golden' ? 'autumn' : hour === 'dawn' || hour === 'night' ? 'dawn'
      : hour === 'day' ? ['summer', 'spring', 'summer', 'spring', 'winter', 'summer', 'summer'][turn]
        : ['autumn', 'spring', 'dawn', 'spring', 'winter', 'autumn', 'summer'][turn];
    if (rare && (lookId === 'summer' || lookId === 'spring')) lookId = 'autumn';         // first snow belongs to the cold end of the year
    const L = LOOKS[lookId];
    const woodPk = V(), pal = { ...GER_PALETTE, ...(woodPk < 0.5 ? WOODS[0] : woodPk < 0.78 ? WOODS[1] : WOODS[2]) };
    if (L.snow) pal.felt = '#d9d5cd';
    const coat = L.snow ? V.pick(['#4a3a30', '#52382a', '#3a3230']) : V.pick(['#b08a50', '#8a5a34', '#9a948c', '#c8a468']);
    const piebald = !L.snow && V() < 0.3, lamb = V() < 0.35, eagles = V() < 0.3, quiltGain = V.range(0.85, 1.05);
    const sky = makeSky({ rng: rng.fork('sky'), preset: L.sky, sunElevation: L.elev, sunAzimuth: L.az, sunGlow: 0.5, ...L.skyOpts, sunIntensity: 0, sunGlowTight: 0.12 });   // the disc is never seen (intensity 0): only its glow
    await ctx.yield();
    scene.add(sky.object);
    const SUN = sky.sunDirection.clone().normalize();
    // the beam indoors keeps the sun's bearing but falls at its own angle, so that its oval lies on the bed
    const BEAM = (() => { const e = Math.max(L.beamElev ?? L.elev, L.elev) * Math.PI / 180, hx = Math.hypot(SUN.x, SUN.z) || 1; return new THREE.Vector3(SUN.x / hx * Math.cos(e), Math.sin(e), SUN.z / hx * Math.cos(e)); })();
    const sunHex = '#' + new THREE.Color(L.sun[0] / 3.6, L.sun[1] / 3.6, L.sun[2] / 3.6).getHexString(THREE.LinearSRGBColorSpace);
    const fogCol = new THREE.Color(L.fog), fogIn = new THREE.Color(L.hazeIn);
    scene.fog = new THREE.FogExp2(fogCol.clone(), L.fogDen);
    scene.background = fogCol.clone();
    const dirLight = new THREE.DirectionalLight(new THREE.Color(L.sun[0], L.sun[1], L.sun[2]).multiplyScalar(1 / 3.5), 3.2); dirLight.position.copy(SUN).multiplyScalar(100);
    const hemi = new THREE.HemisphereLight(new THREE.Color(L.skyC[0], L.skyC[1], L.skyC[2]), new THREE.Color(L.gnd[0], L.gnd[1], L.gnd[2]), 1.25);
    scene.add(dirLight, hemi);
    const light = makeGerLight();
    light.uSunCol.value.set(...L.sun); light.uSkyCol.value.set(...L.skyC); light.uGndCol.value.set(...L.gnd);
    light.uFeltWarm.value.set(...L.warm); light.uFeltCool.value.set(...L.cool);
    light.uFogCol.value.set(fogCol.r, fogCol.g, fogCol.b); light.uFogDen.value = L.fogDen;
    light.uCloudAmt.value = L.cloud; light.uCloudSpd.value = L.cloudSpd; light.uBeamK.value = L.beamK; light.uFeltT.value = L.feltT ?? 1;
    await ctx.yield();

    // ------------------------------------------------------------------ the flight
    const path = makePath([
      [0, 15, -92], [0, 15, -62], [-1.2, 15, -46], [-4.7, 15, -31], [-11.5, 14.4, -21.5], [-18.5, 12.2, -11],
      [-21.5, 10.5, 0], [-15.2, 10.2, 15.2], [0, 10.2, 21.5], [15.2, 10.4, 15.2], [21.5, 10.8, 0], [15.2, 11.4, -15.2], [0, 12, -21.5], [-15.2, 12.4, -15.2],
      [-21.5, 12.6, 0], [-17, 12.5, 11], [-8.5, 12.3, 19.5], [2, 12, 21.5], [11, 11, 18.5], [17.5, 10.2, 10.5], [19.5, 10.6, 2], [17, 11.2, -7], [10.5, 11.2, -12.5], [2.5, 10.8, -14],
      [-5, 10, -13.5], [-13.5, 9.2, -10.5], [-17.3, 9.2, -1.5], [-13, 9.2, 7], [-3.5, 9, 15.5], [0, 9, 24], [0.4, 9, 36], [5, 9.6, 52], [12.5, 10.6, 70], [13.5, 10.2, 88], [7.4, 9.4, 101], [2.3, 9, 109.5], [0, 9, GER.GATE_Z],
    ]);
    await ctx.yield();
    const DUR = 50, _pp = new THREE.Vector3();
    // Every scripted beat is written on the brief's own scale, b (the door's threshold at b 0.87): toOld turns the
    // flight's u into b, toNew the other way. The way out to the gate is longer than the brief's, so that the gate
    // stands small against the steppe for a good while; indoors b runs a little ahead of u.
    const B_DOOR = 0.87;
    let uDoor = 0.8, uCrossU = 0.15;
    for (let i = 0; i <= 400; i++) { path.pointAt(i / 400, _pp); if (Math.hypot(_pp.x, _pp.z) < 30.3) { uCrossU = i / 400; break; } }
    for (let i = 200; i <= 800; i++) { path.pointAt(i / 800, _pp); if (_pp.z >= GER.DOOR_Z - 0.2 && Math.abs(_pp.x) < 4) { uDoor = i / 800; break; } }
    const toOld = (u) => (u <= uDoor ? u * (B_DOOR / uDoor) : B_DOOR + (u - uDoor) * (1 - B_DOOR) / (1 - uDoor));
    const toNew = (b) => (b <= B_DOOR ? b * (uDoor / B_DOOR) : uDoor + (b - B_DOOR) * (1 - uDoor) / (1 - B_DOOR));
    const uCross = toOld(uCrossU);
    // lingering under the closing fan (b 0.32-0.46) and again across the finished room toward the beam (0.52-0.62), quick
    // round the lap, slow as the door opens, an even pace out to the gate
    const paceB = (u) => 1.4 - 0.2 * sstep(0, 0.2, u) - 0.6 * sstep(0.24, 0.32, u) + 0.3 * sstep(0.46, 0.53, u) + 0.45 * sstep(0.61, 0.67, u) - 0.75 * sstep(0.72, 0.78, u) + 0.4 * sstep(0.85, 0.9, u);
    const pace = (u) => paceB(toOld(u));

    // ------------------------------------------------------------------ the hero: the ger and its raising
    await ctx.yield();
    const atlas = makeAtlas({ ...pal, white: '#e6d8bc' });
    await ctx.yield();
    const CART = [52, 2.2, -4];
    await ctx.yield();
    const hero = await buildHero(ctx, { light, atlas, palette: pal, sunDir: SUN, beamDir: BEAM, uCross, cart: CART, beamColor: L.beam, beamGain: L.beamGain,
      timeline: { roofArrive: [0.385, 0.41], roof: [0.41, 0.475], beam: [0.425, 0.475], ropes: [0.475, 0.515], door: [0.665, 0.795] } });
    scene.add(hero.object);
    const TL = hero.timeline, A = hero.anchors, mat = hero.material, mat2 = hero.materialDouble;
    hero.parts.wall.uniforms.uWind.value = L.wind; hero.parts.roof.uniforms.uWind.value = L.wind;
    hero.parts.beam.uniforms.uSigma.value = L.beamSigma ?? 0.062;
    await ctx.yield();

    // ------------------------------------------------------------------ the steppe: level grass to low hills 2 km off
    const C3 = (h) => ({ value: new THREE.Color(h) });
    const hillN = ctx.noise;
    const groundU = { ...light, uGA: C3(L.grassA), uGB: C3(L.grassB), uGC: C3(L.grassC), uHill: C3(L.snow ? '#9db4e2' : '#3f62b4'), uWindK: { value: L.wind }, uSnow: { value: L.snow ? 1 : 0 }, uGR: C3(L.root),
      uPost: { value: [new THREE.Vector2(-GER.POST_X, GER.GATE_Z), new THREE.Vector2(GER.POST_X, GER.GATE_Z)] }, uGateC: { value: new THREE.Vector3(0, 9, GER.GATE_Z) }, uPortalC: C3(L.portal) };
    {
      const radii = [0, 8, 16, 24, 30, 34, 44, 60, 85, 120, 170, 250, 380, 560, 800, 1100, 1400, 1650, 1900, 2150, 2400, 2700, 3100], SEG = 96, P = [], I = [];
      for (let j = 0; j < radii.length; j++) for (let i = 0; i <= SEG; i++) {
        if (i === 0) await ctx.yield();                             // one ring at a time
        const a = i / SEG * 6.2832, r = radii[j], x = Math.sin(a) * r, z = Math.cos(a) * r;
        const hh = sstep(1250, 2300, r) * (70 + 90 * (0.5 + 0.5 * hillN.fbm2(Math.sin(a) * 2.2 + 7, Math.cos(a) * 2.2, 3)) + 40 * hillN.n2(Math.sin(a) * 7, Math.cos(a) * 7)) * (1 - 0.5 * sstep(2500, 3100, r));
        P.push(x, hh + 2.5 * sstep(60, 400, r) * hillN.n2(x * 0.004, z * 0.004), z);
      }
      for (let j = 0; j < radii.length - 1; j++) for (let i = 0; i < SEG; i++) { const p = j * (SEG + 1) + i, q = p + SEG + 1; I.push(p, q, p + 1, p + 1, q, q + 1); }
      await ctx.yield();
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setIndex(I); g.computeVertexNormals();
      const m = new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms: groundU,
        vertexShader: /* glsl */`varying vec3 vW, vN; varying float vD; void main(){ vW = position; vN = normal; vec4 mv = viewMatrix * vec4(position, 1.); vD = -mv.z; gl_Position = projectionMatrix * mv; }`,
        fragmentShader: /* glsl */`
uniform vec3 uGA, uGB, uGC, uHill, uGR; uniform float uWindK, uSnow; varying vec3 vW, vN; varying float vD;
${GER_GLSL}
${POST_GLSL}
void main(){
  float r = length(vW.xz), near = smoothstep(150., 25., vD), mid = smoothstep(420., 60., vD);
  float n1 = gFbm(vW.xz * .021), n2 = gFbm(vW.xz * .13 + 3.), n3 = gNoise(vW.xz * 1.9), n4 = gNoise(vW.xz * vec2(.7, 4.) + 9.);
  vec3 alb = mix(uGA, uGB, smoothstep(.25, .75, n1));
  alb = mix(alb, uGC, smoothstep(.55, .85, n2) * .5);
  // under the tufts: a thatch of bent blades lying with the wind, dark at the roots, a few pale stems catching the light
  vec2 wd = vec2(.93, .36), wp = vec2(-.36, .93);
  vec2 sp = vec2(dot(vW.xz, wd), dot(vW.xz, wp)) + (n2 - .5) * 3.;
  float s1 = gNoise(sp * vec2(1.6, 4.5)), s2 = gNoise(sp * vec2(3.1, 9.) + 17.), s3 = gNoise((sp.yx + sp * .35) * vec2(2.2, 6.) + 5.);
  float thatch = (s1 * .5 + s2 * .3 + s3 * .2);
  float clump = gNoise(vW.xz * .62 + 21.);
  float mott = gNoise(vW.xz * 1.1 + 2.) * .45 + gNoise(vW.xz * 3.3 + 8.) * .3 + thatch * .25;
  vec3 det = mix(uGR * .62, mix(uGR, alb, .5) * 1.12, smoothstep(.3, .7, mott));
  det = mix(det, uGC * .9, smoothstep(.8, .95, s2) * .3);
  det *= .8 + .3 * clump;
  alb = mix(alb * (.86 + .22 * n3), det, near * (1. - uSnow * .75));
  alb *= (.84 + .2 * n4 * mid) * mix(.62, .5, 1. - uSnow);
  // waves of wind running through the grass
  float wv = sin(dot(vW.xz, vec2(.045, .019)) - uTime * 1.1 * uWindK + n1 * 7.) * sin(dot(vW.xz, vec2(-.012, .03)) - uTime * .5 * uWindK);
  alb *= 1. + .12 * wv * smoothstep(31., 70., r) * (1. - uSnow * .7);
  // the trodden circle and the track out to the hitching posts
  float trod = max(max(smoothstep(37., 31., r), .12 * smoothstep(64., 54., r + 6. * (n2 - .5))), .3 * smoothstep(5.2, 1.6, abs(vW.x + 2.4 * (n2 - .5))) * step(0., vW.z) * smoothstep(52., 40., vW.z));
  float scuff = gNoise(vW.xz * .9 + 4.) * .5 + gNoise(vW.xz * 3.7) * .3 + n4 * .2;
  alb = mix(alb, mix(uGB * vec3(.7, .66, .56), uGA * vec3(.72, .78, .9), uSnow) * (.4 + .6 * scuff) * (.6 + .8 * thatch * near), trod);
  // the way out: grass worn down to pale earth and flattened straw by hooves and feet
  float wt = wornTrack(vW.xz + 1.6 * (n2 - .5));
  alb = mix(alb, mix(mix(uGC, uGR, .4) * 1.2, uGA * vec3(.74, .8, .92), uSnow) * (.5 + .5 * scuff) * (.7 + .5 * thatch), wt * .85);
  // the ring where the poles were laid out: grass trodden flat, pale straw lying every way
  float ring = smoothstep(33., 38., r) * smoothstep(64., 55., r + 6. * (n2 - .5)) * (1. - uSnow * .6);
  alb = mix(alb, mix(uGR * .5, uGC, smoothstep(.2, .8, s2 * .6 + s3 * .4)) * (.34 + .4 * thatch + .16 * scuff) * (.7 + .6 * clump), ring * .8);
  // far off the steppe lies in long bands: paler dry swells, darker hollows, then the blue of the hills
  float band = gFbm(vW.xz * vec2(.0011, .0034) + 4.);
  alb *= mix(1., .7 + .65 * band, smoothstep(120., 500., r));
  alb = mix(alb, uGC * .55, smoothstep(.6, .8, band) * smoothstep(200., 700., r) * .5 * (1. - uSnow));
  alb = mix(alb, uHill * (.42 + .3 * n1), smoothstep(700., 1900., r) * .75);
  vec3 c = gerLight(alb, normalize(vN), vW, 1.);
  c = mix(c, alb * uSkyCol * .7, .85 * postShade(vW)) + alb * gateGlow(vW);
  gl_FragColor = vec4(gerFog(c, min(vD, 600. + (vD - 600.) * .4)), 1.);
}` }));
      m.name = 'steppe'; m.frustumCulled = false; scene.add(m);
    }
    await ctx.yield();

    // ------------------------------------------------------------------ far ranges: three receding walls of mountains beyond the hills, haze between them
    {
      const [rockH, lowH, snowH, hazeH, snowLine] = L.mtn;
      // [crest radius, depth of the front slope, greatest height, haze over it]
      const RANGES = [[2960, 560, 520, 0.16], [3420, 520, 1000, 0.4], [3880, 460, 1560, 0.54]], NA = 360, NR = 7, P = [], Mv = [], Nv = [], I = []; let n = 0;
      // each range is a few great massifs [bearing from south (east positive), half width, height] with a shoulder on
      // either side and low saddles between them: the greatest stands south-south-east, left of the gate as we leave
      const MASS = [
        [[0.25, 0.55, 0.6], [1.55, 0.5, 0.5], [-1.2, 0.6, 0.62], [2.8, 0.6, 0.5], [-2.5, 0.5, 0.45]],
        [[1.04, 0.36, 0.95], [-0.36, 0.44, 0.6], [2.25, 0.4, 0.7], [-1.9, 0.42, 0.85], [-2.95, 0.35, 0.55]],
        [[0.47, 0.31, 1.0], [-0.98, 0.38, 0.72], [1.9, 0.3, 0.6], [3.0, 0.4, 0.8], [-2.2, 0.3, 0.55]],
      ];
      const angd = (a, c) => { let d = a - c; if (d > Math.PI) d -= 6.2832; if (d < -Math.PI) d += 6.2832; return d; };
      const bulkAt = (k, a) => {
        let m = 0;
        for (const [c, w, hh] of MASS[k]) { const d = angd(a, c), v = hh * (Math.exp(-((d / w) ** 2)) + 0.5 * Math.exp(-(((d - 1.05 * w) / (0.6 * w)) ** 2)) + 0.34 * Math.exp(-(((d + 1.4 * w) / (0.75 * w)) ** 2))); m += v * v * v; }
        return RANGES[k][2] * (0.16 + 0.8 * Math.cbrt(m));
      };
      const crestAt = (k, a) => {
        const sa = Math.sin(a), ca = Math.cos(a);
        return bulkAt(k, a) * (0.8 + 0.26 * hillN.fbm2(sa * 1.5 + k * 5.3, ca * 1.5 - k * 2.9, 3) + 0.1 * hillN.ridged2(sa * 6.5 + k * 7.1, ca * 6.5 - k * 3.7, 2));
      };
      for (let k = 0; k < RANGES.length; k++) {
        const [rc, dep, Hk, hz] = RANGES[k];
        for (let i = 0; i <= NA; i++) {
          let a = i / NA * 6.2832; if (a > Math.PI) a -= 6.2832;
          const sa = Math.sin(a), ca = Math.cos(a), crest = crestAt(k, a);
          // which way the great faces look: a slope falling east of a summit turns east, one falling west turns west,
          // so the low sun lights one side of every massif and leaves the other in blue shade
          const g = (bulkAt(k, a + 0.05) - bulkAt(k, a - 0.05)) / (0.1 * rc) * 2.6, nl = Math.hypot(1, g, 0.75);
          const nx = (-sa - ca * g) / nl, ny = 0.75 / nl, nz = (-ca + sa * g) / nl;
          for (let j = 0; j <= NR; j++) {
            const s = j < NR ? j / (NR - 1) : 1.12, r = rc - dep * (1 - s), x = sa * r, z = ca * r;
            const spur = hillN.ridged2(x * 0.0026 + k * 3.3, z * 0.0026, 2);
            const h = j < NR ? crest * Math.pow(s, 1.25) * (j === NR - 1 ? 1 : 0.8 + 0.2 * spur) : crest * 0.7;
            P.push(x, h - 6, z); Mv.push(hz, s, h / 1560); Nv.push(nx, ny, nz);
          }
          if ((i & 15) === 0) await ctx.yield();
        }
        for (let i = 0; i < NA; i++) for (let j = 0; j < NR; j++) { const p = n + i * (NR + 1) + j, q = p + NR + 1; I.push(p, p + 1, q, p + 1, q + 1, q); }
        n += (NA + 1) * (NR + 1);
      }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('aM', new THREE.Float32BufferAttribute(Mv, 3)); g.setAttribute('aN2', new THREE.Float32BufferAttribute(Nv, 3)); g.setIndex(I);
      await ctx.yield();
      g.computeVertexNormals();
      const sunN = Math.max(L.sun[0], L.sun[1], L.sun[2]);
      const m = new THREE.Mesh(g, new THREE.ShaderMaterial({ side: THREE.DoubleSide,
        uniforms: { ...light, uRock: C3(rockH), uLow: C3(lowH), uSnowC: C3(snowH), uHaze: C3(hazeH), uSnowLine: { value: snowLine }, uSunN: { value: new THREE.Vector3(L.sun[0] / sunN, L.sun[1] / sunN, L.sun[2] / sunN).multiplyScalar(L.mtnGain ?? 1) }, uMtnK: { value: L.mtnGain ?? 1 } },
        vertexShader: /* glsl */`attribute vec3 aM, aN2; varying vec3 vW, vN, vM, vN2; void main(){ vW = position; vN = normal; vM = aM; vN2 = aN2; gl_Position = projectionMatrix * viewMatrix * vec4(position, 1.); }`,
        fragmentShader: /* glsl */`
uniform vec3 uRock, uLow, uSnowC, uHaze, uSunN; uniform float uSnowLine, uMtnK; varying vec3 vW, vN, vM, vN2;
${GER_GLSL}
void main(){
  vec3 Ng = normalize(vN); if (Ng.y < 0.) Ng = -Ng;
  float a = atan(vW.x, vW.z + 1e-4);
  // broad strata and soft gullies on the slopes (never stripes); grass on the low slopes, rock above, snow on the heights
  float st = gFbm(vec2(a * 9., vW.y * .006)), gul = gFbm(vec2(a * 34., vW.y * .004 + 3.));
  vec3 N = normalize(normalize(vN2) * 1.6 + Ng * .4);
  // the sun is low: the faces turned to it are gold, the others stand in blue shade, the gullies fall to shade first
  vec3 sh = normalize(vec3(uSunDir.x, uSunDir.y * .6 + .12, uSunDir.z));
  float ndl = smoothstep(-.02, .5, dot(N, sh) + .16 * (gul - .5) + .1 * (st - .5));
  vec3 base = mix(uLow, uRock, smoothstep(.1, .34, vM.z + .08 * (st - .5))) * (.9 + .2 * st);
  float snow = smoothstep(uSnowLine - .04, uSnowLine + .12, vM.z + .1 * (st - .5) + .05 * (gFbm(vec2(a * 14., vW.y * .012 + 5.)) - .5));
  base = mix(base, uSnowC, snow);
  vec3 c = base * (uSkyCol * ((.5 + .16 * N.y) * mix(1., .8, gul) * mix(uMtnK, 1., .35)) + uSunN * vec3(1.06, .96, .8) * (ndl * 1.5));
  // haze lies deepest at the foot of each wall and each wall is paler than the one before it
  float hz = clamp(vM.x + .4 * (1. - smoothstep(0., .7, vM.y)) + .1 * (1. - smoothstep(0., .25, vM.z)), 0., .95);
  gl_FragColor = vec4(mix(c, uHaze, hz), 1.);
}` }));
      m.name = 'far-ranges'; m.frustumCulled = false; scene.add(m);
    }
    await ctx.yield();

    // ------------------------------------------------------------------ cloud shadows sliding over the steppe: a sheet just above the grass tops that darkens what lies under it
    {
      const g = new THREE.RingGeometry(66, 1500, 72, 10); g.rotateX(-Math.PI / 2);
      const m = new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms: { ...light, uShCol: C3(L.shadow) }, transparent: true, depthWrite: false,
        vertexShader: /* glsl */`varying vec3 vW; varying float vD; void main(){ vW = vec3(position.x, 6.6, position.z); vec4 mv = viewMatrix * vec4(vW, 1.); vD = -mv.z; gl_Position = projectionMatrix * mv; }`,
        fragmentShader: /* glsl */`
uniform vec3 uShCol; varying vec3 vW; varying float vD;
${GER_GLSL}
void main(){
  float r = length(vW.xz);
  vec2 q = vW.xz * .0046 + uTime * uCloudSpd * vec2(.034, .012) + vec2(.35, .1);
  float n = gFbm(q) * .72 + .28 * gNoise(q * 3.1 + 5.);
  float sh = smoothstep(.45, .55, n);
  float al = .7 * min(uCloudAmt * 1.5, 1.) * sh * smoothstep(66., 86., r) * (1. - smoothstep(950., 1500., r)) * mix(1., .55, smoothstep(350., 1000., r)) * smoothstep(9., 22., length(vW.xz - vec2(0., ${GER.GATE_Z.toFixed(1)}))) * exp(-max(vD, 0.) * uFogDen * .5);
  gl_FragColor = vec4(uShCol * 1.5, al);
}` }));
      m.name = 'cloud-shadows'; m.frustumCulled = false; m.renderOrder = 3; scene.add(m);
    }
    await ctx.yield();

    // ------------------------------------------------------------------ quilted felt rugs, unrolled outward from the stove
    // uOcc: where the furniture stands (x, z, half width across, half depth along the radius): the rugs are shaded under and beside it
    const occ = []; for (let i = 0; i < 16; i++) occ.push(new THREE.Vector4(0, 100, 0, 0));
    const rugU = { ...light, uReveal: { value: 4.5 }, uRoll: { value: 0.75 }, uOcc: { value: occ }, uRA: C3(L.snow ? '#948c7c' : '#a08a62'), uRB: C3('#6a1f16'), uRC: C3('#b27a20'), uRD: C3(hexMix(pal.wood, '#7a5230', 0.45)), uRE: C3('#b8a67e'), uRF: C3(hexMix(pal.wood === '#2a807c' ? '#7a2a1a' : '#1d6a70', '#20304a', 0.3)) };
    {
      const NR = 50, SEG = 64, P = [], I = [];
      for (let j = 0; j <= NR; j++) for (let i = 0; i <= SEG; i++) { const a = i / SEG * 6.2832, r = 0.2 + (30.38 - 0.2) * j / NR; P.push(Math.sin(a) * r, 0, Math.cos(a) * r); }
      for (let j = 0; j < NR; j++) for (let i = 0; i < SEG; i++) { const p = j * (SEG + 1) + i, q = p + SEG + 1; I.push(p, q, p + 1, p + 1, q, q + 1); }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setIndex(I);
      const m = new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms: rugU, side: THREE.DoubleSide,
        vertexShader: /* glsl */`
uniform float uReveal, uRoll; varying vec3 vW, vN, vP; varying float vD;
void main(){
  float r = length(position.xz); vec2 d = position.xz / max(r, .01);
  float over = max(r - uReveal, 0.), w = min(over / max(uRoll, .05), 9.42);
  float rr = uReveal + uRoll * sin(w) * step(1e-4, over), y = .14 + uRoll * (1. - cos(w)) * step(1e-4, over);
  rr = min(r, uReveal) + (rr - uReveal) * step(1e-4, over);
  vec3 P = vec3(d.x * rr, y, d.y * rr);
  vW = P; vP = position; vN = over > 0. ? normalize(vec3(d.x * sin(w), cos(w), d.y * sin(w))) : vec3(0., 1., 0.);
  vec4 mv = viewMatrix * vec4(P, 1.); vD = -mv.z; gl_Position = projectionMatrix * mv;
}`,
        fragmentShader: /* glsl */`
uniform vec3 uRA, uRB, uRC, uRD, uRE, uRF; uniform vec4 uOcc[16]; varying vec3 vW, vN, vP; varying float vD;
${GER_GLSL}
float occAt(vec2 p){
  float o = 1.;
  for (int i = 0; i < 16; i++) {
    vec4 q = uOcc[i]; float l = length(q.xy);
    vec2 d = l > 3. ? q.xy / l : vec2(0., 1.), rel = p - q.xy;
    vec2 e = max(vec2(abs(d.y * rel.x - d.x * rel.y), abs(dot(rel, d))) - q.zw, 0.);
    float k = 1. - smoothstep(0., 4.6, length(e));
    o *= 1. - .86 * k * k * step(.01, q.z);
  }
  return o;
}
void main(){
  vec2 p = vP.xz, cs = vec2(11., 7.2);
  float row = floor(p.y / cs.y); vec2 q = vec2(p.x + mod(row, 2.) * 5.5, p.y), id = floor(q / cs), f = fract(q / cs);
  vec2 dd = min(f, 1. - f) * cs; float e = min(dd.x, dd.y), hsh = gHash(id + 3.7);
  // felt rugs in four grounds: cream, ox-blood, deep turquoise and saffron
  float gk = hsh < .4 ? 0. : (hsh < .7 ? 1. : (hsh < .88 ? 2. : 3.));
  vec3 field = gk < .5 ? uRA : (gk < 1.5 ? uRB : (gk < 2.5 ? uRF : uRC));
  float felt = gFbm(p * .8), fib = gNoise(p * 9.), fine = gNoise(p * 27.);
  vec3 col = field * (.76 + .3 * felt + .12 * fib + .1 * fine);
  vec3 b1 = gk < .5 ? uRB : (gk < 1.5 ? uRC : (gk < 2.5 ? uRE : uRB)), b2 = gk < .5 ? uRF : (gk < 1.5 ? uRE : (gk < 2.5 ? uRC : uRF));
  vec2 s = (f - .5) * cs;
  // quilting: stitched diamonds over the field, a stitched lozenge and knot in the middle
  float qd = abs(fract((s.x + s.y) * .5) - .5), qe = abs(fract((s.x - s.y) * .5) - .5);
  float stitch = smoothstep(.07, .02, min(qd, qe)) * step(.5, fract((s.x + s.y * .3) * 4.));
  col = mix(col, b1 * .8, .5 * stitch * step(1.1, e));
  col *= .93 + .07 * smoothstep(0., .3, min(qd, qe));
  float m = abs(s.x) / 4.3 + abs(s.y) / 2.5;
  col = mix(col, b1, smoothstep(.06, .03, abs(m - .9)) * .6);
  col = mix(col, b2, smoothstep(.05, .02, abs(m - .76)) * .7);
  col = mix(col, b1, smoothstep(.36, .33, m) * .8); col = mix(col, uRE, smoothstep(.2, .17, m) * .8); col = mix(col, b2, smoothstep(.09, .07, m));
  // binding: a coloured edge, a pale line, a thin inner line
  col = mix(col, b1, smoothstep(.62, .56, e) * .7); col = mix(col, uRE, smoothstep(.34, .3, e) * (1. - smoothstep(.2, .16, e)) * .7); col = mix(col, b2, smoothstep(.95, .9, e) * (1. - smoothstep(.82, .77, e)) * .6);
  col *= .4 + .6 * smoothstep(.0, .14, e);
  // wear: trodden paths between the door, the stove and the beds are greyer and flatter
  float worn = smoothstep(.45, .75, gFbm(p * .09 + 2.)) * .35;
  col = mix(col, vec3(dot(col, vec3(.4, .4, .2))) * vec3(1.05, .98, .86), worn);
  vec3 N = normalize(vN); if (!gl_FrontFacing) { N = -N; col = uRA * (.5 + .25 * gNoise(p * 3.)); }
  // umber shade pooled under and beside the furniture (a little further on the side away from the bright wall),
  // round the hearth and along the foot of the wall
  vec2 hs = normalize(uSunDir.xz + vec2(1e-5, 0.));
  float clo = gerInside(vW) * (.45 * uWallC + .55 * uRoofC);
  float oc = occAt(vW.xz + hs * mix(.3, 1.5, clo));
  float rr = length(vW.xz);
  float ao = (1. - .5 * smoothstep(26.6, 30.2, rr) * mix(.4, 1., clo)) * (1. - .3 * (1. - smoothstep(3., 6.5, length(vW.xz - vec2(0., 1.2)))));
  vec3 shade = mix(vec3(1.), mix(vec3(.17, .16, .25), vec3(1.), oc), mix(.7, 1., clo));
  gl_FragColor = vec4(gerFog(gerLight(col * shade, N, vW, ao), vD), 1.);
}` }));
      m.name = 'rugs'; m.frustumCulled = false; scene.add(m);
    }
    await ctx.yield();

    // ------------------------------------------------------------------ long evening shadows (sheared decals) that shrink to contact shade indoors
    const shadowU = { ...light, uShCol: C3(L.shadow), uLen: { value: 1 / Math.tan(L.elev * Math.PI / 180) } };
    const casters = [];                                         // [x, z, halfWidth, height, strength]
    const addShadows = () => {
      const P = [], S = [], I = []; let n = 0;
      for (const c of casters) { for (const [a, b] of [[-1, 0], [1, 0], [-1, 1], [1, 1]]) { P.push(a, b, c[5] || 0); S.push(c[0], c[1], c[2], c[3]); } I.push(n, n + 1, n + 2, n + 1, n + 3, n + 2); n += 4; }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('aS', new THREE.Float32BufferAttribute(S, 4)); g.setIndex(I);
      const m = new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms: shadowU, transparent: true, depthWrite: false, side: THREE.DoubleSide,
        vertexShader: /* glsl */`
attribute vec4 aS; uniform vec3 uSunDir; uniform float uWallC, uRoofC, uLen; varying vec3 vQ; varying float vD, vLift;
void main(){
  vec2 c = aS.xy, dir = -normalize(uSunDir.xz + vec2(1e-5, 0.)), perp = vec2(-dir.y, dir.x);
  float ins = step(length(c), 29.) * (.5 * uWallC + .5 * uRoofC);
  float len = mix(aS.w * uLen, aS.z * .7, ins), back = aS.z * .9;
  vec2 xz = c + perp * position.x * aS.z * 1.25 + dir * mix(-back, len, position.y);
  vQ = vec3(position.x, position.y, (.5 * min(1., 14. / max(len, 1.)) + .12) * (1. - ins));
  vLift = position.z > 1. ? .85 : 1.; vec4 mv = viewMatrix * vec4(xz.x, .3 + position.z, xz.y, 1.); vD = -mv.z; gl_Position = projectionMatrix * mv;
}`,
        fragmentShader: /* glsl */`
uniform vec3 uShCol, uFogCol; uniform float uFogDen; varying vec3 vQ; varying float vD, vLift;
void main(){
  float a = (1. - vQ.x * vQ.x) * smoothstep(0., .12, vQ.y) * (1. - smoothstep(.45, 1., vQ.y));
  a *= a * (3. - 2. * a);
  gl_FragColor = vec4(uShCol, clamp(a * vQ.z * 1.9, 0., .62) * vLift * exp(-max(vD, 0.) * uFogDen));
}` }));
      m.name = 'shadows'; m.frustumCulled = false; m.renderOrder = 2; scene.add(m);
    };

    // ------------------------------------------------------------------ furniture: it stands on the open grass from the first frame
    const FR = rng.fork('furniture'), b = makeGB(), lampFlames = [];
    const chestDeg = [124, 150, 210, 236];
    const chestGeo = await chestGeometry(pal, ctx.yield);
    for (let i = 0; i < 4; i++) { const [x, z] = polar(chestDeg[i], 26.3); await ctx.yield(); b.add(chestGeo, { p: [x, 0, z], r: [0, yawIn(chestDeg[i]), 0], keep: true, gain: 0.94 + 0.12 * FR() }); casters.push([x, z, 5.6, 8, 1]); }
    await ctx.yield();
    for (let i = 0; i < 7; i++) {                              // brass butter lamps along the two middle chests
      const d = 150, t = (i - 3) * 1.45, [cx, cz] = polar(d, 28.55 - (i % 2) * 0.55), a = d * Math.PI / 180;
      const x = cx + Math.cos(a) * t, z = cz - Math.sin(a) * t, s = 0.9 + 0.25 * FR();
      b.add(lathe([[0.01, 0], [0.5, 0], [0.55, 0.08], [0.16, 0.3], [0.12, 0.75], [0.3, 0.9], [0.62, 1.25], [0.66, 1.5], [0.56, 1.5], [0.3, 1.2], [0.01, 1.15]], 12), { p: [x, 8.0, z], s, c: '#d8a848', grad: [0, 1.5, 0.8, 1.2], m: 1 });
      b.add(cyl(0.5, 0.5, 0.04, 10), { p: [x, 8.0 + 1.42 * s, z], s: [s, 1, s], c: '#f0d890', m: 1 });
      lampFlames.push([x, 8.0 + 1.44 * s, z, 1.05 * s]);
      light.uLamp.value[i].set(x, 8.0 + 1.05 * s, z, 1);
      if (i % 2) await ctx.yield();                             // the lamps in short steps
    }
    { const [x, z] = polar(150, 28.3); light.uLampC.value.set(x, 9.4, z); }
    await ctx.yield();
    const bedGeo = await bedGeometry(pal, quiltGain, ctx.yield);
    await ctx.yield();
    b.add(bedGeo, { p: [25.6, 0, 0], keep: true });
    await ctx.yield();
    b.add(bedGeo, { p: [-25.6, 0, 0], r: [0, Math.PI, 0], keep: true });
    casters.push([25.6, 0, 9.5, 4, 1], [-25.6, 0, 9.5, 4, 1]);
    await ctx.yield();
    stoveInto(b, pal); casters.push([0, 1.2, 3.2, 5, 1]);
    await ctx.yield();
    const seats = await tableSetInto(b, pal, FR, ctx.yield); casters.push([0, 10.5, 3.6, 3, 0.8], [-6.2, 10.9, 1.5, 2.8, 0.8], [6.3, 10.2, 1.5, 2.8, 0.8], [7.5, 19, 2.6, 2.8, 0.9]);
    await ctx.yield();
    cupboardInto(b, pal, 44); { const [x, z] = polar(44, 27.2); casters.push([x, z, 3.2, 11, 1]); }
    await ctx.yield();
    pailsInto(b, pal, 27, FR); { const [x, z] = polar(27, 25.2); casters.push([x, z, 3.6, 2, 0.8]); }
    const CHURN = [-10.5, 23.5];
    churnFrameInto(b, pal, CHURN[0], CHURN[1]); casters.push([CHURN[0], CHURN[1], 3.0, 7, 0.9]);
    await ctx.yield();
    await saddlesInto(b, pal, -58, ctx.yield); { const [x, z] = polar(-58, 25.3); casters.push([x, z, 4.4, 6.5, 1]); }
    await ctx.yield();
    wallThingsInto(b, pal, FR);
    await ctx.yield();
    await outsideInto(b, pal, CART, A.hitchPosts, FR, ctx.yield);
    casters.push([CART[0] + 4, CART[2] + 14, 6.5, 8, 1], [13.5, 37, 2.4, 3, 0.8], [-GER.DOOR_W - 0.5, GER.DOOR_Z + 1.4, 0.9, 17, 1], [GER.DOOR_W + 0.5, GER.DOOR_Z + 1.4, 0.9, 17, 1]);
    await ctx.yield();
    { const fg = farGerGeometry(pal);                              // the neighbours' camp, far out beyond the gate
      for (const [x, dz, sc, yaw] of FAR_GERS) { await ctx.yield(); b.add(fg.clone(), { p: [x, 0, GER.GATE_Z + dz], r: [0, yaw, 0], s: sc, keep: true }); casters.push([x, GER.GATE_Z + dz, 27 * sc, 22 * sc, 1, 3.3]); }
      fg.dispose(); }
    await ctx.yield();
    const furn = new THREE.Mesh(await b.buildAsync(ctx.yield), mat); furn.name = 'furniture'; furn.frustumCulled = false; scene.add(furn);
    await ctx.yield();
    { const O = (i, x, z, hw, hd) => occ[i].set(x, z, hw, hd); let n = 0;
      for (const d of chestDeg) { const [x, z] = polar(d, 26.3); O(n++, x, z, 5.5, 3.0); }
      O(n++, 25.6, 0, 9.5, 3.7); O(n++, -25.6, 0, 9.5, 3.7); O(n++, 0, 1.2, 2.6, 3.1); O(n++, 0, 10.5, 3.8, 2.5);
      O(n++, -6.2, 10.9, 1.4, 1.4); O(n++, 6.3, 10.2, 1.4, 1.4); O(n++, 7.5, 19, 1.9, 1.9);
      { const [x, z] = polar(44, 27.2); O(n++, x, z, 3.4, 2.0); } { const [x, z] = polar(27, 25.2); O(n++, x, z, 5.2, 1.6); }
      O(n++, CHURN[0], CHURN[1], 2.3, 2.9); { const [x, z] = polar(-58, 25.3); O(n++, x, z, 2.7, 4.7); } }
    addShadows();
    await ctx.yield();

    // ------------------------------------------------------------------ things that move by themselves
    const pipeGeo = await (async () => {
      const g0 = makeGB(), g = { add: (q, o) => g0.add(q, { ...o, m: 1 }), build: () => g0.build() }, ir = '#4e443c', irL = '#6c6258';
      const body = new THREE.CylinderGeometry(0.5, 0.5, 23, 16, 46, true), bp = body.attributes.position;
      for (let i = 0; i < bp.count; i++) { const y = bp.getY(i), a = Math.atan2(bp.getZ(i), bp.getX(i)), k = 1 + 0.03 * Math.sin(y * 1.7 + a * 2) * Math.sin(y * 0.6) + 0.012 * Math.sin(a * 5 + y * 4); bp.setX(i, bp.getX(i) * k); bp.setZ(i, bp.getZ(i) * k); }
      body.computeVertexNormals();
      g.add(body, { p: [0, 16.5, 0], c: ir, grad: [-11.5, 11.5, 0.74, 1.12] });
      g.add(cyl(0.515, 0.515, 2.6, 16, true), { p: [0, 6.6, 0], c: '#4a4c60' });                                  // the first length, blued by the heat
      g.add(cbox(0.1, 23, 0.07, 0.02), { p: [0, 16.5, 0.5], c: '#26221e' });                                      // the lock seam
      for (let y = 8.1, j = 0; y < 28; y += 3.3, j++) {                                                        // joints: a sleeve between two beads, a ring of rivets, soot below
        g.add(cyl(0.57, 0.57, 0.62, 16, true), { p: [0, y, 0], c: irL });
        for (const sg of [-1, 1]) g.add(new THREE.TorusGeometry(0.575, 0.05, 5, 16), { p: [0, y + sg * 0.31, 0], r: [Math.PI / 2, 0, 0], c: '#756c60' });
        for (let k = 0; k < 8; k++) { const a = (k + j * 0.37) * Math.PI / 4; g.add(new THREE.SphereGeometry(0.06, 5, 4), { p: [Math.cos(a) * 0.58, y, Math.sin(a) * 0.58], c: '#8a8072' }); }
        g.add(cyl(0.508, 0.508, 1.1, 16, true), { p: [0, y - 0.9, 0], c: '#1f1c1a' });
        if (j % 2) await ctx.yield();
      }
      g.add(cyl(0.06, 0.06, 2.0, 6), { p: [0, 9.9, 0], r: [0, 0, Math.PI / 2], c: irL }); g.add(new THREE.SphereGeometry(0.17, 7, 5), { p: [1.02, 9.9, 0], c: '#b08a48' });   // damper
      g.add(new THREE.ConeGeometry(1.0, 0.8, 16, 1, true), { p: [0, 28.9, 0], c: ir }); g.add(cyl(0.08, 0.08, 0.9, 5), { p: [0, 28.2, 0.4], c: ir }); g.add(cyl(0.08, 0.08, 0.9, 5), { p: [0, 28.2, -0.4], c: ir });
      return g.build();
    })();
    const matIron = gerMaterial(light, atlas, { grain: 1, side: THREE.DoubleSide, gloss: 1.0 });
    const pipe = new THREE.Mesh(pipeGeo, matIron); pipe.name = 'stove-pipe'; pipe.frustumCulled = false; pipe.position.set(0, -18.6, -0.5); scene.add(pipe);
    const ladle = new THREE.Group(); {
      const g = makeGB();
      g.add(cyl(0.09, 0.09, 4.6, 6), { p: [0, 2.0, 0], r: [0, 0, 0.0], c: '#b08850', m: 1 });
      g.add(lathe([[0.01, 0], [0.4, 0.05], [0.62, 0.4], [0.66, 0.6], [0.58, 0.6], [0.36, 0.2], [0.01, 0.14]], 10), { p: [0, -0.5, 0], c: '#c8a050', m: 1 });
      const m = new THREE.Mesh(g.build(), mat2); m.rotation.z = 0.5; m.position.y = 0.2; ladle.add(m);
      ladle.position.set(0.9, 5.6, 2.3); scene.add(ladle);
    }
    const foam = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 8, 0, 6.2832, 0, 1.5708), mat); {
      const col = new Float32Array(foam.geometry.attributes.position.count * 3), cc = new THREE.Color('#e9d5ac'); for (let i = 0; i < col.length; i += 3) { col[i] = cc.r; col[i + 1] = cc.g; col[i + 2] = cc.b; }
      foam.geometry.setAttribute('color', new THREE.BufferAttribute(col, 3)); foam.geometry.attributes.uv.array.fill(0.09);
      foam.position.set(0, 5.62, 2.1); foam.scale.set(2.2, 0.05, 2.2); scene.add(foam);
    }
    await ctx.yield();
    const churnBag = new THREE.Mesh(churnBagGeometry(pal), mat); churnBag.position.set(CHURN[0], 6.75, CHURN[1]); scene.add(churnBag);
    // the fiddle (and the juniper tied to its peg) waits on a chest until the lattice is there to hang it on
    const fiddle = new THREE.Mesh(fiddleGeometry(pal), mat2); fiddle.scale.setScalar(0.95); fiddle.frustumCulled = false; scene.add(fiddle);
    const fidA = new THREE.Vector3(21.2, 8.4, -15.2), fidB = new THREE.Vector3(0, 15.4, -29.1), fidQ0 = new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, 0, 0)).premultiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), -2.55)), fidQ1 = new THREE.Quaternion();
    // the puppy (or a lamb) asleep under the stool south of the stove: a breathing mound, ears, a tail
    const pet = new THREE.Group(), petTail = new THREE.Group(); {
      const g0 = makeGB(), g = { add: (q, o) => g0.add(q, { ...o, m: 1 }), build: () => g0.build() }, fur = lamb ? '#efe8d8' : '#c89a5a', dark = lamb ? '#3a302a' : '#8a5e30';
      const body = new THREE.SphereGeometry(1, 14, 10); g.add(body, { p: [0, 0.95, 0], s: [2.5, 1.0, 1.45], c: fur, grad: [-1, 1, 0.75, 1.1] });
      g.add(new THREE.SphereGeometry(1, 10, 8), { p: [2.3, 0.7, 0.5], s: [1.05, 0.72, 0.85], c: fur });
      for (const s of [-1, 1]) g.add(new THREE.ConeGeometry(0.34, 0.9, 5), { p: [2.2, 1.1, 0.5 + s * 0.6], r: [s * 1.9, 0, 0.4], c: dark });
      for (const s of [-1, 1]) g.add(new THREE.SphereGeometry(0.42, 7, 5), { p: [1.5 * s, 0.32, 1.3], s: [1.5, 0.7, 1], c: lamb ? dark : fur });
      if (lamb) for (let i = 0; i < 16; i++) g.add(new THREE.IcosahedronGeometry(0.55, 0), { p: [FR.range(-2, 1.9), 1.3 + FR() * 0.6, FR.range(-1, 1)], c: hexMix('#efe8d8', '#d8ccb4', FR()) });
      pet.add(new THREE.Mesh(g.build(), mat));
      const t = makeGB(); const tg = cyl(0.12, 0.3, 1.9, 7); tg.translate(0, 0.95, 0); t.add(tg, { c: dark, m: 1 });
      petTail.add(new THREE.Mesh(t.build(), mat)); petTail.position.set(-2.35, 0.75, 0); petTail.rotation.z = 1.25; pet.add(petTail);
      pet.position.set(seats.stool[0], 0.14, seats.stool[1]); pet.rotation.y = 2.2; scene.add(pet);
    }
    const flames = INT.makeFlames({ flames: lampFlames, rng: rng.fork('lamps'), gain: 0.5 }); scene.add(flames.object);
    const stoveGlow = fx.makeGlows({ rng: rng.fork('glow'), positions: [[0, 2.7, 4.5], ...lampFlames.map((f) => [f[0], f[1] + 0.5, f[2]])], sizes: [2.4, ...lampFlames.map(() => 1)], color: '#ff9a48', size: 3.4, intensity: 0.5, flicker: 0.7 });
    scene.add(stoveGlow.object);
    await ctx.yield();

    // ------------------------------------------------------------------ tea steam and pipe smoke: puffs that brighten inside the beam
    const PR = rng.fork('particles');
    const quadGeo = (n, fill) => {
      const g = new THREE.InstancedBufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute([-0.5, -0.5, 0, 0.5, -0.5, 0, 0.5, 0.5, 0, -0.5, 0.5, 0], 3)); g.setIndex([0, 1, 2, 0, 2, 3]);
      const a = new Float32Array(n * 4), k = new Float32Array(n * 4); for (let i = 0; i < n; i++) fill(i, a, k);
      g.setAttribute('aO', new THREE.InstancedBufferAttribute(a, 4)); g.setAttribute('aK', new THREE.InstancedBufferAttribute(k, 4)); g.instanceCount = n;
      g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 12, 0), 200);
      return g;
    };
    const NSTEAM = 34, NSMOKE = 16, NWISP = Math.round(28 * detail), NFAR = 8 * FAR_GERS.length, beamLen = Math.min(29.5 / Math.hypot(BEAM.x, BEAM.z), 23 / BEAM.y);
    const steamU = { ...light, uBoil: { value: 0 }, uPipe: { value: 0 }, uGain: { value: 0.58 * L.steam }, uCol: C3('#f4efe6') };
    const steam = new THREE.Mesh(quadGeo(NSTEAM + NSMOKE + NWISP + NFAR, (i, a, k) => {
      if (i >= NSTEAM + NSMOKE + NWISP) {                         // smoke from the neighbours' stoves
        const [x, dz, sc] = FAR_GERS[(i - NSTEAM - NSMOKE - NWISP) % FAR_GERS.length];
        a[i * 4] = x; a[i * 4 + 1] = 30 * sc; a[i * 4 + 2] = GER.GATE_Z + dz; a[i * 4 + 3] = PR();
        k[i * 4] = PR.range(0.03, 0.045); k[i * 4 + 1] = PR.range(4.5, 7) * sc; k[i * 4 + 2] = 1; k[i * 4 + 3] = PR();
        return;
      }
      if (i >= NSTEAM + NSMOKE) {                                 // smoke that hangs in the beam and shows it
        const t = PR.range(2, beamLen - 1), ang = PR() * 6.2832, r = 4.4 * Math.sqrt(PR());
        a[i * 4] = -BEAM.x * t + Math.cos(ang) * r; a[i * 4 + 1] = 24 - BEAM.y * t; a[i * 4 + 2] = -BEAM.z * t + Math.sin(ang) * r; a[i * 4 + 3] = PR();
        k[i * 4] = PR.range(0.018, 0.034); k[i * 4 + 1] = PR.range(3.4, 6.2); k[i * 4 + 2] = 2; k[i * 4 + 3] = PR();
        return;
      }
      const sm = i >= NSTEAM;
      a[i * 4] = sm ? 0 : PR.range(-1.6, 1.6); a[i * 4 + 1] = sm ? 29.3 : 6.4; a[i * 4 + 2] = sm ? -0.5 : 2.1 + PR.range(-1.6, 1.6); a[i * 4 + 3] = PR();
      k[i * 4] = sm ? PR.range(0.05, 0.075) : PR.range(0.085, 0.14); k[i * 4 + 1] = sm ? PR.range(3, 5) : PR.range(2.2, 3.8); k[i * 4 + 2] = sm ? 1 : 0; k[i * 4 + 3] = PR();
    }), new THREE.ShaderMaterial({ uniforms: steamU, transparent: true, depthWrite: false, blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor,
      vertexShader: /* glsl */`
attribute vec4 aO, aK; uniform float uTime, uBoil, uPipe, uBeamOn; uniform vec3 uSunDir, uBeamDir; varying vec3 vW; varying vec3 vQ; varying float vD, vK;
float eyeInBeam(){ vec3 O = cameraPosition; vec2 q = O.xz + uBeamDir.xz * ((24.2 - O.y) / max(uBeamDir.y, .05)); return smoothstep(12.5, 6.8, length(q)) * step(O.y, 24.2); }
void main(){
  float life = fract(uTime * aK.x + aO.w), kind = aK.z, wisp = step(1.5, kind), far = step(3600., dot(aO.xz, aO.xz)); vec3 c = aO.xyz;
  vec2 dw = -normalize(uSunDir.xz + vec2(1e-5, 0.));
  vec3 rise = vec3(0., life * (kind < .5 ? 15.5 : 9. + 34. * far), 0.);
  rise.xz = (kind < .5 ? dw * (life * life * 8.5) : dw * (life * 46.)) + vec2(sin(life * 7. + aK.w * 40.), cos(life * 5.3 + aK.w * 23.)) * (.3 + 2.4 * life);
  vec3 curl = vec3(sin(life * 6.2832 + aK.w * 40.) * 1.5, (life - .5) * 4., cos(life * 4.4 + aK.w * 23.) * 1.5) - uBeamDir * ((life - .5) * 3.);
  c += mix(rise, curl, wisp);
  float sz = mix(aK.y * (kind < .5 ? mix(.6, 1.7, life) * (1. + uBoil * .25) : mix(.55, 2.3, life) * 2.2), aK.y * (1.5 + .9 * life), wisp);
  float al = mix(smoothstep(0., .1, life) * (1. - smoothstep(.45, 1., life)) * (kind < .5 ? .5 + .45 * uBoil : max(uPipe, far) * .8),
                 smoothstep(0., .3, life) * (1. - smoothstep(.7, 1., life)) * uBeamOn * mix(1., .12, eyeInBeam()), wisp);
  vec3 right = vec3(viewMatrix[0][0], viewMatrix[1][0], viewMatrix[2][0]), up = vec3(viewMatrix[0][1], viewMatrix[1][1], viewMatrix[2][1]);
  vec3 P = c + (right * position.x + up * position.y) * sz;
  vW = P; vQ = vec3(position.xy, al); vK = kind; vec4 mv = viewMatrix * vec4(P, 1.); vD = -mv.z + aK.w * 37.; gl_Position = projectionMatrix * mv;
}`,
      fragmentShader: /* glsl */`
uniform vec3 uCol; uniform float uGain; varying vec3 vW; varying vec3 vQ; varying float vD, vK;
${GER_GLSL}
void main(){
  vec2 sw = vQ.xy * 3.2 + vec2(fract(vD) * 31., uTime * .25);
  float r = length(vQ.xy) * 2., n = gFbm(sw), n2 = gNoise(sw * 2.6 + 7.);
  float wisp = step(1.5, vK), steamK = 1. - step(.5, vK);
  // each puff is a ragged curl with holes in it; a puff that drifts up to the eye thins away
  float curl = mix(1., smoothstep(.25, .68, .55 * n + .45 * n2), .62 * steamK);
  float cd = length(cameraPosition - vW);
  float a = smoothstep(1., mix(.2, .42, steamK), r + (n - .5) * mix(.8, 1.2, steamK)) * curl * vQ.z * mix(uGain * smoothstep(2.5, 9., cd), .2 * smoothstep(5., 16., cd), wisp);
  float ins = gerInside(vW) * step(vW.y, 25.), vis = mix(1., gerBeam(vW), ins * uRoofC);
  // steam is white in the room's glow (paler above, where the roof lights it) and white-gold where the beam strikes it;
  // pipe smoke outside is grey; the hanging smoke shows only in the beam
  vec3 lit = mix(uSkyCol * .8, (uFeltWarm + uFeltCool) * mix(.3, .68, steamK) * (.86 + .34 * vQ.y), ins * uRoofC);
  vec3 col = uCol * (lit * (1. - wisp) + uSunCol * mix(vec3(1.), vec3(1., .82, .5), wisp) * (vis * mix(.34, .4, wisp) * uSunGate * gerCloud(vec2(0.))));
  a *= mix(1., vis, wisp);
  gl_FragColor = vec4(col * a, a * (1. - .7 * wisp));
}` }));
    steam.name = 'steam'; steam.frustumCulled = false; steam.renderOrder = 5; scene.add(steam);

    // ------------------------------------------------------------------ motes of felt fibre (and, on the rare visit, snowflakes) that light up in the beam
    const BUF = new THREE.Vector2(800, 450);
    const moteMat = (size, minPx, fall, sunK, ambK, maxPx = 400, near = [1.5, 6], sharp = 0) => new THREE.ShaderMaterial({
      uniforms: { ...light, uBuf: { value: BUF }, uSize: { value: size }, uMinPx: { value: minPx }, uMaxPx: { value: maxPx }, uNear: { value: new THREE.Vector2(near[0], near[1]) }, uSharp: { value: sharp }, uFall: { value: fall }, uSunK: { value: sunK }, uAmbK: { value: ambK }, uGain: { value: 0 }, uBeamLen: { value: beamLen } },
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      vertexShader: /* glsl */`
attribute vec4 aO, aK; uniform float uSize, uMinPx, uMaxPx, uFall, uBeamLen; uniform vec2 uBuf, uNear; varying vec3 vQ;
${GER_GLSL}
void main(){
  vec3 c = aO.xyz; float ph = aO.w;
  vec3 sway = vec3(sin(uTime * .21 + ph * 50.), sin(uTime * .17 + ph * 31.) * .6, cos(uTime * .19 + ph * 77.)) * (1.2 + aK.x);
  // snow: each flake comes in at the ring and rides slowly down the whole length of the beam, then starts again
  float sl = fract(aO.y - uTime * (.02 + .022 * aK.y));
  vec3 cf = vec3(aO.x, 24.2, aO.z) - uBeamDir * (sl * uBeamLen) + sway * .7;
  c = mix(c + sway, cf, step(.5, uFall));
  vec4 clip = projectionMatrix * viewMatrix * vec4(c, 1.);
  float px = clamp(uSize * (.6 + .8 * aK.z) * projectionMatrix[1][1] / max(clip.w, .1) * uBuf.y * .5, uMinPx, uMaxPx * uBuf.y / 450.);
  clip.xy += position.xy * px * 2. / uBuf * clip.w;
  float ins = gerInside(c) * step(c.y, 25.);
  vQ = vec3(position.xy, mix(1., gerBeam(c), ins * uRoofC) * (.55 + .45 * sin(uTime * (1.5 + ph * 3.) + ph * 90.)) * smoothstep(uNear.x, uNear.y, clip.w));
  gl_Position = clip;
}`,
      fragmentShader: /* glsl */`
uniform float uGain, uSunK, uAmbK, uSharp; varying vec3 vQ;
${GER_GLSL}
void main(){
  float r = length(vQ.xy) * 2., a = smoothstep(1., .15, r);
  a = mix(a, smoothstep(.6, .22, r) + .22 * a * a, uSharp);                // flakes: a bright core, a thin halo
  gl_FragColor = vec4((uSunCol * vec3(1., .8, .5) * (vQ.z * uSunK * uSunGate * gerCloud(vec2(0.))) + uFeltWarm * uAmbK) * (a * uGain), 1.);
}` });
    const NM = Math.round(1500 * detail), tEnd = Math.min(29.5 / Math.hypot(BEAM.x, BEAM.z), 24 / BEAM.y);
    const motes = new THREE.Mesh(quadGeo(NM, (i, a, k) => {
      if (i < NM * 0.62) { const t = PR.range(1, tEnd), ang = PR() * 6.2832, r = 5.6 * Math.sqrt(PR()); a[i * 4] = -BEAM.x * t + Math.cos(ang) * r; a[i * 4 + 1] = 24 - BEAM.y * t; a[i * 4 + 2] = -BEAM.z * t + Math.sin(ang) * r; }
      else { const ang = PR() * 6.2832, r = 27 * Math.sqrt(PR()); a[i * 4] = Math.cos(ang) * r; a[i * 4 + 1] = PR.range(2, 17); a[i * 4 + 2] = Math.sin(ang) * r; }
      a[i * 4 + 3] = PR(); k[i * 4] = PR(); k[i * 4 + 1] = PR(); k[i * 4 + 2] = PR(); k[i * 4 + 3] = PR();
    }), moteMat(0.07, 1.6, 0, 0.6, 0.02));
    motes.name = 'motes'; motes.frustumCulled = false; motes.renderOrder = 7; scene.add(motes);
    const NFL = Math.round(1500 * detail);
    const flakes = new THREE.Mesh(quadGeo(NFL, (i, a, k) => {
      const ang = PR() * 6.2832, r = 5.0 * Math.sqrt(PR()); a[i * 4] = Math.cos(ang) * r; a[i * 4 + 1] = PR(); a[i * 4 + 2] = Math.sin(ang) * r; a[i * 4 + 3] = PR();
      k[i * 4] = PR() * 0.4; k[i * 4 + 1] = PR(); k[i * 4 + 2] = PR(); k[i * 4 + 3] = PR();
    }), moteMat(0.3, 2.0, 1, 0.62, 0.05, 8.5, [3, 10], 1));
    flakes.name = 'first-snow'; flakes.frustumCulled = false; flakes.renderOrder = 7; flakes.visible = false; scene.add(flakes);
    const sparks = fx.makeParticles({ rng: rng.fork('sparks'), preset: 'snow', count: Math.round(2600 * detail), box: [90, 50, 90], size: [0.28, 0.6], colors: ['#ffe2a0', '#fff4d8', '#ffc66b'], intensity: 1.6, additive: 0.8 });
    sparks.setOpacity(0); scene.add(sparks.object);
    await ctx.yield();

    // ------------------------------------------------------------------ grasshoppers flicking up along the entry
    const NH = Math.round(60 * detail * dens);
    const hoppers = new THREE.Mesh(quadGeo(NH, (i, a, k) => {
      a[i * 4] = PR.range(-26, 26); a[i * 4 + 1] = PR.range(3.2, 4.4); a[i * 4 + 2] = PR.range(-90, -36); a[i * 4 + 3] = PR();
      k[i * 4] = PR.range(0.16, 0.34); k[i * 4 + 1] = PR() * 6.2832; k[i * 4 + 2] = PR.range(0.7, 1.2); k[i * 4 + 3] = PR();
    }), new THREE.ShaderMaterial({ uniforms: { ...light, uCol: C3(L.snow ? '#6a5a3a' : '#e6dc8a') },
      vertexShader: /* glsl */`
attribute vec4 aO, aK; uniform float uTime; varying vec3 vQ; varying float vD;
void main(){
  float t = fract(uTime * aK.x + aO.w), hop = clamp(t / .24, 0., 1.), on = step(t, .24);
  vec3 c = aO.xyz + vec3(sin(aK.y), 0., cos(aK.y)) * (hop * 9. * aK.z); c.y += 22. * hop * (1. - hop) * aK.z;
  vec3 right = vec3(viewMatrix[0][0], viewMatrix[1][0], viewMatrix[2][0]), up = vec3(viewMatrix[0][1], viewMatrix[1][1], viewMatrix[2][1]);
  vec3 P = c + (right * position.x * 1.5 + up * position.y * .7) * (.9 * aK.z * on);
  vQ = vec3(position.xy, sin(hop * 40.)); vec4 mv = viewMatrix * vec4(P, 1.); vD = -mv.z; gl_Position = projectionMatrix * mv;
}`,
      fragmentShader: /* glsl */`
uniform vec3 uCol; varying vec3 vQ; varying float vD;
${GER_GLSL}
void main(){
  // a body with a blur of wings above it
  float body = step(length(vQ.xy * vec2(1., 2.6)), .42), wing = step(length((vQ.xy - vec2(0., .22)) * vec2(1.3, 2.4)), .5) * step(0., vQ.y) * (.5 + .5 * vQ.z);
  if (body + wing < .3) discard;
  vec3 c = mix(uCol * 1.6, uCol * .45, body) * (uSkyCol * .6 + uSunCol * .5);
  gl_FragColor = vec4(gerFog(c, vD), 1.);
}` }));
    hoppers.name = 'grasshoppers'; hoppers.frustumCulled = false; scene.add(hoppers);

    // ------------------------------------------------------------------ the rope of blue silk scarves between the hitching posts
    // each scarf is a long ribbon of many short spans: a wave travels down it, it twists as it goes and its tail snaps
    const scarfU = { ...light, uSpd: { value: L.wind } };
    {
      const P = [], Wv = [], Cc = [], Ln = [], I = []; let n = 0;
      const silk = [new THREE.Color('#2f6fe0'), new THREE.Color('#1e4fa0'), new THREE.Color('#5e9be8'), new THREE.Color('#9fc6f4')], rope = new THREE.Color('#3a3026');
      const PX = GER.POST_X, ropeAt = (t) => [lerp(-PX, PX, t), 16.3 - 0.8 * Math.sin(Math.PI * t), GER.GATE_Z];
      for (let i = 0; i <= 24; i++) for (const s of [-1, 1]) { const q = ropeAt(i / 24); P.push(q[0], q[1] + s * 0.13, q[2]); Wv.push(0, 0, 0); Ln.push(0); Cc.push(rope.r, rope.g, rope.b); }
      for (let i = 0; i < 24; i++) { const p = i * 2; I.push(p, p + 2, p + 1, p + 1, p + 2, p + 3); }
      n = 50;
      const NS = 8, SG = 36;
      const ribbon = (x, y, z, col, ph, len) => {
        for (let j = 0; j <= SG; j++) for (const s of [-1, 1]) { P.push(x, y, z); Wv.push(j / SG * len, s, ph); Ln.push(len); Cc.push(col.r, col.g, col.b); }
        for (let j = 0; j < SG; j++) { const p = n + j * 2; I.push(p, p + 2, p + 1, p + 1, p + 2, p + 3); }
        n += (SG + 1) * 2;
      };
      for (let k = 0; k < NS; k++) { const t0 = (k + 0.7) / (NS + 0.4), q = ropeAt(t0), col = silk[k % 4 === 3 ? 3 : PR.int(0, 2)], ph = PR() * 6.28, len = PR.range(5.4, 8.2); ribbon(q[0], q[1] - 0.42, q[2], col, ph, len); }
      for (let k = 0; k < 5; k++) { const col = silk[k % 3], ph = PR() * 6.28, len = PR.range(6, 9); ribbon(PX + 0.6, 6.4 + k * 1.75, GER.GATE_Z, col, ph, len); }   // tied round the east post, flying clear of the portal
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('aW', new THREE.Float32BufferAttribute(Wv, 3)); g.setAttribute('aL', new THREE.Float32BufferAttribute(Ln, 1)); g.setAttribute('color', new THREE.Float32BufferAttribute(Cc, 3)); g.setIndex(I);
      const m = new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms: scarfU, side: THREE.DoubleSide, vertexColors: true,
        vertexShader: /* glsl */`
attribute vec3 aW; attribute float aL; uniform float uTime, uSpd; varying vec3 vW, vC, vN; varying vec2 vT; varying float vD;
vec3 ctr(float t, float ph, float len){
  float k = t / max(len, .1), amp = .22 + 1.25 * k, sp = .6 + .4 * uSpd;
  float w1 = sin(t * 1.2 - uTime * 6.5 * sp + ph), w2 = sin(t * .5 - uTime * 2.4 * sp + ph * 2.3), w3 = sin(t * 2.7 - uTime * 10.5 * sp + ph * 1.7) * k * k;
  return vec3(.93, -.06, .34) * t + vec3(-.2, .78, .6) * ((w1 * .5 + w2 * .42) * amp + w3 * .42) + vec3(0., -1., 0.) * (k * k * .9);
}
void main(){
  float t = aW.x, ph = aW.z, len = aL; vec3 P = position, N = vec3(0., 0., -1.);
  if (len > .5) {
    float k = t / len;
    vec3 c0 = ctr(t, ph, len), T = normalize(ctr(t + .12, ph, len) - ctr(t - .12, ph, len));
    vec3 B = normalize(vec3(0., 1., 0.) - T * T.y), Nn = cross(T, B);
    float tw = (1.1 * sin(t * .75 - uTime * 3.2 + ph * 1.3) + .5 * sin(t * 1.9 - uTime * 7. + ph)) * smoothstep(0., .35, k);
    vec3 Bt = B * cos(tw) + Nn * sin(tw);
    P = position + c0 + Bt * (aW.y * .5 * (1. - .3 * k));
    N = cross(T, Bt);
  }
  vW = P; vC = color; vN = N; vT = vec2(t, aW.y); vec4 mv = viewMatrix * vec4(P, 1.); vD = -mv.z; gl_Position = projectionMatrix * mv;
}`,
        fragmentShader: /* glsl */`
varying vec3 vW, vC, vN; varying vec2 vT; varying float vD;
${GER_GLSL}
void main(){
  vec3 N = normalize(vN + vec3(0., 1e-5, 0.)), V = normalize(cameraPosition - vW); if (dot(N, V) < 0.) N = -N;
  // silk: a darker selvedge, light through the cloth from the sun's side, a long soft sheen
  vec3 alb = vC * (.82 + .18 * smoothstep(1., .7, abs(vT.y))) * (.94 + .1 * gNoise(vec2(vT.x * 3., vT.y * 2.)));
  float sp = max(dot(reflect(-uSunDir, N), V), 0.); sp *= sp; sp *= sp;
  vec3 c = gerLight(alb, N, vW, 1.) + alb * uSunCol * (.42 * max(dot(-N, uSunDir), 0.) + .22 * sp * sp + .1 * sp);
  gl_FragColor = vec4(gerFog(c, vD), 1.);
}` }));
      m.name = 'scarves'; m.frustumCulled = false; scene.add(m);
    }
    await ctx.yield();

    // ------------------------------------------------------------------ grass: fine blades drawn on cards that turn to the eye
    // Every card carries seven thin blades (or three stems of feather grass with silver plumes) drawn in its fragment
    // shader, each with its own height, lean and tone: dark at the roots, sun-rimmed at the tips. The wind runs through
    // the field in waves that bend the cards and lift their sheen; the hitching posts throw long blue shadows over it
    // and the gate a pool of its own light.
    const gd = Math.min(dens, 1.08);
    const WIND = new THREE.Vector2(0.93, 0.36).normalize();
    const flC = (L.flowerColors || ['#e8d8a0', '#c8682c', '#8a4c90']).slice(0, 3).map((h) => new THREE.Color(h));
    const bladeU = { ...groundU, uFade: { value: new THREE.Vector2(230, 330) }, uTipC: C3(L.tip), uDryC: C3(L.dry), uPlumeC: C3(L.snow ? '#e4e0d4' : '#e9dcb4'),
      uDryAmt: { value: L.dryAmt }, uFlowerAmt: { value: L.flowers * 2.2 }, uFl: { value: flC }, uWindDir: { value: WIND } };
    const bladeMat = new THREE.ShaderMaterial({ uniforms: bladeU, side: THREE.DoubleSide,
      vertexShader: /* glsl */`
attribute vec4 aO, aK; uniform float uTime, uWindK; uniform vec2 uFade, uWindDir;
varying vec2 vUv, vS; varying vec3 vW; varying vec4 vK;
float vHash(vec2 p){ p = fract(p * vec2(.1031, .1030)); p += dot(p, p.yx + 33.33); return fract((p.x + p.y) * p.y); }
float vNoise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(vHash(i), vHash(i + vec2(1., 0.)), f.x), mix(vHash(i + vec2(0., 1.)), vHash(i + vec2(1., 1.)), f.x), f.y); }
void main(){
  vec3 root = vec3(aO.x, 0., aO.y);
  vec2 tc = cameraPosition.xz - root.xz; float d = length(cameraPosition - root);
  vec2 f = tc / max(length(tc), .01); float ja = (aO.z - .5) * 1.5, cs = cos(ja), sn = sin(ja);
  f = vec2(f.x * cs - f.y * sn, f.x * sn + f.y * cs);
  vec2 rt = vec2(f.y, -f.x);
  float fade = 1. - smoothstep(uFade.x, uFade.y, d);
  float H = aK.y * fade, Wd = aK.z;
  // the wind: long waves running down the wind, broken by slower cross swells; each card flutters a little by itself
  float ph = dot(root.xz, uWindDir) * .15 - uTime * 1.5 * (.5 + .5 * uWindK) + 5. * vNoise(root.xz * .017);
  float g1 = .5 + .5 * sin(ph), g2 = .5 + .5 * sin(dot(root.xz, vec2(-uWindDir.y, uWindDir.x)) * .023 + uTime * .4 + 1.7);
  float gust = g1 * g1 * (.45 + .55 * g2);
  float lean = (.1 + .52 * gust) * min(uWindK, 1.6) + .05 * sin(uTime * 3.1 + aO.z * 40.);
  vec3 P = root + vec3(rt.x, 0., rt.y) * (position.x * Wd) + vec3(0., position.y * H * (1. - .22 * lean * lean), 0.) + vec3(uWindDir.x, 0., uWindDir.y) * (position.y * H * lean);
  vUv = position.xy; vS = vec2(Wd, max(H, .01)); vW = P;
  vec4 mv = viewMatrix * vec4(P, 1.);
  vK = vec4(aO.w, aK.x, gust, -mv.z);
  gl_Position = projectionMatrix * mv;
}`,
      fragmentShader: /* glsl */`
uniform vec3 uGR, uTipC, uDryC, uPlumeC, uFl[3]; uniform float uDryAmt, uFlowerAmt, uSnow;
varying vec2 vUv, vS; varying vec3 vW; varying vec4 vK;
${GER_GLSL}
${POST_GLSL}
void main(){
  float plume = step(.5, vK.y);
  float NB = mix(7., 3., plume);
  float cx = (vUv.x * .5 + .5) * NB, ci = floor(cx), px = fwidth(cx), colW = 2. * vS.x / NB, y = vUv.y;
  float cov = 0., bt = 0., bh = 0., fl = 0., pl = 0.;
  // flowers stand thickest on the verges of the way out and round the gate; the trodden ground itself bears none
  float flAmt = uFlowerAmt * (1. + 1.6 * wayVerge(vW.xz)) * (1. - wornTrack(vW.xz));
  for (int j = -1; j <= 1; j++) {
    float i = ci + float(j), ok = step(0., i) * step(i, NB - .5);
    float h1 = gHash(vec2(i * 7.3 + 1.7, vK.x * 113.)), h2 = gHash(vec2(i * 3.1 + 9.2, vK.x * 71. + 5.)), h3 = gHash(vec2(i * 5.7 + 4.4, vK.x * 37. + 11.));
    float hb = mix(.48, 1., h1), t = y / hb, tc = clamp(t, 0., 1.);
    float xc = i + .5 + (h2 - .5) * .8 + (h3 - .5) * 1.9 * tc * tc, dx = abs(cx - xc);
    // a blade tapers to a point; feather grass is a hair of a stem under a long soft plume, combed into streaks
    float tt = clamp((tc - .46) / .54, 0., 1.);
    float wB = .21 * pow(1. - tc, .65), wP = max(.04, .26 * pow(max(sin(3.1416 * tt), 0.), .7) * (1. - .45 * tt));
    float streak = mix(smoothstep(.28, .5, gNoise(vec2(dx * 11. - tc * 26., tc * 13. + h1 * 20.))), 1., smoothstep(.12, .4, px));
    float hw = max(mix(wB, wP * mix(1., streak, step(.07, dx)), plume), .55 * px);
    float a = (1. - smoothstep(hw - .5 * px, hw + .5 * px, dx)) * ok * step(t, 1.);
    if (a > cov) { cov = a; bt = tc; bh = h3; pl = plume * smoothstep(.44, .56, tc); fl = 0.; }
    // a flower head on a few blades
    float fd = length(vec2((cx - xc) * colW, (t - .95) * hb * vS.y));
    if (ok * (1. - plume) * step(h2, flAmt) * step(fd, max(.24, 1.1 * px * colW)) > .5) { cov = 1.; bt = 1.; bh = h3; fl = 1. + floor(h1 * 2.99); pl = 0.; }
  }
  if (cov < .5) discard;
  vec3 alb = mix(uTipC, uDryC, step(1. - uDryAmt, bh)) * (.78 + .44 * gHash(vec2(bh * 91., vK.x * 17.)));
  alb = mix(uGR * .75, alb, smoothstep(0., .6, bt));
  alb = mix(alb, uPlumeC, pl);
  if (fl > .5) alb = fl < 1.5 ? uFl[0] : (fl < 2.5 ? uFl[1] : uFl[2]);
  // a blade stands in the shade of the grass round it up to that grass's height: on the way out, where the grass is
  // trodden to stubble (the same wear as the blades' height), the stubble stands in the open and is lit lower down
  float ao = mix(.2, 1., smoothstep(0., 2.4 * (1. - .74 * wornTrack(vW.xz)), vW.y) * (.55 + .45 * bt));
  vec3 V = normalize(cameraPosition - vW); vec2 hs = normalize(uSunDir.xz + vec2(1e-5, 0.));
  float back = .3 + .7 * smoothstep(-.4, .9, dot(-V.xz, hs) / max(length(V.xz), .05));
  float rim = bt * bt * bt * back * (1. + .9 * pl), gust = vK.z;
  float sun = gerCloud(vW.xz) * (1. - postShade(vW)) * uSunGate;
  // the crest of a gust shows the blades' pale sides, the trough between two gusts stands darker
  vec3 lit = (uSkyCol * (.26 + .5 * ao) + uSunCol * (sun * (.22 * ao + .2 * rim))) * mix(.74, 1.2, gust);
  vec3 c = alb * .56 * lit + alb * gateGlow(vW);
  gl_FragColor = vec4(gerFog(c, vK.w), 1.);
}` });
    const bladeBase = new THREE.InstancedBufferGeometry();
    bladeBase.setAttribute('position', new THREE.Float32BufferAttribute([-1, 0, 0, 1, 0, 0, 1, 1, 0, -1, 1, 0], 3)); bladeBase.setIndex([0, 1, 2, 0, 2, 3]);
    const BR = rng.fork('blades');
    // how tall the grass still stands on the way out (the same places as wornTrack in the ground's shader): trodden to stubble
    // along the track from the door to the posts and round the gate
    const wornK = (x, z) => {
      if (z < 30) return 1;
      const t = sstep(6.2, 2.4, Math.abs(x - 1.2 * Math.sin(z * 0.09))) * sstep(33, 42, z) * (1 - sstep(GER.GATE_Z - 5, GER.GATE_Z + 3, z));
      return 1 - 0.74 * Math.max(t, sstep(15, 7.5, Math.hypot(x, z - (GER.GATE_Z - 2))));
    };
    // count cards inside bounds [x0, z0, x1, z1], kept where den(x, z) says; o: h [min, max] m, w [min, max] half width m, plume
    const bladeField = async (name, count, bd, den, o) => {
      const aO = new Float32Array(count * 4), aK = new Float32Array(count * 4); let n = 0;
      for (let k = 0; n < count && k < count * 8; k++) {
        const x = lerp(bd[0], bd[2], BR()), z = lerp(bd[1], bd[3], BR()), keep = BR();
        if (keep < den(x, z)) {
          aO[n * 4] = x; aO[n * 4 + 1] = z; aO[n * 4 + 2] = BR(); aO[n * 4 + 3] = BR();
          aK[n * 4] = o.plume ? 1 : 0; aK[n * 4 + 1] = lerp(o.h[0], o.h[1], BR()) * wornK(x, z); aK[n * 4 + 2] = lerp(o.w[0], o.w[1], BR()); aK[n * 4 + 3] = BR(); n++;
        }
        if ((k & 1023) === 0) await ctx.yield();
      }
      const g = new THREE.InstancedBufferGeometry(); g.setAttribute('position', bladeBase.attributes.position); g.setIndex(bladeBase.index);
      g.setAttribute('aO', new THREE.InstancedBufferAttribute(aO.subarray(0, n * 4), 4)); g.setAttribute('aK', new THREE.InstancedBufferAttribute(aK.subarray(0, n * 4), 4)); g.instanceCount = n;
      g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 30), 400);
      const m = new THREE.Mesh(g, bladeMat); m.name = name; m.frustumCulled = false; scene.add(m);
      await ctx.yield();
      return m;
    };
    const snowK = L.snow ? 0.5 : 1, GZ = GER.GATE_Z;
    // tall grass begins where the poles' tips lie (r 58); round the site it is trodden short
    const grassDen = (x, z) => { const r = Math.hypot(x, z); if (r < 58) return 0; return sstep(58, 65, r) * (1 - 0.6 * sstep(80, 190, r)) * snowK; };
    // along the way in and the way out, where the camera flies low over open ground, the field is at its thickest
    const nearDen = (x, z) => { const r = Math.hypot(x, z); if (r < 58) return 0; return sstep(58, 64, r) * (0.4 + 0.6 * sstep(62, 22, Math.abs(x - (z > 0 ? 8 : 0)))) * snowK; };
    const shortDen = (x, z) => { const r = Math.hypot(x, z); if (r < 35.8 || r > 64) return 0; return (1 - 0.7 * sstep(57, 64, r)) * (z > 20 && Math.abs(x) < 46 ? 1 : (z < -20 && Math.abs(x) < 52 ? 0.7 : 0.4)) * snowK; };
    const plumeDen = (x, z) => grassDen(x, z) * (0.25 + 0.75 * sstep(-0.2, 0.5, ctx.noise.n2(x * 0.03, z * 0.03)));
    const NQ = detail * gd;
    await bladeField('grass-wide', Math.round(15000 * NQ), [-170, -180, 170, 300], grassDen, { h: [2.4, 4.0], w: [1.3, 1.9] });
    await bladeField('grass-in', Math.round(9000 * NQ), [-56, -156, 56, -30], nearDen, { h: [2.0, 3.6], w: [1.0, 1.5] });
    await bladeField('grass-out', Math.round(30000 * NQ), [-62, 30, 84, GZ + 62], nearDen, { h: [2.0, 3.8], w: [1.0, 1.5] });
    await bladeField('grass-short', Math.round(9000 * NQ), [-65, -65, 65, 65], shortDen, { h: [0.9, 1.9], w: [0.7, 1.1] });
    await bladeField('feather-grass', Math.round(3000 * NQ), [-120, -160, 120, 240], plumeDen, { h: [4.4, 6.2], w: [0.9, 1.3], plume: true });
    await ctx.yield();

    // ------------------------------------------------------------------ horses, foals, cranes (kit fauna, 10x)
    const hex3 = (c) => '#' + new THREE.Color(c[0], c[1], c[2]).multiplyScalar(1 / Math.max(1, c[0], c[1], c[2])).getHexString(THREE.LinearSRGBColorSpace);
    const fLight = { sunDir: SUN, sunColor: hex3(L.sun), sunIntensity: 3.1, sky: hex3(L.skyC), skyIntensity: 1.6, ground: hex3(L.gnd), groundIntensity: 1.5 };
    const horseOpt = { species: 'horse', size: 9, coat, light: fLight, ...(piebald ? { tints: ['#ffffff', '#f4ece0', '#8a7a6a', '#fff8f0'] } : {}) };
    const herd = F.makeHerd({ ...horseOpt, rng: rng.fork('herd'), count: 6, sizes: [1, 0.95, 1.05, 1, 0.92, 0.52], mode: 'migrate', speed: 11, spread: [10, 110],
      route: [[-112, 0, GZ + 112], [-35, 0, GZ + 106], [45, 0, GZ + 110], [112, 0, GZ + 120], [120, 0, GZ + 138], [60, 0, GZ + 152], [-40, 0, GZ + 154], [-114, 0, GZ + 140]], closed: true, start: V() });
    await ctx.yield();
    const horseAgain = { ...horseOpt, geometry: herd.geometry };       // every later band shares the first one's body: it is modelled once
    const herdEast = F.makeHerd({ ...horseAgain, rng: rng.fork('herd2'), count: 4, sizes: [1, 0.96, 1.04, 0.9], center: [-104, 0, GZ + 236], radius: 22, roam: 0.45 });
    await ctx.yield();
    const foals = F.makeHerd({ ...horseAgain, rng: rng.fork('foals'), count: 1, sizes: [0.5], center: [-58, 0, GZ + 44], radius: 3, roam: 0.3 });
    await ctx.yield();
    // the foal that bucks stands almost on the spot (a slow turn about its peg), so that the hop lifts it about its own middle
    const bucker = F.makeHerd({ ...horseAgain, rng: rng.fork('bucker'), count: 1, sizes: [0.52], center: [0, 0, 0], radius: 0.4, roam: 0.07, speed: 0.25, blobShadow: false });
    const buckPivot = new THREE.Group(); buckPivot.position.set(-42, 0, GZ + 33); buckPivot.add(bucker.object);
    scene.add(herd.object, herdEast.object, foals.object, buckPivot);
    await ctx.yield();
    // the running herd: four bands at a gallop round one long loop that crosses the whole view beyond the gate, a quarter
    // of the loop apart, so that one band is always crossing the middle distance and another is far off
    const runPts = [[-225, GZ + 92], [-120, GZ + 76], [0, GZ + 70], [120, GZ + 74], [215, GZ + 90], [252, GZ + 126], [215, GZ + 162], [90, GZ + 178], [-90, GZ + 178], [-215, GZ + 162], [-255, GZ + 126]];
    const runCurve = new THREE.CatmullRomCurve3(runPts.map((q) => new THREE.Vector3(q[0], 0, q[1])), true, 'centripetal'), runLen = runCurve.getLength(), NBAND = 4;
    const sOnRun = (x, z) => { let best = 1e12, bi = 0; for (let i = 0; i < 300; i++) { runCurve.getPointAt(i / 300, _pp); const d = (_pp.x - x) ** 2 + (_pp.z - z) ** 2; if (d < best) { best = d; bi = i; } } return bi / 300 * runLen; };
    const runners = [], runOff = [], runQ = new THREE.Vector3(); let RUN_V = 1, runS0 = 0;
    for (let k = 0; k < NBAND; k++) {
      // each band is a herd of twelve, nine grown and three foal sized, in a column twice as long as the old band of six
      // and no wider (the tethered foals and the walking herd stand 25 to 38 m beside the loop); the first six are the old
      // band's own horses, by the kit's draws, and six run with them
      const h = F.makeHerd({ ...horseAgain, rng: rng.fork('run' + k), count: 12, sizes: [1, 0.94, 1.06, 0.98, 0.6, 0.9, 1.02, 0.58, 0.96, 0.92, 0.62, 1.04], mode: 'migrate', gait: 'run', speed: 8.5, spread: [14, 160],
        route: runPts.map((q) => [q[0], 0, q[1]]), closed: true });
      // where a band is at time 0 is the kit's own draw: the first band keeps it, and the offset moves band k to k quarters
      // of the loop ahead of the first, by the speed the kit runs a band at; they run by the world's clock
      h.positionAt(0, undefined, runQ);
      if (!k) { RUN_V = h.uniforms.uSpeed.value; runS0 = sOnRun(runQ.x, runQ.z); }
      const runLap = runLen / RUN_V, off = (runS0 + k * runLen / NBAND - sOnRun(runQ.x, runQ.z)) / RUN_V;
      runOff.push(((off % runLap) + runLap) % runLap); runners.push(h); scene.add(h.object);
      await ctx.yield();
    }
    // dust hanging behind each running band: it is born among the rear half of the column and just behind it, lies back
    // along the loop itself (the way they came, round its bends) and rises above the horses' backs in a plume, so the
    // leading horses run clear; and the pool of light the gate
    // throws on the grass
    const DN = 36, dustS = [0, 0, 0, 0], loopXZ = Array.from({ length: 96 }, (_, i) => { runCurve.getPointAt(i / 96, _pp); return new THREE.Vector2(_pp.x, _pp.z); });
    const dust = new THREE.Mesh(quadGeo(NBAND * DN, (i, a, k) => {
      a[i * 4] = Math.floor(i / DN); a[i * 4 + 1] = PR.range(-15, 15); a[i * 4 + 2] = PR.range(80, 170); a[i * 4 + 3] = PR();
      k[i * 4] = PR.range(0.4, 0.66); k[i * 4 + 1] = PR.range(14, 26); k[i * 4 + 2] = PR(); k[i * 4 + 3] = PR();
    }), new THREE.ShaderMaterial({ uniforms: { ...light, uBandS: { value: dustS }, uLoop: { value: loopXZ }, uLoopLen: { value: runLen }, uRunV: { value: RUN_V }, uCol: C3(L.snow ? '#e6ecf8' : hexMix(L.grassC, L.fog, 0.45)) }, transparent: true, depthWrite: false,
      vertexShader: /* glsl */`
attribute vec4 aO, aK; uniform vec2 uLoop[96]; uniform float uBandS[4], uLoopLen, uTime, uRunV; varying vec3 vQ, vW; varying float vD;
void main(){
  // where the band's front is on the loop, in metres along it; a puff lies that many metres back along the loop itself
  float sb = uBandS[0];
  if (aO.x > 2.5) sb = uBandS[3]; else if (aO.x > 1.5) sb = uBandS[2]; else if (aO.x > .5) sb = uBandS[1];
  float life = fract(uTime * aK.x + aO.w), age = life / aK.x;
  float lf = fract((sb - aO.z - uRunV * age * .9) / uLoopLen) * 96.;
  int li = min(int(lf), 95), lj = li == 95 ? 0 : li + 1, lh = li == 0 ? 95 : li - 1, lk = lj == 95 ? 0 : lj + 1;
  // the way the loop runs there is blended from the points either side, so a puff's place turns evenly round a bend
  vec2 la = uLoop[li], lb = uLoop[lj], bd = normalize(mix(normalize(lb - uLoop[lh]), normalize(uLoop[lk] - la), lf - float(li))), bq = mix(la, lb, lf - float(li));
  vec3 c = vec3(bq.x, 0., bq.y) + vec3(-bd.y, 0., bd.x) * aO.y + vec3(0., 3. + 18. * life, 0.);
  float sz = aK.y * (.55 + 1.5 * life);
  vec3 right = vec3(viewMatrix[0][0], viewMatrix[1][0], viewMatrix[2][0]), up = vec3(viewMatrix[0][1], viewMatrix[1][1], viewMatrix[2][1]);
  vec3 P = c + (right * position.x * 1.5 + up * position.y) * sz;
  vW = P; vQ = vec3(position.xy, smoothstep(0., .1, life) * (1. - life) * (1. - life));
  vec4 mv = viewMatrix * vec4(P, 1.); vD = -mv.z; gl_Position = projectionMatrix * mv;
}`,
      fragmentShader: /* glsl */`
uniform vec3 uCol; varying vec3 vQ, vW; varying float vD;
${GER_GLSL}
void main(){
  float r = length(vQ.xy) * 2., n = gFbm(vQ.xy * 2.4 + vW.xz * .03 + vec2(0., -uTime * .15));
  // a billow, not a pane: the puff is thinner where its own finer noise is low
  float a = smoothstep(1., .25, r + (n - .5) * .9) * vQ.z * (.6 + .5 * gFbm(vQ.xy * 5.3 + vW.xz * .07 + vec2(3., -uTime * .22)));
  vec3 c = uCol * (uSkyCol * .5 + uSunCol * (.36 + .16 * vQ.y)) * gerCloud(vW.xz);
  gl_FragColor = vec4(gerFog(c, vD), a);
}` }));
    dust.name = 'herd-dust'; dust.frustumCulled = false; dust.renderOrder = 4; scene.add(dust);
    await ctx.yield();
    // the eagles wheel 50 m over the route's level: by place the lowest any deal can set one (its circle's middle 22 m under the course,
    // its lift 6 m down, its own ball some 15 m) stays 2 m and more over the lens at the lens's highest
    const birds = eagles
      ? F.makeFlock({ rng: rng.fork('birds'), species: 'eagles', count: 2, size: 9, wander: [0, 0, 0, 0.2], light: fLight, cross: { path, u: toNew(0.31), lead: 42, height: 50, angle: 60, span: 460, duration: DUR } })
      : F.makeFlock({ rng: rng.fork('birds'), species: 'geese', count: 11, size: 10, speed: 16, light: fLight, body: '#9aa0a8', belly: '#c8ccd0', wingC: '#7c828c', tip: '#2a2c30', head: '#2a2c30', neckC: '#3a3c42',
        cross: { path, u: toNew(0.31), lead: 40, height: 40, angle: 62, span: 460, duration: DUR } });
    scene.add(birds.object);
    await ctx.yield();
    // the tether line for the foals: a ribbon pegged to the grass
    { const g = new THREE.PlaneGeometry(22, 0.3, 12, 1); g.rotateX(-Math.PI / 2); const tb = makeGB(); tb.add(g, { p: [-50, 0.5, GZ + 39], r: [0, 0.2, 0], c: '#3a3026', m: 1 });
      for (const s of [-1, 1]) tb.add(cyl(0.2, 0.26, 1.6, 6), { p: [-50 + s * 10.6, 0.7, GZ + 39 - s * 2.2], c: pal.woodDark });
      scene.add(new THREE.Mesh(tb.build(), mat2)); }
    await ctx.yield();
    // the white canvas of the roof cover hangs on the scarf rope until it is wanted (it is thrown over the roof while we
    // are indoors); until the door opens it also keeps the way out to itself
    const cover = (() => {
      const W = 2 * GER.POST_X - 0.9, NX = 20, NY = 12, P = [], Uv = [], I = [];
      for (let j = 0; j <= NY; j++) for (let i = 0; i <= NX; i++) { const cu = i / NX, cv = j / NY, top = 16.2 - 0.8 * Math.sin(Math.PI * cu); P.push((cu - 0.5) * W, top - cv * (top - 2.6), GZ - 1.1); Uv.push(cu, cv); }
      for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) { const p = j * (NX + 1) + i, q = p + NX + 1; I.push(p, q, p + 1, p + 1, q, q + 1); }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(Uv, 2)); g.setIndex(I);
      const m = new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms: { ...light, uSpd: { value: L.wind }, uCA: C3('#b9b09c'), uCB: C3(pal.blue), uCC: C3(pal.wood) }, side: THREE.DoubleSide,
        vertexShader: /* glsl */`
uniform float uTime, uSpd; varying vec3 vW; varying vec2 vUv; varying float vD;
void main(){
  float v = uv.y, x = position.x;
  // hung over the rope in deep folds; the wind fills it from below
  float bil = (sin(x * .42 + uTime * 1.3 * (.6 + .4 * uSpd)) * .9 + sin(x * 1.1 - uTime * 2.2 + v * 3.) * .35) * v * v * (.6 + .4 * uSpd);
  vec3 P = position + vec3(0., 0., .34 * sin(x * 2.3 + v * 1.4) * (.3 + .7 * v) + bil);
  vW = P; vUv = uv; vec4 mv = viewMatrix * vec4(P, 1.); vD = -mv.z; gl_Position = projectionMatrix * mv;
}`,
        fragmentShader: /* glsl */`
uniform vec3 uCA, uCB, uCC; varying vec3 vW; varying vec2 vUv; varying float vD;
${GER_GLSL}
void main(){
  vec3 dx = dFdx(vW), dy = dFdy(vW), N = normalize(cross(dx, dy) + vec3(0., 0., 1e-5));
  vec3 V = normalize(cameraPosition - vW); if (dot(N, V) < 0.) N = -N;
  // unbleached canvas, a woven texture, two painted bands and a hem near the foot
  float weave = gNoise(vW.xy * vec2(9., 14.)) * .5 + gNoise(vW.xy * vec2(31., 5.)) * .5;
  vec3 alb = uCA * (.82 + .22 * weave) * (.9 + .2 * gFbm(vW.xy * .5));
  float b1 = smoothstep(.02, .0, abs(vUv.y - .8) - .03), b2 = smoothstep(.012, .0, abs(vUv.y - .89) - .012), b3 = smoothstep(.01, .0, abs(vUv.y - .715) - .006);
  alb = mix(alb, uCB * .8, b1); alb = mix(alb, uCC * .8, max(b2, b3));
  alb *= .55 + .45 * smoothstep(0., .05, min(vUv.x, 1. - vUv.x)) ;
  vec3 c = gerLight(alb, N, vW, 1.) + alb * uSunCol * (.3 * max(dot(-N, uSunDir), 0.));
  gl_FragColor = vec4(gerFog(c, vD), 1.);
}` }));
      m.name = 'canvas-cover'; m.frustumCulled = false; scene.add(m);
      return m;
    })();
    await ctx.yield();

    await sky.prewarm(ctx.renderer, null, scene);

    // ------------------------------------------------------------------ frame
    const camP = new THREE.Vector3(), chestAt = new THREE.Vector3(), gaze = new THREE.Vector3(), crownP = new THREE.Vector3(), _c = new THREE.Color();
    const beamMid = A.ring.center.clone().lerp(A.beamFoot, 0.52);
    const bell = (a, b, c, d, x) => sstep(a, b, x) * (1 - sstep(c, d, x));
    return {
      scene, path, duration: DUR, pace, ride: 'none', style: 'none',
      camera: { fov: 64, near: 0.3, far: 4800, lookAhead: 18, sway: 0.6, bank: 0.3 },
      pois: [
        // coming in: the wheel going up on its pillars, dead ahead
        { at: () => crownP.copy(hero.parts.crown.position), from: toNew(0.03), to: toNew(0.15), weight: 0.34 },
        // inside the ring: the wheel on its pillars over the stove, the lattice racing round behind it
        { at: [0.5, 19, 1], from: toNew(0.13), to: toNew(0.31), weight: 0.8 },
        // the raising: look up and ahead to where the poles are falling into the wheel
        { at: (t, u) => { path.pointAt(u, gaze); const bq = Math.atan2(gaze.x, gaze.z) + 0.8; return gaze.set(Math.sin(bq) * 4.5, 24, Math.cos(bq) * 4.5); }, from: toNew(0.26), to: toNew(0.44), weight: 0.8 },
        // the felts: look up and across as the wall is laid, the roof hem climbs and the sky closes to the ring
        { at: [9, 16, 2], from: toNew(0.405), to: toNew(0.5), weight: 0.6 },
        // the picture: east across the finished room, the blade of light from the ring down to its oval on the bed; it is
        // held all the way round the south side to the bed's foot, where it crosses in front of the chests
        { at: beamMid, from: toNew(0.485), to: toNew(0.675), weight: 0.85 },
        { at: A.ring.center.clone().lerp(A.beamFoot, 0.62), from: toNew(0.6), to: toNew(0.7), weight: 0.7 },
        // the close pass: north at the lamp chest and the fiddle, then west along the row
        { at: (t, u) => { const k = sstep(0.7, 0.74, toOld(u)), d = (152 + 58 * k) * Math.PI / 180; return chestAt.set(Math.sin(d) * 25, 6.2 - 1.2 * k, Math.cos(d) * 25); }, from: toNew(0.685), to: toNew(0.752), weight: 0.75 },
        // turning south: the open door on the right, the beam on the left
        { at: [8, 9.5, 17], from: toNew(0.725), to: toNew(0.805), weight: 0.85 },
        { at: A.door, from: toNew(0.785), to: toNew(0.86), weight: 0.5 },
        // the way out: once the leaves stand open the gaze goes to the gate and holds it until the engine lets every gaze go before the exit
        { at: A.portalSeat, from: toNew(TL.door[1]), to: 1, weight: 0.72 },
      ],
      portal: { shape: 'circle', radius: 5, color: L.portal, glow: 0.45, revealDistance: 220 },
      post: { exposure: L.exposure, bloom: { strength: 0.5, radius: 0.62, threshold: 1.1 },
        grade: { saturation: 0.97, contrast: 1.06, tint: L.tint, shadowTint: L.shadow, vignette: 0.3, grain: 0.02, aberration: 0 } },
      update(dt, t, camera, uFlight) {
        const u = toOld(uFlight);                                 // every beat below is on the brief's scale
        hero.update(dt, t, camera, u);
        camP.setFromMatrixPosition(camera.matrixWorld);
        ctx.renderer.getDrawingBufferSize(BUF);
        const S = hero.state;
        // air: thin gold haze outside, a faint smoke inside once the felt is on; the open door lets the far air back in
        const inside = sstep(31, 28, Math.hypot(camP.x, camP.z)) * S.closure * (1 - 0.8 * S.doorOpen);
        _c.copy(fogCol).lerp(fogIn, inside);
        const den = lerp(L.fogDen, 0.0013, inside);
        scene.fog.color.copy(_c); scene.fog.density = den; light.uFogCol.value.set(_c.r, _c.g, _c.b); light.uFogDen.value = den;
        // rugs roll out from the stove; the pipe rises through the crown
        const rk = sstep(0.137, 0.24, u);
        rugU.uReveal.value = lerp(4.5, 31.5, rk); rugU.uRoll.value = lerp(0.75, 0.25, rk);
        pipe.position.y = lerp(-18.6, 0, sstep(0.4, 0.45, u));
        // tea: the ladle swings, the pan boils over as the door opens
        const boil = bell(0.72, 0.78, 0.86, 0.92, u);
        steamU.uBoil.value = boil; steamU.uPipe.value = sstep(0.44, 0.48, u);
        foam.scale.set(2.2 + 0.7 * boil, 0.05 + 0.75 * boil * (0.8 + 0.2 * Math.sin(t * 5)), 2.2 + 0.7 * boil);
        ladle.rotation.y = 0.55 * Math.sin(t * 1.15) + 0.2 * Math.sin(t * 2.7); ladle.rotation.x = 0.12 * Math.sin(t * 1.15 + 1);
        churnBag.rotation.x = 0.3 * Math.sin(t * 2.2) + 0.06 * Math.sin(t * 5.1);
        const fk = sstep(0.4, 0.455, u);                         // the fiddle is hung once there is a felt wall behind it
        fiddle.position.lerpVectors(fidA, fidB, fk); fiddle.position.y += Math.sin(Math.PI * fk) * 4;
        fidQ1.setFromAxisAngle(camP.set(0, 0, 1), fk * (0.07 * Math.sin(t * 0.9) + 0.02 * Math.sin(t * 2.3)));
        fiddle.quaternion.copy(fidQ0).slerp(fidQ1, fk);
        camP.setFromMatrixPosition(camera.matrixWorld);
        // the puppy breathes; its tail thumps as we turn for the door
        const thump = bell(0.76, 0.785, 0.85, 0.88, u);
        pet.children[0].scale.set(1, 1 + 0.07 * Math.sin(t * 1.8), 1 + 0.03 * Math.sin(t * 1.8));
        petTail.rotation.z = 1.25 - thump * 0.95 * Math.abs(Math.sin(t * 7.5)) + 0.05 * Math.sin(t * 1.3);
        // motes, first snow, sparks outside
        motes.material.uniforms.uGain.value = 0.15 * S.closure + 0.85 * S.beam;
        const snowIn = rare ? sstep(0.42, 0.48, u) * (1 - sstep(0.885, 0.91, u)) : 0;
        flakes.visible = snowIn > 0.001; flakes.material.uniforms.uGain.value = snowIn;
        sparks.setOpacity(rare ? sstep(0.84, 0.9, u) : 0); sparks.update(dt, t, camera);
        // the canvas leaves the rope for the roof once the room is shut; the birds cross while half the roof is still open
        // sky and fly on along their own course
        cover.visible = u < 0.56;
        // the foal bucks as we come out
        const bk = bell(0.885, 0.905, 0.962, 0.985, u), cyc = (t * 0.95) % 1, hopT = clamp(cyc / 0.5, 0, 1), hop = Math.sin(Math.PI * hopT);
        buckPivot.position.y = 2.0 * bk * hop * hop; buckPivot.rotation.x = 0.16 * bk * Math.sin(6.2832 * hopT); buckPivot.rotation.z = -0.1 * bk * Math.sin(6.2832 * hopT + 0.8);
        herd.update(dt, t, camera, uFlight); herdEast.update(dt, t, camera, uFlight); foals.update(dt, t, camera, uFlight); bucker.update(dt, t, camera, uFlight); birds.update(dt, t, camera, uFlight);
        // the running bands go round their loop by the world's clock
        for (let k = 0; k < NBAND; k++) runners[k].update(dt, t + runOff[k], camera, uFlight);
        for (let k = 0; k < NBAND; k++) dustS[k] = (runS0 + k * runLen / NBAND + RUN_V * t) % runLen;
        flames.update(dt, t, camera); stoveGlow.update(dt, t, camera);
        for (let i = 0; i < 7; i++) light.uLamp.value[i].w = 0.86 + 0.1 * Math.sin(t * 6.3 + i * 2.1) + 0.06 * Math.sin(t * 13.7 + i * 4.4);
        sky.update(dt, t, camera);
      },
      dispose() { atlas.dispose(); hero.dispose(); if (sky.dispose) sky.dispose(); },
    };
  },
};
