/* Weather, wind and the things drifting about in the air.

   A course used to be a fixed set of colours: the same noon, the same flat
   sky, every hole, every round. This file gives each hole a sky of its own and
   a wind that everything else answers to — the flag, the rain, the clouds, the
   sea, the motes of pollen going past the camera — so that two rounds on the
   same six holes do not look like the same afternoon twice.

   **None of it is in the simulation.** Wind does not push the ball, rain does
   not slow it, and a hole in the mist plays exactly as it does in the sun.
   That is deliberate: the weather is meant to change what a hole *feels* like
   without ever changing what it *costs*, so a personal best still means the
   same thing whatever the sky was doing. `physics.js` has never heard of this
   file and never will.

   **The weather is chosen, not rolled.** It comes out of a hash of the course
   id and the hole number, so hole 4 at Windmill Works is misty for everybody
   and misty again tomorrow — a hole you remember is a hole with a sky you
   remember. `?weather=rain` overrides it for the whole round, and `W` cycles
   through what the current course can plausibly do.

   Three things ride on the wind, and it is one vector:

     · the flag, which is the only instrument on the course telling you how
       hard it is blowing;
     · the rain and the drifting motes, which slant with it;
     · the clouds and the water, which scroll with it.

   The wind itself is a bearing that wanders and a speed that gusts — three
   sines with awkward periods, so it never repeats inside a round without ever
   being random enough to jump. */
(function (G3) {
    'use strict';

    /* Each kind is a sky, a light and a grade. `cloud` is coverage, 0 clear to
       1 solid; `fog` scales the theme's own fog distances, so a low number is
       a thick day; `sun` and `amb` scale the two lights. `grade` goes straight
       to postfx and is where most of the mood actually lives — the same
       geometry under a 0.79 saturation and a blue tint is a different
       afternoon.

       `tintSky` pulls the theme's own sky, fog and horizon towards a colour —
       grey for a squall, orange for the last hour of light. Without it a
       golden hour is a warm filter over a noon-blue sky, which fools nobody:
       the light has to change colour at the same time as the air does. */
    var KINDS = {
        clear: {
            id: 'clear', label: 'Clear', icon: '☀',
            cloud: 0.13, cloudTop: '#ffffff', cloudBase: '#c3d0dc',
            fog: 1.75, sun: 1.22, amb: 0.92, wind: 0.30, sunSharp: 1.0,
            motes: 'pollen',
            grade: {
                exposure: 0.69, contrast: 1.05, saturation: 1.17, bloom: 0.30,
                rays: 0.16, vignette: 0.30, grain: 0.012, aberration: 0.8,
                tint: [1.02, 1.00, 0.97], lift: [0, 0, 0], threshold: 0.88
            }
        },
        fair: {
            id: 'fair', label: 'Fair', icon: '⛅',
            cloud: 0.44, cloudTop: '#ffffff', cloudBase: '#b9c6d4',
            fog: 1.30, sun: 1.05, amb: 1.02, wind: 0.50, sunSharp: 0.9,
            motes: 'pollen',
            grade: {
                exposure: 0.69, contrast: 1.04, saturation: 1.13, bloom: 0.32,
                rays: 0.14, vignette: 0.33, grain: 0.014, aberration: 0.8,
                tint: [1.00, 1.00, 1.00], lift: [0, 0, 0], threshold: 0.86
            }
        },
        overcast: {
            id: 'overcast', label: 'Overcast', icon: '☁',
            cloud: 0.97, cloudTop: '#c8ced6', cloudBase: '#8a93a0',
            tintSky: '#9aa4b0', tintAmt: 0.55,
            fog: 0.72, sun: 0.30, amb: 1.38, wind: 0.68, sunSharp: 0.25,
            motes: null,
            grade: {
                exposure: 0.71, contrast: 1.02, saturation: 0.91, bloom: 0.22,
                rays: 0.0, vignette: 0.40, grain: 0.018, aberration: 0.5,
                tint: [0.97, 0.99, 1.05], lift: [0.006, 0.008, 0.012], threshold: 0.90
            }
        },
        rain: {
            id: 'rain', label: 'Rain', icon: '🌧',
            cloud: 1.0, cloudTop: '#9aa3ad', cloudBase: '#6d7784',
            tintSky: '#7b8794', tintAmt: 0.62,
            fog: 0.58, sun: 0.20, amb: 1.28, wind: 0.98, sunSharp: 0.15,
            rain: 1, wet: 1, motes: null,
            grade: {
                exposure: 0.67, contrast: 1.08, saturation: 0.79, bloom: 0.28,
                rays: 0.0, vignette: 0.48, grain: 0.030, aberration: 1.1,
                tint: [0.92, 0.97, 1.08], lift: [0.005, 0.008, 0.015], threshold: 0.84
            }
        },
        drizzle: {
            id: 'drizzle', label: 'Drizzle', icon: '🌦',
            cloud: 0.86, cloudTop: '#b6bec8', cloudBase: '#7c8794',
            tintSky: '#8d97a3', tintAmt: 0.44,
            fog: 0.60, sun: 0.42, amb: 1.22, wind: 0.62, sunSharp: 0.35,
            rain: 0.42, wet: 0.7, haze: 0.35, motes: null,
            grade: {
                exposure: 0.69, contrast: 1.04, saturation: 0.91, bloom: 0.28,
                rays: 0.08, vignette: 0.42, grain: 0.022, aberration: 0.9,
                tint: [0.96, 0.99, 1.05], lift: [0.006, 0.009, 0.013], threshold: 0.86
            }
        },
        mist: {
            id: 'mist', label: 'Mist', icon: '🌫',
            cloud: 0.55, cloudTop: '#e2e7ec', cloudBase: '#b3bcc6',
            tintSky: '#dfe6ea', tintAmt: 0.55,
            fog: 0.42, sun: 0.52, amb: 1.22, wind: 0.18, sunSharp: 0.4,
            haze: 1, motes: 'pollen',
            grade: {
                exposure: 0.71, contrast: 0.97, saturation: 0.95, bloom: 0.46,
                rays: 0.30, vignette: 0.28, grain: 0.016, aberration: 0.6,
                tint: [1.00, 1.00, 1.02], lift: [0.016, 0.018, 0.021], threshold: 0.76
            }
        },
        golden: {
            id: 'golden', label: 'Golden hour', icon: '🌇',
            cloud: 0.34, cloudTop: '#ffe4c0', cloudBase: '#b98a72',
            tintSky: '#ffa552', tintAmt: 0.48,
            fog: 1.10, sun: 1.05, amb: 0.86, wind: 0.34, sunSharp: 1.0,
            low: 1, warm: '#ffb562', motes: 'pollen',
            grade: {
                exposure: 0.71, contrast: 1.06, saturation: 1.21, bloom: 0.42,
                rays: 0.36, vignette: 0.38, grain: 0.014, aberration: 1.0,
                tint: [1.13, 1.00, 0.84], lift: [0.008, 0.003, 0], threshold: 0.80
            }
        },
        dust: {
            id: 'dust', label: 'Dust haze', icon: '🌬',
            cloud: 0.38, cloudTop: '#f0dcbc', cloudBase: '#bfa47f',
            tintSky: '#e0bd88', tintAmt: 0.50,
            fog: 0.50, sun: 0.78, amb: 1.06, wind: 1.15, sunSharp: 0.5,
            haze: 0.7, warm: '#ffcf8e', motes: 'dust',
            grade: {
                exposure: 0.69, contrast: 1.02, saturation: 0.99, bloom: 0.32,
                rays: 0.24, vignette: 0.44, grain: 0.028, aberration: 1.0,
                tint: [1.09, 1.00, 0.85], lift: [0.016, 0.011, 0.005], threshold: 0.84
            }
        }
    };

    /* What each course can plausibly do. A quarry does not get sea mist and the
       works, which is already after dark, does not get a golden hour. */
    var BY_THEME = {
        seaside: ['clear', 'fair', 'golden', 'mist', 'drizzle', 'rain'],
        quarry: ['clear', 'fair', 'golden', 'dust', 'overcast', 'drizzle'],
        works: ['fair', 'clear', 'mist', 'overcast', 'rain'],
        lagoon: ['clear', 'fair', 'golden', 'mist', 'drizzle', 'rain'],
        highland: ['fair', 'clear', 'overcast', 'mist', 'drizzle', 'golden']
    };

    // Skies a course is happy to open on.
    var BRIGHT = ['clear', 'fair', 'golden'];

    var MOTES = {
        pollen: { colour: 0xfff2c0, size: 0.045, count: 190, rise: 0.10, opacity: 0.30 },
        dust: { colour: 0xd8c19a, size: 0.065, count: 260, rise: 0.02, opacity: 0.26 }
    };

    var W = {
        now: KINDS.fair,
        theme: 'seaside',
        override: null,          // ?weather= or the W key, kept for the round
        wind: { dir: 0.8, speed: 0.5, x: 0, z: 0, gust: 0 },
        // How much of the weather is actually in front of the camera, 1 all of
        // it. The renderer pulls this down when the camera goes overhead.
        atmos: 1,
        dirBase: 0.8,            // the hole's prevailing bearing; build() sets it
        group: null,
        rain: null, motes: null, mist: [], birds: [],
        tex: [],                 // textures this hole made, to hand back
        clock: 0,
        cloudOff: new THREE.Vector2()
    };

    /* ── the wind ───────────────────────────────────────────────────────── */

    /* A bearing that wanders and a speed that gusts. Three sines with periods
       that do not divide into each other, which is the cheapest way to get
       something that never repeats inside a round and never jumps either. */
    function stepWind(dt) {
        var w = W.wind, t = W.clock;
        var base = W.now.wind;
        w.dir = W.dirBase + Math.sin(t * 0.083) * 0.5 + Math.sin(t * 0.031) * 0.28;
        w.gust = 0.5 + 0.5 * (Math.sin(t * 0.37) * 0.5 + Math.sin(t * 0.13 + 1.7) * 0.3 +
            Math.sin(t * 0.71 + 4.1) * 0.2);
        w.speed = base * (0.55 + w.gust * 0.75);
        w.x = Math.sin(w.dir) * w.speed;
        w.z = Math.cos(w.dir) * w.speed;
        return w;
    }

    // What the HUD says. The scale is invented but consistent: a full gust in a
    // rain squall reads about 40km/h, a clear morning about 8.
    function windSpeedKph() { return Math.round(W.wind.speed * 34); }

    /* ── choosing ───────────────────────────────────────────────────────── */

    function hash(s) {
        var h = 2166136261, i;
        for (i = 0; i < s.length; i++) {
            h ^= s.charCodeAt(i);
            h = (h * 16777619) >>> 0;
        }
        return h;
    }

    function listFor(theme) { return BY_THEME[theme] || BY_THEME.seaside; }

    /* A shuffle, not a hash per hole. Hashing the hole number and taking it
       modulo the list was the obvious thing and it was wrong: six samples of a
       six-way choice repeat about as often as they do not, and a course whose
       first two holes are both "Clear" reads as a course with no weather in it
       at all. Dealing the list out instead means a six-hole round sees six
       different skies, in an order that is still the same one every time.

       Seeded Fisher-Yates off a 32-bit LCG, which is enough randomness to
       shuffle six things and short enough to read. */
    var _order = {};
    function order(courseId, theme) {
        var key = courseId + '|' + theme;
        if (_order[key]) return _order[key];
        var list = listFor(theme).slice();
        var seed = hash(key) || 1;
        for (var i = list.length - 1; i > 0; i--) {
            seed = (seed * 1664525 + 1013904223) >>> 0;
            var j = seed % (i + 1);
            var t = list[i]; list[i] = list[j]; list[j] = t;
        }
        /* One rule on top of the deal: the first hole of a course gets a sky
           you can see it in. Hole one is the shop window — it is what is
           behind the course picker on a first visit — and opening a round in
           the rain is a poor advertisement for six holes of anything. */
        for (var b = 0; b < list.length; b++) {
            if (BRIGHT.indexOf(list[b]) >= 0) {
                var f = list[b]; list[b] = list[0]; list[0] = f;
                break;
            }
        }
        _order[key] = list;
        return list;
    }

    /* Deterministic, so a hole's weather is part of what the hole is. The
       override — a query parameter or the W key — wins for the whole round. */
    function pick(courseId, holeIndex, theme) {
        if (W.override && KINDS[W.override]) return KINDS[W.override];
        var list = order(courseId, theme);
        return KINDS[list[holeIndex % list.length]] || KINDS.fair;
    }

    function setOverride(id) {
        W.override = (id && KINDS[id]) ? id : null;
        return W.override;
    }

    // The W key: the next thing this course could be doing, from where it is.
    function cycle(theme) {
        var list = listFor(theme);
        var at = list.indexOf(W.now.id);
        return setOverride(list[(at + 1) % list.length]);
    }

    /* ── props ──────────────────────────────────────────────────────────── */

    function canvasTex(size, draw) {
        var cv = document.createElement('canvas');
        cv.width = cv.height = size;
        draw(cv.getContext('2d'), size);
        var t = new THREE.CanvasTexture(cv);
        t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
        // The renderer disposes geometries and materials with the hole group,
        // but not textures — those are usually shared and it would be wrong
        // to. Ours are not shared, so we keep the receipts ourselves.
        W.tex.push(t);
        return t;
    }

    function softDot() {
        return canvasTex(64, function (g, s) {
            var grd = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
            grd.addColorStop(0, 'rgba(255,255,255,1)');
            grd.addColorStop(0.5, 'rgba(255,255,255,0.5)');
            grd.addColorStop(1, 'rgba(255,255,255,0)');
            g.fillStyle = grd;
            g.fillRect(0, 0, s, s);
        });
    }

    /* A bank of fog, as one texture: a few dozen soft blobs, faded to nothing
       at the edges of the sheet so a plane can be laid over the course without
       its own rectangle ever showing. */
    function mistTexture() {
        return canvasTex(256, function (g, s) {
            g.clearRect(0, 0, s, s);
            var n, x, y, r, grd;
            for (n = 0; n < 46; n++) {
                x = Math.random() * s; y = Math.random() * s;
                r = 22 + Math.random() * 62;
                grd = g.createRadialGradient(x, y, 0, x, y, r);
                grd.addColorStop(0, 'rgba(255,255,255,' + (0.10 + Math.random() * 0.14) + ')');
                grd.addColorStop(1, 'rgba(255,255,255,0)');
                g.fillStyle = grd;
                g.beginPath();
                g.arc(x, y, r, 0, 6.283);
                g.fill();
            }
            // Feather the sheet's own edges, or the plane reads as a plane.
            var edge = g.createRadialGradient(s / 2, s / 2, s * 0.22, s / 2, s / 2, s * 0.5);
            edge.addColorStop(0, 'rgba(0,0,0,0)');
            edge.addColorStop(1, 'rgba(0,0,0,1)');
            g.globalCompositeOperation = 'destination-out';
            g.fillStyle = edge;
            g.fillRect(0, 0, s, s);
        });
    }

    /* Rain, entirely on the GPU. Each drop is a two-vertex segment; the shader
       falls it, wraps it, slants it into the wind and stretches the tail along
       the direction it is going, which is what makes rain read as rain rather
       than as a hail of dots. The buffer is written once at build and never
       touched again — the only thing crossing the bus per frame is the clock. */
    var RAIN_VS = [
        'attribute float tip;',
        'attribute float seed;',
        'uniform float time; uniform vec3 box; uniform vec3 origin;',
        'uniform vec2 wind; uniform float len;',
        'varying float vFade;',
        'void main(){',
        '  float speed = 0.75 + seed * 0.55;',
        '  float ph = fract(position.y - time * speed);',   // 1 at the top
        '  float dropped = (1.0 - ph) * box.y;',
        '  vec3 p;',
        '  p.x = origin.x + position.x * box.x + wind.x * dropped * 0.26;',
        '  p.y = origin.y - dropped;',
        '  p.z = origin.z + position.z * box.z + wind.y * dropped * 0.26;',
        '  vec3 dir = normalize(vec3(wind.x * 0.26, -1.0, wind.y * 0.26));',
        '  p -= dir * (tip * len * (0.7 + seed * 0.6));',
        // Thin the far edges of the column out so it has no visible walls, and
        // fade the last of the fall so drops do not wink out at the ground.
        '  vFade = (1.0 - max(abs(position.x), abs(position.z))) * min(1.0, ph * 6.0);',
        '  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);',
        '}'
    ].join('\n');

    var RAIN_FS = [
        'uniform vec3 colour; uniform float alpha;',
        'varying float vFade;',
        'void main(){ gl_FragColor = vec4(colour, alpha * clamp(vFade, 0.0, 1.0)); }'
    ].join('\n');

    function buildRain(group, strength) {
        var n = Math.round(1100 + 1300 * strength);
        var pos = new Float32Array(n * 6);
        var tip = new Float32Array(n * 2);
        var seed = new Float32Array(n * 2);
        var i, x, y, z, s;
        for (i = 0; i < n; i++) {
            x = Math.random() * 2 - 1;
            z = Math.random() * 2 - 1;
            y = Math.random();
            s = Math.random();
            pos[i * 6] = x; pos[i * 6 + 1] = y; pos[i * 6 + 2] = z;
            pos[i * 6 + 3] = x; pos[i * 6 + 4] = y; pos[i * 6 + 5] = z;
            tip[i * 2] = 0; tip[i * 2 + 1] = 1;
            seed[i * 2] = s; seed[i * 2 + 1] = s;
        }
        var geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        geo.setAttribute('tip', new THREE.BufferAttribute(tip, 1));
        geo.setAttribute('seed', new THREE.BufferAttribute(seed, 1));

        var mat = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                box: { value: new THREE.Vector3(16, 16, 16) },
                origin: { value: new THREE.Vector3() },
                wind: { value: new THREE.Vector2() },
                len: { value: 0.34 + strength * 0.46 },
                colour: { value: new THREE.Color(0xd6e6f2) },
                alpha: { value: 0.24 + strength * 0.22 }
            },
            vertexShader: RAIN_VS,
            fragmentShader: RAIN_FS,
            transparent: true,
            depthWrite: false
        });

        var mesh = new THREE.LineSegments(geo, mat);
        mesh.frustumCulled = false;      // the shader moves it; the bounds lie
        mesh.renderOrder = 3;
        // What the rain looks like at full strength, kept so that thinning the
        // air for the overview (see setAtmosphere) has something to come back
        // to. The weather owns its own numbers; the camera only scales them.
        mesh.userData.baseAlpha = mat.uniforms.alpha.value;
        group.add(mesh);
        W.rain = mesh;
    }

    /* Whatever is hanging in the air: pollen over a summer green, grit over the
       quarry. Small, slow, and lit by nothing — they are meant to be noticed
       out of the corner of the eye and never looked at. */
    function buildMotes(group, spec, dot) {
        var n = spec.count;
        var geo = new THREE.BufferGeometry();
        var pos = new Float32Array(n * 3);
        geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        var mesh = new THREE.Points(geo, new THREE.PointsMaterial({
            size: spec.size, map: dot, color: spec.colour,
            transparent: true, opacity: spec.opacity, depthWrite: false,
            blending: THREE.AdditiveBlending, sizeAttenuation: true
        }));
        mesh.frustumCulled = false;
        mesh.userData.spec = spec;
        mesh.userData.seed = [];
        for (var i = 0; i < n; i++) {
            mesh.userData.seed.push({
                x: Math.random(), y: Math.random(), z: Math.random(),
                p: Math.random() * 6.283, w: 0.4 + Math.random() * 1.2
            });
        }
        group.add(mesh);
        W.motes = mesh;
    }

    /* Fog you can walk into: four sheets at ankle, knee and waist height,
       turning against each other so the pattern never settles. Cheaper than
       any volumetric anything and, at this camera height, indistinguishable
       from one. */
    function buildMist(group, hole, theme, strength) {
        var tex = mistTexture();
        var cx = (hole.bounds.minX + hole.bounds.maxX) / 2;
        var cz = (hole.bounds.minZ + hole.bounds.maxZ) / 2;
        var span = Math.max(hole.bounds.maxX - hole.bounds.minX,
            hole.bounds.maxZ - hole.bounds.minZ) + 26;
        for (var i = 0; i < 4; i++) {
            /* Subdivided and buckled, not flat. A dead-flat sheet crossing a
               raised green cuts it in a dead-straight line and the fog reads
               as a sheet of glass; a couple of sines through the vertices make
               that intersection a wandering edge, which is what fog against an
               object actually looks like. Cheap, and it is the difference
               between ground fog and a mistake. */
            var geo = new THREE.PlaneGeometry(span * (1 + i * 0.22), span * (1 + i * 0.22), 20, 20);
            var pa = geo.attributes.position;
            for (var v = 0; v < pa.count; v++) {
                pa.setZ(v, Math.sin(pa.getX(v) * 0.21 + i) * 0.55 +
                    Math.cos(pa.getY(v) * 0.16 - i * 2.1) * 0.42);
            }
            geo.computeVertexNormals();
            var m = new THREE.Mesh(
                geo,
                new THREE.MeshBasicMaterial({
                    map: tex,
                    transparent: true, depthWrite: false, fog: false,
                    opacity: strength * (0.22 - i * 0.035),
                    color: new THREE.Color(theme.fog)
                })
            );
            m.rotation.x = -Math.PI / 2;
            m.rotation.z = i * 1.3;
            m.position.set(cx, theme.surroundY + 0.5 + i * 0.55, cz);
            m.renderOrder = 2;
            m.userData.spin = (i % 2 ? 1 : -1) * (0.006 + i * 0.004);
            m.userData.baseOpacity = m.material.opacity;
            group.add(m);
            W.mist.push(m);
        }
    }

    /* Gulls, or whatever the course has. Two triangles apiece, hinged down the
       middle and flapped by moving four vertices — small enough that a flock is
       cheaper than one of the rails, and the thing that stops a clear sky
       reading as a painted ceiling. */
    function buildBirds(group, hole, count) {
        var cx = (hole.bounds.minX + hole.bounds.maxX) / 2;
        var cz = (hole.bounds.minZ + hole.bounds.maxZ) / 2;
        var mat = new THREE.MeshBasicMaterial({
            color: 0xf4f6f8, side: THREE.DoubleSide, fog: true,
            transparent: true, opacity: 0.85
        });
        for (var i = 0; i < count; i++) {
            var geo = new THREE.BufferGeometry();
            geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(18), 3));
            var b = new THREE.Mesh(geo, mat);
            b.frustumCulled = false;
            b.userData = {
                r: 26 + Math.random() * 30,
                a: Math.random() * 6.283,
                speed: (0.035 + Math.random() * 0.03) * (Math.random() < 0.5 ? -1 : 1),
                y: 13 + Math.random() * 15,
                flap: 5 + Math.random() * 4,
                phase: Math.random() * 6.283,
                span: 0.55 + Math.random() * 0.4,
                cx: cx, cz: cz
            };
            group.add(b);
            W.birds.push(b);
        }
    }

    function flapBird(b, t) {
        var d = b.userData;
        d.a += d.speed * 0.016 * 60 * 0.016;
        var beat = Math.sin(t * d.flap + d.phase);
        var s = d.span, lift = beat * s * 0.55;
        var a = b.geometry.attributes.position.array;
        // Body at the origin, a wingtip either side, drawn as two triangles
        // meeting at the tail — a V that leans as it beats.
        var pts = [
            0, 0, -s * 0.5, -s, lift, s * 0.4, 0, 0, s * 0.25,
            0, 0, -s * 0.5, 0, 0, s * 0.25, s, lift, s * 0.4
        ];
        for (var i = 0; i < 18; i++) a[i] = pts[i];
        b.geometry.attributes.position.needsUpdate = true;
        b.position.set(d.cx + Math.sin(d.a) * d.r, d.y + Math.sin(t * 0.4 + d.phase) * 0.7,
            d.cz + Math.cos(d.a) * d.r);
        b.rotation.y = -d.a + (d.speed > 0 ? Math.PI / 2 : -Math.PI / 2);
        b.rotation.z = beat * 0.12;
    }

    /* ── build and update ───────────────────────────────────────────────── */

    /* Everything goes into one group, which the renderer parents to the hole —
       so a new hole disposes the old weather along with the old course and
       nothing has to remember to tidy up. */
    function build(hole, theme, kind) {
        W.now = kind || W.now;
        for (var t = 0; t < W.tex.length; t++) W.tex[t].dispose();
        W.tex = [];
        W.rain = null; W.motes = null; W.mist = []; W.birds = [];
        W.clock = 0;
        W.dirBase = (hash(hole.name || 'hole') % 628) / 100;

        var g = new THREE.Group();
        var k = W.now;

        if (k.rain) buildRain(g, k.rain);
        if (k.haze) buildMist(g, hole, theme, k.haze);
        if (k.motes && MOTES[k.motes]) buildMotes(g, MOTES[k.motes], softDot());
        // Birds want a sky to be seen against and daylight to be seen in.
        if (k.cloud < 0.8 && !k.rain && theme.birds !== false) buildBirds(g, hole, 5);

        W.group = g;
        return g;
    }

    function update(dt, camera) {
        W.clock += dt;
        var w = stepWind(dt);
        var t = W.clock;

        // The clouds ride the wind, a good deal faster than anything on the
        // ground, because they are a long way up and moving quickly is what
        // makes them look it.
        W.cloudOff.x += w.x * dt * 0.006;
        W.cloudOff.y += w.z * dt * 0.006;

        if (W.rain) {
            var u = W.rain.material.uniforms;
            u.alpha.value = W.rain.userData.baseAlpha * W.atmos;
            u.time.value = t * 0.55;
            u.wind.value.set(w.x, w.z);
            u.origin.value.set(camera.position.x, camera.position.y + 9, camera.position.z);
        }

        if (W.motes) {
            var spec = W.motes.userData.spec;
            var seeds = W.motes.userData.seed;
            var arr = W.motes.geometry.attributes.position.array;
            var bx = 13, by = 5.5, bz = 13;
            var ox = camera.position.x, oy = camera.position.y - 2.4, oz = camera.position.z;
            for (var i = 0; i < seeds.length; i++) {
                var s = seeds[i];
                // Drift with the wind, wrap in a box that follows the camera,
                // and bob on a sine of the mote's own.
                var fx = (s.x + (w.x * t * 0.012) + Math.sin(t * 0.21 * s.w + s.p) * 0.01) % 1;
                var fz = (s.z + (w.z * t * 0.012) + Math.cos(t * 0.17 * s.w + s.p) * 0.01) % 1;
                var fy = (s.y + t * spec.rise * 0.02 * s.w) % 1;
                arr[i * 3] = ox + ((fx + 1) % 1 - 0.5) * bx;
                arr[i * 3 + 1] = oy + ((fy + 1) % 1) * by + Math.sin(t * s.w + s.p) * 0.12;
                arr[i * 3 + 2] = oz + ((fz + 1) % 1 - 0.5) * bz;
            }
            W.motes.geometry.attributes.position.needsUpdate = true;
        }

        for (var m = 0; m < W.mist.length; m++) {
            var sheet = W.mist[m];
            sheet.material.opacity = sheet.userData.baseOpacity * W.atmos;
            sheet.visible = sheet.material.opacity > 0.004;
            sheet.rotation.z += sheet.userData.spin * dt;
            sheet.position.x += w.x * dt * 0.05;
            sheet.position.z += w.z * dt * 0.05;
        }

        for (var b = 0; b < W.birds.length; b++) flapBird(W.birds[b], t);
    }

    G3.weather = {
        KINDS: KINDS,
        listFor: listFor,
        pick: pick,
        build: build,
        update: update,
        cycle: cycle,
        setOverride: setOverride,
        windSpeedKph: windSpeedKph,

        /* Thin the air out. The overview is a map, and a map you cannot read
           is not worth the keystroke: on a misty hole the rain, the mist banks
           and the fog between the camera and the ground turned the whole thing
           into a grey rectangle. The renderer eases this down as the camera
           lifts and back up as it drops, and the weather on the ground is
           exactly as it was — this scales what is drawn, not what the hole is
           playing in. */
        setAtmosphere: function (scale) {
            W.atmos = Math.max(0, Math.min(1, scale));
        },
        get atmosphere() { return W.atmos; },
        get now() { return W.now; },
        get override() { return W.override; },
        get wind() { return W.wind; },
        get cloudOffset() { return W.cloudOff; },
        state: W
    };

})(window.G3);
