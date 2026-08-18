/* Everything that touches three.js. The simulation never appears in here and
   this file never decides anything about a shot — it is handed a world and a
   camera intent and it draws them.

   Two rules keep the picture honest:

   - A moving wall's mesh is placed from physics.wallBox(), the same function
     the collision solver calls. A blade you can see and a blade you can hit
     therefore cannot drift apart, however the movement is later retuned.
   - The pads are drawn from the same rectangles the ball rolls on, sheared by
     the same gradient, so what looks like a ramp is a ramp.

   Textures are drawn into canvases at load. No image files to ship, no
   requests to fail, and the palette moves with the theme. */
(function (G3) {
    'use strict';

    var C = G3.CONFIG;
    var P = G3.physics;

    var THEMES = {
        seaside: {
            sky: [0x3f93cf, 0xc9e8f7],
            fog: 0xc9e8f7,
            sun: 0xfff3dc, sunPos: [9, 16, 7], ambient: 0x9fd0ea, ambientI: 0.55,
            grass: ['#4fae54', '#43a04a'],
            rail: 0xf4f7f5,
            surroundY: -0.95, surround: 'water',
            water: 0x2079ab,
            side: '#a08a5f'
        },
        quarry: {
            sky: [0xcf9558, 0xf6e2c2],
            fog: 0xf6e2c2,
            sun: 0xffe6bd, sunPos: [-8, 15, 6], ambient: 0xd8b58e, ambientI: 0.6,
            grass: ['#6f9c4e', '#628f45'],
            rail: 0xc7ae8c,
            surroundY: -2.4, surround: 'rock',
            water: 0x2f7fa8,
            side: '#8d7355'
        },
        works: {
            sky: [0x0d121d, 0x33405e],
            fog: 0x33405e,
            sun: 0xffe0b0, sunPos: [6, 14, -4], ambient: 0x5a6c94, ambientI: 0.75,
            grass: ['#2f7f5c', '#2a7355'],
            rail: 0xd9b36a,
            surroundY: -2.6, surround: 'floor',
            water: 0x2b6f8f,
            side: '#4a4a55'
        }
    };

    /* ── procedural textures ────────────────────────────────────────────── */

    function canvasTex(size, draw) {
        var cv = document.createElement('canvas');
        cv.width = cv.height = size;
        draw(cv.getContext('2d'), size);
        var t = new THREE.CanvasTexture(cv);
        t.wrapS = t.wrapT = THREE.RepeatWrapping;
        return t;
    }

    /* Grass is three things stacked: a mow pattern, a mat of blades, and dirt.
       The mow bands are what make a green read as a surface rather than a flat
       colour when the camera is low, the blades give it something for the light
       to catch at close range, and the mottling stops the tiling from showing
       as a grid on the big pads. */
    function grassTexture(theme) {
        return canvasTex(512, function (g, s) {
            var i, n, x, y, a;
            g.fillStyle = theme.grass[0];
            g.fillRect(0, 0, s, s);

            // Mow bands, with a soft seam so the roller looks like a roller.
            for (i = 0; i < s; i += 64) {
                var grd = g.createLinearGradient(0, i, 0, i + 32);
                grd.addColorStop(0, theme.grass[1]);
                grd.addColorStop(1, theme.grass[0]);
                g.fillStyle = grd;
                g.fillRect(0, i, s, 32);
            }

            // Broad mottling: light and shade at a scale bigger than a blade.
            for (n = 0; n < 90; n++) {
                g.fillStyle = 'rgba(' + (Math.random() < 0.5 ? '255,255,255,' : '0,0,0,') +
                    (0.015 + Math.random() * 0.03) + ')';
                g.beginPath();
                g.arc(Math.random() * s, Math.random() * s, 20 + Math.random() * 70, 0, 6.283);
                g.fill();
            }

            // Blades: short strokes leaning a few degrees off vertical.
            g.lineWidth = 1;
            for (n = 0; n < 5200; n++) {
                x = Math.random() * s; y = Math.random() * s;
                a = (Math.random() - 0.5) * 0.5;
                g.strokeStyle = Math.random() < 0.5
                    ? 'rgba(255,255,255,' + (0.02 + Math.random() * 0.05) + ')'
                    : 'rgba(0,0,0,' + (0.02 + Math.random() * 0.05) + ')';
                g.beginPath();
                g.moveTo(x, y);
                g.lineTo(x + Math.sin(a) * 6, y - Math.cos(a) * 6);
                g.stroke();
            }
        });
    }

    /* A height field for the same blades, so the light rakes across the green
       instead of lying on it flat. Cheap: one greyscale canvas, no normal maths
       — three.js turns a bump map into normals for us. */
    function grassBump() {
        return canvasTex(256, function (g, s) {
            var n, x, y;
            g.fillStyle = '#808080';
            g.fillRect(0, 0, s, s);
            for (n = 0; n < 5000; n++) {
                x = Math.random() * s; y = Math.random() * s;
                g.fillStyle = Math.random() < 0.5 ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)';
                g.fillRect(x, y, 2, 3);
            }
        });
    }

    function sandTexture() {
        return canvasTex(128, function (g, s) {
            g.fillStyle = '#e4d3a4';
            g.fillRect(0, 0, s, s);
            for (var n = 0; n < 4000; n++) {
                g.fillStyle = Math.random() < 0.5 ? 'rgba(255,255,255,0.35)' : 'rgba(150,120,70,0.28)';
                g.fillRect(Math.random() * s, Math.random() * s, 1.5, 1.5);
            }
        });
    }

    function woodTexture() {
        return canvasTex(128, function (g, s) {
            g.fillStyle = '#a97c4c';
            g.fillRect(0, 0, s, s);
            for (var i = 0; i < s; i += 16) {
                g.fillStyle = 'rgba(0,0,0,0.16)';
                g.fillRect(0, i, s, 2);
                g.fillStyle = 'rgba(255,220,180,0.10)';
                g.fillRect(0, i + 3, s, 3);
            }
            for (var n = 0; n < 900; n++) {
                g.fillStyle = 'rgba(80,50,20,0.12)';
                g.fillRect(Math.random() * s, Math.random() * s, 3, 1);
            }
        });
    }

    function roughTexture() {
        return canvasTex(128, function (g, s) {
            g.fillStyle = '#3c6b34';
            g.fillRect(0, 0, s, s);
            for (var n = 0; n < 2200; n++) {
                g.fillStyle = Math.random() < 0.5 ? 'rgba(40,90,35,0.5)' : 'rgba(120,150,80,0.25)';
                g.fillRect(Math.random() * s, Math.random() * s, 3, 3);
            }
        });
    }

    function rockTexture(tint) {
        return canvasTex(256, function (g, s) {
            g.fillStyle = tint;
            g.fillRect(0, 0, s, s);
            for (var n = 0; n < 900; n++) {
                var r = 3 + Math.random() * 14;
                g.fillStyle = 'rgba(0,0,0,' + (Math.random() * 0.13) + ')';
                g.beginPath();
                g.arc(Math.random() * s, Math.random() * s, r, 0, 6.283);
                g.fill();
                g.fillStyle = 'rgba(255,255,255,' + (Math.random() * 0.08) + ')';
                g.beginPath();
                g.arc(Math.random() * s, Math.random() * s, r * 0.6, 0, 6.283);
                g.fill();
            }
        });
    }

    /* Opaque on purpose. The map multiplies the material colour, so a mid grey
       base keeps the water its own colour and only the crests brighten; a
       texture with transparent pixels would read as white here and bleach the
       whole sea. */
    function rippleTexture() {
        return canvasTex(256, function (g, s) {
            g.fillStyle = '#8f9aa2';
            g.fillRect(0, 0, s, s);
            var n;
            for (n = 0; n < 260; n++) {
                g.strokeStyle = 'rgba(255,255,255,' + (0.10 + Math.random() * 0.22) + ')';
                g.lineWidth = 1 + Math.random() * 2.5;
                g.beginPath();
                g.arc(Math.random() * s, Math.random() * s, 4 + Math.random() * 26, 0.6, 2.5);
                g.stroke();
            }
            for (n = 0; n < 120; n++) {
                g.strokeStyle = 'rgba(0,0,0,0.10)';
                g.lineWidth = 1 + Math.random() * 3;
                g.beginPath();
                g.arc(Math.random() * s, Math.random() * s, 6 + Math.random() * 30, 3.4, 5.4);
                g.stroke();
            }
        });
    }

    function dotTexture() {
        return canvasTex(64, function (g, s) {
            var grd = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
            grd.addColorStop(0, 'rgba(255,255,255,1)');
            grd.addColorStop(0.55, 'rgba(255,255,255,0.75)');
            grd.addColorStop(1, 'rgba(255,255,255,0)');
            g.fillStyle = grd;
            g.fillRect(0, 0, s, s);
        });
    }

    /* ── module state ───────────────────────────────────────────────────── */

    var R = {
        ready: false,
        scene: null, camera: null, renderer: null,
        holeGroup: null, ball: null, aimGroup: null, arcPoints: null, arrow: null,
        flagCloth: null, flagPole: null, cupMesh: null,
        movers: [],            // { mesh, wall } — updated from physics each frame
        water: [],             // meshes whose texture scrolls
        tex: {},
        theme: null,
        cam: { yaw: 0, pitch: 0.46, dist: 9, target: new THREE.Vector3(), overview: false },
        smooth: { pos: new THREE.Vector3(), target: new THREE.Vector3(), started: false },
        particles: null, pAlive: 0,
        lastBall: new THREE.Vector3(),
        clock: 0
    };

    function init(canvas) {
        R.renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: false });
        R.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        R.renderer.shadowMap.enabled = true;
        R.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        if (THREE.sRGBEncoding !== undefined) R.renderer.outputEncoding = THREE.sRGBEncoding;

        R.scene = new THREE.Scene();
        R.camera = new THREE.PerspectiveCamera(52, 1, 0.1, 400);

        R.maxAniso = R.renderer.capabilities.getMaxAnisotropy();
        R.tex.sand = sandTexture();
        R.tex.grassBump = grassBump();
        R.tex.dimple = dimpleTexture();
        R.tex.wood = woodTexture();
        R.tex.rough = roughTexture();
        R.tex.ripple = rippleTexture();
        R.tex.dot = dotTexture();

        buildBall();
        buildAim();
        buildParticles();

        R.ready = true;
        resize();
        return R;
    }

    function resize() {
        if (!R.ready) return;
        var el = R.renderer.domElement;
        var w = el.clientWidth || el.width, h = el.clientHeight || el.height;
        R.renderer.setSize(w, h, false);
        R.camera.aspect = w / Math.max(1, h);
        R.camera.updateProjectionMatrix();
    }

    /* ── persistent objects ─────────────────────────────────────────────── */

    /* Dimples, as a bump map. Modelling them as geometry would cost a few
       thousand triangles on the one object the camera is always closest to;
       a hex grid of soft circles in a canvas costs nothing and reads the same
       at every distance the game ever uses. */
    function dimpleTexture() {
        return canvasTex(256, function (g, s) {
            var cols = 16, r = s / cols / 2, row, col, cx, cz, grd;
            g.fillStyle = '#b4b4b4';
            g.fillRect(0, 0, s, s);
            for (row = 0; row < cols * 2; row++) {
                for (col = 0; col < cols; col++) {
                    cx = col * (s / cols) + (row % 2 ? r : 0) + r;
                    cz = row * (s / (cols * 2)) + r / 2;
                    grd = g.createRadialGradient(cx, cz, 0, cx, cz, r * 0.92);
                    grd.addColorStop(0, '#3a3a3a');
                    grd.addColorStop(0.72, '#a0a0a0');
                    grd.addColorStop(1, '#ffffff');
                    g.fillStyle = grd;
                    g.beginPath();
                    g.arc(cx, cz, r * 0.92, 0, 6.283);
                    g.fill();
                }
            }
        });
    }

    function buildBall() {
        var geo = new THREE.SphereGeometry(C.BALL_R, 32, 24);
        var mat = new THREE.MeshPhongMaterial({
            color: 0xffffff,
            bumpMap: R.tex.dimple,
            bumpScale: 0.012,
            shininess: 55,
            specular: 0x9aa4ac
        });
        R.ball = new THREE.Mesh(geo, mat);
        R.ball.castShadow = true;
        R.scene.add(R.ball);
    }

    function buildAim() {
        R.aimGroup = new THREE.Group();

        // Ground arrow: a flat wedge that grows with power. Drawn without depth
        // testing so it is never swallowed by the pad it lies on.
        var shape = new THREE.BufferGeometry();
        shape.setAttribute('position', new THREE.Float32BufferAttribute(new Array(9 * 3).fill(0), 3));
        R.arrow = new THREE.Mesh(shape, new THREE.MeshBasicMaterial({
            color: 0xffffff, transparent: true, opacity: 0.55, side: THREE.DoubleSide,
            depthTest: false
        }));
        R.arrow.renderOrder = 5;
        R.aimGroup.add(R.arrow);

        // Predicted path, as a row of dots. A line would be one pixel wide on
        // a phone; dots survive.
        var pg = new THREE.BufferGeometry();
        pg.setAttribute('position', new THREE.Float32BufferAttribute(new Array(120 * 3).fill(0), 3));
        R.arcPoints = new THREE.Points(pg, new THREE.PointsMaterial({
            size: 0.16, map: R.tex.dot, transparent: true, opacity: 0.85,
            depthTest: false, sizeAttenuation: true
        }));
        R.arcPoints.renderOrder = 6;
        R.aimGroup.add(R.arcPoints);

        R.scene.add(R.aimGroup);
    }

    function buildParticles() {
        var n = 90;
        var g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.Float32BufferAttribute(new Array(n * 3).fill(0), 3));
        R.particles = new THREE.Points(g, new THREE.PointsMaterial({
            size: 0.13, map: R.tex.dot, transparent: true, opacity: 0.9, depthWrite: false
        }));
        R.particles.visible = false;
        R.particles.userData.v = [];
        for (var i = 0; i < n; i++) R.particles.userData.v.push({ x: 0, y: 0, z: 0, life: 0 });
        R.scene.add(R.particles);
    }

    function burst(x, y, z, color, count, speed) {
        var pts = R.particles.userData.v, i, p, n = 0;
        R.particles.material.color = new THREE.Color(color);
        for (i = 0; i < pts.length && n < count; i++) {
            p = pts[i];
            if (p.life > 0) continue;
            p.life = 0.55 + Math.random() * 0.35;
            p.px = x; p.py = y; p.pz = z;
            var a = Math.random() * Math.PI * 2, r = Math.random();
            p.x = Math.cos(a) * r * speed;
            p.z = Math.sin(a) * r * speed;
            p.y = speed * (0.6 + Math.random() * 0.8);
            n++;
        }
        R.particles.visible = true;
        R.pAlive = 1;
    }

    function stepParticles(dt) {
        if (!R.pAlive) return;
        var pts = R.particles.userData.v;
        var arr = R.particles.geometry.attributes.position.array;
        var alive = 0, i, p;
        for (i = 0; i < pts.length; i++) {
            p = pts[i];
            if (p.life <= 0) { arr[i * 3 + 1] = -999; continue; }
            p.life -= dt;
            p.y -= 14 * dt;
            p.px += p.x * dt; p.py += p.y * dt; p.pz += p.z * dt;
            arr[i * 3] = p.px; arr[i * 3 + 1] = p.py; arr[i * 3 + 2] = p.pz;
            alive++;
        }
        R.particles.geometry.attributes.position.needsUpdate = true;
        R.pAlive = alive;
        R.particles.visible = alive > 0;
    }

    /* ── scene assembly ─────────────────────────────────────────────────── */

    function disposeGroup(g) {
        g.traverse(function (o) {
            if (o.geometry) o.geometry.dispose();
            if (o.material) {
                // Textures are shared and cached on R.tex; only per-hole
                // materials are thrown away here.
                if (Array.isArray(o.material)) o.material.forEach(function (m) { m.dispose(); });
                else o.material.dispose();
            }
        });
        R.scene.remove(g);
    }

    function skyDome(theme) {
        var mat = new THREE.ShaderMaterial({
            side: THREE.BackSide, depthWrite: false,
            uniforms: {
                top: { value: new THREE.Color(theme.sky[0]) },
                bottom: { value: new THREE.Color(theme.sky[1]) }
            },
            vertexShader: 'varying float h; void main(){ h = normalize(position).y; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
            fragmentShader: 'uniform vec3 top; uniform vec3 bottom; varying float h; void main(){ gl_FragColor = vec4(mix(bottom, top, smoothstep(-0.15, 0.55, h)), 1.0); }'
        });
        return new THREE.Mesh(new THREE.SphereGeometry(180, 24, 16), mat);
    }

    function tiled(base, w, d, scale) {
        var tex = base.clone();
        tex.needsUpdate = true;
        tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
        tex.anisotropy = R.maxAniso;      // the grazing angles are most of the view
        tex.repeat.set(Math.max(1, w / scale), Math.max(1, d / scale));
        return tex;
    }

    function padMaterial(kind, theme, w, d) {
        var side = new THREE.MeshLambertMaterial({ color: new THREE.Color(theme.side) });
        var top;
        if (kind === 'sand') {
            top = new THREE.MeshLambertMaterial({ map: tiled(R.tex.sand, w, d, 2) });
        } else if (kind === 'wood') {
            top = new THREE.MeshLambertMaterial({ map: tiled(R.tex.wood, w, d, 2) });
        } else if (kind === 'rough') {
            top = new THREE.MeshLambertMaterial({ map: tiled(R.tex.rough, w, d, 2) });
        } else {
            // Phong rather than Lambert on the greens only: a little sheen and
            // a bump map is the difference between mown grass and green paint,
            // and the greens are what the camera is looking at.
            top = new THREE.MeshPhongMaterial({
                map: tiled(R.tex.grass, w, d, 3.5),
                bumpMap: tiled(R.tex.grassBump, w, d, 0.8),
                bumpScale: 0.035,
                shininess: 4,
                specular: 0x1c2a18
            });
        }
        // Box material order: +x, -x, +y, -y, +z, -z.
        return [side, side, top, side, side, side];
    }

    var PLANK_THICK = 0.3;

    /* Pads are drawn as boxes whose underside reaches the surrounding ground,
       so a raised green reads as a plateau with a cliff instead of a slab
       hovering in the air. Boards are the exception: a jetty is supposed to
       look like a plank over the water, not a causeway through it. */
    function addPad(group, pad, theme) {
        var cx = pad.x + pad.w / 2, cz = pad.z + pad.d / 2;
        var sx = pad.sx || 0, sz = pad.sz || 0;
        var cy = P.padHeight(pad, cx, cz);
        var rise = (Math.abs(sx) * pad.w + Math.abs(sz) * pad.d) / 2;
        var thick = pad.kind === 'wood'
            ? PLANK_THICK
            : Math.max(0.6, cy - (theme.surroundY - 0.4) + rise);
        var geo = new THREE.BoxGeometry(pad.w, thick, pad.d);
        if (sx || sz) {
            // Shear about the pad's own centre: y' = y + sx·x + sz·z. Vertical
            // edges stay vertical, so a tilted pad still meets its neighbours.
            var m = new THREE.Matrix4();
            m.set(1, 0, 0, 0,
                  sx, 1, sz, 0,
                  0, 0, 1, 0,
                  0, 0, 0, 1);
            geo.applyMatrix4(m);
            geo.computeVertexNormals();
        }
        var mesh = new THREE.Mesh(geo, padMaterial(pad.kind, theme, pad.w, pad.d));
        mesh.position.set(cx, cy - thick / 2, cz);
        mesh.receiveShadow = true;
        mesh.castShadow = true;
        group.add(mesh);
    }

    function addWall(group, wall, theme) {
        var B = P.wallBox(wall, 0);
        var geo = new THREE.BoxGeometry(wall.w, wall.h, wall.d);
        var color = wall.kind === 'blade' ? 0xd8523f : (wall.kind === 'gate' ? 0xe0a13a : theme.rail);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(B.cx, B.base + wall.h / 2, B.cz);
        mesh.rotation.y = B.yaw;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        group.add(mesh);

        if (wall.move || wall.spin) {
            R.movers.push({ mesh: mesh, wall: wall, h: wall.h });
            if (wall.spin) {
                // A blade needs something to turn on, or it reads as a floating
                // plank.
                var post = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.16, 0.2, wall.h + 1.5, 12),
                    new THREE.MeshLambertMaterial({ color: 0x6b7280 })
                );
                post.position.set(B.cx, B.base + (wall.h + 1.5) / 2 - 0.3, B.cz);
                post.castShadow = true;
                group.add(post);
            }
        }
    }

    function addWater(group, w, theme) {
        var tex = R.tex.ripple.clone();
        tex.needsUpdate = true;
        tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
        tex.repeat.set(Math.max(1, w.w / 3), Math.max(1, w.d / 3));
        var mat = new THREE.MeshPhongMaterial({
            color: theme.water, map: tex, transparent: true, opacity: 0.88,
            shininess: 18, specular: 0x22333d
        });
        // A box rather than a plane: the pads reach down to the surrounding
        // ground, so a pond between two of them is a filled channel, and a
        // sheet floating in the gap would read as a decal.
        var depth = Math.max(0.6, w.y - theme.surroundY + 0.2);
        var mesh = new THREE.Mesh(new THREE.BoxGeometry(w.w, depth, w.d), mat);
        mesh.position.set(w.x + w.w / 2, w.y - depth / 2, w.z + w.d / 2);
        group.add(mesh);
        R.water.push(mesh);
    }

    function addSurround(group, hole, theme) {
        var mat;
        if (theme.surround === 'water') {
            var tex = R.tex.ripple.clone();
            tex.needsUpdate = true;
            tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
            tex.repeat.set(150, 150);
            mat = new THREE.MeshPhongMaterial({ color: theme.water, map: tex, shininess: 18, specular: 0x22333d });
        } else {
            var rt = rockTexture(theme.surround === 'rock' ? '#9c8466' : '#3f4450');
            rt.wrapS = rt.wrapT = THREE.RepeatWrapping;
            rt.repeat.set(150, 150);
            R.tex.surroundTemp = rt;
            mat = new THREE.MeshLambertMaterial({ map: rt });
        }
        // Big enough that its edge is beyond the fog, so the horizon is a fade
        // and not a line.
        var mesh = new THREE.Mesh(new THREE.PlaneGeometry(600, 600), mat);
        mesh.rotation.x = -Math.PI / 2;
        mesh.position.set((hole.bounds.minX + hole.bounds.maxX) / 2, theme.surroundY, (hole.bounds.minZ + hole.bounds.maxZ) / 2);
        group.add(mesh);
        if (theme.surround === 'water') R.water.push(mesh);
    }

    function addCup(group, hole) {
        var cup = hole.cup;
        var lining = new THREE.Mesh(
            new THREE.CylinderGeometry(C.HOLE_R, C.HOLE_R * 0.86, 0.5, 24, 1, true),
            new THREE.MeshLambertMaterial({ color: 0x1a1a1a, side: THREE.DoubleSide })
        );
        lining.position.set(cup.x, cup.y - 0.25, cup.z);
        group.add(lining);

        var floor = new THREE.Mesh(
            new THREE.CircleGeometry(C.HOLE_R * 0.86, 24),
            new THREE.MeshLambertMaterial({ color: 0x111111 })
        );
        floor.rotation.x = -Math.PI / 2;
        floor.position.set(cup.x, cup.y - 0.5, cup.z);
        group.add(floor);

        var rim = new THREE.Mesh(
            new THREE.RingGeometry(C.HOLE_R, C.HOLE_R + 0.06, 28),
            new THREE.MeshBasicMaterial({ color: 0xf5f5f5, side: THREE.DoubleSide })
        );
        rim.rotation.x = -Math.PI / 2;
        rim.position.set(cup.x, cup.y + 0.012, cup.z);
        group.add(rim);
        R.cupMesh = rim;

        var pole = new THREE.Mesh(
            new THREE.CylinderGeometry(0.035, 0.035, 1.6, 8),
            new THREE.MeshLambertMaterial({ color: 0xf0f0f0 })
        );
        pole.position.set(cup.x, cup.y + 0.8, cup.z);
        pole.castShadow = true;
        group.add(pole);
        R.flagPole = pole;

        var cloth = new THREE.Mesh(
            new THREE.PlaneGeometry(0.72, 0.42, 8, 2),
            new THREE.MeshLambertMaterial({ color: 0xe23b3b, side: THREE.DoubleSide })
        );
        cloth.position.set(cup.x + 0.36, cup.y + 1.36, cup.z);
        group.add(cloth);
        R.flagCloth = cloth;
        R.flagBase = { x: cup.x, y: cup.y, z: cup.z };
    }

    function addTeeMark(group, hole) {
        var m = new THREE.Mesh(
            new THREE.RingGeometry(0.20, 0.26, 20),
            new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5, side: THREE.DoubleSide })
        );
        m.rotation.x = -Math.PI / 2;
        m.position.set(hole.tee.x, hole.tee.y + 0.015, hole.tee.z);
        group.add(m);
    }

    function lights(group, hole, theme) {
        var amb = new THREE.HemisphereLight(theme.ambient, 0x404030, theme.ambientI);
        group.add(amb);

        var sun = new THREE.DirectionalLight(theme.sun, 0.95);
        var cx = (hole.bounds.minX + hole.bounds.maxX) / 2;
        var cz = (hole.bounds.minZ + hole.bounds.maxZ) / 2;
        sun.position.set(cx + theme.sunPos[0], theme.sunPos[1], cz + theme.sunPos[2]);
        sun.target.position.set(cx, 0, cz);
        sun.castShadow = true;
        var span = Math.max(hole.bounds.maxX - hole.bounds.minX, hole.bounds.maxZ - hole.bounds.minZ) * 0.75 + 4;
        sun.shadow.camera.left = -span;
        sun.shadow.camera.right = span;
        sun.shadow.camera.top = span;
        sun.shadow.camera.bottom = -span;
        sun.shadow.camera.near = 1;
        sun.shadow.camera.far = 60;
        sun.shadow.mapSize.set(1024, 1024);
        sun.shadow.bias = -0.0012;
        group.add(sun);
        group.add(sun.target);
    }

    function buildHole(hole, themeName) {
        var theme = THEMES[themeName] || THEMES.seaside;
        R.theme = theme;
        if (R.holeGroup) disposeGroup(R.holeGroup);
        R.movers = [];
        R.water = [];

        R.tex.grass = grassTexture(theme);

        var g = new THREE.Group();
        R.scene.fog = new THREE.Fog(theme.fog, 24, 95);
        g.add(skyDome(theme));
        lights(g, hole, theme);
        addSurround(g, hole, theme);

        var i;
        for (i = 0; i < hole.pads.length; i++) addPad(g, hole.pads[i], theme);
        for (i = 0; i < hole.walls.length; i++) addWall(g, hole.walls[i], theme);
        for (i = 0; i < hole.water.length; i++) addWater(g, hole.water[i], theme);
        addCup(g, hole);
        addTeeMark(g, hole);

        R.scene.add(g);
        R.holeGroup = g;
        R.smooth.started = false;
        R.clock = 0;
        setFlagDown(false);
    }

    function setFlagDown(down) {
        if (!R.flagPole) return;
        R.flagPole.visible = !down;
        R.flagCloth.visible = !down;
    }

    /* ── per-frame ──────────────────────────────────────────────────────── */

    // Walls that move are placed from the same function the solver uses.
    function syncMovers(t) {
        var i, m, B;
        for (i = 0; i < R.movers.length; i++) {
            m = R.movers[i];
            B = P.wallBox(m.wall, t);
            m.mesh.position.set(B.cx, B.base + m.h / 2, B.cz);
            m.mesh.rotation.y = B.yaw;
        }
    }

    function rollBall(pos) {
        var dx = pos.x - R.lastBall.x, dz = pos.z - R.lastBall.z;
        var d = Math.hypot(dx, dz);
        if (d > 1e-5) {
            var axis = new THREE.Vector3(dz / d, 0, -dx / d);
            R.ball.rotateOnWorldAxis(axis, d / C.BALL_R);
        }
        R.lastBall.set(pos.x, pos.y, pos.z);
        R.ball.position.set(pos.x, pos.y, pos.z);
    }

    /* The aiming furniture: a wedge on the ground pointing where the ball will
       set off, and the first stretch of the predicted path as dots. The path
       comes from the physics module rather than a formula of its own, which is
       why it is right about rails and ramps. */
    function updateAim(world, aim) {
        var show = !!(aim && aim.show && !world.moving && !world.sunk);
        R.aimGroup.visible = show;
        if (!show) return;

        var b = world.ball;
        var dirX = Math.sin(aim.yaw), dirZ = Math.cos(aim.yaw);
        var frac = Math.max(0.08, Math.min(1, aim.power / C.MAX_POWER));
        var len = 0.7 + frac * 2.6;
        var halfW = 0.11 + frac * 0.05;
        var y = b.y - C.BALL_R + 0.02;

        // Wedge: a shaft and a head, six vertices, written straight into the
        // buffer so nothing is allocated per frame.
        var px = -dirZ, pz = dirX;   // perpendicular
        var a = R.arrow.geometry.attributes.position.array;
        function put(i, sx, sz) {
            a[i * 3] = b.x + dirX * sx + px * sz;
            a[i * 3 + 1] = y;
            a[i * 3 + 2] = b.z + dirZ * sx + pz * sz;
        }
        var shaft = len * 0.72;
        put(0, 0.22, -halfW); put(1, 0.22, halfW); put(2, shaft, halfW);
        put(3, 0.22, -halfW); put(4, shaft, halfW); put(5, shaft, -halfW);
        put(6, shaft, -halfW * 2.4); put(7, shaft, halfW * 2.4); put(8, len, 0);
        R.arrow.geometry.attributes.position.needsUpdate = true;
        R.arrow.geometry.computeBoundingSphere();
        R.arrow.material.color.setHSL(0.33 - 0.33 * frac, 0.85, 0.55);

        var pts = P.previewPath(world, aim.yaw, aim.power, aim.loft, 0.85);
        var arr = R.arcPoints.geometry.attributes.position.array;
        // Thirty-odd dots evenly along the path: dense enough to read as a
        // trajectory, sparse enough to read as dots.
        var n = Math.min(34, pts.length), i, k;
        for (i = 0; i < 120; i++) {
            if (i < n) {
                k = Math.min(pts.length - 1, Math.round(i * ((pts.length - 1) / Math.max(1, n - 1))));
                arr[i * 3] = pts[k].x;
                arr[i * 3 + 1] = pts[k].y;
                arr[i * 3 + 2] = pts[k].z;
            } else {
                arr[i * 3 + 1] = -999;
            }
        }
        R.arcPoints.geometry.attributes.position.needsUpdate = true;
        R.arcPoints.geometry.computeBoundingSphere();
    }

    /* Camera. The player never flies it directly: it sits behind the ball
       looking down the aim line, which is what makes "drag left, aim left"
       true from any angle. Overview lifts it above the hole instead. */
    function updateCamera(hole, ball, dt) {
        var c = R.cam;
        var tx, ty, tz, px, py, pz;

        if (c.overview) {
            // Fit the pad bounding box: back off along the aim line far enough
            // that the hole's bounding radius is inside the narrower of the two
            // frustum half-angles, with a little air around it.
            var bx = (hole.bounds.minX + hole.bounds.maxX) / 2;
            var bz = (hole.bounds.minZ + hole.bounds.maxZ) / 2;
            var ex = (hole.bounds.maxX - hole.bounds.minX) / 2;
            var ez = (hole.bounds.maxZ - hole.bounds.minZ) / 2;
            var radius = Math.hypot(ex, ez) * 1.12;
            var vFov = R.camera.fov * Math.PI / 360;
            var hFov = Math.atan(Math.tan(vFov) * R.camera.aspect);
            var dist = radius / Math.tan(Math.min(vFov, hFov));
            var tilt = 1.02;                  // ~58° down, so it still reads as 3D
            tx = bx; ty = 0; tz = bz;
            px = bx - Math.sin(c.yaw) * Math.cos(tilt) * dist;
            py = Math.sin(tilt) * dist;
            pz = bz - Math.cos(c.yaw) * Math.cos(tilt) * dist;
        } else {
            tx = ball.x; ty = ball.y + 0.35; tz = ball.z;
            var back = c.dist * Math.cos(c.pitch);
            px = ball.x - Math.sin(c.yaw) * back;
            py = ball.y + c.dist * Math.sin(c.pitch);
            pz = ball.z - Math.cos(c.yaw) * back;
        }

        if (!R.smooth.started) {
            R.smooth.pos.set(px, py, pz);
            R.smooth.target.set(tx, ty, tz);
            R.smooth.started = true;
        } else {
            var k = 1 - Math.pow(0.0016, dt);   // frame-rate independent easing
            R.smooth.pos.lerp(new THREE.Vector3(px, py, pz), k);
            R.smooth.target.lerp(new THREE.Vector3(tx, ty, tz), k);
        }
        R.camera.position.copy(R.smooth.pos);
        R.camera.lookAt(R.smooth.target);
    }

    function frame(dt, world, aim) {
        if (!R.ready || !R.holeGroup) return;
        R.clock += dt;

        syncMovers(world.time);
        if (!world.sunk) {
            R.ball.visible = true;
            rollBall(world.ball);
        }

        var i;
        for (i = 0; i < R.water.length; i++) {
            if (R.water[i].material.map) {
                R.water[i].material.map.offset.x = R.clock * 0.02;
                R.water[i].material.map.offset.y = R.clock * 0.014;
            }
        }
        if (R.flagCloth) {
            var g = R.flagCloth.geometry.attributes.position;
            for (i = 0; i < g.count; i++) {
                var lx = g.getX(i);
                g.setZ(i, Math.sin(R.clock * 4 + lx * 3) * 0.06 * (lx + 0.36));
            }
            g.needsUpdate = true;
        }

        updateAim(world, aim);
        stepParticles(dt);
        updateCamera(world.hole, world.ball, dt);
        R.renderer.render(R.scene, R.camera);
    }

    /* ── effects the game asks for ──────────────────────────────────────── */

    function splashAt(x, y, z) { burst(x, y, z, 0x9fd8ff, 26, 2.6); }
    function sandAt(x, y, z) { burst(x, y, z, 0xe8d8a8, 14, 1.5); }
    function sinkAt(x, y, z) { burst(x, y + 0.1, z, 0xffe98a, 26, 2.2); }

    function hideBall() { R.ball.visible = false; }

    function setCam(patch) {
        for (var k in patch) if (Object.prototype.hasOwnProperty.call(patch, k)) R.cam[k] = patch[k];
    }

    G3.render = {
        init: init,
        resize: resize,
        buildHole: buildHole,
        frame: frame,
        splashAt: splashAt,
        sandAt: sandAt,
        sinkAt: sinkAt,
        hideBall: hideBall,
        setFlagDown: setFlagDown,
        setCam: setCam,
        cam: R.cam,
        state: R,
        THEMES: THEMES
    };

})(window.G3);
