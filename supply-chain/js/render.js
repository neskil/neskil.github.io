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
    // "clouds" state. Anchored to world space so they pan and zoom correctly.
    function drawSkyClouds(dt) {
        if (weather.cloud < 0.02) return;
        const W = SC.worldW(), H = SC.worldH();
        if (!clouds) {
            const rng = makeRng(0xc10d);
            clouds = [];
            for (let i = 0; i < 7; i++) {
                clouds.push({
                    x: rng() * (W + 1200) - 600,
                    y: rng() * (H + 1200) - 600,
                    r: 120 + rng() * 180,
                    s: 0.4 + rng() * 0.7
                });
            }
        }
        const driftX = Math.cos(weather.windAng) * weather.windMag * 4;
        const driftY = Math.sin(weather.windAng) * weather.windMag * 4;
        ctx.fillStyle = '#8391a5';
        const z = zoom();
        for (const c of clouds) {
            c.x += driftX * c.s * dt * 0.02;
            c.y += driftY * c.s * dt * 0.02;
            const margin = 800;
            if (c.x > W + margin) c.x -= (W + 2 * margin);
            else if (c.x < -margin) c.x += (W + 2 * margin);
            if (c.y > H + margin) c.y -= (H + 2 * margin);
            else if (c.y < -margin) c.y += (H + 2 * margin);

            const p = S(c.x, c.y);
            const cx = p.x, cy = p.y - 450 * z, r = c.r * z;
            const gr = ctx.createRadialGradient(cx, cy, r * 0.2, cx, cy, r);
            gr.addColorStop(0, `rgba(150, 165, 186, ${0.22 * weather.cloud})`);
            gr.addColorStop(1, 'rgba(150, 165, 186, 0)');
            ctx.fillStyle = gr;
            ctx.beginPath(); ctx.ellipse(cx, cy, r, r * 0.55, 0, 0, Math.PI * 2); ctx.fill();
        }
    }

    // Big soft cloud shadows sliding over the ground (drawn after the land,
    // under the buildings). Anchored to world space so they pan and zoom correctly.
    let cloudShadows = null;
    function drawCloudShadows(dt) {
        if (weather.cloud < 0.05) return;
        const W = SC.worldW(), H = SC.worldH();
        if (!cloudShadows) {
            const rng = makeRng(0x5ad0);
            cloudShadows = [];
            for (let i = 0; i < 5; i++) {
                cloudShadows.push({
                    x: rng() * (W + 1000) - 500,
                    y: rng() * (H + 1000) - 500,
                    r: 250 + rng() * 250,
                    s: 0.6 + rng() * 0.6
                });
            }
        }
        const dvx = Math.cos(weather.windAng) * weather.windMag * 4;
        const dvy = Math.sin(weather.windAng) * weather.windMag * 4;
        
        ctx.save();
        const corners = [S(0, 0), S(W, 0), S(W, H), S(0, H)];
        ctx.beginPath();
        corners.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y));
        ctx.closePath();
        ctx.clip();
        
        ctx.globalAlpha = 0.12 * weather.cloud;
        ctx.fillStyle = '#05070c';
        const z = zoom();
        for (const c of cloudShadows) {
            c.x += dvx * c.s * dt * 0.03; c.y += dvy * c.s * dt * 0.03;
            const margin = 600;
            if (c.x > W + margin) c.x -= (W + 2 * margin);
            else if (c.x < -margin) c.x += (W + 2 * margin);
            if (c.y > H + margin) c.y -= (H + 2 * margin);
            else if (c.y < -margin) c.y += (H + 2 * margin);

            const p = S(c.x, c.y);
            ctx.beginPath();
            ctx.ellipse(p.x, p.y, c.r * z, c.r * 0.5 * z, 0, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
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
            let mountH = e * TERRAIN.amp * (0.16 + 1.05 * n); // deep valleys, tall peaks
            
            if (SC.map && SC.map.riverAt) {
                const rv = SC.map.riverAt(y);
                if (rv) {
                    const dist = Math.abs(x - rv.x);
                    const valley = rv.halfW + 180;
                    if (dist < valley) {
                        let f = Math.max(0, dist - rv.halfW * 1.2) / (valley - rv.halfW * 1.2);
                        f = f * f * (3 - 2 * f);
                        if (y < 0) {
                            const blend = Math.min(1, -y / 200); // 0 at 0, 1 at -200
                            f = f + (1 - f) * blend;
                        }
                        mountH *= f;
                    }
                }
            }
            h += mountH;
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

    function terrainKey() {
        const r = SC.state && SC.state.river && SC.state.river.spine.length
            ? Math.round(SC.state.river.spine[0].x) + ':' + Math.round(SC.state.river.spine[0].y)
            : 'noriv';
        return Math.round(SC.worldW()) + 'x' + Math.round(SC.worldH()) + ':' + r;
    }

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
    function getBiomeNoise(x, y) {
        let sOff = 0;
        const seedStr = SC.state.seed || '';
        for (let i = 0; i < seedStr.length; i++) sOff = (sOff + seedStr.charCodeAt(i) * 0.17) % 100;
        const nx = x / 1200, ny = y / 1200;
        const v1 = Math.sin(nx + sOff) + Math.sin(ny - sOff);
        const v2 = Math.sin(nx * 1.5 - ny * 1.1 + sOff * 1.2) + Math.cos(nx * 1.2 + ny * 1.6 - sOff * 0.8);
        return v1 + v2 * 0.6;
    }

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
            const cx = rng() * W, cy = rng() * Wh;
            const rx = 220 + rng() * 320, ry = 140 + rng() * 200;
            const pts = [];
            const numPts = 7 + (rng() * 5 | 0);
            for(let j=0; j<numPts; j++) {
                const ang = (j / numPts) * Math.PI * 2;
                const rVar = 0.6 + rng() * 0.5; // jagged polygon
                pts.push({ x: cx + Math.cos(ang) * rx * rVar, y: cy + Math.sin(ang) * ry * rVar });
            }
            patches.push({
                pts,
                tint: tints[(rng() * tints.length) | 0], a: 0.18 + rng() * 0.16
            });
        }
        const trees = [];
        let tries = 0;
        while (trees.length < 90 && tries < 1000) {
            tries++;
            const x = 70 + rng() * (W - 140), y = 70 + rng() * (Wh - 140);
            if (inRiver(x, y, 55)) continue;
            
            const noise = getBiomeNoise(x, y);
            let type = 'pine';
            if (noise > 1.2) { type = 'broadleaf'; if (rng() > 0.8) continue; }
            else if (noise > 0.4) { type = 'pine'; if (rng() > 0.8) continue; } // greenland
            else if (noise < -1.2) { type = 'cactus'; if (rng() > 0.4) continue; } // desert
            else if (noise < -0.4) { type = 'deadbush'; if (rng() > 0.5) continue; } // arid
            else { if (rng() > 0.7) continue; } // base slate - fewer trees

            trees.push({ x, y, s: 0.75 + rng() * 0.7, rock: rng() > 0.78, tone: rng(), type });
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
            ctx.globalAlpha = p.a;
            ctx.fillStyle = p.tint;
            ctx.beginPath();
            p.pts.forEach((pt, i) => {
                const s = S(pt.x, pt.y);
                if (i === 0) ctx.moveTo(s.x, s.y);
                else ctx.lineTo(s.x, s.y);
            });
            ctx.closePath();
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
            } else if (t.type === 'pine' || !t.type) {
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
            } else if (t.type === 'broadleaf') {
                ctx.fillStyle = '#4a3320';
                ctx.fillRect(s.x - 2 * sc, s.y - 10 * sc, 4 * sc, 10 * sc);
                const green = mix('#1e5c2d', '#184d23', t.tone);
                ctx.fillStyle = green;
                ctx.beginPath();
                ctx.ellipse(s.x, s.y - 18 * sc, 14 * sc, 12 * sc, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = mix(green, '#5add74', 0.25);
                ctx.beginPath();
                ctx.ellipse(s.x - 2 * sc, s.y - 22 * sc, 8 * sc, 6 * sc, 0, 0, Math.PI * 2);
                ctx.fill();
            } else if (t.type === 'cactus') {
                const green = mix('#4d7a42', '#3e6335', t.tone);
                ctx.fillStyle = green;
                ctx.beginPath(); // main trunk
                ctx.roundRect(s.x - 2 * sc, s.y - 24 * sc, 4 * sc, 24 * sc, 2 * sc);
                ctx.fill();
                ctx.beginPath(); // left arm
                ctx.roundRect(s.x - 8 * sc, s.y - 16 * sc, 8 * sc, 3 * sc, 1.5 * sc);
                ctx.roundRect(s.x - 8 * sc, s.y - 20 * sc, 3 * sc, 7 * sc, 1.5 * sc);
                ctx.fill();
                ctx.beginPath(); // right arm
                ctx.roundRect(s.x + 2 * sc, s.y - 12 * sc, 7 * sc, 3 * sc, 1.5 * sc);
                ctx.roundRect(s.x + 6 * sc, s.y - 18 * sc, 3 * sc, 9 * sc, 1.5 * sc);
                ctx.fill();
            } else if (t.type === 'deadbush') {
                ctx.strokeStyle = mix('#786b53', '#5c5240', t.tone);
                ctx.lineWidth = 1.5 * sc;
                ctx.beginPath();
                ctx.moveTo(s.x, s.y); ctx.lineTo(s.x - 6 * sc, s.y - 8 * sc);
                ctx.moveTo(s.x, s.y); ctx.lineTo(s.x + 7 * sc, s.y - 7 * sc);
                ctx.moveTo(s.x, s.y); ctx.lineTo(s.x - 2 * sc, s.y - 10 * sc);
                ctx.moveTo(s.x - 6 * sc, s.y - 8 * sc); ctx.lineTo(s.x - 9 * sc, s.y - 12 * sc);
                ctx.stroke();
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
        
        const step = 220;
        
        // --- Dynamic Biome Fields ---
        // Tint individual grid cells based on a seeded noise function
        // to create regions of forests, greenlands, and deserts.
        ctx.save();
        ctx.filter = 'blur(60px)'; // Smoothly blend the biome boundaries
        
        for (let y = 0; y < Wh; y += step) {
            for (let x = 0; x < W; x += step) {
                const noise = getBiomeNoise(x + step / 2, y + step / 2);
                
                if (noise > 1.2) {
                    ctx.fillStyle = 'rgba(20, 110, 60, 0.45)'; // Deep forest (richer green)
                } else if (noise > 0.4) {
                    ctx.fillStyle = 'rgba(34, 139, 34, 0.25)'; // Greenland
                } else if (noise < -1.2) {
                    ctx.fillStyle = 'rgba(210, 160, 70, 0.35)'; // Deep desert (clear sand/gold)
                } else if (noise < -0.4) {
                    ctx.fillStyle = 'rgba(160, 130, 80, 0.22)'; // Arid scrub (dusty beige/brown)
                } else {
                    continue; // Base slate gradient
                }
                
                ctx.beginPath();
                const p1 = S(x, y), p2 = S(x + step, y), p3 = S(x + step, y + step), p4 = S(x, y + step);
                ctx.moveTo(p1.x, p1.y);
                ctx.lineTo(p2.x, p2.y);
                ctx.lineTo(p3.x, p3.y);
                ctx.lineTo(p4.x, p4.y);
                ctx.fill();
            }
        }
        ctx.restore();

        ctx.strokeStyle = 'rgba(148, 163, 184, 0.055)';
        ctx.lineWidth = 1;
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
            drawRiverFieldBg();
            drawCaveBg();
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

    // Cave mouth at the edge of the playing field: a jagged, low-poly rock arch
    // that naturally melts into the polygonal mountain background.
    function drawCaveBg() {
        const r = SC.state.river;
        if (!r || !r.spine.length || r.spine.length < 2) return;

        const rv = SC.map.riverAt(0);
        if (!rv) return;
        const cx = rv.x;
        const cy = -5; // slightly pushed into the mountain
        const hw = rv.halfW;
        
        const z = zoom();
        const getPt = (wx, wy, wz) => {
            const p = S(wx, wy);
            return { x: p.x, y: p.y - wz * z };
        };

        const w = hw * 1.5;
        const h = hw * 2.0;
        const depth = 35; // 3D depth into the mountain so the river can safely recede

        // Calculate fog mix based on screen Y to match mountain haze perfectly
        const sky = skyColor(1);
        const farY = S(0, 0).y;
        const fogColor = (hex, wy) => {
            let fade = 0;
            if (wy < farY) fade = Math.min(1, (farY - wy) / (TERRAIN.rise * 2.0));
            return mix(hex, sky, fade);
        };

        // Front hole points (the cave entrance)
        const F0 = getPt(cx - w * 0.9, cy, 0);
        const F1 = getPt(cx - w * 1.1, cy, h * 0.4);
        const F2 = getPt(cx - w * 0.3, cy, h * 0.9);
        const F3 = getPt(cx + w * 0.4, cy, h * 1.0);
        const F4 = getPt(cx + w * 1.0, cy, h * 0.5);
        const F5 = getPt(cx + w * 0.8, cy, 0);

        // Back hole points (deep inside the tunnel)
        // Narrows slightly to give perspective
        const bw = w * 0.7;
        const bh = h * 0.8;
        const bcy = cy - depth;
        const B0 = getPt(cx - bw * 0.9, bcy, 0);
        const B1 = getPt(cx - bw * 1.1, bcy, bh * 0.4);
        const B2 = getPt(cx - bw * 0.3, bcy, bh * 0.9);
        const B3 = getPt(cx + bw * 0.4, bcy, bh * 1.0);
        const B4 = getPt(cx + bw * 1.0, bcy, bh * 0.5);
        const B5 = getPt(cx + bw * 0.8, bcy, 0);

        // The interior is lit as a tunnel that recedes into darkness rather
        // than a flat black cut-out: the faceted walls near the mouth catch a
        // little ambient blue (same hue family as the mountains, so it
        // "rhymes"), and a radial gradient sinks everything deeper in toward a
        // near-black vanishing point. Colours stay in the mountain's blue-grey
        // palette but a couple of stops darker, so the hole reads as depth.

        // 1. Back wall — the deepest, darkest point of the tunnel.
        ctx.beginPath();
        [B0, B1, B2, B3, B4, B5].forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y));
        ctx.closePath();
        ctx.fillStyle = '#070c14';
        ctx.fill();

        // 2. Draw inner tunnel walls connecting Front to Back. These carry a
        //    faint blue so the low-poly facet edges are still legible at the
        //    rim; the radial fade in step 3 darkens them toward the back.
        const drawWall = (p1, p2, p3, p4, hex) => {
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.lineTo(p3.x, p3.y); ctx.lineTo(p4.x, p4.y);
            ctx.closePath();
            ctx.fillStyle = fogColor(hex, (cy + bcy) / 2);
            ctx.fill();
        };

        // Left inner wall (rim catches a touch of light)
        drawWall(F0, F1, B1, B0, '#1a2a3d');
        // Top-Left inner wall
        drawWall(F1, F2, B2, B1, '#20324a');
        // Top-Right inner wall
        drawWall(F2, F3, B3, B2, '#182838');
        // Right inner wall
        drawWall(F3, F4, B4, B3, '#111d2c');
        // Bottom-Right inner wall
        drawWall(F4, F5, B5, B4, '#0d1622');

        // 3. Depth fade — a radial gradient clipped to the cave opening that is
        //    transparent at the rim and sinks to near-black toward a vanishing
        //    point deep inside, so the eye reads a tunnel receding into dark
        //    instead of a flat silhouette.
        const cavePts = [F0, F1, F2, F3, F4, F5];
        const vanish = {
            x: (B0.x + B1.x + B2.x + B3.x + B4.x + B5.x) / 6,
            y: (B0.y + B1.y + B2.y + B3.y + B4.y + B5.y) / 6,
        };
        // Rim radius: farthest front vertex from the vanishing point.
        let rimR = 0;
        for (const p of cavePts) {
            rimR = Math.max(rimR, Math.hypot(p.x - vanish.x, p.y - vanish.y));
        }
        ctx.save();
        ctx.beginPath();
        cavePts.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y));
        ctx.closePath();
        ctx.clip();
        const gDepth = ctx.createRadialGradient(
            vanish.x, vanish.y, 0, vanish.x, vanish.y, rimR * 1.05);
        gDepth.addColorStop(0, 'rgba(4, 7, 12, 0.96)');
        gDepth.addColorStop(0.45, 'rgba(6, 10, 17, 0.72)');
        gDepth.addColorStop(0.8, 'rgba(8, 14, 22, 0.28)');
        gDepth.addColorStop(1, 'rgba(8, 14, 22, 0)');
        ctx.fillStyle = gDepth;
        ctx.fill();
        ctx.restore();

        // 4. Water flowing into the cave. The playing-field river
        //    (drawRiverFieldBg) stops at the coastline; here we continue it
        //    into the tunnel so it looks like the river simply flowing on into
        //    the dark rather than a bright patch pasted at the entrance. We
        //    follow the real river centerline (riverAt extrapolates upstream
        //    for y < 0) so the sheet lines up exactly with the field river,
        //    use the *same* water colour at the mouth so the seam is invisible,
        //    then just darken into the tunnel shadow as it recedes.
        const wFrontY = 12;          // just outside the mouth (matches the field river)
        const wBackY = bcy + 2;      // right up against the back wall, deep in
        const wSteps = 10;
        const wLeft = [], wRight = [];
        for (let i = 0; i <= wSteps; i++) {
            const f = i / wSteps;
            const wy = wBackY + (wFrontY - wBackY) * f;
            const rv2 = SC.map.riverAt(wy);
            if (!rv2) continue;
            // A touch narrower toward the back so the channel tucks under the
            // tunnel walls instead of meeting them with a hard edge.
            const narrow = 0.82 + 0.18 * f;
            wLeft.push(getPt(rv2.x - rv2.halfW * narrow, wy, 0));
            wRight.push(getPt(rv2.x + rv2.halfW * narrow, wy, 0));
        }
        if (wLeft.length > 1) {
            ctx.save();
            ctx.beginPath();
            wLeft.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y));
            for (let i = wRight.length - 1; i >= 0; i--) ctx.lineTo(wRight[i].x, wRight[i].y);
            ctx.closePath();

            const backY = (wLeft[0].y + wRight[0].y) / 2;
            const frontY = (wLeft[wLeft.length - 1].y + wRight[wRight.length - 1].y) / 2;
            // Mouth colour matches the field river exactly (same formula as
            // drawRiverFieldBg's getRiverColor at the edge), so the water
            // reads as one continuous river flowing into the dark.
            const mouthCol = mix('#123047', sky, 0.08);
            const gWater = ctx.createLinearGradient(0, backY, 0, frontY);
            gWater.addColorStop(0, 'rgba(8, 14, 22, 0.85)');   // dissolves into the tunnel shadow
            gWater.addColorStop(0.4, 'rgba(13, 30, 45, 0.96)');
            gWater.addColorStop(0.75, 'rgba(17, 44, 66, 1)');
            gWater.addColorStop(1, mouthCol);                  // seamless with the field river
            ctx.fillStyle = gWater;
            ctx.fill();
            ctx.restore();
        }

        // 3. Draw outer rock facets (melting into the mountain grid exactly)
        const cell = TERRAIN.cell;
        const x0 = -TERRAIN.ring;
        const y0 = -TERRAIN.ring;
        
        // Find the background terrain grid cells that surround the river
        const gi = Math.floor((cx - x0) / cell);
        const gj = Math.floor((0 - y0) / cell);

        const X_L  = x0 + gi * cell;
        const X_R  = x0 + (gi + 1) * cell;
        const X_LL = x0 + (gi - 1) * cell;
        const X_RR = x0 + (gi + 2) * cell;
        
        const Y_0 = 0; // Coastline edge
        const Y_U = y0 + gj * cell;         // First grid line upstream (e.g. -50)
        const Y_UU = y0 + (gj - 1) * cell;  // Second grid line upstream (e.g. -195)

        // Snap outer vertices exactly to the terrain mesh!
        const O0 = getPt(X_LL, Y_0, terrainHeight(X_LL, Y_0));
        const O1 = getPt(X_LL, Y_U, terrainHeight(X_LL, Y_U));
        const O2 = getPt(X_L, Y_UU, terrainHeight(X_L, Y_UU));
        const O3 = getPt(X_R, Y_UU, terrainHeight(X_R, Y_UU));
        const O4 = getPt(X_RR, Y_U, terrainHeight(X_RR, Y_U));
        const O5 = getPt(X_RR, Y_0, terrainHeight(X_RR, Y_0));

        const drawFacet = (p1, p2, p3, p4, colorHex, facetY) => {
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.lineTo(p3.x, p3.y); ctx.lineTo(p4.x, p4.y);
            ctx.closePath();
            ctx.fillStyle = fogColor(colorHex, facetY);
            ctx.fill();
            // Subtle edge line to match low-poly style
            ctx.strokeStyle = 'rgba(200, 215, 235, 0.04)';
            ctx.lineWidth = 1;
            ctx.stroke();
        };

        // Left side (catches light)
        drawFacet(O0, O1, F1, F0, '#283a50', (Y_0 + Y_U) / 2);
        // Top-Left (catches most light)
        drawFacet(O1, O2, F2, F1, '#354862', (Y_U + Y_UU) / 2);
        // Top (medium light)
        drawFacet(O2, O3, F3, F2, '#2a3c52', Y_UU);
        // Top-Right (shadow)
        drawFacet(O3, O4, F4, F3, '#202f43', (Y_U + Y_UU) / 2);
        // Right side (deep shadow)
        drawFacet(O4, O5, F5, F4, '#182536', (Y_0 + Y_U) / 2);
    }

    // Playing-field and downstream river body: painted into the bg cache
    // on top of drawLandStatic so it covers coastline/shadows at the entrance.
    function drawRiverFieldBg() {
        const r = SC.state.river;
        if (!r || !r.spine.length || r.spine.length < 2) return;

        const margin = TERRAIN.ring;
        const extSpine = [...r.spine];
        const extHalfWidths = [...r.halfWidths];

        // Extrapolate slightly upstream into the cave
        const first = r.spine[0];
        const second = r.spine[1];
        const dx = first.x - second.x;
        const dy = first.y - second.y;
        if (dy !== 0) {
            const topSteps = 5;
            const topMargin = 35; // Extend deep into the 3D cave tunnel
            for (let k = 1; k <= topSteps; k++) {
                const factor = (k / topSteps) * (topMargin / -dy);
                extSpine.unshift({
                    x: first.x + dx * factor,
                    y: first.y + dy * factor
                });
                extHalfWidths.unshift(r.halfWidths[0]);
            }
        }

        // Extend downstream (front/lowland side)
        const last = r.spine[r.spine.length - 1];
        const prev = r.spine[r.spine.length - 2];
        const dx2 = last.x - prev.x;
        const dy2 = last.y - prev.y;
        if (dy2 !== 0) {
            const bottomSteps = 40;
            for (let k = 1; k <= bottomSteps; k++) {
                const factor = (k / bottomSteps) * (margin / dy2);
                extSpine.push({
                    x: last.x + dx2 * factor,
                    y: last.y + dy2 * factor
                });
                extHalfWidths.push(r.halfWidths[r.halfWidths.length - 1]);
            }
        }

        const z = zoom();
        const getPt = (x, y) => {
            const p = S(x, y);
            const h = y < 0 ? 0 : terrainHeight(x, y); // flat inside the cave
            return { x: p.x, y: p.y - h * z };
        };

        const left = [], right = [];
        for (let i = 0; i < extSpine.length; i++) {
            left.push(getPt(extSpine[i].x - extHalfWidths[i], extSpine[i].y));
            right.push(getPt(extSpine[i].x + extHalfWidths[i], extSpine[i].y));
        }

        // Water body
        ctx.beginPath();
        left.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y));
        for (let i = right.length - 1; i >= 0; i--) ctx.lineTo(right[i].x, right[i].y);
        ctx.closePath();

        // Unified absolute screen gradient with weather/time-of-day haze
        const topY = S(SC.worldW() * 0.5, -TERRAIN.ring).y;
        const botY = S(SC.worldW() * 0.5, SC.worldH() + TERRAIN.ring).y;
        const g = ctx.createLinearGradient(0, topY, 0, botY);
        
        const sky = skyColor(1);
        const getRiverColor = (wy) => {
            const H_total = SC.worldH() + 2 * TERRAIN.ring;
            const t = (wy - (-TERRAIN.ring)) / H_total;
            const baseCol = mix('#123047', '#0b1c2c', Math.max(0, Math.min(1, t)));
            const dEdge = Math.max(0, -wy);
            const haze = Math.min(1, dEdge / (TERRAIN.rise * 2.6));
            return mix(baseCol, sky, 0.08 + 0.5 * haze);
        };

        for (let i = 0; i <= 5; i++) {
            const pct = i / 5;
            const wy = -TERRAIN.ring + pct * (SC.worldH() + 2 * TERRAIN.ring);
            g.addColorStop(pct, getRiverColor(wy));
        }

        ctx.fillStyle = g;
        ctx.fill();

        // bank shadow
        ctx.strokeStyle = 'rgba(2, 6, 12, 0.5)';
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    // Live river: draws ONLY the animated ripples.
    // The river bodies themselves are cached in the background layer.
    function drawRiver() {
        const r = SC.state.river;
        if (!r || !r.spine.length) return;

        const extSpine = [...r.spine];
        const extHalfWidths = [...r.halfWidths];

        // Extrapolate upstream slightly into the cave for animated ripples
        const first = r.spine[0];
        const second = r.spine[1];
        const dx = first.x - second.x;
        const dy = first.y - second.y;
        if (dy !== 0) {
            const topSteps = 5;
            const topMargin = 30; // disappear into cave darkness
            for (let k = 1; k <= topSteps; k++) {
                const factor = (k / topSteps) * (topMargin / -dy);
                extSpine.unshift({
                    x: first.x + dx * factor,
                    y: first.y + dy * factor
                });
                extHalfWidths.unshift(r.halfWidths[0]);
            }
        }

        // Extend downstream (front/lowland side)
        const margin = TERRAIN.ring;
        if (r.spine.length >= 2) {
            const last = r.spine[r.spine.length - 1];
            const prev = r.spine[r.spine.length - 2];
            const dx2 = last.x - prev.x;
            const dy2 = last.y - prev.y;
            if (dy2 !== 0) {
                const bottomSteps = 40;
                for (let k = 1; k <= bottomSteps; k++) {
                    const factor = (k / bottomSteps) * (margin / dy2);
                    extSpine.push({
                        x: last.x + dx2 * factor,
                        y: last.y + dy2 * factor
                    });
                    extHalfWidths.push(r.halfWidths[r.halfWidths.length - 1]);
                }
            }
        }

        const H = SC.worldH();
        const z = zoom();
        const getPt = (x, y) => {
            const p = S(x, y);
            const h = y < 0 ? 0 : terrainHeight(x, y); // flat inside the cave
            return { x: p.x, y: p.y - h * z };
        };

        // Animated ripples across the flow (gradually fading as they go upstream)
        const topY_fade = S(SC.worldW() * 0.5, -20).y; // Fade exactly at the cave entrance
        const fadeY = S(SC.worldW() * 0.5, 0).y;
        const botY_full = S(SC.worldW() * 0.5, SC.worldH() + margin).y;
        
        const gRip = ctx.createLinearGradient(0, topY_fade, 0, botY_full);
        let stopFade = (fadeY - topY_fade) / (botY_full - topY_fade);
        stopFade = Math.max(0.01, Math.min(0.99, stopFade));
        gRip.addColorStop(0, 'rgba(96, 200, 240, 0)');
        gRip.addColorStop(stopFade, 'rgba(96, 200, 240, 0.10)');
        gRip.addColorStop(1, 'rgba(96, 200, 240, 0.10)');
        
        ctx.strokeStyle = gRip;
        ctx.lineWidth = 1.4;
        
        for (let w = 0; w < 4; w++) {
            // Ripple lines along the full river including downstream/upstream extensions
            ctx.beginPath();
            let ripStarted = false;
            for (let i = 0; i < extSpine.length; i++) {
                const t = i / (extSpine.length - 1);
                const frac = (w + 1) / 5;
                // Past the playing field, the wobble frequency increases
                // and lines drift downward (seaTime offset grows with distance)
                const inField = extSpine[i].y <= H;
                const overshoot = inField ? 0 : (extSpine[i].y - H) / margin;
                const freq = inField ? 0.8 : 0.8 + overshoot * 1.5;
                const amp = 6 + overshoot * 4;
                const wx = extSpine[i].x - extHalfWidths[i] + 2 * extHalfWidths[i] * frac
                         + Math.sin(seaTime * freq + t * 8 + w) * amp;
                const p = getPt(wx, extSpine[i].y);
                if (!ripStarted) { ctx.moveTo(p.x, p.y); ripStarted = true; }
                else { ctx.lineTo(p.x, p.y); }
            }
            ctx.stroke();
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
            // A yard is a flat asphalt lot (drawYardSite), not an extruded
            // block — no roof icon, the parked trucks are the visual.
            return { base: '#3a3f4a', fw: 24, h: 0, flat: true };
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
            : n.kind === 'yard' ? drawYardSite(n, sp, g) // asphalt lot with parked trucks
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

        // Production status pill. First group is the finished good:
        // "in stock / ordered" — how many units are crafted and sitting at
        // the factory waiting for a truck, over how many are still outstanding
        // (waiting + queued + currently crafting). If actively producing, a
        // second group shows each ingredient's stock (have / need) — "have"
        // being what's physically on-site, not counting units still in transit.
        if (n.kind === 'factory' && !forSale) {
            // Finished goods waiting at the factory: crafted output becomes a
            // pickup job here and stays on site until a truck actually loads
            // it — a truck merely en route to collect still has an empty cargo,
            // so its unit is physically still at the factory.
            let inStock = 0;
            if (SC.state.jobs) {
                for (const job of SC.state.jobs) if (job.pickup === n) inStock++;
            }
            if (SC.state.trucks) {
                for (const t of SC.state.trucks) {
                    if (t.jobs && (!t.cargo || t.cargo.length === 0)) {
                        for (const job of t.jobs) if (job.pickup === n) inStock++;
                    }
                }
            }
            const producing = (n.queue ? n.queue.length : 0) + (n.crafting ? 1 : 0);
            const ordered = inStock + producing;

            // Ingredient stock (have / need), only while there's a live queue.
            let queueNeeds = {}, queueHave = {};
            if (n.queue && n.queue.length > 0) {
                for (const t of n.queue) {
                    for (const m in t.needs) {
                        queueNeeds[m] = (queueNeeds[m] || 0) + t.needs[m];
                        queueHave[m] = (queueHave[m] || 0) + (t.have[m] || 0);
                    }
                }
                for (const m in n.inv) {
                    if (queueNeeds[m]) queueHave[m] = (queueHave[m] || 0) + n.inv[m];
                }
                // NOTE: material still en route (unassigned jobs or riding a
                // truck) is deliberately NOT counted here. "have / need" means
                // stock physically on-site — a unit only counts once a truck
                // has actually dropped it (task.have via receiveRaw, or loose
                // n.inv). Counting in-transit units made the pill read 1/1
                // (full, green) before anything had been delivered.
            }
            const needsKeys = Object.keys(queueNeeds);

            if (ordered > 0 || inStock > 0) {
                const z = clampZoom();
                const sy = tc.y - 28 * z;
                const interFont = `600 ${9 * z}px Inter, system-ui, sans-serif`;
                ctx.font = interFont;

                const fgText = `${inStock} / ${ordered}`;
                const fgW = ctx.measureText(fgText).width;

                let segments = [];
                // first group: pad + FG emoji + gap + "in stock / ordered" + pad
                let totalW = 5 * z + 11 * z + 3 * z + fgW + 5 * z;
                if (needsKeys.length > 0) totalW += 8 * z; // divider
                for (const m of needsKeys) {
                    const have = Math.min(queueHave[m], queueNeeds[m]);
                    const need = queueNeeds[m];
                    const text = `${have}/${need}`;
                    const w = 14 * z + ctx.measureText(text).width;
                    segments.push({ m, text, w, have, need });
                    totalW += w;
                }

                let cx = tc.x - totalW / 2;
                ctx.fillStyle = 'rgba(12, 18, 30, 0.85)';
                roundRectPath(cx, sy - 8 * z, totalW, 16 * z, 6 * z);
                ctx.fill();

                cx += 5 * z;
                emoji(SC.emojiOf(n.recipe), cx + 5.5 * z, sy, 11 * z);
                cx += 11 * z + 3 * z;
                ctx.font = interFont;
                ctx.textAlign = 'left';
                ctx.textBaseline = 'middle';
                // Amber when goods are ready & waiting; muted when just queued.
                ctx.fillStyle = inStock > 0 ? '#fbbf24' : '#cbd5e1';
                ctx.fillText(fgText, cx, sy);
                cx += fgW + 5 * z;

                if (needsKeys.length > 0) {
                    ctx.fillStyle = 'rgba(255,255,255,0.2)';
                    ctx.fillRect(cx, sy - 5 * z, 1, 10 * z);
                    cx += 4 * z;
                    for (const seg of segments) {
                        cx += 4 * z;
                        emoji(SC.emojiOf(seg.m), cx, sy, 9 * z);
                        cx += 5 * z;
                        ctx.font = interFont;
                        ctx.textAlign = 'left';
                        ctx.fillStyle = seg.have >= seg.need ? '#34d399' : '#f87171';
                        ctx.fillText(seg.text, cx, sy);
                        cx += ctx.measureText(seg.text).width + 5 * z;
                    }
                }
            }
        }

        // HQ landmark beacon: a short mast with a slow-blinking red light and
        // halo on top, so HQ reads as the tallest, most important structure.
        if (n.isHQ && !SC.state.orders.some(o => o.city === n)) {
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
        } else if (n.kind === 'yard') {
            labelAt('Yard', g.x, g.y + footRadii(sp.fw).ry + 12, '#c4b5fd', 11);
        } else if (n.kind === 'city') {
            // Idle trucks homed here park physically on an apron in front of
            // the building (drawn on top so they sit before the doors).
            drawYardParking(n, g, clampZoom(), false);
            labelAt(n.isHQ ? 'HQ' : 'DC', g.x, g.y + footRadii(sp.fw).ry + 12, n.isHQ ? '#38bdf8' : '#34d399', 11);
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

    // Draw a truck's iso body at screen point g, heading `ang` (screen angle),
    // colored `body`. `moving` gates the night headlights. Returns the trailer
    // height so callers can hang a cargo badge above it. Shared by moving
    // trucks (drawTruckBody) and parked trucks in a yard (drawYardParking).
    function drawTruckAt(g, ang, body, z, moving) {
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
        if (moving && nightLevel > 0.3) {
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
        return { Ht };
    }

    function drawTruckBody(t) {
        const g = S(t.x, t.y);
        const z = clampZoom();
        const item = t.cargo[0];
        const body = item ? SC.colorOf(item) : '#8b98ab';
        const ang = truckScreenAngle(t);
        const { Ht } = drawTruckAt(g, ang, body, z, !!t.path);
        if (item) {
            emojiPlateAt(SC.emojiOf(item), g.x, g.y - Ht - 8 * z, 9 * z, 13 * z);
            if (t.cargo.length > 1) labelAt('×' + t.cargo.length, g.x + 13 * z, g.y - Ht - 15 * z, '#f8fafc', 9);
        }
    }

    // Idle trucks homed at `node` are physically parked on an asphalt apron in
    // neat rows instead of stacking into one sprite under a "N 🚚" label.
    // Rendered in world-grounded iso: rows/columns run along the two ground
    // axes, spaced by truck size so they never overlap. `full` draws the whole
    // footprint as a lot (yard nodes); otherwise it's a small apron in front of
    // a building (HQ/DC). Screen-space, so it must be called while drawing the
    // owning node (depth-sorted with it).
    function drawYardParking(node, g, z, full) {
        const parked = SC.state.trucks.filter(
            t => t.homeYard === node && !t.path && t.jobs.length === 0);
        if (!full && parked.length === 0) return; // no apron under an empty building
        // iso ground basis in screen space (already includes zoom)
        const o = S(node.x, node.y);
        const ux = S(node.x + 1, node.y).x - o.x, uy = S(node.x + 1, node.y).y - o.y;
        const vx = S(node.x, node.y + 1).x - o.x, vy = S(node.x, node.y + 1).y - o.y;
        const ul = Math.hypot(ux, uy) || 1, vl = Math.hypot(vx, vy) || 1;
        const uhx = ux / ul, uhy = uy / ul, vhx = vx / vl, vhy = vy / vl;

        const cols = 2;
        const colGap = 15 * z, rowGap = 25 * z; // screen spacing between stalls
        const shown = Math.min(parked.length, 8); // cap the sprite count
        const rows = Math.max(full ? 2 : 1, Math.ceil(shown / cols));

        // Apron centered on the grid. For a building we push the lot forward
        // (toward the camera, +v) so it sits in front of the doors, not under
        // the walls.
        const cx = g.x + (full ? 0 : (vhx * rowGap * 1.4));
        const cy = g.y + (full ? 0 : (vhy * rowGap * 1.4));
        // grid extents (in stall units, centered)
        const halfC = (cols - 1) / 2, halfR = (rows - 1) / 2;
        const stall = (c, r) => ({
            x: cx + uhx * (c - halfC) * colGap + vhx * (r - halfR) * rowGap,
            y: cy + uhy * (c - halfC) * colGap + vhy * (r - halfR) * rowGap
        });

        // asphalt pad: a filled iso quad covering the grid + margin
        const mC = colGap * 0.9, mR = rowGap * 0.75;
        const corners = [
            [-halfC * colGap - mC, -halfR * rowGap - mR],
            [ halfC * colGap + mC, -halfR * rowGap - mR],
            [ halfC * colGap + mC,  halfR * rowGap + mR],
            [-halfC * colGap - mC,  halfR * rowGap + mR]
        ].map(([a, b]) => ({ x: cx + uhx * a + vhx * b, y: cy + uhy * a + vhy * b }));
        ctx.beginPath();
        corners.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y));
        ctx.closePath();
        ctx.fillStyle = 'rgba(38, 42, 52, 0.92)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(15, 18, 24, 0.9)';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // painted stall dividers (between columns, running along rows)
        ctx.strokeStyle = 'rgba(233, 213, 120, 0.55)';
        ctx.lineWidth = Math.max(1, 1.4 * z);
        for (let c = 0; c <= cols; c++) {
            const a = (c - halfC - 0.5) * colGap;
            const p1 = { x: cx + uhx * a + vhx * (-halfR * rowGap - mR * 0.5), y: cy + uhy * a + vhy * (-halfR * rowGap - mR * 0.5) };
            const p2 = { x: cx + uhx * a + vhx * ( halfR * rowGap + mR * 0.5), y: cy + uhy * a + vhy * ( halfR * rowGap + mR * 0.5) };
            ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.stroke();
        }

        // Park nose-in along the bay depth (+v) so each truck's length runs
        // down its stall between the painted dividers. Fill the front row
        // (nearest the camera) first.
        const parkAng = Math.atan2(vhy, vhx);
        for (let i = 0; i < shown; i++) {
            const c = i % cols, r = rows - 1 - ((i / cols) | 0);
            const s = stall(c, r);
            drawTruckAt(s, parkAng, '#8b98ab', z * 0.82, false);
        }
    }

    // A truck yard is a flat parking lot: the apron + stalls + parked trucks
    // stand in for a building. Mirrors the drawSupplierSite/prism contract by
    // returning a topCenter (for any hover/selection anchoring) and footprint.
    function drawYardSite(n, sp, g) {
        const z = clampZoom();
        drawYardParking(n, g, z, true);
        const fr = footRadii(sp.fw);
        return { topCenter: { x: g.x, y: g.y - 6 * z }, rx: fr.rx, ry: fr.ry };
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
            // Roof apex of the building: prism() is drawn at height sp.h*zoom(),
            // so the roof sits exactly that many screen pixels above the ground
            // point. Hug the bubble just above it (bounded by clampZoom) so it
            // reads as attached rather than floating on a long stalk — the old
            // code let a high zoom fling the bubble far above the (zoom-capped)
            // HQ beacon, and the beacon mast filled the gap as an ugly stem.
            const roof = { x: S(city.x, city.y).x, y: S(city.x, city.y).y - sp.h * zoom() };
            const r = 14 * z;
            orders.forEach((o, i) => {
                const bx = roof.x + (i - (orders.length - 1) / 2) * 34 * z;
                const by = roof.y - 26 * z;
                const frac = Math.max(0, o.deadline / o.deadlineTotal);
                const urgent = frac < 0.25;

                // speech-bubble tail: a short triangle from the bubble bottom
                // down to the roof apex, so the marker points at its building.
                ctx.beginPath();
                ctx.moveTo(bx - 5 * z, by + r - 2 * z);
                ctx.lineTo(bx + 5 * z, by + r - 2 * z);
                ctx.lineTo(bx, by + r + 9 * z);
                ctx.closePath();
                ctx.fillStyle = '#1e293b';
                ctx.fill();
                ctx.strokeStyle = urgent ? '#f87171' : 'rgba(148, 163, 184, 0.55)';
                ctx.lineWidth = 1;
                ctx.stroke();

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
        // Idle trucks (no route, no jobs) are parked in their home yard/HQ
        // apron by drawNodeBody, so skip them here to avoid a second sprite
        // stacked at the node centre.
        for (const t of SC.state.trucks) if (t.cargo !== undefined && (t.path || t.jobs.length > 0))
            ents.push({ kind: 'truck', ref: t, depth: t.x + t.y + TRUCK_DEPTH_BIAS });
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
