/* Scene 2 — the site as a city.
 *
 * One tower per project folder in this repo. Footprint is how many files it
 * has, height is how many lines of code, and how brightly its windows burn is
 * how recently it was touched. Orbit it; click a tower to be offered the way
 * in.
 *
 * The encoding is deliberately not "a colour per project": recency is a
 * magnitude, so it gets a single-hue ramp (bright is recent, dark is
 * dormant), and identity comes from a name floating over each roof rather
 * than from a hue nobody can map back to a legend.
 */
(function () {
    'use strict';

    var THREE = window.THREE;
    var DEG = Math.PI / 180;

    var CELL = 8.4;              /* spacing between plots */
    var LABEL_REST = 0.42;       /* name-plates stay quiet until pointed at */
    var scene, camera, orbit, ray, ndc;
    var towers = [], labels = [];
    var hovered = null, pinned = null;
    var down = { x: 0, y: 0 };
    var vw = 1, vh = 1;
    var legendEl = null;

    /* ---------- layout ---------- */

    /* A square spiral out from the origin, walked in size order, so the tall
     * buildings end up downtown and the small ones on the edge. A plain grid
     * puts a 30k-line tower next to an 800-line shed at random and the
     * skyline says nothing. */
    function spiral(n) {
        var x = 0, z = 0, dx = 0, dz = -1, out = [];
        for (var i = 0; i < n; i++) {
            out.push([x, z]);
            /* Turn left at each corner of the growing square. */
            if (x === z || (x < 0 && x === -z) || (x > 0 && x === 1 - z)) {
                var t = dx; dx = -dz; dz = t;
            }
            x += dx; z += dz;
        }
        return out;
    }

    /* ---------- the towers ---------- */

    function towerMaterial(block) {
        /* Recency on one hue: a project touched today burns bright, one left
         * alone for a month is nearly dark. Same hue throughout, so the ramp
         * reads as "more/less" rather than "different thing". */
        var recency = 1 - Math.min(1, block.ageDays / 30);
        var win = new THREE.Color().setHSL(0.57, 0.85, 0.30 + recency * 0.42);
        var body = new THREE.Color(0x0d1626);

        return new THREE.ShaderMaterial({
            uniforms: {
                uWindow: { value: win },
                uBody: { value: body },
                uLit: { value: 0.28 + recency * 0.46 },   /* share of windows on */
                uSeed: { value: Math.random() * 100 },
                uHover: { value: 0 },
                uDim: { value: 1 }
            },
            vertexShader: [
                'varying vec3 vPos; varying vec3 vNrm;',
                'void main() {',
                '  vPos = position; vNrm = normal;',
                '  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);',
                '}'
            ].join('\n'),
            fragmentShader: [
                'uniform vec3 uWindow; uniform vec3 uBody;',
                'uniform float uLit; uniform float uSeed; uniform float uHover; uniform float uDim;',
                'varying vec3 vPos; varying vec3 vNrm;',
                'float hash(vec2 p) {',
                '  return fract(sin(dot(p, vec2(127.1, 311.7)) + uSeed) * 43758.5453);',
                '}',
                'void main() {',
                '  vec3 n = abs(vNrm);',
                /* Geometry is built at real size, so local coordinates are
                 * world units and a window is the same size on every tower. */
                '  vec2 uv = n.x > 0.5 ? vPos.zy : vPos.xy;',
                '  vec3 col = uBody;',
                '  if (n.y < 0.5) {',
                '    vec2 cell = vec2(0.62, 0.78);',
                '    vec2 id = floor(uv / cell);',
                '    vec2 f = fract(uv / cell);',
                '    float pane = step(0.18, f.x) * step(f.x, 0.82) * step(0.22, f.y) * step(f.y, 0.80);',
                '    float on = step(1.0 - uLit, hash(id));',
                /* A little variation in brightness per window, or the face
                 * reads as a printed pattern rather than a building. */
                '    float v = 0.55 + 0.45 * hash(id + 3.7);',
                '    col = mix(uBody, uWindow * v, pane * on);',
                '  } else {',
                '    col = uBody * 1.5;',                  /* roofs catch the sky */
                '  }',
                '  col += uWindow * uHover * 0.22;',
                '  gl_FragColor = vec4(col * uDim, 1.0);',
                '}'
            ].join('\n')
        });
    }

    function buildCity(city) {
        var order = city.blocks.slice().sort(function (a, b) { return b.loc - a.loc; });
        var cells = spiral(order.length);
        var group = new THREE.Group();

        /* A spiral of fourteen does not end where it started, so the plots run
         * from -1 to 2 on both axes and the city sits off to one corner of the
         * thing the camera is aimed at. Recentre on the plots actually used. */
        var minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
        for (var c = 0; c < cells.length; c++) {
            minX = Math.min(minX, cells[c][0]); maxX = Math.max(maxX, cells[c][0]);
            minZ = Math.min(minZ, cells[c][1]); maxZ = Math.max(maxZ, cells[c][1]);
        }
        var offX = (minX + maxX) / 2, offZ = (minZ + maxZ) / 2;

        for (var i = 0; i < order.length; i++) {
            var b = order[i];
            /* Square root on the footprint and a gentler curve on height:
             * linear on either and Cargo Lander is a needle beside a row of
             * paving slabs. */
            var w = 1.6 + Math.sqrt(b.files) * 0.62;
            var h = 2.0 + Math.pow(b.loc / city.maxLoc, 0.72) * 19;
            var d = w * (0.78 + (b.commits % 5) * 0.07);

            var geo = new THREE.BoxGeometry(w, h, d);
            geo.translate(0, h / 2, 0);                 /* stand it on the ground */

            var mesh = new THREE.Mesh(geo, towerMaterial(b));
            mesh.position.set((cells[i][0] - offX) * CELL, 0, (cells[i][1] - offZ) * CELL);
            mesh.userData.block = b;
            mesh.userData.height = h;
            group.add(mesh);
            towers.push(mesh);

            var label = makeLabel(b.label);
            label.position.set(mesh.position.x, h + 1.4, mesh.position.z);
            group.add(label);
            labels.push(label);
        }
        return group;
    }

    /* ---------- labels ---------- */

    /* Canvas textures rather than a 3D font: no font file to vendor, the text
     * stays crisp because it is drawn at device scale, and a Sprite always
     * faces the camera so a name is readable from any angle. */
    function makeLabel(text) {
        var pad = 10, fs = 30;
        var c = document.createElement('canvas');
        var g = c.getContext('2d');
        g.font = '600 ' + fs + 'px Outfit, system-ui, sans-serif';
        var w = Math.ceil(g.measureText(text).width) + pad * 2;
        c.width = w; c.height = fs + pad * 2;

        g = c.getContext('2d');
        g.font = '600 ' + fs + 'px Outfit, system-ui, sans-serif';
        g.textBaseline = 'middle';
        g.fillStyle = 'rgba(8, 14, 26, 0.78)';
        roundRect(g, 0, 0, c.width, c.height, 10);
        g.fill();
        g.strokeStyle = 'rgba(120, 170, 220, 0.30)';
        g.lineWidth = 2;
        roundRect(g, 1, 1, c.width - 2, c.height - 2, 10);
        g.stroke();
        g.fillStyle = '#dbeafe';
        g.fillText(text, pad, c.height / 2 + 1);

        var tex = new THREE.CanvasTexture(c);
        tex.minFilter = THREE.LinearFilter;
        var sp = new THREE.Sprite(new THREE.SpriteMaterial({
            map: tex, transparent: true, depthTest: true, depthWrite: false,
            opacity: LABEL_REST
        }));
        sp.scale.set(c.width / c.height * 1.25, 1.25, 1);
        return sp;
    }

    function roundRect(g, x, y, w, h, r) {
        g.beginPath();
        g.moveTo(x + r, y);
        g.arcTo(x + w, y, x + w, y + h, r);
        g.arcTo(x + w, y + h, x, y + h, r);
        g.arcTo(x, y + h, x, y, r);
        g.arcTo(x, y, x + w, y, r);
        g.closePath();
    }

    /* ---------- ground ---------- */

    function buildGround() {
        var g = new THREE.PlaneGeometry(400, 400);
        g.rotateX(-Math.PI / 2);
        return new THREE.Mesh(g, new THREE.ShaderMaterial({
            uniforms: { uCell: { value: CELL } },
            vertexShader: [
                'varying vec3 vW;',
                'void main() {',
                '  vW = (modelMatrix * vec4(position, 1.0)).xyz;',
                '  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);',
                '}'
            ].join('\n'),
            fragmentShader: [
                'uniform float uCell; varying vec3 vW;',
                'void main() {',
                '  vec2 g = abs(fract(vW.xz / uCell - 0.5) - 0.5) / fwidth(vW.xz / uCell);',
                '  float line = 1.0 - min(min(g.x, g.y), 1.0);',
                /* Fade the grid out with distance so the plane reads as ground
                 * rather than as a plane that stops. */
                '  float fade = 1.0 - smoothstep(40.0, 150.0, length(vW.xz));',
                '  vec3 col = mix(vec3(0.016, 0.031, 0.055), vec3(0.10, 0.24, 0.40), line * 0.55);',
                '  gl_FragColor = vec4(col * fade, 1.0);',
                '}'
            ].join('\n')
        }));
    }

    /* ---------- interaction ---------- */

    function setHighlight() {
        var focus = pinned || hovered;
        for (var i = 0; i < towers.length; i++) {
            var u = towers[i].material.uniforms;
            u.uHover.value = towers[i] === focus ? 1 : 0;
            u.uDim.value = focus ? (towers[i] === focus ? 1 : 0.42) : 1;
            labels[i].material.opacity = focus
                ? (towers[i] === focus ? 1 : 0.14)
                : LABEL_REST;
        }
    }

    function hit(px, py) {
        ndc.set((px / vw) * 2 - 1, -(py / vh) * 2 + 1);
        ray.setFromCamera(ndc, camera);
        var out = ray.intersectObjects(towers, false);
        return out.length ? out[0].object : null;
    }

    function describe(mesh, withLink) {
        var b = mesh.userData.block;
        VizApp.readout.show(b.label, [
            ['Lines of code', b.loc.toLocaleString()],
            ['Files', String(b.files)],
            ['Commits', String(b.commits)],
            ['Last touched', b.ageDays === 0 ? 'today' :
                             b.ageDays === 1 ? 'yesterday' : b.ageDays + ' days ago']
        ], withLink ? { href: b.href, label: 'Open ' + b.label } : null);
    }

    /* ---------- legend ---------- */

    function buildLegend() {
        var el = document.createElement('div');
        el.className = 'legend glass';
        el.innerHTML =
            '<div class="legend-head">How to read it</div>' +
            '<div class="legend-row"><span class="legend-bar"></span>Height &middot; lines of code</div>' +
            '<div class="legend-row"><span class="legend-plot"></span>Footprint &middot; file count</div>' +
            '<div class="legend-row"><span class="legend-ramp"></span>Windows &middot; recently touched</div>';
        document.body.appendChild(el);
        return el;
    }

    /* ---------- scene module ---------- */

    VizApp.register({
        id: 'city',
        label: 'Site as a city',
        title: 'This site, as a city',
        blurb: 'Every folder in the repo is a building. Height is lines of ' +
               'code, footprint is file count, and the lights are on where ' +
               'the work is recent.',
        hint: 'Drag to orbit · scroll to zoom · click a tower to open it',
        accent: '#7dd3fc',

        init: function (ctx) {
            scene = new THREE.Scene();
            scene.fog = new THREE.Fog(0x070b16, 70, 240);
            camera = new THREE.PerspectiveCamera(42, ctx.width / ctx.height, 0.5, 400);
            ray = new THREE.Raycaster();
            ndc = new THREE.Vector2();

            scene.add(buildGround());
            scene.add(buildCity(window.VizCity));

            orbit = VizApp.makeOrbit(camera, ctx.canvas, {
                radius: 72, minRadius: 20, maxRadius: 170,
                theta: 38 * DEG,
                /* Never below the horizon: underneath a city is a grey plane,
                 * and never straight down either, or the skyline flattens
                 * into a floor plan. */
                phi: 66 * DEG, minPhi: 18 * DEG, maxPhi: 84 * DEG,
                target: new THREE.Vector3(0, 7, 0),
                spin: ctx.reducedMotion ? 0 : 0.045
            });

            legendEl = buildLegend();
            vw = ctx.width; vh = ctx.height;
            this.resize(ctx.width, ctx.height);
            return { scene: scene, camera: camera };
        },

        update: function (dt) {
            orbit.update(dt);
        },

        resize: function (w, h) {
            vw = w; vh = h;
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
            if (orbit) {
                var need = VizApp.fitDistance(camera, 24);
                if (orbit.tRadius < need) { orbit.tRadius = need; orbit.radius = need; }
            }
        },

        onPointerMove: function (p) {
            if (orbit.dragging) return;
            var m = hit(p.px, p.py);
            if (m === hovered) return;
            hovered = m;
            setHighlight();
            if (!pinned) {
                if (hovered) describe(hovered, false); else VizApp.readout.hide();
            }
            document.body.style.cursor = hovered ? 'pointer' : '';
        },

        onPointerDown: function (p) { down.x = p.px; down.y = p.py; },

        onPointerUp: function (p) {
            if (Math.hypot(p.px - down.x, p.py - down.y) > 6) return;
            var m = hit(p.px, p.py);
            if (!m || m === pinned) {
                pinned = null;
                VizApp.readout.hide();
            } else {
                pinned = m;
                /* The link is offered, not followed: a stray click on a
                 * skyline should not navigate you off the page. */
                describe(m, true);
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
            towers = []; labels = [];
            hovered = null; pinned = null;
        }
    });
})();
