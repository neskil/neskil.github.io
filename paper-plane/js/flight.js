// Paper Plane Glider — how a folded sheet flies. No DOM.
//
// A side-on glider model: lift and drag from the angle of attack, with a
// stall, and a pitching moment. None of the plane's numbers are dialled in:
// they come from the folded sheet (fold.js) — wing area and span from where
// the paper is, the centre of gravity from where the layers are, the
// aerodynamic centre from the wing's shape. The gap between those last two
// (the static margin) is what makes a plane steady or not: a flat sheet,
// heavy at the back, rears up and drops; fold the paper into a layered nose and it
// weathervanes into a glide. The elevator bend sets which glide. SI units.

import { analyze, wingStats, SHEET_MASS, CELL } from './fold.js';

const RHO = 1.2;      // air, kg/m³
const G = 9.81;
const CLIP_MASS = 0.0009;
/** Profile drag of the flat paper, before the keel and any lopsidedness. */
const CD0 = 0.026;

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

    // Pitch inertia from where the layers actually are; and how much wing
    // there is how far ahead of and behind the balance point, which is what
    // damps a pitching plane (each strip of wing swings through the air).
    const cellMass = SHEET_MASS / Math.max(1, an.layers.reduce((a, b) => a + b, 0));
    let inertia = 0, swing = 0;
    for (let j = 0; j < an.ny; j++) {
        const y = an.y0 + (j + 0.5) * CELL;
        let row = 0, wing = 0;
        for (let i = 0; i < an.nx; i++) {
            const n = an.layers[j * an.nx + i];
            row += n;
            if (n && Math.abs(an.x0 + (i + 0.5) * CELL) > keel) wing++;
        }
        inertia += row * cellMass * Math.pow((y - cgY) / 1000, 2);
        swing += wing * CELL * CELL * (y - cgY) * (y - cgY);
    }
    inertia += clips * CLIP_MASS * Math.pow((clipY - cgY) / 1000, 2);
    inertia = Math.max(inertia, 2e-6);

    const clAlpha = 2 * Math.PI * aspect / (aspect + 2);
    const e = trim.winglets ? 1.15 : 1.0;
    const stall = clamp(0.36 - 0.035 * aspect, 0.2, 0.34);
    const lat = lateral(an, keel, w, !!trim.winglets, cgY, clips, clipY, clAlpha, area, span);
    return {
        // flight model
        area: area * 1e-6,
        aspect,
        chord: mac / 1000,
        mass,
        clAlpha,
        cd0: CD0 + 0.02 * (w.keelArea / area) + 0.6 * w.asymmetry,
        k: 1 / (Math.PI * e * aspect),
        margin,
        cm0: 0.004 + 0.045 * elevator,
        // Strip theory: every strip of wing at a distance r from the balance
        // point meets the air at an extra q·r/V as the plane pitches. Doubled
        // for the air the sheet drags round with it, which on something this
        // light is as much again.
        cmq: -clamp(4 * clAlpha * swing / (area * mac * mac), 0.8, 8) - (trim.winglets ? 0.3 : 0),
        inertia,
        stall,
        clMax: clAlpha * stall * 0.92,
        // roll and yaw, for the 3D flight (flight3d.js); the 2D model ignores them
        span: span / 1000,
        ...lat,
        // for the shaping panel and the drawing
        info: {
            span, area, aspect, mac, margin, cgY, acY: w.yAc, nose: w.nose, tail: w.tail, keel,
            asymmetry: w.asymmetry, mass, clips, folds: an.folds,
            glide: bestGlide(clAlpha, CD0 + 0.02 * (w.keelArea / area), 1 / (Math.PI * e * aspect)),
        },
    };
}

/** Under this (mm), a sideways offset between lift and balance is the 2 mm
    raster disagreeing with itself across the centre line, not the fold. */
const RASTER_ARM = 0.3;
function deadBand(v, w) { return Math.abs(v) <= w ? 0 : v - Math.sign(v) * w; }

/** Lift slope of a stubby surface (Helmbold), per radian: right for a keel
    or a winglet, whose aspect ratios are well under one. */
function stubSlope(A) { return 2 * Math.PI * A / (2 + Math.sqrt(A * A + 4)); }

/** Everything about the plane that is not in its side view. The sheet is
    folded the way model.js folds it (keel hanging down, wings at a 4°
    dihedral, tips turned up into winglets); each raster cell lands somewhere
    in 3D, and from that come the roll and yaw inertia, the sideways centre of
    gravity, the sideways centre of lift (a lopsided fold puts it off the
    middle, and the plane rolls), and the side areas that turn the plane into
    the airflow (the keel behind the balance point) and level it (the
    dihedral; winglets above, the keel below working against it). Body axes
    as in flight3d.js; lengths in mm until the end. */
function lateral(an, keel, w, winglets, cgY, clips, clipY, clAlpha, area, span) {
    const DIH = 4 * Math.PI / 180, UP = 75 * Math.PI / 180, TIP = 15;
    // Folded, the wings sit at 4°; flying, the paper bends up under the lift.
    // The levelling is worked out as if they sat at 18°, which is what makes
    // a bank of 10° curve a dart a third of a metre and a glider nearly two,
    // rather than every banked throw spiralling into the wall.
    const FLEX = 18 * Math.PI / 180;
    const tipLine = winglets ? keel + Math.max(10, w.halfSpan - TIP) : Infinity;
    const { x0, y0, nx, ny, layers } = an;
    let total = 0;
    for (let k = 0; k < layers.length; k++) total += layers[k];
    const cellMass = SHEET_MASS / Math.max(1, total);
    const pts = [];            // [mass, along Y, across X, up Z]
    let liftN = 0, liftX = 0, liftSpan = 0;
    let kN = 0, kY = 0, kZ = 0, gN = 0, gY = 0, gZ = 0;
    // Sweep: how far back the quarter-chord line runs per mm of span.
    let sw = 0, sa = 0, sy = 0, saa = 0, say = 0;
    for (let i = 0; i < nx; i++) {
        const x = x0 + (i + 0.5) * CELL, a = Math.abs(x);
        if (a <= keel || a >= tipLine) continue;
        let le = Infinity, count = 0;
        for (let j = 0; j < ny; j++) if (layers[j * nx + i]) { count++; le = Math.min(le, y0 + (j + 0.5) * CELL); }
        if (!count) continue;
        const qc = le + 0.25 * count * CELL, wgt = count;
        sw += wgt; sa += wgt * a; sy += wgt * qc; saa += wgt * a * a; say += wgt * a * qc;
    }
    const sweepDen = sw * saa - sa * sa;
    const tanSweep = sweepDen > 1e-9 ? Math.max(0, Math.min(3, (sw * say - sa * sy) / sweepDen)) : 0;
    for (let j = 0; j < ny; j++) {
        const y = y0 + (j + 0.5) * CELL;
        for (let i = 0; i < nx; i++) {
            const n = layers[j * nx + i];
            if (!n) continue;
            const x = x0 + (i + 0.5) * CELL, a = Math.abs(x), side = x < 0 ? -1 : 1;
            let X, Z;
            if (a < keel) {
                X = 0; Z = -(keel - a);
                kN++; kY += y; kZ += Z;
            } else {
                const out = a - keel, flat = Math.min(out, tipLine - keel), up = Math.max(0, a - tipLine);
                X = side * (flat * Math.cos(DIH) + up * Math.cos(UP));
                Z = flat * Math.sin(DIH) + up * Math.sin(UP);
                if (up > 0) { gN++; gY += y; gZ += Z; } else { liftN++; liftX += X; liftSpan += Math.abs(X); }
            }
            pts.push([n * cellMass, y, X, Z]);
        }
    }
    if (clips) pts.push([clips * CLIP_MASS, clipY, 0, -keel / 2]);
    let m = 0, mX = 0, mZ = 0;
    for (const [pm, , X, Z] of pts) { m += pm; mX += pm * X; mZ += pm * Z; }
    const cgX = mX / m, cgZ = mZ / m;
    let ix = 0, iy = 0;
    for (const [pm, Y, X, Z] of pts) {
        ix += pm * ((X - cgX) ** 2 + (Z - cgZ) ** 2);
        iy += pm * ((Y - cgY) ** 2 + (X - cgX) ** 2);
    }
    // Side areas: the keel is the strip either side of the centre folded
    // together, so half its cells; winglets stand nearly upright.
    const S = Math.max(area, 400), b = Math.max(span, 10);
    const sk = kN * CELL * CELL / 2, sg = gN * CELL * CELL * Math.sin(UP);
    const cyk = sk > 0 ? stubSlope(2 * keel * keel / sk) : 0;
    const cyg = sg > 0 ? stubSlope(2 * TIP * TIP / (sg / 2)) : 0;
    const lk = kN ? kY / kN - cgY : 0, hk = kN ? kZ / kN - cgZ : 0;
    const lg = gN ? gY / gN - cgY : 0, hg = gN ? gZ / gN - cgZ : 0;
    return {
        ix: Math.max(ix * 1e-6, 1e-7),
        iy: Math.max(iy * 1e-6, 1e-7),
        cyBeta: (cyk * sk + cyg * sg) / S,
        cnBeta: (cyk * sk * lk + cyg * sg * lg) / (S * b),
        clBeta: clAlpha * FLEX / 4 + (cyk * sk * hk + cyg * sg * hg) / (S * b),
        // A swept wing levels itself too: slipping sideways, the leading
        // wing is less swept to the air and lifts more. Scales with the lift
        // coefficient, so it is applied in flight; half of strip theory.
        sweepRoll: liftN ? 0.5 * tanSweep * (liftSpan / liftN) / b : 0,
        clp: -clAlpha / 8,
        cnr: -2 * (cyk * sk * lk * lk + cyg * sg * lg * lg) / (S * b * b) - 0.01,
        rollArm: liftN ? deadBand(liftX / liftN - cgX, RASTER_ARM) / 1000 : 0,
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
export function coefficients(p, a, ground = 1) {
    const s = p.stall;
    let cl;
    if (Math.abs(a) <= s) cl = p.clAlpha * a;
    else {
        const over = Math.min(1, (Math.abs(a) - s) / 0.25);
        const attached = Math.sign(a) * Math.min(p.clMax, p.clAlpha * s);
        cl = lerp(attached * 0.8, Math.sin(2 * a), over);
    }
    const cd = p.cd0 + p.k * ground * cl * cl + (Math.abs(a) > s ? 1.1 * Math.pow(Math.sin(a), 2) : 0);
    return { cl, cd };
}

/** Pitching moment coefficient about the balance point, at any angle of
    attack. Below the stall the lift acts at the aerodynamic centre, `margin`
    chords behind the balance point. Past it the wing is a flat plate, pushed
    square-on, and that push moves back towards the middle of the chord as it
    turns broadside (and to the three-quarter point flying backwards). So a
    stalled plane drops its nose and dives out of it, one flying backwards
    swings round, and a tail-heavy sheet settles into a steep, flat mush. */
export function pitchCoefficient(p, a) {
    const s = p.stall;
    if (Math.abs(a) <= s) return p.cm0 - p.margin * p.clAlpha * a;
    const atStall = p.cm0 - p.margin * p.clAlpha * s * Math.sign(a);
    const plate = p.cm0 * Math.max(0, Math.cos(a)) - 1.2 * Math.sin(a) * (p.margin + 0.25 * (1 - Math.cos(a)));
    return lerp(atStall, plate, Math.min(1, (Math.abs(a) - s) / 0.25));
}

/** Near the floor the wing's downwash has nowhere to go: less induced drag,
    so a paper plane floats the last few centimetres. `h` in metres. */
export function groundEffect(h, span) {
    const r = 16 * Math.max(0, h) / Math.max(0.05, span);
    return r * r / (1 + r * r);
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

/** Height above whatever is underneath: the floor, or a desk top. */
function floorBelow(world, x, y) {
    let h = y;
    if (world && world.pads) for (const pad of world.pads) if (x >= pad.x0 && x <= pad.x1 && y >= pad.y) h = Math.min(h, y - pad.y);
    return h;
}

export function step(s, p, dt, world) {
    if (s.landed) return s;
    if (s.sliding) {
        const v = Math.abs(s.vx);
        const dv = ROOM.floorFriction * G * dt;
        s.vx = v <= dv ? 0 : s.vx - Math.sign(s.vx) * dv;
        s.x += s.vx * dt;
        s.t += dt;
        s.pitch = settle(s.pitch, dt);
        // Sliding off the end of a desk: back into the air, nose down.
        if (s.pad != null) {
            const pad = world.pads[s.pad];
            if (s.x > pad.x1 || s.x < pad.x0) { s.sliding = false; s.pad = null; s.vy = 0; s.pitch = -0.3; return s; }
        }
        if (s.vx === 0 && s.pitch === 0) s.landed = true;
        return s;
    }
    const air = airAt(world, s.x, s.y);
    const ux = s.vx - air.wx, uy = s.vy - air.wy;
    const V = Math.hypot(ux, uy) || 1e-6;
    const gamma = Math.atan2(uy, ux);
    const alpha = wrap(s.pitch - gamma);
    const { cl, cd } = coefficients(p, alpha, groundEffect(floorBelow(world, s.x, s.y), p.span));
    const qbar = 0.5 * RHO * V * V;
    const L = qbar * p.area * cl;
    const D = qbar * p.area * cd;
    const fx = -D * Math.cos(gamma) - L * Math.sin(gamma);
    const fy = -D * Math.sin(gamma) + L * Math.cos(gamma) - p.mass * G;
    // The pitch damping (cmq) is stiff next to a paper plane's tiny inertia:
    // stepped explicitly it flips the pitch rate's sign every step. So it is
    // stepped implicitly, below, from the rest of the moment and its rate.
    const cm = pitchCoefficient(p, alpha);
    const M = qbar * p.area * p.chord * cm;
    const damp = qbar * p.area * p.chord * p.cmq * p.chord / (2 * V);

    const prevY = s.y;
    s.vx += fx / p.mass * dt;
    s.vy += fy / p.mass * dt;
    s.q = (s.q + M / p.inertia * dt) / (1 - damp / p.inertia * dt);
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

/** Coming down: a steep, nose-first arrival digs in and stops nearly dead;
    a flatter one skids on at half its speed. The plane then settles flat
    (settle(), below) rather than snapping level. */
export function touchSpeed(vx, vy) {
    return vy < -1.2 * Math.abs(vx) ? 0.15 : 0.5;
}

/** A landed plane's tilt dying away, a step at a time. */
export function settle(angle, dt) {
    const a = angle * Math.exp(-18 * dt);
    return Math.abs(a) < 1e-3 ? 0 : a;
}

function touchDown(s) {
    s.vx *= touchSpeed(s.vx, s.vy);
    s.vy = 0;
    s.q = 0;
    s.sliding = true;
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
    { id: 'bin', name: 'Bin it', goal: 'Land in the bin at 12 m.', world: { bin: { x: 12, width: 0.45 } }, check: (r, w) => Math.hypot(r.distance - w.bin.x, (r.offset || 0) - (w.bin.z || 0)) <= w.bin.width / 2 },
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
    // Drawn after the rest, so adding it moved nothing: the bin off to one
    // side for a 3D throw, any fan on the straight line to it.
    const binZ = Math.round((r(3) - 1.5) * 10) / 10;
    for (const f of fans) f.z = Math.round(binZ * f.x / bin * 10) / 10;
    return { key, bin, binZ, binWidth: 0.45, fans };
}

/** In the bin: by distance alone for a 2D throw, or by where it came to rest
    (`offset`, from fly3d) for a 3D one. */
export function inBin(distance, challenge, offset) {
    if (offset === undefined) return Math.abs(distance - challenge.bin) <= challenge.binWidth / 2;
    return Math.hypot(distance - challenge.bin, offset - (challenge.binZ || 0)) <= challenge.binWidth / 2;
}
