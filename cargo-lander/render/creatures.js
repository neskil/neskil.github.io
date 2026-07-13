// render/creatures.js — sandworm, police interceptors, the OOB monster,
// and the pad-range helper they share.
// Prototype-mixin on CargoGame (see render.js header). Split out of
// render/entities.js, which had grown past 3000 lines.
Object.assign(CargoGame.prototype, {
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
            bGrad.addColorStop(0,    '#20120a');
            bGrad.addColorStop(0.45, '#341c0e');
            bGrad.addColorStop(0.72, '#472510');
            bGrad.addColorStop(0.88, '#5a2f12');
            bGrad.addColorStop(1,    '#6a3814');
            ctx.fillStyle = bGrad;
            ctx.strokeStyle = `rgba(150, 80, 20, ${0.3 + glowPulse * 0.2})`;
            ctx.lineWidth = isHead ? 2 : 1.2;
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
drawPolice() {
        if (!this.physics.police) return;
        const p = this.physics.police;
        const ctx = this.ctx;
        const camera = this.camera;

        ctx.save();
        ctx.translate(p.x, p.y);
        const scale = p.size / 100;
        ctx.scale(scale, scale);

        // Hover animation
        ctx.translate(0, Math.sin(Date.now() / 200) * 5);

        // Body
        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        if (ctx.roundRect) {
            ctx.roundRect(-40, -15, 80, 30, 8);
        } else {
            ctx.rect(-40, -15, 80, 30);
        }
        ctx.fill();
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Cockpit
        ctx.fillStyle = '#0ea5e9';
        ctx.beginPath();
        ctx.arc(0, -15, 20, Math.PI, 0);
        ctx.fill();

        // Sirens
        const isRed = (p.sirenPhase % (Math.PI * 2)) < Math.PI;
        ctx.fillStyle = isRed ? '#ef4444' : '#3b82f6';
        ctx.shadowColor = ctx.fillStyle;
        ctx.shadowBlur = 20;
        ctx.beginPath();
        ctx.arc(-20, -20, 6, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = !isRed ? '#ef4444' : '#3b82f6';
        ctx.shadowColor = ctx.fillStyle;
        ctx.beginPath();
        ctx.arc(20, -20, 6, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.shadowBlur = 0;

        // Thrust
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.moveTo(-15, 15);
        ctx.lineTo(15, 15);
        ctx.lineTo(0, 35 + Math.random() * 10);
        ctx.fill();

        // Tow Cable (Tractor Beam) if busted
        const lander = this.physics.lander;
        if (lander.busted) {
            ctx.restore();
            ctx.save();
            ctx.strokeStyle = 'rgba(56, 189, 248, 0.5)';
            ctx.lineWidth = 4;
            ctx.setLineDash([10, 10]);
            ctx.lineDashOffset = -Date.now() / 20;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y + 15 * scale);
            ctx.lineTo(lander.x, lander.y);
            ctx.stroke();
        }

        ctx.restore();
    },
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
                
                const distToLander = lander ? Math.sqrt(hdx * hdx + hdy * hdy) : 1000;
                const threatOpen = Math.max(0, Math.min(1, 1 - (distToLander - 150) / 450));
                
                const mW = seg.r * 0.72;
                const mH = seg.r * (0.35 + 0.45 * threatOpen + Math.sin(t * 3.5) * 0.05);

                ctx.save();
                ctx.translate(mCx, mCy);
                ctx.rotate(headAngle);

                // ── 1. OUTER LIP RING (segmented flesh plates like the sandworm, but oval and fleshy)
                const lipPlates = 18;
                for (let li = 0; li < lipPlates; li++) {
                    const a0 = (li / lipPlates) * Math.PI * 2;
                    const a1 = ((li + 0.82) / lipPlates) * Math.PI * 2;

                    const lipRx = mW * 1.05;
                    const lipRy = mH * 1.05;
                    const innerRx = mW * 0.85;
                    const innerRy = mH * 0.85;

                    const plateDark = li % 2 === 0;
                    ctx.fillStyle = plateDark ? 'rgba(110, 15, 25, 0.95)' : 'rgba(150, 25, 40, 0.95)';
                    ctx.strokeStyle = 'rgba(0,0,0,0.8)';
                    ctx.lineWidth = 1.2;

                    ctx.beginPath();
                    ctx.ellipse(0, 0, lipRx, lipRy, 0, a0, a1);
                    ctx.ellipse(0, 0, innerRx, innerRy, 0, a1, a0, true);
                    ctx.closePath();
                    ctx.fill();
                    ctx.stroke();
                }

                // ── 2. THROAT VOID
                const mouthGrad = ctx.createRadialGradient(0, 0, 0, 0, mH * 0.3, mW * 0.85);
                mouthGrad.addColorStop(0, '#000000');
                mouthGrad.addColorStop(0.5, '#0a0000');
                mouthGrad.addColorStop(1, '#1a0000');
                ctx.fillStyle = mouthGrad;
                ctx.beginPath();
                ctx.ellipse(0, 0, mW * 0.85, mH * 0.85, 0, 0, Math.PI * 2);
                ctx.fill();

                // ── 3. PULSING THROAT GLOW
                const throatPulse = 0.3 + Math.abs(Math.sin(t * 2.1)) * 0.35;
                const throatGrad = ctx.createRadialGradient(0, 2, 0, 0, 2, mW * 0.5);
                throatGrad.addColorStop(0, `rgba(255,30,0,${throatPulse})`);
                throatGrad.addColorStop(1, 'rgba(255,0,0,0)');
                ctx.fillStyle = throatGrad;
                ctx.beginPath();
                ctx.ellipse(0, 2, mW * 0.5, mH * 0.5, 0, 0, Math.PI * 2);
                ctx.fill();

                // Teeth — top row (sharp fangs curving backward and inward, scaled to fit inside plates)
                const toothCount = 7;
                for (let ti = 0; ti < toothCount; ti++) {
                    const tx = -mW * 0.78 + (ti / (toothCount - 1)) * mW * 1.56;
                    const size = 1.0 - Math.pow(Math.abs(tx) / (mW * 0.8), 2) * 0.4;
                    const tipX = tx * 0.3 - mW * 0.05;
                    const tipY = -mH * 0.80 + (mH * 0.7 * size);
                    
                    const tGrad = ctx.createLinearGradient(tx, -mH * 0.80, tipX, tipY);
                    tGrad.addColorStop(0, 'rgba(200, 185, 140, 0.9)');
                    tGrad.addColorStop(1, 'rgba(120, 80, 60, 0.85)');
                    ctx.fillStyle = tGrad;
                    ctx.strokeStyle = 'rgba(0,0,0,0.8)';
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    
                    const cpX = (tx + tipX) / 2;
                    ctx.moveTo(tx - mW * 0.08, -mH * 0.80);
                    ctx.quadraticCurveTo(cpX - mW * 0.04, -mH * 0.5, tipX, tipY);
                    ctx.quadraticCurveTo(cpX + mW * 0.04, -mH * 0.5, tx + mW * 0.08, -mH * 0.80);
                    ctx.closePath();
                    ctx.fill();
                    ctx.stroke();
                }
                // Bottom row
                for (let ti = 0; ti < toothCount - 1; ti++) {
                    const tx = -mW * 0.68 + (ti / (toothCount - 2)) * mW * 1.36;
                    const size = 1.0 - Math.pow(Math.abs(tx) / (mW * 0.7), 2) * 0.4;
                    const tipX = tx * 0.3 - mW * 0.05;
                    const tipY = mH * 0.80 - (mH * 0.7 * size);
                    
                    const tGrad2 = ctx.createLinearGradient(tx, mH * 0.80, tipX, tipY);
                    tGrad2.addColorStop(0, 'rgba(190, 175, 130, 0.88)');
                    tGrad2.addColorStop(1, 'rgba(110, 70, 50, 0.82)');
                    ctx.fillStyle = tGrad2;
                    ctx.beginPath();
                    
                    const cpX = (tx + tipX) / 2;
                    ctx.moveTo(tx - mW * 0.075, mH * 0.80);
                    ctx.quadraticCurveTo(cpX - mW * 0.04, mH * 0.5, tipX, tipY);
                    ctx.quadraticCurveTo(cpX + mW * 0.04, mH * 0.5, tx + mW * 0.075, mH * 0.80);
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

});
