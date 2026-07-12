// render/night.js — Night Ops darkness overlay + lander spotlight.
// Level-config flag `night: true` (levelSchema.js). Pure rendering: darkens
// the scene, punches a soft radial glow + forward flashlight cone around the
// lander, plus a small fixed ambient glow around delivery hubs and hazards
// so the map isn't fully unreadable outside the lander's light.
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

        const NIGHT_DARKNESS = 'rgba(4, 7, 18, 0.86)';
        const NIGHT_LIGHT_RADIUS = 210;      // lander's soft radial glow, world px
        const NIGHT_CONE_LENGTH = 340;       // forward flashlight cone reach, world px
        const NIGHT_CONE_HALF_ANGLE = 0.42;  // radians (~24°) each side of nose
        const NIGHT_AMBIENT_RADIUS = 70;     // hub/hazard wayfinding glow, world px

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

        // Ambient wayfinding glow around delivery hubs — always faintly
        // visible so the map isn't reduced to "wander until you bump a hub".
        for (const hub of (this.physics.deliveryHubs || [])) {
            const p = toScreen(hub.x + hub.width / 2, hub.y);
            this._nightPunchGlow(nctx, p.x, p.y, NIGHT_AMBIENT_RADIUS * zoom, 0.55);
        }

        // Ambient glow around hazard centers (laser midpoint, zone/incinerator
        // centroid) — dimmer than hubs; a wayfinding aid, not a way to see
        // hazard danger extent (that's still the lander's own light's job).
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
            const p = toScreen(cx, cy);
            this._nightPunchGlow(nctx, p.x, p.y, NIGHT_AMBIENT_RADIUS * zoom, 0.45);
        }

        // Lander spotlight: soft radius (visibility while hovering/landed) +
        // a forward-facing cone oriented by lander.angle (matches the sprite's
        // own rotation convention — nose-up at angle 0, see drawLander()).
        const lp = toScreen(lander.x, lander.y);
        this._nightPunchGlow(nctx, lp.x, lp.y, NIGHT_LIGHT_RADIUS * zoom, 1);

        nctx.save();
        nctx.translate(lp.x, lp.y);
        nctx.rotate(lander.angle || 0);
        const coneLen = NIGHT_CONE_LENGTH * zoom;
        const coneGrad = nctx.createRadialGradient(0, 0, 0, 0, 0, coneLen);
        coneGrad.addColorStop(0, 'rgba(0,0,0,1)');
        coneGrad.addColorStop(1, 'rgba(0,0,0,0)');
        nctx.fillStyle = coneGrad;
        nctx.beginPath();
        nctx.moveTo(0, 0);
        nctx.arc(0, 0, coneLen, -Math.PI / 2 - NIGHT_CONE_HALF_ANGLE, -Math.PI / 2 + NIGHT_CONE_HALF_ANGLE);
        nctx.closePath();
        nctx.fill();
        nctx.restore();

        nctx.globalCompositeOperation = 'source-over';

        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.globalCompositeOperation = 'source-over';
        ctx.drawImage(this._nightCanvas, 0, 0);
        ctx.restore();
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
