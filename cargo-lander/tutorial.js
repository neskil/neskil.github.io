// tutorial.js — the "How to Play" modal's animated mission diagram
// (#tutorial-modal in index.html): the lander lifts a crate off the start
// pad, slings it along a dashed arc, and sets it down on the delivery hub.
// Reuses the game's own drawLander() via the same mock-lander trick as the
// vehicle-select previews in game/menu.js. Exposes window.openTutorialModal
// / closeTutorialModal, wired to the modal's buttons in index.html.
(function () {
    const modal = document.getElementById('tutorial-modal');
    const canvas = document.getElementById('tutorial-scene-canvas');
    let rafId = null;

    window.openTutorialModal = function () {
        modal.style.display = 'flex';
        if (rafId === null) rafId = requestAnimationFrame(tick);
    };
    window.closeTutorialModal = function () {
        modal.style.display = 'none';
        if (rafId !== null) { cancelAnimationFrame(rafId); rafId = null; }

        // If first time playing, show pilot selection after tutorial is closed
        if (window.game && !window.game.career.portrait && !localStorage.getItem('cargoLanderHasSeenPortraitSelector')) {
            localStorage.setItem('cargoLanderHasSeenPortraitSelector', '1');
            setTimeout(() => {
                window.game.openPortraitSelector(true);
            }, 300);
        }
    };

    function tick() {
        if (modal.style.display === 'none') { rafId = null; return; }
        drawScene();
        rafId = requestAnimationFrame(tick);
    }

    function drawScene() {
        const dpr = window.devicePixelRatio || 1;
        const w = canvas.clientWidth || 560;
        const h = canvas.clientHeight || 170;
        if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
            canvas.width = Math.round(w * dpr);
            canvas.height = Math.round(h * dpr);
        }
        const ctx = canvas.getContext('2d');
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, w, h);

        const now = Date.now();
        const groundY = h - 16;
        const padTop = groundY - 10;
        const padX = w * 0.15, hubX = w * 0.85;

        // Twinkling stars (deterministic positions so they don't jitter)
        for (let i = 0; i < 36; i++) {
            const sx = (i * 137.5) % w;
            const sy = (i * 61.3) % (groundY - 30);
            ctx.globalAlpha = 0.25 + 0.3 * (0.5 + 0.5 * Math.sin(now / 700 + i * 1.7));
            ctx.fillStyle = '#e2e8f0';
            ctx.fillRect(sx, sy, i % 5 === 0 ? 2 : 1, i % 5 === 0 ? 2 : 1);
        }
        ctx.globalAlpha = 1;

        // Ground
        ctx.fillStyle = 'rgba(30, 41, 59, 0.7)';
        ctx.fillRect(0, groundY, w, h - groundY);
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.35)';
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(0, groundY); ctx.lineTo(w, groundY); ctx.stroke();

        // Alternate vehicle every other 7s cycle: the basic lander clamps cargo
        // rigidly to a deck on top, while only the drone winches it below on a
        // rope — showing both means the diagram never lies about either one.
        const cycle = Math.floor(now / 7000);
        const isDrone = cycle % 2 === 1;
        const droneYOffset = isDrone ? 54 : 0; // Shift flight path up so drone's winch package lands on pads

        // Flight arc parameters (quadratic bezier over the pads)
        const startY = padTop - 17 - droneYOffset;
        const apexY = Math.max(28, groundY - 118) - droneYOffset;
        const bez = (s) => {
            const u = 1 - s;
            return {
                x: u * u * padX + 2 * u * s * (w / 2) + s * s * hubX,
                y: u * u * startY + 2 * u * s * apexY + s * s * startY
            };
        };

        // Dashed flight path with marching-ants animation + arrowhead at hub
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.45)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([6, 7]);
        ctx.lineDashOffset = -(now / 40) % 13;
        ctx.beginPath();
        ctx.moveTo(padX, startY);
        ctx.quadraticCurveTo(w / 2, apexY, hubX, startY);
        ctx.stroke();
        ctx.setLineDash([]);
        const tip = bez(0.985);
        const tang = Math.atan2(startY - tip.y, hubX - tip.x);
        ctx.fillStyle = 'rgba(56, 189, 248, 0.8)';
        ctx.save();
        ctx.translate(hubX, startY);
        ctx.rotate(tang);
        ctx.beginPath();
        ctx.moveTo(0, 0); ctx.lineTo(-9, -4.5); ctx.lineTo(-9, 4.5);
        ctx.closePath(); ctx.fill();
        ctx.restore();

        drawStartPad(ctx, padX, padTop, groundY, now);
        drawHub(ctx, hubX, padTop, groundY, now);

        // Timeline: sit (0–.10) → fly (.10–.82) → deliver (.82–1)
        const t = (now % 7000) / 7000;
        let s = Math.min(1, Math.max(0, (t - 0.10) / 0.72));
        s = s * s * (3 - 2 * s); // smoothstep ease
        const pos = bez(s);

        if (isDrone && t >= 0.85) {
            // Ascend the drone after dropping the cargo
            const riseFract = (t - 0.85) / 0.15;
            pos.y -= riseFract * 28;
        }

        const angle = 0; // Lander/drone stays straight, no rotating/leaning
        const flying = t > 0.10 && t < 0.82;
        let thrust = 0;
        if (flying) thrust = (s < 0.35 || s > 0.72) ? 1 : (Math.sin(now / 90) > 0.2 ? 0.6 : 0);
        const carryingCargo = t < 0.85; // dropped off just before the payout pops up

        drawTutLander(ctx, pos.x, pos.y, angle, thrust, isDrone ? 'drone' : 'basic', carryingCargo, now);

        // Draw the delivered cargo falling down onto the hub pad, resting, and then being collected (fading out)
        if (isDrone && t >= 0.85) {
            const dropDuration = 0.04; // from t = 0.85 to 0.89
            const collectStart = 0.92;
            const collectDuration = 0.04; // from t = 0.92 to 0.96

            if (t < collectStart + collectDuration) {
                let boxY;
                let opacity = 1;

                if (t < 0.85 + dropDuration) {
                    // Falling down to the pad
                    const fallFract = (t - 0.85) / dropDuration; // 0 to 1
                    const easeFall = fallFract * fallFract; // quadratic acceleration
                    const startFallY = (padTop - 17 - droneYOffset) + 46 * 0.8;
                    const targetLandY = padTop - 5.6;
                    boxY = startFallY + (targetLandY - startFallY) * easeFall;
                } else {
                    // Resting on the pad
                    boxY = padTop - 5.6;

                    if (t >= collectStart) {
                        // Fading out (being collected)
                        const fadeFract = (t - collectStart) / collectDuration;
                        opacity = Math.max(0, 1 - fadeFract);
                    }
                }

                ctx.save();
                ctx.globalAlpha = opacity;
                ctx.translate(hubX, boxY);
                ctx.scale(0.8, 0.8);
                const g = window.game;
                if (g && g.drawSingleBox) {
                    const oldCtx = g.ctx;
                    g.ctx = ctx;
                    g.drawSingleBox(0, 0, 'normal', null, {});
                    g.ctx = oldCtx;
                } else {
                    drawFallbackCrate(ctx, 0, 0, 0);
                }
                ctx.restore();
            }
        }

        // Vehicle label, top-left — makes the alternation read as intentional
        ctx.textAlign = 'left';
        ctx.font = '700 9px Outfit, sans-serif';
        ctx.fillStyle = 'rgba(148, 163, 184, 0.85)';
        ctx.fillText(isDrone ? '🪝 UTILITY DRONE — winch delivery' : '📦 BASIC LANDER — deck delivery', 8, 14);

        // "+$300" pops up over the hub right after touchdown
        if (t > 0.85 && t < 0.99) {
            const k = (t - 0.85) / 0.14;
            ctx.globalAlpha = k < 0.7 ? 1 : (1 - k) / 0.3;
            ctx.fillStyle = '#6ee7b7';
            ctx.font = '700 15px Outfit, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('+$300', hubX, padTop - 46 - k * 22);
            ctx.globalAlpha = 1;
        }
    }

    function drawStartPad(ctx, x, top, groundY, now) {
        drawPlatform(ctx, x, top, groundY, '#10b981');
        ctx.fillStyle = '#34d399';
        ctx.font = '700 9px Outfit, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('START PAD', x, groundY + 11);
        // Blinking edge lights
        const on = Math.sin(now / 300) > 0;
        ctx.fillStyle = on ? '#6ee7b7' : 'rgba(110, 231, 183, 0.25)';
        ctx.fillRect(x - 34, top - 4, 3, 3);
        ctx.fillRect(x + 31, top - 4, 3, 3);
    }

    function drawHub(ctx, x, top, groundY, now) {
        drawPlatform(ctx, x, top, groundY, '#ec4899');
        ctx.fillStyle = '#f472b6';
        ctx.font = '700 9px Outfit, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('DELIVERY HUB', x, groundY + 11);
        // Pulsing beacon ring
        const pulse = (now % 1600) / 1600;
        ctx.strokeStyle = 'rgba(236, 72, 153, ' + (0.55 * (1 - pulse)) + ')';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(x, top - 2, 12 + pulse * 26, (12 + pulse * 26) * 0.35, 0, 0, Math.PI * 2);
        ctx.stroke();
        // Beacon mast
        ctx.strokeStyle = '#f9a8d4';
        ctx.beginPath(); ctx.moveTo(x + 30, top); ctx.lineTo(x + 30, top - 14); ctx.stroke();
        ctx.fillStyle = Math.sin(now / 250) > 0 ? '#f472b6' : 'rgba(244, 114, 182, 0.3)';
        ctx.beginPath(); ctx.arc(x + 30, top - 16, 2.5, 0, Math.PI * 2); ctx.fill();
    }

    function drawPlatform(ctx, x, top, groundY, color) {
        const grad = ctx.createLinearGradient(0, top, 0, top + 8);
        grad.addColorStop(0, '#475569');
        grad.addColorStop(1, '#1e293b');
        ctx.fillStyle = grad;
        ctx.fillRect(x - 36, top, 72, 8);
        ctx.fillStyle = color;
        ctx.fillRect(x - 36, top, 72, 2.5);
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x - 24, top + 8); ctx.lineTo(x - 24, groundY);
        ctx.moveTo(x + 24, top + 8); ctx.lineTo(x + 24, groundY);
        ctx.stroke();
    }

    // Renders the real in-game lander/drone model via game.drawLander(), same
    // mock-swap approach as drawVehicleCanvases() in game/menu.js — and the
    // real game.drawSingleBox() for the crate, so both vehicles show their
    // actual cargo-carrying mechanic: the basic lander clamps a box rigidly
    // to its deck, the drone winches one below on a rope (drawLander() draws
    // that rope itself whenever vehicleType is 'drone' or grabbedBoxId is
    // set, using whatever box is in physics.boxes at that id). Falls back to
    // a simple vector lander if the game isn't ready yet.
    function drawTutLander(ctx, x, y, angle, thrust, vehicleType, carryingCargo, now) {
        const g = window.game;
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(0.8, 0.8);
        if (g && g.drawLander && g.drawSingleBox && g.physics) {
            const oldCtx = g.ctx;
            const oldLander = g.physics.lander;
            const oldBoxes = g.physics.boxes;
            g.ctx = ctx;

            const isDrone = vehicleType === 'drone';
            // Local (pre-scale) coordinates, in the same space drawLander()'s own
            // rope math uses — a gentle independent sway while the box is grabbed.
            const boxLocalX = isDrone ? Math.sin(now / 600) * 6 : 0;
            const boxLocalY = isDrone ? 46 : -25;
            const mockBoxes = carryingCargo
                ? [{ id: 'tut-demo-box', x: boxLocalX, y: boxLocalY, type: 'normal', onDeck: !isDrone }]
                : [];

            g.physics.lander = {
                x: 0, y: 0, angle: angle,
                vehicleType, width: isDrone ? 28 : 34, height: isDrone ? 14 : 22,
                deckWidth: 56, deckOffset: 12, basketHeight: 24,
                fuel: 1, maxFuel: 1,
                thrustMagnitude: thrust, leftThrustRatio: 0, rightThrustRatio: 0,
                strafePower: 0, legCompress: 0,
                integrity: 100, maxIntegrity: 100,
                ropeLength: isDrone ? (carryingCargo ? Math.hypot(boxLocalX, boxLocalY - 10) : 24) : 0,
                ropeMax: 100, winchEngaged: isDrone && carryingCargo,
                grabbedBoxId: (isDrone && carryingCargo) ? 'tut-demo-box' : null
            };
            g.physics.boxes = mockBoxes;

            try {
                g.drawLander(); // body + (drone only) the winch chain to the box below
                if (carryingCargo) {
                    if (isDrone) {
                        g.drawSingleBox(boxLocalX, boxLocalY, 'normal', null, {});
                    } else {
                        // Clamped to the deck: rotate with the hull instead of hanging free.
                        ctx.save();
                        ctx.rotate(angle);
                        g.drawSingleBox(0, boxLocalY, 'normal', null, {});
                        ctx.restore();
                    }
                }
            } catch (e) {
                drawFallbackLander(ctx, angle, thrust, vehicleType, carryingCargo);
            }
            g.ctx = oldCtx;
            g.physics.lander = oldLander;
            g.physics.boxes = oldBoxes;
        } else {
            drawFallbackLander(ctx, angle, thrust, vehicleType, carryingCargo);
        }
        ctx.restore();
    }

    function drawFallbackCrate(ctx, x, y, tilt) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(tilt);
        ctx.fillStyle = '#b45309';
        ctx.fillRect(-8, -7, 16, 14);
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(-7, -6, 14, 12);
        ctx.strokeStyle = '#92400e';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(-7, -6, 14, 12);
        ctx.beginPath();
        ctx.moveTo(-7, -6); ctx.lineTo(7, 6);
        ctx.moveTo(7, -6); ctx.lineTo(-7, 6);
        ctx.stroke();
        ctx.restore();
    }

    function drawFallbackLander(ctx, angle, thrust, vehicleType, carryingCargo) {
        ctx.save();
        ctx.rotate(angle);
        if (carryingCargo) {
            drawFallbackCrate(ctx, 0, vehicleType === 'drone' ? 30 : -18, 0);
        }
        if (thrust > 0) {
            ctx.fillStyle = 'rgba(251, 146, 60, ' + (0.5 + 0.5 * thrust) + ')';
            ctx.beginPath();
            ctx.moveTo(-5, 12); ctx.lineTo(5, 12);
            ctx.lineTo(0, 12 + 10 + Math.random() * 6);
            ctx.closePath(); ctx.fill();
        }
        ctx.fillStyle = '#cbd5e1';
        ctx.beginPath();
        ctx.moveTo(-13, 8); ctx.lineTo(-9, -8); ctx.lineTo(9, -8); ctx.lineTo(13, 8);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#38bdf8';
        ctx.beginPath(); ctx.arc(0, -2, 4, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-10, 8); ctx.lineTo(-14, 15);
        ctx.moveTo(10, 8); ctx.lineTo(14, 15);
        ctx.stroke();
        ctx.restore();
    }
})();
