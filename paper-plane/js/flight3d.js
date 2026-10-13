// Paper Plane Glider — the flight in 3D. No DOM.
//
// The side-on model in flight.js, given its other two axes. Pitch is exactly
// what it was (same lift, drag, stall and pitching moment), so a straight
// throw of a symmetric plane flies the 2D flight to the millimetre; what is
// new is roll and yaw. Those come from the folded sheet too (flight.js →
// lateral): a lopsided fold moves the centre of lift off the middle and the
// plane rolls; the dihedral levels it again once it slips sideways; the keel
// behind the balance point turns the nose into the airflow, which is what
// turns a banked plane. See PLAN.md → "The contract" for the axes.
//
// Body axes: x forward, y up, z the right wing. Positive rates: roll about x
// puts the right wing down, yaw about y swings the nose left, pitch about z
// lifts the nose. World axes: x down the room, y up, z to the thrower's right.

import { DT, ROOM, coefficients } from './flight.js';

const RHO = 1.2;
const G = 9.81;
const D2R = Math.PI / 180;
/** How much a yaw rate rolls the plane (the outside wing is faster). */
const CLR = 0.25;

export const ROOM3D = { length: 24, width: 6, ceiling: ROOM.ceiling, release: ROOM.release };
export const AIM_LIMITS = { angle: [-15, 60], speed: [2, 12], yaw: [-20, 20], bank: [-40, 40] };
export const SAMPLE3D = DT * 6;
/** A desk with no z0/z1 spans this much across the room. */
export const DESK_HALF = 0.8;
const BACK = -2;
const SKIN = 0.05;

/* ── Quaternions, [w, x, y, z], body to world ── */
function qmul(a, b) {
    return [
        a[0] * b[0] - a[1] * b[1] - a[2] * b[2] - a[3] * b[3],
        a[0] * b[1] + a[1] * b[0] + a[2] * b[3] - a[3] * b[2],
        a[0] * b[2] - a[1] * b[3] + a[2] * b[0] + a[3] * b[1],
        a[0] * b[3] + a[1] * b[2] - a[2] * b[1] + a[3] * b[0],
    ];
}
function axis(x, y, z, angle) {
    const s = Math.sin(angle / 2);
    return [Math.cos(angle / 2), x * s, y * s, z * s];
}
function unit(q) {
    const L = Math.hypot(q[0], q[1], q[2], q[3]) || 1;
    return [q[0] / L, q[1] / L, q[2] / L, q[3] / L];
}
/** v rotated by q (body → world). */
export function rotate(q, v) {
    const [w, x, y, z] = q;
    const tx = 2 * (y * v[2] - z * v[1]), ty = 2 * (z * v[0] - x * v[2]), tz = 2 * (x * v[1] - y * v[0]);
    return [v[0] + w * tx + (y * tz - z * ty), v[1] + w * ty + (z * tx - x * tz), v[2] + w * tz + (x * ty - y * tx)];
}
function unrotate(q, v) { return rotate([q[0], -q[1], -q[2], -q[3]], v); }
/** Level, nose pointing along `heading` (radians from +x towards +z). */
function headingQuat(heading) { return axis(0, 1, 0, -heading); }
function cross(a, b) { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; }

/* ── Flying ── */
export function launch3d(p, aim) {
    const a = (aim.angle || 0) * D2R, psi = (aim.yaw || 0) * D2R, phi = (aim.bank || 0) * D2R;
    const V = aim.speed;
    return {
        x: 0, y: ROOM3D.release, z: 0,
        vx: V * Math.cos(a) * Math.cos(psi), vy: V * Math.sin(a), vz: V * Math.cos(a) * Math.sin(psi),
        q: qmul(qmul(headingQuat(psi), axis(0, 0, 1, a)), axis(1, 0, 0, phi)),
        wx: 0, wy: 0, wz: 0,
        t: 0, touch: null,
        landed: false, sliding: false, pad: null,
        maxY: ROOM3D.release, bonks: 0, stalls: 0, stalled: false, walls: 0,
    };
}

/** Fans blow straight up in a round column. */
function updraft(world, x, y, z) {
    let wy = 0;
    if (world && world.fans) {
        for (const f of world.fans) {
            const d = Math.hypot(x - f.x, z - (f.z || 0));
            if (d < f.width / 2 && y < f.height) wy += f.up * (0.5 + 0.5 * (1 - d / (f.width / 2)));
        }
    }
    return wy;
}

function deskSpan(pad) { return [pad.z0 ?? -DESK_HALF, pad.z1 ?? DESK_HALF]; }

export function step3d(s, p, dt, world) {
    if (s.landed) return s;
    if (s.sliding) return slide(s, p, dt, world);

    const wy = updraft(world, s.x, s.y, s.z);
    const u = [s.vx, s.vy - wy, s.vz];
    const V = Math.hypot(u[0], u[1], u[2]) || 1e-6;
    const ub = unrotate(s.q, u);
    const alpha = Math.atan2(-ub[1], ub[0]);
    const beta = Math.asin(Math.max(-1, Math.min(1, ub[2] / V)));
    const { cl, cd } = coefficients(p, alpha);
    const qbar = 0.5 * RHO * V * V;
    const L = qbar * p.area * cl;
    const D = qbar * p.area * cd;
    const Y = -qbar * p.area * p.cyBeta * beta;

    // Lift at right angles to the airflow, in the plane of the keel.
    const uh = [u[0] / V, u[1] / V, u[2] / V];
    const zb = rotate(s.q, [0, 0, 1]);
    let ld = cross(zb, uh);
    const n = Math.hypot(ld[0], ld[1], ld[2]);
    ld = n > 1e-9 ? [ld[0] / n, ld[1] / n, ld[2] / n] : [0, 1, 0];
    const fx = -D * uh[0] + L * ld[0] + Y * zb[0];
    const fy = -D * uh[1] + L * ld[1] + Y * zb[1] - p.mass * G;
    const fz = -D * uh[2] + L * ld[2] + Y * zb[2];

    // Moments in body axes, less the damping of each rate (dx, dy, dz),
    // which is stepped implicitly as in flight.js.
    const b = p.span, c = p.chord, k = 1 / (2 * V);
    const rh = s.wy * b * k;
    const cm = p.cm0 - p.margin * p.clAlpha * Math.max(-p.stall * 1.6, Math.min(p.stall * 1.6, alpha));
    const Mz = qbar * p.area * c * cm;
    const Mx = qbar * p.area * b * (-(p.clBeta + p.sweepRoll * cl) * beta - CLR * cl * rh) - L * p.rollArm;
    const My = qbar * p.area * b * -p.cnBeta * beta;
    const dx = qbar * p.area * b * p.clp * b * k;
    const dy = qbar * p.area * b * p.cnr * b * k;
    const dz = qbar * p.area * c * p.cmq * c * k;

    const prevX = s.x, prevY = s.y, prevZ = s.z;
    s.vx += fx / p.mass * dt;
    s.vy += fy / p.mass * dt;
    s.vz += fz / p.mass * dt;
    const Ix = p.ix, Iy = p.iy, Iz = p.inertia;
    const gx = s.wy * Iz * s.wz - s.wz * Iy * s.wy;
    const gy = s.wz * Ix * s.wx - s.wx * Iz * s.wz;
    const gz = s.wx * Iy * s.wy - s.wy * Ix * s.wx;
    // A tumbling sheet spins fast; cap it so the integrator stays sane.
    s.wx = Math.max(-60, Math.min(60, (s.wx + (Mx - gx) / Ix * dt) / (1 - dx / Ix * dt)));
    s.wy = Math.max(-60, Math.min(60, (s.wy + (My - gy) / Iy * dt) / (1 - dy / Iy * dt)));
    s.wz = Math.max(-60, Math.min(60, (s.wz + (Mz - gz) / Iz * dt) / (1 - dz / Iz * dt)));
    const w = Math.hypot(s.wx, s.wy, s.wz);
    if (w > 0) s.q = unit(qmul(s.q, axis(s.wx / w, s.wy / w, s.wz / w, w * dt)));
    s.x += s.vx * dt;
    s.y += s.vy * dt;
    s.z += s.vz * dt;
    s.t += dt;

    const isStalled = Math.abs(alpha) > p.stall;
    if (isStalled && !s.stalled) s.stalls++;
    s.stalled = isStalled;
    if (s.y > s.maxY) s.maxY = s.y;

    if (s.y > ROOM3D.ceiling - SKIN) {
        s.y = ROOM3D.ceiling - SKIN;
        s.vy = -Math.abs(s.vy) * 0.3;
        s.vx *= 0.6;
        s.vz *= 0.6;
        s.wz = -Math.abs(s.wz) - 4;
        s.bonks++;
    }
    walls(s, world, prevX, prevZ);
    if (world && world.pads) {
        for (let i = 0; i < world.pads.length; i++) {
            const pad = world.pads[i];
            const [z0, z1] = deskSpan(pad);
            const over = s.x >= pad.x0 && s.x <= pad.x1 && s.z >= z0 && s.z <= z1;
            // Coming down onto the top...
            if (s.vy < 0 && prevY >= pad.y && s.y < pad.y && over) {
                s.y = pad.y;
                touchDown(s);
                s.pad = i;
                return s;
            }
            // ...or flying into its side, which stops it.
            if (s.y < pad.y && over) {
                if (prevX < pad.x0) { s.x = pad.x0 - SKIN; s.vx = -Math.abs(s.vx) * 0.2; }
                else if (prevX > pad.x1) { s.x = pad.x1 + SKIN; s.vx = Math.abs(s.vx) * 0.2; }
                else if (prevZ < z0) { s.z = z0 - SKIN; s.vz = -Math.abs(s.vz) * 0.2; }
                else if (prevZ > z1) { s.z = z1 + SKIN; s.vz = Math.abs(s.vz) * 0.2; }
                else continue;
                s.wx *= 0.3; s.wy *= 0.3;
                s.walls++;
            }
        }
    }
    if (s.y <= 0) {
        s.y = 0;
        touchDown(s);
    }
    return s;
}

/** The room's walls and the pillars: the plane bounces off, losing most of
    its speed. */
function walls(s, world, prevX, prevZ) {
    const half = ROOM3D.width / 2 - SKIN;
    let hit = false;
    if (Math.abs(s.z) > half) {
        s.z = Math.sign(s.z) * half;
        s.vz = -s.vz * 0.3;
        s.vx *= 0.6;
        hit = true;
    }
    if (s.x > ROOM3D.length - SKIN) { s.x = ROOM3D.length - SKIN; s.vx = -Math.abs(s.vx) * 0.3; s.vz *= 0.6; hit = true; }
    if (s.x < BACK) { s.x = BACK; s.vx = Math.abs(s.vx) * 0.3; hit = true; }
    if (world && world.pillars) {
        for (const pl of world.pillars) {
            const dx = s.x - pl.x, dz = s.z - (pl.z || 0), d = Math.hypot(dx, dz);
            if (d >= pl.r + SKIN) continue;
            // Out to the surface, on the side it came from.
            let nx = dx / (d || 1), nz = dz / (d || 1);
            if (!d) { const ax = prevX - pl.x, az = prevZ - (pl.z || 0), L = Math.hypot(ax, az) || 1; nx = ax / L; nz = az / L; }
            s.x = pl.x + nx * (pl.r + SKIN);
            s.z = (pl.z || 0) + nz * (pl.r + SKIN);
            const vn = s.vx * nx + s.vz * nz;
            if (vn < 0) { s.vx -= 1.2 * vn * nx; s.vz -= 1.2 * vn * nz; }
            s.vx *= 0.3; s.vz *= 0.3;
            hit = true;
        }
    }
    if (hit) {
        s.wx *= 0.3;
        s.wy *= 0.3;
        if (!s.onWall) s.walls++;
    }
    s.onWall = hit;
}

function touchDown(s) {
    // Level, still facing where the nose was (or where it was going).
    const nose = rotate(s.q, [1, 0, 0]);
    const heading = Math.hypot(nose[0], nose[2]) > 0.2 ? Math.atan2(nose[2], nose[0]) : Math.atan2(s.vz, s.vx);
    s.q = headingQuat(heading);
    s.vy = 0;
    s.wx = s.wy = s.wz = 0;
    s.sliding = true;
    s.vx *= 0.5;
    s.vz *= 0.5;
    if (s.touch == null) s.touch = s.t;
}

function slide(s, p, dt, world) {
    const v = Math.hypot(s.vx, s.vz);
    const dv = ROOM.floorFriction * G * dt;
    if (v <= dv) { s.vx = 0; s.vz = 0; }
    else { s.vx *= (v - dv) / v; s.vz *= (v - dv) / v; }
    const prevX = s.x, prevZ = s.z;
    s.x += s.vx * dt;
    s.z += s.vz * dt;
    s.t += dt;
    if (s.pad != null) {
        // Sliding off the edge of a desk: back into the air, nose down.
        const pad = world.pads[s.pad];
        const [z0, z1] = deskSpan(pad);
        if (s.x > pad.x1 || s.x < pad.x0 || s.z > z1 || s.z < z0) {
            const nose = rotate(s.q, [1, 0, 0]);
            s.q = qmul(headingQuat(Math.atan2(nose[2], nose[0])), axis(0, 0, 1, -0.3));
            s.sliding = false;
            s.pad = null;
            s.vy = 0;
            return s;
        }
    } else {
        walls(s, world, prevX, prevZ);
    }
    if (s.vx === 0 && s.vz === 0) s.landed = true;
    return s;
}

/** A whole throw. `aim`: { angle, speed, yaw, bank } in degrees and m/s. */
export function fly3d(plane, aim, world = null, maxTime = 30) {
    const s = launch3d(plane, aim);
    const sample = () => [s.x, s.y, s.z, s.q[0], s.q[1], s.q[2], s.q[3]];
    const path = [sample()];
    let n = 0;
    while (!s.landed && s.t < maxTime) {
        step3d(s, plane, DT, world);
        if (++n % 6 === 0) path.push(sample());
    }
    path.push(sample());
    return {
        distance: Math.round(s.x * 100) / 100,
        offset: Math.round(s.z * 100) / 100,
        time: Math.round((s.touch ?? s.t) * 10) / 10,
        maxHeight: Math.round(s.maxY * 100) / 100,
        stalls: s.stalls,
        bonks: s.bonks,
        walls: s.walls,
        landedOn: s.pad,
        hoops: (world && world.hoops || []).map(h => throughHoop3d(path, h)),
        path,
    };
}

/** Did the path cross the hoop's plane (x = hoop.x) inside its ring? */
export function throughHoop3d(path, h) {
    for (let k = 1; k < path.length; k++) {
        const a = path[k - 1], b = path[k];
        if ((a[0] - h.x) * (b[0] - h.x) <= 0 && a[0] !== b[0]) {
            const f = (h.x - a[0]) / (b[0] - a[0]);
            const y = a[1] + (b[1] - a[1]) * f, z = a[2] + (b[2] - a[2]) * f;
            if (Math.hypot(y - h.y, z - (h.z || 0)) <= h.r) return true;
        }
    }
    return false;
}

/** The pose `t` seconds into a path: position lerped, orientation nlerped. */
export function samplePath(path, t) {
    const last = path.length - 1;
    const u = Math.max(0, t / SAMPLE3D);
    const i = Math.min(last, Math.floor(u));
    const j = Math.min(last, i + 1);
    const f = Math.min(1, u - i);
    const a = path[i], b = path[j];
    const s = a[3] * b[3] + a[4] * b[4] + a[5] * b[5] + a[6] * b[6] < 0 ? -1 : 1;
    const q = [0, 1, 2, 3].map(k => a[3 + k] + (s * b[3 + k] - a[3 + k]) * f);
    const L = Math.hypot(...q) || 1;
    return {
        x: a[0] + (b[0] - a[0]) * f,
        y: a[1] + (b[1] - a[1]) * f,
        z: a[2] + (b[2] - a[2]) * f,
        q: q.map(c => c / L),
        done: u >= last,
    };
}

/** Where a fly3d result came to rest, against a bin { x, z, width }. */
export function inBin3d(result, bin) {
    return Math.hypot(result.distance - bin.x, result.offset - (bin.z || 0)) <= bin.width / 2;
}

/* ── Missions only a 3D throw can do ──
   The 2D missions in flight.js still apply (their objects sit on the centre
   line). These need aiming sideways or a banked, curving throw; tests.html
   checks each can be done. */
export const MISSIONS3D = [
    { id: 'side', name: 'Off to the side', goal: 'Through the hoop off to the right at 5 m.', world: { hoops: [{ x: 5, y: 1.4, z: 1.2, r: 0.4 }] }, check: (r) => r.hoops[0] },
    { id: 'pillar', name: 'Round the pillar', goal: 'Curve it round the pillar into the bin at 11 m.', world: { pillars: [{ x: 6, z: 0.2, r: 0.3 }], bin: { x: 11, z: 0.4, width: 0.7 } }, check: (r, w) => inBin3d(r, w.bin) && !r.walls },
];
