// render/night.js — Night Ops darkness overlay + lander spotlight + sonar ping.
// Level-config flag `night: true` (levelSchema.js). Pure rendering: darkens
// the scene, punches a tight glow around the lander plus a narrow beam aimed
// at the next objective, and sweeps a periodic sonar ping outward from the
// lander that briefly reveals terrain silhouettes and lights up hazards as
// the wavefront passes them. Hubs keep a faint constant glow for wayfinding.
Object.assign(CargoGame.prototype, {

drawNightOverlay() {
        const level = levels[this.currentLevelIndex];
        if (!level || !level.night || this.gameState !== 'playing') return;
        const lander = this.physics.lander;
        if (!lander) return;

        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;

        // Offscreen layer: fill dark, then punch holes with destination-out
        // so the darkness color/alpha only has to be authored once.
        if (!this._nightCanvas || this._nightCanvas.width !== w || this._nightCanvas.height !== h) {
            this._nightCanvas = document.createElement('canvas');
            this._nightCanvas.width = w;
            this._nightCanvas.height = h;
        }
        const nctx = this._nightCanvas.getContext('2d');
        nctx.clearRect(0, 0, w, h);

        const NIGHT_DARKNESS = 'rgba(3, 5, 14, 0.90)';
        const NIGHT_LIGHT_RADIUS = 120;      // tight glow around the lander, world px
        const NIGHT_BEAM_LENGTH = 460;       // objective-pointing beam reach, world px
        const NIGHT_BEAM_HALF_ANGLE = 0.16;  // radians (~9°) each side — a narrow searchlight
        const NIGHT_HUB_GLOW_RADIUS = 60;    // constant hub wayfinding glow, world px
        const PING_PERIOD_MS = 5200;         // time between sonar pings
        const PING_TRAVEL_MS = 2400;         // how long the wavefront expands
        const PING_MAX_RADIUS = 1500;        // wavefront reach at end of travel, world px
        const PING_BAND = 90;                // wavefront ring thickness, world px
        const PING_REVEAL_DIST = 140;        // hazard lights up when wavefront is this close

        nctx.globalCompositeOperation = 'source-over';
        nctx.fillStyle = NIGHT_DARKNESS;
        nctx.fillRect(0, 0, w, h);

        const zoom = this.camera.zoom;
        const camX = this.camera.x, camY = this.camera.y;
        const shakeX = this.screenShake?.x || 0, shakeY = this.screenShake?.y || 0;
        const toScreen = (x, y) => ({
            x: (x - camX) * zoom + w / 2 + shakeX,
            y: (y - camY) * zoom + h / 2 + shakeY,
        });

        nctx.globalCompositeOperation = 'destination-out';

        // ── Sonar ping — expanding annulus punched out of the darkness ──────
        const now = Date.now();
        const pingT = (now % PING_PERIOD_MS) / PING_TRAVEL_MS; // 0→1 while travelling, >1 while idle
        let ringR = -1;
        if (pingT <= 1) {
            ringR = pingT * PING_MAX_RADIUS;
            const fade = Math.pow(1 - pingT, 1.2) * 0.55; // strong near the lander, dies out
            if (fade > 0.02 && ringR > 1) {
                const lp0 = toScreen(lander.x, lander.y);
                const rInner = Math.max(0, (ringR - PING_BAND) * zoom);
                const rOuter = (ringR + PING_BAND * 0.4) * zoom;
                const ringGrad = nctx.createRadialGradient(lp0.x, lp0.y, rInner, lp0.x, lp0.y, rOuter);
                ringGrad.addColorStop(0, 'rgba(0,0,0,0)');
                ringGrad.addColorStop(0.7, `rgba(0,0,0,${fade})`);
                ringGrad.addColorStop(1, 'rgba(0,0,0,0)');
                nctx.fillStyle = ringGrad;
                nctx.beginPath();
                nctx.arc(lp0.x, lp0.y, rOuter, 0, Math.PI * 2);
                nctx.fill();
            }
        }

        // ── Constant faint glow on delivery hubs (wayfinding) ───────────────
        for (const hub of (this.physics.deliveryHubs || [])) {
            const p = toScreen(hub.x + hub.width / 2, hub.y);
            this._nightPunchGlow(nctx, p.x, p.y, NIGHT_HUB_GLOW_RADIUS * zoom, 0.45);
        }

        // ── Hazards light up as the ping wavefront passes them ──────────────
        for (const hz of (this.physics.hazards || [])) {
            if (!hz.pts || hz.pts.length < 2) continue;
            let cx, cy;
            if (hz.pts.length === 2) {
                cx = (hz.pts[0].x + hz.pts[1].x) / 2;
                cy = (hz.pts[0].y + hz.pts[1].y) / 2;
            } else {
                const c = this.physics.polygonCentroid(hz.pts);
                cx = c.x; cy = c.y;
            }
            if (ringR < 0) continue;
            const distFromLander = Math.hypot(cx - lander.x, cy - lander.y);
            const waveDelta = Math.abs(distFromLander - ringR);
            if (waveDelta > PING_REVEAL_DIST) continue;
            const strength = (1 - waveDelta / PING_REVEAL_DIST) * 0.8;
            const p = toScreen(cx, cy);
            this._nightPunchGlow(nctx, p.x, p.y, 110 * zoom, strength);
        }

        // ── Lander: tight glow + narrow beam aimed at the next objective ────
        const lp = toScreen(lander.x, lander.y);
        this._nightPunchGlow(nctx, lp.x, lp.y, NIGHT_LIGHT_RADIUS * zoom, 1);

        const target = this._nightObjectiveTarget();
        if (target) {
            const beamAngle = Math.atan2(target.y - lander.y, target.x - lander.x);
            const beamLen = NIGHT_BEAM_LENGTH * zoom;
            nctx.save();
            nctx.translate(lp.x, lp.y);
            nctx.rotate(beamAngle);
            const beamGrad = nctx.createRadialGradient(0, 0, 0, 0, 0, beamLen);
            beamGrad.addColorStop(0, 'rgba(0,0,0,0.95)');
            beamGrad.addColorStop(1, 'rgba(0,0,0,0)');
            nctx.fillStyle = beamGrad;
            nctx.beginPath();
            nctx.moveTo(0, 0);
            nctx.arc(0, 0, beamLen, -NIGHT_BEAM_HALF_ANGLE, NIGHT_BEAM_HALF_ANGLE);
            nctx.closePath();
            nctx.fill();
            nctx.restore();
        }

        nctx.globalCompositeOperation = 'source-over';

        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.globalCompositeOperation = 'source-over';
        ctx.drawImage(this._nightCanvas, 0, 0);
        ctx.restore();
    },

// Mirrors the target-selection logic of drawNextObjectiveArrow (render/ui.js):
// all delivered → HQ start depot; nothing on deck → collection point;
// otherwise the hub matching the first on-deck box.
_nightObjectiveTarget() {
        const level = levels[this.currentLevelIndex];
        if (!level) return null;
        const allDelivered = this.deliveredCount >= (level.targetCargo || 2);
        if (allDelivered) {
            const startPad = this.physics.startDepot;
            if (startPad) return { x: startPad.x + startPad.width / 2, y: startPad.y };
            return null;
        }
        const cargoOnDeck = this.physics.boxes.filter(b => b.onDeck);
        if (cargoOnDeck.length === 0) {
            const collection = this.physics.collectionPoint;
            if (collection) return { x: collection.x + collection.width / 2, y: collection.y };
            return null;
        }
        const hub = this.physics.deliveryHubs.find(h => h.type === cargoOnDeck[0].type);
        if (hub) return { x: hub.x + hub.width / 2, y: hub.y };
        return null;
    },

_nightPunchGlow(nctx, x, y, radius, strength) {
        if (radius <= 0) return;
        const g = nctx.createRadialGradient(x, y, 0, x, y, radius);
        g.addColorStop(0, `rgba(0,0,0,${strength})`);
        g.addColorStop(1, 'rgba(0,0,0,0)');
        nctx.fillStyle = g;
        nctx.beginPath();
        nctx.arc(x, y, radius, 0, Math.PI * 2);
        nctx.fill();
    },

});
