// THE FLOATING ISLANDS (islands-in-custard): the golden hour on a vanilla custard sea. Three stuffs and nothing else:
// matt meringue in two shapes (quenelle, pulled peak), opaque satin custard with vanilla specks, amber caramel as
// thread, coil, hoop and drip. Everything is made from ONE makeStyle() instance (src/parts/islands-in-custard.js) and
// shown with the flat switch, so each hex is shown as written. No kit sky, water, flora or fauna: none can obey.
// The course runs toward -Z (the hero's front is +Z), so the camera's right is +X, where the sun stands.
// FLIGHT  strait, entered on the slant with the first two path points AIMED AT B (so B is central in the previous world's portal), so B stands alone in the middle against the sky (quenelle A at left,
// peak B ahead with the pouring thread on its tip; the Tall Peak and the cage are out past the right-hand edge of the first
// view; the shadows of two peaks off to the right, G1 and G2, lie across the strait) -> the thread is flicked from
// B to C and sets as an arch -> under the arch, a drip bead close on the right -> round the right flank of the Tall
// Peak E -> the Sugar Cage revealed -> the crossing, a thread thrown overhead -> between two feet of the cage -> up the
// spoon valley -> across the hollow through the caramel hoop.
// VARIES  hour (golden, dawn, day, night; ctx.vary.hour), flavour (vanilla, pistachio, chocolate), the herd (mostly
// quenelles, mostly peaks, a flotilla of kisses), the cage's height; density scales islands and rafts.
// On most deals one more pouring thread comes down on the open custard right of the course before the Tall Peak, with
// its coil stack; where an island, a laid coil or a drop of the deal lies on its place (about one deal in twelve) there is none.
// NEAR    the sea is never bare: every 11 m a coil raft lies beside the line (ROPE: one round strand laid flat in an open
// spiral, custard between its turns, opaque so it never multiplies to black), round drops beside it, and the custard's
// own shader draws hair threads and drops of caramel on the skin. No pods: three stuffs and nothing else.
// THE NEAR HERD  from the strait to the Tall Peak's shoulder small islands stand in clusters of two to four beside the line (pulled
// peaks 5 to 12 m tall, quenelles 6 to 14 m long, in the herd's own mix of the two), each bobbing, tilting and turning in place with a
// custard coat that lags and a long shadow. They are dealt last, from a generator of their own, so nothing else of a deal moves for them.
// ITS RULES OF PLACE, typed, the same at every station of every seed (none reads the lens, u, a clock or a seed's number): ten stations along the flown line between route metres 25 and 230; a
// cluster stands at the FIRST lawful place of one fixed order of trying (14 to 34 m from the line, first on the OUTER hand of the bend ahead seven times in ten; its first islet within 22 m along the line of its
// station's own point and never before route metre 25, so the last station's can stand as far on as route metre 252). THE EMPTY STATION: a station with no lawful place in
// its span searches again when every station has had its turn, wider by six steps in turn (13 to 11 m from the line; its lesser tried as far as 9 m off; as far as 14 m; 23 to 44 m along the line; 45 to 66 m along it, no
// first islet before route metre 25 or past 252; 35 to 50 m from the line), and is left empty only when none of them finds a place. The steps are general in form (any station of any deal); the figures of three of them (13 to 11 m; the lesser's 9 and 14 m) were fitted on stations that found no place. PAIRS FIRST: every station is given its first islet and one lesser before any cluster is given a third or a fourth. Lawful: every vertex of an islet 8.2 m from the flown line at every bob, tilt and turn; its top no higher than 0.7 of its axis's distance from the line; its foot under the
// custard at every phase; THE ENTRY'S SIGHT OF B: no islet's ring within 2 m of a wedge from the route's first point toward B, 0.2 m broad to each side for every metre ahead; 4 m of custard to a
// named island and to an island of the far herd, 2 m to another islet and to the pour on the open custard (its place is kept free on a deal with no pour too), 1 m to a coil's rope and to a drop, 3 m to a drip of the arch,
// its ring 4.3 m from the MIDDLE of the mound the thrown threads start from (the mound is 3.3 m in radius: about 1 m of custard), nothing within 176 m of the world's middle; A LESSER ISLET stands at
// one of twelve bearings round its cluster's first islet, its ring at the size tried 2 to 4.5 m of custard from the first one's ring (to 9 m and to 14 m at two steps of an empty station's later search); ONE LARGER: a cluster's first islet the larger by a tenth or more of its size (a peak's height, half a quenelle's length); NEVER A CROWD: at no metre mark of the flown line more than seven
// islets within 60 m and inside 60 degrees of the line's heading there (between two marks an eighth can stand so). THE WORLD'S WEIGHT: the herd's moulds as dealt weigh no more than 500,000
// triangles less the scene as it stands before them less a typed room, and never over 9,504: clusters of four become three, threes become twos, and on the heaviest scenes stations are left empty, every second one first.
// RARE    the tap: at u 0.80 (journey second 30.6) every thread crossing a window of sky up and sunward of the ring (chosen by
// eye from the climb) breaks: 46 long slivers turn as they fall, plain sunlight lies on the sunny wall as a white wedge
// (uniforms.uTap), and five pale threads are thrown across the gap.
import * as THREE from 'three';
import { makePath, clamp, lerp, smoothstep } from '../kit/core.js';
import { buildHero, makeStyle, PALETTE, POST } from '../parts/islands-in-custard.js';

const HOURS = {
  golden: { pal: PALETTE, extra: {}, sunX: 1, el: 0.21 },
  dawn: { pal: ['#F3DA8A', '#FBF6F1', '#CDC7DC', '#6B3A1C', '#F6CF7E', '#B26A22', '#BFDDE0'], sunX: -1, el: 0.13,
    extra: { apricot: '#F7D3CF', cream: '#FFF4D8', fresh: '#FCE9B4', amber: '#E8A84A', amberLight: '#FBDDA6', steam: '#FFF6F2' } },
  day: { pal: ['#F6E3A0', '#FDFBF6', '#C6BFD6', '#6B3A1C', '#F2B45A', '#8A3E12', '#B4D3DA'], sunX: 1, el: 0.72,   // the steam sky is high and pale but never as white as the meringue
    extra: { apricot: '#E6D9C2', cream: '#FFF9E0', trough: '#E0BE5C', steam: '#FFFFFF' } },
  night: { pal: ['#B3964A', '#C7D2E6', '#7780A6', '#4A2A1A', '#F2B45A', '#8A3E12', '#3F4F6C'], sunX: 1, el: 0.24,
    extra: { apricot: '#6F7694', cream: '#E8E6D4', trough: '#8C7232', gold: '#B98A4E', speck: '#1E1A1C', amberLight: '#E9B878', steam: '#98A0BE' } },
};
const FLAVOURS = {
  vanilla: {},
  pistachio: { custard: '#E4E3A2', trough: '#C6C673', speck: '#3A4420', cream: '#FBF8D6' },   // a creamy pistachio custard: pale and warm, never a lawn
  chocolate: { custard: '#6E4630', trough: '#573421', speck: '#F3E3C0', cream: '#A77B5C' },
};

export default {
  id: 'islands-in-custard',
  name: 'The Floating Islands',
  category: 'ocean',
  weirdness: 0.65,
  media: ['water', 'air'],
  async build(ctx) {
    const rng = ctx.rng, vary = ctx.vary || {}, detail = clamp(ctx.quality?.detail ?? 1, 0.6, 1), density = clamp(vary.density ?? 1, 0.7, 1.3);
    const Y = async () => { if (ctx.yield) await ctx.yield(); };
    const scene = new THREE.Scene();

    // ---- the seeded look: hour, flavour, herd, cage (all draws up front, in a fixed order)
    const hourPick = rng(), flavPick = rng(), herdPick = rng(), cagePick = rng(), layoutSeed = rng();
    let hour = vary.hour && HOURS[vary.hour] ? vary.hour : (hourPick < 0.55 ? 'golden' : hourPick < 0.72 ? 'dawn' : hourPick < 0.87 ? 'day' : 'night');
    let flavour = flavPick < 0.56 ? 'vanilla' : flavPick < 0.8 ? 'pistachio' : 'chocolate';
    if (hour === 'night' && flavour === 'chocolate') flavour = 'vanilla';   // dim gold custard is the night's only ground
    const herd = herdPick < 0.4 ? 'quenelles' : herdPick < 0.75 ? 'peaks' : 'kisses';
    const tall = cagePick > 0.62, rare = !!vary.rare;
    const H = HOURS[hour], F = FLAVOURS[flavour];
    const sun = new THREE.Vector3(H.sunX * Math.cos(H.el), Math.sin(H.el), 0);
    const style = makeStyle(ctx, { palette: H.pal, sun, dome: (tall ? 196 : 170) / 150 });
    await Y();
    const pal = style.palette;
    for (const [k, v] of Object.entries(H.extra)) pal[k].set(v);
    const sunCream = pal.cream.clone();   // the sun's disc keeps the hour's cream whatever the flavour
    for (const [k, v] of Object.entries(F)) {
      pal[k].set(v);
      if (hour === 'night') pal[k].multiplyScalar(0.72); else if (hour === 'day' && k !== 'speck') pal[k].lerp(new THREE.Color('#ffffff'), 0.18);
    }
    if (flavour === 'chocolate') pal.white.lerp(new THREE.Color('#ffffff'), 0.6);   // the meringue blazing
    pal.deep.copy(pal.trough).multiply(flavour === 'pistachio' ? new THREE.Color(0.95, 0.8, 0.55) : flavour === 'chocolate' ? new THREE.Color(0.7, 0.62, 0.5) : new THREE.Color(0.74, 0.58, 0.36));   // the custard's shadow: a deeper tone of its own flavour
    const U = style.uniforms; U.uCollar.value.set(0, 0, 148);   // the massif's skin collar: broad folds where we cross it
    scene.background = pal.apricot.clone();

    // ---- the course (world space = hero space: the massif stands at the origin, its valley mouth toward +Z)
    const B = { x: -80, z: 404, R: 17.5, H: 25 }, C = { x: -12, z: 405 }, E = { x: -20, z: 318, R: 42, H: 82 }, A = { x: -51, z: 487.7 }, D = { x: 48, z: 352 }, FP = { x: 100, z: 322 }, Q = { x: 17.5, z: 218 };
    const G1 = { x: 18, z: 476, R: 11, H: 30, sr: 9 }, G2 = { x: 24, z: 458, R: 16, H: 32 };   // two peaks off to the right of the strait: their long shadows lie across it
    const path = makePath([
      [-18, 3, 502], [-29.3, 3, 484.1], [-44, 3, 469.2], [-58, 3, 455], [-63, 3, 440], [-60, 3, 428], [-49, 3.2, 414], [-30, 3.5, 393], [-8, 3.5, 372], [15, 3.5, 356], [35, 3.5, 334],
      [38.5, 3.3, 307], [26, 3, 281], [8, 3, 256], [0, 3.4, 222], [0, 5, 172], [0, 8, 134], [0, 31, 90], [0, 55, 44], [0, 58.5, 13], [0, 62, -18],
    ]);
    await Y();
    const uAt = (x, z) => path.nearestXZ(x, z).u;
    const uArch = uAt(-40, 404), uReveal = uAt(36, 315), uGate = uAt(0, 150), uNave = uAt(0, 90), uHollow = uAt(0, 44), uMid = uAt(0, 215);
    // journey seconds by u: the brief's clock is pinned to the places where its pictures happen
    const CLK = [[0, 0], [uArch, 9.5], [uReveal, 16], [uMid, 21.2], [uGate, 25], [uNave, 31], [uHollow, 36.5], [1, 42]];
    const clockOf = (u) => { for (let i = 1; i < CLK.length; i++) if (u <= CLK[i][0]) return lerp(CLK[i - 1][1], CLK[i][1], (u - CLK[i - 1][0]) / Math.max(CLK[i][0] - CLK[i - 1][0], 1e-4)); return 42; };
    const uOfClock = (s) => { for (let i = 1; i < CLK.length; i++) if (s <= CLK[i][1]) return lerp(CLK[i - 1][0], CLK[i][0], (s - CLK[i - 1][1]) / (CLK[i][1] - CLK[i - 1][1])); return 1; };
    await Y();

    // ---- the hero: the Sugar Cage, thrown on the journey's clock
    const hero = await buildHero(ctx, { style, stage: false, detail, duration: 42, kisses: Math.round(1100 * clamp(density, 0.8, 1.2)) });
    scene.add(hero.object);
    await Y();
    const sky = style.sky(); sky.material.uniforms.uCream = { value: sunCream }; scene.add(sky);
    // ---- meringue islands: each a one-instance InstancedMesh in ONE instanced material, so it bobs, tilts and
    // turns like a cork in the vertex shader. seed 0.5 = no turning (islands beside the path only bob in place).
    const merI = style.meringue({ instanced: true, coat: 0.5 }), merDry = style.meringue({ instanced: true, coat: -1e3 });
    const lr = rng.fork ? rng.fork('layout') : rng, shores = [], solids = [];
    const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _p = new THREE.Vector3(), _s = new THREE.Vector3(), _e = new THREE.Euler(), UP = new THREE.Vector3(0, 1, 0);
    const island = (geo, x, y, z, o = {}) => {
      const m = new THREE.InstancedMesh(geo, o.dry ? merDry : merI, 1);
      _m.compose(_p.set(x, y, z), _q.setFromAxisAngle(UP, o.yaw ?? 0), _s.set(1, 1, 1)); m.setMatrixAt(0, _m);
      geo.setAttribute('aBob', new THREE.InstancedBufferAttribute(new Float32Array([o.seed ?? 0.5, o.bob ?? 1, o.period ?? 6.5, o.tilt ?? 0.03]), 4));
      m.frustumCulled = false; scene.add(m); return m;
    };
    const topOf = (geo, yaw = 0) => {   // the highest point of a form (where a thread lands), in the island's turned frame
      const a = geo.attributes.position.array; let b = 0; for (let i = 0; i < a.length; i += 3) if (a[i + 1] > a[b + 1]) b = i;
      const c = Math.cos(yaw), s = Math.sin(yaw); return [a[b] * c + a[b + 2] * s, a[b + 1], -a[b] * s + a[b + 2] * c];
    };
    // A: the quenelle at our left hand in the strait (a little slumped: the hand does wrong)
    const gA = style.quenelleGeometry({ length: 36, height: 15, width: 17, seg: 40, radial: 28, rnd: lr, slump: 0.25 });
    island(gA, A.x, 0, A.z, { yaw: 2.35, bob: 1.3, period: 5.6, tilt: 0.035 });   // it lies along the entry course
    shores.push({ x: A.x + 7, z: A.z + 7.1, r: 8.5, h: 14, round: 1 }, { x: A.x, z: A.z, r: 9.5, h: 16.5, round: 1 }, { x: A.x - 7, z: A.z - 7.1, r: 8.5, h: 14, round: 1 }); solids.push({ x: A.x, z: A.z, r: 19 });
    // B: the pulled peak dead ahead, its chestnut curl thrown toward the sun; the first thread lands on its summit
    const gB = style.peakGeometry({ height: B.H, radius: B.R, curl: 3.05, dir: sun.x > 0 ? 0.25 : Math.PI - 0.25, radial: 46, rings: 24, wob: 0.8, rnd: lr, toast: 1.1, sink: 0.1, bulge: 0.12, ridge: { at: 1.25, turn: -1.1, w: 0.25, amp: 0.13 } });
    island(gB, B.x, 0, B.z, { bob: 0.9, period: 7.2, tilt: 0.02 });
    const bTop = topOf(gB), bobB = (t) => 0.9 * Math.sin(t * 6.2832 / 7.2 + Math.PI);
    shores.push({ x: B.x, z: B.z, r: B.R, h: B.H * 0.9, round: 0.5 }); solids.push({ x: B.x, z: B.z, r: B.R + 2 });
    for (const G of [G1, G2]) {
      const g = style.peakGeometry({ height: G.H, radius: G.R, curl: 2.7, dir: sun.x > 0 ? 0.6 : Math.PI - 0.6, radial: 26, rings: 18, wob: 0.9, rnd: lr, toast: 1.0, sink: 0.1, bulge: 0.2 });
      island(g, G.x, 0, G.z, { bob: 0.8, period: 6.4, tilt: 0.025 }); shores.push({ x: G.x, z: G.z, r: G.R, sr: G.sr, h: G.H * 0.9, round: 0.5 }); solids.push({ x: G.x, z: G.z, r: G.R + 2 });
    }
    await Y();
    // C: the low quenelle the flicked thread lands on
    const gC = style.quenelleGeometry({ length: 30, height: 9, width: 15, seg: 30, radial: 22, rnd: lr });
    island(gC, C.x, 0, C.z, { yaw: 1.1, bob: 0.7, period: 6.1, tilt: 0.02 });
    shores.push({ x: C.x - 4, z: C.z + 7, r: 7.5, h: 9, round: 1 }, { x: C.x + 4, z: C.z - 7, r: 7.5, h: 9, round: 1 }); solids.push({ x: C.x, z: C.z, r: 16 });
    // D: a mound on the right with a peak pulled out of it at 11.5 s
    const gD = style.quenelleGeometry({ length: 28, height: 9, width: 15, seg: 30, radial: 22, rnd: lr, toast: 0.5 });
    island(gD, D.x, 0, D.z, { yaw: 0.9, bob: 0.6, period: 6.8, tilt: 0 });
    shores.push({ x: D.x - 5, z: D.z + 6, r: 7.5, h: 9, round: 1 }, { x: D.x + 5, z: D.z - 6, r: 7.5, h: 9, round: 1 }); solids.push({ x: D.x, z: D.z, r: 15 });
    // F: a tall peak on the outside of the turn, a thread pouring onto it (the midground of the weave)
    const gF = style.peakGeometry({ height: 50, radius: 24, curl: 2.8, dir: 2.4, radial: 28, rings: 20, wob: 0.9, rnd: lr, toast: 1.0, sink: 0.1, bulge: 0.2 });
    island(gF, FP.x, 0, FP.z, { bob: 1.1, period: 6.6, tilt: 0.03 });
    const fTop = topOf(gF); shores.push({ x: FP.x, z: FP.z, r: 24, h: 45, round: 0.5 }); solids.push({ x: FP.x, z: FP.z, r: 27 });
    await Y();
    // E: the Tall Peak, tip scorched; we round its right flank 10 m off
    const gE = style.peakGeometry({ height: E.H, radius: E.R, curl: 3.3, dir: sun.x > 0 ? -0.5 : Math.PI + 0.5, radial: 60, rings: 30, wob: 0.55, rnd: lr, toast: 1.6, sink: 0.07, bulge: 0.08, taper: 1.2 });   // (its flank is plain: a toasted seam ten metres from the lens read as a blotch)   // the seam winds low round the flank we pass
    island(gE, E.x, 0, E.z, { bob: 0.55, period: 7.8, tilt: 0.008 });
    shores.push({ x: E.x, z: E.z, r: E.R, h: E.H * 0.93, round: 0.5 }); solids.push({ x: E.x, z: E.z, r: E.R + 2 });
    await Y();
    // Q: the quenelle on the crossing with a thread coiling on it, and the islet the 20 s peak is pulled from
    const gQ = style.quenelleGeometry({ length: 24, height: 8, width: 12.5, seg: 30, radial: 22, rnd: lr });
    island(gQ, Q.x, 0, Q.z, { yaw: Math.PI / 2 + 0.12, bob: 0.8, period: 5.9, tilt: 0.02 });
    shores.push({ x: Q.x, z: Q.z - 6, r: 6.2, h: 8, round: 1 }, { x: Q.x, z: Q.z + 6, r: 6.2, h: 8, round: 1 }); solids.push({ x: Q.x, z: Q.z, r: 13 });
    const I2 = { x: -22, z: 240 }, gI = style.quenelleGeometry({ length: 20, height: 6, width: 12, seg: 26, radial: 20, rnd: lr, toast: 0.4, slump: 0.4 });
    island(gI, I2.x, 0, I2.z, { yaw: 1.9, bob: 0.6, period: 6.3, tilt: 0 });
    shores.push({ x: I2.x, z: I2.z, r: 8, h: 6, round: 1 }); solids.push({ x: I2.x, z: I2.z, r: 11 });
    const qTop = topOf(gQ, Math.PI / 2 + 0.12), bobQ = (t) => 0.8 * Math.sin(t * 6.2832 / 5.9 + Math.PI);
    await Y();
    // the two peaks pulled up as we pass (the third is the hero's own, at 31 s): they share their island's bob
    const pulls = [
      { on: D, top: topOf(gD, 0.9), t: 12.3, H: 11, seed: [0.5, 0.6, 6.8, 0] },
      { on: I2, top: topOf(gI, 1.9), t: 19.4, H: 8.5, seed: [0.5, 0.6, 6.3, 0] },
    ];
    for (const pk of pulls) {
      const g = style.peakGeometry({ height: pk.H, radius: pk.H * 0.36, curl: 3.0, dir: lr.range(0, 6.28), radial: 16, rings: 14, wob: 1, rnd: lr, toast: 0.95, sink: 0.1 });
      pk.mesh = island(g, pk.on.x + pk.top[0], pk.top[1] - 0.8, pk.on.z + pk.top[2], { dry: true, seed: pk.seed[0], bob: pk.seed[1], period: pk.seed[2], tilt: 0 });
      pk.pos = new THREE.Vector3(pk.on.x + pk.top[0], pk.top[1] - 0.8, pk.on.z + pk.top[2]);
    }
    const setPull = (pk, js) => {   // the spoon lifts it, it stretches, curls over and lets go with a little shiver
      const k = smoothstep(pk.t - 1.5, pk.t, js), late = Math.max(js - pk.t, 0), w = 1.25 - 0.25 * k;
      const sy = Math.max(0.02, k * (1 + 0.22 * Math.sin(k * Math.PI)) - 0.07 * Math.exp(-late * 1.6) * Math.sin(late * 8) * k);
      _m.compose(pk.pos, _q.setFromEuler(_e.set((1 - k) * 0.5, 0, 0)), _s.set(w, sy, w)); pk.mesh.setMatrixAt(0, _m); pk.mesh.instanceMatrix.needsUpdate = true;
    };
    await Y();
    // ---- the herd: lesser islands out to 700 m, then pale silhouettes to the horizon (instanced, five moulds)
    const moulds = [];
    for (let k = 0; k < 3; k++) moulds.push({ peak: true, geo: style.peakGeometry({ height: 1, radius: 0.5 + 0.06 * k, curl: 2.5 + 0.45 * k, dir: 0, radial: 18, rings: 12, wob: 0.9, rnd: lr, toast: 0.95 + 0.3 * (k === 2), sink: 0.1, bulge: 0.15 + 0.1 * k }), list: [] });
    for (let k = 0; k < 2; k++) moulds.push({ peak: false, geo: style.quenelleGeometry({ length: 1, height: 0.4 + 0.06 * k, width: 0.5, seg: 16, radial: 14, rnd: lr, slump: k * 0.5 }), list: [] });
    await Y();
    const pPeak = herd === 'peaks' ? 0.78 : herd === 'quenelles' ? 0.22 : 0.5;
    const clearOf = (x, z, r) => {
      if (path.nearestXZ(x, z).dist < r + 17) return false;
      if (Math.hypot(x, z) < 176 + r) return false;
      { const al = (x + 18) * -0.535 + (z - 502) * -0.845, lat = Math.abs((x + 18) * 0.845 + (z - 502) * -0.535); if (al > -40 && al < 520 && lat < 38 + r + 0.52 * Math.max(al, 0)) return false; }   // the entry picture stays one peak, one egg, one thread: nothing else of this herd stands in the middle half of the first view (the near herd, dealt far below, keeps only a narrower wedge to B open and does stand in this half)
      if (Math.abs(x) < 46 + r && z > 150 && z < 340) return false;             // and the crossing stays open
      if (z > 425 - r && z < 540 + r && (x + 45) * sun.x > -r && (x + 45) * sun.x < 300) return false;   // the strait's light is authored: of this herd only the named islands shade it (the near herd's islets, dealt far below, stand in this band too and cast their own small shadows)
      for (const o of solids) if (Math.hypot(x - o.x, z - o.z) < r + o.r + 5) return false;
      return true;
    };
    const addHerd = (n, r0, r1, s0, s1, small) => {
      for (let i = 0, tries = 0; i < n && tries < n * 30; tries++) {
        const a = lr.range(0, 6.283), rr = Math.sqrt(lr.range(r0 * r0, r1 * r1)), x = Math.sin(a) * rr, z = 250 + Math.cos(a) * rr * (r0 > 600 ? 1 : 0.85);
        const peak = lr.chance(small ? 1 : pPeak), size = lr.range(s0, s1) * (peak ? 0.75 : 1), rad = peak ? size * 0.55 : size * 0.4, sd = lr(), yaw = lr.range(0, 6.283), sq = lr.range(0.85, 1.15), bobA = lr.range(0.5, 1.5), per = lr.range(5, 8), tilt = lr.range(0.01, 0.05);
        if (!clearOf(x, z, rad)) continue;
        reach5.push(peak ? 1.8 : 1.45);   // (for the pour, below) how far this island's body reaches, in rings: a pulled peak up to 1.79 as built, a quenelle's half length up to 1.37
        const md = peak ? moulds[Math.floor(sd * 2.999)] : moulds[3 + (sd > 0.82 ? 1 : 0)];
        md.list.push({ x, z, size, sq, yaw, bob: [sd, small ? bobA * 0.5 : bobA, per, small ? 0.06 : tilt] });
        if (!small || size > 6) shores.push({ x, z, r: peak ? size * 0.5 : size * 0.3, h: peak ? size * 0.9 : size * 0.48, round: peak ? 0.5 : 1, len: 2.2 }); solids.push({ x, z, r: rad }); i++;
      }
    };
    const named = solids.length, reach5 = [];   // (the pour on the open custard, below, tells the named islands from the herd, and a peak from a quenelle)
    addHerd(Math.round(38 * density), 70, 700, 22, 88, false);
    addHerd(Math.round(26 * (0.6 + 0.4 * detail)), 760, 1500, 90, 210, false);
    if (herd === 'kisses') addHerd(Math.round(110 * detail * density), 20, 330, 3.5, 10, true);
    else addHerd(Math.round(22 * detail * density), 20, 330, 3.5, 8, true);
    await Y();
    for (const md of moulds) {
      const n = md.list.length; if (!n) { md.geo.dispose(); continue; }
      const im = new THREE.InstancedMesh(md.geo, merI, n), bob = new Float32Array(n * 4);
      md.list.forEach((o, i) => {
        _m.compose(_p.set(o.x, 0, o.z), _q.setFromAxisAngle(UP, o.yaw), _s.set(o.size * o.sq, o.size, o.size)); im.setMatrixAt(i, _m); bob.set(o.bob, i * 4);
      });
      md.geo.setAttribute('aBob', new THREE.InstancedBufferAttribute(bob, 4)); im.frustumCulled = false; scene.add(im);
    }
    await Y();

    // ---- the custard: one polar grid that follows the camera (the swells are analytic, so nothing swims)
    const NA = 112, NR = 146, cp = new Float32Array((NR + 1) * NA * 3), ci = [];
    for (let j = 0; j <= NR; j++) {
      const r = Math.min(1.5 * (Math.pow(1.028, j) - 1) / 0.028, 3300);
      for (let i = 0; i < NA; i++) { const a = (i / NA) * 6.2832, o = (j * NA + i) * 3; cp[o] = Math.sin(a) * r; cp[o + 1] = 0; cp[o + 2] = Math.cos(a) * r; if (j > 0) { const a0 = (j - 1) * NA + i, b0 = (j - 1) * NA + (i + 1) % NA; ci.push(a0, a0 + NA, b0, b0, a0 + NA, b0 + NA); } }
    }
    const cg = new THREE.BufferGeometry(); cg.setAttribute('position', new THREE.BufferAttribute(cp, 3)); cg.setIndex(ci);
    const sea = new THREE.Mesh(cg, style.custard()); sea.frustumCulled = false; sea.name = 'custard'; scene.add(sea);
    await Y();
    // (the custard's two data textures are made below, when the near herd stands: it takes no draw)
    // ---- caramel threads of the world's own: the pours (the only lines in the sky), the arch flicked from B to C,
    // and the skein thrown over our heads on the crossing. They share the hero's clock.
    const bSummit = [B.x + bTop[0], bTop[1] - 0.6, B.z + bTop[2]], cTop = topOf(gC, 1.1), cLand = [C.x + cTop[0], cTop[1] - 0.8, C.z + cTop[2]];
    const qLand = [Q.x + qTop[0], qTop[1] - 0.3, Q.z + qTop[2]];
    const pourB = style.makeThreads([{ a: [bSummit[0], 430, bSummit[2]], b: [bSummit[0], bSummit[1] + 1.2, bSummit[2]], seed: 0.31, width: 1.45, pour: true }], 48);
    pourB.renderOrder = 2; scene.add(pourB);
    const span = Math.hypot(cLand[0] - bSummit[0], cLand[2] - bSummit[2]) / 2;
    const arch = { a: bSummit, b: cLand, t0: 3.2, seed: 0.74, width: 1.0, hs: 9 / (U.uDome.value * span) };
    const world = [arch, { a: [qLand[0], 430, qLand[2]], b: [qLand[0], qLand[1] + 1.0, qLand[2]], seed: 0.62, width: 0.3, pour: true }];
    world.push({ a: [FP.x + fTop[0], 430, FP.z + fTop[2]], b: [FP.x + fTop[0], fTop[1] - 0.5, FP.z + fTop[2]], seed: 0.17, width: 0.5, pour: true });
    const farPours = solids.filter((o) => o.r > 14 && o.x > 150 && Math.hypot(o.x, o.z - 250) < 520 && o.z < 330).slice(0, 12);
    for (let i = 0; i < 1 && farPours.length; i++) { const o = farPours.splice(Math.floor(lr() * farPours.length), 1)[0]; world.push({ a: [o.x, 430, o.z], b: [o.x, 2, o.z], seed: lr(), width: 0.5, pour: true }); }
    const over = { x: -10, z: 252 }, gr = hero.anchors.gate.right;
    for (let i = 0; i < 5; i++) world.push({ a: [over.x + lr.range(-0.8, 0.8), -0.4, over.z + lr.range(-0.8, 0.8)], b: [gr.x + 6 + i * 3.2 + lr.range(-1, 1), -0.4, gr.z + 4 + lr.range(-2, 5)], t0: 20.35 + i * 0.3, seed: lr(), width: lr.range(0.3, 0.45), hs: lr.range(0.27, 0.36) });
    const threads = style.makeThreads(world, 48); threads.renderOrder = 2; scene.add(threads);
    await Y();

    // ---- thick caramel: coils where the pours land, the foot of the overhead skein, coil rafts, and the arch's drips
    const helix = (cx, cy, cz, r0, r1, turns, rise, per) => { const pts = [], n = Math.round(turns * per); for (let i = 0; i <= n; i++) { const k = i / n, a = k * turns * 6.283, r = lerp(r0, r1, k); pts.push([cx + Math.cos(a) * r, cy + k * rise, cz + Math.sin(a) * r]); } return pts; };
    const coils = [];
    for (const c of [{ at: bSummit, bob: bobB, r: 3.3, until: 3.6, rise: 4.2, tube: 0.55 }, { at: qLand, bob: bobQ, r: 1.6, until: 1e9, rise: 3.0, tube: 0.3 }]) {
      const gb = style.glassBuilder(), grow = { value: 0 }; gb.tube(helix(0, 0, 0, c.r, c.r * 0.55, 6, c.rise, 14), c.tube, { radial: 6, dark: 0.55, grow: (k) => k });
      const m = style.glassMeshes(gb.build(), { grow }); m.position.set(c.at[0], c.at[1], c.at[2]); scene.add(m); coils.push({ m, grow, c });
    }
    const SB = style.glassBuilder();
    SB.lathe([over.x, 0, over.z], [[0, -0.5], [2.6, -0.5], [3.3, -0.1], [2.9, 0.3], [1.6, 0.65], [0.5, 1.5], [0, 1.6]], { radial: 12, dark: (q) => 1 - 0.5 * q });
    SB.tube(helix(over.x, 0.5, over.z, 2.1, 1.2, 2.3, 1.3, 14), 0.26, { radial: 4, dark: 0.6 });
    SB.tube(helix(cLand[0], cLand[1] + 0.2, cLand[2], 1.8, 1.0, 2.5, 1.2, 14), 0.26, { radial: 4, dark: 0.5 });   // the coil the flicked thread left on C
    const statics = style.glassMeshes(SB.build()); scene.add(statics);
    await Y();
    // A raft is ROPE: one round strand of set caramel laid FLAT in an open spiral, two rope-widths of custard showing
    // between its turns, round-ended, with a loose tail where the thread came in (drawn in the opaque rope material, so
    // no turn ever multiplies over another). Round glass drops float beside the near ones.
    const RP = style.glassBuilder(), RB = style.glassBuilder(), nRaft = Math.round(34 * density * (0.5 + 0.5 * detail));
    const strands = [], beads = [];   // every strand's points and every drop, as laid: the pour on the open custard, below, reads them
    const raft = (x, z, rr, turns, a0, dark, tube, radial, per, tail) => {
      const dirn = Math.sin(a0 * 7.1) > 0 ? 1 : -1, rin = tube * 2.0, P = (rr - rin) / turns, nS = Math.max(Math.round(turns * per), 8), nT = tail > 0 ? Math.round(per * 0.6) : 0, pts = [];
      const rad = (a, r) => r * (1 + 0.05 * Math.sin(a * 2 + a0 * 3)) + 0.06 * rr * Math.sin(a * 3 + a0);   // laid by hand: never a true circle (the same for every turn, so the gaps hold)
      for (let k = nT; k >= 1; k--) { const q = k / nT, a = a0 - dirn * q * 1.3, r = rad(a, rr) + q * q * rr * tail; pts.push([x + Math.cos(a) * r, tube * 0.55, z + Math.sin(a) * r]); }
      for (let k = 0; k <= nS; k++) { const q = k / nS, a = a0 + dirn * q * turns * 6.283, r = rad(a, rr - q * turns * P); pts.push([x + Math.cos(a) * r, tube * (0.55 + 0.5 * q), z + Math.sin(a) * r]); }
      RP.tube(pts, (k) => tube * Math.sqrt(clamp(Math.min(k, 1 - k) * 18, 0.03, 1)), { radial, dark: (k) => dark + 0.3 * k });   // one unbroken strand, round at both ends
      strands.push(pts);
    };
    const drop = (gb, x, z, r, dark) => { beads.push([x, z, r]); gb.lathe([x, 0.02, z], [[0, 0], [r * 0.62, r * 0.06], [r * 0.95, r * 0.3], [r, r * 0.55], [r * 0.82, r * 0.86], [r * 0.45, r * 1.05], [0, r * 1.1]], { radial: 10, dark }); };
    const beside = (u, off) => { path.pointAt(u, _p); path.tangentAt(u, _s); return [_p.x - _s.z * off, _p.z + _s.x * off]; };
    const hsh = (i, k) => { const v = Math.sin(i * 127.1 + k * 311.7 + layoutSeed * 17.3) * 43758.5453; return v - Math.floor(v); };
    const laid = [];
    // the ones we pass close by: one every 11 m or so, on alternate hands, 4 to 6.5 m off the line, so that a coil of
    // rope is always the nearest thing to the lens across the strait, the weave and the crossing
    for (let i = 0, u = 0.034; u < 0.655; i++, u += 0.0155 + 0.004 * hsh(i, 1)) {
      const side = (i % 2 ? -1 : 1) * (i > 1 && hsh(i, 2) < 0.14 ? -1 : 1), rr = 2.6 + 0.7 * hsh(i, 3), off = side * (rr + 1.2 + 1.8 * hsh(i, 4));
      let x = 0, z = 0, ok = false;   // where an island is in the way on that hand it lies on the other, or nearer the line
      for (const f of [off, -off, side * (rr + 0.4), -side * (rr + 0.4)]) { [x, z] = beside(u, f); if (solids.every((o) => Math.hypot(x - o.x, z - o.z) > o.r + rr + 2.5) && Math.hypot(x, z) > 172) { ok = true; break; } }
      if (!ok) continue;
      raft(x, z, rr, 2.0 + 0.5 * hsh(i, 5), hsh(i, 6) * 6.283, 0.05 + 0.3 * hsh(i, 7), 0.235 + 0.04 * hsh(i, 8), 7, 22, hsh(i, 9) < 0.7 ? 0.5 + 0.5 * hsh(i, 10) : 0);
      laid.push([x, z, rr + 1.5]);
      for (let k = 0; k < 3; k++) { const a = hsh(i, 11) * 6.283 + k * 2.3, d = rr + 1.5 + 0.7 * k; drop(RB, x + Math.cos(a) * d, z + Math.sin(a) * d, 0.58 - 0.13 * k, 0.25); }
    }
    // (round THE THREAD COMES DOWN) A pouring thread that lands on the OPEN CUSTARD right of the course, where we come round the
    // Tall Peak, and lays its coil stack there as the pour in the hollow does, beside the stack that toppled before it.
    // Its place is typed like every named thing's and is the same on every seed: 18 m off the line, past the reach of the
    // coils laid beside the lens. It takes nothing from the deal: every island, laid coil and drop is dealt as if it were not
    // there, and it pours only where the custard lies open. If an island of the herd, a laid strand or a laid drop lies where
    // its stack would spread or where the toppled coil would lie, there is no pour on that deal. Only a scattered raft gives
    // way to it (below), as a scattered raft gives way to an island. Nothing of it is clocked by the journey; it reads no lens.
    // FOOT: the stack's reach when it has slumped (its 2.6 m coil and 0.45 m rope, spread by half). T5: the toppled coil,
    // its tail away from the stack; r its reach with the tail.
    const P5 = { x: 26, z: 370.3 }, FOOT = 4.6, T5 = { x: P5.x + 6.5, z: P5.z - 4.3, r: 4.3 };
    let open5 = true;
    solids.forEach((o, i) => { const R = i < named ? o.r : o.r * reach5[i - named] + 2;   // a named island's ring holds its own margin; for a herd island its body's reach and 2 m of custard
      if (Math.hypot(P5.x - o.x, P5.z - o.z) < R + FOOT || Math.hypot(T5.x - o.x, T5.z - o.z) < R + T5.r) open5 = false; });
    for (const s of strands) for (const p of s) if (Math.hypot(p[0] - P5.x, p[2] - P5.z) < FOOT + 1 || Math.hypot(p[0] - T5.x, p[2] - T5.z) < T5.r + 0.7) open5 = false;
    for (const b of beads) if (Math.hypot(b[0] - P5.x, b[1] - P5.z) < FOOT + 0.5 + b[2] || Math.hypot(b[0] - T5.x, b[1] - T5.z) < T5.r + 0.3 + b[2]) open5 = false;
    await Y();
    for (let i = 0, tries = 0; i < nRaft && tries < nRaft * 20; tries++) {
      const near = lr.chance(0.5), u = lr.range(0.01, 0.66), side = lr.chance(0.5) ? 1 : -1, off = near ? lr.range(11, 34) : lr.range(34, 150);
      const rr = lr.range(1.7, 2.7), turns = lr.range(1.8, 2.8), a0 = lr.range(0, 6.28), tail = lr.chance(0.5) ? lr.range(0.4, 1) : 0, dark = 0.08 + 0.3 * lr();
      const [x, z] = beside(u, side * off);
      if (path.nearestXZ(x, z).dist < 10 + rr || Math.hypot(x, z) < 172) continue;
      let hit = false; for (const o of solids) if (Math.hypot(x - o.x, z - o.z) < o.r + rr + 2) { hit = true; break; } if (hit) continue;
      for (const o of laid) if (Math.hypot(x - o[0], z - o[1]) < o[2] + rr + 1) { hit = true; break; } if (hit) continue;
      if (open5) { const reach = (off < 34 ? rr : rr * 1.25) * (1.11 + tail) + 0.3;   // (a scattered raft that would lie on the pour's place is left out; it has made every draw of its try, so every other raft and the tap are dealt as before)
        if (Math.hypot(x - P5.x, z - P5.z) < FOOT + 1 + reach || Math.hypot(x - T5.x, z - T5.z) < T5.r + 0.7 + reach) { i++; continue; } }
      if (off < 34) raft(x, z, rr, turns * 0.85, a0, dark, 0.22, 6, 16, tail); else raft(x, z, rr * 1.25, turns * 0.8, a0, dark, 0.3, 4, 11, tail); i++;
    }
    if (open5) {
      // the thread: in the proportion of the pour on B (a 1.45 m thread lays a 0.55 m rope; this stack's rope is 0.45 m). Its end lies under the custard's lowest swell (0.75 m), so it always enters the custard
      const pour5 = style.makeThreads([{ a: [P5.x, 430, P5.z], b: [P5.x, -1.2, P5.z], seed: 0.47, width: 1.2, pour: true }], 48); pour5.renderOrder = 2; pour5.name = 'pour-open'; scene.add(pour5);
      const c = { at: [P5.x, -0.4, P5.z], bob: () => 0, r: 2.6, until: 1e9, rise: 3.6, tube: 0.45, ride: true }, gb = style.glassBuilder(), grow = { value: 0 };
      gb.tube(helix(0, 0, 0, c.r, c.r * 0.55, 6, c.rise, 14), c.tube, { radial: 6, dark: 0.55, grow: (k) => k });
      const m = style.glassMeshes(gb.build(), { grow, ride: true }); m.position.set(c.at[0], c.at[1], c.at[2]); scene.add(m); coils.push({ m, grow, c });   // it rides the swell, its first turn in the custard (the rope climbs 0.6 m a turn: no air under it); it slumps flat, without the lean (see the update)
      raft(T5.x, T5.z, 2.1, 2.2, 0.9, 0.3, 0.3, 7, 22, 0.8);   // the stack that toppled before this one, clear of the slumped foot
    }
    const rafts = new THREE.Mesh(RP.build(), style.rope({ rideV: true })); rafts.frustumCulled = false; rafts.name = 'rafts'; scene.add(rafts);
    scene.add(style.glassMeshes(RB.build(), { rideV: true }));
    await Y();
    // drips on the arch: each a hair of caramel that lengthens and stops with a full round DROP on its end, which swings.
    // Two hang low beside our line: the first dead ahead as we come to the arch, the second 8 m to our right under it.
    const pa = path.pointAt(uArch, new THREE.Vector3()), drips = [], tp = new THREE.Vector3(), ropeD = style.rope();
    const sAt = (want) => { let bs = 0.5, best = 1e9; for (let s = 0.14; s <= 0.86; s += 0.005) { style.threadPoint(arch, s, tp); const d = Math.abs(Math.hypot(tp.x - pa.x, tp.z - pa.z) - want) + (tp.x < pa.x ? 50 : 0); if (d < best) { best = d; bs = s; } } return bs; };
    const s1 = sAt(2.6), s2 = sAt(8.8);
    const tear = (R, neck) => { const pr = []; for (let k = 0; k <= 15; k++) { const th = Math.PI * (1 - k / 15), up = 1 - th / Math.PI; pr.push([Math.max(R * Math.sin(th) * Math.pow(Math.sin(th / 2), 1.6) / 0.69, k === 0 ? 0 : neck), R * (1 + Math.cos(th)) + R * 1.3 * up * up]); } return pr; };
    for (const d of [{ s: s1, low: 7.0, R: 0.55, at: 5.2 }, { s: s2, low: 5.75, R: 0.36, at: 6.9 }, { s: s1 - 0.13, L: 6, R: 0.3, at: 5.4 }, { s: s2 + 0.14, L: 7, R: 0.28, at: 6.0 }, { s: s2 + 0.27, L: 3.5, R: 0.22, at: 6.4 }]) {
      style.threadPoint(arch, clamp(d.s, 0.08, 0.92), tp); const H = d.R * 3.3, L = d.L ?? Math.max(tp.y - d.low - H, 3), g1 = style.glassBuilder(), g2 = style.glassBuilder();
      g1.tube([[0, 0.5, 0], [0, -L * 0.3, 0], [0, -L * 0.65, 0], [0, -L - 0.1, 0]], (k) => 0.085 - 0.04 * k, { radial: 5, dark: 0.15, grow: (k) => -k * L });
      g2.lathe([0, -H, 0], tear(d.R, 0.04), { radial: 16, dark: (k) => 0.42 - 0.4 * k, grow: -L });
      const m = new THREE.Mesh(g1.build(), ropeD), b = new THREE.Mesh(g2.build(), ropeD); m.position.copy(tp); b.position.copy(tp); m.visible = b.visible = false; m.frustumCulled = b.frustumCulled = false; scene.add(m, b); drips.push({ m, b, at: d.at, L, y: tp.y });
    }
    await Y();
    // ---- the rare event, the tap: one panel of the standing cage cracks at u 0.8; forty threads fall as long
    // shards that turn slowly, land and lie; plain light comes through the gap (the net loses those bars); new threads mend it.
    const tapAt = 30.6; let panel = null, shards = null, shardA = null, shardB = null, fallers = [];
    if (rare) {
      // the panel is chosen BY EYE: every thread of the cage that crosses a window of sky up and to the sunward side of
      // the ring, as seen from the climb, so that when it breaks the window is clear sky from where we are
      const eye = path.pointAt(0.83, new THREE.Vector3()), wd = new THREE.Vector3(sun.x > 0 ? 0.3 : -0.3, 0.8, -1).normalize(), q0 = new THREE.Vector3(), q1 = new THREE.Vector3(), cosR = Math.cos(0.175);
      panel = [];
      for (let i = 0; i < hero.threads.length; i++) {
        const t = hero.threads[i]; let bc = -1, bs = 0.5;
        for (let s = 0.04; s <= 0.96; s += 0.02) { style.threadPoint(t, s, tp).sub(eye); const c = tp.dot(wd) / Math.max(tp.length(), 1e-3); if (c > bc) { bc = c; bs = s; } }
        if (bc > cosR) panel.push({ i, t, s: bs, c: bc, stood: t.t0 + 2.9 < tapAt });
        if (i % 60 === 59) await Y();
      }
      const stood = panel.filter((c) => c.stood).sort((a, b) => b.c - a.c), list = [];
      stood.forEach((c, k) => { c.mend = k % 9 === 2 && k < 45 ? tapAt + 1.5 + (k / 9) * 0.32 : 1e6; });   // five of them are thrown again, pale, across the gap
      fallers = stood.slice(0, 46);
      fallers.forEach((c, k) => {
        const ss = clamp(c.s + lr.range(-0.11, 0.11), 0.05, 0.95); style.threadPoint(c.t, ss, q0); style.threadPoint(c.t, Math.min(ss + 0.02, 0.99), q1); q1.sub(q0).normalize();   // (spread along the broken length, not all at the window's middle)
        const out = Math.atan2(q0.x - eye.x, q0.z - eye.z) + (lr.chance(0.5) ? 1.57 : -1.57) + lr.range(-0.7, 0.7), drift = lr.range(2, 14);
        c.c0 = q0.clone(); c.dir = q1.clone(); c.len = lr.range(30, 68); c.w = lr.range(0.3, 0.9) * (lr.chance(0.5) ? 1 : -1); c.late = lr.range(0, 0.5);
        c.vx = Math.sin(out) * drift; c.vz = Math.cos(out) * drift; c.g = lr.range(4.5, 9) * (0.45 + 0.55 * ((k * 7) % 5) / 4);   // long slivers of sugar fall slowly, and not together
        const fall = Math.sqrt(2 * Math.max(c.c0.y - 45, 1) / c.g) * 0.9, lx = c.c0.x + c.vx * fall, lz = c.c0.z + c.vz * fall; c.ground = Math.max(hero.heightAt(lx, lz), 0) + 0.35;
        list.push({ a: [0, -50, 0], b: [0, -50, 1], t0: -20, seed: lr(), width: lr.range(0.6, 1.2), hs: 0.03 });   // hs under 0.04: a rigid sliver (no wobble)
      });
      if (!list.length) list.push({ a: [0, -50, 0], b: [0, -50, 1], t0: -20, seed: 0.5, width: 0.5, hs: 0.03 });
      shards = style.makeThreads(list, 12); shards.renderOrder = 2; shards.visible = false; scene.add(shards);
      shardA = shards.geometry.attributes.aA; shardB = shards.geometry.attributes.aB;
    }
    const tap = (js) => {
      const broke = js >= tapAt;
      for (const c of panel) hero.setThrow(c.i, c.stood ? (broke ? c.mend : c.t.t0) : 1e6);   // (those not yet thrown never are: the window stays open)
      U.uTap.value = smoothstep(tapAt + 0.15, tapAt + 1.25, js);
      shards.visible = broke; if (!broke) return;
      for (let k = 0; k < fallers.length; k++) {
        const c = fallers[k], t = Math.max(js - tapAt - c.late, 0), tl = Math.sqrt(2 * Math.max(c.c0.y - c.ground, 0.1) / c.g), tf = Math.min(t, tl);
        const y = c.c0.y - 0.5 * c.g * tf * tf, x = c.c0.x + c.vx * Math.min(t, tl + 1.5) * 0.9, z = c.c0.z + c.vz * Math.min(t, tl + 1.5) * 0.9;
        const flat = smoothstep(tl - 0.5, tl, t), ang = c.w * tf;                        // turns about a level axis, then lies down
        const ca = Math.cos(ang), sa = Math.sin(ang), hl = Math.hypot(c.dir.x, c.dir.z) || 1, hx = c.dir.x / hl, hz = c.dir.z / hl;
        let dy = (c.dir.y * ca + hl * sa) * (1 - flat), dh = (hl * ca - c.dir.y * sa); const n = Math.hypot(dy, dh) || 1; dy /= n; dh /= n;
        const L = c.len * 0.5, o = k * 3, yy = Math.max(y, c.ground);
        shardA.array[o] = x - hx * dh * L; shardA.array[o + 1] = yy - dy * L; shardA.array[o + 2] = z - hz * dh * L;
        shardB.array[o] = x + hx * dh * L; shardB.array[o + 1] = yy + dy * L; shardB.array[o + 2] = z + hz * dh * L;
      }
      shardA.needsUpdate = true; shardB.needsUpdate = true;
    };
    await Y();

    // ---- THE NEAR HERD. Small islands in clusters beside the course from the
    // strait to the Tall Peak's shoulder (stations from route metre 25 to 230; no cluster's first islet before route metre 25 or past 252): the two shapes only, pulled peaks 5 to 12 m
    // tall and spooned quenelles 6 to 14 m long, two to four to a cluster, the first of them the larger by a tenth or more. All of it is dealt
    // from a generator of its own (nr, seeded by a hash of layoutSeed) AFTER every draw of the deal above, and nothing above
    // reads it: the islets are not among `solids`. They enter only the custard's two data textures (as shores and casters,
    // below), and they are drawn. A station at which no lawful cluster can stand within its span searches again more widely (THE EMPTY STATION, below) and is left empty only when that finds no place either. Nothing here reads the lens, u or a clock.
    const near7 = [];   // every islet as it stands: x, z, r (how far its body reaches from its axis at any turn), its mould, scale, drop and bob
    {
      let st = (Math.floor(hsh(71, 13) * 4294967296) ^ 0x2545f491) >>> 0;
      const nr = () => { st = (st + 0x6d2b79f5) | 0; let t = Math.imul(st ^ (st >>> 15), 1 | st); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
      // four light moulds (a peak 396 triangles, a quenelle 312; see CAP, below, for what the whole near herd can weigh).
      // THE FOOT NEVER LEAVES THE CUSTARD: the foot is a peak's open foot ring (a fifth of the mould's height under its waterline) or a quenelle's two tips (the two ends of its keel: every other
      // point of its keel lies lower, so no end of it lifts clear); each islet is set lower in the custard by its own `drop` (fit, below), a peak's mould made so much larger that its highest vertex still stands its size over the level custard.
      // A quenelle's length is its body's: set so low, it shows seven to nine tenths of it over the level custard
      const NM = [];
      for (let k = 0; k < 2; k++) NM.push({ peak: true, radial: 12, geo: style.peakGeometry({ height: 1, radius: 0.37 + 0.05 * k, curl: 2.6 + 0.45 * k, dir: 0, radial: 12, rings: 16, wob: 0.9, rnd: nr, toast: 1 + 0.25 * k, sink: 0.2, bulge: 0.12 + 0.08 * k }), list: [] });
      for (let k = 0; k < 2; k++) NM.push({ peak: false, radial: 12, geo: style.quenelleGeometry({ length: 1, height: 0.42 + 0.05 * k, width: 0.5, seg: 13, radial: 12, rnd: nr, slump: k * 0.5 }), list: [] });
      for (const md of NM) { const a = md.geo.attributes.position.array; md.foot = []; if (md.peak) for (let i = 0; i < md.radial; i++) md.foot.push(i * 3); else md.foot.push(0, a.length - 3); }
      // the flown line, every metre (route metres 0 to 330), and the distance of a place from it over the custard: from the nearest of those points, LESS 0.025 m (between two points a metre apart the line itself
      // lies nearer to a place 8.2 m off or more by 0.016 m at most, and by its own bend by 0.007 m more: so no place is measured farther from the line than it lies)
      const LN = []; let gap = 1e-3; for (let d = 0; d <= 330; d++) { path.posAtDist(d, _p); if (d) gap = Math.max(gap, Math.sqrt((_p.x - LN[LN.length - 2]) * (_p.x - LN[LN.length - 2]) + (_p.z - LN[LN.length - 1]) * (_p.z - LN[LN.length - 1]))); LN.push(_p.x, _p.z); }
      // (gap: the most that two points of it next to each other lie apart; ih: the line's point beside the place in hand (frame, below), tried first; lx, lz, lb: the last place asked and its answer, kept. From a point q m away, with b the least so far, the next (q - b) / gap points cannot be nearer than b and are passed over: the same least as trying every point)
      let ih = 0, lx = 1e9, lz = 1e9, lb = 0; const lineD = (x, z) => { if (x === lx && z === lz) return lb; let b = Math.sqrt((LN[ih] - x) * (LN[ih] - x) + (LN[ih + 1] - z) * (LN[ih + 1] - z)); for (let i = 0; i < LN.length; i += 2) { const q = Math.sqrt((LN[i] - x) * (LN[i] - x) + (LN[i + 1] - z) * (LN[i + 1] - z)); if (q < b) b = q; else i += 2 * Math.floor((q - b) / gap); } lx = x; lz = z; return lb = b - 0.025; };
      // an islet's measure at a size (sq: a peak is that much broader one way, a quenelle that much broader across; its length is its size): R how far it reaches from its axis (it turns, so that is a ring); top, its highest point
      // over the sea at the top of its bob and tilt; need, the least distance of its axis from the line at which every vertex,
      // at every bob, tilt and turn, stands CLR m from a line flown between 2.9 and 3.6 m up; drop, the metres its body is set lower so that every vertex of its foot, at the top of its bob and at its greatest tilt,
      // is SEA m under the level sea: 0.75 m for the sea's deepest trough (the style's three swells together), 0.15 m of custard over the foot, 0.03 to spare;
      // sc, the scale of its mould: a quenelle's is its length; a peak's is such that, set drop m lower, its highest vertex (v.high, for the mould 1 m tall) stands its size over the level custard
      // (ring: every vertex of a mould 1 m tall or long at a breadth, as its distance from the axis and its height, made once for an islet of the deal, with the farthest (far) and the highest (high) of them, and for each ring of md.radial vertices its greatest distance and its least and greatest height;
      // fit reads a ring's every vertex unless those three bounds show that none of them can raise need or top: the same measure as reading every vertex)
      const ring = (md, sq) => {
        const a = md.geo.attributes.position.array, sx = md.peak ? sq : 1, sz = md.peak ? 1 : sq, nr = md.radial, n = a.length / 3, v = new Float64Array(n * 2), rb = new Float64Array(Math.ceil(n / nr) * 3); let far = 0, high = 0;
        for (let j = 0, i = 0, k = 0; i < a.length; j += 3) {
          let rm = 0, y0 = 1e9, y1 = -1e9;
          for (const e = Math.min(i + nr * 3, a.length); i < e; i += 3) { const ro = Math.sqrt(a[i] * sx * a[i] * sx + a[i + 2] * sz * a[i + 2] * sz), y = a[i + 1]; v[k++] = ro; v[k++] = y; if (ro > rm) rm = ro; if (y < y0) y0 = y; if (y > y1) y1 = y; }
          rb[j] = rm; rb[j + 1] = y0; rb[j + 2] = y1; if (rm > far) far = rm; if (y1 > high) high = y1;
        }
        v.rb = rb; v.far = far; v.high = high; return v;
      };
      const CLR = 8.2, SEA = 0.93, UB = [], TB = [], fit = (md, v, size, bob, tilt) => {   // (UB, TB: for the size in hand, what no vertex of a ring can need more than, and stand higher than)
        let top = 0, need = 0, g = 1e9, jn = 0, jt = 0; const ft = md.foot;
        for (let i = 0; i < ft.length; i++) g = Math.min(g, -v[ft[i] / 3 * 2 + 1] - v[ft[i] / 3 * 2] * tilt * 1.42);   // (the foot's depth for a mould 1 m tall or long, at its greatest tilt)
        const s = md.peak ? Math.max(size / v.high, (size + bob + SEA) / (v.high + g)) : size, drop = md.peak ? v.high * s - size : Math.max(0, bob + SEA - s * g), rb = v.rb, nR = rb.length / 3;
        for (let j = 0; j < nR; j++) { const rm = rb[j * 3] * s, swm = rm * tilt * 1.42 + bob, y1 = rb[j * 3 + 2] * s - drop, dm = Math.max(rb[j * 3 + 1] * s - drop - swm - 3.6, 2.9 - y1 - swm, 0); UB[j] = rm + Math.sqrt(Math.max(CLR * CLR - dm * dm, 0)); TB[j] = y1 + swm; if (UB[j] > UB[jn]) jn = j; if (TB[j] > TB[jt]) jt = j; }
        for (let c = -2; c < nR; c++) {   // (the two rings that promise most are read first, so that most of the others are passed over)
          const j = c === -2 ? jn : c === -1 ? jt : c; if (c >= 0 && (j === jn || j === jt || (UB[j] <= need && TB[j] <= top))) continue;
          for (let k = j * md.radial * 2, e = Math.min(k + md.radial * 2, v.length); k < e; k += 2) {
            const ro = v[k] * s, y = v[k + 1] * s - drop, sw = ro * tilt * 1.42 + bob;
            if (y + sw > top) top = y + sw;
            const dy = Math.max(y - sw - 3.6, 2.9 - y - sw, 0), nd = ro + Math.sqrt(Math.max(CLR * CLR - dy * dy, 0)); if (nd > need) need = nd;
          }
        }
        return { R: v.far * s, top, need, drop, sc: s };
      };
      const water = (md, v, f) => {   // a peak's radius at the waterline, as it stands
        for (let j = 0, y0 = 0, r0 = 0; md.peak && (j + 1) * md.radial * 2 <= v.length; j++) {
          let y1 = 0, r1 = 0; for (let k = j * md.radial * 2; k < (j + 1) * md.radial * 2; k += 2) { y1 += v[k + 1] * f.sc / md.radial; r1 = Math.max(r1, v[k] * f.sc); }
          y1 -= f.drop; if (y1 > 0) return j ? r0 + (r1 - r0) * (0 - y0) / (y1 - y0) : r1; y0 = y1; r0 = r1;
        }
        return 0;
      };
      // what stands already: the named islands (and any island alone in its mesh) by every vertex of theirs (so by their whole plan, overhangs too), the herd by its rings
      const fixed = [], GS = 3;
      // (squares: a named island's vertices sorted into squares GS m broad over its own plan, made when a place first comes near it: at[c] to at[c + 1] are the vertices of square c in xy.
      // A place can be within c m only of vertices in the squares that its own square of 2 c m touches, so free tries those)
      const squares = (f) => {
        const p = f.p, n = f.n, ci = f.ci, nx = f.nx = Math.floor((f.x1 - f.x0) / GS) + 1, nz = f.nz = Math.floor((f.z1 - f.z0) / GS) + 1, at = f.at = new Int32Array(nx * nz + 1), xy = f.xy = new Float64Array(n * 2);
        for (let i = 0; i < n; i++) at[(ci[i] = Math.floor((p[i * 2 + 1] - f.z0) / GS) * nx + Math.floor((p[i * 2] - f.x0) / GS)) + 1]++;
        for (let c = 0; c < nx * nz; c++) at[c + 1] += at[c];
        const to = at.slice(); for (let i = 0; i < n; i++) { const c = to[ci[i]]++ * 2; xy[c] = p[i * 2]; xy[c + 1] = p[i * 2 + 1]; }
      };
      for (const m of scene.children) {
        if (!m.isInstancedMesh || m.material !== merI || m.count !== 1) continue;
        m.getMatrixAt(0, _m); const a = m.geometry.attributes.position.array, e = _m.elements, e0 = e[0], e4 = e[4], e8 = e[8], e12 = e[12], e2 = e[2], e6 = e[6], e10 = e[10], e14 = e[14], n = a.length / 3, p = new Float64Array(n * 2), ci = new Int32Array(n); let x0 = 1e9, z0 = 1e9, x1 = -1e9, z1 = -1e9;
        for (let i = 0, k = 0; i < a.length; i += 3, k += 2) { const vx = a[i], vy = a[i + 1], vz = a[i + 2], x = e0 * vx + e4 * vy + e8 * vz + e12, z = e2 * vx + e6 * vy + e10 * vz + e14; p[k] = x; p[k + 1] = z; if (x < x0) x0 = x; if (x > x1) x1 = x; if (z < z0) z0 = z; if (z > z1) z1 = z; }
        fixed.push({ x: (x0 + x1) / 2, z: (z0 + z1) / 2, r: Math.hypot(x1 - x0, z1 - z0) / 2, x0, z0, x1, z1, n, p, ci, at: null });   // (x, z, r: a ring round the middle of its plan x0..x1, z0..z1 that holds all of it; p: its vertices as they stand)
      }
      const P0 = path.start, wl = Math.hypot(B.x - P0.x, B.z - P0.z), wx = (B.x - P0.x) / wl, wz = (B.z - P0.z) / wl, WEDGE = 0.2;
      const SR = strands.map((s) => { let x = 0, z = 0, q = 0; for (let i = 0; i < s.length; i++) { x += s[i][0]; z += s[i][2]; } x /= s.length; z /= s.length; for (let i = 0; i < s.length; i++) q = Math.max(q, (s[i][0] - x) * (s[i][0] - x) + (s[i][2] - z) * (s[i][2] - z)); return [x, z, Math.sqrt(q) + 1e-6]; });   // each laid coil's ring (a hair over, for the rounding), to pass it by quickly
      // what can refuse a place, each as [x, z, its own reach and the custard asked of it, ...]: ALL of it, and HERE, only what lies within LOC m and that reach of the station in hand (hx, hz).
      // A place whose ring lies within LOC m of the station is refused by the short lists exactly as by the whole ones (what is left out is farther than its reach from every such ring); any other place is tried against the whole
      const ALL = { fix: fixed.map((f) => [f.x, f.z, f.r + 4, f]), herd: [], coil: strands.map((s, i) => [SR[i][0], SR[i][1], SR[i][2] + 1.4, s]), bead: beads.map((b) => [b[0], b[1], 1 + b[2]]), drip: drips.map((d) => [d.m.position.x, d.m.position.z, 3]) }, LOC = 70;
      for (let i = named; i < solids.length; i++) ALL.herd.push([solids[i].x, solids[i].z, solids[i].r * reach5[i - named] + 4]);
      const within = (x, z, e, c) => (x - e[0]) * (x - e[0]) + (z - e[1]) * (z - e[1]) < c * c;   // (a place within c m of e)
      const local = (cx, cz) => { const o = {}; for (const k in ALL) o[k] = ALL[k].filter((e) => within(cx, cz, e, LOC + e[2])); return o; };
      let HERE = ALL, hx = 0, hz = 0, asked = 0;   // (asked: how often `free` was asked since the herd began or the build last handed back)
      const free = (x, z, R) => {
        asked++;
        // THE ENTRY'S SIGHT OF B: no islet's ring within 2 m of a wedge from the route's first point toward B, 0.2 m broad to each side for every metre ahead
        const al = (x - P0.x) * wx + (z - P0.z) * wz, lat = Math.abs((x - P0.x) * wz - (z - P0.z) * wx);
        if (al > 0 && lat < WEDGE * al + R + 2) return false;
        if (x * x + z * z < (176 + R) * (176 + R)) return false;
        const T = R <= LOC && (x - hx) * (x - hx) + (z - hz) * (z - hz) <= (LOC - R) * (LOC - R) ? HERE : ALL;
        for (let k = 0, A = T.fix; k < A.length; k++) {   // 4 m of custard to a named island
          const f = A[k][3], c = R + 4; if (x + c < f.x0 || x - c > f.x1 || z + c < f.z0 || z - c > f.z1) continue; if (!f.at) squares(f);
          if (x >= f.x0 && x <= f.x1 && z >= f.z0 && z <= f.z1) { const cc = Math.floor((z - f.z0) / GS) * f.nx + Math.floor((x - f.x0) / GS); if (f.at[cc + 1] > f.at[cc]) return false; }   // (a vertex in the place's own square is within 4.25 m of it, and c is 4 m and a ring: refused at once)
          for (let iz = Math.max(0, Math.floor((z - c - f.z0) / GS)), iz1 = Math.min(f.nz - 1, Math.floor((z + c - f.z0) / GS)); iz <= iz1; iz++) for (let ix = Math.max(0, Math.floor((x - c - f.x0) / GS)), ix1 = Math.min(f.nx - 1, Math.floor((x + c - f.x0) / GS)); ix <= ix1; ix++)
            for (let i = f.at[iz * f.nx + ix] * 2, n = f.at[iz * f.nx + ix + 1] * 2; i < n; i += 2) if ((x - f.xy[i]) * (x - f.xy[i]) + (z - f.xy[i + 1]) * (z - f.xy[i + 1]) < c * c) return false;
        }
        for (let k = 0, A = T.herd; k < A.length; k++) if (within(x, z, A[k], A[k][2] + R)) return false;   // and to a herd island at any turn
        for (let k = 0, A = T.coil; k < A.length; k++) { const e = A[k]; if (!within(x, z, e, e[2] + R)) continue; const q = (R + 1.4) * (R + 1.4), s = e[3]; for (let i = 0; i < s.length; i++) if ((x - s[i][0]) * (x - s[i][0]) + (z - s[i][2]) * (z - s[i][2]) < q) return false; }   // 1 m to a coil's rope (0.3 m thick at most, and its outer turn rings its disc)
        for (let k = 0, A = T.bead; k < A.length; k++) if (within(x, z, A[k], A[k][2] + R)) return false;
        if ((x - P5.x) * (x - P5.x) + (z - P5.z) * (z - P5.z) < (R + 2 + FOOT) * (R + 2 + FOOT) || (x - T5.x) * (x - T5.x) + (z - T5.z) * (z - T5.z) < (R + 2 + T5.r) * (R + 2 + T5.r)) return false;   // the pour on the open custard, by its own reach law
        if ((x - over.x) * (x - over.x) + (z - over.z) * (z - over.z) < (R + 4.3) * (R + 4.3)) return false;
        for (let k = 0, A = T.drip; k < A.length; k++) if (within(x, z, A[k], A[k][2] + R)) return false;   // nothing under a drip of the arch (a drop swings 0.41 m at most)
        for (let k = 0; k < near7.length; k++) { const o = near7[k]; if ((x - o.x) * (x - o.x) + (z - o.z) * (z - o.z) < (R + o.r + 2) * (R + o.r + 2)) return false; }
        return true;
      };
      // NEVER A CROWD, counted AT THE FLOWN LINE'S METRE MARKS (the points of LN, a metre apart; marks 1 to 329): at no mark do more than seven islets stand within 60 m (to their rings) and inside 60 degrees
      // to either side of the line's own heading there (the heading from the mark before to the mark after). BETWEEN TWO MARKS an eighth can stand inside that cone: the law counts at the marks and at no point
      // between them, and it counts along the flown line, not in the lens's picture. At the marks:
      // an islet that would be an eighth for some point is not placed, and a cluster's first islet is not placed where it would be a seventh (a cluster is two at least).
      // (CNT: how many each point of LN has so; sees: whether point i has a ring so; crowded asks for a ring; count adds it, or takes it away again)
      const CNT = new Uint8Array(LN.length / 2), HOT = [];   // (HOT: the points of LN that have six or more)
      const sees = (i, x, z, r) => {
        const dx = x - LN[i * 2], dz = z - LN[i * 2 + 1]; if (dx * dx + dz * dz > (60 + r) * (60 + r)) return false;
        const tx = LN[i * 2 + 2] - LN[i * 2 - 2], tz = LN[i * 2 + 3] - LN[i * 2 - 1]; return Math.abs(dx * tz - dz * tx) - 4 * r <= 1.732 * (dx * tx + dz * tz);   // (tx, tz: the heading, 2 m long, from the point before to the point after; 1.732: the tangent of 60 degrees; 4 r: a ring reaches into the cone when its middle lies 2 r beside its edge, and the heading is 2 m long)
      };
      const crowded = (x, z, r, most) => { for (let k = 0; k < HOT.length; k++) if (CNT[HOT[k]] >= most && sees(HOT[k], x, z, r)) return true; return false; };
      const count = (x, z, r, add) => {   // (a point q m from the ring's reach cannot see it, nor can the next q / gap points of the line: passed over)
        for (let i = 1; i < CNT.length - 1; i++) {
          const q = Math.sqrt((x - LN[i * 2]) * (x - LN[i * 2]) + (z - LN[i * 2 + 1]) * (z - LN[i * 2 + 1])) - 60 - r; if (q > 0) { i += Math.floor(q / gap); continue; }
          if (!sees(i, x, z, r)) continue;
          CNT[i] += add; if (add > 0 && CNT[i] === 6) HOT.push(i); else if (add < 0 && CNT[i] === 5) HOT.splice(HOT.indexOf(i), 1);
        }
      };
      // THE LAW OF PLACE: ten stations along the flown line, the first at route metre 25 to 29 and the last at 226 to 230 (by the
      // hash), the gaps between them drawn by the hash round their mean (20 to 25 m). A station is not left empty while a lawful place lies within its span (but for THE WORLD'S WEIGHT, below, on the heaviest scenes): its cluster stands at the FIRST
      // lawful place of an order that is the same at every station of every seed. The cluster's middle (its larger islet) is tried at 14 to 34 m from the line, a metre apart: from a first
      // distance by the hash (14 to 19 m) outward to 34 m, then the few nearer ones; at each distance at the station's own point and then metre by metre on along the line, 11 m at most (about half
      // the way to the next station); at each point first on the OUTER hand of the bend ahead (the hand the course turns away from) seven times in ten, on the inner
      // hand three times in ten (by the hash), then on the other hand. Only when no cluster can stand anywhere ahead so is the same tried behind the station, metre by metre back, 11 m at
      // most (never before route metre 25); and only when none can stand there either, the same again 12 to SPAN m ahead (about as far as the next station's own point), and then 12 to SPAN m behind.
      // THE LAST STATION'S SPAN IS EVERY OTHER'S: nothing cuts the search at route metre 230, so its first islet can stand as far on as route metre 230 + SPAN = 252. (A cut at 230 would leave the last
      // station 0 to 4 m of line ahead: beside the mound D on the right hand and the Tall Peak on the left, where often no cluster can stand; the open custard on the right hand begins a few metres on, past the mound's
      // tip.)
      // PAIRS FIRST: every station, in the order of the line, is given its first islet and ONE lesser beside it (the first of its deal's lessers that can stand); only when all ten stations have been tried so (and the empty ones again: THE EMPTY STATION, below) are
      // the clusters dealt three or four given their other lessers, IN THE ORDER IN WHICH THEIR PAIRS WERE FOUND: first the stations that stood at their own search, in the order of the line; then the stations placed by a later search (THE EMPTY STATION), in the order of the line among themselves. Each lesser is tried at its own bearings and stands only where the same refusals still allow it.
      // (Were each cluster given whole, the first stations' thirds and fourths would use up NEVER A CROWD's seven before the stations after them were tried.)
      // THE EMPTY STATION: a station whose whole search finds no place where a pair can stand does not lose its turn. When every station has had its turn, and before any cluster is given a third, each such station, in the
      // order of the line, searches again by the same refusals, hands first as before, in six steps, and its cluster stands at the first place that any step finds:
      // (1) nearer the line: 13, 12, 11 m from it, along its own span as before; (2) its own span and its own distances again, each lesser tried with its ring 2 to 9 m from the first islet's ring; (3) the same, 2 to 14 m;
      // (4) farther along the line: SPAN + 1 to 2 SPAN m ahead of its point, then as far behind (23 to 44 m), at its own distances; (5) 2 SPAN + 1 to 3 SPAN m ahead, then as far behind (45 to 66 m);
      // (6) farther from the line: 35 to 50 m from it, along its own span. At no step does a first islet stand before route metre 25 or past route metre 230 + SPAN = 252. A station that finds no place in all six is left empty.
      // The six steps are GENERAL IN FORM: any station of any deal that finds no place takes them, and none reads which station it is. THEIR FIGURES ARE TYPED: 23 to 66 m follows from SPAN and 252 is 230 + SPAN; 13 to 11 m and the lesser's 9 and 14 m were FITTED on stations that found no place (mostly the eighth station's, between the Tall Peak and islands of the far herd). SAID IN THE OPEN: five of the six steps were each found on ONE failing deal among the deals the herd was judged on (deals 1 to 1500), and the sixth only fills; what makes them a law and not a patch is the count on deals HELD OUT from the judging and counted once, deals 1501 to 2700: 11 deals under the 90 mark and none under the 60 mark, against 94 and 4 for the herd of the eighth.
      // The refusals are the same at every place, and every station's whole deal is drawn first, whether it stands or not.
      // (HAND: the herd's work is one stretch of the build; only where its search is long, `free` asked more than HAND times since it began or last handed back, does the build hand back in the midst of it: after a place of the search, or between two stations' later lessers)
      const NS = 10, SPAN = 22, HAND = 1800, gh = []; for (let i = 0; i < NS - 1; i++) gh.push(nr());
      const sA = 25 + 4 * nr(), sB = 230 - 4 * nr(), gm = gh.reduce((a, b) => a + b, 0) / gh.length;
      // THE WORLD'S WEIGHT. `before`: the triangles of the scene as it stands here, every mesh of the deal above at its full count of instances (the herd is the last thing added to the scene).
      // CAP: the moulds of a deal's islets weigh no more triangles than this together: WHOLE less ROOM less `before`, and never more than 9,504. So the herd lifts no deal's whole scene over WHOLE less ROOM
      // (a scene that weighs more than that before the herd gets no islet and stays as heavy as it is: nothing typed bounds `before`).
      // It reads the scene as dealt and nothing else: not a seed's number, not the lens, not a clock.
      // ROOM is 0. This sum counts every mesh of the scene whole; the page's own count of a frame (the engine's) leaves out what is hidden or stands outside the picture (flown alone on the EIGHTH round's bytes it measured the lower
      // at every place tried; not measured again on these). A companion of the engine's is in the page's count and not in this sum (the heaviest of the seven, the leapers,
      // 3,255 triangles): flown with the leapers the page's count can pass 500,000 on the heaviest deals, and ROOM keeps nothing for them. The 9,504 is typed (twenty-four of the heavier mould, the peak's 396 triangles) and is the most the herd may ever weigh.
      let before = 0; scene.traverse((o) => { if (o.isMesh) { const g = o.geometry; before += (g.index ? g.index.count : g.attributes.position.count) / 3 * (o.isInstancedMesh ? o.count : g.isInstancedBufferGeometry ? g.instanceCount : 1); } });
      const WHOLE = 500000, ROOM = 0, CAP = Math.max(0, Math.min(9504, WHOLE - ROOM - before));
      const D8 = [], N8 = []; for (let k = 0; k < NS; k++) { const d = []; for (let i = 0; i < 44; i++) d.push(nr()); D8.push(d); N8.push(d[2] < 0.4 ? 2 : d[2] < 0.85 ? 3 : 4); }
      const TRI = NM.map((md) => md.geo.index.count / 3), dealt = () => { let w = 0; for (let k = 0; k < NS; k++) for (let j = 0; j < N8[k]; j++) { const q = 4 + j * 10; w += TRI[D8[k][q] < pPeak ? (D8[k][q + 2] < 0.5 ? 0 : 1) : (D8[k][q + 2] < 0.75 ? 2 : 3)]; } return w; };
      for (let k = 0; k < NS && dealt() > CAP; k++) if (N8[k] === 4) N8[k] = 3;   // (clusters of four become three, from the first station on, and then clusters of three become two, from the first station on, until the dealt islets' moulds weigh CAP or less:
      for (let k = 0; k < NS && dealt() > CAP; k++) if (N8[k] === 3) N8[k] = 2;   // ten clusters of two of the heaviest mould weigh 7,920;
      for (const k of [1, 3, 5, 7, 9, 8, 6, 4, 2, 0]) { if (dealt() <= CAP) break; N8[k] = 0; }   // and where the scene before them is so heavy that even those weigh more than CAP, stations are left empty until they do not: first every second one from the second on
      // (the 2nd, 4th, 6th, 8th, 10th: the stations left stand evenly along the line; emptied from the last one back, the Tall Peak's shoulder would be bared first), then the others from the last back (the list is typed for NS = 10))
      const LATER = [], AGAIN = [];   // (PAIRS FIRST, above: each cluster's lessers still to be tried, a station at a time; THE EMPTY STATION, above: the later searches of the stations that found no place)
      const R4 = [[1, 0, 11], [-1, 1, 11], [1, 12, SPAN], [-1, 12, SPAN]], R6 = [[1, SPAN + 1, 2 * SPAN], [-1, SPAN + 1, 2 * SPAN]], R8 = [[1, 2 * SPAN + 1, 3 * SPAN], [-1, 2 * SPAN + 1, 3 * SPAN]];   // (the rounds of a search along the line, each [ahead or behind, from how many metres, to how many]: R4 a station's own span, R6 and R8 farther on)
      for (let k7 = 0, s = sA; k7 < NS; s += (sB - sA) / (NS - 1) + 2.4 * (gh[Math.min(k7, NS - 2)] - gm), k7++) {
        const d = D8[k7]; if (!N8[k7]) continue;   // (a station the world's weight leaves empty: its whole deal was drawn above all the same)
        path.tangentAtDist(s + 30, _p); path.tangentAtDist(s - 10, _s); const outer = _s.z * _p.x - _s.x * _p.z > 0 ? 1 : -1, hand = d[0] < 0.7 ? outer : -outer;   // (outer: +1 where the course turns left ahead; +1 is the right hand of one who flies it, as rx, rz below)
        let px = 0, pz = 0, rx = 0, rz = 0, ta = 0; const FR = [], frame = (i) => {   // (the line's point i m on from the station, its right hand and its heading: made once, kept)
          let f = FR[i + 3 * SPAN]; if (!f) { path.posAtDist(s + i, _p); path.tangentAtDist(s + i, _s); const tl = Math.hypot(_s.x, _s.z) || 1; f = FR[i + 3 * SPAN] = [_p.x, _p.z, -_s.z / tl, _s.x / tl, Math.atan2(_s.z, _s.x), 2 * Math.round(s + i)]; }
          px = f[0]; pz = f[1]; rx = f[2]; rz = f[3]; ta = f[4]; ih = f[5];
        };
        frame(0); HERE = local(px, pz); hx = px; hz = pz;
        const n = N8[k7], SL = [0, 1, 2, 3]; for (let j = 1; j < n && d[4] >= pPeak; j++) if (d[4 + j * 10] < pPeak) { SL[0] = j; SL[j] = 0; break; }   // (see ONE LARGER: the first peak of the deal changes places with a quenelle dealt first)
        // one islet of the deal, tried at a place at its dealt size, half way down and at the least size of its shape: it stands as the first that is free and makes no crowd,
        // never larger than the place allows (every vertex CLR m from the line at every phase; its top no higher than 0.7 of its axis's distance from the line)
        // ONE LARGER: an islet's size is a peak's height over the level custard or half a quenelle's length. The first islet of a cluster is the deal's first peak where it has one (a quenelle
        // is the first only among quenelles) and stands no smaller than 5.7 m (a peak; at a place that does not take it so it is tried once more at 5 m, the least of its shape, BEFORE the next place of the span is tried, and then stands 5 m exactly: so a first
        // peak can stand 5 m at one place though a later place of the same span would take it larger) or 6.8 m long (a quenelle); a lesser islet is dealt no larger than 0.89 of the first one's size
        // as it stands (so the first is the larger by a tenth of its size and more), and one whose shape cannot be so small (a peak under 5 m, a quenelle under 6) is left out
        let capM = 1e9; const IS = [], isl = (j) => {   // (an islet of the deal: its shape, mould, breadth, tilt, least size, and F, its measure at a size, which is the same at every place: all made once a station and kept)
          if (IS[j]) return IS[j];
          const q = 4 + SL[j] * 10, peak = d[q] < pPeak, md = NM[peak ? (d[q + 2] < 0.5 ? 0 : 1) : (d[q + 2] < 0.75 ? 2 : 3)], sq = 0.9 + 0.22 * d[q + 3], tilt = 0.03 + 0.04 * d[q + 9], lo = peak ? (j ? 5 : 5.7) : (j ? 6 : 6.8);
          const bobOf = (sz) => 0.6 + clamp(((peak ? sz : sz * 0.5) - 3) / 9, 0, 1), mem = new Map(), V = ring(md, sq), F = (sz) => { let f = mem.get(sz); if (!f) mem.set(sz, f = fit(md, V, sz, bobOf(sz), tilt)); return f; };   // the taller the islet the higher it bobs: 0.6 m for one 3 m tall to 1.6 m for one 12 m tall
          return IS[j] = { q, peak, md, sq, tilt, lo, bobOf, V, F };
        };
        const stand = (j, at) => {
          const { q, peak, md, sq, tilt, lo, bobOf, V, F } = isl(j), lim = j ? (peak ? capM : capM * 2) : 1e9; if (lim < lo) return false;
          const s0 = Math.min(peak ? (j ? 5 + 3 * d[q + 1] : 8 + 4 * d[q + 1]) : (j ? 6 + 3.5 * d[q + 1] : 10 + 4 * d[q + 1]), lim);
          for (let t = 0, nt = j || !peak ? 3 : 4; t < nt; t++) {   // (a first peak that this place does not take at 5.7 m is tried once more HERE at 5 m, the least of its shape, before the next place is tried: beside it only quenelles can then stand)
            const st = t < 3 ? s0 + (lo - s0) * t * 0.5 : 5, pl = at(F(st).R, d[q + 5], d[q + 6]), x = pl[0], z = pl[1], D = lineD(x, z); let sz = st, f = F(sz);
            if (f.need > D || f.top > 0.7 * D) { let a = Math.min(lo, st), b = st; f = F(a); if (f.need > D || f.top > 0.7 * D) { if (t >= nt - 1 || nt === 3) return false; t = 2; continue; } for (let i = 0; i < 9; i++) { const c = (a + b) / 2, g = F(c); if (g.need > D || g.top > 0.7 * D) b = c; else { a = c; f = g; } } sz = a; }
            if (!free(x, z, f.R) || crowded(x, z, f.R, j ? 7 : 6)) continue;
            count(x, z, f.R, 1); near7.push({ x, z, r: f.R, rw: water(md, V, f), top: f.top, drop: f.drop, sc: f.sc, md, peak, sz, sq, yaw: d[q + 4] * 6.283, bob: [d[q + 7], bobOf(sz), 5 + 3 * d[q + 8], tilt] }); return true;
          }
          return false;
        };
        let mark = near7.length; const R0 = isl(0).F(isl(0).peak ? 5 : isl(0).lo).R, k0 = Math.floor(d[1] * 6);   // (R0: the first islet's ring at the least size of its shape)
        // ONE SEARCH (seek): its rounds along the line in turn; in each round every distance from the line in turn (nk of them, offOf(k) m); at each distance every metre of the round; at each point the two hands.
        // It ends at the first place where a pair stands and says so (gap: how far off a lesser is tried, below); no first islet before route metre 25 or past route metre 230 + SPAN
        const seek = async (ROUNDS, nk, offOf, gap) => { mark = near7.length; for (const [dir, i0, i1] of ROUNDS) for (let k = 0; k < nk; k++) for (let i = i0; i <= i1; i++) {
          if (s + i * dir < 25 || s + i * dir > 230 + SPAN) continue;
          frame(i * dir);
          for (const h of [hand, -hand]) {
            const off = offOf(k), x0 = px + h * off * rx, z0 = pz + h * off * rz;
            if (!free(x0, z0, R0) || crowded(x0, z0, R0, 6) || !stand(0, () => [x0, z0])) continue;   // (the first islet's place is the same at every size, and a ring that is not free is not free when larger: so a place that refuses its least ring is passed by at once)
            const big = near7[mark], ta0 = ta; capM = 0.89 * (big.peak ? big.sz : big.sz * 0.5);
            // round it each lesser one tries twelve bearings, all round (the second ahead along the course, the third behind, the fourth to the side, each turned by the hash), its middle set so that its ring AT THE SIZE TRIED lies 2 to 2 + gap m of custard from the larger one's ring
            // (gap is 2.5 in every search but two: 2 to 4.5 m; it is 7 and 12 at the second and third steps of THE EMPTY STATION: 2 to 9 m, 2 to 14 m; a cluster's thirds and fourths are tried at the gap its pair was found with)
            // (an islet that the place allows only smaller than tried stands on the same middle with a smaller ring: the custard between is then broader by as much)
            const beside = (j) => { for (let b = 0; b < 12; b++) if (stand(j, (R, u, g) => { const a = ta0 + (j === 2 ? Math.PI : j === 3 ? h * 1.571 : 0) + (u - 0.5) * 1.5 + ((b + 1) >> 1) * (b & 1 ? 0.6 : -0.6), dd = big.r + R + 2 + gap * g; return [big.x + Math.cos(a) * dd, big.z + Math.sin(a) * dd]; })) return true; return false; };
            let j = 1; while (j < n && !beside(j++));   // PAIRS FIRST: of the deal's lessers only the first that can stand is placed now (j: the next one to try)
            if (near7.length - mark >= 2) {   // a cluster is two islets at least; a lone one is taken away again
              if (j < n) { const L = HERE, x5 = hx, z5 = hz; LATER.push(() => { HERE = L; hx = x5; hz = z5; for (; j < n; j++) beside(j); }); }   // (its other lessers wait until every station has been tried: then at the same bearings, by the same refusals, with this station's short lists)
              return true;
            }
            count(big.x, big.z, big.r, -1); near7.length = mark;
          }
          if (asked > HAND) { asked = 0; await Y(); }   // (a long search hands back: it changes no place)
        }
        return false; };
        const o14 = (k) => 14 + (k0 + k) % 21;   // (the distances of a station's own search: from 14 + k0 m outward to 34 m, then the few nearer ones)
        if (!(await seek(R4, 21, o14, 2.5))) { const L = HERE, x5 = hx, z5 = hz; AGAIN.push(async () => { HERE = L; hx = x5; hz = z5;   // THE EMPTY STATION: its six later searches, in this order, the first that finds a place ends them
          (await seek(R4, 3, (k) => 13 - k, 2.5)) || (await seek(R4, 21, o14, 7)) || (await seek(R4, 21, o14, 12)) || (await seek(R6, 21, o14, 2.5)) || (await seek(R8, 21, o14, 2.5)) || (await seek(R4, 16, (k) => 35 + k, 2.5)); }); }
      }
      for (const f of AGAIN) await f();   // (when every station has had its turn, and before any third or fourth)
      for (const f of LATER) { f(); if (asked > HAND) { asked = 0; await Y(); } }   // the thirds and fourths, in the order in which their pairs were found (the stations of the first search in the order of the line, then those placed by a later search)
      for (const o of near7) {
        o.md.list.push(o);
        // its shore and its shadow, as the herd's: a peak by its waterline, a quenelle by a ring of three tenths of its length (it turns)
        shores.push(o.peak ? { x: o.x, z: o.z, r: o.rw, h: o.sz * 0.9, round: 0.5, len: 3 } : { x: o.x, z: o.z, r: o.sz * 0.3, h: o.top - o.bob[1], round: 1, len: 3 });
      }
      // the style's instanced meringue with its coat line typed 1.1 m lower than the great islands' for the peaks (theirs, 0.5 m up, would coat half of a body 3 m tall) and 0.2 m higher for the quenelles.
      // The line is counted from the body's own origin, which lies `drop` under the level custard (a peak's under 1 m, a quenelle's 1.6 to 2.7 m): so over the level custard the line lies at about the same height on the one shape as on the other
      const merN = style.meringue({ instanced: true, coat: -0.6 }), merQ = style.meringue({ instanced: true, coat: 0.7 });
      NM.forEach((md, k) => {
        const n = md.list.length; if (!n) { md.geo.dispose(); return; }
        const im = new THREE.InstancedMesh(md.geo, md.peak ? merN : merQ, n), bob = new Float32Array(n * 4);
        md.list.forEach((o, i) => { _m.compose(_p.set(o.x, -o.drop, o.z), _q.setFromAxisAngle(UP, o.yaw), _s.set(o.peak ? o.sc * o.sq : o.sc, o.sc, o.peak ? o.sc : o.sc * o.sq)); im.setMatrixAt(i, _m); bob.set(o.bob, i * 4); });
        md.geo.setAttribute('aBob', new THREE.InstancedBufferAttribute(bob, 4)); im.frustumCulled = false; im.name = 'near-herd-' + k; scene.add(im);
      });
      await Y();
    }
    // ---- the custard's data textures: every shore and every caster, the near herd's among them
    const flowIslands = [hero.shore, ...shores.filter((o) => Math.hypot(o.x, o.z - 240) < 620 + o.r)];   // (the cage's feet are not shores: no skin folds ring them)
    await style.makeFlow(flowIslands, { size: 768, width: 1150, cx: 0, cz: 240, shadeSize: 384, casters: [...hero.casters, ...shores.filter((o) => o.h && Math.hypot(o.x, o.z - 240) < 1500).map((o) => (o.sr ? { ...o, r: o.sr } : o))] });
    await Y();

    // ---- life
    const camP = new THREE.Vector3();
    const update = (dt, time, camera, u = 0, dry = false) => {
      const js = clockOf(clamp(u, 0, 1));
      style.update(dt, time, camera); hero.setClock(js);
      if (!dry) hero.update(dt, time, camera);   // (draws the amber net into its target)
      if (!dry) U.uNetMat.value.multiply(_m.makeTranslation(0, 1.3 * Math.sin(time * 0.5), 1.3 * Math.cos(time * 0.5)));   // the cage trembles: its net of amber light creeps on the slopes
      camP.setFromMatrixPosition(camera.matrixWorld); sea.position.set(camP.x, 0, camP.z);
      pourB.visible = js < 3.32;
      const cyc = (time % 5) / 5, sl = smoothstep(0.84, 1, cyc);
      for (const k of coils) {
        k.grow.value = Math.min(cyc / 0.8, 1); k.m.scale.set(1 + 0.5 * sl, 1 - 0.85 * sl, 1 + 0.5 * sl); k.m.rotation.z = k.c.ride ? 0 : 0.35 * sl;   // (a stack on the open custard sinks flat; on rock it leans as it slumps)
        k.m.position.y = k.c.at[1] + k.c.bob(time); k.m.visible = js < k.c.until;
      }
      for (const d of drips) { const k = smoothstep(d.at, d.at + 2.4, js), kb = smoothstep(0.1, 0.8, k); d.m.visible = d.b.visible = k > 0; d.m.scale.set(1, Math.max(k, 0.04), 1); d.b.scale.setScalar(0.25 + 0.75 * kb); d.b.position.y = d.y - d.L * Math.max(k, 0.04); }
      for (const pk of pulls) setPull(pk, js);
      if (rare) tap(js);
    };
    update(0, 0, { matrixWorld: new THREE.Matrix4().setPosition(path.start) }, 0, true);

    return {
      scene, path, duration: 46,
      pace: (u) => 1 + 0.1 * smoothstep(uReveal, uReveal + 0.06, u) * (1 - smoothstep(uGate - 0.02, uGate + 0.05, u)) - 0.25 * smoothstep(uGate, uGate + 0.07, u) * (1 - smoothstep(uHollow - 0.04, 0.9, u)),
      camera: { fov: 62, near: 0.4, far: 4200, lookAhead: 22, sway: 0.5, bank: 0.6 },
      pois: [
        { at: [(B.x + C.x) / 2 - 6, 27, (B.z + C.z) / 2], from: 0.075, to: uArch * 0.85, weight: 0.45 },
        { at: [0, 78, 0], from: uReveal - 0.03, to: uGate - 0.02, weight: 0.5 },
        { at: [0, 66, -18], from: uGate + 0.03, to: 0.9, weight: 0.4 },
      ],
      portal: { shape: 'circle', radius: 7, tilt: true, color: '#FFE9B8', glow: 0.35, halo: false, revealDistance: 300 },
      post: { ...POST, exposure: 1 },
      ride: 'none', style: 'none',
      update,
      dispose() { hero.dispose(); const f = U.uFlow.value; if (f && f.dispose) f.dispose(); },
    };
  },
};
