/* Scene 8 — the wave field.
 *
 * A sheet of water, twenty-eight thousand points of it, running the actual
 * wave equation rather than a sum of sine waves. Poke it and the ripple
 * spreads, reflects off the edges, and interferes with itself — none of which
 * you get from stacked sines, and all of which is what makes water look like
 * water.
 *
 * The whole simulation is three arrays and one line of arithmetic per cell:
 * the next height is twice the current, minus the previous, plus how much the
 * neighbours disagree. That last term is the only physics in it.
 */
(function () {
    'use strict';

    var THREE = window.THREE;

    var GRID = 168;              /* cells per side */
    var SIZE = 30;               /* world units per side */

    var scene, camera, orbit, mesh, geo, mat, renderer;
    var cur, prev, next;         /* height fields, ping-ponged each step */
    var normals;

    var waveC2 = 0.26;           /* stability needs this under 0.5 in 2D */
    var damping = 0.9965;
    var dropSize = 1.0;
    var raining = true;
    var rainClock = 0;

    var _ray = new THREE.Raycaster(), _ndc = new THREE.Vector2();
    var _hitPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    var _hit = new THREE.Vector3();

    function idx(x, z) { return z * GRID + x; }

    /* ---------- the simulation ---------- */

    function splash(gx, gz, strength) {
        var r = Math.max(2, Math.round(3.5 * dropSize));
        for (var dz = -r; dz <= r; dz++) {
            for (var dx = -r; dx <= r; dx++) {
                var x = gx + dx, z = gz + dz;
                if (x < 1 || z < 1 || x >= GRID - 1 || z >= GRID - 1) continue;
                var d = Math.sqrt(dx * dx + dz * dz);
                if (d > r) continue;
                /* A raised cosine, not a spike. A single cell pushed hard is
                 * a frequency the grid cannot represent and it comes back as
                 * a checkerboard rather than a ripple. */
                var f = 0.5 + 0.5 * Math.cos(Math.PI * d / r);
                cur[idx(x, z)] += strength * f;
            }
        }
    }

    function stepWave() {
        var i, x, z;
        for (z = 1; z < GRID - 1; z++) {
            var row = z * GRID;
            for (x = 1; x < GRID - 1; x++) {
                i = row + x;
                var lap = cur[i - 1] + cur[i + 1] + cur[i - GRID] + cur[i + GRID] - 4 * cur[i];
                next[i] = (2 * cur[i] - prev[i] + waveC2 * lap) * damping;
            }
        }
        /* Edges are held at zero — the sheet is a tray, so waves bounce off
         * the sides. Letting them run off instead needs an absorbing boundary,
         * which is more arithmetic for a less interesting picture. */
        var t = prev; prev = cur; cur = next; next = t;
    }

    /* Normals straight off the height grid: on a regular lattice the surface
     * normal is just the two slopes and the spacing, so there is no reason to
     * ask three.js to recompute them from triangles. */
    function updateSurface() {
        var pos = geo.attributes.position.array;
        var nrm = geo.attributes.normal.array;
        var spacing = SIZE / (GRID - 1);
        var i, x, z;

        for (z = 0; z < GRID; z++) {
            for (x = 0; x < GRID; x++) {
                i = z * GRID + x;
                pos[i * 3 + 1] = cur[i];

                var xl = cur[i - (x > 0 ? 1 : 0)];
                var xr = cur[i + (x < GRID - 1 ? 1 : 0)];
                var zl = cur[i - (z > 0 ? GRID : 0)];
                var zr = cur[i + (z < GRID - 1 ? GRID : 0)];

                var nx = xl - xr, ny = 2 * spacing, nz = zl - zr;
                var len = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1;
                nrm[i * 3] = nx / len;
                nrm[i * 3 + 1] = ny / len;
                nrm[i * 3 + 2] = nz / len;
            }
        }
        geo.attributes.position.needsUpdate = true;
        geo.attributes.normal.needsUpdate = true;
    }

    /* ---------- build ---------- */

    function build(ctx) {
        cur = new Float32Array(GRID * GRID);
        prev = new Float32Array(GRID * GRID);
        next = new Float32Array(GRID * GRID);

        geo = new THREE.PlaneGeometry(SIZE, SIZE, GRID - 1, GRID - 1);
        geo.rotateX(-Math.PI / 2);          /* lay it flat; height becomes y */
        geo.computeVertexNormals();
        /* The sheet only ever moves vertically, and by a little; a fixed
         * bounding sphere stops three.js recomputing one every frame. */
        geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), SIZE);

        mat = new THREE.ShaderMaterial({
            uniforms: {
                uLight: { value: new THREE.Vector3(0.45, 0.82, 0.35).normalize() },
                uGrid: { value: 1 },
                uGain: { value: 2.2 }
            },
            vertexShader: [
                'varying vec3 vN; varying float vH; varying vec2 vUv;',
                'void main() {',
                '  vN = normal; vH = position.y; vUv = uv;',
                '  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);',
                '}'
            ].join('\n'),
            fragmentShader: [
                'uniform vec3 uLight; uniform float uGrid; uniform float uGain;',
                'varying vec3 vN; varying float vH; varying vec2 vUv;',
                'void main() {',
                '  vec3 n = normalize(vN);',
                '  float dif = clamp(dot(n, uLight), 0.0, 1.0);',
                /* Crests and troughs get their own end of one hue, so the
                 * shape of the interference reads even where the surface is
                 * lit flat. */
                '  float h = clamp(vH * uGain + 0.5, 0.0, 1.0);',
                '  vec3 deep = vec3(0.04, 0.10, 0.24);',
                '  vec3 mid  = vec3(0.10, 0.36, 0.62);',
                '  vec3 crest= vec3(0.62, 0.92, 1.00);',
                '  vec3 col = h < 0.5 ? mix(deep, mid, h * 2.0) : mix(mid, crest, (h - 0.5) * 2.0);',
                '  col *= 0.35 + 0.85 * dif;',
                /* A lattice drawn on the surface. It is not decoration: on a
                 * smooth sheet with no texture there is nothing for the eye to
                 * track, and the ripples become hard to see. */
                '  vec2 g = abs(fract(vUv * 42.0 - 0.5) - 0.5) / fwidth(vUv * 42.0);',
                '  float line = 1.0 - min(min(g.x, g.y), 1.0);',
                '  col += vec3(0.30, 0.62, 0.95) * line * 0.35 * uGrid;',
                /* Specular glint along the crests. */
                '  float spec = pow(clamp(dot(reflect(-uLight, n), vec3(0.0, 0.0, 1.0)), 0.0, 1.0), 24.0);',
                '  col += vec3(0.7, 0.85, 1.0) * spec * 0.35;',
                '  gl_FragColor = vec4(col, 1.0);',
                '}'
            ].join('\n'),
            side: THREE.DoubleSide
        });

        mesh = new THREE.Mesh(geo, mat);
        return mesh;
    }

    function calm() {
        cur.fill(0);
        prev.fill(0);
        next.fill(0);
    }

    VizApp.register({
        id: 'waves',
        label: 'Wave field',
        title: 'Actual water, more or less',
        blurb: 'A sheet running the real wave equation, not a stack of sine ' +
               'waves. Ripples spread, bounce off the edges and interfere ' +
               'with each other — which is the part sines cannot fake.',
        hint: 'Move the pointer over it to make waves · click for a big one',
        accent: '#38bdf8',

        controls: function () {
            return [
                { id: 'speed', type: 'slider', label: 'Wave speed', min: 0.04, max: 0.45, step: 0.01,
                  value: waveC2,
                  format: function (v) { return v.toFixed(2); },
                  apply: function (v) { waveC2 = v; } },
                { id: 'damp', type: 'slider', label: 'Persistence', min: 0.98, max: 1.0, step: 0.0005,
                  value: damping,
                  format: function (v) { return v >= 0.9995 ? 'forever' : v.toFixed(4); },
                  apply: function (v) { damping = v; } },
                { id: 'drop', type: 'slider', label: 'Drop size', min: 0.4, max: 4, step: 0.1,
                  value: dropSize,
                  format: function (v) { return v.toFixed(1) + '×'; },
                  apply: function (v) { dropSize = v; } },
                { id: 'gain', type: 'slider', label: 'Colour range', min: 0.3, max: 8, step: 0.1,
                  value: 2.2,
                  format: function (v) { return v.toFixed(1) + '×'; },
                  apply: function (v) { mat.uniforms.uGain.value = v; } },
                { id: 'rain', type: 'toggle', label: 'Rain',
                  value: true,
                  apply: function (v) { raining = v; } },
                { id: 'grid', type: 'toggle', label: 'Lattice',
                  value: true,
                  apply: function (v) { mat.uniforms.uGrid.value = v ? 1 : 0; } },
                { id: 'calm', type: 'action', label: 'Still the water',
                  apply: function () { calm(); } }
            ];
        },

        init: function (ctx) {
            renderer = ctx.renderer;
            scene = new THREE.Scene();
            scene.fog = new THREE.Fog(0x070b16, 40, 110);
            camera = new THREE.PerspectiveCamera(44, ctx.width / ctx.height, 0.4, 300);
            scene.add(build(ctx));

            orbit = VizApp.makeOrbit(camera, ctx.canvas, {
                radius: 34, minRadius: 8, maxRadius: 90,
                theta: 0.5, phi: 58 * Math.PI / 180,
                /* Never from underneath, and never quite flat on: a wave field
                 * seen edge-on is a line. */
                minPhi: 12 * Math.PI / 180, maxPhi: 86 * Math.PI / 180,
                spin: ctx.reducedMotion ? 0 : 0.03
            });

            waveC2 = 0.26; damping = 0.9965; dropSize = 1.0; raining = true;
            calm();
            /* Open with something already happening. A flat sheet is a
             * rectangle, and nobody pokes a rectangle. */
            for (var i = 0; i < 7; i++) {
                splash(14 + Math.floor(Math.random() * (GRID - 28)),
                       14 + Math.floor(Math.random() * (GRID - 28)),
                       0.18 + Math.random() * 0.22);
            }
            this.resize(ctx.width, ctx.height);
            return { scene: scene, camera: camera };
        },

        update: function (dt) {
            orbit.update(dt);

            /* Two steps a frame at a fixed size. The wave equation is only
             * stable below a step the grid sets, so the frame's dt is not
             * allowed anywhere near it. */
            stepWave();
            stepWave();

            if (raining) {
                rainClock += dt;
                if (rainClock > 0.42) {
                    rainClock = 0;
                    splash(6 + Math.floor(Math.random() * (GRID - 12)),
                           6 + Math.floor(Math.random() * (GRID - 12)),
                           0.10 + Math.random() * 0.16);
                }
            }
            updateSurface();
        },

        resize: function (w, h) {
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
            if (orbit) {
                var need = VizApp.fitDistance(camera, SIZE * 0.78);
                if (orbit.tRadius < need) { orbit.tRadius = need; orbit.radius = need; }
            }
        },

        onPointerMove: function (p) {
            if (orbit.dragging) return;
            poke(p, 0.16);
        },

        onPointerDown: function (p) { poke(p, 1.1); },

        dispose: function () {
            if (orbit) orbit.dispose();
            VizApp.readout.hide();
            cur = prev = next = normals = null;
            mesh = null; geo = null; mat = null; renderer = null;
        }
    });

    /* Where the pointer meets the plane the sheet rests on, in grid cells.
     * Aiming at the surface itself would need a raycast against 56,000
     * triangles every time the mouse moves; the flat plane underneath is one
     * line of algebra and lands in the same place to within a ripple. */
    function poke(p, strength) {
        _ndc.set(p.x, p.y);
        _ray.setFromCamera(_ndc, camera);
        if (!_ray.ray.intersectPlane(_hitPlane, _hit)) return;

        var gx = Math.round((_hit.x / SIZE + 0.5) * (GRID - 1));
        var gz = Math.round((_hit.z / SIZE + 0.5) * (GRID - 1));
        if (gx < 2 || gz < 2 || gx > GRID - 3 || gz > GRID - 3) return;
        splash(gx, gz, strength);
    }
})();
