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
        cupR: G3.CONFIG.HOLE_R, cupD: G3.CONFIG.CUP_DEPTH,   // buildHole: G3.holeR / G3.cupDepth
        nest: { value: new THREE.Vector4(0, 0, 0, 0) },      // the turf's nest round the ball (nestBall)
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
            speedPull: 0,     // extra distance while the ball is quick
            demoT: 0,         // how long the demo's orbit has been turning
            flight: { x: 0, y: 8, z: 0, yaw: 0, pitch: -0.25 },
            preFlightMode: 'follow'
        },
        smooth: { pos: new THREE.Vector3(), target: new THREE.Vector3(), started: false },
        particles: null, pAlive: 0,
        marks: null,           // the overview's ball ring and the two at the cup
        lift: 0,               // 0 on the course, 1 overhead; see atmosphere()
        fly: null,             // the intro sweep while one is running; see flyCamera()
        wipe: null,            // the wipe that covers its cut; see stepWipe()
        snapWanted: false,     // the frame to take the outgoing picture of (game.js)
        snapReady: false,
        replay: null,          // the ace replay's camera while one plays; see replayCamera()
        launch: null,          // the seat letting go at the strike; see launchLag()
        wasMoving: false,      // …which is how a strike is noticed
        blurK: 0, blurPrev: null,   // motion blur's strength and last frame's camera; see motionBlur()
        overDist: 0, overRadius: 0,
        lastBall: new THREE.Vector3(),
        clock: 0,
        quality: 'auto'
    };

    function dprFor() {
        var T = C.QUALITY_TIERS && C.QUALITY_TIERS[R.quality];
        var cap = T && T.dprCap ? T.dprCap : 2;
        if (R.quality === 'auto' && R.autoStep !== undefined && C.QUALITY_AUTO) cap = autoRung().dpr || cap;
        return Math.min(window.devicePixelRatio || 1, cap);
    }

    function shellCountFor() {
        var T = C.QUALITY_TIERS && C.QUALITY_TIERS[R.quality];
        if (T && R.quality !== 'auto' && T.shells) return T.shells;
        if (R.quality === 'auto' && R.autoStep !== undefined && C.QUALITY_AUTO) return Math.min(SHELL_LAYERS, autoRung().shells || SHELL_LAYERS);
        return SHELL_LAYERS;
    }

    /* How high the grass on a kind of ground stands as drawn: the top shell
       still showing at this quality (each layer stands at (i + 0.3) / layers
       of SHELL_HEIGHT, and the lowest `want` are shown). groundfx.js lays its
       dents, track and bare earth among the blades by it — a mark on the
       ground itself is under the lawn and cannot be seen. */
    function grassLift(kind) {
        var h = SHELL_HEIGHT[kind];
        if (!h) return 0;
        var want = Math.min(SHELL_LAYERS, shellCountFor());
        return want > 0 ? h * (want - 0.7) / SHELL_LAYERS : 0;
    }

    function syncShellLayers() {
        var want = shellCountFor(), i, sh;
        for (i = 0; i < R.shells.length; i++) {
            sh = R.shells[i];
            if (sh && sh.mesh && sh.layer !== undefined) {
                sh.mesh.visible = sh.layer < want;
            }
        }
    }

    function init(canvas) {
        /* The canvas is not antialiased where the picture reaches it through
           postfx.js — which is every WebGL2 device. The course is drawn into
           that file's own multisampled buffer, and all that is ever drawn on
           the canvas itself is one full-screen triangle with no edge in it;
           an antialiased canvas under that was a second multisampled buffer
           the size of the screen, and a resolve of it every frame, smoothing
           nothing. So the WebGL2 context is asked for by hand, without it
           (three.js would otherwise ask with the one flag for both kinds). A
           device with only WebGL1 has no multisampled buffer to draw into
           and keeps the canvas's antialiasing, as before. */
        var gl2 = null;
        try {
            if (G3.postfx && THREE.WebGLMultisampleRenderTarget && window.WebGL2RenderingContext) {
                gl2 = canvas.getContext('webgl2', {
                    alpha: false, depth: true, stencil: true, antialias: false,
                    premultipliedAlpha: true, preserveDrawingBuffer: false,
                    powerPreference: 'high-performance'
                });
            }
        } catch (e) { gl2 = null; }
        /* 'high-performance' asks for the strongest GPU the machine has: on a
           laptop with a built-in and a discrete chip, the browser otherwise
           tends to pick the built-in one to save battery. Phones have one GPU,
           so there it changes nothing. */
        R.renderer = gl2
            ? new THREE.WebGLRenderer({ canvas: canvas, context: gl2, antialias: false, alpha: false })
            : new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
        R.renderer.setPixelRatio(dprFor());
        R.renderer.shadowMap.enabled = true;
        R.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        if (THREE.sRGBEncoding !== undefined) R.renderer.outputEncoding = THREE.sRGBEncoding;

        /* The picture goes through postfx.js if the context will have it, and
           straight to the canvas if it will not. Everything downstream of here
           is written so that either is a complete game: the grade is the last
           word on how a hole looks, not the only word. */
        R.fx = G3.postfx ? G3.postfx.init(R.renderer) : false;
        if (G3.postfx && G3.postfx.setQuality) G3.postfx.setQuality(R.quality);

        R.scene = new THREE.Scene();
        R.camera = new THREE.PerspectiveCamera(52, 1, 0.1, 400);
        // The bag draws on a layer of its own (bag.js LAYER); the camera looks
        // at it as well as the course, except in the picker's split pass.
        R.camera.layers.enable(1);

        // The surface textures are shared and live in textures.js; this is
        // the point where the context is known, and the anisotropy limit with
        // it, so it is where they are allowed to exist.
        TX.prepare(R.renderer);

        buildBall();
        buildAim();
        buildMarkers();
        buildTrail();
        buildTracer();
        buildParticles();
        buildCelebration();
        if (G3.sandfx) G3.sandfx.build(R.scene);
        if (G3.groundfx) G3.groundfx.build(R.scene);
        if (G3.bag) G3.bag.build(R.scene);

        R.ready = true;
        resize();
        return R;
    }

    function resize() {
        if (!R.ready) return;
        var el = R.renderer.domElement;
        var w = el.clientWidth || el.width, h = el.clientHeight || el.height;
        R.renderer.setPixelRatio(dprFor());
        R.renderer.setSize(w, h, false);
        R.camera.aspect = w / Math.max(1, h);
        R.camera.updateProjectionMatrix();
        if (G3.sandfx) G3.sandfx.resize(h * R.renderer.getPixelRatio());
        if (G3.groundfx) G3.groundfx.resize(h * R.renderer.getPixelRatio());
        if (R.fx) {
            var dpr = R.renderer.getPixelRatio();
            G3.postfx.resize(w * dpr, h * dpr);
        }
    }

    /* ── persistent objects ─────────────────────────────────────────────── */

    var BALL_MODES = {
        tour: 0, optic: 1, matte: 2, triple: 3, divide: 4,
        pix: 5, truvis: 6, splatter: 7, camo: 8, carbon: 9,
        rainbow: 10, holo: 11, magma: 12, cyber: 13,
        featherie: 14, aurora: 15,
        tennis: 16, beach: 17, basketball: 18, baseball: 19,
        eightball: 20, football: 21, bowling: 22, disco: 23
    };

    function makeBallBundle() {
        var u = {
            uGbTime: { value: 0 },
            uGbMode: { value: 0 },
            uGbTint: { value: new THREE.Color(1, 1, 1) },
            uGbSunDir: { value: new THREE.Vector3(0.4, 0.8, 0.4) },
            uGbSkyTop: { value: new THREE.Color(0x3f93cf) },
            // Shared uniforms for glass & singularity ShaderMaterials
            time: { value: 0 },
            sunDir: { value: new THREE.Vector3(0.4, 0.8, 0.4) },
            sunColour: { value: new THREE.Color(0xfff3dc) },
            skyTop: { value: new THREE.Color(0x3f93cf) },
            skyColour: { value: new THREE.Color(0xc9e8f7) },
            fogColour: { value: new THREE.Color(0xc9e8f7) },
            fogNear: { value: 30 },
            fogFar: { value: 140 },
            tint: { value: new THREE.Color(1, 1, 1) }
        };
        var phong = new THREE.MeshPhongMaterial({
            color: 0xffffff,
            shininess: 85,
            specular: 0xd0d8de
        });
        if (SH.BALL_VS_HEAD && SH.BALL_FS_HEAD) {
            // The dimples ask how much ball a pixel covers (`fwidth`): core in
            // WebGL 2, an extension to declare in WebGL 1.
            phong.extensions = { derivatives: true };
            phong.onBeforeCompile = function (shader) {
                shader.uniforms.uGbTime = u.uGbTime;
                shader.uniforms.uGbMode = u.uGbMode;
                shader.uniforms.uGbTint = u.uGbTint;
                shader.uniforms.uGbSunDir = u.uGbSunDir;
                shader.uniforms.uGbSkyTop = u.uGbSkyTop;
                shader.vertexShader = SH.BALL_VS_HEAD +
                    shader.vertexShader.replace('#include <begin_vertex>', SH.BALL_VS_BODY);
                shader.fragmentShader = SH.BALL_FS_HEAD +
                    shader.fragmentShader
                        .replace('#include <color_fragment>', SH.BALL_FS_COLOR)
                        .replace('#include <normal_fragment_maps>', SH.BALL_FS_NORMAL)
                        .replace('#include <emissivemap_fragment>', SH.BALL_FS_EMISSIVE);
            };
            phong.customProgramCacheKey = function () { return 'golfball-phong-v2'; };
        } else {
            phong.bumpMap = TX.dimple;
            phong.bumpScale = 0.012;
        }

        var glass = SH.BALL_GLASS_VS && SH.BALL_GLASS_FS ? new THREE.ShaderMaterial({
            uniforms: u,
            vertexShader: SH.BALL_GLASS_VS,
            fragmentShader: SH.BALL_GLASS_FS,
            transparent: true,
            extensions: { derivatives: true }
        }) : phong;

        var voidMat = SH.BALL_VOID_VS && SH.BALL_VOID_FS ? new THREE.ShaderMaterial({
            uniforms: u,
            vertexShader: SH.BALL_VOID_VS,
            fragmentShader: SH.BALL_VOID_FS,
            extensions: { derivatives: true }
        }) : phong;

        return { phong: phong, glass: glass, voidMat: voidMat, uniforms: u };
    }

    function applyBallStyleTo(mesh, bundle, styleId, tintHex) {
        if (!mesh || !bundle) return;
        var def = G3.ballById ? G3.ballById(styleId) : null;
        var modeName = def ? def.mode : 'tour';
        var u = bundle.uniforms;
        if (tintHex !== undefined && tintHex !== null) {
            u.uGbTint.value.setHex(tintHex);
            u.tint.value.setHex(tintHex);
        }
        if (modeName === 'glass') {
            mesh.material = bundle.glass;
            return;
        }
        if (modeName === 'singularity') {
            mesh.material = bundle.voidMat;
            return;
        }
        mesh.material = bundle.phong;
        u.uGbMode.value = BALL_MODES[modeName] !== undefined ? BALL_MODES[modeName] : 0;
        // Surface finish per material family: velvet matte vs tour urethane vs holo/carbon clearcoat
        if (modeName === 'featherie') {
            bundle.phong.shininess = 14;
            bundle.phong.specular.setHex(0x4a3a2a);
        } else if (modeName === 'matte' || modeName === 'camo') {
            bundle.phong.shininess = 22;
            bundle.phong.specular.setHex(0x6e736b);
        } else if (modeName === 'holo' || modeName === 'carbon' || modeName === 'rainbow') {
            bundle.phong.shininess = 120;
            bundle.phong.specular.setHex(0xffffff);
        } else if (modeName === 'tennis' || modeName === 'baseball' || modeName === 'basketball') {
            // Felt, hide and pebbled rubber: barely any shine.
            bundle.phong.shininess = modeName === 'tennis' ? 4 : 14;
            bundle.phong.specular.setHex(modeName === 'tennis' ? 0x1a1a14 : 0x3c3a36);
        } else if (modeName === 'eightball' || modeName === 'bowling' || modeName === 'disco') {
            // Lacquer, polished resin and mirror: a hard, tight highlight.
            bundle.phong.shininess = modeName === 'disco' ? 240 : 170;
            bundle.phong.specular.setHex(0xffffff);
        } else if (modeName === 'beach' || modeName === 'football') {
            bundle.phong.shininess = 60;
            bundle.phong.specular.setHex(0xb8bcc0);
        } else if (modeName === 'magma' || modeName === 'cyber' || modeName === 'aurora') {
            bundle.phong.shininess = 68;
            bundle.phong.specular.setHex(0x8fa4b8);
        } else {
            bundle.phong.shininess = 88;
            bundle.phong.specular.setHex(0xd6dde2);
        }
    }

    function syncBallUniforms(bundle, t, sunDir, theme, weather, fogNear, fogFar) {
        if (!bundle) return;
        var u = bundle.uniforms;
        u.uGbTime.value = t;
        u.time.value = t;
        if (sunDir) {
            u.uGbSunDir.value.copy(sunDir);
            u.sunDir.value.copy(sunDir);
        }
        if (theme) {
            var w = weather || { cloud: 0, warm: theme.sun };
            u.uGbSkyTop.value.copy(skyTint(theme.sky[0], w, false));
            u.skyTop.value.copy(skyTint(theme.sky[0], w, true));
            u.skyColour.value.copy(skyTint(theme.sky[1], w, true));
            u.sunColour.value.copy(lin(w.warm || theme.sun));
            u.fogColour.value.copy(skyTint(theme.fog, w, true));
        }
        if (fogNear !== undefined) u.fogNear.value = fogNear;
        if (fogFar !== undefined) u.fogFar.value = fogFar;
    }

    function buildBall() {
        var geo = new THREE.SphereGeometry(C.BALL_R, 56, 40);
        R.ballMats = makeBallBundle();
        R.ballStyleId = R.ballStyleId || 'tour-white';
        R.ballTintHex = R.ballTintHex !== undefined ? R.ballTintHex : 0xffffff;
        R.ball = new THREE.Mesh(geo, R.ballMats.phong);
        R.ball.castShadow = true;
        applyBallStyleTo(R.ball, R.ballMats, R.ballStyleId, R.ballTintHex);
        R.scene.add(R.ball);
    }

    function buildAim() {
        R.aimGroup = new THREE.Group();

        /* Ground arrow: a strip on the ground ahead of the ball with soft
           chevrons drifting along it, fading in off the ball and out at the
           tip. It used to be a solid wedge, which the owner found a bit on
           the nose; this says "that way" as quietly as it can and still
           grows and warms with power. Drawn without depth testing so it is
           never swallowed by the pad it lies on. `color` is kept as a
           property because the cone and its head take their red off it. */
        var shape = new THREE.BufferGeometry();
        shape.setAttribute('position', new THREE.Float32BufferAttribute(new Array(6 * 3).fill(0), 3));
        // Across (-1..1) and along (0..1) the strip, for the shader.
        shape.setAttribute('uv', new THREE.Float32BufferAttribute(
            [-1, 0, 1, 0, 1, 1, -1, 0, 1, 1, -1, 1], 2));
        var arrowCol = new THREE.Color(0xffffff);
        R.arrow = new THREE.Mesh(shape, new THREE.ShaderMaterial({
            uniforms: {
                col: { value: arrowCol }, time: { value: 0 },
                len: { value: 1 }, halfW: { value: 0.25 }
            },
            vertexShader: [
                'varying vec2 vUv;',
                'void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }'
            ].join('\n'),
            fragmentShader: [
                'uniform vec3 col; uniform float time, len, halfW;',
                'varying vec2 vUv;',
                'void main() {',
                '  float s = vUv.y * len, x = vUv.x * halfW;',
                // Chevrons pointing down the shot, a third of a unit apart,
                // drifting forward; each a soft line about 0.06 thick.
                '  float ph = (s + abs(x) * 1.1) / 0.34 - time * 1.3;',
                '  float d = abs(fract(ph) - 0.5) * 0.34;',
                '  float band = 1.0 - smoothstep(0.018, 0.04, d);',
                // The strip narrows to a point, so the chevrons do too.
                '  float edge = halfW * (1.0 - smoothstep(len * 0.55, len, s));',
                '  float m = 1.0 - smoothstep(edge * 0.55, edge, abs(x));',
                '  m *= smoothstep(0.2, 0.55, s) * (1.0 - smoothstep(len * 0.7, len, s));',
                '  float a = band * m;',
                '  if (a < 0.01) discard;',
                '  gl_FragColor = vec4(col, a * 0.85);',
                '}'
            ].join('\n'),
            transparent: true, side: THREE.DoubleSide, depthTest: false, depthWrite: false
        }));
        R.arrow.material.color = arrowCol;
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
        R.pathCone.visible = false;
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
        R.pathLine.visible = false;
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
        R.pathHead.visible = false;
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

    /* A tail of where the ball has just been: a speed streak, not a string
       of beads (the owner, v1.218.0: "fix the dots be more like a speed
       trail"). It was one soft sprite per frame, so a drive — several units
       a frame — left them strung out a ball-length apart along the whole of
       its flight. Now the samples are joined into one ribbon, turned to face
       the camera at every sample, as wide as the ball at the head and
       narrowing to nothing behind it, and fading with *time* rather than
       sample count, so it is the same length of streak on a phone at 30 fps
       as at 60 and a slow putt leaves a short smear where a drive leaves a
       long one. Additive blending and a colour that darkens with age still do
       the fading; across its width the soft dot texture gives it a soft edge.

       Built once with the course and always in the scene — collapsed off the
       world when idle — so its program is compiled up front rather than on
       the first strike (shader-tests → "Nothing is compiled while a hole is
       played"). */
    function buildTrail() {
        var n = C.TRAIL, i;
        var g = new THREE.BufferGeometry();
        var uv = new Float32Array(n * 4), idx = [];
        for (i = 0; i < n; i++) { uv[i * 4] = 0.5; uv[i * 4 + 1] = 0; uv[i * 4 + 2] = 0.5; uv[i * 4 + 3] = 1; }
        for (i = 0; i < n - 1; i++) {
            var v = i * 2;
            idx.push(v, v + 1, v + 2, v + 1, v + 3, v + 2);
        }
        g.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(n * 6).fill(-9999), 3));
        g.setAttribute('color', new THREE.Float32BufferAttribute(new Float32Array(n * 6), 3));
        g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
        g.setIndex(idx);
        g.setDrawRange(0, 6);   // one triangle pair, off the world: see clearTrail
        R.trail = new THREE.Mesh(g, new THREE.MeshBasicMaterial({
            map: TX.dot, transparent: true, depthWrite: false, side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending, vertexColors: true
        }));
        R.trail.frustumCulled = false;
        R.trail.renderOrder = 2;
        // The samples, newest first once read round from trailAt: where, when
        // (R.clock), and how fast the ball was going there.
        R.trailPts = new Float32Array(n * 3);
        R.trailT = new Float64Array(n);
        R.trailV = new Float32Array(n);
        R.trailN = 0;
        R.trailAt = 0;
        R.trailOn = false;
        R.trailW = 1;
        R.scene.add(R.trail);
    }

    var _tA = null, _tB = null, _tC = null;
    function pushTrail(x, y, z, speed) {
        var n = C.TRAIL, T = C.TRAIL_LOOK;
        R.trailAt = (R.trailAt + 1) % n;
        var j = R.trailAt * 3;
        R.trailPts[j] = x; R.trailPts[j + 1] = y; R.trailPts[j + 2] = z;
        R.trailT[R.trailAt] = R.clock;
        R.trailV[R.trailAt] = speed;
        if (R.trailN < n) R.trailN++;
        drawTrail(T);
    }

    /* The ribbon, rebuilt from the samples for this frame's camera. */
    function drawTrail(T) {
        if (!_tA) { _tA = new THREE.Vector3(); _tB = new THREE.Vector3(); _tC = new THREE.Vector3(); }
        var n = C.TRAIL, pts = R.trailPts, cam = R.camera.position;
        var pos = R.trail.geometry.attributes.position.array;
        var col = R.trail.geometry.attributes.color.array;
        var half = (R.glow ? T.GLOW_WIDTH : T.WIDTH) * C.BALL_R * R.trailW;
        var m = 0, k, s, sp, sn, f, w, c;
        for (k = 0; k < R.trailN; k++) {
            s = (R.trailAt - k + n) % n;
            f = 1 - (R.clock - R.trailT[s]) / T.LIFE;
            if (f <= 0) break;
            // Along the ribbon: from the next-older sample to the next-newer.
            sp = (s - 1 + n) % n;                   // older
            sn = k > 0 ? (s + 1) % n : s;           // newer (the head has none)
            if (k + 1 >= R.trailN) sp = s;
            _tA.set(pts[sn * 3] - pts[sp * 3], pts[sn * 3 + 1] - pts[sp * 3 + 1], pts[sn * 3 + 2] - pts[sp * 3 + 2]);
            _tB.set(cam.x - pts[s * 3], cam.y - pts[s * 3 + 1], cam.z - pts[s * 3 + 2]);
            _tC.crossVectors(_tA, _tB);
            var len = _tC.length();
            if (len < 1e-6) _tC.set(0, 0, 0); else _tC.multiplyScalar(1 / len);
            // A putt is a fainter smear than a drive.
            var strength = Math.min(1, Math.max(T.SLOW, R.trailV[s] / T.FULL_SPEED));
            w = half * f;
            c = f * f * strength;
            var o = m * 6;
            pos[o] = pts[s * 3] + _tC.x * w; pos[o + 1] = pts[s * 3 + 1] + _tC.y * w; pos[o + 2] = pts[s * 3 + 2] + _tC.z * w;
            pos[o + 3] = pts[s * 3] - _tC.x * w; pos[o + 4] = pts[s * 3 + 1] - _tC.y * w; pos[o + 5] = pts[s * 3 + 2] - _tC.z * w;
            // White on a course, neon magenta in the grid world.
            if (R.glow) { col[o] = col[o + 3] = c * 1.2; col[o + 1] = col[o + 4] = c * 0.25; col[o + 2] = col[o + 5] = c * 1.1; }
            else { col[o] = col[o + 3] = c * 0.9; col[o + 1] = col[o + 4] = c * 0.95; col[o + 2] = col[o + 5] = c * 0.85; }
            m++;
        }
        if (m < 2) { parkTrail(); return; }
        R.trail.geometry.setDrawRange(0, (m - 1) * 6);
        R.trail.geometry.attributes.position.needsUpdate = true;
        R.trail.geometry.attributes.color.needsUpdate = true;
    }

    /* Idle, it is still one triangle pair, parked far off the world — never
       an empty draw, which could leave its program uncompiled until the first
       strike of the round. */
    function clearTrail() {
        R.trailN = 0;
        parkTrail();
    }
    function parkTrail() {
        var pos = R.trail.geometry.attributes.position.array, i;
        for (i = 0; i < 12; i++) pos[i] = -9999;
        R.trail.geometry.attributes.position.needsUpdate = true;
        R.trail.geometry.setDrawRange(0, 6);
    }

    /* The tracer (CONFIG.TRACER): the long game's flight drawn as one line,
       from the strike to where it first comes down, the way a broadcast draws
       a drive. The streak above is a tail a fraction of a second long, which
       on a lane is the shot and on a long hole the last few metres of it — and the
       shape of a flight (how high, where it turned over, whether it bent) is
       the thing a long shot is played for and the one thing it never showed.

       A ribbon turned to face the camera every frame, never thinner than
       PX pixels however far off it is, so a drive that has gone a long way
       is still a line and not a hair. It stays drawn while the ball runs out
       and fades once it has stopped. Built with the hole's other furniture
       and drawn from the first frame (a degenerate pair when there is no
       shot), so its program is compiled with the hole, never mid-shot. */
    function buildTracer() {
        var n = C.TRACER.MAX, i, a, idx = [];
        var g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(n * 6), 3));
        g.setAttribute('alpha', new THREE.Float32BufferAttribute(new Float32Array(n * 2), 1));
        for (i = 0; i < n - 1; i++) { a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
        g.setIndex(idx);
        R.tracer = new THREE.Mesh(g, new THREE.ShaderMaterial({
            uniforms: { col: { value: new THREE.Color(C.TRACER.COLOR) }, fade: { value: 0 } },
            vertexShader: [
                'attribute float alpha; varying float vA;',
                'void main() { vA = alpha; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }'
            ].join('\n'),
            fragmentShader: [
                'uniform vec3 col; uniform float fade; varying float vA;',
                'void main() { gl_FragColor = vec4(col, vA * fade); }'
            ].join('\n'),
            transparent: true, depthWrite: false, side: THREE.DoubleSide
        }));
        R.tracer.frustumCulled = false;
        R.tracer.renderOrder = 2;
        R.tracerPts = [];
        R.tracerOn = false;     // recording: the ball is up
        R.tracerHold = 0;       // seconds the ball has been at rest since
        clearTracer();
        R.scene.add(R.tracer);
    }

    function clearTracer() {
        if (!R.tracer) return;
        R.tracerPts.length = 0;
        R.tracerOn = false;
        R.tracer.material.uniforms.fade.value = 0;
        R.tracer.geometry.setDrawRange(0, 6);
    }

    /* Once a frame: start a line at a lofted strike on a long hole, add to
       it while the ball is up, and fade it once the ball has stopped. */
    function stepTracer(dt, world) {
        var T = C.TRACER, pts = R.tracerPts, b = R.ball.position, last;
        if (!G3.longHole(world.hole) || world.warping || world.ride) {
            if (pts.length) clearTracer();
            return;
        }
        if (world.moving && !R.tracerOn && !world.firstLand && !world.grounded &&
            (!pts.length || R.tracerHold > 0 || !R.wasMoving)) {
            pts.length = 0;
            pts.push(world.origin.x, b.y, world.origin.z);
            R.tracerOn = true;
            R.tracerFirst = false;  // the first landing is not in the line yet
        }
        if (R.tracerOn) {
            /* Through the first bounce to where the hop comes down (the
               owner, v1.237.0: "have like one bounce after it hits the
               floor"), or to the first landing if the ball stayed down
               there. Each touchdown goes in exactly where the physics had
               it, at the height the ball is drawn at, and before this
               frame's ball, which may already be past it. */
            var fl = world.firstLand, hop = world.hopLand;
            if (fl && !R.tracerFirst) {
                R.tracerFirst = true;
                pts.push(fl.x, fl.y, fl.z);
            }
            var done = hop || !world.moving || (fl && (world.grounded || !world.inAir));
            if (hop) pts.push(hop.x, hop.y, hop.z);
            else if (!done) {
                last = pts.length - 3;
                var dx = b.x - pts[last], dy = b.y - pts[last + 1], dz = b.z - pts[last + 2];
                if (dx * dx + dy * dy + dz * dz > T.STEP * T.STEP && pts.length < T.MAX * 3 - 9) pts.push(b.x, b.y, b.z);
            }
            if (done) R.tracerOn = false;
        }
        if (!pts.length) return;
        // Held while the ball is going anywhere; faded after it stops.
        var u = R.tracer.material.uniforms.fade;
        if (world.moving) { R.tracerHold = 0; u.value = 1; }
        else {
            /* Where it stopped, and gone if the ball is put anywhere else: a
               drop after a splash is a ball back on the tee with the line it
               just flew standing out of it. */
            if (!R.tracerHold) R.tracerRest = { x: b.x, z: b.z };
            else if (Math.abs(b.x - R.tracerRest.x) + Math.abs(b.z - R.tracerRest.z) > 0.05) { clearTracer(); return; }
            R.tracerHold += dt;
            u.value = 1 - smooth01((R.tracerHold - T.HOLD) / T.FADE);
            if (u.value <= 0) { clearTracer(); return; }
        }
        drawTracer(R.tracerOn ? b : null);
    }

    var _trA = new THREE.Vector3(), _trT = new THREE.Vector3(), _trV = new THREE.Vector3();
    function drawTracer(head) {
        var T = C.TRACER, pts = R.tracerPts, cam = R.camera;
        var n = pts.length / 3 + (head ? 1 : 0), i, j, k;
        if (n < 2) { R.tracer.geometry.setDrawRange(0, 6); return; }
        var pos = R.tracer.geometry.attributes.position.array;
        var al = R.tracer.geometry.attributes.alpha.array;
        var perPx = 2 * Math.tan(cam.fov * Math.PI / 360) / Math.max(1, R.renderer.domElement.clientHeight || 600);
        function at(m, out) {
            if (m >= pts.length / 3) return out.copy(head);
            return out.set(pts[m * 3], pts[m * 3 + 1], pts[m * 3 + 2]);
        }
        for (i = 0; i < n; i++) {
            at(i, _trA);
            at(Math.min(n - 1, i + 1), _trT);
            at(Math.max(0, i - 1), _trV);
            _trT.sub(_trV);                                  // along the line
            _trV.copy(cam.position).sub(_trA);               // towards the eye
            var dist = _trV.length();
            _trT.cross(_trV);                                // across it, as seen
            var len = _trT.length();
            if (len < 1e-6) _trT.set(0, 1, 0); else _trT.multiplyScalar(1 / len);
            var half = Math.min(T.MAX_W, Math.max(T.W, T.PX * perPx * dist));
            // The far end tapers in, and the line comes up out of the turf at
            // the strike rather than starting at full strength.
            var s = i / (n - 1);
            var w = half * (head ? Math.min(1, (1 - s) * 6 + 0.25) : 1);
            j = i * 6; k = i * 2;
            pos[j] = _trA.x + _trT.x * w; pos[j + 1] = _trA.y + _trT.y * w; pos[j + 2] = _trA.z + _trT.z * w;
            pos[j + 3] = _trA.x - _trT.x * w; pos[j + 4] = _trA.y - _trT.y * w; pos[j + 5] = _trA.z - _trT.z * w;
            /* And it goes out near the lens: a flight that has passed over the
               eye, or a line from the ball the camera is standing over, is a
               beam across the picture rather than a line in it. */
            al[k] = al[k + 1] = T.ALPHA * Math.min(1, 0.35 + s * 2.2) * smooth01((dist - T.NEAR) / T.NEAR);
        }
        R.tracer.geometry.attributes.position.needsUpdate = true;
        R.tracer.geometry.attributes.alpha.needsUpdate = true;
        R.tracer.geometry.setDrawRange(0, (n - 1) * 6);
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

    /* ── the hole-in celebration ─────────────────────────────────────────

       The Pro Shop's third shelf (balls.js → CELEBRATIONS), played over the
       cup by sinkAt. js/celebrate.js moves it; this only draws what it says.
       Everything is built once here and sits in the scene hidden, which is
       enough for warmPrograms to compile it with every hole (r128's compile
       walks hidden objects too), so a celebration costs no program and no
       light mid-hole: two point clouds — light, drawn additively, and matter
       (paper, dust), drawn over — four flat rings and two beams. */
    var CELE_LIGHT = 1500, CELE_MATTER = 420, CELE_DUCKS = 24;

    /* A rubber duck, modelled: one geometry with its colours in it, a unit
       long, its origin under its middle and its beak to +x — the shape
       celebrate.js's ducks collide as (DUCK_SHAPE), dressed. Shared by the
       course's flock and the shop's picture of it. */
    var _duckGeo = null;
    function duckGeometry() {
        if (_duckGeo) return _duckGeo;
        var S = (G3.celebrate && G3.celebrate.DUCK_SHAPE) || {
            body: { c: [-0.04, 0.30, 0], r: [0.46, 0.30, 0.34] }, head: { c: [0.24, 0.70, 0], r: 0.21 } };
        var parts = [], YEL = 0xffd21f, DEEP = 0xf2b705, ORANGE = 0xff7a1a, INK = 0x15110a, WHITE = 0xffffff;
        function blob(c, r, rot, hex, ws, hs) {
            var g = new THREE.SphereGeometry(1, ws || 24, hs || 16);
            var m = new THREE.Matrix4().compose(new THREE.Vector3(c[0], c[1], c[2]),
                new THREE.Quaternion().setFromEuler(new THREE.Euler(rot ? rot[0] : 0, rot ? rot[1] : 0, rot ? rot[2] : 0)),
                new THREE.Vector3(r[0], r[1], r[2]));
            g.applyMatrix4(m);
            parts.push({ g: g.toNonIndexed(), c: new THREE.Color(hex) });
        }
        var B = S.body, H = S.head;
        blob(B.c, B.r, null, YEL, 28, 18);
        // The tail, turned up behind.
        blob([B.c[0] - 0.36, B.c[1] + 0.12, 0], [0.17, 0.11, 0.15], [0, 0, 0.75], YEL, 14, 10);
        blob(H.c, [H.r, H.r, H.r], null, YEL, 24, 16);
        // Wings, a shade deeper, lying along the flanks.
        [1, -1].forEach(function (k) {
            blob([B.c[0] - 0.02, B.c[1] + 0.06, k * (B.r[2] - 0.035)], [0.22, 0.12, 0.05], [k * 0.12, 0, 0.22], DEEP, 16, 10);
        });
        // The beak: an upper and a lower bill.
        blob([H.c[0] + 0.21, H.c[1] - 0.025, 0], [0.13, 0.045, 0.10], [0, 0, -0.08], ORANGE, 16, 10);
        blob([H.c[0] + 0.18, H.c[1] - 0.075, 0], [0.10, 0.03, 0.08], [0, 0, 0.12], ORANGE, 14, 8);
        // Eyes with a glint.
        [1, -1].forEach(function (k) {
            blob([H.c[0] + 0.13, H.c[1] + 0.07, k * 0.125], [0.038, 0.042, 0.03], null, INK, 10, 8);
            blob([H.c[0] + 0.155, H.c[1] + 0.088, k * 0.142], [0.012, 0.012, 0.01], null, WHITE, 6, 4);
        });
        var n = 0;
        parts.forEach(function (p) { n += p.g.attributes.position.count; });
        var pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), col = new Float32Array(n * 3), o = 0;
        parts.forEach(function (p) {
            var pa = p.g.attributes.position.array, na = p.g.attributes.normal.array;
            pos.set(pa, o * 3);
            nor.set(na, o * 3);
            for (var i = 0; i < p.g.attributes.position.count; i++) {
                col[(o + i) * 3] = p.c.r; col[(o + i) * 3 + 1] = p.c.g; col[(o + i) * 3 + 2] = p.c.b;
            }
            o += p.g.attributes.position.count;
            p.g.dispose();
        });
        var geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        geo.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
        geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
        geo.computeBoundingSphere();
        _duckGeo = geo;
        return geo;
    }
    // Gloss rubber: lit, a soft highlight, nothing of metal.
    function duckMaterial() {
        return new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.32, metalness: 0 });
    }
    // A soft dark pool under each duck, so a duck on the green is on it.
    var _duckShadowTex = null;
    function duckShadowTex() {
        if (_duckShadowTex) return _duckShadowTex;
        _duckShadowTex = celeCanvas(function (x) {
            var gr = x.createRadialGradient(64, 64, 0, 64, 64, 64);
            gr.addColorStop(0, 'rgba(0,0,0,0.55)');
            gr.addColorStop(0.6, 'rgba(0,0,0,0.25)');
            gr.addColorStop(1, 'rgba(0,0,0,0)');
            x.fillStyle = gr;
            x.fillRect(0, 0, 128, 128);
        });
        return _duckShadowTex;
    }
    function duckFlock(n) {
        var flock = new THREE.InstancedMesh(duckGeometry(), duckMaterial(), n);
        flock.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
        flock.frustumCulled = false;
        flock.count = 0;
        var sg = new THREE.PlaneGeometry(1, 1);
        sg.rotateX(-Math.PI / 2);
        var shade = new THREE.InstancedMesh(sg, new THREE.MeshBasicMaterial({
            map: duckShadowTex(), transparent: true, depthWrite: false, fog: false,
            polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2
        }), n);
        shade.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
        shade.frustumCulled = false;
        shade.renderOrder = 3;
        shade.count = 0;
        return { mesh: flock, shade: shade, n: n };
    }
    var _dm = null, _dq = null, _dv = null, _ds = null;
    // Lay the effect's ducks into a flock's instances; `k` is the effect's drawn scale.
    function poseFlock(F, parts) {
        if (!_dm) { _dm = new THREE.Matrix4(); _dq = new THREE.Quaternion(); _dv = new THREE.Vector3(); _ds = new THREE.Vector3(); }
        var n = 0;
        for (var i = 0; i < parts.length && n < F.n; i++) {
            var p = parts[i];
            if (!p.duck || p.oa <= 0.002 || p.os <= 0.001) continue;
            _dq.set(p.oq[0], p.oq[1], p.oq[2], p.oq[3]);
            _dv.set(p.ox, p.oy, p.oz);
            _ds.set(p.os, p.os, p.os);
            _dm.compose(_dv, _dq, _ds);
            F.mesh.setMatrixAt(n, _dm);
            // The shadow: under it on the green, smaller and fainter the higher it is.
            var lift = Math.max(0, p.oy), fade = Math.max(0.15, 1 - lift / 3.5);
            _dq.set(0, 0, 0, 1);
            _dv.set(p.ox, 0.012, p.oz);
            _ds.set(p.os * 1.05 * fade, 1, p.os * 0.85 * fade);
            _dm.compose(_dv, _dq, _ds);
            F.shade.setMatrixAt(n, _dm);
            n++;
        }
        F.mesh.count = F.shade.count = n;
        F.mesh.instanceMatrix.needsUpdate = F.shade.instanceMatrix.needsUpdate = true;
        F.mesh.visible = F.shade.visible = n > 0;
    }
    var CELE_VS = [
        'attribute float size;',
        'attribute float alpha;',
        'attribute vec3 tint;',
        'uniform float uHalfH;',
        'varying vec3 vTint;',
        'varying float vAlpha;',
        'void main() {',
        '    vec4 mv = modelViewMatrix * vec4(position, 1.0);',
        '    gl_Position = projectionMatrix * mv;',
        // World-true size: the projection's own focal length, over the depth.
        '    gl_PointSize = clamp(abs(size) * projectionMatrix[1][1] * uHalfH / max(0.05, -mv.z), 0.0, 256.0);',
        '    vTint = tint;',
        '    vAlpha = alpha;',
        '}'
    ].join('\n');
    var CELE_FS_LIGHT = [
        'varying vec3 vTint;',
        'varying float vAlpha;',
        'void main() {',
        '    float d = length(gl_PointCoord - 0.5) * 2.0;',
        '    if (d > 1.0) discard;',
        // A hot white core inside a soft coloured halo.
        '    float halo = pow(1.0 - d, 1.2);',
        '    float core = smoothstep(0.3, 0.0, d);',
        '    gl_FragColor = vec4(mix(vTint * 1.25, vec3(1.0), core * 0.35), min(1.0, halo * 1.3) * vAlpha);',
        '}'
    ].join('\n');
    var CELE_FS_MATTER = [
        'varying vec3 vTint;',
        'varying float vAlpha;',
        'void main() {',
        // A strip of paper (or a fleck of dust), not a disc.
        '    vec2 q = abs(gl_PointCoord - 0.5);',
        '    if (q.y > 0.22 || q.x > 0.48) discard;',
        '    gl_FragColor = vec4(vTint, vAlpha);',
        '}'
    ].join('\n');

    function celeCloud(n, light) {
        var g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(n * 3), 3));
        g.setAttribute('tint', new THREE.Float32BufferAttribute(new Float32Array(n * 3), 3));
        g.setAttribute('alpha', new THREE.Float32BufferAttribute(new Float32Array(n), 1));
        g.setAttribute('size', new THREE.Float32BufferAttribute(new Float32Array(n), 1));
        g.setDrawRange(0, 0);
        var m = new THREE.ShaderMaterial({
            uniforms: { uHalfH: { value: 400 } },
            vertexShader: CELE_VS,
            fragmentShader: light ? CELE_FS_LIGHT : CELE_FS_MATTER,
            transparent: true, depthWrite: false,
            blending: light ? THREE.AdditiveBlending : THREE.NormalBlending
        });
        var pts = new THREE.Points(g, m);
        pts.frustumCulled = false;
        pts.renderOrder = light ? 6 : 5;
        // Sized to whatever it is being drawn into: the screen or the post chain's target.
        pts.onBeforeRender = function (renderer) {
            var rt = renderer.getRenderTarget();
            m.uniforms.uHalfH.value = 0.5 * (rt ? rt.height : renderer.getContext().drawingBufferHeight);
        };
        return pts;
    }

    function celeCanvas(draw) {
        var c = document.createElement('canvas');
        c.width = c.height = 128;
        draw(c.getContext('2d'));
        return new THREE.CanvasTexture(c);
    }

    function buildCelebration() {
        var grp = new THREE.Group();
        grp.visible = false;
        var light = celeCloud(CELE_LIGHT, true), matter = celeCloud(CELE_MATTER, false);
        /* The Easter egg's ducks, in 3D: one instanced mesh, built and warmed
           with the hole like everything else here, so the first duck costs no
           compile. Lit by the course's own lights, which it adds none to. */
        var ducks = duckFlock(CELE_DUCKS);
        grp.add(ducks.shade);
        grp.add(ducks.mesh);
        grp.add(matter);
        grp.add(light);
        // A soft ring: bright at its rim, nothing inside or out.
        var ringTex = celeCanvas(function (x) {
            var gr = x.createRadialGradient(64, 64, 0, 64, 64, 64);
            gr.addColorStop(0, 'rgba(255,255,255,0)');
            gr.addColorStop(0.72, 'rgba(255,255,255,0)');
            gr.addColorStop(0.9, 'rgba(255,255,255,1)');
            gr.addColorStop(1, 'rgba(255,255,255,0)');
            x.fillStyle = gr;
            x.fillRect(0, 0, 128, 128);
        });
        var ringGeo = new THREE.PlaneGeometry(2, 2);
        ringGeo.rotateX(-Math.PI / 2);
        var rings = [];
        for (var i = 0; i < 4; i++) {
            var rm = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({
                map: ringTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
                side: THREE.DoubleSide, fog: false
            }));
            rm.renderOrder = 4;
            rm.frustumCulled = false;
            grp.add(rm);
            rings.push(rm);
        }
        // A beam: brightest at its foot, gone by its top.
        var beamTex = celeCanvas(function (x) {
            var gr = x.createLinearGradient(0, 128, 0, 0);
            gr.addColorStop(0, 'rgba(255,255,255,1)');
            gr.addColorStop(0.35, 'rgba(255,255,255,0.55)');
            gr.addColorStop(1, 'rgba(255,255,255,0)');
            x.fillStyle = gr;
            x.fillRect(0, 0, 128, 128);
        });
        var beamGeo = new THREE.CylinderGeometry(1, 1, 1, 24, 1, true);
        beamGeo.translate(0, 0.5, 0);
        var beams = [];
        for (i = 0; i < 2; i++) {
            var bm = new THREE.Mesh(beamGeo, new THREE.MeshBasicMaterial({
                map: beamTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
                side: THREE.DoubleSide, fog: false
            }));
            bm.renderOrder = 4;
            bm.frustumCulled = false;
            grp.add(bm);
            beams.push(bm);
        }
        /* Singularity's black hole: the game's own black-hole shader, the
           one a pipe opens in the sky (addMouth), turned to the camera. Its
           own material rather than one from blackHoleMaterial, which belongs
           to the hole and is thrown away with it; the same source and defines,
           so it is the same program. */
        var bhMat = new THREE.ShaderMaterial({
            defines: { FACING: '' },
            uniforms: {
                time: { value: 0 }, size: { value: 2.4 }, open: { value: 0.01 },
                hor: { value: 0.3 }, ring: { value: 0.44 }, feed: { value: 1.4 }, shade: { value: 0.2 },
                gulp: { value: 0 }, spin: { value: 1.6 }, beam: { value: 0.45 }, rim: { value: 0 },
                hot: { value: lin(0xd6b0ff).multiplyScalar(2.2) }, cool: { value: lin(0x5a3cff).multiplyScalar(2.2) }
            },
            vertexShader: SH.BLACKHOLE_VS,
            fragmentShader: SH.BLACKHOLE_FS,
            transparent: true, depthWrite: false, premultipliedAlpha: true, side: THREE.DoubleSide
        });
        var hole = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), bhMat);
        hole.frustumCulled = false;
        hole.renderOrder = 3;
        hole.raycast = function () {};
        hole.visible = false;
        grp.add(hole);
        R.scene.add(grp);
        /* The scripts are written in units that read from the putting seat;
           the victory lap backs out to ten or eighteen, so it is all drawn half
           as big again. */
        R.cele = { group: grp, light: light, matter: matter, ducks: ducks, rings: rings, beams: beams, hole: hole,
            fx: null, at: new THREE.Vector3(), scale: 1.5 };
        grp.scale.setScalar(R.cele.scale);
        R.celeId = R.celeId || 'cele-classic';
    }

    // Which one goes off: the equipped celebration (game.js, from the save).
    function setCelebration(id) { R.celeId = id || 'cele-classic'; }

    function celebrate(x, y, z, id) {
        if (!R.cele || !G3.celebrate) return false;
        R.cele.fx = G3.celebrate.start(id || R.celeId);
        R.cele.at.set(x, y, z);
        R.cele.group.position.set(x, y, z);
        R.cele.group.visible = true;
        stepCelebration(0);
        return true;
    }

    function stepCelebration(dt) {
        var c = R.cele;
        if (!c || !c.fx) return;
        var live = G3.celebrate.step(c.fx, Math.min(dt, 0.05));
        var fx = c.fx;
        poseFlock(c.ducks, fx.parts);
        [[c.light, true, CELE_LIGHT], [c.matter, false, CELE_MATTER]].forEach(function (e) {
            var g = e[0].geometry, pos = g.attributes.position.array, tint = g.attributes.tint.array;
            var al = g.attributes.alpha.array, sz = g.attributes.size.array, n = 0;
            for (var i = 0; i < fx.parts.length && n < e[2]; i++) {
                var p = fx.parts[i];
                if (p.duck || p.add !== e[1] || p.oa <= 0.002) continue;
                pos[n * 3] = p.ox; pos[n * 3 + 1] = p.oy; pos[n * 3 + 2] = p.oz;
                tint[n * 3] = p.or; tint[n * 3 + 1] = p.og; tint[n * 3 + 2] = p.ob;
                al[n] = p.oa; sz[n] = p.os * c.scale;
                n++;
            }
            g.setDrawRange(0, n);
            g.attributes.position.needsUpdate = g.attributes.tint.needsUpdate = true;
            g.attributes.alpha.needsUpdate = g.attributes.size.needsUpdate = true;
        });
        c.rings.forEach(function (m, i) {
            var r = fx.rings[i];
            m.visible = !!(r && r.oa > 0.002);
            if (!m.visible) return;
            m.position.y = r.y;
            m.scale.set(r.or, 1, r.or);
            m.material.color.setRGB(r.c[0], r.c[1], r.c[2]);
            m.material.opacity = r.oa;
        });
        c.beams.forEach(function (m, i) {
            var b = fx.beams[i];
            m.visible = !!(b && b.oa > 0.002);
            if (!m.visible) return;
            m.scale.set(b.or, Math.max(0.01, b.oh), b.or);
            m.material.color.setRGB(b.c[0], b.c[1], b.c[2]);
            m.material.opacity = b.oa;
        });
        // What the effect says out loud (the duck's squeaks), once each.
        var now = R.clock;
        while (fx.events.length) {
            var ev = fx.events.shift();
            // A shower of ducks landing together is a few squeaks, not forty at once.
            if (ev === 'squeak') { if (now - (c.squeakAt || -1) < 0.09) continue; c.squeakAt = now; }
            if (G3.audio && G3.audio[ev]) G3.audio[ev]();
        }
        var h = fx.hole;
        c.hole.visible = !!h;
        if (h) {
            var u = c.hole.material.uniforms;
            c.hole.position.set(0, h.y, 0);
            u.size.value = h.size * c.scale;
            u.open.value = h.open;
            u.gulp.value = h.gulp;
            u.time.value = R.clock;
        }
        if (!live) { c.fx = null; c.group.visible = false; }
    }

    /* What the celebration bends on the screen (postfx lens, through
       lensList): its black hole while it is open, and any ripple running out. */
    function celeLenses(add) {
        var c = R.cele;
        if (!c || !c.fx || !c.group.visible) return;
        var fx = c.fx, sc = c.scale, at = c.at, i;
        if (fx.hole && fx.hole.k > 0.01) {
            add(at.x, at.y + fx.hole.y * sc, at.z, fx.hole.size * sc * 0.3 * fx.hole.open, fx.hole.k);
        }
        for (i = 0; i < fx.lenses.length; i++) {
            var L = fx.lenses[i];
            if (L.ok > 0.01) add(at.x, at.y + L.y * sc, at.z, L.or * sc * 0.22, L.ok);
        }
    }

    function celebrating() { return !!(R.cele && R.cele.fx); }

    function stopCelebration() {
        if (!R.cele) return;
        R.cele.fx = null;
        R.cele.group.visible = false;
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

    /* ── what stands still is drawn together ────────────────────────────

       A rail is a box, a trunk is a cylinder and a rock is three lumps, and
       each used to be a mesh of its own: a mesh is a draw call, and a draw
       call is paid twice a frame, once for the picture and once for the
       sun's shadow map. The Marble Run is eighty boxes — 166 of the 387
       calls its frame made — and a parkland hole's trunks and stones were
       another two hundred. None of them ever moves and each kind wears one
       material, so `stand` collects them as a hole is built and `standAll`
       leaves one mesh per material in their place: the same triangles in
       the same places, sent in a handful of calls.

       Only what is still. A gate, a blade or a flipper is placed every
       frame (R.movers) and a tree's crown leans in the wind (R.canopies);
       those stay meshes of their own. */
    var _standAt = new THREE.Object3D();
    function stand(group, geo, mat, x, y, z, rx, ry, rz) {
        if (!R.standing) {
            // Not inside a build (nothing calls it so): a mesh, as it was.
            var one = new THREE.Mesh(geo, mat);
            one.position.set(x, y, z);
            one.rotation.set(rx || 0, ry || 0, rz || 0);
            one.castShadow = one.receiveShadow = true;
            group.add(one);
            return;
        }
        _standAt.position.set(x, y, z);
        _standAt.rotation.set(rx || 0, ry || 0, rz || 0);
        _standAt.updateMatrix();
        var lot = R.standing[mat.uuid] || (R.standing[mat.uuid] = { mat: mat, parts: [], verts: 0, idx: 0 });
        var n = geo.attributes.position.count;
        lot.parts.push({ geo: geo, m: _standAt.matrix.clone() });
        lot.verts += n;
        lot.idx += geo.index ? geo.index.count : n;
    }

    var _sv = new THREE.Vector3(), _sn = new THREE.Matrix3();
    function standAll(group) {
        var lots = R.standing, key, lot, i, k, part, pos, nor, uv, ix, at, ia, mesh, geo;
        R.standing = null;
        for (key in lots || {}) {
            lot = lots[key];
            var P3 = new Float32Array(lot.verts * 3), N3 = new Float32Array(lot.verts * 3);
            var U2 = new Float32Array(lot.verts * 2);
            var I = lot.verts > 65535 ? new Uint32Array(lot.idx) : new Uint16Array(lot.idx);
            at = 0; ia = 0;
            for (i = 0; i < lot.parts.length; i++) {
                part = lot.parts[i];
                pos = part.geo.attributes.position; nor = part.geo.attributes.normal;
                uv = part.geo.attributes.uv; ix = part.geo.index;
                _sn.getNormalMatrix(part.m);
                for (k = 0; k < pos.count; k++) {
                    _sv.fromBufferAttribute(pos, k).applyMatrix4(part.m);
                    P3[(at + k) * 3] = _sv.x; P3[(at + k) * 3 + 1] = _sv.y; P3[(at + k) * 3 + 2] = _sv.z;
                    if (nor) {
                        _sv.fromBufferAttribute(nor, k).applyMatrix3(_sn).normalize();
                        N3[(at + k) * 3] = _sv.x; N3[(at + k) * 3 + 1] = _sv.y; N3[(at + k) * 3 + 2] = _sv.z;
                    }
                    if (uv) { U2[(at + k) * 2] = uv.getX(k); U2[(at + k) * 2 + 1] = uv.getY(k); }
                }
                if (ix) for (k = 0; k < ix.count; k++) I[ia++] = ix.getX(k) + at;
                else for (k = 0; k < pos.count; k++) I[ia++] = at + k;
                at += pos.count;
                part.geo.dispose();
            }
            geo = new THREE.BufferGeometry();
            geo.setAttribute('position', new THREE.BufferAttribute(P3, 3));
            geo.setAttribute('normal', new THREE.BufferAttribute(N3, 3));
            geo.setAttribute('uv', new THREE.BufferAttribute(U2, 2));
            geo.setIndex(new THREE.BufferAttribute(I, 1));
            mesh = new THREE.Mesh(geo, lot.mat);
            mesh.castShadow = mesh.receiveShadow = true;
            // How many things this one mesh is, for the inspector and the tests.
            mesh.userData.standing = lot.parts.length;
            group.add(mesh);
        }
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
        // …and the far colour rides on it for the same reason.
        shader.uniforms.shellFar = { value: this.userData.shellFar };
        // …and the nest round the ball, one object every layer shares, so
        // the frame moves it once for all of them (nestBall).
        shader.uniforms.turfNest = R.nest;
        shader.vertexShader = SH.TURF_VS_HEAD +
            shader.vertexShader.replace('#include <begin_vertex>', SH.TURF_VS_BODY);
        shader.fragmentShader = SH.TURF_FS_HEAD +
            shader.fragmentShader.replace('#include <alphatest_fragment>', SH.TURF_FS_BODY);
    }

    /* Strata: the cut earth banded by height, for a theme that names its beds
       (`theme.strata`, the canyon's). A canyon wall is the one face on the
       card that is the whole picture, and one flat colour on it read as a
       wall painted red; the eye knows the Grand Canyon by its beds running
       level across every butte. So the colour is a function of *world*
       height, not of the face — the same bed comes out at the same level on
       every cliff on the hole, which is exactly what makes it read as rock
       laid down rather than paint put on. Each stop is [y, colour], the
       colour from that height up; the boundaries wander a little with x and
       z, every bed carries finer bedding inside it, and a faint vertical
       streak (the desert varnish a wall wears) breaks the bands up. The
       colours are baked into the source — one program, keyed by the palette
       and how wet it is — so there is no uniform to keep in step. */
    function strataOn(mat, stops, damp) {
        function f(n) { return n.toFixed(4); }
        function col(hex) {
            var c = new THREE.Color(hex).multiplyScalar(damp);
            return 'vec3(' + f(c.r) + ', ' + f(c.g) + ', ' + f(c.b) + ')';
        }
        var src = [
            'varying vec3 vStrata;',
            'vec3 strataAt(vec3 p) {',
            '    float h = p.y + 0.22 * sin(p.x * 0.21 + p.z * 0.09) + 0.16 * sin(p.z * 0.33 - p.x * 0.12);',
            '    vec3 c = ' + col(stops[0][1]) + ';'
        ], i;
        for (i = 1; i < stops.length; i++) {
            src.push('    c = mix(c, ' + col(stops[i][1]) + ', smoothstep(' +
                f(stops[i][0] - 0.12) + ', ' + f(stops[i][0] + 0.12) + ', h));');
        }
        src.push(
            '    float bed = 0.95 + 0.05 * sin(h * 7.0 + sin(p.x * 0.6 + p.z * 0.4) * 1.4);',
            '    float streak = 0.93 + 0.07 * sin(p.x * 2.7 + p.z * 1.9 + sin(p.x * 0.5 - p.z * 0.7) * 2.0);',
            '    return c * bed * streak;',
            '}', '');
        var key = 'strata:' + damp.toFixed(3) + ':' + JSON.stringify(stops);
        mat.onBeforeCompile = function (sh) {
            sh.vertexShader = 'varying vec3 vStrata;\n' + sh.vertexShader.replace('#include <project_vertex>',
                '#include <project_vertex>\n    vStrata = (modelMatrix * vec4(transformed, 1.0)).xyz;');
            sh.fragmentShader = src.join('\n') + sh.fragmentShader.replace('#include <color_fragment>',
                '#include <color_fragment>\n    diffuseColor.rgb = strataAt(vStrata);');
        };
        mat.customProgramCacheKey = function () { return key; };
        return mat;
    }

    function buildSurfaces(theme) {
        var wet = R.weather ? (R.weather.wet || 0) : 0;
        var tex = TX.surfaces(theme);
        // Wet ground is darker ground, whatever it is made of.
        var damp = new THREE.Color(1, 1, 1).multiplyScalar(1 - wet * 0.24);
        /* Cut earth, and double-sided on purpose.

           A skirt is wound so its outside faces out, which is the only side
           there was ever anything to see from: every pad on the first eleven
           courses stands *above* the surround, so you are always outside the
           wall looking in at the course. A gorge is the first piece of ground
           where the camera goes below the lip and looks at the country's own
           skirts from the inside — and a single-sided wall seen from behind is
           not a wall, it is a hole with the surround showing through it. Two
           units of Dunmore's ravine came out as a mauve gash round the rim.

           Doubling costs nothing anywhere else: a skirt is under the ground it
           hangs from, so the back of one is only ever visible from inside a
           hole in the world, which is exactly the case this is for. */
        var side = new THREE.MeshLambertMaterial({
            color: new THREE.Color(theme.side).multiplyScalar(1 - wet * 0.20),
            side: THREE.DoubleSide
        });
        if (theme.strata) strataOn(side, theme.strata, 1 - wet * 0.20);

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
                // A theme may tint it (Île Flottante's custard: until v1.226.2
                // its `sand` was never read, and its meringue islands were
                // white on beige with no edge to see).
                if (theme.sand) m.color.multiply(new THREE.Color(theme.sand));
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
            /* Glass, for the grid world: dark, glossy and faintly lit from
               inside, with no texture and no blades — and the grid is part of
               it (gridGlass), so the lines lie exactly on the surface. */
            glass: gridGlass(new THREE.MeshPhongMaterial(Object.assign({
                color: 0x05030f, emissive: 0x10032e, shininess: 260, specular: 0x1c0c38
            }, theme.glass)), theme),
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
        // A neon rail: the same paint, lit from inside as well, so the bloom
        // picks it up the way it picks up the grid.
        function glow(mat, color) {
            mat.emissive = new THREE.Color(color).multiplyScalar(0.7);
            return mat;
        }
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
            var out = [], i, f, mat, tint;
            var warm = new THREE.Color('#dff0ae');
            /* One layer's colour: darker at the roots, and the last of it
               warming towards the light. */
            function shade(at) {
                return new THREE.Color(base)
                    .multiplyScalar((0.40 + 0.68 * at) * (1 - wet * 0.24))
                    .lerp(warm, at * at * 0.16 * (1 - wet));
            }
            /* And the colour the whole stack comes to from far enough away
               that the gaps between the blades have closed — which is what
               the shader's LOD leaves standing when it stops cutting out (see
               shaders.js → the turf). It is the one number here that was
               measured rather than chosen: past the LOD the top shell is what
               is left covering the ground, and a frame that converges on its
               own colour comes out a sixth brighter than a supersampled render
               of the same frame, because a stack seen close up is blades *and*
               the shade between them. This is the height whose shade matches
               that render. */
            var mean = shade(0.43);
            for (i = 0; i < layers; i++) {
                f = (i + 0.3) / layers;
                tint = shade(f);
                mat = new THREE.MeshLambertMaterial({
                    map: tex,
                    /* Never quite 0 — a layer that keeps every texel is a
                       sheet of grass-coloured film lying over the pad — and
                       never quite 1, or the top shell is empty on a hole where
                       the turf shader has thinned it. */
                    alphaTest: 0.05 + (layers > 1 ? i / (layers - 1) : 0) * 0.74,
                    color: tint,
                    // Opaque with a cut-out, not blended: alphaTest writes
                    // depth, so six layers sort themselves and cost no more
                    // than six opaque draws.
                    transparent: false,
                    side: THREE.FrontSide
                });
                /* What that layer has to be multiplied by to arrive at the
                   stack's far colour, which is the only way a per-layer
                   material can converge on a colour that is not its own. */
                mat.userData.shellFar = new THREE.Vector3(
                    mean.r / Math.max(tint.r, 1e-3),
                    mean.g / Math.max(tint.g, 1e-3),
                    mean.b / Math.max(tint.b, 1e-3)
                );
                // Zero is a width, not a missing argument: it is the green,
                // asking for no stripe. Hence the explicit test.
                mat.userData.mowK = mow === 0 ? 0 : Math.PI / (mow || TX.MOW);
                /* The splice asks how much ground a pixel covers, which is a
                   derivative — core in WebGL 2 and an extension in WebGL 1,
                   where a shader that uses `fwidth` without declaring it does
                   not compile. Declaring it costs nothing on a context that
                   already has it. */
                mat.extensions = { derivatives: true };
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
                /* And none on the rough. It was mown in the same stripes as
                   the fairway until v1.134.1, which on the long game striped
                   every rectangle of property from stake to stake, so the one
                   shape a hole is played on — the fairway's mown edge,
                   wandering through the rough (courses `mow`) — was the one
                   shape you could not see from anywhere. */
                rough: shells('rough', TX.shellFor('rough'), '#3c6b34', SHELL_LAYERS, 0)
            },
            walls: {
                rail: theme.glow ? glow(paint(theme.rail), theme.rail) : paint(theme.rail),
                blade: paint(0xd8523f),
                gate: paint(0xe0a13a),
                // A bumper is meant to be aimed at, so it is the one thing on a
                // hole painted a colour nothing else on it wears.
                bumper: paint(0xf0409a),
                beam: paint(0x9a6a3c),
                // A mill's wings are brick, its tower tarred timber, and its
                // sails pale cloth on a timber frame — pale against the dark
                // tower, so a sail reads from the tee (addSails).
                mill: paint(0xa4553b),
                tower: paint(0x4f3d31),
                sails: paint(0x8a5d36),
                cloth: paint(0xf3eee2),
                cap: paint(0x2f2a2c),
                // A tree is not drawn as a box (see addTree); this is only
                // what its trunk is made of, and it is matt because bark is.
                tree: new THREE.MeshLambertMaterial({
                    color: new THREE.Color(0x6b503a).multiplyScalar(1 - wet * 0.25)
                }),
                /* Nor is a rock (see addRock). Matt for the same reason bark
                   is, and tinted per theme off the same key the horizon ridge
                   is cut from, so the stone on a hole and the stone on the
                   skyline behind it are the same rock. */
                rock: new THREE.MeshLambertMaterial({
                    color: new THREE.Color(
                        theme.rock || (theme.ridge && theme.ridge.cap) || 0x8b8578
                    ).multiplyScalar((1 - wet * 0.22) * 0.86)
                })
            },
            // The round trees' own green: a little warmer than either of the two
            // below, which is most of what tells a round tree from a blob.
            leafWarm: new THREE.MeshLambertMaterial({
                color: new THREE.Color(0x6aa43f).multiplyScalar(1 - wet * 0.22)
            }),
            // A fir's needles, darker and bluer than any broadleaf (addTree).
            fir: new THREE.MeshLambertMaterial({
                color: new THREE.Color(0x2c5638).multiplyScalar(1 - wet * 0.22)
            }),
            // Two leaf greens, so a treeline is not one colour repeated.
            leaf: [
                new THREE.MeshLambertMaterial({
                    color: new THREE.Color(0x3d7a32).multiplyScalar(1 - wet * 0.22)
                }),
                new THREE.MeshLambertMaterial({
                    color: new THREE.Color(0x59993f).multiplyScalar(1 - wet * 0.22)
                })
            ],
            post: new THREE.MeshLambertMaterial({ color: 0x6b7280 }),
            decor: {
                wood: new THREE.MeshLambertMaterial({
                    color: new THREE.Color(0x5c4228).multiplyScalar(1 - wet * 0.2)
                }),
                woodPale: new THREE.MeshLambertMaterial({
                    color: new THREE.Color(0xb08d57).multiplyScalar(1 - wet * 0.15)
                }),
                rope: new THREE.MeshLambertMaterial({
                    color: new THREE.Color(0x8a7050).multiplyScalar(1 - wet * 0.2)
                }),
                metalDark: new THREE.MeshLambertMaterial({
                    color: new THREE.Color(0x2d3436)
                }),
                buoyRed: new THREE.MeshLambertMaterial({
                    color: new THREE.Color(0xd63031)
                }),
                buoyWhite: new THREE.MeshLambertMaterial({
                    color: new THREE.Color(0xf5f6fa)
                }),
                buoyYellow: new THREE.MeshLambertMaterial({
                    color: new THREE.Color(0xf1c40f)
                }),
                boatHull: new THREE.MeshLambertMaterial({
                    color: new THREE.Color(0x34495e)
                }),
                binBody: new THREE.MeshLambertMaterial({
                    color: new THREE.Color(0x2f3640)
                }),
                model: new THREE.MeshLambertMaterial({
                    vertexColors: true
                })
            }
        };
    }

    /* A box, as two things to draw rather than six.

       three.js makes a box as six faces, each a group of its own so each can
       wear a material, and draws a group at a time: a flat pad was six draw
       calls for the picture and six more for the sun's shadow map, five of
       each in the same earth-coloured paint. The Marble Run's seven floors
       were 84 of its frame's calls. Here the faces are put in the order top,
       then the other five, as two groups — the shape an extruded slab
       already has (caps, then walls) — so a box wears the slab's pair of
       materials and is drawn in two calls a pass. */
    function capAndSides(geo) {
        var ix = geo.index.array, out = new ix.constructor(ix.length), k;
        for (k = 0; k < 6; k++) out[k] = ix[12 + k];            // +y: the top
        for (k = 0; k < 12; k++) out[6 + k] = ix[k];            // +x, -x
        for (k = 0; k < 18; k++) out[18 + k] = ix[18 + k];      // -y, +z, -z
        geo.setIndex(new THREE.BufferAttribute(out, 1));
        geo.clearGroups();
        geo.addGroup(0, 6, 0);
        geo.addGroup(6, 30, 1);
        return geo;
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
                (weather.tintAmt === undefined ? 0.4 : weather.tintAmt) * tintScale());
        }
        return c;
    }

    /* How far the weather may move a theme's sky, 1 all the way, named per
       weather (`theme.tintScale`). The grid world takes rain and a golden
       hour, but its sky's whole job is to be dark behind the glow, and
       rain's grey pulled it to a pale lavender that switched the neon off —
       so under rain it keeps most of its own colour, while a golden hour is
       left to turn it the peach of a vaporwave sunset, which is the point. */
    function tintScale() {
        var t = R.theme && R.theme.tintScale, k = t && R.weather ? t[R.weather.id] : undefined;
        return k === undefined ? 1 : k;
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
    /* A rectangular pad's outline as a Shape, built around the pad's centre
       in the plane three.js extrudes — shape-y runs along world -z once the
       rotation after it lays it flat. With `pad.round` its exposed corners
       are quarter-circles (courses.roundCorners), at a chord fine enough
       that the rail standing on the curve hides the facets. A pad with no
       rounding comes out as the four corners it always was. */
    function slabShape(pad) {
        if (pad.lane) return laneShape(pad);
        var shape = new THREE.Shape();
        var hw = pad.w / 2, hd = pad.d / 2, c = pad.round || {}, ch = pad.cham || {};
        // Counter-clockwise in shape space, each corner as [x, y, its world
        // name, the angle its arc starts at, and whether it is cut straight].
        var corners = [[-hw, -hd, c.nw, Math.PI, ch.nw], [hw, -hd, c.ne, Math.PI * 1.5, ch.ne],
                       [hw, hd, c.se, 0, ch.se], [-hw, hd, c.sw, Math.PI / 2, ch.sw]];
        var i, k, r, ox, oy, a, n, first = true;
        for (i = 0; i < corners.length; i++) {
            r = corners[i][2];
            if (!r) {
                if (first) shape.moveTo(corners[i][0], corners[i][1]);
                else shape.lineTo(corners[i][0], corners[i][1]);
                first = false;
                continue;
            }
            ox = corners[i][0] - Math.sign(corners[i][0]) * r;
            oy = corners[i][1] - Math.sign(corners[i][1]) * r;
            // A chamfer (pad.cham) is the chord between the arc's two ends.
            n = corners[i][4] ? 1 : Math.max(6, Math.ceil(r / 0.12));
            for (k = 0; k <= n; k++) {
                a = corners[i][3] + (Math.PI / 2) * k / n;
                if (first) shape.moveTo(ox + Math.cos(a) * r, oy + Math.sin(a) * r);
                else shape.lineTo(ox + Math.cos(a) * r, oy + Math.sin(a) * r);
                first = false;
            }
        }
        shape.closePath();
        return shape;
    }

    /* A road's outline (courses.road) in the same shape space: its box is
       only its bounds, so the slab, its grass and the hole punched for a cup
       all come off the curve physics.laneOutline walks — the one the ball
       rolls off. A chord of a tenth keeps a two-metre road round to the eye
       at any distance the camera gets to. */
    function laneShape(pad) {
        var cx = pad.x + pad.w / 2, cz = pad.z + pad.d / 2;
        var pts = P.laneOutline(pad.lane, 0.1), shape = new THREE.Shape(), i;
        for (i = 0; i < pts.length; i++) {
            if (i) shape.lineTo(pts[i][0] - cx, -(pts[i][1] - cz));
            else shape.moveTo(pts[i][0] - cx, -(pts[i][1] - cz));
        }
        shape.closePath();
        return shape;
    }

    function punchedSlab(pad, thick, cup) {
        var shape = slabShape(pad);
        var hw = pad.w / 2, hd = pad.d / 2;

        if (cup) {
            var hole = new THREE.Path();
            var cx = pad.x + hw, cz = pad.z + hd;
            hole.absarc(cup.x - cx, -(cup.z - cz), R.cupR, 0, Math.PI * 2, true);
            shape.holes.push(hole);
        }

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
    function addShells(group, pad, cup, holed, cx, cy, cz, shape, bare) {
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
                geo = shellShape(pad, cup, bare);
            } else if (pad.r || pad.round || pad.lane || (bare && bare.length)) {
                geo = shellShape(pad, null, bare);
            } else {
                geo = new THREE.PlaneGeometry(pad.w, pad.d, 1, 1);
                geo.rotateX(-Math.PI / 2);
            }
            // The same world anchoring the pad under it got, at the finer
            // scale the blades tile at — which is what carries the mow bands
            // unbroken from one pad to the next.
            worldUv(geo, TX.SHELL_SCALE[pad.kind], cx, cz);
            /* Tilt, and only on the flat outlines above.

               A `shape` is the ground's own surface, sampled from
               `padHeight`, which has *already* applied the pad's cross-fall.
               Shearing that a second time tips the mat twice as far as the
               ground under it, which on a row written with `sz` buries half
               of its grass under its own soil and floats the other half: a
               pale, hard-edged band of bare pad across a hole, ending exactly
               at the row seam. It read as two different surfaces because it
               was one surface with its grass taken off. Every long-game hole
               is written in tilted rows, so every one of them had a stripe of
               it somewhere. */
            if (!shape && (sx || sz)) {
                var m = new THREE.Matrix4();
                m.set(1, 0, 0, 0,
                      sx, 1, sz, 0,
                      0, 0, 1, 0,
                      0, 0, 0, 1);
                geo.applyMatrix4(m);
                geo.computeVertexNormals();
            }
            var mesh = new THREE.Mesh(geo, set[i]);
            mesh.position.set(cx, cy + (pad.bumps || pad.field ? 0 : height * f) +
                discLift(pad), cz);
            // Lit by the sun and darkened by anything standing on the pad, but
            // casting nothing itself: a cut-out shadow needs a depth material
            // of its own, and six of those per pad would cost more than the
            // shadow is worth on grass this short.
            mesh.receiveShadow = true;
            mesh.renderOrder = 1;
            mesh.visible = i < shellCountFor();
            group.add(mesh);
            R.shells.push({
                mesh: mesh, x: cx, z: cz, layer: i,
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
        // A polygon (physics.padRadius, `sides`): its corners, exactly.
        if (pad.sides) {
            var ns = pad.sides, k, a;
            for (k = 0; k < ns; k++) {
                a = (pad.turn || 0) - k / ns * Math.PI * 2;
                if (k) shape.lineTo(Math.cos(a) * pad.r, -Math.sin(a) * pad.r);
                else shape.moveTo(Math.cos(a) * pad.r, -Math.sin(a) * pad.r);
            }
            shape.closePath();
            return shape;
        }
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

    function shellShape(pad, cup, bare) {
        var hw = pad.w / 2, hd = pad.d / 2;
        var cx = pad.x + hw, cz = pad.z + hd;
        // The disc's own outline, or the slab's — rounded corners and all.
        var shape = pad.r ? discShape(pad) : slabShape(pad);
        // A cup inside something already cut out needs no hole of its own,
        // and a hole inside a hole is one a ShapeGeometry cannot triangulate.
        if (cup && (bare || []).some(function (q) { return P.padContains(q, cup.x, cup.z); })) cup = null;
        if (cup) {
            var hole = new THREE.Path();
            // A shade wider than the cup, so no blade hangs over the rim.
            hole.absarc(cup.x - cx, -(cup.z - cz), R.cupR * 1.08, 0, Math.PI * 2, true);
            shape.holes.push(hole);
        }
        // And whatever is laid into it that grows nothing (bareInlays): the
        // inlay's own outline, moved from its middle to where it sits in this
        // pad's shape space (y is minus world z, as everywhere here).
        var i, q, ox, oy, pts;
        for (i = 0; i < (bare || []).length; i++) {
            q = bare[i];
            ox = q.x + q.w / 2 - cx;
            oy = -(q.z + q.d / 2 - cz);
            pts = discShape(q).getPoints(40).map(function (p) {
                return new THREE.Vector2(p.x + ox, p.y + oy);
            });
            shape.holes.push(new THREE.Path(pts));
        }
        var geo = new THREE.ShapeGeometry(shape, 36);
        geo.rotateX(-Math.PI / 2);
        return geo;
    }

    /* The inlays a flat pad's grass has to stop at.

       `addTerrain` has always cut its mat round anything laid into it
       (cutUnder: "the grass may not keep a single blade inside one"). A flat
       pad never did — its mat is one sheet over the whole outline — and a
       launch pad is an inlay in a flat green on every course that has one. So
       the wooden disc and the mark painted on it were three centimetres up
       under a lawn eleven and a half tall, and all that showed through the
       blades from the tee was the rim: a thin ring on the grass where a sprung
       face should have been. Deadlift, on a grey moon under a white sun, is
       where it was finally called out, and it was the same on every hole.

       Only an inlay that grows nothing of its own, wholly inside the pad and
       flush with it — or a shorter lawn laid into scrub (below). Grass laid
       into grass of its own height is a lawn on a lawn and, nested, would
       want holes that overlap, which a ShapeGeometry cannot triangulate; and
       anything touching the cup or another hole is left as it was for the same
       reason. */
    function bareInlays(pads, pad, cup) {
        var out = [], i, j, k, q, qx, qz, a, inside, clear, grows;
        if (!SHELL_HEIGHT[pad.kind] || pad.bumps || pad.field) return out;
        /* Biggest first, so where grass is nested in grass the outer lawn is
           the one cut out and the inner one is left to it. */
        var list = (pads || []).slice().sort(function (m, n) { return (n.r || 0) - (m.r || 0); });
        for (i = 0; i < list.length; i++) {
            q = list[i];
            if (q === pad || !q.inlay || !q.r) continue;
            /* Grass laid into scrub is cut out of the scrub too: a Coral Keys
               clifftop is rough with its fairway and green laid on it, and
               scrub a quarter of a unit tall stood straight up through a green
               a tenth of one. A shorter lawn in a longer one is the only grass
               cut; a lawn in a lawn of its own height is left as it was. */
            grows = SHELL_HEIGHT[q.kind];
            if (grows && !(pad.kind === 'rough' && grows < SHELL_HEIGHT.rough)) continue;
            qx = q.x + q.w / 2; qz = q.z + q.d / 2;
            if (Math.abs(P.padHeight(pad, qx, qz) - P.padHeight(q, qx, qz)) > 0.06) continue;
            inside = P.padContains(pad, qx, qz);
            for (k = 0; k < 12 && inside; k++) {
                a = k / 12 * Math.PI * 2;
                inside = P.padContains(pad, qx + Math.cos(a) * q.r * 1.05,
                                            qz + Math.sin(a) * q.r * 1.05);
            }
            if (!inside) continue;
            // A cup is either well clear of the cut or, for a green, well
            // inside it, where the green's own hole stands in for the cup's —
            // or for ice under a rug (`layer`), where the ice is holed too.
            clear = !cup || Math.hypot(cup.x - qx, cup.z - qz) > q.r + R.cupR * 1.2 ||
                ((grows || q.layer) && Math.hypot(cup.x - qx, cup.z - qz) < (q.rIn || q.r) - R.cupR * 1.2);
            for (j = 0; j < out.length && clear; j++) {
                clear = Math.hypot(out[j].x + out[j].w / 2 - qx, out[j].z + out[j].d / 2 - qz) >
                    out[j].r + q.r + 0.02;
            }
            if (clear) out.push(q);
        }
        return out;
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
    /* What a round pad is drawn lifted by. Every disc gets the hair; one
       laid into another round one (a rug on the ice of a hexagonal rink, on
       a green hexagon) says which `layer` it is, and gets a hair more for
       each, or the two coplanar tops flicker against each other. */
    function discLift(pad) {
        return pad.r ? INLAY_LIFT * (1 + (pad.layer || 0)) : 0;
    }

    // The outline of a pad, as world-space points, going round once. Used for
    // the skirt below and nowhere else — everything that needs the *inside*
    // of a pad asks physics.
    function padOutline(pad, step) {
        var pts = [], i, n, a;
        var cx = pad.x + pad.w / 2, cz = pad.z + pad.d / 2;
        if (pad.lane) return P.laneOutline(pad.lane, Math.min(step, 0.25));
        if (pad.r) {
            n = Math.max(24, Math.ceil(2 * Math.PI * pad.r / step));
            for (i = 0; i < n; i++) {
                a = i / n * Math.PI * 2;
                var rr = P.padRadius(pad, a);
                pts.push([cx + Math.cos(a) * rr, cz + Math.sin(a) * rr]);
            }
            return pts;
        }
        /* A mown pad is walked the same way round as a rectangle — along its
           near end, up its east side, back along its far end, down its west —
           with the two sides sampled finely enough that the earth wall under
           them follows the curve rather than cutting its corners. */
        if (pad.west || pad.east) {
            n = Math.max(2, Math.ceil(pad.d / Math.min(step, 0.5)));
            var wv = [], ev = [], z, ed, q;
            for (i = 0; i <= n; i++) {
                z = pad.z + pad.d * i / n;
                ed = edgesAt(pad, z);
                wv.push([ed[0], z]);
                ev.push([ed[1], z]);
            }
            var across = function (p0, p1) {
                var m = Math.max(1, Math.round(Math.abs(p1[0] - p0[0]) / step));
                for (q = 0; q < m; q++) pts.push([p0[0] + (p1[0] - p0[0]) * q / m, p0[1]]);
            };
            across(wv[0], ev[0]);
            for (i = 0; i < n; i++) pts.push(ev[i]);
            across(ev[n], wv[n]);
            for (i = n; i > 0; i--) pts.push(wv[i]);
            return pts;
        }
        var sides = [
            [pad.x, pad.z, pad.x + pad.w, pad.z],
            [pad.x + pad.w, pad.z, pad.x + pad.w, pad.z + pad.d],
            [pad.x + pad.w, pad.z + pad.d, pad.x, pad.z + pad.d],
            [pad.x, pad.z + pad.d, pad.x, pad.z]
        ];
        if (pad.round) return roundedOutline(pad, step);
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

    /* A rounded rectangle (courses.roundCorners), walked the way padOutline
       walks a square one — near end, east side, far end, west side — with
       each rounded corner as an arc of its own rather than as the corner
       points squashed on to it. */
    function roundedOutline(pad, step) {
        var c = pad.round, pts = [], i, k, n, r, t;
        var x0 = pad.x, z0 = pad.z, x1 = pad.x + pad.w, z1 = pad.z + pad.d;
        // Each corner in walking order: where it is, its radius, and the
        // bearing its arc starts at (atan2 of z, x about its centre).
        var corners = [[x0, z0, c.sw || 0, Math.PI], [x1, z0, c.se || 0, Math.PI * 1.5],
                       [x1, z1, c.ne || 0, 0], [x0, z1, c.nw || 0, Math.PI / 2]];
        var ch = pad.cham || {}, cham = [ch.sw, ch.se, ch.ne, ch.nw];
        for (i = 0; i < 4; i++) {
            var cn = corners[i], nx = corners[(i + 1) % 4];
            r = cn[2];
            if (r && cham[i]) {
                // Cut at forty-five degrees (pad.cham): the chord between the
                // arc's two ends, walked at the outline's own step.
                var sxn = cn[0] === x0 ? 1 : -1, szn = cn[1] === z0 ? 1 : -1;
                // From the point on the side arriving to the point on the side leaving.
                var p0 = i % 2 === 0 ? [cn[0], cn[1] + szn * r] : [cn[0] + sxn * r, cn[1]];
                var p1 = i % 2 === 0 ? [cn[0] + sxn * r, cn[1]] : [cn[0], cn[1] + szn * r];
                n = Math.max(1, Math.ceil(r * Math.SQRT2 / Math.min(step, 0.3)));
                for (k = 0; k < n; k++) pts.push([p0[0] + (p1[0] - p0[0]) * k / n, p0[1] + (p1[1] - p0[1]) * k / n]);
            } else if (r) {
                var ox = cn[0] + (cn[0] === x0 ? r : -r), oz = cn[1] + (cn[1] === z0 ? r : -r);
                n = Math.max(4, Math.ceil(r * Math.PI / 2 / Math.min(step, 0.15)));
                for (k = 0; k < n; k++) {
                    t = cn[3] + Math.PI / 2 * k / n;
                    pts.push([ox + Math.cos(t) * r, oz + Math.sin(t) * r]);
                }
            } else {
                pts.push([cn[0], cn[1]]);
            }
            // …then the straight between this corner's curve and the next's.
            var ax = cn[0], az = cn[1], bx = nx[0], bz = nx[1];
            var len = Math.hypot(bx - ax, bz - az), ux = (bx - ax) / len, uz = (bz - az) / len;
            var from = r, to = len - nx[2];
            n = Math.max(1, Math.round((to - from) / step));
            for (k = 0; k < n; k++) {
                t = from + (to - from) * k / n;
                pts.push([ax + ux * t, az + uz * t]);
            }
        }
        return pts;
    }

    /* Where a point in a pad's rectangle is pulled to by its rounded
       corners: unchanged if it is on the ground, and radially on to the arc
       if it is in the corner the curve gave up. The terrain grid goes through
       this so a contoured pad's edge is the curve and not a staircase. */
    function ontoRound(pad, x, z, out) {
        var c = pad.round, west = x < pad.x + pad.w / 2, south = z < pad.z + pad.d / 2;
        var r = south ? (west ? c.sw : c.se) : (west ? c.nw : c.ne);
        out[0] = x; out[1] = z;
        if (!r) return out;
        var ox = west ? pad.x + r : pad.x + pad.w - r, oz = south ? pad.z + r : pad.z + pad.d - r;
        var dx = x - ox, dz = z - oz;
        if ((west ? dx > 0 : dx < 0) || (south ? dz > 0 : dz < 0)) return out;
        if (pad.cham && pad.cham[(south ? 's' : 'n') + (west ? 'w' : 'e')]) {
            // A chamfer: slid square on to the cut, the way the arc pulls radially.
            var ux = Math.abs(dx), uz = Math.abs(dz), over = (ux + uz - r) / 2;
            if (over <= 0) return out;
            out[0] = ox + Math.sign(dx) * (ux - over); out[1] = oz + Math.sign(dz) * (uz - over);
            return out;
        }
        var l = Math.hypot(dx, dz);
        if (l <= r) return out;
        out[0] = ox + dx / l * r; out[1] = oz + dz / l * r;
        return out;
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
        // A square strip laid in (a tour fairway) has no radius to be pulled
        // on to — padRadius of one is NaN — so its edge is left ragged by half
        // a cell, under the strip.
        if (!inlay.r) return;
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

    /* Where a pad's sides are at a given z: its own cell, unless one side is
       a mown line (courses.mow), in which case physics says where — the one
       function the ball asks as well, so the grass stops where the fairway
       does. */
    function edgesAt(pad, z) {
        return [pad.west ? P.mowEdge(pad.west, z) : pad.x,
                pad.east ? P.mowEdge(pad.east, z) : pad.x + pad.w];
    }

    /* The grid of a mown pad, row by row, stretched between its two edges.

       The columns are still the cell's own — what is moved is each row of
       vertices, squeezed or spread so its first and last land exactly on the
       edges at that z. That keeps the grid a grid (no triangle collapses to a
       line, so the normals are the ground's) and makes the edge exact at
       every row, which is also the row the pad on the other side samples, so
       the two meet vertex for vertex.

       The cup's square is the one thing that may not move: the grid has a
       hole cut for it at fixed columns and a patch stitched into that hole.
       So the squeeze is done either side of it and the columns through it are
       left where they are. A mown line never comes within a patch of a pin —
       there is a green over every cup on a mown hole — and if one did, the
       edge gives way rather than the hole, a few centimetres under a green
       where nothing is drawn on top of the ground but grass. */
    function mownFit(pad, xs, zs, cx, cz, cut) {
        if (!pad.west && !pad.east) return null;
        var nx = xs.length, x0 = xs[0], x1 = xs[nx - 1], lo = [], hi = [], j, e;
        var ca = cut ? cut.x - cut.h : 0, cb = cut ? cut.x + cut.h : 0;
        for (j = 0; j < zs.length; j++) {
            e = edgesAt(pad, cz + zs[j]);
            lo.push(cut ? Math.min(e[0] - cx, ca - 0.05) : e[0] - cx);
            hi.push(cut ? Math.max(e[1] - cx, cb + 0.05) : e[1] - cx);
        }
        return function (i, j) {
            var x = xs[i];
            if (!cut) return lo[j] + (x - x0) / (x1 - x0) * (hi[j] - lo[j]);
            if (x <= ca) return ca - x0 < 1e-6 ? lo[j] : lo[j] + (x - x0) / (ca - x0) * (ca - lo[j]);
            if (x >= cb) return x1 - cb < 1e-6 ? hi[j] : cb + (x - cb) / (x1 - cb) * (hi[j] - cb);
            return x;
        };
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
        var idx = [], i, j, k, x, fit = mownFit(pad, xs, zs, cx, cz, cut);

        var rp = [0, 0], zz;
        for (i = 0; i < nx; i++) {
            for (j = 0; j < nz; j++) {
                k = i * nz + j;
                x = fit ? fit(i, j) : xs[i];
                zz = zs[j];
                // A rounded corner bends the grid on to its curve.
                if (pad.round) {
                    ontoRound(pad, cx + x, cz + zz, rp);
                    x = rp[0] - cx; zz = rp[1] - cz;
                }
                pos[k * 3] = x;
                pos[k * 3 + 1] = P.padHeight(pad, cx + x, cz + zz) - cy;
                pos[k * 3 + 2] = zz;
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

    /* The top of a shaped road (courses.road with a `bank`, or any bumps),
       as a ribbon rather than a grid: rows square across the road at every
       step along it, so the edge is the outline physics walks and a banked
       turn is drawn along the curve it is banked round. Every vertex is
       padHeight, as everywhere else. A round end is a fan off the middle of
       the last row, and the stretch of road under an inlay is cut and the
       grass conformed to it as a grid's is (cutUnder). */
    function laneTerrainGeometry(pad, res, cx, cy, cz, cover, anyCut) {
        var L = pad.lane, step = Math.min(res, 0.3), cuts = [], i, j, k, g, n;
        for (i = 0; i < L.segs.length; i++) {
            g = L.segs[i];
            n = Math.max(1, Math.ceil(g.len / step));
            for (k = 0; k < n; k++) cuts.push(g.s0 + g.len * k / n);
        }
        cuts.push(L.length);
        var m = Math.max(4, 2 * Math.ceil(L.hw / 0.3)), pos = [], idx = [], at = [0, 0, 0, 0], u;
        function vert(px, pz) {
            pos.push(px - cx, P.padHeight(pad, px, pz) - cy, pz - cz);
            return pos.length / 3 - 1;
        }
        for (i = 0; i < cuts.length; i++) {
            P.lanePoint(L, cuts[i], at);
            for (j = 0; j <= m; j++) {
                u = L.hw * (2 * j / m - 1);
                vert(at[0] + at[2] * u, at[1] + at[3] * u);
            }
        }
        // Row i along the road, column j across it towards the + side
        // (lanePoint's normal), wound so every face looks up.
        for (i = 0; i < cuts.length - 1; i++) {
            for (j = 0; j < m; j++) {
                var a = i * (m + 1) + j, b = a + 1, c = a + m + 2, d = a + m + 1;
                idx.push(a, c, b, a, d, c);
            }
        }
        if (L.cap0 || L.cap1) {
            // Far end from the + side round to the - side, near end the other
            // way, each bulging away from the road (as laneOutline walks them).
            var q = Math.max(4, Math.ceil(Math.PI * L.hw / step));
            [[0, -1], [cuts.length - 1, 1]].forEach(function (e) {
                if (!(e[1] > 0 ? L.cap1 : L.cap0)) return;
                P.lanePoint(L, cuts[e[0]], at);
                var f = e[1], row = e[0] * (m + 1), mid = row + m / 2, prev = f > 0 ? row + m : row, t, cur;
                var nx = at[2] * f, nz = at[3] * f, dx = -at[3] * f, dz = at[2] * f;
                for (k = 1; k <= q; k++) {
                    t = Math.PI * k / q;
                    cur = k === q ? (f > 0 ? row : row + m)
                        : vert(at[0] + (nx * Math.cos(t) + dx * Math.sin(t)) * L.hw,
                               at[1] + (nz * Math.cos(t) + dz * Math.sin(t)) * L.hw);
                    idx.push(mid, cur, prev);
                    prev = cur;
                }
            });
        }
        var geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(pos), 3));
        geo.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(pos.length / 3 * 2), 2));
        geo.setIndex(idx);
        if (cover && cover.length) cutUnder(geo, cover, cx, cz, anyCut, pad, cy);
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
            hole.absarc(cup.x - cx, -(cup.z - cz), R.cupR, 0, Math.PI * 2, true);
            shape.holes.push(hole);
        }
        var geo = new THREE.ExtrudeGeometry(shape, {
            depth: thick, bevelEnabled: false, curveSegments: 44,
            // A weathered wall is cut into, so it needs rings to cut.
            steps: pad.weathered ? Math.min(12, Math.max(1, Math.ceil(thick / 1.1))) : 1
        });
        geo.rotateX(-Math.PI / 2);      // lay it flat: extrusion now runs +y
        geo.translate(0, -thick / 2, 0);// centred on its middle, like the box
        // (A disc that stands — a green on a pillar, laid over the end of a
        // road — has a real wall, and keeps the wall's own light.)
        if (pad.inlay && !pad.stands) levelRim(geo);
        return geo;
    }

    /* A canyon wall, weathered (courses.butte marks the pads that want it).

       An extruded disc's wall is a drum: one perfect vertical face all the
       way round, lit the same from top to bottom, and a butte drawn that way
       read as a stack of tins however its beds were coloured. A real wall is
       buttresses and the gullies between them, cut back further where the
       rock is softer. So the wall is drawn in rings and every ring is pulled
       *in* from the outline by a recess that is a function of where it is —
       round the wall and up it — with a narrow deep gully where two waves
       agree and a shallow one elsewhere. Only ever in, and never at the rim:
       the outline at the top is the one the ball plays off, and a face that
       bulged past it would be rock a ball flies through. The recess fades in
       over the first unit below the rim, so the cap and the wall still meet
       on the edge they share. Flat-shaded afterwards, which is what puts a lit
       side and a shadowed side on every buttress. */
    var WEATHER_DEEP = 0.45;     // the deepest a gully cuts back into a wall

    /* A granite crag's face (courses `facets`, the alpine crags): not a
       drum with grooves in it but a handful of big planes. A few knots are
       set round the crag, each cut in from the outline by its own depth (up
       to a third of the radius), and the face between two knots is the
       straight chord joining them — a true plane, which the flat shading
       lights as one. The depths change from one band of height to the next
       and the face is blended between bands, so the planes lean and the
       crag steps back where a bed is softer. Never outside the outline (a
       chord of a convex outline lies inside it, and the result is clamped
       to it anyway), and never at the rim. */
    /* `memo` is the wall's: a knot's angle and the outline's radius there,
       by knot, which every vertex of the face asked for again — four
       outline walks a vertex, and most of a crag hole's build on a phone.
       Same numbers, worked out once a knot. */
    function facetRadius(pad, a, wy, seed, rOut, memo) {
        var n = 6 + Math.floor(treeHash(seed, 3.1) * 3), step = Math.PI * 2 / n;
        var u = ((a % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2) / step, i = Math.floor(u);
        memo = memo || {};
        function knot(k) {
            var m = memo[k];
            if (!m) {
                var ka = (k + (treeHash(seed + k * 1.7, 9.1) - 0.5) * 0.5) * step;
                m = memo[k] = { a: ka, r: P.padRadius(pad, ka) };
            }
            return m;
        }
        function chord(band) {
            var k0 = knot(i), k1 = knot(i + 1);
            // the jitter can move a knot past `a`; step back or on one knot.
            if (a < k0.a - 1e-9 && u - i < 0.5) { k1 = k0; k0 = knot(i - 1); }
            else if (a > k1.a) { k0 = k1; k1 = knot(i + 2); }
            var a0 = k0.a, a1 = k1.a;
            var c0 = 0.03 + 0.3 * treeHash(seed + (((i % n) + n) % n) * 7.3, band * 3.7 + 1.3);
            var c1 = 0.03 + 0.3 * treeHash(seed + ((((i + 1) % n) + n) % n) * 7.3, band * 3.7 + 1.3);
            var r0 = k0.r * (1 - c0), r1 = k1.r * (1 - c1);
            var ax = Math.cos(a0) * r0, az = Math.sin(a0) * r0, bx = Math.cos(a1) * r1, bz = Math.sin(a1) * r1;
            var ex = bx - ax, ez = bz - az, dx = Math.cos(a), dz = Math.sin(a);
            var den = dx * ez - dz * ex;
            if (Math.abs(den) < 1e-9) return rOut;
            return Math.min(rOut, (ax * ez - az * ex) / den);
        }
        var b = wy / 2.2, j = Math.floor(b), v = b - j;
        v = v * v * (3 - 2 * v);
        return chord(j) * (1 - v) + chord(j + 1) * v;
    }

    function weatherWall(geo, pad, thick, cy) {
        var pos = geo.attributes.position, gs = geo.groups, k, i, end;
        var seed = pad.x * 0.37 + pad.z * 0.61, memo = {};
        for (k = 0; k < gs.length; k++) {
            if (gs[k].materialIndex !== 1) continue;
            for (i = gs[k].start, end = gs[k].start + gs[k].count; i < end; i++) {
                var x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
                var r = Math.sqrt(x * x + z * z), below = thick / 2 - y;
                if (r < 1e-6 || below < 1e-4) continue;
                var a = Math.atan2(z, x), wy = cy - thick / 2 + y, cut;
                if (pad.facets) {
                    cut = (r - facetRadius(pad, a, wy, seed, r, memo)) * Math.min(1, below / 0.7);
                } else {
                    var m1 = Math.max(3, Math.round(r * 1.6)), m2 = Math.max(5, Math.round(r * 3.1));
                    var f = 0.5 + 0.32 * Math.sin(a * m1 + seed + wy * 0.35) +
                        0.18 * Math.sin(a * m2 - seed * 1.7 + wy * 0.9 + Math.sin(a * m1 * 2 + seed) * 1.2);
                    var gully = f < 0.55 ? 0 : f > 0.95 ? 1 : (f - 0.55) / 0.4;
                    gully = gully * gully * (3 - 2 * gully);
                    cut = Math.min(WEATHER_DEEP, r * 0.06) * (0.25 * f + 0.75 * gully) * Math.min(1, below / 0.9);
                }
                var q = (r - cut) / r;
                pos.setX(i, x * q);
                pos.setZ(i, z * q);
            }
        }
        pos.needsUpdate = true;
        geo.computeVertexNormals();
    }

    /* A granite top for a crag nobody plays (courses `crown`): the cut
       face's outline at the rim, then two rings drawn in and up, jittered,
       to a point — so a crag reads as an outcrop rather than a drum with a
       lid on it. Scenery only: the ball plays the flat top it stands over,
       which nothing in the bag reaches. Drawn in the cut-earth material, so
       a theme's strata (and its snowline) run on up it. */
    function addCrown(group, pad, cy) {
        var cx = pad.x + pad.w / 2, cz = pad.z + pad.d / 2, n = 18, i, a, rr, h = Math.min(pad.rx, pad.rz) * 0.9;
        var rings = [[1, 0], [0.62, 0.45], [0.28, 0.82]], pts = [], k;
        for (k = 0; k < rings.length; k++) {
            var ring = [];
            for (i = 0; i < n; i++) {
                a = i / n * Math.PI * 2;
                var jr = k ? 0.75 + treeHash(cx + i, cz + k) * 0.5 : 0.99;
                rr = P.padRadius(pad, a) * rings[k][0] * jr;
                ring.push([Math.cos(a) * rr, rings[k][1] * h * (k ? 0.8 + treeHash(cz + i, cx - k) * 0.4 : 1), Math.sin(a) * rr]);
            }
            pts.push(ring);
        }
        var apex = [pad.rx * 0.08, h, -pad.rz * 0.06], pos = [];
        function t(p, q, w) { pos.push(p[0], p[1], p[2], q[0], q[1], q[2], w[0], w[1], w[2]); }
        for (k = 0; k < rings.length - 1; k++) {
            for (i = 0; i < n; i++) {
                var A = pts[k][i], B = pts[k][(i + 1) % n], C2 = pts[k + 1][i], D = pts[k + 1][(i + 1) % n];
                t(A, C2, B); t(B, C2, D);
            }
        }
        for (i = 0; i < n; i++) t(pts[rings.length - 1][i], apex, pts[rings.length - 1][(i + 1) % n]);
        var geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
        geo.computeVertexNormals();
        var mesh = new THREE.Mesh(geo, R.surf.side);
        mesh.position.set(cx, cy, cz);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        group.add(mesh);
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

    // Whether the ground all round a square of half-side h about (x, z) is at y.
    function levelSquare(pad, x, z, h, y) {
        var n = 8, i, t;
        for (i = 0; i <= n; i++) {
            t = -h + 2 * h * i / n;
            if (Math.abs(P.padHeight(pad, x + t, z - h) - y) > 0.004 ||
                Math.abs(P.padHeight(pad, x + t, z + h) - y) > 0.004 ||
                Math.abs(P.padHeight(pad, x - h, z + t) - y) > 0.004 ||
                Math.abs(P.padHeight(pad, x + h, z + t) - y) > 0.004) return false;
        }
        return true;
    }

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
    var TERRAIN_MIN = 0.45, TERRAIN_FINE = 0.2;

    function terrainRes(pad) {
        // A function surface has no smallest hump to read a scale off, and its
        // waves are a few units long: a fixed fine grid, at the floor.
        if (pad.field) return TERRAIN_MIN;
        /* Or the pad says. A bank three units across is drawn on a unit grid
           by the rule below, and a curve that is the whole point of the hole
           comes out in facets (The Backboard, `res: 0.45`). */
        /* A pad may go finer than the floor if it says so: the mound or dish
           a cup stands in (endless.js) is a ring a metre across, which the
           floor's grid draws as an octagon. */
        if (pad.res) return Math.max(TERRAIN_FINE, pad.res);
        var b = pad.bumps, i, least = Infinity;
        for (i = 0; i < (b || []).length; i++) least = Math.min(least, b[i].r);
        if (!isFinite(least)) return TERRAIN_RES;
        return Math.max(TERRAIN_MIN, Math.min(TERRAIN_RES, least / 3));
    }

    /* Bare rock where carved ground stands too steep to grow anything.

       A cut canyon (`ravine`) has red walls because its walls are skirts —
       the earth under a pad, drawn in the theme's `side` colour. A carved one
       (courses.gully) has no skirts in it: its walls are the ground itself,
       and drawn as ground they are turf on a sixty-degree slope, which reads
       as a grassy dip rather than as a canyon. So on a pad marked `rock` the
       terrain is split by how steep each triangle is: past ROCK_NY the
       triangle leaves the turf mesh for a mesh of its own in the skirt's
       colour, and leaves the grass shells too. A partition rather than an
       overlay, so there is nothing coplanar to fight. Scenery only — the
       ball still plays the pad's own surface on it. */
    var ROCK_NY = 0.72;          // a face's normal.y below this is rock (~44°)

    function splitSteep(geo) {
        var idx = geo.index.array, pos = geo.attributes.position, keep = [], steep = [];
        var a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3(), n = new THREE.Vector3();
        for (var t = 0; t < idx.length; t += 3) {
            a.fromBufferAttribute(pos, idx[t]);
            b.fromBufferAttribute(pos, idx[t + 1]);
            c.fromBufferAttribute(pos, idx[t + 2]);
            n.subVectors(c, b).cross(a.clone().sub(b)).normalize();
            (Math.abs(n.y) < ROCK_NY ? steep : keep).push(idx[t], idx[t + 1], idx[t + 2]);
        }
        if (!steep.length) return null;
        geo.setIndex(keep);
        var out = new THREE.BufferGeometry();
        out.setAttribute('position', pos);
        out.setAttribute('normal', geo.attributes.normal);
        out.setIndex(steep);
        return out;
    }

    /* The country past the stakes, drawn as country.

       Every long hole is a rectangle of ground: the rows a hole is written
       in, grown a dozen units of rough on every side so a ball that crosses
       the line lands on something. Drawn as rough to the edge, that is a
       green mat on the heather with a bank round it — the stakes in the
       middle of a lawn and the lawn stopping in a straight line. So the
       rough beyond the stakes is drawn in the surround's own ground, the
       same stuff the bank and the country beyond it are made of, with no
       grass on it: the slab's edge stops reading because there is nothing
       different on either side of it, and the change is where the stakes
       are. Not on the line itself — the rough runs on past the stakes in
       tongues and comes back in bays, by a noise of where you are, between
       half a unit and seven and a half out, so the edge of the hole is the
       shape of the country and not of the fence. Scenery only: the ground is
       rough either way, and out of bounds is the stakes' business. A
       partition of the triangles rather than an overlay, like splitSteep,
       and the grass is cut to the same line. Returns the country's share, or
       null when there is none. */
    // How far outside the stakes a point is (0 inside them).
    function fenceDist(fences, x, z) {
        var d = Infinity, i, f, dx, dz;
        for (i = 0; i < fences.length; i++) {
            f = fences[i];
            dx = Math.max(f.x - x, 0, x - (f.x + f.w));
            dz = Math.max(f.z - z, 0, z - (f.z + f.d));
            d = Math.min(d, Math.sqrt(dx * dx + dz * dz));
        }
        return d;
    }
    // …and how far out the rough runs before the country takes over there.
    function countryLine(x, z) {
        var j = (surNoise(x * 0.09, z * 0.09) - 0.5) * 7 + (surNoise(x * 0.27 + 7, z * 0.27 - 3) - 0.5) * 2.2;
        return Math.max(0.5, 3.5 + j);
    }
    function countryAt(fences, x, z) {
        var d = fenceDist(fences, x, z);
        if (d < 0.5) return false;
        return d > countryLine(x, z);
    }
    function splitCountry(geo, hole, cx, cz) {
        var fences = P.fenceRects(hole);
        var idx = geo.index.array, pos = geo.attributes.position, keep = [], out = [], t, x, z;
        for (t = 0; t < idx.length; t += 3) {
            x = cx + (pos.getX(idx[t]) + pos.getX(idx[t + 1]) + pos.getX(idx[t + 2])) / 3;
            z = cz + (pos.getZ(idx[t]) + pos.getZ(idx[t + 1]) + pos.getZ(idx[t + 2])) / 3;
            (countryAt(fences, x, z) ? out : keep).push(idx[t], idx[t + 1], idx[t + 2]);
        }
        if (!out.length) return null;
        geo.setIndex(keep);
        var g = new THREE.BufferGeometry();
        g.setAttribute('position', pos);
        if (geo.attributes.normal) g.setAttribute('normal', geo.attributes.normal);
        if (geo.attributes.uv) g.setAttribute('uv', geo.attributes.uv.clone());
        g.setIndex(out);
        return g;
    }

    /* ── the fringe: gorse, heather and the odd tree where the hole ends ──

       Two lines were left on every long hole once the country was drawn
       past the stakes (splitCountry): the rough's own edge, which is cut by
       whole triangles and so reads from above as a saw blade of bright grass
       on the heather, and the slab's outer edge, a long straight crease
       where the ground turns down into the bank. Real country has neither,
       because something grows along both: a hedge of whin at the edge of a
       links, heather and gorse on a heath, a shrubbery and a stand of trees
       round a park, dwarf pine and boulders on a mountain. So that is what
       goes there — clumps in thickets and gaps (a slow noise of where you
       are, so a hole has a dense side and a thin one), thickest on the two
       lines and scattered thin over the country between them.

       Scenery only, and always well past the stakes: a ball is out the
       moment it crosses them and is never simulated past, so nothing here
       is solid and nothing needs to be. Drawn instanced — one mesh per
       shape and colour, a handful of draw calls for every clump on the
       hole. Which plants, and how thick, is the theme's (`theme.fringe`);
       a theme without one gets none. */
    var FRINGE_STEP = 0.85;     // the sampling grid, in units
    var FRINGE_OUT = 1.3;       // never nearer the stakes than this
    var FRINGE_MAX = 900;       // clumps on one hole, at most
    // Made fresh each hole: disposeGroup takes the geometry with the hole.
    function fringeShapes() {
        var bush = new THREE.IcosahedronGeometry(1, 0);
        bush.scale(1, 0.62, 1); bush.translate(0, 0.42, 0);
        var heather = new THREE.DodecahedronGeometry(1, 0);
        heather.scale(1, 0.34, 1); heather.translate(0, 0.18, 0);
        var tussock = new THREE.ConeGeometry(0.7, 1, 5, 1, true);
        tussock.translate(0, 0.5, 0);
        var rock = new THREE.DodecahedronGeometry(1, 0);
        rock.scale(1, 0.55, 0.8); rock.translate(0, 0.2, 0);
        var bloom = new THREE.TetrahedronGeometry(1, 0);
        var trunk = new THREE.CylinderGeometry(0.1, 0.16, 1, 6);
        trunk.translate(0, 0.5, 0);
        var cone = new THREE.ConeGeometry(1, 2.2, 7);
        cone.translate(0, 1.1, 0);
        var crown = new THREE.IcosahedronGeometry(1, 0);
        crown.scale(1, 0.85, 1);
        return { bush: bush, heather: heather, tussock: tussock, rock: rock,
            bloom: bloom, trunk: trunk, cone: cone, crown: crown };
    }

    function addFringe(group, hole, theme) {
        var spec = theme.fringe;
        if (!spec || !hole.open || !hole.fence || hole.stakes === false || hole.portal) return;
        var fences = P.fenceRects(hole), pads = hole.pads;
        var minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity, q, p;
        for (q = 0; q < pads.length; q++) {
            p = pads[q];
            minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x + p.w);
            minZ = Math.min(minZ, p.z); maxZ = Math.max(maxZ, p.z + p.d);
        }
        if (!isFinite(minX)) return;

        var wet = R.weather ? (R.weather.wet || 0) : 0;
        var shapes = fringeShapes();
        var lots = {};
        function put(shape, colour, x, y, z, sx, sy, sz, yaw) {
            var key = shape + colour;
            var lot = lots[key] || (lots[key] = { shape: shape, colour: colour, m: [] });
            _fm.makeRotationY(yaw);
            _fm.scale(_fs.set(sx, sy, sz));
            _fm.setPosition(x, y, z);
            lot.m.push(_fm.clone());
        }
        // Ground under a point, if it is the rough of this hole and not wet.
        function groundAt(x, z) {
            var s = P.surfaceTop(hole, x, z);
            if (!s || s.pad.kind !== 'rough' || s.pad.oob || s.pad.inlay || s.pad.stands) return null;
            if (P.waterAt(hole, x, z)) return null;
            return s;
        }
        function edgeNear(x, z, r) {
            return !P.surfaceTop(hole, x + r, z) || !P.surfaceTop(hole, x - r, z) ||
                !P.surfaceTop(hole, x, z + r) || !P.surfaceTop(hole, x, z - r);
        }

        var shrubs = spec.shrubs, density = spec.density || 0.5, count = 0;
        var x, z, gx, gz, h1, h2, h3, h4, s, d, line, w, n, size, k, kind, y, slope;
        for (gx = minX; gx <= maxX && count < FRINGE_MAX; gx += FRINGE_STEP) {
            for (gz = minZ; gz <= maxZ && count < FRINGE_MAX; gz += FRINGE_STEP) {
                h1 = treeHash(gx * 1.31 + 3.7, gz * 0.77 - 1.9);
                h2 = treeHash(gz * 1.13 - 5.1, gx * 0.91 + 2.3);
                x = gx + (h1 - 0.5) * FRINGE_STEP;
                z = gz + (h2 - 0.5) * FRINGE_STEP;
                d = fenceDist(fences, x, z);
                if (d < FRINGE_OUT) continue;
                s = groundAt(x, z);
                if (!s) continue;
                line = countryLine(x, z);
                // How much this spot wants a plant: the rough's edge, the
                // ground's edge, or the open country between.
                /* The ground's edge is a straight line, so the band along it
                   stands in from it by a distance that wanders (`off`) — a
                   band hard against the edge would draw the very rectangle it
                   is there to hide. */
                n = surNoise(x * 0.06 + 31, z * 0.06 - 17);
                var off = 3.6 * surNoise(x * 0.09 + 5, z * 0.09 + 9);
                w = Math.abs(d - line) < 0.75 ? 1
                    : edgeNear(x, z, off + 1.4) && !edgeNear(x, z, off) ? 0.7
                    : d > line ? 0.1 : 0.03;
                w *= Math.min(1, Math.max(0.12, (n - 0.28) * 2.4)) * density;
                h3 = treeHash(x * 2.71 - 9.3, z * 3.17 + 4.4);
                h4 = treeHash(z * 0.53 + 8.1, x * 1.77 - 6.6);
                /* A tree, now and then, where the country is well out from
                   the stakes and the thicket is thick: a stand, wherever it
                   falls, rather than a row along either line. */
                var tree = spec.trees && d > Math.max(3, line + 1.2) && n > 0.55 &&
                    h4 < spec.trees * (n - 0.45) * 0.9;
                if (!tree && h3 >= w) continue;
                // Not on a bank too steep to grow on.
                slope = Math.abs(P.padHeight(s.pad, x + 0.3, z) - s.y) +
                        Math.abs(P.padHeight(s.pad, x, z + 0.3) - s.y);
                if (slope > 0.35) continue;
                y = s.y - 0.06;
                count++;

                if (tree) {
                    var th = 2.2 + h1 * 1.6, cr = 0.75 + h2 * 0.45;
                    var conifer = treeHash(x + 0.5, z - 0.5) < (spec.conifer === undefined ? 0.5 : spec.conifer);
                    put('trunk', 0x6b503a, x, y - 0.2, z, 1.4, th * (conifer ? 0.55 : 0.75), 1.4, h1 * 6.28);
                    put(conifer ? 'cone' : 'crown', spec.leaf[h3 < w / 2 ? 0 : 1],
                        x, y + (conifer ? th * 0.3 : th * 0.78), z,
                        cr, cr * (conifer ? 1 + h4 : 0.9), cr, h2 * 6.28);
                    continue;
                }

                kind = shrubs[Math.floor(h4 * shrubs.length) % shrubs.length];
                size = (kind.size || 0.55) * (0.6 + h1 * 0.8);
                put(kind.shape, kind.colour, x, y, z,
                    size * (0.85 + h2 * 0.3), size * (0.8 + h3 * 0.5), size, h4 * 6.28);
                /* Gorse in flower: a few chips of yellow over the clump. */
                if (kind.bloom) {
                    for (k = 0; k < 4; k++) {
                        var a = (h1 * 7 + k * 1.7) % 6.283, rr = size * (0.35 + 0.15 * k % 0.5);
                        put('bloom', kind.bloom,
                            x + Math.cos(a) * rr, y + size * (0.55 + 0.2 * ((k * h2) % 1)), z + Math.sin(a) * rr,
                            0.07, 0.07, 0.07, a);
                    }
                }
            }
        }

        var key, lot, mesh, i, mat;
        for (key in lots) {
            lot = lots[key];
            mat = new THREE.MeshLambertMaterial({
                color: new THREE.Color(lot.colour).multiplyScalar(1 - wet * 0.22)
            });
            mesh = new THREE.InstancedMesh(shapes[lot.shape], mat, lot.m.length);
            for (i = 0; i < lot.m.length; i++) mesh.setMatrixAt(i, lot.m[i]);
            mesh.instanceMatrix.needsUpdate = true;
            mesh.castShadow = lot.shape !== 'bloom';
            mesh.receiveShadow = true;
            mesh.name = 'fringe-' + lot.shape;
            group.add(mesh);
        }
        R.fringe = count;
    }
    var _fm = new THREE.Matrix4(), _fs = new THREE.Vector3();

    /* ── the woods: a forest the hole is cut out of ─────────────────────

       The fringe dresses the edge of the hole; this is what stands behind
       it. On a course that is a park in a forest (Ashdown) or a pass below
       the treeline (Alpenglow), a hole on a plain with a few trees round it
       reads as a lawn in a field. A fairway cut through woodland — the view
       from the tee that every heathland and pine course is remembered by —
       wants the trees to go on: over the country past the stakes, down the
       bank and out across the plain until the fog takes them, in stands and
       glades by a slow noise of where you are.

       Scenery only, like the fringe, and further out than it: never nearer
       the stakes than the rough's own edge plus WOODS_IN (the fringe's
       thickets are what stand in that band), and never in a clearing round
       the tee, where the camera stands behind the first shot. Instanced,
       with a colour per instance, so a whole forest is three draw calls
       (trunks, cones, crowns) and a shadow pass each. Which trees and how
       thick is the theme's (`theme.woods`). */
    var WOODS_STEP = 1.9;       // the sampling grid, in units
    var WOODS_IN = 1.6;         // past the rough's edge before a wood starts
    var WOODS_TEE = 15;         // a clearing this wide round the tee
    var WOODS_MAX = 2400;       // trees on one hole, at most

    // The height of the bank on a point, read off the skirt's own plan:
    // null on the slab (the pads answer there) and past the bank.
    function skirtAt(plan, theme, x, z) {
        if (!plan) return null;
        var dx = x - plan.cx, dz = z - plan.cz, r = Math.sqrt(dx * dx + dz * dz);
        var f = (Math.atan2(dz, dx) / (Math.PI * 2) + 1) % 1 * SKIRT_SECT;
        var j0 = Math.floor(f) % SKIRT_SECT, j1 = (j0 + 1) % SKIRT_SECT, u = f - Math.floor(f);
        var a = plan.edge[j0], b = plan.edge[j1];
        if (!a || !b) return null;
        var er = a.r + (b.r - a.r) * u, ey = a.y + (b.y - a.y) * u;
        if (r < er + SKIRT_SHOULDER) return null;
        if (r > er + plan.width) return null;
        var t = (r - er - SKIRT_SHOULDER) / (plan.width - SKIRT_SHOULDER);
        return theme.surroundY + SKIRT_LIP + (1 - t * t * (3 - 2 * t)) * (ey - SKIRT_SINK - theme.surroundY);
    }

    /* A wood the camera can stand in. The side seat stands out from the
       hole, square to the shot, and on a course cut out of a forest that is
       among the trees: so a tree within WOODS_NEAR of the eye is not drawn
       there (a discard on the distance from the camera, which the vertex
       shader has for nothing). Its shadow stays, which is right — it is
       still standing. */
    var WOODS_NEAR = 4.5;
    function woodsMaterial() {
        var m = new THREE.MeshLambertMaterial({ color: 0xffffff });
        m.onBeforeCompile = function (sh) {
            sh.vertexShader = sh.vertexShader
                .replace('#include <common>', '#include <common>\nvarying float vEyeD;')
                .replace('#include <project_vertex>', '#include <project_vertex>\nvEyeD = length(mvPosition.xyz);');
            sh.fragmentShader = sh.fragmentShader
                .replace('#include <common>', '#include <common>\nvarying float vEyeD;')
                .replace('void main() {', 'void main() {\n\tif (vEyeD < ' + WOODS_NEAR.toFixed(1) + ') discard;');
        };
        m.customProgramCacheKey = function () { return 'woods-near'; };
        return m;
    }

    function addWoods(group, hole, theme, plan) {
        var spec = theme.woods;
        if (!spec || !hole.open || !hole.fence || hole.stakes === false || hole.portal) return;
        var fences = P.fenceRects(hole), b = hole.bounds, reach = spec.reach || 30;
        var tee = hole.tee || { x: (b.minX + b.maxX) / 2, z: b.minZ };
        var density = spec.density || 0.6, conifer = spec.conifer === undefined ? 0.5 : spec.conifer;
        var lo = spec.h ? spec.h[0] : 3, hi = spec.h ? spec.h[1] : 5.5;
        var leaves = spec.leaf, wet = R.weather ? (R.weather.wet || 0) : 0;
        var lots = { trunk: [], cone: [], crown: [] }, count = 0, trees = [], tr;
        // Each tree's parts are kept together until the end, so a hole with
        // more than WOODS_MAX of them can be thinned evenly over the whole
        // wood rather than cut off along one side of the grid.
        function put(shape, colour, x, y, z, sx, sy, sz, yaw) {
            _fm.makeRotationY(yaw);
            _fm.scale(_fs.set(sx, sy, sz));
            _fm.setPosition(x, y, z);
            tr.push({ s: shape, m: _fm.clone(), c: colour });
        }
        var gx, gz, x, z, h1, h2, h3, h4, d, s, y, n, want, th, cr, con, leaf, slope, far;
        for (gx = b.minX - reach; gx <= b.maxX + reach; gx += WOODS_STEP) {
            for (gz = b.minZ - reach; gz <= b.maxZ + reach; gz += WOODS_STEP) {
                h1 = treeHash(gx * 0.71 + 13.1, gz * 1.37 - 4.2);
                h2 = treeHash(gz * 0.67 - 2.9, gx * 1.19 + 8.8);
                x = gx + (h1 - 0.5) * WOODS_STEP * 0.9;
                z = gz + (h2 - 0.5) * WOODS_STEP * 0.9;
                d = fenceDist(fences, x, z);
                if (d < countryLine(x, z) + WOODS_IN) continue;
                if (Math.hypot(x - tee.x, z - tee.z) < WOODS_TEE) continue;
                if (P.waterAt(hole, x, z)) continue;
                /* Stands and glades: a slow noise decides how thick the wood
                   is here, and a faster one breaks the edge of each stand so
                   no glade is a circle. */
                n = surNoise(x * 0.045 - 21, z * 0.045 + 37) * 0.75 + surNoise(x * 0.16 + 3, z * 0.16 - 11) * 0.25;
                want = density * Math.min(1, Math.max(0, (n - 0.3) * 3.2));
                h3 = treeHash(x * 3.11 + 1.7, z * 2.29 - 7.3);
                if (h3 >= want) continue;
                // On the ground wherever it is: the rough past the stakes,
                // the bank, or the plain.
                s = P.surfaceTop(hole, x, z);
                if (s) {
                    if (s.pad.kind !== 'rough' || s.pad.inlay || s.pad.oob || s.pad.stands) continue;
                    slope = Math.abs(P.padHeight(s.pad, x + 0.3, z) - s.y) +
                            Math.abs(P.padHeight(s.pad, x, z + 0.3) - s.y);
                    if (slope > 0.4) continue;
                    y = s.y;
                } else {
                    y = skirtAt(plan, theme, x, z);
                    if (y === null) y = R.groundAt ? R.groundAt(x, z) : theme.surroundY;
                    /* …or up the mountainside, where there is a range: the
                       forest climbs its lower slopes to the treeline and
                       leaves the faces too steep to hold a tree. */
                    var up = R.rangeAt ? R.rangeAt(x, z) : null;
                    if (up && up.y > y) {
                        if (up.y > up.tree + (h1 - 0.5) * 3) continue;
                        var u2 = R.rangeAt(x + 1, z), u3 = R.rangeAt(x, z + 1);
                        if (u2 && u3 && Math.abs(u2.y - up.y) + Math.abs(u3.y - up.y) > 1.3) continue;
                        y = up.y - 0.3;
                    }
                }
                y -= 0.1;
                h4 = treeHash(z * 1.91 - 3.3, x * 0.43 + 5.5);
                far = d > 14;
                th = lo + (hi - lo) * h4;
                cr = th * (0.24 + h1 * 0.1);
                con = treeHash(x - 0.7, z + 0.9) < conifer;
                leaf = leaves[Math.floor(h2 * leaves.length) % leaves.length];
                trees.push(tr = []);
                if (con) {
                    // A spruce or a pine: a tall cone on a short bole. Far out
                    // the bole is lost in the wood and is not drawn.
                    if (!far) put('trunk', 0x5b4330, x, y, z, 1.6, th * 0.3, 1.6, h1 * 6.28);
                    put('cone', leaf, x, y + th * 0.18, z, cr, th * 0.38, cr, h2 * 6.28);
                } else {
                    if (!far) put('trunk', 0x6b503a, x, y, z, 1.9, th * 0.62, 1.9, h1 * 6.28);
                    put('crown', leaf, x, y + th * 0.68, z, cr * 1.35, cr * 1.1, cr * 1.35, h2 * 6.28);
                }
            }
        }
        var every = Math.max(1, trees.length / WOODS_MAX), q;
        for (q = 0; q < trees.length; q += every) {
            trees[Math.floor(q)].forEach(function (part) { lots[part.s].push(part); });
            count++;
        }
        if (!count) return;
        var shapes = { trunk: new THREE.CylinderGeometry(0.1, 0.16, 1, 5),
            cone: new THREE.ConeGeometry(1, 2.6, 7), crown: new THREE.IcosahedronGeometry(1, 0) };
        shapes.trunk.translate(0, 0.5, 0);
        shapes.cone.translate(0, 1.3, 0);
        var key, lot, mesh, i, col = new THREE.Color();
        for (key in lots) {
            lot = lots[key];
            if (!lot.length) continue;
            mesh = new THREE.InstancedMesh(shapes[key], woodsMaterial(), lot.length);
            for (i = 0; i < lot.length; i++) {
                mesh.setMatrixAt(i, lot[i].m);
                // Each tree a shade of its own, so a stand is not one colour.
                col.setHex(lot[i].c).multiplyScalar((0.86 + treeHash(i * 0.37, i * 1.13) * 0.24) * (1 - wet * 0.22));
                mesh.setColorAt(i, col);
            }
            mesh.instanceMatrix.needsUpdate = true;
            mesh.instanceColor.needsUpdate = true;
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            mesh.name = 'woods-' + key;
            group.add(mesh);
        }
        R.woods = count;
    }

    function addTerrain(group, pad, theme, cup, pads) {
        var cx = pad.x + pad.w / 2, cz = pad.z + pad.d / 2;
        var cy = P.padHeight(pad, cx, cz);
        // Whatever is laid into this pad, so the ground under it can be
        // taken away rather than left growing grass through a bunker.
        var cover = [], q;
        for (q = 0; q < (pads || []).length; q++) {
            if (pads[q].inlay && pads[q] !== pad) cover.push(pads[q]);
        }
        /* And the holes in it (pad.voids): each is cut the way an inlay is,
           and its rim conformed onto the circle, so a hole in the glass is a
           clean round mouth with the grid floor showing far below. */
        var holes = (pad.voids || []).map(function (v) {
            return { x: v.x - v.r, z: v.z - v.r, w: 2 * v.r, d: 2 * v.r, r: v.r, inlay: true };
        });
        /* An inlay is laid *into* the ground rather than standing on it, so
           its earth wall is a hand's breadth of cut sand and not a column down
           to the surround — and it is lifted the same hair a flat inlay is, or
           its rim z-fights with the ground it is exactly flush with. */
        // …and a hovering one (a portal world's island) is a slab, as in addPad.
        var base = pad.inlay ? -0.4 : pad.hover ? -0.9 : (theme.surroundY - 0.5) - cy;
        var lift = pad.inlay ? INLAY_LIFT : 0;
        var mat = R.surf.pads[pad.kind]
            ? R.surf.pads[pad.kind].slab[0] : R.surf.pads.green.slab[0];

        /* Is the cup cut into this pad? Same question addPad asks, and the
           same answer: it has to be inside the footprint and the pad has to be
           the surface the cup's own mouth is at. */
        /* …and never a road: the cup's patch is a square cut out of the
           rectangular grid, and a road's ground is a ribbon. A cup goes on a
           level road (a slab, punched like any other) or on a green laid at
           the end of it. */
        var holed = cup && P.padContains(pad, cup.x, cup.z) &&
            Math.abs(P.padHeight(pad, cup.x, cup.z) - cup.y) < 0.06 && !pad.r && !pad.lane;
        var cut = null;
        if (holed) {
            // Clamped to what the pad can actually spare, though courses.js
            // asserts there is always more than enough.
            var room = Math.min(cup.x - pad.x, pad.x + pad.w - cup.x,
                                cup.z - pad.z, pad.z + pad.d - cup.z) - 0.05;
            cut = { x: cup.x - cx, z: cup.z - cz, h: Math.min(CUP_PATCH, room) };
            /* …and to the ground that is level with the cup. The patch is
               flat, so where the ground round the cup is not — a cup on a
               mound or in a dish whose level part is narrower than the
               patch (endless.js) — its edge would stand proud of the slope
               or sink below it as a square step. Shrink it until all of its
               edge is on the level, and the grid carries the slope. */
            var cyc = P.padHeight(pad, cup.x, cup.z);
            while (cut.h > R.cupR + 0.1 && !levelSquare(pad, cup.x, cup.z, cut.h, cyc)) cut.h -= 0.05;
            if (cut.h < R.cupR + 0.1) { cut = null; holed = false; }
        }

        var res = terrainRes(pad);
        var geo = pad.r
            ? discTerrainGeometry(pad, res, cx, cy, cz)
            : pad.lane
                ? laneTerrainGeometry(pad, res, cx, cy, cz, cover, false)
                : terrainGeometry(pad, res, cx, cy, cz, cut, cover.concat(holes), holes.length > 0);
        /* Ground that is out of play wherever it is (courses `oob`, the floor
           of Redstone's canyon) is the country rather than the course: the
           surround's own rock, tiled the way the surround is, with nothing
           growing on it — so the floor between the buttes carries straight
           on into the plain past the stakes instead of reading as a lawn. */
        worldUv(geo, pad.oob ? SUR_TILE : (TX.SCALE[pad.kind] || TX.SCALE.green), cx, cz);
        if (pad.oob) mat = groundMaterial(theme);
        if (holes.length) addVoidRims(group, pad);
        if (pad.hue) { tintRainbow(geo, pad, cx, cy, cz, RAINBOW_GLASS); mat = rainbowGlass(); }
        var rockGeo = pad.rock && !pad.r ? splitSteep(geo) : null;
        var wild = R.country && pad.kind === 'rough' && !pad.oob && !pad.inlay && !pad.r && !pad.lane
            ? splitCountry(geo, R.country, cx, cz) : null;
        if (wild) {
            worldUv(wild, SUR_TILE, cx, cz);
            var land = new THREE.Mesh(wild, groundMaterial(theme));
            land.position.set(cx, cy + lift, cz);
            land.receiveShadow = true;
            group.add(land);
        }
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(cx, cy + lift, cz);
        mesh.receiveShadow = true;
        mesh.castShadow = true;
        group.add(mesh);
        if (rockGeo) {
            var rock = new THREE.Mesh(rockGeo, R.surf.side);
            rock.position.copy(mesh.position);
            rock.receiveShadow = true;
            rock.castShadow = true;
            group.add(rock);
        }

        /* …except a strip mown into ground that rolls (a tour hole's fairway
           on a baked field): it has no edge of its own to wall, and a skirt
           hung off its middle height stood up as a box wherever the ground
           beside it was lower. */
        if (!(pad.inlay && pad.field)) {
            var skirt = new THREE.Mesh(skirtGeometry(pad, base, cx, cy, cz),
                R.surf.side);
            skirt.position.set(cx, cy + lift, cz);
            skirt.receiveShadow = true;
            group.add(skirt);
        }

        /* The grass gets the ground's own surface to stand on, and where
           anything is laid into the pad it gets its *own* copy cut harder —
           see cutUnder. Its UVs are rewritten at the blades' own scale inside
           addShells, so building it already tiled for the ground costs
           nothing. */
        /* A disc's grass is the disc's own ground: the square grid with
           things cut out of it is for a rectangle. (It used to be handed the
           grid with the disc itself as the thing to cut — which is how a
           domed fairway on Coral Keys came out as a square mat.) */
        var grassOn = geo;
        if (cover.length && pad.lane) {
            grassOn = laneTerrainGeometry(pad, res, cx, cy, cz, cover, true);
        } else if (cover.length && !pad.r) {
            grassOn = terrainGeometry(pad, res, cx, cy, cz, cut, cover, true);
            if (rockGeo) splitSteep(grassOn);
            if (wild) splitCountry(grassOn, R.country, cx, cz);
        }
        if (!pad.oob) addShells(group, pad, cup, false, cx, cy, cz, grassOn);

        // …and the cup's patch, which is a second flat surface stitched into
        // the hole left in the grid, with its own mat of grass over it.
        if (cut) {
            var py = P.padHeight(pad, cup.x, cup.z) - cy;
            var patch = cupPatch(cut, py, R.cupR);
            worldUv(patch, TX.SCALE[pad.kind] || TX.SCALE.green, cx, cz);
            // A rainbow pad's patch is coloured with it, or it is a black tile.
            if (pad.hue) tintRainbow(patch, pad, cx, cy, cz, RAINBOW_GLASS);
            var pm = new THREE.Mesh(patch, mat);
            pm.position.set(cx, cy + lift, cz);
            pm.receiveShadow = true;
            group.add(pm);
            addShells(group, pad, cup, false, cx, cy, cz,
                cupPatch(cut, py, R.cupR * 1.08));
        }
    }

    /* The grid off the course, for a theme that asks for one (Challenge
       mode's `neon`): a square of lines on the floor round the hole, out to
       the fog, unlit, so the bloom in postfx is what makes them glow. On the
       course the grid is in the glass itself (gridGlass). */
    var _hsl = new THREE.Color();
    // How bright the glass is in its own colour: dark, so the lines stay the
    // brightest thing on it — 0.13 read as painted plastic.
    var RAINBOW_GLASS = 0.055;
    function addGrid(group, hole, theme) {
        var G = theme.grid, b = hole.bounds, cx = (b.minX + b.maxX) / 2, cz = (b.minZ + b.maxZ) / 2;
        var R0 = 140, s = G.floorEvery || 3, fl = [], y = theme.surroundY + 0.02, v;
        for (v = -R0; v <= R0; v += s) {
            fl.push(cx + v, y, cz - R0, cx + v, y, cz + R0);
            fl.push(cx - R0, y, cz + v, cx + R0, y, cz + v);
        }
        var fgeo = new THREE.BufferGeometry();
        fgeo.setAttribute('position', new THREE.Float32BufferAttribute(fl, 3));
        group.add(new THREE.LineSegments(fgeo, new THREE.LineBasicMaterial({ color: G.floor || G.colour, fog: true })));
    }

    /* The grid, drawn by the glass itself. It used to be LineSegments laid
       over the ground, sampled off the true height field and lifted clear of
       it — and the ground is drawn as flat triangles a half unit across, so on
       every curve the lines and the floor parted company and the grid hovered
       (the owner's screenshot). Computing the lines in the fragment shader
       from the world position puts them exactly on the surface at any
       curvature: one line a unit, a pixel or so wide whatever the distance
       (fwidth), in the theme's colour or — on a rainbow pad — in the pad's
       own colour, brightened. */
    /* Ripples in the glass (the owner: "I'd rather have ripples as the ball
       rolls on the surface"). They used to be flat rings of light laid over
       the floor with the depth test off, which on a wave is a flat disc
       hanging over the hills — a second floor that ignored the grid. Now the
       glass draws them itself, off the same world position as the grid:
       each source is a ring running outwards that pushes the lines aside as
       it passes and lights them a little, so a ripple is exactly on the
       surface at any curvature. The sources are a small ring buffer that
       frame() ages and the ball feeds (stepRipples); the uniforms are one
       shared object, so both glass materials see the same ripples. */
    var RIPPLES = 8, RIPPLE_LIFE = 2.4;
    var RIPPLE_U = {
        pos: { value: [] },     // x, y, z, strength (0 = idle)
        age: { value: [] }      // seconds since it was dropped
    };
    (function () {
        for (var i = 0; i < RIPPLES; i++) {
            RIPPLE_U.pos.value.push(new THREE.Vector4(0, 0, 0, 0));
            RIPPLE_U.age.value.push(0);
        }
    })();
    var RIPPLE_GLSL = [
        'vec2 gwarp = vec2(0.0);',
        'float glit = 0.0, wglow = 0.0;',
        'for (int i = 0; i < ' + RIPPLES + '; i++) {',
        '  vec4 rp = ripPos[i];',
        '  if (rp.w <= 0.0) continue;',
        '  vec2 rd = vGridPos.xz - rp.xz;',
        '  float rr = length(rd) + 1e-4;',
        '  float ra = ripAge[i];',
        // The front runs out at 1.6 units a second; behind it a short train
        // of crests, fading with age, with distance, and on another level.
        '  float rx = rr - ra * 1.6;',
        '  float env = exp(-rx * rx * 3.0) * (1.0 - smoothstep(0.0, ' + RIPPLE_LIFE.toFixed(1) + ', ra));',
        '  env *= rp.w / (1.0 + rr * 0.6) * (1.0 - smoothstep(0.6, 1.4, abs(vGridPos.y - rp.y)));',
        '  float rw = sin(rx * 9.0) * env;',
        '  gwarp += rd / rr * rw * 0.09;',
        '  glit += max(rw, 0.0) * 0.35;',
        '}'
    ].join('\n');

    function stepRipples(dt) {
        var p = RIPPLE_U.pos.value, a = RIPPLE_U.age.value;
        for (var i = 0; i < RIPPLES; i++) {
            if (p[i].w <= 0) continue;
            a[i] += dt;
            if (a[i] > RIPPLE_LIFE) p[i].w = 0;
        }
    }
    var _ripAt = 0;
    function ripple(x, y, z, strength) {
        _ripAt = (_ripAt + 1) % RIPPLES;
        RIPPLE_U.pos.value[_ripAt].set(x, y, z, Math.min(1, strength));
        RIPPLE_U.age.value[_ripAt] = 0;
    }
    function clearRipples() {
        for (var i = 0; i < RIPPLES; i++) RIPPLE_U.pos.value[i].w = 0;
        clearWake();
    }

    /* The wake (the owner: "more like the wake from a boat when you roll").
       A rolling ball drops a breadcrumb every quarter unit; the glass finds
       the nearest stretch of that trail and draws the two arms of a V off
       it, opening at the Kelvin angle (about 19.5 degrees, so each arm sits
       0.354 of the distance behind the ball out to the side) and broken into
       little feathered crests, with a few transverse ripples between them.
       Like the rings, it pushes the grid lines rather than painting over
       them, so it lies on the surface. Each crumb is x, y, z and how far
       behind the ball it is now; wakeInfo is its age and its strength, so a
       ball that stops leaves a V that settles rather than vanishing, and a
       ball that leaves the ground breaks the trail (strength 0). Crumb 0 is
       the ball itself. */
    var WAKE = 20, WAKE_STEP = 0.25, WAKE_LIFE = 2.6;
    var WAKE_U = { pos: { value: [] }, info: { value: [] }, on: { value: 0 } };
    var _wake = [];      // the crumbs: x, y, z, at (distance rolled), born, strength
    (function () {
        for (var i = 0; i < WAKE; i++) {
            WAKE_U.pos.value.push(new THREE.Vector4(0, 0, 0, 0));
            WAKE_U.info.value.push(new THREE.Vector2(0, 0));
            _wake.push({ x: 0, y: 0, z: 0, at: 0, born: 0, k: 0 });
        }
    })();
    var WAKE_GLSL = [
        'if (wakeOn > 0.5) {',
        '  float wd = 1e9, ws = 0.0, wa = 0.0, wk = 0.0; vec2 wn = vec2(0.0), wt = vec2(0.0);',
        '  for (int i = 0; i < ' + (WAKE - 1) + '; i++) {',
        '    vec2 k0 = wakeInfo[i], k1 = wakeInfo[i + 1];',
        '    if (k0.y <= 0.0 || k1.y <= 0.0) continue;',
        '    vec4 p0 = wakePos[i], p1 = wakePos[i + 1];',
        '    if (abs(vGridPos.y - p0.y) > 1.2) continue;',
        '    vec2 sg = p1.xz - p0.xz, rel = vGridPos.xz - p0.xz;',
        '    float t = clamp(dot(rel, sg) / max(dot(sg, sg), 1e-5), 0.0, 1.0);',
        '    vec2 off = rel - sg * t;',
        '    float d = length(off);',
        '    if (d < wd) { wd = d; wn = off / max(d, 1e-4); wt = sg / max(length(sg), 1e-4); ws = mix(p0.w, p1.w, t);',
        '      wa = mix(k0.x, k1.x, t); wk = mix(k0.y, k1.y, t); }',
        '  }',
        '  if (wd < 1e8) {',
        '    float arm = 0.12 + ws * 0.354;',
        '    float wide = 0.09 + ws * 0.05;',
        '    float ax = (wd - arm) / wide;',
        '    float fade = wk * (1.0 - smoothstep(0.0, ' + WAKE_LIFE.toFixed(1) + ', wa))',
        '      * smoothstep(0.0, 0.35, ws) * (1.0 - smoothstep(' + ((WAKE - 3) * WAKE_STEP * 0.6).toFixed(2) + ', ' + ((WAKE - 2) * WAKE_STEP).toFixed(2) + ', ws));',
        // The arms: crests a few across, feathered along their length.
        '    float armW = exp(-ax * ax * 0.5) * sin(ax * 2.4) * (0.65 + 0.35 * sin(ws * 11.0 - wd * 6.0));',
        // Between them, faint transverse crests square to the track.
        '    float inside = (1.0 - smoothstep(arm * 0.7, arm, wd)) * sin(ws * 9.0) * 0.35;',
        // The arms push the lines outwards, the transverse crests along the
        // track: pushing those sideways too zig-zags the line down the middle.
        '    float wv = (armW + inside) * fade;',
        '    gwarp += (wn * armW + wt * inside) * fade * 0.14;',
        '    glit += max(wv, 0.0) * 0.6;',
        // And the crests shine a little on their own, so the V reads between
        // the lines as well as in them.
        '    wglow += max(wv, 0.0) * 0.22 + max(-wv, 0.0) * 0.04;',
        '  }',
        '}'
    ].join('\n');

    function clearWake() {
        for (var i = 0; i < WAKE; i++) { _wake[i].k = 0; WAKE_U.info.value[i].y = 0; }
        WAKE_U.on.value = 0;
        R.wakeRolled = 0;
        R.wakeLast = null;
    }
    /* Called every frame: lays a crumb when the ball has rolled far enough on
       glass, breaks the trail when it is in the air, keeps crumb 0 on the
       ball, and writes the distances and ages the shader reads. */
    function stepWake(world, speed) {
        var b = world.ball, i, c, live = false, head = _wake[0];
        if (world.moving) {
            var last = R.wakeLast;
            if (last) R.wakeRolled += Math.sqrt((b.x - last.x) * (b.x - last.x) + (b.z - last.z) * (b.z - last.z));
            R.wakeLast = { x: b.x, z: b.z };
        }
        function lay(k) {           // a new crumb at 1, the oldest recycled
            c = _wake.pop();
            _wake.splice(1, 0, c);
            c.x = b.x; c.y = b.y - G3.ballR(R.hole); c.z = b.z;
            c.at = R.wakeRolled; c.born = R.clock; c.k = k;
        }
        if (world.moving && world.grounded && speed > 0.2) {
            var k = Math.min(1, 0.3 + speed * 0.12);
            if (_wake[1].k <= 0 || R.wakeRolled - _wake[1].at >= WAKE_STEP) lay(k);
            head.x = b.x; head.y = b.y - G3.ballR(R.hole); head.z = b.z;
            head.at = R.wakeRolled; head.born = R.clock; head.k = k;
        } else if (world.moving && !world.grounded) {
            // In the air: what was drawn stays and settles, and a break goes
            // in so the next stretch on the ground starts a trail of its own.
            head.k = 0;
            if (_wake[1].k > 0) lay(0);
        }
        for (i = 0; i < WAKE; i++) {
            c = _wake[i];
            var age = R.clock - c.born, on = c.k > 0 && age < WAKE_LIFE;
            WAKE_U.pos.value[i].set(c.x, c.y, c.z, R.wakeRolled - c.at);
            WAKE_U.info.value[i].set(age, on ? c.k : 0);
            if (on) live = true;
        }
        WAKE_U.on.value = live ? 1 : 0;
    }

    function gridGlass(mat, theme) {
        if (!theme.grid) return mat;
        var col = new THREE.Color(theme.grid.colour), every = theme.grid.every || 1;
        mat.extensions = { derivatives: true };
        mat.onBeforeCompile = function (sh) {
            sh.uniforms.gridCol = { value: col };
            sh.uniforms.gridEvery = { value: every };
            sh.uniforms.ripPos = RIPPLE_U.pos;
            sh.uniforms.ripAge = RIPPLE_U.age;
            sh.uniforms.wakePos = WAKE_U.pos;
            sh.uniforms.wakeInfo = WAKE_U.info;
            sh.uniforms.wakeOn = WAKE_U.on;
            sh.vertexShader = 'varying vec3 vGridPos;\n' + sh.vertexShader.replace(
                '#include <project_vertex>',
                '#include <project_vertex>\n vGridPos = (modelMatrix * vec4(transformed, 1.0)).xyz;');
            sh.fragmentShader = 'varying vec3 vGridPos;\nuniform vec3 gridCol;\nuniform float gridEvery;\n' +
                'uniform vec4 ripPos[' + RIPPLES + '];\nuniform float ripAge[' + RIPPLES + '];\n' +
                'uniform vec4 wakePos[' + WAKE + '];\nuniform vec2 wakeInfo[' + WAKE + '];\nuniform float wakeOn;\n' +
                sh.fragmentShader.replace('#include <fog_fragment>', [
                    RIPPLE_GLSL,
                    WAKE_GLSL,
                    'vec2 gq = (vGridPos.xz - gwarp) / gridEvery;',
                    'vec2 gf = max(fwidth(gq), vec2(1e-4));',
                    'vec2 gw = abs(fract(gq - 0.5) - 0.5) / gf;',
                    'float gl = 1.0 - min(min(gw.x, gw.y), 1.0);',
                    // Where a unit of grid is down to a few pixels — far
                    // off, or a slope seen edge on — the lines would merge
                    // into a solid bright band and the bloom would spread it,
                    // so they fade out instead of crowding.
                    'gl *= 1.0 - smoothstep(0.22, 0.5, max(gf.x, gf.y));',
                    '#ifdef USE_COLOR',
                    'vec3 gc = min(vColor * 11.0, vec3(1.0));',
                    '#else',
                    'vec3 gc = gridCol;',
                    '#endif',
                    'gl_FragColor.rgb += gc * gl * (1.0 + glit) + gc * glit * 0.08 + gc * wglow;',
                    '#include <fog_fragment>'
                ].join('\n'));
        };
        mat.customProgramCacheKey = function () { return 'gridglass'; };
        return mat;
    }

    // A lit lip round each hole in the glass, on the ground's own height, so
    // a void reads from the tee as a mouth rather than a missing patch.
    function addVoidRims(group, pad) {
        var pts = [], i, k, v, a0, a1, n = 40;
        for (i = 0; i < pad.voids.length; i++) {
            v = pad.voids[i];
            for (k = 0; k < n; k++) {
                a0 = k / n * Math.PI * 2; a1 = (k + 1) / n * Math.PI * 2;
                pts.push(v.x + Math.cos(a0) * v.r, P.padHeight(pad, v.x + Math.cos(a0) * v.r, v.z + Math.sin(a0) * v.r) + 0.03, v.z + Math.sin(a0) * v.r,
                         v.x + Math.cos(a1) * v.r, P.padHeight(pad, v.x + Math.cos(a1) * v.r, v.z + Math.sin(a1) * v.r) + 0.03, v.z + Math.sin(a1) * v.r);
            }
        }
        var geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
        group.add(new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color: 0x27f0ff })));
    }

    /* A gravity well, drawn as the black hole it is (v1.129.0; the owner on
       the sphere and two flat rings it used to be: "very ugly"). Three parts,
       from the shader every black hole in the game shares (see "the black
       hole", below):

         · **the disc on the ground**, which is the reading that matters to a
           player: it reaches out to where the pull falls to a tenth of the
           hole's gravity (`wellReach`), so the ground it darkens and the rings
           feeding in across it are the ground the ball will be bent on. Its
           horizon is the core exactly — inside that the ball is gone.
         · **a black sphere** standing in the middle, which is the one solid
           -looking thing: it is drawn opaque and writes depth, so the near
           half of the disc passes in front of it and the far half behind,
           the way a disc round a black hole does.
         · **the glow round the sphere**, turned to the camera: a photon ring
           on its silhouette and a short bright halo — and postfx bends the
           picture round it (`lensList`), which is what lifts the far side of
           the disc up over the top. */
    function wellReach(hole, w) {
        if (w.reach) return w.reach;     // a whirlpool says where its water goes slack
        var g = P.gravityOf(hole);
        var d = Math.sqrt(Math.max(0, w.pull / (0.1 * g) - w.core * w.core));
        return Math.max(w.core * 3, Math.min(w.core * 6, d));
    }

    // A theme can paint the wells' discs in its own world's inks
    // (`wellHot`, `wellCool`); the default is gold into violet.
    function addWells(group, hole, theme) {
        var hot = theme && theme.wellHot, cool = theme && theme.wellCool;
        hole.wells.forEach(function (w) {
            var top = P.surfaceTop(hole, w.x, w.z), y = top ? markY(top.pad, w.x, w.z) : MARK_LIFT;
            var reach = wellReach(hole, w);
            var disc = blackHole({ size: reach, hor: w.core / reach,
                ring: Math.min(0.7, w.core * 1.9 / reach), feed: 2.4, shade: 0.95, beam: 0.35, gain: 1.3, rim: 0.9,
                hot: hot, cool: cool });
            disc.rotation.x = -Math.PI / 2;
            disc.position.set(w.x, y, w.z);
            group.add(disc);
            var rs = w.core * 0.66;
            var cy = y + rs * 0.42;
            var core = new THREE.Mesh(new THREE.SphereGeometry(rs, 32, 20),
                new THREE.MeshBasicMaterial({ color: 0x000000 }));
            core.position.set(w.x, cy, w.z);
            group.add(core);
            var glow = blackHole({ facing: true, size: rs * 2.6, hor: 1 / 2.6, ring: 1.25 / 2.6,
                feed: 0, shade: 0, beam: 0.55, order: 1, hot: hot, cool: cool });
            glow.position.set(w.x, cy, w.z);
            group.add(glow);
            R.wells.push({ w: w, disc: disc, glow: glow, core: core, cx: w.x, cy: cy, cz: w.z, rs: rs });
        });
    }

    /* The grid world's horizon: a striped sunset sun standing behind the
       flag, and a ring of wireframe mountains round the whole world — the
       two things every picture of the genre has, and the reason the sky is
       violet rather than black. Both are unfogged (they are two hundred units
       out, where the fog has long since closed) and unlit. */
    var NEON_SUN_VS = [
        'varying vec2 vUv;',
        'void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }'
    ].join('\n');
    var NEON_SUN_FS = [
        'varying vec2 vUv;',
        'void main() {',
        '  vec2 p = vUv * 2.0 - 1.0;',
        '  float r = length(p);',
        '  if (r > 1.0) discard;',
        '  vec3 top = vec3(1.0, 0.86, 0.32), bot = vec3(1.0, 0.16, 0.56);',
        '  vec3 c = mix(bot, top, smoothstep(-0.9, 0.85, p.y));',
        // Bands cut across the lower half, widening towards the bottom.
        '  if (p.y < 0.05) {',
        '    float t = (0.05 - p.y) / 1.05;',
        '    float band = fract((0.05 - p.y) * 7.0);',
        '    if (band < 0.18 + t * 0.55) discard;',
        '  }',
        // edge0 < edge1, always: smoothstep with them reversed is undefined in
        // GLSL, and this GPU's answer to it was zero — an invisible sun.
        '  float rim = 1.0 - smoothstep(0.92, 1.0, r);',
        '  gl_FragColor = vec4(c * 1.15, rim);',
        '}'
    ].join('\n');
    function addNeonBackdrop(group, hole, theme) {
        var b = hole.bounds, cx = (b.minX + b.maxX) / 2, cz = (b.minZ + b.maxZ) / 2;
        var dir = Math.atan2(hole.cup.x - hole.tee.x, hole.cup.z - hole.tee.z), D = 230;
        var sun = new THREE.Mesh(new THREE.PlaneGeometry(76, 76), new THREE.ShaderMaterial({
            vertexShader: NEON_SUN_VS, fragmentShader: NEON_SUN_FS,
            transparent: true, depthWrite: false, fog: false, side: THREE.DoubleSide
        }));
        /* Setting, not risen: the play camera looks down at the ball and
           sees barely a degree above the horizon, so a sun up in the sky is a
           sun nobody sees. Its middle sits on the horizon and the floor hides
           the lower half, which is how the picture always goes. */
        sun.position.set(cx + Math.sin(dir) * D, theme.surroundY + 6, cz + Math.cos(dir) * D);
        sun.lookAt(cx, theme.surroundY + 6, cz);
        sun.renderOrder = -1;
        group.add(sun);

        // The mountains: a ridge round a circle, every vertex tied down to
        // the floor and to its neighbour's foot, which is what a wireframe
        // range looks like. Cyan at the foot, magenta at the peaks.
        var n = 180, R0 = 200, y0 = theme.surroundY, pts = [], cols = [], i, a, h, x, z, nx, nz, nh, an;
        var foot = new THREE.Color(0x27f0ff), peak = new THREE.Color(0xff3df2);
        function height(t) {
            return Math.max(0, 9 * Math.sin(t * 3) + 6 * Math.sin(t * 7 + 1.3) + 4 * Math.sin(t * 13 + 0.4) + 5) *
                (0.6 + 0.4 * Math.abs(Math.sin(t * 2.0 + 0.7)));
        }
        function push(ax, ay, az, ca, bx, by, bz, cb) {
            pts.push(ax, ay, az, bx, by, bz);
            cols.push(ca.r, ca.g, ca.b, cb.r, cb.g, cb.b);
        }
        for (i = 0; i < n; i++) {
            a = i / n * Math.PI * 2; an = (i + 1) / n * Math.PI * 2;
            h = height(a); nh = height(an);
            x = cx + Math.cos(a) * R0; z = cz + Math.sin(a) * R0;
            nx = cx + Math.cos(an) * R0; nz = cz + Math.sin(an) * R0;
            push(x, y0 + h, z, peak, nx, y0 + nh, nz, peak);        // the ridge
            if (h > 0.5) push(x, y0, z, foot, x, y0 + h, z, peak);  // a rib
            push(x, y0 + h, z, peak, nx, y0, nz, foot);             // a facet
        }
        var geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
        geo.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
        group.add(new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ vertexColors: true, fog: false })));
    }

    /* Rainbow road, in glass: a pad with a `hue` ([start, spread], turns of
       the colour wheel) is coloured per vertex, drifting across the ground in
       long diagonal bands and climbing a little with height, so the shape of
       a surface shows in its colour as well as in the grid on it. Each
       Challenge hole carries its own range. `light` is how bright (RAINBOW_GLASS). */
    function rainbowAt(pad, x, y, z, light) {
        var t = 0.5 + 0.5 * Math.sin(x * 0.19 + z * 0.13) * Math.cos(z * 0.07 - x * 0.05);
        var h = pad.hue[0] + pad.hue[1] * t + y * 0.05;
        return _hsl.setHSL(h - Math.floor(h), 0.9, light);
    }
    function tintRainbow(geo, pad, ox, oy, oz, light) {
        var p = geo.attributes.position, n = p.count, col = new Float32Array(n * 3), i, c;
        for (i = 0; i < n; i++) {
            c = rainbowAt(pad, p.getX(i) + ox, p.getY(i) + oy, p.getZ(i) + oz, light);
            col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
        }
        geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    }
    // The glass, taking its colour from the vertices rather than from itself.
    function rainbowGlass() {
        if (!R.surf.rainbow) {
            var g = R.surf.pads.glass.slab[0];
            R.surf.rainbow = gridGlass(new THREE.MeshPhongMaterial({
                color: 0xffffff, vertexColors: true, emissive: g.emissive.clone().multiplyScalar(0.6),
                shininess: g.shininess, specular: new THREE.Color(0x000000)
            }), R.theme);
        }
        return R.surf.rainbow;
    }
    /* The shallows round an island (courses.island's `shelf`): a band on the
       water's surface from the shore outwards, pale turquoise at the beach
       and fading to nothing over `out` units — the colour a lagoon goes
       where the sand is a hand under it. The water is all but opaque (it
       has to be, to read as a sea), so a sandbank drawn under it does not
       show; this is the same thing said on the surface instead. One
       gradient texture, shared, laid across the band by its own uv. */
    var _shallowTex = null;
    function addShelf(group, pad) {
        var sh = pad.shelf, pts = padOutline(pad, 0.35), n = pts.length;
        var cx = pad.x + pad.w / 2, cz = pad.z + pad.d / 2;
        var pos = new Float32Array(n * 6 * 3), uv = new Float32Array(n * 6 * 2);
        var i, j = 0, k = 0, a, b, oa, ob;
        function out(p) {
            var dx = p[0] - cx, dz = p[1] - cz, l = Math.hypot(dx, dz) || 1;
            return [p[0] + dx / l * sh.out, p[1] + dz / l * sh.out];
        }
        for (i = 0; i < n; i++) {
            a = pts[i]; b = pts[(i + 1) % n];
            oa = out(a); ob = out(b);
            // Wound so the face looks up (the outline runs anticlockwise).
            pos.set([a[0], sh.y, a[1], ob[0], sh.y, ob[1], oa[0], sh.y, oa[1]], j); j += 9;
            pos.set([a[0], sh.y, a[1], b[0], sh.y, b[1], ob[0], sh.y, ob[1]], j); j += 9;
            uv.set([0.5, 0, 0.5, 1, 0.5, 1, 0.5, 0, 0.5, 0, 0.5, 1], k); k += 12;
        }
        if (!_shallowTex) {
            var cv = document.createElement('canvas');
            cv.width = 4; cv.height = 64;
            var g2 = cv.getContext('2d'), gr = g2.createLinearGradient(0, 0, 0, 64);
            gr.addColorStop(0, 'rgba(255,255,255,0.75)');
            gr.addColorStop(0.35, 'rgba(255,255,255,0.4)');
            gr.addColorStop(1, 'rgba(255,255,255,0)');
            g2.fillStyle = gr; g2.fillRect(0, 0, 4, 64);
            _shallowTex = new THREE.CanvasTexture(cv);
        }
        var geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
        var mesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({
            map: _shallowTex, color: sh.colour || 0x8fe6da,
            transparent: true, depthWrite: false
        }));
        mesh.renderOrder = 2;
        group.add(mesh);
    }

    function addPad(group, pad, theme, cup, pads) {
        // The ground under a crust is the lava's to draw (addLava, addCrust).
        if (pad.kind === 'crust') return;
        if (pad.shelf) addShelf(group, pad);
        if (pad.bumps || pad.field) { addTerrain(group, pad, theme, cup, pads); return; }
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
        // A sea cliff (courses.cliff, `sheer`) stands partly on its island and
        // partly over the water, and has to go all the way down on both: cut
        // off at the island's top, its seaward face would stop a hand's
        // breadth over the waves with daylight under it.
        var floor = pad.sheer ? null : supportUnder(pads, pad, cy);
        var least = holed ? R.cupD + 0.25 : 0.2;
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
        // on it, so it needs no more depth than the cup does. A disc marked
        // `stands` is the other thing — ground of its own with sides, a mesa
        // or an island (courses.js) — and goes down like any other slab;
        // drawn three tenths thick, Redstone's mesa was a plate of scrub
        // floating three units over the fairway.
        if (pad.r && !pad.stands) thick = holed ? R.cupD + 0.25 : 0.3;
        // And a hovering platform is a slab with daylight under it, which is
        // the whole of what it is (Challenge mode's raised tee).
        // …unless it says how far down it goes (`deck`: a tour hole stood on
        // a bank of its world, portals.js → world, `plinth`).
        if (pad.hover) thick = Math.max(least, pad.deck || 0.4);
        var boxed = !pad.r && !(holed || pad.round || pad.lane);
        var geo = pad.r
            ? discGeometry(pad, thick, cup, holed)
            : !boxed
                ? punchedSlab(pad, thick, holed ? cup : null)
                : capAndSides(new THREE.BoxGeometry(pad.w, thick, pad.d));
        if ((holed || pad.round || pad.lane) && !pad.r) {
            // The box is centred on its own middle; the extruded slab is built
            // that way too, so both share the placement below.
            geo.translate(0, thick / 2, 0);
        }
        if (pad.r && pad.weathered) weatherWall(geo, pad, thick, cy);
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
        worldUv(geo, pad.oob ? SUR_TILE : (TX.SCALE[pad.kind] || TX.SCALE.green), cx, cz);
        // A box is a cap and its sides as well, since capAndSides.
        var look = padMaterial(pad.kind, pad.inlay && !pad.stands ? 'inlay' : 'slab');
        // Out of play is bare rock, as it is in addTerrain: a ledge under a
        // rim or the top of a butte nobody can reach wears no grass.
        if (pad.oob) {
            var bare = groundMaterial(theme);
            look = look.map(function (m) { return m === R.surf.side ? m : bare; });
        }
        var mesh = new THREE.Mesh(geo, look);
        mesh.position.set(cx, cy - thick / 2 + discLift(pad), cz);
        mesh.receiveShadow = true;
        mesh.castShadow = true;
        group.add(mesh);
        if (pad.crown) addCrown(group, pad, cy);
        if (pad.oob) return;

        // …and the grass standing on it, if it is the sort of pad that grows.
        addShells(group, pad, cup, holed, cx, cy, cz, null,
            bareInlays(pads, pad, holed ? cup : null));
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
            (pad.inlay ? discLift(pad) || INLAY_LIFT : 0) +
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

    /* A travelator: a belt that runs. Seams across it and chevrons along
       it, all sliding the way the belt carries the ball and wrapping round at
       the far end, so it reads as a conveyor from the tee before a ball has
       touched it (the owner, v1.186.0: "some animation of moving line like a
       conveyor belt"). Still pictures carry the number too: the chevrons are
       spaced by how hard it pushes, so a fast belt is a dense one.

       The pace on screen is not the ball's. A belt's terminal speed is
       |push| / -ln(friction) — thirty units a second on The Springboard's —
       and seams going by at that rate strobe into nothing on a 30fps phone.
       BELT_PACE gives a slow belt a slow crawl and a hard one a run, in the
       same order, and never so fast that a seam jumps a gap in one frame.

       Each piece is shrunk to nothing over the last stretch of the run, so
       nothing pops into being at the near end and nothing hangs over a
       rounded corner at the far one. Pieces share a material per kind, so
       fading is done by scale, not opacity. stepBelts moves them. */
    var BELT_SEAM = 0.55;      // gap between seams, units
    var BELT_FADE = 0.7;       // the stretch at each end a piece shrinks over
    function beltPace(mag) { return Math.min(5.5, 1.1 + Math.sqrt(mag) * 0.95); }

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
        step = run / n;                       // whole chevrons round the loop
        var seams = Math.max(2, Math.round(run / BELT_SEAM));
        var cx = pad.x + pad.w / 2, cz = pad.z + pad.d / 2;
        var belt = {
            pad: pad, cx: cx, cz: cz, run: run, sx: Math.sin(yaw), sz: Math.cos(yaw),
            pace: beltPace(mag), lanes: []
        };

        var seamGeo = new THREE.PlaneGeometry(across * 0.9, 0.07);
        seamGeo.rotateX(-Math.PI / 2);
        var seamMat = markMat(0x120e18, 0.5);
        var chevGeo = new THREE.ShapeGeometry(chevronShape(wide, wide * 0.85, wide * 0.42));
        chevGeo.rotateX(-Math.PI / 2);
        var chevMat = markMat(theme.machine || 0xffd34d, 0.95);

        [[seamGeo, seamMat, seams, run / seams, 0, 1],
         [chevGeo, chevMat, n, step, 0.006, 2]].forEach(function (l) {
            var lane = { gap: l[3], lift: l[4], meshes: [] };
            for (var i = 0; i < l[2]; i++) {
                var m = new THREE.Mesh(l[0], l[1]);
                m.rotation.y = yaw;
                m.renderOrder = l[5];
                lane.meshes.push(m);
                group.add(m);
            }
            belt.lanes.push(lane);
        });
        placeBelt(belt, 0);
        (R.belts || (R.belts = [])).push(belt);
    }

    /* Where every piece of a belt is `t` seconds into its run. */
    function placeBelt(b, t) {
        var half = b.run / 2, k, i, lane, off, f, s, x, z, m;
        for (k = 0; k < b.lanes.length; k++) {
            lane = b.lanes[k];
            off = (t * b.pace) % lane.gap;
            for (i = 0; i < lane.meshes.length; i++) {
                f = (i + 0.5) * lane.gap + off;
                if (f > b.run) f -= b.run;
                s = Math.min(1, f / BELT_FADE, (b.run - f) / BELT_FADE);
                s = s * s * (3 - 2 * s);
                m = lane.meshes[i];
                f -= half;
                x = b.cx + b.sx * f;
                z = b.cz + b.sz * f;
                m.visible = s > 0.02;
                m.scale.set(s, 1, s);
                m.position.set(x, markY(b.pad, x, z) + lane.lift, z);
            }
        }
    }

    function stepBelts() {
        for (var i = 0; i < (R.belts || []).length; i++) placeBelt(R.belts[i], R.clock);
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
        // (There was only ever one, at a third opacity, which under the grass
        // that used to cover the face nobody could tell.)
        var ringMat = markMat(0x1a1420, 0.5);
        [[0.3, 0.38], [0.64, 0.72]].forEach(function (b) {
            var ring = new THREE.Mesh(new THREE.RingGeometry(r * b[0], r * b[1], 32), ringMat);
            ring.rotation.x = -Math.PI / 2;
            ring.position.set(cx, y + 0.004, cz);
            group.add(ring);
        });
        var rim = new THREE.Mesh(new THREE.TorusGeometry(r * 1.02, 0.055, 8, 32),
            new THREE.MeshLambertMaterial({ color: col }));
        rim.rotation.x = -Math.PI / 2;
        rim.position.set(cx, y + 0.04, cz);
        rim.castShadow = true;
        group.add(rim);
    }

    /* ── the black hole ─────────────────────────────────────────────────

       Everything in the game that eats a ball is drawn with one shader
       (shaders.js, BLACKHOLE_*, v1.129.0): a pipe's mouth, the hole that
       opens in the sky over its exit, and a gravity well. The owner's
       brief was Cargo Lander's black hole, and the parts of it that matter
       are an event horizon that is properly black, a disc of light turning
       round it, rings feeding in, and the picture behind it bending — the
       last of which is postfx.js's (`lens`), fed from `stepBlackHoles`.

       Each is a quad of side two made the size it should be by the shader's
       own `size` uniform, so its mesh is never scaled, and the raycasts that
       pick camera seats never see one: they are effects, not things, and
       nothing on the course is solid unless it is in `walls`. Every material
       is in R.holeMats so the frame can wind their clocks together. */
    var BH_HOT = 0xffb25a, BH_COOL = 0x7d3cff;
    // How far round the mouth the disc spreads, in mouth radii. The rim of
    // the mouth itself — where the ball goes in — is the bright band.
    var MOUTH_REACH = 1.75;
    var PORTAL_R = 1.0;

    function blackHoleMaterial(o) {
        var mat = new THREE.ShaderMaterial({
            defines: o.facing ? { FACING: '' } : {},
            uniforms: {
                time: { value: 0 },
                size: { value: o.size },
                open: { value: o.open === undefined ? 1 : o.open },
                hor: { value: o.hor },
                ring: { value: o.ring },
                feed: { value: o.feed === undefined ? 1 : o.feed },
                shade: { value: o.shade === undefined ? 0.6 : o.shade },
                gulp: { value: 0 },
                spin: { value: o.spin || 1 },
                beam: { value: o.beam || 0 },
                rim: { value: o.rim || 0 },
                hot: { value: lin(o.hot || BH_HOT).multiplyScalar(o.gain || 1) },
                cool: { value: lin(o.cool || BH_COOL).multiplyScalar(o.gain || 1) }
            },
            vertexShader: SH.BLACKHOLE_VS,
            fragmentShader: SH.BLACKHOLE_FS,
            transparent: true,
            depthWrite: false,
            premultipliedAlpha: true,
            side: THREE.DoubleSide
        });
        R.holeMats.push(mat);
        return mat;
    }

    function blackHole(o) {
        var m = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), blackHoleMaterial(o));
        m.frustumCulled = false;
        m.raycast = function () {};
        m.renderOrder = o.order || 0;
        return m;
    }

    /* A pipe mouth: a black hole lying in the floor. The horizon is a little
       over half the mouth, the bright band is the mouth's own rim — where a
       ball rolling past is taken — and the disc and the rings feeding in
       spread three quarters of a radius beyond it, darkening the ground as
       they go, so the hole reads as the floor falling away into it rather
       than as a decal on top. It flares and spins up while it swallows
       (`gulp`, stepBlackHoles).

       It used to be a black disc, a throat, and a torus in the machine
       colour. The torus was there because a flat ring under the grass could
       only be seen from one side (see the note on MARK_LIFT); a lit disc
       lifted clear of the shells has no far side to lose.

       And with it, shut, the portal that will open in the sky over the exit
       while a ball is in the pipe — a black hole of its own, turned to face
       the camera, at the place the ride says (physics.js, "the wormhole"). */
    function addMouth(group, hole, w, theme) {
        var s = P.surfaceTop(hole, w.x, w.z);
        var y = s ? markY(s.pad, w.x, w.z) : MARK_LIFT;
        var disc = blackHole({ size: w.r * MOUTH_REACH, hor: 0.55 / MOUTH_REACH,
            ring: 0.92 / MOUTH_REACH, feed: 1.1, shade: 0.8, beam: 0.3 });
        disc.rotation.x = -Math.PI / 2;
        disc.position.set(w.x, y, w.z);
        group.add(disc);
        var portal = blackHole({ facing: true, size: PORTAL_R, hor: 0.3, ring: 0.44,
            feed: 1.2, shade: 0.2, beam: 0.35, gain: 2.2, open: 0, order: 2 });
        portal.visible = false;
        group.add(portal);
        R.mouths.push({ w: w, disc: disc, portal: portal, gulp: 0, open: 0, after: 9, at: null });
    }

    /* How the ball is shown on the ride: shrinking into the mouth over the
       back half of the swallow, gone in the dark, and grown back to full as
       it leaves the portal. Drawing only — the ball is the same size to the
       physics throughout, and nothing is colliding with it anyway. */
    function warpScale(wr) {
        if (!wr) return 1;
        var ph = P.warpPhase(wr);
        if (ph.phase === 'swallow') return 1 - smooth01((ph.s - 0.45) / 0.55);
        if (ph.phase === 'dark') return 0;
        return smooth01(ph.s / 0.22);
    }
    function smooth01(x) { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); }

    /* The frame's work for every black hole on the hole: the shared clock,
       the mouth's gulp, the sky portal opening and closing, the ball's size,
       and the list of lenses for postfx. The portal runs off the ride's own
       clock while there is a ride, so a replay — which carries the ride on
       its tape — opens it at exactly the moment the shot did; after the
       landing it closes on the renderer's clock, because by then there is no
       ride to ask. */
    var _lensPt = new THREE.Vector3();
    var _lenses = [];
    function stepBlackHoles(dt, world) {
        var i, m, wr = world.warping || null, ph = null;
        for (i = 0; i < R.holeMats.length; i++) R.holeMats[i].uniforms.time.value = R.clock;
        if (wr) ph = P.warpPhase(wr);
        for (i = 0; i < R.mouths.length; i++) {
            m = R.mouths[i];
            var mine = !!wr && wr.w === m.w;
            var eat = mine && ph.phase === 'swallow' ? 1 : 0;
            m.gulp += (eat - m.gulp) * (1 - Math.pow(eat ? 0.002 : 0.08, dt));
            m.disc.material.uniforms.gulp.value = m.gulp;
            var pu = m.portal.material.uniforms;
            if (mine) {
                m.at = { x: wr.px, y: wr.py, z: wr.pz };
                m.after = 0;
                if (ph.phase === 'swallow') m.open = 0;
                else if (ph.phase === 'dark') m.open = smooth01(ph.s) * 0.9;
                else m.open = 0.9 + 0.1 * smooth01(ph.s * 3);
                // It spits the ball out: a flare as the drop starts.
                pu.gulp.value = ph.phase === 'drop' ? Math.max(0, 1 - ph.s * 2.5) : (ph.phase === 'dark' ? ph.s * 0.6 : 0);
            } else if (m.at) {
                m.after += dt;
                m.open = 1 - smooth01((m.after - 0.15) / 0.55);
                pu.gulp.value = 0;
                if (m.open <= 0) m.at = null;
            }
            m.portal.visible = !!m.at && m.open > 0.002;
            if (m.portal.visible) {
                m.portal.position.set(m.at.x, m.at.y, m.at.z);
                pu.open.value = m.open;
            }
        }
        var k = warpScale(wr);
        R.ball.scale.setScalar(Math.max(1e-3, k) * R.look);   // and its drawn size (`lookFor`)
        R.ball.visible = k > 0.01;
    }

    /* Where the lenses are on the screen this frame, for postfx: a centre in
       uv, a horizon radius in units of the screen's height, and a strength
       (the square of the Einstein radius over the horizon's, so 1 bends the
       light right round at the horizon). Only the portal and the wells' cores,
       because they are round on the screen. A mouth is a disc on the floor
       seen at a slant, and a round lens over an ellipse was tried and looked
       like a fault: it dragged the grass in over the horizon and the black
       came out brown. Called after the camera has moved, which is the only
       camera it can be right for. */
    function lensList() {
        _lenses.length = 0;
        var cam = R.camera, i, m;
        cam.updateMatrixWorld();
        var t = Math.tan(cam.fov * Math.PI / 360);
        function add(x, y, z, r, k) {
            if (_lenses.length >= 4 || k <= 0) return;
            _lensPt.set(x, y, z);
            var d = _lensPt.distanceTo(cam.position);
            _lensPt.project(cam);
            if (_lensPt.z > 1 || _lensPt.z < -1 || d < 0.3) return;
            var u = _lensPt.x * 0.5 + 0.5, v = _lensPt.y * 0.5 + 0.5;
            if (u < -0.5 || u > 1.5 || v < -0.5 || v > 1.5) return;
            _lenses.push({ x: u, y: v, r: r / (2 * d * t), k: k });
        }
        for (i = 0; i < R.mouths.length; i++) {
            m = R.mouths[i];
            if (m.portal.visible) add(m.at.x, m.at.y, m.at.z, PORTAL_R * 0.3 * m.open, 0.9 * m.open);
        }
        for (i = 0; i < R.wells.length; i++) {
            m = R.wells[i];
            add(m.cx, m.cy, m.cz, m.rs, 0.8);
        }
        celeLenses(add);
        if (R.dive && R.diveBH && R.diveBH.visible) {
            var bhOpen = R.diveBH.material.uniforms.open.value;
            add(R.diveBH.position.x, R.diveBH.position.y, R.diveBH.position.z, G3.holeR(R.hole) * 1.15 * bhOpen, 0.95 * bhOpen);
        }
        return _lenses;
    }

    /* A loop-the-loop: the track the ball rides round (physics.js, "the
       loop"), drawn from the same loop the physics reads — its foot, its
       radius, its corkscrew — so the rails are exactly where the ball is.

       Open track, not a solid chute, and that is the whole of the design. A
       loop seen from the tee is seen edge-on, and a solid deck edge-on is a
       wall: the first version was a pink band you watched the ball vanish
       into and come out of. Two running rails the ball sits between, a guard
       rail outside each, and a tie across the back every few degrees is what
       a fairground loop is made of, and the ball shows through it from every
       seat. Not solid either way: the ball is carried round, never collided.

       The rails are swept by hand rather than as a TubeGeometry along a Curve
       because a Curve has to be subclassed and the vendored three.js is an
       ES6 build. Everything is built in the loop's own frame — forward along
       +z, the corkscrew stepping along +x — inside a group turned to its yaw,
       which is exactly physics.loopFrame's axes.

       Then a post either side of the foot, up to an axle through the middle
       of the circle, because a loop with nothing holding it up is a ribbon
       hanging in the air. */
    var LOOP_SEGS = 120;

    function addLoop(group, hole, L, theme) {
        var F = P.loopFrame(L);
        var floor = P.loopBase(hole, L) - C.BALL_R;
        var deck = L.R + C.BALL_R;             // where the ball touches
        var cy = L.R + C.BALL_R;               // the middle of the circle, over the floor
        var col = theme.machine || 0xffd34d;
        var steel = new THREE.MeshLambertMaterial({ color: new THREE.Color(col).multiplyScalar(0.55) });
        var paint = new THREE.MeshLambertMaterial({ color: col });
        var g = new THREE.Group();
        g.position.set(L.x, floor, L.z);
        g.rotation.y = L.yaw;
        group.add(g);

        function at(th, side, rad) {
            return [F.k * th + side, cy - rad * Math.cos(th), rad * Math.sin(th)];
        }
        // A square bar of half-width `w` swept round the loop with its middle
        // at (side, rad), each face its own strip so the edges stay sharp.
        function bar(side, rad, w, mat) {
            var sq = [[-w, -w], [w, -w], [w, w], [-w, w]];
            var pos = [], idx = [], j, i, a, b, base, k, th;
            for (j = 0; j < 4; j++) {
                a = sq[j]; b = sq[(j + 1) % 4];
                base = pos.length / 3;
                for (i = 0; i <= LOOP_SEGS; i++) {
                    th = i / LOOP_SEGS * Math.PI * 2;
                    Array.prototype.push.apply(pos, at(th, side + a[0], rad + a[1]));
                    Array.prototype.push.apply(pos, at(th, side + b[0], rad + b[1]));
                    if (i < LOOP_SEGS) {
                        k = base + i * 2;
                        idx.push(k, k + 2, k + 1, k + 1, k + 2, k + 3);
                    }
                }
            }
            var geo = new THREE.BufferGeometry();
            geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
            geo.setIndex(idx);
            geo.computeVertexNormals();
            var m = new THREE.Mesh(geo, mat);
            m.castShadow = true;
            g.add(m);
        }
        var run = 0.11, rw = 0.035;            // the running rails: either side of the ball's line
        var guard = 0.3;                        // and the guards, up at the ball's middle
        bar(-run, deck + rw, rw, paint);
        bar(run, deck + rw, rw, paint);
        bar(-guard, deck - C.BALL_R, rw, paint);
        bar(guard, deck - C.BALL_R, rw, paint);

        // A tie across the back every fifteen degrees, holding the four
        // together: a flat bar behind the running rails, turned to the radius.
        var n = 24, i, th, tie, p;
        for (i = 0; i < n; i++) {
            th = (i + 0.5) / n * Math.PI * 2;
            p = at(th, 0, deck + 2 * rw + 0.02);
            tie = new THREE.Mesh(new THREE.BoxGeometry(2 * guard + 2 * rw, 0.04, 0.06), steel);
            tie.position.set(p[0], p[1], p[2]);
            tie.rotation.x = Math.PI - th;
            g.add(tie);
            // and a strut out from the tie to each guard
            var sa = new THREE.Mesh(new THREE.BoxGeometry(0.04, C.BALL_R + 2 * rw + 0.02, 0.04), steel);
            var q = at(th, -guard, deck + rw - C.BALL_R / 2 + 0.01);
            sa.position.set(q[0], q[1], q[2]);
            sa.rotation.x = Math.PI - th;
            g.add(sa);
            var sb = sa.clone();
            q = at(th, guard, deck + rw - C.BALL_R / 2 + 0.01);
            sb.position.set(q[0], q[1], q[2]);
            g.add(sb);
        }

        var sides = [-guard - 0.3, L.shift + guard + 0.3], k2;
        for (k2 = 0; k2 < 2; k2++) {
            var post = new THREE.Mesh(new THREE.BoxGeometry(0.16, cy + 0.3, 0.16), steel);
            post.position.set(sides[k2], (cy + 0.3) / 2 - 0.3, 0);
            post.castShadow = true;
            g.add(post);
        }
        var axle = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, sides[1] - sides[0], 10), steel);
        axle.rotation.z = Math.PI / 2;
        axle.position.set((sides[0] + sides[1]) / 2, cy, 0);
        axle.castShadow = true;
        g.add(axle);
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
        /* A palm, on the keys: the lagoon's own palm model rather than a
           conifer on a coral island, stood on the ground the trunk is seated
           in (`seat` below its base) and turned and sized off where it
           stands. It leans from its foot in the wind, which is how a palm
           moves. The trunk the ball hits is the wall, as for any tree. */
        if (wall.palm && G3.getModelMesh) {
            var pm = G3.getModelMesh('palm', R.surf.decor.model);
            if (pm) {
                var ph = treeHash(B.cx, B.cz);
                var pivot = new THREE.Group();
                pivot.position.set(B.cx, B.base + (wall.seat === undefined ? 0.4 : wall.seat), B.cz);
                pivot.rotation.y = ph * 6.283;
                pm.scale.setScalar(wall.h * (1.05 + ph * 0.3) / 4.25);
                pivot.add(pm);
                group.add(pivot);
                (R.canopies || (R.canopies = [])).push({ g: pivot, k: 0.025, ph: ph * 9.7 });
                return;
            }
        }
        var a = treeHash(B.cx, B.cz), b = treeHash(B.cz * 1.7, B.cx * 0.9);
        var trunkR = Math.max(B.hw, B.hd) * 0.55;
        // Tall enough to look like a tree from the ball, which is lower down
        // than the collision box needs to be: the wall stops the ball, the
        // canopy stops the player thinking the hole is open there.
        var h = wall.h * (1.05 + a * 0.5);
        var crown = Math.max(B.hw, B.hd) * (2.6 + b * 1.1);
        var leaf = R.surf.leaf[a < 0.5 ? 0 : 1];

        // The trunk stands still, with every other trunk on the hole (stand).
        stand(group, new THREE.CylinderGeometry(trunkR * 0.7, trunkR * 1.15, h, 7),
            R.surf.walls.tree, B.cx, B.base + h / 2, B.cz);

        var top = B.base + h;
        var i, mesh, geo;
        /* The crown hangs off a pivot at the top of the trunk rather than
           being placed in the world, so the wind can lean it (swayTrees) and
           it bends where a tree bends — not about its own middle, which is a
           ball of leaves wobbling on a stick. Positions below are relative to
           that pivot. */
        var crownAt = new THREE.Group();
        crownAt.position.set(B.cx, top - crown * 0.4, B.cz);
        group.add(crownAt);
        var lift = crown * 0.4;
        if (wall.fir) {
            /* A mountain fir (courses.tree `fir`): a spire rather than a
               cone, four skirts of needles each narrower than the one under
               it, from a little off the ground to a point well over the
               trunk — the shape that sheds snow, and the one an alpine
               treeline is drawn in. */
            var spire = crown * 0.82;
            for (i = 0; i < 4; i++) {
                geo = new THREE.ConeGeometry(spire * (1 - i * 0.2), spire * (1.5 - i * 0.12), 7);
                mesh = new THREE.Mesh(geo, R.surf.fir);
                mesh.position.set(0, lift - h * 0.42 + i * spire * 0.78, 0);
                mesh.rotation.y = a * 6.283 + i;
                mesh.castShadow = true;
                crownAt.add(mesh);
            }
        } else if (a < 0.5) {
            // A conifer: two skirts, the upper one narrower and higher.
            for (i = 0; i < 2; i++) {
                geo = new THREE.ConeGeometry(crown * (1 - i * 0.34), crown * (2.1 - i * 0.5), 8);
                mesh = new THREE.Mesh(geo, leaf);
                mesh.position.set(0, lift - crown * 0.35 + i * crown * 0.95, 0);
                mesh.castShadow = true;
                crownAt.add(mesh);
            }
        } else if (b > 0.62) {
            /* A round tree: three soft clumps stacked into one rounded crown,
               the chunky toy-box tree every cosy golf game is planted with.
               Rounder than the faceted broadleaf beside it (one level of
               subdivision rather than none), and a shade warmer, so a stand
               of mixed trees reads as several kinds rather than one shape
               repeated. */
            var warm = R.surf.leafWarm || leaf;
            for (i = 0; i < 3; i++) {
                geo = new THREE.IcosahedronGeometry(crown * (i ? 0.62 : 0.9), 1);
                geo.scale(1, 0.9, 1);
                mesh = new THREE.Mesh(geo, i === 2 ? leaf : warm);
                mesh.position.set(
                    i ? crown * 0.45 * (i === 1 ? 1 : -0.8) * (a - 0.3) : 0,
                    lift + crown * (i ? 0.55 + i * 0.12 : 0.25),
                    i ? crown * 0.42 * (i === 1 ? -0.6 : 1) * (b - 0.2) : 0
                );
                mesh.castShadow = true;
                crownAt.add(mesh);
            }
        } else {
            // A broadleaf: two blobs, the second shouldered off the first.
            for (i = 0; i < 2; i++) {
                geo = new THREE.IcosahedronGeometry(crown * (1 - i * 0.28), 0);
                geo.scale(1, 0.82, 1);
                mesh = new THREE.Mesh(geo, leaf);
                mesh.position.set(
                    i ? crown * (b - 0.5) * 0.7 : 0,
                    lift + crown * (i ? 0.62 : 0.1),
                    i ? crown * (a - 0.5) * 0.7 : 0
                );
                mesh.rotation.y = a * 6.283;
                mesh.castShadow = true;
                crownAt.add(mesh);
            }
        }
        /* A tree in a thicket (courses.forest `still`) is one of a hundred,
           and a hundred crowns each swaying on a pivot are three hundred draw
           calls. So its crown stands still and is drawn with every other
           thing that stands still (stand): in a wood that dense nobody is
           watching one tree move. */
        if (wall.still && R.standing) {
            crownAt.children.slice().forEach(function (m) {
                stand(group, m.geometry, m.material,
                    crownAt.position.x + m.position.x, crownAt.position.y + m.position.y,
                    crownAt.position.z + m.position.z, m.rotation.x, m.rotation.y, m.rotation.z);
            });
            group.remove(crownAt);
            return;
        }
        // Conifers are stiffer than broadleaves, and every tree has a beat of
        // its own, off where it stands.
        (R.canopies || (R.canopies = [])).push({ g: crownAt, k: a < 0.5 ? 0.035 : 0.055, ph: (a + b) * 9.7 });
    }

    /* The wind in the trees: each crown leans downwind by however hard it is
       blowing, and rocks on top of that at a rate the gusts set — the same
       wind vector the grass and the flag read, so the three agree about which
       way it is going. A still day is a breath of movement and no more. */
    function swayTrees(wind) {
        var i, c, rock, t = R.clock;
        for (i = 0; i < R.canopies.length; i++) {
            c = R.canopies[i];
            rock = 0.65 + 0.35 * Math.sin(t * (1.1 + wind.speed * 1.4) + c.ph);
            c.g.rotation.x = wind.z * c.k * rock + Math.sin(t * 0.8 + c.ph) * 0.006;
            c.g.rotation.z = -wind.x * c.k * rock + Math.cos(t * 0.7 + c.ph) * 0.006;
        }
    }

    /* A rock.

       Solid all the way up, unlike a tree — courses.js says why — so the three
       lumps drawn here are the three lumps the ball bounces off, near enough
       that nothing about it reads as a lie. Every dimension comes out of where
       it stands, through the same hash a canopy uses, so an outcrop of five is
       five different stones and it is the same five on every load. */
    function addRock(group, wall) {
        var B = P.wallBox(wall, 0);
        var a = treeHash(B.cx * 1.31, B.cz), b = treeHash(B.cz, B.cx * 2.07);
        var s = Math.max(B.hw, B.hd), i, mesh, geo, f;
        for (i = 0; i < 3; i++) {
            f = 1 - i * 0.32;
            geo = new THREE.IcosahedronGeometry(s * f * (0.9 + a * 0.5), 0);
            geo.scale(1, 0.72 + b * 0.45, 1);
            stand(group, geo, R.surf.walls.rock,
                B.cx + (i ? s * (a - 0.42) * (i === 1 ? 1.3 : -1.2) : 0),
                B.base + wall.h * (i ? 0.24 : 0.46),
                B.cz + (i ? s * (b - 0.42) * (i === 1 ? -1.2 : 1.3) : 0),
                a * 6.283, (a + b) * 3.141, b * 6.283);
        }
    }

    /* Visual decor: props drawn to dress the hole. They are non-solid and have
       no presence in physics.js. Geometries are disposed cleanly by disposeGroup. */
    var PROP_SCALE = { barrel: 0.45, crate: 0.45, palm: 0.75, pine: 1.8, sign: 2.2, windmill: 1.8 };

    /* The mountain's own (Alpenglow Pass): a timber chalet, a cairn, a
       chairlift on its cable and a waterfall off a cliff band. None of them
       is solid — decor never is — so each stands where nothing is played
       through it, and each reads the ground it stands on rather than being
       told a height: the lift's towers find the hillside under each one and
       a waterfall finds the water (or the ground) at its own foot. */
    var _fallTex = null;
    function fallTexture() {
        if (_fallTex) return _fallTex;
        var c = document.createElement('canvas'), g, i, x;
        c.width = 64; c.height = 128;
        g = c.getContext('2d');
        g.fillStyle = 'rgba(214,240,240,0.55)';
        g.fillRect(0, 0, 64, 128);
        for (i = 0; i < 46; i++) {
            x = (i * 37) % 64;
            g.fillStyle = 'rgba(255,255,255,' + (0.25 + ((i * 13) % 7) / 10) + ')';
            g.fillRect(x, ((i * 53) % 128) - 40, 1 + (i % 3), 50 + (i * 29) % 70);
        }
        _fallTex = new THREE.CanvasTexture(c);
        _fallTex.wrapS = _fallTex.wrapT = THREE.RepeatWrapping;
        return _fallTex;
    }
    function groundUnder(hole, theme, wx, wz) {
        var w = hole && P.waterAt ? P.waterAt(hole, wx, wz) : null;
        var g = hole && P.surfaceTop ? P.surfaceTop(hole, wx, wz) : null;
        if (w && (!g || w.y > g.y)) return w.y;
        if (g) return g.y;
        return theme && theme.surroundY !== undefined ? theme.surroundY : 0;
    }
    function addAlpineProp(dg, d, kind, hole, theme) {
        var surf = R.surf.decor, stone = R.surf.walls.rock, m, i, k;
        function box(w, h, dd, mat, x, y, z) {
            var b = new THREE.Mesh(new THREE.BoxGeometry(w, h, dd), mat);
            b.position.set(x, y, z);
            b.castShadow = true;
            b.receiveShadow = true;
            dg.add(b);
            return b;
        }
        if (kind === 'chalet') {
            // White plaster below, dark timber above, a long low gable roof
            // and a balcony across the front.
            box(4.2, 1.5, 3.0, surf.buoyWhite, 0, 0.55, 0);
            box(4.2, 1.3, 3.0, surf.wood, 0, 1.95, 0);
            for (k = -1; k <= 1; k += 2) {
                m = box(4.8, 0.14, 2.2, surf.metalDark, 0, 3.05, k * 0.86);
                m.rotation.x = k * 0.62;
            }
            box(4.4, 0.08, 0.7, surf.woodPale, 0, 1.4, 1.78);
            box(4.4, 0.4, 0.06, surf.woodPale, 0, 1.62, 2.12);
            box(0.45, 0.9, 0.45, stone, 1.3, 3.3, -0.4);
            for (i = -1; i <= 1; i++) box(0.5, 0.55, 0.05, surf.binBody, i * 1.3, 0.75, 1.52);
        } else if (kind === 'cairn') {
            for (i = 0; i < 4; i++) {
                var sg = new THREE.DodecahedronGeometry(0.42 - i * 0.08, 0);
                sg.scale(1, 0.55, 1);
                m = new THREE.Mesh(sg, stone);
                m.position.set((i % 2 ? 0.05 : -0.04), 0.18 + i * 0.36, (i % 3 ? -0.04 : 0.05));
                m.rotation.y = i * 1.3;
                m.castShadow = true;
                dg.add(m);
            }
        } else if (kind === 'lift') {
            /* Towers every ten units along `yaw` for `w`, each standing on
               whatever ground is under it, a pair of cables strung between
               their heads and a chair on them every few units. */
            var len = d.w || 40, span = 10, n = Math.max(1, Math.round(len / span)), tops = [];
            var sy = Math.sin(d.yaw || 0), cy = Math.cos(d.yaw || 0);
            for (i = 0; i <= n; i++) {
                var lz = i * len / n;
                var gy = groundUnder(hole, theme, d.x + sy * lz, d.z + cy * lz) - dg.position.y;
                var top = gy + 6.2;
                box(0.32, top - gy, 0.32, surf.metalDark, 0, (top + gy) / 2, lz);
                box(2.0, 0.16, 0.24, surf.metalDark, 0, top, lz);
                tops.push(new THREE.Vector3(0, top, lz));
            }
            for (k = -1; k <= 1; k += 2) {
                for (i = 0; i < n; i++) {
                    var a = tops[i].clone(), b = tops[i + 1].clone(), seg = b.clone().sub(a);
                    var cab = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, seg.length(), 4), surf.metalDark);
                    cab.position.set(k * 0.9, (a.y + b.y) / 2 - 0.15, (a.z + b.z) / 2);
                    cab.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), seg.normalize());
                    dg.add(cab);
                    for (var t = 0.25; t < 1; t += 0.5) {
                        var cz = a.z + (b.z - a.z) * t, cyy = a.y + (b.y - a.y) * t - 0.15;
                        box(0.03, 1.0, 0.03, surf.metalDark, k * 0.9, cyy - 0.5, cz);
                        box(0.7, 0.08, 0.5, k < 0 ? surf.buoyRed : surf.boatHull, k * 0.9, cyy - 1.0, cz);
                        box(0.7, 0.45, 0.06, k < 0 ? surf.buoyRed : surf.boatHull, k * 0.9, cyy - 0.8, cz - 0.24);
                    }
                }
            }
        } else if (kind === 'waterfall') {
            // A sheet of falling water from the lip it is placed on down to
            // whatever is at its foot, and the spray where it lands.
            var foot = groundUnder(hole, theme, d.x + Math.sin(d.yaw || 0) * 0.9, d.z + Math.cos(d.yaw || 0) * 0.9);
            var drop = Math.max(0.5, dg.position.y - foot), wide = d.w || 1.6;
            var tex = fallTexture().clone();
            tex.needsUpdate = true;
            tex.repeat.set(Math.max(1, wide / 1.2), Math.max(1, drop / 2.5));
            var sheet = new THREE.Mesh(new THREE.PlaneGeometry(wide, drop, 1, 4), new THREE.MeshBasicMaterial({
                map: tex, transparent: true, depthWrite: false, side: THREE.DoubleSide, color: 0xeaf8f6
            }));
            var sp = sheet.geometry.attributes.position;
            for (i = 0; i < sp.count; i++) {
                // Out over the lip at the top and plumb below it.
                var f = 0.5 - sp.getY(i) / drop;
                sp.setZ(i, 0.55 * (1 - f) * (1 - f) + 0.2);
            }
            sheet.position.set(0, -drop / 2, 0.15);
            dg.add(sheet);
            var mist = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.35, depthWrite: false });
            for (i = 0; i < 5; i++) {
                m = new THREE.Mesh(new THREE.IcosahedronGeometry(0.45 + (i % 3) * 0.2, 1), mist);
                m.position.set((i - 2) * wide * 0.22, -drop + 0.25, 0.6 + (i % 2) * 0.3);
                dg.add(m);
            }
        }
    }

    function addDecor(group, item, theme, hole) {
        var d = item || {};
        var kind = d.kind;
        var x = d.x, y = d.y, z = d.z;
        if (!d.explicitY && hole) {
            var isAquatic = (kind === 'buoy' || kind === 'piling' || kind === 'boat' || kind === 'rowboat' || kind === 'sailboat');
            var w = P.waterAt ? P.waterAt(hole, x, z) : null;
            var surfTop = P.surfaceTop ? P.surfaceTop(hole, x, z) : null;
            if (isAquatic) {
                if (w) y = w.y;
                else if (theme && theme.surroundY !== undefined) y = theme.surroundY;
                else if (surfTop) y = surfTop.y;
            } else {
                if (surfTop) y = surfTop.y;
                else if (w) y = w.y;
                else if (theme && theme.surroundY !== undefined) y = theme.surroundY;
            }
        }
        var s = d.scale || 1;
        var yaw = d.yaw || 0;
        var dg = new THREE.Group();
        dg.position.set(x, y, z);
        dg.rotation.y = yaw;
        if (d.pitch) dg.rotation.x = d.pitch;
        if (d.roll) dg.rotation.z = d.roll;
        if (s !== 1) dg.scale.set(s, s, s);

        var surf = R.surf.decor;
        if (!surf) return;

        if (kind === 'buoy') {
            // A floating nautical can/marker buoy.
            var keelGeo = new THREE.CylinderGeometry(0.12, 0.05, 0.35, 7);
            var keel = new THREE.Mesh(keelGeo, surf.metalDark);
            keel.position.y = -0.22;
            dg.add(keel);

            var floatGeo = new THREE.CylinderGeometry(0.28, 0.24, 0.38, 8);
            var floatMesh = new THREE.Mesh(floatGeo, d.variant === 1 ? surf.buoyYellow : surf.buoyRed);
            floatMesh.position.y = 0.12;
            floatMesh.castShadow = true;
            dg.add(floatMesh);

            var bandGeo = new THREE.CylinderGeometry(0.29, 0.29, 0.12, 8);
            var band = new THREE.Mesh(bandGeo, surf.buoyWhite);
            band.position.y = 0.15;
            dg.add(band);

            var topGeo = new THREE.ConeGeometry(0.18, 0.42, 8);
            var topMesh = new THREE.Mesh(topGeo, d.variant === 1 ? surf.buoyYellow : surf.buoyRed);
            topMesh.position.y = 0.48;
            topMesh.castShadow = true;
            dg.add(topMesh);

            var lampGeo = new THREE.SphereGeometry(0.06, 6, 6);
            var lamp = new THREE.Mesh(lampGeo, surf.buoyWhite);
            lamp.position.y = 0.72;
            dg.add(lamp);

            dg.rotation.z += 0.08;
            dg.rotation.x -= 0.05;
        } else if (kind === 'piling') {
            // A cluster of 3 timber mooring pilings with rope lashing.
            var p1 = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 1.8, 7), surf.wood);
            p1.position.set(0, 0.5, 0);
            p1.rotation.y = 0.3;
            p1.castShadow = true;
            p1.receiveShadow = true;
            dg.add(p1);

            var p2 = new THREE.Mesh(new THREE.CylinderGeometry(0.10, 0.12, 1.5, 7), surf.wood);
            p2.position.set(-0.16, 0.35, 0.12);
            p2.rotation.z = -0.04;
            p2.castShadow = true;
            p2.receiveShadow = true;
            dg.add(p2);

            var p3 = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.11, 1.3, 7), surf.wood);
            p3.position.set(0.14, 0.25, -0.10);
            p3.rotation.x = 0.05;
            p3.castShadow = true;
            p3.receiveShadow = true;
            dg.add(p3);

            var rope = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.04, 5, 10), surf.rope);
            rope.position.set(0, 0.82, 0);
            rope.rotation.x = Math.PI / 2;
            dg.add(rope);
        } else if (kind === 'bench') {
            // Outdoor slatted park bench.
            var legMat = surf.metalDark;
            var woodMat = surf.woodPale;
            var legGeo = new THREE.BoxGeometry(0.06, 0.44, 0.42);
            var leftLeg = new THREE.Mesh(legGeo, legMat);
            leftLeg.position.set(-0.48, 0.22, 0);
            leftLeg.castShadow = true;
            dg.add(leftLeg);

            var rightLeg = new THREE.Mesh(legGeo, legMat);
            rightLeg.position.set(0.48, 0.22, 0);
            rightLeg.castShadow = true;
            dg.add(rightLeg);

            var i;
            for (i = -1; i <= 1; i++) {
                var slat = new THREE.Mesh(new THREE.BoxGeometry(1.12, 0.035, 0.09), woodMat);
                slat.position.set(0, 0.44, i * 0.12);
                slat.castShadow = true;
                dg.add(slat);
            }

            var backSupportGeo = new THREE.BoxGeometry(0.05, 0.40, 0.05);
            var bs1 = new THREE.Mesh(backSupportGeo, legMat);
            bs1.position.set(-0.48, 0.60, -0.19);
            bs1.rotation.x = -0.15;
            dg.add(bs1);

            var bs2 = new THREE.Mesh(backSupportGeo, legMat);
            bs2.position.set(0.48, 0.60, -0.19);
            bs2.rotation.x = -0.15;
            dg.add(bs2);

            for (i = 0; i < 2; i++) {
                var backSlat = new THREE.Mesh(new THREE.BoxGeometry(1.12, 0.09, 0.03), woodMat);
                backSlat.position.set(0, 0.54 + i * 0.14, -0.18 - i * 0.02);
                backSlat.rotation.x = -0.15;
                backSlat.castShadow = true;
                dg.add(backSlat);
            }
        } else if (kind === 'boat' || kind === 'rowboat') {
            // Authentic 3D wooden rowboat or dinghy (CC0 Kenney Watercraft Kit).
            var modelName = (d.variant === 1) ? 'dinghy' : 'rowboat';
            var mesh = G3.getModelMesh ? G3.getModelMesh(modelName, surf.model) : null;
            if (mesh) {
                mesh.position.y = -0.12;
                mesh.scale.set(0.85, 0.85, 0.85);
                dg.add(mesh);
            }
            dg.rotation.z += 0.03;
            dg.rotation.x -= 0.02;
        } else if (kind === 'sailboat') {
            // Elegant single-masted coastal sailboat (CC0 Kenney Watercraft Kit).
            var sMesh = G3.getModelMesh ? G3.getModelMesh('sailboat', surf.model) : null;
            if (sMesh) {
                sMesh.position.y = -0.18;
                sMesh.scale.set(0.75, 0.75, 0.75);
                dg.add(sMesh);
            }
            dg.rotation.z += 0.02;
            dg.rotation.x -= 0.01;
        } else if (kind === 'skyline' || kind === 'cabinet' || kind === 'marquee' || kind === 'lamp' ||
                   kind === 'jukebox' || kind === 'claw' || kind === 'fruit') {
            addArcadeProp(dg, d, kind);
        } else if (kind === 'chalet' || kind === 'cairn' || kind === 'lift' || kind === 'waterfall') {
            addAlpineProp(dg, d, kind, hole, theme);
        } else if (PROP_SCALE[kind]) {
            // Land props from the CC0 kits: barrel, crate, palm, pine, sign, windmill.
            var pMesh = G3.getModelMesh ? G3.getModelMesh(kind, surf.model) : null;
            if (pMesh) {
                var ps = PROP_SCALE[kind];
                pMesh.scale.set(ps, ps, ps);
                dg.add(pMesh);
            }
        } else if (kind === 'bin') {
            // Park / course waste receptacle
            var binGeo = new THREE.CylinderGeometry(0.20, 0.18, 0.58, 8);
            var binMesh = new THREE.Mesh(binGeo, surf.binBody);
            binMesh.position.y = 0.29;
            binMesh.castShadow = true;
            dg.add(binMesh);

            var lidGeo = new THREE.CylinderGeometry(0.22, 0.22, 0.06, 8);
            var lid = new THREE.Mesh(lidGeo, surf.metalDark);
            lid.position.y = 0.60;
            dg.add(lid);
        }

        group.add(dg);
        /* Anything floating rides the water rather than standing on it: it
           rises and falls and rolls a little, each at a rate of its own. A
           piling is driven into the bottom and stays put. */
        if (kind === 'buoy' || kind === 'boat' || kind === 'rowboat' || kind === 'sailboat') {
            (R.bobbers || (R.bobbers = [])).push({
                g: dg, y: dg.position.y, rx: dg.rotation.x, rz: dg.rotation.z,
                ph: (x * 1.7 + z * 2.3) % 6.283, k: kind === 'buoy' ? 1.6 : 1
            });
        }
    }

    /* ── the arcade's dressings (courses.skyline, cabinet, marquee, lamp) ──

       All four are self-lit (MeshBasicMaterial): the parlour is a basement at
       night and what you see of a city or a cabinet in the dark is its
       lights. The windows and the screen are one small canvas each, drawn
       once and shared, so a skyline of a dozen towers is a dozen boxes and
       one texture. Nothing here is solid — decor never is (courses.decor). */
    var _arcadeTex = {};
    function arcadeTex(name) {
        if (_arcadeTex[name]) return _arcadeTex[name];
        var cv = document.createElement('canvas'), g2, i, j, rnd = seededRandom(name.length * 97 + 13);
        if (name === 'windows') {
            cv.width = 64; cv.height = 64;
            g2 = cv.getContext('2d');
            g2.fillStyle = '#120a1f'; g2.fillRect(0, 0, 64, 64);
            var lit = ['#ffd58a', '#ffe9b8', '#7fe8ff', '#ff8fd0'];
            for (i = 0; i < 4; i++) for (j = 0; j < 8; j++) {
                var r = rnd();
                g2.fillStyle = r < 0.42 ? '#241736' : lit[Math.floor(rnd() * lit.length)];
                g2.fillRect(i * 16 + 4, j * 8 + 2, 8, 4);
            }
        } else if (name === 'screen') {
            cv.width = 64; cv.height = 64;
            g2 = cv.getContext('2d');
            var gr = g2.createLinearGradient(0, 0, 0, 64);
            gr.addColorStop(0, '#1b0e3d'); gr.addColorStop(1, '#3a1260');
            g2.fillStyle = gr; g2.fillRect(0, 0, 64, 64);
            g2.fillStyle = '#ff4fa3'; g2.fillRect(8, 40, 48, 3);
            for (i = 0; i < 6; i++) { g2.fillStyle = i % 2 ? '#3ee0ff' : '#ffd23f'; g2.fillRect(10 + i * 8, 14 + (i % 3) * 6, 5, 5); }
        } else if (name === 'reels') {
            cv.width = 192; cv.height = 64;
            g2 = cv.getContext('2d');
            for (i = 0; i < 3; i++) {
                g2.fillStyle = '#fbf6ea'; g2.fillRect(i * 64 + 4, 2, 56, 60);
                g2.fillStyle = '#d8283a'; g2.font = 'bold 48px sans-serif';
                g2.textAlign = 'center'; g2.textBaseline = 'middle';
                g2.fillText('7', i * 64 + 32, 34);
            }
        } else {
            // A marquee's words, in neon: the glow is the canvas's own shadow.
            cv.width = 512; cv.height = 96;
            g2 = cv.getContext('2d');
            g2.fillStyle = '#0d0618'; g2.fillRect(0, 0, 512, 96);
            g2.font = 'bold 62px sans-serif'; g2.textAlign = 'center'; g2.textBaseline = 'middle';
            g2.shadowColor = '#ff4fa3'; g2.shadowBlur = 18;
            g2.fillStyle = '#ffd1ec'; g2.fillText(name.slice(5), 256, 50);
            g2.strokeStyle = '#3ee0ff'; g2.lineWidth = 4; g2.shadowColor = '#3ee0ff';
            g2.strokeRect(8, 8, 496, 80);
        }
        var tex = new THREE.CanvasTexture(cv);
        if (name === 'windows') { tex.wrapS = tex.wrapT = THREE.RepeatWrapping; }
        _arcadeTex[name] = tex;
        return tex;
    }

    function seededRandom(seed) {
        var s = (seed % 2147483647 + 2147483647) % 2147483647 || 1;
        return function () { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
    }

    var ARCADE_HUES = [0xff4fa3, 0x3ee0ff, 0xffd23f, 0x9b6bff];

    function addArcadeProp(dg, d, kind) {
        var m, geo, i, rnd = seededRandom(Math.round(d.x * 131 + d.z * 977) + 7);
        if (kind === 'skyline') {
            /* Towers along local x, d.w long, standing on the floor. The window
               texture is repeated by each face's own size so a tall tower has
               more floors rather than taller windows. */
            var len = d.w || 8, x0 = -len / 2, roof = new THREE.MeshBasicMaterial({ color: 0x150c22 });
            var tallest = null, tH = 0;
            while (x0 < len / 2 - 0.4) {
                var bw = 0.7 + rnd() * 0.7, bd = 0.8 + rnd() * 0.8, bh = 2.4 + rnd() * 4.6;
                geo = new THREE.BoxGeometry(bw, bh, bd);
                var uv = geo.attributes.uv;
                for (i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * bw * 1.4, uv.getY(i) * bh * 0.9);
                var win = new THREE.MeshBasicMaterial({ map: arcadeTex('windows') });
                m = new THREE.Mesh(geo, [win, win, roof, roof, win, win]);
                m.position.set(x0 + bw / 2, bh / 2, (rnd() - 0.5) * 0.8);
                dg.add(m);
                if (bh > tH) { tH = bh; tallest = m; }
                x0 += bw + 0.08 + rnd() * 0.25;
            }
            if (tallest) {
                // A red light on the tallest roof, blinking (glowPosts).
                var beacon = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 6),
                    new THREE.MeshBasicMaterial({ color: 0xff3344 }));
                beacon.position.set(tallest.position.x, tH + 0.12, tallest.position.z);
                dg.add(beacon);
                (R.lamps || (R.lamps = [])).push({ mesh: beacon, k: -1, blink: true });
            }
        } else if (kind === 'cabinet') {
            /* An upright, by its side profile: the classic cabinet outline —
               kick plate, control panel jutting out, the screen set back
               under the marquee's overhang — extruded across its width, with
               a neon line round both sides so it reads as a machine from
               behind as well as from in front. A box with a screen on it read
               as a box. */
            var hue = ARCADE_HUES[d.variant % ARCADE_HUES.length];
            var shell = new THREE.MeshLambertMaterial({ color: new THREE.Color(hue).multiplyScalar(0.3) });
            var side = new THREE.Shape(), prof = [
                [0.36, 0], [0.36, 0.86], [0.56, 0.98], [0.5, 1.06], [0.22, 1.12],
                [0.3, 1.78], [0.46, 1.84], [0.46, 2.1], [-0.4, 2.1], [-0.4, 0]
            ];
            side.moveTo(prof[0][0], prof[0][1]);
            for (i = 1; i < prof.length; i++) side.lineTo(prof[i][0], prof[i][1]);
            side.closePath();
            geo = new THREE.ExtrudeGeometry(side, { depth: 0.86, bevelEnabled: false });
            geo.rotateY(-Math.PI / 2);            // profile in (z, y), extruded along x
            geo.translate(0.43, 0, 0);
            m = new THREE.Mesh(geo, shell);
            m.castShadow = true;
            dg.add(m);
            var trim = new THREE.LineBasicMaterial({ color: hue });
            [-0.435, 0.435].forEach(function (sx) {
                var pts = prof.concat([prof[0]]).map(function (q) { return new THREE.Vector3(sx, q[1], q[0]); });
                dg.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), trim));
            });
            // The screen, lying in the recess between the panel and the hood.
            m = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.62), new THREE.MeshBasicMaterial({ map: arcadeTex('screen') }));
            m.position.set(0, 1.45, 0.27); m.rotation.x = -0.12; dg.add(m);
            m = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.22), new THREE.MeshBasicMaterial({ color: hue }));
            m.position.set(0, 1.97, 0.465); dg.add(m);
            for (i = 0; i < 3; i++) {
                m = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.04, 10),
                    new THREE.MeshBasicMaterial({ color: ARCADE_HUES[(d.variant + i + 1) % ARCADE_HUES.length] }));
                m.position.set(-0.2 + i * 0.2, 1.03, 0.44); m.rotation.x = 0.55; dg.add(m);
            }
            // And the light it throws on the floor in front of it.
            m = new THREE.Mesh(new THREE.CircleGeometry(0.9, 24), new THREE.MeshBasicMaterial({
                color: hue, transparent: true, opacity: 0.18, blending: THREE.AdditiveBlending, depthWrite: false
            }));
            m.rotation.x = -Math.PI / 2; m.position.set(0, 0.02, 0.7); dg.add(m);
        } else if (kind === 'jukebox') {
            /* A jukebox: a cabinet with a round head, a lit arch over the
               front and a row of coloured tubes standing in the grille. */
            var jh = ARCADE_HUES[d.variant % ARCADE_HUES.length];
            var wood = new THREE.MeshLambertMaterial({ color: 0x3a1f2e });
            m = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.15, 0.62), wood);
            m.position.y = 0.575; m.castShadow = true; dg.add(m);
            m = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.62, 24, 1, false, -Math.PI / 2, Math.PI), wood);
            m.rotation.x = Math.PI / 2; m.rotation.z = Math.PI / 2; m.position.y = 1.15; dg.add(m);
            m = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.05, 8, 24, Math.PI), new THREE.MeshBasicMaterial({ color: jh }));
            m.position.set(0, 1.15, 0.32); dg.add(m);
            for (i = 0; i < 5; i++) {
                m = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.62, 8),
                    new THREE.MeshBasicMaterial({ color: ARCADE_HUES[(d.variant + i) % ARCADE_HUES.length] }));
                m.position.set(-0.3 + i * 0.15, 0.62, 0.32); dg.add(m);
            }
            m = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.3), new THREE.MeshBasicMaterial({ map: arcadeTex('screen') }));
            m.position.set(0, 1.12, 0.315); dg.add(m);
        } else if (kind === 'claw') {
            /* A claw machine: a lit base, a glass case with prizes heaped in
               it and the claw hanging over them, and a sign on the roof. */
            var ch = ARCADE_HUES[d.variant % ARCADE_HUES.length];
            var baseMat = new THREE.MeshLambertMaterial({ color: new THREE.Color(ch).multiplyScalar(0.45) });
            m = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.85, 1.0), baseMat);
            m.position.y = 0.425; m.castShadow = true; dg.add(m);
            m = new THREE.Mesh(new THREE.BoxGeometry(0.96, 1.0, 0.96), new THREE.MeshPhongMaterial({
                color: 0xbfe8ff, transparent: true, opacity: 0.22, shininess: 120, specular: 0xffffff, depthWrite: false
            }));
            m.position.y = 1.35; dg.add(m);
            for (i = 0; i < 7; i++) {
                m = new THREE.Mesh(new THREE.SphereGeometry(0.11 + rnd() * 0.05, 10, 8),
                    new THREE.MeshLambertMaterial({ color: ARCADE_HUES[i % ARCADE_HUES.length] }));
                m.position.set((rnd() - 0.5) * 0.65, 0.95 + rnd() * 0.12, (rnd() - 0.5) * 0.65); dg.add(m);
            }
            m = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.5, 6), R.surf.decor.metalDark);
            m.position.set(0.1, 1.6, 0); dg.add(m);
            m = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.16, 6, 1, true), R.surf.chrome || R.surf.decor.metalDark);
            m.position.set(0.1, 1.3, 0); m.rotation.x = Math.PI; dg.add(m);
            m = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.22, 1.0), new THREE.MeshBasicMaterial({ color: ch }));
            m.position.y = 1.96; dg.add(m);
        } else if (kind === 'fruit') {
            /* A fruit machine: three reels showing sevens behind a window, a
               lit crown, and the lever down the right-hand side. */
            var fh = ARCADE_HUES[d.variant % ARCADE_HUES.length];
            var fbody = new THREE.MeshLambertMaterial({ color: new THREE.Color(fh).multiplyScalar(0.4) });
            m = new THREE.Mesh(new THREE.BoxGeometry(0.85, 1.7, 0.62), fbody);
            m.position.y = 0.85; m.castShadow = true; dg.add(m);
            m = new THREE.Mesh(new THREE.PlaneGeometry(0.66, 0.3), new THREE.MeshBasicMaterial({ map: arcadeTex('reels') }));
            m.position.set(0, 1.2, 0.315); dg.add(m);
            m = new THREE.Mesh(new THREE.BoxGeometry(0.87, 0.24, 0.64), new THREE.MeshBasicMaterial({ color: fh }));
            m.position.y = 1.82; dg.add(m);
            m = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.55, 8), R.surf.chrome || R.surf.decor.metalDark);
            m.position.set(0.5, 1.25, 0.05); dg.add(m);
            m = new THREE.Mesh(new THREE.SphereGeometry(0.08, 12, 10), new THREE.MeshBasicMaterial({ color: 0xff3344 }));
            m.position.set(0.5, 1.55, 0.05); dg.add(m);
        } else if (kind === 'marquee') {
            var mw = d.w || 4;
            var sign = new THREE.Mesh(new THREE.PlaneGeometry(mw, mw * 96 / 512),
                new THREE.MeshBasicMaterial({ map: arcadeTex('text:' + (d.text || 'ARCADE')), side: THREE.DoubleSide }));
            // Faces -z, back down the table to whoever is reading it.
            sign.position.y = 2.6; sign.rotation.y = Math.PI; dg.add(sign);
            for (i = -1; i <= 1; i += 2) {
                m = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 2.6, 6), R.surf.decor.metalDark);
                m.position.set(i * mw * 0.4, 1.3, -0.03); dg.add(m);
            }
        } else {
            // A lamp in the baize: a round insert, or an arrow along +z.
            var col = ARCADE_HUES[d.variant >> 1 & 3], shape;
            if (d.variant & 1) {
                shape = new THREE.Shape();
                shape.moveTo(0, 0.26); shape.lineTo(0.17, -0.12); shape.lineTo(0, -0.04); shape.lineTo(-0.17, -0.12);
                shape.closePath();
                geo = new THREE.ShapeGeometry(shape);
            } else {
                geo = new THREE.CircleGeometry(0.13, 20);
            }
            var lampMat = new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.5, depthWrite: false });
            m = new THREE.Mesh(geo, lampMat);
            m.rotation.x = -Math.PI / 2;
            if (d.variant & 1) m.rotation.z = Math.PI;      // +z after the lay-down
            // Over the baize's blades rather than under them (SHELL_HEIGHT).
            m.position.y = SHELL_HEIGHT.green + 0.01;
            dg.add(m);
            var lamps = R.lamps || (R.lamps = []);
            lamps.push({ mesh: m, k: lamps.filter(function (l) { return !l.blink; }).length });
        }
    }

    // The floating decor, on the same clock as the waves and a little rougher
    // when the wind is up.
    function bobDecor(wind) {
        var i, b, t = R.clock, sea = 1 + Math.min(1.5, wind.speed);
        for (i = 0; i < (R.bobbers || []).length; i++) {
            b = R.bobbers[i];
            b.g.position.y = b.y + Math.sin(t * 1.3 + b.ph) * 0.05 * sea;
            b.g.rotation.x = b.rx + Math.sin(t * 1.1 + b.ph * 1.3) * 0.05 * b.k * sea;
            b.g.rotation.z = b.rz + Math.cos(t * 0.9 + b.ph) * 0.06 * b.k * sea;
        }
    }

    /* A pop bumper and a rubber post, drawn as the round things they are
       (physics.isPost) rather than as the box the solver used to meet.

       A bumper is built the way a real one is, from the table up: a dark
       base flush with the baize, a pale body, the chrome ring that is the part
       that fires, and a coloured cap with a lamp in it. The caps take turns
       through three colours down the list so a table of them reads as a
       table of them, and each has a material of its own so it can light on
       its own: `R.bumped` (called by the game off `events.bumped`) fires the
       flash, a pool of light opens on the baize under it, and both fade over
       a quarter of a second in `glowPosts`. Between hits the caps breathe a
       little, out of step with each other — a pinball table is never dark.

       A post is a chrome peg with a black rubber ring round it at the height
       of the ball's middle, which is where the ball meets it. */
    var POST_CAPS = [0xff4fa3, 0x3ee0ff, 0xffd23f];
    function addPost(group, wall) {
        // Measured from the ground it stands on: courses.bumper sinks the
        // solid a tenth below the baize, so that is where the table is.
        var r = wall.w / 2, base = 0, top = wall.h - 0.1;
        var g = new THREE.Group(), mesh, k = (R.posts || (R.posts = [])).length;
        g.position.set(wall.x + r, (wall.base || 0) + 0.1, wall.z + wall.d / 2);
        function part(geo, mat, y) {
            var m = new THREE.Mesh(geo, mat);
            m.position.y = y;
            m.castShadow = true;
            m.receiveShadow = true;
            g.add(m);
            return m;
        }
        var chrome = R.surf.chrome || (R.surf.chrome = new THREE.MeshPhongMaterial({
            color: 0xc9d2da, shininess: 140, specular: 0xffffff
        }));
        if (wall.kind === 'post') {
            var rubber = R.surf.rubber || (R.surf.rubber = new THREE.MeshLambertMaterial({ color: 0x17151c }));
            part(new THREE.CylinderGeometry(r * 0.42, r * 0.48, top - base, 14), chrome, base + (top - base) / 2);
            mesh = part(new THREE.TorusGeometry(r * 0.74, r * 0.26, 8, 22), rubber, C.BALL_R);
            mesh.rotation.x = Math.PI / 2;
            part(new THREE.CylinderGeometry(r * 0.56, r * 0.5, 0.05, 14), chrome, top);
            group.add(g);
            return;
        }
        var colour = POST_CAPS[k % POST_CAPS.length];
        var lamp = new THREE.MeshPhongMaterial({
            color: new THREE.Color(colour).lerp(new THREE.Color(0xffffff), 0.35),
            emissive: new THREE.Color(colour), emissiveIntensity: 0.5,
            shininess: 90, specular: 0xffffff
        });
        var body = R.surf.postBody || (R.surf.postBody = new THREE.MeshPhongMaterial({
            color: 0xf1ecf4, shininess: 60, specular: 0x8a8a8a
        }));
        part(new THREE.CylinderGeometry(r * 1.08, r * 1.14, 0.06, 24), R.surf.decor.metalDark, 0.03);
        part(new THREE.CylinderGeometry(r * 0.86, r * 0.9, top - 0.14, 24), body, 0.06 + (top - 0.14) / 2);
        mesh = part(new THREE.TorusGeometry(r * 0.92, 0.035, 8, 28), chrome, C.BALL_R);
        mesh.rotation.x = Math.PI / 2;
        part(new THREE.CylinderGeometry(r * 1.0, r * 0.94, 0.1, 24), lamp, top - 0.03);
        part(new THREE.SphereGeometry(r * 0.62, 18, 8, 0, Math.PI * 2, 0, Math.PI / 2), lamp, top + 0.02);
        var pool = new THREE.Mesh(new THREE.CircleGeometry(r * 2.3, 28), new THREE.MeshBasicMaterial({
            color: colour, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false
        }));
        pool.rotation.x = -Math.PI / 2;
        pool.position.y = 0.012;
        g.add(pool);
        group.add(g);
        R.posts.push({ wall: wall, lamp: lamp, pool: pool, flash: 0, ph: k * 2.1 });
    }

    // The table answering a hit (game.js, off physics' events.bumped).
    R.bumped = function (wall) {
        for (var i = 0; i < (R.posts || []).length; i++) {
            if (R.posts[i].wall === wall) { R.posts[i].flash = 1; return; }
        }
    };

    function glowPosts(dt) {
        var i, p, t = R.clock || 0;
        for (i = 0; i < (R.posts || []).length; i++) {
            p = R.posts[i];
            p.flash = Math.max(0, p.flash - dt * 4);
            p.lamp.emissiveIntensity = 0.45 + 0.15 * Math.sin(t * 1.7 + p.ph) + p.flash * 1.6;
            p.pool.material.opacity = 0.08 + p.flash * 0.55;
        }
        /* The lamps chase: a wave runs down the list, each lit a beat after
           the one before it, the way the inserts on a table point at a shot. */
        for (i = 0; i < (R.lamps || []).length; i++) {
            p = R.lamps[i];
            if (p.blink) { p.mesh.visible = (t % 1.6) < 0.25; continue; }
            p.mesh.material.opacity = 0.35 + 0.65 * Math.pow(Math.max(0, Math.cos(t * 3.2 - p.k * 0.9)), 6);
        }
    }

    function addWall(group, wall) {
        if (wall.kind === 'tree') { addTree(group, wall); return; }
        if (wall.kind === 'rock' || wall.kind === 'meteor') { addRock(group, wall); return; }
        if (P.isPost(wall)) { addPost(group, wall); return; }
        // A slingshot is drawn whole off its face; its two backs are in it.
        // An unseen wall is the solid part of something drawn as
        // something else: a fir's needles (portals.js → fir), a cairn (courses.js).
        if (wall.kind === 'slingback' || wall.kind === 'unseen') return;
        if (wall.tri) { addSling(group, wall); return; }
        if (wall.sails) { addSails(group, wall); return; }
        if (wall.kind === 'train') { addTrain(group, wall); return; }
        var B = P.wallBox(wall, 0);
        if (wall.swing && wall.kind === 'blade') { addFlipper(group, wall, B); return; }
        var geo = new THREE.BoxGeometry(wall.w, wall.h, wall.d);
        // One material per kind, shared by every wall wearing it (see
        // buildSurfaces) — a hole has up to twenty rails and one coat of paint.
        // …and a wall that never moves is drawn with the rest of its kind.
        if (!(wall.move || wall.spin || wall.swing)) {
            stand(group, geo, R.surf.walls[wall.kind] || R.surf.walls.rail,
                B.cx, B.base + wall.h / 2, B.cz, 0, B.yaw, 0);
            return;
        }
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

    /* A car of a model train (portals.js → train): an engine — wheels, a
       boiler, a chimney, a dome, a cab and a lamp — or a coach with a row
       of lit windows down each side. It is the box the solver meets drawn
       as what it is, built in the box's own frame about its middle so it
       rides R.movers like any slider; the engine is turned to face the way
       its train runs. A train runs round and starts again at the far end of
       its run (physics.runOffset), which happens off the hole, and a car
       fades out over the last stretch of the run and in over the first, so
       the jump is never seen. Every car owns its materials, because its
       opacity is its own; none of them changes after it is built but that. */
    var TRAIN_LIVERY = [
        { engine: 0x1f5a3a, coach: 0x8c2a2e, trim: 0xc9a24a },
        { engine: 0x26428c, coach: 0xc08a2a, trim: 0xd9d2c0 }
    ];
    var TRAIN_FADE = 1.6;
    function addTrain(group, wall) {
        var L = wall.w, D = wall.d, H = wall.h, B = P.wallBox(wall, 0);
        var liv = TRAIN_LIVERY[wall.livery || 0] || TRAIN_LIVERY[0];
        var mats = [];
        function mat(o, lit) {
            o.transparent = true;
            var m = lit ? new THREE.MeshPhongMaterial(o) : new THREE.MeshLambertMaterial(o);
            mats.push(m);
            return m;
        }
        var paint = mat({ color: wall.car === 'engine' ? liv.engine : liv.coach, shininess: 60, specular: 0x444444 }, true);
        var black = mat({ color: 0x1a1a1e });
        var roof = mat({ color: 0x3a3a40 });
        var trim = mat({ color: liv.trim, shininess: 90, specular: 0x888888 }, true);
        var red = mat({ color: 0xb3262a });
        var glass = mat({ color: 0xffd98a, emissive: 0xffc861, emissiveIntensity: 0.9 }, true);
        var car = new THREE.Group(), body = new THREE.Group();
        var g = -H / 2 - (wall.base || 0);         // the ground, in the box's frame
        function box(w, h, d, m, x, y, z) {
            var o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
            o.position.set(x, y, z); o.castShadow = true; o.receiveShadow = true;
            body.add(o); return o;
        }
        function cyl(r0, r1, len, m, x, y, z, along) {
            var o = new THREE.Mesh(new THREE.CylinderGeometry(r0, r1, len, 16), m);
            if (along === 'x') o.rotation.z = Math.PI / 2;
            if (along === 'z') o.rotation.x = Math.PI / 2;
            o.position.set(x, y, z); o.castShadow = true;
            body.add(o); return o;
        }
        function wheels(xs, r) {
            xs.forEach(function (x) {
                [-1, 1].forEach(function (s) { cyl(r, r, 0.07, black, x, g + r, s * D * 0.4, 'z'); });
            });
        }
        // The frame and the buffers, both kinds.
        box(L - 0.06, 0.1, D * 0.82, black, 0, g + 0.27, 0);
        [-1, 1].forEach(function (e) {
            [-1, 1].forEach(function (s) { cyl(0.04, 0.04, 0.1, trim, e * (L / 2 - 0.02), g + 0.3, s * D * 0.28, 'x'); });
        });
        if (wall.car === 'engine') {
            var r = D * 0.27, x0 = -L * 0.12, x1 = L / 2 - 0.1, by = g + 0.32 + r;
            wheels([L * 0.28, L * 0.04, -L * 0.2], 0.17);
            wheels([L / 2 - 0.22], 0.1);
            cyl(r, r, x1 - x0, paint, (x0 + x1) / 2, by, 0, 'x');                   // the boiler
            cyl(r * 1.04, r * 1.04, 0.22, black, x1 - 0.06, by, 0, 'x');           // smokebox
            [0.3, 0.62].forEach(function (f) { cyl(r * 1.06, r * 1.06, 0.04, trim, x0 + (x1 - x0) * f, by, 0, 'x'); });
            cyl(0.08, 0.11, 0.34, black, x1 - 0.2, by + r + 0.14, 0);              // chimney
            cyl(0.12, 0.12, 0.04, black, x1 - 0.2, by + r + 0.31, 0);
            var dome = new THREE.Mesh(new THREE.SphereGeometry(0.11, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), trim);
            dome.position.set((x0 + x1) / 2, by + r - 0.02, 0); body.add(dome);
            var lamp = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 8), glass);
            lamp.position.set(L / 2 - 0.02, by + r * 0.4, 0); body.add(lamp);
            box(0.06, 0.12, D * 0.86, red, L / 2 - 0.03, g + 0.28, 0);              // buffer beam
            // The cab: walls, a window each side and to the front, a roof.
            var cx0 = -L / 2 + 0.06, cx1 = x0 + 0.06, cw = cx1 - cx0, ch = by + r + 0.2 - (g + 0.32);
            box(cw, ch, D * 0.84, paint, (cx0 + cx1) / 2, g + 0.32 + ch / 2, 0);
            [-1, 1].forEach(function (s) {
                box(cw * 0.5, ch * 0.3, 0.02, glass, (cx0 + cx1) / 2 + cw * 0.06, g + 0.32 + ch * 0.66, s * D * 0.425);
            });
            box(cw + 0.12, 0.06, D * 0.94, roof, (cx0 + cx1) / 2, g + 0.32 + ch + 0.03, 0);
        } else {
            var bh = H * 0.62, y0 = g + 0.33;
            wheels([L / 2 - 0.3, L / 2 - 0.55, -L / 2 + 0.3, -L / 2 + 0.55], 0.1);
            box(L - 0.12, bh, D * 0.82, paint, 0, y0 + bh / 2, 0);
            box(L - 0.12, 0.04, D * 0.835, trim, 0, y0 + bh * 0.42, 0);
            // A rounded roof: half a cylinder along the car, a little wider.
            var rg = new THREE.CylinderGeometry(D * 0.45, D * 0.45, L - 0.06, 16, 1, false, 0, Math.PI);
            rg.rotateZ(Math.PI / 2);               // its axis along the car, the half that is left on top
            rg.scale(1, 0.4, 1);
            var top = new THREE.Mesh(rg, roof);
            top.position.set(0, y0 + bh, 0);
            top.castShadow = true; body.add(top);
            var n = Math.max(2, Math.floor((L - 0.4) / 0.36)), k, step = (L - 0.4) / n;
            for (k = 0; k < n; k++) {
                [-1, 1].forEach(function (s) {
                    box(step * 0.62, bh * 0.32, 0.02, glass, -L / 2 + 0.2 + step * (k + 0.5), y0 + bh * 0.68, s * D * 0.415);
                });
            }
        }
        if ((wall.facing || 1) < 0) body.rotation.y = Math.PI;
        car.add(body);
        car.position.set(B.cx, B.base + H / 2, B.cz);
        group.add(car);
        R.movers.push({ mesh: car, wall: wall, h: H, fade: mats, seen: 1 });
        if (wall.track) addTrack(group, wall.track[0], wall.track[1], B.cz, B.base - (wall.base || 0), D);
    }

    /* The track a train runs on, across the ground it crosses (portals.js →
       train's `track`): two steel rails at the wheels' gauge on sleepers,
       drawn only — a ball rolls over a level crossing's rails. The Level
       Crossing's lane stands over the world's own track, which hid it, so
       its trains ran across bare turf (the owner, v1.225.0: "would be nicer
       if the rails were above the fairway"). */
    var trackMats = null;
    function addTrack(group, x0, x1, z, y, D) {
        if (!trackMats) trackMats = {
            rail: new THREE.MeshPhongMaterial({ color: 0x9aa0a8, shininess: 80, specular: 0x666666 }),
            sleeper: new THREE.MeshLambertMaterial({ color: 0x4a3322 })
        };
        // On the turf's pile, which stands about 0.1 over the pad (under it
        // the track was not seen at all).
        var LIFT = 0.09;
        var len = x1 - x0, n = Math.max(2, Math.round(len / 0.34)), k, step = len / n, o;
        for (k = 0; k < n; k++) {
            o = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.03, D * 1.15), trackMats.sleeper);
            o.position.set(x0 + step * (k + 0.5), y + LIFT + 0.015, z);
            o.receiveShadow = true;
            group.add(o);
        }
        [-1, 1].forEach(function (s) {
            o = new THREE.Mesh(new THREE.BoxGeometry(len, 0.045, 0.05), trackMats.rail);
            o.position.set(x0 + len / 2, y + LIFT + 0.03 + 0.0225, z + s * D * 0.4);
            o.receiveShadow = true;
            group.add(o);
        });
    }

    // How far into its run a train's car is from the nearer end, 0 to 1.
    function trainSeen(wall, t) {
        var m = wall.move, u = P.runOffset(m, t) + m.amp, e = Math.min(u, 2 * m.amp - u);
        return Math.max(0, Math.min(1, e / TRAIN_FADE));
    }

    /* A flipper, drawn as a pinball flipper rather than as the box it is to
       the solver: a bat that tapers from a round heel to a round tip, a white
       body over a red rubber band at the height of the ball's middle, and a
       chrome cap on the pin it turns about — the heel end for a hinged one
       (courses.flipper `hinge`), the middle for one that is not. The outline
       is the box's own length and, at the heel, its thickness; the tip is a
       quarter narrower than the box, which is a few millimetres of lie at the
       one end and the whole difference between a bat and a plank.

       Built in the bat's own frame about its middle, so it rides R.movers
       exactly as the box did (syncMovers puts the middle where wallBox says
       and turns it to its yaw). */
    /* A slingshot (courses.slingshot): a white triangle of plastic on the
       table with a lit insert let into its top, and a band of rubber round
       its three sides at the height the ball meets it — the face the kicker
       is behind in the hole's own pink. Lit and flashed like a pop bumper
       (R.posts, glowPosts), off the same event. Built in world coordinates:
       the shape's points are the table's. */
    var SLING_RUBBER = 0xff4fa3;
    function addSling(group, wall) {
        var tri = wall.tri, base = wall.base || 0, h = wall.h, k;
        var mx = (tri[0].x + tri[1].x + tri[2].x) / 3, mz = (tri[0].z + tri[1].z + tri[2].z) / 3;
        // The triangle pulled in (or pushed out) towards its middle by `d`.
        function grown(d) {
            return tri.map(function (p) {
                var dx = p.x - mx, dz = p.z - mz, r = Math.sqrt(dx * dx + dz * dz) || 1;
                return { x: p.x + dx / r * d, z: p.z + dz / r * d };
            });
        }
        function shapeOf(pts, hole) {
            var sh = new THREE.Shape();
            sh.moveTo(pts[0].x, pts[0].z);
            for (k = 1; k < pts.length; k++) sh.lineTo(pts[k].x, pts[k].z);
            sh.closePath();
            if (hole) {
                var hp = new THREE.Path();
                hp.moveTo(hole[0].x, hole[0].z);
                for (k = hole.length - 1; k >= 1; k--) hp.lineTo(hole[k].x, hole[k].z);
                hp.closePath();
                sh.holes.push(hp);
            }
            return sh;
        }
        function slab(shape, depth, top, mat) {
            var geo = new THREE.ExtrudeGeometry(shape, { depth: depth, bevelEnabled: false });
            geo.rotateX(Math.PI / 2);              // shape's y → world z, extruded down
            geo.translate(0, top, 0);
            var m = new THREE.Mesh(geo, mat);
            m.castShadow = true;
            m.receiveShadow = true;
            group.add(m);
            return m;
        }
        var body = R.surf.flipperBody || (R.surf.flipperBody = new THREE.MeshPhongMaterial({
            color: 0xf5f2f7, shininess: 70, specular: 0x9a9a9a
        }));
        var rubber = R.surf.slingRubber || (R.surf.slingRubber = new THREE.MeshLambertMaterial({ color: SLING_RUBBER }));
        var top = base + h;
        slab(shapeOf(grown(-0.12)), h, top, body);
        slab(shapeOf(grown(0.02), grown(-0.12)), 0.16, C.BALL_R + 0.08, rubber);
        var lamp = new THREE.MeshPhongMaterial({
            color: 0x3ee0ff, emissive: 0x3ee0ff, emissiveIntensity: 0.5, shininess: 90
        });
        slab(shapeOf(grown(-0.34)), 0.012, top + 0.012, lamp).castShadow = false;
        var pool = slab(shapeOf(grown(0.35)), 0.004, 0.014, new THREE.MeshBasicMaterial({
            color: SLING_RUBBER, transparent: true, opacity: 0.08, depthWrite: false,
            blending: THREE.AdditiveBlending
        }));
        pool.castShadow = pool.receiveShadow = false;
        R.posts.push({ wall: wall, lamp: lamp, pool: pool, flash: 0, ph: mx * 1.3 });
    }

    function addFlipper(group, wall, B) {
        var len = wall.w, t = wall.d, h = wall.h, sw = wall.swing;
        var heel = sw.hinge ? (sw.reach > 0 ? -1 : 1) : -1;   // which end is the heel, in local x
        function outline(grow) {
            var r0 = t / 2 + grow, r1 = t * 0.375 + grow;
            var x0 = heel * (len / 2 - t / 2), x1 = -heel * (len / 2 - t * 0.375);
            var shape = new THREE.Shape(), k, a, n = 12;
            // Round the heel, then the tip, joined by the two tangents.
            for (k = 0; k <= n; k++) {
                a = Math.PI / 2 + k / n * Math.PI;
                if (heel > 0) a += Math.PI;
                var px = x0 + Math.cos(a) * r0, pz = Math.sin(a) * r0;
                if (k) shape.lineTo(px, pz); else shape.moveTo(px, pz);
            }
            for (k = 0; k <= n; k++) {
                a = -Math.PI / 2 + k / n * Math.PI;
                if (heel > 0) a += Math.PI;
                shape.lineTo(x1 + Math.cos(a) * r1, Math.sin(a) * r1);
            }
            shape.closePath();
            return shape;
        }
        function slab(shape, depth, y0, mat) {
            var geo = new THREE.ExtrudeGeometry(shape, { depth: depth, bevelEnabled: false, curveSegments: 6 });
            geo.rotateX(Math.PI / 2);              // shape's y → world z, extruded down
            geo.translate(0, y0 + depth, 0);
            var m = new THREE.Mesh(geo, mat);
            m.castShadow = true;
            m.receiveShadow = true;
            return m;
        }
        var fBodyCol = R.theme && R.theme.flipperBody ? R.theme.flipperBody : 0xf5f2f7;
        var fTrimCol = R.theme && R.theme.flipperTrim ? R.theme.flipperTrim : 0xd8283a;
        var fPinCol = R.theme && R.theme.flipperPin ? R.theme.flipperPin : 0xc9d2da;
        var body = R.surf.flipperBody || (R.surf.flipperBody = new THREE.MeshPhongMaterial({
            color: fBodyCol, shininess: 70, specular: 0x9a9a9a
        }));
        var rubber = R.surf.flipperRubber || (R.surf.flipperRubber = new THREE.MeshLambertMaterial({ color: fTrimCol }));
        var bat = new THREE.Group();
        // Centred on the box's middle in y, which is where syncMovers puts it.
        bat.add(slab(outline(-0.02), h, -h / 2, body));
        bat.add(slab(outline(0.015), 0.16, C.BALL_R - 0.08 - (B.base + h / 2) + (wall.base || 0) + 0.1, rubber));
        bat.position.set(B.cx, B.base + h / 2, B.cz);
        bat.rotation.y = B.yaw;
        group.add(bat);
        R.movers.push({ mesh: bat, wall: wall, h: h });

        var px = sw.hinge ? sw.hinge.x : B.cx, pz = sw.hinge ? sw.hinge.z : B.cz;
        var chrome = R.surf.chrome || (R.surf.chrome = new THREE.MeshPhongMaterial({
            color: fPinCol, shininess: 140, specular: 0xffffff
        }));
        var pin = new THREE.Mesh(new THREE.CylinderGeometry(t * 0.32, t * 0.36, h + 0.06, 16), chrome);
        pin.position.set(px, B.base + (h + 0.06) / 2, pz);
        pin.castShadow = true;
        group.add(pin);
    }

    /* The kerb round a rounded corner (courses.cornerRails), or a curved wall
       that asked to be drawn (`arc`'s `drawn`, in `b.kind`'s material), drawn
       as the one curve it is rather than as the chords the solver meets. A band of rail
       swept round the corner's centre, extruded up — and then its two curved
       faces given the radial normal they would have on a true cylinder, since
       an extrusion is shaded a facet at a time and a lit fan of facets is the
       very thing this replaces. The flat ends, top and bottom keep theirs. */
    function addBend(group, b) {
        var ro = b.R + b.t / 2, ri = b.R - b.t / 2;
        var n = Math.max(10, Math.ceil(b.R * Math.abs(b.a1 - b.a0) / 0.07)), k, a;
        var shape = new THREE.Shape();
        for (k = 0; k <= n; k++) {
            a = b.a0 + (b.a1 - b.a0) * k / n;
            if (k) shape.lineTo(Math.cos(a) * ro, -Math.sin(a) * ro);
            else shape.moveTo(Math.cos(a) * ro, -Math.sin(a) * ro);
        }
        for (k = n; k >= 0; k--) {
            a = b.a0 + (b.a1 - b.a0) * k / n;
            shape.lineTo(Math.cos(a) * ri, -Math.sin(a) * ri);
        }
        shape.closePath();
        var geo = new THREE.ExtrudeGeometry(shape, { depth: b.h, bevelEnabled: false });
        geo.rotateX(-Math.PI / 2);
        var pos = geo.attributes.position, nrm = geo.attributes.normal, i, x, z, l, d;
        for (i = 0; i < pos.count; i++) {
            if (Math.abs(nrm.getY(i)) > 0.5) continue;
            x = pos.getX(i); z = pos.getZ(i); l = Math.hypot(x, z) || 1;
            d = (nrm.getX(i) * x + nrm.getZ(i) * z) / l;
            if (d > 0.7) nrm.setXYZ(i, x / l, 0, z / l);
            else if (d < -0.7) nrm.setXYZ(i, -x / l, 0, -z / l);
        }
        nrm.needsUpdate = true;
        var mat = R.surf.walls[b.kind] || R.surf.walls.rail;
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(b.cx, b.base, b.cz);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        group.add(mesh);
        /* An end that stops in the open (`cap0`/`cap1`: a kerb broken by a
           gap, or a wall standing on its own) is finished round rather than
           cut off square. The cap's far side is where the chord under it
           ends — `arc` runs each chord half a thickness past its own end —
           so what is drawn is what the ball meets, near enough. */
        [[b.cap0, b.a0], [b.cap1, b.a1]].forEach(function (e) {
            if (!e[0]) return;
            var cap = new THREE.Mesh(new THREE.CylinderGeometry(b.t / 2, b.t / 2, b.h, 16), mat);
            cap.position.set(b.cx + Math.cos(e[1]) * b.R, b.base + b.h / 2, b.cz + Math.sin(e[1]) * b.R);
            cap.castShadow = true;
            cap.receiveShadow = true;
            group.add(cap);
        });
    }

    /* A windmill's sails (courses.mill), and the cap they turn on.

       What the ball meets is the foot of one sail (physics.millSail); what is
       drawn is all four, on a hub, turned by the same angle off straight down
       — so a sail is drawn exactly where its tip is solid. Each is a spar
       with a cloth panel on it and three cross-bars, which is about the least
       that reads as a sail rather than as a blade. Behind the hub the mill's
       tower carries on above the house as a tapered cap with a roof, so the
       sails are hung on something. */
    function addSails(group, wall) {
        var sl = wall.sails, W = R.surf.walls, L = sl.len, k, arm, part;
        var hz = wall.z + wall.d / 2;
        var rotor = new THREE.Group();
        rotor.position.set(sl.hx, sl.hy, hz);
        /* Three layers, front (−z, the tee's side) to back, and no two faces
           at the same depth: the spar, the cross-bars through it, then the
           cloth behind both. The cloth used to sit *inside* the spar with
           its front face level with the spar's, and two coplanar faces
           z-fight — the spar showed through the cloth as a ragged stripe
           that crawled across the blade as it turned, which on a phone read
           as a flickering sail that bent (the owner, v1.237.1). The back of
           the stack stays a hand short of the tower behind it. */
        for (k = 0; k < 4; k++) {
            arm = new THREE.Group();
            arm.rotation.z = k * Math.PI / 2;
            part = new THREE.Mesh(new THREE.BoxGeometry(0.1, L, 0.1), W.sails);
            part.position.set(0, -L / 2, -0.06);                    // −0.11 … −0.01
            arm.add(part);
            part = new THREE.Mesh(new THREE.BoxGeometry(sl.width, L * 0.76, 0.025), W.cloth);
            part.position.set(0, -L * 0.6, 0.0225);                 // +0.01 … +0.035
            arm.add(part);
            for (var b = 0; b < 3; b++) {
                part = new THREE.Mesh(new THREE.BoxGeometry(sl.width + 0.08, 0.06, 0.05), W.sails);
                part.position.set(0, -L * (0.3 + b * 0.32), -0.045); // −0.07 … −0.02
                arm.add(part);
            }
            arm.traverse(function (o) { o.castShadow = true; });
            rotor.add(arm);
        }
        part = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.24, 0.34, 12), W.cap);
        part.rotation.x = Math.PI / 2;
        rotor.add(part);
        group.add(rotor);
        R.movers.push({ rotor: rotor, wall: wall });

        // The tower: from the wings' top, over the door, up past the hub,
        // and a roof on it. Narrow enough at the foot to stand clear of the
        // sails turning in front of it.
        var hs = sl.house;
        if (hs) {
            var mz = hs.z + hs.deep / 2, rise = sl.hy + 0.55 - hs.top;
            var body = new THREE.Mesh(new THREE.CylinderGeometry(0.66, 0.88, rise, 8), W.tower);
            body.position.set(sl.hx, hs.top + rise / 2, mz);
            body.castShadow = true; body.receiveShadow = true;
            group.add(body);
            var roof = new THREE.Mesh(new THREE.ConeGeometry(0.86, 0.95, 8), W.cap);
            roof.position.set(sl.hx, hs.top + rise + 0.45, mz);
            roof.castShadow = true;
            group.add(roof);
            var shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, mz - hz, 8), W.sails);
            shaft.rotation.x = Math.PI / 2;
            shaft.position.set(sl.hx, sl.hy, (mz + hz) / 2);
            group.add(shaft);
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

    /* The rim a pond is held in.

       A water rectangle on a course whose surround is not the sea is a box
       standing on the ground the course stands on, and its surface is wherever
       the hole says it is — which on a quarry hole is the best part of two
       units above the quarry floor. Drawn as it was, that came out as a slab
       of water floating over the desert with four dark blue walls: from the
       tee it was hidden behind the pads, and from any low angle it was the
       most obviously wrong thing in the picture. Thirteen of them, over five
       courses; the turntable found every one and no assertion could have.

       Nothing about the *data* is wrong — a pond has to be at the height the
       ball splashes at. What was missing is the thing that would hold water
       there, so this is it: a kerb of the ground the course itself is standing
       on, run round the rectangle from the surface down to the surround. The
       pond then reads as a hole cut in the same block of rock the greens are
       sitting on, which is exactly what every other pad on the hole already
       looks like.

       **Its top is level with the water and never above it.** A rim standing
       proud would be a wall the ball goes straight through — the shoreline is
       a splash, not a bounce — and the one rule the scenery in this game obeys
       is that what you can see is what the ball hits.

       Four boxes rather than one grown box, because a grown box has a top face
       under the water as well and two surfaces at the same height flicker
       against each other. Where a pad borders the pond the kerb is under it,
       inside a slab that reaches the same ground, and is never seen. */
    var BANK_W = 0.4;

    function addBank(group, w, theme, depth, skip) {
        // Nothing to hold up: on a theme whose floor is near the waterline the
        // flanks are a few centimetres and the kerb would be a hairline.
        if (depth < 0.45) return;
        // A pond in a hollow (courses.pond) is held in by its own ground, and
        // a rim round its bounding box would draw the very square it is not.
        if (w.dip) return;
        var mat = groundMaterial(theme);
        // Middle, middle, width, depth. The two long sides run the whole way
        // and overlap the short ones at the corners, which is how the rim
        // closes without a mitre.
        var y = w.y - depth / 2, i, s, mesh;
        var sides = [
            [w.x - BANK_W / 2, w.z + w.d / 2, BANK_W, w.d + BANK_W * 2],
            [w.x + w.w + BANK_W / 2, w.z + w.d / 2, BANK_W, w.d + BANK_W * 2],
            [w.x + w.w / 2, w.z - BANK_W / 2, w.w, BANK_W],
            [w.x + w.w / 2, w.z + w.d + BANK_W / 2, w.w, BANK_W]
        ];
        for (i = 0; i < sides.length; i++) {
            if (skip && skip.indexOf(i) >= 0) continue;
            s = sides[i];
            mesh = new THREE.Mesh(new THREE.BoxGeometry(s[2], depth, s[3]), mat);
            mesh.position.set(s[0], y, s[1]);
            mesh.receiveShadow = true;
            mesh.castShadow = true;
            group.add(mesh);
        }
    }

    /* A pond on a world's own ground (`w.grid`: the baked grid of a forged
       or sculpted hole, forge.js). The world draws its ground, so there is
       nothing to hold the water in and nothing to stand a box in: what is
       drawn is the surface alone, cut to the waterline — every cell's two
       triangles clipped to where the ground is under the water, the edge
       found along each side by where the height crosses the level. So the
       pond is the shape of its hollow, as the ball finds it (physics drowns
       only where the ground is under the level), and not the rectangle that
       bounds it (the owner's first look at one: a box of water standing in
       front of the tee). */
    function addPondOnGrid(group, w, theme) {
        var G = w.grid, pos = [], i, k;
        function corner(ci, ck) {
            var x = G.x0 + ci * G.d, z = G.z0 + ck * G.d;
            return [x, z, w.y - G.h[ck * G.nx + ci]];
        }
        function clip(tri) {
            var out = [], j, a, b, t;
            for (j = 0; j < 3; j++) {
                a = tri[j]; b = tri[(j + 1) % 3];
                if (a[2] > 0) out.push(a);
                if ((a[2] > 0) !== (b[2] > 0)) {
                    t = a[2] / (a[2] - b[2]);
                    out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, 0]);
                }
            }
            for (j = 1; j + 1 < out.length; j++) {
                pos.push(out[0][0], w.y, out[0][1], out[j + 1][0], w.y, out[j + 1][1], out[j][0], w.y, out[j][1]);
            }
        }
        for (k = 0; k < G.nz - 1; k++) for (i = 0; i < G.nx - 1; i++) {
            var cx = G.x0 + (i + 0.5) * G.d, cz = G.z0 + (k + 0.5) * G.d;
            if (cx < w.x - G.d || cx > w.x + w.w + G.d || cz < w.z - G.d || cz > w.z + w.d + G.d) continue;
            var a = corner(i, k), b = corner(i + 1, k), c = corner(i + 1, k + 1), d = corner(i, k + 1);
            if (a[2] <= 0 && b[2] <= 0 && c[2] <= 0 && d[2] <= 0) continue;
            clip([a, b, c]); clip([a, c, d]);
        }
        if (!pos.length) return;
        var geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
        var mesh = new THREE.Mesh(geo, w.lava ? lavaMaterial(theme, { set: w.set, flow: w.flow })
            : waterMaterial(theme, { alpha: 0.8 }));
        // A hair over the level, so it does not fight the world's ground at the shore.
        mesh.position.y = 0.01;
        group.add(mesh);
    }

    /* Lava (physics → "lava, and the crust"; the shader is SH.LAVA_FS). One
       material per surface, so a crust's sheet can be told its own phase. */
    function lavaMaterial(theme, opts) {
        opts = opts || {};
        var mat = new THREE.ShaderMaterial({
            uniforms: {
                fogColour: { value: new THREE.Color(theme.fog) },
                fogNear: { value: 24 },
                fogFar: { value: 95 },
                time: { value: 0 },
                set: { value: opts.set !== undefined ? opts.set : 0.48 },
                warn: { value: 0 },
                alpha: { value: 1 },
                flow: { value: new THREE.Vector2(opts.flow ? opts.flow[0] : 0.05, opts.flow ? opts.flow[1] : 0.12) }
            },
            vertexShader: SH.WATER_VS,
            fragmentShader: SH.LAVA_FS,
            transparent: !!opts.sheet,
            depthWrite: !opts.sheet
        });
        R.lavaMats.push(mat);
        return mat;
    }

    /* A lava pool is drawn as the pond is — a box from its surface down to
       the surround, held in by the same kerb of the course's ground — with
       the lava on top and cooled black rock for its sides. No bed: it is
       not something you see into. */
    function addLava(group, w, theme) {
        var depth = Math.max(0.6, w.y - theme.surroundY + 0.2);
        var rock = new THREE.MeshLambertMaterial({ color: 0x1a1412 });
        var top = lavaMaterial(theme, { set: w.set, flow: w.flow });
        /* `spill` names the sides that pour into a lower pool next door
           (0 −x, 1 +x, 2 −z, 3 +z, as addBank counts them): that face is
           drawn in lava too — in world space the shader smears it down the
           face, which is a lavafall — and gets no kerb. */
        var spill = w.spill || [];
        var side = function (k) { return spill.indexOf(k) >= 0 ? top : rock; };
        // Box material order: +x, -x, +y, -y, +z, -z.
        var mesh = new THREE.Mesh(new THREE.BoxGeometry(w.w, depth, w.d),
            [side(1), side(0), top, rock, side(3), side(2)]);
        mesh.position.set(w.x + w.w / 2, w.y - depth / 2, w.z + w.d / 2);
        group.add(mesh);
        /* The kerb a hair under the surface rather than level with it: a
           pool flush with the lawn (a crust's) would otherwise stand its
           kerb a few centimetres proud along the lawn's edge. */
        addBank(group, { x: w.x, z: w.z, w: w.w, d: w.d, y: w.y - 0.04, dip: w.dip }, theme, depth,
            spill.concat(w.held || []));
    }

    /* A crust: a sheet of the same lava laid a hair over its pool, all
       plates (`set` 1), shown while the crust is set and gone while it is
       molten. stepLava reads its phase off the world's clock every frame —
       the clock physics.drown asks — so what is drawn is what the ball
       meets: the seams start to glow CRUST_WARN before the melt. */
    function addCrust(group, c, hole, theme) {
        var lw = P.waterAt(hole, c.x + c.w / 2, c.z + c.d / 2);
        var y = (lw ? lw.y : 0) + 0.006;
        var geo = new THREE.PlaneGeometry(c.w, c.d);
        geo.rotateX(-Math.PI / 2);
        var mat = lavaMaterial(theme, { set: 1, sheet: true, flow: lw && lw.flow });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(c.x + c.w / 2, y, c.z + c.d / 2);
        mesh.renderOrder = 2;
        group.add(mesh);
        R.crusts.push({ crust: c, mesh: mesh, mat: mat });
    }

    var _crust = {};
    function stepLava(world) {
        var i, u, k, c, f, fade;
        for (i = 0; i < (R.lavaMats || []).length; i++) {
            u = R.lavaMats[i].uniforms;
            u.time.value = R.clock;
            if (R.scene.fog) {
                u.fogNear.value = R.scene.fog.near;
                u.fogFar.value = R.scene.fog.far;
                u.fogColour.value.copy(R.scene.fog.color);
            }
        }
        for (k = 0; k < (R.crusts || []).length; k++) {
            c = R.crusts[k];
            f = P.crustPhase(c.crust, world ? world.time : R.clock, _crust);
            // It sets at once (the physics does), and so does the picture;
            // molten, the sheet is simply not there.
            fade = f.set;
            c.mesh.visible = fade > 0.001;
            c.mat.uniforms.alpha.value = fade;
            c.mat.uniforms.warn.value = f.warn * f.set;
        }
    }

    function addWater(group, w, theme) {
        if (w.grid) { addPondOnGrid(group, w, theme); return; }
        if (w.lava) { addLava(group, w, theme); return; }
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
        /* On a course whose whole surround is sea, the box's dark sides stood
           a few centimetres proud of the sea plane and drew a black line
           ruled across the ocean where the rectangle stopped. The sea needs
           no sides; it gets the top alone. */
        var sides = theme.surround === 'water' ? new THREE.MeshBasicMaterial({ visible: false }) : murk;
        // Box material order: +x, -x, +y, -y, +z, -z.
        var mesh = new THREE.Mesh(new THREE.BoxGeometry(w.w, depth, w.d),
            [sides, sides, top, sides, sides, sides]);
        mesh.position.set(w.x + w.w / 2, w.y - depth / 2, w.z + w.d / 2);
        group.add(mesh);

        /* …but only where the pond is a hole in the ground. On a course whose
           whole surround is water the rectangle is a piece of the sea rather
           than a pool, it sits a few centimetres proud of the surround plane,
           and a bed under it shows as a dark line ruled across the ocean at
           the depth of its own edge. The sea does not need a floor drawn for
           it; it has the horizon. */
        if (theme.surround === 'water') return;

        addBank(group, w, theme, depth);

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
       and a short side have stakes the same distance apart.

       Half as many as there were, shorter and off-white (v1.155.0): at one
       every four and a half units in the brightest white on the hole they
       were the first thing in every picture of the long game (the owner:
       "too much out of bounds white markers"). A line needs enough posts to
       be read as a line, and that is one every nine. */
    function addStakes(group, hole, theme) {
        // A hole whose boundary is the edge of the world marks nothing
        // (Challenge mode: the glass runs out, and that is the line).
        if (hole.stakes === false) return;
        var rects = P.fenceRects(hole);
        if (!rects.length) return;
        var mat = new THREE.MeshPhongMaterial({
            color: 0xd9d4c2, shininess: 12, specular: 0x33342f
        });
        var geo = new THREE.CylinderGeometry(0.06, 0.08, 0.8, 6);
        var gap = 9, r, i, k;
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
                    m.position.set(x, top.y + 0.35, z);
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

    /* The country the course is standing on, as a material. Three things ask
       for it — the surround itself, the skirt that gets from the course down to
       it, and the rim round a pond — and they must ask the same way: the tint
       is cached by colour in textures.js, so two holes on one course stand on
       the same rock rather than redrawing it, and the splice above is what
       de-tiles it. A second copy of these six lines is a second answer to
       "what is the ground made of". */
    function groundMaterial(theme) {
        var mat = new THREE.MeshLambertMaterial({
            map: TX.rock(theme.surround === 'rock'
                ? (theme.ground || '#9c8466')
                : (theme.floor || '#3f4450'))
        });
        mat.onBeforeCompile = surroundShader;
        return mat;
    }

    /* ── the skirt ──────────────────────────────────────────────────────

       How the long game gets from its own ground down to the country around
       it, instead of ending in a cliff.

       An open hole is a piece of country rather than a slab on a table:
       `commons` grows every row by a margin of rough so the ground leaves the
       property at exactly the height and tilt of the row it continues, and
       there is no step at the stakes. What none of that ever did was get from
       *there* to `theme.surroundY`, which on the heath is three units further
       down and on a hole that climbs is seven. The whole drop was taken in one
       edge, and every angle except the tee showed it: a green wedge on a flat
       plane, with the cut running the width of the picture. The tee is the one
       seat that cannot see it, which is why it lasted as long as it did.

       So the ground falls away instead. The shape is read off the hole rather
       than named: a bearing at a time, march in from outside until there is
       ground, and that is where the country ends and at what height. A hole
       that climbs four units has a different edge height on every side and
       this picks all of them up, which a single number could not.

       Four things make it fit rather than merely exist:

       - **A hillside's length comes from its height.** Seven units of fall in
         seven units of ground is a one-in-one bank, which from the hero angle
         reads as the cliff it replaced. So the run is `SKIRT_RUN` times the
         drop — the deepest one on the hole, so the ring stays a ring — and the
         flat the surround holds around the course is widened to match it.
       - **It tucks under.** The inner ring is `SKIRT_TUCK` *inside* the edge it
         found, so it disappears under the slab rather than trying to meet a
         jagged row-end with a radial ring. The pads are drawn on top of it and
         hide the join.
       - **It is a curve, not a ramp.** `SKIRT_STEPS` rings and a smoothstep, so
         the ground rolls over at the top and flattens out at the bottom the way
         a hillside does. A straight ramp reads as a ramp.
       - **It finishes a hair proud of the surround**, for the same reason a
         pond's rim does: two faces at exactly one height flicker against each
         other.

       The drawn holes do not get one and should not. A slab in the sea is the
       house style there and reads as a model on a table on purpose. */
    var SKIRT_RUN = 2.6;        // units of fall spread per unit of drop
    var SKIRT_MIN = 6;          // …but never a shorter bank than this
    var SKIRT_MAX = 22;         // …nor one that runs to the horizon
    var SKIRT_TUCK = 0.6;       // how far inside the ground's edge it starts
    var SKIRT_SECT = 96;        // bearings, as many as the surround has wedges
    var SKIRT_STEPS = 5;        // rings across it, so the fall is a curve
    var SKIRT_LIP = 0.03;       // …ending this far over the surround, not on it
    var SKIRT_SHOULDER = 0.9;   // level ground past the edge before the fall
    var SKIRT_SINK = 0.015;     // …a hair under the slab, so the two never fight

    /* Where the ground ends on one bearing, and how high it is there. Marched
       from outside in, because what is wanted is the *outer* edge: a hole with
       a lake or a ravine in it has ground on both sides of a gap, and coming
       from the middle would stop at the near lip of it. Coarse first and then
       fine over the last stride, which is some six samples a bearing rather
       than two hundred. */
    function groundEdge(hole, cx, cz, ang, rMax) {
        var ca = Math.cos(ang), sa = Math.sin(ang), r, s, g;
        for (r = rMax; r > 0.5; r -= 1) {
            if (P.surfaceTop(hole, cx + ca * r, cz + sa * r)) break;
        }
        if (r <= 0.5) return null;
        for (s = r + 1; s > r; s -= 0.15) {
            g = P.surfaceTop(hole, cx + ca * s, cz + sa * s);
            if (g) return { r: s, y: g.y };
        }
        return { r: r, y: P.surfaceTop(hole, cx + ca * r, cz + sa * r).y };
    }

    /* The shape of the fall, worked out once and read by two things — the
       skirt draws it, and the surround has to know how much flat to keep
       around the course so the noise and the bank are never arguing over the
       same vertex. Null for the holes that do not get one. */
    function skirtPlan(hole, theme) {
        if (!hole.open || theme.surround === 'water') return null;
        // A portal world's islands hang in the air: no bank down to anything.
        if (hole.portal && !hole.grounded) return null;

        var b = hole.bounds;
        var cx = (b.minX + b.maxX) / 2, cz = (b.minZ + b.maxZ) / 2;
        /* Where to start marching from, and it is **not** `hole.bounds`. On an
           open hole those are the property line, deliberately — they are what
           the camera frames, and framing the ground would show the player a
           postage stamp in the middle of a county. The ground runs on past the
           stakes by every margin `commons` grew, so a march begun at the fence
           begins *inside* the course: it finds ground on the first sample and
           reports the middle of a fairway as the edge of the world. On The Dell
           that was twenty-eight bearings out of ninety-six. So the start is read
           off the pads, which are the ground. */
        var reach = 0, q, p, j, e;
        for (q = 0; q < hole.pads.length; q++) {
            p = hole.pads[q];
            reach = Math.max(reach, Math.hypot(
                Math.max(Math.abs(p.x - cx), Math.abs(p.x + p.w - cx)),
                Math.max(Math.abs(p.z - cz), Math.abs(p.z + p.d - cz))));
        }

        var edge = [], drop = 0;
        for (j = 0; j < SKIRT_SECT; j++) {
            e = groundEdge(hole, cx, cz, j / SKIRT_SECT * Math.PI * 2, reach + 2);
            edge.push(e);
            if (e) drop = Math.max(drop, e.y - theme.surroundY);
        }
        // A course already lying near the country around it — the links is half
        // a unit above its own — has nothing worth falling.
        if (drop < 0.35) return null;

        var width = Math.max(SKIRT_MIN, Math.min(SKIRT_MAX, drop * SKIRT_RUN));
        return { cx: cx, cz: cz, edge: edge, width: width, outer: reach + width + 2 };
    }

    function addSkirt(group, hole, theme, plan) {
        if (!plan) return;
        var pos = [], uv = [], idx = [], j, k, e, t, r, ang, ca, sa;

        /* The first ring is tucked under the slab; the second is the
           shoulder, level with the edge and a little past it, and only then
           does the curve begin. Without the shoulder the triangle from the
           tuck to the first ring of the fall was already dropping where it
           crossed the slab's edge, and the slab's cut face showed above the
           bank as a thin brown line round the whole hole — the "faint line
           where the ground meets the bank" of PLAN.md. */
        for (j = 0; j < SKIRT_SECT; j++) {
            e = plan.edge[j];
            if (!e) continue;
            ang = j / SKIRT_SECT * Math.PI * 2;
            ca = Math.cos(ang); sa = Math.sin(ang);
            r = e.r - SKIRT_TUCK;
            pos.push(ca * r, e.y - SKIRT_SINK, sa * r);
            uv.push((plan.cx + ca * r) / SUR_TILE, (plan.cz + sa * r) / SUR_TILE);
            for (k = 0; k <= SKIRT_STEPS; k++) {
                t = k / SKIRT_STEPS;
                r = e.r + SKIRT_SHOULDER + (plan.width - SKIRT_SHOULDER) * t;
                pos.push(ca * r,
                    theme.surroundY + SKIRT_LIP +
                        (1 - t * t * (3 - 2 * t)) * (e.y - SKIRT_SINK - theme.surroundY),
                    sa * r);
                uv.push((plan.cx + ca * r) / SUR_TILE, (plan.cz + sa * r) / SUR_TILE);
            }
        }
        // Every bearing found ground, or the ring has a gap in it and is not a
        // ring; the march only fails on a hole with no pads at all.
        var ring = SKIRT_STEPS + 2, a0, a1;
        if (pos.length !== SKIRT_SECT * ring * 3) return;

        for (j = 0; j < SKIRT_SECT; j++) {
            a0 = j * ring; a1 = ((j + 1) % SKIRT_SECT) * ring;
            for (k = 0; k < ring - 1; k++) {
                idx.push(a0 + k, a1 + k, a1 + k + 1);
                idx.push(a0 + k, a1 + k + 1, a0 + k + 1);
            }
        }

        var geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(pos), 3));
        geo.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(uv), 2));
        geo.setIndex(idx);
        geo.computeVertexNormals();

        var mesh = new THREE.Mesh(geo, groundMaterial(theme));
        mesh.position.set(plan.cx, 0, plan.cz);
        mesh.receiveShadow = true;
        group.add(mesh);
    }

    function addSurround(group, hole, theme, plan) {
        var cx = (hole.bounds.minX + hole.bounds.maxX) / 2;
        var cz = (hole.bounds.minZ + hole.bounds.maxZ) / 2;

        /* Where the ground out here is, for anything standing on it that the
           renderer did not lay itself (life.js). The same arithmetic the mesh
           below is built from, rather than a second copy of it. */
        R.groundAt = function () { return theme.surroundY; };
        R.groundMat = null;

        if (theme.surround === 'water') {
            // The sea makes its own shape out of its own waves, and it is flat
            // by definition; it keeps the plane it always had.
            var sea = new THREE.Mesh(new THREE.PlaneGeometry(600, 600), waterMaterial(theme, {}));
            sea.rotation.x = -Math.PI / 2;
            sea.position.set(cx, theme.surroundY, cz);
            group.add(sea);
            return;
        }

        var mat = groundMaterial(theme);

        // Out to the far corner of the hole, and then the margin. A dogleg's
        // bounding box is bigger than the hole in it, which is the safe way
        // round to be wrong.
        var flatR = Math.hypot(hole.bounds.maxX - cx, hole.bounds.maxZ - cz) + SUR_FLAT;
        // …and past the skirt, where there is one. The noise and the bank both
        // move the same vertices, and ground that rolls under a hillside puts a
        // hump through it.
        if (plan) flatR = Math.max(flatR, plan.outer);
        /* …and under a floor that is part of the hole (Redstone's canyon
           floor, `oob`): it runs well past the stakes, it is drawn down to
           meet this ground at its edge, and it has no skirt to keep the
           noise away from it, so the flat has to reach past it instead. */
        else if (hole.pads.some(function (p) { return p.oob && !p.stands; })) {
            hole.pads.forEach(function (p) {
                flatR = Math.max(flatR, 2 + Math.hypot(
                    Math.max(Math.abs(p.x - cx), Math.abs(p.x + p.w - cx)),
                    Math.max(Math.abs(p.z - cz), Math.abs(p.z + p.d - cz))));
            });
        }
        var amp = theme.relief || 0;
        R.groundAt = function (x, z) {
            return theme.surroundY + (amp ? surRelief(x, z, Math.hypot(x - cx, z - cz), amp, flatR) : 0);
        };
        var mesh = new THREE.Mesh(surroundGeometry(amp, flatR, cx, cz), mat);
        mesh.position.set(cx, theme.surroundY, cz);
        mesh.receiveShadow = true;
        group.add(mesh);
        /* …and the same ground for anything life.js lays into it (the moon's
           craters): this material with a vertex colour to darken or lighten
           it, and the tiling to lay the rock on by world position, so a
           crater's flank carries straight on into the plain. */
        R.groundMat = {
            tile: SUR_TILE,
            material: function () {
                var m = groundMaterial(theme);
                m.vertexColors = true;
                return m;
            }
        };
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

    /* A mountain range round the hole, for a theme that names one
       (`theme.range`, the alpine course's): scenery only, never solid, and
       well outside the property — it starts past the skirt and runs a
       hundred-odd units out, between the hole and the horizon ridges.

       Drums are what the first attempt was, and the arithmetic of a disc
       cannot be anything else, so this is ground instead: a ring of terrain
       whose height is ridged noise — one minus the folded value noise, three
       octaves, squared — which is what draws sharp crests with gullies
       between them rather than rounded hills. It rises out of the valley
       over its first thirty units, so it stands *behind* the hole rather
       than beside it, and the near ring is kept lower than the far so the
       massif climbs away from the course. Every triangle is coloured on its
       own, and flat-shaded, which is what makes it faceted granite: snow
       above a ragged snowline where the ground is gentle enough to hold it
       (so the gullies fill and the steep faces stay rock), rock on anything
       steep, and dark forest on the low slopes. */
    function rangeHeight(R, x, z, r, r0) {
        var f = [1 / 46, 1 / 21, 1 / 9], w = [0.62, 0.28, 0.1], h = 0, k, n, rid;
        for (k = 0; k < 3; k++) {
            n = surNoise(x * f[k] + 31.7 * k, z * f[k] - 17.3 * k);
            rid = 1 - Math.abs(2 * n - 1);
            h += w[k] * rid * rid;
        }
        var t = (r - r0) / (R.rise || 30), env = t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t);
        var climb = 0.55 + 0.45 * Math.min(1, (r - r0) / (R.depth || 110));
        return env * climb * R.peak * (0.18 + 0.95 * h);
    }

    function addRange(group, hole, theme, plan) {
        var R = theme.range;
        G3.render.state.rangeAt = null;
        if (!R || !hole.open) return;
        var b = hole.bounds, cx = (b.minX + b.maxX) / 2, cz = (b.minZ + b.maxZ) / 2;
        var gap = R.gap === undefined ? 8 : R.gap, depth = R.depth || 110;
        var round = (plan ? plan.outer : Math.hypot(b.maxX - cx, b.maxZ - cz) + 30) + gap;
        /* Where the range's foot is on a bearing. A circle round the middle
           of the hole stands seventy units off the side of a long thin one,
           which from the tee is a skyline and not a valley; so the foot
           follows the hole's own outline — the ground's edge on that bearing
           (the skirt's march), past the bank — and the mountains rise just
           beyond the woods on every side (v1.234.0). Smoothed over a few
           bearings, so a dogleg's corner does not make a notch. */
        function footAt(a) {
            if (!plan) return round;
            var f = ((a / (Math.PI * 2)) % 1 + 1) % 1 * SKIRT_SECT, sum = 0, wsum = 0, i, e, w;
            for (i = -3; i <= 3; i++) {
                e = plan.edge[((Math.floor(f) + i) % SKIRT_SECT + SKIRT_SECT) % SKIRT_SECT];
                if (!e) continue;
                w = 4 - Math.abs(i);
                sum += w * e.r; wsum += w;
            }
            return wsum ? sum / wsum + plan.width + gap : round;
        }
        var K = 18, N = 168, base = theme.surroundY - 1.5;
        /* Where the mountainside is, for the woods to stand on (addWoods):
           the same function the rings are sampled from, so a fir on the
           lower slopes stands on the slope give or take the facets. Null
           inside the range's foot. */
        G3.render.state.rangeAt = function (x, z) {
            var rr = Math.hypot(x - cx, z - cz), f0 = footAt(Math.atan2(z - cz, x - cx));
            if (rr <= f0 || rr >= f0 + depth) return null;
            return { y: base + rangeHeight(R, x, z, rr, f0), tree: base + R.peak * (R.treeline || 0.2) };
        };
        var rings = [], k, j, rr, a, x, z, feet = [];
        for (j = 0; j < N; j++) feet.push(footAt(j / N * Math.PI * 2));
        for (k = 0; k <= K; k++) {
            var ring = [];
            for (j = 0; j < N; j++) {
                a = j / N * Math.PI * 2;
                rr = feet[j] + depth * Math.pow(k / K, 1.25);
                x = cx + Math.cos(a) * rr; z = cz + Math.sin(a) * rr;
                ring.push([x, base + rangeHeight(R, x, z, rr, feet[j]), z]);
            }
            rings.push(ring);
        }
        var pos = [], col = [], c = new THREE.Color();
        var rock = new THREE.Color(R.rock || '#6f737a'), snow = new THREE.Color(R.snow || '#f2f6fa');
        var wood = new THREE.Color(R.forest || '#2e4a34'), e1 = new THREE.Vector3(), e2 = new THREE.Vector3();
        var snowline = base + R.peak * (R.snowline || 0.5), treeline = base + R.peak * (R.treeline || 0.2);
        function tri(p, q, w) {
            e1.set(q[0] - p[0], q[1] - p[1], q[2] - p[2]);
            e2.set(w[0] - p[0], w[1] - p[1], w[2] - p[2]);
            e1.cross(e2).normalize();
            var ny = Math.abs(e1.y), hm = (p[1] + q[1] + w[1]) / 3;
            var jit = (surNoise(p[0] * 0.13, p[2] * 0.13) - 0.5) * R.peak * 0.18;
            if (hm > snowline + jit && ny > 0.56) c.copy(snow);
            else if (hm < treeline + jit * 0.5 && ny > 0.62) c.copy(wood).multiplyScalar(0.85 + 0.3 * surNoise(p[0] * 0.3, p[2] * 0.3));
            else c.copy(rock).multiplyScalar(0.78 + 0.4 * surNoise(p[0] * 0.21 + 5, p[2] * 0.21));
            [p, q, w].forEach(function (v) { pos.push(v[0] - cx, v[1], v[2] - cz); col.push(c.r, c.g, c.b); });
        }
        for (k = 0; k < K; k++) {
            for (j = 0; j < N; j++) {
                var A = rings[k][j], B = rings[k][(j + 1) % N], C2 = rings[k + 1][j], D = rings[k + 1][(j + 1) % N];
                // Wound so the face looks up (outward and round is down).
                tri(A, B, C2);
                tri(B, D, C2);
            }
        }
        var geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
        geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
        geo.computeVertexNormals();
        var mesh = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ vertexColors: true }));
        mesh.position.set(cx, 0, cz);
        group.add(mesh);
    }

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
    function addCup(group, hole, themeName) {
        var cup = hole.cup, HR = G3.holeR(hole), CD = G3.cupDepth(hole);

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
                lift = Math.max(lift, discLift(hole.pads[i]) || INLAY_LIFT);
            }
        }

        var liner = new THREE.Mesh(
            new THREE.CylinderGeometry(HR - 0.004, HR - 0.004, CD, 28, 1, true),
            new THREE.MeshLambertMaterial({ color: 0x14170f, side: THREE.BackSide })
        );
        liner.position.set(cup.x, cup.y + lift - CD / 2, cup.z);
        group.add(liner);

        /* On a sculpted hole with its world on screen there is no green:
           the ground is the world's picture, and inside the hole's plan the
           plate pushes that picture to the far plane. So nothing hid the
           shaft below the rim, and the cup stood on the fairway as a black
           tube with its floor showing through the turf. This is the ground
           the shaft is cut into, as depth only: a disc round the hole laid
           on the hole's own ground, drawn after the plate and before the
           shaft. stepPlace shows
           it only while the world is live; without the world the green
           slab does this itself. */
        // Wide, because from a low seat the shaft stands up out of the
        // ground: seen five degrees over the turf a floor 0.42 down shows
        // nearly five units short of the lip.
        var ringG = new THREE.RingGeometry(HR - 0.004, HR + 6, 40, 14);
        ringG.rotateX(-Math.PI / 2);
        /* Laid on the ground the ball rolls on (which is what the world was
           pressed to), a hair under it, so a green with a fall to it does
           not have a flat ring standing out of the slope over a ball. */
        var rp = ringG.attributes.position, rx, rz, rr, top;
        for (i = 0; i < rp.count; i++) {
            rx = rp.getX(i); rz = rp.getZ(i); rr = Math.sqrt(rx * rx + rz * rz) || 1;
            var out = Math.max(rr, HR + 0.02) / rr;
            top = P.surfaceTop(hole, cup.x + rx * out, cup.z + rz * out);
            rp.setY(i, (top ? top.y : cup.y - 1) - cup.y - 0.01);
        }
        var mask = new THREE.Mesh(
            ringG,
            new THREE.MeshBasicMaterial({ colorWrite: false, side: THREE.DoubleSide })
        );
        mask.position.set(cup.x, cup.y + lift, cup.z);
        mask.renderOrder = -1e5;
        mask.visible = false;
        group.add(mask);
        R.cupMask = mask;

        var floor = new THREE.Mesh(
            new THREE.CircleGeometry(HR, 28),
            new THREE.MeshLambertMaterial({ color: 0x1d2416 })
        );
        floor.rotation.x = -Math.PI / 2;
        floor.position.set(cup.x, cup.y - CD, cup.z);
        floor.receiveShadow = true;
        group.add(floor);

        var rim = new THREE.Mesh(
            new THREE.RingGeometry(HR - 0.005, HR + 0.045, 32),
            new THREE.MeshBasicMaterial({ color: 0xf2f5f0, side: THREE.DoubleSide })
        );
        rim.rotation.x = -Math.PI / 2;
        rim.position.set(cup.x, cup.y + lift + 0.006, cup.z);
        group.add(rim);
        R.cupMesh = rim;
        // The lip as drawn, for a camera that goes down the cup (startDive).
        R.cupTop = cup.y + lift;

        /* The pin. Everything below hangs off one group standing at the
           centre of the cup, tilted away down the line of play, so the lean is
           set once and the flag, the ferrule and the wobble all inherit it. */
        var away = Math.atan2(cup.x - hole.tee.x, cup.z - hole.tee.z);
        var pin = new THREE.Group();
        pin.position.set(cup.x, cup.y - CD + 0.01, cup.z);
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
        band.position.y = CD + 0.10;
        pin.add(band);

        /* The cloth turns about the pole rather than with the hole, because a
           flag points where the wind is going and nowhere else. It is built
           with its hoist at the origin so that rotating the group swings it
           round the stick instead of round its own middle. */
        var swivel = new THREE.Group();
        swivel.position.y = H - 0.10;
        pin.add(swivel);
        R.flagSwivel = swivel;

        addFlagCloth(swivel, hole, themeName);
        R.pinShake = 0;
    }

    /* The cloth itself (flag.js): a printed sheet per course, simulated on a
       coarse grid and drawn through a finer one up close.

       Two meshes share one material: the coarse sheet, which is the
       simulation's own grid, and a sheet FLAG_FINE times finer whose every
       vertex is a Catmull-Rom blend of the coarse one (flag.js → fill). Only
       one is shown at a time (flapFlag picks by how big the flag is on the
       screen), and sharing the material means the swap compiles nothing.

       The print is on both faces and reads the right way round from either
       side: the canvas carries the front in its top half and a mirror-laid
       back (sleeve on the right, type unmirrored) in its bottom half, and
       the fragment shader picks the half by gl_FrontFacing. */
    var FLAG_H = 0.43, FLAG_COLS = 13, FLAG_ROWS = 8, FLAG_FINE = 3;
    var flagTextures = [];     // [{ key, tex }], newest last; a few are kept between holes

    function flagTexture(design) {
        var lo = R.quality === 'low', key = design.key + (lo ? '|lo' : '|hi'), i, hit;
        for (i = 0; i < flagTextures.length; i++) {
            if (flagTextures[i].key === key) {
                hit = flagTextures.splice(i, 1)[0];
                flagTextures.push(hit);
                return hit.tex;
            }
        }
        var canvas = document.createElement('canvas');
        canvas.width = canvas.height = lo ? 512 : 1024;      // a power of two, for the mips
        G3.flag.paint(canvas, design, FLAG_W / FLAG_H);
        var tex = new THREE.CanvasTexture(canvas);
        var aniso = R.renderer && R.renderer.capabilities ? R.renderer.capabilities.getMaxAnisotropy() : 1;
        tex.anisotropy = Math.min(lo ? 2 : 8, aniso || 1);
        // Painted again once the typeface has arrived, if it had not yet.
        G3.flag.whenFont(function () { G3.flag.paint(canvas, design, FLAG_W / FLAG_H); tex.needsUpdate = true; });
        flagTextures.push({ key: key, tex: tex });
        while (flagTextures.length > 3) flagTextures.shift().tex.dispose();
        return tex;
    }

    // The front of the canvas is its top half, the back its bottom half.
    function flagSides(sh) {
        sh.fragmentShader = sh.fragmentShader.replace('#include <map_fragment>', [
            '#ifdef USE_MAP',
            '    vec2 flagUv = gl_FrontFacing ? vec2(vUv.x, 0.5 + vUv.y * 0.5) : vec2(1.0 - vUv.x, vUv.y * 0.5);',
            '    vec4 texelColor = texture2D(map, flagUv);',
            '    texelColor = mapTexelToLinear(texelColor);',
            '    diffuseColor *= texelColor;',
            '#endif'
        ].join('\n'));
    }
    function flagProgramKey() { return 'flag-cloth-v1'; }

    // A cols × rows sheet in the z = 0 plane, hoist at x = 0, hanging from y = 0.
    function sheetGeometry(cols, rows, w, h) {
        var n = cols * rows, pos = new Float32Array(n * 3), uv = new Float32Array(n * 2), idx = [], i, j, k;
        for (j = 0; j < rows; j++) {
            for (i = 0; i < cols; i++) {
                k = j * cols + i;
                pos[k * 3] = i / (cols - 1) * w;
                pos[k * 3 + 1] = -j / (rows - 1) * h;
                uv[k * 2] = i / (cols - 1);
                uv[k * 2 + 1] = 1 - j / (rows - 1);
                if (i < cols - 1 && j < rows - 1) idx.push(k, k + cols, k + 1, k + 1, k + cols, k + cols + 1);
            }
        }
        var g = new THREE.BufferGeometry();
        var at = new THREE.BufferAttribute(pos, 3);
        if (at.setUsage) at.setUsage(THREE.DynamicDrawUsage);
        g.setAttribute('position', at);
        g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
        g.setIndex(idx);
        g.computeVertexNormals();
        return g;
    }

    function addFlagCloth(swivel, hole, themeName) {
        var F = G3.flag;
        var design = F ? F.designFor(hole, themeName) : null;
        var mat = new THREE.MeshPhongMaterial({
            color: design ? 0xffffff : 0xe23b3b, side: THREE.DoubleSide, shininess: 6,
            specular: design ? 0x1c1c1c : 0x2a1010, map: design ? flagTexture(design) : null
        });
        mat.onBeforeCompile = flagSides;
        mat.customProgramCacheKey = flagProgramKey;
        var cols = FLAG_COLS, rows = FLAG_ROWS;
        var cloth = new THREE.Mesh(sheetGeometry(cols, rows, FLAG_W, FLAG_H), mat);
        cloth.castShadow = true;
        cloth.frustumCulled = false;
        swivel.add(cloth);
        R.flagCloth = cloth;
        R.flagDesign = design;
        R.flagSim = null; R.flagFine = null;
        R.flagMode = null; R.flagNear = false; R.flagLast = null;
        if (F) {
            R.flagSim = F.create(cols, rows, FLAG_W, FLAG_H);
            R.flagRest = R.flagSim.rest;
            R.flagSmooth = F.smooth(R.flagSim, FLAG_FINE);
            var fine = new THREE.Mesh(sheetGeometry(R.flagSmooth.x.n, R.flagSmooth.y.n, FLAG_W, FLAG_H), mat);
            fine.castShadow = true;
            fine.frustumCulled = false;
            fine.visible = false;
            swivel.add(fine);
            R.flagFine = fine;
        } else {
            R.flagRest = cloth.geometry.attributes.position.array.slice();
        }
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
    // How much of the course's light is taken away with the bag fully open.
    var COURSE_DIM = 0.7;
    /* How dark the blurred course behind the open picker is: see-through,
       but quiet enough that a card reads against any sky. */
    var BACK_DIM = 0.3;

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
        /* Near and far fitted to the hole rather than 1 to 120. Every unit of
           depth range the shadow camera does not need is precision taken off
           the units it does, and a phone's shadow map has far less of it than
           a desktop's: the owner's screenshots of Apogee and Clockwork Court
           showed acne as sawtooth along every face the sun grazes — the cut
           sides of a raised pad, the length of a divider — that SwiftShader
           and a desktop GPU never draw. The sun sits `dist` from the middle
           of the hole and the hole is `span` either side of it, so that is
           all the range there is, plus room for the tallest decor. The normal
           bias goes up for the same faces; 0.035 still keeps a ball's shadow
           attached to the ball. */
        var dist = Math.hypot(pos[0] * reach, Math.max(2.5, pos[1] * lift), pos[2] * reach);
        sun.shadow.camera.near = Math.max(0.5, dist - span * 1.5 - 8);
        sun.shadow.camera.far = dist + span * 1.5 + 8;
        sun.shadow.mapSize.set(2048, 2048);
        sun.shadow.bias = -0.0009;
        sun.shadow.normalBias = 0.035;
        sun.shadow.radius = 1.5 + weather.cloud * 4.5;
        group.add(sun);
        group.add(sun.target);
        R.sun = sun;
        // The sand's spray is drawn unlit, so it is told what light the sand is in.
        if (G3.sandfx) G3.sandfx.light(amb, sun, weather.wet || 0);
        if (G3.groundfx) G3.groundfx.light(amb, sun, weather.wet || 0);
        R.sunDir.set(pos[0] * reach, Math.max(2.5, pos[1] * lift), pos[2] * reach).normalize();

        var fill = new THREE.DirectionalLight(skyLight, 0.16 + weather.cloud * 0.10);
        fill.position.set(cx - pos[0], Math.abs(pos[1]) * 0.45, cz - pos[2]);
        fill.target.position.set(cx, 0, cz);
        group.add(fill);
        group.add(fill.target);
        // Kept with what they were lit at, for the bag to turn down (frame).
        R.courseLights = [amb, sun, fill];
        R.courseLights.forEach(function (l) {
            l.userData.base = l.intensity;
            // Counted in the picker's bag-only pass as well (passLights).
            l.layers.enable(1);
        });
        R.courseDim = 1;
    }

    /* The open picker is drawn in two passes (postfx.js `backdrop`): the
       course alone, blurred, and then the bag alone on top, each lit by its
       own lights and none of the other's. That used to be left to the
       layers — a light is only counted on a layer the camera is looking at —
       and a light that stops being counted is a different program for every
       lit material in the pass: opening the picker compiled the whole course
       and the whole bag a second time, and closing it a third. So every
       light is on both layers now, the count never changes, and a pass
       switches the other side's lights to nothing instead. `which` is
       'course', 'bag', or nothing for the ordinary single draw. */
    function passLights(which) {
        var c = which === 'bag' ? 0 : R.courseDim, i, l;
        for (i = 0; i < (R.courseLights || []).length; i++) {
            l = R.courseLights[i];
            l.intensity = l.userData.base * c;
        }
        if (G3.bag && G3.bag.lightPass) G3.bag.lightPass(which !== 'course');
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

    /* The near edge, held off the hole on a clear day.

       `fogScale` keeps the *far* edge beyond the hole, which is what stops a
       mist from swallowing the flag. It says nothing about where the air
       starts thickening, and on a clear sky that was forty-two units out —
       so on a sixty-unit par four the back half of the hole, the green with
       it, was already going pale from the tee, and from above every hole was
       the same green haze with a strip of course in the middle of it. The
       ground on the long game has shape now, and the fog was hiding it.

       So the near edge is at least the hole's own reach, scaled by how clear
       the sky is: the clearest one puts the whole hole in clean air, and a
       mist (fog 0.42) gets a quarter of that, which is less than it already
       had — so a mist is still exactly the mist it was. */
    function fogClear(hole, weather) {
        if (!hole || !hole.bounds) return 0;
        var clear = Math.max(0, Math.min(1, weather.fog / 1.75));
        return fogReach(hole) * clear * clear;
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
    /* The range's distance boards: a post at the left-hand edge of each
       target green with its distance on a board that always faces the camera.
       A sprite rather than a plane because the whole job is being read from
       the tee, fifty units off, at whatever angle the seat happens to be;
       unfogged for the same reason. The faces are drawn once and kept — there
       are five of them and the range is rebuilt every time it is entered, so
       making new ones each time would be five textures leaked a visit
       (disposeGroup frees materials, not the maps under them). */
    var boardFaces = {};

    function boardFace(text) {
        if (boardFaces[text]) return boardFaces[text];
        var cv = document.createElement('canvas');
        cv.width = 256;
        cv.height = 128;
        var c = cv.getContext('2d');
        // A painted yardage board: club green, a cream rule, cream figures.
        c.fillStyle = '#1f3a26';
        c.beginPath();
        if (c.roundRect) c.roundRect(4, 4, 248, 120, 8); else c.rect(4, 4, 248, 120);
        c.fill();
        c.lineWidth = 5;
        c.strokeStyle = '#ece3c8';
        c.stroke();
        c.fillStyle = '#ece3c8';
        // Three figures and a unit have to fit inside the frame.
        for (var px = 72; px > 40; px -= 4) {
            c.font = '800 ' + px + 'px "Barlow Semi Condensed", system-ui, sans-serif';
            if (c.measureText(text).width <= 216) break;
        }
        c.textAlign = 'center';
        c.textBaseline = 'middle';
        c.fillText(text, 128, 68);
        var t = new THREE.CanvasTexture(cv);
        t.anisotropy = 4;
        boardFaces[text] = t;
        return t;
    }

    function addBoards(g, hole) {
        var postMat = new THREE.MeshLambertMaterial({ color: 0xe8e2d0 });
        var postGeo = new THREE.CylinderGeometry(0.06, 0.06, 1.3, 6);
        /* Alternate sides, so from the tee the boards fan out either side of
           the line rather than queueing behind the nearest one; and a farther
           board is a bigger one, so all five read at about the same size. */
        hole.targets.forEach(function (t, i) {
            var x = i % 2 ? t.x1 + 0.7 : t.x0 - 0.7, z = (t.z0 + t.z1) / 2;
            var k = 0.55 + t.dist / G3.distance.scale(hole) * 0.02;   // off the units, not the words
            var post = new THREE.Mesh(postGeo, postMat);
            post.scale.y = k;
            post.position.set(x, 0.65 * k, z);
            g.add(post);
            var board = new THREE.Sprite(new THREE.SpriteMaterial({
                map: boardFace(t.dist + ' m'), fog: false, transparent: true
            }));
            board.scale.set(2 * k, 1 * k, 1);
            board.position.set(x, 1.3 * k + 0.5 * k, z);
            g.add(board);
        });
    }

    function buildHole(hole, themeName, weatherKind) {
        stopCelebration();
        // The cup this hole's greens are cut for (G3.holeR: a long hole's is smaller).
        R.cupR = G3.holeR(hole);
        R.cupD = G3.cupDepth(hole);
        var theme = G3.themeFor(themeName);
        var W = G3.weather;
        var weather = weatherKind || (W ? W.now : null) || { cloud: 0.4, fog: 1.3, sun: 1, amb: 1, sunSharp: 1, cloudTop: '#ffffff', cloudBase: '#b9c6d4', grade: {} };
        R.theme = theme;
        R.weather = weather;
        R.loopCam = null;
        R.dive = null;
        R.diveBH = null;
        R.lap = null;
        if (R.holeGroup) disposeGroup(R.holeGroup);
        R.movers = [];
        R.waterMats = [];
        R.lavaMats = [];
        R.crusts = [];
        // The black holes (see "the black hole"): every material, every
        // mouth with its sky portal, every well — and the camera that
        // watches a ball come out of the sky.
        R.holeMats = [];
        R.mouths = [];
        R.wells = [];
        R.warpCam = null;
        R.waterHidden = false;
        R.shells = [];
        R.canopies = [];
        R.bobbers = [];
        R.belts = [];
        R.posts = [];
        R.lamps = [];

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
        // ...and on a clear day the hole itself stands in clear air. See fogClear().
        R.fogNear = Math.max(R.fogNear, fogClear(hole, weather));
        R.fogFar = Math.max(R.fogFar, R.fogNear * 2.4);
        /* …and a theme with thin air in it (`air`, the mountain's) pushes the
           whole fade back, short of the surround's rim, so the ranges stand
           sharp against the sky rather than paling into it. */
        if (theme.air) {
            R.fogNear *= theme.air;
            R.fogFar = Math.min(R.fogFar * theme.air, 280);
        }
        R.scene.fog = new THREE.Fog(skyTint(theme.fog, weather, false), R.fogNear, R.fogFar);
        /* Everything that is the place rather than the hole — sky, ground
           out to the horizon, ridges, a world's set piece — goes in a group of
           its own, so that a hole played inside a live world (backdrop.mjs)
           can put all of it away at once and take it back if the world goes. */
        var og = new THREE.Group();
        g.add(og);
        R.outer = og;
        og.add(skyDome(theme, weather));
        lights(g, hole, theme, weather);
        var skirt = skirtPlan(hole, theme);
        addSurround(og, hole, theme, skirt);
        addSkirt(og, hole, theme, skirt);
        addRidges(og, hole, theme, weather);
        addRange(og, hole, theme, skirt);

        var i;
        // The country past the stakes is drawn as country (splitCountry).
        R.country = hole.open && hole.fence && hole.stakes !== false ? hole : null;
        /* A `ghost` pad or water is ground the live world already draws — a
           tour hole sculpted to its world's own terrain is played on that
           terrain, and only its tee, fairway and green are laid over it. So
           a ghost is built like anything else and put away while the world
           is on screen (stepPlace); without the world it is the ground. */
        /* …and what is laid over it is a `veil`: a strip, a tee or the
           green draped on that ground. With the world on screen every veil
           is put away like the ghost, and nothing takes its place: the
           world's own ground is the course, and the hole is the cup and the
           flag (addCup draws those on their own). Until v1.183.0 the strips
           were painted into the world's picture and the green was drawn
           over it, and on a phone they showed as a sheet laid on the world
           that came and went (the owner: "it overlaps the fairway… but
           sometimes it shows again… the hole don't have to have a green, it
           can just be a hole"). */
        R.ghosts = [];
        R.veils = [];
        var n0, sculpted = hole.pads.some(function (p) { return p.ghost; });
        for (i = 0; i < hole.pads.length; i++) {
            n0 = g.children.length;
            addPad(g, hole.pads[i], theme, hole.cup, hole.pads);
            if (hole.pads[i].ghost) while (n0 < g.children.length) R.ghosts.push(g.children[n0++]);
            else if (sculpted && hole.pads[i].inlay) {
                while (n0 < g.children.length) R.veils.push(g.children[n0++]);
            }
        }
        R.country = null;
        // What grows where the hole ends (addFringe), with the rest of the place.
        R.fringe = 0;
        addFringe(og, hole, theme);
        R.woods = 0;
        addWoods(og, hole, theme, skirt);
        // The grid on the floor is off the course, with the rest of the
        // scenery: in a live world it put a band of lines across the horizon.
        if (theme.grid) addGrid(og, hole, theme);
        if (theme.glow) addNeonBackdrop(og, hole, theme);
        if (hole.wells) addWells(g, hole, theme);
        // The grid world's effects switch on with the theme (see hitAt), and
        // its tail is drawn larger, because it is a light and not a smudge.
        R.glow = !!theme.glow;
        // The marks on the machinery, after the ground they are drawn on.
        for (i = 0; i < hole.pads.length; i++) {
            if (hole.pads[i].push) addBelt(g, hole.pads[i], theme);
            if (hole.pads[i].spring) addSpring(g, hole.pads[i], theme);
        }
        for (i = 0; i < (hole.warps || []).length; i++) addMouth(g, hole, hole.warps[i], theme);
        for (i = 0; i < (hole.loops || []).length; i++) addLoop(g, hole, hole.loops[i], theme);
        var bends = [];
        // Rails, trunks and rocks that stand still are gathered as they are
        // built and left as one mesh a material (stand, standAll).
        R.standing = {};
        for (i = 0; i < hole.walls.length; i++) {
            if (!hole.walls[i].bend) { addWall(g, hole.walls[i]); continue; }
            if (bends.indexOf(hole.walls[i].bend) < 0) {
                bends.push(hole.walls[i].bend);
                addBend(g, hole.walls[i].bend);
            }
        }
        standAll(g);
        for (i = 0; i < hole.water.length; i++) {
            n0 = g.children.length;
            addWater(g, hole.water[i], theme);
            if (hole.water[i].ghost) while (n0 < g.children.length) R.ghosts.push(g.children[n0++]);
        }
        for (i = 0; i < (hole.crusts || []).length; i++) addCrust(g, hole.crusts[i], hole, theme);
        addCup(g, hole, themeName);
        // No ring on the tee any more: it sat round the ball at every
        // address and said where the ball was while the ball said so itself
        // (the owner, v1.74.0).
        addStakes(g, hole, theme);
        for (i = 0; i < (hole.decor || []).length; i++) addDecor(g, hole.decor[i], theme, hole);
        // The long game's dressing, and what lives on it (life.js).
        if (G3.life) G3.life.build(g, hole, themeName, theme.surround === 'water', R.groundAt, R.groundMat);
        if (hole.targets) addBoards(g, hole);
        // A portal world's set piece, and the door past its flag (worlds.js).
        if (G3.worlds) G3.worlds.build(og, hole, theme);

        // The rain, the mist banks and whatever is drifting in the air are
        // parented to the hole, so the next hole disposes them with it.
        if (W) g.add(W.build(hole, theme, weather));
        /* A theme may carry a grade of its own over the weather's. Only the
           grid world does: the clear sky's bloom, made for sunlight on grass,
           took the bright lines and rails and spread them over the whole
           floor as a violet wash, with the rays on top of that. */
        if (R.fx) G3.postfx.setGrade(theme.grade ? Object.assign({}, weather.grade, theme.grade) : weather.grade);

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
            u.skyColour.value.copy(skyTint(theme.sky[1], weather, true)).lerp(lin(weather.cloudBase), weather.cloud * 0.8 * tintScale());
            // Overcast flattens the gradient as well as darkening it: a solid
            // deck reflects as one grey sheet, not as a dome with a bright top.
            u.skyTop.value.copy(skyTint(theme.sky[0], weather, true)).lerp(lin(weather.cloudBase), weather.cloud * 0.85 * tintScale());
            u.fogColour.value.copy(skyTint(theme.fog, weather, false));
        }
        if (R.sky) R.sky.uniforms.sunDir.value.copy(R.sunDir);
        if (R.ballMats) syncBallUniforms(R.ballMats, R.clock || 0, R.sunDir, theme, weather, R.fogNear, R.fogFar);

        setPlace(hole);
        R.scene.add(g);
        R.holeGroup = g;
        R.smooth.started = false;
        // Whatever was being flown over is no longer the course. game.js starts
        // the next one, if the player wants one at all.
        R.fly = null;
        R.wipe = null;
        // A new hole is a new world; nothing the last one's preview was
        // computed from can be assumed to mean the same thing.
        clearPathCache();
        R.clock = 0;
        clearRipples();
        R.cam.kick = 0;
        R.cam.speedPull = 0;
        R.launch = null;
        R.chase = null;
        R.above = null;
        R.lookSpring = null;
        R.liftS = null;
        R.drop = null;
        R.windup = null;
        R.blurK = 0;
        R.blurPrev = null;
        clearTrail();
        clearTracer();
        // The last hole's furrows and craters were in the last hole's sand.
        if (G3.sandfx) G3.sandfx.clear();
        if (G3.groundfx) G3.groundfx.clear(R.theme);
        // A hole changed with a ball inside a pipe would leave it shrunk.
        R.ball.scale.setScalar(1);
        R.ball.visible = true;
        warmPrograms();
    }

    /* Every shader the hole will need, compiled now.

       three.js compiles a material's program the first time it draws
       something wearing it, on the frame that needs it, and the page waits
       while the driver does it. Left to that, a hole was compiled a piece at
       a time while it was played: what the flyover showed on its first
       frame, then the bag, the club at the ball and the aim on the frame the
       sweep landed, then the spray off the first bounce, the ring round the
       cup, the sparks — each a stall at exactly the moment something was
       happening. A hole is built behind the loading screen or the wipe
       between two holes, where nobody is watching the frame rate, so the lot
       is compiled here instead: everything in the scene, shown or not.

       It only works because the list of lights no longer changes (bag.js
       `lightRig`, `passLights` above): a material's program is compiled for
       a count of lights, and this compiles for the one count there is. */
    function warmPrograms() {
        if (!R.renderer || !R.renderer.compile || !R.scene || !R.camera) return;
        var t0 = window.performance && performance.now ? performance.now() : 0;
        try {
            R.scene.updateMatrixWorld();
            R.renderer.compile(R.scene, R.camera);
            keepPrograms();
        } catch (e) { /* the first frame compiles whatever this did not */ }
        R.warmMs = (window.performance && performance.now ? performance.now() : 0) - t0;
    }

    /* …and kept, so the next hole does not compile them again.

       three.js counts the materials using a program and deletes it when the
       last one is disposed of — which is every time a hole is taken down,
       since a hole's materials are its own. The next hole then makes
       materials that want the very same programs (a rail is a rail: the
       colour is a uniform, not a different shader) and has them compiled
       afresh, twenty-odd of them behind every wipe between two holes. So
       each program is given one user that never lets go. A program is only
       ever reused by a material that asks for exactly its source and
       settings, so a kept one cannot be the wrong one; and there are only so
       many kinds of surface in the game, but the number kept is capped all
       the same, past which a program lives and dies with its materials as
       before. */
    var KEEP_PROGRAMS = 160;
    function keepPrograms() {
        var list = R.renderer.info.programs || [], i, n = 0;
        for (i = 0; i < list.length; i++) if (list[i].kept) n++;
        for (i = 0; i < list.length && n < KEEP_PROGRAMS; i++) {
            if (list[i].kept || list[i].usedTimes === undefined) continue;
            list[i].kept = true;
            list[i].usedTimes++;
            n++;
        }
    }

    /* ── the live world behind a tour hole ──────────────────────────────

       A hole that names a `place` is played inside a world from Portals,
       drawn by that project's own engine into a canvas of its own
       (backdrop.mjs has how). Here it is only a picture: the canvas becomes
       the scene's background, the hole's own sky and country are put away
       (R.outer), and the fog is pushed out past the hole so the far end of a
       green does not fade to a sky that is no longer there.

       All of it is conditional on the world actually being drawn this frame.
       While it is building, on a machine that cannot run it, or with live
       worlds switched off, `stepPlace` does nothing and the hole stands in
       its theme's own sky with worlds.js's simple set piece — a complete
       hole either way. */
    /* Live worlds are on at the start of every visit, on every device, and
       nothing carries an "off" over to the next one (the owner, v1.155.0,
       v1.167.1 and v1.186.1: "should always be on as default … each start it
       refreshes to on"). The switch in Settings and the frame-rate net in
       stepPlace turn them off for this visit alone (R.liveSession); the next
       page load is on again.

       Two things used to start a visit with them off, and both are gone:
       a stored '0' under 'golf3d.live', which the switch wrote and which a
       safety net once wrote too; and a mark backdrop.mjs leaves while a world
       builds, read at the next load as "the build killed the page" — but on
       a phone a tab closed while a world was loading leaves exactly that
       mark, so an ordinary visit turned the next one's worlds off. Both keys
       are cleared here so no old value lingers. */
    try { localStorage.removeItem('golf3d.live'); localStorage.removeItem('golf3d.worldBuilding'); } catch (e) { /* ignore */ }
    function liveWanted() {
        if (R.liveOverride !== undefined) return R.liveOverride;
        return R.liveSession !== false;
    }
    function setLive(on) {
        R.liveOverride = undefined;
        R.liveSession = on ? undefined : false;   // this visit only
        if (R.hole) setPlace(R.hole);
        return liveWanted();
    }

    function setPlace(hole) {
        R.hole = hole;
        var place = hole && hole.place && liveWanted() ? hole.place : null;
        R.place = place;
        if (place) {
            var yaw = Math.atan2(hole.cup.x - hole.tee.x, hole.cup.z - hole.tee.z);
            R.placeSeat = { x: hole.tee.x - Math.sin(yaw) * 9, y: (hole.tee.y || 0) + 4.2, h: 4.2,
                z: hole.tee.z - Math.cos(yaw) * 9, yaw: yaw,
                // the middle of the hole, for seating it on the world's ground
                cx: (hole.tee.x + hole.cup.x) / 2, cz: (hole.tee.z + hole.cup.z) / 2 };
        }
        if (place) {
            /* The hole's own ground plan, which the world never covers:
               each pad's box and a margin, up to eight of them. A hole of
               more pads than that, or one whose ground is the world's own
               (a `ghost` pad, hidden when the world is live — the ball rolls
               on rough that is only there as the world's picture), keeps
               its whole bounding box instead. */
            var boxes = [], all = [Infinity, Infinity, -Infinity, -Infinity], ghost = false, maxPadY = 0;
            var ghostHole = (hole.pads || []).some(function (p) { return p.ghost; });
            (hole.pads || []).forEach(function (p) {
                if (p.ghost) ghost = true;
                var py = (p.y || 0) + Math.max(0, (p.sx || 0) * (p.w || 0)) + Math.max(0, (p.sz || 0) * (p.d || 0));
                if (!p.ghost && py > maxPadY) maxPadY = py;
                // A pad is written from its corner; a round inlay from its middle.
                var m = 1.2, bx = p.w === undefined
                    ? [p.x - p.r - m, p.z - p.r - m, p.x + p.r + m, p.z + p.r + m]
                    : [p.x - m, p.z - m, p.x + p.w + m, p.z + p.d + m];
                all = [Math.min(all[0], bx[0]), Math.min(all[1], bx[1]), Math.max(all[2], bx[2]), Math.max(all[3], bx[3])];
                if (!p.ghost) boxes.push(bx);
            });
            R.placeKeep = boxes.length > 8 ? [all] : boxes;
            R.placeSoftY = ghostHole ? -1e9 : maxPadY + 1.5;
            /* Round the whole of a hole the world is set back a little
               (0.7 of a unit along the eye's line). A placed hole stands on
               the world's ground and a sculpted one's rough *is* that
               ground, seen as the world's picture over a baked copy that is
               smoother than the original; either way a wrinkle of ice or
               turf a hand high must not cut a rail or bury a ball. A tree,
               a stall or a pillar is far more than that in front, and still
               is. */
            R.placeSoft = [all[0] - 2.5, all[1] - 2.5, all[2] + 2.5, all[3] + 2.5];
            /* A sculpted hole hands the world two things (backdrop.mjs →
               sculpt): the ground it was baked to, so the world's own
               terrain is pressed to exactly that shape — a levelled tee is
               level in the world's picture too; and the strips laid on it,
               which the world clears of trees and stones, because the ball
               would roll through them. Nothing is painted on the world any
               more (v1.183.0): the plate's decals are left switched off, and
               the strips are only where the clearing is. */
            R.placeDecals = null;
            place.grid = null; place.clear = [];
            var gp = (hole.pads || []).filter(function (p) { return p.ghost && p.field && p.field[0] && p.field[0].grid; })[0];
            /* …except on a hole that asks for it (`hole.paint`, the forge's
               maps from batch 4: "these realistic maps must have some
               fairway and green to become good"). There the tee and the
               strips are painted the world's own grass, mown, and the green
               a lighter disc, into the world's picture: a change of colour
               in its ground, never a sheet on it. What came and went on a
               phone before v1.183.0 was the veils, rebuilt under a live
               world and not put away; they are put away every frame now. */
            /* The colour is the world's own (batch 5): each decal carries
               only what it is — [green?, 0, 0] — and the plate lifts and
               calms the world's pixel there, leaning it a little towards
               turf. Batch 4 laid turf's own #4c8f3a and #6fbd4c over every
               world at nine tenths, and six of the nine maps rated came back
               `ugly`: "Fairways color is way off and inorganic" (glowwood),
               "Fairway color is off" (the House of Four Seasons). A road
               (the fairway band, forge.js → `fairway`) is sent as its
               centreline and a negative corner, its half width. */
            var rects = [];
            if (gp) {
                (hole.pads || []).forEach(function (p) {
                    if (p.ghost || !p.inlay || p.w === undefined) return;
                    /* A road is cleared along its own band, not its box
                       (batch 6: a dogleg's slanted leg has a box twice its
                       width, and the trees cleared from it all stood where
                       the hole still has them hard or out — backdrop.mjs →
                       sculpt reads a 'cap' entry as a capsule). */
                    if (p.lane && p.lane.segs.every(function (g) { return !g.R; })) place.clear.push([p.lane.x0, p.lane.z0, p.lane.x1, p.lane.z1, 'cap', p.lane.hw + 0.8]);
                    else place.clear.push([p.x - 0.8, p.z - 0.8, p.x + p.w + 0.8, p.z + p.d + 0.8]);
                    if (!hole.paint) return;
                    if (p.lane) {
                        var L = p.lane;
                        rects.unshift([L.x0, L.z0, L.x1, L.z1, [0, 0, 0], -L.hw]);
                        return;
                    }
                    var gn = p.kind === 'green', e = gn ? 0.3 : 0;
                    rects.push([p.x - e, p.z - e, p.x + p.w + e, p.z + p.d + e, [gn ? 1 : 0, 0, 0], gn ? p.w / 2 + e : 1.4]);
                });
                place.grid = gp.field[0].grid;
                if (rects.length) R.placeDecals = { grid: place.grid, rects: rects.slice(0, 6), dirty: true };
            }
        }
        R.live = false;
        R.eventFired = false;
        if (G3.backdrop && G3.backdrop.rewind) G3.backdrop.rewind();
        if (R.plate) R.plate.visible = false;
        if (G3.backdrop) G3.backdrop.want(place ? place.world : null);
    }
    // backdrop.mjs is a module and arrives after the first hole is built.
    window.addEventListener('g3-backdrop', function () {
        if (G3.backdrop && G3.backdrop.setQuality) G3.backdrop.setQuality(R.quality);
        if (R.quality === 'auto') syncLiveScale();
        if (R.place && G3.backdrop) G3.backdrop.want(R.place.world);
    });

    /* Auto: a ladder the frame rate climbs and descends (CONFIG.QUALITY_AUTO).

       Each rung is a world resolution, a cap on this canvas's pixel ratio,
       the world's bloom and the grass shells. Frame time is read in windows
       of about three quarters of a second (the slowest tenth trimmed, so a
       one-off hitch is not a verdict): under ~44 fps steps down a rung, a
       steady ~57 fps for two windows steps back up. The first version of
       this (v1.169) could only fall from a resolution higher than before to
       a floor of 0.58, judged 90 frames at a time after three and a half
       seconds' wait, and napped five minutes after any drop that did not
       help — so on a phone it mostly sat at its sharpest and slowest. Now:

       - a drop that did not speed the frame up by 7% is undone (the
         bottleneck is not pixels; sharper is free) and drops wait 20 s;
       - a rise that has to be taken back within two windows holds rises
         off for 30 s, doubling to two minutes, so it does not see-saw;
       - a frame far too slow (under ~22 fps) takes two rungs at once;
       - nothing is judged while the next world is building in the
         background, nor for a moment after a rung changes (the resize).

       It runs on every hole, live world or not: the pixel ratio and the
       grass are this canvas's, and on a phone they are most of the cost.
       Named presets pin their rung outright and the governor stands aside. */
    var gov = {
        samples: [],
        lastNow: 0,
        settle: 3,
        lastDrop: null,     // { from, ms } — undone if the next window did not improve
        lastRise: 0,        // windows since the last rise (0 = none pending)
        dropHold: 0,        // performance.now() before which no drop
        riseHold: 0,        // …and no rise
        riseBack: 30000,    // how long a taken-back rise holds rises off
        goodWins: 0,
        badWins: 0,
        ms: 0
    };

    function govReset(settleSecs) {
        gov.samples.length = 0;
        gov.lastNow = 0;
        gov.settle = settleSecs === undefined ? 3 : settleSecs;
        gov.lastDrop = null;
        gov.lastRise = 0;
        gov.goodWins = 0;
        gov.badWins = 0;
    }

    function autoSteps() { return C.QUALITY_AUTO || [{ k: 0.8, maxW: 1440, dpr: 2, bloom: true, shells: SHELL_LAYERS }]; }

    function autoRung() {
        var S = autoSteps();
        return S[Math.max(0, Math.min(S.length - 1, R.autoStep || 0))];
    }

    // Puts the current rung (or the named preset) into effect.
    function syncLiveScale() {
        R.liveCoarse = !!(window.matchMedia && window.matchMedia('(pointer: coarse)').matches);
        var T = C.QUALITY_TIERS && C.QUALITY_TIERS[R.quality];
        if (T && R.quality !== 'auto') {
            R.liveK = R.liveKMax = T.liveK;
            R.liveMaxW = T.liveMaxW || 1600;
            return;
        }
        if (R.autoStep === undefined) R.autoStep = R.liveCoarse ? 1 : 0;
        var s = autoRung();
        R.liveK = R.liveKMax = s.k;
        // A phone's world is narrower than a desktop's at the same rung.
        R.liveMaxW = Math.round(s.maxW * (R.liveCoarse ? 0.85 : 1));
        if (G3.backdrop && G3.backdrop.setAutoBloom) G3.backdrop.setAutoBloom(s.bloom !== false);
    }

    function setAutoStep(n) {
        var S = autoSteps();
        n = Math.max(0, Math.min(S.length - 1, n));
        if (n === R.autoStep) return false;
        var dprWas = dprFor();
        R.autoStep = n;
        syncLiveScale();
        syncShellLayers();
        if (R.ready && dprFor() !== dprWas) resize();
        gov.samples.length = 0;
        gov.settle = Math.max(gov.settle, 0.8);
        return true;
    }

    function setQuality(q) {
        if (!C.QUALITY_TIERS || !C.QUALITY_TIERS[q]) q = 'auto';
        R.quality = q;
        gov.dropHold = gov.riseHold = 0;
        gov.riseBack = 30000;
        R.liveK = undefined;
        R.autoStep = undefined;
        syncLiveScale();
        govReset(2.0);
        if (G3.postfx && G3.postfx.setQuality) G3.postfx.setQuality(q);
        if (G3.backdrop && G3.backdrop.setQuality) G3.backdrop.setQuality(q);
        syncLiveScale();
        syncShellLayers();
        if (R.ready) resize();
        return R.quality;
    }

    var GOV_DOWN_MS = 22.5, GOV_PANIC_MS = 45, GOV_UP_MS = 17.6, GOV_WIN_S = 0.75;

    /* `at` is a test's own clock (govFeed, below); while a test holds the
       governor, the real frames leave it alone. */
    function stepGovernor(B, live, at) {
        if (at === undefined && R.govTest) return false;
        var now = at !== undefined ? at : performance.now();
        var rawDt = gov.lastNow ? (now - gov.lastNow) / 1000 : 0;
        gov.lastNow = now;
        if (R.quality !== 'auto' || (live && R.liveOverride)) return false;
        // Never judge steady-state frame rate while a next world is compiling in the background.
        if (B && B.building) {
            gov.samples.length = 0;
            gov.settle = Math.max(gov.settle, 1);
            return false;
        }
        // A tab coming back is not a frame. A long frame is counted, capped
        // (a lone hitch is trimmed off the window below), so a machine that
        // only manages a few frames a second is still judged and let down.
        if (rawDt <= 0 || rawDt > 1) return false;
        if (gov.settle > 0) { gov.settle -= Math.min(rawDt, 0.1); return false; }
        gov.samples.push(Math.min(rawDt, 0.25) * 1000);
        var span = 0, i;
        for (i = 0; i < gov.samples.length; i++) span += gov.samples[i];
        if (span < GOV_WIN_S * 1000 || gov.samples.length < 6) return false;
        var sorted = gov.samples.slice().sort(function (a, b) { return a - b; });
        gov.samples.length = 0;
        var keep = Math.max(1, Math.floor(sorted.length * 0.9)), sum = 0;
        for (i = 0; i < keep; i++) sum += sorted[i];
        var ms = gov.ms = sum / keep;
        var top = autoSteps().length - 1;

        // Did the last drop help? If not, pixels are not what is slow: undo it.
        if (gov.lastDrop) {
            var prev = gov.lastDrop;
            gov.lastDrop = null;
            if (ms >= prev.ms * 0.93) {
                setAutoStep(prev.from);
                gov.dropHold = now + 20000;
                return false;
            }
        }
        // A rise that is too much shows up in the next two windows.
        if (gov.lastRise) {
            if (ms > GOV_DOWN_MS) {
                gov.lastRise = 0;
                setAutoStep(R.autoStep + 1);
                gov.riseHold = now + gov.riseBack;
                gov.riseBack = Math.min(120000, gov.riseBack * 2);
                gov.goodWins = 0;
                return false;
            }
            if (++gov.lastRise > 2) gov.lastRise = 0;
        }

        if (ms > GOV_DOWN_MS) {
            gov.goodWins = 0;
            if (R.autoStep < top && now >= gov.dropHold) {
                var from = R.autoStep;
                setAutoStep(R.autoStep + (ms > GOV_PANIC_MS ? 2 : 1));
                gov.lastDrop = { from: from, ms: ms };
                gov.badWins = 0;
            } else if (live && ms > 83 && R.autoStep >= top) {
                gov.badWins++;
            }
        } else {
            gov.badWins = 0;
            if (ms < GOV_UP_MS && R.autoStep > 0 && now >= gov.riseHold) {
                if (++gov.goodWins >= 2) {
                    gov.goodWins = 0;
                    setAutoStep(R.autoStep - 1);
                    gov.lastRise = 1;
                }
            } else {
                gov.goodWins = 0;
            }
        }
        if (live && gov.badWins >= 3 && R.liveOverride === undefined) {
            gov.badWins = 0;
            // This visit only — see liveWanted.
            R.liveSession = false;
            setPlace(R.hole);
            window.dispatchEvent(new CustomEvent('g3-live-off', { detail: 'slow' }));
            return true;
        }
        return false;
    }

    // Synthetic frames for shader-tests.html: `n` frames of `ms` each.
    function govFeed(n, ms, live) {
        if (!R.govTest) { R.govTest = true; govReset(0); gov.lastNow = 1000; gov.dropHold = gov.riseHold = 0; }
        var t = gov.lastNow;
        for (var i = 0; i < n; i++) { t += ms; stepGovernor(null, !!live, t); }
        return R.autoStep;
    }
    function govRelease() { R.govTest = false; govReset(1); gov.dropHold = gov.riseHold = 0; gov.riseBack = 30000; }

    function stepPlace(dt, world) {
        var B = G3.backdrop, live = false;
        /* Something in the world that happens because of the golf: a place
           may name an `event`, and it is set going the first time the ball
           is that far from the tee towards the flag (half way, unless it
           says), or passes through its `gate` — a spot on the hole,
           [x, z, r] — or drops. The Marble Run's is the dominoes beside it
           going over in a wave, set off as the ball comes round the first
           turn. backdrop.mjs plays it; a new hole rewinds it. */
        if (R.place && R.place.event && B && B.play && world && world.ball && !R.eventFired) {
            var h = world.hole, tx = h.cup.x - h.tee.x, tz = h.cup.z - h.tee.z;
            var along = ((world.ball.x - h.tee.x) * tx + (world.ball.z - h.tee.z) * tz) / Math.max(1e-6, tx * tx + tz * tz);
            var eg = R.place.event.gate, hit;
            if (eg) hit = (world.ball.x - eg[0]) * (world.ball.x - eg[0]) + (world.ball.z - eg[1]) * (world.ball.z - eg[1]) < eg[2] * eg[2];
            else if (R.place.event.sink) hit = false;   // the drop alone sets it going
            else hit = along >= (R.place.event.at === undefined ? 0.5 : R.place.event.at);
            if (world.sunk || hit) {
                R.eventFired = true;
                B.play();
                if (R.live && R.place.event.say) window.dispatchEvent(new CustomEvent('g3-world-event', { detail: R.place.event.say }));
            }
        }
        if (R.place && B) {
            var cv = R.renderer.domElement;
            if (R.liveK === undefined) syncLiveScale();
            var k = Math.min(R.liveK, (R.liveMaxW || 1600) / Math.max(1, cv.width));
            R.camera.updateMatrixWorld();
            /* How far ahead of the camera the ball is, along the view: the
               world is drawn from just over half of that, so a bookcase, a
               pillar or a stair that stands between the camera and the ball
               is cut away rather than drawn across the shot (the owner's
               phone, the Orrery: a ball at the table's edge put the seat
               behind the library's card catalogue and showed only that). */
            var clear = 0;
            if (world && world.ball) {
                var cm = R.camera.matrixWorld.elements;
                clear = -((world.ball.x - cm[12]) * cm[8] + (world.ball.y - cm[13]) * cm[9] + (world.ball.z - cm[14]) * cm[10]) * 0.55;
                /* Except on the world's own line in the intro: Portals keeps
                   that clear of its things already, and cutting away half the
                   view to the ball out there would cut away the world the
                   sweep is there to show. It comes back over the landing. */
                if (R.fly && R.fly.plan.line) {
                    var fp = Math.min(1, R.fly.t / R.fly.plan.dur);
                    var fk = Math.max(0, Math.min(1, (fp - 0.7) / 0.3));
                    clear *= fk * fk;
                }
            }
            /* A riding hole (Endless) is not cut, or hardly. Its lane is on
               the world's own flight, which Portals keeps clear, but the
               world goes by under and round it: a cut that moved with the
               ball sliced the sea, the snow and the street under the lane
               into a flat edge with nothing behind it, and showed and hid
               the world's things as the camera followed the ball (the
               owner: "the occlusion sometimes is weird"). So the cut is a
               fifth of the way to the ball, which nothing under the lane
               is ever inside, and the rest of the way to the half is the
               plate's (`pushNear`): painted, but behind the hole, so a
               lamp or a branch that comes between is seen without hiding
               the shot. */
            /* A sculpted hole (the World Turtle's) is the same: its ground
               is the world's own, so a cut half way to the ball sliced the
               fairway between the camera and the ball into a flat edge
               with the sea and the waterfall under it showing (the owner's
               phone, Across the Shell: "clipping issues"). Same answer. */
            var push = 0;
            if (R.place.drift || R.place.grid) { push = clear; clear *= 0.36; }
            live = B.frame(dt, R.camera, R.place, R.placeSeat,
                Math.max(2, Math.round(cv.width * k)), Math.max(2, Math.round(cv.height * k)), clear);
        }
        if (stepGovernor(B, live)) return;
        if (live) {
            if (!R.plate) addWorldPlate(B);
            R.bgTex.needsUpdate = true;
            var u = R.plate.material.uniforms, I = B.info, P = R.camera.projectionMatrix.elements;
            u.size.value.set(I.w, I.h);
            u.wNear.value = I.near; u.wFar.value = I.far; u.scale.value = I.scale;
            u.pushNear.value = push;
            u.pA.value = P[10]; u.pB.value = P[14];
            u.invProj.value.copy(R.camera.projectionMatrixInverse);
            u.camWorld.value.copy(R.camera.matrixWorld);
            u.soft.value.set(R.placeSoft[0], R.placeSoft[1], R.placeSoft[2], R.placeSoft[3]);
            u.softY.value = R.placeSoftY !== undefined ? R.placeSoftY : -1e9;
            var D = R.placeDecals;
            u.decalOn.value = D ? 1 : 0;
            if (D && D.dirty) {
                D.dirty = false;
                if (R.gridTex) R.gridTex.dispose();
                var gd = new Float32Array(D.grid.nx * D.grid.nz * 4), gi;
                for (gi = 0; gi < D.grid.nx * D.grid.nz; gi++) gd[gi * 4] = D.grid.h[gi];
                R.gridTex = new THREE.DataTexture(gd, D.grid.nx, D.grid.nz, THREE.RGBAFormat, THREE.FloatType);
                R.gridTex.minFilter = R.gridTex.magFilter = THREE.NearestFilter;
                R.gridTex.needsUpdate = true;
                u.gridTex.value = R.gridTex;
                u.gridBox.value.set(D.grid.x0, D.grid.z0, D.grid.d, 0);
                u.gridN.value.set(D.grid.nx, D.grid.nz);
                for (gi = 0; gi < 6; gi++) {
                    var dr = D.rects[gi] || [0, 0, 0, 0, [0, 0, 0], 1.4];
                    u.decal.value[gi].set(dr[0], dr[1], dr[2], dr[3]);
                    u.decalTint.value[gi].set(dr[4][0], dr[4][1], dr[4][2], dr[5]);
                }
            }
            for (var kq = 0; kq < 8; kq++) {
                var kb = R.placeKeep[kq] || [0, 0, 0, 0];
                u.keep.value[kq].set(kb[0], kb[1], kb[2], kb[3]);
            }
            var gc = R.fx && G3.postfx && G3.postfx.ok ? G3.postfx.state.uComp : null;
            u.gOn.value = gc ? 1 : 0;
            if (gc) {
                u.gExp.value = gc.exposure.value; u.gSat.value = gc.saturation.value; u.gCon.value = gc.contrast.value;
                u.gTint.value.copy(gc.tint.value); u.gLift.value.copy(gc.lift.value);
            }
        }
        /* What the world's picture replaces is put away every frame, not
           only on the frame the world comes on: the hole is rebuilt under a
           live world now and then (a quality step changes the grass), and a
           rebuilt ghost or strip used to come back on top of the world and
           stay there — the sheet the owner saw over the sculpted holes that
           "sometimes shows again". */
        if (R.plate) R.plate.visible = live;
        if (R.outer) R.outer.visible = !live;
        for (var q = 0; q < (R.ghosts || []).length; q++) R.ghosts[q].visible = !live;
        // …and the strips and green laid on it: the world's own ground is the course.
        for (q = 0; q < (R.veils || []).length; q++) R.veils[q].visible = !live;
        // …and with no green drawn, the cup's own (addCup).
        if (R.cupMask) R.cupMask.visible = live && R.veils && R.veils.length > 0;
        if (live === R.live) return;
        R.live = live;
        if (live) govReset(3.5);
        if (live) {
            R.fogKeep = { near: R.fogNear, far: R.fogFar };
            R.fogNear = 400; R.fogFar = 1200;
        } else if (R.fogKeep) {
            R.fogNear = R.fogKeep.near; R.fogFar = R.fogKeep.far;
        }
    }

    /* The world's picture, and how far away each pixel of it is.

       backdrop.mjs hands over one canvas: the world as its camera saw it in
       the top half, and under it the distance to each pixel (16 bits on a
       log scale in red and green). This is one sheet across the whole view,
       drawn before anything else, that paints the picture and writes that
       distance into the depth buffer — in this camera's units, a world unit
       being `scale` of ours. Everything the game then draws is tested
       against it like any other geometry: a pillar of the world between
       the camera and the green is in front of the green.

       With one exception, which is the game. Whatever of the world stands
       inside the hole's own plan (`keep`, each pad's box and a margin) is painted
       but pushed to the far plane: the playing surface is never cut by a
       fold of somebody else's terrain, and a ball is never lost under it. */
    function addWorldPlate(B) {
        R.bgTex = new THREE.CanvasTexture(B.canvas);
        R.bgTex.minFilter = R.bgTex.magFilter = THREE.LinearFilter;
        R.bgTex.generateMipmaps = false;
        var mat = new THREE.ShaderMaterial({
            depthTest: true, depthWrite: true, depthFunc: THREE.AlwaysDepth, fog: false, toneMapped: false,
            uniforms: {
                map: { value: R.bgTex }, size: { value: new THREE.Vector2(2, 2) },
                wNear: { value: 0.1 }, wFar: { value: 5000 }, scale: { value: 1 },
                pA: { value: -1 }, pB: { value: -0.2 },
                invProj: { value: new THREE.Matrix4() }, camWorld: { value: new THREE.Matrix4() },
                keep: { value: [0, 1, 2, 3, 4, 5, 6, 7].map(function () { return new THREE.Vector4(); }) },
                soft: { value: new THREE.Vector4() }, softY: { value: -1e9 }, pushNear: { value: 0 },
                decalOn: { value: 0 },
                decal: { value: [0, 1, 2, 3, 4, 5].map(function () { return new THREE.Vector4(); }) },
                decalTint: { value: [0, 1, 2, 3, 4, 5].map(function () { return new THREE.Vector4(); }) },
                gridTex: { value: null }, gridBox: { value: new THREE.Vector4(0, 0, 1, 0) }, gridN: { value: new THREE.Vector2(1, 1) },
                gOn: { value: 0 }, gExp: { value: 1 }, gSat: { value: 1 }, gCon: { value: 1 },
                gTint: { value: new THREE.Color(1, 1, 1) }, gLift: { value: new THREE.Color(0, 0, 0) }
            },
            vertexShader: [
                'uniform mat4 invProj;',
                'varying vec2 vUv; varying vec3 vRay;',
                'void main() {',
                '    vUv = uv;',
                '    vec4 v = invProj * vec4(position.xy, 1.0, 1.0);',
                '    v.xyz /= v.w;',
                '    vRay = v.xyz / -v.z;',      // the view ray, one unit deep
                '    gl_Position = vec4(position.xy, 0.0, 1.0);',
                '}'
            ].join('\n'),
            fragmentShader: [
                'uniform sampler2D map; uniform vec2 size;',
                'uniform float wNear, wFar, scale, pA, pB, softY, pushNear;',
                'uniform mat4 camWorld; uniform vec4 keep[8]; uniform vec4 soft;',
                'uniform float gOn, gExp, gSat, gCon; uniform vec3 gTint, gLift;',
                'uniform float decalOn; uniform vec4 decal[6]; uniform vec4 decalTint[6];',
                'uniform sampler2D gridTex; uniform vec4 gridBox; uniform vec2 gridN;',
                'varying vec2 vUv; varying vec3 vRay;',
                // postfx.js's tone curve, backwards.
                'vec3 unaces(vec3 y) {',
                '    vec3 a = 2.43 * y - 2.51, b = 0.59 * y - 0.03, c = 0.14 * y;',
                '    return (-b - sqrt(max(b * b - 4.0 * a * c, 0.0))) / (2.0 * a);',
                '}',
                // One over the distance to one texel of the depth half, in
                // this game's units; nothing there is nought.
                'float inv(vec2 t) {',
                '    t = clamp(t, vec2(0.0), size - 1.0);',
                '    vec3 e = texture2D(map, vec2((t.x + 0.5) / size.x, 0.5 * (t.y + 0.5) / size.y)).rgb;',
                '    float n = (floor(e.r * 255.0 + 0.5) * 256.0 + floor(e.g * 255.0 + 0.5)) / 65534.0;',
                '    return n < 0.9995 ? scale / (wNear * pow(wFar / wNear, n)) : 0.0;',
                '}',
                'void main() {',
                '    vec2 cuv = vec2(vUv.x, 0.5 + 0.5 * clamp(vUv.y, 0.75 / size.y, 1.0));',
                '    vec3 c = texture2D(map, cuv).rgb;',
                '    c = pow(c, vec3(2.2));',
                /* The depth half. Four texels round the pixel, each read at
                   its own centre and decoded, then blended as 1/distance
                   (sky is 0): where the world's outline crosses the hole
                   the edge is a line through the texels, not their
                   staircase. */
                '    vec2 dp = vUv * size - 0.5, df = fract(dp), dt = floor(dp);',
                '    float i00 = inv(dt), i10 = inv(dt + vec2(1.0, 0.0)), i01 = inv(dt + vec2(0.0, 1.0)), i11 = inv(dt + vec2(1.0, 1.0));',
                '    float minI = min(min(i00, i10), min(i01, i11)), maxI = max(max(i00, i10), max(i01, i11));',
                '    float iz = minI > maxI * 0.8 ? mix(mix(i00, i10, df.x), mix(i01, i11, df.x), df.y) : inv(floor(vUv * size));',
                '    float depth = 0.9999995;',
                '    vec3 pc = vec3(0.0); float pa = 0.0, pg = 0.0, stripe = 0.0;',
                '    if (iz > 0.00002) {',
                '        float z = 1.0 / iz;',
                '        vec3 at = (camWorld * vec4(vRay * z, 1.0)).xyz;',
                '        bool ours = false;',
                '        for (int i = 0; i < 8; i++) {',
                '            vec4 k = keep[i];',
                '            if (at.x > k.x && at.x < k.z && at.z > k.y && at.z < k.w) ours = true;',
                '        }',
                // `clear` (c.near in stepPlace/backdrop) drops world geometry between the
                // camera and the ball; on non-sculpted holes, ground scatter just
                // beyond c.near (such as Spore Rain's leaves around the tee) still
                // pokes above the tee pad unless pushed behind the course here.
                // A riding hole pushes further: everything short of half the
                // way to the ball (`pushNear`, set where the cut is).
                // (It once held only while nothing was painted; v1.222.0 paints the
                // forge's maps and keeps the push, as every sculpted hole has had it.)
                '        if (z < max(6.2, pushNear)) ours = true;',
                /* The mown ground of a sculpted hole is not a sheet laid on
                   the world: it is paint on the world's own picture. This
                   pixel of the world is at `at` in the hole's own
                   coordinates; if that is on the hole's ground (within a
                   stride of the baked height there) and inside a tee, the
                   fairway or the green, it is mown: its own colour softened,
                   lifted and leant a little towards turf (below, after the
                   grade is undone), striped the way a mower leaves it, with
                   a soft edge that wanders a little. So a
                   fairway follows every fold of the land exactly, because
                   it is the land. */
                '        if (decalOn > 0.5) {',
                '            vec2 gq = (at.xz - gridBox.xy) / gridBox.z;',
                '            if (gq.x > -0.5 && gq.y > -0.5 && gq.x < gridN.x - 0.5 && gq.y < gridN.y - 0.5) {',
                '                float gh = texture2D(gridTex, (floor(gq + 0.5) + 0.5) / gridN).r;',
                // On the ground and nothing standing on it: the world is pressed to the
                // grid to a few hundredths (forge-sculpt), and at 1.3 the paint climbed
                // a sauropod's legs and the foot of every trunk.
                '                if (abs(at.y - gh) < 0.3) {',
                /* Edges that wander the way mown grass does: two slow waves
                   and a quicker one, a few tenths of a unit at most. */
                '                    float wob = 0.22 * sin(at.x * 0.9 + at.z * 0.45) * sin(at.z * 0.7 - at.x * 0.3) + 0.08 * sin(at.x * 3.1 - at.z * 2.3);',
                '                    for (int j = 0; j < 6; j++) {',
                '                        vec4 k = decal[j]; vec4 t = decalTint[j];',
                '                        float d;',
                '                        if (t.w < 0.0) {',
                // A band: the distance to its centreline, less its half width (a road, round-ended).
                '                            vec2 ab = k.zw - k.xy;',
                '                            float h = clamp(dot(at.xz - k.xy, ab) / max(dot(ab, ab), 1e-4), 0.0, 1.0);',
                '                            d = length(at.xz - k.xy - ab * h) + t.w;',
                '                        } else {',
                // A rounded box, its corner the fourth number: the green's is half its side, a disc.
                '                            float rc = min(t.w, 0.5 * min(k.z - k.x, k.w - k.y));',
                '                            vec2 q = abs(at.xz - 0.5 * (k.xy + k.zw)) - 0.5 * (k.zw - k.xy) + rc;',
                '                            d = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - rc;',
                '                        }',
                '                        float a = (1.0 - smoothstep(-0.5, 0.45, d + wob)) * step(0.001, abs(k.z - k.x) + abs(k.w - k.y));',
                '                        pa = max(pa, a); pg = max(pg, a * t.r);',
                '                    }',
                /* Mown grass is calmer than what grows round it: the world's
                   own picture there, softened over a few texels. */
                '                    if (pa > 0.001) {',
                '                        vec2 tx = vec2(3.5 / size.x, 1.75 / size.y);',
                // Never below the picture's own half: under it is the depth, packed into red and green, and a tap there painted the foot of the screen crimson.
                '                        float ylo = 0.5 + 0.75 / size.y;',
                '                        pc = 0.25 * (pow(texture2D(map, cuv + vec2(tx.x, 0.0)).rgb, vec3(2.2)) + pow(texture2D(map, cuv - vec2(tx.x, 0.0)).rgb, vec3(2.2)) +',
                '                                     pow(texture2D(map, min(cuv + vec2(0.0, tx.y), vec2(1.0))).rgb, vec3(2.2)) + pow(texture2D(map, vec2(cuv.x, max(cuv.y - tx.y, ylo))).rgb, vec3(2.2)));',
                '                        c = mix(c, pc, 0.85 * pa);',
                '                        stripe = smoothstep(-0.2, 0.2, sin(at.z * 1.9 + at.x * 0.3));',
                '                    }',
                '                }',
                '            }',
                '        }',
                '        if (at.x > soft.x && at.x < soft.z && at.z > soft.y && at.z < soft.w) { if (at.y < softY) ours = true; z += 0.7; }',
                '        if (!ours) depth = clamp(0.5 * (pB - pA * z) / z + 0.5, 0.0, 0.9999995);',
                '    }',
                /* The paint, from the world's own colour. What makes a fairway
                   read is that it parts from what grows round it, and which
                   way depends on the world: on dark ground it is lighter, on
                   anything brighter (leaves, sand, snow, paper) darker — with
                   no middle where the two cancel, which hid it on the Tree
                   City's leaves at first — a green more so
                   than a fairway. Its hue is the world's, a touch richer and
                   leaning only a little towards turf, and it is striped the
                   way a mower leaves it. Batch 4's paint was turf's own
                   green at nine tenths, and on a violet night or on snow
                   that was "way off and inorganic"; a first try at only
                   lifting the world's colour could not be seen on either.
                   Done on the world's picture as it arrived, before the grade
                   is undone: undone, bright ground is past white, and snow
                   darkened by a fifth was still white. */
                '    if (pa > 0.001) {',
                // In perceptual lightness, so the parting is as plain on a night as on snow.
                '        vec3 g = pow(max(c, 0.0), vec3(1.0 / 2.2));',
                '        float l = max(dot(g, vec3(0.2126, 0.7152, 0.0722)), 1e-3), gk = pg / pa;',
                '        float br = smoothstep(0.24, 0.34, l);',
                '        float lt = mix(l * mix(1.35, 1.6, gk) + mix(0.05, 0.08, gk), l * mix(mix(0.74, 0.84, smoothstep(0.7, 0.9, l)), 0.66, gk), br);',
                '        lt *= 1.0 + mix(0.07, 0.0, gk) * (stripe - 0.5);',
                '        vec3 s = max(mix(vec3(l), g, 1.1), 0.0) * (lt / l);',
                '        s = mix(s, vec3(0.45, 0.68, 0.36) * (lt / 0.6), mix(0.2, 0.28, gk));',
                '        c = mix(c, pow(clamp(s, 0.0, 0.97), vec3(2.2)), pa * 0.95);',
                '    }',
                /* The world arrives graded by its own makers, and this
                   game's grade (postfx.js: tone curve, tint, saturation,
                   contrast) is about to be laid over the whole frame. So the
                   picture is put through that grade backwards first, and
                   comes out the other side the colour it went in. The
                   brightest end is held back: undone exactly it would be
                   several times white, and bloom a second time. */
                '    if (gOn > 0.5) {',
                '        c = (c - 0.5) / gCon + 0.5;',
                '        float l = dot(c, vec3(0.2126, 0.7152, 0.0722));',
                '        c = mix(vec3(l), c, 1.0 / gSat);',
                '        c = clamp((c - gLift) / max(gTint, vec3(0.05)), 0.0, 0.93);',
                '        c = unaces(c) / max(gExp, 0.05);',
                '    }',
                '    gl_FragDepth = depth;',
                '    gl_FragColor = vec4(c, 1.0);',
                '    #include <encodings_fragment>',
                '}'
            ].join('\n')
        });
        mat.extensions = { fragDepth: true };
        R.plate = new THREE.Mesh(new THREE.PlaneBufferGeometry(2, 2), mat);
        R.plate.frustumCulled = false;
        R.plate.renderOrder = -1e6;
        R.plate.visible = false;
        R.scene.add(R.plate);
    }

    /* ── per-frame ──────────────────────────────────────────────────────── */

    // Walls that move are placed from the same function the solver uses.
    // The box is read and thrown away in the same two lines, so it is handed
    // somewhere to land: wallBox allocates when it is not.
    var _box = {};
    function syncMovers(t) {
        var i, m, B;
        for (i = 0; i < R.movers.length; i++) {
            m = R.movers[i];
            if (m.rotor) {
                // Sails turn by the angle physics.millSail reads the tip off.
                m.rotor.rotation.z = t * m.wall.sails.speed + (m.wall.sails.phase || 0);
                continue;
            }
            B = P.wallBox(m.wall, t, _box);
            m.mesh.position.set(B.cx, B.base + m.h / 2, B.cz);
            m.mesh.rotation.y = B.yaw;
            if (m.fade) {
                var a = trainSeen(m.wall, t), j;
                if (a !== m.seen) {
                    m.seen = a;
                    m.mesh.visible = a > 0;
                    for (j = 0; j < m.fade.length; j++) m.fade[j].opacity = a;
                }
            }
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

    /* How big the ball, the club at it and the trail behind it are drawn, as
       a share of the mesh's size (which is the mini golf ball): the hole's own
       ball (G3.ballR), so on a long hole a smaller one — the same size from
       the tee to the cup, because it is the same size in the physics
       (CONFIG.LONG_BALL). Nothing eases and nothing waits for the ball to
       stop: there is no other size for it to go to. */
    function lookFor(hole) { return G3.ballR(hole) / C.BALL_R; }
    /* How far back the seat is, as a share of the mini golf seat: SEAT on a
       long hole, everywhere on it, so the ball keeps one share of the screen. */
    function seatLook(hole) { return G3.longHole(hole) ? C.LONG_BALL.SEAT : 1; }
    /* How far the follow seat leads down the line (CONFIG.LONG_SEAT): 0 on
       anything but the long game and near the cup, 1 far from it. Drawn long
       holes and the ones hung in a world alike: it is a question of how much
       hole there is in front of the ball, not of the scale it is drawn at. */
    function seatLead(hole, ball) {
        if (!hole || !hole.longGame || !hole.cup || !ball) return 0;
        var L = C.LONG_SEAT;
        var d = Math.sqrt((ball.x - hole.cup.x) * (ball.x - hole.cup.x) + (ball.z - hole.cup.z) * (ball.z - hole.cup.z));
        var t = Math.max(0, Math.min(1, (d - L.NEAR) / (L.FAR - L.NEAR)));
        return t * t * (3 - 2 * t);
    }
    R.look = 1;

    function rollBall(pos) {
        var dx = pos.x - R.lastBall.x, dz = pos.z - R.lastBall.z;
        var d = Math.hypot(dx, dz);
        var s = R.look = lookFor(R.hole);
        // A unit in a frame is not a roll, it is a pipe: the ball crossing the
        // hole to the sky portal, unseen, would otherwise spin fifty turns.
        if (d > 1e-5 && d < 1) {
            R.ball.rotateOnWorldAxis(_axis.set(dz / d, 0, -dx / d), d / (C.BALL_R * s));
        }
        R.lastBall.set(pos.x, pos.y, pos.z);
        R.ball.scale.setScalar(s);
        R.ball.position.set(pos.x, pos.y, pos.z);
        nestBall(pos);
    }

    /* The grass parted round the ball (shaders.js → the turf's nest): on a
       long hole only, NEST balls across, at the ball's underside. The mini
       golf ball stands over its green's mat and needs none. */
    var NEST = 5;
    function nestBall(pos) {
        var n = R.nest.value;
        if (!R.hole || !G3.longHole(R.hole)) { n.w = 0; return; }
        var br = G3.ballR(R.hole);
        n.set(pos.x, pos.y - br, pos.z, br * NEST);
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
    var _path = { valid: false, x: 0, y: 0, z: 0, yaw: 0, power: 0, loft: 0, over: 0, bend: 0, spin: 0, bite: 0, topped: false, t: 0 };

    function clearPathCache() { _path.valid = false; }

    function pathStale(world, aim) {
        var b = world.ball;
        // A hole with nothing moving on it has a path that does not depend
        // on the clock at all, so it is not in the comparison.
        var t = R.movers.length ? Math.floor(world.time * PATH_HZ) : 0;
        if (_path.valid && _path.x === b.x && _path.y === b.y && _path.z === b.z &&
            _path.yaw === aim.yaw && _path.power === aim.power &&
            _path.loft === aim.loft && _path.over === (aim.over || 0) &&
            _path.bend === (aim.bend || 0) && _path.spin === (aim.spin || 0) &&
            _path.bite === (aim.bite || 0) && _path.topped === !!aim.topped && _path.t === t) return false;
        _path.valid = true;
        _path.x = b.x; _path.y = b.y; _path.z = b.z;
        _path.yaw = aim.yaw; _path.power = aim.power; _path.loft = aim.loft;
        _path.over = aim.over || 0;
        // A shaped shot (swing.js) is the same aim on a different flight.
        _path.bend = aim.bend || 0; _path.spin = aim.spin || 0; _path.bite = aim.bite || 0; _path.topped = !!aim.topped;
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
        // The long game's air is a real flight, longer in time over the same
        // ground by 3.4 over its pace (CONFIG.AIR); the cone is cut by distance.
        if (G3.longHole(world.hole)) seconds *= Math.max(1, 3.4 / P.airPace());
        var pts = P.previewPath(world, aim.yaw + (aim.bend || 0), aim.power, aim.loft, seconds, aim.bite, aim.spin, aim.topped);

        /* Under MIN_POWER there is no shot to preview: launch() refuses it and
           previewPath hands back nothing. Park the cone and the arrowhead
           rather than reading the last point of an empty path — which is what
           a freshly loaded hole does until the player winds a swing on. The
           wedge is drawn only when there is no shot, so the shot preview never
           carries a duplicate arrow. */
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
        // The arrow is only up before a shot is loaded (the cone takes over),
        // so it can afford the room for three chevrons rather than one.
        var arrowLen = Math.max(1.5, len);
        var halfW = 0.11 + frac * 0.05;
        var y = b.y - G3.ballR(world.hole) + 0.02;

        /* Green through amber to red as the swing fills, hard red once it is
           into the last of it, and brighter still once the meter is past a
           full swing — aim.over is 0 up to the club's ceiling and 1 at the end
           of the overdraw, so the arrow only glows for a shot that is actually
           being thrashed. */
        var over = Math.max(0, Math.min(1, aim.over || 0));
        var hot = over > 0 || frac > C.OVERSWING;
        var hue = hot ? 0 : 0.33 * (1 - frac / C.OVERSWING);
        // Pale at a tap, filling with colour as the swing loads.
        R.arrow.material.color.setHSL(hue, hot ? 0.85 : 0.35 + 0.5 * frac / C.OVERSWING,
            hot ? 0.62 + over * 0.16 : 0.7 - 0.12 * frac / C.OVERSWING);

        // The path is the expensive half of this function, and most frames
        // do not need it recomputed — see updatePath.
        if (pathStale(world, aim)) updatePath(world, aim, frac);

        // The ground arrow only shows the aim line before a shot is loaded;
        // once the preview cone and arrowhead are active, hide it so the two
        // arrowheads never overlap.
        R.arrow.visible = !R.pathCone.visible;

        if (R.arrow.visible) {
            // The strip: two triangles, written straight into the buffer so
            // nothing is allocated per frame.
            var px = -dirZ, pz = dirX;   // perpendicular
            var a = R.arrow.geometry.attributes.position.array;
            function put(i, sx, sz) {
                a[i * 3] = b.x + dirX * sx + px * sz;
                a[i * 3 + 1] = y;
                a[i * 3 + 2] = b.z + dirZ * sx + pz * sz;
            }
            var w = halfW * 2.4;
            /* Drawn at the ball's size (`lookFor`); the shader is handed the
               unscaled numbers, so its chevrons shrink with the strip. */
            var lk = R.look, wl = w * lk, ll = arrowLen * lk;
            put(0, 0, -wl); put(1, 0, wl); put(2, ll, wl);
            put(3, 0, -wl); put(4, ll, wl); put(5, ll, -wl);
            var u = R.arrow.material.uniforms;
            u.len.value = arrowLen; u.halfW.value = w; u.time.value = R.clock;
            R.arrow.geometry.attributes.position.needsUpdate = true;
            R.arrow.geometry.computeBoundingSphere();
        }
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
        if (mode === 'flight') return 'Flight';
        if (mode === 'over') return 'Overview';
        if (mode === 'side') return 'Side on';
        return mode === 'demo' ? 'Demo' : 'Follow';
    }

    function enterFlight() {
        var c = R.cam;
        if (c.mode === 'flight') return false;
        c.preFlightMode = VIEWS.indexOf(c.mode) >= 0 ? c.mode : 'follow';
        R.fly = null;
        R.wipe = null;
        R.lap = null;
        var pos, tgt;
        if (!R.smooth.started && R.hole && R.hole.tee) {
            var tee = { x: R.hole.tee.x, y: R.hole.tee.y || 0, z: R.hole.tee.z };
            var s = seatFor(R.hole, tee, _seat);
            pos = { x: s.px, y: s.py, z: s.pz };
            tgt = { x: s.tx, y: s.ty, z: s.tz };
        } else {
            pos = R.camera ? R.camera.position : R.smooth.pos;
            tgt = R.smooth.target;
        }
        c.flight.x = pos.x;
        c.flight.y = Math.max(0.5, pos.y);
        c.flight.z = pos.z;
        var dx = tgt.x - pos.x, dy = tgt.y - pos.y, dz = tgt.z - pos.z;
        var horiz = Math.sqrt(dx * dx + dz * dz);
        c.flight.yaw = horiz > 1e-4 ? Math.atan2(dx, dz) : c.yaw;
        c.flight.pitch = Math.max(-1.45, Math.min(1.45, Math.atan2(dy, Math.max(1e-4, horiz))));
        c.mode = 'flight';
        return true;
    }

    function exitFlight() {
        var c = R.cam;
        if (c.mode !== 'flight') return false;
        c.mode = c.preFlightMode || 'follow';
        return true;
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
    /* …and lifted over the bank behind it, if there is one. The Snow
       Globe's tee is at the foot of the glass, which curves up behind it
       to a rail at 1.8: the seat, nine units back and four up, looked at
       the ball through the bank, and the whole picture under the firs was
       a white wall (the owner: "can't see the hole for the flag", `edges`,
       v1.219.0). So the line from the seat to what it looks at is sampled
       over the ground, and the seat goes up by as much as it takes for
       that line to clear the ground under it by SIGHT_CLEAR (a rail's
       height and a little). On the holes with nothing behind the ball
       higher than the ball, which is nearly all of them, it is zero.

       Only ground standing above the ball counts. As first written every
       sample did, and the line ends a third of a unit over the turf at the
       ball, so the sample next to it was always short and its shortfall was
       divided by 1/9: every seat on every hole went up 1.7 units, and the
       long game's, which is closer in, about five (Coral Keys' tee looked
       sixty degrees down; the owner, v1.221.0: "why does the starting camera
       look into the ground?"). A bank behind the ball is above it; level
       ground, or ground falling away behind the tee, is not. */
    var SIGHT_CLEAR = 1.1;
    function sightLift(hole, ball, tx, ty, tz, px, py, pz) {
        var lift = 0, i, s, g, need;
        for (i = 1; i <= 8; i++) {
            s = i / 9;
            g = P.surfaceTop(hole, tx + (px - tx) * s, tz + (pz - tz) * s);
            if (!g || g.y <= ball.y) continue;
            need = g.y + SIGHT_CLEAR - (ty + (py - ty) * s);
            if (need > 0) lift = Math.max(lift, need / s);
        }
        /* …and on a long hole, the top of the ball over a rise, grass and
           all. The long game's ball is under half the mini golf one
           (CONFIG.LONG_BALL), so its middle is barely over the turf, and the
           test above lets through every crest that is lower than that middle
           while still higher than the ball's top: from the seat, which on a
           long hole is low and close (LONG_BALL.SEAT), the ball and the club
           head behind it went under the rise, the shaft ending in the grass
           (the owner, v1.254.1: "some clipping now"). So here the line is to
           the top of the ball, and the ground stands as tall as the grass
           drawn on it (grassLift). Level ground asks for nothing: from the
           first sample out the line is already over the tallest rough. */
        if (G3.longHole(hole)) {
            var bt = ball.y + G3.ballR(hole);
            for (i = 1; i <= 8; i++) {
                s = i / 9;
                g = P.surfaceTop(hole, ball.x + (px - ball.x) * s, ball.z + (pz - ball.z) * s);
                if (!g) continue;
                need = g.y + grassLift(g.pad.kind) + SIGHT_TOP - (bt + (py - bt) * s);
                if (need > 0) lift = Math.max(lift, need / s);
            }
        }
        return Math.min(lift, 8);
    }
    var SIGHT_TOP = 0.03;

    /* The lift over a bank, eased (CONFIG.SIGHT_EASE). It is read off the
       ground a few points along the line to the ball, so on ground that
       steps — the Pop-Up Book's folded paper — it steps too: half a unit
       in a frame, which the seat's own easing turned into the eye leaping
       off at once (the owner's phone: "very jarring"). On a spring with no
       give-away of how fast it was asked to move, so the seat comes up and
       goes down with no corner in it. Only when updateCamera is asking, on
       a frame of its own (`R.seatDt`); anyone else asking where the seat
       is — the intro's last key, the flight's start — gets the lift as it
       is, and the spring starts again from there. */
    function easedLift(raw) {
        var S = R.liftS, dt = R.seatDt, w = C.SIGHT_EASE;
        if (!dt || !S || !w) { R.liftS = { y: raw, v: 0 }; return raw; }
        var n = Math.max(1, Math.ceil(dt / (1 / 120))), h = dt / n, i;
        for (i = 0; i < n; i++) {
            S.v += (w * w * (raw - S.y) - 2 * w * S.v) * h;
            S.y += S.v * h;
        }
        return Math.max(0, S.y);
    }

    /* The windup's weight, on a critically damped spring (LONG_CAM.WINDUP
       per second) so the camera sets off and settles with no corner in it.
       Held at 1 through the strike until the chase has the shot; let go of,
       or ended, it goes back to 0. */
    function setWindup(on) {
        if (!R.windup) R.windup = { on: false, w: 0, v: 0 };
        R.windup.on = !!on;
    }
    function stepWindup(dt) {
        var W = R.windup;
        if (!W || dt <= 0) return;
        if (R.chase) { W.on = false; W.w = 0; W.v = 0; return; }
        var want = W.on && R.cam.mode === 'follow' && chaseRides() ? 1 : 0, w = C.LONG_CAM.WINDUP;
        var n = Math.max(1, Math.ceil(dt / (1 / 120))), h = dt / n, i;
        for (i = 0; i < n; i++) {
            W.v += (w * w * (want - W.w) - 2 * w * W.v) * h;
            W.w += W.v * h;
        }
        if (W.w < 0) { W.w = 0; W.v = Math.max(0, W.v); }
        if (W.w > 1) { W.w = 1; W.v = Math.min(0, W.v); }
    }

    /* The follow seat's pitch that keeps the flag in the picture: the
       steepest one, no steeper than `most`, from which the top of the pin
       (FIT.TOP over the cup) is still below FIT.NDC of the frame — under the
       HUD rather than behind it. Measured off seatFor itself, at the aim
       `yaw` the turn is heading for, rather than off a second copy of the
       seat arithmetic. Never below FIT.MIN: a pin far down a long hole is a
       speck either way, and a flat seat would trade the ground in front of
       the ball for it. Used by game.js's turn to the cup after every stroke
       (the owner: "the auto adjust aim would also be nice if it adjusted the
       vertical angle a bit as well"). */
    var _fitCam = new THREE.PerspectiveCamera(), _fitSeat = {}, _fitP = new THREE.Vector3();
    function fitPitch(hole, ball, yaw, most) {
        var c = R.cam, F = C.AIM_PITCH_FIT;
        if (!hole || !hole.cup || !ball || c.mode !== 'follow' || c.lock) return most;
        /* Everything seatFor reads that is not the seat itself is set aside
           and put back: the flinch, the speed pull, the chase and windup
           weights, and the bank lift's spring, which a seatFor outside
           updateCamera restarts from wherever it is asked (easedLift). */
        var keep = { yaw: c.yaw, pitch: c.pitch, kick: c.kick, pull: c.speedPull,
                     chase: R.chase ? R.chase.w : 0, wind: R.windup ? R.windup.w : 0,
                     lift: R.liftS ? { y: R.liftS.y, v: R.liftS.v } : null, dt: R.seatDt };
        c.yaw = yaw; c.kick = 0; c.speedPull = 0; R.seatDt = 0;
        if (R.chase) R.chase.w = 0;
        if (R.windup) R.windup.w = 0;
        _fitCam.fov = R.camera.fov; _fitCam.aspect = R.camera.aspect;
        _fitCam.near = R.camera.near; _fitCam.far = R.camera.far;
        _fitCam.updateProjectionMatrix();
        var top = hole.cup.y + F.TOP, p = most, fits = false, best = most;
        for (; p > F.MIN; p -= 0.02) {
            c.pitch = p;
            seatFor(hole, ball, _fitSeat);
            /* Flatter is lower, and lower is into whatever stands behind the
               ball: a bunker's face, a dune. Once the eye or its line to the
               ball would be in the ground, it goes no flatter. */
            if (!fitClear(hole, _fitSeat)) break;
            best = p;
            _fitCam.position.set(_fitSeat.px, _fitSeat.py, _fitSeat.pz);
            _fitCam.lookAt(_fitSeat.tx, _fitSeat.ty, _fitSeat.tz);
            _fitCam.updateMatrixWorld();
            _fitP.set(hole.cup.x, top, hole.cup.z).project(_fitCam);
            if (_fitP.z < 1 && _fitP.y <= F.NDC) { fits = true; break; }
        }
        c.yaw = keep.yaw; c.pitch = keep.pitch; c.kick = keep.kick; c.speedPull = keep.pull;
        if (R.chase) R.chase.w = keep.chase;
        if (R.windup) R.windup.w = keep.wind;
        R.liftS = keep.lift; R.seatDt = keep.dt;
        return fits ? p : best;
    }
    function fitClear(hole, s) {
        for (var i = 1; i <= 10; i++) {
            var k = i / 10, g = P.surfaceTop(hole, s.tx + (s.px - s.tx) * k, s.tz + (s.pz - s.tz) * k);
            if (g && s.ty + (s.py - s.ty) * k < g.y + 0.25 + 0.35 * k) return false;
        }
        return true;
    }

    /* How much of the flinch a hole gets: all of it on a lane, LONG_CAM.PUNCH
       of it on a long hole, where a lunge at the ball and back at the strike
       is one more zoom under the chase (v1.249.0). */
    function punchOf(hole) {
        if (!G3.longHole(hole)) return 1;
        return C.LONG_CAM.PUNCH === undefined ? 1 : C.LONG_CAM.PUNCH;
    }

    function seatFor(hole, ball, out) {
        var c = R.cam;
        var yaw = (c.lock ? c.bearing : c.yaw) - c.view;
        var tx, ty, tz, px, py, pz, dist;
        var bx = (hole.bounds.minX + hole.bounds.maxX) / 2;
        var bz = (hole.bounds.minZ + hole.bounds.maxZ) / 2;

        if (c.mode === 'flight') {
            var fl = c.flight;
            var cosP = Math.cos(fl.pitch);
            px = fl.x; py = fl.y; pz = fl.z;
            tx = px + Math.sin(fl.yaw) * cosP * 10;
            ty = py + Math.sin(fl.pitch) * 10;
            tz = pz + Math.cos(fl.yaw) * cosP * 10;
            var fex = (hole.bounds.maxX - hole.bounds.minX) / 2;
            var fez = (hole.bounds.maxZ - hole.bounds.minZ) / 2;
            R.overRadius = Math.max(18, Math.hypot(fex, fez) * 1.12);
            R.overDist = Math.max(20, Math.hypot(px - bx, py, pz - bz));
            out.px = px; out.py = py; out.pz = pz;
            out.tx = tx; out.ty = ty; out.tz = tz;
            return out;
        }

        if (c.mode === 'editor') {
            tx = c.target ? c.target.x : bx;
            ty = c.target ? c.target.y : 0;
            tz = c.target ? c.target.z : bz;
            dist = c.dist !== undefined ? c.dist : 12;
            var pitch = c.pitch !== undefined ? c.pitch : 0.46;
            px = tx - Math.sin(c.yaw) * Math.cos(pitch) * dist;
            py = ty + Math.sin(pitch) * dist;
            pz = tz - Math.cos(c.yaw) * Math.cos(pitch) * dist;
            R.overDist = dist;
            R.overRadius = Math.max(10, dist * 0.6);
            out.px = px; out.py = py; out.pz = pz;
            out.tx = tx; out.ty = ty; out.tz = tz;
            return out;
        }

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
        } else if (c.mode === 'demo') {
            /* Nobody is aiming, so nothing here is measured off the aim. The
               camera stands far enough back to hold the hole, turns round it
               on its own clock, and looks at the middle of it — except on a
               hole too long to hold, where the look point walks towards the
               ball by DEMO_CAM.FOLLOW and the shot stays in the frame. The
               walk is not smoothed here; updateCamera's lerp is what smooths
               every seat, and this is a seat like the others. */
            var D = C.DEMO_CAM;
            var dex = (hole.bounds.maxX - hole.bounds.minX) / 2;
            var dez = (hole.bounds.maxZ - hole.bounds.minZ) / 2;
            var span = Math.hypot(dex, dez);
            var follow = Math.max(0, Math.min(D.FOLLOW, (span - D.HOLD) / D.SPAN));
            // What it is framing: the whole hole while it is watching the whole
            // hole, and the ball's own neighbourhood once it has started
            // following one — the two are the same question asked twice.
            var whole = Math.min(span * D.FIT, D.MAX_RADIUS);
            var shown = whole + (D.NEAR_RADIUS - whole) * (follow / D.FOLLOW);
            var dv = R.camera.fov * Math.PI / 360;
            var dh = Math.atan(Math.tan(dv) * R.camera.aspect);
            dist = shown / Math.tan(Math.min(dv, dh));
            R.overDist = dist;
            R.overRadius = shown;

            var spin = c.demoT * D.SPIN;
            tx = bx + (ball.x - bx) * follow;
            ty = ball.y * follow;
            tz = bz + (ball.z - bz) * follow;
            px = tx - Math.sin(spin) * Math.cos(D.TILT) * dist;
            py = ty + Math.sin(D.TILT) * dist;
            pz = tz - Math.cos(spin) * Math.cos(D.TILT) * dist;
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
            dist = (c.dist + c.speedPull) * 1.25 * seatLook(hole);
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
            var outward = (tx - bx) * perpX + (tz - bz) * perpZ;
            var want = outward >= 0 ? 1 : -1;
            if (c.sideSign !== want && Math.abs(outward) > 0.6) c.sideSign = want;

            dist -= c.kick * C.KICK * 4 * punchOf(hole);
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
            var look = seatLook(hole);
            dist = (c.dist + c.speedPull - c.kick * C.KICK * 4 * punchOf(hole)) * look;
            /* Lifted by the hill in front of it, if there is one. See
               CONFIG.AIM_LOOK for why: a seat that looks a little over the
               ball is looking straight into the slope on a hole that climbs,
               and the sample is what keeps the answer honest on the thirty
               holes that do not climb at all. */
            var ahead = P.surfaceTop(hole, ball.x + Math.sin(yaw) * C.AIM_LOOK,
                                           ball.z + Math.cos(yaw) * C.AIM_LOOK);
            var rise = ahead ? Math.max(0, ahead.y - ball.y) : 0;
            /* …and on a long hole, far from the green, it looks down the
               line rather than at the ball, from a little lower (the owner,
               v1.221.0, on three forged holes: "why does the starting camera
               look into the ground?" — at nine back and four up, looking at
               the ball, a fifty-unit hole was a frame of turf with the
               horizon at its top edge). Eased in by the ball's distance from
               the cup, so a putt, and every mini hole, is the seat it was. */
            var lead = seatLead(hole, ball), LS = C.LONG_SEAT;
            var pitch = c.pitch * (1 - LS.DROP * lead);
            var by = ball.y + 0.35 * look + Math.min(rise, C.AIM_RISE) * C.AIM_TILT;
            tx = ball.x + Math.sin(yaw) * LS.LEAD * look * lead;
            ty = by;
            tz = ball.z + Math.cos(yaw) * LS.LEAD * look * lead;
            // Never a point under the hill it is looking at: sightLift would
            // stand the seat on its head to see over it.
            var there = lead > 0 ? P.surfaceTop(hole, tx, tz) : null;
            if (there) ty = Math.max(ty, there.y + 0.35 * look);
            var back = dist * Math.cos(pitch);
            px = ball.x - Math.sin(yaw) * back;
            py = ball.y + dist * Math.sin(pitch);
            pz = ball.z - Math.cos(yaw) * back;
            // The ball has to be seen over a bank behind it: the line to it, not to the lead.
            py += easedLift(sightLift(hole, ball, ball.x, by, ball.z, px, py, pz));
            /* The backswing (`R.windup`, from game.js → setWindup). The owner, on
               the follow camera: "perhaps when you start the stroke you can start
               to align the camera with a better start position". Everything
               the chase does in its first second — drop back to DIST, come
               down to UP over the ball, stop looking down the line and look
               at the ball — is done instead while the club goes back, by the
               windup's weight. A strike from a full pull then has nothing
               left for the chase to blend: it starts where it would have got
               to. A pull let go of without a shot eases back. Long holes, the
               follow seat, and only with no chase on. */
            var ww = R.windup ? R.windup.w : 0;
            if (ww > 0.001 && !R.chase && G3.longHole(hole)) {
                var LC = C.LONG_CAM;
                var wpx = ball.x - Math.sin(yaw) * LC.DIST, wpz = ball.z - Math.cos(yaw) * LC.DIST;
                var wpy = ball.y + LC.UP;
                var wun = P.surfaceTop(hole, wpx, wpz);
                if (wun && wpy < wun.y + LC.CLEAR) wpy = wun.y + LC.CLEAR;
                wpy += sightLift(hole, ball, ball.x, ball.y, ball.z, wpx, wpy, wpz);
                px += (wpx - px) * ww; py += (wpy - py) * ww; pz += (wpz - pz) * ww;
                tx += (ball.x - tx) * ww; ty += (ball.y - ty) * ww; tz += (ball.z - tz) * ww;
            }
            /* The follow seat as it is, before the chase: what the chase's
               eye walks to after the landing (watchChase). updateCamera's
               own asking only. */
            /* Coming down from above (LONG_CAM.ABOVE, render.js → stepAbove):
               after a long shot the seat stands ABOVE units higher, and comes
               down to the address once the ball is at rest. updateCamera's own
               asking only, so the turn to the cup fits its pitch to the seat
               it will end at. */
            if (R.seatDt && R.above) py += R.above.lift;
            if (R.seatDt) {
                var RS = R.rawSeat || (R.rawSeat = {});
                RS.px = px; RS.py = py; RS.pz = pz;
            }
            // A long shot in the air is the chase's, by its weight (watchChase).
            var ch = R.chase;
            /* Blended from, while a riding chase's ball is up, is the seat as
               it stood at the strike carried along with the ball — not the
               seat worked out afresh: that one re-aims at the hill ahead as
               the ball leaves it (`rise`), and blended in over the chase's
               first third of a second it was a dip in the view. */
            if (ch && ch.rides && ch.w > 0 && ch.out < 0) {
                px = ball.x + ch.ox; py = ball.y + ch.oy; pz = ball.z + ch.oz;
                tx = ball.x + ch.lx; ty = ball.y + ch.ly; tz = ball.z + ch.lz;
            }
            if (ch && ch.w > 0) {
                px += (ch.px - px) * ch.w; py += (ch.py - py) * ch.w; pz += (ch.pz - pz) * ch.w;
                var lk = ch.lk === undefined ? 0 : ch.lk;
                tx += (ball.x + ch.lx * lk - tx) * ch.w;
                ty += (ball.y + ch.ly * lk - (ch.drop || 0) - ty) * ch.w;
                tz += (ball.z + ch.lz * lk - tz) * ch.w;
            }
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
        G3.flyover.retarget(f.plan, _seat);
        /* The end of it is wiped, not flown (the owner, v1.188.0: the cut
           should be "two renders going away at the same time"). At the cut
           — the end of the orbit, or the last key on a world's line (flyover.js → held) —
           the camera is still travelling; that frame is held for game.js to
           take a picture of (`snapWanted`), and from the next the camera is
           the incoming shot: a short push in on to the seat, while the
           picture of the outgoing one slides away behind a moving edge
           (game.js → syncWipe). A skip goes the same way, quicker. */
        if (f.arrive) return arriveCamera(f, dt);
        if (f.snap) {
            // The picture is taken after the frame that asked for it; a page
            // with nobody to take it (the tools) waits a few frames at most.
            if (R.snapReady || ++f.snap > 3) { startArrival(f); return arriveCamera(f, 0); }
        } else {
            f.t += dt;
            var cut = f.plan.cut === undefined ? f.plan.dur : f.plan.cut;
            if (f.skip || f.t >= cut) {
                f.snap = 1;
                R.snapWanted = true;
                R.snapReady = false;
            }
        }

        var pose = G3.flyover.at(f.plan, f.t);
        R.smooth.pos.set(pose.px, pose.py, pose.pz);
        R.smooth.target.set(pose.tx, pose.ty, pose.tz);
        R.smooth.started = true;
        R.camera.position.copy(R.smooth.pos);
        R.camera.lookAt(R.smooth.target);
        // Which way the picture is moving across the screen, for the wipe to
        // carry the outgoing shot on that way: off the ball, frame to frame.
        R.camera.updateMatrixWorld();
        _iv.set(ball.x, ball.y, ball.z).project(R.camera);
        if (_iv.z < 1) {
            if (f.bx !== undefined && Math.abs(_iv.x - f.bx) > 1e-4) f.drift = _iv.x > f.bx ? 1 : -1;
            f.bx = _iv.x;
        }

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
        /* A tour hole gets the tour's sweep, and — when its world is up and
           drawn — the world's own flight line (flyover.js → worldLine).
           Not where the place says `flyLine: false`: along the line the
           world is not cut (stepPlace), and where the line runs behind a
           wall while the camera looks at the hole, the hole is drawn over
           the wall (Three Doors Down, the owner: "on intro sequence there
           is some clipping"). The orbit keeps the cut. */
        var opts = null;
        if (hole.worldId) {
            opts = { tour: true, line: null };
            var B = G3.backdrop;
            if (R.place && R.place.flyLine !== false && R.live && B && B.line) {
                try { opts.line = B.line(R.place, R.placeSeat, 360); } catch (e) { opts.line = null; }
            }
        }
        R.fly = { plan: G3.flyover.plan(hole, ball, _seat, opts), t: 0, lift: 0 };
        return true;
    }

    /* Skipped, it ends the way it ends on its own — the wipe on to the
       seat — only quicker (WIPE.QUICK), from wherever it had got to. A skip
       in the middle of the wipe finishes it. */
    function skipFlyover() {
        var f = R.fly;
        if (!f) return false;
        if (f.arrive) { landFlyover(); return true; }
        if (!f.snap) { f.skip = true; f.quick = true; }
        return true;
    }

    /* The incoming shot: from the seat pulled back along its own line by
       WIPE.PULL and lifted by WIPE.LIFT, pushing in on to it over the wipe
       and slowing to rest exactly there — so when the wipe is gone there is
       nothing left to ease. */
    function startArrival(f) {
        var W = C.FLY.WIPE;
        var dx = _seat.px - _seat.tx, dy = _seat.py - _seat.ty, dz = _seat.pz - _seat.tz;
        var dist = Math.hypot(dx, dy, dz) || 1;
        f.arrive = { t: 0, dur: f.quick ? W.QUICK : W.TIME,
                     ox: dx * W.PULL, oy: dy * W.PULL + dist * W.LIFT, oz: dz * W.PULL };
        R.wipe = { t: 0, dur: f.arrive.dur, dir: f.drift || -1 };
        R.snapWanted = false;
        R.snapReady = false;
    }

    function arriveCamera(f, dt) {
        var a = f.arrive;
        a.t += dt;
        var u = Math.min(1, a.t / a.dur), k = (1 - u) * (1 - u);   // slowing all the way in
        R.smooth.pos.set(_seat.px + a.ox * k, _seat.py + a.oy * k, _seat.pz + a.oz * k);
        R.smooth.target.set(_seat.tx, _seat.ty, _seat.tz);
        R.smooth.started = true;
        R.camera.position.copy(R.smooth.pos);
        R.camera.lookAt(R.smooth.target);
        f.lift = 0;
        if (u >= 1) R.fly = null;
        return true;
    }

    // The camera on the seat, now, and the sweep over: a skip in the wipe.
    function landFlyover() {
        R.fly = null;
        R.smooth.pos.set(_seat.px, _seat.py, _seat.pz);
        R.smooth.target.set(_seat.tx, _seat.ty, _seat.tz);
        R.smooth.started = true;
        if (R.camera) {
            R.camera.position.copy(R.smooth.pos);
            R.camera.lookAt(R.smooth.target);
        }
        R.wipe = null;
        R.snapWanted = R.snapReady = false;
    }

    /* ── the wipe ────────────────────────────────────────────────────────

       The film cut where the next scene comes in behind an edge crossing the
       screen and the last one goes out ahead of it, both moving: the
       renderer keeps how far through it is and which way it goes (`dir`,
       the way the outgoing picture was already moving across the screen);
       game.js keeps the picture of the outgoing shot and paints it. */
    var _iv = new THREE.Vector3();
    function stepWipe(dt) {
        var w = R.wipe;
        if (!w) return;
        w.t += dt;
        if (w.t >= w.dur) R.wipe = null;
    }

    function wipe() { return R.wipe; }

    /* The ball put back (game.js → dropBack: out of play, water, stuck).
       It used to be eased back to like any other move of the seat, and the
       seat had just jumped the length of the shot: the camera flew twenty
       units back up the hole in half a second, turning as it went, at fifty
       units a second at its fastest (the owner's phone, the Pop-Up Book:
       "very jarring … gives you motion sickness"). Now it is the intro's
       cut: the frame is held and photographed, and the next is a short push
       in on to the seat at the tee while that picture slides away (the
       wipe). A drop that leaves the seat close by is eased to as before. */
    function dropTo() {
        if (!R.ready || !R.camera || !R.smooth.started) return false;
        var m = R.cam.mode;
        if (m !== 'follow' && m !== 'side') return false;
        R.chase = null; R.above = null; R.lookSpring = null; R.launch = null; R.liftS = null;
        R.drop = { snap: 1 };
        R.snapWanted = true;
        R.snapReady = false;
        return true;
    }

    // Where a drop would go, while the penalty card is up (game.js); null hides it.
    function markDrop(spot) {
        if (G3.groundfx && R.hole) G3.groundfx.dropMark(R.hole, spot);
    }

    function dropCamera(dt) {
        var d = R.drop, W = C.FLY.WIPE;
        if (!d.arrive) {
            var far = Math.hypot(R.smooth.pos.x - _seat.px, R.smooth.pos.y - _seat.py, R.smooth.pos.z - _seat.pz);
            if (far < 3) { R.drop = null; R.snapWanted = false; return false; }
            if (!(R.snapReady || ++d.snap > 3)) {
                // Held, for the picture.
                R.camera.position.copy(R.smooth.pos);
                R.camera.lookAt(R.smooth.target);
                return true;
            }
            var dx = _seat.px - _seat.tx, dy = _seat.py - _seat.ty, dz = _seat.pz - _seat.tz;
            var dist = Math.hypot(dx, dy, dz) || 1;
            d.arrive = { t: 0, dur: W.TIME, ox: dx * W.PULL, oy: dy * W.PULL + dist * W.LIFT, oz: dz * W.PULL };
            R.wipe = { t: 0, dur: W.TIME, dir: -1 };
            R.snapWanted = false;
            R.snapReady = false;
            dt = 0;
        }
        var a = d.arrive;
        a.t += dt;
        var u = Math.min(1, a.t / a.dur), k = (1 - u) * (1 - u);
        R.smooth.pos.set(_seat.px + a.ox * k, _seat.py + a.oy * k, _seat.pz + a.oz * k);
        R.smooth.target.set(_seat.tx, _seat.ty, _seat.tz);
        R.camera.position.copy(R.smooth.pos);
        R.camera.lookAt(R.smooth.target);
        if (u >= 1) R.drop = null;
        return true;
    }

    function flying() { return !!R.fly; }

    /* ── the victory lap ──────────────────────────────────────────────────

       The ball is down and nobody is aiming any more, so the seat behind it
       has nothing left to show. The camera lets go of it, backs out and up
       from the cup to a circle sized off the hole, and goes round — looking
       at the flag, with the ground round the green and whatever the world is
       beyond it in the picture. The owner: "a bit slower and a bigger arc,
       showing a bit more of the surrounding views, like a victory lap".

       It eases towards its pose rather than writing it, so it can start from
       wherever the camera happened to be (the seat, a replay's cup camera)
       with nothing to hand over; and it keeps turning until the next hole is
       built (buildHole clears it) or the dive takes over — which starts from
       its angle and its pace, so the one move carries on into the other. */
    var _lp = new THREE.Vector3(), _lt = new THREE.Vector3(), _lf = new THREE.Vector3();
    function startLap(hole) {
        if (!R.ready || !hole || !R.camera) return false;
        if (R.cam.mode === 'demo' || R.cam.mode === 'editor' || R.cam.mode === 'flight') return false;
        var L = C.LAP, cup = hole.cup, p = R.camera.position;
        var top = R.cupTop === undefined ? cup.y : R.cupTop;
        var dx = p.x - cup.x, dz = p.z - cup.z, r0 = Math.sqrt(dx * dx + dz * dz);
        if (r0 < 0.05) { dx = hole.tee.x - cup.x; dz = hole.tee.z - cup.z; r0 = 0; }
        var len = Math.hypot(cup.x - hole.tee.x, cup.z - hole.tee.z);
        var rad = Math.max(L.R_MIN, Math.min(L.R_MAX, len * L.SHARE));
        /* Round towards the middle of the hole rather than out past its edge,
           so the first of the turn is back over the course just played. */
        var cx = (hole.bounds.minX + hole.bounds.maxX) / 2 - cup.x;
        var cz = (hole.bounds.minZ + hole.bounds.maxZ) / 2 - cup.z;
        var side = dz * cx - dx * cz;
        R.lap = {
            t: 0, w: 0, dir: side < 0 ? -1 : 1, chk: 0, want: 1, frac: 1,
            th: Math.atan2(dx, dz), r0: Math.max(r0, 1), y0: p.y,
            rad: rad, top: top,
            y1: top + Math.max(L.UP_MIN, Math.min(L.UP_MAX, rad * L.UP))
        };
        return true;
    }
    function lapCamera(hole, dt) {
        var l = R.lap, L = C.LAP, cup = hole.cup;
        l.t += dt;
        var a = Math.min(1, l.t / L.RISE), e = a * a * a * (a * (a * 6 - 15) + 10);
        var b = Math.min(1, l.t / L.SPIN_IN);
        l.w = L.SPIN * b * b * (3 - 2 * b);
        l.th += l.dir * l.w * dt;
        var r = l.r0 + (l.rad - l.r0) * e;
        var x = cup.x + Math.sin(l.th) * r, z = cup.z + Math.cos(l.th) * r;
        var y = l.y0 + (l.y1 - l.y0) * e;
        var g = P.surfaceTop(hole, x, z);
        if (g && y < g.y + L.CLEAR) y = g.y + L.CLEAR;
        _lp.set(x, y, z);
        _lt.set(cup.x, l.top + L.LOOK_UP * e, cup.z);
        lapLook(hole, l, dt);
        /* And never behind something. A windmill, a castle or a cliff can
           stand on the circle, so a ray goes out from over the cup to where
           the lap wants to be — a few times a second, not every frame — and
           the camera is drawn in in front of the first thing it meets, quick
           to come in and slow to go back out, the way a boom camera does. */
        _lf.set(cup.x, l.top + 0.6, cup.z);
        l.chk -= dt;
        if (l.chk <= 0) { l.chk = L.PROBE; l.want = reach(_lf, _lp); }
        l.frac += (l.want - l.frac) * Math.min(1, dt * (l.want < l.frac ? L.PULL_IN : L.PULL_OUT));
        if (l.frac < 0.999) _lp.sub(_lf).multiplyScalar(l.frac).add(_lf);
        var k = 1 - Math.pow(L.EASE, dt);
        if (!R.smooth.started) { R.smooth.pos.copy(_lp); R.smooth.target.copy(_lt); }
        R.smooth.pos.lerp(_lp, k);
        R.smooth.target.lerp(_lt, k);
        R.smooth.started = true;
        R.camera.position.copy(R.smooth.pos);
        R.camera.lookAt(R.smooth.target);
        R.overDist = R.smooth.pos.distanceTo(R.smooth.target);
        R.overRadius = l.rad;
        return true;
    }
    function stopLap() { R.lap = null; }

    /* A world event with a `look` — a point in the world's own coordinates —
       is something too big or too high for the lap to have in its picture:
       Dry Dock's Moon lifting off its blocks is a hundred units past the cup
       and most of fifty up. While it plays, the lap gives up its circle and
       stands low behind the cup with the cup at the bottom of the frame and
       the thing itself above it, and eases back on to the circle after. */
    var _kp = new THREE.Vector3(), _kt = new THREE.Vector3();
    function lapLook(hole, l, dt) {
        var ev = R.place && R.place.event, B = G3.backdrop;
        if (!ev || !ev.look || !R.eventFired || !B || !B.toHole) return;
        if (!l.look) {
            var v = B.toHole(R.place, R.placeSeat, ev.look);
            if (!v) return;
            var cup = hole.cup, dx = v.x - cup.x, dz = v.z - cup.z, d = Math.sqrt(dx * dx + dz * dz) || 1;
            dx /= d; dz /= d;
            var back = Math.max(7, Math.min(12, l.rad * 0.7));
            l.look = {
                t: 0, hold: (ev.secs || 5) + C.LAP.LOOK_HOLD,
                pos: new THREE.Vector3(cup.x - dx * back, l.top + 2.6, cup.z - dz * back),
                // a third of the way up to it from the cup: the cup low in the
                // picture and the thing filling the rest
                at: new THREE.Vector3(cup.x + (v.x - cup.x) * 0.22, l.top + (v.y - l.top) * 0.3, cup.z + (v.z - cup.z) * 0.22)
            };
        }
        var k = l.look;
        k.t += dt;
        var a = Math.min(1, k.t / C.LAP.LOOK_IN), b = Math.min(1, Math.max(0, (k.t - k.hold) / C.LAP.LOOK_OUT));
        var f = a * a * (3 - 2 * a) * (1 - b * b * (3 - 2 * b));
        if (f <= 0) return;
        // Ground and things in the way are the probe's, after this.
        _kp.copy(k.pos); _kt.copy(k.at);
        _lp.lerp(_kp, f); _lt.lerp(_kt, f);
    }

    /* How much of the way from `from` to `to` is clear of the hole: 1 for
       all of it, else the share up to just short of the first thing in the
       way. The first stretch is ignored, which is the pin and the flag. */
    function reach(from, to) {
        if (!R.holeGroup) return 1;
        _rayDir.subVectors(to, from);
        var len = _rayDir.length();
        if (len < 1) return 1;
        _rayDir.multiplyScalar(1 / len);
        _ray.set(from, _rayDir);
        _ray.far = len + 0.7;
        var hits = _ray.intersectObject(R.holeGroup, true), i;
        for (i = 0; i < hits.length; i++) {
            if (hits[i].distance > 0.9 && solid(hits[i].object)) {
                return Math.max(0.2, Math.min(1, (hits[i].distance - 0.7) / len));
            }
        }
        return 1;
    }
    /* Something a camera would be seen to go through: a drawn mesh, every
       parent of it shown, that writes depth. Not a particle — a raycaster
       gives Points a unit of thickness, and a world's bubbles under a
       hidden parent held the lap a yard off the cup. */
    function solid(o) {
        if (!o.isMesh) return false;
        var m = Array.isArray(o.material) ? o.material[0] : o.material;
        if (!m || m.visible === false || m.depthWrite === false || m.colorWrite === false) return false;
        for (var v = o; v; v = v.parent) if (!v.visible) return false;
        return true;
    }

    /* ── down the cup ─────────────────────────────────────────────────────

       Between two worlds of the tour the cup is the portal: the camera leaves
       wherever the victory lap had got to, arcs up over the green, and plunges
       straight down into the cup's black hole — reaching the rim first, and
       only then going on down into it while the full-screen black hole
       portal closes round the view.

       Radius closes to zero by OVER_AT while height crests at PEAK_AT, so by
       the time the camera tips over the crest it is directly above the cup and
       drops straight down the hole's axis — matching the approach-arch-plunge
       trajectory. A black hole shader disc opens in the cup below it, bending
       the green inward as the camera falls. */
    var _dv = new THREE.Vector3(), _dt = new THREE.Vector3();
    function startDive(hole, ball, onPortal, onDone) {
        if (!R.ready || !hole || !R.camera) return false;
        var D = C.DIVE, cup = hole.cup, top = R.cupTop === undefined ? cup.y : R.cupTop;
        var p0 = R.camera.position.clone();
        var t0 = R.smooth.started ? R.smooth.target.clone() : new THREE.Vector3(cup.x, cup.y, cup.z);
        var dx = p0.x - cup.x, dz = p0.z - cup.z, r0 = Math.sqrt(dx * dx + dz * dz);
        if (r0 < 1e-3) {
            // Already over it: come in along the line of play.
            dx = hole.tee.x - cup.x; dz = hole.tee.z - cup.z; r0 = 0;
        }
        var lap = R.lap;
        if (R.holeGroup && !R.diveBH) {
            var bhSize = 2.2;
            var bh = blackHole({
                size: bhSize, hor: G3.holeR(hole) / bhSize, ring: (G3.holeR(hole) * 1.65) / bhSize,
                feed: 1.5, shade: 0.92, beam: 0.45, gain: 1.7, open: 0.01, order: 2
            });
            bh.rotation.x = -Math.PI / 2;
            bh.position.set(cup.x, top + 0.02, cup.z);
            R.holeGroup.add(bh);
            R.diveBH = bh;
        }
        R.dive = {
            t: 0,
            p0: p0, t0: t0, top: top,
            th0: Math.atan2(dx, dz), r0: r0,
            y0: p0.y,
            yPeak: Math.max(p0.y, top + 3.5) + D.RISE,
            yRim: top + D.RIM_Y,
            y1: top - D.INTO,
            dir: lap ? lap.dir : 1,
            w0: lap ? lap.dir * lap.w : 0,
            pinY: R.pin ? R.pin.position.y : 0,
            onPortal: onPortal || null,
            onDone: onDone || null,
            doneSent: false
        };
        R.lap = null;
        return true;
    }
    function diveCamera(hole, dt) {
        var d = R.dive, D = C.DIVE, cup = hole.cup;
        d.t = Math.min(D.DUR, d.t + dt);
        var u = d.t / D.DUR;
        var ru = Math.min(1, u / D.OVER_AT);
        var sr = ru * ru * ru * (ru * (ru * 6 - 15) + 10);
        var r = d.r0 * (1 - sr);
        var th = d.th0 + d.w0 * D.DUR * D.OVER_AT * (ru - ru * ru / 2) + d.dir * D.SWEEP * sr;
        var y;
        if (u <= D.PEAK_AT) {
            var pu2 = u / D.PEAK_AT;
            var sp = pu2 * pu2 * (3 - 2 * pu2);
            y = d.y0 + (d.yPeak - d.y0) * sp;
        } else if (u <= D.RIM_AT) {
            // The plunge: accelerating straight down to just over the rim…
            var fu = (u - D.PEAK_AT) / (D.RIM_AT - D.PEAK_AT);
            y = d.yPeak + (d.yRim - d.yPeak) * fu * fu * (0.35 + 0.65 * fu);
        } else {
            /* …then on down into the cup at the speed it arrived with,
               easing to rest deep inside it (a Hermite leg, its opening
               slope held to three times the drop so it never overshoots).
               The portal closes over this leg, not over the plunge: the
               camera is at the hole before the next world takes the view. */
            var iu = (u - D.RIM_AT) / (1 - D.RIM_AT), drop = d.yRim - d.y1;
            var m0 = Math.min(3 * drop, 2.65 * (d.yPeak - d.yRim) * (1 - D.RIM_AT) / (D.RIM_AT - D.PEAK_AT));
            var i2 = iu * iu, i3 = i2 * iu;
            y = d.yRim - ((-2 * i3 + 3 * i2) * drop + (i3 - 2 * i2 + iu) * m0);
        }
        var sx = Math.sin(th), cz = Math.cos(th);
        _dv.set(cup.x + sx * r, y, cup.z + cz * r);
        var a = Math.min(1, u / 0.52), e = a * a * (3 - 2 * a);
        // Always below the camera, so it still looks down once inside the cup.
        _dt.set(cup.x - sx * 0.05, Math.min(d.top, y) - 1.5, cup.z - cz * 0.05);
        R.smooth.pos.copy(_dv);
        R.smooth.target.copy(d.t0).lerp(_dt, e);
        R.smooth.started = true;
        R.camera.position.copy(R.smooth.pos);
        R.camera.lookAt(R.smooth.target);
        if (R.diveBH) {
            var bhOpen = smooth01(u / 0.25);
            var bhGulp = smooth01((u - 0.30) / 0.55);
            R.diveBH.material.uniforms.open.value = Math.max(0.01, bhOpen);
            R.diveBH.material.uniforms.gulp.value = bhGulp;
            /* Inside the cup the disc goes on down ahead of the camera,
               so what fills the view below the rim is still the black
               hole and not the underside of the green. */
            R.diveBH.position.y = Math.min(d.top + 0.02, y - 0.2);
        }
        if (R.pin && R.pin.visible) {
            /* Not drawn out but launched: a shudder on the pad, then away on
               a cubic, so it is crawling for a moment and gone the next,
               with a wobble and embers off its foot all the way up. */
            var pu = Math.min(1, u / D.PIN_BY), pe = pu * pu * pu;
            R.pin.position.y = d.pinY + D.PIN_LIFT * pe;
            R.pin.rotation.z = Math.sin(d.t * 47) * (pu < 0.15 ? 0.05 : 0.025);
            R.pin.rotation.x = -R.pinLean + Math.cos(d.t * 39) * 0.02;
            if (pu < 1) {
                var foot = R.pin.position;
                burst(foot.x, foot.y, foot.z, 0xffb347, pu < 0.15 ? 2 : 4, 0.9 + pu * 1.6);
            } else {
                R.pin.visible = false;
            }
        }
        if (d.onPortal && u >= D.PORTAL_AT) {
            d.onPortal(smooth01((u - D.PORTAL_AT) / (1 - D.PORTAL_AT)));
        }
        if (u >= 1 && !d.doneSent) {
            d.doneSent = true;
            if (d.onDone) d.onDone();
        }
        return true;
    }
    function diving() { return !!R.dive; }

    /* ── the ace replay's camera ──────────────────────────────────────────

       Two shots and one cut, the way a broadcast shows an ace. First the
       chase: behind the ball and above it, turning with it, on a lag long
       enough that the strike reads as the ball leaving the camera behind. Then,
       once replay.js says the ball is close, a hard cut to a seat beside the
       cup, looking back up the line the ball is coming in on, and holding
       there while it drops.

       game.js drives the tape and says when to cut; this only places the
       camera, the way flyCamera only places it for the intro. A cut is the one
       place anything here is chosen: replay.js offers seats best first and the
       first one that can see both the cup and the ball is taken. */
    var _ray = new THREE.Raycaster();
    var _rayFrom = new THREE.Vector3(), _rayDir = new THREE.Vector3();

    function startReplay(hole, ball) {
        if (!R.ready) return false;
        R.replay = { seat: null, head: Math.atan2(hole.cup.x - ball.x, hole.cup.z - ball.z), fresh: true };
        return true;
    }

    // Clear from `p` to the point (x, y, z)? Anything in the hole closer than
    // the last half unit is ignored: that is the pin, the cup and the ball
    // itself, all of which stand where the camera is looking. `pinOk`: the
    // flag is no blocker either — a camera looking down at the cup from above
    // sees past a strip of cloth, and the pin is what the picture is of.
    function onPin(o) {
        for (; o; o = o.parent) if (o === R.pin) return true;
        return false;
    }

    function clearTo(p, x, y, z, pinOk) {
        _rayFrom.set(p.x, p.y, p.z);
        _rayDir.set(x - p.x, y - p.y, z - p.z);
        var len = _rayDir.length();
        if (len < 1e-3) return true;
        _rayDir.multiplyScalar(1 / len);
        _ray.set(_rayFrom, _rayDir);
        _ray.far = len;
        var hits = _ray.intersectObject(R.holeGroup, true), i, o;
        for (i = 0; i < hits.length; i++) {
            o = hits[i].object;
            /* Particles are never in the way: the raycaster gives every point
               a pick radius of a unit, so a burst or a spray in the air read
               as a wall — and which seat the camera got depended on where the
               sparks happened to be. */
            if (o.isPoints || o.isSprite || o.isLine) continue;
            if (hits[i].distance < len - 0.5 && o.visible && !(pinOk && onPin(o))) return false;
        }
        return true;
    }

    function cutReplay(hole, ball) {
        if (!R.replay || !G3.replay) return;
        var seats = G3.replay.seats(hole, ball), i, s;
        R.replay.seat = seats[0];
        for (i = 0; i < seats.length; i++) {
            s = seats[i];
            if (clearTo(s, hole.cup.x, hole.cup.y + 0.15, hole.cup.z) &&
                clearTo(s, ball.x, ball.y, ball.z)) { R.replay.seat = s; break; }
        }
        R.replay.fresh = true;
    }

    function stopReplay() { R.replay = null; }

    /* How high and how wide a celebration goes, in units off the lip: run
       once off-screen on a fixed seed, and kept, since it is the same answer
       every time it is asked. */
    var celeReach = {};
    function reachOf(id) {
        if (celeReach[id]) return celeReach[id];
        var seed = 12345, rnd = function () { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
        var fx = G3.celebrate.start(id, rnd), up = 0.5, side = 0.6, k, i, q, dur = 0;
        for (k = 0; k < 240; k++) {
            if (!G3.celebrate.step(fx, 1 / 40)) break;
            dur += 1 / 40;
            for (i = 0; i < fx.parts.length; i++) {
                q = fx.parts[i];
                if (q.oa < 0.1) continue;
                if (q.oy > up) up = q.oy;
                q = Math.sqrt(q.ox * q.ox + q.oz * q.oz);
                if (q > side) side = q;
            }
        }
        return (celeReach[id] = { up: Math.min(up, 7), side: Math.min(side, 5), dur: dur });
    }

    /* The ball has dropped in the replay and the celebration is going off:
       work out where the camera backs off to. Out from the cup through the
       seat it was in, far enough that the whole burst (reachOf) fits the frame
       on this screen's shape. Where something in the hole stands between
       there and the burst, the bearing turns a step at a time either way
       round the cup, then the distance comes in, until it is clear; a cup
       boxed in on every side keeps the seat it has. */
    var DROP_TURNS = [0, 0.35, -0.35, 0.7, -0.7, 1.05, -1.05, 1.5, -1.5, 2.1, -2.1, Math.PI];

    function replayDrop(hole) {
        var r = R.replay, RP = C.REPLAY;
        if (!r || !r.seat || !celebrating() || !G3.celebrate) return;
        var cup = hole.cup, top = R.cupTop !== undefined ? R.cupTop : cup.y;
        var dx = r.seat.x - cup.x, dz = r.seat.z - cup.z, d = Math.sqrt(dx * dx + dz * dz) || 1;
        var head = Math.atan2(dx / d, dz / d);
        var reach = reachOf(R.cele.fx.id), M = RP.CELE_MARGIN;
        var vhalf = R.camera.fov * Math.PI / 360;
        var hhalf = Math.atan(Math.tan(vhalf) * R.camera.aspect);
        // The burst from the lip to its top, centred, and its width.
        var want = Math.max(reach.up * M / 2 / Math.tan(vhalf), reach.side * RP.CELE_SIDE * M / Math.tan(hhalf));
        want = Math.min(RP.CELE_DIST_MAX, Math.max(RP.CELE_DIST_MIN, want));
        var lift = Math.max(2.4, reach.up * 0.6);
        var look = { x: cup.x, y: top + reach.up * 0.45, z: cup.z }, k, j, a, dist, g, p = null;
        for (k = 0; k < 4 && !p; k++) {
            dist = Math.max(d, want * (1 - k * 0.15));
            for (j = 0; j < DROP_TURNS.length; j++) {
                a = head + DROP_TURNS[j];
                g = P.surfaceTop(hole, cup.x + Math.sin(a) * dist, cup.z + Math.cos(a) * dist);
                p = { x: cup.x + Math.sin(a) * dist, y: Math.max(g ? g.y : top, top) + lift, z: cup.z + Math.cos(a) * dist };
                if (clearTo(p, look.x, look.y, look.z, true) && clearTo(p, cup.x, top + 0.02, cup.z, true)) break;
                p = null;
            }
        }
        if (!p) return;
        r.wide = p;
        r.look = look;
        r.drop = 0;
        // A short burst gets a quick pull, or the camera arrives as it ends.
        r.ease = Math.max(0.6, Math.min(RP.CELE_EASE, reach.dur * 0.4));
    }

    function replaying() { return !!R.replay; }

    function replayCamera(hole, ball, dt) {
        var r = R.replay, RP = C.REPLAY;
        var px, py, pz;
        // A pipe on the way to an ace: the same cut to the sky portal the
        // shot had, until the cup seat takes over.
        if (R.warpCam && !r.seat) {
            var wc = R.warpCam;
            if (wc.cut) {
                R.smooth.pos.set(wc.px, wc.py, wc.pz);
                R.smooth.target.set(wc.tx, wc.ty, wc.tz);
                wc.cut = false;
            }
            R.smooth.pos.lerp(_camPos.set(wc.px, wc.py, wc.pz), 1 - Math.pow(0.004, dt));
            R.smooth.target.lerp(_camTarget.set(wc.tx, wc.ty, wc.tz), 1 - Math.pow(0.004, dt));
            r.head = Math.atan2(Math.sin(wc.w.yaw), Math.cos(wc.w.yaw));
            R.smooth.started = true;
            R.camera.position.copy(R.smooth.pos);
            R.camera.lookAt(R.smooth.target);
            return true;
        }
        // After the drop: ease from the seat out to the wide one (replayDrop).
        var w = 0;
        if (r.wide) {
            r.drop += dt;
            w = Math.min(1, r.drop / r.ease);
            w = w * w * (3 - 2 * w);
        }
        if (r.seat) {
            px = r.seat.x; py = r.seat.y; pz = r.seat.z;
            if (w > 0) {
                px += (r.wide.x - px) * w;
                py += (r.wide.y - py) * w;
                pz += (r.wide.z - pz) * w;
            }
        } else {
            // Turn with the ball while it is going somewhere; a ball crawling
            // up to the lip has no heading worth following.
            var v = Math.hypot(ball.vx, ball.vz);
            if (v > 0.6) {
                var want = Math.atan2(ball.vx, ball.vz);
                var d = want - r.head;
                d = Math.atan2(Math.sin(d), Math.cos(d));
                r.head += d * (1 - Math.pow(0.08, dt));
            }
            px = ball.x - Math.sin(r.head) * RP.BACK;
            pz = ball.z - Math.cos(r.head) * RP.BACK;
            py = ball.y + RP.UP;
            var top = P.surfaceTop(hole, px, pz);
            if (top && py < top.y + 1) py = top.y + 1;
        }
        // At the cup the ball is the subject but the cup is the story, so the
        // camera looks between them, and settles on the cup as the ball arrives.
        var tx = ball.x, ty = ball.y + 0.1, tz = ball.z;
        if (r.seat) {
            tx = (ball.x + hole.cup.x) / 2;
            ty = (ball.y + hole.cup.y) / 2 + 0.1;
            tz = (ball.z + hole.cup.z) / 2;
            if (w > 0) {
                tx += (r.look.x - tx) * w;
                ty += (r.look.y - ty) * w;
                tz += (r.look.z - tz) * w;
            }
        }
        if (r.fresh) {
            R.smooth.pos.set(px, py, pz);
            R.smooth.target.set(tx, ty, tz);
            r.fresh = false;
        } else {
            R.smooth.pos.lerp(_camPos.set(px, py, pz), 1 - Math.pow(0.004, dt));
            R.smooth.target.lerp(_camTarget.set(tx, ty, tz), 1 - Math.pow(0.00005, dt));
        }
        R.smooth.started = true;
        R.camera.position.copy(R.smooth.pos);
        R.camera.lookAt(R.smooth.target);
        return true;
    }

    function updateCamera(hole, ball, dt) {
        // The demo's orbit is on its own clock rather than the world's: the
        // world stops for a moment every time the bot thinks, and a camera
        // that stopped with it would say so.
        if (R.cam.mode === 'demo') R.cam.demoT += dt;
        stepWindup(dt);
        R.seatDt = R.cam.mode === 'follow' && R.smooth.started ? dt : 0;
        seatFor(hole, ball, _seat);
        R.seatDt = 0;
        stepWipe(dt);
        R.camGap = Infinity;   // camSettled(): set below, only on the plain seat
        if (R.drop && dropCamera(dt)) return;
        if (R.dive && diveCamera(hole, dt)) return;
        if (R.fly && flyCamera(hole, ball, dt)) return;
        if (R.replay && replayCamera(hole, ball, dt)) return;
        if (R.lap && lapCamera(hole, dt)) return;

        var px = _seat.px, py = _seat.py, pz = _seat.pz;
        var tx = _seat.tx, ty = _seat.ty, tz = _seat.tz;
        if (R.loopCam && R.cam.mode !== 'over' && R.cam.mode !== 'editor' && R.cam.mode !== 'flight') {
            loopSeat(R.loopCam, _seat);
            px = _seat.px; py = _seat.py; pz = _seat.pz;
            tx = _seat.tx; ty = _seat.ty; tz = _seat.tz;
        }
        if (R.warpCam && R.cam.mode !== 'over' && R.cam.mode !== 'editor' && R.cam.mode !== 'demo' && R.cam.mode !== 'flight') {
            var wc = R.warpCam;
            px = wc.px; py = wc.py; pz = wc.pz;
            tx = wc.tx; ty = wc.ty; tz = wc.tz;
            if (wc.cut) {
                R.smooth.pos.set(px, py, pz);
                R.smooth.target.set(tx, ty, tz);
                wc.cut = false;
            }
        }

        if (!R.smooth.started || (R.cam.mode === 'editor' && R.cam.instant) || R.cam.mode === 'flight') {
            R.smooth.pos.set(px, py, pz);
            R.smooth.target.set(tx, ty, tz);
            R.smooth.started = true;
            if (R.cam.instant) R.cam.instant = false;
        } else {
            var k = 1 - Math.pow(0.0016, dt);   // frame-rate independent easing
            var kt = k;
            /* At the strike the seat lets go (launchLag): the eye and the look
               each ease on a slower base, mixed in by rate rather than by
               base so that half a lag is half as slow. */
            var lag = (R.cam.mode === 'follow' || R.cam.mode === 'side') && !R.warpCam && !R.loopCam &&
                !(R.chase && R.cam.mode === 'follow') ? launchLag() : 0;
            if (lag > 0) {
                var LC = C.LAUNCH_CAM, seatRate = Math.log(0.0016);
                k = 1 - Math.exp((seatRate + (Math.log(LC.POS) - seatRate) * lag) * dt);
                kt = 1 - Math.exp((seatRate + (Math.log(LC.LOOK) - seatRate) * lag) * dt);
            }
            /* The chase is smooth by construction, and a lerp on top of a
               seat moving at a drive's speed trails it by speed × the lag —
               a gap that shrinks as the ball slows, which is the lurch the
               chase is there to take out. So under it the eye is the seat. */
            var chased = R.chase && R.cam.mode === 'follow' && !R.warpCam && !R.loopCam;
            if (chased && R.chase.w > 0) {
                k += (1 - k) * R.chase.w;
                kt += (1 - kt) * R.chase.w;
            }
            /* …except that the eye and the look both ride a spring
               (LONG_CAM.SPRING) for as long as the chase is on. Made the seat outright, the look
               went from standing still to the ball's speed at the strike and
               on every bounce; and eased in by the lerp it first fell behind
               a ball four units away and then was snatched on to it as the
               chase took over: the view dipped and swung back up (the Pop-Up
               Book, "gives you motion sickness"). The spring is told how fast
               the seat's look is moving, so a ball in steady flight is looked
               at with no lag at all; what it takes out is only the change.
               The eye is on the same spring, or it rose and ran on with the
               ball a beat before the look did, which is the same dip. */
            if (chased) {
                if (!R.lookSpring) R.lookSpring = { t: springOf(_camTarget.set(tx, ty, tz)), p: springOf(_camPos.set(px, py, pz)) };
                chaseSpring(R.lookSpring.t, R.smooth.target, _camTarget.set(tx, ty, tz), dt, C.LONG_CAM.GAZE);
                chaseSpring(R.lookSpring.p, R.smooth.pos, _camPos.set(px, py, pz), dt, C.LONG_CAM.SPRING);
            } else {
                R.lookSpring = null;
                R.smooth.pos.lerp(_camPos.set(px, py, pz), k);
                R.smooth.target.lerp(_camTarget.set(tx, ty, tz), kt);
            }
            /* An eye left behind is not riding the seat, which keeps itself
               off the ground; a drive over a crest would otherwise drag it
               through the hill on the way to catching up. */
            /* Lifted, not lifted in one frame: under the chase nothing held
               the eye up, and the frame the chase let go this put it up four
               tenths of a unit at once on the Pop-Up Book's slope. It may
               not go nearer the ground than a sixth of the clearance. */
            if (lag > 0 || chased) {
                var under = P.surfaceTop(hole, R.smooth.pos.x, R.smooth.pos.z), CL = C.LAUNCH_CAM.CLEAR;
                if (under && R.smooth.pos.y < under.y + CL) {
                    R.smooth.pos.y += (under.y + CL - R.smooth.pos.y) * (1 - Math.pow(0.002, dt));
                    if (R.smooth.pos.y < under.y + CL / 6) R.smooth.pos.y = under.y + CL / 6;
                }
            }
        }
        R.camera.position.copy(R.smooth.pos);
        R.camera.lookAt(R.smooth.target);
        R.camera.updateMatrixWorld();
        /* How far the eye still has to travel to the seat, as a share of the
           seat's own reach — so the same reading means "arrived" on a putting
           green and on a par 5. A carried camera (loop, pipe) is never
           settled: the seat it is easing to is not the address. */
        if (!R.loopCam && !R.warpCam && !R.wipe) {
            var reach = Math.hypot(px - tx, py - ty, pz - tz) || 1;
            R.camGap = (R.smooth.pos.distanceTo(_camPos.set(px, py, pz)) +
                R.smooth.target.distanceTo(_camTarget.set(tx, ty, tz))) / reach;
        }
    }

    var _lookWas = new THREE.Vector3();
    function springOf(at) { return { v: new THREE.Vector3(), was: new THREE.Vector3().copy(at) }; }
    // A critically damped spring on `t`, towards `want`, told how fast `want` moves.
    function chaseSpring(S, t, want, dt, w) {
        if (dt <= 0) return;
        // How fast the look the seat asks for is going — not past what a
        // frame can honestly mean (a ball put back on the tee is a cut).
        _lookWas.copy(want).sub(S.was).multiplyScalar(1 / dt);
        if (_lookWas.length() > 80) _lookWas.setScalar(0);
        S.was.copy(want);
        var n = Math.max(1, Math.ceil(dt / (1 / 120))), h = dt / n, i, ax, ay, az;
        for (i = 0; i < n; i++) {
            ax = w * w * (want.x - t.x) + 2 * w * (_lookWas.x - S.v.x);
            ay = w * w * (want.y - t.y) + 2 * w * (_lookWas.y - S.v.y);
            az = w * w * (want.z - t.z) + 2 * w * (_lookWas.z - S.v.z);
            S.v.x += ax * h; S.v.y += ay * h; S.v.z += az * h;
            t.x += S.v.x * h; t.y += S.v.y * h; t.z += S.v.z * h;
        }
    }

    /* Has the camera come to rest on the seat? game.js's pin tag waits for it
       (the owner, v1.217.1: "should spawn after you settle on the tee … remove
       after you fire and in transitions"). */
    function camSettled() { return R.camGap < 0.04; }

    /* The launch (CONFIG.LAUNCH_CAM). A strike is noticed as the ball
       starting to move from rest — frame() does that, so game.js has nothing
       to call — and how hard the seat lets go is how fast the ball left.
       Only from the seats you play from: the overview is not following
       anything, and the intro, the replay and the demo have cameras of
       their own. */
    function startLaunch(ball, speed) {
        var LC = C.LAUNCH_CAM;
        var s = Math.max(0, Math.min(1, (speed - LC.FROM) / LC.SPAN));
        if (Math.abs(ball.vy) < 0.5) s *= LC.ROLL;
        R.launch = s > 0.02 ? { s: s, t: 0 } : null;
    }

    // How much of the lag is left: all of it for HOLD, then given back.
    function launchLag() {
        var L = R.launch;
        if (!L) return 0;
        return L.s * (1 - smooth01((L.t - C.LAUNCH_CAM.HOLD) / launchRelease()));
    }
    /* A long drive is up for two seconds and more, and given back in the
       mini golf's second and a half the seat closed on it in one lurch half
       way down (CONFIG.LONG_CAM.RELEASE). */
    function launchRelease() {
        return C.LAUNCH_CAM.RELEASE * (G3.longHole(R.hole) ? C.LONG_CAM.RELEASE : 1);
    }

    function stepLaunch(dt, world, speed) {
        var m = R.cam.mode;
        if (world.moving && !R.wasMoving && (m === 'follow' || m === 'side') &&
            !R.fly && !R.dive && !R.replay && !R.lap) startLaunch(world.ball, speed);
        R.wasMoving = !!world.moving;
        if (R.launch) {
            R.launch.t += dt;
            if (R.launch.t > C.LAUNCH_CAM.HOLD + launchRelease() || R.fly || R.dive || R.replay ||
                (m !== 'follow' && m !== 'side')) R.launch = null;
        }
    }

    /* The chase: a long shot in the air, followed (CONFIG.LONG_CAM).

       It used to be the follow seat with the launch's lag on it: the seat let
       the ball go at the strike, fell sixteen units behind it by the top with
       the eye looking up at a speck in the sky, and then, as the lag was given
       back and the ball slowed, closed on it in a rush on the way down (the
       owner: "fix the full chase so it feels better"). Every part of that
       was emergent — a lerp chasing a seat that was itself moving at the
       ball's speed — so none of it could be tuned.

       So the chase is a seat of its own, placed rather than eased: from
       where the camera stood at the strike it drops back to DIST behind the
       ball over GROW and rides there, turned along the ball's course on TURN;
       its eye climbs RISE of the ball's height over UP, and on the way down
       comes down slower than the ball (DIVE of what it has fallen from the
       top), so the flight ends looked down on to where it lands. It is
       blended in over IN at the strike and out over OUT from the first
       landing, on to the follow seat, which is the one place anything eases. */
    function watchChase(world, dt) {
        stepAbove(world, dt);
        var LC = C.LONG_CAM, b = world.ball, ch = R.chase;
        var flying = world.moving && world.inAir && !world.firstLand && !world.warping && !world.ride &&
            G3.longHole(world.hole) && R.cam.mode === 'follow' && !R.fly && !R.dive && !R.replay && !R.lap;
        if (flying && (!ch || ch.out >= 0)) {
            var cp = R.camera.position, st = R.smooth.target;
            /* Where the look stood off the ball at the strike (`lx`…): the
               seat looks over the ball, and on a tee facing up a hill by a
               lot (the Pop-Up Book's: two units up the page in front of it).
               The chase looks at the ball itself, and taking that offset
               away at once dived the view ten degrees at the strike and
               swung it back up as the ball rose — the owner's phone: "very
               jarring … gives you motion sickness". So the offset rides
               with the ball and is given back over LOOK instead.

               Two kinds (`rides`, chaseRides): the driver's rides with the
               ball, blended from the seat as it stood at the strike carried
               along with it (`ox`…); every other club's eye (`px`…, with its
               velocity `vx`…) starts where the camera stands, in the world,
               and is held there (below). */
            var rides = chaseRides(), cup = world.hole.cup, o = world.origin;
            /* A shot from inside NEAR metres of the flag is the short game, and
               its eye is held HOLD seconds whatever the ball does (the owner:
               "within 20m of flag should perhaps almost be static. Perhaps
               around 1 s then move the camera"). */
            var fromCup = cup ? Math.hypot(o.x - cup.x, o.z - cup.z) * G3.distance.scale(world.hole) : Infinity;
            if (LC.ABOVE > 0) R.above = { rest: 0, lift: 0, up: 0 };
            ch = R.chase = { hold: fromCup < LC.NEAR ? LC.HOLD : 0, t: 0, out: -1, w: rides ? 0 : 1, peak: 0, floor: world.origin.y, rides: rides,
                on: false, vx: 0, vy: 0, vz: 0,
                yaw: Math.atan2(b.vx, b.vz), d0: Math.hypot(cp.x - b.x, cp.z - b.z), y0: cp.y - b.y,
                d3: Math.hypot(cp.x - b.x, cp.y - b.y, cp.z - b.z),
                px: cp.x, py: cp.y, pz: cp.z,
                lx: st.x - b.x, ly: st.y - b.y, lz: st.z - b.z, lk: 1,
                ox: cp.x - b.x, oy: cp.y - b.y, oz: cp.z - b.z };
        }
        if (!ch) return;
        ch.t += dt;
        if (ch.out < 0 && !flying) ch.out = 0;
        else if (ch.out >= 0) ch.out += dt;
        if (ch.rides) { rideChase(world, ch, dt); return; }
        /* All of it from the strike: the eye starts where the camera stood,
           so there is nothing to blend in. Out once it has walked to the
           follow seat (below); SETTLE seconds after the landing at the most. */

        /* The ground under the ball, eased (FLOOR): off a raised tee the
           tee's height would leave the eye coming down with the ball the
           whole way to a fairway below it, and the ground read raw would
           bob it over every bunker lip. */
        var g = P.surfaceTop(world.hole, b.x, b.z);
        if (g && ch.out < 0) ch.floor += (g.y + G3.ballR(world.hole) - ch.floor) * (1 - Math.pow(LC.FLOOR, dt));
        var floor = Math.min(ch.floor, b.y);
        var h = b.y - floor;
        if (ch.out < 0 && h > ch.peak) ch.peak = h;

        /* Held, then followed (the owner, v1.238.0: "the chase camera should
           be a lot slower. Like keep it static then follow. Especially for
           short game … felt like it's going back and forth"). It used to
           drop back to DIST behind the ball at the strike and ride there at
           the ball's own speed, then come in again to the follow seat after
           the landing: on a chip that was back and then forth inside two
           seconds, and on a drive the eye set off at thirty units a second.

           Now the eye stands where it was at the strike and only the look
           turns after the ball, until the ball is LEASH units away across
           the ground. Then it is drawn after it towards LEASH behind the
           ball, on the line from the eye, by `follow` below: a critically
           damped spring that is never faster than MAX, so it sets off from
           rest, falls behind a drive and keeps walking, and never overshoots
           or goes backwards. Its height waits as well: held until the
           leash is taken up, then towards UP over the ground the ball left
           plus RISE of the ball's height, coming down slower than the ball
           (DIVE). From the first landing what it makes for is the follow
           seat at the ball (`R.rawSeat`, seatFor), at the same pace, and the
           picture is that seat's once the eye is there (ARRIVE). A pitch or
           a chip lands inside the leash, so the camera stands still while it
           is up and then walks forward to the next shot. */
        var gx = ch.px, gy = ch.py, gz = ch.pz, S = R.rawSeat;
        if (ch.out < 0) {
            var ex = b.x - ch.px, ez = b.z - ch.pz, D = Math.sqrt(ex * ex + ez * ez);
            if (D > LC.LEASH) ch.on = true;
            if (ch.on) {
                var pull = Math.max(0, D - LC.LEASH) / (D || 1);
                gx = ch.px + ex * pull; gz = ch.pz + ez * pull;
                gy = floor + LC.UP + h * LC.RISE + LC.DIVE * Math.max(0, ch.peak - h);
            }
        } else if (S) {
            gx = S.px; gy = S.py; gz = S.pz;
        }
        if (ch.t < ch.hold) { gx = ch.px; gy = ch.py; gz = ch.pz; }
        follow(ch, gx, gy, gz, dt);
        var under = P.surfaceTop(world.hole, ch.px, ch.pz);
        if (under && ch.py < under.y + LC.CLEAR) {
            ch.py = under.y + LC.CLEAR;
            if (ch.vy < 0) ch.vy = 0;
        }
        /* Handed back once the eye is at the seat: its weight goes as the
           distance left inside ARRIVE, and only ever down, at no more than
           a share a frame that takes most of a second. */
        if (ch.out >= 0 && S && ch.t >= ch.hold) {
            var left = Math.hypot(S.px - ch.px, S.py - ch.py, S.pz - ch.pz);
            ch.w = Math.min(ch.w, Math.max(smooth01(left / LC.ARRIVE), ch.w - dt / 0.8));
            if (ch.w <= 0.001 || ch.out > LC.SETTLE) { R.chase = null; return; }
        }
        ch.lk = 1 - smooth01(ch.t / LC.LOOK);
    }

    /* The lift after a long shot (LONG_CAM.ABOVE): up while the ball is
       moving, on the same smooth curve, then down over ABOVE_T seconds from
       the moment it is at rest. Gone when it is down, or when the seat is no
       longer the follow seat. */
    function stepAbove(world, dt) {
        var A = R.above, LC = C.LONG_CAM;
        if (!A) return;
        if (R.cam.mode !== 'follow' || R.fly || R.dive || R.replay || !(LC.ABOVE > 0)) { R.above = null; return; }
        if (world.moving) { A.rest = 0; A.up = Math.min(1, A.up + dt / Math.max(0.05, LC.ABOVE_T)); }
        else A.rest += dt;
        var down = 1 - smooth01(A.rest / Math.max(0.05, LC.ABOVE_T));
        A.lift = LC.ABOVE * smooth01(A.up) * down;
        if (!world.moving && A.rest >= LC.ABOVE_T) R.above = null;
    }

    /* Which chase a shot gets: the driver's rides with the ball, as it did
       before v1.238.0 (the owner: "I think it looks quite ok for driver, but
       for any other club it's weird"); every other club's is held, then
       followed (watchChase). LONG_CAM.RIDE names the clubs that ride. The
       club is the one the frame was handed (`aim.club`, game.js). */
    function chaseRides() {
        return C.LONG_CAM.RIDE.indexOf(R.aimClub) >= 0;
    }

    /* The riding chase, unchanged from v1.237.0: from where the camera stood
       at the strike it drops back to DIST behind the ball over GROW and rides
       there, turned along the ball's course on TURN; its eye climbs RISE of
       the ball's height over UP, and on the way down comes down slower than
       the ball (DIVE), so the flight ends looked down on to where it lands.
       Blended in over IN at the strike and out over OUT from the first
       landing, on to the follow seat. */
    function rideChase(world, ch, dt) {
        var LC = C.LONG_CAM, b = world.ball;
        ch.w = smooth01(ch.t / LC.IN) * (ch.out >= 0 ? 1 - smooth01(ch.out / LC.OUT) : 1);
        if (ch.out >= LC.OUT) { R.chase = null; return; }
        var hs = Math.sqrt(b.vx * b.vx + b.vz * b.vz);
        if (ch.out < 0 && hs > 1) {
            var turn = Math.atan2(b.vx, b.vz) - ch.yaw;
            turn = Math.atan2(Math.sin(turn), Math.cos(turn));
            ch.yaw += turn * (1 - Math.pow(LC.TURN, dt));
        }
        var g = P.surfaceTop(world.hole, b.x, b.z);
        if (g && ch.out < 0) ch.floor += (g.y + G3.ballR(world.hole) - ch.floor) * (1 - Math.pow(LC.FLOOR, dt));
        var floor = Math.min(ch.floor, b.y);
        var h = b.y - floor;
        if (ch.out < 0 && h > ch.peak) ch.peak = h;
        var grow = smooth01(ch.t / LC.GROW);
        var d = ch.d0 + (LC.DIST - ch.d0) * grow;
        var up = ch.y0 + (LC.UP - ch.y0) * grow;
        ch.px = b.x - Math.sin(ch.yaw) * d;
        ch.pz = b.z - Math.cos(ch.yaw) * d;
        ch.py = floor + up + h * LC.RISE + LC.DIVE * Math.max(0, ch.peak - h);
        var under = P.surfaceTop(world.hole, ch.px, ch.pz);
        if (under && ch.py < under.y + LC.CLEAR) ch.py = under.y + LC.CLEAR;
        ch.lk = 1 - smooth01(ch.t / LC.LOOK);
        // Looking AIM_LOW of the ball's height under it: down the hole, with
        // the ball high in the picture while it climbs, and level with it again
        // as it comes down.
        ch.drop = (LC.AIM_LOW || 0) * h;
    }

    /* The chase's eye after `g…`: a critically damped spring of FOLLOW per
       second, so it sets off from rest and comes to rest with no corner and
       no overshoot, and never faster than MAX — what makes it a camera that
       falls behind a drive and keeps walking, rather than one that keeps up
       with it. Its velocity is carried in `ch.v…`. */
    function follow(ch, gx, gy, gz, dt) {
        var LC = C.LONG_CAM, w = LC.FOLLOW, n = Math.max(1, Math.ceil(dt / (1 / 120))), h = dt / n, i, sp;
        for (i = 0; i < n; i++) {
            ch.vx += (w * w * (gx - ch.px) - 2 * w * ch.vx) * h;
            ch.vy += (w * w * (gy - ch.py) - 2 * w * ch.vy) * h;
            ch.vz += (w * w * (gz - ch.pz) - 2 * w * ch.vz) * h;
            sp = Math.sqrt(ch.vx * ch.vx + ch.vy * ch.vy + ch.vz * ch.vz);
            if (sp > LC.MAX) { ch.vx *= LC.MAX / sp; ch.vy *= LC.MAX / sp; ch.vz *= LC.MAX / sp; }
            ch.px += ch.vx * h; ch.py += ch.vy * h; ch.pz += ch.vz * h;
        }
    }

    /* Motion blur (CONFIG.MOTION_BLUR, postfx.js). What postfx needs is
       where each pixel's bit of course was on the screen a frame ago, and
       for that it needs a depth it does not have — the scene buffer is
       multisampled and its depth cannot be read back. So it assumes one:
       the ground is a level plane at the height of the ground under the
       ball, and anything above the horizon is far away. On a golf hole
       that is right where it matters (the grass streaming past the lens)
       and harmlessly wrong elsewhere. It is handed last frame's
       view-projection and this frame's camera and does the rest per pixel.

       On only while a shot is being watched from a seat that follows it,
       faded in with the ball's speed — and never across a cut: a camera
       that moved further in a frame than anything here can travel has been
       put somewhere, and a smear from the old place would be a smear of a
       different picture. */
    var _blurRot = new THREE.Matrix3(), _blurBall = new THREE.Vector3();
    function motionBlur(dt, world, speed) {
        if (!R.fx || !G3.postfx.motion) return;
        var MB = C.MOTION_BLUR, cam = R.camera, m = R.cam.mode;
        var seat = R.replay || ((m === 'follow' || m === 'side') && !R.fly && !R.dive && !R.lap);
        var want = world.moving && seat && !world.warping && !world.ride
            ? Math.max(0, Math.min(1, (speed - MB.FROM) / MB.SPAN)) : 0;
        // In over a few frames; out much faster, so a ball dropped back on
        // the tee after a penalty does not take the smear with it.
        R.blurK += (want - R.blurK) * (1 - Math.pow(want > R.blurK ? 0.02 : 1e-5, dt));
        if (want === 0 && R.blurK < 0.01) R.blurK = 0;
        cam.updateMatrixWorld();
        var prev = R.blurPrev;
        if (!prev) prev = R.blurPrev = { vp: new THREE.Matrix4(), pos: new THREE.Vector3(), ok: false };
        var jump = prev.ok ? cam.position.distanceTo(prev.pos) : Infinity;
        if (R.blurK > 0.01 && jump < 0.5 + 60 * dt) {
            var ball = world.ball;
            var under = P.surfaceTop(world.hole, ball.x, ball.z);
            _blurBall.set(ball.x, ball.y, ball.z).project(cam);
            G3.postfx.motion({
                k: R.blurK,
                vp: prev.vp,
                rot: _blurRot.setFromMatrix4(cam.matrixWorld),
                eye: cam.position,
                tanH: Math.tan(cam.fov * Math.PI / 360),
                aspect: cam.aspect,
                ground: under ? under.y : ball.y - 2,
                scale: MB.SHUTTER * (1 / 60) / Math.max(dt, 1 / 240),
                max: MB.MAX,
                ball: _blurBall.z < 1 ? [_blurBall.x * 0.5 + 0.5, _blurBall.y * 0.5 + 0.5] : [-9, -9],
                sharp: MB.SHARP,
                keep: G3.bag && G3.bag.screenBox && !R.replay ? G3.bag.screenBox(cam, cam.aspect) : null
            });
        } else {
            G3.postfx.motion(null);
        }
        prev.vp.multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse);
        prev.pos.copy(cam.position);
        prev.ok = true;
    }

    /* The camera on a loop (physics.js, "the loop").

       The seat behind the ball looks straight up the lane at a loop, and a
       loop seen from its foot is a hoop seen edge-on: the ride, which is the
       best thing on the course, was a ball going up and coming down a line.
       So while the ball is on the track — riding it, or falling off it — and
       for a moment after it comes out, the camera stands off to the side and
       looks at the loop's face, on whichever side it already was so it never
       swings through the track. The ordinary easing in updateCamera carries
       it over and back; the seat itself is untouched, which is what the
       intro's hand-off is measured against. */
    function watchLoop(world, dt) {
        var rd = world.ride || world.fall;
        if (rd && rd.loop) {
            R.loopCam = { L: rd.loop, F: rd.frame, base: rd.base, hold: 0.9, side: R.loopCam ? R.loopCam.side : 0 };
        } else if (R.loopCam) {
            R.loopCam.hold -= dt;
            if (R.loopCam.hold <= 0 || !world.moving) R.loopCam = null;
        }
    }

    /* The camera through a pipe (physics.js, "the wormhole").

       From the seat behind the ball a pipe is a ball vanishing into the
       floor and then, across the hole, a ball dropping out of a sky the
       camera is not looking at. So the moment the ball is gone — the dark,
       while the portal opens — the picture cuts to a seat that holds both
       the portal and the exit: off to one side of the exit's heading and
       behind it, so the drop comes down across the frame and rolls on away
       from the lens. Cut, not eased, the way the replay cuts to the cup: the
       ball is nowhere for a fifth of a second, and a camera sweeping across
       the hole in that time is a smear. It holds for most of a second after
       the landing and then the ordinary easing carries it back to the seat.

       The seat is picked once, when the ride reaches the dark: the side the
       camera already stands on first, then the other, then wider and
       narrower, taking the first with a clear line to both the portal and
       the landing (a dome or a wall round the exit is exactly where a fixed
       seat would be looking at the back of something). */
    var WARP_SEATS = [0.8, 0.45, 1.2, 0.1, 1.6];
    function watchWarp(world, dt) {
        var wr = world.warping;
        if (wr && P.warpPhase(wr).phase !== 'swallow') {
            if (!R.warpCam || R.warpCam.key !== wr.px + ':' + wr.pz + ':' + wr.w.tx) R.warpCam = warpSeat(world.hole, wr);
            R.warpCam.hold = 0.85;
        } else if (R.warpCam) {
            R.warpCam.hold -= dt;
            if (R.warpCam.hold <= 0 || !world.moving || wr) R.warpCam = null;
        }
    }

    function clearView(p, x, y, z) {
        _rayFrom.set(p.x, p.y, p.z);
        _rayDir.set(x - p.x, y - p.y, z - p.z);
        var len = _rayDir.length();
        if (len < 1e-3) return true;
        _rayDir.multiplyScalar(1 / len);
        _ray.set(_rayFrom, _rayDir);
        _ray.far = len;
        var hits = _ray.intersectObject(R.holeGroup, true), i;
        for (i = 0; i < hits.length; i++) {
            var o = hits[i].object;
            if (o.isMesh && o.visible && hits[i].distance < len - 0.5) return false;
        }
        return true;
    }

    function warpSeat(hole, wr) {
        var w = wr.w, fx = Math.sin(w.yaw), fz = Math.cos(w.yaw);
        // What it looks at: two fifths of the way from the landing to the portal.
        var tx = w.tx + (wr.px - w.tx) * 0.4, tz = w.tz + (wr.pz - w.tz) * 0.4;
        var ty = wr.ey + (wr.py - wr.ey) * 0.4;
        var dist = 5.4 + wr.back * 0.5;
        var cam = R.camera.position;
        var side = ((cam.x - w.tx) * fz - (cam.z - w.tz) * fx) < 0 ? -1 : 1;
        var best = null, i, k, a, s;
        for (i = 0; i < WARP_SEATS.length * 2 && !best; i++) {
            a = WARP_SEATS[i >> 1] * (i & 1 ? -side : side);
            var bx = -fx * Math.cos(a) + fz * Math.sin(a), bz = -fz * Math.cos(a) - fx * Math.sin(a);
            s = { x: tx + bx * dist, y: ty + 1.3, z: tz + bz * dist };
            var top = P.surfaceTop(hole, s.x, s.z);
            if (top && s.y < top.y + 1.1) s.y = top.y + 1.1;
            if (clearView(s, w.tx, wr.ey, w.tz) && clearView(s, wr.px, wr.py, wr.pz)) best = s;
            if (i === 0) k = s;
        }
        s = best || k;
        return { key: wr.px + ':' + wr.pz + ':' + w.tx, w: w, cut: true, hold: 0.85,
            px: s.x, py: s.y, pz: s.z, tx: tx, ty: ty, tz: tz };
    }

    function loopSeat(lc, out) {
        var L = lc.L, F = lc.F;
        // The middle of the circle, half way along the corkscrew's drift.
        var cx = L.x + F.lx * F.k * Math.PI, cz = L.z + F.lz * F.k * Math.PI, cy = lc.base + L.R;
        if (!lc.side) {
            var cam = R.camera.position;
            lc.side = ((cam.x - cx) * F.lx + (cam.z - cz) * F.lz) < 0 ? -1 : 1;
        }
        var d = L.R * 3.2 + 2.6;
        out.px = cx + F.lx * lc.side * d - F.fx * L.R * 0.6;
        out.pz = cz + F.lz * lc.side * d - F.fz * L.R * 0.6;
        out.py = cy + L.R * 0.4;
        out.tx = cx; out.ty = cy; out.tz = cz;
        return out;
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
    /* The air for a camera looking down on the hole from `dist` away: past
       the far corner of the hole, with the horizon still fading — a map with
       no distance at all reads as a cardboard cut-out. A theme with thin air
       (`air`) pushes both back by half as much again as it pushes the
       ground-level fog, so the hole itself stands clear of the haze from
       above and only the country round it fades. The turntable photographs
       through this same function. */
    function overFog(dist, radius) {
        var k = R.theme && R.theme.air ? 1 + (R.theme.air - 1) * 0.5 : 1;
        return {
            near: Math.max(R.fogNear, dist * 0.85 * k),
            far: Math.max(R.fogFar, (dist * 1.5 + radius * 2.2) * k)
        };
    }

    function atmosphere(dt) {
        var want = R.cam.mode === 'over' ? 1
                 : (R.cam.mode === 'demo' ? C.DEMO_CAM.LIFT
                 : (R.cam.mode === 'editor' ? 0.75 : 0));
        if (R.cam.mode === 'flight' && R.hole) {
            var fOver = R.cam.flight.y - flyGround(R.hole, R.cam.flight.x, R.cam.flight.z, 0);
            want = Math.max(0, Math.min(1, (fOver - C.FLY.AIR_FROM) / C.FLY.AIR_SPAN));
        }
        /* The intro sweep asks for the same thing, in proportion to how far off
           the ground it is: at the apex it is as far up as the map and looking
           through as much weather, and near the tee it is on the course and
           wants the hole's own air back. It eases through this on the way down
           rather than at the end, so there is no pop as it lands. */
        if (R.fly && R.fly.lift > want) want = R.fly.lift;
        R.lift += (want - R.lift) * (1 - Math.pow(0.008, dt));
        if (R.lift < 0.002) R.lift = 0;
        if (R.lift > 0.998) R.lift = 1;

        var over = overFog(R.overDist || 40, R.overRadius || 20);
        if (R.scene.fog) {
            R.scene.fog.near = R.fogNear + (over.near - R.fogNear) * R.lift;
            R.scene.fog.far = R.fogFar + (over.far - R.fogFar) * R.lift;
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

        /* There was a white ring under the ball as well, breathing so a
           four-pixel ball could be found from the overview. It went in
           v1.74.0 (the owner: "redundant — you clearly see the ball"). */
        R.markCup = flat(0.5, 0.66, 0xffd166, 0.9);
        R.markCupHalo = flat(0.88, 0.98, 0xffd166, 0.36);

        R.marks.add(R.markCup, R.markCupHalo);
        R.scene.add(R.marks);
    }

    function placeMarkers(hole, ball) {
        if (!R.marks) return;
        /* Not during the intro. These rings are a map's legend — drawn
           through the ground so a ridge hides neither — and a sweep over the
           course with the depth test off is a sweep with two glowing discs
           riding over the hills in front of it. */
        R.marks.visible = R.lift > 0.01 && !R.fly && R.cam.mode !== 'flight';
        if (!R.marks.visible) return;
        R.markCup.position.set(hole.cup.x, hole.cup.y + 0.02, hole.cup.z);
        R.markCupHalo.position.set(hole.cup.x, hole.cup.y + 0.02, hole.cup.z);
        // A slow breath on the cup's outer ring, because from up here a
        // moving thing is easier to find.
        var pulse = 0.72 + 0.28 * Math.sin(R.clock * 2.4);
        R.markCup.material.opacity = 0.9 * R.lift;
        R.markCupHalo.material.opacity = 0.36 * R.lift * (1.44 - pulse);
    }

    /* The tracking lens (LONG_CAM.TRACK): under a held chase the camera
       stands still while the ball flies away from it, so on a fixed lens the
       ball shrank to a third of its size and grew back as the eye walked up
       after it — a zoom out and in made by the camera standing still. This
       zooms in as the ball leaves, the way a camera on a tripod at a
       tournament does, so the ball keeps TRACK of its size: the lens's
       half-angle goes as (distance at the strike / distance now) ^ TRACK.
       By the chase's weight, so it opens back as the eye arrives at the
       seat — where the distance is the strike's again anyway. */
    function trackFov(world, base) {
        var ch = R.chase, LC = C.LONG_CAM;
        if (!ch || ch.rides || !(LC.TRACK > 0) || !ch.d3 || R.cam.mode !== 'follow') return base;
        var b = world.ball, cp = R.camera.position;
        var d = Math.sqrt((cp.x - b.x) * (cp.x - b.x) + (cp.y - b.y) * (cp.y - b.y) + (cp.z - b.z) * (cp.z - b.z));
        var r = Math.min(1, ch.d3 / Math.max(d, 1e-3));
        var tight = 2 * Math.atan(Math.tan(base * Math.PI / 360) * Math.pow(r, LC.TRACK)) * 180 / Math.PI;
        tight = Math.max(LC.TRACK_MIN || 12, tight);
        return base + (tight - base) * Math.max(0, Math.min(1, ch.w));
    }

    function frame(dt, world, aim) {
        if (!R.ready || !R.holeGroup) return;
        R.clock += dt;
        if (aim && aim.club) R.aimClub = aim.club;

        syncMovers(world.time);
        rollBall(world.ball);
        if (R.ballMats) {
            R.ballMats.uniforms.uGbTime.value = R.clock;
            R.ballMats.uniforms.time.value = R.clock;
            R.ballMats.uniforms.fogNear.value = R.scene.fog ? R.scene.fog.near : R.fogNear;
            R.ballMats.uniforms.fogFar.value = R.scene.fog ? R.scene.fog.far : R.fogFar;
        }

        /* Speed, spent two ways: the camera eases back and the lens opens a
           little, both of which read as "this one is going somewhere".
           Not on a long hole, except under the driver's riding chase: there
           the camera stands still while the ball goes, and a lens opening
           and closing under a camera that is not moving is a zoom out and
           back in for no reason anyone can see (v1.245.0). */
        var speed = Math.hypot(world.ball.vx, world.ball.vy, world.ball.vz);
        var lens = C.SPEED_LENS === undefined ? 1 : C.SPEED_LENS;
        var longH = G3.longHole(world.hole);
        /* …and under it only by its weight, so the lens closes as the chase
           hands back to the follow seat, not in a third of a second after it
           has gone (v1.249.0: 58.5° back to 52° on a drive's landing). */
        if (longH) lens *= R.chase && R.chase.rides ? R.chase.w : 0;
        var wantPull = Math.min(3.2, speed * 0.14) * lens;
        var ease = 1 - Math.pow(0.06, dt);
        R.cam.speedPull += (wantPull - R.cam.speedPull) * ease;
        /* The lens is three parts: the hole's (eased, so a long hole's own
           FOV comes in gently), the speed's (eased), and the tracking lens on
           top of the first, which is not eased again — it is read off the
           camera's smoothed distance from the ball, and a lag on it left the
           lens tight while the camera walked up, so the ball overshot to
           bigger than it was struck at. */
        var baseFov = longH && C.LONG_CAM.FOV ? C.LONG_CAM.FOV : 52;
        if (R.cam.baseFov === undefined) { R.cam.baseFov = baseFov; R.cam.speedFov = 0; }
        R.cam.baseFov += (baseFov - R.cam.baseFov) * ease;
        R.cam.speedFov += (Math.min(7, speed * 0.4) * lens - R.cam.speedFov) * ease;
        var wantFov = trackFov(world, R.cam.baseFov) + R.cam.speedFov;
        if (Math.abs(R.camera.fov - wantFov) > 0.01) {
            R.camera.fov = wantFov;
            R.camera.updateProjectionMatrix();
        }
        R.cam.kick *= Math.pow(0.008, dt);
        if (R.cam.kick < 0.002) R.cam.kick = 0;

        // The tail only follows a ball that is actually going somewhere — and
        // not through a pipe, where it would be a line drawn straight across
        // the hole from the mouth to the sky. It starts again at the portal,
        // so the drop leaves a streak.
        var tailed = !world.warping || P.warpPhase(world.warping).phase === 'drop';
        stepTracer(dt, world);
        if (world.moving && speed > 1.2 && tailed) {
            R.trailOn = true;
            // As wide as the ball is drawn (`lookFor`), and through its middle.
            R.trailW = R.look;
            pushTrail(world.ball.x, R.ball.position.y, world.ball.z, speed);
        } else if (R.trailOn) {
            // The streak does not vanish when the ball stops: it runs out
            // behind it, the same fade it had while moving.
            if (R.trailN > 1) drawTrail(C.TRAIL_LOOK);
            if (R.trailN < 2 || R.clock - R.trailT[R.trailAt] > C.TRAIL_LOOK.LIFE) { R.trailOn = false; clearTrail(); }
        }
        // On glass the ball leaves a wake behind it (stepWake).
        if (R.glow) stepWake(world, speed);

        updateAim(world, aim);
        stepParticles(dt);
        stepCelebration(dt);
        // What the sand does back: spray and a furrow off a rolling ball.
        if (G3.sandfx) G3.sandfx.step(dt, world);
        // …and what the rest of the ground does: clippings, spray, frost (groundfx.js).
        if (G3.groundfx) G3.groundfx.step(dt, world);
        stepRipples(dt);
        stepBlackHoles(dt, world);
        stepBelts();
        stepLava(world);
        if (G3.worlds) G3.worlds.step(dt, R.clock);
        watchLoop(world, dt);
        watchWarp(world, dt);
        stepLaunch(dt, world, speed);
        watchChase(world, dt);
        updateCamera(world.hole, world.ball, dt);
        motionBlur(dt, world, speed);
        if (R.fx && G3.postfx.lens) G3.postfx.lens(lensList());

        // The live world behind the hole, from where the camera now is.
        stepPlace(dt, world);

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
        swayTrees(wind);
        bobDecor(wind);
        glowPosts(dt);
        if (G3.life) G3.life.update(dt, R.clock);

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
           picture that says the camera is not really up there. The demo's
           orbit is the same picture and the same tell, with the extra reason
           that there is nobody there to pick a club out of it. */
        var front = null;
        if (G3.bag) {
            G3.bag.setVisible(!R.fly && !R.dive && !R.lap && !R.replay && R.cam.mode !== 'demo' && R.cam.mode !== 'flight');
            // With the post chain the course behind the open row is blurred
            // (postfx.js `backdrop`) and the bag lit on its own layer, so the
            // course keeps its light and its water; without it, the scrim.
            G3.bag.setBackdrop(!!R.fx);
            G3.bag.update(dt, R.camera, R.camera.aspect);
            // And the club in hand, behind the ball (bag.js `address`).
            G3.bag.addressUpdate(dt, !!(aim && aim.show && !world.moving && !world.sunk) &&
                !R.fly && !R.dive && !R.lap && !R.replay && R.cam.mode !== 'demo' && R.cam.mode !== 'flight', world.ball, aim ? aim.yaw : 0, R.camera, R.look);
            var open01 = G3.bag.state.open01;
            if (R.fx && open01 > 0.002) front = { k: open01, dim: BACK_DIM, layer: G3.bag.LAYER, lights: passLights };
            /* And the course's own light goes down as the clubs come out.
               Those three are the hole's weather — a dusk sky, a low sun — and
               they light the clubs as well as the course, so the same row read
               bright on one hole and murky on the next. Turned most of the way
               down, what is left on the clubs is the bag's studio and its
               spotlight, which are the same everywhere. The course is behind
               the scrim by then and going dark anyway; the sky and the water
               are unlit and keep their colour. */
            R.courseDim = (1 - (R.fx ? 0 : COURSE_DIM * open01)) * (R.live ? 0.9 : 1);
            passLights(null);
            hideWaterUnderBag(!R.fx && open01 > 0.5);
        }

        /* The sun's shadow map is left as it is on alternate frames while
           nothing that plays is moving (shadowRests). Only for this draw:
           the switch goes back on behind it, so anything else that draws
           the scene (the turntable, the suites) still gets its shadows. */
        var rest = shadowRests(world);
        if (rest) R.renderer.shadowMap.autoUpdate = false;
        var drawn = R.fx && G3.postfx.render(R.scene, R.camera, R.live ? null : sunOnScreen(), dt, front);
        if (!drawn) {
            R.renderer.setRenderTarget(null);
            R.renderer.render(R.scene, R.camera);
        }
        if (rest) R.renderer.shadowMap.autoUpdate = true;
    }

    /* Whether this frame may go without drawing the shadow map again.

       The map is the whole hole drawn a second time from the sun — every
       rail, trunk and stone, a third of a frame's draw calls on a mini hole
       and on a parkland one alike — and the sun does not move. Most of a
       round is spent standing over a ball that is not moving either, and
       what still stirs then is slow: a flag, a crown in the wind, the club
       being turned with the aim. Their shadows are drawn every other frame,
       which at sixty frames is thirty times a second and not something an
       eye can find. The moment a ball is struck, or on any hole with a gate,
       a blade or a sail on it — things a shot is timed against — the map is
       drawn every frame as it always was, and so is the first frame of a
       hole, which has no map yet. */
    function shadowRests(world) {
        R.shadowTick = ((R.shadowTick || 0) + 1) & 1023;
        if (!R.sun || !R.sun.shadow || !R.sun.shadow.map) return false;
        if (!world || world.moving || world.warping || world.ride || R.replay || R.movers.length) return false;
        return (R.shadowTick & 1) === 1;
    }

    /* Without the post chain the open picker's backdrop is the bag's scrim,
       and the water — unlit and transparent — came through it as a bright
       blue line across the row. So on that path, while the bag is mostly
       open, the water is simply not drawn; behind a scrim that dark nothing
       is missed. (With the chain the course is blurred instead and keeps it.) Walked only when the answer changes, and the hole's
       build resets it (a new hole's water starts drawn). */
    function hideWaterUnderBag(hide) {
        if (!!R.waterHidden === hide) return;
        R.waterHidden = hide;
        R.scene.traverse(function (o) {
            var m = o.material;
            if (!m) return;
            var water = Array.isArray(m)
                ? m.some(function (x) { return R.waterMats.indexOf(x) >= 0; })
                : R.waterMats.indexOf(m) >= 0;
            if (water) o.visible = !hide;
        });
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

    /* The flag. It **points downwind**, it **ripples** harder the harder it
       blows, and on a still day it **hangs** — and since v1.258.0 all three
       come out of a cloth simulation (flag.js) rather than being drawn on:
       the air is the weather's wind in metres a second (weather.js reads
       `speed × 34` as km/h), less the pin's own movement, turned into the
       pole's frame. Low quality, and the last rung of Auto, keep the old
       drawn ripple (waveFlag), which costs nothing.

       Level of detail, by how tall the flag stands on the screen: close up
       it is drawn through the fine sheet; far off the simulation relaxes
       its constraints half as often, which nobody can see at a dozen pixels. */
    var WIND_MS = 34 / 3.6;
    var FLAG_NEAR_ON = 70, FLAG_NEAR_OFF = 55, FLAG_FAR = 14;   // css px of flag height
    var _flagAir = { x: 0, y: 0, z: 0 };
    var _flagAt = new THREE.Vector3();

    function clothOn() {
        var T = C.QUALITY_TIERS && C.QUALITY_TIERS[R.quality];
        if (T && R.quality !== 'auto') return T.cloth !== false;
        if (R.quality === 'auto' && R.autoStep !== undefined && C.QUALITY_AUTO) return autoRung().cloth !== false;
        return true;
    }

    // How many css pixels tall the flag stands on the screen.
    function flagPixels() {
        if (!R.camera || !R.renderer) return 0;
        R.flagSwivel.getWorldPosition(_flagAt);
        var d = Math.max(0.05, R.camera.position.distanceTo(_flagAt));
        var hPx = R.renderer.domElement.clientHeight || R.renderer.domElement.height || 600;
        return FLAG_H * hPx / (2 * d * Math.tan((R.camera.fov || 50) * Math.PI / 360));
    }

    function flapFlag(dt, wind) {
        if (!R.flagCloth || !R.flagSwivel) return;
        var t = R.clock;

        if (R.pinShake > 0) {
            R.pinShake = Math.max(0, R.pinShake - dt * 2.6);
            var q = R.pinShake * R.pinShake;
            R.pin.rotation.z = Math.sin(t * 34) * 0.07 * q;
            R.pin.rotation.x = -R.pinLean + Math.sin(t * 29 + 1.2) * 0.05 * q;
        }

        // The air through the flag, in the pole's frame: the wind, less the
        // pin's own movement over the hole (the celebration flies it).
        var p = R.pin.position, vx = 0, vy = 0, vz = 0;
        if (R.flagLast && dt > 0) {
            vx = (p.x - R.flagLast.x) / dt; vy = (p.y - R.flagLast.y) / dt; vz = (p.z - R.flagLast.z) / dt;
        } else if (!R.flagLast) R.flagLast = new THREE.Vector3();
        R.flagLast.copy(p);
        var wx = wind.x * WIND_MS - vx, wz = wind.z * WIND_MS - vz;
        var ca = Math.cos(R.pin.rotation.y), sa = Math.sin(R.pin.rotation.y);
        _flagAir.x = wx * ca - wz * sa;
        _flagAir.y = -vy;
        _flagAir.z = wx * sa + wz * ca;

        if (!R.flagSim || !clothOn()) { waveFlag(wind); return; }
        if (!R.pin.visible) return;
        var F = G3.flag, sim = R.flagSim;
        if (R.flagMode !== 'sim') {
            // A fresh hole's flag starts out already flying.
            F.settle(sim, R.flagMode === null ? 1.5 : 0.4, _flagAir);
            R.flagMode = 'sim';
            R.flagSwivel.rotation.y = 0;
        }

        var px = flagPixels();
        R.flagNear = R.flagFine && (R.flagNear ? px > FLAG_NEAR_OFF : px > FLAG_NEAR_ON);
        sim.iters = px < FLAG_FAR ? 3 : 6;
        F.step(sim, dt, _flagAir);

        var mesh = R.flagNear ? R.flagFine : R.flagCloth;
        var g = mesh.geometry, at = g.attributes.position;
        if (R.flagNear) F.fill(sim, R.flagSmooth, at.array);
        else at.array.set(sim.pos);
        at.needsUpdate = true;
        g.computeVertexNormals();
        R.flagCloth.visible = !R.flagNear;
        if (R.flagFine) R.flagFine.visible = !!R.flagNear;
    }

    /* The drawn ripple, for Low: the swivel turns the whole sheet downwind
       and a sine travels along it, growing towards the fly, with the sheet
       sagging by as much as the wind fails to hold it up. */
    function waveFlag(wind) {
        var t = R.clock;
        var gust = Math.min(1, wind.speed / 0.95);
        R.flagMode = 'wave';
        if (R.flagFine) R.flagFine.visible = false;
        R.flagCloth.visible = true;
        R.flagNear = false;
        // Local +x along the air: three.js turns +x to (cos θ, 0, −sin θ).
        R.flagSwivel.rotation.y = Math.atan2(-_flagAir.z, _flagAir.x) + Math.sin(t * 1.7) * 0.10 * gust;

        var g = R.flagCloth.geometry.attributes.position;
        var rest = R.flagRest;
        var sag = (1 - gust) * 0.42;
        for (var i = 0; i < g.count; i++) {
            var lx = rest[i * 3];                 // 0 at the hoist, FLAG_W at the fly
            var f = lx / FLAG_W;
            var ripple = Math.sin(t * (5 + gust * 7) - lx * 7.5) * (0.02 + gust * 0.13) * f;
            g.setX(i, lx);
            g.setZ(i, ripple);
            // A limp flag falls, and it falls further the further out it is.
            g.setY(i, rest[i * 3 + 1] - sag * f * f - Math.abs(ripple) * 0.35);
        }
        g.needsUpdate = true;
        R.flagCloth.geometry.computeVertexNormals();
    }

    /* ── effects the game asks for ──────────────────────────────────────── */

    /* Into the water: the crown, the column, the mist and the rings
       (groundfx.js), and a big entry flinches the camera. */
    function splashAt(x, y, z) {
        if (!G3.groundfx || !R.holeGroup) { burst(x, y, z, 0x9fd8ff, 26, 2.6); return; }
        var h = G3.groundfx.splash(x, y, z);
        if (h > 0.5) R.cam.kick = Math.max(R.cam.kick, (h - 0.5) * 0.45);
    }
    // Lava's: a spit of embers, higher and hotter than a splash, and smoke.
    function emberAt(x, y, z) {
        if (!G3.groundfx || !R.holeGroup) { burst(x, y, z, 0xff7a1a, 34, 3.4); return; }
        G3.groundfx.lava(x, y, z);
    }
    /* A landing on anything that is not sand or water: clippings and a
       shiver off grass, splinters off a plank, frost off ice (groundfx.js).
       Not on glass, which has its own answer (hitAt). */
    function groundAt(x, y, z, kind) {
        if (!G3.groundfx || !R.holeGroup || R.glow) return;
        var h = G3.groundfx.land(R.hole, x, y, z, kind);
        if (h > 0.6) R.cam.kick = Math.max(R.cam.kick, (h - 0.6) * 0.3);
    }
    // A ball into a rail hard enough to hear.
    function knockAt(x, y, z, speed) {
        if (G3.groundfx && R.holeGroup && !R.glow) G3.groundfx.knock(x, y, z, speed);
    }

    /* The grid world's effects (Challenge mode). A landing or a rail hit on
       glass sends a ripple out through the floor from where it happened, with
       a pinch of cyan sparks only when it is properly hard; a rolling ball
       leaves a wake of smaller ripples (frame) and drags a neon tail
       (pushTrail's tint). Nothing here touches the simulation — it is what
       the ground does *back*. It used to be a fistful of sparks and a flat
       ring of light on every bounce, which the owner found a bit much; a soft
       touch-down now makes no ring at all, only the wake. */
    function hitAt(x, y, z, speed) {
        if (!R.glow) return;
        if (speed > 1.5) ripple(x, y, z, 0.2 + speed * 0.08);
        if (speed > 4) burst(x, y + 0.05, z, 0x27f0ff, Math.min(8, Math.round(speed)), 0.8 + Math.min(1, speed * 0.1));
    }
    /* A landing in a bunker. sandfx.js reads how the ball came down — how
       fast, how flat, after how long in the air — and throws the crown, the
       dust and the crater to match; a big arrival also flinches the camera. */
    function sandAt(x, y, z) {
        if (!G3.sandfx || !R.holeGroup) { burst(x, y, z, 0xe8d8a8, 14, 1.5); return; }
        var hard = G3.sandfx.land(R.hole, x, y, z);
        if (hard > 0.45) R.cam.kick = Math.max(R.cam.kick, (hard - 0.45) * 0.5);
    }
    /* The ball goes past the pin on its way in — nothing stops it, since the
       simulation has never heard of the pin — so the pin at least acknowledges
       it and rattles, which is what a real one does and what your ear is
       expecting when the cup sound plays. */
    // `quiet`: a pop only — the celebration is being kept for the ace replay (game.js celeOwed).
    function sinkAt(x, y, z, quiet) {
        // The equipped celebration, from the lip of the cup (the ball is at the bottom of it).
        var top = R.cupTop !== undefined && R.hole && Math.abs(R.hole.cup.x - x) < 1 && Math.abs(R.hole.cup.z - z) < 1
            ? R.cupTop : y;
        if (quiet || !celebrate(x, top, z)) burst(x, y + 0.1, z, 0xffe98a, 26, 2.2);
        R.pinShake = 1;
    }

    /* Whatever the ball was sitting on, sprayed backwards off the strike. */
    function divot(x, y, z, yaw, frac, kind) {
        // Out of a bunker the club takes the sand with it (sandfx, blast).
        if (kind === 'sand' && G3.sandfx && R.hole) { G3.sandfx.blast(R.hole, x, y, z, yaw, frac); return; }
        // Off turf, a plank or ice, the ground's own (groundfx); a putt off a green throws nothing.
        if (G3.groundfx && R.hole && !R.glow) {
            if (kind === 'green') return;
            if (G3.groundfx.strike(R.hole, x, y, z, yaw, frac, kind)) return;
        }
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

    // Whose ball it is (game.js, pass and play): tint or cosmetic style on the shared ball mesh.
    function setBallColour(hex) {
        R.ballTintHex = hex === undefined || hex === null ? 0xffffff : hex;
        if (R.ball && R.ballMats) applyBallStyleTo(R.ball, R.ballMats, R.ballStyleId || 'tour-white', R.ballTintHex);
    }

    function setBallStyle(id) {
        R.ballStyleId = id || 'tour-white';
        if (R.ball && R.ballMats) applyBallStyleTo(R.ball, R.ballMats, R.ballStyleId, R.ballTintHex);
    }

    /* Interactive 3D preview renderer for the Pro Shop modal — uses the exact
       same geodesic shaders on one lightweight WebGL context so every ball
       can be spun and inspected up close before buying.

       The Clubs and Bags shelves use it too (one context for the whole shop:
       a phone allows only a handful). Their subjects are the real models —
       bag.js → showClub / showBag, the same heads and the same bag the game
       draws — lit by the same studio room, which this context filters for
       itself (a PMREM from one context cannot be sampled by another). */
    function createBallPreview(canvas) {
        if (!canvas || typeof THREE === 'undefined') return null;
        var gl;
        try {
            gl = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
        } catch (e) {
            return null;
        }
        if (THREE.sRGBEncoding !== undefined) gl.outputEncoding = THREE.sRGBEncoding;
        gl.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        var w = canvas.clientWidth || canvas.width || 220;
        var h = canvas.clientHeight || canvas.height || 220;
        gl.setSize(w, h, false);

        var sc = new THREE.Scene();
        var cam = new THREE.PerspectiveCamera(34, w / Math.max(1, h), 0.1, 20);
        cam.position.set(0, 0.13, 0.78);
        cam.lookAt(0, -0.02, 0);

        var sun = new THREE.DirectionalLight(0xfff4de, 1.15);
        sun.position.set(1.6, 2.2, 1.9);
        sc.add(sun);
        var fill = new THREE.DirectionalLight(0x7ab4df, 0.36);
        fill.position.set(-1.5, 0.6, -1.2);
        sc.add(fill);
        var amb = new THREE.HemisphereLight(0xc2dcf2, 0x2c3624, 0.55);
        sc.add(amb);

        // Subtle dark turf coaster tucked directly beneath the ball so Crystal Glass
        // refracts real green underneath without cutting across its silhouette.
        var turfGeo = new THREE.CircleGeometry(C.BALL_R * 1.12, 40);
        turfGeo.rotateX(-Math.PI / 2);
        var turfMat = new THREE.MeshPhongMaterial({ color: 0x16381c, shininess: 4, specular: 0x0b1a0d });
        var plinth = new THREE.Mesh(turfGeo, turfMat);
        plinth.position.y = -C.BALL_R - 0.012;
        sc.add(plinth);

        var bundle = makeBallBundle();
        var ballMesh = new THREE.Mesh(new THREE.SphereGeometry(C.BALL_R, 56, 40), bundle.phong);
        sc.add(ballMesh);

        var sunDir = sun.position.clone().normalize();
        var th = (G3.THEMES && G3.THEMES.seaside) || null;
        syncBallUniforms(bundle, 0, sunDir, th, null, 20, 100);
        applyBallStyleTo(ballMesh, bundle, R.ballStyleId || 'tour-white', 0xffffff);

        /* ── the gear stage: a club or a bag on a round of turf ── */
        var gear = new THREE.Group();
        gear.visible = false;
        sc.add(gear);
        var spin = new THREE.Group();
        gear.add(spin);
        var mat = new THREE.Mesh(new THREE.CircleGeometry(1, 48), new THREE.MeshStandardMaterial({
            color: 0x1d3a1f, roughness: 0.95, metalness: 0
        }));
        mat.geometry.rotateX(-Math.PI / 2);
        mat.visible = false;     // the stage's own dark gradient reads better than a disc of turf
        gear.add(mat);
        var env = null;
        function gearEnv() {
            if (env !== null) return env;
            env = false;
            if (G3.bag && G3.bag.studioEnv && THREE.PMREMGenerator) {
                try {
                    var gen = new THREE.PMREMGenerator(gl);
                    env = gen.fromEquirectangular(G3.bag.studioEnv()).texture;
                    gen.dispose();
                } catch (e) { env = false; }
            }
            return env;
        }
        var clubs = {}, bagShow = null, subject = 'ball', clubId = 'iron', finish = null, skin = null;
        var fit = { r: 0.1, y: 0.05, k: 2.6 };
        function showSubject(kind) {
            subject = kind;
            ballMesh.visible = plinth.visible = kind === 'ball';
            gear.visible = kind !== 'ball';
        }
        function clubFor(id) {
            if (!clubs[id] && G3.bag && G3.bag.showClub) clubs[id] = G3.bag.showClub(id, finish, gearEnv() || null);
            return clubs[id];
        }
        function mount(obj) {
            while (spin.children.length) spin.remove(spin.children[0]);
            if (obj) spin.add(obj);
            spin.updateMatrixWorld(true);
            var box = new THREE.Box3().setFromObject(spin), sph = new THREE.Sphere();
            box.getBoundingSphere(sph);
            return { box: box, sph: sph };
        }
        function frameClub() {
            var c = clubFor(clubId);
            if (!c) return false;
            c.paint(finish);
            mount(c.group);
            /* Framed on the head and its face (the owner: "focus on the club
               face … ignore the shaft"): the shaft runs on out of the top of
               the frame. The head is centred on the axis it turns about, so
               turning never takes it out of shot. */
            var hs = new THREE.Sphere();
            c.head.getBoundingSphere(hs);
            fit = { r: hs.radius, y: hs.center.y, k: 3.5, pitch: 0.28, drop: 0.12 };
            mat.scale.setScalar(Math.max(0.09, (c.head.max.x - c.head.min.x) * 1.1));
            mat.position.y = -0.0005;
            return true;
        }
        function frameBag() {
            if (!bagShow && G3.bag && G3.bag.showBag) bagShow = G3.bag.showBag(skin, gearEnv() || null);
            if (!bagShow) return false;
            bagShow.paint(skin);
            var b = mount(bagShow.group);
            fit = { r: b.sph.radius, y: b.sph.center.y, k: 3.6, pitch: 0.2, drop: 0 };
            mat.scale.setScalar(0.24);
            mat.position.y = -0.0005;
            return true;
        }
        // The camera on the subject, at `k` of its bounding radius, tipped down by `pitch`.
        function aimGear(aspect) {
            var d = fit.r * fit.k / Math.max(0.75, Math.min(1, aspect));
            // `drop` looks a little below the middle, so the club stands clear of the picker under it.
            var ly = fit.y - (fit.drop || 0) * fit.r;
            cam.position.set(0, ly + Math.sin(fit.pitch) * d, Math.cos(fit.pitch) * d);
            cam.near = Math.max(0.005, d - fit.r * 3);
            cam.far = d + fit.r * 4;
            cam.lookAt(0, ly, 0);
        }
        function aimBall() {
            cam.position.set(0, 0.13, 0.78);
            cam.near = 0.1; cam.far = 20;
            cam.lookAt(0, -0.02, 0);
        }

        var clock = 0, rotY = 0.4, rotX = 0.15, gearY = 0.9, gearX = 0;
        // The shop's flat duck picture borrows this context at its own size (`ducks`); the next tick takes it back.
        var duckStage = null, sized = false;
        var api = {
            setStyle: function (id) {
                showSubject('ball');
                aimBall();
                cam.updateProjectionMatrix();
                applyBallStyleTo(ballMesh, bundle, id, 0xffffff);
            },
            /* A club finish (balls.js → CLUB_FINISHES) on one club of the set. */
            setClub: function (f, id) {
                finish = f || null;
                // A new subject starts with its face to the camera, three-quarters on.
                if (subject !== 'club' || (id && id !== clubId)) gearY = -1.05;
                if (id) clubId = id;
                if (!frameClub()) return false;
                showSubject('club');
                aimGear(cam.aspect);
                cam.updateProjectionMatrix();
                return true;
            },
            /* A bag skin (balls.js → BAG_SKINS). */
            setBag: function (k) {
                skin = k || null;
                if (!frameBag()) return false;
                showSubject('bag');
                aimGear(cam.aspect);
                cam.updateProjectionMatrix();
                return true;
            },
            get subject() { return subject; },
            get clubId() { return clubId; },
            rotate: function (dx, dy) {
                if (subject !== 'ball') {
                    gearY += dx;
                    gearX = Math.max(-0.5, Math.min(0.6, gearX + dy * 0.6));
                    return;
                }
                rotY += dx;
                rotX = Math.max(-1.1, Math.min(1.1, rotX + dy));
            },
            resize: function () {
                var cw = canvas.clientWidth || canvas.width || 220;
                var ch = canvas.clientHeight || canvas.height || 220;
                if (cw > 0 && ch > 0) {
                    gl.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
                    gl.setSize(cw, ch, false);
                    cam.aspect = cw / ch;
                    if (subject !== 'ball') aimGear(cam.aspect);
                    cam.updateProjectionMatrix();
                }
            },
            tick: function (dt, dragging) {
                clock += dt;
                if (sized) { sized = false; api.resize(); }
                if (subject !== 'ball') {
                    if (!dragging) gearY += dt * (subject === 'club' ? 0.35 : 0.5);
                    spin.rotation.set(0, gearY, 0);
                    gear.rotation.x = gearX;
                    if (subject === 'club' && clubs[clubId]) clubs[clubId].tick(dt);
                    gl.render(sc, cam);
                    return;
                }
                if (!dragging) rotY += dt * 0.65;
                ballMesh.rotation.set(rotX, rotY, 0);
                bundle.uniforms.uGbTime.value = clock;
                bundle.uniforms.time.value = clock;
                gl.render(sc, cam);
            },
            /* A still of one item for the shop's grid, drawn by these same
               shaders on this same context so a thumbnail is the thing you
               get rather than a 2D painting of it. Copied into `out` (a 2D
               canvas) before the browser composites, so the live preview never
               shows it. The caller puts the live preview back afterwards
               (setStyle / setClub / setBag, resize, tick). */
            snapshot: function (id, out, rot) {
                var ctx = out && out.getContext('2d');
                if (!ctx) return false;
                var n = out.width, m = out.height;
                var club = G3.CLUB_FINISHES && G3.CLUB_FINISHES.filter(function (f) { return f.id === id; })[0];
                var bag = !club && G3.BAG_SKINS && G3.BAG_SKINS.filter(function (f) { return f.id === id; })[0];
                gl.setPixelRatio(1);
                gl.setSize(n, m, false);
                var asp = cam.aspect;
                if (club || bag) {
                    var was = { subject: subject, finish: finish, skin: skin, clubId: clubId };
                    if (club) { finish = club; clubId = 'iron'; if (!frameClub()) return false; showSubject('club'); }
                    else { skin = bag; if (!frameBag()) return false; showSubject('bag'); }
                    cam.aspect = n / m;
                    var k0 = fit.k;
                    fit.k *= club ? 0.92 : 0.95;
                    aimGear(cam.aspect);
                    cam.updateProjectionMatrix();
                    spin.rotation.set(0, club ? -1.05 : 0.35, 0);
                    gear.rotation.x = 0;
                    if (club && clubs.iron) clubs.iron.tick(0.4);
                    gl.render(sc, cam);
                    fit.k = k0;
                    ctx.clearRect(0, 0, n, m);
                    ctx.drawImage(canvas, 0, 0, n, m);
                    finish = was.finish; skin = was.skin; clubId = was.clubId;
                    showSubject(was.subject);
                    cam.aspect = asp;
                    return true;
                }
                var pos = cam.position.clone(), fov = cam.fov, sub = subject;
                showSubject('ball');
                // Fit the sphere to 84% of the frame: half-angle off its radius.
                var dist = 0.6;
                cam.position.set(0, 0, dist);
                cam.near = 0.1; cam.far = 20;
                cam.fov = 2 * Math.atan(C.BALL_R / 0.84 / Math.sqrt(dist * dist - C.BALL_R * C.BALL_R)) * 180 / Math.PI;
                cam.aspect = 1;
                cam.lookAt(0, 0, 0);
                cam.updateProjectionMatrix();
                plinth.visible = false;
                applyBallStyleTo(ballMesh, bundle, id, 0xffffff);
                // Turned so the sight line runs across the face, tipped a little toward the camera.
                // A ball whose marking sits elsewhere (the eight, the finger
                // holes) names its own `pose` in balls.js.
                var def = G3.ballById ? G3.ballById(id) : null;
                var pose = rot || (def && def.pose) || [0.28, -1.7];
                ballMesh.rotation.set(pose[0], pose[1], 0);
                bundle.uniforms.uGbTime.value = 1.7;
                bundle.uniforms.time.value = 1.7;
                gl.render(sc, cam);
                ctx.clearRect(0, 0, n, n);
                ctx.drawImage(canvas, 0, 0, n, n);
                plinth.visible = true;
                cam.position.copy(pos);
                cam.fov = fov;
                cam.aspect = asp;
                cam.lookAt(0, -0.02, 0);
                cam.updateProjectionMatrix();
                showSubject(sub);
                return true;
            },
            /* The Easter egg's ducks for the shop's flat celebration picture
               (game.js → drawCeleFrame): the same 3D ducks the course drops,
               drawn through `view` — the flat picture's own oblique mapping
               from effect units to its pixels — into `out` over whatever is
               already there. False when there is nothing to draw with. */
            ducks: function (fx, out, view) {
                var ctx = out && out.getContext('2d');
                if (!ctx || !duckFlock) return false;
                if (!duckStage) {
                    duckStage = { scene: new THREE.Scene(), flock: duckFlock(CELE_DUCKS), cam: new THREE.OrthographicCamera(-1, 1, 1, -1, -1, 1) };
                    var ds = duckStage.scene;
                    ds.add(duckStage.flock.shade);
                    ds.add(duckStage.flock.mesh);
                    var key = new THREE.DirectionalLight(0xfff4de, 1.05);
                    key.position.set(0.6, 1.4, 1.2);
                    ds.add(key);
                    ds.add(new THREE.HemisphereLight(0xdfeaf6, 0x3a4a2a, 0.75));
                }
                poseFlock(duckStage.flock, fx.parts);
                if (!duckStage.flock.mesh.count) return true;
                var W = out.width, H = out.height, k = view.k;
                /* The flat picture's own mapping, as a projection: x across and
                   z leaning right, y up and z coming down the frame — so the 3D
                   ducks land exactly where its flags and rings are drawn. */
                var P = duckStage.cam.projectionMatrix;
                P.set(2 * k / W, 0, 0.36 * k / W, 2 * view.cx / W - 1,
                      0, 2 * k / H, -0.56 * k / H, 1 - 2 * view.gy / H,
                      0, -0.02, -0.07, 0,
                      0, 0, 0, 1);
                duckStage.cam.projectionMatrixInverse.copy(P).invert();
                gl.setPixelRatio(1);
                gl.setSize(W, H, false);
                sized = true;
                gl.setClearColor(0x000000, 0);
                gl.render(duckStage.scene, duckStage.cam);
                ctx.drawImage(canvas, 0, 0, W, H);
                return true;
            },
            dispose: function () {
                ballMesh.geometry.dispose();
                plinth.geometry.dispose();
                turfMat.dispose();
                bundle.phong.dispose();
                if (bundle.glass !== bundle.phong) bundle.glass.dispose();
                if (bundle.voidMat !== bundle.phong) bundle.voidMat.dispose();
                Object.keys(clubs).forEach(function (k) { clubs[k].dispose(); });
                if (bagShow) bagShow.dispose();
                gl.dispose();
            }
        };
        return api;
    }

    /* Where the top of the flag is on the screen, in the canvas's CSS
       pixels, for game.js's pin tag (the owner, on the forge's maps:
       "couldn't see where the hole was … show where the flag is by some
       means"). `ahead` is false when it is behind the camera; then x, y are
       the direction to it, mirrored, so an arrow at the edge still points
       the right way round. Null before a hole is built. */
    var _pinPt = null;
    function pinScreen() {
        if (!R.pin || !R.camera || !R.renderer) return null;
        if (!_pinPt) _pinPt = new THREE.Vector3();
        var el = R.renderer.domElement, w = el.clientWidth, h = el.clientHeight;
        _pinPt.set(0, 2.25, 0);
        R.pin.localToWorld(_pinPt);
        var dist = R.camera.position.distanceTo(_pinPt);
        _pinPt.project(R.camera);
        var ahead = _pinPt.z < 1;
        var nx = ahead ? _pinPt.x : -_pinPt.x, ny = ahead ? _pinPt.y : -_pinPt.y;
        return { x: (nx + 1) / 2 * w, y: (1 - ny) / 2 * h, w: w, h: h, ahead: ahead, dist: dist };
    }

    G3.render = {
        grassLift: grassLift,
        pinScreen: pinScreen,
        camSettled: camSettled,
        setBallColour: setBallColour,
        setBallStyle: setBallStyle,
        createBallPreview: createBallPreview,
        init: init,
        resize: resize,
        buildHole: buildHole,
        frame: frame,
        hitAt: hitAt,
        splashAt: splashAt,
        emberAt: emberAt,
        sandAt: sandAt,
        groundAt: groundAt,
        knockAt: knockAt,
        sinkAt: sinkAt,
        celebrate: celebrate,
        setCelebration: setCelebration,
        stopCelebration: stopCelebration,
        celebrating: celebrating,
        divot: divot,
        punch: punch,
        setCam: setCam,
        startDive: startDive,
        dropTo: dropTo,
        markDrop: markDrop,
        setWindup: setWindup,
        startLap: startLap,
        stopLap: stopLap,
        diving: diving,
        startFlyover: startFlyover,
        skipFlyover: skipFlyover,
        wipe: wipe,
        flying: flying,
        startReplay: startReplay,
        cutReplay: cutReplay,
        stopReplay: stopReplay,
        replayDrop: replayDrop,
        replaying: replaying,
        cycleView: cycleView,
        viewLabel: viewLabel,
        enterFlight: enterFlight,
        exitFlight: exitFlight,
        setLock: setLock,
        fitPitch: fitPitch,
        setWaterQuality: setWaterQuality,
        setQuality: setQuality,
        get quality() { return R.quality; },
        // Auto's rung, 0 = sharpest (CONFIG.QUALITY_AUTO); null under a named preset.
        get autoStep() { return R.quality === 'auto' && R.autoStep !== undefined ? R.autoStep : null; },
        setAutoStep: setAutoStep,
        govFeed: govFeed,
        govRelease: govRelease,
        setLive: setLive,
        get liveWanted() { return liveWanted(); },
        get live() { return !!R.live; },
        get prettyWater() { return R.prettyWater; },
        cam: R.cam,
        // The bag picks against these, and nothing else needs them.
        pickAt: function (nx, ny) {
            return G3.bag ? G3.bag.pick(nx, ny, R.camera, R.scene) : null;
        },
        state: R,
        overFog: overFog,
        THEMES: G3.THEMES,
        // What the HUD needs to name the sky it is standing under.
        get weather() { return R.weather; }
    };

})(window.G3);
