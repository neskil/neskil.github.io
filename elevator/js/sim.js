// Tiny Elevator Tycoon — the building, the people and the cars, with no DOM.
//
// A day is a fixed list of arrivals drawn from the level's seed before the
// cars move at all, so the only thing that changes between two runs of a
// level is the rules you gave the cars. That is what makes it a puzzle rather
// than a dice roll: if your score went up, your rules got better.

export const STEP = 0.1;           // seconds per tick
export const FLOOR_TIME = 1.25;    // seconds to travel one floor
export const DOOR_TIME = 1.6;      // doors open, dwell, close
export const BOARD_TIME = 0.35;    // each person stepping on or off
export const STOP_TIME = 0.8;      // slowing down and starting up again at a stop

/* ── Levels ──────────────────────────────────────────────────────────────
   `traffic` names a pattern of who wants to go where; `rate` is people per
   second; `day` is how many seconds people keep arriving for. `stars` are the
   average-wait thresholds (seconds) for two and three stars — one star is
   just getting through the day with few enough people giving up. They were
   set by running every combination of rules against each level (see
   tests.html, which checks every level is still winnable at three stars). */
export const LEVELS = [
    {
        id: 'quiet', name: 'Quiet Tuesday', floors: 6, cars: 1, capacity: 6,
        traffic: 'mixed', rate: 0.16, day: 150, patience: 70, seed: 11,
        blurb: 'One car, six floors, not much going on. Learn the buttons.',
        stars: [18, 9], maxGaveUp: 0.1,
    },
    {
        id: 'morning', name: 'Morning Rush', floors: 10, cars: 2, capacity: 8,
        traffic: 'morning', rate: 0.42, day: 150, patience: 60, seed: 22,
        blurb: 'Everyone arrives at the lobby at once and wants to go up.',
        stars: [22, 17], maxGaveUp: 0.1,
    },
    {
        id: 'lunch', name: 'Lunch Break', floors: 10, cars: 2, capacity: 8,
        traffic: 'lunch', rate: 0.36, day: 150, patience: 60, seed: 33,
        blurb: 'Down for food, back up again, and a few visiting colleagues.',
        stars: [14, 6], maxGaveUp: 0.1,
    },
    {
        id: 'evening', name: 'Five O’Clock', floors: 12, cars: 3, capacity: 8,
        traffic: 'evening', rate: 0.55, day: 150, patience: 60, seed: 44,
        blurb: 'Twelve floors of people who would all like to go home now.',
        stars: [20, 12], maxGaveUp: 0.1,
    },
    {
        id: 'party', name: 'Rooftop Party', floors: 12, cars: 2, capacity: 8,
        traffic: 'party', rate: 0.4, day: 160, patience: 70, seed: 55,
        blurb: 'Guests arrive for the party on the top floor; some leave early.',
        stars: [16, 10.5], maxGaveUp: 0.1,
    },
    {
        id: 'chaos', name: 'Everything, Everywhere', floors: 15, cars: 3, capacity: 10,
        traffic: 'mixed', rate: 0.6, day: 160, patience: 60, seed: 66,
        blurb: 'Fifteen floors, three cars, and nobody agrees where to go.',
        stars: [18, 12.5], maxGaveUp: 0.1,
    },
];

/* ── The rules a car can be given ── */
export const RULES = {
    strategy: [
        ['oldest', 'Oldest first', 'Fetch whoever has waited longest, then take them where they are going.'],
        ['nearest', 'Nearest call', 'Go to the closest floor anyone wants, any direction.'],
        ['collective', 'Sweep', 'Keep going one way, collecting everyone going that way, then turn round.'],
    ],
    zone: [
        ['all', 'All floors', 'Serve the whole building.'],
        ['low', 'Low floors', 'Lobby and the lower half only.'],
        ['high', 'High floors', 'Lobby and the upper half only — an express.'],
    ],
    park: [
        ['stay', 'Stay put', 'When there is nothing to do, wait where it stopped.'],
        ['lobby', 'Lobby', 'When there is nothing to do, go back down to the lobby.'],
        ['spread', 'Spread out', 'Each idle car waits at its own share of the building.'],
    ],
};

export function defaultRules(level) {
    return {
        share: false,
        cars: Array.from({ length: level.cars }, () => ({ strategy: 'oldest', zone: 'all', park: 'stay' })),
    };
}

export function mulberry32(seed) {
    let a = seed >>> 0;
    return function () {
        a = (a + 0x6D2B79F5) >>> 0;
        let t = a;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

/* ── Arrivals ──
   Exponential gaps for a Poisson stream, and a from/to picked per pattern. */
export function arrivals(level) {
    const rng = mulberry32(level.seed);
    const F = level.floors;
    const upper = () => 1 + Math.floor(rng() * (F - 1));
    const any = () => Math.floor(rng() * F);
    const out = [];
    let t = 1;
    let id = 0;
    while (t < level.day) {
        let from, to;
        const r = rng();
        const phase = t / level.day;
        switch (level.traffic) {
            case 'morning':
                if (r < 0.85) { from = 0; to = upper(); } else { from = upper(); to = any(); }
                break;
            case 'evening':
                if (r < 0.85) { from = upper(); to = 0; } else { from = any(); to = upper(); }
                break;
            case 'lunch':
                if (r < 0.4) { from = upper(); to = 0; }
                else if (r < 0.8) { from = 0; to = upper(); }
                else { from = upper(); to = upper(); }
                break;
            case 'party': {
                const top = F - 1;
                // Arrivals first, departures building through the evening.
                if (r < 0.75 - phase * 0.6) { from = 0; to = top; }
                else if (r < 0.95 - phase * 0.3) { from = top; to = 0; }
                else { from = upper(); to = any(); }
                break;
            }
            default:
                if (r < 0.3) { from = 0; to = upper(); }
                else if (r < 0.6) { from = upper(); to = 0; }
                else { from = upper(); to = upper(); }
        }
        if (from !== to) out.push({ id: id++, t: Math.round(t * 10) / 10, from, to });
        t += -Math.log(1 - rng()) / level.rate;
    }
    return out;
}

/* ── The building ── */
export function serves(level, zone, floor) {
    if (zone === 'all' || floor === 0) return true;
    const mid = Math.floor((level.floors - 1) / 2);
    return zone === 'low' ? floor <= mid : floor > mid;
}

export function createSim(level, rules) {
    const cars = rules.cars.map((r, i) => ({
        i,
        rules: { ...r },
        pos: 0,               // floors, fractional while moving
        dir: 0,               // -1, 0, 1: which way it means to go
        state: 'idle',        // idle | moving | doors
        target: null,         // floor it is heading for
        stopping: false,      // will open doors at target (false = just parking)
        timer: 0,
        riders: [],
        moved: 0,             // floors travelled, for the tally
    }));
    return {
        level,
        rules: { share: !!rules.share },
        t: 0,
        cars,
        pending: arrivals(level),  // not yet arrived
        next: 0,
        waiting: [],               // people at hall stops
        done: [],                  // delivered
        gaveUp: [],                // took the stairs
        events: [],                // for the page: arrivals, deliveries, give-ups
    };
}

function passengerDir(p) { return p.to > p.from ? 1 : -1; }

function canTake(sim, car, p) {
    return serves(sim.level, car.rules.zone, p.from) && serves(sim.level, car.rules.zone, p.to);
}

/** Floors this car has been asked to go to by people inside it. */
function carCalls(car) {
    return car.riders.map(p => p.to);
}

/** Waiting people this car could serve, minus those another car has claimed. */
function hallFor(sim, car) {
    return sim.waiting.filter(p => canTake(sim, car, p) && (!sim.rules.share || p.claim == null || p.claim === car.i));
}

function full(sim, car) { return car.riders.length >= sim.level.capacity; }

/* ── Choosing the next stop ── */
/* "Ahead" for a car means floors it can still stop at going that way. A
   standing car's own floor is not ahead of it; a moving car's next floor is,
   even if it is nearly there — rounding the position instead had a car at
   2.96 going up sail past a rider's stop at 3. */
function aheadOf(car, d) {
    const moving = car.state === 'moving';
    if (d > 0) {
        const from = moving ? Math.ceil(car.pos - 1e-6) : Math.round(car.pos) + 1;
        return (f) => f >= from;
    }
    const from = moving ? Math.floor(car.pos + 1e-6) : Math.round(car.pos) - 1;
    return (f) => f <= from;
}

function decide(sim, car) {
    const here = Math.round(car.pos);
    const standing = car.state !== 'moving';
    const calls = carCalls(car);
    const hall = full(sim, car) ? [] : hallFor(sim, car);
    const s = car.rules.strategy;
    let target = null;
    let dir = car.dir;

    if (s === 'collective') {
        // Sweep: next stop ahead in the current direction for a rider, or for
        // someone waiting who is going the same way; failing that, the
        // farthest person ahead going the other way (where we turn round).
        const pick = (d) => {
            const ahead = aheadOf(car, d);
            const stops = calls.filter(ahead).concat(hall.filter(p => ahead(p.from) && passengerDir(p) === d).map(p => p.from));
            if (stops.length) return d > 0 ? Math.min(...stops) : Math.max(...stops);
            const turn = hall.filter(p => ahead(p.from)).map(p => p.from);
            if (turn.length) return d > 0 ? Math.max(...turn) : Math.min(...turn);
            return null;
        };
        // Standing with someone right here going our way (or any way, if we
        // have no riders): open up before going anywhere. A standing car's own
        // floor is not "ahead" of it, so without this a car parked at the
        // lobby never lets the lobby on.
        const atHere = standing ? hall.filter(p => p.from === here && (!dir || !car.riders.length || passengerDir(p) === dir)) : [];
        if (atHere.length) {
            car.target = here;
            car.stopping = true;
            if (!dir || !car.riders.length) car.dir = passengerDir(atHere.reduce((a, b) => (b.t < a.t ? b : a)));
            claim(sim, car, here);
            return true;
        }
        if (!dir) {
            // Idle: head for whoever is nearest and take their direction.
            const all = calls.concat(hall.map(p => p.from));
            if (all.length) {
                const f = nearestTo(here, all);
                dir = f === here ? (hall.find(p => p.from === here) ? passengerDir(hall.find(p => p.from === here)) : 0) : Math.sign(f - here);
            }
        }
        if (dir) {
            target = pick(dir);
            if (target == null) { dir = -dir; target = pick(dir); }
        }
    } else if (s === 'nearest') {
        const all = calls.concat(hall.map(p => p.from));
        if (all.length) target = nearestTo(here, all);
    } else {
        // Oldest first: riders are taken home in the order they got on;
        // otherwise fetch the longest-waiting person this car can take.
        if (car.riders.length) target = car.riders[0].to;
        else if (hall.length) target = hall.reduce((a, b) => (b.t < a.t ? b : a)).from;
    }

    if (target == null) return park(sim, car);

    // Drop riders off on the way whatever the strategy: nobody rides past
    // their own floor while the doors stay shut.
    const d = Math.sign(target - car.pos);
    if (d) {
        const ahead = aheadOf(car, d);
        const onWay = calls.filter(f => ahead(f) && (d > 0 ? f < target : f > target));
        if (onWay.length) target = d > 0 ? Math.min(...onWay) : Math.max(...onWay);
    }

    car.target = target;
    car.stopping = true;
    car.dir = target === here ? (dir || 0) : Math.sign(target - here);
    if (s === 'collective' && dir) car.dir = target === here ? dir : Math.sign(target - here);

    claim(sim, car, target);
    return true;
}

/** With sharing on, a car marks the people it is going to fetch so the other
    cars leave them be — and lets go of anyone it was fetching elsewhere. */
function claim(sim, car, target) {
    if (!sim.rules.share) return;
    for (const p of sim.waiting) {
        if (p.claim === car.i && p.from !== target) p.claim = null;
    }
    for (const p of sim.waiting) {
        if (p.from === target && p.claim == null && canTake(sim, car, p)) p.claim = car.i;
    }
}

function nearestTo(here, floors) {
    let best = floors[0];
    for (const f of floors) {
        if (Math.abs(f - here) < Math.abs(best - here) || (Math.abs(f - here) === Math.abs(best - here) && f < best)) best = f;
    }
    return best;
}

function park(sim, car) {
    car.dir = 0;
    const F = sim.level.floors;
    let home = null;
    if (car.rules.park === 'lobby') home = 0;
    else if (car.rules.park === 'spread') {
        // Share the building between the cars that serve it: car k of n waits
        // at the bottom of its own slice, so slice 0 waits at the lobby.
        const peers = sim.cars.filter(c => c.rules.park === 'spread' && c.rules.zone === car.rules.zone);
        const k = peers.indexOf(car);
        const lo = car.rules.zone === 'high' ? Math.floor((F - 1) / 2) + 1 : 0;
        const hi = car.rules.zone === 'low' ? Math.floor((F - 1) / 2) : F - 1;
        home = Math.round(lo + (hi - lo + 1) * k / peers.length);
    }
    // Comparing against the exact position, not a rounded one: a car that
    // re-plans at 0.48 on its way to the lobby is not at the lobby, and one
    // whose call vanished mid-trip must still finish at a real floor.
    if (home == null) {
        const dir = Math.sign((car.target ?? car.pos) - car.pos);
        home = dir > 0 ? Math.ceil(car.pos - 1e-9) : dir < 0 ? Math.floor(car.pos + 1e-9) : Math.round(car.pos);
    }
    if (Math.abs(home - car.pos) < 1e-9) {
        car.pos = home;
        car.state = 'idle';
        car.target = null;
        return false;
    }
    car.target = home;
    car.stopping = false;
    car.state = 'moving';
    return true;
}

/* ── Doors ── */
function openDoors(sim, car) {
    const f = Math.round(car.pos);
    car.pos = f;
    car.state = 'doors';
    let moved = 0;

    const staying = [];
    for (const p of car.riders) {
        if (p.to === f) {
            p.arrive = sim.t;
            sim.done.push(p);
            sim.events.push({ kind: 'arrive', p, car: car.i, floor: f });
            moved++;
        } else staying.push(p);
    }
    car.riders = staying;
    moved += board(sim, car, f);
    car.timer = DOOR_TIME + STOP_TIME + moved * BOARD_TIME;
}

/** Lets people at floor f on. A sweeping car only takes people going its way
    (after its riders are off, an empty one takes the way of whoever has
    waited longest); the others take anyone they can serve. */
function board(sim, car, f) {
    const here = sim.waiting.filter(p => p.from === f && canTake(sim, car, p) &&
        (!sim.rules.share || p.claim == null || p.claim === car.i));
    if (!here.length) return 0;
    let dir = null;
    if (car.rules.strategy === 'collective') {
        if (car.riders.length) dir = Math.sign(car.riders[0].to - f);
        else {
            const first = here.reduce((a, b) => (b.t < a.t ? b : a));
            // Keep sweeping the way it was going if anyone here goes that way.
            dir = car.dir && here.some(p => passengerDir(p) === car.dir) ? car.dir : passengerDir(first);
        }
        car.dir = dir;
    }
    let n = 0;
    here.sort((a, b) => a.t - b.t);
    for (const p of here) {
        if (full(sim, car)) break;
        if (dir != null && passengerDir(p) !== dir) continue;
        p.board = sim.t;
        p.car = car.i;
        car.riders.push(p);
        sim.waiting.splice(sim.waiting.indexOf(p), 1);
        sim.events.push({ kind: 'board', p, car: car.i, floor: f });
        n++;
    }
    return n;
}

/* ── One tick ── */
export function step(sim) {
    const dt = STEP;
    sim.t = Math.round((sim.t + dt) * 1000) / 1000;
    const L = sim.level;

    while (sim.next < sim.pending.length && sim.pending[sim.next].t <= sim.t) {
        const p = { ...sim.pending[sim.next++], claim: null };
        sim.waiting.push(p);
        sim.events.push({ kind: 'spawn', p, floor: p.from });
    }

    // Patience runs out: they take the stairs.
    for (let k = sim.waiting.length - 1; k >= 0; k--) {
        const p = sim.waiting[k];
        if (sim.t - p.t > L.patience) {
            sim.waiting.splice(k, 1);
            p.gaveUp = sim.t;
            sim.gaveUp.push(p);
            sim.events.push({ kind: 'stairs', p, floor: p.from });
        }
    }

    for (const car of sim.cars) {
        if (car.state === 'doors') {
            // Someone arriving at an open door gets on.
            const extra = board(sim, car, Math.round(car.pos));
            car.timer += extra * BOARD_TIME;
            car.timer -= dt;
            if (car.timer <= 0) {
                car.state = 'idle';
                car.target = null;
            }
            continue;
        }
        if (car.state === 'idle' || (car.state === 'moving' && !car.stopping)) {
            // Idle, or only parking: look for work every tick.
            const was = car.target;
            const working = decide(sim, car);
            if (working && car.stopping) car.state = 'moving';
            else if (!working && car.state !== 'moving') continue;
            if (was !== car.target && car.state === 'idle') car.state = 'moving';
        } else if (car.state === 'moving') {
            // Re-plan while moving, so a sweep picks up someone who pressed
            // the button just ahead of it — but never reverse mid-floor.
            const before = car.target;
            decide(sim, car);
            if (car.target == null) car.target = before;
            if (car.target !== before && Math.sign(car.target - car.pos) !== Math.sign(before - car.pos)) {
                car.target = before;
            }
        }
        if (car.target == null) { car.state = 'idle'; continue; }

        const delta = car.target - car.pos;
        const speed = dt / FLOOR_TIME;
        if (Math.abs(delta) <= speed + 1e-9) {
            car.moved += Math.abs(delta);
            car.pos = car.target;
            if (car.stopping) openDoors(sim, car);
            else { car.state = 'idle'; car.target = null; }
        } else {
            car.pos += Math.sign(delta) * speed;
            car.moved += speed;
            car.state = 'moving';
        }
    }
}

export function finished(sim) {
    return sim.next >= sim.pending.length && sim.waiting.length === 0 && sim.cars.every(c => c.riders.length === 0);
}

/** Runs the whole day with no drawing, as fast as it will go. A hard stop at
    three times the day, in case some set of rules strands somebody forever. */
export function runDay(level, rules) {
    const sim = createSim(level, rules);
    const limit = level.day * 3;
    while (!finished(sim) && sim.t < limit) step(sim);
    return score(sim);
}

export function score(sim) {
    const L = sim.level;
    const all = sim.done.length + sim.gaveUp.length + sim.waiting.length + sim.cars.reduce((n, c) => n + c.riders.length, 0);
    const waits = sim.done.map(p => p.board - p.t);
    const trips = sim.done.map(p => p.arrive - p.t);
    const avg = (xs) => xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0;
    // People still waiting or riding at the end count against you as if they
    // had given up: a day is not won by leaving someone in a lift.
    const lost = sim.gaveUp.length + sim.waiting.length + sim.cars.reduce((n, c) => n + c.riders.length, 0);
    const avgWait = avg(waits);
    let stars = 0;
    if (all > 0 && lost / all <= L.maxGaveUp) {
        stars = 1;
        if (avgWait <= L.stars[0]) stars = 2;
        if (avgWait <= L.stars[1] && lost === 0) stars = 3;
    }
    return {
        people: all,
        served: sim.done.length,
        gaveUp: lost,
        avgWait: Math.round(avgWait * 10) / 10,
        maxWait: Math.round(Math.max(0, ...waits) * 10) / 10,
        avgTrip: Math.round(avg(trips) * 10) / 10,
        floorsTravelled: Math.round(sim.cars.reduce((n, c) => n + c.moved, 0)),
        time: Math.round(sim.t),
        stars,
    };
}

/** Every combination of rules for a level (with the same rule set on cars
    that share a strategy family), for calibrating stars and for the tests. */
export function* allRules(level) {
    const S = RULES.strategy.map(r => r[0]);
    const Z = RULES.zone.map(r => r[0]);
    const P = RULES.park.map(r => r[0]);
    const zoneSets = level.cars === 1 ? [['all']] : level.cars === 2
        ? [['all', 'all'], ['low', 'high']]
        : [['all', 'all', 'all'], ['low', 'high', 'all'], ['low', 'high', 'high'], ['low', 'low', 'high']];
    for (const share of [false, true]) {
        for (const s of S) {
            for (const p of P) {
                for (const zs of zoneSets) {
                    yield { share, cars: zs.map(z => ({ strategy: s, zone: z, park: p })) };
                }
            }
        }
    }
}
