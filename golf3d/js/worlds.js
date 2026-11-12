/* The simple set pieces of the World Tour's holes.

   Each tour hole is played inside a world from Ethan Mollick's Portals, drawn
   live behind it (backdrop.mjs). This is what stands round the hole when that
   is not there: while the world is still building, on a phone, with live
   worlds switched off, or on a machine that cannot run a second renderer.
   A turtle under the shell, a gas giant under the balloons, a big wheel
   beside the rink — original stand-ins in this game's own three.js, a few
   primitives each, so a tour hole is never a hole in an empty sky.

   None of it is solid and none of it is on the line of play. Everything is
   parented to the group it is handed (render.js's `outer`, which a live
   world puts away whole) and disposed with the hole. What moves is moved by
   `step`, off the renderer's clock. */
(function (G3) {
    'use strict';

    var W = { movers: [] };
    var T; // THREE, read at build time so this file can load without it

    function mat(colour, o) {
        o = o || {};
        var m = new T.MeshLambertMaterial({ color: colour, flatShading: !!o.flat });
        if (o.emissive !== undefined) m.emissive = new T.Color(o.emissive);
        if (o.far) m.fog = false;
        if (o.opacity !== undefined) { m.transparent = true; m.opacity = o.opacity; m.depthWrite = false; }
        if (o.side) m.side = T.DoubleSide;
        return m;
    }
    function glow(colour, o) {
        o = o || {};
        var m = new T.MeshBasicMaterial({ color: colour, fog: !o.far });
        if (o.opacity !== undefined) { m.transparent = true; m.opacity = o.opacity; m.depthWrite = false; }
        if (o.add) m.blending = T.AdditiveBlending;
        if (o.side) m.side = T.DoubleSide;
        return m;
    }
    function put(g, mesh, x, y, z) { mesh.position.set(x, y, z); g.add(mesh); return mesh; }
    function ball(r, m, sx, sy, sz) {
        var s = new T.Mesh(new T.SphereGeometry(r, 24, 16), m);
        if (sx) s.scale.set(sx, sy, sz);
        return s;
    }
    function box(w, h, d, m) { return new T.Mesh(new T.BoxGeometry(w, h, d), m); }
    function cyl(r0, r1, h, m, n) { return new T.Mesh(new T.CylinderGeometry(r0, r1, h, n || 24), m); }
    function torus(R, r, m, n) { return new T.Mesh(new T.TorusGeometry(R, r, 10, n || 48), m); }

    function seeded(seed) {
        var s = seed >>> 0 || 1;
        return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
    }

    // Loose points: spores, bubbles, embers, lamps on a string.
    function specks(n, colour, size, place, o) {
        o = o || {};
        var pos = new Float32Array(n * 3), i, p = {};
        for (i = 0; i < n; i++) { place(i, p); pos[i * 3] = p.x; pos[i * 3 + 1] = p.y; pos[i * 3 + 2] = p.z; }
        var geo = new T.BufferGeometry();
        geo.setAttribute('position', new T.BufferAttribute(pos, 3));
        var m = new T.PointsMaterial({ color: colour, size: size, transparent: true,
            opacity: o.opacity === undefined ? 0.9 : o.opacity, depthWrite: false,
            blending: o.plain ? T.NormalBlending : T.AdditiveBlending, fog: !o.far });
        return new T.Points(geo, m);
    }

    function stripes(colours, n, vertical) {
        var cv = document.createElement('canvas');
        cv.width = cv.height = 256;
        var g = cv.getContext('2d'), i, h = 256 / n;
        for (i = 0; i < n; i++) {
            g.fillStyle = colours[i % colours.length];
            if (vertical) g.fillRect(i * h, 0, h + 1, 256); else g.fillRect(0, i * h, 256, h + 1);
        }
        var t = new T.CanvasTexture(cv);
        W.tex.push(t);
        return t;
    }

    function extent(hole) {
        var a = Infinity, b = -Infinity, c = Infinity, d = -Infinity;
        hole.pads.forEach(function (p) {
            a = Math.min(a, p.x); b = Math.max(b, p.x + p.w);
            c = Math.min(c, p.z); d = Math.max(d, p.z + p.d);
        });
        return { x0: a, x1: b, z0: c, z1: d, cx: (a + b) / 2, cz: (c + d) / 2 };
    }

    /* ── the scenes ─────────────────────────────────────────────────────── */

    var SCENES = {};

    SCENES.breakfast = function (g, hole, e) {
        var china = mat(0xf4efe2), i;
        // The mug, with coffee in it and a handle.
        var mug = new T.Group();
        put(mug, cyl(3.2, 2.9, 6.4, mat(0x3f7fb5)), 0, 3.2, 0);
        put(mug, cyl(2.9, 2.9, 0.1, mat(0x3a2414)), 0, 6.3, 0);
        var handle = torus(1.7, 0.42, mat(0x3f7fb5), 24);
        handle.rotation.y = Math.PI / 2; put(mug, handle, -3.4, 3.2, 0);
        put(mug, cyl(4.6, 4.2, 0.35, china), 0, -0.2, 0);
        put(g, mug, e.x0 - 8.5, -0.6, e.cz - 2);
        // Steam.
        var steam = specks(40, 0xffffff, 0.5, function (i, p) {
            p.x = e.x0 - 8.5 + Math.sin(i * 2.4) * 1.6; p.y = 6.4 + (i % 10) * 0.5; p.z = e.cz - 2 + Math.cos(i * 1.7) * 1.6;
        }, { opacity: 0.25, plain: true });
        g.add(steam);
        W.movers.push(function (t) { steam.position.y = (t * 0.6) % 0.5; steam.rotation.y = t * 0.1; });
        // A plate with an egg on it, and toast.
        put(g, cyl(6, 5.2, 0.4, china, 40), e.x1 + 9, -0.5, e.cz + 3);
        put(g, ball(3.4, mat(0xfffdf2), 1, 0.08, 0.86), e.x1 + 9, -0.2, e.cz + 3);
        put(g, ball(1.25, mat(0xf5a623), 1, 0.55, 1), e.x1 + 8.4, 0, e.cz + 2.6);
        var toast = box(4.2, 0.6, 4.6, mat(0xc98a3c));
        toast.rotation.set(0.1, 0.5, 0.5); put(g, toast, e.x1 + 5.5, 1.2, e.z0 - 3);
        put(g, box(3.6, 0.5, 4.0, mat(0xf0d9a0)), e.x1 + 5.5, 1.4, e.z0 - 3).rotation.set(0.1, 0.5, 0.5);
        // Sugar cubes, off the edge of everything.
        for (i = 0; i < 5; i++) {
            put(g, box(1.3, 1.3, 1.3, mat(0xffffff)), e.x0 - 4 - (i % 2) * 1.6, -0.2 + (i > 2 ? 1.3 : 0), e.z1 - 2 - i * 0.9).rotation.y = i * 0.7;
        }
        // The knife's blade, running on past the ramp.
        var blade = box(1.2, 0.08, 9, mat(0xd8dde2));
        put(g, blade, 4.5, -0.05, 4);
        blade.visible = false;
    };

    SCENES.turtle = function (g, hole, e) {
        var skin = mat(0x2f6b4a), shell = mat(0x4a3a22, { flat: true });
        var body = new T.Group();
        put(body, ball(7.4, shell, 1, 0.42, 1), 8, -3.3, 12);
        put(body, ball(6.8, mat(0xcdb98a), 1, 0.2, 1), 8, -4.6, 12);
        // The head carries the tee; the neck is under the road.
        put(body, ball(2.0, skin, 1, 0.8, 1.5), 8, -1.5, 1.6);
        put(body, ball(0.28, glow(0x0a0a0a)), 6.9, -0.9, 0.4);
        put(body, ball(0.28, glow(0x0a0a0a)), 9.1, -0.9, 0.4);
        put(body, cyl(1.3, 1.6, 5, skin), 8, -1.9, 4.6).rotation.x = Math.PI / 2;
        put(body, ball(1.0, skin, 0.7, 0.5, 2.2), 8, -3, 20.4);
        g.add(body);
        var flips = [[-1, 6], [1, 6], [-1, 17], [1, 17]].map(function (q, i) {
            var f = ball(3.2, skin, 1.5, 0.16, 0.7);
            var pivot = new T.Group();
            pivot.position.set(8 + q[0] * 6.2, -3.2, q[1]);
            f.position.x = q[0] * 3.4;
            pivot.add(f); g.add(pivot);
            return { p: pivot, s: q[0], k: i };
        });
        W.movers.push(function (t) {
            flips.forEach(function (f) {
                f.p.rotation.z = f.s * (Math.sin(t * 0.7 + f.k * 1.3) * 0.28 - 0.1);
                f.p.rotation.y = Math.sin(t * 0.7 + f.k * 1.3 + 1) * 0.2;
            });
        });
        // A moon and a far sun: somewhere to be swimming between.
        put(g, ball(16, mat(0xd9d2c0, { far: true, flat: true })), -70, 30, 120);
        put(g, ball(5, glow(0xffe9b0, { far: true })), 90, 55, 110);
        put(g, torus(34, 0.5, glow(0x8fb7ff, { far: true, opacity: 0.5 }), 80), -70, 30, 120).rotation.x = 1.25;
    };

    SCENES.gasgiant = function (g, hole, e) {
        var tex = stripes(['#e8b27a', '#c9794a', '#f3d3a4', '#b5623c', '#e0a070', '#8f4a36', '#f0c090'], 14);
        var planet = new T.Mesh(new T.SphereGeometry(190, 48, 32),
            new T.MeshBasicMaterial({ map: tex, fog: false }));
        planet.rotation.z = 0.3;
        put(g, planet, e.cx + 30, -215, e.cz + 60);
        W.movers.push(function (t) { planet.rotation.y = t * 0.01; });
        // The balloons the discs ride on, and their ballast lines.
        hole.pads.forEach(function (p) {
            if (p.inlay) return;
            var r = p.w / 2, cx = p.x + r, cz = p.z + r, y = p.y || 0;
            put(g, ball(r * 0.96, mat(0xb48cf2, { opacity: 0.85 }), 1, 0.55, 1), cx, y - 0.9 - r * 0.5, cz);
            put(g, cyl(0.25, 0.6, 1.2, mat(0x4a2f6e)), cx, y - 1.6 - r, cz);
        });
        // Others, a long way off.
        var rnd = seeded(77), far = [], i;
        for (i = 0; i < 14; i++) {
            var b = ball(2 + rnd() * 3, mat([0xff9ec7, 0xb48cf2, 0x8fe3ff, 0xffe08a][i % 4], { far: true }), 1, 1.2, 1);
            put(g, b, e.cx + (rnd() - 0.5) * 160, -6 + rnd() * 30, e.cz + 30 + rnd() * 110);
            far.push(b);
        }
        W.movers.push(function (t) {
            far.forEach(function (b, k) { b.position.y += Math.sin(t * 0.4 + k) * 0.003; });
        });
        put(g, torus(260, 3, glow(0xffe2b8, { far: true, opacity: 0.35 }), 120), e.cx + 30, -215, e.cz + 60).rotation.x = 1.45;
    };

    SCENES.abyss = function (g, hole, e) {
        var rnd = seeded(5), i, kelp = [];
        for (i = 0; i < 46; i++) {
            var a = rnd() * 6.283, r = 11 + rnd() * 16, h = 4 + rnd() * 9;
            var x = e.cx + Math.sin(a) * r, z = e.cz + Math.cos(a) * r;
            var k = cyl(0.08, 0.22, h, mat(i % 3 ? 0x1f8f5a : 0x2fb07a), 5);
            k.geometry.translate(0, h / 2, 0);
            put(g, k, x, -2.4, z);
            kelp.push(k);
        }
        W.movers.push(function (t) {
            kelp.forEach(function (k, n) {
                k.rotation.z = Math.sin(t * 0.8 + n) * 0.12; k.rotation.x = Math.cos(t * 0.6 + n * 1.7) * 0.1;
            });
        });
        var bub = specks(160, 0xbff6ff, 0.16, function (i, p) {
            p.x = e.cx + (rnd() - 0.5) * 44; p.y = rnd() * 16 - 2; p.z = e.cz + (rnd() - 0.5) * 44;
        }, { opacity: 0.6 });
        g.add(bub);
        W.movers.push(function (t) { bub.position.y = (t * 0.9) % 4; });
        // A whale, going over.
        var whale = new T.Group(), dark = mat(0x0b2c3a);
        whale.add(ball(3, dark, 1, 0.8, 3.2));
        put(whale, ball(1.4, dark, 2.6, 0.12, 0.8), 0, 0.2, -9.6);
        put(whale, ball(1.2, dark, 2.2, 0.1, 0.7), 3, -1, 2).rotation.z = -0.5;
        put(whale, ball(1.2, dark, 2.2, 0.1, 0.7), -3, -1, 2).rotation.z = 0.5;
        g.add(whale);
        W.movers.push(function (t) {
            var a = t * 0.07;
            whale.position.set(e.cx + Math.sin(a) * 30, 14 + Math.sin(t * 0.3) * 1.2, e.cz + Math.cos(a) * 30);
            whale.rotation.y = a + Math.PI / 2;
            whale.rotation.x = Math.sin(t * 0.3) * 0.08;
        });
        // Vents, glowing.
        for (i = 0; i < 6; i++) {
            put(g, cyl(0.5, 1.2, 3 + i % 3, mat(0x12303a, { emissive: 0x04202a })), e.x0 - 6 - (i % 2) * 3, -1.4, e.z0 + i * 3.4);
            put(g, ball(0.4, glow(0x7dfce0, { opacity: 0.8 })), e.x0 - 6 - (i % 2) * 3, 0.4 + (i % 3) * 0.5, e.z0 + i * 3.4);
        }
    };

    SCENES.carnival = function (g, hole, e) {
        // The big wheel.
        var wheel = new T.Group(), i, R = 8, iron = mat(0xd9dbe6), rnd = seeded(3);
        wheel.add(torus(R, 0.16, iron, 64));
        wheel.add(torus(R * 0.55, 0.1, iron, 48));
        var cars = [];
        for (i = 0; i < 12; i++) {
            var a = i / 12 * 6.283;
            var spoke = box(0.1, R, 0.1, iron);
            spoke.position.set(Math.sin(a) * R / 2, Math.cos(a) * R / 2, 0); spoke.rotation.z = -a;
            wheel.add(spoke);
            var car = box(1.1, 1.1, 1.1, mat([0xff5a7a, 0xffd166, 0x5ad1ff, 0x9bff8a][i % 4], { emissive: 0x221108 }));
            car.position.set(Math.sin(a) * R, Math.cos(a) * R - 0.8, 0);
            wheel.add(car); cars.push(car);
            wheel.add(put(new T.Group(), ball(0.14, glow(0xfff2b0)), Math.sin(a) * R, Math.cos(a) * R, 0.2).parent);
        }
        wheel.rotation.y = 0.9;
        put(g, wheel, e.x1 + 10, R + 1.2, e.cz + 5);
        put(g, box(0.5, R + 1.2, 0.5, iron), e.x1 + 10, (R + 1.2) / 2, e.cz + 5).rotation.z = 0.25;
        put(g, box(0.5, R + 1.2, 0.5, iron), e.x1 + 10, (R + 1.2) / 2, e.cz + 5).rotation.z = -0.25;
        W.movers.push(function (t) {
            wheel.rotation.z = t * 0.12;
            cars.forEach(function (c) { c.rotation.z = -wheel.rotation.z; });
        });
        // Tents, striped.
        var tex = stripes(['#e63946', '#f8f4e3'], 12, true);
        [[e.x0 - 7, e.z0 + 4, 3], [e.x0 - 9, e.cz + 3, 4], [e.x1 + 7, e.z0 + 2, 3.2], [e.cx - 2, e.z1 + 8, 4.5]].forEach(function (q) {
            put(g, cyl(q[2], q[2], q[2] * 0.9, new T.MeshLambertMaterial({ map: tex })), q[0], q[2] * 0.45 - 1, q[1]);
            put(g, new T.Mesh(new T.ConeGeometry(q[2] * 1.15, q[2] * 0.9, 24), new T.MeshLambertMaterial({ map: tex })), q[0], q[2] * 1.35 - 1, q[1]);
            put(g, ball(0.2, glow(0xffd166)), q[0], q[2] * 1.9 - 1, q[1]);
        });
        // Lamps on a string, round the rink.
        g.add(specks(90, 0xffe29a, 0.3, function (i, p) {
            var a = i / 90 * 6.283;
            p.x = e.cx + Math.sin(a) * (e.x1 - e.x0) * 0.72; p.z = e.cz + 3 + Math.cos(a) * (e.z1 - e.z0) * 0.62;
            p.y = 2.6 + Math.sin(i * 0.9) * 0.35;
        }));
        g.add(specks(200, 0xffffff, 0.09, function (i, p) {
            p.x = e.cx + (rnd() - 0.5) * 50; p.y = rnd() * 14; p.z = e.cz + (rnd() - 0.5) * 50;
        }, { opacity: 0.7 }));
    };

    SCENES.mushroom = function (g, hole, e) {
        var rnd = seeded(11), i, caps = [0xd63a3a, 0xe0792b, 0x9a4fd1, 0xd63a3a];
        function shroom(x, z, h, r, c) {
            put(g, cyl(r * 0.22, r * 0.34, h, mat(0xefe6cf)), x, h / 2 - 1.4, z);
            var cap = new T.Mesh(new T.SphereGeometry(r, 24, 12, 0, 6.283, 0, Math.PI / 2), mat(c, { emissive: 0x220606 }));
            cap.scale.y = 0.62; put(g, cap, x, h - 1.4, z);
            put(g, cyl(r, r, 0.1, mat(0xf3ead6)), x, h - 1.4, z);
            for (var k = 0; k < 7; k++) {
                var a = k * 0.9 + x, d = r * (0.25 + (k % 3) * 0.22);
                put(g, ball(r * 0.09, mat(0xffffff)), x + Math.sin(a) * d, h - 1.4 + r * 0.62 * Math.sqrt(Math.max(0, 1 - d * d / (r * r))), z + Math.cos(a) * d);
            }
        }
        for (i = 0; i < 16; i++) {
            var a = i / 16 * 6.283 + rnd() * 0.2, d = 14 + rnd() * 9;
            shroom(e.cx + Math.sin(a) * d, e.cz + Math.cos(a) * d * 1.05, 5 + rnd() * 9, 2.4 + rnd() * 3, caps[i % 4]);
        }
        // Little caps on the ring itself, over each bumper.
        hole.walls.forEach(function (w) {
            if (w.kind !== 'bumper') return;
            var cap = new T.Mesh(new T.SphereGeometry(0.5, 16, 8, 0, 6.283, 0, Math.PI / 2), mat(0xd63a3a, { emissive: 0x330808 }));
            cap.scale.y = 0.6; put(g, cap, w.x + w.w / 2, (w.base || 0) + w.h - 0.02, w.z + w.d / 2);
        });
        var sp = specks(220, 0xc8ff9a, 0.14, function (i, p) {
            p.x = e.cx + (rnd() - 0.5) * 46; p.y = rnd() * 9; p.z = e.cz + (rnd() - 0.5) * 46;
        }, { opacity: 0.7 });
        g.add(sp);
        W.movers.push(function (t) { sp.position.y = Math.sin(t * 0.25) * 0.5; sp.rotation.y = t * 0.02; });
    };

    SCENES.orrery = function (g, hole, e) {
        var brass = mat(0xc9973a, { emissive: 0x2a1c06 }), i;
        put(g, cyl(0.5, 0.7, 4.6, brass), e.cx, 2.5, e.cz);
        put(g, ball(1.1, glow(0xffd98a)), e.cx, 5.3, e.cz);
        put(g, ball(1.5, glow(0xffb347, { opacity: 0.25, add: true })), e.cx, 5.3, e.cz);
        var rings = [];
        [[14, 0.4, 0.5, 0x7fb7ff, 0.9], [19, -0.3, 0.3, 0xff8a6a, 1.3], [25, 0.7, 0.18, 0xe8d9a8, 2.1], [31, -0.55, 0.1, 0x9be0c0, 1.6]].forEach(function (q, k) {
            var grp = new T.Group();
            var t = torus(q[0], 0.09, brass, 96); t.rotation.x = Math.PI / 2; grp.add(t);
            var planet = ball(q[4], mat(q[3], { flat: k === 2 })); planet.position.set(q[0], 0, 0); grp.add(planet);
            if (k === 2) { var rr = torus(q[4] * 1.7, 0.12, mat(0xd9c9a0)); rr.rotation.x = 1.2; rr.position.set(q[0], 0, 0); grp.add(rr); }
            grp.rotation.z = q[1];
            put(g, grp, e.cx, 11 + k * 2.5, e.cz);
            rings.push({ g: grp, s: q[2] });
        });
        W.movers.push(function (t) { rings.forEach(function (r) { r.g.rotation.y = t * r.s; }); });
        // The cabinet it stands in: books and a globe, out past the table.
        for (i = 0; i < 10; i++) {
            var a = i / 10 * 6.283 + 0.3;
            put(g, box(2.2, 6 + (i % 3) * 2, 2.2, mat([0x5a2a22, 0x23405a, 0x3a4a2a][i % 3])), e.cx + Math.sin(a) * 24, 0, e.cz + Math.cos(a) * 24).rotation.y = a;
        }
    };

    SCENES.stairs = function (g, hole, e) {
        var stone = mat(0xc9c5b8), dark = mat(0x8a877c), i, k;
        function flight(x, y, z, n, ry, rz) {
            var f = new T.Group();
            for (k = 0; k < n; k++) put(f, box(3, 0.5, 1), 0, k * 0.5, k * 1).material = k % 2 ? stone : dark;
            put(f, box(0.2, 1.2, n), 1.6, n * 0.25 + 0.6, n / 2 - 0.5).rotation.x = -Math.atan(0.5);
            f.rotation.set(0, ry, rz);
            put(g, f, x, y, z);
            return f;
        }
        flight(e.x0 - 10, -4, e.z0, 12, 0.3, 0);
        flight(e.x1 + 8, 6, e.z0 + 4, 12, 2.2, Math.PI);
        flight(e.cx - 4, 10, e.z1 + 10, 14, 1.4, Math.PI / 2);
        flight(e.x1 + 12, -6, e.z1 - 2, 10, -0.8, -Math.PI / 2);
        flight(e.x0 - 14, 8, e.z1 + 2, 12, 2.9, Math.PI);
        flight(e.cx + 3, -9, e.cz, 16, 0.9, 0.0);
        // Arches and a tower of landings.
        for (i = 0; i < 5; i++) {
            var arch = new T.Group();
            put(arch, box(0.8, 5, 0.8, stone), -1.6, 2.5, 0); put(arch, box(0.8, 5, 0.8, stone), 1.6, 2.5, 0);
            var top = torus(1.6, 0.4, stone, 24); top.geometry = new T.TorusGeometry(1.6, 0.4, 8, 24, Math.PI); put(arch, top, 0, 5, 0);
            arch.rotation.set(i * 1.3, i * 0.9, i * 2.1);
            put(g, arch, e.cx + Math.sin(i * 1.4) * 22, 3 + Math.cos(i * 2.2) * 8, e.cz + Math.cos(i * 1.4) * 22);
        }
        // Under each landing, the column that says which way it thinks is down.
        hole.pads.forEach(function (p, n) {
            if (p.kind !== 'green') return;
            var c = box(1.2, 14, 1.2, dark);
            put(g, c, p.x + p.w / 2, (p.y || 0) - 7.5, p.z + p.d / 2);
        });
    };

    SCENES.attic = function (g, hole, e) {
        var cols = [0xd64541, 0xf5b041, 0x3f8fd1, 0x5bb75b], i, rnd = seeded(9);
        for (i = 0; i < 14; i++) {
            var s = 1.6 + rnd() * 1.8, a = rnd() * 6.283, d = 13 + rnd() * 8;
            var x = e.cx + Math.sin(a) * d, z = e.cz + Math.cos(a) * d;
            if (x > e.x0 - 3 && x < e.x1 + 3 && z > e.z0 - 3 && z < e.z1 + 3) continue;
            put(g, box(s, s, s, mat(cols[i % 4])), x, s / 2 - 1.6, z).rotation.y = rnd() * 3;
            if (i % 3 === 0) put(g, box(s * 0.8, s * 0.8, s * 0.8, mat(cols[(i + 1) % 4])), x + 0.2, s * 1.4 - 1.6, z).rotation.y = rnd() * 3;
        }
        // A spinning top.
        var top = new T.Group();
        put(top, new T.Mesh(new T.ConeGeometry(2.2, 3, 24), mat(0xd64541)), 0, 1.5, 0).rotation.x = Math.PI;
        put(top, cyl(2.2, 2.2, 0.5, mat(0xf5b041)), 0, 3.2, 0);
        put(top, cyl(0.2, 0.2, 2, mat(0x8a5f38)), 0, 4.4, 0);
        put(g, top, e.x0 - 7, -1.6, e.z1 - 3);
        W.movers.push(function (t) { top.rotation.y = t * 6; top.rotation.z = Math.sin(t * 1.1) * 0.12; top.rotation.x = Math.cos(t * 1.1) * 0.12; });
        // Rafters, and the dust in the light from the window.
        for (i = 0; i < 6; i++) {
            put(g, box(60, 0.8, 0.8, mat(0x4a2f1c)), e.cx, 15, e.z0 - 10 + i * 9);
        }
        put(g, box(0.8, 0.8, 70, mat(0x4a2f1c)), e.cx, 15.8, e.cz);
        var pane = new T.Mesh(new T.PlaneGeometry(10, 10), glow(0xffe2a8, { far: true, opacity: 0.85 }));
        pane.rotation.y = Math.PI / 2; put(g, pane, e.x0 - 30, 9, e.cz);
        put(g, box(0.3, 10, 0.5, mat(0x4a2f1c)), e.x0 - 29.8, 9, e.cz);
        put(g, box(0.3, 0.5, 10, mat(0x4a2f1c)), e.x0 - 29.8, 9, e.cz);
    };

    SCENES.threebody = function (g, hole, e) {
        // Three stars a long way overhead, falling round one another.
        var suns = [0xffb347, 0xff5a7a, 0x8fb7ff].map(function (c) {
            var s = ball(2.2, glow(c, { far: true }));
            s.add(ball(3.6, glow(c, { far: true, opacity: 0.22, add: true })));
            g.add(s); return s;
        });
        W.movers.push(function (t) {
            suns.forEach(function (s, k) {
                var a = t * 0.15 + k * 2.094, r = 26 + Math.sin(t * 0.21 + k * 1.3) * 10;
                s.position.set(e.cx + Math.sin(a) * r, 34 + Math.sin(t * 0.17 + k) * 6, e.cz + 40 + Math.cos(a) * r);
            });
        });
    };

    SCENES.clouds = function (g, hole, e) {
        var white = mat(0xffffff, { emissive: 0x30323a }), rnd = seeded(21), i, k;
        function cloud(x, y, z, s, m) {
            var c = new T.Group();
            for (k = 0; k < 7; k++) {
                put(c, ball(s * (0.5 + rnd() * 0.5), m || white, 1, 0.7, 1), (rnd() - 0.5) * s * 2.4, (rnd() - 0.5) * s * 0.4, (rnd() - 0.5) * s * 1.6);
            }
            put(g, c, x, y, z); return c;
        }
        // What each landing is standing on.
        hole.pads.forEach(function (p) {
            if (p.inlay) return;
            var r = p.w / 2;
            cloud(p.x + r, (p.y || 0) - 1.9 - r * 0.25, p.z + r, r * 0.95);
        });
        var far = [], farM = mat(0xffffff, { far: true, emissive: 0x40424a });
        for (i = 0; i < 22; i++) {
            far.push(cloud(e.cx + (rnd() - 0.5) * 170, -14 + rnd() * 26, e.cz + (rnd() - 0.2) * 150, 4 + rnd() * 7, farM));
        }
        W.movers.push(function (t) { far.forEach(function (c, n) { c.position.x += 0.004 * (1 + n % 3); if (c.position.x > e.cx + 90) c.position.x -= 180; }); });
        // Kites.
        var kites = [0xff5a7a, 0xffd166, 0x5ad1ff].map(function (c, n) {
            var kt = new T.Mesh(new T.PlaneGeometry(1.6, 2.2), mat(c, { side: true, emissive: 0x221111 }));
            kt.rotation.z = Math.PI / 4; g.add(kt); return kt;
        });
        W.movers.push(function (t) {
            kites.forEach(function (kt, n) {
                kt.position.set(e.x0 - 12 + n * 16 + Math.sin(t * 0.6 + n * 2) * 3, 9 + n * 2 + Math.sin(t * 0.9 + n) * 1.5, e.cz + 8 + n * 7);
                kt.rotation.y = Math.sin(t * 0.7 + n) * 0.5;
            });
        });
    };

    SCENES.forge = function (g, hole, e) {
        var iron = mat(0x2a2a30, { flat: true }), hot = glow(0xff7a1a), i, rnd = seeded(31);
        // The big hammer, off to one side, keeping time.
        var arm = new T.Group();
        put(arm, box(1.2, 1.2, 14, mat(0x5a3a22)), 0, 0, 7);
        put(arm, box(4.5, 4.5, 6, iron), 0, 0, 15);
        put(g, arm, e.x1 + 9, 3, e.z0 - 2);
        put(g, box(3, 6, 3, iron), e.x1 + 9, 0, e.z0 - 2);
        put(g, box(6, 2.4, 5, iron), e.x1 + 9, -1.2, e.z0 + 13);
        put(g, box(4, 0.3, 3.4, hot), e.x1 + 9, 0.1, e.z0 + 13);
        W.movers.push(function (t) {
            var s = (t * 0.55) % 1;
            arm.rotation.x = -(s < 0.8 ? s / 0.8 * 0.7 : (1 - s) / 0.2 * 0.7);
        });
        // Stacks, and what comes out of them.
        for (i = 0; i < 5; i++) {
            var h = 9 + (i % 3) * 5, x = e.x0 - 9 - (i % 2) * 5, z = e.z0 + i * 8;
            put(g, cyl(1.1, 1.6, h, iron, 10), x, h / 2 - 2, z);
            put(g, cyl(1.0, 1.0, 0.3, hot, 10), x, h - 2.1, z);
        }
        var sparks = specks(180, 0xffb347, 0.14, function (i, p) {
            p.x = e.cx + (rnd() - 0.5) * 40; p.y = rnd() * 12 - 1; p.z = e.cz + (rnd() - 0.5) * 50;
        });
        g.add(sparks);
        W.movers.push(function (t) { sparks.position.y = (t * 1.4) % 3; });
        // A crucible, pouring.
        put(g, cyl(2.4, 1.6, 3, iron, 12), e.x0 - 5, 4.2, e.z0 + 22).rotation.z = -0.7;
        put(g, cyl(0.3, 0.3, 5.5, hot, 8), e.x0 - 2.9, 0.8, e.z0 + 22);
        var light = new T.PointLight(0xff6a20, 0.9, 40);
        put(g, light, e.cx, 1.5, e.z0 + 22);
    };

    /* ── build and step ─────────────────────────────────────────────────── */

    W.tex = [];

    function build(g, hole) {
        T = window.THREE;
        W.movers = [];
        W.tex.forEach(function (t) { t.dispose(); });
        W.tex = [];
        if (!hole.portal || !T) return;
        var scene = SCENES[hole.scene];
        if (scene) scene(g, hole, extent(hole));
    }

    function step(dt, t) {
        for (var i = 0; i < W.movers.length; i++) W.movers[i](t, dt);
    }

    // The canyon hole stands in the same forge.
    SCENES.ironriver = SCENES.forge;
    SCENES.nave = SCENES.abyss;

    G3.worlds = { build: build, step: step, SCENES: SCENES, state: W };

})(window.G3);
