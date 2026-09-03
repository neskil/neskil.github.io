/* Scene 7 — the commit helix.
 *
 * Every commit in this repository, oldest at the bottom, strung on a spiral
 * that climbs through time. Height is the date, so a week of hard work is a
 * dense band and a quiet fortnight is a gap you can see. Node size is how many
 * lines moved. Hover one to read what it was.
 *
 * On the colour: seven project folders show up in the history and seven
 * simultaneous hues do not survive a colour-blind check, so they are bucketed
 * into the three that do — and the buckets are honest about what the history
 * actually is. A hundred and fifty of two hundred and eleven commits are golf.
 */
(function () {
    'use strict';

    var THREE = window.THREE;

    /* area (from the data) -> bucket. The three bucket colours are the same
     * validated trio the globe and the flocks use. */
    var BUCKET = {
        'golf':          'golf',
        'golf3d':        'golf',
        'site':          'site',
        'cargo-lander':  'rest',
        'supply-chain':  'rest',
        '3d-engine':     'rest',
        'viz-poc':       'rest',
        'other':         'rest'
    };
    var BUCKETS = [
        { id: 'golf', label: 'Golf', color: 0x3987e5 },
        { id: 'site', label: 'The site itself', color: 0xd95926 },
        { id: 'rest', label: 'Everything else', color: 0x199e70 }
    ];

    /* Readable names for the readout, which can afford to be specific in a
     * way a colour cannot. */
    var AREA_NAME = {
        'golf': 'Pocket Links', 'golf3d': 'Loft Links', 'site': 'The site itself',
        'cargo-lander': 'Cargo Lander', 'supply-chain': 'Supply Chain',
        '3d-engine': 'Yard Master', 'viz-poc': 'Data Room', 'other': 'Odds and ends'
    };

    var HEIGHT = 36;             /* top to bottom of the whole history */
    var RADIUS = 8.5;
    var TURN = 0.32;             /* radians between consecutive commits */

    var scene, camera, orbit, nodes, nodeGeo, thread, renderer;
    var legendEl = null;
    var items = [], hovered = null, pinned = null;
    var down = { x: 0, y: 0 };
    var vw = 1, vh = 1;
    var _v = new THREE.Vector3();

    function bucketOf(area) { return BUCKET[area] || 'rest'; }
    function bucketColor(area) {
        var id = bucketOf(area);
        for (var i = 0; i < BUCKETS.length; i++) if (BUCKETS[i].id === id) return BUCKETS[i].color;
        return 0x199e70;
    }

    /* ---------- layout ---------- */

    function build() {
        var data = window.VizCommits;
        var list = data.commits;

        var t0 = Date.parse(list[0].date);
        var t1 = Date.parse(list[list.length - 1].date);
        var span = Math.max(1, t1 - t0);

        var pos = [], col = [], siz = [], glow = [];
        var thread_pos = [], thread_col = [];
        var c = new THREE.Color();

        for (var i = 0; i < list.length; i++) {
            var cm = list[i];
            /* Height is mostly the date — spacing commits evenly would throw
             * away the only thing a timeline is for, since a burst of work and
             * a quiet fortnight would look identical. But dates here have
             * day resolution and the busy weeks ran ten commits a day, so on
             * date alone a day is a flat ring of ten points at one height and
             * the thread saws back and forth across it. A quarter of the
             * height comes from commit order instead, which gives every
             * commit its own step while leaving the bursts and the gaps
             * plainly visible. */
            var f = 0.75 * ((Date.parse(cm.date) - t0) / span) + 0.25 * (i / (list.length - 1));
            var a = i * TURN;
            var y = f * HEIGHT - HEIGHT / 2;

            var v = new THREE.Vector3(Math.cos(a) * RADIUS, y, Math.sin(a) * RADIUS);
            c.setHex(bucketColor(cm.area));

            /* Fourth root, not square root: one commit in this history moved
             * ninety-six thousand lines and the next moved nine. On any
             * gentler curve it is a moon with a ring of dust around it. */
            var size = 3.2 + Math.pow(cm.lines / data.maxLines, 0.25) * 13;

            items.push({ commit: cm, vec: v, size: size });
            pos.push(v.x, v.y, v.z);
            col.push(c.r, c.g, c.b);
            siz.push(size);
            glow.push(0);

            thread_pos.push(v.x, v.y, v.z);
            thread_col.push(c.r * 0.55, c.g * 0.55, c.b * 0.55);
        }

        nodeGeo = new THREE.BufferGeometry();
        nodeGeo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
        nodeGeo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
        nodeGeo.setAttribute('aSize', new THREE.Float32BufferAttribute(siz, 1));
        nodeGeo.setAttribute('aGlow', new THREE.Float32BufferAttribute(glow, 1));

        nodes = new THREE.Points(nodeGeo, new THREE.ShaderMaterial({
            uniforms: { uScale: { value: 1 } },
            vertexShader: [
                'attribute float aSize; attribute float aGlow;',
                'varying vec3 vColor; varying float vGlow;',
                'uniform float uScale;',
                'void main() {',
                '  vColor = color; vGlow = aGlow;',
                '  vec4 mv = modelViewMatrix * vec4(position, 1.0);',
                '  gl_PointSize = (aSize + max(aGlow, 0.0) * 7.0) * uScale / -mv.z;',
                '  gl_Position = projectionMatrix * mv;',
                '}'
            ].join('\n'),
            fragmentShader: [
                'varying vec3 vColor; varying float vGlow;',
                'void main() {',
                '  float d = length(gl_PointCoord - vec2(0.5));',
                '  if (d > 0.5) discard;',
                '  float core = smoothstep(0.34, 0.06, d);',
                '  float halo = smoothstep(0.5, 0.14, d) * (0.32 + max(vGlow, 0.0) * 0.68);',
                '  float b = mix(0.42, 1.0, step(0.0, vGlow));',
                '  gl_FragColor = vec4(vColor * b, clamp(core + halo, 0.0, 1.0) * b);',
                '}'
            ].join('\n'),
            vertexColors: true,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        }));

        /* The thread through them, in commit order — it is what makes the
         * spiral read as one history rather than a cloud of dots. */
        var tg = new THREE.BufferGeometry();
        tg.setAttribute('position', new THREE.Float32BufferAttribute(thread_pos, 3));
        tg.setAttribute('color', new THREE.Float32BufferAttribute(thread_col, 3));
        thread = new THREE.Line(tg, new THREE.LineBasicMaterial({
            vertexColors: true, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending
        }));

        var group = new THREE.Group();
        group.add(thread);
        group.add(nodes);
        group.add(buildMonths(list, t0, span));
        return group;
    }

    /* A tick and a label where each month starts, so the height axis means
     * something you can name rather than just "earlier" and "later". */
    function buildMonths(list, t0, span) {
        var g = new THREE.Group();
        var seen = {};
        for (var i = 0; i < list.length; i++) {
            var key = list[i].date.slice(0, 7);
            if (seen[key]) continue;
            seen[key] = true;

            var f = (Date.parse(list[i].date) - t0) / span;
            var y = f * HEIGHT - HEIGHT / 2;

            var d = new Date(list[i].date + 'T00:00:00Z');
            var label = d.toLocaleString('en', { month: 'long', timeZone: 'UTC' }) +
                        ' ' + d.getUTCFullYear();
            var sp = makeLabel(label);
            sp.position.set(-RADIUS - 4.6, y, 0);
            g.add(sp);

            var ring = new THREE.Line(
                ringGeometry(RADIUS * 1.12, 64, y),
                new THREE.LineBasicMaterial({ color: 0x2a4a6b, transparent: true, opacity: 0.22 })
            );
            g.add(ring);
        }
        return g;
    }

    function ringGeometry(r, seg, y) {
        var pts = [];
        for (var i = 0; i <= seg; i++) {
            var a = (i / seg) * Math.PI * 2;
            pts.push(Math.cos(a) * r, y, Math.sin(a) * r);
        }
        var g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
        return g;
    }

    function makeLabel(text) {
        var pad = 9, fs = 26;
        var c = document.createElement('canvas');
        var g = c.getContext('2d');
        g.font = '600 ' + fs + 'px Outfit, system-ui, sans-serif';
        c.width = Math.ceil(g.measureText(text).width) + pad * 2;
        c.height = fs + pad * 2;

        g = c.getContext('2d');
        g.font = '600 ' + fs + 'px Outfit, system-ui, sans-serif';
        g.textBaseline = 'middle';
        g.fillStyle = 'rgba(148, 178, 214, 0.85)';
        g.fillText(text, pad, c.height / 2 + 1);

        var tex = new THREE.CanvasTexture(c);
        tex.minFilter = THREE.LinearFilter;
        var sp = new THREE.Sprite(new THREE.SpriteMaterial({
            map: tex, transparent: true, depthTest: false, depthWrite: false, opacity: 0.8
        }));
        sp.scale.set(c.width / c.height * 1.5, 1.5, 1);
        return sp;
    }

    /* ---------- interaction ---------- */

    function setHighlight() {
        var focus = pinned || hovered;
        var g = nodeGeo.attributes.aGlow.array;
        for (var i = 0; i < items.length; i++) {
            g[i] = focus ? (items[i] === focus ? 1 : -1) : 0;
        }
        nodeGeo.attributes.aGlow.needsUpdate = true;
    }

    function pick(px, py) {
        var best = null, bestD = 24;
        for (var i = 0; i < items.length; i++) {
            _v.copy(items[i].vec).project(camera);
            if (_v.z > 1) continue;
            var sx = (_v.x * 0.5 + 0.5) * vw;
            var sy = (-_v.y * 0.5 + 0.5) * vh;
            var d = Math.hypot(sx - px, sy - py);
            if (d < bestD) { bestD = d; best = items[i]; }
        }
        return best;
    }

    function describe(item) {
        var cm = item.commit;
        VizApp.readout.show(cm.date, [
            ['Project', AREA_NAME[cm.area] || cm.area],
            ['Files', String(cm.files)],
            ['Lines moved', cm.lines.toLocaleString()],
            ['Commit', String(cm.index + 1) + ' of ' + window.VizCommits.commits.length]
        ]);
        /* The subject line is the point of hovering a commit, and it is far
         * too long for the two-column rows above. */
        var el = document.getElementById('readout');
        if (el) {
            var p = document.createElement('div');
            p.className = 'readout-note';
            p.textContent = cm.subject;
            el.appendChild(p);
        }
    }

    function buildLegend() {
        var el = document.createElement('div');
        el.className = 'legend glass';
        var html = '<div class="legend-head">Commits by</div>';
        for (var i = 0; i < BUCKETS.length; i++) {
            html += '<div class="legend-row"><span class="legend-chip" style="background:#' +
                    BUCKETS[i].color.toString(16).padStart(6, '0') + '"></span>' +
                    BUCKETS[i].label + '</div>';
        }
        el.innerHTML = html;
        document.body.appendChild(el);
        return el;
    }

    VizApp.register({
        id: 'commits',
        label: 'Commit helix',
        title: 'Everything, in order',
        blurb: 'Every commit in this repository, oldest at the bottom. Height ' +
               'is the date, so a hard week is a dense band and a quiet ' +
               'fortnight is a gap. Size is how many lines moved.',
        hint: 'Drag to orbit · hover a commit to read it',
        accent: '#38bdf8',

        init: function (ctx) {
            renderer = ctx.renderer;
            scene = new THREE.Scene();
            scene.fog = new THREE.Fog(0x070b16, 34, 90);
            camera = new THREE.PerspectiveCamera(42, ctx.width / ctx.height, 0.3, 200);

            items = [];
            scene.add(build());

            orbit = VizApp.makeOrbit(camera, ctx.canvas, {
                radius: 34, minRadius: 12, maxRadius: 90,
                theta: 0.4, phi: 82 * Math.PI / 180,
                minPhi: 20 * Math.PI / 180, maxPhi: 160 * Math.PI / 180,
                spin: ctx.reducedMotion ? 0 : 0.06
            });

            legendEl = buildLegend();
            vw = ctx.width; vh = ctx.height;
            this.resize(ctx.width, ctx.height);
            return { scene: scene, camera: camera };
        },

        update: function (dt) { orbit.update(dt); },

        resize: function (w, h) {
            vw = w; vh = h;
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
            if (orbit) {
                var need = VizApp.fitDistance(camera, HEIGHT * 0.62);
                if (orbit.tRadius < need) { orbit.tRadius = need; orbit.radius = need; }
            }
            /* The constant is per-scene: it converts world size to pixels at
             * the distance this camera actually sits, and this camera sits
             * eight times further out than the globe's. */
            var dpr = renderer ? renderer.getPixelRatio() : 1;
            nodes.material.uniforms.uScale.value =
                h / (2 * Math.tan(camera.fov * Math.PI / 360)) * 0.068 * dpr;
        },

        onPointerMove: function (p) {
            if (orbit.dragging) return;
            var hit = pick(p.px, p.py);
            if (hit === hovered) return;
            hovered = hit;
            setHighlight();
            if (pinned) return;
            if (hovered) describe(hovered); else VizApp.readout.hide();
            document.body.style.cursor = hovered ? 'pointer' : '';
        },

        onPointerDown: function (p) { down.x = p.px; down.y = p.py; },

        onPointerUp: function (p) {
            if (Math.hypot(p.px - down.x, p.py - down.y) > 6) return;
            var hit = pick(p.px, p.py);
            if (!hit || hit === pinned) {
                pinned = null;
                VizApp.readout.hide();
            } else {
                pinned = hit;
                describe(hit);
            }
            setHighlight();
        },

        onPointerLeave: function () {
            if (hovered && !pinned) {
                hovered = null;
                setHighlight();
                VizApp.readout.hide();
            }
            document.body.style.cursor = '';
        },

        dispose: function () {
            if (orbit) orbit.dispose();
            if (legendEl && legendEl.parentNode) legendEl.parentNode.removeChild(legendEl);
            legendEl = null;
            document.body.style.cursor = '';
            items = []; hovered = null; pinned = null; renderer = null;
        }
    });
})();
