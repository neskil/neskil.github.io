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
    Batch.prototype.mesh = function () {
        if (!this.p.length) return null;
        var g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3));
        g.setAttribute('normal', new THREE.Float32BufferAttribute(this.n, 3));
        g.setAttribute('color', new THREE.Float32BufferAttribute(this.c, 3));
        var m = new THREE.Mesh(g, new THREE.MeshLambertMaterial({ vertexColors: true }));
        m.castShadow = true;
        m.receiveShadow = true;
        return m;
    };

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
        var n = 5 + Math.floor(rnd() * 3), i;
        var size = look.gull ? 1.5 : 1;
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

    /* ── the two calls render.js makes ─────────────────────────────────── */

    /* Everything for one hole, into its group. `themeName` picks the colours;
       `sea` says the water around the hole is the sea, which ducks do not
       paddle about on. */
    L.build = function (group, hole, themeName, sea) {
        live.birds = [];
        live.ducks = [];
        live.flies = [];
        if (!hole || !hole.open) return;
        templates();
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
    };

    // One bird, for the tests to watch move.
    L.peek = function () {
        return { bird: live.birds.length && live.birds[0].birds.length ? live.birds[0].birds[0].g : null };
    };

    // What is alive on the hole, for the tests to count.
    L.census = function () {
        return {
            birds: live.birds.reduce(function (n, f) { return n + f.birds.length; }, 0),
            ducks: live.ducks.length,
            butterflies: live.flies.length
        };
    };

})(window.G3);
