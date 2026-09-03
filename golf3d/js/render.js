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
        holeGroup: null, ball: null, aimGroup: null, pathCone: null, pathHead: null, arrow: null,
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
            /* Where the player has walked round to, measured off the aim line
               rather than off the world: the shot still turns the camera with
               it, and this is the angle it is watched from. Zero is straight
               behind the ball, and a new hole puts it back there. It is an
               offset on whichever seat `mode` has chosen, so the dial still
               walks you round a hole you are looking at side on or from above. */
            view: 0,
            /* …unless the camera is locked, in which case it is measured off
               `bearing` — a fixed direction in the world — and the aim is free
               to turn underneath it without dragging the picture round. */
            lock: false, bearing: 0,
            kick: 0,          // impact flinch, decays
            speedPull: 0      // extra distance while the ball is quick
        },
        smooth: { pos: new THREE.Vector3(), target: new THREE.Vector3(), started: false },
        particles: null, pAlive: 0,
        marks: null,           // the overview's ball ring and the two at the cup
        lift: 0,               // 0 on the course, 1 overhead; see atmosphere()
        fly: null,             // the intro sweep while one is running; see flyCamera()
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

        /* Predicted path, as a cone. It follows the arc the ball will fly —
           real physics, sampled — and opens out sideways as it goes, by the
           spread the shot will actually be played with: nothing inside a full
           swing, which draws a narrow wedge that means "exactly here", and a
           wide mouth on an overdrawn one, which means "somewhere in this".

           Four components across the strip in place of three, so the colour
           attribute carries an alpha and the far end can be faded out rather
           than chopped off. That fade is the point: the cone is cut at
           CONE_RANGE and goes quiet on the way, so it never draws a promise
           about a stretch of hole it has not simulated. */
        var perPath = 48;
        R.pathPerPath = perPath;
        /* Scratch for the cone: the centreline and its two edges, one object
           per sample, allocated once. The preview runs on the frame and this
           is the one place it would otherwise churn a hundred and fifty
           vectors a rebuild. */
        R.coneMid = []; R.coneL = []; R.coneR = [];
        for (var ci = 0; ci < perPath; ci++) {
            R.coneMid.push({ x: 0, y: 0, z: 0, d: 0 });
            R.coneL.push({ x: 0, y: 0, z: 0 });
            R.coneR.push({ x: 0, y: 0, z: 0 });
        }
        R.coneHead = { x: 0, y: 0, z: 0 };
        R.coneBack = { x: 0, y: 0, z: 0 };
        var pvcount = (perPath - 1) * 6;
        var pg = new THREE.BufferGeometry();
        pg.setAttribute('position', new THREE.Float32BufferAttribute(new Array(pvcount * 3).fill(0), 3));
        pg.setAttribute('color', new THREE.Float32BufferAttribute(new Array(pvcount * 4).fill(1), 4));
        R.pathCone = new THREE.Mesh(pg, new THREE.MeshBasicMaterial({
            color: 0xffffff, transparent: true, opacity: 1, side: THREE.DoubleSide,
            vertexColors: true, depthTest: false
        }));
        R.pathCone.renderOrder = 6;
        R.pathCone.frustumCulled = false;
        R.aimGroup.add(R.pathCone);

        /* A hairline down the middle of the cone, on the same samples and in
           the same pass. The cone answers "how sure is this", which is the
           question that matters once the meter is past a full swing — and in
           answering it, a soft-edged fan a metre wide stopped answering the
           plainer one underneath: *where exactly is this going*. So the centre
           gets a line. It is added after the cone and shares its render order,
           so it lands on top of it, and it is the only new geometry the
           preview draws. */
        var lg = new THREE.BufferGeometry();
        lg.setAttribute('position', new THREE.Float32BufferAttribute(new Array(pvcount * 3).fill(0), 3));
        lg.setAttribute('color', new THREE.Float32BufferAttribute(new Array(pvcount * 4).fill(1), 4));
        R.pathLine = new THREE.Mesh(lg, new THREE.MeshBasicMaterial({
            color: 0xffffff, transparent: true, opacity: 1, side: THREE.DoubleSide,
            vertexColors: true, depthTest: false
        }));
        R.pathLine.renderOrder = 6;
        R.pathLine.frustumCulled = false;
        R.aimGroup.add(R.pathLine);
        // Its own edges, so filling it cannot disturb the cone's.
        R.lineL = []; R.lineR = [];
        for (ci = 0; ci < perPath; ci++) {
            R.lineL.push({ x: 0, y: 0, z: 0 });
            R.lineR.push({ x: 0, y: 0, z: 0 });
        }

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

    /* One quad of the cone, as two triangles: pA-pB-pC and pA-pC-pD. A and B
       are the near edge of the strip, C and D the far one, which is what lets
       the shading below fade along the cone rather than across it. */
    function putPathQuad(arr, base, pA, pB, pC, pD) {
        var idx = base * 3;
        arr[idx] = pA.x; arr[idx + 1] = pA.y; arr[idx + 2] = pA.z;
        arr[idx + 3] = pB.x; arr[idx + 4] = pB.y; arr[idx + 5] = pB.z;
        arr[idx + 6] = pC.x; arr[idx + 7] = pC.y; arr[idx + 8] = pC.z;
        arr[idx + 9] = pA.x; arr[idx + 10] = pA.y; arr[idx + 11] = pA.z;
        arr[idx + 12] = pC.x; arr[idx + 13] = pC.y; arr[idx + 14] = pC.z;
        arr[idx + 15] = pD.x; arr[idx + 16] = pD.y; arr[idx + 17] = pD.z;
    }

    /* The same quad's colour: a brightness and an alpha at each end of it.
       Vertices 0, 1 and 3 are the near edge and 2, 4 and 5 the far one — the
       order putPathQuad writes them in. */
    var QUAD_FAR = [0, 0, 1, 0, 1, 1];

    function setPathQuadShade(col, base, shadeA, alphaA, shadeB, alphaB) {
        var idx = base * 4;
        for (var v = 0; v < 6; v++) {
            var far = QUAD_FAR[v];
            var shade = far ? shadeB : shadeA;
            var i = idx + v * 4;
            col[i] = col[i + 1] = col[i + 2] = shade;
            col[i + 3] = far ? alphaB : alphaA;
        }
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
    /* The turf splice, as one function every shell material points at. The
       GLSL is shaders.js's; this is only the plumbing, and it is the same
       plumbing for every layer — three.js's own program cache keys on the
       ALPHATEST define, so the six layers still compile the six programs they
       always did and share this source between them. */
    function turfShader(shader) {
        /* `this` is the material — onBeforeCompile is called as a method — and
           the mow width rides on it rather than being baked in here, because
           three keys its program cache on this function's own source text.
           One source, one program, one uniform per material: a fairway gets
           the gang mower's wider stripe, a green gets none at all (mowK 0,
           which lands the stripe term on its own midpoint and leaves the
           colour alone), and it costs a uniform rather than a shader apiece. */
        shader.uniforms.mowK = { value: this.userData.mowK };
        shader.vertexShader = SH.TURF_VS_HEAD +
            shader.vertexShader.replace('#include <begin_vertex>', SH.TURF_VS_BODY);
        shader.fragmentShader = SH.TURF_FS_HEAD +
            shader.fragmentShader.replace('#include <alphatest_fragment>', SH.TURF_FS_BODY);
    }

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

        /* Greens and fairways are the same turf, and this is where they stop
           being the same: a fairway is mown longer, so it is darker, flatter
           and rougher under the light — and it is the one of the two that is
           striped, so it wears the banded map (textures.js, grassTexture)
           while the green wears the plain one. */
        var fairway = new THREE.MeshPhongMaterial({
            map: tex.fairway,
            bumpMap: tex.greenBump,
            bumpScale: 0.055 + wet * 0.03,
            color: damp.clone().multiplyScalar(0.80),
            shininess: 2 + wet * 14,
            specular: new THREE.Color(0x141d12).lerp(new THREE.Color(0x3d4b50), wet)
        });

        var top = {
            fairway: fairway,
            /* Sand is the one flat surface with a height field of its own.
               The rake marks are drawn into the colour map as light and shade,
               which is a picture of them; the bump map is what makes the sun
               actually cross them — and the same light that does that is what
               finds the dish in a scooped bunker (courses.scoop) instead of
               leaving it a beige patch of the wrong shape. Wet sand is darker,
               flatter and shinier: rain fills the furrows in. */
            sand: (function () {
                var m = tops(tex.sand, 4 + wet * 60, 0x000000, 0x9aa4ac);
                m.bumpMap = tex.sandBump;
                m.bumpScale = 0.09 * (1 - wet * 0.6);
                return m;
            })(),
            wood: tops(tex.wood, 8 + wet * 80, 0x151515, 0xb0bcc4),
            /* Ice gets the hardest specular on the course and the whitest
               highlight, because that is the only thing separating it from a
               pale patch of floor: the texture underneath it is depth and this
               is the surface over the top of it. Rain barely changes it —
               water on ice is still ice — so unlike every other surface here
               the wet term only takes it a little further the way it already
               was. */
            ice: tops(tex.ice, 90 + wet * 40, 0xdff0ff, 0xffffff),
            rough: tops(tex.rough, 3 + wet * 40, 0x000000, 0x7d8a92),
            // The greens get the most of everything: a bump map of the same
            // blades that are in the colour map, so the light rakes across the
            // turf rather than lying on it flat. No bands in that colour map
            // and no stripe in the shells below — a green is cut in one
            // direction and reads as one tone.
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
                slab: [top[k], side],
                /* An inlay is laid flush into the ground and is only lifted at
                   all to stop it z-fighting with what it is laid into, so the
                   twelve millimetres of wall round its edge is a rendering
                   artefact rather than a step. Painting that wall in cut earth
                   drew a brown ring round every green on the links; painting it
                   in the surface's own turf makes it what it is, which is
                   nothing. */
                inlay: [top[k], top[k]]
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

           Three numbers climb with the layer and one shader is spliced in.

           `alphaTest` climbs, so each shell keeps only the blades that reach
           it: the bottom one takes nearly everything, which is what hides the
           pad, and the top one takes the tallest fifth. The colour climbs too,
           because the bottom of a stand of grass is in the shade of the rest
           of it — and the last of it warms towards the light, which is the
           cheap version of the sun coming *through* a blade. Lit rather than
           unlit, so the sun rakes across the turf and a shell in the shadow of
           a rail goes dark with the pad under it.

           The splice is shaders.js's TURF, and it is what makes a course of
           tiled sheets stop looking like a course of tiled sheets: patches at
           a scale no tile has, and the mower's stripes in the light rather
           than only in the lie of the blades. */
        function shells(kind, tex, base, layers, mow) {
            var out = [], i, f, mat;
            var warm = new THREE.Color('#dff0ae');
            for (i = 0; i < layers; i++) {
                f = (i + 0.3) / layers;
                mat = new THREE.MeshLambertMaterial({
                    map: tex,
                    /* Never quite 0 — a layer that keeps every texel is a
                       sheet of grass-coloured film lying over the pad — and
                       never quite 1, or the top shell is empty on a hole where
                       the turf shader has thinned it. */
                    alphaTest: 0.05 + (layers > 1 ? i / (layers - 1) : 0) * 0.74,
                    color: new THREE.Color(base)
                        .multiplyScalar((0.40 + 0.68 * f) * (1 - wet * 0.24))
                        .lerp(warm, f * f * 0.16 * (1 - wet)),
                    // Opaque with a cut-out, not blended: alphaTest writes
                    // depth, so six layers sort themselves and cost no more
                    // than six opaque draws.
                    transparent: false,
                    side: THREE.FrontSide
                });
                // Zero is a width, not a missing argument: it is the green,
                // asking for no stripe. Hence the explicit test.
                mat.userData.mowK = mow === 0 ? 0 : Math.PI / (mow || TX.MOW);
                mat.onBeforeCompile = turfShader;
                out.push(mat);
            }
            return out;
        }

        R.surf = {
            pads: pads,
            // The cut earth under a pad, shared by every pad on the hole — and
            // by the skirt under a piece of terrain, which is the same stuff.
            side: side,
            shells: {
                // No stripe on a green: the bands in the shader are the
                // fairway's cut, and a green that carries them is a green
                // wearing a fairway's coat (textures.js, SCALE).
                green: shells('green', TX.shellFor('green'), theme.grass[1],
                    SHELL_LAYERS, 0),
                // The same blades, darker, and striped at the width the
                // fairway's own map is banded at so the two patterns agree.
                fairway: shells('fairway', TX.shellFor('fairway'),
                    new THREE.Color(theme.grass[1]).multiplyScalar(0.84).getStyle(),
                    SHELL_LAYERS, TX.MOW_WIDE),
                rough: shells('rough', TX.shellFor('rough'), '#3c6b34', SHELL_LAYERS)
            },
            walls: {
                rail: paint(theme.rail),
                blade: paint(0xd8523f),
                gate: paint(0xe0a13a),
                // A bumper is meant to be aimed at, so it is the one thing on a
                // hole painted a colour nothing else on it wears.
                bumper: paint(0xf0409a),
                beam: paint(0x9a6a3c),
                // A tree is not drawn as a box (see addTree); this is only
                // what its trunk is made of, and it is matt because bark is.
                tree: new THREE.MeshLambertMaterial({
                    color: new THREE.Color(0x6b503a).multiplyScalar(1 - wet * 0.25)
                })
            },
            // Two leaf greens, so a treeline is not one colour repeated.
            leaf: [
                new THREE.MeshLambertMaterial({
                    color: new THREE.Color(0x3d7a32).multiplyScalar(1 - wet * 0.22)
                }),
                new THREE.MeshLambertMaterial({
                    color: new THREE.Color(0x59993f).multiplyScalar(1 - wet * 0.22)
                })
            ],
            post: new THREE.MeshLambertMaterial({ color: 0x6b7280 })
        };
    }

    function padMaterial(kind, shape) {
        var set = R.surf.pads[kind] || R.surf.pads.green;
        return set[shape] || set.box;
    }

    /* The tiling, baked in — and anchored to the world rather than to the pad.

       Every one of these surfaces is a flat top seen from above, so the honest
       UV for it is simply where it is: divide the world x and z by the tile
       size and the texture lies over the course like a sheet, continuous
       across every seam. Written from the *positions* rather than scaled from
       whatever UVs the geometry arrived with, which also means a box, an
       extruded slab and a plane all come out of here agreeing with each other
       — they did not, before, and the mow bands restarting at every pad edge
       was the visible half of that.

       The geometry is in pad-local coordinates at this point, so the pad's own
       centre is what turns it into a world one. A box's vertical faces get
       nonsense UVs out of this and do not care: they wear the earth-coloured
       side material, which has no map on it at all. */
    function worldUv(geo, scale, cx, cz) {
        var uv = geo.attributes.uv, pos = geo.attributes.position, i;
        if (!uv) return;
        for (i = 0; i < uv.count; i++) {
            uv.setXY(i, (cx + pos.getX(i)) / scale, (cz + pos.getZ(i)) / scale);
        }
        uv.needsUpdate = true;
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

    /* ── the grass ──────────────────────────────────────────────────────

       How many shells a green gets, and how tall the mat is. Six is where the
       stack stops reading as stripes from a low camera; a phone gets four,
       because the shells are the one thing here that costs a draw call per
       pad per layer and a phone is where that shows first.

       A fairway gets the same six half again as tall, and the rough the same
       six at twice the height with a wilder lean — which, with the darker
       materials above, is the whole of what tells the three grasses apart
       from a low camera. */
    var SHELL_LAYERS = (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) ? 4 : 6;
    var SHELL_HEIGHT = { green: 0.115, fairway: 0.165, rough: 0.26 };
    /* How far the tips lean, per unit of wind. Each is about 40% of that kind's
       height, so a full gale bends the mat over by half its own height and no
       further — past that the top of the stack visibly slides off the bottom
       of it, which is the one way this technique gives itself away. */
    var SHELL_SWAY = { green: 0.045, fairway: 0.065, rough: 0.10 };

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
    function addShells(group, pad, cup, holed, cx, cy, cz, shape) {
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
            var f = (i + 0.3) / set.length;
            var geo;
            if (shape) {
                // The ground's own surface, lifted — see the note on
                // TERRAIN_RES for why this is a clone and not a second sample.
                geo = shape.clone();
                var tp = geo.attributes.position, t;
                for (t = 0; t < tp.count; t++) tp.setY(t, tp.getY(t) + height * f);
                tp.needsUpdate = true;
            } else if (holed) {
                geo = shellShape(pad, cup);
            } else if (pad.r) {
                geo = shellShape(pad, null);
            } else {
                geo = new THREE.PlaneGeometry(pad.w, pad.d, 1, 1);
                geo.rotateX(-Math.PI / 2);
            }
            // The same world anchoring the pad under it got, at the finer
            // scale the blades tile at — which is what carries the mow bands
            // unbroken from one pad to the next.
            worldUv(geo, TX.SHELL_SCALE[pad.kind], cx, cz);
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
            mesh.position.set(cx, cy + (pad.bumps ? 0 : height * f) +
                (pad.r ? INLAY_LIFT : 0), cz);
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
    /* A round pad's outline as a Shape, in the coordinates the two extruders
       below build in: x is world x and y is *minus* world z, which is what the
       rotateX(-90°) after them undoes. So the shape's own angle runs backwards
       against the world's, and the radius has to be asked for at -b.

       A disc with no wave on it comes out as the circle absarc used to draw.
       One with a wave comes out as a polygon fine enough that the chord never
       cuts more than a few millimetres inside the curve — which matters,
       because the grass mat around this pad is conformed to the *curve*
       (cutUnder) and a coarse outline here would show as a hairline of ground
       between the two. */
    function discShape(pad) {
        var shape = new THREE.Shape();
        if (!pad.wave) {
            shape.absarc(0, 0, pad.r, 0, Math.PI * 2, false);
            return shape;
        }
        var n = Math.max(64, Math.ceil(2 * Math.PI * pad.r / 0.18)), i, b, rr;
        for (i = 0; i < n; i++) {
            b = i / n * Math.PI * 2;
            rr = P.padRadius(pad, -b);
            if (i) shape.lineTo(Math.cos(b) * rr, Math.sin(b) * rr);
            else shape.moveTo(Math.cos(b) * rr, Math.sin(b) * rr);
        }
        shape.closePath();
        return shape;
    }

    function shellShape(pad, cup) {
        var hw = pad.w / 2, hd = pad.d / 2;
        var shape = pad.r ? discShape(pad) : new THREE.Shape();
        if (pad.r) {
            // …the outline is the disc's own, built above.
        } else {
            shape.moveTo(-hw, -hd);
            shape.lineTo(hw, -hd);
            shape.lineTo(hw, hd);
            shape.lineTo(-hw, hd);
            shape.lineTo(-hw, -hd);
        }
        if (cup) {
            var hole = new THREE.Path();
            var cx = pad.x + hw, cz = pad.z + hd;
            // A shade wider than the cup, so no blade hangs over the rim.
            hole.absarc(cup.x - cx, -(cup.z - cz), C.HOLE_R * 1.08, 0, Math.PI * 2, true);
            shape.holes.push(hole);
        }
        var geo = new THREE.ShapeGeometry(shape, 36);
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

    /* How far down a pad's sides have to go, which is a different question
       from how far down they *can* go.

       A pad's slab used to reach the surrounding ground whatever was in
       between, because that was the only number to hand: courses.js says what
       a pad is, never what is underneath it. On a hole with a raised green
       standing on the fairway below — Tabletop's table on its apron, any tier
       on any course — that meant a metre and a half of side wall driven
       straight through the pad it stands on, two surfaces crossing inside each
       other and a seam flickering along the intersection wherever the depth
       buffer could not choose. From the overview, which is the view that puts
       a raised green against the ground beside it in every frame, that seam
       was the first thing the eye found.

       So the slab stops at the first surface below it instead: the highest pad
       whose footprint this one overlaps, measured over the overlap rather than
       at a centre that may not be inside it at all, so a ramp underneath is
       read where it actually passes. A pad over water, or over nothing, finds
       no support and reaches the surround exactly as before. */
    function supportUnder(pads, pad, cy) {
        if (!pads) return null;
        var best = null;
        for (var i = 0; i < pads.length; i++) {
            var q = pads[i];
            if (q === pad) continue;
            var x0 = Math.max(pad.x, q.x), x1 = Math.min(pad.x + pad.w, q.x + q.w);
            var z0 = Math.max(pad.z, q.z), z1 = Math.min(pad.z + pad.d, q.z + q.d);
            if (x1 - x0 < 0.05 || z1 - z0 < 0.05) continue;
            // A plane's highest point over a rectangle is one of its corners.
            var top = Math.max(
                P.padHeight(q, x0, z0), P.padHeight(q, x1, z0),
                P.padHeight(q, x0, z1), P.padHeight(q, x1, z1));
            if (top > cy - 0.1) continue;          // level with it, or above it
            if (best === null || top > best) best = top;
        }
        return best;
    }

    /* ── shaped pads ────────────────────────────────────────────────────

       Two pad shapes the older courses never needed, both of them for
       Whinstone Links, and both drawn from the same two questions the solver
       asks the ground: how high is it here, and what shape is its footprint.
       Nothing below re-derives a height — every vertex is `padHeight`, so the
       picture and the simulation cannot drift apart on a hillside any more
       than they can on a ramp.

         a disc     an outline that is a circle rather than a rectangle. Built
                    as an extruded shape, which is the same code the cup's own
                    pad has always used, so a round green punches its hole
                    exactly as a square one does.
         terrain    a rectangle whose top is subdivided and pushed up and down
                    by `padHeight`, with a skirt round its outline. This is the
                    rolling ground.

       The grass over a piece of terrain is the *same geometry* as the terrain,
       cloned and lifted, rather than a second surface sampled from the same
       height field. That is not a saving, it is a correctness rule. Sampled
       independently at a coarser step the mat cuts the corner off every hump
       it crosses — sinking into the ground on the convex half and floating off
       it on the concave half — and a hillside comes out streaked with bright
       crescents where the two surfaces cross. Cloned, they cannot disagree,
       because there is only one surface.

       Which makes TERRAIN_RES the one judgement call: it is paid seven times
       over on every pad, so it is a metre and a bit rather than the half metre
       the ground alone would like. A dune is five to eleven units across, so
       that is still ten segments and more over the interesting part of one,
       and nothing on the course shows a facet. */
    var TERRAIN_RES = 1.0;
    // A disc green is laid *into* the ground at the same height, so its top
    // face and the terrain's are coplanar. A hair of lift is what stops the
    // two z-fighting over the whole green; it is a third of a millimetre at
    // the scale of the ball and no ball has ever noticed it.
    var INLAY_LIFT = 0.012;

    // The outline of a pad, as world-space points, going round once. Used for
    // the skirt below and nowhere else — everything that needs the *inside*
    // of a pad asks physics.
    function padOutline(pad, step) {
        var pts = [], i, n, a;
        var cx = pad.x + pad.w / 2, cz = pad.z + pad.d / 2;
        if (pad.r) {
            n = Math.max(24, Math.ceil(2 * Math.PI * pad.r / step));
            for (i = 0; i < n; i++) {
                a = i / n * Math.PI * 2;
                var rr = P.padRadius(pad, a);
                pts.push([cx + Math.cos(a) * rr, cz + Math.sin(a) * rr]);
            }
            return pts;
        }
        var sides = [
            [pad.x, pad.z, pad.x + pad.w, pad.z],
            [pad.x + pad.w, pad.z, pad.x + pad.w, pad.z + pad.d],
            [pad.x + pad.w, pad.z + pad.d, pad.x, pad.z + pad.d],
            [pad.x, pad.z + pad.d, pad.x, pad.z]
        ];
        for (i = 0; i < sides.length; i++) {
            var s0 = sides[i];
            var len = Math.hypot(s0[2] - s0[0], s0[3] - s0[1]);
            n = Math.max(1, Math.round(len / step));
            for (var k = 0; k < n; k++) {
                var t = k / n;
                pts.push([s0[0] + (s0[2] - s0[0]) * t, s0[1] + (s0[3] - s0[1]) * t]);
            }
        }
        return pts;
    }

    /* The wall of earth under a piece of terrain: one quad per outline segment,
       from the ground down to `base`. A box would not do — the top of a box is
       flat and the whole point of this pad is that its top is not. */
    function skirtGeometry(pad, base, cx, cy, cz) {
        var pts = padOutline(pad, TERRAIN_RES * 2);
        var n = pts.length;
        var pos = new Float32Array(n * 6 * 3);
        var i, j = 0, a, b, ay, by;
        for (i = 0; i < n; i++) {
            a = pts[i]; b = pts[(i + 1) % n];
            ay = P.padHeight(pad, a[0], a[1]) - cy;
            by = P.padHeight(pad, b[0], b[1]) - cy;
            var ax = a[0] - cx, az = a[1] - cz, bx = b[0] - cx, bz = b[1] - cz;
            // Two triangles, wound so the outside faces out.
            pos[j++] = ax; pos[j++] = ay; pos[j++] = az;
            pos[j++] = bx; pos[j++] = base; pos[j++] = bz;
            pos[j++] = bx; pos[j++] = by; pos[j++] = bz;
            pos[j++] = ax; pos[j++] = ay; pos[j++] = az;
            pos[j++] = ax; pos[j++] = base; pos[j++] = az;
            pos[j++] = bx; pos[j++] = base; pos[j++] = bz;
        }
        var geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        geo.computeVertexNormals();
        return geo;
    }

    /* Cut the ground away under anything laid into it.

       An inlay — a round green, a bunker — sits a hair above the terrain and
       is opaque, so at first glance the ground beneath it cannot matter. It
       does, twice. The terrain grows grass, and a stack of blades a sixth of a
       unit tall goes straight up through a bunker that is only twelve
       millimetres above it: sand with a lawn on it. And the cup is a hole
       punched through the green, so the ground behind that hole is what you
       see when you look into it — an unbroken sheet of turf where the hole
       should be, which is a green with no hole in it at all.

       The ground and the grass on it want opposite rules, and get them.

       The *ground* loses only triangles that are entirely under an inlay,
       because it must not leave a gap: cut it any harder and there is a ragged
       hole of open sky a grid cell wide around every green on the course. What
       survives inside the rim is hidden under the disc, so it costs nothing.

       The *grass* may not keep a single blade inside one, because it is a
       sixth of a unit tall and the disc is twelve millimetres up: one
       surviving triangle is a tuft standing in the sand. It used to lose every
       triangle with so much as a corner under an inlay, and that left a grid
       cell of bare ground all the way round every green and every bunker on
       the course — a pale, stair-stepped ring, cut to the terrain grid rather
       than to the thing it was supposed to be a collar for. It read as a
       mistake because it was one: the shape of it came from the mesh and not
       from the hole.

       So the grass is *conformed* to the outline instead. A triangle wholly
       inside an inlay goes, as before; a triangle that straddles the rim keeps
       its place and has each corner that fell inside pulled out onto the
       outline itself — radially, and back onto the ground's own height field
       at its new spot, so the mat still lies on the ground it grew from. The
       mesh is indexed, so a corner moved for one triangle moves for every
       triangle that shares it and the mat cannot tear. What comes out is grass
       that stops exactly where the green starts, on the same curve the disc is
       drawn from and with no ground showing between the two. */
    function cutUnder(geo, cover, cx, cz, any, pad, cy) {
        var pos = geo.attributes.position, idx = geo.index;
        if (!idx || !cover.length) return geo;
        var inside = new Uint8Array(pos.count), i, j;
        for (i = 0; i < pos.count; i++) {
            for (j = 0; j < cover.length; j++) {
                if (P.padContains(cover[j], cx + pos.getX(i), cz + pos.getZ(i))) {
                    inside[i] = j + 1;
                    break;
                }
            }
        }
        var keep = [], stays = new Uint8Array(pos.count), a, b, c, n;
        for (i = 0; i < idx.count; i += 3) {
            a = idx.getX(i); b = idx.getX(i + 1); c = idx.getX(i + 2);
            n = !!inside[a] + !!inside[b] + !!inside[c];
            if (n === 3) continue;              // wholly under an inlay: gone
            keep.push(a, b, c);
            stays[a] = stays[b] = stays[c] = 1;
        }
        geo.setIndex(keep);
        /* And then the corners that stayed while standing inside something —
           in a second pass, so that a vertex is moved once whichever of its
           triangles is walked first, and so that the walk above sees every
           triangle in the shape it was built with. */
        if (any) {
            for (i = 0; i < pos.count; i++) {
                if (inside[i] && stays[i]) {
                    conform(pos, i, cover[inside[i] - 1], cx, cz, pad, cy);
                }
            }
            pos.needsUpdate = true;
        }
        return geo;
    }

    /* One vertex of the grass mat, pushed out of an inlay and onto its edge.

       Straight out from the inlay's middle, which is not quite the nearest
       point on a waved outline but is within a millimetre of it at the depth
       of wave a green carries — and unlike the nearest point it cannot fold
       two neighbouring vertices onto the same place. The height comes back
       off the pad the mat belongs to, because the vertex has moved across
       ground that rolls. */
    function conform(pos, i, inlay, cx, cz, pad, cy) {
        var qx = inlay.x + inlay.w / 2, qz = inlay.z + inlay.d / 2;
        var dx = cx + pos.getX(i) - qx, dz = cz + pos.getZ(i) - qz;
        var d = Math.hypot(dx, dz);
        var ang = d > 1e-6 ? Math.atan2(dz, dx) : 0;
        var rr = P.padRadius(inlay, ang);
        var wx = qx + Math.cos(ang) * rr, wz = qz + Math.sin(ang) * rr;
        pos.setX(i, wx - cx);
        pos.setZ(i, wz - cz);
        if (pad) pos.setY(i, P.padHeight(pad, wx, wz) - cy);
    }

    /* One axis of the terrain grid, as a list of coordinates rather than a
       segment count — which is the whole reason this is not PlaneGeometry any
       more. A pad that holds the cup needs a square hole in it for the cup's
       own patch, and a hole cut at the nearest grid line is a hole in the
       wrong place. Insert the cut's two edges into the coordinate list and
       drop the grid lines between them, and the hole comes out exactly where
       it was asked for with the quads around it still meeting it corner to
       corner. */
    function axis(a, b, res, cut) {
        var n = Math.max(1, Math.round((b - a) / res)), i, t, v = [];
        for (i = 0; i <= n; i++) {
            t = a + (b - a) * i / n;
            if (cut && t > cut[0] - 1e-4 && t < cut[1] + 1e-4) continue;
            v.push(t);
        }
        if (cut) v.push(cut[0], cut[1]);
        v.sort(function (p, q) { return p - q; });
        return v;
    }

    /* A rectangle of ground, subdivided and pushed into shape by the same
       function the ball stands on — with a square missing from it where the
       cup goes, if this is the pad the cup is cut into.

       Indexed, because the ground is meant to be smooth: `computeVertexNormals`
       on a shared vertex averages the faces that meet there, and on a
       non-indexed grid every triangle would get its own normal and a dune
       would come out looking like a pile of shards. */
    function terrainGeometry(pad, res, cx, cy, cz, cut, cover, anyCut) {
        var xs = axis(-pad.w / 2, pad.w / 2, res, cut && [cut.x - cut.h, cut.x + cut.h]);
        var zs = axis(-pad.d / 2, pad.d / 2, res, cut && [cut.z - cut.h, cut.z + cut.h]);
        var nx = xs.length, nz = zs.length;
        var pos = new Float32Array(nx * nz * 3);
        var uv = new Float32Array(nx * nz * 2);
        var idx = [], i, j, k;

        for (i = 0; i < nx; i++) {
            for (j = 0; j < nz; j++) {
                k = i * nz + j;
                pos[k * 3] = xs[i];
                pos[k * 3 + 1] = P.padHeight(pad, cx + xs[i], cz + zs[j]) - cy;
                pos[k * 3 + 2] = zs[j];
            }
        }
        for (i = 0; i < nx - 1; i++) {
            for (j = 0; j < nz - 1; j++) {
                if (cut &&
                    xs[i] >= cut.x - cut.h - 1e-4 && xs[i + 1] <= cut.x + cut.h + 1e-4 &&
                    zs[j] >= cut.z - cut.h - 1e-4 && zs[j + 1] <= cut.z + cut.h + 1e-4) continue;
                var a = i * nz + j, b = i * nz + j + 1;
                var c = (i + 1) * nz + j + 1, d = (i + 1) * nz + j;
                // Wound so the face looks up: see the note on the plane's own
                // rotation above — a triangle going round this way in x/z has
                // its normal along +y.
                idx.push(a, b, c, a, c, d);
            }
        }

        var geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
        geo.setIndex(idx);
        // …and then take out whatever is laid into this pad. Two cuts on one
        // grid: the square for the cup's own patch is a hole in the *index*
        // built above, and this is the same idea applied to the inlays.
        if (cover) cutUnder(geo, cover, cx, cz, anyCut, pad, cy);
        geo.computeVertexNormals();
        return geo;
    }

    /* The top of a disc of ground, as rings and sectors rather than as a grid.

       A dished bunker on Whinstone is a disc pad with humps in it, and a grid
       clipped to a circle would give it a staircase for a rim — which on the
       one pad whose whole outline the player can see would be the first thing
       the eye found. Rings go round the outline instead, so the edge is the
       edge, and the middle is subdivided finely enough to hold the dish. */
    function discTerrainGeometry(pad, res, cx, cy, cz) {
        var r = pad.r;
        var rings = Math.max(3, Math.round(r / Math.min(res, 0.5)));
        // A waved rim needs sectors of its own: the tightest harmonic on one
        // is a fifth of a turn, and a rim sampled coarser than that reads as a
        // polygon rather than as a shape.
        var sect = Math.max(28, Math.round(2 * Math.PI * r /
            Math.min(res, pad.wave ? 0.3 : 0.6)));
        var pos = [], idx = [], i, j, rr, a, px, pz;

        pos.push(0, P.padHeight(pad, cx, cz) - cy, 0);          // the middle
        for (i = 1; i <= rings; i++) {
            for (j = 0; j < sect; j++) {
                a = j / sect * Math.PI * 2;
                // Every ring is the outline scaled down, so the rim is the
                // outline itself and the wave on it reaches all the way in
                // rather than being a ripple on the last ring alone.
                rr = P.padRadius(pad, a) * i / rings;
                px = Math.cos(a) * rr; pz = Math.sin(a) * rr;
                pos.push(px, P.padHeight(pad, cx + px, cz + pz) - cy, pz);
            }
        }
        function at(ring, j) { return ring === 0 ? 0 : 1 + (ring - 1) * sect + (j % sect); }
        for (j = 0; j < sect; j++) idx.push(at(0, 0), at(1, j + 1), at(1, j));
        for (i = 1; i < rings; i++) {
            for (j = 0; j < sect; j++) {
                idx.push(at(i, j), at(i, j + 1), at(i + 1, j + 1));
                idx.push(at(i, j), at(i + 1, j + 1), at(i + 1, j));
            }
        }
        var geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(pos), 3));
        geo.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(pos.length / 3 * 2), 2));
        geo.setIndex(idx);
        geo.computeVertexNormals();
        return geo;
    }

    /* The flat square the cup is cut out of, which is what the hole in the
       grid above is a hole for. It is flat because courses.js promises it is:
       nothing rolls within CUP_FLAT of a cup, and this patch is well inside
       that. `bore` is the radius of the hole in it — the cup's own for the
       ground, a shade wider for the grass, so no blade hangs over the rim. */
    function cupPatch(cut, y, bore) {
        var shape = new THREE.Shape();
        shape.moveTo(cut.x - cut.h, -(cut.z - cut.h));
        shape.lineTo(cut.x + cut.h, -(cut.z - cut.h));
        shape.lineTo(cut.x + cut.h, -(cut.z + cut.h));
        shape.lineTo(cut.x - cut.h, -(cut.z + cut.h));
        shape.lineTo(cut.x - cut.h, -(cut.z - cut.h));
        var hole = new THREE.Path();
        hole.absarc(cut.x, -cut.z, bore, 0, Math.PI * 2, true);
        shape.holes.push(hole);
        var geo = new THREE.ShapeGeometry(shape, 36);
        geo.rotateX(-Math.PI / 2);
        geo.translate(0, y, 0);
        return geo;
    }

    /* The top of a disc pad, as an extruded shape — with the cup punched out
       of it if this is the pad the cup is cut into. Same construction as
       punchedSlab above; the only difference is that the outline is an arc. */
    function discGeometry(pad, thick, cup, holed) {
        var shape = discShape(pad);
        if (holed) {
            var cx = pad.x + pad.w / 2, cz = pad.z + pad.d / 2;
            var hole = new THREE.Path();
            hole.absarc(cup.x - cx, -(cup.z - cz), C.HOLE_R, 0, Math.PI * 2, true);
            shape.holes.push(hole);
        }
        var geo = new THREE.ExtrudeGeometry(shape, {
            depth: thick, bevelEnabled: false, curveSegments: 44
        });
        geo.rotateX(-Math.PI / 2);      // lay it flat: extrusion now runs +y
        geo.translate(0, -thick / 2, 0);// centred on its middle, like the box
        if (pad.inlay) levelRim(geo);
        return geo;
    }

    /* Point an inlay's rim wall at the sky.

       An inlay is flush with the ground it is laid into and is lifted twelve
       millimetres only so the two do not z-fight, so the band of wall that
       lift exposes is a rendering artefact rather than a step — and shaded as
       a wall, with the sun raking across it, twelve millimetres is enough to
       draw a lit hairline right round every green on the links. The wall is
       already painted in the surface's own turf (buildSurfaces); giving it the
       turf's *normal* as well is the other half of the same argument, and it
       is what makes the seam read as nothing rather than as an edge.

       Nothing is lost by it: a wall this tall carries no shape worth lighting,
       and the geometry is untouched — a ball still rolls off the rim exactly
       where it did. */
    function levelRim(geo) {
        var groups = geo.groups, nrm = geo.attributes.normal, g, i, end;
        for (g = 0; g < groups.length; g++) {
            if (groups[g].materialIndex !== 1) continue;   // the walls, not the cap
            end = groups[g].start + groups[g].count;
            for (i = groups[g].start; i < end; i++) nrm.setXYZ(i, 0, 1, 0);
        }
        nrm.needsUpdate = true;
    }

    /* A piece of rolling ground: the subdivided top, and the wall of earth
       under it. Drawn as two meshes rather than one because the top has to be
       a grid to follow the humps and the sides have to be a strip to follow
       the outline, and a box is neither. */
    /* How much room the cup's flat patch takes, either side of the pin. Kept
       in step with courses.CUP_PATCH, which is the number tests.html asserts
       every cup has clear of its own pad edge. */
    var CUP_PATCH = 0.8;

    /* How finely to subdivide a piece of ground — asked of the ground rather
       than fixed, because the two things that are made of it are three
       different sizes now.

       TERRAIN_RES was picked for Whinstone, where a dune is five to eleven
       units across and a metre of grid is ten segments over the interesting
       part of one. A mini golf lane's contour is a metre across, and the same
       grid would give it two — a hump drawn as a tent. So the step comes off
       the smallest hump actually on the pad, three segments to its radius,
       and it is paid for by every shell over the pad as well as by the ground
       itself, which is why it is floored rather than left to shrink. */
    var TERRAIN_MIN = 0.45;

    function terrainRes(pad) {
        var b = pad.bumps, i, least = Infinity;
        for (i = 0; i < (b || []).length; i++) least = Math.min(least, b[i].r);
        if (!isFinite(least)) return TERRAIN_RES;
        return Math.max(TERRAIN_MIN, Math.min(TERRAIN_RES, least / 3));
    }

    function addTerrain(group, pad, theme, cup, pads) {
        var cx = pad.x + pad.w / 2, cz = pad.z + pad.d / 2;
        var cy = P.padHeight(pad, cx, cz);
        // Whatever is laid into this pad, so the ground under it can be
        // taken away rather than left growing grass through a bunker.
        var cover = [], q;
        for (q = 0; q < (pads || []).length; q++) {
            if (pads[q].inlay) cover.push(pads[q]);
        }
        /* An inlay is laid *into* the ground rather than standing on it, so
           its earth wall is a hand's breadth of cut sand and not a column down
           to the surround — and it is lifted the same hair a flat inlay is, or
           its rim z-fights with the ground it is exactly flush with. */
        var base = pad.inlay ? -0.4 : (theme.surroundY - 0.5) - cy;
        var lift = pad.inlay ? INLAY_LIFT : 0;
        var mat = R.surf.pads[pad.kind]
            ? R.surf.pads[pad.kind].slab[0] : R.surf.pads.green.slab[0];

        /* Is the cup cut into this pad? Same question addPad asks, and the
           same answer: it has to be inside the footprint and the pad has to be
           the surface the cup's own mouth is at. */
        var holed = cup && P.padContains(pad, cup.x, cup.z) &&
            Math.abs(P.padHeight(pad, cup.x, cup.z) - cup.y) < 0.06 && !pad.r;
        var cut = null;
        if (holed) {
            // Clamped to what the pad can actually spare, though courses.js
            // asserts there is always more than enough.
            var room = Math.min(cup.x - pad.x, pad.x + pad.w - cup.x,
                                cup.z - pad.z, pad.z + pad.d - cup.z) - 0.05;
            cut = { x: cup.x - cx, z: cup.z - cz, h: Math.min(CUP_PATCH, room) };
            if (cut.h < C.HOLE_R + 0.1) { cut = null; holed = false; }
        }

        var res = terrainRes(pad);
        var geo = pad.r
            ? discTerrainGeometry(pad, res, cx, cy, cz)
            : terrainGeometry(pad, res, cx, cy, cz, cut, cover);
        worldUv(geo, TX.SCALE[pad.kind] || TX.SCALE.green, cx, cz);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(cx, cy + lift, cz);
        mesh.receiveShadow = true;
        mesh.castShadow = true;
        group.add(mesh);

        var skirt = new THREE.Mesh(skirtGeometry(pad, base, cx, cy, cz),
            R.surf.side);
        skirt.position.set(cx, cy + lift, cz);
        skirt.receiveShadow = true;
        group.add(skirt);

        /* The grass gets the ground's own surface to stand on, and where
           anything is laid into the pad it gets its *own* copy cut harder —
           see cutUnder. Its UVs are rewritten at the blades' own scale inside
           addShells, so building it already tiled for the ground costs
           nothing. */
        addShells(group, pad, cup, false, cx, cy, cz,
            cover.length
                ? terrainGeometry(pad, res, cx, cy, cz, cut, cover, true)
                : geo);

        // …and the cup's patch, which is a second flat surface stitched into
        // the hole left in the grid, with its own mat of grass over it.
        if (cut) {
            var py = P.padHeight(pad, cup.x, cup.z) - cy;
            var patch = cupPatch(cut, py, C.HOLE_R);
            worldUv(patch, TX.SCALE[pad.kind] || TX.SCALE.green, cx, cz);
            var pm = new THREE.Mesh(patch, mat);
            pm.position.set(cx, cy + lift, cz);
            pm.receiveShadow = true;
            group.add(pm);
            addShells(group, pad, cup, false, cx, cy, cz,
                cupPatch(cut, py, C.HOLE_R * 1.08));
        }
    }

    function addPad(group, pad, theme, cup, pads) {
        if (pad.bumps) { addTerrain(group, pad, theme, cup, pads); return; }
        var cx = pad.x + pad.w / 2, cz = pad.z + pad.d / 2;
        var sx = pad.sx || 0, sz = pad.sz || 0;
        var cy = P.padHeight(pad, cx, cz);
        var rise = (Math.abs(sx) * pad.w + Math.abs(sz) * pad.d) / 2;
        var holed = cup && P.padContains(pad, cup.x, cup.z) &&
            Math.abs(P.padHeight(pad, cup.x, cup.z) - cup.y) < 0.06;
        // A slab standing on another pad stops just inside it; one standing on
        // nothing reaches the surrounding ground as it always did. Either way
        // it is deep enough for the shaft, because a cup that comes out of the
        // bottom of its own green is worse than any seam.
        var floor = supportUnder(pads, pad, cy);
        var least = holed ? C.CUP_DEPTH + 0.25 : 0.2;
        /* Every slab reaches down to something — the pad below it, or the
           ground the whole course is standing on. There used to be one
           exception: a `wood` pad was drawn three tenths of a unit thick
           whatever it was doing, because the first wooden thing in the file
           was a bridge and a bridge is a plank.

           It was wrong the moment anything else was made of wood. A ramp cut
           into a lane, a chute down the side of a pinball table, a travelator
           set into a floor — each of those is a piece of *ground*, with solid
           ground either side of it going down two and a half units to the
           surround, and each was drawn as a wafer floating over a hole in the
           world. From the tee you could not tell. Turn the view a quarter and
           Plunger Lane's chute was a plank with daylight under it.

           There is no exception now. A boardwalk over the sea comes out as a
           timber causeway rather than as a floating sheet, which is both what
           a jetty is and the only version of it that has an underneath. */
        var thick = floor !== null
            ? Math.max(least, cy - floor + 0.06 + rise)
            : Math.max(0.6, cy - (theme.surroundY - 0.4) + rise);
        // A disc green is laid into the ground it sits in rather than standing
        // on it, so it needs no more depth than the cup does.
        if (pad.r) thick = holed ? C.CUP_DEPTH + 0.25 : 0.3;
        var geo = pad.r
            ? discGeometry(pad, thick, cup, holed)
            : holed
                ? punchedSlab(pad, thick, cup)
                : new THREE.BoxGeometry(pad.w, thick, pad.d);
        if (holed && !pad.r) {
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
        worldUv(geo, TX.SCALE[pad.kind] || TX.SCALE.green, cx, cz);
        var mesh = new THREE.Mesh(geo,
            padMaterial(pad.kind, pad.inlay ? 'inlay' : (holed ? 'slab' : 'box')));
        mesh.position.set(cx, cy - thick / 2 + (pad.r ? INLAY_LIFT : 0), cz);
        mesh.receiveShadow = true;
        mesh.castShadow = true;
        group.add(mesh);

        // …and the grass standing on it, if it is the sort of pad that grows.
        addShells(group, pad, cup, holed, cx, cy, cz);
    }

    /* ── the machinery ──────────────────────────────────────────────────

       A belt, a launch pad and a pipe mouth are all the same problem: the
       ground does something, and the ground looks exactly like ground. There
       is nothing for the ball to hit, so there is no wall to see, and a player
       who cannot tell a travelator from a plank until the ball is on it is
       being asked to learn the hole by losing a stroke on it.

       So each of the three gets one mark, and the marks obey one rule: **flat
       and above the surface, never proud of it.** Anything with height on it
       reads as something the ball would bounce off, and none of these are —
       a belt is a floor, a launch pad is a floor, a mouth is a hole in one.
       Chevrons, a ring and a throat, all a centimetre up so they do not fight
       the pad they are drawn on, and all unlit `MeshBasicMaterial` so they
       stay legible in the works after dark and on the ice at noon alike.

       They are drawn from the same data the physics reads — `pad.push`,
       `pad.spring`, `hole.warps` — rather than from a second list of scenery,
       so a mark cannot end up pointing the wrong way or drawn where nothing
       happens. That is not tidiness: the first version of the belt had its
       arrows authored separately and the very first hole written with one had
       them backwards. */

    /* How far a mark floats above the ground it is painted on, and the two
       things it has to clear before it is visible at all.

       **INLAY_LIFT**, and not merely equal it: a launch pad is an inlay, an
       inlay is already lifted by that much to stop it z-fighting with the pad
       it is laid into, and a ring drawn at the same height as the disc it sits
       on comes out as a band of speckle. Which is exactly what the first one
       did.

       **The grass.** A green wears a stack of shells a little over a tenth of
       a unit tall (SHELL_HEIGHT), so a decal five centimetres up is a decal
       inside a lawn: from a low camera the near rim of it shows and the far
       rim is behind the blades, which is not a subtle bug to look at — a pipe
       mouth came out as a black hole with a pink smile under it. */
    var MARK_LIFT = 0.022;

    function markY(pad, x, z) {
        return P.padHeight(pad, x, z) +
            (pad.inlay ? INLAY_LIFT : 0) +
            (SHELL_HEIGHT[pad.kind] || 0) + MARK_LIFT;
    }

    function markMat(colour, opacity) {
        return new THREE.MeshBasicMaterial({
            color: colour, transparent: opacity < 1, opacity: opacity,
            depthWrite: false, side: THREE.DoubleSide
        });
    }

    /* A chevron lying flat and pointing along +z, so that `rotation.y = yaw`
       turns it to face wherever the belt pushes.

       The sign of it is the one thing here that is easy to get wrong and
       impossible to notice in a still: a `ShapeGeometry` is built in the xy
       plane, and laying it down with rotateX(-90°) sends shape **+y to world
       -z**. So a chevron drawn pointing up the page comes out pointing back
       down the hole, and the arrows on the first belt ever written were
       exactly backwards. The apex is at -y here for that reason and no
       other. */
    function chevronShape(w, d, t) {
        var sh = new THREE.Shape();
        sh.moveTo(-w, d);
        sh.lineTo(0, 0);
        sh.lineTo(w, d);
        sh.lineTo(w, d - t);
        sh.lineTo(0, -t);
        sh.lineTo(-w, d - t);
        sh.closePath();
        return sh;
    }

    /* A travelator: chevrons along it, spaced by how hard it pushes, so a
       fast belt is a dense one and the picture carries the number. */
    function addBelt(group, pad, theme) {
        var ax = pad.push.x, az = pad.push.z;
        var mag = Math.hypot(ax, az);
        if (!mag) return;
        var yaw = Math.atan2(ax, az);
        var run = Math.abs(Math.cos(yaw)) * pad.d + Math.abs(Math.sin(yaw)) * pad.w;
        var across = Math.abs(Math.cos(yaw)) * pad.w + Math.abs(Math.sin(yaw)) * pad.d;
        var wide = Math.min(0.62, across * 0.34);
        var step = Math.max(0.8, 2.4 - mag * 0.1);
        var n = Math.max(1, Math.floor(run / step));
        var cx = pad.x + pad.w / 2, cz = pad.z + pad.d / 2;
        var geo = new THREE.ShapeGeometry(chevronShape(wide, wide * 0.85, wide * 0.42));
        geo.rotateX(-Math.PI / 2);
        var mat = markMat(theme.machine || 0xffd34d, 0.95);
        var i, f, ox, oz, m;
        for (i = 0; i < n; i++) {
            f = (i + 0.5) / n - 0.5;
            ox = Math.sin(yaw) * f * run;
            oz = Math.cos(yaw) * f * run;
            m = new THREE.Mesh(geo, mat);
            m.rotation.y = yaw;
            m.position.set(cx + ox, markY(pad, cx + ox, cz + oz), cz + oz);
            group.add(m);
        }
    }

    /* A launch pad: a sprung face with a rim round it, drawn the same way the
       pipe mouth is and for the same reason — a decal on the floor is only a
       decal from the one angle the light happens to be at, and this is a thing
       the player has to be able to pick out from the tee and then aim a ball
       at from six units away. The face is flat (the pad under it is flat, and
       anything domed would be geometry the ball visibly passes through), so
       the reading comes from the rim and from the two rings inside it. */
    function addSpring(group, pad, theme) {
        var cx = pad.x + pad.w / 2, cz = pad.z + pad.d / 2;
        var r = pad.r || Math.min(pad.w, pad.d) / 2;
        var y = markY(pad, cx, cz);
        var col = theme.machine || 0xffd34d;
        // A shade wider than the pad it is drawn on, so no sliver of the
        // board underneath shows between the rim and the grass.
        var face = new THREE.Mesh(new THREE.CircleGeometry(r * 1.0, 34),
            markMat(col, 0.95));
        face.rotation.x = -Math.PI / 2;
        face.position.set(cx, y, cz);
        group.add(face);
        // Two darker rings on the face, which is what a sprung membrane looks
        // like and, more usefully, what makes the middle of one findable.
        var inner = new THREE.Mesh(new THREE.RingGeometry(r * 0.36, r * 0.46, 28),
            markMat(0x1a1420, 0.35));
        inner.rotation.x = -Math.PI / 2;
        inner.position.set(cx, y + 0.004, cz);
        group.add(inner);
        var rim = new THREE.Mesh(new THREE.TorusGeometry(r * 1.02, 0.055, 8, 32),
            new THREE.MeshLambertMaterial({ color: col }));
        rim.rotation.x = -Math.PI / 2;
        rim.position.set(cx, y + 0.04, cz);
        rim.castShadow = true;
        group.add(rim);
    }

    /* A pipe mouth: a bright collar and a throat that goes nowhere the eye can
       follow, which is the entire visual argument that the ball will come out
       somewhere else. */
    function addMouth(group, hole, w, theme) {
        var s = P.surfaceTop(hole, w.x, w.z);
        var y = s ? markY(s.pad, w.x, w.z) : MARK_LIFT;
        var dark = new THREE.Mesh(new THREE.CircleGeometry(w.r * 0.8, 26),
            new THREE.MeshBasicMaterial({ color: 0x080b12 }));
        dark.rotation.x = -Math.PI / 2;
        dark.position.set(w.x, y, w.z);
        group.add(dark);
        // And a throat under it, for the moment the ball goes past one at its
        // own eyeline.
        var throat = new THREE.Mesh(
            new THREE.CylinderGeometry(w.r * 0.8, w.r * 0.58, 0.7, 24, 1, true),
            new THREE.MeshBasicMaterial({ color: 0x0a0d14, side: THREE.BackSide }));
        throat.position.set(w.x, y - 0.35, w.z);
        group.add(throat);
        /* The rim is the one mark on this course with real thickness, and it
           earns it: a flat ring painted round a black hole is only visible
           from the side of it nearest the camera — the far half is at a
           grazing angle behind the near lip and simply is not there, so a
           mouth came out as a hole with a smile under it. A torus is the same
           shape with a body, and it reads from every angle a ball is ever
           looked at from. It stands a third of STEP_UP proud, which is well
           inside a kerb the ball would climb anyway, and it is not solid:
           nothing on this course is a wall unless it is in `walls`. */
        var rim = new THREE.Mesh(
            new THREE.TorusGeometry(w.r * 0.86, 0.055, 8, 30),
            new THREE.MeshLambertMaterial({ color: theme.machine || 0xffd34d }));
        rim.rotation.x = -Math.PI / 2;
        rim.position.set(w.x, y + 0.045, w.z);
        rim.castShadow = true;
        group.add(rim);
    }

    /* A tree.

       The solid part of it is the trunk and only the trunk — courses.js says
       why — so everything above the first metre is free to be as big as it
       looks. What it is *not* is a billboard: a course seen from the overview
       and from the ball's own eyeline in the same round has no view a flat
       sheet survives, and eight triangles of low-poly canopy cost less than
       the alpha-tested sheet would anyway.

       Every dimension is shaken out of where the tree stands, so a treeline is
       a treeline rather than a row of identical bollards, and it is the same
       treeline every time the hole is built. Half of them are conifers, which
       is one `if` for twice the wood. */
    function treeHash(x, z) {
        var n = Math.sin(x * 12.9898 + z * 78.233) * 43758.5453;
        return n - Math.floor(n);
    }

    function addTree(group, wall) {
        var B = P.wallBox(wall, 0);
        var a = treeHash(B.cx, B.cz), b = treeHash(B.cz * 1.7, B.cx * 0.9);
        var trunkR = Math.max(B.hw, B.hd) * 0.55;
        // Tall enough to look like a tree from the ball, which is lower down
        // than the collision box needs to be: the wall stops the ball, the
        // canopy stops the player thinking the hole is open there.
        var h = wall.h * (1.05 + a * 0.5);
        var crown = Math.max(B.hw, B.hd) * (2.6 + b * 1.1);
        var leaf = R.surf.leaf[a < 0.5 ? 0 : 1];

        var trunk = new THREE.Mesh(
            new THREE.CylinderGeometry(trunkR * 0.7, trunkR * 1.15, h, 7),
            R.surf.walls.tree
        );
        trunk.position.set(B.cx, B.base + h / 2, B.cz);
        trunk.castShadow = true;
        trunk.receiveShadow = true;
        group.add(trunk);

        var top = B.base + h;
        var i, mesh, geo;
        if (a < 0.5) {
            // A conifer: two skirts, the upper one narrower and higher.
            for (i = 0; i < 2; i++) {
                geo = new THREE.ConeGeometry(crown * (1 - i * 0.34), crown * (2.1 - i * 0.5), 8);
                mesh = new THREE.Mesh(geo, leaf);
                mesh.position.set(B.cx, top - crown * 0.35 + i * crown * 0.95, B.cz);
                mesh.castShadow = true;
                group.add(mesh);
            }
        } else {
            // A broadleaf: two blobs, the second shouldered off the first.
            for (i = 0; i < 2; i++) {
                geo = new THREE.IcosahedronGeometry(crown * (1 - i * 0.28), 0);
                geo.scale(1, 0.82, 1);
                mesh = new THREE.Mesh(geo, leaf);
                mesh.position.set(
                    B.cx + (i ? crown * (b - 0.5) * 0.7 : 0),
                    top + crown * (i ? 0.62 : 0.1),
                    B.cz + (i ? crown * (a - 0.5) * 0.7 : 0)
                );
                mesh.rotation.y = a * 6.283;
                mesh.castShadow = true;
                group.add(mesh);
            }
        }
    }

    function addWall(group, wall) {
        if (wall.kind === 'tree') { addTree(group, wall); return; }
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

        if (wall.move || wall.spin || wall.swing) {
            R.movers.push({ mesh: mesh, wall: wall, h: wall.h });
            if (wall.spin || wall.swing) {
                // A blade needs something to turn on, or it reads as a floating
                // plank; so does a flipper, and on a flipper the pivot is the
                // thing that says which end is hinged.
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

    /* Pretty water on or off, for the whole game. It is one define rather than
       one shader: the two seas are the same source, so there is no second copy
       to keep in step, and switching costs a recompile of a material that is
       drawn on at most a handful of meshes. Kept on R so a hole built after
       the switch comes out the same as the one that was on screen during it —
       buildHole throws every water material away and makes new ones. */
    R.prettyWater = true;

    function setWaterQuality(on) {
        on = !!on;
        if (on === R.prettyWater) return on;
        R.prettyWater = on;
        for (var i = 0; i < R.waterMats.length; i++) {
            var m = R.waterMats[i];
            if (on) m.defines.PRETTY = '';
            else delete m.defines.PRETTY;
            m.needsUpdate = true;
        }
        return on;
    }

    function waterMaterial(theme, opts) {
        var deep = lin(theme.water);
        var shallow = deep.clone().lerp(lin(0xffffff), 0.18);
        var mat = new THREE.ShaderMaterial({
            defines: R.prettyWater ? { PRETTY: '' } : {},
            uniforms: {
                deep: { value: deep },
                shallow: { value: shallow },
                skyColour: { value: lin(theme.sky[1]) },
                // The dome's own two stops, so a reflection of the sky is a
                // reflection of *this* sky and not of a remembered blue.
                skyTop: { value: lin(theme.sky[0]) },
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
        /* A box rather than a plane: the pads reach down to the surrounding
           ground, so a pond between two of them is a filled channel, and a
           sheet floating in the gap would read as a decal. Only the top face
           gets the water shader; the sides are the murk underneath it.

           What the box did not have was a **bottom**. The surface was drawn at
           nine tenths opaque over nothing at all, so a pond was a coloured lid:
           the same tone whether it was a hand deep or three metres, and the
           only thing telling you which was the height of the rail beside it. So
           there is a bed now — the bunkers' own sand, sunk and drowned in the
           water's colour — and the surface is let down to let it through. Deep
           water still comes out opaque, because the bed is genuinely far away
           and the fog inside the shader closes over it; a shallow one shows
           its floor, which is the whole difference between a pond and a hole
           full of paint.

           The bed is a *shade* inside the box rather than on its floor. A
           water rectangle is usually wider than the pond it draws — it runs on
           under the pads either side, which is how the shoreline comes out
           ragged instead of ruled — so its true floor is under the course, and
           what has to be visible is the part in the middle. */
        var depth = Math.max(0.6, w.y - theme.surroundY + 0.2);
        var tint = new THREE.Color(theme.water);
        var murk = new THREE.MeshLambertMaterial({
            color: tint.clone().multiplyScalar(0.45)
        });
        var top = waterMaterial(theme, { alpha: 0.86 });
        // Box material order: +x, -x, +y, -y, +z, -z.
        var mesh = new THREE.Mesh(new THREE.BoxGeometry(w.w, depth, w.d),
            [murk, murk, top, murk, murk, murk]);
        mesh.position.set(w.x + w.w / 2, w.y - depth / 2, w.z + w.d / 2);
        group.add(mesh);

        /* …but only where the pond is a hole in the ground. On a course whose
           whole surround is water the rectangle is a piece of the sea rather
           than a pool, it sits a few centimetres proud of the surround plane,
           and a bed under it shows as a dark line ruled across the ocean at
           the depth of its own edge. The sea does not need a floor drawn for
           it; it has the horizon. */
        if (theme.surround === 'water') return;

        var bx = w.x + w.w / 2, bz = w.z + w.d / 2;
        var bedGeo = new THREE.PlaneGeometry(w.w, w.d);
        bedGeo.rotateX(-Math.PI / 2);
        worldUv(bedGeo, TX.SCALE.sand, bx, bz);
        var bed = new THREE.Mesh(bedGeo, new THREE.MeshLambertMaterial({
            // Drowned: the sand keeps its grain and gives its colour up to the
            // water standing on it, which is what silt under a pond looks like.
            map: TX.surfaces(theme).sand,
            /* Darkened hard. A bed at the brightness of dry sand comes back
               through the surface as a sandbar rather than as a floor — the
               eye reads "shallow" from how *dim* the bottom is, not from
               seeing it at all. */
            color: tint.clone().lerp(new THREE.Color(0xa89974), 0.45).multiplyScalar(0.5)
        }));
        bed.position.set(bx, w.y - Math.min(depth * 0.7, 0.8), bz);
        bed.receiveShadow = true;
        group.add(bed);
    }

    /* The out-of-bounds line, as the only thing that can honestly mark one on
       a course with no fence: a row of white stakes.

       They are scenery — the ball passes through them, because the boundary is
       a rule about where the ball *stops* and a stake that bounced it back
       would be a wall telling a lie about that rule. What they have to do is
       be visible from the tee at forty units and from the overview at eighty,
       which is why they are as tall as they are and why they get the brightest
       white on the hole. Spaced by eye rather than by division, so a long side
       and a short side have stakes the same distance apart. */
    function addStakes(group, hole, theme) {
        var rects = P.fenceRects(hole);
        if (!rects.length) return;
        var mat = new THREE.MeshPhongMaterial({
            color: 0xf2f4ef, shininess: 26, specular: 0x555a55
        });
        var geo = new THREE.CylinderGeometry(0.09, 0.11, 1.15, 6);
        var gap = 4.5, r, i, k;
        /* Nothing within this of the tee. A boundary can legitimately run
           behind a teeing ground and two of these holes have one that does,
           but the bag rides in front of the camera at a fixed offset and a
           stake a few units away lines up behind it looking like a marble
           column. No real course puts a stake on the tee either. */
        var CLEAR_OF_TEE = 7;

        /* A stake goes on the edge of a rectangle unless that edge is inside
           another one — where two rectangles overlap to make a dogleg, the
           line through the middle of the elbow is not a boundary at all and a
           row of stakes across it would be describing a wall that is not
           there. Nudged a hair outwards before the test, because the shared
           edge of two touching rectangles is on the boundary of both. */
        function inside(x, z, skip) {
            var q;
            for (q = 0; q < rects.length; q++) {
                if (q === skip) continue;
                if (x > rects[q].x + 0.01 && x < rects[q].x + rects[q].w - 0.01 &&
                    z > rects[q].z + 0.01 && z < rects[q].z + rects[q].d - 0.01) return true;
            }
            return false;
        }

        for (r = 0; r < rects.length; r++) {
            var f = rects[r];
            var sides = [
                [f.x, f.z, f.x + f.w, f.z],
                [f.x + f.w, f.z, f.x + f.w, f.z + f.d],
                [f.x + f.w, f.z + f.d, f.x, f.z + f.d],
                [f.x, f.z + f.d, f.x, f.z]
            ];
            for (i = 0; i < sides.length; i++) {
                var s0 = sides[i];
                var len = Math.hypot(s0[2] - s0[0], s0[3] - s0[1]);
                var n = Math.max(1, Math.round(len / gap));
                for (k = 0; k < n; k++) {
                    var t = k / n;
                    var x = s0[0] + (s0[2] - s0[0]) * t;
                    var z = s0[1] + (s0[3] - s0[1]) * t;
                    if (inside(x, z, r)) continue;
                    if (Math.hypot(x - hole.tee.x, z - hole.tee.z) < CLEAR_OF_TEE) continue;
                    var top = P.surfaceTop(hole, x, z);
                    if (!top) continue;
                    var m = new THREE.Mesh(geo, mat);
                    m.position.set(x, top.y + 0.5, z);
                    m.castShadow = true;
                    group.add(m);
                }
            }
        }
    }

    /* ── the country beyond the hole ────────────────────────────────────

       Everything from the edge of the course to the fog. It used to be one
       flat 600-unit square with a small rock texture repeated across it a
       hundred and fifty times, and it looked like exactly that: a tiled sheet
       of lino with the course sitting on top.

       Three things wrong with it, and they need three different fixes.

       **It tiled.** Fixed in the shader — see SUR_* in shaders.js — with noise
       whose period nothing else on the plane shares.

       **It was flat.** A course stands in country, and country rolls. The
       surround now rolls too, but only where rolling cannot hurt: dead flat
       out to the last corner of the hole and a margin beyond it, then easing
       into its full relief over the next fifty units. That ramp is not a
       nicety. The pads' skirts reach down to `surroundY - 0.5` and the links
       courses run their rough out to meet this mesh; ground that moved
       underneath either would open a gap between the hole and the world it is
       standing in, which is the one seam on the course a player is close
       enough to see.

       **It was a square, subdivided once.** Relief needs vertices, and a grid
       fine enough to hold a hill at forty units would be spending the same
       triangles at two hundred and eighty, where a whole hillside is four
       pixels of fog. So it is rings and sectors instead, on a radius that
       grows as a power of the ring index — about three units between rings
       where the hills are legible, forty out at the rim nobody can see. Twelve
       thousand triangles buys what a grid would have wanted eighty thousand
       for.

       The rim is still three hundred units out, which is what the fog needs:
       past the far end of the thickest weather, so the horizon is a fade and
       never an edge. */

    var SUR_R = 300;        // to the rim, and the thickest fog ends before it
    var SUR_SECT = 96;      // wedges round; enough that a ridge is not faceted
    var SUR_RINGS = 64;
    var SUR_TILE = 9;       // world units per repeat of the rock texture
    /* Where the relief starts and where it is fully grown, measured out from
       the hole's own last corner. */
    var SUR_FLAT = 8, SUR_RAMP = 55;

    /* A value noise of its own, and deliberately not the shader's: this one
       runs once per vertex at build time on the CPU, and the two never have to
       agree about anything. Two octaves — a fifty-unit swell with an
       eighteen-unit one riding on it — which is as much shape as ground seen
       through fog can show. */
    function surHash(x, z) {
        var n = Math.sin(x * 127.1 + z * 311.7) * 43758.5453;
        return n - Math.floor(n);
    }
    function surNoise(x, z) {
        var i = Math.floor(x), j = Math.floor(z);
        var fx = x - i, fz = z - j;
        fx = fx * fx * (3 - 2 * fx);
        fz = fz * fz * (3 - 2 * fz);
        var a = surHash(i, j), b = surHash(i + 1, j);
        var c = surHash(i, j + 1), d = surHash(i + 1, j + 1);
        return (a + (b - a) * fx) + ((c + (d - c) * fx) - (a + (b - a) * fx)) * fz;
    }
    /* How far up this piece of ground is, given where it is in the world and
       how far it is from the middle of the hole. The two arguments are two
       different questions: the shape is world-space, so six holes on one
       course are standing in six different parts of the same country rather
       than six copies of one hill; the ramp is measured from the hole's own
       centre, because what it is protecting is the seam round *this* hole. */
    function surRelief(wx, wz, r, amp, flatR) {
        var k = (r - flatR) / SUR_RAMP;
        if (k <= 0) return 0;
        k = k >= 1 ? 1 : k * k * (3 - 2 * k);
        var n = surNoise(wx * 0.020, wz * 0.020) * 0.64 + surNoise(wx * 0.056, wz * 0.056) * 0.36;
        return (n - 0.5) * 2 * amp * k;
    }

    function surroundGeometry(amp, flatR, cx, cz) {
        var pos = [], uv = [], idx = [], i, j, rr, a;

        function vert(px, pz, r) {
            pos.push(px, amp ? surRelief(cx + px, cz + pz, r, amp, flatR) : 0, pz);
            // The tiling rides on the world position, not on the ring index:
            // rings that grow apart would otherwise stretch the rock with them.
            uv.push((cx + px) / SUR_TILE, (cz + pz) / SUR_TILE);
        }

        vert(0, 0, 0);
        for (i = 1; i <= SUR_RINGS; i++) {
            rr = SUR_R * Math.pow(i / SUR_RINGS, 2.2);
            for (j = 0; j < SUR_SECT; j++) {
                a = j / SUR_SECT * Math.PI * 2;
                vert(Math.cos(a) * rr, Math.sin(a) * rr, rr);
            }
        }
        function at(ring, k) { return ring === 0 ? 0 : 1 + (ring - 1) * SUR_SECT + (k % SUR_SECT); }
        // Wound the same way the pads' tops are, so the face looks up.
        for (j = 0; j < SUR_SECT; j++) idx.push(at(0, 0), at(1, j + 1), at(1, j));
        for (i = 1; i < SUR_RINGS; i++) {
            for (j = 0; j < SUR_SECT; j++) {
                idx.push(at(i, j), at(i, j + 1), at(i + 1, j + 1));
                idx.push(at(i, j), at(i + 1, j + 1), at(i + 1, j));
            }
        }

        var geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(pos), 3));
        geo.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(uv), 2));
        geo.setIndex(idx);
        geo.computeVertexNormals();
        return geo;
    }

    /* The splice that de-tiles it, as one function every surround points at —
       the same plumbing as `turfShader`, and for the same reason: three keys
       its program cache on this function's source, so every course in a round
       shares one compile. */
    function surroundShader(shader) {
        shader.vertexShader = SH.SUR_VS_HEAD +
            shader.vertexShader.replace('#include <begin_vertex>', SH.SUR_VS_BODY);
        shader.fragmentShader = SH.SUR_FS_HEAD +
            shader.fragmentShader.replace('#include <map_fragment>', SH.SUR_FS_BODY);
    }

    function addSurround(group, hole, theme) {
        var cx = (hole.bounds.minX + hole.bounds.maxX) / 2;
        var cz = (hole.bounds.minZ + hole.bounds.maxZ) / 2;

        if (theme.surround === 'water') {
            // The sea makes its own shape out of its own waves, and it is flat
            // by definition; it keeps the plane it always had.
            var sea = new THREE.Mesh(new THREE.PlaneGeometry(600, 600), waterMaterial(theme, {}));
            sea.rotation.x = -Math.PI / 2;
            sea.position.set(cx, theme.surroundY, cz);
            group.add(sea);
            return;
        }

        // Cached by tint in textures.js: two holes on the same course stand on
        // the same rock, and it used to be redrawn for each.
        var mat = new THREE.MeshLambertMaterial({
            map: TX.rock(theme.surround === 'rock'
                ? (theme.ground || '#9c8466')
                : (theme.floor || '#3f4450'))
        });
        mat.onBeforeCompile = surroundShader;

        // Out to the far corner of the hole, and then the margin. A dogleg's
        // bounding box is bigger than the hole in it, which is the safe way
        // round to be wrong.
        var flatR = Math.hypot(hole.bounds.maxX - cx, hole.bounds.maxZ - cz) + SUR_FLAT;
        var mesh = new THREE.Mesh(surroundGeometry(theme.relief || 0, flatR, cx, cz), mat);
        mesh.position.set(cx, theme.surroundY, cz);
        mesh.receiveShadow = true;
        group.add(mesh);
    }

    /* ── the hills on the horizon ───────────────────────────────────────

       Real ranges, standing on the ground the course stands on, two hundred
       units out.

       They were painted first — a silhouette computed in the sky shader from
       the ray's own compass direction — and painting is genuinely the cheaper
       answer: no vertices, no draw call, and a skyline as fine as the screen
       is. What it cannot do is be somewhere. A painted range is fixed to the
       dome, so it does not shift as the player walks up the fairway, it cannot
       pass behind the flag or in front of the sun, one range cannot occlude
       another except in the order the code happens to draw them, and light on
       it is a dot product with a direction rather than with a slope. All of
       that is what "distant scenery" is made of, and none of it survives being
       flat. So: geometry.

       **Two bands, as annuli.** For each ring of a band the height is a ridged
       fractal noise sampled at the vertex's own place in the world — folded
       about its middle (`1 - |2n-1|`), which turns the blobs a plain noise
       makes into the creases a mountain has — tapered by a sine across the
       band so both edges come back to nothing. The far band is lower, wider
       out, and hazier, and the two overlap by a few units so the near one's
       feet are always inside the far one rather than beside it.

       **They are buried, not placed.** The mesh's origin is `RIDGE_SINK`
       *below* the surround, so the taper's ends are under the ground rather
       than meeting it at a visible hem — which matters because the ground out
       there rolls by up to a theme's `relief`, and a hem laid exactly on a
       nominal height would be above the ground on one bearing and below it on
       the next. Sunk deeper than any relief can lift, the join is the ground's
       own edge every time, and the surround's own rises read as foothills in
       front of the range instead of as a seam through it.

       **Nothing lights them.** At two hundred units every vertex of every
       range is the same distance from the same sun, so a light would spend a
       per-frame calculation arriving at what the build already knows. The
       rock, the snow, the sun on the western faces and the haze eating the
       feet are all folded into one vertex colour here, and the shader
       (shaders.js → the hills on the horizon) hands it to the frame buffer
       untouched. That is also what keeps them the same colour as the sky they
       stand against: three.js's fog would have painted them out entirely at
       this distance, and its tone map and encode would have moved them off the
       colour the raw sky shader writes.

       The heights are small — a "mountain" here is nine to seventeen units.
       That is not modesty, it is arithmetic: at two hundred units and an eye
       four above the ground, seventeen units is 0.065 radians, and this camera
       is pitched down at a golf ball and has about 0.06 radians of sky above
       the horizon to give. A range built to look like a photograph would top
       out a screen and a half above the frame. */

    var RIDGE_SECT = 384;   // wedges round: 0.016 rad each, so a crest is a
                            // crest rather than a row of facets
    var RIDGE_RINGS = 6;
    var RIDGE_SINK = 7;     // how far under the surround the skirts start
    /* Inner and outer radius, how much of the theme's peak height this band
       gets, and how much extra air is in front of it. */
    var RIDGE_BANDS = [
        { r0: 168, r1: 238, k: 1.00, haze: 0.00 },
        { r0: 230, r1: 292, k: 0.70, haze: 0.38 }
    ];

    /* Ridged fractal noise, on the surround's own hash. Each octave is folded
       about its middle before it is added, which is the whole difference
       between a hill and a mountain: `vnoise` alone gives rounded lumps with
       rounded troughs, and one fold turns every trough into a crest and leaves
       the valleys wide. `rough` is the octave falloff — 0.4 is a moor, 0.6 is
       an alp. */
    function ridgeNoise(x, z, rough) {
        var v = 0, a = 0.5, w = 0, i, n;
        for (i = 0; i < 4; i++) {
            n = surNoise(x, z);
            v += a * (1 - Math.abs(2 * n - 1));
            w += a;
            x = x * 2.07 + 3.1;
            z = z * 2.07 + 7.7;
            a *= rough;
        }
        return v / w;
    }

    function ridgeBand(band, ridge, theme, weather, cx, cz) {
        var peak = ridge.peak * band.k;
        var pos = [], tint = [], idx = [], i, j, t, rr, ang, px, pz, h;

        for (i = 0; i <= RIDGE_RINGS; i++) {
            t = i / RIDGE_RINGS;
            rr = band.r0 + (band.r1 - band.r0) * t;
            for (j = 0; j < RIDGE_SECT; j++) {
                ang = j / RIDGE_SECT * Math.PI * 2;
                px = Math.cos(ang) * rr;
                pz = Math.sin(ang) * rr;
                // The crest runs round the middle of the band and both edges
                // come back to the ground, so the range has a front and a back
                // rather than an outline.
                h = peak * ridgeNoise((cx + px) * 0.011, (cz + pz) * 0.011, ridge.rough) *
                    Math.sin(Math.PI * t);
                pos.push(px, RIDGE_SINK + h, pz);
                tint.push(0, 0, 0);           // filled below, off the normals
            }
        }
        function at(ring, k) { return ring * RIDGE_SECT + (k % RIDGE_SECT); }
        for (i = 0; i < RIDGE_RINGS; i++) {
            for (j = 0; j < RIDGE_SECT; j++) {
                idx.push(at(i, j), at(i, j + 1), at(i + 1, j + 1));
                idx.push(at(i, j), at(i + 1, j + 1), at(i + 1, j));
            }
        }

        var geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(pos), 3));
        geo.setIndex(idx);
        geo.computeVertexNormals();

        /* And now the light and the air, once, here — see the note above on
           why this is not a material's job.

           `air` is how much of the range the weather leaves: a clear day gets
           nearly all of it, a sea fog has no business leaving a mountain range
           crisply drawn above the water it has just swallowed. */
        var air = Math.max(0, Math.min(1, 1.45 - 0.45 * weather.fog)) * (1 - band.haze);
        var fog = skyTint(theme.fog, weather, false);
        var rock = new THREE.Color(ridge.colour);
        var cap = new THREE.Color(ridge.cap);
        var nrm = geo.attributes.normal.array;
        var col = new THREE.Color();
        var sun = _ridgeSun.copy(R.sunDir).normalize();
        var out = new Float32Array(pos.length);
        for (i = 0; i < pos.length / 3; i++) {
            /* How far up this range's own height it is: nought at the ground
               it stands on, one at the tallest peak the band can have. The
               sink comes back off first — measured from the buried hem, every
               vertex would read as half a mountain further up than it is, and
               the whole range would come out wearing the colour of its own
               summit. */
            var f = Math.max(0, Math.min(1, (pos[i * 3 + 1] - RIDGE_SINK) / Math.max(peak, 1e-3)));
            /* Aerial perspective — but a *linear* ramp off a high floor, and
               that is the one number in here that had to be found by looking.
               The obvious curve is a square off nothing, and it is what the
               sky's own haze uses: air thickens with distance, so the foot of
               a far hill should be nearly the colour of the air. It comes out
               as a pale smear. The reason is that this camera cannot see a
               range from top to bottom — it has about a fifteenth of a radian
               of sky over the horizon, a range fills most of it, and the part
               it fills is the part where a squared fade has already given
               everything away. Off a floor of a third, the whole visible slice
               of a hill carries some rock. */
            col.copy(fog).lerp(rock, (0.30 + 0.70 * f) * air);
            // Snow, or bare sunlit rock — whatever the theme calls the top of
            // its own hills — and only on the last of the height.
            if (f > 0.78) col.lerp(cap, Math.min(1, (f - 0.78) / 0.20) * 0.45 * air);
            // The slope facing the sun is the lit one. This is the half a
            // painted skyline could never have: it is the *ground's* tilt, so
            // one face of a crest is lit and the other is not.
            var nl = nrm[i * 3] * sun.x + nrm[i * 3 + 1] * sun.y + nrm[i * 3 + 2] * sun.z;
            var lit = 1 + (Math.max(0, nl) * 0.30 - 0.12) * air * weather.sun;
            out[i * 3] = col.r * lit;
            out[i * 3 + 1] = col.g * lit;
            out[i * 3 + 2] = col.b * lit;
        }
        geo.setAttribute('tint', new THREE.BufferAttribute(out, 3));
        geo.deleteAttribute('normal');      // baked; nothing reads it again
        return geo;
    }

    var _ridgeSun = new THREE.Vector3();

    function addRidges(group, hole, theme, weather) {
        var ridge = theme.ridge;
        // No hills on a theme that has none: the arcade is a basement and the
        // works is a shed, and neither has a horizon.
        if (!ridge) return;

        var cx = (hole.bounds.minX + hole.bounds.maxX) / 2;
        var cz = (hole.bounds.minZ + hole.bounds.maxZ) / 2;
        var mat = new THREE.ShaderMaterial({
            vertexShader: SH.RIDGE_VS, fragmentShader: SH.RIDGE_FS, fog: false
        });
        for (var b = 0; b < RIDGE_BANDS.length; b++) {
            var mesh = new THREE.Mesh(
                ridgeBand(RIDGE_BANDS[b], ridge, theme, weather, cx, cz), mat);
            mesh.position.set(cx, theme.surroundY - RIDGE_SINK, cz);
            // Drawn after the dome and before everything near, and it neither
            // casts nor catches a shadow: the shadow camera is 120 units deep
            // and these are past two hundred.
            mesh.renderOrder = -1 + (b === 0 ? 0.2 : 0.1);
            group.add(mesh);
        }
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

        /* Everything below is placed off the *rendered* height of the green
           the cup is cut into, which is not always its real one: an inlaid
           green is drawn a hair proud of the ground it is laid into, and a rim
           painted at the true height would be six millimetres under the
           putting surface and therefore invisible. That is not a small
           cosmetic loss — the white ring is the only thing that says "hole"
           from more than a few units away, and without it the links greens
           read as having no cup at all. */
        var lift = 0, i;
        for (i = 0; i < hole.pads.length; i++) {
            if (hole.pads[i].inlay && P.padContains(hole.pads[i], cup.x, cup.z) &&
                Math.abs(P.padHeight(hole.pads[i], cup.x, cup.z) - cup.y) < 0.06) {
                lift = INLAY_LIFT;
            }
        }

        var liner = new THREE.Mesh(
            new THREE.CylinderGeometry(C.HOLE_R - 0.004, C.HOLE_R - 0.004, C.CUP_DEPTH, 28, 1, true),
            new THREE.MeshLambertMaterial({ color: 0x14170f, side: THREE.BackSide })
        );
        liner.position.set(cup.x, cup.y + lift - C.CUP_DEPTH / 2, cup.z);
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
        rim.position.set(cup.x, cup.y + lift + 0.006, cup.z);
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

    /* How far a hole asks you to see.

       The fog distances above are absolute metres, and they were chosen on a
       mini-golf hole: twenty-four to the near edge and ninety-five to the far
       one, against a hole you could putt across in thirteen. That is a
       backdrop. The long game plays the same numbers against a hole ten times
       the area — Gorse Corner is a thirty-three metre par four — and a mist
       (the thickest sky there is, fog 0.42) puts its far edge at forty. The
       flag is then nine tenths of the way into the cloud and the hole is a
       white rectangle with a ball in it: not weather, a fault.

       So the fog is measured in holes rather than in metres. `reach` is what
       this hole actually asks the eye to cross — the shot in front of you, or
       half the ground the hole stands on, whichever is further — and the far
       edge is held at three of them. Three is not a taste: it is what the
       thickest sky on a mini hole already comes to, so the rule is a floor
       that reads as "at least as much air as Seaside Green gets in a mist"
       and nothing else. A clear sky is never near it, a mini hole moves by a
       metre or two at most, and what actually changes is the long game under
       a thick sky — which is the case that was broken. A mist on a big hole
       becomes the same mist seen across more ground, not a thinner one.

       Both edges are scaled together, so the curve keeps its shape — the air
       thickens over the same fraction of the view it always did.

       The cap is the surround: `addSurround` draws ground to three hundred
       units and the sky dome takes over past it, so fog that reached the rim
       would show the seam. A hand-built hole from the level editor can be any
       size at all, which is the case that needs the guard. */
    function fogReach(hole) {
        var b = hole.bounds;
        var half = Math.hypot(b.maxX - b.minX, b.maxZ - b.minZ) / 2;
        var shot = Math.hypot(hole.cup.x - hole.tee.x, hole.cup.z - hole.tee.z);
        return Math.max(half, shot);
    }

    function fogScale(hole, far) {
        if (!hole || !hole.bounds || !far) return 1;
        var k = Math.max(1, fogReach(hole) * 3 / far);
        return Math.min(k, 260 / far);
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
        // ...and the hole scales it again, because those two numbers were
        // written for a mini-golf hole. See fogReach().
        var fogK = fogScale(hole, R.fogFar);
        R.fogNear *= fogK;
        R.fogFar *= fogK;
        R.scene.fog = new THREE.Fog(skyTint(theme.fog, weather, false), R.fogNear, R.fogFar);
        g.add(skyDome(theme, weather));
        lights(g, hole, theme, weather);
        addSurround(g, hole, theme);
        addRidges(g, hole, theme, weather);

        var i;
        for (i = 0; i < hole.pads.length; i++) addPad(g, hole.pads[i], theme, hole.cup, hole.pads);
        // The marks on the machinery, after the ground they are drawn on.
        for (i = 0; i < hole.pads.length; i++) {
            if (hole.pads[i].push) addBelt(g, hole.pads[i], theme);
            if (hole.pads[i].spring) addSpring(g, hole.pads[i], theme);
        }
        for (i = 0; i < (hole.warps || []).length; i++) addMouth(g, hole, hole.warps[i], theme);
        for (i = 0; i < hole.walls.length; i++) addWall(g, hole.walls[i]);
        for (i = 0; i < hole.water.length; i++) addWater(g, hole.water[i], theme);
        addCup(g, hole);
        addTeeMark(g, hole);
        addStakes(g, hole, theme);

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
            // Overcast flattens the gradient as well as darkening it: a solid
            // deck reflects as one grey sheet, not as a dome with a bright top.
            u.skyTop.value.copy(skyTint(theme.sky[0], weather, true)).lerp(lin(weather.cloudBase), weather.cloud * 0.85);
            u.fogColour.value.copy(skyTint(theme.fog, weather, false));
        }
        if (R.sky) R.sky.uniforms.sunDir.value.copy(R.sunDir);

        R.scene.add(g);
        R.holeGroup = g;
        R.smooth.started = false;
        // Whatever was being flown over is no longer the course. game.js starts
        // the next one, if the player wants one at all.
        R.fly = null;
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
    var _seat = { px: 0, py: 0, pz: 0, tx: 0, ty: 0, tz: 0 };
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
    // How solid the cone is at its strongest — everything else is a fraction
    // of this, written into the vertex alpha.
    var CONE_ALPHA = 0.62;
    /* The centre line: solid enough to be the thing you follow, and half a
       finger wide at the ball. It widens very slightly down its length for the
       same reason a road marking does — a constant world width is a shrinking
       screen width, and the far end of a long drive is where the line is doing
       the most work. */
    var LINE_ALPHA = 0.92;
    var LINE_HALF = 0.032;
    var LINE_GROW = 0.0035;
    var _path = { valid: false, x: 0, y: 0, z: 0, yaw: 0, power: 0, loft: 0, over: 0, t: 0 };

    function clearPathCache() { _path.valid = false; }

    function pathStale(world, aim) {
        var b = world.ball;
        // A hole with nothing moving on it has a path that does not depend
        // on the clock at all, so it is not in the comparison.
        var t = R.movers.length ? Math.floor(world.time * PATH_HZ) : 0;
        if (_path.valid && _path.x === b.x && _path.y === b.y && _path.z === b.z &&
            _path.yaw === aim.yaw && _path.power === aim.power &&
            _path.loft === aim.loft && _path.over === (aim.over || 0) &&
            _path.t === t) return false;
        _path.valid = true;
        _path.x = b.x; _path.y = b.y; _path.z = b.z;
        _path.yaw = aim.yaw; _path.power = aim.power; _path.loft = aim.loft;
        _path.over = aim.over || 0;
        _path.t = t;
        return true;
    }

    /* The cone.

       One simulated path, not three. The old preview drew a plane spanned by a
       lighter and a heavier version of the same shot, which said something
       true about touch on a meter and nothing at all about the shot being
       played; this draws the flight the physics actually predicts and opens a
       cone around it, whose half-angle is the spread the shot will really be
       played with — CONE_ANGLE for an honest one (a sliver, so it reads as a
       wedge rather than a hairline) plus whatever physics.spray will add to an
       overdrawn one. Inside a full swing the cone is narrow and it is a
       promise. Past one it opens, and the mouth of it is the miss.

       And it ends. The path is walked in ground distance rather than in
       simulation time — a driver covers half a hole in the second a putt takes
       to cover a metre — cut at CONE_RANGE, and faded out over the last of
       whatever it drew. Where the shot lands inside that range the arrowhead
       marks the spot; where the cone was cut short there is no arrowhead,
       because at that point the game genuinely is not saying. */
    function updatePath(world, aim, frac) {
        R.pathBuilds++;      // what the inspector counts (debug.js)
        var perPath = R.pathPerPath;
        var i, j;

        var spread = P.spray(aim.over || 0);
        var angle = C.CONE_ANGLE + spread.yaw;
        var seconds = 0.5 + frac * 0.5;
        var pts = P.previewPath(world, aim.yaw, aim.power, aim.loft, seconds, aim.bite);

        /* Under MIN_POWER there is no shot to preview: launch() refuses it and
           previewPath hands back nothing. Park the cone and the arrowhead
           rather than reading the last point of an empty path — which is what
           a freshly loaded hole does until the player winds a swing on. The
           wedge is drawn by updateAim whatever this decides, because the shot
           line is worth showing before there is a shot. */
        R.pathCone.visible = R.pathLine.visible = pts.length > 1;
        R.pathHead.visible = pts.length > 1;
        if (pts.length < 2) return;

        // Ground distance to each sample, and to the first bounce.
        var cum = [0], turnD = -1;
        for (i = 1; i < pts.length; i++) {
            cum[i] = cum[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].z - pts[i - 1].z);
            if (turnD < 0 && pts[i].bounce) turnD = cum[i];
        }
        var total = cum[pts.length - 1];
        var cut = total > C.CONE_RANGE;             // the cone ran out before the shot did
        var reach = Math.min(total, C.CONE_RANGE);
        if (reach < 0.05) {
            R.pathCone.visible = R.pathLine.visible = R.pathHead.visible = false;
            return;
        }

        /* Resample the path evenly in distance. `scan` is where the last
           lookup left off, so walking the cone from the ball outwards is one
           pass over the points — and it rewinds as well as advances, because
           the arrowhead below is looked up after that walk and sits behind
           where it finished. */
        var scan = 0;
        function sampleAt(d, out) {
            while (scan < pts.length - 2 && cum[scan + 1] < d) scan++;
            while (scan > 0 && cum[scan] > d) scan--;
            var a = pts[scan], b = pts[scan + 1];
            var span = cum[scan + 1] - cum[scan];
            var t = span > 1e-6 ? (d - cum[scan]) / span : 0;
            out.x = a.x + (b.x - a.x) * t;
            out.y = a.y + (b.y - a.y) * t;
            out.z = a.z + (b.z - a.z) * t;
            return out;
        }

        var mid = R.coneMid, left = R.coneL, right = R.coneR;
        var lineL = R.lineL, lineR = R.lineR;
        for (j = 0; j < perPath; j++) {
            var d = reach * (j / (perPath - 1));
            sampleAt(d, mid[j]);
            mid[j].d = d;
        }
        /* Sideways is perpendicular to where the ball is going *here*, so the
           cone bends with a shot that bends — held to whichever world side it
           started on. Without that last part a ricochet, which reverses the
           direction of travel, swaps the two edges over and the strip ties
           itself into a bow across the rail. */
        var sideX = 0, sideZ = 0;
        for (j = 0; j < perPath; j++) {
            var a = mid[Math.max(0, j - 1)], b = mid[Math.min(perPath - 1, j + 1)];
            var dx = b.x - a.x, dz = b.z - a.z;
            var len = Math.hypot(dx, dz);
            if (len < 1e-6) { dx = Math.sin(aim.yaw); dz = Math.cos(aim.yaw); len = 1; }
            dx /= len; dz /= len;
            if (j && (dz * sideX - dx * sideZ) < 0) { dx = -dx; dz = -dz; }
            sideX = dz; sideZ = -dx;
            /* The cone opens with distance — that is the whole shape of it —
               but it stops opening at the first bounce. Past a ricochet the
               spread is no longer a fan out of the clubface, it is one line
               off a rail, and a cone that kept flaring there drew a wedge the
               size of the hole out of a shot that has one place to go. */
            var od = turnD >= 0 ? Math.min(mid[j].d, turnD) : mid[j].d;
            var half = C.CONE_WIDTH + od * Math.tan(angle);
            left[j].x = mid[j].x + dz * half;
            left[j].y = right[j].y = mid[j].y;
            left[j].z = mid[j].z - dx * half;
            right[j].x = mid[j].x - dz * half;
            right[j].z = mid[j].z + dx * half;
            // The line rides the same normal, a hair either side of centre.
            var lh = LINE_HALF + mid[j].d * LINE_GROW;
            lineL[j].x = mid[j].x + dz * lh;
            lineL[j].y = lineR[j].y = mid[j].y;
            lineL[j].z = mid[j].z - dx * lh;
            lineR[j].x = mid[j].x - dz * lh;
            lineR[j].z = mid[j].z + dx * lh;
        }

        /* The fade. It starts earlier the wilder the shot is — a thrash is
           vaguer about where it ends up, and the picture should be too — and
           it goes all the way to nothing when the cone was cut short. When the
           shot lands inside the range the tail keeps a little substance, since
           there is an arrowhead sitting on it saying where. */
        var fadeFrom = Math.max(0.25, 1 - (C.CONE_FADE + spread.power * 1.4));
        var tailAlpha = cut ? 0 : 0.34;
        function alphaAt(t) {
            if (t <= fadeFrom) return CONE_ALPHA;
            var k = (t - fadeFrom) / (1 - fadeFrom);
            return CONE_ALPHA * (tailAlpha + (1 - tailAlpha) * Math.pow(1 - k, 1.7));
        }
        /* Past the first bounce the cone is a fainter claim — the line off the
           rail is right, but everything after a ricochet compounds — and it
           says so by going see-through rather than by going dark. Darkening it
           put a brown smear on the grass; dropping the alpha reads as "less
           sure" against any surface a hole is made of. */
        function fadeAt(d) { return (turnD >= 0 && d > turnD) ? 0.45 : 1; }
        function shadeAt(t) { return 1 - t * 0.15; }

        var pos = R.pathCone.geometry.attributes.position.array;
        var col = R.pathCone.geometry.attributes.color.array;
        var lpos = R.pathLine.geometry.attributes.position.array;
        var lcol = R.pathLine.geometry.attributes.color.array;
        for (i = 0; i < perPath - 1; i++) {
            var base = i * 6;
            var tA = i / (perPath - 1), tB = (i + 1) / (perPath - 1);
            putPathQuad(pos, base, left[i], right[i], right[i + 1], left[i + 1]);
            setPathQuadShade(col, base,
                shadeAt(tA), alphaAt(tA) * fadeAt(mid[i].d),
                shadeAt(tB), alphaAt(tB) * fadeAt(mid[i + 1].d));
            /* The line fades on the same curve as the cone it sits in — it is
               the same claim, drawn tighter, so it must not outlive it — but
               scaled off its own, higher, ceiling. */
            var kA = alphaAt(tA) / CONE_ALPHA, kB = alphaAt(tB) / CONE_ALPHA;
            putPathQuad(lpos, base, lineL[i], lineR[i], lineR[i + 1], lineL[i + 1]);
            setPathQuadShade(lcol, base,
                1, LINE_ALPHA * kA * fadeAt(mid[i].d),
                1, LINE_ALPHA * kB * fadeAt(mid[i + 1].d));
        }
        R.pathCone.geometry.attributes.position.needsUpdate = true;
        R.pathCone.geometry.attributes.color.needsUpdate = true;
        R.pathCone.geometry.computeBoundingSphere();
        R.pathLine.geometry.attributes.position.needsUpdate = true;
        R.pathLine.geometry.attributes.color.needsUpdate = true;
        R.pathLine.geometry.computeBoundingSphere();
        // White while the shot is honest, and it takes on the arrow's red as
        // the overdraw comes on: the cone widening and the cone reddening are
        // the same fact told twice, and one of them reads from any angle.
        R.pathCone.material.color.set(0xffffff)
            .lerp(R.arrow.material.color, Math.min(1, (aim.over || 0) * 1.15));
        R.pathLine.material.color.copy(R.pathCone.material.color);

        /* The arrowhead: where the loaded shot itself lands, or first meets a
           wall. Only if that point is inside the cone — a shot that outruns
           the preview gets no arrowhead, because the honest answer to "where
           does this stop" is off the end of what was drawn. */
        var headD = turnD >= 0 ? turnD : total;
        R.pathHead.visible = headD <= reach + 1e-6;
        if (!R.pathHead.visible) return;

        var headPos = sampleAt(headD, R.coneHead);
        var back = sampleAt(Math.max(0, headD - 0.25), R.coneBack);
        var hdx = headPos.x - back.x, hdz = headPos.z - back.z;
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
        // The cone is where *this* shot is going, and during the intro there is
        // no shot yet — only the hole. It comes back the frame the sweep ends.
        var show = !!(aim && aim.show && !world.moving && !world.sunk && !R.fly);
        R.aimGroup.visible = show;
        if (!show) return;

        var b = world.ball;
        var dirX = Math.sin(aim.yaw), dirZ = Math.cos(aim.yaw);
        var rawFrac = Math.max(0, Math.min(1, aim.power / C.MAX_POWER));
        // The wedge keeps a floor so the shot direction is always visible even
        // at no power at all: the meter is what reads the number, the arrow is
        // only there to say which way.
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

        /* Green through amber to red as the swing fills, hard red once it is
           into the last of it, and brighter still once the meter is past a
           full swing — aim.over is 0 up to the club's ceiling and 1 at the end
           of the overdraw, so the arrow only glows for a shot that is actually
           being thrashed. */
        var over = Math.max(0, Math.min(1, aim.over || 0));
        var hot = over > 0 || frac > C.OVERSWING;
        var hue = hot ? 0 : 0.33 * (1 - frac / C.OVERSWING);
        R.arrow.material.color.setHSL(hue, 0.85, hot ? 0.62 + over * 0.16 : 0.55);

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

       Overview also thins the air out — see `atmosphere()`.

       Whichever seat is chosen, **c.view turns it**. That is the dial: how far
       round the ball the player has walked, measured off the aim line rather
       than off the world, so the shot still turns the camera with it and this
       is only the angle it is watched from. Zero is wherever the seat itself
       puts you — behind the ball in follow, square across the shot side on —
       and a new hole puts it back there.

       Subtracted, not added: c.view is measured the way the player walks —
       positive is round to the right of the shot — and the world turns the
       other way from underneath them.

       **And c.lock decides what it is measured off.** Unlocked, the reference
       is the aim, so turning the shot turns the camera with it — which is what
       makes "drag left, aim left" true, and is exactly wrong when you are
       reading a map: on the overview, a drag to aim spins the whole hole under
       you. Locked, the reference is `c.bearing`, a fixed direction in the
       world, and the shot turns underneath a camera that stays put. The seat
       still does its job either way — follow still follows the ball down the
       course, it simply stops swinging round with the aim. */
    var VIEWS = ['follow', 'side', 'over'];

    function viewLabel(mode) {
        return mode === 'over' ? 'Overview' : (mode === 'side' ? 'Side on' : 'Follow');
    }

    function cycleView() {
        var i = VIEWS.indexOf(R.cam.mode);
        R.cam.mode = VIEWS[(i + 1) % VIEWS.length];
        return R.cam.mode;
    }

    /* Locking and unlocking must not move the picture, only change what holds
       it there. Locking is easy — the bearing it freezes at is the one it is
       already looking along. Unlocking is the interesting half: the aim has
       been turning all the while the lock was on, so handing the camera back
       to it would snap the view round by however far the shot has travelled.
       Instead that drift is folded into the dial, which is exactly what it
       means: how far off the aim line you are now standing. Wrapped to half a
       turn either way first, because the dial's ends are the same place and a
       raw difference of four radians would clamp instead of wrapping.

       Returns the view offset the caller should adopt, so the dial's own
       clamping and readout stay in one place (game.js's setView). */
    function setLock(on) {
        var c = R.cam;
        if (on === c.lock) return c.view;
        var view = c.view;
        if (on) {
            c.bearing = c.yaw;
        } else {
            view += c.yaw - c.bearing;
            view = Math.atan2(Math.sin(view), Math.cos(view));
        }
        c.lock = on;
        return view;
    }

    /* Where the camera would stand this instant if nothing else were going on:
       the seat the player has chosen, turned by the dial, at the distance the
       zoom has asked for. It is split out from updateCamera below because two
       things need the answer and only one of them is the camera — the intro
       flyover ends *at* the seat, and it can only do that exactly if it is
       reading the same arithmetic rather than a second copy of it.

       Fills the object it is handed: {px,py,pz} for the eye, {tx,ty,tz} for
       what it is looking at. No smoothing — that is the caller's, because the
       flyover does its own. */
    function seatFor(hole, ball, out) {
        var c = R.cam;
        var yaw = (c.lock ? c.bearing : c.yaw) - c.view;
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
            px = bx - Math.sin(yaw) * Math.cos(tilt) * dist;
            py = Math.sin(tilt) * dist;
            pz = bz - Math.cos(yaw) * Math.cos(tilt) * dist;
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
            /* The point it looks at is down the *aim*, because that is where
               the shot goes; where it stands to look at it is off the *view*,
               because that is the dial — and off the bearing rather than the
               aim when the camera is locked. With the dial straight and the
               lock off the two are the same angle and this is square across
               the shot, which is the seat it is; walk round, or lock and turn
               the shot, and it swings from there. */
            var ax = Math.sin(c.yaw), az = Math.cos(c.yaw);
            tx = ball.x + ax * lead;
            ty = ball.y + 0.7;
            tz = ball.z + az * lead;

            var perpX = Math.cos(yaw), perpZ = -Math.sin(yaw);   // the view, turned 90°
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
            px = ball.x - Math.sin(yaw) * back;
            py = ball.y + dist * Math.sin(c.pitch);
            pz = ball.z - Math.cos(yaw) * back;
        }

        out.px = px; out.py = py; out.pz = pz;
        out.tx = tx; out.ty = ty; out.tz = tz;
        return out;
    }

    /* The intro sweep, while one is running. It writes the smoothed pair
       directly rather than easing towards them, because the path is already
       smooth and a lerp on top of it would lag the whole move by a beat.

       Two things fall out of writing them rather than skipping them. The sweep
       can be cut off at any frame — game.js does it on the first press of
       anything — and the camera simply carries on from wherever it had got to,
       easing back to the seat on the same lerp every other frame uses; there
       is no hand-off to write. And when it runs to the end there is nothing to
       ease at all: the last key *is* the seat, and the ease has taken the
       speed to nothing by the time it arrives.

       `lift` is what the air is told about it — see atmosphere(). A camera
       thirty units up is looking through fog chosen for one standing on the
       green, and the map already has the machinery for exactly that. */
    function flyCamera(hole, ball, dt) {
        var f = R.fly;
        f.t += dt;
        G3.flyover.retarget(f.plan, _seat);
        if (f.t >= f.plan.dur) { R.fly = null; return false; }

        var pose = G3.flyover.at(f.plan, f.t);
        R.smooth.pos.set(pose.px, pose.py, pose.pz);
        R.smooth.target.set(pose.tx, pose.ty, pose.tz);
        R.smooth.started = true;
        R.camera.position.copy(R.smooth.pos);
        R.camera.lookAt(R.smooth.target);

        var over = pose.py - flyGround(hole, pose.px, pose.pz, ball.y);
        f.lift = Math.max(0, Math.min(C.FLY.AIR_MAX,
            (over - C.FLY.AIR_FROM) / C.FLY.AIR_SPAN));
        // What the fog has to be pushed past, in the terms atmosphere() reads:
        // how far this frame is looking, and how wide the hole is.
        R.overDist = Math.hypot(pose.px - pose.tx, pose.py - pose.ty, pose.pz - pose.tz);
        R.overRadius = Math.hypot(hole.bounds.maxX - hole.bounds.minX,
                                  hole.bounds.maxZ - hole.bounds.minZ) / 2;
        return true;
    }

    function flyGround(hole, x, z, fallback) {
        var s = P.surfaceTop(hole, x, z);
        return s ? s.y : fallback;
    }

    /* A flyover for this hole, from the seat the camera is about to take up.
       Refused rather than half-started if the pieces are not there: the module
       is optional in the way every other one here is, and a page that failed to
       load it should still play. */
    function startFlyover(hole, ball) {
        if (!R.ready || !G3.flyover) return false;
        seatFor(hole, ball, _seat);
        R.fly = { plan: G3.flyover.plan(hole, ball, _seat), t: 0, lift: 0 };
        return true;
    }

    // Cutting it short is a deletion and nothing more; the frame after this one
    // eases from wherever the camera stands back to the seat, on the lerp it
    // would have been using anyway.
    function skipFlyover() {
        if (!R.fly) return false;
        R.fly = null;
        return true;
    }

    function flying() { return !!R.fly; }

    function updateCamera(hole, ball, dt) {
        seatFor(hole, ball, _seat);
        if (R.fly && flyCamera(hole, ball, dt)) return;

        var px = _seat.px, py = _seat.py, pz = _seat.pz;
        var tx = _seat.tx, ty = _seat.ty, tz = _seat.tz;

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
        /* The intro sweep asks for the same thing, in proportion to how far off
           the ground it is: at the apex it is as far up as the map and looking
           through as much weather, and near the tee it is on the course and
           wants the hole's own air back. It eases through this on the way down
           rather than at the end, so there is no pop as it lands. */
        if (R.fly && R.fly.lift > want) want = R.fly.lift;
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
       ground under each, drawn with the depth test off so a ridge between them
       hides neither, and fading in with the lift rather than snapping on.

       The cup used to get a beacon too — an open cylinder four metres tall
       standing in the hole, unlit, drawn through everything. Straight down it
       was invisible, which is the only angle it was ever designed for; from
       the tilt the overview actually sits at it was a fat yellow post beside
       the pin, taller than the pin, brighter than the flag, and passing
       through every rail between it and the camera because the depth test was
       off. The flagstick already marks the cup and is the right height for it.
       What the ring gets instead is a second ring outside it, breathing
       slowly, which says *here* without standing in the picture. */
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
        R.markCup = flat(0.5, 0.66, 0xffd166, 0.9);
        R.markCupHalo = flat(0.88, 0.98, 0xffd166, 0.36);

        R.marks.add(R.markBall, R.markCup, R.markCupHalo);
        R.scene.add(R.marks);
    }

    function placeMarkers(hole, ball) {
        if (!R.marks) return;
        /* Not during the intro. These two rings are a map's legend — drawn
           through the ground so a ridge hides neither — and a sweep over the
           course with the depth test off is a sweep with two glowing discs
           riding over the hills in front of it. */
        R.marks.visible = R.lift > 0.01 && !R.fly;
        if (!R.marks.visible) return;
        R.markBall.position.set(ball.x, ball.y - C.BALL_R + 0.02, ball.z);
        R.markCup.position.set(hole.cup.x, hole.cup.y + 0.02, hole.cup.z);
        R.markCupHalo.position.set(hole.cup.x, hole.cup.y + 0.02, hole.cup.z);
        // A slow pulse on the ring under the ball, because from up here the
        // ball is four pixels across and a moving thing is easier to find —
        // and the same breath on the cup's outer ring, half a turn behind it,
        // so the two ends of the shot are never both at their faintest.
        var pulse = 0.72 + 0.28 * Math.sin(R.clock * 2.4);
        R.markBall.material.opacity = 0.9 * R.lift * pulse;
        R.markCup.material.opacity = 0.9 * R.lift;
        R.markCupHalo.material.opacity = 0.36 * R.lift * (1.44 - pulse);
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

        /* The bag rides in front of the camera, so it is placed after the
           camera has finished moving and before anything is drawn — and it is
           put away for the intro, because a bag of clubs pinned to the corner
           of a shot flying thirty units over the course is the one thing in the
           picture that says the camera is not really up there. */
        if (G3.bag) {
            G3.bag.setVisible(!R.fly);
            G3.bag.update(dt, R.camera, R.camera.aspect);
        }

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
        startFlyover: startFlyover,
        skipFlyover: skipFlyover,
        flying: flying,
        cycleView: cycleView,
        viewLabel: viewLabel,
        setLock: setLock,
        setWaterQuality: setWaterQuality,
        get prettyWater() { return R.prettyWater; },
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
