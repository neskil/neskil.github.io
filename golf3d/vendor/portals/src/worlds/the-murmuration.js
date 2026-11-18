// THE MURMURATION
// The last minutes of light over a flooded fen, flown as one starling among a hundred thousand.
// A silhouette picture: every solid thing is near-black ink with a hairline rim, all colour lives in
// the sky and in the floodwater that mirrors it (analytic sky reflection + y-flipped ink copies of
// the flock, reeds, willows and windpump drawn onto the water).
//
// Frame: the hero's local frame is the world frame. Flight runs along -Z from z = +390 to the portal
// at (0, 40, -390); the sun is dead ahead at -Z; north (windpump side) is +X.
//
// Looks by seed / ctx.vary.hour: sunset (default), cold pink dawn (sun rising), silver overcast
// (no disc, pewter flood), afterglow (sun just gone, stars), each optionally in hard winter (ice
// margins, frosted reeds). Cast swaps: peregrine / sparrowhawk / harrier, swans / cormorants.
// Rare event (ctx.vary.rare): a second flock arrives from the north and passes through the first.
import * as THREE from 'three';
import { makePath, makeRng, hashSeed, clamp, lerp, smoothstep } from '../kit/core.js';
import { buildHero } from '../parts/the-murmuration.js';

const INK = '#0E0B12';
const LOOKS = {
  sunset: {
    zen: '#2A2350', mag: '#7A3B78', cor: '#E85A5A', halo: '#FF9A45', core: '#FFE08A', mist: '#B8687E', cloudDark: '#3b2a55',
    sunI: 9, sunEl: [1.25, -0.3], cover: 0.5, street: 0.9, star: 0.35, moon: 1, mistD: 0.0045, portal: '#FFE08A',
    exposure: 1.0, sat: 1.08, title: 'The Murmuration',
  },
  dawn: {
    zen: '#3d4f86', mag: '#a983b8', cor: '#f59aa6', halo: '#ffbf9c', core: '#fff1cf', mist: '#dba9bd', cloudDark: '#5a5f8c',
    sunI: 8, sunEl: [-0.25, 1.3], cover: 0.42, street: 1.0, star: 0.25, moon: 0.8, mistD: 0.007, portal: '#ffe6c4',
    exposure: 1.0, sat: 1.0, title: 'The Murmuration at First Light',
  },
  overcast: {
    zen: '#59607a', mag: '#8c93a8', cor: '#c3c6d0', halo: '#e9dcb8', core: '#fff4d0', mist: '#aeb2c2', cloudDark: '#4d5368',
    sunI: 0, sunEl: [2.2, 1.2], cover: 1.02, street: 0.5, star: 0, moon: 0, mistD: 0.008, portal: '#fff0c4',
    exposure: 1.05, sat: 0.92, title: 'The Murmuration under Silver',
  },
  afterglow: {
    zen: '#141636', mag: '#43295f', cor: '#b8455d', halo: '#f57f3a', core: '#ffc56c', mist: '#8f587c', cloudDark: '#1f1a3a',
    sunI: 8, sunEl: [-1.3, -2.4], cover: 0.4, street: 0.9, star: 1.9, moon: 1.6, mistD: 0.005, portal: '#ffc56c',
    exposure: 1.12, sat: 1.1, title: 'The Murmuration, Afterglow',
  },
};

// ---------------------------------------------------------------------------------------------
// shared GLSL
// ---------------------------------------------------------------------------------------------
const NOISE_GLSL = /* glsl */`
float h21(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(h21(i), h21(i + vec2(1., 0.)), f.x), mix(h21(i + vec2(0., 1.)), h21(i + vec2(1., 1.)), f.x), f.y); }
float fbm(vec2 p){ return .5 * vn(p) + .25 * vn(p * 2.03 + 7.1) + .125 * vn(p * 4.1 + 13.7) + .0625 * vn(p * 8.3 + 3.3); }
`;

// where the water is: < 0 on water, > 0 on land. p = world (x, z). Twin of fenSD() in JS below.
const FEN_GLSL = /* glsl */`
uniform vec4 uFenS, uFenD;
uniform vec3 uIsl[5];   // reed islets in the flood: x, z, radius
float fenSD(vec2 p){
  float wob = 22. * sin(p.x * .011 + uFenS.x) + 14. * sin(p.y * .017 + uFenS.y) + 7. * sin((p.x + p.y) * .043 + uFenS.z) + 3. * sin((p.x - p.y) * .11 + uFenS.w);
  vec2 d = abs(p - vec2(0., -170.)) - vec2(340., 330.);
  float sd = length(max(d, 0.)) + min(max(d.x, d.y), 0.) - 80. + wob;
  float fl = sd;
  sd = min(sd, max(abs(p.x) - 3.2, 200. - p.y));
  sd = min(sd, max(abs(p.y - uFenD.x - 10. * sin(p.x * .012)) - 3., 250. - p.x));
  sd = min(sd, max(abs(p.y - uFenD.y + .25 * (p.x + 250.)) - 3., p.x + 250.));
  float dt = abs(mod(p.x * uFenD.z + p.y * uFenD.w + 4000., 260.) - 130.) - 1.7;
  sd = min(sd, max(dt, 70. - fl));
  sd = min(sd, length((p - vec2(760., -980.)) * vec2(1., .55)) - 250. + 2. * wob);
  sd = min(sd, length((p - vec2(-820., -1250.)) * vec2(.5, 1.)) - 170. + 2. * wob);
  float hf = 7. * sin((p.x + p.y) * .043 + uFenS.z) + 3. * sin((p.x - p.y) * .11 + uFenS.w);
  sd = max(sd, 4.5 - length((p - vec2(31., -200.)) * vec2(.7, 1.)) + .25 * hf);
  for (int i = 0; i < 5; i++) sd = max(sd, uIsl[i].z - length((p - uIsl[i].xy) * vec2(1., .4)) + .5 * hf);
  return sd;
}
`;

const SKY_GLSL = /* glsl */`
uniform vec3 uSunDir, uMoonDir, uStarDir;
uniform vec3 cZen, cMag, cCor, cHalo, cCore, cCloudDark, uHazeCol, uHazeWarm;
uniform vec4 uSkyP;   // sun disc radius (deg), sun intensity, cloud coverage, street contrast
uniform vec4 uSkyQ;   // time, star brightness, moon brightness, glow strength
vec3 skyColor(vec3 d, float disc){
  float e = asin(clamp(d.y, 0., 1.)) * 57.2958;
  vec2 sxz = normalize(uSunDir.xz);
  float sw = pow(.5 + .5 * dot(normalize(d.xz + 1e-5), sxz), 3.);
  vec3 low = mix(mix(cMag, cZen, .4), cCor, sw);
  vec3 c = mix(low, cMag, smoothstep(4., 30., e));
  c = mix(c, cZen, smoothstep(22., 66., e));
  c = mix(c, cHalo, sw * sw * (1. - smoothstep(0., 12., e)) * .8);
  float cs = dot(d, uSunDir);
  float sd = acos(clamp(cs, -1., 1.)) * 57.2958;
  c += (cHalo * .5 * exp(-sd / 10.) + cCore * .8 * exp(-sd / 2.8)) * uSkyQ.w;
  // horizon haze: meets the far ground exactly
  c = mix(c, mix(uHazeCol, uHazeWarm, pow(max(dot(normalize(d.xz + 1e-5), sxz), 0.), 3.)), exp(-e * 1.25));
  // the sun
  float dk = smoothstep(uSkyP.x, uSkyP.x * .9, sd);
  c = mix(c, mix(cHalo, cCore, smoothstep(-uSkyP.x, uSkyP.x, (d.y - uSunDir.y) * 57.3)) * uSkyP.y, dk * disc * step(.01, uSkyP.y));
  if (d.y > .0) {
    // one bright star, a few faint ones late, a hairline moon
    float st = exp(-(1. - dot(d, uStarDir)) * 5e5) * (.8 + .2 * sin(uSkyQ.x * 5.));
    vec3 g = d * 190.; vec3 gi = floor(g);
    float hs = h21(gi.xy + gi.z * 17.3);
    float fs = step(.9975, hs) * exp(-dot(fract(g) - .5, fract(g) - .5) * 30.) * (.6 + .4 * sin(uSkyQ.x * 3. + hs * 400.));
    c += vec3(1., .95, .86) * (st * 5. * uSkyQ.y + fs * 2.2 * max(uSkyQ.y - 1., 0.) * smoothstep(8., 30., e));
    if (dot(d, uMoonDir) > .99) {
      vec3 mx = normalize(cross(vec3(0., 1., 0.), uMoonDir)), my = cross(uMoonDir, mx);
      vec2 v = vec2(dot(d, mx), dot(d, my)) / .017;
      float cr = smoothstep(1., .9, length(v)) * (1. - smoothstep(1., .9, length(v - vec2(.2, .14))));
      c += cCore * cr * 3.2 * uSkyQ.z;
    }
    // cloud streets running toward the sun, lit from below
    vec2 p = d.xz / (d.y + .075);
    float t = uSkyQ.x;
    float ac = p.x + .32 * sin(p.y * .33 + 1.7);
    float street = .5 + .5 * cos(ac * 1.75 + 1.3 * vn(vec2(p.y * .22, 3.7)));
    float lump = fbm(vec2(ac * 3.1, p.y * 1.5 + t * .016));
    float den = lump + (street - .5) * uSkyP.w + uSkyP.z - .96;
    float a = smoothstep(0., .2, den) * smoothstep(.0, .13, d.y) * .92;
    vec3 lit = mix(cMag * .95, cCor * 1.15, exp(-sd / 36.)) + cHalo * .85 * exp(-sd / 13.);
    vec3 cc = mix(lit, cCloudDark, smoothstep(.1, .52, den));
    c = mix(c, cc, a * (1. - .55 * dk * disc));
  }
  return c;
}
`;

const ATMOS_GLSL = /* glsl */`
uniform vec3 uMistCol, uMistWarm;
uniform vec4 uAtm;   // mist density, mist scale height, fog density, unused
vec3 atmos(vec3 col, vec3 P, vec3 C, vec3 sunDir, vec3 hazeCol, vec3 hazeWarm){
  vec3 v = P - C; float D = length(v); vec3 dir = v / max(D, 1e-3);
  float sw = pow(max(dot(normalize(dir.xz + 1e-5), normalize(sunDir.xz)), 0.), 3.);
  float h = uAtm.y, y0 = max(C.y, 0.), y1 = max(P.y, 0.), dy = abs(y1 - y0);
  float od = dy > .05 ? h * abs(exp(-y0 / h) - exp(-y1 / h)) / dy : exp(-y0 / h);
  float m = 1. - exp(-uAtm.x * max(D - 14., 0.) * od);
  col = mix(col, mix(uMistCol, uMistWarm, sw), m);
  float f = 1. - exp(-pow(D * uAtm.z, 2.));
  return mix(col, mix(hazeCol, hazeWarm, sw), f);
}
`;

// ---------------------------------------------------------------------------------------------
// the fen: one plane that is both the black land and the mirror flood
// ---------------------------------------------------------------------------------------------
const FEN_VERT = /* glsl */`
varying vec3 vW;
void main(){ vec4 w = modelMatrix * vec4(position, 1.); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }
`;
const FEN_FRAG = /* glsl */`
varying vec3 vW;
uniform float uTime, uWinter;
uniform vec3 uInk, uDeep, uWeed;
uniform vec4 uSwan[2];     // crossing point xz, velocity xz
uniform vec2 uSwanT;       // seconds since the crossing, beat rate
uniform vec3 uPunt;        // x, z, wake strength
uniform vec3 uPortal, uPortalCol, uMirInk;
${NOISE_GLSL}
${FEN_GLSL}
${SKY_GLSL}
${ATMOS_GLSL}
void main(){
  vec3 v = vW - cameraPosition; float D = length(v); vec3 V = v / D;
  vec2 p = vW.xz;
  float sd = fenSD(p);
  float fw = max(fwidth(sd), .02);
  float water = 1. - smoothstep(-fw, fw, sd);
  float fp = D * .0027 / max(-V.y, .03);            // pixel footprint along the view, metres
  float dyke = smoothstep(205., 230., p.y) * (1. - smoothstep(3.4, 4., abs(p.x)));
  // the land is a patchwork of fields between the drains: plough, stubble, wet pasture. Low ground
  // holds slivers of sky in the furrows and a few broad pools.
  vec2 fuv = vec2(p.x * uFenD.z + p.y * uFenD.w - 30., p.y * uFenD.z - p.x * uFenD.w) / vec2(260., 190.);
  vec2 cell = floor(fuv);
  float hid = h21(cell + 7.3), hid2 = h21(cell * 1.7 + 31.1);
  float fm = hid < .5 ? fuv.x * 260. : fuv.y * 190.;
  float furV = 1. - smoothstep(1.2, 4.5, fp);
  float fur = sin(fm * 1.26 + 2. * vn(p * .03));
  float tone = mix(.6, 3.4, hid2) * (1. + .85 * fur * furV * step(.3, hid2));
  if (sd > 8.) {
    float wet = smoothstep(.52, .68, vn(p * .0042 + uFenS.xy)) * smoothstep(8., 26., sd) * step(.25, hid);
    float fine = smoothstep(.45, .8, fur * .5 + .5 + .9 * (vn(p * .08) - .5));
    float coarse = smoothstep(.5, .62, vn(p * .017 + 3.1 + hid));
    float broad = smoothstep(.6, .66, vn(p * .011 + uFenS.zw));
    water = max(water, max(wet * mix(coarse * .8, fine, furV), wet * broad));
  }
  vec3 col;
  if (water > .001) {
    float t = uTime;
    float paws = .35 + .65 * smoothstep(.3, .7, vn(p * .013 + vec2(t * .02, -t * .013)));
    vec2 sl = vec2(0.);
    sl += vec2(.80, .60) * cos(dot(p, vec2(.80, .60)) * 1.9 + t * 1.5) * .016 * (1. - smoothstep(.4, 2.5, fp));
    sl += vec2(-.50, .87) * cos(dot(p, vec2(-.50, .87)) * 3.1 - t * 2.1 + 1.) * .014 * (1. - smoothstep(.25, 1.6, fp));
    sl += vec2(.95, -.30) * cos(dot(p, vec2(.95, -.30)) * 5.3 + t * 2.9 + 2.) * .011 * (1. - smoothstep(.15, .9, fp));
    sl += vec2(.20, .98) * cos(dot(p, vec2(.20, .98)) * .55 + t * .7 + 4.) * .012 * (1. - smoothstep(1.5, 9., fp));
    sl += vec2(-.90, .43) * cos(dot(p, vec2(-.90, .43)) * .23 - t * .45) * .008;
    sl *= paws;
    float rough = paws * smoothstep(.3, 3., fp);        // wave energy lost to distance comes back as sparkle
    // swans' wingtips ring the water along their track
    for (int i = 0; i < 2; i++) {
      vec2 vel = uSwan[i].zw; float sp = length(vel); vec2 dn = vel / sp;
      vec2 rel = p - uSwan[i].xy;
      float al = dot(rel, dn), lat = dot(rel, vec2(-dn.y, dn.x));
      if (abs(lat) < 14. && sp > .1) {
        float lam = sp / uSwanT.y;
        float k0 = floor(al / lam + .5);
        for (int j = -1; j <= 1; j++) {
          float sk = (k0 + float(j)) * lam;
          float age = uSwanT.x - sk / sp;
          if (age > 0. && age < 9.) {
            vec2 r2 = vec2(al - sk, abs(lat) - 1.25);
            float r = length(r2) + 1e-3, rr = r - age * .85;
            float ring = sin(rr * 8.) * exp(-rr * rr * 2.2) * exp(-age * .5) * min(age * 4., 1.);
            vec2 dr = r2 / r; dr.y *= sign(lat);
            sl += (dn * dr.x + vec2(-dn.y, dn.x) * dr.y) * ring * .1;
          }
        }
      }
    }
    // the punt's V wake
    float bh = p.y - uPunt.y, lt = p.x - uPunt.x;
    if (bh > -1. && bh < 90. && abs(lt) < 12.) {
      float arm = abs(lt) - max(bh, 0.) * .3 - .4;
      float w = sin(arm * 7. - t * 2.) * exp(-arm * arm * 1.6) * exp(-bh * .05) * smoothstep(-1., 1.5, bh);
      sl.x += sign(lt) * w * .09 * uPunt.z;
      sl.y += sin(bh * 3.2 + t * 2.) * exp(-bh * .09) * smoothstep(0., -1., arm) * .03 * uPunt.z;
    }
    vec3 N = normalize(vec3(-sl.x, 1., -sl.y));
    vec3 R0 = reflect(V, N);
    vec3 R = R0; R.y = abs(R.y) * .4 + .002; R = normalize(R);     // the mirror favours the bright low sky
    vec3 refl = skyColor(R, 1.);
    // glitter column under the sun where the ripples are too fine to resolve
    vec2 sxz = normalize(uSunDir.xz);
    float azd = 1. - dot(normalize(R.xz), sxz);
    float colm = exp(-azd * 900.) * exp(-max(R.y - uSunDir.y, 0.) * 9.) * step(.01, uSkyP.y) * smoothstep(-.06, .0, uSunDir.y);
    float spk = pow(vn(p * vec2(1.3, .35) + vec2(t * .9, -t * .6)) * vn(p * .37 - t * .2), 2.) * 5.;
    refl += cCore * uSkyP.y * .4 * (1. - .55 * dyke) * colm * spk * (.25 + rough);
    // the reed wall and the bank behind it stand black in the mirror along every shore
    if (sd > -45. && sd < .5) {
      vec2 gr = vec2(fenSD(p + vec2(.6, 0.)) - sd, fenSD(p + vec2(0., .6)) - sd);
      float ca = dot(normalize(R0.xz + 1e-5), normalize(gr + 1e-6));
      if (ca > .03) {
        float hh = -sd / ca * R0.y / max(length(R0.xz), 1e-3);
        refl = mix(refl, uMirInk, (1. - smoothstep(1.5, 2.7 + .5 * vn(p * 1.3), hh)) * .94);
      }
    }
    vec3 pl = uPortal - vW; float pd = length(pl);
    float pe = clamp(1.3 * pd * pd / 49., 20., 5000.);
    refl += uPortalCol * 2.2 * pow(max(dot(R0, pl / pd), 0.), pe);
    float fr = mix(.72, .97, pow(1. - max(dot(-V, N), 0.), 2.5));
    col = refl * fr + uDeep * (1. - fr);
    // duckweed dulls the dyke
    if (dyke > 0.) {
      float bl = smoothstep(.42, .6, fbm(p * .8 + vec2(0., t * .01)) + (abs(p.x) - 1.9) * .13);
      col = mix(col, uWeed + refl * .1, bl * .82 * dyke * (1. - .7 * smoothstep(1.6, .2, abs(lt)) * step(0., bh) * step(bh, 30.)));
    }
    // hard winter: matt ice along every margin
    if (uWinter > 0.) {
      float ice = smoothstep(-13., -4., sd + 7. * vn(p * .09)) * uWinter;
      vec3 matt = cCor * .3 + cMag * .3 + cZen * .14;
      matt = mix(matt, vec3(dot(matt, vec3(.33))), .55) * (.5 + .25 * vn(p * 1.7) + .35 * smoothstep(.7, .8, vn(p * .6)) + .3 * fbm(p * .2));
      col = mix(col, matt + refl * .12, ice * .9);
    }
  }
  vec3 land = uInk * tone * (1. + 1.1 * vn(p * .31)) + uWinter * vec3(.035, .035, .05) * vn(p * 2.3);
  col = mix(land, col, water);
  col = atmos(col, vW, cameraPosition, uSunDir, uHazeCol, uHazeWarm);
  gl_FragColor = vec4(col, 1.);
}
`;

const SKY_VERT = /* glsl */`
varying vec3 vD;
void main(){ vD = position; vec4 mv = viewMatrix * vec4(position * 100. + cameraPosition, 1.); gl_Position = projectionMatrix * mv; if (abs(gl_Position.w) < 1e-4) gl_Position.w = 1e-4; gl_Position.z = gl_Position.w; }
`;
const SKY_FRAG = /* glsl */`
varying vec3 vD;
${NOISE_GLSL}
${SKY_GLSL}
void main(){ gl_FragColor = vec4(skyColor(normalize(vD), 1.), 1.); }
`;

// ---------------------------------------------------------------------------------------------
// ink: every solid thing. One shader, real and mirrored (y-flipped, drawn onto the water).
// ---------------------------------------------------------------------------------------------
const INK_PARS = /* glsl */`
uniform float uTime, uMirror;
uniform vec3 uSunDir;
varying vec3 vW; varying float vRim;
`;
const INK_VERT = /* glsl */`
attribute float aSway, aEdge;
${INK_PARS}
void main(){
  vec4 w = modelMatrix * vec4(position, 1.);
  vec3 n = dot(normal, normal) > .5 ? normalize(mat3(modelMatrix) * normal) : vec3(0., 1., 0.);
  float g = sin(uTime * 1.3 + w.x * .21 + w.z * .17) * .6 + sin(uTime * 2.9 + w.x * .5) * .25
          + smoothstep(.5, 1., sin(dot(w.xz, vec2(.035, .05)) - uTime * .8)) * 1.4;
  w.xz += vec2(.07, .045) * g * aSway;
  float dist = length(w.xyz - cameraPosition);
  w.y += aEdge * max(.012, dist * .0019);                 // wires keep ~1.5 px
  vec3 V = normalize(cameraPosition - w.xyz);
  vRim = pow(1. - abs(dot(n, V)), 3.) * smoothstep(-.3, .7, dot(n, uSunDir) + n.y * .6) * step(.5, dot(normal, normal));
  if (uMirror < 0.) { w.x += sin(w.y * 1.9 + uTime * 1.6 + w.z * .4) * .05 * min(w.y, 3.); w.y = -w.y; }
  vW = w.xyz;
  gl_Position = projectionMatrix * viewMatrix * w;
}
`;
const INK_FRAG = /* glsl */`
${INK_PARS}
uniform vec3 uInk, uRim, uHazeCol, uHazeWarm;
uniform float uRimK;
${ATMOS_GLSL}
#ifdef MIRROR
${FEN_GLSL}
#endif
void main(){
  vec3 P = vW;
  #ifdef MIRROR
    vec3 c = cameraPosition;
    vec3 xs = mix(c, P, clamp(c.y / max(c.y - P.y, 1e-3), 0., 1.));
    if (fenSD(xs.xz) > 0.) discard;
    P.y = -P.y;
  #endif
  vec3 col = uInk + uRim * vRim * uRimK;
  gl_FragColor = vec4(atmos(col, P, cameraPosition, uSunDir, uHazeCol, uHazeWarm), 1.);
}
`;

// reeds: instanced alpha-cut cards bowing in travelling gust fronts
const REED_VERT = /* glsl */`
attribute vec4 iPos;    // x, z, height, yaw
attribute vec4 iVar;    // atlas column, phase, width, lean
${INK_PARS}
varying vec2 vUv;
void main(){
  float cy = cos(iPos.w), sy = sin(iPos.w);
  vec3 q = vec3(position.x * iVar.z, position.y * iPos.z, 0.);
  vec3 w = vec3(iPos.x + q.x * cy, q.y, iPos.y + q.x * sy);
  float k = position.y * position.y;
  float front = smoothstep(.35, 1., sin(dot(w.xz, vec2(.045, .06)) - uTime * .9 + .6 * sin(w.x * .02)));
  float bend = (.25 + 1.5 * front + .22 * sin(uTime * 4.3 + iVar.y * 40. + w.x)) * iPos.z * .22;
  w.xz += vec2(.75, .5) * bend * k + vec2(-sy, cy) * iVar.w * k;
  w.y -= bend * bend * k * .12;
  vRim = 0.;
  if (uMirror < 0.) { w.x += sin(w.y * 2.3 + uTime * 1.6 + w.z * .4) * .04 * min(w.y, 2.); w.y = -w.y; }
  vW = w;
  vUv = vec2((uv.x + iVar.x) * .25, uv.y);
  gl_Position = projectionMatrix * viewMatrix * vec4(w, 1.);
}
`;
const REED_FRAG = /* glsl */`
${INK_PARS}
varying vec2 vUv;
uniform sampler2D uMap;
uniform vec3 uInk, uRim, uHazeCol, uHazeWarm;
uniform float uRimK;
${ATMOS_GLSL}
#ifdef MIRROR
${FEN_GLSL}
#endif
void main(){
  vec4 tx = texture2D(uMap, vUv);
  if (tx.r < .45) discard;
  vec3 P = vW;
  #ifdef MIRROR
    vec3 c = cameraPosition;
    vec3 xs = mix(c, P, clamp(c.y / max(c.y - P.y, 1e-3), 0., 1.));
    if (fenSD(xs.xz) > 0.) discard;
    P.y = -P.y;
  #endif
  vec3 col = uInk + uRim * tx.g * uRimK;
  gl_FragColor = vec4(atmos(col, P, cameraPosition, uSunDir, uHazeCol, uHazeWarm), 1.);
}
`;

// big birds, bats and the wire-sitters: instanced flappers
const FLAP_VERT = /* glsl */`
attribute vec2 aWN;                  // signed span fraction, neck weight
attribute vec3 iPos, iVel;
attribute vec4 iWob, iPar, iPar2, iK;  // wobble xyz + freq | half-span, flap Hz, phase, neck | amp, dihedral, roll, glide | clock mode, t0, wrap period, sits
attribute vec2 iShow;
${INK_PARS}
uniform float uT, uU, uMinS;
void main(){
  float ph = iPar.z;
  float tt = mix(uTime + iK.y, max(uT - iK.y, 0.), iK.x);
  float tw = iK.z > 0. ? mod(tt + .5 * iK.z, iK.z) - .5 * iK.z : tt;
  vec3 wf = vec3(1., 1.31, .73) * iWob.w;
  vec3 wa = uTime * wf + ph * vec3(6.3, 11.1, 17.7);
  vec3 c = iPos + iVel * tw + iWob.xyz * sin(wa);
  vec3 vel = iVel + iWob.xyz * wf * cos(wa);
  float sit = iK.w * step(tt, 0.);
  vec3 f = normalize(vel + vec3(1e-4, 0., -1e-3));
  vec3 r = normalize(cross(f, vec3(0., 1., 0.)));
  vec3 up = cross(r, f);
  float roll = iPar2.z * sin(uTime * .7 + ph * 9.);
  r = r * cos(roll) + up * sin(roll); up = cross(r, f);
  float dist = length(c - cameraPosition);
  float S = max(iPar.x * (1. + 2. * smoothstep(120., 700., dist)), dist * uMinS);
  float fl = uTime * 6.2832 * iPar.y + ph * 40.;
  float gl = iPar2.w * smoothstep(.3, .7, sin(uTime * .9 + ph * 23.));
  float A = iPar2.x * (1. - gl) * (1. - sit);
  float s = abs(aWN.x), wing = step(.01, s);
  float a1 = iPar2.y + A * sin(fl), a2 = iPar2.y * .4 + A * 1.25 * sin(fl - 1.);
  vec3 q = position;
  q.z -= aWN.y * iPar.w;
  q.y += (sin(a1) * min(s, .5) + sin(a2) * max(s - .5, 0.)) * wing - .07 * sin(fl) * A * (1. - wing);
  q.x *= mix(1., (.8 + .2 * cos(a1)) * (1. - .75 * sit), wing);
  vec3 w = c + (r * q.x + up * q.y - f * q.z) * S;
  if (uU < iShow.x || uU > iShow.y) w = vec3(0., -500., 0.);
  vRim = 0.;
  if (uMirror < 0.) w.y = -w.y;
  vW = w;
  gl_Position = projectionMatrix * viewMatrix * vec4(w, 1.);
}
`;

// low mist banks: soft camera-facing sheets lying on the water
const MIST_VERT = /* glsl */`
attribute vec4 iPos;   // x, y, z, phase
attribute vec2 iSize;
uniform float uTime;
varying vec2 vUv; varying float vA; varying float vSun; varying float vPh;
uniform vec3 uSunDir;
void main(){
  vec3 c = iPos.xyz;
  c.x += sin(uTime * .05 + iPos.w * 6.) * 14. + uTime * .25;
  c.z += cos(uTime * .04 + iPos.w * 9.) * 10.;
  vec3 to = c - cameraPosition; float d = length(to);
  vec3 rt = normalize(vec3(-to.z, 0., to.x));
  vec3 w = c + rt * position.x * iSize.x + vec3(0., position.y * iSize.y, 0.);
  vUv = uv; vPh = iPos.w;
  float el = abs(to.y) / max(d, 1.);
  vA = smoothstep(18., 70., d) * (1. - smoothstep(900., 1500., d)) * (1. - smoothstep(.1, .3, el));
  vSun = pow(max(dot(normalize(to.xz), normalize(uSunDir.xz)), 0.), 3.);
  gl_Position = projectionMatrix * viewMatrix * vec4(w, 1.);
}
`;
const MIST_FRAG = /* glsl */`
varying vec2 vUv; varying float vA; varying float vSun; varying float vPh;
uniform vec3 uMistCol, uMistWarm; uniform float uTime, uOp;
${NOISE_GLSL}
void main(){
  float x = vUv.x * 2. - 1.;
  float body = (1. - x * x) * (1. - x * x);
  float y = vUv.y;
  float n = fbm(vec2(vUv.x * 5. + vPh * 30. + uTime * .03, y * 1.5 + vPh * 7.));
  float prof = smoothstep(0., .12, y) * (1. - smoothstep(.25 + .5 * n, .5 + .5 * n, y));
  float a = body * prof * (.45 + .55 * n) * vA * uOp;
  if (a < .003) discard;
  gl_FragColor = vec4(mix(uMistCol, uMistWarm, vSun), a);
}
`;

// midges: backlit sparks dancing over the reeds
const MIDGE_VERT = /* glsl */`
attribute vec4 aSeed;
uniform float uTime, uPx;
varying float vA;
void main(){
  vec3 p = position;
  float t = uTime;
  p += vec3(sin(t * (1.1 + aSeed.x) + aSeed.y * 40.), sin(t * (1.7 + aSeed.z) + aSeed.x * 30.) * .6, cos(t * (.9 + aSeed.w) + aSeed.z * 50.)) * (.5 + aSeed.w);
  p.x += sin(t * .23 + aSeed.y * 9.) * 1.5;
  vec4 mv = viewMatrix * vec4(p, 1.);
  gl_Position = projectionMatrix * mv;
  float d = max(-mv.z, .3);
  gl_PointSize = clamp(uPx * (.035 + .03 * aSeed.x) / d, 1., 5.);
  vA = (.35 + .65 * step(.5, sin(t * 9. * (.5 + aSeed.y) + aSeed.z * 60.))) * smoothstep(.6, 2.5, d) * (1. - smoothstep(60., 140., d));
}
`;
const MIDGE_FRAG = /* glsl */`
varying float vA; uniform vec3 uCol;
void main(){ vec2 q = gl_PointCoord - .5; float a = smoothstep(.5, .1, length(q)) * vA; if (a < .01) discard; gl_FragColor = vec4(uCol * a, 1.); }
`;

// ---------------------------------------------------------------------------------------------
// geometry helpers
// ---------------------------------------------------------------------------------------------
class Ink {
  constructor() { this.p = []; this.s = []; this.e = []; this.flat = []; }
  tri(a, b, c, sa = 0, sb = 0, sc = 0, flat = 0) {
    this.p.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2]); this.s.push(sa, sb, sc); this.e.push(0, 0, 0); this.flat.push(flat, flat, flat);
  }
  quad(a, b, c, d, sa = 0, sb = 0, sc = 0, sd = 0, flat = 0) { this.tri(a, b, c, sa, sb, sc, flat); this.tri(a, c, d, sa, sc, sd, flat); }
  // tapered tube from a to b
  cyl(a, b, ra, rb, n = 6, sa = 0, sb = 0) {
    const d = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], l = Math.hypot(d[0], d[1], d[2]) || 1;
    d[0] /= l; d[1] /= l; d[2] /= l;
    let u = Math.abs(d[1]) > 0.9 ? [1, 0, 0] : [0, 1, 0];
    const v = [d[1] * u[2] - d[2] * u[1], d[2] * u[0] - d[0] * u[2], d[0] * u[1] - d[1] * u[0]];
    const vl = Math.hypot(v[0], v[1], v[2]); v[0] /= vl; v[1] /= vl; v[2] /= vl;
    u = [v[1] * d[2] - v[2] * d[1], v[2] * d[0] - v[0] * d[2], v[0] * d[1] - v[1] * d[0]];
    const ring = (c, r, k) => { const an = (k / n) * Math.PI * 2, cs = Math.cos(an) * r, sn = Math.sin(an) * r; return [c[0] + u[0] * cs + v[0] * sn, c[1] + u[1] * cs + v[1] * sn, c[2] + u[2] * cs + v[2] * sn]; };
    for (let k = 0; k < n; k++) {
      const a0 = ring(a, ra, k), a1 = ring(a, ra, k + 1), b0 = ring(b, rb, k), b1 = ring(b, rb, k + 1);
      this.tri(a0, a1, b1, sa, sa, sb);
      if (rb > 1e-4) this.tri(a0, b1, b0, sa, sb, sb);
    }
  }
  box(cx, cy, cz, sx, sy, sz, yaw = 0) {
    const c = Math.cos(yaw), s = Math.sin(yaw), P = (x, y, z) => [cx + x * c + z * s, cy + y, cz - x * s + z * c];
    const hx = sx / 2, hy = sy / 2, hz = sz / 2;
    const v = [P(-hx, -hy, -hz), P(hx, -hy, -hz), P(hx, hy, -hz), P(-hx, hy, -hz), P(-hx, -hy, hz), P(hx, -hy, hz), P(hx, hy, hz), P(-hx, hy, hz)];
    for (const f of [[0, 3, 2, 1], [4, 5, 6, 7], [0, 1, 5, 4], [3, 7, 6, 2], [0, 4, 7, 3], [1, 2, 6, 5]]) this.quad(v[f[0]], v[f[1]], v[f[2]], v[f[3]]);
  }
  // a wire: vertical ribbon whose half-height is set in the shader (aEdge)
  wire(a, b, sag, seg = 6) {
    let prev = null;
    for (let i = 0; i <= seg; i++) {
      const t = i / seg, y = lerp(a[1], b[1], t) - sag * 4 * t * (1 - t);
      const cur = [lerp(a[0], b[0], t), y, lerp(a[2], b[2], t)];
      if (prev) {
        const n = this.p.length / 3;
        this.quad(prev, cur, cur, prev, 0, 0, 0, 0, 1);
        const E = [-1, -1, 1, -1, 1, 1];
        for (let k = 0; k < 6; k++) this.e[n + k] = E[k];
      }
      prev = cur;
    }
  }
  geometry() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3));
    g.computeVertexNormals();
    const nr = g.getAttribute('normal');
    for (let i = 0; i < this.flat.length; i++) if (this.flat[i]) nr.setXYZ(i, 0, 0, 0);
    g.setAttribute('aSway', new THREE.Float32BufferAttribute(this.s, 1));
    g.setAttribute('aEdge', new THREE.Float32BufferAttribute(this.e, 1));
    return g;
  }
  // geometry() in steps, for the one large set (the static silhouettes): three's own normals, 2048 triangles at a time.
  // With no index a triangle's normals come from its own nine numbers alone, so the pieces equal the whole bit for bit.
  async geometrySteps(ctx) {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3));
    const pos = g.getAttribute('position').array, nr = new THREE.BufferAttribute(new Float32Array(pos.length), 3), STEP = 2048 * 9;
    g.setAttribute('normal', nr);
    await ctx.yield();
    for (let o = 0; o < pos.length; o += STEP) {
      const t = new THREE.BufferGeometry();
      t.setAttribute('position', new THREE.BufferAttribute(pos.subarray(o, o + STEP), 3));
      t.computeVertexNormals();
      nr.array.set(t.getAttribute('normal').array, o);
      await ctx.yield();
    }
    nr.needsUpdate = true;
    for (let i = 0; i < this.flat.length; i++) if (this.flat[i]) nr.setXYZ(i, 0, 0, 0);
    await ctx.yield();
    g.setAttribute('aSway', new THREE.Float32BufferAttribute(this.s, 1));
    await ctx.yield();
    g.setAttribute('aEdge', new THREE.Float32BufferAttribute(this.e, 1));
    return g;
  }
}

// one flapper: nose toward -Z, half-span = 1 unit along X
function flapperGeometry() {
  const p = [], wn = [];
  const tri = (a, b, c, wa = [0, 0], wb = [0, 0], wc = [0, 0]) => { p.push(...a, ...b, ...c); wn.push(...wa, ...wb, ...wc); };
  const N = [0, 0.01, -0.36], T = [0, 0.0, 0.42];
  const ring = [[0, 0.09, 0], [0.11, 0, 0], [0, -0.09, 0], [-0.11, 0, 0]];
  for (let i = 0; i < 4; i++) { const j = (i + 1) % 4; tri(N, ring[j], ring[i]); tri(T, ring[i], ring[j]); }
  // tail fan
  tri([0, 0, 0.3], [0.1, 0, 0.56], [-0.1, 0, 0.56]);
  // neck and head: slides forward by the neck length
  const nk = [[0, 0.05, -0.3], [0.04, 0, -0.3], [0, -0.04, -0.3], [-0.04, 0, -0.3]];
  const hd = [[0, 0.05, -0.36], [0.045, 0.01, -0.36], [0, -0.03, -0.36], [-0.045, 0.01, -0.36]];
  for (let i = 0; i < 4; i++) {
    const j = (i + 1) % 4;
    tri(nk[i], nk[j], hd[j], [0, 0], [0, 0], [0, 1]); tri(nk[i], hd[j], hd[i], [0, 0], [0, 1], [0, 1]);
    tri(hd[i], hd[j], [0, 0, -0.5], [0, 1], [0, 1], [0, 1]);
  }
  // wings: inner panel and a pointed hand
  for (const s of [-1, 1]) {
    const r0 = [0.08 * s, 0.02, -0.17], r1 = [0.08 * s, 0.02, 0.15], w0 = [0.5 * s, 0.02, -0.2], w1 = [0.5 * s, 0.02, 0.13];
    const t0 = [1.0 * s, 0.02, -0.02], t1 = [0.8 * s, 0.02, 0.16];
    tri(r0, w0, w1, [0.02 * s, 0], [0.5 * s, 0], [0.5 * s, 0]); tri(r0, w1, r1, [0.02 * s, 0], [0.5 * s, 0], [0.02 * s, 0]);
    tri(w0, t0, t1, [0.5 * s, 0], [1 * s, 0], [0.8 * s, 0]); tri(w0, t1, w1, [0.5 * s, 0], [0.8 * s, 0], [0.5 * s, 0]);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3));
  g.setAttribute('aWN', new THREE.Float32BufferAttribute(wn, 2));
  return g;
}

// the reed atlas: four clumps side by side. R = cut-out, G = seed heads that catch the rim light
function reedAtlas(rng) {
  const W = 1024, H = 256, cv = document.createElement('canvas');
  cv.width = W; cv.height = H;
  const g = cv.getContext('2d');
  g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
  g.lineCap = 'round';
  for (let col = 0; col < 4; col++) {
    const x0 = col * 256, bul = col === 3;
    const n = bul ? 13 : col === 2 ? 14 : 24;
    for (let i = 0; i < n; i++) {
      const bx = x0 + 40 + rng() * 176, h = (bul ? 0.5 : 0.62) + rng() * (bul ? 0.3 : 0.36), lean = (rng() - 0.5) * 50;
      const tx = clamp(bx + lean, x0 + 14, x0 + 242), ty = H - h * H;
      g.strokeStyle = '#ff0000'; g.lineWidth = 1.3 + rng() * 1.1;
      g.beginPath(); g.moveTo(bx, H); g.quadraticCurveTo(bx + lean * 0.2, H - h * H * 0.6, tx, ty); g.stroke();
      // blades
      for (let k = 0; k < 2; k++) {
        const t = 0.25 + rng() * 0.5, px = lerp(bx, tx, t * t), py = H - h * H * t, dir = rng() < 0.5 ? -1 : 1, len = 18 + rng() * 26;
        g.lineWidth = 1 + rng() * 0.7;
        g.beginPath(); g.moveTo(px, py); g.quadraticCurveTo(px + dir * len * 0.6, py - len * 0.7, clamp(px + dir * len, x0 + 6, x0 + 250), py - len * 0.25 + rng() * 14); g.stroke();
      }
      if (bul) {            // bulrush spike
        g.strokeStyle = '#ff5000'; g.lineWidth = 6.5;
        g.beginPath(); g.moveTo(tx, ty + 8); g.lineTo(tx - lean * 0.06, ty + 34); g.stroke();
        g.strokeStyle = '#ff0000'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(tx, ty + 8); g.lineTo(tx + lean * 0.03, ty - 6); g.stroke();
      } else {              // feathery seed head, drooping downwind
        const d = rng() < 0.7 ? 1 : -1;
        for (let k = 0; k < 9; k++) {
          const t = k / 8, hx = clamp(tx + d * (t * t * 22 + rng() * 5), x0 + 4, x0 + 252), hy = ty + t * 12 - (1 - t) * 14 + rng() * 5;
          g.strokeStyle = `rgb(255,${120 + Math.floor(rng() * 135)},0)`; g.lineWidth = 1.4 + 2.6 * Math.sin(Math.PI * Math.min(1, t + 0.15));
          g.beginPath(); g.moveTo(hx, hy); g.lineTo(hx + d * 5, hy + 5); g.stroke();
        }
      }
    }
  }
  const tex = new THREE.CanvasTexture(cv);
  tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping; tex.generateMipmaps = false;
  tex.minFilter = THREE.LinearFilter; tex.magFilter = THREE.LinearFilter;
  return tex;
}

function glowTexture() {
  const cv = document.createElement('canvas'); cv.width = cv.height = 64;
  const g = cv.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.18, 'rgba(255,255,255,0.55)'); gr.addColorStop(0.5, 'rgba(255,255,255,0.12)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(cv);
}

function makeFenSD(S, Dk, isl) {
  return (x, z) => {
    const wob = 22 * Math.sin(x * 0.011 + S.x) + 14 * Math.sin(z * 0.017 + S.y) + 7 * Math.sin((x + z) * 0.043 + S.z) + 3 * Math.sin((x - z) * 0.11 + S.w);
    const dx = Math.abs(x) - 340, dz = Math.abs(z + 170) - 330;
    let sd = Math.hypot(Math.max(dx, 0), Math.max(dz, 0)) + Math.min(Math.max(dx, dz), 0) - 80 + wob;
    sd = Math.min(sd, Math.max(Math.abs(x) - 3.2, 200 - z));
    sd = Math.min(sd, Math.max(Math.abs(z - Dk.x - 10 * Math.sin(x * 0.012)) - 3, 250 - x));
    sd = Math.min(sd, Math.max(Math.abs(z - Dk.y + 0.25 * (x + 250)) - 3, x + 250));
    const hf = 7 * Math.sin((x + z) * 0.043 + S.z) + 3 * Math.sin((x - z) * 0.11 + S.w);
    sd = Math.max(sd, 4.5 - Math.hypot((x - 31) * 0.7, z + 200) + 0.25 * hf);
    for (const il of isl) sd = Math.max(sd, il.z - Math.hypot(x - il.x, (z - il.y) * 0.4) + 0.5 * hf);
    return sd;
  };
}

const lin = (hex) => new THREE.Color(hex);
const mixc = (a, b, t) => a.clone().lerp(b, t);

// ---------------------------------------------------------------------------------------------
export default {
  id: 'the-murmuration',
  name: 'The Murmuration',
  category: 'sky',
  weirdness: 0.08,
  media: ['air'],
  async build(ctx) {
    const { rng } = ctx;
    const vary = ctx.vary || { hour: 'any', rare: false, density: 1, mood: 0.5 };
    const density = clamp(vary.density ?? 1, 0.7, 1.3);
    const detail = clamp(ctx.quality?.detail ?? 1, 0.4, 1);
    const scene = new THREE.Scene();
    const disposables = [];

    // ---- which evening is it ----------------------------------------------------------------
    const vr = rng.fork('look');
    const roll = vr();
    let lookId = roll < 0.42 ? 'sunset' : roll < 0.66 ? 'dawn' : roll < 0.84 ? 'overcast' : 'afterglow';
    if (vary.hour === 'dawn') lookId = 'dawn';
    else if (vary.hour === 'golden') lookId = 'sunset';
    else if (vary.hour === 'day') lookId = 'overcast';
    else if (vary.hour === 'night') lookId = 'afterglow';
    const look = LOOKS[lookId];
    const winter = vr.chance(lookId === 'dawn' ? 0.5 : 0.3);
    const raptor = vr.pick(['peregrine', 'peregrine', 'sparrowhawk', 'harrier']);
    const cormorants = vr.chance(0.35);
    const rare = !!vary.rare;
    const hueJit = vr.range(-0.012, 0.012);
    const C = {};
    for (const k of ['zen', 'mag', 'cor', 'halo', 'core', 'mist', 'cloudDark']) { C[k] = lin(look[k]); C[k].offsetHSL(hueJit, 0, 0); }
    const ink = lin(INK);
    if (lookId !== 'overcast') C.zen.multiplyScalar(1.5);
    const hazeWarm = mixc(C.cor, C.halo, 0.55).multiplyScalar(0.92);
    const hazeCol = mixc(mixc(C.mag, C.zen, 0.35), C.mist, 0.35).multiplyScalar(lookId === 'dawn' ? 0.52 : 0.8);
    const mistWarm = mixc(C.mist, C.halo, 0.62);
    const rimCol = winter ? mixc(C.core, lin('#ffffff'), 0.5) : C.halo.clone();

    const sunDir = new THREE.Vector3(0, 0.02, -1).normalize();
    const d2r = Math.PI / 180;
    const moonDir = new THREE.Vector3(Math.sin(-15 * d2r) * Math.cos(15 * d2r), Math.sin(15 * d2r), -Math.cos(15 * d2r) * Math.cos(15 * d2r)).normalize();
    const starAz = vr.range(18, 34) * d2r, starEl = vr.range(30, 42) * d2r;
    const starDir = new THREE.Vector3(Math.sin(starAz) * Math.cos(starEl), Math.sin(starEl), -Math.cos(starAz) * Math.cos(starEl));
    const fenS = new THREE.Vector4(vr.range(0, 6.28), vr.range(0, 6.28), vr.range(0, 6.28), vr.range(0, 6.28));
    const dAng = vr.range(0.2, 1.3);
    const fenD = new THREE.Vector4(vr.range(-150, 40), vr.range(-200, 80), Math.cos(dAng), Math.sin(dAng));
    // reed islets standing in the flood beside the flight line: the mid layer of the second half
    const ir = makeRng(hashSeed('isles:' + ctx.seed));
    const isles = [];
    for (let i = 0, tries = 0; i < 5 && tries < 200; tries++) {
      const wx = i < 2 ? ir.range(250, 430) : ir.range(470, 720), side = (i % 2 ? 1 : -1) * (ir.chance(0.8) ? 1 : -1);
      const il = new THREE.Vector3(side * ir.range(48, 150), 390 - wx, ir.range(8, 13));
      if (Math.hypot(il.x - 31, il.y + 200) < 60) continue;
      if (isles.some((o) => Math.hypot(o.x - il.x, o.y - il.y) < 70)) continue;
      isles.push(il); i++;
    }
    while (isles.length < 5) isles.push(new THREE.Vector3(0, 5000, 1));
    const fenSD = makeFenSD(fenS, fenD, isles);

    // shared uniform objects (one value, many materials)
    const U = {
      uTime: { value: 0 }, uSunDir: { value: sunDir }, uMoonDir: { value: moonDir }, uStarDir: { value: starDir },
      cZen: { value: C.zen }, cMag: { value: C.mag }, cCor: { value: C.cor.clone() }, cHalo: { value: C.halo }, cCore: { value: C.core },
      cCloudDark: { value: C.cloudDark }, uHazeCol: { value: hazeCol }, uHazeWarm: { value: hazeWarm },
      uSkyP: { value: new THREE.Vector4(1.5, look.sunI, look.cover + vr.range(-0.05, 0.05), look.street) },
      uSkyQ: { value: new THREE.Vector4(0, look.star, look.moon, 1) },
      uMistCol: { value: C.mist }, uMistWarm: { value: mistWarm },
      uAtm: { value: new THREE.Vector4(look.mistD * 1.6 * (winter ? 1.25 : 1), 2.6, 0.0003, 0) },
      uFenS: { value: fenS }, uFenD: { value: fenD }, uIsl: { value: isles }, uMinS: { value: 0.004 },
      uInk: { value: ink }, uRim: { value: rimCol },
      uT: { value: 0 }, uU: { value: 0 },
    };
    const corBase = C.cor.clone();
    scene.fog = new THREE.FogExp2(mixc(hazeCol, hazeWarm, 0.7), 0.0003);
    // real lights only so that rides and companions added to this scene are lit like the world
    scene.add(new THREE.HemisphereLight(mixc(C.mag, C.cor, 0.5), mixc(C.zen, ink, 0.6), 0.9));
    const sunLight = new THREE.DirectionalLight(C.halo, look.sunI > 0 ? 2.2 : 0.8);
    sunLight.position.set(0, 12, -100); scene.add(sunLight);

    // ---- sky -----------------------------------------------------------------------------------
    const sky = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 3), new THREE.ShaderMaterial({
      uniforms: U, vertexShader: SKY_VERT, fragmentShader: SKY_FRAG, side: THREE.BackSide, depthWrite: false, depthTest: false, fog: false,
    }));
    sky.frustumCulled = false; sky.renderOrder = -1; scene.add(sky);

    // ---- the fen: land and mirror ------------------------------------------------------------------
    const swanSpeed = cormorants ? 17 : 13;
    const swanDir = vr.chance(0.5) ? 1 : -1;
    const SWAN_T = 7.5;   // show second at which the swans cross the dyke mouth, while the camera is still low and level
    const swanU = [0, 1].map((i) => new THREE.Vector4(-swanDir * i * 7, 222 + i * 5, swanDir * swanSpeed, -1.5));
    const fenU = {
      ...U, uWinter: { value: winter ? 1 : 0 }, uDeep: { value: mixc(C.zen, ink, 0.55).multiplyScalar(0.5) }, uWeed: { value: mixc(lin('#1c2a10'), C.mag, 0.15).multiplyScalar(0.6) },
      uSwan: { value: swanU }, uSwanT: { value: new THREE.Vector2(-100, 3) }, uPunt: { value: new THREE.Vector3(2, 322, 1) },
      uPortal: { value: new THREE.Vector3(0, 40, -390) }, uPortalCol: { value: lin(look.portal) }, uMirInk: { value: mixc(ink, C.zen, 0.12) },
    };
    const fenGeo = new THREE.PlaneGeometry(16000, 16000); fenGeo.rotateX(-Math.PI / 2);
    const fen = new THREE.Mesh(fenGeo, new THREE.ShaderMaterial({ uniforms: fenU, vertexShader: FEN_VERT, fragmentShader: FEN_FRAG, fog: false }));
    fen.renderOrder = -0.9; fen.frustumCulled = false; scene.add(fen);
    await ctx.yield();

    // ---- the hero: the flock -------------------------------------------------------------------------
    const hero = await buildHero(ctx, {
      quads: Math.round(36000 * density * detail), darts: Math.round(70000 * density * detail), wingmen: 90,
      sunDir: new THREE.Vector3(0, 0.03, -1), rare, raptor, erupt: lookId === 'dawn',
    });
    scene.add(hero.object);
    const A = hero.anchors;
    const mirrorInk = mixc(ink, C.zen, 0.12);
    const flockMirror = hero.makeMirror(15000, {
      maskGLSL: FEN_GLSL.replace('float fenSD(', 'float mirrorMask('), maskUniforms: { uFenS: U.uFenS, uFenD: U.uFenD, uIsl: U.uIsl }, ink: mirrorInk,
    });
    flockMirror.material.depthTest = false; flockMirror.material.depthWrite = false; flockMirror.renderOrder = -0.8;
    scene.add(flockMirror);
    await ctx.yield();

    // ---- the flight ----------------------------------------------------------------------------------
    // (show second, brief x west, height, north): the hero's bird's-eye line, lowered past the windpump
    const fly = [
      [0, 0, 2.6, 0], [2, 38, 2.6, 0], [4, 76, 2.9, 0], [6, 112, 3.7, 0], [7, 132, 4.4, 1], [8, 152, 6, 2.5], [9, 172, 13, 4], [10.5, 200, 38, 7], [12, 225, 72, 10], [14, 262, 105, 6],
      [16, 298, 160, 0], [17.5, 322, 205, -4], [19, 345, 222, -4], [20.6, 372, 226, -2], [22.2, 400, 215, 0],
      [24, 430, 182, 0], [26.2, 478, 70, 0], [28.5, 530, 22, 0], [31, 585, 25, 0], [32, 610, 34, 0],
      [34, 660, 40, 0], [36, 705, 40, 0], [38, 745, 40, 0], [40, 780, 40, 0],
    ];
    const path = makePath(fly.map((f) => [f[3], f[2], 390 - f[1]]));
    await ctx.yield();
    // show clock as a function of u, so the camera is where the flock expects it
    const NS = 800, tabU = [], tabT = [];
    {
      const pv = new THREE.Vector3(); let k0 = 0;
      for (const f of fly) {
        let best = Infinity, bk = k0;
        for (let k = k0; k <= NS; k++) { path.pointAt(k / NS, pv); const d = (pv.x - f[3]) ** 2 + (pv.y - f[2]) ** 2 + (pv.z - 390 + f[1]) ** 2; if (d < best) { best = d; bk = k; } }
        tabU.push(bk / NS); tabT.push(f[0]); k0 = bk;
        await ctx.yield();
      }
      tabU[0] = 0; tabU[tabU.length - 1] = 1;
    }
    const showT = (u) => {
      if (u <= 0) return 0; if (u >= 1) return 40;
      let i = 1; while (i < tabU.length - 1 && tabU[i] < u) i++;
      const a = tabU[i - 1], b = tabU[i];
      return lerp(tabT[i - 1], tabT[i], b > a ? (u - a) / (b - a) : 0);
    };
    const uAtT = (T) => {
      let i = 1; while (i < tabT.length - 1 && tabT[i] < T) i++;
      return lerp(tabU[i - 1], tabU[i], clamp((T - tabT[i - 1]) / (tabT[i] - tabT[i - 1]), 0, 1));
    };

    // ---- materials for everything solid ------------------------------------------------------------------
    const inkU = { ...U, uMirror: { value: 1 }, uRimK: { value: winter ? 0.55 : 0.4 } };
    const inkMat = new THREE.ShaderMaterial({ uniforms: inkU, vertexShader: INK_VERT, fragmentShader: INK_FRAG, side: THREE.DoubleSide, fog: false });
    const mirU = { ...U, uMirror: { value: -1 }, uRimK: { value: 0 }, uInk: { value: mirrorInk } };
    const mirOpts = { side: THREE.DoubleSide, fog: false, depthTest: false, depthWrite: false, defines: { MIRROR: 1 } };
    const inkMir = new THREE.ShaderMaterial({ uniforms: mirU, vertexShader: INK_VERT, fragmentShader: INK_FRAG, ...mirOpts });
    const addInk = (parent, geo, mirror = true) => {
      const m = new THREE.Mesh(geo, inkMat); m.frustumCulled = false; parent.add(m);
      if (mirror) { const r = new THREE.Mesh(geo, inkMir); r.frustumCulled = false; r.renderOrder = -0.8; parent.add(r); }
      return m;
    };

    // ---- static silhouettes: willows, alders, bridge, causeway and poles, tree line, spire, windpump ----------
    const sr = rng.fork('static');
    const st = new Ink(), far = new Ink();          // far: land silhouettes that never stand over water (no mirror copy)
    const xr = makeRng(hashSeed('extra:' + ctx.seed));
    const willow = (x, z, near) => {
      const h = sr.range(2.0, 2.9), lx = sr.range(-0.3, 0.3), lz = sr.range(-0.3, 0.3), sc = sr.range(0.85, 1.2);
      const top = [x + lx, h, z + lz];
      st.cyl([x, -0.2, z], [x + lx * 0.5, h * 0.55, z + lz * 0.5], 0.42 * sc, 0.33 * sc, 7);
      st.cyl([x + lx * 0.5, h * 0.55, z + lz * 0.5], top, 0.33 * sc, 0.5 * sc, 7);
      st.cyl(top, [top[0], h + 0.55 * sc, top[2]], 0.62 * sc, 0.25 * sc, 7);        // the fist
      const n = Math.round(sr.range(26, 38) * (near ? 1.2 : 0.75));
      for (let i = 0; i < n; i++) {
        const az = sr.range(0, 6.283), tilt = sr.range(0.08, 0.72), len = sr.range(1.8, 3.4) * sc;
        const dx = Math.sin(tilt) * Math.cos(az), dz = Math.sin(tilt) * Math.sin(az), dy = Math.cos(tilt);
        const b = [top[0] + dx * 0.45 * sc, h + 0.25 * sc + dy * 0.2, top[2] + dz * 0.45 * sc];
        const m = [b[0] + dx * len * 0.5, b[1] + dy * len * 0.55, b[2] + dz * len * 0.5];
        const e = [b[0] + dx * len * 0.85, b[1] + len * (dy * 0.55 + 0.45), b[2] + dz * len * 0.85];
        st.cyl(b, m, 0.045, 0.03, 3, 0, 0.45);
        st.cyl(m, e, 0.03, 0.0, 3, 0.45, 1.3);
      }
    };
    const alder = (x, z) => {
      const grow = (a, dir, len, r, depth) => {
        const b = [a[0] + dir[0] * len, a[1] + dir[1] * len, a[2] + dir[2] * len];
        st.cyl(a, b, r, r * 0.62, depth === 0 ? 6 : 3, a[1] * 0.02, b[1] * 0.03 + (3 - depth) * 0.0);
        if (depth >= 4) return;
        const kids = depth === 0 ? 3 : 2 + (sr() < 0.5 ? 1 : 0);
        for (let i = 0; i < kids; i++) {
          const az = sr.range(0, 6.283), sp = sr.range(0.25, 0.7);
          const nd = [dir[0] + Math.cos(az) * sp, dir[1] + 0.15, dir[2] + Math.sin(az) * sp], l = Math.hypot(nd[0], nd[1], nd[2]);
          grow(b, [nd[0] / l, nd[1] / l, nd[2] / l], len * sr.range(0.55, 0.78), r * 0.6, depth + 1);
        }
      };
      grow([x, -0.2, z], [sr.range(-0.08, 0.08), 1, sr.range(-0.08, 0.08)], sr.range(3.2, 4.4), 0.3, 0);
    };
    // pollards line the first dyke's banks, the other dykes and the flood's rim
    const willows = [];
    for (let z = 250; z < 640; z += sr.range(13, 24)) for (const sgn of [-1, 1]) if (sr() < 0.72) willows.push([sgn * sr.range(12.5, 16), z + sr.range(-3, 3)]);
    for (let x = 300; x < 620 && willows.length < 60; x += sr.range(22, 40)) willows.push([x, fenD.x + 10 * Math.sin(x * 0.012) + (sr() < 0.5 ? -8 : 8)]);
    for (let x = -300; x > -560 && willows.length < 68; x -= sr.range(24, 44)) willows.push([x, fenD.y - 0.25 * (x + 250) + (sr() < 0.5 ? -8 : 8)]);
    for (let i = 0, tries = 0; i < 16 && tries < 400; tries++) {
      const x = sr.range(-450, 450), z = sr.range(-640, 260), sd = fenSD(x, z);
      if (sd > 5 && sd < 14 && path.nearestXZ(x, z).dist > 20) { willows.push([x, z]); i++; }
    }
    for (const w of willows) { if (Math.abs(w[0]) < 40 || fenSD(w[0], w[1]) > 1.5) willow(w[0], w[1], Math.abs(w[0]) < 40); await ctx.yield(); }
    for (let i = 0, tries = 0; i < 6 && tries < 300; tries++) {
      const x = sr.range(-460, 460), z = sr.range(-480, 520), sd = fenSD(x, z);
      if (sd > 8 && sd < 22 && Math.abs(x) > 18) { alder(x, z); i++; }
    }
    alder(-19, 301); alder(21, 356);
    await ctx.yield();

    // plank footbridge over the first dyke (the flight passes just over its rail)
    {
      const bz = 280;
      st.box(0, 1.02, bz, 13, 0.14, 1.3);
      for (const dz of [-0.62, 0.62]) {
        for (let x = -6; x <= 6.01; x += 2) { st.cyl([x, -0.3, bz + dz], [x, 2.02, bz + dz], 0.07, 0.06, 4); }
        st.cyl([-6.3, 2.0, bz + dz], [6.3, 2.0, bz + dz], 0.055, 0.055, 4);
        st.cyl([-6.3, 1.5, bz + dz], [6.3, 1.5, bz + dz], 0.035, 0.035, 3);
      }
      for (const sx of [-1, 1]) st.box(sx * 6.6, 0.5, bz, 1.6, 1.1, 1.9);
    }
    // causeway with telegraph poles far to the south
    const CX = -505, wirePts = [];
    {
      // a noisy-topped bank with scrub on both shoulders, not a ruled bar
      let pv = null;
      for (let z = -840; z <= 880; z += 10) {
        const h = 1.05 + 0.5 * ctx.noise.n2(z * 0.013, 7.7) + 0.2 * ctx.noise.n2(z * 0.09, 1.3), o = 1.4 * ctx.noise.n2(z * 0.006, 3.1);
        const c = [[CX - 5.5 + o, -0.2, z], [CX - 2.6 + o * 0.6, h, z], [CX + 2.6 + o * 0.6, h, z], [CX + 5.5 + o, -0.2, z]];
        if (pv) for (let k = 0; k < 3; k++) far.quad(pv[k], pv[k + 1], c[k + 1], c[k]);
        pv = c;
      }
      for (const sx of [-1, 1]) {
        let p0 = null;
        for (let z = -840; z <= 880; z += 5) {
          const gap = ctx.noise.n2(z * 0.011 + sx * 9, 5.5) > 0.38;
          const p1 = gap ? null : [CX + sx * (3.6 + xr.range(-0.4, 0.4)), 0.9 + xr() * 1.7 + (xr() < 0.07 ? xr.range(1.5, 4) : 0), z];
          if (p0 && p1) far.quad([p0[0], 0, p0[2]], [p1[0], 0, p1[2]], p1, p0, 0, 0, 0.6, 0.6, 1);
          p0 = p1;
        }
      }
    }
    {
      let prev = null;
      for (let z = 760; z >= -780; z -= 48) {
        const lean = sr.range(-0.25, 0.25), top = [CX + lean, 9, z];
        st.cyl([CX, 0.3, z], top, 0.17, 0.11, 5);
        // crossarms run along x so the three wires sit side by side
        const pts = [[CX + lean - 1.0, 8.5, z], [CX + lean + 1.0, 8.5, z], [CX + lean - 0.75, 7.8, z]];
        st.box(CX + lean, 8.45, z, 2.3, 0.13, 0.13); st.box(CX + lean, 7.75, z, 1.8, 0.11, 0.11);
        if (prev) for (let k = 0; k < 3; k++) {
          const sag = sr.range(0.5, 0.9);
          st.wire(prev[k], pts[k], sag, 6);
          for (let j = 0; j < 4; j++) { const t = sr(); wirePts.push([lerp(prev[k][0], pts[k][0], t), lerp(prev[k][1], pts[k][1], t) - sag * 4 * t * (1 - t) + 0.07, lerp(prev[k][2], pts[k][2], t)]); }
        }
        prev = pts;
      }
    }
    await ctx.yield();
    // the far tree line (2 km), one spire just left of the sun, a couple of barns
    {
      const R = 2050, cz = -100, N = 560; let ph = 14;
      const tops = [];
      for (let i = 0; i <= N; i++) {
        const a = (i / N) * Math.PI * 2;
        ph = clamp(ph + sr.range(-3.2, 3.2), 5, 24);
        const gap = Math.sin(a * 9 + fenS.x) * Math.sin(a * 23 + fenS.y) > 0.72 ? 0.25 : 1;
        tops.push((ph + (sr() < 0.06 ? sr.range(6, 13) : 0) + 5 * Math.sin(a * 17 + fenS.z)) * gap + 3);
      }
      for (let i = 0; i < N; i++) {
        const a0 = (i / N) * Math.PI * 2, a1 = ((i + 1) / N) * Math.PI * 2;
        const p0 = [Math.sin(a0) * R, 0, cz - Math.cos(a0) * R], p1 = [Math.sin(a1) * R, 0, cz - Math.cos(a1) * R];
        st.quad(p0, p1, [p1[0], tops[i + 1], p1[2]], [p0[0], tops[i], p0[2]], 0, 0, 0, 0, 1);
      }
      const sx = -Math.tan(8 * d2r) * 1900 + sr.range(-30, 30), sz = -1880;
      st.box(sx, 14, sz, 9, 28, 9); st.cyl([sx, 28, sz], [sx, 62, sz], 5.2, 0.0, 4); st.box(sx + 16, 8, sz, 26, 16, 11);
      st.cyl([sx + 3, 16, sz], [sx + 29, 16, sz], 7.6, 7.6, 3);
      for (let i = 0; i < 3; i++) { const bx = sr.range(-900, 900), bz = sr.range(-1500, -900); st.box(bx, 4, bz, 22, 8, 12, sr.range(0, 3)); }
    }
    // the drainage windpump: black weatherboarded smock tower, boat cap, fantail stage
    const PUMP = A.windpump.clone();
    {
      const [px, pz] = [PUMP.x, PUMP.z];
      st.cyl([px, -0.3, pz], [px, 1.2, pz], 3.3, 3.0, 8);
      st.cyl([px, 1.2, pz], [px, 9.6, pz], 2.6, 1.55, 8);
      st.cyl([px, 3.4, pz], [px, 3.6, pz], 3.5, 3.5, 8);                      // stage
      for (let k = 0; k < 8; k++) { const a = k / 8 * 6.283; st.cyl([px + Math.cos(a) * 3.4, 3.6, pz + Math.sin(a) * 3.4], [px + Math.cos(a) * 3.4, 4.5, pz + Math.sin(a) * 3.4], 0.05, 0.05, 3); }
      for (let k = 0; k < 8; k++) { const a = k / 8 * 6.283, b = (k + 1) / 8 * 6.283; st.cyl([px + Math.cos(a) * 3.4, 4.5, pz + Math.sin(a) * 3.4], [px + Math.cos(b) * 3.4, 4.5, pz + Math.sin(b) * 3.4], 0.04, 0.04, 3); }
      st.cyl([px, 9.6, pz], [px, 10.3, pz], 1.9, 1.75, 8);
      st.cyl([px, 10.3, pz - 0.2], [px, 12.0, pz - 0.2], 1.75, 0.25, 8);       // cap
      st.cyl([px, 10.5, pz], [px, 10.5, pz + 2.5], 0.22, 0.2, 6);             // windshaft toward the camera
      st.cyl([px, 10.9, pz - 1.4], [px, 11.6, pz - 4.2], 0.09, 0.07, 4);      // tail pole and fantail
      for (let k = 0; k < 6; k++) { const a = k / 6 * 6.283; st.quad([px, 11.6, pz - 4.2], [px + Math.cos(a) * 0.9, 11.6 + Math.sin(a) * 0.9, pz - 4.2], [px + Math.cos(a + 0.35) * 0.9, 11.6 + Math.sin(a + 0.35) * 0.9, pz - 4.25], [px, 11.6, pz - 4.25], 0, 0, 0, 0, 1); }
      st.cyl([px + 4.2, 0, pz + 1], [px + 4.2, 1.6, pz + 1], 0.9, 0.9, 6);    // scoop-wheel housing
      st.box(px + 3.2, 1.0, pz + 1, 2.4, 2.0, 1.2);
    }
    await ctx.yield();
    // ---- the fill: islet trees, rows of pollards, hedgerows and shelterbelts on the land -----------------
    for (const il of isles) if (il.y < 4000) {
      if (xr() < 0.6) willow(il.x + xr.range(-2, 2), il.y + xr.range(-2, 2), false); else alder(il.x, il.y);
      if (xr() < 0.5) willow(il.x + xr.range(3, 6) * (xr() < 0.5 ? -1 : 1), il.y + xr.range(-4, 4), false);
    }
    const cD = fenD.z, sD = fenD.w;
    for (let r = 0, tries = 0; r < 6 && tries < 300; tries++) {      // rows along the cross drains
      const v = 30 + 260 * Math.round(xr.range(-3, 3)) + (xr() < 0.5 ? -7 : 7); let t = xr.range(-700, 600), placed = 0;
      for (let j = 0; j < 7; j++) {
        t += xr.range(13, 24);
        const x = v * cD - t * sD, z = v * sD + t * cD;
        if (fenSD(x, z) > 80 && Math.hypot(x, z + 140) < 950 && Math.abs(x - CX) > 12) { willow(x, z, false); placed++; }
      }
      if (placed > 2) r++;
      await ctx.yield();
    }
    for (let i = 0, tries = 0; i < 16 && tries < 3000; tries++) {    // the far rim of the flood
      const x = xr.range(-480, 480), z = xr.range(-800, -480), sd = fenSD(x, z);
      if (sd < 5 || sd > 18 || Math.abs(x) < 14) continue;
      if (xr() < 0.75) willow(x, z, false); else alder(x, z);
      i++;
      await ctx.yield();
    }
    await ctx.yield();
    {
      // hedgerows on the field boundaries: noisy-topped strips with the odd hedgerow tree
      const strip = (x0, z0, dx, dz, len) => {
        let prev = null, h = xr.range(2, 4);
        for (let t = 0; t <= len + 0.1; t += 9) {
          const x = x0 + dx * t, z = z0 + dz * t;
          h = clamp(h + xr.range(-1.1, 1.1), 1.6, 5);
          const top = h + (xr() < 0.08 ? xr.range(4, 8) : 0);
          const cur = fenSD(x, z) > 16 && Math.abs(x - CX) > 9 && Math.hypot(x, z + 140) < 1500 ? [x, top, z] : null;
          if (prev && cur) far.quad([prev[0], -0.2, prev[2]], [cur[0], -0.2, cur[2]], cur, prev, 0, 0, 0, 0, 1);
          prev = cur;
        }
      };
      for (let k = -7; k <= 7; k++) for (let j = -5; j < 5; j++) if (xr() < 0.6) {
        const w = 190 * k, t = 30 + 260 * j;
        strip(-w * sD + t * cD, w * cD + t * sD, cD, sD, 260);
        await ctx.yield();
      }
      for (let k = -5; k <= 5; k++) for (let j = -7; j < 7; j++) if (xr() < 0.32) {
        const v = 30 + 260 * k + 5, t = 190 * j;
        strip(v * cD - t * sD, v * sD + t * cD, -sD, cD, 190);
        await ctx.yield();
      }
      // shelterbelts: combs of tall poplars beyond the flood
      for (let b = 0; b < 4; b++) {
        const side = b % 2 ? 1 : -1, bx = side * xr.range(130, 760), bz = xr.range(-1200, -640), ang = xr.range(-0.45, 0.45), n = Math.round(xr.range(12, 22));
        for (let j = 0; j < n; j++) {
          const t = (j - n / 2) * xr.range(6.5, 9), x = bx + Math.cos(ang) * t, z = bz + Math.sin(ang) * t;
          if (fenSD(x, z) < 12) continue;
          const h = xr.range(14, 24), w = h * xr.range(0.13, 0.2);
          far.quad([x - 0.3, 0, z], [x + 0.3, 0, z], [x + 0.3, h * 0.3, z], [x - 0.3, h * 0.3, z], 0, 0, 0, 0, 1);
          far.quad([x, h * 0.12, z], [x + w, h * 0.42, z], [x, h, z], [x - w, h * 0.5, z], 0, 0.5, 1.5, 0.5, 1);
        }
      }
    }
    await ctx.yield();
    addInk(scene, await st.geometrySteps(ctx));
    await ctx.yield();
    addInk(scene, far.geometry(), false);
    await ctx.yield();

    // the four lattice sails, one turn every six seconds
    const sails = new THREE.Group();
    sails.position.set(PUMP.x, 10.5, PUMP.z + 2.45);
    {
      const sg = new Ink();
      for (let k = 0; k < 4; k++) {
        const a = k * Math.PI / 2, c = Math.cos(a), s = Math.sin(a);
        const P = (r, w, z = 0) => [c * r - s * w, s * r + c * w, z];
        const bar = (p0, p1, hw) => {
          const dx = p1[0] - p0[0], dy = p1[1] - p0[1], l = Math.hypot(dx, dy), nx = -dy / l * hw, ny = dx / l * hw;
          sg.quad([p0[0] - nx, p0[1] - ny, p0[2]], [p1[0] - nx, p1[1] - ny, p1[2]], [p1[0] + nx, p1[1] + ny, p1[2]], [p0[0] + nx, p0[1] + ny, p0[2]], 0, 0, 0, 0, 1);
        };
        bar(P(0, 0), P(5.3, 0), 0.085);                       // stock
        bar(P(1.1, 0.08, 0.02), P(5.3, 0.08, 0.02), 0.03);
        bar(P(1.1, 1.25, 0.05), P(5.3, 1.0, 0.05), 0.04);     // trailing hemlath
        bar(P(1.1, -0.38, 0.03), P(5.3, -0.3, 0.03), 0.035);  // leading board
        bar(P(1.1, 0.66, 0.04), P(5.3, 0.54, 0.04), 0.022);
        for (let j = 0; j <= 10; j++) { const r = 1.1 + j * 0.42; bar(P(r, -0.38, 0.04), P(r, 1.25 - j * 0.025, 0.04), 0.028); }
      }
      addInk(sails, sg.geometry());
    }
    scene.add(sails);

    // the punt, its poler and the one lantern
    const punt = new THREE.Group(), pole = new THREE.Group();
    {
      const pg = new Ink();
      const hull = (z0, z1, w0, w1, y0, y1) => {
        pg.quad([-w0, y0, z0], [w0, y0, z0], [w1, y1, z1], [-w1, y1, z1]);
        pg.quad([-w0, 0.42, z0], [w0, 0.42, z0], [w1, 0.42 + (y1 - y0) * 0.3, z1], [-w1, 0.42 + (y1 - y0) * 0.3, z1]);
        for (const s of [-1, 1]) pg.quad([s * w0, y0, z0], [s * w1, y1, z1], [s * w1, 0.42 + (y1 - y0) * 0.3, z1], [s * w0, 0.42, z0]);
      };
      hull(-2.2, 2.0, 0.56, 0.56, 0.02, 0.02); hull(-2.2, -3.4, 0.56, 0.4, 0.02, 0.3); hull(2.0, 3.3, 0.56, 0.42, 0.02, 0.28);
      pg.box(0, 0.36, -0.6, 1.1, 0.06, 0.25); pg.box(0, 0.36, 0.9, 1.1, 0.06, 0.25);
      // the poler stands at the stern (+Z), leaning into the pole
      const fz = 2.5, hip = [0.02, 1.3, fz + 0.04], neck = [0.1, 1.84, fz - 0.18], hx = 0.13, hz = fz - 0.23;
      pg.cyl([-0.14, 0.4, fz + 0.24], [-0.12, 0.86, fz + 0.2], 0.06, 0.075, 5); pg.cyl([-0.12, 0.86, fz + 0.2], hip, 0.075, 0.09, 5);
      pg.cyl([0.17, 0.4, fz - 0.26], [0.13, 0.86, fz - 0.14], 0.06, 0.075, 5); pg.cyl([0.13, 0.86, fz - 0.14], hip, 0.075, 0.09, 5);
      pg.cyl(hip, [0.05, 1.56, fz - 0.06], 0.13, 0.14, 6); pg.cyl([0.05, 1.56, fz - 0.06], neck, 0.14, 0.17, 6); pg.cyl(neck, [0.11, 1.92, fz - 0.2], 0.17, 0.05, 6);
      pg.cyl([hx - 0.01, 1.9, hz + 0.02], [hx, 2.02, hz], 0.05, 0.1, 6); pg.cyl([hx, 2.02, hz], [hx, 2.13, hz], 0.1, 0.095, 6); pg.cyl([hx, 2.13, hz], [hx, 2.2, hz], 0.095, 0.05, 6);
      pg.cyl([hx, 2.15, hz - 0.02], [hx, 2.17, hz - 0.02], 0.15, 0.14, 7); pg.cyl([hx, 2.17, hz - 0.02], [hx, 2.22, hz], 0.11, 0.1, 7);     // flat cap
      pg.cyl([-0.04, 1.8, fz - 0.14], [0.36, 1.52, fz - 0.36], 0.055, 0.045, 4); pg.cyl([0.36, 1.52, fz - 0.36], [0.62, 1.74, fz - 0.08], 0.045, 0.035, 4);
      pg.cyl([0.24, 1.78, fz - 0.14], [0.52, 1.32, fz + 0.1], 0.055, 0.045, 4); pg.cyl([0.52, 1.32, fz + 0.1], [0.62, 1.2, fz + 0.3], 0.045, 0.035, 4);
      pg.cyl([0, 0.4, -3.2], [0, 1.0, -3.2], 0.025, 0.025, 3);                 // lantern post on the bow
      addInk(punt, pg.geometry());
      const og = new Ink(); og.cyl([0, -2.6, 0], [0, 2.4, 0], 0.03, 0.022, 4);
      pole.position.set(0.62, 1.45, fz + 0.1); addInk(pole, og.geometry()); punt.add(pole);
    }
    const lampCol = lin('#FFE08A');
    const lamp = new THREE.Mesh(new THREE.OctahedronGeometry(0.1, 1), new THREE.MeshBasicMaterial({ color: lampCol.clone().multiplyScalar(7), fog: false }));
    lamp.position.set(0, 1.08, -3.2); punt.add(lamp);
    const glowTex = glowTexture();
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: lampCol.clone().multiplyScalar(1.6), blending: THREE.AdditiveBlending, depthWrite: false, fog: false, transparent: true }));
    halo.position.copy(lamp.position); halo.scale.setScalar(2.6); punt.add(halo);
    const halo2 = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: lampCol.clone().multiplyScalar(0.7), blending: THREE.AdditiveBlending, depthWrite: false, depthTest: false, fog: false, transparent: true }));
    halo2.position.set(0, -1.3, -3.2); halo2.scale.set(1.3, 4.4, 1); punt.add(halo2);
    const puntX = vr.chance(0.5) ? 1.9 : -1.9;
    punt.position.set(puntX, 0, 322); scene.add(punt);
    await ctx.yield();

    // two roe deer drinking at the dyke's edge; they lift their heads as we come
    const deer = [];
    {
      const side = -Math.sign(puntX);
      for (let i = 0; i < 2; i++) {
        const g = new THREE.Group(), neck = new THREE.Group(), b = new Ink(), nk = new Ink(), sc = i ? 0.86 : 1;
        b.cyl([0, 0.74, 0.5], [0, 0.78, -0.38], 0.2, 0.2, 7); b.cyl([0, 0.74, 0.5], [0, 0.7, 0.66], 0.2, 0.08, 7); b.cyl([0, 0.78, -0.38], [0, 0.84, -0.52], 0.2, 0.11, 7);
        for (const [lx, lz] of [[-0.1, 0.45], [0.1, 0.5], [-0.09, -0.34], [0.09, -0.3]]) { b.cyl([lx, 0.66, lz], [lx, 0.36, lz + 0.03], 0.07, 0.035, 4); b.cyl([lx, 0.36, lz + 0.03], [lx, -0.4, lz], 0.035, 0.028, 4); }
        b.tri([0, 0.82, 0.62], [0.05, 0.7, 0.72], [-0.05, 0.7, 0.72], 0, 0, 0, 1);
        nk.cyl([0, 0, 0], [0, 0.44, -0.22], 0.11, 0.065, 6); nk.cyl([0, 0.44, -0.22], [0, 0.4, -0.5], 0.075, 0.032, 6);
        nk.cyl([0, 0.36, -0.14], [0, 0.5, -0.24], 0.09, 0.08, 6);
        for (const s of [-1, 1]) nk.tri([s * 0.03, 0.5, -0.2], [s * 0.15, 0.66, -0.14], [s * 0.07, 0.52, -0.13], 0, 0, 0, 1);
        if (i === 0) for (const s of [-1, 1]) { nk.cyl([s * 0.03, 0.5, -0.24], [s * 0.07, 0.68, -0.22], 0.012, 0.01, 3); nk.cyl([s * 0.07, 0.68, -0.22], [s * 0.05, 0.78, -0.3], 0.01, 0.0, 3); }
        addInk(g, b.geometry()); addInk(neck, nk.geometry());
        neck.position.set(0, 0.84, -0.46); g.add(neck);
        g.position.set(side * (2.55 + i * 0.35), 0, 304 - i * 4.2); g.rotation.y = side * (1.1 - i * 0.5); g.scale.setScalar(sc);
        scene.add(g); deer.push({ neck, ph: i * 1.7, lag: i * 0.35 });
      }
    }

    // ---- reeds ------------------------------------------------------------------------------------------------
    const rr = rng.fork('reeds');
    const reedList = [];
    const pushReed = (x, z, sd) => {
      const edge = sd < 1.2, bul = edge && rr() < 0.6;
      reedList.push({ x, z, sd, h: bul ? rr.range(1.5, 2.0) : rr.range(2.1, 3.0) * (edge ? 0.85 : 1), yaw: rr.range(-0.6, 0.6) + (rr() < 0.15 ? 1.57 : 0),
        col: bul ? 3 : Math.floor(rr() * 3), w: rr.range(1.7, 2.6), lean: rr.range(-0.3, 0.3) });
    };
    const nDyke = Math.round(8500 * density * detail), nRim = Math.round(20000 * density * detail);
    for (let i = 0; i < nDyke; i++) {
      if ((i & 1023) === 1023) await ctx.yield();
      const z = rr.range(196, 660), ax = 4.6 + Math.pow(rr(), 1.5) * 13, x = (rr() < 0.5 ? -1 : 1) * ax;
      if (Math.abs(z - 280) < 1.4 && ax < 7.5) continue;
      pushReed(x, z, fenSD(x, z));
    }
    await ctx.yield();
    for (let i = 0, tries = 0; i < nRim && tries < 600000; tries++) {
      if ((tries & 4095) === 4095) await ctx.yield();   // first in the pass: most tries leave by a continue below
      const x = rr.range(-500, 500), z = rr.range(-700, 300), sd = fenSD(x, z);
      if (sd < -3.5 || sd > 13) continue;
      if (sd > 6 && rr() < (sd - 6) / 7) continue;
      if (Math.abs(x) < 4.6 && z > 150) continue;
      pushReed(x, z, sd); i++;
    }
    // a reed fringe round the windpump's island, and along the causeway
    for (let i = 0, n = Math.round(190 * detail); i < n; i++) {
      const a = rr.range(0, 6.283), k = rr.range(0.92, 1.6), x = PUMP.x + 1 + Math.cos(a) * 6.4 * k, z = PUMP.z + Math.sin(a) * 4.5 * k;
      if (Math.hypot(x - (PUMP.x + 4.2), z - (PUMP.z + 1)) < 1.7) continue;
      pushReed(x, z, Math.min(fenSD(x, z), 1));
    }
    for (let i = 0, n = Math.round(600 * detail); i < n; i++) pushReed(CX + (rr() < 0.5 ? -1 : 1) * rr.range(5.6, 9), rr.range(-520, 620), 8);
    await ctx.yield();
    reedList.sort((a, b) => (a.sd < 4 ? 0 : 1) - (b.sd < 4 ? 0 : 1));
    let nMir = 0; while (nMir < reedList.length && reedList[nMir].sd < 4) nMir++;
    await ctx.yield();
    {
      const g = new THREE.InstancedBufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute([-0.5, 0, 0, 0.5, 0, 0, 0.5, 1, 0, -0.5, 1, 0], 3));
      g.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, 1, 0, 1, 1, 0, 1], 2));
      g.setIndex([0, 1, 2, 0, 2, 3]);
      const ip = new Float32Array(reedList.length * 4), iv = new Float32Array(reedList.length * 4);
      for (let i = 0; i < reedList.length; i++) {   // was a forEach: same order, same draws; a loop can hand back
        const r = reedList[i]; ip.set([r.x, r.z, r.h, r.yaw], i * 4); iv.set([r.col, rr(), r.w, r.lean], i * 4);
        if ((i & 4095) === 4095) await ctx.yield();
      }
      const aP = new THREE.InstancedBufferAttribute(ip, 4), aV = new THREE.InstancedBufferAttribute(iv, 4);
      g.setAttribute('iPos', aP); g.setAttribute('iVar', aV); g.instanceCount = reedList.length;
      await ctx.yield();
      const atlas = reedAtlas(rr);
      const ru = { ...U, uMirror: { value: 1 }, uMap: { value: atlas }, uRimK: { value: winter ? 0.4 : 0.055 } };
      const reeds = new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms: ru, vertexShader: REED_VERT, fragmentShader: REED_FRAG, side: THREE.DoubleSide, fog: false }));
      reeds.frustumCulled = false; scene.add(reeds);
      const g2 = new THREE.InstancedBufferGeometry();
      g2.setAttribute('position', g.getAttribute('position')); g2.setAttribute('uv', g.getAttribute('uv')); g2.setIndex(g.getIndex());
      g2.setAttribute('iPos', aP); g2.setAttribute('iVar', aV); g2.instanceCount = nMir;
      const ru2 = { ...U, uMirror: { value: -1 }, uMap: { value: atlas }, uRimK: { value: 0 }, uInk: { value: mirrorInk } };
      const reedsM = new THREE.Mesh(g2, new THREE.ShaderMaterial({ uniforms: ru2, vertexShader: REED_VERT, fragmentShader: REED_FRAG, ...mirOpts }));
      reedsM.frustumCulled = false; reedsM.renderOrder = -0.8; scene.add(reedsM);
    }
    await ctx.yield();

    // ---- the rest of the cast: geese, swans or cormorants, a harrier, bats, the birds on the wires -----------------
    const fr = rng.fork('cast');
    const cast = [], low = [];
    const bird = (list, o) => list.push({ pos: [0, 0, 0], vel: [0, 0, 0], wob: [0, 0, 0, 0], half: 0.5, hz: 3, neck: 0, amp: 0.6, dih: 0.05, roll: 0.08, glide: 0,
      clock: 0, t0: 0, wrap: 0, sits: 0, show: [-1, 2], ph: fr(), ...o });
    const nSkeins = 3;
    for (let k = 0; k < nSkeins; k++) {
      const n = Math.round(fr.range(25, 40) * density), sp = fr.range(14, 18), vz = fr.range(-2, 2);
      const c = [fr.range(150, 650), fr.range(250, 400), fr.range(-950, -260)], vl = Math.hypot(sp, vz), vh = [-sp / vl, vz / vl];
      const per = 3400 / vl, off = fr.range(-8, 8), skew = fr.range(0.35, 0.65);
      for (let i = 0; i < n; i++) {
        const arm = i === 0 ? 0 : (fr() < skew ? 1 : -1), kk = i === 0 ? 0 : Math.ceil(i / 2) + fr.range(-0.2, 0.2);
        bird(cast, { pos: [c[0] - vh[0] * kk * 3.6 - vh[1] * arm * kk * 2.7, c[1] + fr.range(-0.6, 0.6) + kk * 0.12, c[2] - vh[1] * kk * 3.6 + vh[0] * arm * kk * 2.7],
          vel: [-sp, 0, vz], half: 0.82, hz: 1.6 + fr.range(-0.1, 0.1), neck: 0.5, amp: 0.5, t0: off, wrap: per, wob: [0.5, 0.4, 0.5, 0.5] });
      }
    }
    const crossPt = [0, cormorants ? 4.6 : 4.3, 222];   // just over the reed heads, so they are seen from the dyke
    if (cormorants) {
      for (let i = 0; i < 7; i++) bird(low, { pos: [crossPt[0] - swanDir * (17 * SWAN_T + i * 3.8), crossPt[1] + fr.range(-0.2, 0.2), crossPt[2] + 1.5 * SWAN_T + i * 0.4], vel: [swanDir * 17, 0, -1.5],
        half: 0.66, hz: 5, neck: 0.5, amp: 0.6, clock: 1 });
    } else {
      for (let i = 0; i < 2; i++) bird(low, { pos: [swanU[i].x - swanU[i].z * SWAN_T, crossPt[1] + i * 0.15, swanU[i].y - swanU[i].w * SWAN_T], vel: [swanU[i].z, 0, swanU[i].w],
        half: 1.35, hz: 3, neck: 0.8, amp: 0.62, clock: 1, ph: i * 0.31 });
    }
    bird(cast, { pos: [fr.range(50, 90), 7.5, fr.range(120, 180)], wob: [60, 2.5, 95, 0.11], half: 0.62, hz: 2.4, amp: 0.14, dih: 0.3, roll: 0.35, glide: 0.8 });
    bird(cast, { pos: [fr.range(-160, -90), 9, fr.range(-120, 40)], wob: [70, 3, 80, 0.09], half: 0.62, hz: 2.4, amp: 0.14, dih: 0.3, roll: 0.35, glide: 0.8 });
    const uBats = uAtT(34.2);
    for (let i = 0; i < 20; i++) {
      const a = fr.range(0, 6.283), r = fr.range(9.5, 17);
      bird(cast, { pos: [Math.cos(a) * r, 40 + Math.sin(a) * r * 0.8, -388 + fr.range(3, 55)], wob: [fr.range(2, 4), fr.range(2, 3.5), fr.range(3, 7), fr.range(1.5, 2.6)],
        half: 0.2, hz: 11, amp: 0.95, roll: 0.5, show: [uBats + fr.range(0, 0.02), 2] });
    }
    for (const w of wirePts) {
      bird(cast, { pos: w, vel: [fr.range(5, 12), fr.range(2.5, 5.5), fr.range(-14, -6)], half: 0.3, hz: 12, amp: 0.8, glide: 0.5, clock: 1, sits: 1, t0: 2.5 + fr() * 10, wob: [0, 0, 0, 0] });
    }
    const flapGeo = flapperGeometry();
    const makeFlappers = (list, mirror) => {
      const g = new THREE.InstancedBufferGeometry();
      g.setAttribute('position', flapGeo.getAttribute('position')); g.setAttribute('aWN', flapGeo.getAttribute('aWN'));
      const n = list.length, f = (k) => new Float32Array(n * k);
      const aPos = f(3), aVel = f(3), aWob = f(4), aPar = f(4), aPar2 = f(4), aK = f(4), aShow = f(2);
      list.forEach((b, i) => {
        aPos.set(b.pos, i * 3); aVel.set(b.vel, i * 3); aWob.set(b.wob, i * 4);
        aPar.set([b.half, b.hz, b.ph, b.neck], i * 4); aPar2.set([b.amp, b.dih, b.roll, b.glide], i * 4);
        aK.set([b.clock, b.t0, b.wrap, b.sits], i * 4); aShow.set(b.show, i * 2);
      });
      const I = (arr, k) => new THREE.InstancedBufferAttribute(arr, k);
      g.setAttribute('iPos', I(aPos, 3)); g.setAttribute('iVel', I(aVel, 3)); g.setAttribute('iWob', I(aWob, 4)); g.setAttribute('iPar', I(aPar, 4));
      g.setAttribute('iPar2', I(aPar2, 4)); g.setAttribute('iK', I(aK, 4)); g.setAttribute('iShow', I(aShow, 2)); g.instanceCount = n;
      const m = new THREE.Mesh(g, new THREE.ShaderMaterial(mirror
        ? { uniforms: mirU, vertexShader: FLAP_VERT, fragmentShader: INK_FRAG, ...mirOpts }
        : { uniforms: inkU, vertexShader: FLAP_VERT, fragmentShader: INK_FRAG, side: THREE.DoubleSide, fog: false }));
      m.frustumCulled = false; if (mirror) m.renderOrder = -0.8; scene.add(m);
      return m;
    };
    makeFlappers(cast, false); makeFlappers(low, false); makeFlappers(low, true);
    flapGeo.dispose();
    await ctx.yield();

    // ---- mist banks and midges ------------------------------------------------------------------------------------
    const mr = rng.fork('mist');
    let mist;
    {
      const n = Math.round(64 * (look.mistD / 0.006) ** 0.5);
      const g = new THREE.InstancedBufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute([-0.5, 0, 0, 0.5, 0, 0, 0.5, 1, 0, -0.5, 1, 0], 3));
      g.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, 1, 0, 1, 1, 0, 1], 2));
      g.setIndex([0, 1, 2, 0, 2, 3]);
      const ip = new Float32Array(n * 4), is = new Float32Array(n * 2);
      for (let i = 0; i < n; i++) {
        ip.set([mr.range(-520, 520), -0.6, mr.range(-900, 430), mr()], i * 4);
        is.set([mr.range(90, 230), mr.range(9, 17)], i * 2);
      }
      g.setAttribute('iPos', new THREE.InstancedBufferAttribute(ip, 4)); g.setAttribute('iSize', new THREE.InstancedBufferAttribute(is, 2));
      g.instanceCount = n;
      mist = new THREE.Mesh(g, new THREE.ShaderMaterial({
        uniforms: { uTime: U.uTime, uSunDir: U.uSunDir, uMistCol: U.uMistCol, uMistWarm: U.uMistWarm, uOp: { value: 0.55 } },
        vertexShader: MIST_VERT, fragmentShader: MIST_FRAG, transparent: true, depthWrite: false, fog: false,
      }));
      mist.frustumCulled = false; mist.renderOrder = 3; scene.add(mist);
    }
    let midges;
    {
      const n = Math.round(1500 * density * detail), pos = new Float32Array(n * 3), sd = new Float32Array(n * 4);
      for (let i = 0; i < n; i++) {
        const far = i > n * 0.7;
        const x = far ? mr.range(-60, 60) : (mr() < 0.5 ? -1 : 1) * mr.range(3, 20), z = far ? mr.range(-420, 200) : mr.range(200, 420);
        pos.set([x, far ? mr.range(1, 9) : mr.range(0.6, 4.6), z], i * 3);
        sd.set([mr(), mr(), mr(), mr()], i * 4);
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('aSeed', new THREE.BufferAttribute(sd, 4));
      const mu = { uTime: U.uTime, uPx: { value: 500 }, uCol: { value: mixc(C.core, C.halo, 0.4).multiplyScalar(look.sunI > 0 ? 2.2 : 1.1) } };
      midges = new THREE.Points(g, new THREE.ShaderMaterial({ uniforms: mu, vertexShader: MIDGE_VERT, fragmentShader: MIDGE_FRAG, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
      midges.frustumCulled = false; midges.renderOrder = 4;
      const _s = new THREE.Vector2();
      midges.onBeforeRender = (renderer, sc, cam) => {
        const rt = renderer.getRenderTarget(), h = rt ? rt.height : renderer.getDrawingBufferSize(_s).y;
        mu.uPx.value = h * 0.5 * cam.projectionMatrix.elements[5];
      };
      scene.add(midges);
    }

    // ---- gaze ----------------------------------------------------------------------------------------------------
    const pois = [
      // hold the gaze about 13 degrees down through the reveal: horizon and sun in the top third, the hourglass below
      { at: new THREE.Vector3(0, 150, -280), from: uAtT(16.0), to: uAtT(25.2), weight: 0.85, fade: 0.22 },
      { at: new THREE.Vector3(0, 70, -390), from: uAtT(24.2), to: uAtT(30.0), weight: 0.8, fade: 0.25 },      // keep the horizon in the dive
      { at: new THREE.Vector3(PUMP.x, 11, PUMP.z), from: uAtT(28.2), to: uAtT(30.5), weight: 0.42, fade: 0.3 },
    ];
    const uDeer = [2.2, 3.4];
    const rising = look.sunEl[1] > look.sunEl[0];
    const _sz = new THREE.Vector2();

    function update(dt, time, camera, u = 0) {
      const T = showT(u);
      U.uTime.value = time; U.uT.value = T; U.uU.value = u;
      U.uSkyQ.value.x = time;
      const el = lerp(look.sunEl[0], look.sunEl[1], u) * d2r;
      sunDir.set(0, Math.sin(el), -Math.cos(el));
      const deep = rising ? 1 - u : u;                      // the sky deepens from coral to magenta as the sun goes
      U.cCor.value.copy(corBase).lerp(C.mag, 0.28 * deep);
      U.uSkyQ.value.y = look.star * (0.55 + 0.9 * deep);
      hero.setShowTime(T);
      // the neighbours fall away below at the reveal and close up again for the dive
      hero.setWingmen(1 - 0.65 * smoothstep(16.5, 18.2, T) * (1 - smoothstep(24, 25.6, T)));
      hero.update(dt, time, camera);
      if (camera) {
        const hpx = ctx.renderer.getDrawingBufferSize(_sz).y;
        U.uMinS.value = 1.5 / Math.max(hpx * 0.5 * camera.projectionMatrix.elements[5], 50);
      }
      sails.rotation.z = -time * Math.PI / 3;
      // punt: poled slowly up the dyke, a lean and a push every three seconds
      const stroke = (time * 0.33) % 1, push = Math.sin(Math.PI * Math.min(stroke * 1.6, 1));
      punt.position.z = 326 - 0.6 * T - 0.25 * Math.sin(time * 0.33 * Math.PI * 2);
      punt.rotation.z = 0.012 * Math.sin(time * 0.9); punt.rotation.x = 0.006 * Math.sin(time * 0.66 * Math.PI);
      pole.rotation.x = 0.12 + 0.34 * push; pole.rotation.z = -0.08; pole.position.y = 1.45 + 0.5 * (1 - push);
      fenU.uPunt.value.set(punt.position.x, punt.position.z + 3.3, 1);
      const fl = 1 + 0.07 * Math.sin(time * 13.1) + 0.05 * Math.sin(time * 7.3 + 1) + 0.04 * Math.sin(time * 23.7);
      halo.scale.setScalar(2.6 * fl); halo2.scale.set(1.3 * fl, 4.4, 1);
      halo2.material.rotation = 0.05 * Math.sin(time * 2.1);
      for (const d of deer) {
        const k = smoothstep(uDeer[0] + d.lag, uDeer[1] + d.lag, T);
        d.neck.rotation.x = lerp(-1.25 + 0.06 * Math.sin(time * 2.3 + d.ph), 0.08 + 0.05 * Math.sin(time * 0.8 + d.ph), k);
        d.neck.rotation.y = k * 0.5 * Math.sin(time * 0.5 + d.ph) * (1 - smoothstep(5, 7, T)) - k * 0.4;
      }
      fenU.uSwanT.value.x = cormorants ? -100 : T - SWAN_T;
    }
    update(0, 0, null, 0);

    const titleSuffix = winter ? (lookId === 'sunset' ? ' in Hard Frost' : ', Frost') : '';
    return {
      scene, path, duration: 40,
      title: rare ? 'Two Murmurations' : look.title + titleSuffix,
      ride: 'none', style: 'none',
      camera: { fov: 62, near: 0.3, far: 9000, lookAhead: 26, sway: 1.3, bank: 1.6 },
      pois,
      portal: { shape: 'circle', radius: 7, color: look.portal, glow: 1.15, revealDistance: 300 },
      post: {
        exposure: look.exposure,
        bloom: { strength: 0.62, radius: 0.72, threshold: 0.86 },
        grade: { saturation: look.sat, contrast: 1.05, tint: '#ffffff', shadowTint: '#0a0612', vignette: 0.25, grain: 0.03, aberration: 0 },
      },
      update,
      dispose() { hero.dispose(); for (const d of disposables) d.dispose(); },
    };
  },
};
