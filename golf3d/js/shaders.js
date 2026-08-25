/* The two shaders the game writes itself, as source.

   Everything else in this game is lit by three.js. These two are not: the sky
   and the water are raw ShaderMaterials, which is why they are the only files
   that have to convert their own colours (see `lin()` in render.js) and the
   only ones where a change means reading GLSL rather than setting a property.

   They live here, apart from the geometry, for the same reason the themes do:
   editing a cloud is a different job from placing a mesh, and neither should
   require scrolling through the other. render.js builds the materials that
   use them. */
(function (G3) {
    'use strict';

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

       Rain lands on it. Drops come off a hash grid, but a grid is exactly what
       you must not be able to see: one ring per cell, centred, lands them on a
       lattice and the squall reads as tiled wallpaper. So each cell jitters
       its drop off centre, gates on a hash so most cells are empty, and runs
       on its own phase and speed — then the whole thing is done twice more, at
       scales and bearings that do not divide into each other. What is left is
       rings arriving scattered and out of step, which is what rain does. */

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

        /* Two randoms per cell, without a sin in sight: sin-based hashes lose
           their nerve out where the sea's coordinates get big, and the sea is
           the one surface that goes all the way to the horizon. */
        'vec2 hash22(vec2 c){',
        '  vec3 q = fract(c.xyx * vec3(0.1031, 0.1030, 0.0973));',
        '  q += dot(q, q.yzx + 33.33);',
        '  return fract((q.xx + q.yz) * q.zy);',
        '}',

        /* One layer of drops: a ring per cell of a grid at `scale`, but pushed
           off the cell centre, most of them switched off, and each on its own
           phase. Only the slope is returned — same currency as wave(). */
        'vec2 drops(vec2 p, float scale, float t, float speed){',
        '  vec2 sp = p * scale;',
        '  vec2 cell = floor(sp);',
        '  vec2 h = hash22(cell);',
        '  vec2 j = hash22(cell + 17.31);',
        '  float on = step(h.y, 0.45);',
        '  vec2 d = fract(sp) - (vec2(0.5) + (j - 0.5) * 0.72);',
        '  float r = length(d) + 1e-4;',
        '  float ph = fract(t * speed * (0.7 + j.y * 0.6) + h.x);',
        '  float ring = sin((r - ph * 0.5) * 40.0) * exp(-r * 7.5) * (1.0 - ph);',
        '  return (d / r) * ring * on;',
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

        /* Three layers, each on a grid the others are not aligned to: the
           second is turned by about 37 degrees, the third by about 68 the
           other way, so no two lattices ever agree on where a row is. */
        '  if (rain > 0.001) {',
        '    mat2 rotA = mat2(0.80, -0.60, 0.60, 0.80);',
        '    mat2 rotB = mat2(0.37, 0.93, -0.93, 0.37);',
        '    g += drops(p, 2.30, t, 0.75) * 0.42 * rain;',
        '    g += drops(rotA * p + vec2(11.3, 4.7), 1.55, t + 3.1, 0.55) * 0.46 * rain;',
        '    g += drops(rotB * p - vec2(6.1, 19.4), 3.40, t + 7.7, 0.95) * 0.30 * rain;',
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

    G3.shaders = {
        SKY_VS: SKY_VS,
        SKY_FS: SKY_FS,
        WATER_VS: WATER_VS,
        WATER_FS: WATER_FS
    };

})(window.G3);
