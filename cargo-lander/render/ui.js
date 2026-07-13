Object.assign(CargoGame.prototype, {
drawMinimap() {
        if (this.uiCollapsed) return;

        // Target the dedicated radar HTML canvas instead of the main game canvas
        const radarCanvas = this.uiElements?.radarCanvas || document.getElementById('radar-canvas');
        if (!radarCanvas) return;
        const ctx = radarCanvas.getContext('2d');

        const mmWidth = radarCanvas.width;
        const mmHeight = radarCanvas.height;

        // Find objective bounds to cap minimap
        let objMinX = Infinity, objMaxX = -Infinity, objMinY = Infinity, objMaxY = -Infinity;
        const addObj = (obj) => {
            if (!obj) return;
            if (obj.x < objMinX) objMinX = obj.x;
            if (obj.x + (obj.width || 0) > objMaxX) objMaxX = obj.x + (obj.width || 0);
            if (obj.y < objMinY) objMinY = obj.y;
            if (obj.y + (obj.height || 0) > objMaxY) objMaxY = obj.y + (obj.height || 0);
        };
        addObj(this.physics.startDepot);
        addObj(this.physics.collectionPoint);
        if (this.physics.deliveryHubs) {
            for (const hub of this.physics.deliveryHubs) addObj(hub);
        }

        if (objMinX === Infinity) {
            objMinX = 0; objMaxX = this.physics.levelWidth;
            objMinY = 0; objMaxY = this.physics.levelHeight;
        } else {
            objMinX -= 400; objMaxX += 400;
            objMinY -= 300; objMaxY += 300;
        }

        const mapWorldWidth = Math.max(1000, objMaxX - objMinX);
        const mapWorldHeight = Math.max(600, objMaxY - objMinY);

        // Clear the canvas — the HTML container provides the background & border
        ctx.clearRect(0, 0, mmWidth, mmHeight);

        // ── World → minimap transform ──────────────────────────────────────
        const scale = Math.min(mmWidth / mapWorldWidth, mmHeight / mapWorldHeight);
        const contentW = mapWorldWidth * scale;
        const contentH = mapWorldHeight * scale;
        const offsetX = (mmWidth - contentW) / 2;
        const offsetY = (mmHeight - contentH) / 2;

        ctx.save();
        ctx.translate(offsetX, offsetY);
        ctx.scale(scale, scale);
        ctx.translate(-objMinX, -objMinY);

        // ── Terrain silhouette ─────────────────────────────────────────────
        if (this.physics.terrainPolygons && this.physics.terrainPolygons.length > 0) {
            ctx.fillStyle = 'rgba(51, 65, 85, 0.7)';
            for (const poly of this.physics.terrainPolygons) {
                if (!poly || poly.length < 3) continue;
                ctx.beginPath();
                ctx.moveTo(poly[0].x, poly[0].y);
                for (let i = 1; i < poly.length; i++) ctx.lineTo(poly[i].x, poly[i].y);
                ctx.closePath();
                ctx.fill();
            }
        }

        // ── Pads / hubs ────────────────────────────────────────────────────
        const minW = 4 / scale;
        const minH = 4 / scale;

        if (this.physics.startDepot) {
            const d = this.physics.startDepot;
            ctx.fillStyle = '#94a3b8';
            ctx.fillRect(d.x, d.y - minH, Math.max(d.width, minW), minH * 2);
        }
        if (this.physics.collectionPoint) {
            const cp = this.physics.collectionPoint;
            ctx.fillStyle = '#fbbf24';
            ctx.fillRect(cp.x, cp.y - minH, Math.max(cp.width, minW), minH * 2);
        }
        if (this.physics.deliveryHubs) {
            for (const hub of this.physics.deliveryHubs) {
                ctx.fillStyle = hub.color || '#38bdf8';
                ctx.fillRect(hub.x, hub.y - minH, Math.max(hub.width, minW), minH * 2);
            }
        }

        // ── Cargo boxes ────────────────────────────────────────────────────
        const boxR = 6 / scale;
        if (this.physics.boxes) {
            for (const box of this.physics.boxes) {
                ctx.fillStyle = box.color || '#fff';
                ctx.beginPath();
                ctx.arc(box.x, box.y, boxR, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        // ── Monster blip ───────────────────────────────────────────────────
        if (this.physics.monster) {
            const m = this.physics.monster;
            const mR = 22 / scale;
            ctx.fillStyle = `rgba(239,68,68,${0.6 + Math.sin(Date.now() / 80) * 0.4})`;
            ctx.beginPath();
            ctx.arc(m.x, m.y, mR, 0, Math.PI * 2);
            ctx.fill();
        }

        // ── Camera viewport rect ───────────────────────────────────────────
        const viewW = this.canvas.width / this.camera.zoom;
        const viewH = this.canvas.height / this.camera.zoom;
        const viewX = this.camera.x - viewW / 2;
        const viewY = this.camera.y - viewH / 2;
        ctx.strokeStyle = 'rgba(255,255,255,0.15)';
        ctx.lineWidth = 1 / scale;
        ctx.strokeRect(viewX, viewY, viewW, viewH);

        // ── Lander dot ─────────────────────────────────────────────────────
        if (this.physics.lander) {
            const l = this.physics.lander;
            const dotR = 5 / scale;
            const clampedX = Math.max(objMinX, Math.min(objMaxX, l.x));
            const clampedY = Math.max(objMinY, Math.min(objMaxY, l.y));

            ctx.fillStyle = l.crashed ? '#ef4444' : '#10b981';
            ctx.beginPath();
            ctx.arc(clampedX, clampedY, dotR, 0, Math.PI * 2);
            ctx.fill();

            if (!l.crashed) {
                ctx.strokeStyle = '#10b981';
                ctx.lineWidth = 2.5 / scale;
                ctx.beginPath();
                ctx.moveTo(clampedX, clampedY);
                ctx.lineTo(
                    clampedX + Math.sin(l.angle) * dotR * 2.2,
                    clampedY - Math.cos(l.angle) * dotR * 2.2
                );
                ctx.stroke();
            }
        }

        ctx.restore();
    }

,
drawRadarPingZone() {
        const ctx = this.ctx;
        const now = Date.now();
        
        const drawZone = (cx, cy, maxR, color, period) => {
            // ── Soft ambient glow — no hard edge ─────────────────────────────────
            const glowAlpha = 0.06 + 0.04 * Math.sin(now * 0.0009);
            const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxR * 1.1);
            grad.addColorStop(0, `rgba(${color}, ${glowAlpha * 2.2})`);
            grad.addColorStop(0.5, `rgba(${color}, ${glowAlpha})`);
            grad.addColorStop(1, `rgba(${color}, 0)`);
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(cx, cy, maxR * 1.1, 0, Math.PI * 2);
            ctx.fill();

            // ── Expanding ping rings — fade to nothing before reaching maxR ───────
            const NUM_PINGS = 3;
            for (let i = 0; i < NUM_PINGS; i++) {
                const offset = (i / NUM_PINGS) * period;
                const t = ((now + offset) % period) / period; // 0→1
                const ringR = t * maxR;
                const alpha = Math.pow(1 - t, 2.6) * 0.30;
                ctx.strokeStyle = `rgba(${color}, ${alpha})`;
                ctx.lineWidth = 1.5 + (1 - t) * 2;
                ctx.beginPath();
                ctx.arc(cx, cy, ringR, 0, Math.PI * 2);
                ctx.stroke();
            }

            // ── Tremor dots — subtle ground-plane orbit ───────────────────────────
            ctx.save();
            for (let i = 0; i < 5; i++) {
                const angle = (now * 0.0004 + i * 1.257) % (Math.PI * 2);
                const drift = maxR * 0.22 + maxR * 0.14 * Math.abs(Math.sin(now * 0.0007 + i));
                const px = cx + Math.cos(angle) * drift;
                const py = cy + Math.sin(angle) * drift * 0.35;
                const dotAlpha = 0.15 + 0.10 * Math.sin(now * 0.002 + i * 2);
                ctx.fillStyle = `rgba(${color}, ${dotAlpha})`;
                ctx.beginPath();
                ctx.arc(px, py, 1.8 + Math.abs(Math.sin(now * 0.003 + i)), 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();
        };

        const cfg = this.physics.currentLevelConfig;
        const zone = cfg?.radarPingZone;
        if (zone) {
            drawZone(zone.cx, zone.cy, zone.r ?? 300, zone.color ?? '210,100,15', zone.period ?? 3800);
        }

        // Also draw radar ping zones for any sandworm hazards
        if (this.physics.hazards) {
            for (const h of this.physics.hazards) {
                if (h.type === 'sandworm' && h.pts && h.pts.length > 0) {
                    let cx = 0, cy = 0;
                    for (let p of h.pts) { cx += p.x; cy += p.y; }
                    cx /= h.pts.length; cy /= h.pts.length;

                    const reach = h.reach || 300;
                    drawZone(cx, cy, reach, h.color || '210,100,15', h.period || 3800);
                }
            }
        }
    }

,
drawNextObjectiveArrow() {
        const ctx = this.ctx;
        const level = levels[this.currentLevelIndex];
        if (!level || this.gameState !== 'playing') return;
        const allDelivered = this.deliveredCount >= (level.targetCargo || 2);

        const cargoOnDeck = this.physics.boxes.filter(b => b.onDeck);
        const t = Date.now();
        const bounce = Math.sin(t / 400) * 8;

        const drawArrow = (wx, padY, label) => {
            const ax = wx;
            const ay = padY - 50 + bounce;
            ctx.save();
            ctx.textAlign = 'center';
            ctx.font = 'bold 22px sans-serif';
            ctx.fillStyle = 'rgba(255,230,0,0.95)';
            ctx.fillText('▼', ax, ay);
            ctx.font = 'bold 11px Outfit, sans-serif';
            ctx.fillStyle = 'rgba(255,255,255,0.9)';
            ctx.fillText(label, ax, ay + 16);
            ctx.restore();
        };

        let targetX, targetY;
        let isHQReturn = false;
        
        if (allDelivered) {
            const startPad = this.physics.startDepot;
            if (startPad) {
                targetX = startPad.x + startPad.width / 2;
                targetY = startPad.y;
                drawArrow(targetX, targetY - 80, 'RETURN TO HQ');
                isHQReturn = true;
            }
        } else if (cargoOnDeck.length === 0) {
            const collection = this.physics.collectionPoint;
            if (collection) {
                targetX = collection.x + collection.width / 2;
                targetY = collection.y;
                drawArrow(targetX, targetY - 140, 'PICK UP');
            }
        } else {
            const box = cargoOnDeck[0];
            const hub = this.physics.deliveryHubs.find(h => h.type === box.type);
            if (hub) {
                targetX = hub.x + hub.width / 2;
                targetY = hub.y;
                drawArrow(targetX, targetY - 80, 'DELIVER HERE');
            }
        }

        // Draw guiding arrow around lander
        if (targetX !== undefined && targetY !== undefined && this.physics.lander && !this.physics.lander.crashed) {
            const lx = this.physics.lander.x;
            const ly = this.physics.lander.y;
            
            const dx = targetX - lx;
            const dy = targetY - ly;
            const dist = Math.hypot(dx, dy);
            
            const radius = (this.canvas.height * 0.20) / this.camera.zoom;
            const fadeStartDist = (this.canvas.width / 3.5) / this.camera.zoom;
            let alpha = Math.min(1.0, (dist - fadeStartDist) / 300);
            
            if (alpha > 0.05) {
                const angle = Math.atan2(dy, dx);
                
                ctx.save();
                ctx.translate(lx, ly);
                
                // White nav color normally, green if returning to HQ
                const rColor = isHQReturn ? '16, 185, 129' : '255, 255, 255';
                
                // Arrow
                ctx.rotate(angle);
                ctx.translate(radius, 0);
                ctx.beginPath();
                ctx.moveTo(14, 0);
                ctx.lineTo(-10, 10);
                ctx.lineTo(-4, 0);
                ctx.lineTo(-10, -10);
                ctx.closePath();
                
                ctx.fillStyle = `rgba(${rColor}, ${alpha * 0.8})`;
                ctx.fill();
                
                ctx.restore();
            }
        }
    }

,
drawNotifications() {
        // Notifications are now rendered as HTML DOM elements via addMessage().
        // This method is kept as a no-op so existing call sites in render.js don't break.
    }

,
drawWindIndicator() {
        // Renders as an HTML element (#wind-indicator, see index.html's center HUD
        // column) rather than to canvas — it used to draw at the same screen
        // position as the fuel/hull vitals panel and was invisible, fully covered
        // by that panel's opaque background. Kept as a same-named method (like
        // drawNotifications()) so render.js's per-frame call site is unchanged.
        const el = this._windEl || (this._windEl = document.getElementById('wind-indicator'));
        if (!el) return;

        const baseWind = this.physics.wind;
        if (Math.abs(baseWind) < 0.008) {
            if (!el.classList.contains('hidden')) el.classList.add('hidden');
            return;
        }
        el.classList.remove('hidden');

        const currentWind = this.physics.currentWind || baseWind;
        const dir = baseWind > 0 ? 1 : -1;
        const absBase = Math.abs(baseWind);
        const warning = !!this.physics.windWarning;

        // One soft cue when a gust warning starts (edge-triggered, not looping)
        if (warning && !this._windWarnedLast && window.CargoAudio?.playWindWarning) {
            window.CargoAudio.playWindWarning();
        }
        this._windWarnedLast = warning;

        // Smooth the readout so it doesn't jitter rapidly
        if (this._windDisplaySmooth === undefined) this._windDisplaySmooth = Math.abs(currentWind);
        this._windDisplaySmooth += (Math.abs(currentWind) - this._windDisplaySmooth) * 0.06;
        const absCurrent = this._windDisplaySmooth;
        const gustRatio = absCurrent / (absBase || 1);

        // Determine color from strength: cyan → yellow → red
        const str = Math.min(1, absBase / 0.4);
        let r = Math.round(56 + str * 199);
        let g = Math.round(189 - str * 89);
        let b = Math.round(248 - str * 248);

        // Warning flash: pulse toward amber while the gust is incoming
        const pulse = warning ? (Math.sin(Date.now() * 0.012) * 0.5 + 0.5) : 0;
        if (warning) {
            r = Math.round(r + (245 - r) * pulse);
            g = Math.round(g + (158 - g) * pulse);
            b = Math.round(b + (11 - b) * pulse);
        }

        el.style.color = `rgba(${r},${g},${b},0.95)`;
        el.style.borderColor = `rgba(${r},${g},${b},${warning ? 0.5 + pulse * 0.5 : 0.4})`;
        el.style.boxShadow = warning ? `0 0 ${6 + pulse * 8}px rgba(${r},${g},${b},${0.35 + pulse * 0.35})` : 'none';

        const gustLabel = warning ? ' (INCOMING)' : (gustRatio > 1.25 ? ' (GUSTING)' : '');
        el.textContent = `${dir > 0 ? '▶' : '◀'} ${(absCurrent * 10).toFixed(1)} m/s${gustLabel}`;
    }

});
