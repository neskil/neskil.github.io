// render/pads.js — landing pads (shared drawPadBase), HQ sourcing depot,
// delivery hubs and their background-structure styles (crane/house/depot/silo).
// Prototype-mixin on CargoGame (see render.js header). Split out of
// render/entities.js, which had grown past 3000 lines.
Object.assign(CargoGame.prototype, {
// Shared landing-pad base — HQ, Cargo Depot and every delivery hub all call
// this so the three pad types sit on the terrain identically: same slab,
// same chevron stripes, same 3px accent bar, same edge glow, same label
// position. Per-pad extras (extract beacon, loading bar, drop light) stay
// at the call sites.
drawPadBase(x, y, w, h, opts = {}) {
        const ctx = this.ctx;
        // Slab
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(x, y, w, h);
        // Chevron stripes clipped to the slab
        ctx.save();
        ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
        const sw = 13;
        ctx.fillStyle = opts.stripe || 'rgba(100,120,160,0.25)';
        for (let sx = x - h; sx < x + w + h; sx += sw * 2) {
            ctx.beginPath();
            ctx.moveTo(sx, y + h); ctx.lineTo(sx + h, y);
            ctx.lineTo(sx + h + sw, y); ctx.lineTo(sx + sw, y + h);
            ctx.closePath(); ctx.fill();
        }
        ctx.restore();
        // Accent bar along the contact line
        ctx.fillStyle = opts.accent || '#94a3b8';
        ctx.fillRect(x, y, w, 3);
        // Pulsing edge glow ("r,g,b" string)
        if (opts.glowRGB) {
            const gpulse = 0.4 + Math.abs(Math.sin(Date.now() * 0.003)) * 0.4;
            const g = ctx.createLinearGradient(x, 0, x + w, 0);
            g.addColorStop(0, `rgba(${opts.glowRGB},0)`);
            g.addColorStop(0.5, `rgba(${opts.glowRGB},${gpulse * 0.55})`);
            g.addColorStop(1, `rgba(${opts.glowRGB},0)`);
            ctx.strokeStyle = g;
            ctx.lineWidth = 1.5;
            ctx.strokeRect(x, y, w, h);
        }
        if (opts.label) {
            ctx.fillStyle = opts.labelColor || 'rgba(255,255,255,0.7)';
            ctx.font = '600 10px Outfit, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(opts.label, x + w / 2, y + 11);
        }
    }

,
// '#rrggbb' → 'r,g,b' (for the pad edge glow); falls back to sky blue.
_hexToRGB(hex) {
        const m = /^#([0-9a-f]{6})/i.exec(hex || '');
        if (!m) return '56,189,248';
        const n = parseInt(m[1], 16);
        return `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`;
    }

,
drawSourcingDepot() {
        const ctx = this.ctx;
        const start = this.physics.startDepot;
        const collection = this.physics.collectionPoint;
        const level = levels[this.currentLevelIndex];
        const allDelivered = level && this.deliveredCount >= level.targetCargo;

        const lander = this.physics.lander;
        const _drawDeployCircle = (cx, padY, color) => { };
        const isDrone = lander && lander.vehicleType === 'drone';

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

            // Landing Pad — shared base (accent pulses green when extraction ready)
            const hqPulse = 0.6 + Math.abs(Math.sin(Date.now() * 0.005)) * 0.4;
            this.drawPadBase(start.x, start.y, start.width, start.height, {
                accent: allDelivered ? `rgba(16, 185, 129, ${hqPulse})` : '#94a3b8',
                stripe: 'rgba(100, 120, 160, 0.25)',
                glowRGB: allDelivered ? '16,185,129' : '148,163,184',
                label: 'HQ',
                labelColor: allDelivered ? 'rgba(16,185,129,0.9)' : 'rgba(255,255,255,0.5)',
            });

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
                    
                    ctx.fillStyle = this._grad(`hoverLight|${start.y}|#10b981`, (c) => {
                        const g = c.createLinearGradient(0, start.y - 30, 0, start.y);
                        g.addColorStop(0, 'rgba(0,0,0,0)');
                        g.addColorStop(1, '#10b981');
                        return g;
                    });
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

            ctx.fillStyle = this._grad(`warehouse|${wbX}|${wbW}`, (c) => {
                const g = c.createLinearGradient(wbX, wbY, wbX + wbW, wbY);
                g.addColorStop(0, '#0f1e2e');
                g.addColorStop(0.5, '#152434');
                g.addColorStop(1, '#0c1a28');
                return g;
            });
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

            // ── Landing pad surface — shared base ─────────────────────────
            this.drawPadBase(cx, cy, cw, ch, {
                accent: '#38bdf8',
                stripe: 'rgba(251,191,36,0.2)',
                glowRGB: '56,189,248',
                label: 'CARGO',
                labelColor: 'rgba(56,189,248,0.9)',
            });

            if (_seqActive) {
                const _pp = 0.7 + Math.abs(Math.sin(now * 0.008)) * 0.3;
                ctx.fillStyle = `rgba(56,189,248,${_pp})`;
                ctx.font = '600 11px Outfit, sans-serif';
                ctx.textAlign = 'center';
                const maxSpawn = isDrone ? 1 : 3;
                ctx.fillText(`LOADING ${_col.loadSeq.spawned} / ${maxSpawn}`, cpCx, wbY - 45);

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

                // Tractor Beam Cone — animated alpha moved to globalAlpha so
                // the gradient itself is constant and cacheable.
                const beamAlpha = 0.15 + Math.sin(now * 0.005) * 0.05;
                ctx.fillStyle = this._grad(`tractorBeam|${hub.y}`, (c) => {
                    const g = c.createLinearGradient(0, hub.y - 80, 0, hub.y);
                    g.addColorStop(0, 'transparent');
                    g.addColorStop(1, 'rgba(16, 185, 129, 1)');
                    return g;
                });
                ctx.save();
                ctx.globalAlpha = beamAlpha;
                ctx.beginPath();
                ctx.moveTo(hub.x - 30, hub.y - 80);
                ctx.lineTo(hub.x + hw + 30, hub.y - 80);
                ctx.lineTo(hub.x + hw - 4, hub.y);
                ctx.lineTo(hub.x + 4, hub.y);
                ctx.closePath();
                ctx.fill();
                ctx.restore();

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

            // ── Hub structure (selectable per hub via `style`) ────────────
            // 'crane' (default) keeps the original overhead crane; 'house',
            // 'depot' and 'silo' draw a background building behind the pad
            // instead; 'none' leaves a bare pad.
            const hubStyle = hub.style || 'crane';
            const craneTopY = hub.y - 66;
            const craneX = hcx + hub.width * 0.28;
            const craneArmLeft = hub.x - 6;

            // Pallet stack — delivered boxes visibly pile up here instead of
            // vanishing; this is the hub's actual drop-off target (all styles).
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

            if (hubStyle === 'crane') {
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
            } else if (hubStyle === 'house') {
                this.drawHubHouse(hub, hcx, now);
            } else if (hubStyle === 'depot') {
                this.drawHubDepot(hub, hcx, now);
            } else if (hubStyle === 'silo') {
                this.drawHubSilo(hub, hcx, now);
            } else if (hubStyle === 'repair') {
                this.drawHubRepair(hub, hcx, now);
            } // 'none' → bare pad

            // Glow column beacon — soft tapered light shaft, not a flat box
            const pulse = 0.12 + Math.abs(Math.sin(Date.now() * 0.002)) * 0.1;
            const beaconCx = hub.x + hub.width / 2;
            const beaconGrad = this._grad(`hubBeacon|${hub.y}|${hub.color}`, (c) => {
                const g = c.createLinearGradient(0, hub.y - 200, 0, hub.y);
                g.addColorStop(0, 'rgba(0,0,0,0)');
                g.addColorStop(1, hub.color);
                return g;
            });
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
                
                ctx.fillStyle = this._grad(`hoverLight|${hub.y}|${hub.color}`, (c) => {
                    const g = c.createLinearGradient(0, hub.y - 30, 0, hub.y);
                    g.addColorStop(0, 'rgba(0,0,0,0)');
                    g.addColorStop(1, hub.color);
                    return g;
                });
                ctx.fillRect(hub.x, hub.y - 30, hub.width, 30);
            }
            ctx.globalAlpha = 1.0;

            // Hub pad — shared base, exactly the pad's physical footprint so it
            // sits level with (and reads identically to) the HQ / Cargo pads
            this.drawPadBase(hub.x, hub.y, hub.width, hub.height, {
                accent: hub.color,
                stripe: hub.color + '40',
                glowRGB: this._hexToRGB(hub.color),
                label: hub.name ? hub.name.toUpperCase() : '',
                labelColor: '#f8fafc',
            });

            if (hasMatchingCargo) {
                const bpulse = 0.5 + Math.abs(Math.sin(Date.now() * 0.006)) * 0.5;
                ctx.strokeStyle = hub.color;
                ctx.globalAlpha = bpulse;
                ctx.lineWidth = 2;
                ctx.strokeRect(hub.x, hub.y, hub.width, hub.height);
                ctx.globalAlpha = 1.0;
            }

            // "Drop now" light — distinct from the ambient hub.color pulse
            // above, which only means "you're carrying something this hub
            // wants, wherever you currently are". This is the definitive
            // "you are landed at the correct hub, right now" signal the
            // "Dropoff Feedback" backlog item asked for: a bright green
            // beacon that only lights up once landerIsHere is actually true,
            // mirroring the same condition checkCargoDelivery() (game.js)
            // uses to actually process the delivery.
            const lnd = this.physics.lander;
            const readyToDeliver = hasMatchingCargo && lnd && lnd.landed && lnd.currentPad === hub.type;
            if (readyToDeliver) {
                const rpulse = 0.65 + Math.sin(Date.now() * 0.012) * 0.35;
                const lightX = hub.x + hub.width / 2;
                const lightY = hub.y - 14;
                ctx.fillStyle = this._grad(`dropLight|${lightX}|${lightY}`, (c) => {
                    const g = c.createRadialGradient(lightX, lightY, 0, lightX, lightY, 12);
                    g.addColorStop(0, 'rgba(74, 222, 128, 1)');
                    g.addColorStop(1, 'rgba(74, 222, 128, 0)');
                    return g;
                });
                ctx.save();
                ctx.globalAlpha = Math.max(0, Math.min(1, rpulse));
                ctx.beginPath(); ctx.arc(lightX, lightY, 12, 0, Math.PI * 2); ctx.fill();
                ctx.restore();

                ctx.fillStyle = '#4ade80';
                ctx.beginPath(); ctx.arc(lightX, lightY, 3, 0, Math.PI * 2); ctx.fill();

                ctx.fillStyle = '#f0fdf4';
                ctx.font = '700 8px Outfit, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('DROP', lightX, lightY - 14);
            }

            // Hub type label (below pad)
            ctx.fillStyle = hub.color;
            ctx.font = '500 9px Outfit, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(hub.type ? hub.type.toUpperCase() : '', hub.x + hub.width / 2, hub.y + hub.height + 11);
        }
    }

,
// ── Hub background structures (hub.style variants) ──────────────────────
// Each sits ON hub.y, drawn behind the pad base, tinted with hub.color.
drawHubRepair(hub, hcx, now) {
        const ctx = this.ctx;
        const bw = Math.min(80, hub.width * 0.9), bh = 16;
        const bx = hcx - bw / 2, byTop = hub.y - bh;
        const pulse = 0.5 + Math.abs(Math.sin(now * 0.003)) * 0.4;

        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.moveTo(bx + 6, byTop); ctx.lineTo(bx + bw - 6, byTop);
        ctx.lineTo(bx + bw, hub.y); ctx.lineTo(bx, hub.y);
        ctx.fill();

        ctx.fillStyle = '#0f172a';
        ctx.fillRect(bx + 10, byTop + 4, bw - 20, 6);

        ctx.fillStyle = `rgba(16, 185, 129, ${pulse})`; // Glowing repair green
        ctx.fillRect(bx + 14, byTop + 6, bw - 28, 2);
    }
,
drawHubHouse(hub, hcx, now) {
        const ctx = this.ctx;
        const bw = Math.min(64, hub.width * 0.85), bh = 42;
        const bx = hcx - bw / 2, byTop = hub.y - bh;
        const pulse = 0.5 + Math.abs(Math.sin(now * 0.002)) * 0.4;

        // Chimney (behind roof)
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(bx + bw - 16, byTop - 6, 7, 20);

        // Walls
        ctx.fillStyle = this._grad(`hubHouse|${bx}|${bw}`, (c) => {
            const g = c.createLinearGradient(bx, 0, bx + bw, 0);
            g.addColorStop(0, '#16233a');
            g.addColorStop(1, '#0e1828');
            return g;
        });
        ctx.fillRect(bx, byTop + 12, bw, bh - 12);
        ctx.strokeStyle = '#1e3a5f';
        ctx.lineWidth = 1.2;
        ctx.strokeRect(bx, byTop + 12, bw, bh - 12);

        // Pitched roof
        ctx.fillStyle = '#0f172a';
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(bx - 6, byTop + 14);
        ctx.lineTo(hcx, byTop - 6);
        ctx.lineTo(bx + bw + 6, byTop + 14);
        ctx.closePath();
        ctx.fill(); ctx.stroke();

        // Door with hub-colored trim
        ctx.fillStyle = '#060e18';
        ctx.fillRect(hcx - 7, hub.y - 17, 14, 17);
        ctx.strokeStyle = hub.color;
        ctx.lineWidth = 1;
        ctx.strokeRect(hcx - 7, hub.y - 17, 14, 17);

        // Lit window
        ctx.fillStyle = `rgba(251,191,36,${0.35 + pulse * 0.5})`;
        ctx.fillRect(bx + 8, byTop + 19, 11, 10);
        ctx.strokeStyle = '#1e3a5f';
        ctx.strokeRect(bx + 8, byTop + 19, 11, 10);

        // Roof-tip beacon in the hub's color
        ctx.fillStyle = hub.color;
        ctx.globalAlpha = 0.4 + pulse * 0.6;
        ctx.beginPath(); ctx.arc(hcx, byTop - 8, 2, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 1;
    }

,
drawHubDepot(hub, hcx, now) {
        const ctx = this.ctx;
        const bw = Math.min(96, hub.width + 16), bh = 46;
        const bx = hcx - bw / 2, byTop = hub.y - bh;
        const pulse = 0.5 + Math.abs(Math.sin(now * 0.003)) * 0.4;

        // Flat-roof shed body
        ctx.fillStyle = this._grad(`hubDepot|${bx}|${bw}`, (c) => {
            const g = c.createLinearGradient(bx, 0, bx + bw, 0);
            g.addColorStop(0, '#0f1e2e');
            g.addColorStop(0.5, '#152434');
            g.addColorStop(1, '#0c1a28');
            return g;
        });
        ctx.strokeStyle = '#1e3a5f';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(bx, byTop, bw, bh, [3, 3, 0, 0]);
        else ctx.rect(bx, byTop, bw, bh);
        ctx.fill(); ctx.stroke();

        // Corrugated ribs
        ctx.strokeStyle = 'rgba(30,58,94,0.8)';
        ctx.lineWidth = 1;
        for (let rx = bx + 10; rx < bx + bw - 4; rx += 10) {
            ctx.beginPath();
            ctx.moveTo(rx, byTop + 4); ctx.lineTo(rx, hub.y - 2);
            ctx.stroke();
        }

        // Roller door with slats
        const dW = bw * 0.4, dH = bh * 0.55;
        const dx = hcx - dW / 2, dy = hub.y - dH;
        ctx.fillStyle = '#060e18';
        ctx.fillRect(dx, dy, dW, dH);
        ctx.strokeStyle = '#1e3a5f';
        ctx.strokeRect(dx, dy, dW, dH);
        ctx.strokeStyle = 'rgba(51,65,85,0.9)';
        for (let ly = dy + 4; ly < hub.y - 2; ly += 5) {
            ctx.beginPath(); ctx.moveTo(dx + 2, ly); ctx.lineTo(dx + dW - 2, ly); ctx.stroke();
        }

        // Neon roof edge in the hub's color
        ctx.strokeStyle = hub.color;
        ctx.globalAlpha = 0.4 + pulse * 0.4;
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(bx, byTop); ctx.lineTo(bx + bw, byTop); ctx.stroke();
        ctx.globalAlpha = 1;

        // Corner strobe
        const strobeOn = (now % 1200) < 600;
        ctx.fillStyle = strobeOn ? 'rgba(251,191,36,0.95)' : 'rgba(80,60,10,0.6)';
        ctx.beginPath(); ctx.arc(bx + 5, byTop + 7, 3, 0, Math.PI * 2); ctx.fill();
    }

,
drawHubSilo(hub, hcx, now) {
        const ctx = this.ctx;
        const sw2 = 30, sh = 58;
        const sx0 = hcx - sw2 / 2, top = hub.y - sh;
        const pulse = 0.5 + Math.abs(Math.sin(now * 0.004)) * 0.5;

        // Cylinder body
        ctx.fillStyle = this._grad(`hubSilo|${sx0}`, (c) => {
            const g = c.createLinearGradient(sx0, 0, sx0 + sw2, 0);
            g.addColorStop(0, '#0e1828');
            g.addColorStop(0.5, '#1b2b44');
            g.addColorStop(1, '#0c1626');
            return g;
        });
        ctx.fillRect(sx0, top + 10, sw2, sh - 10);
        ctx.strokeStyle = '#1e3a5f';
        ctx.lineWidth = 1.2;
        ctx.strokeRect(sx0, top + 10, sw2, sh - 10);

        // Dome cap
        ctx.fillStyle = '#16233a';
        ctx.beginPath();
        ctx.arc(hcx, top + 11, sw2 / 2, Math.PI, 0);
        ctx.fill(); ctx.stroke();

        // Horizontal bands
        ctx.strokeStyle = 'rgba(30,58,94,0.9)';
        ctx.lineWidth = 1;
        for (const fy of [0.3, 0.55, 0.8]) {
            const ly = top + 10 + (sh - 10) * fy;
            ctx.beginPath(); ctx.moveTo(sx0 + 1, ly); ctx.lineTo(sx0 + sw2 - 1, ly); ctx.stroke();
        }

        // Side ladder
        const lx = sx0 + sw2 + 3;
        ctx.strokeStyle = '#334155';
        ctx.beginPath();
        ctx.moveTo(lx, hub.y); ctx.lineTo(lx, top + 16);
        ctx.moveTo(lx + 4, hub.y); ctx.lineTo(lx + 4, top + 16);
        ctx.stroke();
        for (let ry = top + 20; ry < hub.y - 2; ry += 7) {
            ctx.beginPath(); ctx.moveTo(lx, ry); ctx.lineTo(lx + 4, ry); ctx.stroke();
        }

        // Dome beacon in the hub's color
        ctx.fillStyle = hub.color;
        ctx.globalAlpha = 0.3 + pulse * 0.7;
        ctx.beginPath(); ctx.arc(hcx, top - 6, 2.5, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 1;
        ctx.strokeStyle = hub.color;
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(hcx, top - 4); ctx.lineTo(hcx, top + 2); ctx.stroke();
    }

});
