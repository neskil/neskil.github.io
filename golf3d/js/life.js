/* The things on a golf course that are not the golf course: the dressing the
   long holes are given (courses.dress) and the life that moves through them.

   Two halves, and they are kept apart for the same reason the bag is kept out
   of render.js: neither is the hole, nothing in either has ever been heard of
   by physics.js, and render.js is the file that has to stay readable about the
   things the ball does touch.

   - **The dressing** is built once per hole and never moves. Every piece of it
     — every flower in every patch, every shrub, the cart, the markers, the
     washer, the rakes — goes into *one* mesh with the colour carried per
     vertex, which is one draw call for a hole's worth of props. A phone pays
     for draw calls long before it pays for triangles, and three hundred
     flowers as three hundred meshes would be the most expensive thing on the
     screen.
   - **The life** is a handful of things that do move — a flock overhead,
     ducks on a pond, butterflies over the flowers — each a small group
     stepped every frame off the clock and the wind the rest of the scene
     already uses. None of it touches the ground the ball plays, and none of
     it is there on a mini golf lane: that is a model on a table, and birds
     circling a table are a mobile.

   Everything is added to the hole's group, so render.js's disposeGroup takes
   it away with the hole: the geometry, and the per-hole materials with it. */
window.G3 = window.G3 || {};

(function (G3) {
    'use strict';

    var P = G3.physics;
    var L = G3.life = {};
    var live = { birds: [], ducks: [], flies: [] };

    /* Each course's own colours for what grows on it. Three flower palettes a
       theme (a patch picks one by its variant), three tones of scrub, and the
       birds: a links course is gulls, everywhere else is something dark. The
       hexes go in as the rest of the palette does — sRGB handed over as linear,
       see README → "Light" — so they sit in the same light as the grass. */
    var LOOK = {
        parkland: {
            flowers: [[0xfbf8ee, 0xf4d03f], [0xf4d03f, 0xe8a33d], [0xee9bbd, 0xb7a2e0]],
            scrub: [0x3f7d34, 0x4c8b3b, 0x356c2f], bird: 0x26262e, gull: false
        },
        links: {
            flowers: [[0xf2a7c6, 0xfbf3f7], [0xf6d743, 0xfffbe6], [0xb9a4e2, 0xf2a7c6]],
            scrub: [0x687d3a, 0x7a8d46, 0x5a6e34], bird: 0xf1f1ee, gull: true
        },
        heath: {
            flowers: [[0x9a5bb3, 0xc49bd6], [0xf1c40f, 0xe0ac12], [0xc49bd6, 0xf1c40f]],
            scrub: [0x4b5f2f, 0x5b6c31, 0x405429], bird: 0x2a2a30, gull: false, gorse: true
        },
        canyon: {
            flowers: [[0xe5533f, 0xf3a03b], [0xf2c94c, 0xe67e22], [0xd35f1f, 0xf6cfa8]],
            scrub: [0x8b9a6c, 0x9ba67b, 0x7b8a5f], bird: 0x3a2b24, gull: false
        }
    };
    var STEM = 0x4d8a36, WOOD = 0x8a6440, DARK = 0x2e3236, WHITE = 0xf2f2ee;
    var MARKER = [0xd9342b, 0xf2f2ee, 0x2f6fd1];

    // Grass is not paint — it has height, and anything meant to be seen
    // standing in it has to stand above it (render.js, SHELL_HEIGHT).
    var MAT = { fairway: 0.165, rough: 0.26, green: 0.115 };

    function lookFor(name) { return LOOK[name] || LOOK.parkland; }

    // A small seeded generator, so a patch of flowers is the same patch on
    // every load. Same shape as the one courses.js uses.
    function seeded(seed) {
        var s = (seed >>> 0) || 1;
        return function () {
            s = (s + 0x6d2b79f5) >>> 0;
            var t = s;
            t = Math.imul(t ^ (t >>> 15), t | 1);
            t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
    }

    /* ── one mesh for a hole's worth of props ──────────────────────────── */

    var T = null;           // the shapes everything is built from, made once
    function templates() {
        if (T) return T;
        /* Flowers are the many thing here — a couple of hundred to a hole —
           so theirs are the cheapest shapes that still read: a three-sided
           open stem and an eight-faced head. Twenty-odd triangles a flower
           rather than the hundred a capped cylinder and an icosahedron cost. */
        T = {
            blob: new THREE.IcosahedronGeometry(1, 0),
            ball: new THREE.IcosahedronGeometry(1, 1),
            box: new THREE.BoxGeometry(1, 1, 1).toNonIndexed(),
            post: new THREE.CylinderGeometry(1, 1, 1, 6).toNonIndexed(),
            stem: new THREE.CylinderGeometry(1, 1, 1, 3, 1, true).toNonIndexed(),
            head: new THREE.OctahedronGeometry(1, 0),
            wheel: new THREE.CylinderGeometry(1, 1, 1, 10).toNonIndexed()
        };
        return T;
    }

    var _m = new THREE.Matrix4(), _n = new THREE.Matrix3(), _q = new THREE.Quaternion();
    var _e = new THREE.Euler(), _s = new THREE.Vector3(), _v = new THREE.Vector3();
    var _c = new THREE.Color();

    function Batch() { this.p = []; this.n = []; this.c = []; }
    /* One shape into the batch: moved, turned (yaw about y, then pitch and
       roll in its own frame) and scaled, and painted one colour. */
    Batch.prototype.add = function (geo, hex, x, y, z, sx, sy, sz, yaw, pitch, roll) {
        _e.set(pitch || 0, yaw || 0, roll || 0, 'YXZ');
        _q.setFromEuler(_e);
        _m.compose(_v.set(x, y, z), _q, _s.set(sx, sy, sz));
        _n.getNormalMatrix(_m);
        _c.set(hex);
        var pa = geo.attributes.position, na = geo.attributes.normal, i;
        for (i = 0; i < pa.count; i++) {
            _v.fromBufferAttribute(pa, i).applyMatrix4(_m);
            this.p.push(_v.x, _v.y, _v.z);
            _v.fromBufferAttribute(na, i).applyMatrix3(_n).normalize();
            this.n.push(_v.x, _v.y, _v.z);
            this.c.push(_c.r, _c.g, _c.b);
        }
    };
    /* `glow` makes it unlit — lava, neon, a lamp — which is a material that
       ignores the sun rather than a brighter colour: a lit orange in shadow is
       brown, and lava in shadow is still lava. */
    Batch.prototype.mesh = function (glow) {
        if (!this.p.length) return null;
        var g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3));
        g.setAttribute('normal', new THREE.Float32BufferAttribute(this.n, 3));
        g.setAttribute('color', new THREE.Float32BufferAttribute(this.c, 3));
        var m = new THREE.Mesh(g, glow
            ? new THREE.MeshBasicMaterial({ vertexColors: true })
            : new THREE.MeshLambertMaterial({ vertexColors: true }));
        m.castShadow = !glow;
        m.receiveShadow = !glow;
        return m;
    };
    Batch.prototype.count = function () { return this.p.length / 9; };

    /* ── the dressing ──────────────────────────────────────────────────── */

    function groundAt(hole, x, z) {
        var g = P.surfaceTop(hole, x, z);
        return g ? g : null;
    }
    // Where the top of the grass is, which is what a thing lying on it rests on.
    function matTop(hole, x, z) {
        var g = groundAt(hole, x, z);
        return g ? g.y + (MAT[g.pad.kind] || 0) * 0.6 : null;
    }

    function flowers(b, hole, it, look) {
        var rnd = seeded(it.seed), pal = look.flowers[it.variant % look.flowers.length];
        var n = Math.round(it.r * it.r * 18), i, a, rr, x, z, g, h, top;
        for (i = 0; i < n; i++) {
            a = rnd() * Math.PI * 2;
            rr = Math.sqrt(rnd()) * it.r;
            x = it.x + Math.cos(a) * rr;
            z = it.z + Math.sin(a) * rr;
            g = groundAt(hole, x, z);
            if (!g) continue;
            // Taller in the middle of a clump than at its edge, and every one
            // standing clear of the rough it grows in.
            h = MAT.rough + 0.06 + 0.16 * (1 - rr / it.r) * rnd() + 0.05 * rnd();
            b.add(T.stem, STEM, x, g.y + h / 2 - 0.02, z, 0.011, h, 0.011, 0, (rnd() - 0.5) * 0.3, (rnd() - 0.5) * 0.3);
            top = g.y + h;
            b.add(T.head, pal[rnd() < 0.72 ? 0 : 1], x, top, z, 0.06, 0.03, 0.06, rnd() * 6.28);
        }
    }

    function shrub(b, hole, it, look) {
        var rnd = seeded(it.seed), g = groundAt(hole, it.x, it.z), i, a, k, s, x, z, hex;
        if (!g) return;
        k = 2 + Math.floor(rnd() * 3);
        for (i = 0; i < k; i++) {
            a = rnd() * Math.PI * 2;
            s = it.r * (i ? 0.55 + rnd() * 0.3 : 0.85 + rnd() * 0.2);
            x = it.x + (i ? Math.cos(a) * it.r * 0.55 : 0);
            z = it.z + (i ? Math.sin(a) * it.r * 0.55 : 0);
            hex = look.scrub[(it.variant + i) % look.scrub.length];
            b.add(T.blob, hex, x, g.y + s * 0.55, z, s, s * 0.78, s, rnd() * 6.28, rnd() * 0.4, rnd() * 0.4);
        }
        // Gorse flowers the whole year round, which is the one thing everybody
        // knows about it.
        if (look.gorse) {
            for (i = 0; i < 10; i++) {
                a = rnd() * Math.PI * 2;
                b.add(T.head, 0xf3c623, it.x + Math.cos(a) * it.r * 0.7 * rnd(),
                    g.y + it.r * (0.75 + 0.35 * rnd()), it.z + Math.sin(a) * it.r * 0.7 * rnd(),
                    0.05, 0.04, 0.05);
            }
        }
    }

    function teeMarker(b, hole, it) {
        var g = groundAt(hole, it.x, it.z);
        if (!g) return;
        var top = g.y + MAT.fairway + 0.07;
        b.add(T.post, DARK, it.x, g.y + (top - g.y) / 2, it.z, 0.025, top - g.y, 0.025);
        b.add(T.ball, MARKER[it.variant % 3], it.x, top + 0.1, it.z, 0.13, 0.12, 0.13);
    }

    function washer(b, hole, it) {
        var g = groundAt(hole, it.x, it.z);
        if (!g) return;
        var y = g.y, yaw = it.yaw;
        b.add(T.post, 0x2f5d3a, it.x, y + 0.48, it.z, 0.035, 0.96, 0.035);
        b.add(T.box, 0x2f7a46, it.x, y + 1.02, it.z, 0.24, 0.3, 0.18, yaw);
        b.add(T.post, DARK, it.x + Math.cos(yaw) * 0.14, y + 1.2, it.z - Math.sin(yaw) * 0.14, 0.012, 0.22, 0.012, yaw, 0, 1.2);
        // …and the towel, which is always there and always slightly grubby.
        b.add(T.box, 0xe9e2cf, it.x - Math.sin(yaw) * 0.1, y + 0.72, it.z - Math.cos(yaw) * 0.1, 0.16, 0.28, 0.02, yaw);
    }

    function bin(b, hole, it) {
        var g = groundAt(hole, it.x, it.z);
        if (!g) return;
        b.add(T.post, 0x2f5d3a, it.x, g.y + 0.3, it.z, 0.19, 0.6, 0.19);
        b.add(T.post, DARK, it.x, g.y + 0.62, it.z, 0.21, 0.05, 0.21);
    }

    function cart(b, hole, it) {
        var g = groundAt(hole, it.x, it.z);
        if (!g) return;
        var y = g.y, yaw = it.yaw, c = Math.cos(yaw), s = Math.sin(yaw);
        var body = it.variant ? 0x2e6b46 : WHITE, roof = it.variant ? WHITE : 0x2e6b46;
        // Local (lx, lz) to world, with the cart's length along local z.
        function at(lx, lz) { return [it.x + lx * c + lz * s, it.z - lx * s + lz * c]; }
        var p = at(0, 0);
        b.add(T.box, body, p[0], y + 0.42, p[1], 1.05, 0.34, 1.85, yaw);
        p = at(0, -0.25);
        b.add(T.box, 0x3a3a3a, p[0], y + 0.68, p[1], 0.95, 0.12, 0.5, yaw);          // seat
        p = at(0, -0.48);
        b.add(T.box, 0x3a3a3a, p[0], y + 0.9, p[1], 0.95, 0.42, 0.08, yaw);          // backrest
        p = at(0, -0.62);
        b.add(T.box, body, p[0], y + 0.72, p[1], 0.9, 0.25, 0.55, yaw);              // bag well
        p = at(0, 0.0);
        b.add(T.box, roof, p[0], y + 1.62, p[1], 1.12, 0.06, 1.45, yaw);
        [[-0.47, 0.6], [0.47, 0.6], [-0.47, -0.55], [0.47, -0.55]].forEach(function (q) {
            var pp = at(q[0], q[1]);
            b.add(T.post, 0xb9bec4, pp[0], y + 1.12, pp[1], 0.025, 1.0, 0.025, yaw);
        });
        [[-0.52, 0.62], [0.52, 0.62], [-0.52, -0.6], [0.52, -0.6]].forEach(function (q) {
            var pp = at(q[0], q[1]);
            b.add(T.wheel, 0x1d1f21, pp[0], y + 0.2, pp[1], 0.2, 0.12, 0.2, yaw, 0, Math.PI / 2);
        });
        p = at(-0.25, 0.25);
        b.add(T.post, DARK, p[0], y + 0.85, p[1], 0.018, 0.5, 0.018, yaw, -0.5);   // steering column
        // The bag riding on the back, which is the whole point of a cart.
        p = at(0.15, -0.72);
        b.add(T.post, 0x7b2e2e, p[0], y + 1.0, p[1], 0.14, 0.75, 0.14, yaw, -0.25);
    }

    function rake(b, hole, it) {
        var c = Math.cos(it.yaw), s = Math.sin(it.yaw), len = 1.5;
        // Lying on the grass, which tilts: sit it on the mat at both ends.
        var h1 = matTop(hole, it.x - s * len / 2, it.z - c * len / 2);
        var h2 = matTop(hole, it.x + s * len / 2, it.z + c * len / 2);
        if (h1 === null || h2 === null) return;
        var pitch = -Math.atan2(h2 - h1, len), y = (h1 + h2) / 2 + 0.02;
        var handle = it.variant ? 0xe7b416 : WOOD;
        b.add(T.post, handle, it.x, y, it.z, 0.018, len, 0.018, it.yaw, pitch + Math.PI / 2);
        var hx = it.x + s * len / 2, hz = it.z + c * len / 2;
        b.add(T.box, DARK, hx, h2 + 0.03, hz, 0.46, 0.035, 0.05, it.yaw, pitch);
        for (var k = 0; k < 7; k++) {
            var o = (k - 3) * 0.065;
            b.add(T.box, DARK, hx + c * o + s * 0.04, h2 + 0.02, hz - s * o + c * 0.04,
                0.012, 0.012, 0.08, it.yaw, pitch);
        }
    }

    var BUILD = {
        flowers: flowers, shrub: shrub, teemarker: teeMarker, washer: washer,
        bin: bin, cart: cart, rake: rake
    };

    /* ── the life ──────────────────────────────────────────────────────── */

    function wingGeo(span, chord) {
        // One wing as a flat triangle, root at the origin, reaching out +x.
        var g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.Float32BufferAttribute([
            0, 0, chord * 0.5, span, 0, -chord * 0.2, 0, 0, -chord * 0.5,
            0, 0, -chord * 0.5, span, 0, -chord * 0.2, 0, 0, chord * 0.5
        ], 3));
        g.computeVertexNormals();
        return g;
    }

    /* A flock that circles the hole. Birds are seen against the sky from a
       long way below, so they are shapes rather than models: a body and two
       wings that beat, and glide for a beat every so often, the way a real
       flock does. On a links course they are gulls — bigger, paler, slower,
       and gliding more than they flap. */
    function flock(group, hole, look) {
        var b = hole.bounds, rnd = seeded(hole.name.length * 7919 + Math.round(b.maxZ * 13));
        var cx = (b.minX + b.maxX) / 2, cz = (b.minZ + b.maxZ) / 2;
        var top = Math.max(hole.tee.y || 0, hole.cup.y || 0);
        var n = look.flock || 5 + Math.floor(rnd() * 3), i;
        var size = look.size || (look.gull ? 1.5 : 1);
        var mat = new THREE.MeshLambertMaterial({ color: look.bird, side: THREE.DoubleSide });
        var wing = wingGeo(0.42 * size, 0.24 * size);
        var body = new THREE.ConeGeometry(0.06 * size, 0.42 * size, 5);
        body.rotateX(Math.PI / 2);
        var f = {
            cx: cx, cz: cz,
            R: Math.max(12, Math.hypot(b.maxX - b.minX, b.maxZ - b.minZ) * 0.35),
            y: top + 9 + rnd() * 4,
            w: (0.12 + rnd() * 0.06) * (rnd() < 0.5 ? -1 : 1) * (look.gull ? 0.7 : 1),
            a0: rnd() * Math.PI * 2,
            gull: look.gull,
            birds: []
        };
        for (i = 0; i < n; i++) {
            var g = new THREE.Group(), l = new THREE.Mesh(wing, mat), r = new THREE.Mesh(wing, mat);
            r.scale.x = -1;
            g.add(new THREE.Mesh(body, mat));
            g.add(l);
            g.add(r);
            group.add(g);
            f.birds.push({
                g: g, l: l, r: r,
                dx: (rnd() - 0.5) * 4, dy: (rnd() - 0.5) * 1.2, dz: (rnd() - 0.5) * 4,
                ph: rnd() * 6.28, beat: (look.gull ? 6 : 10) + rnd() * 2
            });
        }
        live.birds.push(f);
    }

    function stepFlock(f, t) {
        var i, k, bd, a, ox, oz, beat, glide;
        for (i = 0; i < f.birds.length; i++) {
            bd = f.birds[i];
            a = f.a0 + f.w * t + Math.sin(t * 0.21 + bd.ph) * 0.05;
            // Each bird keeps its own loose station on the circle and drifts
            // about it, so the flock breathes rather than flying in formation.
            ox = Math.cos(a) * (f.R + bd.dx + Math.sin(t * 0.37 + bd.ph) * 1.2);
            oz = Math.sin(a) * (f.R + bd.dz + Math.cos(t * 0.29 + bd.ph) * 1.2);
            bd.g.position.set(f.cx + ox, f.y + bd.dy + Math.sin(t * 0.5 + bd.ph) * 0.6, f.cz + oz);
            // Facing along the circle, and banked into it.
            k = f.w > 0 ? 1 : -1;
            bd.g.rotation.set(0, -a - (k > 0 ? 0 : Math.PI), 0.32 * k, 'YXZ');
            glide = Math.sin(t * (f.gull ? 0.45 : 0.7) + bd.ph * 3) > (f.gull ? 0.1 : 0.55);
            beat = glide ? 0.12 : Math.sin(t * bd.beat + bd.ph) * 0.7;
            bd.l.rotation.z = beat;
            bd.r.rotation.z = -beat;
        }
    }

    /* Ducks, on any water that is not the sea. A pair to a pond, paddling a
       slow figure of eight inside its banks and turning the way they swim. */
    function ducks(group, hole, sea) {
        if (sea) return;
        var w = hole.water || [], i, k;
        for (i = 0; i < w.length; i++) {
            var p = w[i];
            if (p.w < 3 || p.d < 3) continue;
            for (k = 0; k < 2; k++) {
                var d = new THREE.Group();
                var drake = k === 0;
                var plumage = new THREE.MeshLambertMaterial({ color: drake ? 0x9a9a92 : 0x8a6a48 });
                var headM = new THREE.MeshLambertMaterial({ color: drake ? 0x1f6b3a : 0x7a5a3c });
                var bill = new THREE.MeshLambertMaterial({ color: 0xe8a53a });
                var bodyG = new THREE.IcosahedronGeometry(0.17, 1);
                bodyG.scale(0.8, 0.55, 1.25);
                var bodyM = new THREE.Mesh(bodyG, plumage);
                bodyM.position.y = 0.06;
                d.add(bodyM);
                var head = new THREE.Mesh(new THREE.IcosahedronGeometry(0.075, 1), headM);
                head.position.set(0, 0.2, 0.17);
                d.add(head);
                var beak = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.025, 0.08), bill);
                beak.position.set(0, 0.19, 0.26);
                d.add(beak);
                var tail = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.12, 4), plumage);
                tail.rotation.x = -2.2;
                tail.position.set(0, 0.12, -0.22);
                d.add(tail);
                d.traverse(function (o) { if (o.isMesh) o.castShadow = true; });
                group.add(d);
                live.ducks.push({
                    g: d, cx: p.x + p.w / 2, cz: p.z + p.d / 2, y: p.y,
                    ax: Math.max(0.4, p.w / 2 - 0.9), az: Math.max(0.4, p.d / 2 - 0.9),
                    w: 0.09 + k * 0.012, ph: k * 0.9 + i, lx: 0, lz: 0
                });
            }
        }
    }

    function stepDuck(d, t) {
        var a = d.ph + d.w * t;
        var x = d.cx + Math.sin(a) * d.ax, z = d.cz + Math.sin(a * 2) * d.az * 0.6;
        var vx = x - d.lx, vz = z - d.lz;
        d.g.position.set(x, d.y + Math.sin(t * 1.7 + d.ph) * 0.012, z);
        if (vx * vx + vz * vz > 1e-8) d.g.rotation.y = Math.atan2(vx, vz);
        d.g.rotation.z = Math.sin(t * 1.3 + d.ph) * 0.04;
        d.lx = x;
        d.lz = z;
    }

    /* Butterflies, over the flower patches: two wings that clap shut and open
       again many times a second, wandering about the patch on a path that
       never quite repeats. */
    function butterflies(group, hole, dressing) {
        var patches = (dressing || []).filter(function (it) { return it.kind === 'flowers'; });
        var cols = [0xfdfbf3, 0xf6d743, 0xf0913a, 0x7fb3f0], i, k, n = 0;
        for (i = 0; i < patches.length && n < 6; i += 2) {
            var it = patches[i], g = groundAt(hole, it.x, it.z);
            if (!g) continue;
            var mat = new THREE.MeshLambertMaterial({ color: cols[n % cols.length], side: THREE.DoubleSide });
            var wing = new THREE.PlaneGeometry(0.11, 0.09);
            wing.translate(0.055, 0, 0);
            wing.rotateX(-Math.PI / 2);
            var bf = new THREE.Group(), l = new THREE.Mesh(wing, mat), r = new THREE.Mesh(wing, mat);
            r.scale.x = -1;
            bf.add(l);
            bf.add(r);
            group.add(bf);
            live.flies.push({
                g: bf, l: l, r: r, x: it.x, z: it.z, y: g.y + MAT.rough + 0.25,
                rr: it.r + 0.4, ph: n * 1.7 + it.r, lx: it.x, lz: it.z
            });
            n++;
        }
        for (k = 0; k < live.flies.length; k++) stepFly(live.flies[k], 0);
    }

    function stepFly(f, t) {
        var a = t * 0.9 + f.ph;
        var x = f.x + Math.sin(a) * f.rr * Math.cos(a * 0.37 + f.ph);
        var z = f.z + Math.cos(a * 1.13) * f.rr * Math.sin(a * 0.29 + 1);
        var y = f.y + 0.35 * (0.5 + 0.5 * Math.sin(a * 1.9 + f.ph)) + 0.12 * Math.sin(t * 7 + f.ph);
        var vx = x - f.lx, vz = z - f.lz;
        f.g.position.set(x, y, z);
        if (vx * vx + vz * vz > 1e-8) f.g.rotation.y = Math.atan2(vx, vz) + Math.PI / 2;
        var flap = 0.25 + 1.0 * Math.abs(Math.sin(t * 16 + f.ph));
        f.l.rotation.z = flap;
        f.r.rotation.z = -flap;
        f.lx = x;
        f.lz = z;
    }

    /* ── the worlds round the drawn holes ─────────────────────────────────

       A mini golf hole is a slab standing on something — the sea, a quarry
       floor, an arcade carpet, the moon — and for a long while the something
       was all there was: a model on a table, with an empty horizon behind it.
       Each theme now gets a little world of its own round the slab: a
       lighthouse out at sea with its lamp turning, gears the size of houses
       grinding round the clockwork course, a Ferris wheel over the fairground,
       a volcano smoking behind the cinder cone, sheep on the highland,
       penguins on the ice, a rocket on the moon and a satellite going over.

       The rules are the long game's with one difference. Nothing here is
       solid and nothing here is on the hole: every piece stands off the
       slab, outside its bounds by a clear margin, so the ball can never pass
       through any of it. The difference is the camera. A drawn hole is
       watched from just behind the tee, so nothing is put in the corridor
       behind it — the one place a prop would stand between the player and the
       shot.

       Built the same way as the dressing: everything still goes into one
       lit mesh and one unlit one (for the things that glow), and the things
       that move are a handful of small groups, each one of six motions —
       turn, bob, smoke, rise, wander, leap. */

    var rigs = [];          // everything in the world that moves

    // The shapes the worlds are built from, beyond the dressing's.
    function moreTemplates() {
        if (T.cone) return;
        T.cone = new THREE.ConeGeometry(1, 1, 8).toNonIndexed();
        T.ring = new THREE.TorusGeometry(1, 0.22, 4, 16).toNonIndexed();
        T.disc = new THREE.CylinderGeometry(1, 1, 1, 14).toNonIndexed();
        T.frustum = new THREE.CylinderGeometry(0.2, 1, 1, 12).toNonIndexed();
    }

    // A spot in a band round the hole: `inner` to `outer` units out from the
    // edge of its bounds, on a bearing from its middle, kept out of the
    // corridor behind the tee the camera watches from.
    function placer(hole, rnd) {
        var b = hole.bounds, cx = (b.minX + b.maxX) / 2, cz = (b.minZ + b.maxZ) / 2;
        var hx = (b.maxX - b.minX) / 2, hz = (b.maxZ - b.minZ) / 2;
        var dx = hole.cup.x - hole.tee.x, dz = hole.cup.z - hole.tee.z, L = Math.hypot(dx, dz) || 1;
        var ux = dx / L, uz = dz / L;
        var api = {
            cx: cx, cz: cz, hx: hx, hz: hz,
            // Out of the camera's corridor and off the hole's own footprint.
            clear: function (x, z, m) {
                var ax = x - hole.tee.x, az = z - hole.tee.z;
                var along = ax * ux + az * uz, across = Math.abs(ax * uz - az * ux);
                // The prop's own size counts, as much here as at the hole.
                if (along < 2 + m && along > -16 - m && across < 7 + m) return false;
                return !(x > b.minX - m && x < b.maxX + m && z > b.minZ - m && z < b.maxZ + m);
            },
            /* Somewhere the player will look: beyond the far end of the
               hole along the line of play, and off to one side of it so the
               flag is not standing in front of it. For the landmarks — a
               lighthouse put on a random bearing is a lighthouse behind you. */
            ahead: function (dist, side) {
                var c = ux, s = uz;
                var edge = Math.min(Math.abs(c) > 1e-6 ? hx / Math.abs(c) : 1e9,
                                    Math.abs(s) > 1e-6 ? hz / Math.abs(s) : 1e9);
                var k = rnd() < 0.5 ? -1 : 1;
                return { x: cx + c * (edge + dist) + s * side * k, z: cz + s * (edge + dist) - c * side * k, a: Math.atan2(s, c) };
            },
            spot: function (inner, outer, m) {
                for (var k = 0; k < 40; k++) {
                    var a = rnd() * Math.PI * 2, c = Math.cos(a), s = Math.sin(a);
                    var edge = Math.min(Math.abs(c) > 1e-6 ? hx / Math.abs(c) : 1e9,
                                        Math.abs(s) > 1e-6 ? hz / Math.abs(s) : 1e9);
                    var d = edge + inner + (outer - inner) * rnd();
                    var x = cx + c * d, z = cz + s * d;
                    if (api.clear(x, z, (m || 1) + 1.2)) return { x: x, z: z, a: a };
                }
                return null;
            }
        };
        return api;
    }

    function rig(o) { rigs.push(o); return o; }

    // ── the kit: things that stand still ──

    function rocks(b, x, y, z, s, hex, rnd) {
        var k = 2 + Math.floor(rnd() * 2);
        for (var i = 0; i < k; i++) {
            var f = i ? 0.5 + rnd() * 0.3 : 1;
            b.add(T.blob, hex, x + (i ? (rnd() - 0.5) * s * 1.4 : 0), y + s * f * 0.35,
                z + (i ? (rnd() - 0.5) * s * 1.4 : 0), s * f, s * f * (0.6 + rnd() * 0.3), s * f,
                rnd() * 6.28, rnd() * 0.5, rnd() * 0.5);
        }
    }
    function pine(b, x, y, z, s, leaf, snow) {
        b.add(T.post, 0x5a3f2a, x, y + s * 0.35, z, s * 0.09, s * 0.7, s * 0.09);
        b.add(T.cone, leaf, x, y + s * 1.05, z, s * 0.6, s * 1.1, s * 0.6);
        b.add(T.cone, leaf, x, y + s * 1.6, z, s * 0.42, s * 0.85, s * 0.42);
        if (snow) b.add(T.cone, 0xf4f8fb, x, y + s * 1.92, z, s * 0.2, s * 0.32, s * 0.2);
    }
    function palm(b, x, y, z, s, rnd) {
        var lean = (rnd() - 0.5) * 0.5, dir = rnd() * 6.28, px = x, pz = z, py = y, i;
        for (i = 0; i < 5; i++) {
            var t = lean * (i + 1) / 5;
            b.add(T.post, 0x8a6a45, px, py + s * 0.25, pz, s * 0.08 * (1 - i * 0.08), s * 0.52, s * 0.08, dir, t);
            px += Math.sin(dir) * Math.sin(t) * s * 0.5;
            pz += Math.cos(dir) * Math.sin(t) * s * 0.5;
            py += Math.cos(t) * s * 0.5;
        }
        for (i = 0; i < 7; i++) {
            b.add(T.box, i % 2 ? 0x3f8f3a : 0x4fa043, px, py, pz, s * 0.16, s * 0.04, s * 1.0,
                i / 7 * 6.28, 0.45 + rnd() * 0.25);
        }
        b.add(T.ball, 0x6b4a2a, px + s * 0.08, py - s * 0.08, pz, s * 0.08, s * 0.08, s * 0.08);
    }
    function crystal(b, x, y, z, s, hex, rnd) {
        b.add(T.head, hex, x, y + s * 0.6, z, s * 0.28, s, s * 0.28, rnd() * 6.28, (rnd() - 0.5) * 0.5, (rnd() - 0.5) * 0.5);
        b.add(T.head, hex, x + s * 0.3, y + s * 0.3, z - s * 0.1, s * 0.16, s * 0.55, s * 0.16, rnd() * 6.28, 0.4, -0.3);
    }
    function snowman(b, x, y, z, s, yaw) {
        b.add(T.ball, 0xf6f9fc, x, y + s * 0.4, z, s * 0.45, s * 0.42, s * 0.45);
        b.add(T.ball, 0xf6f9fc, x, y + s * 1.0, z, s * 0.32, s * 0.3, s * 0.32);
        b.add(T.ball, 0xf6f9fc, x, y + s * 1.42, z, s * 0.22, s * 0.22, s * 0.22);
        var fx = Math.sin(yaw), fz = Math.cos(yaw);
        b.add(T.cone, 0xe8762c, x + fx * s * 0.27, y + s * 1.42, z + fz * s * 0.27, s * 0.04, s * 0.2, s * 0.04, yaw, Math.PI / 2);
        b.add(T.box, 0x222222, x, y + s * 1.7, z, s * 0.3, s * 0.18, s * 0.3, yaw);
    }
    function grave(b, x, y, z, s, yaw, cross) {
        if (cross) {
            b.add(T.box, 0x8d9097, x, y + s * 0.55, z, s * 0.1, s * 1.1, s * 0.1, yaw);
            b.add(T.box, 0x8d9097, x, y + s * 0.78, z, s * 0.5, s * 0.1, s * 0.1, yaw);
        } else {
            b.add(T.box, 0x7d8189, x, y + s * 0.35, z, s * 0.55, s * 0.7, s * 0.12, yaw, 0, 0.08);
            b.add(T.disc, 0x7d8189, x, y + s * 0.7, z, s * 0.275, s * 0.12, s * 0.275, yaw, Math.PI / 2);
        }
    }
    function deadTree(b, x, y, z, s, rnd) {
        b.add(T.post, 0x3b3330, x, y + s * 0.8, z, s * 0.09, s * 1.6, s * 0.09, 0, (rnd() - 0.5) * 0.2);
        for (var i = 0; i < 4; i++) {
            var a = rnd() * 6.28, h = y + s * (0.9 + i * 0.22);
            b.add(T.post, 0x3b3330, x + Math.sin(a) * s * 0.25, h, z + Math.cos(a) * s * 0.25,
                s * 0.04, s * 0.7, s * 0.04, a, 0.9 + rnd() * 0.3);
        }
    }
    function tent(b, x, y, z, s, a, c) {
        b.add(T.post, 0xf2efe6, x, y + s * 0.45, z, s * 0.8, s * 0.9, s * 0.8);
        b.add(T.cone, a, x, y + s * 1.25, z, s * 0.95, s * 0.75, s * 0.95);
        b.add(T.cone, c, x, y + s * 1.25, z, s * 0.97, s * 0.3, s * 0.97, 0.39);
        b.add(T.post, 0x555555, x, y + s * 1.75, z, s * 0.03, s * 0.4, s * 0.03);
    }

    // ── the kit: things that move ──

    // A group that turns about one of its axes at a steady rate.
    function spinner(group, x, y, z, axis, w, ph) {
        var g = new THREE.Group();
        g.position.set(x, y, z);
        group.add(g);
        rig({ step: function (t) { g.rotation[axis] = (ph || 0) + w * t; } });
        return g;
    }

    /* Smoke and steam: a handful of puffs on one emitter, each rising,
       swelling and thinning out over its life and then starting again at the
       bottom, staggered so the column never empties. Grey and soft, or —
       for embers — small, bright and unlit. */
    function smoke(group, x, y, z, o) {
        var n = o.n || 6, puffs = [], i;
        var geo = o.ember ? new THREE.OctahedronGeometry(0.08, 0) : new THREE.IcosahedronGeometry(0.5, 1);
        for (i = 0; i < n; i++) {
            var m = new THREE.Mesh(geo, o.ember
                ? new THREE.MeshBasicMaterial({ color: o.colour, transparent: true, depthWrite: false })
                : new THREE.MeshLambertMaterial({ color: o.colour, transparent: true, depthWrite: false }));
            group.add(m);
            puffs.push(m);
        }
        rig({
            step: function (t) {
                for (var k = 0; k < n; k++) {
                    var age = ((t / o.period) + k / n) % 1, p = puffs[k];
                    var sway = Math.sin(t * 0.7 + k * 2.1) * (o.spread || 0.6) * age;
                    p.position.set(x + sway + (o.driftX || 0.6) * age * o.rise * 0.2,
                        y + age * o.rise, z + Math.cos(t * 0.5 + k) * (o.spread || 0.6) * age);
                    var sc = o.ember ? 1 : (o.size || 1) * (0.5 + age * 1.6);
                    p.scale.set(sc, sc, sc);
                    p.material.opacity = (o.ember ? 1 : (o.alpha || 0.55)) * (1 - age) * Math.min(1, age * 6);
                }
            }
        });
    }

    // Things that rise and are let go of: balloons, mostly.
    function risers(group, x, y, z, o) {
        var items = [], i;
        for (i = 0; i < o.n; i++) {
            var g = new THREE.Group();
            var ball = new THREE.Mesh(new THREE.IcosahedronGeometry(0.28, 1),
                new THREE.MeshLambertMaterial({ color: o.colours[i % o.colours.length] }));
            ball.scale.y = 1.2;
            g.add(ball);
            var str = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.6, 0.01),
                new THREE.MeshLambertMaterial({ color: 0xdddddd }));
            str.position.y = -0.62;
            g.add(str);
            group.add(g);
            items.push(g);
        }
        rig({
            step: function (t) {
                for (var k = 0; k < items.length; k++) {
                    var age = ((t / o.period) + k / items.length) % 1;
                    items[k].position.set(x + Math.sin(t * 0.6 + k * 1.7) * 1.2 + age * 3,
                        y + age * o.rise, z + Math.cos(t * 0.4 + k) * 1.2);
                    items[k].visible = age < 0.97;
                }
            }
        });
    }

    /* Something that walks about: a slow circle round a spot of its own,
       slowing almost to a stop and setting off again (so a field of sheep is
       never in step), facing the way it goes and bobbing as it walks. */
    function walker(group, g, hx, hz, y, r, w, ph, bob) {
        group.add(g);
        rig({
            step: function (t) {
                var a = ph + w * (t - 0.9 * Math.sin(t * 0.5 + ph) / 0.5);
                var speed = 1 - 0.9 * Math.cos(t * 0.5 + ph);
                g.position.set(hx + Math.cos(a) * r, y + Math.abs(Math.sin(t * 6 + ph)) * bob * speed, hz + Math.sin(a) * r);
                g.rotation.y = -a + (w > 0 ? 0 : Math.PI);
                g.rotation.z = Math.sin(t * 6 + ph) * 0.06 * speed;
            }
        });
    }
    function sheep(rnd) {
        var g = new THREE.Group(), wool = new THREE.MeshLambertMaterial({ color: 0xf1efe8 });
        var dark = new THREE.MeshLambertMaterial({ color: 0x2b2b2b });
        var body = new THREE.Mesh(new THREE.IcosahedronGeometry(0.42, 1), wool);
        body.scale.set(0.8, 0.75, 1.15);
        body.position.y = 0.55;
        g.add(body);
        var head = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.22, 0.28), dark);
        head.position.set(0, 0.62, 0.5);
        g.add(head);
        for (var i = 0; i < 4; i++) {
            var leg = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.32, 0.07), dark);
            leg.position.set(i % 2 ? 0.17 : -0.17, 0.16, i < 2 ? 0.25 : -0.25);
            g.add(leg);
        }
        g.traverse(function (o) { if (o.isMesh) o.castShadow = true; });
        return g;
    }
    function penguin() {
        var g = new THREE.Group();
        var black = new THREE.MeshLambertMaterial({ color: 0x1d2228 });
        var white = new THREE.MeshLambertMaterial({ color: 0xf4f6f8 });
        var orange = new THREE.MeshLambertMaterial({ color: 0xf0a030 });
        var body = new THREE.Mesh(new THREE.IcosahedronGeometry(0.28, 1), black);
        body.scale.set(0.85, 1.35, 0.8);
        body.position.y = 0.38;
        g.add(body);
        var belly = new THREE.Mesh(new THREE.IcosahedronGeometry(0.22, 1), white);
        belly.scale.set(0.8, 1.3, 0.5);
        belly.position.set(0, 0.36, 0.12);
        g.add(belly);
        var head = new THREE.Mesh(new THREE.IcosahedronGeometry(0.16, 1), black);
        head.position.y = 0.8;
        g.add(head);
        var beak = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.12, 5), orange);
        beak.rotation.x = Math.PI / 2;
        beak.position.set(0, 0.78, 0.17);
        g.add(beak);
        g.traverse(function (o) { if (o.isMesh) o.castShadow = true; });
        return g;
    }

    /* A fish that leaps: every few seconds, somewhere new in a band of sea
       round the hole, an arc out of the water and back in, and a ring that
       spreads where it went in. Where it comes up next is a hash of which
       leap this is, so it is the same sea on every load. */
    function leaper(group, hole, rnd, inner, outer, y, hex) {
        var P0 = placer(hole, rnd);
        var fish = new THREE.Mesh(new THREE.IcosahedronGeometry(0.16, 0),
            new THREE.MeshLambertMaterial({ color: hex }));
        fish.scale.set(0.5, 0.6, 1.6);
        var ring = new THREE.Mesh(new THREE.RingGeometry(0.3, 0.42, 20),
            new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, depthWrite: false }));
        ring.rotation.x = -Math.PI / 2;
        group.add(fish);
        group.add(ring);
        var period = 3.2 + rnd() * 2, ph = rnd() * 10, spots = [], k;
        for (k = 0; k < 8; k++) spots.push(P0.spot(inner, outer, 0.5) || { x: P0.cx, z: P0.cz + P0.hz + 6, a: 0 });
        rig({
            step: function (t) {
                var c = Math.floor((t + ph) / period), u = ((t + ph) % period) / period;
                var sp = spots[c % spots.length], dir = sp.a + 1.3;
                if (u < 0.22) {
                    var f = u / 0.22;
                    fish.visible = true;
                    fish.position.set(sp.x + Math.cos(dir) * (f - 0.5) * 1.4, y + Math.sin(f * Math.PI) * 0.9,
                        sp.z + Math.sin(dir) * (f - 0.5) * 1.4);
                    fish.rotation.set(-Math.cos(f * Math.PI) * 1.1, -dir + Math.PI / 2, 0, 'YXZ');
                } else fish.visible = false;
                if (u > 0.2 && u < 0.6) {
                    var g2 = (u - 0.2) / 0.4;
                    ring.visible = true;
                    ring.position.set(sp.x + Math.cos(dir) * 0.7, y + 0.03, sp.z + Math.sin(dir) * 0.7);
                    ring.scale.set(0.6 + g2 * 2.2, 0.6 + g2 * 2.2, 1);
                    ring.material.opacity = 0.7 * (1 - g2);
                } else ring.visible = false;
            }
        });
    }

    // A streak across the sky every so often, low over the horizon.
    function shootingStar(group, hole, rnd) {
        var P0 = placer(hole, rnd);
        var m = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 3.2),
            new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, depthWrite: false }));
        group.add(m);
        var period = 7 + rnd() * 4;
        rig({
            step: function (t) {
                var c = Math.floor(t / period), u = (t % period) / period;
                if (u > 0.12) { m.visible = false; return; }
                var f = u / 0.12, a = (c * 2.39996) % 6.283;
                var R0 = 60, x = P0.cx + Math.cos(a) * R0, z = P0.cz + Math.sin(a) * R0;
                m.visible = true;
                m.position.set(x + Math.sin(a) * (f - 0.5) * 40, 28 - f * 9, z - Math.cos(a) * (f - 0.5) * 40);
                m.rotation.set(-0.22, -a + Math.PI / 2 + Math.PI / 2, 0, 'YXZ');
                m.material.opacity = Math.sin(f * Math.PI);
            }
        });
    }

    // A gear: a rim, spokes and teeth, as one mesh that turns.
    function gearMesh(r, teeth, hex) {
        var b = new Batch(), i, a;
        b.add(T.ring, hex, 0, 0, 0, r * 0.85, r * 0.85, r * 0.85 * 1.4, 0, 0, 0);
        b.add(T.disc, hex, 0, 0, 0, r * 0.22, r * 0.3, r * 0.22, 0, Math.PI / 2);
        for (i = 0; i < 6; i++) {
            a = i / 6 * Math.PI * 2;
            b.add(T.box, hex, Math.cos(a) * r * 0.45, Math.sin(a) * r * 0.45, 0, r * 0.8, r * 0.1, r * 0.12, 0, 0, a);
        }
        for (i = 0; i < teeth; i++) {
            a = i / teeth * Math.PI * 2;
            b.add(T.box, hex, Math.cos(a) * r * 1.02, Math.sin(a) * r * 1.02, 0, r * 0.2, r * 0.14, r * 0.3, 0, 0, a);
        }
        return b.mesh();
    }

    // ── the recipes: one little world per theme ──

    var WORLD = {
        seaside: function (w) {
            var s = w.ahead(36 + w.rnd() * 6, 8 + w.rnd() * 3);
            lighthouse(w, s.x, s.z);
            for (var i = 0; i < 4; i++) {
                var p = w.spot(6, 16, 1.5);
                if (p) rocks(w.b, p.x, w.ground(p.x, p.z) - 0.3, p.z, 0.7 + w.rnd() * 0.8, 0x8c8478, w.rnd);
            }
            leaper(w.group, w.hole, w.rnd, 5, 18, w.ground(0, 0), 0x9fb7c4);
            leaper(w.group, w.hole, w.rnd, 5, 18, w.ground(0, 0), 0xb7c4cc);
            w.flock({ bird: 0xf1f1ee, gull: true });
        },
        lagoon: function (w) {
            for (var i = 0; i < 3; i++) {
                var p = w.spot(7, 20, 2.5);
                if (!p) continue;
                var y = w.ground(p.x, p.z);
                w.b.add(T.ball, 0xe8d39a, p.x, y - 0.5, p.z, 1.8 + w.rnd(), 0.75, 1.6 + w.rnd(), w.rnd() * 6);
                palm(w.b, p.x, y + 0.1, p.z, 1.8 + w.rnd() * 0.6, w.rnd);
                if (w.rnd() < 0.6) palm(w.b, p.x + 0.8, y + 0.05, p.z - 0.5, 1.4, w.rnd);
            }
            leaper(w.group, w.hole, w.rnd, 4, 16, w.ground(0, 0), 0xf0a14a);
            leaper(w.group, w.hole, w.rnd, 4, 16, w.ground(0, 0), 0x7fc1d9);
            leaper(w.group, w.hole, w.rnd, 4, 16, w.ground(0, 0), 0xf0a14a);
            w.flock({ bird: 0xf4f4f0, gull: true });
        },
        quarry: function (w) {
            var i, p;
            for (i = 0; i < 6; i++) {
                p = w.spot(4, 18, 1.5);
                if (p) rocks(w.b, p.x, w.ground(p.x, p.z), p.z, 0.6 + w.rnd(), 0x9a8f80, w.rnd);
            }
            for (i = 0; i < 6; i++) {
                p = w.spot(4, 16, 1);
                if (p) w.b.add(T.box, 0xb0a593, p.x, w.ground(p.x, p.z) + 0.4, p.z, 1.2, 0.8, 0.8, w.rnd() * 3);
            }
            p = w.spot(10, 16, 3);
            if (p) derrick(w, p.x, p.z);
            w.flock({ bird: 0x222226 });
        },
        highland: function (w) {
            var i, p;
            for (i = 0; i < 12; i++) {
                p = w.spot(4, 24, 1.2);
                if (p) pine(w.b, p.x, w.ground(p.x, p.z) - 0.1, p.z, 1.6 + w.rnd() * 1.4, 0x2f5a35, false);
            }
            for (i = 0; i < 5; i++) {
                p = w.spot(4, 16, 1.2);
                if (p) rocks(w.b, p.x, w.ground(p.x, p.z), p.z, 0.5 + w.rnd() * 0.7, 0x7a7a6e, w.rnd);
            }
            for (i = 0; i < 5; i++) {
                p = w.spot(4, 12, 2);
                if (p) walker(w.group, sheep(w.rnd), p.x, p.z, w.ground(p.x, p.z), 0.8 + w.rnd(), (w.rnd() < 0.5 ? 1 : -1) * 0.12, w.rnd() * 6, 0.04);
            }
            w.flock({ bird: 0x2a221c, size: 2.4, flock: 2 });
        },
        works: function (w) {
            var i, p;
            for (i = 0; i < 3; i++) {
                p = w.spot(8, 20, 2);
                if (!p) continue;
                var y = w.ground(p.x, p.z), h = 7 + w.rnd() * 5;
                w.b.add(T.post, 0x6b3f33, p.x, y + h / 2, p.z, 0.7, h, 0.7);
                w.b.add(T.post, 0x3a3a3a, p.x, y + h + 0.2, p.z, 0.8, 0.4, 0.8);
                smoke(w.group, p.x, y + h + 0.6, p.z, { colour: 0x9a9a9a, period: 6, rise: 7, n: 7, size: 1.3, alpha: 0.5 });
            }
            for (i = 0; i < 6; i++) {
                p = w.spot(4, 14, 1);
                if (!p) continue;
                var gy = w.ground(p.x, p.z);
                if (w.rnd() < 0.5) w.b.add(T.box, 0x8a6a40, p.x, gy + 0.4, p.z, 0.8, 0.8, 0.8, w.rnd() * 3);
                else w.b.add(T.post, i % 2 ? 0x2f6b9a : 0xb04a32, p.x, gy + 0.5, p.z, 0.35, 1.0, 0.35);
            }
            w.flock({ bird: 0x1e1e22 });
        },
        arcade: function (w) {
            var i, p, cols = [0xff4fa3, 0x4fe3ff, 0xffe14f, 0x9b6bff];
            for (i = 0; i < 8; i++) {
                p = w.spot(4, 18, 1);
                if (!p) continue;
                var y = w.ground(p.x, p.z), h = 1.5 + w.rnd() * 3, c = cols[i % cols.length];
                w.b.add(T.post, 0x2a1d3d, p.x, y + h / 2, p.z, 0.25, h, 0.25);
                w.glow.add(T.ring, c, p.x, y + h + 0.1, p.z, 0.45, 0.45, 0.45 * 1.4, 0, Math.PI / 2);
            }
            for (i = 0; i < 5; i++) {
                p = w.spot(6, 16, 1.5);
                if (!p) continue;
                var g = spinner(w.group, p.x, w.ground(p.x, p.z) + 2.5 + w.rnd() * 2, p.z, 'y', 0.6 + w.rnd(), w.rnd() * 6);
                var shape = new THREE.Mesh(i % 2 ? new THREE.OctahedronGeometry(0.6, 0) : new THREE.TorusGeometry(0.6, 0.12, 6, 16),
                    new THREE.MeshBasicMaterial({ color: cols[i % cols.length] }));
                shape.rotation.x = 0.5;
                g.add(shape);
            }
            for (i = 0; i < 3; i++) {
                p = w.spot(5, 14, 2);
                if (p) w.b.add(T.ball, 0xd8dde3, p.x, w.ground(p.x, p.z) + 0.9, p.z, 0.9, 0.9, 0.9);
            }
        },
        clockwork: function (w) {
            var i, p;
            for (i = 0; i < 5; i++) {
                p = w.spot(5, 18, 3);
                if (!p) continue;
                var r = 1.4 + w.rnd() * 2.2, y = w.ground(p.x, p.z);
                // Alternately lying flat and standing on edge, alternately
                // turning each way, and slower the bigger they are — the way
                // a train of gears really goes.
                gear(w, p.x, i % 2 ? y + r + 0.2 : y + 0.3, p.z, r, i % 2 === 0,
                    (i % 2 ? -1 : 1) * 0.5 / r, i % 3 ? 0xb08d3c : 0x8a8f96, p.a);
            }
            // The workshop floor: cogs that came off something, lying where
            // they fell, and brass pillars with a ball on top.
            for (i = 0; i < 7; i++) {
                p = w.spot(3, 14, 1);
                if (!p) continue;
                var cr = 0.35 + w.rnd() * 0.5, cy = w.ground(p.x, p.z) + 0.08, k;
                w.b.add(T.ring, 0x9c7a34, p.x, cy, p.z, cr, cr, cr * 0.9, 0, Math.PI / 2);
                for (k = 0; k < 8; k++) {
                    var ta = k / 8 * Math.PI * 2;
                    w.b.add(T.box, 0x9c7a34, p.x + Math.cos(ta) * cr * 1.15, cy, p.z + Math.sin(ta) * cr * 1.15,
                        cr * 0.25, cr * 0.18, cr * 0.25, -ta);
                }
            }
            for (i = 0; i < 4; i++) {
                p = w.spot(3, 12, 1);
                if (!p) continue;
                var py = w.ground(p.x, p.z), ph2 = 1.6 + w.rnd() * 1.5;
                w.b.add(T.post, 0xb08d3c, p.x, py + ph2 / 2, p.z, 0.18, ph2, 0.18);
                w.b.add(T.ball, 0xd4b25a, p.x, py + ph2 + 0.2, p.z, 0.28, 0.28, 0.28);
            }
            // …and a clock face the size of a house, still telling the time.
            p = w.spot(12, 18, 4);
            if (p) clockFace(w, p.x, p.z);
            w.flock({ bird: 0x3a3a3a });
        },
        mill: function (w) {
            var i, p = w.ahead(28 + w.rnd() * 4, 7 + w.rnd() * 2);
            windmill(w, p.x, p.z);
            for (i = 0; i < 6; i++) {
                p = w.spot(4, 16, 1.2);
                if (p) w.b.add(T.disc, 0xd9b45a, p.x, w.ground(p.x, p.z) + 0.45, p.z, 0.6, 0.9, 0.6, w.rnd() * 3, Math.PI / 2);
            }
            for (i = 0; i < 6; i++) {
                p = w.spot(5, 20, 1.5);
                if (p) pine(w.b, p.x, w.ground(p.x, p.z), p.z, 1.4 + w.rnd(), 0x3f7d34, false);
            }
            w.flock({ bird: 0x2a2a30 });
        },
        belfry: function (w) {
            var i, p;
            for (i = 0; i < 10; i++) {
                p = w.spot(3, 12, 0.8);
                if (p) grave(w.b, p.x, w.ground(p.x, p.z), p.z, 0.9 + w.rnd() * 0.4, p.a + (w.rnd() - 0.5) * 0.4, w.rnd() < 0.35);
            }
            for (i = 0; i < 4; i++) {
                p = w.spot(5, 16, 1.5);
                if (p) deadTree(w.b, p.x, w.ground(p.x, p.z), p.z, 1.6 + w.rnd(), w.rnd);
            }
            for (i = 0; i < 3; i++) {
                p = w.spot(3, 10, 1);
                if (!p) continue;
                var y = w.ground(p.x, p.z);
                w.b.add(T.post, 0x222428, p.x, y + 1.2, p.z, 0.05, 2.4, 0.05);
                w.glow.add(T.ball, 0xffd98a, p.x, y + 2.5, p.z, 0.16, 0.2, 0.16);
            }
            w.flock({ bird: 0x5c6068, flock: 9 });
        },
        icehouse: function (w) {
            var i, p;
            for (i = 0; i < 8; i++) {
                p = w.spot(4, 18, 1);
                if (p) crystal(w.b, p.x, w.ground(p.x, p.z) - 0.1, p.z, 0.8 + w.rnd() * 1.4, i % 2 ? 0xbfe6f5 : 0xdff3fb, w.rnd);
            }
            for (i = 0; i < 6; i++) {
                p = w.spot(6, 22, 1.2);
                if (p) pine(w.b, p.x, w.ground(p.x, p.z), p.z, 1.5 + w.rnd(), 0x2e5640, true);
            }
            for (i = 0; i < 2; i++) {
                p = w.spot(3, 9, 1);
                if (p) snowman(w.b, p.x, w.ground(p.x, p.z), p.z, 1.1, p.a + Math.PI);
            }
            for (i = 0; i < 4; i++) {
                p = w.spot(3, 10, 1.5);
                if (p) walker(w.group, penguin(), p.x, p.z, w.ground(p.x, p.z), 0.6 + w.rnd() * 0.8, (w.rnd() < 0.5 ? 1 : -1) * 0.2, w.rnd() * 6, 0.05);
            }
        },
        fairground: function (w) {
            var i, p = w.ahead(32 + w.rnd() * 4, 8 + w.rnd() * 2), cols = [[0xd8342f, 0xf2efe6], [0x2f6fd1, 0xf2c94c], [0x2e9e5b, 0xf2efe6]];
            ferris(w, p.x, p.z);
            for (i = 0; i < 3; i++) {
                p = w.spot(5, 14, 2);
                if (p) tent(w.b, p.x, w.ground(p.x, p.z), p.z, 1.6 + w.rnd() * 0.6, cols[i][0], cols[i][1]);
            }
            p = w.spot(4, 10, 1.5);
            if (p) risers(w.group, p.x, w.ground(p.x, p.z) + 1.2, p.z,
                { n: 6, period: 14, rise: 22, colours: [0xd8342f, 0xf2c94c, 0x2f6fd1, 0x2e9e5b, 0xff7ab6] });
            for (i = 0; i < 10; i++) {
                p = w.spot(2.5, 8, 0.5);
                if (p) w.glow.add(T.ball, [0xffe14f, 0xff7ab6, 0x7fe0ff][i % 3], p.x, w.ground(p.x, p.z) + 0.25, p.z, 0.12, 0.12, 0.12);
            }
        },
        volcano: function (w) {
            var i, p = w.ahead(60 + w.rnd() * 8, 10 + w.rnd() * 4);
            if (p) {
                var y = w.ground(p.x, p.z) - 1;
                // A cone with its top off, and the crater glowing in the hole.
                w.b.add(T.frustum, 0x3a2b2c, p.x, y + 8, p.z, 14, 16, 14);
                w.glow.add(T.disc, 0xff6a1f, p.x, y + 15.95, p.z, 2.5, 0.12, 2.5);
                smoke(w.group, p.x, y + 15.5, p.z, { colour: 0x55504c, period: 9, rise: 18, n: 9, size: 4, alpha: 0.45, spread: 2.5 });
                smoke(w.group, p.x, y + 15.5, p.z, { colour: 0xffa040, period: 3.5, rise: 9, n: 10, ember: true, spread: 1.6 });
            }
            for (i = 0; i < 4; i++) {
                p = w.spot(5, 16, 2);
                if (!p) continue;
                var gy = w.ground(p.x, p.z), r = 0.9 + w.rnd() * 1.1;
                w.glow.add(T.disc, 0xff5a14, p.x, gy + 0.02, p.z, r, 0.06, r * 0.8, w.rnd() * 3);
                rocks(w.b, p.x + r, gy, p.z, 0.5, 0x2a2224, w.rnd);
                smoke(w.group, p.x, gy + 0.2, p.z, { colour: 0xffb050, period: 2.6, rise: 2.5, n: 5, ember: true, spread: 0.6 });
            }
            for (i = 0; i < 6; i++) {
                p = w.spot(4, 18, 1);
                if (p) crystal(w.b, p.x, w.ground(p.x, p.z) - 0.1, p.z, 0.7 + w.rnd(), 0x1d1a22, w.rnd);
            }
        },
        lunar: function (w) {
            var i, p;
            for (i = 0; i < 10; i++) {
                // Mostly small, now and then a big one: the size of a crater
                // goes the way the size of what made it does.
                var r = 0.8 + Math.pow(w.rnd(), 2.2) * 3.4;
                p = w.spot(3, 24, r * CRATER_REACH * 1.12);
                if (p && w.ground3) crater(w, p.x, p.z, r);
            }
            p = w.spot(10, 16, 3);
            if (p) rocket(w, p.x, p.z);
            // A ringed planet hanging over the horizon ahead: low enough to be
            // in a camera that is looking down at a golf ball.
            p = w.ahead(95, 12);
            if (p) {
                // Rising out of the horizon rather than hanging over it.
                var py = w.ground(p.x, p.z) + 5;
                var pl = new THREE.Mesh(new THREE.IcosahedronGeometry(9, 2),
                    new THREE.MeshBasicMaterial({ color: 0x5b8fd9, fog: false }));
                pl.position.set(p.x, py, p.z);
                w.group.add(pl);
                var rg = spinner(w.group, p.x, py, p.z, 'y', 0.02, 0);
                var band = new THREE.Mesh(new THREE.RingGeometry(11, 15, 40),
                    new THREE.MeshBasicMaterial({ color: 0xd9c7a0, side: THREE.DoubleSide, transparent: true, opacity: 0.7, fog: false }));
                band.rotation.x = -1.2;
                rg.add(band);
            }
            satellite(w);
            shootingStar(w.group, w.hole, w.rnd);
            shootingStar(w.group, w.hole, w.rnd);
        }
    };

    /* An impact crater, as a piece of the plain itself.

       It used to be a dark disc with a torus on it, which from any distance
       is a grey doughnut lying on the moon. What makes a crater read is the
       light on it: an inner wall that faces the sun on one side of the bowl
       and turns away from it on the other, a crisp lit crest, and a flank
       that falls away outside until it is the plain again. So this is a
       height field round (x, z), and the shading is the sun on its normals.

       It is drawn in the plain's own material (render.js hands it over as
       `groundMat`), with the texture laid on by world position exactly as
       the surround's is, so where the flank meets the plain there is no
       seam: the same rock carries straight across. The vertex colour only
       ever *darkens or lightens* that rock — white on the flank, so the
       outer edge is the plain to the pixel; the floor in shadow-grey and the
       crest a little bright.

       The plain cannot be dug into from here — the surround is one mesh and
       this is drawn on it — so the bowl is made the other way up: the rim
       rises out of the plain and the inner wall falls to a floor at the
       plain's own level, painted dark, which the eye takes for depth. The
       crest wanders round the circle and up and down it from the seed, so no
       two are the same circle; the bigger ones keep a peak in the middle, as
       real ones do; and about one in three is fresh, with bright rays thrown
       across its ejecta. `CRATER_REACH` is how far out the flank runs, in
       rims — what `spot` has to keep clear of the hole. */
    var CRATER_REACH = 2.1;

    function crater(w, x, z, r) {
        var rnd = w.rnd, g = w.ground3;
        var H = r * (0.15 + rnd() * 0.06), reach = CRATER_REACH;
        var w1 = rnd() * 6.28, w2 = rnd() * 6.28, w3 = rnd() * 6.28;
        var fresh = rnd() < 0.35, nRays = 5 + Math.floor(rnd() * 5), rayPh = rnd() * 6.28;
        var peak = r > 2.4 ? H * 0.5 : 0;

        function rimAt(a) { return r * (1 + 0.07 * Math.sin(3 * a + w1) + 0.04 * Math.sin(5 * a + w2)); }
        function crestAt(a) { return H * (1 + 0.2 * Math.sin(2 * a + w3) + 0.08 * Math.sin(7 * a + w1)); }
        function smooth(t) { t = Math.max(0, Math.min(1, t)); return t * t * (3 - 2 * t); }
        // Height over the plain at q rims out along bearing a: a dished floor
        // (and a peak), a wall up to the crest, and a flank falling away
        // concave until it is a hair under the plain.
        function lift(q, a) {
            var c = crestAt(a), h;
            if (q < 0.48) h = c * 0.05 * (q / 0.48) * (q / 0.48) + peak * Math.pow(Math.max(0, 1 - q / 0.2), 1.5);
            else if (q < 1) h = c * 0.05 + c * 0.95 * Math.pow(smooth((q - 0.48) / 0.52), 1.9);
            else h = c * Math.pow(1 - smooth((q - 1) / (reach - 1)), 2.6);
            return h + 0.035 - 0.07 * smooth((q - reach + 0.2) / 0.2);
        }
        // How much lighter or darker than the plain's own rock.
        function shade(q, a) {
            if (q < 0.48) return 0.62 + 0.1 * (q / 0.48);
            if (q < 1) return 0.72 + 0.4 * Math.pow(smooth((q - 0.5) / 0.5), 2);
            var k = 1.12 - 0.12 * smooth((q - 1) / (reach - 1) * 1.8);
            if (fresh) {
                var ray = Math.pow(Math.max(0, Math.cos((a + rayPh) * nRays * 0.5)), 10);
                k += ray * 0.22 * (1 - smooth((q - 1) / (reach - 1)));
            }
            return k;
        }
        // Rings closer together where the profile turns: through the wall
        // and over the crest.
        var qs = [0, 0.08, 0.16, 0.26, 0.36, 0.48, 0.58, 0.68, 0.77, 0.85, 0.91, 0.96, 1,
                  1.04, 1.1, 1.18, 1.3, 1.45, 1.62, 1.82, 1.95, reach];
        var segs = Math.max(30, Math.round(r * 18)), i, j, k;
        var V = [];
        for (i = 0; i < qs.length; i++) {
            for (j = 0; j < segs; j++) {
                var a = j / segs * Math.PI * 2, rr = rimAt(a), d = qs[i] * rr;
                var vx = x + Math.cos(a) * d, vz = z + Math.sin(a) * d;
                // The normal off the profile, by differences along the bearing
                // and across it.
                var e = 0.02, dq = e / rr;
                var hr = (lift(qs[i] + dq, a) - lift(Math.max(0, qs[i] - dq), a)) / (qs[i] > dq ? 2 * e : e);
                var ht = (lift(qs[i], a + 0.02) - lift(qs[i], a - 0.02)) / (0.04 * Math.max(d, 0.05));
                var nx = -(hr * Math.cos(a) - ht * Math.sin(a)), nz = -(hr * Math.sin(a) + ht * Math.cos(a));
                var nl = Math.hypot(nx, 1, nz);
                V.push([vx, w.ground(vx, vz) + lift(qs[i], a), vz, nx / nl, 1 / nl, nz / nl, shade(qs[i], a)]);
            }
        }
        function put(v) {
            v = V[v];
            g.p.push(v[0], v[1], v[2]);
            g.n.push(v[3], v[4], v[5]);
            g.c.push(v[6], v[6], v[6]);
            g.uv.push(v[0] / g.tile, v[2] / g.tile);
        }
        for (i = 0; i + 1 < qs.length; i++) {
            for (j = 0; j < segs; j++) {
                k = (j + 1) % segs;
                var a0 = i * segs + j, a1 = i * segs + k, b0 = (i + 1) * segs + j, b1 = (i + 1) * segs + k;
                // Counter-clockwise seen from above, so the face is the top.
                put(a0); put(a1); put(b0);
                put(a1); put(b1); put(b0);
            }
        }
    }

    // ── the set pieces, which are too big for the kit ──

    function clockFace(w, x, z) {
        var y = w.ground(x, z), R = 3.2, face = new THREE.Group(), i, a;
        face.position.set(x, y + R + 0.6, z);
        face.rotation.y = Math.atan2(w.cx - x, w.cz - z);
        w.group.add(face);
        var b = new Batch();
        b.add(T.disc, 0xf3ead2, 0, 0, 0, R, 0.25, R, 0, Math.PI / 2);
        b.add(T.ring, 0xb08d3c, 0, 0, 0.1, R, R, R * 0.8);
        for (i = 0; i < 12; i++) {
            a = i / 12 * Math.PI * 2;
            b.add(T.box, 0x2d2a26, Math.cos(a) * R * 0.82, Math.sin(a) * R * 0.82, 0.15, 0.12, i % 3 ? 0.3 : 0.55, 0.05, 0, 0, a - Math.PI / 2);
        }
        face.add(b.mesh());
        w.b.add(T.post, 0x6b5a3a, x, y + 0.45, z, 0.25, 0.9, 0.25);
        // The hands go round — the minute hand at a minute a second, so you
        // can see it move, and the hour hand twelve times slower.
        var hands = [[R * 0.75, 0.1, 1 / 9.55], [R * 0.5, 0.16, 1 / 114.6]].map(function (hd) {
            var pivot = new THREE.Group();
            pivot.position.z = 0.22;
            face.add(pivot);
            var m = new THREE.Mesh(new THREE.BoxGeometry(hd[1], hd[0], 0.04), new THREE.MeshLambertMaterial({ color: 0x1e1c1a }));
            m.position.y = hd[0] / 2;
            pivot.add(m);
            return { g: pivot, w: hd[2] };
        });
        rig({ step: function (t) { for (var k = 0; k < hands.length; k++) hands[k].g.rotation.z = -t * hands[k].w * 6.283 - k * 2; } });
    }

    function gear(w, x, y, z, r, flat, rate, hex, facing) {
        var hold = new THREE.Group();
        hold.position.set(x, y, z);
        if (flat) hold.rotation.x = -Math.PI / 2;
        else hold.rotation.y = facing;
        w.group.add(hold);
        var turn = new THREE.Group();
        hold.add(turn);
        turn.add(gearMesh(r, Math.round(r * 7), hex));
        var ph = w.rnd() * 6;
        rig({ step: function (t) { turn.rotation.z = ph + rate * t; } });
    }

    function lighthouse(w, x, z) {
        var y = w.ground(x, z);
        rocks(w.b, x, y - 0.6, z, 2.6, 0x7d766c, w.rnd);
        for (var i = 0; i < 4; i++) {
            w.b.add(T.post, i % 2 ? 0xd8342f : 0xf2efe6, x, y + 1.2 + i * 1.6, z, 1.1 - i * 0.12, 1.6, 1.1 - i * 0.12);
        }
        w.b.add(T.post, 0x2d2f33, x, y + 7.8, z, 0.85, 0.3, 0.85);
        w.glow.add(T.post, 0xfff2b0, x, y + 8.3, z, 0.6, 0.8, 0.6);
        w.b.add(T.cone, 0xd8342f, x, y + 9.1, z, 0.85, 0.9, 0.85);
        // The lamp turns, and throws a beam you can see in the haze.
        var g = spinner(w.group, x, y + 8.3, z, 'y', 0.9, 0);
        var beam = new THREE.Mesh(new THREE.ConeGeometry(1.4, 16, 12, 1, true),
            new THREE.MeshBasicMaterial({ color: 0xfff4c0, transparent: true, opacity: 0.16, depthWrite: false, side: THREE.DoubleSide }));
        // Narrow end at the lamp, wide end sixteen units out.
        beam.rotation.z = -Math.PI / 2;
        beam.position.x = -8;
        g.add(beam);
    }

    function derrick(w, x, z) {
        var y = w.ground(x, z);
        w.b.add(T.post, 0x7a5a3a, x - 0.8, y + 3, z, 0.12, 6.2, 0.12, 0, 0, 0.13);
        w.b.add(T.post, 0x7a5a3a, x + 0.8, y + 3, z, 0.12, 6.2, 0.12, 0, 0, -0.13);
        var g = new THREE.Group();
        g.position.set(x, y + 5.8, z);
        w.group.add(g);
        var boom = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 8), new THREE.MeshLambertMaterial({ color: 0x7a5a3a }));
        boom.position.z = 3;
        boom.rotation.x = -0.35;
        g.add(boom);
        var load = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.7, 0.9), new THREE.MeshLambertMaterial({ color: 0xa89c88 }));
        load.position.set(0, 0.2, 6.6);
        g.add(load);
        var ph = w.rnd() * 6;
        rig({ step: function (t) { g.rotation.y = Math.sin(t * 0.15 + ph) * 1.1; } });
    }

    function windmill(w, x, z) {
        var y = w.ground(x, z);
        w.b.add(T.cone, 0xe9e1cf, x, y + 3.2, z, 1.8, 6.4, 1.8);
        w.b.add(T.cone, 0x6b3f2a, x, y + 6.9, z, 1.1, 1.4, 1.1);
        var hub = spinner(w.group, x, y + 6.2, z, 'z', 0.7, 0);
        hub.parent.remove(hub);
        var face = new THREE.Group();
        face.position.set(x, y + 6.2, z);
        face.rotation.y = Math.atan2(w.cx - x, w.cz - z);
        w.group.add(face);
        hub.position.set(0, 0, 1.2);
        face.add(hub);
        var sailM = new THREE.MeshLambertMaterial({ color: 0xf2efe6 }), frame = new THREE.MeshLambertMaterial({ color: 0x5c4228 });
        for (var i = 0; i < 4; i++) {
            var arm = new THREE.Group();
            arm.rotation.z = i * Math.PI / 2;
            hub.add(arm);
            var spar = new THREE.Mesh(new THREE.BoxGeometry(0.12, 4.4, 0.1), frame);
            spar.position.y = 2.2;
            arm.add(spar);
            var sail = new THREE.Mesh(new THREE.BoxGeometry(0.9, 3.4, 0.04), sailM);
            sail.position.set(0.5, 2.5, 0);
            arm.add(sail);
        }
    }

    function ferris(w, x, z) {
        var y = w.ground(x, z), R = 6.5, cab = [];
        w.b.add(T.post, 0x6c6f78, x - 1.2, y + R / 2 + 0.6, z, 0.18, R + 1.4, 0.18, 0, 0, 0.18);
        w.b.add(T.post, 0x6c6f78, x + 1.2, y + R / 2 + 0.6, z, 0.18, R + 1.4, 0.18, 0, 0, -0.18);
        var face = new THREE.Group();
        face.position.set(x, y + R + 1.2, z);
        face.rotation.y = Math.atan2(w.cx - x, w.cz - z);
        w.group.add(face);
        var wheel = new THREE.Group();
        face.add(wheel);
        var rimB = new Batch(), i, a, cols = [0xd8342f, 0xf2c94c, 0x2f6fd1, 0x2e9e5b, 0xff7ab6, 0x9b6bff];
        rimB.add(T.ring, 0xe0e3e8, 0, 0, 0, R, R, R * 0.6);
        for (i = 0; i < 12; i++) {
            a = i / 12 * Math.PI * 2;
            rimB.add(T.box, 0xc9ccd2, Math.cos(a) * R / 2, Math.sin(a) * R / 2, 0, R, 0.08, 0.08, 0, 0, a);
        }
        wheel.add(rimB.mesh());
        var lights = new Batch();
        for (i = 0; i < 24; i++) {
            a = i / 24 * Math.PI * 2;
            lights.add(T.ball, cols[i % cols.length], Math.cos(a) * R, Math.sin(a) * R, 0.2, 0.12, 0.12, 0.12);
        }
        wheel.add(lights.mesh(true));
        for (i = 0; i < 8; i++) {
            a = i / 8 * Math.PI * 2;
            var c = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.8, 0.9), new THREE.MeshLambertMaterial({ color: cols[i % cols.length] }));
            var hang = new THREE.Group();
            hang.position.set(Math.cos(a) * R, Math.sin(a) * R, 0);
            c.position.y = -0.55;
            hang.add(c);
            wheel.add(hang);
            cab.push(hang);
        }
        rig({
            step: function (t) {
                wheel.rotation.z = t * 0.12;
                // The cabins hang: whatever the wheel does, they stay level.
                for (var k = 0; k < cab.length; k++) cab[k].rotation.z = -wheel.rotation.z;
            }
        });
    }

    function rocket(w, x, z) {
        var y = w.ground(x, z);
        w.b.add(T.disc, 0x55575c, x, y + 0.15, z, 2.2, 0.3, 2.2);
        w.b.add(T.post, 0xf0f0ec, x, y + 3.2, z, 0.75, 5.6, 0.75);
        w.b.add(T.post, 0xd8342f, x, y + 4.4, z, 0.78, 0.5, 0.78);
        w.b.add(T.cone, 0xd8342f, x, y + 6.8, z, 0.75, 1.6, 0.75);
        for (var i = 0; i < 4; i++) {
            var a = i * Math.PI / 2 + 0.4;
            w.b.add(T.box, 0xd8342f, x + Math.cos(a) * 0.95, y + 1.1, z + Math.sin(a) * 0.95, 0.08, 1.5, 0.7, -a);
        }
        w.glow.add(T.disc, 0x7fd4ff, x + 0.76, y + 5.2, z, 0.22, 0.04, 0.22, 0, 0, Math.PI / 2);
        // A flag beside it, standing in airless stillness.
        w.b.add(T.post, 0xc0c0c0, x + 3, y + 1.1, z + 1.5, 0.03, 2.2, 0.03);
        w.b.add(T.box, 0x2f6fd1, x + 3.45, y + 1.95, z + 1.5, 0.9, 0.55, 0.02);
    }

    function satellite(w) {
        var g = spinner(w.group, w.cx, w.ground(w.cx, w.cz) + 22, w.cz, 'y', 0.11, w.rnd() * 6);
        var body = new THREE.Group();
        body.position.x = 26;
        g.add(body);
        var m = new THREE.MeshLambertMaterial({ color: 0xd8d8d0 });
        body.add(new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.7, 0.9), m));
        var panel = new THREE.MeshLambertMaterial({ color: 0x2f4f8f });
        var pl = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.04, 0.8), panel);
        pl.position.x = 1.7;
        body.add(pl);
        var pr = pl.clone();
        pr.position.x = -1.7;
        body.add(pr);
        var blink = new THREE.Mesh(new THREE.OctahedronGeometry(0.14, 0), new THREE.MeshBasicMaterial({ color: 0xff4040 }));
        blink.position.y = 0.5;
        body.add(blink);
        rig({ step: function (t) { blink.visible = (t % 1.6) < 0.25; } });
    }

    function world(group, hole, themeName, ground, groundMat) {
        var recipe = WORLD[themeName];
        if (!recipe) return { props: 0, glow: 0 };
        moreTemplates();
        var rnd = seeded(hole.name.length * 2654435 + Math.round((hole.cup.x + 31) * (hole.cup.z + 17) * 97));
        var P0 = placer(hole, rnd);
        var w = {
            group: group, hole: hole, rnd: rnd, cx: P0.cx, cz: P0.cz,
            b: new Batch(), glow: new Batch(),
            spot: P0.spot, ahead: P0.ahead,
            ground: function (x, z) { return ground ? ground(x, z) : 0; },
            // Ground of the plain's own (craters): drawn in its material, so
            // it carries uvs as well, at the plain's tiling.
            ground3: groundMat ? { p: [], n: [], c: [], uv: [], tile: groundMat.tile } : null,
            flock: function (look) { flock(group, hole, look); }
        };
        recipe(w);
        var props = w.b.count(), glow = w.glow.count(), m, meshes = [];
        if ((m = w.b.mesh())) { group.add(m); meshes.push(m); }
        if ((m = w.glow.mesh(true))) { group.add(m); meshes.push(m); }
        if (w.ground3 && w.ground3.p.length) {
            var gg = new THREE.BufferGeometry();
            gg.setAttribute('position', new THREE.Float32BufferAttribute(w.ground3.p, 3));
            gg.setAttribute('normal', new THREE.Float32BufferAttribute(w.ground3.n, 3));
            gg.setAttribute('color', new THREE.Float32BufferAttribute(w.ground3.c, 3));
            gg.setAttribute('uv', new THREE.Float32BufferAttribute(w.ground3.uv, 2));
            m = new THREE.Mesh(gg, groundMat.material());
            m.receiveShadow = true;
            m.castShadow = true;
            group.add(m); meshes.push(m);
            props += w.ground3.p.length / 9;
        }
        return { props: props, glow: glow, meshes: meshes };
    }

    /* ── the two calls render.js makes ─────────────────────────────────── */

    /* Everything for one hole, into its group. `themeName` picks the colours;
       `sea` says the water around the hole is the sea, which ducks do not
       paddle about on. */
    var built = { props: 0, glow: 0, meshes: [] };

    L.build = function (group, hole, themeName, sea, ground, groundMat) {
        live.birds = [];
        live.ducks = [];
        live.flies = [];
        rigs = [];
        built = { props: 0, glow: 0, meshes: [] };
        if (!hole) return;
        templates();
        if (!hole.open) {
            built = world(group, hole, themeName, ground, groundMat);
            L.update(0, 0);
            return;
        }
        var look = lookFor(themeName), b = new Batch(), i, it;
        for (i = 0; i < (hole.dressing || []).length; i++) {
            it = hole.dressing[i];
            if (BUILD[it.kind]) BUILD[it.kind](b, hole, it, look);
        }
        var m = b.mesh();
        if (m) group.add(m);
        flock(group, hole, look);
        ducks(group, hole, sea);
        butterflies(group, hole, hole.dressing);
        L.update(0, 0);
    };

    L.update = function (dt, t) {
        var i;
        for (i = 0; i < live.birds.length; i++) stepFlock(live.birds[i], t);
        for (i = 0; i < live.ducks.length; i++) stepDuck(live.ducks[i], t);
        for (i = 0; i < live.flies.length; i++) stepFly(live.flies[i], t);
        for (i = 0; i < rigs.length; i++) rigs[i].step(t);
    };

    // One bird, for the tests to watch move.
    L.peek = function () {
        return {
            bird: live.birds.length && live.birds[0].birds.length ? live.birds[0].birds[0].g : null,
            // The props a drawn hole's world was built into, for the tests to
            // check where every vertex of them stands.
            world: built.meshes
        };
    };

    // What is alive on the hole, for the tests to count.
    L.census = function () {
        return {
            birds: live.birds.reduce(function (n, f) { return n + f.birds.length; }, 0),
            ducks: live.ducks.length,
            butterflies: live.flies.length,
            rigs: rigs.length,
            props: built.props,
            glow: built.glow
        };
    };

})(window.G3);
