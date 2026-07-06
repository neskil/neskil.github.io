Object.assign(CargoGame.prototype, {
drawMinimap() {
        if (this.uiCollapsed) return;
        const ctx = this.ctx;
        const cw = this.canvas.width;

        const isMobile = cw < 768;
        const isTiny = cw < 500;

        // Find objective bounds to cap minimap
        let objMinX = Infinity;
        let objMaxX = -Infinity;
        let objMinY = Infinity;
        let objMaxY = -Infinity;
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
            objMinX -= 400; objMaxX += 400; // padding
            objMinY -= 300; objMaxY += 300;
        }

        const mapWorldWidth = Math.max(1000, objMaxX - objMinX);
        const mapWorldHeight = Math.max(600, objMaxY - objMinY);

        // Minimap: top-right corner, fixed landscape UI dimensions
        const mmWidth = isTiny ? 160 : (isMobile ? 200 : 260);
        const mmHeight = isTiny ? 100 : (isMobile ? 130 : 160);
        const margin = isMobile ? 12 : 16;
        const mmX = cw - mmWidth - margin;
        const mmY = isMobile ? 52 : 64; // clears the HUD bar (top:8px + ~44px height)

        ctx.save();
        // Translate to top-right anchor and scale
        const anchorX = cw - margin;
        ctx.translate(anchorX, mmY);
        ctx.scale(this.uiScale || 1.0, this.uiScale || 1.0);
        ctx.translate(-anchorX, -mmY);
        // ── Background ────────────────────────────────────────────────────
        ctx.save();

        // Draw rounded rect background + border
        ctx.fillStyle = 'rgba(10, 16, 32, 0.96)';
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.3)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(mmX, mmY, mmWidth, mmHeight, 12);
        else ctx.rect(mmX, mmY, mmWidth, mmHeight);
        ctx.fill();
        ctx.stroke();

        // ── Clip everything to the minimap box ────────────────────────────
        // This prevents the lander dot / viewport rect from ever leaking outside
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(mmX, mmY, mmWidth, mmHeight, 12);
        else ctx.rect(mmX, mmY, mmWidth, mmHeight);
        ctx.clip();

        // Subtle grid
        ctx.strokeStyle = 'rgba(255,255,255,0.04)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let i = 1; i < 4; i++) {
            ctx.moveTo(mmX + (mmWidth / 4) * i, mmY);
            ctx.lineTo(mmX + (mmWidth / 4) * i, mmY + mmHeight);
            ctx.moveTo(mmX, mmY + (mmHeight / 4) * i);
            ctx.lineTo(mmX + mmWidth, mmY + (mmHeight / 4) * i);
        }
        ctx.stroke();

        // ── World → minimap transform ──────────────────────────────────────
        const scale = Math.min(mmWidth / mapWorldWidth, mmHeight / mapWorldHeight);

        // Center the scaled world in the minimap box
        const contentW = mapWorldWidth * scale;
        const contentH = mapWorldHeight * scale;
        const offsetX = (mmWidth - contentW) / 2;
        const offsetY = (mmHeight - contentH) / 2;

        ctx.translate(mmX + offsetX, mmY + offsetY);
        ctx.scale(scale, scale);
        ctx.translate(-objMinX, -objMinY);

        // ── Terrain silhouette ─────────────────────────────────────────────
        if (this.physics.terrainPolygons && this.physics.terrainPolygons.length > 0) {
            ctx.fillStyle = 'rgba(51, 65, 85, 0.7)';
            for (const poly of this.physics.terrainPolygons) {
                if (!poly || poly.length < 3) continue;
                ctx.beginPath();
                ctx.moveTo(poly[0].x, poly[0].y);
                for (let i = 1; i < poly.length; i++) {
                    ctx.lineTo(poly[i].x, poly[i].y);
                }
                ctx.closePath();
                ctx.fill();
            }
        }

        // ── Pads / hubs ────────────────────────────────────────────────────
        // Min size in world units so they're visible on the minimap
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
        const boxR = 6 / scale; // world-space radius
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
        const viewW = cw / this.camera.zoom;
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

            // Clamp strictly to the minimap's coordinate bounds
            const clampedX = Math.max(objMinX, Math.min(objMaxX, l.x));
            const clampedY = Math.max(objMinY, Math.min(objMaxY, l.y));

            ctx.fillStyle = l.crashed ? '#ef4444' : '#10b981';
            ctx.beginPath();
            ctx.arc(clampedX, clampedY, dotR, 0, Math.PI * 2);
            ctx.fill();

            // Small heading tick
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

        // ── Label ──────────────────────────────────────────────────────────
        ctx.save();
        ctx.font = '600 9px Outfit, sans-serif';
        ctx.letterSpacing = '0.1em';
        ctx.fillStyle = 'rgba(56,189,248,0.6)';
        ctx.textAlign = 'left';
        ctx.fillText('RADAR', mmX + 8, mmY + 13);
        ctx.restore();
        
        ctx.restore(); // Restore outer scale and translate
    }

,
drawQuestPanel() {
        if (this.uiCollapsed) return;
        const ctx = this.ctx;
        const level = levels[this.currentLevelIndex];
        if (!level || !level.quests) return;

        const cw = this.canvas.width;
        const isMobile = cw < 768;
        const isTiny = cw < 500;

        // Calculate layout dynamically to fix spacing
        const px = isMobile ? 8 : 16;
        const py = isMobile ? 52 : 64;
        const panelW = isTiny ? 160 : (isMobile ? 200 : 260);
        const lineH = isTiny ? 18 : (isMobile ? 20 : 24);
        const statLineH = isTiny ? 14 : 18;
        
        // 16(top) + 16(Mission) + 16(Title) + 12(Divider) + quests + 14(Divider+gap) + stats + 16(bottom)
        const panelH = 16 + 16 + 16 + 12 + (level.quests.length * lineH) + 14 + (statLineH * 3) + 16;
        // Read by drawNotifications() to anchor tutorial hint chips just below this
        // panel instead of guessing its height (one-frame-stale is imperceptible).
        this._questPanelBottomY = py + panelH;

        ctx.save();
        // Translate to top-left anchor and scale
        ctx.translate(px, py);
        ctx.scale(this.uiScale || 1.0, this.uiScale || 1.0);
        ctx.translate(-px, -py);

        // Panel background
        ctx.fillStyle = 'rgba(8, 12, 26, 0.88)';
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(px, py, panelW, panelH, 10);
        else ctx.rect(px, py, panelW, panelH);
        ctx.fill();
        ctx.stroke();

        let curY = py + 16;

        // Mission label
        ctx.font = isTiny ? '600 9px Outfit, sans-serif' : '600 11px Outfit, sans-serif';
        ctx.letterSpacing = '0.12em';
        ctx.fillStyle = 'rgba(56,189,248,0.75)';
        ctx.textAlign = 'left';
        ctx.fillText('MISSION', px + (isTiny ? 8 : 12), curY);
        curY += 16;

        // Mission name
        ctx.font = isTiny ? '700 11px Outfit, sans-serif' : '700 13px Outfit, sans-serif';
        ctx.letterSpacing = '0';
        ctx.fillStyle = 'rgba(248,250,252,0.95)';
        ctx.fillText(level.missionTitle || level.name, px + (isTiny ? 8 : 12), curY, panelW - (isTiny ? 16 : 24));
        curY += 12;

        // Divider
        ctx.strokeStyle = 'rgba(255,255,255,0.08)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(px + (isTiny ? 6 : 10), curY - 4);
        ctx.lineTo(px + panelW - (isTiny ? 6 : 10), curY - 4);
        ctx.stroke();
        curY += 12;

        // Quest items
        for (let i = 0; i < level.quests.length; i++) {
            const q = level.quests[i];
            const state = this.questState[q.id];
            const isPrimary = q.type === 'primary';

            let icon, iconColor;
            if (q.id === 'primary' && this.deliveredCount >= level.targetCargo) {
                icon = '✓'; iconColor = '#10b981';
            } else if (state?.completed) {
                icon = '✓'; iconColor = '#10b981';
            } else if (state?.failed) {
                icon = '✗'; iconColor = '#ef4444';
            } else {
                icon = isPrimary ? '◆' : '◇'; iconColor = isPrimary ? '#38bdf8' : '#94a3b8';
            }

            ctx.font = isTiny ? '700 11px monospace' : '700 13px monospace';
            ctx.fillStyle = iconColor;
            ctx.fillText(icon, px + (isTiny ? 8 : 12), curY);

            ctx.font = isPrimary ? (isTiny ? '600 10px Outfit, sans-serif' : '600 12px Outfit, sans-serif') : (isTiny ? '400 10px Outfit, sans-serif' : '400 12px Outfit, sans-serif');
            ctx.fillStyle = state?.failed ? 'rgba(239,68,68,0.75)' :
                (state?.completed ? 'rgba(16,185,129,0.9)' :
                    (isPrimary ? 'rgba(248,250,252,0.92)' : 'rgba(148,163,184,0.85)'));
            ctx.fillText(q.text + (q.reward ? `  +$${q.reward}` : ''), px + (isTiny ? 22 : 28), curY, panelW - (isTiny ? 30 : 40));
            
            curY += lineH;
        }

        // --- Mission Stats Divider ---
        curY += 4;
        ctx.strokeStyle = 'rgba(255,255,255,0.08)';
        ctx.beginPath();
        ctx.moveTo(px + (isTiny ? 6 : 10), curY - 10);
        ctx.lineTo(px + panelW - (isTiny ? 6 : 10), curY - 10);
        ctx.stroke();
        curY += 6; // breathing room so "Cargo:" doesn't crowd the divider above it

        ctx.font = isTiny ? '600 10px Outfit, sans-serif' : '600 12px Outfit, sans-serif';

        // Cargo
        ctx.fillStyle = '#f8fafc';
        ctx.fillText(`Cargo: ${this.deliveredCount}/${level.targetCargo}`, px + (isTiny ? 8 : 12), curY);
        curY += statLineH;

        // Budget
        ctx.fillStyle = '#10b981';
        ctx.fillText(`Budget: $${Math.floor(this.missionBudget)}`, px + (isTiny ? 8 : 12), curY);
        curY += statLineH;

        // Time
        if (this.overtimeActive) {
            const ot = Math.ceil(this.overtimeTimer);
            ctx.fillStyle = (Math.floor(Date.now() / 300) % 2 === 0) ? '#ef4444' : '#fbbf24';
            ctx.font = isTiny ? '700 11px monospace' : '700 13px monospace';
            ctx.fillText(`Time: ! ${ot}s`, px + (isTiny ? 8 : 12), curY);
        } else {
            const totalS = Math.floor(this.missionTimer || 0);
            const m = Math.floor(totalS / 60);
            const s = totalS % 60;
            const timeStr = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
            ctx.fillStyle = totalS < 20 ? '#ef4444' : '#f59e0b';
            ctx.font = isTiny ? '700 11px monospace' : '700 13px monospace';
            ctx.fillText(`Time: ${timeStr}`, px + (isTiny ? 8 : 12), curY);
        }

        ctx.restore();
    }

,
drawRadarPingZone() {
        if (this.uiCollapsed) return;
        const cfg = this.physics.currentLevelConfig;
        const zone = cfg?.radarPingZone;
        if (!zone) return;

        const ctx = this.ctx;
        const { cx, cy } = zone;
        const maxR = zone.r ?? 300;
        const color = zone.color ?? '210,100,15';
        const period = zone.period ?? 3800;
        const now = Date.now();

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
            const alpha = Math.pow(1 - t, 1.6) * 0.30;
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
            ctx.shadowColor = 'rgba(255,200,0,0.7)';
            ctx.shadowBlur = 8;
            ctx.fillText('▼', ax, ay);
            ctx.shadowBlur = 0;
            ctx.font = 'bold 11px Outfit, sans-serif';
            ctx.fillStyle = 'rgba(255,255,255,0.9)';
            ctx.fillText(label, ax, ay + 16);
            ctx.restore();
        };

        let targetX, targetY;
        let isHQReturn = false;
        
        if (allDelivered) {
            if (level.startPad) {
                targetX = level.startPad.x + level.startPad.w / 2;
                targetY = level.startPad.y;
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
        const ctx = this.ctx;

        // Tutorial hints read as small compact chips tucked under the mission panel
        // instead of big center-screen banners, which felt disconnected/intrusive.
        const tutorials = this.messages.filter(m => m.text.startsWith('TUTORIAL:'));
        const others = this.messages.filter(m => !m.text.startsWith('TUTORIAL:'));

        if (tutorials.length && !this.uiCollapsed) {
            const isMobile = this.canvas.width < 768;
            const px = isMobile ? 8 : 16;
            // Anchor just below the mission panel's actual bottom edge (computed by
            // drawQuestPanel last frame), falling back to a rough estimate if unset.
            const py = (this._questPanelBottomY || ((isMobile ? 52 : 64) + 160)) + 8;
            const panelW = this.canvas.width < 500 ? 160 : (isMobile ? 200 : 260);
            const fontSize = 11;
            ctx.font = `600 ${fontSize}px Outfit, sans-serif`;
            ctx.textAlign = 'left';

            for (let i = 0; i < tutorials.length; i++) {
                const m = tutorials[i];
                const label = m.text.replace('TUTORIAL: ', '');
                const y = py + i * (fontSize + 14);

                ctx.globalAlpha = m.life * 0.85;
                ctx.fillStyle = 'rgba(6, 20, 16, 0.85)';
                ctx.strokeStyle = 'rgba(52, 211, 153, 0.4)';
                ctx.lineWidth = 1;
                const ph = fontSize + 10;
                ctx.beginPath();
                if (ctx.roundRect) ctx.roundRect(px, y, panelW, ph, 8);
                else ctx.rect(px, y, panelW, ph);
                ctx.fill();
                ctx.stroke();

                ctx.globalAlpha = m.life;
                ctx.fillStyle = m.color;
                ctx.fillText('💡 ' + label, px + 8, y + ph - 7, panelW - 16);
            }
            ctx.globalAlpha = 1.0;
        }

        if (!others.length) return;
        ctx.textAlign = 'center';

        // Use a much larger, more readable font
        const fontSize = this.canvas.width < 500 ? 16 : 22;
        ctx.font = `bold ${fontSize}px Outfit, sans-serif`;

        for (let i = 0; i < others.length; i++) {
            const m = others[i];
            const spacing = fontSize + 16;
            const y = m.y - (i * spacing);
            const tw = ctx.measureText(m.text).width;

            // Backdrop pill
            ctx.globalAlpha = m.life * 0.72;
            ctx.fillStyle = 'rgba(5, 8, 18, 0.82)';
            const pw = tw + 36, ph = fontSize + 12;
            const px = this.canvas.width / 2 - pw / 2;
            ctx.beginPath();
            if (ctx.roundRect) ctx.roundRect(px, y - fontSize + 2, pw, ph, 14);
            else ctx.rect(px, y - fontSize + 2, pw, ph);
            ctx.fill();

            // Text
            ctx.globalAlpha = m.life;
            ctx.fillStyle = m.color;
            ctx.fillText(m.text, this.canvas.width / 2, y);
        }
        ctx.globalAlpha = 1.0;
    }

,
drawWindIndicator() {
        const ctx = this.ctx;
        const baseWind = this.physics.wind;
        if (Math.abs(baseWind) < 0.05) return;

        const currentWind = this.physics.currentWind || baseWind;
        const dir = baseWind > 0 ? 1 : -1;
        const absBase = Math.abs(baseWind);
        
        // Smooth the readout so it doesn't jitter rapidly
        if (this._windDisplaySmooth === undefined) this._windDisplaySmooth = Math.abs(currentWind);
        this._windDisplaySmooth += (Math.abs(currentWind) - this._windDisplaySmooth) * 0.06;
        const absCurrent = this._windDisplaySmooth;
        const gustRatio = absCurrent / (absBase || 1); 

        // Determine color from strength: cyan → yellow → red
        const str = Math.min(1, absBase / 0.4);
        const r = Math.round(56 + str * 199);
        const g = Math.round(189 - str * 89);
        const b = Math.round(248 - str * 248);

        const cx = this.canvas.width / 2;
        const cy = 80;

        // ── Background pill ────────────────────────────────────────────────
        const pillW = 140, pillH = 26;
        ctx.save();
        ctx.translate(cx, cy);
        ctx.scale(this.uiScale || 1.0, this.uiScale || 1.0);
        ctx.translate(-cx, -cy);
        
        ctx.fillStyle = 'rgba(0,10,30,0.55)';
        ctx.strokeStyle = `rgba(${r},${g},${b},0.35)`;
        ctx.lineWidth = 1;
        if (ctx.roundRect) ctx.roundRect(cx - pillW / 2, cy - pillH - 2, pillW, pillH, 6);
        else ctx.rect(cx - pillW / 2, cy - pillH - 2, pillW, pillH);
        ctx.fill(); ctx.stroke();

        // ── Label ─────────────────────────────────────────────────────────
        ctx.fillStyle = `rgba(${r},${g},${b},0.9)`;
        ctx.font = '600 12px Outfit, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const gustLabel = gustRatio > 1.25 ? ' (GUSTING)' : '';
        ctx.fillText(`${dir > 0 ? '▶' : '◀'} ${(absCurrent * 10).toFixed(1)} m/s${gustLabel}`, cx, cy - pillH / 2 - 2);

        ctx.restore();
    }

});
