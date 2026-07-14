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
        const MAX_WEATHER_PARTICLES = 60;
        const MAX_WIND_STREAKS = 70;
        
        // ── Regular weather particles ──────────────────────────────────────
        if (hasWeather && this.weatherParticles.length < MAX_WEATHER_PARTICLES && Math.random() < 0.6) {
            const isHeatwave = this.weather === 'heatwave';
            this.weatherParticles.push({
                x: camX + (Math.random() - 0.5) * vw * 2.0, // Spawn wider to cover off-screen
                y: isHeatwave ? camY + vh * 0.6 : camY - vh * 0.6,
                vx: this.weather === 'snow' ? (Math.random() - 0.5) * 2 : (this.weather === 'rain' ? Math.random() * 1.5 + 0.5 : (this.weather === 'heatwave' ? (Math.random() - 0.5) * 1.5 : (Math.random() - 0.5) * 3)),
                vy: this.weather === 'snow' ? Math.random() * 2 + 1 : (this.weather === 'rain' ? Math.random() * 8 + 8 : (this.weather === 'heatwave' ? -(Math.random() * 2 + 1) : Math.random() * 2 + 1)),
                size: this.weather === 'snow' ? Math.random() * 3 + 1 : (this.weather === 'rain' ? Math.random() * 1.5 + 0.5 : (this.weather === 'heatwave' ? Math.random() * 3 + 1.5 : Math.random() * 4 + 2)),
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
                    x: camX + dir * vw * 0.85 + (Math.random() - 0.5) * vw * 0.5, // Spawn further off screen
                    y: camY + (Math.random() - 0.5) * vh * 1.2,
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
            if (p.type === 'snow' || p.type === 'ash' || p.type === 'heatwave') {
                p.x += Math.sin(Date.now() * 0.002 + p.y) * 0.5 * dt;
            }
            const sucked = well && Math.hypot(well.x - p.x, well.y - p.y) < well.radius * 0.4;
            let hitTerrain = false;
            if (this.physics && this.physics.terrainPolygons && (p.type === 'rain' || p.type === 'snow')) {
                for (const poly of this.physics.terrainPolygons) {
                    if (this.physics.pointInPolygon(p.x, p.y, poly)) {
                        hitTerrain = true;
                        break;
                    }
                }
            }

            const offScreenY = p.type === 'heatwave' ? (p.y < camY - vh * 0.6) : (p.y > camY + vh * 0.6);

            if (sucked || hitTerrain || offScreenY || p.x < camX - vw || p.x > camX + vw) {
                if (hitTerrain && p.type === 'rain' && Math.random() < 0.5) {
                    p.type = 'splash';
                    p.vy = -Math.random() * 2 - 1;
                    p.vx = (Math.random() - 0.5) * 2;
                    p.life = 0.2;
                    p.size = 1.0;
                } else {
                    this.weatherParticles.splice(i, 1);
                }
            } else if (p.type === 'splash') {
                p.life -= dt * 0.05;
                if (p.life <= 0) this.weatherParticles.splice(i, 1);
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
        } else if (this.weather === 'heatwave') {
            ctx.fillStyle = 'rgba(245, 158, 11, 0.4)';
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
            } else if (p.type === 'splash') {
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

        // Menu fly-bys advance per rendered frame — scale by renderDt (1.0 at
        // 60Hz, 0.5 at 120Hz) so they cruise at the same speed on any display.
        const fdt = this.renderDt || 1;

        if (this.menuMonster) {
            const mm = this.menuMonster;
            mm.x += mm.vx * fdt;
            mm.t += 0.04 * fdt;

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
            e.x += e.vx * fdt;
            e.y += Math.sin((Date.now() + e.offset) / 500) * (1.5 * e.scale) * fdt;

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

        // Draw menu particles (like shop purchase fireworks)
        if (this.physics && this.physics.particles && this.physics.particles.length > 0) {
            ctx.save();
            ctx.translate(this.canvas.width / 2, this.canvas.height / 2);
            ctx.scale(this.camera.zoom, this.camera.zoom);
            ctx.translate(-this.camera.x, -this.camera.y);
            this.drawParticles();
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

        // factor = how fast each layer tracks camera-x, i.e. its perceived
        // speed. Roughly halved from the original 0.12/0.28/0.45 (2026-07-10,
        // user feedback: "a bit too quick moving") while keeping the same
        // near-moves-faster-than-far ratio between the three layers.
        const layers = [
            { factor: 0.25, freq: 0.0018, freq2: 0.0031, seed: 1.7, seed2: 4.2, yMin: 0.15, yMax: 0.55, alpha: 1.0, darken: 0.45 },
            { factor: 0.50, freq: 0.0027, freq2: 0.0049, seed: 7.3, seed2: 2.9, yMin: 0.25, yMax: 0.60, alpha: 1.0, darken: 0.60 },
            { factor: 0.75, freq: 0.0042, freq2: 0.0071, seed: 3.1, seed2: 8.6, yMin: 0.35, yMax: 0.62, alpha: 1.0, darken: 0.75 },
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
drawCaveBackground() {
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

        // Slower moving layers, darker, more opaque.
        // Horizontal factors are set closer to 1.0 (0.95, 0.98, 1.00) so they move less relative to the
        // foreground cave walls, making the cave background feel more static and solid.
        const layers = [
            { factor: 0.95, freq: 0.003, freq2: 0.007, seed: 1.2, seed2: 3.4, alpha: 0.6, darken: 0.2 },
            { factor: 0.98, freq: 0.004, freq2: 0.009, seed: 5.6, seed2: 7.8, alpha: 0.8, darken: 0.35 },
            { factor: 1.00, freq: 0.005, freq2: 0.012, seed: 9.1, seed2: 2.3, alpha: 1.0, darken: 0.5 },
        ];

        const camX = this.camera ? this.camera.x : 0;
        const camY = this.camera ? this.camera.y : 0;
        const zoom = this.camera ? this.camera.zoom : 1;
        const levelH = this.physics.levelHeight || 2000;

        for (const layer of layers) {
            const dr = Math.round(sr * layer.darken);
            const dg = Math.round(sg * layer.darken);
            const db = Math.round(sb * layer.darken);
            
            ctx.fillStyle = `rgba(${dr},${dg},${db},${layer.alpha})`;
            
            // Draw Pillars first so they blend with floor and ceiling
            for (let sx = 0; sx <= w + 4; sx += 10) {
                const worldX = camX * layer.factor + (sx - w / 2) / zoom;
                const nPillar = Math.sin(worldX * layer.freq * 0.5 + layer.seed) + Math.sin(worldX * layer.freq2 * 0.8 + layer.seed2);
                if (nPillar > 1.3) {
                    const pWidth = (nPillar - 1.3) * 300 * zoom;
                    ctx.fillRect(sx - pWidth/2, 0, pWidth, h);
                }
            }

            // Floor (Stalagmites)
            ctx.beginPath();
            ctx.moveTo(0, h);
            for (let sx = 0; sx <= w + 4; sx += 4) {
                const worldX = camX * layer.factor + (sx - w / 2) / zoom;
                const n1 = Math.sin(worldX * layer.freq + layer.seed);
                const n2 = Math.sin(worldX * layer.freq2 + layer.seed2);
                const n3 = Math.sin(worldX * layer.freq * 2.3 + layer.seed + 1.1);
                
                const t = Math.abs(n1 * 0.5 + n2 * 0.3 + n3 * 0.2); 
                
                const baseYWorld = levelH * 0.8; 
                const amplitudeWorld = levelH * 0.4;
                const layerYWorld = baseYWorld - t * amplitudeWorld; 
                
                // Vertical parallax uses positive coefficient and scales with (1 - layer.factor)
                // so that the closest background layer doesn't drift vertically relative to the foreground,
                // and other layers have correct (not reverse) vertical parallax.
                let parallaxYWorld = layerYWorld + (camY - levelH / 2) * ((1 - layer.factor) * 0.3);
                
                const screenY = h / 2 + (parallaxYWorld - camY) * zoom;
                ctx.lineTo(sx, screenY);
            }
            ctx.lineTo(w, h);
            ctx.closePath();
            ctx.fill();

            // Ceiling (Stalactites)
            ctx.beginPath();
            ctx.moveTo(0, 0);
            for (let sx = 0; sx <= w + 4; sx += 4) {
                const worldX = camX * layer.factor + (sx - w / 2) / zoom;
                const n1 = Math.sin(worldX * layer.freq * 1.1 + layer.seed2);
                const n2 = Math.sin(worldX * layer.freq2 * 1.3 + layer.seed);
                const n3 = Math.sin(worldX * layer.freq * 2.1 + layer.seed2 + 2.2);
                
                const t = Math.abs(n1 * 0.5 + n2 * 0.3 + n3 * 0.2); 
                
                const baseYWorld = levelH * 0.2; 
                const amplitudeWorld = levelH * 0.4;
                const layerYWorld = baseYWorld + t * amplitudeWorld; 
                
                // Vertical parallax uses positive coefficient and scales with (1 - layer.factor)
                let parallaxYWorld = layerYWorld + (camY - levelH / 2) * ((1 - layer.factor) * 0.3);
                
                const screenY = h / 2 + (parallaxYWorld - camY) * zoom;
                ctx.lineTo(sx, screenY);
            }
            ctx.lineTo(w, 0);
            ctx.closePath();
            ctx.fill();
        }
    }
,
drawCityBackground() {
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;
        const lvPal = (levels[this.currentLevelIndex] || {}).palette;
        const skyBot = lvPal ? lvPal.skyBot : '#0f172a';

        const hexToRgb = (hex) => {
            const r = parseInt(hex.slice(1, 3), 16);
            const g = parseInt(hex.slice(3, 5), 16);
            const b = parseInt(hex.slice(5, 7), 16);
            return [r, g, b] || [15, 23, 42];
        };
        const [sr, sg, sb] = hexToRgb(skyBot.length === 7 ? skyBot : '#0f172a');

        const camX = this.camera ? this.camera.x : 0;
        const camY = this.camera ? this.camera.y : 0;
        const zoom = this.camera ? this.camera.zoom : 1;
        const levelH = this.physics.levelHeight || 2000;

        // A simple hash function for deterministic building heights
        const hash11 = (p) => {
            p = (p * 12.9898 + 78.233) % 1;
            return (p * 43758.5453) % 1;
        };

        const layers = [
            { factor: 0.15, alpha: 0.4, darken: 0.2, heightMin: 0.1, heightMax: 0.3, widthMin: 40, widthMax: 100, yBaseOffset: 0.55, windows: false },
            { factor: 0.30, alpha: 0.6, darken: 0.4, heightMin: 0.2, heightMax: 0.5, widthMin: 60, widthMax: 150, yBaseOffset: 0.65, windows: false },
            { factor: 0.50, alpha: 0.9, darken: 0.7, heightMin: 0.3, heightMax: 0.7, widthMin: 80, widthMax: 200, yBaseOffset: 0.85, windows: true },
        ];

        for (let i = 0; i < layers.length; i++) {
            const layer = layers[i];
            const dr = Math.round(sr * layer.darken);
            const dg = Math.round(sg * layer.darken);
            const db = Math.round(sb * layer.darken);
            
            ctx.fillStyle = `rgba(${dr},${dg},${db},${layer.alpha})`;
            
            // Average chunk size helps determine grid
            const avgWidth = (layer.widthMin + layer.widthMax) / 2;
            const gridSpacing = avgWidth * 1.5;
            
            const worldLeft = camX * layer.factor - (w / 2) / zoom;
            const worldRight = camX * layer.factor + (w / 2) / zoom;
            
            const startCol = Math.floor(worldLeft / gridSpacing);
            const endCol = Math.floor(worldRight / gridSpacing) + 1;
            
            const baseYWorld = levelH * layer.yBaseOffset;

            // To avoid the jagged edge bleeding above terrain similar to hills,
            // we clamp the top parallax height based on terrain.
            const terrainTopY = this.physics.terrainTopY || 0;

            for (let col = startCol; col <= endCol; col++) {
                const seed = col + i * 1000; // Unique seed per column and layer
                const h1 = hash11(seed * 1.1);
                const h2 = hash11(seed * 2.2);
                
                const bWidth = layer.widthMin + h1 * (layer.widthMax - layer.widthMin);
                const bHeight = levelH * (layer.heightMin + h2 * (layer.heightMax - layer.heightMin));
                
                // Slight x offset so buildings aren't rigidly aligned
                const xOffset = hash11(seed * 3.3) * (gridSpacing - bWidth);
                
                const worldX = col * gridSpacing + xOffset;
                const layerYWorldTop = baseYWorld - bHeight;
                
                let parallaxYWorld = layerYWorldTop - (camY - levelH / 2) * (layer.factor * 0.3);
                parallaxYWorld = Math.max(parallaxYWorld, terrainTopY + 80);
                
                let parallaxYWorldBase = baseYWorld - (camY - levelH / 2) * (layer.factor * 0.3);
                
                const screenX = w / 2 + (worldX - camX * layer.factor) * zoom;
                const screenY = h / 2 + (parallaxYWorld - camY) * zoom;
                const screenBaseY = h / 2 + (parallaxYWorldBase - camY) * zoom;
                const screenWidth = bWidth * zoom;
                const screenHeight = Math.max(0, screenBaseY - screenY) + 500; // extend down to cover base
                
                if (screenHeight > 0) {
                    ctx.fillRect(screenX, screenY, screenWidth, screenHeight);
                    
                    if (layer.windows && screenWidth > 15) {
                        const winRows = Math.floor(bHeight / 40);
                        const winCols = Math.floor(bWidth / 20);
                        
                        const isWarm = hash11(seed * 4.4) > 0.5;
                        const winColor = isWarm 
                            ? `rgba(253, 186, 116, ${layer.alpha * 0.8})` // Warm orange
                            : `rgba(125, 211, 252, ${layer.alpha * 0.8})`; // Cool cyan
                        ctx.fillStyle = winColor;
                        
                        for (let r = 0; r < winRows; r++) {
                            for (let c = 0; c < winCols; c++) {
                                // Randomly light windows
                                if (hash11(seed + r * 13 + c * 17) > 0.6) {
                                    const winX = screenX + (c * 20 + 5) * zoom;
                                    const winY = screenY + (r * 40 + 10) * zoom;
                                    const winW = 8 * zoom;
                                    const winH = 12 * zoom;
                                    if (winY < h && winY > 0) {
                                        ctx.fillRect(winX, winY, winW, winH);
                                    }
                                }
                            }
                        }
                        // Reset fill style for the next building body
                        ctx.fillStyle = `rgba(${dr},${dg},${db},${layer.alpha})`;
                    }
                }
            }
        }
    }

,
drawAmbientTraffic() {
        const levelConfig = levels[this.currentLevelIndex] || {};
        const confMinY = levelConfig.ambientTrafficMinY;
        const confMaxY = levelConfig.ambientTrafficMaxY;
        const ctx = this.ctx;

        // Visualise the traffic zone as a subtle space lane if explicitly defined.
        // Editor-only debug aid (level-editor playtest/live-preview) — must not
        // leak into a real playthrough of the shipped level.
        if (this.isPlaytest && confMinY != null && confMaxY != null) {
            ctx.save();
            const laneH = confMaxY - confMinY;
            const camX = this.camera ? this.camera.x : 0;
            // Draw wide enough to cover any ultrawide screen
            const drawW = (this.canvas.width / (this.camera?.zoom || 1)) * 2;
            
            // Faint lane background
            ctx.fillStyle = 'rgba(56, 189, 248, 0.015)'; 
            ctx.fillRect(camX - drawW, confMinY, drawW * 2, laneH);
            
            // Faint dashed borders
            ctx.strokeStyle = 'rgba(56, 189, 248, 0.08)';
            ctx.lineWidth = 1.5;
            ctx.setLineDash([40, 40]);
            
            // Shift the dash pattern based on time to make the borders "flow"
            ctx.lineDashOffset = -(Date.now() / 20) % 80;
            
            ctx.beginPath();
            ctx.moveTo(camX - drawW, confMinY);
            ctx.lineTo(camX + drawW, confMinY);
            ctx.moveTo(camX - drawW, confMaxY);
            ctx.lineTo(camX + drawW, confMaxY);
            ctx.stroke();
            ctx.restore();
        }

        const traffic = this.physics?.ambientTraffic;
        if (!traffic || traffic.length === 0) return;

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
    }

,
_drawFreighterTruck(ctx, t, tw, th) {
        // Heavy Sci-Fi Freighter
        const h = th * 1.2;
        const w = tw * 1.1;

        // Engine glow trail (reduced brightness)
        if (t.engineGlow) {
            const eg = ctx.createRadialGradient(-w / 2 - 15, 0, 0, -w / 2 - 15, 0, 40);
            eg.addColorStop(0, t.accentColor + '44');
            eg.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = eg;
            ctx.beginPath();
            ctx.arc(-w / 2 - 15, 0, 40, 0, Math.PI * 2);
            ctx.fill();
        }

        // Main central fuselage
        const hullGrad = ctx.createLinearGradient(0, -h / 2, 0, h / 2);
        hullGrad.addColorStop(0, shadeColor(t.bodyColor, 10));
        hullGrad.addColorStop(0.5, t.bodyColor);
        hullGrad.addColorStop(1, shadeColor(t.bodyColor, -30));
        ctx.fillStyle = hullGrad;
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 1.5;
        
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(-w * 0.45, -h * 0.25, w * 0.8, h * 0.5, 4);
        else ctx.rect(-w * 0.45, -h * 0.25, w * 0.8, h * 0.5);
        ctx.fill();
        ctx.stroke();
        
        // Variation: Stripes based on width
        if (Math.floor(tw) % 2 === 0) {
            ctx.fillStyle = t.accentColor + '55';
            ctx.fillRect(-w * 0.2, -h * 0.25, w * 0.05, h * 0.5);
            ctx.fillRect(-w * 0.1, -h * 0.25, w * 0.05, h * 0.5);
        }

        // Forward cockpit section (Nose)
        ctx.fillStyle = shadeColor(t.bodyColor, 20);
        ctx.beginPath();
        ctx.moveTo(w * 0.35, -h * 0.2);
        ctx.lineTo(w * 0.55, -h * 0.1);
        ctx.lineTo(w * 0.55, h * 0.1);
        ctx.lineTo(w * 0.35, h * 0.2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Cockpit window (no shadowBlur on mobile to save performance)
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(w * 0.4, -h * 0.05, w * 0.12, h * 0.1);

        // Side cargo pods (Top and Bottom)
        const cargoColor = Math.floor(th) % 2 === 0 ? shadeColor(t.bodyColor, -15) : shadeColor(t.accentColor, -40);
        for (const sign of [-1, 1]) {
            const py = sign * (h * 0.35);
            ctx.fillStyle = cargoColor;
            ctx.strokeStyle = '#334155';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            if (ctx.roundRect) ctx.roundRect(-w * 0.3, py - h * 0.15, w * 0.5, h * 0.3, 3);
            else ctx.rect(-w * 0.3, py - h * 0.15, w * 0.5, h * 0.3);
            ctx.fill();
            ctx.stroke();

            // Cargo pod details (ribs)
            ctx.strokeStyle = '#0f172a';
            ctx.lineWidth = 1;
            for (let i = 1; i <= 4; i++) {
                const rx = -w * 0.3 + (w * 0.5 / 5) * i;
                ctx.beginPath();
                ctx.moveTo(rx, py - h * 0.15);
                ctx.lineTo(rx, py + h * 0.15);
                ctx.stroke();
            }
        }

        // Engine blocks (Rear)
        ctx.fillStyle = '#475569';
        ctx.fillRect(-w * 0.55, -h * 0.3, w * 0.1, h * 0.2);
        ctx.fillRect(-w * 0.55, h * 0.1, w * 0.1, h * 0.2);

        // Thruster flames
        for (const ey of [-h * 0.2, h * 0.2]) {
            const fl = 10 + Math.abs(Math.sin(t.lightPhase * 6)) * 10;
            const eg2 = ctx.createLinearGradient(-w * 0.55, 0, -w * 0.55 - fl, 0);
            eg2.addColorStop(0, t.accentColor);
            eg2.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = eg2;
            ctx.beginPath();
            ctx.moveTo(-w * 0.55, ey - h * 0.08);
            ctx.lineTo(-w * 0.55 - fl, ey);
            ctx.lineTo(-w * 0.55, ey + h * 0.08);
            ctx.closePath();
            ctx.fill();
        }

        // Running lights (reduced intensity)
        const blinkA = Math.sin(t.lightPhase) > 0;
        ctx.fillStyle = blinkA ? 'rgba(239,68,68,0.7)' : 'rgba(127,29,29,0.5)';
        ctx.beginPath(); ctx.arc(w * 0.5, -h * 0.15, 2, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = !blinkA ? 'rgba(16,185,129,0.7)' : 'rgba(6,78,59,0.5)';
        ctx.beginPath(); ctx.arc(w * 0.5, h * 0.15, 2, 0, Math.PI * 2); ctx.fill();
    }

,
_drawPickupTruck(ctx, t, tw, th) {
        // Sleek Sci-Fi Cargo Courier
        const w = tw * 1.1;
        const h = th * 0.9;

        // Main angled chassis
        ctx.fillStyle = t.bodyColor;
        ctx.strokeStyle = shadeColor(t.bodyColor, -40);
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(-w * 0.4, -h * 0.2);
        ctx.lineTo(w * 0.1, -h * 0.3); // sloped hood
        ctx.lineTo(w * 0.4, 0); // sharp nose
        ctx.lineTo(w * 0.1, h * 0.4);
        ctx.lineTo(-w * 0.4, h * 0.3);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Cargo bed (cutout in rear)
        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.moveTo(-w * 0.35, -h * 0.15);
        ctx.lineTo(0, -h * 0.15);
        ctx.lineTo(-w * 0.1, h * 0.15);
        ctx.lineTo(-w * 0.35, h * 0.15);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Optional cargo box in bed
        if (t.hasCargoBox) {
            ctx.fillStyle = t.accentColor;
            ctx.fillRect(-w * 0.28, -h * 0.08, w * 0.2, h * 0.16);
            ctx.strokeStyle = 'rgba(255,255,255,0.3)';
            ctx.lineWidth = 1;
            ctx.strokeRect(-w * 0.28, -h * 0.08, w * 0.2, h * 0.16);
            
            // Cargo box detail
            if (Math.floor(tw) % 2 === 0) {
                ctx.fillStyle = 'rgba(0,0,0,0.2)';
                ctx.fillRect(-w * 0.25, -h * 0.05, w * 0.14, h * 0.1);
            }
        }

        // Swept back cockpit canopy
        ctx.fillStyle = 'rgba(14, 165, 233, 0.4)'; // Reduced opacity
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.6)';
        ctx.beginPath();
        ctx.moveTo(w * 0.1, -h * 0.2);
        ctx.lineTo(w * 0.25, -h * 0.05);
        ctx.lineTo(w * 0.25, h * 0.05);
        ctx.lineTo(w * 0.1, h * 0.1);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // Variation: canopy strut
        if (Math.floor(th) % 2 === 0) {
            ctx.beginPath();
            ctx.moveTo(w * 0.17, -h * 0.12);
            ctx.lineTo(w * 0.17, h * 0.08);
            ctx.stroke();
        }

        // Rear engine nozzle
        ctx.fillStyle = '#475569';
        ctx.fillRect(-w * 0.45, -h * 0.15, w * 0.05, h * 0.3);

        // Engine thrust plume
        const fl = 8 + Math.abs(Math.sin(t.lightPhase * 8)) * 8; // smaller flame
        const eg = ctx.createLinearGradient(-w * 0.45, 0, -w * 0.45 - fl, 0);
        // Thrust color variation based on width
        if (Math.floor(tw) % 3 === 0) {
            eg.addColorStop(0, '#60a5fa');
            eg.addColorStop(0.5, '#3b82f6');
            eg.addColorStop(1, 'rgba(59,130,246,0)');
        } else {
            eg.addColorStop(0, '#fde047');
            eg.addColorStop(0.5, '#f97316');
            eg.addColorStop(1, 'rgba(249,115,22,0)');
        }
        
        ctx.fillStyle = eg;
        ctx.beginPath();
        ctx.moveTo(-w * 0.45, -h * 0.1);
        ctx.lineTo(-w * 0.45 - fl, 0);
        ctx.lineTo(-w * 0.45, h * 0.1);
        ctx.closePath();
        ctx.fill();

        // Headlight glow (reduced)
        const blink = Math.sin(t.lightPhase) > 0;
        if (blink) {
            const hlg = ctx.createRadialGradient(w * 0.4, 0, 0, w * 0.4, 0, 12);
            hlg.addColorStop(0, 'rgba(255,255,255,0.3)');
            hlg.addColorStop(1, 'transparent');
            ctx.fillStyle = hlg;
            ctx.beginPath(); ctx.ellipse(w * 0.4, 0, 10, 6, 0, 0, Math.PI * 2); ctx.fill();
        }

        // Tail light (reduced)
        ctx.fillStyle = 'rgba(239,68,68,0.5)';
        ctx.beginPath(); ctx.arc(-tw / 2 + 2, 0, 1.5, 0, Math.PI * 2); ctx.fill();
    }

});
