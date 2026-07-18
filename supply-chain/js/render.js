// Canvas rendering — isometric ("2.5D") view.
//
// Game logic stays in flat world (x, y); this module projects that ground
// plane to the screen through SC.camera and draws everything in screen
// pixels: the land, river and roads are projected polygons/ribbons lying on
// the iso plane, while buildings are extruded diamond prisms and trucks /
// labels / order bubbles are upright billboards anchored to a projected
// ground point. Buildings + trucks are depth-sorted (back-to-front by world
// x+y) so nearer things correctly overlap farther ones.
window.SC = window.SC || {};

SC.render = (function() {
    let canvas = null, ctx = null, dpr = 1;
    let seaTime = 0;
    let floaters = []; // rising "+$x"/"−$x" texts, world-anchored
    let frameHoverNode = null; // node under the pointer, refreshed once per frame

    const ISO = SC.camera.ISO;

    function addFloater(x, y, text, color) {
        floaters.push({ x, y, text, color, t: 0 });
    }

    function attach(cv) {
        canvas = cv;
        ctx = canvas.getContext('2d');
        resize();
        window.addEventListener('resize', resize);

        SC.on('orderComplete', o => {
            addFloater(o.city.x, o.city.y - 24, `+$${o.payout}`, '#34d399');
            addBurst(o.city.x, o.city.y - 18);
        });
        SC.on('roadBuilt', e => addFloater((e.a.x + e.b.x) / 2, (e.a.y + e.b.y) / 2, `−$${e.cost}`, '#f87171'));
        SC.on('roadDemolished', d => addFloater((d.edge.a.x + d.edge.b.x) / 2, (d.edge.a.y + d.edge.b.y) / 2, `+$${d.refund}`, '#34d399'));
        SC.on('sitePurchased', d => addFloater(d.node.x, d.node.y - 24, `−$${d.price}`, '#f87171'));
        SC.on('truckBought', d => addFloater(d.truck.x, d.truck.y - 24, `−$${d.price}`, '#f87171'));
        SC.on('sitePlaced', d => addFloater(d.node.x, d.node.y - 24, `−$${d.cost}`, '#f87171'));
    }

    function resize() {
        // Cap at 2: 3x-dpr phones quadruple the fill cost for no visible
        // gain on a moving map, and that fill cost is what makes panning
        // stutter on mobile.
        dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = window.innerWidth * dpr;
        canvas.height = window.innerHeight * dpr;
        canvas.style.width = window.innerWidth + 'px';
        canvas.style.height = window.innerHeight + 'px';
        SC.camera.setViewport(window.innerWidth, window.innerHeight);
    }

    // --- color helpers ------------------------------------------------------
    function hexToRgb(hex) {
        // Accept both '#rrggbb' and 'rgb(r, g, b)' so mix()/shade() output can
        // be fed back in (the day/night sky blends colours in several steps).
        if (hex[0] !== '#') {
            const m = hex.match(/-?\d+/g);
            return { r: +m[0], g: +m[1], b: +m[2] };
        }
        const h = hex.replace('#', '');
        return { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16) };
    }
    // amt in [-1, 1]: negative darkens toward black, positive lightens toward white
    function shade(hex, amt) {
        const c = hexToRgb(hex);
        const mix = amt < 0 ? 0 : 255;
        const t = Math.abs(amt);
        const r = Math.round(c.r + (mix - c.r) * t);
        const g = Math.round(c.g + (mix - c.g) * t);
        const b = Math.round(c.b + (mix - c.b) * t);
        return `rgb(${r}, ${g}, ${b})`;
    }
    function rgba(hex, a) {
        const c = hexToRgb(hex);
        return `rgba(${c.r}, ${c.g}, ${c.b}, ${a})`;
    }

    function zoom() { return SC.camera.cam.zoom; }
    function S(wx, wy) { return SC.camera.toScreen(wx, wy); }

    // lerp between two hex colors, t in [0,1]
    function mix(a, b, t) {
        const ca = hexToRgb(a), cb = hexToRgb(b);
        return `rgb(${Math.round(ca.r + (cb.r - ca.r) * t)}, ${Math.round(ca.g + (cb.g - ca.g) * t)}, ${Math.round(ca.b + (cb.b - ca.b) * t)})`;
    }

    // Tiny deterministic PRNG (mulberry32) so scenery (mountains, trees,
    // terrain patches) is stable frame-to-frame instead of flickering.
    function makeRng(seed) {
        let a = seed >>> 0;
        return function() {
            a = (a + 0x6D2B79F5) | 0;
            let t = Math.imul(a ^ (a >>> 15), 1 | a);
            t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
    }

    // --- primitive paths (screen space) ------------------------------------
    // Iso ground footprint: a world square of half-size `fw` projects to a
    // 2:1 diamond. These are its screen half-extents at the current zoom.
    function footRadii(fw) {
        return { rx: 2 * ISO.kx * fw * zoom(), ry: 2 * ISO.ky * fw * zoom() };
    }
    function diamondPath(cx, cy, rx, ry) {
        ctx.beginPath();
        ctx.moveTo(cx, cy - ry);
        ctx.lineTo(cx + rx, cy);
        ctx.lineTo(cx, cy + ry);
        ctx.lineTo(cx - rx, cy);
        ctx.closePath();
    }
    function roundRectPath(x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.arcTo(x + w, y, x + w, y + h, r);
        ctx.arcTo(x + w, y + h, x, y + h, r);
        ctx.arcTo(x, y + h, x, y, r);
        ctx.arcTo(x, y, x + w, y, r);
        ctx.closePath();
    }

    // --- backdrop: sky + mountains -----------------------------------------
    // === day/night + weather (purely cosmetic, render-only) ================
    // A slow clock sweeps the sky, a sun/moon across it, a global colour
    // grade, and the strength of the night dressing (windows, fireflies).
    // Weather rotates through clear→clouds→rain→snow with a wind vector that
    // slowly turns, so precipitation and cloud shadows drift and "rotate
    // around" over time. None of this touches gameplay or the save.
    const DAY_LENGTH = 210;                 // seconds for a full day↔night cycle
    let dayClock = DAY_LENGTH * 0.80;       // open in the evening so it starts moody
    let todPhase = 0, dayness = 0, nightLevel = 1, twilight = 0, sunEl = -1;
    // Global directional light for cast shadows (screen-space unit vector the
    // shadow extends along, + a length multiplier), refreshed each frame.
    let shadowDX = 0.4, shadowDY = 0.9, shadowLen = 1.2;
    const WEATHER_ROTATION = ['clear', 'clouds', 'rain', 'clouds', 'clear', 'snow', 'clouds'];
    let weather = { i: 0, type: 'clear', t: 0, dur: 40, intensity: 0, cloud: 0,
                    snow: 0, windAng: 0.6, windMag: 0.5 };
    let forcedWeather = null;               // &weather= for screenshots
    let precip = [];                        // rain/snow particle pool (screen-space)
    let clouds = null;                      // drifting overcast blobs (screen-space)

    function lerpHex(a, b, t) { return mix(a, b, t); } // alias for readability

    function updateDayWeather(dt) {
        const p = new URLSearchParams(location.search);
        if (p.has('tod')) dayClock = (parseFloat(p.get('tod')) || 0) * DAY_LENGTH;
        else dayClock += dt;
        if (p.has('weather')) forcedWeather = p.get('weather');

        todPhase = (dayClock / DAY_LENGTH) % 1;
        sunEl = Math.sin((todPhase - 0.25) * Math.PI * 2); // -1 midnight … +1 noon
        dayness = Math.max(0, Math.min(1, (sunEl + 0.15) / 0.5));
        nightLevel = 1 - dayness;
        twilight = Math.max(0, 1 - Math.abs(sunEl) / 0.26); // strong near horizon

        // Weather scheduler: each spell fades its intensity 0→1→0 so particles
        // clear out before the type switches. `cloud` (overcast amount) is a
        // separate slow ease so clouds linger through rain/snow.
        weather.t += dt;
        const u = weather.t / weather.dur;
        const env = Math.max(0, Math.min(1, Math.min(u / 0.18, (1 - u) / 0.18)));
        weather.intensity = forcedWeather ? (forcedWeather === weather.type ? 1 : 0) : env;
        if (weather.t >= weather.dur && !forcedWeather) {
            weather.i = (weather.i + 1) % WEATHER_ROTATION.length;
            weather.type = WEATHER_ROTATION[weather.i];
            weather.t = 0;
            weather.dur = 34 + Math.random() * 30;
            precip.length = 0; // drop stale particles across a type change
        }
        if (forcedWeather && forcedWeather !== weather.type) {
            weather.type = forcedWeather; weather.intensity = 1; precip.length = 0;
        }
        const overcast = (weather.type === 'clouds' || weather.type === 'rain' || weather.type === 'snow')
            ? weather.intensity : 0;
        weather.cloud += (overcast - weather.cloud) * Math.min(1, dt * 0.6);
        // Snow accumulates on the ground while it falls and melts slowly after
        const snowing = weather.type === 'snow' ? weather.intensity : 0;
        weather.snow += (snowing - weather.snow) * Math.min(1, dt * (snowing > weather.snow ? 0.4 : 0.06));
        weather.windAng += dt * 0.06;        // the system slowly rotates
        weather.windMag = 0.35 + 0.25 * Math.sin(dayClock * 0.05);

        // Cast-shadow direction from the dominant luminary: it sweeps east→
        // west over the day, so shadows point the opposite way and always a
        // bit toward the viewer. Longer near the horizon (dawn/dusk), short
        // at noon. The moon casts the same way, more faintly (see drawShadow).
        const sf = (todPhase - 0.25) / 0.5;                  // sun fraction
        const mf = (((todPhase + 0.25) % 1) - 0.25) / 0.5;   // moon fraction
        const lumFrac = Math.max(0, Math.min(1, dayness >= 0.5 ? sf : mf));
        const horiz = (lumFrac - 0.5) * 2;                   // −1 left … +1 right
        const elevAbs = Math.max(0.14, Math.abs(sunEl));
        shadowLen = Math.min(3.2, 0.72 / elevAbs);
        const sx = -horiz, sy = 0.66, m = Math.hypot(sx, sy) || 1;
        shadowDX = sx / m; shadowDY = sy / m;
    }

    // sky keyframe palettes [top, mid, bottom]
    const SKY_NIGHT = ['#141d30', '#0f1626', '#0a0f1a'];
    const SKY_DAY = ['#3a6ea3', '#6a9fca', '#a7c8e0'];
    const SKY_DUSK = ['#28203e', '#6b3f56', '#c9724a'];
    function skyColor(idx) {
        let c = lerpHex(SKY_NIGHT[idx], SKY_DAY[idx], dayness);
        c = lerpHex(c, SKY_DUSK[idx], twilight * 0.7); // warm the horizon at dawn/dusk
        // clouds mute + darken the sky a touch
        return lerpHex(c, '#535f70', weather.cloud * 0.35);
    }

    let stars = null;
    function drawSky() {
        const w = canvas.width / dpr, h = canvas.height / dpr;
        const g = ctx.createLinearGradient(0, 0, 0, h);
        g.addColorStop(0, skyColor(0));
        g.addColorStop(0.55, skyColor(1));
        g.addColorStop(1, skyColor(2));
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);

        // Aurora — night-only, fades out toward day and under cloud.
        const auroraA = nightLevel * (1 - weather.cloud * 0.8);
        if (auroraA > 0.02) {
            for (let b = 0; b < 2; b++) {
                const baseY = h * (0.14 + b * 0.06);
                ctx.beginPath();
                ctx.moveTo(0, baseY);
                for (let x = 0; x <= w; x += w / 12) {
                    ctx.lineTo(x, baseY + Math.sin(x / w * 6 + seaTime * 0.25 + b * 2) * 18 * (1 - b * 0.3));
                }
                ctx.lineTo(w, 0); ctx.lineTo(0, 0); ctx.closePath();
                const ag = ctx.createLinearGradient(0, 0, 0, baseY + 30);
                ag.addColorStop(0, 'rgba(52, 211, 153, 0)');
                ag.addColorStop(1, `rgba(${b ? '96, 165, 250' : '52, 211, 153'}, ${(0.05 - b * 0.015) * auroraA})`);
                ctx.fillStyle = ag;
                ctx.fill();
            }
        }

        // Stars — fade with daylight and cloud cover.
        if (!stars) {
            const rng = makeRng(0xa11);
            stars = [];
            for (let i = 0; i < 90; i++) {
                stars.push({ u: rng(), v: rng() * rng() * 0.6, r: 0.5 + rng() * 1.1, ph: rng() * Math.PI * 2 });
            }
        }
        const starA = nightLevel * (1 - weather.cloud * 0.85);
        if (starA > 0.02) {
            ctx.fillStyle = '#dbe6f4';
            for (const s of stars) {
                ctx.globalAlpha = starA * (0.25 + 0.45 * (0.5 + 0.5 * Math.sin(seaTime * 0.8 + s.ph)));
                ctx.beginPath();
                ctx.arc(s.u * w, s.v * h, s.r, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.globalAlpha = 1;
        }

        // Luminary: sun and moon share an east→west arc, crossfaded by day/
        // night, dimmed under cloud. Drawn before the world so peaks occlude.
        const arcY = (frac) => h * (0.62 - Math.sin(Math.max(0, Math.min(1, frac)) * Math.PI) * 0.5);
        const arcX = (frac) => w * (0.12 + 0.76 * frac);
        const clouded = 1 - weather.cloud * 0.75;
        // sun: up during the day half (phase .25→.75)
        const sf = (todPhase - 0.25) / 0.5;
        if (dayness > 0.02 && sf >= -0.05 && sf <= 1.05) {
            drawLuminary(arcX(sf), arcY(sf), Math.max(22, Math.min(w, h) * 0.05),
                         '#ffe9b0', '#ffd070', dayness * clouded, false);
        }
        // moon: up during the night half (phase .75→1.25)
        const mf = (((todPhase + 0.25) % 1) - 0.25) / 0.5;
        if (nightLevel > 0.02 && mf >= -0.05 && mf <= 1.05) {
            drawLuminary(arcX(mf), arcY(mf), Math.max(20, Math.min(w, h) * 0.045),
                         '#e8eef7', '#d2e0f5', nightLevel * clouded, true);
        }
    }

    function drawLuminary(x, y, r, disc, glow, alpha, moon) {
        ctx.globalAlpha = alpha;
        const halo = ctx.createRadialGradient(x, y, r * 0.5, x, y, r * (moon ? 4 : 5));
        halo.addColorStop(0, rgba(glow, 0.32));
        halo.addColorStop(1, rgba(glow, 0));
        ctx.fillStyle = halo;
        ctx.beginPath(); ctx.arc(x, y, r * (moon ? 4 : 5), 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = disc;
        ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
        if (moon) {
            ctx.fillStyle = 'rgba(190, 202, 222, 0.55)';
            for (const [ox, oy, or] of [[-0.3, -0.2, 0.22], [0.25, 0.1, 0.16], [0.05, 0.38, 0.13]]) {
                ctx.beginPath(); ctx.arc(x + r * ox, y + r * oy, r * or, 0, Math.PI * 2); ctx.fill();
            }
        }
        ctx.globalAlpha = 1;
    }

    // Soft overcast blobs drifting across the sky with the wind — the visible
    // "clouds" state. Screen-space, so they read as a sky layer, not ground.
    function drawSkyClouds(dt) {
        if (weather.cloud < 0.02) return;
        const w = canvas.width / dpr, h = canvas.height / dpr;
        if (!clouds) {
            const rng = makeRng(0xc10d);
            clouds = [];
            for (let i = 0; i < 7; i++) {
                clouds.push({ x: rng(), y: rng() * 0.32, r: 60 + rng() * 90, s: 0.4 + rng() * 0.7 });
            }
        }
        const drift = Math.cos(weather.windAng) * weather.windMag;
        ctx.fillStyle = '#8391a5';
        for (const c of clouds) {
            c.x += drift * c.s * dt * 0.02;
            if (c.x > 1.2) c.x -= 1.4; else if (c.x < -0.2) c.x += 1.4;
            const cx = c.x * w, cy = c.y * h, r = c.r;
            const gr = ctx.createRadialGradient(cx, cy, r * 0.2, cx, cy, r);
            gr.addColorStop(0, `rgba(150, 165, 186, ${0.22 * weather.cloud})`);
            gr.addColorStop(1, 'rgba(150, 165, 186, 0)');
            ctx.fillStyle = gr;
            ctx.beginPath(); ctx.ellipse(cx, cy, r, r * 0.55, 0, 0, Math.PI * 2); ctx.fill();
        }
    }

    // Big soft cloud shadows sliding over the ground (drawn after the land,
    // under the buildings). Screen-space and driven by the same wind.
    let cloudShadows = null;
    function drawCloudShadows(dt) {
        if (weather.cloud < 0.05) return;
        const w = canvas.width / dpr, h = canvas.height / dpr;
        if (!cloudShadows) {
            const rng = makeRng(0x5ad0);
            cloudShadows = [];
            for (let i = 0; i < 5; i++) {
                cloudShadows.push({ x: rng() * 1.4 - 0.2, y: 0.2 + rng() * 0.7, r: 130 + rng() * 120, s: 0.6 + rng() * 0.6 });
            }
        }
        const dvx = Math.cos(weather.windAng) * weather.windMag;
        const dvy = Math.sin(weather.windAng) * weather.windMag * 0.4;
        ctx.globalAlpha = 0.12 * weather.cloud;
        ctx.fillStyle = '#05070c';
        for (const c of cloudShadows) {
            c.x += dvx * c.s * dt * 0.03; c.y += dvy * c.s * dt * 0.02;
            if (c.x > 1.4) c.x -= 1.7; else if (c.x < -0.3) c.x += 1.7;
            if (c.y > 1.1) c.y -= 1.2; else if (c.y < 0.05) c.y += 1.0;
            ctx.beginPath();
            ctx.ellipse(c.x * w, c.y * h, c.r, c.r * 0.5, 0, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;
    }

    // Rain/snow, screen-space, blown along the wind vector. Pool capped so
    // it stays cheap on mobile; count scales with the spell's intensity.
    function drawPrecip(dt) {
        const type = weather.type;
        if ((type !== 'rain' && type !== 'snow') || weather.intensity < 0.02) {
            if (precip.length) precip.length = 0;
            return;
        }
        const w = canvas.width / dpr, h = canvas.height / dpr;
        const cap = type === 'rain' ? 150 : 110;
        const target = Math.floor(cap * weather.intensity);
        const wvx = Math.cos(weather.windAng) * weather.windMag;
        while (precip.length < target) {
            precip.push({
                x: Math.random() * (w + 200) - 100, y: Math.random() * -h,
                z: 0.5 + Math.random() * 0.9, sway: Math.random() * Math.PI * 2
            });
        }
        if (precip.length > target) precip.length = target;

        if (type === 'rain') {
            ctx.strokeStyle = 'rgba(174, 200, 230, 0.5)';
            ctx.lineCap = 'round';
            for (const p of precip) {
                const vx = (wvx * 3 + 0.4) * p.z, vy = (13 + 6 * p.z);
                p.x += vx * dt * 60; p.y += vy * dt * 60;
                if (p.y > h + 10) { p.y = -10; p.x = Math.random() * (w + 200) - 100; }
                ctx.lineWidth = p.z * 1.4;
                ctx.beginPath();
                ctx.moveTo(p.x, p.y);
                ctx.lineTo(p.x - vx * 1.1, p.y - vy * 1.1);
                ctx.stroke();
            }
            ctx.lineCap = 'butt';
        } else { // snow
            ctx.fillStyle = 'rgba(233, 240, 250, 0.85)';
            for (const p of precip) {
                p.sway += dt * 1.5;
                p.x += (wvx * 2 + Math.sin(p.sway) * 0.6) * p.z * dt * 60;
                p.y += (1.6 + 1.4 * p.z) * dt * 60;
                if (p.y > h + 8) { p.y = -8; p.x = Math.random() * (w + 200) - 100; }
                ctx.globalAlpha = 0.5 + 0.4 * p.z;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.z * 1.7, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.globalAlpha = 1;
        }
    }

    // Full-screen colour grade for time of day: brighten + warm toward day,
    // warm-orange wash at dawn/dusk, near-transparent (leaves the night
    // dressing intact) deep at night. 'screen' lifts the baked-night ground
    // toward daylight without re-rendering the cached scenery.
    function drawGrade() {
        const w = canvas.width / dpr, h = canvas.height / dpr;
        // overcast steals some daylight and warmth
        const dim = 1 - weather.cloud * 0.45;
        const dayA = dayness * 0.26 * dim, duskA = twilight * 0.22 * dim;
        if (dayA > 0.01 || duskA > 0.01) {
            ctx.save();
            ctx.globalCompositeOperation = 'screen';
            if (dayA > 0.01) { ctx.globalAlpha = dayA; ctx.fillStyle = '#9cc2e8'; ctx.fillRect(0, 0, w, h); }
            if (duskA > 0.01) { ctx.globalAlpha = duskA; ctx.fillStyle = '#ff9d5c'; ctx.fillRect(0, 0, w, h); }
            ctx.restore();
        }
        // A cool grey wash under heavy cloud, so overcast/rain/snow reads as
        // a moodier, flatter light rather than the same clear palette.
        if (weather.cloud > 0.05) {
            ctx.globalAlpha = weather.cloud * 0.16;
            ctx.fillStyle = '#3a4658';
            ctx.fillRect(0, 0, w, h);
            ctx.globalAlpha = 1;
        }
    }

    // --- backdrop terrain: a low-poly heightfield ---------------------------
    // Instead of free-standing triangle peaks placed "behind" the map, the
    // ground plane itself continues outward past every edge and shapes into
    // terrain — one polygon mesh that flows out of the flat playing field.
    // Beyond the two far (low world x+y) edges it climbs into mountains;
    // beyond the two near edges it *descends* into rolling lowland
    // foothills, so the field reads as a plateau in one continuous
    // landscape rather than an island floating over the sky. Flat (height
    // 0) inside the field, and everything outside it is drawn before the
    // land, so it never occludes the play area. Faceted flat-shaded quads
    // with a faint wireframe read as "3D terrain"; colour blends toward the
    // live sky for aerial haze (so it tracks day/night + weather for free).
    //
    // Size-aware: the grid spans the *current* field (SC.worldW/worldH) plus
    // a skirt, and is rebuilt only when that size changes (terrainKey) — so
    // a field expansion just pushes the mountains further out. Baked into
    // the cached bg layer (see renderBg), so it costs nothing per frame.
    const TERRAIN = {
        ring: 1500,     // world units of terrain skirt beyond each edge
        cell: 145,      // grid cell size in world units
        amp: 640,       // full peak height, screen px at zoom 1
        rise: 900,      // world distance over which it climbs to full height
        dip: 180,       // how far the near-side lowlands sink, px at zoom 1
        snowline: 0.60, // height fraction above which snow appears
        freq: 0.0019    // noise sampling frequency (world units)
    };
    let terrain = null; // { key, cell, cols, rows, x0, y0, hgt: Float32Array }

    // 2D value noise + a little fbm, both in ~[0,1]. Deterministic hash so
    // the range is stable frame-to-frame (and across a rebuild at the same
    // size).
    function thash(xi, yi) {
        const s = Math.sin(xi * 127.1 + yi * 311.7) * 43758.5453;
        return s - Math.floor(s);
    }
    function vnoise(x, y) {
        const xi = Math.floor(x), yi = Math.floor(y);
        const xf = x - xi, yf = y - yi;
        const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
        const a = thash(xi, yi), b = thash(xi + 1, yi);
        const c = thash(xi, yi + 1), d = thash(xi + 1, yi + 1);
        return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
    }
    // Ridged multifractal: each octave folded to a sharp crest (1-|2n-1|)
    // then powered, so the field reads as mountain ridges + valleys rather
    // than smooth rolling blobs. Returns ~[0,1].
    function ridged(x, y) {
        let f = 0, amp = 0.5, freq = 1, norm = 0;
        for (let o = 0; o < 4; o++) {
            let n = 1 - Math.abs(2 * vnoise(x * freq, y * freq) - 1);
            n *= n; // sharpen the crest
            f += amp * n; norm += amp; freq *= 2.02; amp *= 0.5;
        }
        return f / norm;
    }

    // World-space height at (x,y): 0 inside the field. Beyond the far
    // top/left edges it rises into ridged mountains; beyond the near
    // bottom/right edges it sinks into gently rolling lowlands (negative
    // height = below the field plateau). At the two side corners both
    // terms can apply and simply sum, which blends the range down into
    // the foothills instead of leaving a cliff between them.
    function terrainHeight(x, y) {
        const W = SC.worldW(), H = SC.worldH();
        let h = 0;
        const dFar = Math.max(Math.max(0, -y), Math.max(0, -x));
        if (dFar > 0) {
            let e = Math.min(1, dFar / TERRAIN.rise);
            e = e * e * (3 - 2 * e);                          // smooth ramp off the field
            const n = ridged(x * TERRAIN.freq, y * TERRAIN.freq);
            h += e * TERRAIN.amp * (0.16 + 1.05 * n);         // deep valleys, tall peaks
        }
        const dNear = Math.max(Math.max(0, y - H), Math.max(0, x - W));
        if (dNear > 0) {
            let e = Math.min(1, dNear / (TERRAIN.rise * 0.8));
            e = e * e * (3 - 2 * e);
            const n = vnoise(x * TERRAIN.freq * 1.7, y * TERRAIN.freq * 1.7);
            h -= e * TERRAIN.dip * (0.5 + 0.5 * n);           // soft rolling descent
        }
        return h;
    }

    function terrainKey() { return Math.round(SC.worldW()) + 'x' + Math.round(SC.worldH()); }

    function ensureTerrain() {
        const key = terrainKey();
        if (terrain && terrain.key === key) return terrain;
        const W = SC.worldW(), H = SC.worldH(), cell = TERRAIN.cell, ring = TERRAIN.ring;
        const x0 = -ring, y0 = -ring;
        const cols = Math.ceil((W + ring - x0) / cell); // include near apron; flat quads are skipped
        const rows = Math.ceil((H + ring - y0) / cell);
        const hgt = new Float32Array((cols + 1) * (rows + 1));
        for (let j = 0; j <= rows; j++) {
            for (let i = 0; i <= cols; i++) {
                hgt[j * (cols + 1) + i] = terrainHeight(x0 + i * cell, y0 + j * cell);
            }
        }
        terrain = { key, cell, cols, rows, x0, y0, hgt };
        return terrain;
    }

    function drawTerrain() {
        const t = ensureTerrain(), z = zoom(), cell = t.cell, cw = t.cols + 1;
        const H = (i, j) => t.hgt[j * cw + i];
        const vb = viewBounds || { x0: -40, x1: canvas.width / dpr + 40,
                                   y0: -40, y1: canvas.height / dpr + 40 };
        const sky = skyColor(1); // haze target — day/night/weather aware
        // Anti-diagonal sweep (increasing i+j) ≈ back-to-front in world x+y,
        // so nearer facets correctly paint over farther ones.
        for (let s = 0; s <= (t.cols - 1) + (t.rows - 1); s++) {
            const iLo = Math.max(0, s - (t.rows - 1)), iHi = Math.min(t.cols - 1, s);
            for (let i = iLo; i <= iHi; i++) {
                const j = s - i;
                const h00 = H(i, j), h10 = H(i + 1, j), h11 = H(i + 1, j + 1), h01 = H(i, j + 1);
                if (h00 === 0 && h10 === 0 && h11 === 0 && h01 === 0) continue; // flat field/apron
                const x = t.x0 + i * cell, y = t.y0 + j * cell;
                const a = S(x, y), b = S(x + cell, y), c = S(x + cell, y + cell), e = S(x, y + cell);
                const P00 = { x: a.x, y: a.y - h00 * z }, P10 = { x: b.x, y: b.y - h10 * z };
                const P11 = { x: c.x, y: c.y - h11 * z }, P01 = { x: e.x, y: e.y - h01 * z };
                const minx = Math.min(P00.x, P10.x, P11.x, P01.x), maxx = Math.max(P00.x, P10.x, P11.x, P01.x);
                if (maxx < vb.x0 || minx > vb.x1) continue;
                const miny = Math.min(P00.y, P10.y, P11.y, P01.y), maxy = Math.max(P00.y, P10.y, P11.y, P01.y);
                if (maxy < vb.y0 || miny > vb.y1) continue;

                const hAvg = (h00 + h10 + h11 + h01) * 0.25;
                let col;
                if (hAvg >= 0) {
                    const hf = Math.min(1, hAvg / TERRAIN.amp);
                    // land tone low, rocky blue-grey high, snow above the line
                    col = mix('#2c3d54', '#5b6a86', Math.min(1, hf / TERRAIN.snowline));
                    if (hf > TERRAIN.snowline) col = mix(col, '#eef3fa', (hf - TERRAIN.snowline) / (1 - TERRAIN.snowline));
                } else {
                    // near-side lowlands: darken as they fall away, with a
                    // hint of green so the foothills read as vegetated land
                    const df = Math.min(1, -hAvg / TERRAIN.dip);
                    col = mix('#22334a', '#131e2e', df);
                    col = mix(col, '#1e3a30', 0.25);
                }
                // flat-facet lighting from the slope (light from upper-left):
                // faces tilting toward high x/y (away from the light) darken.
                const slope = ((h10 + h11) - (h00 + h01)) + ((h01 + h11) - (h00 + h10));
                col = shade(col, Math.max(-0.34, Math.min(0.26, -slope / (TERRAIN.amp * 1.4))));
                // aerial haze: fade toward the sky with distance past the
                // field on either side (mountains far, lowlands near)
                const cxm = x + cell * 0.5, cym = y + cell * 0.5;
                const dEdge = Math.max(
                    Math.max(Math.max(0, -cym), Math.max(0, -cxm)),
                    Math.max(Math.max(0, cym - SC.worldH()), Math.max(0, cxm - SC.worldW())));
                const haze = Math.min(1, dEdge / (TERRAIN.rise * 2.6));
                col = mix(col, sky, 0.08 + 0.5 * haze);

                ctx.beginPath();
                ctx.moveTo(P00.x, P00.y); ctx.lineTo(P10.x, P10.y);
                ctx.lineTo(P11.x, P11.y); ctx.lineTo(P01.x, P01.y); ctx.closePath();
                ctx.fillStyle = col;
                ctx.fill();
                // faint wireframe so the mesh reads as facets (the "polygon
                // terrain" look), fading out with haze
                ctx.strokeStyle = rgba('#b8cbe6', 0.13 * (1 - haze * 0.7));
                ctx.lineWidth = 1;
                ctx.stroke();
            }
        }
    }

    // --- ground: terrain patches + scenery ---------------------------------
    let decor = null, decorKey = null;
    function inRiver(x, y, margin) {
        const r = SC.state.river;
        if (!r) return false;
        let best = 0, bd = Infinity;
        for (let i = 0; i < r.spine.length; i++) {
            const d = Math.abs(r.spine[i].y - y);
            if (d < bd) { bd = d; best = i; }
        }
        return Math.abs(x - r.spine[best].x) < r.halfWidths[best] + margin;
    }
    function ensureDecor() {
        const r = SC.state.river;
        const W = SC.worldW(), Wh = SC.worldH();
        const key = (r ? r.spine.length + ':' + Math.round(r.spine[0].x) + ':' + Math.round(r.halfWidths[0]) : 'none')
                    + ':' + terrainKey();
        if (decor && decorKey === key) return decor;
        const rng = makeRng(0x2357);
        const patches = [];
        const tints = ['#233650', '#2b3a3a', '#1d2b40', '#2a3446', '#243d3a'];
        for (let i = 0; i < 18; i++) {
            patches.push({
                x: rng() * W, y: rng() * Wh,
                rx: 220 + rng() * 320, ry: 140 + rng() * 200,
                tint: tints[(rng() * tints.length) | 0], a: 0.18 + rng() * 0.16
            });
        }
        const trees = [];
        let tries = 0;
        while (trees.length < 54 && tries < 600) {
            tries++;
            const x = 70 + rng() * (W - 140), y = 70 + rng() * (Wh - 140);
            if (inRiver(x, y, 55)) continue;
            trees.push({ x, y, s: 0.75 + rng() * 0.7, rock: rng() > 0.78, tone: rng() });
        }
        decor = { patches, trees };
        decorKey = key;
        return decor;
    }

    function drawDecor() {
        const d = ensureDecor();
        const z = zoom();
        // soft terrain patches, clipped to the land
        ctx.save();
        const corners = [S(0, 0), S(SC.worldW(), 0), S(SC.worldW(), SC.worldH()), S(0, SC.worldH())];
        ctx.beginPath();
        corners.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y));
        ctx.closePath();
        ctx.clip();
        for (const p of d.patches) {
            const s = S(p.x, p.y);
            ctx.globalAlpha = p.a;
            ctx.fillStyle = p.tint;
            ctx.beginPath();
            ctx.ellipse(s.x, s.y, p.rx * z, p.ry * z * 0.5, 0, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;
        ctx.restore();

        // trees & rocks — skip any that would sit under a building
        for (const t of d.trees) {
            let nearNode = false;
            for (const n of SC.state.nodes) {
                if (n.active && Math.abs(n.x - t.x) < 95 && Math.abs(n.y - t.y) < 95) { nearNode = true; break; }
            }
            if (nearNode) continue;
            const s = S(t.x, t.y), sc = t.s * z;
            // little ground shadow
            ctx.globalAlpha = 0.22;
            ctx.fillStyle = '#05070c';
            ctx.beginPath();
            ctx.ellipse(s.x, s.y, 9 * sc, 4.5 * sc, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
            if (t.rock) {
                ctx.fillStyle = mix('#4b5563', '#334155', t.tone);
                ctx.beginPath();
                ctx.ellipse(s.x, s.y - 3 * sc, 7 * sc, 5 * sc, 0, 0, Math.PI * 2);
                ctx.fill();
            } else {
                // trunk
                ctx.fillStyle = '#3a2a1e';
                ctx.fillRect(s.x - 1.4 * sc, s.y - 8 * sc, 2.8 * sc, 8 * sc);
                // two-tier pine
                const green = mix('#2f6b3f', '#245a37', t.tone);
                ctx.fillStyle = green;
                ctx.beginPath();
                ctx.moveTo(s.x, s.y - 30 * sc);
                ctx.lineTo(s.x + 9 * sc, s.y - 12 * sc);
                ctx.lineTo(s.x - 9 * sc, s.y - 12 * sc);
                ctx.closePath(); ctx.fill();
                ctx.beginPath();
                ctx.moveTo(s.x, s.y - 22 * sc);
                ctx.lineTo(s.x + 11 * sc, s.y - 6 * sc);
                ctx.lineTo(s.x - 11 * sc, s.y - 6 * sc);
                ctx.closePath(); ctx.fill();
                // sun highlight
                ctx.fillStyle = mix(green, '#6ee7a0', 0.35);
                ctx.beginPath();
                ctx.moveTo(s.x, s.y - 22 * sc);
                ctx.lineTo(s.x + 4 * sc, s.y - 8 * sc);
                ctx.lineTo(s.x - 1 * sc, s.y - 8 * sc);
                ctx.closePath(); ctx.fill();
            }
        }
        ctx.globalAlpha = 1;
    }

    // --- ground & water -----------------------------------------------------
    // Everything static in world space: land plateau, iso grid, terrain
    // patches, trees/rocks and the coastline. Drawn only when the cached
    // background layer re-renders (see renderBg), never per frame.
    function drawLandStatic() {
        const W = SC.worldW(), Wh = SC.worldH();
        const corners = [S(0, 0), S(W, 0), S(W, Wh), S(0, Wh)];
        // Drop the land onto the backdrop with a soft dark rim. Layered
        // strokes instead of shadowBlur: this repaints during pinch-zoom
        // (see drawBg), and canvas blur is far too slow for that on mobile.
        ctx.lineJoin = 'round';
        for (let i = 3; i >= 1; i--) {
            ctx.beginPath();
            corners.forEach((p, j) => j ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y));
            ctx.closePath();
            ctx.strokeStyle = `rgba(0, 0, 0, ${0.16 - i * 0.04})`;
            ctx.lineWidth = i * 14;
            ctx.stroke();
        }
        ctx.lineJoin = 'miter';

        ctx.beginPath();
        corners.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y));
        ctx.closePath();
        const ys = corners.map(p => p.y);
        const grad = ctx.createLinearGradient(0, Math.min(...ys), 0, Math.max(...ys));
        grad.addColorStop(0, '#2b3c52');
        grad.addColorStop(0.5, '#223247');
        grad.addColorStop(1, '#182437');
        ctx.fillStyle = grad;
        ctx.fill();

        // Iso grid: faint lines of constant world-x and world-y, clipped to
        // the land, to give the ground a sense of scale and perspective.
        ctx.save();
        ctx.clip();
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.055)';
        ctx.lineWidth = 1;
        const step = 220;
        for (let x = 0; x <= W + 1; x += step) {
            const a = S(x, 0), b = S(x, Wh);
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        }
        for (let y = 0; y <= Wh + 1; y += step) {
            const a = S(0, y), b = S(W, y);
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        }
        ctx.restore();

        drawDecor();

        // Coastline: a lit top-left rim, darker on the lower-right
        ctx.beginPath();
        corners.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y));
        ctx.closePath();
        ctx.strokeStyle = 'rgba(180, 200, 224, 0.16)';
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    // --- cached background layer ---------------------------------------------
    // Mountains + land + grid + patches + trees are all static in world
    // space but were re-path'd every frame — enough work to stutter panning
    // on phones. They render once into an oversized offscreen canvas and
    // each frame is just one drawImage: panning translates the blit, small
    // zoom deltas scale it, and a full re-render only happens when the
    // camera leaves the painted margin, zoom drifts >25% from the render
    // zoom, the viewport resizes, or the scenery itself changes (new game,
    // or a site activating reclaims the trees under it).
    const BG_MARGIN = 320; // css px painted beyond each viewport edge
    let bg = null;         // { cv, camX, camY, zoom, w, h, key }
    let viewBounds = null; // widened mountain-culling window during renderBg

    function bgKey() {
        const r = SC.state.river;
        const active = SC.state.nodes ? SC.state.nodes.filter(n => n.active).length : 0;
        return (r ? Math.round(r.spine[0].x) : 0) + ':' + active + ':' +
               canvas.width + 'x' + canvas.height + ':' + terrainKey();
    }

    function renderBg() {
        const cam = SC.camera.cam;
        const wCss = canvas.width / dpr + BG_MARGIN * 2;
        const hCss = canvas.height / dpr + BG_MARGIN * 2;
        if (!bg || bg.cv.width !== Math.round(wCss * dpr) || bg.cv.height !== Math.round(hCss * dpr)) {
            bg = { cv: document.createElement('canvas') };
            bg.cv.width = Math.round(wCss * dpr);
            bg.cv.height = Math.round(hCss * dpr);
        }
        const bctx = bg.cv.getContext('2d');
        bctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        bctx.clearRect(0, 0, wCss, hCss);
        bctx.translate(BG_MARGIN, BG_MARGIN);
        // The drawing helpers all render through the module-level `ctx` at
        // the live camera; swapping it in + the translate above paints the
        // same scene shifted into the margin. try/finally so a mid-render
        // throw can never leave `ctx` pointing at the layer — that failure
        // mode silently redirects ALL subsequent drawing into the cache and
        // corrupts every following frame.
        const old = ctx;
        ctx = bctx;
        viewBounds = { x0: -BG_MARGIN - 40, x1: canvas.width / dpr + BG_MARGIN + 40,
                       y0: -BG_MARGIN - 40, y1: canvas.height / dpr + BG_MARGIN + 40 };
        try {
            drawTerrain();
            drawLandStatic();
        } finally {
            ctx = old;
            viewBounds = null;
        }
        bg.camX = cam.x; bg.camY = cam.y; bg.zoom = cam.zoom;
        bg.w = wCss; bg.h = hCss; bg.key = bgKey();
        bg.builtAt = performance.now();
    }

    function drawBg() {
        const cam = SC.camera.cam;
        let scale = 1, x0 = 0, y0 = 0;
        const place = () => {
            scale = cam.zoom / bg.zoom;
            x0 = (bg.camX - cam.x) * cam.zoom - BG_MARGIN * scale;
            y0 = (bg.camY - cam.y) * cam.zoom - BG_MARGIN * scale;
        };
        let need = !bg || bg.key !== bgKey();
        if (!need) {
            place(); // still covering the viewport after the pan?
            need = x0 > 0 || y0 > 0 ||
                   x0 + bg.w * scale < canvas.width / dpr ||
                   y0 + bg.h * scale < canvas.height / dpr;
            // Zoom drift: a scaled blit visibly detaches the cached scenery
            // from the live world (mountains swelling/tearing against the
            // map — the mobile pinch glitch), so it's only allowed as a
            // ≤120ms stopgap mid-gesture to keep pinch fluid; after that
            // the layer re-renders at the exact zoom (scale returns to 1).
            if (!need && cam.zoom !== bg.zoom &&
                performance.now() - bg.builtAt > 120) need = true;
        }
        if (need) { renderBg(); place(); }
        ctx.drawImage(bg.cv, x0, y0, bg.w * scale, bg.h * scale);
    }

    function drawWorld(dt) {
        seaTime += dt;
        drawBg();     // mountains + land + grid + decor (cached)
        drawRiver();  // live: animated ripples

        // Distance fog: the far edge of the land dissolves into the sky.
        // Iso depth (world x+y) maps linearly to screen y, so a vertical
        // gradient between two constant-depth lines is a true depth fade —
        // from the far corner (depth 0) to ~35% of max depth.
        const corners = [S(0, 0), S(SC.worldW(), 0), S(SC.worldW(), SC.worldH()), S(0, SC.worldH())];
        const farY = corners[0].y;
        const midD = 0.175 * (SC.worldW() + SC.worldH()); // x=y point at 35% depth
        const nearY = S(midD, midD).y;
        if (nearY > farY) {
            ctx.save();
            ctx.beginPath();
            corners.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y));
            ctx.closePath();
            ctx.clip();
            const fog = ctx.createLinearGradient(0, farY, 0, nearY);
            fog.addColorStop(0, 'rgba(20, 29, 48, 0.85)');
            fog.addColorStop(0.5, 'rgba(20, 29, 48, 0.35)');
            fog.addColorStop(1, 'rgba(20, 29, 48, 0)');
            ctx.fillStyle = fog;
            ctx.fillRect(0, farY, canvas.width / dpr, nearY - farY);
            ctx.restore();
        }
    }

    function drawRiver() {
        const r = SC.state.river;
        const left = [], right = [];
        for (let i = 0; i < r.spine.length; i++) {
            left.push(S(r.spine[i].x - r.halfWidths[i], r.spine[i].y));
            right.push(S(r.spine[i].x + r.halfWidths[i], r.spine[i].y));
        }
        // Water body
        ctx.beginPath();
        left.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y));
        for (let i = right.length - 1; i >= 0; i--) ctx.lineTo(right[i].x, right[i].y);
        ctx.closePath();
        const ys = [...left, ...right].map(p => p.y);
        const g = ctx.createLinearGradient(0, Math.min(...ys), 0, Math.max(...ys));
        g.addColorStop(0, '#123047');
        g.addColorStop(1, '#0b1c2c');
        ctx.fillStyle = g;
        ctx.fill();
        // subtle bank shadow
        ctx.strokeStyle = 'rgba(2, 6, 12, 0.5)';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Animated ripples across the flow
        ctx.strokeStyle = 'rgba(96, 200, 240, 0.10)';
        ctx.lineWidth = 1.4;
        for (let w = 0; w < 4; w++) {
            ctx.beginPath();
            for (let i = 0; i < r.spine.length; i++) {
                const t = i / (r.spine.length - 1);
                const frac = (w + 1) / 5;
                const wx = r.spine[i].x - r.halfWidths[i] + 2 * r.halfWidths[i] * frac
                         + Math.sin(seaTime * 2 + t * 8 + w) * 6;
                const p = S(wx, r.spine[i].y);
                i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y);
            }
            ctx.stroke();
        }

        // Moonlight: a soft pale reflection wavering down the river centre,
        // night-only. Two overlaid strokes (a crisp core + a broad, fainter
        // glow) — no hard specular blobs, which read as "circles on the water".
        const moonA = nightLevel;
        if (moonA > 0.05) {
            ctx.lineCap = 'round';
            for (const [wdt, al] of [[7, 0.05], [3, 0.11]]) {
                ctx.strokeStyle = `rgba(210, 226, 246, ${al * moonA})`;
                ctx.lineWidth = wdt;
                ctx.beginPath();
                for (let i = 0; i < r.spine.length; i++) {
                    const p = S(r.spine[i].x + Math.sin(seaTime * 0.8 + i * 0.6) * 5, r.spine[i].y);
                    i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y);
                }
                ctx.stroke();
            }
            ctx.lineCap = 'butt';
        }
    }

    // --- roads --------------------------------------------------------------
    function strokeEdge(e, width, color, dash) { strokeEdgeRange(e, 0, 1, width, color, dash); }

    // Like strokeEdge but only over a [t0,t1] fraction of the edge — used to
    // draw a bridge/ferry's approach roads without the water crossing itself.
    function strokeEdgeRange(e, t0, t1, width, color, dash) {
        if (t1 - t0 < 0.002) return;
        const ax = e.a.x + (e.b.x - e.a.x) * t0, ay = e.a.y + (e.b.y - e.a.y) * t0;
        const bx = e.a.x + (e.b.x - e.a.x) * t1, by = e.a.y + (e.b.y - e.a.y) * t1;
        const a = S(ax, ay), b = S(bx, by);
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.strokeStyle = color;
        ctx.lineWidth = width;
        ctx.lineCap = 'round';
        if (dash) ctx.setLineDash(dash); else ctx.setLineDash([]);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.lineCap = 'butt';
    }

    // Casing + surface (+ highway centerline) for a plain road, over just
    // [t0,t1] of the edge — used both for a whole ordinary road and for the
    // land approaches on either side of a bridge/ferry's water crossing.
    function drawRoadSegment(e, casing, surfaceW, t0, t1, z) {
        strokeEdgeRange(e, t0, t1, casing, 'rgba(8, 12, 20, 0.55)');
        const surf = e.level > 0 ? 'rgba(226, 232, 240, 0.85)' : 'rgba(140, 152, 170, 0.75)';
        strokeEdgeRange(e, t0, t1, surfaceW, surf);
        if (e.level > 0) strokeEdgeRange(e, t0, t1, Math.max(1, 1.6 * z), 'rgba(250, 204, 21, 0.6)', [11 * z, 11 * z]);
    }

    // An actual bridge — deck lifted above the water on piers — spanning
    // just the [t0,t1] water stretch of the edge, so the road on either
    // bank still reads as ordinary road right up to the water's edge.
    function drawBridgeCrossing(e, casing, surfaceW, crossing, z) {
        const wx0 = e.a.x + (e.b.x - e.a.x) * crossing.t0, wy0 = e.a.y + (e.b.y - e.a.y) * crossing.t0;
        const wx1 = e.a.x + (e.b.x - e.a.x) * crossing.t1, wy1 = e.a.y + (e.b.y - e.a.y) * crossing.t1;
        const p0 = S(wx0, wy0), p1 = S(wx1, wy1);
        const lift = 10 * z; // how far the deck floats above the water, in screen px

        // Piers: evenly spaced footings so the deck reads as supported,
        // each with a little ripple where it meets the water.
        const waterLen = Math.hypot(wx1 - wx0, wy1 - wy0);
        const pierCount = Math.max(1, Math.round(waterLen / 90));
        for (let i = 0; i <= pierCount; i++) {
            const t = i / pierCount;
            const base = S(wx0 + (wx1 - wx0) * t, wy0 + (wy1 - wy0) * t);
            ctx.strokeStyle = 'rgba(60, 68, 82, 0.85)';
            ctx.lineWidth = Math.max(2, 3 * z);
            ctx.beginPath();
            ctx.moveTo(base.x, base.y - lift);
            ctx.lineTo(base.x, base.y + 2 * z);
            ctx.stroke();
            ctx.fillStyle = 'rgba(255, 255, 255, 0.14)';
            ctx.beginPath();
            ctx.ellipse(base.x, base.y + 2 * z, 5 * z, 2 * z, 0, 0, Math.PI * 2);
            ctx.fill();
        }

        // Shadow the deck casts on the water below it
        ctx.strokeStyle = 'rgba(2, 6, 12, 0.35)';
        ctx.lineWidth = casing;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(p0.x, p0.y + 3 * z);
        ctx.lineTo(p1.x, p1.y + 3 * z);
        ctx.stroke();

        // Deck: dark casing under a lighter concrete surface, both lifted
        strokeSpan(p0, p1, 0, -lift, casing, 'rgba(8, 12, 20, 0.6)');
        strokeSpan(p0, p1, 0, -lift, surfaceW, 'rgba(176, 190, 210, 0.92)');

        // Guard rails along both edges of the deck
        const dx = p1.x - p0.x, dy = p1.y - p0.y, len = Math.hypot(dx, dy) || 1;
        const nx = -dy / len, ny = dx / len, railOff = surfaceW / 2 + 1.5 * z;
        ctx.strokeStyle = 'rgba(226, 232, 240, 0.55)';
        ctx.lineWidth = Math.max(1, 1.2 * z);
        for (const sign of [-1, 1]) {
            ctx.beginPath();
            ctx.moveTo(p0.x + nx * railOff * sign, p0.y - lift + ny * railOff * sign);
            ctx.lineTo(p1.x + nx * railOff * sign, p1.y - lift + ny * railOff * sign);
            ctx.stroke();
        }
        ctx.lineCap = 'butt';
    }

    function strokeSpan(p0, p1, dx, dy, width, color) {
        ctx.strokeStyle = color;
        ctx.lineWidth = width;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(p0.x + dx, p0.y + dy);
        ctx.lineTo(p1.x + dx, p1.y + dy);
        ctx.stroke();
    }

    // Ferry lane, confined to just the water stretch — the road on either
    // bank reads as ordinary road up to the water's edge. (No boat glyph:
    // ⛴ renders as an unstyled black fallback glyph on some Android emoji
    // fonts, and the teal dashed lane already reads as "ferry" on its own.)
    function drawFerryCrossing(e, surfaceW, crossing, z) {
        const wx0 = e.a.x + (e.b.x - e.a.x) * crossing.t0, wy0 = e.a.y + (e.b.y - e.a.y) * crossing.t0;
        const wx1 = e.a.x + (e.b.x - e.a.x) * crossing.t1, wy1 = e.a.y + (e.b.y - e.a.y) * crossing.t1;
        const p0 = S(wx0, wy0), p1 = S(wx1, wy1);
        ctx.strokeStyle = 'rgba(45, 212, 191, 0.6)';
        ctx.lineWidth = surfaceW;
        ctx.lineCap = 'round';
        ctx.setLineDash([4 * z + 2, 10 * z]);
        ctx.beginPath();
        ctx.moveTo(p0.x, p0.y);
        ctx.lineTo(p1.x, p1.y);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.lineCap = 'butt';
    }

    function drawRoads() {
        const z = zoom();
        const pending = SC.input.getPendingDemolish && SC.input.getPendingDemolish();
        const pendingUp = SC.input.getPendingUpgrade && SC.input.getPendingUpgrade();
        for (const e of SC.state.edges) {
            const armed = e === pending || e === pendingUp;
            const casing = Math.max(5, (e.level > 0 ? 9 : 7) * z);
            const surfaceW = Math.max(2.5, (e.level > 0 ? 6 : 4) * z);
            const crossing = (e.bridge || e.ferry)
                ? SC.map.riverCrossing(e.a.x, e.a.y, e.b.x, e.b.y) : null;

            if (crossing) {
                drawRoadSegment(e, casing, surfaceW, 0, crossing.t0, z);
                drawRoadSegment(e, casing, surfaceW, crossing.t1, 1, z);
                if (e.ferry) drawFerryCrossing(e, surfaceW, crossing, z);
                else drawBridgeCrossing(e, casing, surfaceW, crossing, z);
            } else {
                drawRoadSegment(e, casing, surfaceW, 0, 1, z);
            }

            if (armed) {
                strokeEdge(e, casing + 2, e === pending ? 'rgba(248, 113, 113, 0.9)' : 'rgba(250, 204, 21, 0.9)');
            }

            // Congestion heat
            if (SC.state.congestionEnabled && !armed) {
                const excess = SC.vehicles.truckCountOnEdge(e) - SC.CONFIG.CONGESTION_THRESHOLD;
                if (excess > 0) {
                    const heat = Math.min(1, excess / 3);
                    strokeEdge(e, casing + heat * 4, `rgba(248, 113, 113, ${0.25 + heat * 0.5})`);
                }
            }
        }
    }

    // Flowing "pulse" dashes along roads that currently carry a truck, in the
    // cargo's colour and the direction of travel — makes the network read as
    // a live supply chain at a glance. Cheap: one pass over trucks + a dashed
    // stroke per active edge.
    function drawRouteFlow() {
        const active = new Map(); // edge -> { dir: ±1 along a→b, item }
        for (const t of SC.state.trucks) {
            if (!t.path || t.pathIdx >= t.path.length - 1) continue;
            const a = t.path[t.pathIdx], b = t.path[t.pathIdx + 1];
            const e = SC.roads.findEdge(a, b);
            if (e && !active.has(e)) active.set(e, { dir: e.a === a ? 1 : -1, item: t.cargo[0] || null });
        }
        if (!active.size) return;
        const z = zoom();
        ctx.lineCap = 'round';
        for (const [e, info] of active) {
            const A = S(e.a.x, e.a.y), B = S(e.b.x, e.b.y);
            const col = info.item ? SC.colorOf(info.item) : '#8fd0ff';
            ctx.strokeStyle = rgba(col, 0.55);
            ctx.lineWidth = Math.max(1.6, 2.4 * z);
            ctx.setLineDash([2.2 * z, 13 * z]);
            ctx.lineDashOffset = -info.dir * ((seaTime * 46 * z) % 100000);
            ctx.beginPath(); ctx.moveTo(A.x, A.y); ctx.lineTo(B.x, B.y); ctx.stroke();
        }
        ctx.setLineDash([]);
        ctx.lineDashOffset = 0; // reset — else later dashed strokes (e.g. the
        ctx.lineCap = 'butt';   // pasture fence) inherit this animated offset
    }

    // Rain makes roads glisten: a thin cool specular re-stroke over the
    // driving surface while a rain spell is active.
    function drawWetRoads() {
        if (weather.type !== 'rain' || weather.intensity < 0.05) return;
        const z = zoom();
        ctx.strokeStyle = `rgba(150, 190, 232, ${0.14 * weather.intensity})`;
        ctx.lineWidth = Math.max(1, 2 * z);
        for (const e of SC.state.edges) {
            const A = S(e.a.x, e.a.y), B = S(e.b.x, e.b.y);
            ctx.beginPath(); ctx.moveTo(A.x, A.y); ctx.lineTo(B.x, B.y); ctx.stroke();
        }
    }

    // --- text / emoji billboards -------------------------------------------
    function clampZoom() { return Math.min(1.6, Math.max(0.8, zoom())); }

    // Screen-space text on a rounded plate at a screen position.
    function labelAt(text, sx, sy, color, size) {
        const fs = size || 12;
        ctx.font = `600 ${fs}px Inter, system-ui, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const w = ctx.measureText(text).width;
        ctx.fillStyle = 'rgba(12, 18, 30, 0.82)';
        roundRectPath(sx - w / 2 - 6, sy - fs / 2 - 3, w + 12, fs + 6, 6);
        ctx.fill();
        ctx.fillStyle = color || '#f8fafc';
        ctx.fillText(text, sx, sy);
    }
    // world-anchored variant
    function label(text, wx, wy, color, size) {
        const p = S(wx, wy);
        labelAt(text, p.x, p.y, color, size);
    }

    function emoji(ch, sx, sy, size) {
        ctx.font = `${size}px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(ch, sx, sy + size * 0.06);
    }

    // --- building prisms ----------------------------------------------------
    // spec: how each node kind is extruded and colored.
    // Which themed site model a raw material gets (see drawSupplierSite):
    // the resource dictates the look — a farm for wheat, a lake + pump for
    // water, a mine mouth for ores, a fenced pasture for wool, a rubber
    // grove, a little fab for electronics.
    const SITE_OF = { wheat: 'farm', water: 'lake', ore: 'mine', coal: 'mine',
                      copper: 'mine', wool: 'pasture', rubber: 'grove', chips: 'fab' };
    const SITE_H = { farm: 12, lake: 9, mine: 20, pasture: 12, grove: 18, fab: 22 };

    function nodeSpec(n) {
        if (n.kind === 'supplier') {
            const base = SC.colorOf(n.mat);
            const site = SITE_OF[n.mat] || 'fab';
            return { base, fw: site === 'fab' ? 20 : 24, site,
                     h: SITE_H[site] + (n.level || 0) * 3, icon: SC.emojiOf(n.mat) };
        }
        if (n.kind === 'factory') {
            let base = '#6b7a90', h = 32, stories = 3, stack = true;
            if (['bread', 'shoes', 'steel', 'wire'].includes(n.recipe)) {
                base = '#7c8b9f'; h = 24; stories = 2; stack = true;
            } else if (['circuit', 'car'].includes(n.recipe)) {
                base = '#5c6b7e'; h = 42; stories = 4; stack = false;
            } else if (n.recipe === 'robot') {
                base = '#4b5563'; h = 52; stories = 5; stack = false;
            }
            return { base, fw: 22, h, icon: SC.emojiOf(n.recipe), roof: SC.colorOf(n.recipe), stories, stack, door: true };
        }
        if (n.kind === 'yard') {
            return { base: '#8b5cf6', fw: 21, h: 10, icon: '🅿️', flat: true };
        }
        if (n.kind === 'junction') {
            return { base: '#7d8898', fw: 15, h: 0 };
        }
        // city
        if (n.isHQ) return { base: '#0ea5e9', fw: 20, h: 46, stories: 6, door: true };
        return { base: '#10b981', fw: 18, h: 32, stories: 4, door: true };
    }

    // Screen point a tap/hover should hit-test against for a node — the
    // roof icon, raised above the flat ground point by the building's
    // iso-projected height (up to 54px at zoom 1 for HQ), same as
    // drawNodeBody's `tc`. Exported so input.js's node picking and the
    // inspect tooltip line up with what's actually drawn, instead of
    // hit-testing the ground point a building's tall icon visually sits
    // well above (which made tapping a node — especially HQ — miss).
    function nodeIconAnchor(n) {
        const sp = nodeSpec(n);
        const g = S(n.x, n.y);
        return { x: g.x, y: g.y - sp.h * zoom() };
    }

    // Extruded diamond prism rising `hpx` px from ground point (gx, gy).
    // Cheap deterministic hash → [0,1); no per-call allocation (unlike a
    // makeRng closure), so it's fine to call per window per frame.
    function hash01(seed, i) {
        const x = Math.sin(seed * 127.1 + i * 311.7) * 43758.5453;
        return x - Math.floor(x);
    }

    // Warm windows on one front face of a building prism. `origin` is the
    // shared front-bottom corner (bBot), `corner` the face's far ground
    // corner (bRight or bLeft); the face rises by `hpx`.
    function faceWindows(origin, corner, hpx, rows, seed) {
        const ex = corner.x - origin.x, ey = corner.y - origin.y;
        const cols = 2, du = 0.15, dv = 0.055;
        const P = (u, v) => ({ x: origin.x + ex * u, y: origin.y + ey * u - hpx * v });
        for (let r = 0; r < rows; r++) {
            const v = (r + 0.62) / (rows + 0.2);
            for (let c = 0; c < cols; c++) {
                const u = (c + 0.5) / cols;
                const lit = hash01(seed, r * 7 + c * 13);
                if (lit > 0.66) continue; // dark window: leave the wall as-is
                // Windows glow at night, all but dark by day.
                let a = 0.9 * (0.14 + 0.86 * nightLevel);
                const fl = hash01(seed, r * 5 + c * 3 + 1);
                if (fl > 0.82) a *= 0.5 + 0.5 * (0.5 + 0.5 * Math.sin(seaTime * 3 + fl * 25));
                const p1 = P(u - du, v - dv), p2 = P(u + du, v - dv),
                      p3 = P(u + du, v + dv), p4 = P(u - du, v + dv);
                ctx.globalAlpha = a;
                ctx.fillStyle = hash01(seed, r + c) > 0.5 ? '#ffd98a' : '#ffe6ad';
                ctx.beginPath();
                ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y);
                ctx.lineTo(p3.x, p3.y); ctx.lineTo(p4.x, p4.y); ctx.closePath();
                ctx.fill();
            }
        }
        ctx.globalAlpha = 1;
    }

    function prism(gx, gy, fw, hpx, base, opts) {
        opts = opts || {};
        const { rx, ry } = footRadii(fw);
        const alpha = opts.alpha == null ? 1 : opts.alpha;
        ctx.globalAlpha = alpha;

        // ground corners
        const bTop = { x: gx, y: gy - ry }, bRight = { x: gx + rx, y: gy };
        const bBot = { x: gx, y: gy + ry }, bLeft = { x: gx - rx, y: gy };
        // top-face corners (raised)
        const tTop = { x: bTop.x, y: bTop.y - hpx }, tRight = { x: bRight.x, y: bRight.y - hpx };
        const tBot = { x: bBot.x, y: bBot.y - hpx }, tLeft = { x: bLeft.x, y: bLeft.y - hpx };

        const topC = shade(base, 0.2), rightC = shade(base, -0.08), leftC = shade(base, -0.3);

        // right (front-right) face
        ctx.beginPath();
        ctx.moveTo(bRight.x, bRight.y); ctx.lineTo(bBot.x, bBot.y);
        ctx.lineTo(tBot.x, tBot.y); ctx.lineTo(tRight.x, tRight.y); ctx.closePath();
        ctx.fillStyle = opts.ghost ? rgba(base, 0.1) : rightC;
        ctx.fill();
        // left (front-left) face
        ctx.beginPath();
        ctx.moveTo(bBot.x, bBot.y); ctx.lineTo(bLeft.x, bLeft.y);
        ctx.lineTo(tLeft.x, tLeft.y); ctx.lineTo(tBot.x, tBot.y); ctx.closePath();
        ctx.fillStyle = opts.ghost ? rgba(base, 0.16) : leftC;
        ctx.fill();
        // top face
        ctx.beginPath();
        ctx.moveTo(tTop.x, tTop.y); ctx.lineTo(tRight.x, tRight.y);
        ctx.lineTo(tBot.x, tBot.y); ctx.lineTo(tLeft.x, tLeft.y); ctx.closePath();
        ctx.fillStyle = opts.roof ? shade(opts.roof, 0.05) : (opts.ghost ? rgba(base, 0.28) : topC);
        ctx.fill();

        // crisp edges
        ctx.lineJoin = 'round';
        ctx.lineWidth = 1;
        ctx.strokeStyle = opts.outline || rgba(shade(base, 0.4), opts.ghost ? 0.7 : 0.5);
        if (opts.dashed) ctx.setLineDash([5, 4]); else ctx.setLineDash([]);
        // outline the silhouette + the top ridge
        ctx.beginPath();
        ctx.moveTo(bLeft.x, bLeft.y); ctx.lineTo(bBot.x, bBot.y); ctx.lineTo(bRight.x, bRight.y);
        ctx.lineTo(tRight.x, tRight.y); ctx.lineTo(tTop.x, tTop.y); ctx.lineTo(tLeft.x, tLeft.y); ctx.closePath();
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(tBot.x, tBot.y); ctx.lineTo(tRight.x, tRight.y);
        ctx.moveTo(tBot.x, tBot.y); ctx.lineTo(tLeft.x, tLeft.y);
        ctx.moveTo(tBot.x, tBot.y); ctx.lineTo(tTop.x, tTop.y);
        ctx.stroke();
        ctx.setLineDash([]);

        // Story lines across the two front faces — cheap "this is a building
        // with floors" nuance. Each is a V at constant height following the
        // front silhouette (bRight→bBot→bLeft, raised by f·hpx).
        if (!opts.ghost && opts.stories > 1 && hpx > 10) {
            ctx.strokeStyle = rgba(shade(base, -0.45), 0.5);
            ctx.lineWidth = 1;
            for (let k = 1; k < opts.stories; k++) {
                const dy = hpx * k / opts.stories;
                ctx.beginPath();
                ctx.moveTo(bRight.x, bRight.y - dy);
                ctx.lineTo(bBot.x, bBot.y - dy);
                ctx.lineTo(bLeft.x, bLeft.y - dy);
                ctx.stroke();
            }
        }
        // Warm lit windows on the two front faces. Each face is spanned by
        // an origin (bBot) + a ground edge vector to the far corner + an
        // up vector (0,-hpx); a window at fraction (u,v) with half-size
        // (du,dv) maps to a parallelogram, so it sits correctly in iso.
        // Seeded per building so the lit/dark pattern is stable, with a few
        // flickering. Drawn every frame (buildings aren't in the bg cache).
        if (!opts.ghost && opts.windows && hpx > 16) {
            const rows = Math.max(2, opts.stories || 3);
            faceWindows(bBot, bRight, hpx, rows, opts.winSeed || 0);
            faceWindows(bBot, bLeft, hpx, rows, (opts.winSeed || 0) + 97);
        }
        // Doorway centered on the front (bottom) corner
        if (!opts.ghost && opts.door) {
            const dh = Math.min(hpx * 0.4, ry * 1.1);
            const dwx = rx * 0.16, dwy = ry * 0.16;
            ctx.beginPath();
            ctx.moveTo(bBot.x - dwx, bBot.y - dwy);
            ctx.lineTo(bBot.x + dwx, bBot.y - dwy);
            ctx.lineTo(bBot.x + dwx, bBot.y - dwy - dh);
            ctx.lineTo(bBot.x, bBot.y - dwy - dh - dwy * 0.6);
            ctx.lineTo(bBot.x - dwx, bBot.y - dwy - dh);
            ctx.closePath();
            ctx.fillStyle = rgba(shade(base, -0.6), 0.85);
            ctx.fill();
        }

        ctx.globalAlpha = 1;
        return { rx, ry, topCenter: { x: gx, y: gy - hpx }, bBot };
    }

    // Directional cast shadow via a pre-rendered radial sprite (ctx.filter
    // blur is too slow on mobile). The sprite is stretched from the building
    // base along the global light direction and its length grows with the
    // building's height and how low the sun/moon sits — long, raking shadows
    // at dawn/dusk, short pools at noon.
    let shadowSprite = null;
    function ensureShadowSprite() {
        if (shadowSprite) return;
        shadowSprite = document.createElement('canvas');
        shadowSprite.width = shadowSprite.height = 128;
        const c = shadowSprite.getContext('2d');
        const g = c.createRadialGradient(64, 64, 6, 64, 64, 62);
        g.addColorStop(0, 'rgba(5, 7, 12, 0.5)');
        g.addColorStop(0.6, 'rgba(5, 7, 12, 0.24)');
        g.addColorStop(1, 'rgba(5, 7, 12, 0)');
        c.fillStyle = g;
        c.fillRect(0, 0, 128, 128);
    }
    function drawShadow(gx, gy, fw, hpx) {
        ensureShadowSprite();
        const { rx, ry } = footRadii(fw);
        const len = rx * 1.05 + (hpx || 0) * shadowLen * 0.8; // reach along the light
        const wid = ry * 1.15;
        const ang = Math.atan2(shadowDY, shadowDX);
        ctx.save();
        ctx.globalAlpha = 0.32 + 0.22 * dayness; // firmer in daylight, soft at night
        ctx.translate(gx, gy + ry * 0.35);
        ctx.rotate(ang);
        // +x is now the shadow direction: span from just behind the base out to `len`
        ctx.drawImage(shadowSprite, -rx * 1.1, -wid, rx * 1.1 + len, wid * 2);
        ctx.restore();
        ctx.globalAlpha = 1;
    }

    // Emissive bloom: an additive ('lighter') soft glow around a light
    // source, so lit windows / beacons / headlights actually radiate at
    // night. Gated by the caller on nightLevel, so it costs nothing by day.
    function bloom(sx, sy, r, col, a) {
        if (a <= 0.01 || r <= 0) return;
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = a;
        const g = ctx.createRadialGradient(sx, sy, 0, sx, sy, r);
        g.addColorStop(0, col);
        g.addColorStop(0.4, rgba(col, 0.5));
        g.addColorStop(1, rgba(col, 0));
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(sx, sy, r, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
    }

    // Warm radial glow sprite (window light spilling onto the ground),
    // built once and tinted by drawImage's globalAlpha at the call site.
    let glowSprite = null;
    function warmGlowSprite() {
        if (!glowSprite) {
            glowSprite = document.createElement('canvas');
            glowSprite.width = glowSprite.height = 128;
            const c = glowSprite.getContext('2d');
            const g = c.createRadialGradient(64, 64, 4, 64, 64, 62);
            g.addColorStop(0, 'rgba(255, 214, 140, 0.5)');
            g.addColorStop(0.5, 'rgba(255, 190, 110, 0.16)');
            g.addColorStop(1, 'rgba(255, 190, 110, 0)');
            c.fillStyle = g;
            c.fillRect(0, 0, 128, 128);
        }
        return glowSprite;
    }

    // --- themed supplier sites ------------------------------------------------
    // Each raw material renders as a little scene instead of a generic box.
    // Same footprint/anchor contract as prism(): returns { rx, ry, topCenter }
    // where topCenter (ground point raised by spec height) is what the icon
    // badge, stock bar and input.js's hit capsule all key off.
    function drawSupplierSite(n, sp, g) {
        const z = zoom();
        const { rx, ry } = footRadii(sp.fw);
        const h = sp.h * z;
        const base = sp.base;

        if (sp.site === 'farm') {
            // Tilled field: soil in the plot, furrow rows along the iso axis,
            // a tiny barn on the back corner.
            ctx.save();
            diamondPath(g.x, g.y, rx * 0.92, ry * 0.92);
            ctx.clip();
            ctx.fillStyle = '#3a2e20';
            ctx.fillRect(g.x - rx, g.y - ry, rx * 2, ry * 2);
            ctx.strokeStyle = rgba(base, 0.6);
            ctx.lineWidth = Math.max(1.5, 2.2 * z);
            for (let k = -2; k <= 2; k++) {
                const ox = -0.5 * k * rx * 0.36, oy = 0.25 * k * rx * 0.36;
                ctx.beginPath();
                ctx.moveTo(g.x + ox - rx, g.y + oy - rx * 0.5);
                ctx.lineTo(g.x + ox + rx, g.y + oy + rx * 0.5);
                ctx.stroke();
            }
            ctx.restore();
            prism(g.x, g.y - ry * 0.62, 6, 9 * z, '#8a5a33');
        } else if (sp.site === 'lake') {
            // Pond with ripple rings + a pump hut piping out of it.
            const pg = ctx.createLinearGradient(0, g.y - ry, 0, g.y + ry);
            pg.addColorStop(0, '#1c4a6e');
            pg.addColorStop(1, '#0d2a44');
            ctx.beginPath();
            ctx.ellipse(g.x, g.y, rx * 0.8, ry * 0.8, 0, 0, Math.PI * 2);
            ctx.fillStyle = pg;
            ctx.fill();
            ctx.strokeStyle = 'rgba(6, 14, 24, 0.6)';
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.strokeStyle = 'rgba(150, 220, 255, 0.28)';
            ctx.lineWidth = 1.2;
            for (const rr of [0.35, 0.58]) {
                const ph = (seaTime * 0.5 + rr) % 1;
                ctx.globalAlpha = 0.6 * (1 - ph);
                ctx.beginPath();
                ctx.ellipse(g.x, g.y, rx * (0.2 + ph * rr), ry * (0.2 + ph * rr), 0, 0, Math.PI * 2);
                ctx.stroke();
            }
            ctx.globalAlpha = 1;
            ctx.strokeStyle = '#5a7d96';
            ctx.lineWidth = Math.max(2, 2.5 * z);
            ctx.beginPath();
            ctx.moveTo(g.x + rx * 0.55, g.y - 6 * z);
            ctx.lineTo(g.x + rx * 0.2, g.y);
            ctx.stroke();
            prism(g.x + rx * 0.62, g.y, 5.5, 8 * z, '#5a7d96');
        } else if (sp.site === 'mine') {
            // Rocky mound (tinted by the ore) with a dark adit + timber frame.
            const rockR = mix('#8a94a2', base, 0.4), rockL = shade(mix('#8a94a2', base, 0.4), -0.35);
            const apex = { x: g.x - rx * 0.1, y: g.y - h };
            ctx.beginPath();
            ctx.moveTo(apex.x, apex.y);
            ctx.lineTo(g.x + rx * 0.9, g.y);
            ctx.lineTo(g.x - rx * 0.15, g.y + ry * 0.28);
            ctx.closePath();
            ctx.fillStyle = rockR; ctx.fill();
            ctx.beginPath();
            ctx.moveTo(apex.x, apex.y);
            ctx.lineTo(g.x - rx * 0.9, g.y);
            ctx.lineTo(g.x - rx * 0.15, g.y + ry * 0.28);
            ctx.closePath();
            ctx.fillStyle = rockL; ctx.fill();
            // adit (entrance) with a timber lintel
            ctx.beginPath();
            ctx.ellipse(g.x - rx * 0.12, g.y + ry * 0.1, rx * 0.24, ry * 0.5, 0, Math.PI, 0);
            ctx.closePath();
            ctx.fillStyle = '#0a0d13'; ctx.fill();
            ctx.strokeStyle = '#6a4a2c';
            ctx.lineWidth = Math.max(1.5, 2 * z);
            ctx.beginPath();
            ctx.moveTo(g.x - rx * 0.38, g.y + ry * 0.12);
            ctx.lineTo(g.x - rx * 0.38, g.y - ry * 0.42);
            ctx.lineTo(g.x + rx * 0.14, g.y - ry * 0.42);
            ctx.lineTo(g.x + rx * 0.14, g.y + ry * 0.12);
            ctx.stroke();
            // spoil pebbles by the entrance
            ctx.fillStyle = rgba(base, 0.8);
            for (const [px, py] of [[0.35, 0.55], [0.52, 0.38], [0.42, 0.72]]) {
                ctx.beginPath();
                ctx.ellipse(g.x + rx * px - rx * 0.5, g.y + ry * py, 2.2 * z, 1.5 * z, 0, 0, Math.PI * 2);
                ctx.fill();
            }
        } else if (sp.site === 'pasture') {
            // Fenced grass plot with a small red barn. Sheep removed.
            diamondPath(g.x, g.y, rx * 0.9, ry * 0.9);
            ctx.fillStyle = 'rgba(58, 96, 64, 0.4)';
            ctx.fill();
            ctx.strokeStyle = 'rgba(201, 176, 138, 0.85)';
            ctx.lineWidth = Math.max(1.2, 1.5 * z);
            ctx.setLineDash([4 * z, 3 * z]);
            ctx.stroke();
            ctx.setLineDash([]);
            prism(g.x, g.y - ry * 0.55, 6.5, 9 * z, '#b91c1c');
        } else if (sp.site === 'grove') {
            // Rubber-tree grove: round canopies (unlike the wild pines).
            for (const [tx, ty, s] of [[-0.35, 0.05, 1], [0.05, -0.3, 0.9], [0.32, 0.28, 1.05]]) {
                const cx = g.x + rx * tx, cy = g.y + ry * ty;
                ctx.strokeStyle = '#4a3323';
                ctx.lineWidth = Math.max(1.5, 2 * z);
                ctx.beginPath();
                ctx.moveTo(cx, cy);
                ctx.lineTo(cx, cy - 9 * z * s);
                ctx.stroke();
                const cnp = mix('#3f7a4a', base, 0.25);
                ctx.fillStyle = cnp;
                ctx.beginPath();
                ctx.arc(cx, cy - 12 * z * s, 5.5 * z * s, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = mix(cnp, '#a9e7b8', 0.4);
                ctx.beginPath();
                ctx.arc(cx - 1.5 * z * s, cy - 13.5 * z * s, 2.4 * z * s, 0, Math.PI * 2);
                ctx.fill();
            }
        } else { // 'fab' — electronics: compact plant with a blinking antenna
            const info = prism(g.x, g.y, sp.fw, h, base, { stories: 2, door: true, windows: true, winSeed: n.id * 13 + 1 });
            const tc = info.topCenter;
            ctx.strokeStyle = '#9fb4c8';
            ctx.lineWidth = Math.max(1, 1.4 * z);
            ctx.beginPath();
            ctx.moveTo(tc.x + info.rx * 0.45, tc.y - info.ry * 0.2);
            ctx.lineTo(tc.x + info.rx * 0.45, tc.y - info.ry * 0.2 - 9 * z);
            ctx.stroke();
            const bl = 0.4 + 0.6 * Math.max(0, Math.sin(seaTime * 5));
            const ax = tc.x + info.rx * 0.45, ay = tc.y - info.ry * 0.2 - 10 * z;
            bloom(ax, ay, 9 * z, '#7de3ff', bl * (0.4 + 0.5 * nightLevel));
            ctx.globalAlpha = bl;
            ctx.fillStyle = '#7de3ff';
            ctx.beginPath();
            ctx.arc(ax, ay, 1.6 * z, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
            return info;
        }
        return { rx, ry, topCenter: { x: g.x, y: g.y - h } };
    }

    // Junction: a small roundabout — asphalt ring, a dashed lane guide, and
    // a planted center island — instead of a building, since it has no
    // supply/demand of its own to put a badge on.
    function drawJunction(n, sp, g) {
        const z = zoom();
        const { rx, ry } = footRadii(sp.fw);

        ctx.beginPath();
        ctx.ellipse(g.x, g.y, rx, ry, 0, 0, Math.PI * 2);
        ctx.fillStyle = sp.base;
        ctx.fill();
        ctx.strokeStyle = 'rgba(8, 12, 20, 0.55)';
        ctx.lineWidth = Math.max(1.5, 2 * z);
        ctx.stroke();

        ctx.strokeStyle = 'rgba(250, 204, 21, 0.55)';
        ctx.lineWidth = Math.max(1, 1.2 * z);
        ctx.setLineDash([3 * z, 3 * z]);
        ctx.beginPath();
        ctx.ellipse(g.x, g.y, rx * 0.72, ry * 0.72, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.beginPath();
        ctx.ellipse(g.x, g.y, rx * 0.42, ry * 0.42, 0, 0, Math.PI * 2);
        ctx.fillStyle = '#3a5a3f';
        ctx.fill();
        ctx.strokeStyle = 'rgba(6, 14, 10, 0.5)';
        ctx.lineWidth = 1;
        ctx.stroke();

        // a little shrub planted in the island
        ctx.fillStyle = '#2f6b3f';
        ctx.beginPath();
        ctx.arc(g.x, g.y - 2.5 * z, 3 * z, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = mix('#2f6b3f', '#a9e7b8', 0.35);
        ctx.beginPath();
        ctx.arc(g.x - z, g.y - 3.5 * z, 1.4 * z, 0, Math.PI * 2);
        ctx.fill();

        return { rx, ry, topCenter: { x: g.x, y: g.y - 6 * z } };
    }

    // Iso ring/pad on the ground (selection, unlock pulse, inspect focus).
    function groundRing(gx, gy, fw, color, width, scale) {
        const { rx, ry } = footRadii(fw);
        diamondPath(gx, gy, rx * (scale || 1), ry * (scale || 1));
        ctx.strokeStyle = color;
        ctx.lineWidth = width;
        ctx.stroke();
    }

    function drawNodeBody(n, now) {
        const sp = nodeSpec(n);
        const g = S(n.x, n.y);
        const iconSize = 16 * clampZoom();
        const forSale = n.kind === 'factory' && n.forSale;

        // Plot pad: a subtle paved apron the building sits on, so sites
        // read as intentional lots rather than blocks dropped on grass.
        // Feathered (radial fade to transparent) rather than a flat fill,
        // so its own edge doesn't add a second hard boundary on top of
        // whatever depth-sort seam a nearby truck might already be riding.
        const pad = footRadii(sp.fw + 9);
        ctx.save();
        diamondPath(g.x, g.y, pad.rx, pad.ry);
        ctx.clip();
        const padFade = ctx.createRadialGradient(g.x, g.y, 0, g.x, g.y, Math.max(pad.rx, pad.ry));
        padFade.addColorStop(0, 'rgba(10, 16, 26, 0.32)');
        padFade.addColorStop(0.75, 'rgba(10, 16, 26, 0.18)');
        padFade.addColorStop(1, 'rgba(10, 16, 26, 0)');
        ctx.fillStyle = padFade;
        ctx.fillRect(g.x - pad.rx, g.y - pad.ry, pad.rx * 2, pad.ry * 2);
        ctx.restore();
        ctx.strokeStyle = rgba(sp.base, 0.2);
        ctx.lineWidth = 1;
        diamondPath(g.x, g.y, pad.rx, pad.ry);
        ctx.stroke();

        // Warm light-spill: lit buildings cast a soft pool of window-glow on
        // the ground around them (cached sprite, cheap additive-ish blit).
        const litKind = (n.kind === 'city') || (n.kind === 'factory' && !forSale) ||
                        (n.kind === 'supplier' && sp.site === 'fab');
        if (litKind && nightLevel > 0.08) {
            const gr = footRadii(sp.fw + 20);
            ctx.globalAlpha = 0.5 * nightLevel;
            ctx.drawImage(warmGlowSprite(), g.x - gr.rx, g.y - gr.ry, gr.rx * 2, gr.ry * 2);
            ctx.globalAlpha = 1;
        }

        // selection / focus pads on the ground (drawn under the building)
        if (n === SC.state.selectedNode) {
            groundRing(g.x, g.y, sp.fw + 6, 'rgba(56, 189, 248, 0.9)', 2.5);
        } else if (n === frameHoverNode) {
            // PC affordance: the building a click would hit right now
            groundRing(g.x, g.y, sp.fw + 6, 'rgba(226, 232, 240, 0.5)', 1.5);
        }
        if (n.unlockAt && now - n.unlockAt < 3) {
            const t = (now - n.unlockAt) / 3;
            groundRing(g.x, g.y, sp.fw, `rgba(56, 189, 248, ${0.7 * (1 - t)})`, 3, 1 + t * 2.2);
        }

        const info = n.kind === 'supplier' ? drawSupplierSite(n, sp, g) // themed scene: farm/lake/mine/…
            : n.kind === 'junction' ? drawJunction(n, sp, g) // roundabout, not a building
            : prism(g.x, g.y, sp.fw, sp.h * zoom(), sp.base, {
                  ghost: forSale, dashed: forSale, roof: forSale ? null : sp.roof,
                  alpha: forSale ? 0.9 : 1,
                  stories: forSale ? 0 : sp.stories, door: !forSale && sp.door,
                  windows: !forSale, winSeed: n.id * 13 + 1
              });
        const tc = info.topCenter;

        // Factory smokestack (back corner of the roof) + a puff of smoke while
        // it's actually crafting — a live "the plant is working" cue.
        if (n.kind === 'factory' && !forSale && sp.stack) {
            const z = zoom();
            const stx = tc.x - info.rx * 0.5, sty = tc.y - info.ry * 0.5;
            const sw = Math.max(2, 3 * z), sh = Math.max(6, 11 * z);
            ctx.fillStyle = shade(sp.base, -0.35);
            ctx.fillRect(stx - sw, sty - sh, sw * 2, sh);
            ctx.fillStyle = shade(sp.base, 0.05);
            ctx.fillRect(stx - sw, sty - sh, sw, sh);
            ctx.fillStyle = '#3a2f2a';
            ctx.fillRect(stx - sw, sty - sh - 2, sw * 2, 2);
            if (n.crafting) {
                for (let i = 0; i < 3; i++) {
                    const ph = (seaTime * 0.6 + i / 3) % 1;
                    const py = sty - sh - ph * 26 * z;
                    ctx.globalAlpha = 0.25 * (1 - ph);
                    ctx.fillStyle = '#cbd5e1';
                    ctx.beginPath();
                    ctx.arc(stx + Math.sin(ph * 6 + i) * 3 * z, py, (2 + ph * 5) * z, 0, Math.PI * 2);
                    ctx.fill();
                }
                ctx.globalAlpha = 1;
            }
        }

        // Crafting progress: a slim ring hugging the roof icon (with a faint
        // full-circle track), small enough not to clip the smokestack.
        if (n.kind === 'factory' && !forSale && n.crafting) {
            const frac = Math.min(1, n.crafting.t / SC.craftTime());
            const rr = iconSize * 0.85;
            const cy = tc.y - 4 * clampZoom(); // Center it with the emoji plate
            ctx.beginPath();
            ctx.arc(tc.x, cy, rr, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.14)';
            ctx.lineWidth = 2.5;
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(tc.x, cy, rr, -Math.PI / 2, -Math.PI / 2 + frac * Math.PI * 2);
            ctx.strokeStyle = SC.colorOf(n.crafting.task.product);
            ctx.lineCap = 'round';
            ctx.stroke();
            ctx.lineCap = 'butt';
        }

        // Icon on the roof — suppliers and factories get a compact plate badge 
        // floating over the scene. HQ and DC have no icon. A junction skips this entirely.
        ctx.globalAlpha = forSale ? 0.6 : 1;
        if (n.kind === 'junction' || !sp.icon) {
            // no icon
        } else if (n.kind === 'supplier' || n.kind === 'factory') {
            emojiPlateAt(sp.icon, tc.x, tc.y - 4 * clampZoom(), 9 * clampZoom(), 13 * clampZoom());
        } else {
            emoji(sp.icon, tc.x, tc.y - iconSize * 0.15, iconSize);
        }
        ctx.globalAlpha = 1;

        // Queue status: if producing, show how many tasks and ingredients needed vs have
        if (n.kind === 'factory' && !forSale && n.queue && n.queue.length > 0) {
            let queueNeeds = {};
            let queueHave = {};
            for (const t of n.queue) {
                for (const m in t.needs) {
                    queueNeeds[m] = (queueNeeds[m] || 0) + t.needs[m];
                    queueHave[m] = (queueHave[m] || 0) + (t.have[m] || 0);
                }
            }
            for (const m in n.inv) {
                if (queueNeeds[m]) queueHave[m] = (queueHave[m] || 0) + n.inv[m];
            }
            
            const needsKeys = Object.keys(queueNeeds);
            if (needsKeys.length > 0) {
                const z = clampZoom();
                const sy = tc.y - 28 * z;
                ctx.font = `600 ${9 * z}px Inter, system-ui, sans-serif`;
                
                const qText = `${n.queue.length}`;
                const qW = ctx.measureText(qText).width;
                
                let segments = [];
                let totalW = 6 * z + qW + 12 * z + 6 * z;
                for (const m of needsKeys) {
                    const have = Math.min(queueHave[m], queueNeeds[m]);
                    const need = queueNeeds[m];
                    const text = `${have}/${need}`;
                    const w = 12 * z + ctx.measureText(text).width + 6 * z;
                    segments.push({ m, text, w, have, need });
                    totalW += w;
                }
                
                let cx = tc.x - totalW / 2;
                
                ctx.fillStyle = 'rgba(12, 18, 30, 0.85)';
                roundRectPath(cx, sy - 8 * z, totalW, 16 * z, 6 * z);
                ctx.fill();
                
                cx += 6 * z;
                ctx.textAlign = 'left';
                ctx.textBaseline = 'middle';
                ctx.fillStyle = '#cbd5e1';
                ctx.fillText(qText, cx, sy);
                cx += qW + 6 * z;
                emoji(SC.emojiOf(n.recipe), cx, sy, 10 * z);
                cx += 6 * z + 3 * z;
                
                ctx.fillStyle = 'rgba(255,255,255,0.2)';
                ctx.fillRect(cx, sy - 5 * z, 1, 10 * z);
                cx += 4 * z;
                
                for (const seg of segments) {
                    emoji(SC.emojiOf(seg.m), cx + 5 * z, sy, 10 * z);
                    cx += 11 * z;
                    ctx.fillStyle = seg.have >= seg.need ? '#34d399' : '#f87171';
                    ctx.fillText(seg.text, cx, sy);
                    cx += ctx.measureText(seg.text).width + 6 * z;
                }
            }
        }

        // HQ landmark beacon: a short mast with a slow-blinking red light and
        // halo on top, so HQ reads as the tallest, most important structure.
        if (n.isHQ) {
            const z = clampZoom();
            const bx = tc.x, by = tc.y - iconSize - 6 * z;
            ctx.strokeStyle = 'rgba(148, 163, 184, 0.7)';
            ctx.lineWidth = Math.max(1, 1.4 * z);
            ctx.beginPath();
            ctx.moveTo(bx, tc.y - iconSize * 0.2);
            ctx.lineTo(bx, by);
            ctx.stroke();
            const blink = 0.35 + 0.65 * Math.pow(0.5 + 0.5 * Math.sin(seaTime * 3.2), 3);
            bloom(bx, by, 16 * z, '#f87171', blink * (0.35 + 0.4 * nightLevel));
            ctx.globalAlpha = blink * 0.5;
            ctx.fillStyle = '#f87171';
            ctx.beginPath(); ctx.arc(bx, by, 6 * z, 0, Math.PI * 2); ctx.fill();
            ctx.globalAlpha = blink;
            ctx.fillStyle = '#fca5a5';
            ctx.beginPath(); ctx.arc(bx, by, 2.2 * z, 0, Math.PI * 2); ctx.fill();
            ctx.globalAlpha = 1;
        }

        // Emissive bloom: lit buildings radiate a soft warm halo at night.
        if (litKind && nightLevel > 0.12) {
            const fr = footRadii(sp.fw);
            bloom(tc.x, tc.y + fr.ry * 0.5, fr.rx * 1.5, '#ffcf8a', 0.2 * nightLevel);
        }

        // --- per-kind badges/bars -------------------------------------------
        if (n.kind === 'supplier') {
            const cap = SC.supplierCap(n);
            const frac = Math.max(0, Math.min(1, (n.stock || 0) / cap));
            const bw = 34, bx = tc.x - bw / 2, by = tc.y - iconSize - 9;
            // dark backing plate so the bar doesn't float as a bare dash
            ctx.fillStyle = 'rgba(12, 18, 30, 0.75)';
            roundRectPath(bx - 3, by - 3, bw + 6, 10, 5); ctx.fill();
            ctx.fillStyle = 'rgba(255, 255, 255, 0.16)';
            roundRectPath(bx, by, bw, 4, 2); ctx.fill();
            ctx.fillStyle = frac < 0.25 ? '#f87171' : sp.base;
            roundRectPath(bx, by, bw * frac, 4, 2); ctx.fill();
            if (n.level > 0) labelAt('▲'.repeat(n.level), tc.x, by - 13, '#facc15', 10);
        } else if (n.kind === 'factory' && forSale) {
            labelAt(`$${SC.CONFIG.FACTORY_SITE_PRICE}`, tc.x, tc.y - iconSize - 6, '#94a3b8', 11);
        } else if (n.kind === 'factory' && n.queue.length > 0) {
            labelAt(String(n.queue.length + (n.crafting ? 1 : 0)), tc.x + info.rx + 8, tc.y - iconSize * 0.5, '#cbd5e1', 11);
        } else if (n.kind === 'yard') {
            const parked = SC.state.trucks.filter(t => t.homeYard === n).length;
            labelAt(`${parked} 🚚`, g.x, g.y + footRadii(sp.fw).ry + 12, '#c4b5fd', 11);
        } else if (n.kind === 'city') {
            labelAt(n.isHQ ? 'HQ' : 'DC', g.x, g.y + footRadii(sp.fw).ry + 12, n.isHQ ? '#38bdf8' : '#34d399', 11);
            if (n.isHQ) {
                const parked = SC.state.trucks.filter(t => t.homeYard === n).length;
                labelAt(`${parked} 🚚`, g.x, g.y + footRadii(sp.fw).ry + 28, '#7dd3fc', 10);
            }
        }
    }

    // --- trucks -------------------------------------------------------------
    function truckScreenAngle(t) {
        // world heading -> screen heading through the iso projection
        const dx = Math.cos(t.angle || 0), dy = Math.sin(t.angle || 0);
        return Math.atan2((dx + dy) * ISO.ky, (dx - dy) * ISO.kx);
    }

    // Extrude a heading-aligned rounded box: a rect of size w×h centered at
    // local offset cx (along the heading), raised `dy` into the iso plane.
    function isoBoxSlab(g, ang, cx, dy, w, h, r, fill) {
        ctx.save();
        ctx.translate(g.x, g.y - dy);
        ctx.rotate(ang);
        ctx.scale(1, 0.6); // lie down into the iso ground plane
        roundRectPath(cx - w / 2, -h / 2, w, h, r);
        ctx.fillStyle = fill;
        ctx.fill();
        ctx.restore();
    }

    function drawTruckBody(t) {
        const g = S(t.x, t.y);
        const z = clampZoom();
        const item = t.cargo[0];
        const body = item ? SC.colorOf(item) : '#8b98ab';
        const ang = truckScreenAngle(t);
        const L = 26 * z, W = 11 * z;         // footprint length / width
        const Ht = 9 * z, Hc = 6.5 * z;        // trailer / cab heights
        const trailerCx = -L * 0.16, trailerW = L * 0.68;
        const cabCx = L * 0.34, cabW = L * 0.32;
        const steps = 5;

        // ground shadow
        ctx.save();
        ctx.globalAlpha = 0.3;
        diamondPath(g.x, g.y + 2 * z, 15 * z, 8 * z);
        ctx.fillStyle = '#05070c';
        ctx.fill();
        ctx.restore();

        // wheels peeking out at the base
        ctx.save();
        ctx.translate(g.x, g.y); ctx.rotate(ang); ctx.scale(1, 0.6);
        ctx.fillStyle = '#12161d';
        for (const wx of [-L * 0.28, L * 0.2]) {
            for (const wy of [-W * 0.52, W * 0.52]) {
                ctx.beginPath(); ctx.ellipse(wx, wy, 3.2 * z, 2.4 * z, 0, 0, Math.PI * 2); ctx.fill();
            }
        }
        ctx.restore();

        // trailer (colored by cargo) and cab, each extruded dark→light
        for (let s = 0; s <= steps; s++) {
            isoBoxSlab(g, ang, trailerCx, Ht * s / steps, trailerW, W, 3 * z, shade(body, -0.34 + 0.5 * (s / steps)));
        }
        const cabBody = shade(body, -0.06);
        for (let s = 0; s <= steps; s++) {
            isoBoxSlab(g, ang, cabCx, Hc * s / steps, cabW, W * 0.9, 2.5 * z, shade(cabBody, -0.34 + 0.5 * (s / steps)));
        }
        // trailer roof outline
        ctx.save();
        ctx.translate(g.x, g.y - Ht); ctx.rotate(ang); ctx.scale(1, 0.6);
        roundRectPath(trailerCx - trailerW / 2, -W / 2, trailerW, W, 3 * z);
        ctx.strokeStyle = rgba(shade(body, 0.45), 0.55); ctx.lineWidth = 1; ctx.stroke();
        ctx.restore();
        // windshield glint on the cab front
        ctx.save();
        ctx.translate(g.x, g.y - Hc); ctx.rotate(ang); ctx.scale(1, 0.6);
        ctx.fillStyle = 'rgba(186, 214, 236, 0.55)';
        roundRectPath(cabCx + cabW * 0.06, -W * 0.32, cabW * 0.3, W * 0.64, 1.5 * z);
        ctx.fill();
        ctx.restore();

        // Headlights: only at dusk/night and only while moving. Just two soft
        // warm points with a small glow — no hard beam cone (that read as a
        // stray triangle in daylight); they fade in as the light drops.
        if (t.path && nightLevel > 0.3) {
            ctx.save();
            ctx.translate(g.x, g.y - 2 * z); ctx.rotate(ang); ctx.scale(1, 0.6);
            const nose = cabCx + cabW / 2;
            for (const wy of [-W * 0.28, W * 0.28]) {
                const gr = ctx.createRadialGradient(nose, wy, 0, nose, wy, 7 * z);
                gr.addColorStop(0, `rgba(255, 240, 190, ${0.85 * nightLevel})`);
                gr.addColorStop(1, 'rgba(255, 236, 180, 0)');
                ctx.fillStyle = gr;
                ctx.beginPath(); ctx.arc(nose, wy, 7 * z, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = `rgba(255, 245, 210, ${nightLevel})`;
                ctx.beginPath(); ctx.arc(nose, wy, 1.2 * z, 0, Math.PI * 2); ctx.fill();
            }
            ctx.restore();
        }

        if (item) {
            emojiPlateAt(SC.emojiOf(item), g.x, g.y - Ht - 8 * z, 9 * z, 13 * z);
            if (t.cargo.length > 1) labelAt('×' + t.cargo.length, g.x + 13 * z, g.y - Ht - 15 * z, '#f8fafc', 9);
        }
    }

    function emojiPlateAt(ch, sx, sy, r, size) {
        ctx.beginPath();
        ctx.arc(sx, sy, r, 0, Math.PI * 2);
        ctx.fillStyle = '#1e293b';
        ctx.fill();
        ctx.lineWidth = 1;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.stroke();
        emoji(ch, sx, sy, size);
    }

    // --- order bubbles (billboards, always on top) --------------------------
    function drawOrderBubbles() {
        const byCity = new Map();
        for (const o of SC.state.orders) {
            if (!byCity.has(o.city)) byCity.set(o.city, []);
            byCity.get(o.city).push(o);
        }
        const z = clampZoom();
        for (const [city, orders] of byCity) {
            const sp = nodeSpec(city);
            const anchor = { x: S(city.x, city.y).x, y: S(city.x, city.y).y - sp.h * zoom() };
            orders.forEach((o, i) => {
                const bx = anchor.x + (i - (orders.length - 1) / 2) * 40 * z;
                const by = anchor.y - 34 * z;
                const r = 15 * z;
                const frac = Math.max(0, o.deadline / o.deadlineTotal);
                const urgent = frac < 0.25;

                // pointer down to the roof
                ctx.beginPath();
                ctx.moveTo(bx, by + r);
                ctx.lineTo(bx - 4 * z, by + r - 2 * z);
                ctx.lineTo(bx + 4 * z, by + r - 2 * z);
                ctx.closePath();
                ctx.fillStyle = '#1e293b';
                ctx.fill();

                ctx.beginPath();
                ctx.arc(bx, by, r, 0, Math.PI * 2);
                ctx.fillStyle = '#1e293b';
                ctx.fill();
                ctx.strokeStyle = urgent ? '#f87171' : 'rgba(148, 163, 184, 0.55)';
                ctx.lineWidth = 1.5;
                ctx.stroke();

                ctx.beginPath();
                ctx.arc(bx, by, r, -Math.PI / 2, -Math.PI / 2 + frac * Math.PI * 2);
                ctx.strokeStyle = urgent ? '#f87171' : SC.colorOf(o.product);
                ctx.lineWidth = 3;
                ctx.lineCap = 'round';
                ctx.stroke();
                ctx.lineCap = 'butt';

                emoji(SC.emojiOf(o.product), bx, by, 17 * z);
                const left = o.qty - o.deliveredUnits;
                if (left > 1) labelAt(String(left), bx + r + 2, by - r + 2, '#f8fafc', 10);
                if (o.noRoute) labelAt('no route!', bx, by - r - 10, '#f87171', 10);
            });
        }
    }

    // --- glow overlays on roads (order / inspect highlight) -----------------
    // Each path may carry a `.good` property (see inspect.collectRoutePaths):
    // that leg is tinted by the cargo hauled on it — e.g. a bread order
    // glows gold on the wheat leg, blue on the water leg and orange on the
    // final bread leg — so a route reads as its chain steps. `color` is the
    // fallback for legs without a good.
    function drawGlowPaths(paths, color, alpha) {
        ctx.lineCap = 'round';
        for (const path of paths) {
            const legColor = path.good ? SC.colorOf(path.good) : color;
            ctx.beginPath();
            path.forEach((n, i) => {
                const p = S(n.x, n.y);
                i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y);
            });
            ctx.strokeStyle = legColor;
            ctx.globalAlpha = alpha;
            ctx.lineWidth = Math.max(5, 8 * zoom());
            ctx.shadowBlur = 12;
            ctx.shadowColor = legColor;
            ctx.stroke();
        }
        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;
        ctx.lineCap = 'butt';
    }

    function drawHighlight(now) {
        const h = SC.state.highlight;
        if (!h || now > h.until) return;
        const fade = Math.min(1, (h.until - now) / 0.5);
        drawGlowPaths(h.paths, h.color, 0.55 * fade);
        const c = S(h.city.x, h.city.y);
        const pulse = (22 + Math.sin(now * 6) * 4) * clampZoom();
        ctx.beginPath();
        ctx.ellipse(c.x, c.y, pulse, pulse * 0.55, 0, 0, Math.PI * 2);
        ctx.strokeStyle = h.color;
        ctx.globalAlpha = 0.8 * fade;
        ctx.lineWidth = 2.5;
        ctx.stroke();
        ctx.globalAlpha = 1;
    }

    function drawInspectHighlight(now) {
        if (SC.state.mode !== 'inspect') return;
        const node = SC.input.getInspectNode && SC.input.getInspectNode();
        const info = SC.inspect.infoFor(node);
        if (!info) return;
        const paths = SC.inspect.highlightPathsFor(info);
        const color = info.kind === 'supplier' ? SC.colorOf(info.mat) : '#38bdf8';
        const pulse = 1 + Math.sin(now * 6) * 0.15;
        drawGlowPaths(paths, color, 0.6 * pulse);
        const sp = nodeSpec(node);
        const g = S(node.x, node.y);
        groundRing(g.x, g.y, sp.fw + 8, color, 2.5);
    }

    // --- ghosts (road drag, manual placement) -------------------------------
    function drawGhostRoad() {
        const sel = SC.state.selectedNode;
        const hover = SC.input.getHover && SC.input.getHover();
        if (!sel || !hover) return;
        // Snap to whatever node a tap right now would actually hit (same
        // capsule hit-test as input.handleTap), so the preview never
        // disagrees with the click.
        let target = SC.input.getHoverNode && SC.input.getHoverNode();
        if (target === sel) target = null;
        const end = target ? { x: target.x, y: target.y } : hover;
        // Shows the bridge cost when crossing the river — the actual
        // bridge-vs-ferry choice happens in a modal once the road is tapped.
        const q = target ? SC.roads.quote(sel, target) : (() => {
            const len = Math.hypot(sel.x - end.x, sel.y - end.y);
            const bridge = SC.map.segmentCrossesRiver(sel.x, sel.y, end.x, end.y);
            const mult = bridge ? SC.CONFIG.BRIDGE_MULT : 1;
            return { len, bridge, ferry: false, cost: Math.round(len * SC.CONFIG.ROAD_COST_PER_UNIT * mult) };
        })();
        if (!q) return;

        const affordable = SC.canAfford(q.cost);
        const a = S(sel.x, sel.y), b = S(end.x, end.y);
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.strokeStyle = affordable ? 'rgba(52, 211, 153, 0.7)' : 'rgba(248, 113, 113, 0.7)';
        ctx.lineWidth = Math.max(3, 4 * zoom());
        ctx.lineCap = 'round';
        ctx.setLineDash([10, 8]);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.lineCap = 'butt';

        const mx = (sel.x + end.x) / 2, my = (sel.y + end.y) / 2;
        const crossingLabel = q.ferry ? ' (ferry)' : q.bridge ? ' (bridge)' : '';
        const mp = S(mx, my);
        labelAt(`$${q.cost}${crossingLabel}`, mp.x, mp.y - 14, affordable ? '#34d399' : '#f87171');
    }

    function drawPlacementGhost() {
        const pm = SC.state.placeMode;
        const hover = SC.input.getHover && SC.input.getHover();
        if (!pm || !hover) return;

        let valid = SC.canAfford(SC.placement.price(pm.kind));
        let x = hover.x, y = hover.y;
        if (pm.kind === 'intersection') {
            const crossing = SC.placement.canPlaceIntersectionAt(x, y);
            if (crossing) {
                x = crossing.x;
                y = crossing.y;
            } else {
                valid = false;
            }
        } else {
            valid = valid && SC.placement.canPlaceAt(x, y);
        }

        const cost = SC.placement.price(pm.kind);
        const base = valid ? '#34d399' : '#f87171';
        const g = S(x, y);
        const fw = 24;
        // footprint ghost pad
        const { rx, ry } = footRadii(fw);
        diamondPath(g.x, g.y, rx, ry);
        ctx.strokeStyle = rgba(base, 0.9);
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 5]);
        ctx.stroke();
        ctx.setLineDash([]);
        let tc;
        if (pm.kind === 'junction' || pm.kind === 'intersection') {
            // Roundabout footprint, not a building — an outlined ring
            // instead of the usual prism-ghost.
            ctx.beginPath();
            ctx.ellipse(g.x, g.y, rx * 0.65, ry * 0.65, 0, 0, Math.PI * 2);
            ctx.strokeStyle = rgba(base, 0.9);
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 4]);
            ctx.stroke();
            ctx.setLineDash([]);
            tc = { x: g.x, y: g.y - 10 * zoom() };
            if (pm.kind === 'intersection') {
                ctx.globalAlpha = 0.85;
                emoji('➕', g.x, g.y - 4 * zoom(), 14 * clampZoom());
                ctx.globalAlpha = 1;
            }
        } else {
            const ghostH = pm.kind === 'yard' ? 14 : 30;
            prism(g.x, g.y, fw, ghostH * zoom(), base,
                  { ghost: true, dashed: true, outline: rgba(base, 0.9) });
            tc = { x: g.x, y: g.y - ghostH * zoom() };
            ctx.globalAlpha = 0.85;
            emoji(pm.kind === 'yard' ? '🅿️' : SC.emojiOf(pm.good), tc.x, tc.y, 18 * clampZoom());
            ctx.globalAlpha = 1;
        }
        labelAt(`$${cost}${valid ? '' : ' — blocked'}`, tc.x, tc.y - 20, valid ? '#34d399' : '#f87171', 11);
    }

    // --- floaters (rising $ texts) -----------------------------------------
    function drawFloaters(dt) {
        for (let i = floaters.length - 1; i >= 0; i--) {
            const f = floaters[i];
            f.t += dt;
            if (f.t >= 1.6) { floaters.splice(i, 1); continue; }
            const p = S(f.x, f.y);
            const rise = f.t * 30;
            ctx.font = `700 14px Inter, system-ui, sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.globalAlpha = Math.min(1, 2 * (1.6 - f.t));
            ctx.fillStyle = 'rgba(8, 12, 20, 0.7)';
            ctx.fillText(f.text, p.x + 1, p.y - rise + 1);
            ctx.fillStyle = f.color;
            ctx.fillText(f.text, p.x, p.y - rise);
            ctx.globalAlpha = 1;
        }
    }

    // Celebratory coin/spark burst + a delivery ring, fired on orderComplete.
    let bursts = [];
    function addBurst(wx, wy) {
        for (let i = 0; i < 12; i++) {
            const a = Math.random() * Math.PI * 2, sp = 24 + Math.random() * 70;
            bursts.push({ t: 'p', x: wx, y: wy, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 55,
                          life: 0, dur: 0.75 + Math.random() * 0.4,
                          c: Math.random() > 0.35 ? '#fde68a' : '#34d399' });
        }
        bursts.push({ t: 'ring', x: wx, y: wy, life: 0, dur: 0.6 });
    }
    function drawBursts(dt) {
        const z = clampZoom();
        for (let i = bursts.length - 1; i >= 0; i--) {
            const b = bursts[i];
            b.life += dt;
            if (b.life >= b.dur) { bursts.splice(i, 1); continue; }
            const f = b.life / b.dur;
            if (b.t === 'ring') {
                const p = S(b.x, b.y);
                ctx.strokeStyle = `rgba(253, 230, 138, ${0.6 * (1 - f)})`;
                ctx.lineWidth = 2.5;
                ctx.beginPath();
                ctx.ellipse(p.x, p.y, (8 + f * 40) * z, (8 + f * 40) * z * 0.5, 0, 0, Math.PI * 2);
                ctx.stroke();
            } else {
                b.vy += 150 * dt; // gravity (falls back toward the ground)
                b.x += b.vx * dt; b.y += b.vy * dt;
                const p = S(b.x, b.y);
                ctx.globalAlpha = 1 - f;
                ctx.fillStyle = b.c;
                ctx.beginPath(); ctx.arc(p.x, p.y, 2.6 * z, 0, Math.PI * 2); ctx.fill();
            }
        }
        ctx.globalAlpha = 1;
    }

    // Loading / unloading: a little crate hops up into a truck when it picks
    // cargo up and drops down into the node when it delivers. Detected purely
    // render-side by watching each truck's cargo length change (no gameplay/
    // logic hooks), so it stays cosmetic.
    let transfers = [];
    const cargoLen = new Map();   // truck id -> last cargo length
    const cargoLast = new Map();  // truck id -> last non-empty item (for unload colour)
    function updateTransfers(dt) {
        for (const t of SC.state.trucks) {
            const prev = cargoLen.get(t.id) || 0, now = t.cargo.length;
            if (now > prev && t.cargo[0]) {
                transfers.push({ x: t.x, y: t.y, item: t.cargo[0], dir: 1, life: 0, dur: 0.55 });
            } else if (now < prev) {
                const item = cargoLast.get(t.id);
                if (item) transfers.push({ x: t.x, y: t.y, item, dir: -1, life: 0, dur: 0.55 });
            }
            cargoLen.set(t.id, now);
            if (t.cargo[0]) cargoLast.set(t.id, t.cargo[0]);
        }
        for (let i = transfers.length - 1; i >= 0; i--) {
            transfers[i].life += dt;
            if (transfers[i].life >= transfers[i].dur) transfers.splice(i, 1);
        }
    }
    // A small wooden crate tinted by its cargo, with the good's emoji on top.
    function drawCrate(sx, sy, s, item, alpha) {
        const col = SC.colorOf(item);
        ctx.globalAlpha = alpha;
        roundRectPath(sx - s, sy - s * 0.85, s * 2, s * 1.7, s * 0.3);
        ctx.fillStyle = shade(col, -0.12); ctx.fill();
        ctx.strokeStyle = rgba(shade(col, 0.45), 0.7); ctx.lineWidth = 1; ctx.stroke();
        ctx.strokeStyle = rgba(shade(col, -0.45), 0.6);
        ctx.beginPath(); ctx.moveTo(sx - s, sy); ctx.lineTo(sx + s, sy); ctx.stroke();
        emoji(SC.emojiOf(item), sx, sy, s * 1.55);
        ctx.globalAlpha = 1;
    }
    // One crate, drawn interleaved with the buildings/trucks by depth so a
    // site in front correctly clips it.
    function drawTransfer(tr) {
        const z = clampZoom();
        const f = tr.life / tr.dur;
        const p = S(tr.x, tr.y);
        // load: crate rises from the ground into the truck bed then fades;
        // unload: crate lowers from the bed to the ground.
        const lift = tr.dir > 0 ? -(6 + f * 16) * z : -(6 + (1 - f) * 16) * z;
        const alpha = tr.dir > 0 ? Math.min(1, (1 - f) * 1.6) : Math.min(1, (1 - f) * 1.4);
        drawCrate(p.x, p.y + lift, 6 * z, tr.item, alpha);
    }

    // Snow settling on the ground: a pale wash over the land, clipped to the
    // plateau, its strength following the (slowly-melting) accumulation.
    function drawSnowBlanket() {
        if (weather.snow < 0.03) return;
        const corners = [S(0, 0), S(SC.worldW(), 0), S(SC.worldW(), SC.worldH()), S(0, SC.worldH())];
        ctx.save();
        ctx.beginPath();
        corners.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y));
        ctx.closePath();
        ctx.clip();
        ctx.globalAlpha = 0.17 * weather.snow;
        ctx.fillStyle = '#e9f1fb';
        const xs = corners.map(p => p.x), ys = corners.map(p => p.y);
        ctx.fillRect(Math.min(...xs), Math.min(...ys), Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys));
        ctx.restore();
        ctx.globalAlpha = 1;
    }

    // --- off-screen arrows (screen space) ----------------------------------
    function nodeIndicatorColor(n) {
        if (n.kind === 'supplier') return SC.colorOf(n.mat);
        if (n.kind === 'factory') return SC.colorOf(n.recipe);
        return n.isHQ ? '#38bdf8' : '#34d399';
    }

    function drawOffscreenArrow(wx, wy, color, icon, alpha) {
        const w = window.innerWidth, h = window.innerHeight;
        const cx = w / 2, cy = h / 2;
        const margin = 34;
        const halfW = w / 2 - margin, halfH = h / 2 - margin;

        const p = SC.camera.toScreen(wx, wy);
        if (p.x >= 0 && p.x <= w && p.y >= 0 && p.y <= h) return;

        const dx = p.x - cx, dy = p.y - cy;
        const scale = Math.min(halfW / Math.abs(dx || 1e-6), halfH / Math.abs(dy || 1e-6));
        const ex = cx + dx * scale, ey = cy + dy * scale;
        const angle = Math.atan2(dy, dx);

        ctx.save();
        ctx.translate(ex, ey);
        ctx.rotate(angle);
        ctx.beginPath();
        ctx.moveTo(14, 0);
        ctx.lineTo(-8, -8);
        ctx.lineTo(-8, 8);
        ctx.closePath();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = color;
        ctx.fill();
        ctx.strokeStyle = 'rgba(15, 23, 42, 0.6)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.restore();

        ctx.globalAlpha = alpha;
        ctx.font = '15px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(icon, ex - Math.cos(angle) * 20, ey - Math.sin(angle) * 20);
        ctx.globalAlpha = 1;
    }

    function drawOffscreenArrows(now) {
        const pulse = 0.55 + 0.45 * Math.sin(seaTime * 4);
        for (const n of SC.state.nodes) {
            if (!n.active || n.edges.length > 0) continue;
            const icon = n.kind === 'supplier' ? SC.emojiOf(n.mat)
                       : n.kind === 'factory' ? SC.emojiOf(n.recipe)
                       : (n.isHQ ? '⭐' : '🏢');
            drawOffscreenArrow(n.x, n.y, nodeIndicatorColor(n), icon, pulse);
        }
        const h = SC.state.highlight;
        if (h && now <= h.until) {
            const fade = Math.min(1, (h.until - now) / 0.5);
            const icon = h.city.isHQ ? '⭐' : '🏢';
            drawOffscreenArrow(h.city.x, h.city.y, h.color, icon, pulse * fade);
        }
    }

    // --- frame --------------------------------------------------------------
    // Drifting fireflies: a few warm motes anchored in the world (so they
    // pan with the map) that wander in small circles and blink. Pure
    // ambiance — kept sparse so they never read as gameplay markers.
    let flies = null;
    function ensureFlies() {
        if (flies) return flies;
        const C = SC.CONFIG, rng = makeRng(0xf1e);
        flies = [];
        for (let i = 0; i < 16; i++) {
            flies.push({
                x: 120 + rng() * (C.WORLD_W - 240),
                y: 120 + rng() * (C.WORLD_H - 240),
                rad: 14 + rng() * 26, sp: 0.4 + rng() * 0.6,
                ph: rng() * Math.PI * 2, blink: rng() * Math.PI * 2
            });
        }
        return flies;
    }
    function drawFireflies() {
        if (nightLevel < 0.25) return; // they only come out at night
        for (const f of ensureFlies()) {
            const a = seaTime * f.sp + f.ph;
            const p = S(f.x + Math.cos(a) * f.rad, f.y + Math.sin(a * 1.3) * f.rad * 0.6);
            const glow = (0.5 + 0.5 * Math.sin(seaTime * 2.2 + f.blink)) * nightLevel;
            if (glow < 0.15) continue;
            const z = clampZoom();
            ctx.globalAlpha = 0.25 * glow;
            ctx.fillStyle = '#fde68a';
            ctx.beginPath(); ctx.arc(p.x, p.y, 4 * z, 0, Math.PI * 2); ctx.fill();
            ctx.globalAlpha = 0.9 * glow;
            ctx.beginPath(); ctx.arc(p.x, p.y, 1.3 * z, 0, Math.PI * 2); ctx.fill();
        }
        ctx.globalAlpha = 1;
    }

    // Screen-edge vignette: darkens the corners to frame the scene and add
    // depth. Cached radial gradient, rebuilt only when the viewport resizes.
    let vignette = null, vignetteWH = '';
    function drawVignette() {
        const w = canvas.width / dpr, h = canvas.height / dpr;
        const key = w + 'x' + h;
        if (vignetteWH !== key) {
            vignette = ctx.createRadialGradient(w / 2, h * 0.52, Math.min(w, h) * 0.42,
                                                w / 2, h * 0.52, Math.max(w, h) * 0.72);
            vignette.addColorStop(0, 'rgba(4, 7, 13, 0)');
            vignette.addColorStop(1, 'rgba(4, 7, 13, 0.42)');
            vignetteWH = key;
        }
        ctx.fillStyle = vignette;
        ctx.fillRect(0, 0, w, h);
    }

    function frame(dt, now) {
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);

        frameHoverNode = (SC.state.mode === 'build' && !SC.state.placeMode &&
                          SC.input.getHoverNode) ? SC.input.getHoverNode() : null;

        updateDayWeather(dt);
        drawSky();
        drawSkyClouds(dt);   // overcast blobs, behind the world (peaks occlude)
        drawWorld(dt);       // mountains ride inside the cached bg layer
        drawCloudShadows(dt); // soft shadows sliding over the ground
        drawSnowBlanket();    // pale snow settling on the land
        drawRoads();
        drawWetRoads();       // rain sheen on the road surface
        drawRouteFlow();      // colored pulses along roads with live trucks
        drawHighlight(now);
        drawInspectHighlight(now);
        drawGhostRoad();
        drawPlacementGhost();

        // Depth-sorted buildings + trucks (back-to-front by world x+y). A
        // single-point painter's sort has no notion of footprint size, so a
        // truck on its final approach to a node (still slightly "behind" in
        // depth even once it visually overlaps the building's wide pad/
        // silhouette) can get hard-clipped by the node drawn on top of it —
        // most visible arriving at a factory or sitting at a lake supplier.
        // TRUCK_DEPTH_BIAS nudges trucks forward so they win that near-tie
        // and read as driving up TO the site rather than sinking under it.
        const TRUCK_DEPTH_BIAS = 30;
        updateTransfers(dt); // spawn/age loading-unloading crates
        const ents = [];
        for (const n of SC.state.nodes) if (n.active) ents.push({ kind: 'node', ref: n, depth: n.x + n.y });
        for (const t of SC.state.trucks) if (t.cargo !== undefined) ents.push({ kind: 'truck', ref: t, depth: t.x + t.y + TRUCK_DEPTH_BIAS });
        // crates ride just in front of the truck depth so a nearer site clips them
        for (const tr of transfers) ents.push({ kind: 'transfer', ref: tr, depth: tr.x + tr.y + TRUCK_DEPTH_BIAS + 1 });
        ents.sort((a, b) => a.depth - b.depth);

        // shadows first so no building casts onto another's face
        for (const e of ents) {
            if (e.kind === 'node') {
                const sp = nodeSpec(e.ref), p = S(e.ref.x, e.ref.y);
                drawShadow(p.x, p.y, sp.fw, (sp.h || 0) * zoom());
            }
        }
        for (const e of ents) {
            if (e.kind === 'node') drawNodeBody(e.ref, now);
            else if (e.kind === 'transfer') drawTransfer(e.ref);
            else drawTruckBody(e.ref);
        }

        drawFireflies();
        drawBursts(dt);          // delivery coin/spark bursts
        drawOrderBubbles();
        drawFloaters(dt);
        drawGrade();             // time-of-day colour grade over world + sky
        drawPrecip(dt);          // rain/snow on top, left ungraded so it stays crisp
        drawVignette();          // frame the scene…
        drawOffscreenArrows(now); // …but keep edge arrows crisp on top
    }

    return {
        attach, frame, resize, nodeIconAnchor,
        // Headless hook: force a long-lived loading/unloading crate at a world
        // point so the animation can be screenshotted (see &xfer=1 in main.js).
        _forceTransfer: (x, y, item, dir, dur) => transfers.push({ x, y, item, dir, life: 0, dur: dur || 1 })
    };
})();
