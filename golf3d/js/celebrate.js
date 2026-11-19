/* Hole-in celebrations: what goes off over the cup when the ball drops.

   The third shelf of the Pro Shop (the catalog is `G3.CELEBRATIONS` in
   balls.js; this file is how each one moves). Pure — no DOM, no three.js —
   so the same simulation drives the 3D effect over the cup (render.js →
   celebrate), the animated preview and the card thumbnails in the shop
   (game.js → drawCeleFrame) and the tests.

   An effect is a little particle script. `start(id, rnd)` hands back an `fx`
   whose positions are in units relative to the cup's lip (y up), and `step(fx,
   dt)` moves it on and fills each particle's drawn values: `ox oy oz` where it
   is, `or og ob` its colour, `oa` its opacity, `os` its size, and `add`
   whether it is light (drawn additively) or matter (paper, drawn over).
   Rings lie flat on the green and a beam stands over the cup; both carry
   their drawn radius / height and opacity the same way.

   Nothing here may cost the game a compile or a light (CLAUDE.md, "The number
   of lights in the scene must never change"): an effect is points, rings and
   one beam, drawn by meshes render.js builds once and warms with the hole. */
window.G3 = window.G3 || {};
(function (G3) {
    'use strict';

    var TAU = Math.PI * 2;

    function hex(n) { return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]; }

    // A tiny seeded generator, so a thumbnail draws the same every time.
    function seeded(seed) {
        var s = (seed >>> 0) || 1;
        return function () {
            s ^= s << 13; s >>>= 0;
            s ^= s >> 17;
            s ^= s << 5; s >>>= 0;
            return s / 4294967296;
        };
    }

    function pick(rnd, list) { return list[Math.floor(rnd() * list.length) % list.length]; }

    // A unit vector, evenly over the sphere (or over its upper half).
    function dir(rnd, upper) {
        var y = upper ? rnd() : rnd() * 2 - 1;
        var a = rnd() * TAU, r = Math.sqrt(Math.max(0, 1 - y * y));
        return [Math.cos(a) * r, y, Math.sin(a) * r];
    }

    function part(fx, o) {
        var p = {
            mode: o.mode || 0,            // 0 thrown, 1 a helix, 2 pulled in
            x: o.x || 0, y: o.y || 0, z: o.z || 0,
            vx: o.vx || 0, vy: o.vy || 0, vz: o.vz || 0,
            grav: o.grav === undefined ? 9 : o.grav,
            drag: o.drag || 0,
            age: 0, life: o.life || 1,
            c0: o.c, c1: o.c1 || null,
            size: o.size || 0.16,
            add: o.add === undefined ? true : o.add,
            flut: o.flut || 0,            // paper: turns over as it falls
            flick: o.flick || 0,          // glitter: blinks as it fades
            grow: o.grow || 0,            // a flash: swells as it fades
            ph: o.ph === undefined ? fx.rnd() * TAU : o.ph,
            land: !!o.land,               // rests on the green rather than falling through it
            // helix and pull
            ang: o.ang || 0, rad: o.rad || 0, angV: o.angV || 0, radV: o.radV || 0,
            cy: o.cy || 0, rad0: o.rad || 0, y0: o.y || 0,
            // a rocket bursts at `boom` into `shell`
            boom: o.boom || 0, shell: o.shell || null, trail: o.trail || null,
            ox: 0, oy: 0, oz: 0, or: 0, og: 0, ob: 0, oa: 0, os: 0
        };
        fx.parts.push(p);
        return p;
    }

    function ring(fx, o) {
        fx.rings.push({ age: -(o.delay || 0), dur: o.dur || 0.8, r0: o.r0 || 0.1, r1: o.r1 || 4,
            c: o.c, a0: o.a === undefined ? 1 : o.a, y: o.y || 0.03, or: 0, oa: 0 });
    }

    function beam(fx, o) {
        fx.beams.push({ age: -(o.delay || 0), dur: o.dur || 1.5, h: o.h || 6, r: o.r || 0.3, c: o.c,
            a0: o.a === undefined ? 1 : o.a, oh: 0, or: 0, oa: 0 });
    }

    /* A ripple through space: a lens (postfx) that runs out from the middle
       and weakens as it goes. Only the game draws it; the shop cannot bend
       its picture. */
    function lens(fx, o) {
        fx.lenses.push({ age: -(o.delay || 0), dur: o.dur || 0.8, y: o.y || 1, r0: o.r0 || 0.3, r1: o.r1 || 4,
            k0: o.k === undefined ? 0.5 : o.k, or: 0, ok: 0 });
    }

    function smooth(x) { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); }

    // Did the moment `at` fall inside this step?
    function at(fx, t) { return t > fx.t0 && t <= fx.t; }
    // How many of a stream at `rate` a second fall inside this step, between `from` and `to`.
    function stream(fx, from, to, rate) {
        var a = Math.max(fx.t0, from), b = Math.min(fx.t, to);
        if (b <= a) return 0;
        fx.acc += (b - a) * rate;
        var n = Math.floor(fx.acc);
        fx.acc -= n;
        return n;
    }

    function burstOf(fx, n, o) {
        var rnd = fx.rnd;
        for (var i = 0; i < n; i++) {
            var d = dir(rnd, o.upper), sp = o.speed * (o.even ? 0.85 + rnd() * 0.15 : 0.35 + rnd() * 0.65);
            part(fx, {
                x: o.x || 0, y: o.y || 0, z: o.z || 0,
                vx: d[0] * sp * (o.flat || 1), vy: d[1] * sp + (o.lift || 0), vz: d[2] * sp * (o.flat || 1),
                grav: o.grav, drag: o.drag,
                life: o.life * (0.7 + rnd() * 0.5),
                c: typeof o.c === 'function' ? o.c(i) : o.c, c1: o.c1,
                size: o.size * (0.7 + rnd() * 0.6), flick: o.flick, add: o.add, land: o.land
            });
        }
    }

    var GOLD = hex(0xffd36a), WHITE = hex(0xfff8e8), BRASS = hex(0xc9a352);

    /* Each script is called once a step with fx.t0 < fx.t; `at` and `stream`
       turn that window into "now" and "this many". */
    var SCRIPTS = {
        'cele-classic': {
            peek: 0.32,
            dur: 1.4,
            run: function (fx) {
                if (at(fx, 0)) {
                    burstOf(fx, 46, { upper: true, speed: 5, lift: 3, grav: 9, drag: 0.6, life: 1.1, c: GOLD, c1: hex(0xff9a3c), size: 0.2, flick: 1 });
                    burstOf(fx, 14, { upper: true, speed: 3, lift: 1, grav: 9, drag: 0.6, life: 0.8, c: WHITE, size: 0.16 });
                    ring(fx, { r0: 0.2, r1: 1.8, dur: 0.6, c: GOLD, a: 0.8 });
                }
            }
        },

        'cele-confetti': {
            peek: 0.9,
            dur: 3.6,
            run: function (fx) {
                var rnd = fx.rnd;
                var pal = [0xff4d6d, 0xffd23f, 0x3ec1ff, 0x7be067, 0xb57bff, 0xff8a3d, 0xffffff].map(hex);
                [0, 0.16, 0.32].forEach(function (t, k) {
                    if (!at(fx, t)) return;
                    for (var i = 0; i < 56; i++) {
                        var a = rnd() * TAU, s = 1 + rnd() * 2.6;
                        part(fx, {
                            vx: Math.cos(a) * s, vz: Math.sin(a) * s, vy: 9 + rnd() * 5 - k,
                            grav: 6, drag: 2, life: 2.6 + rnd() * 1, c: pick(rnd, pal),
                            size: 0.2 + rnd() * 0.08, add: false, flut: 1, land: true
                        });
                    }
                    if (k === 0) burstOf(fx, 18, { upper: true, speed: 3.5, grav: 6, drag: 1, life: 0.5, c: WHITE, size: 0.18 });
                });
            }
        },

        'cele-geyser': {
            peek: 0.85,
            dur: 2.6,
            run: function (fx) {
                var rnd = fx.rnd, n = stream(fx, 0, 1.1, 240), i;
                var drop = function () { return rnd() < 0.3 ? hex(0xffffff) : rnd() < 0.5 ? hex(0x9fe2ff) : hex(0x4fb6ff); };
                for (i = 0; i < n; i++) {
                    var a = rnd() * TAU, r = rnd() * 0.12, s = 0.25 + rnd() * 0.5;
                    part(fx, {
                        x: Math.cos(a) * r, z: Math.sin(a) * r,
                        vx: Math.cos(a) * s, vz: Math.sin(a) * s, vy: 9.5 + rnd() * 2.8,
                        grav: 12, drag: 0.15, life: 1.6 + rnd() * 0.5, c: drop(), size: 0.15 + rnd() * 0.08, land: true
                    });
                }
                if (at(fx, 0)) {
                    burstOf(fx, 50, { upper: true, flat: 1.6, speed: 3.4, lift: 1.4, grav: 10, drag: 0.4, life: 0.9, c: hex(0xbfeaff), size: 0.16, land: true });
                    ring(fx, { r0: 0.2, r1: 3.2, dur: 0.9, c: hex(0x7fd0ff), a: 0.9 });
                    beam(fx, { h: 5, r: 0.28, dur: 1.4, c: hex(0x5fc4ff), a: 0.45 });
                }
                if (at(fx, 0.55)) ring(fx, { r0: 0.2, r1: 2.4, dur: 0.8, c: hex(0xbfeaff), a: 0.6 });
                if (at(fx, 1.25)) burstOf(fx, 40, { upper: true, flat: 1.4, speed: 2.4, grav: 10, drag: 0.4, life: 0.7, c: hex(0xffffff), size: 0.14, land: true });
            }
        },

        'cele-shockwave': {
            peek: 0.32,
            dur: 1.8,
            run: function (fx) {
                if (at(fx, 0)) {
                    part(fx, { y: 0.3, grav: 0, life: 0.3, c: hex(0xfff2c4), size: 2.6, grow: 1.6 });
                    ring(fx, { r0: 0.2, r1: 6.5, dur: 0.9, c: hex(0xffcf6a), a: 1 });
                    lens(fx, { y: 0.4, r0: 0.3, r1: 3.5, k: 0.4, dur: 0.6 });
                    ring(fx, { r0: 0.2, r1: 4.2, dur: 0.8, c: BRASS, a: 0.8, delay: 0.16 });
                    ring(fx, { r0: 0.2, r1: 2.4, dur: 0.7, c: WHITE, a: 0.6, delay: 0.3 });
                    burstOf(fx, 80, { upper: true, flat: 1, speed: 7.5, lift: 0.2, grav: 4, drag: 2.2, life: 0.9, c: hex(0xffe08a), c1: hex(0xff7a2a), size: 0.17, even: true, land: true });
                    burstOf(fx, 34, { upper: true, speed: 3, lift: 6, grav: 9, drag: 0.4, life: 1.2, c: GOLD, size: 0.2, flick: 1 });
                    // Dust thrown off the green with it.
                    burstOf(fx, 40, { upper: true, flat: 1, speed: 4, lift: 0.6, grav: 3, drag: 2.6, life: 1.1, c: hex(0xc9b48a), size: 0.3, add: false, land: true });
                }
            }
        },

        'cele-fireworks': {
            peek: 1.3,
            dur: 3.4,
            run: function (fx) {
                var rnd = fx.rnd;
                var shells = [0xff4d5e, 0xffd447, 0x45d0ff, 0x7dff8a, 0xff6ee7, 0xffffff].map(hex);
                [[0, -0.9], [0.32, 0.9], [0.62, 0.1]].forEach(function (k) {
                    if (!at(fx, k[0])) return;
                    var c = pick(rnd, shells);
                    part(fx, {
                        y: 0.1, vx: k[1] + (rnd() - 0.5) * 0.4, vz: (rnd() - 0.5) * 1.2, vy: 7 + rnd() * 0.7,
                        grav: 4, life: 0.72 + rnd() * 0.12, c: hex(0xffe2a8), size: 0.24,
                        boom: 1, shell: c, trail: hex(0xffb056)
                    });
                });
                if (at(fx, 0)) burstOf(fx, 20, { upper: true, speed: 2.5, grav: 8, drag: 1, life: 0.5, c: hex(0xffe2a8), size: 0.16 });
            }
        },

        'cele-ember': {
            peek: 1.25,
            dur: 2.6,
            run: function (fx) {
                var rnd = fx.rnd, n = stream(fx, 0, 1.6, 190), i;
                for (i = 0; i < n; i++) {
                    var hot = rnd();
                    part(fx, {
                        mode: 1, ang: rnd() * TAU, rad: 0.15 + rnd() * 0.35, radV: 0.45 + rnd() * 0.5,
                        angV: 6 + rnd() * 3, y: 0, vy: 2.4 + rnd() * 1.6,
                        life: 1.3 + rnd() * 0.6,
                        c: hot < 0.3 ? hex(0xfff0a0) : hex(0xffa53a), c1: hex(0xc4200a),
                        size: 0.16 + rnd() * 0.12, flick: rnd() < 0.3 ? 1 : 0
                    });
                }
                if (at(fx, 0)) {
                    ring(fx, { r0: 0.2, r1: 2.8, dur: 0.8, c: hex(0xff8a2a), a: 0.9 });
                    beam(fx, { h: 6, r: 0.42, dur: 2, c: hex(0xff6a1a), a: 0.55 });
                }
                if (at(fx, 1.55)) {
                    burstOf(fx, 70, { y: 4.4, speed: 3.8, grav: 2.5, drag: 1.2, life: 1.1, c: hex(0xffd36a), c1: hex(0xd8300c), size: 0.2, flick: 1 });
                    part(fx, { y: 4.4, grav: 0, life: 0.3, c: hex(0xffc070), size: 2, grow: 1.4 });
                }
            }
        },

        'cele-supernova': {
            peek: 0.5,
            dur: 2.8,
            run: function (fx) {
                var rnd = fx.rnd, n, i;
                if (at(fx, 0)) {
                    part(fx, { y: 1.6, grav: 0, life: 0.4, c: hex(0xffffff), size: 4, grow: 1.8 });
                    beam(fx, { h: 10, r: 0.32, dur: 2.1, c: hex(0xbfe8ff), a: 0.75 });
                    burstOf(fx, 170, { y: 1.6, speed: 5.6, even: true, grav: 0.8, drag: 1.7, life: 1.8,
                        c: function (k) { return k % 2 ? hex(0x9fe9ff) : hex(0xffd36a); }, size: 0.2 });
                    ring(fx, { r0: 0.3, r1: 7.5, dur: 0.9, c: hex(0x9fe9ff), a: 1 });
                    lens(fx, { y: 1.6, r0: 0.3, r1: 4.5, k: 0.55, dur: 0.8 });
                    ring(fx, { r0: 0.3, r1: 5.5, dur: 0.9, c: hex(0xffd36a), a: 0.8, delay: 0.22 });
                }
                n = stream(fx, 0.25, 1.7, 70);
                for (i = 0; i < n; i++) {
                    var d = dir(rnd), r = 1 + rnd() * 2.2;
                    part(fx, { x: d[0] * r, y: Math.max(0.15, 1.6 + d[1] * r), z: d[2] * r, grav: 0, life: 0.35, c: hex(0xffffff), size: 0.22, flick: 1 });
                }
            }
        },

        /* A real black hole (render.js draws fx.hole with the game's own
           black-hole shader, the one the pipes open in the sky, and bends the
           picture round it through postfx's lens): it opens over the cup,
           eats a spiral of light, flares, shuts — and lets it all go, with a
           ripple through space on the way out. */
        'cele-singularity': {
            peek: 1.05,
            dur: 3.6,
            run: function (fx) {
                var rnd = fx.rnd, n, i, CY = 2, SHUT = 1.45, t = fx.t;
                if (t < SHUT + 0.14) {
                    var op = t < SHUT ? smooth(t / 0.55) : 1 - smooth((t - SHUT) / 0.14);
                    fx.hole = { y: CY, size: 2.4, open: Math.max(0.01, op),
                        gulp: smooth((t - 0.9) / 0.5), k: 0.95 * op };
                } else fx.hole = null;
                // Light dragged in from all round, every strand timed to reach the middle as it shuts.
                n = stream(fx, 0.05, SHUT - 0.2, 240);
                for (i = 0; i < n; i++) {
                    part(fx, {
                        mode: 2, ang: rnd() * TAU, rad: 2.8 + rnd() * 1.6, angV: 2.5 + rnd() * 2, cy: CY,
                        y: CY + (rnd() - 0.5) * 1.6, life: Math.max(0.25, SHUT - t),
                        c: rnd() < 0.5 ? hex(0xb27bff) : hex(0x5fa8ff), c1: hex(0xffe6b0), size: 0.19
                    });
                }
                if (at(fx, 0)) ring(fx, { r0: 4.5, r1: 0.4, dur: SHUT, c: hex(0x6a4dff), a: 0.6 });
                if (at(fx, SHUT + 0.1)) {
                    part(fx, { y: CY, grav: 0, life: 0.5, c: hex(0xffffff), size: 5, grow: 1.6 });
                    burstOf(fx, 220, { y: CY, speed: 7.2, even: true, grav: 1, drag: 1.6, life: 1.8,
                        c: function (k) { return k % 3 === 0 ? hex(0xffc44d) : hex(0xb27bff); }, c1: hex(0x3a1a8a), size: 0.22 });
                    ring(fx, { r0: 0.3, r1: 8.5, dur: 1, c: hex(0xb27bff), a: 1 });
                    ring(fx, { r0: 0.3, r1: 5.5, dur: 0.9, c: hex(0xffc44d), a: 0.8, delay: 0.15 });
                    beam(fx, { h: 10, r: 0.32, dur: 1.6, c: hex(0x9a6bff), a: 0.75 });
                    lens(fx, { y: CY, r0: 0.4, r1: 5, k: 0.7, dur: 0.9 });
                }
            }
        }
    };

    function start(id, rnd) {
        var s = SCRIPTS[id] || SCRIPTS['cele-classic'];
        return {
            id: SCRIPTS[id] ? id : 'cele-classic', script: s,
            t: -1e-6, t0: -1e-6, acc: 0, rnd: rnd || Math.random,
            parts: [], rings: [], beams: [], lenses: [], hole: null, done: false
        };
    }

    function stepPart(fx, p, dt) {
        p.age += dt;
        if (p.mode === 1) {
            p.ang += p.angV * dt;
            p.rad += p.radV * dt;
            p.y += p.vy * dt;
            p.x = Math.cos(p.ang) * p.rad;
            p.z = Math.sin(p.ang) * p.rad;
        } else if (p.mode === 2) {
            var u = Math.min(1, p.age / p.life), k = 1 - u;
            var rr = p.rad0 * k * k;
            p.ang += p.angV * dt * (1 + 5 * u);
            p.x = Math.cos(p.ang) * rr;
            p.z = Math.sin(p.ang) * rr;
            p.y = p.cy + (p.y0 - p.cy) * k * k;
            p.pull = rr;
        } else {
            p.vy -= p.grav * dt;
            if (p.drag) {
                var f = Math.exp(-p.drag * dt);
                p.vx *= f; p.vy *= f; p.vz *= f;
            }
            p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt;
            if (p.flut) {
                p.x += Math.sin(p.ph + p.age * 4.3) * 0.9 * dt;
                p.z += Math.cos(p.ph * 1.7 + p.age * 3.1) * 0.9 * dt;
            }
            // Paper and water come to rest on the green; light goes out on it.
            if (p.y < 0 && p.vy < 0) {
                if (p.land) { p.y = 0; p.vx = p.vy = p.vz = 0; p.flut = p.flut ? 0.0001 : 0; }
                else if (!p.shell) { p.y = 0; p.life = Math.min(p.life, p.age + 0.06); }
            }
            if (p.trail && fx.parts.length < 1400) {
                part(fx, { x: p.x, y: p.y, z: p.z, vx: (fx.rnd() - 0.5) * 0.4, vy: -0.5, vz: (fx.rnd() - 0.5) * 0.4,
                    grav: 2, life: 0.45, c: p.trail, c1: hex(0x802010), size: 0.14 });
            }
            if (p.shell && p.age >= p.life) {
                var col = p.shell;
                burstOf(fx, 80, { x: p.x, y: p.y, z: p.z, speed: 3.6, even: true, grav: 2.4, drag: 1.3, life: 1.4,
                    c: col, c1: [col[0] * 0.5, col[1] * 0.3, col[2] * 0.3], size: 0.2, flick: 1 });
                part(fx, { x: p.x, y: p.y, z: p.z, grav: 0, life: 0.25, c: hex(0xffffff), size: 2, grow: 1.2 });
                p.shell = null;
            }
        }
        var u2 = Math.min(1, p.age / p.life);
        var c = p.c0;
        if (p.c1) {
            var m = u2;
            p.or = c[0] + (p.c1[0] - c[0]) * m;
            p.og = c[1] + (p.c1[1] - c[1]) * m;
            p.ob = c[2] + (p.c1[2] - c[2]) * m;
        } else { p.or = c[0]; p.og = c[1]; p.ob = c[2]; }
        var a = p.flut ? 1 - Math.pow(u2, 6) : 1 - u2 * u2;
        // Light falling into a black hole goes out at the horizon rather than piling up white on it.
        if (p.mode === 2) a = Math.min(1, Math.max(0, (p.pull - 0.55) / 0.6));
        if (p.flick && u2 > 0.35 && Math.sin(p.ph * 7 + p.age * 38) < -0.2) a *= 0.25;
        var s = p.size;
        if (p.flut) {
            // Paper turning over: thin edge-on, full face-on, and duller on its back.
            var turn = Math.abs(Math.cos(p.ph + p.age * 7));
            s *= 0.35 + 0.65 * turn;
            var shade = 0.55 + 0.45 * turn;
            p.or *= shade; p.og *= shade; p.ob *= shade;
        }
        if (p.grow) s *= Math.max(0.05, 1 + p.grow * u2);
        p.ox = p.x; p.oy = p.y; p.oz = p.z;
        p.oa = Math.max(0, a);
        p.os = s;
    }

    function step(fx, dt) {
        if (fx.done) return false;
        fx.t0 = fx.t;
        fx.t += dt;
        fx.script.run(fx);
        var i, keep = [];
        for (i = 0; i < fx.parts.length; i++) {
            var p = fx.parts[i];
            stepPart(fx, p, dt);
            if (p.age < p.life || p.shell) keep.push(p);
        }
        fx.parts = keep;
        var rk = [];
        for (i = 0; i < fx.rings.length; i++) {
            var r = fx.rings[i];
            r.age += dt;
            if (r.age < 0) { r.oa = 0; rk.push(r); continue; }
            var u = Math.min(1, r.age / r.dur), e = 1 - Math.pow(1 - u, 3);
            r.or = r.r0 + (r.r1 - r.r0) * e;
            r.oa = r.a0 * Math.pow(1 - u, 1.5);
            if (u < 1) rk.push(r);
        }
        fx.rings = rk;
        var bk = [];
        for (i = 0; i < fx.beams.length; i++) {
            var b = fx.beams[i];
            b.age += dt;
            if (b.age < 0) { b.oa = 0; bk.push(b); continue; }
            var v = Math.min(1, b.age / b.dur);
            b.oh = b.h * Math.min(1, b.age / 0.22);
            b.or = b.r * (1 + 0.6 * v);
            b.oa = b.a0 * Math.min(1, b.age / 0.08) * (1 - v) * (1 - v);
            if (v < 1) bk.push(b);
        }
        fx.beams = bk;
        var lk = [];
        for (i = 0; i < fx.lenses.length; i++) {
            var L = fx.lenses[i];
            L.age += dt;
            if (L.age < 0) { L.ok = 0; lk.push(L); continue; }
            var w = Math.min(1, L.age / L.dur);
            L.or = L.r0 + (L.r1 - L.r0) * (1 - Math.pow(1 - w, 2));
            L.ok = L.k0 * (1 - w) * (1 - w);
            if (w < 1) lk.push(L);
        }
        fx.lenses = lk;
        fx.done = fx.t > fx.script.dur && !fx.parts.length && !fx.rings.length && !fx.beams.length &&
            !fx.lenses.length && !fx.hole;
        return !fx.done;
    }

    /* The same effect, run to its best moment on a fixed seed: the shop card's
       picture. */
    function peek(id, seed) {
        var fx = start(id, seeded(seed || 7)), t = (SCRIPTS[fx.id].peek || 0.5);
        while (fx.t < t && !fx.done) step(fx, 1 / 60);
        return fx;
    }

    G3.celebrate = { start: start, step: step, peek: peek, seeded: seeded, ids: Object.keys(SCRIPTS) };
})(window.G3);
