/* Sand, answering the ball.

   A bunker used to answer a landing with the same fourteen beige dots the
   sparks used, and a ball rolling through one with nothing at all. This file
   is what the sand does back, in three parts that share one budget:

     · **grains** — a pool of small hard points, each with its own colour, size
       and life. A rolling ball ploughs them up as a fan off both shoulders and
       a short tail behind, at a rate and a height that grow with ground speed,
       so a ball creeping in barely stirs it and one running in throws a line
       of spray. A landing throws a crown of them, and how it is thrown is the
       landing: a steep drop after a long flight goes up and out in a ring, a
       low skidding one goes forward in a sheet along the line it came in on.
     · **dust** — a handful of big soft puffs that rise slowly and thin out.
       Only a hard arrival makes any: the rolling ball never does.
     · **marks** — a furrow pressed into the sand behind a rolling ball, and a
       crater where one came down. Both are multiply-blended over the sand, so
       they darken whatever the theme painted there rather than painting a
       second sand over it, and both stay for the hole: the bunker keeps the
       record of where the ball went, the way a real one does until the rake.

   **None of it is in the simulation**, the same as the weather: physics.js has
   never heard of this file, and a ball that plugs here plays exactly as one
   that plugged before it. render.js hands it the world every frame and tells
   it about landings; everything else it works out for itself from the ball.

   Loaded before render.js and optional to it: a page that leaves this script
   out still draws, it just draws the bunkers silent. */
(function (G3) {
    'use strict';

    var C = G3.CONFIG;
    var P = G3.physics;

    var GRAINS = 700;         // the pool, grains and dust together
    var DUST_FROM = 620;      // the last eighty slots are kept for dust
    var FURROW = 320;         // points in the furrow before the oldest is reused
    var FURROW_STEP = 0.07;   // how far the ball rolls between furrow points
    var CRATERS = 14;
    var G = 15;               // a grain's gravity: a touch under the ball's, they are light

    // The sand texture's base (textures.js), and either side of it: grains in
    // the sun come up lighter than the floor they left, grains in shadow darker.
    var SAND = [0xb9 / 255, 0x9b / 255, 0x68 / 255];

    var S = {
        ready: false,
        scene: null,
        points: null, pos: null, col: null, alpha: null, size: null, soft: null,
        v: [], live: 0, next: 0, dustNext: DUST_FROM,
        light: [1, 1, 1], wet: 0,
        // The furrow: a ring of points, and the strand each belongs to so a
        // ball that leaves the sand does not join the old track to the new.
        furrow: null, fur: [], furAt: -1, furCount: 0, strand: 0, lastFur: null,
        craters: [], craterAt: 0,
        // What the ball was doing in the air, read by land().
        air: 0, vx: 0, vy: 0, vz: 0,
        emitCarry: 0
    };

    /* One shader for every point: a per-point size that shrinks with distance
       the way a real object does, a per-point alpha, and a softness that is
       0 for a hard grain and 1 for a dust puff whose edge is all falloff.
       PointsMaterial has one size and one opacity for the whole cloud, which
       is the reason the old burst was fourteen identical dots. */
    var VERT = [
        'attribute vec3 aColor;',
        'attribute float aAlpha;',
        'attribute float aSize;',
        'attribute float aSoft;',
        'uniform float uHalfH;',
        'varying vec3 vColor;',
        'varying float vAlpha;',
        'varying float vSoft;',
        'void main() {',
        '  vec4 mv = modelViewMatrix * vec4(position, 1.0);',
        '  gl_Position = projectionMatrix * mv;',
        '  gl_PointSize = clamp(aSize * projectionMatrix[1][1] * uHalfH / max(-mv.z, 0.05), 1.6, 96.0);',
        '  vColor = aColor; vAlpha = aAlpha; vSoft = aSoft;',
        '}'
    ].join('\n');
    var FRAG = [
        'uniform vec3 uLight;',
        'varying vec3 vColor;',
        'varying float vAlpha;',
        'varying float vSoft;',
        'void main() {',
        '  float d = length(gl_PointCoord - 0.5) * 2.0;',
        '  float edge = mix(0.55, 0.0, vSoft);',
        '  float a = vAlpha * (1.0 - smoothstep(edge, 1.0, d));',
        '  if (a < 0.01) discard;',
        // A grain is a little ball lit from above: lighter on its top half.
        '  float shade = mix(1.0 - (gl_PointCoord.y - 0.5) * 0.5, 1.0, vSoft);',
        '  gl_FragColor = vec4(min(vColor * uLight * shade, vec3(1.0)), a);',
        '}'
    ].join('\n');

    function build(scene) {
        S.scene = scene;
        var g = new THREE.BufferGeometry(), i;
        S.pos = new Float32Array(GRAINS * 3);
        S.col = new Float32Array(GRAINS * 3);
        S.alpha = new Float32Array(GRAINS);
        S.size = new Float32Array(GRAINS);
        S.soft = new Float32Array(GRAINS);
        for (i = 0; i < GRAINS; i++) {
            S.pos[i * 3 + 1] = -9999;
            S.v.push({ x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, life: 0, max: 1, floor: 0, size: 0, dust: false, a: 1 });
        }
        g.setAttribute('position', new THREE.BufferAttribute(S.pos, 3));
        g.setAttribute('aColor', new THREE.BufferAttribute(S.col, 3));
        g.setAttribute('aAlpha', new THREE.BufferAttribute(S.alpha, 1));
        g.setAttribute('aSize', new THREE.BufferAttribute(S.size, 1));
        g.setAttribute('aSoft', new THREE.BufferAttribute(S.soft, 1));
        S.points = new THREE.Points(g, new THREE.ShaderMaterial({
            uniforms: { uHalfH: { value: 400 }, uLight: { value: new THREE.Vector3(1, 1, 1) } },
            vertexShader: VERT, fragmentShader: FRAG,
            transparent: true, depthWrite: false
        }));
        S.points.name = 'sand-grains';
        S.points.frustumCulled = false;
        S.points.visible = false;
        // After the ball and the ground, so the spray goes over the furrow.
        S.points.renderOrder = 3;
        scene.add(S.points);

        buildFurrow(scene);
        S.ready = true;
    }

    /* Multiply blending: the mark's colour is what the sand underneath is
       multiplied by, so white is no mark and darker is a deeper one. No fog —
       fog would mix the multiplier towards the sky and turn a furrow far off
       into a pale stripe — and no depth writes, with a polygon offset, so it
       lies on the sand rather than fighting it. */
    function markMaterial() {
        return new THREE.MeshBasicMaterial({
            vertexColors: true, transparent: true, depthWrite: false,
            blending: THREE.MultiplyBlending, premultipliedAlpha: true, fog: false,
            polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4,
            side: THREE.DoubleSide
        });
    }

    // Across a furrow: five vertices, flat sand either side, the two walls
    // of the groove in shade and the floor of it a little less.
    var ACROSS = [-1, -0.45, 0, 0.45, 1];
    var DEPTH = [0, 0.75, 0.55, 0.75, 0];

    function buildFurrow(scene) {
        var g = new THREE.BufferGeometry(), n = FURROW * ACROSS.length, i;
        g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
        var c = new Float32Array(n * 3);
        for (i = 0; i < c.length; i++) c[i] = 1;
        g.setAttribute('color', new THREE.BufferAttribute(c, 3));
        g.setIndex(new THREE.BufferAttribute(new Uint16Array((FURROW - 1) * (ACROSS.length - 1) * 6), 1));
        g.setDrawRange(0, 0);
        S.furrow = new THREE.Mesh(g, markMaterial());
        S.furrow.name = 'sand-furrow';
        S.furrow.frustumCulled = false;
        S.furrow.renderOrder = 1;
        scene.add(S.furrow);
        for (i = 0; i < FURROW; i++) S.fur.push({ x: 0, z: 0, strand: -1 });
    }

    /* The light the grains are drawn in. The sand itself is lit by the
       hole's two lights through Lambert; a point has no normal, so it gets the
       sum of the sky and most of the sun, which is what the top of a bunker
       is lit by at noon. Wet sand is darker, as it is on the floor. */
    function light(amb, sun, wet) {
        var r = 0, g = 0, b = 0;
        if (amb) { r += amb.color.r * amb.intensity; g += amb.color.g * amb.intensity; b += amb.color.b * amb.intensity; }
        if (sun) { r += sun.color.r * sun.intensity * 0.6; g += sun.color.g * sun.intensity * 0.6; b += sun.color.b * sun.intensity * 0.6; }
        var k = 1 - (wet || 0) * 0.3;
        S.light = [r * k, g * k, b * k];
        S.wet = wet || 0;
        if (S.points) S.points.material.uniforms.uLight.value.set(S.light[0], S.light[1], S.light[2]);
    }

    function resize(drawingBufferHeight) {
        if (S.points) S.points.material.uniforms.uHalfH.value = drawingBufferHeight * 0.5;
    }

    /* ── grains ─────────────────────────────────────────────────────────── */

    function spawn(x, y, z, vx, vy, vz, life, size, dust) {
        var i, p;
        if (dust) {
            i = S.dustNext;
            S.dustNext = DUST_FROM + ((S.dustNext - DUST_FROM + 1) % (GRAINS - DUST_FROM));
        } else {
            // Round the pool from wherever we got to, taking the first dead
            // grain; a pool that is full overwrites the oldest-placed one,
            // which in a spray is the one nearly back on the ground anyway.
            for (var k = 0; k < DUST_FROM; k++) {
                i = (S.next + k) % DUST_FROM;
                if (S.v[i].life <= 0) break;
            }
            S.next = (i + 1) % DUST_FROM;
        }
        p = S.v[i];
        p.x = x; p.y = y; p.z = z;
        p.vx = vx; p.vy = vy; p.vz = vz;
        p.life = p.max = life;
        p.floor = y - 0.02;
        p.size = size;
        p.dust = !!dust;
        // Every grain its own tone: most near the sand, some pale (dry, sunlit
        // quartz), some dark (damp from underneath).
        /* Darker than the floor on average: a grain in the air is seen
           against the sand it came out of, and the same tone would vanish
           into it. Thrown sand is the damp stuff from under the surface
           anyway, which is darker. Dust is the dry, fine part, and paler. */
        var t = (Math.random() - 0.5) * 0.36 + (dust ? 0.12 : -0.24);
        var damp = 1 - S.wet * 0.25;
        S.col[i * 3] = SAND[0] * (1 + t) * damp;
        S.col[i * 3 + 1] = SAND[1] * (1 + t) * damp;
        S.col[i * 3 + 2] = SAND[2] * (1 + t * 1.1) * damp;
        S.soft[i] = dust ? 1 : 0;
        S.size[i] = size;
        var a = S.points.geometry.attributes;
        a.aColor.needsUpdate = true;
        a.aSoft.needsUpdate = true;
        S.live = Math.max(S.live, 1);
        S.points.visible = true;
        return p;
    }

    function stepGrains(dt) {
        if (!S.live) return;
        var i, p, alive = 0, f;
        for (i = 0; i < GRAINS; i++) {
            p = S.v[i];
            if (p.life <= 0) continue;
            p.life -= dt;
            if (p.dust) {
                // Dust: rises a little, spreads, slows hard and thins out.
                var drag = Math.pow(0.12, dt);
                p.vx *= drag; p.vz *= drag; p.vy = p.vy * drag + 0.25 * dt;
                p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt;
                f = p.life / p.max;
                S.size[i] = p.size * (1 + (1 - f) * 1.6);
                S.alpha[i] = Math.min(1, (1 - f) * 6) * f * f * 0.42;
            } else {
                var air = Math.pow(0.55, dt);
                p.vx *= air; p.vz *= air;
                p.vy -= G * dt;
                p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt;
                // Back on the sand: it is sand again.
                if (p.y < p.floor && p.vy < 0) p.life = 0;
                f = p.life / p.max;
                S.alpha[i] = p.life > 0 ? Math.min(1, f * 4) : 0;
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
        S.live = alive;
        S.points.visible = alive > 0;
    }

    function rnd(a, b) { return a + Math.random() * (b - a); }

    /* ── the rolling ball ───────────────────────────────────────────────── */

    function sandUnder(hole, b) {
        var s = P.surfaceUnder(hole, b.x, b.z, b.y + C.STEP_UP);
        return s && s.pad.kind === 'sand' ? s : null;
    }

    /* A ball rolling through sand is a little plough: the sand in front of it
       has to go somewhere, and it goes off both shoulders and up, in a fan
       that opens wider and climbs higher the faster the ball is going, with a
       thinner rooster tail kicked straight back off the bottom of it. */
    function plough(b, s, speed, dt) {
        var dx = b.vx / speed, dz = b.vz / speed;
        var sx = dz, sz = -dx;                       // square to the line
        var rate = Math.min(14, speed) * 44;         // grains a second
        S.emitCarry += rate * dt;
        var n = Math.floor(S.emitCarry);
        S.emitCarry -= n;
        var y = s.y + 0.02, i, side, k, up;
        for (i = 0; i < n; i++) {
            k = Math.random();
            if (k < 0.78) {
                // Off a shoulder: out sideways, a little forward, and up.
                side = Math.random() < 0.5 ? -1 : 1;
                var out = speed * rnd(0.14, 0.34), fwd = speed * rnd(0.05, 0.3);
                up = 1.1 + speed * rnd(0.22, 0.48);
                spawn(b.x + dx * C.BALL_R * 0.6 + sx * side * C.BALL_R * 0.7, y,
                      b.z + dz * C.BALL_R * 0.6 + sz * side * C.BALL_R * 0.7,
                      dx * fwd + sx * side * out, up, dz * fwd + sz * side * out,
                      rnd(0.35, 0.8), rnd(0.02, 0.04), false);
            } else {
                // The tail: thrown back off the bottom of the ball, the line
                // a fast ball draws in the air behind itself.
                var back = speed * rnd(0.05, 0.25), jit = rnd(-0.12, 0.12) * speed;
                up = 1.0 + speed * rnd(0.35, 0.65);
                spawn(b.x - dx * C.BALL_R * 0.5, y, b.z - dz * C.BALL_R * 0.5,
                      -dx * back + sx * jit, up, -dz * back + sz * jit,
                      rnd(0.4, 0.9), rnd(0.018, 0.036), false);
            }
        }
        /* A fast ball leaves a low haze along its line as well: a puff now
           and then, small, faint and slow, which is what turns a scatter of
           grains into a line drawn across the bunker. */
        if (speed > 2.5 && Math.random() < dt * (speed - 2.5) * 5) {
            spawn(b.x - dx * C.BALL_R, y + 0.04, b.z - dz * C.BALL_R,
                  -dx * speed * 0.06 + rnd(-0.1, 0.1), rnd(0.1, 0.3), -dz * speed * 0.06 + rnd(-0.1, 0.1),
                  rnd(0.9, 1.6), rnd(0.12, 0.2) * Math.min(1.6, speed / 5), true);
        }
    }

    /* The furrow: a point every few centimetres of travel, lying on the sand
       at the ball's track, its width the ball's and its depth from the speed
       (a slow ball sinks into the sand further than a fast one skims it — but
       only just; mostly it is the same groove). */
    function press(hole, b, s, speed) {
        var last = S.lastFur;
        if (last && last.strand === S.strand) {
            var ddx = b.x - last.x, ddz = b.z - last.z;
            if (ddx * ddx + ddz * ddz < FURROW_STEP * FURROW_STEP) return;
        }
        S.furAt = (S.furAt + 1) % FURROW;
        S.furCount = Math.min(FURROW, S.furCount + 1);
        var f = S.fur[S.furAt];
        f.x = b.x; f.z = b.z; f.strand = S.strand;
        f.k = Math.max(0.55, 1 - speed * 0.04);
        S.lastFur = f;
        writeFurrow(hole);
    }

    function writeFurrow(hole) {
        var g = S.furrow.geometry, pos = g.attributes.position.array, col = g.attributes.color.array;
        var idx = g.index.array, ni = 0, i, j, f, prev, nxt, dx, dz, l, w = C.BALL_R * 0.8;
        var nA = ACROSS.length, start = (S.furAt - S.furCount + 1 + FURROW) % FURROW;
        for (var o = 0; o < S.furCount; o++) {
            i = (start + o) % FURROW;
            f = S.fur[i];
            prev = o > 0 ? S.fur[(i - 1 + FURROW) % FURROW] : null;
            nxt = o < S.furCount - 1 ? S.fur[(i + 1) % FURROW] : null;
            if (prev && prev.strand !== f.strand) prev = null;
            if (nxt && nxt.strand !== f.strand) nxt = null;
            var a = nxt || f, bb = prev || f;
            dx = a.x - bb.x; dz = a.z - bb.z;
            l = Math.sqrt(dx * dx + dz * dz) || 1;
            // The ends of a strand taper, so a furrow starts and stops in the
            // sand rather than as a cut-off box.
            var taper = (!prev || !nxt) ? 0.35 : 1;
            for (j = 0; j < nA; j++) {
                var x = f.x + (dz / l) * ACROSS[j] * w * taper, z = f.z - (dx / l) * ACROSS[j] * w * taper;
                var s = P.surfaceUnder(hole, x, z, Infinity);
                var vi = (i * nA + j) * 3;
                pos[vi] = x; pos[vi + 1] = (s ? s.y : 0) + 0.004; pos[vi + 2] = z;
                var dark = 1 - DEPTH[j] * 0.62 * (f.k || 1) * taper;
                // Not sand under this edge (the lip of the bunker): no mark.
                if (!s || s.pad.kind !== 'sand') dark = 1;
                col[vi] = dark; col[vi + 1] = dark * 0.99; col[vi + 2] = dark * 0.97;
            }
            if (prev) {
                var pi = (i - 1 + FURROW) % FURROW;
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
        g.attributes.color.needsUpdate = true;
    }

    /* ── landings ───────────────────────────────────────────────────────── */

    /* A crater: a disc laid vertex by vertex on the sand, darkest a little in
       from its middle (the floor of the dent is lit, the far wall is not),
       with a faint ring of thrown sand just outside it. Stretched along the
       line the ball came in on by however much it was skidding, so a plug
       from a lob is round and a thinned one is a smear. */
    var RINGS = [0, 0.35, 0.7, 1.0, 1.35, 1.7];
    var SHADE = [0.80, 0.66, 0.72, 0.86, 0.93, 1.0];
    var SEGS = 20;

    function crater(hole, x, z, r, dx, dz, stretch) {
        var nv = RINGS.length * SEGS, pos = new Float32Array(nv * 3), col = new Float32Array(nv * 3);
        var idx = [], i, j, k = 0;
        for (i = 0; i < RINGS.length; i++) {
            for (j = 0; j < SEGS; j++) {
                var a = j / SEGS * Math.PI * 2, ca = Math.cos(a), sa = Math.sin(a);
                // Along the line (ca) stretched, and pushed forward a little:
                // the sand goes the way the ball was going.
                var along = ca * r * RINGS[i] * stretch + (stretch - 1) * r * 0.5 * RINGS[i];
                var across = sa * r * RINGS[i];
                var px = x + dx * along + dz * across, pz = z + dz * along - dx * across;
                var s = P.surfaceUnder(hole, px, pz, Infinity);
                pos[k * 3] = px; pos[k * 3 + 1] = (s ? s.y : 0) + 0.005; pos[k * 3 + 2] = pz;
                // The far wall of the dent, away from the ball's arrival, is
                // the shaded one.
                var sh = SHADE[i] - (i > 0 && i < 3 ? ca * 0.06 : 0);
                if (!s || s.pad.kind !== 'sand') sh = 1;
                col[k * 3] = sh; col[k * 3 + 1] = sh * 0.99; col[k * 3 + 2] = sh * 0.97;
                k++;
            }
        }
        for (i = 0; i < RINGS.length - 1; i++) {
            for (j = 0; j < SEGS; j++) {
                var j1 = (j + 1) % SEGS;
                var a0 = i * SEGS + j, a1 = i * SEGS + j1, b0 = (i + 1) * SEGS + j, b1 = (i + 1) * SEGS + j1;
                idx.push(a0, b0, a1, a1, b0, b1);
            }
        }
        var g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        g.setAttribute('color', new THREE.BufferAttribute(col, 3));
        g.setIndex(idx);
        var m = S.craters[S.craterAt];
        if (m) {
            m.geometry.dispose();
            m.geometry = g;
        } else {
            m = new THREE.Mesh(g, markMaterial());
            m.name = 'sand-crater';
            m.frustumCulled = false;
            m.renderOrder = 1;
            S.scene.add(m);
            S.craters[S.craterAt] = m;
        }
        m.visible = true;
        S.craterAt = (S.craterAt + 1) % CRATERS;
    }

    /* The ball has come down on sand. What it does depends on how it came:
       `drop` is how fast it was falling, `skid` how fast it was going across,
       and `air` how long it had been up — a long flight is a ball with its
       whole weight behind it, and a hop off a lip is not. */
    function land(hole, x, y, z) {
        var drop = Math.max(0, -S.vy), skid = Math.sqrt(S.vx * S.vx + S.vz * S.vz);
        var air = Math.min(4, S.air);
        S.air = 0;
        var hard = Math.min(1, (drop / 16) * 0.7 + Math.min(1, air / 2.2) * 0.3);
        if (drop < 0.8 && air < 0.15) return;           // a dribble off the lip
        var dx = 0, dz = 1;
        if (skid > 0.01) { dx = S.vx / skid; dz = S.vz / skid; }
        var sx = dz, sz = -dx;
        // How flat the arrival was: 0 straight down, 1 skimming.
        var flat = skid / (skid + drop + 0.001);

        // The crown: a ring out and up, leant forward the flatter it came in.
        var n = Math.round(24 + hard * 220), i;
        for (i = 0; i < n; i++) {
            var a = Math.random() * Math.PI * 2, ca = Math.cos(a), sa = Math.sin(a);
            var out = (0.5 + hard * 2.0) * rnd(0.35, 1.1);
            var fwd = skid * flat * rnd(0.15, 0.55);
            var up = (1.2 + hard * 3.6) * rnd(0.4, 1.05) * (1 - flat * 0.45);
            spawn(x + ca * C.BALL_R * 0.6, y + 0.02, z + sa * C.BALL_R * 0.6,
                  ca * out + dx * fwd, up, sa * out + dz * fwd,
                  rnd(0.5, 1.2), rnd(0.018, 0.04) * (1 + hard * 0.3), false);
        }
        // A skimming ball throws a sheet forward along its line too.
        var m = Math.round(flat * skid * 4);
        for (i = 0; i < m && i < 90; i++) {
            var spread = rnd(-0.35, 0.35);
            var sp = skid * rnd(0.35, 0.8);
            spawn(x, y + 0.02, z,
                  dx * sp + sx * spread * sp, (0.6 + skid * 0.18) * rnd(0.5, 1.1), dz * sp + sz * spread * sp,
                  rnd(0.4, 0.9), rnd(0.016, 0.034), false);
        }
        // Dust, only from a proper arrival.
        var puffs = Math.round(hard * 9);
        for (i = 0; i < puffs; i++) {
            var b = Math.random() * Math.PI * 2, ro = rnd(0.2, 1) * (0.4 + hard);
            spawn(x + Math.cos(b) * 0.08, y + rnd(0.05, 0.2), z + Math.sin(b) * 0.08,
                  Math.cos(b) * ro + dx * skid * 0.08, rnd(0.2, 0.7) * (0.5 + hard), Math.sin(b) * ro + dz * skid * 0.08,
                  rnd(1.4, 2.6), rnd(0.25, 0.45) * (0.6 + hard), true);
        }
        crater(hole, x, z, C.BALL_R * (0.9 + hard * 1.5), dx, dz, 1 + flat * 1.4);
        return hard;
    }

    /* Out of a bunker: the club goes in under the ball and the sand comes out
       with it, in a sheet thrown along the line of the shot and a cloud left
       hanging where it was. */
    function blast(hole, x, y, z, yaw, frac) {
        var dx = Math.sin(yaw), dz = Math.cos(yaw), sx = dz, sz = -dx, i;
        var n = Math.round(40 + frac * 180);
        for (i = 0; i < n; i++) {
            var spread = rnd(-0.6, 0.6), sp = (1.2 + frac * 5) * rnd(0.3, 1);
            spawn(x - dx * 0.05 + sx * rnd(-0.1, 0.1), y + 0.03, z - dz * 0.05 + sz * rnd(-0.1, 0.1),
                  dx * sp + sx * spread * sp * 0.6, (1.6 + frac * 4) * rnd(0.4, 1.1), dz * sp + sz * spread * sp * 0.6,
                  rnd(0.6, 1.3), rnd(0.018, 0.04), false);
        }
        for (i = 0; i < Math.round(3 + frac * 7); i++) {
            spawn(x + dx * rnd(0, 0.3), y + rnd(0.05, 0.25), z + dz * rnd(0, 0.3),
                  dx * rnd(0.3, 1.2) + sx * rnd(-0.4, 0.4), rnd(0.3, 0.9), dz * rnd(0.3, 1.2) + sz * rnd(-0.4, 0.4),
                  rnd(1.5, 2.8), rnd(0.3, 0.5), true);
        }
        crater(hole, x + dx * 0.08, z + dz * 0.08, C.BALL_R * (1.2 + frac), dx, dz, 1.6);
    }

    /* ── every frame ────────────────────────────────────────────────────── */

    function step(dt, world) {
        if (!S.ready) return;
        var b = world.ball;
        if (world.moving && !world.grounded) {
            S.air += dt;
            S.vx = b.vx; S.vy = b.vy; S.vz = b.vz;
        }
        if (world.moving && world.grounded && !world.ride && !world.warping) {
            var speed = Math.sqrt(b.vx * b.vx + b.vz * b.vz);
            var s = speed > 0.25 ? sandUnder(world.hole, b) : null;
            if (s) {
                plough(b, s, speed, dt);
                press(world.hole, b, s, speed);
            } else if (S.lastFur && S.lastFur.strand === S.strand) {
                S.strand++;
            }
            if (!s) S.emitCarry = 0;
            S.air = 0;
        } else if (S.lastFur && S.lastFur.strand === S.strand) {
            S.strand++;
        }
        stepGrains(dt);
    }

    function clear() {
        if (!S.ready) return;
        var i;
        for (i = 0; i < GRAINS; i++) { S.v[i].life = 0; S.alpha[i] = 0; S.pos[i * 3 + 1] = -9999; }
        S.points.geometry.attributes.position.needsUpdate = true;
        S.points.visible = false;
        S.live = 0;
        S.furCount = 0; S.furAt = -1; S.lastFur = null; S.strand++;
        S.furrow.geometry.setDrawRange(0, 0);
        for (i = 0; i < S.craters.length; i++) if (S.craters[i]) S.craters[i].visible = false;
        S.air = 0; S.vx = S.vy = S.vz = 0;
    }

    G3.sandfx = {
        build: build,
        light: light,
        resize: resize,
        step: step,
        land: land,
        blast: blast,
        clear: clear,
        state: S
    };
})(window.G3 = window.G3 || {});
