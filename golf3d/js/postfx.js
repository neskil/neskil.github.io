/* Everything that happens to the picture after the course has been drawn.

   The course goes into an offscreen buffer instead of straight to the canvas,
   and one full-screen pass turns that buffer into the image you see: bloom on
   whatever is brighter than the page, shafts of light out of the sun, a filmic
   shoulder so a white rail in full sun rolls off instead of clipping, the
   weather's colour grade, a vignette, and a little grain to stop the sky
   banding. It is the difference between "a 3D scene" and "a photograph of
   one", and none of it touches a single triangle.

   Three things are worth knowing about the arrangement.

   **The renderer's own tone mapping and output encoding are switched off**, and
   this file does both at the end of the composite instead. Otherwise the
   picture would be tone-mapped once on the way into the buffer and graded on a
   value that had already been squashed, and the sky — a raw ShaderMaterial,
   which three.js does not decorate with the tone-mapping chunk — would be the
   one thing in frame that had missed the treatment.

   **Bloom is two blurs, not one.** A single half-resolution blur gives a tight
   halo that reads as a mistake; a second at quarter resolution underneath it
   gives the broad glow that reads as light. Together they cost about a third of
   a frame at half res, which is the whole reason to blur small.

   **It measures itself.** A phone that cannot hold 30fps with the full chain
   loses the light shafts, then the bloom, and keeps the grade — which is the
   part doing most of the work anyway. Nothing to configure and nothing for the
   player to get wrong. */
(function (G3) {
    'use strict';

    /* One vertex shader for every pass. The quad's own coordinates are already
       clip space, so there is no matrix to apply and the camera it is drawn
       with is never consulted. */
    var QUAD_VS =
        'varying vec2 vUv;' +
        'void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }';

    /* Bright pass. A soft knee rather than a hard cut, so a surface drifting
       past the threshold fades into the glow instead of switching it on. */
    var BRIGHT_FS =
        'uniform sampler2D tDiffuse; uniform float threshold; uniform float knee;' +
        'varying vec2 vUv;' +
        'void main(){' +
        '  vec3 c = texture2D(tDiffuse, vUv).rgb;' +
        '  float l = max(c.r, max(c.g, c.b));' +
        '  float s = clamp((l - threshold) / max(knee, 1e-4), 0.0, 1.0);' +
        '  gl_FragColor = vec4(c * s * s, 1.0);' +
        '}';

    /* A five-tap gaussian that reaches nine pixels, by landing its taps between
       texels and letting the bilinear filter add the pairs for free. Run once
       across and once down. */
    var BLUR_FS =
        'uniform sampler2D tDiffuse; uniform vec2 dir;' +
        'varying vec2 vUv;' +
        'void main(){' +
        '  vec3 c = texture2D(tDiffuse, vUv).rgb * 0.2270270270;' +
        '  c += (texture2D(tDiffuse, vUv + dir * 1.3846153846).rgb +' +
        '        texture2D(tDiffuse, vUv - dir * 1.3846153846).rgb) * 0.3162162162;' +
        '  c += (texture2D(tDiffuse, vUv + dir * 3.2307692308).rgb +' +
        '        texture2D(tDiffuse, vUv - dir * 3.2307692308).rgb) * 0.0702702703;' +
        '  gl_FragColor = vec4(c, 1.0);' +
        '}';

    /* The composite. Everything the eye is told about the weather happens in
       here, which is why the grade is a handful of uniforms rather than a
       handful of materials: a hole can go from noon to a rain squall without
       rebuilding anything. */
    var COMP_FS = [
        'uniform sampler2D tScene, tBloomA, tBloomB;',
        'uniform float bloom, rays, exposure, contrast, saturation, vignette, grain, aberration, time;',
        'uniform vec2 sunUv;',
        'uniform vec3 tint, lift;',
        'varying vec2 vUv;',

        // Narkowicz's fit of the ACES curve: lifts the mid-tones a shade and,
        // more to the point, gives the top end somewhere to go.
        'vec3 aces(vec3 x){',
        '  return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0);',
        '}',

        'void main(){',
        '  vec2 off = vUv - 0.5;',
        // A lens is not one lens: the corners split colour a little, and the
        // amount grows with the square of the distance out from the middle.
        // The constant puts a nominal aberration of 1.0 at about two pixels in
        // the corners of a 1080p frame, which is the most you can get away with
        // before it stops reading as a lens and starts reading as a fault.
        '  vec2 ab = off * (aberration * 0.0055 * dot(off, off));',
        '  vec3 c;',
        '  c.r = texture2D(tScene, vUv + ab).r;',
        '  c.g = texture2D(tScene, vUv).g;',
        '  c.b = texture2D(tScene, vUv - ab).b;',

        '  if (bloom > 0.0005) {',
        '    vec3 b = texture2D(tBloomA, vUv).rgb * 0.62 + texture2D(tBloomB, vUv).rgb * 0.38;',
        '    c += b * bloom;',
        '  }',

        /* Light shafts. Marching the *blurred* bright pass towards the sun is
           the cheap version of god rays, and at twelve taps of a half-size
           texture it is nearly free — the expensive part, isolating what is
           bright, has already been paid for by the bloom. */
        '  if (rays > 0.0005) {',
        '    vec2 step = (sunUv - vUv) * (0.5 / 12.0);',
        '    vec2 p = vUv;',
        '    float w = 1.0;',
        '    vec3 acc = vec3(0.0);',
        '    for (int i = 0; i < 12; i++) {',
        '      p += step;',
        '      acc += texture2D(tBloomA, p).rgb * w;',
        '      w *= 0.88;',
        '    }',
        '    c += acc * (rays / 12.0);',
        '  }',

        '  c = aces(c * exposure) * tint + lift;',

        '  float l = dot(c, vec3(0.2126, 0.7152, 0.0722));',
        '  c = mix(vec3(l), c, saturation);',
        '  c = (c - 0.5) * contrast + 0.5;',

        // Round rather than elliptical, and biased so that only the last
        // quarter of the way out is doing anything.
        '  float v = smoothstep(0.92, 0.30, length(off));',
        '  c *= mix(1.0, v, vignette);',

        // Grain, keyed off the clock so it crawls; a still frame of grain is
        // dirt on the lens rather than film.
        '  if (grain > 0.0001) {',
        '    float n = fract(sin(dot(vUv + fract(time), vec2(12.9898, 78.233))) * 43758.5453);',
        '    c += (n - 0.5) * grain;',
        '  }',

        // Linear to sRGB, which is the step renderer.outputEncoding used to do
        // for us before the picture started going through a buffer.
        '  c = max(c, vec3(0.0));',
        '  gl_FragColor = vec4(pow(c, vec3(0.4545454545)), 1.0);',
        '}'
    ].join('\n');

    var FX = {
        ok: false,
        renderer: null,
        w: 2, h: 2,
        tier: 2, want: 2,          // 2 full, 1 bloom only, 0 grade only
        acc: 0, accN: 0,           // rolling frame-time average, for the tiers
        last: 0,                   // …measured on our own clock, see tierFor()
        settle: 2                  // seconds of grace before judging anything
    };

    function target(w, h, multisample) {
        var opts = {
            minFilter: THREE.LinearFilter,
            magFilter: THREE.LinearFilter,
            format: THREE.RGBAFormat,
            type: FX.type,
            depthBuffer: !!multisample,
            stencilBuffer: false
        };
        var rt = (multisample && FX.multisample)
            ? new THREE.WebGLMultisampleRenderTarget(w, h, opts)
            : new THREE.WebGLRenderTarget(w, h, opts);
        if (multisample && FX.multisample) rt.samples = 4;
        return rt;
    }

    function material(fs, uniforms) {
        return new THREE.ShaderMaterial({
            uniforms: uniforms,
            vertexShader: QUAD_VS,
            fragmentShader: fs,
            depthTest: false,
            depthWrite: false
        });
    }

    function init(renderer) {
        try {
            FX.renderer = renderer;
            var caps = renderer.capabilities;

            /* Half float when it is going for nothing, because it is what lets
               the sun be brighter than white and therefore lets the bright pass
               find it. On a context without it the buffer clamps at 1.0, the
               threshold below still catches the whitest part of the sky, and
               the bloom is merely gentler. */
            /* WebGL2 can always render into a half-float buffer. WebGL1 needs
               two separate extensions and having only the first is a trap:
               OES_texture_half_float says the format exists, and
               EXT_color_buffer_half_float is the one that says you may draw
               into it. Asking for only the former gets an incomplete
               framebuffer and a black screen on exactly the old hardware this
               is trying to be careful about. */
            FX.type = (caps.isWebGL2 ||
                (renderer.extensions.get('OES_texture_half_float') &&
                 renderer.extensions.get('EXT_color_buffer_half_float')))
                ? THREE.HalfFloatType : THREE.UnsignedByteType;
            /* Rendering into a buffer throws away the canvas's own MSAA, so on
               WebGL2 the scene buffer takes its own. Without it every rail edge
               would come back jagged — a strictly worse picture in exchange for
               a nicer one, which is not a trade. */
            FX.multisample = !!caps.isWebGL2 && !!THREE.WebGLMultisampleRenderTarget;

            FX.quadGeo = new THREE.PlaneGeometry(2, 2);
            FX.scene = new THREE.Scene();
            FX.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
            FX.quad = new THREE.Mesh(FX.quadGeo, null);
            FX.quad.frustumCulled = false;
            FX.scene.add(FX.quad);

            FX.uBright = {
                tDiffuse: { value: null },
                threshold: { value: 0.74 },
                knee: { value: 0.45 }
            };
            FX.uBlur = { tDiffuse: { value: null }, dir: { value: new THREE.Vector2() } };
            FX.uComp = {
                tScene: { value: null }, tBloomA: { value: null }, tBloomB: { value: null },
                bloom: { value: 0.55 }, rays: { value: 0.0 },
                exposure: { value: 1.0 }, contrast: { value: 1.04 }, saturation: { value: 1.06 },
                vignette: { value: 0.34 }, grain: { value: 0.018 }, aberration: { value: 0.9 },
                time: { value: 0 },
                sunUv: { value: new THREE.Vector2(0.5, 0.9) },
                tint: { value: new THREE.Color(1, 1, 1) },
                lift: { value: new THREE.Color(0, 0, 0) }
            };

            FX.mBright = material(BRIGHT_FS, FX.uBright);
            FX.mBlur = material(BLUR_FS, FX.uBlur);
            FX.mComp = material(COMP_FS, FX.uComp);

            resize(renderer.domElement.width || 2, renderer.domElement.height || 2);

            // We now own both of these, at the far end of the chain.
            renderer.toneMapping = THREE.NoToneMapping;
            if (THREE.LinearEncoding !== undefined) renderer.outputEncoding = THREE.LinearEncoding;

            FX.ok = true;
        } catch (e) {
            FX.ok = false;
        }
        return FX.ok;
    }

    function dispose(rt) { if (rt) rt.dispose(); }

    function resize(w, h) {
        if (!FX.renderer) return;
        w = Math.max(2, Math.floor(w));
        h = Math.max(2, Math.floor(h));
        if (w === FX.w && h === FX.h && FX.rt) return;
        FX.w = w; FX.h = h;

        dispose(FX.rt); dispose(FX.a1); dispose(FX.a2); dispose(FX.b1); dispose(FX.b2);
        FX.rt = target(w, h, true);
        var hw = Math.max(2, w >> 1), hh = Math.max(2, h >> 1);
        var qw = Math.max(2, w >> 2), qh = Math.max(2, h >> 2);
        FX.a1 = target(hw, hh);
        FX.a2 = target(hw, hh);
        FX.b1 = target(qw, qh);
        FX.b2 = target(qw, qh);
    }

    function draw(mat, to) {
        FX.quad.material = mat;
        FX.renderer.setRenderTarget(to || null);
        FX.renderer.render(FX.scene, FX.camera);
    }

    function blur(from, tmp, to, radius) {
        var w = to.width, h = to.height;
        FX.uBlur.tDiffuse.value = from.texture;
        FX.uBlur.dir.value.set(radius / w, 0);
        draw(FX.mBlur, tmp);
        FX.uBlur.tDiffuse.value = tmp.texture;
        FX.uBlur.dir.value.set(0, radius / h);
        draw(FX.mBlur, to);
    }

    /* The grade, as the weather sees it: a multiply, an add, and the handful of
       scalars that decide how much of the chain is switched on. Anything left
       out of the patch keeps the value it had. */
    function setGrade(g) {
        if (!FX.ok || !g) return;
        var u = FX.uComp, k;
        var scalars = ['bloom', 'rays', 'exposure', 'contrast', 'saturation',
            'vignette', 'grain', 'aberration'];
        for (k = 0; k < scalars.length; k++) {
            if (g[scalars[k]] !== undefined) u[scalars[k]].value = g[scalars[k]];
        }
        if (g.tint) u.tint.value.setRGB(g.tint[0], g.tint[1], g.tint[2]);
        if (g.lift) u.lift.value.setRGB(g.lift[0], g.lift[1], g.lift[2]);
        if (g.threshold !== undefined) FX.uBright.threshold.value = g.threshold;
        FX.want = g.chain === undefined ? FX.want : g.chain;
        FX.base = {
            bloom: u.bloom.value, rays: u.rays.value,
            aberration: u.aberration.value, grain: u.grain.value
        };
    }

    /* Frame time decides how much of the chain the machine gets to keep.

       It reads its own clock rather than the dt it is handed. The game loop
       caps that at 50ms so that a dropped frame can never change a shot, which
       is exactly right for the simulation and exactly wrong here: a machine
       running at four frames a second would report 50ms frames, and the tier
       that is costing it the other 200 would never be turned down.

       Two seconds of grace first. The first frames of a hole include compiling
       every shader it uses, and demoting a phone over those would punish it
       for something it does once. */
    function tierFor() {
        var now = (window.performance && performance.now) ? performance.now() : Date.now();
        var dt = FX.last ? Math.min(0.25, (now - FX.last) / 1000) : 0.016;
        FX.last = now;

        if (FX.settle > 0) { FX.settle -= dt; return FX.tier; }
        FX.acc += dt; FX.accN++;
        // Seventy frames, or two seconds of them, whichever comes first. A
        // machine slow enough to matter is also slow enough that waiting for a
        // frame count would leave it struggling for half a minute before
        // anything happened about it.
        if (FX.accN < 70 && FX.acc < 2) return FX.tier;
        var mean = FX.acc / FX.accN;
        FX.acc = 0; FX.accN = 0;
        if (mean > 1 / 32 && FX.tier > 0) FX.tier--;
        else if (mean < 1 / 55 && FX.tier < FX.want) FX.tier++;
        return FX.tier;
    }

    /* `sun` is where the light shafts converge and how much of the sun is
       actually on the screen — see sunOnScreen() in render.js. Rays fade out
       with it rather than switching off, or a slow pan past the sun would pop.
       Passing nothing means no rays this frame. */
    function render(scene, camera, sun, dt) {
        if (!FX.ok) return false;
        var u = FX.uComp;
        var tier = tierFor();
        var base = FX.base || { bloom: u.bloom.value, rays: u.rays.value, aberration: u.aberration.value, grain: u.grain.value };
        var vis = sun ? sun.vis : 0;

        if (sun) u.sunUv.value.copy(sun.uv);
        u.time.value = (u.time.value + (dt || 0.016)) % 1000;

        FX.renderer.setRenderTarget(FX.rt);
        FX.renderer.clear();
        FX.renderer.render(scene, camera);

        var wantBloom = tier >= 1 ? base.bloom : 0;
        var wantRays = tier >= 2 ? base.rays * vis : 0;

        if (wantBloom > 0.0005 || wantRays > 0.0005) {
            FX.uBright.tDiffuse.value = FX.rt.texture;
            draw(FX.mBright, FX.a1);
            blur(FX.a1, FX.a2, FX.a1, 1.0);
            if (tier >= 2) {
                FX.uBlur.tDiffuse.value = FX.a1.texture;
                FX.uBlur.dir.value.set(1.0 / FX.b1.width, 0);
                draw(FX.mBlur, FX.b1);
                blur(FX.b1, FX.b2, FX.b1, 2.0);
            }
        }

        u.tScene.value = FX.rt.texture;
        u.tBloomA.value = FX.a1.texture;
        u.tBloomB.value = (tier >= 2 ? FX.b1 : FX.a1).texture;
        u.bloom.value = wantBloom;
        u.rays.value = wantRays;
        u.aberration.value = tier >= 2 ? base.aberration : 0;
        u.grain.value = tier >= 1 ? base.grain : 0;
        draw(FX.mComp, null);
        return true;
    }

    G3.postfx = {
        init: init,
        resize: resize,
        render: render,
        setGrade: setGrade,
        get ok() { return FX.ok; },
        get tier() { return FX.tier; },
        state: FX
    };

})(window.G3);
