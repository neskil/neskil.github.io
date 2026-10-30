// Pocket Orbit — an autopilot that flies the missions the textbook way, with
// no DOM. The page uses it for "Show me", narrating as it goes; tests.html
// uses it to prove every mission can be finished inside its three-star Δv.
//
// It only ever plans one burn ahead and then looks again once that burn is
// done, so a burn that came out a little long or short is mended by the next
// one instead of piling up. Burns are finite (the engine is not that strong),
// so each is centred on the moment an impulse would have happened.
//
//   const p = createPilot();
//   const { cmd, wakeAt, caption } = fly(p, game);
//
// `cmd` is what to hold for the next step, or null to coast; when coasting,
// nothing needs deciding before `wakeAt`, so a caller may warp up to it.

import {
    MU, MOON, THRUST, R_ATM, elements, apsisSpeed, stationState, moonState, coast,
    station, goal, fuelLeft,
} from './sim.js';

const TAU = Math.PI * 2;
const CIRC_E = 0.03;        // eccentricity below which an orbit counts as round
const TERMINAL = 0.35;      // inside this the pilot stops planning and steers in
const VMAX = 0.06;          // fastest it closes on a station…
const GAIN = 0.25;          // …slowing in proportion to the distance left
const DEADBAND = 0.006;     // velocity error it will put up with
const MOON_PE = 0.6;        // aimed periapsis around the moon
const MOON_AP = 0.8;        // apoapsis it brakes down to

const wrap = (a) => {
    a = ((a + Math.PI) % TAU + TAU) % TAU - Math.PI;
    return a;
};
const angle = (s) => Math.atan2(s.y, s.x);
const speed = (s) => Math.hypot(s.vx, s.vy);

export function createPilot() {
    return { queue: [], burn: null, stage: null };
}

/** What to do now. See the header. */
export function fly(p, g) {
    if (g.status !== 'flying') return { cmd: null, wakeAt: Infinity, caption: '' };
    if (p.burn) {
        const left = p.burn.end - g.dvUsed;
        if (left > 1e-9 && fuelLeft(g) > 0) {
            return { cmd: { dir: p.burn.dir, maxDv: left }, wakeAt: g.t, caption: p.burn.caption };
        }
        p.burn = null;
        if (p.afterBurn) { const f = p.afterBurn; p.afterBurn = null; f(); }
    }
    const next = p.queue[0];
    if (next) {
        if (closeToTarget(g)) {
            p.queue.length = 0;
        } else if (g.t >= next.t0 - 1e-9) {
            p.queue.shift();
            if (next.think) { next.think(); return fly(p, g); }
            p.burn = { dir: next.dir, end: g.dvUsed + next.dv, caption: next.caption };
            p.afterBurn = next.after || null;
            return fly(p, g);
        } else {
            return { cmd: null, wakeAt: next.t0, caption: next.wait };
        }
    }
    return plan(p, g);
}

function closeToTarget(g) {
    const G = goal(g);
    if (!G || G.type !== 'dock') return false;
    return near(g, station(g, G.station));
}

/**
 * Close enough to steer straight in: near the station and at its height. A
 * phasing orbit can pass right underneath a station, but at the wrong speed
 * and on its way somewhere else; that is not the time to brake.
 */
function near(g, st) {
    const T = stationState(g.world, st, g.t);
    const d = Math.hypot(T.x - g.ship.x, T.y - g.ship.y);
    return d < 0.08 || (d < TERMINAL && Math.abs(Math.hypot(g.ship.x, g.ship.y) - st.a) < 0.06);
}

/** Queue a burn of `dv` (signed: negative is retrograde) centred on time tc. */
function burnAt(p, g, tc, dv, caption, wait) {
    const half = Math.abs(dv) / (2 * THRUST);
    p.queue.push({
        t0: Math.max(g.t, tc - half), dir: dv >= 0 ? 'pro' : 'retro', dv: Math.abs(dv), caption, wait,
    });
}

function plan(p, g) {
    const G = goal(g);
    if (!G) return { cmd: null, wakeAt: Infinity, caption: '' };
    if (G.type === 'orbit') planOrbit(p, g, G);
    else if (G.type === 'dock') {
        const steer = planDock(p, g, G);
        if (steer) return steer;
    } else if (G.type === 'capture') planCapture(p, g, G);
    if (!p.queue.length) return { cmd: null, wakeAt: Infinity, caption: '' };
    return fly(p, g);
}

/* ── Changing orbit ── */

function orbitOf(g) {
    const s = g.ship;
    return elements(s.x, s.y, s.vx, s.vy);
}

function planOrbit(p, g, G) {
    const o = orbitOf(g);
    if (G.apMax == null) {
        // Only a floor under periapsis: lift it at the top of the arc.
        const vAp = Math.abs(o.h) / o.ra;
        const dv = apsisSpeed(o.ra, G.peMin + 0.03) - vAp;
        burnAt(p, g, g.t + o.tAp, dv, 'Burning prograde at apoapsis to lift periapsis', 'Coasting up to apoapsis');
        return;
    }
    orbitTo(p, g, (G.peMin + G.apMax) / 2);
}

/**
 * One burn towards a round orbit of radius rT: from a round orbit, stretch the
 * far side out (or in) to rT; from a stretched one, round it off at whichever
 * end is already nearest rT.
 */
function orbitTo(p, g, rT, label = '') {
    const o = orbitOf(g);
    if (o.e < CIRC_E) {
        const dv = apsisSpeed(o.r, rT) - speed(g.ship);
        burnAt(p, g, g.t + 0.05, dv,
            dv > 0 ? 'Burning prograde: stretching the far side of the orbit out' : 'Burning retrograde: dropping the far side of the orbit',
            '');
        return;
    }
    const atAp = Math.abs(o.ra - rT) < Math.abs(o.rp - rT);
    const r = atAp ? o.ra : o.rp;
    const dv = apsisSpeed(r, rT) - Math.abs(o.h) / r;
    burnAt(p, g, g.t + (atAp ? o.tAp : o.tPe), dv,
        `Rounding off the orbit at ${atAp ? 'apoapsis' : 'periapsis'}`,
        `Coasting to ${atAp ? 'apoapsis' : 'periapsis'}${label}`);
}

/* ── Rendezvous ── */

function planDock(p, g, G) {
    const st = station(g, G.station);
    const T = stationState(g.world, st, g.t);
    if (near(g, st)) return terminal(g, T);
    if (st.parent === 'moon') return null;
    const o = orbitOf(g);
    if (o.e > CIRC_E) { orbitTo(p, g, st.a, ` to meet ${st.name}`); return null; }
    if (Math.abs(o.r - st.a) < 0.08) { phase(p, g, st, T, o); return null; }
    hohmann(p, g, st, T, o);
    return null;
}

/**
 * Same orbit, wrong place: drop into a slightly faster orbit (or climb into a
 * slower one) for a whole number of laps, timed so the station is waiting when
 * you come back round. The fewest laps that keep you out of the air.
 */
function phase(p, g, st, T, o) {
    const r = o.r;
    const period = TAU * Math.pow(r, 1.5);
    const phi = wrap(angle(T) - angle(g.ship));
    let a = r;
    for (let k = 1; k <= 6; k++) {
        const Tph = period * (1 - phi / (TAU * k));
        a = Math.pow(Tph / TAU, 2 / 3);
        const other = 2 * a - r;
        if (other > R_ATM + 0.1 && other < 20) break;
    }
    const dv = Math.sqrt(MU * (2 / r - 1 / a)) - speed(g.ship);
    burnAt(p, g, g.t + 0.05, dv,
        phi > 0 ? `${st.name} is ahead: dropping lower to catch up` : `${st.name} is behind: climbing to let it catch up`, '');
}

/** Different orbit: wait until the station leads by the right angle, then a Hohmann transfer to its orbit. */
function hohmann(p, g, st, T, o) {
    const r1 = o.r, r2 = st.a;
    const at = (r1 + r2) / 2;
    const th = Math.PI * Math.pow(at, 1.5);
    const n1 = Math.sqrt(MU / r1 ** 3), n2 = Math.sqrt(MU / r2 ** 3);
    const need = Math.PI - n2 * th;
    const now = wrap(angle(T) - angle(g.ship));
    const rate = n2 - n1;
    const dv = apsisSpeed(r1, r2) - speed(g.ship);
    const P = TAU / Math.abs(rate);
    let w = (need - now) / rate;
    w = ((w % P) + P) % P;
    while (w < Math.abs(dv) / (2 * THRUST) + 0.05) w += P;
    const deg = Math.round(((need * 180 / Math.PI) % 360 + 360) % 360);
    burnAt(p, g, g.t + w, dv,
        `Transfer burn: ${dv > 0 ? 'up' : 'down'} to ${st.name}`,
        `Waiting for ${st.name} to ${need >= 0 ? `lead by ${deg}°` : `trail by ${360 - deg}°`}`);
}

/** Close in: aim for a closing speed that shrinks with distance, and burn off whatever differs. */
function terminal(g, T) {
    const dx = T.x - g.ship.x, dy = T.y - g.ship.y;
    const d = Math.hypot(dx, dy);
    const want = Math.min(VMAX, GAIN * d);
    const ex = dx / d * want - (g.ship.vx - T.vx);
    const ey = dy / d * want - (g.ship.vy - T.vy);
    const err = Math.hypot(ex, ey);
    const rel = Math.hypot(g.ship.vx - T.vx, g.ship.vy - T.vy);
    const caption = rel > 0.05 ? 'Matching speed with the station' : 'Closing in to dock';
    if (err < DEADBAND) return { cmd: null, wakeAt: g.t + 0.1, caption };
    return { cmd: { vec: { x: ex, y: ey }, maxDv: err }, wakeAt: g.t, caption };
}

/* ── The moon ── */

/** Coast a copy of the ship to its closest pass of the moon within `dur`. */
function moonPass(world, s, t, dur) {
    const c = { ...s };
    let best = { d: Infinity, t, rel: 0 };
    const end = coast(world, c, t, dur, (q, tq) => {
        const m = moonState(world, tq);
        const d = Math.hypot(q.x - m.x, q.y - m.y);
        if (d < best.d) best = { d, t: tq, rel: Math.hypot(q.vx - m.vx, q.vy - m.vy) };
        else if (best.d < 2 && d > best.d * 1.5) return 'past';
        return null;
    });
    if (end === 'crash' || end === 'moon' || end === 'escape') best.bad = end;
    return best;
}

function planCapture(p, g, G) {
    const o = orbitOf(g);
    if (!p.stage) {
        const tli = searchTLI(g, o);
        p.stage = 'tli';
        burnAt(p, g, tli.tc, tli.dv, 'Burning for the Moon', 'Waiting for the Moon to line up');
        p.queue[p.queue.length - 1].after = () => {
            p.stage = 'coast';
            p.queue.push({ t0: g.t + 18, think: () => midcourse(p, g), wait: 'Coasting out to the Moon' });
        };
        return;
    }
    if (p.stage === 'approach') {
        const pass = moonPass(g.world, g.ship, g.t, 60);
        const vNeed = apsisSpeed(pass.d, MOON_AP, MOON.mu);
        p.stage = 'brake';
        burnAt(p, g, pass.t, -(pass.rel - vNeed), 'Braking at periapsis: letting the Moon catch us', 'Falling towards the Moon');
    }
}

/** Search departure times and burn sizes for one that swings past the moon at about MOON_PE. */
function searchTLI(g, o) {
    const r1 = o.r;
    const v1 = speed(g.ship);
    const at = (r1 + MOON.a) / 2;
    const th = Math.PI * Math.pow(at, 1.5);
    const dv0 = apsisSpeed(r1, MOON.a) - v1;
    const n1 = Math.sqrt(MU / r1 ** 3), nm = g.world.moon.n;
    const need = Math.PI - nm * th;
    const now = wrap(angle(moonState(g.world, g.t)) - angle(g.ship));
    const rate = nm - n1;
    const P = TAU / Math.abs(rate);
    let w = ((need - now) / rate % P + P) % P;
    while (w < dv0 / (2 * THRUST) + 1) w += P;
    let best = null;
    for (let dt = -1; dt <= 1.0001; dt += 0.1) {
        const tc = g.t + w + dt;
        const s0 = { ...g.ship };
        coast(g.world, s0, g.t, tc - g.t);
        for (let f = 0.96; f <= 1.06; f += 0.0025) {
            const s = { ...s0 };
            const v = speed(s);
            s.vx += s.vx / v * dv0 * f;
            s.vy += s.vy / v * dv0 * f;
            const pass = moonPass(g.world, s, tc, th * 1.4);
            if (pass.bad || pass.d < MOON.radius + 0.15) continue;
            const score = Math.abs(pass.d - MOON_PE);
            if (!best || score < best.score) best = { score, tc, dv: dv0 * f };
        }
    }
    return best || { tc: g.t + w, dv: dv0 };
}

/** Halfway out: a small prograde or retrograde trim to put periapsis back on MOON_PE. */
function midcourse(p, g) {
    p.stage = 'approach';
    const first = moonPass(g.world, g.ship, g.t, 60);
    if (!first.bad && Math.abs(first.d - MOON_PE) < 0.05) return;
    let best = null;
    for (let dv = -0.02; dv <= 0.02001; dv += 0.0005) {
        const s = { ...g.ship };
        const v = speed(s);
        s.vx += s.vx / v * dv;
        s.vy += s.vy / v * dv;
        const pass = moonPass(g.world, s, g.t, 60);
        if (pass.bad || pass.d < MOON.radius + 0.15) continue;
        const score = Math.abs(pass.d - MOON_PE) + Math.abs(dv) * 2;
        if (!best || score < best.score) best = { score, dv };
    }
    if (best && Math.abs(best.dv) > 1e-4) burnAt(p, g, g.t + 0.05, best.dv, 'Course correction', '');
}
