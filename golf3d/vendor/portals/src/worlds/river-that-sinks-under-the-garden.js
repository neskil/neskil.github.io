// THE RIVER THAT SINKS UNDER THE GARDEN (from Coleridge's "Kubla Khan")
// Three acts joined by one river. (1) A fountain is forced up in pants from a chasm in a hill of cedars and throws rocks
// about like hail; the river is born at its foot. (2) The river winds in wide loops through old forest, lawns and walled
// gardens of blossoming incense trees, through a water gate, to a long pool under a gold and lapis dome (the hero,
// src/parts). (3) Under the dome it runs into a mouth in a cliff of blue ice and falls in stages through caverns lit by
// their own ice and by shafts of sun, and out of a last arch into a sunless sea: a hall of ice under a ribbed vault, lit by
// its own water and by cold daylight through rifts of the roof.
//
// Layout: the entry stands in the upper chasm, south of the vent, and looks down it (10 to 40 degrees west of north) at the fountain,
// which stands on the line flown; the way passes the vent once, on the side away from the valley, three bowl's measures off, leaves
// by the gorge and turns west (-X) with the river; the head wall with the dome and the water gate under it stands across the valley
// at x = XC; the caverns run on west and down; from the last arch the way goes straight out over the cataract and down the river's
// current to the ring, which stands free over the water with its gate of ice behind it. Where the cliff stands, how long the
// chasm's two parts are, how many loops the river makes and how wide, how long the halls are and how far out the ring stands are
// drawn by the visit.
//
// THE WATER GATE'S CROWN: it stands 4 m over the straight line from 15 m over the river where it straightens (the head of the
// gate's run, 55 to 80 m before the gate) to the dome's finial, and never under 34 m: a rule of the dome's height, the river's
// level and two distances along the river.
//
// THE LIGHT IS THE PLACE'S OWN, and it stands: the sun, the sky's light and the day's haze never change, and they lie on what
// stands under the sky. Under the cliff the ice is lit by itself, by the shafts through the roof and by the water (its shaders
// read where a point of it lies: day on the faces turned to the mouth in the first hall, the sea's phosphor on those turned to
// the arch in the third), and it is lost in the caverns' own haze; the sea's things in the sea's. Where one stands under the rock
// and no ice closes the view, the rock's dark is seen, never the sky. Nothing of the light follows the flight.
//
// WHAT IS DRIVEN BY WHAT. By the WORLD'S CLOCK, as habits that go on whether anyone is there (each reads right at any moment):
// the fountain's pants, its rocks, foam and spray; the river, the rills, the falls, the cave river and the sea's swell and
// glints; the burners' smoke; the mists; the petals and the ice dust; the pennants; the cranes on their oval, the eagles and
// swifts on their rounds, the herds and waders about their places, the butterflies and dragonflies about theirs; the clouds;
// the rare creature on its circle. By PLACES OF THE WAY (metres flown), only two things: how fast we go (the pace) and WHAT IS
// DRAWN: a thing that no straight line from the way can yet reach through the mouth or the arch is not drawn, each thing by a sight test of its own worked
// out in build (the caverns' front from where the mouth is first in sight over the land; every thing of the caverns from 16 m
// before the first place whose line through the mouth reaches it, and what no such line reaches from the pool's head; the sea,
// its cataract with it, from where a line can first reach the arch, and each of its fine things from where a line through
// the arch first reaches it; the gardens go off 60 m inside the mouth, where they lie behind the way), and a piece of ice that
// is one of many is drawn in a far shape of fewer triangles until the way comes near it. The gaze has three pulls between
// places of the way. Nothing begins, turns or ends because we come.
//
// Departures from the design, said here: (1) the fountain pants on the clock (a pant every period, its strength from a seeded table),
// not at places of the flight. (2) The way does not round the fountain: it comes down the upper chasm with the column before it and
// passes it once (for the camera's measure and so that the way stands back). (3) The rare long creature circles on the clock
// without end (the design: one turn): a thing on the clock must read at any phase. (4) The terrace's jets are not built: its four
// basins hold still water. (5) The cranes fly a circuit of their own on the clock, three skeins a third of it apart from one
// dealt start: the longest wait for a skein at any place of the circuit is a third of its time, about 13 s. (6) The ring stands free over the sea (the
// design: on a low rock), so that it is seen whole against the water from the arch on. (7) At the entry the river runs away from
// us (the design: "the river running toward the viewer"): the way comes down the upper chasm above the vent, where the river is
// born, and goes down the valley with it; the river is never met head on.
//
// THE PACE (how fast we go, nothing else) is told by metres flown between places of the world (the vent, the loops' crests,
// the straightening, the gate, the pool's head, the mouth, the falls, the arch).
import * as THREE from 'three';
import { makePath, clamp, lerp, smoothstep as sst, bell } from '../kit/core.js';
import { makeSky, makeLightRig, skyDirection } from '../kit/sky.js';
import * as T from '../kit/terrain.js';
import * as Water from '../kit/water.js';
import * as flora from '../kit/flora.js';
import * as F from '../kit/fauna.js';
import * as fx from '../kit/fx.js';
import { buildHero, makeLook, makeIceMaterial, makeIceCave, iceSheetGeometry, icicleGeometry, icicleFarGeometry, columnGeometry, makeRockFountain, makeIncense, makeDomeMaterial, makeWaterMaterial, ribbonGeometry, makeGeo, lin, wallShape, poolHalf, POOL_LEN, MOUTH, GLSL_N3, GLSL_SEA_LIGHT, seaLightUniforms, burnerInto, BURNER_H } from '../parts/river-that-sinks-under-the-garden.js';

const C = (h) => new THREE.Color(h);
const TAU = Math.PI * 2;
const ZR = -196, WY = 0.32;                     // the axis of the gardens' last reach; the water surface outdoors

export default {
  id: 'river-that-sinks-under-the-garden',
  name: 'The River That Sinks Under the Garden',
  category: 'books',
  placeKind: 'wilderness',
  book: 'Kubla Khan',
  author: 'Samuel Taylor Coleridge, 1772 to 1834',
  media: ['air', 'water'],
  weirdness: 0.45,
  async build(ctx) {
    const N = ctx.noise, vary = ctx.vary || {}, detail = (ctx.quality && ctx.quality.detail) || 1;
    const dk = clamp(((vary.density ?? 1) - 0.7) / 0.6, 0, 1), dens = lerp(0.84, 1.0, dk) * (0.55 + 0.45 * detail), lush = lerp(0.7, 1.15, dk) * (0.55 + 0.45 * detail), rare = !!vary.rare;
    // Every stream of chance in this world, each made from the visit's seed and its own name and drawing from no other, all taken here
    // before anything is built. A thing that is dealt (a wood, a herd, the pillars of the sea) has a stream to itself.
    // Each look of the visit has its own ('cover', 'haze', 'wind', 'fountain-voice', 'herd-kind', 'wader-kind', 'blossom-colour').
    // Five are handed to kit calls that must be given a stream and draw nothing from it ('stone-skin': the stones' material;
    // 'cave-river0' to 'cave-river3': the cave river's four ribbons); 'creature' is drawn on the rare visit only.
    const RN = {};
    for (const name of ['hour', 'cover', 'haze', 'wind', 'fountain-voice', 'herd-kind', 'wader-kind', 'blossom-colour', 'sun', 'course', 'hill', 'wall', 'sky', 'rills', 'land', 'hero',
      'forest', 'cedars', 'bank-blossom', 'grove', 'terrace-rows', 'oak1', 'oak2', 'pine1', 'conifer1', 'oak3', 'oak4', 'pine2', 'conifer2', 'cypress', 'cherry1', 'cherry2', 'cherry3', 'cherry4',
      'forest-scatter', 'cedar-scatter', 'orchard-scatter', 'rows-scatter', 'grass', 'flowers', 'flowers2', 'reeds', 'stones', 'stone-shape', 'stone-skin', 'walls', 'fountain', 'burners',
      'banks', 'eagles', 'swifts0', 'swifts1', 'swifts2', 'herd', 'deer', 'waders', 'egrets', 'cranes', 'butterflies', 'dragonflies', 'petals', 'ice-dust',
      'cave-axis', 'cave-river0', 'cave-river1', 'cave-river2', 'cave-river3', 'fall0', 'fall1', 'fall2',
      'icicles-front', 'icicles-deep', 'columns-right', 'columns-left', 'shaft0', 'shaft1', 'shaft2', 'shaft3', 'mist-places', 'cave-mist', 'hanging', 'pillars', 'creature',
      'chasm', 'cleft', 'gorge', 'round', 'approach', 'chasm-breadth', 'ledge-cedars', 'scree', 'reach-stones', 'chasm-cedars', 'ferns', 'lilies', 'sea', 'pool', 'sea-leg', 'sea-level', 'wing', 'vault', 'rifts', 'frozen-fall', 'ring-gate', 'pillar-shapes', 'sea-shaft0', 'sea-shaft1', 'sea-shaft2', 'sea-shaft3', 'sea-shaft4', 'cataract0', 'cataract1', 'cataract2', 'hall-things', 'throat', 'last-run', 'hall0', 'hall1', 'hall2']) RN[name] = ctx.core.makeRng(ctx.core.hashSeed('xanadu ' + name + ':' + ctx.seed));
    const scene = new THREE.Scene();
    const updaters = [];

    // ---------- what this visit is like ----------
    const hour = vary.hour === 'night' ? 'night' : vary.hour === 'golden' || vary.hour === 'dawn' ? 'golden' : vary.hour === 'day' ? 'day' : (RN.hour.chance(0.2) ? 'golden' : 'day');
    // each look of the visit from a stream of its own (the fountain's voice is one look: how loud it pants and how often)
    const V = {
      hour, cover: RN.cover.range(0.15, 0.4), haze: RN.haze.range(0.85, 1.2), wind: RN.wind.range(0.8, 1.3), loud: RN['fountain-voice'].range(0.85, 1.15) * (rare ? 1.2 : 1), period: RN['fountain-voice'].range(1.7, 2.2),
      herd: RN['herd-kind'].pick(['deer', 'deer', 'antelope']), wader: RN['wader-kind'].pick(['crane', 'crane', 'egret', 'heron']),
      blossom: RN['blossom-colour'].pick([['#f2a7b8', '#ffd6e0'], ['#f4b3c2', '#ffe2ea'], ['#ee9db4', '#ffc9d8']]),
    };
    const jitOf = (r) => (a) => r.range(-a, a);

    // ---------- sky, sun, the shared light values ----------
    let jit = jitOf(RN.sun);
    const SUN_AZ = 192 + jit(5);
    const H = {
      day: { preset: 'day', el: 44 + jit(3), sun: '#fff0d4', sunI: 3.3, hemi: '#7d9fd6', hemiG: '#5a7040', hemiI: 1.25, fog: '#b9d2ea', fogD: 0.00075, exp: 1.0, shaft: '#fff3d6', ice: 1.0, lamp: '#000000' },
      golden: { preset: 'goldenHour', el: 20 + jit(3), sun: '#ffc27a', sunI: 3.4, hemi: '#8f8fc8', hemiG: '#6a5a3c', hemiI: 1.45, fog: '#e6b993', fogD: 0.0009, exp: 1.0, shaft: '#ffdcb4', ice: 0.95, lamp: '#000000' },
      night: { preset: 'night', el: 40 + jit(3), sun: '#a9c0ff', sunI: 1.5, hemi: '#4a62a8', hemiG: '#1c2a30', hemiI: 1.15, fog: '#162848', fogD: 0.0009, exp: 1.3, shaft: '#b8d0ff', ice: 0.9, lamp: '#ffb866' },
    }[hour];
    const skyOpts = { rng: RN.sky, preset: H.preset, transparent: true, clouds: { coverage: V.cover, scale: 1.2, softness: 0.3 } };
    if (hour === 'night') Object.assign(skyOpts, { bake: true, renderer: ctx.renderer, bodies: [{ elevation: H.el, azimuth: SUN_AZ, size: 3.2, phase: 1, color: '#fff3dc', texture: 0.5, intensity: 1.2, glow: 0.24, glowColor: '#9fb4ff', glowSize: 2.4 }], key: 0, clouds: { coverage: V.cover * 0.6, scale: 1.2, softness: 0.3 } });
    else Object.assign(skyOpts, { sunElevation: H.el, sunAzimuth: SUN_AZ });
    const sky = makeSky(skyOpts);
    if (sky.materialLow) sky.materialLow.transparent = true;
    scene.add(sky.object);
    const SUN = skyDirection(H.el, SUN_AZ).normalize();
    const rig = makeLightRig(sky, { intensity: 1, ambient: 1, bounce: 0.3, follow: false });
    rig.direction.copy(SUN); rig.sun.position.copy(SUN).multiplyScalar(500);
    rig.sun.color.set(H.sun); rig.sun.intensity = H.sunI; rig.hemi.color.set(H.hemi); rig.hemi.groundColor.set(H.hemiG); rig.hemi.intensity = H.hemiI;
    scene.add(rig.object);
    const fogOut = C(H.fog), fogCave = C('#0c3a62'), fogSea = C('#0d2b3a');
    scene.fog = new THREE.FogExp2(fogOut.clone(), H.fogD * V.haze);
    scene.background = C('#050c18');
    const look = makeLook();
    look.uSunDir.value.copy(SUN); look.uSunCol.value.set(H.sun).multiplyScalar(H.sunI);
    look.uSkyCol.value.set(H.hemi).multiplyScalar(H.hemiI * 0.8); look.uHorizonCol.value.copy(fogOut).multiplyScalar(hour === 'night' ? 1.2 : 0.95);
    look.uGroundCol.value.set(H.hemiG).lerp(C('#4f9fb0'), 0.5).multiplyScalar(0.8); look.uLamp.value.set(H.lamp).multiplyScalar(hour === 'night' ? 2.2 : 0);
    // sun that has come down a crack in the roof of ice: the hour's own shaft colour warmed, to stand against the blue
    look.uShaft.value.set(H.shaft).lerp(C('#ffb060'), hour === 'night' ? 0.15 : 0.45); look.uDay.value.set(H.shaft); look.uIceGain.value = H.ice;
    await ctx.yield();

    // ---------- the river's course, drawn by the visit ----------
    // The first reach leaves the vent down the gorge and turns west. Then the river winds in loops on alternate sides (their number and
    // lengths are drawn below), straightens, goes under the water gate and runs the gardens' last reach to the cliff.
    const cr = RN.course;
    const FV = new THREE.Vector3(16 + cr.range(-3, 3), 1, -190 + cr.range(-4, 4));              // the vent of the fountain
    // The chasm: one straight slanting cleft down the hill, through the vent. s = metres up it from the vent (the hill's middle stands over
    // the bowl's upper rim on its line), l = metres across it, east of its line. It comes down from the south (10 to 40 degrees east of south), so that its lower
    // part, the gorge, runs 10 to 40 degrees west of north down to its mouth, 110 to 220 m below the vent (dealt, stream 'gorge': as long
    // again at the most as at the least).
    const chs = RN.chasm, slant = chs.range(10, 40) * Math.PI / 180, CH = { dx: Math.sin(slant), dz: Math.cos(slant) };
    // the flight begins in the upper chasm and comes down it: the corner of its two lines stands UPPER above the vent on the chasm's
    // line (1.5 to 1.8 times the pass's radius, stream 'approach'). It passes the vent once, on the side away from the valley, at ROUND from it: 3.0 to 3.3 times
    // SPRAY (stream 'round': 75 to 82.5 m). SPRAY (25 m) is the bowl's measure, not the spray's edge. What the fountain throws ends inside the
    // pass by its own rules (parts file): a rock comes down within 18 m of the vent; a body of water within 30 m in still air, and
    // the wind (0.49 m/s there) carries a falling streak 9 m more at the most (they leave within 6 m of the vent's middle); the mist that lies over the pool is laid 8 to 40 m from
    // the vent in clouds of 22 m radius at the most and drifts 3.4 m: 65 m. The bowl's rim stands SPRAY outside the pass. The column's
    // height is given at FOUNT_H. Then the way goes down the gorge: its line meets the river's line MEET_IN (12 m) inside the gorge's mouth.
    const GORGE = RN.gorge.range(110, 220), MEET_IN = 12, SPRAY = 25, ROUND = SPRAY * RN.round.range(3.0, 3.3), BOWL = ROUND + SPRAY, UPPER = ROUND * RN.approach.range(1.5, 1.8);
    // two straight lines and one arc: from the start a line that touches the pass's circle at the angle A_UP from the chasm's line above the
    // vent; the arc; from the angle A_DN short of the gorge's line a line to APEX below the vent on the river's line. Beside each line the
    // chasm's wall stands a spray's reach outside it: the line lies UP_TAN (LINE_TAN) to the side for each metre toward the vent, as far as
    // UP_TOUCH (TOUCH) from it
    const APEX = GORGE - MEET_IN, A_UP = Math.acos(ROUND / UPPER), A_DN = Math.acos(ROUND / APEX);
    // The first ENTRY metres (70 to 84, stream 'cleft') lie on the chasm's own line, which runs to the vent: the column stands on the line flown, and a visit that comes in
    // through a portal (its camera set level along the route's first heading) finds its first gaze on that line whichever camera it has
    // (the sweeping one looks down a 30 m chord, the steady one down a chord of 102 m: 70 m of straight leave that chord 4 degrees off;
    // that is why the straight is never under 70 m).
    // The upper chasm's floor rises 1 in 12 (4.8 degrees) and the way comes down over it a little flatter (its knots fall 1 in 12 less the
    // rise it keeps over the floor: some 3.5 degrees over the entry). Then the way swerves from the chasm's
    // line onto the line that touches the pass, on one arc of the pass's own radius (SWERVE: the angle between the two lines; the arc
    // begins SW_T before the two lines' corner and ends SW_T after it). The upper chasm keeps its breadth 40 m above the start (HEAD_S)
    // and closes to a cleft over the next 60 m.
    const SWERVE = Math.PI / 2 - A_UP, SW_T = ROUND * Math.tan(SWERVE / 2), ENTRY = RN.cleft.range(70, 84), START_S = UPPER + SW_T + ENTRY, HEAD_S = START_S + 40, UP_RISE = 1 / 12;
    const LINE_TAN = ROUND / Math.sqrt(APEX * APEX - ROUND * ROUND), TOUCH = ROUND * ROUND / APEX, UP_TAN = ROUND / Math.sqrt(UPPER * UPPER - ROUND * ROUND), UP_TOUCH = ROUND * ROUND / UPPER;
    const chXZ = (s, l) => [FV.x + CH.dx * s + CH.dz * l, FV.z + CH.dz * s - CH.dx * l];
    const onPass = (phi) => [ROUND * Math.cos(phi), ROUND * Math.sin(phi)], P_IN = onPass(A_UP), P_OUT = onPass(Math.PI - A_DN), P_MID = onPass((A_UP + Math.PI - A_DN) / 2);
    // The loops: two to four of them, 125 to 175 m each on the average (300 to 560 m of valley in all), of unlike length (shares of 0.8 to 1.2),
    // each as far to its side as 0.3 to 0.4 of its length (the river's own heading swings some 40 degrees each way), on alternate sides.
    const side0 = cr.sign(), nLoops = cr.int(2, 4), loops = [];
    {
      const total = clamp(nLoops * cr.range(125, 175), 300, 560), sh = []; let sum = 0;
      for (let i = 0; i < nLoops; i++) { sh.push(cr.range(0.8, 1.2)); sum += sh[i]; }
      for (let i = 0; i < nLoops; i++) { const len = total * sh[i] / sum; loops.push({ len, half: len * cr.range(0.3, 0.4), side: i % 2 ? -side0 : side0 }); }
    }
    // after the last loop the river takes 45 to 70 m to come onto the last reach's line (the straightening), the water gate stands 55 to 80 m on
    // (so much straight river and way before the gate), and the gardens' last reach from the gate to the cliff is 230 to 280 m
    const straightRun = cr.range(45, 70), gateRun = cr.range(55, 80), lastReach = cr.range(230, 280);
    // out of the gorge's mouth the river turns west on an arc of 85 m (a turn of 50 to 80 degrees): where it has turned is the first node
    const TURN0 = 85, turn0 = (f) => { const a = f * (Math.PI / 2 - slant); return chXZ(-GORGE - TURN0 * Math.sin(a), -TURN0 * (1 - Math.cos(a))); };
    const [X0, Z0] = turn0(1);
    const X_END = X0 - loops.reduce((a, l) => a + l.len, 0), X_STRAIGHT = X_END - straightRun, GATE_X = X_STRAIGHT - gateRun, XC = GATE_X - lastReach;
    const zBase = (x) => lerp(Z0, ZR, clamp((X0 - x) / (X0 - X_STRAIGHT), 0, 1));
    const course = [[FV.x, FV.z], chXZ(-GORGE * 0.3, 0), chXZ(-GORGE * 0.65, 0), chXZ(-GORGE, 0), turn0(0.35), turn0(0.7), [X0, Z0]];
    const crestK = [], nodes = [[X0, Z0]], loopK0 = course.length;
    {
      let xs = X0;
      for (const l of loops) {
        for (const [f, k] of [[0.25, 0.74], [0.5, 1], [0.75, 0.74]]) { const x = xs - l.len * f; course.push([x, zBase(x) + l.side * l.half * k]); if (f === 0.5) crestK.push(course.length - 1); }
        xs -= l.len; nodes.push([xs, zBase(xs)]);
      }
    }
    const loopK1 = course.length;                                              // the knots of the loops
    course.push([X_STRAIGHT, ZR], [GATE_X, ZR]);
    for (let x = GATE_X - 70; x > XC + 40; x -= 70) course.push([x, ZR]);
    course.push([XC + 4, ZR]);
    const riverCurve = new THREE.CatmullRomCurve3(course.map((p) => new THREE.Vector3(p[0], WY, p[1])), false, 'centripetal');
    const RS = 480, rsx = new Float32Array(RS + 1), rsz = new Float32Array(RS + 1);
    { const p = new THREE.Vector3(); for (let i = 0; i <= RS; i++) { riverCurve.getPointAt(i / RS, p); rsx[i] = p.x; rsz[i] = p.z; } }
    const RLEN = riverCurve.getLength();
    await ctx.yield();

    // ---------- the caverns' line and levels (drawn), and the flight ----------
    // A throat of 36 to 46 m, three halls of 72 to 108 m each ending in a fall of 20 to 26 m (each hall's length and drop from the hall's own
    // stream), a last run of 80 to 120 m to the arch; the axis makes one S bend of 15 to 23 degrees. s = metres into the caverns along the
    // axis; lat = metres to the right of it (north where it heads west).
    const cs = RN['cave-axis'];
    const THROAT = RN.throat.range(36, 46), LASTRUN = RN['last-run'].range(80, 120), FALLS = [];
    { let acc = THROAT; for (let k = 0; k < 3; k++) { const hr = RN['hall' + k]; acc += hr.range(72, 108); FALLS.push({ s: acc, drop: hr.range(20, 26) }); } }
    const SL = FALLS[2].s + LASTRUN, bendA = cs.sign() * cs.range(15, 23) * Math.PI / 180;
    const phi = (s) => bendA * Math.sin(TAU * clamp((s - THROAT) / (SL - THROAT - LASTRUN), 0, 1));
    const AXD = 1.6, AXN = Math.ceil((SL + 80) / AXD), axX = new Float32Array(AXN + 1), axZ = new Float32Array(AXN + 1);
    { let x = XC + 8, z = ZR; for (let i = 0; i <= AXN; i++) { axX[i] = x; axZ[i] = z; const f = phi(-8 + (i + 0.5) * AXD); x -= Math.cos(f) * AXD; z -= Math.sin(f) * AXD; } }
    const caveAt = (s, lat = 0) => {
      const f = clamp((s + 8) / AXD, 0, AXN - 1e-3), i = Math.floor(f), t = f - i, ph = phi(s), tx = -Math.cos(ph), tz = -Math.sin(ph);
      return { x: lerp(axX[i], axX[i + 1], t) - tz * lat, z: lerp(axZ[i], axZ[i + 1], t) + tx * lat, tx, tz };
    };
    // the river's level on its ledge (it steps down where each fall has poured, 10 m past the middle of its lip), and the level of the
    // floor on the route's side, which ramps down between 36 m and 2 m before the middle of each lip
    const upY = (s) => { let y = WY - 0.012 * Math.max(0, s); for (const f of FALLS) y -= f.drop * sst(f.s + 8, f.s + 12, s); return y; };
    const lowY = (s) => { let y = WY - 0.012 * Math.max(0, s); for (const f of FALLS) y -= f.drop * sst(f.s - 36, f.s - 2, s); return y; };
    // the last fall, into the sea, is the cataract: 52 m, twice the tallest fall of the halls
    const FALL = 52, SEA = upY(SL) - FALL, RING_R = 13, RING_H = 18.5;
    const ARCH_P = caveAt(SL), ARCH_X = ARCH_P.x, AZ = ARCH_P.z;
    // the edge of the ledge: 8 m left of the axis, and turned across it at each fall so that the lip faces the oncoming route (30 degrees)
    const ledgeEdge = (s) => { let e = -8; for (const f of FALLS) { const d = s - (f.s - 1); if (d > -29 && d <= 11.5) e = -8 + 0.577 * clamp(d, -11, 11) * sst(-29, -11, d); } return e; };
    // where the channel runs: in the middle of the mouth as far as its lining goes (22 m), then out to the ledge, into the basin at each lip; below each fall from its pool back out to the ledge; in the middle again for the arch
    const riverLat = (s) => {
      let lat = -24 * sst(22, 68, s);
      for (const f of FALLS) { lat = lerp(lat, -13, sst(f.s - 34, f.s - 8, s)); lat = lerp(lat, -1, sst(f.s - 6, f.s - 4, s)); lat = lerp(lat, -24, sst(f.s + 6, f.s + 52, s)); }
      return lat * (1 - sst(SL - 50, SL - 12, s));
    };
    // on the axis in the mouth, 15 m right of it down the halls; it leaves the axis over 100 m. It keeps its 15 m past all
    // three lips (a lip's roll of ice reaches 17 m past the lip's middle and 3.5 m right of the axis, its icicles 5.6 m: the way goes by 9 m
    // and more from them) and comes over only from 24 m past the third lip, over the rest of the last run and 55 m of open sea (111 to
    // 151 m: a lean of 8 to 12 degrees); in the arch it is 4.5 to 7.5 m right of the axis, 11 m and more inside the arch's rim (18.5 m)
    const routeLat = (s) => 15 * sst(8, 108, s) * (1 - sst(FALLS[2].s + 24, SL + 55, s));
    // the route keeps the ledge's height until 40 m before each fall and is down 50 m past it: each fall is ahead and below (at one
    // slope, 13 to 16 degrees; it sank from 25 m before to 35 m past on a smooth step, 30 degrees down at the steepest)
    const routeY = (s) => { let y = WY - 0.012 * Math.max(0, s); for (const f of FALLS) y -= f.drop * clamp((s - f.s + 40) / 90, 0, 1); return y + lerp(8.7, 10, sst(0, THROAT, s)); };
    // THE SEA'S WAY IS STRAIGHT OUT, in a frame of its own: X = metres out from the line of the cataract's foot, w = metres aside toward the
    // visit's hand (stream 'sea'). The river's current runs straight out from the arch, and the way goes out over the cataract and down
    // the current to the ring, which stands free over the water where the current is spent: LEG out from the foot's line (8.5 to 11 fall
    // heights, 442 to 572 m, stream 'sea-leg'). So the ring stands before the eye from the arch on (and, small, through the arch from
    // the last run of the caverns). The way sinks at one slope and is level for its last LEVEL metres (150 to 190, stream 'sea-level').
    // The cataract has a POOL: the churned water within POOL_R of the middle of its foot (2.6 to 3.9 fall heights, stream 'pool').
    const HAND = RN.sea.sign(), WING = RN.wing.sign(), POOL_R = FALL * RN.pool.range(2.6, 3.9), LEG = FALL * RN['sea-leg'].range(8.5, 11), LEVEL = RN['sea-level'].range(150, 190);
    // the middle of the cataract's foot stands 20 m out from the cliff's line
    const FOOT = [ARCH_X - 26, AZ], seaXZ = (X, w) => [FOOT[0] - X, AZ + HAND * w], seaXw = (x, z) => [FOOT[0] - x, HAND * (z - AZ)];
    const RING = seaXZ(LEG, 0);
    // the pool, for whatever stands in the sea: true within `more` metres of it
    const inPool = (x, z, more = 0) => Math.hypot(FOOT[0] - x, z - AZ) < POOL_R + more;
    // the route's knots: down the upper chasm to the pass, round the vent's far side from the valley, down the gorge to 5 m inside its mouth; out
    // of it on one curve to the first loop's quarter; down the loops at 0.15 of their swing and 16 m over the water; on the gate's axis; down
    // the last reach; on the mouth's axis; down the caverns beside the river; out on the sea
    // the way swings 0.15 of the river's own swing over the loops: it keeps the valley's line and the river
    // winds under it (a way that swung 0.8 with the river turned a traveller about at up to 56 degrees a second there)
    const pts = [], SWING = 0.15;
    let EXIT_X = 0;
    const EXIT_R = 95;
    const valleyKnot = (k) => [course[k][0], zBase(course[k][0]) + SWING * (course[k][1] - zBase(course[k][0]))];
    {
      // (metres up the chasm from the vent, metres east of its line, metres over the water)
      const put = (s, l, y) => { const p = chXZ(s, l); pts.push([p[0], WY + y, p[1]]); }, D2 = Math.PI / 180;
      // the start stands 20 m over the upper chasm's floor (which rises 1 in 12 above the bowl); the way comes down to 20 m over
      // the water where it meets the pass, to 14 m where it leaves it, and keeps 14 m down the gorge
      const H0 = 20 + UP_RISE * (START_S - BOWL);
      const hIn = (s) => lerp(20, H0, (s - P_IN[0]) / (START_S - P_IN[0]));
      put(START_S, 0, H0);
      for (const f of [0, 0.5, 1]) { const s = UPPER + SW_T - ROUND * Math.sin(SWERVE * f); put(s, ROUND * (1 - Math.cos(SWERVE * f)), hIn(s)); }
      { const s0 = UPPER - SW_T * Math.cos(SWERVE), l0 = SW_T * Math.sin(SWERVE); for (const f of [1 / 3, 2 / 3]) { const s = lerp(s0, P_IN[0], f); put(s, lerp(l0, P_IN[1], f), hIn(s)); } }
      // (an even number of steps, so that one knot is the middle of the pass)
      { const sw = Math.PI - A_DN - A_UP, n = 2 * Math.max(1, Math.round(sw / (50 * D2))); for (let i = 0; i <= n; i++) { const [rs, rl] = onPass(A_UP + sw * i / n); put(rs, rl, lerp(20, 14, i / n)); } }
      for (const f of [1 / 3, 2 / 3]) put(lerp(P_OUT[0], -APEX, f), P_OUT[1] * (1 - f), 14);
      const T_OUT = P_OUT, GL = T_OUT[1] * (-GORGE + 5 + APEX) / (T_OUT[0] + APEX);
      put(-GORGE + 5, GL, 14);
      // the turn out of the gorge is a round arc of EXIT_R (95 m; the river's own arc there is 85 m): from 5 m inside the gorge's
      // mouth, tangent to the line down from the pass, until it heads down the valley's line (from the first node to the straightening).
      // (A parabola there bends hardest at its corner, some 55 m of radius.)
      const G0 = chXZ(-GORGE + 5, GL), B0 = chXZ(T_OUT[0], T_OUT[1]), dl = Math.hypot(G0[0] - B0[0], G0[1] - B0[1]), dx = (G0[0] - B0[0]) / dl, dz = (G0[1] - B0[1]) / dl;
      const vl = Math.hypot(X_STRAIGHT - X0, ZR - Z0), vx = (X_STRAIGHT - X0) / vl, vz = (ZR - Z0) / vl;
      const sd = Math.sign(dx * vz - dz * vx) || 1, cx = G0[0] - sd * EXIT_R * dz, cz = G0[1] + sd * EXIT_R * dx;
      const a0 = Math.atan2(G0[1] - cz, G0[0] - cx), sw = Math.acos(clamp(dx * vx + dz * vz, -1, 1)), n = Math.max(1, Math.round(sw / (30 * D2)));
      for (let i = 1; i <= n; i++) { const a = a0 + sd * sw * i / n; pts.push([cx + EXIT_R * Math.cos(a), lerp(WY + 14, 16, i / n), cz + EXIT_R * Math.sin(a)]); }
      EXIT_X = cx + EXIT_R * Math.cos(a0 + sd * sw);
    }
    // the loops' knots, from two of the arc's radii (190 m) down the valley past the arc's end on: the arc ends some metres beside the valley's
    // line, and a knot nearer than that makes the way swerve to it and back within 90 m (a gaze turned 25 to 50 degrees)
    for (let k = loopK0; k < loopK1; k++) if (course[k][0] < EXIT_X - 2 * EXIT_R) { const kn = valleyKnot(k); pts.push([kn[0], 16, kn[1]]); }
    // (the knots of the gate and the last reach stand at places and at shares of the drawn lengths: the straightening, the gate, the reach's quarters
    // after it, the last of them at 11 m; they stood at typed 55, 120, 65, 100 and 60 m)
    // (no knot between the straightening and the gate: both stand on the last reach's line, so the way goes through the gate along its axis)
    pts.push([X_STRAIGHT, 15, ZR], [GATE_X, 14, ZR]);
    for (let k = 1; k <= 3; k++) pts.push([GATE_X - lastReach * k / 4, k < 3 ? 14 : 11, ZR]);
    pts.push([XC, routeY(0), ZR]);
    // (knots every 18 m or so from 18 m inside the mouth to 36 m outside the arch; outside the arch the way sinks toward its 52 m over the sea)
    { const n = Math.round((SL + 18) / 18); for (let i = 0; i <= n; i++) { const s = 18 + i * (SL + 18) / n, c = caveAt(s, routeLat(s)); pts.push([c.x, s <= SL ? routeY(s) : lerp(routeY(SL), SEA + 52, (s - SL) / 60), c.z]); } }
    // heights over the sea: 9.5 m over the river in the arch (61.5 m over the sea), 52 m at 34 m out, sinking at one slope (5 to 10
    // degrees) to RING_H (18.5 m, the ring's middle: the ring's rim is 13 m in radius and stands free, 5.5 m clear of the swell) where
    // the level run begins, LEVEL before the ring, and level from there to the ring. Knots every 50 m or so, all on the leg's one line.
    {
      const put = (X, y) => { const p = seaXZ(X, 0); pts.push([p[0], SEA + y, p[1]]); }, X_LEVEL = LEG - LEVEL, nS = Math.max(3, Math.round((X_LEVEL - 34) / 50)), nL = Math.max(3, Math.round(LEVEL / 50));
      for (let k = 0; k <= nS; k++) put(lerp(34, X_LEVEL, k / nS), lerp(52, RING_H, k / nS));
      for (let k = 1; k <= nL; k++) put(lerp(X_LEVEL, LEG, k / nL), RING_H);
    }
    const path = makePath(pts);
    await ctx.yield();
    const PORTAL = path.end.clone();
    // the route every two metres (clearance is measured against these), and the places along it that the flight is told by
    const PL = path.length, NL = Math.ceil(PL / 2), LS = PL / NL, lnx = new Float32Array(NL + 1), lny = new Float32Array(NL + 1), lnz = new Float32Array(NL + 1);
    { const p = new THREE.Vector3(); for (let i = 0; i <= NL; i++) { path.posAtDist(i * LS, p); lnx[i] = p.x; lny[i] = p.y; lnz[i] = p.z; } }
    await ctx.yield();
    // metres flown where the route is nearest a place (seen from above); searched from m0 on (a place may be asked for past another)
    const mAt = (x, z, m0 = 0, m1 = PL) => { let best = 1e18, bi = 0; for (let i = Math.floor(m0 / LS); i <= Math.min(NL, Math.ceil(m1 / LS)); i++) { const dx = lnx[i] - x, dz = lnz[i] - z, d = dx * dx + dz * dz; if (d < best) { best = d; bi = i; } } return bi * LS; };
    // the garden's terraces rise between 46 and 100 m from the cliff; its orchard rows end three tenths of the way up that rise (62 m)
    const GARDEN = [46, 100], ROWS_OFF = lerp(GARDEN[0], GARDEN[1], 0.3);
    const M = { passIn: mAt(...chXZ(P_IN[0], P_IN[1])), fount: mAt(...chXZ(P_MID[0], P_MID[1])), passOut: mAt(...chXZ(P_OUT[0], P_OUT[1])), node0: mAt(X0, Z0), crest: crestK.map((k) => mAt(course[k][0], course[k][1])), straight: mAt(X_STRAIGHT, ZR), gate: mAt(GATE_X, ZR), poolHead: mAt(XC + POOL_LEN, ZR), rows: mAt(XC + ROWS_OFF, ZR), mouth: mAt(XC, ZR) };
    M.cave = (s) => { const c = caveAt(s, routeLat(s)); return mAt(c.x, c.z, M.mouth, M.mouth + SL + 60); };
    M.arch = M.cave(SL); M.lip = FALLS.map((f) => M.cave(f.s - 1));
    // places of the sea: where the way has come onto the leg's line (34 m out from the foot's line) and where its level run begins
    { const at = (X, m0) => { const p = seaXZ(X, 0); return mAt(p[0], p[1], m0); };
      M.seaLine = at(34, M.arch); M.lastStraight = at(LEG - LEVEL, M.seaLine + 40); }
    await ctx.yield();
    const U_MOUTH = M.mouth / PL, U_GATE = M.gate / PL, U_ROWS = M.rows / PL;
    // level distance from a point to the route (the gardens' part of it: the caverns and the sea lie under other ground), with the route's height there
    const NLG = Math.ceil((M.mouth + 30) / LS);
    const laneXZ = (x, z, n = NLG) => { let best = 1e18, bi = 0; for (let i = 0; i <= n; i++) { const dx = lnx[i] - x, dz = lnz[i] - z, d = dx * dx + dz * dz; if (d < best) { best = d; bi = i; } } return { dist: Math.sqrt(best), x: lnx[bi], y: lny[bi], z: lnz[bi] }; };
    // distance in space from a point to the route (its samples every 2 m joined by straight pieces), looking from sample i0 on
    const lane3 = (x, y, z, i0 = 0, i1 = NL) => {
      let best = 1e18;
      for (let i = Math.max(0, i0); i < Math.min(NL, i1); i++) {
        const ax = lnx[i], ay = lny[i], az = lnz[i], bx = lnx[i + 1] - ax, by = lny[i + 1] - ay, bz = lnz[i + 1] - az;
        const t = clamp(((x - ax) * bx + (y - ay) * by + (z - az) * bz) / (bx * bx + by * by + bz * bz + 1e-9), 0, 1), dx = ax + bx * t - x, dy = ay + by * t - y, dz = az + bz * t - z, d = dx * dx + dy * dy + dz * dz;
        if (d < best) best = d;
      }
      return Math.sqrt(best);
    };
    // metres from the start (looking from m0 on) at which a place has fallen more than `deg` off the heading (seen from above), or has come within
    // `deg` of it (inside = true); and at which it stands more than `deg` overhead
    const offBearing = (at, deg, m0 = 0, inside = false) => { const c = Math.cos(deg * Math.PI / 180); for (let i = Math.max(1, Math.ceil(m0 / LS)); i < NL; i++) { const tx = lnx[i + 1] - lnx[i - 1], tz = lnz[i + 1] - lnz[i - 1], dx = at.x - lnx[i], dz = at.z - lnz[i], k = (tx * dx + tz * dz) / Math.max(1e-6, Math.hypot(tx, tz) * Math.hypot(dx, dz)); if (inside ? k > c : k < c) return i * LS; } return PL; };
    const overhead = (at, deg, m0 = 0) => { const t = Math.tan(deg * Math.PI / 180); for (let i = Math.ceil(m0 / LS); i <= NL; i++) if (at.y - lny[i] > t * Math.hypot(at.x - lnx[i], at.z - lnz[i])) return i * LS; return PL; };
    await ctx.yield();

    // ---------- distance to the river, baked on a grid (the land, the banks and everything that grows read it) ----------
    const DF = { x0: XC - 72, z0: -660, c: 8, nx: Math.ceil((440 - (XC - 72)) / 8), nz: 122 };
    const dfD = new Float32Array((DF.nx + 1) * (DF.nz + 1)), dfI = new Int16Array((DF.nx + 1) * (DF.nz + 1));
    // (build time) the whole course is searched only on a grid four times as coarse; a cell then looks 12 samples to each side of the nearest
    // sample of each of the four coarse corners about it and of the cell before it in its row
    // (build time) each of the two loops is a function of its own: build() as a whole is too long for the engine's compiler to make fast, so a
    // loop written straight into it runs many times slower than the same loop in a short function (true of every such function below)
    const CN = 4, cnx = Math.ceil(DF.nx / CN), cnz = Math.ceil(DF.nz / CN), cI = new Int16Array((cnx + 1) * (cnz + 1)), cand = new Int16Array(5);
    const bakeCoarse = () => {
      for (let j = 0; j <= cnz; j++) for (let i = 0; i <= cnx; i++) {
        const x = DF.x0 + i * CN * DF.c, z = DF.z0 + j * CN * DF.c; let best = 1e12, bk = 0;
        for (let k = 0; k <= RS; k += 2) { const dx = rsx[k] - x, dz = rsz[k] - z, d = dx * dx + dz * dz; if (d < best) { best = d; bk = k; } }
        cI[j * (cnx + 1) + i] = bk;
      }
    };
    bakeCoarse();
    await ctx.yield();
    const bakeRow = (j) => {
      const z = DF.z0 + j * DF.c, cj = Math.min(cnz - 1, Math.floor(j / CN)); let prev = -1;
      for (let i = 0; i <= DF.nx; i++) {
        const x = DF.x0 + i * DF.c, q = cj * (cnx + 1) + Math.min(cnx - 1, Math.floor(i / CN)); let best = 1e12, bk = 0;
        cand[0] = cI[q]; cand[1] = cI[q + 1]; cand[2] = cI[q + cnx + 1]; cand[3] = cI[q + cnx + 2]; cand[4] = prev;
        for (let n = 0; n < 5; n++) {
          const c = cand[n]; if (c < 0 || (n > 0 && c === cand[n - 1])) continue;
          for (let k = c < 12 ? 0 : c - 12, k1 = c + 12 > RS ? RS : c + 12; k <= k1; k += 2) { const dx = rsx[k] - x, dz = rsz[k] - z, d = dx * dx + dz * dz; if (d < best) { best = d; bk = k; } }
        }
        dfD[j * (DF.nx + 1) + i] = Math.sqrt(best); dfI[j * (DF.nx + 1) + i] = bk; prev = bk;
      }
    };
    for (let j = 0; j <= DF.nz; j++) { bakeRow(j); if (j % 24 === 23) await ctx.yield(); }
    const riverCoarse = (x, z) => {
      const fx_ = clamp((x - DF.x0) / DF.c, 0, DF.nx - 1e-3), fz = clamp((z - DF.z0) / DF.c, 0, DF.nz - 1e-3), i = Math.floor(fx_), j = Math.floor(fz), u = fx_ - i, v = fz - j, k = j * (DF.nx + 1) + i;
      return lerp(lerp(dfD[k], dfD[k + 1], u), lerp(dfD[k + DF.nx + 1], dfD[k + DF.nx + 2], u), v);
    };
    // exact near the banks: the coarse grid says roughly where, the curve's own samples say exactly
    const riverD = (x, z, dc = riverCoarse(x, z)) => {                // (dc: the coarse distance of the same place, where the caller has it)
      if (dc > 40) return dc;
      const fx_ = clamp((x - DF.x0) / DF.c, 0, DF.nx - 1e-3), fz = clamp((z - DF.z0) / DF.c, 0, DF.nz - 1e-3), q = Math.floor(fz) * (DF.nx + 1) + Math.floor(fx_);
      const c0 = dfI[q], c1 = dfI[q + 1], c2 = dfI[q + DF.nx + 1], c3 = dfI[q + DF.nx + 2];
      const lo = Math.min(c0, c1, c2, c3) - 8, hi = Math.max(c0, c1, c2, c3) + 8;
      // where two reaches of a loop are both near (the corners' samples lie far apart on the course) the search is 8 samples about each
      // corner's own (the whole course was searched there: 480 segments for a point that needs 68 at most)
      const wide = hi - lo > 110;
      let best = 1e12;
      for (let w = 0; w < (wide ? 4 : 1); w++) {
        const k0 = wide ? (w === 0 ? c0 : w === 1 ? c1 : w === 2 ? c2 : c3) - 8 : lo, k1 = wide ? k0 + 16 : hi;
        for (let k = Math.max(0, k0); k <= Math.min(RS - 1, k1); k++) {
          const ax = rsx[k], az = rsz[k], bx = rsx[k + 1] - ax, bz = rsz[k + 1] - az, t = clamp(((x - ax) * bx + (z - az) * bz) / (bx * bx + bz * bz + 1e-9), 0, 1), dx = ax + bx * t - x, dz = az + bz * t - z, d = dx * dx + dz * dz;
          if (d < best) best = d;
        }
      }
      return Math.sqrt(best);
    };
    const hwAt = (x, z) => {
      const base = 10.5 + 2.4 * N.n2(x * 0.012 + 3, z * 0.012), lz = x - XC;
      return lz < 330 ? lerp(Math.max(base, poolHalf(lz)), base, sst(Math.min(268, lastReach - 40), Math.min(328, lastReach - 5), lz)) : base;
    };

    // ---------- the shape of the land ----------
    const S = wallShape(N, { seed: RN.wall.range(0, 40) });
    jit = jitOf(RN.hill);
    // the hill's middle stands over the bowl's upper rim (BOWL up the chasm's line): the bowl is cut into the hill's north face, and the
    // upper chasm through its top (it stood 155 m up the line, and the bowl's walls were its low skirts)
    const HILL = { x: FV.x + CH.dx * BOWL, z: FV.z + CH.dz * BOWL, r: 175, h: 105 + jit(12) };
    // THE COLUMN OF THE FOUNTAIN: FOUNT_H, four fifths of its hill's height (74 to 94 m), is the height the water reaches at a pant of
    // strength 1. A pant's strength at its peak is the visit's loudness (0.85 to 1.15; 1.2 times that on the rare visit) times 0.72 to
    // 1.05, so from pant to pant the column's top stands 0.37 to 1.46 of FOUNT_H (to 2.1 on the rare visit): under the hill's top at
    // most pants, over it at the strongest. From the pass (75 to 82.5 m off) its top is far over the lens's upper edge: it is seen
    // whole from the upper chasm, where the flight begins.
    const FOUNT_H = 0.8 * HILL.h;
    // the vent's pool: the water the fountain falls back into, twice the spray's reach and 6 m across from the vent; the river leaves it down
    // the gorge in a channel 14 m to each side of its line
    const VPOOL = 2 * SPRAY + 6, UP_HALF = RN['chasm-breadth'].range(36, 44);
    // the chasm: the gorge is 22 m to each side of the river's line (34 m at its mouth); the bowl and the upper chasm are given below. Walls 3 in 1.
    const cleftSL = (x, z) => [(x - FV.x) * CH.dx + (z - FV.z) * CH.dz, (x - FV.x) * CH.dz - (z - FV.z) * CH.dx];
    // below the place where the way's line meets the river's (APEX below the vent) the way leaves the gorge's line toward the valley,
    // and the gorge's wall on that side stands a spray's reach outside the way there too, as the east wall does above: wayOff holds the
    // way's own metres off the gorge's line (east positive) at each second metre down it, from 20 m above the meeting place to 60 m below
    // the gorge's mouth. (A short gorge, which the line down from the pass crosses at up to 57 degrees, so opens toward the valley; a long
    // one, crossed at 20, keeps its 34 m.)
    const OFF_S1 = -APEX + 20, OFF_N = Math.ceil((OFF_S1 + GORGE + 60) / 2), wayOff = new Float32Array(OFF_N + 1).fill(NaN);
    { const p = new THREE.Vector3();
      for (let m = M.passOut; m <= Math.min(PL, M.node0 + 120); m += 0.5) { path.posAtDist(m, p); const [ws, wl] = cleftSL(p.x, p.z), k = Math.round((OFF_S1 - ws) / 2); if (k >= 0 && k <= OFF_N && !(Math.abs(wayOff[k]) > Math.abs(wl))) wayOff[k] = wl; }
      // (a place the way does not pass takes the nearest place's above it)
      for (let k = 0, last = 0; k <= OFF_N; k++) { if (wayOff[k] === wayOff[k]) last = wayOff[k]; else wayOff[k] = last; } }
    const wayOut = (s, l) => { if (s >= OFF_S1) return 0; const w = wayOff[Math.min(OFF_N, Math.round((OFF_S1 - s) / 2))]; return SPRAY + Math.max(0, l < 0 ? -w : w); };
    const cleftHalf = (s, l = 1) => {
      // above the vent the upper chasm is UP_HALF (36 to 44 m, dealt) to each side of its line as far up as HEAD_S, and closes to 8 m over 60 m
      const base = s >= 0 ? lerp(UP_HALF, 8, sst(HEAD_S, HEAD_S + 60, s)) : lerp(22, 34, sst(-GORGE + 60, -GORGE, s)), BR = l < 0 ? 2 * SPRAY : BOWL, bowl = Math.abs(s) < BR ? Math.sqrt(BR * BR - s * s) : 0;
      // (the bowl: on the east, where the way passes, a spray's reach outside the pass; on the west, twice the spray's reach from the vent)
      // on the east side, where the way goes, the wall stands a spray's reach (25 m) outside the way's two lines: outside
      // the line down to the pass from the lines' corner (UPPER) to where it touches the pass, and outside the line down from the pass from
      // where it leaves it to the gorge's mouth. The west wall keeps the bowl's round, the upper chasm's breadth and the gorge's.
      const funnel = l < 0 ? 0 : s <= 0 ? (s > -APEX ? SPRAY + (APEX - Math.max(-s, TOUCH)) * LINE_TAN : 0) : s < UPPER ? SPRAY + (UPPER - Math.max(s, UP_TOUCH)) * UP_TAN : 0;
      return Math.max(base, bowl, funnel, wayOut(s, l)) + 3 * N.n2(s * 0.03, 2.2) + 2.5 * N.n2(s * 0.11, 7.7);
    };
    // The rock's floor: 1.3 m under the water in the vent's pool and in the river's channel below it, shelving up over 10 m to 0.9 m; east
    // of the pool a shelf of rock rises 5 m to the wall's foot; above the bowl the floor rises 1 in 12. Below the bowl's lower rim the
    // floor is the land's own (the level given here, 5.1 m, is 2.5 m over where the land is cut).
    const cleftFloor = (s, l) => {
      const r = Math.hypot(s, l), dry = Math.min(sst(VPOOL, VPOOL + 10, r), s < 0 ? sst(14, 20, Math.abs(l)) : 1);
      const rock = lerp(-1.3, 0.9 + 5 * sst(VPOOL + 10, BOWL, r) * sst(0, 30, l) + UP_RISE * Math.max(0, s - BOWL) + 2 * N.n2(s * 0.05, 8.8) * sst(BOWL, BOWL + 40, s), dry);
      return lerp(5.1, rock, sst(-BOWL - 14, -BOWL + 4, s));
    };
    const cleftY = (s, l, half = cleftHalf(s, l)) => { const o = Math.abs(l) - half; return cleftFloor(s, l) + Math.max(0, o) * (3 + 0.8 * N.n2(s * 0.04 + 5, l * 0.05)) + 4 * N.n2(s * 0.09, o * 0.25 + 3) * sst(0, 5, o) + 0.5 * N.n2(s * 0.2, l * 0.2) + 1.5 * N.n2(s * 0.08 + l * 0.05, l * 0.08) * sst(-2, 6, o); };
    const cleftK = (s) => sst(HEAD_S + 80, HEAD_S + 20, s) * sst(-GORGE - 50, -GORGE - 30, s);
    // the spur of the hill the gorge is cut through: 40 m high from the bowl to half way down the gorge, 14 m at the mouth, gone 45 m beyond it
    const spurTop = (s) => lerp(14, 40, sst(-GORGE, -GORGE * 0.5, s)) * sst(-GORGE - 45, -GORGE, s) * sst(230, 150, s);
    const gardenK = (x) => sst(GATE_X + 60, GATE_X + 7, x) * sst(XC + GARDEN[0], XC + GARDEN[1], x);
    function hill0(x, z, cs = (x - FV.x) * CH.dx + (z - FV.z) * CH.dz, cl = (x - FV.x) * CH.dz - (z - FV.z) * CH.dx) {
      const d = gD = riverCoarse(x, z), hd = Math.hypot(x - HILL.x, z - HILL.z);
      // (the broad swell n1 shapes only the valley's sides, from 30 m off the river, and the fountain's hill: on the river's flats it is not asked for)
      const n1 = d > 30 || hd < HILL.r * 2.4 ? N.fbm2(x * 0.0032 + 5, z * 0.0032 - 3, 3) : 0, n2 = N.n2(x * 0.011, z * 0.011 + 7);
      // the valley's sides rise between 30 and 150 m from the river (the ridges, with the walls on them, stand near above the loops)
      const rise = sst(30, 150, d) * (30 + 26 * n1) + (d > 150 ? sst(150, 430, d) * 44 * (0.6 + 0.5 * N.n2(x * 0.002 + 9, z * 0.002)) : 0);
      let h = 2.3 + 1.3 * n2 + 0.5 * N.n2(x * 0.04, z * 0.04) + rise;
      const gk = gardenK(x);
      if (gk > 0) {                                                  // terraces step up from the long pool
        let ht = 1.3; for (let k = 0; k < 4; k++) ht += 3.3 * sst(24 + k * 23, 26.2 + k * 23, d + 1.8 * Math.sin(x * 0.031 + k * 1.7) + 0.9 * Math.sin(x * 0.077 + k * 2.9));
        h = lerp(h, ht + 0.3 * n2 + sst(96, 240, d) * (30 + 30 * n1), gk);
      }
      // by the chasm the hill comes down to the cleft's own walls (elsewhere it stands back from the river)
      if (hd < HILL.r * 2.4) { const byChasm = sst(-GORGE - 40, -GORGE, cs) * sst(140, 90, Math.abs(cl)); h += HILL.h * Math.exp(-((hd / HILL.r) ** 2)) * (0.86 + 0.22 * n1) * sst(8, 60, Math.max(d, 60 * byChasm)); }
      h = Math.max(h, spurTop(cs) * sst(170, 60, Math.abs(cl)) * (0.9 + 0.15 * n2));
      return h;
    }
    // (build time: the place in the chasm's frame is worked once in ground0 and kept for ground1, which is only ever asked the same place
    // next; so is the river's coarse distance, worked in hill0)
    let gS = 0, gL = 0, gH = NaN, gD = 0;
    function ground0(x, z) {
      const s = (x - FV.x) * CH.dx + (z - FV.z) * CH.dz, l = (x - FV.x) * CH.dz - (z - FV.z) * CH.dx; gS = s; gL = l; gH = NaN;
      // under the head wall: nothing inside the rock (asked first: the hill is not worked for a place that has none), scree at its foot (below)
      const lz = x - XC, t = lz < 150 ? lz - S.faceZ(-(z - ZR), 6) : 0;
      if (lz < 150 && t < -1.5) return -9;
      let h = hill0(x, z, s, l);
      // The land is cut 2.5 m under the cleft's own rock, 9.5 m under it from 7 m up the walls. At the walls' feet it also stands
      // back: there the land takes the wall 2.4 m farther out than the rock does (nothing from 7 m up the slope), because the two skins are
      // drawn at different grain (the rock in rows 4 m apart, the land in 3 m squares) and a wall's foot that wanders 2 m between them
      // would let the land through the rock.
      if (s > -GORGE - 50 && s < HEAD_S + 80 && Math.abs(l) < 130) { const half = cleftHalf(s, l), o = Math.abs(l) - half; gH = half; h = lerp(h, Math.min(h, cleftY(s, l, half + 2.4 * sst(7, 1, o)) - 2.5 - 7 * sst(1, 7, o)), cleftK(s)); }
      if (lz < 150) h += 10 * sst(26, 0, t);
      return h;
    }
    // a riffle at each crossing between two bends: the river's point nearest each node after a loop (four at most)
    const RIFFLES = nodes.slice(1, 5).map(([nx, nz]) => { let bi = 0, best = 1e18; for (let i = 0; i <= RS; i++) { const d = (rsx[i] - nx) ** 2 + (rsz[i] - nz) ** 2; if (d < best) { best = d; bi = i; } } return [rsx[bi], rsz[bi]]; });
    // the bed shelves from the water's edge inward (e < 0): 0.9 m deep by 4.5 m in, 3 m by 8 m in; the bank stands 0.63 m over the
    // water 1.6 m outside the edge
    const bankY = (e) => WY + 0.63 * sst(-0.3, 1.6, e) - 0.9 * sst(0, -4.5, e) - 2.1 * sst(-4.5, -8, e);
    function ground1(x, z) {
      let h = ground0(x, z); if (h <= -9) return h;
      // (under the chasm's rock floor the land lies cut and takes no bank: the river's banks begin where the rock's floor ends, 5 m below the bowl)
      if (gS > -BOWL - 5 && gS < HEAD_S + 80 && Math.abs(gL) < 2 * BOWL && Math.abs(gL) < (gH === gH ? gH : cleftHalf(gS, gL)) + 2) return h;
      const d = gD;
      let e = d < 90 ? riverD(x, z, d) - hwAt(x, z) : 99;
      const dF = Math.hypot(x - FV.x, z - FV.z); if (dF < 60) e = Math.min(e, dF - 20);
      if (e < 14) h = lerp(bankY(e), h, sst(1.6, 9, e));
      // on a riffle the bed is no deeper than 0.35 m, within 9 m of the crossing, falling away by 15 m
      if (e < 0) for (const r of RIFFLES) { const dr = Math.hypot(x - r[0], z - r[1]); if (dr < 15) h = lerp(h, Math.max(h, WY - 0.35), sst(15, 9, dr)); }
      return h;
    }
    // rills: a small stream comes down the outer bank at each loop's crest, and two down the garden terraces (a third and two thirds down the last reach)
    const rills = [];
    const tOfXZ = (x, z) => { let bi = 0, best = 1e18; for (let i = 0; i <= RS; i++) { const dx = rsx[i] - x, dz = rsz[i] - z, d = dx * dx + dz * dz; if (d < best) { best = d; bi = i; } } return bi / RS; };
    {
      const rr = RN.rills, spots = loops.map((l, i) => [tOfXZ(course[crestK[i]][0], course[crestK[i]][1]), -l.side, 100]);
      spots.push([tOfXZ(GATE_X - lastReach / 3, ZR), 1, 92], [tOfXZ(GATE_X - lastReach * 2 / 3, ZR), -1, 92]);
      const p = new THREE.Vector3(), tg = new THREE.Vector3();
      for (const [t, side, len] of spots) {
        riverCurve.getPointAt(t, p); riverCurve.getTangentAt(t, tg);
        const nx = -tg.z * side, nz = tg.x * side, hw = hwAt(p.x, p.z), ptsR = []; let yPrev = 1e9;
        const bend = rr.range(-18, 18), n = 9;
        for (let k = 0; k <= n; k++) {
          const q = 1 - k / n, o = hw - 3 + q * len, al = bend * Math.sin(q * 2.6) + 6 * Math.sin(q * 9 + t * 40);
          const x = p.x + nx * o + tg.x * al, z = p.z + nz * o + tg.z * al;
          const y = Math.min(yPrev - 0.04, Math.max(WY - 0.02, ground1(x, z) - 0.42)); yPrev = y;
          ptsR.push([x, y, z]);
        }
        rills.push(ptsR);
      }
    }
    const rillBox = rills.map((r) => { const a = r[0], b = r[r.length - 1]; return [Math.min(a[0], b[0]) - 30, Math.max(a[0], b[0]) + 30, Math.min(a[2], b[2]) - 30, Math.max(a[2], b[2]) + 30]; });
    const rillD = (x, z) => {
      let best = 1e12;
      for (let q = 0; q < rills.length; q++) {
        const B = rillBox[q]; if (x < B[0] || x > B[1] || z < B[2] || z > B[3]) continue;
        const r = rills[q];
        for (let k = 0; k < r.length - 1; k++) {
          const ax = r[k][0], az = r[k][2], bx = r[k + 1][0] - ax, bz = r[k + 1][2] - az, t = clamp(((x - ax) * bx + (z - az) * bz) / (bx * bx + bz * bz + 1e-9), 0, 1), dx = ax + bx * t - x, dz = az + bz * t - z, d = dx * dx + dz * dz;
          if (d < best) best = d;
        }
      }
      return Math.sqrt(best);
    };
    const ground = (x, z) => { const h = ground1(x, z); if (h <= -9 || h < 0.4) return h; const d = rillD(x, z); return d < 4.2 ? h - 1.25 * sst(4.2, 1.3, d) : h; };
    await ctx.yield();

    // ---------- terrain ----------
    const cLawnA = C('#3f8a3c'), cLawnB = C('#69a548'), cWood = C('#2f5f33'), cShore = C('#cdc39c'), cBed = C('#17434a'), cPath = C('#b9ab8a'), cDry = C('#8f9a4e');
    const standAt = (x, z) => sst(-0.05, 0.3, N.n2(x * 0.0085 + 40, z * 0.0085 - 40) + 0.35 * N.n2(x * 0.03 - 9, z * 0.03));
    function groundColor(x, z, h, ny, out) {
      const n1 = N.n2(x * 0.007 + 11, z * 0.007 - 4) + 0.5 * N.n2(x * 0.022 + 3, z * 0.022 + 17);
      out.copy(cLawnA).lerp(cLawnB, sst(-0.7, 0.8, n1)).lerp(cDry, 0.25 * sst(0.2, 0.9, N.n2(x * 0.015 - 20, z * 0.015 + 6)));
      const d = riverCoarse(x, z);
      if (d > 24) out.lerp(cWood, 0.6 * standAt(x, z) * sst(24, 50, d));
      const gk = gardenK(x);
      if (gk > 0 && d < 100) { const band = Math.abs(((d - 24 + 230) % 23) - 1.1); out.lerp(cPath, 0.75 * gk * sst(2.2, 1.0, band) * sst(20, 23, d)); }
      out.multiplyScalar(1 + 0.12 * N.n2(x * 0.06 + 5, z * 0.06 + 70));
      const dw = h - WY;
      // grass comes down to 0.3 m over the water; the bed is pale to 0.6 m deep and dark by 2.2 m
      if (dw < 0.3) out.lerp(cShore, 0.85 * sst(0.3, 0.0, dw));
      if (dw < -0.6) out.lerp(cBed, sst(-0.6, -2.2, dw));
      return out;
    }
    const land = await T.makeTerrainAsync({
      rng: RN.land, noise: N, path, height: ground, bounds: [XC - 5, -650, 430, 300],
      corridor: { clearance: 6.5, width: 12, slope: 0.6 }, cell: 3, near: 42, levels: 5, refine: 1, maxTriangles: 54000,
      color: groundColor, waterLevel: WY, heightRange: [0, 170], sunDir: SUN, shadow: hour === 'golden' ? 0.45 : 0.62, shadowSoftness: 0.12, ao: 0.45, skirt: 30,
      biome: 'meadow', palette: { rock: '#525150', rockB: '#3f4041', rockSlope: [0.34, 0.56], strata: 0.3, patch: '#c9d08a', patchAmount: 0.2, clouds: hour === 'night' ? 0.15 : 0.45, tufts: 1, wet: 0.22, wetRange: 0.9 },
    }, ctx.yield, 24);
    scene.add(land.object); updaters.push(land);
    const hAt = land.heightAt;
    const outdoor = [land.object];
    await ctx.yield();
    // the benches of the chasm's walls (see the rock below): how strong the ledge of bench k is at s on the side sg, and how far over its
    // level it stands; and a place on that ledge, a share f of the way from its lip to the next cliff's foot
    const BENCH = 13, NB = 6;
    const ledgeK = (s, sg, k) => sst(0.34, 0.54, 0.5 + 0.5 * N.n2(s * 0.011 + k * 3.1, sg * 5 + k * 1.7));
    const ledgeUp = (s, sg, k) => 2.5 * (N.n2(s * 0.02 + 7, sg * 3 + k * 2.3) + 0.4);
    const ledgeAt = (s, sg, k, f) => {
      const half = cleftHalf(s, sg), l = sg * (half + (k + 0.2 + 0.8 * f) * BENCH / 3), [x, z] = chXZ(s, l), w = ledgeK(s, sg, k);
      return { x, z, w, y: cleftY(s, l, half) + w * (lerp(0.8 * BENCH, 0.6, f) + ledgeUp(s, sg, k)) };
    };
    // the chasm's own rock: dark and wet, so the white column stands against shade (the land's rock is pale and lies 2.5 m behind it)
    {
      // its columns follow the walls: on each side six across the floor, then fourteen up the wall and over its top (0 to 34 m outside the
      // wall's foot). THE WALLS STAND IN BENCHES: the wall's mean slope is 3 in 1, and every BENCH metres of height (13) it may break into a
      // cliff and a ledge: a riser that gains the whole bench in a fifth of its ground, then a ledge 3.5 m broad that climbs 0.6 m to the
      // next riser's foot. Where a ledge is, and how strong (0 = the plain slope, 1 = the full bench), comes from the place along the chasm,
      // the side and the bench (noise; each ledge runs some 80 m and pinches out); its height wanders 2.5 m. A bench never lies under the
      // plain slope by more than a metre and a half (the land lies 9.5 m under that slope: see ground0).
      const offs = [0], kind = [0], NF2 = 6, cols = [], P = [], I = [], LEDGE = [], ATFOOT = [];
      for (let k = 0; k < NB; k++) { offs.push((k + 0.2) * BENCH / 3, (k + 1) * BENCH / 3); kind.push(1, 2); }
      offs.push(34); kind.push(0);
      for (let j = offs.length - 1; j >= 0; j--) cols.push([-1, 1, offs[j], kind[j], (j - 1) >> 1]);
      for (let j = NF2 - 1; j >= 1; j--) cols.push([-1, j / NF2, 0, 0, 0]);
      cols.push([1, 0, 0, 0, 0]);
      for (let j = 1; j < NF2; j++) cols.push([1, j / NF2, 0, 0, 0]);
      for (let j = 0; j < offs.length; j++) cols.push([1, 1, offs[j], kind[j], (j - 1) >> 1]);
      const s0 = -GORGE - 28, NSX = Math.ceil((HEAD_S + 64 - s0) / 4), NLX = cols.length - 1;
      for (let i = 0; i <= NSX; i++) {
        if (i % 4 === 3) await ctx.yield();
        const s = s0 + i * 4, halfW = cleftHalf(s, -1), halfE = cleftHalf(s, 1);
        for (const [sg, k, o, kd, bk] of cols) {
          const half = sg < 0 ? halfW : halfE, l = sg * (half * k + o), [x, z] = chXZ(s, l), h = hill0(x, z) - 1.5;
          let cy = cleftY(s, l, half), led = 0;
          if (kd) { const w = ledgeK(s, sg, bk); cy += w * ((kd === 1 ? 0.8 * BENCH : 0.6) + ledgeUp(s, sg, bk)); if (kd === 1) led = w; }
          // outside the cleft its rock sinks away under the land; on the gorge's floor (the land's own) it lies under the river's bed
          let y = lerp(h - 8, cy < h ? cy : h - Math.min(12, (cy - h) * 0.5), cleftK(s));
          if (k < 1 && s < 0 && cleftFloor(s, l) > 3) y = -4;
          y = lerp(-6, y, sst(19, 23, Math.hypot(x - FV.x, z - FV.z))) - 14 * sst(-GORGE - 8, -GORGE - 28, s);
          P.push(x, y, z); LEDGE.push(cy < h ? led : 0); ATFOOT.push(k === 1 && o === 0 ? 1 : 0);
        }
      }
      for (let i = 0; i < NSX; i++) for (let j = 0; j < NLX; j++) { const a = i * (NLX + 1) + j, b = a + NLX + 1; I.push(a, a + 1, b + 1, a, b + 1, b); }
      await ctx.yield();
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setIndex(I);
      await ctx.yield();
      g.computeVertexNormals();
      await ctx.yield();
      // the metres along the wall at each vertex: summed along each line of the mesh that runs down the chasm (so the pattern keeps its size
      // round the bowl, where the wall turns across the chasm's line)
      { const arc = new Float32Array(P.length / 3), NC = NLX + 1;
        for (let j = 0; j < NC; j++) for (let i = 1; i <= NSX; i++) { const a = (i * NC + j) * 3, b = a - NC * 3; arc[i * NC + j] = arc[(i - 1) * NC + j] + Math.hypot(P[a] - P[b], P[a + 2] - P[b + 2]); }
        g.setAttribute('aArc', new THREE.Float32BufferAttribute(arc, 1)); g.setAttribute('aLedge', new THREE.Float32BufferAttribute(LEDGE, 1)); g.setAttribute('aFoot', new THREE.Float32BufferAttribute(ATFOOT, 1)); }
      await ctx.yield();
      const mat = new THREE.ShaderMaterial({
        fog: true, side: THREE.DoubleSide, uniforms: { ...THREE.UniformsLib.fog, ...look, uVent: { value: new THREE.Vector4(FV.x, WY, FV.z, SPRAY) } },
        vertexShader: /* glsl */`attribute float aArc, aLedge, aFoot; varying vec3 vW, vN; varying float vArc, vLedge, vFoot;
          #include <fog_pars_vertex>
          void main(){ vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; vArc = aArc; vLedge = aLedge; vFoot = aFoot; vN = normalize(mat3(modelMatrix) * normal); vec4 mvPosition = viewMatrix * w; gl_Position = projectionMatrix * mvPosition;
            #include <fog_vertex>
          }`,
        fragmentShader: /* glsl */`uniform vec3 uSunDir, uSunCol, uSkyCol, uGroundCol; uniform vec4 uVent; varying vec3 vW, vN; varying float vArc, vLedge, vFoot;
          #include <fog_pars_fragment>
          ${GLSL_N3}
          void main(){
            vec3 n = normalize(vN); if (n.y < 0.0) n = -n;
            vec3 v = normalize(cameraPosition - vW);
            // the benches' own faces: each cliff and each ledge keeps half of its own flat face's direction, so a ledge is lit as a ledge
            vec3 fn = normalize(cross(dFdx(vW), dFdy(vW))); if (dot(fn, v) < 0.0) fn = -fn;
            n = normalize(mix(n, fn, 0.5));
            float wall = smoothstep(0.86, 0.6, n.y);
            // BEDS: the rock lies in beds 1 to 4 m thick that dip and swell along the wall (3 m in 50); each has its own tone; one bed top
            // in two stands out as a ledge (lit from above, mossed), with the rock dark under it; the others are faint partings
            float warp = 6.0 * rsN(vec3(vArc * 0.019, vW.y * 0.02, 3.1)) + 1.2 * rsN(vec3(vArc * 0.09, vW.y * 0.15, 9.0));
            float yw = vW.y + warp, yb = yw / 2.6 + 1.1 * rsN(vec3(yw * 0.21, 4.4, 1.7)), bed = floor(yb), fb = fract(yb), tone = rsH1(bed * 3.17 + 1.3);
            float strong = step(0.5, rsH1(bed * 7.7 + 2.0)) * smoothstep(0.25, 0.55, rsN(vec3(vArc * 0.05, bed * 3.3, 6.0)));
            float part = smoothstep(0.38, 0.62, rsN(vec3(vArc * 0.07, bed * 1.7, 4.0)));
            float lip = smoothstep(0.2, 0.0, fb) * (0.08 + 0.92 * strong) * (0.35 + 0.65 * part), under = smoothstep(0.72, 1.0, fb) * step(0.5, rsH1((bed + 1.0) * 7.7 + 2.0)) * smoothstep(0.25, 0.55, rsN(vec3(vArc * 0.05, (bed + 1.0) * 3.3, 6.0)));
            // JOINTS: cracks that lean, 4 to 11 m apart, in the blocky beds only (two beds in five are massive), never in line from bed to bed
            float blocky = step(0.4, rsH1(bed * 9.1 + 5.0)), lean = (rsH1(bed * 4.3) - 0.5) * 0.3;
            float ja = (vArc + lean * yw) / (4.0 + 7.0 * rsH1(bed * 5.3 + 0.7)) + 13.0 * rsH1(bed * 2.9) + 0.6 * rsN(vec3(vArc * 0.13, vW.y * 0.4, 5.0));
            float jf = fract(ja), crack = blocky * smoothstep(0.02, 0.0, min(jf, 1.0 - jf)) * smoothstep(0.3, 0.6, rsN(vec3(floor(ja) * 3.7, bed * 1.9, 8.0)) + 0.3), block = rsH1(bed * 11.3 + floor(ja) * 7.1);
            // the floor: broken slabs, their cracks wandering (no two alike), a finer net inside them
            float fn1 = rsN(vec3(vW.xz * 0.09, 1.0)), fn2 = rsN(vec3(vW.xz * 0.23 + 5.0, 7.0));
            float fcrack = max(0.6 * smoothstep(0.016, 0.0, abs(fn1 - 0.5)), 0.4 * smoothstep(0.014, 0.0, abs(fn2 - 0.5))), slab = rsN(vec3(vW.xz * 0.045 + 9.0, 3.0));
            float fine = rsF(vec3(vArc * 0.6, vW.y * 1.4, vW.x * 0.3 + vW.z * 0.3)), big = rsF(vW * 0.045);
            vec3 dry = mix(vec3(0.17, 0.155, 0.14), vec3(0.3, 0.26, 0.21), mix(slab, 0.26 * tone + 0.3 * block + 0.44 * big, wall));
            dry = mix(dry, vec3(0.3, 0.2, 0.13), 0.5 * smoothstep(0.7, 1.0, tone) * wall) * (0.62 + 0.76 * fine) * (0.8 + 0.4 * rsN(vec3(vArc * 0.03, vW.y * 0.04, 12.0)));
            // WET: within the spray's reach of the vent, within a metre and a half of the water, and in dark streaks that run down the
            // walls from the ledges
            float dv = length(vW.xz - uVent.xz), streak = smoothstep(0.52, 0.78, rsN(vec3(vArc * 0.45, vW.y * 0.035, 2.3))) * wall;
            float wet = clamp(max(max(smoothstep(uVent.w * 2.2, uVent.w * 0.9, dv), smoothstep(1.6, 0.4, vW.y - uVent.y)), 0.85 * streak), 0.0, 1.0);
            // MOSS: on the ledges and the level tops, thickest where it is wet but not washed
            float moss = max(lip * wall * smoothstep(0.35, 0.6, big + 0.3 * wet), (1.0 - wall) * smoothstep(0.5, 0.75, big) * smoothstep(0.6, 2.5, vW.y - uVent.y)) * smoothstep(uVent.w * 0.7, uVent.w * 1.3, dv);
            vec3 alb = mix(dry, dry * vec3(0.4, 0.43, 0.48), wet);
            // CLEFTS: upright slots in the wall, one place in two every 23 m along it, a metre wide, wandering 2 m to either side as they climb
            float ca = vArc / 23.0 + 0.16 * rsN(vec3(vArc * 0.021, vW.y * 0.07, 31.0)), cf = abs(fract(ca) - 0.5);
            float cleft = wall * step(0.5, rsH1(floor(ca) * 5.3 + 1.0)) * smoothstep(0.03, 0.01, cf), cleftRim = wall * step(0.5, rsH1(floor(ca) * 5.3 + 1.0)) * smoothstep(0.075, 0.03, cf) * (1.0 - smoothstep(0.03, 0.01, cf));
            // SCREE at the walls' feet: broken pale stone on the floor within a few metres of the foot, each piece with its own tone
            float sc1 = rsN(vec3(vW.xz * 0.8, 21.0)), sc2 = rsN(vec3(vW.xz * 2.1 + 3.0, 5.0)), scree = (1.0 - wall) * smoothstep(0.3, 0.62, vFoot + 0.35 * (sc1 - 0.5)) * (1.0 - wet * 0.6);
            alb = mix(alb, mix(vec3(0.19, 0.18, 0.165), vec3(0.4, 0.37, 0.32), sc2) * (0.55 + 0.9 * sc1) * (1.0 - 0.45 * smoothstep(0.1, 0.02, abs(sc2 - 0.5))), scree);
            // HANGING GREEN: from a ledge's lip down the cliff under it, in drapes of unlike length; on the ledge itself moss, thickest at the lip
            float dryK = smoothstep(uVent.w * 0.7, uVent.w * 1.3, dv);
            float drape = wall * smoothstep(0.42, 0.78, vLedge - 0.3 * rsN(vec3(vArc * 0.33, 2.0, 7.0)) - 0.12 * rsN(vec3(vArc * 2.1, vW.y * 0.5, 3.0))) * dryK;
            moss = max(moss, max(0.9 * drape, (1.0 - wall) * smoothstep(0.15, 0.5, vLedge) * dryK));
            alb = mix(alb, mix(vec3(0.07, 0.13, 0.04), vec3(0.15, 0.22, 0.07), fine), clamp(moss, 0.0, 1.0));
            alb *= 1.0 - 0.6 * max(crack * wall, fcrack * (1.0 - wall) * (1.0 - scree)) - 0.26 * under * wall - 0.2 * smoothstep(0.06, 0.0, fb) * (1.0 - strong) * part * wall;
            alb *= (1.0 - 0.72 * cleft) * (1.0 + 0.22 * cleftRim) * (0.84 + 0.32 * rsF(vW * 0.21 + 4.0));
            // a ledge's top faces the sky, the rock under it faces down
            vec3 nn = normalize(n + vec3(0.0, 1.0, 0.0) * wall * (0.55 * lip - 0.45 * under) + (vec3(rsN(vW * 0.9), rsN(vW * 0.9 + 7.0), rsN(vW * 0.9 + 13.0)) - 0.5) * 0.35);
            vec3 h = normalize(v + uSunDir);
            vec3 col = alb * (uSunCol * 0.42 * max(dot(nn, uSunDir), 0.0) + mix(uGroundCol * 0.7, uSkyCol, nn.y * 0.5 + 0.5) * 0.95);
            col += wet * (uSkyCol * 0.22 * pow(clamp(1.0 - max(dot(nn, v), 0.0), 0.0, 1.0), 3.0) + uSunCol * 0.3 * pow(max(dot(nn, h), 0.0), 50.0));
            gl_FragColor = vec4(col, 1.0);
            #include <fog_fragment>
          }`,
      });
      const m = new THREE.Mesh(g, mat); m.name = 'chasm-rock'; scene.add(m); outdoor.push(m);
      await ctx.yield();
      // THE VENT'S POOL: the water the fountain falls back into. It boils white under the column (within three quarters of the spray's
      // reach), rings run out from the column's foot 7 m apart at 6 m/s and die by the pool's rim, torn foam is carried outward and thins,
      // and the rest is dark water that mirrors the sky. Toward the gorge it gives way to the river's own water in the channel.
      const pg = new THREE.CircleGeometry(VPOOL + 12, 56); pg.rotateX(-Math.PI / 2);
      const pmat = new THREE.ShaderMaterial({
        fog: true, transparent: true, depthWrite: false, uniforms: { ...THREE.UniformsLib.fog, ...look, uVent: { value: new THREE.Vector4(FV.x, WY, FV.z, SPRAY) }, uCh: { value: new THREE.Vector3(CH.dx, CH.dz, VPOOL) } },
        vertexShader: /* glsl */`varying vec3 vW;
          #include <fog_pars_vertex>
          void main(){ vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; vec4 mvPosition = viewMatrix * w; gl_Position = projectionMatrix * mvPosition;
            #include <fog_vertex>
          }`,
        fragmentShader: /* glsl */`uniform vec3 uSunDir, uSunCol, uSkyCol, uHorizonCol, uCh; uniform vec4 uVent; uniform float uTime; varying vec3 vW;
          #include <fog_pars_fragment>
          ${GLSL_N3}
          void main(){
            vec2 d = vW.xz - uVent.xz; float r = length(d); vec2 dir = d / max(r, 1e-3);
            float s = dot(d, uCh.xy), l = d.x * uCh.y - d.y * uCh.x;
            float ph = r * 0.9 - uTime * 5.4 + 2.5 * rsN(vec3(vW.xz * 0.07, uTime * 0.2)), amp = smoothstep(uCh.z, uVent.w * 0.4, r);
            float c1 = rsN(vec3(vW.xz * 0.55 - dir * uTime * 1.5, uTime * 0.5)), c2 = rsN(vec3(vW.zx * 1.7 + 3.0, uTime * 0.9));
            vec3 n = normalize(vec3(dir.x * cos(ph) * 0.3 * amp + (c1 - 0.5) * 0.32, 1.0, dir.y * cos(ph) * 0.3 * amp + (c2 - 0.5) * 0.32));
            vec3 v = normalize(cameraPosition - vW), rf = reflect(-v, n);
            float fres = 0.04 + 0.96 * pow(clamp(1.0 - max(dot(n, v), 0.0), 0.0, 1.0), 4.0);
            vec3 col = mix(vec3(0.012, 0.045, 0.05) + uSkyCol * 0.03, mix(uHorizonCol, uSkyCol, clamp(rf.y * 1.5, 0.0, 1.0)) * 0.9, fres);
            col += uSunCol * 0.5 * pow(max(dot(rf, uSunDir), 0.0), 120.0);
            float boil = smoothstep(uVent.w * 0.75, uVent.w * 0.25, r) * (0.75 + 0.5 * rsN(vec3(vW.xz * 0.9, uTime * 2.2)));
            float torn = rsF(vec3((vW.xz - dir * uTime * 2.0) * 0.21, uTime * 0.12));
            float foam = boil * 1.3 + 0.9 * smoothstep(0.6, 0.8, torn + 0.34 * smoothstep(uCh.z * 0.8, uVent.w * 0.5, r)) * smoothstep(uCh.z + 6.0, uCh.z * 0.55, r) + 0.4 * amp * smoothstep(0.8, 1.0, sin(ph)) * c1;
            vec3 foamCol = min(uSunCol * 0.25 * max(uSunDir.y, 0.2) + uSkyCol * 0.55 + uHorizonCol * 0.25, vec3(0.95));
            col = mix(col, foamCol * (0.85 + 0.3 * c2), clamp(foam, 0.0, 1.0));
            float chan = step(s, 0.0) * smoothstep(18.0, 12.0, abs(l));
            gl_FragColor = vec4(col, 1.0 - chan * smoothstep(uCh.z - 6.0, uCh.z + 8.0, r));
            #include <fog_fragment>
          }`,
      });
      const pool = new THREE.Mesh(pg, pmat); pool.position.set(FV.x, WY + 0.03, FV.z); pool.renderOrder = 2; pool.name = 'vent-pool'; scene.add(pool); outdoor.push(pool);
    }
    await ctx.yield();

    // ---------- the hero: the head wall across the valley, the dome on its balcony over the mouth ----------
    // the wind blows west and a little north, down the valley: the fountain's spray drifts from the vent toward the valley's side of the
    // chasm, away from the east side, where the way passes
    const windDir = [-0.75, -0.3];
    const wind = flora.makeWind({ direction: windDir, strength: V.wind });
    const fopts = { wind, backlight: 1.0, ambient: 2.0, leafAmbient: 1.9 };
    await flora.prepareLeafTexture(fopts, ctx.yield, 24);
    const fmat = flora.windMaterial(fopts);
    const hero = await buildHero(ctx, { rng: RN.hero, look, wing: 330, shape: S, mirror: 0, waterY: WY, stub: false, bounce: hour === 'golden' ? 3.4 : 2.2, floraMaterial: fmat, wind: windDir, detailTexture: land.detailTexture, density: dens, blossom: V.blossom, treeDetail: 0 });
    hero.object.position.set(XC, 0, ZR); hero.object.rotation.y = Math.PI / 2; hero.place();
    scene.add(hero.object); outdoor.push(hero.object);
    const DOME = hero.anchors.domeCentre.clone().applyMatrix4(hero.object.matrixWorld), DOME_TOP = hero.anchors.domeTop.clone().applyMatrix4(hero.object.matrixWorld);
    await ctx.yield();

    // ---------- water: the river (a mirror of sky, banks and dome, broken by ripples), the rills ----------
    const WL = Water.waterLight(sky);
    {
      // the ribbon is carried 4 m behind the cliff's foot line, into the ice (the course itself ends 4 m before it). Across the mouth's lining (within 21 m of
      // the middle, not beyond 24 m) it ends outside the lip: it fades from 20 to 8 m before the foot line, and the cave's river lies under it there
      const ribbonCurve = new THREE.CatmullRomCurve3([...course, [XC - 4, ZR]].map((p) => new THREE.Vector3(p[0], WY, p[1])), false, 'centripetal');
      const geo = ribbonGeometry(ribbonCurve, 520, 12, (u, p) => { const dF = Math.hypot(p.x - FV.x, p.z - FV.z); return 2 * (Math.max(hwAt(p.x, p.z), 20 - dF * 0.6) + 1.7); });
      await ctx.yield();
      const river = new THREE.Mesh(geo, makeWaterMaterial(look, hero.water, { length: ribbonCurve.getLength(), end: [24, 12, 21, 24], still: [150, 230], riffles: RIFFLES, bloom: V.blossom })); river.renderOrder = 1; river.name = 'river'; scene.add(river); outdoor.push(river);
    }
    await ctx.yield();
    {
      // a rill is the same water as the river it joins: the mirror ribbon, 4.4 m wide, running three times as fast
      const rillMat = makeWaterMaterial(look, {}, { flow: 3, tree: 5, shelf: [0.3, 0.7, 1.2, 0] });
      for (const r of rills) {
        const curve = new THREE.CatmullRomCurve3(r.map((p) => new THREE.Vector3(p[0], p[1], p[2])), false, 'centripetal');
        const m = new THREE.Mesh(ribbonGeometry(curve, 36, 4, () => 4.4), rillMat); m.renderOrder = 1; m.name = 'rill'; scene.add(m); outdoor.push(m);
      }
    }
    await ctx.yield();
    // ---------- trees: old forest and cedars, incense trees in blossom ----------
    // places inside the loops (on the inner bank, three tenths of the way from the base line to the crest): the old forest stands
    // thick inside the first loop, the lawn of the deer lies open inside the second; the first incense grove stands at the last node
    const inside = loops.map((l, i) => { const x = course[crestK[i]][0]; return [x, zBase(x) + l.side * l.half * 0.3]; });
    const lastSide = loops[nLoops - 1].side, GROVE = [X_END, zBase(X_END) - lastSide * 34];
    const chasmAt = (x, z) => { const [s, l] = cleftSL(x, z); return s > -GORGE - 20 && s < HEAD_S + 80 && Math.abs(l) < cleftHalf(s, l) + 10; };
    const cedarK = (x, z) => Math.exp(-((Math.hypot(x - HILL.x, z - HILL.z) / (HILL.r * 1.15)) ** 2));
    // (no tree stands in the chasm or within 10 m of its walls' feet: its bed is rock and river, and the bowl, 100 m and more across, holds the
    // spray's reach whole)
    // THE INCENSE HAS ITS BURNERS (stream 'burners'): great stone and gold censers, 4.2 m tall, each with one thread of smoke.
    // Three stand in the first grove, 9 m from its middle. Down the river from the grove to the head of the pool one stands every
    // 38 to 50 m of the water, on the banks by turns, 8 m back from the water's edge (one that would stand within 14 m of the way,
    // seen from above, is set as much farther back from the water as it lacks); none stands within 16 m of the garden's gate along the river (the gate's towers
    // stand there). No tree is planted within 9 m of a burner (12 m for the forest's): no smoke rises through a crown.
    const BURN = [];
    {
      const br = RN.burners, a0 = br.range(0, TAU), rq0 = new THREE.Vector3(), rt0 = new THREE.Vector3();
      for (let k = 0; k < 3; k++) { const a = a0 + k * TAU / 3, x = GROVE[0] + 9 * Math.cos(a), z = GROVE[1] + 9 * Math.sin(a); BURN.push([x, hAt(x, z), z, br.range(13, 19)]); }
      const tA = tOfXZ(X_END, zBase(X_END)), tB = tOfXZ(XC + POOL_LEN + 6, ZR);
      for (let t = tA + br.range(20, 40) / RLEN, side = br.sign(); t < tB; t += br.range(38, 50) / RLEN, side = -side) {
        riverCurve.getPointAt(clamp(t, 0, 1), rq0); riverCurve.getTangentAt(clamp(t, 0, 1), rt0);
        const high = br.range(13, 19);
        if (Math.abs(rq0.x - GATE_X) < 16) continue;
        let o = hwAt(rq0.x, rq0.z) + 8, x = rq0.x - rt0.z * side * o, z = rq0.z + rt0.x * side * o;
        const ld = laneXZ(x, z).dist; if (ld < 14) { o += 14 - ld; x = rq0.x - rt0.z * side * o; z = rq0.z + rt0.x * side * o; }
        BURN.push([x, hAt(x, z), z, high]);
      }
    }
    const nearBurner = (x, z, d) => BURN.some((b) => Math.hypot(b[0] - x, b[2] - z) < d);
    const wood = [], cedars = [], used = new Set();
    // the old forest (96 trees) stands thick by the river and thins away from it, and none stands farther than 240 m from the river (the ridges and
    // their walls hide what is behind them); nothing grows within 13 m of the route (measured on the route every 2 m)
    for (let i = 0, tries = 0, tr = RN.forest, want = Math.round(96 * dens); i < want && tries < 30000; tries++) {
      if (tries % 250 === 249) await ctx.yield();
      const x = tr.range(XC + 8, 400), z = tr.range(-620, 270), key = Math.floor(x / 7) * 4096 + Math.floor(z / 7);
      if (used.has(key)) continue;
      const d = riverCoarse(x, z), ck = cedarK(x, z), gk = gardenK(x);
      let k = Math.max(standAt(x, z) * sst(20, 46, d), ck * 0.95, sst(58, 40, Math.hypot(x - inside[0][0], z - inside[0][1])));
      if (gk > 0 && d < 104) k *= 1 - gk;
      if (Math.hypot(x - inside[1][0], z - inside[1][1]) < 34 || Math.abs(x - GATE_X) < 8) continue;
      if (k < 0.04 || tr() > k) continue;
      if (d > 240 || tr() > 0.3 + 0.7 * Math.exp(-d / 150) || laneXZ(x, z).dist < 13) continue;
      if (chasmAt(x, z) || nearBurner(x, z, 12)) continue;
      const y = hAt(x, z); if (y < 1.2) continue;
      if (Math.abs(hAt(x + 3, z) - y) + Math.abs(hAt(x, z + 3) - y) > 6.5) continue;
      used.add(key);
      const np = path.nearestXZ(x, z);
      wood.push({ x, y: y - 0.4, z, s: tr.range(1.0, 1.9) * (1 + 0.25 * ck), rot: tr.range(0, TAU), d: np.dist, u: np.u / Math.max(U_MOUTH, 0.01), v: tr() < Math.max(ck, 0.2) ? (tr.chance(0.4) ? 2 : 3) : tr.int(0, 1) });
      i++;
    }
    for (let i = 0, tries = 0, tr = RN.cedars, want = Math.round(46 * dens); i < want && tries < 6000; tries++) {      // the cover of cedars on the hill beyond the chasm
      if (tries % 60 === 59) await ctx.yield();
      const a = tr.range(0, TAU), rr = HILL.r * 1.3 * Math.sqrt(tr()), x = HILL.x + Math.cos(a) * rr, z = HILL.z + Math.sin(a) * rr, key = Math.floor(x / 7) * 4096 + Math.floor(z / 7);
      if (used.has(key) || chasmAt(x, z)) continue;
      const y = hAt(x, z); if (y < 1.5 || riverCoarse(x, z) < 22) continue;
      if (laneXZ(x, z).dist < 14) continue;
      used.add(key);
      const np = path.nearestXZ(x, z);
      cedars.push({ x, y: y - 0.5, z, s: tr.range(1.0, 1.9), rot: tr.range(0, TAU), d: np.dist, u: np.u / Math.max(U_MOUTH, 0.01), v: tr.chance(0.3) ? 2 : 3 });
      i++;
    }
    await ctx.yield();
    // the cedarn cover of the chasm: 70 tall dark cedars (27 to 42 m) standing close on both its sides, 14 to 55 m outside the walls' feet from
    // the gorge's mouth to where the upper chasm closes, and over its head beyond that
    const rim = [];
    for (let i = 0, tries = 0, tr = RN['chasm-cedars'], want = Math.round(70 * dens); i < want && tries < 4000; tries++) {
      if (tries % 60 === 59) await ctx.yield();
      const head = tr.chance(0.12), sc = head ? tr.range(HEAD_S + 70, HEAD_S + 110) : tr.range(-GORGE - 10, HEAD_S + 60), sg = tr.sign(), lc = head ? tr.range(-40, 40) : sg * (cleftHalf(sc, sg) + tr.range(14, 55));
      const [x, z] = chXZ(sc, lc), key = Math.floor(x / 7) * 4096 + Math.floor(z / 7);
      if (used.has(key) || laneXZ(x, z).dist < 14) continue;
      const y = hAt(x, z); if (y < 6) continue;
      used.add(key);
      // (its share along the chasm, for the kit's chunks; its distance from the route's line, for the kit's lighter trees beyond 24 m)
      rim.push({ x, y: y - 0.6, z, s: tr.range(1.3, 2.0), rot: tr.range(0, TAU), d: laneXZ(x, z).dist, u: clamp((sc + GORGE + 10) / (HEAD_S + 120 + GORGE), 0, 0.999), v: tr.chance(0.35) ? 2 : 3 });
      i++;
    }
    // ON THE LEDGES: small cedars (a third to a half of the rim's trees) rooted on the walls' benches where a ledge is at its full
    // breadth and the rock stands clear of the hill, none within the spray's reach and a third of the vent, none within 16 m of the way
    for (let i = 0, tries = 0, tr = RN['ledge-cedars'], want = Math.round(30 * dens); i < want && tries < 1500; tries++) {
      if (tries % 60 === 59) await ctx.yield();
      const sc = tr.range(-GORGE + 6, HEAD_S), sg = tr.sign(), k = tr.int(0, 3), f = tr.range(0.3, 0.7), size = tr.range(0.34, 0.6), rot = tr.range(0, TAU), kind = tr.chance(0.35) ? 2 : 3;
      const q = ledgeAt(sc, sg, k, f);
      if (q.w < 0.9 || q.y > hill0(q.x, q.z) - 4 || Math.hypot(q.x - FV.x, q.z - FV.z) < SPRAY * 1.33 || laneXZ(q.x, q.z).dist < 16) continue;
      rim.push({ x: q.x, y: q.y - 0.5, z: q.z, s: size, rot, d: laneXZ(q.x, q.z).dist, u: clamp((sc + GORGE + 10) / (HEAD_S + 120 + GORGE), 0, 0.999), v: kind });
      i++;
    }
    await ctx.yield();
    const blossom = [], rows = [];
    const addBlossom = (x, z, s, rot, v, into) => {
      const y = hAt(x, z); if (y < 0.9 || laneXZ(x, z).dist < 11 || Math.abs(x - GATE_X) < 8 || nearBurner(x, z, 9)) return;
      const np = path.nearestXZ(x, z);
      into.push({ x, y: y - 0.25, z, s, rot, d: np.dist, u: np.u / Math.max(U_MOUTH, 0.01), v });
    };
    for (let i = 0, tries = 0, tr = RN['bank-blossom'], want = Math.round(60 * dens); i < want && tries < 8000; tries++) {       // along the banks, more of them from the first node down to the gardens
      if (tries % 200 === 199) await ctx.yield();
      const x = tr.range(XC + 40, X0), z = tr.range(-360, -20), d = riverCoarse(x, z), e = d - hwAt(x, z);
      if (e < 4 || e > 42 || tr() > sst(X0, X_END, x) * 0.8 + 0.2 || tr() > 1 - e / 60) continue;
      if (Math.hypot(x - inside[1][0], z - inside[1][1]) < 30) continue;
      const key = Math.floor(x / 6) * 4096 + Math.floor(z / 6); if (used.has(key)) continue; used.add(key);
      addBlossom(x, z, tr.range(0.8, 1.3), tr.range(0, TAU), tr.int(0, 1), blossom); i++;
    }
    for (let i = 0, tries = 0, tr = RN.grove; i < 14 && tries < 400; tries++) {                           // the first incense grove: fourteen trees within 30 m of its place, about its three burners
      const a = tr.range(0, TAU), r = 30 * Math.sqrt(tr()), x = GROVE[0] + Math.cos(a) * r, z = GROVE[1] + Math.sin(a) * r, e = riverD(x, z) - hwAt(x, z);
      const key = Math.floor(x / 6) * 4096 + Math.floor(z / 6); if (e < 4 || used.has(key)) continue; used.add(key);
      const n0 = blossom.length; addBlossom(x, z, tr.range(0.9, 1.35), tr.range(0, TAU), tr.int(0, 1), blossom); if (blossom.length > n0) i++;
    }
    for (let k = 0; k < 4; k++) for (const side of [-1, 1]) {                                            // orchard rows on the terraces
      await ctx.yield();
      const tr = RN['terrace-rows'];
      for (let x = GATE_X + 26 - (k % 2) * 7; x > XC + ROWS_OFF; x -= 17 * (0.8 + 0.4 * tr())) {
        // (every station of a row draws all that it may need before any test of the place, so a rill or a burner that moves deals no other tree anew)
        const z = ZR + side * (24 + k * 23 + 11.5 + tr.range(-1.5, 1.5)), gap = tr.chance(0.12), cyp = tr.chance(0.3), sCyp = tr.range(1.0, 1.45), sBl = tr.range(0.85, 1.2), rot = tr.range(0, TAU), kindB = tr.int(0, 1);
        if (rillD(x, z) < 6 || gap) continue;
        if (cyp) { const y = hAt(x, z), np = path.nearestXZ(x, z); if (y > 0.9 && laneXZ(x, z).dist >= 11 && Math.abs(x - GATE_X) >= 8 && !nearBurner(x, z, 9)) rows.push({ x, y: y - 0.3, z, s: sCyp, rot, d: np.dist, u: np.u / Math.max(U_MOUTH, 0.01), v: 2 }); }
        else addBlossom(x, z, sBl, rot, kindB, rows);
      }
    }
    const leafOak = { leaf: '#2f7a3c', leafLight: '#5ea84a', leafDark: '#1c4a2a' }, leafCedar = { leaf: '#17503a', leafLight: '#2c7a50', leafDark: '#0f3b2a', bark: '#6a4a38' };
    const nearV = [], farV = [];
    nearV.push(flora.oakGeometry({ rng: RN.oak1, detail: 1, height: 14, ...leafOak })); await ctx.yield();
    nearV.push(flora.oakGeometry({ rng: RN.oak2, detail: 1, height: 11, ...leafOak })); await ctx.yield();
    nearV.push(flora.pineGeometry({ rng: RN.pine1, detail: 1, height: 20, ...leafCedar })); await ctx.yield();
    nearV.push(flora.coniferGeometry({ rng: RN.conifer1, detail: 1, height: 21, slim: 1.25, droop: 0.7, ...leafCedar })); await ctx.yield();
    farV.push(flora.oakGeometry({ rng: RN.oak3, detail: 0, height: 13, ...leafOak }), flora.oakGeometry({ rng: RN.oak4, detail: 0, height: 11, ...leafOak })); await ctx.yield();
    farV.push(flora.pineGeometry({ rng: RN.pine2, detail: 0, height: 19, ...leafCedar }), flora.coniferGeometry({ rng: RN.conifer2, detail: 0, height: 21, slim: 1.25, droop: 0.7, ...leafCedar })); await ctx.yield();
    // A5: no tree's crown reaches the way: a trunk stands no nearer the way (in plan) than its own crown's reach (the widest its two made
    // shapes go from the trunk, at the tree's scale) and 6 m more; the trees dealt nearer are not planted
    const reachOf = (g) => { g.computeBoundingBox(); const b = g.boundingBox; return Math.max(-b.min.x, b.max.x, -b.min.z, b.max.z); };
    const crownR = nearV.map((g, v) => Math.max(reachOf(g), reachOf(farV[v])));
    const offWay = (t) => laneXZ(t.x, t.z).dist >= crownR[t.v] * t.s + 6;
    const woodKept = wood.filter(offWay), cedarsKept = cedars.filter(offWay), rimKept = rim.filter(offWay);
    // (cullDistance Infinity: the kit hides nothing of the woods by distance; each mesh of them is drawn from its own place, kitLengths below)
    const kitScatters = [];
    const woodOpts = { variants: nearV, farVariants: farV, farDistance: 24, material: fmat, cullDistance: Infinity, heightAt: hAt };
    // A SHEET OF SHADE LIES ONLY ON GROUND THAT HOLDS IT. The kit drapes one sheet under each tree (a disc of 1.1 crown radii,
    // drawn out down-sun) over a few lines of the ground's height, and on a steep bank its far edge hangs in the air. So the
    // sheets are laid here, by the kit's own arithmetic, and a tree gets one only where the ground under its sheet (its middle,
    // its four ends, four places between) stands within 2 m of one height.
    const sunL = Math.hypot(SUN.x, SUN.z), sdx = sunL > 1e-4 ? -SUN.x / sunL : 0, sdz = sunL > 1e-4 ? -SUN.z / sunL : 1, cotS = Math.min(2.2, sunL / Math.max(0.05, SUN.y));
    const shadeFor = (list, shapes, strength) => {
      const casters = [];
      for (const t of list) {
        const r = (shapes[t.v].userData.radius || 1) * t.s, rx = r * 1.1, rz = rx * (1 + 0.55 * cotS), off = (rz - rx) * 0.8, cx = t.x + sdx * off, cz = t.z + sdz * off;
        let lo = 1e9, hi = -1e9;
        for (const [a, b] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1], [0.7, 0.7], [-0.7, 0.7], [0.7, -0.7], [-0.7, -0.7]]) { const h = hAt(cx + sdx * a * rz - sdz * b * rx, cz + sdz * a * rz + sdx * b * rx); lo = Math.min(lo, h); hi = Math.max(hi, h); }
        if (hi - lo <= 2) casters.push({ x: t.x, z: t.z, r });
      }
      const sh = flora.makeGroundShadows({ heightAt: hAt, sunDir: SUN, strength, points: casters });
      sh.object.name = 'tree-shade'; scene.add(sh.object); outdoor.push(sh.object);
      return sh;
    };
    const shades = [];
    // the forest is laid in three parts (a third of its trees each), so that no step of the build is long
    const forests = [], orchards = [];
    for (let k = 0; k < 3; k++) {
      const part = woodKept.filter((_, i) => i % 3 === k), forest = flora.makeScatter({ rng: RN['forest-scatter'].fork('part' + k), points: part, chunks: 2, ...woodOpts });
      forest.object.name = 'forest'; scene.add(forest.object); updaters.push(forest); outdoor.push(forest.object); forests.push(forest); kitScatters.push(forest);
      await ctx.yield();
      shades.push(shadeFor(part, nearV, 0.5));
      await ctx.yield();
    }
    const cedarWood = flora.makeScatter({ rng: RN['cedar-scatter'], points: cedarsKept, chunks: 3, ...woodOpts });
    cedarWood.object.name = 'cedars'; scene.add(cedarWood.object); updaters.push(cedarWood); outdoor.push(cedarWood.object); kitScatters.push(cedarWood);
    await ctx.yield();
    shades.push(shadeFor(cedarsKept, nearV, 0.5));
    await ctx.yield();
    // (the rim's cedars stand on the chasm's rim, over the way: the ground they shade is the rim's top, which nothing on the way looks
    // down on, so no sheet of shade is laid under them)
    const rimWood = flora.makeScatter({ rng: RN['chasm-cedars'].fork('scatter'), points: rimKept, chunks: 4, ...woodOpts });
    rimWood.object.name = 'chasm-cedars'; scene.add(rimWood.object); updaters.push(rimWood); outdoor.push(rimWood.object); kitScatters.push(rimWood);
    await ctx.yield();
    const bmat = flora.windMaterial({ wind, map: fmat.map, backlight: 1.1, backlightTint: '#ffd9e4', ambient: 2.0, leafAmbient: 2.2 });
    const cyp = flora.cypressGeometry({ rng: RN.cypress, detail: 0, height: 15, leaf: '#1d5a3c', leafLight: '#2f7a4e', leafDark: '#0f3b2a' });
    const cherryV = [], cherryF = [], bl = { leaf: V.blossom[0], leafLight: V.blossom[1] };
    await ctx.yield();
    cherryV.push(flora.cherryGeometry({ rng: RN.cherry1, detail: 1, height: 10.5, ...bl })); await ctx.yield();
    cherryV.push(flora.cherryGeometry({ rng: RN.cherry2, detail: 1, height: 8.5, ...bl }), cyp); await ctx.yield();
    cherryF.push(flora.cherryGeometry({ rng: RN.cherry3, detail: 0, height: 10, ...bl }), flora.cherryGeometry({ rng: RN.cherry4, detail: 0, height: 8.5, ...bl }), cyp); await ctx.yield();
    // a blossom tree or a cypress of the rows stands no nearer the way (in plan) than its own crown's reach (the
    // widest its two made shapes go from the trunk, at the tree's scale) and 6 m more; the trees dealt nearer are not planted
    const crownB = cherryV.map((g, v) => Math.max(reachOf(g), reachOf(cherryF[v]))), offWayB = (t) => laneXZ(t.x, t.z).dist >= crownB[t.v] * t.s + 6;
    // WHAT STANDS TALL IN THE GARDENS, for whatever flies over them (the cranes): [x, z, the radius of its crown or body, its top] of
    // every tree planted (the scatter stretches a tree by a tenth at the most), every tower, and the walls at every joint
    const TALL = [], topOf = (g) => g.boundingBox.max.y, topW = nearV.map((g, v) => Math.max(topOf(g), topOf(farV[v]))), topB = cherryV.map((g, v) => Math.max(topOf(g), topOf(cherryF[v])));
    for (const t of [...woodKept, ...cedarsKept, ...rimKept]) TALL.push([t.x, t.z, crownR[t.v] * t.s, t.y + 1.1 * topW[t.v] * t.s]);
    for (const t of [...blossom, ...rows]) if (offWayB(t)) TALL.push([t.x, t.z, crownB[t.v] * t.s, t.y + 1.1 * topB[t.v] * t.s]);
    const tallAt = (x, z, r) => { let y = -1e9; for (const q of TALL) if (q[3] > y && Math.hypot(q[0] - x, q[1] - z) < q[2] + r) y = q[3]; return y; };
    const orchOpts = { variants: cherryV, farVariants: cherryF, farDistance: 22, material: bmat, cullDistance: 470, heightAt: hAt };
    for (let k = 0; k < 2; k++) {
      const part = blossom.filter((t, i) => i % 2 === k && offWayB(t)), orchard = flora.makeScatter({ rng: RN['orchard-scatter'].fork('part' + k), points: part, chunks: 2, ...orchOpts });
      orchard.object.name = 'incense-trees'; scene.add(orchard.object); updaters.push(orchard); outdoor.push(orchard.object); orchards.push(orchard);
      await ctx.yield();
      shades.push(shadeFor(part, cherryV, 0.45));
      await ctx.yield();
    }
    const rowsKept = rows.filter(offWayB), terraceRows = flora.makeScatter({ rng: RN['rows-scatter'], points: rowsKept, chunks: 3, ...orchOpts });
    terraceRows.object.name = 'terrace-rows'; scene.add(terraceRows.object); updaters.push(terraceRows); outdoor.push(terraceRows.object);
    await ctx.yield();
    shades.push(shadeFor(rowsKept, cherryV, 0.45));
    await ctx.yield();
    const incense = makeIncense(look, BURN.map((b) => [b[0], b[1] + BURNER_H - 0.15, b[2], b[3]]), { wind: [windDir[0] * 0.9, windDir[1] * 0.9] });
    scene.add(incense); outdoor.push(incense);
    await ctx.yield();

    // ---------- ground cover, reeds and stones at the water's edge ----------
    const tmpC = new THREE.Color(), gCol = (x, z, y) => groundColor(x, z, y, 1, tmpC);
    // No grass is laid above the pass's end: from the upper chasm's head to there the land lies cut 2.5 m and more under the chasm's own
    // rock, and a tuft (2.2 m at its tallest) set on it would stand wholly inside the stone. The number is less by the same share of the
    // way's length, so the valley's grass is as thick as it was. The flowers likewise.
    const U_SOIL = M.passOut / PL, soilK = (M.mouth - M.passOut) / Math.max(M.mouth, 1);
    const grass = await flora.makeGrassAsync({ rng: RN.grass, path, radius: 54, count: Math.round(8500 * dens * soilK), bias: 1.9, width: [1.3, 2.3], height: [0.6, 1.2], heightAt: hAt, heightStep: 3,
      groundColor: gCol, yRange: [0.72, 170], shade: shades, wind, map: fmat.map, flowers: 0.05, flowerColors: [V.blossom[0], '#fff3d6', '#f5c344'], fade: [110, 145], chunks: 9, uRange: [U_SOIL, U_MOUTH] }, ctx.yield, 24);
    grass.object.name = 'grass'; scene.add(grass.object); updaters.push(grass); outdoor.push(grass.object);
    await ctx.yield();
    // (the cover is kept in short lengths of the valley, grass in nine, flowers in five, reeds in eight, lilies in four: a length farther
    // off than its tufts can be made out is not drawn, and the short lengths leave fewer unseen tufts to draw with the seen ones)
    // two halves on two streams (the same number in all): the kit lays each in one go
    for (const name of ['flowers', 'flowers2']) {
      const flowers = flora.makeFlowers({ rng: RN[name], path, heightAt: hAt, wind, map: fmat.map, count: Math.round(540 * lush * (M.mouth - M.passOut) / Math.max(M.mouth - M.fount, 1)), radius: 46, scale: [0.8, 1.4], yRange: [1.0, 60], chunks: 5, uRange: [U_SOIL, U_MOUTH],
        density: (x, z) => clamp(sst(0.0, 0.4, N.n2(x * 0.035 + 9, z * 0.035 - 5)) * 0.6 + gardenK(x) * 0.8, 0, 1), groundColor: gCol, shade: shades, colors: [V.blossom[0], '#fff3d6', '#f5c344', '#f2a7b8', '#6f8fe8'] });
      flowers.object.name = 'flowers'; scene.add(flowers.object); updaters.push(flowers); outdoor.push(flowers.object);
      await ctx.yield();
    }
    // ferns on the gorge's floor and at the feet of its walls (12 m inside to 8 m outside the walls' feet), from the gorge's mouth up to where
    // the bowl's rock floor begins, 5 m below the bowl: in the bowl the floor is bare wet rock under the spray, and the land a fern would
    // root in lies 2.5 m and more under it. As thick in the gorge as they were (the gorge's share of the band they were once dealt over).
    const ferns = flora.makeFerns({ rng: RN.ferns, path, heightAt: hAt, material: fmat, count: Math.max(6, Math.round(260 * dens * (GORGE + 5 - BOWL) / (GORGE + 45))), radius: 60, corridor: 3, uRange: [U_SOIL, M.node0 / PL], yRange: [0.8, 40], scale: [1.4, 2.6],
      density: (x, z) => { const [sc, lc] = cleftSL(x, z), o = Math.abs(lc) - cleftHalf(sc, lc); return sc > -GORGE - 10 && sc < -BOWL - 5 && o > -12 && o < 8 ? 1 : 0; } });
    ferns.object.name = 'ferns'; scene.add(ferns.object); updaters.push(ferns); outdoor.push(ferns.object);
    await ctx.yield();
    const rq = new THREE.Vector3(), rt = new THREE.Vector3();
    // a LOW thing (a stone, a clump of reeds) may stand nearer the way's line than 11 m only where its top lies 3 m and more under the way
    const lowOK = (x, z, top) => { const ln = laneXZ(x, z); return ln.dist >= 11 || ln.y - top >= 3; };
    // a spot on a bank of the river: at share t of its course, on the side `side` (+1 = to the right of the flow), `off` metres back from the water's edge
    const bankAt = (t, side, off) => { riverCurve.getPointAt(clamp(t, 0, 1), rq); riverCurve.getTangentAt(clamp(t, 0, 1), rt); const o = hwAt(rq.x, rq.z) + off; return [rq.x - rt.z * side * o, rq.z + rt.x * side * o]; };
    {
      const sr = RN.stones, nS = 90, geo = T.rockGeometry({ rng: RN['stone-shape'], kind: 'boulder', radius: 1, detail: 1, color: '#8d867a', colorB: '#5f5a52' });
      const mesh = new THREE.InstancedMesh(geo, T.makeRockMaterial({ rng: RN['stone-skin'], detailTexture: land.detailTexture, waterLevel: WY, wet: 0.5 }), nS), m4 = new THREE.Matrix4(), q4 = new THREE.Quaternion(), e3 = new THREE.Euler(), v3 = new THREE.Vector3(), s3 = new THREE.Vector3();
      let n = 0;
      for (let tries = 0; n < nS && tries < 600; tries++) {
        const b = bankAt(sr.range(0.07, 0.97), sr.sign(), sr.range(-3.5, 1)), r = sr.range(0.5, 1.6);
        if (laneXZ(b[0], b[1]).dist < 11 + r || Math.abs(b[0] - GATE_X) < 8) continue;
        e3.set(sr.range(-0.3, 0.3), sr.range(0, TAU), sr.range(-0.3, 0.3)); q4.setFromEuler(e3);
        m4.compose(v3.set(b[0], Math.max(hAt(b[0], b[1]), WY - 0.5) + r * 0.15, b[1]), q4, s3.set(r * sr.range(0.9, 1.4), r * 0.75, r)); mesh.setMatrixAt(n++, m4);
      }
      mesh.count = n; mesh.instanceMatrix.needsUpdate = true; mesh.name = 'bank-stones'; scene.add(mesh); outdoor.push(mesh);
      // THE FIRST REACH, from the bowl's lower rim down the gorge and round the turn to a tenth of the river beyond the first node, is
      // strewn: 70 places are dealt for boulders of 0.9 to 2.6 m (most of them small) on its banks and in its shallows, from 5 m in the
      // water to 2.5 m up the bank. And SCREE lies at the feet of the chasm's walls: 46 places for blocks of 0.7 to 2.2 m within 4.5 m
      // inside the walls' feet, from the gorge to the head of the upper chasm, none in the vent's pool. A place too near the way (the
      // rule of low things above) stays empty. All of them are of the banks' stone.
      const big = new THREE.InstancedMesh(geo, mesh.material, 116), rs = RN['reach-stones'], ss = RN.scree, tA = tOfXZ(...chXZ(-BOWL - 5, 0)), tB = tOfXZ(X0, Z0) + 0.1;
      let nb = 0;
      const lay = (x, z, y, r, rr) => {
        e3.set(rr.range(-0.35, 0.35), rr.range(0, TAU), rr.range(-0.35, 0.35)); q4.setFromEuler(e3);
        m4.compose(v3.set(x, y + r * 0.12, z), q4, s3.set(r * rr.range(0.9, 1.4), r * rr.range(0.65, 0.9), r)); big.setMatrixAt(nb++, m4);
      };
      for (let k = 0; k < 70; k++) {
        const b = bankAt(rs.range(tA, tB), rs.sign(), rs.range(-5, 2.5)), r = 0.9 + 1.7 * rs() ** 2.2, y = Math.max(hAt(b[0], b[1]), WY - 0.5);
        if (lowOK(b[0], b[1], y + r)) lay(b[0], b[1], y, r, rs);
      }
      for (let k = 0; k < 46; k++) {
        const sc = ss.range(-GORGE + 10, HEAD_S), sg = ss.sign(), l = sg * (cleftHalf(sc, sg) - ss.range(0.5, 4.5)), r = 0.7 + 1.5 * ss() ** 1.8, [x, z] = chXZ(sc, l);
        const y = sc > -BOWL - 5 ? cleftY(sc, l) : hAt(x, z);
        if (Math.hypot(sc, l) > VPOOL + 6 && y > WY - 0.4 && lowOK(x, z, y + r)) lay(x, z, y, r, ss);
      }
      big.count = nb; big.instanceMatrix.needsUpdate = true; big.name = 'reach-stones'; scene.add(big); outdoor.push(big);
    }
    await ctx.yield();
    {
      // reed beds along the river's banks from the gorge's mouth to the gardens' end, 14 to 30 m long, clumps 1.5 to 2.4 m apart, from 2.5 m in
      // the water to 0.3 m up the bank, none within 11 m of the route's line unless it lies 3 m under it; beds are laid until a third of each
      // bank's length carries reeds (clumps 1.95 m apart on the mean)
      const rr = RN.reeds, bankLen = riverCurve.getLength(), t0 = tOfXZ(...chXZ(-GORGE, 0)), want = bankLen * (1 - t0) / 3 / 1.95, reedPts = [];
      for (const side of [-1, 1]) for (let b = 0, n0 = reedPts.length; b < 80 && reedPts.length - n0 < want; b++) {
        const tb = rr.range(t0, 0.985), len = rr.range(14, 30);
        for (let d = 0; d < len; d += rr.range(1.5, 2.4)) {
          const p = bankAt(tb + d / bankLen, side, rr.range(-2.5, 0.3)), y = hAt(p[0], p[1]), sc = rr.range(0.8, 1.4), rot = rr.range(0, TAU);
          // (a clump stands 2.8 m at the most at its full size: under the way's line only the small ones, and only where the way is high enough)
          if (!lowOK(p[0], p[1], y + 2.9 * sc) || Math.abs(p[0] - GATE_X) < 8 || y < WY - 1.1) continue;
          reedPts.push({ x: p[0], y, z: p[1], s: sc, rot, d: 0, u: clamp((tb - t0) / (1 - t0), 0, 0.999) });
        }
      }
      await ctx.yield();
      // (the reeds and the lilies sink away with distance by the kit's own fade, as the grass and the flowers do, and the kit stops
      // drawing a length of them where every clump of it is past the fade's end and sunk whole: 160 m for the reeds, 190 m for the lilies)
      const reeds = flora.makeReeds({ rng: RN.reeds.fork('scatter'), points: reedPts, material: flora.windMaterial({ ...fopts, fade: [135, 160] }), chunks: 8 });
      reeds.object.name = 'reeds'; scene.add(reeds.object); updaters.push(reeds); outdoor.push(reeds.object);
      await ctx.yield();
      // lilies on the still water between the gate and the mouth: ten rafts of 12 to 30 pads within 4 to 7 m, their middles 3 to 9 m in from the edge
      const lr = RN.lilies, tg = tOfXZ(GATE_X, ZR), padPts = [];
      for (let k = 0; k < 10; k++) {
        const c = bankAt(lr.range(tg, 0.995), lr.sign(), -lr.range(3, 9)), rad = lr.range(4, 7), n = lr.int(12, 30);
        for (let i = 0; i < n; i++) {
          const a = lr.range(0, TAU), r = rad * Math.sqrt(lr()), x = c[0] + Math.cos(a) * r, z = c[1] + Math.sin(a) * r, sc = lr.range(1.0, 1.8), rot = lr.range(0, TAU);
          if (hAt(x, z) > WY - 0.2 || x < XC + 6) continue;
          padPts.push({ x, y: WY, z, s: sc, rot, d: 0, u: k / 10 });
        }
      }
      const pads = flora.makeLilyPads({ rng: RN.lilies.fork('scatter'), points: padPts, material: flora.windMaterial({ ...fopts, fade: [165, 190] }), waterY: WY, chunks: 4 });
      pads.object.name = 'lilies'; scene.add(pads.object); updaters.push(pads); outdoor.push(pads.object);
    }
    await ctx.yield();
    // THE WOODS ARE FIRST DRAWN BY SIGHT (the forest, the cedars, the chasm's cedars). The kit is given no distance for them; each
    // of their meshes (one shape's trees along one length of the way) is drawn from 16 m before the first eye of the way (eyes
    // every 2 m; every fourth is asked, then the three before the first that sees) that has a straight line clear of the land to
    // one of its trees, and from the first frame if the first eye has one. The lines go to each tree's top, at its middle and at
    // its crown's reach to four sides. The land's height is read from the land's own grid of heights (the one its shade map
    // carries, a node every 6 m), the lowest of the four nodes about a place; it shuts a line only where it stands over it by a
    // metre and by 4 m more at the eye, asked every 8 m: what the test misses, it misses toward drawing earlier.
    // COUNTED on 53 visits: each of the woods' 668 switches comes on unreached, 0 square pixels (the count is said in update, below).
    // (The incense trees and the terrace rows keep the kit's distance: drawn by sight they are in the lens together with all the
    // rest from far up the valley, 40,000 triangles more at the densest frame than the room allows.)
    const kitLengths = [];                                           // [mesh, the place of the way it is drawn from]
    {
      const sm = land.shadeMap.image, gw = sm.width, gd = sm.height, gs = 1 / (land.shadeBox.z * gw), gx0 = land.shadeBox.x + gs * 0.5, gz0 = land.shadeBox.y + gs * 0.5;
      const gh = new Float32Array(gw * gd); for (let k = 0; k < gh.length; k++) gh[k] = THREE.DataUtils.fromHalfFloat(sm.data[k * 4 + 3]);
      const low = (x, z) => { const i = Math.max(0, Math.min(gw - 2, Math.floor((x - gx0) / gs))), j = Math.max(0, Math.min(gd - 2, Math.floor((z - gz0) / gs))), k = j * gw + i; return Math.min(gh[k], gh[k + 1], gh[k + gw], gh[k + gw + 1]); };
      const iOut = Math.min(NL, Math.ceil((M.mouth + 60) / LS));
      const open = (i, x, y, z) => {
        const ex = lnx[i], ey = lny[i], ez = lnz[i], dx = x - ex, dy = y - ey, dz = z - ez, n = Math.ceil(Math.hypot(dx, dz) / 8);
        for (let k = 1; k < n; k++) { const t = k / n; if (low(ex + dx * t, ez + dz * t) > ey + dy * t + 5 - 4 * t) return false; }
        return true;
      };
      let nk = 0;
      for (const sc of kitScatters) for (const mesh of sc.meshes) {
        if (nk++ % 12 === 11) await ctx.yield();
        const g = mesh.geometry; if (!g.boundingBox) g.computeBoundingBox();
        const bb = g.boundingBox, reach = Math.max(-bb.min.x, bb.max.x, -bb.min.z, bb.max.z), a = mesh.instanceMatrix.array, pts = [];
        for (let k = 0; k < mesh.count; k++) { const o = k * 16, r = reach * Math.hypot(a[o], a[o + 1], a[o + 2]), x = a[o + 12], y = a[o + 13] + bb.max.y * Math.hypot(a[o + 4], a[o + 5], a[o + 6]), z = a[o + 14]; pts.push(x, y, z, x + r, y, z, x - r, y, z, x, y, z + r, x, y, z - r); }
        const seenFrom = (i) => { for (let q = 0; q < pts.length; q += 3) if (open(i, pts[q], pts[q + 1], pts[q + 2])) return true; return false; };
        let hit = -1;
        for (let i = 0; i <= iOut && hit < 0; i += 4) if (seenFrom(i)) { hit = i; for (let e = Math.max(0, i - 3); e < i; e++) if (seenFrom(e)) { hit = e; break; } }
        kitLengths.push([mesh, hit < 0 ? Infinity : hit === 0 ? 0 : Math.max(0, hit * LS - 16)]);
      }
    }
    await ctx.yield();
    // ---------- walls and towers on the ridges (the garden is girdled round: we fly inside them) ----------
    const towers = [];
    let nodeTower = null;
    {
      const g = makeGeo(), stone = lin('#a89c84'), stoneB = lin('#8c8068'), white = [1, 1, 1], wr = RN.walls;
      // each wall keeps 95 m beyond the river's outermost water within 90 m up and down the valley, and never comes within 60 m of the route
      const wallLine = (sgn) => {
        const xa = X0 - 20, xb = XC + 70, step = 7, raw = [], P = [];
        for (let x = xa; x >= xb; x -= step) { let ext = -1e9; for (let i = 0; i <= RS; i++) if (Math.abs(rsx[i] - x) < 90) ext = Math.max(ext, sgn * rsz[i]); raw.push(sgn * (ext + 95)); }
        for (let i = 0; i < raw.length; i++) {
          let z = 0; for (let k = -3; k <= 3; k++) z += raw[clamp(i + k, 0, raw.length - 1)] / 7;
          const x = xa - i * step; z = lerp(z + 10 * N.n2(x * 0.008, sgn * 5), ZR + sgn * 150, sst(xb + 160, xb, x));
          const ln = laneXZ(x, z); if (ln.dist < 60) z = sgn > 0 ? Math.max(z, ln.z + 60) : Math.min(z, ln.z - 60);
          P.push([x, hAt(x, z), z]);
        }
        return P;
      };
      const tower = (tx, tz, ty, th) => {
        g.set(3, stoneB).lathe(tx, tz, [[5.0, ty], [4.4, ty + 4], [4.2, ty + th - 2], [5.0, ty + th - 1], [5.0, ty + th]], 14);
        g.set(2, white).lathe(tx, tz, [[4.3, ty + th - 6], [4.3, ty + th - 4.2]], 14);
        g.set(1, white).lathe(tx, tz, [[5.3, ty + th], [3.6, ty + th + 3.2], [1.2, ty + th + 6.4], [0.5, ty + th + 7.4], [0.9, ty + th + 8.2], [0.05, ty + th + 11]], 14);
        towers.push({ x: tx, y: ty + th + 4, z: tz }); TALL.push([tx, tz, 5.3, ty + th + 11]);
      };
      const lines = [wallLine(-1)], zAtGate = [];
      await ctx.yield();
      lines.push(wallLine(1));
      await ctx.yield();
      // a tower also stands where each wall is met by the straight line of the river at a node between two loops: the places on the wall the river points at
      const hits = lines.map(() => new Map()), tg = new THREE.Vector3();
      for (let j = 0; j < nodes.length; j++) {
        riverCurve.getTangentAt(tOfXZ(nodes[j][0], nodes[j][1]), tg); const l = Math.hypot(tg.x, tg.z) || 1, dx = tg.x / l, dz = tg.z / l;
        let best = 1e9, bl = -1, bi = -1;
        for (let w = 0; w < 2; w++) for (let i = 0; i < lines[w].length - 1; i++) { const px = lines[w][i][0] - nodes[j][0], pz = lines[w][i][2] - nodes[j][1], al = px * dx + pz * dz, cx = Math.abs(px * dz - pz * dx); if (al > 30 && cx < 6 && al < best) { best = al; bl = w; bi = i; } }
        if (bi >= 0) hits[bl].set(bi, j);
      }
      for (let w = 0; w < 2; w++) {
        await ctx.yield();
        const P = lines[w];
        { let bi = 0; for (let i = 0; i < P.length; i++) if (Math.abs(P[i][0] - GATE_X) < Math.abs(P[bi][0] - GATE_X)) bi = i; zAtGate.push(P[bi][2]); }
        for (let i = 0; i < P.length - 1; i++) {
          if (i % 20 === 19) await ctx.yield();
          const a = P[i], b = P[i + 1], dx = b[0] - a[0], dz = b[2] - a[2], len = Math.hypot(dx, dz), yaw = Math.atan2(-dz, dx), y = Math.min(a[1], b[1]) - 2.5, h = Math.max(a[1], b[1]) + 7 - y;
          g.set(3, i % 2 ? stone : stoneB).box((a[0] + b[0]) / 2, y, (a[2] + b[2]) / 2, len + 0.3, h, 2.4, yaw);
          g.set(3, stone).box(lerp(a[0], b[0], 0.25), y + h, lerp(a[2], b[2], 0.25), len * 0.3, 1.2, 2.6, yaw);
          g.box(lerp(a[0], b[0], 0.75), y + h, lerp(a[2], b[2], 0.75), len * 0.3, 1.2, 2.6, yaw);
          TALL.push([a[0], a[2], 4, y + h + 1.2], [(a[0] + b[0]) / 2, (a[2] + b[2]) / 2, 4, y + h + 1.2]);
          const hit = hits[w].has(i);
          if (i % 12 === 5 || hit || i === 0) { tower(a[0], a[2], a[1] - 3, (hit || i === 0 ? 36 : 27) + wr.range(-2, 3)); if (hit && hits[w].get(i) === nodes.length - 1) nodeTower = towers[towers.length - 1]; }
        }
      }
      if (!nodeTower) { nodeTower = towers[0]; for (const t of towers) if (Math.hypot(t.x - X_END, t.z - zBase(X_END)) < Math.hypot(nodeTower.x - X_END, nodeTower.z - zBase(X_END))) nodeTower = t; }
      // the water gate: an inner wall crosses the valley where the gardens begin, and the river goes under its arch. The arch's axis is the
      // route's own line there; its feet stand 22 m to either side (the towers' faces 20.9 m); its crown stands 4 m over the straight line from a place 15 m over
      // the river where it straightens (X_STRAIGHT, the head of the gate's run, 55 to 80 m before the gate) to the dome's finial, and never
      // under 34 m: so the arch frames the whole dome for anyone coming down the river from the straightening on. The rule is made of the
      // dome's height, the river's level and two distances along the river (the gate's run; the straightening to the dome).
      const GX = GATE_X, GZ = laneXZ(GX, ZR).z, span = 22;
      const dG = X_STRAIGHT - GX, dD = Math.hypot(DOME_TOP.x - X_STRAIGHT, DOME_TOP.z - ZR), fromY = WY + 15;
      const crownY = Math.max(34, fromY + (DOME_TOP.y - fromY) * dG / Math.max(dD, 1) + 4), deckY = crownY + 6;
      for (const side of [-1, 1]) {
        await ctx.yield();
        let prev = null, k = 0;
        const zEnd = Math.abs(zAtGate[side < 0 ? 0 : 1] - GZ) + 2;
        for (let z = GZ + side * (span + 10); side * (z - GZ) < zEnd; z += side * 7, k++) {
          const y = hAt(GX, z);
          if (prev) {
            const y0 = Math.min(prev[1], y) - 2.5, h = Math.max(prev[1], y) + 8 - y0, zm = (prev[0] + z) / 2;
            g.set(3, k % 2 ? stone : stoneB).box(GX, y0, zm, 2.6, h, 7.3, 0);
            g.set(3, stone).box(GX, y0 + h, zm - 1.8, 2.8, 1.2, 2.1, 0); g.box(GX, y0 + h, zm + 1.8, 2.8, 1.2, 2.1, 0);
          }
          prev = [z, y];
        }
        const tz = GZ + side * (span + 6.5), ty = hAt(GX, tz) - 3, th = deckY + 4 - ty;
        g.set(3, stoneB).lathe(GX, tz, [[7.6, ty], [6.6, ty + 6], [6.2, ty + th], [7.4, ty + th + 1.5], [7.4, ty + th + 3]], 18);
        g.set(2, white).lathe(GX, tz, [[6.3, ty + th - 8.5], [6.3, ty + th - 5]], 18);
        g.set(3, stone).lathe(GX, tz, [[6.5, ty + 12], [6.9, ty + 12.6], [6.5, ty + 13.2]], 18); g.lathe(GX, tz, [[6.4, ty + th - 10], [6.8, ty + th - 9.4], [6.4, ty + th - 8.8]], 18);
        g.set(1, white).lathe(GX, tz, [[6.35, ty + th - 4.8], [6.6, ty + th - 4.4], [6.3, ty + th - 4]], 18);
        for (let q = 0; q < 12; q++) { const a = q / 12 * TAU; g.set(3, stone).box(GX + Math.cos(a) * 7.1, ty + th + 3, tz + Math.sin(a) * 7.1, 1.6, 1.5, 1.0, -a + Math.PI / 2); }
        g.set(1, white).lathe(GX, tz, [[7.8, ty + th + 3], [5.4, ty + th + 8], [1.8, ty + th + 13], [0.7, ty + th + 14.6], [1.3, ty + th + 16], [0.05, ty + th + 20.5]], 18);
      }
      await ctx.yield();
      const NA = 72;
      for (let k = 0; k < NA; k++) {
        const t0 = (k + 0.5) / NA * 2 - 1, soffit = 6 + (crownY - 6) * Math.sqrt(Math.max(0, 1 - t0 * t0 * 0.92));
        g.set(3, (k >> 2) % 2 ? stone : stoneB).box(GX, soffit, GZ + t0 * span, 5.2, deckY - soffit, span * 2 / NA + 0.05, 0);
      }
      g.set(2, white).box(GX, deckY, GZ, 5.7, 1.6, span * 2 + 12, 0);
      g.set(3, stone).box(GX, deckY + 1.6, GZ, 5.0, 1.0, span * 2 + 12, 0);
      for (let k = -5; k <= 5; k++) g.set(1, white).lathe(GX, GZ + k * span / 5.2, [[0.9, deckY + 2.6], [0.5, deckY + 3.6], [0.95, deckY + 4.7], [0.05, deckY + 6.6]], 8);
      await ctx.yield();
      for (const b of BURN) burnerInto(g, b[0], b[1], b[2]);
      await ctx.yield();
      const walls = new THREE.Mesh(g.build(), makeDomeMaterial(look, { pattern: hero.pattern })); walls.name = 'walls-and-towers';
      scene.add(walls); outdoor.push(walls);
    }
    await ctx.yield();

    // ---------- the fountain of the chasm ----------
    // No fragment comes down farther from the vent than 18 m and no water farther than 30 m in still air: inside the pool's rim (56 m);
    // the way passes some 74 m and more from the vent (the pass's circle is 75 to 82.5 m; the way's curve cuts a metre inside it)
    const fountain = makeRockFountain(look, { rng: RN.fountain, height: FOUNT_H, reach: 18, loud: V.loud, period: V.period, rocks: rare ? 22 : 16, girth: 6, body: 1.9, arc: 1.5, fall: 30, foam: Math.round(3600 * (0.6 + 0.4 * detail)), mist: 170,
      bow: (rare ? 0.55 : 0.35) * (hour === 'night' ? 0.3 : 1), mistOpacity: 0.22, wind: [windDir[0] * 0.6, windDir[1] * 0.6] });
    fountain.object.position.copy(FV); scene.add(fountain.object); outdoor.push(fountain.object);
    await ctx.yield();

    // ---------- creatures of the gardens ----------
    const tU = look.uTime, DUR = 50;
    const fauna = F.makeFauna(scene, { light: F.lightFrom(scene) });
    await ctx.yield();
    // eagles soar over the cleft about a middle 60 m up it from the vent and 29 m over the height that a pant of strength 1 reaches
    // (FOUNT_H over the vent, which stands at 1 m). The kit lets their route rise and sink 13 to 19 m about that middle, sets each
    // bird as much as 22 m over or under the route and lifts it 10 m more on its circle: on 300 visits their band begins 57 to
    // 109 m up and ends 118 to 171 m up, and the column's top at its strongest pant stands 61 to 196 m up: it reaches into their
    // band on 248 of the 300 visits and over it on 9 (at its weakest pant it reaches the band on 8). They soar about the column's
    // upper half and above it, 60 m up the cleft from it.
    fauna.add(F.makeFlock({ rng: RN.eagles, species: 'eagles', count: 3, size: 4.5, center: [FV.x + CH.dx * 60, FOUNT_H + 30, FV.z + CH.dz * 60], radius: 55, soarRadius: 40, soarLift: 10 })); await ctx.yield();
    // swifts hunt three reaches, each flock on a closed course of its own on the clock: off the first loop's crest, over the lawn of the deer,
    // by the tower at the last node. A course of radius r has its middle at least r + 36 m from the way (seen from above); the kit sets its
    // knots as far as 1.3 r out, so a flock's place keeps some 27 m and more from the way. A swift's place about its flock's is the kit's normal
    // draw (4.5 m a sigma on the level, 2.25 m up) and it wanders up to 8 m from there: three sigmas out it is still some 6 m from the way's line.
    // (a middle that lies nearer is moved straight away from the way's nearest place, again and again until it stands clear)
    const clearOf = (x, z, r) => { for (let it = 0; it < 12; it++) { const ln = laneXZ(x, z); if (ln.dist >= r + 36) break; const k = (r + 36.5) / Math.max(ln.dist, 1); x = ln.x + (x - ln.x) * k; z = ln.z + (z - ln.z) * k; } return [x, z]; };
    {
      const c0 = clearOf(course[crestK[0]][0], course[crestK[0]][1] + loops[0].side * 30, 24), c1 = clearOf(inside[1][0], inside[1][1], 24), c2 = clearOf(nodeTower.x, nodeTower.z, 18), nS = Math.max(4, Math.round(8 * lush));
      const sw = { species: 'swifts', count: nS, size: 1.5, spread: [10, 5, 18], wander: [4, 3, 4, 0.7] };
      fauna.add(F.makeFlock({ rng: RN.swifts0, ...sw, center: [c0[0], WY + 14, c0[1]], radius: 24, height: 4 })); await ctx.yield();
      fauna.add(F.makeFlock({ rng: RN.swifts1, ...sw, center: [c1[0], hAt(c1[0], c1[1]) + 12, c1[1]], radius: 24, height: 4 })); await ctx.yield();
      fauna.add(F.makeFlock({ rng: RN.swifts2, ...sw, center: [c2[0], nodeTower.y, c2[1]], radius: 18, height: 3 })); await ctx.yield();
    }
    {
      // the herd on its lawn inside the second loop; deer on the bank where the river straightens; waders in the shallows inside the first
      // crest; egrets half way down the long pool; cranes on their own circuit before the water gate
      const a = inside[1];
      fauna.add(F.makeHerd({ rng: RN.herd, species: V.herd, count: RN.herd.int(7, 11), heightAt: hAt, path, clear: 13, center: [a[0], 0, a[1]], radius: 24, size: 1.55, varieties: 0.3 })); await ctx.yield();
      const b = bankAt(tOfXZ(X_STRAIGHT, ZR) + RN.deer.range(-18, 18) / RLEN, lastSide, 18);
      fauna.add(F.makeHerd({ rng: RN.deer, species: 'deer', count: RN.deer.int(4, 6), heightAt: hAt, path, clear: 13, center: [b[0], 0, b[1]], radius: 20, size: 1.5, varieties: 0.5 })); await ctx.yield();
      const w = bankAt(tOfXZ(course[crestK[0]][0], course[crestK[0]][1]) + RN.waders.range(-18, 18) / RLEN, loops[0].side, -3.5);
      fauna.add(F.makeWaders({ rng: RN.waders, species: V.wader, count: RN.waders.int(5, 8), center: [w[0], 0, w[1]], radius: 9, level: WY, heightAt: hAt, size: 1.5 })); await ctx.yield();
      const w2 = bankAt(tOfXZ(GATE_X - lastReach / 2, ZR), RN.banks.sign(), -5);
      fauna.add(F.makeWaders({ rng: RN.egrets, species: 'egret', count: RN.egrets.int(4, 6), center: [w2[0], 0, w2[1]], radius: 8, level: WY, heightAt: hAt, size: 1.4 })); await ctx.yield();
      // THE CRANES FLY A COURSE OF THEIR OWN ON THE WORLD'S CLOCK at a crane's pace (13 m a second): a closed oval before the water
      // gate, 220 m across the valley and 70 m along it, its middle on the river's line 60 m before the gate (about where the river
      // straightens). Its height is taken every 4 m of the oval: 29 to 39 m over the water, 22 m over the ground, and 6 m over the
      // top of whatever stands within a skein's half breadth (6.5 m) of the oval there (trees, towers, the walls), and 12 m over the
      // way's own height wherever the oval passes within 12 m of the way (seen from above), whichever is highest; then the
      // greatest of these within 12 m either way, evened over 12 m either way (which is never lower). A circuit
      // is about 510 m, 39 s. THREE SKEINS fly the one oval from one dealt start, a third of the circuit apart: whatever the clock
      // says, one skein is on each third of the oval, and the longest wait for a skein at any place of it is a third of a circuit, about 13 s.
      const NC = 128, craneY = new Float32Array(NC), craneXZ = [];
      for (let i = 0; i < NC; i++) { const a = i / NC * TAU, x = GATE_X + 60 + 35 * Math.cos(a), z = ZR + 110 * Math.sin(a) * lastSide; craneXZ.push([x, z]); const ln = laneXZ(x, z); craneY[i] = Math.max(WY + 34 + 5 * Math.sin(a * 2), hAt(x, z) + 22, tallAt(x, z, 6.5) + 6, ln.dist < 12 ? ln.y + 12 : -1e9); }
      await ctx.yield();
      const craneTop = new Float32Array(NC), cranePts = [];
      for (let i = 0; i < NC; i++) { let m = -1e9; for (let k = -3; k <= 3; k++) m = Math.max(m, craneY[(i + k + NC) % NC]); craneTop[i] = m; }
      for (let i = 0; i < NC; i++) { let m = 0; for (let k = -3; k <= 3; k++) m += craneTop[(i + k + NC) % NC] / 7; cranePts.push(new THREE.Vector3(craneXZ[i][0], m, craneXZ[i][1])); }
      const craneN = Math.max(3, Math.round(RN.cranes.int(9, 14) * lush / 3)), craneStart = RN.cranes();
      for (let k = 0; k < 3; k++) { fauna.add(F.makeFlock({ rng: RN.cranes.fork('skein' + k), species: 'flamingos', count: craneN, size: 1.7, body: '#f1eee6', belly: '#ffffff', wingC: '#e6e2da', tip: '#23262c', neckC: '#f4f2ec', legC: '#3a3a3a', beak: '#d8b040',
        route: cranePts, closed: true, speed: 13, start: (craneStart + k / 3) % 1 })); await ctx.yield(); }
    }
    // (butterflies and dragonflies flutter on the clock about places of their own beside the way: a butterfly strays 3.5 m level and
    // 0.8 m up or down from its place at the most, a dragonfly 3.6 m and 0.8 m; their places lie 8 m (6 m) and more to the side of the
    // way and 2 m (4 m) and more under it, so none comes within 4 m (3.5 m) of the line at any moment)
    fauna.add(F.makeButterflies({ rng: RN.butterflies, path, uFrom: M.crest[nLoops - 1] / PL, uTo: U_ROWS, count: Math.round(80 * lush), clear: 8, spread: 30, lift: [-9, -2], size: 2.3 })); await ctx.yield();
    fauna.add(F.makeDragonflies({ rng: RN.dragonflies, path, uFrom: M.node0 / PL, uTo: U_GATE, count: Math.round(22 * lush), clear: 6, spread: 16, lift: [-8, -4], size: 2.2 })); await ctx.yield();

    // ---------- air ----------
    // A10: PETALS AND ICE DUST ARE FIXED FIELDS OF THE WORLD (the kit's particles in a box that stands still). Petals fall where the blossom
    // is: down the river's last straight from 20 m above the straightening to the cliff (the grove, the gate's run, the garden's rows, the
    // pool's banks), 30 m to each side of the river's line and 28 m high, the whole field set 10 m down the wind; one petal to 120 cubic
    // metres. There are none in the chasm or the loops, where no blossom grows. Ice dust hangs in each shaft of the halls (below).
    const PETAL_X = [XC, X_STRAIGHT + 20], petalN = Math.min(4500, Math.round((PETAL_X[1] - PETAL_X[0]) * 60 * 28 / 120));
    const petals = fx.makeParticles({ rng: RN.petals, preset: 'petals', follow: false, velocity: [windDir[0] * 1.6, -0.95, windDir[1] * 1.6], center: [(PETAL_X[0] + PETAL_X[1]) / 2 + windDir[0] * 10, WY + 14, ZR + windDir[1] * 10], box: [PETAL_X[1] - PETAL_X[0], 28, 60], time: tU, count: Math.round(petalN * lush), colors: [V.blossom[0], V.blossom[1], '#fff3d6'], intensity: 0.8 });
    petals.object.name = 'petals'; scene.add(petals.object); outdoor.push(petals.object);
    await ctx.yield();
    // ---------- the caverns of ice: three halls, the river on a ledge to the left, the route going down beside it on the right ----------
    // what belongs to the sunless sea (drawn from where the arch can first be seen; its fine things each from a place of its own), and what of it moves
    const seaGroup = [], seaThings = [], seaParted = [], seaFx = [];
    const hallK = (s) => { let k = 0; for (let i = 0; i < 3; i++) k = Math.max(k, bell(s, i ? FALLS[i - 1].s + 20 : THROAT - 10, FALLS[i].s + 30, 0.35)); return k; };
    const neck = (s) => { let k = 0; for (const f of FALLS) k = Math.max(k, Math.exp(-(((s - (f.s + 34)) / 14) ** 2))); return k; };
    // shafts of sun from cracks under the garden: three in the second hall along the river, the middle one on the frozen cascade; and
    // a first one already in the first hall, on the river two thirds of the way down it, where that hall's roof is cracked
    const S_FROZEN = lerp(FALLS[0].s, FALLS[1].s, 0.45);
    const shaftsAt = [[lerp(FALLS[0].s, FALLS[1].s, 0.22), -24], [S_FROZEN, -31], [lerp(FALLS[0].s, FALLS[1].s, 0.78), -22], [lerp(THROAT, FALLS[0].s, 0.68), -22]];
    const lightK = (s) => { let k = 0; for (const f of FALLS) k = Math.max(k, Math.exp(-(((s - f.s) / 30) ** 2))); for (const q of shaftsAt) k = Math.max(k, Math.exp(-(((s - q[0]) / 22) ** 2))); return k; };
    const lipK = (s) => { let k = 0; for (const f of FALLS) k = Math.max(k, Math.exp(-(((s - f.s) / 14) ** 2))); return k; };      // the ledge's edge wanders, but not at a lip
    const rings = [];
    // the tube begins 1 m inside the cliff's face (the mouth itself is the lining of ice, part of the hero) and ends on the sea cliff's line
    for (let s = 1, last = false; !last; s += 3.2) {
      if (s >= SL + 6) { s = SL + 6; last = true; }                 // the last section stands on the sea cliff's line
      const c = caveAt(s), fl = lowY(s) - 2.3, ends = sst(SL - 6, SL + 12, s);
      let top = upY(s) + 26 + 14 * hallK(s) - 4 * neck(s);
      if (s < 60) top = Math.min(top, lerp(26.5, 30, sst(0, 60, s)));
      top += 14 * ends;
      // round the mouth's lining (22 m deep from the rock's face at each height: with the face's lean and bulges its end lies up to 29.5 m behind the
      // foot line; it reaches 19.2 m to each side and 26.7 m up) the tube stands outside it at every height even where it is narrowest (0.75 of its
      // size): 27 m to each side, 36 m high and centred 1 m above the river (where the lining is widest), as far as 32 m in; its last section,
      // 32 m to each side, lies inside the sea cliff's flat part
      const inL = sst(40, 32, s);
      if (inL > 0) top = Math.max(top, 36 * inL);
      const a = Math.max(19 + 25 * sst(15, 60, s) - 8 * neck(s) - 12 * sst(SL - 40, SL, s), 27 * inL);
      // past the mouth's lining the roof stands over the way: where the way goes (its own height, its own place across the section) the
      // section's roof is the way's height + 11 m (the halls' margin) + three tenths of the section's half height (as much as the ice's
      // bulges bring the roof in) or more. (A neck's roof came down to the way 20 to 30 m past each lip, where the way is still coming down.)
      if (s > 60) { const kW = Math.sqrt(Math.max(0.25, 1 - (routeLat(s) / a) ** 2)); top = Math.max(top, fl + (routeY(s) + 11 - fl) / (0.45 + 0.55 * (kW - 0.3))); }
      const Hh = top - fl, ly = upY(s) - 2.3, lk = lightK(s), cy = lerp(fl + Hh * 0.45, WY + 1, inL);
      rings.push({ p: new THREE.Vector3(c.x, cy, c.z), t: [c.tx, c.tz], a, b: lerp(Hh * 0.55, top - cy, inL), floor: fl, ledge: ly - fl > 0.6 ? { y: ly, edge: ledgeEdge(s), wander: 1.6 * (1 - lipK(s)) } : null,
        river: riverLat(s), rw: s > SL - 25 ? 14.5 : lerp(MOUTH.half + 2, 8, sst(22, 62, s)), sun: -sst(FALLS[0].s - 20, THROAT, s), glow: -0.05 + 0.3 * lk, ao: 0.7 + 0.3 * Math.max(lk, sst(60, 0, s)), s });
    }
    const ringAt = (s) => clamp(Math.round((s - 1) / 3.2), 0, rings.length - 1);
    await ctx.yield();
    // THE SWITCHES OF WHAT IS DRAWN, each worked out here from straight lines of sight followed through the cave's sections (every section taken a third larger
    // than it is, so a line that grazes the ice counts as open; a line is shut where it leaves a section or goes 2 m under its floor). Eyes stand
    // on the route every 2 m.
    const ringFwd = (x, z, j) => { while (j < rings.length - 1) { const a = rings[j].p, b = rings[j + 1].p; if ((x - b.x) ** 2 + (z - b.z) ** 2 < (x - a.x) ** 2 + (z - a.z) ** 2) j++; else break; } return j; };
    const ringBack = (x, z, j) => { while (j > 0) { const a = rings[j].p, b = rings[j - 1].p; if ((x - b.x) ** 2 + (z - b.z) ** 2 < (x - a.x) ** 2 + (z - a.z) ** 2) j--; else break; } return j; };
    const inRing = (r, x, y, z) => { const lat = (x - r.p.x) * -r.t[1] + (z - r.p.z) * r.t[0]; return (lat / (r.a * 1.35)) ** 2 + ((y - r.p.y) / (r.b * 1.35)) ** 2 <= 1 && y >= r.floor - 2; };
    // the mouth's opening: 54 points over it (9 across, 6 up); the arch's opening in the sea cliff: 35 points (7 across, 5 up)
    const mouthPts = [], archPts = [];
    for (const fx_ of [-0.92, -0.69, -0.46, -0.23, 0, 0.23, 0.46, 0.69, 0.92]) for (const k of [0.06, 0.24, 0.42, 0.6, 0.78, 0.95]) mouthPts.push([Math.max(MOUTH.y0 + (MOUTH.top - MOUTH.y0) * k, WY + 0.3), ZR + fx_ * MOUTH.half * Math.sqrt(1 - k * k)]);
    for (const fz of [-0.9, -0.6, -0.3, 0, 0.3, 0.6, 0.9]) for (const fy of [-0.8, -0.4, 0, 0.4, 0.8]) archPts.push([ARCH_X - 6, upY(SL) + 9 + 13 * fy * Math.sqrt(1 - fz * fz * 0.8), AZ + 20 * fz]);
    // 0. (worked out first, the next test begins from it) Where the cave's front is first seen: the first place on the route from which a straight line to one of nine points of the
    // mouth clears the land (its height taken every 12 m along the line; walls and trees are not counted, so the switch comes early rather
    // than late). Places are tried every 8 m of the way; from 16 m before the first that sees, the cave's front is on.
    {
      let onI = Math.ceil(M.mouth / LS);
      const nine = [0, 4, 8].flatMap((c) => [1, 3, 5].map((r) => mouthPts[c * 6 + r]));
      const overLand = (i) => {
        for (const [hy, hz] of nine) {
          const dx = XC + 2 - lnx[i], dy = hy - lny[i], dz = hz - lnz[i], l = Math.hypot(dx, dz); let ok = true;
          for (let t = 12; t < l - 6 && ok; t += 12) { const k = t / l; if (hAt(lnx[i] + dx * k, lnz[i] + dz * k) > lny[i] + dy * k) ok = false; }
          if (ok) return true;
        }
        return false;
      };
      for (let i = 0; i < onI; i += 4) {
        if (i % 80 === 76) await ctx.yield();
        if (overLand(i)) { onI = i - 8; break; }
      }
      M.frontOn = Math.max(0, onI * LS);
    }
    await ctx.yield();
    // 1. How deep one can see in through the mouth from any place on the way before the pool's head: the front tube runs that far in (and three
    // sections more) and is on with the cave's front; the deep tube begins there. (What each thing inside is drawn from is said below.)
    // Eyes from the place where the cave's front comes on (before it the land hides the mouth). Farther than 300 m from the cliff the mouth's
    // 35 m are under 6.7 degrees wide and the lines through it nearly parallel: there eyes stand every 6 m and every third point is tried (18 of
    // the 54); within 300 m eyes stand every 2 m and all 54 points are tried. The front tube runs three sections past the deepest seen: the margin.
    let seen = 0;
    // (firstEye: for every section, the first of these eyes, by its number on the route, from which a line reaches it; -1 where none does)
    const firstEye = new Int32Array(rings.length).fill(-1);
    const deepFrom = (i) => {
      if (firstEye[0] < 0) firstEye[0] = i;
      for (let pi = 0; pi < mouthPts.length; pi++) {
        if (lnx[i] - XC > 300 && pi % 3 !== 1) continue;
        const hy = mouthPts[pi][0], hz = mouthPts[pi][1];
        const dx = XC - lnx[i], dy = hy - lny[i], dz = hz - lnz[i], l = Math.hypot(dx, dy, dz); let j = 0;
        for (let t = 4; t < 480; t += 4) { const x = XC + dx / l * t, y = hy + dy / l * t, z = hz + dz / l * t; j = ringFwd(x, z, j); if (!inRing(rings[j], x, y, z)) break; if (j > seen) { firstEye.fill(i, seen + 1, j + 1); seen = j; } }
      }
    };
    for (let i = Math.floor(M.frontOn / LS); i * LS < M.poolHead; i++) {
      if (i % 20 === 19) await ctx.yield();
      if (lnx[i] - XC > 300 && i % 3) continue;
      deepFrom(i);
    }
    const split = Math.min(rings.length - 2, seen + 3), S_SPLIT = rings[split].s;
    // a line through the mouth that reaches the last arch: then the sea is on from the start (the caverns bend 15 degrees and more and fall
    // 60 m and more, so such a line is not looked for: the rule stands for a cavern that had neither)
    const seaAlways = seen >= rings.length - 4;
    await ctx.yield();
    // EVERY THING OF THE CAVERNS IS DRAWN FROM A PLACE OF ITS OWN, found by these same lines and not by its kind. The eyes go on
    // to 16 m past the pool's head. A thing whose nearest part stands in section j (the last section at or before its least place
    // along the caverns) counts as reached by a line that reaches section j - 2 (two sections, 6.4 m, nearer: the margin in depth);
    // it is drawn from 16 m of the way before the first eye that reaches it, never before the cave's front is and never after the
    // pool's head; a thing no line reaches from any eye as far as 16 m past the pool's head is drawn from the pool's head. So what
    // the mouth shows from outside is on with the cave's front, and only what no line reaches waits.
    for (let i = Math.ceil(M.poolHead / LS); i * LS <= M.poolHead + 16; i++) deepFrom(i);
    const secOf = (s) => { const j = ringAt(s); return j > 0 && rings[j].s > s ? j - 1 : j; };
    const drawnFrom = (s) => { const k = Math.max(0, secOf(s) - 2); return firstEye[k] < 0 ? M.poolHead : Math.min(M.poolHead, Math.max(M.frontOn, firstEye[k] * LS - 16)); };
    // 2. Where the gardens can no longer be seen looking back: the last place on the route inside the caverns from which a straight line to one of
    // the mouth's points is open. From 8 m past it the gardens are off.
    {
      let hidI = Math.ceil(M.mouth / LS), j0 = rings.length - 1;
      const backOpen = (i) => {
        for (const [hy, hz] of mouthPts) {
          const dx = XC - lnx[i], dy = hy - lny[i], dz = hz - lnz[i], l = Math.hypot(dx, dy, dz); let ok = true, j = j0;
          for (let t = 4; t < l - 2 && ok; t += 4) { const x = lnx[i] + dx / l * t, y = lny[i] + dy / l * t, z = lnz[i] + dz / l * t; j = ringBack(x, z, j); if (!inRing(rings[j], x, y, z)) ok = false; }
          if (ok) return true;
        }
        return false;
      };
      for (let i = Math.ceil(M.arch / LS); i > hidI; i--) {
        if (i % 12 === 0) await ctx.yield();
        j0 = ringBack(lnx[i], lnz[i], j0);
        if (backOpen(i)) { hidI = i + 4; break; }
      }
      M.hid = hidI * LS;
    }
    await ctx.yield();
    // 3. Where the sea can first be seen (it is seen through the arch only): the first place on the route, from the pool's head on, from which a
    // straight line to one of the arch's points is open. Places are tried every 8 m of the way; from 16 m before the first that sees, the sea is on.
    {
      let onI = Math.ceil(M.arch / LS), j0 = 0;
      const SEE_STEP = Math.max(1, Math.round(8 / LS));
      const seaOpen = (i) => {
        for (const [ax, ay, az] of archPts) {
          const dx = ax - lnx[i], dy = ay - lny[i], dz = az - lnz[i], l = Math.hypot(dx, dy, dz); let ok = true, j = j0;
          // outside the mouth the line is followed from the cliff's line on (the cliff shuts everything but the mouth's opening)
          for (let t = Math.max(4, lnx[i] > XC ? (lnx[i] - XC) / Math.max(-dx / l, 1e-3) : 0); t < l - 2 && ok; t += 4) { const x = lnx[i] + dx / l * t, y = lny[i] + dy / l * t, z = lnz[i] + dz / l * t; j = ringFwd(x, z, j); if (!inRing(rings[j], x, y, z)) ok = false; }
          if (ok) return true;
        }
        return false;
      };
      for (let i = Math.floor(M.poolHead / LS), n = 0; i < onI; i += SEE_STEP, n++) {
        if (n % 6 === 5) await ctx.yield();
        j0 = ringFwd(lnx[i], lnz[i], j0);
        if (seaOpen(i)) { onI = i - 2 * SEE_STEP; break; }
      }
      M.seaOn = seaAlways ? 0 : Math.max(0, onI * LS);
    }
    await ctx.yield();
    // EACH FINE THING OF THE SEA (its pillars, its hanging ice, its shore, the foam at the feet) IS DRAWN FROM A PLACE OF ITS
    // OWN: the sea's own test, asked for lines to the thing's own boxes. A thing's boxes are given where it is made (boxesOf: its
    // points gathered in cells of 24 m by 24 m in plan, each cell's box from its lowest point to its highest; or a box to each
    // piece). From an eye, the lines to a box cross the plane of the arch within the rectangle its eight corners give there; the box
    // is reached if a line from the eye to one of 63 points of the arch's opening (9 across, 7 up, the rim among them: the opening
    // taken as wide as the sheet's hole, which the rim of ice makes 1.5 m narrower) that lies in that rectangle, taken half the
    // points' spacing larger, is open through the caverns' sections. The eyes are the sea's (every 8 m, from the first that sees
    // the sea); the thing is drawn from 16 m before the first eye that reaches one of its boxes, never before the sea is, and from
    // 16 m before the arch if none does. Nothing in the sea's hall is taken to hide anything: a thing comes on early rather than late.
    const archGrid = [], gridOpen = new Map();
    for (let a = -4; a <= 4; a++) for (let b = -3; b <= 3; b++) archGrid.push([upY(SL) + 9 + 13 * b / 3 * Math.sqrt(1 - a * a / 16 * 0.8), AZ + 5 * a]);
    const boxesOf = (pts) => {
      const cells = new Map();
      for (let k = 0, n = pts.length / 3; k < n; k++) {
        const x = pts[3 * k], y = pts[3 * k + 1], z = pts[3 * k + 2], key = Math.floor(x / 24) * 8192 + Math.floor(z / 24), b = cells.get(key);
        if (!b) cells.set(key, [x, x, y, y, z, z]);
        else { if (x < b[0]) b[0] = x; else if (x > b[1]) b[1] = x; if (y < b[2]) b[2] = y; else if (y > b[3]) b[3] = y; if (z < b[4]) b[4] = z; else if (z > b[5]) b[5] = z; }
      }
      return [...cells.values()];
    };
    const seaFrom = (boxes) => {
      if (seaAlways) return 0;
      const SEE = Math.max(1, Math.round(8 / LS)), iEnd = Math.ceil(M.arch / LS), PX = ARCH_X - 6;
      for (let i = Math.round(M.seaOn / LS) + 2 * SEE, j0 = 0; i < iEnd; i += SEE) {
        const ex = lnx[i], ey = lny[i], ez = lnz[i]; j0 = ringFwd(ex, ez, j0);
        let open = gridOpen.get(i); if (!open) gridOpen.set(i, open = new Uint8Array(archGrid.length));        // (0 not yet asked, 1 open, 2 shut)
        for (const b of boxes) {
          if (b[0] >= PX - 1) continue;                                                 // (on the caverns' side of the arch's plane: behind the cliff)
          let y0 = 1e9, y1 = -1e9, z0 = 1e9, z1 = -1e9;
          for (let c = 0; c < 8; c++) {
            const t = (PX - ex) / (Math.min(b[c & 1], PX - 1) - ex), y = ey + (b[2 + (c >> 1 & 1)] - ey) * t, z = ez + (b[4 + (c >> 2)] - ez) * t;
            if (y < y0) y0 = y; if (y > y1) y1 = y; if (z < z0) z0 = z; if (z > z1) z1 = z;
          }
          if (z1 < AZ - 22.5 || z0 > AZ + 22.5) continue;
          for (let k = 0; k < archGrid.length; k++) {
            const gy = archGrid[k][0], gz = archGrid[k][1];
            if (gy < y0 - 2.2 || gy > y1 + 2.2 || gz < z0 - 2.5 || gz > z1 + 2.5) continue;
            if (!open[k]) {
              const dx = PX - ex, dy = gy - ey, dz = gz - ez, l = Math.hypot(dx, dy, dz); let ok = true, j = j0;
              for (let t = Math.max(4, ex > XC ? (ex - XC) / Math.max(-dx / l, 1e-3) : 0); t < l - 2 && ok; t += 4) { const x = ex + dx / l * t, y = ey + dy / l * t, z = ez + dz / l * t; j = ringFwd(x, z, j); if (!inRing(rings[j], x, y, z)) ok = false; }
              open[k] = ok ? 1 : 2;
            }
            if (open[k] === 1) return Math.max(M.seaOn, (i - 2 * SEE) * LS);
          }
        }
      }
      return Math.max(M.seaOn, (iEnd - 2 * SEE) * LS);
    };
    // A MESH OF MANY THINGS (the sea's standing ice) draws each thing from the thing's own place: its triangles are put in
    // the order of those places (q.at; q.end: where each thing's triangles end) and the mesh draws them as far as the last thing
    // whose place the way has reached.
    const seaShown = (q, m) => { let k = q.k; const at = q.at, n = at.length; while (k < n && at[k] <= m) k++; while (k > 0 && at[k - 1] > m) k--; q.k = k; q.geo.setDrawRange(0, k ? q.end[k - 1] : 0); };
    // daylight reaches from the mouth to 20 m before the first fall (negative: the day behind us, on faces turned to the mouth); each shaft lights the spot it lands on, its own radius + 2 m
    const spots = shaftsAt.map((q, i) => { const c = caveAt(q[0], q[1]); return [c.x + 3, c.z, 10 + 1.5 * (i % 3)]; });
    // no part of the caverns stands in front of the cliff, above the land over it or in the balcony's corbels (their undersides stand 3.0 m under the
    // cliff's top and they ring the balcony as far as 66 m behind the edge): within 70 m of the cliff's line every point of the tube and of its floor
    // is held 2 m behind the rock's face at its own height, 4 m under the cliff's top at its own place across and 3.55 m under the corbels
    const holdTube = (v) => { if (v[0] < XC - 70) return; const xh = -(v[2] - ZR); v[1] = Math.min(v[1], S.topAt(xh) - 4, S.H0 - 6.55); v[0] = Math.min(v[0], XC + S.faceZ(xh, v[1]) - 2); };
    // the halls' colours change at the falls, 4 m past the first and the second lip's middle, over 16 m
    const cave = await makeIceCave(N, look, rings, { segments: 60, split, spots, hold: holdTube, yield: ctx.yield, haze: [fogCave.r, fogCave.g, fogCave.b, 0.0012], halls: { x1: caveAt(FALLS[0].s + 4).x, x2: caveAt(FALLS[1].s + 4).x, blend: 8, phos: '#7ff0d0' } });
    // WHAT IS DRAWN OF THE CAVERNS: the front tube (as far as three sections past the deepest a line reaches before the pool's head)
    // from M.frontOn; every other thing, the deep tube among them, from the place its own sight test gives (drawnFrom, above), asked
    // for the thing's least place along the caverns. COUNTED on 300 visits (8,724 things in all, a mesh a thing): the front
    // comes on 774 to 1,156 m of the way before the mouth (long before the straightening, from where the mouth lies 289 to 358 m
    // straight ahead); 7,038 things come on with it: the mouth shows them from the first (on every visit the cave river's first
    // two reaches, the first hall's fall, the front lips and their icicles, the columns, the front's ice, the frozen fall and its
    // fringes; a shaft and its dust 1,168 times in 1,200; the second fall and the river's third reach on 271 visits, the third
    // hall's pool on 260); 1,324
    // come on later, 138 to 1,041 m before the mouth (a reach of the river and a fall 321 times each, the deep ice on 289 visits,
    // a shaft 32 times, the pool on 40 visits); 70 within 16 m before the pool's head and 292 at it (the deep tube: at the pool's
    // head on 266 visits, 2 to 16 m before it on 34).
    const caveFront = [], caveThings = [];
    const drawn = (o, s) => { caveThings.push([o, drawnFrom(s), s]); return o; };
    scene.add(drawn(cave.mesh, S_SPLIT)); if (cave.front) { scene.add(cave.front); caveFront.push(cave.front); }
    // ROOM FOR THE TRIANGLES: A FAR SHAPE FOR A FAR PIECE OF ICE. Every piece of ice that is one of many (the caverns' icicles and
    // teeth, the lips' icicles, the frozen fall's fringes, the sea's hanging ice) has two shapes: the near one (84 triangles; the
    // sea's 60) and a far one of 7 (the sea's 5: icicleFarGeometry, in the parts file, a cone of the near shape's own sides, axis
    // and taper, shaded to the near shape's mean), in the same place, at the same size, of the same ice. The pieces of a mesh
    // are put in the order of the places at which they change; the near mesh draws the first k of them and the far mesh (the same
    // pieces in the reverse order) the rest. Both meshes are drawn from the same place of the way: the thing's own sight test.
    // THE SEA'S HANGING ICE CHANGES UNSEEN: each piece at the place from which its own box is first reached through the arch (the
    // sea's own test, a box to each piece: 16 m before the first eye that reaches it, 16 m before the arch if none does).
    // THE CAVERNS' PIECES CHANGE BY DISTANCE (the mouth shows the front's pieces from far up the valley, in the gardens' densest
    // frames, and all of those in their near shape do not fit there): a piece is drawn in its far shape until the way first
    // comes within K times its own scale of its root (the scale: what its matrix makes of the shape's unit breadth; the shape is
    // 0.19 of it broad at the root, so a piece of scale 25 is 4.7 m broad), K = 38 for the caverns' icicles and teeth (more does
    // not fit the gardens' densest frame), 62 for the lips' icicles and the fringes. By the two shapes' own formulas no point of
    // either lies farther from the other than 0.0196 of the scale (0.0199 for a piece 1.66 scales long). In a picture 1080 high
    // (899 pixels to the radian at its middle; off the middle by an angle, larger by 1 over its cosine squared at the most) that
    // is at 38 scales 0.46 of a pixel in the middle, 0.75 at 38 degrees off it and 1.16 in the very corner (51 degrees); at 62
    // scales 0.28 and 0.71. COUNTED AT THE CHANGE (36 visits; a piece counts if both its meshes are drawn then, it lies in the
    // picture and a line from the lens reaches its root, middle or point): of 38,207 pieces 824 change in sight, none of them the
    // sea's; the edge (the greatest distance between the two surfaces, as the picture has them) moves 0.71 of a pixel at the
    // most; the piece's mean brightness (the ice's own shader worked at both shapes, the haze in it) changes 1.0 in a hundred
    // on the mean and 5.9 at the most, more than 4 on 11 pieces: the near shape is lobed and bulged, and from some sides the
    // cone turns more of itself edge-on than it does (the parts file). COUNTED (the triangles of every mesh in the lens, every
    // 0.1 s of the flight): with every piece in its near shape a thick visit had 503,779 in the gardens, 380 m along; as built,
    // on 300 visits, the most is 478,414 (in the gardens, 391 m along; about the mouth 463,043 at the most; past it under 251,000), over
    // 450,000 on 46 visits, and 144 draw calls at the most (the pool's bed and the strand counted, one call each).
    const icePieces = [], FAR_ICE = icicleFarGeometry(0), K_CAVE = 38, K_ICE = 62, K_SEA = 56;
    const iceShapes = (q, m) => { let k = q.k; const at = q.at, n = at.length; while (k < n && at[k] <= m) k++; while (k > 0 && at[k - 1] > m) k--; q.k = k; q.near.count = k; q.far.count = n - k; };
    const withFar = (near, farGeo, K, own) => {
      const n = near.count, a = near.instanceMatrix.array, at = new Float64Array(n), order = [];
      for (let k = 0; k < n; k++) {
        if (own) { at[k] = own[k]; order.push(k); continue; }                 // (the piece's own place, given where it is made)
        const o = k * 16, x = a[o + 12], y = a[o + 13], z = a[o + 14], d = K * Math.hypot(a[o], a[o + 1], a[o + 2]), d2 = d * d, c2 = (d + 8) * (d + 8); let i = 0, hit = -1;
        // (eyes every 8 m first, with 8 m more of reach: one within the reach is then looked for among the eyes before and after it)
        for (; i <= NL && hit < 0; i += 4) {
          if ((lnx[i] - x) ** 2 + (lny[i] - y) ** 2 + (lnz[i] - z) ** 2 > c2) continue;
          for (let e = Math.max(0, i - 3); e <= Math.min(NL, i + 3) && hit < 0; e++) if ((lnx[e] - x) ** 2 + (lny[e] - y) ** 2 + (lnz[e] - z) ** 2 <= d2) hit = e;
        }
        at[k] = hit < 0 ? Infinity : hit * LS; order.push(k);
      }
      order.sort((p, q) => at[p] - at[q] || p - q);
      const far = new THREE.InstancedMesh(farGeo, near.material, Math.max(1, n)), b = far.instanceMatrix.array, rows = a.slice(0, n * 16);
      order.forEach((k, j) => { const row = rows.subarray(k * 16, k * 16 + 16); a.set(row, j * 16); b.set(row, (n - 1 - j) * 16); });
      near.instanceMatrix.needsUpdate = true; far.instanceMatrix.needsUpdate = true; far.frustumCulled = false; far.name = near.name + '-far';
      const q = { near, far, at: Float64Array.from(order, (k) => at[k]), k: 0 }; icePieces.push(q); iceShapes(q, 0);
      return far;
    };
    await ctx.yield();
    // the river inside: four reaches (each ends in the basin at its lip, the next begins in the pool under the fall). The first begins 28 m outside the
    // cliff, 8 cm under the outdoor river (which ends outside the mouth's lip), 50 m wide there (its banks under the pool's unfaded water), and rises to its
    // own level by the cliff's line; it fills the mouth's lining from wall to wall (37 m) as far as the lining goes (22 m in) and narrows to its 16 m over the next 40 m
    const caveLight = { preset: 'night', sunDir: [0.2, 0.92, 0.3], sunColor: '#cfefff', sunIntensity: 1.6, zenith: '#2a86c8', mid: '#3aa0d8', horizon: '#8fe0f6', scatterColor: '#9fe6ff', scatter: 0.3, glint: 0.5, ambient: '#3a8cc0', fogColor: fogCave, clouds: false };
    const caveWater = [];
    for (let i = 0; i < 4; i++) {
      await ctx.yield();
      const s0 = i ? FALLS[i - 1].s - 4 : -28, s1 = i < 3 ? FALLS[i].s - 6 : SL + 3, y = (i ? upY(FALLS[i - 1].s + 13) : WY) + 0.22, p = [];
      for (let k = 0, n = Math.max(6, Math.round((s1 - s0) / 7)); k <= n; k++) { const s = lerp(s0, s1, k / n), c = s < -8 ? { x: XC - s, z: ZR } : caveAt(s, riverLat(s)); p.push([c.x, y - 0.012 * Math.max(0, s - (i ? s0 : -3)) - (i ? 0 : 0.3 * sst(0, -8, s)), c.z]); }
      const w = Water.makeRiver({ rng: RN['cave-river' + i], light: caveLight, points: p, across: 8, speed: 5.2, foam: i > 1 ? 0.6 : 0.9, bankFoam: 1, deep: i > 1 ? '#04201c' : '#073a5e', shallow: i > 1 ? '#2a8a74' : '#49b4d6', opacity: i > 1 ? 0.88 : 0.82,
        width: i === 0 ? (t) => { const s = lerp(s0, s1, t); return s < 6 ? lerp(50, 2 * MOUTH.half + 2, sst(-2, 6, s)) : lerp(2 * MOUTH.half + 2, 16, sst(22, 62, s)); } : i === 3 ? (t) => lerp(16, 30, sst(0.7, 1, t)) : 16 });
      w.object.name = 'cave-river'; scene.add(w.object); caveWater.push(w); drawn(w.object, s0);
    }
    // THE BED UNDER THE WATER AT THE CLIFF'S FOOT. The land's mesh ends where the kit's squares end (land.bounds.minX: the
    // kit fits whole squares of 96 m into the bounds it is given), a wall hanging 30 m down from its edge: on 300 visits from
    // 29 m behind the cliff's line to 19 m before it (behind it on 183). The caverns' floor begins 1 to 4.5 m behind that line
    // (2 m behind the rock's face); its channel lies 3.9 m under the water in the middle and comes up through the water 19 m to
    // each side. Where the land ends before the cliff, the river's and the cave river's water lay over nothing between the two,
    // across the mouth and along the cliff's foot; and on every visit a line could go down through the water, under the floor's
    // first row at the channel's sides, over the land's bed or past its edge, and on under the caverns. The bed is one plain
    // face of the river bed's own colour, lit and hazed as the land is (the kit's rock, as the bank's stones), under the whole
    // breadth of the pool (and 4 m more to each side). From 7.5 m under the land's last squares, where it lies 4.5 m under the
    // water, it comes up to 3.8 m under it at the land's edge (or 6 m before the cliff's line, where the land reaches nearer
    // than that) and lies so to the cliff's foot: 0.3 to 0.8 m under the land's own bed (3.0 to 3.5 m under the water in the
    // pool), so that where the land lies over it the land's bed is the one seen. IN THE
    // MOUTH it ends on the caverns' floor itself: its edge there is the first row of the floor's own points (read from the
    // caverns' mesh: every one that lies under the water, and the two places where that row comes up to 5 cm under the water's
    // level), so the channel's bed runs on into the cave with no step and no line passes between the two. TO EACH SIDE OF THAT
    // it goes on under the rock to 3.4 m behind the cliff's line and stands up there as a wall to 5 cm under the water (4 m
    // behind the line, inside the rock at every height of the face, where nothing is seen), and its two ends are turned up as
    // high: a line that goes down through the water there meets the bed, the land or the caverns' floor and nothing else.
    // BESIDE ITS TWO ENDS, where the land's mesh ends before the cliff, the bed does not go on: there the strand (below)
    // carries the land itself on to the rock, and its shelf lies over the bed's last 22 m and over its turned-up ends, so
    // that no end of the bed is seen and no foot of the cliff stands over nothing.
    // It is drawn with the cave's front. COUNTED: 55 triangles on every visit; lines down through the water about the mouth in
    // every direction (15 visits, the land's edge from 26 m behind the line to 15 m before it): none passes. AND WITH THE
    // STRAND, by lines from the flown lens over the last 340 m before the mouth (every 4 m of the way a line through every
    // twelfth pixel each way of a picture 1920 by 1080; only what is opaque and drawn shuts a line, and a one-sided face only
    // from its front), on the 66 visits of 300 on which the land ends 8 m or more before the cliff (8 to 18.9 m): of 74
    // million lines none meets an end of the bed, none the cliff's face under the water's level beside the pool, and none goes
    // down past the cliff's foot having met nothing. (Within the pool's breadth the cliff stands in the pool's own water, the
    // bed under it.)
    let poolBed;
    {
      const HW = poolHalf(0) + 4, xE = Math.max(land.bounds.minX, XC + 6), top = WY - 0.05, yD = WY - 3.8, P = [], I = [];
      const pt = (x, y, z) => P.push(x, y, z) / 3 - 1;
      // the first row of the caverns' floor, its own points, in order across the mouth
      const cp = cave.geometry.getAttribute('position'), f0 = rings.length * (cave.segments + 1), nf = Math.round((cp.count - f0) / rings.length), F = [];
      for (let k = 0; k < nf; k++) F.push([cp.getX(f0 + k), cp.getY(f0 + k), cp.getZ(f0 + k)]);
      if (F[0][2] > F[nf - 1][2]) F.reverse();
      let lo = 0; for (let k = 1; k < nf; k++) if (F[k][1] < F[lo][1]) lo = k;
      let k0 = lo, k1 = lo; while (k0 > 0 && F[k0 - 1][1] < top) k0--; while (k1 < nf - 1 && F[k1 + 1][1] < top) k1++;
      const cut = (a, b) => { const t = (top - a[1]) / (b[1] - a[1]); return [a[0] + (b[0] - a[0]) * t, top, a[2] + (b[2] - a[2]) * t]; };      // (where the row comes up through the level)
      const sill = F[lo][1] < top ? [k0 > 0 ? cut(F[k0], F[k0 - 1]) : [F[0][0], top, F[0][2]], ...F.slice(k0, k1 + 1), k1 < nf - 1 ? cut(F[k1], F[k1 + 1]) : [F[nf - 1][0], top, F[nf - 1][2]]] : [[F[lo][0], top, F[lo][2]]];
      const zl = sill[0][2], zr = sill[sill.length - 1][2], zL = [ZR - HW, ZR - HW + 4, Math.max(zl - 1.5, ZR - HW + 5)], zR = [Math.min(zr + 1.5, ZR + HW - 5), ZR + HW - 4, ZR + HW];
      const row = (x, y, zs) => zs.map((z) => pt(x, Math.abs(z - ZR) > HW - 1 ? top : y, z));
      const rC = row(xE + 7.5, WY - 4.5, [zL[0], zL[1], zR[1], zR[2]]), rB = row(xE, yD, [zL[0], zL[1], zR[1], zR[2]]), rM = row(XC + 3.5, yD, [...zL, zl, (zl + zr) / 2, zr, ...zR]);
      const sI = sill.map((q) => pt(q[0], q[1], q[2])), w1L = row(XC - 3.4, yD, zL), w1R = row(XC - 3.4, yD, zR), rW = [...w1L, ...sI, ...w1R];
      const tri = (i, j, k) => {                                               // (every face is turned up, or, where it stands, toward the gardens)
        if (i === j || j === k || i === k) return;
        const ux = P[j * 3] - P[i * 3], uy = P[j * 3 + 1] - P[i * 3 + 1], uz = P[j * 3 + 2] - P[i * 3 + 2], vx = P[k * 3] - P[i * 3], vy = P[k * 3 + 1] - P[i * 3 + 1], vz = P[k * 3 + 2] - P[i * 3 + 2], ny = uz * vx - ux * vz;
        if (ny < 0 || (ny === 0 && uy * vz - uz * vy < 0)) I.push(i, k, j); else I.push(i, j, k);
      };
      // (the band between two rows of points, each in order across the mouth)
      const band = (A, B) => { let a = 0, b = 0; while (a < A.length - 1 || b < B.length - 1) { if (b === B.length - 1 || (a < A.length - 1 && P[A[a + 1] * 3 + 2] <= P[B[b + 1] * 3 + 2])) { tri(A[a], A[a + 1], B[b]); a++; } else { tri(A[a], B[b + 1], B[b]); b++; } } };
      band(rC, rB); band(rB, rM); band(rM, rW);
      band([...w1L, sI[0]], [...row(XC - 4, top, zL), sI[0]]); band([sI[sI.length - 1], ...w1R], [sI[sI.length - 1], ...row(XC - 4, top, zR)]);
      const K = []; for (let k = 0; k < P.length; k += 3) K.push(cBed.r, cBed.g, cBed.b);
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(K, 3)); g.setIndex(I); g.computeVertexNormals();
      poolBed = new THREE.Mesh(g, T.makeRockMaterial({ rng: RN['stone-skin'], detailTexture: land.detailTexture, waterLevel: WY, wet: 0.5 })); poolBed.name = 'pool-bed'; scene.add(poolBed);
    }
    // THE STRAND AT THE CLIFF'S FOOT, TO EACH SIDE OF THE BED. Where the land's mesh ends before the cliff, its edge stands in the
    // open beside the pool too, as far out to each side as the cliff's face stands behind it; between that edge and the rock
    // there was no ground. The strand is the land carried on to the rock there: its outer row is the land's own edge points
    // (their places, normals, colours and shade, read from the land's mesh), from the first of them that lies 18 m inside the
    // pool's breadth (where the land's own bed is still at its depth, 0.8 m over the bed below: the strand's shelf comes up
    // over the bed's last 22 m and its turned-up end) outward to the first that lies inside the rock; from
    // each, six steps toward the cliff to 1.4 m behind the rock's face (where the land's own height, asked of the land as its
    // own squares ask it, still stands, 0.1 m before it falls away inside the rock), and from there a wall down inside the
    // rock, as the land's own squares have where they reach the cliff. Its colour is the ground's own (groundColor), its shade
    // its edge point's, its material the land's, and it is drawn whenever the land is. No part where the land reaches the rock.
    // (14 triangles for each step along the land's edge, one mesh, one call.)
    {
      const lp = land.geometry.getAttribute('position'), lnr = land.geometry.getAttribute('normal'), lcl = land.geometry.getAttribute('color'), lsh = land.geometry.getAttribute('aShade'), xe = land.bounds.minX;
      const at = new Map();                                              // (of the points at one place of the edge, the ground's own: the highest, and of those the one whose normal stands up most)
      for (let i = 0; i < lp.count; i++) if (Math.abs(lp.getX(i) - xe) < 1e-3) { const k = Math.round(lp.getZ(i) * 16), q = at.get(k); if (q === undefined || lp.getY(i) > lp.getY(q) || (lp.getY(i) === lp.getY(q) && lnr.getY(i) > lnr.getY(q))) at.set(k, i); }
      const E = [...at.values()].sort((a, b) => lp.getZ(a) - lp.getZ(b)), R = 6, P = [], NR = [], K = [], SH = [], I = [], tc = new THREE.Color();
      for (const sg of [-1, 1]) {
        const cols = [];
        for (const i of sg < 0 ? [...E].reverse() : E) { if (sg * (lp.getZ(i) - ZR) < poolHalf(0) - 18) continue; cols.push(i); if (lp.getY(i) <= -8.5) break; }
        if (cols.length < 2 || lp.getY(cols[0]) <= -8.5) continue;
        const v0 = P.length / 3;
        for (const i of cols) {
          const z = lp.getZ(i), xin = Math.min(xe - 1, XC + S.faceZ(-(z - ZR), 6) - 1.4);
          for (let k = 0; k <= R + 1; k++) {
            const x = k > R ? xin - 0.3 : xe + (xin - xe) * k / R, y = k === 0 ? lp.getY(i) : k > R ? -9 : hAt(x, z);
            P.push(x, y, z); SH.push(lsh.getX(i), lsh.getY(i));
            if (k === 0) { NR.push(lnr.getX(i), lnr.getY(i), lnr.getZ(i)); K.push(lcl.getX(i), lcl.getY(i), lcl.getZ(i)); } else { NR.push(0, 1, 0); K.push(0, 0, 0); }
          }
        }
        for (let c = 0; c + 1 < cols.length; c++) for (let k = 0; k <= R; k++) {
          const a = v0 + c * (R + 2) + k, b = a + R + 2;
          if (sg < 0) I.push(a, b, a + 1, a + 1, b, b + 1); else I.push(a, a + 1, b, a + 1, b + 1, b);                  // (every face turned up)
        }
      }
      if (I.length) {
        const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setIndex(I); g.computeVertexNormals();
        const gn = g.getAttribute('normal');
        for (let v = 0; v < P.length / 3; v++) {                             // (the edge's points keep the land's own normals and colours)
          if (v % (R + 2) === 0) { gn.setXYZ(v, NR[v * 3], NR[v * 3 + 1], NR[v * 3 + 2]); continue; }
          groundColor(P[v * 3], P[v * 3 + 2], P[v * 3 + 1], gn.getY(v), tc); K[v * 3] = tc.r; K[v * 3 + 1] = tc.g; K[v * 3 + 2] = tc.b;
        }
        g.setAttribute('color', new THREE.Float32BufferAttribute(K, 3)); g.setAttribute('aShade', new THREE.Float32BufferAttribute(SH, 2));
        const strand = new THREE.Mesh(g, land.object.material); strand.name = 'land-strand'; strand.receiveShadow = land.object.receiveShadow; strand.castShadow = land.object.castShadow;
        scene.add(strand); outdoor.push(strand);
      }
    }
    // the falls of the halls: each pours off the ledge's end toward the route's side, over a lip 24 m wide turned 30 degrees toward the oncoming route; white in a pale light of their own
    const fallAt = [];
    const fallLight = { ...caveLight, ambient: '#b8dcf2', sunIntensity: 2.4 };
    const fallOpts = { light: fallLight, launch: 3.2, rows: 30, lipLength: 4, tint: '#bfe6f6', color: '#f2fdff', mistColor: '#e2f8ff', glow: 1.4, density: 0.8, layers: 3, mistCount: Math.round(130 * (0.6 + 0.4 * detail)), mistOpacity: 0.14, rainbow: 0, pool: false };
    for (let i = 0; i < 3; i++) {
      await ctx.yield();
      const f = FALLS[i], c = caveAt(f.s - 1, -8), top = upY(f.s - 1) + 0.25, foot = upY(f.s + 14) + 0.2, dx = c.tx * -0.5 - c.tz * 0.866, dz = c.tz * -0.5 + c.tx * 0.866;
      // (the kit's own mist of a fall rolls clouds of up to three quarters of the fall's breadth as far out as two breadths: in a hall
      // they would lie across the way. A hall's fall has the caverns' own mist at its foot instead, dealt clear of the way: below)
      const w = Water.makeWaterfall({ rng: RN['fall' + i], ...fallOpts, top: [c.x, top, c.z], height: top - foot, width: 24, dir: [dx, 0, dz], mist: false });
      w.object.name = 'ice-fall'; scene.add(w.object); caveWater.push(w); drawn(w.object, f.s - 15);        // (the near end of its lip lies 11.4 m before the fall's place along the caverns; the sheet leans 3.5 m more that way)
      fallAt.push([c.x + dx * 7, foot, c.z + dz * 7, f.s]);
    }
    // the river's last fall into the sea, the cataract: 52 m high; the arch's own curtain of 36 m and two wings pouring from slots in the cliff beside
    // the collar, their lips 8 m lower, 18 m broad (26 m on the side the visit draws)
    for (let i = 0; i < 3; i++) {
      await ctx.yield();
      const wide = i === 1 ? 36 : (i - 1) === WING ? 26 : 18, low = i === 1 ? 0 : 8, hF = FALL + 0.2 - low;
      // THE CATARACT'S MIST STAYS UNDER THE WAY. The kit rolls each fall's clouds out from its foot as far as 1.72 breadths and lets them
      // grow to 0.775 of a breadth in radius while they rise `mistRise`; a cloud's top is then mistRise + 1.0075 breadths over the sea
      // at the most. The way crosses over the cataract: the rise given is 18 m or as much less as keeps every cloud's top 4 m under
      // the lowest place of the way within the clouds' reach along the leg (the fall's foot lies 4.2 m/s times its time of fall out
      // from its lip, which is 18 m behind the leg's first metre).
      const reachX = -18 + 4.2 * Math.sqrt(2 * hF / 9.8) + (1.72 + 0.775) * wide;
      let wayLow = 1e9; for (let k = Math.floor(M.arch / LS); k <= NL; k++) if (seaXw(lnx[k], lnz[k])[0] <= reachX) wayLow = Math.min(wayLow, lny[k] - SEA);
      const w = Water.makeWaterfall({ rng: RN['cataract' + i], ...fallOpts, top: [ARCH_X - 8, upY(SL) + 0.25 - low, AZ + (i - 1) * (26 + wide / 2)], height: hF, width: wide, dir: [-1, 0, 0], launch: 4.2, lipLength: 6, rows: 44, glow: 1.7, density: 1.4,
        mistCount: Math.round(160 * (0.6 + 0.4 * detail)), mistOpacity: 0.13, mistRise: clamp(wayLow - 4 - 1.0075 * wide, 0, 18), pool: false });
      w.object.name = 'cataract'; scene.add(w.object); caveWater.push(w); seaGroup.push(w.object);          // (the sea's own white, on with the sea)
    }
    await ctx.yield();
    // icicles as long as towers hanging from the roof, blunt teeth standing on the floor (never in the river's channel), columns from floor to roof
    {
      const NS = cave.segments, iLo = Math.floor((M.mouth - 60) / LS), iHi = Math.ceil((M.arch + 60) / LS);
      const m4 = new THREE.Matrix4(), q4 = new THREE.Quaternion(), e3 = new THREE.Euler(), v3 = new THREE.Vector3(), s3 = new THREE.Vector3();
      // every piece of ice is tested as dealt, before it is tilted (0.06 rad at the most each way) and set 0.8 m into the roof or 0.6 m into
      // the floor: down its whole length, with its own radius there, it stands 11 m (an eighth of a hall's width) and more from the route
      // taken every 2 m. AS BUILT (tilted and set, every triangle of every piece against the route every metre, 300 visits) the
      // nearest piece stands 7.74 m from the route and one stands nearer than 11 m on 113 visits (nearer than 10 m on 12);
      // the lane's bar is 2.5 m. (The lips' icicles, which are not tilted, stand 11.31 m and more off; the columns 11.98 m and more.)
      for (const [i0, i1, nI, ir] of [[3, split, Math.round(270 * (0.6 + 0.4 * detail) * split / rings.length), RN['icicles-front']], [split, rings.length - 3, Math.round(270 * (0.6 + 0.4 * detail) * (1 - split / rings.length)), RN['icicles-deep']]]) {
        if (nI < 1 || i1 - i0 < 2) continue;
        const mesh = new THREE.InstancedMesh(icicleGeometry(0), cave.mesh.material, nI);
        let n = 0, sNear = rings[i1].s;                                              // (sNear: the least place along the caverns that a piece reaches: its section's less its own radius)
        for (let tries = 0; n < nI && tries < 4000; tries++) {
          if (tries % 120 === 119) await ctx.yield();
          const i = ir.int(i0, i1 - 1), hang = ir.chance(0.55), r = rings[i];
          const k = hang ? Math.round(NS * ir.range(0.1, 0.4)) : Math.round(NS * (ir.chance(0.5) ? ir.range(0.56, 0.7) : ir.range(0.8, 0.94)));
          cave.at(i, k, v3);
          const lat = (v3.x - r.p.x) * -r.t[1] + (v3.z - r.p.z) * r.t[0], room = hang ? v3.y - cave.floorY(i, lat) : (r.p.y + r.b) - v3.y;
          if (!hang && Math.abs(lat - r.river) < r.rw + 1) continue;                 // no tooth of ice stands in the river's channel
          const len = hang ? Math.min(room * 0.8, ir.chance(0.2) ? ir.range(22, 46) : ir.range(6, 18)) : Math.min(room * 0.4, ir.range(3, 12));
          const w = len * (hang ? ir.range(0.9, 1.5) : ir.range(2.2, 3.6));
          if (len < 2.5) continue;
          // (tested against the way for 120 m to either side of the piece's own place along it: the halls run on and never come back
          // on themselves, so the way farther off is 100 m away and more)
          const iW = Math.round((M.mouth + r.s) / LS), a0 = Math.max(iLo, iW - 60), a1 = Math.min(iHi, iW + 60);
          let ok = true; for (let q = 0; q <= 1.001 && ok; q += 0.125) if (lane3(v3.x, v3.y + (hang ? -len : len) * q, v3.z, a0, a1) < 11 + 0.15 * w * Math.pow(1 - Math.min(q, 1), 1.25)) ok = false;
          if (!ok) continue;
          e3.set(ir.range(-0.06, 0.06), ir.range(0, TAU), ir.range(-0.06, 0.06)); q4.setFromEuler(e3);
          m4.compose(v3.set(v3.x, v3.y + (hang ? 0.8 : -0.6), v3.z), q4, s3.set(w, hang ? len : -len, w)); mesh.setMatrixAt(n++, m4); sNear = Math.min(sNear, r.s - 0.15 * w);
        }
        mesh.count = n; mesh.instanceMatrix.needsUpdate = true; mesh.frustumCulled = false; mesh.name = 'cave-icicles'; scene.add(drawn(mesh, sNear)); scene.add(drawn(withFar(mesh, FAR_ICE, K_CAVE), sNear));
      }
      // THE FIRST HALL'S COLUMNS, from floor to roof, between 10 m past the throat and 26 m before the first fall: a number dealt for
      // each side from its own stream (3 to 10 right of the way, 2 to 6 left of the river), no more than one to 9 m of that length
      // (11 m on the left). Each stands in a station of its own (the length shared out evenly, the column within the middle half of
      // its station), 1.2 to 2.6 m in radius, across the hall at a dealt place of the band that is open there: on the right from
      // 11 m and twice its radius beyond the way to 0.85 of the hall's half breadth; on the left from that wall line in to a metre
      // and twice its radius short of the river's channel. Where the band is narrower than nothing for the dealt radius the column
      // takes the least radius; where it is shut even then, the station stays empty. Nothing is tried twice. THE RANGE: 5 to 16
      // are dealt in all (3 to 10 and 2 to 6); what stands is that number, less where the hall is short or a station is shut.
      const sC0 = THROAT + 10, sC1 = FALLS[0].s - 26, colsAt = [];
      for (const [right, lo, hi, per, cr2] of [[true, 3, 10, 9, RN['columns-right']], [false, 2, 6, 11, RN['columns-left']]]) {
        const n = Math.min(cr2.int(lo, hi), Math.max(1, Math.floor((sC1 - sC0) / per)));
        for (let k = 0; k < n; k++) {
          const sK = lerp(sC0, sC1, (k + cr2.range(0.25, 0.75)) / n), i = ringAt(sK), r = rings[i], f = cr2(), rot = cr2.range(0, TAU);
          let rad = cr2.range(1.2, 2.6);
          const band = (q) => right ? [Math.max(routeLat(r.s - 6), routeLat(r.s + 6)) + 11 + q * 2, 0.85 * r.a] : [-0.85 * r.a, r.river - r.rw - q * 2 - 1];
          let bd = band(rad); if (bd[1] < bd[0]) { rad = 1.2; bd = band(rad); }
          if (bd[1] < bd[0]) continue;
          const lat = lerp(bd[0], bd[1], f), x = r.p.x - r.t[1] * lat, z = r.p.z + r.t[0] * lat, y0 = cave.floorY(i, lat) - 1.5, y1 = r.p.y + r.b * 1.3 * Math.sqrt(Math.max(0.05, 1 - (lat / r.a) ** 2)) + 2;
          colsAt.push({ i, x, z, y0, y1, rad, right, rot, s: sK });
        }
      }
      for (const front of [true, false]) {
        const mine = colsAt.filter((q) => (q.i < split) === front);
        if (!mine.length) continue;
        const cols = new THREE.InstancedMesh(columnGeometry(9, 8), cave.mesh.material, mine.length);
        mine.forEach((q, k) => { q4.setFromEuler(e3.set(0, q.rot, 0)); m4.compose(v3.set(q.x, q.y0, q.z), q4, s3.set(q.rad, q.y1 - q.y0, q.rad)); cols.setMatrixAt(k, m4); });
        cols.instanceMatrix.needsUpdate = true; cols.frustumCulled = false; cols.name = 'cave-columns'; scene.add(drawn(cols, Math.min(...mine.map((q) => q.s)) - 3.2));
      }
    }
    // the lip of each fall: a rounded roll of ice along the sheet's line, 42 m long (the sheet's 24 m and 9 m beyond each end, where it
    // swells to 1.5 of its overhang and closes over its last 3 m), lying under the
    // water's arc (it overhangs 1.8 m; the water, leaving at 3.2 m/s, is 0.5 m and more outside it) and going down into the ledge's cliff; icicles
    // hang under its nose, 2 to 4 m long behind the sheet and 4 to 9 m beyond its ends
    {
      const hs = RN['hall-things'].fork('lips'), prof = [[-5, -0.35], [-2, -0.3], [0.2, -0.35], [0.9, -0.8], [1.5, -1.7], [1.8, -2.9], [1.6, -4.2], [0.9, -5.6], [0.2, -7.5], [-0.3, -10.5], [-0.6, -14]];
      const NU = 28, NK = prof.length, parts = [{ s: 1e9, P: [], A: [], I: [], ic: [] }, { s: 1e9, P: [], A: [], I: [], ic: [] }];
      const iLo = Math.floor((M.mouth - 60) / LS), iHi = Math.ceil((M.arch + 60) / LS);
      for (let i = 0; i < 3; i++) {
        const f = FALLS[i], c = caveAt(f.s - 1, -8), top = upY(f.s - 1) + 0.25, dx = c.tx * -0.5 - c.tz * 0.866, dz = c.tz * -0.5 + c.tx * 0.866, ax = c.tx * 0.866 - c.tz * 0.5, az = c.tz * 0.866 + c.tx * 0.5;
        const B = parts[f.s < S_SPLIT ? 0 : 1], base = B.P.length / 3;
        B.s = Math.min(B.s, f.s - 20);                                  // (a lip's near end lies 19.2 m before its fall's place along the caverns)
        for (let iu = 0; iu <= NU; iu++) {
          const u = (iu / NU - 0.5) * 42, end = (1 + 0.5 * sst(11, 14, Math.abs(u))) * (1 - 0.8 * sst(18, 21, Math.abs(u)));
          for (let k = 0; k < NK; k++) {
            const o = prof[k][0] > 0 ? prof[k][0] * end * (1 + 0.25 * N.n2(u * 0.4 + i * 9, k * 0.8)) : prof[k][0], y = top + prof[k][1] * (0.9 + 0.2 * N.n2(u * 0.3, k + i * 5));
            B.P.push(c.x + ax * u + dx * o, y, c.z + az * u + dz * o); B.A.push(0.3 + 0.15 * N.n2(u * 0.5, k), 1, 0);
          }
        }
        for (let iu = 0; iu < NU; iu++) for (let k = 0; k < NK - 1; k++) { const p = base + iu * NK + k, q = p + NK; B.I.push(p, q, q + 1, p, q + 1, p + 1); }
        for (let j = 0; j < 30; j++) {
          const u = hs.range(-19, 19), far = Math.abs(u) > 12, len = far ? hs.range(4, 9) : hs.range(2, 4), w = len * hs.range(0.9, 1.5), o = hs.range(1.2, 1.6) * (1 + 0.5 * sst(11, 14, Math.abs(u)));
          const ix = c.x + ax * u + dx * o, iy = top - hs.range(3.3, 4.3), iz = c.z + az * u + dz * o, rot = hs.range(0, TAU);
          // a lip's icicle takes the halls' test like every other piece of ice: none within 11 m + its own radius of the way, down its whole length
          let ok = true; for (let q = 0; q <= 1.001 && ok; q += 0.25) if (lane3(ix, iy - len * q, iz, iLo, iHi) < 11 + 0.15 * w * Math.pow(1 - Math.min(q, 1), 1.25)) ok = false;
          if (ok) B.ic.push([ix, iy, iz, len, w, rot]);
        }
      }
      const m4 = new THREE.Matrix4(), q4 = new THREE.Quaternion(), e3 = new THREE.Euler(), v3 = new THREE.Vector3(), s3 = new THREE.Vector3();
      for (const B of parts) {
        if (!B.I.length) continue;
        const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(B.P, 3)); g.setAttribute('aIce', new THREE.Float32BufferAttribute(B.A, 3)); g.setIndex(B.I); g.computeVertexNormals();
        const m = new THREE.Mesh(g, cave.mesh.material); m.name = 'fall-lips'; scene.add(drawn(m, B.s));
        const im = new THREE.InstancedMesh(icicleGeometry(0), cave.mesh.material, B.ic.length);
        B.ic.forEach((q, k) => { q4.setFromEuler(e3.set(0, q[5], 0)); m4.compose(v3.set(q[0], q[1], q[2]), q4, s3.set(q[4], q[3], q[4])); im.setMatrixAt(k, m4); });
        im.instanceMatrix.needsUpdate = true; im.frustumCulled = false; im.name = 'lip-icicles'; scene.add(drawn(im, B.s)); scene.add(drawn(withFar(im, FAR_ICE, K_ICE), B.s));
      }
    }
    await ctx.yield();
    // THE FROZEN FALL, the caverns' one great thing: a fall of ice down the left wall of the second hall, 0.45 of the way down it
    // (S_FROZEN), where the eye coming down the first hall looks over the first fall's lip. It comes from high in the roof (0.36
    // round the section from the right) down to the river's bank: 26 m broad under the roof and 48 m at its foot, standing 7 to
    // 9 m out of the wall at its middle, in four tiers (each a shelf with a drop under it) and in pipes a metre deep; a fringe of
    // icicles hangs under each shelf, and teeth of broken ice stand at its foot. The second hall's middle shaft of sun falls on
    // it from the roof: its ice is pale and the warm light lies on its head and shoulders (the caverns' one warm thing).
    {
      const hs = RN['hall-things'], sC = S_FROZEN, NU = 48, NV = 30, P = [], A = [], I = [], kTop = Math.round(cave.segments * 0.36), tmp = new THREE.Vector3();
      const casc = (u, v) => {
        const sv = sC + u * (0.55 + 0.45 * v), i = ringAt(sv), r = rings[i]; cave.at(i, kTop, tmp);
        const latT = (tmp.x - r.p.x) * -r.t[1] + (tmp.z - r.p.z) * r.t[0], latB = -34 + 2.5 * N.n2(sv * 0.15, 3.3), yB = cave.floorY(i, latB) - 0.5;
        const v4 = Math.min(v, 0.9999) * 4, tier = Math.floor(v4), fr = v4 - tier, step = (tier + sst(0.5, 1, fr)) / 4, mid = 1 - (u / 26) ** 2;
        const pipe = Math.pow(Math.abs(Math.sin(u * 0.75 + tier * 1.3 + 0.6 * N.n2(u * 0.2, tier * 3.1))), 0.7);
        const lat = lerp(latT, latB, Math.pow(v, 0.8)) + (7 + 2 * N.n2(u * 0.3, v * 5)) * Math.pow(Math.sin(Math.PI * v), 0.8) * Math.max(mid, 0.15) + 1.6 * sst(0.2, 0.5, fr) * (1 - sst(0.5, 1, fr)) + 1.0 * (pipe - 0.5) * (0.3 + 0.7 * v);
        const c = caveAt(sv, lat);
        return [c.x, lerp(tmp.y, yB, step) + 0.6 * N.n2(u * 0.5, v * 7), c.z, pipe];
      };
      for (let iu = 0; iu <= NU; iu++) for (let iv = 0; iv <= NV; iv++) {
        const u = (iu / NU - 0.5) * 48, v = iv / NV, p = casc(u, v);
        P.push(p[0], p[1], p[2]); const gl = Math.exp(-((u / 20) ** 2)) * (1 - 0.45 * v);
        // (its light: over 1 the shaft's sun comes THROUGH the ice, on every face and not only the level ones)
        A.push(0.5 + 0.25 * p[3] + 0.15 * N.n2(u * 0.3, v * 4), 1.15, gl * (1 + gl));
      }
      for (let iu = 0; iu < NU; iu++) for (let iv = 0; iv < NV; iv++) { const p = iu * (NV + 1) + iv, q = p + NV + 1; I.push(p, q, q + 1, p, q + 1, p + 1); }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('aIce', new THREE.Float32BufferAttribute(A, 3)); g.setIndex(I); g.computeVertexNormals();
      const m = new THREE.Mesh(g, cave.mesh.material); m.name = 'frozen-fall'; scene.add(drawn(m, sC - 24));                 // (it is 48 m broad along the hall)
      await ctx.yield();
      const m4 = new THREE.Matrix4(), q4 = new THREE.Quaternion(), e3 = new THREE.Euler(), v3 = new THREE.Vector3(), s3 = new THREE.Vector3();
      const fr = new THREE.InstancedMesh(icicleGeometry(0.5), cave.mesh.material, 96);
      for (let t = 0, k = 0; t < 4; t++) for (let j = 0; j < 20; j++, k++) {
        const p = casc(hs.range(-21, 21), (t + 0.62) / 4), len = hs.range(2, 6.5) * (0.6 + 0.4 * t / 3), w = len * hs.range(1.0, 1.6);
        q4.setFromEuler(e3.set(hs.range(-0.05, 0.05), hs.range(0, TAU), hs.range(-0.05, 0.05))); m4.compose(v3.set(p[0], p[1] + 0.2, p[2]), q4, s3.set(w, len, w)); fr.setMatrixAt(k, m4);
      }
      for (let j = 0; j < 16; j++) {
        const p = casc(hs.range(-22, 22), hs.range(0.955, 0.995)), len = hs.range(1.5, 4.5), w = len * hs.range(2.4, 3.6);
        q4.setFromEuler(e3.set(hs.range(-0.12, 0.12), hs.range(0, TAU), hs.range(-0.12, 0.12))); m4.compose(v3.set(p[0], p[1] - 0.4, p[2]), q4, s3.set(w, -len, w)); fr.setMatrixAt(80 + j, m4);
      }
      fr.instanceMatrix.needsUpdate = true; fr.frustumCulled = false; fr.name = 'cascade-fringes'; scene.add(drawn(fr, sC - 24)); scene.add(drawn(withFar(fr, icicleFarGeometry(0.5), K_ICE), sC - 24));
    }
    await ctx.yield();
    // the third hall's still pool (it mirrors the lit ice over it: deep green, never black), on its level floor right of the river: from 16 m past the second fall to 2 m before the third
    // ramp, 34 m broad, its middle 12 m right of the route's line; unrippled; the sea's phosphor lies on it as a road toward the arch
    {
      const s0p = FALLS[1].s + 16, s1p = FALLS[2].s - 38, sM = (s0p + s1p) / 2, Ls = (s1p - s0p) / 2, yP = lowY(sM) - 2.3 + 3.5 + 1.0, P = [], A = [], I = [], NA = 28, NR = 3;
      for (let j = 0; j <= NR; j++) for (let k = 0; k <= NA; k++) {
        const rho = j / NR, th = (k % NA) / NA * TAU, al = rho * Math.cos(th), ac = rho * Math.sin(th), c = caveAt(sM + al * Ls, 27 + ac * 17);
        P.push(c.x, yP, c.z); A.push(rho, al, ac);
      }
      for (let j = 0; j < NR; j++) for (let k = 0; k < NA; k++) { const p = j * (NA + 1) + k, q = p + NA + 1; I.push(p, q, q + 1, p, q + 1, p + 1); }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('aE', new THREE.Float32BufferAttribute(A, 3)); g.setIndex(I);
      const mat = new THREE.ShaderMaterial({
        fog: true, transparent: true, depthWrite: false, side: THREE.DoubleSide, uniforms: { ...THREE.UniformsLib.fog, uTime: look.uTime, uPhos: { value: C('#7ff0d0') } },
        vertexShader: /* glsl */`attribute vec3 aE; varying vec3 vE, vW;
          #include <fog_pars_vertex>
          void main(){ vE = aE; vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; vec4 mvPosition = viewMatrix * w; gl_Position = projectionMatrix * mvPosition;
            #include <fog_vertex>
          }`,
        fragmentShader: /* glsl */`uniform float uTime; uniform vec3 uPhos; varying vec3 vE, vW;
          #include <fog_pars_fragment>
          ${GLSL_N3}
          void main(){
            vec3 v = normalize(cameraPosition - vW); float fres = pow(clamp(1.0 - abs(v.y), 0.0, 1.0), 2.5);
            // the hall mirrored: darker where the roof is far, paler in slow drifts (the ice over it)
            float drift = rsN(vec3(vW.xz * 0.06, 2.0)), speck = pow(clamp(rsN(vec3(vW.xz * 0.9 + vec2(uTime * 0.05, 0.0), uTime * 0.1)), 0.0, 1.0), 16.0);
            vec3 col = mix(vec3(0.03, 0.1, 0.11), mix(vec3(0.1, 0.32, 0.3), vec3(0.22, 0.55, 0.5), drift), 0.25 + 0.6 * fres);
            col += uPhos * (0.1 * exp(-clamp(vE.z * vE.z * 14.0, 0.0, 30.0)) * smoothstep(-1.0, 1.0, vE.y) * (0.6 + 0.4 * rsN(vec3(vW.xz * 0.25, uTime * 0.15))) + 1.0 * speck);
            gl_FragColor = vec4(col, smoothstep(1.0, 0.82, vE.x) * 0.97);
            #include <fog_fragment>
          }`,
      });
      const pool = new THREE.Mesh(g, mat); pool.renderOrder = 1; pool.name = 'black-pool'; scene.add(drawn(pool, s0p));
    }
    // the shafts: warm sun falling through cracks onto the water; mist at the foot of every fall
    const shafts = shaftsAt.map((q, i) => {
      const c = caveAt(q[0], q[1]), r = rings[ringAt(q[0])], yTop = r.p.y + r.b * 0.92, yWater = upY(q[0] + 14);
      const sft = fx.makeGodRays({ rng: RN['shaft' + i], time: tU, position: [c.x + 3, yTop, c.z], direction: [-0.1, -1, i % 2 ? 0.1 : -0.1], radius: 8 + 1.5 * (i % 3), count: 9, length: (yTop - yWater) * 1.02, width: [1.4, 4.6],
        color: '#' + look.uShaft.value.getHexString(), intensity: hour === 'night' ? 0.3 : 0.6, falloff: 0.7, fogAmount: 0.3 });
      scene.add(drawn(sft.object, q[0] - 14));                                     // (a shaft and its dust reach 14 m to each side of the shaft's place)
      // A10: ice dust hangs in the shaft's own light: a standing column of it, the shaft's breadth and 3 m more to each side, from the
      // water to the crack
      const rad = 8 + 1.5 * (i % 3) + 3, dust = fx.makeParticles({ rng: RN['ice-dust'].fork('shaft' + i), preset: 'dust', follow: false, center: [c.x + 3, (yTop + yWater) / 2, c.z], box: [2 * rad, yTop - yWater, 2 * rad], time: tU, count: Math.round(600 * (0.5 + 0.5 * detail)), colors: ['#e6fbff', '#9fe6ff', '#ffffff'], size: [0.03, 0.1], intensity: 1.7 });
      dust.object.name = 'ice-dust'; scene.add(drawn(dust.object, q[0] - 14));
      return sft;
    });
    // the mist of a fall stays at its foot: within 9 m of it, clouds of 10 to 16 m, none with its edge nearer than 11 m to the route (its middle 19 m)
    const mistPos = [];
    {
      const mr = RN['mist-places'], i0 = Math.floor((M.mouth - 60) / LS), i1 = Math.ceil((M.arch + 60) / LS);
      for (const f of fallAt) for (let k = 0, tries = 0; k < 10 && tries < 60; tries++) {
        const x = f[0] + mr.range(-9, 9), y = f[1] + mr.range(2, 10), z = f[2] + mr.range(-9, 9);
        if (lane3(x, y, z, i0, i1) < 19) continue;
        mistPos.push([x, y, z]); k++;
      }
    }
    const caveMist = fx.makeMist({ rng: RN['cave-mist'], time: tU, positions: mistPos.length ? mistPos : [[fallAt[0][0], fallAt[0][1] + 4, fallAt[0][2]]], count: Math.max(1, mistPos.length), size: [10, 16], color: '#d6f2ff', opacity: 0.2 });
    // (no place found clear of the way: no mist. Its nearest cloud reaches 22 m before the first fall's place along the caverns)
    if (mistPos.length) scene.add(drawn(caveMist.object, FALLS[0].s - 22));
    await ctx.yield();
    // ---------- the sunless sea ----------
    const ARCH = { y: upY(SL) + 9, hw: 20, hh: 13 };                 // the hole in the cliff's sheet: smaller than the caverns' last section behind it
    // THE SEA IS A HALL, AND ITS VAULT IS SEEN. In plan it is two half ovals about a middle XO out on the leg's line: RA down the leg (to
    // the far shore, FAR beyond the ring: 380 to 460 m), RB back to the cliff, RW to each side (300 to 360 m) (stream 'vault'). The
    // roof springs from the shore WALL_H over the sea (46 to 58 m) and rises to a crown over the leg's line: 108 m at the cliff, 122 m
    // at the leg's middle, 92 m over the ring's gate, 128 m beyond it, 88 m at the far shore. RIBS cross it every RIB metres (78 to 96;
    // one stands over the ring's gate), 12 to 17 m deep and 20 m broad, deeper toward the shore; between two ribs lies a bay.
    const vlt = RN.vault, RW = vlt.range(300, 360), FAR = vlt.range(380, 460), RIB = vlt.range(78, 96), WALL_H = vlt.range(46, 58);
    const XO = 0.42 * (LEG + FAR), RA = LEG + FAR - XO, RB = XO + 60, GATE_BACK = 7, RIB_X0 = LEG + GATE_BACK;
    const shoreR = (a) => { const c = Math.cos(a), s = Math.sin(a), ra = c >= 0 ? RA : RB; return 1 / Math.sqrt((c / ra) ** 2 + (s / RW) ** 2); };
    // how far a place of the sea lies toward the shore: 0 at the hall's middle, 1 on the shore
    const shoreK = (X, w) => Math.hypot(X - XO, w) / shoreR(Math.atan2(w, X - XO));
    const crownAt = (X) => 108 + 14 * sst(0, 0.45 * LEG, X) - 30 * sst(0.55 * LEG, LEG, X) + 36 * sst(LEG + 20, LEG + 0.5 * FAR, X) - 40 * sst(LEG + 0.6 * FAR, LEG + FAR, X);
    const ribK0 = -Math.floor((RIB_X0 - 56) / RIB), ribK1 = Math.floor((FAR - GATE_BACK - 30) / RIB), ribDeep = [];
    for (let k = ribK0; k <= ribK1; k++) ribDeep.push(vlt.range(12, 17));
    const ribAt = (X, w, rho) => {
      let d = 0;
      // (a rib is 10 m to each side of its line and its line wanders 6 m at the most: only the ribs within 16 m of X are asked)
      for (let k = Math.max(ribK0, Math.ceil((X - RIB_X0 - 16.01) / RIB)), k1 = Math.min(ribK1, Math.floor((X - RIB_X0 + 16.01) / RIB)); k <= k1; k++) { const t = (X - (RIB_X0 + k * RIB) - 6 * Math.sin(w * 0.012 + k * 1.7)) / 10; if (t > -1 && t < 1) d = Math.max(d, ribDeep[k - ribK0] * (1 - t * t) ** 2); }
      return d * (1 + 0.6 * rho * rho);
    };
    // the middle of the bay nearest X; the rifts (below) lie in bays, and the roof is domed 7 m higher about each
    const bayMid = (X) => RIB_X0 + (Math.round((X - RIB_X0) / RIB - 0.5) + 0.5) * RIB;
    const SHAFTS = [];                                               // [X, w, radius, strength] in the sea's frame
    // THE VAULT KEEPS OVER THE WAY. The river comes in high through the cliff and the way goes down with it to the leg's level run:
    // within 26 m to each side of the way the roof lies WAY_UP (18 m) and more over the way's own height there (the rule fades out by
    // 70 m to the side): a dome over the river's fall, into which the first ribs die.
    const WAY_UP = 18, wayOver = (() => {
      const xs = [], ys = [], ws = [];
      for (let i = Math.floor(M.arch / LS); i <= NL; i++) { const [X, w] = seaXw(lnx[i], lnz[i]); xs.push(X); ys.push(lny[i]); ws.push(w); }
      // (the sample nearest X, and of several as near the earliest of the way, found among the samples laid in the order of their X: the
      // first not before X, the one before it, and whatever lies exactly as near beside those)
      const n = xs.length, ord = xs.map((_, i) => i).sort((a, b) => xs[a] - xs[b] || a - b), sx = ord.map((i) => xs[i]);
      return (X) => {
        let lo = 0, hi = n; while (lo < hi) { const mid = (lo + hi) >> 1; if (sx[mid] < X) lo = mid + 1; else hi = mid; }
        const d = Math.min(lo < n ? Math.abs(sx[lo] - X) : 1e18, lo > 0 ? Math.abs(sx[lo - 1] - X) : 1e18); let bi = n;
        for (let j = lo; j < n && Math.abs(sx[j] - X) === d; j++) if (ord[j] < bi) bi = ord[j];
        for (let j = lo - 1; j >= 0 && Math.abs(sx[j] - X) === d; j--) if (ord[j] < bi) bi = ord[j];
        return [ys[bi], ws[bi]];
      };
    })();
    const roofAt = (X, w) => {
      const rho = Math.min(shoreK(X, w), 1.25), [x, z] = seaXZ(X, w);
      let y = lerp(WALL_H, crownAt(X), Math.pow(Math.max(Math.cos(Math.min(rho, 1) * Math.PI / 2), 0), 0.75)) - ribAt(X, w, rho) + 5 * N.fbm2(x * 0.004 + 3, z * 0.004 - 7, 3) + 2 * N.n2(x * 0.017, z * 0.017);
      for (const q of SHAFTS) y += 7 * Math.exp(-(((X - q[0]) / (RIB * 0.3)) ** 2 + ((w - q[1]) / 26) ** 2));
      const [wy, ww] = wayOver(X), need = wy - SEA + WAY_UP;
      if (need > y) y = lerp(y, need, 1 - sst(26, 70, Math.abs(w - ww)));
      return SEA + y;
    };
    const roofY = (x, z) => { const [X, w] = seaXw(x, z); return roofAt(X, w); };
    // THE FROZEN FALL, the one great thing of the leg's middle: ice that has come down through a rift of the roof into the sea,
    // on the hand's side of the way, in the middle of the bay nearest 0.42 to 0.52 of the leg out. Its foot is FF_R in radius (24 to
    // 30 m) and the nearest of its skirt on the water, pipes and all, is 30 m and more from the leg's line.
    const ffr = RN['frozen-fall'], FF_R = ffr.range(24, 30), FF_X = bayMid(LEG * ffr.range(0.42, 0.52)), FF_W = 34 + FF_R * 1.25;
    // THE RIFTS: five places where the roof is thin and cold daylight falls through to the sea (stream 'rifts'): on the frozen fall;
    // behind the ring's gate, on the side away from the hand; over the far side of the cataract's pool; beyond the frozen fall; deep in
    // the far hall. Each lies in the middle of a bay and is 12 to 18 m in radius. The nearest to the way is the one on the frozen
    // fall: its middle lies 34 m and four fifths of the fall's radius (53 to 58 m) from the leg's line. The others are dealt 110 m
    // and more to the side of the leg's line or beyond the ring (one dealt past 0.78 of the way to the shore is drawn in to there).
    {
      const rf = RN.rifts, put = (X, w, r, k) => { const rho = shoreK(X, w); SHAFTS.push([X, rho > 0.78 ? w * 0.78 / rho : w, r, k]); };
      put(FF_X, FF_W - 0.45 * FF_R, 15, 1.25);
      put(bayMid(LEG + rf.range(110, 170)), -rf.range(45, 85), 14, 1.0);
      put(bayMid(rf.range(130, 210)), -rf.range(110, 170), 13, 0.9);
      put(bayMid(LEG * rf.range(0.74, 0.9)), rf.range(150, 220), 12, 0.8);
      put(bayMid(LEG + FAR * rf.range(0.55, 0.75)), rf.range(-110, 110), 18, 1.1);
    }
    const shaftXZ = SHAFTS.map((q) => { const p = seaXZ(q[0], q[1]); return [p[0], p[1], q[2], q[3]]; });
    const shaftCol = C(H.shaft).lerp(C('#bfe6ff'), 0.65);
    const seaLight = seaLightUniforms({ shafts: shaftXZ, shaftColor: shaftCol, seaY: SEA, belowColor: '#46d8b8', reach: 20, vault: 0.5 });
    // the sea's ice is a cold blue body (the halls' is turquoise); the ring lights what stands within 80 m of it
    const seaIce = makeIceMaterial(look, { side: THREE.DoubleSide, scale: 0.45, grey: 0.3, tint: [0.6, 0.8, 1.0], lamp: [RING[0], SEA + RING_H, RING[1], 80], lampColor: '#8fe6c8', ownFog: [fogSea.r, fogSea.g, fogSea.b, 0.0014], cliffX: ARCH_X - 6,
      sea: { uniforms: seaLight, ambient: 0.22, rim: '#b8f2ff', inner: '#8feaff' } });
    // the cliff the caverns open in is a headland of glowing ice: flat for 45 m to each side of the arch, then falling back slowly (36 m at
    // 200 m aside), a broad face behind the cataract
    const wallX = (dz) => ARCH_X - 6 + 0.0015 * Math.max(0, Math.abs(dz) - 45) ** 2;
    {
      // columns closest together by the arch; ribs 24 m apart and 6 m deep from 60 to 170 m to each side of it
      const geo = await iceSheetGeometry(200, 36, (u, v) => {
        const tq = u * 2 - 1, dz = Math.sign(tq) * 560 * Math.pow(Math.abs(tq), 1.8), y = SEA - 8 + v * 150, az = Math.abs(dz);
        const rough = sst(60, 130, az);                                // flat by the arch (the caverns end on this line), bulging and leaning beyond
        const x = wallX(dz) + rough * (9 * N.fbm2(dz * 0.012, y * 0.02 + 3, 3) + 0.05 * (y - SEA)) - 6 * Math.pow(Math.abs(Math.sin(dz * Math.PI / 24)), 4) * sst(58, 70, az) * sst(190, 150, az);
        const hole = (dz / ARCH.hw) ** 2 + ((y - ARCH.y) / ARCH.hh) ** 2 < 1.25;
        return { p: [x, y, AZ + dz], hole, ice: [0.05 + 0.1 * sst(120, 0, az), lerp(1.0, 0.4, sst(SEA + 10, SEA + 100, y)) * (1 - 0.55 * sst(250, 560, az)), 0] };
      }, ctx.yield, 40);
      const m = new THREE.Mesh(geo, seaIce); m.name = 'sea-cliff'; scene.add(m); seaGroup.push(m);
      await ctx.yield();
      // a rim of thick ice round the arch on the caverns' side (as the mouth has): from 7.5 m outside the arch's line round a lip 1.5 m inside it;
      // it covers the sheet's cut edge from inside
      const NA = 56, prof = [[7.5, 0.3], [3, 1.2], [-1.5, 2]], NK = prof.length, P = [], A = [], I = [];
      for (let i = 0; i <= NA; i++) {
        const a = i / NA * TAU, ca = Math.cos(a), sa = Math.sin(a);
        for (let k = 0; k < NK; k++) {
          const mm = prof[k][0] + 0.5 * N.n2(a * 2.7 + 3, k * 1.3);
          P.push(ARCH_X - 6 + prof[k][1] + 0.4 * N.n2(a * 4.1, k + 7), ARCH.y + (ARCH.hh + mm) * sa, AZ + (ARCH.hw + mm) * ca); A.push(0.35 - 0.06 * Math.abs(k - 2) + 0.15 * N.n2(a * 3.3 + 1, k), 1, [0, 0, 0.5][k]);
        }
      }
      for (let i = 0; i < NA; i++) for (let k = 0; k < NK - 1; k++) { const p = i * NK + k, q = p + NK; I.push(p, p + 1, q + 1, p, q + 1, q); }
      const rg = new THREE.BufferGeometry(); rg.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); rg.setAttribute('aIce', new THREE.Float32BufferAttribute(A, 3)); rg.setIndex(I); rg.computeVertexNormals();
      const rim = new THREE.Mesh(rg, cave.mesh.material); rim.name = 'arch-rim'; scene.add(rim); seaGroup.push(rim);
      // ON THE SEA'S SIDE THE ARCH IS AN ARCH OF THE CLIFF'S OWN ICE, not a ring: a hood over the opening's upper half only (the river's
      // brink and the cataract are its foot), its outline pointed (7.5 m outside the opening at the springing, 25 m over its crown), 3.5 m
      // proud of the cliff and dark as the cliff is; from its lip teeth of ice hang 1.5 to 8 m into the opening, before the light.
      // no tooth's tip comes within 7 m of the way where the way goes out under the hood (the
      // way's own place in the plane of the hood's lip): a tooth that would is as short as that leaves it.
      {
        let wi = Math.round(M.arch / LS); for (let i = wi; i < Math.min(NL, wi + 30); i++) if (Math.abs(lnx[i] - (ARCH_X - 6.5)) < Math.abs(lnx[wi] - (ARCH_X - 6.5))) wi = i;
        const NS = 100, hp = [[-1.5, -0.5], [1, -3.5], [4, -3], [7.5, -0.3]], HK = hp.length, HP = [], HA = [], HI = [];
        for (let i = 0; i <= NS; i++) {
          const a = lerp(-0.2, Math.PI + 0.2, i / NS), ca = Math.cos(a), sa = Math.sin(a), hood = 17.5 * Math.pow(Math.max(sa, 0), 2.5);
          let tooth = i % 2 === 1 ? (1.5 + 6.5 * Math.pow(0.5 + 0.5 * N.n2(i * 0.83, 4.4), 2)) * sst(0.15, 0.5, sa) : 0;
          for (let k = 0; k < HK; k++) {
            const mm = hp[k][0] + (k >= 2 ? hood * (k - 1) / 2 : 0) + 0.6 * N.n2(a * 2.7 + 3, k * 1.3 + 9);
            const hy = ARCH.y + (ARCH.hh + mm) * sa, hz = AZ + (ARCH.hw + mm) * ca;
            if (k === 0 && tooth > 0) { const dz = Math.abs(hz - lnz[wi]); if (dz < 7) tooth = clamp(hy - lny[wi] - Math.sqrt(Math.max(49 - dz * dz, 0)), 0, tooth); }
            HP.push(ARCH_X - 6 + hp[k][1] + 0.5 * N.n2(a * 4.1, k + 17), hy - (k === 0 ? tooth : 0), hz);
            HA.push(0.05 + 0.12 * (k === 0 ? 1 : 0), 0.7, 0);
          }
        }
        for (let i = 0; i < NS; i++) for (let k = 0; k < HK - 1; k++) { const q0 = i * HK + k, q1 = q0 + HK; HI.push(q0, q0 + 1, q1 + 1, q0, q1 + 1, q1); }
        const hg = new THREE.BufferGeometry(); hg.setAttribute('position', new THREE.Float32BufferAttribute(HP, 3)); hg.setAttribute('aIce', new THREE.Float32BufferAttribute(HA, 3)); hg.setIndex(HI); hg.computeVertexNormals();
        const hoodM = new THREE.Mesh(hg, seaIce); hoodM.name = 'arch-hood'; scene.add(hoodM); seaGroup.push(hoodM);
      }
    }
    // the middle of the water the route flies over
    const SEA_MID = seaXZ(0.55 * LEG, 0);
    const seaU = {
      uDeep: { value: C('#062630') }, uPhos: { value: C('#7ff0d0') }, uSeaFog: { value: new THREE.Vector4(fogSea.r, fogSea.g, fogSea.b, 0.0014) }, uFoot: { value: new THREE.Vector4(FOOT[0], FOOT[1], FALL, 46) }, uRing: { value: new THREE.Vector4(RING[0], RING[1], 90, RING_H) }, uPlume: { value: new THREE.Vector4(ARCH_X - 10, AZ, RING[0], RING[1]) }, uSeaY: { value: SEA },
      uTurn: { value: new THREE.Vector4(0, 0, 0, 0) }, uTurnR: { value: 60 }, uMid: { value: new THREE.Vector2(SEA_MID[0], SEA_MID[1]) }, uHall: { value: new THREE.Vector4(FOOT[0] - XO, AZ, RA, RB) }, uHallW: { value: RW }, ...seaLight,
    };
    // the swell: three trains (4.5 m high by 340 m long, 2.6 by 85, 1.3 by 38), their crests sharpened; the short ones die away far out. From the
    // cataract's foot (a line 92 m long under its three curtains) rings of waves 0.9 m high and 28 m apart run out at 10 m a second to 4 fall heights
    const GLSL_SWELL = /* glsl */`
      uniform float uTime; uniform vec2 uMid; uniform vec4 uFoot;
      float rsCrest(float a, out float d){ float s = 0.5 + 0.5 * sin(a); d = 1.7 * pow(max(s, 1e-4), 0.7) * cos(a); return 2.0 * pow(max(s, 1e-4), 1.7) - 1.0; }
      vec3 rsSwell(vec2 p){
        vec2 d1 = vec2(-0.864, 0.503), d2 = vec2(-0.552, -0.834), d3 = vec2(-0.995, -0.1);
        float k1 = 0.01848, k2 = 0.07392, k3 = 0.16535, near = 1.0 - smoothstep(380.0, 900.0, distance(p, uMid));
        float g1, g2, g3, h1 = rsCrest(dot(p, d1) * k1 + uTime * 0.36, g1), h2 = rsCrest(dot(p, d2) * k2 + uTime * 0.72, g2), h3 = rsCrest(dot(p, d3) * k3 + uTime * 1.08, g3);
        vec2 fv = vec2(p.x - uFoot.x, sign(p.y - uFoot.y) * max(abs(p.y - uFoot.y) - uFoot.w, 0.0)); float fd = max(length(fv), 1e-3);
        float rk = 0.9 * smoothstep(uFoot.z * 4.0, uFoot.z, fd) * smoothstep(0.0, uFoot.z * 0.5, fd), ra = fd * 0.22 - uTime * 2.2;
        return vec3(2.25 * h1 + 1.3 * near * h2 + 0.65 * near * h3 + rk * sin(ra), d1 * 2.25 * k1 * g1 + d2 * 1.3 * near * k2 * g2 + d3 * 0.65 * near * k3 * g3 + fv / fd * rk * 0.22 * cos(ra));
      }`;
    // how far it is, in metres across the waves, from a place to the nearest crest of each of the three trains
    const GLSL_CRESTS = /* glsl */`
      vec3 rsCrests(vec2 p){
        return vec3(acos(clamp(sin(dot(p, vec2(-0.864, 0.503)) * 0.01848 + uTime * 0.36), -1.0, 1.0)) / 0.01848, acos(clamp(sin(dot(p, vec2(-0.552, -0.834)) * 0.07392 + uTime * 0.72), -1.0, 1.0)) / 0.07392, acos(clamp(sin(dot(p, vec2(-0.995, -0.1)) * 0.16535 + uTime * 1.08), -1.0, 1.0)) / 0.16535);
      }`;
    {
      // cells of 7 m under the route, growing outward to the haze
      const ax = []; for (let i = -35; i <= 35; i++) ax.push(i * 7); for (let i = 1, d = 7, x = 245; i <= 24; i++) { d *= 1.18; x += d; ax.push(x); ax.unshift(-x); }
      const P = [], I = [], n = ax.length;
      for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) P.push(SEA_MID[0] + ax[i], SEA, SEA_MID[1] + ax[j]);
      for (let i = 0; i < n - 1; i++) for (let j = 0; j < n - 1; j++) { const a = i * n + j, b = a + n; I.push(a, a + 1, b + 1, a, b + 1, b); }
      const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); geo.setIndex(I);
      await ctx.yield();
      const mat = new THREE.ShaderMaterial({
        fog: false, uniforms: { ...look, ...seaU },
        vertexShader: /* glsl */`
          ${GLSL_SWELL}
          varying vec3 vW; varying vec3 vS;
          void main(){
            vec3 p = position; vec3 s = rsSwell(p.xz); p.y += s.x; vS = s; vW = p;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
          }`,
        fragmentShader: /* glsl */`
          uniform float uTime, uSeaY, uTurnR; uniform vec3 uDeep, uPhos, uIceGlow, uIceDeep, uShaftC, uBelowC; uniform vec4 uPlume, uTurn, uFoot, uRing, uSeaFog, uHall, uShaftP[5]; uniform vec2 uMid; uniform float uHallW;
          varying vec3 vW; varying vec3 vS;
          ${GLSL_N3}
          ${GLSL_CRESTS}
          void main(){
            vec3 v = normalize(cameraPosition - vW); float dist = length(cameraPosition - vW);
            float lod = clamp(1.0 - dist / 500.0, 0.0, 1.0);
            vec2 q = vW.xz;
            float r1 = rsN(vec3(q * 0.45 + vec2(uTime * 0.5, 0.0), uTime * 0.35)), r2 = rsN(vec3(q * 0.45 + 31.0 + vec2(0.0, uTime * 0.4), uTime * 0.35));
            float r3 = rsN(vec3(q * 1.7, uTime * 0.9)), r4 = rsN(vec3(q * 1.7 + 13.0, uTime * 0.9));
            vec3 n = normalize(vec3(-vS.y - (r1 - 0.5) * 0.4 * lod - (r3 - 0.5) * 0.12 * lod * lod, 1.0, -vS.z - (r2 - 0.5) * 0.4 * lod - (r4 - 0.5) * 0.12 * lod * lod));
            float fres = 0.03 + 0.97 * pow(clamp(1.0 - dot(n, v), 0.0, 1.0), 5.0);
            vec3 r = reflect(-v, n); r.y = abs(r.y);
            float ry = clamp(r.y, 0.0, 1.0);
            // WHAT THE WATER MIRRORS: the lit haze low over the far water, and over it the vault, dimly lit from below. So each wave's far
            // face is pale and its near face deep, and the far water lies lighter than the near.
            vec3 env = mix(uSeaFog.rgb * 2.4 + uBelowC * 0.04, uIceDeep * vec3(0.5, 0.75, 1.0) * 0.14 + uBelowC * 0.03, smoothstep(0.03, 0.4, ry));
            // the water's own body: deep, and paler in the crests, where it is thin and the light inside it shows
            vec3 col = uDeep * clamp(0.9 + 0.12 * vS.x, 0.4, 1.6) + uBelowC * 0.03 * smoothstep(0.5, 2.5, vS.x);
            col = mix(col, env, fres);
            // COLD FIRE on the crests: torn lace of light that lies on the crest of each of the three trains and thins away within 5 m
            // of it (the crest's own line wanders 3 m to and fro), running with the crest, in patches along it and dark between them,
            // brightest where two crests cross; a faint thread of it lies in the troughs; sparks in it
            vec2 wq = q + 3.0 * (vec2(rsN(vec3(q * 0.05, 1.3)), rsN(vec3(q * 0.05 + 7.0, 4.1))) - 0.5) * 2.0;
            vec3 cr = rsCrests(wq); float nearK = 1.0 - smoothstep(380.0, 900.0, distance(q, uMid));
            float brk = rsN(vec3(q * 0.045 + vec2(uTime * 0.03, 0.0), 2.0)) * 0.6 + rsN(vec3(q * 0.17 + 9.0, uTime * 0.12)) * 0.4;
            float lines = 0.5 * exp(-clamp(cr.x / 2.6, 0.0, 20.0)) + nearK * (0.9 * exp(-clamp(cr.y / 1.9, 0.0, 20.0)) + 0.7 * lod * exp(-clamp(cr.z / 1.3, 0.0, 20.0)));
            vec2 lp = q * vec2(0.16, 0.34) + vec2(uTime * 0.07, 0.0);
            float fil = 1.0 - abs(2.0 * (rsN(vec3(lp, uTime * 0.1)) * 0.65 + rsN(vec3(lp * 2.3 + 5.0, uTime * 0.17)) * 0.35) - 1.0);
            fil = fil * fil; fil = fil * fil; fil = fil * fil;
            float lace = (lines * smoothstep(0.4, 0.66, brk + 0.4 * nearK * exp(-clamp((cr.y + cr.z) / 5.0, 0.0, 20.0))) * (0.12 + 1.5 * fil) + fil * 0.03) * (0.35 + 0.65 * lod);
            float spark = pow(clamp(rsN(vec3(q * 2.3, uTime * 1.1)), 0.0, 1.0), 9.0) * 2.0 * lod;
            // THE SHAFTS OF DAYLIGHT: a pool of light where each lands, and its long path of glints: a shaft is a column of light from the
            // water to the roof, and the water mirrors it wherever the mirrored ray heads for it, within its breadth, and meets it under
            // the roof (below 60 to 110 m): the path lies on the water from the shaft's foot toward whoever looks
            vec2 rh = r.xz / max(length(r.xz), 1e-3); float rs = r.y / max(length(r.xz), 1e-3);
            vec3 sh = vec3(0.0);
            for (int i = 0; i < 5; i++) {
              vec2 dv = uShaftP[i].xy - q; float d = length(dv), rr = uShaftP[i].z;
              float pool = (1.0 - smoothstep(rr * 0.5, rr * 1.6, d)) * (0.6 + 2.4 * r3 * r1);
              float wd = rr * 1.3 / max(d, rr), aim = dot(rh, dv / max(d, 1e-3));
              float path = smoothstep(1.0 - 2.0 * wd * wd, 1.0 - 0.4 * wd * wd, aim) * (1.0 - smoothstep(60.0, 110.0, rs * d));
              sh += uShaftC * uShaftP[i].w * (pool * 0.5 + path * 0.55 * (0.3 + 0.7 * fres) * (0.4 + 1.2 * r3) / (1.0 + d * d / 90000.0));
            }
            col += sh;
            // THE RING'S LIGHT LIES MIRRORED: a broken path of glints on the water between the ring and whoever looks at it
            vec3 lr = vec3(uRing.x, uSeaY + uRing.w, uRing.y) - vW;
            // (glints: the fine ripples alone turn the mirror, so the path is made of sparks, not of patches)
            vec3 ng = normalize(vec3(-vS.y * 0.6 - (r3 - 0.5) * 0.5, 1.0, -vS.z * 0.6 - (r4 - 0.5) * 0.5)), rg = reflect(-v, ng); rg.y = abs(rg.y);
            float gr = pow(clamp(dot(rg, normalize(lr)), 0.0, 1.0), 260.0) / (1.0 + dot(lr, lr) / 160000.0);
            col += vec3(0.7, 1.0, 0.9) * 2.2 * gr;
            // the river's current: a pale road from the arch out to the ring, 20 m broad at the cataract and 52 m where it is spent, and
            // the foam of the river carried out on its first half
            vec2 pa = uPlume.xy, pb = uPlume.zw, ab = pb - pa; float tt = clamp(dot(q - pa, ab) / max(dot(ab, ab), 1e-3), 0.0, 1.1);
            float dl = length(q - (pa + ab * tt)), wpl = mix(20.0, 52.0, tt);
            float plume = smoothstep(wpl, wpl * 0.2, dl) * (1.0 - smoothstep(0.8, 1.0, tt));
            float streak = rsN(vec3(vec2(dot(q, normalize(ab)) * 0.035 - uTime * 0.45, dl * 0.9), 3.0));
            float foam = 0.3 * plume * smoothstep(0.62, 0.95, streak * 0.45 + rsN(vec3(q * 1.6 - vec2(uTime * 1.2, 0.0), 1.0)) * 0.6) * (1.0 - smoothstep(0.0, 0.3, tt));
            // drifting lights under the surface: slow pale lamps, each in its own cell
            vec2 cq = q / 46.0 + vec2(uTime * 0.012, 0.0), ci = floor(cq), cf = fract(cq);
            float lampA = 0.0;
            for (int j = 0; j < 2; j++) for (int i = 0; i < 2; i++) {
              vec2 o = vec2(float(i), float(j)), id = ci + o; float h1 = rsH1(id.x * 13.7 + id.y * 71.3), h2 = rsH1(id.x * 57.1 + id.y * 9.3);
              vec2 c = o + vec2(h1, h2) * 0.4 + 0.3 + 0.06 * vec2(sin(uTime * 0.2 + h1 * 40.0), cos(uTime * 0.17 + h2 * 40.0));
              float d = length(cf + (vec2(r1, r2) - 0.5) * 0.05 - c);
              lampA += step(0.45, h1) * (exp(-d * d * 600.0) + 0.25 * exp(-d * d * 70.0)) * (0.6 + 0.4 * sin(uTime * 0.7 + h2 * 30.0));
            }
            // the rare long creature: a pale line bending under the surface, swimming a circle about the ring
            vec2 tq = q - uTurn.xy; float ta = atan(tq.y, abs(tq.x) < 1e-4 ? 1e-4 : tq.x), tr = length(tq);
            float wd2 = abs(tr - uTurnR - 7.0 * sin(ta * 3.0 + uTime * 0.3));
            float worm = (smoothstep(2.6, 0.5, wd2) * (0.65 + 0.35 * sin(ta * 90.0)) + 0.22 * smoothstep(9.0, 2.0, wd2)) * smoothstep(-1.0, 0.2, sin(ta - uTurn.z)) * uTurn.w;
            col += uPhos * (lace * (0.9 + 0.5 * spark) + lampA * 1.3 * (1.0 - fres)) + vec3(0.8, 1.0, 0.95) * foam * 0.5 + vec3(0.75, 0.95, 0.9) * worm * 1.05;
            col += uIceGlow * plume * (0.07 + 0.03 * streak) * (0.5 + 0.5 * n.y);
            // the thunder of white at the cataract's foot (0.8 fall heights round the foot's line), and the ring's light lying on the water
            float fd = length(vec2(q.x - uFoot.x, max(abs(q.y - uFoot.y) - uFoot.w, 0.0)));
            float boil = smoothstep(uFoot.z * 0.8, uFoot.z * 0.2, fd), churn = rsN(vec3(q * 0.18 + vec2(uTime * 0.5, 0.0), uTime * 0.7)) * 0.6 + rsN(vec3(q * 0.55 + 4.0, uTime * 1.6)) * 0.4;
            float foamA = smoothstep(0.75 - 0.75 * boil, 0.95 - 0.7 * boil, churn) * smoothstep(0.0, 0.1, boil) * (0.35 + 0.65 * boil);
            col = mix(col, vec3(0.9, 1.0, 0.98) * (0.75 + 0.35 * churn), clamp(foamA, 0.0, 1.0));
            // the shore: the swell breaks pale along the foot of the hall's wall, and the water there is lit from within
            float hx = uHall.x - q.x, rho = length(vec2(hx / (hx >= 0.0 ? uHall.z : uHall.w), (q.y - uHall.y) / uHallW));
            float surf = smoothstep(0.82, 0.96, rho + 0.06 * (churn - 0.5));
            col += vec3(0.8, 1.0, 0.96) * 0.45 * surf * smoothstep(0.5, 0.85, churn + 0.3 * surf) + uBelowC * 0.1 * smoothstep(0.7, 0.95, rho);
            float rd = distance(q, uRing.xy) / uRing.z;
            col += vec3(0.55, 1.0, 0.86) * exp(-clamp(rd * rd * 4.0, 0.0, 30.0)) * (0.1 + 0.2 * fres + 0.9 * pow(r3, 3.0) * (0.4 + 0.6 * r1));
            gl_FragColor = vec4(col, 1.0);
            // the sea is lost in its own lit haze with distance (not in the cave's air, which the way is still in until the arch)
            gl_FragColor.rgb = mix(gl_FragColor.rgb, uSeaFog.rgb, 1.0 - exp(-min(uSeaFog.w * uSeaFog.w * dist * dist, 40.0)));
          }`,
      });
      const sea = new THREE.Mesh(geo, mat); sea.frustumCulled = false; sea.name = 'sunless-sea'; scene.add(sea); seaGroup.push(sea);
    }
    await ctx.yield();
    {
      // THE ROOF OF THE VAULT: rock in beds with veins and sheets of ice, lit from below by the sea and by the shafts; at each rift the
      // daylight is in the ice itself. Its mesh has thirteen lines across each rib (so a rib has its round) and lines 14 to 19 m apart
      // in the bays; across the hall a line every 14 m.
      const XS = [], WS = [], ribX = []; for (let k = ribK0; k <= ribK1; k++) ribX.push(RIB_X0 + k * RIB);
      for (let X = -44; X < ribX[0] - 17; X += 16) XS.push(X);
      ribX.forEach((rx, i) => {
        for (const t of [-16, -13, -10, -7.5, -5, -2.5, 0, 2.5, 5, 7.5, 10, 13, 16]) XS.push(rx + t);
        const next = i + 1 < ribX.length ? ribX[i + 1] : LEG + FAR + 90, n = Math.max(1, Math.round((next - rx - 32) / 16));
        for (let j = 1; j < n; j++) XS.push(rx + 16 + (next - rx - 32) * j / n);
      });
      for (let w = -RW - 56; w <= RW + 56.01; w += 14) WS.push(w);
      const P = [], I = [], nw = WS.length;
      // (the roof ends at the sea cliff: a point that would lie behind the cliff's sheet is drawn back to 1 m behind it)
      for (let i = 0; i < XS.length; i++) { if (i % 5 === 4) await ctx.yield(); const X = XS[i]; for (const w of WS) { const q = seaXZ(X, w), x = Math.min(q[0], wallX(q[1] - AZ) + 1); P.push(x, roofY(x, q[1]), q[1]); } }
      for (let i = 0; i < XS.length - 1; i++) for (let j = 0; j < nw - 1; j++) {
        const a = i * nw + j, b = a + nw;
        if (P[a * 3] === P[b * 3] && P[(a + 1) * 3] === P[(b + 1) * 3]) continue;                 // a cell wholly behind the cliff
        I.push(a, a + 1, b + 1, a, b + 1, b);
      }
      await ctx.yield();
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setIndex(I); g.computeVertexNormals();
      const mat = new THREE.ShaderMaterial({
        fog: false, side: THREE.DoubleSide, uniforms: { ...look, uSeaFog: seaU.uSeaFog, ...seaLight },
        vertexShader: /* glsl */`varying vec3 vW, vN;
          void main(){ vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; vN = normalize(mat3(modelMatrix) * normal); gl_Position = projectionMatrix * viewMatrix * w; }`,
        fragmentShader: /* glsl */`uniform vec3 uIceGlow, uIceDeep; uniform vec4 uSeaFog; uniform float uTime; varying vec3 vW, vN;
          ${GLSL_N3}
          ${GLSL_SEA_LIGHT}
          void main(){
            vec3 n = normalize(vN); if (n.y > 0.0) n = -n;
            float veins = rsF(vW * 0.012), blot = smoothstep(0.42, 0.75, rsF(vW * 0.0045 + 3.0)), seam = 1.0 - abs(rsN(vW * 0.03 + 9.0) * 2.0 - 1.0);
            float bed = fract(vW.y * 0.11 + 2.0 * rsN(vW * 0.02)), bedL = smoothstep(0.0, 0.12, bed) * smoothstep(1.0, 0.8, bed);
            vec3 rock = mix(vec3(0.15, 0.115, 0.125), vec3(0.3, 0.235, 0.24), veins) * (0.72 + 0.28 * bedL) * (0.8 + 0.4 * rsN(vW * 0.21));
            vec3 ice = mix(uIceDeep, uIceGlow, 0.35 + 0.4 * veins) * vec3(0.75, 0.9, 1.0) * 0.8;
            vec3 col = mix(rock, ice, clamp(blot * 0.9 + 0.5 * pow(clamp(seam, 0.0, 1.0), 5.0), 0.0, 1.0)) * (0.17 + rsSeaLight(vW, n, uTime));
            // THE RIFTS: a patch of thin ice over each shaft, 2.7 radii long down the hall and 1.5 broad, brightest along its cracks
            float crackR = pow(clamp(1.0 - abs(rsN(vW * 0.09 + 5.0) * 2.0 - 1.0), 0.0, 1.0), 6.0);
            for (int i = 0; i < 5; i++) {
              float d = length((vW.xz - uShaftP[i].xy) * vec2(0.55, 1.0)) / uShaftP[i].z;
              col += uShaftC * uShaftP[i].w * (1.0 - smoothstep(0.7, 1.5, d)) * (0.5 + 1.7 * crackR + 0.5 * veins);
            }
            float fd = length(cameraPosition - vW);
            gl_FragColor = vec4(mix(col, uSeaFog.rgb, 1.0 - exp(-min(uSeaFog.w * uSeaFog.w * fd * fd, 40.0))), 1.0);
          }`,
      });
      const m = new THREE.Mesh(g, mat); m.name = 'vault-roof'; scene.add(m); seaGroup.push(m);
    }
    await ctx.yield();
    // a body of ice turned about an upright axis, appended to P, A, I: rows = [[radius, y, dx, dz], ...] from foot to head in metres (dx, dz: that
    // row's middle off the axis); its sides wander by `wob`
    // With `step` (metres) the body takes form at the metre's scale: a row every `step` of height, each second row standing out as a drip
    // ledge (a twentieth of the radius, never the same from ledge to ledge), and seven flutes down the body, a twelfth of the radius deep.
    // `inner` is the light inside the ice (0 to 1), given to every point of the body.
    const lathePut = (P, A, I, x, z, rows0, sides, wob, ph, step = 0, inner = 0) => {
      let rows = rows0;
      if (step > 0) {
        rows = [];
        for (let j = 0; j < rows0.length - 1; j++) {
          const a = rows0[j], b = rows0[j + 1], nn = Math.max(1, Math.round(Math.abs(b[1] - a[1]) / step));
          for (let k = 0; k < nn; k++) { const f = k / nn; rows.push([lerp(a[0], b[0], f), lerp(a[1], b[1], f), lerp(a[2] || 0, b[2] || 0, f), lerp(a[3] || 0, b[3] || 0, f)]); }
        }
        rows.push(rows0[rows0.length - 1]);
      }
      const base = P.length / 3, n = rows.length;
      for (let j = 0; j < n; j++) for (let k = 0; k <= sides; k++) {
        const a = (k % sides) / sides * TAU, t = j / (n - 1);
        let r = rows[j][0] * (1 + wob * Math.sin(a * 3 + t * 5 + ph) + 0.5 * wob * Math.sin(a * 7 + 2 + ph));
        if (step > 0) r *= 1 - 0.085 * (1 - Math.pow(Math.abs(Math.sin(a * 3.5 + ph + 0.5 * Math.sin(rows[j][1] * 0.045 + ph))), 0.6)) + (j % 2 ? 0.05 : -0.02) * (0.6 + 0.8 * N.n2(j * 1.7 + ph * 3, a * 0.8 + x * 0.01));
        P.push(x + (rows[j][2] || 0) + Math.cos(a) * r, rows[j][1], z + (rows[j][3] || 0) + Math.sin(a) * r); A.push(0.1 + 0.2 * Math.sin(t * 9 + a + ph), 0.85 + 0.15 * t, inner);
      }
      for (let j = 0; j < n - 1; j++) for (let k = 0; k < sides; k++) { const p = base + j * (sides + 1) + k, q = p + sides + 1; I.push(p, q, q + 1, p, q + 1, p + 1); }
    };
    // an arch of ice from foot A to foot B: a tube along half an ellipse, ra and rb thick at its feet and 0.55 of that at its crown, whose middle
    // line stands crownY high; `skew` shifts the crown toward B. Appends to P, A, I. Like the pillars it has form at the metre's scale: a
    // ring of its body every 3 m or so, each second one standing out as a drip ledge, seven flutes along it, and its underside hung with
    // a ragged keel of ice (to a fifth of its thickness).
    const archIce = (P, A, I, ax, az, bx, bz, ra, rb, crownY, footY, skew, inner = 0) => {
      const NA = 48, NS = 18, base = P.length / 3, L = Math.hypot(bx - ax, bz - az), ux = (bx - ax) / L, uz = (bz - az) / L;
      const mid = (t) => { const th = Math.PI * t; return [L / 2 * (1 - Math.cos(th)) + skew * L * 0.15 * Math.sin(th), footY + (crownY - footY) * Math.sin(th)]; };
      for (let i = 0; i <= NA; i++) {
        const t = i / NA, c = mid(t), c0 = mid(Math.max(0, t - 0.01)), c1 = mid(Math.min(1, t + 0.01)), tl = Math.hypot(c1[0] - c0[0], c1[1] - c0[1]) || 1, ta = (c1[0] - c0[0]) / tl, ty = (c1[1] - c0[1]) / tl;
        const r = lerp(ra, rb, t) * (0.55 + 0.45 * Math.abs(Math.cos(Math.PI * t)));
        for (let k = 0; k <= NS; k++) {
          const ph = (k % NS) / NS * TAU, keel = Math.pow(Math.max(0, -Math.sin(ph)), 6) * (0.08 + 0.14 * Math.abs(N.n2(i * 0.9 + ax * 0.01, 4.4 + az * 0.01)));
          const rr = r * (1 + 0.15 * Math.sin(ph * 3 + i * 0.45) - 0.085 * (1 - Math.pow(Math.abs(Math.sin(ph * 3.5 + 0.6 * Math.sin(i * 0.2))), 0.6)) + (i % 2 ? 0.05 : -0.02) * (0.6 + 0.8 * N.n2(i * 1.7, ph * 0.8 + ax * 0.01)) + keel), n1 = Math.cos(ph) * rr, n2 = Math.sin(ph) * rr;
          // across the arch (level), and in its own plane square to its line
          const al = c[0] - ty * n2, y = c[1] + ta * n2;
          P.push(ax + ux * al - uz * n1, y, az + uz * al + ux * n1); A.push(0.1 + 0.2 * Math.sin(t * 7 + ph), 0.9, inner);
        }
      }
      for (let i = 0; i < NA; i++) for (let k = 0; k < NS; k++) { const p = base + i * (NS + 1) + k, q = p + NS + 1; I.push(p, q, q + 1, p, q + 1, p + 1); }
    };
    // WHAT STANDS IN THE SEA (one mesh of ice): the frozen fall, the ring's gate, the pillars. feet: [x, z, radius] of every foot in the water.
    const PP = [], PA = [], PI = [], feet = [], curtains = [], stand = [];
    // (part(): what has been put since the last call is one thing: its triangles from index i0 to i1, and the place the sea's
    // test gives for the boxes of its own points)
    const seaParts = []; let partV = 0, partI = 0;
    const part = () => { const v1 = PP.length / 3; if (PI.length > partI) seaParts.push({ i0: partI, i1: PI.length, at: seaFrom(boxesOf(PP.slice(partV * 3, v1 * 3))) }); partV = v1; partI = PI.length; };
    // half the hall's breadth at X (its shore)
    const shoreW = (X) => RW * Math.sqrt(Math.max(0, 1 - ((X - XO) / (X >= XO ? RA : RB)) ** 2));
    {
      // THE FROZEN FALL: a cascade of ice from 5 m inside the roof down into the sea. In plan it is a long oval whose broad face is
      // turned toward the arch and toward the way (its long axis lies at 45 degrees to the leg): 1.25 FF_R by 0.7 FF_R at its foot
      // (a fifth more at its skirt on the water), 0.8 by 0.32 under the roof. It comes down in four tiers, each standing out over
      // the one above it and cut under at its lip, and in pipes (34 about it, deepest low down, shifted from tier to tier); a lesser
      // fall, 0.6 of it, stands fused to its far end. Light is in its ice.
      const one = async (X, w, R, ph, tiers) => {
        const yT = roofAt(X, w) + 5, y0 = SEA - 6, Hh = yT - y0, NS = 96, NR = Math.max(12, Math.round(Hh / 2)), base = PP.length / 3, q2 = Math.SQRT1_2;
        for (let j = 0; j <= NR; j++) {
          if (j % 12 === 11) await ctx.yield();
          const t = j / NR, tier = tiers.filter((q) => t > q).length;
          let k = 1 + 0.2 * Math.pow(Math.max(0, 1 - t / 0.07), 2);
          for (const q of tiers) { const d = (t - q) / 0.045; k *= 1 + 0.16 * Math.exp(-d * d) * (d < 0 ? 1 : 0.35) - 0.08 * Math.exp(-2 * (d - 1.2) * (d - 1.2)); }
          const rA = R * k * lerp(1.25, 0.8, Math.pow(t, 0.8)), rB = R * k * lerp(0.7, 0.32, Math.pow(t, 0.6));
          for (let i = 0; i <= NS; i++) {
            const a = (i % NS) / NS * TAU, pipe = Math.pow(Math.abs(Math.sin(a * 17 + ph + tier * 1.3 + 0.5 * Math.sin(t * 9 + ph))), 0.7);
            const m = 1 + (0.06 + 0.07 * (1 - t)) * (pipe - 0.5) + 0.05 * N.n2(a * 2.2 + ph, t * 7 + X * 0.01), u = Math.cos(a) * rA * m, v = Math.sin(a) * rB * m;
            const q = seaXZ(X + (u + v) * q2, w + (v - u) * q2);
            PP.push(q[0], y0 + Hh * t, q[1]); PA.push(0.22 + 0.3 * pipe, 0.88 + 0.12 * t, 0.5 * (0.55 + 0.45 * Math.sin(Math.PI * t)) * (0.6 + 0.4 * pipe));
          }
        }
        for (let j = 0; j < NR; j++) for (let i = 0; i < NS; i++) { const p = base + j * (NS + 1) + i, q = p + NS + 1; PI.push(p, q, q + 1, p, q + 1, p + 1); }
        for (const e of [-0.6, 0, 0.6]) { const c = seaXZ(X + e * R * 1.25 * q2, w - e * R * 1.25 * q2); feet.push([c[0], c[1], R * 0.95]); }
        stand.push([X, w, R * 1.55]);
      };
      const tiers = [ffr.range(0.16, 0.22), ffr.range(0.36, 0.44), ffr.range(0.58, 0.66), ffr.range(0.8, 0.86)];
      await one(FF_X, FF_W, FF_R, ffr.range(0, TAU), tiers); part();
      await ctx.yield();
      await one(FF_X + FF_R * 1.3 * Math.SQRT1_2 + FF_R * 0.25, FF_W - FF_R * 1.3 * Math.SQRT1_2 + FF_R * 1.1, FF_R * 0.6, ffr.range(0, TAU), tiers.map((q) => q * 0.9 + 0.03)); part();
    }
    await ctx.yield();
    // THE RING'S GATE: two piers of ice from the sea to the roof, GATE_HALF to each side of the leg's line (31 to 35 m; the ring's rim is
    // 13 m in radius), their middles GATE_BACK (7 m) behind the ring's plane, and an arch between them whose underside stands some 17 m and more over the
    // ring's top (18 m by its line; its keel hangs a metre lower in places). The way ends at the ring: it never passes between the piers or under the arch. (stream 'ring-gate')
    const gtr = RN['ring-gate'], GATE_HALF = gtr.range(31, 35);
    {
      const pier = [];
      for (const sd of [-1, 1]) {
        const R = gtr.range(9, 11), c = seaXZ(RIB_X0, sd * GATE_HALF), y0 = SEA - 6, y1 = roofAt(RIB_X0, sd * GATE_HALF) + 8, Hh = y1 - y0, rows = [];
        for (const [t, k] of [[0, 1.5], [0.05, 1.22], [0.14, 1.02], [0.3, 0.94], [0.55, 0.9], [0.78, 1.0], [0.92, 1.3], [1, 1.75]]) rows.push([R * k, y0 + Hh * t]);
        lathePut(PP, PA, PI, c[0], c[1], rows, 28, 0.1, gtr.range(0, TAU), 2.5, 0.22); part();
        feet.push([c[0], c[1], R * 1.25]); stand.push([RIB_X0, sd * GATE_HALF, R * 1.5]); pier.push([c[0], c[1], R]);
      }
      const ra = pier[0][2] * 0.72, rb = pier[1][2] * 0.72;
      archIce(PP, PA, PI, pier[0][0], pier[0][1], pier[1][0], pier[1][1], ra, rb, SEA + RING_H + RING_R + 18 + 0.55 * 1.15 * Math.max(ra, rb), SEA + 12, gtr.range(-0.2, 0.2), 0.22); part();
    }
    await ctx.yield();
    // THE PILLARS, each in a place of its own by a rule that cannot fail (no place is tried and thrown away): five by the way (two on
    // the hand's side, before and beyond the frozen fall; three on the other), their feet 60 m and more from the leg's line; eight in
    // the middle distance (four stations down the hall, one to each side, 140 to 280 m aside); ten far ones along the shore. A place
    // that is shut by the shore, the cliff or the cataract's pool, or lies within 30 m of what already stands (the frozen fall, the
    // gate's piers, a pillar placed before it), is left empty: about half of the twenty-three places hold a pillar on a visit.
    const pillars = [];
    {
      const pr = RN.pillars, put = (X, w, rad, ring) => {
        const [x, z] = seaXZ(X, w);
        if (Math.abs(w) + rad * 1.9 > shoreW(X) - 24 || inPool(x, z, rad * 1.9 + 12) || x > wallX(z - AZ) - rad * 1.9 - 25) return;
        if (stand.some((q) => Math.hypot(q[0] - X, q[1] - w) < q[2] + rad * 1.9 + 30)) return;
        pillars.push({ x, z, rad, top: roofY(x, z) + 8, ring }); stand.push([X, w, rad * 1.9]);
      };
      for (const [sd, f] of [[1, 0.16], [1, 0.84], [-1, 0.3], [-1, 0.55], [-1, 0.78]]) { const rad = pr.range(8, 11); put(LEG * (f + pr.range(-0.04, 0.04)), sd * (60 + rad * 1.9 + pr.range(0, 40)), rad, 0); }
      for (let i = 0; i < 4; i++) for (const sd of [-1, 1]) { const rad = pr.range(10, 17), X = lerp(60, LEG + 0.5 * FAR, (i + 0.5 + pr.range(-0.3, 0.3)) / 4); put(X, sd * pr.range(sd > 0 && Math.abs(X - FF_X) < 110 ? 215 : 140 + rad * 1.9, 280), rad, 1); }
      for (let i = 0; i < 5; i++) for (const sd of [-1, 1]) { const rad = pr.range(12, 20), X = lerp(100, LEG + FAR - 80, (i + 0.5 + pr.range(-0.3, 0.3)) / 5), sw = shoreW(X); put(X, sd * sw * pr.range(0.66, 0.86), rad, 2); }
    }
    {
      // four kinds of pillar, each one's shape drawn for itself (stream 'pillar-shapes'): 0 a stack of drums, 1 a fused pair, 2 a waisted
      // one (ice from the roof meeting ice from the sea), 3 a broken stump awash with its other half hanging from the roof. The five by
      // the way take the kinds in turn from a dealt order. Each has its foot in the water (6 m under it) and its head in the roof.
      const sr = RN['pillar-shapes'], kinds = [0, 1, 2, 3];
      for (let i = 3; i > 0; i--) { const j = sr.int(0, i), t = kinds[i]; kinds[i] = kinds[j]; kinds[j] = t; }
      { let nNear = 0; for (const p of pillars) p.kind = p.ring === 0 ? kinds[nNear++ % 4] : sr.int(0, 3); }
      const flare = (t, head) => 1 + 0.45 * Math.pow(Math.max(1 - 2 * t, 0), 3) + head * Math.pow(Math.max(2 * t - 1, 0), 3);
      let nPil = 0;
      for (const p of pillars) {
        ++nPil; await ctx.yield();
        const y0 = SEA - 6, y1 = p.top, H = y1 - y0, R = p.rad, ph = sr.range(0, TAU), rows = [];
        // (the five by the way in fine form: 24 sides and a row each 3 m; the middle ones 16 and 5 m; the far ones 10 sides)
        const SIDES = p.ring === 0 ? 24 : p.ring === 1 ? 16 : 10, STEP = p.ring === 0 ? 3 : p.ring === 1 ? 5 : 0, inn = p.ring === 0 ? 0.16 : 0.08;
        if (p.kind === 0) {
          const nD = sr.int(3, 5), cut = [0]; for (let i = 1; i <= nD; i++) cut.push(cut[i - 1] + sr.range(0.7, 1.3));
          for (let i = 0; i < nD; i++) {
            const ta = cut[i] / cut[nD], tb = cut[i + 1] / cut[nD], g = R * sr.range(0.8, 1.15);
            for (const [f, k] of [[0, 0.74], [0.14, 1], [0.5, 1.05], [0.86, 1], [1, 0.74]]) { if (i && !f) continue; const t = lerp(ta, tb, f); rows.push([g * k * flare(t, 0.6) * ((!i && !f) || (i === nD - 1 && f === 1) ? 1.35 : 1), y0 + H * t]); }
          }
          lathePut(PP, PA, PI, p.x, p.z, rows, SIDES, 0.1, ph, STEP, inn); feet.push([p.x, p.z, R * 1.3]);
        } else if (p.kind === 1) {
          const dir = sr.range(0, TAU), d = R * 0.8, tJ = sr.range(0.45, 0.65), rowsB = [], cx = Math.cos(dir), cz = Math.sin(dir);
          for (let j = 0; j <= 12; j++) { const t = j / 12, off = d * (1 - sst(0.1, tJ, t)); rows.push([R * (0.62 + 0.3 * sst(tJ - 0.1, tJ + 0.1, t)) * flare(t, 0.9), y0 + H * t, cx * off, cz * off]); }
          for (let j = 0; j <= 8; j++) { const t = j / 8 * (tJ + 0.05), off = -d * (1 - sst(0.1, tJ, t)); rowsB.push([R * 0.56 * (1 - 0.25 * t / tJ) * flare(t, 0), y0 + H * t, cx * off, cz * off]); }
          lathePut(PP, PA, PI, p.x, p.z, rows, SIDES, 0.12, ph, STEP, inn); lathePut(PP, PA, PI, p.x, p.z, rowsB, SIDES, 0.12, ph + 2, STEP, inn);
          feet.push([p.x + cx * d, p.z + cz * d, R * 0.85], [p.x - cx * d, p.z - cz * d, R * 0.78]);
        } else if (p.kind === 2) {
          const tW = sr.range(0.35, 0.6), span = Math.max(tW, 1 - tW);
          for (let j = 0; j <= 14; j++) { const t = j / 14; rows.push([R * (0.5 + 0.85 * Math.pow(Math.abs(t - tW) / span, 1.8)), y0 + H * t]); }
          lathePut(PP, PA, PI, p.x, p.z, rows, SIDES, 0.14, ph, STEP, inn); feet.push([p.x, p.z, rows[1][0] * 1.05]);
        } else {
          const hS = sr.range(7, 16), tilt = sr.range(0, TAU), hang = H * sr.range(0.2, 0.35), up = [], cx = Math.cos(tilt) * R, cz = Math.sin(tilt) * R;
          for (const [k, yy, lean] of [[1.45, y0, 0], [1.25, SEA, 0], [1.05, SEA + hS * 0.6, 0], [0.9, SEA + hS, 0.1], [0.5, SEA + hS + R * 0.25, 0.35], [0.02, SEA + hS + R * 0.1, 0.45]]) rows.push([R * k, yy, cx * lean, cz * lean]);
          for (let j = 0; j <= 7; j++) { const t = j / 7; up.push([R * (0.03 + 1.3 * Math.pow(t, 1.5)), y1 - hang * (1 - t)]); }
          lathePut(PP, PA, PI, p.x, p.z, rows, SIDES, 0.16, ph, STEP, inn); lathePut(PP, PA, PI, p.x, p.z, up, SIDES, 0.16, ph + 1, STEP, inn); feet.push([p.x, p.z, R * 1.3]);
        }
        part();
      }
      await ctx.yield();
      const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.Float32BufferAttribute(PP, 3)); pg.setAttribute('aIce', new THREE.Float32BufferAttribute(PA, 3)); pg.setIndex(PI);
      await ctx.yield();
      pg.computeVertexNormals();
      await ctx.yield();
      // EACH THING OF THIS MESH (the frozen fall, its lesser fall, each pier, the gate's arch, each pillar) HAS ITS OWN PLACE,
      // from the sea's test asked for its own boxes; the triangles go in the order of those places (the points and their normals
      // stay as they were made) and the mesh draws as far as the way has come (seaShown). COUNTED on 300 visits: 12 to 21 things
      // a visit (5,129 in all); none to three of them come on with the sea; where the gardens go off 27 to 77 in a hundred of the
      // mesh's triangles are drawn (9,032 to 31,848 are not yet); the last thing comes on 16 to 40 m before the arch. With the
      // mesh drawn whole from its first thing's place, the thickest visit had 501,426 triangles in the lens 21 m before the mouth.
      part();
      const things = seaParts.slice().sort((a, b) => a.at - b.at), PJ = new (PP.length / 3 > 65535 ? Uint32Array : Uint16Array)(PI.length), ends = [];
      { let n = 0; for (const q of things) { for (let k = q.i0; k < q.i1; k++) PJ[n++] = PI[k]; ends.push(n); } }
      pg.setIndex(new THREE.BufferAttribute(PJ, 1));
      const pm = new THREE.Mesh(pg, seaIce); pm.frustumCulled = false; pm.name = 'sea-pillars'; scene.add(pm); seaThings.push([pm, things[0].at]);
      seaParted.push({ geo: pg, at: things.map((q) => q.at), end: ends, k: 0 }); seaShown(seaParted[seaParted.length - 1], 0);
      await ctx.yield();
    }
    {
      // ICE HANGING IN ROWS: under every rib of the vault a row of hanging ice from shore to shore, a group each 22 to 36 m: one long piece with two
      // to four lesser ones against it. Within 60 m of the leg's line the long piece is 9 to 16 m (the roof there stands some 70 m and more over the
      // sea, the way 52 m and less), elsewhere 14 to 34 m, one in five a third longer. A piece is left out where any part of it would
      // come within 9 m of the way, or where it would stand behind the cliff. (stream 'hanging')
      const hr = RN.hanging, nH = 640, mesh = new THREE.InstancedMesh(icicleGeometry(0, 5), seaIce, nH), iA = Math.floor(M.arch / LS);
      const m4 = new THREE.Matrix4(), q4 = new THREE.Quaternion(), e3 = new THREE.Euler(), v3 = new THREE.Vector3(), s3 = new THREE.Vector3();
      let n = 0;
      const hangBoxes = [];                                              // (a box to each piece, for the place it is drawn from)
      const put = (X, w, len, wd) => {
        const [x, z] = seaXZ(X, w), y = roofAt(X, w) + 2, ry = hr.range(0, TAU), rx = hr.range(-0.03, 0.03), rz = hr.range(-0.03, 0.03);
        if (n >= nH || x > wallX(z - AZ) - 12) return;
        for (let k = 0; k <= 5; k++) { const t = k / 5; if (lane3(x, y - len * t, z, iA) < 9 + 0.09 * wd * Math.pow(1 - t, 1.25) * 1.35) return; }
        q4.setFromEuler(e3.set(rx, ry, rz)); m4.compose(v3.set(x, y, z), q4, s3.set(wd, len, wd)); mesh.setMatrixAt(n++, m4);
        hangBoxes.push([x - 0.13 * wd, x + 0.13 * wd, y - len, y, z - 0.13 * wd, z + 0.13 * wd]);
      };
      for (let k = ribK0; k <= ribK1; k++) {
        await ctx.yield();
        const Xr = RIB_X0 + k * RIB, sw = shoreW(Xr) - 26;
        for (let w = -sw + hr.range(0, 20); w < sw; w += hr.range(22, 36)) {
          const X = Xr + 6 * Math.sin(w * 0.012 + k * 1.7) + hr.range(-3, 3), len = Math.abs(w) < 60 ? hr.range(9, 16) : hr.range(14, 34) * (hr.chance(0.2) ? 1.33 : 1), wd = len * hr.range(0.6, 1.0), rad = wd * 0.09;
          put(X, w, len, wd);
          for (let c = hr.int(2, 4); c > 0; c--) { const b = hr.range(0, TAU), l2 = len * hr.range(0.3, 0.8); put(X + Math.cos(b) * rad * 1.3, w + Math.sin(b) * rad * 1.3, l2, l2 * hr.range(0.6, 1.0)); }
        }
      }
      mesh.count = n; mesh.instanceMatrix.needsUpdate = true; mesh.frustumCulled = false; mesh.name = 'hanging-ice'; scene.add(mesh); seaThings.push([mesh, seaFrom(hangBoxes)]);
      // (its far shape: each piece changes at the place its own box is first reached through the arch, so that none changes in sight;
      // by distance, as the caverns' pieces, only if the sea is drawn from the first frame)
      { const far = withFar(mesh, icicleFarGeometry(0, 5), K_SEA, seaAlways ? null : hangBoxes.map((b) => seaFrom([b]))); scene.add(far); seaThings.push([far, seaThings[seaThings.length - 1][1]]); }
      await ctx.yield();
      // THE SHORE: the hall's wall of ice all round the water, from 6 m under the sea to 6 m inside the roof; it stands on the hall's
      // oval, in buttresses 48 m apart that stand 16 m proud at the water and lean back to the roof, with flutes between them. What
      // would lie behind the cliff is left out.
      {
        const per = TAU * 0.5 * (0.5 * (RA + RB) + RW), geo = await iceSheetGeometry(320, 8, (u, v) => {
          const a = u * TAU - Math.PI, s = u * per, r = shoreR(a) + 26 * N.fbm2(Math.cos(a) * 3 + 9, Math.sin(a) * 3 + 2, 3) - (16 - 14 * v) * Math.pow(Math.abs(Math.sin(s * Math.PI / 48)), 2.2) - 2.5 * Math.pow(Math.abs(Math.sin(s * Math.PI / 6)), 2) + 7 * v * v;
          const X = XO + Math.cos(a) * r, w = Math.sin(a) * r, [x, z] = seaXZ(X, w), top = roofAt(X, w) + 6;
          return { p: [x, lerp(SEA - 6, top, v), z], hole: x > wallX(z - AZ) + 8, ice: [0.25 + 0.2 * Math.pow(Math.abs(Math.sin(s * Math.PI / 48)), 2.2), 0.75 + 0.2 * (1 - v), 0.1 * (1 - v)] };
        }, ctx.yield, 80);
        const shore = new THREE.Mesh(geo, seaIce); shore.name = 'shore'; shore.frustumCulled = false; scene.add(shore); seaThings.push([shore, seaFrom(boxesOf(geo.getAttribute('position').array))]);
      }
      await ctx.yield();
      // THE SHAFTS: under each rift the cold daylight comes down to the sea as rays, from the roof to the water, a little aslant (the
      // same slant for all five: one sky). A shaft's rays lie within its radius; the rifts' places are given above (THE RIFTS).
      for (let i = 0; i < SHAFTS.length; i++) {
        const q = SHAFTS[i], [x, z] = seaXZ(q[0], q[1]), top = roofAt(q[0], q[1]) + 6;
        const rays = fx.makeGodRays({ rng: RN['sea-shaft' + i], time: tU, position: [x, top, z], direction: [0.04, -1, 0.03], radius: q[2] * 0.8, count: 14, length: top - SEA + 2, width: [q[2] * 0.35, q[2] * 0.9],
          color: shaftCol, intensity: 0.75 * q[3], falloff: 0.4, fogAmount: 0.35 });
        rays.object.name = 'sea-shaft'; scene.add(rays.object); seaGroup.push(rays.object); seaFx.push(rays);
      }
      await ctx.yield();
    }
    {
      // THE RING STANDS FREE: nothing under it but the water, 5.5 m below its rim, lit by it; nothing over it nearer than the gate's
      // arch, some 17 m and more above its rim and 7 m behind its plane.
      // FOAM AND A GLOW AT EVERY FOOT: round each pillar, each pier and the frozen fall a ring of pale foam breaking
      // on the water (from 0.86 to 2 of the foot's radius), and under it the water lit from within, fading out to 3.2 radii
      const rgG = new THREE.RingGeometry(0.86, 3.2, 40, 5).rotateX(-Math.PI / 2), fg = new THREE.InstancedBufferGeometry();
      fg.setAttribute('position', rgG.getAttribute('position')); fg.setIndex(rgG.index);
      const fA = new Float32Array(feet.length * 3); feet.forEach((f, i) => fA.set(f, i * 3));
      fg.setAttribute('aF', new THREE.InstancedBufferAttribute(fA, 3)); fg.instanceCount = feet.length;
      const foamMat = new THREE.ShaderMaterial({
        fog: false, transparent: true, depthWrite: false, side: THREE.DoubleSide, uniforms: { ...look, ...seaU },
        vertexShader: /* glsl */`
          ${GLSL_SWELL}
          attribute vec3 aF; uniform float uSeaY; varying vec3 vW; varying float vR;
          #include <fog_pars_vertex>
          void main(){
            vR = length(position.xz); vec3 p = vec3(aF.x + position.x * aF.z, uSeaY, aF.y + position.z * aF.z); p.y += rsSwell(p.xz).x + 0.25; vW = p;
            vec4 mvPosition = viewMatrix * vec4(p, 1.0); gl_Position = projectionMatrix * mvPosition;
            #include <fog_vertex>
          }`,
        fragmentShader: /* glsl */`uniform vec3 uPhos, uBelowC; uniform vec4 uSeaFog; uniform float uTime; varying vec3 vW; varying float vR;
          #include <fog_pars_fragment>
          ${GLSL_N3}
          void main(){
            float k = (vR - 0.86) / 1.14, nz = rsN(vec3(vW.xz * 0.35, uTime * 0.5)) * 0.6 + rsN(vec3(vW.xz * 1.1 + 7.0, uTime * 0.9)) * 0.4;
            float a = smoothstep(0.0, 0.12, k) * smoothstep(1.0, 0.25, k) * smoothstep(0.3 + 0.35 * k, 0.75 + 0.2 * k, nz + 0.25 * sin(uTime * 0.8 - k * 6.0));
            float glow = 0.42 * exp(-max(vR - 0.86, 0.0) * 1.5) * smoothstep(3.2, 2.2, vR) * (0.7 + 0.3 * nz);
            if (a + glow < 0.004) discard;
            vec3 col = mix(uBelowC * 1.1, mix(uPhos, vec3(0.86, 1.0, 0.96), 0.55) * (0.75 + 0.75 * nz), a / max(a + glow, 1e-3));
            gl_FragColor = vec4(col, min(a * 0.9 + glow, 1.0));
            { float fd = length(cameraPosition - vW); gl_FragColor.rgb = mix(gl_FragColor.rgb, uSeaFog.rgb, 1.0 - exp(-min(uSeaFog.w * uSeaFog.w * fd * fd, 40.0))); }
            #include <fog_fragment>
          }`,
      });
      const foamRings = new THREE.Mesh(fg, foamMat); foamRings.frustumCulled = false; foamRings.renderOrder = 2; foamRings.name = 'foam-at-the-feet'; scene.add(foamRings);
      seaThings.push([foamRings, seaFrom(feet.map((f) => [f[0] - 3.2 * f[2], f[0] + 3.2 * f[2], SEA - 2, SEA + 3, f[1] - 3.2 * f[2], f[1] + 3.2 * f[2]]))]);
    }
    // BEYOND THE ICE, THE ROOF AND THE SHORE THERE IS ROCK, NOT SKY: whoever stands under the cliff sees, wherever a line of sight
    // finds no ice, the underground's own dark (a lit deep blue-green, paler low down). It is a rule of the place where one stands
    // (uRock: west of the cliff's foot line and under the mouth's crown; it closes over the first 30 m inside the mouth, the
    // mouth's lining), not of the flight: from under the sky the sky is seen.
    const vault = new THREE.Mesh(new THREE.SphereGeometry(3000, 32, 16), new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false, transparent: true, fog: false,
      uniforms: { uTime: look.uTime, uRock: { value: new THREE.Vector3(XC, 30, WY + MOUTH.top) }, uIceDeep: look.uIceDeep, uBase: { value: fogSea.clone() }, uPhos: seaU.uPhos },
      vertexShader: /* glsl */`varying vec3 vD; void main(){ vD = position; vec4 p = projectionMatrix * viewMatrix * vec4(position + cameraPosition, 1.0); if (abs(p.w) < 1e-4) p.w = 1e-4; gl_Position = p.xyww; }`,
      fragmentShader: /* glsl */`
        uniform float uTime; uniform vec3 uRock, uIceDeep, uBase, uPhos; varying vec3 vD;
        ${GLSL_N3}
        void main(){
          vec3 d = normalize(vD); float up = clamp(d.y, 0.0, 1.0);
          float veil = rsF(d * 2.2 + vec3(0.0, uTime * 0.01, 0.0));
          // rock in beds with veins, dim (the vault's own rock), under the haze
          float veins = rsF(d * 5.0 + 3.0), bed = fract(d.y * 9.0 + 1.5 * rsN(d * 3.0)), bedL = smoothstep(0.0, 0.12, bed) * smoothstep(1.0, 0.8, bed);
          vec3 rock = mix(vec3(0.15, 0.115, 0.125), vec3(0.3, 0.235, 0.24), veins) * (0.72 + 0.28 * bedL);
          vec3 col = uBase * (1.0 - 0.3 * up) + rock * 0.12 + uIceDeep * 0.1 * smoothstep(0.35, 0.8, veil) * (1.0 - 0.7 * up);
          col += uPhos * 0.05 * exp(-up * 10.0);
          gl_FragColor = vec4(col, smoothstep(0.0, uRock.y, uRock.x - cameraPosition.x) * step(cameraPosition.y, uRock.z));
        }`,
    }));
    vault.renderOrder = -0.9; vault.frustumCulled = false; vault.name = 'vault'; scene.add(vault);
    await ctx.yield();

    // THE HAZE IS THE PLACE'S OWN: the day's haze (the scene's fog, which never changes) lies on what stands under the sky. Nothing
    // underground takes it: the caverns' ice is lost in the caverns' own haze and the sea's things in the sea's (uniforms of their own),
    // and the water, the falls, the mist and the shafts of light down there take none.
    for (const set of [caveFront, caveThings.map((q) => q[0]), seaGroup, seaThings.map((q) => q[0])]) for (const o of set) o.traverse((q) => { for (const mt of [].concat(q.material || [])) if (mt.fog) mt.fog = false; });
    caveFront.push(poolBed);                                           // (after the line above: the bed lies under the open sky's water and keeps the gardens' haze, as the land does)

    // ---------- the flight ----------
    await sky.prewarm(ctx.renderer, null, scene);
    // THE GAZE'S PULLS: three, each between two places of the way and no two on together.
    // The fountain: from the start to the end of the pass round the vent. The column stands on the first straight's own line, so the pull
    // turns nothing there (and the engine's own guard brings every pull in from nothing over the first 0.04 of the way); it holds the
    // column through the swerve and the pass, where the vent stands square to the heading. Its weight is 0.6. The dome: from the
    // straightening (from there the dome stands on the river's line) until it stands 40 degrees overhead. The caverns' frozen fall:
    // below. All are made by poi() below, after the pace is found, and made again from the pace that is then flown (below).
    // The sea has none: its way is straight from the arch to the ring, and its frozen fall and the ring's gate stand in the gaze
    // without one.
    const FOUNT_AT = new THREE.Vector3(FV.x, FV.y + FOUNT_H / 2, FV.z);
    // The frozen fall of the caverns: its middle (16 m over the river there, 27 m left of the axis), from 60 m before the first fall's lip
    // (from there the eye looks over the lip at it) until it stands 60 degrees off the heading. Its weight is 0.4.
    const FROZEN_AT = (() => { const c = caveAt(S_FROZEN, -27); return new THREE.Vector3(c.x, upY(S_FROZEN) + 16, c.z); })();
    // THE PACE FOLLOWS THE GAZE'S BEND (one rule for the whole way; no table of paces between places). The gaze at a place is the engine's
    // own: the way's 30 m chord (lookAhead 30) turned toward each pull by the pull's weight there. The bend at a place is the angle between
    // the gazes 12 m before it and 12 m after it, in degrees a metre. The speed wanted there is the lesser of the stretch's top speed and
    // the speed at which that bend turns the gaze TURN_RATE (25 degrees a second).
    // The engine reads the pace at 65 places and eases the speed at 1.4 a second, so the speed flown at a place is the least wanted
    // within 30 m either side, averaged over 30 m either side; going back along the way the speed before a place is no more than a
    // steady slowing of BRAKE (16 m/s each second) reaches it from; and the speed asked is the least from a place to LATE (0.7 s) of
    // flight ahead (the easing is that much late).
    // THE TOP SPEEDS, by stretch: from the start to the middle of the pass the pass's own pace (TURN_RATE on the pass's circle); from
    // the straightening to the mouth (the gate, the dome in its arch, the pool) eleven twelfths of V_FAST; over the sunless sea, from
    // the arch to the ring, the flight's mean pace as flown (the mean divided by the engine's scale): the hall is crossed and the ring
    // come to unhurried; elsewhere V_FAST. V_FAST is not typed: it is the speed at which the whole flight, flown by this rule,
    // lasts its 50 s, looked for by ten halvings between the engine's own bounds for a pace (0.35 and 2.5 times the mean pace; the
    // engine cuts a pace off at those bounds, so a wider search would find nothing more). COUNTED on 300 visits: V_FAST is 1.08
    // to 2.50 mean paces. On 3 of them no speed under the upper bound gives 50 s: the search ends at the bound
    // (2.498 mean paces) and the engine scales every speed by 1.0 to 1.9 per cent. On the other 297 the scale the halvings
    // leave to the engine is 0.999 to 1.001.
    const TURN_RATE = 25, BRAKE = 16, LATE = 1 / 1.4, V_MEAN = PL / DUR, V_PASS = TURN_RATE * Math.PI / 180 * ROUND;
    const A_ = Math.round(30 / LS), H_ = Math.round(12 / LS), K_ = Math.round(30 / LS), bendAt = new Float32Array(NL + 1), gazeAt = new Float32Array((NL + 1) * 3);
    // the gaze at every place of the line as the engine aims it there (the 30 m chord, turned toward each pull by the pull's weight at that
    // place), and from it the bend: the angle between the gazes 12 m before a place and 12 m after it, in degrees a metre
    const gazeBend = (pulls) => {
      for (let i = 0; i <= NL; i++) {
        const a = Math.min(i, NL - A_), u = i / NL, guard = sst(0, 0.04, u) * (1 - sst(0.93, 0.985, u));
        let gx = lnx[a + A_] - lnx[a], gy = lny[a + A_] - lny[a], gz = lnz[a + A_] - lnz[a], l = Math.max(1e-6, Math.hypot(gx, gy, gz)); gx /= l; gy /= l; gz /= l;
        for (const q of pulls) {
          const w = bell(u, q.from, q.to, q.fade) * q.weight * guard; if (w <= 0.001) continue;
          const px = q.at.x - lnx[i], py = q.at.y - lny[i], pz = q.at.z - lnz[i], pl = Math.max(1e-6, Math.hypot(px, py, pz));
          gx = gx * (1 - w) + px / pl * w; gy = gy * (1 - w) + py / pl * w; gz = gz * (1 - w) + pz / pl * w; l = Math.max(1e-6, Math.hypot(gx, gy, gz)); gx /= l; gy /= l; gz /= l;
        }
        gazeAt[i * 3] = gx; gazeAt[i * 3 + 1] = gy; gazeAt[i * 3 + 2] = gz;
      }
      for (let i = 0; i <= NL; i++) {
        const a = Math.max(0, i - H_) * 3, b = Math.min(NL, i + H_) * 3, c = gazeAt[a] * gazeAt[b] + gazeAt[a + 1] * gazeAt[b + 1] + gazeAt[a + 2] * gazeAt[b + 2];
        bendAt[i] = Math.acos(clamp(c, -1, 1)) * 180 / Math.PI / Math.max(LS, (b - a) / 3 * LS);
      }
    };
    const paceFor = (vFast, want, slow, v) => {
      for (let i = 0; i <= NL; i++) {
        const m = i * LS, top = m >= M.arch ? Math.min(vFast, V_MEAN / lastK) : m >= M.straight && m <= M.mouth ? vFast * 11 / 12 : m <= M.fount ? V_PASS : vFast;
        want[i] = Math.min(top, TURN_RATE / Math.max(bendAt[i], 1e-6));
      }
      for (let i = 0; i <= NL; i++) { let w = 1e9; for (let k = Math.max(0, i - K_); k <= Math.min(NL, i + K_); k++) w = Math.min(w, want[k]); slow[i] = w; }
      // the speed falls at a steady slowing of BRAKE (16 m/s each second) into every place
      for (let i = NL - 1; i >= 0; i--) slow[i] = Math.min(slow[i], Math.sqrt(slow[i + 1] * slow[i + 1] + 2 * BRAKE * LS));
      for (let i = 0; i <= NL; i++) { let w = 0, c = 0; for (let k = Math.max(0, i - K_); k <= Math.min(NL, i + K_); k++) { w += slow[k]; c++; } v[i] = w / c; }
      // the engine's easing follows a falling speed LATE (0.7 s) behind: the speed asked at a place is the least from there to LATE of flight ahead
      for (let i = 0; i <= NL; i++) { let w = v[i]; for (let k = i + 1, k1 = Math.min(NL, i + Math.ceil(v[i] * LATE / LS)); k <= k1; k++) w = Math.min(w, v[k]); want[i] = w; }
      return want;
    };
    const paceTab = new Float32Array(NL + 1);
    const paceM = (m) => { const f = clamp(m / LS, 0, NL - 1e-3), i = Math.floor(f); return lerp(paceTab[i], paceTab[i + 1], f - i) / (PL / DUR); };
    // (the engine's own sum over its 65 readings of the pace: by how much it would scale the speeds)
    const scaleOf = () => { let k = 0; for (let i = 0; i < 64; i++) k += 2 / (clamp(paceM(i / 64 * PL), 0.35, 2.5) + clamp(paceM((i + 1) / 64 * PL), 0.35, 2.5)) / 64; return k; };
    let V_FAST = V_MEAN, paceK = 1, lastK = 1;
    const slowT = new Float32Array(NL + 1), vT = new Float32Array(NL + 1);
    const findFast = (halvings) => {
      lastK = 1; let lo = 0.35 * V_MEAN, hi = 2.5 * V_MEAN; for (let it = 0; it < halvings; it++) { V_FAST = (lo + hi) / 2; paceFor(V_FAST, paceTab, slowT, vT); paceK = scaleOf(); if (paceK > 1) lo = V_FAST; else hi = V_FAST; }
      for (let it = 0; it < 2 && paceK > 1; it++) { lastK = paceK; paceFor(V_FAST, paceTab, slowT, vT); paceK = scaleOf(); }
    };
    gazeBend([]); findFast(6);
    await ctx.yield();
    const speedAt = (m) => PL / DUR * clamp(paceM(m), 0.35, 2.5) * paceK;
    // a pull between two places: each of its fades is made 1.6 s long at 1.1 times the fastest pace asked inside it (the margin: the
    // eased speed runs over the asked pace where the pace falls into a pull), and the pull is at least two fades long (widened about its middle)
    const poi = (at, from, to, weight, fadeS = 1.6) => {
      to = Math.min(to, PL); from = Math.max(0, Math.min(from, to));
      let v = speedAt(to); for (let m = from; m < to; m += 10) v = Math.max(v, speedAt(m));
      const fadeM = fadeS * 1.1 * v, half = Math.max((to - from) / 2, fadeM), mid = (from + to) / 2;
      from = Math.max(0, mid - half); to = Math.min(PL, from + 2 * half); from = Math.max(0, to - 2 * half);
      return { at, from: from / PL, to: to / PL, fade: clamp(fadeM / Math.max(to - from, 1), 0.05, 0.5), weight };
    };
    // THE FADES ARE MADE FROM THE PACE THAT IS FLOWN. The pulls bend the gaze, the pace slows where they bend it, and the search
    // then raises V_FAST to keep the 50 s: fades made once, from the pace before the pulls, were flown faster than they were made for.
    // So the pulls are made and the pace found, and both again, a fixed three times over, each time from the pace the last search
    // gave. COUNTED (replayed at 1/60 s with the engine's own bell, pace and easing, 300 visits): three times over at the asked
    // pace alone left one fade of 1.499 s (the frozen fall's pull begins where the flight is still slowing, and the eased
    // speed is over the asked one), so the fades are made for 1.1 times the asked pace (poi, above); with that a pull rises in
    // 1.64 to 3.57 s and lets go in 1.75 to 3.36 s (the fountain's 2.14 to 3.57 and 2.02 to 3.36, the dome's 1.75 to 3.23 and
    // 1.75 to 2.48, the frozen fall's 1.64 to 2.35 and 1.75 to 2.19); the eased camera turns 27.3 degrees a second at the most,
    // the gaze stands 62.3 degrees off the heading at the most, and the flight lasts 49.6 to 50.2 s.
    const pulls = () => [poi(FOUNT_AT, 0, M.passOut, 0.6), poi(DOME, M.straight, overhead(DOME, 40, M.straight), 0.45), poi(FROZEN_AT, M.lip[0] - 60, offBearing(FROZEN_AT, 60, M.lip[0]), 0.4)];
    let pois = pulls();
    gazeBend(pois); findFast(10);
    await ctx.yield();
    for (let again = 0; again < 3; again++) { pois = pulls(); gazeBend(pois); findFast(10); await ctx.yield(); }
    // The halls' falls have no pulls: a hall (72 to 108 m) is shorter than a pull must be (two fades, each 1.6 s at 1.1 times the pace), and a pull still on as
    // its fall goes by at 20 m whips the gaze; the falls stand ahead and to the river's side without one.
    // On the rare visit the long creature swims a circle of 62 m about the ring (outside the gate's piers, whose feet reach
    // 52 m from the leg's line; inside the nearest pillar's), in the water the way comes in over, on the clock from a start of its
    // own (the lot deals only where on the circle it starts).
    if (rare) { seaU.uTurn.value.set(RING[0], RING[1], RN.creature.range(0, TAU), 1); seaU.uTurnR.value = 62; }
    const creatureAt = seaU.uTurn.value.z;
    return {
      scene, path, duration: DUR,
      title: hour === 'night' ? 'The River That Sinks Under the Garden, by Moonlight' : 'The River That Sinks Under the Garden',
      // the camera rolls 5.5 degrees at most into a turn (bank 0.35; it was 0.9, 14 degrees: that roll came on where every turn begins,
      // 10 to 14 degrees a second on top of the turn)
      camera: { fov: 62, near: 0.4, far: 4600, lookAhead: 30, sway: 0.8, bank: 0.35 },
      pace: (u) => paceM(u * PL),
      pois,
      portal: { shape: 'circle', radius: RING_R, color: '#bfffe6', glow: 1.6, revealDistance: 320 },
      post: { exposure: H.exp, bloom: { strength: 0.42, radius: 0.65, threshold: 0.92 },
        grade: { saturation: 1.1, contrast: 1.05, tint: '#fffaf2', shadowTint: '#06101c', vignette: 0.3, grain: 0.02, aberration: 0 } },
      update(dt, time, camera, u) {
        tU.value = time;
        // NOTHING OF THE WORLD BEGINS, TURNS OR ENDS HERE. Everything that moves runs on the world's clock (time). The light, the
        // haze and the sky are not touched: they belong to places (see THE LIGHT IS THE PLACE'S OWN in the header). What follows the
        // metres flown is only WHAT IS DRAWN, things that no line through the mouth or the arch reaches from where the way is, each at a place worked out in build:
        // the gardens go off 60 m inside the mouth, where all of them lie behind the way (the mouth's lining ends 30 m in; the
        // caverns' line turns 23 degrees at the most; the gaze is never turned back), and never later than M.hid, the last place a
        // straight line back to the mouth stays inside the caverns; each length of the woods comes on at the place its own sight
        // test gives (kitLengths: where a line clear of the land first reaches it); the cave's front comes on where the mouth is first in sight over
        // the land; every thing of the caverns at the place its own sight test gives (with the front if the mouth shows it,
        // at the pool's head if no line reaches it before); the sea, its cataract with it, at the place from which a straight line
        // can first reach the arch (334 to 460 m from the arch on 300 visits; on 166 of them it is drawn from before the mouth), and each
        // of its fine things where a line through the arch first reaches one of its own boxes: the standing ice thing by thing
        // (seaShown: its first thing with the sea on 236 visits and within 16 m after it on the rest, its last 16 to 40 m before
        // the arch), the foam at the feet with the sea on 275 visits and within 16 m after it on the rest, the hanging ice with
        // the sea on 120 and as much as 327 m after it, the shore 200 to 304 m after it (130 to 234 m before the arch). No typed distance says
        // what of the caverns or the sea is drawn. The pieces of ice change from their far shape to their near one, each at a
        // place of its own (iceShapes). WHAT THE TESTS DO NOT ASK, a line down through the water before the mouth, is answered
        // by the pool's bed (above): without it the cave river's water (the kit's river, asked at opacity 0.82) had nothing
        // under it there and such a line went on under the caverns; through that water the sea was reached as it came on on 4 of
        // 53 visits (113 to 114,510 square pixels of a picture 1920 by 1080) and the deep tube on 2 (35 and 128). COUNTED with
        // the bed, on the same 53 visits, by lines that only what is opaque shuts (no water shuts any): each of the 3,015
        // switches that can be counted (668 of them the woods'; all but the rays and the dust, which have no faces) comes on unreached.
        const m = u * PL, outside = m <= Math.min(M.hid, M.mouth + 60), deep = m >= M.poolHead, sea = m >= M.seaOn, front = m >= M.frontOn;
        sky.object.visible = outside;
        if (outside) sky.update(dt, time, camera);
        for (const o of outdoor) o.visible = outside;
        if (outside) for (const q of kitLengths) q[0].visible = m >= q[1];
        for (const o of caveFront) o.visible = front;
        for (const q of caveThings) q[0].visible = m >= q[1];
        for (const o of seaGroup) o.visible = sea;
        for (const q of seaThings) q[0].visible = m >= q[1];
        for (const q of seaParted) seaShown(q, m);
        for (const q of icePieces) iceShapes(q, m);
        if (outside) for (const o of updaters) o.update(dt, time, camera, u);
        for (const w of caveWater) w.update(dt, time, camera);
        if (deep) { for (const s of shafts) s.update(dt, time, camera); caveMist.update(dt, time, camera); }
        if (sea) for (const s of seaFx) s.update(dt, time, camera);
        fauna.update(dt, time, camera, u, outside);
        hero.update(dt, time, camera);
        if (rare) seaU.uTurn.value.z = creatureAt + time * 0.1;
      },
      dispose() { sky.dispose?.(); },
    };
  },
};
