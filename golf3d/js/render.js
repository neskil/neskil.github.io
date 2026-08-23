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
        lagoon: {
            sky: [0x1f86c8, 0xbfe9f4],
            fog: 0xbfe9f4,
            sun: 0xfff7e6, sunPos: [7, 17, -6], ambient: 0x9adfe8, ambientI: 0.62,
            grass: ['#5cba62', '#4faa55'],
            rail: 0xfbf4e4,
            surroundY: -0.78, surround: 'water',
            water: 0x11a5c0,
            side: '#c9b287'
        },
        highland: {
            sky: [0x4d74ab, 0xd9e5f0],
            fog: 0xd9e5f0,
            sun: 0xffeccb, sunPos: [-8, 14, -7], ambient: 0xa6bcd4, ambientI: 0.5,
            grass: ['#4a9159', '#3f8149'],
            rail: 0x99a3ac,
            /* Moor, not quarry: the surround takes a tint of its own so the
               two rock courses do not read as the same place. It lands about
               twice as bright as it looks here once the sun, the hemisphere
               and the tone map have all had a go at it. */
            surroundY: -2.7, surround: 'rock', ground: '#454c3c',
            water: 0x2b6d8d,
            side: '#7d7566'
        },
        works: {
            sky: [0x0d121d, 0x33405e],
            fog: 0x33405e,
            sun: 0xffe0b0, sunPos: [6, 14, -4], ambient: 0x5a6c94, ambientI: 0.75,
            grass: ['#2f7f5c', '#2a7355'],
            rail: 0xd9b36a,
            stars: 0.9,             // the one course played after dark
            cloudLum: 0.20,         // …so its clouds are moonlit, not sunlit
            surroundY: -2.6, surround: 'floor',
            water: 0x2b6f8f,
            floor: '#2b2f39',
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
            g.fillStyle = '#d8c391';
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
        holeGroup: null, ball: null, aimGroup: null, pathPlane: null, pathHead: null, arrow: null,
        flagCloth: null, flagPole: null, cupMesh: null,
        pin: null, flagSwivel: null, flagRest: null, pinShake: 0,
        movers: [],            // { mesh, wall } — updated from physics each frame
        waterMats: [],         // water shaders whose clock and wind we advance
        sky: null,             // the sky shader's material, for the same reason
        sun: null,             // the directional light, and where it is pointing
        sunDir: new THREE.Vector3(0, 1, 0),
        sunUv: new THREE.Vector2(0.5, 1.2),
        tex: {},
        theme: null, weather: null,
        cam: {
            yaw: 0, pitch: 0.46, dist: 9, target: new THREE.Vector3(), overview: false,
            kick: 0,          // impact flinch, decays
            speedPull: 0      // extra distance while the ball is quick
        },
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

        /* The picture goes through postfx.js if the context will have it, and
           straight to the canvas if it will not. Everything downstream of here
           is written so that either is a complete game: the grade is the last
           word on how a hole looks, not the only word. */
        R.fx = G3.postfx ? G3.postfx.init(R.renderer) : false;

        R.scene = new THREE.Scene();
        R.camera = new THREE.PerspectiveCamera(52, 1, 0.1, 400);

        R.maxAniso = R.renderer.capabilities.getMaxAnisotropy();
        R.tex.sand = sandTexture();
        R.tex.grassBump = grassBump();
        R.tex.dimple = dimpleTexture();
        R.tex.wood = woodTexture();
        R.tex.rough = roughTexture();
        R.tex.dot = dotTexture();

        buildBall();
        buildAim();
        buildTrail();
        buildParticles();
        if (G3.bag) G3.bag.build(R.scene);

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
        if (R.fx) {
            var dpr = R.renderer.getPixelRatio();
            G3.postfx.resize(w * dpr, h * dpr);
        }
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

        /* The band: a tapered strip behind the ball, opposite the shot, that
           grows as the pull grows. It is the part of a slingshot you can see
           straining, and without it a big shot and a small one look the same
           until the ball moves. */
        var band = new THREE.BufferGeometry();
        band.setAttribute('position', new THREE.Float32BufferAttribute(new Array(6 * 3).fill(0), 3));
        R.band = new THREE.Mesh(band, new THREE.MeshBasicMaterial({
            color: 0xffffff, transparent: true, opacity: 0.5, side: THREE.DoubleSide,
            depthTest: false
        }));
        R.band.renderOrder = 4;
        R.aimGroup.add(R.band);

        /* The ring: a full circle round the ball drawn only as far as the power
           has wound on. RingGeometry lays its triangles out in order round the
           circle, so a draw range is an arc, and an arc costs nothing. */
        var ring = new THREE.RingGeometry(0.30, 0.40, 64);
        R.ringCount = ring.index.count;
        R.ring = new THREE.Mesh(ring, new THREE.MeshBasicMaterial({
            color: 0x9ae6b4, transparent: true, opacity: 0.9, side: THREE.DoubleSide,
            depthTest: false
        }));
        R.ring.rotation.x = -Math.PI / 2;
        R.ring.renderOrder = 7;
        R.aimGroup.add(R.ring);

        /* Predicted path, as a filled plane rather than a row of dots. Two
           power-perturbed arcs — a touch light, a touch heavy — bound a
           quad-strip surface between them: the shape of it *is* the answer to
           "how far could this go", spanning the min and max air time a loaded
           shot could land at. An arrowhead at the loaded shot's own landing
           point (or its first bounce) marks the one result actually aimed
           at, without pretending the game can promise it. */
        var perPath = 40;
        R.pathPerPath = perPath;
        var pvcount = (perPath - 1) * 6;
        var pg = new THREE.BufferGeometry();
        pg.setAttribute('position', new THREE.Float32BufferAttribute(new Array(pvcount * 3).fill(0), 3));
        pg.setAttribute('color', new THREE.Float32BufferAttribute(new Array(pvcount * 3).fill(1), 3));
        R.pathPlane = new THREE.Mesh(pg, new THREE.MeshBasicMaterial({
            color: 0xffffff, transparent: true, opacity: 0.5, side: THREE.DoubleSide,
            vertexColors: true, depthTest: false
        }));
        R.pathPlane.renderOrder = 6;
        R.pathPlane.frustumCulled = false;
        R.aimGroup.add(R.pathPlane);

        var hg = new THREE.BufferGeometry();
        hg.setAttribute('position', new THREE.Float32BufferAttribute(new Array(3 * 3).fill(0), 3));
        R.pathHead = new THREE.Mesh(hg, new THREE.MeshBasicMaterial({
            color: 0xffffff, transparent: true, opacity: 0.95, side: THREE.DoubleSide,
            depthTest: false
        }));
        R.pathHead.renderOrder = 7;
        R.pathHead.frustumCulled = false;
        R.aimGroup.add(R.pathHead);

        R.scene.add(R.aimGroup);
    }

    // One quad of the path plane, as two triangles: pA-pB-pC and pA-pC-pD.
    function putPathQuad(arr, base, pA, pB, pC, pD) {
        var idx = base * 3;
        arr[idx] = pA.x; arr[idx + 1] = pA.y; arr[idx + 2] = pA.z;
        arr[idx + 3] = pB.x; arr[idx + 4] = pB.y; arr[idx + 5] = pB.z;
        arr[idx + 6] = pC.x; arr[idx + 7] = pC.y; arr[idx + 8] = pC.z;
        arr[idx + 9] = pA.x; arr[idx + 10] = pA.y; arr[idx + 11] = pA.z;
        arr[idx + 12] = pC.x; arr[idx + 13] = pC.y; arr[idx + 14] = pC.z;
        arr[idx + 15] = pD.x; arr[idx + 16] = pD.y; arr[idx + 17] = pD.z;
    }

    function setPathQuadShade(col, base, shade) {
        var idx = base * 3;
        for (var v = 0; v < 6; v++) { col[idx + v * 3] = col[idx + v * 3 + 1] = col[idx + v * 3 + 2] = shade; }
    }

    /* A tail of where the ball has just been. Additive blending and a colour
       that darkens with age does the fading for us — per-point alpha would want
       a custom shader, and this reads the same. */
    function buildTrail() {
        var n = C.TRAIL;
        var g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.Float32BufferAttribute(new Array(n * 3).fill(-9999), 3));
        g.setAttribute('color', new THREE.Float32BufferAttribute(new Array(n * 3).fill(0), 3));
        R.trail = new THREE.Points(g, new THREE.PointsMaterial({
            size: 0.13, map: R.tex.dot, transparent: true, depthWrite: false,
            blending: THREE.AdditiveBlending, vertexColors: true
        }));
        R.trail.frustumCulled = false;
        R.trailAt = 0;
        R.trailOn = false;
        R.scene.add(R.trail);
    }

    function pushTrail(x, y, z) {
        var pos = R.trail.geometry.attributes.position.array;
        var col = R.trail.geometry.attributes.color.array;
        var n = C.TRAIL, i, age, f;
        R.trailAt = (R.trailAt + 1) % n;
        pos[R.trailAt * 3] = x; pos[R.trailAt * 3 + 1] = y; pos[R.trailAt * 3 + 2] = z;
        for (i = 0; i < n; i++) {
            age = (R.trailAt - i + n) % n;          // 0 = newest
            f = Math.max(0, 1 - age / n);
            f = f * f * 0.75;
            col[i * 3] = f; col[i * 3 + 1] = f * 1.05; col[i * 3 + 2] = f * 0.9;
        }
        R.trail.geometry.attributes.position.needsUpdate = true;
        R.trail.geometry.attributes.color.needsUpdate = true;
    }

    function clearTrail() {
        var pos = R.trail.geometry.attributes.position.array, i;
        for (i = 0; i < pos.length; i++) pos[i] = -9999;
        R.trail.geometry.attributes.position.needsUpdate = true;
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

    /* ── the sky ────────────────────────────────────────────────────────

       The sky was a two-stop gradient, which is fine until you look up. It is
       now the one genuinely expensive shader in the game, and it earns it: the
       whole of the weather that you can see without looking down is in here.

       Clouds are noise, not geometry. The ray from the camera is projected
       onto a flat sheet a long way up — divide the direction by its own height
       and you have the point where it crosses that sheet — and five octaves of
       value noise are sampled there. Coverage is a threshold on that noise, so
       one uniform takes the sky from clear to solid, and drifting the sample
       point with the wind moves the weather across the course without moving
       a single vertex.

       Two details do most of the work. The clouds are shaded by sampling the
       *same* noise a short way towards the sun and comparing: where the field
       is rising towards the light the cloud is lit, where it is falling it is
       in its own shadow, which is a fair imitation of a cloud for two texture
       reads. And the sun's own halo is added on top of the cloud rather than
       under it, so an overcast sky still has a bright patch where the sun is
       and a rim of silver on whatever is passing in front of it. */

    var SKY_VS =
        'varying vec3 vDir;' +
        'void main(){ vDir = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }';

    var SKY_FS = [
        'uniform vec3 top, bottom, fogColour, sunColour, cloudTop, cloudBase, sunDir;',
        'uniform float cover, sunI, sharp, hazeTop, starI;',
        'uniform vec2 drift;',
        'varying vec3 vDir;',

        'float hash21(vec2 p){',
        '  p = fract(p * vec2(123.34, 456.21));',
        '  p += dot(p, p + 45.32);',
        '  return fract(p.x * p.y);',
        '}',
        'float vnoise(vec2 p){',
        '  vec2 i = floor(p), f = fract(p);',
        '  vec2 u = f * f * (3.0 - 2.0 * f);',
        '  float a = hash21(i), b = hash21(i + vec2(1.0, 0.0));',
        '  float c = hash21(i + vec2(0.0, 1.0)), d = hash21(i + vec2(1.0, 1.0));',
        '  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);',
        '}',
        /* Five octaves, with the fine ones faded out towards the horizon.
           The projection below stretches the cloud sheet without limit as the
           ray flattens, so by the horizon a single pixel spans several periods
           of the top octave and the sky turns to static. Weighting each octave
           by how much room it has left, and normalising by the weights so the
           mean does not move with it, is a level-of-detail scheme in four
           lines — and it is also, by happy accident, what distance does to a
           real cloud: you stop seeing the small stuff first. */
        'float fbm(vec2 p, float lod){',
        '  float v = 0.0, a = 0.5, w = 0.0;',
        '  for (int i = 0; i < 5; i++) {',
        '    float k = a * clamp(lod * 4.0 - float(i) + 1.0, 0.0, 1.0);',
        '    v += k * vnoise(p);',
        '    w += k;',
        '    p = p * 2.03 + vec2(1.7, 9.2);',
        '    a *= 0.5;',
        '  }',
        '  return v / max(w, 1e-4);',
        '}',

        /* Stars, for the course that is played after dark. A hash grid on the
           sphere's own angles: one cell in twenty holds a star, and each one
           twinkles on a period of its own. It costs two hashes and it is the
           difference between a night sky and a dark ceiling. */
        'float stars(vec3 d){',
        '  vec2 uv = vec2(atan(d.z, d.x), asin(clamp(d.y, -1.0, 1.0))) * 46.0;',
        '  vec2 gi = floor(uv), gf = fract(uv) - 0.5;',
        '  float r = hash21(gi);',
        '  if (r < 0.95) return 0.0;',
        '  float mag = hash21(gi + 3.7);',
        '  return smoothstep(0.34, 0.02, length(gf)) * (0.25 + 0.75 * mag);',
        '}',

        'void main(){',
        '  vec3 d = normalize(vDir);',
        '  float h = d.y;',
        '  vec3 sky = mix(bottom, top, smoothstep(-0.12, 0.62, h));',
        '  if (starI > 0.001) sky += vec3(0.85, 0.90, 1.0) * stars(d) * starI * smoothstep(0.0, 0.28, h);',

        '  float sd = max(dot(d, sunDir), 0.0);',
        // A disc a couple of degrees across — bigger than the real one, which
        // is what every photograph of a sun looks like anyway — plus two
        // widths of halo so the air round it reads as air.
        '  float disc = smoothstep(0.9986, 0.9997, sd) * 3.2;',
        '  float glow = pow(sd, 22.0) * 0.42 + pow(sd, 4.0) * 0.09;',
        '  sky += sunColour * (disc * sharp + glow * (0.3 + 0.7 * sharp)) * sunI;',

        '  if (h > 0.0) {',
        // The ray is dropped onto a flat sheet overhead: divide the direction
        // by its own height and you have where it crosses. max() keeps the
        // last few degrees above the horizon from dividing by nothing.
        '    float hh = max(h, 0.07);',
        '    vec2 uv = d.xz / hh * 1.6 + drift;',
        '    float lod = smoothstep(0.04, 0.34, hh);',
        '    float f = fbm(uv, lod);',
        '    float lit = fbm(uv + normalize(sunDir.xz + vec2(1e-3)) * 0.5, lod);',
        '    float edge = mix(0.58, 0.06, cover);',
        '    float a = smoothstep(edge, edge + 0.26, f) * smoothstep(hazeTop * 0.3, hazeTop + 0.24, h);',
        '    vec3 cc = mix(cloudBase, cloudTop, clamp((f - lit) * 2.4 + 0.62, 0.0, 1.0));',
        '    cc += sunColour * pow(sd, 10.0) * 0.55 * sunI;',
        '    sky = mix(sky, cc, a * 0.96);',
        '  }',

        /* Meet the fog at the horizon, so the ground plane and the sky end in
           the same colour and the join is a haze rather than a seam. How far
           up that haze reaches is the weather's business: a clear day gives it
           the last few degrees, a sea fog gives it a third of the sky, and
           without that the fog would swallow the water and then stop dead at a
           horizon with a hard-edged cloud deck sitting on it. */
        '  sky = mix(sky, fogColour, smoothstep(hazeTop, -0.04, h));',
        '  gl_FragColor = vec4(sky, 1.0);',
        '}'
    ].join('\n');

    function skyDome(theme, weather) {
        var mat = new THREE.ShaderMaterial({
            side: THREE.BackSide, depthWrite: false, fog: false,
            uniforms: {
                top: { value: skyTint(theme.sky[0], weather, true) },
                bottom: { value: skyTint(theme.sky[1], weather, true) },
                /* Not converted, unlike everything else in here. This is the
                   colour the horizon has to *match*, and what it is matching
                   is three.js's own fog on the lit materials — which reads the
                   hex as a linear value, the way this game's whole palette
                   does. Convert it and the sky ends a visibly different colour
                   from the ground it is supposed to be meeting, which is a
                   seam right across the middle of the picture. */
                fogColour: { value: skyTint(theme.fog, weather, false) },
                sunColour: { value: lin(theme.sun) },
                // Cloud colours are written for daylight. On the course that
                // is played after dark the same cloud is lit by a fraction as
                // much, and a white one over a night sky reads as a hole in it.
                cloudTop: { value: lin(weather.cloudTop).multiplyScalar(theme.cloudLum || 1) },
                cloudBase: { value: lin(weather.cloudBase).multiplyScalar(theme.cloudLum || 1) },
                sunDir: { value: new THREE.Vector3(0, 1, 0) },
                cover: { value: weather.cloud },
                sunI: { value: weather.sun },
                sharp: { value: weather.sunSharp },
                // Thick air, tall haze. Clamped so a clear sky still gets a
                // few degrees of it rather than a hard edge at the water line.
                hazeTop: { value: Math.max(0.10, Math.min(0.34, 0.40 - 0.17 * weather.fog)) },
                // Only after dark, and a solid overcast puts them out.
                starI: { value: (theme.stars || 0) * (1 - weather.cloud * 0.85) },
                drift: { value: new THREE.Vector2() }
            },
            vertexShader: SKY_VS,
            fragmentShader: SKY_FS
        });
        var mesh = new THREE.Mesh(new THREE.SphereGeometry(180, 32, 20), mat);
        mesh.renderOrder = -1;
        R.sky = mat;
        return mesh;
    }

    function tiled(base, w, d, scale) {
        var tex = base.clone();
        tex.needsUpdate = true;
        tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
        tex.anisotropy = R.maxAniso;      // the grazing angles are most of the view
        tex.repeat.set(Math.max(1, w / scale), Math.max(1, d / scale));
        return tex;
    }

    // An extruded slab's cap is UV-mapped in the shape's own coordinates —
    // world units — where a box's cap runs 0..1. Same texture, different
    // repeat, or the green around the cup comes out a hundred times too big.
    function tiledCap(base, w, d, scale, worldUv) {
        if (!worldUv) return tiled(base, w, d, scale);
        var tex = base.clone();
        tex.needsUpdate = true;
        tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
        tex.anisotropy = R.maxAniso;
        tex.repeat.set(1 / scale, 1 / scale);    // UVs are already world units
        return tex;
    }

    /* Every surface is Phong now, which sounds like a cost and is not: with a
       black specular a Phong material is a Lambert material, and what it buys
       is one number — how wet the ground is. Rain darkens a surface and makes
       it shine, and doing that to the sand and the boards as well as the green
       is the difference between "it is raining" and "there is rain in front of
       the screen". */
    function padMaterial(kind, theme, w, d, worldUv) {
        var wet = R.weather ? (R.weather.wet || 0) : 0;
        var side = new THREE.MeshLambertMaterial({
            color: new THREE.Color(theme.side).multiplyScalar(1 - wet * 0.20)
        });
        var top;
        // Wet ground is darker ground, whatever it is made of.
        function damp() { return new THREE.Color(1, 1, 1).multiplyScalar(1 - wet * 0.24); }
        if (kind === 'sand') {
            top = new THREE.MeshPhongMaterial({
                map: tiledCap(R.tex.sand, w, d, 2, worldUv),
                color: damp(), shininess: 4 + wet * 60, specular: new THREE.Color(0x000000).lerp(new THREE.Color(0x9aa4ac), wet)
            });
        } else if (kind === 'wood') {
            top = new THREE.MeshPhongMaterial({
                map: tiledCap(R.tex.wood, w, d, 2, worldUv),
                color: damp(), shininess: 8 + wet * 80, specular: new THREE.Color(0x151515).lerp(new THREE.Color(0xb0bcc4), wet)
            });
        } else if (kind === 'rough') {
            top = new THREE.MeshPhongMaterial({
                map: tiledCap(R.tex.rough, w, d, 2, worldUv),
                color: damp(), shininess: 3 + wet * 40, specular: new THREE.Color(0x000000).lerp(new THREE.Color(0x7d8a92), wet)
            });
        } else {
            // The greens get the most of everything: a bump map of the same
            // blades that are in the colour map, so the light rakes across the
            // mow bands rather than lying on them flat.
            top = new THREE.MeshPhongMaterial({
                map: tiledCap(R.tex.grass, w, d, 3.5, worldUv),
                bumpMap: tiledCap(R.tex.grassBump, w, d, 0.8, worldUv),
                bumpScale: 0.035 + wet * 0.02,
                color: damp(),
                // Wet grass is dark and sheeny, not glittery: a bump map under
                // a hard specular puts a white speck on every blade and the
                // green comes out looking like frost.
                shininess: 4 + wet * 22,
                specular: new THREE.Color(0x1c2a18).lerp(new THREE.Color(0x4a5a60), wet)
            });
        }
        // Box material order is +x, -x, +y, -y, +z, -z; an extruded slab has
        // just two groups, caps then walls. Passing six covers both, since the
        // slab only ever reads the first two — so cap first, wall second.
        return worldUv ? [top, side] : [side, side, top, side, side, side];
    }

    /* The lit materials in this game hand three.js an sRGB hex as if it were a
       linear albedo and have always looked the way they look because of it —
       that is the palette, and changing it now would be a different game. The
       two *unlit* shaders, the sky and the water, have no lighting to bring
       them back down, so a raw hex out of one of those comes out a stop and a
       half too pale. They get the conversion the palette never had. */
    function lin(hex) {
        var c = new THREE.Color(hex);
        return c.convertSRGBToLinear ? c.convertSRGBToLinear() : c;
    }

    /* The sky, the fog and the horizon are one colour scheme and the weather
       has to be allowed to move all three together. A golden hour that warms
       the light but leaves a noon-blue sky behind it reads as a filter over a
       photograph rather than as an evening. */
    function skyTint(hex, weather, linear) {
        var c = linear ? lin(hex) : new THREE.Color(hex);
        if (weather && weather.tintSky) {
            c.lerp(linear ? lin(weather.tintSky) : new THREE.Color(weather.tintSky),
                weather.tintAmt === undefined ? 0.4 : weather.tintAmt);
        }
        return c;
    }

    var PLANK_THICK = 0.3;

    var FLAG_W = 0.76;

    /* Pads are drawn as boxes whose underside reaches the surrounding ground,
       so a raised green reads as a plateau with a cliff instead of a slab
       hovering in the air. Boards are the exception: a jetty is supposed to
       look like a plank over the water, not a causeway through it. */
    /* The pad that holds the cup is built as an extruded shape with a circular
       hole in it rather than as a box, so the hole in the picture is the hole
       the ball falls through. Everything else stays a box: this costs a
       triangulation, and only one pad per hole needs it. */
    function punchedSlab(pad, thick, cup) {
        var shape = new THREE.Shape();
        var hw = pad.w / 2, hd = pad.d / 2;
        // Built around the pad's centre, in the plane three.js extrudes; after
        // the rotation below, shape-y runs along world -z.
        shape.moveTo(-hw, -hd);
        shape.lineTo(hw, -hd);
        shape.lineTo(hw, hd);
        shape.lineTo(-hw, hd);
        shape.lineTo(-hw, -hd);

        var hole = new THREE.Path();
        var cx = pad.x + hw, cz = pad.z + hd;
        hole.absarc(cup.x - cx, -(cup.z - cz), C.HOLE_R, 0, Math.PI * 2, true);
        shape.holes.push(hole);

        var geo = new THREE.ExtrudeGeometry(shape, {
            depth: thick, bevelEnabled: false, curveSegments: 28
        });
        geo.rotateX(-Math.PI / 2);       // lay it flat: extrusion now runs +y
        geo.translate(0, -thick, 0);     // top face at y = 0, like the box
        return geo;
    }

    function addPad(group, pad, theme, cup) {
        var cx = pad.x + pad.w / 2, cz = pad.z + pad.d / 2;
        var sx = pad.sx || 0, sz = pad.sz || 0;
        var cy = P.padHeight(pad, cx, cz);
        var rise = (Math.abs(sx) * pad.w + Math.abs(sz) * pad.d) / 2;
        var thick = pad.kind === 'wood'
            ? PLANK_THICK
            : Math.max(0.6, cy - (theme.surroundY - 0.4) + rise);
        var holed = cup && P.padContains(pad, cup.x, cup.z) &&
            Math.abs(P.padHeight(pad, cup.x, cup.z) - cup.y) < 0.06;
        var geo = holed
            ? punchedSlab(pad, thick, cup)
            : new THREE.BoxGeometry(pad.w, thick, pad.d);
        if (holed) {
            // The box is centred on its own middle; the extruded slab is built
            // that way too, so both share the placement below.
            geo.translate(0, thick / 2, 0);
        }
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
        var mesh = new THREE.Mesh(geo, padMaterial(pad.kind, theme, pad.w, pad.d, holed));
        mesh.position.set(cx, cy - thick / 2, cz);
        mesh.receiveShadow = true;
        mesh.castShadow = true;
        group.add(mesh);
    }

    function addWall(group, wall, theme) {
        var B = P.wallBox(wall, 0);
        var geo = new THREE.BoxGeometry(wall.w, wall.h, wall.d);
        var color = wall.kind === 'blade' ? 0xd8523f
            : wall.kind === 'gate' ? 0xe0a13a
            : wall.kind === 'beam' ? 0x9a6a3c
            : theme.rail;
        var wet = R.weather ? (R.weather.wet || 0) : 0;
        // A painted rail has a sheen on it in any weather and a hard one in the
        // rain; it is also the brightest thing on most holes, which is what
        // gives the bloom something to find.
        var mat = new THREE.MeshPhongMaterial({
            color: new THREE.Color(color).multiplyScalar(1 - wet * 0.16),
            shininess: 22 + wet * 80,
            specular: new THREE.Color(0x2a2f33).lerp(new THREE.Color(0xaab6bd), wet)
        });
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

    /* ── water ──────────────────────────────────────────────────────────

       The sea used to be a blue box with a scrolling ripple texture painted on
       it, and from a low camera it read as lino. It is now a shader, and the
       thing that makes it read as water is not the waves — it is the Fresnel
       term: water is nearly a mirror at a grazing angle and nearly transparent
       looking straight down, so the horizon takes the colour of the sky and
       the near edge keeps the colour of the water. Every other trick here is
       secondary to that one.

       The surface itself is four directional waves summed and differentiated
       by hand. Because the derivative is analytic there is no normal map to
       tile, nothing to align to the shore, and the whole thing costs about a
       dozen instructions; because they travel on the wind vector, the sea gets
       rougher when the flag does.

       Rain lands on it. A hash grid picks a drop per cell and a ring expands
       out of it, tilting the normal as it goes — which is enough for a squall
       to be visible on the water from the tee. */

    var WATER_VS = [
        'varying vec3 vWorld;',
        'void main(){',
        '  vec4 wp = modelMatrix * vec4(position, 1.0);',
        '  vWorld = wp.xyz;',
        '  gl_Position = projectionMatrix * viewMatrix * wp;',
        '}'
    ].join('\n');

    var WATER_FS = [
        'uniform vec3 deep, shallow, skyColour, sunColour, fogColour, sunDir;',
        'uniform float time, gloss, rain, fogNear, fogFar, alpha, chop;',
        'uniform vec2 wind;',
        'varying vec3 vWorld;',

        // One travelling wave, accumulated as a slope rather than a height:
        // the height is never needed, only what it does to the normal.
        'void wave(inout vec2 g, vec2 dir, float freq, float amp, float speed, vec2 p, float t){',
        '  g += dir * (cos(dot(p, dir) * freq + t * speed) * amp * freq);',
        '}',

        'void main(){',
        '  vec2 p = vWorld.xz;',
        '  float t = time;',
        '  vec2 w = normalize(wind + vec2(1e-3));',
        '  vec2 wp = vec2(-w.y, w.x);',
        /* Five trains, and every number in here is chosen not to divide into
           the others. Harmonic frequencies on similar bearings beat against
           each other into a plaid that reads as a tiled texture the moment the
           camera goes overhead — which is exactly what this replaced. */
        '  vec2 g = vec2(0.0);',
        '  wave(g, w, 1.27, 0.046 * chop, 1.31, p, t);',
        '  wave(g, normalize(w + wp * 0.75), 2.11, 0.026 * chop, 1.77, p, t);',
        '  wave(g, normalize(w - wp * 1.35), 3.67, 0.014 * chop, 2.39, p, t);',
        '  wave(g, normalize(-w + wp * 0.45), 6.31, 0.0072 * chop, 3.07, p, t);',
        '  wave(g, normalize(w * 0.35 - wp), 9.87, 0.0036 * chop, 4.13, p, t);',

        '  if (rain > 0.001) {',
        '    vec2 cell = floor(p * 2.2);',
        '    vec2 f = fract(p * 2.2) - 0.5;',
        '    float r = length(f) + 1e-4;',
        '    float seed = fract(sin(dot(cell, vec2(21.98, 78.23))) * 4375.85);',
        '    float ph = fract(t * 0.75 + seed);',
        '    float ring = sin((r - ph * 0.55) * 46.0) * exp(-r * 7.0) * (1.0 - ph);',
        '    g += (f / r) * ring * 0.55 * rain;',
        '  }',

        '  vec3 n = normalize(vec3(-g.x, 1.0, -g.y));',
        '  vec3 v = normalize(cameraPosition - vWorld);',
        '  float ndv = max(dot(n, v), 0.0);',

        // Schlick, with water's 0.02 at normal incidence. This is the whole
        // trick: a mirror at the horizon, a pond at your feet.
        '  float fres = 0.02 + 0.98 * pow(1.0 - ndv, 5.0);',
        '  vec3 body = mix(deep, shallow, clamp(ndv * 1.25, 0.0, 1.0));',
        '  vec3 col = mix(body, skyColour, clamp(fres, 0.0, 0.92));',

        // Sun glint. Two exponents: a broad sheen and the hard sparkle on the
        // crests, which is the part that makes it move.
        '  vec3 hv = normalize(sunDir + v);',
        '  float spec = max(dot(n, hv), 0.0);',
        '  col += sunColour * pow(spec, 48.0) * 0.34 * gloss;',
        '  col += sunColour * pow(spec, 320.0) * 1.10 * gloss;',

        '  float depth = length(cameraPosition - vWorld);',
        '  col = mix(col, fogColour, smoothstep(fogNear, fogFar, depth));',
        '  gl_FragColor = vec4(col, alpha);',
        '}'
    ].join('\n');

    function waterMaterial(theme, opts) {
        var deep = lin(theme.water);
        var shallow = deep.clone().lerp(lin(0xffffff), 0.18);
        var mat = new THREE.ShaderMaterial({
            uniforms: {
                deep: { value: deep },
                shallow: { value: shallow },
                skyColour: { value: lin(theme.sky[1]) },
                sunColour: { value: lin(theme.sun) },
                fogColour: { value: new THREE.Color(theme.fog) },   // see skyDome
                sunDir: { value: new THREE.Vector3(0, 1, 0) },
                time: { value: 0 },
                gloss: { value: 1 },
                chop: { value: 1 },
                rain: { value: 0 },
                fogNear: { value: 24 },
                fogFar: { value: 95 },
                alpha: { value: opts && opts.alpha !== undefined ? opts.alpha : 1 },
                wind: { value: new THREE.Vector2(0.4, 0.9) }
            },
            vertexShader: WATER_VS,
            fragmentShader: WATER_FS,
            transparent: !!(opts && opts.alpha !== undefined && opts.alpha < 1)
        });
        R.waterMats.push(mat);
        return mat;
    }

    function addWater(group, w, theme) {
        // A box rather than a plane: the pads reach down to the surrounding
        // ground, so a pond between two of them is a filled channel, and a
        // sheet floating in the gap would read as a decal. Only the top face
        // gets the water shader; the sides are the murk underneath it.
        var depth = Math.max(0.6, w.y - theme.surroundY + 0.2);
        var murk = new THREE.MeshLambertMaterial({
            color: new THREE.Color(theme.water).multiplyScalar(0.45)
        });
        var top = waterMaterial(theme, { alpha: 0.9 });
        // Box material order: +x, -x, +y, -y, +z, -z.
        var mesh = new THREE.Mesh(new THREE.BoxGeometry(w.w, depth, w.d),
            [murk, murk, top, murk, murk, murk]);
        mesh.position.set(w.x + w.w / 2, w.y - depth / 2, w.z + w.d / 2);
        group.add(mesh);
    }

    function addSurround(group, hole, theme) {
        var mat;
        if (theme.surround === 'water') {
            mat = waterMaterial(theme, {});
        } else {
            var rt = rockTexture(theme.surround === 'rock' ? (theme.ground || '#9c8466') : (theme.floor || '#3f4450'));
            rt.wrapS = rt.wrapT = THREE.RepeatWrapping;
            rt.anisotropy = R.maxAniso;
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
    }

    /* The hole through the green is real geometry (see punchedSlab); what is
       added here is the liner that makes the shaft read as a shaft, the floor
       the ball comes to rest on, the white rim, and the pin.

       **The pin stands in the cup**, which is where a pin stands. It used to
       be planted beside it, on the grounds that a flagstick down the middle of
       a hole this size is something the ball ought to hit and would instead go
       straight through — an honest dodge that made every hole look wrong. It
       stands vertical, as a real flagstick does; the ball passes through the
       green geometry around the cup, not through the pin itself.

       The pin also does a job nothing else on the course does: it is the only
       instrument telling you what the wind is doing. The cloth streams
       downwind, snaps in a gust and hangs limp when it drops — so a glance at
       the flag is a reading, not a decoration. */
    function addCup(group, hole) {
        var cup = hole.cup;

        var liner = new THREE.Mesh(
            new THREE.CylinderGeometry(C.HOLE_R - 0.004, C.HOLE_R - 0.004, C.CUP_DEPTH, 28, 1, true),
            new THREE.MeshLambertMaterial({ color: 0x14170f, side: THREE.BackSide })
        );
        liner.position.set(cup.x, cup.y - C.CUP_DEPTH / 2, cup.z);
        group.add(liner);

        var floor = new THREE.Mesh(
            new THREE.CircleGeometry(C.HOLE_R, 28),
            new THREE.MeshLambertMaterial({ color: 0x1d2416 })
        );
        floor.rotation.x = -Math.PI / 2;
        floor.position.set(cup.x, cup.y - C.CUP_DEPTH, cup.z);
        floor.receiveShadow = true;
        group.add(floor);

        var rim = new THREE.Mesh(
            new THREE.RingGeometry(C.HOLE_R - 0.005, C.HOLE_R + 0.045, 32),
            new THREE.MeshBasicMaterial({ color: 0xf2f5f0, side: THREE.DoubleSide })
        );
        rim.rotation.x = -Math.PI / 2;
        rim.position.set(cup.x, cup.y + 0.006, cup.z);
        group.add(rim);
        R.cupMesh = rim;

        /* The pin. Everything below hangs off one group standing at the
           centre of the cup, tilted away down the line of play, so the lean is
           set once and the flag, the ferrule and the wobble all inherit it. */
        var away = Math.atan2(cup.x - hole.tee.x, cup.z - hole.tee.z);
        var pin = new THREE.Group();
        pin.position.set(cup.x, cup.y - C.CUP_DEPTH + 0.01, cup.z);
        pin.rotation.y = away;             // a real flagstick stands vertical
        group.add(pin);
        R.pin = pin;
        R.pinLean = 0;

        var H = 2.25;
        var pole = new THREE.Mesh(
            new THREE.CylinderGeometry(0.021, 0.030, H, 10),
            new THREE.MeshPhongMaterial({ color: 0xf4f6f4, shininess: 40, specular: 0x556066 })
        );
        pole.position.y = H / 2;
        pole.castShadow = true;
        pin.add(pole);
        R.flagPole = pole;

        // The weighted foot that sits on the floor of the cup, and the black
        // band at the lip: both are what a real flagstick has, and between
        // them they stop the pole reading as a wire pushed into the grass.
        var foot = new THREE.Mesh(
            new THREE.CylinderGeometry(0.055, 0.075, 0.07, 12),
            new THREE.MeshLambertMaterial({ color: 0x23262a })
        );
        foot.position.y = 0.035;
        pin.add(foot);

        var band = new THREE.Mesh(
            new THREE.CylinderGeometry(0.033, 0.033, 0.16, 10),
            new THREE.MeshLambertMaterial({ color: 0x23262a })
        );
        band.position.y = C.CUP_DEPTH + 0.10;
        pin.add(band);

        /* The cloth turns about the pole rather than with the hole, because a
           flag points where the wind is going and nowhere else. It is built
           with its hoist at the origin so that rotating the group swings it
           round the stick instead of round its own middle. */
        var swivel = new THREE.Group();
        swivel.position.y = H - 0.10;
        pin.add(swivel);
        R.flagSwivel = swivel;

        var cloth = new THREE.Mesh(
            new THREE.PlaneGeometry(FLAG_W, 0.43, 14, 3),
            new THREE.MeshPhongMaterial({
                color: 0xe23b3b, side: THREE.DoubleSide, shininess: 6, specular: 0x2a1010
            })
        );
        cloth.geometry.translate(FLAG_W / 2, -0.215, 0);   // hoist at the origin
        cloth.castShadow = true;
        swivel.add(cloth);
        R.flagCloth = cloth;
        R.flagRest = cloth.geometry.attributes.position.array.slice();
        R.pinShake = 0;
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

    /* Three lights, and the weather sets all three.

       The sun is the one that changes most: overcast takes it down to a fifth
       and hands the difference to the sky, which is exactly what a cloud does,
       and the golden-hour kinds drop it towards the horizon and warm it, which
       is what gives those holes their long shadows. The shadow *softens* with
       the cloud rather than merely fading, by widening the sampling radius —
       a sharp shadow under a solid overcast is the single loudest way to tell
       a player that the sky is a picture.

       The third is a fill from the opposite side at a fraction of the sun's
       strength. Without it the shaded face of every rail on the course is the
       flat ambient colour and the hole reads as a diagram; with it there is a
       bounce off the ground and the boxes turn into objects. */
    function lights(group, hole, theme, weather) {
        var cx = (hole.bounds.minX + hole.bounds.maxX) / 2;
        var cz = (hole.bounds.minZ + hole.bounds.maxZ) / 2;

        /* The fill light is the sky, so it is the same colour as the sky: an
           overcast one goes grey, a golden one goes orange. Skipping this is
           what leaves a sunset looking like a warm filter over a scene still
           lit by a blue afternoon. */
        var skyLight = skyTint(theme.ambient, weather, false);
        if (weather.cloud > 0.6) skyLight.lerp(new THREE.Color(0xc6d2de), (weather.cloud - 0.6) * 1.2);
        var amb = new THREE.HemisphereLight(skyLight, 0x3c4436, theme.ambientI * weather.amb);
        group.add(amb);

        var sunColour = new THREE.Color(weather.warm || theme.sun);
        var pos = theme.sunPos;
        // A low sun is a long shadow: pull the height down and push the reach
        // out, keeping the bearing the hole was designed around.
        var lift = weather.low ? 0.30 : 1;
        var reach = weather.low ? 1.9 : 1;
        var sun = new THREE.DirectionalLight(sunColour, 0.95 * weather.sun);
        sun.position.set(cx + pos[0] * reach, Math.max(2.5, pos[1] * lift), cz + pos[2] * reach);
        sun.target.position.set(cx, 0, cz);
        sun.castShadow = true;
        var span = Math.max(hole.bounds.maxX - hole.bounds.minX, hole.bounds.maxZ - hole.bounds.minZ) * 0.75 + 4;
        sun.shadow.camera.left = -span;
        sun.shadow.camera.right = span;
        sun.shadow.camera.top = span;
        sun.shadow.camera.bottom = -span;
        sun.shadow.camera.near = 1;
        sun.shadow.camera.far = 120;
        sun.shadow.mapSize.set(2048, 2048);
        sun.shadow.bias = -0.0009;
        sun.shadow.normalBias = 0.02;
        sun.shadow.radius = 1.5 + weather.cloud * 4.5;
        group.add(sun);
        group.add(sun.target);
        R.sun = sun;
        R.sunDir.set(pos[0] * reach, Math.max(2.5, pos[1] * lift), pos[2] * reach).normalize();

        var fill = new THREE.DirectionalLight(skyLight, 0.16 + weather.cloud * 0.10);
        fill.position.set(cx - pos[0], Math.abs(pos[1]) * 0.45, cz - pos[2]);
        fill.target.position.set(cx, 0, cz);
        group.add(fill);
        group.add(fill.target);
    }

    /* A hole is built once, and the weather it is built under is baked into
       every material in it — the wetness of the grass, the softness of the
       shadows, the colour of the fill. That is why changing the weather
       rebuilds the hole rather than tweening: half of it is uniforms and would
       tween beautifully, and the other half is material state that would not,
       and a hole that is half sunny is worse than a cut. */
    function buildHole(hole, themeName, weatherKind) {
        var theme = THEMES[themeName] || THEMES.seaside;
        var W = G3.weather;
        var weather = weatherKind || (W ? W.now : null) || { cloud: 0.4, fog: 1.3, sun: 1, amb: 1, sunSharp: 1, cloudTop: '#ffffff', cloudBase: '#b9c6d4', grade: {} };
        R.theme = theme;
        R.weather = weather;
        if (R.holeGroup) disposeGroup(R.holeGroup);
        R.movers = [];
        R.waterMats = [];

        // One grass texture per hole, and the last one goes with it: the pad
        // materials hold clones, which disposeGroup has already taken.
        if (R.tex.grass) R.tex.grass.dispose();
        R.tex.grass = grassTexture(theme);

        var g = new THREE.Group();
        // The weather scales the theme's own fog, which is what makes mist a
        // different hole rather than a different filter over the same one.
        R.fogNear = 24 * weather.fog;
        R.fogFar = 95 * weather.fog;
        R.scene.fog = new THREE.Fog(skyTint(theme.fog, weather, false), R.fogNear, R.fogFar);
        g.add(skyDome(theme, weather));
        lights(g, hole, theme, weather);
        addSurround(g, hole, theme);

        var i;
        for (i = 0; i < hole.pads.length; i++) addPad(g, hole.pads[i], theme, hole.cup);
        for (i = 0; i < hole.walls.length; i++) addWall(g, hole.walls[i], theme);
        for (i = 0; i < hole.water.length; i++) addWater(g, hole.water[i], theme);
        addCup(g, hole);
        addTeeMark(g, hole);

        // The rain, the mist banks and whatever is drifting in the air are
        // parented to the hole, so the next hole disposes them with it.
        if (W) g.add(W.build(hole, theme, weather));
        if (R.fx) G3.postfx.setGrade(weather.grade);

        // Every water shader on the hole is told the same sky it is going to
        // be reflecting, once, here.
        for (i = 0; i < R.waterMats.length; i++) {
            var u = R.waterMats[i].uniforms;
            u.sunDir.value.copy(R.sunDir);
            u.sunColour.value.copy(lin(weather.warm || theme.sun));
            u.gloss.value = weather.sun;
            u.rain.value = weather.rain || 0;
            u.fogNear.value = R.fogNear;
            u.fogFar.value = R.fogFar;
            // An overcast sea reflects an overcast sky, not the blue one the
            // theme was drawn against.
            u.skyColour.value.copy(skyTint(theme.sky[1], weather, true)).lerp(lin(weather.cloudBase), weather.cloud * 0.8);
            u.fogColour.value.copy(skyTint(theme.fog, weather, false));
        }
        if (R.sky) R.sky.uniforms.sunDir.value.copy(R.sunDir);

        R.scene.add(g);
        R.holeGroup = g;
        R.smooth.started = false;
        R.clock = 0;
        R.cam.kick = 0;
        R.cam.speedPull = 0;
        clearTrail();
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
        var rawFrac = Math.max(0, Math.min(1, aim.power / C.MAX_POWER));
        // The wedge and band keep a floor so the shot direction is always
        // visible; the ring below uses the real fraction so it reads 0% at 0%.
        var frac = Math.max(0.08, rawFrac);
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

        // Green through amber to red as the swing fills, and hard red once it
        // is into the last of it.
        var hue = frac > C.OVERSWING ? 0 : 0.33 * (1 - frac / C.OVERSWING);
        R.arrow.material.color.setHSL(hue, 0.85, frac > C.OVERSWING ? 0.62 : 0.55);

        // The band, stretched out behind the ball by the same fraction.
        var ba = R.band.geometry.attributes.position.array;
        var back = 0.26 + frac * 2.2;
        function bandPut(i, sx, sz) {
            ba[i * 3] = b.x - dirX * sx + px * sz;
            ba[i * 3 + 1] = y;
            ba[i * 3 + 2] = b.z - dirZ * sx + pz * sz;
        }
        var tip = 0.05 + frac * 0.03;
        bandPut(0, 0.18, -0.13); bandPut(1, 0.18, 0.13); bandPut(2, back, tip);
        bandPut(3, 0.18, -0.13); bandPut(4, back, tip); bandPut(5, back, -tip);
        R.band.geometry.attributes.position.needsUpdate = true;
        R.band.geometry.computeBoundingSphere();
        R.band.material.color.copy(R.arrow.material.color);
        R.band.material.opacity = 0.25 + frac * 0.4;

        // The ring fills clockwise from the shot line as the power winds on.
        R.ring.position.set(b.x, y, b.z);
        R.ring.rotation.z = -aim.yaw;
        R.ring.geometry.setDrawRange(0, Math.max(3, Math.floor(R.ringCount * rawFrac / 3) * 3));
        R.ring.material.color.copy(R.arrow.material.color);
        R.ring.visible = rawFrac > 0.02;

        // Touch is too coarse to load an exact number, so the plane spans a
        // spread of power either side of what is loaded — its two edges are
        // the lightest and heaviest this shot could actually be, and its
        // width at any point is how much air time is still in question there.
        var lo = Math.max(C.MIN_POWER, aim.power * 0.82);
        var hi = Math.min(C.MAX_POWER, aim.power * 1.18);
        var seconds = 0.5 + frac * 0.5;
        var perPath = R.pathPerPath;
        var i, k;

        var loPts = P.previewPath(world, aim.yaw, lo, aim.loft, seconds);
        var hiPts = P.previewPath(world, aim.yaw, hi, aim.loft, seconds);
        var midPts = P.previewPath(world, aim.yaw, aim.power, aim.loft, seconds);

        var turn = -1;
        for (i = 1; i < midPts.length; i++) {
            if (midPts[i].bounce) { turn = i; break; }
        }

        var nSamples = Math.min(perPath, Math.min(loPts.length, hiPts.length));
        var segCount = Math.max(0, nSamples - 1);
        var turnFrac = (turn >= 0 && midPts.length > 1) ? turn / (midPts.length - 1) : -1;
        var turnSample = turnFrac >= 0 ? Math.round(turnFrac * segCount) : -1;

        var loArr = [], hiArr = [];
        for (i = 0; i < nSamples; i++) {
            var kl = Math.min(loPts.length - 1, Math.round(i * ((loPts.length - 1) / Math.max(1, nSamples - 1))));
            var kh = Math.min(hiPts.length - 1, Math.round(i * ((hiPts.length - 1) / Math.max(1, nSamples - 1))));
            loArr.push(loPts[kl]);
            hiArr.push(hiPts[kh]);
        }

        var pos = R.pathPlane.geometry.attributes.position.array;
        var col = R.pathPlane.geometry.attributes.color.array;
        for (i = 0; i < perPath - 1; i++) {
            var base = i * 6;
            if (i < segCount) {
                var shade = (1 - (i / segCount) * 0.4) * ((turnSample >= 0 && i >= turnSample) ? 0.5 : 1);
                putPathQuad(pos, base, loArr[i], hiArr[i], hiArr[i + 1], loArr[i + 1]);
                setPathQuadShade(col, base, shade);
            } else {
                for (var v = 0; v < 6; v++) pos[(base + v) * 3 + 1] = -999;
            }
        }
        R.pathPlane.geometry.attributes.position.needsUpdate = true;
        R.pathPlane.geometry.attributes.color.needsUpdate = true;
        R.pathPlane.geometry.computeBoundingSphere();

        // The arrowhead: where the loaded shot itself lands, or first meets a
        // wall — the one point in the plane that is actually being aimed at.
        var headIdx = turn >= 0 ? turn : midPts.length - 1;
        var headPos = midPts[headIdx];
        var prevPos = midPts[Math.max(0, headIdx - 1)];
        var hdx = headPos.x - prevPos.x, hdz = headPos.z - prevPos.z;
        var hlen = Math.hypot(hdx, hdz) || 1;
        hdx /= hlen; hdz /= hlen;
        var hpx = -hdz, hpz = hdx;
        var hs = 0.14 + frac * 0.05;
        var hp = R.pathHead.geometry.attributes.position.array;
        hp[0] = headPos.x - hpx * hs; hp[1] = headPos.y; hp[2] = headPos.z - hpz * hs;
        hp[3] = headPos.x + hpx * hs; hp[4] = headPos.y; hp[5] = headPos.z + hpz * hs;
        hp[6] = headPos.x + hdx * hs * 2; hp[7] = headPos.y; hp[8] = headPos.z + hdz * hs * 2;
        R.pathHead.geometry.attributes.position.needsUpdate = true;
        R.pathHead.geometry.computeBoundingSphere();
        R.pathHead.material.color.copy(R.arrow.material.color);
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
            /* Two things move the camera besides the player: it flinches when
               the ball is struck, and it drifts back as the ball gets quick, so
               a hard shot feels quick rather than merely distant. */
            var dist = c.dist + c.speedPull - c.kick * C.KICK * 4;
            tx = ball.x; ty = ball.y + 0.35; tz = ball.z;
            var back = dist * Math.cos(c.pitch);
            px = ball.x - Math.sin(c.yaw) * back;
            py = ball.y + dist * Math.sin(c.pitch);
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
        rollBall(world.ball);

        /* Speed, spent two ways: the camera eases back and the lens opens a
           little, both of which read as "this one is going somewhere". */
        var speed = Math.hypot(world.ball.vx, world.ball.vy, world.ball.vz);
        var wantPull = Math.min(3.2, speed * 0.14);
        var wantFov = 52 + Math.min(7, speed * 0.4);
        var ease = 1 - Math.pow(0.06, dt);
        R.cam.speedPull += (wantPull - R.cam.speedPull) * ease;
        if (Math.abs(R.camera.fov - wantFov) > 0.05) {
            R.camera.fov += (wantFov - R.camera.fov) * ease;
            R.camera.updateProjectionMatrix();
        }
        R.cam.kick *= Math.pow(0.008, dt);
        if (R.cam.kick < 0.002) R.cam.kick = 0;

        // The tail only follows a ball that is actually going somewhere.
        if (world.moving && speed > 1.2) {
            R.trailOn = true;
            pushTrail(world.ball.x, world.ball.y, world.ball.z);
        } else if (R.trailOn) {
            R.trailOn = false;
            clearTrail();
        }

        updateAim(world, aim);
        stepParticles(dt);
        updateCamera(world.hole, world.ball, dt);

        // The weather runs off the camera, so it is stepped after the camera
        // has finished moving: the rain column, the motes and the mist banks
        // all follow it, and a frame's lag shows as a jitter at the edges.
        var wind = { x: 0.4, z: 0.9, speed: 0.5 };
        if (G3.weather) {
            G3.weather.update(dt, R.camera);
            wind = G3.weather.wind;
        }

        var i;
        for (i = 0; i < R.waterMats.length; i++) {
            var u = R.waterMats[i].uniforms;
            u.time.value = R.clock;
            u.wind.value.set(wind.x, wind.z);
            // A rough day is a choppy sea, and the same number does both.
            u.chop.value = 0.55 + Math.min(1.6, wind.speed * 1.5);
        }
        if (R.sky && G3.weather) R.sky.uniforms.drift.value.copy(G3.weather.cloudOffset);

        flapFlag(dt, wind);

        // The bag rides in front of the camera, so it is placed after the
        // camera has finished moving and before anything is drawn.
        if (G3.bag) G3.bag.update(dt, R.camera, R.camera.aspect);

        if (R.fx && G3.postfx.render(R.scene, R.camera, sunOnScreen(), dt)) return;
        R.renderer.setRenderTarget(null);
        R.renderer.render(R.scene, R.camera);
    }

    /* Where the sun lands on the screen, and how much of it is on there. The
       light shafts march towards this point, so a sun behind the camera has to
       report nothing at all — project() gives a mirrored answer for anything
       behind the near plane, and rays converging on a phantom is the one
       artefact of the whole chain that a player would notice. */
    var _sunPt = new THREE.Vector3();
    var _sun = { uv: new THREE.Vector2(0.5, 1.2), vis: 0 };
    function sunOnScreen() {
        _sunPt.copy(R.sunDir).multiplyScalar(140).add(R.camera.position).project(R.camera);
        if (_sunPt.z > 1) { _sun.vis = 0; return _sun; }
        _sun.uv.set(_sunPt.x * 0.5 + 0.5, _sunPt.y * 0.5 + 0.5);
        var out = Math.max(0, Math.max(Math.abs(_sun.uv.x - 0.5), Math.abs(_sun.uv.y - 0.5)) - 0.5);
        _sun.vis = Math.max(0, 1 - out * 2.2);
        return _sun;
    }

    /* The flag, which is three separate things pretending to be one.

       It **points downwind** — the swivel takes the wind's bearing, less the
       pin's own yaw, so the cloth turns about the stick rather than about the
       hole. It **ripples** at a rate and a depth that come from the wind
       speed, with the wave growing along the fly so the hoist stays put and
       the free end does the moving. And on a still day it **hangs**: the whole
       sheet sags towards the ground by as much as the wind is failing to hold
       it up, which is the detail that makes a calm hole read as calm. */
    function flapFlag(dt, wind) {
        if (!R.flagCloth || !R.flagSwivel) return;
        var t = R.clock;
        var gust = Math.min(1, wind.speed / 0.95);
        var yaw = Math.atan2(wind.x, wind.z);

        if (R.pinShake > 0) {
            R.pinShake = Math.max(0, R.pinShake - dt * 2.6);
            var q = R.pinShake * R.pinShake;
            R.pin.rotation.z = Math.sin(t * 34) * 0.07 * q;
            R.pin.rotation.x = -R.pinLean + Math.sin(t * 29 + 1.2) * 0.05 * q;
        }

        // The cloth streams away from the wind, which means the swivel points
        // where the wind is going: the flag's own yaw, less the pin's.
        R.flagSwivel.rotation.y = yaw - R.pin.rotation.y + Math.PI / 2 +
            Math.sin(t * 1.7) * 0.10 * gust;

        var g = R.flagCloth.geometry.attributes.position;
        var rest = R.flagRest;
        var sag = (1 - gust) * 0.42;
        for (var i = 0; i < g.count; i++) {
            var lx = rest[i * 3];                 // 0 at the hoist, FLAG_W at the fly
            var f = lx / FLAG_W;
            var ripple = Math.sin(t * (5 + gust * 7) - lx * 7.5) * (0.02 + gust * 0.13) * f;
            g.setZ(i, ripple);
            // A limp flag falls, and it falls further the further out it is.
            g.setY(i, rest[i * 3 + 1] - sag * f * f - Math.abs(ripple) * 0.35);
        }
        g.needsUpdate = true;
        R.flagCloth.geometry.computeBoundingSphere();
    }

    /* ── effects the game asks for ──────────────────────────────────────── */

    function splashAt(x, y, z) { burst(x, y, z, 0x9fd8ff, 26, 2.6); }
    function sandAt(x, y, z) { burst(x, y, z, 0xe8d8a8, 14, 1.5); }
    /* The ball goes past the pin on its way in — nothing stops it, since the
       simulation has never heard of the pin — so the pin at least acknowledges
       it and rattles, which is what a real one does and what your ear is
       expecting when the cup sound plays. */
    function sinkAt(x, y, z) {
        burst(x, y + 0.1, z, 0xffe98a, 26, 2.2);
        R.pinShake = 1;
    }

    /* Whatever the ball was sitting on, sprayed backwards off the strike. */
    function divot(x, y, z, yaw, frac, kind) {
        var colour = kind === 'sand' ? 0xe8d8a8 : (kind === 'wood' ? 0xc79a63 : 0x6fbf5a);
        var n = 5 + Math.round(frac * 13);
        burst(x - Math.sin(yaw) * 0.1, y + 0.03, z - Math.cos(yaw) * 0.1,
            colour, n, 0.8 + frac * 2.2);
    }

    // The camera flinch. Decays in about a third of a second (see frame()).
    function punch(frac) { R.cam.kick = Math.max(R.cam.kick, 0.35 + frac * 0.65); }

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
        divot: divot,
        punch: punch,
        setCam: setCam,
        cam: R.cam,
        // The bag picks against these, and nothing else needs them.
        pickAt: function (nx, ny) {
            return G3.bag ? G3.bag.pick(nx, ny, R.camera, R.scene) : null;
        },
        state: R,
        THEMES: THEMES,
        // What the HUD needs to name the sky it is standing under.
        get weather() { return R.weather; }
    };

})(window.G3);
