// render/entities.js — hazards, cargo boxes, background buildings, collectibles.
// Prototype-mixin on CargoGame (see render.js header).
Object.assign(CargoGame.prototype, {
drawHazards(bgMode = false) {
        // Hazards are hand-authored polygons now (was a {x,y,radius} circle) — see
        // physics.js's pointInPolygon-based hazard check.
        if (!this.physics.hazards || this.physics.hazards.length === 0) return;
        const ctx = this.ctx;
        const now = performance.now();

        ctx.save();
        for (const haz of this.physics.hazards) {
            if (!!haz.behindTerrain !== bgMode) continue;
            
            if (haz.type === 'laser') {
                const pts = haz.pts;
                if (!pts || pts.length < 2) continue;
                const [a, b] = pts;
                const state = haz.laserState || {};
                
                const baseColor = haz.color || '#7e22ce';
                const beamColor = haz.color || '#f472b6';

                // Emitter anchors
                ctx.fillStyle = baseColor;
                ctx.beginPath(); ctx.arc(a.x, a.y, 6, 0, Math.PI * 2); ctx.fill();
                ctx.beginPath(); ctx.arc(b.x, b.y, 6, 0, Math.PI * 2); ctx.fill();

                if (state.active) {
                    // Firing: bright pulsing core beam + wide glow
                    ctx.strokeStyle = beamColor;
                    ctx.globalAlpha = 0.25 + Math.sin(now / 60) * 0.1;
                    ctx.lineWidth = (haz.thickness || 14) * 2;
                    ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
                    ctx.globalAlpha = 1.0;

                    ctx.strokeStyle = '#fdf4ff';
                    ctx.lineWidth = 3;
                    ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
                } else if (state.charging) {
                    // Telegraph: fast-flashing thin line before the beam fires
                    const flash = Math.sin(now / 40) > 0;
                    ctx.strokeStyle = beamColor;
                    ctx.globalAlpha = flash ? 0.8 : 0.15;
                    ctx.lineWidth = 2;
                    ctx.setLineDash([6, 6]);
                    ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
                    ctx.setLineDash([]);
                    ctx.globalAlpha = 1.0;
                } else {
                    // Idle: faint dashed guide line
                    ctx.strokeStyle = baseColor;
                    ctx.globalAlpha = 0.25;
                    ctx.lineWidth = 1.5;
                    ctx.setLineDash([4, 10]);
                    ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
                    ctx.setLineDash([]);
                    ctx.globalAlpha = 1.0;
                }
                continue;
            }
            
            if (haz.type === 'crusher') {
                if (!haz.pts || haz.pts.length < 2) continue;
                const p1 = haz.pts[0];
                const p2 = haz.pts[1];
                const dx = p2.x - p1.x;
                const dy = p2.y - p1.y;
                let dist = Math.hypot(dx, dy);
                if (dist < 1) dist = 1;
                
                const ux = dx / dist;
                const uy = dy / dist;
                
                const thickness = haz.thickness || 40;
                const cColor = haz.color || '#ef4444';
                
                // Get progress from physics, or calculate if missing (editor)
                let progress = 0;
                if (haz.zoneState && haz.zoneState.progress !== undefined) {
                    progress = haz.zoneState.progress;
                } else {
                    const waitU = haz.waitUnloadedMs || 1000;
                    const crushT = haz.crushMs || 200;
                    const waitL = haz.waitLoadedMs || 500;
                    const retractT = haz.retractMs || 1500;
                    const cycle = waitU + crushT + waitL + retractT;
                    const timeMs = (this.physics ? this.physics.hazardTime : performance.now()) + (haz.phaseOffset || 0);
                    const t = timeMs % cycle;
                    if (t < waitU) progress = 0;
                    else if (t < waitU + crushT) progress = (t - waitU) / crushT;
                    else if (t < waitU + crushT + waitL) progress = 1.0;
                    else progress = 1.0 - (t - waitU - crushT - waitL) / retractT;
                    progress = 0.5 - 0.5 * Math.cos(progress * Math.PI);
                }
                
                // Draw track
                ctx.save();
                ctx.translate(p1.x, p1.y);
                ctx.rotate(Math.atan2(uy, ux));
                ctx.strokeStyle = '#374151'; // dark rail
                ctx.lineWidth = thickness + 4;
                ctx.beginPath(); ctx.moveTo(-20, 0); ctx.lineTo(dist + 20, 0); ctx.stroke();
                ctx.strokeStyle = '#111827'; // inner groove
                ctx.lineWidth = thickness - 8;
                if (ctx.lineWidth > 0) ctx.stroke();
                ctx.restore();
                
                const drawCrusherBlock = () => {
                    const depth = dist / 2 + 30;
                    const rightEdge = (dist / 2) * progress;
                    const leftEdge = Math.max(0, rightEdge - depth);
                    const drawWidth = rightEdge - leftEdge;
                    
                    if (drawWidth > 0) {
                        ctx.fillStyle = '#4b5563';
                        ctx.fillRect(leftEdge, -thickness/2, drawWidth, thickness);
                        
                        ctx.strokeStyle = cColor;
                        ctx.lineWidth = 2;
                        ctx.strokeRect(leftEdge, -thickness/2, drawWidth, thickness);
                        
                        ctx.save();
                        ctx.beginPath(); ctx.rect(leftEdge, -thickness/2, drawWidth, thickness); ctx.clip();
                        ctx.fillStyle = cColor;
                        const stripeW = 10;
                        for (let x = leftEdge - thickness; x < rightEdge; x += stripeW * 2) {
                            ctx.beginPath();
                            ctx.moveTo(x, -thickness/2);
                            ctx.lineTo(x + stripeW, -thickness/2);
                            ctx.lineTo(x + stripeW - thickness, thickness/2);
                            ctx.lineTo(x - thickness, thickness/2);
                            ctx.fill();
                        }
                        ctx.restore();
                    }
                    
                    ctx.strokeStyle = '#fff';
                    ctx.lineWidth = 3;
                    ctx.beginPath(); ctx.moveTo(rightEdge, -thickness/2); ctx.lineTo(rightEdge, thickness/2); ctx.stroke();
                };
                
                // Draw Crusher 1
                ctx.save();
                ctx.translate(p1.x, p1.y);
                ctx.rotate(Math.atan2(uy, ux));
                drawCrusherBlock();
                ctx.restore();
                
                // Draw Crusher 2
                ctx.save();
                ctx.translate(p2.x, p2.y);
                ctx.rotate(Math.atan2(-uy, -ux));
                drawCrusherBlock();
                ctx.restore();
                
                continue;
            }

            const pts = haz.pts;
            if (!pts || pts.length < 3) continue;

            if (haz.type === 'incinerator') {
                const state = haz.zoneState || {};
                const drawPoly = () => {
                    ctx.beginPath();
                    pts.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
                    ctx.closePath();
                };

                if (state.active) {
                    // Firing: bright pulsing fill + rising embers
                    const pulse = 0.55 + Math.sin(now / 90) * 0.15;
                    drawPoly();
                    ctx.fillStyle = `rgba(249,115,22,${pulse * 0.5})`;
                    ctx.fill();
                    ctx.strokeStyle = '#fde047';
                    ctx.lineWidth = 2;
                    ctx.stroke();

                    const c = this.physics.polygonCentroid(pts);
                    const bounds = pts.reduce((b, p) => ({
                        minX: Math.min(b.minX, p.x), maxX: Math.max(b.maxX, p.x),
                        minY: Math.min(b.minY, p.y), maxY: Math.max(b.maxY, p.y),
                    }), { minX: c.x, maxX: c.x, minY: c.y, maxY: c.y });
                    for (let i = 0; i < 8; i++) {
                        const ex = bounds.minX + ((now / 15 + i * 137) % (bounds.maxX - bounds.minX || 1));
                        const ey = bounds.maxY - ((now / 8 + i * 89) % (bounds.maxY - bounds.minY || 1));
                        ctx.fillStyle = `rgba(253,224,71,${0.4 + 0.3 * Math.sin(now / 50 + i)})`;
                        ctx.beginPath();
                        ctx.arc(ex, ey, 1.5, 0, Math.PI * 2);
                        ctx.fill();
                    }
                } else if (state.charging) {
                    // Telegraph: fast-flashing warning fill before it ignites
                    const flash = Math.sin(now / 40) > 0;
                    drawPoly();
                    ctx.fillStyle = flash ? 'rgba(249,115,22,0.35)' : 'rgba(249,115,22,0.08)';
                    ctx.fill();
                    ctx.strokeStyle = '#fb923c';
                    ctx.globalAlpha = flash ? 0.9 : 0.3;
                    ctx.lineWidth = 2;
                    ctx.setLineDash([6, 6]);
                    ctx.stroke();
                    ctx.setLineDash([]);
                    ctx.globalAlpha = 1.0;
                } else {
                    // Idle: faint dashed outline, no fill
                    drawPoly();
                    ctx.strokeStyle = 'rgba(249,115,22,0.25)';
                    ctx.lineWidth = 1.5;
                    ctx.setLineDash([4, 8]);
                    ctx.stroke();
                    ctx.setLineDash([]);
                }
                continue;
            }

            if (haz.type === 'sandworm') {
                ctx.beginPath();
                pts.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
                ctx.closePath();
                ctx.fillStyle = 'rgba(217, 119, 6, 0.05)'; // very faint sandy color
                ctx.fill();
                ctx.strokeStyle = 'rgba(217, 119, 6, 0.2)'; // faint outline
                ctx.lineWidth = 1;
                ctx.setLineDash([4, 4]);
                ctx.stroke();
                ctx.setLineDash([]);
                continue;
            } else if (haz.type === 'repulsor') {
                ctx.beginPath();
                pts.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
                ctx.closePath();
                ctx.fillStyle = haz.color || 'rgba(14, 165, 233, 0.1)';
                ctx.fill();
                const c = this.physics.polygonCentroid(pts);
                const fx = haz.travelX || 0;
                const fy = haz.travelY || -15;
                const windSpeed = Math.sqrt(fx*fx + fy*fy);
                ctx.save();
                ctx.translate(c.x, c.y);
                ctx.rotate(Math.atan2(fy, fx));
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
                ctx.lineWidth = 2;
                const w = (now / 15) % 20;
                ctx.beginPath();
                ctx.moveTo(-10 + w, 0);
                ctx.lineTo(10 + w, 0);
                ctx.moveTo(5 + w, -5);
                ctx.lineTo(10 + w, 0);
                ctx.lineTo(5 + w, 5);
                ctx.stroke();
                ctx.restore();
                continue;
            } else if (haz.type === 'bouncer') {
                ctx.beginPath();
                pts.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
                ctx.closePath();
                ctx.fillStyle = haz.color || 'rgba(217, 70, 239, 0.3)';
                ctx.fill();
                ctx.strokeStyle = haz.color || 'rgba(217, 70, 239, 0.8)';
                ctx.lineWidth = 2 + Math.sin(now / 150) * 1;
                ctx.stroke();
                const c = this.physics.polygonCentroid(pts);
                ctx.beginPath();
                ctx.arc(c.x, c.y, 8 + Math.sin(now / 150) * 2, 0, Math.PI * 2);
                ctx.fillStyle = '#fff';
                ctx.globalAlpha = 0.5;
                ctx.fill();
                ctx.globalAlpha = 1;
                continue;
            } else if (haz.type === 'gravwell') {
                continue;
            }

            const c = this.physics.polygonCentroid(pts);
            // Average vertex-to-centroid distance stands in for the old "radius",
            // sizing the pulsing core/spikes to roughly match the polygon's extent.
            const r = pts.reduce((s, p) => s + Math.hypot(p.x - c.x, p.y - c.y), 0) / pts.length;

            // Hazard zone outline — the actual polygon boundary used for the physics check
            ctx.beginPath();
            pts.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
            ctx.closePath();
            ctx.fillStyle = `rgba(239, 68, 68, ${0.1 + Math.sin(now / 200) * 0.05})`;
            ctx.fill();
            ctx.strokeStyle = `rgba(239, 68, 68, ${0.5 + Math.sin(now / 100) * 0.3})`;
            ctx.lineWidth = 2;
            ctx.stroke();

            // Inner pulsing core at the centroid
            ctx.beginPath();
            ctx.arc(c.x, c.y, r * 0.3, 0, Math.PI * 2);
            ctx.fillStyle = '#fca5a5';
            ctx.fill();

            // Rotating spikes around the centroid
            ctx.translate(c.x, c.y);
            ctx.rotate(now / 800);
            ctx.fillStyle = '#ef4444';
            for (let i = 0; i < 4; i++) {
                ctx.beginPath();
                ctx.moveTo(-4, -r * 0.2);
                ctx.lineTo(4, -r * 0.2);
                ctx.lineTo(0, -r - 5);
                ctx.closePath();
                ctx.fill();
                ctx.rotate(Math.PI / 2);
            }
            ctx.rotate(-now / 800);
            ctx.translate(-c.x, -c.y);
        }
        ctx.restore();
    }

,
drawBoxes() {
        for (const box of this.physics.boxes) {
            this.drawSingleBox(box.x, box.y, box.type, box.emoji, box);
        }
    }

,
drawSingleBox(x, y, type, emoji, box) {
        const ctx = this.ctx;
        const S = (box && box.size) || this.physics.BOX_SIZE;
        const halfS = S / 2;

        // Only colour-code when the level has multiple cargo types
        const allowedTypes = this.physics.currentLevelConfig?.allowedTypes;
        const multiType = allowedTypes && allowedTypes.length > 1;

        let fillColor = '#334155';
        let borderColor = '#64748b';
        if (multiType) {
            if (type === 'normal') { fillColor = '#0369a1'; borderColor = '#38bdf8'; }
            else if (type === 'red') { fillColor = '#991b1b'; borderColor = '#f87171'; }
            else if (type === 'blue') { fillColor = '#1e3a8a'; borderColor = '#60a5fa'; }
            else if (type === 'green') { fillColor = '#14532d'; borderColor = '#4ade80'; }
        }
        // Big/oversized crates get a distinct amber-striped treatment regardless
        // of cargo type, so they read as "special" at a glance on the deck.
        if (box && box.big) { fillColor = '#78350f'; borderColor = '#f59e0b'; }

        const iconText = emoji || (type === 'red' ? '⚠️' : type === 'blue' ? '❄️' : type === 'green' ? '♻️' : '📦');

        ctx.save();
        ctx.translate(x, y);

        const grad = ctx.createLinearGradient(0, -halfS, 0, halfS);
        grad.addColorStop(0, fillColor);
        grad.addColorStop(1, fillColor);
        ctx.fillStyle = grad;
        ctx.fillRect(-halfS, -halfS, S, S);

        ctx.fillStyle = 'rgba(255,255,255,0.15)';
        ctx.fillRect(-halfS, -halfS, S, 4);

        ctx.strokeStyle = borderColor;
        ctx.lineWidth = 1.5;
        ctx.strokeRect(-halfS + 0.75, -halfS + 0.75, S - 1.5, S - 1.5);

        ctx.font = `${Math.round(S * 0.75)}px "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(iconText, 0, 1.5);

        ctx.restore();

        // Fire overlay when burning
        if (box && (box.fireTimer || 0) > 30) {
            this._drawBoxFire(ctx, x, y, halfS, Math.min(1, (box.fireTimer - 30) / 90));
        }
    }

,
_drawBoxFire(ctx, x, y, halfS, intensity) {
        const now = Date.now();
        ctx.save();
        ctx.translate(x, y - halfS);
        for (let f = 0; f < 4; f++) {
            const fx = (f / 3 - 0.5) * halfS * 1.4 + Math.sin(now * 0.009 + f * 1.7) * halfS * 0.4;
            const fh = halfS * 2.2 * intensity * (0.6 + Math.sin(now * 0.012 + f * 2.3) * 0.4);
            const fg = ctx.createLinearGradient(fx, 0, fx, -fh);
            fg.addColorStop(0, `rgba(239,68,68,${intensity * 0.95})`);
            fg.addColorStop(0.4, `rgba(251,146,60,${intensity * 0.75})`);
            fg.addColorStop(1, 'rgba(253,224,71,0)');
            ctx.fillStyle = fg;
            ctx.beginPath();
            ctx.moveTo(fx - halfS * 0.45, 0);
            ctx.quadraticCurveTo(fx - halfS * 0.1, -fh * 0.5, fx, -fh);
            ctx.quadraticCurveTo(fx + halfS * 0.1, -fh * 0.5, fx + halfS * 0.45, 0);
            ctx.closePath(); ctx.fill();
        }
        ctx.restore();
    }

,
drawBuildings() {
        if (!this.buildings || this.buildings.length === 0) return;
        const ctx = this.ctx;

        for (const b of this.buildings) {
            ctx.save();
            ctx.translate(b.x, b.y);

            if (b.type === 'antenna') {
                // Antenna tower: tall mast with cross-arms and blinking beacon
                const mh = b.h;
                // Mast
                ctx.strokeStyle = '#334155';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(0, -mh);
                ctx.stroke();
                // Cross-arms at intervals
                for (let ay = mh * 0.3; ay < mh; ay += mh * 0.22) {
                    const aw = (mh - ay) * 0.55;
                    ctx.lineWidth = 1.5;
                    ctx.beginPath();
                    ctx.moveTo(-aw, -mh + ay);
                    ctx.lineTo(aw, -mh + ay);
                    ctx.stroke();
                    // Guy wires
                    ctx.strokeStyle = 'rgba(71,85,105,0.5)';
                    ctx.lineWidth = 0.8;
                    ctx.beginPath();
                    ctx.moveTo(-aw, -mh + ay);
                    ctx.lineTo(0, 0);
                    ctx.moveTo(aw, -mh + ay);
                    ctx.lineTo(0, 0);
                    ctx.stroke();
                    ctx.strokeStyle = '#334155';
                }
                // Blinking beacon at top
                const blink = Math.sin(Date.now() * 0.004 + b.phase) > 0.2;
                if (blink) {
                    const bg = ctx.createRadialGradient(0, -mh, 0, 0, -mh, 8);
                    bg.addColorStop(0, 'rgba(239,68,68,0.9)');
                    bg.addColorStop(1, 'rgba(239,68,68,0)');
                    ctx.fillStyle = bg;
                    ctx.beginPath();
                    ctx.arc(0, -mh, 8, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.fillStyle = '#ef4444';
                    ctx.beginPath();
                    ctx.arc(0, -mh, 3, 0, Math.PI * 2);
                    ctx.fill();
                }

            } else if (b.type === 'silo') {
                // Industrial storage silo (cylindrical tower)
                const sw = b.w, sh = b.h;
                // Body
                const siloGrad = ctx.createLinearGradient(-sw / 2, 0, sw / 2, 0);
                siloGrad.addColorStop(0, '#1e293b');
                siloGrad.addColorStop(0.4, '#334155');
                siloGrad.addColorStop(1, '#1e293b');
                ctx.fillStyle = siloGrad;
                ctx.strokeStyle = '#475569';
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.rect(-sw / 2, -sh, sw, sh);
                ctx.fill();
                ctx.stroke();
                // Dome cap
                ctx.beginPath();
                ctx.ellipse(0, -sh, sw / 2, sw * 0.22, 0, Math.PI, 0);
                ctx.fillStyle = '#334155';
                ctx.fill();
                ctx.stroke();
                // Horizontal band stripes
                ctx.strokeStyle = 'rgba(56,189,248,0.2)';
                ctx.lineWidth = 1;
                for (let bh2 = sh * 0.2; bh2 < sh; bh2 += sh * 0.22) {
                    ctx.beginPath();
                    ctx.moveTo(-sw / 2, -bh2);
                    ctx.lineTo(sw / 2, -bh2);
                    ctx.stroke();
                }
                // Warning lights at corners
                const wl = Math.sin(Date.now() * 0.003 + b.phase + 1) > 0;
                if (wl) {
                    ctx.fillStyle = '#f59e0b';
                    ctx.beginPath();
                    ctx.arc(-sw / 2, -sh, 3, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.beginPath();
                    ctx.arc(sw / 2, -sh, 3, 0, Math.PI * 2);
                    ctx.fill();
                }

            } else if (b.type === 'refinery') {
                // Industrial refinery cluster: multiple vertical pipes + platform
                const rw = b.w;
                // Base platform
                ctx.fillStyle = '#1e293b';
                ctx.strokeStyle = '#334155';
                ctx.lineWidth = 2;
                ctx.fillRect(-rw / 2, -8, rw, 8);
                ctx.strokeRect(-rw / 2, -8, rw, 8);
                // Three pipes of varying height
                const pipes = [
                    { ox: -rw * 0.32, pw: 8, ph: b.h * 0.9 },
                    { ox: 0, pw: 11, ph: b.h },
                    { ox: rw * 0.3, pw: 7, ph: b.h * 0.65 },
                ];
                for (const p of pipes) {
                    const pg = ctx.createLinearGradient(p.ox - p.pw / 2, 0, p.ox + p.pw / 2, 0);
                    pg.addColorStop(0, '#0f172a');
                    pg.addColorStop(0.5, '#334155');
                    pg.addColorStop(1, '#0f172a');
                    ctx.fillStyle = pg;
                    ctx.strokeStyle = '#475569';
                    ctx.lineWidth = 1;
                    ctx.fillRect(p.ox - p.pw / 2, -8 - p.ph, p.pw, p.ph);
                    ctx.strokeRect(p.ox - p.pw / 2, -8 - p.ph, p.pw, p.ph);
                    // Pipe cap
                    ctx.fillStyle = '#334155';
                    ctx.beginPath();
                    ctx.ellipse(p.ox, -8 - p.ph, p.pw / 2 + 1, 3, 0, 0, Math.PI * 2);
                    ctx.fill();
                    // Steam vent (random flicker)
                    if (Math.sin(Date.now() * 0.005 + p.ox + b.phase) > 0.5) {
                        ctx.strokeStyle = 'rgba(148,163,184,0.35)';
                        ctx.lineWidth = p.pw * 0.6;
                        ctx.lineCap = 'round';
                        ctx.beginPath();
                        ctx.moveTo(p.ox, -8 - p.ph - 2);
                        ctx.lineTo(p.ox + (Math.random() - 0.5) * 6, -8 - p.ph - 14 - Math.random() * 8);
                        ctx.stroke();
                        ctx.lineCap = 'butt';
                    }
                }
                // Connecting walkway
                ctx.strokeStyle = '#475569';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(-rw * 0.32, -8 - b.h * 0.4);
                ctx.lineTo(rw * 0.3, -8 - b.h * 0.4);
                ctx.stroke();
            }

            ctx.restore();
        }
    }

,
drawCollectibles() {
        if (!this.physics.collectibles || this.physics.collectibles.length === 0) return;
        const ctx = this.ctx;
        ctx.save();
        for (const c of this.physics.collectibles) {
            if (c.type === 'ring') {
                ctx.strokeStyle = '#fbbf24'; // amber-400
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.arc(c.x, c.y, c.radius || 20, 0, Math.PI * 2);
                ctx.stroke();
                // inner glow
                ctx.strokeStyle = 'rgba(251, 191, 36, 0.4)';
                ctx.lineWidth = 8;
                ctx.stroke();
            } else if (c.type === 'cash') {
                const r = c.radius || 24;
                const bob = Math.sin(Date.now() * 0.003 + c.x) * 3;
                const cy = c.y + bob;
                // coin body
                const grad = ctx.createRadialGradient(c.x - r * 0.3, cy - r * 0.3, r * 0.1, c.x, cy, r);
                grad.addColorStop(0, '#fde68a');
                grad.addColorStop(0.7, '#facc15');
                grad.addColorStop(1, '#b45309');
                ctx.fillStyle = grad;
                ctx.beginPath();
                ctx.arc(c.x, cy, r, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = '#92400e';
                ctx.lineWidth = 2;
                ctx.stroke();
                // dollar sign
                ctx.fillStyle = '#92400e';
                ctx.font = `bold ${Math.round(r * 1.1)}px sans-serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('$', c.x, cy + 1);
                // faint pulse ring to signal "flythrough" pickup
                ctx.strokeStyle = 'rgba(250, 204, 21, 0.35)';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(c.x, cy, r + 6, 0, Math.PI * 2);
                ctx.stroke();
            }
        }
        ctx.restore();
    }

});
