/* render/water.js — the sea, the ponds and what the sky does to them.
 *
 * Two calls. `material(theme, opts)` makes one water shader; `lightAll(mats,
 * …)` tells a hole's worth of them what sky they are reflecting, once, after
 * the lights are placed. Everything after that is two uniforms a frame —
 * `time` and `wind` — pushed in by render.js.
 *
 * The thing that makes it read as water is not the waves, it is the Fresnel
 * term (see the block above WATER_FS). Every other trick here is secondary to
 * that one.
 *
 * A material made here belongs to whoever asked for it: this file keeps no
 * list. render/hole.js records each one on the build so the frame loop can
 * find them and the hole can dispose them.
 *
 * Depends on render/palette.js. Holds no state.
 */
(function (G3) {
    'use strict';

    var lin = G3.palette.lin;
    var skyTint = G3.palette.tint;

    /* The sea used to be a blue box with a scrolling ripple texture painted on
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
        return mat;
    }

    /* What every water shader on a hole needs to know about the sky above it,
       said once when the hole is built rather than every frame: the sun it is
       reflecting, how hard, how much rain is stippling it, and the two fog
       distances that have to match the ones the lit materials are using or the
       sea and the ground meet at a visible seam.

       An overcast sea reflects an overcast sky, not the blue one the theme was
       drawn against — which is why the sky colour is mixed towards the cloud
       base by the coverage rather than taken from the palette straight. */
    function lightAll(mats, theme, weather, sunDir, fogNear, fogFar) {
        for (var i = 0; i < mats.length; i++) {
            var u = mats[i].uniforms;
            u.sunDir.value.copy(sunDir);
            u.sunColour.value.copy(lin(weather.warm || theme.sun));
            u.gloss.value = weather.sun;
            u.rain.value = weather.rain || 0;
            u.fogNear.value = fogNear;
            u.fogFar.value = fogFar;
            u.skyColour.value.copy(skyTint(theme.sky[1], weather, true))
                .lerp(lin(weather.cloudBase), weather.cloud * 0.8);
            u.fogColour.value.copy(skyTint(theme.fog, weather, false));
        }
    }

    G3.water = {
        material: waterMaterial,
        lightAll: lightAll
    };

})(window.G3);
