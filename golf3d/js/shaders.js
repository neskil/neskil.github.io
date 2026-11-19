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

    /* Where the cut-out stops being worth having, in world units of ground
       per pixel. A blade in the sheets textures.js draws is about a
       hundredth of a unit across at the rough's tiling and half that at the
       green's, so the mip has begun averaging the gaps away by LOD_NEAR and
       has nothing left of them by LOD_FAR, four times further out. Both are
       resolutions rather than distances, which is the point: the same hole
       keeps its blades further down the fairway on a screen with the pixels
       to draw them and gives them up sooner on a phone, without either being
       told which it is. */
    var TURF_LOD = { near: 0.014, far: 0.046 };

    var TURF_FS_HEAD = [
        'varying vec3 vTurf;',
        'uniform float mowK;',
        'uniform vec3 shellFar;',
        'const float LOD_NEAR = ' + TURF_LOD.near.toFixed(4) + ';',
        'const float LOD_FAR = ' + TURF_LOD.far.toFixed(4) + ';',
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
        /* And the stack closes up once it is too far off to be resolved.

           `fwidth` of the world position is how much ground one pixel covers,
           which is the number the cut-out is actually competing with: once a
           pixel is wider than a blade, the mip it samples has averaged the
           gaps into the blades, the test throws away whichever texels came out
           short of it, and what is left is not grass at a distance — it is a
           stipple, and one that crawls as the camera turns. On ground falling
           away from the eye, where a pixel covers metres rather than
           centimetres, it combs into wedges instead: the sawtooth that made a
           parkland hillside look shredded from the demo's seat.

           So past that point the shell stops being a cut-out and becomes what
           it is standing in for: a solid mat of its own colour, which is the
           average the mip was trying to give us all along. The tips fill in
           first because the top shells are the ones testing hardest — a
           distant lie flattens rather than thinning, which is what grass does
           to the eye anyway. It is the projected tiling that aliases, so the
           rate is measured in x and z only; the y a slope adds is stretch the
           top-down UVs never see. */
        '  float px = max(fwidth(vTurf.x), fwidth(vTurf.z));',
        '  float solid = smoothstep(LOD_NEAR, LOD_FAR, px);',
        '  diffuseColor.a = mix(diffuseColor.a, 1.0, solid);',
        // Closing the gaps is only half of it: what covers the ground out
        // there is the top shell, and the top shell is the lit tip of a stand
        // of grass rather than the whole of one. `shellFar` is what takes
        // whichever layer survives to the colour the stack had — see
        // render.js's shells().
        '  diffuseColor.rgb *= mix(vec3(1.0), shellFar, solid);',
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

    /* ── the black hole ─────────────────────────────────────────────────

       One shader for the three things in the game that eat a ball (v1.129.0):
       the mouth of a pipe, the hole that opens in the sky over its exit to
       let the ball back out, and a gravity well. The look is the one the
       owner liked in Cargo Lander's (cargo-lander/render/shaders.js, the
       gravity-well quad and the lensing in its post pass), carried over into
       a world with a camera that walks round it:

         · **an event horizon** — black, and opaque, so whatever is behind it
           is simply gone, ball included. Its edge is a thin photon ring, the
           one sharp line in the picture, so the size of the thing reads at
           any distance.
         · **an accretion disc** — value noise sampled round a circle, so it
           has no seam where the angle wraps, in a frame that turns faster the
           nearer the middle it is (the inside of a disc out-orbits the
           outside) and is wound by the log of the radius, so the streaks come
           out as spiral arms rather than spokes. White-hot at the horizon,
           `hot` through the bright band at `ring`, `cool` at the rim.
         · **rings feeding in** — Cargo Lander's "shrinking circles": a
           fract() of log radius plus time, so a ring keeps its spacing in
           proportion as it closes, brighter the nearer it gets.
         · **the pull** — the disc darkens what it is laid over, deepest at
           the middle (`shade`), which on the ground reads as the floor
           falling away into it. The bending of what is *behind* it is not in
           here at all: a shader cannot see behind itself. That is postfx.js
           (`lens`), which has the finished picture to bend.

       Written premultiplied — the colour is light added, the alpha is how
       much of the scene behind is put out — so one draw both darkens and
       glows, and the material is blended ONE, ONE_MINUS_SRC_ALPHA.

       `vP` is the quad's own coordinate, −1..1, so 1 is the edge of the
       effect whatever `size` (the world radius) is. `FACING` turns the quad
       to the camera — the sky portal and the glow round a well's core —
       and without it the quad lies wherever its mesh puts it, which for the
       mouth and the well's disc is flat on the ground. `open` grows the
       whole thing from a point, which is how the sky portal opens. */
    var BLACKHOLE_VS = [
        'uniform float size;',
        'varying vec2 vP;',
        'void main(){',
        '  vP = position.xy;',
        '#ifdef FACING',
        // Set back along the view ray by most of its own radius, scaled up to
        // match, so it looks exactly the same size and stands *behind* what is
        // at its middle: a ball leaving the portal comes out in front of it
        // rather than through the black.
        '  vec4 mv = modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0);',
        '  float dv = length(mv.xyz), kv = (dv + size * 0.6) / max(dv, 0.001);',
        '  mv.xyz *= kv;',
        '  mv.xy += position.xy * size * kv;',
        '  gl_Position = projectionMatrix * mv;',
        '#else',
        '  gl_Position = projectionMatrix * modelViewMatrix * vec4(position.xy * size, 0.0, 1.0);',
        '#endif',
        '}'
    ].join('\n');

    var BLACKHOLE_FS = [
        'uniform float time, open, hor, ring, feed, shade, gulp, spin, beam, rim;',
        'uniform vec3 hot, cool;',
        'varying vec2 vP;',

        'float bhHash(vec2 p){',
        '  p = fract(p * vec2(123.34, 456.21));',
        '  p += dot(p, p + 45.32);',
        '  return fract(p.x * p.y);',
        '}',
        'float bhNoise(vec2 p){',
        '  vec2 i = floor(p), f = fract(p);',
        '  vec2 u = f * f * (3.0 - 2.0 * f);',
        '  return mix(mix(bhHash(i), bhHash(i + vec2(1.0, 0.0)), u.x),',
        '             mix(bhHash(i + vec2(0.0, 1.0)), bhHash(i + vec2(1.0, 1.0)), u.x), u.y);',
        '}',

        'void main(){',
        '  float o = max(open, 0.001);',
        '  vec2 p = vP / o;',
        '  float r = length(p);',
        '  if (r >= 1.0) discard;',
        '  float a = atan(p.y, p.x);',
        '  float lr = log(r + 0.0001);',
        // The inside out-orbits the outside, and a gulp spins the lot up.
        '  float w = spin * time * (0.35 + 0.75 / (r * 3.0 + 0.3)) * (1.0 + gulp * 2.0);',
        '  float ang = a + w + spin * lr * 1.7;',
        '  vec2 c = vec2(cos(ang), sin(ang));',
        '  float n = bhNoise(c * (2.5 + r * 5.0) + 7.3) * 0.62 + bhNoise(c * (6.0 + r * 12.0) - 3.1) * 0.38;',
        '  float arms = 0.5 + 0.5 * sin(3.0 * a + spin * (lr * 6.0 - time * 2.2));',
        // The disc: nothing inside the horizon, the bright band at `ring`, a
        // long fall-off to the rim.
        '  float inner = smoothstep(hor * 0.98, ring, r);',
        '  float outer = 1.0 - smoothstep(ring, 1.0, r);',
        '  float disc = inner * outer * outer;',
        '  float glow = disc * (0.18 + 1.25 * n * n * (0.45 + 0.55 * arms));',
        // Rings feeding in: as the clock runs a constant phase means a
        // smaller radius, so they close on the middle.
        '  float fc = fract(lr * 2.4 + time * 0.85);',
        '  float fr = smoothstep(0.6, 0.8, fc) * (1.0 - smoothstep(0.8, 1.0, fc));',
        // With `rim` they hold their light out to the edge rather than
        // fading with the disc, because on a well the edge is the news.
        '  glow += fr * feed * mix(pow(1.0 - r, 1.4), 0.4, rim) * smoothstep(hor, hor * 1.6, r);',
        // The photon ring, the one hard edge.
        '  float ph = (r - hor * 1.05) / (0.02 + 0.01 * gulp);',
        '  glow += exp(-ph * ph) * (1.3 + gulp * 1.5);',
        // One side of a disc that is coming at you is brighter than the side
        // going away; on the ground it turns with the disc.
        '  glow *= 1.0 + beam * cos(a - w * 0.25 - 0.7);',
        '  glow *= 1.0 + gulp * 0.9;',
        '  float heat = 1.0 - smoothstep(hor, 1.0, r);',
        '  vec3 col = mix(cool, hot, smoothstep(0.15, 0.75, heat));',
        '  col = mix(col, vec3(1.25, 1.12, 1.0), smoothstep(0.82, 1.0, heat) * 0.7);',
        '  float hole = 1.0 - smoothstep(hor * 0.9, hor, r);',
        '  float edge = 1.0 - smoothstep(0.78, 1.0, r);',
        '  float fade = smoothstep(0.0, 0.3, open);',
        '  vec3 rgb = col * glow * (1.0 - hole) * edge * fade;',
        // A well's reach (render.js `wellReach`): a faint line where the
        // pull falls to a tenth of g, outside the fade so it holds its own.
        '  float rl = (r - 0.93) / 0.03;',
        '  rgb += cool * rim * exp(-rl * rl) * (0.75 + 0.25 * sin(a * 6.0 - time * spin)) * fade;',
        '  float alpha = max(hole, shade * pow(1.0 - r, 1.3) * edge) * fade;',
        '  gl_FragColor = vec4(rgb, clamp(alpha, 0.0, 1.0));',
        '}'
    ].join('\n');

    /* ── golf ball cosmetics & geodesic dimples ──────────────────────────────

       Every dimpled ball uses analytic 492-point icosahedral geodesic math in
       object space (`vGbObj`) instead of an equirectangular UV bump map, so
       there is zero pole pinching and razor-sharp rim shading up close.

       Base Tour, real-life inspired prints, camo and animated surface FX ride on
       MeshPhongMaterial via `onBeforeCompile` so they inherit course lighting,
       shadows and fog automatically. Translucent Crystal Glass and Singularity
       use dedicated ShaderMaterials so they can ray-trace an inner core,
       Fresnel sky reflections and gravitational accretion rings. */

    var GB_DIMPLE_FN = [
        'float gbHash(vec3 p) {',
        '  p = fract(p * vec3(127.1, 311.7, 74.7));',
        '  p += dot(p, p.yzx + 19.19);',
        '  return fract((p.x + p.y) * p.z);',
        '}',
        'float gbNoise(vec3 p) {',
        '  vec3 i = floor(p); vec3 f = fract(p);',
        '  f = f * f * (3.0 - 2.0 * f);',
        '  return mix(',
        '    mix(mix(gbHash(i), gbHash(i + vec3(1.0, 0.0, 0.0)), f.x),',
        '        mix(gbHash(i + vec3(0.0, 1.0, 0.0)), gbHash(i + vec3(1.0, 1.0, 0.0)), f.x), f.y),',
        '    mix(mix(gbHash(i + vec3(0.0, 0.0, 1.0)), gbHash(i + vec3(1.0, 0.0, 1.0)), f.x),',
        '        mix(gbHash(i + vec3(0.0, 1.0, 1.0)), gbHash(i + vec3(1.0, 1.0, 1.0)), f.x), f.y),',
        '    f.z);',
        '}',
        'float gbFbm(vec3 p) {',
        '  float v = 0.55 * gbNoise(p);',
        '  v += 0.30 * gbNoise(p * 2.07 + 3.1);',
        '  v += 0.15 * gbNoise(p * 4.31 + 7.4);',
        '  return v;',
        '}',
        /* One dimple, worked out where it is drawn. The 492 dimple centres are
           a frequency-7 geodesic grid on the icosahedron; folding into the
           positive octant (the icosahedron is symmetric in all three planes)
           leaves four candidate faces, then the grid triangle under the point
           gives three candidate centres, and the nearest of those is the
           dimple. Every face is wound the same way: the central one used to be
           wound backwards, its barycentric sum came out negative, and eight of
           the twenty faces were drawn smooth.

           A dimple is a shallow spherical dish: slope grows with distance
           from its centre and stops at a crisp rim. Its radius is just under
           half the distance to its nearest neighbour, read off how far its
           flat grid point stood from the centre (only eight distances occur),
           so they pack nearly edge to edge in the mix of sizes a real cover
           has. `fwidth` says how much ball one pixel covers: the rim softens
           to it, and once a pixel covers more than about half a dimple the
           relief fades to its average shade instead of shimmering — and a
           ball that small skips the search entirely. */
        'void gbDimple(vec3 p, out vec3 gradObj, out float depth) {',
        '  float fw = length(fwidth(p));',
        '  gradObj = vec3(0.0);',
        '  depth = 0.28;',
        '  if (fw > 0.05) return;',
        '  vec3 s = vec3(p.x < 0.0 ? -1.0 : 1.0, p.y < 0.0 ? -1.0 : 1.0, p.z < 0.0 ? -1.0 : 1.0);',
        '  vec3 q = abs(p);',
        '  float d0 = dot(q, vec3(0.57735027));',
        '  float d1 = dot(q, vec3(0.93417236, 0.35682209, 0.0));',
        '  float d2 = dot(q, vec3(0.0, 0.93417236, 0.35682209));',
        '  float d3 = dot(q, vec3(0.35682209, 0.0, 0.93417236));',
        '  vec3 V0 = vec3(0.0, 0.52573111, 0.85065081);',
        '  vec3 V1 = vec3(0.52573111, 0.85065081, 0.0);',
        '  vec3 V2 = vec3(0.85065081, 0.0, 0.52573111);',
        '  vec3 A = V0; vec3 B = V2; vec3 C = V1;',
        '  if (d1 >= d0 && d1 >= d2 && d1 >= d3) {',
        '    A = V1; B = V2; C = vec3(0.85065081, 0.0, -0.52573111);',
        '  } else if (d2 >= d0 && d2 >= d1 && d2 >= d3) {',
        '    A = V0; B = V1; C = vec3(-0.52573111, 0.85065081, 0.0);',
        '  } else if (d3 >= d0 && d3 >= d1 && d3 >= d2) {',
        '    A = V2; B = V0; C = vec3(0.0, -0.52573111, 0.85065081);',
        '  }',
        '  vec3 bc = vec3(dot(q, cross(B, C)), dot(q, cross(C, A)), dot(q, cross(A, B)));',
        '  bc *= 7.0 / max(bc.x + bc.y + bc.z, 1e-5);',
        '  vec3 fl = floor(bc);',
        '  float rem = 7.0 - (fl.x + fl.y + fl.z);',
        '  float up = step(1.5, rem);',
        '  vec3 o1 = mix(vec3(1.0, 0.0, 0.0), vec3(0.0, 1.0, 1.0), up);',
        '  vec3 o2 = mix(vec3(0.0, 1.0, 0.0), vec3(1.0, 0.0, 1.0), up);',
        '  vec3 o3 = mix(vec3(0.0, 0.0, 1.0), vec3(1.0, 1.0, 0.0), up);',
        '  if (rem < 0.5) o1 = vec3(0.0);',
        '  if (rem > 2.5) o1 = vec3(1.0);',
        '  mat3 M = mat3(A, B, C);',
        '  vec3 g1 = M * (fl + o1); vec3 g2 = M * (fl + o2); vec3 g3 = M * (fl + o3);',
        '  float L1 = length(g1); float L2 = length(g2); float L3 = length(g3);',
        '  float l1 = dot(q, g1) / L1; float l2 = dot(q, g2) / L2; float l3 = dot(q, g3) / L3;',
        '  vec3 g = g1; float L = L1; float lb = l1;',
        '  if (l2 > lb) { g = g2; L = L2; lb = l2; }',
        '  if (l3 > lb) { g = g3; L = L3; lb = l3; }',
        '  L /= 7.0;',
        '  float nn = L < 0.806 ? 0.1816 : L < 0.820 ? 0.1735 : L < 0.840 ? 0.1648 : L < 0.860 ? 0.1707 : L < 0.873 ? 0.1520 : L < 0.905 ? 0.1566 : 0.1377;',
        '  float rad = nn * 0.485;',
        '  vec3 dCenter = s * (g / (L * 7.0));',
        '  vec3 off = p - dCenter;',
        '  float r = length(off) / rad;',
        '  float px = fw / rad;',
        '  float edge = 1.0 - smoothstep(1.0 - max(0.07, px * 1.2), 1.0, r);',
        '  float fade = 1.0 - smoothstep(0.30, 0.65, px);',
        '  vec3 tanOut = off - dCenter * dot(off, dCenter);',
        '  gradObj = tanOut / rad * (0.62 * edge * fade);',
        '  depth = mix(0.28, (1.0 - r * r) * edge, fade);',
        '}'
    ].join('\n');

    var BALL_VS_HEAD = [
        'varying vec3 vGbObj;',
        'varying vec3 vGbX;',
        'varying vec3 vGbY;',
        'varying vec3 vGbZ;',
        ''
    ].join('\n');

    var BALL_VS_BODY = [
        '#include <begin_vertex>',
        '  vGbObj = normalize(position);',
        '  vGbX = normalize(normalMatrix * vec3(1.0, 0.0, 0.0));',
        '  vGbY = normalize(normalMatrix * vec3(0.0, 1.0, 0.0));',
        '  vGbZ = normalize(normalMatrix * vec3(0.0, 0.0, 1.0));'
    ].join('\n');

    var BALL_FS_HEAD = [
        'uniform float uGbTime;',
        'uniform int uGbMode;',
        'uniform vec3 uGbTint;',
        'uniform vec3 uGbSunDir;',
        'uniform vec3 uGbSkyTop;',
        'varying vec3 vGbObj;',
        'varying vec3 vGbX;',
        'varying vec3 vGbY;',
        'varying vec3 vGbZ;',
        GB_DIMPLE_FN,
        'vec3 gbSpectrum(float t) {',
        '  return 0.52 + 0.48 * cos(6.28318 * (t + vec3(0.0, 0.33, 0.67)));',
        '}',
        'float gbIcoDots(vec3 p, float scale, float sharp) {',
        '  vec3 a = abs(p);',
        '  float d = 0.0;',
        '  vec3 i0 = vec3(0.0, 0.525731, 0.850651);',
        '  vec3 i1 = vec3(0.525731, 0.850651, 0.0);',
        '  vec3 i2 = vec3(0.850651, 0.0, 0.525731);',
        '  d = max(d, dot(a, i0)); d = max(d, dot(a, i1)); d = max(d, dot(a, i2));',
        '  return smoothstep(scale - sharp, scale + sharp, d);',
        '}',
        'float gbPentagonMask(vec3 p, float rad) {',
        // Symmetric 12-vertex dodecahedron/icosahedron vertices -> flat pentagon faces via abs + plane symmetry!
        '  vec3 q = abs(p);',
        '  vec3 v0 = vec3(0.0, 0.525731, 0.850651);',
        '  vec3 v1 = vec3(0.525731, 0.850651, 0.0);',
        '  vec3 v2 = vec3(0.850651, 0.0, 0.525731);',
        '  float d0 = dot(q, v0); float d1 = dot(q, v1); float d2 = dot(q, v2);',
        '  vec3 ax = v0; vec3 uA = vec3(1.0, 0.0, 0.0); vec3 uB = vec3(0.0, 0.850651, -0.525731);',
        '  if (d1 >= d0 && d1 >= d2) { ax = v1; uA = vec3(0.0, 0.0, 1.0); uB = vec3(0.850651, -0.525731, 0.0); }',
        '  else if (d2 >= d0 && d2 >= d1) { ax = v2; uA = vec3(0.0, 1.0, 0.0); uB = vec3(-0.525731, 0.0, 0.850651); }',
        '  vec2 loc = vec2(dot(q, uA), dot(q, uB));',
        '  float ang = atan(loc.y, loc.x);',
        '  float sec = mod(ang + 0.6283185, 1.256637) - 0.6283185;',
        '  float poly = length(loc) * cos(sec) / 0.809017;',
        '  return 1.0 - smoothstep(rad - 0.015, rad + 0.015, poly);',
        '}',
        // The football's truncated icosahedron: which face a direction lands
        // on is the face plane its ray meets first (dot / plane distance), the
        // pentagons' planes a little further out than the hexagons'. Folded
        // to the positive octant, each base centre is tried with each sign
        // flipped too, so faces across a fold plane still meet at a seam.
        'void gbBk(vec3 q, vec3 n, float inv, float pent, inout float b1, inout float b2, inout float bp) {',
        '  float s = dot(q, n) * inv;',
        '  if (s > b1) { b2 = b1; b1 = s; bp = pent; } else if (s > b2) { b2 = s; }',
        '}',
        'void gbBk4(vec3 q, vec3 n, float inv, float pent, inout float b1, inout float b2, inout float bp) {',
        '  gbBk(q, n, inv, pent, b1, b2, bp);',
        '  if (n.x > 0.0) gbBk(q, n * vec3(-1.0, 1.0, 1.0), inv, pent, b1, b2, bp);',
        '  if (n.y > 0.0) gbBk(q, n * vec3(1.0, -1.0, 1.0), inv, pent, b1, b2, bp);',
        '  if (n.z > 0.0) gbBk(q, n * vec3(1.0, 1.0, -1.0), inv, pent, b1, b2, bp);',
        '}',
        'vec2 gbBucky(vec3 p) {', // x: gap to the nearest seam, y: 1 on a pentagon
        '  vec3 q = abs(p);',
        '  float b1 = -1.0, b2 = -1.0, bp = 0.0;',
        '  float ip = 1.0 / 2.32744, ih = 1.0 / 2.26728;',
        '  gbBk4(q, vec3(0.0, 0.525731, 0.850651), ip, 1.0, b1, b2, bp);',
        '  gbBk4(q, vec3(0.525731, 0.850651, 0.0), ip, 1.0, b1, b2, bp);',
        '  gbBk4(q, vec3(0.850651, 0.0, 0.525731), ip, 1.0, b1, b2, bp);',
        '  gbBk4(q, vec3(0.57735), ih, 0.0, b1, b2, bp);',
        '  gbBk4(q, vec3(0.356822, 0.0, 0.934172), ih, 0.0, b1, b2, bp);',
        '  gbBk4(q, vec3(0.934172, 0.356822, 0.0), ih, 0.0, b1, b2, bp);',
        '  gbBk4(q, vec3(0.0, 0.934172, 0.356822), ih, 0.0, b1, b2, bp);',
        '  return vec2(b1 - b2, bp);',
        '}',
        ''
    ].join('\n');

    var BALL_FS_COLOR = [
        '#include <color_fragment>',
        '  vec3 gbGradObj; float gbDepth;',
        '  vec3 gbP = normalize(vGbObj);',
        '  gbDimple(gbP, gbGradObj, gbDepth);',
        '  vec3 gbBase = vec3(0.95, 0.94, 0.90);',
        '  vec3 gbEmit = vec3(0.0);',
        '  float gbAO = 1.0 - gbDepth * 0.14;',
        '  float gbSeam = 1.0 - smoothstep(0.0, 0.022, abs(gbP.y));',
        '  vec3 gbV = normalize(vViewPosition);',
        '  vec3 gbVObj = normalize(vec3(dot(gbV, vGbX), dot(gbV, vGbY), dot(gbV, vGbZ)));',
        '  float gbRim = pow(1.0 - max(dot(gbP, gbVObj), 0.0), 3.0);',
        '  if (uGbMode == 0) {', // tour-white
        '    gbBase = vec3(0.96, 0.95, 0.91);',
        '    gbBase = mix(gbBase, vec3(0.86, 0.85, 0.81), gbSeam * 0.35);',
        // Clean tour sight stripe & brass crown mark
        '    float line = (1.0 - smoothstep(0.018, 0.026, abs(gbP.y))) * smoothstep(0.45, 0.52, gbP.x);',
        '    float dotMark = 1.0 - smoothstep(0.08, 0.10, length(gbP - vec3(0.0, 0.0, 1.0)));',
        '    float dotInner = 1.0 - smoothstep(0.045, 0.06, length(gbP - vec3(0.0, 0.0, 1.0)));',
        '    gbBase = mix(gbBase, vec3(0.72, 0.22, 0.17), line * 0.9);',
        '    gbBase = mix(gbBase, vec3(0.79, 0.64, 0.32), dotMark * (1.0 - dotInner * 0.7));',
        '  } else if (uGbMode == 1) {', // optic-yellow
        '    gbBase = vec3(0.89, 0.95, 0.16);',
        '    float s1 = (1.0 - smoothstep(0.02, 0.028, abs(gbP.y))) * smoothstep(0.42, 0.48, abs(gbP.x));',
        '    gbBase = mix(gbBase, vec3(0.11, 0.16, 0.28), s1 * 0.85);',
        '  } else if (uGbMode == 2) {', // coral-matte
        '    float grain = 0.96 + 0.08 * gbNoise(gbP * 28.0);',
        '    gbBase = vec3(0.82, 0.18, 0.20) * grain;',
        '    float bar = (1.0 - smoothstep(0.02, 0.028, abs(gbP.y))) * smoothstep(0.44, 0.50, gbP.x);',
        '    gbBase = mix(gbBase, vec3(0.95, 0.94, 0.90), bar * 0.92);',
        '    gbAO = 1.0 - gbDepth * 0.18;',
        '  } else if (uGbMode == 3) {', // triple-track
        '    gbBase = vec3(0.96, 0.95, 0.91);',
        '    float center = 1.0 - smoothstep(0.024, 0.032, abs(gbP.y));',
        '    float sideA = 1.0 - smoothstep(0.013, 0.020, abs(gbP.y - 0.085));',
        '    float sideB = 1.0 - smoothstep(0.013, 0.020, abs(gbP.y + 0.085));',
        '    float mask = smoothstep(-0.3, 0.1, gbP.z + abs(gbP.x));',
        '    gbBase = mix(gbBase, vec3(0.78, 0.15, 0.20), center * 0.95 * mask);',
        '    gbBase = mix(gbBase, vec3(0.13, 0.34, 0.72), max(sideA, sideB) * 0.95 * mask);',
        '  } else if (uGbMode == 4) {', // tour-divide
        '    float halfSplit = smoothstep(-0.014, 0.014, gbP.y);',
        '    gbBase = mix(vec3(0.78, 0.16, 0.21), vec3(0.92, 0.71, 0.22), halfSplit);',
        '    float eq = 1.0 - smoothstep(0.0, 0.018, abs(gbP.y));',
        '    gbBase = mix(gbBase, vec3(0.18, 0.14, 0.12), eq * 0.45);',
        '  } else if (uGbMode == 5) {', // pix-tour
        '    gbBase = vec3(0.95, 0.94, 0.90);',
        '    float triOuter = gbIcoDots(gbP, 0.958, 0.005);',
        '    float triInner = gbIcoDots(gbP, 0.979, 0.004);',
        '    gbBase = mix(gbBase, vec3(0.12, 0.19, 0.35), triOuter * 0.95);',
        '    gbBase = mix(gbBase, vec3(0.92, 0.38, 0.12), triInner * 0.95);',
        '  } else if (uGbMode == 6) {', // truvis-club
        '    gbBase = vec3(0.96, 0.95, 0.91);',
        '    float pent = gbPentagonMask(gbP, 0.27);',
        '    float trim = gbPentagonMask(gbP, 0.295) - pent;',
        '    gbBase = mix(gbBase, vec3(0.78, 0.63, 0.30), max(0.0, trim) * 0.85);',
        '    gbBase = mix(gbBase, vec3(0.13, 0.27, 0.50), pent * 0.96);',
        '  } else if (uGbMode == 7) {', // splatter-drip
        '    gbBase = vec3(0.95, 0.93, 0.88);',
        '    float n1 = gbFbm(gbP * 4.2 + vec3(1.2, 0.5, 2.3));',
        '    float n2 = gbFbm(gbP * 5.0 + vec3(8.1, 3.7, 0.9));',
        '    float n3 = gbFbm(gbP * 6.4 + vec3(4.3, 9.2, 5.1));',
        '    gbBase = mix(gbBase, vec3(0.12, 0.65, 0.59), smoothstep(0.61, 0.65, n1));',
        '    gbBase = mix(gbBase, vec3(0.88, 0.33, 0.27), smoothstep(0.62, 0.66, n2));',
        '    gbBase = mix(gbBase, vec3(0.85, 0.64, 0.23), smoothstep(0.64, 0.68, n3));',
        '    gbBase = mix(gbBase, vec3(0.14, 0.22, 0.42), smoothstep(0.71, 0.74, n1 + 0.12 * n2));',
        '  } else if (uGbMode == 8) {', // woodland-camo
        '    vec3 warp = vec3(gbFbm(gbP * 2.4), gbFbm(gbP * 2.4 + 5.2), gbFbm(gbP * 2.4 + 11.4));',
        '    float f1 = gbFbm(gbP * 2.8 + warp * 1.4);',
        '    float f2 = gbFbm(gbP * 3.4 - warp * 1.1 + 4.7);',
        '    gbBase = vec3(0.28, 0.37, 0.20);',
        '    gbBase = mix(gbBase, vec3(0.48, 0.55, 0.31), smoothstep(0.46, 0.50, f1));',
        '    gbBase = mix(gbBase, vec3(0.56, 0.47, 0.32), smoothstep(0.54, 0.58, f2));',
        '    gbBase = mix(gbBase, vec3(0.14, 0.16, 0.11), smoothstep(0.64, 0.68, f1 * 0.6 + f2 * 0.5));',
        '    gbAO = 1.0 - gbDepth * 0.20;',
        '  } else if (uGbMode == 9) {', // carbon-gold
        '    vec3 w = gbP * 28.0;',
        '    float weaveA = 0.5 + 0.5 * sin(w.x + w.z) * cos(w.y * 1.3);',
        '    float weaveB = 0.5 + 0.5 * sin(w.x - w.z) * cos(w.y * 1.3 + 1.57);',
        '    gbBase = mix(vec3(0.12, 0.13, 0.16), vec3(0.26, 0.28, 0.32), mix(weaveA, weaveB, step(0.5, fract(gbP.y * 9.0))));',
        '    float ring = 1.0 - smoothstep(0.04, 0.055, abs(gbP.y));',
        '    gbBase = mix(gbBase, vec3(0.84, 0.68, 0.34), ring);',
        '  } else if (uGbMode == 10) {', // rainbow-tie
        '    vec3 sp = gbP * 2.5;',
        '    float sw = gbFbm(sp + vec3(uGbTime * 0.22, -uGbTime * 0.17, uGbTime * 0.14));',
        '    float sw2 = gbFbm(sp * 1.7 + sw * 2.2 - uGbTime * 0.18);',
        '    gbBase = gbSpectrum(sw * 1.4 + sw2 * 0.9 + uGbTime * 0.06);',
        '    gbEmit = gbBase * 0.10;',
        '  } else if (uGbMode == 11) {', // holo-prism
        '    vec3 dN = normalize(gbP - gbGradObj * 1.6);',
        '    float viewAng = dot(dN, gbVObj);',
        '    float sunAng = dot(dN, normalize(uGbSunDir));',
        '    float film = viewAng * 1.45 + sunAng * 0.65 + gbDepth * 0.55 + uGbTime * 0.18;',
        '    vec3 iri = gbSpectrum(film);',
        '    float flake = smoothstep(0.84, 0.96, gbHash(floor(gbP * 44.0)));',
        '    vec3 flakeCol = gbSpectrum(gbHash(floor(gbP * 44.0) + 2.7) + viewAng * 2.0);',
        '    gbBase = mix(vec3(0.75, 0.80, 0.88), iri, 0.78);',
        '    gbBase = mix(gbBase, flakeCol * 1.2, flake * 0.65);',
        '    gbEmit = iri * (0.14 + 0.28 * gbRim) + flakeCol * flake * 0.25;',
        '  } else if (uGbMode == 12) {', // magma-core
        '    float warp = gbFbm(gbP * 3.1 + uGbTime * 0.12);',
        '    float ridge = 1.0 - abs(gbNoise(gbP * 4.8 + warp * 2.0) * 2.0 - 1.0);',
        '    float crack = pow(clamp(ridge, 0.0, 1.0), 4.0);',
        '    float pulse = 0.82 + 0.28 * sin(uGbTime * 2.6 + warp * 5.0);',
        '    gbBase = mix(vec3(0.11, 0.09, 0.09), vec3(0.24, 0.10, 0.07), clamp(crack * 1.4, 0.0, 1.0));',
        '    vec3 lava = mix(vec3(1.0, 0.28, 0.03), vec3(1.25, 0.88, 0.30), smoothstep(0.35, 0.85, crack));',
        '    gbEmit = lava * crack * pulse * 1.35;',
        '  } else if (uGbMode == 13) {', // cyber-wire
        '    float lat = abs(fract(asin(clamp(gbP.y, -0.999, 0.999)) / 3.14159 * 10.0) - 0.5);',
        '    float lon = abs(fract(atan(gbP.z, gbP.x) / 6.28318 * 14.0) - 0.5);',
        '    float grid = 1.0 - smoothstep(0.03, 0.09, min(lat, lon));',
        '    float wave = exp(-pow((gbP.y - sin(uGbTime * 1.7) * 0.75) * 4.5, 2.0));',
        '    vec3 neon = mix(vec3(0.10, 0.92, 1.0), vec3(1.0, 0.24, 0.75), wave);',
        '    gbBase = vec3(0.08, 0.06, 0.16);',
        '    gbEmit = neon * (grid * (0.75 + 0.65 * wave) + 0.18 * gbRim);',
        '  } else if (uGbMode == 14) {', // featherie: no dimples, stitched leather
        '    gbGradObj = vec3(0.0);',
        '    gbAO = 1.0;',
        // A tennis-ball seam: the saddle where y = 0.55 (x^2 - z^2).
        '    float seamF = gbP.y - 0.55 * (gbP.x * gbP.x - gbP.z * gbP.z);',
        '    float seamD = abs(seamF);',
        '    float grain = gbFbm(gbP * 9.0);',
        '    float patina = gbFbm(gbP * 2.3 + 4.0);',
        '    gbBase = mix(vec3(0.40, 0.25, 0.13), vec3(0.58, 0.39, 0.21), patina) * (0.82 + 0.30 * grain);',
        '    float hollow = 1.0 - smoothstep(0.02, 0.09, seamD);',
        '    gbBase *= 1.0 - hollow * 0.35;',
        '    float along = atan(gbP.z, gbP.x) * 13.0 + gbP.y * 9.0;',
        '    float stitch = (1.0 - smoothstep(0.012, 0.022, seamD)) * smoothstep(0.15, 0.35, abs(fract(along) - 0.5));',
        '    gbBase = mix(gbBase, vec3(0.93, 0.87, 0.74), stitch);',
        '    vec3 seamG = vec3(-1.1 * gbP.x, 1.0, 1.1 * gbP.z);',
        '    seamG -= gbP * dot(seamG, gbP);',
        '    gbGradObj = seamG / (length(seamG) + 1e-4) * sign(seamF) * hollow * 0.22;',
        '  } else if (uGbMode == 15) {', // aurora: curtains over a starfield
        '    float az = atan(gbP.z, gbP.x);',
        '    float t = uGbTime;',
        '    float wob = 0.22 * sin(az * 3.0 + t * 0.45) + 0.09 * sin(az * 7.0 - t * 0.8) + 0.12 * (gbFbm(gbP * 2.2 + t * 0.07) - 0.5);',
        '    float h = gbP.y - wob;',
        '    float band = exp(-h * h * 22.0);',
        '    float rays = 0.55 + 0.45 * sin(az * 38.0 + gbFbm(gbP * 5.0) * 6.0 + t * 0.9);',
        '    float upper = smoothstep(-0.05, 0.35, h);',
        '    vec3 auroraC = mix(vec3(0.20, 0.95, 0.58), vec3(0.62, 0.38, 1.0), upper);',
        '    float band2 = exp(-pow((gbP.y + 0.42 - wob * 0.6) * 6.0, 2.0)) * 0.45;',
        '    float glow = band * rays + band2 * (0.6 + 0.4 * rays);',
        '    float star = smoothstep(0.93, 0.99, gbHash(floor(gbP * 60.0))) * (0.6 + 0.4 * sin(t * 3.0 + gbHash(floor(gbP * 60.0) + 1.3) * 30.0));',
        '    gbBase = mix(vec3(0.03, 0.05, 0.13), vec3(0.06, 0.10, 0.22), smoothstep(-0.6, 0.6, gbP.y));',
        '    gbEmit = auroraC * glow * 0.95 + vec3(0.85, 0.9, 1.0) * star * (1.0 - glow) * 0.8;',
        // ── The novelty shelf: other sports' balls, all smooth (no dimples). ──
        '  } else if (uGbMode == 16) {', // tennis: optic felt, white rubber seam
        '    gbAO = 1.0;',
        '    float tf = gbP.y - 0.9 * (gbP.x * gbP.x - gbP.z * gbP.z);',
        '    float fuzz = gbFbm(gbP * 46.0);',
        '    gbBase = vec3(0.80, 0.90, 0.20) * (0.80 + 0.34 * fuzz);',
        '    float tseam = 1.0 - smoothstep(0.022, 0.034, abs(tf));',
        '    gbBase = mix(gbBase, vec3(0.95, 0.95, 0.90), tseam);',
        '    float fz = gbNoise(gbP * 90.0);',
        '    gbGradObj = (vec3(gbNoise(gbP * 90.0 + vec3(0.2, 0.0, 0.0)), gbNoise(gbP * 90.0 + vec3(0.0, 0.2, 0.0)), gbNoise(gbP * 90.0 + vec3(0.0, 0.0, 0.2))) - fz) * 0.18 * (1.0 - tseam);',
        '  } else if (uGbMode == 17) {', // beach ball: six gores, white caps
        '    gbGradObj = vec3(0.0); gbAO = 1.0;',
        '    float g6 = (atan(gbP.z, gbP.x) + 3.14159) / 6.28318 * 6.0;',
        '    float gi = floor(g6);',
        '    vec3 gc = vec3(0.90, 0.16, 0.15);',
        '    if (gi == 1.0) gc = vec3(0.98, 0.98, 0.95);',
        '    else if (gi == 2.0) gc = vec3(0.13, 0.42, 0.85);',
        '    else if (gi == 3.0) gc = vec3(0.98, 0.80, 0.12);',
        '    else if (gi == 4.0) gc = vec3(0.98, 0.98, 0.95);',
        '    else if (gi >= 5.0) gc = vec3(0.14, 0.66, 0.38);',
        '    float gseam = 1.0 - smoothstep(0.0, 0.03 / max(0.15, length(gbP.xz)), min(fract(g6), 1.0 - fract(g6)));',
        '    gbBase = mix(gc, gc * 0.75, gseam * 0.6);',
        '    float cap = smoothstep(0.90, 0.905, abs(gbP.y));',
        '    gbBase = mix(gbBase, vec3(0.97, 0.97, 0.94), cap);',
        '  } else if (uGbMode == 18) {', // basketball: pebbled orange, black ribs
        '    float pb = gbNoise(gbP * 70.0);',
        '    gbGradObj = (vec3(gbNoise(gbP * 70.0 + vec3(0.25, 0.0, 0.0)), gbNoise(gbP * 70.0 + vec3(0.0, 0.25, 0.0)), gbNoise(gbP * 70.0 + vec3(0.0, 0.0, 0.25))) - pb) * 0.35;',
        '    gbAO = 0.9 + 0.1 * pb;',
        '    gbBase = vec3(0.86, 0.36, 0.10) * (0.92 + 0.12 * gbFbm(gbP * 6.0));',
        '    float rib = min(min(abs(gbP.x), abs(gbP.y)), abs(abs(gbP.z) - 0.66));',
        '    float rl = 1.0 - smoothstep(0.012, 0.02, rib);',
        '    gbBase = mix(gbBase, vec3(0.05, 0.04, 0.04), rl);',
        '    gbGradObj *= 1.0 - rl;',
        '  } else if (uGbMode == 19) {', // baseball: hide and red double stitching
        '    gbAO = 1.0;',
        '    float bf = gbP.y - 0.9 * (gbP.x * gbP.x - gbP.z * gbP.z);',
        '    gbBase = vec3(0.95, 0.93, 0.87) * (0.94 + 0.08 * gbFbm(gbP * 14.0));',
        '    vec3 bg = vec3(-1.8 * gbP.x, 1.0, 1.8 * gbP.z); bg -= gbP * dot(bg, gbP);',
        '    float bfd = bf / max(0.3, length(bg));',
        '    float groove = 1.0 - smoothstep(0.004, 0.012, abs(bfd));',
        '    gbBase *= 1.0 - groove * 0.25;',
        '    float along = atan(gbP.z, gbP.x) * 18.0 + gbP.y * 6.0;',
        '    float vee = abs(fract(along) - 0.5) * 0.06;',
        '    float rowD = abs(abs(bfd) - 0.03 - vee);',
        '    float st = (1.0 - smoothstep(0.006, 0.011, rowD)) * step(abs(bfd), 0.075);',
        '    gbBase = mix(gbBase, vec3(0.78, 0.10, 0.12), st);',
        '    gbGradObj = vec3(0.0);',
        '  } else if (uGbMode == 20) {', // eight ball: lacquered black, the 8 in its circle
        '    gbGradObj = vec3(0.0); gbAO = 1.0;',
        '    gbBase = vec3(0.025, 0.025, 0.03);',
        '    vec2 ev = gbP.xy;',
        '    float disc = (1.0 - smoothstep(0.37, 0.38, length(ev))) * step(0.0, gbP.z);',
        '    gbBase = mix(gbBase, vec3(0.96, 0.95, 0.91), disc);',
        '    float r1 = abs(length(ev - vec2(0.0, 0.095)) - 0.068);',
        '    float r2 = abs(length(ev - vec2(0.0, -0.082)) - 0.085);',
        '    float eight = (1.0 - smoothstep(0.018, 0.026, min(r1, r2))) * disc;',
        '    gbBase = mix(gbBase, vec3(0.03, 0.03, 0.035), eight);',
        '  } else if (uGbMode == 21) {', // football: black pentagons, white hexagons, stitched seams
        '    gbAO = 1.0;',
        '    vec2 bk = gbBucky(gbP);',
        '    gbBase = mix(vec3(0.96, 0.96, 0.93), vec3(0.06, 0.06, 0.07), bk.y);',
        '    float seamB = 1.0 - smoothstep(0.0012, 0.0035, bk.x);',
        '    float puff = smoothstep(0.0, 0.03, bk.x);',
        '    gbBase *= (0.78 + 0.22 * puff) * (1.0 - seamB * 0.55);',
        '    gbGradObj = vec3(0.0);',
        '  } else if (uGbMode == 22) {', // bowling ball: polished swirl, three finger holes
        '    gbAO = 1.0;',
        '    vec3 bw = vec3(gbFbm(gbP * 1.8), gbFbm(gbP * 1.8 + 4.1), gbFbm(gbP * 1.8 + 8.3));',
        '    float sw1 = gbFbm(gbP * 2.2 + bw * 2.6);',
        '    gbBase = mix(vec3(0.07, 0.04, 0.20), vec3(0.32, 0.10, 0.52), smoothstep(0.35, 0.65, sw1));',
        '    gbBase = mix(gbBase, vec3(0.85, 0.25, 0.60), smoothstep(0.66, 0.72, sw1) * 0.8);',
        '    gbGradObj = vec3(0.0);',
        '    vec3 hA = normalize(vec3(-0.15, 0.19, 1.0));',
        '    vec3 hB = normalize(vec3(0.15, 0.19, 1.0));',
        '    vec3 hC = normalize(vec3(0.0, -0.26, 1.0));',
        '    float dA = length(gbP - hA), dB = length(gbP - hB), dC = length(gbP - hC);',
        '    float hole = max(max(1.0 - smoothstep(0.072, 0.078, dA), 1.0 - smoothstep(0.072, 0.078, dB)), 1.0 - smoothstep(0.086, 0.092, dC));',
        '    float lip = max(max(1.0 - smoothstep(0.0, 0.01, abs(dA - 0.078)), 1.0 - smoothstep(0.0, 0.01, abs(dB - 0.078))), 1.0 - smoothstep(0.0, 0.01, abs(dC - 0.092)));',
        '    gbBase = mix(gbBase, vec3(0.01), hole);',
        '    gbBase *= 1.0 - lip * 0.4;',
        '  } else if (uGbMode == 23) {', // disco ball: flat mirror tiles that catch the light
        '    gbAO = 1.0;',
        '    float lat = asin(clamp(gbP.y, -0.999, 0.999));',
        '    float rows = 18.0;',
        '    float ri = floor((lat / 3.14159 + 0.5) * rows);',
        '    float latC = ((ri + 0.5) / rows - 0.5) * 3.14159;',
        '    float nl = max(4.0, floor(rows * 2.0 * cos(latC)));',
        '    float lon = atan(gbP.z, gbP.x) + ri * 0.37;',
        '    float li = floor((lon / 6.28318 + 0.5) * nl);',
        '    float lonC = ((li + 0.5) / nl - 0.5) * 6.28318 - ri * 0.37;',
        '    vec3 tc = vec3(cos(latC) * cos(lonC), sin(latC), cos(latC) * sin(lonC));',
        '    float fu = abs(fract((lat / 3.14159 + 0.5) * rows) - 0.5);',
        '    float fv = abs(fract((lon / 6.28318 + 0.5) * nl) - 0.5);',
        '    float grout = 1.0 - smoothstep(0.38, 0.46, max(fu, fv));',
        '    gbGradObj = (gbP - tc) / 0.9 * grout;',
        '    vec3 rf = reflect(-gbVObj, tc);',
        '    float th = gbHash(vec3(ri, li, 3.7));',
        '    vec3 env = mix(vec3(0.10, 0.10, 0.12), uGbSkyTop * 1.2 + 0.25, smoothstep(-0.3, 0.8, rf.y));',
        '    gbBase = mix(vec3(0.08), mix(vec3(0.55, 0.56, 0.60), env, 0.6) * (0.75 + 0.5 * th), grout);',
        '    float tw = pow(max(0.0, sin(uGbTime * (1.5 + th * 3.0) + th * 40.0)), 24.0);',
        '    gbEmit = vec3(1.0, 0.97, 0.92) * tw * grout * 0.9 + env * grout * 0.12;',
        '  }',
        '  gbBase *= uGbTint * gbAO;',
        '  gbBase = mix(gbBase, uGbSkyTop * 0.45 + 0.55 * gbBase, gbRim * 0.25);',
        '  diffuseColor.rgb = gbBase;'
    ].join('\n');

    var BALL_FS_NORMAL = [
        '#include <normal_fragment_maps>',
        '  vec3 gbViewGrad = vGbX * gbGradObj.x + vGbY * gbGradObj.y + vGbZ * gbGradObj.z;',
        '  normal = normalize(normal - gbViewGrad * 0.90);'
    ].join('\n');

    var BALL_FS_EMISSIVE = [
        '#include <emissivemap_fragment>',
        '  totalEmissiveRadiance += gbEmit;'
    ].join('\n');

    /* Crystal Glass Ball Shader — translucent optical glass with Fresnel sky/sun
       reflections, geodesic dimples, chromatic rim and an internally refracted
       faceted emerald crystal prism core. */
    var BALL_GLASS_VS = [
        'varying vec3 vObj;',
        'varying vec3 vWorldNormal;',
        'varying vec3 vWorldPos;',
        'varying vec3 vWorldX;',
        'varying vec3 vWorldY;',
        'varying vec3 vWorldZ;',
        'void main() {',
        '  vObj = normalize(position);',
        '  vec4 wp = modelMatrix * vec4(position, 1.0);',
        '  vWorldPos = wp.xyz;',
        '  vWorldNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);',
        '  vWorldX = normalize((modelMatrix * vec4(1.0, 0.0, 0.0, 0.0)).xyz);',
        '  vWorldY = normalize((modelMatrix * vec4(0.0, 1.0, 0.0, 0.0)).xyz);',
        '  vWorldZ = normalize((modelMatrix * vec4(0.0, 0.0, 1.0, 0.0)).xyz);',
        '  gl_Position = projectionMatrix * viewMatrix * wp;',
        '}'
    ].join('\n');

    var BALL_GLASS_FS = [
        'uniform float time;',
        'uniform vec3 sunDir;',
        'uniform vec3 sunColour;',
        'uniform vec3 skyTop;',
        'uniform vec3 skyColour;',
        'uniform vec3 fogColour;',
        'uniform float fogNear;',
        'uniform float fogFar;',
        'uniform vec3 tint;',
        'varying vec3 vObj;',
        'varying vec3 vWorldNormal;',
        'varying vec3 vWorldPos;',
        'varying vec3 vWorldX;',
        'varying vec3 vWorldY;',
        'varying vec3 vWorldZ;',
        GB_DIMPLE_FN,
        'void main() {',
        '  vec3 p = normalize(vObj);',
        '  vec3 gradObj; float depth;',
        '  gbDimple(p, gradObj, depth);',
        '  vec3 N = normalize(vWorldNormal);',
        '  vec3 wg = vWorldX * gradObj.x + vWorldY * gradObj.y + vWorldZ * gradObj.z;',
        '  vec3 N_dimp = normalize(N - wg * 0.90);',
        '  vec3 V = normalize(cameraPosition - vWorldPos);',
        '  float NdotV = max(dot(N_dimp, V), 0.0);',
        '  float fresnel = 0.05 + 0.95 * pow(1.0 - NdotV, 3.6);',
        // Reflected sky & sun
        '  vec3 R = reflect(-V, N_dimp);',
        '  vec3 skyRef = mix(skyColour, skyTop, clamp(R.y * 0.65 + 0.35, 0.0, 1.0));',
        '  float sunSpec = pow(max(dot(R, normalize(sunDir)), 0.0), 140.0);',
        '  float dimpleGlint = pow(max(dot(R, normalize(sunDir)), 0.0), 36.0) * (1.0 - depth * 0.5);',
        // Inner refracted crystal core (faceted emerald octahedron + bubbles)
        '  vec3 T = refract(-V, N_dimp, 1.0 / 1.52);',
        '  float angleT = time * 0.9;',
        '  mat2 rot = mat2(cos(angleT), -sin(angleT), sin(angleT), cos(angleT));',
        // Ray closest point to sphere center inside glass
        '  vec3 ro = N_dimp * 0.98;',
        '  float bProj = dot(-ro, T);',
        '  vec3 closest = ro + T * max(bProj, 0.0);',
        '  vec3 q = vec3(rot * closest.xz, closest.y);',
        '  float octDist = (abs(q.x) + abs(q.y) + abs(q.z)) * 0.577;',
        '  float coreMask = 1.0 - smoothstep(0.24, 0.44, octDist);',
        '  float facets = 0.55 + 0.45 * abs(sin(dot(q, vec3(6.0, 8.0, 5.0))));',
        '  vec3 coreCol = mix(vec3(0.08, 0.52, 0.55), vec3(0.32, 0.96, 0.80), facets) * coreMask;',
        // Tiny suspended micro-bubbles + caustic arc
        '  float bubble = smoothstep(0.88, 0.97, gbNoise(closest * 7.5 + vec3(0.0, time * 0.3, 0.0)));',
        // Chromatic dispersion rim tint
        '  vec3 prism = 0.5 + 0.5 * cos(6.28318 * (NdotV * 0.9 + vec3(0.0, 0.33, 0.67)));',
        '  vec3 bodyCol = mix(vec3(0.45, 0.78, 0.86), skyRef, fresnel);',
        '  vec3 col = bodyCol * 0.58 + coreCol * 0.95 + prism * pow(1.0 - NdotV, 2.2) * 0.42;',
        '  col += sunColour * (sunSpec * 2.2 + dimpleGlint * 0.45) + vec3(0.9, 1.0, 1.0) * bubble * 0.65;',
        '  col *= tint;',
        '  float d = distance(cameraPosition, vWorldPos);',
        '  float fg = smoothstep(fogNear, fogFar, d);',
        '  col = mix(col, fogColour, fg * 0.7);',
        '  float alpha = clamp(0.38 + fresnel * 0.54 + coreMask * 0.30 + sunSpec * 0.6, 0.38, 0.98);',
        '  gl_FragColor = vec4(col, alpha);',
        '  #include <encodings_fragment>',
        '}'
    ].join('\n');

    /* Singularity Golf Ball Shader — event horizon with swirling gravitational
       accretion disc & lensed starlight mapped over the sphere. */
    var BALL_VOID_VS = [
        'varying vec3 vObj;',
        'varying vec3 vWorldNormal;',
        'varying vec3 vWorldPos;',
        'void main() {',
        '  vObj = normalize(position);',
        '  vec4 wp = modelMatrix * vec4(position, 1.0);',
        '  vWorldPos = wp.xyz;',
        '  vWorldNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);',
        '  gl_Position = projectionMatrix * viewMatrix * wp;',
        '}'
    ].join('\n');

    var BALL_VOID_FS = [
        'uniform float time;',
        'uniform vec3 fogColour;',
        'uniform float fogNear;',
        'uniform float fogFar;',
        'uniform vec3 tint;',
        'varying vec3 vObj;',
        'varying vec3 vWorldNormal;',
        'varying vec3 vWorldPos;',
        GB_DIMPLE_FN,
        'void main() {',
        '  vec3 p = normalize(vObj);',
        '  vec3 gradObj; float depth;',
        '  gbDimple(p, gradObj, depth);',
        '  vec3 N = normalize(vWorldNormal);',
        '  vec3 V = normalize(cameraPosition - vWorldPos);',
        '  float NdotV = max(dot(N, V), 0.0);',
        '  float rRim = 1.0 - NdotV;',
        // Black hole core inside rRim < 0.56, bright photon ring around rRim ~ 0.68
        '  float horizon = smoothstep(0.46, 0.58, rRim);',
        '  float photon = exp(-pow((rRim - 0.68) / 0.09, 2.0));',
        // Swirling accretion bands in rotated 3D coordinates around the sphere
        '  float a = atan(p.z, p.x) + time * 1.4 + p.y * 2.5;',
        '  float swirl = gbNoise(vec3(cos(a) * 2.2, p.y * 5.0, sin(a) * 2.2) - time * 0.4);',
        '  float eq = exp(-pow(p.y * 3.8, 2.0));',
        '  float stars = pow(gbNoise(p * 18.0 + swirl), 7.0) * horizon;',
        '  vec3 hot = vec3(1.18, 0.76, 0.28);',
        '  vec3 cool = vec3(0.58, 0.30, 1.02);',
        '  vec3 ringCol = mix(cool, hot, 0.45 + 0.55 * swirl);',
        '  vec3 col = vec3(0.015, 0.012, 0.024);',
        '  col += ringCol * (photon * 1.35 + eq * (0.45 + 0.75 * swirl) * horizon);',
        '  col += vec3(0.92, 0.90, 1.0) * stars * 1.6;',
        '  col *= 1.0 - depth * 0.18;',
        '  col *= tint;',
        '  float d = distance(cameraPosition, vWorldPos);',
        '  col = mix(col, fogColour, smoothstep(fogNear, fogFar, d) * 0.6);',
        '  gl_FragColor = vec4(col, 1.0);',
        '  #include <encodings_fragment>',
        '}'
    ].join('\n');

    G3.shaders = {
        BLACKHOLE_VS: BLACKHOLE_VS,
        BLACKHOLE_FS: BLACKHOLE_FS,
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
        RIDGE_FS: RIDGE_FS,
        BALL_VS_HEAD: BALL_VS_HEAD,
        BALL_VS_BODY: BALL_VS_BODY,
        BALL_FS_HEAD: BALL_FS_HEAD,
        BALL_FS_COLOR: BALL_FS_COLOR,
        BALL_FS_NORMAL: BALL_FS_NORMAL,
        BALL_FS_EMISSIVE: BALL_FS_EMISSIVE,
        BALL_GLASS_VS: BALL_GLASS_VS,
        BALL_GLASS_FS: BALL_GLASS_FS,
        BALL_VOID_VS: BALL_VOID_VS,
        BALL_VOID_FS: BALL_VOID_FS
    };

})(window.G3);
