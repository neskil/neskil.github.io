/* render/effects.js — the tail behind the ball, and everything that sprays.
 *
 * Two fixed-size buffers and nothing else. The trail is a ring of points the
 * ball leaves behind while it is quick; the burst is one pool of particles
 * that every splash, divot, sand spray and holed putt takes a turn with — so
 * a hole's worth of effects allocates nothing after `build()`.
 *
 * One pool means one colour at a time, which is deliberate: two of these
 * never overlap in a game where one ball is in play, and a pool per effect
 * would be four times the buffers for a case that cannot happen.
 *
 * `build(scene, dotTexture)` once, then the game asks for effects by name and
 * render.js steps the pool each frame. The named effects are the vocabulary
 * the rest of the game has for "something happened here" — game.js calls
 * these, never `burst()`.
 *
 * Depends on config.js for the trail length. Touches no hole, no camera and
 * no state outside `E`.
 */
(function (G3) {
    'use strict';

    var C = G3.CONFIG;

    /* Everything this file owns. */
    var E = {
        trail: null, at: 0, on: false,
        particles: null, alive: 0
    };

    function buildTrail(scene, dot) {
        var n = C.TRAIL;
        var g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.Float32BufferAttribute(new Array(n * 3).fill(-9999), 3));
        g.setAttribute('color', new THREE.Float32BufferAttribute(new Array(n * 3).fill(0), 3));
        E.trail = new THREE.Points(g, new THREE.PointsMaterial({
            size: 0.13, map: dot, transparent: true, depthWrite: false,
            blending: THREE.AdditiveBlending, vertexColors: true
        }));
        E.trail.frustumCulled = false;
        E.at = 0;
        E.on = false;
        scene.add(E.trail);
    }

    function pushTrail(x, y, z) {
        var pos = E.trail.geometry.attributes.position.array;
        var col = E.trail.geometry.attributes.color.array;
        var n = C.TRAIL, i, age, f;
        E.at = (E.at + 1) % n;
        pos[E.at * 3] = x; pos[E.at * 3 + 1] = y; pos[E.at * 3 + 2] = z;
        for (i = 0; i < n; i++) {
            age = (E.at - i + n) % n;          // 0 = newest
            f = Math.max(0, 1 - age / n);
            f = f * f * 0.75;
            col[i * 3] = f; col[i * 3 + 1] = f * 1.05; col[i * 3 + 2] = f * 0.9;
        }
        E.trail.geometry.attributes.position.needsUpdate = true;
        E.trail.geometry.attributes.color.needsUpdate = true;
    }

    function clearTrail() {
        var pos = E.trail.geometry.attributes.position.array, i;
        for (i = 0; i < pos.length; i++) pos[i] = -9999;
        E.trail.geometry.attributes.position.needsUpdate = true;
    }

    /* ── the burst pool ────────────────────────────────────────────────── */

    function buildParticles(scene, dot) {
        var n = 90;
        var g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.Float32BufferAttribute(new Array(n * 3).fill(0), 3));
        E.particles = new THREE.Points(g, new THREE.PointsMaterial({
            size: 0.13, map: dot, transparent: true, opacity: 0.9, depthWrite: false
        }));
        E.particles.visible = false;
        E.particles.userData.v = [];
        for (var i = 0; i < n; i++) E.particles.userData.v.push({ x: 0, y: 0, z: 0, life: 0 });
        scene.add(E.particles);
    }

    function burst(x, y, z, color, count, speed) {
        var pts = E.particles.userData.v, i, p, n = 0;
        E.particles.material.color = new THREE.Color(color);
        for (i = 0; i < pts.length && n < count; i++) {
            p = pts[i];
            if (p.life > 0) continue;
            p.life = 0.55 + Math.random() * 0.35;
            p.px = x; p.py = y; p.pz = z;
            var a = Math.random() * Math.PI * 2, r = Math.random();
            p.x = Math.cos(a) * r * speed;
            p.z = Math.sin(a) * r * speed;
            p.y = speed * (0.6 + Math.random() * 0.8);
            n++;
        }
        E.particles.visible = true;
        E.alive = 1;
    }

    function stepParticles(dt) {
        if (!E.alive) return;
        var pts = E.particles.userData.v;
        var arr = E.particles.geometry.attributes.position.array;
        var alive = 0, i, p;
        for (i = 0; i < pts.length; i++) {
            p = pts[i];
            if (p.life <= 0) { arr[i * 3 + 1] = -999; continue; }
            p.life -= dt;
            p.y -= 14 * dt;
            p.px += p.x * dt; p.py += p.y * dt; p.pz += p.z * dt;
            arr[i * 3] = p.px; arr[i * 3 + 1] = p.py; arr[i * 3 + 2] = p.pz;
            alive++;
        }
        E.particles.geometry.attributes.position.needsUpdate = true;
        E.alive = alive;
        E.particles.visible = alive > 0;
    }

    /* ── what the game asks for by name ────────────────────────────────── */

    function splashAt(x, y, z) { burst(x, y, z, 0x9fd8ff, 26, 2.6); }
    function sandAt(x, y, z) { burst(x, y, z, 0xe8d8a8, 14, 1.5); }
    /* The ball goes past the pin on its way in — nothing stops it, since the
       simulation has never heard of the pin — so the pin at least acknowledges
       it and rattles, which is what a real one does and what your ear is
       expecting when the cup sound plays. */
    function sinkAt(x, y, z) {
        burst(x, y + 0.1, z, 0xffe98a, 26, 2.2);
        // The pin belongs to the hole, not to this pool, so the rattle is
        // asked for rather than reached for.
        if (E.onSink) E.onSink();
    }

    /* Whatever the ball was sitting on, sprayed backwards off the strike. */
    function divot(x, y, z, yaw, frac, kind) {
        var colour = kind === 'sand' ? 0xe8d8a8 : (kind === 'wood' ? 0xc79a63 : 0x6fbf5a);
        var n = 5 + Math.round(frac * 13);
        burst(x - Math.sin(yaw) * 0.1, y + 0.03, z - Math.cos(yaw) * 0.1,
            colour, n, 0.8 + frac * 2.2);
    }

    function build(scene, dot) {
        buildTrail(scene, dot);
        buildParticles(scene, dot);
    }

    /* The trail follows a ball that is actually going somewhere and is thrown
       away the moment it stops, so a settled ball never trails. render.js
       decides "going somewhere"; this decides what it looks like. */
    function trail(on, x, y, z) {
        if (on) {
            E.on = true;
            pushTrail(x, y, z);
        } else if (E.on) {
            E.on = false;
            clearTrail();
        }
    }

    G3.effects = {
        build: build,
        step: stepParticles,
        trail: trail,
        clearTrail: clearTrail,
        splashAt: splashAt,
        sandAt: sandAt,
        sinkAt: sinkAt,
        divot: divot,
        /* The pin is the hole's, not this pool's, so `sinkAt` asks for the
           rattle rather than reaching for it. render.js, which holds the pin,
           registers the callback in init(). */
        onSink: function (fn) { E.onSink = fn; },
        state: E
    };

})(window.G3);
