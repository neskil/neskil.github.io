/* Scene 1 — trade flows.
 *
 * A dot-matrix globe with the world's fifty largest container ports on it and
 * the lanes between them. Hover a port to isolate its lanes; click one and the
 * globe turns to face it.
 *
 * On the colour: arcs are NOT coloured one-per-corridor. Eleven simultaneous
 * hues cannot be told apart by a colour-blind reader — checked, not guessed,
 * with the palette validator, which passes only three categorical slots when
 * every pair can appear side by side, as they do here. So the three trunk
 * corridors get the three validated hues and everything else is one neutral
 * "other lanes" grey. That is also the truer picture: those three routes are
 * the ones that move the containers.
 */
(function () {
    'use strict';

    var THREE = window.THREE;
    var R = 1;                       /* globe radius; everything scales off it */
    var DEG = Math.PI / 180;

    /* Validated against the page's own surface (#070b16), all-pairs, dark
     * mode: worst CVD deltaE 9.4, worst normal-vision deltaE 20.9, all above
     * 3:1 contrast. Do not add a fourth hue without re-running the check. */
    var TRUNK = {
        'Trans-Pacific': 0x3987e5,
        'Asia-Europe':   0xd95926,
        'Intra-Asia':    0x199e70
    };
    var OTHER_COLOR = 0x7c8aa5;
    var OTHER_LABEL = 'Other lanes';

    var scene, camera, orbit, group;
    var dots, ports, portGeo, arcs, arcGeo, pulses, pulseGeo, atmosphere;

    var renderer = null;
    var graticule = null;
    var spinRate = 0.055, laneGain = 1, pulseGain = 1, trunkOnly = false;
    var portList = [], laneList = [];
    var laneSamples = [];            /* per lane: Float32Array of sampled points */
    var laneRange = [];              /* per lane: [firstVertex, vertexCount] in arcGeo */
    var pulseList = [];
    var hovered = null, pinned = null;
    var down = { x: 0, y: 0 };
    var vw = 1, vh = 1;

    /* ---------- geometry helpers ---------- */

    /* lon 0 / lat 0 sits on +Z, so the camera's default heading looks at
     * Greenwich and a port's (lat, lon) converts to orbit angles with no
     * arithmetic: theta = lon, phi = 90 - lat. */
    function toVec(lat, lon, r, out) {
        var la = lat * DEG, lo = lon * DEG, c = Math.cos(la);
        out = out || new THREE.Vector3();
        return out.set(r * c * Math.sin(lo), r * Math.sin(la), r * c * Math.cos(lo));
    }

    /* Deterministic per-index noise, so the dot field is identical on every
     * load and a preview screenshot can be reshot to match. */
    function hash(n) {
        var x = Math.sin(n * 127.1) * 43758.5453;
        return x - Math.floor(x);
    }

    /* ---------- the dotted Earth ---------- */

    function buildDots() {
        /* Fibonacci sphere: even coverage without the pole crowding a
         * lat/lon grid gives you. Samples are tested against the land mask and
         * the sea ones thrown away. */
        var SAMPLES = 20000;
        var golden = Math.PI * (3 - Math.sqrt(5));
        var pos = [], col = [], siz = [];
        var land = window.VizLand;
        var cLand = new THREE.Color(0x2f7099);
        var cCoast = new THREE.Color(0x86d6ff);

        for (var i = 0; i < SAMPLES; i++) {
            var y = 1 - (i / (SAMPLES - 1)) * 2;
            var rad = Math.sqrt(Math.max(0, 1 - y * y));
            var th = golden * i;
            var x = Math.cos(th) * rad, z = Math.sin(th) * rad;

            var lat = Math.asin(y) / DEG;
            var lon = Math.atan2(x, z) / DEG;
            /* Jitter the lookup, not the dot: the mask is a 3-degree grid and
             * a straight test prints its rows as visible stripes. Sampling a
             * little off-centre breaks the grid up and softens the coasts
             * without moving any dot off the sphere. */
            var jlat = lat + (hash(i) - 0.5) * 2.4;
            var jlon = lon + (hash(i + 7919) - 0.5) * 2.4;
            if (!land.isLand(jlat, jlon)) continue;

            var coast = land.isCoast(jlat, jlon);
            var c = coast ? cCoast : cLand;
            pos.push(x * R, y * R, z * R);
            col.push(c.r, c.g, c.b);
            siz.push(coast ? 2.5 : 1.85);
        }

        var g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
        g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
        g.setAttribute('aSize', new THREE.Float32BufferAttribute(siz, 1));

        dots = new THREE.Points(g, new THREE.ShaderMaterial({
            uniforms: { uScale: { value: 1 } },
            vertexShader: [
                'attribute float aSize;',
                'varying vec3 vColor;',
                'uniform float uScale;',
                'void main() {',
                '  vColor = color;',
                '  vec4 mv = modelViewMatrix * vec4(position, 1.0);',
                '  gl_PointSize = aSize * uScale / -mv.z;',
                '  gl_Position = projectionMatrix * mv;',
                '}'
            ].join('\n'),
            fragmentShader: [
                'varying vec3 vColor;',
                'void main() {',
                '  float d = length(gl_PointCoord - vec2(0.5));',
                '  if (d > 0.5) discard;',
                '  gl_FragColor = vec4(vColor, smoothstep(0.5, 0.22, d));',
                '}'
            ].join('\n'),
            vertexColors: true,
            transparent: true,
            depthWrite: false
        }));
        return dots;
    }

    /* An opaque ball just inside the dots. It is what hides the far side of
     * everything — dots, ports and arcs all depth-test against it, so nothing
     * needs sorting or a manual back-face cull. */
    function buildShell() {
        return new THREE.Mesh(
            new THREE.SphereGeometry(R * 0.992, 64, 48),
            new THREE.MeshBasicMaterial({ color: 0x050b16 })
        );
    }

    function buildGraticule() {
        var pts = [], i, j, a, b;
        for (i = -150; i <= 180; i += 30) {          /* meridians */
            for (j = -90; j < 90; j += 3) {
                a = toVec(j, i, R * 1.001); b = toVec(j + 3, i, R * 1.001);
                pts.push(a.x, a.y, a.z, b.x, b.y, b.z);
            }
        }
        for (i = -60; i <= 60; i += 30) {            /* parallels */
            for (j = -180; j < 180; j += 3) {
                a = toVec(i, j, R * 1.001); b = toVec(i, j + 3, R * 1.001);
                pts.push(a.x, a.y, a.z, b.x, b.y, b.z);
            }
        }
        var g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
        return new THREE.LineSegments(g, new THREE.LineBasicMaterial({
            color: 0x1c3a5c, transparent: true, opacity: 0.16
        }));
    }

    /* A shell of atmosphere, drawn from the inside so the rim lights up where
     * the surface turns away from the camera. */
    function buildAtmosphere() {
        return new THREE.Mesh(
            new THREE.SphereGeometry(R * 1.10, 48, 36),
            new THREE.ShaderMaterial({
                vertexShader: [
                    'varying vec3 vN; varying vec3 vP;',
                    'void main() {',
                    '  vN = normalize(normalMatrix * normal);',
                    '  vec4 mv = modelViewMatrix * vec4(position, 1.0);',
                    '  vP = mv.xyz;',
                    '  gl_Position = projectionMatrix * mv;',
                    '}'
                ].join('\n'),
                fragmentShader: [
                    'varying vec3 vN; varying vec3 vP;',
                    /* Only the ring between the planet\'s silhouette and this
                     * shell\'s own is ever visible — the rest is depth-tested
                     * away by the globe. Across that ring the usual
                     * "0.7 - dot" fresnel barely varies and clamps flat,
                     * which paints a hard band. So the term is stretched over
                     * the range the ring actually occupies: brightest hugging
                     * the surface, gone by the outer edge. */
                    'void main() {',
                    '  float f = clamp(-dot(normalize(vN), normalize(-vP)), 0.0, 1.0);',
                    '  float rim = pow(smoothstep(0.0, 0.40, f), 1.35);',
                    '  gl_FragColor = vec4(vec3(0.17, 0.44, 0.88) * rim, rim * 0.75);',
                    '}'
                ].join('\n'),
                side: THREE.BackSide,
                blending: THREE.AdditiveBlending,
                transparent: true,
                depthWrite: false
            })
        );
    }

    function buildStars() {
        var N = 1600, pos = [], col = [];
        for (var i = 0; i < N; i++) {
            var v = new THREE.Vector3(
                Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1
            );
            if (v.lengthSq() < 0.02) { i--; continue; }
            v.normalize().multiplyScalar(28 + Math.random() * 22);
            pos.push(v.x, v.y, v.z);
            var w = 0.55 + Math.random() * 0.45;
            col.push(w, w, w * (0.9 + Math.random() * 0.12));
        }
        var g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
        g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
        return new THREE.Points(g, new THREE.PointsMaterial({
            size: 1.35, sizeAttenuation: false, vertexColors: true,
            transparent: true, opacity: 0.75, depthWrite: false
        }));
    }

    /* ---------- ports ---------- */

    function buildPorts() {
        var data = window.VizPorts.ports;
        var pos = [], col = [], siz = [], glow = [];
        var base = new THREE.Color(0xf1f5f9);

        for (var i = 0; i < data.length; i++) {
            var p = data[i];
            var v = toVec(p.lat, p.lon, R * 1.008);
            p.vec = v;
            p.idx = i;
            portList.push(p);
            pos.push(v.x, v.y, v.z);
            col.push(base.r, base.g, base.b);
            /* Square root, not linear: Shanghai moves fifty times what
             * Auckland does, and a dot fifty times the area is a blob. */
            siz.push(3.0 + Math.sqrt(p.teu) * 2.4);
            glow.push(0);
        }

        portGeo = new THREE.BufferGeometry();
        portGeo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
        portGeo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
        portGeo.setAttribute('aSize', new THREE.Float32BufferAttribute(siz, 1));
        portGeo.setAttribute('aGlow', new THREE.Float32BufferAttribute(glow, 1));

        ports = new THREE.Points(portGeo, new THREE.ShaderMaterial({
            uniforms: { uScale: { value: 1 }, uTime: { value: 0 } },
            vertexShader: [
                'attribute float aSize; attribute float aGlow;',
                'varying vec3 vColor; varying float vGlow;',
                'uniform float uScale;',
                'void main() {',
                '  vColor = color; vGlow = aGlow;',
                '  vec4 mv = modelViewMatrix * vec4(position, 1.0);',
                '  gl_PointSize = (aSize + max(aGlow, 0.0) * 5.0) * uScale / -mv.z;',
                '  gl_Position = projectionMatrix * mv;',
                '}'
            ].join('\n'),
            fragmentShader: [
                'varying vec3 vColor; varying float vGlow;',
                'void main() {',
                '  float d = length(gl_PointCoord - vec2(0.5));',
                '  if (d > 0.5) discard;',
                '  float core = smoothstep(0.30, 0.05, d);',
                '  float halo = smoothstep(0.5, 0.12, d) * (0.30 + max(vGlow, 0.0) * 0.7);',
                /* aGlow below zero means "something else is selected": the port
                 * stays on the map but stops competing with the one that is. */
                '  float b = mix(0.28, 1.0, step(0.0, vGlow));',
                '  gl_FragColor = vec4(vColor * b, clamp(core + halo, 0.0, 1.0) * b);',
                '}'
            ].join('\n'),
            vertexColors: true,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        }));
        return ports;
    }

    /* ---------- lanes ---------- */

    function laneColor(corridor) {
        return TRUNK[corridor] != null ? TRUNK[corridor] : OTHER_COLOR;
    }

    function isTrunk(corridor) { return TRUNK[corridor] != null; }

    /* A great circle, lifted. Slerp gives the shortest path over the surface;
     * a sine bump lifts the middle so long lanes arch clear of the globe and
     * short ones stay close to it. */
    function sampleLane(a, b, n) {
        var va = toVec(a.lat, a.lon, 1), vb = toVec(b.lat, b.lon, 1);
        var ang = Math.acos(THREE.MathUtils.clamp(va.dot(vb), -1, 1));
        var lift = 0.06 + 0.30 * (ang / Math.PI);
        var out = new Float32Array(n * 3);
        var sinAng = Math.sin(ang);

        for (var i = 0; i < n; i++) {
            var t = i / (n - 1), x, y, z;
            if (sinAng < 1e-5) {                 /* co-located ports */
                x = va.x; y = va.y; z = va.z;
            } else {
                var s0 = Math.sin((1 - t) * ang) / sinAng;
                var s1 = Math.sin(t * ang) / sinAng;
                x = va.x * s0 + vb.x * s1;
                y = va.y * s0 + vb.y * s1;
                z = va.z * s0 + vb.z * s1;
            }
            var r = R * (1 + lift * Math.sin(Math.PI * t));
            var len = Math.sqrt(x * x + y * y + z * z) || 1;
            out[i * 3] = x / len * r;
            out[i * 3 + 1] = y / len * r;
            out[i * 3 + 2] = z / len * r;
        }
        return out;
    }

    function buildLanes() {
        var N = 48;
        var lanes = window.VizPorts.lanes;
        var pos = [], col = [], alpha = [];
        var c = new THREE.Color();
        var cursor = 0;

        for (var i = 0; i < lanes.length; i++) {
            var lane = lanes[i];
            laneList.push(lane);
            var s = sampleLane(lane.a, lane.b, N);
            laneSamples.push(s);
            c.setHex(laneColor(lane.corridor));

            /* Line strips as explicit segments: one geometry, one draw call,
             * and a per-vertex alpha we can rewrite on hover. */
            var start = cursor;
            for (var k = 0; k < N - 1; k++) {
                for (var e = 0; e < 2; e++) {
                    var idx = k + e;
                    var t = idx / (N - 1);
                    pos.push(s[idx * 3], s[idx * 3 + 1], s[idx * 3 + 2]);
                    col.push(c.r, c.g, c.b);
                    /* Fade both ends so an arc grows out of its port rather
                     * than butting into it. */
                    alpha.push(Math.pow(Math.sin(Math.PI * t), 0.6));
                    cursor++;
                }
            }
            laneRange.push([start, cursor - start]);
            lane.baseAlpha = isTrunk(lane.corridor) ? 0.85 : 0.42;
        }

        arcGeo = new THREE.BufferGeometry();
        arcGeo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
        arcGeo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
        arcGeo.setAttribute('aAlpha', new THREE.Float32BufferAttribute(alpha, 1));
        arcGeo.userData.profile = Float32Array.from(alpha);   /* the un-dimmed shape */

        arcs = new THREE.LineSegments(arcGeo, new THREE.ShaderMaterial({
            vertexShader: [
                'attribute float aAlpha;',
                'varying vec3 vColor; varying float vAlpha;',
                'void main() {',
                '  vColor = color; vAlpha = aAlpha;',
                '  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);',
                '}'
            ].join('\n'),
            fragmentShader: [
                'varying vec3 vColor; varying float vAlpha;',
                'void main() { gl_FragColor = vec4(vColor, vAlpha); }'
            ].join('\n'),
            vertexColors: true,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        }));

        return arcs;
    }

    /* ---------- cargo pulses ---------- */

    function buildPulses() {
        var pos = [], col = [], siz = [], alpha = [];
        var c = new THREE.Color();

        for (var i = 0; i < laneList.length; i++) {
            var lane = laneList[i];
            var n = Math.max(1, Math.min(3, Math.round(lane.weight / 3)));
            c.setHex(laneColor(lane.corridor));
            for (var k = 0; k < n; k++) {
                pulseList.push({
                    lane: i,
                    t: k / n + Math.random() * 0.05,
                    /* Heavier lanes run their boxes faster. It is a made-up
                     * mapping, but it is the one people read off the screen. */
                    speed: 0.028 + lane.weight * 0.0055
                });
                pos.push(0, 0, 0);
                col.push(c.r, c.g, c.b);
                siz.push(isTrunk(lane.corridor) ? 5.0 : 3.6);
                alpha.push(1);
            }
        }

        pulseGeo = new THREE.BufferGeometry();
        pulseGeo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
        pulseGeo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
        pulseGeo.setAttribute('aSize', new THREE.Float32BufferAttribute(siz, 1));
        pulseGeo.setAttribute('aAlpha', new THREE.Float32BufferAttribute(alpha, 1));

        pulses = new THREE.Points(pulseGeo, new THREE.ShaderMaterial({
            uniforms: { uScale: { value: 1 } },
            vertexShader: [
                'attribute float aSize; attribute float aAlpha;',
                'varying vec3 vColor; varying float vAlpha;',
                'uniform float uScale;',
                'void main() {',
                '  vColor = color; vAlpha = aAlpha;',
                '  vec4 mv = modelViewMatrix * vec4(position, 1.0);',
                '  gl_PointSize = aSize * uScale / -mv.z;',
                '  gl_Position = projectionMatrix * mv;',
                '}'
            ].join('\n'),
            fragmentShader: [
                'varying vec3 vColor; varying float vAlpha;',
                'void main() {',
                '  float d = length(gl_PointCoord - vec2(0.5));',
                '  if (d > 0.5) discard;',
                '  gl_FragColor = vec4(vColor, smoothstep(0.5, 0.0, d) * vAlpha);',
                '}'
            ].join('\n'),
            vertexColors: true,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        }));
        return pulses;
    }

    function movePulses(dt) {
        var arr = pulseGeo.attributes.position.array;
        var n = laneSamples.length ? laneSamples[0].length / 3 : 0;

        for (var i = 0; i < pulseList.length; i++) {
            var p = pulseList[i];
            p.t += p.speed * dt * pulseGain;
            if (p.t >= 1) p.t -= 1;

            var s = laneSamples[p.lane];
            var f = p.t * (n - 1);
            var i0 = Math.floor(f), i1 = Math.min(n - 1, i0 + 1), m = f - i0;
            arr[i * 3]     = s[i0 * 3]     + (s[i1 * 3]     - s[i0 * 3])     * m;
            arr[i * 3 + 1] = s[i0 * 3 + 1] + (s[i1 * 3 + 1] - s[i0 * 3 + 1]) * m;
            arr[i * 3 + 2] = s[i0 * 3 + 2] + (s[i1 * 3 + 2] - s[i0 * 3 + 2]) * m;
        }
        pulseGeo.attributes.position.needsUpdate = true;
    }

    /* ---------- highlight ---------- */

    /* One pass over every arc vertex and every pulse, run only when the
     * selection changes rather than per frame. */
    function applyLaneAlpha() {
        var focus = pinned || hovered;
        var lit = null;
        if (focus) {
            lit = {};
            for (var i = 0; i < focus.lanes.length; i++) lit[focus.lanes[i].index] = true;
        }

        var a = arcGeo.attributes.aAlpha.array;
        var profile = arcGeo.userData.profile;
        for (var l = 0; l < laneList.length; l++) {
            var lane = laneList[l];
            var allowed = !trunkOnly || isTrunk(lane.corridor);
            var on = (!lit || lit[l]) && allowed;
            var mul = (on ? lane.baseAlpha : 0.05) * (lit && on ? 1.9 : 1) * laneGain;
            var range = laneRange[l];
            for (var v = range[0]; v < range[0] + range[1]; v++) a[v] = profile[v] * mul;
        }
        arcGeo.attributes.aAlpha.needsUpdate = true;

        var pa = pulseGeo.attributes.aAlpha.array;
        for (var p = 0; p < pulseList.length; p++) {
            var pl = laneList[pulseList[p].lane];
            var shown = (!lit || lit[pulseList[p].lane]) && (!trunkOnly || isTrunk(pl.corridor));
            pa[p] = shown ? 1 : 0.06;
        }
        pulseGeo.attributes.aAlpha.needsUpdate = true;

        var pg = portGeo.attributes.aGlow.array;
        for (var q = 0; q < portList.length; q++) {
            pg[q] = focus ? (portList[q] === focus ? 1 : (neighbour(focus, portList[q]) ? 0.5 : -1)) : 0;
        }
        portGeo.attributes.aGlow.needsUpdate = true;
    }

    function neighbour(from, other) {
        for (var i = 0; i < from.lanes.length; i++) {
            var l = from.lanes[i];
            if (l.a === other || l.b === other) return true;
        }
        return false;
    }

    /* ---------- picking ---------- */

    /* Projecting fifty points to the screen beats a raycast here: Points
     * raycasting works in world units, so a threshold that catches Shanghai
     * from close up swallows half of Asia from far out. Pixels are what the
     * cursor actually works in. */
    var _v = new THREE.Vector3();
    function pick(px, py) {
        var best = null, bestD = 26;
        var camDir = camera.position.clone().normalize();

        for (var i = 0; i < portList.length; i++) {
            var p = portList[i];
            /* Far side of the globe: skip, or you pick ports through the
             * planet. 0.08 keeps the ones right on the limb reachable. */
            if (p.vec.clone().normalize().dot(camDir) < 0.08) continue;

            _v.copy(p.vec).project(camera);
            var sx = (_v.x * 0.5 + 0.5) * vw;
            var sy = (-_v.y * 0.5 + 0.5) * vh;
            var d = Math.hypot(sx - px, sy - py);
            if (d < bestD) { bestD = d; best = p; }
        }
        return best;
    }

    function describe(port) {
        var teu = 0, top = {}, bestName = '—', bestVal = -1;
        for (var i = 0; i < port.lanes.length; i++) {
            var l = port.lanes[i];
            teu += l.weight;
            top[l.corridor] = (top[l.corridor] || 0) + l.weight;
        }
        for (var k in top) if (top[k] > bestVal) { bestVal = top[k]; bestName = k; }

        VizApp.readout.show(port.name, [
            ['Country', port.country],
            ['Throughput', port.teu.toFixed(1) + 'M TEU/yr'],
            ['Lanes shown', String(port.lanes.length)],
            ['Main corridor', bestName]
        ]);
    }

    /* ---------- scene module ---------- */

    VizApp.register({
        id: 'globe',
        label: 'Trade flows',
        title: 'Where the boxes go',
        blurb: 'The fifty biggest container ports, and the lanes between them. ' +
               'Dot size is annual throughput; the three trunk corridors are ' +
               'coloured, everything else is a feeder.',
        hint: 'Drag to spin · hover a port for its lanes · click to face it',
        accent: '#38bdf8',

        /* Three colours mean nothing on their own, so this is not decoration:
         * it is the half of the encoding that is not colour. */
        legend: function () {
            var rows = [];
            for (var k in TRUNK) rows.push({ label: k, color: '#' + TRUNK[k].toString(16).padStart(6, '0') });
            rows.push({ label: OTHER_LABEL, color: '#' + OTHER_COLOR.toString(16).padStart(6, '0') });
            return rows;
        },

        controls: function () {
            return [
                { id: 'spin', type: 'slider', label: 'Spin', min: 0, max: 0.30, step: 0.005,
                  value: spinRate,
                  format: function (v) { return v === 0 ? 'still' : v.toFixed(2) + ' rad/s'; },
                  apply: function (v) { spinRate = v; if (orbit) orbit.spin = v; } },
                { id: 'lanes', type: 'slider', label: 'Lane brightness', min: 0.2, max: 2.5, step: 0.1,
                  value: laneGain,
                  format: function (v) { return v.toFixed(1) + '\u00d7'; },
                  apply: function (v) { laneGain = v; applyLaneAlpha(); } },
                { id: 'pulse', type: 'slider', label: 'Cargo speed', min: 0, max: 3, step: 0.1,
                  value: pulseGain,
                  format: function (v) { return v === 0 ? 'held' : v.toFixed(1) + '\u00d7'; },
                  apply: function (v) { pulseGain = v; } },
                { id: 'grat', type: 'toggle', label: 'Graticule',
                  value: true,
                  apply: function (v) { if (graticule) graticule.visible = v; } },
                { id: 'trunk', type: 'toggle', label: 'Trunk corridors only',
                  value: false,
                  apply: function (v) { trunkOnly = v; applyLaneAlpha(); } }
            ];
        },

        init: function (ctx) {
            renderer = ctx.renderer;
            scene = new THREE.Scene();
            camera = new THREE.PerspectiveCamera(38, ctx.width / ctx.height, 0.1, 200);
            group = new THREE.Group();

            group.add(buildShell());
            group.add(buildDots());
            graticule = buildGraticule();
            group.add(graticule);
            group.add(buildPorts());
            group.add(buildLanes());
            group.add(buildPulses());
            applyLaneAlpha();          /* needs arcs, pulses and ports to exist */
            atmosphere = buildAtmosphere();
            group.add(atmosphere);

            scene.add(group);
            scene.add(buildStars());

            orbit = VizApp.makeOrbit(camera, ctx.canvas, {
                radius: 3.95, minRadius: 1.8, maxRadius: 7.5,
                /* Open on the Asia-Europe run rather than the mid-Atlantic:
                 * it is where most of the arcs are. */
                theta: 75 * DEG, phi: 78 * DEG,
                spin: ctx.reducedMotion ? 0 : spinRate
            });

            vw = ctx.width; vh = ctx.height;
            this.resize(ctx.width, ctx.height);
            return { scene: scene, camera: camera };
        },

        update: function (dt, t) {
            orbit.update(dt);
            movePulses(dt);
            if (ports) ports.material.uniforms.uTime.value = t;
        },

        resize: function (w, h) {
            vw = w; vh = h;
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
            /* Point sizes are in pixels but gl_PointSize is not, so they are
             * scaled by the same factor the projection uses for height. Without
             * this a dot is a speck on a laptop and a saucer on a phone. */
            /* Back off far enough that the globe fits the narrow axis too.
             * Only ever pushes out, so a deliberate zoom survives a resize. */
            if (orbit) {
                var need = VizApp.fitDistance(camera, R * 1.16);
                if (orbit.tRadius < need) { orbit.tRadius = need; orbit.radius = need; }
            }

            /* gl_PointSize counts buffer pixels, and the buffer is the CSS
             * size times the renderer's pixel ratio. Without that factor a dot
             * sized in CSS pixels comes out half as big on a retina screen. */
            var dpr = renderer ? renderer.getPixelRatio() : 1;
            var scale = h / (2 * Math.tan(camera.fov * DEG / 2)) * 0.0040 * dpr;
            dots.material.uniforms.uScale.value = scale;
            ports.material.uniforms.uScale.value = scale;
            pulses.material.uniforms.uScale.value = scale;
        },

        onPointerMove: function (p) {
            if (orbit.dragging) return;
            var hit = pick(p.px, p.py);
            if (hit === hovered) return;
            hovered = hit;
            applyLaneAlpha();
            if (pinned) return;
            if (hovered) describe(hovered); else VizApp.readout.hide();
            document.body.style.cursor = hovered ? 'pointer' : '';
        },

        onPointerDown: function (p) {
            down.x = p.px; down.y = p.py;
        },

        onPointerUp: function (p) {
            /* Anything past a few pixels was a drag of the globe, not a click
             * on a port — otherwise every spin ends by selecting something. */
            if (Math.hypot(p.px - down.x, p.py - down.y) > 6) return;
            var hit = pick(p.px, p.py);
            if (!hit) {
                pinned = null;
                VizApp.readout.hide();
            } else if (hit === pinned) {
                pinned = null;
                describe(hit);
            } else {
                pinned = hit;
                describe(hit);
                orbit.focus(hit.lon * DEG, (90 - hit.lat) * DEG);
            }
            applyLaneAlpha();
        },

        onPointerLeave: function () {
            if (hovered && !pinned) {
                hovered = null;
                applyLaneAlpha();
                VizApp.readout.hide();
            }
            document.body.style.cursor = '';
        },

        dispose: function () {
            if (orbit) orbit.dispose();
            document.body.style.cursor = '';
            renderer = null;
            portList = []; laneList = []; laneSamples = []; laneRange = []; pulseList = [];
            hovered = null; pinned = null;
        }
    });
})();
