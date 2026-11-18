// HERO of "fleet-in-six-wools" (after the Bayeux Tapestry, embroidered about 1077):
// THE LONG-HAIRED STAR IN ITS BORDER. One hung span of the upper border: a strip of bare linen 520 m wide and
// 36 m tall whose lower edge hangs 70 m up, two dark blue ropes, paired beasts between slanted bars with
// three-leaf sprigs, and a star too large for it: a wheel 46 m across (terracotta hub, eight old-gold petals laid
// radially, a dark rope round each) that breaks both ropes, nine rays streaming 150 m to port, each ending in a
// comb of free wool ends, and a curtain of free ends 25 m long under the lowest ray: the fringe the camera flies through,
// under an arch trimmed in it.
//
// FRAME. Origin on the floor under the middle of the span, +Y up, the worked face toward +Z. Seen from the front
// (+Z) the head is on the RIGHT at (HEAD.x, HEAD.y) = (30, 91) and the rays stream LEFT (to -X). The world should
// place it with rotation.y = Math.PI at its z so the face looks back down the course; anchors are LOCAL.
// SIZE. radius 110 (the star and its hair; the whole span is 520 wide), height 116 (top of the head; lashes to 122).
// COST about 29k triangles drawn (9.5k of work, drawn on the face and again on the back; 8.5k of free threads;
// 1.3k of cloth), 4 draw calls, 3 programs, no lights, no textures, about 30 ms of build in steps under 15 ms, and where the world asks the arch in the fringe (trimToRoute) one piece more of about 9 to 18 ms. opts: { palette (brief order: linen, terracotta, blue-green, gold, olive,
// blue, dark), detail 0.6..1 (thins free threads only), lot: 'terracotta'|'blue'|'green', cast: 'lions'|'wyverns'|
// 'hounds', weather: 'still'|'draught'|'gale' } (lot, cast and weather are drawn from ctx.rng when not given).
// opts.style: pass the world's own makeStyle() result so hero and world share one uniform set (then the WORLD calls
// style.update(time, camera, ctx.renderer) each frame; without it the hero makes and updates its own).
// EXPECTS around it: linen everywhere (no sky), nothing lit. Returns also style, setProgress(u) (moves the swell
// crest: z = 2600u - 420 in world) and setWeather(name). No free end is placed by the camera: opts.eye (the eye's places through the fringe, in this
// frame) trims the arch at build.
// MOVES: the cloth sways on its rail (still at the top, uWave.w metres at the hem), the wheel turns by notches, beasts
// pace, wings and tails swing (hinges in the vertex shader), every free end sways and streams in the gust.
//
// ANCHORS (local): head {x,y,r}; band {y0,y1,width}; flyThrough: ordered points of a safe line that comes in from
// +Z, climbs at the star, passes UNDER the lower rope and the lowest ray through the hanging fringe at (0, 62, 0)
// (rope 8 m overhead, head rim 7 m to the right, floor 60 m below) and leaves to -Z; fringeGate: that point;
// viewpoints.front / .close / .back; portalSeat: none belongs to the star (the arch is the world's), given as a
// fallback 40 m behind the span on the floor.
//
// STYLE EXPORTS (shade the whole world with these, post flat 1, no tone map, hex written = hex shown):
//   WOOLS            the eight wools + linen as hex; woolColor(name|hex) -> THREE.Color (linear, write as is).
//   STYLE_GLSL       shared GLSL (vertex and fragment): uniforms uTime/uWave/uCrest/uPx, fsHash/fsNoise, clothWave(xz)
//                    (the ONE analytic billow: add it to the y of everything that stands on the floor).
//   STYLE_FRAG_GLSL  fragment half: woolLaid(uv), stemRope(s, q, hw), linenWeave(uv), each a factor round 1 to multiply
//                    the wool's hex by: the thread is drawn, not lit; each term fades by fwidth to the plain hex.
//   makeStyle(ctx)   -> { uniforms, wool(opts), linen(opts), thread(), update(time, camera, renderer), setProgress(u),
//                    setWeather(w) }: one shared uniform set; wool({hung:[railY, drop]}) is the laid-and-couched /
//                    stem-stitch material for every FLAT, linen({plane:'xz'|'xy', ride:1}) the ground weave, thread()
//                    free wool ends. Same source each time, so each compiles once.
//   FlatBuilder      collects flats into one BufferGeometry for wool(): fill(points, wool, layAngle, opts) laid
//                    filling (stops short of its outline), rope(points, wool, width, opts) stem stitch (outlines,
//                    water lines, masts), outline(), disc(), hinge(px, py, amp, freq, phase, mode) for hinged
//                    parts (rotated in the vertex shader), pricked fills for unfinished work ({kind: 2}).
//   smoothLoop(pts, n), beastLion/beastBird/beastWyvern/beastHound(fb, x, y, s, dir, wools, phase), sprig(), slantBars():
//   the border motifs, drawn into any FlatBuilder; makeFringe(threads) -> geometry for thread().
import * as THREE from 'three';

export const WOOLS = {
  linen: '#D8CCAE', terracotta: '#A9462B', bluegreen: '#3E6E69', gold: '#C59A3C', olive: '#6F7A3B',
  blue: '#3C5C84', dark: '#1E2836', sage: '#8E9A73', buff: '#B48F5E',
};
export const DEFAULT_PALETTE = ['#D8CCAE', '#A9462B', '#3E6E69', '#C59A3C', '#6F7A3B', '#3C5C84', '#1E2836'];
const _wc = new Map();
export function woolColor(name) {
  const hex = WOOLS[name] || name;
  if (!_wc.has(hex)) _wc.set(hex, new THREE.Color(hex));
  return _wc.get(hex);
}

export const STYLE_GLSL = /* glsl */`
uniform float uTime;
uniform vec4 uWave;   // amp m, length m, speed m/s, hung sway m
uniform vec4 uCrest;  // world z of the scripted crest, its height, its half width, gust 0..1
uniform vec2 uPx;     // world size of one pixel at distance 1, least width of a thin mark in pixels
float fsHash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float fsNoise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.-2.*f);
  return mix(mix(fsHash(i), fsHash(i+vec2(1.,0.)), f.x), mix(fsHash(i+vec2(0.,1.)), fsHash(i+vec2(1.,1.)), f.x), f.y); }
// the billow of the floor cloth; everything standing on it adds this to its y
float clothWave(vec2 xz){
  float k = 6.2831853 / max(uWave.y, 1.);
  float a = sin(k*(xz.y - uWave.z*uTime) + 0.7*sin(xz.x*0.011 + 1.3));
  float b = sin(k*2.3*(xz.y*0.82 + xz.x*0.57) - uTime*0.45);
  float d = (xz.y - uCrest.x) / max(uCrest.z, 1.);
  return uWave.x*(0.40*a + 0.10*b) + uCrest.y*exp(-d*d);
}
`;
// fragment-only half of the style (uses fwidth): put after STYLE_GLSL in fragment shaders
export const STYLE_FRAG_GLSL = /* glsl */`
// laid and couched work. uv in metres: x along the lay, y across it. Returns a factor round 1 (mean 1).
float woolLaid(vec2 uv){
  float wander = (fsNoise(uv*vec2(0.03, 0.09)) - 0.5);            // the lay wanders
  float v = (uv.y + wander*0.6) / 0.14;
  float aT = 1. - smoothstep(0.20, 0.40, fwidth(v));               // threads go first
  float th = cos(6.2831853*v);
  float ub = uv.x/0.5 + 0.1*fsNoise(uv*vec2(0.9, 0.5)) + wander*0.5; // bars a tenth uneven
  float fb = fwidth(ub);
  float aB = 1. - smoothstep(0.22, 0.44, fb);                       // bars about four times farther
  float d = abs(fract(ub) - 0.5) * 0.5;                              // metres from the bar's middle
  float mpp = max(fb*0.5, 1e-4);
  float bar = clamp((0.04 - d)/mpp + 0.5, 0., 1.) * min(1., 0.08/mpp) * aB;
  float c = 1.022 + 0.07*th*aT;
  return mix(c, 0.86 + 0.10*th*aT, bar);
}
// stem stitch: s metres along the rope, q -1..1 across, hw its half width in metres
float stemRope(float s, float q, float hw){
  float ph = s/max(hw*2.8, 0.05) + q*0.5;
  float a = 1. - smoothstep(0.20, 0.40, fwidth(ph));
  return 1. + 0.09*cos(6.2831853*ph)*a - 0.05*a*smoothstep(0.55, 1., abs(q));
}
// tabby linen. uv in metres (warp along y). Mean 1; flat beyond about 25 m.
float linenWeave(vec2 uv){
  vec2 t = uv/0.08;
  vec2 fw = fwidth(t);
  float a = 1. - smoothstep(0.18, 0.36, max(fw.x, fw.y));
  float over = cos(6.2831853*t.x)*cos(6.2831853*t.y);            // over and under
  float slubW = step(0.90, fsHash(vec2(floor(t.y), 3.))) * (fsNoise(vec2(uv.x*0.4, floor(t.y))) - 0.3);
  float slubP = step(0.93, fsHash(vec2(floor(t.x), 7.))) * (fsNoise(vec2(uv.y*0.3, floor(t.x))) - 0.3);
  float fine = 0.055*over - 0.05*max(slubW, 0.) - 0.04*max(slubP, 0.) + 0.006;
  // coarse unevenness of the web, visible a little farther, then nothing
  vec2 cu = uv*vec2(0.5, 2.2);
  float a2 = 1. - smoothstep(0.10, 0.30, max(fwidth(cu.x), fwidth(cu.y)));
  float coarse = 0.022*(fsNoise(cu) - 0.5);
  // slubs: here and there a thick thread, a third of a metre wide and some metres long, seen much farther off
  vec2 sw = uv.yx*vec2(2.6, 0.16), sp = uv.yx*vec2(0.5, 2.6);
  float aw = 1. - smoothstep(0.22, 0.5, max(fwidth(sw.x), 4.*fwidth(sw.y))), ap = 1. - smoothstep(0.25, 0.55, fwidth(sp.y));
  float kw = step(0.86, fsHash(floor(sw) + 11.)), kp = step(0.90, fsHash(floor(sp) + 23.));
  vec2 fw2 = fract(sw), fp2 = fract(sp);
  float slW = kw*smoothstep(0., 0.3, fw2.x)*smoothstep(1., 0.7, fw2.x)*smoothstep(0., 0.2, fw2.y)*smoothstep(1., 0.8, fw2.y);
  float slP = kp*smoothstep(0., 0.3, fp2.y)*smoothstep(1., 0.7, fp2.y)*smoothstep(0., 0.2, fp2.x)*smoothstep(1., 0.8, fp2.x);
  // the web seen from the flight's height: bundles of eight threads, over and under
  vec2 tb = uv/0.64; vec2 fb2 = fwidth(tb);
  float a3 = 1. - smoothstep(0.16, 0.34, max(fb2.x, fb2.y));
  float broad = 0.03*cos(6.2831853*tb.x)*cos(6.2831853*tb.y)*a3;
  return 1. + fine*a + coarse*a2 + broad - 0.05*slW*aw - 0.008*slP*ap;
}
`;

const WOOL_VERT = /* glsl */`
attribute vec3 color; attribute vec2 aUv; attribute vec4 aK; attribute vec3 aPivot; attribute vec3 aSwing;
uniform vec3 uHang;   // 1 if hung from a rail, the rail's local y, the drop in metres
uniform float uSide;  // 1 the face, -1 the same work on the back of the cloth
uniform float uLie;   // 1 for work that lies on the floor cloth (water lines)
uniform float uRide;  // 1 rides the floor's billow (standing flats), 0 does not (things in the air)
uniform vec3 uLinen;
varying vec3 vCol; varying vec2 vUv; varying vec3 vK;
${STYLE_GLSL}
void main(){
  vec3 p = position; vec2 n = aK.zw; p.z *= uSide;
  if (abs(aPivot.z) > 1e-5) {                       // hinged part: turn in the flat's own plane
    float t = uTime*aSwing.x + aSwing.y, ang;
    if (aSwing.z < 0.5) ang = aPivot.z*sin(t);
    else ang = aPivot.z*(floor(t) + smoothstep(0., 0.3, fract(t)));   // by notches
    float c = cos(ang), s = sin(ang); mat2 R = mat2(c, s, -s, c);
    p.xy = aPivot.xy + R*(p.xy - aPivot.xy); n = R*n;
  }
  mat4 mm = modelMatrix;
  #ifdef USE_INSTANCING
  mm = modelMatrix*instanceMatrix;
  #endif
  vec4 wp = mm*vec4(p, 1.);
  vec3 zW = (mm*vec4(0., 0., 1., 0.)).xyz;
  if (uHang.x > 0.5) {                               // cloth on a rail: still at the rail, a metre at the hem
    float h = clamp((uHang.y - p.y)/max(uHang.z, 1.), 0., 2.);
    float sw = sin(uTime*0.55 + wp.x*0.013) + 0.35*sin(uTime*1.25 + wp.x*0.047 + 1.7);
    wp.xyz += zW*(uWave.w*h*(0.4 + 0.6*h)*sw*0.75);
    wp.y += 0.25*uWave.w*h*sin(uTime*0.8 + wp.x*0.021);
  } else {
    wp.y += clothWave(wp.xz)*uRide;
  }
  float hw = aUv.y;
  vec3 colr = color;
  float dist = length(cameraPosition - wp.xyz);
  float show = smoothstep(135., 185., dist);         // far-only work (the rows of oval heads) is not there near the eye
  if ((aK.x < 0.5 || aK.x > 1.5) && aK.y > 0.5) wp.xyz -= (mm*vec4(aK.zw, 0., 0.)).xyz*(1. - show);
  if (aK.x > 0.5 && aK.x < 1.5) {                    // stem-stitch rope: an outline is never thinner than uPx.y pixels
    float px = 0.5*uPx.y*uPx.x*dist;
    if (uLie > 0.5) {                                // a rope lying on the floor is seen foreshortened: widen a little, then let it go pale
      float need = px*dist/max(abs(cameraPosition.y - wp.y), 1.);
      px = min(need, 0.8);
      colr = mix(uLinen, color, clamp(max(aUv.y, px)/max(need, 1e-4), 0., 1.));
    }
    hw = max(aUv.y, px);
    if (aK.x > 1.2) {                                // inner lines (stays, lands, seams, hubs): they thin with distance and are gone
      float nat = 2.*aUv.y/max(uPx.x*dist, 1e-5);    // before they are half a pixel, leaving flat wool
      hw = max(aUv.y, 0.55*px)*smoothstep(0.38, 0.8, nat);
      if (aK.x > 1.32) hw = max(aUv.y, px)*show*(1. - smoothstep(520., 700., dist));
    }
    wp.xyz += normalize((mm*vec4(n, 0., 0.)).xyz + vec3(0., 1e-6, 0.))*(aK.y*hw);
  }
  vCol = colr; vUv = aUv; vK = vec3(aK.x, aK.y, hw);
  gl_Position = projectionMatrix*viewMatrix*wp;
}`;
const WOOL_FRAG = /* glsl */`
uniform vec3 uLinen;
varying vec3 vCol; varying vec2 vUv; varying vec3 vK;
${STYLE_GLSL}
${STYLE_FRAG_GLSL}
void main(){
  float laid = woolLaid(vUv);
  float rope = stemRope(vUv.x, vK.y, max(vUv.y, 0.02));
  // unfinished work: bare linen pricked with dots of the wool that was to come
  // the holes are pricked in ROWS along the lay, where the threads were to go (down a sail stripe, along a strake): a
  // row every 0.9 m with a hole every 0.45 m, so drawn work is hatched the way its filling would have run
  vec2 pf = fwidth(vUv); float f1 = max(pf.x, pf.y);
  float row = floor(vUv.y/0.9);
  vec2 g = vec2(vUv.x/0.45 + 0.5*mod(row, 2.), vUv.y/0.9);
  float dd = length((fract(g) - 0.5)*vec2(0.45, 0.9));
  float aP = 1. - smoothstep(0.07, 0.16, f1);
  float near_ = 1. - smoothstep(0.12, 0.12 + max(f1, 0.03), dd);
  // (seen from far the holes of a row run together into a pricked line; farther still every third row is read, then a tint)
  float hw1 = max(0.10, 0.55*f1);
  float l1 = (1. - smoothstep(hw1, hw1 + max(f1, 0.03), abs(fract(vUv.y/0.9) - 0.5)*0.9))*0.8;
  float hw3 = max(0.22, 0.6*f1);
  float l3 = (1. - smoothstep(hw3, hw3 + max(f1, 0.03), abs(fract(vUv.y/2.7 + 1./3.) - 0.5)*2.7))*0.85;
  float a1 = 1. - smoothstep(0.2, 0.34, f1), a3 = 1. - smoothstep(0.7, 1.1, f1);
  float far_ = mix(mix(0.2, l3, a3), l1, a1);
  float dot_ = mix(far_, near_, aP);
  float weave = linenWeave(vUv);
  vec3 col = vCol*laid;
  if (vK.x > 1.5) col = mix(uLinen*weave, vCol, dot_);
  else if (vK.x > 0.5) col = vCol*rope;
  gl_FragColor = vec4(col, 1.);
}`;
const LINEN_VERT = /* glsl */`
uniform vec3 uHang; uniform vec2 uMode;   // uMode.x: 0 weave in world xz, 1 in local xy; uMode.y: 1 rides the billow
varying vec2 vUv;
${STYLE_GLSL}
void main(){
  vec4 wp = modelMatrix*vec4(position, 1.);
  vUv = uMode.x > 0.5 ? position.xy : wp.xz;
  if (uHang.x > 0.5) {
    vec3 zW = (modelMatrix*vec4(0., 0., 1., 0.)).xyz;
    float h = clamp((uHang.y - position.y)/max(uHang.z, 1.), 0., 2.);
    float sw = sin(uTime*0.55 + wp.x*0.013) + 0.35*sin(uTime*1.25 + wp.x*0.047 + 1.7);
    wp.xyz += zW*(uWave.w*h*(0.4 + 0.6*h)*sw*0.75);
    wp.y += 0.25*uWave.w*h*sin(uTime*0.8 + wp.x*0.021);
  } else if (uMode.y > 0.5) wp.y += clothWave(wp.xz);
  gl_Position = projectionMatrix*viewMatrix*wp;
}`;
const LINEN_FRAG = /* glsl */`
uniform vec3 uLinen; varying vec2 vUv;
${STYLE_GLSL}
${STYLE_FRAG_GLSL}
void main(){ gl_FragColor = vec4(uLinen*linenWeave(vUv), 1.); }`;
// free wool ends: ribbons modelled hanging plumb from their root; aT 0 at the root, 1 at the tip
const THREAD_VERT = /* glsl */`
attribute vec3 color; attribute vec4 aT;   // t along, side -1/1, length m, phase
attribute vec2 aW;                          // half width m, lean of the comb (x per metre of drop)
uniform vec3 uHang; uniform float uPlumb;   // uPlumb: the weather's plumb 0..1 (1 = hangs straight)
uniform float uRide;                        // 1: the root stands on the floor cloth and rides its billow
varying vec3 vCol; varying vec3 vK;
${STYLE_GLSL}
void main(){
  float t = aT.x, L = aT.z, ph = aT.w;
  vec3 p = position;
  vec4 wp = modelMatrix*vec4(p, 1.);
  vec3 zW = (modelMatrix*vec4(0., 0., 1., 0.)).xyz, xW = (modelMatrix*vec4(1., 0., 0., 0.)).xyz;
  if (uHang.x > 0.5) {                               // the root rides the hung cloth
    float h = clamp((uHang.y - (p.y + t*L))/max(uHang.z, 1.), 0., 2.);
    float sw = sin(uTime*0.55 + wp.x*0.013) + 0.35*sin(uTime*1.25 + wp.x*0.047 + 1.7);
    wp.xyz += zW*(uWave.w*h*(0.4 + 0.6*h)*sw*0.75);
  }
  wp.y += clothWave((modelMatrix*vec4(p.x, 0., p.z, 1.)).xz)*uRide;
  float loose = 1. - uPlumb, g = uCrest.w;
  float tt = t*t;
  // sway of a free end: slow swing plus a travelling ripple, more toward the tip; the gust streams it to port
  float s1 = sin(uTime*0.9 + ph*6.2831853 + wp.x*0.05), s2 = sin(uTime*2.1 + ph*17. - t*5.0);
  wp.xyz += zW*(L*tt*(0.10*s1 + 0.035*s2)*(0.3 + loose));
  wp.xyz += xW*(L*tt*(0.05*sin(uTime*0.7 + ph*9.) - (0.10 + 0.5*g)*loose) + L*t*aW.y);
  wp.y += L*tt*(0.03 + 0.25*g)*loose;
  // wool is crimped: a free end never hangs ruler-straight, it waves a little all the way down
  float cr = smoothstep(0., 0.2, t)*min(L, 30.)*0.02;
  wp.xyz += xW*(cr*sin(t*(6. + 5.*fract(ph*7.31)) + ph*40.)) + zW*(cr*0.6*sin(t*(5. + 4.*fract(ph*3.77)) + ph*23.));
  vec3 d = wp.xyz - cameraPosition;       // (read only to turn the ribbon's face to the eye and to keep it a mark wide: no free end is placed by the eye)
  float dist = length(cameraPosition - wp.xyz);
  float hw = max(aW.x, 0.5*uPx.y*uPx.x*dist);
  vec3 sd = vec3(d.z, 0., -d.x); float sl = length(sd);      // the ribbon faces the eye
  if (sl > 1e-3) sd /= sl; else sd = xW;
  wp.xyz += sd*(aT.y*hw);
  vCol = color; vK = vec3(t*L, aT.y, aW.x);
  gl_Position = projectionMatrix*viewMatrix*wp;
}`;
const THREAD_FRAG = /* glsl */`
varying vec3 vCol; varying vec3 vK;
${STYLE_GLSL}
${STYLE_FRAG_GLSL}
void main(){ gl_FragColor = vec4(vCol*stemRope(vK.x, vK.y, max(vK.z, 0.02)), 1.); }`;

const WEATHER = { still: [0.8, 0.35, 1.0, 0.0], draught: [2.5, 1.0, 0.25, 0.25], gale: [4.0, 2.4, 0.0, 0.75] };  // billow, sway, plumb, gust floor
export function makeStyle(ctx, opts = {}) {
  const linen = new THREE.Color((opts.palette && opts.palette[0]) || WOOLS.linen);
  const U = {
    uTime: { value: 0 }, uWave: { value: new THREE.Vector4(2.5, 240, 14, 1.0) },
    uCrest: { value: new THREE.Vector4(-420, 0, 60, 0) }, uPx: { value: new THREE.Vector2(0.0016, 1.6) },
    uLinen: { value: linen }, uPlumb: { value: 0.25 },
  };
  const size = new THREE.Vector2(1280, 720);
  let gustFloor = 0.25, prog = 0;
  const mk = (vs, fs, extra, o) => new THREE.ShaderMaterial({
    vertexShader: vs, fragmentShader: fs, side: THREE.DoubleSide, fog: false, toneMapped: false,
    uniforms: { ...U, uHang: { value: new THREE.Vector3(o && o.hung ? 1 : 0, o && o.hung ? o.hung[0] : 0, o && o.hung ? o.hung[1] : 1) }, ...extra },
  });
  const style = {
    uniforms: U,
    wool: (o) => mk(WOOL_VERT, WOOL_FRAG, { uSide: { value: o && o.side < 0 ? -1 : 1 }, uRide: { value: o && o.ride === 0 ? 0 : 1 }, uLie: { value: o && o.lie ? 1 : 0 } }, o),
    linen: (o = {}) => mk(LINEN_VERT, LINEN_FRAG, { uMode: { value: new THREE.Vector2(o.plane === 'xy' ? 1 : 0, o.ride ? 1 : 0) } }, o),
    thread: (o) => mk(THREAD_VERT, THREAD_FRAG, { uRide: { value: o && o.ride ? 1 : 0 } }, o),
    setWeather(w) { const k = WEATHER[w] || WEATHER.draught; U.uWave.value.x = k[0]; U.uWave.value.w = k[1]; U.uPlumb.value = k[2]; gustFloor = k[3]; U.uCrest.value.w = gustFloor; },
    // u of the flight: the scripted crest runs down the course at z = 2600u - 420 and its gust rides with it
    setProgress(u) { prog = u; U.uCrest.value.x = 2600*u - 420; U.uCrest.value.y = U.uWave.value.x*0.9*Math.min(1, Math.max(0, (u - 0.2)*8)); },
    setGust(g) { U.uCrest.value.w = Math.max(gustFloor, g); },
    update(time, camera, renderer) {
      U.uTime.value = time;
      if (renderer && renderer.getDrawingBufferSize) renderer.getDrawingBufferSize(size);
      const e = camera && camera.projectionMatrix ? camera.projectionMatrix.elements[5] : 1.7;
      U.uPx.value.x = 2/(Math.max(e, 0.05)*Math.max(size.y, 100));
    },
  };
  style.setWeather(opts.weather || 'draught');
  return style;
}

// closed (or open) Catmull-Rom through control points [[x,y],...], n samples a span
// setSmooth(k): scales the samples of every smoothLoop that follows (for small or far work); set it back to 1 at once
let _smooth = 1;
export function setSmooth(k) { _smooth = k; }
export function smoothLoop(pts, n = 5, closed = true) {
  n = Math.max(2, Math.round(n*_smooth));
  const out = [], N = pts.length, last = closed ? N : N - 1;
  const P = (i) => closed ? pts[((i % N) + N) % N] : pts[Math.min(N - 1, Math.max(0, i))];
  for (let i = 0; i < last; i++) {
    const a = P(i - 1), b = P(i), c = P(i + 1), d = P(i + 2);
    for (let k = 0; k < n; k++) {
      const t = k/n, t2 = t*t, t3 = t2*t;
      out.push([
        0.5*(2*b[0] + (c[0] - a[0])*t + (2*a[0] - 5*b[0] + 4*c[0] - d[0])*t2 + (3*b[0] - a[0] - 3*c[0] + d[0])*t3),
        0.5*(2*b[1] + (c[1] - a[1])*t + (2*a[1] - 5*b[1] + 4*c[1] - d[1])*t2 + (3*b[1] - a[1] - 3*c[1] + d[1])*t3)]);
    }
  }
  if (!closed) out.push(pts[N - 1].slice());
  return out;
}

// Collects flats (laid fillings and stem-stitch ropes) into one geometry for style.wool().
export class FlatBuilder {
  constructor() {
    this.pos = []; this.col = []; this.uv = []; this.k = []; this.piv = []; this.sw = []; this.idx = [];
    this.tx = 0; this.ty = 0; this.ts = 1; this.td = 1; this.h = [0, 0, 0, 0, 0, 0]; this.z = 0.12; this.nv = 0;
    this.zb = 0;        // plane offset: what follows stands zb metres toward the viewer (one mesh, many ranks)
    this.kind = 0;      // default filling: 0 laid, 2 pricked (unfinished work)
    this.cls = 0;       // what follows is: 0 plain, 1 inner line work (thins and goes with distance), 2 far-only (not there near the eye)
    this.kindFn = null; // half-worked things: (wool) -> 0 | 2, asked for every filling that names no kind of its own
    this.line2 = null;  // the wool an unfinished shape is drawn in (null: the wool that was to fill it)
  }
  _kind(wool) { return this.kindFn && typeof wool === 'string' && wool !== 'linen' ? this.kindFn(wool) : this.kind; }
  // place what follows at (x, y), scaled s, mirrored if dir < 0
  at(x = 0, y = 0, s = 1, dir = 1) { this.z = 0.1; this.tx = x; this.ty = y; this.ts = s; this.td = dir < 0 ? -1 : 1; return this; }
  // what follows swings about (px, py) by amp radians: mode 0 sine at freq rad/s, mode 1 a notch of amp every 1/freq s
  hinge(px = 0, py = 0, amp = 0, freq = 1, phase = 0, mode = 0) {
    this.h = [this.tx + px*this.ts*this.td, this.ty + py*this.ts, amp*this.td, freq, phase, mode]; return this;
  }
  noHinge() { this.h = [0, 0, 0, 0, 0, 0]; return this; }
  _map(p) { return [this.tx + p[0]*this.ts*this.td, this.ty + p[1]*this.ts]; }
  _v(x, y, z, c, u, v, k0, k1, k2, k3) {
    this.pos.push(x, y, z + this.zb); this.col.push(c.r, c.g, c.b); this.uv.push(u, v); this.k.push(k0, k1, k2, k3);
    const h = this.h; this.piv.push(h[0], h[1], h[2]); this.sw.push(h[3], h[4], h[5]);
    return this.nv++;
  }
  // laid filling of a closed outline. lay = angle of the threads (radians, in the piece's own frame);
  // opts: inset (m, stops short of the outline), kind (0 laid, 2 pricked/unfinished), z
  fill(points, wool, lay = 0, opts = {}) {
    const c = wool.isColor ? wool : woolColor(wool);
    let pts = points.map((p) => this._map(p));
    const inset = opts.inset ?? 0.3, n = pts.length;
    if (inset > 0 && n > 2) {
      let area = 0; for (let i = 0; i < n; i++) { const a = pts[i], b = pts[(i + 1) % n]; area += a[0]*b[1] - b[0]*a[1]; }
      const sg = area > 0 ? 1 : -1;
      pts = pts.map((p, i) => {
        const a = pts[(i + n - 1) % n], b = pts[(i + 1) % n];
        let dx = b[0] - a[0], dy = b[1] - a[1]; const l = Math.hypot(dx, dy) || 1; dx /= l; dy /= l;
        return [p[0] - dy*inset*sg, p[1] + dx*inset*sg];
      });
    }
    const la = this.td < 0 ? Math.PI - lay : lay, cl = Math.cos(la), sl = Math.sin(la);
    const z = opts.z ?? (this.z += 0.012), base = this.nv, kind = opts.kind ?? this._kind(wool);
    const v2 = pts.map((p) => new THREE.Vector2(p[0], p[1]));
    let cx = 0, cy = 0; if (this.cls === 2) { for (const p of pts) { cx += p[0]/pts.length; cy += p[1]/pts.length; } }
    for (const p of pts) this._v(p[0], p[1], z, c, p[0]*cl + p[1]*sl, -p[0]*sl + p[1]*cl, kind, this.cls === 2 ? 1 : 0, this.cls === 2 ? p[0] - cx : 0, this.cls === 2 ? p[1] - cy : 0);
    const tris = THREE.ShapeUtils.triangulateShape(v2, []);
    for (const t of tris) this.idx.push(base + t[0], base + t[1], base + t[2]);
    return this;
  }
  // stem-stitch rope along a polyline; width in metres (not scaled by at()); opts: closed, z, s0
  rope(points, wool, width = 0.3, opts = {}) {
    const c = wool.isColor ? wool : woolColor(wool);
    const pts = points.map((p) => this._map(p)), n = pts.length, closed = !!opts.closed;
    if (n < 2) return this;
    const z = opts.z ?? (this.z += 0.012), hw = width*0.5, k0 = this.cls === 2 ? 1.4 : this.cls === 1 ? 1.25 : 1;
    let s = opts.s0 ?? 0, first = -1, prev = -1;
    const m = closed ? n + 1 : n;
    for (let j = 0; j < m; j++) {
      const i = j % n, p = pts[i];
      const a = closed ? pts[(i + n - 1) % n] : pts[Math.max(0, i - 1)], b = closed ? pts[(i + 1) % n] : pts[Math.min(n - 1, i + 1)];
      let dx = b[0] - a[0], dy = b[1] - a[1]; const l = Math.hypot(dx, dy) || 1; dx /= l; dy /= l;
      if (j > 0) { const q = pts[(j - 1) % n]; s += Math.hypot(p[0] - q[0], p[1] - q[1]); }
      const v0 = this._v(p[0], p[1], z, c, s, hw, k0, -1, -dy, dx);
      this._v(p[0], p[1], z, c, s, hw, k0, 1, -dy, dx);
      if (prev >= 0) this.idx.push(prev, prev + 1, v0, prev + 1, v0 + 1, v0);
      prev = v0; if (first < 0) first = v0;
    }
    return this;
  }
  // a filling with its outline in a second wool (the outline overshoots nothing: closed loop)
  shape(points, wool, lineWool, lay = 0, opts = {}) {
    const kind = opts.kind ?? this._kind(wool);
    this.fill(points, wool, lay, opts.kind === kind ? opts : { ...opts, kind });
    // unfinished (pricked) work is drawn in the wool that was to fill it (or in line2: the dark line of work only drawn)
    if (kind === 2 && typeof wool === 'string' && wool !== 'linen') lineWool = this.line2 || wool;
    return this.rope(points, lineWool, opts.width ?? 0.3, { closed: true, z: opts.z !== undefined ? opts.z + 0.012 : undefined });
  }
  disc(cx, cy, r, wool, lineWool, lay = 0, seg = 20, opts = {}) {
    const pts = []; for (let i = 0; i < seg; i++) { const a = i/seg*Math.PI*2; pts.push([cx + Math.cos(a)*r, cy + Math.sin(a)*r]); }
    return lineWool ? this.shape(pts, wool, lineWool, lay, opts) : this.fill(pts, wool, lay, opts);
  }
  get triangles() { return this.idx.length/3; }
  build() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.pos, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(this.col, 3));
    g.setAttribute('aUv', new THREE.Float32BufferAttribute(this.uv, 2));
    g.setAttribute('aK', new THREE.Float32BufferAttribute(this.k, 4));
    g.setAttribute('aPivot', new THREE.Float32BufferAttribute(this.piv, 3));
    g.setAttribute('aSwing', new THREE.Float32BufferAttribute(this.sw, 3));
    g.setIndex(this.nv > 65535 ? new THREE.Uint32BufferAttribute(this.idx, 1) : new THREE.Uint16BufferAttribute(this.idx, 1));
    g.computeBoundingSphere(); if (g.boundingSphere) g.boundingSphere.radius += 12;
    return g;
  }
}

// ---- motifs of the border -------------------------------------------------------------------------------------
const LINE_FOR = { terracotta: 'dark', bluegreen: 'dark', gold: 'terracotta', olive: 'dark', blue: 'gold', dark: 'terracotta', sage: 'bluegreen', buff: 'terracotta', linen: 'dark' };
export const lineFor = (w) => LINE_FOR[w] || 'dark';
// a tapering band round a centre line -> closed outline
export function band(cl, w0, w1) {
  const L = [], R = [], n = cl.length;
  for (let i = 0; i < n; i++) {
    const a = cl[Math.max(0, i - 1)], b = cl[Math.min(n - 1, i + 1)];
    let dx = b[0] - a[0], dy = b[1] - a[1]; const l = Math.hypot(dx, dy) || 1; dx /= l; dy /= l;
    const w = (w0 + (w1 - w0)*i/(n - 1))*0.5;
    L.push([cl[i][0] - dy*w, cl[i][1] + dx*w]); R.push([cl[i][0] + dy*w, cl[i][1] - dx*w]);
  }
  return L.concat(R.reverse());
}
const LEG = [[-1.5, 1], [1.5, 1], [1.4, -3], [0.6, -5.4], [0.9, -7], [2.7, -7.3], [2.9, -8.3], [-0.5, -8.3], [-1.0, -6], [-0.7, -3.4]];
function leg(fb, hx, hy, wool, line, phase, hock, len = 1) {
  const pts = LEG.map((p, i) => [hx + (p[0] - (i === 3 || i === 8 || i === 9 ? hock : 0))*len, hy + p[1]*len]);
  fb.hinge(hx, hy, 0.2, 2.4, phase);
  fb.shape(smoothLoop(pts, 3), wool, line, Math.PI/2);
  fb.rope([[hx + 1.5*len, hy - 7.9*len], [hx + 2.8*len, hy - 7.8*len]], line, 0.2);   // toes
  fb.noHinge();
}
function eye(fb, x, y, r, line) { fb.disc(x, y, r, 'linen', line, 0, 8, { inset: 0 }); }
// lion (kind 0) or hound (kind 1), 24 m long at s = 1, feet at y = 0, facing +x. wools: { a, b } near and far wool
export function beastLion(fb, x, y, s, dir, wools, phase = 0, kind = 0) {
  const A = wools.a, B = wools.b, ln = wools.line || lineFor(A), lb = lineFor(B) === A ? 'dark' : lineFor(B);
  fb.at(x, y, s, dir);
  leg(fb, -5.6, 8.3, B, lb, phase + Math.PI, 0.9); leg(fb, 7.0, 8.6, B, lb, phase, 0);        // far legs, other wool
  // tail curled over the back
  fb.hinge(-9, 10.5, 0.06, 1.1, phase);
  const tail = kind === 0
    ? smoothLoop([[-9.0, 10.4], [-11.6, 10.8], [-12.8, 13.4], [-11.6, 16.6], [-8.6, 17.8], [-5.6, 16.8], [-4.6, 15.0]], 4, false)
    : smoothLoop([[-9.0, 10.8], [-11.8, 11.6], [-13.2, 14.5], [-12.4, 17.6], [-10.6, 18.4]], 4, false);
  fb.shape(band(tail, 1.3, 0.7), A, ln, 0.6, { inset: 0.2 });
  if (kind === 0) fb.shape(smoothLoop([[-4.9, 15.4], [-3.2, 16.6], [-1.6, 15.6], [-2.6, 14.6], [-1.4, 13.4], [-3.4, 13.0], [-4.4, 13.9]], 3), B, lb, 0.8);
  fb.noHinge();
  const body = [[-9.2, 9.6], [-8.0, 12.6], [-3, 11.9], [2, 12.1], [5.6, 13.6], [7.8, 12], [7.2, 8.2], [4.4, 6.4], [-1, 7.2 + kind*0.8], [-5, 6.2], [-8.6, 6.6]];
  fb.shape(smoothLoop(body, 4), A, ln, 0.04);
  leg(fb, -7.2, 8.2, A, ln, phase, 0.9); leg(fb, 5.4, 8.6, A, ln, phase + Math.PI, 0);          // near legs
  fb.hinge(6, 12.5, 0.05, 1.2, phase + 1);
  const head = kind === 0
    ? [[5.4, 12.2], [4.8, 16], [6.4, 18.8], [9, 19.4], [11.3, 18.2], [12.6, 16.4], [11.9, 15.3], [12.3, 14.0], [10.5, 13.4], [8.6, 12.6], [7.6, 11.2]]
    : [[5.6, 12.2], [5.6, 15.6], [7.0, 18.2], [9.2, 18.6], [11.4, 17.6], [14.4, 17.0], [14.6, 16.0], [12.2, 15.6], [14.0, 14.6], [13.4, 14.0], [10.2, 14.0], [8.4, 12.4], [7.6, 11.0]];
  // a lion's mane: a scalloped ruff in the far wool round the neck and down the chest, under the head
  if (kind === 0) fb.shape(smoothLoop([[5.0, 19.0], [3.5, 17.6], [4.3, 16.0], [2.9, 14.4], [4.1, 12.9], [3.3, 11.2], [4.9, 10.2], [5.3, 8.4], [7.1, 8.9], [8.9, 8.6], [9.3, 10.6], [8.3, 12.4], [6.6, 14.6], [6.3, 17.2]], 3), B, lb, 1.3, { inset: 0.16 });
  fb.shape(smoothLoop(head, 4), A, ln, 1.1);
  if (kind === 0) {
    for (let i = 0; i < 4; i++) {                                                             // mane: curls in the far wool
      const mx = 5.6 + i*0.5, my = 17.4 - i*1.5;
      fb.rope(smoothLoop([[mx + 1.6, my + 0.5], [mx + 0.2, my + 0.3], [mx - 0.5, my - 0.8], [mx + 0.5, my - 1.3]], 3, false), B, 0.34);
    }
    fb.shape(smoothLoop([[6.0, 18.6], [6.3, 20.8], [7.9, 19.6]], 3), B, ln, 1.4, { inset: 0.15 });
    fb.rope(smoothLoop([[11.4, 14.8], [12.8, 14.6], [13.6, 13.6]], 3, false), B === 'terracotta' ? 'gold' : 'terracotta', 0.4);
  } else {
    fb.shape(smoothLoop([[6.6, 18.0], [5.2, 17.2], [4.4, 14.6], [5.6, 14.2], [7.2, 16.2]], 3), B, lb, 1.4, { inset: 0.15 });
    fb.rope([[5.8, 12.6], [8.0, 11.6]], B, 0.6);                                              // collar
  }
  eye(fb, 9.5, 17.0 - kind*0.3, 0.5, ln);
  return fb.noHinge().at();
}
export const beastHound = (fb, x, y, s, dir, wools, phase = 0) => beastLion(fb, x, y, s, dir, wools, phase, 1);
// long-necked bird, 26 m beak to tail at s = 1
export function beastBird(fb, x, y, s, dir, wools, phase = 0) {
  const A = wools.a, B = wools.b, ln = wools.line || lineFor(A), lb = lineFor(B) === A ? 'dark' : lineFor(B);
  fb.at(x, y, s, dir);
  const foot = (hx, w, ph) => {
    fb.hinge(hx, 5.2, 0.16, 2.4, ph);
    fb.rope([[hx, 5.4], [hx + 0.5, 2.6], [hx + 0.2, 0.3]], w, 0.5);
    fb.rope([[hx - 1.2, 0.15], [hx + 0.2, 0.3], [hx + 2.2, 0.15]], w, 0.34); fb.rope([[hx + 0.2, 0.3], [hx + 1.7, 1.0]], w, 0.3);
    fb.noHinge();
  };
  foot(1.6, B, phase + Math.PI);
  fb.shape(smoothLoop([[-3.5, 8.6], [-9, 10.2], [-12.2, 8.8], [-11.6, 7.5], [-8.6, 7.7], [-12.4, 6.0], [-11.8, 5.0], [-8.0, 5.7], [-10.6, 3.5], [-9.7, 2.7], [-4.0, 5.2]], 3), B, lb, 0.15);
  const neck = smoothLoop([[4.2, 8.4], [7.6, 10.4], [8.7, 13.6], [6.9, 16.6], [7.3, 19.2], [9.2, 20.4]], 4, false);
  fb.hinge(5, 9, 0.05, 1.3, phase);
  fb.shape(band(neck, 2.6, 1.3), A, ln, 1.2, { inset: 0.2 });
  fb.shape(smoothLoop([[10.4, 21.3], [14.0, 20.3], [10.5, 19.6]], 2), B === 'gold' ? 'terracotta' : 'gold', ln, 0, { inset: 0.12 });
  fb.disc(9.6, 20.5, 1.5, A, ln, 0.4, 10, { inset: 0.2 }); eye(fb, 9.9, 20.8, 0.42, ln);
  fb.noHinge();
  fb.shape(smoothLoop([[-4.4, 8.2], [0, 10.8], [4.6, 10.2], [6.2, 8], [4, 5.4], [0, 4.4], [-4.2, 5.4]], 4), A, ln, 0.1);
  foot(-0.4, A, phase);
  fb.hinge(3.4, 9.2, 0.14, 1.7, phase + 0.6);                                                   // the wing lifts
  fb.shape(smoothLoop([[4.6, 9.4], [1.5, 11.6], [-3.2, 10.6], [-7.6, 7.2], [-8.4, 5.4], [-4.4, 6.0], [1.0, 6.6]], 4), B, lb, 0.35);
  for (let i = 0; i < 3; i++) fb.rope(smoothLoop([[2.4 - i*1.9, 9.8 - i*0.3], [-0.6 - i*1.9, 8.6 - i*0.4], [-3.4 - i*1.4, 6.6 - i*0.2]], 3, false), lb, 0.26);
  return fb.noHinge().at();
}
// wyvern: two legs, a raised wing, a knotted tail; 26 m at s = 1
export function beastWyvern(fb, x, y, s, dir, wools, phase = 0) {
  const A = wools.a, B = wools.b, ln = wools.line || lineFor(A), lb = lineFor(B) === A ? 'dark' : lineFor(B);
  fb.at(x, y, s, dir);
  leg(fb, 3.6, 6.2, B, lb, phase + Math.PI, 0, 0.74);
  fb.hinge(-4, 7, 0.07, 1.0, phase);
  const tail = smoothLoop([[-3.6, 7.2], [-8, 7.8], [-11.2, 5.8], [-11.8, 2.8], [-9.2, 1.3], [-6.9, 2.9], [-8.2, 4.8], [-10.2, 3.9]], 4, false);
  fb.shape(band(tail, 2.6, 0.7), A, ln, 0.2, { inset: 0.2 });
  fb.shape(smoothLoop([[-10.2, 3.9], [-9.4, 5.2], [-8.4, 3.6], [-9.6, 2.8]], 3), B, lb, 0.5, { inset: 0.12 });
  fb.noHinge();
  fb.hinge(1, 10.4, 0.16, 1.5, phase + 0.4);                                                    // wing
  fb.shape(smoothLoop([[-1.2, 10], [-3.4, 17.2], [0.8, 19.8], [1.9, 16.2], [4.4, 17.8], [4.6, 13.6], [3.6, 10.4]], 4), B, lb, 1.5);
  fb.rope([[0.6, 10.6], [-0.6, 17.6]], lb, 0.26); fb.rope([[2.2, 10.8], [2.6, 16.4]], lb, 0.26);
  fb.noHinge();
  fb.shape(smoothLoop([[-5, 7], [-2, 10.6], [3, 11.2], [6.2, 9.2], [5.2, 6], [1, 4.8], [-3, 5]], 4), A, ln, 0.1);
  leg(fb, 1.6, 6.0, A, ln, phase, 0, 0.74);
  fb.hinge(5, 9, 0.06, 1.2, phase);
  fb.shape(band(smoothLoop([[4.4, 8.8], [7.4, 11.2], [7.6, 14.4], [8.2, 16.8]], 4, false), 3.0, 1.9), A, ln, 1.3, { inset: 0.2 });
  fb.shape(smoothLoop([[7.2, 16.6], [8.2, 19.6], [11, 19.8], [14.2, 18.8], [13.8, 18.0], [11.4, 17.9], [13.5, 16.2], [12.9, 15.5], [9.4, 15.6]], 3), A, ln, 0.2);
  fb.shape(smoothLoop([[8.0, 19.4], [7.2, 21.6], [9.2, 20.2]], 2), B, lb, 1.4, { inset: 0.12 });
  eye(fb, 9.9, 18.4, 0.45, ln);
  return fb.noHinge().at();
}
// three-leaf sprig, h metres tall, standing at (x, y)
export function sprig(fb, x, y, h, wool, leafWool) {
  fb.at(x, y, h/10, 1);
  const lw = lineFor(leafWool);
  fb.rope(smoothLoop([[0, 0], [0.3, 3], [-0.2, 6.4]], 3, false), wool, 0.4);
  fb.rope(smoothLoop([[0.2, 2.6], [1.8, 4.2], [2.6, 5.6]], 3, false), wool, 0.34); fb.rope(smoothLoop([[0.1, 3.2], [-1.6, 4.4], [-2.6, 5.4]], 3, false), wool, 0.34);
  const leaf = (cx, cy, a) => { const c = Math.cos(a), s = Math.sin(a);
    fb.shape(smoothLoop([[0, -0.2], [1.3, 1.2], [0.9, 2.6], [0, 3.7], [-0.9, 2.6], [-1.3, 1.2]], 3).map((p) => [cx + p[0]*c - p[1]*s, cy + p[0]*s + p[1]*c]), leafWool, lw, a + Math.PI/2, { inset: 0.15 }); };
  leaf(-0.2, 6.2, 0); leaf(2.6, 5.4, -0.7); leaf(-2.6, 5.2, 0.7);
  return fb.at();
}
// a pair of slanted bars between two ropes at y0 and y1, leaning lean metres over their height
export function slantBars(fb, x, y0, y1, lean, woolA, woolB, w = 1.7, gap = 5.2) {
  fb.at();
  for (let i = 0; i < 2; i++) {
    const xo = x + (i - 0.5)*gap, wl = i ? woolB : woolA;
    const pts = [[xo - lean/2 - w/2, y0 + 0.5], [xo - lean/2 + w/2, y0 + 0.5], [xo + lean/2 + w/2, y1 - 0.5], [xo + lean/2 - w/2, y1 - 0.5]];
    fb.shape(pts, wl, lineFor(wl), Math.atan2(y1 - y0, lean), { inset: 0.25 });
  }
  return fb;
}

// free wool ends for style.thread(): threads = [{ x, y, z, len, wool, lean, phase, width }], hanging from (x, y, z)
export function makeFringe(threads, segs = 12) {
  const n = threads.length, vc = n*(segs + 1)*2;
  const pos = new Float32Array(vc*3), col = new Float32Array(vc*3), aT = new Float32Array(vc*4), aW = new Float32Array(vc*2);
  const idx = new (vc > 65535 ? Uint32Array : Uint16Array)(n*segs*6);
  let v = 0, ii = 0;
  for (const th of threads) {
    const c = th.wool.isColor ? th.wool : woolColor(th.wool);
    for (let j = 0; j <= segs; j++) {
      const t = j/segs;
      for (let sd = -1; sd <= 1; sd += 2) {
        pos[v*3] = th.x; pos[v*3 + 1] = th.y - t*th.len; pos[v*3 + 2] = th.z ?? 0.4;
        col[v*3] = c.r; col[v*3 + 1] = c.g; col[v*3 + 2] = c.b;
        aT[v*4] = t; aT[v*4 + 1] = sd; aT[v*4 + 2] = th.len; aT[v*4 + 3] = th.phase ?? 0;
        aW[v*2] = (th.width ?? 0.36)*0.5*(1 - 0.35*t*t); aW[v*2 + 1] = th.lean ?? 0;
        v++;
      }
      if (j < segs) { const b = v - 2; idx[ii++] = b; idx[ii++] = b + 1; idx[ii++] = b + 2; idx[ii++] = b + 1; idx[ii++] = b + 3; idx[ii++] = b + 2; }
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  g.setAttribute('aT', new THREE.BufferAttribute(aT, 4)); g.setAttribute('aW', new THREE.BufferAttribute(aW, 2));
  g.setIndex(new THREE.BufferAttribute(idx, 1));
  g.computeBoundingSphere(); if (g.boundingSphere) g.boundingSphere.radius += 30;
  return g;
}

// THE ARCH IN A FRINGE (a law of place, run once at build; nothing here reads the camera). threads as for makeFringe,
// in their mesh's own frame; eye: the eye's places through them in that frame, flat [x, y, z, ...], a quarter metre
// apart; o: { sway, plumb, gust (the weather's own: WEATHER[w][1..3]), hung ([railY, drop] of the cloth the roots ride,
// or null), segs (as given to makeFringe), clear (m) }. A free end whose reach, at any phase of its swing in this
// weather, would come within o.clear of the eye's line is made SHORTER: to the first clear length under its own, found
// by half metres and then to 2 mm. None is lengthened, moved or added; an end with no clear length at all would get the
// length 0 and draw nothing (on the star there is none: the shortest length left is about 11 m). A shortened end is a free
// end like the rest: the same wool, width and sway. The reach is counted as THREAD_VERT places it: each row of the ribbon
// is a box in plan (along the cloth by the 0.05 swing; square to the cloth, along the course, by the 0.10 and 0.035
// swings and the hung cloth's own sway) at a height the clock does not move, about a middle the gust, the lean and the
// crimp set, and as thick as the ribbon is wide. THE GUST COUNTED IS THE WEATHER'S OWN FLOOR (o.gust): that holds while
// the world's crest gust stays under the floor where the eye passes the fringe (in this world the crest comes some 80 m
// beyond the cloth); a world that gusts at the pass must give that gust here. The numbers here repeat THREAD_VERT's and
// makeFringe's by hand: they change together or the count is wrong.
function fringeClear(th, len, eye, o) {
  const loose = 1 - o.plumb, ph = th.phase ?? 0, lean = th.lean ?? 0, w2 = (th.width ?? 0.36)*0.5, z0 = th.z ?? 0.4, segs = o.segs, SUB = 4;
  const fr = (x) => x - Math.floor(x), sst = (x) => { const t = Math.max(0, Math.min(1, x/0.2)); return t*t*(3 - 2*t); };
  const h = o.hung ? Math.min(2, Math.max(0, (o.hung[0] - th.y)/Math.max(o.hung[1], 1))) : 0, az0 = o.hung ? o.sway*h*(0.4 + 0.6*h)*1.35*0.75 : 0;
  const fx = 6 + 5*fr(ph*7.31), fz = 5 + 4*fr(ph*3.77), crK = Math.min(len, 30)*0.02;
  let px = 0, py = 0, pz = 0, pax = 0, paz = 0, pr = 0;
  for (let j = 0; j <= segs; j++) {
    const t = j/segs, tt = t*t, cr = sst(t)*crK;
    const x = th.x - len*tt*(0.10 + 0.5*o.gust)*loose + len*t*lean + cr*Math.sin(t*fx + ph*40), y = th.y - t*len + len*tt*(0.03 + 0.25*o.gust)*loose, z = z0 + cr*0.6*Math.sin(t*fz + ph*23);
    const ax = len*tt*0.05, az = len*tt*0.135*(0.3 + loose) + az0, r = w2*(1 - 0.35*tt) + o.clear;
    for (let k = j ? 1 : SUB; k <= SUB; k++) {   // the ribbon is straight between its rows: four places a span
      const f = j ? k/SUB : 1, bx = px + (x - px)*f, by = py + (y - py)*f, bz = pz + (z - pz)*f, bax = pax + (ax - pax)*f, baz = paz + (az - paz)*f, br = pr + (r - pr)*f;
      for (let i = 0; i < eye.length; i += 3) {
        const dz = Math.max(Math.abs(eye[i + 2] - bz) - baz, 0); if (dz >= br) continue;
        const dx = Math.max(Math.abs(eye[i] - bx) - bax, 0), dy = eye[i + 1] - by; if (dx*dx + dy*dy + dz*dz < br*br) return false;
      }
    }
    px = x; py = y; pz = z; pax = ax; paz = az; pr = r;
  }
  return true;
}
export function trimToRoute(threads, eye, o) {
  const STEP = 0.5, CUTS = 8, lift = 1 - (0.03 + 0.25*o.gust)*(1 - o.plumb), tried = [];   // lift: an end's tip hangs len*lift under its root
  let n = 0, ex0 = 1e9, ex1 = -1e9, xa = 1e9, xb = -1e9;
  for (let i = 0; i < eye.length; i += 3) { ex0 = Math.min(ex0, eye[i]); ex1 = Math.max(ex1, eye[i]); }
  // the first clear length under `from`: down half a metre at a time to the first clear length (lo reaches 0 after at
  // most from/STEP turns; a clear window narrower than half a metre can be stepped over), then eight halvings to the edge (2 mm)
  const down = (th, from) => {
    let hi = from, lo = from - STEP;
    while (lo > 0 && !fringeClear(th, lo, eye, o)) { hi = lo; lo -= STEP; }
    if (lo <= 0) return 0;
    for (let c = 0; c < CUTS; c++) { const mid = (lo + hi)/2; if (fringeClear(th, mid, eye, o)) lo = mid; else hi = mid; }
    return lo;
  };
  for (const th of threads) {
    // (an end too far to the side to reach at its full length, by the widest its law can carry it, is not tried)
    const far = th.len*(0.05 + (0.10 + 0.5*o.gust)*(1 - o.plumb) + Math.abs(th.lean ?? 0)) + Math.min(th.len, 30)*0.02 + (th.width ?? 0.36)*0.5 + o.clear;
    if (th.x < ex0 - far || th.x > ex1 + far) continue;
    let ey = 0, best = 1e9; for (let i = 0; i < eye.length; i += 3) { const d = Math.abs(eye[i + 2] - (th.z ?? 0.4)); if (d < best) { best = d; ey = eye[i + 1]; } }   // the eye's height where it passes this end
    tried.push(th, ey);
    if (fringeClear(th, th.len, eye, o)) continue;
    th.len = down(th, th.len); n++;
    if (th.y - th.len*lift > ey) { xa = Math.min(xa, th.x); xb = Math.max(xb, th.x); }   // cut OVER the line: its tip ends above the eye's height
  }
  // ONE EVEN ARCH: an end rooted between two ends that are cut over the line, and hanging down past the eye's height
  // beside them (clear by passing to one side), is cut too: to the first clear length from the eye's height up (an end
  // that is clear there ends 2 mm over the eye's height), so that no end hangs past the eye among the cut ones. Only
  // shorter, never longer.
  for (let i = 0; i < tried.length; i += 2) { const th = tried[i], ey = tried[i + 1];
    if (th.x > xa && th.x < xb && th.y > ey && th.y - th.len*lift < ey) { const len = down(th, Math.min(th.len, (th.y - ey)/lift)); if (len < th.len) { th.len = len; n++; } } }
  return n;
}

const LOTS = {
  terracotta: { petal: 'gold', hub: 'terracotta', spike: 'terracotta', rays: ['terracotta', 'gold'], fringe: ['terracotta', 'gold', 'terracotta', 'gold', 'bluegreen', 'dark'], lead: ['terracotta', 'bluegreen', 'gold', 'olive', 'blue'] },
  blue: { petal: 'terracotta', hub: 'buff', spike: 'blue', rays: ['terracotta', 'buff'], fringe: ['terracotta', 'buff', 'blue', 'terracotta', 'bluegreen', 'dark'], lead: ['blue', 'bluegreen', 'terracotta', 'gold', 'olive'] },
  green: { petal: 'gold', hub: 'terracotta', spike: 'olive', rays: ['olive', 'gold'], fringe: ['olive', 'gold', 'sage', 'terracotta', 'gold', 'dark'], lead: ['olive', 'sage', 'gold', 'terracotta', 'bluegreen'] },
};
const CASTS = { lions: [beastLion, beastBird], wyverns: [beastWyvern, beastBird], hounds: [beastHound, beastLion] };
export const HEAD = { x: 30, y: 91, r: 23 };
export const BAND = { y0: 70, y1: 106, width: 520, railY: 108, drop: 38 };

export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng, detail = Math.min(1, Math.max(0.6, opts.detail ?? 1));
  if (opts.palette && opts.palette.length >= 7) {
    const k = ['linen', 'terracotta', 'bluegreen', 'gold', 'olive', 'blue', 'dark'];
    k.forEach((n, i) => { WOOLS[n] = opts.palette[i]; }); _wc.clear();
  }
  const pickW = (arr) => arr[Math.floor(((rng()*9973.13) % 1)*arr.length)];   // spreads neighbouring seeds apart
  const lotPick = pickW(['terracotta', 'terracotta', 'blue', 'green']), castPick = pickW(['lions', 'lions', 'wyverns', 'hounds']), weatherPick = pickW(['draught', 'draught', 'still', 'gale']);
  const lotName = opts.lot || lotPick, castName = opts.cast || castPick, weather = opts.weather || weatherPick;
  const lot = LOTS[lotName] || LOTS.terracotta, cast = CASTS[castName] || CASTS.lions;
  const style = opts.style || makeStyle(ctx, { palette: opts.palette, weather });
  if (!opts.style) style.setWeather(weather);
  const hung = [BAND.railY, BAND.drop];
  const woolMat = style.wool({ hung }), linenMat = style.linen({ plane: 'xy', hung }), threadMat = style.thread({ hung });
  const object = new THREE.Group(); object.name = 'long-haired-star';
  const H = HEAD, B = BAND, W2 = B.width/2;

  // ---- the cloth of the span: a strip with a bulge where the star breaks out of it ----
  {
    const pos = [], idx = [], cols = 104, rows = 5;
    for (let j = 0; j <= rows; j++) for (let i = 0; i <= cols; i++) pos.push(-W2 + i*B.width/cols, 68 + j*40/rows, 0);
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) { const a = j*(cols + 1) + i, b = a + cols + 1; idx.push(a, a + 1, b, a + 1, b + 1, b); }
    const base = pos.length/3, seg = 48, rr = H.r + 9.5;
    pos.push(H.x, H.y, -0.03);
    for (let rI = 1; rI <= 3; rI++) for (let i = 0; i < seg; i++) { const a = i/seg*Math.PI*2, r = rr*rI/3*(rI === 3 ? 1 + 0.03*Math.cos(a*16) : 1); pos.push(H.x + Math.cos(a)*r, H.y + Math.sin(a)*r, -0.03); }
    for (let i = 0; i < seg; i++) { const i1 = (i + 1) % seg; idx.push(base, base + 1 + i, base + 1 + i1);
      for (let rI = 0; rI < 2; rI++) { const a = base + 1 + rI*seg + i, b = base + 1 + rI*seg + i1; idx.push(a, a + seg, b, b, a + seg, b + seg); } }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx);
    g.computeBoundingSphere();
    const cloth = new THREE.Mesh(g, linenMat); cloth.name = 'span-cloth'; object.add(cloth);
  }
  await ctx.yield();

  // ---- the work on it ----
  const fb = new FlatBuilder();
  const line = (x0, x1, y, step = 5) => { const p = []; const n = Math.max(1, Math.round(Math.abs(x1 - x0)/step)); for (let i = 0; i <= n; i++) p.push([x0 + (x1 - x0)*i/n, y + 0.12*Math.sin(i*1.7 + y)]); return p; };
  // the two border ropes, broken by the star (they overshoot into it a little, as the hand does)
  const chord = (y) => Math.sqrt(Math.max(0, (H.r + 0.5)*(H.r + 0.5) - (y - H.y)*(y - H.y)));
  for (const y of [B.y0, B.y1]) {
    const c = chord(y);
    fb.rope(line(-W2, H.x - c + 0.8, y), 'dark', 0.9, { z: 0.1 });
    fb.rope(line(H.x + c - 0.8, W2, y), 'dark', 0.9, { z: 0.1 });
    fb.rope(line(-W2, H.x - c - 1, y + (y === B.y0 ? 1.5 : -1.5)), y === B.y0 ? 'terracotta' : 'gold', 0.36, { z: 0.1 });
    fb.rope(line(H.x + c + 1, W2, y + (y === B.y0 ? 1.5 : -1.5)), y === B.y0 ? 'terracotta' : 'gold', 0.36, { z: 0.1 });
  }
  // compartments either side of the star: slanted bars with a sprig, and beasts in confronted pairs
  const barW = ['terracotta', 'bluegreen', 'gold', 'olive', 'blue', 'buff', 'sage'];
  const zones = [[-W2 + 11, H.x - H.r - 152], [H.x + H.r + 9, W2 - 11]];
  let bi = rng.int(0, 6), pairI = 0;
  for (const [zx0, zx1] of zones) {
    const nC = Math.max(1, Math.round((zx1 - zx0)/47)), cw = (zx1 - zx0)/nC;
    for (let i = 0; i <= nC; i++) {
      const bx = zx0 + i*cw, lean = (i % 2 ? -1 : 1)*9;
      const wa = barW[bi % 7], wb = barW[(bi + 3) % 7]; bi += rng.int(1, 2);
      slantBars(fb, bx, B.y0 + 1.6, B.y1 - 1.6, lean, wa, wb, 1.8, 6.4);
      sprig(fb, bx + 0.4, B.y0 + 8, 17, rng.chance(0.5) ? 'sage' : 'buff', barW[(bi + 1) % 5]);
      if (i === nC) break;
      // beasts face each other across every second bar pair; partners swap their two wools
      const facing = i % 2 === 0 ? 1 : -1, pi = Math.floor(i/2) + pairI;
      const a = lot.lead[pi % 5], b = lot.lead[(pi + 2) % 5];
      const fn = cast[pi % 2], s = (cw - 13)/26*rng.range(0.94, 1.0);
      fn(fb, bx + cw/2 - facing*3.2, B.y0 + 2.2, Math.min(s, 1.42)*0.93, facing, i % 2 === 0 ? { a, b } : { a: b, b: a }, rng.range(0, 6.28));
    }
    pairI += 3;
    await ctx.yield();
  }

  // ---- the nine rays, streaming to port, and their free ends ----
  const threads = [], rayEnds = [];
  let lowest = null, lowNew = null;
  // the height of the lowest ray, as it is worked, at x
  const yLow = (x) => { const P = lowNew; let i = 0; while (i < P.length - 2 && P[i + 1][0] > x) i++; const a = P[i], b = P[i + 1], t = Math.min(1, Math.max(0, (a[0] - x)/Math.max(1e-3, a[0] - b[0]))); return a[1] + (b[1] - a[1])*t; };
  for (let i = 0; i < 9; i++) {
    const f = i - 4, th = Math.PI - f*0.15;
    const x0 = H.x + Math.cos(th)*(H.r - 2.5), y0 = H.y + Math.sin(th)*(H.r - 2.5);
    const slope = f*0.022 - 0.035 - (f === -4 ? 0.05 : 0);
    const len = (f === -4 ? 122 : 150*(0.80 + 0.2*rng()) - Math.abs(f)*3) - 0;
    const ph = rng.range(0, 6.28), pts = [], n = Math.round(len/3);
    // each ray is a lock of long hair, not a ruled line: it waves along its length and sags more and more toward its end
    // (the upper locks most), so the tail falls like hanging wool from wherever it is seen
    const sag = f === -4 ? 5 : 6 + 1.6*(f + 4);
    for (let j = 0; j <= n; j++) { const sx = len*j/n, q = sx/len, a = Math.min(1, sx/30);
      pts.push([x0 - sx, y0 + slope*sx - sag*q*q + a*(2.3*Math.sin(sx*0.115 + ph) + 0.9*Math.sin(sx*0.27 + ph*2.3))]); }
    const wool = lot.rays[i % 2];
    fb.at().rope(pts, wool, 1.4, { z: 0.13 + i*0.002 });
    fb.rope(pts.slice(1, Math.max(3, n - 3 - (i % 3)*2)).map((p) => [p[0], p[1] + 1.15]), i % 2 ? 'dark' : 'bluegreen', 0.3, { z: 0.13 });
    const end = pts[n]; rayEnds.push(end);
    // the comb at the ray's end
    const nc = Math.round(9*detail);
    for (let k = 0; k < nc; k++) {
      const q = pts[n - Math.min(n, Math.floor(k/3))], u = nc > 1 ? k/(nc - 1) : 0.5;
      threads.push({ x: q[0] + (k % 3)*1.3 - 0.4, y: q[1] - 0.3, z: 0.45 + 0.02*k, len: 25*rng.range(0.78, 1.08), wool: k % 4 === 3 ? lot.rays[(i + 1) % 2] : wool, lean: -0.10 + (u - 0.5)*0.16, phase: rng(), width: 0.4 });
    }
    // (the curtain below is counted out along the lowest ray's first, straight drawing, so every edition keeps its draws)
    if (f === -4) { lowNew = pts; lowest = []; const m = Math.round(len/4); for (let j = 0; j <= m; j++) { const sx = len*j/m; lowest.push([x0 - sx, y0 + slope*sx + 1.1*Math.sin(sx*0.045 + ph)*Math.min(1, sx/30)]); } }
  }
  // the fringe: a curtain of free ends under the lowest ray, the one the eye passes through
  {
    const spacing = 1.15/detail; let acc = 4, k = 0;
    for (let j = 1; j < lowest.length; j++) {
      const a = lowest[j - 1], b = lowest[j], l = Math.hypot(b[0] - a[0], b[1] - a[1]);
      while (acc < l) {
        const t = acc/l;
        threads.push({ x: a[0] + (b[0] - a[0])*t, y: yLow(a[0] + (b[0] - a[0])*t) - 0.4, z: 0.4 + 0.05*(k % 3), len: 25*rng.range(0.82, 1.06)*(0.9 + 0.1*Math.sin(k*0.37)), wool: lot.fringe[(k + (rng.chance(0.2) ? 1 : 0)) % lot.fringe.length], lean: rng.range(-0.02, 0.01), phase: rng(), width: rng.range(0.32, 0.46) });
        acc += spacing*rng.range(0.85, 1.15); k++;
      }
      acc -= l;
    }
    // a second, finer and shorter layer a little in front, so the fringe has depth when the eye goes through it
    const fine = ['buff', 'sage', lot.rays[1], 'bluegreen'];
    for (let j = 2; j < lowest.length - 1; j++) {
      if (detail < 0.8 && j % 2) continue;
      const a = lowest[j], b = lowest[j + 1];
      for (let q = 0; q < 2; q++) { const t = rng();
        threads.push({ x: a[0] + (b[0] - a[0])*t, y: yLow(a[0] + (b[0] - a[0])*t) - 0.4, z: 0.95 + 0.25*q, len: rng.range(13, 21), wool: fine[(j + q) % 4], lean: rng.range(-0.03, 0.02), phase: rng(), width: 0.22 }); }
    }
  }
  await ctx.yield();
  // the arch we fly under: every free end of the star (the combs and the curtain) that would reach within 2 m of the
  // eye's line in this edition's weather hangs shorter (trimToRoute; 2.02: two centimetres for the law's own steps).
  // It draws nothing from the edition's stream.
  if (opts.eye) trimToRoute(threads, opts.eye, { sway: WEATHER[weather][1], plumb: WEATHER[weather][2], gust: WEATHER[weather][3], hung, segs: 16, clear: 2.02 });
  await ctx.yield();

  // ---- the head: a wheel that turns by notches ----
  const turnPh = rng.range(0, 1);
  fb.at(H.x, H.y, 1, 1);
  const pol = (r, a) => [Math.cos(a)*r, Math.sin(a)*r];
  for (let k = 0; k < 16; k++) {                          // lashes with a knot at the end, none where the rays leave
    const a = (Math.floor(k/2) + (k % 2 ? 0.75 : 0.25))*Math.PI/4;
    if (Math.cos(a) < -0.72) continue;
    const w = lot.rays[k % 2], lash = [];
    for (let j = 0; j <= 5; j++) { const r = 21 + j*1.7; lash.push(pol(r, a + 0.012*Math.sin(j*1.9 + k))); }
    fb.rope(lash, w, 0.5, { z: 0.15 });
    const kp = pol(30.4, a), kn = []; for (let j = 0; j < 9; j++) kn.push([kp[0] + Math.cos(j/9*6.2832)*1.05, kp[1] + Math.sin(j/9*6.2832)*1.05]);
    fb.fill(kn, lot.rays[(k + 1) % 2], a, { z: 0.15, inset: 0.1 }); fb.rope(kn, lineFor(lot.rays[(k + 1) % 2]), 0.3, { closed: true, z: 0.162 });
  }
  fb.hinge(0, 0, Math.PI/8, 0.4, turnPh, 1);              // the wheel inside its still lashes turns a notch every 2.5 s
  for (let k = 0; k < 8; k++) {                           // darts between the petals
    const a = (k + 0.5)*Math.PI/4;
    fb.shape([pol(11, a - 0.17), pol(20, a - 0.085), pol(26.5, a), pol(20, a + 0.085), pol(11, a + 0.17)], lot.spike, lineFor(lot.spike) === lot.petal ? 'bluegreen' : lineFor(lot.spike), a, { z: 0.16, inset: 0.25 });
  }
  for (let k = 0; k < 8; k++) {                           // eight petals laid radially, a dark rope round each
    const a = k*Math.PI/4, wob = 1 + 0.02*Math.sin(k*2.3);
    const lp = [], rp = [];                                // a pointed lozenge, widest a third of the way out
    for (let j = 0; j <= 9; j++) { const t = j/9, r = 5.5 + (19*wob)*t, hwm = 4.9*Math.pow(Math.sin(Math.PI*Math.pow(t, 0.62)), 0.8);
      lp.push(pol(r, a - hwm/r)); if (j > 0 && j < 9) rp.unshift(pol(r, a + hwm/r)); }
    lp.push(...rp);
    fb.fill(lp, lot.petal, a, { z: 0.20, inset: 0.45 });
    fb.rope(lp, 'dark', 0.55, { closed: true, z: 0.215 });
    fb.rope([pol(9, a), pol(20.4, a)], lot.hub === lot.petal ? 'dark' : lot.hub, 0.34, { z: 0.215 });   // a vein
  }
  const ring = (r, n) => { const p = []; for (let i = 0; i < n; i++) p.push(pol(r, i/n*Math.PI*2)); return p; };
  fb.fill(ring(7.6, 28), lot.hub, 0, { z: 0.26, inset: 0.3 });
  fb.rope(ring(7.6, 28), 'dark', 0.6, { closed: true, z: 0.275 });
  fb.rope(ring(5.0, 22), lot.petal, 0.5, { closed: true, z: 0.275 });
  for (let k = 0; k < 8; k++) fb.rope([pol(5.3, k*Math.PI/4 + 0.39), pol(7.3, k*Math.PI/4 + 0.39)], lot.petal, 0.3, { z: 0.275 });
  fb.fill(ring(2.5, 14), 'linen', 0, { z: 0.29, inset: 0, kind: 2 });
  fb.rope(ring(2.5, 14), 'dark', 0.45, { closed: true, z: 0.30 });
  fb.noHinge().at();
  await ctx.yield();

  const work = new THREE.Mesh(fb.build(), woolMat); work.name = 'span-work'; object.add(work);
  // (opts.back === false: the world never looks back at the span, so the work on the back of the cloth is not hung there)
  if (opts.back !== false) { const back = new THREE.Mesh(work.geometry, style.wool({ hung, side: -1 })); back.name = 'span-work-back'; back.frustumCulled = false; object.add(back); }
  await ctx.yield();
  const fringe = new THREE.Mesh(makeFringe(threads, 16), threadMat); fringe.name = 'star-fringe'; object.add(fringe);
  for (const m of [work, fringe]) m.frustumCulled = false;

  const gate = new THREE.Vector3(0, 62, 0);
  const anchors = {
    head: { x: H.x, y: H.y, r: H.r, position: new THREE.Vector3(H.x, H.y, 0) },
    band: { ...B },
    fringeGate: gate,
    flyThrough: [[0, 16, 330], [0, 22, 210], [0, 44, 100], [0, 58, 32], [0, 62, 0], [0, 58, -36], [0, 34, -110]].map((p) => new THREE.Vector3(...p)),
    viewpoints: { front: new THREE.Vector3(-30, 50, 230), close: new THREE.Vector3(6, 66, 34), back: new THREE.Vector3(-20, 80, -160) },
    portalSeat: { position: new THREE.Vector3(0, 0, -40), facing: new THREE.Vector3(0, 0, 1) },
    rayEnds: rayEnds.map((p) => new THREE.Vector3(p[0], p[1], 0)),
    lot: lotName, cast: castName, weather,
  };
  return {
    object, radius: 110, height: 116, center: new THREE.Vector3(-28, 84, 0), anchors, style,
    triangles: fb.triangles + threads.length*32 + 1400,
    setProgress(u) { style.setProgress(u); },
    setWeather(w) { style.setWeather(w); },
    update(dt, time, camera) { if (!opts.style) style.update(time, camera, ctx.renderer); },
    dispose() {},
    ground: false, groundY: 0,
  };
}
