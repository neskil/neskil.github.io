// Pastel Dream: the picture remembered rather than seen. Low-contrast, milky, chalk-soft.
//   tone       : in Oklab, lightness is lifted and compressed (blacks rise to lavender, whites settle
//                to peach), chroma is thinned, and a lavender -> peach split tone follows lightness
//   glow       : an Orton halo. A 24-tap spiral gathers the light around every pixel (RMS, so lamps
//                and suns count for more than their area) and is screened back over the picture
//   haze       : there is no depth buffer, so "far" is read from the picture itself: bright, calm,
//                detail-free areas (sky, fog, distance) drift toward a rose-white veil
//   soft focus : the frame's edges fall gently out of focus and a little into the veil
//   chalk      : paper tooth, strongest in the midtones, a pure function of uv
// Nothing depends on uTime: the lens holds perfectly still while the world moves beneath it.
// 33 texture samples per pixel (1 centre + 8 soft-focus + 24 glow).
export default {
  id: 'pastel-dream', name: 'Pastel Dream', avoid: [],
  glsl: /* glsl */`
const vec3 PD_VEIL = vec3(.965, .914, .937);     // #f6e9ef, the rose-white of the haze

vec3 pdToLab(vec3 c){
  c = pow(max(c, 0.), vec3(2.2));
  float l = .4122214708*c.r + .5363325363*c.g + .0514459929*c.b;
  float m = .2119034982*c.r + .6806995451*c.g + .1073969566*c.b;
  float s = .0883024619*c.r + .2817188376*c.g + .6299787005*c.b;
  l = pow(l, 1./3.); m = pow(m, 1./3.); s = pow(s, 1./3.);
  return vec3(.2104542553*l + .7936177850*m - .0040720468*s,
              1.9779984951*l - 2.4285922050*m + .4505937099*s,
              .0259040371*l + .7827717662*m - .8086757660*s);
}
vec3 pdFromLab(vec3 q){
  float l = q.x + .3963377774*q.y + .2158037573*q.z;
  float m = q.x - .1055613458*q.y - .0638541728*q.z;
  float s = q.x - .0894841775*q.y - 1.2914855480*q.z;
  l = l*l*l; m = m*m*m; s = s*s*s;
  vec3 c = vec3( 4.0767416621*l - 3.3077115913*m + .2309699292*s,
                -1.2684380046*l + 2.6097574011*m - .3413193965*s,
                 -.0041960863*l -  .7034186147*m + 1.7076147010*s);
  return pow(clamp(c, 0., 1.), vec3(1./2.2));
}

vec3 style(vec2 uv, vec3 base){
  vec2 d = px();
  vec2 P = uv * uRes / uScale;                                   // design-pixel coordinates (static)
  float asp = uRes.x / uRes.y;
  float rad = length((uv - .5) * vec2(asp, 1.)) / (.5 * length(vec2(asp, 1.)));   // 0 centre .. 1 corner
  float soft = smoothstep(.5, 1., rad);

  // --- soft focus: an 8-tap ring, a breath everywhere, wide toward the edges
  float rs = 1.3 + 3.4 * soft;
  vec3 ring = vec3(0.);
  for (int i = 0; i < 8; i++){
    float an = float(i) * .7853982 + .39;
    float rr = (i - (i / 2) * 2 == 0) ? 1. : .6;
    ring += src(uv + d * rs * rr * vec2(cos(an), sin(an)));
  }
  ring *= .125;
  vec3 c = mix(base, ring, .28 + .57 * soft);

  // --- Orton glow: a 24-tap spiral, 36 design px wide, turned by a fixed amount per pixel so the
  //     taps dissolve into chalk dust instead of ghost images
  float rot = hash21(floor(uv * uRes) + 7.) * 6.2831853;
  vec3 g2 = vec3(0.); float gw = 0.;
  for (int i = 0; i < 24; i++){
    float t = (float(i) + .5) / 24.;
    float rr = sqrt(t), an = float(i) * 2.3999632 + rot;
    float w = exp(-t * 2.2);
    vec3 s = src(uv + d * 36. * rr * vec2(cos(an), sin(an)));
    g2 += s * s * w; gw += w;
  }
  vec3 glow = sqrt(g2 / gw);
  float Lg = luma(glow);

  // --- tone in Oklab: lift and compress, thin the chroma, split-tone lavender -> peach
  vec3 lab = pdToLab(c);
  float L = lab.x;
  float ch = length(lab.yz);
  lab.x = .24 + .68 * L;
  lab.yz *= .7 + .16 * smoothstep(.12, .26, ch);                 // the one accent keeps a little more voice
  lab.yz += mix(vec2(-.010, -.030), vec2(.020, .030), smoothstep(.3, .8, L));
  vec3 col = pdFromLab(lab);

  // --- glow screened over, peach-warm, never lifting the calm darks
  vec3 gl = glow * glow * mix(vec3(1.), vec3(1.04, .97, .93), .6) * (.55 + .45 * smoothstep(.25, .8, Lg));
  col = 1. - (1. - col) * (1. - .34 * clamp(gl, 0., 1.));
  col = mix(col, pdFromLab(vec3(.24 + .68 * pdToLab(glow).x, lab.yz)), .11);     // the Orton softness itself

  // --- haze: bright, calm, featureless parts of the picture are far away
  float calm = 1. - smoothstep(.02, .30, abs(luma(c) - Lg) + .5 * length(c - glow));
  vec3 gh = rgb2hsv(clamp(glow, 0., 1.));
  float far = (.35 + .65 * calm) * smoothstep(.34, .86, Lg) * (1. - .6 * smoothstep(.25, .7, gh.y));
  col = mix(col, PD_VEIL, .17 * far + .07 * soft * soft);

  // --- chalk tooth: fixed to the paper, strongest in the midtones
  float Lc = luma(col);
  float mid = smoothstep(.12, .45, Lc) * (1. - smoothstep(.72, .97, Lc));
  float tooth = clamp(paper(uv, 1.15) * 2. - 1., 0., 1.);
  float dust = hash21(floor(P * 1.5) + 3.);
  col *= 1. + (.085 * (tooth - .56) + .022 * (dust - .5)) * (.35 + .65 * mid);
  return col;
}`,
};
