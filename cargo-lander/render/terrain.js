Object.assign(CargoGame.prototype, {
drawGravityWell(well, baseConfig) {
        const ctx = this.ctx;
        const time = Date.now() * 0.0015;

        // ── Minimap exclusion zone ────────────────────────────────────────────
        // The minimap lives in screen-space top-right; convert well world position to
        // screen coords so we can check proximity. (The camera transform is active here,
        // so we just draw — but we need to know where the well projects on screen to
        // decide whether to skip painting at all. Instead we simply clip the minimap
        // area out so the gradient never bleeds into the HUD.)
        // NOTE: ctx.save() + clip below is in WORLD SPACE so we skip that approach.
        // Instead we rely on the minimap being drawn AFTER this, which already has its
        // own clip region — so we do nothing extra here.

        // ── Base spatial glow ─────────────────────────────────────────────────
        const grad = ctx.createRadialGradient(well.x, well.y, 15, well.x, well.y, 160);
        grad.addColorStop(0, 'rgba(0, 0, 0, 1)');
        grad.addColorStop(0.15, 'rgba(30, 0, 80, 0.9)');
        grad.addColorStop(0.4, 'rgba(76, 29, 149, 0.55)');
        grad.addColorStop(0.75, 'rgba(139, 92, 246, 0.15)');
        grad.addColorStop(1, 'rgba(139, 92, 246, 0)');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(well.x, well.y, 160, 0, Math.PI * 2);
        ctx.fill();

        // ── Animated accretion rings ──────────────────────────────────────────
        // Three concentric rings that cycle inward toward the event horizon,
        // creating the impression of matter spiralling in. Kept subtle — this used
        // to read as a distracting bright pulse rather than a background ambience.
        const RINGS = 3;
        for (let i = 0; i < RINGS; i++) {
            // Each ring starts large and shrinks towards 0 over its period
            const period = 3.6 + i * 0.9;  // seconds per cycle (slower = calmer)
            const phase = (time / period + i / RINGS) % 1; // 0..1, offset per ring
            const radius = 90 * (1 - phase);           // shrinks from 90 → 0
            const alpha = phase < 0.15 ? phase / 0.15  // fade in
                        : phase > 0.75 ? (1 - phase) / 0.25  // fade out near center
                        : 1;
            const hue = 260 + i * 15;
            ctx.strokeStyle = `hsla(${hue}, 70%, 60%, ${alpha * 0.25})`;
            ctx.lineWidth = 1.5 - i * 0.3;
            ctx.beginPath();
            ctx.arc(well.x, well.y, Math.max(0.5, radius), 0, Math.PI * 2);
            ctx.stroke();
        }

        // ── Event Horizon (pure black center) ────────────────────────────────
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(well.x, well.y, 18, 0, Math.PI * 2);
        ctx.fill();

        // ── Photon ring (bright outline around the event horizon) ─────────────
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(well.x, well.y, 18.5, 0, Math.PI * 2);
        ctx.stroke();
    }

,
drawFluidBounds() {
        const levelConfig = levels[this.currentLevelIndex];
        const oob = levelConfig?.outOfBounds;
        if (!oob || oob.type === 'void' || !oob.surfaceY) return;

        const ctx = this.ctx;
        const now = Date.now();
        const viewW = this.canvas.width / this.camera.zoom;
        const startX = this.camera.x - viewW / 2 - 100;
        const endX = this.camera.x + viewW / 2 + 100;
        const depth = Math.max(oob.surfaceY + 2000, this.physics.levelHeight + 1000); // go very deep

        ctx.save();
        ctx.fillStyle = oob.color || 'rgba(14, 165, 233, 0.4)';

        if (oob.type === 'sand') {
            ctx.beginPath();
            ctx.moveTo(startX, oob.surfaceY + 20);
            for (let x = startX; x <= endX; x += 40) {
                const duneY = Math.sin(x * 0.005) * 40 + Math.sin(x * 0.015) * 15;
                ctx.lineTo(x, oob.surfaceY + duneY);
            }
            ctx.lineTo(endX, depth);
            ctx.lineTo(startX, depth);
            ctx.fill();
        } else {
            const step = 40;
            // Snap startX and endX to the step grid so the waves don't "crawl" when camera pans
            const gridStartX = Math.floor(startX / step) * step;
            const gridEndX = Math.ceil(endX / step) * step;

            // Helper to get wave height at a given X
            const getWaveY = (x) => Math.sin(now / 800 + x * 0.02) * 10 + Math.sin(now / 500 + x * 0.05) * 5;
            const getWaveY2 = (x) => Math.sin(now / 600 + x * 0.03) * 8 + Math.sin(now / 400 + x * 0.07) * 4;

            // Main deep water body
            ctx.beginPath();
            ctx.moveTo(gridStartX, oob.surfaceY + getWaveY(gridStartX));
            for (let x = gridStartX + step; x <= gridEndX; x += step) {
                ctx.lineTo(x, oob.surfaceY + getWaveY(x));
            }
            ctx.lineTo(gridEndX, depth);
            ctx.lineTo(gridStartX, depth);
            ctx.closePath();
            
            const depthGrad = ctx.createLinearGradient(0, oob.surfaceY - 20, 0, oob.surfaceY + 400);
            depthGrad.addColorStop(0, 'rgba(14, 165, 233, 0.25)'); // Bright surface
            depthGrad.addColorStop(0.3, 'rgba(14, 100, 200, 0.6)'); // Mid
            depthGrad.addColorStop(1, 'rgba(4, 25, 60, 0.95)'); // Dark abyss
            
            ctx.fillStyle = depthGrad;
            ctx.fill();

            // Surface Shimmer / Foam layer
            ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
            ctx.beginPath();
            ctx.moveTo(gridStartX, oob.surfaceY + getWaveY(gridStartX) + 5);
            for (let x = gridStartX + step; x <= gridEndX; x += step) {
                ctx.lineTo(x, oob.surfaceY + getWaveY(x) + 5);
            }
            for (let x = gridEndX; x >= gridStartX; x -= step) {
                ctx.lineTo(x, oob.surfaceY + getWaveY(x) + 15);
            }
            ctx.closePath();
            ctx.fill();
            
            // Secondary parallax overlapping wave
            ctx.fillStyle = 'rgba(14, 165, 233, 0.2)';
            ctx.beginPath();
            ctx.moveTo(gridStartX, oob.surfaceY + 10 + getWaveY2(gridStartX));
            for (let x = gridStartX + step; x <= gridEndX; x += step) {
                ctx.lineTo(x, oob.surfaceY + 10 + getWaveY2(x));
            }
            ctx.lineTo(gridEndX, depth);
            ctx.lineTo(gridStartX, depth);
            ctx.closePath();
            ctx.fill();
            
            // Bright surface edge reflection
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(gridStartX, oob.surfaceY + getWaveY(gridStartX));
            for (let x = gridStartX + step; x <= gridEndX; x += step) {
                ctx.lineTo(x, oob.surfaceY + getWaveY(x));
            }
            ctx.stroke();
        }

        ctx.restore();
    }

,
drawMistEdges() {
        const levelConfig = levels[this.currentLevelIndex];
        const oob = levelConfig?.outOfBounds;
        if (!oob || !oob.mistColor) return;

        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;
        const zoom = this.camera.zoom;
        const camX = this.camera.x;

        // World coordinates of screen edges
        const leftWorld = camX - (w / 2) / zoom;
        const rightWorld = camX + (w / 2) / zoom;

        const EDGE_FADE_DIST = 400; // Distance over which mist goes from 0 to full
        // Intensity is driven by how far the LANDER is past the boundary, not the
        // camera edge — the start pad usually sits near world x=0, so basing this on
        // camera framing alone made the mist appear at nearly full intensity the
        // moment a mission started, even though the lander was safely on the map.
        const landerX = this.physics.lander ? this.physics.lander.x : camX;
        const levelWForIntensity = this.physics.levelWidth;

        ctx.save();

        // Left Edge Mist
        if (leftWorld < 0) {
            const mistIntensity = Math.min(1.0, Math.max(0, -landerX) / EDGE_FADE_DIST);
            if (mistIntensity > 0) {
                const mistW = (-leftWorld) * zoom;
                const grad = ctx.createLinearGradient(0, 0, mistW, 0);
                grad.addColorStop(0, oob.mistColor);
                grad.addColorStop(1, 'transparent');

                ctx.globalAlpha = mistIntensity;
                ctx.fillStyle = grad;
                ctx.fillRect(0, 0, mistW, h);
            }
        }

        // Right Edge Mist
        const levelW = this.physics.levelWidth;
        if (rightWorld > levelW) {
            const mistIntensity = Math.min(1.0, Math.max(0, landerX - levelWForIntensity) / EDGE_FADE_DIST);
            if (mistIntensity > 0) {
                const mistW = (rightWorld - levelW) * zoom;
                const startX = w - mistW;
                const grad = ctx.createLinearGradient(startX, 0, w, 0);
                grad.addColorStop(0, 'transparent');
                grad.addColorStop(1, oob.mistColor);

                ctx.globalAlpha = mistIntensity;
                ctx.fillStyle = grad;
                ctx.fillRect(startX, 0, mistW, h);
            }
        }

        ctx.restore();
    }

,
drawWaterBodies() {
        // Water bodies are hand-authored polygons (edited in terrain-editor.html
        // the same way as terrainPolygons), not an {x,width} rect anymore — the
        // shape itself defines the basin, so there's no terrain-sampling here.
        const waterBodies = this.physics.waterBodies;
        if (!waterBodies || waterBodies.length === 0) return;

        const ctx = this.ctx;
        const now = Date.now();

        for (const body of waterBodies) {
            const pts = body.pts;
            if (!pts || pts.length < 3) continue;

            let lx = Infinity, rx = -Infinity, ly = Infinity, maxY = -Infinity;
            for (const p of pts) {
                lx = Math.min(lx, p.x); rx = Math.max(rx, p.x);
                ly = Math.min(ly, p.y); maxY = Math.max(maxY, p.y);
            }
            const lw = rx - lx;
            const ld = Math.max(8, maxY - ly); // Depth of the basin, from the authored shape

            // Tint every fill/stroke below from body.surfaceColor when set (e.g.
            // L9's acid pool, '#10b981') instead of always the hardcoded blue —
            // previously every hardcoded color here ignored body.color/surfaceColor
            // entirely, which went unnoticed because the only body that ever set
            // them (L9's acid pool) used to be invisible for an unrelated reason
            // (see the 2026-07-10 waterBodies pts-shape fix above).
            let wr = 14, wg = 45, wb = 90; // default: the original hardcoded blue
            if (body.surfaceColor) {
                const n = parseInt(body.surfaceColor.replace('#', ''), 16);
                wr = (n >> 16) & 0xff; wg = (n >> 8) & 0xff; wb = n & 0xff;
            }
            const wc = (a) => `rgba(${wr},${wg},${wb},${a})`;
            // Lightened toward white for ripple/wave highlight lines
            const brR = Math.round(wr + (255 - wr) * 0.55), brG = Math.round(wg + (255 - wg) * 0.55), brB = Math.round(wb + (255 - wb) * 0.55);
            const wcBright = (a) => `rgba(${brR},${brG},${brB},${a})`;

            ctx.save();

            // Water body — filled with depth gradient, clipped to the authored polygon
            ctx.beginPath();
            pts.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
            ctx.closePath();

            ctx.fillStyle = wc(0.86);
            ctx.fill();

            // Clip all inner content (fish, waves, ripples) to the water polygon
            ctx.beginPath();
            pts.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
            ctx.closePath();
            ctx.clip();

            // Shimmer layer near surface
            ctx.fillStyle = wc(0.12);
            ctx.fillRect(lx, ly, lw, 14);

            // Animated surface ripples
            ctx.strokeStyle = wc(0.30);
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            for (let wx = 0; wx <= lw; wx += 5) {
                const wy = Math.sin(now / 900 + (lx + wx) * 0.048) * 1.8;
                if (wx === 0) ctx.moveTo(lx + wx, ly + 4 + wy);
                else ctx.lineTo(lx + wx, ly + 4 + wy);
            }
            ctx.stroke();
            ctx.beginPath();
            for (let wx = 0; wx <= lw; wx += 5) {
                const wy = Math.sin(now / 650 + (lx + wx) * 0.065 + 1.2) * 1.3;
                if (wx === 0) ctx.moveTo(lx + wx, ly + 9 + wy);
                else ctx.lineTo(lx + wx, ly + 9 + wy);
            }
            ctx.stroke();

            // Decorative wave lines (animated) — capped at 3 regardless of basin
            // depth, so deep basins don't get a busy stack of lines.
            ctx.strokeStyle = wcBright(0.4);
            ctx.lineWidth = 1.5;
            const waveLineCount = 3;
            const waveSpacing = Math.max(10, (ld - 14) / waveLineCount);
            for (let li = 0; li < waveLineCount; li++) {
                const wy = ly + 6 + li * waveSpacing;
                if (wy >= ly + ld - 6) break;
                ctx.beginPath();
                for (let wx = lx; wx < lx + lw; wx += 20) {
                    const waveOffset = Math.sin((wx + now * 0.05) * 0.03 + wy) * 3;
                    if (wx === lx) ctx.moveTo(wx, wy + waveOffset);
                    else ctx.lineTo(wx, wy + waveOffset);
                }
                ctx.stroke();
            }

            // Fish (clipped to water + terrain automatically) — smaller than before
            const fish = [
                { phase: 0.0, depth: 0.30, size: 1.0 },
                { phase: 2.1, depth: 0.52, size: 0.85 },
                { phase: 4.3, depth: 0.68, size: 1.1 },
                { phase: 1.5, depth: 0.40, size: 0.9 },
            ];
            for (const f of fish) {
                const ft = now / 1200 + f.phase;
                const fx = Math.min(Math.max(lx + lw / 2 + Math.sin(ft) * (lw * 0.36), lx + 12), lx + lw - 12);
                const fy = ly + ld * f.depth;
                const dir = Math.cos(ft) >= 0 ? 1 : -1;
                const bw = 9 * f.size, bh = 4 * f.size;
                ctx.fillStyle = 'rgba(60,180,110,0.88)';
                ctx.beginPath();
                ctx.ellipse(fx, fy, bw / 2, bh / 2, 0, 0, Math.PI * 2);
                ctx.fill();
                const tail = fx - dir * (bw / 2);
                ctx.beginPath();
                ctx.moveTo(tail, fy);
                ctx.lineTo(tail - dir * bh * 0.9, fy - bh * 0.75);
                ctx.lineTo(tail - dir * bh * 0.9, fy + bh * 0.75);
                ctx.closePath();
                ctx.fill();
            }

            // Splash particles
            for (const p of this.physics.particles) {
                if (p.x >= lx && p.x <= lx + lw && p.y >= ly && p.y <= ly + ld) {
                    ctx.fillStyle = 'rgba(186,230,253,0.8)';
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, p.size * 0.8, 0, Math.PI * 2);
                    ctx.fill();
                }
            }

            // Render sunk boxes
            for (const box of this.physics.boxes) {
                if (box.x >= lx && box.x <= lx + lw && box.y >= ly) {
                    ctx.fillStyle = 'rgba(15,23,42,0.85)'; // Dark silhouette
                    ctx.fillRect(box.x - box.width / 2, box.y - box.height / 2, box.width, box.height);
                    ctx.strokeStyle = 'rgba(56,189,248,0.4)';
                    ctx.lineWidth = 1;
                    ctx.strokeRect(box.x - box.width / 2, box.y - box.height / 2, box.width, box.height);

                    // Box sinking bubbles
                    if (box.vy > 0.5 && Math.random() < 0.3) {
                        this.physics.particles.push({
                            x: box.x + (Math.random() - 0.5) * box.width,
                            y: box.y - box.height / 2,
                            vx: (Math.random() - 0.5) * 0.5,
                            vy: -1 - Math.random(),
                            life: 1.0, decay: 0.02, size: 1.5, color: 'rgba(186,230,253,0.6)'
                        });
                    }
                }
            }

            ctx.restore();

            // Water surface edge line — soft highlight tinted to the body's color
            ctx.strokeStyle = wcBright(0.55);
            ctx.lineWidth = 1.8;
            ctx.beginPath();
            for (let wx = 0; wx <= lw; wx += 6) {
                const wy = Math.sin(now / 900 + (lx + wx) * 0.048) * 1.5;
                if (wx === 0) ctx.moveTo(lx + wx, ly + wy);
                else ctx.lineTo(lx + wx, ly + wy);
            }
            ctx.stroke();

            // Fishing boat — bobs on the water surface
            if (body.hasBoat) {
                const bx = lx + lw * 0.6 + Math.sin(now / 2000) * 7;
                const by = ly - 1;
                // Hull
                ctx.fillStyle = '#4a3728';
                ctx.strokeStyle = '#6b5240';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(bx - 18, by);
                ctx.lineTo(bx + 18, by);
                ctx.lineTo(bx + 14, by + 10);
                ctx.lineTo(bx - 14, by + 10);
                ctx.closePath();
                ctx.fill(); ctx.stroke();
                // Deck stripe
                ctx.fillStyle = '#94a3b8';
                ctx.fillRect(bx - 18, by + 1, 36, 2.5);
                // Mast + pole
                ctx.strokeStyle = '#7a6050';
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.moveTo(bx - 5, by); ctx.lineTo(bx - 5, by - 22);
                ctx.moveTo(bx - 5, by - 22); ctx.lineTo(bx - 5 + 14, by - 22);
                ctx.stroke();
                // Fishing line
                ctx.strokeStyle = 'rgba(180,180,180,0.65)';
                ctx.lineWidth = 0.8;
                ctx.beginPath();
                ctx.moveTo(bx + 9, by - 22);
                ctx.lineTo(bx + 9 + 6, by + 8 + Math.sin(now / 2000) * 3);
                ctx.stroke();
                // Float
                ctx.fillStyle = '#ef4444';
                ctx.beginPath();
                ctx.arc(bx + 15, by + 8 + Math.sin(now / 2000) * 3, 2.5, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }

,
drawGroundParallax() {
        const ctx = this.ctx;
        if (!this.physics.terrainPolygons || this.physics.terrainPolygons.length === 0) return;
        const lv = levels[this.currentLevelIndex] || {};
        const pal = lv.palette || { terrainFill: '#0b0f19' };

        const hexToRgb = (hex) => {
            const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
            return [r, g, b];
        };
        const [tr, tg, tb] = hexToRgb(pal.terrainFill);

        const layers = [
            { lengthRatio: 1.0, alpha: 0.55, darken: 0.45 },
            { lengthRatio: 0.466, alpha: 0.40, darken: 0.65 },
        ];
        for (const layer of layers) {
            ctx.fillStyle = `rgba(${Math.floor(tr * layer.darken)},${Math.floor(tg * layer.darken)},${Math.floor(tb * layer.darken)},${layer.alpha})`;
            for (const poly of this.physics.terrainPolygons) {
                if (!poly || poly.length < 3) continue;
                if (poly.shadowEnabled === false) continue; // Skip if explicitly disabled

                let area = 0;
                let cx = 0, cy = 0;
                for (let i = 0; i < poly.length; i++) {
                    const p1 = poly[i];
                    const p2 = poly[(i + 1) % poly.length];
                    area += (p2.x - p1.x) * (p2.y + p1.y);
                    cx += p1.x;
                    cy += p1.y;
                }
                cx /= poly.length;
                cy /= poly.length;
                const isCeiling = area > 0;
                const dir = isCeiling ? -1 : 1;
                
                // Defaults: global first, then 60px down
                let globalLen = lv.shadowLength !== undefined ? lv.shadowLength : 60;
                let globalAngle = lv.shadowAngle !== undefined ? lv.shadowAngle : 0;
                
                let sLen = (poly.shadowLength !== undefined ? poly.shadowLength : globalLen) * layer.lengthRatio;
                let sAngle = (poly.shadowAngle !== undefined ? poly.shadowAngle : globalAngle);
                
                // Convert angle to radians (0 = down, 90 = right)
                let rad = sAngle * Math.PI / 180;
                
                // Base shadow angle offset
                let dx = Math.sin(rad) * sLen * dir;
                let dy = Math.cos(rad) * sLen * dir;

                // Draw connecting quads (extrusion walls) to avoid gaps
                ctx.strokeStyle = ctx.fillStyle;
                ctx.lineWidth = 1.0;
                for (let i = 0; i < poly.length; i++) {
                    const p1 = poly[i];
                    const p2 = poly[(i + 1) % poly.length];
                    ctx.beginPath();
                    ctx.moveTo(p1.x, p1.y);
                    ctx.lineTo(p2.x, p2.y);
                    ctx.lineTo(p2.x + dx, p2.y + dy);
                    ctx.lineTo(p1.x + dx, p1.y + dy);
                    ctx.closePath();
                    ctx.fill();
                    ctx.stroke(); // hide antialiasing seams
                }

                // Draw the back face
                ctx.beginPath();
                ctx.moveTo(poly[0].x + dx, poly[0].y + dy);
                for (let i = 1; i < poly.length; i++) {
                    ctx.lineTo(poly[i].x + dx, poly[i].y + dy);
                }
                ctx.closePath();
                ctx.fill();
            }
        }
    }

,
drawTerrain() {
        const ctx = this.ctx;
        if (!this.physics.terrainPolygons || this.physics.terrainPolygons.length === 0) return;

        // Level colour palette (fallback to classic red if not defined)
        const lv = levels[this.currentLevelIndex] || {};
        const pal = lv.palette || {
            terrainFill: '#0b0f19', rockEdge: '#ef4444', rockGlow: 'rgba(239,68,68,',
        };

        // Determine visible X range based on camera
        const zoom = (this.camera.zoom > 0 && isFinite(this.camera.zoom)) ? this.camera.zoom : 1;
        const w = this.canvas.width;
        let startX = Math.floor((this.camera.x - (w / 2 / zoom) - 100) / 20) * 20;
        let endX = this.camera.x + (w / 2 / zoom) + 100;
        if (!isFinite(startX) || !isFinite(endX) || endX - startX > 20000) return;

        // Clamp grass/shadow drawing to actual terrain boundaries
        let minTerrainX = Infinity;
        let maxTerrainX = -Infinity;
        for (const poly of this.physics.terrainPolygons) {
            for (let i = 0; i < poly.length; i++) {
                const p1 = poly[i];
                const p2 = poly[(i + 1) % poly.length];
                if (p1.x < p2.x) { // floor segment
                    if (p1.x < minTerrainX) minTerrainX = p1.x;
                    if (p2.x > maxTerrainX) maxTerrainX = p2.x;
                }
            }
        }
        startX = Math.max(minTerrainX, startX);
        endX = Math.min(maxTerrainX, endX);

        // Fill all terrain polygons
        ctx.fillStyle = pal.terrainFill;
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

        // Draw crisp edges
        ctx.strokeStyle = pal.rockEdge + (pal.rockEdge.length === 7 ? 'aa' : '');
        ctx.lineWidth = 1.8;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        for (const poly of this.physics.terrainPolygons) {
            if (!poly || poly.length < 3) continue;
            ctx.beginPath();
            let drawing = false;
            for (let i = 0; i < poly.length; i++) {
                const p1 = poly[i];
                const p2 = poly[(i + 1) % poly.length];
                // Only stroke floor segments (left-to-right)
                if (p1.x <= p2.x && !p1.invisibleEdge) {
                    if (!drawing) {
                        ctx.moveTo(p1.x, p1.y);
                        drawing = true;
                    }
                    ctx.lineTo(p2.x, p2.y);
                } else {
                    drawing = false;
                }
            }
            ctx.stroke();
        }

        const padRanges = this.getPadRanges();
        const isOverPad = (x) => padRanges.some(p => x >= p.left - 6 && x <= p.right + 6);
        const getH = (x) => this.physics.getPolygonSurfaceY(x);
        const hash = (n) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };

        if (this.currentLevelIndex === 0) {
            // ── L1: Grass tufts — snap to world-space grid so they never shift ──
            ctx.lineWidth = 1.3;
            ctx.lineCap = 'round';
            const grassStep = 10;
            const grassStart = Math.floor(startX / grassStep) * grassStep;
            
            // Batch main blades
            ctx.strokeStyle = '#86efac';
            ctx.beginPath();
            for (let x = grassStart; x <= endX; x += grassStep) {
                if (isOverPad(x)) continue;
                const h0 = hash(x);
                if (h0 < 0.15) continue; // sparse — skip some spots
                const baseY = getH(x);
                const height = 3 + hash(x + 5) * 5;
                const lean = (hash(x + 13) - 0.5) * 4;
                ctx.moveTo(x, baseY);
                ctx.lineTo(x + lean, baseY - height);
            }
            ctx.stroke();

            // Batch side blades
            ctx.strokeStyle = '#4ade80';
            ctx.beginPath();
            for (let x = grassStart; x <= endX; x += grassStep) {
                if (isOverPad(x)) continue;
                const h0 = hash(x);
                if (h0 < 0.15 || h0 <= 0.5) continue;
                const baseY = getH(x);
                const height = 3 + hash(x + 5) * 5;
                const lean = (hash(x + 13) - 0.5) * 4;
                ctx.moveTo(x, baseY - 1);
                ctx.lineTo(x + lean - 3, baseY - height * 0.75);
            }
            ctx.stroke();
            
            ctx.lineCap = 'butt';
        } else {
            // ── Other levels: rock edge noise ──────────────────────────────
            ctx.strokeStyle = pal.rockEdge + '99';
            ctx.lineWidth = 1.2;
            ctx.lineJoin = 'round';
            ctx.beginPath();
            let nStarted = false;
            let lastBaseY = 0;
            for (let x = startX; x <= endX; x += 4) {
                const baseY = getH(x);
                const noise = isOverPad(x) ? 0 : (hash(x) - 0.5) * 3.5;
                if (!nStarted) { 
                    ctx.moveTo(x, baseY + noise); 
                    nStarted = true; 
                } else if (Math.abs(baseY - lastBaseY) > 100) {
                    ctx.moveTo(x, baseY + noise);
                } else { 
                    ctx.lineTo(x, baseY + noise); 
                }
                lastBaseY = baseY;
            }
            ctx.stroke();
        }

        // ── Level 6: Lake Rendering ─────────────────────────────────────────
        if (this.currentLevelIndex === 5) {
            const lakeX1 = 560, lakeX2 = 880;
            const lakeY = this.physics.levelHeight - 90; // matches terrain flat basin
            if (startX < lakeX2 && endX > lakeX1) {
                ctx.fillStyle = 'rgba(29, 78, 216, 0.55)';
                ctx.beginPath();
                ctx.moveTo(Math.max(startX, lakeX1), lakeY);
                for (let x = Math.max(startX, lakeX1); x <= Math.min(endX, lakeX2); x += 10) {
                    const wave = Math.sin(Date.now() * 0.002 + x * 0.03) * 3;
                    ctx.lineTo(x, lakeY + wave);
                }
                ctx.lineTo(Math.min(endX, lakeX2), this.physics.levelHeight);
                ctx.lineTo(Math.max(startX, lakeX1), this.physics.levelHeight);
                ctx.fill();

                ctx.strokeStyle = 'rgba(96, 165, 250, 0.6)';
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                for (let x = Math.max(startX, lakeX1); x <= Math.min(endX, lakeX2); x += 10) {
                    const wave = Math.sin(Date.now() * 0.002 + x * 0.03) * 3;
                    if (x === Math.max(startX, lakeX1)) ctx.moveTo(x, lakeY + wave);
                    else ctx.lineTo(x, lakeY + wave);
                }
                ctx.stroke();
            }
        }

        // Cave ceilings are now drawn as part of terrainPolygons
    }

,
drawUnderground() {
        const ctx = this.ctx;
        const lv = levels[this.currentLevelIndex] || {};
        const zoom = (this.camera.zoom > 0 && isFinite(this.camera.zoom)) ? this.camera.zoom : 1;
        const w = this.canvas.width;
        const startX = Math.floor((this.camera.x - (w / 2 / zoom) - 200) / 20) * 20;
        const endX = this.camera.x + (w / 2 / zoom) + 200;
        if (!isFinite(startX) || !isFinite(endX) || endX - startX > 20000) return;
        const lh = this.physics.levelHeight;
        const t = Date.now() / 1000;

        if (this.currentLevelIndex === 3) {
            // L4 Volcanic: hidden underground data center, visible through cave gaps
            const racks = [
                { x: 320, label: 'SRV-01' }, { x: 420, label: 'DB-03' },
                { x: 520, label: 'SRV-07' }, { x: 620, label: 'CACHE' },
                { x: 720, label: 'NET-02' },
            ];
            for (const rack of racks) {
                if (rack.x < startX - 30 || rack.x > endX + 30) continue;
                const ry = this.physics.getPolygonSurfaceY(rack.x) + 60; // 60px underground
                const blink = Math.sin(t * 3.7 + rack.x * 0.1) > 0.7;
                // Server rack silhouette
                ctx.fillStyle = 'rgba(20,10,30,0.9)';
                ctx.fillRect(rack.x - 10, ry - 28, 20, 28);
                ctx.strokeStyle = 'rgba(168,85,247,0.6)';
                ctx.lineWidth = 1;
                ctx.strokeRect(rack.x - 10, ry - 28, 20, 28);
                // Blinking status lights
                for (let li = 0; li < 5; li++) {
                    const lbOn = Math.sin(t * (4 + li * 1.3) + rack.x * 0.2) > 0.5;
                    ctx.fillStyle = lbOn ? `rgba(${li % 2 === 0 ? '0,255,128' : '255,60,60'},0.9)` : 'rgba(20,40,20,0.5)';
                    ctx.beginPath();
                    ctx.arc(rack.x - 7 + li * 3.5, ry - 8, 1.5, 0, Math.PI * 2);
                    ctx.fill();
                }
                ctx.fillStyle = `rgba(168,85,247,${0.3 + (blink ? 0.4 : 0)})`;
                ctx.font = '5px monospace';
                ctx.textAlign = 'center';
                ctx.fillText(rack.label, rack.x, ry - 32);
            }
            // Connecting cables between racks
            ctx.strokeStyle = 'rgba(168,85,247,0.25)';
            ctx.lineWidth = 1;
            ctx.setLineDash([4, 6]);
            for (let i = 0; i < racks.length - 1; i++) {
                const ay = this.physics.getPolygonSurfaceY(racks[i].x) + 50;
                const by = this.physics.getPolygonSurfaceY(racks[i + 1].x) + 50;
                ctx.beginPath();
                ctx.moveTo(racks[i].x, ay);
                ctx.lineTo(racks[i + 1].x, by);
                ctx.stroke();
            }
            ctx.setLineDash([]);
        }

        if (this.currentLevelIndex === 4) {
            // L5 Crystal cave: glowing crystal formations underground
            const hash = (x) => { let h = x * 127 + 9301; h ^= h >> 16; h *= 0x45d9f3b; return ((h & 0xffff) / 0xffff); };
            for (let cx = Math.floor(startX / 40) * 40; cx < endX; cx += 40) {
                const terrY = this.physics.getPolygonSurfaceY(cx);
                const depth = 30 + hash(cx) * 50;
                const cy = terrY + depth;
                const ch = 15 + hash(cx + 1) * 25;
                const pulse = 0.4 + Math.sin(t * 1.5 + cx * 0.05) * 0.3;
                ctx.fillStyle = `rgba(168,85,247,${pulse * 0.6})`;
                ctx.beginPath();
                ctx.moveTo(cx - 4, cy);
                ctx.lineTo(cx, cy - ch);
                ctx.lineTo(cx + 4, cy);
                ctx.closePath();
                ctx.fill();
                // Glow
                const cg = ctx.createRadialGradient(cx, cy - ch * 0.5, 0, cx, cy - ch * 0.5, ch);
                cg.addColorStop(0, `rgba(168,85,247,${pulse * 0.3})`);
                cg.addColorStop(1, 'rgba(168,85,247,0)');
                ctx.fillStyle = cg;
                ctx.beginPath();
                ctx.arc(cx, cy - ch * 0.5, ch, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }

,
drawSegments() {
        const segs = this.physics.segments;
        if (!segs || segs.length === 0) return;

        const ctx = this.ctx;
        const lv = levels[this.currentLevelIndex] || {};
        const pal = lv.palette || {};
        const now = performance.now();

        ctx.save();

        for (const seg of segs) {
            let color = seg.color || pal.rockEdge || '#f97316';
            let glow = pal.rockGlow || 'rgba(249,115,22,';
            
            if (seg.bouncy) {
                color = '#22d3ee'; // cyan
                glow = 'rgba(34,211,238,';
            } else if (seg.sticky) {
                color = '#d946ef'; // fuchsia
                glow = 'rgba(217,70,239,';
            } else if (seg.fragile) {
                color = '#bae6fd'; // light blue/glass
                glow = 'rgba(186,230,253,';
            } else if (seg.conveyorSpeed) {
                color = '#fde047'; // yellow
                glow = 'rgba(253,224,71,';
            } else if (seg.repulsor) {
                color = '#4ade80'; // bright green
                glow = 'rgba(74,222,128,';
            }

            const pulse = 0.7 + 0.3 * Math.sin(now * 0.002 + (seg.x1 + seg.y1) * 0.01);

            // Glow halo
            ctx.strokeStyle = glow + (0.18 * pulse) + ')';
            ctx.lineWidth = seg.sticky ? 20 : 14;
            ctx.lineCap = 'round';
            if (seg.bouncy) {
                ctx.setLineDash([15, 10]);
            } else if (seg.fragile) {
                ctx.setLineDash([5, 5]);
            } else if (seg.conveyorSpeed) {
                ctx.lineDashOffset = -now * 0.05 * Math.sign(seg.conveyorSpeed);
                ctx.setLineDash([10, 10]);
            } else if (seg.repulsor) {
                ctx.lineDashOffset = now * 0.02;
                ctx.setLineDash([2, 8]);
            } else {
                ctx.setLineDash([]);
            }
            ctx.beginPath();
            ctx.moveTo(seg.x1, seg.y1);
            ctx.lineTo(seg.x2, seg.y2);
            ctx.stroke();

            // Core line
            ctx.strokeStyle = color;
            ctx.lineWidth = seg.sticky ? 5 : 3;
            ctx.beginPath();
            ctx.moveTo(seg.x1, seg.y1);
            ctx.lineTo(seg.x2, seg.y2);
            ctx.stroke();
            
            ctx.lineDashOffset = 0;
            ctx.setLineDash([]); // Reset line dash

            // Bright highlight edge
            ctx.strokeStyle = seg.bouncy ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.55)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(seg.x1, seg.y1);
            ctx.lineTo(seg.x2, seg.y2);
            ctx.stroke();

            // End-cap dots (smaller/less visible)
            ctx.globalAlpha = 0.5;
            for (const [ex, ey] of [[seg.x1, seg.y1], [seg.x2, seg.y2]]) {
                ctx.fillStyle = color;
                ctx.beginPath();
                ctx.arc(ex, ey, 2, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.globalAlpha = 1.0;
        }

        ctx.lineCap = 'butt';
        ctx.restore();
    }

});
