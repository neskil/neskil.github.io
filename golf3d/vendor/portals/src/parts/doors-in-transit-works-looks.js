// doors-in-transit: THE LOOKS (the works builder's part), as plain numbers: no three.js here, so that a count can be
// made of them against the very same flown line. EVERY LOOK OPENS AND CLOSES AT A PLACE OF THE WORLD: a place is metres
// along the flown line from the entry, found as a named place of the line or as the place where the bearing to the
// look's target passes a stated angle off the bow; fades are metres. EVERY TARGET IS A POINT OF THE PLAN (its own
// numbers), or the marked door on the course the plan gives it. The rules kept here, and counted by lookCount below:
// a look opens only where its target lies within 60 degrees of the bow and is let go before the target is abeam; no
// two looks add over 1 anywhere; beside a long side the gaze leads along the hall and never rests square-on to it.
// (Only in the first half circle, which runs across the arena's end and beside no long side, does the gaze sweep
// past the west side square-on, from 55 m off across the floor, as the turn itself does.) No share of the flight
// is typed.
// THE MIDDLE OF THE FLIGHT NEVER RESTS ON THE PAVING. From the middle of the climb round the whole head turn the
// upper streets stand outward of the line, close and near the eye's height, and the gaze slides level along them: a
// CHAIN of fixed points on their rails at door height, one after another. The chain's looks follow one another
// every STEP metres of the line (a twelfth of the head turn), and each look's point is where the level ray PEAK
// degrees outward of the bow, from the middle of that look's stretch, meets the street's rail: the third street's
// while the eye is still under that street's rail, the top street's after. Each look is a plain swell: it opens
// where the look before it is strongest, is strongest at its own middle and is gone where the next one is; so each
// point is held while it passes from about 15 to about 55 degrees off the bow, some 30 to 55 m away, and as one look
// falls the next rises by the same measure. THE CHAIN HANDS OVER TO THE TOWER THROUGH THE BOW, never in one swing
// from the outer side to the inner: its last look is gone where the tower's look opens, and that last look is aimed
// nearer the bow (PEAK_LAST), so that the gaze has come most of the way back before the tower draws it inward.
// THEN THE TOWER'S MIDDLE: whole, with the hall's length and the sunny screen beyond it, from where it comes within
// 60 degrees of the bow at the end of the head turn; held down the straight of the descent, where the tower stands
// 40 to 50 m off on the inner side and its doors pass large (the gaze looks into the hall at the tower, 65 degrees
// from the hall's axis at the most and only as it is let go: never square-on to a long side); let go as the line
// curves in past the tower, within two and a half radii of its axis. THEN THE MARKED DOOR, its look rising over
// the same HAND metres as the tower's falls: coming to a stand in its bay, and in it.
import { MARKED, DOOR, TOWER, BAY, TIERS, STRAIGHT, tierRadius, tierRail } from './doors-in-transit-plan.js';

const DEG = 180 / Math.PI;
const ss = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

// table: the fine copy of the flown line (routeTable); ends: its legs' ends as shares (legEnds); markedAt(u, out):
// the works' course of the marked door. Returns { pois, list, offBow }: pois for the engine; list: the same looks
// with their places in metres and their targets as functions of metres flown (for the count).
export function makeLooks({ table, ends, markedAt }) {
  const TOTAL = table.total, pt = table.pts, cum = table.cum, last = pt.length - 2;
  const S = { A: ends.A * TOTAL, B: ends.B * TOTAL, C: ends.C * TOTAL, D: ends.D * TOTAL };      // the canyon's end, the bay turn's end, the climb's end, the head turn's end
  // the bearing, in degrees off the bow and level, from the line's point i to (x, z)
  const offBow = (i, x, z) => { const j = Math.min(i, last), hx = pt[j + 1][0] - pt[j][0], hz = pt[j + 1][2] - pt[j][2], dx = x - pt[j][0], dz = z - pt[j][2];
    return Math.acos(Math.max(-1, Math.min(1, (hx * dx + hz * dz) / (Math.hypot(hx, hz) * Math.hypot(dx, dz) + 1e-9)))) * DEG; };
  // the first place at or after `from` (metres) where test(i) holds
  const firstPlace = (from, test) => { for (let i = 0; i <= last; i++) if (cum[i] >= from && test(i)) return cum[i]; return TOTAL; };
  const mid = DOOR.drop / 2;                                               // from a rail down to the middle of its doors

  // ---- the targets: points of the plan
  const bayMouth = [0, BAY.height / 2, BAY.zFront];                        // the middle of the bay's open front
  const street0West = [-tierRadius(0), tierRail(0) - mid, -STRAIGHT];      // the lowest street where its end curve joins its west straight: past the bay, across the arena's end, at eye level
  const towerFoot = [TOWER.x, TOWER.foot, TOWER.z];                        // the foot of the tower, on its axis
  const street1Head = [-tierRadius(1), tierRail(1) - mid, STRAIGHT];       // the head of the second street's west straight: the nearest street on the climb
  const towerMid = [TOWER.x, (TOWER.foot + TOWER.head) / 2, TOWER.z];      // the tower's middle: its axis at mid height
  // the chain: the middles of its looks along the line, and each one's point on a street's rail at door height
  const third = TIERS - 2, top = TIERS - 1, PEAK = 35, PEAK_LAST = PEAK * 0.6, STEP = (S.D - S.C) / 12, CHAIN = [];
  const outOf = (k, x, z) => (Math.abs(z) <= STRAIGHT ? Math.abs(x) : Math.hypot(x, Math.abs(z) - STRAIGHT)) - tierRadius(k);      // metres outward of street k's rail, in plan
  const index = (m) => { let i = 0; while (i < last && cum[i] < m) i++; return i; };
  const onRail = (m, peak) => {                                              // the point for the look whose middle lies m metres along the line
    const i = index(m), p = pt[i], hx = pt[i + 1][0] - p[0], hz = pt[i + 1][2] - p[2], hl = Math.hypot(hx, hz) || 1, c = Math.cos(peak / DEG), sn = Math.sin(peak / DEG);
    const dx = (hx * c - hz * sn) / hl, dz = (hz * c + hx * sn) / hl, k = p[1] < tierRail(third) ? third : top;      // the ray: the bow turned PEAK degrees to the right, the outer side of this left-handed flight
    let t = 0; while (t < 150 && outOf(k, p[0] + dx * t, p[2] + dz * t) < 0) t += 0.05;
    return [(k === third ? 'the third street' : 'the top street') + '\'s rail ' + t.toFixed(0) + ' m off', [p[0] + dx * t, tierRail(k) - mid, p[2] + dz * t]];
  };
  const MP = [0, 0, 0, 0, 0, 0], door = [0, 0, 0];
  // the marked door's middle; while it runs the spur the aim stands over it at the lens's own height (a door's
  // height over it at the least), so that from high on the descent the gaze is level, with the hall's sunny end over
  // the bay and the door below the picture's middle, and is not pressed down onto the paving; over the last EASE
  // metres before the door stops the aim comes down onto it
  const EASE = 30, marked = (m) => { markedAt(m / TOTAL, MP); const left = TOTAL - m, y = MP[1] - DOOR.drop + MARKED.h / 2, eye = pt[index(Math.min(m, TOTAL))][1];
    door[0] = MP[0]; door[1] = y + Math.max(MARKED.h, eye - y) * ss(MARKED.stopLeft, MARKED.stopLeft + EASE, left); door[2] = MP[2]; return door; };

  // ---- the places (metres from the entry)
  const bay40 = firstPlace(0, (i) => Math.hypot(pt[i][0] - bayMouth[0], pt[i][2] - bayMouth[2]) <= 40);
  const bayAbeam = firstPlace(S.A, (i) => pt[i][0] <= bayMouth[0]);       // where the line crosses the hall's axis in front of the bay
  const towerOn = firstPlace(S.A, (i) => offBow(i, towerFoot[0], towerFoot[2]) <= 60);
  const towerOff = firstPlace(S.B, (i) => offBow(i, towerFoot[0], towerFoot[2]) >= 35);
  const towerMidOn = firstPlace((S.C + S.D) / 2, (i) => offBow(i, towerMid[0], towerMid[2]) <= 60);     // near the end of the head turn
  const chain0 = (S.B + S.C) / 2, N = Math.floor((towerMidOn - chain0) / STEP) - 1, streetOff = chain0;      // the chain begins at the middle of the climb, where the nearest street is let go; its last look is gone where the tower's opens
  for (let k = 0; k <= N; k++) CHAIN.push(onRail(chain0 + k * STEP, k < N ? PEAK : PEAK_LAST));
  const towerMidOff = firstPlace(S.D, (i) => Math.hypot(pt[i][0] - TOWER.x, pt[i][2] - TOWER.z) <= 2.5 * TOWER.radius);    // on the descent's curve in past the tower: where the line comes within two and a half radii of its axis
  const HAND = 22;                                                         // metres over which the tower's look falls and the marked door's rises

  // ---- the looks: [name, target, from, to, fade (metres), weight, why]
  const list = [
    ['bay', bayMouth, 0, bay40, 12, 0.55, 'the bay as a whole down the canyon, from the entry until its mouth is 40 m off (nearer, the bay must not be the picture)'],
    ['beyond', street0West, bay40 - 12, bayAbeam, 14, 0.65, 'past the bay, level over the arena floor, to the lowest street\'s trains beyond it (the bay itself is not to be the picture from close by): from 40 m off the mouth until the bay is abeam'],
    ['tower', towerFoot, towerOn, towerOff, 15, 0.55, 'the tower up the length of the hall: from where its foot comes within 60 degrees of the bow in the turn until it is 35 degrees off it on the climb'],
    ['street', street1Head, towerOff - 15, streetOff, 12, 0.55, 'along the nearest street, its trains passing large and close: until the chain of the upper streets is at its first point\'s strongest, at the middle of the climb'],
    ...CHAIN.map(([what, q], k) => ['chain ' + (k + 1), q, chain0 + (k - 1) * STEP, chain0 + (k + 1) * STEP, STEP, 0.7, what + ', at door height: a swell ' + (2 * STEP).toFixed(0) + ' m long, strongest at its middle, where the point stands ' + (k < N ? PEAK : PEAK_LAST) + ' degrees off the bow']),
    ['whole tower', towerMid, towerMidOn, towerMidOff, HAND, 0.7, 'the tower\'s middle, so that the whole tower stands in the picture with the hall\'s length beyond, and then its doors pass large and close: from where it comes within 60 degrees of the bow at the end of the head turn, down the descent, until the line is within two and a half radii of its axis'],
    ['door', null, towerMidOff - HAND, TOTAL + HAND, HAND, 0.7, 'the marked door coming to a stand in its bay, and in it: from where the tower\'s look begins to fall to the door\'s own frame'],
  ].map(([name, target, from, to, fade, weight, why]) => ({ name, from, to, fade, weight, why, at: target ? () => target : marked }));

  const pois = list.map((L) => ({ at: L.at === marked ? (time, u) => marked(u * TOTAL) : L.at(0), from: L.from / TOTAL, to: L.to / TOTAL, fade: Math.min(0.5, L.fade / Math.max(1, L.to - L.from)), weight: L.weight }));
  return { pois, list, offBow, total: TOTAL };
}

// THE COUNT of the looks against the rules above, every `step` metres of the line: for each look its bearing off the
// bow where it opens and where it closes, the greatest bearing while it holds, and the greatest sum of the looks'
// weights anywhere (the engine's own bell over a look's window).
export function lookCount(looks, table, step = 1) {
  const TOTAL = table.total, cum = table.cum, at = (m) => { let i = 0; while (i < cum.length - 2 && cum[i + 1] <= m) i++; return i; };
  const bell = (x, a, b, f) => { const w = (b - a) * f; return ss(a, a + w, x) * (1 - ss(b - w, b, x)); };
  const rows = looks.list.map((L) => ({ name: L.name, from: L.from, to: L.to, open: 0, close: 0, most: 0 }));
  let sum = 0, sumAt = 0;
  for (let m = 0; m <= TOTAL; m += step) {
    let s = 0;
    looks.list.forEach((L, k) => {
      const w = bell(m, L.from, L.to, Math.min(0.5, L.fade / Math.max(1, L.to - L.from))) * L.weight; s += w;
      if (m < L.from || m > Math.min(L.to, TOTAL)) return;
      const p = L.at(m), b = looks.offBow(at(m), p[0], p[2]), r = rows[k];
      if (m - L.from < step) r.open = b;
      r.close = b; if (w > 0.02) r.most = Math.max(r.most, b);
    });
    if (s > sum) { sum = s; sumAt = m; }
  }
  return { rows, sum, sumAt };
}
