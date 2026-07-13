// render/lander.js — the lander/drone vehicle drawing.
// Prototype-mixin on CargoGame (see render.js header). Split out of
// render/entities.js, which had grown past 3000 lines.
Object.assign(CargoGame.prototype, {
drawLander() {
        const ctx = this.ctx;

        const lander = this.physics.lander;
        if (!lander || lander.dismembered) return;

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
                    const time = Date.now();
                    const endSwayX = Math.sin(time * 0.002 + lander.x * 0.01) * 20;
                    const endSwayY = -Math.abs(Math.cos(time * 0.002 + lander.x * 0.01)) * 4; // Slight lift when swaying
                    rx1 = (lander.grappleX ?? lander.x) + endSwayX;
                    ry1 = (lander.grappleY ?? lander.y + lander.ropeLength) + endSwayY;
                }

                // Build chain link positions along a catenary curve
                const isLoaded = !!lander.grabbedBoxId;
                const numLinks = Math.max(4, Math.floor(lander.ropeLength / 14));
                const sag = Math.min(lander.ropeLength * (isLoaded ? 0.05 : 0.18), 30);
                const time = Date.now();
                const engineVibration = (lander.enginePower || 0) * 1.5;
                const links = [];
                for (let i = 0; i <= numLinks; i++) {
                    const t = i / numLinks;
                    const parabola = 4 * sag * t * (1 - t);
                    
                    // Add wind/movement animation
                    const windSway = Math.sin(time * 0.003 + (ry0 + i * 10) * 0.02) * (isLoaded ? 2 : 12) * t * (1 - t);
                    const vibe = Math.sin(time * 0.05 + i) * engineVibration * t * (1 - t);

                    const x = rx0 + (rx1 - rx0) * t + windSway + vibe;
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
        if (lander.swallowScale !== undefined) {
            ctx.scale(lander.swallowScale, lander.swallowScale);
        }

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
                const flameY = 3; // Center of the Side RCS ports (y = 0 to 6)
                const sGrad = ctx.createLinearGradient(flameX, flameY, flameX + flameDir * sl, flameY);
                sGrad.addColorStop(0, 'rgba(56, 189, 248, 0.92)');
                sGrad.addColorStop(0.45, 'rgba(99, 102, 241, 0.65)');
                sGrad.addColorStop(1, 'rgba(99, 102, 241, 0)');
                ctx.fillStyle = sGrad;
                const fw2 = 3.5 + Math.random() * 2.5;
                ctx.beginPath();
                ctx.moveTo(flameX, flameY - fw2);
                ctx.bezierCurveTo(
                    flameX + flameDir * sl * 0.45, flameY - fw2 * 0.3,
                    flameX + flameDir * sl * 0.82 + (Math.random() - 0.5) * 4, flameY + (Math.random() - 0.5) * 3,
                    flameX + flameDir * sl, flameY
                );
                ctx.bezierCurveTo(
                    flameX + flameDir * sl * 0.82 + (Math.random() - 0.5) * 4, flameY + (Math.random() - 0.5) * 3,
                    flameX + flameDir * sl * 0.45, flameY + fw2 * 0.3,
                    flameX, flameY + fw2
                );
                ctx.closePath();
                ctx.fill();
                // Heat glow
                const sbGrad = ctx.createRadialGradient(flameX, flameY, 0, flameX, flameY, sl * 0.5);
                sbGrad.addColorStop(0, 'rgba(56,189,248,0.25)');
                sbGrad.addColorStop(1, 'rgba(56,189,248,0)');
                ctx.fillStyle = sbGrad;
                ctx.beginPath();
                ctx.arc(flameX, flameY, sl * 0.5, 0, Math.PI * 2);
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

                // ── Hot-rod racing stripe + gloss highlight ─────────────────────
                // A center accent stripe (matches the same critical/heavy/normal
                // trim color already used for the body outline, so it reads as
                // one coherent paint job rather than a bolted-on decal) plus a
                // thin glossy highlight along the top edge of the hull.
                const stripeColor = critical ? '#ef4444' : heavy ? '#f59e0b' : '#38bdf8';
                ctx.fillStyle = stripeColor;
                ctx.globalAlpha = 0.85;
                ctx.beginPath();
                ctx.moveTo(-2.5, -3);
                ctx.lineTo(2.5, -3);
                ctx.lineTo(1.5, 13);
                ctx.lineTo(-1.5, 13);
                ctx.closePath();
                ctx.fill();
                ctx.globalAlpha = 1;

                ctx.strokeStyle = 'rgba(255,255,255,0.30)';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(-bodyW + 3, -2.5);
                ctx.lineTo(bodyW - 3, -2.5);
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
                let baseAlpha = 0.08 + 0.14 * chargeRatio + pulse * 0.04 + flash * 0.45;
                
                if (lander.shieldDelay > 0) {
                    const blink = Math.floor(Date.now() / 150) % 2 === 0;
                    if (blink) baseAlpha *= 0.3;
                }

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

        // Emergency parachute — deployed by physics/atmosphere.js's
        // applyGravityAndWind() ~1s after fuel hits 0 while airborne. Counter-
        // rotates 65% against the hull's tilt (a real chute stays closer to
        // upright than the vehicle dangling under it) so it doesn't look
        // rigidly bolted on as the ship tips.
        if (lander.chuteDeployed && !lander.crashed) {
            ctx.save();
            ctx.rotate(-lander.angle * 0.65);
            const sway = Math.sin(Date.now() * 0.0015 + lander.x * 0.01) * 4;
            const canopyY = -46;
            const canopyW = 30;
            const attachY = -12;

            // Suspension lines from hull attachment points up to the canopy skirt
            ctx.strokeStyle = 'rgba(226,232,240,0.55)';
            ctx.lineWidth = 1;
            for (const side of [-1, 1]) {
                ctx.beginPath();
                ctx.moveTo(side * 10, attachY);
                ctx.lineTo(side * canopyW * 0.8 + sway * 0.3, canopyY + 4);
                ctx.stroke();
            }

            // Canopy — a simple ribbed dome, bright enough to read at a glance
            // as "emergency deploy", not just decorative
            ctx.fillStyle = '#f8fafc';
            ctx.strokeStyle = '#94a3b8';
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.moveTo(-canopyW + sway, canopyY + 6);
            ctx.quadraticCurveTo(sway, canopyY - 14, canopyW + sway, canopyY + 6);
            ctx.quadraticCurveTo(sway * 0.5, canopyY - 2, -canopyW + sway, canopyY + 6);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // Gore lines (the ribs) for a bit of texture
            ctx.strokeStyle = 'rgba(148,163,184,0.6)';
            ctx.lineWidth = 0.8;
            for (let g = -1; g <= 1; g++) {
                ctx.beginPath();
                ctx.moveTo(g * canopyW * 0.55 + sway, canopyY + 5);
                ctx.quadraticCurveTo(sway * 0.7, canopyY - 8, sway, canopyY - 3);
                ctx.stroke();
            }
            ctx.restore();
        }



        ctx.restore();
    }

});
