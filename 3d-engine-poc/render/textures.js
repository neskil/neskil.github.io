/**
 * render/textures.js — procedural material skins, drawn once and shared.
 *
 * Everything the yard is made of used to be a flat `MeshStandardMaterial`, so a
 * container read as a coloured brick and anything metallic read as a black
 * brick. This file paints the missing detail into canvases at load time: grime
 * and corrugation for boxes, tread plate and bolted panels for machinery, plank
 * grain for timber, aggregate for the apron.
 *
 * Two rules make the rest of the renderer work unchanged:
 *
 * 1. **Colour maps are greyscale.** A skin is near-white with darker wear drawn
 *    into it, so `material.color` still carries the carrier livery and the
 *    heatmap can keep recolouring shells by setting `.color`.
 * 2. **Everything is memoised.** One texture set serves every unit in the yard —
 *    `disposeGroup()` frees materials, and a three.js material never disposes
 *    its maps, so the shared set survives a mode change.
 *
 * Textures are deliberately left at `LinearEncoding`, matching the renderer's
 * linear output. Tagging them sRGB would darken every skin against the hand-
 * picked hex colours the rest of the scene is authored in.
 */
(function (window) {
    'use strict';

    const Cargo3D = window.Cargo3D = window.Cargo3D || {};

    const cache = {};

    /** Memoise by key. Callers may hold the result forever. */
    function once(key, build) {
        if (!(key in cache)) cache[key] = build();
        return cache[key];
    }

    function surface(size, height) {
        const cv = document.createElement('canvas');
        cv.width = size;
        cv.height = height || size;
        return cv;
    }

    function wrap(cv) {
        const tex = new THREE.CanvasTexture(cv);
        tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
        tex.anisotropy = 8; // WebGLTextures clamps this to the device maximum
        return tex;
    }

    /**
     * Deterministic noise. The yard should look the same on every load —
     * `Math.random()` here means the art changes between sessions.
     */
    function rng(seed) {
        let s = (seed >>> 0) || 1;
        return function () {
            s = (s * 1664525 + 1013904223) >>> 0;
            return s / 4294967296;
        };
    }

    /**
     * Height field → tangent-space normal map.
     *
     * Canvas rows run downward and `CanvasTexture.flipY` is on, so V increases
     * as canvas Y decreases: the green channel takes +dY, not -dY. Get that
     * backwards and every dent lights like a bump.
     */
    function normalFromHeight(heightCv, strength) {
        const size = heightCv.width;
        const src = heightCv.getContext('2d').getImageData(0, 0, size, size).data;
        const out = surface(size);
        const ctx = out.getContext('2d');
        const img = ctx.createImageData(size, size);

        function h(x, y) {
            const xi = ((x % size) + size) % size;
            const yi = ((y % size) + size) % size;
            return src[(yi * size + xi) * 4] / 255;
        }

        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                const nx = -(h(x + 1, y) - h(x - 1, y)) * strength;
                const ny = (h(x, y + 1) - h(x, y - 1)) * strength;
                const len = Math.sqrt(nx * nx + ny * ny + 1);
                const i = (y * size + x) * 4;
                img.data[i] = (nx / len * 0.5 + 0.5) * 255;
                img.data[i + 1] = (ny / len * 0.5 + 0.5) * 255;
                img.data[i + 2] = (1 / len * 0.5 + 0.5) * 255;
                img.data[i + 3] = 255;
            }
        }

        ctx.putImageData(img, 0, 0);
        return out;
    }

    /* ── shared wear passes ────────────────────────────────────────────── */

    /** Rain streaks running down from the top rail. */
    function streaks(ctx, size, rand, alpha, count) {
        for (let i = 0; i < count; i++) {
            const x = rand() * size;
            const w = 1 + rand() * 9;
            const top = rand() * size * 0.35;
            const len = size * (0.25 + rand() * 0.7);
            const grad = ctx.createLinearGradient(0, top, 0, top + len);
            const a = alpha * (0.35 + rand() * 0.65);
            grad.addColorStop(0, 'rgba(52,48,40,' + a + ')');
            grad.addColorStop(0.35, 'rgba(52,48,40,' + (a * 0.7) + ')');
            grad.addColorStop(1, 'rgba(52,48,40,0)');
            ctx.fillStyle = grad;
            ctx.fillRect(x, top, w, len);
        }
    }

    /** Rust blooms, weighted toward the bottom where water sits. */
    function rust(ctx, size, rand, count) {
        for (let i = 0; i < count; i++) {
            const x = rand() * size;
            const y = size * (0.45 + rand() * rand() * 0.55);
            const r = 3 + rand() * 16;
            const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
            grad.addColorStop(0, 'rgba(124,58,20,' + (0.30 + rand() * 0.28) + ')');
            grad.addColorStop(1, 'rgba(124,58,20,0)');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    /** Scrapes and paint chips. */
    function scuffs(ctx, size, rand, count) {
        for (let i = 0; i < count; i++) {
            const x = rand() * size;
            const y = rand() * size;
            const len = 4 + rand() * 30;
            const ang = (rand() - 0.5) * 0.7;
            ctx.strokeStyle = rand() < 0.45
                ? 'rgba(255,255,255,' + (0.10 + rand() * 0.18) + ')'
                : 'rgba(40,38,34,' + (0.12 + rand() * 0.20) + ')';
            ctx.lineWidth = 0.6 + rand() * 1.6;
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x + Math.cos(ang) * len, y + Math.sin(ang) * len);
            ctx.stroke();
        }
    }

    /** Fine speckle, the thing that stops a flat fill reading as plastic. */
    function speckle(ctx, size, rand, count, alpha) {
        for (let i = 0; i < count; i++) {
            const g = Math.floor(rand() * 255);
            ctx.fillStyle = 'rgba(' + g + ',' + g + ',' + g + ',' + (alpha * rand()) + ')';
            ctx.fillRect(rand() * size, rand() * size, 1 + rand() * 2, 1 + rand() * 2);
        }
    }

    /* ── corrugated steel ──────────────────────────────────────────────── */

    /**
     * The trapezoidal profile of a real container wall, as a 0..1 height for a
     * position within one corrugation period.
     */
    function corrugationProfile(t) {
        if (t < 0.28) return 1;                       // outer flat
        if (t < 0.42) return 1 - (t - 0.28) / 0.14;   // fall
        if (t < 0.70) return 0;                       // inner flat
        if (t < 0.84) return (t - 0.70) / 0.14;       // rise
        return 1;
    }

    /**
     * Corrugated steel skin.
     *
     * Ribs run along V and repeat along U, which is what both faces of a
     * container want: on a wall U is the length and V the height, so the ribs
     * stand up; on the roof U is the length and V the width, so they run across
     * the box the way a real roof panel is pressed.
     *
     * @param {number} seed
     */
    function corrugated(seed) {
        const SIZE = 512;
        const PERIOD = SIZE / 9;
        const RAIL = SIZE * 0.055;

        const map = surface(SIZE);
        const mc = map.getContext('2d');
        const rand = rng(seed);

        mc.fillStyle = '#f2f0ee';
        mc.fillRect(0, 0, SIZE, SIZE);

        // A whisper of shading on the corrugation so it still reads when the
        // normal map is edge-on to the light. The normal map does the work.
        for (let x = 0; x < SIZE; x++) {
            const shade = corrugationProfile((x % PERIOD) / PERIOD);
            mc.fillStyle = 'rgba(0,0,0,' + (0.05 * (1 - shade)) + ')';
            mc.fillRect(x, 0, 1, SIZE);
        }

        // Top and bottom rails: flat pressed sections, dirtier than the wall.
        mc.fillStyle = '#dcd8d3';
        mc.fillRect(0, 0, SIZE, RAIL);
        mc.fillStyle = '#cdc8c2';
        mc.fillRect(0, SIZE - RAIL, SIZE, RAIL);
        mc.strokeStyle = 'rgba(30,28,26,0.45)';
        mc.lineWidth = 2;
        mc.beginPath();
        mc.moveTo(0, RAIL); mc.lineTo(SIZE, RAIL);
        mc.moveTo(0, SIZE - RAIL); mc.lineTo(SIZE, SIZE - RAIL);
        mc.stroke();

        streaks(mc, SIZE, rand, 0.30, 46);
        rust(mc, SIZE, rand, 26);
        scuffs(mc, SIZE, rand, 44);
        speckle(mc, SIZE, rand, 2600, 0.10);

        // Roughness: clean paint is glossy, wear is matte. Same wear passes
        // drawn in white so the dirty pixels come out rough.
        const rough = surface(SIZE);
        const rc = rough.getContext('2d');
        rc.fillStyle = '#6e6e6e';
        rc.fillRect(0, 0, SIZE, SIZE);
        rc.fillStyle = '#8c8c8c';
        rc.fillRect(0, 0, SIZE, RAIL);
        rc.fillRect(0, SIZE - RAIL, SIZE, RAIL);
        const rand2 = rng(seed + 77);
        rc.globalCompositeOperation = 'lighter';
        streaks(rc, SIZE, rand2, 0.55, 46);
        rust(rc, SIZE, rand2, 26);
        rc.globalCompositeOperation = 'source-over';
        speckle(rc, SIZE, rand2, 2200, 0.30);

        // Height field for the normal map: the corrugation plus dents.
        const NSIZE = 256;
        const NPERIOD = NSIZE / 9;
        const height = surface(NSIZE);
        const hc = height.getContext('2d');
        hc.fillStyle = '#808080';
        hc.fillRect(0, 0, NSIZE, NSIZE);
        for (let x = 0; x < NSIZE; x++) {
            const v = Math.round(60 + corrugationProfile((x % NPERIOD) / NPERIOD) * 175);
            hc.fillStyle = 'rgb(' + v + ',' + v + ',' + v + ')';
            hc.fillRect(x, 0, 1, NSIZE);
        }
        const nrail = NSIZE * 0.055;
        hc.fillStyle = '#c8c8c8';
        hc.fillRect(0, 0, NSIZE, nrail);
        hc.fillRect(0, NSIZE - nrail, NSIZE, nrail);
        const rand3 = rng(seed + 991);
        for (let i = 0; i < 30; i++) {
            const x = rand3() * NSIZE, y = rand3() * NSIZE, r = 4 + rand3() * 14;
            const g = hc.createRadialGradient(x, y, 0, x, y, r);
            g.addColorStop(0, 'rgba(0,0,0,0.34)');
            g.addColorStop(1, 'rgba(0,0,0,0)');
            hc.fillStyle = g;
            hc.beginPath(); hc.arc(x, y, r, 0, Math.PI * 2); hc.fill();
        }

        return {
            map: wrap(map),
            roughnessMap: wrap(rough),
            normalMap: wrap(normalFromHeight(height, 3.4))
        };
    }

    /* ── container faces ───────────────────────────────────────────────── */

    /** Long side and blind end: ribs running down the wall. */
    function containerWall() {
        return once('wall', function () { return corrugated(20240718); });
    }

    /** Roof: the same pressing, plus everything the weather leaves on it. */
    function containerRoof() {
        return once('roof', function () {
            const skin = corrugated(640188);
            // Roofs collect far more muck than walls; darken the albedo pass.
            const cv = skin.map.image;
            const ctx = cv.getContext('2d');
            const rand = rng(4471);
            ctx.fillStyle = 'rgba(46,44,38,0.18)';
            ctx.fillRect(0, 0, cv.width, cv.height);
            rust(ctx, cv.width, rand, 40);
            speckle(ctx, cv.width, rand, 3000, 0.14);
            skin.map.needsUpdate = true;
            return skin;
        });
    }

    /** Door end: two leaves, hinges, cam locks, a placard plate. */
    function containerDoors() {
        return once('doors', function () {
            const SIZE = 512;
            const rand = rng(9312);
            const map = surface(SIZE);
            const mc = map.getContext('2d');

            mc.fillStyle = '#eceae7';
            mc.fillRect(0, 0, SIZE, SIZE);

            // Frame, then the two leaves inset into it.
            mc.fillStyle = '#d6d2cd';
            mc.fillRect(0, 0, SIZE, SIZE * 0.06);
            mc.fillRect(0, SIZE * 0.94, SIZE, SIZE * 0.06);
            mc.fillRect(0, 0, SIZE * 0.05, SIZE);
            mc.fillRect(SIZE * 0.95, 0, SIZE * 0.05, SIZE);

            mc.strokeStyle = 'rgba(28,26,24,0.55)';
            mc.lineWidth = 3;
            mc.strokeRect(SIZE * 0.05, SIZE * 0.06, SIZE * 0.9, SIZE * 0.88);
            mc.beginPath();
            mc.moveTo(SIZE / 2, SIZE * 0.06);
            mc.lineTo(SIZE / 2, SIZE * 0.94);
            mc.stroke();

            // Cam-lock rods, four per leaf, and their keepers.
            [0.16, 0.30, 0.70, 0.84].forEach(function (t) {
                const x = SIZE * t;
                mc.fillStyle = 'rgba(58,56,52,0.75)';
                mc.fillRect(x - 4, SIZE * 0.09, 8, SIZE * 0.82);
                mc.fillStyle = 'rgba(34,32,30,0.85)';
                mc.fillRect(x - 10, SIZE * 0.44, 20, SIZE * 0.10);
                [0.12, 0.87].forEach(function (ty) {
                    mc.fillRect(x - 9, SIZE * ty, 18, SIZE * 0.035);
                });
            });

            // Hinges down both outer edges.
            [0.055, 0.945].forEach(function (t) {
                for (let i = 0; i < 4; i++) {
                    mc.fillStyle = 'rgba(40,38,34,0.8)';
                    mc.fillRect(SIZE * t - 7, SIZE * (0.14 + i * 0.23), 14, SIZE * 0.06);
                }
            });

            // Consignment placard, blank — the carrier decal carries the name.
            mc.fillStyle = '#f7f5f2';
            mc.fillRect(SIZE * 0.55, SIZE * 0.14, SIZE * 0.30, SIZE * 0.16);
            mc.strokeStyle = 'rgba(40,38,34,0.6)';
            mc.lineWidth = 2;
            mc.strokeRect(SIZE * 0.55, SIZE * 0.14, SIZE * 0.30, SIZE * 0.16);
            mc.fillStyle = 'rgba(40,38,34,0.35)';
            for (let i = 0; i < 3; i++) {
                mc.fillRect(SIZE * 0.575, SIZE * (0.175 + i * 0.04), SIZE * (0.10 + rand() * 0.14), 4);
            }

            streaks(mc, SIZE, rand, 0.26, 30);
            rust(mc, SIZE, rand, 22);
            scuffs(mc, SIZE, rand, 36);
            speckle(mc, SIZE, rand, 2200, 0.10);

            const rough = surface(SIZE);
            const rc = rough.getContext('2d');
            rc.fillStyle = '#6a6a6a';
            rc.fillRect(0, 0, SIZE, SIZE);
            const rand2 = rng(1188);
            rc.globalCompositeOperation = 'lighter';
            streaks(rc, SIZE, rand2, 0.5, 30);
            rust(rc, SIZE, rand2, 22);
            rc.globalCompositeOperation = 'source-over';
            speckle(rc, SIZE, rand2, 1800, 0.3);

            const NSIZE = 256;
            const height = surface(NSIZE);
            const hc = height.getContext('2d');
            hc.fillStyle = '#909090';
            hc.fillRect(0, 0, NSIZE, NSIZE);
            hc.fillStyle = '#606060';
            hc.fillRect(0, 0, NSIZE, NSIZE * 0.06);
            hc.fillRect(0, NSIZE * 0.94, NSIZE, NSIZE * 0.06);
            hc.fillRect(0, 0, NSIZE * 0.05, NSIZE);
            hc.fillRect(NSIZE * 0.95, 0, NSIZE * 0.05, NSIZE);
            hc.fillStyle = '#5a5a5a';
            hc.fillRect(NSIZE / 2 - 2, 0, 4, NSIZE);
            [0.16, 0.30, 0.70, 0.84].forEach(function (t) {
                const x = NSIZE * t;
                hc.fillStyle = '#d8d8d8';
                hc.fillRect(x - 2, NSIZE * 0.09, 4, NSIZE * 0.82);
                hc.fillStyle = '#f0f0f0';
                hc.fillRect(x - 5, NSIZE * 0.44, 10, NSIZE * 0.10);
            });

            return {
                map: wrap(map),
                roughnessMap: wrap(rough),
                normalMap: wrap(normalFromHeight(height, 2.6))
            };
        });
    }

    /**
     * Carrier livery painted on the wall, as its own transparent decal. It has
     * to be a separate map: the wall skin is greyscale so `material.color` can
     * carry the livery, which would swallow white lettering whole.
     *
     * @param {string} key carrier key, for the memo and the box marking
     * @param {string} name carrier display name
     */
    function carrierDecal(key, name) {
        return once('decal:' + key, function () {
            const W = 1024, H = 320;
            const cv = surface(W, H);
            const ctx = cv.getContext('2d');
            const rand = rng(key.length * 7919 + 13);

            ctx.clearRect(0, 0, W, H);
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            // Shrink to fit rather than run off the edge — "EVERGREEN LINE" is
            // three times the width of "ONE" at the same point size.
            const label = name.toUpperCase();
            let pt = Math.round(H * 0.46);
            ctx.font = '700 ' + pt + 'px Inter, Arial, Helvetica, sans-serif';
            const width = ctx.measureText(label).width;
            if (width > W * 0.9) {
                pt = Math.floor(pt * (W * 0.9) / width);
                ctx.font = '700 ' + pt + 'px Inter, Arial, Helvetica, sans-serif';
            }
            ctx.fillStyle = 'rgba(12,14,20,0.55)';
            ctx.fillText(label, W / 2 + 4, H * 0.40 + 4);
            ctx.fillStyle = 'rgba(252,252,250,0.95)';
            ctx.fillText(label, W / 2, H * 0.40);

            // Owner code + serial, the way a real box is marked up.
            const code = label.replace(/[^A-Z]/g, '').slice(0, 3) + 'U';
            const serial = code + ' ' + Math.floor(100000 + rand() * 899999) + ' ' + Math.floor(rand() * 9);
            ctx.font = '600 ' + Math.round(H * 0.16) + 'px Inter, Arial, Helvetica, sans-serif';
            ctx.fillStyle = 'rgba(248,248,245,0.78)';
            ctx.fillText(serial, W / 2, H * 0.78);

            const tex = new THREE.CanvasTexture(cv);
            tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
            tex.anisotropy = 8;
            return tex;
        });
    }

    /* ── machinery ─────────────────────────────────────────────────────── */

    /**
     * Bolted plate: the flank of a machinery module. Plate seams, bolt rows,
     * weld beads, and rust weeping out of the fasteners.
     */
    function boltedPlate() {
        return once('plate', function () {
            const SIZE = 512;
            const rand = rng(553311);
            const map = surface(SIZE);
            const mc = map.getContext('2d');

            mc.fillStyle = '#e9e7e4';
            mc.fillRect(0, 0, SIZE, SIZE);

            // Four plates stacked, each a slightly different batch of paint.
            const rows = 4;
            for (let i = 0; i < rows; i++) {
                const y = i * SIZE / rows;
                const tone = 226 + Math.floor(rand() * 22);
                mc.fillStyle = 'rgb(' + tone + ',' + (tone - 2) + ',' + (tone - 5) + ')';
                mc.fillRect(0, y, SIZE, SIZE / rows);

                // Weld bead along the seam.
                mc.strokeStyle = 'rgba(52,48,44,0.5)';
                mc.lineWidth = 3;
                mc.beginPath();
                mc.moveTo(0, y);
                mc.lineTo(SIZE, y);
                mc.stroke();
                mc.strokeStyle = 'rgba(255,255,255,0.22)';
                mc.lineWidth = 1.5;
                mc.beginPath();
                mc.moveTo(0, y + 3);
                mc.lineTo(SIZE, y + 3);
                mc.stroke();

                // Bolt row under the seam, each bolt weeping a little rust.
                for (let x = SIZE / 16; x < SIZE; x += SIZE / 8) {
                    const by = y + SIZE / rows * 0.16;
                    mc.fillStyle = 'rgba(74,70,64,0.72)';
                    mc.beginPath(); mc.arc(x, by, 5, 0, Math.PI * 2); mc.fill();
                    mc.fillStyle = 'rgba(255,255,255,0.28)';
                    mc.beginPath(); mc.arc(x - 1.4, by - 1.4, 2.2, 0, Math.PI * 2); mc.fill();

                    const g = mc.createLinearGradient(0, by, 0, by + 34);
                    g.addColorStop(0, 'rgba(120,58,22,0.36)');
                    g.addColorStop(1, 'rgba(120,58,22,0)');
                    mc.fillStyle = g;
                    mc.fillRect(x - 3, by, 6, 34);
                }
            }

            streaks(mc, SIZE, rand, 0.24, 30);
            rust(mc, SIZE, rand, 22);
            scuffs(mc, SIZE, rand, 50);
            speckle(mc, SIZE, rand, 2600, 0.12);

            const rough = surface(SIZE);
            const rc = rough.getContext('2d');
            rc.fillStyle = '#787878';
            rc.fillRect(0, 0, SIZE, SIZE);
            const rand2 = rng(31337);
            rc.globalCompositeOperation = 'lighter';
            streaks(rc, SIZE, rand2, 0.5, 30);
            rust(rc, SIZE, rand2, 22);
            rc.globalCompositeOperation = 'source-over';
            speckle(rc, SIZE, rand2, 2000, 0.28);

            const NSIZE = 256;
            const height = surface(NSIZE);
            const hc = height.getContext('2d');
            hc.fillStyle = '#8c8c8c';
            hc.fillRect(0, 0, NSIZE, NSIZE);
            for (let i = 0; i < rows; i++) {
                const y = i * NSIZE / rows;
                hc.fillStyle = '#4a4a4a';
                hc.fillRect(0, y - 1, NSIZE, 2);
                hc.fillStyle = '#c4c4c4';
                hc.fillRect(0, y + 1, NSIZE, 2);
                for (let x = NSIZE / 16; x < NSIZE; x += NSIZE / 8) {
                    const by = y + NSIZE / rows * 0.16;
                    const g = hc.createRadialGradient(x, by, 0, x, by, 4);
                    g.addColorStop(0, 'rgba(255,255,255,0.95)');
                    g.addColorStop(1, 'rgba(255,255,255,0)');
                    hc.fillStyle = g;
                    hc.beginPath(); hc.arc(x, by, 4, 0, Math.PI * 2); hc.fill();
                }
            }

            return {
                map: wrap(map),
                roughnessMap: wrap(rough),
                normalMap: wrap(normalFromHeight(height, 2.2))
            };
        });
    }

    /** Diamond tread plate — the walkable top of a machinery module. */
    function treadPlate() {
        return once('tread', function () {
            const SIZE = 512;
            const PITCH = SIZE / 8;
            const rand = rng(70707);

            const map = surface(SIZE);
            const mc = map.getContext('2d');
            mc.fillStyle = '#d8d6d2';
            mc.fillRect(0, 0, SIZE, SIZE);

            const NSIZE = 256;
            const NPITCH = NSIZE / 8;
            const height = surface(NSIZE);
            const hc = height.getContext('2d');
            hc.fillStyle = '#4a4a4a';
            hc.fillRect(0, 0, NSIZE, NSIZE);

            /* Diamonds in two alternating directions, the standard tread. Drawn
               into both the albedo (as a soft highlight) and the height field. */
            function diamond(ctx, pitch, cx, cy, flip, fill) {
                const lx = pitch * 0.40, ly = pitch * 0.13;
                ctx.save();
                ctx.translate(cx, cy);
                ctx.rotate(flip ? Math.PI / 4 : -Math.PI / 4);
                ctx.fillStyle = fill;
                ctx.beginPath();
                ctx.moveTo(-lx, 0); ctx.lineTo(0, -ly); ctx.lineTo(lx, 0); ctx.lineTo(0, ly);
                ctx.closePath();
                ctx.fill();
                ctx.restore();
            }

            for (let row = 0; row * PITCH < SIZE + PITCH; row++) {
                for (let col = 0; col * PITCH < SIZE + PITCH; col++) {
                    const flip = (row + col) % 2 === 0;
                    const cx = col * PITCH + PITCH / 2;
                    const cy = row * PITCH + PITCH / 2;
                    diamond(mc, PITCH, cx, cy, flip, 'rgba(255,255,255,0.42)');
                    diamond(mc, PITCH, cx + 1.5, cy + 1.5, flip, 'rgba(40,38,34,0.18)');
                }
            }
            for (let row = 0; row * NPITCH < NSIZE + NPITCH; row++) {
                for (let col = 0; col * NPITCH < NSIZE + NPITCH; col++) {
                    diamond(hc, NPITCH, col * NPITCH + NPITCH / 2, row * NPITCH + NPITCH / 2,
                        (row + col) % 2 === 0, '#e8e8e8');
                }
            }

            // Tread is walked on, not rained on: scuffs yes, rust streaks no.
            // Laying the wall passes on here buries the diamonds in mud.
            scuffs(mc, SIZE, rand, 40);
            rust(mc, SIZE, rand, 6);
            speckle(mc, SIZE, rand, 2400, 0.10);

            const rough = surface(SIZE);
            const rc = rough.getContext('2d');
            rc.fillStyle = '#8a8a8a';
            rc.fillRect(0, 0, SIZE, SIZE);
            speckle(rc, SIZE, rng(4242), 3000, 0.35);

            return {
                map: wrap(map),
                roughnessMap: wrap(rough),
                normalMap: wrap(normalFromHeight(height, 3.0))
            };
        });
    }

    /**
     * Hazard chevrons. Unlike the skins this one is a real colour map — it goes
     * on its own mesh, so nothing multiplies a livery through it.
     */
    function hazardStripe() {
        return once('hazard', function () {
            const SIZE = 256;
            const cv = surface(SIZE, SIZE / 4);
            const ctx = cv.getContext('2d');
            const H = SIZE / 4;

            ctx.fillStyle = '#f5c518';
            ctx.fillRect(0, 0, SIZE, H);
            ctx.fillStyle = '#141821';
            const band = SIZE / 8;
            for (let i = -1; i * band < SIZE + band * 2; i++) {
                ctx.beginPath();
                ctx.moveTo(i * band, H);
                ctx.lineTo(i * band + band / 2, H);
                ctx.lineTo(i * band + band / 2 + H, 0);
                ctx.lineTo(i * band + H, 0);
                ctx.closePath();
                ctx.fill();
            }
            speckle(ctx, SIZE, rng(808), 700, 0.18);

            return wrap(cv);
        });
    }

    /* ── timber, steel, ground ─────────────────────────────────────────── */

    /** Sawn planks: grain, knots, and a shadowed gap between boards. */
    function timber() {
        return once('timber', function () {
            const SIZE = 512;
            const PLANKS = 7;
            const PH = SIZE / PLANKS;
            const rand = rng(11235);

            const map = surface(SIZE);
            const mc = map.getContext('2d');
            mc.fillStyle = '#efe6d8';
            mc.fillRect(0, 0, SIZE, SIZE);

            const NSIZE = 256;
            const NPH = NSIZE / PLANKS;
            const height = surface(NSIZE);
            const hc = height.getContext('2d');
            hc.fillStyle = '#b4b4b4';
            hc.fillRect(0, 0, NSIZE, NSIZE);

            for (let p = 0; p < PLANKS; p++) {
                const y = p * PH;
                const tone = 218 + Math.floor(rand() * 34);
                mc.fillStyle = 'rgb(' + tone + ',' + (tone - 8) + ',' + (tone - 22) + ')';
                mc.fillRect(0, y + 2, SIZE, PH - 4);

                // Grain: long wandering strokes along the plank.
                for (let g = 0; g < 26; g++) {
                    const gy = y + 4 + rand() * (PH - 8);
                    mc.strokeStyle = 'rgba(96,66,34,' + (0.05 + rand() * 0.16) + ')';
                    mc.lineWidth = 0.6 + rand() * 1.5;
                    mc.beginPath();
                    mc.moveTo(0, gy);
                    for (let x = 0; x <= SIZE; x += 32) {
                        mc.lineTo(x, gy + Math.sin((x / SIZE) * Math.PI * (1 + rand() * 3)) * 2.5);
                    }
                    mc.stroke();
                }

                // A knot or two.
                if (rand() < 0.7) {
                    const kx = rand() * SIZE, ky = y + PH / 2, kr = 4 + rand() * 7;
                    for (let r = kr; r > 0; r -= 1.6) {
                        mc.strokeStyle = 'rgba(88,56,26,' + (0.10 + (1 - r / kr) * 0.3) + ')';
                        mc.lineWidth = 1.1;
                        mc.beginPath();
                        mc.ellipse(kx, ky, r, r * 0.6, 0, 0, Math.PI * 2);
                        mc.stroke();
                    }
                }

                // Gap between boards.
                mc.fillStyle = 'rgba(48,32,16,0.55)';
                mc.fillRect(0, y, SIZE, 2.5);

                hc.fillStyle = '#c8c8c8';
                hc.fillRect(0, p * NPH + 2, NSIZE, NPH - 4);
                hc.fillStyle = '#303030';
                hc.fillRect(0, p * NPH, NSIZE, 2);
            }

            scuffs(mc, SIZE, rand, 30);
            speckle(mc, SIZE, rand, 2600, 0.12);
            speckle(hc, NSIZE, rng(6161), 3000, 0.30);

            const rough = surface(SIZE);
            const rc = rough.getContext('2d');
            rc.fillStyle = '#d0d0d0';
            rc.fillRect(0, 0, SIZE, SIZE);
            speckle(rc, SIZE, rng(9090), 3200, 0.30);

            return {
                map: wrap(map),
                roughnessMap: wrap(rough),
                normalMap: wrap(normalFromHeight(height, 1.8))
            };
        });
    }

    /** Brushed stainless — the barrel of a tank container. */
    function brushedSteel() {
        return once('brushed', function () {
            const SIZE = 512;
            const rand = rng(24680);

            const map = surface(SIZE);
            const mc = map.getContext('2d');
            mc.fillStyle = '#f2f4f6';
            mc.fillRect(0, 0, SIZE, SIZE);
            for (let i = 0; i < 1400; i++) {
                const y = rand() * SIZE;
                const x = rand() * SIZE;
                const len = 20 + rand() * 220;
                mc.strokeStyle = rand() < 0.5
                    ? 'rgba(255,255,255,' + (0.06 + rand() * 0.10) + ')'
                    : 'rgba(120,130,142,' + (0.05 + rand() * 0.12) + ')';
                mc.lineWidth = 0.5 + rand() * 1.2;
                mc.beginPath();
                mc.moveTo(x, y);
                mc.lineTo(x + len, y + (rand() - 0.5) * 1.2);
                mc.stroke();
            }
            streaks(mc, SIZE, rand, 0.14, 16);
            speckle(mc, SIZE, rand, 1800, 0.08);

            const NSIZE = 256;
            const height = surface(NSIZE);
            const hc = height.getContext('2d');
            hc.fillStyle = '#808080';
            hc.fillRect(0, 0, NSIZE, NSIZE);
            const rand2 = rng(13579);
            for (let i = 0; i < 900; i++) {
                const y = rand2() * NSIZE, x = rand2() * NSIZE, len = 10 + rand2() * 120;
                const v = Math.floor(96 + rand2() * 100);
                hc.strokeStyle = 'rgb(' + v + ',' + v + ',' + v + ')';
                hc.lineWidth = 0.6 + rand2() * 1.1;
                hc.beginPath();
                hc.moveTo(x, y);
                hc.lineTo(x + len, y);
                hc.stroke();
            }

            const rough = surface(SIZE);
            const rc = rough.getContext('2d');
            rc.fillStyle = '#3c3c3c';
            rc.fillRect(0, 0, SIZE, SIZE);
            speckle(rc, SIZE, rng(2468), 3400, 0.45);

            return {
                map: wrap(map),
                roughnessMap: wrap(rough),
                normalMap: wrap(normalFromHeight(height, 1.1))
            };
        });
    }

    /** Asphalt apron: aggregate, oil spills, tyre scrub, hairline cracks. */
    function asphalt() {
        return once('asphalt', function () {
            const SIZE = 512;
            const rand = rng(31415);

            const map = surface(SIZE);
            const mc = map.getContext('2d');
            mc.fillStyle = '#e2e2e2';
            mc.fillRect(0, 0, SIZE, SIZE);

            // Aggregate.
            for (let i = 0; i < 26000; i++) {
                const g = 150 + Math.floor(rand() * 105);
                mc.fillStyle = 'rgba(' + g + ',' + g + ',' + g + ',' + (0.20 + rand() * 0.5) + ')';
                mc.fillRect(rand() * SIZE, rand() * SIZE, 1 + rand() * 2.4, 1 + rand() * 2.4);
            }
            /* Oil, kept small and faint. A big dark blob tiles into an obvious
               polka-dot grid the moment the apron is seen from above, which is
               the only angle this game is ever played from. */
            for (let i = 0; i < 34; i++) {
                const x = rand() * SIZE, y = rand() * SIZE, r = 5 + rand() * 14;
                const g = mc.createRadialGradient(x, y, 0, x, y, r);
                g.addColorStop(0, 'rgba(24,24,28,' + (0.04 + rand() * 0.06) + ')');
                g.addColorStop(1, 'rgba(24,24,28,0)');
                mc.fillStyle = g;
                mc.beginPath(); mc.arc(x, y, r, 0, Math.PI * 2); mc.fill();
            }
            // Cracks.
            for (let i = 0; i < 22; i++) {
                mc.strokeStyle = 'rgba(30,30,34,' + (0.16 + rand() * 0.24) + ')';
                mc.lineWidth = 0.7 + rand() * 1.4;
                let x = rand() * SIZE, y = rand() * SIZE;
                mc.beginPath();
                mc.moveTo(x, y);
                for (let s = 0; s < 7; s++) {
                    x += (rand() - 0.5) * 70;
                    y += (rand() - 0.5) * 70;
                    mc.lineTo(x, y);
                }
                mc.stroke();
            }

            const NSIZE = 256;
            const height = surface(NSIZE);
            const hc = height.getContext('2d');
            hc.fillStyle = '#808080';
            hc.fillRect(0, 0, NSIZE, NSIZE);
            speckle(hc, NSIZE, rng(27182), 22000, 0.9);

            const rough = surface(SIZE);
            const rc = rough.getContext('2d');
            rc.fillStyle = '#cccccc';
            rc.fillRect(0, 0, SIZE, SIZE);
            speckle(rc, SIZE, rng(16180), 6000, 0.4);

            return {
                map: wrap(map),
                roughnessMap: wrap(rough),
                normalMap: wrap(normalFromHeight(height, 1.4))
            };
        });
    }

    /** Poured concrete: the bay slab, with construction joints and stains. */
    function concrete() {
        return once('concrete', function () {
            const SIZE = 512;
            const rand = rng(9182736);

            const map = surface(SIZE);
            const mc = map.getContext('2d');
            mc.fillStyle = '#e8e8e8';
            mc.fillRect(0, 0, SIZE, SIZE);
            for (let i = 0; i < 240; i++) {
                const x = rand() * SIZE, y = rand() * SIZE, r = 10 + rand() * 70;
                const g = mc.createRadialGradient(x, y, 0, x, y, r);
                const dark = rand() < 0.6;
                g.addColorStop(0, dark ? 'rgba(90,90,96,0.10)' : 'rgba(255,255,255,0.12)');
                g.addColorStop(1, 'rgba(0,0,0,0)');
                mc.fillStyle = g;
                mc.beginPath(); mc.arc(x, y, r, 0, Math.PI * 2); mc.fill();
            }
            speckle(mc, SIZE, rand, 16000, 0.14);

            // Construction joints on a half-tile grid, so the slab reads as
            // poured in bays rather than as one endless sheet.
            mc.strokeStyle = 'rgba(48,48,54,0.42)';
            mc.lineWidth = 3;
            [0, SIZE / 2].forEach(function (o) {
                mc.beginPath();
                mc.moveTo(o, 0); mc.lineTo(o, SIZE);
                mc.moveTo(0, o); mc.lineTo(SIZE, o);
                mc.stroke();
            });

            const NSIZE = 256;
            const height = surface(NSIZE);
            const hc = height.getContext('2d');
            hc.fillStyle = '#9a9a9a';
            hc.fillRect(0, 0, NSIZE, NSIZE);
            speckle(hc, NSIZE, rng(6283), 14000, 0.55);
            hc.strokeStyle = '#303030';
            hc.lineWidth = 2;
            [0, NSIZE / 2].forEach(function (o) {
                hc.beginPath();
                hc.moveTo(o, 0); hc.lineTo(o, NSIZE);
                hc.moveTo(0, o); hc.lineTo(NSIZE, o);
                hc.stroke();
            });

            const rough = surface(SIZE);
            const rc = rough.getContext('2d');
            rc.fillStyle = '#d8d8d8';
            rc.fillRect(0, 0, SIZE, SIZE);
            speckle(rc, SIZE, rng(3141), 5000, 0.35);

            return {
                map: wrap(map),
                roughnessMap: wrap(rough),
                normalMap: wrap(normalFromHeight(height, 1.0))
            };
        });
    }

    /* ── environment ───────────────────────────────────────────────────── */

    /**
     * Painted skies, one per weather preset.
     *
     * `sky` is the vertical gradient from zenith to nadir with the horizon at
     * 0.49/0.51; `sun` is an optional glow at a fractional position; `haze` is
     * how much cloud to scatter through the upper half.
     */
    const SKIES = {
        day: {
            sky: [[0, '#1b3358'], [0.32, '#3d6a97'], [0.49, '#8fb2cd'],
                  [0.51, '#26313f'], [1, '#0d131c']],
            sun: { x: 0.62, y: 0.20, r: 0.34, core: '255,246,214', a: 0.95 },
            haze: { count: 40, color: '226,238,248', a: 0.14 }
        },
        dusk: {
            sky: [[0, '#1c1740'], [0.30, '#4c2f66'], [0.46, '#c76a45'],
                  [0.51, '#2a2036'], [1, '#100b17']],
            sun: { x: 0.30, y: 0.44, r: 0.30, core: '255,186,110', a: 0.85 },
            haze: { count: 30, color: '244,190,150', a: 0.12 }
        },
        rain: {
            sky: [[0, '#28323e'], [0.32, '#3f4d5c'], [0.49, '#6b7987'],
                  [0.51, '#1d2530'], [1, '#0d1218']],
            sun: null,
            haze: { count: 46, color: '150,166,182', a: 0.14 }
        },
        fog: {
            sky: [[0, '#3d4854'], [0.32, '#5b6773'], [0.49, '#8e99a3'],
                  [0.51, '#333c46'], [1, '#1d232a']],
            sun: { x: 0.5, y: 0.30, r: 0.5, core: '224,231,238', a: 0.35 },
            haze: { count: 60, color: '206,214,222', a: 0.18 }
        },
        night: {
            sky: [[0, '#02040b'], [0.34, '#050d1a'], [0.49, '#0d1c2e'],
                  [0.51, '#050a12'], [1, '#010307']],
            sun: null,
            // The floodlight masts, as far as a reflection is concerned.
            lamps: { count: 5, color: '147,197,253', a: 0.5 },
            haze: { count: 10, color: '30,50,76', a: 0.10 }
        }
    };

    /**
     * A prefiltered environment map, from a painted sky.
     *
     * Without one, every metallic material in the yard samples black and a
     * chrome tank barrel renders as a black tube. This is the single change
     * that stops the scene looking like flat plastic.
     *
     * It has to be per-preset. `scene.environment` lights everything it touches
     * and nothing in r128 scales it globally, so a single daylight sky left the
     * night preset's yard as bright as noon no matter what the lamps did.
     *
     * @param {THREE.WebGLRenderer} renderer
     * @param {string} [preset] a key of WEATHER_PRESETS; defaults to `day`
     * @returns {THREE.Texture}
     */
    function environment(renderer, preset) {
        const key = SKIES[preset] ? preset : 'day';
        return once('env:' + key, function () {
            const spec = SKIES[key];
            const W = 512, H = 256;
            const cv = surface(W, H);
            const ctx = cv.getContext('2d');
            const rand = rng(5150 + key.length * 31);

            const sky = ctx.createLinearGradient(0, 0, 0, H);
            spec.sky.forEach(function (stop) { sky.addColorStop(stop[0], stop[1]); });
            ctx.fillStyle = sky;
            ctx.fillRect(0, 0, W, H);

            function glow(x, y, r, color, alpha) {
                const g = ctx.createRadialGradient(x, y, 0, x, y, r);
                g.addColorStop(0, 'rgba(' + color + ',' + alpha + ')');
                g.addColorStop(0.25, 'rgba(' + color + ',' + (alpha * 0.36) + ')');
                g.addColorStop(1, 'rgba(' + color + ',0)');
                ctx.fillStyle = g;
                ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
            }

            if (spec.sun) {
                glow(W * spec.sun.x, H * spec.sun.y, H * spec.sun.r, spec.sun.core, spec.sun.a);
            }
            if (spec.lamps) {
                for (let i = 0; i < spec.lamps.count; i++) {
                    glow(W * (i + 0.5) / spec.lamps.count, H * 0.46, H * 0.10,
                        spec.lamps.color, spec.lamps.a);
                }
            }

            // Cloud, so reflections have something to break up on.
            for (let i = 0; i < spec.haze.count; i++) {
                const x = rand() * W, y = H * (0.08 + rand() * 0.36), r = 18 + rand() * 60;
                const g = ctx.createRadialGradient(x, y, 0, x, y, r);
                g.addColorStop(0, 'rgba(' + spec.haze.color + ',' + (spec.haze.a * (0.5 + rand() * 0.5)) + ')');
                g.addColorStop(1, 'rgba(' + spec.haze.color + ',0)');
                ctx.fillStyle = g;
                ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
            }

            const equirect = new THREE.CanvasTexture(cv);
            equirect.mapping = THREE.EquirectangularReflectionMapping;

            const pmrem = new THREE.PMREMGenerator(renderer);
            pmrem.compileEquirectangularShader();
            const target = pmrem.fromEquirectangular(equirect);
            pmrem.dispose();
            equirect.dispose();
            return target.texture;
        });
    }

    /* ── application helpers ───────────────────────────────────────────── */

    /**
     * Hang a skin on a material, tiled to a real-world size.
     *
     * A skin's three maps are shared, so the repeat has to live on a clone —
     * `Texture.clone()` shares the uploaded image and only forks the sampler
     * state, which is exactly the split we want.
     *
     * @param {THREE.Material} material
     * @param {{map:THREE.Texture, normalMap:THREE.Texture, roughnessMap:THREE.Texture}} skin
     * @param {number} repeatX
     * @param {number} repeatY
     * @param {number} [normalScale]
     */
    function applySkin(material, skin, repeatX, repeatY, normalScale) {
        const rx = Math.max(0.05, repeatX || 1);
        const ry = Math.max(0.05, repeatY || 1);
        const key = rx.toFixed(3) + 'x' + ry.toFixed(3);

        function tiled(tex, slot) {
            if (!tex) return null;
            tex.userData = tex.userData || {};
            const memo = tex.userData.tiles || (tex.userData.tiles = {});
            if (!memo[key]) {
                const copy = tex.clone();
                copy.wrapS = copy.wrapT = THREE.RepeatWrapping;
                copy.repeat.set(rx, ry);
                copy.needsUpdate = true;
                memo[key] = copy;
            }
            return memo[key];
        }

        material.map = tiled(skin.map);
        material.roughnessMap = tiled(skin.roughnessMap);
        material.normalMap = tiled(skin.normalMap);
        if (material.normalMap && material.normalScale) {
            const s = normalScale === undefined ? 1 : normalScale;
            material.normalScale.set(s, s);
        }
        // The roughness map multiplies; let it own the value outright.
        material.roughness = 1.0;
        material.needsUpdate = true;
        return material;
    }

    Cargo3D.Textures = {
        containerWall: containerWall,
        containerRoof: containerRoof,
        containerDoors: containerDoors,
        carrierDecal: carrierDecal,
        boltedPlate: boltedPlate,
        treadPlate: treadPlate,
        hazardStripe: hazardStripe,
        timber: timber,
        brushedSteel: brushedSteel,
        asphalt: asphalt,
        concrete: concrete,
        environment: environment,
        applySkin: applySkin
    };
})(window);
