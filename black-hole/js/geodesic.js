// Light round a Schwarzschild black hole. No DOM, no WebGL: tests.html imports
// this directly, and the fragment shader in app.js integrates the same equation.
//
// Units: the Schwarzschild radius r_s is 1 and so is c. In those units a
// photon's path obeys  u'' + u = (3/2) u^2  with u = 1/r, which is exactly the
// orbit of a particle under the central acceleration
//
//     a = -(3/2) h^2 x / r^5,        h = |x × v|  (conserved)
//
// so bending light is a three-line force law rather than a metric.

export const R_HORIZON = 1;
export const R_PHOTON = 1.5;                    // light can circle here, unstably
export const R_ISCO = 3;                        // innermost stable circular orbit
export const B_CRIT = 3 * Math.sqrt(3) / 2;     // aim closer than this and you are caught

export function accel(x, y, h2) {
    const r2 = x * x + y * y;
    const k = -1.5 * h2 / (r2 * r2 * Math.sqrt(r2));
    return [k * x, k * y];
}

// One RK4 step of the planar path. s = [x, y, vx, vy].
function rk4(s, h2, dt) {
    const f = (x, y, vx, vy) => { const a = accel(x, y, h2); return [vx, vy, a[0], a[1]]; };
    const k1 = f(s[0], s[1], s[2], s[3]);
    const k2 = f(s[0] + k1[0] * dt / 2, s[1] + k1[1] * dt / 2, s[2] + k1[2] * dt / 2, s[3] + k1[3] * dt / 2);
    const k3 = f(s[0] + k2[0] * dt / 2, s[1] + k2[1] * dt / 2, s[2] + k2[2] * dt / 2, s[3] + k2[3] * dt / 2);
    const k4 = f(s[0] + k3[0] * dt, s[1] + k3[1] * dt, s[2] + k3[2] * dt, s[3] + k3[3] * dt);
    return [0, 1, 2, 3].map(i => s[i] + dt / 6 * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]));
}

// Fire a photon along +x from (-start, b). Returns where it went.
//   captured    crossed the horizon
//   deflection  total turn towards the hole, radians (can exceed 2π near B_CRIT)
//   rMin        closest approach
//   points      the path, for drawing (omitted with keepPath: false)
export function trace(b, { start = 40, step = 0.02, maxSteps = 60000, keepPath = true } = {}) {
    let s = [-start, b, 1, 0];
    const h2 = b * b;                            // |x × v|² with v = (1, 0)
    const rEsc = Math.hypot(start, b) * 1.001;
    const points = keepPath ? [[s[0], s[1]]] : null;
    let rMin = Math.hypot(s[0], s[1]), turn = 0, captured = false, steps = 0;
    let ang = Math.atan2(s[3], s[2]);
    for (; steps < maxSteps; steps++) {
        const r = Math.hypot(s[0], s[1]);
        if (r < rMin) rMin = r;
        if (r <= R_HORIZON) { captured = true; break; }
        if (r > rEsc && s[0] * s[2] + s[1] * s[3] > 0) break;
        s = rk4(s, h2, Math.max(0.002, step * r));
        const a = Math.atan2(s[3], s[2]);
        let d = a - ang;
        if (d > Math.PI) d -= 2 * Math.PI; else if (d < -Math.PI) d += 2 * Math.PI;
        turn += d; ang = a;
        if (keepPath) points.push([s[0], s[1]]);
    }
    return { captured, deflection: -Math.sign(b || 1) * turn, rMin, points, steps, h2, end: s };
}

// ── What the numbers mean for a hole of a given mass ──
const C = 299792458;
export const RS_KM_PER_SUN = 2.953250;           // 2GM☉/c² in km
export const rsKm = (suns) => RS_KM_PER_SUN * suns;
export const rsSeconds = (suns) => rsKm(suns) * 1000 / C;      // light-crossing time of r_s

// Rate of a clock hovering at r, against one far away.
export const clockRate = (r) => r > 1 ? Math.sqrt(1 - 1 / r) : 0;
// Speed of a circular orbit at r as a hovering observer there measures it (c = 1).
export const orbitSpeed = (r) => Math.sqrt(0.5 / (r - 1));
// Period of a circular orbit at r, on a far-away clock, in units of r_s/c.
export const orbitPeriod = (r) => 2 * Math.PI * Math.sqrt(2 * r * r * r);
// The shadow a distant viewer sees is wider than the horizon: 2·B_CRIT across.
export const shadowDiameter = () => 2 * B_CRIT;
export const hawkingKelvin = (suns) => 6.169e-8 / suns;

// Redshift factor g = observed/emitted frequency for disc gas at radius r whose
// direction of motion makes cos(angle) = cosTo with the ray leaving for the
// viewer. Brightness goes as g⁴: this is why one side of the disc outshines the other.
export function discShift(r, cosTo) {
    const beta = orbitSpeed(r), gamma = 1 / Math.sqrt(1 - beta * beta);
    return Math.sqrt(1 - 1 / r) / (gamma * (1 - beta * cosTo));
}

// Human-sized formatting for lengths in km and times in seconds.
export function fmtLength(km) {
    const AU = 149597870.7, LY = 9.4607e12;
    if (km < 1) return (km * 1000).toPrecision(3) + ' m';
    if (km < 1e6) return sig(km) + ' km';
    if (km < 0.1 * AU) return sig(km / 1e6) + ' million km';
    if (km < 0.05 * LY) return sig(km / AU) + ' AU';
    return sig(km / LY) + ' light-years';
}
export function fmtTime(s) {
    if (s < 1e-3) return sig(s * 1e6) + ' µs';
    if (s < 1) return sig(s * 1e3) + ' ms';
    if (s < 120) return sig(s) + ' s';
    if (s < 7200) return sig(s / 60) + ' min';
    if (s < 172800) return sig(s / 3600) + ' hours';
    if (s < 3.15576e7 * 2) return sig(s / 86400) + ' days';
    return sig(s / 3.15576e7) + ' years';
}
function sig(x) {
    if (x >= 1000) return Math.round(x).toLocaleString('en-US');
    return String(+x.toPrecision(3));
}
