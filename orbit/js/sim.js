// Pocket Orbit — the physics, the missions and the scoring, with no DOM.
//
// Units keep the numbers small: the planet's radius is 1 and its gravitational
// parameter GM is 1, so a circular orbit at radius r has speed 1/√r and takes
// 2π·r^1.5 to go round. The page converts for display: one unit of length is
// 800 km, one unit of speed 2 km/s (so low orbit is 240 km up at 1.75 km/s).
//
// Everything that moves on rails — the moon and the stations — is on a
// circular orbit worked out from the clock, so it is exactly where it should
// be at any time and costs nothing to look ahead. Only the ship is integrated
// (RK4, with steps that shrink near whatever is pulling hardest), and the same
// integrator draws the predicted path, so what you see is what you will fly.

export const MU = 1;
export const R_PLANET = 1;
export const R_ATM = 1.12;          // top of the atmosphere: below it the ship burns up
export const ESCAPE_R = 40;         // past here it is lost to deep space
export const THRUST = 0.15;         // full-throttle acceleration
export const FINE = 0.2;            // fine throttle, as a share of full
export const DOCK_DIST = 0.05;      // the station's tractor beam reaches this far…
export const DOCK_SPEED = 0.03;     // …and holds a ship drifting slower than this
export const KM = 800;              // one unit of length, in km
export const MS = 2000;             // one unit of speed, in m/s

export const MOON = { a: 10, mu: 0.012, radius: 0.27 };
// Sphere of influence: inside it the moon's pull is the one that matters, so
// prograde, retrograde, apoapsis and periapsis are all measured from the moon.
export const SOI = MOON.a * Math.pow(MOON.mu / MU, 0.4);

const TAU = Math.PI * 2;
const rad = (deg) => deg * Math.PI / 180;

/* ── Missions ────────────────────────────────────────────────────────────
   `ship` is where you start: on a circular orbit (`circular`, `angle` in
   degrees), docked at a station, or a free state (`r`, `angle`, and radial
   and tangential speed `vr`, `vt`). `dv` is the fuel, as the change of speed
   it can buy. `stars` are the Δv you may spend for two and three stars; one
   star is just finishing. They were set by flying each mission with the
   autopilot in pilot.js (tests.html checks it still earns three stars on
   every one, with fuel to spare). All orbits run anticlockwise. */
export const LEVELS = [
    {
        id: 'first', name: 'First Orbit',
        blurb: 'The booster has fallen away and you are coasting upward, but not fast enough to stay up. Lift your lowest point clear of the air before you come back down.',
        tips: [
            'Your path is the dotted line. Where it dips into the haze, you burn up.',
            'Warp to apoapsis (Ap), the top of the arc, then hold Prograde. Burning at the highest point lifts the lowest one.',
        ],
        ship: { r: 1.2, angle: 210, vr: 0.35, vt: 0.8 },
        dv: 0.45, stars: [0.22, 0.16],
        stations: [],
        goals: [{ type: 'orbit', peMin: 1.1875, text: 'Raise your periapsis above 150 km' }],
    },
    {
        id: 'higher', name: 'Higher Ground',
        blurb: 'Comms want you up at 1,600 km. Two burns get you there: one to stretch the orbit out, one at the far end to round it off.',
        tips: [
            'Burn prograde until the Ap marker reads about 1,600 km. That stretches the far side of your orbit.',
            'Warp to Ap and burn prograde again to lift the near side to match. That is a Hohmann transfer.',
        ],
        ship: { circular: 1.3, angle: 250 },
        dv: 0.6, stars: [0.42, 0.34],
        stations: [],
        goals: [{ type: 'orbit', peMin: 2.8, apMax: 3.2, text: 'Hold an orbit between 1,440 and 1,760 km' }],
    },
    {
        id: 'depot', name: 'Catch the Depot',
        blurb: 'The fuel depot shares your orbit, a little way ahead. Flying at it only lifts you above it and you fall behind. To catch up, slow down.',
        tips: [
            'A lower orbit is a faster one. Burn retrograde a little and you drop inside the Depot and gain on it.',
            'Watch the two ghosts: they mark where you and the Depot will be at your closest. Tune the burn until they meet.',
            'Near the Depot, Match kills your speed relative to it and Approach nudges you in. Dock under 60 m/s.',
        ],
        ship: { circular: 1.6, angle: 300 },
        dv: 0.35, stars: [0.18, 0.12],
        stations: [{ id: 'depot', name: 'Depot', a: 1.6, phase: 350, color: '#e3a33a' }],
        goals: [{ type: 'dock', station: 'depot', text: 'Dock with the Depot' }],
    },
    {
        id: 'ring', name: 'Up to the Ring',
        blurb: 'Ring Station is in a high orbit, and it is moving. Leave at the right moment and the Ring arrives at the top of your transfer when you do.',
        tips: [
            'Set Ring Station as your target and burn prograde until your Ap touches its orbit. If the ghosts are far apart, undo with retrograde and wait.',
            'The Ring should lead you by a bit under a quarter turn when you leave. Warp until it does.',
            'At Ap, Match rounds your orbit off and stops you beside it in one go.',
        ],
        ship: { circular: 1.3, angle: 200 },
        dv: 0.65, stars: [0.38, 0.29],
        stations: [{ id: 'ring', name: 'Ring Station', a: 2.6, phase: 120, color: '#7fb8a4' }],
        goals: [{ type: 'dock', station: 'ring', text: 'Dock with Ring Station' }],
    },
    {
        id: 'yard', name: 'Down to the Yard',
        blurb: 'The shipyard is far below you and lapping you every few hours. Going down works the same way as going up, only backwards.',
        tips: [
            'Burn retrograde to drop your periapsis onto the Yard’s orbit.',
            'The Yard is faster than you, so it has to be behind you when you leave.',
        ],
        ship: { circular: 3.2, angle: 90 },
        dv: 0.65, stars: [0.37, 0.28],
        stations: [{ id: 'yard', name: 'Shipyard', a: 1.5, phase: 300, color: '#c98b6b' }],
        goals: [{ type: 'dock', station: 'yard', text: 'Dock with the Shipyard' }],
    },
    {
        id: 'milk', name: 'Milk Run',
        blurb: 'A delivery round. You are docked at the Hub with a hold full of coffee for Farside. Farside has mail for Lowdock. Fire any engine to undock.',
        tips: [
            'Any burn undocks you. Your target is always your next stop.',
            'Low orbits are fast and high ones slow, so the wait for a good departure changes from leg to leg.',
        ],
        ship: { docked: 'hub' },
        dv: 1.1, stars: [0.62, 0.48],
        stations: [
            { id: 'hub', name: 'Hub', a: 2.0, phase: 0, color: '#a3bf63' },
            { id: 'far', name: 'Farside', a: 3.2, phase: 140, color: '#7fb8a4' },
            { id: 'low', name: 'Lowdock', a: 1.4, phase: 250, color: '#e3a33a' },
        ],
        goals: [
            { type: 'dock', station: 'far', text: 'Deliver the coffee to Farside' },
            { type: 'dock', station: 'low', text: 'Take Farside’s mail down to Lowdock' },
        ],
    },
    {
        id: 'moon', name: 'Moonshot',
        blurb: 'The Moon is ten planet-widths out and pulls on you the closer you get. Get there, then brake hard enough that it keeps you.',
        tips: [
            'Burn prograde until your path reaches the Moon’s orbit, timed so the Moon is there when you are. The ghost Moon shows where it will be.',
            'Swing past in front of the Moon, at a low periapsis. Inside its pull (the faint circle) prograde and retrograde are measured against the Moon.',
            'At periapsis, burn retrograde until your Ap around the Moon stays inside its circle.',
        ],
        ship: { circular: 1.3, angle: 0 },
        moon: { phase: 140 },
        dv: 0.9, stars: [0.62, 0.5],
        stations: [],
        goals: [{ type: 'capture', peMin: 0.35, apMax: 1.3, text: 'Get into orbit around the Moon' }],
    },
    {
        id: 'free', name: 'Free Flight', free: true,
        blurb: 'No mission and no fuel gauge. Every station in the system and one around the Moon. Go and see them.',
        tips: ['Tap a station to make it your target.'],
        ship: { circular: 1.3, angle: 0 },
        moon: { phase: 60 },
        dv: Infinity, stars: [0, 0],
        stations: [
            { id: 'low', name: 'Lowdock', a: 1.4, phase: 250, color: '#e3a33a' },
            { id: 'hub', name: 'Hub', a: 2.0, phase: 0, color: '#a3bf63' },
            { id: 'ring', name: 'Ring Station', a: 2.6, phase: 120, color: '#7fb8a4' },
            { id: 'far', name: 'Farside', a: 4.5, phase: 200, color: '#c98b6b' },
            { id: 'gate', name: 'Gateway', a: 0.6, phase: 0, parent: 'moon', color: '#e07a6a' },
        ],
        goals: [],
    },
];

/* ── Things on rails ─────────────────────────────────────────────────── */

/** Position and velocity on a circular, anticlockwise orbit. */
export function circular(a, phase, mu, t) {
    const n = Math.sqrt(mu / (a * a * a));
    const th = phase + n * t;
    const v = Math.sqrt(mu / a);
    const c = Math.cos(th), s = Math.sin(th);
    return { x: a * c, y: a * s, vx: -v * s, vy: v * c };
}

export function moonState(world, t) {
    return circular(MOON.a, world.moon.phase, MU, t);
}

export function stationState(world, st, t) {
    if (st.parent !== 'moon') return circular(st.a, st.phase, MU, t);
    const m = moonState(world, t);
    const s = circular(st.a, st.phase, MOON.mu, t);
    return { x: m.x + s.x, y: m.y + s.y, vx: m.vx + s.vx, vy: m.vy + s.vy };
}

/** Where a target (a station, or the string 'moon') is at time t. */
export function targetState(world, target, t) {
    return target === 'moon' ? moonState(world, t) : stationState(world, target, t);
}

/* ── The integrator ──────────────────────────────────────────────────── */

const acc = { x: 0, y: 0 };
function gravity(world, x, y, t) {
    const r2 = x * x + y * y;
    const r3 = r2 * Math.sqrt(r2);
    acc.x = -MU * x / r3;
    acc.y = -MU * y / r3;
    if (world.moon) {
        const th = world.moon.phase + world.moon.n * t;
        const dx = x - MOON.a * Math.cos(th), dy = y - MOON.a * Math.sin(th);
        const d2 = dx * dx + dy * dy;
        const d3 = d2 * Math.sqrt(d2);
        acc.x -= MOON.mu * dx / d3;
        acc.y -= MOON.mu * dy / d3;
    }
    return acc;
}

/** A step size that gives about six hundred steps per orbit, around whichever body is closer. */
export function stepSize(world, s, t) {
    const r = Math.hypot(s.x, s.y);
    let h = 0.01 * r * Math.sqrt(r);
    if (world.moon) {
        const th = world.moon.phase + world.moon.n * t;
        const d = Math.hypot(s.x - MOON.a * Math.cos(th), s.y - MOON.a * Math.sin(th));
        h = Math.min(h, 0.01 * d * Math.sqrt(d / MOON.mu));
    }
    return Math.min(h, 0.5);
}

/** One RK4 step of length h, in place, with a constant thrust (tx, ty) on top of gravity. */
export function rk4(world, s, t, h, tx = 0, ty = 0) {
    const { x, y, vx, vy } = s;
    let a = gravity(world, x, y, t);
    const k1vx = a.x + tx, k1vy = a.y + ty;
    const k1x = vx, k1y = vy;
    a = gravity(world, x + k1x * h / 2, y + k1y * h / 2, t + h / 2);
    const k2vx = a.x + tx, k2vy = a.y + ty;
    const k2x = vx + k1vx * h / 2, k2y = vy + k1vy * h / 2;
    a = gravity(world, x + k2x * h / 2, y + k2y * h / 2, t + h / 2);
    const k3vx = a.x + tx, k3vy = a.y + ty;
    const k3x = vx + k2vx * h / 2, k3y = vy + k2vy * h / 2;
    a = gravity(world, x + k3x * h, y + k3y * h, t + h);
    const k4vx = a.x + tx, k4vy = a.y + ty;
    const k4x = vx + k3vx * h, k4y = vy + k3vy * h;
    s.x = x + (k1x + 2 * k2x + 2 * k3x + k4x) * h / 6;
    s.y = y + (k1y + 2 * k2y + 2 * k3y + k4y) * h / 6;
    s.vx = vx + (k1vx + 2 * k2vx + 2 * k3vx + k4vx) * h / 6;
    s.vy = vy + (k1vy + 2 * k2vy + 2 * k3vy + k4vy) * h / 6;
    return s;
}

/**
 * Coast from state s at time t for `dur`, calling `each(s, t)` after every
 * step; `each` returning a string stops the coast and is returned. Also stops
 * on reentry, a moon impact or escape, returning 'crash', 'moon' or 'escape'.
 */
export function coast(world, s, t, dur, each = null) {
    const end = t + dur;
    while (t < end - 1e-12) {
        const h = Math.min(stepSize(world, s, t), end - t);
        rk4(world, s, t, h);
        t += h;
        const why = hazard(world, s, t);
        if (why) return why;
        if (each) {
            const stop = each(s, t);
            if (stop) return stop;
        }
    }
    return null;
}

function hazard(world, s, t) {
    const r2 = s.x * s.x + s.y * s.y;
    if (r2 < R_ATM * R_ATM) return 'crash';
    if (r2 > ESCAPE_R * ESCAPE_R) return 'escape';
    if (world.moon) {
        const th = world.moon.phase + world.moon.n * t;
        const dx = s.x - MOON.a * Math.cos(th), dy = s.y - MOON.a * Math.sin(th);
        if (dx * dx + dy * dy < MOON.radius * MOON.radius) return 'moon';
    }
    return null;
}

/* ── Orbits ──────────────────────────────────────────────────────────── */

/**
 * Orbital elements of a state relative to a body with parameter mu: periapsis
 * and apoapsis radius (ra is Infinity on an escape path), eccentricity, the
 * direction of periapsis, and the time to the next periapsis and apoapsis
 * (null when there isn't one).
 */
export function elements(x, y, vx, vy, mu = MU) {
    const r = Math.hypot(x, y);
    const v2 = vx * vx + vy * vy;
    const h = x * vy - y * vx;
    const energy = v2 / 2 - mu / r;
    const rv = x * vx + y * vy;
    const ex = ((v2 - mu / r) * x - rv * vx) / mu;
    const ey = ((v2 - mu / r) * y - rv * vy) / mu;
    const e = Math.hypot(ex, ey);
    const p = h * h / mu;
    const rp = p / (1 + e);
    const bound = energy < 0 && e < 1;
    const ra = bound ? p / (1 - e) : Infinity;
    const a = bound ? (rp + ra) / 2 : -mu / (2 * energy);
    const argPe = e > 1e-9 ? Math.atan2(ey, ex) : Math.atan2(y, x);
    const dir = h >= 0 ? 1 : -1;
    let nu = (Math.atan2(y, x) - argPe) * dir;
    nu = ((nu % TAU) + TAU) % TAU;
    let period = Infinity, tPe = null, tAp = null;
    if (bound) {
        const n = Math.sqrt(mu / (a * a * a));
        period = TAU / n;
        let E = 2 * Math.atan(Math.sqrt((1 - e) / (1 + e)) * Math.tan(nu / 2));
        let M = E - e * Math.sin(E);
        M = ((M % TAU) + TAU) % TAU;
        tPe = (TAU - M) / n;
        tAp = (((Math.PI - M) % TAU) + TAU) % TAU / n;
    } else if (rv < 0 && e > 1) {
        // Still falling in on an escape path: periapsis is ahead.
        const nuS = nu > Math.PI ? nu - TAU : nu;
        const F = 2 * Math.atanh(Math.sqrt((e - 1) / (e + 1)) * Math.tan(nuS / 2));
        const M = e * Math.sinh(F) - F;
        const n = Math.sqrt(mu / Math.pow(-a, 3));
        tPe = -M / n;
    }
    return { r, rp, ra, a, e, h, energy, argPe, dir, period, tPe, tAp, bound };
}

export const circularSpeed = (r, mu = MU) => Math.sqrt(mu / r);

/** Speed needed at radius r to reach radius rOther at the far side of the orbit (vis-viva at an apsis). */
export const apsisSpeed = (r, rOther, mu = MU) => Math.sqrt(2 * mu * rOther / (r * (r + rOther)));

/* ── The game ────────────────────────────────────────────────────────── */

export function createWorld(level) {
    const world = {
        moon: level.moon ? { phase: rad(level.moon.phase), n: Math.sqrt(MU / MOON.a ** 3) } : null,
        stations: level.stations.map((s) => ({ ...s, phase: rad(s.phase) })),
    };
    return world;
}

export function createGame(level) {
    const world = createWorld(level);
    const g = {
        level, world, t: 0,
        ship: { x: 0, y: 0, vx: 0, vy: 0 },
        dvUsed: 0,
        goalIndex: 0,
        docked: null,           // id of the station we are docked at
        undockedFrom: null,     // ignored by its tractor beam until we drift clear
        visited: new Set(),
        status: 'flying',       // 'flying' | 'won' | 'crash' | 'moon' | 'escape'
        events: [],
        burning: null,          // the direction of the last thrust, for drawing
        empty: false,
    };
    const sh = level.ship;
    if (sh.docked) {
        g.docked = sh.docked;
        g.visited.add(sh.docked);
        Object.assign(g.ship, stationState(world, station(g, sh.docked), 0));
    } else if (sh.circular) {
        Object.assign(g.ship, circular(sh.circular, rad(sh.angle), MU, 0));
    } else {
        const th = rad(sh.angle), c = Math.cos(th), s = Math.sin(th);
        g.ship = { x: sh.r * c, y: sh.r * s, vx: sh.vr * c - sh.vt * s, vy: sh.vr * s + sh.vt * c };
    }
    return g;
}

export const station = (g, id) => g.world.stations.find((s) => s.id === id) || null;
export const fuelLeft = (g) => Math.max(0, g.level.dv - g.dvUsed);
export const goal = (g) => g.level.goals[g.goalIndex] || null;

/** The target your burns and markers are measured against: the current goal's station, or the moon. */
export function goalTarget(g) {
    const G = goal(g);
    if (!G) return null;
    if (G.type === 'dock') return station(g, G.station);
    if (G.type === 'capture') return 'moon';
    return null;
}

/** The body the ship is mostly falling around: the moon inside its sphere of influence, otherwise the planet. */
export function reference(g, s = g.ship, t = g.t) {
    if (g.world.moon) {
        const m = moonState(g.world, t);
        if (Math.hypot(s.x - m.x, s.y - m.y) < SOI) return { body: 'moon', mu: MOON.mu, ...m };
    }
    return { body: 'planet', mu: MU, x: 0, y: 0, vx: 0, vy: 0 };
}

/** Elements of the ship's orbit around its reference body. */
export function shipOrbit(g) {
    const ref = reference(g);
    const s = g.ship;
    return { ref, ...elements(s.x - ref.x, s.y - ref.y, s.vx - ref.vx, s.vy - ref.vy, ref.mu) };
}

/**
 * Unit vector for a burn. Directions are the ones a pilot names: prograde and
 * retrograde along the velocity, radial out and in square to it (away from or
 * towards the body), match against the velocity relative to the target, and
 * approach straight at the target. `vec` is a raw direction, for the autopilot.
 */
export function burnDir(g, cmd, target) {
    const s = g.ship;
    if (cmd.vec) {
        const l = Math.hypot(cmd.vec.x, cmd.vec.y);
        return l > 1e-12 ? { x: cmd.vec.x / l, y: cmd.vec.y / l } : null;
    }
    if (cmd.dir === 'match' || cmd.dir === 'approach') {
        if (!target) return null;
        const T = targetState(g.world, target, g.t);
        const dx = cmd.dir === 'match' ? T.vx - s.vx : T.x - s.x;
        const dy = cmd.dir === 'match' ? T.vy - s.vy : T.y - s.y;
        const l = Math.hypot(dx, dy);
        return l > 1e-9 ? { x: dx / l, y: dy / l } : null;
    }
    const ref = reference(g);
    const vx = s.vx - ref.vx, vy = s.vy - ref.vy;
    const v = Math.hypot(vx, vy) || 1;
    const px = vx / v, py = vy / v;
    if (cmd.dir === 'pro') return { x: px, y: py };
    if (cmd.dir === 'retro') return { x: -px, y: -py };
    // Radial: the part of "away from the body" that is square to the velocity.
    let rx = s.x - ref.x, ry = s.y - ref.y;
    const along = rx * px + ry * py;
    rx -= along * px; ry -= along * py;
    const rl = Math.hypot(rx, ry);
    if (rl < 1e-9) { rx = -py; ry = px; } else { rx /= rl; ry /= rl; }
    if (cmd.dir === 'out') return { x: rx, y: ry };
    if (cmd.dir === 'in') return { x: -rx, y: -ry };
    return null;
}

const MAX_BURN_STEP = 0.02;

/**
 * Advance the game by dt. `cmd` is the burn held for the whole of it, or null
 * to coast: { dir, fine?, maxDv?, vec?, target? }. `maxDv` stops the burn
 * after that much Δv, so a planned burn comes out exact; `target` overrides the
 * goal's for match and approach. Returns the Δv spent.
 */
export function step(g, dt, cmd = null) {
    if (g.status !== 'flying' || dt <= 0) return 0;
    const target = (cmd && cmd.target) || goalTarget(g);
    let thrust = !!(cmd && (cmd.dir || cmd.vec)) && fuelLeft(g) > 0 && (cmd.maxDv == null || cmd.maxDv > 0);
    g.burning = null;
    if (g.docked) {
        if (!thrust) {
            g.t += dt;
            Object.assign(g.ship, stationState(g.world, station(g, g.docked), g.t));
            return 0;
        }
        g.undockedFrom = g.docked;
        g.docked = null;
        g.events.push({ type: 'undock' });
    }
    let spent = 0;
    let left = dt;
    while (left > 1e-12 && g.status === 'flying') {
        let h = Math.min(left, stepSize(g.world, g.ship, g.t));
        let tx = 0, ty = 0;
        if (thrust) {
            h = Math.min(h, MAX_BURN_STEP);
            const d = burnDir(g, cmd, target);
            if (d) {
                let dv = THRUST * (cmd.fine ? FINE : 1) * h;
                dv = Math.min(dv, fuelLeft(g));
                if (cmd.maxDv != null) dv = Math.min(dv, cmd.maxDv - spent);
                if (cmd.dir === 'match') {
                    const T = targetState(g.world, target, g.t);
                    dv = Math.min(dv, Math.hypot(T.vx - g.ship.vx, T.vy - g.ship.vy));
                }
                dv = Math.max(0, dv);
                tx = d.x * dv / h; ty = d.y * dv / h;
                spent += dv;
                g.dvUsed += dv;
                g.burning = d;
                if (fuelLeft(g) <= 0 && !g.empty && Number.isFinite(g.level.dv)) {
                    g.empty = true;
                    g.events.push({ type: 'empty' });
                }
                if (fuelLeft(g) <= 0 || (cmd.maxDv != null && spent >= cmd.maxDv - 1e-12)) thrust = false;
            }
        }
        rk4(g.world, g.ship, g.t, h, tx, ty);
        g.t += h;
        left -= h;
        check(g);
    }
    return spent;
}

function check(g) {
    const why = hazard(g.world, g.ship, g.t);
    if (why) {
        g.status = why;
        g.events.push({ type: why });
        return;
    }
    // Docking: any station's tractor beam, slow enough.
    for (const st of g.world.stations) {
        const S = stationState(g.world, st, g.t);
        const d = Math.hypot(S.x - g.ship.x, S.y - g.ship.y);
        if (st.id === g.undockedFrom) {
            if (d > DOCK_DIST * 2) g.undockedFrom = null;
            continue;
        }
        if (d < DOCK_DIST && Math.hypot(S.vx - g.ship.vx, S.vy - g.ship.vy) < DOCK_SPEED) {
            g.docked = st.id;
            g.visited.add(st.id);
            Object.assign(g.ship, S);
            g.events.push({ type: 'dock', station: st.id });
            const G = goal(g);
            if (G && G.type === 'dock' && G.station === st.id) advance(g);
            return;
        }
    }
    const G = goal(g);
    if (!G) return;
    if (G.type === 'orbit') {
        const o = elements(g.ship.x, g.ship.y, g.ship.vx, g.ship.vy);
        if (o.bound && (G.peMin == null || o.rp >= G.peMin) && (G.apMax == null || o.ra <= G.apMax)) advance(g);
    } else if (G.type === 'capture') {
        const m = moonState(g.world, g.t);
        const o = elements(g.ship.x - m.x, g.ship.y - m.y, g.ship.vx - m.vx, g.ship.vy - m.vy, MOON.mu);
        if (o.bound && o.rp >= G.peMin && o.ra <= G.apMax) advance(g);
    }
}

function advance(g) {
    g.events.push({ type: 'goal', index: g.goalIndex, text: goal(g).text });
    g.goalIndex++;
    if (g.goalIndex >= g.level.goals.length) {
        g.status = 'won';
        g.events.push({ type: 'won', stars: stars(g.level, g.dvUsed) });
    }
}

/** 1 to 3 stars for finishing having spent dvUsed. */
export function stars(level, dvUsed) {
    return 1 + (dvUsed <= level.stars[0] + 1e-9 ? 1 : 0) + (dvUsed <= level.stars[1] + 1e-9 ? 1 : 0);
}

/* ── Looking ahead ───────────────────────────────────────────────────── */

/**
 * The ship's path if it coasts from now: points to draw, how it ends, and the
 * closest approach to `target` (a station or 'moon') along the way. Looks one
 * orbit ahead, or a little more with a target so a near miss on the next lap
 * still shows; a path that leaves the planet is followed until `maxTime`.
 */
export function predict(g, target = null, opts = {}) {
    if (g.docked) return null;
    const o = elements(g.ship.x, g.ship.y, g.ship.vx, g.ship.vy);
    const maxTime = opts.maxTime ?? 260;
    let dur = o.bound ? o.period * (target ? 1.5 : 1.02) : maxTime;
    if (g.world.moon && o.bound && o.ra > MOON.a - SOI) dur = Math.max(dur, 80);
    dur = Math.min(dur, maxTime);
    const s = { ...g.ship };
    const pts = [s.x, s.y];
    const times = [g.t];
    let closest = null;
    let steps = 0;
    const maxSteps = opts.maxSteps ?? 5000;
    const near = (st, t) => {
        if (!target) return;
        const T = targetState(g.world, target, t);
        const d = Math.hypot(T.x - st.x, T.y - st.y);
        if (!closest || d < closest.d) {
            closest = { d, t, ship: { x: st.x, y: st.y }, target: { x: T.x, y: T.y },
                rel: Math.hypot(T.vx - st.vx, T.vy - st.vy) };
        }
    };
    const look = (st, t) => {
        near(st, t);
        pts.push(st.x, st.y);
        times.push(t);
        return ++steps >= maxSteps ? 'steps' : null;
    };
    near(s, g.t);
    const end = coast(g.world, s, g.t, dur, look);
    if (end === 'crash' || end === 'moon' || end === 'escape') {
        pts.push(s.x, s.y);
        times.push(g.t + dur);
    }
    return { pts, times, end: end === 'steps' ? null : end, closest };
}
