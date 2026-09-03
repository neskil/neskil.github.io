/* Scene 4 — the nebula.
 *
 * No geometry at all: one quad covering the screen and a fragment shader that
 * marches a ray through a cloud of noise for every pixel. Everything you see —
 * the volume, the lighting, the stars behind it — is arithmetic run per pixel
 * per frame.
 *
 * Which is also why this is the one scene that lowers the render resolution.
 * A volumetric march is the only thing here whose cost scales with the number
 * of pixels rather than the number of things, so on a retina display it is
 * doing four times the work for a difference nobody can see in a cloud with no
 * hard edges.
 */
(function () {
    'use strict';

    var THREE = window.THREE;

    var scene, camera, quad, mat, canvasEl, ctxRef;
    var mouse = { x: 0, y: 0, tx: 0, ty: 0 };
    var depth = 0, depthTarget = 0;
    var timeGain = 1, nebTime = 0;

    var ladder = null;

    var FRAG = [
        'precision highp float;',
        'uniform vec2 uRes;',
        'uniform float uTime;',
        'uniform vec2 uMouse;',
        'uniform float uDepth;',
        'uniform float uSteps;',
        'uniform float uDensity;',
        'uniform float uWarp;',
        'uniform float uGlow;',
        'uniform float uParallax;',
        'varying vec2 vUv;',

        'float hash13(vec3 p) {',
        '  p = fract(p * 0.3183099 + vec3(0.1, 0.2, 0.3));',
        '  p *= 17.0;',
        '  return fract(p.x * p.y * p.z * (p.x + p.y + p.z));',
        '}',

        /* Value noise rather than gradient noise: one hash per corner instead
         * of a dot product per corner, and inside four octaves of a 56-step
         * march that difference is the whole frame budget. Nobody can tell
         * which one a cloud was made of. */
        'float vnoise(vec3 p) {',
        '  vec3 i = floor(p), f = fract(p);',
        '  f = f * f * (3.0 - 2.0 * f);',
        '  return mix(mix(mix(hash13(i + vec3(0.0, 0.0, 0.0)), hash13(i + vec3(1.0, 0.0, 0.0)), f.x),',
        '                 mix(hash13(i + vec3(0.0, 1.0, 0.0)), hash13(i + vec3(1.0, 1.0, 0.0)), f.x), f.y),',
        '             mix(mix(hash13(i + vec3(0.0, 0.0, 1.0)), hash13(i + vec3(1.0, 0.0, 1.0)), f.x),',
        '                 mix(hash13(i + vec3(0.0, 1.0, 1.0)), hash13(i + vec3(1.0, 1.0, 1.0)), f.x), f.y), f.z);',
        '}',

        'float fbm(vec3 p) {',
        '  float a = 0.5, s = 0.0;',
        '  for (int i = 0; i < 4; i++) {',
        '    s += a * vnoise(p);',
        '    p = p * 2.03 + vec3(1.7, 9.2, 3.4);',   /* offset each octave or they align */
        '    a *= 0.5;',
        '  }',
        '  return s;',
        '}',

        'float density(vec3 p) {',
        '  vec3 q = p + vec3(0.0, uTime * 0.035, uTime * 0.02);',
        /* Domain warp: bend the space the noise is sampled in before sampling
         * it. Far more shape per instruction than another octave buys — the
         * difference between cotton wool and something with curl in it.
         *
         * Two lookups, not three. The march below is unrolled by the shader
         * compiler, so every noise call in here is paid for forty-eight times
         * over in the compiled program; three warp axes plus two full fbm
         * chains pushed it past what a software rasteriser would compile at
         * all, and a shader that takes half a minute to build is a blank page
         * on a slow machine. The z axis goes unwarped — the ray runs along it
         * and the displacement barely shows. */
        '  vec2 w = vec2(vnoise(q * 1.7), vnoise(q * 1.7 + 7.3)) - 0.5;',
        '  q.xy += w * uWarp;',
        '  float d = fbm(q * 2.1);',
        /* Subtract a higher frequency rather than adding one: it eats holes in
         * the cloud, and the holes are what read as filaments. Adding detail
         * to a soft blob just gives a slightly bumpy soft blob. */
        '  d -= 0.20 * vnoise(q * 6.5);',
        /* Without a falloff the noise fills the frame edge to edge and reads
         * as fog. The shell is what makes it a cloud with somewhere to be. */
        '  float shell = 1.0 - smoothstep(0.30, 1.45, length(p * vec3(0.78, 1.0, 0.78)));',
        '  return max(0.0, (d - 0.36) * shell * 3.6 * uDensity);',
        '}',

        'vec3 stars(vec3 rd) {',
        '  vec3 g = rd * 260.0;',
        '  vec3 id = floor(g);',
        '  vec3 f = fract(g) - 0.5;',
        '  float h = hash13(id);',
        '  float pick = smoothstep(0.9955, 1.0, h);',
        /* Fall off from the middle of the cell, or every star is the square
         * cell it was drawn in. */
        '  float dot_ = smoothstep(0.36, 0.0, length(f));',
        '  float tw = 0.55 + 0.45 * sin(uTime * 2.0 + h * 90.0);',
        '  return vec3(0.74, 0.80, 0.97) * pick * dot_ * tw * 1.6;',
        '}',

        'void main() {',
        '  vec2 uv = (vUv - 0.5) * 2.0;',
        '  uv.x *= uRes.x / uRes.y;',

        '  vec3 ro = vec3(0.0, 0.0, -3.4 + uDepth);',
        '  vec3 rd = normalize(vec3(uv, 1.7));',

        /* Parallax: swing the ray, do not move the cloud. Rotating the camera
         * gives real depth cues between the near and far side of the volume;
         * translating the noise just slides a texture. */
        '  float ax = uMouse.x * 0.30 * uParallax, ay = uMouse.y * 0.22 * uParallax;',
        '  float ca = cos(ax), sa = sin(ax);',
        '  rd.xz = mat2(ca, -sa, sa, ca) * rd.xz;',
        '  ro.xz = mat2(ca, -sa, sa, ca) * ro.xz;',
        '  float cb = cos(ay), sb = sin(ay);',
        '  rd.yz = mat2(cb, -sb, sb, cb) * rd.yz;',
        '  ro.yz = mat2(cb, -sb, sb, cb) * ro.yz;',

        '  vec3 col = vec3(0.0);',
        '  float trans = 1.0;',
        /* Start where the cloud starts and step far enough to come out the
         * other side. Fifty-six short steps from too close covered only the
         * near half of the volume, which reads as a hole in the middle. */
        '  float t = 1.9;',
        '  const float STEP = 0.088;',

        /* GLSL ES 1.0 wants a constant loop bound, so the count is fixed and
         * the real budget is a uniform we break on. That way the quality
         * ladder below can shorten the march on a slow machine without
         * recompiling the shader mid-scene. */
        '  for (int i = 0; i < 48; i++) {',
        '    if (float(i) >= uSteps) break;',
        '    vec3 p = ro + rd * t;',
        '    float dens = density(p);',
        '    if (dens > 0.002) {',
        /* Colour by how thick the gas is, not by where it sits. Keyed to
         * radius the whole cloud came out one shade of magenta, because
         * almost all of the density lives at the same distance from the
         * middle; keyed to density the thin edges go blue and only the
         * knots burn. */
        '      float heat = smoothstep(0.05, 0.55, dens);',
        '      vec3 emit = mix(vec3(0.09, 0.32, 0.92), vec3(0.96, 0.20, 0.58), heat);',
        '      emit = mix(emit, vec3(1.00, 0.80, 0.52), pow(heat, 3.2) * 0.45);',
        '      col += emit * dens * trans * STEP * uGlow;',
        '      trans *= exp(-dens * STEP * 2.6);',
        '      if (trans < 0.02) break;',
        '    }',
        '    t += STEP;',
        '  }',

        '  col += stars(rd) * trans;',
        '  col += vec3(0.014, 0.024, 0.055) * trans;',       /* deep-space floor */

        /* Tone-map, or the core clips to a flat white disc. */
        '  col = col / (1.0 + col);',
        '  col = pow(col, vec3(0.85));',
        '  gl_FragColor = vec4(col, 1.0);',
        '}'
    ].join('\n');

    function onWheel(e) {
        e.preventDefault();
        depthTarget = VizApp.clamp(depthTarget + e.deltaY * 0.0016, -1.2, 1.6);
    }

    VizApp.register({
        id: 'nebula',
        label: 'Nebula',
        title: 'Nothing but arithmetic',
        blurb: 'No geometry, no textures, no models — one quad and a shader ' +
               'that walks a ray through four octaves of noise for every ' +
               'pixel, forty-eight steps at a time.',
        hint: 'Move the pointer to look around · scroll to move through it',
        accent: '#f472b6',

        controls: function () {
            return [
                { id: 'drift', type: 'slider', label: 'Drift', min: 0, max: 3, step: 0.05,
                  value: 1,
                  format: function (v) { return v === 0 ? 'frozen' : v.toFixed(2) + '\u00d7'; },
                  apply: function (v) { timeGain = v; } },
                { id: 'dens', type: 'slider', label: 'Density', min: 0.55, max: 1.6, step: 0.02,
                  value: 1,
                  format: function (v) { return v.toFixed(2) + '\u00d7'; },
                  apply: function (v) { mat.uniforms.uDensity.value = v; } },
                { id: 'warp', type: 'slider', label: 'Curl', min: 0, max: 1.4, step: 0.02,
                  value: 0.62,
                  format: function (v) { return v.toFixed(2); },
                  apply: function (v) { mat.uniforms.uWarp.value = v; } },
                { id: 'glow', type: 'slider', label: 'Brightness', min: 2, max: 9, step: 0.2,
                  value: 5.2,
                  format: function (v) { return v.toFixed(1); },
                  apply: function (v) { mat.uniforms.uGlow.value = v; } },
                { id: 'parallax', type: 'slider', label: 'Parallax', min: 0, max: 2, step: 0.05,
                  value: 1,
                  format: function (v) { return v === 0 ? 'locked' : v.toFixed(2) + '\u00d7'; },
                  apply: function (v) { mat.uniforms.uParallax.value = v; } },
                { id: 'recentre', type: 'action', label: 'Back to the middle',
                  apply: function () { depthTarget = 0; } }
            ];
        },

        init: function (ctx) {
            ctxRef = ctx;
            scene = new THREE.Scene();
            /* A fixed [-1,1] box and a quad that fills it: the shader works in
             * screen space, so the camera has nothing to do but not get in
             * the way. */
            camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

            mat = new THREE.ShaderMaterial({
                uniforms: {
                    uRes: { value: new THREE.Vector2(ctx.width, ctx.height) },
                    uTime: { value: 0 },
                    uMouse: { value: new THREE.Vector2(0, 0) },
                    uDepth: { value: 0 },
                    uSteps: { value: 48 },
                    uDensity: { value: 1 },
                    uWarp: { value: 0.62 },
                    uGlow: { value: 5.2 },
                    uParallax: { value: 1 }
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

            /* The one scene whose cost is per-pixel. Everything else draws a
             * fixed number of things however big the window is; this draws a
             * 56-step march per pixel, so it opts out of the retina buffer
             * and hands it back on the way out. */
            /* Cheapest rung first. Resolution and march length come down
             * together — both cost the same kind of time here. */
            ladder = VizApp.makeQualityLadder(ctx.renderer, [
                { scale: 0.55, steps: 28 },
                { scale: 0.75, steps: 36 },
                { scale: 1.00, steps: 44 },
                { scale: 1.25, steps: 48 }
            ], function (rung) {
                mat.uniforms.uSteps.value = rung.steps;
            });

            canvasEl = ctx.canvas;
            canvasEl.addEventListener('wheel', onWheel, { passive: false });

            mouse.x = mouse.y = mouse.tx = mouse.ty = 0;
            depth = depthTarget = 0;
            nebTime = 0;
            timeGain = 1;
            this.resize(ctx.width, ctx.height);
            return { scene: scene, camera: camera };
        },

        update: function (dt, t) {
            ladder.tick();
            nebTime += dt * timeGain * (ctxRef.reducedMotion ? 0.25 : 1);
            mat.uniforms.uTime.value = nebTime;

            /* Ease towards the pointer rather than tracking it: a raw value
             * makes the whole frame twitch, because every pixel moves. */
            var k = Math.min(1, dt * 3.2);
            mouse.x += (mouse.tx - mouse.x) * k;
            mouse.y += (mouse.ty - mouse.y) * k;
            depth += (depthTarget - depth) * Math.min(1, dt * 3.0);

            mat.uniforms.uMouse.value.set(mouse.x, mouse.y);
            mat.uniforms.uDepth.value = depth;
        },

        resize: function (w, h) {
            mat.uniforms.uRes.value.set(w, h);
        },

        onPointerMove: function (p) {
            mouse.tx = p.x;
            mouse.ty = p.y;
        },

        onPointerLeave: function () {
            mouse.tx = 0;
            mouse.ty = 0;
        },

        dispose: function () {
            if (canvasEl) canvasEl.removeEventListener('wheel', onWheel);
            if (ladder) ladder.dispose();
            ladder = null;
            VizApp.readout.hide();
            canvasEl = null; ctxRef = null; quad = null; mat = null;
        }
    });
})();
