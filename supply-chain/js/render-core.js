// Canvas rendering — isometric ("2.5D") view. CORE: shared context, camera
// helpers, the cached-background layer, and the per-frame orchestrator.
//
// render.js was split (by size, for editability) into four scripts that share
// ONE internal context object `R` (SC._render): render-core (this file) plus
// render-env / render-network / render-actors. `R` holds the live drawing
// context + the frame-varying "grade" state (day/night, shadows, seaTime) that
// every layer reads; the satellite files capture the stable helper functions
// off `R` and register their draw functions back onto it. Load order matters:
// core must run first (it creates `R` and the helpers the others capture).
//
// Game logic stays in flat world (x, y); this module projects that ground
// plane to the screen through SC.camera and draws everything in screen pixels.
window.SC = window.SC || {};

SC.render = (function() {
    // Shared render context — the single source of truth the satellite files
    // (render-env/network/actors) read and write through. `ctx`/`canvas`/`dpr`
    // MUST live here (not be captured per-file): renderBg() swaps `R.ctx` to a
    // cache layer while baking the background, and every layer has to follow
    // that swap. The rest is the frame-varying grade read across all layers.
    const R = {
        ctx: null, canvas: null, dpr: 1,
        ISO: SC.camera.ISO,
        seaTime: 0,
        dayness: 0, nightLevel: 1,          // day/night blend, set in updateDayWeather
        shadowDX: 0.4, shadowDY: 0.9, shadowLen: 1.2, // cast-shadow direction/length
        frameHoverNode: null,               // node under the pointer (build mode)
        viewBounds: null,                   // widened cull window during renderBg
        transfers: [],                      // loading/unloading crate animations
    };
    SC._render = R;                         // exposed for the satellite files

    const ISO = SC.camera.ISO;
    let floaters = [];                      // (unused placeholder; floaters live in render-actors)

    // Parsed-colour cache. mix()/shade()/rgba()/hexToRgb() are called dozens of
    // times per entity per frame, almost always with a constant '#rrggbb'
    // palette colour, and each call otherwise re-parses the same string. We
    // memoise ONLY the '#hex' inputs — that set is small and fixed (goods
    // colours, node bases, sky keyframes) so the cache is bounded — and leave
    // the dynamic 'rgb(...)' blend strings (which vary every frame) uncached so
    // the map can't grow without limit.
    const _rgbCache = new Map();
    function hexToRgb(hex) {
        // Accept both '#rrggbb' and 'rgb(r, g, b)' so mix()/shade() output can
        // be fed back in (the day/night sky blends colours in several steps).
        if (hex[0] !== '#') {
            const m = hex.match(/-?\d+/g);
            return { r: +m[0], g: +m[1], b: +m[2] };
        }
        let c = _rgbCache.get(hex);
        if (c) return c;
        c = { r: parseInt(hex.slice(1, 3), 16), g: parseInt(hex.slice(3, 5), 16), b: parseInt(hex.slice(5, 7), 16) };
        _rgbCache.set(hex, c);
        return c;
    }

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

    function mix(a, b, t) {
        const ca = hexToRgb(a), cb = hexToRgb(b);
        return `rgb(${Math.round(ca.r + (cb.r - ca.r) * t)}, ${Math.round(ca.g + (cb.g - ca.g) * t)}, ${Math.round(ca.b + (cb.b - ca.b) * t)})`;
    }

    function makeRng(seed) {
        let a = seed >>> 0;
        return function() {
            a = (a + 0x6D2B79F5) | 0;
            let t = Math.imul(a ^ (a >>> 15), 1 | a);
            t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
    }

    function footRadii(fw) {
        return { rx: 2 * ISO.kx * fw * zoom(), ry: 2 * ISO.ky * fw * zoom() };
    }

    function diamondPath(cx, cy, rx, ry) {
        R.ctx.beginPath();
        R.ctx.moveTo(cx, cy - ry);
        R.ctx.lineTo(cx + rx, cy);
        R.ctx.lineTo(cx, cy + ry);
        R.ctx.lineTo(cx - rx, cy);
        R.ctx.closePath();
    }

    function roundRectPath(x, y, w, h, r) {
        R.ctx.beginPath();
        R.ctx.moveTo(x + r, y);
        R.ctx.arcTo(x + w, y, x + w, y + h, r);
        R.ctx.arcTo(x + w, y + h, x, y + h, r);
        R.ctx.arcTo(x, y + h, x, y, r);
        R.ctx.arcTo(x, y, x + w, y, r);
        R.ctx.closePath();
    }

    function clampZoom() { return Math.min(1.6, Math.max(0.8, zoom())); }

    function labelAt(text, sx, sy, color, size) {
        const fs = size || 12;
        R.ctx.font = `600 ${fs}px Inter, system-ui, sans-serif`;
        R.ctx.textAlign = 'center';
        R.ctx.textBaseline = 'middle';
        const w = R.ctx.measureText(text).width;
        R.ctx.fillStyle = 'rgba(12, 18, 30, 0.82)';
        roundRectPath(sx - w / 2 - 6, sy - fs / 2 - 3, w + 12, fs + 6, 6);
        R.ctx.fill();
        R.ctx.fillStyle = color || '#f8fafc';
        R.ctx.fillText(text, sx, sy);
    }

    function label(text, wx, wy, color, size) {
        const p = S(wx, wy);
        labelAt(text, p.x, p.y, color, size);
    }

    function emoji(ch, sx, sy, size) {
        R.ctx.font = `${size}px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif`;
        R.ctx.textAlign = 'center';
        R.ctx.textBaseline = 'middle';
        R.ctx.fillText(ch, sx, sy + size * 0.06);
    }

    // Expose the stable helpers so render-env/network/actors can capture them.
    Object.assign(R, { S, zoom, mix, shade, rgba, hexToRgb, makeRng, footRadii,
        diamondPath, roundRectPath, clampZoom, label, labelAt, emoji });

    // --- cached background layer ---------------------------------------------
    const BG_MARGIN = 320; // css px painted beyond each viewport edge
    let bg = null;         // { cv, camX, camY, zoom, w, h, key }

    function attach(cv) {
        R.canvas = cv;
        R.ctx = R.canvas.getContext('2d');
        resize();
        window.addEventListener('resize', resize);

        SC.on('orderComplete', o => {
            R.addFloater(o.city.x, o.city.y - 24, `+$${o.payout}`, '#34d399');
            R.addBurst(o.city.x, o.city.y - 18);
        });
        SC.on('roadBuilt', e => R.addFloater((e.a.x + e.b.x) / 2, (e.a.y + e.b.y) / 2, `−$${e.cost}`, '#f87171'));
        SC.on('roadDemolished', d => R.addFloater((d.edge.a.x + d.edge.b.x) / 2, (d.edge.a.y + d.edge.b.y) / 2, `+$${d.refund}`, '#34d399'));
        SC.on('sitePurchased', d => R.addFloater(d.node.x, d.node.y - 24, `−$${d.price}`, '#f87171'));
        SC.on('truckBought', d => R.addFloater(d.truck.x, d.truck.y - 24, `−$${d.price}`, '#f87171'));
        SC.on('sitePlaced', d => R.addFloater(d.node.x, d.node.y - 24, `−$${d.cost}`, '#f87171'));
    }

    function resize() {
        // Cap at 2: 3x-dpr phones quadruple the fill cost for no visible
        // gain on a moving map, and that fill cost is what makes panning
        // stutter on mobile.
        R.dpr = Math.min(window.devicePixelRatio || 1, 2);
        R.canvas.width = window.innerWidth * R.dpr;
        R.canvas.height = window.innerHeight * R.dpr;
        R.canvas.style.width = window.innerWidth + 'px';
        R.canvas.style.height = window.innerHeight + 'px';
        SC.camera.setViewport(window.innerWidth, window.innerHeight);
    }

    function bgKey() {
        const r = SC.state.river;
        const active = SC.state.nodes ? SC.state.nodes.filter(n => n.active).length : 0;
        return (r ? Math.round(r.spine[0].x) : 0) + ':' + active + ':' +
               R.canvas.width + 'x' + R.canvas.height + ':' + R.terrainKey();
    }

    function renderBg() {
        const cam = SC.camera.cam;
        const wCss = R.canvas.width / R.dpr + BG_MARGIN * 2;
        const hCss = R.canvas.height / R.dpr + BG_MARGIN * 2;
        if (!bg || bg.cv.width !== Math.round(wCss * R.dpr) || bg.cv.height !== Math.round(hCss * R.dpr)) {
            bg = { cv: document.createElement('canvas') };
            bg.cv.width = Math.round(wCss * R.dpr);
            bg.cv.height = Math.round(hCss * R.dpr);
        }
        const bctx = bg.cv.getContext('2d');
        bctx.setTransform(R.dpr, 0, 0, R.dpr, 0, 0);
        bctx.clearRect(0, 0, wCss, hCss);
        bctx.translate(BG_MARGIN, BG_MARGIN);
        // The drawing helpers all render through the module-level `ctx` at
        // the live camera; swapping it in + the translate above paints the
        // same scene shifted into the margin. try/finally so a mid-render
        // throw can never leave `ctx` pointing at the layer — that failure
        // mode silently redirects ALL subsequent drawing into the cache and
        // corrupts every following frame.
        const old = R.ctx;
        R.ctx = bctx;
        R.viewBounds = { x0: -BG_MARGIN - 40, x1: R.canvas.width / R.dpr + BG_MARGIN + 40,
                       y0: -BG_MARGIN - 40, y1: R.canvas.height / R.dpr + BG_MARGIN + 40 };
        try {
            R.drawTerrain();
            R.drawLandStatic();
            R.drawRiverFieldBg();
            R.drawCaveBg();
        } finally {
            R.ctx = old;
            R.viewBounds = null;
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
                   x0 + bg.w * scale < R.canvas.width / R.dpr ||
                   y0 + bg.h * scale < R.canvas.height / R.dpr;
            // Zoom drift: a scaled blit visibly detaches the cached scenery
            // from the live world (mountains swelling/tearing against the
            // map — the mobile pinch glitch) once it strays far enough, so
            // it's only allowed up to a 15% scale drift, and only after a
            // ≤120ms stopgap mid-gesture to keep pinch fluid; after that the
            // layer re-renders at the exact zoom (scale returns to 1). Gating
            // on actual drift (not just "zoom changed at all") matters: a
            // slow, continuous wheel-zoom changes `cam.zoom` every frame, and
            // rebaking the whole terrain every 120ms regardless of how far it
            // had actually drifted made that gesture visibly stutter.
            if (!need && cam.zoom !== bg.zoom) {
                const drift = cam.zoom / bg.zoom;
                if ((drift < 0.85 || drift > 1.15) &&
                    performance.now() - bg.builtAt > 120) need = true;
            }
        }
        if (need) { renderBg(); place(); }
        R.ctx.drawImage(bg.cv, x0, y0, bg.w * scale, bg.h * scale);
    }

    function drawWorld(dt) {
        R.seaTime += dt;
        drawBg();     // mountains + land + grid + decor (cached)
        R.drawRiver();  // live: animated ripples

        // Distance fog: the far edge of the land dissolves into the sky.
        // Iso depth (world x+y) maps linearly to screen y, so a vertical
        // gradient between two constant-depth lines is a true depth fade —
        // from the far corner (depth 0) to ~35% of max depth.
        const corners = [S(0, 0), S(SC.worldW(), 0), S(SC.worldW(), SC.worldH()), S(0, SC.worldH())];
        const farY = corners[0].y;
        const midD = 0.175 * (SC.worldW() + SC.worldH()); // x=y point at 35% depth
        const nearY = S(midD, midD).y;
        if (nearY > farY) {
            R.ctx.save();
            R.ctx.beginPath();
            corners.forEach((p, i) => i ? R.ctx.lineTo(p.x, p.y) : R.ctx.moveTo(p.x, p.y));
            R.ctx.closePath();
            R.ctx.clip();
            const fog = R.ctx.createLinearGradient(0, farY, 0, nearY);
            fog.addColorStop(0, 'rgba(20, 29, 48, 0.85)');
            fog.addColorStop(0.5, 'rgba(20, 29, 48, 0.35)');
            fog.addColorStop(1, 'rgba(20, 29, 48, 0)');
            R.ctx.fillStyle = fog;
            R.ctx.fillRect(0, farY, R.canvas.width / R.dpr, nearY - farY);
            R.ctx.restore();
        }
    }

    function nodeIconAnchor(n) {
        const sp = R.nodeSpec(n);
        const g = S(n.x, n.y);
        return { x: g.x, y: g.y - sp.h * zoom() };
    }

    function frame(dt, now) {
        R.ctx.setTransform(R.dpr, 0, 0, R.dpr, 0, 0);
        R.ctx.clearRect(0, 0, R.canvas.width / R.dpr, R.canvas.height / R.dpr);

        R.frameHoverNode = (SC.state.mode === 'build' && !SC.state.placeMode &&
                          SC.input.getHoverNode) ? SC.input.getHoverNode() : null;

        R.updateDayWeather(dt);
        R.drawSky();
        R.drawSkyClouds(dt);   // overcast blobs, behind the world (peaks occlude)
        drawWorld(dt);       // mountains ride inside the cached bg layer
        R.drawCloudShadows(dt); // soft shadows sliding over the ground
        R.drawSnowBlanket();    // pale snow settling on the land
        R.drawRoads();
        R.drawWetRoads();       // rain sheen on the road surface
        R.drawRouteFlow();      // colored pulses along roads with live trucks
        R.drawHighlight(now);
        R.drawInspectHighlight(now);
        R.drawGhostRoad();
        R.drawPlacementGhost();

        // Depth-sorted buildings + trucks (back-to-front by world x+y). A
        // single-point painter's sort has no notion of footprint size, so a
        // truck on its final approach to a node (still slightly "behind" in
        // depth even once it visually overlaps the building's wide pad/
        // silhouette) can get hard-clipped by the node drawn on top of it —
        // most visible arriving at a factory or sitting at a lake supplier.
        // TRUCK_DEPTH_BIAS nudges trucks forward so they win that near-tie
        // and read as driving up TO the site rather than sinking under it.
        const TRUCK_DEPTH_BIAS = 30;
        R.updateTransfers(dt); // spawn/age loading-unloading crates
        const ents = [];
        for (const n of SC.state.nodes) if (n.active) ents.push({ kind: 'node', ref: n, depth: n.x + n.y });
        // Idle trucks (no route, no jobs) are parked in their home yard/HQ
        // apron by drawNodeBody, so skip them here to avoid a second sprite
        // stacked at the node centre.
        for (const t of SC.state.trucks) if (t.cargo !== undefined && (t.path || t.jobs.length > 0))
            ents.push({ kind: 'truck', ref: t, depth: t.x + t.y + TRUCK_DEPTH_BIAS });
        // crates ride just in front of the truck depth so a nearer site clips them
        for (const tr of R.transfers) ents.push({ kind: 'transfer', ref: tr, depth: tr.x + tr.y + TRUCK_DEPTH_BIAS + 1 });
        ents.sort((a, b) => a.depth - b.depth);

        // shadows first so no building casts onto another's face
        for (const e of ents) {
            if (e.kind === 'node') {
                const sp = R.nodeSpec(e.ref), p = S(e.ref.x, e.ref.y);
                R.drawShadow(p.x, p.y, sp.fw, (sp.h || 0) * zoom());
            }
        }
        for (const e of ents) {
            if (e.kind === 'node') R.drawNodeBody(e.ref, now);
            else if (e.kind === 'transfer') R.drawTransfer(e.ref);
            else R.drawTruckBody(e.ref);
        }

        R.drawFireflies();
        R.drawBursts(dt);          // delivery coin/spark bursts
        // The build ghost's pointing marks (✕, clearance/interchange rings,
        // labels) ride above the buildings — drawn down with the roads they'd
        // be painted over by the very site they point at. The dashed road
        // itself stays down there, where a road belongs.
        R.drawGhostMarks();
        R.drawOrderBubbles();
        R.drawFloaters(dt);
        R.drawGrade();             // time-of-day colour grade over world + sky
        R.drawPrecip(dt);          // rain/snow on top, left ungraded so it stays crisp
        // After the grade/precip so the dim isn't lifted back out by them, but
        // under the vignette/arrows so those still frame the shot.
        R.drawTutorialFocus(now);
        R.drawVignette();          // frame the scene…
        R.drawOffscreenArrows(now); // …but keep edge arrows crisp on top
    }

    return {
        attach, frame, resize, nodeIconAnchor,
        // Headless hook: force a long-lived loading/unloading crate at a world
        // point so the animation can be screenshotted (see &xfer=1 in main.js).
        _forceTransfer: (x, y, item, dir, dur) => R.transfers.push({ x, y, item, dir, life: 0, dur: dur || 1 })
    };
})();
