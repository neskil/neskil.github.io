// Paper Plane Glider — the flight in 3D. No DOM.
//
// The contract the 3D view codes against; see PLAN.md → "The contract" for
// the axes and the world objects. For now fly3d flies the 2D side-on model
// (flight.js) and lifts its path into 3D on the centre line, so the view can
// be built before the 6-DOF model lands; aim.yaw and aim.bank are accepted
// but not yet used.

import { DT, ROOM, fly } from './flight.js';

export const ROOM3D = { length: 24, width: 6, ceiling: ROOM.ceiling, release: ROOM.release };
export const AIM_LIMITS = { angle: [-15, 60], speed: [2, 12], yaw: [-35, 35], bank: [-45, 45] };
export const SAMPLE3D = DT * 6;

/** A whole throw. `aim`: { angle, speed, yaw, bank } in degrees and m/s. */
export function fly3d(plane, aim, world = null, maxTime = 30) {
    const r = fly(plane, aim.angle, aim.speed, world, maxTime);
    return {
        ...r,
        offset: 0,
        walls: 0,
        path: r.path.map(([x, y, pitch]) => [x, y, 0, Math.cos(pitch / 2), 0, 0, Math.sin(pitch / 2)]),
    };
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
