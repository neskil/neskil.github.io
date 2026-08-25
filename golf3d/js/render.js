/* The course, in three.js. The simulation never appears in here and this
   file never decides anything about a shot — it is handed a world and a
   camera intent and it draws them.

   Two rules keep the picture honest:

   - A moving wall's mesh is placed from physics.wallBox(), the same function
     the collision solver calls. A blade you can see and a blade you can hit
     therefore cannot drift apart, however the movement is later retuned.
   - The pads are drawn from the same rectangles the ball rolls on, sheared by
     the same gradient, so what looks like a ramp is a ramp.

   The three files next to this one are the three jobs it is not doing:
   themes.js is the palette, textures.js draws every canvas the game uses (and
   owns the rule that keeps one grass serving a whole course), and shaders.js
   holds the sky and the water, which are the two places where the answer is
   GLSL rather than a material property. */
(function (G3) {
    'use strict';

    var C = G3.CONFIG;
    var P = G3.physics;

    /* The palettes live in themes.js, the procedural textures in
       textures.js and the two hand-written shaders in shaders.js. What is
       left in here is the part that actually builds a hole. */
    var TX = G3.textures;
    var SH = G3.shaders;

    /* ── module state ───────────────────────────────────────────────────── */

    var R = {
        ready: false,
        scene: null, camera: null, renderer: null,
        holeGroup: null, ball: null, aimGroup: null, pathPlane: null, pathHead: null, arrow: null,
        flagCloth: null, flagPole: null, cupMesh: null,
        pin: null, flagSwivel: null, flagRest: null, pinShake: 0,
        movers: [],            // { mesh, wall } — updated from physics each frame
        shells: [],            // { mesh, x, z, k, phase } — the grass, leaned by the wind
        waterMats: [],         // water shaders whose clock and wind we advance
        sky: null,             // the sky shader's material, for the same reason
        sun: null,             // the directional light, and where it is pointing
        sunDir: new THREE.Vector3(0, 1, 0),
        sunUv: new THREE.Vector2(0.5, 1.2),
        surf: null,            // the hole's shared surface materials
        pathBuilds: 0,         // preview recomputes, for the inspector
        theme: null, weather: null,
        cam: {
            yaw: 0, pitch: 0.46, dist: 9, target: new THREE.Vector3(),
            mode: 'follow',   // …or 'side' or 'over'; see updateCamera
            sideSign: 1,      // which side of the shot the side view stands on
            kick: 0,          // impact flinch, decays
            speedPull: 0      // extra distance while the ball is quick
        },
        smooth: { pos: new THREE.Vector3(), target: new THREE.Vector3(), started: false },
        particles: null, pAlive: 0,
        marks: null,           // the overview's ball ring, cup ring and beacon
        lift: 0,               // 0 on the course, 1 overhead; see atmosphere()
        overDist: 0, overRadius: 0,
        lastBall: new THREE.Vector3(),
        clock: 0
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

        // The surface textures are shared and live in textures.js; this is
        // the point where the context is known, and the anisotropy limit with
        // it, so it is where they are allowed to exist.
        TX.prepare(R.renderer);

        buildBall();
        buildAim();
        buildMarkers();
        buildTrail();
        buildParticles();
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

    /* ── persistent objects ─────────────────────────────────────────────── */

    function buildBall() {
        var geo = new THREE.SphereGeometry(C.BALL_R, 32, 24);
        var mat = new THREE.MeshPhongMaterial({
            color: 0xffffff,
            bumpMap: TX.dimple,
            bumpScale: 0.012,
            shininess: 55,
            specular: 0x9aa4ac
        });
        R.ball = new THREE.Mesh(geo, mat);
        R.ball.castShadow = true;
        R.scene.add(R.ball);
    }

    function buildAim() {
        R.aimGroup = new THREE.Group();

        // Ground arrow: a flat wedge that grows with power. Drawn without depth
        // testing so it is never swallowed by the pad it lies on.
        var shape = new THREE.BufferGeometry();
        shape.setAttribute('position', new THREE.Float32BufferAttribute(new Array(9 * 3).fill(0), 3));
        R.arrow = new THREE.Mesh(shape, new THREE.MeshBasicMaterial({
            color: 0xffffff, transparent: true, opacity: 0.55, side: THREE.DoubleSide,
            depthTest: false
        }));
        R.arrow.renderOrder = 5;
        R.aimGroup.add(R.arrow);

        /* The band: a tapered strip behind the ball, opposite the shot, that
           grows as the pull grows. It is the part of a slingshot you can see
           straining, and without it a big shot and a small one look the same
           until the ball moves. */
        var band = new THREE.BufferGeometry();
        band.setAttribute('position', new THREE.Float32BufferAttribute(new Array(6 * 3).fill(0), 3));
        R.band = new THREE.Mesh(band, new THREE.MeshBasicMaterial({
            color: 0xffffff, transparent: true, opacity: 0.5, side: THREE.DoubleSide,
            depthTest: false
        }));
        R.band.renderOrder = 4;
        R.aimGroup.add(R.band);

        /* The ring: a full circle round the ball drawn only as far as the power
           has wound on. RingGeometry lays its triangles out in order round the
           circle, so a draw range is an arc, and an arc costs nothing. */
        var ring = new THREE.RingGeometry(0.30, 0.40, 64);
        R.ringCount = ring.index.count;
        R.ring = new THREE.Mesh(ring, new THREE.MeshBasicMaterial({
            color: 0x9ae6b4, transparent: true, opacity: 0.9, side: THREE.DoubleSide,
            depthTest: false
        }));
        R.ring.rotation.x = -Math.PI / 2;
        R.ring.renderOrder = 7;
        R.aimGroup.add(R.ring);

        /* Predicted path, as a filled plane rather than a row of dots. Two
           power-perturbed arcs — a touch light, a touch heavy — bound a
           quad-strip surface between them: the shape of it *is* the answer to
           "how far could this go", spanning the min and max air time a loaded
           shot could land at. An arrowhead at the loaded shot's own landing
           point (or its first bounce) marks the one result actually aimed
           at, without pretending the game can promise it. */
        var perPath = 40;
        R.pathPerPath = perPath;
        var pvcount = (perPath - 1) * 6;
        var pg = new THREE.BufferGeometry();
        pg.setAttribute('position', new THREE.Float32BufferAttribute(new Array(pvcount * 3).fill(0), 3));
        pg.setAttribute('color', new THREE.Float32BufferAttribute(new Array(pvcount * 3).fill(1), 3));
        R.pathPlane = new THREE.Mesh(pg, new THREE.MeshBasicMaterial({
            color: 0xffffff, transparent: true, opacity: 0.5, side: THREE.DoubleSide,
            vertexColors: true, depthTest: false
        }));
        R.pathPlane.renderOrder = 6;
        R.pathPlane.frustumCulled = false;
        R.aimGroup.add(R.pathPlane);

        var hg = new THREE.BufferGeometry();
        hg.setAttribute('position', new THREE.Float32BufferAttribute(new Array(3 * 3).fill(0), 3));
        R.pathHead = new THREE.Mesh(hg, new THREE.MeshBasicMaterial({
            color: 0xffffff, transparent: true, opacity: 0.95, side: THREE.DoubleSide,
            depthTest: false
        }));
        R.pathHead.renderOrder = 7;
        R.pathHead.frustumCulled = false;
        R.aimGroup.add(R.pathHead);

        R.scene.add(R.aimGroup);
    }

    // One quad of the path plane, as two triangles: pA-pB-pC and pA-pC-pD.
    function putPathQuad(arr, base, pA, pB, pC, pD) {
        var idx = base * 3;
        arr[idx] = pA.x; arr[idx + 1] = pA.y; arr[idx + 2] = pA.z;
        arr[idx + 3] = pB.x; arr[idx + 4] = pB.y; arr[idx + 5] = pB.z;
        arr[idx + 6] = pC.x; arr[idx + 7] = pC.y; arr[idx + 8] = pC.z;
        arr[idx + 9] = pA.x; arr[idx + 10] = pA.y; arr[idx + 11] = pA.z;
        arr[idx + 12] = pC.x; arr[idx + 13] = pC.y; arr[idx + 14] = pC.z;
        arr[idx + 15] = pD.x; arr[idx + 16] = pD.y; arr[idx + 17] = pD.z;
    }

    function setPathQuadShade(col, base, shade) {
        var idx = base * 3;
        for (var v = 0; v < 6; v++) { col[idx + v * 3] = col[idx + v * 3 + 1] = col[idx + v * 3 + 2] = shade; }
    }

    /* A tail of where the ball has just been. Additive blending and a colour
       that darkens with age does the fading for us — per-point alpha would want
       a custom shader, and this reads the same. */
    function buildTrail() {
        var n = C.TRAIL;
        var g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.Float32BufferAttribute(new Array(n * 3).fill(-9999), 3));
        g.setAttribute('color', new THREE.Float32BufferAttribute(new Array(n * 3).fill(0), 3));
        R.trail = new THREE.Points(g, new THREE.PointsMaterial({
            size: 0.13, map: TX.dot, transparent: true, depthWrite: false,
            blending: THREE.AdditiveBlending, vertexColors: true
        }));
        R.trail.frustumCulled = false;
        R.trailAt = 0;
        R.trailOn = false;
        R.scene.add(R.trail);
    }

    function pushTrail(x, y, z) {
        var pos = R.trail.geometry.attributes.position.array;
        var col = R.trail.geometry.attributes.color.array;
        var n = C.TRAIL, i, age, f;
        R.trailAt = (R.trailAt + 1) % n;
        pos[R.trailAt * 3] = x; pos[R.trailAt * 3 + 1] = y; pos[R.trailAt * 3 + 2] = z;
        for (i = 0; i < n; i++) {
            age = (R.trailAt - i + n) % n;          // 0 = newest
            f = Math.max(0, 1 - age / n);
            f = f * f * 0.75;
            col[i * 3] = f; col[i * 3 + 1] = f * 1.05; col[i * 3 + 2] = f * 0.9;
        }
        R.trail.geometry.attributes.position.needsUpdate = true;
        R.trail.geometry.attributes.color.needsUpdate = true;
    }

    function clearTrail() {
        var pos = R.trail.geometry.attributes.position.array, i;
        for (i = 0; i < pos.length; i++) pos[i] = -9999;
        R.trail.geometry.attributes.position.needsUpdate = true;
    }

    function buildParticles() {
        var n = 90;
        var g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.Float32BufferAttribute(new Array(n * 3).fill(0), 3));
        R.particles = new THREE.Points(g, new THREE.PointsMaterial({
            size: 0.13, map: TX.dot, transparent: true, opacity: 0.9, depthWrite: false
        }));
        R.particles.visible = false;
        R.particles.userData.v = [];
        for (var i = 0; i < n; i++) R.particles.userData.v.push({ x: 0, y: 0, z: 0, life: 0 });
        R.scene.add(R.particles);
    }

    function burst(x, y, z, color, count, speed) {
        var pts = R.particles.userData.v, i, p, n = 0;
        R.particles.material.color = new THREE.Color(color);
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
        R.particles.visible = true;
        R.pAlive = 1;
    }

    function stepParticles(dt) {
        if (!R.pAlive) return;
        var pts = R.particles.userData.v;
        var arr = R.particles.geometry.attributes.position.array;
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
        R.particles.geometry.attributes.position.needsUpdate = true;
        R.pAlive = alive;
        R.particles.visible = alive > 0;
    }

    /* ── scene assembly ─────────────────────────────────────────────────── */

    /* The hole's geometry and its materials go together; its textures do not.
       A material is now shared by every pad or rail wearing it, so the same
       object turns up on a dozen meshes and must be disposed once and not a
       dozen times — releasing a program more often than it was claimed is how
       a renderer ends up drawing nothing. Textures belong to textures.js,
       which knows when they stop being the current theme's. */
    function disposeGroup(g) {
        var seen = [];
        function drop(m) {
            if (!m || seen.indexOf(m) >= 0) return;
            seen.push(m);
            m.dispose();
        }
        g.traverse(function (o) {
            if (o.geometry) o.geometry.dispose();
            if (Array.isArray(o.material)) o.material.forEach(drop);
            else drop(o.material);
        });
        R.scene.remove(g);
    }

    function skyDome(theme, weather) {
        var mat = new THREE.ShaderMaterial({
            side: THREE.BackSide, depthWrite: false, fog: false,
            uniforms: {
                top: { value: skyTint(theme.sky[0], weather, true) },
                bottom: { value: skyTint(theme.sky[1], weather, true) },
                /* Not converted, unlike everything else in here. This is the
                   colour the horizon has to *match*, and what it is matching
                   is three.js's own fog on the lit materials — which reads the
                   hex as a linear value, the way this game's whole palette
                   does. Convert it and the sky ends a visibly different colour
                   from the ground it is supposed to be meeting, which is a
                   seam right across the middle of the picture. */
                fogColour: { value: skyTint(theme.fog, weather, false) },
                sunColour: { value: lin(theme.sun) },
                // Cloud colours are written for daylight. On the course that
                // is played after dark the same cloud is lit by a fraction as
                // much, and a white one over a night sky reads as a hole in it.
                cloudTop: { value: lin(weather.cloudTop).multiplyScalar(theme.cloudLum || 1) },
                cloudBase: { value: lin(weather.cloudBase).multiplyScalar(theme.cloudLum || 1) },
                sunDir: { value: new THREE.Vector3(0, 1, 0) },
                cover: { value: weather.cloud },
                sunI: { value: weather.sun },
                sharp: { value: weather.sunSharp },
                // Thick air, tall haze. Clamped so a clear sky still gets a
                // few degrees of it rather than a hard edge at the water line.
                hazeTop: { value: Math.max(0.10, Math.min(0.34, 0.40 - 0.17 * weather.fog)) },
                // Only after dark, and a solid overcast puts them out.
                starI: { value: (theme.stars || 0) * (1 - weather.cloud * 0.85) },
                drift: { value: new THREE.Vector2() }
            },
            vertexShader: SH.SKY_VS,
            fragmentShader: SH.SKY_FS
        });
        var mesh = new THREE.Mesh(new THREE.SphereGeometry(180, 32, 20), mat);
        mesh.renderOrder = -1;
        R.sky = mat;
        return mesh;
    }

    /* ── the surfaces ───────────────────────────────────────────────────

       One material per surface kind per hole, and one texture behind it,
       shared by every pad that is made of it.

       This used to be the other way round: each pad cloned its own copy of
       the grass with `repeat` set to that pad's size, so a hole with a dozen
       pads uploaded a dozen 512² greens and threw them all away on the next
       hole. The tiling is a property of the pad, not of the texture, so it
       now lives where the pad does — baked into the pad's UVs when the
       geometry is built (`addPad`) — and the texture is a constant that every
       pad can point at. `textures.SCALE` is the number the two halves agree
       on.

       Every surface is Phong, which sounds like a cost and is not: with a
       black specular a Phong material is a Lambert material, and what it buys
       is one number — how wet the ground is. Rain darkens a surface and makes
       it shine, and doing that to the sand and the boards as well as the green
       is the difference between "it is raining" and "there is rain in front of
       the screen". */
    function buildSurfaces(theme) {
        var wet = R.weather ? (R.weather.wet || 0) : 0;
        var tex = TX.surfaces(theme);
        // Wet ground is darker ground, whatever it is made of.
        var damp = new THREE.Color(1, 1, 1).multiplyScalar(1 - wet * 0.24);
        var side = new THREE.MeshLambertMaterial({
            color: new THREE.Color(theme.side).multiplyScalar(1 - wet * 0.20)
        });

        function tops(map, shine, dry, soaked) {
            return new THREE.MeshPhongMaterial({
                map: map, color: damp.clone(), shininess: shine,
                specular: new THREE.Color(dry).lerp(new THREE.Color(soaked), wet)
            });
        }

        var top = {
            sand: tops(tex.sand, 4 + wet * 60, 0x000000, 0x9aa4ac),
            wood: tops(tex.wood, 8 + wet * 80, 0x151515, 0xb0bcc4),
            rough: tops(tex.rough, 3 + wet * 40, 0x000000, 0x7d8a92),
            // The greens get the most of everything: a bump map of the same
            // blades that are in the colour map, so the light rakes across the
            // mow bands rather than lying on them flat.
            green: new THREE.MeshPhongMaterial({
                map: tex.green,
                bumpMap: tex.greenBump,
                bumpScale: 0.035 + wet * 0.02,
                color: damp.clone(),
                // Wet grass is dark and sheeny, not glittery: a bump map under
                // a hard specular puts a white speck on every blade and the
                // green comes out looking like frost.
                shininess: 4 + wet * 22,
                specular: new THREE.Color(0x1c2a18).lerp(new THREE.Color(0x4a5a60), wet)
            })
        };

        /* Box material order is +x, -x, +y, -y, +z, -z; an extruded slab has
           just two groups, caps then walls. Both arrays point at the same two
           materials, so a pad picks a shape rather than a look. */
        var pads = {};
        for (var k in top) {
            if (!Object.prototype.hasOwnProperty.call(top, k)) continue;
            pads[k] = {
                box: [side, side, top[k], side, side, side],
                slab: [top[k], side]
            };
        }

        /* A painted rail has a sheen on it in any weather and a hard one in the
           rain; it is also the brightest thing on most holes, which is what
           gives the bloom something to find. Four kinds, four materials, and
           twenty rails between them. */
        function paint(color) {
            return new THREE.MeshPhongMaterial({
                color: new THREE.Color(color).multiplyScalar(1 - wet * 0.16),
                shininess: 22 + wet * 80,
                specular: new THREE.Color(0x2a2f33).lerp(new THREE.Color(0xaab6bd), wet)
            });
        }

        /* The shells. One material per layer per grassy kind, shared by every
           pad wearing it — the same rule as the flat surfaces above, and the
           reason a hole with a dozen greens on it still only has these.

           Two numbers do all the work. `alphaTest` climbs with the layer, so
           each shell keeps only the blades that reach it and the mat tapers;
           and the colour climbs with it too, because the bottom of a stand of
           grass is in the shade of the rest of it. Lit rather than unlit, so
           the sun still rakes across the turf and a shell in the shadow of a
           rail goes dark with the pad under it. */
        function shells(kind, tex, base, layers) {
            var out = [], i, f, mat;
            for (i = 0; i < layers; i++) {
                f = (i + 1) / layers;
                mat = new THREE.MeshLambertMaterial({
                    map: tex,
                    // Never quite 0: a layer that keeps every texel is a sheet
                    // of grass-coloured film lying over the pad.
                    alphaTest: 0.035 + f * 0.72,
                    color: new THREE.Color(base).multiplyScalar((0.42 + 0.62 * f) * (1 - wet * 0.24)),
                    // Opaque with a cut-out, not blended: alphaTest writes
                    // depth, so six layers sort themselves and cost no more
                    // than six opaque draws.
                    transparent: false,
                    side: THREE.FrontSide
                });
                out.push(mat);
            }
            return out;
        }

        R.surf = {
            pads: pads,
            shells: {
                green: shells('green', tex.greenShell, theme.grass[1], SHELL_LAYERS),
                rough: shells('rough', tex.roughShell, '#3c6b34', SHELL_LAYERS)
            },
            walls: {
                rail: paint(theme.rail),
                blade: paint(0xd8523f),
                gate: paint(0xe0a13a),
                beam: paint(0x9a6a3c)
            },
            post: new THREE.MeshLambertMaterial({ color: 0x6b7280 })
        };
    }

    function padMaterial(kind, slab) {
        var set = R.surf.pads[kind] || R.surf.pads.green;
        return slab ? set.slab : set.box;
    }

    /* The tiling, baked in. A box's cap runs 0..1 across the pad, so it is
       scaled by how many tiles the pad is wide and deep; an extruded slab's
       cap is UV-mapped in the shape's own coordinates — world units — so it is
       divided by the tile size instead. Same texture either way, which is the
       whole point. */
    function scaleUv(geo, su, sv) {
        var uv = geo.attributes.uv, i;
        if (!uv) return;
        for (i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * su, uv.getY(i) * sv);
        uv.needsUpdate = true;
    }

    function tilePad(geo, kind, w, d, slab) {
        var scale = TX.SCALE[kind] || TX.SCALE.green;
        if (slab) scaleUv(geo, 1 / scale, 1 / scale);
        else scaleUv(geo, TX.tiles(kind, w), TX.tiles(kind, d));
    }

    /* The lit materials in this game hand three.js an sRGB hex as if it were a
       linear albedo and have always looked the way they look because of it —
       that is the palette, and changing it now would be a different game. The
       two *unlit* shaders, the sky and the water, have no lighting to bring
       them back down, so a raw hex out of one of those comes out a stop and a
       half too pale. They get the conversion the palette never had. */
    function lin(hex) {
        var c = new THREE.Color(hex);
        return c.convertSRGBToLinear ? c.convertSRGBToLinear() : c;
    }

    /* The sky, the fog and the horizon are one colour scheme and the weather
       has to be allowed to move all three together. A golden hour that warms
       the light but leaves a noon-blue sky behind it reads as a filter over a
       photograph rather than as an evening. */
    function skyTint(hex, weather, linear) {
        var c = linear ? lin(hex) : new THREE.Color(hex);
        if (weather && weather.tintSky) {
            c.lerp(linear ? lin(weather.tintSky) : new THREE.Color(weather.tintSky),
                weather.tintAmt === undefined ? 0.4 : weather.tintAmt);
        }
        return c;
    }

    var PLANK_THICK = 0.3;

    /* ── the grass ──────────────────────────────────────────────────────

       How many shells a green gets, and how tall the mat is. Six is where the
       stack stops reading as stripes from a low camera; a phone gets four,
       because the shells are the one thing here that costs a draw call per
       pad per layer and a phone is where that shows first.

       The rough gets the same six at twice the height and a wilder lean. No
       hole uses a rough pad today, but the surface is a real one everywhere
       else — the friction, the texture, the divot colour — so it grows too,
       and the first hole to want one will look like somewhere you would
       rather not be. */
    var SHELL_LAYERS = (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) ? 4 : 6;
    var SHELL_HEIGHT = { green: 0.115, rough: 0.26 };
    /* How far the tips lean, per unit of wind. Each is about 40% of that kind's
       height, so a full gale bends the mat over by half its own height and no
       further — past that the top of the stack visibly slides off the bottom
       of it, which is the one way this technique gives itself away. */
    var SHELL_SWAY = { green: 0.045, rough: 0.10 };

    var FLAG_W = 0.76;

    /* Pads are drawn as boxes whose underside reaches the surrounding ground,
       so a raised green reads as a plateau with a cliff instead of a slab
       hovering in the air. Boards are the exception: a jetty is supposed to
       look like a plank over the water, not a causeway through it. */
    /* The pad that holds the cup is built as an extruded shape with a circular
       hole in it rather than as a box, so the hole in the picture is the hole
       the ball falls through. Everything else stays a box: this costs a
       triangulation, and only one pad per hole needs it. */
    function punchedSlab(pad, thick, cup) {
        var shape = new THREE.Shape();
        var hw = pad.w / 2, hd = pad.d / 2;
        // Built around the pad's centre, in the plane three.js extrudes; after
        // the rotation below, shape-y runs along world -z.
        shape.moveTo(-hw, -hd);
        shape.lineTo(hw, -hd);
        shape.lineTo(hw, hd);
        shape.lineTo(-hw, hd);
        shape.lineTo(-hw, -hd);

        var hole = new THREE.Path();
        var cx = pad.x + hw, cz = pad.z + hd;
        hole.absarc(cup.x - cx, -(cup.z - cz), C.HOLE_R, 0, Math.PI * 2, true);
        shape.holes.push(hole);

        var geo = new THREE.ExtrudeGeometry(shape, {
            depth: thick, bevelEnabled: false, curveSegments: 28
        });
        geo.rotateX(-Math.PI / 2);       // lay it flat: extrusion now runs +y
        geo.translate(0, -thick, 0);     // top face at y = 0, like the box
        return geo;
    }

    /* The mat over one pad. Each shell is the pad's own outline lifted a
       little further off it, wearing the blade sheet from textures.js — so a
       green ends up with six flat planes stacked inside twelve centimetres,
       and looks like turf you could putt on.

       The cup's pad is punched here exactly as the pad itself is: a solid
       shell over the hole would grow grass across the one part of the course
       that has to stay a hole.

       Every shell is registered with R.shells, because the wind moves them
       (see `swayShells`) and a mat that does not move is a carpet. */
    function addShells(group, pad, cup, holed, cx, cy, cz) {
        var set = R.surf.shells[pad.kind];
        if (!set) return;
        var sx = pad.sx || 0, sz = pad.sz || 0;
        var height = SHELL_HEIGHT[pad.kind];
        var sway = SHELL_SWAY[pad.kind];
        // A phase per pad, off its own corner, so the ripple crosses the hole
        // rather than every green waving in unison.
        var phase = (pad.x * 0.7 + pad.z * 1.3) % 6.283;
        var i;

        for (i = 0; i < set.length; i++) {
            var f = (i + 1) / set.length;
            var geo;
            if (holed) {
                geo = shellShape(pad, cup);
                scaleUv(geo, 1 / TX.SHELL_SCALE[pad.kind], 1 / TX.SHELL_SCALE[pad.kind]);
            } else {
                geo = new THREE.PlaneGeometry(pad.w, pad.d, 1, 1);
                geo.rotateX(-Math.PI / 2);
                scaleUv(geo, TX.shellTiles(pad.kind, pad.w), TX.shellTiles(pad.kind, pad.d));
            }
            if (sx || sz) {
                var m = new THREE.Matrix4();
                m.set(1, 0, 0, 0,
                      sx, 1, sz, 0,
                      0, 0, 1, 0,
                      0, 0, 0, 1);
                geo.applyMatrix4(m);
                geo.computeVertexNormals();
            }
            var mesh = new THREE.Mesh(geo, set[i]);
            mesh.position.set(cx, cy + height * f, cz);
            // Lit by the sun and darkened by anything standing on the pad, but
            // casting nothing itself: a cut-out shadow needs a depth material
            // of its own, and six of those per pad would cost more than the
            // shadow is worth on grass this short.
            mesh.receiveShadow = true;
            mesh.renderOrder = 1;
            group.add(mesh);
            R.shells.push({
                mesh: mesh, x: cx, z: cz,
                // The lean is cubed in the layer: the roots barely move and
                // the tips do all of it, which is how a blade actually bends.
                k: sway * f * f * f,
                phase: phase + f * 1.4
            });
        }
    }

    /* The punched outline again, flat this time. `punchedSlab` extrudes; a mat
       has no thickness, so it is the same shape run through ShapeGeometry —
       whose UVs come out in the shape's own coordinates, which is to say world
       units, which is what the caller scales by. */
    function shellShape(pad, cup) {
        var hw = pad.w / 2, hd = pad.d / 2;
        var shape = new THREE.Shape();
        shape.moveTo(-hw, -hd);
        shape.lineTo(hw, -hd);
        shape.lineTo(hw, hd);
        shape.lineTo(-hw, hd);
        shape.lineTo(-hw, -hd);
        var hole = new THREE.Path();
        var cx = pad.x + hw, cz = pad.z + hd;
        // A shade wider than the cup, so no blade hangs over the rim.
        hole.absarc(cup.x - cx, -(cup.z - cz), C.HOLE_R * 1.08, 0, Math.PI * 2, true);
        shape.holes.push(hole);
        var geo = new THREE.ShapeGeometry(shape, 24);
        geo.rotateX(-Math.PI / 2);
        return geo;
    }

    /* The wind, in the grass. One sine per shell with the pad's own phase in
       it, times the layer's height above the roots, along the wind's own
       bearing — so a gust crosses the hole as a wave and a still hole barely
       moves at all. Nothing here is simulated; it is the flag's wind read
       twice. */
    function swayShells(wind) {
        var i, sh, ripple;
        for (i = 0; i < R.shells.length; i++) {
            sh = R.shells[i];
            // The wave travels along the wind, so its phase has to depend on
            // where the pad is *down* the wind rather than on the clock alone.
            ripple = 0.62 + 0.38 * Math.sin(R.clock * (1.4 + wind.speed * 1.8) +
                sh.phase - (sh.x * wind.x + sh.z * wind.z) * 0.55);
            sh.mesh.position.x = sh.x + wind.x * sh.k * ripple;
            sh.mesh.position.z = sh.z + wind.z * sh.k * ripple;
        }
    }

    function addPad(group, pad, theme, cup) {
        var cx = pad.x + pad.w / 2, cz = pad.z + pad.d / 2;
        var sx = pad.sx || 0, sz = pad.sz || 0;
        var cy = P.padHeight(pad, cx, cz);
        var rise = (Math.abs(sx) * pad.w + Math.abs(sz) * pad.d) / 2;
        var thick = pad.kind === 'wood'
            ? PLANK_THICK
            : Math.max(0.6, cy - (theme.surroundY - 0.4) + rise);
        var holed = cup && P.padContains(pad, cup.x, cup.z) &&
            Math.abs(P.padHeight(pad, cup.x, cup.z) - cup.y) < 0.06;
        var geo = holed
            ? punchedSlab(pad, thick, cup)
            : new THREE.BoxGeometry(pad.w, thick, pad.d);
        if (holed) {
            // The box is centred on its own middle; the extruded slab is built
            // that way too, so both share the placement below.
            geo.translate(0, thick / 2, 0);
        }
        if (sx || sz) {
            // Shear about the pad's own centre: y' = y + sx·x + sz·z. Vertical
            // edges stay vertical, so a tilted pad still meets its neighbours.
            var m = new THREE.Matrix4();
            m.set(1, 0, 0, 0,
                  sx, 1, sz, 0,
                  0, 0, 1, 0,
                  0, 0, 0, 1);
            geo.applyMatrix4(m);
            geo.computeVertexNormals();
        }
        // The tiling rides on the pad rather than on the texture, which is
        // what lets every pad of a kind share one material (buildSurfaces).
        tilePad(geo, pad.kind, pad.w, pad.d, holed);
        var mesh = new THREE.Mesh(geo, padMaterial(pad.kind, holed));
        mesh.position.set(cx, cy - thick / 2, cz);
        mesh.receiveShadow = true;
        mesh.castShadow = true;
        group.add(mesh);

        // …and the grass standing on it, if it is the sort of pad that grows.
        addShells(group, pad, cup, holed, cx, cy, cz);
    }

    function addWall(group, wall) {
        var B = P.wallBox(wall, 0);
        var geo = new THREE.BoxGeometry(wall.w, wall.h, wall.d);
        // One material per kind, shared by every wall wearing it (see
        // buildSurfaces) — a hole has up to twenty rails and one coat of paint.
        var mesh = new THREE.Mesh(geo, R.surf.walls[wall.kind] || R.surf.walls.rail);
        mesh.position.set(B.cx, B.base + wall.h / 2, B.cz);
        mesh.rotation.y = B.yaw;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        group.add(mesh);

        if (wall.move || wall.spin) {
            R.movers.push({ mesh: mesh, wall: wall, h: wall.h });
            if (wall.spin) {
                // A blade needs something to turn on, or it reads as a floating
                // plank.
                var post = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.16, 0.2, wall.h + 1.5, 12),
                    R.surf.post
                );
                post.position.set(B.cx, B.base + (wall.h + 1.5) / 2 - 0.3, B.cz);
                post.castShadow = true;
                group.add(post);
            }
        }
    }

    function waterMaterial(theme, opts) {
        var deep = lin(theme.water);
        var shallow = deep.clone().lerp(lin(0xffffff), 0.18);
        var mat = new THREE.ShaderMaterial({
            uniforms: {
                deep: { value: deep },
                shallow: { value: shallow },
                skyColour: { value: lin(theme.sky[1]) },
                sunColour: { value: lin(theme.sun) },
                fogColour: { value: new THREE.Color(theme.fog) },   // see skyDome
                sunDir: { value: new THREE.Vector3(0, 1, 0) },
                time: { value: 0 },
                gloss: { value: 1 },
                chop: { value: 1 },
                rain: { value: 0 },
                fogNear: { value: 24 },
                fogFar: { value: 95 },
                alpha: { value: opts && opts.alpha !== undefined ? opts.alpha : 1 },
                wind: { value: new THREE.Vector2(0.4, 0.9) }
            },
            vertexShader: SH.WATER_VS,
            fragmentShader: SH.WATER_FS,
            transparent: !!(opts && opts.alpha !== undefined && opts.alpha < 1)
        });
        R.waterMats.push(mat);
        return mat;
    }

    function addWater(group, w, theme) {
        // A box rather than a plane: the pads reach down to the surrounding
        // ground, so a pond between two of them is a filled channel, and a
        // sheet floating in the gap would read as a decal. Only the top face
        // gets the water shader; the sides are the murk underneath it.
        var depth = Math.max(0.6, w.y - theme.surroundY + 0.2);
        var murk = new THREE.MeshLambertMaterial({
            color: new THREE.Color(theme.water).multiplyScalar(0.45)
        });
        var top = waterMaterial(theme, { alpha: 0.9 });
        // Box material order: +x, -x, +y, -y, +z, -z.
        var mesh = new THREE.Mesh(new THREE.BoxGeometry(w.w, depth, w.d),
            [murk, murk, top, murk, murk, murk]);
        mesh.position.set(w.x + w.w / 2, w.y - depth / 2, w.z + w.d / 2);
        group.add(mesh);
    }

    function addSurround(group, hole, theme) {
        var mat;
        if (theme.surround === 'water') {
            mat = waterMaterial(theme, {});
        } else {
            // Cached by tint in textures.js: two holes on the same course
            // stand on the same rock, and it used to be redrawn for each.
            mat = new THREE.MeshLambertMaterial({
                map: TX.rock(theme.surround === 'rock'
                    ? (theme.ground || '#9c8466')
                    : (theme.floor || '#3f4450'))
            });
        }
        // Big enough that its edge is beyond the fog, so the horizon is a fade
        // and not a line.
        var mesh = new THREE.Mesh(new THREE.PlaneGeometry(600, 600), mat);
        mesh.rotation.x = -Math.PI / 2;
        mesh.position.set((hole.bounds.minX + hole.bounds.maxX) / 2, theme.surroundY, (hole.bounds.minZ + hole.bounds.maxZ) / 2);
        group.add(mesh);
    }

    /* The hole through the green is real geometry (see punchedSlab); what is
       added here is the liner that makes the shaft read as a shaft, the floor
       the ball comes to rest on, the white rim, and the pin.

       **The pin stands in the cup**, which is where a pin stands. It used to
       be planted beside it, on the grounds that a flagstick down the middle of
       a hole this size is something the ball ought to hit and would instead go
       straight through — an honest dodge that made every hole look wrong. It
       stands vertical, as a real flagstick does; the ball passes through the
       green geometry around the cup, not through the pin itself.

       The pin also does a job nothing else on the course does: it is the only
       instrument telling you what the wind is doing. The cloth streams
       downwind, snaps in a gust and hangs limp when it drops — so a glance at
       the flag is a reading, not a decoration. */
    function addCup(group, hole) {
        var cup = hole.cup;

        var liner = new THREE.Mesh(
            new THREE.CylinderGeometry(C.HOLE_R - 0.004, C.HOLE_R - 0.004, C.CUP_DEPTH, 28, 1, true),
            new THREE.MeshLambertMaterial({ color: 0x14170f, side: THREE.BackSide })
        );
        liner.position.set(cup.x, cup.y - C.CUP_DEPTH / 2, cup.z);
        group.add(liner);

        var floor = new THREE.Mesh(
            new THREE.CircleGeometry(C.HOLE_R, 28),
            new THREE.MeshLambertMaterial({ color: 0x1d2416 })
        );
        floor.rotation.x = -Math.PI / 2;
        floor.position.set(cup.x, cup.y - C.CUP_DEPTH, cup.z);
        floor.receiveShadow = true;
        group.add(floor);

        var rim = new THREE.Mesh(
            new THREE.RingGeometry(C.HOLE_R - 0.005, C.HOLE_R + 0.045, 32),
            new THREE.MeshBasicMaterial({ color: 0xf2f5f0, side: THREE.DoubleSide })
        );
        rim.rotation.x = -Math.PI / 2;
        rim.position.set(cup.x, cup.y + 0.006, cup.z);
        group.add(rim);
        R.cupMesh = rim;

        /* The pin. Everything below hangs off one group standing at the
           centre of the cup, tilted away down the line of play, so the lean is
           set once and the flag, the ferrule and the wobble all inherit it. */
        var away = Math.atan2(cup.x - hole.tee.x, cup.z - hole.tee.z);
        var pin = new THREE.Group();
        pin.position.set(cup.x, cup.y - C.CUP_DEPTH + 0.01, cup.z);
        pin.rotation.y = away;             // a real flagstick stands vertical
        group.add(pin);
        R.pin = pin;
        R.pinLean = 0;

        var H = 2.25;
        var pole = new THREE.Mesh(
            new THREE.CylinderGeometry(0.021, 0.030, H, 10),
            new THREE.MeshPhongMaterial({ color: 0xf4f6f4, shininess: 40, specular: 0x556066 })
        );
        pole.position.y = H / 2;
        pole.castShadow = true;
        pin.add(pole);
        R.flagPole = pole;

        // The weighted foot that sits on the floor of the cup, and the black
        // band at the lip: both are what a real flagstick has, and between
        // them they stop the pole reading as a wire pushed into the grass.
        var foot = new THREE.Mesh(
            new THREE.CylinderGeometry(0.055, 0.075, 0.07, 12),
            new THREE.MeshLambertMaterial({ color: 0x23262a })
        );
        foot.position.y = 0.035;
        pin.add(foot);

        var band = new THREE.Mesh(
            new THREE.CylinderGeometry(0.033, 0.033, 0.16, 10),
            new THREE.MeshLambertMaterial({ color: 0x23262a })
        );
        band.position.y = C.CUP_DEPTH + 0.10;
        pin.add(band);

        /* The cloth turns about the pole rather than with the hole, because a
           flag points where the wind is going and nowhere else. It is built
           with its hoist at the origin so that rotating the group swings it
           round the stick instead of round its own middle. */
        var swivel = new THREE.Group();
        swivel.position.y = H - 0.10;
        pin.add(swivel);
        R.flagSwivel = swivel;

        var cloth = new THREE.Mesh(
            new THREE.PlaneGeometry(FLAG_W, 0.43, 14, 3),
            new THREE.MeshPhongMaterial({
                color: 0xe23b3b, side: THREE.DoubleSide, shininess: 6, specular: 0x2a1010
            })
        );
        cloth.geometry.translate(FLAG_W / 2, -0.215, 0);   // hoist at the origin
        cloth.castShadow = true;
        swivel.add(cloth);
        R.flagCloth = cloth;
        R.flagRest = cloth.geometry.attributes.position.array.slice();
        R.pinShake = 0;
    }

    function addTeeMark(group, hole) {
        var m = new THREE.Mesh(
            new THREE.RingGeometry(0.20, 0.26, 20),
            new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5, side: THREE.DoubleSide })
        );
        m.rotation.x = -Math.PI / 2;
        m.position.set(hole.tee.x, hole.tee.y + 0.015, hole.tee.z);
        group.add(m);
    }

    /* Three lights, and the weather sets all three.

       The sun is the one that changes most: overcast takes it down to a fifth
       and hands the difference to the sky, which is exactly what a cloud does,
       and the golden-hour kinds drop it towards the horizon and warm it, which
       is what gives those holes their long shadows. The shadow *softens* with
       the cloud rather than merely fading, by widening the sampling radius —
       a sharp shadow under a solid overcast is the single loudest way to tell
       a player that the sky is a picture.

       The third is a fill from the opposite side at a fraction of the sun's
       strength. Without it the shaded face of every rail on the course is the
       flat ambient colour and the hole reads as a diagram; with it there is a
       bounce off the ground and the boxes turn into objects. */
    function lights(group, hole, theme, weather) {
        var cx = (hole.bounds.minX + hole.bounds.maxX) / 2;
        var cz = (hole.bounds.minZ + hole.bounds.maxZ) / 2;

        /* The fill light is the sky, so it is the same colour as the sky: an
           overcast one goes grey, a golden one goes orange. Skipping this is
           what leaves a sunset looking like a warm filter over a scene still
           lit by a blue afternoon. */
        var skyLight = skyTint(theme.ambient, weather, false);
        if (weather.cloud > 0.6) skyLight.lerp(new THREE.Color(0xc6d2de), (weather.cloud - 0.6) * 1.2);
        var amb = new THREE.HemisphereLight(skyLight, 0x3c4436, theme.ambientI * weather.amb);
        group.add(amb);

        var sunColour = new THREE.Color(weather.warm || theme.sun);
        var pos = theme.sunPos;
        // A low sun is a long shadow: pull the height down and push the reach
        // out, keeping the bearing the hole was designed around.
        var lift = weather.low ? 0.30 : 1;
        var reach = weather.low ? 1.9 : 1;
        var sun = new THREE.DirectionalLight(sunColour, 0.95 * weather.sun);
        sun.position.set(cx + pos[0] * reach, Math.max(2.5, pos[1] * lift), cz + pos[2] * reach);
        sun.target.position.set(cx, 0, cz);
        sun.castShadow = true;
        var span = Math.max(hole.bounds.maxX - hole.bounds.minX, hole.bounds.maxZ - hole.bounds.minZ) * 0.75 + 4;
        sun.shadow.camera.left = -span;
        sun.shadow.camera.right = span;
        sun.shadow.camera.top = span;
        sun.shadow.camera.bottom = -span;
        sun.shadow.camera.near = 1;
        sun.shadow.camera.far = 120;
        sun.shadow.mapSize.set(2048, 2048);
        sun.shadow.bias = -0.0009;
        sun.shadow.normalBias = 0.02;
        sun.shadow.radius = 1.5 + weather.cloud * 4.5;
        group.add(sun);
        group.add(sun.target);
        R.sun = sun;
        R.sunDir.set(pos[0] * reach, Math.max(2.5, pos[1] * lift), pos[2] * reach).normalize();

        var fill = new THREE.DirectionalLight(skyLight, 0.16 + weather.cloud * 0.10);
        fill.position.set(cx - pos[0], Math.abs(pos[1]) * 0.45, cz - pos[2]);
        fill.target.position.set(cx, 0, cz);
        group.add(fill);
        group.add(fill.target);
    }

    /* A hole is built once, and the weather it is built under is baked into
       every material in it — the wetness of the grass, the softness of the
       shadows, the colour of the fill. That is why changing the weather
       rebuilds the hole rather than tweening: half of it is uniforms and would
       tween beautifully, and the other half is material state that would not,
       and a hole that is half sunny is worse than a cut. */
    function buildHole(hole, themeName, weatherKind) {
        var theme = G3.themeFor(themeName);
        var W = G3.weather;
        var weather = weatherKind || (W ? W.now : null) || { cloud: 0.4, fog: 1.3, sun: 1, amb: 1, sunSharp: 1, cloudTop: '#ffffff', cloudBase: '#b9c6d4', grade: {} };
        R.theme = theme;
        R.weather = weather;
        if (R.holeGroup) disposeGroup(R.holeGroup);
        R.movers = [];
        R.waterMats = [];
        R.shells = [];

        /* One set of surfaces per hole: the textures behind them are the
           theme's and are only redrawn when the theme changes (textures.js),
           and the materials are the weather's, which is what a hole is
           rebuilt for. */
        buildSurfaces(theme);

        var g = new THREE.Group();
        // The weather scales the theme's own fog, which is what makes mist a
        // different hole rather than a different filter over the same one.
        R.fogNear = 24 * weather.fog;
        R.fogFar = 95 * weather.fog;
        R.scene.fog = new THREE.Fog(skyTint(theme.fog, weather, false), R.fogNear, R.fogFar);
        g.add(skyDome(theme, weather));
        lights(g, hole, theme, weather);
        addSurround(g, hole, theme);

        var i;
        for (i = 0; i < hole.pads.length; i++) addPad(g, hole.pads[i], theme, hole.cup);
        for (i = 0; i < hole.walls.length; i++) addWall(g, hole.walls[i]);
        for (i = 0; i < hole.water.length; i++) addWater(g, hole.water[i], theme);
        addCup(g, hole);
        addTeeMark(g, hole);

        // The rain, the mist banks and whatever is drifting in the air are
        // parented to the hole, so the next hole disposes them with it.
        if (W) g.add(W.build(hole, theme, weather));
        if (R.fx) G3.postfx.setGrade(weather.grade);

        // Every water shader on the hole is told the same sky it is going to
        // be reflecting, once, here.
        for (i = 0; i < R.waterMats.length; i++) {
            var u = R.waterMats[i].uniforms;
            u.sunDir.value.copy(R.sunDir);
            u.sunColour.value.copy(lin(weather.warm || theme.sun));
            u.gloss.value = weather.sun;
            u.rain.value = weather.rain || 0;
            u.fogNear.value = R.fogNear;
            u.fogFar.value = R.fogFar;
            // An overcast sea reflects an overcast sky, not the blue one the
            // theme was drawn against.
            u.skyColour.value.copy(skyTint(theme.sky[1], weather, true)).lerp(lin(weather.cloudBase), weather.cloud * 0.8);
            u.fogColour.value.copy(skyTint(theme.fog, weather, false));
        }
        if (R.sky) R.sky.uniforms.sunDir.value.copy(R.sunDir);

        R.scene.add(g);
        R.holeGroup = g;
        R.smooth.started = false;
        // A new hole is a new world; nothing the last one's preview was
        // computed from can be assumed to mean the same thing.
        clearPathCache();
        R.clock = 0;
        R.cam.kick = 0;
        R.cam.speedPull = 0;
        clearTrail();
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

    // The axis, the camera's two lerp targets and the wind below are the
    // things this file would otherwise allocate on every single frame. They
    // are scratch: written before they are read, never held on to.
    var _axis = new THREE.Vector3();
    var _camPos = new THREE.Vector3();
    var _camTarget = new THREE.Vector3();
    var _wind = { x: 0.4, z: 0.9, speed: 0.5 };

    function rollBall(pos) {
        var dx = pos.x - R.lastBall.x, dz = pos.z - R.lastBall.z;
        var d = Math.hypot(dx, dz);
        if (d > 1e-5) {
            R.ball.rotateOnWorldAxis(_axis.set(dz / d, 0, -dx / d), d / C.BALL_R);
        }
        R.lastBall.set(pos.x, pos.y, pos.z);
        R.ball.position.set(pos.x, pos.y, pos.z);
    }

    /* The aiming furniture: a wedge on the ground pointing where the ball will
       set off, and the first stretch of the predicted path as dots. The path
       comes from the physics module rather than a formula of its own, which is
       why it is right about rails and ramps. */
    /* The predicted path, which is where the frame's time goes: three runs
       of the simulation, up to a second each, at a hundred and twenty steps
       a second. On the slowest hole in the game that is about six
       milliseconds — a third of a frame at 60Hz, and rather more than a
       frame on a phone — and it was being paid on every frame the player
       spent looking at a shot they had not changed.

       So it is computed when the shot changes and not otherwise. What the
       path depends on is small and knowable: where the ball is, where it is
       aimed, how hard, at what loft — and, on a hole with a gate or a blade
       on it, the clock, because those keep moving while you stand still.
       Only those holes pay anything at all while the aim is held, and even
       there at PATH_HZ rather than at the frame rate. The gate itself still
       moves every frame — syncMovers places it from the solver's own clock —
       so what is refreshed at PATH_HZ is the translucent band of the
       prediction, which is the one thing on screen already allowed to snap: a
       hair's difference in timing is what turns "through the gap" into "off
       the gate", and no smoothing would make that continuous anyway.

       Nothing has to be invalidated by hand. The geometry it writes is
       persistent, so a frame that skips the work leaves the last answer on
       screen — and the last answer is still the right one, because the
       inputs it was computed from are exactly what is being compared. */
    var PATH_HZ = 24;
    var _path = { valid: false, x: 0, y: 0, z: 0, yaw: 0, power: 0, loft: 0, t: 0 };

    function clearPathCache() { _path.valid = false; }

    function pathStale(world, aim) {
        var b = world.ball;
        // A hole with nothing moving on it has a path that does not depend
        // on the clock at all, so it is not in the comparison.
        var t = R.movers.length ? Math.floor(world.time * PATH_HZ) : 0;
        if (_path.valid && _path.x === b.x && _path.y === b.y && _path.z === b.z &&
            _path.yaw === aim.yaw && _path.power === aim.power &&
            _path.loft === aim.loft && _path.t === t) return false;
        _path.valid = true;
        _path.x = b.x; _path.y = b.y; _path.z = b.z;
        _path.yaw = aim.yaw; _path.power = aim.power; _path.loft = aim.loft;
        _path.t = t;
        return true;
    }

    function updatePath(world, aim, frac) {
        R.pathBuilds++;      // what the inspector counts (debug.js)
        // Touch is too coarse to load an exact number, so the plane spans a
        // spread of power either side of what is loaded — its two edges are
        // the lightest and heaviest this shot could actually be, and its
        // width at any point is how much air time is still in question there.
        var lo = Math.max(C.MIN_POWER, aim.power * 0.82);
        var hi = Math.min(C.MAX_POWER, aim.power * 1.18);
        var seconds = 0.5 + frac * 0.5;
        var perPath = R.pathPerPath;
        var i, k;

        var loPts = P.previewPath(world, aim.yaw, lo, aim.loft, seconds);
        var hiPts = P.previewPath(world, aim.yaw, hi, aim.loft, seconds);
        var midPts = P.previewPath(world, aim.yaw, aim.power, aim.loft, seconds);

        /* Under MIN_POWER there is no shot to preview: launch() refuses it and
           previewPath hands back nothing. Park the plane and the arrowhead
           rather than reading the last point of an empty path — which is what
           a freshly loaded hole does until the player winds a swing on. The
           wedge, the band and the ring are drawn by updateAim whatever this
           decides, because the shot line is worth showing before there is a
           shot. */
        R.pathPlane.visible = midPts.length > 1;
        R.pathHead.visible = midPts.length > 1;
        if (midPts.length < 2) return;

        var turn = -1;
        for (i = 1; i < midPts.length; i++) {
            if (midPts[i].bounce) { turn = i; break; }
        }

        var nSamples = Math.min(perPath, Math.min(loPts.length, hiPts.length));
        var segCount = Math.max(0, nSamples - 1);
        var turnFrac = (turn >= 0 && midPts.length > 1) ? turn / (midPts.length - 1) : -1;
        var turnSample = turnFrac >= 0 ? Math.round(turnFrac * segCount) : -1;

        var loArr = [], hiArr = [];
        for (i = 0; i < nSamples; i++) {
            var kl = Math.min(loPts.length - 1, Math.round(i * ((loPts.length - 1) / Math.max(1, nSamples - 1))));
            var kh = Math.min(hiPts.length - 1, Math.round(i * ((hiPts.length - 1) / Math.max(1, nSamples - 1))));
            loArr.push(loPts[kl]);
            hiArr.push(hiPts[kh]);
        }

        var pos = R.pathPlane.geometry.attributes.position.array;
        var col = R.pathPlane.geometry.attributes.color.array;
        for (i = 0; i < perPath - 1; i++) {
            var base = i * 6;
            if (i < segCount) {
                var shade = (1 - (i / segCount) * 0.4) * ((turnSample >= 0 && i >= turnSample) ? 0.5 : 1);
                putPathQuad(pos, base, loArr[i], hiArr[i], hiArr[i + 1], loArr[i + 1]);
                setPathQuadShade(col, base, shade);
            } else {
                for (var v = 0; v < 6; v++) pos[(base + v) * 3 + 1] = -999;
            }
        }
        R.pathPlane.geometry.attributes.position.needsUpdate = true;
        R.pathPlane.geometry.attributes.color.needsUpdate = true;
        R.pathPlane.geometry.computeBoundingSphere();

        // The arrowhead: where the loaded shot itself lands, or first meets a
        // wall — the one point in the plane that is actually being aimed at.
        var headIdx = turn >= 0 ? turn : midPts.length - 1;
        var headPos = midPts[headIdx];
        var prevPos = midPts[Math.max(0, headIdx - 1)];
        var hdx = headPos.x - prevPos.x, hdz = headPos.z - prevPos.z;
        var hlen = Math.hypot(hdx, hdz) || 1;
        hdx /= hlen; hdz /= hlen;
        var hpx = -hdz, hpz = hdx;
        var hs = 0.14 + frac * 0.05;
        var hp = R.pathHead.geometry.attributes.position.array;
        hp[0] = headPos.x - hpx * hs; hp[1] = headPos.y; hp[2] = headPos.z - hpz * hs;
        hp[3] = headPos.x + hpx * hs; hp[4] = headPos.y; hp[5] = headPos.z + hpz * hs;
        hp[6] = headPos.x + hdx * hs * 2; hp[7] = headPos.y; hp[8] = headPos.z + hdz * hs * 2;
        R.pathHead.geometry.attributes.position.needsUpdate = true;
        R.pathHead.geometry.computeBoundingSphere();
        R.pathHead.material.color.copy(R.arrow.material.color);
    }

    function updateAim(world, aim) {
        var show = !!(aim && aim.show && !world.moving && !world.sunk);
        R.aimGroup.visible = show;
        if (!show) return;

        var b = world.ball;
        var dirX = Math.sin(aim.yaw), dirZ = Math.cos(aim.yaw);
        var rawFrac = Math.max(0, Math.min(1, aim.power / C.MAX_POWER));
        // The wedge and band keep a floor so the shot direction is always
        // visible; the ring below uses the real fraction so it reads 0% at 0%.
        var frac = Math.max(0.08, rawFrac);
        var len = 0.7 + frac * 2.6;
        var halfW = 0.11 + frac * 0.05;
        var y = b.y - C.BALL_R + 0.02;

        // Wedge: a shaft and a head, six vertices, written straight into the
        // buffer so nothing is allocated per frame.
        var px = -dirZ, pz = dirX;   // perpendicular
        var a = R.arrow.geometry.attributes.position.array;
        function put(i, sx, sz) {
            a[i * 3] = b.x + dirX * sx + px * sz;
            a[i * 3 + 1] = y;
            a[i * 3 + 2] = b.z + dirZ * sx + pz * sz;
        }
        var shaft = len * 0.72;
        put(0, 0.22, -halfW); put(1, 0.22, halfW); put(2, shaft, halfW);
        put(3, 0.22, -halfW); put(4, shaft, halfW); put(5, shaft, -halfW);
        put(6, shaft, -halfW * 2.4); put(7, shaft, halfW * 2.4); put(8, len, 0);
        R.arrow.geometry.attributes.position.needsUpdate = true;
        R.arrow.geometry.computeBoundingSphere();

        // Green through amber to red as the swing fills, and hard red once it
        // is into the last of it.
        var hue = frac > C.OVERSWING ? 0 : 0.33 * (1 - frac / C.OVERSWING);
        R.arrow.material.color.setHSL(hue, 0.85, frac > C.OVERSWING ? 0.62 : 0.55);

        // The band, stretched out behind the ball by the same fraction.
        var ba = R.band.geometry.attributes.position.array;
        var back = 0.26 + frac * 2.2;
        function bandPut(i, sx, sz) {
            ba[i * 3] = b.x - dirX * sx + px * sz;
            ba[i * 3 + 1] = y;
            ba[i * 3 + 2] = b.z - dirZ * sx + pz * sz;
        }
        var tip = 0.05 + frac * 0.03;
        bandPut(0, 0.18, -0.13); bandPut(1, 0.18, 0.13); bandPut(2, back, tip);
        bandPut(3, 0.18, -0.13); bandPut(4, back, tip); bandPut(5, back, -tip);
        R.band.geometry.attributes.position.needsUpdate = true;
        R.band.geometry.computeBoundingSphere();
        R.band.material.color.copy(R.arrow.material.color);
        R.band.material.opacity = 0.25 + frac * 0.4;

        // The ring fills clockwise from the shot line as the power winds on.
        R.ring.position.set(b.x, y, b.z);
        R.ring.rotation.z = -aim.yaw;
        R.ring.geometry.setDrawRange(0, Math.max(3, Math.floor(R.ringCount * rawFrac / 3) * 3));
        R.ring.material.color.copy(R.arrow.material.color);
        R.ring.visible = rawFrac > 0.02;

        // The path is the expensive half of this function, and most frames
        // do not need it recomputed — see updatePath.
        if (pathStale(world, aim)) updatePath(world, aim, frac);
    }

    /* Camera. The player never flies it directly — there are three seats and V
       walks between them, and all three are placed off the aim line, which is
       what makes "drag left, aim left" true from any of them.

         follow   behind the ball, down the shot. The one you play from.
         side     square on to the shot, low. A ball's flight has a height as
                  well as a length in this game, and from behind the ball the
                  height is the one thing you cannot read: a wedge over a rail
                  and a wedge into it look identical until it lands. This is
                  the view that answers "will it clear".
         over     the whole hole from above, for working out where to go.

       Overview also thins the air out — see `atmosphere()`. */
    var VIEWS = ['follow', 'side', 'over'];

    function viewLabel(mode) {
        return mode === 'over' ? 'Overview' : (mode === 'side' ? 'Side on' : 'Follow');
    }

    function cycleView() {
        var i = VIEWS.indexOf(R.cam.mode);
        R.cam.mode = VIEWS[(i + 1) % VIEWS.length];
        return R.cam.mode;
    }

    function updateCamera(hole, ball, dt) {
        var c = R.cam;
        var tx, ty, tz, px, py, pz, dist;
        var bx = (hole.bounds.minX + hole.bounds.maxX) / 2;
        var bz = (hole.bounds.minZ + hole.bounds.maxZ) / 2;

        if (c.mode === 'over') {
            // Fit the pad bounding box: back off along the aim line far enough
            // that the hole's bounding radius is inside the narrower of the two
            // frustum half-angles, with a little air around it.
            var ex = (hole.bounds.maxX - hole.bounds.minX) / 2;
            var ez = (hole.bounds.maxZ - hole.bounds.minZ) / 2;
            var radius = Math.hypot(ex, ez) * 1.12;
            var vFov = R.camera.fov * Math.PI / 360;
            var hFov = Math.atan(Math.tan(vFov) * R.camera.aspect);
            dist = radius / Math.tan(Math.min(vFov, hFov));
            // How far back the map is standing, which is what the fog has to
            // be pushed past for the hole to be visible at all — see
            // atmosphere() below.
            R.overDist = dist;
            R.overRadius = radius;
            var tilt = 1.02;                  // ~58° down, so it still reads as 3D
            tx = bx; ty = 0; tz = bz;
            px = bx - Math.sin(c.yaw) * Math.cos(tilt) * dist;
            py = Math.sin(tilt) * dist;
            pz = bz - Math.cos(c.yaw) * Math.cos(tilt) * dist;
        } else if (c.mode === 'side') {
            /* Square on to the shot. The camera looks at a point down the aim
               line rather than at the ball, so the ball sits at one edge of the
               frame and the ground it has to cross fills the rest — which is
               the whole reason to be over here.

               Which side it stands on is not arbitrary: the two candidates are
               mirror images, and the useful one is whichever is further out of
               the hole, so the view is across the course rather than through a
               rail. It only swaps when the other side is clearly better, or a
               slow turn of the aim would send the camera sweeping through the
               ball every time the choice tipped over.

               How far down the shot it looks is half way to the cup, near
               enough — but never further than the frame can actually hold at
               the distance the zoom has asked for. A portrait phone has less
               than half the horizontal angle a laptop does, and the choice
               there is between seeing less of the hole and seeing all of it as
               a smudge on the horizon. Less of it, then; the zoom is a scroll
               away for anyone who wants the rest. */
            dist = (c.dist + c.speedPull) * 1.25;
            var sideV = R.camera.fov * Math.PI / 360;
            var sideH = Math.atan(Math.tan(sideV) * R.camera.aspect);
            var lead = Math.min(9, Math.max(3.5,
                Math.hypot(hole.cup.x - ball.x, hole.cup.z - ball.z) * 0.45));
            lead = Math.min(lead, Math.max(1.8, dist * Math.tan(sideH) * 0.95));
            var ax = Math.sin(c.yaw), az = Math.cos(c.yaw);
            tx = ball.x + ax * lead;
            ty = ball.y + 0.7;
            tz = ball.z + az * lead;

            var perpX = az, perpZ = -ax;            // the aim line, turned 90°
            var out = (tx - bx) * perpX + (tz - bz) * perpZ;
            var want = out >= 0 ? 1 : -1;
            if (c.sideSign !== want && Math.abs(out) > 0.6) c.sideSign = want;

            dist -= c.kick * C.KICK * 4;
            // Low: about fourteen degrees above the shot. Any higher and the
            // arc starts flattening into a plan view, which is the one thing
            // this seat exists not to be.
            px = tx + perpX * c.sideSign * dist;
            py = ty + dist * 0.25;
            pz = tz + perpZ * c.sideSign * dist;
        } else {
            /* Two things move the camera besides the player: it flinches when
               the ball is struck, and it drifts back as the ball gets quick, so
               a hard shot feels quick rather than merely distant. */
            dist = c.dist + c.speedPull - c.kick * C.KICK * 4;
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
            R.smooth.pos.lerp(_camPos.set(px, py, pz), k);
            R.smooth.target.lerp(_camTarget.set(tx, ty, tz), k);
        }
        R.camera.position.copy(R.smooth.pos);
        R.camera.lookAt(R.smooth.target);
    }

    /* Clearing the air for the map.

       An overview on a misty hole used to be a grey rectangle: the fog is set
       from the theme and scaled by the weather (buildHole), and both are
       chosen for a camera standing on the course, not one forty units above
       it. So is the rain, and so are the mist banks — which the overview looks
       at *through*, four sheets of it, from directly overhead.

       Rather than special-case the weather, the camera lifts it. `lift` runs 0
       to 1 with the view and eases over about a second, and three things ride
       on it: the fog's near and far are pushed out past whatever the map is
       standing back to, the rain and the mist thin out (weather.js's
       setAtmosphere), and the two markers below come up. Drop back to the
       course and every one of them returns to what the weather asked for.

       The weather on the ground is untouched: the hole is playing in exactly
       the mist it was, and looks it the moment you are back behind the ball. */
    function atmosphere(dt) {
        var want = R.cam.mode === 'over' ? 1 : 0;
        R.lift += (want - R.lift) * (1 - Math.pow(0.008, dt));
        if (R.lift < 0.002) R.lift = 0;
        if (R.lift > 0.998) R.lift = 1;

        var dist = R.overDist || 40, radius = R.overRadius || 20;
        // Past the far corner of the hole, with the horizon still fading —
        // a map with no distance at all reads as a cardboard cut-out.
        var near = Math.max(R.fogNear, dist * 0.85);
        var far = Math.max(R.fogFar, dist * 1.5 + radius * 2.2);
        if (R.scene.fog) {
            R.scene.fog.near = R.fogNear + (near - R.fogNear) * R.lift;
            R.scene.fog.far = R.fogFar + (far - R.fogFar) * R.lift;
        }
        // Not quite nothing: a trace of rain still falling says the hole has
        // not stopped being wet just because you are looking down at it.
        if (G3.weather) G3.weather.setAtmosphere(1 - R.lift * 0.86);
    }

    /* The two things the map has to show, and the two the eye loses first from
       forty units up: where the ball is and where it is going. A ring on the
       ground under the ball and a column of light standing in the cup, both
       drawn with the depth test off so a ridge between them hides neither, and
       both fading in with the lift rather than snapping on. */
    function buildMarkers() {
        R.marks = new THREE.Group();
        R.marks.visible = false;

        function flat(inner, outer, colour, opacity) {
            var geo = new THREE.RingGeometry(inner, outer, 40);
            geo.rotateX(-Math.PI / 2);
            var m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({
                color: colour, transparent: true, opacity: opacity,
                depthTest: false, depthWrite: false, fog: false,
                side: THREE.DoubleSide
            }));
            m.renderOrder = 8;
            return m;
        }

        R.markBall = flat(0.42, 0.58, 0xffffff, 0.9);
        R.markCup = flat(0.5, 0.72, 0xffd166, 0.9);

        // The beacon. Open-ended and unlit, so it reads as light rather than
        // as a post somebody could have hit the ball into.
        var geo = new THREE.CylinderGeometry(0.055, 0.14, 4.2, 10, 1, true);
        geo.translate(0, 2.1, 0);
        R.markBeacon = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({
            color: 0xffd166, transparent: true, opacity: 0.42,
            depthTest: false, depthWrite: false, fog: false,
            side: THREE.DoubleSide
        }));
        R.markBeacon.renderOrder = 8;

        R.marks.add(R.markBall, R.markCup, R.markBeacon);
        R.scene.add(R.marks);
    }

    function placeMarkers(hole, ball) {
        if (!R.marks) return;
        R.marks.visible = R.lift > 0.01;
        if (!R.marks.visible) return;
        R.markBall.position.set(ball.x, ball.y - C.BALL_R + 0.02, ball.z);
        R.markCup.position.set(hole.cup.x, hole.cup.y + 0.02, hole.cup.z);
        R.markBeacon.position.set(hole.cup.x, hole.cup.y, hole.cup.z);
        // A slow pulse on the ring under the ball, because from up here the
        // ball is four pixels across and a moving thing is easier to find.
        var pulse = 0.72 + 0.28 * Math.sin(R.clock * 2.4);
        R.markBall.material.opacity = 0.9 * R.lift * pulse;
        R.markCup.material.opacity = 0.9 * R.lift;
        R.markBeacon.material.opacity = 0.42 * R.lift;
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
        if (world.moving && speed > 1.2) {
            R.trailOn = true;
            pushTrail(world.ball.x, world.ball.y, world.ball.z);
        } else if (R.trailOn) {
            R.trailOn = false;
            clearTrail();
        }

        updateAim(world, aim);
        stepParticles(dt);
        updateCamera(world.hole, world.ball, dt);

        // The camera has moved; what the air is doing about it, and the two
        // markers that only exist while it is up there.
        atmosphere(dt);
        placeMarkers(world.hole, world.ball);

        // The weather runs off the camera, so it is stepped after the camera
        // has finished moving: the rain column, the motes and the mist banks
        // all follow it, and a frame's lag shows as a jitter at the edges.
        var wind = _wind;
        if (G3.weather) {
            G3.weather.update(dt, R.camera);
            wind = G3.weather.wind;
        }

        swayShells(wind);

        var i;
        for (i = 0; i < R.waterMats.length; i++) {
            var u = R.waterMats[i].uniforms;
            u.time.value = R.clock;
            // The same fog the lit materials are under, lifted and all: the
            // sea going grey while the greens beside it stay clear is the one
            // seam the whole trick would show through.
            if (R.scene.fog) {
                u.fogNear.value = R.scene.fog.near;
                u.fogFar.value = R.scene.fog.far;
            }
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
            R.pin.rotation.x = -R.pinLean + Math.sin(t * 29 + 1.2) * 0.05 * q;
        }

        // The cloth streams away from the wind, which means the swivel points
        // where the wind is going: the flag's own yaw, less the pin's.
        R.flagSwivel.rotation.y = yaw - R.pin.rotation.y + Math.PI / 2 +
            Math.sin(t * 1.7) * 0.10 * gust;

        var g = R.flagCloth.geometry.attributes.position;
        var rest = R.flagRest;
        var sag = (1 - gust) * 0.42;
        for (var i = 0; i < g.count; i++) {
            var lx = rest[i * 3];                 // 0 at the hoist, FLAG_W at the fly
            var f = lx / FLAG_W;
            var ripple = Math.sin(t * (5 + gust * 7) - lx * 7.5) * (0.02 + gust * 0.13) * f;
            g.setZ(i, ripple);
            // A limp flag falls, and it falls further the further out it is.
            g.setY(i, rest[i * 3 + 1] - sag * f * f - Math.abs(ripple) * 0.35);
        }
        g.needsUpdate = true;
        R.flagCloth.geometry.computeBoundingSphere();
    }

    /* ── effects the game asks for ──────────────────────────────────────── */

    function splashAt(x, y, z) { burst(x, y, z, 0x9fd8ff, 26, 2.6); }
    function sandAt(x, y, z) { burst(x, y, z, 0xe8d8a8, 14, 1.5); }
    /* The ball goes past the pin on its way in — nothing stops it, since the
       simulation has never heard of the pin — so the pin at least acknowledges
       it and rattles, which is what a real one does and what your ear is
       expecting when the cup sound plays. */
    function sinkAt(x, y, z) {
        burst(x, y + 0.1, z, 0xffe98a, 26, 2.2);
        R.pinShake = 1;
    }

    /* Whatever the ball was sitting on, sprayed backwards off the strike. */
    function divot(x, y, z, yaw, frac, kind) {
        var colour = kind === 'sand' ? 0xe8d8a8 : (kind === 'wood' ? 0xc79a63 : 0x6fbf5a);
        var n = 5 + Math.round(frac * 13);
        burst(x - Math.sin(yaw) * 0.1, y + 0.03, z - Math.cos(yaw) * 0.1,
            colour, n, 0.8 + frac * 2.2);
    }

    // The camera flinch. Decays in about a third of a second (see frame()).
    function punch(frac) { R.cam.kick = Math.max(R.cam.kick, 0.35 + frac * 0.65); }

    function setCam(patch) {
        for (var k in patch) if (Object.prototype.hasOwnProperty.call(patch, k)) R.cam[k] = patch[k];
    }

    G3.render = {
        init: init,
        resize: resize,
        buildHole: buildHole,
        frame: frame,
        splashAt: splashAt,
        sandAt: sandAt,
        sinkAt: sinkAt,
        divot: divot,
        punch: punch,
        setCam: setCam,
        cycleView: cycleView,
        viewLabel: viewLabel,
        cam: R.cam,
        // The bag picks against these, and nothing else needs them.
        pickAt: function (nx, ny) {
            return G3.bag ? G3.bag.pick(nx, ny, R.camera, R.scene) : null;
        },
        state: R,
        THEMES: G3.THEMES,
        // What the HUD needs to name the sky it is standing under.
        get weather() { return R.weather; }
    };

})(window.G3);
