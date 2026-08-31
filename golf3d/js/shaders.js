/* The GLSL the game writes itself, as source.

   Everything else in this game is lit by three.js. The sky and the water are
   not: they are raw ShaderMaterials, which is why this is the only file that
   has to convert its own colours (see `lin()` in render.js) and the only one
   where a change means reading GLSL rather than setting a property.

   The turf at the bottom is a third thing again — not a shader but four
   fragments of one, spliced into three.js's own Lambert. It is here because
   what it is made of is GLSL, and this is the file you open when that is the
   answer.

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
       rings arriving scattered and out of step, which is what rain does.

       ── two seas, one source ──

       Everything above is the *plain* sea, and it is what a phone gets. Behind
       `#ifdef PRETTY` there is a second one, compiled from the same string by
       flipping a define (render.setWaterQuality), which adds the four things
       that cost real fill rate:

         · **a reflected sky, not a colour.** The plain sea mixes towards one
           flat blue. The pretty one reflects the actual view ray off the
           actual wave normal and evaluates a small stand-in for the sky dome
           at it — gradient, sun, horizon haze — so the sun draws a *streak*
           down the water that breaks up on the chop, which is the single most
           recognisable thing a sea does and the one you cannot fake with a
           constant.
         · **crests.** The trains now accumulate height as well as slope, which
           costs one sin each and buys the top of a wave: foam where it peaks,
           and light coming *through* it towards a camera on the far side.
         · **glitter.** A fine noise-gradient on the normal, faded out with
           distance, so the specular breaks into moving sparks instead of a
           smooth sheen.
         · **an honest alpha.** A pond's surface goes opaque at a grazing angle
           and clear looking down, rather than sitting at one hardcoded 0.86.

       ── the part that is not optional ──

       Both seas are level-of-detailed now. A wave train whose wavelength is
       smaller than the pixel it lands in is not detail, it is noise: it
       crawls, it aliases, and on a sea seen edge-on — where one pixel can span
       tens of metres — the top trains used to turn the middle distance into
       television static. `train()` therefore weighs each wave against the
       world-space size of the pixel it is being drawn into and fades it out
       before it reaches that size. The footprint is divided by the view ray's
       own steepness, because that is where the stretching comes from: looking
       down at water, a pixel is small; looking along it, a pixel is a field.

       That fade is also why the horizon comes out mirror-flat and calm-looking
       rather than boiling: with every train faded, what is left is a plane
       reflecting the sky, which is exactly what distant water is. */

    var WATER_VS = [
        'varying vec3 vWorld;',
        'void main(){',
        '  vec4 wp = modelMatrix * vec4(position, 1.0);',
        '  vWorld = wp.xyz;',
        '  gl_Position = projectionMatrix * viewMatrix * wp;',
        '}'
    ].join('\n');

    var WATER_FS = [
        'uniform vec3 deep, shallow, skyColour, skyTop, sunColour, fogColour, sunDir;',
        'uniform float time, gloss, rain, fogNear, fogFar, alpha, chop;',
        'uniform vec2 wind;',
        'varying vec3 vWorld;',

        /* One travelling wave. The slope is what the normal is built from; the
           height is what tells the pretty path where the crests are, and it is
           accumulated alongside because the sin is already paid for by the cos.

           `fp` is the world-space width of the pixel this fragment covers, and
           `k` is the verdict on whether this train survives it: a wave whose
           whole wavelength fits inside one pixel is deleted rather than
           sampled, because sampling it is how you get static. `hsum` follows
           the same weighting so that the height stays normalisable — a crest
           test against a fixed number would drift as the far trains fade. */
        'void train(inout vec2 g, inout float hgt, inout float hsum,',
        '           vec2 dir, float freq, float amp, float speed, vec2 p, float t, float fp){',
        '  float k = clamp(6.2831 / (freq * fp * 8.0), 0.0, 1.0);',
        '  float ph = dot(p, dir) * freq + t * speed;',
        '  g    += dir * (cos(ph) * amp * freq * k);',
        '  hgt  += sin(ph) * amp * k;',
        '  hsum += amp * k;',
        '}',

        /* Two randoms per cell, without a sin in sight: sin-based hashes lose
           their nerve out where the sea's coordinates get big, and the sea is
           the one surface that goes all the way to the horizon. */
        'vec2 hash22(vec2 c){',
        '  vec3 q = fract(c.xyx * vec3(0.1031, 0.1030, 0.0973));',
        '  q += dot(q, q.yzx + 33.33);',
        '  return fract((q.xx + q.yz) * q.zy);',
        '}',

        '#ifdef PRETTY',
        'float vnoise2(vec2 p){',
        '  vec2 i = floor(p), f = fract(p);',
        '  f = f * f * (3.0 - 2.0 * f);',
        '  float a = hash22(i).x, b = hash22(i + vec2(1.0, 0.0)).x;',
        '  float c = hash22(i + vec2(0.0, 1.0)).x, d = hash22(i + vec2(1.0, 1.0)).x;',
        '  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);',
        '}',

        /* A stand-in for the sky dome, cheap enough to call per fragment. It
           is deliberately *not* the sky shader: the clouds are the expensive
           half of that one and a cloud reflected in chop is a grey smear, but
           the gradient, the sun and the horizon haze are the three things the
           eye actually checks a reflection against. Sharing the dome uniforms
           is what keeps the sea under the same weather as the sky above it. */
        'vec3 skyAt(vec3 r){',
        '  vec3 c = mix(skyColour, skyTop, smoothstep(0.0, 0.5, max(r.y, 0.0)));',
        '  float sd = max(dot(r, sunDir), 0.0);',
        '  c += sunColour * (pow(sd, 26.0) * 0.55 + pow(sd, 5.0) * 0.10) * gloss;',
        // Reflections of the horizon are reflections of the fog, or the sea
        // meets the sky in a hard line the sky itself does not have.
        '  return mix(c, fogColour, smoothstep(0.16, -0.03, r.y));',
        '}',
        '#endif',

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

        '  vec3 toCam = cameraPosition - vWorld;',
        '  float dist = length(toCam);',
        '  vec3 v = toCam / max(dist, 1e-4);',
        /* How wide, in metres, the pixel under this fragment is. Distance is
           half of it; the other half is that a ray skimming along the surface
           covers far more water per pixel than one looking down at it, which
           is why the far half of a sea seen from a low camera is the part that
           boils. Dividing by the ray's steepness is that whole correction. */
        '  float fp = dist * 0.0022 / max(abs(v.y), 0.05);',

        /* Five trains, and every number in here is chosen not to divide into
           the others. Harmonic frequencies on similar bearings beat against
           each other into a plaid that reads as a tiled texture the moment the
           camera goes overhead — which is exactly what this replaced. */
        '  vec2 g = vec2(0.0);',
        '  float hgt = 0.0, hsum = 1e-4;',
        '  train(g, hgt, hsum, w, 1.27, 0.046 * chop, 1.31, p, t, fp);',
        '  train(g, hgt, hsum, normalize(w + wp * 0.75), 2.11, 0.026 * chop, 1.77, p, t, fp);',
        '  train(g, hgt, hsum, normalize(w - wp * 1.35), 3.67, 0.014 * chop, 2.39, p, t, fp);',
        '  train(g, hgt, hsum, normalize(-w + wp * 0.45), 6.31, 0.0072 * chop, 3.07, p, t, fp);',
        '  train(g, hgt, hsum, normalize(w * 0.35 - wp), 9.87, 0.0036 * chop, 4.13, p, t, fp);',
        '#ifdef PRETTY',
        /* Three more, an octave apart and on bearings of their own. They are
           only ever visible within a few metres of the camera — the footprint
           test above deletes them well before the middle distance — which is
           exactly the range where the plain sea reads as smooth plastic. */
        '  train(g, hgt, hsum, normalize(-w - wp * 0.62), 14.30, 0.0021 * chop, 5.21, p, t, fp);',
        '  train(g, hgt, hsum, normalize(w * 1.4 + wp * 0.28), 21.70, 0.0012 * chop, 6.47, p, t, fp);',
        '  train(g, hgt, hsum, normalize(wp * 0.9 - w * 0.2), 33.10, 0.0007 * chop, 8.03, p, t, fp);',
        '#endif',

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

        '#ifdef PRETTY',
        /* Glitter. Not a wave — a fine, incoherent wobble in the normal, which
           is what turns the specular from a smooth sheen into a field of
           moving sparks. It is a gradient rather than a value (two differences
           of the same noise) because what the specular reads is the tilt, and
           it is faded out with the footprint for the usual reason: unresolved
           glitter is white noise, and white noise on a bright highlight is the
           worst place in the frame to have any. */
        '  float mk = clamp(1.0 - fp * 9.0, 0.0, 1.0);',
        '  if (mk > 0.001) {',
        '    vec2 q = p * 6.0 + w * t * 0.6;',
        '    float c0 = vnoise2(q);',
        '    g += vec2(c0 - vnoise2(q + vec2(0.11, 0.0)),',
        '              c0 - vnoise2(q + vec2(0.0, 0.11))) * 0.9 * mk * chop;',
        '  }',
        '#endif',

        '  vec3 n = normalize(vec3(-g.x, 1.0, -g.y));',
        '  float ndv = max(dot(n, v), 0.0);',

        // Schlick, with water's 0.02 at normal incidence. This is the whole
        // trick: a mirror at the horizon, a pond at your feet.
        '  float fres = 0.02 + 0.98 * pow(1.0 - ndv, 5.0);',
        '  vec3 body = mix(deep, shallow, clamp(ndv * 1.25, 0.0, 1.0));',
        /* What the surface is reflecting. Flat, in the cheap sea — one colour
           for the whole sheet, which is right about the average and wrong
           about everything else. In the pretty one the view ray is actually
           bounced off the wave it landed on, so the reflection moves with the
           water: the sun's streak, the bright half of the sky on the faces
           tilted up towards it, the haze on the ones tilted towards the
           horizon. Same Fresnel either way — only the thing on the far side
           of it changes. */
        '#ifdef PRETTY',
        '  vec3 refl = skyAt(reflect(-v, n));',
        '#else',
        '  vec3 refl = skyColour;',
        '#endif',
        '  vec3 col = mix(body, refl, clamp(fres, 0.0, 0.92));',

        '#ifdef PRETTY',
        /* Light through the top of a wave. A crest is a few centimetres of
           water with the sun behind it, and it glows: that glow is why a sea
           lit from the far side reads as water and not as tinfoil. `hn` is the
           height normalised by the trains that actually survived the LOD, so
           the test means "near the top of whatever wave is left here"; `back`
           is the camera looking into the sun through the wave, with the sun
           pushed slightly below the horizon so the effect survives a high sun.
           It is worth noting this is the one term that goes *up* as the water
           gets rougher, which is also true of the real thing. */
        '  float hn = hgt / hsum;',
        '  float back = pow(max(dot(v, -normalize(vec3(sunDir.x, -sunDir.y * 0.35, sunDir.z))), 0.0), 3.0);',
        '  col += mix(shallow, sunColour, 0.4) * smoothstep(0.10, 0.95, hn) * back * 0.55 * gloss;',
        '#endif',

        // Sun glint. Two exponents: a broad sheen and the hard sparkle on the
        // crests, which is the part that makes it move.
        '  vec3 hv = normalize(sunDir + v);',
        '  float spec = max(dot(n, hv), 0.0);',
        '  col += sunColour * pow(spec, 48.0) * 0.34 * gloss;',
        '  col += sunColour * pow(spec, 320.0) * 1.10 * gloss;',

        '  float foam = 0.0;',
        '#ifdef PRETTY',
        /* Foam, on the crests and only once there is a wind worth the name —
           a millpond does not break. The height test alone gives smooth bands
           along the wave, which is a contour line and not foam, so it is cut
           with two octaves of drifting noise; what is left is patches that
           appear on the peaks, tear, and are gone by the trough. It fades with
           the footprint as well: sub-pixel foam is just a haze that lightens
           the whole sea and steals the horizon. */
        '  float fw = smoothstep(0.55, 0.98, hn) * smoothstep(0.6, 1.5, chop);',
        '  float fn = vnoise2(p * 2.6 - w * t * 0.5) * 0.6 + vnoise2(p * 7.0 + w * t * 0.9) * 0.4;',
        '  foam = clamp(fw * smoothstep(0.35, 0.75, fn), 0.0, 1.0) * clamp(1.0 - fp * 2.0, 0.0, 1.0);',
        '  col = mix(col, vec3(0.92, 0.96, 0.98), foam * 0.85);',
        '#endif',

        '  col = mix(col, fogColour, smoothstep(fogNear, fogFar, dist));',

        /* How much of the bed shows through. The flat number the cheap path
           uses is a compromise between the two ends of the same pond: looking
           straight down you should see the floor, and along the surface you
           should see none of it, because the light reaching your eye from that
           direction bounced off the top. Fresnel already knows that ratio, so
           the pretty path spends it — and foam, being air, is opaque. A sea
           (alpha 1) is unaffected either way; the term is scaled by what is
           left to give. */
        '  float a = alpha;',
        '#ifdef PRETTY',
        '  a = clamp(alpha + (1.0 - alpha) * (fres * 0.85 + foam), 0.0, 1.0);',
        '#endif',
        '  gl_FragColor = vec4(col, a);',
        '}'
    ].join('\n');

    /* ── the turf ───────────────────────────────────────────────────────

       Not a shader — four fragments of one, spliced into three.js's own
       Lambert with `onBeforeCompile` (see `render.buildSurfaces`). The grass
       wants three things that a texture cannot give it, all of which need to
       know where in the *world* a fragment is rather than where in the tile:

         · **patches.** Turf grows thick in some places and thin in others, at
           a scale far larger than any tile — and a modulation at that scale is
           also the thing that stops a repeating sheet reading as a repeating
           sheet. Two octaves of value noise scale the height field before the
           alphaTest, so a thin patch simply fails to reach the upper shells.
         · **the mower.** The comb is baked into the sheet, but a comb on flat
           planes changes only the silhouette, and most of what you actually
           see in a striped green is the *light* coming back differently off
           blades leaning towards you and away. That is a few percent of
           brightness, alternating every `MOW`, and it is worth more than the
           comb it is drawn on top of.
         · **colour that is not one colour.** The same noise, quietly, so no
           two square metres of a course are the same green.

       It is spliced at `<alphatest_fragment>` because that is the last moment
       before the cut-out is decided and the first at which the map has been
       sampled — modify the height field after the discard and you are shading
       texels that were about to be thrown away.

       One uniform: `mowK`, which is π over the mower's width. It is the only
       number in here that has to agree with anything else (textures.MOW), and
       passing it beats writing 3.59 in two files. */

    var TURF_VS_HEAD = 'varying vec3 vTurf;\n';
    var TURF_VS_BODY = [
        '#include <begin_vertex>',
        '\tvTurf = ( modelMatrix * vec4( transformed, 1.0 ) ).xyz;'
    ].join('\n');

    var TURF_FS_HEAD = [
        'varying vec3 vTurf;',
        'uniform float mowK;',
        'float turfHash(vec2 p){',
        '  p = fract(p * vec2(127.31, 311.7));',
        '  p += dot(p, p + 34.21);',
        '  return fract(p.x * p.y);',
        '}',
        'float turfNoise(vec2 p){',
        '  vec2 i = floor(p), f = fract(p);',
        '  f = f * f * (3.0 - 2.0 * f);',
        '  float a = turfHash(i), b = turfHash(i + vec2(1.0, 0.0));',
        '  float c = turfHash(i + vec2(0.0, 1.0)), d = turfHash(i + vec2(1.0, 1.0));',
        '  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);',
        '}',
        ''
    ].join('\n');

    var TURF_FS_BODY = [
        '  float turf = turfNoise(vTurf.xz * 0.30) * 0.62 + turfNoise(vTurf.xz * 1.4) * 0.38;',
        // Thick and thin. Below one, blades lose height and the top shells
        // drop them; above, the mat stands up and the stack fills in.
        '  diffuseColor.a *= 0.84 + 0.30 * turf;',
        // The stripe, softened at its edges: a mower leaves a seam, not a wall.
        '  float mow = smoothstep(-0.45, 0.45, sin(vTurf.z * mowK));',
        // The blades in a stripe stand a shade differently as well as catching
        // the light differently, which is what keeps the band from reading as
        // paint when the camera comes down to the ground.
        '  diffuseColor.a *= mix(0.96, 1.04, mow);',
        '  diffuseColor.rgb *= mix(0.90, 1.10, mow) * (0.96 + 0.08 * turf);',
        '#ifdef ALPHATEST',
        '  if ( diffuseColor.a < ALPHATEST ) discard;',
        '#endif'
    ].join('\n');

    /* ── the hills on the horizon ───────────────────────────────────────

       Two lines of GLSL, and they are two lines on purpose.

       The ranges are real geometry (render.js → the hills on the horizon), a
       long way out and lit by nothing: at two hundred units every one of them
       is the same distance from the same sun, so what a light would compute
       per frame is exactly what the build already knows per vertex. Their
       colour — the rock, the snow on the tops, the haze eating the feet, the
       side that faces the sun — is baked into a vertex attribute when the hole
       is built, and this shader's whole job is to not interfere with it.

       Which is why it is a `ShaderMaterial` rather than a Basic one with
       `vertexColors`. The horizon has to *match the sky*, and the sky is a raw
       shader that writes its colours out untouched — no fog, no tone map, no
       encode. A built-in material would take all three on the way to the frame
       buffer and a hill painted the fog's own colour would come out a
       different one from the fog behind it, which is a seam along the exact
       line this whole feature exists to hide. Same treatment, same colour, no
       seam. */

    var RIDGE_VS = [
        'attribute vec3 tint;',
        'varying vec3 vTint;',
        'void main(){',
        '  vTint = tint;',
        '  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);',
        '}'
    ].join('\n');

    var RIDGE_FS = [
        'varying vec3 vTint;',
        'void main(){ gl_FragColor = vec4(vTint, 1.0); }'
    ].join('\n');

    /* ── the surround ───────────────────────────────────────────────────

       The ground beyond the course is one enormous mesh with one small
       texture on it, and that is a bargain everywhere except in the one place
       it shows: a tile a few metres across, laid out flat and lit evenly, is
       a grid, and once the eye has found the grid it cannot stop finding it.
       The old plane repeated its 256² rock a hundred and fifty times and read
       as wallpaper from the tee.

       The fix is not a bigger texture — it is a second signal that does not
       share the first one's period. Three octaves of world-space value noise,
       at scales that do not divide into the tiling or into each other, vary
       how bright the ground is and drift it between a warm tint and a cool
       one. The texture keeps supplying the grain; the noise supplies
       everything above the grain, and where a tile edge used to line up with
       its neighbour it now lands in the middle of a patch that does not care
       where the tile is.

       World space, not UV space, is the point: the patches stay put as the
       camera moves and they are the same size on every course, whatever that
       course's surround is tiled at.

       Spliced at `<map_fragment>`, the first moment the texture has been read
       and the last before the light gets hold of the result. */

    var SUR_VS_HEAD = 'varying vec3 vSur;\n';
    var SUR_VS_BODY = [
        '#include <begin_vertex>',
        '\tvSur = ( modelMatrix * vec4( transformed, 1.0 ) ).xyz;'
    ].join('\n');

    var SUR_FS_HEAD = [
        'varying vec3 vSur;',
        'float surHash(vec2 p){',
        '  p = fract(p * vec2(211.17, 97.43));',
        '  p += dot(p, p + 27.83);',
        '  return fract(p.x * p.y);',
        '}',
        'float surNoise(vec2 p){',
        '  vec2 i = floor(p), f = fract(p);',
        '  f = f * f * (3.0 - 2.0 * f);',
        '  float a = surHash(i), b = surHash(i + vec2(1.0, 0.0));',
        '  float c = surHash(i + vec2(0.0, 1.0)), d = surHash(i + vec2(1.0, 1.0));',
        '  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);',
        '}',
        ''
    ].join('\n');

    var SUR_FS_BODY = [
        '#include <map_fragment>',
        // Roughly fifty metres, twelve, and three: the widest is the one that
        // breaks the tiling, the middle is what makes the ground look like
        // country, and the finest is there so the near field is not a smooth
        // wash under the player's feet.
        '	float sBig = surNoise(vSur.xz * 0.021);',
        '	float sMid = surNoise(vSur.xz * 0.085);',
        '	float sFine = surNoise(vSur.xz * 0.34);',
        '	float sN = sBig * 0.52 + sMid * 0.31 + sFine * 0.17;',
        '	diffuseColor.rgb *= 0.74 + 0.54 * sN;',
        // Ground is never one colour: dry patches run warm and the hollows
        // between them run cool. Two percent either way is enough — any more
        // and a rock course starts looking like it is under a disco light.
        '	diffuseColor.rgb *= mix(vec3(1.05, 1.01, 0.93), vec3(0.93, 0.97, 1.04),',
        '		smoothstep(0.30, 0.76, sBig * 0.7 + sMid * 0.3));'
    ].join('\n');

    G3.shaders = {
        SKY_VS: SKY_VS,
        SKY_FS: SKY_FS,
        WATER_VS: WATER_VS,
        WATER_FS: WATER_FS,
        TURF_VS_HEAD: TURF_VS_HEAD,
        TURF_VS_BODY: TURF_VS_BODY,
        TURF_FS_HEAD: TURF_FS_HEAD,
        TURF_FS_BODY: TURF_FS_BODY,
        SUR_VS_HEAD: SUR_VS_HEAD,
        SUR_VS_BODY: SUR_VS_BODY,
        SUR_FS_HEAD: SUR_FS_HEAD,
        SUR_FS_BODY: SUR_FS_BODY,
        RIDGE_VS: RIDGE_VS,
        RIDGE_FS: RIDGE_FS
    };

})(window.G3);
