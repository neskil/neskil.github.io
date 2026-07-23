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
        
        // --- Dynamic Biome Fields ---
        // Tint individual grid cells based on a seeded noise function
        // to create regions of forests, greenlands, and deserts.
        R.ctx.save();
        R.ctx.filter = 'blur(60px)'; // Smoothly blend the biome boundaries
        
        for (let y = 0; y < Wh; y += step) {
            for (let x = 0; x < W; x += step) {
                const noise = getBiomeNoise(x + step / 2, y + step / 2);
                
                if (noise > 1.2) {
                    R.ctx.fillStyle = 'rgba(20, 110, 60, 0.45)'; // Deep forest (richer green)
                } else if (noise > 0.4) {
                    R.ctx.fillStyle = 'rgba(34, 139, 34, 0.25)'; // Greenland
                } else if (noise < -1.2) {
                    R.ctx.fillStyle = 'rgba(210, 160, 70, 0.35)'; // Deep desert (clear sand/gold)
                } else if (noise < -0.4) {
                    R.ctx.fillStyle = 'rgba(160, 130, 80, 0.22)'; // Arid scrub (dusty beige/brown)
                } else {
                    continue; // Base slate gradient
                }
                
                R.ctx.beginPath();
                const p1 = S(x, y), p2 = S(x + step, y), p3 = S(x + step, y + step), p4 = S(x, y + step);
                R.ctx.moveTo(p1.x, p1.y);
                R.ctx.lineTo(p2.x, p2.y);
                R.ctx.lineTo(p3.x, p3.y);
                R.ctx.lineTo(p4.x, p4.y);
                R.ctx.fill();
            }
        }
        R.ctx.restore();

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
        R.ctx.beginPath();
        [B0, B1, B2, B3, B4, B5].forEach((p, i) => i ? R.ctx.lineTo(p.x, p.y) : R.ctx.moveTo(p.x, p.y));
        R.ctx.closePath();
        R.ctx.fillStyle = '#070c14';
        R.ctx.fill();

        // 2. Draw inner tunnel walls connecting Front to Back. These carry a
        //    faint blue so the low-poly facet edges are still legible at the
        //    rim; the radial fade in step 3 darkens them toward the back.
        const drawWall = (p1, p2, p3, p4, hex) => {
            R.ctx.beginPath();
            R.ctx.moveTo(p1.x, p1.y); R.ctx.lineTo(p2.x, p2.y); R.ctx.lineTo(p3.x, p3.y); R.ctx.lineTo(p4.x, p4.y);
            R.ctx.closePath();
            R.ctx.fillStyle = fogColor(hex, (cy + bcy) / 2);
            R.ctx.fill();
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
        R.ctx.save();
        R.ctx.beginPath();
        cavePts.forEach((p, i) => i ? R.ctx.lineTo(p.x, p.y) : R.ctx.moveTo(p.x, p.y));
        R.ctx.closePath();
        R.ctx.clip();
        const gDepth = R.ctx.createRadialGradient(
            vanish.x, vanish.y, 0, vanish.x, vanish.y, rimR * 1.05);
        gDepth.addColorStop(0, 'rgba(4, 7, 12, 0.96)');
        gDepth.addColorStop(0.45, 'rgba(6, 10, 17, 0.72)');
        gDepth.addColorStop(0.8, 'rgba(8, 14, 22, 0.28)');
        gDepth.addColorStop(1, 'rgba(8, 14, 22, 0)');
        R.ctx.fillStyle = gDepth;
        R.ctx.fill();
        R.ctx.restore();

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
            R.ctx.save();
            R.ctx.beginPath();
            wLeft.forEach((p, i) => i ? R.ctx.lineTo(p.x, p.y) : R.ctx.moveTo(p.x, p.y));
            for (let i = wRight.length - 1; i >= 0; i--) R.ctx.lineTo(wRight[i].x, wRight[i].y);
            R.ctx.closePath();

            const backY = (wLeft[0].y + wRight[0].y) / 2;
            const frontY = (wLeft[wLeft.length - 1].y + wRight[wRight.length - 1].y) / 2;
            // Mouth colour matches the field river exactly (same formula as
            // drawRiverFieldBg's getRiverColor at the edge), so the water
            // reads as one continuous river flowing into the dark.
            const mouthCol = mix('#123047', sky, 0.08);
            const gWater = R.ctx.createLinearGradient(0, backY, 0, frontY);
            gWater.addColorStop(0, 'rgba(8, 14, 22, 0.85)');   // dissolves into the tunnel shadow
            gWater.addColorStop(0.4, 'rgba(13, 30, 45, 0.96)');
            gWater.addColorStop(0.75, 'rgba(17, 44, 66, 1)');
            gWater.addColorStop(1, mouthCol);                  // seamless with the field river
            R.ctx.fillStyle = gWater;
            R.ctx.fill();
            R.ctx.restore();
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
            R.ctx.beginPath();
            R.ctx.moveTo(p1.x, p1.y); R.ctx.lineTo(p2.x, p2.y); R.ctx.lineTo(p3.x, p3.y); R.ctx.lineTo(p4.x, p4.y);
            R.ctx.closePath();
            R.ctx.fillStyle = fogColor(colorHex, facetY);
            R.ctx.fill();
            // Subtle edge line to match low-poly style
            R.ctx.strokeStyle = 'rgba(200, 215, 235, 0.04)';
            R.ctx.lineWidth = 1;
            R.ctx.stroke();
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
