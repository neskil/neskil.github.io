Object.assign(CargoGame.prototype, {
updateWeather(dt) {
        const hasWeather = this.weather && this.weather !== 'none' && this.weather !== 'fog';
        const wind = this.physics?.currentWind || 0;
        const hasWind = Math.abs(wind) > 0.05;

        if (!hasWeather && !hasWind) return;
        if (!this.weatherParticles) this.weatherParticles = [];
        if (!this.windStreaks) this.windStreaks = [];

        const vw = this.canvas.width / this.camera.zoom;
        const vh = this.canvas.height / this.camera.zoom;
        const camX = this.camera.x;
        const camY = this.camera.y;

        // Hard caps so a runaway camera zoom/wind spike can't let these arrays grow
        // unbounded — this was the main real perf cost, not physics simulation
        // (neither array has ever touched Matter.js; both are plain array updates).
        const MAX_WEATHER_PARTICLES = 120;
        const MAX_WIND_STREAKS = 70;

        // ── Regular weather particles ──────────────────────────────────────
        if (hasWeather && this.weatherParticles.length < MAX_WEATHER_PARTICLES && Math.random() < 0.8) {
            this.weatherParticles.push({
                x: camX + (Math.random() - 0.5) * vw * 1.5,
                y: camY - vh * 0.6,
                vx: this.weather === 'snow' ? (Math.random() - 0.5) * 2 : (this.weather === 'rain' ? Math.random() * 1.5 + 0.5 : (Math.random() - 0.5) * 3),
                vy: this.weather === 'snow' ? Math.random() * 2 + 1 : (this.weather === 'rain' ? Math.random() * 8 + 8 : Math.random() * 2 + 1),
                size: this.weather === 'snow' ? Math.random() * 3 + 1 : (this.weather === 'rain' ? Math.random() * 1.5 + 0.5 : Math.random() * 4 + 2),
                type: this.weather
            });
        }

        // ── Wind streak particles (spawned from the upwind edge) ───────────
        if (hasWind) {
            const windAbs = Math.abs(wind);
            // Capped lower and spread over a wider band than before — the narrow spawn
            // zone let low/sustained wind (e.g. Level 3) pile up into a solid pale smear
            // near the upwind screen edge instead of reading as individual streaks.
            const spawnRate = Math.min(0.6, windAbs * 3.0);
            if (this.windStreaks.length < MAX_WIND_STREAKS && Math.random() < spawnRate) {
                const dir = wind > 0 ? -1 : 1; // spawn on the side wind blows FROM
                this.windStreaks.push({
                    x: camX + dir * vw * 0.55 + (Math.random() - 0.5) * vw * 0.35,
                    y: camY + (Math.random() - 0.5) * vh,
                    vx: wind * (18 + Math.random() * 14),
                    vy: (Math.random() - 0.5) * 1.5,
                    len: 20 + windAbs * 60 + Math.random() * 40,
                    alpha: 0.08 + Math.random() * 0.14,
                    life: 1.0
                });
            }
        }

        // Gravity well (Anomaly Zone) pulls ash/snow into it as it drifts by, tying
        // the weather system into the level's centerpiece hazard instead of the two
        // looking unrelated.
        const well = this.physics?.gravityWellPos;

        // ── Update regular weather particles ──────────────────────────────
        for (let i = this.weatherParticles.length - 1; i >= 0; i--) {
            const p = this.weatherParticles[i];
            // Apply wind drift to existing weather particles
            p.vx += wind * 0.08 * dt;
            if (well) {
                const dx = well.x - p.x, dy = well.y - p.y;
                const d = Math.hypot(dx, dy);
                if (d < well.radius * 1.4 && d > 4) {
                    const pull = (well.strength * 3.5) * (1 - d / (well.radius * 1.4));
                    p.vx += (dx / d) * pull * dt;
                    p.vy += (dy / d) * pull * dt;
                }
            }
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            if (p.type === 'snow' || p.type === 'ash') {
                p.x += Math.sin(Date.now() * 0.002 + p.y) * 0.5 * dt;
            }
            const sucked = well && Math.hypot(well.x - p.x, well.y - p.y) < 20;
            if (sucked || p.y > camY + vh * 0.6 || p.x < camX - vw || p.x > camX + vw) {
                this.weatherParticles.splice(i, 1);
            }
        }

        // ── Update wind streaks ───────────────────────────────────────────
        for (let i = this.windStreaks.length - 1; i >= 0; i--) {
            const s = this.windStreaks[i];
            s.x += s.vx * dt;
            s.y += s.vy * dt;
            s.life -= 0.008 * dt;
            if (s.life <= 0 || s.x < camX - vw || s.x > camX + vw) {
                this.windStreaks.splice(i, 1);
            }
        }
    }

,
drawWeather() {
        const hasWeather = this.weather && this.weather !== 'none' && this.weather !== 'fog';
        const hasWind = Math.abs(this.physics?.currentWind || 0) > 0.05;
        if (!hasWeather && !hasWind) return;
        if (!this.weatherParticles && !this.windStreaks) return;

        const ctx = this.ctx;
        ctx.save();
        ctx.translate(this.canvas.width / 2 + (this.screenShake?.x || 0), this.canvas.height / 2 + (this.screenShake?.y || 0));
        ctx.scale(this.camera.zoom, this.camera.zoom);
        ctx.translate(-this.camera.x, -this.camera.y);

        // ── Wind streaks ────────────────────────────────────────────────────
        if (this.windStreaks?.length > 0) {
            const wind = this.physics?.currentWind || 0;
            // color shifts blue→cyan as strength increases, capped short of white so
            // it doesn't read as a pale tint wash at low/sustained wind
            const windStr = Math.min(1, Math.abs(wind) / 0.5);
            const r = Math.round(110 + windStr * 70);
            const g = Math.round(180 + windStr * 45);
            const b = Math.round(230 + windStr * 25);
            for (const s of this.windStreaks) {
                const alpha = s.alpha * s.life;
                ctx.strokeStyle = `rgba(${r},${g},${b},${alpha})`;
                ctx.lineWidth = 0.8 + windStr * 1.2;
                ctx.lineCap = 'round';
                ctx.beginPath();
                const dx = (s.vx / Math.abs(s.vx || 1)) * s.len;
                ctx.moveTo(s.x, s.y);
                ctx.lineTo(s.x - dx * 0.6, s.y - s.vy * 4);
                ctx.stroke();
            }
        }

        if (!hasWeather || !this.weatherParticles?.length) {
            ctx.restore();
            return;
        }

        // ── Regular weather particles ───────────────────────────────────────
        if (this.weather === 'snow') {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        } else if (this.weather === 'rain') {
            ctx.fillStyle = 'rgba(150, 200, 255, 0.4)';
        } else if (this.weather === 'ash') {
            ctx.fillStyle = 'rgba(100, 100, 100, 0.6)';
        } else if (this.weather === 'bubbles') {
            ctx.strokeStyle = 'rgba(200, 255, 255, 0.5)';
            ctx.lineWidth = 1;
        }

        ctx.beginPath();
        for (const p of this.weatherParticles) {
            if (p.type === 'bubbles') {
                ctx.moveTo(p.x + p.size, p.y);
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            } else if (p.type === 'rain') {
                ctx.moveTo(p.x, p.y);
                ctx.lineTo(p.x - p.vx * 2, p.y - p.vy * 2);
            } else {
                ctx.moveTo(p.x + p.size, p.y);
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            }
        }
        
        if (this.weather === 'rain') {
            ctx.strokeStyle = ctx.fillStyle;
            ctx.lineWidth = 1.5;
            ctx.stroke();
        } else if (this.weather === 'bubbles') {
            ctx.stroke();
        } else {
            ctx.fill();
        }
        
        ctx.restore();
    }

,
drawMenuBackgroundEntity() {
        if (!this.menuEntities) {
            this.menuEntities = [
                { x: -100, y: this.canvas.height / 3, vx: 3, type: 'lander', scale: 1.0, offset: 0 },
                { x: this.canvas.width + 200, y: this.canvas.height / 5, vx: -1.5, type: 'drone', scale: 0.6, offset: 1000 },
                { x: -400, y: this.canvas.height / 1.5, vx: 4, type: 'lander', scale: 1.2, offset: 2000 }
            ];
        }

        const ctx = this.ctx;

        // Draw some glowing nebulas for the menu
        const time = Date.now() * 0.0005;
        const grad1 = ctx.createRadialGradient(this.canvas.width * 0.2, this.canvas.height * 0.3, 0, this.canvas.width * 0.2, this.canvas.height * 0.3, 400);
        grad1.addColorStop(0, 'rgba(99, 102, 241, 0.15)');
        grad1.addColorStop(1, 'rgba(99, 102, 241, 0)');
        ctx.fillStyle = grad1;
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        const grad2 = ctx.createRadialGradient(this.canvas.width * 0.8, this.canvas.height * 0.7, 0, this.canvas.width * 0.8, this.canvas.height * 0.7, 500);
        grad2.addColorStop(0, 'rgba(236, 72, 153, 0.1)');
        grad2.addColorStop(1, 'rgba(236, 72, 153, 0)');
        ctx.fillStyle = grad2;
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Rare menu monster drive-by (only after 20s on menu, then every 45-90s)
        if (!this.menuOpenTime) this.menuOpenTime = Date.now();
        if (!this.menuMonster) this.menuMonster = null;
        if (!this.nextMenuMonsterTime) this.nextMenuMonsterTime = Date.now() + 20000 + Math.random() * 30000;

        const now2 = Date.now();
        if (!this.menuMonster && now2 > this.nextMenuMonsterTime) {
            const fromLeft = Math.random() > 0.5;
            this.menuMonster = {
                x: fromLeft ? -120 : this.canvas.width + 120,
                y: this.canvas.height * (0.3 + Math.random() * 0.5),
                vx: fromLeft ? 1.8 : -1.8,
                size: 60 + Math.random() * 40,
                t: 0,
            };
        }

        if (this.menuMonster) {
            const mm = this.menuMonster;
            mm.x += mm.vx;
            mm.t += 0.04;

            // Draw simplified monster silhouette
            const t3 = Date.now() / 1000;
            ctx.save();
            ctx.globalAlpha = Math.min(1, Math.min(mm.t * 2, (1 - (Math.abs(mm.x - this.canvas.width / 2) / (this.canvas.width / 2 + 100))) * 3 + 0.1));

            // Body glow
            const mg = ctx.createRadialGradient(mm.x, mm.y, 0, mm.x, mm.y, mm.size);
            mg.addColorStop(0, 'rgba(180,0,0,0.4)');
            mg.addColorStop(0.5, 'rgba(100,0,0,0.2)');
            mg.addColorStop(1, 'rgba(60,0,0,0)');
            ctx.fillStyle = mg;
            ctx.beginPath();
            ctx.ellipse(mm.x, mm.y, mm.size * 1.2, mm.size * 0.7, 0, 0, Math.PI * 2);
            ctx.fill();

            // Monster eyes
            for (const ex of [-mm.size * 0.2, mm.size * 0.2]) {
                const eyePulse = 0.7 + Math.sin(t3 * 4 + ex) * 0.3;
                ctx.fillStyle = `rgba(255,50,0,${eyePulse})`;
                ctx.beginPath();
                ctx.ellipse(mm.x + ex, mm.y - mm.size * 0.15, mm.size * 0.08, mm.size * 0.12, 0, 0, Math.PI * 2);
                ctx.fill();
            }

            // Tentacles
            for (let ti = 0; ti < 5; ti++) {
                const ta = (ti / 4 - 0.5) * Math.PI * 0.9;
                const tx = mm.x + Math.sin(ta) * mm.size * 0.7;
                const ty = mm.y + mm.size * 0.4 + Math.cos(t3 * 2 + ti) * 12;
                ctx.strokeStyle = `rgba(120,0,0,0.6)`;
                ctx.lineWidth = 3 + (4 - ti) * 0.5;
                ctx.lineCap = 'round';
                ctx.beginPath();
                ctx.moveTo(mm.x, mm.y + mm.size * 0.2);
                ctx.quadraticCurveTo(
                    mm.x + Math.sin(ta * 0.5) * mm.size * 0.4, mm.y + mm.size * 0.6 + Math.sin(t3 + ti) * 20,
                    tx, ty + 30
                );
                ctx.stroke();
                ctx.lineCap = 'butt';
            }

            ctx.restore();

            // Remove when off screen
            if ((mm.vx > 0 && mm.x > this.canvas.width + 150) || (mm.vx < 0 && mm.x < -150)) {
                this.menuMonster = null;
                this.nextMenuMonsterTime = Date.now() + 45000 + Math.random() * 45000;
            }
        }

        for (const e of this.menuEntities) {
            e.x += e.vx;
            e.y += Math.sin((Date.now() + e.offset) / 500) * (1.5 * e.scale);

            if (e.vx > 0 && e.x > this.canvas.width + 200) {
                e.x = -200;
                e.y = this.canvas.height * 0.1 + Math.random() * (this.canvas.height * 0.8);
                e.type = ['lander', 'drone'][Math.floor(Math.random() * 2)];
                e.vx = 2 + Math.random() * 3;
                e.scale = 0.6 + Math.random() * 0.8;
            } else if (e.vx < 0 && e.x < -200) {
                e.x = this.canvas.width + 200;
                e.y = this.canvas.height * 0.1 + Math.random() * (this.canvas.height * 0.8);
                e.type = ['lander', 'drone'][Math.floor(Math.random() * 2)];
                e.vx = -(2 + Math.random() * 3);
                e.scale = 0.6 + Math.random() * 0.8;
            }

            ctx.save();
            // Scale and draw
            ctx.translate(e.x, e.y);
            ctx.scale(e.scale, e.scale);
            ctx.translate(-e.x, -e.y);

            // Mock lander for the draw method
            const tempLander = this.physics.lander;
            this.physics.lander = {
                x: e.x, y: e.y, angle: e.vx > 0 ? 0.2 : -0.2,
                vehicleType: e.type,
                thrusting: true, fuel: 100, strafePower: 0,
                width: e.type === 'drone' ? 32 : 40,
                height: e.type === 'drone' ? 16 : 28,
                deckWidth: 42, deckOffset: 12, basketHeight: 20,
                magneticDeckActive: false
            };

            this.drawLander();

            this.physics.lander = tempLander; // Restore

            ctx.restore();
        }
    }

,
drawParallax() {
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;
        const lvPal = (levels[this.currentLevelIndex] || {}).palette;
        const skyBot = lvPal ? lvPal.skyBot : '#0f172a';

        const hexToRgb = (hex) => {
            const r = parseInt(hex.slice(1, 3), 16);
            const g = parseInt(hex.slice(3, 5), 16);
            const b = parseInt(hex.slice(5, 7), 16);
            return [r, g, b];
        };
        const [sr, sg, sb] = hexToRgb(skyBot.length === 7 ? skyBot : '#0f172a');

        const layers = [
            { factor: 0.12, freq: 0.0018, freq2: 0.0031, seed: 1.7, seed2: 4.2, yMin: 0.15, yMax: 0.55, alpha: 0.55, darken: 0.45 },
            { factor: 0.28, freq: 0.0027, freq2: 0.0049, seed: 7.3, seed2: 2.9, yMin: 0.25, yMax: 0.60, alpha: 0.50, darken: 0.60 },
            { factor: 0.45, freq: 0.0042, freq2: 0.0071, seed: 3.1, seed2: 8.6, yMin: 0.35, yMax: 0.62, alpha: 0.45, darken: 0.75 },
        ];

        const camX = this.camera ? this.camera.x : 0;
        const camY = this.camera ? this.camera.y : 0;
        const zoom = this.camera ? this.camera.zoom : 1;

        // Draw parallax background layers
        for (const layer of layers) {
            const dr = Math.round(sr * layer.darken);
            const dg = Math.round(sg * layer.darken);
            const db = Math.round(sb * layer.darken);

            ctx.beginPath();
            ctx.moveTo(0, h);

            for (let sx = 0; sx <= w + 4; sx += 4) {
                // Convert screen X to world X, apply parallax factor
                const worldX = camX * layer.factor + (sx - w / 2) / zoom;

                const n1 = Math.sin(worldX * layer.freq + layer.seed);
                const n2 = Math.sin(worldX * layer.freq2 + layer.seed2);
                const n3 = Math.sin(worldX * layer.freq * 2.3 + layer.seed + 1.1);
                const t = (n1 * 0.5 + n2 * 0.3 + n3 * 0.2) * 0.5 + 0.5;

                // Base Y for this layer in world coordinates
                const levelH = this.physics.levelHeight || 2000;
                const baseYWorld = levelH * layer.yMin;
                const amplitudeWorld = levelH * (layer.yMax - layer.yMin);
                const layerYWorld = baseYWorld + t * amplitudeWorld;

                // Apply vertical parallax based on camera Y
                let parallaxYWorld = layerYWorld - (camY - levelH / 2) * (layer.factor * 0.3);

                // Never let the hill silhouette draw above the topmost terrain
                // vertex (with a margin) — otherwise floating/elevated terrain
                // (e.g. a floating island) shows this jagged band through its
                // gaps instead of open sky.
                const terrainTopY = this.physics.terrainTopY || 0;
                parallaxYWorld = Math.max(parallaxYWorld, terrainTopY + 80);

                // Convert back to screen space for drawing
                const screenY = h / 2 + (parallaxYWorld - camY) * zoom;

                ctx.lineTo(sx, screenY);
            }

            ctx.lineTo(w, h);
            ctx.closePath();
            ctx.fillStyle = `rgba(${dr},${dg},${db},${layer.alpha})`;
            ctx.fill();
        }
    }

,
drawAmbientTraffic() {
        const traffic = this.physics.ambientTraffic;
        if (!traffic || traffic.length === 0) return;
        const ctx = this.ctx;

        for (const t of traffic) {
            const cx = t.x + t.w / 2;
            const cy = t.y;
            const tw = t.w, th = t.h;
            const movingLeft = t.vx < 0;

            ctx.save();
            ctx.translate(cx, cy);
            if (t.angle) ctx.rotate(t.angle);
            if (movingLeft) ctx.scale(-1, 1);

            if (t.model === 'pickup') {
                this._drawPickupTruck(ctx, t, tw, th);
            } else if (t.model === 'police') {
                this._drawPoliceCruiser(ctx, t, tw, th);
            } else {
                this._drawFreighterTruck(ctx, t, tw, th);
            }
            ctx.restore();
            
            // Draw speech bubble if active
            if (t.bubbleTimer > 0) {
                t.bubbleTimer--;
                ctx.save();
                ctx.font = 'bold 10px Outfit, sans-serif';
                ctx.textAlign = 'center';
                const padding = 6;
                const textWidth = ctx.measureText(t.bubbleText).width;
                const bw = textWidth + padding * 2;
                const bh = 18;
                const bx = cx;
                const by = cy - th / 2 - 20;

                ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
                ctx.strokeStyle = '#38bdf8';
                ctx.lineWidth = 1;
                ctx.beginPath();
                if (ctx.roundRect) ctx.roundRect(bx - bw / 2, by - bh, bw, bh, 4);
                else ctx.rect(bx - bw / 2, by - bh, bw, bh);
                
                // Bubble tail
                ctx.moveTo(bx - 4, by);
                ctx.lineTo(bx + 4, by);
                ctx.lineTo(bx, by + 6);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();

                ctx.fillStyle = '#0f172a';
                ctx.fillText(t.bubbleText, bx, by - bh / 2 + 3);
                ctx.restore();
            }
        }
    }

,
_drawPoliceCruiser(ctx, t, tw, th) {
        // Police cruiser - sleek profile
        const h = th;
        const w = tw;

        // Main body (dark/white theme)
        ctx.fillStyle = '#0f172a'; // dark navy
        ctx.beginPath();
        ctx.moveTo(-w/2, 0);
        ctx.lineTo(-w*0.4, -h*0.3);
        ctx.lineTo(w*0.2, -h*0.3);
        ctx.lineTo(w*0.4, 0);
        ctx.lineTo(w/2, h/2);
        ctx.lineTo(-w/2, h/2);
        ctx.closePath();
        ctx.fill();

        // White door panel
        ctx.fillStyle = '#f8fafc';
        ctx.beginPath();
        ctx.moveTo(-w*0.2, 0);
        ctx.lineTo(w*0.2, 0);
        ctx.lineTo(w*0.25, h*0.4);
        ctx.lineTo(-w*0.25, h*0.4);
        ctx.closePath();
        ctx.fill();
        
        // Police text (tiny)
        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 8px monospace';
        ctx.fillText('POLICE', 0, h*0.3);

        // Cockpit canopy
        ctx.fillStyle = 'rgba(56, 189, 248, 0.5)'; // glass
        ctx.beginPath();
        ctx.moveTo(-w*0.1, -h*0.3);
        ctx.lineTo(w*0.1, -h*0.3);
        ctx.lineTo(w*0.3, 0);
        ctx.lineTo(-w*0.3, 0);
        ctx.closePath();
        ctx.fill();

        // Flashing sirens!
        const time = Date.now() / 150; // fast flash
        const flashPhase = time % 2;
        const redFlash = flashPhase < 1;
        const blueFlash = !redFlash;

        // Lightbar
        ctx.fillStyle = redFlash ? '#ef4444' : '#1e3a8a';
        ctx.fillRect(-w*0.05, -h*0.4, w*0.05, h*0.1);
        ctx.fillStyle = blueFlash ? '#3b82f6' : '#7f1d1d';
        ctx.fillRect(0, -h*0.4, w*0.05, h*0.1);

        // Siren glow
        if (redFlash) {
            const glow = ctx.createRadialGradient(-w*0.025, -h*0.35, 0, -w*0.025, -h*0.35, 25);
            glow.addColorStop(0, 'rgba(239, 68, 68, 0.8)');
            glow.addColorStop(1, 'transparent');
            ctx.fillStyle = glow;
            ctx.beginPath(); ctx.arc(-w*0.025, -h*0.35, 25, 0, Math.PI*2); ctx.fill();
        } else {
            const glow = ctx.createRadialGradient(w*0.025, -h*0.35, 0, w*0.025, -h*0.35, 25);
            glow.addColorStop(0, 'rgba(59, 130, 246, 0.8)');
            glow.addColorStop(1, 'transparent');
            ctx.fillStyle = glow;
            ctx.beginPath(); ctx.arc(w*0.025, -h*0.35, 25, 0, Math.PI*2); ctx.fill();
        }

        // Engine thrust (rear)
        ctx.fillStyle = '#64748b';
        ctx.fillRect(-w/2 - 6, h*0.1, 6, h*0.3);
        
        const fl = 10 + Math.abs(Math.sin(t.lightPhase * 5)) * 10;
        const eg = ctx.createLinearGradient(-w/2 - 6, 0, -w/2 - 6 - fl, 0);
        eg.addColorStop(0, 'rgba(59, 130, 246, 0.9)');
        eg.addColorStop(1, 'transparent');
        ctx.fillStyle = eg;
        ctx.beginPath();
        ctx.moveTo(-w/2 - 6, h*0.1);
        ctx.lineTo(-w/2 - 6 - fl, h*0.25);
        ctx.lineTo(-w/2 - 6, h*0.4);
        ctx.fill();
    }

,
_drawFreighterTruck(ctx, t, tw, th) {
        // Engine glow trail
        if (t.engineGlow) {
            const eg = ctx.createRadialGradient(-tw / 2 - 10, 0, 0, -tw / 2 - 10, 0, 40);
            eg.addColorStop(0, t.accentColor + '59');
            eg.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = eg;
            ctx.beginPath();
            ctx.arc(-tw / 2 - 10, 0, 40, 0, Math.PI * 2);
            ctx.fill();
        }

        // Hull
        const hullGrad = ctx.createLinearGradient(0, -th / 2, 0, th / 2);
        hullGrad.addColorStop(0, t.bodyColor);
        hullGrad.addColorStop(0.5, shadeColor(t.bodyColor, 20));
        hullGrad.addColorStop(1, shadeColor(t.bodyColor, -20));
        ctx.fillStyle = hullGrad;
        ctx.strokeStyle = t.accentColor;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(-tw / 2, -th / 2, tw, th, 4);
        else ctx.rect(-tw / 2, -th / 2, tw, th);
        ctx.fill();
        ctx.stroke();

        // Nose cone
        ctx.fillStyle = shadeColor(t.bodyColor, 15);
        ctx.strokeStyle = t.accentColor;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(tw / 2, -th / 2);
        ctx.lineTo(tw / 2 + th * 0.7, 0);
        ctx.lineTo(tw / 2, th / 2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Engine pods (rear)
        for (const ey of [-th * 0.3, th * 0.3]) {
            ctx.fillStyle = shadeColor(t.bodyColor, -15);
            ctx.strokeStyle = '#475569';
            ctx.lineWidth = 1;
            ctx.fillRect(-tw / 2 - 12, ey - th * 0.18, 12, th * 0.36);
            ctx.strokeRect(-tw / 2 - 12, ey - th * 0.18, 12, th * 0.36);
            const fl = 6 + Math.abs(Math.sin(t.lightPhase * 3)) * 8;
            const eg2 = ctx.createLinearGradient(-tw / 2 - 12, 0, -tw / 2 - 12 - fl, 0);
            eg2.addColorStop(0, `rgba(56,189,248,0.8)`);
            eg2.addColorStop(1, 'rgba(56,189,248,0)');
            ctx.fillStyle = eg2;
            ctx.beginPath();
            ctx.moveTo(-tw / 2 - 12, ey - th * 0.12);
            ctx.lineTo(-tw / 2 - 12 - fl, ey);
            ctx.lineTo(-tw / 2 - 12, ey + th * 0.12);
            ctx.closePath();
            ctx.fill();
        }

        // Window strip
        ctx.fillStyle = 'rgba(147,197,253,0.3)';
        ctx.strokeStyle = 'rgba(147,197,253,0.5)';
        ctx.lineWidth = 0.8;
        ctx.fillRect(-tw * 0.1, -th * 0.3, tw * 0.45, th * 0.6);
        ctx.strokeRect(-tw * 0.1, -th * 0.3, tw * 0.45, th * 0.6);

        // Running lights
        const blinkA = Math.sin(t.lightPhase) > 0;
        const blinkB = Math.sin(t.lightPhase + Math.PI) > 0;
        ctx.fillStyle = blinkA ? t.lightColor : 'rgba(0,0,0,0.5)';
        ctx.beginPath(); ctx.arc(tw / 2 + th * 0.5, -th * 0.22, 2.5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = blinkB ? '#ef4444' : 'rgba(0,0,0,0.5)';
        ctx.beginPath(); ctx.arc(-tw / 2 - 8, th * 0.1, 2.5, 0, Math.PI * 2); ctx.fill();
    }

,
_drawPickupTruck(ctx, t, tw, th) {
        // Space pickup — think F-150 silhouette in space:
        // front = right (nose + cab), rear = left (flat bed with optional cargo)
        const cabW = tw * 0.45;
        const bedW = tw * 0.52;
        const cabH = th * 1.05;   // cab taller than bed
        const bedH = th * 0.68;
        const cabX = tw / 2 - cabW; // cab starts here (right side)
        const bedX = -tw / 2;       // bed starts at left

        // Anti-grav pod glow (instead of wheels — two pods underneath)
        for (const px of [-tw * 0.28, tw * 0.28]) {
            const podGrad = ctx.createRadialGradient(px, th / 2 + 4, 0, px, th / 2 + 4, 10);
            podGrad.addColorStop(0, t.accentColor + 'aa');
            podGrad.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = podGrad;
            ctx.beginPath(); ctx.ellipse(px, th / 2 + 4, 12, 5, 0, 0, Math.PI * 2); ctx.fill();
            // Pod ring
            ctx.strokeStyle = t.accentColor;
            ctx.lineWidth = 1.2;
            ctx.beginPath(); ctx.ellipse(px, th / 2 + 2, 8, 3, 0, 0, Math.PI * 2); ctx.stroke();
        }

        // Flat bed (rear/left)
        const bedGrad = ctx.createLinearGradient(0, -bedH / 2, 0, bedH / 2);
        bedGrad.addColorStop(0, shadeColor(t.bodyColor, 10));
        bedGrad.addColorStop(1, shadeColor(t.bodyColor, -25));
        ctx.fillStyle = bedGrad;
        ctx.strokeStyle = t.accentColor;
        ctx.lineWidth = 1;
        if (ctx.roundRect) ctx.roundRect(bedX, -bedH / 2, bedW, bedH, [2, 0, 0, 2]);
        else ctx.rect(bedX, -bedH / 2, bedW, bedH);
        ctx.fill(); ctx.stroke();

        // Bed floor ribs
        ctx.strokeStyle = 'rgba(100,116,139,0.5)';
        ctx.lineWidth = 0.8;
        for (let ri = 1; ri <= 3; ri++) {
            const rx = bedX + (bedW / 4) * ri;
            ctx.beginPath();
            ctx.moveTo(rx, -bedH / 2 + 2); ctx.lineTo(rx, bedH / 2 - 2);
            ctx.stroke();
        }

        // Bed walls (raised sides)
        ctx.fillStyle = shadeColor(t.bodyColor, 15);
        ctx.fillRect(bedX, -bedH / 2 - 3, bedW, 3);
        ctx.fillRect(bedX, bedH / 2, bedW, 3);

        // Optional cargo box on bed
        if (t.hasCargoBox) {
            const bw = bedW * 0.55, bh = bedH * 0.85;
            const bx = bedX + bedW * 0.1;
            const by = -bedH / 2 - bh;
            ctx.fillStyle = shadeColor(t.bodyColor, -10);
            ctx.strokeStyle = t.accentColor;
            ctx.lineWidth = 1;
            ctx.fillRect(bx, by, bw, bh);
            ctx.strokeRect(bx, by, bw, bh);
            // Cargo straps
            ctx.strokeStyle = 'rgba(251,191,36,0.7)';
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.moveTo(bx + bw * 0.3, by); ctx.lineTo(bx + bw * 0.3, by + bh);
            ctx.moveTo(bx + bw * 0.65, by); ctx.lineTo(bx + bw * 0.65, by + bh);
            ctx.stroke();
        }

        // Cab (front/right) — taller, with visor window
        const cabGrad = ctx.createLinearGradient(cabX, -cabH / 2, cabX + cabW, cabH / 2);
        cabGrad.addColorStop(0, shadeColor(t.bodyColor, 25));
        cabGrad.addColorStop(1, shadeColor(t.bodyColor, 5));
        ctx.fillStyle = cabGrad;
        ctx.strokeStyle = t.accentColor;
        ctx.lineWidth = 1.2;
        if (ctx.roundRect) ctx.roundRect(cabX, -cabH / 2, cabW, cabH, [2, 4, 4, 2]);
        else ctx.rect(cabX, -cabH / 2, cabW, cabH);
        ctx.fill(); ctx.stroke();

        // Windscreen
        ctx.fillStyle = 'rgba(147,197,253,0.4)';
        ctx.strokeStyle = 'rgba(147,197,253,0.7)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(cabX + cabW * 0.08, -cabH * 0.42);
        ctx.lineTo(cabX + cabW * 0.18, -cabH * 0.48);
        ctx.lineTo(cabX + cabW * 0.82, -cabH * 0.48);
        ctx.lineTo(cabX + cabW * 0.88, -cabH * 0.42);
        ctx.lineTo(cabX + cabW * 0.88, cabH * 0.1);
        ctx.lineTo(cabX + cabW * 0.08, cabH * 0.1);
        ctx.closePath();
        ctx.fill(); ctx.stroke();

        // Headlights (front of cab)
        const blink = Math.sin(t.lightPhase) > 0;
        ctx.fillStyle = blink ? '#fde68a' : 'rgba(0,0,0,0.4)';
        ctx.beginPath(); ctx.arc(tw / 2, -cabH * 0.28, 3, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(tw / 2, cabH * 0.28, 3, 0, Math.PI * 2); ctx.fill();
        // Headlight glow
        if (blink) {
            const hlg = ctx.createRadialGradient(tw / 2 + 4, 0, 0, tw / 2 + 4, 0, 18);
            hlg.addColorStop(0, 'rgba(253,230,138,0.5)');
            hlg.addColorStop(1, 'rgba(253,230,138,0)');
            ctx.fillStyle = hlg;
            ctx.beginPath(); ctx.ellipse(tw / 2 + 4, 0, 18, 8, 0, 0, Math.PI * 2); ctx.fill();
        }

        // Exhaust (rear)
        const fl = 5 + Math.abs(Math.sin(t.lightPhase * 2)) * 10;
        const exGrad = ctx.createLinearGradient(-tw / 2, 0, -tw / 2 - fl, 0);
        exGrad.addColorStop(0, 'rgba(56,189,248,0.85)');
        exGrad.addColorStop(1, 'rgba(56,189,248,0)');
        ctx.fillStyle = exGrad;
        ctx.beginPath();
        ctx.moveTo(-tw / 2, -bedH * 0.25);
        ctx.lineTo(-tw / 2 - fl, 0);
        ctx.lineTo(-tw / 2, bedH * 0.25);
        ctx.closePath();
        ctx.fill();

        // Tail light
        ctx.fillStyle = 'rgba(239,68,68,0.9)';
        ctx.beginPath(); ctx.arc(-tw / 2 + 2, 0, 2.5, 0, Math.PI * 2); ctx.fill();
    }

});
