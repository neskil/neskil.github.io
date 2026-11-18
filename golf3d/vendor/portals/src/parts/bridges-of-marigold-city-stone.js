// bridges-of-marigold, the city: THE STONE. The feet of the seven ring towers (a quay at the water and two stepped
// tiers, with stairs from the quay up to the houses), the great tower's stepped pyramid with its quay, its stairs and
// its gate terrace on the south face, and the dark inside of every tower (what is seen through gaps between houses). All of it is laid into one accumulator (city-geo) and takes its sizes from
// the plan: no corner stands outside towerRadius. Stream 'stone' deals the turn of each foot and its steps' heights.
import { TOWERS, towerRadius, GATE, GREAT_BRIDGE } from './bridges-of-marigold-plan.js';

export const QUAY = 3.2;                  // the quay of a stone foot stands this far inside footR (boats lie in the water outside it)
export const CORE = 12.5;                 // the dark inside of a tower stands this far inside the plan's radius
export const STONE = [0.2, 0.18, 0.28], STONE_PALE = [0.3, 0.27, 0.38], STONE_DARK = [0.11, 0.1, 0.17];

// A flight of stone steps along side `si` of an n-sided tier (the face it leans on has corner radius R), from y0 up
// to y1, climbing to the left (dir 1) or to the right (dir -1) as seen from outside.
function flight(G, x, z, n, rot, si, R, y0, y1, dir) {
  const am = rot + (si + 0.5) * Math.PI * 2 / n, ap = R * Math.cos(Math.PI / n), w = 1.25, rise = 0.4, run = 0.44;
  const steps = Math.max(2, Math.round((y1 - y0) / rise)), len = steps * run, tx = Math.cos(am) * dir, tz = -Math.sin(am) * dir;
  const cx = x + (ap + 0.1 + w / 2) * Math.sin(am), cz = z + (ap + 0.1 + w / 2) * Math.cos(am), yaw = Math.atan2(-tx, -tz);
  for (let i = 0; i < steps; i++) {
    const d = -len / 2 + (i + 0.5) * run;
    G.box(cx + tx * d, y0, cz + tz * d, w, (i + 1) * ((y1 - y0) / steps), run, yaw, false);
  }
}

function* stoneSteps(G, rngFor) {
  const rng = rngFor('stone');
  for (let k = 0; k < TOWERS.length; k++) {
    const t = TOWERS[k];
    const rot = rng() * Math.PI, jit = [rng(), rng(), rng()], q = t.footR - QUAY;
    if (k === 0) {
      // a quay at the water, then the stepped pyramid: five tiers of battered stone, each with a ledge and a string
      // course; on its south-west and south-east faces stairs climb from the quay to the top, ledge by ledge
      const n = 28, tiers = 5, rTop = t.r + 4.2, rBot = q - 1.8, yTop = t.footTop;
      G.col(STONE).aux(0, 0.1).prism(t.x, t.z, -3, 1.1, q, q, n, rot, true);
      const side = (phi) => Math.round(((((phi - rot) / (Math.PI * 2)) % 1) + 1) % 1 * n - 0.5 + n) % n;
      for (let i = 0; i < tiers; i++) {
        const y0 = i === 0 ? 1.1 : (yTop * i) / tiers, y1 = (yTop * (i + 1)) / tiers;
        const r0 = rBot + (rTop - rBot) * (i / (tiers - 1)), r1 = r0 - 1.1;
        G.col(i % 2 ? STONE : STONE_PALE).aux(0, 0.07 + 0.05 * i).prism(t.x, t.z, y0, y1, r0, r1, n, rot, true);
        G.col(STONE_PALE).aux(0, 0.1 + 0.05 * i).prism(t.x, t.z, y1 - 0.7, y1, r1 + 0.45, r1 + 0.45, n, rot, false);
        G.col(STONE_PALE).aux(0, 0.3 + 0.06 * i);
        for (const phi of [0.75, -0.75, 2.4, -2.4]) flight(G, t.x, t.z, n, rot, side(phi), r1, y0, y1, i % 2 ? 1 : -1);
      }
    } else {
      // a quay at the water and two tiers of stone; a stair from the quay to the first ledge and on to the houses
      const n = 14, y1 = 8 + jit[0] * 2, si = Math.floor(jit[1] * n);
      G.col(STONE).aux(0, 0.1).prism(t.x, t.z, -3, 1.1, q, q, n, rot, true);
      G.col(STONE_PALE).aux(0, 0.14).prism(t.x, t.z, 1.1, y1, q - 1.2, q - 1.5, n, rot, true);
      G.col(STONE).aux(0, 0.2).prism(t.x, t.z, y1, t.footTop, t.r + 0.75, t.r + 0.45, n, rot, true);
      G.col(STONE_PALE).aux(0, 0.24).prism(t.x, t.z, t.footTop - 0.6, t.footTop, t.r + 0.95, t.r + 0.95, n, rot, false);
      G.col(STONE_PALE).aux(0, 0.35);
      for (const s2 of [si, (si + 7) % n]) { flight(G, t.x, t.z, n, rot, s2, q - 1.5, 1.1, y1, 1); flight(G, t.x, t.z, n, rot, s2, t.r + 0.45, y1, t.footTop, -1); }
    }
    // the dark inside: far behind the deepest house's face
    const yA = t.base, yB = t.top - 21.5;
    G.col([0.02, 0.015, 0.04]).aux(5, 0).prism(t.x, t.z, yA, yB, towerRadius(k, yA + 0.01) - CORE, towerRadius(k, yB) - CORE, 20, 0, true);
    yield;
  }
  // the gate terrace: a bastion of stone on the pyramid's south face, its floor at the gate's level
  const hw = 21.5, z0 = GATE.z0 - 6, z1 = GREAT_BRIDGE.z1 + 1.6;
  G.col(STONE).aux(0, 0.22).box(0, -3, (z0 + z1) / 2, hw * 2, GATE.terraceY + 2.6, z1 - z0, 0, false);      // (it stands in the water)
  G.col(STONE_PALE).aux(0, 0.4).box(0, GATE.terraceY - 0.4, (z0 + z1) / 2, hw * 2 + 0.6, 0.4, z1 - z0 + 0.6, 0, true);
}
// the stone, a tower a step, with pause() awaited between the steps
export async function layStoneIn(G, rngFor, pause) {
  const it = stoneSteps(G, rngFor); let s = it.next();
  while (!s.done) { await pause(); s = it.next(); }
}
