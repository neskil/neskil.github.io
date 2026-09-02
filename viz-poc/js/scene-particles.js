/* Scene 3 — the particle field.
 *
 * A hundred thousand points that flow between four shapes: a sphere, a torus
 * knot, a spiral galaxy, and the site's name. The pointer pushes them around;
 * clicking blows them apart and lets them fall back.
 *
 * Nothing here is data — it is the shot that sells the card. So the budget is
 * spent on it running at full rate rather than on it meaning anything: every
 * point carries both of its endpoints as attributes and the whole morph
 * happens in the vertex shader, which means the CPU does nothing per frame but
 * advance two floats.
 */
(function () {
    'use strict';

    var THREE = window.THREE;

    var SHAPES = ['Sphere', 'Torus knot', 'Galaxy', 'The name'];
    var HOLD = 2.6, MORPH = 2.4;      /* seconds still, seconds in transit */
    var WORD = 3;                     /* index of the flat shape in SHAPES */

    var scene, camera, orbit, points, geo, mat;
    var count = 0, shapeIdx = 0, phase = 0, stage = '';
    var burst = 0;
    var vw = 1, vh = 1;
    var mouseWorld = new THREE.Vector3();
    var _ndc = new THREE.Vector2(), _ray = new THREE.Raycaster();
    var _plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);

    function rnd() { return Math.random(); }
    function gauss() { return (rnd() + rnd() + rnd() - 1.5) * 0.9; }

    /* ---------- the four shapes ----------
     * Each fills a Float32Array of xyz for every point. They are generated
     * once at init and swapped between; regenerating on every transition
     * would allocate 1.2 MB in the middle of an animation. */

    function shapeSphere(out, n) {
        var golden = Math.PI * (3 - Math.sqrt(5));
        for (var i = 0; i < n; i++) {
            var y = 1 - (i / (n - 1)) * 2;
            var r = Math.sqrt(Math.max(0, 1 - y * y));
            var th = golden * i;
            /* A shell with a little thickness reads better than a soap
             * bubble — a perfect surface flattens into an outline. */
            var s = 1.35 * (0.94 + rnd() * 0.06);
            out[i * 3] = Math.cos(th) * r * s;
            out[i * 3 + 1] = y * s;
            out[i * 3 + 2] = Math.sin(th) * r * s;
        }
    }

    function shapeKnot(out, n) {
        var p = 2, q = 3;
        for (var i = 0; i < n; i++) {
            var u = (i / n) * Math.PI * 2 * 1.0;
            var r = Math.cos(q * u) + 2;
            var x = r * Math.cos(p * u), y = r * Math.sin(p * u), z = -Math.sin(q * u);
            var s = 0.46;
            /* Random offset in every direction turns the curve into a tube
             * without needing its Frenet frame. */
            out[i * 3] = x * s + gauss() * 0.075;
            out[i * 3 + 1] = y * s + gauss() * 0.075;
            out[i * 3 + 2] = z * s + gauss() * 0.075;
        }
    }

    function shapeGalaxy(out, n) {
        var ARMS = 3;
        for (var i = 0; i < n; i++) {
            var arm = i % ARMS;
            var t = Math.pow(rnd(), 0.65);
            var a = t * 4.2 + (arm / ARMS) * Math.PI * 2 + gauss() * 0.22;
            var rad = 0.18 + t * 1.55;
            out[i * 3] = Math.cos(a) * rad + gauss() * 0.05;
            /* Thin disc, thicker at the core — the shape of the thing. */
            out[i * 3 + 1] = gauss() * 0.09 * (1.1 - t);
            out[i * 3 + 2] = Math.sin(a) * rad + gauss() * 0.05;
        }
    }

    /* The word, sampled off a 2D canvas. Drawing text and reading back which
     * pixels are lit is the whole trick — no font file to vendor, no glyph
     * geometry, and it works with whatever face the page ended up with. */
    function shapeWord(out, n, word) {
        var W = 900, H = 260;
        var c = document.createElement('canvas');
        c.width = W; c.height = H;
        var g = c.getContext('2d');
        g.fillStyle = '#000';
        g.fillRect(0, 0, W, H);
        g.fillStyle = '#fff';
        g.textAlign = 'center';
        g.textBaseline = 'middle';

        /* Shrink to fit rather than trust one size: the fallback face is
         * wider than Outfit, and an overflowing word loses its ends. */
        var size = 190;
        do {
            g.font = '800 ' + size + 'px Outfit, system-ui, sans-serif';
            size -= 6;
        } while (g.measureText(word).width > W * 0.92 && size > 40);
        g.fillText(word, W / 2, H / 2);

        var px = g.getImageData(0, 0, W, H).data;
        var lit = [];
        for (var y = 0; y < H; y += 1) {
            for (var x = 0; x < W; x += 1) {
                if (px[(y * W + x) * 4] > 128) lit.push(x, y);
            }
        }

        var pairs = lit.length / 2;
        for (var i = 0; i < n; i++) {
            if (!pairs) {                       /* no glyphs: fall back to a ring */
                var a = (i / n) * Math.PI * 2;
                out[i * 3] = Math.cos(a) * 1.4;
                out[i * 3 + 1] = Math.sin(a) * 1.4;
                out[i * 3 + 2] = 0;
                continue;
            }
            var k = (Math.random() * pairs) | 0;
            var sx = lit[k * 2], sy = lit[k * 2 + 1];
            out[i * 3] = (sx / W - 0.5) * 3.6 + gauss() * 0.012;
            out[i * 3 + 1] = -(sy / H - 0.5) * 1.04 + gauss() * 0.012;
            out[i * 3 + 2] = gauss() * 0.06;
        }
    }

    function fill(target, idx, n) {
        if (idx === 0) shapeSphere(target, n);
        else if (idx === 1) shapeKnot(target, n);
        else if (idx === 2) shapeGalaxy(target, n);
        else shapeWord(target, n, 'NESKIL');
    }

    /* ---------- build ---------- */

    function build(ctx) {
        /* A hundred thousand is the headline, but a phone with a small
         * viewport gets fewer — the point of the scene is that it runs
         * smoothly, and nobody counts them. */
        count = Math.min(window.innerWidth, window.innerHeight) < 620 ? 45000 : 100000;

        var a = new Float32Array(count * 3);
        var b = new Float32Array(count * 3);
        fill(a, 0, count);
        fill(b, 1, count);

        var seed = new Float32Array(count);
        var col = new Float32Array(count * 3);
        var c = new THREE.Color();
        for (var i = 0; i < count; i++) {
            seed[i] = Math.random();
            /* Colour is fixed to where the point starts on the sphere, so a
             * given speck keeps its identity through every morph instead of
             * the whole cloud repainting each time it changes shape. */
            var h = 0.52 + (a[i * 3 + 1] / 1.35 + 1) * 0.5 * 0.20;
            c.setHSL(h, 0.85, 0.54 + Math.random() * 0.15);
            col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
        }

        geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(a, 3));  /* also shape A */
        geo.setAttribute('aPosB', new THREE.BufferAttribute(b, 3));
        geo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
        geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
        /* Points leave and re-enter the frustum constantly as they morph;
         * a fixed sphere stops three.js culling the whole cloud. */
        geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 4);

        mat = new THREE.ShaderMaterial({
            uniforms: {
                uMix: { value: 0 },
                uScale: { value: 1 },
                uSize: { value: 2.6 },
                uMouse: { value: new THREE.Vector3(99, 99, 99) },
                uPush: { value: 0 },
                uBurst: { value: 0 },
                uTime: { value: 0 }
            },
            vertexShader: [
                'attribute vec3 aPosB; attribute float aSeed;',
                'uniform float uMix, uScale, uSize, uPush, uBurst, uTime;',
                'uniform vec3 uMouse;',
                'varying vec3 vColor; varying float vFade;',
                'void main() {',
                /* Stagger the transition per point. Everything arriving on
                 * the same frame looks like a slide change; spread over a
                 * quarter of the window it looks like a flock. */
                '  float t = clamp((uMix - aSeed * 0.25) / 0.75, 0.0, 1.0);',
                '  t = t * t * (3.0 - 2.0 * t);',
                '  vec3 p = mix(position, aPosB, t);',
                /* Drift, so a held shape is never completely still. */
                '  p += 0.012 * vec3(sin(uTime * 0.7 + aSeed * 31.0),',
                '                    cos(uTime * 0.6 + aSeed * 17.0),',
                '                    sin(uTime * 0.5 + aSeed * 23.0));',
                /* The pointer as a soft repulsion well. */
                '  vec3 d = p - uMouse;',
                '  float dist = length(d);',
                '  p += normalize(d + 1e-4) * uPush * exp(-dist * dist * 2.2);',
                /* And the click: everything outward, proportional to nothing
                 * in particular except how far out it already was. */
                '  p += normalize(p + 1e-4) * uBurst * (0.6 + aSeed * 0.8);',
                '  vColor = color;',
                '  vFade = 0.62 + 0.38 * sin(uTime * 1.4 + aSeed * 6.28);',
                '  vec4 mv = modelViewMatrix * vec4(p, 1.0);',
                '  gl_PointSize = uSize * uScale / -mv.z;',
                '  gl_Position = projectionMatrix * mv;',
                '}'
            ].join('\n'),
            fragmentShader: [
                'varying vec3 vColor; varying float vFade;',
                'void main() {',
                '  float d = length(gl_PointCoord - vec2(0.5));',
                '  if (d > 0.5) discard;',
                '  gl_FragColor = vec4(vColor, smoothstep(0.5, 0.0, d) * vFade);',
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

    /* When a morph finishes, the shape we just arrived at becomes the shape we
     * leave from, and a fresh target is generated behind it. */
    function advance() {
        var a = geo.attributes.position.array;
        var b = geo.attributes.aPosB.array;
        a.set(b);
        shapeIdx = (shapeIdx + 1) % SHAPES.length;
        fill(b, (shapeIdx + 1) % SHAPES.length, count);
        geo.attributes.position.needsUpdate = true;
        geo.attributes.aPosB.needsUpdate = true;
        mat.uniforms.uMix.value = 0;

        /* The word is flat, and a flat thing seen edge-on is a stick. When it
         * is the shape being formed or the next one up, bring the camera round
         * to face it and hold the spin off until it has been and gone. The
         * other three read from any angle and are left to turn. */
        if (shapeIdx === WORD || (shapeIdx + 1) % SHAPES.length === WORD) {
            orbit.focus(0, Math.PI / 2);
            orbit.hold = HOLD + MORPH + 0.6;
        }
        stage = '';
    }

    /* Two different things to say, and saying the wrong one is worse than
     * saying nothing: while a shape is held the panel names it, and the
     * moment the morph starts it names what is arriving — otherwise the
     * readout reads "Galaxy" over a fully formed word. */
    function showShape(morphing) {
        var cur = SHAPES[shapeIdx];
        var next = SHAPES[(shapeIdx + 1) % SHAPES.length];
        VizApp.readout.show('Point cloud', morphing
            ? [['Forming', next], ['From', cur], ['Points', count.toLocaleString()]]
            : [['Holding', cur], ['Next', next], ['Points', count.toLocaleString()]]);
    }

    VizApp.register({
        id: 'particles',
        label: 'Particle field',
        title: 'A hundred thousand of them',
        blurb: 'One point cloud, four shapes, and the whole morph running in ' +
               'the vertex shader — every point carries both of its endpoints, ' +
               'so the CPU advances two numbers a frame and nothing else.',
        hint: 'Move the pointer to push them · click to scatter',
        accent: '#a78bfa',

        init: function (ctx) {
            scene = new THREE.Scene();
            camera = new THREE.PerspectiveCamera(45, ctx.width / ctx.height, 0.1, 100);
            scene.add(build(ctx));

            orbit = VizApp.makeOrbit(camera, ctx.canvas, {
                radius: 4.6, minRadius: 2.2, maxRadius: 12,
                theta: 0, phi: 82 * Math.PI / 180,
                spin: ctx.reducedMotion ? 0 : 0.10
            });

            shapeIdx = 0;
            phase = 0;
            stage = '';
            vw = ctx.width; vh = ctx.height;
            this.resize(ctx.width, ctx.height);
            return { scene: scene, camera: camera };
        },

        update: function (dt, t) {
            orbit.update(dt);
            mat.uniforms.uTime.value = t;

            phase += dt;
            if (phase < HOLD) {
                mat.uniforms.uMix.value = 0;
                if (stage !== 'hold') { stage = 'hold'; showShape(false); }
            } else if (phase < HOLD + MORPH) {
                mat.uniforms.uMix.value = (phase - HOLD) / MORPH;
                if (stage !== 'morph') { stage = 'morph'; showShape(true); }
            } else {
                phase = 0;
                advance();
            }

            burst *= Math.exp(-dt * 2.4);
            mat.uniforms.uBurst.value = burst;
        },

        resize: function (w, h) {
            vw = w; vh = h;
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
            mat.uniforms.uScale.value =
                h / (2 * Math.tan(camera.fov * Math.PI / 360)) * 0.0032;
        },

        onPointerMove: function (p) {
            /* The pointer lives on a plane through the origin facing the
             * camera, so the well follows the cloud however it is turned. */
            _plane.normal.copy(camera.position).normalize();
            _plane.constant = 0;
            _ndc.set(p.x, p.y);
            _ray.setFromCamera(_ndc, camera);
            if (_ray.ray.intersectPlane(_plane, mouseWorld)) {
                mat.uniforms.uMouse.value.copy(mouseWorld);
                mat.uniforms.uPush.value = 0.55;
            }
        },

        onPointerDown: function () { burst = 0.9; },

        onPointerLeave: function () {
            mat.uniforms.uPush.value = 0;
            mat.uniforms.uMouse.value.set(99, 99, 99);
        },

        dispose: function () {
            if (orbit) orbit.dispose();
            VizApp.readout.hide();
            points = null; geo = null; mat = null;
        }
    });
})();
