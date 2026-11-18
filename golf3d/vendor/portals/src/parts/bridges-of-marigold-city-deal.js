// bridges-of-marigold, the city: THE DEAL OF THE STACKS (plain numbers, no drawing). Every tower of the plan is dealt
// as tiers of houses round its axis: each house a block 7 to 12 wide and 6 to 9 high, set a little askew, pushed out
// as far as the plan's towerRadius lets its own corners go less an inset of its own (proud, middling or deep, so that
// neighbours stand at different depths and an upper house may hang out over a lower one). The tiers do not lie level:
// each climbs one pitch in a turn round the axis, so the stack winds up like a stair and no course of roofs runs
// straight round a tower. Near the top the rings go on inward and whole sectors stop one to three tiers early, so
// that the tops are broken; tower 7 alone is cut level under its roof terrace.
// Each tower has its own stream of the seed ('stack0' .. 'stack7'): tier pitch, slot widths, askew, inset, depth,
// colour (never the colour of the neighbour before it, of the first of its tier, or of the house under it), roof kind.
import { TOWERS, towerRadius, GATE, canyonBridge } from './bridges-of-marigold-plan.js';
import { leave } from './bridges-of-marigold-city-place.js';

export const NCOL = 10;                    // the count of wall colours (the palette itself stands in the work file)
export const EDGE = 0.3;                   // every corner keeps this much inside towerRadius, before its own inset

// The places where houses are left out so that a stone thing of the city can stand there (all from the plan).
const landing0 = canyonBridge(0), landing4 = canyonBridge(1);
function leftOut(k, x, y0, y1, z) {
  if (k === 0) {
    if (Math.abs(x) < GATE.half + 6 && z > 20 && y0 < GATE.top + 2) return true;                 // the gate house
    if (Math.hypot(x - landing0[0], z - landing0[2]) < 17 && y1 > landing0[1] - 1 && y0 < landing0[1] + 13) return true;   // the canyon bridge's door
  }
  if (k === 4 && Math.hypot(x - landing4[0], z - landing4[2]) < 13.5 && y1 > landing4[1] - 1 && y0 < landing4[1] + 12) return true;   // its side terrace
  return false;
}

// The farthest a block's centre may stand from the axis so that all four corners keep inside the radius R.
function reach(R, w, d, askew) {
  const s = Math.sin(askew), c = Math.cos(askew); let best = Infinity;
  for (const lx of [-w / 2, w / 2]) for (const lz of [-d / 2, d / 2]) {
    const a = -lx * s + lz * c, b = lx * c + lz * s;
    best = Math.min(best, Math.sqrt(Math.max(0, R * R - b * b)) - a);
  }
  return best;
}

// The heights of a ring tower's great terrace rings (two or three; the great tower and tower 7 have none): stream 'rings<k>'.
export function terraceRings(rngFor, k) {
  const t = TOWERS[k], L = []; if (k === 0 || k === TOWERS.length - 1) return L;
  const rng = rngFor('rings' + k), n = rng() < 0.5 ? 2 : 3;
  for (let i = 0; i < 3; i++) { const u = rng(); if (i < n) L.push(t.base + (t.top - t.base) * ((i + 0.35 + 0.4 * u) / (n + 0.25))); }
  return L;
}

// Deals every tower (only < 0) or the one tower `only` onto `houses`, which it returns.
export function dealStacks(rngFor, houses = [], only = -1) {
  const TAU = Math.PI * 2;
  TOWERS.forEach((t, k) => {
    if (only >= 0 && k !== only) return;
    const rng = rngFor('stack' + k);
    const nT = Math.round((t.top - t.base) / 7.1), pitch = (t.top - t.base) / nT;
    const level = k === 7, lid = level ? t.top - 0.75 : t.top, least = level ? 3.2 : 6;
    // the broken top: sectors of the ring, each stopping some tiers early; and where the winding stair of tiers begins
    const nSec = rng.int(7, 11), early = [], sec0 = rng() * TAU, wind0 = rng() * TAU;
    for (let i = 0; i < nSec; i++) { const u = rng(), v = rng(); early.push(level ? [0, 0] : [u < 0.3 ? 0 : u < 0.6 ? 1 : u < 0.85 ? 2 : 3, v < 0.5 ? 1 : 2]); }
    const earlyAt = (phi, ringI) => { const e = early[Math.floor((((phi - sec0) / TAU) % 1 + 1) % 1 * nSec) % nSec]; return Math.max(0, e[0] - ringI * e[1]); };
    const climb = (phi) => ((((phi - wind0) / TAU) % 1) + 1) % 1 * pitch;
    // set-backs: bites out of the stack (a stretch of the ring, one to four tiers high) in which the houses stand 3.5 to
    // 6.5 m deeper, so that the roofs under a bite lie open as terraces and the tower's outline steps in and out
    const nB = k === 0 ? rng.int(12, 16) : rng.int(6, 9), bites = [];
    for (let i = 0; i < nB; i++) bites.push({ phi: rng() * TAU, half: 0.3 + rng() * (k === 0 ? 0.35 : 0.6), t0: rng.int(1, Math.max(2, nT - 4)), span: rng.int(1, 4), depth: 3.5 + rng() * 3 });
    const biteAt = (phi, ti) => { let d = 0; for (const b of bites) { const q = Math.abs((((phi - b.phi) % TAU) + TAU + Math.PI) % TAU - Math.PI); if (q < b.half && ti >= b.t0 && ti < b.t0 + b.span) d = Math.max(d, b.depth); } return d; };
    // a ring tower's own figure: a bulge or a waist at some height, 2 to 4 m; and some of its houses jut 2 to 5 m out
    // beyond the plan's radius where the leave allows it (never in a set-back, never across a terrace ring)
    const shaped = k > 0 && !level, ringsY = terraceRings(rngFor, k), pk = rng(), py = 0.3 + rng() * 0.45, pa = 2 + rng() * 2.2, pw = 0.1 + rng() * 0.1;
    const prof = (y) => { const q = ((y - t.base) / (t.top - t.base) - py) / pw; return (pk < 0.5 ? 1 : -1) * pa * Math.exp(-q * q); };
    const begin = houses.length;
    let under = [];                                         // the outer ring of the tier below: [phi0, phi1, colour]
    for (let ti = -1; ti < nT; ti++) {
      const yT = t.base + ti * pitch, fromTop = nT - 1 - ti, rings = fromTop < 4 ? 6 : 1, now = [];
      for (let ri = 0; ri < rings; ri++) {
        const Rtop = towerRadius(k, Math.min(t.top - 0.01, Math.max(t.base + 0.01, yT + pitch * 1.5 + 1.5))) - EDGE, Rf = Rtop - 1.6 - ri * 9.8;
        if (Rf < 3.5) {
          if (ri > 0 && Rf > -4.5) {                        // the middle of the top: one block on the axis
            const w = rng.range(7, 9.5), d = rng.range(7, 9.5), yaw = rng() * Math.PI, drop = rng() * 0.8, rise = rng() * 1.2, col = Math.floor(rng() * NCOL), seed = rng(), roof = rng();
            const y = yT + pitch * 0.5 - drop, h = Math.min(9, pitch + drop + rise, lid - y);
            if (earlyAt(0, ri) <= fromTop && h >= least) houses.push({ k, x: t.x, z: t.z, y, w, h, d, yaw, phi: yaw, col, seed, roof, inset: 0, ring: ri, top: fromTop, face: 0 });
          }
          break;
        }
        const wAvg = rng.range(8.4, 10.4), n = Math.max(3, Math.round(TAU * Rf / wAvg)), a0 = rng() * TAU, cuts = [];
        for (let i = 0; i < n; i++) cuts.push(a0 + (i + (rng() - 0.5) * 0.36) * (TAU / n));
        let first = -1, prev = -1;
        for (let i = 0; i < n; i++) {
          // every die of this house is drawn before any test
          const uw = rng(), ud = rng(), uk = rng(), ui = rng(), ui2 = rng(), udrop = rng(), urise = rng(), ucol = rng(), seed = rng(), roof = rng(), uo = rng();
          const p0 = cuts[i], p1 = i + 1 < n ? cuts[i + 1] : cuts[0] + TAU, phi = (p0 + p1) / 2;
          const arc = (p1 - p0) * Rf, w = Math.min(12, Math.max(7, arc * (0.9 + 0.14 * uw))), d = 8.5 + 2.5 * ud;
          const bite0 = ri === 0 ? Math.min(biteAt(phi, ti), Math.max(0, Rf - 11)) : 0;     // (never so deep that no house fits)
          const pr = shaped && ri === 0 ? prof(yT + pitch / 2) : 0, bite = bite0 + Math.min(Math.max(0, -pr), Math.max(0, Rf - 13 - bite0));
          const askew = (uk - 0.5) * 0.3, inset = bite + (ri > 0 ? ui * 1.5 : (ui < 0.45 ? ui2 * 0.8 : ui < 0.8 ? 1.5 + ui2 * 1.1 : 3 + ui2 * 1.2));
          const drop = udrop * 1.1, rise = urise * 1.9 - 0.8, y = yT + climb(phi) - drop;
          let h = Math.min(9, Math.max(6, pitch + drop + rise), lid - y), tiled = roof < 0.42 && !level && y + h * 1.25 < t.top;
          if (roof < 0.42 && !level && !tiled && (t.top - y) / 1.25 >= 5.6) { h = (t.top - y) / 1.25; tiled = true; }   // a top house under a pitched roof is the lower for it
          const R = towerRadius(k, Math.min(t.top - 0.01, Math.max(t.base + 0.01, y + h * 1.25))) - EDGE - inset - ri * 9.8;
          const want = (uo < 0.3 ? 2 + 10 * uo : 0) + Math.max(0, pr), inBand = ringsY.some((yr) => y < yr + 4.5 && y + h * 1.25 > yr - 0.8);
          const out = shaped && ri === 0 && bite === 0 && !inBand && want > 0 ? Math.min(want, leave(t.x + (R + 5) * Math.sin(phi), t.z + (R + 5) * Math.cos(phi), w / 2 + 1)) : 0;
          const rho = reach(R + out, w + 0.6, d + 0.6, askew);     // (the spare is for the eaves of a tiled roof)
          // colour: one die among the colours not barred
          const below = ri === 0 ? under.find((e) => { const q = ((phi - e[0]) % TAU + TAU) % TAU; return q < e[1] - e[0]; }) : null;
          const bar = [prev, i === n - 1 ? first : -1, below ? below[2] : -1], free = [];
          for (let c = 0; c < NCOL; c++) if (!bar.includes(c)) free.push(c);
          const col = free[Math.floor(ucol * free.length)];
          prev = col; if (i === 0) first = col;
          if (ri === 0) now.push([p0, p1, col]);
          if (h < least || y + h < t.base + 3) continue;     // cut away by the lid of the tower, or sunk whole in its foot
          if (rho < d / 2 - 2) continue;                     // no room this far in
          const x = t.x + rho * Math.sin(phi), z = t.z + rho * Math.cos(phi);
          if (earlyAt(phi, ri) > fromTop) continue;          // this sector has stopped below this tier
          if (leftOut(k, x + (d / 2) * Math.sin(phi), y, y + h, z + (d / 2) * Math.cos(phi))) continue;
          houses.push({ k, x, z, y, w, h, d, yaw: phi + askew, phi, col, seed, roof, inset, ring: ri, top: fromTop, face: rho + d / 2, tiled, ti, bite, deck: 0, out });
        }
      }
      under = now;
    }
    // the roofs that lie open under a bite: how deep the open strip is, counted back from the house's own front
    for (let i = begin; i < houses.length; i++) { const h = houses[i]; if (h.ring === 0 && h.ti !== undefined) { const d = Math.min(biteAt(h.phi, h.ti + 1), h.face - 9) - h.inset; if (d >= 2.4) h.deck = d; } }
  });
  return houses;
}
