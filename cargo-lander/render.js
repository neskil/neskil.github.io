// render.js - Extracted rendering logic for CargoLander

const CargoRendererMixin = {
// Keyed cache for CanvasGradient objects — building a gradient is a per-call
// allocation plus color-stop parsing, and dozens were being rebuilt every
// frame with identical parameters. Key must encode every input the gradient
// depends on. Animated alphas should be applied via ctx.globalAlpha instead
// of being baked into the stops so the gradient itself stays cacheable.
_grad(key, build) {
    const cache = this._gradCache || (this._gradCache = new Map());
    let g = cache.get(key);
    if (g === undefined) {
        if (cache.size > 400) cache.clear(); // safety valve, never expected in practice
        g = build(this.ctx);
        cache.set(key, g);
    }
    return g;
},

draw() {
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;

        // 1. Draw Space Background Gradient (level-themed) — cached, only rebuilt
        // when canvas size or palette changes (createLinearGradient is a per-call
        // allocation and this used to run every frame).
        const lvPal = (levels[this.currentLevelIndex] || {}).palette;
        const skyKey = `${w}x${h}|${lvPal ? lvPal.skyTop + lvPal.skyMid + lvPal.skyBot : 'default'}`;
        if (this._skyGradKey !== skyKey) {
            const grad = ctx.createLinearGradient(0, 0, 0, h);
            grad.addColorStop(0, lvPal ? lvPal.skyTop : '#090d16');
            grad.addColorStop(0.5, lvPal ? lvPal.skyMid : '#0f172a');
            grad.addColorStop(1, lvPal ? lvPal.skyBot : '#1e1b4b');
            this._skyGrad = grad;
            this._skyGradKey = skyKey;
        }
        ctx.fillStyle = this._skyGrad;
        ctx.fillRect(0, 0, w, h);

        const levelConfig = levels[this.currentLevelIndex];
        const isCave = levelConfig?.backgroundType === 'cave';

        // 2. Parallax background layers
        if (this.bgLayers && !isCave) {
            const camX = this.gameState === 'playing' ? this.camera.x : 0;
            const camY = this.gameState === 'playing' ? this.camera.y : 0;

            // Nebulae (drawn first, behind stars) — pre-baked sprites from
            // generateStars(); drawing a scaled bitmap replaces a per-nebula
            // radial-gradient build + fill every frame.
            for (const neb of this.bgNebulae) {
                const sx = neb.x - camX * neb.parallax;
                const sy = neb.y - camY * neb.parallax;
                if (sx < -neb.r - 100 || sx > w + neb.r + 100) continue;
                if (neb.sprite) {
                    ctx.drawImage(neb.sprite, sx - neb.r, sy - neb.r, neb.r * 2, neb.r * 2);
                } else {
                    const ng = ctx.createRadialGradient(sx, sy, 0, sx, sy, neb.r);
                    const [r, g, b] = neb.col;
                    ng.addColorStop(0, `rgba(${r},${g},${b},${neb.alpha})`);
                    ng.addColorStop(1, `rgba(${r},${g},${b},0)`);
                    ctx.fillStyle = ng;
                    ctx.fillRect(sx - neb.r, sy - neb.r, neb.r * 2, neb.r * 2);
                }
            }

            // Star layers — twinkle via globalAlpha over a constant per-star
            // color string (star.css, set at generation) instead of building a
            // fresh `rgba(...)` string per star per frame; halo stars draw a
            // shared pre-baked halo sprite instead of a radial gradient each.
            for (const layer of this.bgLayers) {
                for (const star of layer.objects) {
                    star.phase += star.speed;
                    const pulse = 0.4 + Math.abs(Math.sin(star.phase)) * 0.6;
                    const sx = star.x - camX * layer.parallax;
                    const sy = star.y - camY * layer.parallax;
                    if (sx < -4 || sx > w + 4 || sy < -4 || sy > h + 4) continue;
                    const a = star.alpha * pulse;
                    ctx.globalAlpha = a;
                    if (star.halo && this._haloSprite) {
                        const hr = star.size * 3.5;
                        ctx.drawImage(this._haloSprite, sx - hr, sy - hr, hr * 2, hr * 2);
                    } else {
                        ctx.fillStyle = star.css || `rgb(${star.r},${star.g},${star.b})`;
                        ctx.beginPath();
                        ctx.arc(sx, sy, star.size, 0, Math.PI * 2);
                        ctx.fill();
                    }
                }
            }
            ctx.globalAlpha = 1;
        }

        // Top HUD breathing room — dark-to-transparent band so game elements sit below the HTML HUD
        if (this.gameState !== 'menu') {
            ctx.fillStyle = this._grad('hudTopBand', (c) => {
                const g = c.createLinearGradient(0, 0, 0, 88);
                g.addColorStop(0, 'rgba(5, 8, 18, 0.65)');
                g.addColorStop(1, 'rgba(5, 8, 18, 0)');
                return g;
            });
            ctx.fillRect(0, 0, w, 88);
        }

        // --- Menu Specific Background Rendering ---
        if (this.floatingTexts) {
            for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
                const ft = this.floatingTexts[i];
                ft.life -= 16.6 * 0.001; 
                ft.y -= 16.6 * 0.05; 
                if (ft.life <= 0) this.floatingTexts.splice(i, 1);
            }
        }
        if (this.gameState === 'menu') {
            this.drawMenuBackgroundEntity();
            return; // Don't draw the level geometry
        }

        if (isCave) {
            this.drawCaveBackground();
        } else {
            this.drawParallax();
        }

        // Apply Camera Transform for Level rendering
        ctx.save();

        // Move to screen center, scale, then move by camera offset
        ctx.translate(w / 2 + (this.screenShake?.x || 0), h / 2 + (this.screenShake?.y || 0));
        ctx.scale(this.camera.zoom, this.camera.zoom);
        ctx.translate(-this.camera.x, -this.camera.y);

        // 3. Draw Gravity Well Anomaly
        if (this.physics && this.physics.gravityWells && this.gameState === 'playing') {
            if (!this.shaders || !this.shaders.gl) {
                for (const gw of this.physics.gravityWells) {
                    this.drawGravityWell(gw, gw);
                }
            }
        }

        // 4. Draw Delivery Hub Zones (Hologram beacons)
        this.drawDeliveryHubs();

        // 5. Draw Terrain Landscape
        this.drawUnderground();

        if (levelConfig?.outOfBounds) {
            this.drawFluidBounds();
        }

        this.drawWaterBodies();

        // 5.5 Draw weather behind the solid terrain
        if (this.drawWeather) {
            ctx.restore(); // Undo the camera transform to avoid double-transform, since drawWeather applies it again
            this.drawWeather();
            ctx.save();
            ctx.translate(w / 2 + (this.screenShake?.x || 0), h / 2 + (this.screenShake?.y || 0));
            ctx.scale(this.camera.zoom, this.camera.zoom);
            ctx.translate(-this.camera.x, -this.camera.y);
        }

        this.drawHazards(true); // Draw background hazards (behind terrain)
        this.drawTerrain();
        this.drawSegments();
        this.drawHazards(false); // Draw foreground hazards (in front of terrain)
        this.drawCollectibles();
        this.drawRadarPingZone();

        // 6. Draw Cargo Sourcing Depot Building
        this.drawSourcingDepot();
        this.drawNextObjectiveArrow();

        // 6b. Draw world buildings
        this.drawBuildings();

        // 6c. Draw ambient space truck traffic
        this.drawAmbientTraffic();

        // 8.5 Draw Floating Texts
        if (this.floatingTexts) {
            for (const ft of this.floatingTexts) {
                ctx.save();
                ctx.font = 'bold 24px Outfit';
                ctx.textAlign = 'center';
                ctx.globalAlpha = Math.max(0, ft.life / 1.5);
                ctx.fillStyle = ft.color || '#10b981';
                ctx.strokeStyle = 'black';
                ctx.lineWidth = 3;
                ctx.strokeText(ft.text, ft.x, ft.y);
                ctx.fillText(ft.text, ft.x, ft.y);
                ctx.restore();
            }
        }

        // Draw entities before postFX so they get reflected in the water
        this.drawBoxes();
        this.drawLander();

        // 8.7 WebGL Post-Processing Distortion Pass (heat haze / water shimmer /
        // gravity lensing) — samples the scene just drawn above (terrain, hubs,
        // lander, cargo, but not yet the monster/particles/HUD) as a texture and
        // re-draws a warped version of it on top, replacing pixels only inside
        // active effect regions. Toggleable in Settings for low-end hardware
        // (skips the texture upload entirely when off — see renderPostFX()).
        if (this.shaders && this.postFXEnabled) {
            const waterRects = [];
            if (this.physics.waterBodies) {
                const toScreen = (x, y) => ({
                    x: (x - this.camera.x) * this.camera.zoom + w / 2,
                    y: (y - this.camera.y) * this.camera.zoom + h / 2,
                });
                for (const wb of this.physics.waterBodies) {
                    if (!wb.pts || wb.pts.length < 3) continue;
                    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
                    for (const p of wb.pts) {
                        minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x);
                        minY = Math.min(minY, p.y); maxY = Math.max(maxY, p.y);
                    }
                    const a = toScreen(minX, minY), b = toScreen(maxX, maxY);
                    waterRects.push({
                        minX: Math.min(a.x, b.x), maxX: Math.max(a.x, b.x),
                        minY: Math.min(a.y, b.y), maxY: Math.max(a.y, b.y),
                    });
                    if (waterRects.length >= 4) break;
                }
            }

            // Only pay for the full-screen composite when the pass actually
            // drew something (it early-outs when no effect region is active).
            if (this.shaders.renderPostFX(this.physics, this.camera, this.canvas, levels[this.currentLevelIndex], waterRects, this.weather)) {
                ctx.save();
                ctx.setTransform(1, 0, 0, 1, 0, 0);
                ctx.globalCompositeOperation = 'source-over';
                ctx.drawImage(this.shaders.canvas, 0, 0);
                ctx.restore();
            }
        }

        if (this.physics.lander && this.physics.lander.vehicleType !== 'drone') {
            const drone = this.physics.boxes.find(b => b.type === 'drone');
            if (drone && !drone.grabbedByDrone) {
                const dx = this.physics.lander.x - drone.x;
                const dy = this.physics.lander.y - drone.y;
                if (Math.sqrt(dx*dx + dy*dy) < 150) {
                    ctx.save();
                    ctx.font = 'bold 12px sans-serif';
                    ctx.textAlign = 'center';
                    ctx.fillStyle = '#fde047';
                    ctx.shadowColor = '#000';
                    ctx.shadowBlur = 4;
                    ctx.fillText('PRESS SPACE TO DEPLOY DRONE', drone.x, drone.y - 30);
                    ctx.restore();
                }
            }
        } else if (this.physics.lander && this.physics.lander.vehicleType === 'drone' && !this.physics.lander.grabbedBoxId) {
            const lndr = this.physics.lander;
            const attachableBox = this.physics.boxes.find(b => {
                if (b.type === 'drone' || b.vacuumed || b.onDeck) return false;
                const dx = lndr.x - b.x;
                const dy = lndr.y - b.y;
                return Math.sqrt(dx*dx + dy*dy) < 60;
            });
            if (attachableBox) {
                ctx.save();
                ctx.font = 'bold 12px sans-serif';
                ctx.textAlign = 'center';
                ctx.fillStyle = '#fde047';
                ctx.shadowColor = '#000';
                ctx.shadowBlur = 4;
                ctx.fillText('PRESS SPACE TO ATTACH', lndr.x, lndr.y - 30);
                ctx.restore();
            }
        }

        ctx.restore(); // Restore camera transform

        // 9. WebGL Render for Particles — skip the full-screen composite when
        // there are no particles or gravity wells to show.
        if (this.shaders && this.shaders.render(this.physics, this.camera)) {
            ctx.save();
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.globalCompositeOperation = 'source-over';
            ctx.drawImage(this.shaders.canvas, 0, 0);
            ctx.restore();
        }

        // 9b. Draw the detailed Canvas2D monster (and particles when WebGL is unavailable)
        ctx.save();
        ctx.translate(w / 2 + (this.screenShake?.x || 0), h / 2 + (this.screenShake?.y || 0));
        ctx.scale(this.camera.zoom, this.camera.zoom);
        ctx.translate(-this.camera.x, -this.camera.y);
        this.drawMonster();
        this.drawPolice();
        this.drawSandWorm();
        if (!this.shaders) this.drawParticles();
        ctx.restore();

        // 9c. Night Ops darkness + lander spotlight — screen-space overlay,
        // sits above the whole scene (terrain/entities/monster/particles) but
        // below the HUD-layer draws that follow (wind indicator, minimap,
        // vignettes, damage flash, version/FPS counter).
        if (this.drawNightOverlay) this.drawNightOverlay();

        // 10. Notifications are now HTML DOM elements — no canvas draw needed
        this.drawNotifications(); // no-op stub kept for safety

        // 11. Draw Wind Indicator and Radar Minimap (minimap draws to #radar-canvas)
        if (this.gameState === 'playing') {
            this.drawWindIndicator();
            this.drawMinimap(); // draws onto #radar-canvas HTML element
            // Quest panel is now an HTML element — no canvas draw needed

            // 12. Draw Lateral Mist
            if (levelConfig?.outOfBounds) {
                this.drawMistEdges();
            }

            // 12b. Draw Monster Threat Vignette
            if (this.physics.outOfBoundsTimer && this.physics.outOfBoundsTimer > 0) {
                const threatLevel = Math.min(1.0, this.physics.outOfBoundsTimer / 120);

                // Draw a more subtle pulsing red vignette
                ctx.save();
                // Quantize the animated intensity to 5% steps so the gradient
                // is cacheable instead of rebuilt every frame (~20 variants max
                // per canvas size).
                const tq = Math.round(threatLevel * 20) / 20;
                ctx.fillStyle = this._grad(`threat|${w}x${h}|${tq}`, (c) => {
                    const g = c.createRadialGradient(w / 2, h / 2, h / 4, w / 2, h / 2, Math.max(w, h));
                    g.addColorStop(0, 'rgba(0,0,0,0)');
                    g.addColorStop(0.5, `rgba(150, 0, 0, ${tq * 0.1})`);
                    g.addColorStop(1, `rgba(200, 0, 0, ${tq * 0.6})`);
                    return g;
                });
                ctx.fillRect(0, 0, w, h);

                // Warning text
                if (threatLevel > 0.3) {
                    const pulse = 0.5 + Math.sin(Date.now() / 150) * 0.5;
                    ctx.font = `bold ${Math.round(20 + threatLevel * 6)}px sans-serif`;
                    ctx.textAlign = 'center';

                    // Add stroke for readability
                    ctx.lineWidth = 3;
                    ctx.strokeStyle = `rgba(0, 0, 0, ${threatLevel})`;
                    ctx.strokeText("⚠ WARNING: LEAVING SAFE ZONE", w / 2, h * 0.25);

                    ctx.fillStyle = `rgba(255, 60, 60, ${threatLevel * 0.5 + pulse * 0.5})`;
                    ctx.fillText("⚠ WARNING: LEAVING SAFE ZONE", w / 2, h * 0.25);
                }
                ctx.restore();
            }
        }

        // 13. Off-screen monster radar indicator
        if (this.physics.monster && this.physics.lander && this.gameState === 'playing') {
            const m = this.physics.monster;
            const zoom = this.camera.zoom;
            const screenMX = (m.x - this.camera.x) * zoom + w / 2;
            const screenMY = (m.y - this.camera.y) * zoom + h / 2;
            const offLeft = screenMX < 0, offRight = screenMX > w;
            const offTop = screenMY < 0, offBottom = screenMY > h;
            if (offLeft || offRight || offTop || offBottom) {
                const margin = 28;
                const clampedX = Math.max(margin, Math.min(w - margin, screenMX));
                const clampedY = Math.max(margin, Math.min(h - margin, screenMY));
                const angle = Math.atan2(screenMY - h / 2, screenMX - w / 2);
                const edgeX = w / 2 + Math.cos(angle) * (Math.min(w, h) / 2 - margin);
                const edgeY = h / 2 + Math.sin(angle) * (Math.min(w, h) / 2 - margin);
                const pulse = 0.6 + Math.abs(Math.sin(Date.now() / 200)) * 0.4;

                ctx.save();
                ctx.translate(Math.max(margin, Math.min(w - margin, edgeX)),
                    Math.max(margin, Math.min(h - margin, edgeY)));
                ctx.rotate(angle + Math.PI / 2);
                ctx.fillStyle = `rgba(239,68,68,${pulse})`;
                ctx.beginPath();
                ctx.moveTo(0, -12);
                ctx.lineTo(8, 6);
                ctx.lineTo(-8, 6);
                ctx.closePath();
                ctx.fill();
                ctx.restore();

                ctx.save();
                ctx.font = 'bold 10px Outfit, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillStyle = `rgba(239,68,68,${pulse * 0.9})`;
                const labelX = Math.max(margin, Math.min(w - margin, edgeX));
                const labelY = Math.max(margin, Math.min(h - margin, edgeY));
                const dist = Math.round(Math.hypot(m.x - this.physics.lander.x, m.y - this.physics.lander.y));
                ctx.fillText(`${dist}m`, labelX, labelY + 20);
                ctx.restore();
            }
        }

        // 13b. Damage flash overlay — strong red vignette + bold text
        if (this.damageFlash > 0) {
            // Solid edge flash — intensity quantized to 5% steps so the
            // gradient caches (see threat vignette above).
            const fq = Math.round(this.damageFlash * 20) / 20;
            ctx.fillStyle = this._grad(`dmg|${w}x${h}|${fq}`, (c) => {
                const g = c.createRadialGradient(w / 2, h / 2, h * 0.15, w / 2, h / 2, h * 0.9);
                g.addColorStop(0, 'rgba(0,0,0,0)');
                g.addColorStop(0.5, `rgba(220,10,0,${fq * 0.5})`);
                g.addColorStop(1, `rgba(255,0,0,${fq * 0.92})`);
                return g;
            });
            ctx.fillRect(0, 0, w, h);
            // Full-width top + bottom bars
            ctx.fillStyle = `rgba(255,0,0,${this.damageFlash * 0.55})`;
            ctx.fillRect(0, 0, w, 6);
            ctx.fillRect(0, h - 6, w, 6);
            if (this.damageFlash > 0.2) {
                ctx.save();
                ctx.textAlign = 'center';
                // Shadow
                ctx.font = 'bold 24px sans-serif';
                ctx.fillStyle = `rgba(0,0,0,${this.damageFlash * 0.8})`;
                ctx.fillText('⚠ HULL DAMAGE', w / 2 + 2, h / 2 - 58);
                // Text
                ctx.fillStyle = `rgba(255,80,80,${Math.min(1, this.damageFlash * 1.5)})`;
                ctx.fillText('⚠ HULL DAMAGE', w / 2, h / 2 - 60);
                ctx.restore();
            }
        }

        // 14. Version + FPS counter (bottom-left corner)
        ctx.save();
        ctx.font = '600 11px "Courier New", monospace';
        ctx.textAlign = 'left';
        ctx.fillStyle = 'rgba(148, 163, 184, 0.5)';
        ctx.fillText(`v${CargoGame.VERSION}`, 14, h - 14);
        if (this.displayFps !== undefined) {
            ctx.fillStyle = this.displayFps >= 50 ? 'rgba(74, 222, 128, 0.6)' : 'rgba(251, 191, 36, 0.75)';
            ctx.fillText(`${this.displayFps} FPS`, 14 + 48, h - 14);
        }
        ctx.restore();
    }

}

// ── Utility: lighten (+) or darken (-) a hex color by amount 0-100 ──────────
function shadeColor(hex, amount) {
    const n = parseInt(hex.replace('#', ''), 16);
    const r = Math.min(255, Math.max(0, (n >> 16) + amount));
    const g = Math.min(255, Math.max(0, ((n >> 8) & 0xff) + amount));
    const b = Math.min(255, Math.max(0, (n & 0xff) + amount));
    return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');
};

Object.assign(CargoGame.prototype, CargoRendererMixin);


// Global game singleton — must be on window so inline HTML handlers can access it
window.game = new CargoGame();
