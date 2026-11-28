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
            bounce: o.bounce || 0,        // a rubber duck: comes back up off the green, this much of it
            sprite: o.sprite || null,     // drawn as a picture ('duck') rather than a point
            flip: o.flip || 1,            // which way the picture faces
            squeak: !!o.squeak,           // says so when it bounces (fx.events)
            keep: !!o.keep,               // holds its colour to the last moment, like paper
            duckling: !!o.duckling,       // one of the Easter egg's parade
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

        /* The Easter egg (balls.js: a "???" until twenty different holes
           are finished), and since v1.259.0 real ducks rather than pictures
           of them: rigid bodies (`stepDucks`) that render.js draws as rubber
           ducks in 3D. Mother Duck is fired out of the cup and lands beside
           it; her ducklings rain down round the flag, bounce, tumble and
           knock each other over, wobble back on to their bottoms — and then
           hop round the flag in a parade, squeaking as they land, until
           everybody jumps at once: pop, and Mother hops home into the cup. */
        'cele-ducks': {
            peek: 2.3,
            dur: 4.3,
            run: function (fx) {
                var rnd = fx.rnd, i, p, t = fx.t, PARADE = 1.75, JUMP = 3.3, POP = 3.75, N = 28;
                if (at(fx, 0)) {
                    fx.ducks = [];
                    fx.mother = duck(fx, {
                        s: 1.55, x: 0, y: 0.12, z: 0, vx: 0.75, vy: 6.6, vz: 0.35, grow: 0.25,
                        yaw: rnd() * TAU, wx: 0, wy: 2.2, wz: 1.4, rise: 0.3
                    });
                    fx.events.push('quack');
                    burstOf(fx, 34, { upper: true, speed: 3.2, lift: 2, grav: 7, drag: 0.6, life: 0.9,
                        c: function () { return rnd() < 0.5 ? hex(0xbfefff) : hex(0xffffff); }, size: 0.2, land: true });
                    ring(fx, { r0: 0.2, r1: 2.8, dur: 0.7, c: hex(0x9fe2ff), a: 0.8 });
                }
                // The ducklings: a fountain of them out of the cup, every one turning over as it flies.
                for (i = 0; i < N; i++) {
                    if (!at(fx, 0.2 + i * 0.032)) continue;
                    var ang = i * 2.39996 + (rnd() - 0.5) * 0.4, out = 1.1 + rnd() * 1.6;
                    duck(fx, {
                        s: 0.62 + rnd() * 0.2, x: Math.cos(ang) * 0.15, z: Math.sin(ang) * 0.15, y: 0.5,
                        vx: Math.cos(ang) * out, vy: 6.5 + rnd() * 2.2, vz: Math.sin(ang) * out, rise: 0.12,
                        yaw: rnd() * TAU, pitch: (rnd() - 0.5) * 2.4, roll: (rnd() - 0.5) * 2.4,
                        wx: (rnd() - 0.5) * 14, wy: (rnd() - 0.5) * 8, wz: (rnd() - 0.5) * 14,
                        duckling: true, slot: i / N * TAU
                    });
                }
                // The parade: every duckling hops for its place on a ring round the flag, and the ring turns.
                if (t > PARADE && t < JUMP) {
                    fx.ring = { r: 2.15, spin: 1.05 * (t - PARADE) };
                    if (at(fx, 2.4)) fx.events.push('quack');
                } else fx.ring = null;
                // Everybody jumps…
                if (at(fx, JUMP)) {
                    fx.events.push('quack');
                    for (i = 0; i < fx.ducks.length; i++) {
                        p = fx.ducks[i];
                        if (p === fx.mother) {
                            // Mother hops for the cup, timed to come down on it.
                            var vy = 4.6, T = 2 * vy / G;
                            p.vx = -p.x / T; p.vz = -p.z / T; p.vy = vy;
                            p.home = true;
                            continue;
                        }
                        var d = Math.sqrt(p.x * p.x + p.z * p.z) || 1;
                        p.vx += p.x / d * 0.9; p.vz += p.z / d * 0.9;
                        p.vy = 5.6 + rnd() * 1.2;
                        p.wx += (rnd() - 0.5) * 16; p.wy += (rnd() - 0.5) * 6; p.wz += (rnd() - 0.5) * 16;
                    }
                }
                // …and, at the top of it, pop — all but Mother, who goes home.
                if (at(fx, POP)) {
                    for (i = 0; i < fx.ducks.length; i++) {
                        p = fx.ducks[i];
                        if (!p.duckling || p.age >= p.life) continue;
                        burstOf(fx, 9, { x: p.x, y: p.y, z: p.z, speed: 2.2, grav: 3, drag: 1.4, life: 0.7,
                            c: function () { return rnd() < 0.4 ? hex(0xffd21f) : hex(0xdff6ff); }, size: 0.2 });
                        p.life = p.age;
                    }
                    for (i = 0; i < 4; i++) fx.events.push('squeak');
                    ring(fx, { r0: 0.5, r1: 4.2, dur: 0.6, c: hex(0xffd21f), a: 0.7, y: 1.2 });
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

    /* ── the ducks: rigid bodies on the green ─────────────────────────────

       Each duck is a body with a position (its centre of mass), a velocity,
       an orientation (a quaternion) and a spin, in the effect's own units
       with y up from the cup's lip. Its shape is the toy's, in units of its
       size `s` with the origin under its middle and its beak to +x: a body
       that is an ellipsoid, a head that is a ball, and the points of its tail
       and beak. The green is the plane y = 0, the flagstick a post at the
       origin, and the ducks are balls to each other. Contacts are impulses
       with a rubber duck's bounce and friction, so a duck that lands on its
       head tumbles; a weighted bottom (a torque toward upright while it is on
       the ground) is what stands it back up, which is what a rubber duck
       does and a ball does not.

       Kept here, pure, so the course (render.js), the shop's picture
       (game.js → drawCeleFrame) and the tests all run the same ducks. */
    var G = 13;                                        // units/s², a toy's hurry rather than the moon's
    var D_BODY = { c: [-0.04, 0.30, 0], r: [0.46, 0.30, 0.34] };
    var D_HEAD = { c: [0.24, 0.70, 0], r: 0.21 };
    var D_TIPS = [[-0.52, 0.50, 0], [0.50, 0.66, 0]]; // tail, beak
    var D_COM = [0, 0.26, 0];
    var D_BALL = 0.36;                                 // as a ball to the others, about its centre of mass
    var POLE_R = 0.05, POLE_H = 2.2;

    function qmul(a, b) {
        return [a[3] * b[0] + a[0] * b[3] + a[1] * b[2] - a[2] * b[1],
                a[3] * b[1] - a[0] * b[2] + a[1] * b[3] + a[2] * b[0],
                a[3] * b[2] + a[0] * b[1] - a[1] * b[0] + a[2] * b[3],
                a[3] * b[3] - a[0] * b[0] - a[1] * b[1] - a[2] * b[2]];
    }
    function qaxis(x, y, z, a) { var h = a / 2, sn = Math.sin(h); return [x * sn, y * sn, z * sn, Math.cos(h)]; }
    function qnorm(q) { var l = Math.sqrt(q[0] * q[0] + q[1] * q[1] + q[2] * q[2] + q[3] * q[3]) || 1; q[0] /= l; q[1] /= l; q[2] /= l; q[3] /= l; return q; }
    // v rotated by q, and by its inverse.
    function qrot(q, v) {
        var x = q[0], y = q[1], z = q[2], w = q[3];
        var tx = 2 * (y * v[2] - z * v[1]), ty = 2 * (z * v[0] - x * v[2]), tz = 2 * (x * v[1] - y * v[0]);
        return [v[0] + w * tx + y * tz - z * ty, v[1] + w * ty + z * tx - x * tz, v[2] + w * tz + x * ty - y * tx];
    }
    function qinv(q, v) { return qrot([-q[0], -q[1], -q[2], q[3]], v); }

    function duck(fx, o) {
        var q = qmul(qaxis(0, 1, 0, o.yaw || 0), qmul(qaxis(0, 0, 1, o.pitch || 0), qaxis(1, 0, 0, o.roll || 0)));
        var p = part(fx, { mode: 6, x: o.x, y: o.y, z: o.z, vx: o.vx, vy: o.vy, vz: o.vz, grav: 0,
            life: 9, c: [1, 1, 1], size: o.s, add: false, keep: true, squeak: true, duckling: !!o.duckling });
        p.duck = true;
        p.s = o.s;
        p.m = o.s * o.s * o.s;
        p.I = 0.085 * p.m * o.s * o.s;
        p.q = qnorm(q);
        p.wx = o.wx || 0; p.wy = o.wy || 0; p.wz = o.wz || 0;
        p.slot = o.slot || 0;
        p.rise = o.rise || 0;          // Mother, on her way out of the cup: the green is not under her yet
        p.hop = 0;                     // time since its feet last pushed off
        p.ground = false;
        // Out of the cup small and growing (Mother), or full size from the start.
        p.shrink = o.grow || 1;
        fx.ducks.push(p);
        return p;
    }

    // Where a point of the duck's shape (in units of its size, model frame) is in the world.
    function dWorld(p, local, k) {
        var s = p.s * (k || 1);
        var r = qrot(p.q, [(local[0] - D_COM[0]) * s, (local[1] - D_COM[1]) * s, (local[2] - D_COM[2]) * s]);
        return [p.x + r[0], p.y + r[1], p.z + r[2]];
    }
    // The lowest point of the duck: its body's, its head's, or the tip of its tail or its beak.
    function dLowest(p) {
        var dl = qinv(p.q, [0, -1, 0]);
        var a = D_BODY.r, e = [a[0] * dl[0], a[1] * dl[1], a[2] * dl[2]];
        var n = Math.sqrt(e[0] * e[0] + e[1] * e[1] + e[2] * e[2]) || 1;
        var cands = [
            dWorld(p, [D_BODY.c[0] + a[0] * e[0] / n, D_BODY.c[1] + a[1] * e[1] / n, D_BODY.c[2] + a[2] * e[2] / n]),
            (function () { var h = dWorld(p, D_HEAD.c); h[1] -= D_HEAD.r * p.s; return h; })(),
            dWorld(p, D_TIPS[0]), dWorld(p, D_TIPS[1])
        ];
        return cands;
    }

    // An impulse J (world) at the world point `at`.
    function dPush(p, at, jx, jy, jz) {
        var rx = at[0] - p.x, ry = at[1] - p.y, rz = at[2] - p.z;
        p.vx += jx / p.m; p.vy += jy / p.m; p.vz += jz / p.m;
        p.wx += (ry * jz - rz * jy) / p.I;
        p.wy += (rz * jx - rx * jz) / p.I;
        p.wz += (rx * jy - ry * jx) / p.I;
    }

    function dGround(fx, p) {
        var cs = dLowest(p), hit = false, big = 0;
        for (var k = 0; k < cs.length; k++) {
            var c = cs[k];
            if (c[1] >= 0) continue;
            hit = true;
            p.y -= c[1];
            for (var j = k + 1; j < cs.length; j++) cs[j][1] -= c[1];
            c[1] = 0;
            var rx = c[0] - p.x, ry = c[1] - p.y, rz = c[2] - p.z;
            // Velocity of the contact point: v + w × r.
            var vcx = p.vx + p.wy * rz - p.wz * ry;
            var vcy = p.vy + p.wz * rx - p.wx * rz;
            var vcz = p.vz + p.wx * ry - p.wy * rx;
            if (vcy >= 0) continue;
            var e = vcy < -1.4 ? 0.42 : 0;
            var jn = -(1 + e) * vcy / (1 / p.m + (rx * rx + rz * rz) / p.I);
            dPush(p, c, 0, jn, 0);
            if (-vcy > big) big = -vcy;
            // Friction against the slide, no more than the rubber's grip allows.
            vcx = p.vx + p.wy * rz - p.wz * ry;
            vcz = p.vz + p.wx * ry - p.wy * rx;
            var vt = Math.sqrt(vcx * vcx + vcz * vcz);
            if (vt > 1e-5) {
                var tx = vcx / vt, tz = vcz / vt;
                // |r × t|² for t in the plane.
                var cx = ry * tz, cy = rz * tx - rx * tz, cz = -ry * tx;
                var jt = Math.min(vt / (1 / p.m + (cx * cx + cy * cy + cz * cz) / p.I), 0.7 * jn);
                dPush(p, c, -tx * jt, 0, -tz * jt);
            }
        }
        if (big > 2.2 && p.squeak && fx.events.length < 40) fx.events.push('squeak');
        return hit;
    }

    function stepDucks(fx, dt) {
        var list = fx.ducks, n = Math.max(1, Math.ceil(dt / (1 / 120))), h = dt / n, i, j, p, o;
        for (var sub = 0; sub < n; sub++) {
            for (i = 0; i < list.length; i++) {
                p = list[i];
                if (p.age >= p.life) continue;
                if (p.gone) {
                    // Into the cup: down the hole and smaller as it goes.
                    p.shrink = Math.max(0, p.shrink - h / 0.3);
                    var keep = Math.exp(-14 * h);
                    p.x *= keep; p.z *= keep;
                    p.y = Math.max(D_COM[1] * p.s * p.shrink, p.y - 5 * h);
                    if (p.shrink <= 0) p.life = p.age;
                    continue;
                }
                p.vy -= G * h;
                p.x += p.vx * h; p.y += p.vy * h; p.z += p.vz * h;
                var wl = Math.sqrt(p.wx * p.wx + p.wy * p.wy + p.wz * p.wz);
                if (wl > 1e-6) p.q = qnorm(qmul(qaxis(p.wx / wl, p.wy / wl, p.wz / wl, wl * h), p.q));
                if (p.shrink < 1 && !p.home) p.shrink = Math.min(1, p.shrink + h / 0.3);
                if (p.rise > 0) { p.rise -= h; p.ground = false; continue; }
                p.ground = dGround(fx, p);
                if (p.home && p.vy < 0 && p.x * p.x + p.z * p.z < 0.8 && p.y < 0.9 * p.s) { p.gone = true; continue; }
                // The flagstick (which Mother, going home, is aimed down beside).
                var pr = Math.sqrt(p.x * p.x + p.z * p.z), reach = D_BALL * p.s + POLE_R;
                if (!p.home && pr < reach && pr > 1e-6 && p.y < POLE_H) {
                    var nx = p.x / pr, nz = p.z / pr, vn = p.vx * nx + p.vz * nz;
                    p.x = nx * reach; p.z = nz * reach;
                    if (vn < 0) { p.vx -= 1.4 * vn * nx; p.vz -= 1.4 * vn * nz; }
                }
                var up = qrot(p.q, [0, 1, 0]);
                if (p.ground) {
                    // The weighted bottom: back up on its base, and the rocking dies away.
                    var k = 46 * h;
                    p.wx += -up[2] * k; p.wz += up[0] * k;
                    var damp = Math.exp(-6 * h);
                    p.wx *= damp; p.wz *= damp; p.wy *= Math.exp(-3 * h);
                    p.vx *= Math.exp(-1.2 * h); p.vz *= Math.exp(-1.2 * h);
                }
                p.hop += h;
            }
            // Ducks bump each other, as balls about their middles.
            for (i = 0; i < list.length; i++) {
                p = list[i];
                if (p.age >= p.life || p.gone || p.rise > 0) continue;
                for (j = i + 1; j < list.length; j++) {
                    o = list[j];
                    if (o.age >= o.life || o.gone || o.rise > 0) continue;
                    var dx = o.x - p.x, dy = o.y - p.y, dz = o.z - p.z, rr = D_BALL * (p.s + o.s);
                    var d2 = dx * dx + dy * dy + dz * dz;
                    if (d2 >= rr * rr || d2 < 1e-9) continue;
                    var d = Math.sqrt(d2), ux = dx / d, uy = dy / d, uz = dz / d, over = rr - d;
                    var ip = 1 / p.m, io = 1 / o.m, wsum = ip + io;
                    p.x -= ux * over * ip / wsum; p.y -= uy * over * ip / wsum; p.z -= uz * over * ip / wsum;
                    o.x += ux * over * io / wsum; o.y += uy * over * io / wsum; o.z += uz * over * io / wsum;
                    var rv = (o.vx - p.vx) * ux + (o.vy - p.vy) * uy + (o.vz - p.vz) * uz;
                    if (rv >= 0) continue;
                    var jj = -1.45 * rv / wsum;
                    p.vx -= ux * jj * ip; p.vy -= uy * jj * ip; p.vz -= uz * jj * ip;
                    o.vx += ux * jj * io; o.vy += uy * jj * io; o.vz += uz * jj * io;
                    // A glancing knock sets it turning.
                    p.wy += (rv * 0.6) * (ux * 0.5 - uz * 0.5); o.wy -= (rv * 0.6) * (ux * 0.5 - uz * 0.5);
                    if (-rv > 2.5 && fx.events.length < 40) fx.events.push('squeak');
                }
            }
            // A knock from above may have pressed one into the green: stand it back on it.
            for (i = 0; i < list.length; i++) {
                p = list[i];
                if (p.age >= p.life || p.gone || p.rise > 0) continue;
                var cs = dLowest(p), lo = 0;
                for (j = 0; j < cs.length; j++) lo = Math.min(lo, cs[j][1]);
                p.y -= lo;
            }
        }
        // The legs: a duck on its feet hops for where it wants to be.
        for (i = 0; i < list.length; i++) {
            p = list[i];
            if (p.age >= p.life || p.gone || !p.ground || p.home) continue;
            var upv = qrot(p.q, [0, 1, 0]);
            if (upv[1] < 0.86 || p.hop < 0.3) continue;
            var tx = p.x, tz = p.z, want = false;
            if (fx.ring && p.duckling) {
                var a = p.slot + fx.ring.spin;
                tx = Math.cos(a) * fx.ring.r; tz = Math.sin(a) * fx.ring.r;
                want = true;
            } else if (fx.ring && p === fx.mother && p.hop > 0.85) {
                // Mother bobs on the spot, turning to watch the parade go round.
                tx = p.x + Math.cos(fx.ring.spin + p.slot + 1.2); tz = p.z + Math.sin(fx.ring.spin + p.slot + 1.2);
                want = 'still';
            }
            if (!want) continue;
            var dx2 = tx - p.x, dz2 = tz - p.z, dist = Math.sqrt(dx2 * dx2 + dz2 * dz2) || 1e-6;
            var fwd = qrot(p.q, [1, 0, 0]);
            var head = Math.atan2(-fwd[2], fwd[0]), wantH = Math.atan2(-dz2, dx2);
            var turn = wantH - head;
            while (turn > Math.PI) turn -= TAU;
            while (turn < -Math.PI) turn += TAU;
            p.hop = fx.rnd() * 0.08;
            p.vy = want === 'still' ? 2.4 : 2.5 + fx.rnd() * 0.5;
            var sp = want === 'still' ? 0 : Math.min(2.6, dist * 2.2);
            p.vx = dx2 / dist * sp; p.vz = dz2 / dist * sp;
            // Turned to face the way it is going by the time it comes down.
            p.wy = Math.max(-8, Math.min(8, turn * G / (2 * p.vy)));
            // A waddle: a rock from foot to foot with every hop, and nothing else to tip it.
            p.waddle = -(p.waddle || 1);
            p.wx = fwd[0] * 1.6 * p.waddle; p.wz = fwd[2] * 1.6 * p.waddle;
        }
    }

    // A duck's drawn values: where its origin (under its middle) is, which way it faces, how big.
    function duckOut(p) {
        var o = dWorld(p, [0, 0, 0], p.shrink);
        p.ox = o[0]; p.oy = o[1]; p.oz = o[2];
        p.oq = p.q;
        p.os = p.s * p.shrink;
        p.or = p.og = p.ob = 1;
        p.oa = p.age < p.life ? 1 : 0;
        // For a flat picture: which way it faces across the screen, and how far it is tipped.
        var fwd = qrot(p.q, [1, 0, 0]), up = qrot(p.q, [0, 1, 0]);
        p.flip = fwd[0] < 0 ? -1 : 1;
        p.roll = Math.atan2(-up[0], up[1]) * (p.flip < 0 ? -1 : 1);
    }

    function start(id, rnd) {
        var s = SCRIPTS[id] || SCRIPTS['cele-classic'];
        return {
            id: SCRIPTS[id] ? id : 'cele-classic', script: s,
            t: -1e-6, t0: -1e-6, acc: 0, rnd: rnd || Math.random,
            parts: [], rings: [], beams: [], lenses: [], hole: null, events: [], done: false,
            ducks: null, ring: null, mother: null
        };
    }

    function stepPart(fx, p, dt) {
        p.age += dt;
        if (p.duck) { duckOut(p); return; }
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
                if (p.bounce && p.vy < -1.2) {
                    p.y = 0; p.vy = -p.vy * p.bounce; p.vx *= 0.7; p.vz *= 0.7;
                    if (p.squeak && fx.events.length < 40) fx.events.push('squeak');
                } else if (p.bounce) { p.y = 0; p.vx = p.vy = p.vz = 0; }
                else if (p.land) { p.y = 0; p.vx = p.vy = p.vz = 0; p.flut = p.flut ? 0.0001 : 0; }
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
        var a = p.flut || p.keep ? 1 - Math.pow(u2, 6) : 1 - u2 * u2;
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
        if (fx.ducks) {
            stepDucks(fx, dt);
            fx.ducks = fx.ducks.filter(function (p) { return p.age + dt < p.life; });
        }
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

    /* A rubber duck, drawn into any 2D context: the game paints its point
       sprite with this once (render.js), and the shop draws every duck in its
       preview with it, so the two are the same duck. Centred on (x, y),
       `s` across, facing right (flip -1 for left). */
    function drawDuck(ctx, x, y, s, flip, alpha) {
        ctx.save();
        ctx.translate(x, y);
        ctx.scale((flip || 1) * s / 100, s / 100);
        ctx.globalAlpha = alpha === undefined ? 1 : alpha;
        ctx.lineJoin = 'round';
        ctx.strokeStyle = '#7a4a00';
        ctx.lineWidth = 3.5;
        // Body, with a perky tail.
        ctx.fillStyle = '#ffd21f';
        ctx.beginPath();
        ctx.moveTo(-40, 6);
        ctx.quadraticCurveTo(-48, -14, -30, -12);
        ctx.quadraticCurveTo(-14, -8, 2, 0);
        ctx.quadraticCurveTo(30, -4, 38, 8);
        ctx.quadraticCurveTo(40, 34, 4, 36);
        ctx.quadraticCurveTo(-36, 36, -40, 6);
        ctx.closePath();
        ctx.fill(); ctx.stroke();
        // Head.
        ctx.beginPath();
        ctx.arc(16, -22, 19, 0, Math.PI * 2);
        ctx.fill(); ctx.stroke();
        // Wing.
        ctx.fillStyle = '#f5b800';
        ctx.beginPath();
        ctx.moveTo(-18, 10);
        ctx.quadraticCurveTo(0, 2, 14, 12);
        ctx.quadraticCurveTo(0, 26, -18, 10);
        ctx.fill(); ctx.stroke();
        // Beak.
        ctx.fillStyle = '#ff7a1a';
        ctx.beginPath();
        ctx.moveTo(32, -24);
        ctx.quadraticCurveTo(48, -26, 50, -18);
        ctx.quadraticCurveTo(44, -12, 32, -14);
        ctx.closePath();
        ctx.fill(); ctx.stroke();
        // Eye, with a glint.
        ctx.fillStyle = '#1a1206';
        ctx.beginPath(); ctx.arc(21, -27, 4.2, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.arc(22.4, -28.4, 1.4, 0, Math.PI * 2); ctx.fill();
        // A shine on the head.
        ctx.fillStyle = 'rgba(255,255,255,0.55)';
        ctx.beginPath(); ctx.ellipse(8, -32, 6, 3.5, -0.5, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
    }

    /* The duck's shape, for render.js to model and the tests to measure
       against (units of a duck's size, origin under its middle, beak to +x). */
    var DUCK_SHAPE = { body: D_BODY, head: D_HEAD, tips: D_TIPS, com: D_COM, ball: D_BALL };

    G3.celebrate = { DUCK_SHAPE: DUCK_SHAPE, drawDuck: drawDuck, start: start, step: step, peek: peek, seeded: seeded, ids: Object.keys(SCRIPTS) };
})(window.G3);
