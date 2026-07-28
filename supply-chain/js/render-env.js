// Canvas rendering — ENV layer: sky, day/night + weather, terrain, decor,
// land, river, and the ambient scenery (fireflies, vignette, snow blanket).
// Shares SC._render (R) with render-core; see render-core.js for the model.
(function() {
    const R = SC._render;
    const { S, zoom, mix, shade, rgba, hexToRgb, makeRng, footRadii, diamondPath,
            roundRectPath, clampZoom, label, labelAt, emoji, ISO } = R;

    // --- day/night + weather (cosmetic, render-only) ---
    const DAY_LENGTH = 210;                 // seconds for a full day↔night cycle
    let dayClock = DAY_LENGTH * 0.80;       // open in the evening so it starts moody
    let todPhase = 0, twilight = 0, sunEl = -1; // (dayness/nightLevel/shadow* live on R)
    const WEATHER_ROTATION = ['clear', 'clouds', 'rain', 'clouds', 'clear', 'snow', 'clouds'];
    let weather = { i: 0, type: 'clear', t: 0, dur: 40, intensity: 0, cloud: 0,
                    snow: 0, windAng: 0.6, windMag: 0.5 };
    // Shared so the audio layer can score the ambience to the visible weather
    // (see js/audio.js `env()`). Mutated in place, never reassigned — the
    // reference stays valid for the life of the page.
    R.weather = weather;
    let forcedWeather = null;               // &weather= for screenshots
    let precip = [];                        // rain/snow particle pool (screen-space)
    let clouds = null;                      // drifting overcast blobs (screen-space)
    const SKY_NIGHT = ['#141d30', '#0f1626', '#0a0f1a'];
    const SKY_DAY = ['#3a6ea3', '#6a9fca', '#a7c8e0'];
    const SKY_DUSK = ['#28203e', '#6b3f56', '#c9724a'];
    let stars = null;
    let cloudShadows = null;
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
    let decor = null, decorKey = null;
    let biome = null, biomeKey = null;
    let flies = null;
    let vignette = null, vignetteWH = '';

    function lerpHex(a, b, t) { return mix(a, b, t); } // alias for readability

    function updateDayWeather(dt) {
        const p = new URLSearchParams(location.search);
        if (p.has('tod')) dayClock = (parseFloat(p.get('tod')) || 0) * DAY_LENGTH;
        else dayClock += dt;
        if (p.has('weather')) forcedWeather = p.get('weather');

        todPhase = (dayClock / DAY_LENGTH) % 1;
        sunEl = Math.sin((todPhase - 0.25) * Math.PI * 2); // -1 midnight … +1 noon
        R.dayness = Math.max(0, Math.min(1, (sunEl + 0.15) / 0.5));
        R.nightLevel = 1 - R.dayness;
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
        const lumFrac = Math.max(0, Math.min(1, R.dayness >= 0.5 ? sf : mf));
        const horiz = (lumFrac - 0.5) * 2;                   // −1 left … +1 right
        const elevAbs = Math.max(0.14, Math.abs(sunEl));
        R.shadowLen = Math.min(3.2, 0.72 / elevAbs);
        const sx = -horiz, sy = 0.66, m = Math.hypot(sx, sy) || 1;
        R.shadowDX = sx / m; R.shadowDY = sy / m;
    }

    function skyColor(idx) {
        let c = lerpHex(SKY_NIGHT[idx], SKY_DAY[idx], R.dayness);
        c = lerpHex(c, SKY_DUSK[idx], twilight * 0.7); // warm the horizon at dawn/dusk
        // clouds mute + darken the sky a touch
        return lerpHex(c, '#535f70', weather.cloud * 0.35);
    }

    function drawSky() {
        const w = R.canvas.width / R.dpr, h = R.canvas.height / R.dpr;
        const g = R.ctx.createLinearGradient(0, 0, 0, h);
        g.addColorStop(0, skyColor(0));
        g.addColorStop(0.55, skyColor(1));
        g.addColorStop(1, skyColor(2));
        R.ctx.fillStyle = g;
        R.ctx.fillRect(0, 0, w, h);

        // Aurora — night-only, fades out toward day and under cloud.
        const auroraA = R.nightLevel * (1 - weather.cloud * 0.8);
        if (auroraA > 0.02) {
            for (let b = 0; b < 2; b++) {
                const baseY = h * (0.14 + b * 0.06);
                R.ctx.beginPath();
                R.ctx.moveTo(0, baseY);
                for (let x = 0; x <= w; x += w / 12) {
                    R.ctx.lineTo(x, baseY + Math.sin(x / w * 6 + R.seaTime * 0.25 + b * 2) * 18 * (1 - b * 0.3));
                }
                R.ctx.lineTo(w, 0); R.ctx.lineTo(0, 0); R.ctx.closePath();
                const ag = R.ctx.createLinearGradient(0, 0, 0, baseY + 30);
                ag.addColorStop(0, 'rgba(52, 211, 153, 0)');
                ag.addColorStop(1, `rgba(${b ? '96, 165, 250' : '52, 211, 153'}, ${(0.05 - b * 0.015) * auroraA})`);
                R.ctx.fillStyle = ag;
                R.ctx.fill();
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
        const starA = R.nightLevel * (1 - weather.cloud * 0.85);
        if (starA > 0.02) {
            R.ctx.fillStyle = '#dbe6f4';
            for (const s of stars) {
                R.ctx.globalAlpha = starA * (0.25 + 0.45 * (0.5 + 0.5 * Math.sin(R.seaTime * 0.8 + s.ph)));
                R.ctx.beginPath();
                R.ctx.arc(s.u * w, s.v * h, s.r, 0, Math.PI * 2);
                R.ctx.fill();
            }
            R.ctx.globalAlpha = 1;
        }

        // Luminary: sun and moon share an east→west arc, crossfaded by day/
        // night, dimmed under cloud. Drawn before the world so peaks occlude.
        const arcY = (frac) => h * (0.62 - Math.sin(Math.max(0, Math.min(1, frac)) * Math.PI) * 0.5);
        const arcX = (frac) => w * (0.12 + 0.76 * frac);
        const clouded = 1 - weather.cloud * 0.75;
        // sun: up during the day half (phase .25→.75)
        const sf = (todPhase - 0.25) / 0.5;
        if (R.dayness > 0.02 && sf >= -0.05 && sf <= 1.05) {
            drawLuminary(arcX(sf), arcY(sf), Math.max(22, Math.min(w, h) * 0.05),
                         '#ffe9b0', '#ffd070', R.dayness * clouded, false);
        }
        // moon: up during the night half (phase .75→1.25)
        const mf = (((todPhase + 0.25) % 1) - 0.25) / 0.5;
        if (R.nightLevel > 0.02 && mf >= -0.05 && mf <= 1.05) {
            drawLuminary(arcX(mf), arcY(mf), Math.max(20, Math.min(w, h) * 0.045),
                         '#e8eef7', '#d2e0f5', R.nightLevel * clouded, true);
        }
    }

    function drawLuminary(x, y, r, disc, glow, alpha, moon) {
        R.ctx.globalAlpha = alpha;
        const halo = R.ctx.createRadialGradient(x, y, r * 0.5, x, y, r * (moon ? 4 : 5));
        halo.addColorStop(0, rgba(glow, 0.32));
        halo.addColorStop(1, rgba(glow, 0));
        R.ctx.fillStyle = halo;
        R.ctx.beginPath(); R.ctx.arc(x, y, r * (moon ? 4 : 5), 0, Math.PI * 2); R.ctx.fill();
        R.ctx.fillStyle = disc;
        R.ctx.beginPath(); R.ctx.arc(x, y, r, 0, Math.PI * 2); R.ctx.fill();
        if (moon) {
            R.ctx.fillStyle = 'rgba(190, 202, 222, 0.55)';
            for (const [ox, oy, or] of [[-0.3, -0.2, 0.22], [0.25, 0.1, 0.16], [0.05, 0.38, 0.13]]) {
                R.ctx.beginPath(); R.ctx.arc(x + r * ox, y + r * oy, r * or, 0, Math.PI * 2); R.ctx.fill();
            }
        }
        R.ctx.globalAlpha = 1;
    }

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
        R.ctx.fillStyle = '#8391a5';
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
            const gr = R.ctx.createRadialGradient(cx, cy, r * 0.2, cx, cy, r);
            gr.addColorStop(0, `rgba(150, 165, 186, ${0.22 * weather.cloud})`);
            gr.addColorStop(1, 'rgba(150, 165, 186, 0)');
            R.ctx.fillStyle = gr;
            R.ctx.beginPath(); R.ctx.ellipse(cx, cy, r, r * 0.55, 0, 0, Math.PI * 2); R.ctx.fill();
        }
    }

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
        
        R.ctx.save();
        const corners = [S(0, 0), S(W, 0), S(W, H), S(0, H)];
        R.ctx.beginPath();
        corners.forEach((p, i) => i ? R.ctx.lineTo(p.x, p.y) : R.ctx.moveTo(p.x, p.y));
        R.ctx.closePath();
        R.ctx.clip();
        
        R.ctx.globalAlpha = 0.12 * weather.cloud;
        R.ctx.fillStyle = '#05070c';
        const z = zoom();
        for (const c of cloudShadows) {
            c.x += dvx * c.s * dt * 0.03; c.y += dvy * c.s * dt * 0.03;
            const margin = 600;
            if (c.x > W + margin) c.x -= (W + 2 * margin);
            else if (c.x < -margin) c.x += (W + 2 * margin);
            if (c.y > H + margin) c.y -= (H + 2 * margin);
            else if (c.y < -margin) c.y += (H + 2 * margin);

            const p = S(c.x, c.y);
            R.ctx.beginPath();
            R.ctx.ellipse(p.x, p.y, c.r * z, c.r * 0.5 * z, 0, 0, Math.PI * 2);
            R.ctx.fill();
        }
        R.ctx.restore();
    }

    function drawPrecip(dt) {
        const type = weather.type;
        if ((type !== 'rain' && type !== 'snow') || weather.intensity < 0.02) {
            if (precip.length) precip.length = 0;
            return;
        }
        const w = R.canvas.width / R.dpr, h = R.canvas.height / R.dpr;
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
            R.ctx.strokeStyle = 'rgba(174, 200, 230, 0.5)';
            R.ctx.lineCap = 'round';
            for (const p of precip) {
                const vx = (wvx * 3 + 0.4) * p.z, vy = (13 + 6 * p.z);
                p.x += vx * dt * 60; p.y += vy * dt * 60;
                if (p.y > h + 10) { p.y = -10; p.x = Math.random() * (w + 200) - 100; }
                R.ctx.lineWidth = p.z * 1.4;
                R.ctx.beginPath();
                R.ctx.moveTo(p.x, p.y);
                R.ctx.lineTo(p.x - vx * 1.1, p.y - vy * 1.1);
                R.ctx.stroke();
            }
            R.ctx.lineCap = 'butt';
        } else { // snow
            R.ctx.fillStyle = 'rgba(233, 240, 250, 0.85)';
            for (const p of precip) {
                p.sway += dt * 1.5;
                p.x += (wvx * 2 + Math.sin(p.sway) * 0.6) * p.z * dt * 60;
                p.y += (1.6 + 1.4 * p.z) * dt * 60;
                if (p.y > h + 8) { p.y = -8; p.x = Math.random() * (w + 200) - 100; }
                R.ctx.globalAlpha = 0.5 + 0.4 * p.z;
                R.ctx.beginPath();
                R.ctx.arc(p.x, p.y, p.z * 1.7, 0, Math.PI * 2);
                R.ctx.fill();
            }
            R.ctx.globalAlpha = 1;
        }
    }

    function drawGrade() {
        const w = R.canvas.width / R.dpr, h = R.canvas.height / R.dpr;
        // overcast steals some daylight and warmth
        const dim = 1 - weather.cloud * 0.45;
        const dayA = R.dayness * 0.26 * dim, duskA = twilight * 0.22 * dim;
        if (dayA > 0.01 || duskA > 0.01) {
            R.ctx.save();
            R.ctx.globalCompositeOperation = 'screen';
            if (dayA > 0.01) { R.ctx.globalAlpha = dayA; R.ctx.fillStyle = '#9cc2e8'; R.ctx.fillRect(0, 0, w, h); }
            if (duskA > 0.01) { R.ctx.globalAlpha = duskA; R.ctx.fillStyle = '#ff9d5c'; R.ctx.fillRect(0, 0, w, h); }
            R.ctx.restore();
        }
        // A cool grey wash under heavy cloud, so overcast/rain/snow reads as
        // a moodier, flatter light rather than the same clear palette.
        if (weather.cloud > 0.05) {
            R.ctx.globalAlpha = weather.cloud * 0.16;
            R.ctx.fillStyle = '#3a4658';
            R.ctx.fillRect(0, 0, w, h);
            R.ctx.globalAlpha = 1;
        }
    }

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

    function ridged(x, y) {
        let f = 0, amp = 0.5, freq = 1, norm = 0;
        for (let o = 0; o < 4; o++) {
            let n = 1 - Math.abs(2 * vnoise(x * freq, y * freq) - 1);
            n *= n; // sharpen the crest
            f += amp * n; norm += amp; freq *= 2.02; amp *= 0.5;
        }
        return f / norm;
    }

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
        const vb = R.viewBounds || { x0: -40, x1: R.canvas.width / R.dpr + 40,
                                   y0: -40, y1: R.canvas.height / R.dpr + 40 };
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

                R.ctx.beginPath();
                R.ctx.moveTo(P00.x, P00.y); R.ctx.lineTo(P10.x, P10.y);
                R.ctx.lineTo(P11.x, P11.y); R.ctx.lineTo(P01.x, P01.y); R.ctx.closePath();
                R.ctx.fillStyle = col;
                R.ctx.fill();
                // faint wireframe so the mesh reads as facets (the "polygon
                // terrain" look), fading out with haze
                R.ctx.strokeStyle = rgba('#b8cbe6', 0.13 * (1 - haze * 0.7));
                R.ctx.lineWidth = 1;
                R.ctx.stroke();
            }
        }
    }

    // The biome field itself now lives in state.js (logic layer), because
    // supplier yield reads the same bands — the ground a site sits on is
    // what sets its output, so the tint below and that multiplier must come
    // from one source. Sampling is still memoized per seed there, which
    // matters on this hot bake path (once per biome cell, whole world).
    const getBiomeNoise = (x, y) => SC.biomeNoise(x, y);

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
        R.ctx.save();
        const corners = [S(0, 0), S(SC.worldW(), 0), S(SC.worldW(), SC.worldH()), S(0, SC.worldH())];
        R.ctx.beginPath();
        corners.forEach((p, i) => i ? R.ctx.lineTo(p.x, p.y) : R.ctx.moveTo(p.x, p.y));
        R.ctx.closePath();
        R.ctx.clip();
        for (const p of d.patches) {
            R.ctx.globalAlpha = p.a;
            R.ctx.fillStyle = p.tint;
            R.ctx.beginPath();
            p.pts.forEach((pt, i) => {
                const s = S(pt.x, pt.y);
                if (i === 0) R.ctx.moveTo(s.x, s.y);
                else R.ctx.lineTo(s.x, s.y);
            });
            R.ctx.closePath();
            R.ctx.fill();
        }
        R.ctx.globalAlpha = 1;
        R.ctx.restore();

        // trees & rocks — skip any that would sit under a building
        for (const t of d.trees) {
            let nearNode = false;
            for (const n of SC.state.nodes) {
                if (n.active && Math.abs(n.x - t.x) < 95 && Math.abs(n.y - t.y) < 95) { nearNode = true; break; }
            }
            if (nearNode) continue;
            const s = S(t.x, t.y), sc = t.s * z;
            // little ground shadow
            R.ctx.globalAlpha = 0.22;
            R.ctx.fillStyle = '#05070c';
            R.ctx.beginPath();
            R.ctx.ellipse(s.x, s.y, 9 * sc, 4.5 * sc, 0, 0, Math.PI * 2);
            R.ctx.fill();
            R.ctx.globalAlpha = 1;
            if (t.rock) {
                R.ctx.fillStyle = mix('#4b5563', '#334155', t.tone);
                R.ctx.beginPath();
                R.ctx.ellipse(s.x, s.y - 3 * sc, 7 * sc, 5 * sc, 0, 0, Math.PI * 2);
                R.ctx.fill();
            } else if (t.type === 'pine' || !t.type) {
                // trunk
                R.ctx.fillStyle = '#3a2a1e';
                R.ctx.fillRect(s.x - 1.4 * sc, s.y - 8 * sc, 2.8 * sc, 8 * sc);
                // two-tier pine
                const green = mix('#2f6b3f', '#245a37', t.tone);
                R.ctx.fillStyle = green;
                R.ctx.beginPath();
                R.ctx.moveTo(s.x, s.y - 30 * sc);
                R.ctx.lineTo(s.x + 9 * sc, s.y - 12 * sc);
                R.ctx.lineTo(s.x - 9 * sc, s.y - 12 * sc);
                R.ctx.closePath(); R.ctx.fill();
                R.ctx.beginPath();
                R.ctx.moveTo(s.x, s.y - 22 * sc);
                R.ctx.lineTo(s.x + 11 * sc, s.y - 6 * sc);
                R.ctx.lineTo(s.x - 11 * sc, s.y - 6 * sc);
                R.ctx.closePath(); R.ctx.fill();
                // sun highlight
                R.ctx.fillStyle = mix(green, '#6ee7a0', 0.35);
                R.ctx.beginPath();
                R.ctx.moveTo(s.x, s.y - 22 * sc);
                R.ctx.lineTo(s.x + 4 * sc, s.y - 8 * sc);
                R.ctx.lineTo(s.x - 1 * sc, s.y - 8 * sc);
                R.ctx.closePath(); R.ctx.fill();
            } else if (t.type === 'broadleaf') {
                R.ctx.fillStyle = '#4a3320';
                R.ctx.fillRect(s.x - 2 * sc, s.y - 10 * sc, 4 * sc, 10 * sc);
                const green = mix('#1e5c2d', '#184d23', t.tone);
                R.ctx.fillStyle = green;
                R.ctx.beginPath();
                R.ctx.ellipse(s.x, s.y - 18 * sc, 14 * sc, 12 * sc, 0, 0, Math.PI * 2);
                R.ctx.fill();
                R.ctx.fillStyle = mix(green, '#5add74', 0.25);
                R.ctx.beginPath();
                R.ctx.ellipse(s.x - 2 * sc, s.y - 22 * sc, 8 * sc, 6 * sc, 0, 0, Math.PI * 2);
                R.ctx.fill();
            } else if (t.type === 'cactus') {
                const green = mix('#4d7a42', '#3e6335', t.tone);
                R.ctx.fillStyle = green;
                R.ctx.beginPath(); // main trunk
                R.ctx.roundRect(s.x - 2 * sc, s.y - 24 * sc, 4 * sc, 24 * sc, 2 * sc);
                R.ctx.fill();
                R.ctx.beginPath(); // left arm
                R.ctx.roundRect(s.x - 8 * sc, s.y - 16 * sc, 8 * sc, 3 * sc, 1.5 * sc);
                R.ctx.roundRect(s.x - 8 * sc, s.y - 20 * sc, 3 * sc, 7 * sc, 1.5 * sc);
                R.ctx.fill();
                R.ctx.beginPath(); // right arm
                R.ctx.roundRect(s.x + 2 * sc, s.y - 12 * sc, 7 * sc, 3 * sc, 1.5 * sc);
                R.ctx.roundRect(s.x + 6 * sc, s.y - 18 * sc, 3 * sc, 9 * sc, 1.5 * sc);
                R.ctx.fill();
            } else if (t.type === 'deadbush') {
                R.ctx.strokeStyle = mix('#786b53', '#5c5240', t.tone);
                R.ctx.lineWidth = 1.5 * sc;
                R.ctx.beginPath();
                R.ctx.moveTo(s.x, s.y); R.ctx.lineTo(s.x - 6 * sc, s.y - 8 * sc);
                R.ctx.moveTo(s.x, s.y); R.ctx.lineTo(s.x + 7 * sc, s.y - 7 * sc);
                R.ctx.moveTo(s.x, s.y); R.ctx.lineTo(s.x - 2 * sc, s.y - 10 * sc);
                R.ctx.moveTo(s.x - 6 * sc, s.y - 8 * sc); R.ctx.lineTo(s.x - 9 * sc, s.y - 12 * sc);
                R.ctx.stroke();
            }
        }
        R.ctx.globalAlpha = 1;
    }

    // ── Dynamic biome fields: regions of forest, greenland and desert ──
    // Tinted from the same seeded noise as before, but baked ONCE into a
    // world-space bitmap (one pixel per biome cell) instead of stroked as
    // ~1000 individually blurred quads on every repaint.
    //
    // Why it had to change: drawLandStatic runs inside render-core's cached
    // background layer, which re-bakes whenever the zoom drifts >15% — i.e.
    // several times a second throughout a pinch. Paying `filter:blur(60px)`
    // per cell there cost ~7x the un-blurred fills and scaled with world
    // area, which is what made pinch-zoom stutter on mobile once the map had
    // grown. Blurring one small bitmap once gets the same soft boundaries
    // for a single drawImage per frame.
    // Bands (and their tints) come from SC.CONFIG.BIOME_BANDS, shared with
    // supplier yield. `tint: null` (the plains band) means no wash — the
    // base slate gradient shows through, as before.
    function biomeTint(x, y) {
        return SC.biomeAt(x, y).tint;
    }

    function ensureBiome(W, Wh, step) {
        const key = Math.round(W) + 'x' + Math.round(Wh) + ':' + step + ':' + (SC.state.seed || '');
        if (biome && biomeKey === key) return biome;
        const cols = Math.max(1, Math.ceil(W / step)), rows = Math.max(1, Math.ceil(Wh / step));
        // A 1px-per-cell bitmap upscaled by PAD, so one modest blur radius
        // softens the boundaries as much as the old per-quad blur(60px) did
        // without the cost growing with world size.
        const PAD = 4;
        const cv = document.createElement('canvas');
        cv.width = cols * PAD; cv.height = rows * PAD;
        const bctx = cv.getContext('2d');
        for (let j = 0; j < rows; j++) {
            for (let i = 0; i < cols; i++) {
                const tint = biomeTint(i * step + step / 2, j * step + step / 2);
                if (!tint) continue;
                bctx.fillStyle = tint;
                bctx.fillRect(i * PAD, j * PAD, PAD, PAD);
            }
        }
        // One blur over the whole sheet, not one per cell.
        const blurred = document.createElement('canvas');
        blurred.width = cv.width; blurred.height = cv.height;
        const octx = blurred.getContext('2d');
        octx.filter = 'blur(' + (PAD * 0.9).toFixed(2) + 'px)';
        octx.drawImage(cv, 0, 0);
        octx.filter = 'none';
        biome = { cv: blurred, cols, rows, step, pad: PAD, w: cols * step, h: rows * step };
        biomeKey = key;
        return biome;
    }

    function drawBiomeTint(W, Wh, step) {
        const b = ensureBiome(W, Wh, step);
        // The iso projection is affine (screen = M·world + t, see camera.js
        // project()), so the world-space sheet maps onto the ground plane
        // exactly via a canvas transform — no per-cell path work.
        const z = zoom(), kx = ISO.kx, ky = ISO.ky;
        const sx = b.w / b.cv.width, sy = b.h / b.cv.height; // world units per bitmap px
        const o = S(0, 0);
        R.ctx.save();
        R.ctx.transform(z * kx * sx, z * ky * sx, -z * kx * sy, z * ky * sy, o.x, o.y);
        R.ctx.imageSmoothingEnabled = true;
        R.ctx.drawImage(b.cv, 0, 0);
        R.ctx.restore();
    }

    function drawLandStatic() {
        const W = SC.worldW(), Wh = SC.worldH();
        const corners = [S(0, 0), S(W, 0), S(W, Wh), S(0, Wh)];
        // Drop the land onto the backdrop with a soft dark rim. Layered
        // strokes instead of shadowBlur: this repaints during pinch-zoom
        // (see drawBg), and canvas blur is far too slow for that on mobile.
        R.ctx.lineJoin = 'round';
        for (let i = 3; i >= 1; i--) {
            R.ctx.beginPath();
            corners.forEach((p, j) => j ? R.ctx.lineTo(p.x, p.y) : R.ctx.moveTo(p.x, p.y));
            R.ctx.closePath();
            R.ctx.strokeStyle = `rgba(0, 0, 0, ${0.16 - i * 0.04})`;
            R.ctx.lineWidth = i * 14;
            R.ctx.stroke();
        }
        R.ctx.lineJoin = 'miter';

        R.ctx.beginPath();
        corners.forEach((p, i) => i ? R.ctx.lineTo(p.x, p.y) : R.ctx.moveTo(p.x, p.y));
        R.ctx.closePath();
        const ys = corners.map(p => p.y);
        const grad = R.ctx.createLinearGradient(0, Math.min(...ys), 0, Math.max(...ys));
        grad.addColorStop(0, '#2b3c52');
        grad.addColorStop(0.5, '#223247');
        grad.addColorStop(1, '#182437');
        R.ctx.fillStyle = grad;
        R.ctx.fill();

        // Iso grid: faint lines of constant world-x and world-y, clipped to
        // the land, to give the ground a sense of scale and perspective.
        R.ctx.save();
        R.ctx.clip();
        
        const step = 220;

        drawBiomeTint(W, Wh, step);

        R.ctx.strokeStyle = 'rgba(148, 163, 184, 0.055)';
        R.ctx.lineWidth = 1;
        for (let x = 0; x <= W + 1; x += step) {
            const a = S(x, 0), b = S(x, Wh);
            R.ctx.beginPath(); R.ctx.moveTo(a.x, a.y); R.ctx.lineTo(b.x, b.y); R.ctx.stroke();
        }
        for (let y = 0; y <= Wh + 1; y += step) {
            const a = S(0, y), b = S(W, y);
            R.ctx.beginPath(); R.ctx.moveTo(a.x, a.y); R.ctx.lineTo(b.x, b.y); R.ctx.stroke();
        }
        R.ctx.restore();

        drawDecor();

        // Coastline: a lit top-left rim, darker on the lower-right
        R.ctx.beginPath();
        corners.forEach((p, i) => i ? R.ctx.lineTo(p.x, p.y) : R.ctx.moveTo(p.x, p.y));
        R.ctx.closePath();
        R.ctx.strokeStyle = 'rgba(180, 200, 224, 0.16)';
        R.ctx.lineWidth = 2;
        R.ctx.stroke();
    }

    // Colour a cave-massif facet the way drawTerrain colours a terrain quad
    // (height ramp -> slope shading -> aerial haze), so the rock around the
    // opening melts into the mountain mesh instead of reading as a lump pasted
    // on with a palette of its own. `bias` lifts a low outcrop up the ramp so
    // it reads as rock rather than as lowland turf standing on end.
    function rockFacet(hAvg, slope, wy, sky) {
        const hf = Math.min(1, Math.max(0, hAvg + TERRAIN.amp * 0.18) / TERRAIN.amp);
        let col = mix('#2c3d54', '#5b6a86', Math.min(1, hf / TERRAIN.snowline));
        if (hf > TERRAIN.snowline) col = mix(col, '#eef3fa', (hf - TERRAIN.snowline) / (1 - TERRAIN.snowline));
        col = shade(col, Math.max(-0.34, Math.min(0.26, slope)));
        const haze = Math.min(1, Math.max(0, -wy) / (TERRAIN.rise * 2.6));
        return mix(col, sky, 0.08 + 0.5 * haze);
    }

    // The river has to come from somewhere: at the top edge of the field it
    // runs out of a cave mouth in the mountains. The terrain along the river is
    // a carved valley — far too low to contain an opening on its own, which is
    // what made the old entrance read as a pyramid glued to flat ground — so
    // the rock the arch is cut into is authored here: a small headland, then
    // the steep face across it, then the arch through the face.
    function drawCaveBg() {
        const r = SC.state.river;
        if (!r || !r.spine.length || r.spine.length < 2) return;

        const faceY = -26;                       // world y of the rock face the arch is cut into
        const rvF = SC.map.riverAt(faceY) || SC.map.riverAt(0);
        if (!rvF) return;

        const z = zoom();
        const sky = skyColor(1);
        const cx = rvF.x;                        // where the river leaves the mountains
        const hw = rvF.halfW;
        const aw = hw * 1.32;                    // arch half-width, world units (wider than the water)
        const ah = hw * 1.4;                     // arch height at the crown, px at zoom 1 (like terrain)
        const baseY = faceY + 58;                // the face meets the shore over a short, steep run
        // How far back the rear of the tunnel can sit is bounded by the
        // opening's own screen width: the recession direction (world -y) runs
        // up-and-RIGHT on screen in this projection, so much past 0.6 * aw the
        // far end slides clean out of the hole and the "deep tunnel" reads as a
        // slab pasted beside the mouth rather than as depth behind it.
        const depth = aw * 0.5;

        const P = (wx, wy, wz) => {
            const p = S(wx, wy);
            return { x: p.x, y: p.y - (wz || 0) * z };
        };
        const path = pts => {
            R.ctx.beginPath();
            pts.forEach((p, i) => i ? R.ctx.lineTo(p.x, p.y) : R.ctx.moveTo(p.x, p.y));
            R.ctx.closePath();
        };
        const fill = (pts, style) => { path(pts); R.ctx.fillStyle = style; R.ctx.fill(); };
        const edge = a => { R.ctx.strokeStyle = `rgba(184, 203, 230, ${a})`; R.ctx.lineWidth = 1; R.ctx.stroke(); };
        // Stable per-map jitter: varies with the river's exit point so no two
        // maps get the same rock, but never crawls between background rebuilds.
        const hash = k => {
            const s = Math.sin(k * 127.1 + cx * 0.317) * 43758.5453;
            return s - Math.floor(s);
        };

        // --- 1. The headland -------------------------------------------------
        // A dome laid over the terrain, decaying to zero at the edge of its
        // patch — so every boundary vertex still sits at the real terrain height
        // and the join into the mountain mesh is seamless.
        const Rx = aw * 1.75, Ry = 135, crest = ah * 1.42;
        const domeH = (x, y) => {
            const dx = (x - cx) / Rx, dy = (y - (faceY - Ry * 0.2)) / Ry;
            const d2 = dx * dx + dy * dy;
            if (d2 >= 1) return 0;
            const f = 1 - d2;
            return crest * f * f;
        };
        const rockH = (x, y) => Math.max(terrainHeight(x, y), domeH(x, y));

        const COLS = 7, ROWS = 3;
        const colX = i => cx - Rx * 1.1 + (2.2 * Rx * i) / COLS;
        const rowY = j => faceY - (Ry * 1.1 * j) / ROWS;
        // Back to front (increasing world y) so nearer facets paint over farther.
        for (let j = ROWS - 1; j >= 0; j--) {
            for (let i = 0; i < COLS; i++) {
                const x0 = colX(i), x1 = colX(i + 1);
                const yFar = rowY(j + 1), yNear = rowY(j);
                // Only quads the dome actually lifts get redrawn; elsewhere the
                // real terrain mesh (drawn earlier, on its own coarser grid)
                // stands, and re-tessellating it here would shatter it.
                if (domeH(x0, yFar) <= terrainHeight(x0, yFar) &&
                    domeH(x1, yFar) <= terrainHeight(x1, yFar) &&
                    domeH(x1, yNear) <= terrainHeight(x1, yNear) &&
                    domeH(x0, yNear) <= terrainHeight(x0, yNear)) continue;
                const h00 = rockH(x0, yFar), h10 = rockH(x1, yFar);
                const h11 = rockH(x1, yNear), h01 = rockH(x0, yNear);
                // Same lighting as drawTerrain, damped: these facets are far
                // smaller than a terrain cell, so the raw slope term saturates
                // and would chequer the headland black and white.
                const slope = ((h10 + h11) - (h00 + h01)) + ((h01 + h11) - (h00 + h10));
                fill([P(x0, yFar, h00), P(x1, yFar, h10), P(x1, yNear, h11), P(x0, yNear, h01)],
                     rockFacet((h00 + h10 + h11 + h01) * 0.25,
                               -slope / (TERRAIN.amp * 3.2), (yFar + yNear) / 2, sky));
                edge(0.09);
            }
        }

        // --- 2. The face the arch is cut into --------------------------------
        // A tall drop over a short run in y, so it reads as a wall rather than a
        // slope, with a jittered foot so it doesn't meet the shore along a
        // suspiciously straight line.
        const FACE = 11;
        const faceX = i => cx - Rx * 1.04 + (2.08 * Rx * i) / FACE;
        const faceTop = [], faceBot = [], faceH = [];
        for (let i = 0; i <= FACE; i++) {
            const x = faceX(i);
            const h = rockH(x, faceY) * (0.9 + 0.2 * hash(i + 3));
            faceH.push(h);
            faceTop.push(P(x, faceY, h));
            faceBot.push(P(x, baseY + (hash(i + 31) - 0.5) * 22, terrainHeight(x, baseY)));
        }
        for (let i = 0; i < FACE; i++) {
            // A wall dropping toward the viewer catches the light in this
            // scheme; vary it per facet so the face isn't one flat sheet.
            const lit = 0.16 * hash(i + 7) - 0.06 - (i / FACE) * 0.16;
            fill([faceTop[i], faceTop[i + 1], faceBot[i + 1], faceBot[i]],
                 rockFacet((faceH[i] + faceH[i + 1]) * 0.5, lit, faceY, sky));
            edge(0.07);
        }

        // --- 3. The arch ------------------------------------------------------
        // Rim outline as fractions of (aw, ah), lower-left -> crown -> lower-right.
        const ARCH = [
            [-1.00, 0.00], [-1.05, 0.34], [-0.90, 0.70], [-0.54, 0.93],
            [-0.05, 1.00], [0.48, 0.93], [0.85, 0.67], [0.99, 0.30], [0.92, 0.00],
        ];
        const F = ARCH.map(a => P(cx + a[0] * aw, faceY, a[1] * ah));
        const B = ARCH.map(a => P(cx + a[0] * aw * 0.5, faceY - depth, a[1] * ah * 0.5));

        // Flat black first: whatever the walls miss must never show the face.
        fill(F, '#03060b');
        // Inner tunnel walls, front rim -> back rim: kept in the mountain's
        // blue-grey family but several stops darker, so the facet edges stay
        // just legible at the rim and vanish toward the back.
        const WALL = ['#16283a', '#1c3049', '#203552', '#1b2c42', '#152436', '#101d2c', '#0c1723', '#0a1420'];
        for (let k = 0; k < ARCH.length - 1; k++) fill([F[k], F[k + 1], B[k + 1], B[k]], WALL[k]);
        fill(B, '#04070d');

        // Depth fade: transparent at the rim, near-black toward the vanishing
        // point, so the eye reads a tunnel receding instead of a flat cut-out.
        const vanish = B.reduce((a, p) => ({ x: a.x + p.x / B.length, y: a.y + p.y / B.length }), { x: 0, y: 0 });
        let rimR = 0;
        for (const p of F) rimR = Math.max(rimR, Math.hypot(p.x - vanish.x, p.y - vanish.y));
        R.ctx.save();
        path(F);
        R.ctx.clip();
        const gDepth = R.ctx.createRadialGradient(vanish.x, vanish.y, 0, vanish.x, vanish.y, rimR * 1.1);
        gDepth.addColorStop(0, 'rgba(3, 6, 11, 0.97)');
        gDepth.addColorStop(0.4, 'rgba(4, 8, 14, 0.82)');
        gDepth.addColorStop(0.75, 'rgba(7, 13, 21, 0.34)');
        gDepth.addColorStop(1, 'rgba(8, 14, 22, 0)');
        R.ctx.fillStyle = gDepth;
        R.ctx.fill();
        // Ambient occlusion hugging the rim — a wide dark stroke of the arch
        // path clipped to its own interior — so the opening sits *in* the rock
        // instead of being painted onto it.
        R.ctx.strokeStyle = 'rgba(3, 6, 11, 0.5)';
        R.ctx.lineWidth = Math.max(5, aw * 0.3 * z);
        path(F);
        R.ctx.stroke();
        R.ctx.restore();

        // --- 4. Water, from deep inside out onto the field --------------------
        // The field river (drawRiverFieldBg) is painted before the face and so
        // is buried by it; this carries the water back out through the arch and
        // hands off to the field river below the shore.
        const wSteps = 18;
        const wBack = faceY - depth * 0.95, wFront = baseY + 34;
        const wl = [], wr = [];
        for (let i = 0; i <= wSteps; i++) {
            const wy = wBack + (wFront - wBack) * (i / wSteps);
            const rv2 = SC.map.riverAt(wy) || rvF;
            // Narrows toward the back to sit inside the tunnel geometry
            const narrow = wy < faceY ? 0.58 + 0.42 * ((wy - wBack) / (faceY - wBack)) : 1;
            wl.push(P(rv2.x - rv2.halfW * narrow, wy, 0));
            wr.push(P(rv2.x + rv2.halfW * narrow, wy, 0));
        }
        R.ctx.save();
        path(wl.concat(wr.slice().reverse()));
        const gWater = R.ctx.createLinearGradient(0, wl[0].y, 0, wl[wl.length - 1].y);
        gWater.addColorStop(0, 'rgb(4, 7, 12)');             // cavern darkness
        gWater.addColorStop(0.34, 'rgb(10, 23, 36)');
        gWater.addColorStop(0.66, 'rgb(20, 50, 72)');        // catching the daylight at the mouth
        gWater.addColorStop(1, mix('#123047', sky, 0.08));   // seamless with the field river
        R.ctx.fillStyle = gWater;
        R.ctx.fill();
        // The face shades the water it overhangs
        R.ctx.clip();
        const mouth = P(cx, faceY, 0);
        const gShade = R.ctx.createLinearGradient(0, mouth.y - ah * 0.15 * z, 0, mouth.y + 42 * z);
        gShade.addColorStop(0, 'rgba(2, 5, 10, 0.5)');
        gShade.addColorStop(1, 'rgba(2, 5, 10, 0)');
        R.ctx.fillStyle = gShade;
        R.ctx.fill();
        R.ctx.restore();

        // --- 5. Silhouettes inside the mouth ----------------------------------
        // Stalactites off the crown and a boulder in the water: a couple of hard
        // silhouettes are what sell the opening as a cave rather than a doorway.
        R.ctx.save();
        path(F);
        R.ctx.clip();
        for (let k = 0; k < 7; k++) {
            const seg = (0.18 + 0.62 * (k / 6) + (hash(k + 50) - 0.5) * 0.05) * (ARCH.length - 1);
            const i0 = Math.min(ARCH.length - 2, Math.floor(seg)), fr = seg - i0;
            const bx = F[i0].x + (F[i0 + 1].x - F[i0].x) * fr;
            const by = F[i0].y + (F[i0 + 1].y - F[i0].y) * fr;
            const wdt = (2.5 + hash(k + 60) * 3.5) * z;
            const len = (9 + hash(k + 70) * 24) * z;
            fill([{ x: bx - wdt, y: by - 1 }, { x: bx + wdt, y: by - 1 },
                  { x: bx + wdt * 0.15, y: by + len }], '#04080f');
        }
        const bo = P(cx - aw * 0.4, faceY - depth * 0.3, 0);
        fill([{ x: bo.x - 12 * z, y: bo.y }, { x: bo.x - 4 * z, y: bo.y - 10 * z },
              { x: bo.x + 7 * z, y: bo.y - 7 * z }, { x: bo.x + 13 * z, y: bo.y + 2 * z }], '#0a1420');
        R.ctx.restore();

        // --- 6. Rim light and cave breath -------------------------------------
        // Sun grazes the upper-left lip; the lower-right lip stays in shadow.
        R.ctx.beginPath();
        for (let k = 0; k <= 4; k++) (k ? R.ctx.lineTo(F[k].x, F[k].y) : R.ctx.moveTo(F[k].x, F[k].y));
        R.ctx.strokeStyle = rgba('#d6e6f7', 0.18 + 0.16 * R.dayness);
        R.ctx.lineWidth = 1.6;
        R.ctx.stroke();
        R.ctx.beginPath();
        for (let k = 4; k < ARCH.length; k++) (k > 4 ? R.ctx.lineTo(F[k].x, F[k].y) : R.ctx.moveTo(F[k].x, F[k].y));
        R.ctx.strokeStyle = 'rgba(6, 11, 18, 0.5)';
        R.ctx.lineWidth = 1.6;
        R.ctx.stroke();

        // Cold air off the water pooling at the mouth
        const mist = P(cx, faceY + 4, ah * 0.14);
        const mr = aw * 1.45 * z;
        const gMist = R.ctx.createRadialGradient(mist.x, mist.y, 0, mist.x, mist.y, mr);
        gMist.addColorStop(0, `rgba(176, 206, 232, ${0.11 + 0.05 * R.dayness})`);
        gMist.addColorStop(1, 'rgba(176, 206, 232, 0)');
        R.ctx.save();
        R.ctx.beginPath();
        R.ctx.ellipse(mist.x, mist.y, mr, mr * 0.4, 0, 0, Math.PI * 2);
        R.ctx.fillStyle = gMist;
        R.ctx.fill();
        R.ctx.restore();
    }

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
        R.ctx.beginPath();
        left.forEach((p, i) => i ? R.ctx.lineTo(p.x, p.y) : R.ctx.moveTo(p.x, p.y));
        for (let i = right.length - 1; i >= 0; i--) R.ctx.lineTo(right[i].x, right[i].y);
        R.ctx.closePath();

        // Unified absolute screen gradient with weather/time-of-day haze
        const topY = S(SC.worldW() * 0.5, -TERRAIN.ring).y;
        const botY = S(SC.worldW() * 0.5, SC.worldH() + TERRAIN.ring).y;
        const g = R.ctx.createLinearGradient(0, topY, 0, botY);
        
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

        R.ctx.fillStyle = g;
        R.ctx.fill();

        // bank shadow
        R.ctx.strokeStyle = 'rgba(2, 6, 12, 0.5)';
        R.ctx.lineWidth = 2;
        R.ctx.stroke();
    }

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
        
        const gRip = R.ctx.createLinearGradient(0, topY_fade, 0, botY_full);
        let stopFade = (fadeY - topY_fade) / (botY_full - topY_fade);
        stopFade = Math.max(0.01, Math.min(0.99, stopFade));
        gRip.addColorStop(0, 'rgba(96, 200, 240, 0)');
        gRip.addColorStop(stopFade, 'rgba(96, 200, 240, 0.10)');
        gRip.addColorStop(1, 'rgba(96, 200, 240, 0.10)');
        
        R.ctx.strokeStyle = gRip;
        R.ctx.lineWidth = 1.4;
        
        for (let w = 0; w < 4; w++) {
            // Ripple lines along the full river including downstream/upstream extensions
            R.ctx.beginPath();
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
                         + Math.sin(R.seaTime * freq + t * 8 + w) * amp;
                const p = getPt(wx, extSpine[i].y);
                if (!ripStarted) { R.ctx.moveTo(p.x, p.y); ripStarted = true; }
                else { R.ctx.lineTo(p.x, p.y); }
            }
            R.ctx.stroke();
        }
    }

    function drawWetRoads() {
        if (weather.type !== 'rain' || weather.intensity < 0.05) return;
        const z = zoom();
        R.ctx.strokeStyle = `rgba(150, 190, 232, ${0.14 * weather.intensity})`;
        R.ctx.lineWidth = Math.max(1, 2 * z);
        for (const e of SC.state.edges) {
            const A = S(e.a.x, e.a.y), B = S(e.b.x, e.b.y);
            R.ctx.beginPath(); R.ctx.moveTo(A.x, A.y); R.ctx.lineTo(B.x, B.y); R.ctx.stroke();
        }
    }

    function drawSnowBlanket() {
        if (weather.snow < 0.03) return;
        const corners = [S(0, 0), S(SC.worldW(), 0), S(SC.worldW(), SC.worldH()), S(0, SC.worldH())];
        R.ctx.save();
        R.ctx.beginPath();
        corners.forEach((p, i) => i ? R.ctx.lineTo(p.x, p.y) : R.ctx.moveTo(p.x, p.y));
        R.ctx.closePath();
        R.ctx.clip();
        R.ctx.globalAlpha = 0.17 * weather.snow;
        R.ctx.fillStyle = '#e9f1fb';
        const xs = corners.map(p => p.x), ys = corners.map(p => p.y);
        R.ctx.fillRect(Math.min(...xs), Math.min(...ys), Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys));
        R.ctx.restore();
        R.ctx.globalAlpha = 1;
    }

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
        if (R.nightLevel < 0.25) return; // they only come out at night
        for (const f of ensureFlies()) {
            const a = R.seaTime * f.sp + f.ph;
            const p = S(f.x + Math.cos(a) * f.rad, f.y + Math.sin(a * 1.3) * f.rad * 0.6);
            const glow = (0.5 + 0.5 * Math.sin(R.seaTime * 2.2 + f.blink)) * R.nightLevel;
            if (glow < 0.15) continue;
            const z = clampZoom();
            R.ctx.globalAlpha = 0.25 * glow;
            R.ctx.fillStyle = '#fde68a';
            R.ctx.beginPath(); R.ctx.arc(p.x, p.y, 4 * z, 0, Math.PI * 2); R.ctx.fill();
            R.ctx.globalAlpha = 0.9 * glow;
            R.ctx.beginPath(); R.ctx.arc(p.x, p.y, 1.3 * z, 0, Math.PI * 2); R.ctx.fill();
        }
        R.ctx.globalAlpha = 1;
    }

    function drawVignette() {
        const w = R.canvas.width / R.dpr, h = R.canvas.height / R.dpr;
        const key = w + 'x' + h;
        if (vignetteWH !== key) {
            vignette = R.ctx.createRadialGradient(w / 2, h * 0.52, Math.min(w, h) * 0.42,
                                                w / 2, h * 0.52, Math.max(w, h) * 0.72);
            vignette.addColorStop(0, 'rgba(4, 7, 13, 0)');
            vignette.addColorStop(1, 'rgba(4, 7, 13, 0.42)');
            vignetteWH = key;
        }
        R.ctx.fillStyle = vignette;
        R.ctx.fillRect(0, 0, w, h);
    }

    Object.assign(R, { updateDayWeather, skyColor, drawSky, drawSkyClouds, drawCloudShadows, drawPrecip,
        drawGrade, drawTerrain, drawLandStatic, drawCaveBg, drawRiverFieldBg, drawRiver,
        drawWetRoads, drawSnowBlanket, drawFireflies, drawVignette, terrainKey, ensureTerrain });
})();
