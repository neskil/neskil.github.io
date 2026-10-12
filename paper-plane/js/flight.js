// Paper Plane Glider — how a folded sheet flies. No DOM.
//
// A side-on glider model: lift and drag from the angle of attack, with a
// stall, and a pitching moment. None of the plane's numbers are dialled in:
// they come from the folded sheet (fold.js) — wing area and span from where
// the paper is, the centre of gravity from where the layers are, the
// aerodynamic centre from the wing's shape. The gap between those last two
// (the static margin) is what makes a plane steady or not: a flat sheet,
// heavy at the back, tumbles; fold the paper into a layered nose and it
// weathervanes into a glide. The elevator bend sets which glide. SI units.

import { analyze, wingStats, SHEET_MASS, CELL } from './fold.js';

const RHO = 1.2;      // air, kg/m³
const G = 9.81;
const CLIP_MASS = 0.0009;

export const ROOM = { ceiling: 3.2, release: 1.6, floorFriction: 0.6 };

/** What the shaping step adds to a folded sheet. */
export const DEFAULT_TRIM = { keel: 26, elevator: 0, winglets: false, clips: 0 };

function clamp(v, a, b) { return Math.max(a, Math.min(b, Number.isFinite(v) ? v : a)); }
function lerp(a, b, t) { return a + (b - a) * t; }
function wrap(a) {
    while (a > Math.PI) a -= 2 * Math.PI;
    while (a < -Math.PI) a += 2 * Math.PI;
    return a;
}

/** The plane: folded sheet + trim -> everything the flight model needs, and
    the numbers the shaping panel shows. */
export function makePlane(paper, trim = DEFAULT_TRIM) {
    const an = paper.layers ? paper : analyze(paper);
    const keel = clamp(trim.keel, 6, 80);
    const clips = Math.round(clamp(trim.clips, 0, 3));
    const elevator = clamp(trim.elevator, -1, 1);
    const w = wingStats(an, keel);

    let area = w.area, span = w.span;
    if (trim.winglets && span > 60) {
        // Tips folded up 15 mm each side: less flat wing, but cleaner tips.
        const tip = 15;
        const shed = area * (2 * tip / Math.max(1, span)) * 0.7;
        area -= shed;
        span -= 2 * tip;
    }
    area = Math.max(area, 400);      // mm², a scrap of wing at the very least
    span = Math.max(span, 10);
    const aspect = span * span / area;
    const mac = Math.max(20, w.mac);

    // Centre of gravity along the plane, with paper clips on the nose.
    const clipY = w.nose + 10;
    const mass = SHEET_MASS + clips * CLIP_MASS;
    const cgY = (SHEET_MASS * an.cg[1] + clips * CLIP_MASS * clipY) / mass;
    const margin = (w.yAc - cgY) / mac;

    // Pitch inertia from where the layers actually are.
    const cellMass = SHEET_MASS / Math.max(1, an.layers.reduce((a, b) => a + b, 0));
    let inertia = 0;
    for (let j = 0; j < an.ny; j++) {
        const y = an.y0 + (j + 0.5) * CELL;
        let row = 0;
        for (let i = 0; i < an.nx; i++) row += an.layers[j * an.nx + i];
        inertia += row * cellMass * Math.pow((y - cgY) / 1000, 2);
    }
    inertia += clips * CLIP_MASS * Math.pow((clipY - cgY) / 1000, 2);
    inertia = Math.max(inertia, 2e-6);

    const clAlpha = 2 * Math.PI * aspect / (aspect + 2);
    const e = trim.winglets ? 1.15 : 1.0;
    const stall = clamp(0.36 - 0.035 * aspect, 0.2, 0.34);
    const length = (w.tail - w.nose);
    return {
        // flight model
        area: area * 1e-6,
        aspect,
        chord: mac / 1000,
        mass,
        clAlpha,
        cd0: 0.024 + 0.02 * (w.keelArea / area) + 0.6 * w.asymmetry,
        k: 1 / (Math.PI * e * aspect),
        margin,
        cm0: 0.004 + 0.045 * elevator,
        cmq: -clamp(6 + 5 * (length / mac), 8, 20) - (trim.winglets ? 2 : 0),
        inertia,
        stall,
        clMax: clAlpha * stall * 0.92,
        // for the shaping panel and the drawing
        info: {
            span, area, aspect, mac, margin, cgY, acY: w.yAc, nose: w.nose, tail: w.tail, keel,
            asymmetry: w.asymmetry, mass, clips, folds: an.folds,
            glide: bestGlide(clAlpha, 0.024 + 0.02 * (w.keelArea / area), 1 / (Math.PI * e * aspect)),
        },
    };
}

/** Best lift-to-drag ratio of a wing with this lift slope and drag polar. */
function bestGlide(clAlpha, cd0, k) {
    const cl = Math.sqrt(cd0 / k);
    return cl / (cd0 + k * cl * cl);
}

/** In words, for the balance gauge. */
export function balanceWord(margin) {
    if (margin < -0.02) return { word: 'Tail-heavy', hint: 'It will rear up and tumble. Fold more paper towards the nose, or add a clip.' };
    if (margin < 0.04) return { word: 'Twitchy', hint: 'Only just balanced. A clip on the nose will steady it.' };
    if (margin < 0.22) return { word: 'Balanced', hint: 'Steady in pitch. Use the elevator to choose how it glides.' };
    return { word: 'Nose-heavy', hint: 'Very steady but it will dive. Bend the elevator up.' };
}

/** Lift and drag coefficients at angle of attack a (radians), including what
    happens past the stall: lift falls away and the wing becomes a flat plate. */
export function coefficients(p, a) {
    const s = p.stall;
    let cl;
    if (Math.abs(a) <= s) cl = p.clAlpha * a;
    else {
        const over = Math.min(1, (Math.abs(a) - s) / 0.25);
        const attached = Math.sign(a) * Math.min(p.clMax, p.clAlpha * s);
        cl = lerp(attached * 0.8, Math.sin(2 * a), over);
    }
    const cd = p.cd0 + p.k * cl * cl + (Math.abs(a) > s ? 1.1 * Math.pow(Math.sin(a), 2) : 0);
    return { cl, cd };
}

/* ── Flying ── */
export function launch(p, angleDeg, speed) {
    const a = angleDeg * Math.PI / 180;
    return {
        x: 0, y: ROOM.release,
        vx: Math.cos(a) * speed, vy: Math.sin(a) * speed,
        pitch: a, q: 0,
        t: 0,
        landed: false, sliding: false, floor: 0, pad: null,
        maxY: ROOM.release, bonks: 0, stalls: 0, stalled: false,
    };
}

/** Air movement at a point: fans blow straight up in their column. */
function airAt(world, x, y) {
    let wy = 0;
    if (world && world.fans) {
        for (const f of world.fans) {
            const d = Math.abs(x - f.x);
            if (d < f.width / 2 && y < f.height) wy += f.up * (0.5 + 0.5 * (1 - d / (f.width / 2)));
        }
    }
    return { wx: 0, wy };
}

export function step(s, p, dt, world) {
    if (s.landed) return s;
    if (s.sliding) {
        const v = Math.abs(s.vx);
        const dv = ROOM.floorFriction * G * dt;
        s.vx = v <= dv ? 0 : s.vx - Math.sign(s.vx) * dv;
        s.x += s.vx * dt;
        s.t += dt;
        // Sliding off the end of a desk: back into the air, nose down.
        if (s.pad != null) {
            const pad = world.pads[s.pad];
            if (s.x > pad.x1 || s.x < pad.x0) { s.sliding = false; s.pad = null; s.vy = 0; s.pitch = -0.3; return s; }
        }
        if (s.vx === 0) s.landed = true;
        return s;
    }
    const air = airAt(world, s.x, s.y);
    const ux = s.vx - air.wx, uy = s.vy - air.wy;
    const V = Math.hypot(ux, uy) || 1e-6;
    const gamma = Math.atan2(uy, ux);
    const alpha = wrap(s.pitch - gamma);
    const { cl, cd } = coefficients(p, alpha);
    const qbar = 0.5 * RHO * V * V;
    const L = qbar * p.area * cl;
    const D = qbar * p.area * cd;
    const fx = -D * Math.cos(gamma) - L * Math.sin(gamma);
    const fy = -D * Math.sin(gamma) + L * Math.cos(gamma) - p.mass * G;
    const qhat = s.q * p.chord / (2 * V);
    const cm = p.cm0 - p.margin * p.clAlpha * Math.max(-p.stall * 1.6, Math.min(p.stall * 1.6, alpha)) + p.cmq * qhat;
    const M = qbar * p.area * p.chord * cm;

    const prevY = s.y;
    s.vx += fx / p.mass * dt;
    s.vy += fy / p.mass * dt;
    s.q += M / p.inertia * dt;
    // A tumbling sheet spins fast; cap it so the integrator stays sane.
    s.q = Math.max(-60, Math.min(60, s.q));
    s.pitch = wrap(s.pitch + s.q * dt);
    s.x += s.vx * dt;
    s.y += s.vy * dt;
    s.t += dt;

    const isStalled = Math.abs(alpha) > p.stall;
    if (isStalled && !s.stalled) s.stalls++;
    s.stalled = isStalled;
    if (s.y > s.maxY) s.maxY = s.y;

    if (s.y > ROOM.ceiling - 0.05) {
        s.y = ROOM.ceiling - 0.05;
        s.vy = -Math.abs(s.vy) * 0.3;
        s.vx *= 0.6;
        s.q = -Math.abs(s.q) - 4;
        s.bonks++;
    }
    // Coming down onto a desk top.
    if (world && world.pads && s.vy < 0) {
        for (let k = 0; k < world.pads.length; k++) {
            const pad = world.pads[k];
            if (prevY >= pad.y && s.y < pad.y && s.x >= pad.x0 && s.x <= pad.x1) {
                s.y = pad.y;
                touchDown(s);
                s.pad = k;
                return s;
            }
        }
    }
    if (s.y <= 0) {
        s.y = 0;
        touchDown(s);
    }
    return s;
}

function touchDown(s) {
    s.vy = 0;
    s.pitch = 0;
    s.q = 0;
    s.sliding = true;
    s.vx *= 0.5;
}

export const DT = 1 / 240;

/** A whole flight, recorded every few steps for drawing, with what it did. */
export function fly(plane, angleDeg, speed, world = null, maxTime = 30) {
    const s = launch(plane, angleDeg, speed);
    const path = [[s.x, s.y, s.pitch]];
    let n = 0;
    while (!s.landed && s.t < maxTime) {
        step(s, plane, DT, world);
        if (++n % 6 === 0) path.push([s.x, s.y, s.pitch]);
    }
    path.push([s.x, s.y, s.pitch]);
    // Airtime: until it first touched down, not the slide after.
    let air = s.t;
    for (let k = 1; k < path.length; k++) {
        if (path[k][1] <= 1e-6 || (world && world.pads && world.pads.some(p => Math.abs(path[k][1] - p.y) < 1e-6 && path[k][0] >= p.x0 && path[k][0] <= p.x1))) {
            air = k * 6 * DT;
            break;
        }
    }
    return {
        distance: Math.round(s.x * 100) / 100,
        time: Math.round(air * 10) / 10,
        maxHeight: Math.round(s.maxY * 100) / 100,
        stalls: s.stalls,
        bonks: s.bonks,
        landedOn: s.pad,
        hoops: (world && world.hoops || []).map(h => throughHoop(path, h)),
        path,
    };
}

/** Did the path cross the hoop's plane inside its ring? */
export function throughHoop(path, h) {
    for (let k = 1; k < path.length; k++) {
        const [x0, y0] = path[k - 1], [x1, y1] = path[k];
        if ((x0 - h.x) * (x1 - h.x) <= 0 && x0 !== x1) {
            const y = y0 + (y1 - y0) * (h.x - x0) / (x1 - x0);
            if (Math.abs(y - h.y) <= h.r) return true;
        }
    }
    return false;
}

/* ── Missions ──
   Fixed little jobs, each in its own version of the office. tests.html
   checks that every one can be done with one of the guided designs. */
export const MISSIONS = [
    { id: 'maiden', name: 'Maiden flight', goal: 'Fly 6 metres.', world: {}, check: (r) => r.distance >= 6 },
    { id: 'hoop', name: 'Through the hoop', goal: 'Fly through the hoop at 5 m.', world: { hoops: [{ x: 5, y: 1.4, r: 0.35 }] }, check: (r) => r.hoops[0] },
    { id: 'hang', name: 'Hang time', goal: 'Stay in the air for 3.5 seconds.', world: {}, check: (r) => r.time >= 3.5 },
    { id: 'desk', name: 'Desk landing', goal: 'Land on the desk at 8.5 m.', world: { pads: [{ x0: 8.5, x1: 10, y: 0.74 }] }, check: (r) => r.landedOn === 0 },
    { id: 'hoops', name: 'Double hoop', goal: 'Through both hoops.', world: { hoops: [{ x: 3.5, y: 1.9, r: 0.4 }, { x: 9, y: 1.1, r: 0.4 }] }, check: (r) => r.hoops.every(Boolean) },
    { id: 'fan', name: 'Ride the fan', goal: 'Fly 16 m, with a fan blowing up at 6 m.', world: { fans: [{ x: 6, width: 1.4, height: 2.8, up: 2 }] }, check: (r) => r.distance >= 16 },
    { id: 'bin', name: 'Bin it', goal: 'Land in the bin at 12 m.', world: { bin: { x: 12, width: 0.45 } }, check: (r, w) => Math.abs(r.distance - w.bin.x) <= w.bin.width / 2 },
    { id: 'twenty', name: 'Twenty metres', goal: 'Fly 20 metres.', world: {}, check: (r) => r.distance >= 20 },
];

/* ── The daily bin ──
   One target a day, the same for everyone: a bin somewhere down the office,
   and on some days a desk fan blowing up between you and it. Seeded from the
   date (UTC), so it changes at midnight UTC and not with your time zone. */
export function dailyChallenge(date) {
    const key = date.toISOString().slice(0, 10);
    let h = 2166136261;
    for (let i = 0; i < key.length; i++) h = Math.imul(h ^ key.charCodeAt(i), 16777619);
    const r = (n) => { h = Math.imul(h ^ (h >>> 15), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909); h ^= h >>> 16; return ((h >>> 0) % 10000) / 10000 * n; };
    const bin = Math.round((7 + r(11)) * 10) / 10;
    const hasFan = r(1) < 0.5;
    const fans = hasFan ? [{ x: Math.round(bin * (0.35 + r(0.35)) * 10) / 10, width: 1.2, height: 2.6, up: 1.2 + r(1.4) }] : [];
    return { key, bin, binWidth: 0.45, fans };
}

export function inBin(distance, challenge) {
    return Math.abs(distance - challenge.bin) <= challenge.binWidth / 2;
}
