/* Scene 1 — Pocket Black Hole.
 *
 * A Schwarzschild black hole and its accretion disc ray-traced in a fragment
 * shader: every pixel is a photon followed backwards along a null geodesic
 *
 *     a = -(3/2) h² x / r⁵    (with r_s = 1, c = 1)
 *
 * which is the orbit equation u'' + u = 3u²/2 written as a force law. The same
 * equation in JS, plus the physical readouts, lives in js/data/geodesic.js.
 */
(function () {
    'use strict';

    var THREE = window.THREE;
    var G = window.VizGeodesic;

    var scene, camera, rayCam, orbit, mat, quad, ladder, ctxRef;
    var basis = new THREE.Matrix3();
    var simTime = 0;
    var opts = { lens: true, disc: true, doppler: true, grid: false, spin: true };
    var massLog = Math.log10(4.3e6);   // Sagittarius A*
    var lastDistReadout = -1;

    var PRESETS = [
        ['sun',  'Sun',        1],
        ['cygx', 'Cygnus X-1', 21.2],
        ['sgra', 'Sgr A*',     4.3e6],
        ['m87',  'M87*',       6.5e9],
        ['ton',  'TON 618',    4e10]
    ];

    var FRAG = [
        'precision highp float;',
        'uniform vec2 uRes;',
        'uniform vec3 uCam;',
        'uniform mat3 uBasis;',
        'uniform float uTime;',
        'uniform float uLens, uDisc, uDoppler, uGrid;',
        'uniform float uSteps;',
        'varying vec2 vUv;',

        'const float RIN = 3.0;',
        'const float ROUT = 13.0;',
        'const int MAX_STEPS = 220;',

        'float hash13(vec3 p) {',
        '  p = fract(p * 0.1031);',
        '  p += dot(p, p.zyx + 31.32);',
        '  return fract((p.x + p.y) * p.z);',
        '}',
        'float noise3(vec3 p) {',
        '  vec3 i = floor(p), f = fract(p);',
        '  f = f * f * (3.0 - 2.0 * f);',
        '  return mix(mix(mix(hash13(i), hash13(i + vec3(1.0, 0.0, 0.0)), f.x),',
        '                 mix(hash13(i + vec3(0.0, 1.0, 0.0)), hash13(i + vec3(1.0, 1.0, 0.0)), f.x), f.y),',
        '             mix(mix(hash13(i + vec3(0.0, 0.0, 1.0)), hash13(i + vec3(1.0, 0.0, 1.0)), f.x),',
        '                 mix(hash13(i + vec3(0.0, 1.0, 1.0)), hash13(i + vec3(1.0, 1.0, 1.0)), f.x), f.y), f.z);',
        '}',
        'float fbm(vec3 p) {',
        '  float a = 0.5, s = 0.0;',
        '  for (int i = 0; i < 4; i++) { s += a * noise3(p); p = p * 2.03 + 7.1; a *= 0.5; }',
        '  return s;',
        '}',

        'vec3 starLayer(vec3 d, float scale, float density) {',
        '  vec3 q = d * scale, id = floor(q), f = fract(q) - 0.5;',
        '  float h = hash13(id);',
        '  if (h < 1.0 - density) return vec3(0.0);',
        '  vec3 off = (vec3(hash13(id + 1.7), hash13(id + 2.9), hash13(id + 4.3)) - 0.5) * 0.6;',
        '  float dd = length(f - off);',
        '  float b = smoothstep(0.16, 0.0, dd) * (0.3 + 0.7 * (h - (1.0 - density)) / density);',
        '  vec3 tint = mix(vec3(1.0, 0.82, 0.62), vec3(0.68, 0.8, 1.0), hash13(id + 9.1));',
        '  return tint * b * b * 2.4;',
        '}',

        'vec3 sky(vec3 d) {',
        '  if (uGrid > 0.5) {',
        '    float lon = atan(d.z, d.x), lat = asin(clamp(d.y, -1.0, 1.0));',
        '    float stepA = 0.2617994;',
        '    float gl1 = abs(fract(lon / stepA + 0.5) - 0.5) * stepA * max(cos(lat), 0.05);',
        '    float gl2 = abs(fract(lat / stepA + 0.5) - 0.5) * stepA;',
        '    float line = 1.0 - smoothstep(0.0015, 0.0045, min(gl1, gl2));',
        '    vec3 base = d.x > 0.0 ? (d.z > 0.0 ? vec3(0.85, 0.25, 0.2) : vec3(0.95, 0.75, 0.2))',
        '                          : (d.z > 0.0 ? vec3(0.2, 0.55, 0.9) : vec3(0.25, 0.75, 0.45));',
        '    base *= d.y > 0.0 ? 0.55 : 0.28;',
        '    return mix(base, vec3(0.95), line);',
        '  }',
        '  vec3 col = starLayer(d, 48.0, 0.05) + starLayer(d, 110.0, 0.05) * 0.7 + starLayer(d, 230.0, 0.07) * 0.45;',
        '  vec3 n = normalize(vec3(0.35, 0.8, 0.5));',
        '  float band = exp(-pow(dot(d, n) * 3.2, 2.0));',
        '  float dust = fbm(d * 3.5 + 2.0);',
        '  float lanes = smoothstep(0.35, 0.7, fbm(d * 7.0 - 4.0));',
        '  col += band * (0.05 + 0.3 * dust * dust) * mix(vec3(0.55, 0.62, 0.9), vec3(1.0, 0.8, 0.6), dust) * (1.0 - 0.7 * lanes);',
        '  return col;',
        '}',

        'vec3 blackbody(float T) {',
        '  T = clamp(T, 1000.0, 40000.0) / 100.0;',
        '  float r = T <= 66.0 ? 1.0 : clamp(1.292936 * pow(T - 60.0, -0.1332047), 0.0, 1.0);',
        '  float g = T <= 66.0 ? clamp(0.39008158 * log(T) - 0.63184144, 0.0, 1.0)',
        '                      : clamp(1.129891 * pow(T - 60.0, -0.0755148), 0.0, 1.0);',
        '  float b = T >= 66.0 ? 1.0 : (T <= 19.0 ? 0.0 : clamp(0.54320679 * log(T - 10.0) - 1.19625409, 0.0, 1.0));',
        '  return vec3(r, g, b);',
        '}',

        'float streaks(vec3 c, float r, float t) {',
        '  float th = sqrt(0.5 / (r * r * r)) * t;',
        '  float cs = cos(th), sn = sin(th);',
        '  vec2 q = vec2(c.x * cs - c.z * sn, c.x * sn + c.z * cs) / r;',
        '  return fbm(vec3(q * 2.6, r * 0.75)) * 0.7 + noise3(vec3(q * 7.0, r * 2.4)) * 0.3;',
        '}',

        'vec4 disc(vec3 c, vec3 dir) {',
        '  float r = length(c);',
        '  float x = (r - RIN) / (ROUT - RIN);',
        '  float flux = pow(RIN / r, 3.0) * (1.0 - sqrt(RIN / r)) / 0.0567;',
        '  float g = 1.0;',
        '  if (uDoppler > 0.5) {',
        '    vec3 tang = normalize(vec3(-c.z, 0.0, c.x));',
        '    float beta = sqrt(0.5 / (r - 1.0));',
        '    float gam = 1.0 / sqrt(1.0 - beta * beta);',
        '    g = sqrt(1.0 - 1.0 / r) / (gam * (1.0 - beta * dot(tang, -dir)));',
        '  }',
        '  const float P = 36.0;',
        '  float t1 = mod(uTime, P), t2 = mod(uTime + 0.5 * P, P);',
        '  float w = 1.0 - abs(1.0 - 2.0 * t1 / P);',
        '  float n = mix(streaks(c, r, t2 + 50.0), streaks(c, r, t1), w);',
        '  n = smoothstep(0.2, 0.8, n);',
        '  float T = 4300.0 * pow(max(flux, 1e-4), 0.25) * g;',
        '  float I = pow(flux, 0.7) * g * g * g * g;',
        '  float dens = (0.45 + 0.55 * n) * smoothstep(0.0, 0.05, x) * smoothstep(1.0, 0.55, x);',
        '  return vec4(blackbody(T) * I * (0.3 + 1.0 * n) * 1.5, clamp(dens * 1.25, 0.0, 0.96));',
        '}',

        'void main() {',
        '  vec2 uv = (vUv - 0.5) * vec2(uRes.x / max(uRes.y, 1.0), 1.0);',
        '  uv *= max(1.0, 0.8 * uRes.y / max(uRes.x, 1.0));',
        '  vec3 p = uCam;',
        '  vec3 v = normalize(uBasis * vec3(uv * 0.95, 1.0));',
        '  vec3 hv = cross(p, v);',
        '  float h2 = dot(hv, hv) * uLens;',
        '  float rEsc = max(length(uCam) * 1.05, ROUT + 3.0);',

        /* Record up to two disc-plane crossings inside the lightweight geodesic
         * march and evaluate the 3D fbm disc shader afterwards — keeping noise
         * calls out of the loop avoids huge shader compile times on mobile/ANGLE. */
        '  vec3 hit0 = vec3(0.0), dir0 = vec3(0.0);',
        '  vec3 hit1 = vec3(0.0), dir1 = vec3(0.0);',
        '  int hits = 0;',
        '  bool escaped = false;',
        '  for (int i = 0; i < MAX_STEPS; i++) {',
        '    if (float(i) >= uSteps) break;',
        '    float r2 = dot(p, p), r = sqrt(r2);',
        '    if (r < 1.0) break;',
        '    if (r > rEsc && dot(p, v) > 0.0) { escaped = true; break; }',
        '    float dt = max(0.025, 0.065 * r);',
        '    vec3 a = -1.5 * h2 * p / (r2 * r2 * r);',
        '    vec3 pn = p + v * dt + 0.5 * a * dt * dt;',
        '    float n2 = dot(pn, pn);',
        '    vec3 an = -1.5 * h2 * pn / (n2 * n2 * sqrt(n2));',
        '    vec3 vn = v + 0.5 * (a + an) * dt;',
        '    if (uDisc > 0.5 && p.y * pn.y < 0.0 && hits < 2) {',
        '      float f = p.y / (p.y - pn.y);',
        '      vec3 c = mix(p, pn, f);',
        '      float rc = length(c);',
        '      if (rc > RIN && rc < ROUT) {',
        '        vec3 dc = normalize(mix(v, vn, f));',
        '        if (hits == 0) { hit0 = c; dir0 = dc; }',
        '        else { hit1 = c; dir1 = dc; }',
        '        hits++;',
        '      }',
        '    }',
        '    p = pn; v = vn;',
        '  }',

        '  vec3 col = vec3(0.0);',
        '  float trans = 1.0;',
        '  if (hits >= 1) {',
        '    vec4 d0 = disc(hit0, dir0);',
        '    col += trans * d0.rgb * d0.a;',
        '    trans *= 1.0 - d0.a;',
        '  }',
        '  if (hits >= 2 && trans > 0.01) {',
        '    vec4 d1 = disc(hit1, dir1);',
        '    col += trans * d1.rgb * d1.a;',
        '    trans *= 1.0 - d1.a;',
        '  }',
        '  if (escaped && trans > 0.01) col += trans * sky(normalize(v));',

        '  float lum = max(dot(col, vec3(0.3, 0.55, 0.15)), 1e-4);',
        '  float mapped = 1.0 - exp(-lum * 1.1);',
        '  col = col * (mapped / lum);',
        '  col = mix(col, vec3(mapped), smoothstep(0.75, 1.0, mapped) * 0.6);',
        '  col = pow(col, vec3(1.0 / 2.2));',
        '  col += (hash13(vec3(gl_FragCoord.xy, uTime)) - 0.5) / 255.0;',
        '  gl_FragColor = vec4(col, 1.0);',
        '}'
    ].join('\n');

    function massName(m) {
        if (m < 1e3) return +m.toPrecision(3) + ' M☉';
        if (m < 1e6) return +(m / 1e3).toPrecision(3) + 'k M☉';
        if (m < 1e9) return +(m / 1e6).toPrecision(3) + 'M M☉';
        return +(m / 1e9).toPrecision(3) + 'B M☉';
    }

    function presetIdFor(logM) {
        for (var i = 0; i < PRESETS.length; i++) {
            if (Math.abs(Math.log10(PRESETS[i][2]) - logM) < 0.015) return PRESETS[i][0];
        }
        return '';
    }

    function presetLabelFor(logM) {
        for (var i = 0; i < PRESETS.length; i++) {
            if (Math.abs(Math.log10(PRESETS[i][2]) - logM) < 0.015) return PRESETS[i][1];
        }
        return massName(Math.pow(10, logM));
    }

    function fmtHawking(suns) {
        var hk = G.hawkingKelvin(suns);
        var sup = '⁰¹²³⁴⁵⁶⁷⁸⁹';
        return hk.toExponential(1)
            .replace('e', ' × 10^')
            .replace('^-', '⁻')
            .replace(/\d+$/, function (d) {
                var out = '';
                for (var i = 0; i < d.length; i++) out += sup[d.charCodeAt(i) - 48];
                return out;
            }) + ' K';
    }

    function updateReadout() {
        var suns = Math.pow(10, massLog);
        var rs = G.rsKm(suns);
        var dist = orbit ? orbit.radius : 26;
        lastDistReadout = dist;
        VizApp.readout.show(presetLabelFor(massLog) + ' (' + massName(suns) + ')', [
            ['Horizon, across', G.fmtLength(2 * rs)],
            ['Shadow, across', G.fmtLength(G.shadowDiameter() * rs)],
            ['Inner disc lap', G.fmtTime(G.orbitPeriod(G.R_ISCO) * G.rsSeconds(suns))],
            ['Inner disc speed', '50% of light'],
            ['Glows at', fmtHawking(suns)],
            ['You are at', G.fmtLength(dist * rs)],
            ['Clock rate here', (G.clockRate(dist) * 100).toFixed(1) + '%']
        ]);
    }

    /* Interactive 2D top-down ray diagram, mounted inside the Controls drawer
     * via the shell's `custom` control spec so it tears down cleanly on switch. */
    var cachedFan = null;
    function getFan() {
        if (!cachedFan) {
            cachedFan = [];
            for (var b = -9; b <= 9.01; b += 0.75) cachedFan.push(G.trace(b, { start: 16, step: 0.03 }));
        }
        return cachedFan;
    }

    function mountRayWidget(container) {
        container.className = 'ctl-rays';
        var rc = document.createElement('canvas');
        rc.width = 560;
        rc.height = 350;
        var sayEl = document.createElement('p');
        sayEl.className = 'ctl-rays-say';
        var leg = document.createElement('div');
        leg.className = 'ctl-rays-legend';
        leg.innerHTML =
            '<span><i style="color:#fbbf24"></i>escapes</span>' +
            '<span><i style="color:#f87171"></i>caught</span>' +
            '<span><i style="color:#64748b;border-top-style:dashed"></i>photon sphere</span>';
        container.appendChild(rc);
        container.appendChild(sayEl);
        container.appendChild(leg);

        var rx = rc.getContext && rc.getContext('2d');
        if (!rx) return;

        var aimB = 3.4;
        var VIEW_W = 30;
        var fan = getFan();

        function toPx(x, y) {
            return [rc.width / 2 + x * rc.width / VIEW_W, rc.height / 2 - y * rc.width / VIEW_W];
        }
        function drawPath(points) {
            rx.beginPath();
            for (var i = 0; i < points.length; i++) {
                var q = toPx(points[i][0], points[i][1]);
                if (i) rx.lineTo(q[0], q[1]); else rx.moveTo(q[0], q[1]);
            }
            rx.stroke();
        }
        function drawRing(r, style, dash, fill) {
            var c = toPx(0, 0);
            rx.beginPath();
            rx.arc(c[0], c[1], r * rc.width / VIEW_W, 0, 7);
            rx.setLineDash(dash || []);
            if (fill) { rx.fillStyle = fill; rx.fill(); }
            if (style) { rx.strokeStyle = style; rx.lineWidth = 1.4; rx.stroke(); }
            rx.setLineDash([]);
        }
        function drawRays() {
            rx.clearRect(0, 0, rc.width, rc.height);
            rx.lineWidth = 1.1;
            rx.lineJoin = 'round';
            for (var i = 0; i < fan.length; i++) {
                rx.strokeStyle = fan[i].captured ? 'rgba(248,113,113,0.3)' : 'rgba(251,191,36,0.26)';
                drawPath(fan[i].points);
            }
            drawRing(G.R_ISCO, 'rgba(148,163,184,0.35)', [2, 5]);
            drawRing(G.R_PHOTON, '#64748b', [5, 4]);
            drawRing(G.R_HORIZON, 'rgba(255,255,255,0.25)', null, '#000');

            var t = G.trace(aimB, { start: 16, step: 0.01 });
            rx.lineWidth = 2.6;
            rx.strokeStyle = t.captured ? '#f87171' : '#fbbf24';
            rx.shadowColor = rx.strokeStyle;
            rx.shadowBlur = 9;
            drawPath(t.points);
            rx.shadowBlur = 0;

            var h = toPx(-VIEW_W / 2 + 0.9, aimB);
            rx.fillStyle = rx.strokeStyle;
            rx.beginPath();
            rx.arc(h[0], h[1], 6, 0, 7);
            rx.fill();

            var off = Math.abs(aimB).toFixed(2);
            var deg = t.deflection * 180 / Math.PI;
            if (t.captured) {
                sayEl.innerHTML = 'Aimed <b>' + off + '</b> radii off centre: <b class="caught">caught</b>' +
                    (deg > 200 ? ', after circling the hole' : '') +
                    '. Anything inside <b>2.60</b> is, which is why the shadow is 2.6× the hole.';
            } else if (deg > 360) {
                sayEl.innerHTML = 'Aimed <b>' + off + '</b> radii off centre: loops <b class="free">' +
                    (deg / 360).toFixed(1) + '×</b> round the photon sphere and escapes.';
            } else {
                sayEl.innerHTML = 'Aimed <b>' + off + '</b> radii off centre: <b class="free">escapes</b>, bent by <b>' +
                    deg.toFixed(deg < 10 ? 1 : 0) + '°</b>' +
                    (deg > 170 && deg < 190 ? ', straight back' : '') + '.';
            }
        }
        function aim(e) {
            var r = rc.getBoundingClientRect();
            if (!r.height) return;
            var y = (e.clientY - r.top) / r.height * rc.height;
            aimB = Math.max(-9, Math.min(9, (rc.height / 2 - y) * VIEW_W / rc.width));
            var signs = [1, -1];
            for (var i = 0; i < 2; i++) {
                if (Math.abs(aimB - signs[i] * G.B_CRIT) < 0.06) aimB = signs[i] * (G.B_CRIT + 0.004);
            }
            drawRays();
        }
        rc.addEventListener('pointerdown', function (e) {
            if (rc.setPointerCapture) { try { rc.setPointerCapture(e.pointerId); } catch (err) {} }
            aim(e);
        });
        rc.addEventListener('pointermove', function (e) {
            if (e.buttons || e.pointerType === 'touch') aim(e);
        });
        drawRays();
    }

    function updateBasis(pos) {
        var dist = Math.hypot(pos.x, pos.y, pos.z) || 1;
        var fx = -pos.x / dist, fy = -pos.y / dist, fz = -pos.z / dist;
        var rx = fz, rz = -fx;
        var rl = Math.hypot(rx, rz) || 1;
        rx = -rx / rl; rz = -rz / rl;
        var ry = 0;
        var ux = ry * fz - rz * fy;
        var uy = rz * fx - rx * fz;
        var uz = rx * fy - ry * fx;
        // Tilt the horizon slightly: a dead-level disc looks like a diagram.
        var roll = 0.12, cr = Math.cos(roll), sr = Math.sin(roll);
        var r2x = rx * cr + ux * sr, r2y = ry * cr + uy * sr, r2z = rz * cr + uz * sr;
        var u2x = ux * cr - rx * sr, u2y = uy * cr - ry * sr, u2z = uz * cr - rz * sr;
        // Matrix3.set takes row-major values so columns are [r2, u2, fwd].
        basis.set(
            r2x, u2x, fx,
            r2y, u2y, fy,
            r2z, u2z, fz
        );
    }

    VizApp.register({
        id: 'black-hole',
        label: 'Black hole',
        title: 'Curved space, one photon per pixel',
        blurb: 'Every pixel is a photon followed backwards along a Schwarzschild geodesic. ' +
               'Switch gravity off to compare with flat space, slide the mass from one Sun ' +
               'to TON 618, or open Controls to fire light past the shadow by hand.',
        hint: 'Drag to orbit · scroll or pinch to zoom · open Controls for mass & light paths',
        accent: '#fbbf24',

        controls: function () {
            return [
                { id: 'lens', type: 'toggle', label: 'Gravity bends light', value: opts.lens,
                  apply: function (v) { opts.lens = v; if (mat) mat.uniforms.uLens.value = v ? 1 : 0; } },
                { id: 'disc', type: 'toggle', label: 'Accretion disc', value: opts.disc,
                  apply: function (v) { opts.disc = v; if (mat) mat.uniforms.uDisc.value = v ? 1 : 0; } },
                { id: 'doppler', type: 'toggle', label: 'Relativistic beaming', value: opts.doppler,
                  apply: function (v) { opts.doppler = v; if (mat) mat.uniforms.uDoppler.value = v ? 1 : 0; } },
                { id: 'grid', type: 'toggle', label: 'Reference sky', value: opts.grid,
                  apply: function (v) { opts.grid = v; if (mat) mat.uniforms.uGrid.value = v ? 1 : 0; } },
                { id: 'spin', type: 'toggle', label: 'Drift the camera', value: opts.spin,
                  apply: function (v) {
                      opts.spin = v;
                      if (orbit) orbit.spin = (v && !(ctxRef && ctxRef.reducedMotion)) ? 0.035 : 0;
                  } },
                { id: 'preset', type: 'choice', label: 'Black hole', value: presetIdFor(massLog),
                  options: PRESETS.map(function (p) { return [p[0], p[1]]; }),
                  apply: function (id) {
                      for (var i = 0; i < PRESETS.length; i++) {
                          if (PRESETS[i][0] === id) {
                              massLog = Math.log10(PRESETS[i][2]);
                              VizApp.setControl('mass', massLog);
                              updateReadout();
                              break;
                          }
                      }
                  } },
                { id: 'mass', type: 'slider', label: 'Mass (log₁₀ M☉)', min: 0, max: 10.9, step: 0.01,
                  value: massLog,
                  format: function (v) { return massName(Math.pow(10, v)); },
                  apply: function (v) {
                      massLog = v;
                      VizApp.setControl('preset', presetIdFor(v));
                      updateReadout();
                  } },
                { id: 'rays', type: 'custom', label: 'Fire light past it (drag vertically)',
                  render: mountRayWidget }
            ];
        },

        init: function (ctx) {
            ctxRef = ctx;
            scene = new THREE.Scene();
            camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
            rayCam = new THREE.PerspectiveCamera(45, ctx.width / Math.max(ctx.height, 1), 0.1, 200);

            opts = { lens: true, disc: true, doppler: true, grid: false, spin: !ctx.reducedMotion };
            massLog = Math.log10(4.3e6);
            simTime = 0;

            var q = typeof URLSearchParams !== 'undefined' ? new URLSearchParams(location.search) : null;
            var initTheta = q && q.has('az') ? +q.get('az') : 0.6;
            var initEl = q && q.has('el') ? +q.get('el') : 0.14;
            var initDist = q && q.has('dist') ? +q.get('dist') : 26;
            if (q && q.has('still')) opts.spin = false;

            mat = new THREE.ShaderMaterial({
                uniforms: {
                    uRes: { value: new THREE.Vector2(ctx.width, ctx.height) },
                    uCam: { value: new THREE.Vector3() },
                    uBasis: { value: basis },
                    uTime: { value: 0 },
                    uLens: { value: 1 },
                    uDisc: { value: 1 },
                    uDoppler: { value: 1 },
                    uGrid: { value: 0 },
                    uSteps: { value: 240 }
                },
                vertexShader: [
                    'varying vec2 vUv;',
                    'void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }'
                ].join('\n'),
                fragmentShader: FRAG,
                depthTest: false,
                depthWrite: false
            });

            quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat);
            quad.frustumCulled = false;
            scene.add(quad);

            orbit = VizApp.makeOrbit(rayCam, ctx.canvas, {
                radius: initDist,
                minRadius: 4.5,
                maxRadius: 70,
                theta: initTheta,
                phi: Math.PI / 2 - initEl,
                minPhi: 0.12,
                maxPhi: Math.PI - 0.12,
                spin: opts.spin ? 0.035 : 0
            });
            orbit.update(0);

            ladder = VizApp.makeQualityLadder(ctx.renderer, [
                { scale: 0.45, steps: 140 },
                { scale: 0.65, steps: 170 },
                { scale: 0.85, steps: 200 },
                { scale: 1.00, steps: 220 }
            ], function (rung) {
                mat.uniforms.uSteps.value = rung.steps;
            });

            if (q && q.has('scale')) {
                var forced = Math.max(0.25, Math.min(2, +q.get('scale') || 0.7));
                ctx.renderer.setPixelRatio(forced);
            }

            this.resize(ctx.width, ctx.height);
            updateReadout();
            return { scene: scene, camera: camera };
        },

        update: function (dt) {
            ladder.tick();
            orbit.update(dt);

            if (!ctxRef.reducedMotion && (opts.disc || opts.spin)) {
                simTime += dt * 5;
            }
            mat.uniforms.uTime.value = simTime;
            mat.uniforms.uCam.value.copy(rayCam.position);
            updateBasis(rayCam.position);

            if (Math.abs(orbit.radius - lastDistReadout) > 0.35) {
                updateReadout();
            }
        },

        resize: function (w, h) {
            if (mat) mat.uniforms.uRes.value.set(w, h);
            if (rayCam) {
                rayCam.aspect = w / Math.max(h, 1);
                rayCam.updateProjectionMatrix();
            }
        },

        dispose: function () {
            if (orbit) orbit.dispose();
            if (ladder) ladder.dispose();
            VizApp.readout.hide();
            orbit = null; ladder = null; mat = null; quad = null; rayCam = null; ctxRef = null;
        }
    });
})();
