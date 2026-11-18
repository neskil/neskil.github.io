// The Written Range. A mountain coast that is the record of its own earthquakes: a drum recorder's chart 1.9 km wide streams
// downstream (+Z) at 20 m/s under a rail of 140 pens, every ridge is one pen's trace standing up as a paper curtain edged in ink,
// and at flight second 19 the valley's twelve long arms are flung up and write a range 300 m tall, which we climb through.
//
// Style (kept everywhere): one chart stock, one printed ruling colour, three inks; the instrument alone is blued steel and brass.
// Unlit ShaderMaterials writing palette colours, post flat (no tone map, no inverse), no fog, no lights, no bloom, no full-screen pass.
// Everything is shaded by the routines of src/parts/written-range.js (curtain, sheet, instrument materials, STYLE_GLSL).
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { makePath } from '../kit/core.js';
import { buildHero, sheetMaterial, instrumentMaterial, inkCarGeometry, toned, M4, STYLE_GLSL, WR, steelGap } from '../parts/written-range.js';

const DURATION = 50;
const ss = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

// The route: in 32 m upstream of the rail, low, under the first tide arm to its nib and the ink car (u 0.02); down beside the tide
// curtain at the height of its swell (the record stands still beside us); up and out west over the inlet, the last shock broadside on
// the left; a left-hand turn over the inlet and the quiet rows and out of it slantwise across the valley, 30 degrees off the rows,
// toward the new range (the long arms went up behind us as we went out over the inlet); into the east gap at z 166 and up through the
// range, ranks on both sides (the gaze goes out east to the pens writing the east ranks as the red pen comes up); nearly level and
// slowly past the red pen (4.5 m off, level with the eye); then, climbing on between the two flanking arms, the gaze follows the pen
// back down the gap (the nibs writing, the range we came through, the straw distance) and comes round by the east to the girder seen
// slantwise; under the beam and straight on upstream from under it, a round to the right onto a base leg that runs east 52 m behind
// the girder's pivots (the stand-back: the whole instrument seen square and level from behind its pivots while an aftershock
// writes), a round to the left onto the hole's line (the sheet climbing the drum, the eyelet in its dimple) and down into the
// eyelet at x 168. About 1150 m in 50 s.
// Nothing written is rewritten in view: the ranks are a fixed landscape the record streams through, the two sheets beside the gap
// are low from the shock's first second, and the red row's peaks are settled as they are written.
// yE: eye height on entry (just over the highest tide, so the tide nib passes a little below the eye); yW: floor over the inlet; yF: beside the tide curtain.
// THE STAND-BACK: the twelve keys the eye flies from under the long beam to the hole's line. Straight on upstream from under the
// girder (x 42) to z -192, a round to the right onto the base leg, which runs east at z -210 (52 m behind the girder's pivots)
// from x 60 to x 143.3, and a round to the left onto the hole's line at x 168; the crest is 143 m. The base leg's four keys are
// its two ends and its thirds: the gaze's swing from the recorder to the hole is anchored on its two ends (see the look `back`).
// These twelve keys stand in the place of the twelve of the beam run (the last of them is the same key), and the two ways are the
// same length (the last round's radius, and with it the base leg's last key and that round's keys, and the first round's second
// key's z to eight decimals are solved for it), so every place before and after them is passed at the same metre of the flight.
const BASE_LEG = [[60, 142.8, -210], [87.8, 143, -210], [115.5, 142.8, -210], [143.3, 142.3, -210]];
const STAND_BACK = [
  [42, 140.6, -174.2], [42, 141.4, -192], [45.2, 141.9, -201], [51, 142.4, -206.78594406], ...BASE_LEG,
  [155.7, 141.6, -214.4], [163.6, 140.7, -222.3], [168, 139.8, -234.7], [168, 139.2, -248.4],
];
// The beam run: the line the paper rounds are strung along (the trail, the punch's sleeve and their clear spaces are laid round
// it: see `strung`). Out from under the girder to the right, round onto its upstream side and along it 13 m from the
// counterweights, then left over the crest to the hole's line.
const BEAM_RUN = [
  [47.4, 141.5, -179.2], [61.7, 142.5, -189.4], [77.2, 143, -191], [89.2, 144.6, -187], [101, 149, -182], [114, 152.4, -178.5],
  [127, 152, -179.5], [140, 149, -186], [152, 145.6, -197], [161.5, 143.2, -211], [166.6, 141.5, -226.5], [168, 139.2, -248.4],
];
// (flown: the route the eye flies. Not flown: the same route with the beam run in the stand-back's place)
const routeFor = (yE, yW, yF, flown) => [
  // in 32 m upstream of the rail, under the first tide arm, and straight on to cross the rail at x -45: the arm, its nib's bulb
  // and the ink car pass on the right, the bulb with two metres of clear air and more
  // (from the valley side of the tide arm, so the arm comes in over the right shoulder and ends at its nib right of the axis)
  [-44.6, yE - 1.9, -32], [-44.7, yE - 1.6, -24], [-44.9, yE - 1.2, -13.5], [-45, yE - 0.6, -8], [-45, yE - 0.2, -3], [-45, yE + 0.1, 4],
  // beside the tide curtain, a little over its line and five metres off it: the record stands still beside us
  [-45.3, yE - 0.6, 22], [-44.7, yF + 0.5, 44], [-44.5, yF + 0.5, 64], [-45.2, yF + 0.9, 84],
  // up and out west over the swell tops, the West Range standing in on the right, the last shock broadside on the left
  [-49, Math.max(yE + 3.3, yW + 2.2), 116], [-66, Math.max(12.5, yW + 2), 146], [-86, Math.max(13.5, yW + 2), 184], [-97, Math.max(14.5, yW + 2), 216],
  // the turn, left, over the inlet and six quiet rows, and out of it slantwise across the valley toward the east gap
  [-98, Math.max(15.5, yW + 2), 240], [-87, Math.max(17, yW + 2), 270],
  [-62, Math.max(19.2, yW + 2.7), 288.5],
  [-34, 19.5, 284.5], [-12, 19.5, 265.5],
  [8, 19, 238], [25, 18.5, 210], [36.5, 17.8, 186], [41.2, 17, 166], [42, 16, 148], [42, 24, 128],
  // up through the range, then nearly level for 20 m past the red pen (it stands at z 40, 4.5 m to the right, level with the eye), and on up
  [42.6, 46, 90], [43.6, 58, 66], [44.2, 62.5, 54], [44.4, 63.6, 45], [44.6, 64.6, 37], [45, 68, 28], [44.4, 75, 16], [42.8, 83, 2], [42.2, 90, -14], [42.2, 107, -60], [42.6, 127, -112],
  // under the long beam, then the stand-back (or the beam run) to the hole's line
  [42.3, 137.5, -148], [42, 139.6, -162], ...(flown ? STAND_BACK : BEAM_RUN),
  // and down into the hole punched where the sheet climbs the drum
  [168, 136.9, -259.9], [168, 130.4, -269.6], [168, 109, -291], [168, 88, -312],
];

// Speeds are true (m/s along the path at distance d), which is what pace(u) hands the engine.
function speedAt(d, L, dNib, dGap) {
  const x1 = d - dNib;           // metres past the first nib
  const x = d - dGap + 595;      // metres on the old scale from the gap on (the route from there is as it was)
  return 11 + 9 * ss(6, 46, x1) + 10 * ss(150, 270, x1) - 8 * ss(545, 615, x) + 5 * ss(748, 805, x)
    - 7 * ss(572, 600, x) * (1 - ss(640, 690, x))        // lingering in the amphitheatre: ranks on both sides of the gap
    - 6 * ss(650, 692, x) * (1 - ss(722, 760, x))       // lingering where the gaze comes round from the massif to the red pen
    - 7 * ss(694, 706, x) * (1 - ss(722, 734, x))       // and a second and a half beside the pen itself
    - 10 * ss(878, 903, x) * (1 - ss(950, 975, x))      // slowly under the long beam, while the gaze pans round to the pens
    - 3 * ss(915, 950, x) - 2.5 * ss(985, 1005, x) + 2.5 * ss(1040, 1070, x) - 1 * ss(L - 110, L - 70, d);   // under the beam; slower through the swing onto the hole
}

const EDITIONS = {
  cream: 'The Written Range', buff: 'The Written Range, iron-gall edition', ledger: 'The Written Range, ledger edition',
};

export default {
  id: 'written-range',
  name: 'The Written Range',
  category: 'wilderness',
  weirdness: 0.35,
  media: ['air', 'open'],
  async build(ctx) {
    const scene = new THREE.Scene();
    const detail = Math.min(1, Math.max(0.6, ctx.quality?.detail ?? 1));
    const vary = ctx.vary || {};
    const rng = ctx.rng.fork('written-range-world');

    // ---------------------------------------------------------------- the edition (seeded once; nothing switches in flight)
    const stock = rng.fork('stock').pick(['cream', 'cream', 'buff', 'ledger']);
    const record = rng.fork('record').pick(['calm', 'calm', 'storm', 'spring']);
    const shock = rng.fork('shock').pick(['sharp', 'sharp', 'swarm', 'giant']);
    const hourPick = rng.fork('age').pick(['day', 'day', 'day', 'golden', 'night']);
    const hour = vary.hour === 'golden' || vary.hour === 'night' ? vary.hour : vary.hour === 'dawn' || vary.hour === 'day' ? 'day' : hourPick;
    const density = Math.min(1.3, Math.max(0.7, vary.density ?? 1));
    const rare = !!vary.rare;

    const hero = await buildHero(ctx, { detail, stock, record, shock, hour, density, floor: false });
    const U = hero.uniforms;
    scene.add(hero.object);
    U.uQuake2.value.x = -14.5;                      // the last shock was written 14 s ago: its coda is still settling at the rail on entry, its ranges stand from z 60
    if (hour !== 'day') {                            // an old sheet: straw and shade go a step browner, so distance still reads as age
      U.uStraw.value = U.uStraw.value.clone().lerp(U.uSepia.value, hour === 'night' ? 0.24 : 0.16);
      U.uShade.value = U.uStraw.value.clone().lerp(U.uSepia.value, 0.32);
      U.uDeep.value = U.uStraw.value.clone().lerp(U.uSepia.value, 0.5);
    }
    scene.background = U.uStraw.value.clone();      // the straw the floor yellows to; the sheet is closed on every side, so this is never seen
    await ctx.yield();

    // ---------------------------------------------------------------- the path, the pace and the flight clock
    const yE = Math.max(8.5, hero.tideMax + 0.2), yW = Math.max(hero.tideMax + 1.5, record === 'storm' ? 14.5 : 0);
    const path = makePath(routeFor(yE, yW, 0.72 * hero.tideMax, true));   // yF: beside the tide curtain the eye is level with its swell
    // the line the paper rounds are strung along: the same route with the beam run in the stand-back's place (the eye does not fly it)
    const strung = makePath(routeFor(yE, yW, 0.72 * hero.tideMax, false));
    const L = path.length;
    // metres flown where the route passes one of its own keys, from the curve's own table of lengths (the kit lays the keys at even
    // steps of the curve's parameter): the place is the key itself, not the nearest of the route's stations
    const metresAtKey = (key) => {
      const tab = path.curve.getLengths(), n = path.points.findIndex((p) => p.x === key[0] && p.y === key[1] && p.z === key[2]);
      const x = n / (path.points.length - 1) * (tab.length - 1), j = Math.min(tab.length - 2, Math.floor(x));
      return tab[j] + (tab[j + 1] - tab[j]) * (x - j);
    };
    const uNib = path.nearestXZ(-47.3, 0).u, dNib = uNib * L, dGap = path.nearestXZ(42, 148).u * L;
    let vAvgInv = 0;
    const NP = 256, sTab = new Float32Array(NP + 1);
    for (let i = 0; i < NP; i++) {
      const inv = 1 / speedAt((i + 0.5) / NP * L, L, dNib, dGap);
      vAvgInv += inv / NP; sTab[i + 1] = sTab[i] + inv / NP;
    }
    const vAvg = 1 / vAvgInv;
    const pace = (u) => speedAt(Math.min(1, Math.max(0, u)) * L, L, dNib, dGap) / vAvg;
    // flight seconds at u: the same integral the engine makes of pace(u)
    const flightSeconds = (u) => {
      const x = Math.min(1, Math.max(0, u)) * NP, i = Math.min(NP - 1, Math.floor(x));
      return DURATION * (sTab[i] + (sTab[i + 1] - sTab[i]) * (x - i)) / sTab[NP];
    };
    // the hero's clock is flight seconds, laid so that we pass the first nib at 1.5 (the ink car is at that pen at 0..1.6: before
    // it the car is seen rolling to it and lowering its spout). The long arms go up as we go out over the inlet, behind our left
    // shoulder, so that when the turn brings the valley head round the new range already stands 100 m long, and 150 to 200 m long
    // while we come at it slantwise; it is still being written when we come abreast of the red pen (camera z 42).
    const uTurnEnd = path.nearestXZ(41.2, 166).u, uQ = path.nearestXZ(-90, 195).u, uApex = path.nearestXZ(-62, 292).u;
    const sQ = flightSeconds(uQ), sNib = flightSeconds(uNib), sPass = flightSeconds(path.nearestXZ(44.5, 40).u);
    const hQ = 1.5 + sQ - sNib, hPass = hQ + (sPass - sQ) * 0.92;
    U.uQuake.value.z += hPass - hQ - 9.9;           // the pens are held against their stops until we have passed them
    U.uQuake.value.x = hQ;
    const heroSeconds = (u) => {
      const s = flightSeconds(u);
      // past the red pen the clock eases to about half speed: the coda is still being written when the instrument is seen from behind its pivots
      const e = Math.max(0, s - sPass), tail = -0.45 * e * e / (e + 1.5);
      return s <= sQ ? 1.5 + s - sNib : hQ + (s - sQ) * 0.92 + tail;
    };
    await ctx.yield();

    // ---------------------------------------------------------------- the sheet: floor, drum and vault are one chart
    // Floor y 0 for z > -100; up a 300 m radius round (y 300, z -100); a flat vault at y 600 running back downstream.
    // aS = metres along the paper, growing downstream on the floor (aS = z), so the vault's rulings slide back overhead.
    const seat = hero.anchors.portalSeat, drum = hero.anchors.drum;
    {
      const R = drum.radius, zc = drum.z, half = WR.sheetHalf, nx = 8;
      const prof = [];                                   // [y, z, s]
      for (let k = 0; k <= 8; k++) { const z = 2100 - (2100 - zc) * (k / 8); prof.push([0, z, z]); }
      for (let k = 1; k <= 72; k++) { const th = Math.PI * k / 72; prof.push([R - R * Math.cos(th), zc - R * Math.sin(th), zc - R * th]); }
      for (let k = 1; k <= 8; k++) { const z = zc + (2100 - zc) * (k / 8); prof.push([2 * R, z, zc - R * Math.PI - (z - zc)]); }
      const pos = [], aS = [], idx = [];
      for (let i = 0; i < prof.length; i++) for (let j = 0; j <= nx; j++) { pos.push(-half + 2 * half * j / nx, prof[i][0], prof[i][1]); aS.push(prof[i][2]); }
      for (let i = 0; i < prof.length - 1; i++) for (let j = 0; j < nx; j++) {
        const a = i * (nx + 1) + j, b = a + nx + 1;
        idx.push(a, b, a + 1, a + 1, b, b + 1);
      }
      // the far sides are closed with the same paper (two walls 2.7 km off, the floor's age at their feet and the vault's fresh
      // sheet at their tops), so that looking along the rail the sheet has no end and no patch of another tone stands at the
      // vanishing point. A wall is the chart's own outline: it takes every station of the floor's, the drum's and the vault's edge,
      // so no edge of it meets the middle of another edge and no seam can open between them.
      const last = prof.length - 1;
      for (const sx of [-half, half]) {
        const b = pos.length / 3;
        for (let i = 0; i <= last; i++) { pos.push(sx, prof[i][0], prof[i][1]); aS.push(prof[i][1]); }
        for (let k = 0; k < 8; k++) { const f = b + k, v = b + last - k; idx.push(f, f + 1, v, v, f + 1, v - 1); }   // down the valley: each floor station under the vault's
        for (let i = 9; i < 80; i++) idx.push(b + 8, b + i, b + i + 1);                                              // the drum's side: a fan from its foot round its 72 stations
      }
      // the far end is closed the same way at z 2100, from the floor to the vault (the floor's straw at its foot, the vault's colour
      // at its top: they meet without a line), on the stations the floor and the vault have across their ends
      {
        const b = pos.length / 3;
        for (let j = 0; j <= nx; j++) { const x = -half + 2 * half * j / nx; pos.push(x, prof[0][0], prof[0][1], x, prof[last][0], prof[last][1]); aS.push(2100, 2100 + prof[last][0]); }
        for (let j = 0; j < nx; j++) { const a = b + 2 * j; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      g.setAttribute('aS', new THREE.Float32BufferAttribute(aS, 1));
      g.setIndex(idx);
      const sheet = new THREE.Mesh(g, sheetMaterial(U));
      sheet.frustumCulled = false; sheet.renderOrder = -1;
      scene.add(sheet);
      U.uHole.value.set(seat.position.x, seat.position.y, seat.position.z, seat.eyelet + 0.1);
    }
    await ctx.yield();

    // ---------------------------------------------------------------- the eyelet: brass, bound into the hole the punch left
    const statMat = instrumentMaterial(U, 'static'); statMat.side = THREE.DoubleSide;
    const seatM = M4(seat.position.x, seat.position.y, seat.position.z, -Math.PI / 4);   // local +Z = out of the sheet, toward the eye
    {
      const r = seat.eyelet, parts = [];
      parts.push(toned(new THREE.TorusGeometry(r + 0.75, 0.75, 10, 56), 1));                                        // the rolled rim
      parts.push(toned(new THREE.RingGeometry(r + 0.6, r + 2.6, 56, 1), 1, M4(0, 0, 0.12)));                         // its flange on the paper
      parts.push(toned(new THREE.TorusGeometry(r + 2.6, 0.22, 6, 56), 1, M4(0, 0, 0.12)));                           // the flange's beaded edge
      parts.push(toned(new THREE.CylinderGeometry(r, r, 2.2, 56, 1, true), 0, M4(0, 0, -0.6, Math.PI / 2)));         // blued sleeve through the sheet
      await ctx.yield();
      parts.push(toned(new THREE.RingGeometry(r + 2.6, r + 5.4, 56, 1), 0, M4(0, 0, 0.06)));                         // the blued washer plate under it
      parts.push(toned(new THREE.TorusGeometry(r + 5.4, 0.3, 6, 56), 1, M4(0, 0, 0.1)));                             // and its brass edge
      for (let k = 0; k < 24; k++) {                                                                                  // brass rivets in the washer
        const a = k / 24 * Math.PI * 2;
        parts.push(toned(new THREE.SphereGeometry(0.34, 6, 4), 1, M4(Math.cos(a) * (r + 4), Math.sin(a) * (r + 4), 0.1)));
      }
      for (let k = 0; k < 16; k++) {                                                                                  // sixteen steel rivets in the flange
        const a = (k + 0.5) / 16 * Math.PI * 2;
        parts.push(toned(new THREE.SphereGeometry(0.3, 8, 5), 0, M4(Math.cos(a) * (r + 1.85), Math.sin(a) * (r + 1.85), 0.16)));
      }
      await ctx.yield();
      const g = mergeGeometries(parts);
      // the sheet is climbing the drum here: the eyelet's plates are rolled to the same 300 m curve, so they lie on the paper all round
      { const gp = g.attributes.position; for (let i = 0; i < gp.count; i++) gp.setZ(i, gp.getZ(i) + gp.getY(i) * gp.getY(i) / (2 * drum.radius)); }
      g.applyMatrix4(seatM);
      await ctx.yield();
      const eyelet = new THREE.Mesh(g, statMat);
      eyelet.frustumCulled = false;
      scene.add(eyelet);
    }
    await ctx.yield();

    // ---------------------------------------------------------------- the dimple's relief: paper lips round the hole
    // The punch puckered the chart: at the edge of each of the sheet's four steps of tone the inner sheet's rim is lifted, a leaf of
    // the same stock: a flat sheet folded up just inside the step's edge and running straight out over the next step, so the lower
    // sheet passes in under it. Two flat tones and no other: its face one tone of the stock (the nearest to its own sheet's) with
    // the chart's print across it, its underside and its cut edge the straw. The leaves ride the steps' own wandering edges and
    // breathe with them as the sheet passes over the drum. No lip is darker than the straw.
    {
      // four rows of points to a lip: the fold and the lifted edge (the leaf), then the lifted edge again and the cut edge's foot
      const NA = 192, pos = [], idx = [];
      for (let k = 0; k < 4; k++) {
        const base = pos.length / 3;
        for (let j = 0; j <= 3; j++) for (let i = 0; i <= NA; i++) pos.push(i / NA, j, k);
        for (const j of [0, 2]) for (let i = 0; i < NA; i++) { const a = base + j * (NA + 1) + i, b = a + NA + 1; idx.push(a, b, a + 1, a + 1, b, b + 1); }
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx);
      const lipMat = new THREE.ShaderMaterial({
        uniforms: U, side: THREE.DoubleSide,
        vertexShader: /* glsl */`
varying vec3 vC; varying float vTone;
${STYLE_GLSL}
void main() {
  float k = position.z, a = position.x * 6.2831853, row = position.y, t = uTime;
  // the angle round the hole as the sheet's own shader counts it, and that step's edge (see sheetMaterial: e1 .. e4)
  float ang = atan(cos(a) + 1e-3, -sin(a));
  float w1 = 2.2 * sin(ang * 5. + 1.) + 1.1 * sin(ang * 9. - t * .35);
  float w2 = 3.6 * sin(ang * 4. + 2.7) + 1.6 * sin(ang * 7. + t * .3);
  float w3 = 5.5 * sin(ang * 3. + 4.1) + 2.4 * sin(ang * 6. - t * .25);
  float e1 = 8. * (1. + .09 * sin(t * .9)) + w1, e2 = 22. * (1. + .07 * sin(t * .9 - 1.1)) + w2, e3 = 46. * (1. + .05 * sin(t * .9 - 2.2)) + w3;
  float e4 = 78. + 1.5 * w3 + 3. * sin(t * .9 - 3.3);
  float edge = mix(mix(e1, e2, step(.5, k)), mix(e3, e4, step(2.5, k)), step(1.5, k));
  // a leaf is 2.6 to 5.3 m across on the paper: folded up a fifth of that inside its step's edge, it runs straight to its lifted
  // edge four fifths of it out over the next step, which stands 1.5 to 3.3 m off the sheet, breathing
  float wid = 2.6 + .9 * k, hgt = (1.85 + .3 * k) * (1. + .18 * sin(t * .9 - 1.1 * k + ang * 2.));
  // where a step's edge runs in under the eyelet's washer (its outer edge is 5.6 m from the hole's lip) the lip lies down and
  // ends at the washer: the eyelet stays whole and uncovered
  float rim = uHole.w + 5.85;
  float r0 = max(uHole.w + edge - .2 * wid, rim), r1 = max(uHole.w + edge + .8 * wid, rim);
  float lift = hgt * smoothstep(rim, rim + 1., r1), run = max(r1 - r0, 1e-3), sl = sqrt(run * run + lift * lift);
  // rows 0 and 1 are the fold and the lifted edge; rows 2 and 3 the cut edge, the leaf's own 15 cm square to its face
  float f = step(.5, row), cut = step(2.5, row) * .15 * min(lift, 1.);
  float r = mix(r0, r1, f) + cut * lift / sl, h = .06 + f * lift - cut * run / sl;
  // r and a are metres on the paper round the hole, as the sheet's own shader counts them; the sheet is climbing the 300 m drum here
  vec2 q = r * vec2(cos(a), sin(a));
  float th = clamp(q.y / 300., -1.5, 1.5);
  vec3 p = vec3(q.x, (300. - h) * sin(th), 300. - (300. - h) * cos(th));
  // its print is the inner sheet's own, carried on up the leaf from the fold (drawn in toward the hole as the sheet's is)
  float holeS = -100. - 300. * asin(clamp((-100. - uHole.z) / 300., -1., 1.));
  float rho = r0 + f * sl, hr = max(rho - uHole.w, 0.);
  rho += 26. * (1. - exp(-hr / 9.)) * exp(-hr / 45.);
  vC = vec3(uHole.x + rho * cos(a), holeS - rho * sin(a), row);
  // its face is one flat tone, its own sheet's: the sheet's shader counts 3.7, 2.7, 1.7 and 0.7 steps of tone inside the four
  // edges; here each step is .43 of the way from the stock to the straw (the nearest tone of the stock to the sheet's own), and
  // no face goes nearer the straw than .85
  vTone = min(.85, .43 * (3.7 - k));
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.);
}`,
        fragmentShader: /* glsl */`
varying vec3 vC; varying float vTone;
${STYLE_GLSL}
void main() {
  // two flat tones, meeting at the lifted edge: the face is the stock in its sheet's own tone, printed; the underside and the cut
  // edge (rows 2 to 3) are plain, the straw
  float face = (gl_FrontFacing ? 1. : 0.) * (1. - step(1.5, vC.z));
  vec3 paper = mix(uPaper, uStraw, vTone);
  float px = vC.x, rec = vC.y - uScroll;
  float fx = max(fwidth(px), 1e-4), fs = max(fwidth(vC.y), 1e-4);
  float lx = (fract(px / 14.) - .5) * 14.;
  float arcC = rec - (12.5 - sqrt(max(156.25 - lx * lx, 0.)));
  float fa = max(fwidth(arcC), 1e-4);
  fa = mix(fa, fs, step(4. * fs + .5, fa));
  float pr = max(wrRule(px, 7., .12, fx), wrRule(arcC, 20., .2, fa));
  pr = max(pr, max(wrRule(rec, 102.4, .34, fs), wrRule(px, 1.75, .05, fx) * .7));
  pr = max(pr, wrRule(arcC, 4., .05, fa) * .7);
  paper = mix(paper, uPrint, pr * .9);
  gl_FragColor = vec4(mix(uStraw, paper, face), 1.);
}`,
      });
      const lips = new THREE.Mesh(g, lipMat);
      lips.applyMatrix4(seatM); lips.frustumCulled = false;
      scene.add(lips);
    }
    await ctx.yield();

    // ---------------------------------------------------------------- the punch that cut the hole, withdrawn
    // One punch, made as the recorder is made (blued steel and brass, flat): a brass die the size of the hole, DIE_H metres of plain
    // brass standing below a riveted blued head (the head's flange 0.3 m wider than the die) with a crown of teeth TOOTH metres long
    // at its foot, on its own blued arm from the long beam, as the pens hang from it. It has been run 28 m east
    // along the beam (midway between two pens' saddles) and stands with its head PUNCH_LIFT metres off the sheet and the teeth of
    // its die PUNCH_LIFT + DIE_FOOT - TOOTH metres clear of it, its axis parallel to the last run: every part of it is 15 m or more from that line, and it settles a little on its arm.
    // Its saddle hangs PUNCH_HANG metres under the girder in a stirrup, so that the saddle, the back rod and the counterweight all
    // pass UNDER the feed car's run along the beam (the car's lowest point is its spout, 2.2 x 3.85 m under its rails).
    const PUNCH_X = 28, PUNCH_LIFT = 24, PUNCH_HANG = 13;
    // (the head stands where it stood; the die runs down from the flange's underside, 3.4 m up the tool, to its foot at DIE_FOOT)
    const DIE_H = 7, TOOTH = 1.9, DIE_FOOT = 3.4 - DIE_H;
    const nOut = new THREE.Vector3(0, Math.SQRT1_2, Math.SQRT1_2);
    const punchPivot = new THREE.Vector3(seat.position.x + PUNCH_X, hero.anchors.longBeam.y - PUNCH_HANG, hero.anchors.longBeam.z);
    const punchDie = seat.position.clone().add(new THREE.Vector3(PUNCH_X, 0, 0)).addScaledVector(nOut, PUNCH_LIFT);
    const punch = new THREE.Group();
    punch.name = 'wr-punch';
    {
      // (built round the pivot, so it can settle on it; d = metres up the tool's axis from punchDie, PUNCH_LIFT off the sheet)
      const r = seat.eyelet, parts = [], H = Math.PI / 4, c0 = punchDie.clone().sub(punchPivot);
      const along = (d) => c0.clone().addScaledVector(nOut, d);
      const cyl = (rt, rb, h, d, tone, seg = 56, open = false) => { const q = along(d + h / 2); parts.push(toned(new THREE.CylinderGeometry(rt, rb, h, seg, 1, open), tone, M4(q.x, q.y, q.z, H))); };
      const ring = (ri, ro, d, tone) => { const q = along(d); parts.push(toned(new THREE.RingGeometry(ri, ro, 56, 1), tone, M4(q.x, q.y, q.z, -H))); };
      // the die: a plain brass cylinder of the eyelet's own size, and its ground cutting face, a paler turned band
      cyl(r + 0.9, r + 0.9, DIE_H, DIE_FOOT, 1, 56, true);
      cyl(r, r, DIE_H, DIE_FOOT, 1, 56, true);
      ring(r, r + 0.9, DIE_FOOT, 5);
      // the toothed cutting edge: a crown of 28 teeth round the die's foot, each as thick as the die's wall and 2.1 m along it
      for (let k = 0; k < 28; k++) {
        const a = (k + 0.5) / 28 * Math.PI * 2, q = along(DIE_FOOT - TOOTH / 2).add(new THREE.Vector3(Math.cos(a) * (r + 0.45), Math.sin(a) * (r + 0.45) * Math.SQRT1_2, -Math.sin(a) * (r + 0.45) * Math.SQRT1_2));
        const tooth = new THREE.ConeGeometry(1.05, TOOTH, 4, 1, false);
        tooth.scale(0.43, 1, 1);
        tooth.rotateY(-a);
        parts.push(toned(tooth, 5, M4(q.x, q.y, q.z, H + Math.PI)));
      }
      await ctx.yield();
      // the blued flange the die is riveted to, and its brass rivets
      cyl(r + 1.2, r + 1.2, 1.3, 3.4, 0);
      for (let k = 0; k < 24; k++) {
        const a = k / 24 * Math.PI * 2, q = along(4.72).add(new THREE.Vector3(Math.cos(a) * (r + 0.6), Math.sin(a) * (r + 0.6) * Math.SQRT1_2, -Math.sin(a) * (r + 0.6) * Math.SQRT1_2));
        parts.push(toned(new THREE.SphereGeometry(0.42, 6, 4), 1, M4(q.x, q.y, q.z)));
      }
      // the head, with two turned brass bands; its shoulder and neck; a knurled blued clamp ring
      cyl(8.4, 8.4, 3.6, 4.7, 0);
      cyl(8.7, 8.7, 0.7, 5.6, 5, 40, true);
      cyl(8.7, 8.7, 0.7, 7.0, 5, 40, true);
      cyl(5.4, 8.4, 2.4, 8.3, 0, 40);
      cyl(5.4, 5.4, 2.6, 10.7, 0, 32);
      cyl(5.9, 5.9, 1.1, 11.4, 6, 32, true);
      // eight gusset plates from the neck down to the flange, each with a brass bolt
      for (let k = 0; k < 8; k++) {
        const a = (k + 0.5) / 8 * Math.PI * 2, e1 = new THREE.Vector3(Math.cos(a), Math.sin(a) * Math.SQRT1_2, -Math.sin(a) * Math.SQRT1_2);
        const rib = new THREE.BoxGeometry(5.6, 4.6, 0.7), q = along(7.0).addScaledVector(e1, 8.9);
        rib.applyQuaternion(new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(e1, nOut, new THREE.Vector3().crossVectors(e1, nOut))));
        rib.translate(q.x, q.y, q.z);
        parts.push(toned(rib, 0));
        const b = along(9.45).addScaledVector(e1, 10.6);
        parts.push(toned(new THREE.SphereGeometry(0.55, 6, 4), 1, M4(b.x, b.y, b.z)));
      }
      // the brass collar where the arm meets the head, and the ram's end
      cyl(3.3, 3.3, 1.9, 13.3, 1, 24);
      cyl(2.2, 2.2, 2.2, 15.2, 0, 16);
      await ctx.yield();
      // the arm: a tapered blued tube from the saddle to the collar, with brass collars along it as the long arms have
      const top = along(14.2), len = top.length(), dir = top.clone().normalize(), qArm = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
      const onArm = (g, tone, t) => { g.applyQuaternion(qArm); g.translate(dir.x * t, dir.y * t, dir.z * t); parts.push(toned(g, tone)); };
      onArm(new THREE.CylinderGeometry(1.05, 1.9, len, 20, 1, true), 0, len / 2);
      for (const [f, rr, hh] of [[0.07, 2.25, 1.6], [0.16, 2.1, 1.4], [0.3, 1.95, 1.2], [0.5, 1.75, 1.0], [0.72, 1.5, 0.9], [0.9, 1.3, 0.8]]) onArm(new THREE.CylinderGeometry(rr, rr, hh, 20, 1, false), 1, len * f);
      // through the saddle and back to its counterweight (a brass weight with two paler bands and a knurled blued ring)
      onArm(new THREE.CylinderGeometry(1.2, 1.2, 9, 12, 1, false), 0, -4.5);
      onArm(new THREE.CylinderGeometry(2.9, 2.9, 5.2, 24, 1, false), 1, -9.6);
      onArm(new THREE.CylinderGeometry(3.05, 3.05, 0.8, 24, 1, true), 5, -7.6);
      onArm(new THREE.CylinderGeometry(3.05, 3.05, 0.8, 24, 1, true), 5, -11.6);
      onArm(new THREE.CylinderGeometry(3.2, 3.2, 1.3, 24, 1, true), 6, -9.6);
      // the brass saddle and its pivot pin
      parts.push(toned(new THREE.CylinderGeometry(3.4, 3.4, 4.2, 24, 1, false), 1, M4(0, 0, 0, 0, 0, Math.PI / 2)));
      parts.push(toned(new THREE.CylinderGeometry(0.9, 0.9, 7.2, 10, 1, false), 0, M4(0, 0, 0, 0, 0, Math.PI / 2)));
      await ctx.yield();
      const pm = new THREE.Mesh(mergeGeometries(parts), statMat);
      pm.frustumCulled = false;
      punch.add(pm);
      punch.position.copy(punchPivot);
      scene.add(punch);
      // the stirrup the saddle hangs in: a brass shoe bolted under the girder's lower flange (its underside is 1.44 m under the
      // beam's anchor) and two blued cheek plates down to the pin, each with brass bolts; it does not move
      const hang = [], yTop = hero.anchors.longBeam.y - 1.44, yBot = punchPivot.y - 2.4;
      hang.push(toned(new THREE.BoxGeometry(7.6, 0.8, 2.8), 1, M4(punchPivot.x, yTop - 0.4, punchPivot.z)));
      for (const sx of [-1, 1]) {
        hang.push(toned(new THREE.BoxGeometry(0.5, yTop - 0.8 - yBot, 2.4), 0, M4(punchPivot.x + sx * 2.9, (yTop - 0.8 + yBot) / 2, punchPivot.z)));
        for (const by of [yTop - 2.2, (yTop + punchPivot.y) / 2, punchPivot.y]) hang.push(toned(new THREE.SphereGeometry(0.5, 6, 4), 1, M4(punchPivot.x + sx * 3.25, by, punchPivot.z)));
      }
      const stirrup = new THREE.Mesh(mergeGeometries(hang), statMat);
      stirrup.frustumCulled = false;
      scene.add(stirrup);
    }
    await ctx.yield();

    // ---------------------------------------------------------------- the stand-back's clear space
    // A RULE OF THE PLACE: no round of paper stands between the stand-back and the recorder it looks at. From the stand-back's
    // first key (out from under the girder) to the base leg's first key (where the gaze leaves the recorder for the hole) the eye
    // looks square downstream at the long girder, its weights, its comb of arms and the pens writing below. For a point e of that
    // stretch of the flown line (one every 3 m, and the last of them the base leg's first key itself) the space is the wedge,
    // in height and distance along the valley, between the line
    // from e to the top of the girder's upstream face and the line from e to the foot of the rail of nibs (the floor at z 0), as
    // far downstream as the girder's upstream face; across the valley it runs no farther to either side of e than one and a half
    // times the metres down the valley from e (all a look square downstream from e can hold, on a wide screen too): a round
    // farther out to the side stands between that eye point and nothing of the recorder it sees. A round is in the space where
    // its reach (a radius about its rest place) comes inside all four of those bounds for some e. The rule reads places in
    // metres and nothing else. (The girder's box is read off the hero's own steelGap: how far a point 1000 m over it, and one
    // 1000 m upstream of it, stand from it.)
    const sightE = [], girder = hero.anchors.longBeam;
    const faceTop = 1000 - steelGap(0, 1000, girder.z), faceZ = girder.z - 1000 + steelGap(0, girder.y, girder.z - 1000);
    for (let d = metresAtKey(STAND_BACK[0]), d1 = metresAtKey(BASE_LEG[0]); d <= d1; d += 3) sightE.push(path.posAtDist(d, new THREE.Vector3()));
    sightE.push(new THREE.Vector3(...BASE_LEG[0]));
    const inSight = (x, y, z, rad) => {
      if (z - rad >= faceZ) return false;
      for (const e of sightE) {
        if (Math.abs(x - e.x) - rad >= 1.5 * (z - e.z)) continue;
        const ty = faceTop - e.y, tz = faceZ - e.z, tl = Math.hypot(ty, tz), ny = -e.y, nz = -e.z, nl = Math.hypot(ny, nz);
        // (metres above the line to the girder's top, and metres below the line to the nibs' rail: both under the reach)
        if (((y - e.y) * tz - (z - e.z) * ty) / tl < rad && ((z - e.z) * ny - (y - e.y) * nz) / nl < rad) return true;
      }
      return false;
    };
    await ctx.yield();

    // ---------------------------------------------------------------- chads: the punched discs, still turning in the air
    const trailCount = Math.round(300 * detail), chadCount = Math.round(720 * detail) + trailCount;
    {
      const base = new THREE.CircleGeometry(1, 24);
      const g = new THREE.InstancedBufferGeometry();
      g.setAttribute('position', base.attributes.position); g.setIndex(base.index);
      const aC = new Float32Array(chadCount * 4), aD = new Float32Array(chadCount * 4), cr = rng.fork('chads');
      // the hole is the one dark of the last stretch: no chad hangs between it and the line the rounds are strung along (five points
      // of `strung` as it comes round to the dive; one that would is turned to the far side of the axis, or of the route)
      const inv = seatM.clone().invert();
      const eyes = [0.85, 0.87, 0.89, 0.91, 0.93].map((uu) => strung.pointAt(uu, new THREE.Vector3()).applyMatrix4(inv));
      const clearOf = (x, y, z, rad) => {
        for (const e of eyes) { const t = Math.min(1, Math.max(0, (x * e.x + y * e.y + z * e.z) / e.lengthSq())); if (Math.hypot(x - e.x * t, y - e.y * t, z - e.z * t) < rad) return false; }
        return true;
      };
      // no round of paper hangs in the recorder's steel: a round of the cloud or of the trail is not laid where its rest place, carried into world
      // metres by the seat's matrix, is nearer the long girder's box (its bridge and cap with it: steelGap) than the round's own
      // radius plus the farthest its centre drifts from rest plus half a metre. The drift is the vertex program's below: (sin, cos,
      // 1.2 sin) times (.8 + 1.4 sd), so the centre is never farther from rest than the length of (1, 1, 1.2) times (.8 + 1.4 sd).
      // A round not laid is written with size 0: every draw is taken for it as for any other and the rest of its row stands
      const rest = new THREE.Vector3(), meetsSteel = (i) => {
        rest.fromArray(aC, i * 4).applyMatrix4(seatM);
        return steelGap(rest.x, rest.y, rest.z) < aD[i * 4] + Math.hypot(1, 1, 1.2) * (0.8 + 1.4 * aC[i * 4 + 3]) + 0.5;
      };
      // A RULE OF THE PLACE: a round of paper is a body, and a body is kept off the lens by where it is. No round of the cloud (the
      // close forty too) and no round of the trail is laid where the route comes within 2 m of the round's reach. Its reach is all
      // the room its skin can ever take up: the box its centre drifts in (the vertex program's below, in the seat's frame: half sizes
      // amp, amp and 1.2 amp, amp being .8 + 1.4 sd) grown by the round's radius. The route is the whole of it by metres, a point
      // every 0.25 m carried into the seat's frame, made once (0.05 m is added to the 2 m for that sampling). The rule reads places
      // in metres and nothing else, so it holds at every clock, pace and wait at the door. Not laid means what it means for the
      // steel: size 0, written after every draw is taken, so every other round stands where it stood.
      // The route here is the line the eye flies (`path`), whichever line a round is strung along.
      // (a far stretch of the route is passed over by one sphere test: no point of it can be nearer than the last one was, less
      // the metres between them; `stride` is the longest step between two points as made)
      await ctx.yield();
      const routeN = Math.ceil(L / 0.25) + 1, route = new Float32Array(routeN * 3);
      let stride = 0.25;
      for (let j = 0; j < routeN; j++) {
        path.posAtDist(Math.min(L, j * 0.25), rest).applyMatrix4(inv).toArray(route, j * 3);
        if (j) stride = Math.max(stride, Math.hypot(route[j * 3] - route[j * 3 - 3], route[j * 3 + 1] - route[j * 3 - 2], route[j * 3 + 2] - route[j * 3 - 1]));
      }
      await ctx.yield();
      // and no round of the cloud or of the trail is laid in the stand-back's clear space (`inSight`, above): its reach there is
      // the round's radius and the farthest its centre drifts from rest, about its rest place in world metres. Size 0, as above.
      const hidesRecorder = (i) => {
        rest.fromArray(aC, i * 4).applyMatrix4(seatM);
        return inSight(rest.x, rest.y, rest.z, aD[i * 4] + Math.hypot(1, 1, 1.2) * (0.8 + 1.4 * aC[i * 4 + 3]));
      };
      const meetsRoute = (i) => {
        const cx = aC[i * 4], cy = aC[i * 4 + 1], cz = aC[i * 4 + 2], amp = 0.8 + 1.4 * aC[i * 4 + 3];
        const near = aD[i * 4] + 2.0 + 0.05, far = near + Math.hypot(1, 1, 1.2) * amp;
        for (let j = 0; j < routeN;) {
          const dx = Math.abs(route[j * 3] - cx), dy = Math.abs(route[j * 3 + 1] - cy), dz = Math.abs(route[j * 3 + 2] - cz);
          const d = Math.sqrt(dx * dx + dy * dy + dz * dz);
          if (d > far) { j += Math.max(1, Math.floor((d - far) / stride)); continue; }
          const bx = Math.max(dx - amp, 0), by = Math.max(dy - amp, 0), bz = Math.max(dz - 1.2 * amp, 0);
          if (Math.sqrt(bx * bx + by * by + bz * bz) < near) return true;
          j++;
        }
        return false;
      };
      for (let i = 0; i < chadCount - trailCount; i++) {
        const close = i < 40;
        const a = cr.range(0, Math.PI * 2), r = close ? seat.eyelet + cr.range(1, 5.5) : seat.eyelet + 2 + 110 * Math.pow(cr(), 1.5);
        const z = close ? cr.range(6, 70) : 1.5 + 210 * Math.pow(cr(), 1.6);
        const sd = cr(), size = close ? cr.range(0.45, 0.9) : 0.5 + 1.6 * Math.pow(cr(), 2);
        const sg = clearOf(Math.cos(a) * r, Math.sin(a) * r, z, 8.5 + size) ? 1 : -1;
        aC.set([sg * Math.cos(a) * r, sg * Math.sin(a) * r, z, sd], i * 4);
        aD.set([size, cr.range(0.5, 1.6) * (cr.chance(0.5) ? 1 : -1), cr.range(-1, 1), cr.range(-1, 1)], i * 4);
        if (meetsSteel(i) || meetsRoute(i) || hidesRecorder(i)) aD[i * 4] = 0;
      }
      // the trail: big chads, two to three and a half metres across, strung along the whole way from the nibs to the hole, 5 to 16 m
      // off the line they are strung along (`strung`) on every side, so where the eye flies that line three or four turn past at arm's length with
      // their print readable; none is laid whose reach (all the room it drifts and turns in) comes within 2 m of the route the eye
      // flies, or into the stand-back's clear space: the rules of the place above
      const tr = rng.fork('chad-trail'), tp = new THREE.Vector3(), tt = new THREE.Vector3(), ta = new THREE.Vector3(), tb = new THREE.Vector3(), tq = new THREE.Vector3();
      const uT0 = strung.nearestXZ(44.8, 33).u;      // (from the red pen on: two or three turn past at arm's length in the beat after it)
      for (let k = 0; k < trailCount; k++) {
        const i = chadCount - trailCount + k, uu = uT0 + (0.955 - uT0) * (k + tr()) / trailCount;
        strung.pointAt(uu, tp); strung.tangentAt(uu, tt);
        ta.set(-tt.z, 0, tt.x).normalize(); tb.crossVectors(ta, tt).normalize();
        const a = tr.range(0, Math.PI * 2), r = uu > 0.925 ? 6.5 + 7 * Math.pow(tr(), 1.3) : 5 + 11 * Math.pow(tr(), 1.3);   // over the hole they turn between the eye and the ring
        tq.copy(tp).addScaledVector(ta, -Math.cos(a) * (r + 3)).addScaledVector(tb, -Math.sin(a) * (r + 3) * 0.75).applyMatrix4(inv);
        tp.addScaledVector(ta, Math.cos(a) * r).addScaledVector(tb, Math.sin(a) * r * 0.75).applyMatrix4(inv);
        const seedT = tr() * 0.35, size = tr.range(0.9, 1.75);
        if (uu > 0.84 && uu < 0.935 && !clearOf(tp.x, tp.y, tp.z, 9 + size)) tp.copy(tq);
        aC.set([tp.x, tp.y, tp.z, seedT], i * 4);
        aD.set([size, tr.range(0.4, 1.1) * (tr.chance(0.5) ? 1 : -1), tr.range(-1, 1), tr.range(-1, 1)], i * 4);
        if (meetsSteel(i) || meetsRoute(i) || hidesRecorder(i)) aD[i * 4] = 0;
        if (k % 25 === 24) await ctx.yield();
      }
      g.setAttribute('aC', new THREE.InstancedBufferAttribute(aC, 4));
      g.setAttribute('aD', new THREE.InstancedBufferAttribute(aD, 4));
      g.instanceCount = chadCount;
      const mat = new THREE.ShaderMaterial({
        uniforms: U, side: THREE.DoubleSide,
        vertexShader: /* glsl */`
attribute vec4 aC; attribute vec4 aD; varying vec3 vL; varying vec2 vSeed;
${STYLE_GLSL}
void main() {
  float sd = aC.w, t = uTime;
  vec3 ax = vec3(aD.z, aD.w, .35 + sd);
  ax /= max(length(ax), 1e-3);
  float ang = t * aD.y + sd * 40.;
  vec3 p = position * aD.x;
  vec3 q = p * cos(ang) + cross(ax, p) * sin(ang) + ax * dot(ax, p) * (1. - cos(ang));
  vec3 c = aC.xyz + vec3(sin(t * .31 + sd * 17.), cos(t * .23 + sd * 9.), 1.2 * sin(t * .19 + sd * 5.)) * (.8 + 1.4 * sd);
  vL = position * aD.x; vSeed = vec2(sd, aD.x);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(c + q, 1.);
}`,
        fragmentShader: /* glsl */`
varying vec3 vL; varying vec2 vSeed;
${STYLE_GLSL}
void main() {
  // a chad is a disc of the same chart with its own piece of the print across it, in metres, on both faces; the back a tone toward the shade
  vec3 paper = gl_FrontFacing ? uPaper : mix(uPaper, uShade, .45);
  float sd = vSeed.x, cs = cos(sd * 30.), sn = sin(sd * 30.);
  float c = vL.x * cs + vL.y * sn + sd * 9., e = vL.y * cs - vL.x * sn;
  float arc = e + .18 * c * c + sd * 5.;                    // the cross-rulings are arcs here too
  float fc = max(fwidth(c), 1e-4), fa = max(fwidth(arc), 1e-4);
  float pr = max(max(wrRule(c, .5, .055, fc), wrRule(c, 2., .12, fc)), wrRule(arc, 1., .055, fa));
  paper = mix(paper, uPrint, pr * .9);
  // the punch bruised its rim, as it bruised the lip of the hole
  float rr = length(vL.xy) / max(vSeed.y, 1e-3);
  paper = mix(paper, mix(uShade, uSepia, .25), .85 * smoothstep(.82, .97, rr));
  gl_FragColor = vec4(paper, 1.);
}`,
      });
      const chads = new THREE.Mesh(g, mat);
      chads.applyMatrix4(seatM); chads.frustumCulled = false;
      scene.add(chads);
    }
    await ctx.yield();

    // ---------------------------------------------------------------- the punch's own chads (one mesh, a stream of its own)
    // Rounds of the same chart, 7 cm thick with a cut edge: a sleeve of small ones turning 3 to 6 m round the last 190 m of the
    // course, one dealt to each equal length of it and none nearer another than APART metres, and a spill let go under the die
    // that falls to the sheet and away down it over and over on the world's clock. A sleeve round is left out, never moved, where
    // it would stand in a clear space: between the course and the hole's opening, between the course and the punch's head, or
    // between the course and the long girder abreast of it. The course is the line the rounds are strung along (`strung`). A
    // standing round is a body as the cloud's are: it is not laid (size 0, every draw taken, its place kept in the count of
    // those that stand) where the route the eye flies comes within 2 m of its reach, or where its reach comes into the
    // stand-back's clear space: the two rules of the place above. Their stream draws from nothing else:
    // per length of the sleeve: place in the length, angle, distance, and only for a round that stands: seed, spin, spin's sign,
    // axis x, axis y; then per spill round: angle, radius, seed, size, spin, spin's sign, axis x, axis y, rate of fall.
    {
      const nearCount = Math.round(50 * detail), spillCount = Math.round(40 * detail);
      const slab = new THREE.CylinderGeometry(1, 1, 0.07, 20, 1, false);
      slab.rotateX(Math.PI / 2);
      const g = new THREE.InstancedBufferGeometry();
      g.setAttribute('position', slab.attributes.position);
      g.setAttribute('normal', slab.attributes.normal);
      g.setIndex(slab.index);
      const pr = ctx.core.makeRng(ctx.core.hashSeed('wr-punch-chads:' + ctx.seed));
      const bC = [], bD = [], bF = [];
      const inv = seatM.clone().invert(), eyes = [], abreast = [], heads = [], course = [], lbA = hero.anchors.longBeam;
      // the clear spaces, from the course itself: a point every 3 m of its last 190 m, by metres from the end (seat frame: the hole
      // is the origin), and beside each the point of the long girder abreast of it, where the girder is nearer than the hole is
      for (let m = 190; m > 0; m -= 3) {
        const e = strung.posAtDist(strung.length - m, new THREE.Vector3());
        abreast.push(Math.hypot(e.y - lbA.y, e.z - lbA.z) < e.distanceTo(seat.position) ? new THREE.Vector3(e.x, lbA.y, lbA.z).applyMatrix4(inv) : null);
        eyes.push(e.applyMatrix4(inv));
      }
      // the punch's head: four rounds along the tool's axis, from the tips of its teeth to the top of its shoulder
      for (let j = 0; j <= 3; j++) heads.push(new THREE.Vector3(PUNCH_X, 0, PUNCH_LIFT + DIE_FOOT - TOOTH + (10.7 - DIE_FOOT + TOOTH) * j / 3));
      for (let m = 240; m >= 0; m -= 1) course.push(strung.posAtDist(strung.length - m, new THREE.Vector3()).applyMatrix4(inv));
      const cv = new THREE.Vector3(), cw = new THREE.Vector3(), tp = new THREE.Vector3(), tt = new THREE.Vector3(), ta = new THREE.Vector3(), tb = new THREE.Vector3();
      const hole = new THREE.Vector3(), HEAD_R = seat.eyelet + 1.2, BEAM_R = 12;
      // how far a round at p (radius rad round it) reaches into the cone between the point e and a round of radius R about c (under 0: clear)
      const reach = (p, rad, e, c, R) => {
        cv.copy(c).sub(e);
        const t = Math.min(1, Math.max(0, cw.copy(p).sub(e).dot(cv) / Math.max(cv.lengthSq(), 1e-6)));
        return R * t + rad - cv.multiplyScalar(t).add(e).distanceTo(p);
      };
      // does it stand in a clear space: between any of those points and the opening, the punch's head (HEAD_R: its flange), or the
      // girder abreast of that point (BEAM_R: the girder with its weights)
      const inSpace = (p, rad) => {
        for (let i = 0; i < eyes.length; i++) {
          if (reach(p, rad, eyes[i], hole, seat.radius) > 0) return true;
          for (const h of heads) if (reach(p, rad, eyes[i], h, HEAD_R) > 0) return true;
          if (abreast[i] && reach(p, rad, eyes[i], abreast[i], BEAM_R) > 0) return true;
        }
        return false;
      };
      // does it stand nearer the course than KEEP metres
      const KEEP = 3.0, DRIFT = 0.2, APART = 5;
      const tooNear = (p) => {
        for (const e of course) if (e.distanceToSquared(p) < KEEP * KEEP) return true;
        return false;
      };
      // the route the eye flies, a point every 0.25 m in the seat's frame, and the rule of the place for a standing round: its
      // reach is the box its centre drifts in (half sizes DRIFT, DRIFT and 1.2 DRIFT) grown by its radius
      const flown = [], flownN = Math.ceil(L / 0.25) + 1;
      for (let j = 0; j < flownN; j++) flown.push(path.posAtDist(Math.min(L, j * 0.25), new THREE.Vector3()).applyMatrix4(inv));
      await ctx.yield();
      const meetsFlown = (p, size) => {
        const near = size + 2.0 + 0.05;
        for (const e of flown) {
          const bx = Math.max(Math.abs(e.x - p.x) - DRIFT, 0), by = Math.max(Math.abs(e.y - p.y) - DRIFT, 0), bz = Math.max(Math.abs(e.z - p.z) - 1.2 * DRIFT, 0);
          if (bx * bx + by * by + bz * bz < near * near) return true;
        }
        return false;
      };
      const hidesRecorder = (p, size) => { cw.copy(p).applyMatrix4(seatM); return inSight(cw.x, cw.y, cw.z, size + Math.hypot(1, 1, 1.2) * DRIFT); };
      const stand = [];
      for (let k = 0; k < nearCount; k++) {
        if (k % 25 === 24) await ctx.yield();
        // one round to each equal length of the last 190 m, at a dealt place in its length (metres from the end of the course)
        const dd = strung.length - 190 + 190 * (k + pr()) / nearCount;
        strung.posAtDist(dd, tp); strung.tangentAtDist(dd, tt);
        ta.set(-tt.z, 0, tt.x).normalize(); tb.crossVectors(ta, tt).normalize();
        // one rule of distance from the course: fewer the nearer, and a round is 0.45 m of radius and a tenth of its distance
        const a = pr.range(0, Math.PI * 2), r = KEEP + (6 - KEEP) * Math.sqrt(pr()), size = 0.45 + 0.1 * r;
        // it stands at the dealt angle round the course, on whichever side that is
        tp.addScaledVector(ta, Math.cos(a) * r).addScaledVector(tb, Math.sin(a) * r).applyMatrix4(inv);
        // and is left out (never moved) where that is in a clear space, nearer the course than KEEP, or within APART of one that stands
        if (inSpace(tp, 1.3 + size) || tooNear(tp) || stand.some((q) => q.distanceTo(tp) < APART)) continue;
        stand.push(tp.clone());
        bC.push(tp.x, tp.y, tp.z, pr() * 0.1);
        bD.push(meetsFlown(tp, size) || hidesRecorder(tp, size) ? 0 : size, pr.range(0.5, 1.4) * (pr.chance(0.5) ? 1 : -1), pr.range(-1, 1), pr.range(-1, 1));
        bF.push(0, DRIFT);
      }
      // the spill: let go under the die (0.4 m under the tips of its teeth, as it was), each falls to the sheet and away down it, over and over
      for (let k = 0; k < spillCount; k++) {
        const a = pr.range(0, Math.PI * 2), r = seat.eyelet * Math.sqrt(pr()) * 0.85;
        bC.push(PUNCH_X + Math.cos(a) * r, Math.sin(a) * r, PUNCH_LIFT + DIE_FOOT - TOOTH - 0.4, pr() * 0.3);
        bD.push(pr.range(0.5, 1.5), pr.range(0.6, 1.6) * (pr.chance(0.5) ? 1 : -1), pr.range(-1, 1), pr.range(-1, 1));
        bF.push(pr.range(0.7, 1.3), 0.8);
      }
      g.setAttribute('aC', new THREE.InstancedBufferAttribute(new Float32Array(bC), 4));
      g.setAttribute('aD', new THREE.InstancedBufferAttribute(new Float32Array(bD), 4));
      g.setAttribute('aF', new THREE.InstancedBufferAttribute(new Float32Array(bF), 2));
      g.instanceCount = bF.length / 2;
      await ctx.yield();
      const pcMat = new THREE.ShaderMaterial({
        uniforms: U,
        vertexShader: /* glsl */`
attribute vec4 aC; attribute vec4 aD; attribute vec2 aF; varying vec3 vL; varying vec2 vSeed;
${STYLE_GLSL}
void main() {
  float sd = aC.w, t = uTime;
  vec3 ax = vec3(aD.z, aD.w, .35 + sd);
  ax /= max(length(ax), 1e-3);
  float ang = t * aD.y + sd * 40.;
  // one that falls (aF.x over 0) is let go under the die, drops to just over the lips and slides away down the sheet, growing from
  // nothing and dwindling to nothing at the ends of its fall, on the world's clock
  float fl = fract(t * .05 * aF.x + sd * 13.), on = step(.01, aF.x);
  float grow = mix(1., smoothstep(0., .08, fl) * (1. - smoothstep(.8, 1., fl)), on);
  vec3 p = vec3(position.xy * aD.x, position.z) * grow;
  vec3 q = p * cos(ang) + cross(ax, p) * sin(ang) + ax * dot(ax, p) * (1. - cos(ang));
  vec3 c = aC.xyz + vec3(sin(t * .31 + sd * 17.), cos(t * .23 + sd * 9.), 1.2 * sin(t * .19 + sd * 5.)) * aF.y;
  c += on * vec3(6. * fl * (sd - .15), -85. * fl * fl, -(aC.z - 4.2) * (1. - (1. - fl) * (1. - fl)));
  c.z += on * c.y * c.y / 600.;
  vL = vec3(position.xy * aD.x, normal.z);
  vSeed = vec2(sd, aD.x);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(c + q, 1.);
}`,
        fragmentShader: /* glsl */`
varying vec3 vL; varying vec2 vSeed;
${STYLE_GLSL}
void main() {
  // a chad is a round of the same chart with its own piece of the print across it, in metres: its face the stock as live's are,
  // its back only a step toward the straw, a narrow rim and its cut edge the straw (never darker)
  vec3 paper = mix(uPaper, uStraw, .35 * step(vL.z, -.5));
  float sd = vSeed.x, cs = cos(sd * 30.), sn = sin(sd * 30.);
  float c = vL.x * cs + vL.y * sn + sd * 9., e = vL.y * cs - vL.x * sn;
  float arc = e + .18 * c * c + sd * 5.;
  float fc = max(fwidth(c), 1e-4), fa = max(fwidth(arc), 1e-4);
  float pr = max(max(wrRule(c, .5, .055, fc), wrRule(c, 2., .12, fc)), wrRule(arc, 1., .055, fa));
  paper = mix(paper, uPrint, pr * .9);
  float rr = length(vL.xy) / max(vSeed.y, 1e-3);
  paper = mix(paper, uStraw, max(smoothstep(.93, .98, rr), 1. - step(.5, abs(vL.z))));
  gl_FragColor = vec4(paper, 1.);
}`,
      });
      const punchChads = new THREE.Mesh(g, pcMat);
      punchChads.applyMatrix4(seatM);
      punchChads.frustumCulled = false;
      scene.add(punchChads);
    }
    await ctx.yield();

    // ---------------------------------------------------------------- the rare event's car: a feed car on the long beam (the dry pen)
    // Built in every visit so nothing is made in flight; on ordinary visits it waits far out along the beam among the old ranges' pens.
    const dryRow = 72, dryX = hero.rows[dryRow].x;       // the pen beside us: the west flank of our gap (x 35), 7 m off
    const car2Mat = instrumentMaterial(U, 'static'); car2Mat.side = THREE.DoubleSide;
    car2Mat.uniforms.uInstr.value.set(0, -1.6, 0, 0);
    const lb = hero.anchors.longBeam;
    const car2 = new THREE.Mesh(mergeGeometries([
      inkCarGeometry(),
      toned(new THREE.CylinderGeometry(0.075, 0.075, 1.5, 6, 1, true), 1, M4(0, -3.1, 0.25)),
      toned(new THREE.BoxGeometry(0.2, 0.3, 2.3), 0, M4(-0.95, 0.12, -1.0)), toned(new THREE.BoxGeometry(0.2, 0.3, 2.3), 0, M4(0.95, 0.12, -1.0)),
    ]), car2Mat);
    car2.scale.setScalar(2.2); car2.position.set(260, lb.y + 4.2, lb.z + 4.6); car2.frustumCulled = false;
    scene.add(car2);
    const rail2 = new THREE.Mesh(mergeGeometries([
      toned(new THREE.BoxGeometry(520, 0.4, 0.3), 0, M4(40, lb.y + 4.2, lb.z + 4.6 - 0.7)), toned(new THREE.BoxGeometry(520, 0.4, 0.3), 0, M4(40, lb.y + 4.2, lb.z + 4.6 + 0.7)),
    ]), statMat);
    rail2.frustumCulled = false; scene.add(rail2);
    await ctx.yield();

    // ---------------------------------------------------------------- caps, gaze
    // The ranks are a fixed landscape the record streams through (nothing written is rewritten in view): steep at the gap's mouth,
    // a stair of crests where the eye is up among them, their line climbing with the route.
    U.uRank.value.set(1.6, 2.4, 0.4, 1); U.uRankFloor.value = 0.34;
    U.uRankB.value.set(1.6, 2.4, 0.4, 1); U.uRankZ.value.set(122, 86, 0, 0.5);      // (up among them the far ranks are whole crests, saddles half filled)
    hero.setRankLine(16, 114, 48, 0.5);        // their line climbs with the route up the gap, so ranks stand over the eye all the way to the pens
    hero.setBoxCap(-42, 42, 176, 400, 6.5);              // the quiet rows under the turn stay under the eye
    const uAt = (x, z) => path.nearestXZ(x, z).u;
    // the aftershock: as we come out from under the long beam every long arm is flung up again, and a second range is written
    // while we look on from the pivots' side
    U.uQuake3.value.set(heroSeconds(uAt(42, -162)) - 0.25, 170, 5, 0.5);
    const uTurnIn = uAt(-98, 240), uGapE = uAt(42, 148), uNibs = uAt(44.5, 40);      // a pen 62 m up stands 40 m downstream of the rail, on its arc
    const V = (x, y, z) => new THREE.Vector3(x, y, z);
    const poiV = new THREE.Vector3(), poiOff = new THREE.Vector3(), penV = new THREE.Vector3();
    const uUpE = uAt(42.4, 100), uUp0 = uAt(42, 118), uUp1 = uAt(42.6, 90), uUp2 = uAt(43.6, 78), uUp3 = uAt(45.2, 59);      // between these the eye comes up level with the first ranks
    // (uRun1 is a place of the beam run, read off the line that has it. It sets one window: the sweep's ends 0.06 of the route
    // past it, and a look comes in over a share of its window, so that end is what makes the sweep come in over 28 m as the eye
    // comes under the girder)
    const uBeam = uAt(42.3, -148), uRun1 = strung.nearestXZ(118, -178.6).u, runV = new THREE.Vector3(), runOff = new THREE.Vector3(), K = 1124 / L;
    const hsAt = (x, z) => heroSeconds(uAt(x, z));
    // moments of the hero clock, from where the eye is on the route: in the gap, at the front, at the first ranks, at the red pen
    const hPress0 = hsAt(42, 123), hPress1 = hsAt(43.6, 85), hFin0 = hsAt(43.6, 64), hFin1 = hsAt(44.4, 48), hBox0 = hsAt(43.6, 82), hBox1 = hsAt(45.4, -10);
    const uFlank0 = uAt(-46.6, 14), uFlank1 = uAt(-48, 96), uShock0 = uAt(-45, 72), shockV = new THREE.Vector3(), headV = new THREE.Vector3(), flankV = new THREE.Vector3();   // K: the gaze windows keep their length in metres on the longer route
    // where the red pen stands as we come to it: pressed against the cap a little over the eye, downstream of the rail on its arc
    const LL = Math.hypot(WR.longArm.py, WR.longArm.pz), arcL = (y) => Math.sqrt(Math.max(LL * LL - (y - WR.longArm.py) ** 2, 0)) + WR.longArm.pz;
    const leanL = (y) => { const k = [0, 45, 105, 190, 330]; let i = 1; while (i < 4 && y > k[i]) i++; const a0 = i > 1 ? arcL(k[i - 1]) : 0, a1 = arcL(k[i]); return a0 + (a1 - a0) * (y - k[i - 1]) / (k[i] - k[i - 1]); };
    const redPen = (time, u) => { path.pointAt(u, penV); const h = Math.min(penV.y, 86) - 2.1; return penV.set(49, h + 0.5, leanL(h)); };   // (aimed at the point, so the bulb sits a little over the middle and its wet line runs out below)
    // the red row's fins, settled as they are written: great peaks in the shock's first seconds (the red peak of the reveal, which
    // we come abreast of at the gap's mouth), then a tooth every 27 m, and none on the last 110 m of paper we pass before the pen
    { const hN = hsAt(44.5, 40) - U.uQuake.value.x; U.uFin.value.set(4.8, hN - 9.4, hN - 8.1, 0); U.uFinT.value.set(66, 3.6, 5.2, 0); }
    // under the beam the gaze pans round by the east (never flipping over the top): from the girder ahead, along its underside, to the pens downstream
    const tourV = new THREE.Vector3();
    const tour = (time, u) => {
      const a = ss(uNibs + 0.004, uNibs + 0.036, u), b = ss(uNibs + 0.058, uNibs + 0.125, u), th = (110 + 70 * a - 142 * b) * Math.PI / 180;
      return path.pointAt(u, tourV).add(runOff.set(Math.sin(th) * 100, -20 - 30 * a + 58 * b, -Math.cos(th) * 100));
    };
    const sweep = (time, u) => {
      const k = ss(uBeam - 0.025, uBeam + 0.03, u), th = (25 + 187 * k) * Math.PI / 180;
      return path.pointAt(u, runV).add(runOff.set(Math.sin(th) * 120, 10 - 56 * k, -Math.cos(th) * 120));
    };
    // THE STAND-BACK's look: one pull that has the whole gaze from under the girder to the end of the flight.
    // The pan under the girder is the sweep's own pan over the same metres, stopping square downstream, 2 degrees under level.
    // The gaze HOLDS there, square on the recorder, until the eye is on the base leg (its first key). From that key to the base
    // leg's last key, where the last round begins, it comes round by the east at one even rate (eased over the first and last 5
    // hundredths of the way) to where the hole bears from that last key; from there on it is on the hole, following it as the eye
    // rounds onto the hole's line. It keeps its height along the girder for the first 35 hundredths of the swing and comes down
    // to the hole over the rest (the girder's row of weights is in the picture until the punch and the hole come into it). It
    // takes the gaze over 23 m of flight from where the eye passes under the girder and keeps it to the end: this is the ONE
    // look of the world that pulls on the hole (the eyelet in the climbing sheet has no look of its own), down the dive and into
    // it. How long the gaze holds is what the route gives.
    const backW = 23 / L, uSw0 = metresAtKey(BASE_LEG[0]) / L, uSw1 = metresAtKey(BASE_LEG[3]) / L, backV = new THREE.Vector3(), backE = new THREE.Vector3();
    const even = (x, e) => { const t = Math.min(1, Math.max(0, x)); return t < e ? t * t / (2 * e * (1 - e)) : t > 1 - e ? 1 - (1 - t) * (1 - t) / (2 * e * (1 - e)) : (t - e / 2) / (1 - e); };
    // where the hole bears from the eye at u: round from upstream by the east (holeTh), and down (holePt)
    const holeTh = (u) => { path.pointAt(u, backV); backE.copy(seat.position).sub(backV); return Math.atan2(backE.x, -backE.z); }, holePt = () => Math.atan2(backE.y, Math.hypot(backE.x, backE.z));
    const thEnd = holeTh(uSw1), ptEnd = holePt();
    const back = (time, u) => {
      const k = ss(uBeam - 0.025, uBeam + 0.03, u), x = (u - uSw0) / (uSw1 - uSw0), th0 = (25 + 155 * k) * Math.PI / 180, pt0 = Math.atan2(10 - 14.2 * k, 120);
      const thH = holeTh(u), ptH = holePt(), th = x >= 1 ? thH : th0 + (thEnd - th0) * even(x, 0.05), pt = x >= 1 ? ptH : pt0 + (ptEnd - pt0) * even((x - 0.35) / 0.65, 0.05);
      return backV.add(runOff.set(Math.sin(th) * Math.cos(pt) * 120, Math.sin(pt) * 120, -Math.cos(th) * Math.cos(pt) * 120));
    };
    const pois = [
      { at: V(-58, 9, 14), from: 0.0, to: uNib + 0.012, weight: 1 },                        // the tide nib and its line, right of the axis (the valley and the last shock fill the left)                   // the last shock, down the valley
      // the tide curtain beside us: its wet line, notches and blots at arm's length, a little ahead and below the eye
      { at: (time, u) => path.pointAt(u, flankV).add(poiOff.set(-3.6, -0.5, 16)), from: uFlank0, to: uFlank1, weight: 0.6, fade: 0.25 },
      // the last shock, sliding away down the valley: broadside on the left as we go out over the inlet
      { at: (time, u) => shockV.set(55, 105, 20 * (heroSeconds(u) + 14.5) - 130), from: uShock0, to: uTurnIn - 0.02, weight: 0.85, fade: 0.3 },
      { at: (time, u) => shockV.set(130, 80, 20 * (heroSeconds(u) + 14.5) - 190), from: uTurnIn - 0.045, to: uTurnIn + 0.035, weight: 0.9, fade: 0.3 },
      { at: V(190, 80, 330), from: uTurnIn + 0.02, to: uApex + 0.012, weight: 0.5 },          // the East Range, broadside
      { at: (time, u) => { const k = ss(uApex + 0.05, uTurnEnd - 0.012, u); return headV.set(52, 150 - 110 * k, 60 - 20 * k); }, from: uApex - 0.004, to: uGapE + 0.02 * K, weight: 0.66 },          // the valley head: the pens go up
      // up through the range: the gaze goes out across the massif to the west, over the saddles of the next row, rank behind rank
      { at: (time, u) => { const k = ss(uUp0, uUp1, u), k2 = ss(uUpE, uUp3, u); return path.pointAt(u, poiV).add(poiOff.set(-6 - 2 * k + 148 * k2, 6 - 4 * k + 8 * k2, -80)); }, from: uGapE - 0.035 * K, to: uNibs + 0.006, weight: 0.85, fade: 0.14 },
      { at: redPen, from: uNibs - 0.02, to: uNibs + 0.03, weight: 0.85, fade: 0.3 },     // the red pen, 4.5 m off as we pass it
      // then the gaze follows it as it falls behind, down its wet line into the range we came through (the nibs writing, the lines streaming
      // away, the ranges and the straw distance beyond), and comes back round by the east to the girder, seen slantwise with its comb of arms
      { at: tour, from: uNibs + 0.004, to: uBeam - 0.018, weight: 0.82, fade: 0.14 },
      // coming under the girder the gaze begins to pan round by the east, toward the arms, the nibs, their lines and the ranges downstream
      // (the sweep is seen while it comes in and until the stand-back's look, the last below, has the whole gaze, 23 m past the
      // girder: from there on it stands under that look to its window's end and turns nothing)
      { at: sweep, from: uBeam - 0.03, to: uRun1 + 0.06, weight: 0.75, fade: 0.13 },
      // the stand-back (the last look: it has the whole gaze from 23 m past the girder to the end of the flight, and the sweep,
      // which begins the pan under the girder, stands under it. From the base leg's last key on it is on the eyelet in the
      // climbing sheet, and no other look of the world pulls on the hole anywhere)
      { at: back, from: uBeam, to: 1, weight: 1, fade: backW / (1 - uBeam) },
    ];

    // ---------------------------------------------------------------- life
    const camP = new THREE.Vector3(), rend = ctx.renderer, sizeV = new THREE.Vector2();
    const dryV = hero.rows[dryRow].row[1], hDry = hsAt(42, 152), hWet = hPress0 + 0.5;   // dry as we enter the gap beside it, wet again where the eye comes up to the first ranks
    function update(dt, time, camera, u) {
      const s = heroSeconds(u);
      hero.setFlightSeconds(s);
      if (camera) camP.setFromMatrixPosition(camera.matrixWorld); else path.pointAt(u, camP);
      // the two curtains beside the east gap are held just over the eye wherever the new shock stands
      // then both pens are driven against the cap: two clipped wet lines at the eye, sinking a metre under it as we come to the red nib,
      // so its bulb passes level with the eye and its line is seen from a little above
      // (as we come under the long beam the caps let go altogether: the range behind us stands at its full height again)
      const eyeCap = Math.min(camP.y, 86) - 0.5 - 1.2 * ss(hPress1, hFin1, s);
      // (they are low from the shock's first second, wherever it stands: the turn first shows them so)
      hero.setFlankCap(eyeCap, 2 * (1 - ss(uBeam - 0.07, uBeam - 0.025, u)));
      // past the nibs the two flanking pens come down off their stops: their arms sink under the eye and rise ahead of us to their saddles
      U.uDrop.value = 30 * ss(uNibs + 0.006, uNibs + 0.042, u);
      // low in the gap the ranks step steeply up; once the eye is up among them each stands about a tenth of the frame over the one in front
      const kr = ss(uUp0, uUp1, u);
      U.uFin.value.w = -(2.6 + 3.4 * kr) * (1 - ss(hFin0, hFin1, s));   // the west line runs under the eye until we come to the nibs
      // seen from the entry (and small, through the previous portal) the sheets tone a step further toward their feet
      U.uFoot.value.x = 0.5 + 0.25 * (1 - ss(0.03, 0.12, u));
      // the box over the turn: off while the last shock's coda is still in it, on well before we arrive, off again once we are above it
      U.uCapBoxH.value = 6.5 + 600 * (1 - ss(11, 18, s)) + 600 * ss(hBox0, hBox1, s);
      // the rare event, the dry pen: the pen beside us runs out at 22.3 s, its sheet stands blank and unedged at our shoulder, and the
      // feed car reaches it at 25 s: the line comes back with a blot 9 m across, which the paper carries past us
      if (rare) {
        U.uDry.value.set(dryV, Math.max(0, 20 * (s - hDry)), s > hWet ? Math.max(1, 20 * (s - hWet)) : 0, s > hDry ? 1 : 0);
        car2.position.x = 260 + (dryX - 260) * ss(hQ + 0.5, hWet - 0.2, s);
        car2Mat.uniforms.uInstr.value.set(0, -1.6 + 0.9 * ss(hQ + 0.5, hWet - 0.2, s) - 1.2 * ss(hWet, hWet + 5, s), 0, 0);
      }
      // the ribbons that carry the lines seen from above are 2.2 pixels wide: the size of a pixel at one metre, from the camera in use
      if (camera) U.uPx.value.y = 2 / (Math.max(camera.projectionMatrix.elements[5], 0.2) * Math.max(240, rend && rend.getDrawingBufferSize ? rend.getDrawingBufferSize(sizeV).y : 720));
      // the punch settles on its arm: under a metre at its head, slower than any pen (the world's clock; reads well at every phase)
      punch.rotation.x = 0.0045 * Math.sin(time * 0.37) + 0.002 * Math.sin(time * 0.83 + 1.3);
      hero.update(dt, time, camera);
    }
    update(0, 0, null, 0);

    return {
      scene, path, duration: DURATION, pace,
      title: EDITIONS[stock],
      // (bank: the engine leans the picture into every bend of the route by up to atan(0.28 x bank), 2.9 degrees at 0.18; one number for the whole flight)
      camera: { fov: 62, near: 0.3, far: 4600, lookAhead: 24, sway: 0.5, bank: 0.18 },
      pois,
      // the eyelet is a hole punched in the chart: until the next world shows in it, it is the red ink, flat (an opening, not an unlit hole)
      portal: { shape: 'circle', radius: seat.radius, tilt: true, color: '#B8923A', veil: '#' + U.uInkR.value.getHexString(), style: 'ring', glow: 0, halo: false, revealDistance: 120, blendDistance: 25 },
      post: { flat: 1, exposure: 1, bloom: { strength: 0 }, grade: { saturation: 1, contrast: 1, vignette: 0, grain: 0 } },
      ride: 'none', style: 'none', companion: 'none',
      update,
      dispose() { hero.dispose(); },
      variation: { stock, record, shock, hour, density, rare },
    };
  },
};
