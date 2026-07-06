Object.assign(CargoGame.prototype, {
drawHazards() {
        // Hazards are hand-authored polygons now (was a {x,y,radius} circle) — see
        // physics.js's pointInPolygon-based hazard check.
        if (!this.physics.hazards || this.physics.hazards.length === 0) return;
        const ctx = this.ctx;
        const now = performance.now();

        ctx.save();
        for (const haz of this.physics.hazards) {
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
                const timeMs = this.physics.hazardTime || 0;
                const phaseOff = haz.phase || 0;
                const period = haz.period || 3000;
                const t = (Math.sin(((timeMs + phaseOff) / period) * Math.PI * 2) + 1) / 2;
                const cx = haz.x + (haz.travelX || 0) * t;
                const cy = haz.y + (haz.travelY || 0) * t;
                
                const cColor = haz.color || '#ef4444';
                
                ctx.save();
                ctx.translate(cx, cy);
                
                // Draw metallic block
                ctx.fillStyle = '#4b5563';
                ctx.fillRect(0, 0, haz.w, haz.h);
                
                // Draw hazard stripes
                ctx.fillStyle = cColor;
                const stripeWidth = 20;
                ctx.beginPath();
                ctx.rect(0, 0, haz.w, haz.h);
                ctx.clip();
                
                for(let x = -haz.h; x < haz.w + haz.h; x += stripeWidth * 2) {
                    ctx.beginPath();
                    ctx.moveTo(x, 0);
                    ctx.lineTo(x + stripeWidth, 0);
                    ctx.lineTo(x - haz.h + stripeWidth, haz.h);
                    ctx.lineTo(x - haz.h, haz.h);
                    ctx.fill();
                }
                
                // Draw outline
                ctx.strokeStyle = cColor;
                ctx.lineWidth = 2;
                ctx.strokeRect(0, 0, haz.w, haz.h);
                
                ctx.restore();
                
                // Draw travel path indicator (faint line)
                ctx.save();
                ctx.setLineDash([5, 5]);
                ctx.strokeStyle = 'rgba(239, 68, 68, 0.2)';
                ctx.beginPath();
                ctx.moveTo(haz.x + haz.w/2, haz.y + haz.h/2);
                ctx.lineTo(haz.x + haz.w/2 + (haz.travelX||0), haz.y + haz.h/2 + (haz.travelY||0));
                ctx.stroke();
                ctx.restore();
                
                continue;
            }

            const pts = haz.pts;
            if (!pts || pts.length < 3) continue;

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
drawSourcingDepot() {
        const ctx = this.ctx;
        const start = this.physics.startDepot;
        const collection = this.physics.collectionPoint;
        const level = levels[this.currentLevelIndex];
        const allDelivered = level && this.deliveredCount >= level.targetCargo;

        // Draw landing-zone deployment circles around all pads
        const DEPLOY_R = 110;
        const lander = this.physics.lander;
        const _drawDeployCircle = (cx, padY, color) => { };

        if (start) _drawDeployCircle(start.x + start.width / 2, start.y, '#60a5fa');
        if (collection) _drawDeployCircle(collection.x + collection.width / 2, collection.y, '#34d399');
        for (const hub of this.physics.deliveryHubs) {
            _drawDeployCircle(hub.x + hub.width / 2, hub.y, hub.color || '#f59e0b');
        }

        // Draw Start Depot (HQ)
        if (start) {
            // Draw Hangar Background (Behind the pad)
            const hW = 120;
            const hH = 90;
            const hX = start.x + start.width/2 - hW/2;
            const hY = start.y - hH;
            
            ctx.save();
            // Hangar back wall
            ctx.fillStyle = '#0f172a';
            ctx.beginPath();
            ctx.moveTo(hX, start.y);
            ctx.lineTo(hX, hY + 30);
            ctx.lineTo(hX + hW/2, hY);
            ctx.lineTo(hX + hW, hY + 30);
            ctx.lineTo(hX + hW, start.y);
            ctx.fill();
            
            // Hangar roof outline
            ctx.strokeStyle = '#334155';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(hX - 5, hY + 32);
            ctx.lineTo(hX + hW/2, hY - 2);
            ctx.lineTo(hX + hW + 5, hY + 32);
            ctx.stroke();

            // Inner bay details
            ctx.fillStyle = '#0b0f19';
            ctx.fillRect(hX + 20, hY + 35, hW - 40, hH - 35);
            
            // Bay warning lights
            ctx.fillStyle = '#f59e0b';
            const blink = Math.sin(Date.now() * 0.005) > 0;
            if (blink) {
                ctx.fillStyle = '#ef4444';
            }
            ctx.beginPath(); ctx.arc(hX + 30, hY + 40, 2, 0, Math.PI*2); ctx.fill();
            ctx.beginPath(); ctx.arc(hX + hW - 30, hY + 40, 2, 0, Math.PI*2); ctx.fill();
            
            // Antenna on roof
            ctx.strokeStyle = '#475569';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(hX + 25, hY + 15);
            ctx.lineTo(hX + 25, hY - 15);
            ctx.stroke();
            ctx.fillStyle = '#ef4444';
            ctx.beginPath(); ctx.arc(hX + 25, hY - 15, 2, 0, Math.PI*2); ctx.fill();
            ctx.restore();

            // Landing Pad
            ctx.fillStyle = '#1e293b';
            ctx.fillRect(start.x, start.y, start.width, start.height);

            // Warning stripes on pad surface
            ctx.save();
            ctx.beginPath();
            ctx.rect(start.x, start.y, start.width, start.height);
            ctx.clip();
            const stripeW = 14;
            ctx.fillStyle = 'rgba(100, 120, 160, 0.25)';
            for (let sx = start.x - start.height; sx < start.x + start.width + start.height; sx += stripeW * 2) {
                ctx.beginPath();
                ctx.moveTo(sx, start.y + start.height);
                ctx.lineTo(sx + start.height, start.y);
                ctx.lineTo(sx + start.height + stripeW, start.y);
                ctx.lineTo(sx + stripeW, start.y + start.height);
                ctx.closePath();
                ctx.fill();
            }
            ctx.restore();

            // Top accent bar — pulses green when extraction ready
            if (allDelivered) {
                const pulse = 0.6 + Math.abs(Math.sin(Date.now() * 0.005)) * 0.4;
                ctx.fillStyle = `rgba(16, 185, 129, ${pulse})`;
            } else {
                ctx.fillStyle = '#94a3b8';
            }
            ctx.fillRect(start.x, start.y, start.width, 3);

            // Label
            ctx.fillStyle = allDelivered ? 'rgba(16,185,129,0.9)' : 'rgba(255,255,255,0.5)';
            ctx.font = '600 10px Outfit, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('HQ', start.x + start.width / 2, start.y + 11);

            // "EXTRACT HERE" beacon when all cargo delivered
            if (allDelivered) {
                const bpulse = 0.7 + Math.abs(Math.sin(Date.now() * 0.004)) * 0.3;
                ctx.save();
                ctx.fillStyle = `rgba(16, 185, 129, ${bpulse})`;
                ctx.font = 'bold 11px sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('▼ EXTRACT HERE ▼', start.x + start.width / 2, start.y - 28);

                // Landing light feedback
                let isHoveringHQ = false;
                const l = this.physics.lander;
                if (l && !l.crashed) {
                    if (l.x >= start.x - 20 && l.x <= start.x + start.width + 20 && l.y < start.y && l.y > start.y - 120) {
                        isHoveringHQ = true;
                    }
                }

                if (isHoveringHQ) {
                    ctx.fillStyle = '#10b981';
                    ctx.globalAlpha = 0.4 + Math.abs(Math.sin(Date.now() * 0.01)) * 0.3;
                    ctx.fillRect(start.x, start.y - 2, start.width, 4);
                    
                    const lightGrad = ctx.createLinearGradient(0, start.y - 30, 0, start.y);
                    lightGrad.addColorStop(0, 'rgba(0,0,0,0)');
                    lightGrad.addColorStop(1, '#10b981');
                    ctx.fillStyle = lightGrad;
                    ctx.fillRect(start.x, start.y - 30, start.width, 30);
                }
                ctx.globalAlpha = 1.0;
                ctx.restore();
            }
        }

        // Draw Collection Point — Space Warehouse with overhead crane
        if (collection) {
            const cx = collection.x, cy = collection.y;
            const cw = collection.width, ch = collection.height;
            const cpCx = cx + cw / 2;
            const now = Date.now();
            const cpulse = 0.4 + Math.abs(Math.sin(now * 0.003)) * 0.4;
            const _col = collection;

            // ── Warehouse building behind pad ─────────────────────────────
            const wbX = cx - 18, wbW = cw + 36, wbH = 80, wbY = cy - wbH;

            const bldGrad = ctx.createLinearGradient(wbX, wbY, wbX + wbW, wbY);
            bldGrad.addColorStop(0, '#0f1e2e');
            bldGrad.addColorStop(0.5, '#152434');
            bldGrad.addColorStop(1, '#0c1a28');
            ctx.fillStyle = bldGrad;
            ctx.strokeStyle = '#1e3a5f';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            if (ctx.roundRect) ctx.roundRect(wbX, wbY, wbW, wbH, [4, 4, 0, 0]);
            else ctx.rect(wbX, wbY, wbW, wbH);
            ctx.fill(); ctx.stroke();

            // Corrugated panels — vertical ribs
            ctx.strokeStyle = 'rgba(30,58,94,0.8)';
            ctx.lineWidth = 1;
            for (let rx = wbX + 12; rx < wbX + wbW - 4; rx += 12) {
                ctx.beginPath();
                ctx.moveTo(rx, wbY + 4); ctx.lineTo(rx, wbY + wbH - 2);
                ctx.stroke();
            }
            
            // Neon top edge
            ctx.strokeStyle = `rgba(14, 165, 233, ${0.4 + cpulse * 0.3})`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(wbX, wbY);
            ctx.lineTo(wbX + wbW, wbY);
            ctx.stroke();

            // Loading dock doors
            const doorW = wbW * 0.32, doorH = wbH * 0.52;
            for (const dOff of [0.18, 0.57]) {
                const dx = wbX + wbW * dOff, dy = wbY + wbH - doorH;
                ctx.fillStyle = '#060e18';
                ctx.strokeStyle = '#1e3a5f';
                ctx.lineWidth = 1.2;
                ctx.fillRect(dx, dy, doorW, doorH);
                ctx.strokeRect(dx, dy, doorW, doorH);
                ctx.strokeStyle = `rgba(56,189,248,${cpulse * 0.6})`;
                ctx.lineWidth = 1;
                ctx.strokeRect(dx + 2, dy + 2, doorW - 4, doorH - 4);
                ctx.fillStyle = `rgba(251,191,36,${cpulse * 0.7})`;
                ctx.fillRect(dx + 2, dy - 4, doorW - 4, 3);
            }

            // Warning strobe lights on building corners
            const strobeOn = (now % 1200) < 600;
            ctx.fillStyle = strobeOn ? 'rgba(251,191,36,0.95)' : 'rgba(80,60,10,0.6)';
            for (const bx2 of [wbX + 5, wbX + wbW - 5]) {
                ctx.beginPath(); ctx.arc(bx2, wbY + 8, 3.5, 0, Math.PI * 2); ctx.fill();
                if (strobeOn) {
                    ctx.fillStyle = 'rgba(251,191,36,0.3)';
                    ctx.beginPath(); ctx.arc(bx2, wbY + 8, 8, 0, Math.PI * 2); ctx.fill();
                    ctx.fillStyle = 'rgba(251,191,36,0.95)';
                }
            }

            // Building label
            ctx.fillStyle = 'rgba(14, 165, 233, 0.9)';
            ctx.font = 'bold 9px Outfit, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('CARGO DEPOT', cpCx, wbY + 14);

            // ── Roof-Integrated Crane System ─────────────────────────────────
            const trackY = wbY - 2;
            const trackStartX = wbX + 10;
            const trackEndX = cx + cw * 0.9;
            const hatchX = wbX + wbW * 0.42;
            const hatchHalfW = 22;

            // Load-sequence progress: 0 at start of the current countdown wait,
            // 1 once it finishes and the crane completes a delivery cycle.
            const _seqActive = _col.loadSeq && _col.loadSeq.phase === 'countdown';
            // Animation always takes exactly 80 ticks, clamp it if countdown is higher
            const _st = _seqActive ? Math.max(0, 1 - _col.loadSeq.countdown / 80) : 0;
            const _roofOpen = _col.loadSeq ? _col.loadSeq.roofOpen : 0;
            const _hatchGap = hatchHalfW * 2 * _roofOpen;

            // Roof line and opening hatch
            ctx.fillStyle = '#1e3a5f';
            if (_hatchGap > 2) {
                ctx.fillRect(wbX, wbY, hatchX - hatchHalfW - wbX, 4);
                ctx.fillRect(hatchX + hatchHalfW, wbY, (wbX + wbW) - (hatchX + hatchHalfW), 4);
                const _hg = ctx.createLinearGradient(hatchX - hatchHalfW, wbY, hatchX + hatchHalfW, wbY);
                _hg.addColorStop(0, 'rgba(56,189,248,0)');
                _hg.addColorStop(0.5, 'rgba(56,189,248,0.35)');
                _hg.addColorStop(1, 'rgba(56,189,248,0)');
                ctx.fillStyle = _hg;
                ctx.fillRect(hatchX - hatchHalfW, wbY, _hatchGap, 10);
            } else {
                ctx.fillRect(wbX, wbY, wbW, 4);
            }
            ctx.fillStyle = '#38bdf8';
            if (_hatchGap > 2) {
                ctx.fillRect(wbX, wbY, hatchX - hatchHalfW - wbX, 2);
                ctx.fillRect(hatchX + hatchHalfW, wbY, (wbX + wbW) - (hatchX + hatchHalfW), 2);
            } else {
                ctx.fillRect(wbX, wbY, wbW, 2);
            }

            // Overhead Rail Track
            ctx.strokeStyle = '#334155';
            ctx.lineWidth = 4;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(trackStartX, trackY - 18);
            ctx.lineTo(trackEndX, trackY - 18);
            ctx.stroke();
            // Track struts connecting to roof
            ctx.lineWidth = 2;
            for (let sx = trackStartX + 10; sx <= trackEndX - 10; sx += 32) {
                ctx.beginPath();
                ctx.moveTo(sx, trackY - 18);
                ctx.lineTo(sx, wbY);
                ctx.stroke();
            }
            ctx.lineCap = 'butt';

            // Trolley + cable + phantom box, driven by the load-sequence progress
            const _cableTop = trackY - 16;
            const _intoWarehouse = wbH * 0.45;
            const _shortLen = 14;
            // The box drops at exactly `lander.y - 60`. 
            // `cy` is the pad. `lander.y` is usually close to `cy`, so `cy - 60` is the target Y.
            // Target cable len = `(cy - 60) - _cableTop - 8` (8 is box half height).
            const _toDeck = (cy - 60) - _cableTop - 8;
            
            let _trolleyX, _cableLen, _showBox = false, _boxX = 0, _boxY = 0;
            const _smooth = (f) => f * f * (3 - 2 * f);
            const _lerp = (a, b, f) => a + (b - a) * Math.max(0, Math.min(1, f));
            const _slerp = (a, b, f) => _lerp(a, b, _smooth(f));

            if (_seqActive) {
                const _lx = Math.max(trackStartX, Math.min(trackEndX, _col.loadSeq.lx));

                if (_st < 0.15) {
                    _trolleyX = hatchX;
                    _cableLen = _shortLen;
                } else if (_st < 0.35) {
                    _trolleyX = hatchX;
                    _cableLen = _slerp(_shortLen, _intoWarehouse, (_st - 0.15) / 0.20);
                } else if (_st < 0.50) {
                    _trolleyX = hatchX;
                    _cableLen = _slerp(_intoWarehouse, _shortLen, (_st - 0.35) / 0.15);
                    _showBox = true;
                } else if (_st < 0.65) {
                    _trolleyX = _slerp(hatchX, _lx, (_st - 0.50) / 0.15);
                    _cableLen = _shortLen;
                    _showBox = true;
                } else if (_st < 0.80) {
                    _trolleyX = _lx;
                    _cableLen = _slerp(_shortLen, _toDeck, (_st - 0.65) / 0.15);
                    // The actual drop triggers at 0.75 in game.js. 
                    // To keep visual sync, the box disappears right when _st crosses 0.75.
                    _showBox = _st < 0.75;
                } else {
                    const _retractF = (_st - 0.80) / 0.20;
                    _trolleyX = _slerp(_lx, hatchX, _retractF);
                    _cableLen = _slerp(_toDeck, _shortLen, _retractF);
                }
                if (_showBox) {
                    _boxX = _trolleyX;
                    _boxY = _cableTop + _cableLen + 8;
                }
            } else {
                _trolleyX = hatchX + (trackEndX - trackStartX) * 0.1 * Math.sin(now * 0.0006);
                _cableLen = _shortLen + Math.abs(Math.sin(now * 0.0008)) * 10;
            }

            ctx.fillStyle = _seqActive ? '#38bdf8' : '#475569';
            ctx.fillRect(_trolleyX - 6, trackY - 22, 12, 6);
            ctx.strokeStyle = '#64748b';
            ctx.lineWidth = 1.2;
            ctx.strokeRect(_trolleyX - 6, trackY - 22, 12, 6);
            
            ctx.strokeStyle = '#94a3b8';
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.moveTo(_trolleyX, _cableTop); ctx.lineTo(_trolleyX, _cableTop + _cableLen);
            ctx.stroke();
            
            ctx.strokeStyle = '#cbd5e1';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(_trolleyX, _cableTop + _cableLen + 4, 4, Math.PI * 0.1, Math.PI * 0.9);
            ctx.stroke();

            if (_showBox) {
                const bType = _col.loadSeq?.targetType || 'normal';
                const emoji = _col.loadSeq?.targetEmoji || '📦';
                ctx.save();
                if (_st < 0.6) {
                    ctx.beginPath();
                    ctx.rect(_boxX - 20, 0, 40, wbY + 4);
                    ctx.clip();
                }
                this.drawSingleBox(_boxX, _boxY, bType, emoji);
                ctx.restore();
            }

            // ── Landing pad surface ───────────────────────────────────────
            ctx.fillStyle = '#1e293b';
            ctx.fillRect(cx, cy, cw, ch);

            ctx.save();
            ctx.beginPath(); ctx.rect(cx, cy, cw, ch); ctx.clip();
            const csW = 13;
            ctx.fillStyle = 'rgba(251,191,36,0.2)';
            for (let sx = cx - ch; sx < cx + cw + ch; sx += csW * 2) {
                ctx.beginPath();
                ctx.moveTo(sx, cy + ch); ctx.lineTo(sx + ch, cy);
                ctx.lineTo(sx + ch + csW, cy); ctx.lineTo(sx + csW, cy + ch);
                ctx.closePath(); ctx.fill();
            }
            ctx.restore();

            ctx.fillStyle = '#38bdf8';
            ctx.fillRect(cx, cy, cw, 3);

            const cGlow = ctx.createLinearGradient(cx, 0, cx + cw, 0);
            cGlow.addColorStop(0, `rgba(56,189,248,0)`);
            cGlow.addColorStop(0.5, `rgba(56,189,248,${cpulse * 0.55})`);
            cGlow.addColorStop(1, `rgba(56,189,248,0)`);
            ctx.strokeStyle = cGlow;
            ctx.lineWidth = 1.5;
            ctx.strokeRect(cx, cy, cw, ch);

            ctx.fillStyle = 'rgba(56,189,248,0.9)';
            ctx.font = 'bold 12px Outfit, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('CARGO', cpCx, cy + 12);

            if (_seqActive) {
                const _pp = 0.7 + Math.abs(Math.sin(now * 0.008)) * 0.3;
                ctx.fillStyle = `rgba(56,189,248,${_pp})`;
                ctx.font = '600 11px Outfit, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(`LOADING ${_col.loadSeq.spawned} / 3`, cpCx, wbY - 45);

                // Draw loading progress bar on the warehouse facade
                const waitMax = Math.max(1, _col.loadSeq.countdownMax - 80);
                const waitCurrent = Math.max(0, _col.loadSeq.countdown - 80);
                const waitProgress = 1 - (waitCurrent / waitMax);
                
                const barW = wbW * 0.6;
                const barH = 6;
                const barX = wbX + (wbW - barW) / 2;
                const barY = wbY + 25;
                
                ctx.fillStyle = '#0f172a';
                ctx.fillRect(barX, barY, barW, barH);
                ctx.strokeStyle = '#334155';
                ctx.lineWidth = 1;
                ctx.strokeRect(barX, barY, barW, barH);
                
                if (waitProgress > 0) {
                    ctx.fillStyle = waitProgress >= 1 ? '#10b981' : '#f59e0b';
                    ctx.fillRect(barX + 1, barY + 1, (barW - 2) * waitProgress, barH - 2);
                }
            }
        }
    }

,
drawDeliveryHubs() {
        const ctx = this.ctx;
        const hubs = this.physics.deliveryHubs;
        const now = Date.now();

        for (const hub of hubs) {
            const hasMatchingCargo = this.physics.boxes.some(b => b.onDeck && b.type === hub.type);
            const hcx = hub.x + hub.width / 2;

            if (hub.type === 'chute') {
                // ── Vacuum Chute Structure ────────────────────────────────
                const hw = hub.width;
                const hh = 40; // funnel depth

                // Outer Funnel Base
                ctx.fillStyle = '#334155';
                ctx.beginPath();
                ctx.moveTo(hub.x - 20, hub.y);
                ctx.lineTo(hub.x + hw + 20, hub.y);
                ctx.lineTo(hub.x + hw, hub.y + hh);
                ctx.lineTo(hub.x, hub.y + hh);
                ctx.closePath();
                ctx.fill();

                // Hazard Stripes on Rim
                ctx.save();
                ctx.beginPath();
                ctx.rect(hub.x - 20, hub.y, hw + 40, 8);
                ctx.clip();
                ctx.fillStyle = '#f59e0b';
                ctx.fillRect(hub.x - 20, hub.y, hw + 40, 8);
                ctx.fillStyle = '#0f172a';
                for (let sx = hub.x - 30; sx < hub.x + hw + 40; sx += 20) {
                    ctx.beginPath();
                    ctx.moveTo(sx, hub.y + 8);
                    ctx.lineTo(sx + 8, hub.y);
                    ctx.lineTo(sx + 18, hub.y);
                    ctx.lineTo(sx + 10, hub.y + 8);
                    ctx.closePath();
                    ctx.fill();
                }
                ctx.restore();

                // Inner dark hole
                ctx.fillStyle = '#020617';
                ctx.beginPath();
                ctx.moveTo(hub.x - 10, hub.y + 8);
                ctx.lineTo(hub.x + hw + 10, hub.y + 8);
                ctx.lineTo(hub.x + hw - 4, hub.y + hh - 4);
                ctx.lineTo(hub.x + 4, hub.y + hh - 4);
                ctx.closePath();
                ctx.fill();

                // Tractor Beam Cone
                const beamAlpha = 0.15 + Math.sin(now * 0.005) * 0.05;
                const bGrad = ctx.createLinearGradient(0, hub.y - 80, 0, hub.y);
                bGrad.addColorStop(0, 'transparent');
                bGrad.addColorStop(1, `rgba(16, 185, 129, ${beamAlpha})`);
                ctx.fillStyle = bGrad;
                ctx.beginPath();
                ctx.moveTo(hub.x - 30, hub.y - 80);
                ctx.lineTo(hub.x + hw + 30, hub.y - 80);
                ctx.lineTo(hub.x + hw - 4, hub.y);
                ctx.lineTo(hub.x + 4, hub.y);
                ctx.closePath();
                ctx.fill();

                // Suction Particle Effects
                for (let i = 0; i < 6; i++) {
                    const phase = (now * 0.001 + i * 0.3) % 1.0;
                    const py = hub.y - 60 * (1 - phase);
                    const px = hcx + (Math.sin(now * 0.002 + i) * hw * 0.4 * phase);
                    ctx.fillStyle = `rgba(16, 185, 129, ${0.8 * phase})`;
                    ctx.beginPath(); ctx.arc(px, py, 2 + phase * 2, 0, Math.PI * 2); ctx.fill();
                }
                continue;
            }

            // ── Overhead crane on hub ─────────────────────────────────────
            // Crane height is now anchored off the pad directly (no warehouse
            // facade) — the pad stays a clear, readable landing surface.
            const craneTopY = hub.y - 66;
            const craneX = hcx + hub.width * 0.28;
            const craneArmLeft = hub.x - 6;

            // Pallet stack — delivered boxes visibly pile up here instead of
            // vanishing; this is the crane's actual drop-off target.
            const palletX = craneArmLeft - 16;
            const palletCount = hub.palletCount || 0;
            ctx.fillStyle = '#78350f';
            ctx.fillRect(palletX - 12, hub.y - 4, 24, 4);
            ctx.strokeStyle = '#451a03';
            ctx.lineWidth = 1;
            ctx.strokeRect(palletX - 12, hub.y - 4, 24, 4);
            const palletCrateS = this.physics.BOX_SIZE * 0.6;
            for (let pi = 0; pi < Math.min(palletCount, 5); pi++) {
                const row = Math.floor(pi / 2), col = pi % 2;
                const pcx = palletX - 7 + col * 14, pcy = hub.y - 4 - row * (palletCrateS + 2) - palletCrateS / 2;
                ctx.fillStyle = hub.color + '33';
                ctx.fillRect(pcx - palletCrateS / 2, pcy - palletCrateS / 2, palletCrateS, palletCrateS);
                ctx.strokeStyle = hub.color;
                ctx.lineWidth = 1;
                ctx.strokeRect(pcx - palletCrateS / 2, pcy - palletCrateS / 2, palletCrateS, palletCrateS);
            }

            ctx.strokeStyle = '#f59e0b';
            ctx.lineWidth = 6;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(craneX, hub.y); ctx.lineTo(craneX, craneTopY - 16);
            ctx.stroke();
            ctx.strokeStyle = '#fbbf24';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(craneX - 1, hub.y); ctx.lineTo(craneX - 1, craneTopY - 16);
            ctx.stroke();
            ctx.strokeStyle = '#f59e0b';
            ctx.lineWidth = 5;
            ctx.beginPath();
            ctx.moveTo(craneX, craneTopY - 16); ctx.lineTo(craneArmLeft, craneTopY - 16);
            ctx.stroke();
            ctx.lineWidth = 3;
            ctx.strokeStyle = '#b45309';
            ctx.beginPath();
            ctx.moveTo(craneX - 12, craneTopY - 16); ctx.lineTo(craneX, craneTopY - 4);
            ctx.stroke();
            ctx.lineCap = 'butt';

            // Animated trolley + cable — actually carries the delivered box
            // from its pickup spot over to the pallet stack.
            const _hubAnim = hub.craneAnim;
            const idleX = craneArmLeft + (craneX - craneArmLeft) * (0.25 + Math.sin(now * 0.0005) * 0.22);
            const restLen = 22;
            let trolleyX, cableLen, carryingBox = false;
            if (_hubAnim) {
                const t = _hubAnim.timer;
                const pickX = Math.max(craneArmLeft, Math.min(craneX, _hubAnim.lx));
                const pickLen = Math.max(restLen, _hubAnim.ly - (craneTopY - 15));
                if (t < 0.28) { // slide trolley over the pickup point
                    trolleyX = idleX + (pickX - idleX) * (t / 0.28);
                    cableLen = restLen;
                } else if (t < 0.5) { // lower cable to grab the box
                    trolleyX = pickX;
                    cableLen = restLen + (pickLen - restLen) * ((t - 0.28) / 0.22);
                } else if (t < 0.65) { // hoist it back up
                    trolleyX = pickX;
                    cableLen = pickLen + (restLen - pickLen) * ((t - 0.5) / 0.15);
                    carryingBox = true;
                } else { // swing over to the pallet and set it down
                    const r = (t - 0.65) / 0.35;
                    trolleyX = pickX + (palletX - pickX) * r;
                    cableLen = restLen;
                    carryingBox = true;
                }
            } else {
                trolleyX = idleX;
                cableLen = restLen + Math.abs(Math.sin(now * 0.0007)) * 16;
            }
            ctx.fillStyle = '#475569';
            ctx.fillRect(trolleyX - 5, craneTopY - 22, 10, 7);
            ctx.strokeStyle = '#94a3b8';
            ctx.lineWidth = 1.1;
            ctx.beginPath();
            ctx.moveTo(trolleyX, craneTopY - 15); ctx.lineTo(trolleyX, craneTopY - 15 + cableLen);
            ctx.stroke();
            // Hook
            ctx.strokeStyle = '#cbd5e1';
            ctx.lineWidth = 1.4;
            ctx.beginPath();
            ctx.arc(trolleyX, craneTopY - 15 + cableLen + 4, 3.5, Math.PI * 0.1, Math.PI * 0.9);
            ctx.stroke();

            // Draw the box while it's actually attached to the hook
            if (carryingBox) {
                this.drawSingleBox(trolleyX, craneTopY - 15 + cableLen + 4 + this.physics.BOX_SIZE / 2 + 2, _hubAnim.boxType);
            }

            // Glow column beacon — soft tapered light shaft, not a flat box
            const pulse = 0.12 + Math.abs(Math.sin(Date.now() * 0.002)) * 0.1;
            const beaconCx = hub.x + hub.width / 2;
            const beaconGrad = ctx.createLinearGradient(0, hub.y - 200, 0, hub.y);
            beaconGrad.addColorStop(0, 'rgba(0,0,0,0)');
            beaconGrad.addColorStop(1, hub.color);
            ctx.save();
            ctx.globalAlpha = pulse;
            ctx.fillStyle = beaconGrad;
            ctx.beginPath();
            ctx.moveTo(beaconCx - 3, hub.y - 200);
            ctx.lineTo(beaconCx + 3, hub.y - 200);
            ctx.lineTo(beaconCx + hub.width * 0.4, hub.y);
            ctx.lineTo(beaconCx - hub.width * 0.4, hub.y);
            ctx.closePath();
            ctx.fill();
            ctx.restore();

            // Landing light feedback
            let isHovering = false;
            const l = this.physics.lander;
            if (l && !l.crashed) {
                if (l.x >= hub.x - 20 && l.x <= hub.x + hub.width + 20 && l.y < hub.y && l.y > hub.y - 120) {
                    isHovering = true;
                }
            }

            if (isHovering) {
                ctx.fillStyle = hub.color;
                ctx.globalAlpha = 0.4 + Math.abs(Math.sin(Date.now() * 0.01)) * 0.3;
                ctx.fillRect(hub.x, hub.y - 2, hub.width, 4);
                
                const lightGrad = ctx.createLinearGradient(0, hub.y - 30, 0, hub.y);
                lightGrad.addColorStop(0, 'rgba(0,0,0,0)');
                lightGrad.addColorStop(1, hub.color);
                ctx.fillStyle = lightGrad;
                ctx.fillRect(hub.x, hub.y - 30, hub.width, 30);
            }
            ctx.globalAlpha = 1.0;

            // Hub base — solid slab so the pad reads as flat ground, not terrain
            ctx.fillStyle = '#1e293b';
            ctx.fillRect(hub.x - 4, hub.y, hub.width + 8, hub.height);

            // Hazard chevron stripes — same bold "safe to land here" language
            // used on the start depot / collection pad, tinted with the hub's color
            ctx.save();
            ctx.beginPath();
            ctx.rect(hub.x - 4, hub.y, hub.width + 8, hub.height);
            ctx.clip();
            const hsW = 12;
            ctx.fillStyle = hub.color + '40';
            for (let sx = hub.x - hub.height - 4; sx < hub.x + hub.width + hub.height + 4; sx += hsW * 2) {
                ctx.beginPath();
                ctx.moveTo(sx, hub.y + hub.height);
                ctx.lineTo(sx + hub.height, hub.y);
                ctx.lineTo(sx + hub.height + hsW, hub.y);
                ctx.lineTo(sx + hsW, hub.y + hub.height);
                ctx.closePath();
                ctx.fill();
            }
            ctx.restore();

            // Bright flat top surface — the actual contact line a pilot reads as "clear to land"
            ctx.strokeStyle = '#e2e8f0';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(hub.x - 4, hub.y); ctx.lineTo(hub.x + hub.width + 4, hub.y);
            ctx.stroke();

            if (hasMatchingCargo) {
                const bpulse = 0.5 + Math.abs(Math.sin(Date.now() * 0.006)) * 0.5;
                ctx.strokeStyle = hub.color;
                ctx.globalAlpha = bpulse;
                ctx.lineWidth = 2;
                ctx.strokeRect(hub.x, hub.y, hub.width, hub.height);
                ctx.globalAlpha = 1.0;
            }

            // Glowing boundary line
            ctx.fillStyle = hub.color;
            ctx.fillRect(hub.x, hub.y, hub.width, 3);

            // Hub name label (inside pad)
            ctx.fillStyle = '#f8fafc';
            ctx.font = '600 10px Outfit, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(hub.name.toUpperCase(), hub.x + hub.width / 2, hub.y + 11);

            // Hub type label (below pad)
            ctx.fillStyle = hub.color;
            ctx.font = '500 9px Outfit, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(hub.type ? hub.type.toUpperCase() : '', hub.x + hub.width / 2, hub.y + hub.height + 11);
        }
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
        const S = this.physics.BOX_SIZE;
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

        ctx.shadowColor = 'rgba(0,0,0,0.8)';
        ctx.shadowBlur = 4;
        ctx.font = `${Math.round(S * 0.75)}px "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(iconText, 0, 1.5);
        ctx.shadowBlur = 0;

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
drawLander() {
        const ctx = this.ctx;

        const lander = this.physics.lander;
        if (!lander) return;

        if (lander.vehicleType === 'drone' || lander.grabbedBoxId) {
            if (lander.ropeLength > 0) {
                const rx0 = lander.x;
                const ry0 = lander.y + (lander.vehicleType === 'drone' ? 10 : lander.height / 2);
                let rx1, ry1;
                if (lander.grabbedBoxId) {
                    const grabbedBox = this.physics.boxes.find(b => b.id === lander.grabbedBoxId);
                    rx1 = grabbedBox ? grabbedBox.x : (lander.grappleX ?? lander.x);
                    ry1 = grabbedBox ? grabbedBox.y : (lander.grappleY ?? lander.y + lander.ropeLength);
                } else {
                    rx1 = lander.grappleX ?? lander.x;
                    ry1 = lander.grappleY ?? lander.y + lander.ropeLength;
                }

                // Build chain link positions along a catenary curve
                const numLinks = Math.max(4, Math.floor(lander.ropeLength / 14));
                const sag = Math.min(lander.ropeLength * 0.18, 30);
                const links = [];
                for (let i = 0; i <= numLinks; i++) {
                    const t = i / numLinks;
                    const parabola = 4 * sag * t * (1 - t);
                    const x = rx0 + (rx1 - rx0) * t;
                    const y = ry0 + (ry1 - ry0) * t + parabola;
                    links.push({ x, y });
                }

                // Draw chain links
                const linkColor = lander.grabbedBoxId ? '#f97316' : '#94a3b8';
                const linkColorDark = lander.grabbedBoxId ? '#c2410c' : '#475569';
                for (let i = 0; i < links.length - 1; i++) {
                    const a = links[i], b = links[i + 1];
                    const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
                    const dx = b.x - a.x, dy = b.y - a.y;
                    const len = Math.sqrt(dx * dx + dy * dy) || 1;
                    const nx = -dy / len * 2.5, ny = dx / len * 2.5; // normal offset

                    // Oval link shape (two half-arcs)
                    ctx.strokeStyle = linkColorDark;
                    ctx.lineWidth = 2.5;
                    ctx.beginPath();
                    ctx.ellipse(mx, my, len / 2 + 1, 2.5, Math.atan2(dy, dx), 0, Math.PI * 2);
                    ctx.stroke();

                    ctx.strokeStyle = linkColor;
                    ctx.lineWidth = 1.5;
                    ctx.beginPath();
                    ctx.ellipse(mx, my, len / 2, 2, Math.atan2(dy, dx), 0, Math.PI * 2);
                    ctx.stroke();

                    // Highlight on top half of each link
                    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
                    ctx.lineWidth = 0.8;
                    ctx.beginPath();
                    ctx.ellipse(mx - nx * 0.5, my - ny * 0.5, len / 2, 1.2, Math.atan2(dy, dx), Math.PI, Math.PI * 2);
                    ctx.stroke();
                }

                // Hook/magnet end
                const tip = links[links.length - 1];
                const hooked = !!lander.grabbedBoxId;
                const hGlow = ctx.createRadialGradient(tip.x, tip.y, 0, tip.x, tip.y, hooked ? 12 : 7);
                hGlow.addColorStop(0, hooked ? 'rgba(249,115,22,0.85)' : 'rgba(148,163,184,0.65)');
                hGlow.addColorStop(1, 'rgba(0,0,0,0)');
                ctx.fillStyle = hGlow;
                ctx.beginPath();
                ctx.arc(tip.x, tip.y, hooked ? 12 : 7, 0, Math.PI * 2);
                ctx.fill();

                ctx.fillStyle = hooked ? '#f97316' : '#cbd5e1';
                ctx.strokeStyle = 'rgba(0,0,0,0.6)';
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.arc(tip.x, tip.y, 4.5, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();

                // Attachment point at drone body
                ctx.fillStyle = 'rgba(100,116,139,0.9)';
                ctx.beginPath();
                ctx.arc(rx0, ry0, 3, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        ctx.save();
        ctx.translate(lander.x, lander.y);
        ctx.rotate(lander.angle);

        // ── Landing legs drawn BEFORE bounce so they stay at ground level ──
        // Only show spring compression while grounded — never during flight/takeoff
        const lc0 = lander.landed ? (lander.legCompress || 0) : 0;
        if (lander.vehicleType !== 'drone') {
            const hw0 = (lander.deckWidth || 66) / 2;
            // Foot stays at hh=14 (terrain level when landed). Spread pulls in as compressed.
            // When legs are deployed (near pad), extend them slightly wider/lower for visual readiness
            const legDeploy = (!lander.landed && lander.legsDeployed) ? 1 : 0;
            const footY0 = lander.landed ? 14 : (14 + legDeploy * 4);
            const legSpread0 = hw0 + 12 + legDeploy * 5;

            // Draw gold-plated struts with black outlines (matching the sprite style)
            // Left Leg:
            // Main strut black outline
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 5;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(-hw0 + 2, 10);
            ctx.lineTo(-legSpread0, footY0);
            ctx.stroke();

            // Main strut gold inner
            ctx.strokeStyle = '#fbbf24';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.moveTo(-hw0 + 2, 10);
            ctx.lineTo(-legSpread0, footY0);
            ctx.stroke();

            // Secondary strut black outline
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 3.5;
            ctx.beginPath();
            ctx.moveTo(-hw0 + 4, 4);
            ctx.lineTo(-legSpread0, footY0 - 1);
            ctx.stroke();

            // Secondary strut gold inner
            ctx.strokeStyle = '#fbbf24';
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.moveTo(-hw0 + 4, 4);
            ctx.lineTo(-legSpread0, footY0 - 1);
            ctx.stroke();

            // Left foot dish (dark grey circle/oval with black outline)
            ctx.fillStyle = '#475569';
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.ellipse(-legSpread0, footY0, 6, 3, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // Right Leg:
            // Main strut black outline
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 5;
            ctx.beginPath();
            ctx.moveTo(hw0 - 2, 10);
            ctx.lineTo(legSpread0, footY0);
            ctx.stroke();

            // Main strut gold inner
            ctx.strokeStyle = '#fbbf24';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.moveTo(hw0 - 2, 10);
            ctx.lineTo(legSpread0, footY0);
            ctx.stroke();

            // Secondary strut black outline
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 3.5;
            ctx.beginPath();
            ctx.moveTo(hw0 - 4, 4);
            ctx.lineTo(legSpread0, footY0 - 1);
            ctx.stroke();

            // Secondary strut gold inner
            ctx.strokeStyle = '#fbbf24';
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.moveTo(hw0 - 4, 4);
            ctx.lineTo(legSpread0, footY0 - 1);
            ctx.stroke();

            // Right foot dish (dark grey circle/oval with black outline)
            ctx.fillStyle = '#475569';
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.ellipse(legSpread0, footY0, 6, 3, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            ctx.lineCap = 'butt';

            // Navigation/Blinking lights centered on the feet
            const navPulse0 = 0.6 + Math.abs(Math.sin(Date.now() * 0.004)) * 0.4;
            // Left light (red port light)
            ctx.fillStyle = `rgba(239,68,68,${navPulse0})`;
            ctx.beginPath(); ctx.arc(-legSpread0, footY0 - 2, 1.8, 0, Math.PI * 2); ctx.fill();
            // Right light (green starboard light)
            ctx.fillStyle = `rgba(16,185,129,${navPulse0})`;
            ctx.beginPath(); ctx.arc(legSpread0, footY0 - 2, 1.8, 0, Math.PI * 2); ctx.fill();
        }

        // Body movement on landing — legs stay planted, ship body compresses down
        const bounceY = (lander.vehicleType !== 'drone' && lander.landed) ? (lander.legCompress || 0) * 5 : 0;
        ctx.translate(0, bounceY);

        const maxIntegrity = lander.maxIntegrity || 100;
        const healthPct = Math.max(0, Math.min(1, (lander.integrity ?? maxIntegrity) / maxIntegrity));
        const damaged = healthPct < 0.85;
        const heavy = healthPct < 0.4;
        const critical = healthPct < 0.2;

        const w = lander.width;
        const h = lander.height;

        if (lander.vehicleType === 'drone') {
            const spin = Date.now() / 16;
            const thrust = lander.thrusting && lander.fuel > 0;

            // Rotor wash glow (4 corners)
            if (thrust) {
                for (const [px, py] of [[-21, -10], [21, -10], [-21, 10], [21, 10]]) {
                    const wg = ctx.createRadialGradient(px, py + 5, 0, px, py + 5, 11);
                    wg.addColorStop(0, 'rgba(120,200,255,0.22)');
                    wg.addColorStop(1, 'rgba(120,200,255,0)');
                    ctx.fillStyle = wg;
                    ctx.beginPath(); ctx.arc(px, py + 5, 11, 0, Math.PI * 2); ctx.fill();
                }
            }

            {
                // X-frame arms
                ctx.strokeStyle = '#334155';
                ctx.lineWidth = 3;
                ctx.lineCap = 'round';
                for (const [dx, dy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
                    ctx.beginPath();
                    ctx.moveTo(dx * 4, dy * 4);
                    ctx.lineTo(dx * 19, dy * 9);
                    ctx.stroke();
                }
                ctx.lineCap = 'butt';

                // Central hex body
                ctx.fillStyle = '#1e293b';
                ctx.strokeStyle = critical ? '#ef4444' : heavy ? '#f59e0b' : '#38bdf8';
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                for (let i = 0; i < 6; i++) {
                    const a = (i / 6) * Math.PI * 2 - Math.PI / 6;
                    i === 0 ? ctx.moveTo(Math.cos(a) * 9, Math.sin(a) * 9)
                        : ctx.lineTo(Math.cos(a) * 9, Math.sin(a) * 9);
                }
                ctx.closePath(); ctx.fill(); ctx.stroke();

                // Sensor eye
                ctx.fillStyle = critical ? '#ef4444' : '#38bdf8';
                ctx.beginPath(); ctx.arc(0, 0, 3.5, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = 'rgba(255,255,255,0.6)';
                ctx.beginPath(); ctx.arc(-1, -1, 1.2, 0, Math.PI * 2); ctx.fill();

                // Motor pods + spinning blades
                for (let i = 0; i < 4; i++) {
                    const [px, py] = [[-21, -10], [21, -10], [21, 10], [-21, 10]][i];
                    // Pod housing
                    ctx.fillStyle = '#253548';
                    ctx.strokeStyle = '#475569';
                    ctx.lineWidth = 1;
                    ctx.beginPath(); ctx.arc(px, py, 5.5, 0, Math.PI * 2);
                    ctx.fill(); ctx.stroke();
                    // Counter-rotating pairs (0,2 vs 1,3)
                    const a = spin + (i % 2 === 0 ? 0 : Math.PI / 2);
                    ctx.strokeStyle = thrust ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.3)';
                    ctx.lineWidth = 1.5;
                    ctx.lineCap = 'round';
                    for (let b = 0; b < 2; b++) {
                        const ba = a + b * Math.PI;
                        ctx.beginPath();
                        ctx.moveTo(px + Math.cos(ba) * 9, py + Math.sin(ba) * 2.5);
                        ctx.lineTo(px + Math.cos(ba + Math.PI) * 9, py + Math.sin(ba + Math.PI) * 2.5);
                        ctx.stroke();
                    }
                    ctx.lineCap = 'butt';
                }
            }

            // Nav lights (red left, green right)
            ctx.fillStyle = (Date.now() % 1400 < 700) ? '#ef4444' : 'rgba(80,20,20,0.5)';
            ctx.beginPath(); ctx.arc(-21, -10, 2, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = (Date.now() % 1400 < 700) ? '#22c55e' : 'rgba(10,50,20,0.5)';
            ctx.beginPath(); ctx.arc(21, -10, 2, 0, Math.PI * 2); ctx.fill();

            // Landing legs
            const dlc = lander.landed ? (lander.legCompress || 0) : 0;
            for (const side of [-1, 1]) {
                const lx = side * 17;
                const ly = 13 - dlc * 4;
                ctx.strokeStyle = '#475569';
                ctx.lineWidth = 1.5;
                ctx.lineCap = 'round';
                ctx.beginPath(); ctx.moveTo(lx, 7); ctx.lineTo(lx, ly); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(lx - side * 3, 5); ctx.lineTo(lx + side * 5, ly); ctx.stroke();
                ctx.strokeStyle = '#94a3b8';
                ctx.lineWidth = 2.5;
                ctx.beginPath(); ctx.moveTo(lx - side * 6, ly); ctx.lineTo(lx + side * 6, ly); ctx.stroke();
                ctx.lineCap = 'butt';
            }

        } else {
            // ─── SPACE TRUCK DESIGN ───────────────────────────────────────
            const deckY = -lander.deckOffset;
            const hw = lander.deckWidth / 2;
            const bh = lander.basketHeight;

            // ── Main thruster flame (bottom) ──────────────────────────────
            if (lander.thrusting && lander.fuel > 0) {
                const ep = lander.enginePower || 1;
                const fl = (18 + Math.random() * 26) * ep;
                const fGrad = ctx.createLinearGradient(0, 16, 0, 16 + fl);

                // Color shifts bluer at high power (boost upgrade)
                if (ep > 1.2) {
                    fGrad.addColorStop(0, 'rgba(125, 211, 252, 0.98)'); // Light blue core
                    fGrad.addColorStop(0.35, 'rgba(56, 189, 248, 0.75)'); // Mid blue
                } else {
                    fGrad.addColorStop(0, 'rgba(251, 191, 36, 0.98)'); // Yellow core
                    fGrad.addColorStop(0.35, 'rgba(239, 100, 20, 0.75)'); // Orange
                }
                fGrad.addColorStop(1, 'rgba(239, 68, 68, 0)'); // Red tail fading out

                ctx.fillStyle = fGrad;
                const fw = (3.5 + Math.random() * 2.5) * Math.max(0.4, ep);
                // Left nozzle flame
                ctx.beginPath();
                ctx.moveTo(-9 - fw, 16);
                ctx.bezierCurveTo(-9 - fw * 0.3, 16 + fl * 0.5, (Math.random() - 0.5) * 4 - 9, 16 + fl * 0.88, -9, 16 + fl);
                ctx.bezierCurveTo((Math.random() - 0.5) * 4 - 9, 16 + fl * 0.88, -9 + fw * 0.3, 16 + fl * 0.5, -9 + fw, 16);
                ctx.closePath();
                ctx.fill();
                // Right nozzle flame
                ctx.beginPath();
                ctx.moveTo(9 - fw, 16);
                ctx.bezierCurveTo(9 - fw * 0.3, 16 + fl * 0.5, (Math.random() - 0.5) * 4 + 9, 16 + fl * 0.88, 9, 16 + fl);
                ctx.bezierCurveTo((Math.random() - 0.5) * 4 + 9, 16 + fl * 0.88, 9 + fw * 0.3, 16 + fl * 0.5, 9 + fw, 16);
                ctx.closePath();
                ctx.fill();
                // Shared bloom
                const bloomBaseColor = ep > 1.2 ? 'rgba(56, 189, 248, ' : 'rgba(251, 191, 36, ';
                const bGrad = ctx.createRadialGradient(0, 20, 0, 0, 24, 26 * ep);
                bGrad.addColorStop(0, `${bloomBaseColor}${0.3 * ep})`);
                bGrad.addColorStop(1, 'rgba(239, 68, 68, 0)');
                ctx.fillStyle = bGrad;
                ctx.beginPath();
                ctx.ellipse(0, 22, 20 * ep, 26 * ep, 0, 0, Math.PI * 2);
                ctx.fill();
            }

            // ── Side thruster flames ───────────────────────────────────────
            const strafe = lander.strafePower || 0;
            if (Math.abs(strafe) > 0.08) {
                const sl = 10 + Math.abs(strafe) * 22 + Math.random() * 8;
                const flameX = strafe < 0 ? hw + 2 : -hw - 2;
                const flameDir = strafe < 0 ? 1 : -1;
                const sGrad = ctx.createLinearGradient(flameX, 0, flameX + flameDir * sl, 0);
                sGrad.addColorStop(0, 'rgba(56, 189, 248, 0.92)');
                sGrad.addColorStop(0.45, 'rgba(99, 102, 241, 0.65)');
                sGrad.addColorStop(1, 'rgba(99, 102, 241, 0)');
                ctx.fillStyle = sGrad;
                const fw2 = 3.5 + Math.random() * 2.5;
                ctx.beginPath();
                ctx.moveTo(flameX, -fw2);
                ctx.bezierCurveTo(
                    flameX + flameDir * sl * 0.45, -fw2 * 0.3,
                    flameX + flameDir * sl * 0.82 + (Math.random() - 0.5) * 4, (Math.random() - 0.5) * 3,
                    flameX + flameDir * sl, 0
                );
                ctx.bezierCurveTo(
                    flameX + flameDir * sl * 0.82 + (Math.random() - 0.5) * 4, (Math.random() - 0.5) * 3,
                    flameX + flameDir * sl * 0.45, fw2 * 0.3,
                    flameX, fw2
                );
                ctx.closePath();
                ctx.fill();
                // Heat glow
                const sbGrad = ctx.createRadialGradient(flameX, 0, 0, flameX, 0, sl * 0.5);
                sbGrad.addColorStop(0, 'rgba(56,189,248,0.25)');
                sbGrad.addColorStop(1, 'rgba(56,189,248,0)');
                ctx.fillStyle = sbGrad;
                ctx.beginPath();
                ctx.arc(flameX, 0, sl * 0.5, 0, Math.PI * 2);
                ctx.fill();
            }

                const firing = lander.thrusting && lander.fuel > 0;

                // Check if we are currently holding a box
                const holdingBox = this.physics.boxes.some(b => b.onDeck);
                const clampColor = holdingBox ? '#10b981' : '#38bdf8';
                const clampGlow = holdingBox ? 'rgba(16, 185, 129, 0.4)' : 'rgba(56, 189, 248, 0.1)';

                // ── Magnetic Base Plate ─────────────────────────────────────────
                ctx.fillStyle = '#0f172a';
                ctx.strokeStyle = '#1e293b';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.roundRect(-hw, deckY - 3, hw * 2, 4, 2);
                ctx.fill();
                ctx.stroke();

                // ── Magnetic Glow Field ─────────────────────────────────────────
                if (holdingBox || (Date.now() % 2000 < 1000)) { // Pulse when empty
                    const mGrad = ctx.createLinearGradient(0, deckY, 0, deckY - bh);
                    mGrad.addColorStop(0, clampGlow);
                    mGrad.addColorStop(1, 'rgba(0,0,0,0)');
                    ctx.fillStyle = mGrad;
                    ctx.fillRect(-hw + 2, deckY - bh, hw * 2 - 4, bh);
                }

                // ── Locking Clamps (Left & Right) ───────────────────────────────
                const clampOffset = holdingBox ? 4 : 10; // Wide cage so the box can physically rattle around inside!

                // Left Clamp
                ctx.fillStyle = '#1e293b';
                ctx.strokeStyle = clampColor;
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.moveTo(-hw - 2, deckY);
                ctx.lineTo(-hw - 2, deckY - bh * 0.7);
                ctx.lineTo(-hw + clampOffset, deckY - bh * 0.7);
                ctx.lineTo(-hw + clampOffset, deckY - bh * 0.5);
                ctx.lineTo(-hw, deckY - bh * 0.5);
                ctx.lineTo(-hw, deckY);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();

                // Right Clamp
                ctx.beginPath();
                ctx.moveTo(hw + 2, deckY);
                ctx.lineTo(hw + 2, deckY - bh * 0.7);
                ctx.lineTo(hw - clampOffset, deckY - bh * 0.7);
                ctx.lineTo(hw - clampOffset, deckY - bh * 0.5);
                ctx.lineTo(hw, deckY - bh * 0.5);
                ctx.lineTo(hw, deckY);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();

                // Clamp Status Lights
                ctx.fillStyle = clampColor;
                ctx.beginPath(); ctx.arc(-hw - 1, deckY - bh * 0.6, 1.5, 0, Math.PI * 2); ctx.fill();
                ctx.beginPath(); ctx.arc(hw + 1, deckY - bh * 0.6, 1.5, 0, Math.PI * 2); ctx.fill();

                // ── Main body ─────────────────────────────────────────────────
                const bodyW = hw - 6;
                const bodyGrad = ctx.createLinearGradient(0, -4, 0, 14);
                bodyGrad.addColorStop(0, '#1e293b');
                bodyGrad.addColorStop(1, '#0f172a');

                ctx.fillStyle = bodyGrad;
                ctx.strokeStyle = critical ? '#ef4444' : heavy ? '#f59e0b' : '#38bdf8';
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.roundRect(-bodyW, -4, bodyW * 2, 18, 4);
                ctx.fill();
                ctx.stroke();

                // Detailed paneling
                ctx.strokeStyle = '#334155';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(-bodyW + 4, 5); ctx.lineTo(bodyW - 4, 5);
                ctx.moveTo(-bodyW + 4, 9); ctx.lineTo(bodyW - 4, 9);
                ctx.stroke();

                // ── Cockpit dome ──────────────────────────────────────────────
                const cabW = bodyW * 0.75;
                ctx.fillStyle = '#0f172a';
                ctx.strokeStyle = critical ? '#ef4444' : heavy ? '#f59e0b' : '#38bdf8';
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.moveTo(-cabW, -4);
                ctx.lineTo(-cabW * 0.7, -13);
                ctx.lineTo(cabW * 0.7, -13);
                ctx.lineTo(cabW, -4);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();

                // Window 
                const winGrad = ctx.createLinearGradient(0, -18, 0, -4);
                winGrad.addColorStop(0, '#0ea5e9');
                winGrad.addColorStop(1, '#0369a1');
                ctx.fillStyle = winGrad;
                ctx.beginPath();
                ctx.moveTo(-cabW * 0.5, -6);
                ctx.lineTo(-cabW * 0.45, -10);
                ctx.lineTo(cabW * 0.45, -10);
                ctx.lineTo(cabW * 0.5, -6);
                ctx.closePath();
                ctx.fill();

                // Window glint
                ctx.fillStyle = 'rgba(255,255,255,0.4)';
                ctx.beginPath();
                ctx.moveTo(-cabW * 0.4, -7);
                ctx.lineTo(-cabW * 0.35, -9);
                ctx.lineTo(-cabW * 0.1, -9);
                ctx.lineTo(-cabW * 0.15, -7);
                ctx.closePath();
                ctx.fill();

                // ── Nozzles ──────────────────────────────────────────────────
                for (const nx of [-9, 9]) {
                    ctx.fillStyle = '#0f172a';
                    ctx.strokeStyle = firing ? 'rgba(251,191,36,0.9)' : '#475569';
                    ctx.lineWidth = 1.5;
                    ctx.beginPath();
                    ctx.moveTo(nx - 4, 12); ctx.lineTo(nx + 4, 12);
                    ctx.lineTo(nx + 5, 17); ctx.lineTo(nx - 5, 17);
                    ctx.closePath();
                    ctx.fill(); ctx.stroke();
                }

                // ── Side RCS ports ────────────────────────────────────────────
                for (const side of [-1, 1]) {
                    ctx.fillStyle = '#0f172a';
                    ctx.strokeStyle = '#334155';
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.rect(side * (hw - 1), 0, side * 5, 6);
                    ctx.fill(); ctx.stroke();
                }
        }

        // === Hull Damage Visual Overlays ===
        if (damaged) {
            const dmg = 1 - healthPct;
            const hw2 = (lander.vehicleType === 'drone') ? 22 : (lander.deckWidth / 2 || 33);
            const hh2 = (lander.vehicleType === 'drone') ? 8 : 14;

            // Brown/rust tint overlay
            ctx.fillStyle = `rgba(120,50,10,${dmg * 0.35})`;
            ctx.beginPath();
            if (lander.vehicleType === 'drone') {
                ctx.ellipse(0, 0, hw2, hh2, 0, 0, Math.PI * 2);
            } else {
                ctx.rect(-hw2, -hh2, hw2 * 2, hh2 * 2);
            }
            ctx.fill();

            // Crack lines (deterministic, based on damage level)
            if (dmg > 0.2) {
                ctx.strokeStyle = `rgba(60,20,0,${Math.min(1, dmg * 1.2)})`;
                ctx.lineWidth = 0.8;
                const cracks = [
                    [[-hw2 * 0.3, -hh2 * 0.5], [-hw2 * 0.1, hh2 * 0.2], [hw2 * 0.2, hh2 * 0.6]],
                    [[hw2 * 0.4, -hh2 * 0.3], [hw2 * 0.1, 0], [hw2 * 0.5, hh2 * 0.5]],
                    [[-hw2 * 0.6, hh2 * 0.1], [-hw2 * 0.2, hh2 * 0.4]],
                ];
                for (const crack of cracks) {
                    ctx.beginPath();
                    ctx.moveTo(crack[0][0], crack[0][1]);
                    for (let ci = 1; ci < crack.length; ci++) ctx.lineTo(crack[ci][0], crack[ci][1]);
                    ctx.stroke();
                }
            }

            // Smoke wisps at heavy damage
            if (heavy) {
                const smokeT = Date.now() / 800;
                for (let si = 0; si < 3; si++) {
                    const sx = (si - 1) * hw2 * 0.4;
                    const sy = -hh2 - 4 - ((smokeT * 12 + si * 7) % 18);
                    const sa = Math.max(0, 0.5 - ((smokeT * 12 + si * 7) % 18) / 36) * dmg;
                    ctx.fillStyle = `rgba(80,60,40,${sa})`;
                    ctx.beginPath();
                    ctx.arc(sx, sy, 4 + si * 2, 0, Math.PI * 2);
                    ctx.fill();
                }
            }

            // Critical: blinking red warning light
            if (critical) {
                const warningBlink = Math.sin(Date.now() * 0.012) > 0;
                if (warningBlink) {
                    ctx.fillStyle = 'rgba(255,50,50,0.9)';
                    const wlx = lander.vehicleType === 'drone' ? 0 : -hw2 * 0.6;
                    ctx.beginPath();
                    ctx.arc(wlx, -hh2 - 6, 3, 0, Math.PI * 2);
                    ctx.fill();
                    // Warning light glow
                    const wg = ctx.createRadialGradient(wlx, -hh2 - 6, 0, wlx, -hh2 - 6, 10);
                    wg.addColorStop(0, 'rgba(255,50,50,0.5)');
                    wg.addColorStop(1, 'rgba(255,50,50,0)');
                    ctx.fillStyle = wg;
                    ctx.beginPath();
                    ctx.arc(wlx, -hh2 - 6, 10, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        }
        // Shield Bubble — soft glowing forcefield: transparent center, glow rising
        // toward a bright rim, plus a specular shine arc. Was a flat filled disk.
        if (lander.maxShieldCharge > 0 && !lander.crashed && lander.integrity > 0) {
            const chargeRatio = Math.max(0, (lander.shieldCharge || 0) / lander.maxShieldCharge);
            if (chargeRatio > 0.02) {
                const R = Math.max(lander.width, lander.height) * 0.9;
                const pulse = Math.sin(Date.now() * 0.004) * 0.5 + 0.5;
                const flash = lander.shieldHitFlash || 0;
                const baseAlpha = 0.08 + 0.14 * chargeRatio + pulse * 0.04 + flash * 0.45;

                ctx.save();

                // Soft outer glow — radial gradient already fades to transparent at
                // both ends, so it reads as soft without a canvas blur filter
                // (blur() is a full pixel convolution and was a major per-frame cost).
                const glowGrad = ctx.createRadialGradient(0, 0, R * 0.5, 0, 0, R * 1.1);
                glowGrad.addColorStop(0, 'rgba(96, 200, 255, 0)');
                glowGrad.addColorStop(0.7, `rgba(96, 200, 255, ${baseAlpha * 0.5})`);
                glowGrad.addColorStop(1, 'rgba(96, 200, 255, 0)');
                ctx.fillStyle = glowGrad;
                ctx.beginPath(); ctx.arc(0, 0, R * 1.1, 0, Math.PI * 2); ctx.fill();

                // Body — transparent middle, faint fill building toward the rim
                const bodyGrad = ctx.createRadialGradient(0, 0, R * 0.3, 0, 0, R);
                bodyGrad.addColorStop(0, 'rgba(125, 211, 252, 0)');
                bodyGrad.addColorStop(0.75, `rgba(56, 189, 248, ${baseAlpha * 0.35})`);
                bodyGrad.addColorStop(1, `rgba(125, 211, 252, ${Math.min(1, baseAlpha + flash * 0.3)})`);
                ctx.fillStyle = bodyGrad;
                ctx.beginPath(); ctx.arc(0, 0, R, 0, Math.PI * 2); ctx.fill();

                // Bright rim edge
                ctx.strokeStyle = `rgba(224, 242, 254, ${Math.min(1, baseAlpha + 0.35 + flash * 0.5)})`;
                ctx.lineWidth = 1.2;
                ctx.beginPath(); ctx.arc(0, 0, R, 0, Math.PI * 2); ctx.stroke();

                // Specular shine — a glass-like highlight arc, top-left
                ctx.strokeStyle = `rgba(255, 255, 255, ${0.3 + flash * 0.4})`;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(0, 0, R * 0.92, Math.PI * 1.1, Math.PI * 1.5);
                ctx.stroke();

                ctx.restore();
            }
        }

        if (lander.crashed) {
            // Dark charred overlay
            ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
            ctx.beginPath();
            ctx.arc(0, 0, Math.max(lander.width, lander.height) * 0.5 + 4, 0, Math.PI * 2);
            ctx.fill();

            // Flickering fire — soft layered gradient flames + rising embers, instead
            // of three flat solid-color circles.
            const now = Date.now();

            // Warm ground glow beneath the flames
            const glow = ctx.createRadialGradient(0, 8, 0, 0, 8, 24);
            glow.addColorStop(0, 'rgba(251, 146, 60, 0.35)');
            glow.addColorStop(1, 'rgba(251, 146, 60, 0)');
            ctx.fillStyle = glow;
            ctx.beginPath(); ctx.arc(0, 8, 24, 0, Math.PI * 2); ctx.fill();

            for (let i = -1; i <= 1; i++) {
                const flicker = Math.sin(now * 0.012 + i * 2.1) * 0.5 + 0.5;
                const fx = i * 11 + Math.sin(now * 0.008 + i) * 3;
                const h = 15 + flicker * 11;
                const cy = 6 - h * 0.35;
                const grad = ctx.createRadialGradient(fx, cy, 1, fx, cy, h * 0.65);
                grad.addColorStop(0, 'rgba(255, 241, 197, 0.9)');
                grad.addColorStop(0.45, 'rgba(251, 146, 60, 0.85)');
                grad.addColorStop(1, 'rgba(239, 68, 68, 0)');
                ctx.fillStyle = grad;
                ctx.beginPath();
                ctx.ellipse(fx, cy, 6 + flicker * 2.5, h * 0.65, 0, 0, Math.PI * 2);
                ctx.fill();
            }

            // Rising embers
            for (let i = 0; i < 4; i++) {
                const t = (now * 0.0012 + i * 0.37) % 1.4;
                const ex = Math.sin(now * 0.003 + i * 3.3) * 9;
                const ey = 4 - t * 24;
                ctx.fillStyle = `rgba(253, 186, 116, ${Math.max(0, 1 - t / 1.4) * 0.85})`;
                ctx.beginPath(); ctx.arc(ex, ey, 1.4, 0, Math.PI * 2); ctx.fill();
            }
        }

        ctx.restore();
    }

,
getPadRanges() {
        const p = this.physics;
        const ranges = [];
        if (p.startDepot) ranges.push({ left: p.startDepot.x, right: p.startDepot.x + p.startDepot.width });
        if (p.collectionPoint) ranges.push({ left: p.collectionPoint.x, right: p.collectionPoint.x + p.collectionPoint.width });
        for (const hub of p.deliveryHubs) ranges.push({ left: hub.x, right: hub.x + hub.width });
        return ranges;
    }

,
drawSandWorm() {
        if (!this.physics.sandWorm) return;
        const m = this.physics.sandWorm;
        const ctx = this.ctx;
        const t = Date.now() / 1000;

        const trail = m.trail;
        if (!trail || trail.length < 4) return;

        // ── Helper: sample world position + forward angle along trail ──
        function trailSample(dist) {
            let walked = 0;
            for (let i = 1; i < trail.length; i++) {
                const dx = trail[i].x - trail[i - 1].x;
                const dy = trail[i].y - trail[i - 1].y;
                const d = Math.sqrt(dx * dx + dy * dy);
                if (walked + d >= dist) {
                    const f = d < 0.001 ? 0 : (dist - walked) / d;
                    return { x: trail[i - 1].x + dx * f, y: trail[i - 1].y + dy * f, angle: Math.atan2(dy, dx) };
                }
                walked += d;
            }
            const p = trail[trail.length - 1];
            return { x: p.x, y: p.y, angle: 0 };
        }

        // Segments — large, chunky, Dune-style
        const SEGS = [
            { d: 0,   r: 48 }, // HEAD — big open maw
            { d: 62,  r: 42 },
            { d: 118, r: 37 },
            { d: 168, r: 32 },
            { d: 212, r: 27 },
            { d: 250, r: 22 },
            { d: 282, r: 18 },
            { d: 308, r: 14 },
            { d: 328, r: 10 },
            { d: 344, r:  7 },
        ];

        const positions = SEGS.map(s => ({ r: s.r, ...trailSample(s.d) }));
        const head = positions[0];

        const lander = this.physics.lander;
        const hdx = lander ? lander.x - m.x : m.vx;
        const hdy = lander ? lander.y - m.y : m.vy;
        const targetHeadAngle = Math.atan2(hdy, hdx);

        if (m.currentHeadAngle === undefined) {
            m.currentHeadAngle = targetHeadAngle;
        } else {
            let diff = targetHeadAngle - m.currentHeadAngle;
            while (diff < -Math.PI) diff += Math.PI * 2;
            while (diff >  Math.PI) diff -= Math.PI * 2;
            m.currentHeadAngle += diff * 0.15;
        }

        const headAngle = m.currentHeadAngle;
        const glowPulse = 0.55 + Math.abs(Math.sin(t * 1.8)) * 0.45;

        // ══ PASS 0: DEEP GLOW AURA ══════════════════════════════════════════
        ctx.save();
        const auraGrad = ctx.createRadialGradient(head.x, head.y, 0, head.x, head.y, head.r * 5.5);
        auraGrad.addColorStop(0, `rgba(200, 100, 20, ${0.28 * glowPulse})`);
        auraGrad.addColorStop(0.5, `rgba(160, 70, 5, ${0.12 * glowPulse})`);
        auraGrad.addColorStop(1, 'rgba(120, 50, 0, 0)');
        ctx.fillStyle = auraGrad;
        ctx.beginPath();
        ctx.arc(head.x, head.y, head.r * 5.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // ══ PASS 1: BODY LATERAL APPENDAGES ═════════════════════════════════════
        ctx.save();
        for (let i = 1; i < positions.length; i++) {
            const seg = positions[i];
            if (!seg) continue;
            for (const side of [-1, 1]) {
                const spineAngle = seg.angle + side * Math.PI * 0.5;
                // Base circle
                const rootX = seg.x + Math.cos(spineAngle) * seg.r * 0.9;
                const rootY = seg.y + Math.sin(spineAngle) * seg.r * 0.9;
                
                ctx.fillStyle = 'rgba(120,40,10,0.9)';
                ctx.beginPath();
                ctx.arc(rootX, rootY, seg.r * 0.35, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = 'rgba(0,0,0,0.6)';
                ctx.lineWidth = 1.5;
                ctx.stroke();

                // Inner bright circle
                const innerX = rootX + Math.cos(spineAngle) * seg.r * 0.15;
                const innerY = rootY + Math.sin(spineAngle) * seg.r * 0.15;
                ctx.fillStyle = `rgba(220,130,30,${0.7 + glowPulse * 0.3})`;
                ctx.beginPath();
                ctx.arc(innerX, innerY, seg.r * 0.15, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        ctx.restore();

        // ══ PASS 2: BODY SEGMENTS (back to front) ═══════════════════════════
        ctx.save();
        for (let i = positions.length - 1; i >= 0; i--) {
            const seg = positions[i];
            const isHead = i === 0;

            const bGrad = ctx.createRadialGradient(seg.x, seg.y, 0, seg.x, seg.y, seg.r);
            bGrad.addColorStop(0,    '#1a0d00');
            bGrad.addColorStop(0.45, '#331a00');
            bGrad.addColorStop(0.72, '#5c2a00');
            bGrad.addColorStop(0.88, '#8f4300');
            bGrad.addColorStop(1,    '#c05800');
            ctx.fillStyle = bGrad;
            ctx.strokeStyle = `rgba(220, 120, 20, ${0.5 + glowPulse * 0.3})`;
            ctx.lineWidth = isHead ? 3 : 2;
            ctx.beginPath();
            ctx.arc(seg.x, seg.y, seg.r, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // Segment crease lines (give a ringed, segmented feel)
            if (!isHead && i % 2 === 0) {
                const perpAngle = seg.angle + Math.PI / 2;
                ctx.strokeStyle = 'rgba(0,0,0,0.35)';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(seg.x, seg.y, seg.r * 0.92, perpAngle - 0.8, perpAngle + 0.8);
                ctx.stroke();
                ctx.beginPath();
                ctx.arc(seg.x, seg.y, seg.r * 0.92, perpAngle + Math.PI - 0.8, perpAngle + Math.PI + 0.8);
                ctx.stroke();
            }

            if (isHead) {
                // ══ DUNE-STYLE CIRCULAR MAW ══════════════════════════════════
                ctx.save();
                ctx.translate(seg.x, seg.y);
                ctx.rotate(headAngle);

                const R = seg.r;  // radius of the head circle

                // ── 1. OUTER LIP RING (segmented chitin plates) ──────────────
                const lipPlates = 20;
                for (let li = 0; li < lipPlates; li++) {
                    const a0 = (li / lipPlates) * Math.PI * 2;
                    const a1 = ((li + 0.82) / lipPlates) * Math.PI * 2;
                    const openFrac = 0.92; // how open the maw is (slightly contracted at back)

                    const lipR = R * 0.98;
                    const innerR = R * 0.78;

                    // Alternate dark / mid tone for chitin plate texture
                    const plateLuma = li % 2 === 0 ? 0.55 : 0.40;
                    ctx.fillStyle = `rgba(${Math.round(160*plateLuma)},${Math.round(75*plateLuma)},${Math.round(15*plateLuma)},0.95)`;
                    ctx.strokeStyle = 'rgba(0,0,0,0.7)';
                    ctx.lineWidth = 1.2;

                    ctx.beginPath();
                    ctx.arc(0, 0, lipR, a0, a1);
                    ctx.arc(0, 0, innerR, a1, a0, true);
                    ctx.closePath();
                    ctx.fill();
                    ctx.stroke();
                }

                // ── 2. THROAT VOID ────────────────────────────────────────────
                const throatGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, R * 0.78);
                throatGrad.addColorStop(0,   '#000000');
                throatGrad.addColorStop(0.45, '#0a0200');
                throatGrad.addColorStop(0.85, '#1a0500');
                throatGrad.addColorStop(1,   '#2a0a00');
                ctx.fillStyle = throatGrad;
                ctx.beginPath();
                ctx.arc(0, 0, R * 0.78, 0, Math.PI * 2);
                ctx.fill();

                // ── 3. PULSING PHARYNX GLOW ───────────────────────────────────
                const throatPulse = 0.25 + Math.abs(Math.sin(t * 2.4)) * 0.45;
                const pharynxGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, R * 0.52);
                pharynxGrad.addColorStop(0,   `rgba(255,140,20,${throatPulse * 0.95})`);
                pharynxGrad.addColorStop(0.55, `rgba(220,60,0,${throatPulse * 0.6})`);
                pharynxGrad.addColorStop(1,   'rgba(160,20,0,0)');
                ctx.fillStyle = pharynxGrad;
                ctx.beginPath();
                ctx.arc(0, 0, R * 0.52, 0, Math.PI * 2);
                ctx.fill();

                // ── 4. OUTER RING OF TEETH (large, curved, radial) ────────────
                // Pointed inward toward throat — Dune worm mandibles fan outward
                const outerTeethCount = 18;
                for (let ti = 0; ti < outerTeethCount; ti++) {
                    const angle = (ti / outerTeethCount) * Math.PI * 2;
                    const toothLen   = R * 0.40;
                    const toothWidth = R * 0.085;

                    // Root on the inner edge of the lip ring
                    const rootR  = R * 0.76;
                    const rootX  = Math.cos(angle) * rootR;
                    const rootY  = Math.sin(angle) * rootR;

                    // Tip points toward center (inward)
                    const tipR  = R * 0.36;
                    const tipX  = Math.cos(angle) * tipR;
                    const tipY  = Math.sin(angle) * tipR;

                    // Perpendicular for tooth width
                    const perpX = -Math.sin(angle) * toothWidth;
                    const perpY =  Math.cos(angle) * toothWidth;

                    // Curved tooth: bezier curving slightly to the side (gives the rotational feel)
                    const curl  = 0.25; // how much the tooth curves (rotational direction)
                    const cpR   = R * 0.56;
                    const cpAngle = angle + curl;
                    const cpX   = Math.cos(cpAngle) * cpR;
                    const cpY   = Math.sin(cpAngle) * cpR;

                    ctx.fillStyle = `rgba(215, 200, 150, 0.95)`;
                    ctx.strokeStyle = 'rgba(0,0,0,0.8)';
                    ctx.lineWidth = 0.8;

                    ctx.beginPath();
                    ctx.moveTo(rootX + perpX, rootY + perpY);
                    ctx.quadraticCurveTo(cpX + perpX * 0.4, cpY + perpY * 0.4, tipX, tipY);
                    ctx.quadraticCurveTo(cpX - perpX * 0.4, cpY - perpY * 0.4, rootX - perpX, rootY - perpY);
                    ctx.closePath();
                    ctx.fill();
                    ctx.stroke();
                }

                // ── 5. INNER RING OF SMALLER TEETH (second row) ──────────────
                const innerTeethCount = 14;
                for (let ti = 0; ti < innerTeethCount; ti++) {
                    const angle = ((ti + 0.5) / innerTeethCount) * Math.PI * 2;
                    const toothLen   = R * 0.22;
                    const toothWidth = R * 0.055;

                    const rootR = R * 0.50;
                    const rootX = Math.cos(angle) * rootR;
                    const rootY = Math.sin(angle) * rootR;

                    const tipR  = R * 0.28;
                    const tipX  = Math.cos(angle) * tipR;
                    const tipY  = Math.sin(angle) * tipR;

                    const perpX = -Math.sin(angle) * toothWidth;
                    const perpY =  Math.cos(angle) * toothWidth;

                    const curl  = 0.3;
                    const cpR   = R * 0.39;
                    const cpAngle = angle + curl;
                    const cpX   = Math.cos(cpAngle) * cpR;
                    const cpY   = Math.sin(cpAngle) * cpR;

                    ctx.fillStyle = `rgba(200, 180, 130, 0.9)`;
                    ctx.strokeStyle = 'rgba(0,0,0,0.7)';
                    ctx.lineWidth = 0.6;

                    ctx.beginPath();
                    ctx.moveTo(rootX + perpX, rootY + perpY);
                    ctx.quadraticCurveTo(cpX + perpX * 0.3, cpY + perpY * 0.3, tipX, tipY);
                    ctx.quadraticCurveTo(cpX - perpX * 0.3, cpY - perpY * 0.3, rootX - perpX, rootY - perpY);
                    ctx.closePath();
                    ctx.fill();
                    ctx.stroke();
                }

                // ── 6. INNERMOST TOOTH RING (tiny, near the pharynx) ─────────
                const coreTeethCount = 9;
                for (let ti = 0; ti < coreTeethCount; ti++) {
                    const angle = (ti / coreTeethCount) * Math.PI * 2;
                    const toothWidth = R * 0.035;

                    const rootR = R * 0.30;
                    const rootX = Math.cos(angle) * rootR;
                    const rootY = Math.sin(angle) * rootR;

                    const tipR  = R * 0.14;
                    const tipX  = Math.cos(angle) * tipR;
                    const tipY  = Math.sin(angle) * tipR;

                    const perpX = -Math.sin(angle) * toothWidth;
                    const perpY =  Math.cos(angle) * toothWidth;

                    ctx.fillStyle = `rgba(240, 220, 160, 0.85)`;
                    ctx.strokeStyle = 'rgba(0,0,0,0.65)';
                    ctx.lineWidth = 0.5;

                    ctx.beginPath();
                    ctx.moveTo(rootX + perpX, rootY + perpY);
                    ctx.lineTo(tipX, tipY);
                    ctx.lineTo(rootX - perpX, rootY - perpY);
                    ctx.closePath();
                    ctx.fill();
                    ctx.stroke();
                }

                // ── 7. INNER EYE / CORE SPOT ──────────────────────────────────
                const eyePulse = 0.6 + Math.sin(t * 3.5) * 0.4;
                ctx.fillStyle = `rgba(255, 80, 0, ${eyePulse * 0.85})`;
                ctx.beginPath();
                ctx.arc(0, 0, R * 0.08, 0, Math.PI * 2);
                ctx.fill();

                ctx.restore(); // end head transform
            }
        }
        ctx.restore();
    }

    // Horizontal x-ranges of the flat landing pads (start depot, collection, hubs)

,
drawMonster() {
        if (!this.physics.monster) return;
        const m = this.physics.monster;
        const ctx = this.ctx;
        const t = Date.now() / 1000;

        const trail = m.trail;
        if (!trail || trail.length < 4) return;

        // ── Helper: sample world position + forward angle along trail ──
        function trailSample(dist) {
            let walked = 0;
            for (let i = 1; i < trail.length; i++) {
                const dx = trail[i].x - trail[i - 1].x;
                const dy = trail[i].y - trail[i - 1].y;
                const d = Math.sqrt(dx * dx + dy * dy);
                if (walked + d >= dist) {
                    const f = d < 0.001 ? 0 : (dist - walked) / d;
                    return { x: trail[i - 1].x + dx * f, y: trail[i - 1].y + dy * f, angle: Math.atan2(dy, dx) };
                }
                walked += d;
            }
            const p = trail[trail.length - 1];
            return { x: p.x, y: p.y, angle: 0 };
        }

        // Bigger segments — ~40% larger than before
        const SEGS = [
            { d: 0, r: 50 }, // HEAD
            { d: 60, r: 43 },
            { d: 112, r: 38 },
            { d: 156, r: 34 },
            { d: 194, r: 30 },
            { d: 228, r: 26 },
            { d: 258, r: 22 },
            { d: 285, r: 18 },
            { d: 308, r: 13 },
            { d: 326, r: 10 },
            { d: 339, r: 7 },
        ];

        const positions = SEGS.map(s => ({ r: s.r, ...trailSample(s.d) }));
        const head = positions[0];

        const lander = this.physics.lander;
        const hdx = lander ? lander.x - m.x : m.vx;
        const hdy = lander ? lander.y - m.y : m.vy;
        const targetHeadAngle = Math.atan2(hdy, hdx);

        // Smoothly interpolate the head angle (shortest path)
        if (m.currentHeadAngle === undefined) {
            m.currentHeadAngle = targetHeadAngle;
        } else {
            let diff = targetHeadAngle - m.currentHeadAngle;
            while (diff < -Math.PI) diff += Math.PI * 2;
            while (diff > Math.PI) diff -= Math.PI * 2;
            // Lerp factor: 0.08 for smooth, natural rotation
            m.currentHeadAngle += diff * 0.08;
        }

        const headAngle = m.currentHeadAngle;
        // "Up" from the head's facing direction (perpendicular)
        const upAngle = headAngle - Math.PI / 2;

        const glowPulse = 0.55 + Math.abs(Math.sin(t * 1.8)) * 0.45;

        // ══ PASS 0: DEEP GLOW (drawn behind everything) ════════════════════
        ctx.save();
        // Overall body aura
        const auraGrad = ctx.createRadialGradient(head.x, head.y, 0, head.x, head.y, head.r * 4.5);
        auraGrad.addColorStop(0, `rgba(200, 20, 20, ${0.22 * glowPulse})`);
        auraGrad.addColorStop(0.5, `rgba(180, 10, 10, ${0.10 * glowPulse})`);
        auraGrad.addColorStop(1, 'rgba(140, 0, 0, 0)');
        ctx.fillStyle = auraGrad;
        ctx.beginPath();
        ctx.arc(head.x, head.y, head.r * 4.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // ══ PASS 1: LEGS — randomised per segment, organic scuttle ══════════
        ctx.save();
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        // Per-segment deterministic "DNA" so legs keep their character frame-to-frame
        const legDNA = [
            { sides: [-1, 1], count: 1, spread: 0.45, len: 1.6, thick: 3.8 },
            { sides: [-1, 1], count: 2, spread: 0.55, len: 1.3, thick: 3.2 },
            { sides: [-1], count: 1, spread: 0.38, len: 2.0, thick: 2.8 },
            { sides: [-1, 1], count: 1, spread: 0.60, len: 1.1, thick: 3.5 },
            { sides: [1], count: 2, spread: 0.42, len: 1.8, thick: 2.5 },
            { sides: [-1, 1], count: 1, spread: 0.50, len: 1.4, thick: 3.0 },
            { sides: [-1, 1], count: 1, spread: 0.35, len: 2.2, thick: 2.2 },
            { sides: [1], count: 1, spread: 0.48, len: 1.2, thick: 2.8 },
        ];
        for (let i = 1; i <= 8; i++) {
            const seg = positions[i];
            if (!seg) continue;
            const dna = legDNA[i - 1] || legDNA[0];
            const basePhase = t * (1.8 + i * 0.3) + i * 1.7;
            const spasm = Math.sin(t * 6.5 + i * 2.8) > 0.88 ? 2.2 : 1.0;

            for (const side of dna.sides) {
                for (let li = 0; li < dna.count; li++) {
                    const legPhase = basePhase + li * 1.1;
                    const spreadAngle = dna.spread + li * 0.18;
                    const rootX = seg.x + Math.cos(seg.angle + side * Math.PI * spreadAngle) * seg.r * 0.8;
                    const rootY = seg.y + Math.sin(seg.angle + side * Math.PI * spreadAngle) * seg.r * 0.8;

                    const reach = seg.r * dna.len;
                    const j1X = rootX + side * reach * 0.45 + Math.sin(legPhase * 0.8) * 8 * spasm;
                    const j1Y = rootY + reach * 0.35 + Math.cos(legPhase) * 6 * spasm;
                    const j2X = j1X + side * reach * 0.38 + Math.sin(legPhase * 1.3 + 0.9) * 10 * spasm;
                    const j2Y = j1Y + reach * 0.45 + Math.cos(legPhase * 0.9 + 1.2) * 7 * spasm;
                    const footX = j2X + side * reach * 0.22 + Math.sin(legPhase * 1.7) * 8 * spasm;
                    const footY = j2Y + reach * 0.25 + Math.cos(legPhase * 1.1) * 5;

                    ctx.strokeStyle = 'rgba(0,0,0,0.88)';
                    ctx.lineWidth = dna.thick;
                    ctx.beginPath();
                    ctx.moveTo(rootX, rootY);
                    ctx.bezierCurveTo(j1X, j1Y, j2X, j2Y, footX, footY);
                    ctx.stroke();

                    ctx.strokeStyle = `rgba(140,15,15,0.55)`;
                    ctx.lineWidth = dna.thick * 0.45;
                    ctx.stroke();

                    // Claw — 2 tines of random length
                    const clawLen = 6 + (i % 3) * 3;
                    for (const cs of [-1, 1]) {
                        ctx.strokeStyle = 'rgba(0,0,0,0.85)';
                        ctx.lineWidth = 1.4;
                        ctx.beginPath();
                        ctx.moveTo(footX, footY);
                        ctx.lineTo(footX + side * clawLen * 0.6 + cs * 4, footY + clawLen);
                        ctx.stroke();
                    }
                }
            }
        }
        ctx.restore();

        // ══ PASS 3: SEGMENT CIRCLES — dark void body, glowing crimson rim ═══
        ctx.save();
        for (let i = positions.length - 1; i >= 0; i--) {
            const seg = positions[i];
            const isHead = i === 0;

            // Outer ember glow — brightest just outside the rim, dark at center
            const rimGlow = ctx.createRadialGradient(seg.x, seg.y, seg.r * 0.7, seg.x, seg.y, seg.r * 2.6);
            rimGlow.addColorStop(0, `rgba(160, 10, 10, ${0.35 * glowPulse})`);
            rimGlow.addColorStop(0.45, `rgba(200, 20, 20, ${0.18 * glowPulse})`);
            rimGlow.addColorStop(1, 'rgba(80, 0, 0, 0)');
            ctx.fillStyle = rimGlow;
            ctx.beginPath();
            ctx.arc(seg.x, seg.y, seg.r * 2.6, 0, Math.PI * 2);
            ctx.fill();

            // Body — void center fading to hot crimson rim (inverted shading = no plastic-ball look)
            const bGrad = ctx.createRadialGradient(seg.x, seg.y, 0, seg.x, seg.y, seg.r);
            bGrad.addColorStop(0, '#060000');
            bGrad.addColorStop(0.45, '#1a0303');
            bGrad.addColorStop(0.72, '#540808');
            bGrad.addColorStop(0.88, '#8b1010');
            bGrad.addColorStop(1, '#c21414');
            ctx.fillStyle = bGrad;
            ctx.strokeStyle = `rgba(220, 20, 20, ${0.55 + glowPulse * 0.25})`;
            ctx.lineWidth = isHead ? 2.5 : 1.8;
            ctx.beginPath();
            ctx.arc(seg.x, seg.y, seg.r, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // Veins/cracks — thin glowing lines on surface (skip tail segments)
            if (i < 7 && seg.r > 14) {
                const crackPhase = i * 2.4 + t * 0.4;
                ctx.strokeStyle = `rgba(255, 40, 0, ${0.18 + Math.abs(Math.sin(crackPhase)) * 0.14})`;
                ctx.lineWidth = 0.8;
                for (let c = 0; c < 2; c++) {
                    const ca = crackPhase + c * Math.PI;
                    ctx.beginPath();
                    ctx.moveTo(seg.x + Math.cos(ca) * seg.r * 0.25, seg.y + Math.sin(ca) * seg.r * 0.25);
                    ctx.bezierCurveTo(
                        seg.x + Math.cos(ca + 0.5) * seg.r * 0.55, seg.y + Math.sin(ca + 0.5) * seg.r * 0.55,
                        seg.x + Math.cos(ca + 0.9) * seg.r * 0.7, seg.y + Math.sin(ca + 0.9) * seg.r * 0.7,
                        seg.x + Math.cos(ca + 1.2) * seg.r * 0.82, seg.y + Math.sin(ca + 1.2) * seg.r * 0.82
                    );
                    ctx.stroke();
                }
            }

            if (isHead) {
                // ── MOUTH — massive oval taking up most of the face ────────
                const mCx = seg.x + Math.cos(headAngle) * seg.r * 0.52;
                const mCy = seg.y + Math.sin(headAngle) * seg.r * 0.52;
                const mW = seg.r * 0.72, mH = seg.r * 0.48;

                ctx.save();
                ctx.translate(mCx, mCy);
                ctx.rotate(headAngle);

                // Mouth void
                const mouthGrad = ctx.createRadialGradient(0, 0, 0, 0, mH * 0.3, mW);
                mouthGrad.addColorStop(0, '#1a0000');
                mouthGrad.addColorStop(0.6, '#0a0000');
                mouthGrad.addColorStop(1, '#050000');
                ctx.fillStyle = mouthGrad;
                ctx.strokeStyle = 'rgba(0,0,0,0.95)';
                ctx.lineWidth = 2.5;
                ctx.beginPath();
                ctx.ellipse(0, 0, mW, mH, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();

                // Inner throat glow (pulsing red from depth)
                const throatPulse = 0.3 + Math.abs(Math.sin(t * 2.1)) * 0.35;
                const throatGrad = ctx.createRadialGradient(0, 2, 0, 0, 2, mW * 0.7);
                throatGrad.addColorStop(0, `rgba(255,30,0,${throatPulse})`);
                throatGrad.addColorStop(1, 'rgba(255,0,0,0)');
                ctx.fillStyle = throatGrad;
                ctx.beginPath();
                ctx.ellipse(0, 2, mW * 0.7, mH * 0.7, 0, 0, Math.PI * 2);
                ctx.fill();

                // Teeth — top row (sharp triangles, bone-yellowed not cartoon-white)
                const toothCount = 7;
                for (let ti = 0; ti < toothCount; ti++) {
                    const tx = -mW * 0.88 + (ti / (toothCount - 1)) * mW * 1.76;
                    const tGrad = ctx.createLinearGradient(tx, -mH * 0.85, tx, -mH * 0.15);
                    tGrad.addColorStop(0, 'rgba(200, 185, 140, 0.9)');
                    tGrad.addColorStop(1, 'rgba(120, 80, 60, 0.85)');
                    ctx.fillStyle = tGrad;
                    ctx.strokeStyle = 'rgba(0,0,0,0.8)';
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(tx - mW * 0.07, -mH * 0.85);
                    ctx.lineTo(tx, -mH * 0.12);
                    ctx.lineTo(tx + mW * 0.07, -mH * 0.85);
                    ctx.closePath();
                    ctx.fill();
                    ctx.stroke();
                }
                // Bottom row (offset half a tooth)
                for (let ti = 0; ti < toothCount - 1; ti++) {
                    const tx = -mW * 0.76 + (ti / (toothCount - 2)) * mW * 1.52;
                    const tGrad2 = ctx.createLinearGradient(tx, mH * 0.85, tx, mH * 0.18);
                    tGrad2.addColorStop(0, 'rgba(190, 175, 130, 0.88)');
                    tGrad2.addColorStop(1, 'rgba(110, 70, 50, 0.82)');
                    ctx.fillStyle = tGrad2;
                    ctx.beginPath();
                    ctx.moveTo(tx - mW * 0.065, mH * 0.85);
                    ctx.lineTo(tx, mH * 0.15);
                    ctx.lineTo(tx + mW * 0.065, mH * 0.85);
                    ctx.closePath();
                    ctx.fill();
                    ctx.stroke();
                }
                ctx.restore();

                // ── ARMS — two large forward-reaching clawed appendages ──────
                for (const side of [-1, 1]) {
                    const armPhase = t * 1.2 + side * 1.4;
                    const baseAng = headAngle + side * 1.1;
                    const rootX = seg.x + Math.cos(baseAng) * seg.r * 0.75;
                    const rootY = seg.y + Math.sin(baseAng) * seg.r * 0.75;

                    const elbow1X = rootX + Math.cos(headAngle + side * 0.5) * seg.r * 1.0 + Math.sin(armPhase) * 12;
                    const elbow1Y = rootY + Math.sin(headAngle + side * 0.5) * seg.r * 1.0 + Math.cos(armPhase) * 10;
                    const elbow2X = elbow1X + Math.cos(headAngle + side * 0.2) * seg.r * 0.9 + Math.sin(armPhase * 1.3 + 0.7) * 10;
                    const elbow2Y = elbow1Y + Math.sin(headAngle + side * 0.2) * seg.r * 0.9 + Math.cos(armPhase * 1.3 + 0.7) * 8;
                    const tipX = elbow2X + Math.cos(headAngle) * seg.r * 0.55;
                    const tipY = elbow2Y + Math.sin(headAngle) * seg.r * 0.55;

                    // Arm shadow
                    ctx.strokeStyle = 'rgba(0,0,0,0.9)';
                    ctx.lineWidth = 7;
                    ctx.lineCap = 'round';
                    ctx.lineJoin = 'round';
                    ctx.beginPath();
                    ctx.moveTo(rootX, rootY);
                    ctx.bezierCurveTo(elbow1X, elbow1Y, elbow2X, elbow2Y, tipX, tipY);
                    ctx.stroke();
                    // Arm flesh
                    ctx.strokeStyle = `rgba(160,10,10,0.85)`;
                    ctx.lineWidth = 4.5;
                    ctx.stroke();
                    // Arm highlight
                    ctx.strokeStyle = `rgba(220,30,20,0.4)`;
                    ctx.lineWidth = 1.5;
                    ctx.stroke();

                    // Claw — three tines at tip
                    const clawLen = seg.r * 0.48;
                    for (let ci = -1; ci <= 1; ci++) {
                        const clawAng = headAngle + ci * 0.45;
                        ctx.strokeStyle = 'rgba(0,0,0,0.88)';
                        ctx.lineWidth = 3.2;
                        ctx.lineCap = 'round';
                        ctx.beginPath();
                        ctx.moveTo(tipX, tipY);
                        ctx.lineTo(tipX + Math.cos(clawAng) * clawLen, tipY + Math.sin(clawAng) * clawLen);
                        ctx.stroke();
                        ctx.strokeStyle = 'rgba(180,15,15,0.75)';
                        ctx.lineWidth = 1.8;
                        ctx.stroke();
                    }
                }
                ctx.lineCap = 'butt';
            }
        }
        ctx.restore();
    }

    // Generic radar-ping zone — driven entirely by level config.
    // Any level can opt in by adding a `radarPingZone` object:
    //   radarPingZone: { cx, cy, r, color, period }
    // where color is an RGB string like '210,100,15'.

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
            }
        }
        ctx.restore();
    }

});
