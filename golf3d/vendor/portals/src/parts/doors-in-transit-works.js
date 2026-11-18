// doors-in-transit: THE WORKS (the works builder's part). The streets of doors gliding in trains round their oval rails, the
// rails' iron, level and plumb (doors-in-transit-works-iron.js), the winding tower (…-works-tower.js), the marked
// door's course with the points, the spur and the opening leaf, and the little weathers under the sills. Doors are the
// joiner's kinds, instanced here; each hangs below its rail by two wheeled hangers, its faces parallel to the rail.
// Nothing here reads the lens. TIER 0 AND THE MARKED DOOR RUN ON u (the share of the route flown): one chain, in
// which the marked door has a slot and a half; every other stream is a closed loop on the clock.
import { TIERS, STRAIGHT, tierLength, tierRadius, tierRail, DOOR, MARKED, SPUR, ENTRY } from './doors-in-transit-plan.js';
import * as TW from './doors-in-transit-works-tower.js';
import { makeBars, ironMaterial, standsIron, towerIron, spurIron } from './doors-in-transit-works-iron.js';
import { routeTable } from './doors-in-transit-works-route.js';
import { makeWeather } from './doors-in-transit-works-weather.js';
import { countAir, TUBE } from './doors-in-transit-works-air.js';
import { countTower } from './doors-in-transit-works-count.js';

// frank paints: blues, greens, sage, greys, cream and mustard. NO DOOR IS RED OR ORANGE BUT THE MARKED ONE: no red,
// crimson, orange or orange-brown is dealt; no black. NOTHING READS VIOLET OR PURPLE: no paint's hue lies past 206
// degrees (every blue stands on the green side of blue, so that no shade and no fill turns it toward violet; a tone
// only brightens or darkens a paint and leaves its hue), and no leak is rose (a rose light on a blue leaf is lilac).
export const PAINTS = ['#1f628c', '#2a6f97', '#3b7ca5', '#6a98b5', '#16697a', '#1d7a6b', '#2f6b3a', '#4b7f52', '#8fa98a', '#7fa8a0',
  '#5d717e', '#8a9ba6', '#efe6cf', '#d8d2c4', '#d9c58a', '#c2a52e', '#3f6f8f', '#9db8a5', '#b9c4cc', '#e6dcc0'];
// the paints of the LOWEST STREET, which carries the fine doors all round (the handsomest kinds, frankly coloured)
const FINE_PAINTS = ['#1f628c', '#16697a', '#2f6b3a', '#c2a52e', '#2a6f97', '#3b7ca5', '#1d7a6b', '#d9c58a'];
const LEAKS = [
  [[1.0, 0.98, 0.92], 0], [[1.0, 0.98, 0.92], 5], [[1.0, 0.72, 0.36], 1], [[1.0, 0.72, 0.36], 1], [[0.55, 0.72, 1.0], 0], [[0.55, 0.72, 1.0], 5],
  [[1.0, 0.76, 0.58], 0], [[0.62, 0.95, 0.62], 5], [[1.0, 0.5, 0.2], 2], [[0.75, 0.82, 1.0], 3], [[1.0, 0.95, 0.8], 4],
];
export const HANG_X = 1.4;                // a street door's two hangers stand this far either side of its middle
export const CLOSE = DOOR.frameW * 1.25;  // the doors of a train hang this far apart, middle to middle: a quarter of a door's width between frames
export const WORKS_GREEN = '#3f6b5a', WORKS_DARK = '#24282c';      // the works' paint: one deep green on all that carries, near-black on what rolls
const TG = TW.GEAR, TB = TW.gearBoxes();  // a tower door's carrier and step: the tower's own numbers and true boxes

// a point of tier k's rail at arc length s, written into out: [x, y, z, tx, tz, curve (1 on the half circles)]
function tierAt(k, s, out) {
  const R = tierRadius(k), L = tierLength(k), half = Math.PI * R; let t = ((s % L) + L) % L;
  out[1] = tierRail(k); out[5] = 0;
  if (t < 2 * STRAIGHT) { out[0] = R; out[2] = -STRAIGHT + t; out[3] = 0; out[4] = 1; return out; }
  t -= 2 * STRAIGHT;
  if (t < half) { const a = t / R, c = Math.cos(a), sn = Math.sin(a); out[0] = R * c; out[2] = STRAIGHT + R * sn; out[3] = -sn; out[4] = c; out[5] = 1; return out; }
  t -= half;
  if (t < 2 * STRAIGHT) { out[0] = -R; out[2] = STRAIGHT - t; out[3] = 0; out[4] = -1; return out; }
  t -= 2 * STRAIGHT; const a = t / R, c = Math.cos(a), sn = Math.sin(a);
  out[0] = -R * c; out[2] = -STRAIGHT - R * sn; out[3] = sn; out[4] = -c; out[5] = 1; return out;
}

// ---- the marked door's course, a pure function of u: [x, y (rail), z, tx, tz] and how far its leaf stands open (0..1)
const ROUTE = routeTable(0.5).total;                                     // metres of the flown line
const placeLeft = (m) => 1 - m / ROUTE;                                  // the place on the route (as the engine's share) where m metres are still to fly
const SWITCH_U = placeLeft(MARKED.switchLeft), STOP_U = placeLeft(MARKED.stopLeft), OPEN_U0 = placeLeft(MARKED.openFromLeft), OPEN_U1 = placeLeft(MARKED.openToLeft);
const V0 = (MARKED.startZ - MARKED.switchZ) / SWITCH_U;                  // metres of tier 0's chain per unit of u
const SPUR_ARC = Math.PI / 2 * SPUR.r, SPUR_LEN = SPUR_ARC + (SPUR.cx - SPUR.stopX);
export const chain0 = (u) => (MARKED.startZ + STRAIGHT) - V0 * u;          // where the marked door's slot stands on tier 0
export function markedAt(u, out) {
  // out[5]: the door's own place on its rail, in metres past the points (negative while it is still short of them)
  if (u <= SWITCH_U) { out[0] = tierRadius(0); out[1] = tierRail(0); out[2] = MARKED.startZ - V0 * u; out[3] = 0; out[4] = 1; out[5] = MARKED.switchZ - out[2]; return out; }
  // on the spur: it leaves at the chain's own speed, gathers way, and eases to a stand at its stopping place
  const T = STOP_U - SWITCH_U, k = Math.min(1, (u - SWITCH_U) / T), m0 = V0 * T;
  const d = Math.min(SPUR_LEN, (k * k * k - 2 * k * k + k) * m0 + (-2 * k * k * k + 3 * k * k) * SPUR_LEN);
  out[1] = SPUR.rail; out[5] = d;
  if (d < SPUR_ARC) { const b = d / SPUR.r, c = Math.cos(b), s = Math.sin(b); out[0] = SPUR.cx + SPUR.r * c; out[2] = SPUR.cz - SPUR.r * s; out[3] = s; out[4] = c; }
  else { out[0] = SPUR.cx - (d - SPUR_ARC); out[2] = SPUR.endZ; out[3] = 1; out[4] = 0; }
  return out;
}
export const markedOpen = (u) => { const k = Math.min(1, Math.max(0, (u - OPEN_U0) / (OPEN_U1 - OPEN_U0))); return k * k * (3 - 2 * k); };

// ---- the hangers: a pair of wheeled carriers for one door, about the rail's point above the door's middle (y = 0 at
// the rail's foot), and a pair of straps one metre long that the works stretch down to each door's own head
function hangerPair() {
  const B = makeBars();
  for (const x of [-HANG_X, HANG_X]) {
    B.bar([x - 0.42, -0.14, 0], [x + 0.42, -0.14, 0], 1.12, 0.2, [0, 1, 0], true);          // the yoke under the rail
    for (const sz of [-1, 1]) {
      B.bar([x, -0.1, sz * 0.54], [x, 0.5, sz * 0.54], 0.5, 0.08, [0, 0, 1], true);          // a cheek either side
      const zc = sz * 0.3, r = 0.27, yc = 0.14 + r;                                         // a wheel on the flange, six-sided
      for (let i = 0; i < 6; i++) {
        const a = Math.PI / 3 * i, b = Math.PI / 3 * (i + 1);
        const p = [x + r * Math.cos(a), yc + r * Math.sin(a)], q = [x + r * Math.cos(b), yc + r * Math.sin(b)];
        B.quad([p[0], p[1], zc - 0.08], [q[0], q[1], zc - 0.08], [q[0], q[1], zc + 0.08], [p[0], p[1], zc + 0.08]);
      }
    }
  }
  return B;
}
function strapPair(len = 1) {
  const B = makeBars();
  for (const x of [-HANG_X, HANG_X]) B.bar([x, -len, 0], [x, 0, 0], 0.16, 0.12, [0, 0, 1], false, true);
  return B;
}
// a tower door's carrier, drawn from the tower's own true boxes (the very ones its count counts): the spreader, and
// to each of the two small trucks a yoke, two cheeks and two six-sided wheels
function towerCarrier() {
  const B = makeBars();
  for (const [what, b] of TB.hang) {
    const ym = (b[2] + b[3]) / 2, zm = (b[4] + b[5]) / 2;
    if (what !== 'wheel') { B.bar([b[0], ym, zm], [b[1], ym, zm], b[5] - b[4], b[3] - b[2], [0, 1, 0], true); continue; }
    const xc = (b[0] + b[1]) / 2, r = TG.wheel;
    for (let i = 0; i < 6; i++) {
      const a0 = Math.PI / 3 * i, a1 = Math.PI / 3 * (i + 1), p = [xc + r * Math.cos(a0), ym + r * Math.sin(a0)], q = [xc + r * Math.cos(a1), ym + r * Math.sin(a1)];
      B.quad([p[0], p[1], b[4]], [q[0], q[1], b[4]], [q[0], q[1], b[5]], [p[0], p[1], b[5]]);
    }
  }
  return B;
}

export async function buildWorks(ctx, o) {
  const { THREE, doors, streams } = o;
  const object = new THREE.Group();
  const kinds = doors.kinds, nK = kinds.length;
  const col = new THREE.Color(), P = [0, 0, 0, 0, 0, 0];

  // ---------------------------------------------------------------- the iron that stands still: one merged mesh
  // THE WORKS' PAINT: one deep green on everything that carries (rails riveted; rods, arms, mast and walkways the
  // rails' own green; never black), near-black on what rolls
  const U = { uHeight: { value: 450 } }, size = new THREE.Vector2();
  const railMat = ironMaterial(THREE, WORKS_GREEN, true, U), frameMat = ironMaterial(THREE, WORKS_GREEN, false, U), ironMat = ironMaterial(THREE, WORKS_DARK, false, U);
  const roofY = o.roofY || ((x) => 34 + 70 * Math.sqrt(Math.max(0, 1 - (x / 96) * (x / 96))));
  // THE RODS' RULE (standsIron): no plumb rod within 12 m of the whole flown line, and the lens's run-in is counted
  // with the line (the level axis of the tube behind the entry, the tube's length back), so that no rod is ever moved
  // into that tube. lineGap: how far a rod standing at (x, z) from y0 up to y1 keeps from that line at its nearest
  // (the fine line, a point every half metre).
  const runIn = []; for (let t = 0.5; t <= TUBE.length; t += 0.5) runIn.push([ENTRY.x, ENTRY.y, ENTRY.z + t]);
  const lineGap = (x, y0, y1, z) => { let best = Infinity;
    for (const list of [o.table.pts, runIn]) for (const q of list) { const dx = q[0] - x, dz = q[2] - z, dy = Math.max(0, y0 - q[1], q[1] - y1), d = dx * dx + dz * dz + dy * dy; if (d < best) best = d; }
    return Math.sqrt(best); };
  const rods = { rods: 0, moved: 0, left: 0, near: Infinity }; let air = null, towerAir = null;      // rods hung; of them hung along their rib on an arm; left out (the beam doubled); the nearest rod to the line
  const casters = [];
  {
    const B = makeBars(), F = makeBars(); for (let k = 0; k < TIERS; k++) { const c = standsIron(B, F, { roofY, lineGap }, k, k + 1); rods.rods += c.rods; rods.moved += c.moved; rods.left += c.left; rods.near = Math.min(rods.near, c.near); await ctx.yield(); }
    const marks = towerIron(B, F, TW); spurIron(B, F); await ctx.yield();
    const rails = new THREE.Mesh(B.geometry(THREE), railMat), frames = new THREE.Mesh(F.geometry(THREE), frameMat);
    object.add(rails, frames); casters.push(rails, frames);
    await ctx.yield();
    // THE COUNT OF CLEAR AIR, made here on every build from the very bars just drawn and the plan's own courses
    // (doors-in-transit-works-air.js): the nearest thing to the flown line, and to the tube behind the entry
    air = await countAir(ctx, { table: o.table, bars: [{ name: 'the rails', axes: B.axes }, { name: 'the iron that carries the rails', axes: F.axes }], tower: TW, marked: markedAt, stopU: STOP_U });
    // THE TOWER'S COUNT, likewise (doors-in-transit-works-count.js): what moves against what moves, and against what stands
    towerAir = await countTower(ctx, { TW, marks });
  }

  // ---------------------------------------------------------------- the streets and the tower: every hanging door
  // Ways alternate from tier to tier; tier 0 goes toward -z on the +x side, and in it the marked door stands at
  // place 0 with a slot and a half to itself.
  // how sparse the top tier is on this visit: the visit's density and the machine's detail (0.5 to 1)
  const thinVisit = Math.min(1, Math.max(0.8, 0.6 + 0.4 * o.density)), thin = thinVisit * (0.62 + 0.38 * o.detail);
  // THE TRAINS. On every tier the doors travel in short trains of four to six (four or five on the top street), hung
  // close (a quarter of a door's width between frames), with bare rail between trains never shorter than a train
  // less one door: about half of every rail, and on most rails more, is bare. Each tier
  // deals its own train lengths, gaps, start and speed from its OWN named stream, so that no tier's trains stand over
  // the next tier's in any regular way; the top tier is the sparsest. Neighbouring tiers run opposite ways.
  const tiers = [];
  for (let k = 0; k < TIERS; k++) {
    const R = streams.tiers[k], L = tierLength(k), top = k === TIERS - 1, offs = [];
    // (the lowest street has no speed or phase of its own to deal: it runs on the flight's share)
    const start = R.range(0, 30), speed = k === 0 ? 0 : R.range(2.4, 4.6), phase = k === 0 ? 0 : R.range(0, L);
    const drawn = [];      // every train as the stream dealt it, in order: its doors, its length, its gap's own factor
    const train = () => { const n = 4 + R.int(0, top ? 1 : 2), len = (n - 1) * CLOSE, f = R.range(1.0, 1.6); drawn.push({ n, len, f }); return { n, len, gap: (len + DOOR.frameW) * (top ? 1.5 / thin : 1) * f }; };
    let cur = start, limit = L + start;
    if (k === 0) {
      // the lowest street runs on the flight's own share: the marked door stands at place 0 as the TAIL of the first
      // train; its mates run ahead of it (the first a slot and a half clear), bare rail behind it
      const t0 = train();
      for (let j = 1; j < t0.n; j++) offs.push(L - (j + 0.5) * CLOSE);
      cur = t0.gap; limit = L - (t0.n - 0.5) * CLOSE - DOOR.frameW;
    }
    for (let guard = 0; guard < 60; guard++) {
      const t = train();
      if (cur + t.len + t.gap > limit) break;
      for (let j = 0; j < t.n; j++) offs.push(cur + j * CLOSE);
      cur += t.len + t.gap;
    }
    // THE TOP STREET'S SPARE DICE. Its trains stand further apart on a machine with less detail, so it carries fewer
    // doors there. So that every door dealt after it (the tower's doors) and the marked door's sway get the same
    // dice on every machine, the street says how many doors it would carry at full detail on this same visit (the
    // same trains from the same stream, their gaps not widened); the dice of those it does not carry are drawn and
    // let go below. (The little weathers need none of this: each leaking sill's flecks come from that sill's own
    // dealt number, and no stream is drawn for them.)
    // WHY DICE AND NOT A FORK: streams of their own by name for the tower and for each street would need no spare
    // dice, but they deal other doors than the deal already judged. Counted on forty seeds at full detail, such a
    // fork changes every door of every seed, and the most sparing one (the three lower streets left on the shared
    // streams, streams of their own for the top street and the tower) still changes every door of those two, near
    // half of all, on every seed. So the dice stay, and with them the deal stays door for door.
    let spare = 0;
    if (top) {
      const full = 1.5 / (thinVisit * (0.62 + 0.38 * 1));
      let c = start, count = 0;
      for (let i = 0; i < 60; i++) {
        if (i >= drawn.length) train();
        const d = drawn[i], gap = (d.len + DOOR.frameW) * full * d.f;
        if (c + d.len + gap > limit) break;
        count += d.n; c += d.len + gap;
      }
      spare = Math.max(0, count - offs.length);
    }
    tiers.push({ k, L, dir: k % 2 === 0 ? -1 : 1, speed, phase, s: 0, offs, spare });
  }
  const tower = { L: TW.TOWER_LENGTH, n: Math.floor(TW.TOWER_LENGTH / DOOR.pitch), speed: streams.tower.range(2.2, 3.0), phase: streams.tower.range(0, TW.TOWER_LENGTH), s: 0 };
  tower.pitch = tower.L / tower.n;
  const lists = kinds.map(() => []);            // one list of doors for each kind (every door is the joiner's full cut)
  let nAll = 0, nTower = 0;
  const FINE = []; kinds.forEach((K, i) => { if (/town|stable|courtyard|coast|island|cottage|wicket/.test(K.name || '')) FINE.push(i); });
  const deal = (rec, kind) => {
    rec.paint = streams.paint.pick(PAINTS); rec.tone = streams.paint.range(0.88, 1.06);
    if (rec.fine) rec.paint = FINE_PAINTS[PAINTS.indexOf(rec.paint) % FINE_PAINTS.length];
    rec.leak = streams.hours.pick(LEAKS); rec.phase = streams.hours(); rec.sway = streams.hours.range(0, 6.283);
    const w = streams.weather(), wk = streams.weather.int(0, 5); rec.weather = w < 1 / 12 ? 1 + wk : 0; rec.wphase = streams.weather();
    rec.g = nAll++; rec.kind = kind; rec.t = rec.tier ? -1 : nTower++;            // its place among all doors (hangers, straps, shadow box); among the tower's (its step)
    rec.len = DOOR.drop - kinds[kind].height + (kinds[kind].arched ? 1.0 : 0.3) + (rec.tier ? 0 : 0.45 - TG.hung);      // its straps, down into its head (a tower door's hang from its spreader)
    lists[kind].push(rec);
  };
  for (const t of tiers) {
    for (const off of t.offs) {
      let kind = streams.order.int(0, nK - 1); const fine = t.k === 0 && FINE.length > 0;      // a rule of the place: the lowest street carries the fine doors, all round
      if (fine) kind = FINE[kind % FINE.length];
      deal({ tier: t, off, fine }, kind);
    }
    // (the dice of the doors a machine with less detail leaves off the top street: the same draws as one door's, let go)
    for (let i = 0; i < t.spare; i++) { streams.order.int(0, nK - 1); streams.paint.pick(PAINTS); streams.paint.range(0.88, 1.06); streams.hours.pick(LEAKS); streams.hours(); streams.hours.range(0, 6.283); streams.weather(); streams.weather.int(0, 5); streams.weather(); }
  }
  for (let i = 0; i < tower.n; i++) deal({ tier: null, off: i * tower.pitch }, streams.tower.int(0, nK - 1));
  await ctx.yield();

  const meshes = [];
  for (let q = 0; q < nK; q++) {
    const list = lists[q]; if (!list.length) continue;
    const kind = kinds[q], src = kind.geometry;
    const g = new THREE.BufferGeometry();
    for (const name of Object.keys(src.attributes)) g.setAttribute(name, src.attributes[name]);
    g.setIndex(src.index);
    const aLeak = new Float32Array(list.length * 3), aLife = new Float32Array(list.length * 2);
    const mesh = new THREE.InstancedMesh(g, kind.material, list.length);
    for (let j = 0; j < list.length; j++) {
      const d = list[j];
      col.set(d.paint).multiplyScalar(d.tone); mesh.setColorAt(j, col);
      aLeak[j * 3] = d.leak[0][0]; aLeak[j * 3 + 1] = d.leak[0][1]; aLeak[j * 3 + 2] = d.leak[0][2];
      aLife[j * 2] = d.leak[1]; aLife[j * 2 + 1] = d.phase;
    }
    g.setAttribute('aLeak', new THREE.InstancedBufferAttribute(aLeak, 3));
    g.setAttribute('aLife', new THREE.InstancedBufferAttribute(aLife, 2));
    mesh.frustumCulled = false; mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    object.add(mesh); meshes.push({ mesh, list, own: g });
    await ctx.yield();
  }
  // the hangers and straps: one pair of each to every door (and one more pair of each for the marked door, below).
  // Every instance of every mesh here is placed by place() before the first frame: none lies unplaced anywhere.
  // (the streets' doors are dealt first: their places among all doors are the first nAll - nTower)
  const hang = new THREE.InstancedMesh(hangerPair().geometry(THREE), ironMat, nAll - nTower);
  const towerHang = new THREE.InstancedMesh(towerCarrier().geometry(THREE), ironMat, nTower);
  const straps = new THREE.InstancedMesh(strapPair().geometry(THREE), ironMat, nAll);
  // EVERY DOOR THROWS ITS LONG SHADOW by a plain box of its own size. The box goes through the colour pass with its
  // colour and depth writes off, so it paints nothing and hides nothing there; what counts is its place in the sun's
  // shadow map (the doors' own meshes cast none: their triangles would double that pass).
  const proxy = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1).translate(0, 0.5, 0), new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false }), nAll);
  proxy.castShadow = true;
  // the tower's level steps: one to a tower door, riding with it wherever no fixed beam carries it (the tower's onBeam)
  const stepB = makeBars(), sb = TB.step[1]; stepB.bar([sb[0], (sb[2] + sb[3]) / 2, 0], [sb[1], (sb[2] + sb[3]) / 2, 0], sb[5] - sb[4], sb[3] - sb[2]);
  const steps = new THREE.InstancedMesh(stepB.geometry(THREE), railMat, nTower);
  for (const h of [hang, towerHang, straps, proxy, steps]) { h.frustumCulled = false; h.instanceMatrix.setUsage(THREE.DynamicDrawUsage); object.add(h); }
  await ctx.yield();
  // ---------------------------------------------------------------- the marked door: a frame and a leaf that swings
  const mk = doors.marked, markG = new THREE.Group(), leafPivot = new THREE.Group();
  const markFrame = new THREE.Mesh(mk.frame.geometry, mk.frame.material), markLeaf = new THREE.Mesh(mk.leaf.geometry, mk.leaf.material);
  leafPivot.position.x = mk.hingeX; markLeaf.position.x = -mk.hingeX; leafPivot.add(markLeaf); markG.add(markFrame, leafPivot);
  const markHang = new THREE.Mesh(hangerPair().geometry(THREE), ironMat), markStrap = new THREE.Mesh(strapPair(1.45).geometry(THREE), ironMat);
  markHang.position.y = DOOR.drop; markStrap.position.y = DOOR.drop; markG.add(markHang, markStrap);
  markG.matrixAutoUpdate = false; for (const m of [markFrame, markLeaf, markHang, markStrap]) m.frustumCulled = false;
  object.add(markG); markFrame.castShadow = true; markLeaf.castShadow = true;
  const markLeak0 = doors.leakUniforms && doors.leakUniforms.uMarkLeak ? doors.leakUniforms.uMarkLeak.value.clone() : null;
  const markPhase = streams.hours.range(0, 6.283);                    // its own sway's phase, dealt
  // the points: a short tongue of rail at the spur's mouth that moves over just before the marked door and back after it
  const tongue = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 5.2).translate(0, 0.25, -2.6), ironMat);
  tongue.position.set(tierRadius(0), tierRail(0) + 0.9, MARKED.switchZ + 5.4); object.add(tongue);
  const lever = new THREE.Mesh(new THREE.BoxGeometry(0.3, 2.6, 0.3).translate(0, 1.3, 0), ironMat);
  lever.position.set(tierRadius(0) + 1.3, tierRail(0) + 0.9, MARKED.switchZ + 5.4); object.add(lever);

  // one hanging thing's matrix: x level along the rail, y up (everything hangs plumb but for a little sway about
  // the rail); the origin stands `drop` under the rail's point
  const setM = (arr, o16, x, y, z, tx, tz, sway, drop) => {
    const cs = Math.cos(sway), sn = Math.sin(sway), zx = -tz, zz = tx;
    arr[o16] = tx; arr[o16 + 1] = 0; arr[o16 + 2] = tz; arr[o16 + 3] = 0;
    arr[o16 + 4] = sn * zx; arr[o16 + 5] = cs; arr[o16 + 6] = sn * zz; arr[o16 + 7] = 0;
    arr[o16 + 8] = cs * zx; arr[o16 + 9] = -sn; arr[o16 + 10] = cs * zz; arr[o16 + 11] = 0;
    arr[o16 + 12] = x - drop * sn * zx; arr[o16 + 13] = y - drop * cs; arr[o16 + 14] = z - drop * sn * zz; arr[o16 + 15] = 1;
  };
  const MP = [0, 0, 0, 0, 0, 0];
  function place(time, u) {
    for (const t of tiers) t.s = t.k === 0 ? chain0(u) : t.phase + t.dir * t.speed * time;
    tower.s = tower.phase + tower.speed * time;
    const hn = hang.instanceMatrix.array, th = towerHang.instanceMatrix.array, st = straps.instanceMatrix.array, px = proxy.instanceMatrix.array, sp = steps.instanceMatrix.array;
    for (const M of meshes) {
      const arr = M.mesh.instanceMatrix.array, list = M.list;
      for (let j = 0; j < list.length; j++) {
        const d = list[j], t = d.tier, g16 = d.g * 16; let stepped = false, sway = 0;
        if (t) { tierAt(t.k, t.s + d.off, P); sway = (0.008 + 0.014 * P[5]) * Math.sin(time * 0.9 + d.sway); }
        else { const s = tower.s + d.off, q = TW.towerPoint(s); P[0] = q[0]; P[1] = q[1]; P[2] = q[2]; P[3] = q[3]; P[4] = q[4];
          stepped = !TW.onBeam(s - TB.stepOn) || !TW.onBeam(s + TB.stepOn); }      // it rides its step until both its trucks are on a beam
        setM(arr, j * 16, P[0], P[1], P[2], P[3], P[4], sway, DOOR.drop);
        if (t) setM(hn, g16, P[0], P[1], P[2], P[3], P[4], sway, 0); else setM(th, d.t * 16, P[0], P[1], P[2], P[3], P[4], 0, 0);
        setM(st, g16, P[0], P[1], P[2], P[3], P[4], sway, t ? 0 : TG.hung);
        st[g16 + 4] *= d.len; st[g16 + 5] *= d.len; st[g16 + 6] *= d.len;
        // a tower door's level step: folded away to nothing while a beam carries the door
        if (d.t >= 0) { const o16 = d.t * 16; setM(sp, o16, P[0], P[1], P[2], P[3], P[4], 0, 0); if (!stepped) { sp[o16] = 0; sp[o16 + 2] = 0; } }
        d.x = arr[j * 16 + 12]; d.y = arr[j * 16 + 13]; d.z = arr[j * 16 + 14]; d.tx = P[3]; d.tz = P[4];
        // its shadow box: the door's own matrix, scaled to the kind's width and height and 0.4 m deep
        const K = kinds[d.kind]; for (let e = 0; e < 16; e++) px[g16 + e] = arr[j * 16 + e]; for (let e = 0; e < 3; e++) { px[g16 + e] *= K.width; px[g16 + 4 + e] *= K.height; px[g16 + 8 + e] *= 0.4; }
      }
      M.mesh.instanceMatrix.needsUpdate = true;
    }
    // the marked door, its hangers, its leaf, and the points
    markedAt(u, MP);
    const run = MP[5], toStop = SPUR_LEN - run;              // metres past the points on its own rail; metres to its stop
    const rest = Math.min(1, Math.max(0, toStop / 10)), still = 0.01 * Math.sin(time * 0.9 + markPhase) * rest * rest * (3 - 2 * rest);   // its sway dies away over its last ten metres
    setM(markG.matrix.elements, 0, MP[0], MP[1], MP[2], MP[3], MP[4], still, DOOR.drop);
    markG.matrixWorldNeedsUpdate = true;
    // the leaf swings TOWARD the arena about its jamb and rests open at 105 degrees, beside the way out
    const open = markedOpen(u); leafPivot.rotation.y = -1.833 * open;
    // its leak brightens once it is out on the spur (by its own place there) and goes as the leaf opens
    const kb = Math.min(1, Math.max(0, run / SPUR_ARC)), boost = 1 + 1.4 * kb * kb * (3 - 2 * kb);
    if (markLeak0) doors.leakUniforms.uMarkLeak.value.copy(markLeak0).multiplyScalar(boost * (1 - open));
    // the points: the tongue goes over while the door is between two door pitches and one short of them, and back
    // while it is between one and two pitches past them
    const over = Math.min(1, Math.max(0, (run + 2 * DOOR.pitch) / DOOR.pitch)) * (1 - Math.min(1, Math.max(0, (run - DOOR.pitch) / DOOR.pitch)));
    const ov = over * over * (3 - 2 * over); tongue.rotation.y = 0.2 * ov; lever.rotation.z = 0.5 - ov;
    hang.instanceMatrix.needsUpdate = true; towerHang.instanceMatrix.needsUpdate = true; straps.instanceMatrix.needsUpdate = true; proxy.instanceMatrix.needsUpdate = true; steps.instanceMatrix.needsUpdate = true;
  }
  place(0, 0);
  // ---------------------------------------------------------------- the little weathers under one sill in twelve
  // (each leaking sill's flecks come from that sill's own dealt number: nothing is drawn from a stream here, so no
  // sill's weather hangs on which other sills the visit carries; their least width is the pixel's true footprint,
  // by the same uniform as the slender iron's)
  const leaky = []; for (const M of meshes) for (const d of M.list) if (d.weather) leaky.push(d);
  const weather = makeWeather(THREE, leaky, U);
  object.add(weather.object); weather.update(0);

  // what the works made itself and frees itself (the door kinds' own geometries and materials are the joiner's)
  const ownGeometries = [...casters.map((m) => m.geometry), ...meshes.map((M) => M.own), hang.geometry, towerHang.geometry, straps.geometry, proxy.geometry, steps.geometry,
    markHang.geometry, markStrap.geometry, tongue.geometry, lever.geometry, weather.object.geometry];
  const ownMaterials = [railMat, frameMat, ironMat, proxy.material, weather.material];
  return {
    object, tiers, tower, lists, meshes, leaky, rods, casters, air, towerAir,
    markedAt, markedOpen,
    update(dt, time, u, camera) { place(time, u); weather.update(time); if (ctx.renderer) U.uHeight.value = ctx.renderer.getDrawingBufferSize(size).y; },
    dispose() { for (const g of ownGeometries) g.dispose(); for (const m of ownMaterials) m.dispose(); },
  };
}
