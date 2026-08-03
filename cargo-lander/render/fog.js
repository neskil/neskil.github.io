// render/fog.js — altitude fog band ("dust ceiling").
//
// Level config (levelSchema.js, top-level scalars):
//   fogBandBottomY — world Y where the band starts fading in (larger Y = lower)
//   fogBandTopY    — world Y at/above which the band is at full density
//   fogBandColor   — bare "r,g,b" string; the renderer appends its own alpha
//   fogBandOpacity — alpha at full density (keep < 1 so silhouettes survive)
//   fogBandDamage  — hull points/sec at full density (physics side, atmosphere.js)
//
// Purpose: give an open-sky level a soft ceiling. Instead of a hard worldBounds
// wall that just deletes the player, altitude becomes a visibility trade —
// climb above the danger on the ground and you lose your eyes, which is only a
// problem because the same band is where the ambient traffic lanes live.
//
// Screen-space overlay, drawn from render.js right after drawNightOverlay() so
// it sits over the whole scene (terrain/entities/traffic/worm) but under the
// HUD-layer draws that follow (wind indicator, minimap, vignettes).
//
// Two things stay legible through the murk, both punched out with
// destination-out the same way night.js carves its spotlight:
//   • a soft bubble around the lander, so you can always see your own ship
//   • a small glow per ambient truck, reading as running lights diffusing
//     through the dust — the fair-warning cue that makes the lane survivable
//
// Density curve is owned by physics (CargoPhysics#fogDensityAt) so the visual
// and the hull abrasion can never disagree about where the band is.
Object.assign(CargoGame.prototype, {

drawAltitudeFog() {
        if (this.gameState !== 'playing') return;
        const cfg = this.physics?.currentLevelConfig;
        const lander = this.physics?.lander;
        if (!cfg || !lander) return;

        const topY = cfg.fogBandTopY;
        const botY = cfg.fogBandBottomY;
        if (topY == null || botY == null || botY <= topY) return;

        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;
        const zoom = this.camera.zoom;
        const camX = this.camera.x, camY = this.camera.y;
        const shakeX = this.screenShake?.x || 0, shakeY = this.screenShake?.y || 0;
        const toScreenY = (y) => (y - camY) * zoom + h / 2 + shakeY;
        const toScreenX = (x) => (x - camX) * zoom + w / 2 + shakeX;

        const sTop = toScreenY(topY);   // screen Y of the full-density edge
        const sBot = toScreenY(botY);   // screen Y of the clear edge
        if (sTop >= h) return;          // entire band sits below the viewport

        const rgb = cfg.fogBandColor || '198,150,86';
        const maxAlpha = cfg.fogBandOpacity ?? 0.94;

        // Offscreen layer: paint the fog, then punch the readable holes out of
        // it, so alpha only has to be authored once (same trick as night.js).
        if (!this._fogCanvas || this._fogCanvas.width !== w || this._fogCanvas.height !== h) {
            this._fogCanvas = document.createElement('canvas');
            this._fogCanvas.width = w;
            this._fogCanvas.height = h;
        }
        const fctx = this._fogCanvas.getContext('2d');
        fctx.clearRect(0, 0, w, h);
        fctx.globalCompositeOperation = 'source-over';

        if (sBot <= 0) {
            // Camera is entirely inside the full-density cap — flat fill.
            fctx.fillStyle = `rgba(${rgb},${maxAlpha})`;
            fctx.fillRect(0, 0, w, h);
        } else {
            // Solid cap above the band, then the smoothstep ramp through it.
            if (sTop > 0) {
                fctx.fillStyle = `rgba(${rgb},${maxAlpha})`;
                fctx.fillRect(0, 0, w, sTop);
            }
            const g = fctx.createLinearGradient(0, sTop, 0, sBot);
            const STOPS = 8;
            for (let i = 0; i <= STOPS; i++) {
                const p = i / STOPS;          // 0 at the band's top edge
                const t = 1 - p;              // density param: 1 up top, 0 down low
                const d = t * t * (3 - 2 * t); // smoothstep — matches fogDensityAt()
                g.addColorStop(p, `rgba(${rgb},${(maxAlpha * d).toFixed(4)})`);
            }
            const yStart = Math.max(0, sTop);
            const yEnd = Math.min(h, sBot);
            if (yEnd > yStart) {
                fctx.fillStyle = g;
                fctx.fillRect(0, yStart, w, yEnd - yStart);
            }
        }

        this._drawFogStreaks(fctx, cfg, rgb, maxAlpha, toScreenX, toScreenY, camX, w, h, zoom);

        // ── Punch the readable holes ────────────────────────────────────────
        fctx.globalCompositeOperation = 'destination-out';

        // Ambient traffic running lights bleeding through the dust. Deliberately
        // weak and wide: enough to register "something is there" a beat before
        // the hull does, not enough to make the lane safe.
        const TRUCK_GLOW_RADIUS = 92;   // world px
        for (const t of (this.physics.ambientTraffic || [])) {
            const d = this.physics.fogDensityAt(t.y);
            if (d < 0.05) continue;
            const sx = toScreenX(t.x + t.w / 2);
            const sy = toScreenY(t.y);
            if (sx < -220 || sx > w + 220 || sy < -220 || sy > h + 220) continue;
            this._fogPunch(fctx, sx, sy, TRUCK_GLOW_RADIUS * zoom, 0.34);
        }

        // The lander's own bubble — never fully clear, so the murk still reads
        // as murk while you can always find your own ship in it.
        const LANDER_BUBBLE_RADIUS = 230; // world px
        const lp = { x: toScreenX(lander.x), y: toScreenY(lander.y) };
        this._fogPunch(fctx, lp.x, lp.y, LANDER_BUBBLE_RADIUS * zoom, 0.92);

        fctx.globalCompositeOperation = 'source-over';

        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.globalCompositeOperation = 'source-over';
        ctx.drawImage(this._fogCanvas, 0, 0);
        ctx.restore();

        this._drawFogWarning(cfg, rgb, w);
    },

// Wind-blown grit inside the band. World-anchored (so it parallaxes with the
// terrain instead of sliding with the camera) and wrapped around the camera's
// horizontal span, which keeps the pool at a fixed small size no matter how far
// the level runs. Y is fixed per streak so each one keeps a stable density.
_drawFogStreaks(fctx, cfg, rgb, maxAlpha, toScreenX, toScreenY, camX, w, h, zoom) {
        const topY = cfg.fogBandTopY;
        const botY = cfg.fogBandBottomY;
        const COUNT = 90;
        if (!this._fogStreaks || this._fogStreaks.length !== COUNT) {
            this._fogStreaks = [];
            for (let i = 0; i < COUNT; i++) {
                this._fogStreaks.push({
                    x: Math.random() * 4000,
                    // Bias toward the dense top of the band where the streaks read best
                    y: topY + Math.pow(Math.random(), 0.7) * (botY - topY),
                    len: 60 + Math.random() * 190,
                    vx: 0.6 + Math.random() * 2.2,
                    a: 0.25 + Math.random() * 0.5,
                });
            }
        }

        // Drift direction follows the level's wind so the storm and the wind
        // meter tell the same story; falls back to a steady rightward blow.
        const wind = this.physics.currentWind ?? (cfg.wind || 0);
        const dir = wind < 0 ? -1 : 1;
        const gust = 1 + Math.min(2.5, Math.abs(wind) * 40);
        const t = Date.now() * 0.001;

        const spanX = w / zoom + 600;
        const originX = camX - spanX / 2;

        fctx.save();
        fctx.lineCap = 'round';
        for (const s of this._fogStreaks) {
            const d = this.physics.fogDensityAt(s.y);
            if (d < 0.08) continue;
            // Wrap into the camera's horizontal span
            let wx = s.x + t * s.vx * 60 * gust * dir;
            wx = originX + (((wx - originX) % spanX) + spanX) % spanX;
            const sx = toScreenX(wx);
            const sy = toScreenY(s.y);
            if (sy < -60 || sy > h + 60) continue;
            const len = s.len * zoom * gust;
            fctx.strokeStyle = `rgba(${rgb},${(s.a * d * maxAlpha * 0.5).toFixed(4)})`;
            fctx.lineWidth = Math.max(1, 2.4 * zoom);
            fctx.beginPath();
            fctx.moveTo(sx, sy);
            fctx.lineTo(sx - len * dir, sy + len * 0.06);
            fctx.stroke();
        }
        fctx.restore();
    },

// Tells the player why their hull is ticking down — the abrasion is otherwise a
// silent drain, and "the fog is the hazard" needs saying once, not guessing.
_drawFogWarning(cfg, rgb, w) {
        const d = this.physics.fogDensity || 0;
        if (d < 0.3) return;
        const ctx = this.ctx;
        const pulse = 0.65 + 0.35 * Math.sin(Date.now() * 0.006);
        const alpha = Math.min(1, (d - 0.3) / 0.35) * pulse;
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.font = 'bold 15px Outfit, sans-serif';
        ctx.textAlign = 'center';
        ctx.globalAlpha = alpha;
        ctx.shadowColor = '#000';
        ctx.shadowBlur = 6;
        ctx.fillStyle = (cfg.fogBandDamage || 0) > 0 ? '#fca5a5' : `rgb(${rgb})`;
        const label = (cfg.fogBandDamage || 0) > 0
            ? '⚠ DUST STORM — HULL ABRASION'
            : '⚠ DUST STORM — VISIBILITY ZERO';
        // Below the speed pill — the top HUD band owns everything above ~130px.
        ctx.fillText(label, w / 2, 152);
        ctx.restore();
    },

_fogPunch(fctx, x, y, radius, strength) {
        if (radius <= 0) return;
        const g = fctx.createRadialGradient(x, y, 0, x, y, radius);
        g.addColorStop(0, `rgba(0,0,0,${strength})`);
        g.addColorStop(0.55, `rgba(0,0,0,${strength * 0.55})`);
        g.addColorStop(1, 'rgba(0,0,0,0)');
        fctx.fillStyle = g;
        fctx.beginPath();
        fctx.arc(x, y, radius, 0, Math.PI * 2);
        fctx.fill();
    },

});
