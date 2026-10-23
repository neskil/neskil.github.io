/* Water, drawn as a shader: a small WebGL canvas the water's box is
   rendered into each frame and stamped onto the board inside the shoreline.

   It mixes two ways of drawing water on purpose. What happens *under* the
   surface is drawn as near to real as a top-down board allows: the bed is
   seen through the water and bent by its waves, sunlight is focused into
   caustics across the shallows, the colour deepens with the distance from
   the shore, the far side reflects more sky than the near one, and the sun
   — or the moon — glints off the crests. What happens *on* it is drawn like
   a cartoon: a crisp band of foam at the shore with a second line breathing
   in and out beyond it, cel-shaded contour lines along the crests, surf
   rolling in on the sea, a skin of ice round a winter pond. Realism tells
   the eye it is water; the outlines tell it where the water starts.

   Three rules, the scenery's own.

   **It changes nothing about play.** The physics tests the same rectangles
   and polygons it always has. The depth the shader reads is measured from
   those same zones (scenery.shoreField), so what looks shallow is water.

   **It is an extra, never a requirement.** No WebGL, a lost context, a
   shader that will not compile: `draw` returns false and landscape.js
   draws the water it always drew.

   **It costs a frame little.** Everything that depends only on the hole —
   the depth field, the box — is worked out once per hole and kept; a frame
   sets a handful of uniforms and draws one quad, at no more than one and a
   half pixels per world pixel. */
(function (GOLF) {
    'use strict';

    var C = GOLF.CONFIG;
    var SC = GOLF.scenery;
    var W = C.WORLD_W, H = C.WORLD_H;
    var REACH = 64;       // world px of distance from shore the depth field spans
    var RIPPLES = 4;

    var VERT = [
        'attribute vec2 aPos;',
        'varying vec2 vUv;',
        'void main() {',
        '    vUv = aPos;',
        '    gl_Position = vec4(aPos.x * 2.0 - 1.0, 1.0 - aPos.y * 2.0, 0.0, 1.0);',
        '}'
    ].join('\n');

    var FRAG = [
        // World positions run to 960 and time to minutes: half precision
        // would make the waves stutter on a phone that honours it.
        '#ifdef GL_FRAGMENT_PRECISION_HIGH',
        'precision highp float;',
        '#else',
        'precision mediump float;',
        '#endif',
        'varying vec2 vUv;',
        'uniform sampler2D uDist;',
        'uniform vec2 uTexel;',
        'uniform vec2 uOrigin;',
        'uniform vec2 uSize;',
        'uniform float uTime;',
        'uniform vec3 uShallow;',
        'uniform vec3 uDeep;',
        'uniform vec3 uBed;',
        'uniform vec3 uSky;',
        'uniform vec3 uBank;',
        'uniform vec2 uLight;',      // world direction of the screen's lit corner
        'uniform vec2 uDown;',       // world direction of screen-down
        'uniform vec2 uScreenY;',    // screen y = (dot(p, uDown) + x) * y, 0 at the top
        'uniform vec2 uFlow;',
        'uniform float uSea;',
        'uniform float uNight;',
        'uniform float uSkin;',
        'uniform float uClear;',
        'uniform vec4 uRip[' + RIPPLES + '];',

        'float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }',
        'float noise(vec2 p) {',
        '    vec2 i = floor(p), f = fract(p);',
        '    vec2 u = f * f * (3.0 - 2.0 * f);',
        '    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),',
        '               mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);',
        '}',

        // One wave as its height and its slope.
        'vec3 wave(vec2 p, vec2 k, float a, float w, float t) {',
        '    float ph = dot(k, p) + w * t;',
        '    return vec3(a * sin(ph), a * cos(ph) * k);',
        '}',

        'void main() {',
        '    vec2 p = uOrigin + vUv * uSize;',
        '    float t = uTime;',
        '    float d = texture2D(uDist, vUv).r;',
        // The shore's direction, from the slope of the depth field.
        '    vec2 gd = vec2(texture2D(uDist, vUv + vec2(uTexel.x, 0.0)).r - texture2D(uDist, vUv - vec2(uTexel.x, 0.0)).r,',
        '                   texture2D(uDist, vUv + vec2(0.0, uTexel.y)).r - texture2D(uDist, vUv - vec2(0.0, uTexel.y)).r);',
        '    float glen = length(gd);',
        '    vec2 inland = glen > 0.0001 ? gd / glen : vec2(0.0);',

        // The surface: two long swells and two short chops, the sea taller,
        // a stream carried along by its flow. Calmer in the shallows.
        '    vec2 q = p - uFlow * t;',
        '    vec3 s = wave(q, vec2(0.030, 0.011), 1.0 + uSea * 1.2, 1.2, t);',
        '    s += wave(q, vec2(-0.012, 0.034), 0.8 + uSea * 0.8, 1.5, t);',
        '    s += wave(q, vec2(0.071, -0.043), 0.35, 2.6, t);',
        '    s += wave(q, vec2(-0.052, -0.083), 0.25, 3.1, t);',
        '    float calm = 0.45 + 0.55 * smoothstep(0.0, 0.5, d);',
        '    vec2 slope = s.yz * calm;',
        '    float h = s.x * calm;',

        // Rings where something went in.
        '    for (int i = 0; i < ' + RIPPLES + '; i++) {',
        '        vec4 r = uRip[i];',
        '        if (r.w <= 0.0) continue;',
        '        vec2 dv = p - r.xy;',
        '        float dist = length(dv) + 0.001;',
        '        float env = exp(-abs(dist - r.z * 75.0) * 0.07) * exp(-r.z * 1.4) * r.w;',
        '        float ring = cos(dist * 0.32 - r.z * 13.0) * env;',
        '        slope += dv / dist * ring * 0.45;',
        '        h += ring * 2.2;',
        '    }',
        // A fine chop on top, which is what breaks the sun into sparkles.
        '    vec2 chop = vec2(noise(q * 0.24 + vec2(t * 0.7, 0.0)), noise(q * 0.24 + vec2(31.0, -t * 0.6))) - 0.5;',
        '    vec3 n = normalize(vec3(-slope * 5.0 + chop * 0.42, 1.0));',
        '    vec3 n0 = normalize(vec3(-slope * 6.0, 1.0));',

        // Under the surface: the bed, seen through the water and bent by it.
        '    vec2 bp = p + n.xy * (5.0 + 22.0 * d);',
        '    vec3 bed = uBed * (0.78 + 0.36 * noise(bp * 0.05));',
        '    bed *= 0.92 + 0.16 * smoothstep(0.58, 0.72, noise(bp * 0.21 + 7.0));',
        // Caustics: light focused into bright veins that crawl across it.
        '    vec2 cq = bp * 0.055 + vec2(t * 0.17, -t * 0.12);',
        '    float c1 = sin(cq.x * 3.0 + sin(cq.y * 2.1 + t * 0.9) * 1.7);',
        '    float c2 = sin(cq.y * 2.7 + sin(cq.x * 1.9 - t * 0.8) * 1.7);',
        '    float caust = pow(max(0.0, 1.0 - abs(c1 + c2) * 0.55), 7.0);',
        '    bed += caust * (1.0 - smoothstep(0.0, 0.8, d)) * (1.0 - uNight * 0.75) * 0.55;',
        // Absorbed with depth: clear at the edge, the deep colour mid-lake.
        '    float absorb = 1.0 - exp(-d * 2.8 / uClear);',
        '    vec3 col = mix(bed, uShallow, 0.42 + 0.3 * d);',
        '    col = mix(col, uDeep, absorb);',

        // The bank: in shadow on the water below the banks towards the
        // light, and reflected in it below the far bank.
        '    float nearBank = 1.0 - smoothstep(0.0, 0.22, d);',
        '    col *= 1.0 - 0.38 * nearBank * smoothstep(0.1, 0.7, dot(inland, -uLight));',
        '    col = mix(col, uBank * 0.7, 0.35 * nearBank * smoothstep(0.2, 0.9, dot(inland, uDown)));',

        // The sky: seen at a steeper angle across the far side of the water,
        // so the far side reflects more of it.
        '    float sy = clamp((dot(p, uDown) + uScreenY.x) * uScreenY.y, 0.0, 1.0);',
        '    float fres = 0.05 + 0.15 * (1.0 - sy) + 0.5 * (1.0 - n.z);',
        '    col = mix(col, uSky, clamp(fres, 0.0, 0.32));',

        // Light off the surface, sun or moon: a soft sheen where the swell
        // faces it, and in that sheen, sparkles: points scattered on a
        // jittered grid, each twinkling at its own rate.
        '    vec3 L = normalize(vec3(uLight * 0.7, 0.75));',
        '    vec3 V = normalize(vec3(uDown * 0.45, 1.0));',
        '    float facing = max(dot(n0, normalize(L + V)), 0.0);',
        '    vec3 glint = mix(vec3(1.0, 0.97, 0.88), vec3(0.78, 0.85, 1.0), uNight);',
        '    col += pow(facing, 220.0) * 0.18 * glint;',
        '    vec2 cell = floor(p / 7.0);',
        '    vec2 rnd = vec2(hash(cell), hash(cell + 17.0));',
        '    float dd = length(p - (cell + 0.2 + rnd * 0.6) * 7.0);',
        '    float tw = 0.5 + 0.5 * sin(t * (2.5 + rnd.x * 4.0) + rnd.y * 6.283);',
        '    float sparkle = (1.0 - smoothstep(0.5, 1.5, dd)) * smoothstep(0.6, 0.95, tw) * smoothstep(0.55, 0.95, pow(facing, 40.0));',
        '    col += sparkle * (1.1 - uNight * 0.4) * glint * smoothstep(0.05, 0.25, d);',

        // Cartoon: short strokes along the crests of the main swell, broken
        // up and drifting, like the marks a pen makes for waves.
        '    float ph = dot(vec2(0.030, 0.011), q) + 1.2 * t + noise(q * 0.018) * 2.4 + h * 0.15;',
        '    float crest = smoothstep(0.972, 0.99, sin(ph)) * smoothstep(0.70, 0.78, noise(q * 0.06 + vec2(t * 0.05, 0.0)));',
        '    col = mix(col, vec3(1.0), crest * (0.6 + uSea * 0.2) * smoothstep(0.12, 0.35, d));',

        // Cartoon: the foam at the shore, wobbling, and a second line
        // beyond it breathing in and out. Surf rolls in on the sea.
        '    float wob = (noise(p * 0.07 + vec2(t * 0.25, -t * 0.2)) - 0.5) * 0.08;',
        '    float edge = 0.085 + uSea * 0.06 + wob;',
        '    float foam = 1.0 - smoothstep(edge - 0.012, edge + 0.004, d);',
        '    float l2 = 0.2 + uSea * 0.07 + sin(t * 1.2 + noise(p * 0.04) * 6.0) * 0.035 + wob;',
        '    float line = smoothstep(l2 - 0.025, l2 - 0.01, d) - smoothstep(l2 + 0.01, l2 + 0.025, d);',
        '    float roll = fract(d * 1.7 + t * 0.16 + noise(p * 0.025) * 0.5);',
        '    float surf = uSea * (smoothstep(0.90, 0.93, roll) - smoothstep(0.96, 0.99, roll)) * (1.0 - smoothstep(0.3, 0.9, d));',
        '    vec3 foamCol = mix(vec3(1.0), vec3(0.62, 0.70, 0.82), uNight);',
        '    float wash = (foam * 0.92 + line * 0.5 + surf * 0.6) * (1.0 - uSkin);',
        '    col = mix(col, foamCol, clamp(wash, 0.0, 1.0));',

        // Winter: a skin of ice round the edge, frosted, with its own rim.
        '    float ice = 1.0 - smoothstep(0.17 + wob, 0.19 + wob, d);',
        '    float rim = smoothstep(0.15 + wob, 0.17 + wob, d) - smoothstep(0.19 + wob, 0.21 + wob, d);',
        '    vec3 frost = vec3(0.84, 0.92, 0.97) - noise(p * 0.12) * 0.06;',
        '    col = mix(col, frost, uSkin * ice * 0.82);',
        '    col = mix(col, vec3(1.0), uSkin * rim * 0.7);',

        '    gl_FragColor = vec4(col, 1.0);',
        '}'
    ].join('\n');

    var gl = null, canvas = null, prog = null, loc = {}, tex = null, failed = false, off = false;
    var hole = { key: null, box: null, cols: 0, rows: 0 };
    var ripples = [], now = 0;

    function compile(type, src) {
        var sh = gl.createShader(type);
        gl.shaderSource(sh, src);
        gl.compileShader(sh);
        if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sh) || 'shader');
        return sh;
    }

    function setup() {
        if (gl || failed) return !!gl;
        try {
            canvas = document.createElement('canvas');
            var c = canvas.getContext('webgl', { alpha: false, antialias: false, depth: false, stencil: false, premultipliedAlpha: false, preserveDrawingBuffer: false });
            if (!c) throw new Error('no webgl');
            gl = c;
            prog = gl.createProgram();
            gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT));
            gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG));
            gl.linkProgram(prog);
            if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog) || 'link');
            gl.useProgram(prog);
            var buf = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, buf);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]), gl.STATIC_DRAW);
            var aPos = gl.getAttribLocation(prog, 'aPos');
            gl.enableVertexAttribArray(aPos);
            gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);
            ['uDist', 'uTexel', 'uOrigin', 'uSize', 'uTime', 'uShallow', 'uDeep', 'uBed', 'uSky', 'uBank', 'uLight', 'uDown',
             'uScreenY', 'uFlow', 'uSea', 'uNight', 'uSkin', 'uClear', 'uRip'].forEach(function (n) {
                loc[n] = gl.getUniformLocation(prog, n);
            });
            tex = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, tex);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.uniform1i(loc.uDist, 0);
            canvas.addEventListener('webglcontextlost', function (e) { e.preventDefault(); failed = true; gl = null; });
            return true;
        } catch (e) {
            failed = true;
            gl = null;
            return false;
        }
    }

    // The depth field for this hole, as a texture over the water's box.
    function prepare(list, key) {
        if (hole.key === key) return hole.box !== null;
        hole.key = key;
        hole.box = SC.waterBox(list);
        if (!hole.box || hole.box.w < 2 || hole.box.h < 2) { hole.box = null; return false; }
        var f = SC.shoreField(list, hole.box);
        var px = new Uint8Array(f.cols * f.rows);
        for (var i = 0; i < px.length; i++) px[i] = Math.round(Math.min(1, f.d[i] / REACH) * 255);
        hole.cols = f.cols;
        hole.rows = f.rows;
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, f.cols, f.rows, 0, gl.LUMINANCE, gl.UNSIGNED_BYTE, px);
        return true;
    }

    function rgb(hex) {
        var n = parseInt(hex.slice(1), 16);
        return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255];
    }

    /* Draw this hole's water into `g`, which the caller has already clipped
       to the surface. `clock` is the render clock — the water moves while
       the world stands still between shots — or 0 under reduced motion. */
    function draw(g, list, theme, v, clock, opts) {
        if (off || !opts || !opts.key || !list || !list.length || !setup()) return false;
        try {
            if (!prepare(list, opts.key + '|' + list.length)) return false;
            now = clock;
            var box = hole.box, w = theme.water;
            var scale = Math.min(1.5, Math.max(0.25, opts.res || 1));
            var fw = hole.cols * SC.FIELD_CELL, fh = hole.rows * SC.FIELD_CELL;
            var cw = Math.max(1, Math.round(fw * scale)), ch = Math.max(1, Math.round(fh * scale));
            if (canvas.width !== cw || canvas.height !== ch) { canvas.width = cw; canvas.height = ch; }
            gl.viewport(0, 0, cw, ch);
            gl.useProgram(prog);
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, tex);
            gl.uniform2f(loc.uTexel, 1 / hole.cols, 1 / hole.rows);
            gl.uniform2f(loc.uOrigin, box.x, box.y);
            gl.uniform2f(loc.uSize, fw, fh);
            gl.uniform1f(loc.uTime, clock % 1000);
            gl.uniform3fv(loc.uShallow, rgb(w.top));
            gl.uniform3fv(loc.uDeep, rgb(w.deep));
            gl.uniform3fv(loc.uBed, rgb(w.bed || '#8a7a55'));
            gl.uniform3fv(loc.uSky, rgb(w.sky || '#bfe3f5'));
            gl.uniform3fv(loc.uBank, rgb(w.bank || '#5d4a2f'));
            var lightDir = GOLF.landscape.sv(v, -1, -1), ln = Math.hypot(lightDir.x, lightDir.y);
            gl.uniform2f(loc.uLight, lightDir.x / ln, lightDir.y / ln);
            gl.uniform2f(loc.uDown, v.dx, v.dy);
            // Screen y runs 0 at the top to 1 at the bottom of the field.
            if (v.turned) gl.uniform2f(loc.uScreenY, W, 1 / W);
            else gl.uniform2f(loc.uScreenY, 0, 1 / H);
            // A stream runs the long way down its own box.
            var fl = w.flow || 0;
            gl.uniform2f(loc.uFlow, box.w >= box.h ? fl : 0, box.w >= box.h ? 0 : fl);
            gl.uniform1f(loc.uSea, w.kind === 'sea' ? 1 : 0);
            gl.uniform1f(loc.uNight, theme.night ? 1 : 0);
            gl.uniform1f(loc.uSkin, w.skin ? 1 : 0);
            gl.uniform1f(loc.uClear, w.clear || 1);
            // Under reduced motion there is no clock, and a ring that never
            // spreads is a stain: no ripples at all.
            var rip = new Float32Array(RIPPLES * 4);
            ripples = opts.still ? [] : ripples.filter(function (r) { return clock - r.at < 3 && clock >= r.at; });
            for (var i = 0; i < Math.min(RIPPLES, ripples.length); i++) {
                var r = ripples[ripples.length - 1 - i];
                rip[i * 4] = r.x; rip[i * 4 + 1] = r.y; rip[i * 4 + 2] = clock - r.at; rip[i * 4 + 3] = r.k;
            }
            gl.uniform4fv(loc.uRip, rip);
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
            g.drawImage(canvas, box.x, box.y, fw, fh);
            return true;
        } catch (e) {
            failed = true;
            return false;
        }
    }

    // Something went in: rings spread from where it did.
    function ripple(x, y, strength) {
        ripples.push({ x: x, y: y, at: now, k: strength || 1 });
        if (ripples.length > 8) ripples.shift();
    }

    GOLF.water = {
        draw: draw,
        ripple: ripple,
        supported: function () { return !off && setup(); },
        // For the suite: force the plain water, or let the shader back.
        disable: function (yes) { off = !!yes; },
        ripples: function () { return ripples.length; },
        FRAG: FRAG
    };

})(window.GOLF);
