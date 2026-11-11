// Sky kit: camera-following sky dome (gradient, suns, moons/planets, stars, milky way, nebula,
// aurora, fbm cloud layers), fly-through cloud fields and a light rig matched to the sky.
// Pure factories: no module state, no Math.random, no timers. See docs/kit/sky.md.
import * as THREE from 'three';

const DEG = Math.PI / 180;
const MAX_BODIES = 4;

// ---------------------------------------------------------------------------------------------
// GLSL: hashes and value noise shared by every shader in this module
// ---------------------------------------------------------------------------------------------
const NOISE = /* glsl */`
uniform sampler2D uNoiseTex;
float h11(float p){ p=fract(p*.1031); p*=p+33.33; p*=p+p; return fract(p); }
float h21(vec2 p){ vec3 q=fract(vec3(p.xyx)*.1031); q+=dot(q,q.yzx+33.33); return fract((q.x+q.y)*q.z); }
float h31(vec3 q){ q=fract(q*.1031); q+=dot(q,q.zyx+31.32); return fract((q.x+q.y)*q.z); }
vec3 h33(vec3 q){ q=fract(q*vec3(.1031,.1030,.0973)); q+=dot(q,q.yxz+33.33); return fract((q.xxy+q.yxx)*q.zyx); }
float vn1(float p){ float i=floor(p), f=fract(p); f=f*f*(3.-2.*f); return mix(h11(i),h11(i+1.),f); }
// value noise from a 256x256 random texture (G is R shifted by (37,17), so one fetch also gives 3D noise)
// BROUGHT IN: vn3 below follows the texture-lookup 3D value noise of Inigo Quilez's shaders, MIT License
// (https://www.shadertoy.com/user/iq). The notice ships with the site in THIRD-PARTY-NOTICES.txt.
float vn2(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*f*(f*(f*6.-15.)+10.);
  return textureLod(uNoiseTex, (i + f + .5)/256., 0.).b; }   // explicit LOD: these are called inside loops, where Direct3D leaves derivatives undefined
float vn3(vec3 p){ vec3 i=floor(p), f=fract(p); f=f*f*(3.-2.*f);
  vec2 rg = textureLod(uNoiseTex, (i.xy + vec2(37., 17.)*i.z + f.xy + .5)/256., 0.).rg;
  return mix(rg.x, rg.y, f.z); }
const mat2 ROT2 = mat2(.8,-.6,.6,.8);
float fbm2(vec2 p, int oct){ float a=.5, s=0., n=0.;
  for(int i=0;i<oct;i++){ s+=a*vn2(p); n+=a; p=ROT2*p*2.03+17.7; a*=.5; } return s/n; }
float fbm3(vec3 p, int oct){ float a=.5, s=0., n=0.;
  for(int i=0;i<oct;i++){ s+=a*vn3(p); n+=a; p=p.yzx*2.02+vec3(13.1,7.7,5.3); a*=.5; } return s/n; }
`;

// ---------------------------------------------------------------------------------------------
// GLSL: sky dome
// ---------------------------------------------------------------------------------------------
const SKY_VERT = /* glsl */`
varying vec3 vDir;
void main(){
  vDir = position;
  vec4 p = projectionMatrix * vec4(mat3(viewMatrix) * position, 1.0);
  // A vertex exactly beside the camera has w = 0 (the dome's apex whenever the camera is level, as it is when a
  // world is seen through a portal on a straight approach). With z = w that vertex cannot be clipped, and the
  // divide by zero turned whole triangles into flat bands drawn over the scene. Nudge it off the plane.
  if (abs(p.w) < 1e-4) p.w = 1e-4;
  gl_Position = p.xyww;            // always on the far plane, centred on whichever camera draws it
}`;

const SKY_BAKE_VERT = /* glsl */`
varying vec3 vDir;
void main(){ vDir = vec3(position.xy, 0.); gl_Position = vec4(position.xy, 0., 1.); }`;

const SKY_FRAG_HEAD = /* glsl */`
precision highp float;
varying vec3 vDir;
uniform float uTime, uOpacity, uDither, uHorizonFade;
uniform vec3 uZenith, uMid, uHorizon, uGround, uScatterColor;
uniform vec4 uGrad;                 // horizonPow, scatter amount, scatterPow, ground falloff
uniform vec4 uGrad2;                // midPow, scatter at zenith, scatter vertical falloff, -
uniform vec3 uSunDir, uSunColor; uniform vec4 uSun;   // radius(rad), disc intensity, glow, glow tightness
uniform float uVeil;                // strength of the luminous patch a cloud-veiled sun leaves
#ifdef SUN2
uniform vec3 uSun2Dir, uSun2Color; uniform vec4 uSun2;
#endif
#ifdef STARS
uniform vec4 uStars;                // intensity, twinkle, density, hue variation
#endif
#ifdef MILKY
uniform vec3 uMilkyAxis, uMilkyCenter, uMilkyColor, uMilkyColor2; uniform float uMilky;
#endif
#ifdef NEBULA
uniform vec3 uNebulaA, uNebulaB, uNebulaC; uniform vec4 uNebula;   // intensity, scale, seed, coverage
#endif
#ifdef BAKED
uniform samplerCube uBake;          // rgb = nebula + milky way, a = milky way band (baked once at build)
#endif
#ifdef AURORA
uniform vec3 uAuroraA, uAuroraB, uAuroraDir; uniform vec4 uAurora; // intensity, scale, speed, spread
#endif
#if NUM_BODIES > 0
uniform vec4 uBodyDir[NUM_BODIES];     // xyz direction, w angular radius (rad)
uniform vec4 uBodyColor[NUM_BODIES];   // rgb, w band count (0 = rocky)
uniform vec4 uBodyColor2[NUM_BODIES];  // rgb second colour, w texture strength
uniform vec4 uBodyLight[NUM_BODIES];   // xyz light direction, w dark-side brightness
uniform vec4 uBodyAxis[NUM_BODIES];    // xyz spin axis / ring normal, w seed
uniform vec4 uBodyRing[NUM_BODIES];    // inner, outer (in radii), opacity, atmosphere glow
uniform vec4 uBodyRingColor[NUM_BODIES]; // rgb, w horizon fade amount
uniform vec3 uBodyAtmo[NUM_BODIES];
uniform vec4 uBodyGlow[NUM_BODIES];   // rgb halo colour, w width in radii
uniform vec4 uBodyT1[NUM_BODIES];     // xyz tangent (screen right), w 1 / half-extent of the baked tile (sine)
uniform vec4 uBodyT2[NUM_BODIES];     // xyz tangent (screen up)
#ifdef BAKED_BODIES
uniform sampler2D uBodyTex;           // one premultiplied tile per body, side by side
#endif
#ifdef BAKE_BODY
uniform int uBakeBody;
#endif
#endif
#if CLOUDS > 0
uniform vec4 uCloudA[2];            // coverage, softness, scale, opacity
uniform vec4 uCloudB[2];            // detail erosion, silver lining, absorption, stretch (cirrus)
uniform vec4 uCloudW[2];            // wind xy, seed, haze
uniform vec3 uCloudLit[2], uCloudShade[2];
uniform float uCloudCurve, uFlash; uniform vec3 uFlashColor, uKeyDir, uKeyColor;
#endif
${NOISE}

// Clear-sky colour for a direction: vertical gradient plus a warm wash on the sun side.
vec3 atmosphere(vec3 d){
  float inv = 1. - clamp(d.y, 0., 1.);
  vec3 c = mix(uZenith, uMid, pow(inv, uGrad2.x));
  c = mix(c, uHorizon, pow(inv, uGrad.x));
  float side = .5 + .5*dot(d, uSunDir);
  float sc = pow(side, uGrad.z) * mix(uGrad2.y, 1., pow(inv, uGrad2.z));
  c = mix(c, uScatterColor, clamp(sc*uGrad.y, 0., 1.));
  return c;
}

// Sun: returns the halo; the disc (limb darkened, edge softened over ~3 px) comes back in disc so thick cloud
// can hide it. Discs under about 1 degree are capped at radiance 8 and carry their glow analytically instead,
// which keeps the bloom round.
vec3 sunLight(vec3 d, vec3 sd, vec3 col, vec4 s, float vis, float pix, out vec3 disc){
  float mu = dot(d, sd);
  float sa = length(d - sd*mu);                       // sine of the angular distance, precise near 0
  float aa = pix*1.5 + 1e-6;
  float m = (mu > 0.) ? 1. - smoothstep(s.x - aa, s.x + aa, sa) : 0.;
  float limb = sqrt(max(1. - sa*sa/(s.x*s.x), 0.));
  float small = 1. - smoothstep(.0122, .0192, s.x);   // 1 below 0.7 deg, 0 above 1.1 deg
  float I = mix(s.y, min(s.y, 8.), small);
  disc = col * I * m * (.55 + .45*limb) * vis;
  float g1 = .72, g2 = mix(.9, .985, s.w);
  float w = pow((1.-g1)*(1.-g1)/(1.+g1*g1-2.*g1*mu), 1.5);     // normalised Henyey-Greenstein lobes
  float t = pow((1.-g2)*(1.-g2)/(1.+g2*g2-2.*g2*mu), 1.5);
  float x = max(sa - s.x, 0.)/s.x;
  float front = (mu > 0.) ? vis : 0.;
  float corona = exp(-x/.9)*front;
  float skirt = (.75*exp(-x/3.) + .3/(1. + x*x*.16))*front*small*min(s.y, 16.)*.11;
  return col*(s.z*(.16*w + .42*t + .55*corona) + skirt*step(.001, s.z));
}
`;

const SKY_FRAG_SPACE = /* glsl */`
#ifdef STARS
// One shell of point stars on a 3D grid; stars keep at least ~1 px of radius so they do not shimmer.
vec3 starLayer(vec3 d, float pix, float scale, float seed, float bright, float boost){
  vec3 p = d*scale, ip = floor(p);
  vec3 h = h33(ip + seed);
  vec3 sp = ip + .5 + (h - .5)*.76;
  float rad = length(sp);
  float px = pix*scale;
  float dist = length(p - sp/rad*scale);
  if(dist > .09 + px*2.2 || abs(rad - scale) > .34) return vec3(0.);
  float h2 = fract(h.x*91.7 + h.y*37.3 + h.z*11.1);
  float shell = (1. - smoothstep(.16, .34, abs(rad - scale))) * step(fract(h2*3.77 + h.x), clamp(uStars.z*boost, 0., 1.));
  float mag = pow(fract(h2*7.31 + h.z), 7.)*.92 + .08;
  float r0 = .028 + .05*mag;
  float r = max(r0, px*.85);
  float core = exp(-dist*dist/(r*r*.32));
  float I = core * mag * bright * min(1., r0*r0/(r*r)*1.6 + .12);
  float tw = 1. + uStars.y*(.55*sin(uTime*(1.3 + 4.7*h.z) + h.y*40.) + .3*sin(uTime*(3.1 + 5.3*h.x) + h.z*17.)) * (1.5 - d.y);
  vec3 tint = mix(vec3(1., .78, .56), vec3(.66, .8, 1.), h.z);
  tint = mix(vec3(1.), tint, uStars.w * smoothstep(.0, .5, mag + .25));
  return tint * I * max(tw, 0.) * shell;
}
#endif

#ifdef MILKY
vec3 milkyWay(vec3 d, out float band){
  float lat = dot(d, uMilkyAxis);
  band = 0.;
  if(abs(lat) > .62) return vec3(0.);
  float n = fbm3(d*3.1 + 11., 4);
  float n2 = fbm3(d*8.1 - 4., 3);
  float lon = .5 + .5*dot(d, uMilkyCenter);                 // 1 towards the galactic centre
  float lw = lat + (n - .5)*.17;                            // the band meanders
  float wdt = mix(.11, .27, lon*lon)*(.75 + .6*n);
  band = exp(-lw*lw/(wdt*wdt))*(1. - smoothstep(.45, .62, abs(lat)));
  float core = exp(-lw*lw/(.008 + .04*lon*lon));
  float dust = smoothstep(.47, .6, n2 + .35*(n - .5))*exp(-lw*lw/.03)*(.6 + .4*lon);
  vec3 c = mix(uMilkyColor, uMilkyColor2, clamp(core*(.35 + n)*lon*1.4, 0., 1.));
  float I = band*(.1 + 2.6*n*n*n)*(.3 + 1.4*lon*lon) + core*lon*lon*1.1*n;
  return c*I*(1. - .92*dust)*uMilky;
}
#endif

#ifdef NEBULA
vec3 nebula(vec3 d){
  vec3 q = d*uNebula.y + uNebula.z;
  float w = fbm3(q*.6 + 3.7, 2);
  vec3 qq = q + 2.2*(w - .5);
  float n = fbm3(qq, 4);
  float lo = 1. - uNebula.w;
  float a = smoothstep(lo*.62 + .16, lo*.62 + .46, n);
  if(a <= 0.) return vec3(0.);
  float m = fbm3(qq*1.7 + 9.1 + 1.5*w, 3);
  float fil = pow(1. - abs(2.*m - 1.), 5.);                 // thin bright filaments
  vec3 c = mix(uNebulaA, uNebulaB, smoothstep(.34, .66, m));
  c = c*a*a*(.5 + 1.0*n) + uNebulaC*fil*a*a*.5;
  c *= 1. - .7*smoothstep(.55, .8, fbm3(qq*2.6 - 5., 2))*a;    // dark dust
  return c * uNebula.x;
}
#endif

#ifdef AURORA
// Vertical curtains marched through height slices. The sheet width is widened to the step size along the
// ray (band-limited), so there is no striping at low elevations; plan-view folds come from summed sines.
float auroraFold(vec2 p, float t){
  return p.y + .95*sin(p.x*.52 + t*.21) + .5*sin(p.x*1.31 - t*.33 + 1.7) + .22*sin(p.x*3.07 + t*.52 + p.y*.7) + .4*sin(p.x*.23 + p.y*.61 - t*.11);
}
vec3 aurora(vec3 d, float jit, float px){
  if(d.y < .02) return vec3(0.);
  vec3 acc = vec3(0.);
  float t = uTime*uAurora.z, inv = uAurora.y/(d.y + .1), dh = 1.2/float(AURORA_STEPS);
  vec2 g = d.xz*inv;
  float lat = .36*px*inv/(d.y + .1);                           // sheet spacing per pixel, per unit of height
  float prev = auroraFold(g*(1. + (jit - 1.)*dh), t)*.27;
  float zen = smoothstep(.38, .92, d.y);                       // looking up along the sheets
  for(int i=0;i<AURORA_STEPS;i++){
    float f = (float(i) + jit)*dh/1.2, h = 1. + f*1.2;
    vec2 p = g*h;
    float w = auroraFold(p, t)*.27;
    float dw = w - prev, along = max(.035 + .2*zen, abs(dw)*1.3), wid = max(along, lat*h); prev = w;
    float id = floor(w + .5), x = (w - id)/wid;
    // slide this sample to where the ray actually meets the sheet, so slices blend without seams
    float fr = clamp((id - w)/(abs(dw) > 1e-4 ? dw : 1e-4), -1.5, 1.5)*smoothstep(.002, .02, abs(dw));
    float wide = smoothstep(.22, .5, wid);                     // sheets closer than a sample: use their average
    vec2 ps = p + g*(dh*fr); float fs = clamp(f + fr*dh/1.2, 0., 1.3);
    float amp = mix(.5 + .5*h11(id*7.13 + 2.), .75, wide)*(1. - smoothstep(10., 26., length(p)))*smoothstep(2., 4.2, length(ps));
    float par = .42 + .58*smoothstep(0., .35, abs(dw)/(length(g)*dh*.27 + 1e-4));   // a ray running along a sheet piles up less
    float sheet = mix(exp(-x*x), 1.77*wid, wide)*along/wid*mix(par, 1., wide);
    float rays = vn2(vec2(ps.x*7.5 + ps.y*2.5, id*13.7 + t*.3));
    rays = mix(.22 + .78*rays*rays*(.65 + .35*sin(ps.x*1.9 - t*.12 + id*3.1)), .42, wide);
    float prof = smoothstep(0., .08 + .6*zen, fs)*exp(-fs*(.7 + 2.8*(1. - rays)));
    vec3 col = mix(uAuroraA, uAuroraB, smoothstep(.2, .85, fs + .2*(amp - .5)));
    acc += col*sheet*(.3 + .7*rays)*prof*amp;
  }
  float az = dot(normalize(d.xz + 1e-5), normalize(uAuroraDir.xz + 1e-5));
  float mask = mix(1., smoothstep(-.35, .75, az), uAurora.w);
  float act = .5 + .5*vn2(g*.35 + vec2(t*.03, 7.));
  // a curtain closer than about two of its heights is seen from below as a broad featureless blob with a hard
  // lower edge, so sheets fade out as they come that close (amp, above) and a rayed corona owns the zenith
  acc *= 3.1*mask*act*smoothstep(.02, .14, d.y)*(1. - .82*zen);
  float rr = length(d.xz); vec2 rd = d.xz/(rr + 1e-4);
  float r1 = vn2(rd*8.3 + vec2(t*.05, 3.)), ray = r1*vn2(rd*21.7 + vec2(5., -t*.08)); ray = ray*ray*(.3 + 2.6*vn2(rd*57. + t*.11));
  float over = smoothstep(.5 + .2*(1. - r1), .9, d.y);          // rays of uneven length
  float cor = ray*smoothstep(.06, .4, rr)*over*(.35 + .65*act)*mix(1., .5 + .5*mask, uAurora.w);
  acc += mix(uAuroraB, uAuroraA, smoothstep(.25, .75, rr))*cor*1.5;
  return acc/(1. + 1.15*dot(acc, vec3(.3, .5, .2)))*uAurora.x;      // soft shoulder: looking up along a sheet stays coloured
}
#endif

#if NUM_BODIES > 0
// Moon / planet: ray-traced sphere at unit distance with phase shading, optional bands and rings.
// Returns premultiplied colour and coverage. This is the dear part, and it is static: with bake it is
// rendered once into a tile and body() only samples it.
vec4 bodySurface(int i, vec3 d, float pix){
  vec3 c = uBodyDir[i].xyz; float R = uBodyDir[i].w;
  float b = dot(d, c);
  vec4 ring = uBodyRing[i];
  vec3 L = uBodyLight[i].xyz, ax = uBodyAxis[i].xyz; float seed = uBodyAxis[i].w;
  float sa = length(d - c*b);
  float aa = pix*1.1 + 1e-6;
  float cover = (b > 0.) ? 1. - smoothstep(R - aa, R + aa, sa) : 0.;
  vec3 col = vec3(0.); float alpha = 0., tS = 1e9;
  if(cover > 0.){
    float tt = b - sqrt(max(b*b - 1. + R*R, 0.));
    vec3 n = normalize(d*tt - c); tS = tt;
    float ndl = dot(n, L);
    float lit = smoothstep(-.06, .32, ndl)*(.72 + .28*max(ndl, 0.));
    float lat = dot(n, ax);
    vec3 q = n*2.1 + seed;
    float tex = fbm3(q, 4), bands = uBodyColor[i].w, m;
    if(bands > 0.){
      float turb = fbm3(vec3(n.x*1.3, lat*7., n.z*1.3) + seed, 3) - .5;
      float s = sin(lat*bands + turb*5.5) * .5 + .5;
      m = mix(s, smoothstep(.2, .8, s), .6)*(.7 + .6*fbm3(vec3(lat*9., q.x*.7, q.z*.7), 2));
      float storm = smoothstep(.09, .0, length(vec2(lat + .28, fract(atan(n.z, n.x)/6.2832 + seed) - .5)*vec2(1., 2.2)));
      m = mix(m, 1.25, storm*.8);
    } else {
      m = smoothstep(.44, .68, tex) + .5*smoothstep(.58, .62, fbm3(q*3.3, 2));
    }
    vec3 alb = mix(uBodyColor[i].rgb, uBodyColor2[i].rgb, clamp(m*uBodyColor2[i].w, 0., 1.));
    alb *= .78 + .44*tex;
    if(ring.y > 0.){                                   // ring shadow on the globe
      float dn = dot(L, ax);
      float ts = -dot(n*R, ax)/(abs(dn) > 1e-4 ? dn : 1e-4);
      if(ts > 0.){ float rr = length(n*R + L*ts)/R;
        float sh = smoothstep(ring.x - .04, ring.x + .04, rr)*(1. - smoothstep(ring.y - .04, ring.y + .04, rr));
        lit *= 1. - .7*sh*ring.z; }
    }
    col = alb*(lit + uBodyLight[i].w);
    float rim = pow(1. - max(dot(n, -d), 0.), 3.);    // atmosphere on the limb
    col += uBodyAtmo[i]*rim*(lit*.9 + .08)*ring.w;
    alpha = cover;
  }
  if(ring.y > 0. && b > 0.){
    float dn = dot(d, ax);
    float tr = dot(c, ax)/(abs(dn) > 1e-5 ? dn : 1e-5);
    if(tr > 0.){
      vec3 w = d*tr - c; float rr = length(w)/R;
      float fw = min(pix*tr*1.2/(R*max(abs(dn), .04)), .2) + 1e-4;   // ring-plane footprint of a pixel, in radii
      float bandA = smoothstep(ring.x - fw, ring.x + fw, rr)*(1. - smoothstep(ring.y - fw, ring.y + fw, rr));
      if(bandA > 0.){
        float u = (rr - ring.x)/(ring.y - ring.x);
        float g = .5 + .5*vn1(u*9. + seed*3.) ;
        g *= .62 + .38*vn1(u*41. + seed);
        g *= 1. - .85*smoothstep(.035, .0, abs(u - .58));     // a clean gap
        g *= smoothstep(0., .12, u)*(.4 + .6*smoothstep(1., .75, u));
        float ra = bandA*clamp(g*ring.z*1.5, 0., 1.);
        float pl = dot(w, L); float perp = length(w - L*pl);
        float sh = (pl < 0.) ? smoothstep(R*.9, R*1.06, perp) : 1.;
        vec3 rc = uBodyRingColor[i].rgb*(.55 + .45*g)*(sh*(.4 + .6*abs(dot(ax, L))) + .5*uBodyLight[i].w);
        if(tr < tS){ col = mix(col, rc, ra); alpha = alpha + ra*(1. - alpha); }
        else { col = col*alpha + rc*ra*(1. - alpha); float na = alpha + ra*(1. - alpha); col /= max(na, 1e-4); alpha = na; }
      }
    }
  }
  return vec4(col*alpha, alpha);
}
void body(int i, vec3 d, float ext, float cut, float pix, inout vec3 space, inout vec3 glow){
  vec3 c = uBodyDir[i].xyz; float R = uBodyDir[i].w;
  float b = dot(d, c);
  vec4 ring = uBodyRing[i];
  if(b < cos(min(R*max(max(ring.y, 1.6), 1. + uBodyGlow[i].w*4.) + .02, 1.5))) return;
  float fadeH = mix(1., ext, uBodyRingColor[i].w)*cut;       // reaches zero before the below-horizon cut
  float sa = length(d - c*b);
  if(ring.w > 0. && sa > R - pix*1.1){                 // soft atmospheric halo outside the limb
    float e = exp(-(sa - R)/(R*.09));
    glow += uBodyAtmo[i]*e*ring.w*.35*smoothstep(-.4, .6, dot(normalize(d - c*b + 1e-6), uBodyLight[i].xyz))*fadeH;
  }
  if(uBodyGlow[i].w > 0.){ float x = max(sa - R, 0.)/(R*uBodyGlow[i].w); glow += uBodyGlow[i].rgb*(exp(-x*x*.5)*.35 + .65*exp(-x*2.2))*fadeH; }
#ifdef BAKED_BODIES
  vec2 q = vec2(dot(d, uBodyT1[i].xyz), dot(d, uBodyT2[i].xyz))*uBodyT1[i].w;
  float g = pix*uBodyT1[i].w*.5;                       // explicit gradients: this fetch sits behind a branch
  vec4 s = textureGrad(uBodyTex, vec2((float(i) + q.x*.5 + .5)/float(NUM_BODIES), q.y*.5 + .5), vec2(g/float(NUM_BODIES), 0.), vec2(0., g));
  s *= step(max(abs(q.x), abs(q.y)), .995)*step(0., b);
#else
  vec4 s = bodySurface(i, d, pix);
#endif
  space = space*(1. - s.a) + s.rgb*fadeH;
}
#endif
`;

const SKY_FRAG_MAIN = /* glsl */`
#if CLOUDS > 0
float cloudDensity(vec2 p, float th, float soft, int oct){
  return clamp((fbm2(p, oct) - th)/soft, 0., 1.);
}
// One fbm layer projected on a curved shell. rgb = colour, a = coverage.
vec4 cloudLayer(int k, vec3 d, vec3 back, float side, int oct){
  float y = d.y;
  if(y < .004) return vec4(0.);
  vec4 A = uCloudA[k], B = uCloudB[k], W = uCloudW[k];
  float rr = uCloudCurve;
  float s = sqrt(rr*rr*y*y + 2.*rr + 1.) - rr*y;            // distance to the shell, in shell heights
  vec2 uv = d.xz*s*A.z + W.xy*uTime + W.z;
  vec2 wq = vec2(vn2(uv*.42 + 3.1), vn2(uv*.42 + vec2(9.2, -4.7)));
  vec2 p = uv + (wq - .5)*mix(.7, 1.6, B.w);
  p = mix(p, vec2(p.x*.28 + p.y*.1, p.y + .22*sin(p.x*.5)), B.w);   // cirrus: stretched streaks
  float th = mix(.8, .2, A.x), soft = A.y;
  float e = fbm2(p, oct) - th;
  if(e < -.03) return vec4(0.);
  float det = fbm2(p*5.3 + 7. + W.xy*uTime*1.7, B.w < .5 ? 3 : 2);
  e -= (det - .3)*B.x*.11;                                   // erode the edges with fine detail
  float alpha = smoothstep(0., soft*.42, e);
  if(alpha <= 0.) return vec4(0.);
  float td = mix(soft*1.7, min(soft*1.7, max(.05, (.8 - th)*.75)), smoothstep(.25, .45, th));
  float thick = clamp(e/td, 0., 1.);                         // saturates slowly: drives the shading
  // light arriving through the cloud from the key-light side
  vec2 ld = uKeyDir.xz/(length(uKeyDir.xz) + .05) * (1. - .6*clamp(uKeyDir.y, 0., 1.));
  float shadow = 1.;
  if(B.w < .5){
    float ts = mix(soft*1.7, td, .6);
    float dS = cloudDensity(p + ld*.3, th, ts, oct - 2);
    float dS2 = cloudDensity(p + ld*.85, th, ts, oct - 3);
    shadow = exp(-(dS*1.5 + dS2*.9)*B.z);
  } else shadow = exp(-thick*B.z*1.2);
  float self = exp(-thick*B.z*.9);
  float light = clamp((shadow*.84 + self*.3 - .12)*(.64 + .72*det), 0., 1.);
  vec3 c = mix(uCloudShade[k], uCloudLit[k], light);
  // undersides pick up the horizon glow; thin edges near the light turn to silver
  c += uScatterColor*pow(side, uGrad.z*.6)*uGrad.y*.3*(.3 + .7*light)*(1. - B.w*.5);
  float ks = .5 + .5*dot(d, uKeyDir);
  float fs = pow(ks, 10.)*.35 + pow(ks, 90.)*1.6;
  c += uKeyColor*B.y*fs*exp(-thick*3.2)*(.4 + shadow);
  // a sun veiled by this layer is a luminous patch, not a disc: wide forward scatter plus a tight core
  float smu = max(dot(d, uSunDir), 0.);
  c += uSunColor*uVeil*(pow(smu, 64.)*.5 + pow(smu, 700.)*2.6)*(.2 + .8*exp(-thick*2.4))*(1. - .5*B.w);
  c += uFlashColor*uFlash*smoothstep(.35, .8, vn2(uv*.22 + floor(uTime*3.)*7.3))*3.*alpha;
  float hazeAmt = 1. - exp(-(s - 1.)*W.w);
  c = mix(c, back, hazeAmt);
  float a = alpha*A.w*smoothstep(.0, .1, y)*(1. - hazeAmt*.55);
  return vec4(c, a);
}
#endif

#ifdef BAKE_BODY
// build-time pass: one moon / planet (with its rings) into its tile; vDir.xy is the tile coordinate (-1..1)
void main(){
  vec2 q = vDir.xy/uBodyT1[uBakeBody].w; float r2 = dot(q, q);
  vec4 o = vec4(0.);
  if(r2 < 1.){
    vec3 d = normalize(uBodyDir[uBakeBody].xyz*sqrt(1. - r2) + uBodyT1[uBakeBody].xyz*q.x + uBodyT2[uBakeBody].xyz*q.y);
    o = bodySurface(uBakeBody, d, 2./(uBodyT1[uBakeBody].w*BAKE_SIZE));
  }
  gl_FragColor = o;
}
#elif defined(BAKE_PASS)
// build-time pass: the static deep-sky terms rendered once into a cube map
void main(){
  vec3 d = normalize(vDir), c = vec3(0.); float band = 0.;
  #ifdef NEBULA
  c += nebula(d);
  #endif
  #ifdef MILKY
  c += milkyWay(d, band);
  #endif
  gl_FragColor = vec4(c, band);
}
#else
void main(){
  vec3 d = normalize(vDir);
  float pix = length(fwidth(d));                         // angular size of a pixel; taken once, outside any branch
  vec3 atmo = atmosphere(d);
  float side = .5 + .5*dot(d, uSunDir);
  float ext = mix(1., smoothstep(-.03, .24, d.y), uHorizonFade);
  float cut = mix(1., smoothstep(-.04, -.015, d.y), step(.5, uHorizonFade));
  float jit = h21(gl_FragCoord.xy + fract(uTime*.37)*91.7);
  vec3 space = vec3(0.), glow = vec3(0.);
  if(d.y > -.04 || uHorizonFade < .5){
  float band = 0.;
#ifdef BAKED
  { vec4 bk = textureCube(uBake, d); space += bk.rgb; band = bk.a; }
#else
  #ifdef NEBULA
  space += nebula(d);
  #endif
  #ifdef MILKY
  space += milkyWay(d, band);
  #endif
#endif
#ifdef STARS
  float sb = 1.;
  #ifdef MILKY
  sb += 2.2*band*uMilky;
  #endif
  space += (starLayer(d, pix, 42., 3.1, 3.2, .45) + starLayer(d, pix, 110., 17.3, 1.1*sb, 1.) + starLayer(d, pix, 205., 41.7, .55*sb, min(sb*.7, 1.)))*uStars.x;
#endif
  space *= ext;
#ifdef AURORA
  space += aurora(d, .5 + (jit - .5)*.7, pix);
#endif
#if NUM_BODIES > 0
  for(int i=0;i<NUM_BODIES;i++) body(i, d, ext, cut, pix, space, glow);
#endif
  }
  vec3 col = atmo + space + glow;

  float below = smoothstep(-.012, .004, d.y);
  below = mix(1., below, uHorizonFade);
  vec3 disc, disc2 = vec3(0.);
  vec3 halo = sunLight(d, uSunDir, uSunColor, uSun, below, pix, disc);
#ifdef SUN2
  halo += sunLight(d, uSun2Dir, uSun2Color, uSun2, below, pix, disc2); disc += disc2;
#endif

#if CLOUDS > 0
  float cover = 0.;
  vec3 back = atmosphere(vec3(d.x, 0., d.z));
  #if CLOUDS > 1
  { vec4 c2 = cloudLayer(1, d, back, side, 4); col = mix(col, c2.rgb, c2.a); cover = c2.a; }
  #endif
  // discs sit behind the clouds and vanish in thick cloud (cloudLayer adds the veiled glow); the halo is mostly in front
  vec4 c1 = cloudLayer(0, d, back, side, CLOUD_OCT);
  float clear = (1. - c1.a)*(1. - c1.a)*(1. - cover);
  col += disc*clear + halo*(1. - .8*c1.a)*(1. - .35*cover);
  col = mix(col, c1.rgb, c1.a);
  col += halo*c1.a*.22;
#else
  col += disc + halo;
#endif

  if(d.y < 0.){                                         // below the horizon: haze falling into the ground colour
    float g = 1. - exp(d.y*uGrad.w);
    col = mix(col, uGround, g*uHorizonFade);
  }
  float n = (jit + h21(gl_FragCoord.yx*1.37 + 11.) - 1.);     // triangular dither
  col += n*uDither*(col*.03 + .0009);
  gl_FragColor = vec4(max(col, 0.), uOpacity);
}
#endif
`;

// ---------------------------------------------------------------------------------------------
// Presets. Colours are sRGB hex (converted to linear); numbers are multipliers.
// ---------------------------------------------------------------------------------------------
const CLOUD_DEFAULT = { coverage: 0.5, softness: 0.32, scale: 1, opacity: 0.96, detail: 0.55, silver: 1, absorb: 1.75, stretch: 0, wind: [0.011, 0.004], haze: 0.17, lit: '#f6f2ea', shade: '#7d8eac' };
const CIRRUS_DEFAULT = { coverage: 0.5, softness: 0.4, scale: 0.42, opacity: 0.5, detail: 0.25, silver: 0.6, absorb: 0.5, stretch: 1, wind: [0.004, 0.0015], haze: 0.1, lit: '#ffffff', shade: '#c3cee2' };
const MOON_DEFAULT = { elevation: 35, azimuth: -35, size: 2, color: '#e9e6dc', color2: '#8d8a86', texture: 0.75, bands: 0, intensity: 1, dark: 0.012, phase: null, phaseAngle: 30, ring: null, atmosphere: null, atmosphereGlow: 0, glow: 0, glowColor: null, glowSize: 3, axis: [0.25, 1, 0.1], horizonFade: 0.8 };

const SKY_BASE = {
  zenith: '#0f44ad', mid: null, horizon: '#8fbde8', ground: '#7890a4', horizonPow: 4, midPow: 1.5, groundFalloff: 7,
  scatterColor: '#fff3dc', scatter: 0.3, scatterPow: 5, scatterHigh: 0.14, scatterFall: 3,
  sunElevation: 48, sunAzimuth: 35, sunColor: '#fff4e0', sunSize: 1.5, sunIntensity: 13, sunGlow: 0.7, sunGlowTight: 0.5,
  sun2: null, veil: 1,
  stars: 0, twinkle: 0.35, starDensity: 1, starColor: 0.65,
  milkyWay: 0, milkyAxis: [0.55, 0.45, 0.7], milkyColor: '#7f93c8', milkyCore: '#f1d7b0',
  nebula: 0, nebulaColors: ['#3b1d86', '#b3306e', '#55d6ff'], nebulaScale: 1.5, nebulaCoverage: 0.5,
  aurora: 0, auroraColors: ['#35ff9c', '#a548ff'], auroraScale: 1, auroraSpeed: 1, auroraAzimuth: 0, auroraSpread: 0.6,
  bodies: [], clouds: null, clouds2: null, cloudCurve: 22, horizonFade: 1, lightning: 0,
  key: 'sun', lightElevationMin: 8,
  lightColor: '#fff2df', lightIntensity: 3.2, ambientColor: '#a9c8ff', groundLight: '#6b6558', ambientIntensity: 1.8,
  fogColor: null, dither: 1, quality: 1, opacity: 1, bake: false, bakeSize: 512, renderer: null,
};
const SUN2_DEFAULT = { elevation: 24, azimuth: 40, color: '#a5d2ff', size: 0.6, intensity: 12, glow: 0.6, glowTight: 0.7 };

export const SKY_PRESETS = {
  day: { clouds: {}, clouds2: { opacity: 0.32 } },
  goldenHour: {
    zenith: '#1a479a', mid: '#5b84cc', horizon: '#f3c07c', ground: '#8a7a70', horizonPow: 3.4, scatterColor: '#ff9e42', scatter: 0.7, scatterPow: 4,
    sunElevation: 11, sunAzimuth: 18, sunColor: '#ffc680', sunSize: 1.7, sunIntensity: 13, sunGlow: 0.75,
    clouds: { coverage: 0.46, lit: '#ffd9a8', shade: '#6d6490', silver: 1.5 }, clouds2: { lit: '#ffe3c0', shade: '#b294a2', opacity: 0.35 },
    lightColor: '#ffc27e', lightIntensity: 2.9, ambientColor: '#9fb4e4', groundLight: '#7a6450', ambientIntensity: 1.5,
  },
  sunset: {
    zenith: '#0c1848', mid: '#523a84', horizon: '#cf6a74', ground: '#33263f', horizonPow: 4.5, midPow: 1.6,
    scatterColor: '#ff7e1e', scatter: 1.0, scatterPow: 3, scatterHigh: 0.07, scatterFall: 4,
    sunElevation: 2.6, sunAzimuth: 12, sunColor: '#ff9a48', sunSize: 2.0, sunIntensity: 12, sunGlow: 1.0, sunGlowTight: 0.35,
    stars: 0.12, clouds: { coverage: 0.5, lit: '#ff8a4e', shade: '#352b58', silver: 1.7, absorb: 1.8 }, clouds2: { lit: '#ffa07a', shade: '#6f4a7c', opacity: 0.3, coverage: 0.4 },
    lightColor: '#ff8f52', lightIntensity: 2.3, ambientColor: '#7472b8', groundLight: '#6a4652', ambientIntensity: 1.9,
  },
  dawn: {
    zenith: '#1d3a7a', mid: '#7b83be', horizon: '#f2b4a6', ground: '#857a92', horizonPow: 3.4, scatterColor: '#ffc68c', scatter: 0.6, scatterPow: 5,
    sunElevation: 4.5, sunAzimuth: -14, sunColor: '#ffd4aa', sunSize: 1.8, sunIntensity: 11, sunGlow: 0.7,
    stars: 0.07, clouds: { coverage: 0.34, lit: '#ffcdbc', shade: '#64638e', silver: 1.3 }, clouds2: { lit: '#ffd6cc', shade: '#a28bae', opacity: 0.4, coverage: 0.6 },
    lightColor: '#ffc4a0', lightIntensity: 2.1, ambientColor: '#8c9fd6', groundLight: '#6a5a66', ambientIntensity: 1.5,
  },
  blueHour: {
    zenith: '#050c2a', mid: '#132d74', horizon: '#3a5ca2', ground: '#0c152c', horizonPow: 4,
    scatterColor: '#e98058', scatter: 0.75, scatterPow: 10, scatterHigh: 0, scatterFall: 6,
    sunElevation: -5, sunAzimuth: 15, sunColor: '#ff9a6a', sunIntensity: 0, sunGlow: 0.3,
    stars: 0.5, milkyWay: 0.2, bodies: [{ elevation: 24, azimuth: 34, size: 1.7 }],
    clouds: { coverage: 0.36, lit: '#5a70aa', shade: '#1b2850', silver: 0.5 },
    lightElevationMin: 24, lightColor: '#7f9cff', lightIntensity: 1.2, ambientColor: '#4460b4', groundLight: '#222a4a', ambientIntensity: 2.3,
  },
  night: {
    zenith: '#030816', mid: '#0a1836', horizon: '#152e5a', ground: '#040812', horizonPow: 3.4, scatter: 0,
    sunElevation: -35, sunAzimuth: 160, sunIntensity: 0, sunGlow: 0,
    stars: 1, milkyWay: 1, bodies: [{ elevation: 36, azimuth: -38, size: 2.1, phase: 0.93, intensity: 0.95, dark: 0.03, glow: 0.16, glowColor: '#9db8ff' }], key: 0,
    clouds: { coverage: 0.32, softness: 0.38, lit: '#8398cc', shade: '#182446', opacity: 0.88, silver: 0.9, absorb: 2 }, cloudShade: '#22325e',
    lightColor: '#a9c1ff', lightIntensity: 1.2, ambientColor: '#3a5aa8', groundLight: '#18244a', ambientIntensity: 2.2,
  },
  polar: {
    zenith: '#020712', mid: '#071c2c', horizon: '#0e3842', ground: '#02080c', horizonPow: 3.4, scatter: 0,
    sunElevation: -30, sunAzimuth: 180, sunIntensity: 0, sunGlow: 0, stars: 0.9, milkyWay: 0.5, aurora: 1, cloudLit: '#1d4a55', cloudShade: '#0b1f2b', cloudLightColor: '#58ffb0',
    lightElevationMin: 40, lightColor: '#7dffc8', lightIntensity: 1.0, ambientColor: '#2c7888', groundLight: '#12303c', ambientIntensity: 2.3,
  },
  overcast: {
    zenith: '#5f6c7a', mid: '#8490a0', horizon: '#b4bbc0', ground: '#7b838a', horizonPow: 2.5, scatterColor: '#e6dfcc', scatter: 0.4, scatterPow: 3,
    sunElevation: 42, sunColor: '#fff0d6', sunIntensity: 10, sunGlow: 0.3, veil: 0.8,
    clouds: { coverage: 0.97, softness: 0.55, lit: '#d6d3cb', shade: '#59657a', absorb: 1.5, silver: 0.5, scale: 0.8, detail: 0.7 },
    clouds2: { coverage: 0.95, softness: 0.6, scale: 0.5, stretch: 0.25, opacity: 1, lit: '#aab0b6', shade: '#6d7888', wind: [0.006, 0.002] },
    lightColor: '#ece8e0', lightIntensity: 1.1, ambientColor: '#aab6c6', groundLight: '#70726e', ambientIntensity: 2.8,
  },
  storm: {
    zenith: '#1a2129', mid: '#2b353e', horizon: '#586870', ground: '#1d2328', horizonPow: 3,
    scatterColor: '#b4c8c0', scatter: 0.5, scatterPow: 8, scatterHigh: 0.02, scatterFall: 6,
    sunElevation: 9, sunAzimuth: 8, sunColor: '#d8e6dc', sunIntensity: 0, sunGlow: 0.22, lightning: 0.7, cloudShade: '#37414c',
    clouds: { coverage: 0.84, softness: 0.4, scale: 0.75, lit: '#8f9aa2', shade: '#283039', absorb: 2, silver: 0.5, wind: [0.03, 0.012], detail: 0.75 },
    clouds2: { coverage: 0.97, softness: 0.6, scale: 0.5, stretch: 0.3, opacity: 1, lit: '#4b565f', shade: '#1a2027', wind: [0.012, 0.005] },
    lightElevationMin: 30, lightColor: '#aab6c4', lightIntensity: 1.1, ambientColor: '#6a7688', groundLight: '#3a3d3c', ambientIntensity: 2.6,
  },
  alien: {
    zenith: '#110838', mid: '#371d78', horizon: '#22aea2', ground: '#0b2733', horizonPow: 3.4, scatterColor: '#ff5a98', scatter: 0.7, scatterPow: 6,
    sunElevation: 15, sunAzimuth: 22, sunColor: '#ffe0f0', sunSize: 1.15, sunIntensity: 13, sunGlow: 0.8,
    sun2: { elevation: 24, azimuth: 36, color: '#a5d2ff', size: 0.55, intensity: 12, glow: 0.5 },
    stars: 0.5, nebula: 0.22, nebulaColors: ['#3b1d86', '#17727a', '#ff7ab8'],
    bodies: [
      { elevation: 34, azimuth: -34, size: 13, color: '#dcae82', color2: '#7b466c', bands: 11, texture: 0.9, intensity: 0.9, dark: 0.02, phase: 0.6, phaseAngle: -18,
        ring: { inner: 1.35, outer: 2.25, color: '#ecd6bc', opacity: 0.85, tilt: 17, roll: 24 }, atmosphere: '#ffb0d0', atmosphereGlow: 1, horizonFade: 0.6 },
      { elevation: 52, azimuth: 8, size: 1.5, color: '#bfe8e0', color2: '#4f7f86', intensity: 1.1 },
    ],
    clouds2: { lit: '#ffc8de', shade: '#4a7f9a', opacity: 0.3, coverage: 0.45 },
    cloudLit: '#ffc6dc', cloudShade: '#46488c',
    fogColor: '#9a86b4',
    lightColor: '#ffd3ea', lightIntensity: 2.5, ambientColor: '#3fb0b0', groundLight: '#5a2a66', ambientIntensity: 1.6,
  },
  space: {
    zenith: '#000003', mid: '#000003', horizon: '#000003', ground: '#000003', scatter: 0, horizonFade: 0,
    sunElevation: 22, sunAzimuth: 40, sunColor: '#fff6ea', sunSize: 0.9, sunIntensity: 10, sunGlow: 0.4, sunGlowTight: 0.9,
    stars: 1.2, milkyWay: 1, nebula: 0.75, twinkle: 0, cloudLit: '#aab2c4', cloudShade: '#0c0f1a',
    lightColor: '#ffffff', lightIntensity: 3, ambientColor: '#2a3566', groundLight: '#141026', ambientIntensity: 1.5,
  },
};

const toColor = (v) => (v && v.isColor ? v.clone() : Array.isArray(v) ? new THREE.Color(v[0], v[1], v[2]) : new THREE.Color(v));
const addColor = (c, d, k) => { c.r += d.r * k; c.g += d.g * k; c.b += d.b * k; return c; };
const toDir = (v, out = new THREE.Vector3()) => (v.isVector3 ? out.copy(v) : out.set(v[0], v[1], v[2])).normalize();
// elevation above the horizon and azimuth in degrees; azimuth 0 looks down -Z, +90 is +X
export function skyDirection(elevation, azimuth, out = new THREE.Vector3()) {
  const e = elevation * DEG, a = azimuth * DEG;
  return out.set(Math.sin(a) * Math.cos(e), Math.sin(e), -Math.cos(a) * Math.cos(e));
}
function fallbackRng() { let a = 0x9e3779b9; const r = () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; return r; }
function mergeLayer(def, preset, over) {
  if (over === false || over === null) return null;
  if (over === undefined && !preset) return null;
  return { ...def, ...(preset || {}), ...(over && over !== true ? over : {}) };
}
function resolveSky(opts) {
  let name = opts.preset || 'day';
  if (!SKY_PRESETS[name]) { console.warn('kit/sky: unknown preset "' + name + '", using "day". Known: ' + Object.keys(SKY_PRESETS).join(', ')); name = 'day'; }
  const pre = SKY_PRESETS[name];
  const P = { ...SKY_BASE, ...pre };
  for (const k in opts) if (opts[k] !== undefined && k !== 'clouds' && k !== 'clouds2' && k !== 'sun2') P[k] = opts[k];
  P.clouds = mergeLayer(CLOUD_DEFAULT, pre.clouds, opts.clouds);
  P.clouds2 = mergeLayer(CIRRUS_DEFAULT, pre.clouds2, opts.clouds2);
  P.sun2 = mergeLayer(SUN2_DEFAULT, pre.sun2, opts.sun2);      // an object patches the preset's second sun, false removes it
  // bodies: `bodies` replaces the preset list; `bodyOverrides` ({ index: patch } or an array) patches entries in place
  const list = [...(P.bodies || [])];
  if (opts.moon) list.push(opts.moon);
  if (opts.moons) list.push(...opts.moons);
  if (opts.planets) list.push(...opts.planets);
  const ov = opts.bodyOverrides;
  if (ov) for (const k in ov) { const i = Number(k); if (list[i] && ov[k]) list[i] = { ...list[i], ...ov[k], ring: ov[k].ring && list[i].ring ? { ...list[i].ring, ...ov[k].ring } : ov[k].ring !== undefined ? ov[k].ring : list[i].ring }; }
  P.bodyList = list.slice(0, MAX_BODIES);
  P.preset = name;
  return P;
}

// 256x256 white noise for the dome shader: G = R shifted by (37,17) (3D lookups), B independent (2D lookups)
function makeSkyNoise() {
  const S = 256, d = new Uint8Array(S * S * 4); let a = 0x2545f491;
  const r = () => { a ^= a << 13; a ^= a >>> 17; a ^= a << 5; return (a >>> 0) & 255; };
  for (let i = 0; i < S * S; i++) { d[i * 4] = r(); d[i * 4 + 2] = r(); d[i * 4 + 3] = 255; }
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) d[(y * S + x) * 4 + 1] = d[(((y + 17) & 255) * S + ((x + 37) & 255)) * 4];
  const t = new THREE.DataTexture(d, S, S, THREE.RGBAFormat);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.magFilter = t.minFilter = THREE.LinearFilter; t.generateMipmaps = false; t.colorSpace = THREE.NoColorSpace; t.needsUpdate = true;
  return t;
}

// ---------------------------------------------------------------------------------------------
// makeSky
// ---------------------------------------------------------------------------------------------
const _X = new THREE.Vector3(1, 0, 0), _Y = new THREE.Vector3(0, 1, 0);

function bodyUniforms(b, sunDirection, rng) {
  const dir = b.direction ? toDir(b.direction) : skyDirection(b.elevation, b.azimuth);
  const t1 = new THREE.Vector3().crossVectors(dir, Math.abs(dir.y) > 0.95 ? _X : _Y).normalize();   // screen right
  const t2 = new THREE.Vector3().crossVectors(t1, dir).normalize();                                  // screen up
  const toViewer = dir.clone().negate();
  let light;
  if (b.phase == null) light = sunDirection.clone();
  else {
    const phi = Math.acos(Math.min(1, Math.max(-1, 2 * b.phase - 1))), a = (b.phaseAngle ?? 30) * DEG;
    light = toViewer.clone().multiplyScalar(Math.cos(phi)).addScaledVector(t1, Math.sin(phi) * Math.cos(a)).addScaledVector(t2, Math.sin(phi) * Math.sin(a));
  }
  const ring = b.ring || null;
  let axis;
  const tilt = ring ? ring.tilt ?? 18 : b.axisTilt;
  if (Array.isArray(tilt) || (tilt && tilt.isVector3)) axis = toDir(tilt);
  else if (tilt != null) {
    const B = tilt * DEG, r = ((ring ? ring.roll : b.axisRoll) ?? 20) * DEG;
    axis = t2.clone().multiplyScalar(Math.cos(B) * Math.cos(r)).addScaledVector(t1, Math.cos(B) * Math.sin(r)).addScaledVector(toViewer, Math.sin(B)).normalize();
  } else axis = toDir(b.axis);
  const k = b.intensity ?? 1, c1 = toColor(b.color).multiplyScalar(k), c2 = toColor(b.color2).multiplyScalar(k);
  const rc = toColor(ring ? ring.color ?? '#e6d6c0' : '#000000').multiplyScalar(k);
  const atmo = toColor(b.atmosphere || '#000000');
  return {
    direction: dir,
    t1: new THREE.Vector4(t1.x, t1.y, t1.z, 1 / Math.min(0.98, Math.sin(b.size * DEG) * Math.max(ring ? ring.outer ?? 2.2 : 1, 1) * 1.1 + 0.002)),
    t2: new THREE.Vector4(t2.x, t2.y, t2.z, 0),
    dir: new THREE.Vector4(dir.x, dir.y, dir.z, Math.sin(b.size * DEG)),
    color: new THREE.Vector4(c1.r, c1.g, c1.b, b.bands || 0),
    color2: new THREE.Vector4(c2.r, c2.g, c2.b, b.texture ?? 0.75),
    light: new THREE.Vector4(light.x, light.y, light.z, b.dark ?? 0.012),
    axis: new THREE.Vector4(axis.x, axis.y, axis.z, b.seed ?? rng() * 40),
    ring: new THREE.Vector4(ring ? ring.inner ?? 1.35 : 0, ring ? ring.outer ?? 2.2 : 0, ring ? ring.opacity ?? 0.85 : 0, b.atmosphere ? b.atmosphereGlow || 1 : 0),
    ringColor: new THREE.Vector4(rc.r, rc.g, rc.b, b.horizonFade ?? 0.8),
    atmo: new THREE.Vector3(atmo.r, atmo.g, atmo.b),
    glow: (() => { const g = toColor(b.glowColor || b.color).multiplyScalar(b.glow || 0); return new THREE.Vector4(g.r, g.g, g.b, b.glow > 0 ? b.glowSize ?? 3 : 0); })(),
  };
}

// A copy of a uniform table for a draw that happens later: numbers by value, colours / vectors / matrices cloned,
// arrays copied element by element, textures and anything else kept as the same object.
function snapUniforms(u) {
  const one = (v) => (v && typeof v === 'object' && !v.isTexture && typeof v.clone === 'function') ? v.clone() : v;
  const out = {};
  for (const k in u) { const v = u[k].value; out[k] = { value: Array.isArray(v) ? v.map(one) : (ArrayBuffer.isView(v) ? v.slice() : one(v)) }; }
  return out;
}

export function makeSky(opts = {}) {
  const P = resolveSky(opts);
  // one value is drawn from the caller's rng whatever the options are, so restyling a sky never reshuffles the world
  const rng = opts.rng ? (opts.rng.fork ? opts.rng.fork('sky') : opts.rng) : fallbackRng();
  const sunDirection = P.sunDirection ? toDir(P.sunDirection) : skyDirection(P.sunElevation, P.sunAzimuth);
  const bodies = P.bodyList.map((b) => bodyUniforms({ ...MOON_DEFAULT, ...b }, sunDirection, rng));
  const layers = [P.clouds, P.clouds2].filter(Boolean);
  const hasMilky = P.milkyWay > 0, hasStars = P.stars > 0 || hasMilky;
  const q = P.quality;

  const zenith = toColor(P.zenith), horizon = toColor(P.horizon), ground = toColor(P.ground);
  const mid = P.mid ? toColor(P.mid) : zenith.clone().lerp(horizon, 0.38);
  const scatterColor = toColor(P.scatterColor), sunColor = toColor(P.sunColor);
  const lightColor = toColor(P.lightColor), ambientColor = toColor(P.ambientColor), groundColor = toColor(P.groundLight);

  // key light: the sun, or a moon when the sun is down; never lower than a usable elevation
  const keyBody = typeof P.key === 'number' ? bodies[P.key] : null;
  const lightDirection = (keyBody ? keyBody.direction : sunDirection).clone();
  const minY = Math.sin(P.lightElevationMin * DEG);
  if (lightDirection.y < minY) {
    const h = Math.hypot(lightDirection.x, lightDirection.z) || 1, c = Math.sqrt(1 - minY * minY);
    lightDirection.set((lightDirection.x / h) * c, minY, (lightDirection.z / h) * c);
  }
  const keyDir = (keyBody ? keyBody.direction : sunDirection).clone();
  if (keyDir.y < 0.03) { keyDir.y = 0.03; keyDir.normalize(); }
  const keyColor = toColor(P.cloudLightColor || (keyBody ? P.lightColor : P.sunColor));

  const V4 = (a, b, c, d) => new THREE.Vector4(a, b, c, d);
  const u = {
    uNoiseTex: { value: P.noiseTexture || makeSkyNoise() },
    uTime: { value: 0 }, uOpacity: { value: P.opacity }, uDither: { value: P.dither }, uHorizonFade: { value: P.horizonFade },
    uZenith: { value: zenith }, uMid: { value: mid }, uHorizon: { value: horizon }, uGround: { value: ground }, uScatterColor: { value: scatterColor },
    uGrad: { value: V4(P.horizonPow, P.scatter, P.scatterPow, P.groundFalloff) }, uGrad2: { value: V4(P.midPow, P.scatterHigh, P.scatterFall, 0) },
    uSunDir: { value: sunDirection }, uSunColor: { value: sunColor },
    uSun: { value: V4(Math.sin(P.sunSize * DEG), P.sunIntensity, P.sunGlow, P.sunGlowTight) },
    uVeil: { value: P.sunIntensity > 0 ? P.veil * Math.min(1, P.sunIntensity / 10) * Math.min(1, Math.max(0, (sunDirection.y + 0.03) / 0.08)) : 0 },
  };
  const defines = { NUM_BODIES: bodies.length, CLOUDS: layers.length, CLOUD_OCT: q < 0.75 ? 4 : q >= 1.5 ? 6 : 5, AURORA_STEPS: q < 0.75 ? 9 : q >= 1.5 ? 22 : 14 };
  let sun2Direction = null;
  if (P.sun2) {
    const s2 = P.sun2;
    sun2Direction = s2.direction ? toDir(s2.direction) : skyDirection(s2.elevation, s2.azimuth);
    defines.SUN2 = 1;
    u.uSun2Dir = { value: sun2Direction }; u.uSun2Color = { value: toColor(s2.color) };
    u.uSun2 = { value: V4(Math.sin(s2.size * DEG), s2.intensity, s2.glow, s2.glowTight) };
  }
  if (hasStars) { defines.STARS = 1; u.uStars = { value: V4(P.stars, P.twinkle, P.starDensity, P.starColor) }; }
  if (hasMilky) {
    defines.MILKY = 1;
    const axis = toDir(P.milkyAxis);
    const centre = new THREE.Vector3().crossVectors(axis, _Y); if (centre.lengthSq() < 1e-4) centre.set(1, 0, 0);
    centre.normalize().applyAxisAngle(axis, (P.milkyAngle ?? 25) * DEG);
    u.uMilkyAxis = { value: axis }; u.uMilkyCenter = { value: centre }; u.uMilky = { value: P.milkyWay };
    u.uMilkyColor = { value: toColor(P.milkyColor) }; u.uMilkyColor2 = { value: toColor(P.milkyCore) };
  }
  if (P.nebula > 0) {
    defines.NEBULA = 1;
    const nc = P.nebulaColors;
    u.uNebulaA = { value: toColor(nc[0]) }; u.uNebulaB = { value: toColor(nc[1]) }; u.uNebulaC = { value: toColor(nc[2] ?? nc[1]) };
    u.uNebula = { value: V4(P.nebula, P.nebulaScale, P.nebulaSeed ?? rng() * 60, P.nebulaCoverage) };
  }
  if (P.aurora > 0) {
    defines.AURORA = 1;
    u.uAuroraA = { value: toColor(P.auroraColors[0]) }; u.uAuroraB = { value: toColor(P.auroraColors[1]) };
    u.uAuroraDir = { value: skyDirection(0, P.auroraAzimuth) };
    u.uAurora = { value: V4(P.aurora, P.auroraScale, P.auroraSpeed, P.auroraSpread) };
  }
  if (bodies.length) {
    for (const [name, key] of [['uBodyDir', 'dir'], ['uBodyColor', 'color'], ['uBodyColor2', 'color2'], ['uBodyLight', 'light'], ['uBodyAxis', 'axis'], ['uBodyRing', 'ring'], ['uBodyRingColor', 'ringColor'], ['uBodyAtmo', 'atmo'], ['uBodyGlow', 'glow'], ['uBodyT1', 't1'], ['uBodyT2', 't2']]) u[name] = { value: bodies.map((b) => b[key]) };
  }
  if (layers.length) {
    const L = [layers[0], layers[1] || layers[0]];
    u.uCloudA = { value: L.map((c) => V4(c.coverage, c.softness, c.scale * 3.2, c.opacity)) };
    u.uCloudB = { value: L.map((c) => V4(c.detail, c.silver, c.absorb, c.stretch)) };
    u.uCloudW = { value: L.map((c) => V4(c.wind[0] * 3.2, c.wind[1] * 3.2, c.seed ?? rng() * 200, c.haze)) };
    u.uCloudLit = { value: L.map((c) => toColor(c.lit)) }; u.uCloudShade = { value: L.map((c) => toColor(c.shade)) };
    u.uCloudCurve = { value: P.cloudCurve }; u.uFlash = { value: 0 }; u.uFlashColor = { value: toColor(P.flashColor || '#b9c8ff') };
    u.uKeyDir = { value: keyDir }; u.uKeyColor = { value: keyColor };
  }

  // Optional build-time bake of everything static and dear: nebula + milky way into a cube map, each moon or
  // planet into a tile of one strip texture. The per-frame shader then pays a fetch instead of several fbm.
  const fragmentShader = SKY_FRAG_HEAD + SKY_FRAG_SPACE + SKY_FRAG_MAIN;
  let bakeCube = null, bakeBodies = null, bakeLeft = null;
  if (P.bake && P.renderer) {
    const r = P.renderer, size = Math.max(64, Math.round(P.bakeSize * (q < 0.75 ? 0.5 : 1)));
    // The bake is cut into steps (one program, one cube face, one body tile each). Where the engine is loading a
    // world it leaves a list on the renderer (renderer.kitDefer) and runs one step after each hand-back of the
    // build, so the bake is never one long task; everywhere else the steps run here, at once, as they always did.
    const defer = Array.isArray(r.kitDefer) ? r.kitDefer : null, steps = [];
    // a deferred step runs after makeSky has returned: it draws with the uniforms as they stand NOW (a copy), so
    // nothing a world sets on the sky later in its build can reach the bake
    const ub = defer ? snapUniforms(u) : u;
    const common = { uniforms: ub, depthWrite: false, depthTest: false, fog: false, toneMapped: false, blending: THREE.NoBlending, side: THREE.DoubleSide };
    const guarded = (fn) => () => {
      const prevTarget = r.getRenderTarget(), face = r.getActiveCubeFace(), mip = r.getActiveMipmapLevel(), auto = r.autoClear, shadows = r.shadowMap.autoUpdate;
      r.autoClear = true; r.shadowMap.autoUpdate = false;
      try { fn(); } finally { r.setRenderTarget(prevTarget, face, mip); r.autoClear = auto; r.shadowMap.autoUpdate = shadows; }
    };
    // A bake's program is made in a step of its own (r.compile) and its faces are drawn in later steps. Where the
    // browser compiles shaders in the background, a face drawn before the program is finished makes the whole page
    // wait for it (the first use asks for the link's result). So a deferred draw step first asks whether the program is
    // ready and, if it is not, answers false: "not yet, ask me again" (the engine leaves it at the head of its list).
    // force: draw now whatever the answer (the engine after a long wait; the dome's own net below).
    const ready = (m) => { try { const p = r.properties.get(m).currentProgram; return !p || typeof p.isReady !== 'function' || p.isReady(); } catch (e) { return true; } };
    const whenReady = (m, fn) => { const g = guarded(fn); return defer ? (force) => { if (!force && !ready(m)) return false; g(); } : g; };
    if (defines.NEBULA || defines.MILKY) {
      bakeCube = new THREE.WebGLCubeRenderTarget(Math.round(size * 0.75), { type: THREE.HalfFloatType, format: THREE.RGBAFormat, generateMipmaps: false, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, depthBuffer: false, colorSpace: THREE.NoColorSpace });
      const cube = bakeCube;
      const bm = new THREE.ShaderMaterial({ name: 'KitSkyBake', ...common, defines: { ...defines, BAKE_PASS: 1 }, vertexShader: SKY_VERT, fragmentShader });
      const bg = new THREE.BoxGeometry(2, 2, 2), bs = new THREE.Scene(), box = new THREE.Mesh(bg, bm);
      box.frustumCulled = false; bs.add(box);
      const cc = new THREE.CubeCamera(0.1, 10, cube);
      cc.updateMatrixWorld(); cc.coordinateSystem = r.coordinateSystem; cc.updateCoordinateSystem();   // as CubeCamera.update() does
      const cams = cc.children.slice();
      if (defer) steps.push(guarded(() => { r.setRenderTarget(cube, 0, 0); r.compile(bs, cams[0]); }));   // the program alone, a step of its own
      for (let i = 0; i < 6; i++) steps.push(whenReady(bm, () => { r.setRenderTarget(cube, i, 0); r.render(bs, cams[i]); if (i === 5) { cube.texture.needsPMREMUpdate = true; bg.dispose(); bm.dispose(); } }));
    }
    if (bodies.length) {
      const n = bodies.length;
      bakeBodies = new THREE.WebGLRenderTarget(size * n, size, { type: THREE.HalfFloatType, format: THREE.RGBAFormat, generateMipmaps: true, minFilter: THREE.LinearMipmapLinearFilter, magFilter: THREE.LinearFilter, depthBuffer: false, colorSpace: THREE.NoColorSpace });
      bakeBodies.texture.wrapS = bakeBodies.texture.wrapT = THREE.ClampToEdgeWrapping; bakeBodies.scissorTest = true;
      const strip = bakeBodies;
      ub.uBakeBody = { value: 0 };
      const bm = new THREE.ShaderMaterial({ name: 'KitSkyBodyBake', ...common, defines: { ...defines, BAKE_BODY: 1, BAKE_SIZE: size.toFixed(1) }, vertexShader: SKY_BAKE_VERT, fragmentShader });
      const bg = new THREE.PlaneGeometry(2, 2), bs = new THREE.Scene(), quad = new THREE.Mesh(bg, bm), cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
      quad.frustumCulled = false; bs.add(quad);
      if (defer) steps.push(guarded(() => { strip.viewport.set(0, 0, size, size); strip.scissor.set(0, 0, size, size); r.setRenderTarget(strip); r.compile(bs, cam); }));
      for (let i = 0; i < n; i++) steps.push(whenReady(bm, () => {
        ub.uBakeBody.value = i; strip.viewport.set(i * size, 0, size, size); strip.scissor.set(i * size, 0, size, size);
        r.setRenderTarget(strip); r.render(bs, cam);
        if (i === n - 1) { bg.dispose(); bm.dispose(); delete ub.uBakeBody; }
      }));
    }
    if (defer) {
      // each step runs once, whoever asks first: the engine's build (the usual way), or the dome itself the first time
      // it is drawn with steps still waiting (a net for a build that was overtaken: never a dome without its bake)
      // (a step that answers false has not run: it is asked again)
      const once = steps.map((f) => { let done = false; return (force) => { if (done) return; if (f(force) === false) return false; done = true; }; });
      for (const f of once) defer.push(f);
      bakeLeft = () => { bakeLeft = null; for (const f of once) f(true); };
    } else for (const f of steps) f();
    if (bakeCube) { defines.BAKED = 1; u.uBake = { value: bakeCube.texture }; }
    if (bakeBodies) { defines.BAKED_BODIES = 1; u.uBodyTex = { value: bakeBodies.texture }; }
  }

  // CROSS-FADES: three.js (r170) draws a material with `transparent: false` and normal blending with NO blending,
  // so setOpacity() on a default dome does not fade: the dome appears at full strength the moment its opacity
  // passes 0.001. A dome that is faded with setOpacity() must be in the transparent pass from the start:
  // makeSky({ ..., transparent: true }) (or sky.material.transparent = true once in build(), before prewarm; the
  // lower half of the dome, sky.materialLow, follows it at once).
  // Never toggle `transparent` in update(): that compiles a second program mid-flight.
  const material = new THREE.ShaderMaterial({
    name: 'KitSky', uniforms: u, defines, vertexShader: SKY_VERT, fragmentShader,
    side: THREE.DoubleSide, depthWrite: false, depthTest: true, fog: false, toneMapped: false, transparent: false,
  });
  const baseOrder = P.renderOrder ?? -1;
  const part = (geometry, mat, name) => { const m = new THREE.Mesh(geometry, mat); m.name = name; m.frustumCulled = false; m.renderOrder = baseOrder; return m; };
  let object, materialLow = null, lower = null;
  if (P.horizonFade >= 0.5) {
    // Two fans meeting on a ring just under the horizon. Everything dear (stars, bodies, clouds, aurora) is zero
    // below it, so the lower fan runs the same shader with those features compiled out: identical pixels, and
    // renderers that cannot skip a branch (the software one used for screenshots) pay far less per frame.
    // `object` stays a plain Mesh with the full material (worlds swap its geometry); the lower fan is its child.
    const fan = (apexY) => {
      const N = 16, pos = [0, apexY, 0], idx = [];
      for (let i = 0; i < N; i++) { const a = (i / N) * Math.PI * 2; pos.push(Math.cos(a), -0.045, Math.sin(a)); idx.push(0, 1 + i, 1 + ((i + 1) % N)); }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); return g;
    };
    const lowDefines = { NUM_BODIES: 0, CLOUDS: 0, CLOUD_OCT: 4, AURORA_STEPS: 1 };
    if (defines.SUN2) lowDefines.SUN2 = 1;
    materialLow = new THREE.ShaderMaterial({
      name: 'KitSkyLow', uniforms: u, defines: lowDefines, vertexShader: SKY_VERT, fragmentShader,
      side: THREE.DoubleSide, depthWrite: false, depthTest: true, fog: false, toneMapped: false, transparent: false,
    });
    object = part(fan(1), material, 'sky'); lower = part(fan(-1), materialLow, 'skyLower'); object.add(lower);
  } else object = part(new THREE.BoxGeometry(2, 2, 2), material, 'sky');
  const setOrder = (r) => { object.renderOrder = r; if (lower) lower.renderOrder = r; };
  if (bakeLeft) { const net = () => { if (bakeLeft) bakeLeft(); }; object.onBeforeRender = net; if (lower) lower.onBeforeRender = net; }
  // The lower half follows the upper one at once: a world that writes sky.material.transparent = true in build()
  // moves BOTH halves before anything is compiled (found by a crew: the lower half used to follow only in update(),
  // which compiled its program during the flight).
  if (materialLow) {
    let pass = material.transparent;
    Object.defineProperty(material, 'transparent', { configurable: true, enumerable: true, get: () => pass, set: (v) => { pass = !!v; materialLow.transparent = pass; } });
  }
  if (P.transparent) material.transparent = true;

  // CPU mirror of atmosphere(): clear-sky colour for a direction (no sun disc, clouds or stars)
  const colorAt = (dir, out = new THREE.Color()) => {
    const inv = 1 - Math.min(1, Math.max(0, dir.y));
    out.copy(zenith).lerp(mid, Math.pow(inv, P.midPow)).lerp(horizon, Math.pow(inv, P.horizonPow));
    const side = 0.5 + 0.5 * dir.dot(sunDirection);
    const sc = Math.pow(side, P.scatterPow) * (P.scatterHigh + (1 - P.scatterHigh) * Math.pow(inv, P.scatterFall));
    out.lerp(scatterColor, Math.min(1, Math.max(0, sc * P.scatter)));
    if (dir.y < 0) out.lerp(ground, (1 - Math.exp(dir.y * P.groundFalloff)) * P.horizonFade);
    return out;
  };
  let fogColor;
  if (P.fogColor) fogColor = toColor(P.fogColor);
  else {
    fogColor = new THREE.Color(0, 0, 0);
    const az = Math.atan2(sunDirection.x, -sunDirection.z), d = new THREE.Vector3(), c = new THREE.Color();
    const offs = [20, -20, 60, -60, 120, -120], wts = [0.2, 0.2, 0.18, 0.18, 0.12, 0.12];
    offs.forEach((o, i) => { const a = az + o * DEG; d.set(Math.sin(a), 0.03, -Math.cos(a)).normalize(); colorAt(d, c); fogColor.r += c.r * wts[i]; fogColor.g += c.g * wts[i]; fogColor.b += c.b * wts[i]; });
  }
  const L0 = layers[0];
  const lum = Math.min(1, P.lightIntensity / 3);
  const cloudLit = P.cloudLit ? toColor(P.cloudLit) : L0 && !L0.stretch ? toColor(L0.lit) : lightColor.clone().lerp(new THREE.Color(1, 1, 1), 0.25).multiplyScalar(0.25 + 0.7 * lum);
  const cloudShade = P.cloudShade ? toColor(P.cloudShade) : L0 && !L0.stretch ? toColor(L0.shade) : ambientColor.clone().multiplyScalar(0.55 * Math.min(1.2, P.ambientIntensity + 0.3));

  const flashSeed = rng() * 100;
  const sunI = P.sunIntensity, sun2I = P.sun2 ? P.sun2.intensity : 0;
  const frac = (x) => x - Math.floor(x);
  const sky = {
    object, material, materialLow, uniforms: u, preset: P.preset, options: P, noiseTexture: u.uNoiseTex.value,
    sunDirection, sun2Direction, lightDirection, keyDirection: keyDir, bodyDirections: bodies.map((b) => b.direction),
    sunColor, lightColor, lightIntensity: P.lightIntensity, ambientColor, groundColor, ambientIntensity: P.ambientIntensity,
    fogColor, horizonColor: horizon, zenithColor: zenith, cloudLit, cloudShade, keyColor, flash: 0, opacity: 1, baked: !!(bakeCube || bakeBodies),
    colorAt,
    // cross-fade: 0 hides the dome, 0..1 blends it over whatever was drawn before it. HDR discs are scaled by o^2
    // as well, so an incoming sun does not show as a ghost disc at the first few percent.
    setOpacity(o) {
      o = Math.min(1, Math.max(0, o));
      u.uOpacity.value = o; object.visible = o > 0.001; setOrder(o < 0.999 ? baseOrder + 0.5 : baseOrder);
      u.uSun.value.y = sunI * o * o; if (u.uSun2) u.uSun2.value.y = sun2I * o * o;
      sky.opacity = o;
    },
    // compile the dome's shader now (during build) instead of on the first frame it is visible
    prewarm(renderer = P.renderer, camera = null, scene = null) {
      if (!renderer) return Promise.resolve();
      const vis = object.visible, prev = renderer.getRenderTarget(), rt = new THREE.WebGLRenderTarget(1, 1, { depthBuffer: false });
      const cam = camera || new THREE.PerspectiveCamera();
      let p = null;
      if (materialLow && materialLow.transparent !== material.transparent) materialLow.transparent = material.transparent;   // compile the lower half for the right pass now, not on the first frame
      object.visible = true;
      try {
        renderer.setRenderTarget(rt);          // programs depend on the output colour space: worlds are drawn into a linear target
        p = renderer.compileAsync ? renderer.compileAsync(object, cam, scene || undefined) : renderer.compile(object, cam, scene || undefined);
      } catch (e) { p = null; }
      renderer.setRenderTarget(prev); rt.dispose(); object.visible = vis;
      return Promise.resolve(p).then(() => {}, () => {});
    },
    // frees the baked cube map (only needed with bake: true); safe to call more than once
    dispose() { if (bakeCube) { bakeCube.dispose(); bakeCube = null; } if (bakeBodies) { bakeBodies.dispose(); bakeBodies = null; } },
    update(dt, time, camera) {
      u.uTime.value = time;
      if (camera) object.position.copy(camera.position);
      // a world may move the dome to the transparent pass (sky.material.transparent = true): keep both halves together
      if (materialLow && materialLow.transparent !== material.transparent) { materialLow.transparent = material.transparent; materialLow.needsUpdate = true; }
      if (P.lightning > 0 && u.uFlash) {
        const period = 2.6, k = Math.floor(time / period), r = frac(Math.sin(k * 127.1 + flashSeed) * 43758.5453);
        let f = 0;
        if (r < P.lightning) {
          const t = time - (k + 0.15 + 0.5 * frac(r * 57.3)) * period;
          if (t > 0) f = Math.exp(-t * 7) * (0.55 + 0.45 * Math.sin(t * 60 + r * 20) ** 2);
        }
        sky.flash = f; u.uFlash.value = f;
      }
    },
  };
  if (P.opacity < 1) sky.setOpacity(P.opacity);
  return sky;
}

// ---------------------------------------------------------------------------------------------
// makeCloudField: instanced soft puffs (sorted back to front) lit as lumpy spheres
// ---------------------------------------------------------------------------------------------
const MAX_AVOID = 16;

// Shared by the puff and deck shaders: haze that takes the matched sky's horizon colour in the azimuth
// you are looking at, so far clouds melt into the sky they stand against (orange under a low sun, violet away).
const CLOUD_HAZE = /* glsl */`
uniform vec3 uHazeSun, uHazeAway, uHazeDir; uniform vec4 uHazeP;   // azimuth power, use sky haze (0/1), range start, range end
vec3 hazeColor(vec3 V, vec3 base){
  float len = length(uHazeDir.xz);
  float side = .5 + .5*dot(normalize(V.xz + 1e-5), uHazeDir.xz);
  vec3 skyHaze = mix(uHazeAway, uHazeSun, pow(clamp(side/(.5 + .5*len), 0., 1.), uHazeP.x));
  return mix(base, skyHaze, uHazeP.y);
}
// large-scale light on a cloud surface element (shared so the deck and the puffs agree)
float cloudTone(vec3 n, float back, vec3 S){
  float top = clamp(n.y, 0., 1.), ndl = dot(n, S);
  ndl *= ndl > 0. ? 1. : .55;                                   // the far side keeps some skylight
  return .56 + .62*ndl*(1. - .6*back) + .12*n.y - .12*back*(1. - .8*top) + .07*back*top;
}
`;

const PUFF_VERT = /* glsl */`
attribute vec4 iPos;      // xyz centre, w radius
attribute vec4 iData;     // seed, base occlusion, alpha, flat-base height
attribute vec4 iNrm;      // xyz offset from the cloud core (-1..1): the large-scale normal; w tier (1 = far ring)
uniform float uTime; uniform vec3 uDrift, uSunDir; uniform vec4 uWrap, uFade, uFade2; uniform vec2 uLight;
#if AVOID > 0
uniform vec4 uAvoidA[AVOID], uAvoidB[AVOID];
#endif
varying vec2 vUv, vOut, vProj, vAux; varying vec4 vData, vLit, vHaze; varying vec3 vNrm, vWorld; varying float vViewZ;
#include <fog_pars_vertex>
#ifdef USE_FOG
uniform vec3 fogColor;
#endif
${CLOUD_HAZE}
void main(){
  vec3 c = (modelMatrix*vec4(iPos.xyz + uDrift, 1.)).xyz;
  float fade = 1., tier = iNrm.w;
#ifdef WRAP
  vec2 wrap = mix(uWrap.xy, uWrap.zw, tier);
  c.xz = mod(c.xz - cameraPosition.xz + wrap*.5, wrap) - wrap*.5 + cameraPosition.xz;
  vec2 ed = abs(c.xz - cameraPosition.xz)/wrap*2.;
  fade *= 1. - smoothstep(.72, .98, max(ed.x, ed.y));
#endif
  float seed = iData.x;
  float size = iPos.w*(1. + .045*sin(uTime*.23 + seed*37.));
#if AVOID > 0
  // keep clear of solids: a puff shrinks to fit the gap and fades away when there is no room left
  float room = 1e9;
  for(int i=0;i<AVOID;i++){
    vec4 A = uAvoidA[i], B = uAvoidB[i]; float rm;
    if(B.z < .5) rm = distance(c, A.xyz) - A.w;                                   // sphere
    else {                                                                        // upright cone frustum
      float t = clamp((A.y - c.y)/max(A.y - B.x, 1e-3), 0., 1.);
      float dxz = length(c.xz - A.xz) - mix(A.w, B.y, t), dy = max(c.y - A.y, B.x - c.y);
      rm = dy > 0. ? length(vec2(max(dxz, 0.), dy)) : dxz;
    }
    room = min(room, rm);
  }
  float fit = clamp(room/(size*.78), 0., 1.);
  fade *= smoothstep(.3, .95, fit); size *= max(fit, .3);
#endif
  vec3 right = vec3(viewMatrix[0][0], viewMatrix[1][0], viewMatrix[2][0]);
  vec3 up = vec3(viewMatrix[0][1], viewMatrix[1][1], viewMatrix[2][1]);
  vec2 uv = position.xy*1.5;                                  // the eroded blob rarely reaches past r = .75
  // flat base: the part of the quad under the base is never rasterised (saves fill)
  if(up.y > .25) uv.y = max(uv.y, min(((iData.w - size*.12 - c.y)/size - right.y*uv.x)/up.y, .75));
  vUv = uv;
  vWorld = c + (right*uv.x + up*uv.y)*size;
  vec4 mvPosition = viewMatrix*vec4(vWorld, 1.);
  gl_Position = projectionMatrix*mvPosition;
  vViewZ = mvPosition.z; vProj = vec2(projectionMatrix[2][2], projectionMatrix[3][2]);
  float dist = distance(c, cameraPosition);
  fade *= mix(smoothstep(size*uFade.x, size*uFade.y, dist)*(1. - smoothstep(uFade.z, uFade.w, dist)),
              smoothstep(uFade2.x, uFade2.y, dist)*(1. - smoothstep(uFade2.z, uFade2.w, dist)), tier);
  // large-scale light: which side of the whole cloud this puff sits on, and how high
  vec3 V = normalize(c - cameraPosition);
  float mu = dot(V, uSunDir), mup = max(mu, 0.);
  float back = mup*mup;                                        // 1 when looking into the light
  float big = max(cloudTone(iNrm.xyz, back, uSunDir) - iData.y, uLight.x);
  float sil = smoothstep(.4, .95, length(iNrm.xyz - V*dot(iNrm.xyz, V)));   // puffs on the cloud's outline as seen from here
  float mu6 = back*back*back, mu36 = mu6*mu6*mu6; mu36 *= mu36;
  float crest = clamp(1. - iData.y*5., 0., 1.);                             // top / crest puffs: the ones light gets through
  float tight = (mu6*.24 + mu36*mu6*1.3)*(.12 + .88*sil)*(.35 + .65*crest); // silver lining close to the sun
  float broad = .215/pow(1.16 - .8*mu, 1.5)*(.1 + .9*sil)*crest;            // Henyey-Greenstein g = .4: rims at any angle
  float ang = size*projectionMatrix[1][1]/max(dist, 1.);                    // size on screen, in half-heights
  vData = vec4(seed, big, iData.z*fade, iData.w); vNrm = iNrm.xyz;
  vLit = vec4(size, tight, broad, mix(1., .66, smoothstep(.08, .45, ang)));
  vAux = vec2(1. - .7*back, .8 + .5*dot(iNrm.xyz, iNrm.xyz));
  // haze is taken once per puff: the sky's horizon colour in this azimuth, and the sea's own distance haze
  #ifdef USE_FOG
  vHaze.rgb = hazeColor(V, fogColor);
  #else
  vHaze.rgb = hazeColor(V, uHazeAway);
  #endif
  vHaze.a = .85*smoothstep(uHazeP.z, uHazeP.w, distance(c.xz, cameraPosition.xz));
  vOut = vec2(dot(iNrm.xyz, right), dot(iNrm.xyz, up)); vOut /= length(vOut) + .15;
  if(fade <= 0.) gl_Position = vec4(2., 2., 2., 1.);          // culled
  #include <fog_vertex>
}`;

const PUFF_FRAG = /* glsl */`
precision highp float;
uniform sampler2D uNoise;
uniform float uTime, uSilver, uFogFade; uniform vec3 uSunDir, uSunColor, uLit, uShade, uBottom; uniform vec4 uShape; uniform vec2 uShape2, uLight;
varying vec2 vUv, vOut, vProj, vAux; varying vec4 vData, vLit, vHaze; varying vec3 vNrm, vWorld; varying float vViewZ;
#include <fog_pars_fragment>
void main(){
  float r2 = dot(vUv, vUv), r = sqrt(r2), seed = vData.x;
  vec4 t = texture2D(uNoise, vUv*uShape.w*.11 + seed*vec2(3.71, 9.17) + uTime*vec2(.0014, .0009));
  float lump = mix(t.r, t.g, .26 + .2*uShape2.x);              // big lobes plus cauliflower detail
  float ero = lump*uShape.x*(.25 + .75*r)*vAux.y;
  float e = (1. - r) - ero;
  float a = smoothstep(0., uShape.y*vLit.w, e)*(1. - smoothstep(.63, .75, max(abs(vUv.x), abs(vUv.y))));
  a *= smoothstep(vData.w - vLit.x*.1, vData.w + vLit.x*.32, vWorld.y);      // flat cumulus base
  a *= vData.z;
  // surface normal: a sphere bent by the slope of the erosion field, so the shading follows the lumps you see
  vec2 gn = vec2(dFdx(ero), dFdy(ero))/max(vec2(abs(dFdx(vUv.x)), abs(dFdy(vUv.y))), vec2(1e-5));
  gn = clamp(gn, -4., 4.);
  vec3 Nv = normalize(vec3(vUv*.5 + gn*uShape.z*.3, sqrt(max(1. - r2, 0.)) + .4));
  vec3 N = (vec4(Nv, 0.)*viewMatrix).xyz;
  float light = max(vData.y + dot(N, uSunDir)*.3*vAux.x - (lump - .5)*(.2 + .3*vAux.x), uLight.x*.55);   // folds sit in their own shade
  light = smoothstep(.08, .98, light);
  vec3 col = mix(mix(uBottom, uShade, smoothstep(-.5, .7, vNrm.y + N.y*.5)), uLit, light);
  // light coming through the thin edge of the cloud's outline: broad forward scatter, silver close to the sun
  float thin = 1. - smoothstep(0., .5, e);
  float rim = (vLit.z*.56 + vLit.y)*thin*smoothstep(-.1, .75, dot(vUv, vOut)/(r + .05)) + vLit.y*.08;
  col += uSunColor*(uSilver*rim);
  #ifdef USE_FOG
    #ifdef FOG_EXP2
    float fogFactor = 1. - exp(-fogDensity*fogDensity*vFogDepth*vFogDepth);
    #else
    float fogFactor = smoothstep(fogNear, fogFar, vFogDepth);
    #endif
    col = mix(col, vHaze.rgb, fogFactor); a *= 1. - fogFactor*uFogFade;
  #endif
  col = mix(col, vHaze.rgb, vHaze.a);
  if(a < .012) discard;
  #ifdef IMPOSTOR
  // sphere-impostor depth: solid geometry cuts a puff along a lumpy contour instead of a straight plane
  float bulge = sqrt(max(1. - r2*1.6, 0.))*.8 - (lump - .5)*.6;
  float zv = min(vViewZ + max(bulge, 0.)*vLit.x*uShape2.y, -.35);
  gl_FragDepth = clamp((vProj.x*zv + vProj.y)/(-zv)*.5 + .5, 0., 1.);
  #endif
  gl_FragColor = vec4(col, a);
}`;

const DECK_VERT = /* glsl */`
varying vec3 vWorld;
#include <fog_pars_vertex>
void main(){
  vec4 w = modelMatrix*vec4(position, 1.); vWorld = w.xyz;
  vec4 mvPosition = viewMatrix*w; gl_Position = projectionMatrix*mvPosition;
  #include <fog_vertex>
}`;
const DECK_FRAG = /* glsl */`
precision highp float;
uniform sampler2D uNoise;
uniform float uTime, uRadius, uScale, uBump, uSilver, uFogFade; uniform vec3 uDrift, uSunDir, uSunColor, uLit, uShade, uBottom; uniform vec2 uLight;
varying vec3 vWorld;
#include <fog_pars_fragment>
${CLOUD_HAZE}
float field(vec2 p, float b, float w){ vec2 t = texture2D(uNoise, p, b).rg; return t.r + (t.g - t.r)*w; }
void main(){
  // the floor under the puffs: a billowing height field shaded with the puffs' own light, so the sea keeps
  // its relief out to the haze (trilinear + anisotropic filtering flattens it smoothly with distance)
  vec2 p = (vWorld.xz - uDrift.xz)*uScale, p2 = p*3.7 + .31;
  float d = length(vWorld.xz - cameraPosition.xz);
  const float E = .009;
  vec3 V = normalize(vWorld - cameraPosition);
  // seen at a grazing angle only the crests of a cloud sea show: relief, troughs and fine detail fade with the view angle
  float gz = smoothstep(.03, .34, -V.y), fine = gz*(1. - smoothstep(250., 1500., d)), lb = 1.6*(1. - gz);
  float wf = .4*gz;                                            // share of the finer octaves in the billows
  float h0 = field(p, lb, wf), k0 = field(p2, lb, .4);
  vec2 g = vec2(field(p + vec2(E, 0.), lb, wf) - h0, field(p + vec2(0., E), lb, wf) - h0)/E*(.3 + .7*gz);
  float m = mix(.6, h0*.72 + mix(h0, k0, fine*.5)*.28, .25 + .75*gz);
  vec3 n = normalize(vec3(-g.x*uBump, 1., -g.y*uBump));
  float mu = dot(V, uSunDir), mup = max(mu, 0.), back = mup*mup;
  float tone = max(cloudTone(n*.8, back, uSunDir) + (m - .56)*.5 - .06, uLight.x);      // troughs in shade; the floor sits under the puffs
  float light = smoothstep(.08, .98, tone);
  vec3 col = mix(mix(uBottom, uShade, smoothstep(.1, .45, m)), uLit, light);
  // low light skimming the crests on the sun side
  col += uSunColor*uSilver*pow(mup, 10.)*.1*(.4 + .9*m);
  vec3 hz = hazeColor(V, uHazeAway);
  float a = 1. - smoothstep(uRadius*.5, uRadius*.97, d);                    // the far sea dissolves into the sky itself
  #ifdef USE_FOG
    hz = hazeColor(V, fogColor);
    #ifdef FOG_EXP2
    float fogFactor = 1. - exp(-fogDensity*fogDensity*vFogDepth*vFogDepth);
    #else
    float fogFactor = smoothstep(fogNear, fogFar, vFogDepth);
    #endif
    col = mix(col, hz, fogFactor); a *= 1. - fogFactor*uFogFade*.5;
  #endif
  col = mix(col, hz, .85*smoothstep(uHazeP.z, uHazeP.w, d));
  gl_FragColor = vec4(col, a);
}`;

// Tileable fbm in R and G (B, A are shifted copies): one fetch replaces a whole procedural fbm.
// The bake is a generator, written once for both ways of making a cloud field: one yield before it starts (so that what came before
// the bake is a stretch of its own), then one after every NOISE_STEP pixels' worth of rows of each octave and of each fill pass
// (4 rows of the 256 x 256 texture: 641 yields in all). The blocks are that small because the first of them run before the loops
// have been optimised, at a hundred times the cost of the later ones. makeCloudField runs the generator to the end in one piece;
// makeCloudFieldAsync hands the page back at each yield. The pixel loops are plain functions over the rows y0..y1 (a loop written
// in a generator's own body runs slower), with the arithmetic as it always was.
const NOISE_STEP = 1024;
function noiseOctave(acc, lat, per, amp, ix0, ix1, wx, size, y0, y1) {
  for (let y = y0; y < y1; y++) {
    const r0 = ix0[y] * per, r1 = ix1[y] * per, wy = wx[y];
    for (let x = 0, p = y * size; x < size; x++, p++) {
      const a = lat[r0 + ix0[x]], b = lat[r0 + ix1[x]], c = lat[r1 + ix0[x]], d = lat[r1 + ix1[x]], w = wx[x];
      acc[p] += amp * (a + (b - a) * w + (c + (d - c) * w - a - (b - a) * w) * wy);
    }
  }
}
function noiseFill(data, f0, f1, norm, size, y0, y1) {
  const px = (v) => Math.max(0, Math.min(255, ((v / norm - 0.5) * 1.75 + 0.5) * 255));
  for (let y = y0; y < y1; y++) for (let x = 0, p = y * size; x < size; x++, p++) { data[p * 4] = px(f0[p]); data[p * 4 + 1] = px(f1[p]); }
}
// B and A are R at a shifted pixel: the byte R already holds there is the byte px would give again (the same value through the
// same arithmetic and the same store), so it is copied, not worked out a second time. Runs once every row has its R.
function noiseShift(data, size, y0, y1) {
  const m = size - 1;
  for (let y = y0; y < y1; y++) for (let x = 0; x < size; x++) {
    const p = y * size + x, s = ((y + 89) & m) * size + ((x + 151) & m), s2 = ((y + 33) & m) * size + ((x + 201) & m);
    data[p * 4 + 2] = data[s * 4]; data[p * 4 + 3] = data[s2 * 4];
  }
}
function* noiseSteps(rng, size = 256) {
  const N = size * size, f = [new Float32Array(N), new Float32Array(N)], rows = Math.max(1, Math.round(NOISE_STEP / size));
  const ix0 = new Int32Array(size), ix1 = new Int32Array(size), wx = new Float32Array(size);
  yield;
  for (let ch = 0; ch < 2; ch++) {
    const acc = f[ch];
    for (let o = 0, per = ch ? 16 : 4, amp = 0.5; o < 4; o++, per *= 2, amp *= 0.55) {
      const lat = new Float32Array(per * per); for (let i = 0; i < lat.length; i++) lat[i] = rng();
      for (let x = 0; x < size; x++) { const fx = x / size * per, i = Math.floor(fx), t = fx - i; ix0[x] = i % per; ix1[x] = (i + 1) % per; wx[x] = t * t * (3 - 2 * t); }
      for (let y = 0; y < size; y += rows) { noiseOctave(acc, lat, per, amp, ix0, ix1, wx, size, y, Math.min(size, y + rows)); yield; }
    }
  }
  const norm = 0.5 * (1 + 0.55 + 0.55 ** 2 + 0.55 ** 3), data = new Uint8Array(N * 4);
  for (let y = 0; y < size; y += rows) { noiseFill(data, f[0], f[1], norm, size, y, Math.min(size, y + rows)); yield; }
  for (let y = 0; y < size; y += rows) { noiseShift(data, size, y, Math.min(size, y + rows)); yield; }
  const tex = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  // trilinear + anisotropic: no mip seams (rings around the camera) on the grazing cloud deck
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.magFilter = THREE.LinearFilter; tex.minFilter = THREE.LinearMipmapLinearFilter; tex.anisotropy = 4;
  tex.generateMipmaps = true; tex.colorSpace = THREE.NoColorSpace; tex.needsUpdate = true;
  return tex;
}

const STRIDE = 12;   // iPos(4) iData(4) iNrm(3) tier(1)

function genCumulus(o, rng, push) {
  const [ex, ez] = o.extent, cx0 = o.center[0], cz0 = o.center[2];
  const spots = o.at ? o.at.map((a) => ({ x: a[0], y: a[1], z: a[2], w: a[3] })) : [];
  for (let i = 0, tries = 0; !o.at && i < o.count && tries < o.count * 30; tries++) {
    const w = o.size[0] + (o.size[1] - o.size[0]) * rng() ** 1.6;
    const x = cx0 + (rng() - 0.5) * ex, z = cz0 + (rng() - 0.5) * ez, y = o.altitude + (rng() - 0.5) * o.altitudeJitter;
    if (o.filter && !o.filter(x, y, z, w)) continue;
    spots.push({ x, y, z, w }); i++;
  }
  for (const s of spots) {
    const W = s.w ?? o.size[1], H = W * o.height * (0.75 + 0.5 * rng());
    const towers = [{ x: 0, z: 0, r: W * 0.5, h: H }];
    for (let t = 1 + Math.floor(rng() * 3); t > 0; t--) {
      const a = rng() * 6.283, d = W * (0.22 + 0.3 * rng());
      towers.push({ x: Math.cos(a) * d, z: Math.sin(a) * d, r: W * (0.28 + 0.2 * rng()), h: H * (0.35 + 0.45 * rng()) });
    }
    for (let j = 0; j < o.puffs; j++) {
      const t = towers[rng() < 0.45 ? 0 : Math.floor(rng() * towers.length)];
      const f = rng() ** 1.25, a = rng() * 6.283, rr = t.r * (1 - 0.62 * f ** 1.4) * Math.sqrt(rng());
      const size = W * (0.3 - 0.13 * f) * (0.8 + 0.4 * rng());
      const px = t.x + Math.cos(a) * rr, pz = t.z + Math.sin(a) * rr, py = f * t.h + size * 0.5;
      let nx = px / (W * 0.62), ny = (py - H * 0.38) / (H * 0.62), nz = pz / (W * 0.62);
      const l = Math.hypot(nx, ny, nz); if (l > 1) { nx /= l; ny /= l; nz /= l; }
      push(s.x + px, s.y + py, s.z + pz, size, rng(), 0.22 * (1 - f), 1, s.y, nx, ny, nz, 0);
    }
  }
}

// tileable height field: a few plane waves with whole-number periods across the tile
function waveField(rng, ex, ez) {
  const waves = [];
  for (let i = 0; i < 7; i++) { const k = Math.floor(rng() * 4) * (rng() < 0.5 ? -1 : 1), l = 1 + Math.floor(rng() * 4); waves.push({ k, l, a: 1 / (Math.abs(k) + l), p: rng() * 6.283 }); }
  const norm = waves.reduce((s, w) => s + w.a, 0);
  return (x, z) => { let h = 0; for (const w of waves) h += w.a * Math.sin(6.283185 * (w.k * x / ex + w.l * z / ez) + w.p); return h / norm; };
}

function genSea(o, rng, push) {
  const [ex, ez] = o.extent, sp = o.spacing, nx = Math.max(2, Math.round(ex / sp)), nz = Math.max(2, Math.round(ez / sp));
  const hf = waveField(rng, ex, ez);
  for (let iz = 0; iz < nz; iz++) for (let ix = 0; ix < nx; ix++) {
    const x = (ix + 0.5 + (rng() - 0.5) * 0.9) / nx * ex - ex / 2, z = (iz + 0.5 + (rng() - 0.5) * 0.9) / nz * ez - ez / 2;
    const h = hf(x, z), bump = Math.max(0, h) ** 1.5;
    const size = sp * (0.72 + 0.62 * rng() ** 1.5) * (1 + 0.45 * bump);
    const y = o.altitude - size * 0.55 + h * o.relief + (rng() - 0.5) * sp * 0.25;
    const e = sp * 0.5, gx = (hf(x + e, z) - hf(x - e, z)) / (2 * e) * o.relief, gz = (hf(x, z + e) - hf(x, z - e)) / (2 * e) * o.relief;
    const gl = Math.hypot(gx, 1, gz) / 0.8;
    push(x, y, z, size, rng(), 0.22 * Math.max(0, 0.4 - h), 1, -1e6, -gx / gl, 1 / gl, -gz / gl, 0);
    if (h > 0.34 && rng() < o.towers) {            // a turret boiling up out of the deck
      const n = 1 + Math.floor(rng() * 2.4); let ty = y + size * 0.5, ts = size * 0.8;
      for (let j = 0; j < n; j++) { ty += ts * 0.6; ts *= 0.82; push(x + (rng() - 0.5) * ts * 0.7, ty, z + (rng() - 0.5) * ts * 0.7, ts, rng(), 0, 1, -1e6, (rng() - 0.5) * 0.5, 0.75, (rng() - 0.5) * 0.5, 0); }
    }
  }
  // far ring: fewer, larger puffs on their own bigger tile, so the sea keeps a lumpy silhouette out to the haze
  if (o.farRing) {
    const F = o.farExtent, fs = sp * o.farSpacing, n = Math.max(2, Math.round(F / fs)), hf2 = waveField(rng, F, F);
    const floor = o.altitude - sp * (0.6 + o.deckDrop);
    for (let iz = 0; iz < n; iz++) for (let ix = 0; ix < n; ix++) {
      const x = (ix + 0.5 + (rng() - 0.5) * 0.95) / n * F - F / 2, z = (iz + 0.5 + (rng() - 0.5) * 0.95) / n * F - F / 2;
      const h = hf2(x, z), s0 = rng(), seed = rng(), jit = rng();
      if (h < -0.42) continue;                      // leave broad hollows in the far sea
      const size = fs * (0.42 + 0.5 * s0 ** 1.8) * (1 + 0.45 * Math.max(0, h));
      const y = floor - size * 0.34 + (0.5 + 0.5 * h) * size * 0.5 + (jit - 0.5) * sp * 0.3;
      const e = fs * 0.5, gx = (hf2(x + e, z) - hf2(x - e, z)) / (2 * e) * size, gz = (hf2(x, z + e) - hf2(x, z - e)) / (2 * e) * size;
      const gl = Math.hypot(gx, 1, gz) / 0.8;
      push(x, y, z, size, seed, 0.12 * Math.max(0, 0.3 - h), 1, floor - size * 0.25, -gx / gl, 1 / gl, -gz / gl, 1);
    }
  }
}

const _lightK = (s) => 0.3 + 0.7 * Math.min(1, s.lightIntensity / 2.2);
const _shadeFloor = (s) => 0.2 + 0.06 * Math.min(3, s.lightIntensity);
// the sky's clear horizon colour towards (sign 1) or away from (sign -1) its sun; v is a scratch vector
function skyHaze(s, sign, out, v) {
  const d = s.sunDirection, h = Math.hypot(d.x, d.z) || 1;
  return s.colorAt(v.set((d.x / h) * sign, 0.03, (d.z / h) * sign).normalize(), out);
}

// makeCloudFieldAsync(opts, ctx.yield) is the same field with the bake of its noise texture done in short steps that hand the page
// back in between (same result, same random draws): `const clouds = await makeCloudFieldAsync({ ... }, ctx.yield);`
// With a noiseTexture given there is nothing to bake and it never hands back.
// A noiseTexture given must be ANOTHER CLOUD FIELD's own .noiseTexture (the baked lobes, to share one bake in a world).
// Never a sky's .noiseTexture: that one is white noise for the dome and sprays every puff with dots.
export function makeCloudField(opts = {}) { const it = cloudFieldSteps(opts); let r; while (!(r = it.next()).done); return r.value; }
export async function makeCloudFieldAsync(opts = {}, yieldFn) {
  const it = cloudFieldSteps(opts); let r;
  while (!(r = it.next()).done) if (yieldFn) await yieldFn();
  return r.value;
}
// The work as a generator, written once for both: its only yields are those of the bake (see noiseSteps).
function* cloudFieldSteps(opts) {
  const sea = opts.mode === 'sea';
  const o = {
    mode: 'cumulus', sky: null, center: [0, 0, 0], extent: sea ? [2000, 2000] : [1800, 1800], altitude: sea ? 0 : 220, altitudeJitter: 90,
    count: 9, size: [150, 330], height: 0.72, puffs: 48, spacing: 92, relief: 55, towers: 0.3, at: null, filter: null, avoid: null,
    wind: sea ? [2.5, 0, 1] : [1.5, 0, 0.6], wrap: sea, opacity: sea ? 0.85 : 0.8, silver: 1, noiseTexture: null,
    erode: 0.95, softness: 0.36, bump: 0.8, detail: 2.1, crisp: 1, depth: 1, nearFade: [0.35, 1.5], farFade: null, fogFade: 0.75,
    deck: sea, deckRadius: 3600, deckDrop: 0.1, hazeColor: null, farRing: sea, farSpacing: 2.7, farExtent: null, sort: true,
    sunDirection: [0.4, 0.6, -0.5], sunColor: '#fff2dc', litColor: '#f6f2ea', shadeColor: '#7d8eac', bottomColor: null,
    ...opts,
  };
  // one value is drawn from the caller's rng whatever the options are
  const rng = o.rng ? (o.rng.fork ? o.rng.fork('clouds') : o.rng) : fallbackRng();
  const ext = Math.max(o.extent[0], o.extent[1]);
  if (!o.farExtent) o.farExtent = Math.max(ext * 1.6, Math.min(o.deckRadius * 1.56, 5600));
  const data = [];
  const push = (x, y, z, size, seed, occ, alpha, base, nx, ny, nz, tier) => { data.push(x, y, z, size, seed, occ, alpha * o.opacity, base, nx, ny, nz, tier); };
  if (sea) genSea(o, rng, push); else genCumulus(o, rng, push);
  const count = data.length / STRIDE;
  const src = new Float32Array(data), dst = new Float32Array(src);

  const far = o.farFade || [ext * (sea ? 0.28 : 1.6), ext * (sea ? 0.47 : 2.1)];
  const F = o.farExtent, far2 = [far[0] * 0.72, far[1] * 0.96, F * 0.33, F * 0.48];
  const hazeFixed = o.hazeColor ? toColor(o.hazeColor) : toColor(o.litColor).lerp(toColor(o.shadeColor), 0.45);
  const shared = {
    uTime: { value: 0 }, uDrift: { value: new THREE.Vector3() }, uSunDir: { value: toDir(o.sunDirection) }, uSunColor: { value: toColor(o.sunColor) },
    uLit: { value: toColor(o.litColor) }, uShade: { value: toColor(o.shadeColor) }, uBottom: { value: toColor(o.bottomColor || o.shadeColor).multiplyScalar(o.bottomColor ? 1 : 0.78) },
    uSilver: { value: o.silver }, uFogFade: { value: o.fogFade }, uNoise: { value: o.noiseTexture || (yield* noiseSteps(rng)) }, uLight: { value: new THREE.Vector2(0.3, 0) },
    uHazeSun: { value: hazeFixed.clone() }, uHazeAway: { value: hazeFixed.clone() }, uHazeDir: { value: toDir(o.sunDirection) },
    // azimuth power, use these colours instead of scene fog's (0/1), start and end of the sea's own distance haze
    uHazeP: { value: new THREE.Vector4(4, o.hazeColor ? 1 : 0, sea ? Math.min(far[0], o.deckRadius * 0.3) : 1e9, sea ? o.deckRadius * 0.78 : 2e9) },
  };
  const avoid = (o.avoid || []).slice(0, MAX_AVOID);
  const uniforms = THREE.UniformsUtils.merge([THREE.UniformsLib.fog, {
    uWrap: { value: new THREE.Vector4(o.extent[0], o.extent[1], F, F) }, uFade: { value: new THREE.Vector4(o.nearFade[0], o.nearFade[1], far[0], far[1]) },
    uFade2: { value: new THREE.Vector4(far2[0], far2[1], far2[2], far2[3]) },
    uShape: { value: new THREE.Vector4(o.erode, o.softness, o.bump, o.detail) }, uShape2: { value: new THREE.Vector2(o.crisp, o.depth) },
  }]);
  if (avoid.length) {
    // [x, y, z, r] = sphere; [x, yTop, z, rTop, yBottom, rBottom] = upright cone frustum (a peak, or an island keel)
    uniforms.uAvoidA = { value: avoid.map((a) => new THREE.Vector4(a[0], a[1], a[2], a[3])) };
    uniforms.uAvoidB = { value: avoid.map((a) => (a.length > 4 ? new THREE.Vector4(a[4], a[5] ?? 0, 1, 0) : new THREE.Vector4(0, 0, 0, 0))) };
  }
  Object.assign(uniforms, shared);            // shared uniform objects are referenced, not cloned

  const quad = new THREE.PlaneGeometry(1, 1);
  const geo = new THREE.InstancedBufferGeometry();
  geo.index = quad.index; geo.setAttribute('position', quad.attributes.position); geo.setAttribute('uv', quad.attributes.uv);
  const ib = new THREE.InstancedInterleavedBuffer(dst, STRIDE, 1); ib.setUsage(THREE.DynamicDrawUsage);
  geo.setAttribute('iPos', new THREE.InterleavedBufferAttribute(ib, 4, 0));
  geo.setAttribute('iData', new THREE.InterleavedBufferAttribute(ib, 4, 4));
  geo.setAttribute('iNrm', new THREE.InterleavedBufferAttribute(ib, 4, 8));
  geo.instanceCount = count;
  const defines = { AVOID: avoid.length };
  if (o.wrap) defines.WRAP = 1;
  if (o.depth > 0) defines.IMPOSTOR = 1;
  const material = new THREE.ShaderMaterial({
    name: 'KitCloudPuffs', uniforms, vertexShader: PUFF_VERT, fragmentShader: PUFF_FRAG, defines,
    transparent: true, depthWrite: false, fog: true, toneMapped: false,
  });
  const puffs = new THREE.Mesh(geo, material);
  puffs.frustumCulled = false; puffs.renderOrder = o.renderOrder ?? 2; puffs.name = 'cloudPuffs';
  const object = new THREE.Group(); object.name = 'cloudField';

  let deck = null;
  if (o.deck) {
    const R = o.deckRadius, sc = 1 / (o.spacing * 22);
    const du = THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { uRadius: { value: R }, uScale: { value: sc }, uBump: { value: o.relief * sc * 7 } }]);
    Object.assign(du, shared);
    const dm = new THREE.ShaderMaterial({ name: 'KitCloudDeck', uniforms: du, vertexShader: DECK_VERT, fragmentShader: DECK_FRAG, transparent: true, depthWrite: false, fog: true, toneMapped: false });
    const dg = new THREE.CircleGeometry(R, 48); dg.rotateX(-Math.PI / 2); dg.rotateY(0.0371);
    deck = new THREE.Mesh(dg, dm); deck.frustumCulled = false; deck.renderOrder = (o.renderOrder ?? 2) - 1; deck.name = 'cloudDeck';
    deck.position.y = o.altitude - o.spacing * (0.6 + o.deckDrop);
    object.add(deck);
  }
  object.add(puffs);

  const BUCKETS = 1024, heads = new Int32Array(BUCKETS), next = new Int32Array(count), keys = new Float32Array(count);
  const drift = shared.uDrift.value, tmpA = new THREE.Color(), tmpB = new THREE.Color(), tmpV = new THREE.Vector3();
  const field = {
    object, puffs, deck, material, uniforms, noiseTexture: shared.uNoise.value, count, triangles: count * 2 + (deck ? 48 : 0), mode: sea ? 'sea' : 'cumulus',
    // take sun direction, cloud colours and horizon haze from a sky (or a blend of two skies, t = 0..1). Allocation-free.
    match(a, b = null, t = 0) {
      const blend = b && t > 0;
      shared.uSunDir.value.copy(a.keyDirection); shared.uLit.value.copy(a.cloudLit); shared.uShade.value.copy(a.cloudShade);
      shared.uSunColor.value.copy(a.keyColor).multiplyScalar(_lightK(a));
      shared.uLight.value.x = _shadeFloor(a);
      if (blend) {
        shared.uSunDir.value.lerp(b.keyDirection, t).normalize(); shared.uLit.value.lerp(b.cloudLit, t); shared.uShade.value.lerp(b.cloudShade, t);
        shared.uSunColor.value.lerp(tmpA.copy(b.keyColor).multiplyScalar(_lightK(b)), t);
        shared.uLight.value.x += (_shadeFloor(b) - shared.uLight.value.x) * t;
      }
      if (!o.bottomColor) shared.uBottom.value.copy(shared.uShade.value).multiplyScalar(0.78);
      if (!o.hazeColor) {
        const P = shared.uHazeP.value;
        skyHaze(a, 1, shared.uHazeSun.value, tmpV); skyHaze(a, -1, shared.uHazeAway.value, tmpV); shared.uHazeDir.value.copy(a.sunDirection);
        P.x = a.options.scatterPow; P.y = 1;
        if (blend) {
          shared.uHazeSun.value.lerp(skyHaze(b, 1, tmpA, tmpV), t); shared.uHazeAway.value.lerp(skyHaze(b, -1, tmpB, tmpV), t);
          shared.uHazeDir.value.lerp(b.sunDirection, t).normalize(); P.x += (b.options.scatterPow - P.x) * t;
        }
      }
      return field;
    },
    update(dt, time, camera) {
      shared.uTime.value = time;
      drift.set(o.wind[0] * time, o.wind[1] * time, o.wind[2] * time);
      if (!camera) return;
      const e = camera.matrixWorld.elements, cx = e[12], cy = e[13], cz = e[14], fx = -e[8], fy = -e[9], fz = -e[10];
      if (deck) deck.position.set(cx + 0.713, deck.position.y, cz + 0.419);   // off-centre: no vertex exactly on the camera plane
      if (!o.sort || !count) return;
      const wx = o.extent[0], wz = o.extent[1], ox = object.position.x + drift.x, oy = object.position.y + drift.y, oz = object.position.z + drift.z;
      let lo = Infinity, hi = -Infinity;
      for (let i = 0, p = 0; i < count; i++, p += STRIDE) {
        let x = src[p] + ox - cx, z = src[p + 2] + oz - cz;
        if (o.wrap) { if (src[p + 11] > 0.5) { x -= Math.floor(x / F + 0.5) * F; z -= Math.floor(z / F + 0.5) * F; } else { x -= Math.floor(x / wx + 0.5) * wx; z -= Math.floor(z / wz + 0.5) * wz; } }
        const d = x * fx + (src[p + 1] + oy - cy) * fy + z * fz;
        keys[i] = d; if (d < lo) lo = d; if (d > hi) hi = d;
      }
      heads.fill(-1);
      const sc = (BUCKETS - 1) / Math.max(1e-3, hi - lo);
      for (let i = 0; i < count; i++) { const b = ((keys[i] - lo) * sc) | 0; next[i] = heads[b]; heads[b] = i; }
      let w = 0;
      for (let b = BUCKETS - 1; b >= 0; b--) for (let i = heads[b]; i >= 0; i = next[i]) { const p = i * STRIDE; for (let k = 0; k < STRIDE; k++) dst[w + k] = src[p + k]; w += STRIDE; }
      ib.needsUpdate = true;
    },
  };
  if (o.sky) field.match(o.sky);
  return field;
}

// ---------------------------------------------------------------------------------------------
// makeLightRig: hemisphere + directional light matched to a sky
// ---------------------------------------------------------------------------------------------
export function makeLightRig(sky, opts = {}) {
  const o = { intensity: 1, ambient: 1, shadow: false, shadowSize: 2048, shadowRange: 180, distance: 500, follow: true, flash: 2.5, bounce: 0, ...opts };
  const object = new THREE.Group(); object.name = 'lightRig';
  const hemi = new THREE.HemisphereLight(sky.ambientColor.clone(), addColor(sky.groundColor.clone(), sky.horizonColor, o.bounce), sky.ambientIntensity * o.ambient);
  const sun = new THREE.DirectionalLight(sky.lightColor.clone(), sky.lightIntensity * o.intensity);
  const dir = sky.lightDirection.clone();
  sun.position.copy(dir).multiplyScalar(o.distance);
  object.add(hemi, sun, sun.target);
  if (o.shadow) {
    sun.castShadow = true; sun.shadow.mapSize.set(o.shadowSize, o.shadowSize);
    const c = sun.shadow.camera, r = o.shadowRange; c.left = -r; c.right = r; c.top = r; c.bottom = -r; c.near = 1; c.far = o.distance * 2; c.updateProjectionMatrix();
    sun.shadow.bias = -0.0004; sun.shadow.normalBias = (r * 2 / o.shadowSize) * 2.5;
  }
  let baseHemi = hemi.intensity, baseSun = sun.intensity, flashSky = sky;
  const fwd = new THREE.Vector3(), tmp = new THREE.Color();
  const rig = {
    object, hemi, sun, direction: dir,
    // re-colour from a sky, or from a blend of two skies (t = 0..1)
    match(a, b = null, t = 0) {
      hemi.color.copy(a.ambientColor); addColor(hemi.groundColor.copy(a.groundColor), a.horizonColor, o.bounce); sun.color.copy(a.lightColor); dir.copy(a.lightDirection);
      baseHemi = a.ambientIntensity * o.ambient; baseSun = a.lightIntensity * o.intensity; flashSky = a;
      if (b && t > 0) {
        hemi.color.lerp(b.ambientColor, t); hemi.groundColor.lerp(addColor(tmp.copy(b.groundColor), b.horizonColor, o.bounce), t); sun.color.lerp(b.lightColor, t); dir.lerp(b.lightDirection, t).normalize();
        baseHemi += (b.ambientIntensity * o.ambient - baseHemi) * t; baseSun += (b.lightIntensity * o.intensity - baseSun) * t; if (t > 0.5) flashSky = b;
      }
      hemi.intensity = baseHemi; sun.intensity = baseSun;
      return rig;
    },
    update(dt, time, camera) {
      const f = flashSky.flash || 0;
      hemi.intensity = baseHemi * (1 + f * o.flash); sun.intensity = baseSun;
      if (camera && o.follow) {
        camera.getWorldDirection(fwd);
        const t = sun.target.position.copy(camera.position).addScaledVector(fwd, o.shadow ? o.shadowRange * 0.6 : 0);
        if (o.shadow) { const s = (o.shadowRange * 2 / o.shadowSize) * 8; t.set(Math.round(t.x / s) * s, Math.round(t.y / s) * s, Math.round(t.z / s) * s); }
        sun.position.copy(t).addScaledVector(dir, o.distance);
      } else sun.position.copy(sun.target.position).addScaledVector(dir, o.distance);
    },
  };
  return rig;
}
