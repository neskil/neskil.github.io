/* The ground, answering the ball — everywhere that is not a bunker.

   sandfx.js gave the sand a voice; everything else answered a landing with
   nothing at all, and the water with the same two dozen pale-blue dots the
   rest of the game used for any burst. This file is what the rest of the
   ground does back:

     · **grass** — a landing throws clippings in the colour of the course's
       own turf (more off the rough, a few off a green), a pale ring runs out
       through the grass from where it came down, a hard one kicks up a crumb
       of soil and a puff of dust, and on a green or a fairway it leaves a
       pitch mark that stays for the hole. A ball running through the rough
       flicks blades off its shoulders; in the wet, any grass throws a fine
       spray behind a running ball and a landing throws the dew. Every
       firm landing on grass leaves a faint dent, not only on the short
       stuff, and a full-power swing off a fairway opens the turf to the
       brown earth under it (the owner: "I like that it makes some dents in
       the sand … can we do that for other types"; then "too much brown and
       decals … only if you hit fairway with power"). A rolling ball presses
       a faint track through the turf, and the grass stands back up after it
       within about twenty seconds. All of it is laid up
       among the blades (render.js → grassLift): on the ground it is under
       the lawn, which is why the old pitch mark was so hard to see.
     · **water** — a crown of drops thrown up and out (leant along the line
       the ball came in on), a column that climbs out of the hole it made
       after a hard entry, mist, and rings running out across the surface; a
       big drop coming back down makes a little ring of its own.
     · **lava** — embers that glow and cool from yellow to red as they fall,
       smoke that rises and spreads, and slow orange rings.
     · **wood, ice and crust** — splinters off a plank, frost and a glitter off
       ice (which a running ball leaves a trail of, too), embers and ash off a
       set crust.
     · **the strike** — a full swing off grass throws its clippings and a
       clod forward along the shot, and off a fairway leaves the scar.

   **None of it is in the simulation**, the same as the sand and the weather:
   physics.js has never heard of this file. render.js hands it the world every
   frame and passes on what game.js tells it about landings and splashes; it
   works the rest out for itself from the ball.

   Everything it draws is built once, in init, and sits in the scene hidden:
   one point cloud, a pool of rings and a pool of marks. warmPrograms compiles
   hidden objects too, so nothing here compiles a program mid-hole. The marks
   use exactly sandfx's material settings, so they share its program.

   Loaded before render.js and optional to it: a page that leaves this script
   out falls back to the old bursts. */
(function (G3) {
    'use strict';

    var C = G3.CONFIG;
    var P = G3.physics;

    var N = 1100;             // the pool, every kind of particle together
    var RING_N = 18;
    var MARK_N = 24;
    var SOIL_N = 16;          // patches of bare earth: hard landings and divots
    var TRACK = 400;          // points in the grass track before the oldest is reused
    var TRACK_STEP = 0.08;    // how far the ball rolls between track points

    var CHIP = 0, PUFF = 1, DROP = 2, BLADE = 3, EMBER = 4, GLINT = 5;

    var S = {
        ready: false,
        scene: null,
        points: null, pos: null, col: null, alpha: null, size: null, soft: null, glow: null,
        v: [], live: 0, next: 0, embers: 0,
        light: [1, 1, 1], wet: 0,
        rings: [], ringAt: 0, ringsLive: 0,
        marks: [], markAt: 0,
        soils: [], soilAt: 0, soilMat: null,
        // The track through the grass: sandfx's furrow, for turf. A ring of
        // points, each with the strand it belongs to and when it was pressed,
        // because grass, unlike sand, stands back up.
        track: null, tr: [], trAt: -1, trCount: 0, trStrand: 0, lastTr: null, trBase: null, trFade: 0,
        dropRing: null, dropT: 0,
        queue: [],
        grass: [[0.31, 0.68, 0.33], [0.26, 0.63, 0.29]],
        // What the ball was doing before it arrived, read by the landings.
        air: 0, vx: 0, vy: 0, vz: 0,
        carry: { blade: 0, drop: 0, glint: 0 },
        t: 0
    };

    /* One shader for every point, sandfx's with one more thing: `aGlow`, how
       much of the point's colour is its own light rather than the sun's. An
       ember is all glow; a sparkle of frost is half. */
    var VERT = [
        'attribute vec3 aColor;',
        'attribute float aAlpha;',
        'attribute float aSize;',
        'attribute float aSoft;',
        'attribute float aGlow;',
        'uniform float uHalfH;',
        'varying vec3 vColor;',
        'varying float vAlpha;',
        'varying float vSoft;',
        'varying float vGlow;',
        'void main() {',
        '  vec4 mv = modelViewMatrix * vec4(position, 1.0);',
        '  gl_Position = projectionMatrix * mv;',
        '  gl_PointSize = clamp(aSize * projectionMatrix[1][1] * uHalfH / max(-mv.z, 0.05), 1.4, 110.0);',
        '  vColor = aColor; vAlpha = aAlpha; vSoft = aSoft; vGlow = aGlow;',
        '}'
    ].join('\n');
    var FRAG = [
        'uniform vec3 uLight;',
        'varying vec3 vColor;',
        'varying float vAlpha;',
        'varying float vSoft;',
        'varying float vGlow;',
        'void main() {',
        '  float d = length(gl_PointCoord - 0.5) * 2.0;',
        '  float edge = mix(0.55, 0.0, vSoft);',
        '  float a = vAlpha * (1.0 - smoothstep(edge, 1.0, d));',
        '  if (a < 0.01) discard;',
        '  float shade = mix(1.0 - (gl_PointCoord.y - 0.5) * 0.5, 1.0, vSoft);',
        '  vec3 lit = vColor * uLight * shade;',
        // A glowing point is hottest in its middle.
        '  vec3 hot = vColor * (1.0 + (1.0 - d) * 0.6);',
        '  gl_FragColor = vec4(min(mix(lit, hot, vGlow), vec3(1.0)), a);',
        '}'
    ].join('\n');

    function rnd(a, b) { return a + Math.random() * (b - a); }
    function clamp01(x) { return x < 0 ? 0 : x > 1 ? 1 : x; }

    function hexRGB(h) {
        if (typeof h === 'number') return [(h >> 16 & 255) / 255, (h >> 8 & 255) / 255, (h & 255) / 255];
        if (typeof h === 'string' && h.charAt(0) === '#' && h.length === 7) {
            var n = parseInt(h.slice(1), 16);
            return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255];
        }
        return null;
    }

    /* ── building ───────────────────────────────────────────────────────── */

    function build(scene) {
        S.scene = scene;
        var g = new THREE.BufferGeometry(), i;
        S.pos = new Float32Array(N * 3);
        S.col = new Float32Array(N * 3);
        S.alpha = new Float32Array(N);
        S.size = new Float32Array(N);
        S.soft = new Float32Array(N);
        S.glow = new Float32Array(N);
        for (i = 0; i < N; i++) {
            S.pos[i * 3 + 1] = -9999;
            S.v.push({ x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, life: 0, max: 1, size: 0,
                type: 0, floor: 0, drag: 1, grav: 0, a0: 1, ripple: false, settled: false,
                c: [1, 1, 1], phase: 0 });
        }
        g.setAttribute('position', new THREE.BufferAttribute(S.pos, 3));
        g.setAttribute('aColor', new THREE.BufferAttribute(S.col, 3));
        g.setAttribute('aAlpha', new THREE.BufferAttribute(S.alpha, 1));
        g.setAttribute('aSize', new THREE.BufferAttribute(S.size, 1));
        g.setAttribute('aSoft', new THREE.BufferAttribute(S.soft, 1));
        g.setAttribute('aGlow', new THREE.BufferAttribute(S.glow, 1));
        S.points = new THREE.Points(g, new THREE.ShaderMaterial({
            uniforms: { uHalfH: { value: 400 }, uLight: { value: new THREE.Vector3(1, 1, 1) } },
            vertexShader: VERT, fragmentShader: FRAG,
            transparent: true, depthWrite: false
        }));
        S.points.name = 'ground-fx';
        S.points.frustumCulled = false;
        S.points.visible = false;
        S.points.renderOrder = 3;
        scene.add(S.points);

        /* The rings: one flat band, shared, scaled out from where it started.
           A thin band reads as a ripple on water and as a shiver through the
           grass on turf; the colour and how far it runs say which. */
        var rg = new THREE.RingGeometry(0.86, 1, 56, 1);
        rg.rotateX(-Math.PI / 2);
        for (i = 0; i < RING_N; i++) {
            var m = new THREE.Mesh(rg, new THREE.MeshBasicMaterial({
                color: 0xffffff, transparent: true, opacity: 0, depthWrite: false,
                polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4
            }));
            m.name = 'ground-ring';
            m.frustumCulled = false;
            m.visible = false;
            m.renderOrder = 2;
            scene.add(m);
            S.rings.push({ mesh: m, t: 0, delay: 0, dur: 1, r0: 0, r1: 1, a0: 0, live: false });
        }

        /* The marks: a pitch mark or a divot scar, multiplied over the turf
           (white is no mark), darkest a little in from the middle with a
           faint lifted lip round it. Same material settings as sandfx's marks,
           so the same program. */
        var mg = markGeometry(0.55);
        for (i = 0; i < MARK_N; i++) {
            var mk = new THREE.Mesh(mg, markMaterial());
            mk.name = 'ground-mark';
            mk.frustumCulled = false;
            mk.visible = false;
            mk.renderOrder = 1;
            mk.userData.grass = 0.8;
            scene.add(mk);
            S.marks.push(mk);
        }
        // A deeper dent for the rough, where the ball sits down in the grass.
        S.markDeep = markGeometry(0.8);
        S.markGeo = mg;

        /* Bare earth: a hard landing or a divot opens the turf, and what is
           under it is brown (the owner: "a bit of brown for when you hit the
           ground"). A multiply can only darken the green it lies on, and
           darkened green is olive, never soil — so this one is drawn over the
           turf in its own colour, from a ragged patch painted once, under the
           dent that shades it. Lit by hand (light()): it is unlit, and an
           unlit brown would glow at dusk. */
        S.soilMat = new THREE.MeshBasicMaterial({
            map: soilTexture(), transparent: true, opacity: 0.75, depthWrite: false,
            polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -3
        });
        var sg = new THREE.PlaneGeometry(2, 2);
        sg.rotateX(-Math.PI / 2);
        for (i = 0; i < SOIL_N; i++) {
            var so = new THREE.Mesh(sg, S.soilMat);
            so.name = 'ground-soil';
            so.frustumCulled = false;
            so.visible = false;
            so.renderOrder = 0.5;     // under the dent's shading (1)
            // Lower than the dent: the tallest blades stand through the earth
            // at its ragged edge, which is what reads as torn turf.
            so.userData.grass = 0.55;
            scene.add(so);
            S.soils.push(so);
        }

        buildTrack(scene);

        /* Where a drop would go (game.js → the penalty card): a brass ring on
           the ground, breathing, while the choice is up. A ring like the
           others, so it is their program. */
        var dr = new THREE.RingGeometry(0.7, 1, 40, 1);
        dr.rotateX(-Math.PI / 2);
        S.dropRing = new THREE.Mesh(dr, new THREE.MeshBasicMaterial({
            color: 0xd6b25e, transparent: true, opacity: 0, depthWrite: false,
            polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4
        }));
        S.dropRing.name = 'drop-ring';
        S.dropRing.frustumCulled = false;
        S.dropRing.visible = false;
        S.dropRing.renderOrder = 2;
        scene.add(S.dropRing);
        S.ready = true;
    }

    /* The patch of earth: a few dozen overlapping crumbs of brown, densest in
       the middle and thinning out to a ragged edge, with darker clods in it
       and a lighter dry rim. One texture for every patch; each is turned and
       stretched its own way, so no two read the same. */
    function soilTexture() {
        var n = 128, cv = document.createElement('canvas');
        cv.width = cv.height = n;
        var g = cv.getContext('2d'), i, k;
        var seed = 7;
        function r() { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }
        function brown(t, a) {
            return 'rgba(' + Math.round(104 * t) + ',' + Math.round(73 * t) + ',' + Math.round(45 * t) + ',' + a.toFixed(2) + ')';
        }
        // The hole in the turf: one ragged outline, a radius per bearing.
        var rad = [], N = 28;
        for (k = 0; k < N; k++) rad.push(n * (0.27 + r() * 0.13));
        function blob(scale, fill) {
            g.fillStyle = fill;
            g.beginPath();
            for (k = 0; k <= N; k++) {
                var a = k / N * Math.PI * 2, rr = rad[k % N] * scale;
                var x = n / 2 + Math.cos(a) * rr, y = n / 2 + Math.sin(a) * rr * 0.86;
                if (k) g.lineTo(x, y); else g.moveTo(x, y);
            }
            g.fill();
        }
        blob(1.0, brown(0.92, 0.55));
        blob(0.82, brown(0.85, 0.85));
        blob(0.55, brown(0.68, 0.95));      // the floor of it, in its own shade
        // Clods and crumbs in it, darker and lighter, and a few thrown out
        // past the edge.
        for (i = 0; i < 70; i++) {
            var b = r() * Math.PI * 2, e = Math.pow(r(), 0.8) * n * (i < 55 ? 0.33 : 0.46);
            var dark = r() < 0.55;
            g.fillStyle = dark ? 'rgba(52,36,22,0.85)' : brown(1.3 + r() * 0.2, 0.85);
            g.beginPath(); g.arc(n / 2 + Math.cos(b) * e, n / 2 + Math.sin(b) * e * 0.86, 1 + r() * (i < 55 ? 3.2 : 2), 0, Math.PI * 2); g.fill();
        }
        var t = new THREE.CanvasTexture(cv);
        t.minFilter = THREE.LinearMipmapLinearFilter;
        return t;
    }

    /* ── the track through the grass ────────────────────────────────────── */

    // Across it: the blades pressed flat under the ball darkest, the ones
    // either side bent over and half as dark, standing grass at the edges.
    var TR_ACROSS = [-1, -0.45, 0, 0.45, 1];
    var TR_DEPTH = [0, 0.75, 1, 0.75, 0];
    // How strong, how wide, and how long the grass takes to stand up again.
    var TR_KIND = {
        rough:   { k: 0.16, w: 1.0, keep: 12 },
        fairway: { k: 0.09, w: 0.75, keep: 9 },
        green:   { k: 0.05, w: 0.65, keep: 6 }
    };
    var TR_FADE = 12;

    function buildTrack(scene) {
        var g = new THREE.BufferGeometry(), n = TRACK * TR_ACROSS.length, i;
        g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
        var c = new Float32Array(n * 3);
        for (i = 0; i < c.length; i++) c[i] = 1;
        g.setAttribute('color', new THREE.BufferAttribute(c, 3));
        g.setIndex(new THREE.BufferAttribute(new Uint16Array((TRACK - 1) * (TR_ACROSS.length - 1) * 6), 1));
        g.setDrawRange(0, 0);
        S.track = new THREE.Mesh(g, markMaterial());
        S.track.name = 'grass-track';
        S.track.frustumCulled = false;
        S.track.renderOrder = 1;
        scene.add(S.track);
        S.trBase = new Float32Array(n);
        for (i = 0; i < TRACK; i++) S.tr.push({ x: 0, z: 0, strand: -1, t: 0, kind: 'fairway' });
    }

    function pressTrack(hole, b, kind) {
        var last = S.lastTr;
        if (last && last.strand === S.trStrand) {
            var ddx = b.x - last.x, ddz = b.z - last.z;
            if (ddx * ddx + ddz * ddz < TRACK_STEP * TRACK_STEP) return;
        }
        S.trAt = (S.trAt + 1) % TRACK;
        S.trCount = Math.min(TRACK, S.trCount + 1);
        var f = S.tr[S.trAt];
        f.x = b.x; f.z = b.z; f.strand = S.trStrand; f.t = S.t; f.kind = kind;
        S.lastTr = f;
        writeTrack(hole);
    }

    function trAge(f) {
        var K = TR_KIND[f.kind] || TR_KIND.fairway, age = S.t - f.t;
        return age < K.keep ? 1 : Math.max(0, 1 - (age - K.keep) / TR_FADE);
    }

    function writeTrack(hole) {
        var g = S.track.geometry, pos = g.attributes.position.array;
        var idx = g.index.array, ni = 0, i, j, f, prev, nxt, dx, dz, l;
        var nA = TR_ACROSS.length, start = (S.trAt - S.trCount + 1 + TRACK) % TRACK;
        var wet = 1 + S.wet * 0.9;
        for (var o = 0; o < S.trCount; o++) {
            i = (start + o) % TRACK;
            f = S.tr[i];
            prev = o > 0 ? S.tr[(i - 1 + TRACK) % TRACK] : null;
            nxt = o < S.trCount - 1 ? S.tr[(i + 1) % TRACK] : null;
            if (prev && prev.strand !== f.strand) prev = null;
            if (nxt && nxt.strand !== f.strand) nxt = null;
            var a = nxt || f, bb = prev || f;
            dx = a.x - bb.x; dz = a.z - bb.z;
            l = Math.sqrt(dx * dx + dz * dz) || 1;
            var K = TR_KIND[f.kind] || TR_KIND.fairway;
            var taper = (!prev || !nxt) ? 0.35 : 1, w = G3.ballR(hole) * K.w * taper;
            for (j = 0; j < nA; j++) {
                var x = f.x + (dz / l) * TR_ACROSS[j] * w, z = f.z - (dx / l) * TR_ACROSS[j] * w;
                var s = P.surfaceUnder(hole, x, z, Infinity);
                var vi = i * nA + j;
                pos[vi * 3] = x; pos[vi * 3 + 1] = (s ? s.y + inGrass(s.pad.kind, 0.8) : 0) + 0.004; pos[vi * 3 + 2] = z;
                var k = s && TR_KIND[s.pad.kind] ? TR_DEPTH[j] * Math.min(0.5, K.k * wet) * taper : 0;
                S.trBase[vi] = k;
            }
            if (prev) {
                var pi = (i - 1 + TRACK) % TRACK;
                for (j = 0; j < nA - 1; j++) {
                    var a0 = pi * nA + j, a1 = pi * nA + j + 1, b0 = i * nA + j, b1 = i * nA + j + 1;
                    idx[ni++] = a0; idx[ni++] = b0; idx[ni++] = a1;
                    idx[ni++] = a1; idx[ni++] = b0; idx[ni++] = b1;
                }
            }
        }
        g.setDrawRange(0, ni);
        g.index.needsUpdate = true;
        g.attributes.position.needsUpdate = true;
        shadeTrack();
    }

    // The colours alone, from each vertex's depth and its point's age: the
    // grass standing back up, a few times a second, without re-laying it.
    function shadeTrack() {
        var col = S.track.geometry.attributes.color.array, nA = TR_ACROSS.length, i, j, any = 0;
        var start = (S.trAt - S.trCount + 1 + TRACK) % TRACK;
        for (var o = 0; o < S.trCount; o++) {
            i = (start + o) % TRACK;
            var fade = trAge(S.tr[i]);
            if (fade > 0 && fade < 1) any = 1;
            for (j = 0; j < nA; j++) {
                var vi = i * nA + j, d = 1 - S.trBase[vi] * fade;
                // Pressed grass is darker and a little bluer: the undersides.
                col[vi * 3] = d; col[vi * 3 + 1] = 1 - (1 - d) * 0.85; col[vi * 3 + 2] = 1 - (1 - d) * 0.8;
            }
        }
        S.track.geometry.attributes.color.needsUpdate = true;
        S.trFade = any;
    }

    function markMaterial() {
        return new THREE.MeshBasicMaterial({
            vertexColors: true, transparent: true, depthWrite: false,
            blending: THREE.MultiplyBlending, premultipliedAlpha: true, fog: false,
            polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4,
            side: THREE.DoubleSide
        });
    }

    function markGeometry(deep) {
        var R = [0, 0.4, 0.75, 1.0, 1.25], SH = [0.70, 0.62, 0.74, 0.92, 1.0], SEG = 18;
        if (deep) SH = SH.map(function (v) { return 1 - (1 - v) * deep; });
        var nv = R.length * SEG, pos = new Float32Array(nv * 3), col = new Float32Array(nv * 3), idx = [];
        var i, j, k = 0;
        for (i = 0; i < R.length; i++) {
            for (j = 0; j < SEG; j++) {
                var a = j / SEG * Math.PI * 2;
                pos[k * 3] = Math.cos(a) * R[i];
                pos[k * 3 + 1] = 0;
                pos[k * 3 + 2] = Math.sin(a) * R[i];
                // The back wall of the dent (local -x, where the ball came
                // from) catches less light than the front.
                var sh = SH[i] - (i > 0 && i < 3 ? Math.cos(a) * -0.05 : 0);
                col[k * 3] = sh; col[k * 3 + 1] = sh * 0.98; col[k * 3 + 2] = sh * 0.96;
                k++;
            }
        }
        for (i = 0; i < R.length - 1; i++) {
            for (j = 0; j < SEG; j++) {
                var j1 = (j + 1) % SEG;
                var a0 = i * SEG + j, a1 = i * SEG + j1, b0 = (i + 1) * SEG + j, b1 = (i + 1) * SEG + j1;
                idx.push(a0, b0, a1, a1, b0, b1);
            }
        }
        var g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        g.setAttribute('color', new THREE.BufferAttribute(col, 3));
        g.setIndex(idx);
        return g;
    }

    /* The light the points are drawn in: the sky's and most of the sun's,
       the same sum sandfx uses, and the wetness of the day. */
    function light(amb, sun, wet) {
        var r = 0, g = 0, b = 0;
        if (amb) { r += amb.color.r * amb.intensity; g += amb.color.g * amb.intensity; b += amb.color.b * amb.intensity; }
        if (sun) { r += sun.color.r * sun.intensity * 0.6; g += sun.color.g * sun.intensity * 0.6; b += sun.color.b * sun.intensity * 0.6; }
        S.light = [r, g, b];
        S.wet = wet || 0;
        if (S.points) S.points.material.uniforms.uLight.value.set(r, g, b);
        // The earth in the same light as the turf round it, and darker wet.
        if (S.soilMat) {
            var k = 0.95 * (1 - S.wet * 0.3);
            S.soilMat.color.setRGB(Math.min(1, r * k), Math.min(1, g * k), Math.min(1, b * k));
        }
    }

    function resize(drawingBufferHeight) {
        if (S.points) S.points.material.uniforms.uHalfH.value = drawingBufferHeight * 0.5;
    }

    // The course's own turf, for the clippings.
    function theme(th) {
        var a = th && th.grass && hexRGB(th.grass[0]), b = th && th.grass && hexRGB(th.grass[1]);
        S.grass = [a || [0.31, 0.68, 0.33], b || a || [0.26, 0.63, 0.29]];
    }

    /* ── particles ──────────────────────────────────────────────────────── */

    /* o: { type, size, life, col: [r,g,b], tone (± variation), drag (what is
       left of the speed after a second), grav, floor, a0, glow, ripple } */
    function spawn(x, y, z, vx, vy, vz, o) {
        var i, p, k, F = C.GROUND_FX;
        // Toned down as a whole rather than burst by burst (CONFIG.GROUND_FX).
        if (Math.random() > F.AMOUNT) return null;
        vx *= F.THROW; vy *= F.THROW; vz *= F.THROW;
        for (k = 0; k < N; k++) {
            i = (S.next + k) % N;
            if (S.v[i].life <= 0) break;
        }
        S.next = (i + 1) % N;
        p = S.v[i];
        p.x = x; p.y = y; p.z = z;
        p.vx = vx; p.vy = vy; p.vz = vz;
        p.life = p.max = o.life;
        p.size = o.size * F.SIZE;
        p.type = o.type;
        p.floor = o.floor !== undefined ? o.floor : y - 0.02;
        p.drag = o.drag !== undefined ? o.drag : 0.6;
        p.grav = o.grav !== undefined ? o.grav : 15;
        p.a0 = (o.a0 !== undefined ? o.a0 : 1) * F.ALPHA;
        p.ripple = !!o.ripple;
        p.settled = false;
        p.phase = Math.random() * 6.28;
        var t = o.tone ? (Math.random() - 0.5) * o.tone : 0;
        p.c[0] = o.col[0] * (1 + t); p.c[1] = o.col[1] * (1 + t); p.c[2] = o.col[2] * (1 + t);
        S.col[i * 3] = p.c[0]; S.col[i * 3 + 1] = p.c[1]; S.col[i * 3 + 2] = p.c[2];
        S.soft[i] = o.type === PUFF ? 1 : 0;
        S.glow[i] = o.glow || 0;
        S.size[i] = p.size;
        S.alpha[i] = 0;
        var a = S.points.geometry.attributes;
        a.aColor.needsUpdate = true;
        a.aSoft.needsUpdate = true;
        a.aGlow.needsUpdate = true;
        if (o.type === EMBER) S.embers = 1;
        S.live = 1;
        S.points.visible = true;
        return p;
    }

    function stepPoints(dt) {
        if (!S.live) return;
        var i, p, f, alive = 0, embers = 0, drag;
        for (i = 0; i < N; i++) {
            p = S.v[i];
            if (p.life <= 0) continue;
            p.life -= dt;
            f = Math.max(0, p.life / p.max);
            if (p.type === PUFF) {
                drag = Math.pow(0.15, dt);
                p.vx *= drag; p.vz *= drag; p.vy = p.vy * drag + p.grav * dt;
                p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt;
                S.size[i] = p.size * (1 + (1 - f) * 1.8);
                S.alpha[i] = Math.min(1, (1 - f) * 6) * f * f * p.a0;
            } else if (p.settled) {
                // A blade lying on the grass, going.
                S.alpha[i] = Math.min(1, f * 3) * p.a0;
            } else {
                drag = Math.pow(p.drag, dt);
                p.vx *= drag; p.vz *= drag;
                if (p.type === BLADE) {
                    // A clipping is all drag: it falls at its own slow pace
                    // and flutters on the way down.
                    p.vy = p.vy * Math.pow(0.35, dt) - p.grav * dt;
                    p.x += Math.sin(S.t * 9 + p.phase) * 0.25 * dt;
                    p.z += Math.cos(S.t * 7 + p.phase) * 0.25 * dt;
                } else {
                    p.vy -= p.grav * dt;
                    if (p.type === GLINT || p.type === EMBER) p.vy *= Math.pow(p.drag, dt);
                }
                p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt;
                if (p.y < p.floor && p.vy < 0) {
                    if (p.type === BLADE) {
                        p.y = p.floor + 0.01; p.vx = p.vy = p.vz = 0; p.settled = true;
                        p.life = Math.min(p.life, rnd(0.3, 0.7)); p.max = Math.max(p.life, 0.01);
                    } else {
                        // A big drop falling back into the water rings it.
                        if (p.ripple && p.size > 0.04 && Math.random() < 0.18) {
                            ring(p.x, p.floor + 0.03, p.z, 0.03, rnd(0.18, 0.32), rnd(0.5, 0.8), 0.28, [0.92, 0.97, 1]);
                        }
                        p.life = 0;
                    }
                }
                if (p.type === EMBER) {
                    // Cooling: yellow-white to orange to a dull red, and it
                    // flickers as it goes.
                    var heat = f;
                    S.col[i * 3] = 1;
                    S.col[i * 3 + 1] = 0.18 + 0.7 * heat * heat;
                    S.col[i * 3 + 2] = 0.05 + 0.4 * heat * heat * heat;
                    S.glow[i] = 0.55 + heat * 0.45;
                    S.alpha[i] = Math.min(1, f * 3) * (0.75 + 0.25 * Math.sin(S.t * 40 + p.phase));
                    embers++;
                } else if (p.type === GLINT) {
                    S.alpha[i] = Math.min(1, f * 3) * (0.5 + 0.5 * Math.sin(S.t * 26 + p.phase)) * p.a0;
                } else {
                    S.alpha[i] = Math.min(1, f * 4) * p.a0;
                }
            }
            if (p.life <= 0) {
                S.alpha[i] = 0;
                S.pos[i * 3 + 1] = -9999;
                continue;
            }
            S.pos[i * 3] = p.x; S.pos[i * 3 + 1] = p.y; S.pos[i * 3 + 2] = p.z;
            alive++;
        }
        var a = S.points.geometry.attributes;
        a.position.needsUpdate = true;
        a.aAlpha.needsUpdate = true;
        a.aSize.needsUpdate = true;
        if (embers || S.embers) { a.aColor.needsUpdate = true; a.aGlow.needsUpdate = true; }
        S.embers = embers;
        S.live = alive;
        S.points.visible = alive > 0;
    }

    /* ── rings ──────────────────────────────────────────────────────────── */

    function ring(x, y, z, r0, r1, dur, a0, col, delay) {
        var r = S.rings[S.ringAt];
        S.ringAt = (S.ringAt + 1) % RING_N;
        r.mesh.position.set(x, y, z);
        r.mesh.material.color.setRGB(col[0], col[1], col[2]);
        r.mesh.material.opacity = 0;
        r.mesh.scale.setScalar(Math.max(0.001, r0));
        r.mesh.visible = false;
        r.t = 0; r.delay = delay || 0; r.dur = dur; r.r0 = r0; r.r1 = r1 * C.GROUND_FX.SIZE; r.a0 = a0 * C.GROUND_FX.ALPHA; r.live = true;
        S.ringsLive = 1;
    }

    function stepRings(dt) {
        if (!S.ringsLive) return;
        var i, r, u, any = 0;
        for (i = 0; i < RING_N; i++) {
            r = S.rings[i];
            if (!r.live) continue;
            any = 1;
            if (r.delay > 0) { r.delay -= dt; continue; }
            r.t += dt;
            u = r.t / r.dur;
            if (u >= 1) { r.live = false; r.mesh.visible = false; continue; }
            var e = 1 - (1 - u) * (1 - u) * (1 - u);       // fast out, slow at the end
            r.mesh.scale.setScalar(r.r0 + (r.r1 - r.r0) * e);
            r.mesh.material.opacity = r.a0 * Math.pow(1 - u, 1.4) * Math.min(1, r.t / 0.05);
            r.mesh.visible = true;
        }
        S.ringsLive = any;
    }

    /* ── marks ──────────────────────────────────────────────────────────── */

    // Up among the blades of a grassy kind (render.js → grassLift): `k` of
    // the way to the tips. Nothing on bare ground.
    function inGrass(kind, k) {
        var r = G3.render;
        return r && r.grassLift ? r.grassLift(kind) * k : 0;
    }

    var _n = null;
    // Lay a flat thing on the ground's own slope, measured either side, its
    // local +x turned to the line (dx, dz).
    function lay(m, hole, x, z, dx, dz, lift) {
        var s = P.surfaceUnder(hole, x, z, Infinity);
        if (!s) return null;
        var e = 0.12;
        var sx0 = P.surfaceUnder(hole, x - e, z, Infinity), sx1 = P.surfaceUnder(hole, x + e, z, Infinity);
        var sz0 = P.surfaceUnder(hole, x, z - e, Infinity), sz1 = P.surfaceUnder(hole, x, z + e, Infinity);
        var gx = sx0 && sx1 ? (sx1.y - sx0.y) / (2 * e) : 0, gz = sz0 && sz1 ? (sz1.y - sz0.y) / (2 * e) : 0;
        if (Math.abs(gx) > 0.6 || Math.abs(gz) > 0.6) { gx = 0; gz = 0; }
        if (!_n) _n = { up: new THREE.Vector3(), q: new THREE.Quaternion(), yaw: new THREE.Quaternion(), Y: new THREE.Vector3(0, 1, 0) };
        _n.up.set(-gx, 1, -gz).normalize();
        _n.yaw.setFromAxisAngle(_n.Y, Math.atan2(-dz, dx));
        _n.q.setFromUnitVectors(_n.Y, _n.up).multiply(_n.yaw);
        m.quaternion.copy(_n.q);
        m.position.set(x, s.y + lift + inGrass(s.pad.kind, m.userData.grass || 0), z);
        return s;
    }

    function mark(hole, x, z, r, dx, dz, stretch, deep) {
        var m = S.marks[S.markAt];
        if (!lay(m, hole, x, z, dx, dz, 0.006)) return;
        S.markAt = (S.markAt + 1) % MARK_N;
        m.geometry = deep ? S.markDeep : S.markGeo;
        m.scale.set(r * stretch, 1, r);
        m.visible = true;
    }

    // Bare earth, `r` across and stretched along the line; turned a little
    // at random so the same patch does not read twice.
    function soil(hole, x, z, r, dx, dz, stretch) {
        var m = S.soils[S.soilAt];
        var tw = rnd(-0.5, 0.5), c = Math.cos(tw), sn = Math.sin(tw);
        if (!lay(m, hole, x, z, dx * c - dz * sn, dz * c + dx * sn, 0.005)) return;
        S.soilAt = (S.soilAt + 1) % SOIL_N;
        m.scale.set(r * stretch, 1, r);
        m.visible = true;
    }

    /* ── what the ball was doing ────────────────────────────────────────── */

    function arrival() {
        var drop = Math.max(0, -S.vy), skid = Math.sqrt(S.vx * S.vx + S.vz * S.vz);
        var air = Math.min(4, S.air);
        var dx = 0, dz = 1;
        if (skid > 0.01) { dx = S.vx / skid; dz = S.vz / skid; }
        return {
            drop: drop, skid: skid, air: air, dx: dx, dz: dz,
            hard: clamp01((drop / 16) * 0.7 + Math.min(1, air / 2.2) * 0.3),
            flat: skid / (skid + drop + 0.001)
        };
    }

    /* A clipping is the turf's colour, but paler and yellower: a cut blade
       in the air is lit on both faces and seen against the sward it came out
       of, and the same green would vanish into it. Some show the straw of
       their cut ends; the rough's are a darker, older green. */
    function grassCol(dark) {
        var g = S.grass[Math.random() < 0.5 ? 0 : 1];
        var k = dark ? 0.92 : 1.12, straw = Math.random() < 0.3 ? 0.45 : 0.18;
        return [Math.min(1, (g[0] + (0.85 - g[0]) * straw) * k),
                Math.min(1, (g[1] + (0.86 - g[1]) * straw * 0.5) * k),
                Math.min(1, (g[2] + (0.35 - g[2]) * straw) * k)];
    }

    var SOIL = [0.36, 0.26, 0.16], DUST = [0.72, 0.66, 0.55], WATER = [0.86, 0.94, 1.0],
        FOAM = [0.96, 0.98, 1.0], WOOD = [0.66, 0.48, 0.30], FROST = [0.85, 0.95, 1.0],
        ASH = [0.32, 0.30, 0.29], SMOKE = [0.22, 0.20, 0.20];

    /* ── landings ───────────────────────────────────────────────────────── */

    /* The ball has come down on something that is not sand or water. Returns
       how hard it arrived, 0..1, for the camera. */
    function land(hole, x, y, z, kind) {
        var A = arrival(), i;
        S.air = 0;
        if (A.drop < 1.0 && A.air < 0.15) return 0;     // a bobble, not a landing
        var h = A.hard, dx = A.dx, dz = A.dz, sx = dz, sz = -dx;

        if (kind === 'green' || kind === 'fairway' || kind === 'rough') {
            var rough = kind === 'rough', green = kind === 'green';
            var n = Math.round((rough ? 12 + h * 80 : green ? 3 + h * 16 : 6 + h * 44));
            for (i = 0; i < n; i++) {
                var a = Math.random() * Math.PI * 2, out = (0.35 + h * 1.5) * rnd(0.3, 1);
                var fwd = A.skid * A.flat * rnd(0.05, 0.3);
                spawn(x + Math.cos(a) * 0.08, y + 0.03, z + Math.sin(a) * 0.08,
                    Math.cos(a) * out + dx * fwd, (1.4 + h * 3.6) * rnd(0.4, 1.1), Math.sin(a) * out + dz * fwd,
                    { type: BLADE, size: rnd(0.028, 0.048), life: rnd(1.2, 2.2), col: grassCol(rough), tone: 0.2,
                      drag: 0.4, grav: 6.5, floor: y });
            }
            if (h > 0.45 && !green) {
                // A crumb of what is under the turf.
                for (i = 0; i < Math.round((h - 0.4) * 22); i++) {
                    var b = Math.random() * Math.PI * 2, o2 = rnd(0.3, 1.2) * h;
                    spawn(x, y + 0.03, z, Math.cos(b) * o2 + dx * A.skid * 0.1, rnd(1.5, 3.5) * h, Math.sin(b) * o2 + dz * A.skid * 0.1,
                        { type: CHIP, size: rnd(0.02, 0.04), life: rnd(0.6, 1.1), col: SOIL, tone: 0.3, grav: 16, floor: y });
                }
                for (i = 0; i < Math.round(1 + h * 4); i++) {
                    var c = Math.random() * Math.PI * 2;
                    spawn(x + Math.cos(c) * 0.06, y + rnd(0.04, 0.14), z + Math.sin(c) * 0.06,
                        Math.cos(c) * rnd(0.2, 0.7) * h + dx * A.skid * 0.06, rnd(0.2, 0.5), Math.sin(c) * rnd(0.2, 0.7) * h + dz * A.skid * 0.06,
                        { type: PUFF, size: rnd(0.18, 0.32) * (0.5 + h), life: rnd(1.1, 1.9), col: DUST, tone: 0.15, a0: 0.26, grav: 0.2 });
                }
            }
            // The shiver through the grass.
            var g0 = S.grass[0];
            ring(x, y + 0.012, z, 0.08, 0.3 + h * 0.8, 0.4 + h * 0.2, 0.18 + h * 0.22,
                [Math.min(1, g0[0] * 1.6 + 0.15), Math.min(1, g0[1] * 1.4 + 0.15), Math.min(1, g0[2] * 1.6 + 0.15)]);
            if (S.wet > 0.15) splashDew(x, y, z, h, A);
            /* The dent, on every kind of grass now and not only the short
               stuff — the rough's deeper, where the ball sits down in it —
               and under a hard one, the earth it broke through to. */
            /* The owner on v1.241.0: "too much brown and decals … only if you
               hit fairway with power, otherwise in normal golf you don't ruin
               it." So a soft landing leaves nothing and a firm one a faint
               dent (a full long iron comes down at about 0.3 here); the earth
               shows only under a ball dropped on to a fairway from a great
               height — a launch pad, a cliff. The brown is the divot's, off a
               swing with power behind it (strike, below). */
            if (h > (rough ? 0.42 : 0.3)) {
                var mx = x + dx * 0.04, mz = z + dz * 0.04;
                if (kind === 'fairway' && h > 0.85) {
                    soil(hole, mx + dx * 0.03, mz + dz * 0.03, G3.ballR(hole) * (0.45 + (h - 0.85) * 1.2), dx, dz, 1 + A.flat * 1.1);
                }
                mark(hole, mx, mz, G3.ballR(hole) * (0.6 + h * 0.5), dx, dz, 1 + A.flat * 1.0, rough);
            }
        } else if (kind === 'wood') {
            for (i = 0; i < Math.round(5 + h * 30); i++) {
                var w = Math.random() * Math.PI * 2, ow = rnd(0.3, 1.3) * (0.4 + h);
                spawn(x, y + 0.03, z, Math.cos(w) * ow + dx * A.skid * 0.15, rnd(1.2, 3.4) * (0.4 + h), Math.sin(w) * ow + dz * A.skid * 0.15,
                    { type: CHIP, size: rnd(0.014, 0.03), life: rnd(0.5, 0.9), col: WOOD, tone: 0.35, grav: 16, floor: y });
            }
            if (h > 0.35) puffs(x, y, z, 1 + Math.round(h * 3), h, DUST, 0.22);
        } else if (kind === 'ice') {
            for (i = 0; i < Math.round(10 + h * 50); i++) {
                var q = Math.random() * Math.PI * 2, oq = rnd(0.4, 1.6) * (0.4 + h);
                spawn(x, y + 0.03, z, Math.cos(q) * oq + dx * A.skid * 0.2, rnd(0.8, 2.6) * (0.4 + h), Math.sin(q) * oq + dz * A.skid * 0.2,
                    { type: GLINT, size: rnd(0.016, 0.032), life: rnd(0.5, 1.0), col: FROST, tone: 0.1, glow: 0.55,
                      grav: 12, drag: 0.5, floor: y });
            }
            puffs(x, y, z, 2 + Math.round(h * 4), h, FROST, 0.3);
            ring(x, y + 0.012, z, 0.06, 0.4 + h * 0.9, 0.5, 0.35 + h * 0.2, [0.8, 0.95, 1]);
        } else if (kind === 'crust') {
            embers(x, y, z, Math.round(6 + h * 28), 0.4 + h * 0.5, y);
            puffs(x, y, z, 2 + Math.round(h * 3), h, ASH, 0.35);
        }
        return h;
    }

    function puffs(x, y, z, n, h, col, a0) {
        for (var i = 0; i < n; i++) {
            var c = Math.random() * Math.PI * 2, o = rnd(0.2, 0.8) * (0.4 + h);
            spawn(x + Math.cos(c) * 0.06, y + rnd(0.04, 0.16), z + Math.sin(c) * 0.06,
                Math.cos(c) * o, rnd(0.2, 0.6), Math.sin(c) * o,
                { type: PUFF, size: rnd(0.16, 0.3) * (0.6 + h), life: rnd(1.0, 1.8), col: col, tone: 0.15, a0: a0, grav: 0.25 });
        }
    }

    function embers(x, y, z, n, k, floor) {
        for (var i = 0; i < n; i++) {
            var a = Math.random() * Math.PI * 2, o = rnd(0.2, 1.4) * k;
            spawn(x + Math.cos(a) * 0.05, y + 0.04, z + Math.sin(a) * 0.05,
                Math.cos(a) * o, rnd(1.5, 4.5) * k + 0.6, Math.sin(a) * o,
                { type: EMBER, size: rnd(0.02, 0.045), life: rnd(0.7, 1.6), col: [1, 0.85, 0.4], glow: 1,
                  grav: 7, drag: 0.7, floor: floor });
        }
    }

    // The dew off a wet landing.
    function splashDew(x, y, z, h, A) {
        for (var i = 0; i < Math.round((8 + h * 50) * Math.min(1, S.wet * 1.5)); i++) {
            var a = Math.random() * Math.PI * 2, o = rnd(0.4, 1.6) * (0.4 + h);
            spawn(x, y + 0.03, z, Math.cos(a) * o + A.dx * A.skid * 0.2, rnd(1, 3) * (0.4 + h), Math.sin(a) * o + A.dz * A.skid * 0.2,
                { type: DROP, size: rnd(0.012, 0.024), life: rnd(0.4, 0.8), col: WATER, tone: 0.1, grav: 16, floor: y });
        }
    }

    /* Into the water. `surf` is the water's surface — the ball is stopped on
       it, which is where game.js hands us the ball. */
    function splash(x, surf, z) {
        var A = arrival(), i;
        S.air = 0;
        var sp = Math.sqrt(S.vx * S.vx + S.vy * S.vy + S.vz * S.vz);
        var h = Math.max(0.08, clamp01(sp / 18));
        var dx = A.dx, dz = A.dz, flat = A.flat, y = surf + 0.02;

        // The crown: up and out in a ring, leant along the line it came in on.
        var n = Math.round(30 + h * 210);
        for (i = 0; i < n; i++) {
            var a = Math.random() * Math.PI * 2, ca = Math.cos(a), sa = Math.sin(a);
            var out = (0.5 + h * 2.4) * rnd(0.4, 1.05);
            var fwd = A.skid * flat * rnd(0.05, 0.35);
            var big = Math.random() < 0.2;
            spawn(x + ca * (S.br || C.BALL_R) * 0.7, y, z + sa * (S.br || C.BALL_R) * 0.7,
                ca * out + dx * fwd, (1.6 + h * 5.2) * rnd(0.5, 1.1) * (1 - flat * 0.35), sa * out + dz * fwd,
                { type: DROP, size: big ? rnd(0.036, 0.06) : rnd(0.016, 0.034), life: rnd(0.7, 1.4),
                  col: WATER, tone: 0.12, grav: 15, drag: 0.7, floor: surf, ripple: true, a0: 0.95 });
        }
        // The column that climbs out of the hole the ball made — a hard
        // entry's, and a little after it.
        if (h > 0.3) {
            var m = Math.round(16 + h * 56), up = 2.6 + h * 5.5;
            later(0.12, function () {
                for (var k = 0; k < m; k++) {
                    var b = Math.random() * Math.PI * 2, o = rnd(0, 0.32);
                    spawn(x + Math.cos(b) * 0.03, y, z + Math.sin(b) * 0.03,
                        Math.cos(b) * o, up * rnd(0.55, 1.05), Math.sin(b) * o,
                        { type: DROP, size: rnd(0.026, 0.055), life: rnd(0.8, 1.5),
                          col: FOAM, tone: 0.06, grav: 15, drag: 0.8, floor: surf, ripple: true });
                }
                ring(x, surf + 0.03, z, 0.05, 0.35 + h * 0.4, 0.6, 0.6, FOAM);
            });
        }
        // Mist hanging over it.
        for (i = 0; i < Math.round(3 + h * 9); i++) {
            var c = Math.random() * Math.PI * 2, o3 = rnd(0.2, 0.9) * (0.4 + h);
            spawn(x + Math.cos(c) * 0.1, y + rnd(0.05, 0.3), z + Math.sin(c) * 0.1,
                Math.cos(c) * o3 + dx * A.skid * 0.05, rnd(0.3, 0.9) * (0.4 + h), Math.sin(c) * o3 + dz * A.skid * 0.05,
                { type: PUFF, size: rnd(0.22, 0.4) * (0.6 + h), life: rnd(1.2, 2.2), col: FOAM, tone: 0.05, a0: 0.32, grav: 0.2 });
        }
        // The rings across the surface: a white flash of foam, then ripples.
        ring(x, surf + 0.03, z, 0.06, 0.45 + h * 0.5, 0.45, 0.8, FOAM);
        var rings = h > 0.5 ? 4 : 3;
        for (i = 0; i < rings; i++) {
            ring(x, surf + 0.03, z, 0.12, (0.9 + h * 2.2) * (1 - i * 0.18), 1.6 + h * 0.8 - i * 0.15,
                0.55 - i * 0.08, [0.9, 0.96, 1], i * 0.22);
        }
        return h;
    }

    function lava(x, surf, z) {
        var A = arrival(), i;
        S.air = 0;
        var sp = Math.sqrt(S.vx * S.vx + S.vy * S.vy + S.vz * S.vz);
        var h = Math.max(0.15, clamp01(sp / 18));
        embers(x, surf, z, Math.round(40 + h * 130), 0.6 + h * 0.8, surf);
        // Gobs of the stuff, slower and heavier.
        for (i = 0; i < Math.round(6 + h * 16); i++) {
            var a = Math.random() * Math.PI * 2, o = rnd(0.2, 0.9) * (0.5 + h);
            spawn(x, surf + 0.03, z, Math.cos(a) * o + A.dx * A.skid * 0.1, rnd(1.5, 3.2) * (0.5 + h), Math.sin(a) * o + A.dz * A.skid * 0.1,
                { type: EMBER, size: rnd(0.05, 0.08), life: rnd(0.8, 1.3), col: [1, 0.6, 0.2], glow: 1, grav: 14, drag: 0.8, floor: surf });
        }
        for (i = 0; i < Math.round(4 + h * 7); i++) {
            var c = Math.random() * Math.PI * 2;
            spawn(x + Math.cos(c) * 0.12, surf + rnd(0.1, 0.4), z + Math.sin(c) * 0.12,
                Math.cos(c) * rnd(0.1, 0.4), rnd(0.5, 1.1), Math.sin(c) * rnd(0.1, 0.4),
                { type: PUFF, size: rnd(0.3, 0.5), life: rnd(2.0, 3.2), col: SMOKE, tone: 0.2, a0: 0.45, grav: 0.5 });
        }
        ring(x, surf + 0.03, z, 0.06, 0.5 + h * 0.6, 0.5, 0.85, [1, 0.85, 0.4]);
        for (i = 0; i < 2; i++) ring(x, surf + 0.03, z, 0.1, (0.8 + h * 1.4) * (1 - i * 0.25), 2.2, 0.55, [1, 0.45, 0.1], 0.15 + i * 0.35);
        return h;
    }

    /* The strike, off anything but sand (sandfx's blast has that) and a
       green, where nobody takes a divot with a putter. Thrown forward along
       the line of the shot, low; a full swing takes a clod and leaves a scar. */
    function strike(hole, x, y, z, yaw, frac, kind) {
        if (kind === 'green') return false;
        var dx = Math.sin(yaw), dz = Math.cos(yaw), sx = dz, sz = -dx, i;
        if (kind === 'fairway' || kind === 'rough') {
            var n = Math.round(4 + frac * frac * 50);
            for (i = 0; i < n; i++) {
                var sp = (0.8 + frac * 3.2) * rnd(0.3, 1), spread = rnd(-0.5, 0.5);
                spawn(x + sx * rnd(-0.06, 0.06), y + 0.03, z + sz * rnd(-0.06, 0.06),
                    dx * sp + sx * spread * sp * 0.6, (1.2 + frac * 2.6) * rnd(0.4, 1.1), dz * sp + sz * spread * sp * 0.6,
                    { type: BLADE, size: rnd(0.028, 0.048), life: rnd(1.2, 2.0), col: grassCol(kind === 'rough'), tone: 0.2,
                      drag: 0.4, grav: 6.5, floor: y });
            }
            if (frac > 0.45) {
                // The clod, and its crumbs.
                for (i = 0; i < Math.round(2 + frac * 6); i++) {
                    var sp2 = (1.2 + frac * 2.6) * rnd(0.5, 1);
                    spawn(x, y + 0.03, z, dx * sp2 + sx * rnd(-0.3, 0.3), (1.8 + frac * 2.4) * rnd(0.6, 1), dz * sp2 + sz * rnd(-0.3, 0.3),
                        { type: CHIP, size: i === 0 ? rnd(0.06, 0.085) : rnd(0.02, 0.04), life: rnd(0.8, 1.3),
                          col: i === 0 ? grassCol(true) : SOIL, tone: 0.25, grav: 17, floor: y });
                }
                // The scar, with the earth showing in it — off a fairway,
                // and only from a swing with real power behind it.
                if (kind === 'fairway' && frac > 0.85) {
                    soil(hole, x + dx * 0.14, z + dz * 0.14, G3.ballR(hole) * (0.4 + (frac - 0.85) * 1.5), dx, dz, 2.0);
                    mark(hole, x + dx * 0.12, z + dz * 0.12, G3.ballR(hole) * (0.6 + frac * 0.3), dx, dz, 1.9, false);
                }
            }
            return true;
        }
        if (kind === 'wood') {
            for (i = 0; i < Math.round(3 + frac * 14); i++) {
                var s3 = (0.6 + frac * 2) * rnd(0.3, 1);
                spawn(x, y + 0.03, z, dx * s3 + sx * rnd(-0.5, 0.5) * s3, rnd(0.8, 2.2), dz * s3 + sz * rnd(-0.5, 0.5) * s3,
                    { type: CHIP, size: rnd(0.012, 0.026), life: rnd(0.5, 0.8), col: WOOD, tone: 0.3, grav: 16, floor: y });
            }
            return true;
        }
        if (kind === 'ice') {
            for (i = 0; i < Math.round(4 + frac * 18); i++) {
                var s4 = (0.6 + frac * 2) * rnd(0.3, 1);
                spawn(x, y + 0.03, z, dx * s4 + sx * rnd(-0.5, 0.5) * s4, rnd(0.6, 1.8), dz * s4 + sz * rnd(-0.5, 0.5) * s4,
                    { type: GLINT, size: rnd(0.014, 0.028), life: rnd(0.5, 0.9), col: FROST, glow: 0.55, grav: 12, drag: 0.5, floor: y });
            }
            return true;
        }
        return false;
    }

    /* A ball into a rail hard enough to hear: a knock of dust off the paint. */
    function knock(x, y, z, speed) {
        if (speed < 4) return;
        var k = Math.min(1, (speed - 4) / 10);
        for (var i = 0; i < Math.round(3 + k * 9); i++) {
            var a = Math.random() * Math.PI * 2, o = rnd(0.3, 1.2) * (0.5 + k);
            spawn(x, y, z, Math.cos(a) * o, rnd(0.6, 2.0) * (0.5 + k), Math.sin(a) * o,
                { type: CHIP, size: rnd(0.012, 0.022), life: rnd(0.3, 0.6), col: [0.92, 0.9, 0.84], tone: 0.15, grav: 14, floor: y - 0.2 });
        }
        puffs(x, y - 0.05, z, 1 + Math.round(k * 2), k * 0.6, DUST, 0.18);
    }

    function later(dt, fn) { S.queue.push({ at: S.t + dt, fn: fn }); }

    /* ── the rolling ball ───────────────────────────────────────────────── */

    function roll(world, b, speed, dt) {
        var s = P.surfaceUnder(world.hole, b.x, b.z, b.y + P.stepUp(world.hole));
        if (!s) { S.carry.blade = S.carry.drop = S.carry.glint = 0; breakTrack(); return; }
        var kind = s.pad.kind, y = s.y + 0.02;
        var dx = b.vx / speed, dz = b.vz / speed, sx = dz, sz = -dx, n, i, side;
        var grass = kind === 'rough' || kind === 'fairway' || kind === 'green';
        if (grass) pressTrack(world.hole, b, kind);
        else breakTrack();
        // Blades off the shoulders, through the long stuff.
        if (kind === 'rough' && speed > 1.0) {
            S.carry.blade += Math.min(40, (speed - 1) * 11) * dt;
            n = Math.floor(S.carry.blade); S.carry.blade -= n;
            for (i = 0; i < n; i++) {
                side = Math.random() < 0.5 ? -1 : 1;
                var out = speed * rnd(0.08, 0.22);
                spawn(b.x + sx * side * G3.ballR(world.hole) * 0.7, y, b.z + sz * side * G3.ballR(world.hole) * 0.7,
                    dx * speed * rnd(0.05, 0.25) + sx * side * out, 0.7 + speed * rnd(0.12, 0.3), dz * speed * rnd(0.05, 0.25) + sz * side * out,
                    { type: BLADE, size: rnd(0.026, 0.04), life: rnd(1.0, 1.6), col: grassCol(true), tone: 0.2, drag: 0.4, grav: 6.5, floor: s.y });
            }
        } else S.carry.blade = 0;
        // A fine spray off wet grass.
        if (grass && S.wet > 0.15 && speed > 1.5) {
            S.carry.drop += Math.min(60, speed * S.wet * 16) * dt;
            n = Math.floor(S.carry.drop); S.carry.drop -= n;
            for (i = 0; i < n; i++) {
                var jit = rnd(-0.3, 0.3) * speed;
                spawn(b.x - dx * G3.ballR(world.hole) * 0.5, y, b.z - dz * G3.ballR(world.hole) * 0.5,
                    -dx * speed * rnd(0.02, 0.15) + sx * jit * 0.4, 0.6 + speed * rnd(0.15, 0.35), -dz * speed * rnd(0.02, 0.15) + sz * jit * 0.4,
                    { type: DROP, size: rnd(0.01, 0.02), life: rnd(0.3, 0.6), col: WATER, tone: 0.1, grav: 16, floor: s.y });
            }
        } else S.carry.drop = 0;
        // Ice: a glitter of frost left hanging behind a running ball.
        if (kind === 'ice' && speed > 1.5) {
            S.carry.glint += Math.min(30, speed * 4) * dt;
            n = Math.floor(S.carry.glint); S.carry.glint -= n;
            for (i = 0; i < n; i++) {
                spawn(b.x - dx * G3.ballR(world.hole) * 0.6 + sx * rnd(-0.08, 0.08), y + rnd(0, 0.05), b.z - dz * G3.ballR(world.hole) * 0.6 + sz * rnd(-0.08, 0.08),
                    rnd(-0.1, 0.1), rnd(0.1, 0.4), rnd(-0.1, 0.1),
                    { type: GLINT, size: rnd(0.012, 0.022), life: rnd(0.5, 0.9), col: FROST, glow: 0.6, grav: 0.3, drag: 0.3, floor: s.y - 1, a0: 0.9 });
            }
        } else S.carry.glint = 0;
    }

    /* ── every frame ────────────────────────────────────────────────────── */

    function step(dt, world) {
        if (!S.ready) return;
        S.br = G3.ballR(world && world.hole);
        S.t += dt;
        if (S.queue.length) {
            for (var q = S.queue.length - 1; q >= 0; q--) {
                if (S.t >= S.queue[q].at) { var fn = S.queue[q].fn; S.queue.splice(q, 1); fn(); }
            }
        }
        if (world) {
            var b = world.ball;
            if (world.moving && !world.ride && !world.warping) {
                S.vx = b.vx; S.vy = b.vy; S.vz = b.vz;
                if (!world.grounded) { S.air += dt; breakTrack(); }
                else {
                    S.air = 0;
                    var speed = Math.sqrt(b.vx * b.vx + b.vz * b.vz);
                    if (speed > 0.5) roll(world, b, speed, dt);
                    else breakTrack();
                }
            } else breakTrack();
        }
        stepPoints(dt);
        stepRings(dt);
        // The grass standing back up: the colours, four times a second.
        if (S.trCount && S.trFade !== 0) {
            S.trTick = (S.trTick || 0) + dt;
            if (S.trTick > 0.25) { S.trTick = 0; shadeTrack(); }
        }
        if (S.dropRing && S.dropRing.visible) {
            S.dropT += dt;
            var u = 0.5 + 0.5 * Math.sin(S.dropT * 4);
            S.dropRing.material.opacity = Math.min(1, S.dropT * 3) * (0.55 + 0.35 * u);
            S.dropRing.scale.setScalar((S.br || C.BALL_R) * (2.2 + 0.5 * u));
        }
    }

    function breakTrack() {
        if (S.lastTr && S.lastTr.strand === S.trStrand) S.trStrand++;
    }

    // Where a drop would go, or nothing (spot null).
    function dropMark(hole, spot) {
        if (!S.dropRing) return;
        if (!spot) { S.dropRing.visible = false; return; }
        var s = P.surfaceUnder(hole, spot.x, spot.z, spot.y + P.stepUp(hole));
        S.dropRing.position.set(spot.x, (s ? s.y : spot.y - G3.ballR(hole)) + 0.012, spot.z);
        S.dropRing.scale.setScalar(G3.ballR(hole) * 2.2);
        S.dropRing.material.opacity = 0;
        S.dropRing.visible = true;
        S.dropT = 0;
    }

    function clear(th) {
        if (!S.ready) return;
        var i;
        for (i = 0; i < N; i++) { S.v[i].life = 0; S.alpha[i] = 0; S.pos[i * 3 + 1] = -9999; }
        S.points.geometry.attributes.position.needsUpdate = true;
        S.points.visible = false;
        S.live = 0;
        for (i = 0; i < RING_N; i++) { S.rings[i].live = false; S.rings[i].mesh.visible = false; }
        for (i = 0; i < MARK_N; i++) S.marks[i].visible = false;
        for (i = 0; i < SOIL_N; i++) S.soils[i].visible = false;
        S.trCount = 0; S.trAt = -1; S.lastTr = null; S.trStrand++; S.trFade = 0;
        S.track.geometry.setDrawRange(0, 0);
        S.dropRing.visible = false;
        S.ringsLive = 0;
        S.queue.length = 0;
        S.air = 0; S.vx = S.vy = S.vz = 0;
        if (th) theme(th);
    }

    G3.groundfx = {
        build: build,
        light: light,
        resize: resize,
        theme: theme,
        step: step,
        land: land,
        splash: splash,
        lava: lava,
        strike: strike,
        knock: knock,
        dropMark: dropMark,
        clear: clear,
        state: S
    };
})(window.G3 = window.G3 || {});
