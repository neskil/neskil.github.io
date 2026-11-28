/* Scene 10 — Rainmaker (hydraulic erosion).
 *
 * A seeded 256×256 island worn down by rain: each drop rolls downhill on its
 * own, lifting rock where it runs fast on steep slopes and leaving silt where
 * it slows. Rivers, gullies and deltas emerge without being drawn.
 *
 * Pure simulation lives in js/data/erosion.js (asserted by tests.html). Here
 * we pack height, pre-rain base and water flow into one RGBA float DataTexture
 * sampled by custom Three.js shaders for the island, sea, sky and rain streaks.
 */
(function () {
    'use strict';

    var THREE = window.THREE;
    var S = window.VizErosion;

    var N = 256;
    var YS = N * 0.2;
    var METRES = 2500;
    var CLOUD_R = 13;
    var BURST = 90;
    var PER_FRAME = 220;
    var STREAKS = 500;

    var scene, camera, orbit, ctxRef;
    var island, dataTex, texBuf;
    var landMat, seaMat, rainMat, burstMat, rainObj, burstObj;
    var rate = 1, tool = 'look', before = false;
    var flowScale = 1, hand = null, readoutTimer = 0, simClock = 0;
    var rayVec = new THREE.Vector3();

    var HINTS = {
        look: 'Drag to turn · scroll or pinch to zoom · open Controls for tools & weather',
        cloud: 'Hold on the island to pour a cloudburst there · pinch/scroll to zoom',
        raise: 'Hold on the island to push up a hill · pinch/scroll to zoom',
        lower: 'Hold on the island to dig a channel · pinch/scroll to zoom'
    };

    var COMMON_GLSL = [
        'uniform sampler2D uData;',
        'uniform vec3 uEye;',
        'uniform float uN, uYS, uSea, uBefore, uTime, uFlowScale, uRiver;',
        'const vec3 SUN = vec3(0.54, 0.6, 0.59);',
        'const vec3 HAZE = vec3(0.62, 0.72, 0.84);',
        'vec4 cellData(vec2 c) {',
        '  vec2 cl = clamp(c, vec2(0.0), vec2(uN - 1.0));',
        '  return texture2D(uData, (cl + 0.5) / uN);',
        '}',
        'float heightAt(vec2 c) {',
        '  vec4 d = cellData(c);',
        '  return mix(d.r, d.g, uBefore);',
        '}',
        'float hash21(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }',
        'float noise2(vec2 p) {',
        '  vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);',
        '  return mix(mix(hash21(i), hash21(i + vec2(1.0, 0.0)), f.x),',
        '             mix(hash21(i + vec2(0.0, 1.0)), hash21(i + vec2(1.0, 1.0)), f.x), f.y);',
        '}',
        'vec3 applyHaze(vec3 col, vec3 pos) {',
        '  float d = length(pos - uEye);',
        '  return mix(col, HAZE, 1.0 - exp(-d * d / (uN * uN * 30.0)));',
        '}'
    ].join('\n');

    var LAND_VS = [
        'precision highp float;',
        COMMON_GLSL,
        'attribute vec2 aCell;',
        'varying vec3 vPos, vNor;',
        'varying float vH, vFlow, vDelta;',
        'void main() {',
        '  vec4 cd = cellData(aCell);',
        '  float h = mix(cd.r, cd.g, uBefore);',
        '  float hx = heightAt(aCell + vec2(1.0, 0.0)) - heightAt(aCell - vec2(1.0, 0.0));',
        '  float hz = heightAt(aCell + vec2(0.0, 1.0)) - heightAt(aCell - vec2(0.0, 1.0));',
        '  vNor = normalize(vec3(-hx * uYS, 2.0, -hz * uYS));',
        '  vPos = vec3(aCell.x - uN * 0.5, h * uYS, aCell.y - uN * 0.5);',
        '  vH = h;',
        '  vFlow = cd.b * (1.0 - uBefore);',
        '  vDelta = (h - cd.g) * (1.0 - uBefore);',
        '  gl_Position = projectionMatrix * modelViewMatrix * vec4(vPos, 1.0);',
        '}'
    ].join('\n');

    var LAND_FS = [
        'precision highp float;',
        COMMON_GLSL,
        'varying vec3 vPos, vNor;',
        'varying float vH, vFlow, vDelta;',
        'void main() {',
        '  vec3 n = normalize(vNor);',
        '  float up = vH - uSea, steep = 1.0 - n.y;',
        '  float grain = noise2(vPos.xz * 0.9), patch_ = noise2(vPos.xz * 0.11 + 5.0);',
        '  vec3 sand = vec3(0.78, 0.71, 0.52), grass = vec3(0.36, 0.5, 0.22), wood = vec3(0.16, 0.31, 0.15);',
        '  vec3 rock = mix(vec3(0.4, 0.37, 0.34), vec3(0.52, 0.48, 0.43), grain), snow = vec3(0.94, 0.96, 0.99);',
        '  vec3 col = mix(sand, grass, smoothstep(0.006, 0.03, up));',
        '  col = mix(col, wood, smoothstep(0.05, 0.2, up) * smoothstep(0.25, 0.7, patch_ + grain * 0.3));',
        '  col = mix(col, rock, smoothstep(0.1, 0.26, steep + (up - 0.3) * 0.25));',
        '  col = mix(col, snow, smoothstep(0.58, 0.68, up + grain * 0.04) * smoothstep(0.4, 0.15, steep));',
        '  col = mix(col, rock * 0.9, smoothstep(0.012, 0.06, -vDelta) * 0.6);',
        '  col = mix(col, vec3(0.56, 0.6, 0.36), smoothstep(0.002, 0.02, vDelta) * 0.45);',
        '  float f = log2(1.0 + vFlow * uFlowScale);',
        '  col *= 1.0 - 0.22 * smoothstep(0.5, 2.5, f);',
        '  float river = smoothstep(uRiver, uRiver + 1.2, f) * step(0.0, up);',
        '  col = mix(col, vec3(0.2, 0.52, 0.78), river * 0.92);',
        '  vec3 sunDir = normalize(SUN);',
        '  float lit = max(dot(n, sunDir), 0.0);',
        '  col *= vec3(0.34, 0.4, 0.5) * (0.6 + 0.4 * n.y) + vec3(1.05, 0.98, 0.86) * lit;',
        '  col += river * pow(max(dot(reflect(-sunDir, n), normalize(uEye - vPos)), 0.0), 24.0) * 0.5;',
        '  if (up < 0.0) {',
        '    float depth = -up;',
        '    col = mix(col * vec3(0.55, 0.85, 0.9), vec3(0.04, 0.2, 0.36), smoothstep(0.0, 0.09, depth));',
        '  }',
        '  gl_FragColor = vec4(pow(applyHaze(col, vPos), vec3(1.0 / 2.2)), 1.0);',
        '}'
    ].join('\n');

    var SEA_VS = [
        'precision highp float;',
        'uniform float uN, uYS, uSea;',
        'varying vec3 vPos;',
        'void main() {',
        '  vPos = vec3(position.x * uN * 12.0, uSea * uYS, position.y * uN * 12.0);',
        '  gl_Position = projectionMatrix * modelViewMatrix * vec4(vPos, 1.0);',
        '}'
    ].join('\n');

    var SEA_FS = [
        'precision highp float;',
        COMMON_GLSL,
        'varying vec3 vPos;',
        'float bed(vec2 p) {',
        '  vec2 q = p + uN * 0.5;',
        '  if (q.x < 0.0 || q.y < 0.0 || q.x > uN - 1.0 || q.y > uN - 1.0) return 0.0;',
        '  vec2 c = floor(q); vec2 f = fract(q);',
        '  return mix(mix(heightAt(c), heightAt(c + vec2(1.0, 0.0)), f.x),',
        '             mix(heightAt(c + vec2(0.0, 1.0)), heightAt(c + vec2(1.0, 1.0)), f.x), f.y);',
        '}',
        'void main() {',
        '  float depth = uSea - bed(vPos.xz);',
        '  if (depth < 0.0) discard;',
        '  vec2 w = vPos.xz * 0.35;',
        '  float ripple = noise2(w + uTime * vec2(0.5, 0.3)) + noise2(w * 2.3 - uTime * vec2(0.4, 0.6)) * 0.5;',
        '  vec3 n = normalize(vec3((ripple - 0.75) * 0.25, 1.0, (noise2(w * 1.7 + 9.0 + uTime * 0.4) - 0.5) * 0.25));',
        '  vec3 view = normalize(uEye - vPos);',
        '  vec3 col = mix(vec3(0.16, 0.6, 0.66), vec3(0.03, 0.2, 0.4), smoothstep(0.0, 0.07, depth));',
        '  float fres = pow(1.0 - max(dot(view, n), 0.0), 3.0);',
        '  col = mix(col, HAZE, fres * 0.55);',
        '  col += pow(max(dot(reflect(-normalize(SUN), n), view), 0.0), 60.0) * 0.8;',
        '  float surf = smoothstep(0.012 + 0.006 * sin(uTime * 1.3 + ripple * 5.0), 0.0, depth);',
        '  col = mix(col, vec3(0.95), surf * 0.75);',
        '  float alpha = mix(0.5, 1.0, smoothstep(0.0, 0.07, depth));',
        '  gl_FragColor = vec4(pow(applyHaze(col, vPos), vec3(1.0 / 2.2)), max(alpha, surf));',
        '}'
    ].join('\n');

    var SKY_VS = [
        'varying vec2 vPos2;',
        'void main() { vPos2 = position.xy; gl_Position = vec4(position.xy, 0.9999, 1.0); }'
    ].join('\n');

    var SKY_FS = [
        'precision highp float;',
        'varying vec2 vPos2;',
        'void main() {',
        '  vec3 col = mix(vec3(0.62, 0.72, 0.84), vec3(0.2, 0.38, 0.66), smoothstep(-0.2, 1.0, vPos2.y));',
        '  gl_FragColor = vec4(pow(col, vec3(1.0 / 2.2)), 1.0);',
        '}'
    ].join('\n');

    var RAIN_VS = [
        'precision highp float;',
        'attribute vec4 aDrop;',
        'uniform float uYS, uTime;',
        'uniform vec3 uCloud;',
        'varying float vFade;',
        'void main() {',
        '  float fall = fract(aDrop.z + uTime * (0.9 + 0.3 * fract(aDrop.z * 7.0)));',
        '  float y = uYS * 1.25 * (1.0 - fall) + aDrop.w * 5.0;',
        '  vec3 p = vec3(uCloud.x + aDrop.x * uCloud.z, y + uYS * 0.1, uCloud.y + aDrop.y * uCloud.z);',
        '  vFade = smoothstep(0.0, 0.1, fall) * (1.0 - aDrop.w * 0.7);',
        '  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);',
        '}'
    ].join('\n');

    var RAIN_FS = [
        'precision highp float;',
        'varying float vFade;',
        'uniform float uAlpha;',
        'void main() { gl_FragColor = vec4(0.9, 0.95, 1.0, vFade * uAlpha); }'
    ].join('\n');

    function syncTexture() {
        var h = island.h, base = island.base, flow = island.flow;
        var len = N * N;
        for (var i = 0; i < len; i++) {
            var k = i * 4;
            texBuf[k] = h[i];
            texBuf[k + 1] = base[i];
            texBuf[k + 2] = flow[i];
        }
        dataTex.needsUpdate = true;
    }

    function updateReadout() {
        var m = S.measure(island);
        var dropsTxt = island.drops < 1e6
            ? Math.round(island.drops / 1000) + 'k'
            : (island.drops / 1e6).toFixed(2) + 'M';
        var share = S.riverShare(island, 0.02);
        VizApp.readout.show('Rainmaker · Island #' + island.seed, [
            ['Raindrops', dropsTxt],
            ['Rock moved', (m.movedShare * 100).toFixed(m.movedShare < 0.1 ? 1 : 0) + '%'],
            ['Deepest cut', Math.round(m.deepestCut * METRES / 5) * 5 + ' m'],
            ['Tallest fill', Math.round(m.tallestFill * METRES / 5) * 5 + ' m'],
            ['Busiest 2%', share ? Math.round(share * 100) + '% of water' : '–']
        ]);
    }

    function pickAt(pointer) {
        if (!camera || !island) return null;
        camera.updateMatrixWorld();
        rayVec.set(pointer.x, pointer.y, 0.5).unproject(camera).sub(camera.position).normalize();
        return S.pick(
            island,
            [camera.position.x + N / 2, camera.position.y, camera.position.z + N / 2],
            [rayVec.x, rayVec.y, rayVec.z],
            YS
        );
    }

    function buildLandGeometry() {
        var geom = new THREE.BufferGeometry();
        var count = N * N;
        var pos = new Float32Array(count * 3);
        var cells = new Float32Array(count * 2);
        for (var j = 0; j < N; j++) {
            for (var i = 0; i < N; i++) {
                var idx = j * N + i;
                pos[idx * 3] = i - N * 0.5;
                pos[idx * 3 + 1] = 0;
                pos[idx * 3 + 2] = j - N * 0.5;
                cells[idx * 2] = i;
                cells[idx * 2 + 1] = j;
            }
        }
        var indices = new Uint32Array((N - 1) * (N - 1) * 6);
        var k = 0;
        for (var y = 0; y < N - 1; y++) {
            for (var x = 0; x < N - 1; x++) {
                var a = y * N + x;
                indices[k++] = a; indices[k++] = a + N; indices[k++] = a + 1;
                indices[k++] = a + 1; indices[k++] = a + N; indices[k++] = a + N + 1;
            }
        }
        geom.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        geom.setAttribute('aCell', new THREE.BufferAttribute(cells, 2));
        geom.setIndex(new THREE.BufferAttribute(indices, 1));
        return geom;
    }

    function buildRainGeometry(streakCount) {
        var geom = new THREE.BufferGeometry();
        var pos = new Float32Array(streakCount * 2 * 3);
        var drops = new Float32Array(streakCount * 2 * 4);
        for (var i = 0; i < streakCount; i++) {
            var a = Math.random() * Math.PI * 2;
            var r = Math.sqrt(Math.random());
            var ph = Math.random();
            var cx = Math.cos(a) * r, cz = Math.sin(a) * r;
            for (var e = 0; e < 2; e++) {
                var base = (i * 2 + e) * 4;
                drops[base] = cx;
                drops[base + 1] = cz;
                drops[base + 2] = ph;
                drops[base + 3] = e;
            }
        }
        geom.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        geom.setAttribute('aDrop', new THREE.BufferAttribute(drops, 4));
        return geom;
    }

    VizApp.register({
        id: 'erosion',
        label: 'Rainmaker',
        title: 'An island worn down by rain',
        blurb: 'Each raindrop rolls downhill on its own, lifting rock where it runs fast ' +
               'on steep slopes and dropping silt where it slows. Gullies, rivers and deltas ' +
               'emerge without being drawn.',
        hint: HINTS.look,
        accent: '#38bdf8',

        controls: function () {
            return [
                { id: 'weather', type: 'choice', label: 'Weather', value: String(rate),
                  options: [['0', 'Dry'], ['1', 'Rain'], ['3', 'Monsoon']],
                  apply: function (v) { rate = +v; } },
                { id: 'tool', type: 'choice', label: 'Pointer tool', value: tool,
                  options: [['look', 'Orbit'], ['cloud', 'Cloudburst'], ['raise', 'Raise'], ['lower', 'Dig']],
                  apply: function (v) {
                      tool = v;
                      hand = null;
                      if (orbit) orbit.enabled = (tool === 'look');
                      VizApp.setHint(HINTS[tool] || HINTS.look);
                  } },
                { id: 'before', type: 'toggle', label: 'Show before rain', value: before,
                  apply: function (v) {
                      before = v;
                      if (landMat) landMat.uniforms.uBefore.value = v ? 1 : 0;
                      if (seaMat) seaMat.uniforms.uBefore.value = v ? 1 : 0;
                  } },
                { id: 'reset', type: 'action', label: 'Undo all rain',
                  apply: function () {
                      if (!island) return;
                      island.h.set(island.base);
                      island.flow.fill(0);
                      island.drops = 0;
                      island.lost = 0;
                      syncTexture();
                      updateReadout();
                  } },
                { id: 'new-island', type: 'action', label: 'New island',
                  apply: function () {
                      island = S.makeIsland(N, 1 + Math.floor(Math.random() * 99999));
                      syncTexture();
                      updateReadout();
                  } }
            ];
        },

        init: function (ctx) {
            ctxRef = ctx;
            scene = new THREE.Scene();

            var q = typeof URLSearchParams !== 'undefined' ? new URLSearchParams(location.search) : null;
            var seed = q && q.has('seed') ? (+q.get('seed') || 1) : (1 + Math.floor(Math.random() * 9999));
            rate = q && q.has('rate') ? +q.get('rate') : 1;
            tool = 'look';
            before = false;
            hand = null;
            flowScale = 1;
            readoutTimer = 0;
            simClock = 0;

            island = S.makeIsland(N, seed);
            var soak = q ? (+q.get('soak') || 0) : 0;
            for (var left = soak; left > 0; left -= PER_FRAME) {
                S.rain(island, PER_FRAME);
                S.dry(island, 0.975);
            }

            texBuf = new Float32Array(N * N * 4);
            dataTex = new THREE.DataTexture(texBuf, N, N, THREE.RGBAFormat, THREE.FloatType);
            dataTex.minFilter = THREE.NearestFilter;
            dataTex.magFilter = THREE.NearestFilter;
            dataTex.wrapS = THREE.ClampToEdgeWrapping;
            dataTex.wrapT = THREE.ClampToEdgeWrapping;
            dataTex.flipY = false;
            syncTexture();

            camera = new THREE.PerspectiveCamera(40, ctx.width / Math.max(ctx.height, 1), 2, N * 40);

            var riverThresh = q && q.has('river') ? +q.get('river') : 2.7;
            var shared = {
                uData: { value: dataTex },
                uEye: { value: new THREE.Vector3() },
                uN: { value: N },
                uYS: { value: YS },
                uSea: { value: S.SEA },
                uBefore: { value: 0 },
                uTime: { value: 0 },
                uFlowScale: { value: 1 },
                uRiver: { value: riverThresh }
            };

            // Sky backdrop
            var skyMesh = new THREE.Mesh(
                new THREE.PlaneGeometry(2, 2),
                new THREE.ShaderMaterial({
                    vertexShader: SKY_VS,
                    fragmentShader: SKY_FS,
                    depthTest: false,
                    depthWrite: false
                })
            );
            skyMesh.frustumCulled = false;
            skyMesh.renderOrder = -1;
            scene.add(skyMesh);

            // Island mesh
            landMat = new THREE.ShaderMaterial({
                uniforms: {
                    uData: shared.uData,
                    uEye: shared.uEye,
                    uN: shared.uN,
                    uYS: shared.uYS,
                    uSea: shared.uSea,
                    uBefore: shared.uBefore,
                    uTime: shared.uTime,
                    uFlowScale: shared.uFlowScale,
                    uRiver: shared.uRiver
                },
                vertexShader: LAND_VS,
                fragmentShader: LAND_FS
            });
            var landMesh = new THREE.Mesh(buildLandGeometry(), landMat);
            landMesh.frustumCulled = false;
            scene.add(landMesh);

            // Sea plane
            seaMat = new THREE.ShaderMaterial({
                uniforms: {
                    uData: shared.uData,
                    uEye: shared.uEye,
                    uN: shared.uN,
                    uYS: shared.uYS,
                    uSea: shared.uSea,
                    uBefore: shared.uBefore,
                    uTime: shared.uTime,
                    uFlowScale: shared.uFlowScale,
                    uRiver: shared.uRiver
                },
                vertexShader: SEA_VS,
                fragmentShader: SEA_FS,
                transparent: true,
                depthWrite: true,
                side: THREE.DoubleSide
            });
            var seaMesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), seaMat);
            seaMesh.frustumCulled = false;
            seaMesh.renderOrder = 1;
            scene.add(seaMesh);

            // Global rain streaks
            rainMat = new THREE.ShaderMaterial({
                uniforms: {
                    uYS: { value: YS },
                    uTime: { value: 0 },
                    uCloud: { value: new THREE.Vector3(0, 0, N * 0.47) },
                    uAlpha: { value: 0.28 }
                },
                vertexShader: RAIN_VS,
                fragmentShader: RAIN_FS,
                transparent: true,
                depthWrite: false
            });
            rainObj = new THREE.LineSegments(buildRainGeometry(STREAKS), rainMat);
            rainObj.frustumCulled = false;
            rainObj.renderOrder = 2;
            scene.add(rainObj);

            // Focused cloudburst streaks
            burstMat = new THREE.ShaderMaterial({
                uniforms: {
                    uYS: { value: YS },
                    uTime: { value: 0 },
                    uCloud: { value: new THREE.Vector3(0, 0, CLOUD_R) },
                    uAlpha: { value: 0.85 }
                },
                vertexShader: RAIN_VS,
                fragmentShader: RAIN_FS,
                transparent: true,
                depthWrite: false
            });
            burstObj = new THREE.LineSegments(buildRainGeometry(120), burstMat);
            burstObj.frustumCulled = false;
            burstObj.visible = false;
            burstObj.renderOrder = 3;
            scene.add(burstObj);

            var initAz = q && q.has('az') ? +q.get('az') : 0.7;
            var initEl = q && q.has('el') ? +q.get('el') : 0.62;
            var initDist = q && q.has('dist') ? N * +q.get('dist') : N * 1.25;

            orbit = VizApp.makeOrbit(camera, ctx.canvas, {
                radius: initDist,
                minRadius: N * 0.35,
                maxRadius: N * 2.6,
                theta: initAz,
                phi: Math.PI / 2 - initEl,
                minPhi: 0.12,
                maxPhi: Math.PI / 2 - 0.12,
                target: new THREE.Vector3(0, YS * 0.18, 0)
            });
            orbit.update(0);

            this.resize(ctx.width, ctx.height);
            updateReadout();
            return { scene: scene, camera: camera };
        },

        onPointerDown: function (pointer) {
            if (tool !== 'look') hand = pickAt(pointer);
        },

        onPointerMove: function (pointer, e) {
            if (tool !== 'look' && hand && (!e || e.buttons || e.pointerType === 'touch')) {
                hand = pickAt(pointer);
            }
        },

        onPointerUp: function () {
            hand = null;
        },

        onPointerLeave: function () {
            hand = null;
        },

        update: function (dt) {
            orbit.update(dt);
            simClock += dt;

            var t0 = (window.performance && performance.now) ? performance.now() : Date.now();
            if (!before) {
                var want = Math.round(PER_FRAME * rate * Math.min(dt, 0.05) * 60);
                for (var done = 0; done < want && ((window.performance ? performance.now() : Date.now()) - t0) < 9; done += 40) {
                    S.rain(island, 40);
                }
                if (hand && tool === 'cloud') S.rain(island, BURST, { x: hand.x, y: hand.y, r: CLOUD_R });
                if (hand && (tool === 'raise' || tool === 'lower')) {
                    S.sculpt(island, hand.x, hand.y, 16, (tool === 'raise' ? 0.25 : -0.25) * Math.min(dt, 0.05));
                }
                S.dry(island, Math.pow(0.975, Math.min(dt, 0.05) * 60));
                syncTexture();
            }

            var pour = PER_FRAME * Math.max(rate, 0.25) + (hand && tool === 'cloud' ? BURST : 0);
            flowScale += (60 / pour - flowScale) * 0.1;

            landMat.uniforms.uEye.value.copy(camera.position);
            landMat.uniforms.uTime.value = simClock;
            landMat.uniforms.uFlowScale.value = flowScale;
            seaMat.uniforms.uEye.value.copy(camera.position);
            seaMat.uniforms.uTime.value = simClock;
            seaMat.uniforms.uFlowScale.value = flowScale;
            rainMat.uniforms.uTime.value = simClock;
            burstMat.uniforms.uTime.value = simClock;

            var bursting = !!(hand && tool === 'cloud' && !before);
            rainObj.visible = !before && rate > 0;
            if (rainObj.visible) {
                rainMat.uniforms.uAlpha.value = rate > 1 ? 0.5 : 0.28;
                rainObj.geometry.setDrawRange(0, (rate > 1 ? STREAKS : STREAKS / 2) * 2);
            }
            burstObj.visible = bursting;
            if (bursting) {
                burstMat.uniforms.uCloud.value.set(hand.x - N / 2, hand.y - N / 2, CLOUD_R);
            }

            readoutTimer += dt;
            if (readoutTimer >= 0.4) {
                readoutTimer = 0;
                updateReadout();
            }
        },

        resize: function (w, h) {
            if (!camera) return;
            var aspect = w / Math.max(h, 1);
            camera.aspect = aspect;
            camera.updateProjectionMatrix();
            if (orbit && aspect < 0.85) {
                var need = N * 1.25 * (1.15 / Math.max(aspect, 0.4));
                if (orbit.tRadius < need) { orbit.tRadius = need; orbit.radius = need; }
            }
        },

        dispose: function () {
            if (orbit) orbit.dispose();
            if (dataTex) dataTex.dispose();
            VizApp.readout.hide();
            orbit = null; dataTex = null; texBuf = null; island = null;
            landMat = null; seaMat = null; rainMat = null; burstMat = null;
            rainObj = null; burstObj = null; camera = null; ctxRef = null;
        }
    });
})();
