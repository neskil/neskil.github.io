// Pocket Weather Terrarium — the jar. Everything is drawn on one canvas in a
// 400×560 "jar space" that is scaled to fit, so the scene is laid out once in
// fixed numbers and never has to think about screen sizes.
import {
    PRESETS, describe, sunElevation, sunAzimuthish, moonPhase, skyColours,
    guessPlace, forecastUrl, geocodeUrl, fromForecast, offlineGuess,
    localTime, nextSnowCover,
} from './weather.js';

const canvas = document.getElementById('jar');
const ctx = canvas.getContext('2d');
const el = (id) => document.getElementById(id);
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

const JW = 400, JH = 560;
const HORIZON = 372;      // where the far hills meet the sky
const GROUND = 430;       // top of the soil strata

/* ── State ── */
const state = {
    place: null,            // { name, lat, lon }
    live: null,             // the last real report, or an offline guess
    preset: null,           // a PRESETS id picked by hand, or null for live
    offline: false,
    warp: false,            // "watch a day": an hour a second
    warpHours: 0,
    snowCover: 0,
    gust: 0,                // a tap on the glass
    flash: 0,               // lightning
    nextBolt: 4,
    bolt: null,
};

function weather() {
    if (state.preset) {
        const p = PRESETS.find(x => x.id === state.preset);
        const w = describe(p.code);
        return { ...w, temp: p.id === 'snow' ? -3 : (state.live ? state.live.temp : 12), wind: p.id === 'storm' ? 9 : 3 };
    }
    return state.live || offlineGuess(new Date(), state.place ? state.place.lat : 59);
}

function simDate() {
    return new Date(Date.now() + state.warpHours * 3600000);
}

/* ── Seeded scenery ──
   Stars, cloud puffs, raindrops and the rest are placed from a fixed seed so
   the jar looks the same every visit; only the weather moves. */
function rng(seed) {
    let a = seed >>> 0;
    return () => {
        a = (a + 0x6D2B79F5) >>> 0;
        let t = Math.imul(a ^ (a >>> 15), a | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}
const R = rng(20261011);
const stars = Array.from({ length: 70 }, () => ({ x: 50 + R() * 300, y: 70 + R() * 260, r: 0.4 + R() * 1.1, p: R() * 6.28 }));
const clouds = Array.from({ length: 7 }, (_, i) => ({ x: R() * 520 - 60, y: 160 + R() * 110, s: 0.55 + R() * 0.45, puffs: Array.from({ length: 5 }, () => [R() * 60 - 30, R() * 16 - 8, 14 + R() * 16]), speed: 0.5 + R() * 0.8, layer: i % 2 }));
const drops = Array.from({ length: 220 }, () => ({ x: R() * 460 - 30, y: R() * 480, v: 0.8 + R() * 0.5 }));
const flakes = Array.from({ length: 160 }, () => ({ x: R() * 440 - 20, y: R() * 480, v: 0.6 + R() * 0.6, p: R() * 6.28, r: 1 + R() * 1.6 }));
const flies = Array.from({ length: 12 }, () => ({ x: 70 + R() * 260, y: 300 + R() * 110, p: R() * 6.28, q: R() * 6.28 }));
const condensation = Array.from({ length: 46 }, () => ({ x: 52 + R() * 296, y: 120 + R() * 300, r: 1 + R() * 2.6 }));
const pebbles = Array.from({ length: 60 }, () => ({ x: 46 + R() * 308, y: 504 + R() * 30, r: 2 + R() * 4, c: R() }));
const splashes = [];

/* ── Jar shape ── */
function jarPath() {
    const p = new Path2D();
    const x0 = 40, x1 = 360, y0 = 100, y1 = 540, r = 70;
    p.moveTo(120, 64);
    p.lineTo(280, 64);
    p.quadraticCurveTo(286, 64, 286, 72);
    p.lineTo(286, 82);
    p.bezierCurveTo(286, 96, x1, y0 - 4, x1, y0 + r);
    p.lineTo(x1, y1 - 30);
    p.quadraticCurveTo(x1, y1, x1 - 30, y1);
    p.lineTo(x0 + 30, y1);
    p.quadraticCurveTo(x0, y1, x0, y1 - 30);
    p.lineTo(x0, y0 + r);
    p.bezierCurveTo(x0, y0 - 4, 114, 96, 114, 82);
    p.lineTo(114, 72);
    p.quadraticCurveTo(114, 64, 120, 64);
    p.closePath();
    return p;
}
const JAR = jarPath();

const rgb = (c, a = 1) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;

/* ── Drawing ── */
let t = 0;

function drawSky(w, sun) {
    const g = ctx.createLinearGradient(0, 60, 0, HORIZON);
    g.addColorStop(0, rgb(sun.colours.top));
    g.addColorStop(1, rgb(sun.colours.horizon));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, JW, GROUND + 10);

    const night = 1 - sun.colours.daylight;
    const starA = night * (1 - Math.min(1, w.cloud * 1.1)) * (1 - w.fog);
    if (starA > 0.02) {
        for (const s of stars) {
            ctx.globalAlpha = starA * (0.55 + 0.45 * Math.sin(t * 1.7 + s.p));
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.r, 0, 6.283);
            ctx.fill();
        }
        ctx.globalAlpha = 1;
    }

    // Sun: along an arc from east to west, height from its real elevation.
    const cloudHide = 1 - Math.min(0.92, w.cloud * 0.9 + w.fog * 0.5);
    if (sun.el > -4) {
        const x = 200 + sun.az * 125;
        const y = HORIZON - 10 - Math.max(-12, sun.el) * 4.2;
        const warm = Math.max(0, Math.min(1, 1 - sun.el / 14));
        const core = [255, Math.round(240 - 70 * warm), Math.round(200 - 140 * warm)];
        const halo = ctx.createRadialGradient(x, y, 4, x, y, 70);
        halo.addColorStop(0, rgb(core, 0.55 * cloudHide));
        halo.addColorStop(1, rgb(core, 0));
        ctx.fillStyle = halo;
        ctx.fillRect(x - 70, y - 70, 140, 140);
        ctx.fillStyle = rgb(core, 0.95 * cloudHide + 0.05);
        ctx.beginPath();
        ctx.arc(x, y, 15, 0, 6.283);
        ctx.fill();
    }
    // Moon: the other half of the sky, drawn with its real phase.
    if (night > 0.25) {
        const x = 200 - sun.az * 110;
        const y = 150 + Math.abs(sun.az) * 40;
        const a = Math.min(1, (night - 0.25) * 2) * (1 - Math.min(0.85, w.cloud * 0.8));
        drawMoon(x, y, 12, sun.phase, a);
    }
}

function drawMoon(x, y, r, phase, a) {
    ctx.save();
    ctx.globalAlpha = a;
    const glow = ctx.createRadialGradient(x, y, r, x, y, r * 4);
    glow.addColorStop(0, 'rgba(220,230,255,0.25)');
    glow.addColorStop(1, 'rgba(220,230,255,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(x - r * 4, y - r * 4, r * 8, r * 8);
    ctx.fillStyle = '#e8ecf5';
    ctx.beginPath();
    ctx.arc(x, y, r, 0, 6.283);
    ctx.fill();
    // The shadow is a second disc slid across: none at full, all at new.
    const lit = 1 - Math.abs(phase - 0.5) * 2;   // 0 new .. 1 full
    const dir = phase < 0.5 ? -1 : 1;
    ctx.globalCompositeOperation = 'source-atop';
    ctx.fillStyle = 'rgba(14,18,40,0.88)';
    ctx.beginPath();
    ctx.arc(x + dir * r * 2 * lit, y, r * 1.02, 0, 6.283);
    ctx.fill();
    ctx.restore();
}

function drawClouds(w, sun, dt, layer) {
    if (w.cloud < 0.05) return;
    const shown = Math.ceil(clouds.length * Math.min(1, w.cloud + 0.15));
    const day = sun.colours.daylight;
    // Lit from above by day; at night only the faint glow of the sky behind.
    const base = w.storm ? [Math.round(40 + 40 * day), Math.round(42 + 42 * day), Math.round(52 + 44 * day)]
        : [Math.round(44 + 200 * day), Math.round(48 + 196 * day), Math.round(66 + 186 * day)];
    for (let k = 0; k < shown; k++) {
        const c = clouds[k];
        if (c.layer !== layer) continue;
        c.x += (0.6 + w.wind * 0.9) * c.speed * dt * (reduceMotion.matches ? 0.2 : 1);
        if (c.x > 470) c.x = -70;
        const y = c.y - (w.cloud > 0.8 ? 20 : 0);
        ctx.fillStyle = rgb(base, 0.5 + 0.4 * w.cloud);
        for (const [dx, dy, r] of c.puffs) {
            ctx.beginPath();
            ctx.arc(c.x + dx * c.s, y + dy * c.s, r * c.s * (0.8 + w.cloud * 0.5), 0, 6.283);
            ctx.fill();
        }
    }
}

function shade(c, k) { return [c[0] * k, c[1] * k, c[2] * k].map(Math.round); }

function drawLand(w, sun) {
    const day = 0.3 + 0.7 * sun.colours.daylight;
    const snow = state.snowCover;
    const tint = (c) => {
        const d = shade(c, day);
        return snow > 0 ? [0, 1, 2].map(i => Math.round(d[i] + ((235 * day) - d[i]) * snow * 0.85)) : d;
    };
    // Far hills.
    ctx.fillStyle = rgb(tint([62, 104, 92]));
    ctx.beginPath();
    ctx.moveTo(0, HORIZON + 6);
    ctx.bezierCurveTo(80, 330, 150, 350, 210, 360);
    ctx.bezierCurveTo(270, 340, 330, 320, 400, 352);
    ctx.lineTo(400, GROUND);
    ctx.lineTo(0, GROUND);
    ctx.fill();
    // Near meadow, rolling up to the cabin on the right.
    ctx.fillStyle = rgb(tint([64, 132, 76]));
    ctx.beginPath();
    ctx.moveTo(0, 410);
    ctx.bezierCurveTo(90, 380, 160, 400, 230, 396);
    ctx.bezierCurveTo(290, 392, 330, 372, 400, 380);
    ctx.lineTo(400, GROUND + 4);
    ctx.lineTo(0, GROUND + 4);
    ctx.fill();

    // Pond, with the sky in it.
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(118, 414, 46, 9, 0, 0, 6.283);
    ctx.clip();
    const g = ctx.createLinearGradient(0, 405, 0, 424);
    g.addColorStop(0, rgb(sun.colours.horizon, 0.95));
    g.addColorStop(1, rgb(shade(sun.colours.top, 0.8), 0.95));
    ctx.fillStyle = state.snowCover > 0.6 && (w.temp ?? 5) < 0 ? rgb(shade([200, 220, 235], day)) : g;
    ctx.fillRect(60, 400, 120, 30);
    ctx.restore();
}

function drawCabin(w, sun) {
    const day = 0.3 + 0.7 * sun.colours.daylight;
    const x = 290, y = 376;
    ctx.fillStyle = rgb(shade([140, 78, 52], day));
    ctx.fillRect(x - 20, y - 18, 40, 22);
    ctx.fillStyle = rgb(shade([80, 44, 36], day));
    ctx.beginPath();
    ctx.moveTo(x - 26, y - 16);
    ctx.lineTo(x, y - 36);
    ctx.lineTo(x + 26, y - 16);
    ctx.fill();
    if (state.snowCover > 0.05) {
        ctx.fillStyle = `rgba(245,248,255,${Math.min(1, state.snowCover * 1.4)})`;
        ctx.beginPath();
        ctx.moveTo(x - 27, y - 15);
        ctx.lineTo(x, y - 37);
        ctx.lineTo(x + 27, y - 15);
        ctx.lineTo(x + 22, y - 18);
        ctx.lineTo(x, y - 32);
        ctx.lineTo(x - 22, y - 18);
        ctx.fill();
    }
    // The window is lit once it is dark enough to want a lamp.
    const lamp = Math.max(0, Math.min(1, (0.55 - sun.colours.daylight) * 3 + w.cloud * 0.2));
    ctx.fillStyle = lamp > 0.05 ? `rgba(255, 196, 92, ${0.35 + lamp * 0.65})` : rgb(shade([60, 70, 90], day));
    ctx.fillRect(x - 12, y - 11, 8, 7);
    ctx.fillStyle = rgb(shade([60, 34, 28], day));
    ctx.fillRect(x + 4, y - 10, 8, 14);
    if (lamp > 0.05) {
        const glow = ctx.createRadialGradient(x - 8, y - 7, 2, x - 8, y - 7, 34);
        glow.addColorStop(0, `rgba(255,190,90,${0.35 * lamp})`);
        glow.addColorStop(1, 'rgba(255,190,90,0)');
        ctx.fillStyle = glow;
        ctx.fillRect(x - 42, y - 41, 68, 68);
    }
    // Chimney smoke when it is cold.
    if ((w.temp ?? 10) < 12) {
        for (let k = 0; k < 5; k++) {
            const f = ((t * 0.25 + k / 5) % 1);
            ctx.fillStyle = `rgba(200,205,215,${0.28 * (1 - f)})`;
            ctx.beginPath();
            ctx.arc(x + 12 + f * (8 + w.wind * 4), y - 38 - f * 46, 3 + f * 7, 0, 6.283);
            ctx.fill();
        }
    }
    ctx.fillStyle = rgb(shade([90, 60, 50], day));
    ctx.fillRect(x + 9, y - 34, 6, 10);
}

function drawTree(w, sun) {
    const day = 0.3 + 0.7 * sun.colours.daylight;
    const sway = (Math.sin(t * (1.2 + w.wind * 0.12)) * 0.5 + 0.5) * (0.01 + w.wind * 0.012) + state.gust * 0.12;
    const bark = rgb(shade([92, 62, 44], day));
    ctx.strokeStyle = bark;
    ctx.lineCap = 'round';
    const leaves = [];
    function branch(x, y, len, ang, depth) {
        const a = ang + sway * (6 - depth) * 0.35;
        const x2 = x + Math.sin(a) * len, y2 = y - Math.cos(a) * len;
        ctx.lineWidth = Math.max(1, depth * 1.6);
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        if (depth <= 1) { leaves.push([x2, y2]); return; }
        branch(x2, y2, len * 0.74, a - 0.42, depth - 1);
        branch(x2, y2, len * 0.7, a + 0.38, depth - 1);
        if (depth === 4) branch(x2, y2, len * 0.6, a + 0.02, depth - 2);
    }
    branch(206, 400, 34, -0.04, 5);
    // Foliage thins out in the snow, and goes autumnal below ten degrees.
    const cold = (w.temp ?? 12) < 10 ? Math.min(1, (10 - (w.temp ?? 12)) / 12) : 0;
    const leaf = [Math.round(70 + 150 * cold), Math.round(150 - 40 * cold), Math.round(80 - 40 * cold)];
    const keep = 1 - Math.min(0.8, state.snowCover);
    leaves.forEach(([x, y], i) => {
        if ((i * 37 % 100) / 100 > keep) return;
        ctx.fillStyle = rgb(shade(leaf, day), 0.85);
        ctx.beginPath();
        ctx.arc(x, y, 7.5, 0, 6.283);
        ctx.fill();
        if (state.snowCover > 0.15) {
            ctx.fillStyle = `rgba(245,248,255,${state.snowCover * 0.8})`;
            ctx.beginPath();
            ctx.arc(x, y - 3, 5, Math.PI, 0);
            ctx.fill();
        }
    });
}

function drawMushrooms(sun) {
    const day = 0.3 + 0.7 * sun.colours.daylight;
    for (const [x, y, s] of [[66, 420, 1], [78, 423, 0.7], [338, 412, 0.85]]) {
        ctx.fillStyle = rgb(shade([236, 226, 210], day));
        ctx.fillRect(x - 1.5 * s, y - 6 * s, 3 * s, 7 * s);
        ctx.fillStyle = rgb(shade([214, 60, 52], day));
        ctx.beginPath();
        ctx.arc(x, y - 6 * s, 6 * s, Math.PI, 0);
        ctx.fill();
        ctx.fillStyle = rgb(shade([250, 240, 230], day));
        ctx.fillRect(x - 3 * s, y - 9 * s, 1.6 * s, 1.6 * s);
        ctx.fillRect(x + 1.5 * s, y - 8 * s, 1.4 * s, 1.4 * s);
    }
}

function drawStrata(sun) {
    const day = 0.35 + 0.65 * sun.colours.daylight;
    const layers = [[GROUND, 470, [70, 48, 34]], [470, 500, [40, 34, 32]], [500, 545, [120, 112, 100]]];
    for (const [a, b, c] of layers) {
        ctx.fillStyle = rgb(shade(c, day));
        ctx.fillRect(0, a, JW, b - a);
    }
    for (const p of pebbles) {
        ctx.fillStyle = rgb(shade(p.c < 0.5 ? [150, 142, 128] : [104, 98, 90], day));
        ctx.beginPath();
        ctx.ellipse(p.x, p.y, p.r, p.r * 0.75, 0, 0, 6.283);
        ctx.fill();
    }
    // Charcoal flecks.
    ctx.fillStyle = rgb(shade([22, 20, 20], day));
    for (let k = 0; k < 30; k++) ctx.fillRect(50 + (k * 97) % 300, 474 + (k * 13) % 22, 3, 2);
}

function drawRain(w, dt) {
    if (w.rain <= 0) return;
    const n = Math.round(drops.length * w.rain);
    const slant = w.wind * 0.9 + state.gust * 8;
    ctx.strokeStyle = 'rgba(190,210,240,0.55)';
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    for (let k = 0; k < n; k++) {
        const d = drops[k];
        d.y += 520 * d.v * dt;
        d.x += slant * 18 * dt;
        if (d.y > 420 + (k % 5) * 3) {
            if (splashes.length < 60 && k % 3 === 0) splashes.push({ x: d.x, y: 418 + (k % 5) * 3, a: 1 });
            d.y = 60 - (k % 40);
            d.x = R() * 460 - 30;
        }
        ctx.moveTo(d.x, d.y);
        ctx.lineTo(d.x - slant * 1.4, d.y - 12 * d.v);
    }
    ctx.stroke();
}

function drawSplashes(dt) {
    for (let k = splashes.length - 1; k >= 0; k--) {
        const s = splashes[k];
        s.a -= dt * 3;
        if (s.a <= 0) { splashes.splice(k, 1); continue; }
        ctx.strokeStyle = `rgba(200,220,250,${s.a * 0.6})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.ellipse(s.x, s.y, (1 - s.a) * 5 + 1, (1 - s.a) * 1.5 + 0.5, 0, 0, 6.283);
        ctx.stroke();
    }
}

function drawSnow(w, dt) {
    if (w.snow <= 0) return;
    const n = Math.round(flakes.length * w.snow);
    ctx.fillStyle = 'rgba(250,252,255,0.9)';
    for (let k = 0; k < n; k++) {
        const f = flakes[k];
        f.y += 46 * f.v * dt;
        f.x += (Math.sin(t * 1.3 + f.p) * 12 + w.wind * 6 + state.gust * 70) * dt;
        if (f.y > 424) { f.y = 60; f.x = R() * 440 - 20; }
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.r, 0, 6.283);
        ctx.fill();
    }
}

function drawFog(w) {
    if (w.fog <= 0) return;
    for (let k = 0; k < 4; k++) {
        const y = 300 + k * 32;
        const x = ((t * (6 + k * 3)) % 200) - 100;
        const g = ctx.createLinearGradient(0, y - 30, 0, y + 30);
        g.addColorStop(0, 'rgba(210,215,225,0)');
        g.addColorStop(0.5, `rgba(210,215,225,${0.32 * w.fog})`);
        g.addColorStop(1, 'rgba(210,215,225,0)');
        ctx.fillStyle = g;
        ctx.fillRect(x - 100, y - 30, 700, 60);
    }
    ctx.fillStyle = `rgba(200,206,216,${0.22 * w.fog})`;
    ctx.fillRect(0, 60, JW, GROUND - 60);
}

function drawFireflies(w, sun) {
    const night = 1 - sun.colours.daylight;
    if (night < 0.6 || w.rain > 0 || w.snow > 0 || (w.temp ?? 15) < 10) return;
    for (const f of flies) {
        const x = f.x + Math.sin(t * 0.6 + f.p) * 16;
        const y = f.y + Math.cos(t * 0.45 + f.q) * 10;
        const a = (Math.sin(t * 2.4 + f.p * 3) * 0.5 + 0.5) * (night - 0.6) * 2.5;
        const g = ctx.createRadialGradient(x, y, 0, x, y, 7);
        g.addColorStop(0, `rgba(230,255,140,${a})`);
        g.addColorStop(1, 'rgba(230,255,140,0)');
        ctx.fillStyle = g;
        ctx.fillRect(x - 7, y - 7, 14, 14);
    }
}

function drawStorm(w, dt) {
    if (!w.storm || reduceMotion.matches) { state.flash = 0; return; }
    state.nextBolt -= dt;
    if (state.nextBolt <= 0) {
        state.flash = 1;
        state.nextBolt = 3 + Math.random() * 6;
        // A jagged bolt from a cloud down to the far hills.
        const pts = [[90 + Math.random() * 220, 120]];
        while (pts[pts.length - 1][1] < 340) {
            const [x, y] = pts[pts.length - 1];
            pts.push([x + (Math.random() - 0.5) * 34, y + 16 + Math.random() * 18]);
        }
        state.bolt = pts;
    }
    if (state.flash > 0) {
        if (state.bolt && state.flash > 0.6) {
            ctx.strokeStyle = `rgba(240,245,255,${state.flash})`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            state.bolt.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
            ctx.stroke();
        }
        ctx.fillStyle = `rgba(220,230,255,${state.flash * 0.35})`;
        ctx.fillRect(0, 0, JW, JH);
        state.flash = Math.max(0, state.flash - dt * 2.6);
    }
}

function drawGlass(w) {
    // Condensation on the inside when it is wet or foggy out.
    const damp = Math.min(1, w.rain * 0.8 + w.fog);
    if (damp > 0.05) {
        for (const d of condensation) {
            ctx.fillStyle = `rgba(230,240,255,${0.18 * damp})`;
            ctx.beginPath();
            ctx.arc(d.x, d.y, d.r, 0, 6.283);
            ctx.fill();
            ctx.fillStyle = `rgba(255,255,255,${0.35 * damp})`;
            ctx.beginPath();
            ctx.arc(d.x - d.r * 0.3, d.y - d.r * 0.3, d.r * 0.35, 0, 6.283);
            ctx.fill();
        }
    }
}

function drawJarFront() {
    // Rim, then the two long highlights that make it read as glass.
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'rgba(200,225,240,0.45)';
    ctx.stroke(JAR);
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.stroke(JAR);
    ctx.save();
    ctx.clip(JAR);
    const hl = ctx.createLinearGradient(52, 0, 96, 0);
    hl.addColorStop(0, 'rgba(255,255,255,0)');
    hl.addColorStop(0.5, 'rgba(255,255,255,0.11)');
    hl.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = hl;
    ctx.fillRect(52, 140, 44, 360);
    const hl2 = ctx.createLinearGradient(318, 0, 334, 0);
    hl2.addColorStop(0, 'rgba(255,255,255,0)');
    hl2.addColorStop(0.5, 'rgba(255,255,255,0.06)');
    hl2.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = hl2;
    ctx.fillRect(318, 160, 16, 300);
    // The glass is a little green at its edges, like real jar glass.
    const edge = ctx.createRadialGradient(200, 320, 140, 200, 320, 260);
    edge.addColorStop(0, 'rgba(160,220,200,0)');
    edge.addColorStop(1, 'rgba(160,220,200,0.12)');
    ctx.fillStyle = edge;
    ctx.fillRect(0, 0, JW, JH);
    ctx.restore();

    // Cork.
    const cork = ctx.createLinearGradient(0, 30, 0, 70);
    cork.addColorStop(0, '#c99a64');
    cork.addColorStop(1, '#8c6238');
    ctx.fillStyle = cork;
    ctx.beginPath();
    ctx.roundRect(122, 30, 156, 40, 8);
    ctx.fill();
    ctx.fillStyle = 'rgba(70,40,20,0.35)';
    for (let k = 0; k < 24; k++) ctx.fillRect(130 + (k * 53) % 140, 36 + (k * 17) % 28, 2, 2);
    // A paper tag on string, with the place on it.
    ctx.strokeStyle = 'rgba(230,220,200,0.7)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(272, 54);
    ctx.quadraticCurveTo(300, 70, 312, 92);
    ctx.stroke();
    ctx.save();
    ctx.translate(318, 104);
    ctx.rotate(0.18 + Math.sin(t * 0.9) * 0.03);
    ctx.fillStyle = '#efe6d2';
    ctx.beginPath();
    ctx.roundRect(-8, -12, 74, 26, 4);
    ctx.fill();
    ctx.fillStyle = '#4a3a2a';
    ctx.font = '600 11px Outfit, sans-serif';
    ctx.textBaseline = 'middle';
    const name = state.place ? state.place.name : '…';
    ctx.fillText(name.length > 11 ? name.slice(0, 10) + '…' : name, -2, 1);
    ctx.restore();
}

function frame(dt) {
    const w = weather();
    const date = simDate();
    const lat = state.place ? state.place.lat : 59.33, lon = state.place ? state.place.lon : 18.07;
    const offset = (state.live && state.live.utcOffset != null) ? state.live.utcOffset : -new Date().getTimezoneOffset() * 60;
    const elev = sunElevation(date, lat, lon);
    const sun = { el: elev, az: sunAzimuthish(date, lon, offset), phase: moonPhase(date), colours: skyColours(elev, w) };

    state.snowCover = nextSnowCover(state.snowCover, w, dt * (state.warp ? 20 : 4));
    state.gust = Math.max(0, state.gust - dt * 0.8);

    // Shelf shadow and the jar's back.
    ctx.clearRect(0, 0, JW, JH);
    const shadow = ctx.createRadialGradient(200, 548, 20, 200, 548, 200);
    shadow.addColorStop(0, 'rgba(0,0,0,0.5)');
    shadow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = shadow;
    ctx.fillRect(0, 520, JW, 40);

    ctx.save();
    ctx.clip(JAR);
    drawSky(w, sun);
    drawClouds(w, sun, dt, 0);
    drawStorm(w, dt);
    drawLand(w, sun);
    drawCabin(w, sun);
    drawTree(w, sun);
    drawMushrooms(sun);
    drawClouds(w, sun, dt, 1);
    drawFog(w);
    drawRain(w, dt);
    drawSplashes(dt);
    drawSnow(w, dt);
    drawFireflies(w, sun);
    drawStrata(sun);
    drawGlass(w);
    ctx.restore();
    drawJarFront();

    updateCard(w, date, offset, elev);
}

/* ── The card under the jar ── */
let lastCard = '';
function updateCard(w, date, offset, elev) {
    const temp = w.temp == null ? '—' : Math.round(w.temp) + '°';
    const time = localTime(date, offset);
    const src = state.preset ? 'picked by hand' : state.offline ? 'offline guess' : 'live';
    const key = [state.place && state.place.name, temp, w.label, time, src, Math.round(w.wind)].join('|');
    if (key === lastCard) return;
    lastCard = key;
    el('place').textContent = state.place ? state.place.name : 'Finding your sky…';
    el('temp').textContent = temp;
    el('cond').textContent = w.label;
    el('clock').textContent = time + (state.warp ? ' ⏩' : '');
    el('wind').textContent = `${Math.round(w.wind)} m/s wind`;
    el('source').textContent = src;
    el('source').dataset.kind = state.preset ? 'hand' : state.offline ? 'offline' : 'live';
    el('sunline').textContent = elev > 0 ? `sun ${Math.round(elev)}° up` : elev > -6 ? 'twilight' : 'night';
}

/* ── Fetching ── */
async function loadWeather() {
    if (!state.place) return;
    try {
        const res = await fetch(forecastUrl(state.place.lat, state.place.lon));
        if (!res.ok) throw new Error(res.status);
        state.live = fromForecast(await res.json());
        state.offline = false;
    } catch (e) {
        state.live = offlineGuess(new Date(), state.place.lat);
        state.offline = true;
    }
    lastCard = '';
}

function setPlace(place, remember = true) {
    state.place = place;
    if (remember) {
        try { localStorage.setItem('terrarium.place', JSON.stringify(place)); } catch (e) { /* not remembered */ }
    }
    lastCard = '';
    loadWeather();
}

el('locate').addEventListener('click', () => {
    if (!navigator.geolocation) return;
    el('locate').textContent = '📍 Locating…';
    navigator.geolocation.getCurrentPosition(async (pos) => {
        const { latitude: lat, longitude: lon } = pos.coords;
        el('locate').textContent = '📍 My location';
        setPlace({ name: 'Your sky', lat, lon });
    }, () => {
        el('locate').textContent = '📍 Location blocked';
    }, { timeout: 10000, maximumAge: 600000 });
});

el('search').addEventListener('submit', async (e) => {
    e.preventDefault();
    const q = el('city').value.trim();
    if (!q) return;
    el('city').blur();
    try {
        const res = await fetch(geocodeUrl(q));
        const json = await res.json();
        const hit = json.results && json.results[0];
        if (!hit) { el('city').value = ''; el('city').placeholder = `No place called “${q}”`; return; }
        el('city').value = '';
        el('city').placeholder = 'Another city…';
        setPlace({ name: hit.name, lat: hit.latitude, lon: hit.longitude });
    } catch (err) {
        el('city').placeholder = 'Search needs a connection';
        el('city').value = '';
    }
});

/* ── Weather chips ── */
const chips = el('chips');
const live = document.createElement('button');
live.type = 'button';
live.className = 'chip';
live.dataset.preset = '';
live.textContent = '📡 Live';
chips.appendChild(live);
for (const p of PRESETS) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'chip';
    b.dataset.preset = p.id;
    b.textContent = `${p.emoji} ${p.label}`;
    chips.appendChild(b);
}
function setPreset(id) {
    state.preset = id || null;
    chips.querySelectorAll('.chip').forEach(b => b.setAttribute('aria-pressed', String((b.dataset.preset || null) === state.preset)));
    lastCard = '';
}
chips.addEventListener('click', (e) => {
    const b = e.target.closest('.chip');
    if (b) setPreset(b.dataset.preset);
});
setPreset(null);

el('warp').addEventListener('click', () => {
    state.warp = !state.warp;
    el('warp').setAttribute('aria-pressed', String(state.warp));
    if (!state.warp) state.warpHours = 0;
    lastCard = '';
});

// A tap on the glass is a gust: the tree bends, the rain and snow swirl.
canvas.addEventListener('pointerdown', () => { state.gust = 1; });

/* ── Sizing and the loop ── */
function fit() {
    const box = canvas.parentElement.getBoundingClientRect();
    const scale = Math.min(box.width / JW, box.height / JH);
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.style.width = Math.floor(JW * scale) + 'px';
    canvas.style.height = Math.floor(JH * scale) + 'px';
    canvas.width = Math.floor(JW * scale * dpr);
    canvas.height = Math.floor(JH * scale * dpr);
    ctx.setTransform(scale * dpr, 0, 0, scale * dpr, 0, 0);
}
new ResizeObserver(fit).observe(canvas.parentElement);
fit();

let last = performance.now();
function loop(now) {
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    t += dt;
    if (state.warp) state.warpHours += dt;   // an hour a second
    frame(dt);
    requestAnimationFrame(loop);
}

/* ── Start ── */
(function start() {
    const params = new URLSearchParams(location.search);
    if (params.get('weather') && PRESETS.some(p => p.id === params.get('weather'))) setPreset(params.get('weather'));
    if (params.get('hours')) state.warpHours = +params.get('hours') || 0;
    // ?at=2026-10-12T15:45Z pins the jar to a moment, for screenshots.
    if (params.get('at') && !isNaN(Date.parse(params.get('at')))) state.warpHours = (Date.parse(params.get('at')) - Date.now()) / 3600000;
    if (params.get('snow')) state.snowCover = Math.min(1, +params.get('snow') || 0);
    let saved = null;
    try { saved = JSON.parse(localStorage.getItem('terrarium.place')); } catch (e) { /* none */ }
    const lat = parseFloat(params.get('lat')), lon = parseFloat(params.get('lon'));
    if (Number.isFinite(lat) && Number.isFinite(lon)) setPlace({ name: params.get('name') || 'Somewhere', lat, lon }, false);
    else if (saved && Number.isFinite(saved.lat)) setPlace(saved, false);
    else setPlace(guessPlace(Intl.DateTimeFormat().resolvedOptions().timeZone), false);
    setInterval(loadWeather, 10 * 60 * 1000);
    requestAnimationFrame(loop);
})();
