/* Scene 5 — flocking.
 *
 * Three flocks of a few hundred agents each, running the classic three rules
 * — separation, alignment, cohesion — plus a fourth that keeps them inside the
 * bowl and a fifth that reacts to the pointer. Nobody is steering; the shapes
 * the flock makes are the only thing here that wasn't written down.
 *
 * The interesting engineering is not the rules, which are twenty lines. It is
 * that every agent needs its neighbours every frame, and asking each of twelve
 * hundred agents about the other twelve hundred is 1.4 million distance checks
 * per frame, which JavaScript will not do sixty times a second. So the agents
 * are binned into a uniform grid first and each one only ever looks at the
 * twenty-seven cells around it. The binning is a counting sort into flat typed
 * arrays — no per-frame allocation at all, because a garbage collection in the
 * middle of a flock is a visible stutter.
 */
(function () {
    'use strict';

    var THREE = window.THREE;

    /* Three flocks, in the three hues that survive a colour-blind check when
     * every pair can be on screen at once — the same three the globe uses.
     * They are species, not data series, so there is no legend: nothing here
     * claims a colour means anything you would need to look up. */
    var FLOCK_COLORS = [0x3987e5, 0xd95926, 0x199e70];

    var BOUNDS = 21;             /* agents are steered back inside this radius */
    var PERCEPT = 3.4;           /* neighbour radius, and the grid's cell size */
    var SEPARATE = 1.7;
    var MAX_FORCE = 26.0;

    /* The rule weights, in one object so the controls can reach them. These
     * are the whole behaviour: turn cohesion off and the flocks dissolve into
     * a gas, turn separation off and they collapse to a point. */
    var W = {
        sep: 3.6, ali: 1.5, coh: 0.9, stranger: 0.55,
        maxSpeed: 11.0, minSpeed: 4.0, lure: 16
    };

    var scene, camera, orbit, mesh, light;
    var N = 0;
    var pos, vel, acc, flock;    /* Float32Array(N*3) except flock: Uint8Array */

    /* Uniform grid, as flat arrays that are written over every frame rather
     * than rebuilt. */
    var DIM = 0, CELLS = 0, CELL = PERCEPT;
    var cellOf, cellStart, cellCursor, order;

    var dummy = new THREE.Object3D();
    var FORWARD = new THREE.Vector3(0, 0, 1);
    var _dir = new THREE.Vector3();
    var _plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
    var _ray = new THREE.Raycaster(), _ndc = new THREE.Vector2();
    var lure = new THREE.Vector3();
    var lureOn = false, lurePush = false;

    /* ---------- setup ---------- */

    function build(ctx) {
        N = Math.min(window.innerWidth, window.innerHeight) < 620 ? 600 : 1300;

        pos = new Float32Array(N * 3);
        vel = new Float32Array(N * 3);
        acc = new Float32Array(N * 3);
        flock = new Uint8Array(N);

        for (var i = 0; i < N; i++) {
            /* Start each flock as a loose ball of its own, offset from the
             * others: dropped in fully mixed they take half a minute to sort
             * themselves out, and the first thing you see should already look
             * like flocks. */
            var f = i % FLOCK_COLORS.length;
            var a = Math.random() * Math.PI * 2, b = Math.acos(Math.random() * 2 - 1);
            var r = Math.pow(Math.random(), 0.5) * 5.5;
            var cx = Math.cos(f / FLOCK_COLORS.length * Math.PI * 2) * 9;
            var cz = Math.sin(f / FLOCK_COLORS.length * Math.PI * 2) * 9;

            flock[i] = f;
            pos[i * 3]     = cx + r * Math.sin(b) * Math.cos(a);
            pos[i * 3 + 1] =      r * Math.cos(b);
            pos[i * 3 + 2] = cz + r * Math.sin(b) * Math.sin(a);
            vel[i * 3]     = (Math.random() - 0.5) * W.maxSpeed;
            vel[i * 3 + 1] = (Math.random() - 0.5) * W.maxSpeed;
            vel[i * 3 + 2] = (Math.random() - 0.5) * W.maxSpeed;
        }

        DIM = Math.ceil((BOUNDS * 2.6) / CELL);
        CELLS = DIM * DIM * DIM;
        cellOf = new Int32Array(N);
        cellStart = new Int32Array(CELLS + 1);
        cellCursor = new Int32Array(CELLS + 1);
        order = new Int32Array(N);

        /* A cone rather than a dot: the whole point of a flock is that it is
         * going somewhere, and a dot cannot show heading. Laid down the +Z
         * axis once here so orienting an agent is a single quaternion from
         * its velocity rather than a lookAt per instance per frame. */
        var geo = new THREE.ConeGeometry(0.26, 1.05, 5);
        geo.rotateX(Math.PI / 2);

        mesh = new THREE.InstancedMesh(
            geo,
            new THREE.MeshLambertMaterial({ vertexColors: false }),
            N
        );
        mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
        mesh.frustumCulled = false;

        var c = new THREE.Color();
        for (var k = 0; k < N; k++) {
            c.setHex(FLOCK_COLORS[flock[k]]);
            mesh.setColorAt(k, c);
        }
        if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
        return mesh;
    }

    /* Throw them back into their starting balls. The rules take it from
     * there, and watching three clouds sort themselves back into flocks is
     * half the point of the scene. */
    function scatter() {
        for (var i = 0; i < N; i++) {
            var f = flock[i];
            var a = Math.random() * Math.PI * 2, b = Math.acos(Math.random() * 2 - 1);
            var r = Math.pow(Math.random(), 0.5) * 5.5;
            var cx = Math.cos(f / FLOCK_COLORS.length * Math.PI * 2) * 9;
            var cz = Math.sin(f / FLOCK_COLORS.length * Math.PI * 2) * 9;
            pos[i * 3]     = cx + r * Math.sin(b) * Math.cos(a);
            pos[i * 3 + 1] =      r * Math.cos(b);
            pos[i * 3 + 2] = cz + r * Math.sin(b) * Math.sin(a);
            vel[i * 3]     = (Math.random() - 0.5) * W.maxSpeed;
            vel[i * 3 + 1] = (Math.random() - 0.5) * W.maxSpeed;
            vel[i * 3 + 2] = (Math.random() - 0.5) * W.maxSpeed;
        }
    }

    /* ---------- the grid ---------- */

    function bin() {
        var half = DIM * CELL / 2;
        var i, c;

        cellStart.fill(0);
        for (i = 0; i < N; i++) {
            var gx = ((pos[i * 3] + half) / CELL) | 0;
            var gy = ((pos[i * 3 + 1] + half) / CELL) | 0;
            var gz = ((pos[i * 3 + 2] + half) / CELL) | 0;
            /* An agent that has slipped outside the grid is clamped into the
             * edge cell rather than dropped. It is about to be steered back
             * anyway, and a boid that vanishes from its own neighbours' view
             * jitters. */
            if (gx < 0) gx = 0; else if (gx >= DIM) gx = DIM - 1;
            if (gy < 0) gy = 0; else if (gy >= DIM) gy = DIM - 1;
            if (gz < 0) gz = 0; else if (gz >= DIM) gz = DIM - 1;
            c = (gz * DIM + gy) * DIM + gx;
            cellOf[i] = c;
            cellStart[c + 1]++;
        }
        for (c = 0; c < CELLS; c++) cellStart[c + 1] += cellStart[c];
        cellCursor.set(cellStart);
        for (i = 0; i < N; i++) order[cellCursor[cellOf[i]]++] = i;
    }

    /* ---------- the rules ---------- */

    function steer(dt) {
        var half = DIM * CELL / 2;
        var p2 = PERCEPT * PERCEPT, s2 = SEPARATE * SEPARATE;

        for (var i = 0; i < N; i++) {
            var px = pos[i * 3], py = pos[i * 3 + 1], pz = pos[i * 3 + 2];
            var myFlock = flock[i];

            var sepX = 0, sepY = 0, sepZ = 0;
            var aliX = 0, aliY = 0, aliZ = 0;
            var cohX = 0, cohY = 0, cohZ = 0;
            var nSame = 0;

            var gx = ((px + half) / CELL) | 0;
            var gy = ((py + half) / CELL) | 0;
            var gz = ((pz + half) / CELL) | 0;
            if (gx < 0) gx = 0; else if (gx >= DIM) gx = DIM - 1;
            if (gy < 0) gy = 0; else if (gy >= DIM) gy = DIM - 1;
            if (gz < 0) gz = 0; else if (gz >= DIM) gz = DIM - 1;

            for (var dz = -1; dz <= 1; dz++) {
                var z = gz + dz; if (z < 0 || z >= DIM) continue;
                for (var dy = -1; dy <= 1; dy++) {
                    var y = gy + dy; if (y < 0 || y >= DIM) continue;
                    for (var dx = -1; dx <= 1; dx++) {
                        var x = gx + dx; if (x < 0 || x >= DIM) continue;

                        var cell = (z * DIM + y) * DIM + x;
                        var end = cellStart[cell + 1];
                        for (var s = cellStart[cell]; s < end; s++) {
                            var j = order[s];
                            if (j === i) continue;

                            var ox = pos[j * 3] - px;
                            var oy = pos[j * 3 + 1] - py;
                            var oz = pos[j * 3 + 2] - pz;
                            var d2 = ox * ox + oy * oy + oz * oz;
                            if (d2 > p2 || d2 < 1e-6) continue;

                            var sameFlock = flock[j] === myFlock;

                            /* Separation applies to everyone — nothing wants to
                             * be flown through — but strangers get a wider
                             * berth, out to the full perception radius rather
                             * than the close one. Restricting alignment and
                             * cohesion to your own flock is not enough on its
                             * own: with only close-range separation between
                             * them the three groups drift through each other
                             * and are one speckled cloud within a minute. */
                            if (d2 < s2) {
                                var inv = 1 / d2;
                                sepX -= ox * inv; sepY -= oy * inv; sepZ -= oz * inv;
                            }
                            if (!sameFlock) {
                                var inv2 = W.stranger / d2;
                                sepX -= ox * inv2; sepY -= oy * inv2; sepZ -= oz * inv2;
                            }
                            if (sameFlock) {
                                aliX += vel[j * 3]; aliY += vel[j * 3 + 1]; aliZ += vel[j * 3 + 2];
                                cohX += pos[j * 3]; cohY += pos[j * 3 + 1]; cohZ += pos[j * 3 + 2];
                                nSame++;
                            }
                        }
                    }
                }
            }

            var ax = sepX * W.sep, ay = sepY * W.sep, az = sepZ * W.sep;

            if (nSame > 0) {
                ax += (aliX / nSame - vel[i * 3]) * W.ali;
                ay += (aliY / nSame - vel[i * 3 + 1]) * W.ali;
                az += (aliZ / nSame - vel[i * 3 + 2]) * W.ali;
                ax += (cohX / nSame - px) * W.coh;
                ay += (cohY / nSame - py) * W.coh;
                az += (cohZ / nSame - pz) * W.coh;
            }

            /* Back into the bowl. A hard wall makes them bounce like gravel;
             * a force that only switches on near the edge makes them bank. */
            var dist = Math.sqrt(px * px + py * py + pz * pz);
            if (dist > BOUNDS) {
                var pull = (dist - BOUNDS) * 2.4 / (dist || 1);
                ax -= px * pull; ay -= py * pull; az -= pz * pull;
            }

            if (lureOn) {
                var lx = lure.x - px, ly = lure.y - py, lz = lure.z - pz;
                var ld = Math.sqrt(lx * lx + ly * ly + lz * lz) || 1;
                /* Falls off with distance, so the pointer bends the flock
                 * nearby instead of yanking the whole bowl at once. */
                var k = (lurePush ? -W.lure * 2.1 : W.lure) / (ld * ld + 3.0);
                ax += lx / ld * k; ay += ly / ld * k; az += lz / ld * k;
            }

            var am = Math.sqrt(ax * ax + ay * ay + az * az);
            if (am > MAX_FORCE) { var f = MAX_FORCE / am; ax *= f; ay *= f; az *= f; }
            acc[i * 3] = ax; acc[i * 3 + 1] = ay; acc[i * 3 + 2] = az;
        }

        for (var m = 0; m < N; m++) {
            var vx = vel[m * 3] + acc[m * 3] * dt;
            var vy = vel[m * 3 + 1] + acc[m * 3 + 1] * dt;
            var vz = vel[m * 3 + 2] + acc[m * 3 + 2] * dt;

            /* A floor as well as a ceiling on speed: a boid that stalls hangs
             * in the air pointing nowhere, which reads as a bug. */
            var sp = Math.sqrt(vx * vx + vy * vy + vz * vz) || 1;
            var want = sp > W.maxSpeed ? W.maxSpeed : (sp < W.minSpeed ? W.minSpeed : sp);
            var sc = want / sp;

            vel[m * 3] = vx * sc; vel[m * 3 + 1] = vy * sc; vel[m * 3 + 2] = vz * sc;
            pos[m * 3] += vel[m * 3] * dt;
            pos[m * 3 + 1] += vel[m * 3 + 1] * dt;
            pos[m * 3 + 2] += vel[m * 3 + 2] * dt;
        }
    }

    function pushMatrices() {
        for (var i = 0; i < N; i++) {
            dummy.position.set(pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2]);
            _dir.set(vel[i * 3], vel[i * 3 + 1], vel[i * 3 + 2]).normalize();
            dummy.quaternion.setFromUnitVectors(FORWARD, _dir);
            dummy.updateMatrix();
            mesh.setMatrixAt(i, dummy.matrix);
        }
        mesh.instanceMatrix.needsUpdate = true;
    }

    /* ---------- scene module ---------- */

    VizApp.register({
        id: 'boids',
        label: 'Flocking',
        title: 'Nobody is steering',
        blurb: 'Three flocks, three rules each — keep your distance, match ' +
               'your neighbours, stay with the group. Every shape they make ' +
               'comes out of that and nothing else.',
        hint: 'Move the pointer to draw them in · hold to scatter them',
        accent: '#60a5fa',

        /* Species, not data series — no colour here claims a meaning you would
         * have to look up — but naming them is still cheaper than wondering. */
        legend: [
            { label: 'Three flocks, same rules', color: '#3987e5' },
            { label: '', color: '#d95926' },
            { label: '', color: '#199e70' }
        ],

        controls: function () {
            return [
                { id: 'sep', type: 'slider', label: 'Keep your distance', min: 0, max: 9, step: 0.2,
                  value: W.sep,
                  format: function (v) { return v.toFixed(1); },
                  apply: function (v) { W.sep = v; } },
                { id: 'ali', type: 'slider', label: 'Match your neighbours', min: 0, max: 5, step: 0.1,
                  value: W.ali,
                  format: function (v) { return v.toFixed(1); },
                  apply: function (v) { W.ali = v; } },
                { id: 'coh', type: 'slider', label: 'Stay with the group', min: 0, max: 4, step: 0.1,
                  value: W.coh,
                  format: function (v) { return v.toFixed(1); },
                  apply: function (v) { W.coh = v; } },
                { id: 'stranger', type: 'slider', label: 'Avoid other flocks', min: 0, max: 2, step: 0.05,
                  value: W.stranger,
                  format: function (v) { return v === 0 ? 'they mix' : v.toFixed(2); },
                  apply: function (v) { W.stranger = v; } },
                { id: 'speed', type: 'slider', label: 'Top speed', min: 4, max: 22, step: 0.5,
                  value: W.maxSpeed,
                  format: function (v) { return v.toFixed(0); },
                  apply: function (v) { W.maxSpeed = Math.max(v, W.minSpeed + 0.5); } },
                { id: 'lure', type: 'slider', label: 'Pointer pull', min: 0, max: 40, step: 1,
                  value: W.lure,
                  format: function (v) { return v === 0 ? 'ignored' : v.toFixed(0); },
                  apply: function (v) { W.lure = v; } },
                { id: 'scatter', type: 'action', label: 'Shuffle them',
                  apply: function () { scatter(); } }
            ];
        },

        init: function (ctx) {
            scene = new THREE.Scene();
            scene.fog = new THREE.Fog(0x070b16, 45, 130);
            camera = new THREE.PerspectiveCamera(46, ctx.width / ctx.height, 0.5, 300);

            scene.add(build(ctx));
            /* Lit rather than glowing, unlike the rest of the set: a cone with
             * a bright side and a dark side is the cheapest way to tell which
             * way it is pointing. */
            scene.add(new THREE.AmbientLight(0x2a3550, 1.0));
            light = new THREE.DirectionalLight(0xdce8ff, 1.35);
            light.position.set(0.6, 1, 0.4);
            scene.add(light);

            orbit = VizApp.makeOrbit(camera, ctx.canvas, {
                radius: 58, minRadius: 16, maxRadius: 150,
                theta: 0.5, phi: 74 * Math.PI / 180,
                spin: ctx.reducedMotion ? 0 : 0.05
            });

            lureOn = false;
            lurePush = false;
            this.resize(ctx.width, ctx.height);
            VizApp.readout.show('Flock', [
                ['Agents', N.toLocaleString()],
                ['Flocks', String(FLOCK_COLORS.length)],
                ['Brute force', (N * N / 1e6).toFixed(1) + 'M pairs/frame'],
                ['With the grid', '27 cells each']
            ]);
            return { scene: scene, camera: camera };
        },

        update: function (dt) {
            orbit.update(dt);
            /* Fixed step. The rules are a feedback loop, and feeding a loop
             * like that a variable dt makes the flock behave differently on a
             * fast machine than on a slow one. */
            var step = Math.min(dt, 1 / 30);
            bin();
            steer(step);
            pushMatrices();
        },

        resize: function (w, h) {
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
            if (orbit) {
                var need = VizApp.fitDistance(camera, BOUNDS + 4);
                if (orbit.tRadius < need) { orbit.tRadius = need; orbit.radius = need; }
            }
        },

        onPointerMove: function (p) {
            if (orbit.dragging) { lureOn = false; return; }
            _plane.normal.copy(camera.position).normalize();
            _plane.constant = 0;
            _ndc.set(p.x, p.y);
            _ray.setFromCamera(_ndc, camera);
            lureOn = !!_ray.ray.intersectPlane(_plane, lure);
        },

        onPointerDown: function () { lurePush = true; },
        onPointerUp: function () { lurePush = false; },

        onPointerLeave: function () {
            lureOn = false;
            lurePush = false;
        },

        dispose: function () {
            if (orbit) orbit.dispose();
            VizApp.readout.hide();
            pos = vel = acc = flock = null;
            cellOf = cellStart = cellCursor = order = null;
            mesh = null;
        }
    });
})();
