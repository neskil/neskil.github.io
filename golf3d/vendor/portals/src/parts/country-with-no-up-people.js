// THE COUNTRY WITH NO UP: the people, their houses and the hall.
//   figures      ONE instanced quad draw. The vertex shader finds each figure's place on its lane (a row of the lane
//                texture) from its phase and the clock, turns it to face the way it walks, and pushes it out of the
//                Sphere's circle. The fragment shader draws the body as a signed-distance shape: needle, isosceles
//                triangle, regular polygon or circle, with a hard bright rim (never under 1.3 px), a dark glass face,
//                insides (nucleus, chambers, a beating heart light) and a pool of its own light round it.
//                A quad seen at a grazing angle or from far off has its far edge lifted so it never falls under 1.7 px.
//   skirts       the 0.5 m walls of the figures beside the first stretch of the flight, as real strips (12 quads each),
//                and the same strips mirrored and stretched below the glass as their smeared reflections
//   houses       one instanced quad draw: amber walls with the wide west door and the narrow east one, door leaves that
//                swing, partitions and softly lit rooms, all in the fragment shader
//   hall         one quad: a many-sided hall as a rose window laid flat, light passing round its rings
//   walls        static strips for the houses and hall beside the first stretch, and their reflections
// Drawing order (no depth is written by anything lying in the plane): glass, reflections, houses, hall, figures;
// the skirts are opaque and write depth, so near walls hide far ones and far tops.
import * as THREE from 'three';
import { COMMON, HALL } from './country-with-no-up-glsl.js';

const WALK = /* glsl */`
uniform sampler2D uLanes;
attribute vec4 aLane, aMove, aKind, aOff;
vec2 lanePt(float i, float n, float row){ i = i - n*floor(i/n); return texelFetch(uLanes, ivec2(int(i + 0.5), int(row + 0.5)), 0).xy; }
// where a figure is, which way it faces, and how hard the circle is pushing it (0..1)
void walker(out vec2 pos, out vec2 fwd, out float pushed){
  float t = uTime;
  if (aLane.y < 0.5) {                                   // at home or standing in a crowd: a small wander about its place
    if (aKind.w > 2.5 && aKind.w < 3.5) {
      // a soldier drawn up in a block: the whole block marches out and back along one straight line as one body
      // (aOff: how far, which way, where in its beat), slowing, turning about and coming back; a file never bends
      float ph = fract(t*aMove.y/(2.*aOff.x) + aOff.z);
      vec2 dir = vec2(cos(aOff.y), sin(aOff.y));
      pos = aLane.zw - dir*aOff.x*0.5*cos(6.2831853*ph);
      fwd = ph < 0.5 ? dir : -dir;
    } else {
      float a = aOff.z + t*aOff.y;
      pos = aLane.zw + aOff.x*vec2(cos(a), sin(a*0.73 + 1.3));
      vec2 v = vec2(-sin(a), 0.73*cos(a*0.73 + 1.3))*(aOff.y < 0. ? -1. : 1.);
      fwd = v/max(length(v), 1e-3);
    }
  } else {
    float tt = t + step(0.5, aKind.w)*step(aKind.w, 1.5)*0.13*sin(6.2832*t + aLane.x*2.4);      // files step in a pulse
    float s = fract(aMove.x + (aMove.y*tt + aOff.w)/aLane.z)*aLane.y;
    float i = floor(s), f = s - i, n = aLane.y, row = aLane.x;
    vec2 P0 = lanePt(i - 1. + n, n, row), P1 = lanePt(i, n, row), P2 = lanePt(i + 1., n, row), P3 = lanePt(i + 2., n, row);
    vec2 A = 2.*P0 - 5.*P1 + 4.*P2 - P3, B = 3.*P1 - P0 - 3.*P2 + P3;
    pos = 0.5*(2.*P1 + (P2 - P0)*f + A*f*f + B*f*f*f);
    vec2 v = (P2 - P0) + 2.*A*f + 3.*B*f*f;
    fwd = v/max(length(v), 1e-4);
    vec2 nr = vec2(-fwd.y, fwd.x);
    pos += nr*aLane.w;
    if (aOff.x > 0.) {                                   // an attendant circling its noble
      float a = aOff.z + t*aOff.y;
      pos += aOff.x*(fwd*cos(a) + nr*sin(a));
      v = fwd*aMove.y + aOff.x*aOff.y*(nr*cos(a) - fwd*sin(a));
      fwd = v/max(length(v), 1e-4);
    }
  }
  // the circle: nobody is passed through. Whoever is inside is moved out along the radius to just beyond the rim
  // (eased over 10 m so nobody jumps), and a ripple of flight runs on through those outside
  vec2 dc = pos - uCircle.xy; float d = length(dc); vec2 rd = dc/max(d, 1e-3);
  float on = smoothstep(0., 14., uCircle.z);
  float keep = uCircle.z + (4. + 30.*fract(aMove.w*7.31))*on;
  float h = clamp(0.5 + 0.5*(keep - d)/10., 0., 1.);
  float d2 = mix(d, keep, h) + 10.*h*(1. - h);
  float x = max(d - uCircle.z, 0.);
  d2 += on*(1. - h)*exp(-x/95.)*(2.4 + 3.2*sin(x*0.105 - t*2.4 + aMove.w*6.283));
  pos = uCircle.xy + rd*d2;
  pushed = on*max(h, exp(-x/40.));
  vec2 v2 = mix(fwd, rd, 0.9*pushed);
  fwd = v2/max(length(v2), 1e-4);
}
// half extents of a body in its own frame (x across, y along its heading)
vec2 bodyHalf(){
  float sides = aKind.x, size = aMove.z;
  return sides < 2.5 ? vec2(1.35, size*0.5 + 0.2) : (sides < 3.5 ? vec2(size*aKind.z*0.5, size*0.5) : vec2(size*0.5));
}
`;

const FIG_VS = COMMON + WALK + /* glsl */`
varying vec2 vP; varying vec3 vW; varying vec4 vKind, vInfo;
void main(){
  vec2 pos, fwd; float pushed; walker(pos, fwd, pushed);
  vec2 he = bodyHalf(); float size = aMove.z, margin = 0.5*size + 0.8;
  vec2 q = position.xy*(he + margin);
  vec2 right = vec2(fwd.y, -fwd.x), w = pos + right*q.x + fwd*q.y;
  vec3 P = vec3(w.x, 0.5, w.y);
  // far away or edge-on: lift the far edge so the body never falls under 1.7 px, and give up brightness for it
  vec3 tc = vec3(pos.x, 0.5, pos.y) - uEye; float dist = max(length(tc), 0.1);
  float sinE = clamp(-tc.y/dist, 0., 1.), ext = max(he.x, he.y);
  vec2 vd = tc.xz/max(length(tc.xz), 1e-3);
  float k = clamp(1.7*dist/(2.*ext*uPx) - sinE, 0., 0.35)*(1. - uMap);
  P.y += k*max(dot(w - pos, vd) + ext, 0.);
  vP = q; vW = P; vKind = aKind;
  vInfo = vec4(size, aMove.w, clamp(sinE/max(sinE + k, 1e-3), 0.05, 1.), sinE);
  gl_Position = projectionMatrix*viewMatrix*vec4(P.x, P.y + uLift, P.z, 1.);
}`;

const FIG_FS = COMMON + /* glsl */`
varying vec2 vP; varying vec3 vW; varying vec4 vKind, vInfo;
float sdSeg(vec2 p, vec2 a, vec2 b){ vec2 pa = p - a, ba = b - a; float h = clamp(dot(pa, ba)/max(dot(ba, ba), 1e-6), 0., 1.); return length(pa - ba*h); }
void main(){
  float sides = vKind.x, size = max(vInfo.x, 0.1), seed = vInfo.y; vec2 p = vP;
  float d, needle = 0.;
  if (sides < 2.5) {                                     // a woman: a needle whose back half swings twice a second
    float L = size*0.5, sw = 0.42*sin(uTime*12.566 + seed*40.);
    d = min(sdSeg(p, vec2(0.), vec2(0., L)), sdSeg(p, vec2(0.), -L*vec2(sin(sw), cos(sw)))) - 0.13; needle = 1.;
  } else if (sides < 3.5) {                              // soldier or workman: an isosceles triangle, apex first
    float L = size*0.5, b = size*vKind.z*0.5; vec2 n = normalize(vec2(2.*L, b));
    d = max(-(p.y + L), dot(vec2(abs(p.x), p.y - L), n));
  } else if (sides < 12.5) {                             // a regular figure, a vertex first
    float an = 3.14159265/sides, a = atan(p.x, p.y + (p.y < 0. ? -1e-5 : 1e-5)); a = mod(a, 2.*an) - an;
    d = cos(a)*length(p) - size*0.5*cos(an);
  } else d = length(p) - size*0.5;                       // a priest
  float fw = max(fwidth(d), 1e-4);
  vec3 ec = edgeCol(vKind.y, vW.xz), pearl = uPal[3];
  float inside = clamp(0.5 - d/fw, 0., 1.);
  // (the edge is held to 1.3 px at the body's distance; edge-on, the top of a body must not turn into one wide edge)
  float px = length(vW - uEye)/uPx;
  float w0 = needle > 0.5 ? 0.26 : 0.13 + 0.018*size, w = max(w0, 1.3*min(fw, px));
  float rim = inside*clamp(0.5 - (d + w)/fw, 0., 1.); rim = inside - rim;
  vec2 fp = p - vec2(0., 0.5*size);
  float front = 0.28 + 0.52*smoothstep(-0.5*size, 0.5*size, p.y) + 0.5*exp(-dot(fp, fp)/(0.05*size*size));
  float gain = (needle > 0.5 ? 2.7 : 2.2)*mix(1., w0/w, 0.85)*mix(1., vInfo.z, 0.9);
  // the insides, under dark glass: light let in at the edge, a pale nucleus, two dim chambers, a heart light beating
  vec2 q = p/size;
  float near = 1. - smoothstep(0.03, 0.22, fw/size);
  float pk = sides > 12.5 ? 2.4 : 1.;                 // a priest: nothing at his exact middle (a ring with a dot in it is an eye)
  vec2 n0 = pk*vec2(0.10*(cH1(seed*91.) - .5) + (pk > 1.5 ? 0.07 : 0.), 0.06*(cH1(seed*57.) - .3));
  vec2 c1 = vec2(0.16*(cH1(seed*13.) - .5), -0.20 + 0.08*cH1(seed*29.)), c2 = vec2(0.14*(cH1(seed*71.) - .5), 0.20 - 0.06*cH1(seed*43.));
  vec2 h0 = n0 + vec2(0.07, -0.05)*pk, c3 = vec2(-0.21, 0.04 + 0.1*(cH1(seed*37.) - .5));
  float nuc = exp(-dot(q - n0, q - n0)/0.010), ch = exp(-dot(q - c1, q - c1)/0.016) + exp(-dot(q - c2, q - c2)/0.012) + (pk > 1.5 ? exp(-dot(q - c3, q - c3)/0.014) : 0.);
  float beat = 0.5 + 0.5*sin(uTime*7.5 + seed*50.); beat *= beat; beat *= beat;
  float heart = exp(-dot(q - h0, q - h0)/0.0010)*(0.35 + 0.65*beat);
  vec3 face = uPal[7]*(0.75 + 0.5*cN(vW.xz*0.7 + seed*9.));
  vec3 inner = face + ec*(0.26*exp(clamp(d, -40., 0.)/(0.2*size)) + mix(0.17, 0.30*ch + 0.08, near)) + pearl*near*(0.45*nuc + 1.4*heart);
  vec3 body = mix(inner, ec*gain*front, rim);
  body += uPal[4]*circleLight(vW.xz)*(0.10 + 1.3*rim);
  float halo = exp(-max(d, 0.)/(0.4*size + 0.3))*0.09*(1. - smoothstep(0.3*size, 0.5*size + 0.7, d))*vInfo.z*vInfo.z;
  vec4 fg = slabFog(vW);
  gl_FragColor = vec4((body*fg.a + fg.rgb)*inside + ec*halo*fg.a*(1. - inside), inside)*edgeDim(vW.xz);      // toward the country's far edge a body and its pool dim away
}`;

// outline of a body as 13 points (the skirt's 12 quads); the needle is a wall there and back
const SKIRT_VS = COMMON + WALK + /* glsl */`
attribute vec2 aSk;
uniform float uRefl;
varying vec3 vW; varying vec3 vC; varying vec2 vV;
vec2 outline(float k){
  float sides = aKind.x, size = aMove.z;
  if (sides < 2.5) {
    float L = size*0.5, sw = 0.42*sin(uTime*12.566 + aMove.w*40.), t = k <= 6. ? k/6. : (12. - k)/6.;
    vec2 c = t < 0.5 ? vec2(0., L*(1. - 2.*t)) : (2.*t - 1.)*(-L)*vec2(sin(sw), cos(sw));
    return c + vec2(k <= 6. ? 0.13 : -0.13, 0.);
  }
  if (sides < 3.5) {
    float L = size*0.5, b = size*aKind.z*0.5, c = mod(floor(k*0.25 + 0.5), 3.);
    return c < 0.5 ? vec2(0., L) : (c < 1.5 ? vec2(b, -L) : vec2(-b, -L));
  }
  float n = sides > 12.5 ? 12. : sides, a = floor(k*n/12. + 0.5)*6.2831853/n;
  return size*0.5*vec2(sin(a), cos(a));
}
void main(){
  vec2 pos, fwd; float pushed; walker(pos, fwd, pushed);
  vec2 o = outline(aSk.x), right = vec2(fwd.y, -fwd.x), w = pos + right*o.x + fwd*o.y;
  float dist = length(vec3(w.x, 0.25, w.y) - uEye);
  float h = max(0.5, 1.6*dist/uPx);                      // a wall is never thinner than 1.6 px
  // the reflection: the wall's own image and a short smear under it, carrying the wall's light spread along it
  float sl = max(dist*0.028, 1.5*h), y = uRefl > 0.5 ? -aSk.y*sl : aSk.y*h;
  vec3 P = vec3(w.x, y, w.y);
  float front = smoothstep(-0.5*aMove.z, 0.5*aMove.z, o.y); front = 0.2 + 1.25*front*front;      // each leads with its bright point and dims behind: a file is a stutter of lights
  vC = (edgeCol(aKind.y, w)*(aKind.x < 2.5 ? 1.0 : 1.15)*front*mix(1., 0.5/h, 0.65) + uPal[4]*circleLight(w)*0.5)*edgeDim(w);
  vV = vec2(aSk.y, h/sl); vW = P;
  gl_Position = projectionMatrix*viewMatrix*vec4(P.x, P.y + uLift, P.z, 1.);
}`;
const SKIRT_FS = COMMON + /* glsl */`
uniform float uRefl;
varying vec3 vW; varying vec3 vC; varying vec2 vV;
void main(){
  float v = clamp(vV.x, 0., 1.);
  vec4 fg = slabFog(vec3(vW.x, min(abs(vW.y), 0.5), vW.z));
  if (uRefl > 0.5) {                                     // the wall's light smeared down the wet-black glass
    float f = (1. - v); f = f*f;
    float br = 0.65 + 0.5*cN(vec2((vW.x + vW.z)*1.7, v*2.5 - uTime*0.5));      // a little broken, as lamps lie on wet stone
    // (how strong: the glass's own law, by the angle of the line of sight to the glass at this point; nothing of the eye's height)
    gl_FragColor = vec4(vC*fg.a*f*br*clamp(vV.y, 0., 1.)*mirrorK(abs(normalize(vW - uEye).y)), 0.);
  } else gl_FragColor = vec4(vC*(0.13 + 0.2*v + 1.35*smoothstep(0.7, 0.92, v))*fg.a + fg.rgb, 1.);
}`;

// ---------------------------------------------------------------- houses (instanced quads; local x east, y north)
const LIFT = /* glsl */`
  // far away or edge-on: lift the far edge so the quad never falls under 1.7 px (c: its middle, ext: its radius)
  float liftK(vec3 c, float ext, out float dim){
    vec3 tc = c - uEye; float dist = max(length(tc), 0.1), sinE = clamp(-tc.y/dist, 0., 1.);
    float k = clamp(1.7*dist/(2.*ext*uPx) - sinE, 0., 0.35)*(1. - uMap);
    dim = clamp(sinE/max(sinE + k, 1e-3), 0.05, 1.);
    return k;
  }`;
const HOUSE_VS = COMMON + LIFT + /* glsl */`
attribute vec4 aH, aH2;        // x, z, R, seed; west door place, east door place, district, -
varying vec2 vP; varying vec3 vW; varying vec4 vH, vH2; varying float vDim;
void main(){
  float R = aH.z; vec2 q = position.xy*(R*1.5 + 2.);
  vec2 w = aH.xy + vec2(q.x, -q.y);
  vec3 P = vec3(w.x, 0.5, w.y), c = vec3(aH.x, 0.5, aH.y);
  float dim, k = liftK(c, R, dim); vec2 vd = (c.xz - uEye.xz)/max(length(c.xz - uEye.xz), 1e-3);
  P.y += k*max(dot(w - aH.xy, vd) + R, 0.);
  vP = q; vW = P; vH = aH; vH2 = aH2; vDim = dim;
  gl_Position = projectionMatrix*viewMatrix*vec4(P.x, P.y + uLift, P.z, 1.);
}`;
const HOUSE_FS = COMMON + /* glsl */`
varying vec2 vP; varying vec3 vW; varying vec4 vH, vH2; varying float vDim;
float sdSeg(vec2 p, vec2 a, vec2 b){ vec2 pa = p - a, ba = b - a; float h = clamp(dot(pa, ba)/max(dot(ba, ba), 1e-6), 0., 1.); return length(pa - ba*h); }
// a door leaf hinged at one end of its gap, in the wall's own frame (t along, d out): closed it fills the gap
float leaf(vec2 td, float t0, float hw, float T, float open){
  float th = 1.4*open; vec2 H = vec2(t0 - hw, -0.5*T);
  return sdSeg(td, H, H + 2.*hw*vec2(cos(th), -sin(th))) - 0.16;
}
void main(){
  float R = vH.z, seed = vH.w; vec2 p = vP;
  float a = atan(p.x, p.y + (p.y < 0. ? -1e-5 : 1e-5)); if (a < 0.) a += 6.2831853;
  float j = min(floor(a/1.2566371), 4.), am = (j + 0.5)*1.2566371;
  vec2 n = vec2(sin(am), cos(am)), tg = vec2(cos(am), -sin(am));
  float apo = R*0.80902, d = dot(p, n) - apo, t = dot(p, tg);
  float fw = max(fwidth(d), 1e-4), near = 1. - smoothstep(0.012, 0.09, fw/R);
  float px = length(vW - uEye)/uPx;
  float T = clamp(R*0.064, 0.55, 1.0), Tw = max(T, 1.3*min(fw, px));
  float inside = clamp(0.5 - d/fw, 0., 1.), room = inside*clamp(0.5 - (d + Tw)/fw, 0., 1.), wall = inside - room;
  // the doors: the wide one for men in the west wall (side 3), the narrow one for women in the east wall (side 1)
  float hwW = 0.2*R, hwE = 0.09*R;
  float gap = step(2.5, j)*step(j, 3.5)*clamp((hwW - abs(t - vH2.x))/fw + 0.5, 0., 1.) + step(0.5, j)*step(j, 1.5)*clamp((hwE - abs(t - vH2.y))/fw + 0.5, 0., 1.);
  wall *= 1. - clamp(gap, 0., 1.)*(1. - smoothstep(0.1, 0.3, fw/R));
  vec3 amber = edgeCol(2., vW.xz), pearl = uPal[3];
  // rooms: one wall across, one below it, one above it, sometimes a fourth; a doorway in each
  float h1 = cH1(seed*17.3), h2 = cH1(seed*29.1), h3 = cH1(seed*43.7), h4 = cH1(seed*61.3), h5 = cH1(seed*83.9);
  float y1 = R*(-0.08 + 0.22*(h1 - 0.5)), x1 = R*0.34*(h2 - 0.5), x2 = R*0.4*(h3 - 0.5), y2 = y1 - R*0.34, sg = h5 < 0.5 ? -1. : 1.;
  float pa = abs(p.y - y1) + 9.*step(abs(p.x - R*0.5*(h4 - 0.5)), 0.9);
  float pb = p.y < y1 ? abs(p.x - x1) + 9.*step(abs(p.y - (y1 - 0.2*R)), 0.8) : abs(p.x - x2) + 9.*step(abs(p.y - (y1 + 0.16*R)), 0.8);
  float pc = (h4 > 0.4 && (p.x - x1)*sg > 0.) ? abs(p.y - y2) + 9.*step(abs(p.x - x1 - sg*0.2*R), 0.8) : 9.;
  float pd = min(min(pa, pb), pc);
  float pw = max(0.26, 0.75*fw);
  float part = clamp(0.5 - (pd - pw)/max(fw, 0.02), 0., 1.)*mix(0.26/pw, 1., 0.35)*(1. - smoothstep(0.18, 0.5, fw/R));
  float rid = (p.y > y1 ? 1. : 0.) + (p.x > (p.y < y1 ? x1 : x2) ? 2. : 0.) + (pc < 8.5 && p.y > y2 ? 4. : 0.);
  float rh = cH1(seed*7.7 + rid*3.1), rh2 = cH1(seed*5.3 + rid*9.7);
  float hearth = step(0.78, rh2);
  float lum = (0.09 + 0.46*rh*rh)*(0.85 + 0.15*sin(uTime*(0.4 + rh) + rh2*40.)) + hearth*0.5*(0.75 + 0.25*cN(vec2(uTime*3.1, seed*77.)));
  vec3 roomCol = mix(mix(amber, pearl, 0.25 + 0.5*rh2), uPal[1], 0.45*step(0.6, rh)*(1. - hearth));
  vec3 glass = uPal[7]*(1.1 + 0.5*cN(vW.xz*0.33));
  vec3 inner = glass + roomCol*mix(0.07, 0.55*lum, near)*uHour.x + amber*0.16*exp(clamp(d + T, -60., 0.)/(0.06*R + 0.6));
  inner = mix(inner, amber*(1.05 + 0.4*rh), part);
  // door leaves swinging open and shut
  float ph = fract(uTime/(5. + 6.*h2) + h3*7.), ph2 = fract(uTime/(6. + 5.*h5) + h1*5.);
  float oW = smoothstep(0., 0.12, ph)*(1. - smoothstep(0.3, 0.44, ph)), oE = smoothstep(0., 0.14, ph2)*(1. - smoothstep(0.26, 0.4, ph2));
  vec2 nW = vec2(-0.95106, -0.30902), tW = vec2(-0.30902, 0.95106), nE = vec2(0.95106, -0.30902), tE = vec2(-0.30902, -0.95106);
  float lf = min(leaf(vec2(dot(p, tW), dot(p, nW) - apo), vH2.x, hwW, T, oW), leaf(vec2(dot(p, tE), dot(p, nE) - apo), vH2.y, hwE, T, oE));
  float leafM = clamp(0.5 - lf/max(fw, 0.02), 0., 1.)*near;
  float gain = (2.0*uHour.y)*mix(1., T/Tw, 0.85)*mix(1., vDim, 0.9);
  vec3 wallCol = amber*gain*(0.85 + 0.3*cH1(seed*3.3 + j));
  vec3 body = mix(inner, wallCol, wall);
  body = mix(body, mix(amber, pearl, 0.5)*2.6, leafM);
  body += uPal[4]*circleLight(vW.xz)*(0.08 + 1.1*wall);
  float cover = max(inside, leafM);
  float halo = exp(-max(d, 0.)/(0.28*R + 1.))*0.08*(1. - smoothstep(0.3*R, 0.5*R + 2., d))*vDim*vDim;
  vec4 fg = slabFog(vW);
  gl_FragColor = vec4((body*fg.a + fg.rgb)*cover + amber*halo*fg.a*(1. - cover), cover)*edgeDim(vW.xz);      // toward the country's far edge a house and its pool dim away
}`;

// ---------------------------------------------------------------- the hall (one quad; local x east, y south)
const HALL_VS = COMMON + LIFT + /* glsl */`
uniform vec4 uHall;            // x, z, R, sides
varying vec2 vP; varying vec3 vW; varying float vDim;
void main(){
  vec2 q = position.xy*(uHall.z + 70.), w = uHall.xy + q;
  vec3 P = vec3(w.x, 0.5, w.y), c = vec3(uHall.x, 0.5, uHall.y);
  float dim, k = liftK(c, uHall.z, dim); vec2 vd = (c.xz - uEye.xz)/max(length(c.xz - uEye.xz), 1e-3);
  P.y += k*max(dot(q, vd) + uHall.z, 0.);
  vP = q; vW = P; vDim = dim;
  gl_Position = projectionMatrix*viewMatrix*vec4(P.x, P.y + uLift, P.z, 1.);
}`;
const HALL_FS = COMMON + /* glsl */`
uniform vec4 uHall, uHall2;    // x, z, R, sides; gates, -, -, -
varying vec2 vP; varying vec3 vW; varying float vDim;
void main(){
  vec2 p = vP; float R = uHall.z, N = uHall.w, r = length(p);
  float phi = atan(p.x, p.y + (p.y < 0. ? -1e-5 : 1e-5));
  float an = 3.14159265/N, a = mod(phi + an, 2.*an) - an, ca = cos(a);
  float d = ca*r - R*cos(an), fw = max(fwidth(d), 1e-4), near = 1. - smoothstep(0.004, 0.03, fw/R);
  float inside = clamp(0.5 - d/fw, 0., 1.);
  vec3 amber = edgeCol(2., vW.xz), gold = uPal[4], pearl = uPal[3];
  // the gates: a passage from each spoke avenue straight in to the central court
  float gw = 6.2831853/uHall2.x, ga = mod(phi + 0.5*gw, gw) - 0.5*gw, lat = abs(sin(ga))*r;
  float inGate = clamp(0.5 - (lat - 4.6)/fw, 0., 1.)*step(0., cos(ga));
  float gateWall = clamp(0.5 - (abs(lat - 5.0) - 0.4)/fw, 0., 1.)*step(0., cos(ga));
  // walls: the outer one and three rings inside it
  float px = length(vW - uEye)/uPx;
  float T = 1.6, Tw = max(T, 1.3*min(fw, px));
  float wall = inside*(1. - clamp(0.5 - (d + Tw)/fw, 0., 1.));
  float rr = ca*r/cos(an);                                   // the radius of the many-sided ring through this point
  float k1 = 0.74*R, k2 = 0.52*R, k3 = 0.33*R;
  float ringW = max(0.5, 0.9*fw);
  float rings = max(max(clamp(0.5 - (abs(rr - k1) - ringW)/fw, 0., 1.), clamp(0.5 - (abs(rr - k2) - ringW)/fw, 0., 1.)), clamp(0.5 - (abs(rr - k3) - ringW*1.4)/fw, 0., 1.));
  // chambers: radial partitions in each band, and light passing round the bands (each band its own way)
  float band = rr > k1 ? 0. : (rr > k2 ? 1. : 2.), inner = step(rr, k3);
  float M = band < 1.5 ? N : N*0.5, off = band*0.5;
  float ac = (phi/6.2831853 + 0.5)*M + off, cf = fract(ac), cell = floor(ac);
  float pdist = min(cf, 1. - cf)*6.2831853*r/M;
  float parts = clamp(0.5 - (pdist - max(0.35, 0.7*fw))/fw, 0., 1.)*(1. - inner);
  float dir = band == 1. ? -1. : 1.;
  float wv = 0.5 + 0.5*cos(6.2831853*((cell + 0.5)/M*(2. + band) - dir*uTime*(0.05 + 0.02*band)) + band*2.1);
  wv = wv*wv*wv;
  float lum = (0.05 + 0.42*wv + 0.08*cH1(cell*7.7 + band*3.1))*uHour.x;
  vec3 chamber = uPal[7]*1.3 + mix(amber, gold, 0.3 + 0.5*wv)*mix(0.035, 0.2*lum, near);
  // the central court: open dark glass under a low gold light
  vec3 court = uPal[7]*1.2 + gold*(0.03 + 0.09*exp(-r/(0.2*R))) + amber*0.14*exp(-max(k3 - rr, 0.)/3.);
  vec3 passage = uPal[7]*1.2 + gold*0.05 + amber*0.2*exp(-abs(lat - 5.)/1.6);
  float gain = 2.8*uHour.y*mix(1., T/Tw, 0.85)*mix(1., vDim, 0.9);
  vec3 body = mix(chamber, court, inner);
  body = mix(body, mix(amber, pearl, 0.35)*(0.75 + 1.7*wv), max(rings, parts)*(1. - inner*step(rr, k3 - 2.)));
  body = mix(body, mix(amber, pearl, 0.25)*gain, wall);
  float gz = inGate*(1. - inner);
  body = mix(body, passage, gz);
  body = mix(body, mix(amber, pearl, 0.35)*1.8, gateWall*(1. - inner)*inside);
  body += gold*circleLight(vW.xz)*0.2;
  float cover = inside*(1. - gz*clamp(0.5 + (d + Tw)/fw, 0., 1.));          // the gate is a gap in the outer wall
  float halo = exp(-max(d, 0.)/22.)*0.05*(1. - smoothstep(30., 68., d))*vDim*vDim;
  vec4 fg = slabFog(vW);
  gl_FragColor = vec4((body*fg.a + fg.rgb)*cover + mix(amber, gold, 0.4)*halo*fg.a*(1. - cover), cover);
}`;

// ---------------------------------------------------------------- static wall strips (houses and hall, beside the first stretch)
const WALL_VS = COMMON + /* glsl */`
attribute float aV; attribute vec4 aW; attribute vec3 aC;      // aW: place along the wall (m), door place, door half width, -
uniform float uRefl;
varying vec3 vW; varying vec3 vC, vT; varying vec2 vV;
void main(){
  float dist = length(vec3(position.x, 0.25, position.z) - uEye);
  float h = max(0.5, 1.6*dist/uPx), sl = max(dist*0.028, 1.5*h);
  vec3 P = vec3(position.x, uRefl > 0.5 ? -aV*sl : aV*h, position.z);
  vec3 col = aC; float g = dot(col, vec3(.3, .5, .2));
  col = mix(col, vec3(0.62, 0.68, 0.80)*(0.55 + 0.45*g)*1.1, uAge.x*(1. - smoothstep(-40., 40., position.z - uAge.y)));
  vC = col*uHour.y*mix(1., 0.5/h, 0.65)*edgeDim(position.xz); vT = aW.xyz; vV = vec2(aV, h/sl); vW = P;
  gl_Position = projectionMatrix*viewMatrix*vec4(P.x, P.y + uLift, P.z, 1.);
}`;
const WALL_FS = COMMON + /* glsl */`
uniform float uRefl;
varying vec3 vW; varying vec3 vC, vT; varying vec2 vV;
void main(){
  if (abs(vT.x - vT.y) < vT.z) discard;                          // the door
  float v = clamp(vV.x, 0., 1.);
  vec4 fg = slabFog(vec3(vW.x, min(abs(vW.y), 0.5), vW.z));
  if (uRefl > 0.5) {
    float f = (1. - v); f = f*f;
    float br = 0.65 + 0.5*cN(vec2((vW.x + vW.z)*1.7, v*2.5 - uTime*0.5));      // a little broken, as lamps lie on wet stone
    // (how strong: the glass's own law, by the angle of the line of sight to the glass at this point; nothing of the eye's height)
    gl_FragColor = vec4(vC*fg.a*f*br*clamp(vV.y, 0., 1.)*mirrorK(abs(normalize(vW - uEye).y)), 0.);
  } else gl_FragColor = vec4(vC*(0.13 + 0.2*v + 1.35*smoothstep(0.7, 0.92, v))*fg.a + fg.rgb, 1.);
}`;

// ---------------------------------------------------------------- meshes
const PREMULT = { transparent: true, depthWrite: false, depthTest: true, blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor, side: THREE.DoubleSide };
const ADDITIVE = { transparent: true, depthWrite: false, depthTest: true, blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor, side: THREE.DoubleSide };
const pick = (src, idx, n = 4) => { const out = new Float32Array(idx.length * n); for (let i = 0; i < idx.length; i++) for (let k = 0; k < n; k++) out[i * n + k] = src[idx[i] * n + k]; return out; };

// plan: from makePlan; U: the shared uniforms (makeShared); o: { hallSides, gates, wallColor, hallColor }
export async function buildPeople(ctx, plan, U, o) {
  const group = new THREE.Group(), mapObjects = [];
  const laneTex = new THREE.DataTexture(plan.laneData, 256, plan.laneRows, THREE.RGBAFormat, THREE.FloatType);
  laneTex.minFilter = laneTex.magFilter = THREE.NearestFilter; laneTex.generateMipmaps = false; laneTex.needsUpdate = true;
  const quad = new THREE.PlaneGeometry(2, 2);
  const local = { uLanes: { value: laneTex }, uHall: { value: new THREE.Vector4(HALL.x, HALL.z, HALL.r, o.hallSides) }, uHall2: { value: new THREE.Vector4(o.gates, 0, 0, 0) } };
  const mat = (vs, fs, extra, uni = {}) => new THREE.ShaderMaterial({ vertexShader: vs, fragmentShader: fs, uniforms: { ...U, ...local, ...uni }, ...extra });
  const add = (mesh, order, inMap) => { mesh.frustumCulled = false; mesh.renderOrder = order; mesh.matrixAutoUpdate = false; group.add(mesh); if (inMap) { const m2 = new THREE.Mesh(mesh.geometry, mesh.material); m2.frustumCulled = false; m2.renderOrder = order; m2.matrixAutoUpdate = false; mapObjects.push(m2); } return mesh; };

  // houses
  const H = plan.houses, aH = new Float32Array(H.count * 4), aH2 = new Float32Array(H.count * 4), hr = o.doors;
  for (let i = 0; i < H.count; i++) {
    aH[i * 4] = H.x[i]; aH[i * 4 + 1] = H.z[i]; aH[i * 4 + 2] = H.r[i]; aH[i * 4 + 3] = H.seed[i];
    aH2[i * 4] = hr.range(-0.16, 0.16) * H.r[i]; aH2[i * 4 + 1] = hr.range(-0.2, 0.2) * H.r[i]; aH2[i * 4 + 2] = H.district[i];
  }
  const hg = new THREE.InstancedBufferGeometry(); hg.index = quad.index; hg.setAttribute('position', quad.attributes.position);
  hg.setAttribute('aH', new THREE.InstancedBufferAttribute(aH, 4)); hg.setAttribute('aH2', new THREE.InstancedBufferAttribute(aH2, 4)); hg.instanceCount = H.count;
  const houses = add(new THREE.Mesh(hg, mat(HOUSE_VS, HOUSE_FS, PREMULT)), 2, true);
  const hall = add(new THREE.Mesh(quad, mat(HALL_VS, HALL_FS, PREMULT)), 2.5, true);
  await ctx.yield();

  // figures
  const F = plan.fig, fg = new THREE.InstancedBufferGeometry(); fg.index = quad.index; fg.setAttribute('position', quad.attributes.position);
  for (const k of ['aLane', 'aMove', 'aKind', 'aOff']) fg.setAttribute(k, new THREE.InstancedBufferAttribute(F[k], 4));
  fg.instanceCount = F.count;
  const figures = add(new THREE.Mesh(fg, mat(FIG_VS, FIG_FS, PREMULT)), 3, true);
  await ctx.yield();

  // skirts of the figures beside the first stretch, and their reflections
  const sg = new THREE.InstancedBufferGeometry(), sk = new Float32Array(26 * 2), sp = new Float32Array(26 * 3), si = [];
  for (let k = 0; k <= 12; k++) for (let v = 0; v < 2; v++) { sk[(k * 2 + v) * 2] = k; sk[(k * 2 + v) * 2 + 1] = v; }
  for (let k = 0; k < 12; k++) si.push(k * 2, k * 2 + 2, k * 2 + 1, k * 2 + 1, k * 2 + 2, k * 2 + 3);
  sg.setIndex(si); sg.setAttribute('position', new THREE.BufferAttribute(sp, 3)); sg.setAttribute('aSk', new THREE.BufferAttribute(sk, 2));
  for (const k of ['aLane', 'aMove', 'aKind', 'aOff']) sg.setAttribute(k, new THREE.InstancedBufferAttribute(pick(F[k], plan.skirtFigs), 4));
  sg.instanceCount = plan.skirtFigs.length;
  const skirts = add(new THREE.Mesh(sg, mat(SKIRT_VS, SKIRT_FS, { side: THREE.DoubleSide }, { uRefl: { value: 0 } })), 0, false);
  const skirtRefl = add(new THREE.Mesh(sg, mat(SKIRT_VS, SKIRT_FS, ADDITIVE, { uRefl: { value: 1 } })), 1, false);
  await ctx.yield();

  // static walls: the houses beside the first stretch, and the hall's outer wall
  const wp = [], wv = [], ww = [], wc = [], wi = [];
  const wallCol = new THREE.Color(o.wallColor).multiplyScalar(1.1), hallCol = new THREE.Color(o.hallColor).multiplyScalar(1.3);
  const seg = (ax, az, bx, bz, col, door = 1e5, half = 0) => {
    const b = wp.length / 3, L = Math.hypot(bx - ax, bz - az);
    for (let v = 0; v < 2; v++) for (let e = 0; e < 2; e++) { wp.push(e ? bx : ax, 0, e ? bz : az); wv.push(v); ww.push(e ? L / 2 : -L / 2, door, half, 0); wc.push(col.r, col.g, col.b); }
    wi.push(b, b + 1, b + 2, b + 2, b + 1, b + 3);
  };
  const tmp = new THREE.Color();
  for (const i of plan.skirtHouses) {
    const R = H.r[i], x = H.x[i], z = H.z[i];
    for (let j = 0; j < 5; j++) {
      const a0 = j * 1.2566371, a1 = (j + 1) * 1.2566371;
      // (the shader's wall coordinate runs clockwise from the wall's middle: from vertex j to vertex j + 1)
      tmp.copy(wallCol).multiplyScalar(0.85 + 0.3 * ((H.seed[i] * 3.3 + j) % 1));
      seg(x + Math.sin(a0) * R, z - Math.cos(a0) * R, x + Math.sin(a1) * R, z - Math.cos(a1) * R, tmp.clone(), j === 3 ? aH2[i * 4] : j === 1 ? aH2[i * 4 + 1] : 1e5, j === 3 ? 0.2 * R : j === 1 ? 0.09 * R : 0);
    }
  }
  const N = o.hallSides;
  for (let k = 0; k < N; k++) { const a0 = (k - 0.5) * Math.PI * 2 / N, a1 = (k + 0.5) * Math.PI * 2 / N; seg(HALL.x + Math.sin(a0) * HALL.r, HALL.z + Math.cos(a0) * HALL.r, HALL.x + Math.sin(a1) * HALL.r, HALL.z + Math.cos(a1) * HALL.r, hallCol); }
  const wg = new THREE.BufferGeometry(); wg.setIndex(wi);
  wg.setAttribute('position', new THREE.Float32BufferAttribute(wp, 3)); wg.setAttribute('aV', new THREE.Float32BufferAttribute(wv, 1));
  wg.setAttribute('aW', new THREE.Float32BufferAttribute(ww, 4)); wg.setAttribute('aC', new THREE.Float32BufferAttribute(wc, 3));
  const walls = add(new THREE.Mesh(wg, mat(WALL_VS, WALL_FS, { side: THREE.DoubleSide }, { uRefl: { value: 0 } })), 0, false);
  const wallRefl = add(new THREE.Mesh(wg, mat(WALL_VS, WALL_FS, ADDITIVE, { uRefl: { value: 1 } })), 1, false);

  return { group, mapObjects, houses, hall, figures, skirts, skirtRefl, walls, wallRefl, local, laneTex };
}
