// Paper Plane Glider — the fold and the flight, with no DOM.
//
// A side-on glider model: lift and drag from the angle of attack, and a
// pitching moment that is what the three sliders really change. Nose weight
// moves the centre of gravity forward, which makes the plane weathervane back
// to its trim angle (stability); the tail flaps set what that trim angle is.
// Get them in balance and the plane settles into its best glide. Too little
// nose and it noses up, stalls and drops; too much flap and it loops; too much
// nose and too little flap and it dives into the carpet. All SI units.

const RHO = 1.2;      // air, kg/m³
const G = 9.81;

export const ROOM = { ceiling: 3.2, release: 1.6, floorFriction: 0.6 };

/* ── The fold ── */
export const DEFAULT_FOLD = { shape: 0.5, nose: 0, flaps: 0 };

/** Turns the three sliders into the plane's numbers.
    shape 0 = broad glider wing, 1 = narrow dart.
    nose  0..3 paper clips.
    flaps -1 (trailing edge folded down) .. 1 (folded up). */
export function makePlane(fold) {
    const shape = clamp(fold.shape, 0, 1);
    const clips = clamp(fold.nose, 0, 3);
    const flaps = clamp(fold.flaps, -1, 1);
    const area = lerp(0.026, 0.013, shape);        // m²
    const aspect = lerp(4.2, 1.4, shape);            // span² / area
    const chord = Math.sqrt(area / aspect);
    const mass = 0.0048 + clips * 0.0009;            // a sheet of A4 is ~4.8 g; a clip ~0.9 g
    // Lift slope for a low-aspect-ratio wing (per radian).
    const clAlpha = 2 * Math.PI * aspect / (aspect + 2);
    // A dart is slicker in a straight line; a broad wing is more efficient.
    const cd0 = lerp(0.045, 0.032, shape);
    const k = 1 / (Math.PI * 0.75 * aspect);
    // Static margin: how far the centre of gravity sits ahead of the wing's
    // neutral point, as a fraction of chord. A bare sheet sits a touch behind
    // (unstable); each clip pulls it forward.
    const margin = -0.03 + clips * 0.06;
    return {
        fold: { shape, nose: clips, flaps },
        area, aspect, chord, mass, clAlpha, cd0, k, margin,
        // Flaps up gives a nose-up moment; down, nose-down.
        cm0: 0.045 * flaps + 0.006,
        cmq: -lerp(16, 8, shape),                     // pitch damping
        inertia: mass * Math.pow(chord * 1.3, 2),     // kg·m²
        stall: lerp(0.24, 0.32, shape),               // radians
        clMax: lerp(1.0, 0.85, shape),
    };
}

/** Lift and drag coefficients at angle of attack a (radians), including what
    happens past the stall: lift falls away and the wing becomes a flat plate. */
export function coefficients(p, a) {
    const s = p.stall;
    let cl;
    if (Math.abs(a) <= s) cl = p.clAlpha * a;
    else {
        // Past the stall, blend to a flat plate: 2·sin·cos.
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
        landed: false, sliding: false,
        maxY: ROOM.release, bonks: 0, stalls: 0, stalled: false,
    };
}

/** Air movement at a point: fans blow straight up in their column. */
function airAt(world, x, y) {
    let wy = 0, wx = world && world.wind ? world.wind : 0;
    if (world && world.fans) {
        for (const f of world.fans) {
            const d = Math.abs(x - f.x);
            if (d < f.width / 2 && y < f.height) wy += f.up * (1 - d / (f.width / 2)) * 0.5 + f.up * 0.5;
        }
    }
    return { wx, wy };
}

export function step(s, p, dt, world) {
    if (s.landed) return s;
    if (s.sliding) {
        // On the carpet: friction brings it to a stop.
        const v = Math.abs(s.vx);
        const dv = ROOM.floorFriction * G * dt;
        s.vx = v <= dv ? 0 : s.vx - Math.sign(s.vx) * dv;
        s.x += s.vx * dt;
        s.t += dt;
        if (s.vx === 0) s.landed = true;
        return s;
    }
    const air = airAt(world, s.x, s.y);
    const ux = s.vx - air.wx, uy = s.vy - air.wy;      // airspeed
    const V = Math.hypot(ux, uy) || 1e-6;
    const gamma = Math.atan2(uy, ux);                  // flight path angle in the air
    let alpha = wrap(s.pitch - gamma);
    const { cl, cd } = coefficients(p, alpha);
    const qbar = 0.5 * RHO * V * V;
    const L = qbar * p.area * cl;
    const D = qbar * p.area * cd;
    // Lift is perpendicular to the airflow, drag along it.
    const fx = -D * Math.cos(gamma) - L * Math.sin(gamma);
    const fy = -D * Math.sin(gamma) + L * Math.cos(gamma) - p.mass * G;
    const qhat = s.q * p.chord / (2 * V);
    const cm = p.cm0 - p.margin * p.clAlpha * Math.max(-p.stall * 1.6, Math.min(p.stall * 1.6, alpha)) + p.cmq * qhat;
    const M = qbar * p.area * p.chord * cm;

    s.vx += fx / p.mass * dt;
    s.vy += fy / p.mass * dt;
    s.q += M / p.inertia * dt;
    s.pitch = wrap(s.pitch + s.q * dt);
    s.x += s.vx * dt;
    s.y += s.vy * dt;
    s.t += dt;

    const isStalled = Math.abs(alpha) > p.stall;
    if (isStalled && !s.stalled) s.stalls++;
    s.stalled = isStalled;
    if (s.y > s.maxY) s.maxY = s.y;

    // The ceiling: a bonk takes most of the speed off and tips the nose down.
    if (s.y > ROOM.ceiling - 0.05) {
        s.y = ROOM.ceiling - 0.05;
        s.vy = -Math.abs(s.vy) * 0.3;
        s.vx *= 0.6;
        s.q = -Math.abs(s.q) - 4;
        s.bonks++;
    }
    // Backwards past the thrower is a landing behind them.
    if (s.y <= 0) {
        s.y = 0;
        s.vy = 0;
        s.pitch = 0;
        s.q = 0;
        s.sliding = true;
        s.vx *= 0.5;
    }
    return s;
}

export const DT = 1 / 240;

/** A whole flight, recorded every few steps for drawing. */
export function fly(fold, angleDeg, speed, world = null, maxTime = 30) {
    const p = makePlane(fold);
    const s = launch(p, angleDeg, speed);
    const path = [[s.x, s.y, s.pitch]];
    let n = 0;
    while (!s.landed && s.t < maxTime) {
        step(s, p, DT, world);
        if (++n % 6 === 0) path.push([s.x, s.y, s.pitch]);
    }
    path.push([s.x, s.y, s.pitch]);
    return {
        distance: Math.round(s.x * 100) / 100,
        time: Math.round(s.t * 10) / 10,
        maxHeight: Math.round(s.maxY * 100) / 100,
        stalls: s.stalls,
        bonks: s.bonks,
        path,
    };
}

/* ── The daily bin ──
   One target a day, the same for everyone: a bin somewhere down the office,
   and on some days a desk fan blowing up between you and it. Seeded from the
   date (UTC), so it changes at midnight UTC and not with your time zone. */
export function dailyChallenge(date) {
    const key = date.toISOString().slice(0, 10);
    let h = 2166136261;
    for (let i = 0; i < key.length; i++) h = Math.imul(h ^ key.charCodeAt(i), 16777619);
    const r = (n) => { h = Math.imul(h ^ (h >>> 15), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909); h ^= h >>> 16; return ((h >>> 0) % 10000) / 10000 * n; };
    const bin = Math.round((7 + r(16)) * 10) / 10;
    const hasFan = r(1) < 0.5;
    const fans = hasFan ? [{ x: Math.round(bin * (0.35 + r(0.35)) * 10) / 10, width: 1.2, height: 2.6, up: 1.2 + r(1.4) }] : [];
    return { key, bin, binWidth: 0.4, fans };
}

export function inBin(distance, challenge) {
    return Math.abs(distance - challenge.bin) <= challenge.binWidth / 2;
}

/* ── helpers ── */
function clamp(v, a, b) { return Math.max(a, Math.min(b, Number.isFinite(v) ? v : a)); }
function lerp(a, b, t) { return a + (b - a) * t; }
function wrap(a) {
    while (a > Math.PI) a -= 2 * Math.PI;
    while (a < -Math.PI) a += 2 * Math.PI;
    return a;
}
