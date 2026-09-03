/* Scene 7 — strange attractors.
 *
 * Forty thousand points, each one obeying the same three equations, each one
 * started somewhere slightly different. Nothing draws the shape; the shape is
 * where those equations send everything that starts near them. Two points a
 * hair apart end up on opposite sides of it, which is the whole reason these
 * are called strange.
 *
 * Four systems, switchable live. They differ only in three lines of
 * arithmetic and they look nothing like each other.
 */
(function () {
    'use strict';

    var THREE = window.THREE;

    /* Each system: the derivative, a step size that keeps it stable, a scale
     * that brings it into frame, and where to scatter the seeds. The step
     * sizes are not interchangeable — Lorenz at Thomas's step is a smear. */
    var SYSTEMS = {
        lorenz: {
            label: 'Lorenz', dt: 0.0055, scale: 0.075, seed: 12, lift: -25,
            step: function (p, o) {
                var s = 10, r = 28, b = 8 / 3;
                o[0] = s * (p[1] - p[0]);
                o[1] = p[0] * (r - p[2]) - p[1];
                o[2] = p[0] * p[1] - b * p[2];
            }
        },
        aizawa: {
            label: 'Aizawa', dt: 0.006, scale: 1.55, seed: 0.6, lift: -0.55,
            step: function (p, o) {
                var a = 0.95, b = 0.7, c = 0.6, d = 3.5, e = 0.25, f = 0.1;
                o[0] = (p[2] - b) * p[0] - d * p[1];
                o[1] = d * p[0] + (p[2] - b) * p[1];
                o[2] = c + a * p[2] - p[2] * p[2] * p[2] / 3
                       - (p[0] * p[0] + p[1] * p[1]) * (1 + e * p[2])
                       + f * p[2] * p[0] * p[0] * p[0];
            }
        },
        thomas: {
            label: 'Thomas', dt: 0.022, scale: 0.60, seed: 1.4, lift: 0,
            step: function (p, o) {
                var b = 0.208186;
                o[0] = Math.sin(p[1]) - b * p[0];
                o[1] = Math.sin(p[2]) - b * p[1];
                o[2] = Math.sin(p[0]) - b * p[2];
            }
        },
        halvorsen: {
            label: 'Halvorsen', dt: 0.0035, scale: 0.20, seed: 3, lift: 4,
            step: function (p, o) {
                var a = 1.89;
                o[0] = -a * p[0] - 4 * p[1] - 4 * p[2] - p[1] * p[1];
                o[1] = -a * p[1] - 4 * p[2] - 4 * p[0] - p[2] * p[2];
                o[2] = -a * p[2] - 4 * p[0] - 4 * p[1] - p[0] * p[0];
            }
        }
    };

    var scene, camera, orbit, points, geo, mat, renderer;
    var N = 0, state = null, sysId = 'lorenz';
    var speed = 1;
    var _p = [0, 0, 0], _d = [0, 0, 0];

    function sys() { return SYSTEMS[sysId]; }

    function seed() {
        var s = sys();
        for (var i = 0; i < N; i++) {
            /* Seeds are scattered in a small ball, not spread over the whole
             * frame: the point of the scene is watching an arbitrary blob get
             * pulled onto the shape, and that only reads if it starts as a
             * blob. */
            state[i * 3]     = (Math.random() - 0.5) * s.seed;
            state[i * 3 + 1] = (Math.random() - 0.5) * s.seed;
            state[i * 3 + 2] = (Math.random() - 0.5) * s.seed - (s.lift < 0 ? s.lift : 0);
        }
    }

    /* Run the system forward before the first frame is drawn. Seeds start in a
     * ball that is nowhere near the attractor, and at sixty frames a second it
     * takes several seconds of watching a shapeless cloud before the shape
     * appears. Nobody should have to wait for the point of the scene. Some
     * convergence is left visible on purpose — and pressing "scatter them
     * again" shows the whole of it. */
    function warm(steps) {
        var s = sys(), h = s.dt;
        for (var i = 0; i < N; i++) {
            var x = state[i * 3], y = state[i * 3 + 1], z = state[i * 3 + 2];
            for (var k = 0; k < steps; k++) {
                _p[0] = x; _p[1] = y; _p[2] = z;
                s.step(_p, _d);
                x += _d[0] * h; y += _d[1] * h; z += _d[2] * h;
                if (!isFinite(x) || Math.abs(x) > 1e4) { x = y = z = 0.1; }
            }
            state[i * 3] = x; state[i * 3 + 1] = y; state[i * 3 + 2] = z;
        }
    }

    function build(ctx) {
        N = Math.min(window.innerWidth, window.innerHeight) < 620 ? 18000 : 40000;
        state = new Float32Array(N * 3);
        seed();
        warm(420);

        var pos = new Float32Array(N * 3);
        var col = new Float32Array(N * 3);
        var c = new THREE.Color();
        for (var i = 0; i < N; i++) {
            /* Colour is fixed per point at birth, on one hue. It is not
             * encoding anything — it is there so neighbouring points stay
             * distinguishable as the flow shears them apart, which is the
             * behaviour the scene exists to show. */
            c.setHSL(0.51 + Math.random() * 0.14, 0.88, 0.55 + Math.random() * 0.22);
            col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
        }

        geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
        geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 40);

        mat = new THREE.ShaderMaterial({
            uniforms: { uScale: { value: 1 }, uSize: { value: 2.2 } },
            vertexShader: [
                'uniform float uScale; uniform float uSize;',
                'varying vec3 vColor;',
                'void main() {',
                '  vColor = color;',
                '  vec4 mv = modelViewMatrix * vec4(position, 1.0);',
                '  gl_PointSize = uSize * uScale / -mv.z;',
                '  gl_Position = projectionMatrix * mv;',
                '}'
            ].join('\n'),
            fragmentShader: [
                'varying vec3 vColor;',
                'void main() {',
                '  float d = length(gl_PointCoord - vec2(0.5));',
                '  if (d > 0.5) discard;',
                '  gl_FragColor = vec4(vColor, smoothstep(0.5, 0.0, d) * 0.9);',
                '}'
            ].join('\n'),
            vertexColors: true,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            depthTest: false
        });

        points = new THREE.Points(geo, mat);
        return points;
    }

    function advance(dt) {
        var s = sys();
        var out = geo.attributes.position.array;
        /* Several small steps rather than one big one, and a fixed step size
         * rather than the frame's: these systems go unstable the moment the
         * step is too large, and "unstable" here means every point flies to
         * infinity in about a second. */
        var sub = Math.max(1, Math.min(10, Math.round(dt * 60 * 2 * speed)));
        var h = s.dt;

        for (var i = 0; i < N; i++) {
            var x = state[i * 3], y = state[i * 3 + 1], z = state[i * 3 + 2];
            for (var k = 0; k < sub; k++) {
                _p[0] = x; _p[1] = y; _p[2] = z;
                s.step(_p, _d);
                x += _d[0] * h;
                y += _d[1] * h;
                z += _d[2] * h;
            }
            /* A point that escaped — a bad seed, or a step that landed badly —
             * is reborn rather than left to drag a NaN through the buffer. */
            if (!isFinite(x) || !isFinite(y) || !isFinite(z) ||
                Math.abs(x) > 1e4 || Math.abs(y) > 1e4 || Math.abs(z) > 1e4) {
                x = (Math.random() - 0.5) * s.seed;
                y = (Math.random() - 0.5) * s.seed;
                z = (Math.random() - 0.5) * s.seed - (s.lift < 0 ? s.lift : 0);
            }
            state[i * 3] = x; state[i * 3 + 1] = y; state[i * 3 + 2] = z;

            out[i * 3]     = x * s.scale;
            out[i * 3 + 1] = (z + s.lift) * s.scale;   /* z is "up" in these systems */
            out[i * 3 + 2] = y * s.scale;
        }
        geo.attributes.position.needsUpdate = true;
    }

    VizApp.register({
        id: 'attractor',
        label: 'Attractors',
        title: 'Where everything ends up',
        blurb: 'Forty thousand points, all obeying the same three equations, ' +
               'all started somewhere slightly different. Nothing draws the ' +
               'shape — the shape is wherever those equations send them.',
        hint: 'Drag to orbit · switch systems in the controls',
        accent: '#22d3ee',

        controls: function () {
            return [
                { id: 'sys', type: 'choice', label: 'System',
                  value: sysId,
                  options: Object.keys(SYSTEMS).map(function (k) { return [k, SYSTEMS[k].label]; }),
                  apply: function (v) { sysId = v; seed(); warm(420); reframe(); } },
                { id: 'speed', type: 'slider', label: 'Flow speed', min: 0, max: 3, step: 0.05,
                  value: 1,
                  format: function (v) { return v === 0 ? 'paused' : v.toFixed(2) + '×'; },
                  apply: function (v) { speed = v; } },
                { id: 'size', type: 'slider', label: 'Point size', min: 0.6, max: 5, step: 0.1,
                  value: 2.2,
                  format: function (v) { return v.toFixed(1) + 'px'; },
                  apply: function (v) { mat.uniforms.uSize.value = v; } },
                { id: 'spin', type: 'slider', label: 'Spin', min: 0, max: 0.35, step: 0.01,
                  value: 0.08,
                  format: function (v) { return v === 0 ? 'still' : v.toFixed(2); },
                  apply: function (v) { if (orbit) orbit.spin = v; } },
                { id: 'reseed', type: 'action', label: 'Scatter them again',
                  apply: function () { seed(); } }
            ];
        },

        init: function (ctx) {
            renderer = ctx.renderer;
            scene = new THREE.Scene();
            camera = new THREE.PerspectiveCamera(45, ctx.width / ctx.height, 0.1, 200);
            scene.add(build(ctx));

            orbit = VizApp.makeOrbit(camera, ctx.canvas, {
                radius: 7.5, minRadius: 2.2, maxRadius: 26,
                theta: 0.5, phi: 78 * Math.PI / 180,
                spin: ctx.reducedMotion ? 0 : 0.08
            });

            speed = 1;
            this.resize(ctx.width, ctx.height);
            return { scene: scene, camera: camera };
        },

        update: function (dt) {
            orbit.update(dt);
            if (speed > 0) advance(Math.min(dt, 1 / 30));
        },

        resize: function (w, h) {
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
            if (orbit) {
                var need = VizApp.fitDistance(camera, 2.6);
                if (orbit.tRadius < need) { orbit.tRadius = need; orbit.radius = need; }
            }
            var dpr = renderer ? renderer.getPixelRatio() : 1;
            mat.uniforms.uScale.value =
                h / (2 * Math.tan(camera.fov * Math.PI / 360)) * 0.0038 * dpr;
        },

        dispose: function () {
            if (orbit) orbit.dispose();
            VizApp.readout.hide();
            state = null; points = null; geo = null; mat = null; renderer = null;
        }
    });

    /* Each system fills a different amount of space, so switching one in
     * without re-framing leaves it either lost in the distance or clipped. */
    function reframe() {
        if (!orbit) return;
        var want = { lorenz: 7.5, aizawa: 6.5, thomas: 7.0, halvorsen: 8.5 }[sysId] || 7.5;
        orbit.tRadius = Math.max(want, VizApp.fitDistance(camera, 2.6));
    }
})();
