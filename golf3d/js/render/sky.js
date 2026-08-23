/* render/sky.js — the dome overhead, and every cloud in it.
 *
 * One call: `G3.sky.dome(theme, weather)` returns a mesh and the material that
 * drives it. The caller parents the mesh to the hole and keeps the material to
 * push the cloud drift into each frame — that is the whole interface, and the
 * only two uniforms anyone outside touches are `drift` and `sunDir`.
 *
 * This is the one genuinely expensive shader in the game and it earns it: the
 * whole of the weather you can see without looking down is in here. See the
 * block above SKY_FS for how the clouds work.
 *
 * Depends on render/palette.js for `lin` and `tint`. Holds no state.
 */
(function (G3) {
    'use strict';

    var lin = G3.palette.lin;
    var skyTint = G3.palette.tint;

    /* The sky was a two-stop gradient, which is fine until you look up. It is
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
        // The material goes back with the mesh rather than being stashed
        // somewhere shared: the caller is the one that has to push the
        // cloud drift in every frame, so it is the one that keeps it.
        return { mesh: mesh, material: mat };
    }

    G3.sky = { dome: skyDome };

})(window.G3);
