/* render.js — the renderer, and the only file that holds a picture together.
 *
 * ## Where things are
 *
 * This file is the conductor. It owns the three.js renderer, the scene, the
 * camera and the ball, it keeps whatever the current hole handed back, and it
 * runs one frame. Everything it draws is built somewhere else:
 *
 *     render/palette.js    the three courses' colours, and how weather bends them
 *     render/textures.js   every surface, painted into a canvas at load
 *     render/sky.js        the dome overhead and the clouds in it
 *     render/water.js      the sea and the ponds
 *     render/hole.js       the course itself, as meshes
 *     render/aim.js        the shot you have not taken yet
 *     render/effects.js    the trail, and everything that sprays
 *     bag.js               the club picker, which rides in camera space
 *     weather.js           rain, mist, motes and the wind everything answers to
 *     postfx.js            what happens to the picture after it is drawn
 *
 * Look there first. What is left in this file is state, the camera, and the
 * order things happen in a frame — which is the part that is genuinely about
 * the whole picture rather than about one thing in it.
 *
 * ## The two rules
 *
 * - **The simulation never appears in here.** This file is handed a world and
 *   an aim and it draws them; it decides nothing about a shot. `physics.js` is
 *   read for `wallBox()` and for the aim preview, and written to never.
 * - **A moving wall's mesh is placed from `physics.wallBox()`**, the same
 *   function the collision solver calls, so a blade you can see and a blade
 *   you can hit cannot drift apart. `render-tests.html` checks this rather
 *   than trusting it.
 *
 * ## What a hole owns
 *
 * `buildHole()` throws away the last hole — meshes, materials and the textures
 * made for it — and copies what `holeMesh.build()` hands back into `R`. That
 * copy is the one place the two files meet: anything new a hole makes needs a
 * line there and nowhere else.
 *
 * No image files ship and none are fetched. Nothing here is resolution
 * dependent: the renderer scales to the viewport and the simulation never sees
 * a pixel.
 */
(function (G3) {
    'use strict';

    var C = G3.CONFIG;
    var P = G3.physics;
    var T = G3.textures;
    var THEMES = G3.palette.themes;

    /* ── module state ───────────────────────────────────────────────────── */

    /* Everything the renderer holds. The first block outlives a hole; the
       second block is whatever the current hole handed back and is thrown
       away with it. */
    var R = {
        ready: false,
        scene: null, camera: null, renderer: null,
        ball: null,
        tex: {},               // textures that outlive a hole (see init)
        maxAniso: 1,
        fx: false,             // is the postfx chain running
        cam: {
            yaw: 0, pitch: 0.46, dist: 9, target: new THREE.Vector3(), overview: false,
            kick: 0,          // impact flinch, decays
            speedPull: 0      // extra distance while the ball is quick
        },
        smooth: { pos: new THREE.Vector3(), target: new THREE.Vector3(), started: false },
        lastBall: new THREE.Vector3(),
        clock: 0,

        /* Handed over by render/hole.js, one hole at a time. Every name here
           is set in exactly one place — the copy at the end of buildHole. */
        holeGroup: null,
        theme: null, weather: null,
        movers: [],            // { mesh, wall, h } — placed from physics each frame
        waterMats: [],         // water shaders whose clock and wind we advance
        holeTex: [],           // textures made for this hole, disposed with it
        sky: null,             // the sky shader's material, for the cloud drift
        sun: null,             // the directional light…
        sunDir: new THREE.Vector3(0, 1, 0),   // …and where it is pointing
        cupMesh: null,
        pin: null, flagSwivel: null, flagCloth: null, flagRest: null, flagWidth: 0.76,
        pinShake: 0,
        fogNear: 24, fogFar: 95
    };

    function init(canvas) {
        R.renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: false });
        R.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        R.renderer.shadowMap.enabled = true;
        R.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        if (THREE.sRGBEncoding !== undefined) R.renderer.outputEncoding = THREE.sRGBEncoding;

        /* The picture goes through postfx.js if the context will have it, and
           straight to the canvas if it will not. Everything downstream of here
           is written so that either is a complete game: the grade is the last
           word on how a hole looks, not the only word. */
        R.fx = G3.postfx ? G3.postfx.init(R.renderer) : false;

        R.scene = new THREE.Scene();
        R.camera = new THREE.PerspectiveCamera(52, 1, 0.1, 400);

        /* Textures that serve every hole, painted once. The grass is not among
           them — it is tinted per theme, so render/hole.js makes one per hole
           and puts it on that hole's disposal list. */
        R.maxAniso = R.renderer.capabilities.getMaxAnisotropy();
        R.tex.sand = T.sand();
        R.tex.grassBump = T.grassBump();
        R.tex.dimple = T.dimple();
        R.tex.wood = T.wood();
        R.tex.rough = T.rough();
        R.tex.dot = T.dot();

        buildBall();
        G3.aimView.build(R.scene);
        G3.effects.build(R.scene, R.tex.dot);
        // A holed putt rattles the pin, and the pin belongs to the hole.
        G3.effects.onSink(function () { R.pinShake = 1; });
        if (G3.bag) G3.bag.build(R.scene);

        R.ready = true;
        resize();
        return R;
    }

    function resize() {
        if (!R.ready) return;
        var el = R.renderer.domElement;
        var w = el.clientWidth || el.width, h = el.clientHeight || el.height;
        R.renderer.setSize(w, h, false);
        R.camera.aspect = w / Math.max(1, h);
        R.camera.updateProjectionMatrix();
        if (R.fx) {
            var dpr = R.renderer.getPixelRatio();
            G3.postfx.resize(w * dpr, h * dpr);
        }
    }

    function buildBall() {
        var geo = new THREE.SphereGeometry(C.BALL_R, 32, 24);
        var mat = new THREE.MeshPhongMaterial({
            color: 0xffffff,
            bumpMap: R.tex.dimple,
            bumpScale: 0.012,
            shininess: 55,
            specular: 0x9aa4ac
        });
        R.ball = new THREE.Mesh(geo, mat);
        R.ball.castShadow = true;
        R.scene.add(R.ball);
    }

    function disposeGroup(g) {
        g.traverse(function (o) {
            if (o.geometry) o.geometry.dispose();
            if (o.material) {
                // Textures are freed separately, by buildHole: some are
                // shared across holes and some belong to this one.
                if (Array.isArray(o.material)) o.material.forEach(function (m) { m.dispose(); });
                else o.material.dispose();
            }
        });
        R.scene.remove(g);
    }

    /* ── the hole ───────────────────────────────────────────────────────── */

    /* Throw away the last hole and take delivery of the next one. The block at
       the bottom is the seam between this file and render/hole.js: everything
       a hole makes that a frame has to keep animating is copied across there
       and nowhere else. */
    function buildHole(hole, themeName, weatherKind) {
        var theme = THEMES[themeName] || THEMES.seaside;
        var W = G3.weather;
        var weather = weatherKind || (W ? W.now : null) ||
            { cloud: 0.4, fog: 1.3, sun: 1, amb: 1, sunSharp: 1,
              cloudTop: '#ffffff', cloudBase: '#b9c6d4', grade: {} };

        if (R.holeGroup) {
            disposeGroup(R.holeGroup);
            for (var t = 0; t < R.holeTex.length; t++) R.holeTex[t].dispose();
        }

        var b = G3.holeMesh.build(hole, {
            theme: theme,
            weather: weather,
            tex: R.tex,
            maxAniso: R.maxAniso
        });

        R.theme = theme;
        R.weather = weather;
        R.holeGroup = b.group;
        R.movers = b.movers;
        R.waterMats = b.waterMats;
        R.holeTex = b.textures;
        R.sky = b.sky;
        R.sun = b.sun;
        R.sunDir.copy(b.sunDir);
        R.cupMesh = b.cup;
        R.pin = b.pin;
        R.flagSwivel = b.flagSwivel;
        R.flagCloth = b.flagCloth;
        R.flagRest = b.flagRest;
        R.flagWidth = b.flagWidth;
        R.fogNear = b.fogNear;
        R.fogFar = b.fogFar;

        R.scene.fog = new THREE.Fog(b.fogColour, b.fogNear, b.fogFar);
        R.scene.add(b.group);
        if (R.fx) G3.postfx.setGrade(weather.grade);

        R.pinShake = 0;
        R.smooth.started = false;
        R.clock = 0;
        R.cam.kick = 0;
        R.cam.speedPull = 0;
        G3.effects.clearTrail();
    }

    /* ── per-frame ──────────────────────────────────────────────────────── */

    // Walls that move are placed from the same function the solver uses.
    function syncMovers(t) {
        var i, m, B;
        for (i = 0; i < R.movers.length; i++) {
            m = R.movers[i];
            B = P.wallBox(m.wall, t);
            m.mesh.position.set(B.cx, B.base + m.h / 2, B.cz);
            m.mesh.rotation.y = B.yaw;
        }
    }

    function rollBall(pos) {
        var dx = pos.x - R.lastBall.x, dz = pos.z - R.lastBall.z;
        var d = Math.hypot(dx, dz);
        if (d > 1e-5) {
            var axis = new THREE.Vector3(dz / d, 0, -dx / d);
            R.ball.rotateOnWorldAxis(axis, d / C.BALL_R);
        }
        R.lastBall.set(pos.x, pos.y, pos.z);
        R.ball.position.set(pos.x, pos.y, pos.z);
    }

    /* Camera. The player never flies it directly: it sits behind the ball
       looking down the aim line, which is what makes "drag left, aim left"
       true from any angle. Overview lifts it above the hole instead. */
    function updateCamera(hole, ball, dt) {
        var c = R.cam;
        var tx, ty, tz, px, py, pz;

        if (c.overview) {
            // Fit the pad bounding box: back off along the aim line far enough
            // that the hole's bounding radius is inside the narrower of the two
            // frustum half-angles, with a little air around it.
            var bx = (hole.bounds.minX + hole.bounds.maxX) / 2;
            var bz = (hole.bounds.minZ + hole.bounds.maxZ) / 2;
            var ex = (hole.bounds.maxX - hole.bounds.minX) / 2;
            var ez = (hole.bounds.maxZ - hole.bounds.minZ) / 2;
            var radius = Math.hypot(ex, ez) * 1.12;
            var vFov = R.camera.fov * Math.PI / 360;
            var hFov = Math.atan(Math.tan(vFov) * R.camera.aspect);
            var dist = radius / Math.tan(Math.min(vFov, hFov));
            var tilt = 1.02;                  // ~58° down, so it still reads as 3D
            tx = bx; ty = 0; tz = bz;
            px = bx - Math.sin(c.yaw) * Math.cos(tilt) * dist;
            py = Math.sin(tilt) * dist;
            pz = bz - Math.cos(c.yaw) * Math.cos(tilt) * dist;
        } else {
            /* Two things move the camera besides the player: it flinches when
               the ball is struck, and it drifts back as the ball gets quick, so
               a hard shot feels quick rather than merely distant. */
            var dist = c.dist + c.speedPull - c.kick * C.KICK * 4;
            tx = ball.x; ty = ball.y + 0.35; tz = ball.z;
            var back = dist * Math.cos(c.pitch);
            px = ball.x - Math.sin(c.yaw) * back;
            py = ball.y + dist * Math.sin(c.pitch);
            pz = ball.z - Math.cos(c.yaw) * back;
        }

        if (!R.smooth.started) {
            R.smooth.pos.set(px, py, pz);
            R.smooth.target.set(tx, ty, tz);
            R.smooth.started = true;
        } else {
            var k = 1 - Math.pow(0.0016, dt);   // frame-rate independent easing
            R.smooth.pos.lerp(new THREE.Vector3(px, py, pz), k);
            R.smooth.target.lerp(new THREE.Vector3(tx, ty, tz), k);
        }
        R.camera.position.copy(R.smooth.pos);
        R.camera.lookAt(R.smooth.target);
    }

    function frame(dt, world, aim) {
        if (!R.ready || !R.holeGroup) return;
        R.clock += dt;

        syncMovers(world.time);
        rollBall(world.ball);

        /* Speed, spent two ways: the camera eases back and the lens opens a
           little, both of which read as "this one is going somewhere". */
        var speed = Math.hypot(world.ball.vx, world.ball.vy, world.ball.vz);
        var wantPull = Math.min(3.2, speed * 0.14);
        var wantFov = 52 + Math.min(7, speed * 0.4);
        var ease = 1 - Math.pow(0.06, dt);
        R.cam.speedPull += (wantPull - R.cam.speedPull) * ease;
        if (Math.abs(R.camera.fov - wantFov) > 0.05) {
            R.camera.fov += (wantFov - R.camera.fov) * ease;
            R.camera.updateProjectionMatrix();
        }
        R.cam.kick *= Math.pow(0.008, dt);
        if (R.cam.kick < 0.002) R.cam.kick = 0;

        // The tail only follows a ball that is actually going somewhere.
        G3.effects.trail(world.moving && speed > 1.2,
            world.ball.x, world.ball.y, world.ball.z);

        G3.aimView.update(world, aim);
        G3.effects.step(dt);
        updateCamera(world.hole, world.ball, dt);

        // The weather runs off the camera, so it is stepped after the camera
        // has finished moving: the rain column, the motes and the mist banks
        // all follow it, and a frame's lag shows as a jitter at the edges.
        var wind = { x: 0.4, z: 0.9, speed: 0.5 };
        if (G3.weather) {
            G3.weather.update(dt, R.camera);
            wind = G3.weather.wind;
        }

        var i;
        for (i = 0; i < R.waterMats.length; i++) {
            var u = R.waterMats[i].uniforms;
            u.time.value = R.clock;
            u.wind.value.set(wind.x, wind.z);
            // A rough day is a choppy sea, and the same number does both.
            u.chop.value = 0.55 + Math.min(1.6, wind.speed * 1.5);
        }
        if (R.sky && G3.weather) R.sky.uniforms.drift.value.copy(G3.weather.cloudOffset);

        flapFlag(dt, wind);

        // The bag rides in front of the camera, so it is placed after the
        // camera has finished moving and before anything is drawn.
        if (G3.bag) G3.bag.update(dt, R.camera, R.camera.aspect);

        if (R.fx && G3.postfx.render(R.scene, R.camera, sunOnScreen(), dt)) return;
        R.renderer.setRenderTarget(null);
        R.renderer.render(R.scene, R.camera);
    }

    /* Where the sun lands on the screen, and how much of it is on there. The
       light shafts march towards this point, so a sun behind the camera has to
       report nothing at all — project() gives a mirrored answer for anything
       behind the near plane, and rays converging on a phantom is the one
       artefact of the whole chain that a player would notice. */
    var _sunPt = new THREE.Vector3();
    var _sun = { uv: new THREE.Vector2(0.5, 1.2), vis: 0 };
    function sunOnScreen() {
        _sunPt.copy(R.sunDir).multiplyScalar(140).add(R.camera.position).project(R.camera);
        if (_sunPt.z > 1) { _sun.vis = 0; return _sun; }
        _sun.uv.set(_sunPt.x * 0.5 + 0.5, _sunPt.y * 0.5 + 0.5);
        var out = Math.max(0, Math.max(Math.abs(_sun.uv.x - 0.5), Math.abs(_sun.uv.y - 0.5)) - 0.5);
        _sun.vis = Math.max(0, 1 - out * 2.2);
        return _sun;
    }

    /* The flag, which is three separate things pretending to be one.

       It **points downwind** — the swivel takes the wind's bearing, less the
       pin's own yaw, so the cloth turns about the stick rather than about the
       hole. It **ripples** at a rate and a depth that come from the wind
       speed, with the wave growing along the fly so the hoist stays put and
       the free end does the moving. And on a still day it **hangs**: the whole
       sheet sags towards the ground by as much as the wind is failing to hold
       it up, which is the detail that makes a calm hole read as calm. */
    function flapFlag(dt, wind) {
        if (!R.flagCloth || !R.flagSwivel) return;
        var t = R.clock;
        var gust = Math.min(1, wind.speed / 0.95);
        var yaw = Math.atan2(wind.x, wind.z);

        if (R.pinShake > 0) {
            R.pinShake = Math.max(0, R.pinShake - dt * 2.6);
            var q = R.pinShake * R.pinShake;
            R.pin.rotation.z = Math.sin(t * 34) * 0.07 * q;
            R.pin.rotation.x = Math.sin(t * 29 + 1.2) * 0.05 * q;
        }

        // The cloth streams away from the wind, which means the swivel points
        // where the wind is going: the flag's own yaw, less the pin's.
        R.flagSwivel.rotation.y = yaw - R.pin.rotation.y + Math.PI / 2 +
            Math.sin(t * 1.7) * 0.10 * gust;

        var g = R.flagCloth.geometry.attributes.position;
        var rest = R.flagRest;
        var sag = (1 - gust) * 0.42;
        for (var i = 0; i < g.count; i++) {
            var lx = rest[i * 3];                 // 0 at the hoist, the width at the fly
            var f = lx / R.flagWidth;
            var ripple = Math.sin(t * (5 + gust * 7) - lx * 7.5) * (0.02 + gust * 0.13) * f;
            g.setZ(i, ripple);
            // A limp flag falls, and it falls further the further out it is.
            g.setY(i, rest[i * 3 + 1] - sag * f * f - Math.abs(ripple) * 0.35);
        }
        g.needsUpdate = true;
        R.flagCloth.geometry.computeBoundingSphere();
    }

    /* ── effects the game asks for ──────────────────────────────────────── */

    /* Forwarded rather than reimplemented: `render` is the whole of the
       renderer as far as game.js is concerned, and where a spray of particles
       actually lives is not game.js's business. */
    function punch(frac) { R.cam.kick = Math.max(R.cam.kick, 0.35 + frac * 0.65); }

    function setCam(patch) {
        for (var k in patch) if (Object.prototype.hasOwnProperty.call(patch, k)) R.cam[k] = patch[k];
    }

    G3.render = {
        init: init,
        resize: resize,
        buildHole: buildHole,
        frame: frame,
        splashAt: G3.effects.splashAt,
        sandAt: G3.effects.sandAt,
        sinkAt: G3.effects.sinkAt,
        divot: G3.effects.divot,
        punch: punch,
        setCam: setCam,
        cam: R.cam,
        // The bag picks against these, and nothing else needs them.
        pickAt: function (nx, ny) {
            return G3.bag ? G3.bag.pick(nx, ny, R.camera, R.scene) : null;
        },
        state: R,
        // What the HUD needs to name the sky it is standing under.
        get weather() { return R.weather; }
    };

})(window.G3);
