/* Scene 6 — the Mandelbulb.
 *
 * The Mandelbrot set's idea in three dimensions: take a point, square it and
 * add itself, over and over, and keep the points that never run away. There is
 * no mesh — nothing here was modelled. Every pixel walks a ray outward and
 * asks a formula how far it can safely step, which is the whole trick behind
 * rendering a surface nobody ever built.
 *
 * Cost lives in the same place as the nebula's, so it borrows the same
 * measured quality ladder from the shell. It is stricter about it, though: the
 * distance estimator costs an acos, an atan and two pows per iteration, and
 * the compiler unrolls the march around it. Both loop bounds here are held
 * deliberately low — the uniforms can shorten a march at runtime but nothing
 * can shorten a program that took a minute to build.
 */
(function () {
    'use strict';

    var THREE = window.THREE;

    var scene, camera, rayCam, orbit, mat, quad, ladder, ctxRef;
    var basis = new THREE.Matrix3();
    var breathe = true, heldPower = 8;

    var FRAG = [
        'precision highp float;',
        'uniform vec2 uRes;',
        'uniform vec3 uRo;',
        'uniform mat3 uBasis;',
        'uniform float uTanHalfFov;',
        'uniform float uTime;',
        'uniform float uSteps;',
        'uniform float uIter;',
        'uniform float uPower;',
        'uniform float uRim;',
        'uniform float uHue;',
        'varying vec2 vUv;',

        /* Distance to the surface, and how close the orbit came to the origin
         * on the way — the "orbit trap", which is what the colour is keyed to.
         * It is a property of the maths at that point, not a texture: the
         * banding you see is the shape of the iteration itself. */
        'float de(vec3 p, out float trap) {',
        '  vec3 z = p;',
        '  float dr = 1.0, r = 0.0;',
        '  trap = 1e9;',
        '  for (int i = 0; i < 6; i++) {',
        '    if (float(i) >= uIter) break;',
        '    r = length(z);',
        '    if (r > 2.0) break;',
        '    trap = min(trap, r);',
        '    float th = acos(clamp(z.z / r, -1.0, 1.0));',
        '    float ph = atan(z.y, z.x);',
        '    dr = pow(r, uPower - 1.0) * uPower * dr + 1.0;',
        '    float zr = pow(r, uPower);',
        '    th *= uPower; ph *= uPower;',
        '    z = zr * vec3(sin(th) * cos(ph), sin(th) * sin(ph), cos(th)) + p;',
        '  }',
        '  return 0.5 * log(max(r, 1e-6)) * r / dr;',
        '}',

        /* Four samples on a tetrahedron rather than six along the axes. Same
         * gradient, two fewer distance estimates, and each one of those is the
         * most expensive function in the shader. */
        'vec3 normalAt(vec3 p) {',
        '  const vec2 k = vec2(1.0, -1.0);',
        '  const float h = 0.0012;',
        '  float t;',
        '  return normalize(k.xyy * de(p + k.xyy * h, t) +',
        '                   k.yyx * de(p + k.yyx * h, t) +',
        '                   k.yxy * de(p + k.yxy * h, t) +',
        '                   k.xxx * de(p + k.xxx * h, t));',
        '}',

        /* Deliberately not a rainbow. Three stops of the same family the rest
         * of the set uses, so this reads as another room in the same building
         * rather than a screensaver that wandered in. */
        'vec3 pal(float x) {',
        '  x = clamp(x, 0.0, 1.0);',
        '  vec3 a = vec3(0.07, 0.19, 0.55);',
        '  vec3 b = vec3(0.72, 0.21, 0.60);',
        '  vec3 c = vec3(1.00, 0.79, 0.47);',
        '  return x < 0.5 ? mix(a, b, x * 2.0) : mix(b, c, (x - 0.5) * 2.0);',
        '}',

        'void main() {',
        '  vec2 uv = (vUv - 0.5) * 2.0;',
        '  uv.x *= uRes.x / uRes.y;',
        /* Camera basis comes in as a matrix from a real three.js camera the
         * orbit controller drives, so dragging behaves exactly as it does in
         * the scenes that have actual geometry. */
        '  vec3 rd = normalize(uBasis * vec3(uv * uTanHalfFov, -1.0));',

        '  float t = 0.0, used = 0.0, trap = 1e9;',
        '  bool hit = false;',
        '  vec3 p = uRo;',

        '  for (int i = 0; i < 64; i++) {',
        '    if (float(i) >= uSteps) break;',
        '    p = uRo + rd * t;',
        '    float tr;',
        '    float d = de(p, tr);',
        /* Tolerance grows with distance: one pixel covers more of the surface
         * further out, so demanding the same absolute precision there only
         * buys steps nobody can see. */
        '    if (d < 0.0007 * t + 0.0002) { hit = true; trap = tr; break; }',
        '    t += d;',
        '    used += 1.0;',
        '    if (t > 7.0) break;',
        '  }',

        '  vec3 col;',
        '  if (hit) {',
        '    vec3 n = normalAt(p);',
        '    vec3 l = normalize(vec3(0.55, 0.75, 0.38));',
        '    float dif = clamp(dot(n, l), 0.0, 1.0);',
        '    float back = clamp(dot(n, -l), 0.0, 1.0) * 0.25;',
        /* Ambient occlusion for free: a ray that needed many small steps to
         * arrive was squeezing through a crevice, and crevices are dark. */
        '    float ao = clamp(1.0 - used / max(uSteps, 1.0) * 1.5, 0.15, 1.0);',
        '    float fres = pow(1.0 - clamp(dot(n, -rd), 0.0, 1.0), 3.5);',
        /* The trap values that land on this surface cluster near the
                    * top of their range, so any shift-and-stretch of them
                    * clamps flat and the whole bulb comes out one shade of
                    * gold. A saturating curve cannot clamp — it maps the
                    * whole positive range into 0..1 without a cliff — and
                    * folding in the surface normal guarantees the palette is
                    * actually traversed rather than sampled at one point. */
        '    float cx = trap / (trap + 0.75);',
        '    cx = mix(cx, 0.5 + 0.5 * n.y, 0.35);',
        '    vec3 base = pal(fract(clamp(cx, 0.0, 1.0) + uHue));',
        '    col = base * (0.22 + 1.05 * dif + back) * ao;',
        '    col += vec3(0.35, 0.55, 1.00) * fres * uRim;',
        '  } else {',
        '    float g = 1.0 - length(uv) * 0.32;',
        '    col = vec3(0.016, 0.026, 0.055) * clamp(g, 0.0, 1.0);',
        '  }',

        '  col = col / (1.0 + col);',
        '  col = pow(col, vec3(0.88));',
        '  gl_FragColor = vec4(col, 1.0);',
        '}'
    ].join('\n');

    VizApp.register({
        id: 'mandelbulb',
        label: 'Mandelbulb',
        title: 'A surface nobody built',
        blurb: 'The Mandelbrot set in three dimensions. There is no mesh here — ' +
               'every pixel walks outward asking a formula how far it can ' +
               'safely step, and the colour is the shape of the maths itself.',
        hint: 'Drag to orbit · scroll to close in · the power breathes between 7 and 9',
        accent: '#c084fc',

        controls: function () {
            return [
                { id: 'breathe', type: 'toggle', label: 'Breathe the power',
                  value: true,
                  apply: function (v) { breathe = v; } },
                { id: 'power', type: 'slider', label: 'Power', min: 2, max: 14, step: 0.1,
                  value: 8,
                  format: function (v) { return v.toFixed(1); },
                  apply: function (v) { heldPower = v; breathe = false; VizApp.setControl('breathe', false); } },
                { id: 'spin', type: 'slider', label: 'Spin', min: 0, max: 0.35, step: 0.01,
                  value: 0.07,
                  format: function (v) { return v === 0 ? 'still' : v.toFixed(2); },
                  apply: function (v) { if (orbit) orbit.spin = v; } },
                { id: 'shade', type: 'slider', label: 'Rim light', min: 0, max: 2, step: 0.05,
                  value: 0.55,
                  format: function (v) { return v.toFixed(2); },
                  apply: function (v) { mat.uniforms.uRim.value = v; } },
                { id: 'hue', type: 'slider', label: 'Colour shift', min: 0, max: 1, step: 0.02,
                  value: 0,
                  format: function (v) { return v.toFixed(2); },
                  apply: function (v) { mat.uniforms.uHue.value = v; } }
            ];
        },

        init: function (ctx) {
            ctxRef = ctx;
            scene = new THREE.Scene();
            camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

            /* A real perspective camera, used only for its maths: the orbit
             * controller moves it, and its position and basis are handed to
             * the shader. Nothing is ever rendered through it. */
            rayCam = new THREE.PerspectiveCamera(42, ctx.width / ctx.height, 0.01, 20);

            mat = new THREE.ShaderMaterial({
                uniforms: {
                    uRes: { value: new THREE.Vector2(ctx.width, ctx.height) },
                    uRo: { value: new THREE.Vector3() },
                    uBasis: { value: new THREE.Matrix3() },
                    uTanHalfFov: { value: Math.tan(42 * Math.PI / 360) },
                    uTime: { value: 0 },
                    uSteps: { value: 64 },
                    uIter: { value: 6 },
                    uPower: { value: 8 },
                    uRim: { value: 0.55 },
                    uHue: { value: 0 }
                },
                vertexShader: [
                    'varying vec2 vUv;',
                    'void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }'
                ].join('\n'),
                fragmentShader: FRAG,
                depthTest: false,
                depthWrite: false
            });

            quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat);
            quad.frustumCulled = false;
            scene.add(quad);

            orbit = VizApp.makeOrbit(rayCam, ctx.canvas, {
                radius: 2.7, minRadius: 1.15, maxRadius: 6.0,
                theta: 0.6, phi: 72 * Math.PI / 180,
                spin: ctx.reducedMotion ? 0 : 0.07
            });

            /* Iteration count comes down with resolution. Fewer iterations is
             * a rounder, softer bulb rather than a broken one, which is the
             * right thing to lose first. */
            ladder = VizApp.makeQualityLadder(ctx.renderer, [
                { scale: 0.55, steps: 34, iter: 4 },
                { scale: 0.75, steps: 44, iter: 5 },
                { scale: 1.00, steps: 56, iter: 6 },
                { scale: 1.25, steps: 64, iter: 6 }
            ], function (rung) {
                mat.uniforms.uSteps.value = rung.steps;
                mat.uniforms.uIter.value = rung.iter;
            });

            breathe = true;
            heldPower = 8;
            this.resize(ctx.width, ctx.height);
            VizApp.readout.show('Mandelbulb', [
                ['Power', '8'],
                ['Triangles', '0'],
                ['Distance estimator', 'per pixel'],
                ['Colour from', 'orbit trap']
            ]);
            return { scene: scene, camera: camera };
        },

        update: function (dt, t) {
            ladder.tick();
            orbit.update(dt);

            /* Breathing the exponent is the one animation here. The shape is
             * continuous in it, so the bulb grows and folds petals rather than
             * cutting between two models. */
            var power = breathe
                ? (ctxRef.reducedMotion ? 8 : 8 + Math.sin(t * 0.13) * 1.15)
                : heldPower;
            mat.uniforms.uPower.value = power;
            mat.uniforms.uTime.value = t;

            rayCam.updateMatrixWorld();
            mat.uniforms.uRo.value.copy(rayCam.position);
            basis.setFromMatrix4(rayCam.matrixWorld);
            mat.uniforms.uBasis.value.copy(basis);
        },

        resize: function (w, h) {
            mat.uniforms.uRes.value.set(w, h);
            rayCam.aspect = w / h;
            rayCam.updateProjectionMatrix();
            if (orbit) {
                var need = VizApp.fitDistance(rayCam, 1.35);
                if (orbit.tRadius < need) { orbit.tRadius = need; orbit.radius = need; }
            }
        },

        dispose: function () {
            if (orbit) orbit.dispose();
            if (ladder) ladder.dispose();
            VizApp.readout.hide();
            orbit = null; ladder = null; mat = null; quad = null; ctxRef = null;
        }
    });
})();
