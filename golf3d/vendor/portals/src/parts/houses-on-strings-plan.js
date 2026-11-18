// HOUSES ON STRINGS, part: the plan. The route, the typed hero places beside it, the fleet in transit and the
// village settling on the top are dealt here as plain data into a store of balloons and lines and a builder of
// building geometry (no renderer, no lens): the page draws exactly what this hands back, and the count of clear
// air reads the same arrays. Every stream is named and seeded from the world's seed; nothing reads a seed's number.
import { makePath } from '../kit/core.js';
import { makeStore, bunchRaft, bunchBolster, bunchTiers, bunchClusters, bunchBall, looseThread, toWorld, BSTRIDE } from './houses-on-strings-balloons.js';
import { makeBuilder, addBuilding } from './houses-on-strings-buildings.js';
import { makeLandPlan, LIP, RING, riverCourse, SOUTH, NORTH } from './houses-on-strings-land.js';

export const ROUTE = [[0, 18, 0], [0, 24.4, -60], [0, 34, -150], [-12, 64, -260], [-5, 92, -370], [6, 110, -470], [16, 108, -545], [24, 106, -620], [26, 106, -680],
  [25, 109.3, -712], [20, 121.3, -748], [9, 146, -797], [-6, 168, -843], [-19, 178.5, -876], [-31, 181.6, -909], [-39, 182.4, -958], [-47, 183.4, -1030], [-57, 184.6, -1100],
  [-60, 186, -1150], [-60, 187.3, -1200], [-60, 188.7, -1250], [-60, 190, -1300]];
export const CLEAR = 8;                                            // metres of clear air every skin keeps from the route's line
const zoneOf = (z) => (z > -330 ? 0 : z > -640 ? 1 : 2);

export async function makePlan(core, seed, vary, detail, noise, yieldFn = async () => {}) {
  const stream = (name) => core.makeRng(core.hashSeed(name + ':' + seed));
  const path = makePath(ROUTE), land = makeLandPlan(noise, path);
  await yieldFn();
  const S = makeStore(3), B = makeBuilder(3), hung = [], sp = 1.36 / Math.sqrt(Math.min(1, Math.max(0.5, detail)));
  const at = (d) => { const p = path.posAtDist(d), t = path.tangentAtDist(d), h = Math.hypot(t.x, t.z) || 1; return { p, tx: t.x / h, tz: t.z / h, rx: -t.z / h, rz: t.x / h, yaw: Math.atan2(-t.z, t.x) }; };
  // named places of the route, found at build from the path and the plan's lines: the bay's MOUTH (the first route metre past the line of the west
  // block's south face), the place where the route begins its TURN to the rim (the first metre past the mouth where its heading swings west of
  // due north), and the hand AWAY from the fall there (1: our right, -1: our left)
  let mouthAt = 0, turnAt = 0; for (let s = 0; s <= path.length; s++) if (path.posAtDist(s).z < SOUTH) { mouthAt = s; break; }
  for (let s = mouthAt; s <= path.length; s++) if (path.tangentAtDist(s).x < 0) { turnAt = s; break; }
  const aM = at(mouthAt), away = (LIP[0] - aM.p.x) * aM.rx + (LIP[2] - aM.p.z) * aM.rz > 0 ? -1 : 1, threads = [];   // threads: balloons to let go, asked for here and strung when every thing stands (dealRest)
  // a hung thing: its raft deck's middle, its heading, its pivot up in the bunch and its motion (still when landed)
  const hang = (rng, x, y, z, yaw, o = {}) => {
    const calm = o.calm ? 0.55 : 1, H = { x, y, z, yaw, cs: Math.cos(yaw), sn: Math.sin(yaw), zone: zoneOf(z), pivot: [x, y + (o.up ?? 24), z],
      mv: o.landed ? [rng() * 6.283, 0, 8 + rng() * 3, 0] : [rng() * 6.283, (0.6 + 0.8 * rng()) * calm, 7 + 5 * rng(), (0.012 + 0.013 * rng()) * calm], fam: o.fam, hero: !!o.hero, landed: !!o.landed };
    const near = path.distanceTo(x, y + 12, z) < 95;
    H.guard = near ? (wx, wy, wz, r) => path.distanceTo(wx, wy, wz) > CLEAR + 0.6 + r + H.mv[1] + Math.hypot(wx - H.pivot[0], wy - H.pivot[1], wz - H.pivot[2]) * H.mv[3] * 2.67 + 0.12 : null;
    hung.push(H); return H;
  };
  // the bunches a building wears, by form: 'raft' | 'bolster' | 'tiers' | 'clusters'
  const dress = (rng, H, b, form, fam, o = {}) => {                  // a bunch spreads 2 to 3 times its load's length
    const k = o.size ?? 1, low = o.low ?? 0, spc = sp * (H.hero ? 1 : o.thin ?? 1.15), L = Math.min(19, Math.max(11, b.L));   // low: metres over the ridge (a landed bunch rides close)
    if (form === 'raft') bunchRaft(S, H, rng, { len: o.len ?? Math.min(46, Math.max(32, L * 2.4)) * k, wid: o.wid ?? Math.min(46, Math.max(32, L * 2.4)) * k * (0.5 + 0.06 * rng()), y: b.top + (low || 12 + 5 * rng()), fam, sp: spc, layers: o.layers ?? 3, disc: o.disc, ends: b.ends, ex: b.R.bx + 0.5, ez: (b.R.bzf - b.R.bzb) / 2 });
    else if (form === 'bolster') {
      const n = o.n ?? 2, rad = (o.rad ?? 3.0 + 0.6 * rng()) * (k < 1 ? 0.8 : 1), len = o.len ?? Math.min(44, Math.max(28, L * 2.2)) * k, y0 = b.top + (low || 9 + 4 * rng()) + rad;
      for (let i = 0; i < n; i++) {
        // rolls lie side by side, never stacked: the bunch stays flat
        bunchBolster(S, H, rng, { len, rad, y: y0 + (o.dy ? o.dy[i] : 0), z: o.dz ? o.dz[i] : (i - (n - 1) / 2) * (3.2 * rad + 0.6), x: o.dx ? o.dx[i] : 0, fam, sp: spc,
          ridge: b.ridge, ridgeY: b.ridgeY, eavesY: b.eavesY, eavesZ: b.eavesZ, ends: b.ends });
      }
    } else if (form === 'tiers') bunchTiers(S, H, rng, { radii: o.radii ?? [L * 1.12 * k, L * 0.82 * k, L * 0.5 * k], thin2: !H.hero, y: b.top + (low || 5 + 3 * rng()), gap: o.gap ?? 4.4, fam, sp: spc, ends: b.ends });
    else if (!bunchClusters(S, H, rng, { count: o.count ?? 8 + Math.floor(rng() * 2), bag: o.bag ?? 1.25, spread: o.spread ?? Math.max(10, L * 0.75) * k, y0: b.top + (low || 6), y1: b.top + (low || 6) + (o.rise ?? 16) * k, fam, sp: spc, ends: b.ends }))
      bunchRaft(S, H, rng, { len: Math.min(46, Math.max(32, L * 2.4)) * k, wid: Math.min(46, Math.max(32, L * 2.4)) * k * 0.5, y: b.top + (low || 12), fam, sp: spc, layers: 2, ends: b.ends, ex: b.R.bx + 0.5, ez: (b.R.bzf - b.R.bzb) / 2 });   // fewer than five bags stand clear of the route: a quilt instead
  };
  const heroes = {}; await yieldFn();
  { // A. THE MILL: its raft's underside at y 50, 15 m east of the route and 16 m over it; one long flat quilt over it (46 m by 23 m, two layers), scarlet and coral
    const r = stream('mill'), H = hang(r, 15, 51.12, -150, 0, { up: 34, fam: 0, hero: true, calm: true }), b = addBuilding(B, H, r, 'mill'); await yieldFn();
    dress(r, H, b, 'raft', 0, { len: 46, wid: 23, low: 4, layers: 2, disc: [b.sail[0], b.sail[1], b.sail[2] + 0.05, b.sailR] }); heroes.mill = { H, b, sail: [H.x + b.sail[0], H.y + b.sail[1], H.z + b.sail[2]], phase: r() * 6.283 }; await yieldFn();   // no line of the quilt crosses the sails' swept disc
    // THE ENTRY'S TWO, DEALT from the stream 'entry' by a rule of place (said at the head): one on either hand of the line, 70 to 110 m along
    // the route, 50 to 66 m off it in plan, its deck 2 to 8 m over the line there, its facing by a die within 0.6 rad of the route's heading.
    // The bands themselves keep the whole of each (building, lines and bunch) beside the way, so no test follows the dice
    const r3 = stream('entry'), ENTRY = [-1, 1].map((hand) => { const d = 70 + 40 * r3(), off = 50 + 16 * r3(), up = 2 + 6 * r3(), turn = (r3() - 0.5) * 1.2, a = at(d); return [a.p.x + hand * a.rx * off, a.p.y + up, a.p.z + hand * a.rz * off, a.yaw + turn]; });
    const r2 = stream('millNeighbours'), near2 = [], zN = at(110).p.z;   // the mill's two neighbours, DEALT: in a ring of 45 to 70 m about the mill, 2 to 16 m higher, north of the entry's band
    for (let k = 0; k < 80 && near2.length < 2; k++) {              // and 62 m from each of the entry's two in plan, 46 m and more from the line, 60 m from each other in plan; the facing by a die. Every die before any test
      const a = r2() * 6.283, d = 45 + 25 * r2(), up = 2 + 14 * r2(), yaw = r2() * 6.283, x = H.x + Math.cos(a) * d, z = H.z + Math.sin(a) * d, y = H.y + up;
      if (z > zN || path.distanceTo(x, y, z) < 46 || path.distanceTo(x, y + 20, z) < 50 || near2.some((q) => Math.hypot(q[0] - x, q[2] - z) < 60) || ENTRY.some((q) => Math.hypot(q[0] - x, q[2] - z) < 62)) continue;
      near2.push([x, y, z, yaw]);
    }
    for (let i = 0; i < near2.length; i++) {
      const q = near2[i], Hn = hang(r2, q[0], q[1], q[2], q[3], { fam: i ? 2 : 4 }), bn = addBuilding(B, Hn, r2, i ? 'cottages' : 'longhouse', i ? {} : { L: 16 });
      dress(r2, Hn, bn, i ? 'clusters' : 'raft', i ? 2 : 4, i ? { count: 7, bag: 1.2 } : { layers: 2 }); await yieldFn();
    }
    const H4 = hang(r3, ENTRY[0][0], ENTRY[0][1], ENTRY[0][2], ENTRY[0][3], { fam: 8 }), b4 = addBuilding(B, H4, r3, 'longhouse', { L: 20, plain: true, bags: 2 }); dress(r3, H4, b4, 'raft', 8, { thin: 1 }); await yieldFn();
    const H5 = hang(r3, ENTRY[1][0], ENTRY[1][1], ENTRY[1][2], ENTRY[1][3], { fam: 5 }), b5 = addBuilding(B, H5, r3, 'barn', { plain: true, bags: 2 }); dress(r3, H5, b5, 'tiers', 5, { thin: 1 });
  }
  await yieldFn();
  { // B. THE SECOND GLASSHOUSE on the left, 25 m off the line and 1.6 m under it; a longhouse farm on the right, 32 m off and 6 m under
    const r = stream('glass2'), a = at(262), H = hang(r, a.p.x - a.rx * 25, a.p.y - 1.6, a.p.z - a.rz * 25, a.yaw, { fam: 3, hero: true, calm: true }), b = addBuilding(B, H, r, 'greenhouse');
    dress(r, H, b, 'clusters', 3, { count: 9, spread: 12, rise: 20, bag: 1.1 }); heroes.glass2 = { H, b }; await yieldFn();
    const r2 = stream('farm'), c = at(292), H2 = hang(r2, c.p.x + c.rx * 32, c.p.y - 6, c.p.z + c.rz * 32, c.yaw + Math.PI + 0.5, { fam: 1, hero: true, calm: true }), b2 = addBuilding(B, H2, r2, 'longhouse', { L: 18 });
    dress(r2, H2, b2, 'raft', 1, { len: 40, wid: 20, layers: 3 }); heroes.farm = { H: H2, b: b2 };
  }
  await yieldFn();
  { // C. THE LANE: two bolsters a side, end to end in a stair with the climbing route, violet and lilac over a field
    // barn on the left, rose and pink over the chapel on the right; their buildings 34.5 m either side of the line, each pair of rolls turned 26 degrees to it (far ends nearer the line): their length shows from before the lane's mouth
    // THE LANE ENDS WHERE THE BAY BEGINS: its middle stands 36 m short of the bay's mouth (two rolls of 34 m end to end reach 34 m on from the
    // middle, and 2 m of air), so that no roll's end stands inside the bay on the fall's side of the line
    const laneAt = mouthAt - 36, a = at(laneAt), y1 = at(laneAt - 17).p.y, y2 = at(laneAt + 17).p.y;   // each roll level with the line beside its own middle: 17 m is a roll's half length
    for (const [sgn, kind, fam, name] of [[-1, 'barn', 5, 'laneLeft'], [1, 'chapel', 6, 'laneRight']]) {
      const r = stream(name), yaw = sgn > 0 ? a.yaw + Math.PI : a.yaw, H = hang(r, a.p.x + sgn * a.rx * 34.5, a.p.y - 18, a.p.z + sgn * a.rz * 34.5, yaw + sgn * 0.45, { fam, hero: true, calm: true, up: 20 }), b = addBuilding(B, H, r, kind);
      const f = sgn > 0 ? -1 : 1, rad = 3.7;                         // local x runs with the route on the left, against it on the right
      dress(r, H, b, 'bolster', fam, { n: 2, rad, len: 34, low: 0.01, dx: [-17 * f, 17 * f], dy: [y1 - (a.p.y - 18) - b.top - rad, y2 - (a.p.y - 18) - b.top - rad], dz: [2.6, 2.6] });
      heroes[name] = { H, b, bell: b.bell, phase: r() * 6.283 }; await yieldFn();
    }
  }
  await yieldFn();
  { // D. THE COMPANY RIDES WITH US FROM THE BAY'S MOUTH TO THE RIM (said at the world's head). The bay's mouth is where the route passes the line of
    // the west block's south face. From 40 m inside the mouth, on through the turn and up the climb to the place where the route crosses the north
    // rim, the company hangs at ONE even pitch of 50 m on the hand away from the fall and from the bay's west wall: a near rank 24 to 32 m off the
    // line, its decks from 6 m under to 8 m over the line beside them (building and bunch both stand in the picture), and a far rank half a pitch
    // on, 76 to 84 m off and 14 to 24 m under. Each building has a stream of its own (its rank and number), every die is drawn before any test,
    // and one cut by the lip's 150 m or the rim's 60 m (its whole bunch) changes no other: the rank ends where the north rim's 60 m begin. The
    // count falls out of the route's length. The first of the near rank is the greenhouse under its low quilt of pearl and cream
    // the near rank's LAST place is found at build: the farthest route metre short of the rim crossing where a building on the away hand,
    // anywhere in its band of 24 to 32 m off, keeps the rim's 60 m with its whole bunch and stands off the mountain. The rank runs from 40 m
    // inside the mouth to that place at one even pitch (the whole number of steps nearest 50 m)
    const okAt = (s) => { const a = at(s), x = a.p.x + away * a.rx * 28, z = a.p.z + away * a.rz * 28; return land.inset(x, z) <= 0 && land.rimDist(x, z) >= 60 + 26 + 5; };
    let sEnd = mouthAt + 40; for (let s = land.crossAt; s > mouthAt + 40; s--) if (okAt(s)) { sEnd = s; break; }
    const nP = Math.max(1, Math.round((sEnd - mouthAt - 40) / 50)), PITCH = (sEnd - mouthAt - 40) / nP; heroes.company = [];
    // the far rank has its own last place, found the same way 80 m off the line, and as many buildings as the near rank has steps (seven), at
    // one even pitch of its own from half a near pitch inside the first: the same count on every deal, none cut by the rim
    const okFar = (s) => { const a = at(s), x = a.p.x + away * a.rx * 80, z = a.p.z + away * a.rz * 80; return land.inset(x, z) <= 0 && land.rimDist(x, z) >= 60 + 26 + 5; };
    let sFar = mouthAt + 40 + PITCH / 2; for (let s = sEnd; s > sFar; s--) if (okFar(s)) { sFar = s; break; }
    const pitchF = (sFar - mouthAt - 40 - PITCH / 2) / Math.max(1, nP - 1);
    for (let rank = 0; rank < 2; rank++) for (let i = 0; rank ? i < nP : i <= nP; i++) {
      const r = stream('company:' + rank + ':' + i), d0 = r(), d1 = r(), d2 = r(), ki = r(), fi = r(), fa = r(), tsd = Math.floor(r() * 1e9), a = at(rank ? mouthAt + 40 + PITCH / 2 + i * pitchF : mouthAt + 40 + i * PITCH);
      const dy = rank ? -14 - 10 * d1 : -6 + 14 * d1, y = a.p.y + dy; let off = (rank ? 76 : 24) + 8 * d0, x = 0, z = 0;
      for (let k = 0; k < 9; k++, off += 2) { x = a.p.x + away * a.rx * off; z = a.p.z + away * a.rz * off; if (Math.hypot(x - LIP[0], y + 14 - LIP[1], z - LIP[2]) >= 150 + 26) break; }   // where the lip's 150 m (its bunch counted) asks it, it stands off up to 16 m more
      if (Math.hypot(x - LIP[0], y + 14 - LIP[1], z - LIP[2]) < 150 + 26 || land.inset(x, z) > 0 || land.rimDist(x, z) < 60 + 26) continue;
      const glass = !rank && !i, kind = glass ? 'greenhouse' : KINDS[Math.floor(ki * KINDS.length)], forms = FORMS[kind], form = glass ? 'raft' : forms[Math.floor(fi * forms.length)];
      const last = heroes.company[heroes.company.length - 1], f0 = glass ? 7 : Math.floor(fa * 9), fam = last && last.fam === f0 ? (f0 + 4) % 9 : f0;
      const H = hang(r, x, y, z, a.yaw + Math.PI + (d2 - 0.5), { fam, hero: !rank, calm: true, up: glass ? 12 : 24 }), b = addBuilding(B, H, r, kind, glass ? {} : { plain: !!rank, bags: 2 });
      dress(r, H, b, form, fam, glass ? { len: 30, wid: 15, low: 6, layers: 2 } : form === 'raft' ? { len: rank ? 40 : 30, wid: rank ? 20 : 15, layers: 3 } : form === 'tiers' && !rank ? { radii: [12, 9, 6] } : form === 'bolster' && !rank ? { len: 30 } : {});
      H.near = !rank; heroes.company.push(H);
      const e = (l) => path.nearestXZ(H.x + l * H.cs, H.z - l * H.sn).dist, lx = e(32) >= e(-32) ? 32 : -32;   // let go 5 m beyond the bunch's END that stands farther from the route's line
      if (e(lx) > 40) threads.push([H, lx, b.top + 9, 0, fam, 9, 55, tsd]);
      await yieldFn();
    }
  }
  await yieldFn();
  // R2b, NEVER ONE ALONE IN OPEN SKY (a rule of the dealing): every building hung so far has two others within 80 m. One that lacks them is
  // dealt companions from a stream of its own ('companion:' and its number). Each try draws all its dice first (bearing, 50 to 76 m off,
  // within 10 m of its height, facing, kind, form, hue), then is tested: not alone itself (another hung thing within 80 m besides the building,
  // unless the building has none at all: then its next companion makes the three); its deck and its bunch's middle 40 m and more from the
  // line (the bunch's edge 13 m clear); inside the bay its whole bunch (26 m) on the side away from the fall; not over the mountain,
  // outside the lip's 150 m and the rim's 60 m (its bunch counted) and the wedge behind the lip; 52 m from every other hung thing, 45 m in plan
  const LX = []; for (let s = 0; s <= path.length; s += 4) { const p = path.posAtDist(s); LX.push([p.z, p.x]); }
  const lineX = (z) => { let b = LX[0]; for (const q of LX) if (Math.abs(q[0] - z) < Math.abs(b[0] - z)) b = q; return b[1]; };
  // the lane's two are looked at first: theirs is the narrowest place (between the line, the bay's mouth and the west block's corner); then
  // every other in the order it was hung; a companion is itself looked at in its turn; sixteen at the most
  const narrow = [heroes.laneLeft.H, heroes.laneRight.H], queue = narrow.concat(hung.filter((H) => !narrow.includes(H)));
  for (let q = 0, n0 = hung.length; q < queue.length && hung.length < n0 + 16; q++) {
    const A = queue[q], rc = stream('companion:' + hung.indexOf(A)), others = () => hung.filter((o) => o !== A && Math.hypot(o.x - A.x, o.y - A.y, o.z - A.z) < 80);
    for (let k = 0; k < 400 && others().length < 2; k++) {
      const az = rc() * 6.283, d = 50 + 26 * rc(), up = (rc() - 0.5) * 20, yaw = rc() * 6.283, ki = rc(), fi = rc(), fa = rc(), sd = Math.floor(rc() * 1e9);
      const x = A.x + Math.cos(az) * d, y = A.y + up, z = A.z + Math.sin(az) * d;
      if (others().length && !hung.some((o) => o !== A && Math.hypot(o.x - x, o.y - y, o.z - z) < 80)) continue;
      if (y < 30 || path.distanceTo(x, y, z) < 40 || path.distanceTo(x, y + 14, z) < 40 || (z < SOUTH + 26 && (x - lineX(z)) * away < 26)) continue;
      if (land.inset(x, z) > 0 || land.rimDist(x, z) < 60 + 26 || Math.hypot(x - LIP[0], y + 14 - LIP[1], z - LIP[2]) < 150 + 26 || inWedge(x, z, 26)) continue;
      if (hung.some((o) => Math.hypot(o.x - x, o.y - y, o.z - z) < 52 || Math.hypot(o.x - x, o.z - z) < 45)) continue;
      const rb = core.makeRng(sd), kind = KINDS[Math.floor(ki * KINDS.length)], forms = FORMS[kind], form = forms[Math.floor(fi * forms.length)], f0 = Math.floor(fa * 9), fam = f0 === A.fam ? (f0 + 4) % 9 : f0;
      const Hc = hang(rb, x, y, z, yaw, { fam }), bc = addBuilding(B, Hc, rb, kind, { plain: true, bags: 2 }); dress(rb, Hc, bc, form, fam, {}); queue.push(Hc);
      await yieldFn();
    }
  }
  return { core, path, land, S, B, hung, heroes, at, hang, dress, stream, sp, threads, mouthAt, turnAt, away, lineX };
}

const KINDS = ['longhouse', 'barn', 'cottages', 'longhouse', 'haybarn', 'cottages', 'longhouse', 'barn'];
const FORMS = { longhouse: ['raft', 'clusters', 'bolster'], barn: ['bolster', 'tiers'], cottages: ['clusters', 'raft'], haybarn: ['tiers', 'clusters'] };
const REACH = { raft: 25, bolster: 24, tiers: 27, clusters: 27 };
// R1, NOTHING ON THE FALL'S HEAD: a keep-out wedge behind the lip at any height, its apex at the lip, opening 65 degrees
// either side of due west, 700 m deep. No building and no bunch (its reach R counted) stands in it, landed or aloft
const inWedge = (x, z, R = 0) => { const dx = LIP[0] - x, dz = Math.abs(z - LIP[2]); return Math.hypot(dx, dz) < 700 + R && dz * 0.4226 - dx * 0.9063 < R; };
// the fleet in transit and the village settling on the top: descriptors first (so that none is left alone), then geometry
export async function dealRest(P, vary, yieldFn = async () => {}) {
  const { path, land, hung, hang, dress, stream, B } = P, list = [];
  for (const H of hung) list.push({ x: H.x, y: H.y + 14, z: H.z, R: 24, fam: H.fam, fixed: true });
  const free = (c) => list.every((o) => Math.hypot(o.x - c.x, o.y - c.y, o.z - c.z) > o.R + c.R + 3 && Math.hypot(o.x - c.x, o.z - c.z) > 45);
  const groups = Math.round((12 + 4 * Math.min(1, Math.max(0, ((vary.density || 1) - 0.7) / 0.6))) / 3) + (vary.rare ? 1 : 0);   // the fleet's groups of three: four or five by the deal's density, one more on a rare deal
  const line = [[240, 66, 110], [150, 88, -130], [105, 132, -400], [115, 172, -640], [95, 214, -820]], r = stream('fleet');
  const along = (t) => { const f = Math.min(0.9999, Math.max(0, t)) * (line.length - 1), i = Math.floor(f), k = f - i, a = line[i], b = line[i + 1]; return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k]; };
  const BAY = []; for (let d = 0; d <= path.length; d += 12) { const p = path.posAtDist(d); if (p.z < SOUTH && p.z > LIP[2] - 20) BAY.push([p.x, p.z]); }   // the bay's stretch: from its mouth to 20 m past the lip's line, where the fall has passed abeam
  // R2c: no dealt one within 12 degrees (and its bunch's reach) of the fall's bearing, from any place on the route's stretch through the bay
  const byFall = (x, z, R) => BAY.some(([px, pz]) => { let a = Math.abs(Math.atan2(LIP[0] - px, LIP[2] - pz) - Math.atan2(x - px, z - pz)); if (a > Math.PI) a = 6.2832 - a; return a < 0.2094 + Math.atan2(R, Math.hypot(x - px, z - pz)); });
  const deal = (rng, cx, cy, cz, sx, sy, sz) => {                    // every die of a candidate is drawn before any test
    const dx = rng() * 2 - 1, dy = rng() * 2 - 1, dz = rng() * 2 - 1, ki = rng(), fi = rng(), fa = rng(), ya = rng(), sd = Math.floor(rng() * 1e9);
    const kind = KINDS[Math.floor(ki * KINDS.length)], forms = FORMS[kind], form = forms[Math.floor(fi * forms.length)];
    return { x: cx + dx * sx, y: cy + dy * sy, z: cz + dz * sz, kind, form, fam: Math.floor(fa * 9), yaw: ya * 6.283, sd, R: REACH[form] + 3 };
  };
  const okPlace = (c) => {
    if (c.y - 6 < 45 || c.y + 30 > 262 || inWedge(c.x, c.z, c.R) || byFall(c.x, c.z, c.R)) return false;
    if (path.distanceTo(c.x, c.y, c.z) < 30 + c.R || path.distanceTo(c.x, c.y - 14, c.z) < 30 + c.R * 0.6) return false;
    if (c.z < SOUTH + c.R && (c.x - P.lineX(c.z)) * P.away < c.R) return false;             // inside the bay the whole of each (its bunch's reach) stands on the side away from the fall
    if (land.inset(c.x, c.z) > 0 || land.rimDist(c.x, c.z) < 60 + c.R) return false;       // none over the mountain, none within 60 m of the true rim (its bunch counted)
    if (Math.hypot(c.x - LIP[0], c.y - LIP[1], c.z - LIP[2]) < 150 + c.R) return false;
    return free(c);
  };
  // THE FLEET FLIES IN GROUPS OF THREE (so that every building aloft has two others within 80 m): a group's middle is dealt along the lane, and
  // its three stand at the corners of a triangle about it (39 to 42 m out, 120 degrees apart, each turned up to 8 degrees, within 8 m of the
  // middle's height): 61 to 78 m from one another. Every die of the three is drawn before any test; a group stands whole or not at all
  for (let k = 0, n = 0; k < 400 && n < groups; k++) {
    const t = r() ** 0.62, c0 = along(t), g = deal(r, c0[0], c0[1] + 14, c0[2], 105, 30, 60), a0 = r() * 6.283, tri = [];
    for (let j = 0; j < 3; j++) { const m = deal(r, 0, 0, 0, 1, 1, 1), a = a0 + j * 2.0944 + m.x * 0.14, rad = 40.5 + 1.5 * m.z; m.x = g.x + Math.cos(a) * rad; m.z = g.z + Math.sin(a) * rad; m.y = g.y + 8 * m.y; tri.push(m); }
    if (!tri.every((m) => okPlace(m))) continue;
    for (const m of tri) { if (list.some((o) => Math.hypot(o.x - m.x, o.z - m.z) < 70 && o.fam === m.fam)) m.fam = (m.fam + 4) % 9; list.push(m); }   // neighbours differ in hue
    n++;
  }
  await yieldFn();
  // THE VILLAGE SETTLING on the top (said at the world's head): an avenue of landed buildings at one even pitch, their yards toward us; four still hung at the
  // rows' head; three behind the ring; two stairs of buildings still coming down, 15 to 48 m over the rock, the lowest step of each 53 and 60 m from the line;
  // up to four late-comers dealt 40 to 66 m up over the rows' near end; two pairs dealt farther off
  const rv = stream('village'), village = [], RXZ = [];
  for (let d = land.crossAt; d <= path.length; d += 4) { const p = path.posAtDist(d); RXZ.push([p.z, p.x]); }   // the route's x by z over the top, from the rim crossing on
  const routeX = (z) => { let b = RXZ[0]; for (const q of RXZ) if (Math.abs(q[0] - z) < Math.abs(b[0] - z)) b = q; return b[1]; };
  const RIV = riverCourse(), riverOff = (x, z) => { let b = 1e9; for (let i = 0; i + 1 < RIV.length; i++) { const ax = RIV[i][0], az = RIV[i][2], dx = RIV[i + 1][0] - ax, dz = RIV[i + 1][2] - az, t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz))); b = Math.min(b, Math.hypot(x - ax - dx * t, z - az - dz * t)); } return b; };
  const okTop = (c) => !inWedge(c.x, c.z, 30) && riverOff(c.x, c.z) > 30 && land.rimDist(c.x, c.z) > 60 + 16 && Math.hypot(c.x - LIP[0], c.z - LIP[2]) > 150 + 16 && path.nearestXZ(c.x, c.z).dist > 30 + c.R &&
    village.every((o) => Math.hypot(o.x - c.x, o.z - c.z) > 46) && list.every((o) => Math.hypot(o.x - c.x, o.z - c.z) > 40 || o.y > 262);
  // THE AVENUE, by ONE EVEN PITCH in route metres: its head stands 46 m behind the rank of three still hung (found below) and no building
  // stands nearer than 40 m to the route's end at the ring; the left hand at every pitch from the head, the right hand staggered by half a pitch;
  // each 20 to 24 m off the line by a die, its yard toward the way, its kind, form and hue by dice (two neighbours of a row never of one hue). The
  // count falls out of the avenue's length. A stream of its own ('rows')
  // THE FOUR STILL HUNG AT THE ROWS' HEAD stand by rules of the place (no typed distance). A hung bunch reaches 26 m. Three ride abreast, each as near
  // the north rim as its 60 m allow: stepping in from the rim crossing, the first place where it keeps 60 m, its bunch's reach and 3 m of play from
  // the true rim. Their spacing is the bunches' own breadth: the pair beside the way keep the village's 30 m from the line on either hand, the third
  // stands one breadth and a gap of 4 m (56 m) beyond the second. The fourth rides midway between the third and the east stair's third step, so
  // that the rank and the stair read as one company (65 m from each)
  const RH = 26, STEP = 2 * RH + 4, inAt = (hand, off) => { for (let d = 0; d <= 200; d += 2) { const z = land.cross[1] - d; if (land.rimDist(routeX(z) + hand * off, z) >= 60 + RH + 3) return z; } return land.cross[1] - 200; };
  const zA = inAt(-1, 30), zB = inAt(1, 30), zC = inAt(1, 30 + STEP), xC = routeX(zC) + 30 + STEP, STAIR3 = [72, -1140], xD = (xC + STAIR3[0]) / 2, zD = (zC + STAIR3[1]) / 2;
  // THE AVENUE'S HEAD has its reason in the rank: it stands where a landed bunch (reach 16 m) first rides clear behind the hung rank's bunches
  // (reach 26 m) with the same gap of 4 m: 46 m in from the rank's line, found as a route metre. ITS PITCH is a landed raft's own length (26 m: the
  // longest house, 20 m, and its beam ends) and a gap of 14 m, through which the next row and the ground show
  const zHead = Math.min(zA, zB, zC) - (RH + 16 + 4); let head = path.length; for (let s = land.crossAt; s <= path.length; s++) if (path.posAtDist(s).z <= zHead) { head = s; break; }
  const rr = stream('rows'), PITCH = 26 + 14;
  for (let hand = -1; hand <= 1; hand += 2) for (let i = 0, prev = -1; head + (i + (hand > 0 ? 0.5 : 0)) * PITCH <= path.length - 40; i++) {
    const c = deal(rr, 0, 0, 0, 1, 0, 0), a = P.at(head + (i + (hand > 0 ? 0.5 : 0)) * PITCH), off = 22 + 2 * c.x, jit = (c.yaw / 6.283 - 0.5) * 0.5;
    c.x = a.p.x + hand * a.rx * off; c.z = a.p.z + hand * a.rz * off; c.yaw = a.yaw + (hand > 0 ? Math.PI : 0) + jit; c.landed = true; c.over = 0; c.R = 14; c.row = hand;
    if (c.fam === prev) c.fam = (c.fam + 4) % 9; prev = c.fam;
    if (land.rimDist(c.x, c.z) > 60 + 16 && !inWedge(c.x, c.z, 30)) village.push(c);       // a landed bunch reaches 16 m
  }
  // [hand (-1 left, 1 right; 0: x is given), metres off the line (or x), z, metres over the top (0: landed), kind, form, hue family]: the four still hung at the
  // rows' head (placed by the rules above; they ride BROADSIDE to the way in over the rim, their yards toward us, each a step higher than the last: the house 4.5 m, the others 30, 38 and 46 m
  // over the rock); then TYPED (said at the world's head): three landed behind the ring; two stairs of four still coming down (the west one runs north, so that it
  // keeps clear of the fall's bearing from the bay)
  // THE HOUSE (the film's own little painted house under its one great round bunch in every colour, 56 m across, its strings gathered into its
  // chimney; the only one of its kind): it is the rank's LEFT one, on the fall's hand of the way in, 30 m off the line, as near the north rim as
  // the rim's 60 m allow its whole ball; it hangs low, its foot 4.5 m over the rock (it bobs under a metre), its front to the rim and the bay
  // (its ball reaches 32 m with its skin and its sway, 6 m more than a raft's bunch, so it stands 6 m farther in than the rank's line; the
  // avenue's head keeps its place)
  const TYPED = [[-1, 30, zA - (32 - RH), 4.5, 'house', 'ball', 0], [1, 30, zB, 30, 'longhouse', 'raft', 1], [1, 30 + STEP, zC, 38, 'barn', 'tiers', 7], [1, xD - routeX(zD), zD, 46, 'cottages', 'raft', 2],
    [0, RING[0], RING[2] - 68, 0, 'barn', 'tiers', 4], [0, RING[0] - 58, RING[2] - 40, 0, 'longhouse', 'bolster', 2], [0, RING[0] + 58, RING[2] - 40, 0, 'haybarn', 'tiers', 0],
    [0, -110, -1100, 15, 'longhouse', 'raft', 8], [0, -119, -1134, 26, 'barn', 'bolster', 5], [0, -128, -1168, 37, 'cottages', 'clusters', 1], [0, -137, -1202, 48, 'longhouse', 'raft', 4],
    [0, 0, -1160, 15, 'barn', 'tiers', 6], [0, 36, -1150, 26, 'longhouse', 'bolster', 0], [0, 72, -1140, 37, 'cottages', 'raft', 3], [0, 108, -1130, 48, 'barn', 'tiers', 5]];
  for (const [hand, off, z, over, kind, form, fam] of TYPED) {
    const c = deal(rv, 0, 0, z, 0, 0, 2), jit = (c.yaw / 6.283 - 0.5) * 0.5; c.x = hand ? routeX(c.z) + hand * off : off; c.kind = kind; c.form = form; c.fam = fam; c.landed = !over; c.over = over; c.R = kind === 'house' ? 28 : over ? 26 : 14;
    c.yaw = (hand ? 0 : Math.atan2(RING[0] - c.x, RING[2] - c.z)) + jit;                                   // broadside to the way in, its yard toward the south (the four at the rows' head), or its yard toward the ring
    if (land.rimDist(c.x, c.z) > 60 + (over ? 26 : 16) && !inWedge(c.x, c.z, 30) && !(over && byFall(c.x, c.z, 0))) village.push(c);   // its whole bunch 60 m from the true rim; one still hung keeps 12 degrees from the fall's bearing, seen from the bay
  }
  const rl = stream('lateComers');                                    // up to four late-comers (as many as find room) still high just inside the north rim, DEALT: a place in a box of 300 m by 120 m about the rows' head, its middle 150 m inside the north wall's line (its whole bunch 60 m and more in
  for (let k = 0, n = 0; k < 300 && n < 4; k++) {                     // from the true rim), 40 to 66 m over the rock by a die, 30 m and more from the line and clear of EVERY village member in plan (its reach and the other's: 26 m hung, 14 m landed)
    const c = deal(rl, -40, 0, NORTH - 150, 150, 0, 60), hd = rl(); c.over = 40 + 26 * hd; c.landed = false; c.R = 26; c.yaw = Math.atan2(RING[0] - c.x, RING[2] - c.z);
    if (land.rimDist(c.x, c.z) > 60 + c.R && !inWedge(c.x, c.z, 30) && !byFall(c.x, c.z, 26) && path.nearestXZ(c.x, c.z).dist > 30 && village.every((o) => Math.hypot(o.x - c.x, o.z - c.z) > c.R + o.R)) { village.push(c); n++; }
  }
  for (const [cx, cz, sx, sz] of [[-215, -1250, 60, 130], [150, -1240, 70, 100]]) {   // the dealt ones, in PAIRS (north-west of the rows, and east of them; none in the wedge behind the lip): the second within 74 m of the first, or neither
    let first = null, mate = null;
    for (let k = 0; k < 300 && !first; k++) { const c = deal(rv, cx, 0, cz, sx, 0, sz); c.R = 14; c.landed = true; if (okTop(c)) first = c; }
    if (!first) continue;
    village.push(first);
    for (let k = 0; k < 300 && !mate; k++) { const c = deal(rv, first.x, 0, first.z, 62, 0, 62); c.R = 14; c.landed = true; if (Math.hypot(c.x - first.x, c.z - first.z) < 74 && okTop(c)) mate = c; }
    if (mate) village.push(mate); else village.pop();
  }
  await yieldFn();
  // NEVER ONE ALONE, one rule for every hung or landed thing once all are placed (typed, dealt, in the air or on the
  // rock): one aloft has two others within 80 m and a landed one a neighbour, or a dealt one is not flown; said again until no more are cut
  for (const c of village) c.gy = land.topAt(c.x, c.z) + (c.landed ? 1.12 : c.over + 1.2);
  for (let pass = 0; pass < 8; pass++) {
    const A = hung.map((H) => [H.x, H.y, H.z, null]).concat(list.filter((c) => !c.fixed).map((c) => [c.x, c.y - 14, c.z, c]), village.map((c) => [c.x, c.gy, c.z, c]));
    const lone = A.filter((a) => a[3] && A.filter((o) => o !== a && Math.hypot(a[0] - o[0], a[1] - o[1], a[2] - o[2]) < 80).length < (a[3].landed ? 1 : 2));   // one aloft needs two others, a landed one a neighbour
    if (!lone.length) break;
    for (const a of lone) { const L = village.includes(a[3]) ? village : list; L.splice(L.indexOf(a[3]), 1); }
  }
  // ---- geometry
  for (const c of list) {
    if (c.fixed) continue;
    const rng = P.core.makeRng(c.sd), H = hang(rng, c.x, c.y - 14, c.z, c.yaw, { fam: c.fam }), b = addBuilding(B, H, rng, c.kind, { plain: true, bags: 3 });
    dress(rng, H, b, c.form, c.fam, { thin: 1.3 });               // the fleet's far groups carry thinner bunches
    await yieldFn();
  }
  // NO BUNCH THROUGH ANOTHER, a rule for every building still hung over the top: where two stand nearer in plan than their bunches' two reaches
  // (the steps of a stair do), the later one's bunch is measured against the earlier one's, balloon by balloon: each skin (half its size) with
  // its own bob and the most its turn and swings can carry it (3.2 times its swing's angle times its arm from the pivot). One that would touch
  // at any phase of the two motions is built again 2 m higher, with the same dice, until it rides clear
  const mark = () => [hung.length, P.S.z.map((Z) => [Z.b.length, Z.l.length, Z.nb, Z.nl]), B.z.map((Z) => [Z.v.length, Z.i.length, Z.n])];
  const undo = (m) => { hung.length = m[0]; P.S.z.forEach((Z, i) => { Z.b.length = m[1][i][0]; Z.l.length = m[1][i][1]; Z.nb = m[1][i][2]; Z.nl = m[1][i][3]; }); B.z.forEach((Z, i) => { Z.v.length = m[2][i][0]; Z.i.length = m[2][i][1]; Z.n = m[2][i][2]; }); };
  const skins = (H, from) => { const Z = P.S.z[H.zone].b, L = []; for (let i = from; i < Z.length; i += BSTRIDE) L.push([Z[i], Z[i + 1], Z[i + 2], Z[i + 3] / 2 + H.mv[1] + 3.2 * H.mv[3] * Math.hypot(Z[i] - H.pivot[0], Z[i + 1] - H.pivot[1], Z[i + 2] - H.pivot[2])]); return L; };
  const inBox = (L, M) => { let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9, z0 = 1e9, z1 = -1e9, r = 0; for (const q of M) { x0 = Math.min(x0, q[0]); x1 = Math.max(x1, q[0]); y0 = Math.min(y0, q[1]); y1 = Math.max(y1, q[1]); z0 = Math.min(z0, q[2]); z1 = Math.max(z1, q[2]); r = Math.max(r, q[3]); }
    return L.filter((p) => p[0] > x0 - r - p[3] && p[0] < x1 + r + p[3] && p[1] > y0 - r - p[3] && p[1] < y1 + r + p[3] && p[2] > z0 - r - p[3] && p[2] < z1 + r + p[3]); };
  const through = (A, M) => { const a = inBox(A, M), m = a.length ? inBox(M, a) : []; return a.some((p) => m.some((q) => Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]) < p[3] + q[3])); };
  for (const c of village) {
    let rng = P.core.makeRng(c.sd); const ground = land.topAt(c.x, c.z), y = c.landed ? ground + 1.12 : ground + c.over + 1.2, m0 = mark();
    if (c.landed) land.pads.push([c.x, c.z, 15, ground]);
    if (c.kind === 'house') {                                       // the house: its pivot at its ball's middle; the ball rides 5 m clear over the chimney's cap
      const H = hang(rng, c.x, ground + c.over, c.z, c.yaw, { fam: 0, hero: true, calm: true, up: 49 }), b = addBuilding(B, H, rng, 'house'), R = 28, cy = b.top + 5 + R;
      await bunchBall(P.S, H, rng, { r: R, cy, to: b.chim, sp: 1.7 }, yieldFn); c.H = H; c.b = b; P.house = { H, b, ball: [H.x, H.y + cy, H.z, R] }; await yieldFn();
      continue;
    }
    let H = hang(rng, c.x, y, c.z, c.yaw, { fam: c.fam, landed: c.landed, up: 16 }), b = addBuilding(B, H, rng, c.kind, { plain: !(c.landed || c.over < 10), bags: 3 });
    c.H = H; c.b = b;
    if (c.landed) { dress(rng, H, b, c.form, c.fam, { size: 0.7, low: 6 + 4 * rng(), layers: 3, n: 2, count: 8, bag: 0.9, rise: 11, radii: [10, 7.5, 5], len: Math.max(18, b.L * 1.35), wid: Math.max(11 + 2 * rng(), 0.5 * Math.max(18, b.L * 1.35)) }); const sd = rng() < 0.5 ? -26 : 26, tsd = Math.floor(rng() * 1e9), off = (l) => path.nearestXZ(H.x + l * H.cs, H.z - l * H.sn).dist, lx = off(sd) >= off(-sd) ? sd : -sd;
      if (off(lx) > 30) P.threads.push([H, lx, b.top + 9, 0, c.fam, 4, 36, tsd]); }   // let go at the bunch's END that stands farther from the route's line (none within 30 m of it), clear of its skin
    else { dress(rng, H, b, c.form, c.fam, {});                     // a hung one lets a few go on its side away from the route's line (none within 40 m of it)
      const by = village.filter((o) => o.skin && Math.hypot(o.x - c.x, o.z - c.z) < o.R + c.R); c.skin = skins(H, m0[1][H.zone][0]);
      for (let lift = 2; lift <= 40 && by.some((o) => through(c.skin, o.skin)); lift += 2) {   // the same dice, 2 m higher
        undo(m0); rng = P.core.makeRng(c.sd); H = hang(rng, c.x, y + lift, c.z, c.yaw, { fam: c.fam, landed: c.landed, up: 16 }); b = addBuilding(B, H, rng, c.kind, { plain: !(c.landed || c.over < 10), bags: 3 });
        dress(rng, H, b, c.form, c.fam, {}); c.H = H; c.b = b; c.lift = lift; c.skin = skins(H, m0[1][H.zone][0]); await yieldFn();
      }
      const foot = [[32, 0], [-32, 0], [0, 30], [0, -30]].map((l) => [l[0], l[1], path.nearestXZ(H.x + l[0] * H.cs + l[1] * H.sn, H.z - l[0] * H.sn + l[1] * H.cs).dist]).sort((a, b) => b[2] - a[2])[0];
      const tsd = Math.floor(rng() * 1e9); if (foot[2] > 40) P.threads.push([H, foot[0], b.top + 9, foot[1], c.fam, 6, 50, tsd]); }
    await yieldFn();
  }
  // LET GO, when every thing stands: a thread rises only where no thing aloft stands over its way: none within 38 m of its foot in plan (a
  // bunch's reach of 26 m and the thread's drift of 12 m) whose deck is higher than 30 m under the foot and lower than the thread's top
  const w = [0, 0, 0];
  for (const [H, lx, ly, lz, fam, n, span, sd] of P.threads) {
    toWorld(H, lx, ly, lz, w);
    if (land.rimDist(w[0], w[2]) < 60 + 15) continue;               // none is let go where its drift of 12 m could carry it within 60 m of the true rim
    if (!hung.some((o) => o !== H && !o.landed && o.y > w[1] - 30 && o.y < w[1] + span + 6 && Math.hypot(o.x - w[0], o.z - w[2]) < 38)) looseThread(P.S, H, P.core.makeRng(sd), lx, ly, lz, fam, n, span);
  }
  P.fleet = list; P.village = village;
  return P;
}
