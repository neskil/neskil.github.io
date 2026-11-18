// Stripes in the Grass: tall elephant grass made of spray paint and stencils; a tiger cut from the same card
// as the grass shadows. Five cans, flat passes parted in depth, no lighting, no tone map (post.flat).
import * as THREE from 'three';
import { makePath } from '../kit/core.js';
import * as P from '../parts/stripes-in-the-grass.js';

const { CAN, STYLE_GLSL } = P;
const D2R = Math.PI / 180;
// course: +Z; port = +X, starboard = -X (the teal shadow pass slides to -X)
const PATH_PTS = [
  [0, 5.2, -56], [0, 4.55, -6], [0, 5.3, 60], [0, 5.3, 120], [0, 3.0, 160], [0, 1.75, 206], [-0.5, 1.7, 240],
  [-8.5, 1.7, 263], [-15.5, 1.7, 285], [-11.5, 1.7, 310], [-6, 1.75, 345], [6, 4.2, 385], [26, 7.4, 430],
  [47, 8.5, 466], [58.1, 8.5, 497.4], [49.05, 8.5, 531.2], [40, 8.5, 565],
];
const SAND_Z0 = 440, RIVER_Z0 = 592, RIVER_Z1 = 752;

// ---- sky: a three-can freehand fade with clog spatter, a stencilled sun with drips, one cloud card five times
const SKY_VERT = /* glsl */`
varying vec3 vDir;
void main(){ vDir = position; vec4 p = projectionMatrix * viewMatrix * vec4(position + cameraPosition, 1.);
  if (abs(p.w) < 1e-4) p.w = 1e-4; gl_Position = p.xyww; }`;
const SKY_FRAG = /* glsl */`
uniform vec3 uSkyC[3]; uniform vec3 uSpatC[2]; uniform vec3 uSun; uniform vec3 uCloudC[3]; uniform float uDrip, uRain; uniform vec3 uSilC;
varying vec3 vDir;
float cloudSd(vec2 q){
  float d = 0.62 - length(q * vec2(0.55, 1.0));
  d = max(d, 0.50 - length(q - vec2(-0.75, 0.05))); d = max(d, 0.56 - length(q - vec2(0.62, 0.18)));
  d = max(d, 0.36 - length(q - vec2(1.25, -0.02))); d = max(d, 0.34 - length(q - vec2(-1.3, -0.08)));
  d = min(d, q.y + 0.22);
  return min(d, max(abs(q.x - 0.31) - 0.035, 0.2 - abs(q.y - 0.3)) );   // one bridge gap holds the card together
}
void main(){
  vec3 d = normalize(vDir + vec3(0., 1e-5, 0.));
  float el = degrees(asin(clamp(d.y, -1., 1.)));
  float az = degrees(atan(d.x, d.z + 1e-6));
  float pxDeg = max(length(fwidth(d)) * 57.3, 1e-4);
  float streak = (sNoise(vec2(az * 0.05, el * 0.8)) - 0.5) * 7. + (sNoise(vec2(az * 0.17 + 3., el * 2.3)) - 0.5) * 3.;
  float e = el + streak;
  vec3 c = mix(uSkyC[0], uSkyC[1], smoothstep(8., 17., e));
  c = mix(c, uSkyC[2], smoothstep(27., 45., e));
  // clog spatter: fixed round dots, biggest near the zenith
  vec2 g = vec2(az, el) / 5.5; vec2 id = floor(g); vec2 f = fract(g) - 0.5;
  float h = sHash(id + 17.), h2 = sHash(id + 41.);
  f -= (vec2(h2, sHash(id + 5.)) - 0.5) * 0.6;
  float rad = (0.035 + 0.11 * h2 * h2) * (0.5 + el / 60.);
  float dot1 = clamp((rad - length(f)) * 5.5 / pxDeg + 0.5, 0., 1.) * step(0.42, h) * step(3., el);
  c = mix(c, h > 0.75 ? uSpatC[1] : uSpatC[0], dot1 * step(0.5, rad * 5.5 / pxDeg + 0.2));
  // seven test bursts low to starboard, where the can was tried: no two the same size or quite in line, the first sputtered, the
  // heavy ones run in a drip
  vec2 tq = vec2((az + 58.) / 3.4, (el - 7.) / 3.4); float ti = floor(tq.x); float th = sHash(vec2(ti, 3.1)), th2 = sHash(vec2(ti, 8.7));
  vec2 tf = vec2(fract(tq.x) - 0.5 - (th2 - 0.5) * 0.3, tq.y - (th - 0.5) * 0.55);
  float td = 0.13 + 0.25 * th - length(tf);
  if (th > 0.62) { float xo = (th2 - 0.5) * 0.26, ln = 0.45 + 1.2 * th2, wl = max(0.028, 0.8 * pxDeg / 3.4);                      // a run from one side of the burst, ending in a bead
    td = max(td, max(min(wl - abs(tf.x - xo), min(-tf.y, tf.y + ln)), 1.9 * wl - length(tf - vec2(xo, -ln)))); }
  float sput = ti < 0.5 ? step(0.45, sNoise(vec2(az, el) * 6.)) : 1.;
  c = mix(c, uSpatC[1], clamp(td * 3.4 / pxDeg + 0.5, 0., 1.) * step(0., ti) * step(ti, 6.5) * sput);
  // the sun: a solid stencilled disc 5 degrees wide, a wide halo, two drips creeping down under it (sprayed before the clouds: one cloud card's edge lies across it)
  float ang = degrees(acos(clamp(dot(d, uSun), -1., 1.)));
  c = mix(c, uCloudC[0], 0.24 * (1. - smoothstep(2.5, 27., ang)));
  float sAz = degrees(atan(uSun.x, uSun.z + 1e-6)), sEl = degrees(asin(clamp(uSun.y, -1., 1.)));
  float dx = (mod(az - sAz + 180., 360.) - 180.) * cos(radians(el));
  float w = max(0.17, 0.8 * pxDeg);
  float len1 = min(7., 1. + uDrip * 0.02 * 9.), len2 = min(4.2, 0.4 + uDrip * 0.02 * 6.);
  float dr = max(step(abs(dx + 0.9), w) * step(sEl - 2.4 - len1, el), step(abs(dx - 1.2), w) * step(sEl - 2.2 - len2, el)) * step(el, sEl);
  dr = max(dr, max(clamp((0.5 - length(vec2(dx + 0.9, el - (sEl - 2.4 - len1)) * vec2(1., 0.8))) / pxDeg + 0.5, 0., 1.), clamp((0.42 - length(vec2(dx - 1.2, el - (sEl - 2.2 - len2)) * vec2(1., 0.8))) / pxDeg + 0.5, 0., 1.)));   // the bead each run ends in
  c = mix(c, uCloudC[0], max(dr, clamp((2.5 - ang) / pxDeg + 0.5, 0., 1.)));
  // clouds: white layer, straw underside, teal shadow slid to starboard and down, a faint halo
  for (int i = 0; i < 5; i++) {
    float fi = float(i); float s = i < 2 ? 7. : (i < 4 ? 4.6 : 3.2); float flip = (i == 1 || i == 3) ? -1. : 1.;
    float caz = -95. + fi * 47. + sin(fi * 2.7) * 9. + uTime * 0.12 - (i == 4 ? 3.5 : 0.); caz = mod(caz + 180., 360.) - 180.;
    float cel = 17. + 5. * sin(fi * 1.9 + 1.);
    float dz = az - caz; dz = mod(dz + 180., 360.) - 180.;
    vec2 q = vec2(dz * flip, el - cel) / s;
    float dS = cloudSd(q + vec2(0.3 * flip, 0.05)), dW = cloudSd(q);
    c = mix(c, uCloudC[2], clamp(dS * s / pxDeg + 0.5, 0., 1.));
    c = mix(c, uCloudC[0], 0.13 * (1. - smoothstep(0., 0.45, -dW)));
    c = mix(c, q.y < -0.02 + 0.06 * sin(q.x * 5.) ? uCloudC[1] : uCloudC[0], clamp(dW * s / pxDeg + 0.5, 0., 1.));
  }
  // first rain: slanting dashes from one rain card, repeated, falling
  if (uRain > 0.5) { vec2 rg = vec2((az + el * 0.4) / 2.6, (el + uTime * 22.) / 5.2); vec2 ri = mod(floor(rg), vec2(5., 4.)); vec2 rf = fract(rg) - 0.5;
    float rh = sHash(ri + 71.); rf.x += (rh - 0.5) * 0.5;
    float rd = min(max(0.03, 0.8 * pxDeg / 2.6) - abs(rf.x), (0.3 * (0.4 + 0.6 * rh) - abs(rf.y)) * 2.);
    c = mix(c, uCloudC[0], clamp(rd * 2.6 / pxDeg + 0.5, 0., 1.) * step(0.35, rh) * step(1., el)); }
  if (el < 0.) c = uSilC;
  gl_FragColor = vec4(c, 1.);
}`;

function buildSky(style, look) {
  const cans = style.cans;
  const mat = new THREE.ShaderMaterial({
    uniforms: { ...style.uniforms,
      uSkyC: { value: look.sky.map((i) => cans[i]) }, uSpatC: { value: look.spat.map((i) => cans[i]) },
      uCloudC: { value: look.cloud.map((i) => cans[i]) }, uDrip: { value: 0 }, uRain: { value: look.rain ? 1 : 0 }, uSilC: { value: look.silC },
      uSun: { value: new THREE.Vector3(Math.sin(80 * D2R) * Math.cos(20 * D2R), Math.sin(20 * D2R), Math.cos(80 * D2R) * Math.cos(20 * D2R)) } },
    vertexShader: SKY_VERT, fragmentShader: STYLE_GLSL + SKY_FRAG, depthWrite: false, depthTest: true, side: THREE.BackSide });
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(1, 48, 24), mat);
  mesh.frustumCulled = false; mesh.renderOrder = -10;
  return mesh;
}

// ---- the lie of the land, shared by ground and grass: 0 grass, 1 sand, 2 river; the trail mask is a texture
const GEO_GLSL = /* glsl */`
uniform sampler2D uMask; uniform vec4 uMaskBox;                         // x0, z0, 1/width, 1/depth
// r = how much of the stand is left (1 full, 0 trail), g = share of stems that are wide (the curtain), b = share left as broken, lying blades
vec3 maskRGB(vec2 p){ vec2 q = (p - uMaskBox.xy) * uMaskBox.zw;
  if (q.x < 0.004 || q.x > 0.996 || q.y < 0.004 || q.y > 0.996) return vec3(1., 0., 0.);
  return textureLod(uMask, q, 0.).rgb; }
float maskAt(vec2 p){ return maskRGB(p).r; }
float zoneAt(vec2 p){
  float zs = ${SAND_Z0.toFixed(1)} + 9. * sin(p.x * 0.031) + 5. * sin(p.x * 0.083 + 1.);
  float zr = ${RIVER_Z0.toFixed(1)} + 5. * sin(p.x * 0.021 + 2.);
  if (p.y > zr && p.y < ${RIVER_Z1.toFixed(1)} + 8. * sin(p.x * 0.017)) return 2.;
  if (p.y > zs && p.y <= zr && abs(p.x - 40.) < 190. + 20. * sin(p.y * 0.05)) return 1.;
  return 0.;
}`;

function buildMask(path, stage, rare) {
  const N = 1024, X0 = -128, Z0 = 150, W = 256;                         // 0.25 m per pixel
  const cv = document.createElement('canvas'); cv.width = cv.height = N;
  const c = cv.getContext('2d'); const s = N / W;
  c.fillStyle = 'rgb(255,0,0)'; c.fillRect(0, 0, N, N); c.lineCap = 'round';
  const v = new THREE.Vector3(), TRAIL = 'rgb(0,0,44)';
  let lz = () => 99;
  if (stage) {                                                          // the hero's stage, in its own metres (x port, z along the trail)
    const px = (lx, lz) => { const w = stage.toW(lx, lz); return [(w[0] - X0) * s, (w[1] - Z0) * s]; };
    const poly = (pts, col) => { c.fillStyle = col; c.beginPath(); pts.forEach(([lx, lz], k) => { const q = px(lx, lz); if (k) c.lineTo(q[0], q[1]); else c.moveTo(q[0], q[1]); }); c.closePath(); c.fill(); };
    const line = (pts, wd, col) => { c.strokeStyle = col; c.lineWidth = wd * s; c.beginPath(); pts.forEach(([lx, lz], k) => { const q = px(lx, lz); if (k) c.lineTo(q[0], q[1]); else c.moveTo(q[0], q[1]); }); c.stroke(); };
    const a = [stage.pw.a[0], stage.pw.a[2]], b = [stage.pw.b[0], stage.pw.b[2]], t = stage.tr, fx = t.farWallX, zs = t.stop[1], ex = rare ? 17 : 0;
    const LIE = 'rgb(12,0,118)', CURT = 'rgb(36,70,90)', THIN = 'rgb(20,90,120)';
    // where the trail still bends in toward the stage, the lie and the curtain keep to its port side: xp(z) = the trail's x at local z
    const chS = Math.cos(STAGE.h), shS = Math.sin(STAGE.h), tab = [];
    for (let i = 0; i <= 240; i++) { path.pointAt(0.44 + 0.2 * i / 240, v); tab.push([chS * (v.x - STAGE.x) - shS * (v.z - STAGE.z), shS * (v.x - STAGE.x) + chS * (v.z - STAGE.z)]); }
    const xp = (z) => { if (z >= -50) return 0; for (let i = 1; i < tab.length; i++) if (tab[i][1] >= z) { const p0 = tab[i - 1], p1 = tab[i]; return p0[0] + (p1[0] - p0[0]) * (z - p0[1]) / Math.max(1e-4, p1[1] - p0[1]); } return 0; };
    const strip = (z0, z1, o0, o1, col) => { const pts = []; for (let z = z0; z < z1; z += 2) pts.push([xp(z) + o0, z]); pts.push([xp(z1) + o0, z1]); for (let z = z1; z > z0; z -= 2) pts.push([xp(z) + o1, z]); pts.push([xp(z0) + o1, z0]); poly(pts, col); };
    // the flattened lie to port: broken blades lying in it, a few stems left standing
    { const pts = [[a[0] + 0.4, a[1]], [b[0] + 0.4, b[1]], [3.3, b[1]]]; for (let z = -50; z > a[1] - 5; z -= 2) pts.push([xp(z) + 3.3, z]); pts.push([xp(a[1] - 5) + 3.3, a[1] - 5]); poly(pts, LIE); }
    // one curtain of stems between it and the lens, some of them wide: thin where the lie first opens (the shadow wall is seen across it),
    // closing as we come level with her; it thins again where her head will swing, and closes behind her
    strip(a[1] - 9, -40, 1.2, 3.5, THIN);
    poly([[1.2, -40], [3.5, -40], [3.5, -14.5], [1.2, -14.5]], CURT);
    poly([[1.2, -14.5], [3.5, -14.5], [3.5, -8.2], [1.2, -8.2]], THIN);
    poly([[1.2, -8.2], [3.5, -8.2], [3.5, -5.0], [1.2, -5.6]], CURT);
    poly([[1.2, -5.6], [3.5, -5.0], [3.5, -0.3], [1.2, 1.5]], LIE);
    poly([[1.2, 1.5], [3.5, -0.3], [3.5, b[1]], [1.2, b[1]]], 'rgb(135,80,60)');       // and closes in again behind her, within arm's length of the port cheek
    // the ground she crosses to the starboard wall: trampled, a scatter of stems, and the swath of her bounds swept clean
    // (it ends at the return of the starboard stand, turned toward the lens, that she stops against: the stems stand close behind that line)
    const R = t.ret, hE = t.hEnd || 0, dE = [Math.sin(hE), Math.cos(hE)], fE = [Math.cos(hE) * 0.3, -Math.sin(hE) * 0.3];
    if (R) poly([[-1.1, -4.6], [-1.1, R.b[1] - 1.7], [R.b[0] + fE[0], R.b[1] + fE[1]], [R.a[0] + fE[0], R.a[1] + fE[1]], [-fx + 3, -2.6]], 'rgb(0,0,105)');   // (no stem left standing in her bay: nothing crosses her as she stands)
    else poly([[-1.5, -4.6], [-1.5, 8 + ex], [-fx - 0.4, zs + 6 + ex], [-fx - 0.4, zs - 10], [-fx + 3, zs - 13.5]], 'rgb(15,0,105)');
    const tE = t.turnEnd || t.stop;
    line([t.paceEnd, t.boundFrom, t.boundTo, [tE[0] - 0.5, tE[1] - 0.4], t.stop, [t.stop[0] + dE[0] * 2.2, t.stop[1] + dE[1] * 2.2]], 3.4, 'rgb(0,0,36)');
    if (rare) for (const al of [12, 15.5]) line([[t.boundFrom[0] + 1, t.boundFrom[1] + al - 0.6], [t.boundTo[0], t.boundTo[1] + al], [tE[0] - 0.5, tE[1] - 0.4 + al], [t.stop[0] + dE[0], t.stop[1] + dE[1] + al]], 2.6, 'rgb(0,0,36)');
    const ch = Math.cos(STAGE.h), sh = Math.sin(STAGE.h); lz = (p) => sh * (p.x - STAGE.x) + ch * (p.z - STAGE.z);
  }
  c.fillStyle = TRAIL; c.strokeStyle = TRAIL;
  for (let i = 0; i <= 900; i++) {                                      // the game trail, funnelling in at its mouth; past the lie it runs close between the stems
    path.pointAt(i / 900, v); if (v.z < 126 || v.z > 404) continue;
    const z = lz(v), tight = sstep(-52, -38, z) * (1 - sstep(7, 14, z));
    const r = (2.25 - 0.85 * tight) * Math.min(1, (v.z - 126) / 40) + Math.max(0, v.z - 340) * 0.05;
    c.beginPath(); c.arc((v.x - X0) * s, (v.z - Z0) * s, Math.max(0.4, r) * s, 0, 6.3); c.fill();
  }
  // the second, wider trail the deer use, meeting ours just before the lie opens to starboard
  const e = stage ? stage.toW(-stage.tr.farWallX - 1.5, 1.5) : [-22, 330];
  c.lineWidth = 6 * s; c.beginPath(); c.moveTo((-120 - X0) * s, (e[1] - 16 - Z0) * s); c.lineTo((e[0] - 8 - X0) * s, (e[1] - 1.5 - Z0) * s); c.lineTo((e[0] - X0) * s, (e[1] - Z0) * s); c.stroke();
  const tex = new THREE.CanvasTexture(cv); tex.minFilter = THREE.LinearFilter; tex.magFilter = THREE.LinearFilter; tex.generateMipmaps = false;
  tex.flipY = false; tex.colorSpace = THREE.NoColorSpace;
  return { tex, box: new THREE.Vector4(X0, Z0, 1 / W, 1 / W) };
}

const GROUND_VERT = /* glsl */`
varying vec3 vWp;
void main(){ vec4 wp = modelMatrix * vec4(position, 1.); vWp = wp.xyz; gl_Position = projectionMatrix * viewMatrix * wp; }`;
const GROUND_FRAG = /* glsl */`
uniform vec3 uBodyC, uShadeC, uPlumeC; uniform vec2 uRing; uniform vec4 uShadow;
varying vec3 vWp;
// a cut blade lying flat: q.x along it, q.y across; it tapers to its tip and is broken by one bridge gap
float sliverSd(vec2 q, float l, float w){
  float t = clamp(q.x / l, -1., 1.);
  float d = min(w * (0.42 + 0.58 * (0.5 - 0.5 * t)) - abs(q.y), (l - abs(q.x)) * 0.6);
  return min(d, abs(q.x - 0.22 * l) - 0.03);
}
// trampled grass, as three passes of one cut: x the straw blades lying in swirls, y the same cut slid to starboard (teal shadow),
// z the same cut widened and slid a thumb to port (the black pass under them, seen as a cut edge); metres, + inside
vec3 trample(vec2 p, vec2 sl){
  vec2 id0 = floor(p / 0.9); vec3 d = vec3(-1.);
  for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
    vec2 id = id0 + vec2(float(i), float(j));
    float h = sHash(id + 3.1), h2 = sHash(id + 17.7), h3 = sHash(id + 41.3);
    if (h < 0.14) continue;
    vec2 c = (id + 0.5 + (vec2(h2, h3) - 0.5) * 0.8) * 0.9;
    float a = 6.283 * sNoise(id * 0.21 + 5.) + (h - 0.5) * 1.3; vec2 ax = vec2(cos(a), sin(a));
    float l = 0.4 + 0.42 * h3, w = 0.045 + 0.05 * h2; vec2 q = p - c;
    d.x = max(d.x, sliverSd(vec2(dot(q, ax), dot(q, vec2(-ax.y, ax.x))), l, w));
    vec2 qt = q + sl;
    d.y = max(d.y, sliverSd(vec2(dot(qt, ax), dot(qt, vec2(-ax.y, ax.x))), l, w));
    qt = q - sl * 0.32;
    if (h > 0.45) d.z = max(d.z, sliverSd(vec2(dot(qt, ax), dot(qt, vec2(-ax.y, ax.x))), l, w * 1.25));
  }
  return d;
}
// the cloud card again, for its shadow on the sand (the same outline and the one bridge gap as the clouds in the sky)
float cloudSd(vec2 q){
  float d = 0.62 - length(q * vec2(0.55, 1.0));
  d = max(d, 0.50 - length(q - vec2(-0.75, 0.05))); d = max(d, 0.56 - length(q - vec2(0.62, 0.18)));
  d = max(d, 0.36 - length(q - vec2(1.25, -0.02))); d = max(d, 0.34 - length(q - vec2(-1.3, -0.08)));
  d = min(d, q.y + 0.22);
  return min(d, max(abs(q.x - 0.31) - 0.035, 0.2 - abs(q.y - 0.3)) );
}
// one wind ripple to a cell of g metres: a teal sliver lying across the wind, no two alike
float rippleAt(vec2 p, float g, float seed){
  vec2 id = floor(p / g); float h = sHash(id + seed), h2 = sHash(id + seed + 7.3), h3 = sHash(id + seed + 19.1);
  if (h < 0.52) return -1.;
  vec2 q = p - (id + 0.5 + (vec2(h2, h3) - 0.5) * 0.36) * g; float a = 1.5708 + (h3 - 0.5) * 1.5; vec2 ax = vec2(cos(a), sin(a));
  return sliverSd(vec2(dot(q, ax), dot(q, vec2(-ax.y, ax.x))) * (3.4 / g), 0.55 + 0.5 * h2, 0.05 + 0.07 * h) * (g / 3.4);
}
void main(){
  vec2 p = vWp.xz; float dist = distance(vWp, cameraPosition); float px = max(length(fwidth(p)) * 0.7, 1e-4);
  float zone = zoneAt(p); float m = maskAt(p); vec3 c;
  vec3 sil = uBodyC * vec3(0.93, 0.88, 0.80);
  if (zone < 0.5) {
    float reedG = smoothstep(346., 410., p.y) * (1. - step(752.0, p.y));
    if (m < 0.5 || reedG > 0.2 + 0.6 * sNoise(p * 0.23 + 2.)) {                // trampled trail, and the thin ground among the reeds: straw, teal stem shadows slid to starboard, black flecks
      c = uBodyC; float fine = 1. - smoothstep(0.045, 0.11, px);
      vec3 tr = max(trample(p, vec2(0.12, -0.065)), trample(p.yx * 1.31 + 19.7, vec2(-0.085, 0.157)) / 1.31);
      float pc = min(px, 0.03);                                         // cut crisp; a mark too fine to cut is left out, not blurred to a sixth colour
      c = mix(c, uCan[0], cutDist(tr.z, pc, 0.) * step(px, 0.05));       // spraying order: black under, teal slid, straw on top
      c = mix(c, uShadeC, cutDist(tr.y, pc, 0.) * step(px, 0.085));
      c = mix(c, uBodyC, cutDist(tr.x, pc, 0.));
      vec2 g = p / 0.43; vec2 id = floor(g); float h = sHash(id + 3.), h2 = sHash(id + 9.);       // black flecks, no two alike, none on a grid
      vec2 f = fract(g) - 0.5 - (vec2(h2, sHash(id + 23.)) - 0.5) * 0.72;
      float a = h * 6.283; f = vec2(cos(a) * f.x - sin(a) * f.y, sin(a) * f.x + cos(a) * f.y);
      c = mix(c, uCan[0], cutDist((0.03 + 0.2 * h2 * h2 * h2 - length(f * vec2(1., 1. + 2.2 * h))) * 0.43, px, 0.) * step(0.55, h) * fine);
      g = p / 1.37 + 7.3; id = floor(g); h = sHash(id + 5.); h2 = sHash(id + 13.);                 // seed heads fallen from the plumes
      f = fract(g) - 0.5 - (vec2(h2, sHash(id + 29.)) - 0.5) * 0.7; a = h2 * 6.283; f = vec2(cos(a) * f.x - sin(a) * f.y, sin(a) * f.x + cos(a) * f.y);
      c = mix(c, uPlumeC, cutDist((0.045 - length(f * vec2(0.36, 1.))) * 1.37, px, 0.) * step(0.7, h) * step(0.012, abs(f.x - 0.03)) * fine);
    } else {                                                            // the dark between stems, late sun leaking through as orange underspray
      // it is printed shadow, not a hole: THE CARD laid on the ground, its black islands lying among the stems' feet over the straw,
      // the same cut slid to starboard in teal under them, orange underspray leaking through in cut islands
      float f = sNoise(p * 0.45 + 5.) * 0.6 + sNoise(p * 1.6) * 0.4;
      float pc = min(px, 0.03), fineK = step(px, 0.07);
      // the litter at the stems' feet: the same lying cut blades as the trail, in their three passes, more of the black showing
      vec3 tr = max(trample(p, vec2(0.12, -0.065)), trample(p.yx * 1.31 + 19.7, vec2(-0.085, 0.157)) / 1.31);
      { float dk = smoothstep(0.6, 0.95, m) * smoothstep(150., 190., p.y) * (1. - smoothstep(346., 380., p.y)) * (1. - smoothstep(9., 22., dist)), nk = sNoise(p * 1.1 + 7.) * 0.65 + sNoise(p * 3.7 + 2.) * 0.35;
        // the dark between stems, deep in the walls of the trail: under the near stands the floor is the black can, laid in cut patches (no fade: fewer of them with distance)
        c = mix(uBodyC, uCan[0], clamp((dk * 1.25 - nk) / max(fwidth(nk) + fwidth(dk) * 1.25, 1e-4) + 0.5, 0., 1.)); }
      c = mix(c, uCan[2], clamp((f - 0.6) / max(length(vec2(dFdx(f), dFdy(f))), 1e-4) + 0.5, 0., 1.) * smoothstep(120., 165., p.y));   // (none under the open sea, where the floor is seen between the cards from above)
      c = mix(c, uCan[0], cutDist(tr.z + 0.012, pc, 0.) * fineK);
      c = mix(c, uShadeC, cutDist(tr.y, pc, 0.) * fineK);
      c = mix(c, uBodyC, cutDist(tr.x, pc, 0.) * fineK);
      c = mix(c, sil, smoothstep(13., 34., dist));                       // far off the dark between stems is too fine to cut: one flat straw
    }
  } else if (zone < 1.5) {                                              // the sandbank: white, a straw fade that stops dead at a taped edge
    c = uCan[1];
    float side = dot(p - vec2(40., 486.), vec2(0.42, 0.907));
    float fade = (1. - smoothstep(0., 78., -side)) * step(side, 0.);
    // the straw fade is sweeps of the arm: nine long strokes lying along the tape, each a little ragged at its edges, wide apart on our
    // side and closing up until they are one solid coat at the tape, where they stop dead; the straw can itself, white sand between
    vec2 pr = vec2(dot(p, vec2(0.907, -0.42)), side);
    float tS = clamp(-side / 78., 0., 1.), wS = 9. * pow(tS, 0.62), kS = floor(wS), fS = fract(wS) - 0.5;
    float hk = mix(0.6, 0.13, pow(tS, 0.45)) + (sNoise(vec2(pr.x * 0.33, kS * 7.1)) - 0.5) * 0.2 + (sNoise(vec2(pr.x * 1.9, kS * 3.3 + 2.)) - 0.5) * 0.06;
    hk -= 0.7 * smoothstep(0.6, 0.78, sNoise(vec2(pr.x * 0.021 + kS * 5.3, kS * 1.7)));          // a stroke ends, and is taken up again
    float dS = (hk - abs(fS)) / max(9. * 0.62 * pow(max(tS, 0.004), -0.38) / 78., 1e-3);        // in metres
    c = mix(c, uCan[3], cutDist(dS, px, 0.) * step(side, 0.) * step(-78., side));
    c = mix(c, uCan[3], 0.34 * step(0., side) * (1. - smoothstep(0., 2.6, side)) * smoothstep(0.25, 0.7, sNoise(pr * vec2(0.3, 0.9) + 4.)));   // a ghost of straw mist past the tape
    float rip = stripeCard(vec2(p.x * 0.42 + 0.2 * sin(p.y * 0.4), mod(p.y * 0.42, 3.6) + 0.2), px * 0.42, 0.);
    c = mix(c, uCan[4], rip * step(0.4, sNoise(p * 0.06 + 9.)) * step(px, 0.045));                  // (a mark too fine to cut is left out, never faded)
    // cloud shadows: the cloud card itself, small, a few separate islands sliding downwind (to starboard) in four lanes short of the ring
    float row = floor((p.y - 447.) / 25.); float cxs = (p.x + 3. * uTime) / 62. + row * 0.37; float cid = floor(cxs);
    float hC = sHash(vec2(cid, row) + 3.3), hC2 = sHash(vec2(cid, row) + 8.9);
    vec2 cq = vec2((fract(cxs) - 0.5 - (hC2 - 0.5) * 0.3) * 62., p.y - (447. + (row + 0.5) * 25. + (hC - 0.5) * 7.));
    float cS = 5.2 + 3.2 * hC2;
    float cd = cloudSd(vec2(cq.x * (hC2 > 0.5 ? -1. : 1.), cq.y) / cS) * cS;
    c = mix(c, uCan[4], cutDist(cd, px, 0.) * step(0.5, hC) * step(-0.5, row) * step(row, 3.5));
    vec2 g = p / 0.9; float h = sHash(floor(g) + 7.); vec2 f2 = fract(g) - 0.5 - (vec2(sHash(floor(g) + 11.), sHash(floor(g) + 19.)) - 0.5) * 0.7;
    c = mix(c, h > 0.9 ? uCan[0] : uCan[2], clamp((0.04 + 0.12 * h - length(f2)) * 0.9 / px + 0.5, 0., 1.) * step(0.55, h) * step(px, 0.06));
    // larger marks that still read from 8 m up: long teal ripple slivers with their bridge gaps, and clog dots
    float rip2 = max(rippleAt(p, 3.4, 2.), rippleAt(p * 0.83 + vec2(0.3 * p.y + 1.7 * uTime, 5.), 5.3, 31.) / 0.83);
    c = mix(c, uCan[4], cutDist(rip2, px, 0.) * step(px, 0.3));
    vec2 gB = p / 2.3; vec2 fB = fract(gB) - 0.5; float hB = sHash(floor(gB) + 23.); fB += (vec2(sHash(floor(gB) + 31.), sHash(floor(gB) + 47.)) - 0.5) * 0.85;
    c = mix(c, hB > 0.86 ? uCan[0] : (hB > 0.72 ? uCan[2] : uCan[4]), clamp((0.02 + 0.17 * hB * hB - length(fB * vec2(1., 1. + sHash(floor(gB) + 3.)))) * 2.3 / px + 0.5, 0., 1.) * step(0.6, hB) * step(px, 0.35));
    // orange overspray under the ring: a fan of clog dots on the sand in front of its lower arcs, thinning toward us
    vec2 rp = p - vec2(uRing.x, 565.); float al = -dot(rp, vec2(-0.259, 0.966)), la = dot(rp, vec2(0.966, 0.259));
    float fan = (1. - smoothstep(1., 19., al)) * step(-1.5, al) * (1. - smoothstep(0.5, 1., abs(la) / (5. + 0.6 * max(al, 0.))));
    for (int k = 0; k < 2; k++) { float gs = k == 0 ? 0.62 : 1.7;
      vec2 gF = p / gs + float(k) * 3.7; vec2 iF = floor(gF); float hF = sHash(iF + 61.), hF2 = sHash(iF + 67.);
      vec2 fF = fract(gF) - 0.5 - (vec2(hF2, sHash(iF + 71.)) - 0.5) * 0.6;
      c = mix(c, uCan[2], clamp((0.08 + 0.3 * hF2 * hF2 - length(fF)) * gs / px + 0.5, 0., 1.) * step(1. - fan * 0.92, hF) * step(px, 0.3 * gs)); }
    // our own teal shadow layer sliding over the sand, slid to starboard
    vec2 so = p - uShadow.xy; vec2 sq = vec2(dot(so, uShadow.zw), dot(so, vec2(uShadow.w, -uShadow.z)));      // x along our course, y across
    float sd = max((1. - length(sq / vec2(2.3, 0.5))) * 0.5, (1. - length((sq - vec2(0.3, 0.)) / vec2(0.75, 3.1))) * 0.75);
    c = mix(c, uCan[4], cutDist(min(sd, abs(sq.y - 0.9) - 0.07), px, 0.));
  } else {                                                              // the river: teal, white ripple islands sliding down it, the ring's orange lying broken among them
    c = uCan[4];
    // rows that deepen with the distance out from the near bank, so an island is a few pixels tall from the sand however far out it lies
    float dB = max(p.y - (${RIVER_Z0.toFixed(1)} - 8.), 0.); float t = log(1. + dB / 15.) * 4.8; float aa = max(fwidth(t), 1e-4);
    float row = floor(t), fy = fract(t) - 0.5, dc = 15. * (exp((row + 0.5) / 4.8) - 1.), wC = 5.5 * (1. + dc / 15.);
    float gx = (p.x + uTime * 2.6 * (0.7 + 0.6 * sHash(vec2(row, 3.)))) / wC + sHash(vec2(row, 9.)) * 7.;
    float ix = floor(gx), fx = fract(gx) - 0.5; float h = sHash(vec2(ix, row) + 13.), h2 = sHash(vec2(ix, row) + 29.), h3 = sHash(vec2(ix, row) + 43.);
    fx += (h2 - 0.5) * 0.3; float hl = 0.2 + 0.2 * h2, e = fx / hl;
    float sd = min((1. - e * e) * 0.3 - abs(fy + (h - 0.5) * 0.2), (abs(e - 0.35) - 0.07) * 0.6);          // a lens with one bridge gap
    // the ring's orange lies broken among them, either side of the line the ring stands on
    float lat = abs(p.x - (uRing.x - 0.268 * (p.y - 565.))), inCol = 1. - smoothstep(14., 52., lat);
    float isl = clamp(sd / aa + 0.5, 0., 1.) * step(0.5 - 0.3 * inCol, h) * (1. - smoothstep(0.22, 0.36, aa));
    c = mix(c, h3 < inCol * 0.8 ? uCan[2] : uCan[1], isl);
  }
  c = mix(c, sil, zone > 1.5 ? smoothstep(420., 720., dist) * 0.5 : smoothstep(300., 520., dist));
  gl_FragColor = vec4(c, 1.);
}`;

// ---- elephant grass: instanced cut slivers in a window that travels with the camera, wrapped on a world grid.
// One program, drawn once per pass: 0 teal shadow (slid to starboard, a hand behind), 1 body with white plume
// islands, 2 black islands (widened, broken, furthest back). Distance drops the passes.
const GRASS_VERT = /* glsl */`
attribute vec4 aCell;                                                   // x, z in the window; two hashes
uniform float uWin, uPass, uWide, uSwell, uReach, uInner; uniform vec3 uSwK; uniform vec4 uSight; uniform vec3 uClump[12];   // x, z, radius of the tall clumps
varying vec2 vQ; varying float vH, vHgt, vDist, vTall, vCard, vHash, vAfter, vSw, vSea;
void main(){
  vec2 cam = cameraPosition.xz;
  vec2 base = aCell.xy + uWin * floor((cam - aCell.xy) / uWin + 0.5);
  // THE CARD STANDS IN ROWS over the open sea: every blade of a 2.4 m stand is sprayed through one flat card, so the near blades stand
  // in the card's plane (a row across the course, each card a little out of line with its neighbour) and their bridge gaps line up
  float rowK = step(uInner, 1.) * (1. - smoothstep(112., 150., base.y));
  vec2 rc = floor(base / 2.4);
  base.y = mix(base.y, (rc.y + 0.5) * 2.4 + (sHash(rc + 2.9) - 0.5) * 2.2 + (fract(aCell.w * 43.3) - 0.5) * 0.24, rowK);   // (each card at its own depth: no alley runs between them)
  float dist = distance(base, cam);
  float reed = smoothstep(346., 410., base.y) * (1. - step(${RIVER_Z1.toFixed(1)}, base.y));
  float zone = zoneAt(base);
  // reed clumps on the sand: irregular islands of stems, both fields (so a clump is never cut off where the near window ends)
  float cn = sNoise(base * 0.13 + 3.) * 0.75 + sNoise(base * 0.37 + 11.) * 0.25;
  float clump = step(0.5, zone) * step(zone, 1.5) * max(step(0.69, cn), max(step(distance(base, vec2(54., 462.5)) + 2.2 * cn, 4.6), step(distance(base, vec2(45.5, 473.5)) + 2.2 * cn, 3.6))) * step(fract(aCell.w * 7.31), 0.62) * step(24., distance(base, vec2(40., 565.)));
  float tallC = 0.;                                                      // tall clumps: full stands left beside the path, so there is always something near under the nose
  for (int i = 0; i < 12; i++) tallC = max(tallC, step(distance(base, uClump[i].xy) + 1.6 * (cn - 0.5), uClump[i].z));
  tallC *= step(zone, 1.5);
  vec3 mk = maskRGB(base);
  float stand = step(fract(aCell.w * 13.7) * 0.9 + 0.05, mk.r);
  float low = (1. - stand) * step(fract(aCell.w * 91.7), mk.b) * step(uInner, 1.);        // trampled: a blade broken and lying, not gone
  float wideS = stand * step(fract(aCell.w * 29.3), mk.g);                                 // the curtain's wide stems
  float keep = max(stand, low) * max(step(zone, 0.5) * step(reed * 0.86, fract(aCell.w * 7.31)), max(clump, tallC));
  keep *= (1. - smoothstep(uReach * 0.8, uReach, dist)) * smoothstep(uInner * 0.6, uInner, dist);
  float hgt = mix(3.2, 4.0, aCell.z) * mix(mix(1., 0.42, max(reed, clump)), 0.84 + 0.12 * fract(aCell.w * 3.3), tallC) * mix(1., 0.04 + 0.13 * fract(aCell.w * 53.9), low);
  float sw = sin(dot(base, uSwK.xy) - uTime * uSwK.z) * 0.5 + 0.5;                // swells rolling through at 6 m/s, slantwise across the course
  float sw2 = sin(dot(base, vec2(-0.21, 0.13)) - uTime * 1.3 + aCell.w * 3.);
  // over the open sea the swell is tall enough to see from just above the plumes: a crest hides the trough behind it, a trough opens the
  // dark feet of the stems (the straw pass thins there, so the teal and the black show); in the trail the walls stand even
  float seaK = 1. - smoothstep(118., 170., base.y);   // 1 over the open sea
  float swA = 0.1 + 0.14 * (1. - smoothstep(118., 170., base.y) * (1. - smoothstep(350., 410., base.y))) + 0.1 * seaK * smoothstep(8., 24., dist);
  hgt *= 1. - swA + swA * sw; vSw = sw;
  if (uPass > 0.5 && uPass < 1.5) keep *= step((1. - sw) * 0.6 * smoothstep(mix(14., 5., seaK), mix(34., 14., seaK), dist) * step(0.2, swA), fract(aCell.w * 61.7));
  // a broken blade lies along the swirl it was trodden in, its face turned up
  float la = 6.283 * sNoise(base * 0.19 + 5.) + (fract(aCell.w * 17.3) - 0.5) * 1.5; vec2 ld = vec2(cos(la), sin(la));
  float yaw = mix((aCell.w - 0.5) * 1.9 * (1. - 0.6 * rowK), la + 1.5708 + (fract(aCell.w * 37.1) - 0.5) * 1.3, low); vec2 ax = vec2(cos(yaw), sin(yaw));
  float nearF = step(uInner, 1.);
  // down in the trail a card seen along its own face is a scratch the height of the frame: within 7 m of the lens the hand turns each
  // standing stem until at least 55 degrees of its face is toward us (as the egrets, the deer and the tiger's cards are turned)
  float inTrail = nearF * (1. - smoothstep(2.4, 3.6, cameraPosition.y)) * (1. - low);
  { vec2 aw = (base - cam) / max(dist, 1e-3), sq = vec2(-aw.y, aw.x); float sgn = dot(ax, sq) < 0. ? -1. : 1.;
    float al = dot(ax, aw), lim = 0.574;                                 // cos 55 degrees: how far the face may lie along the line of sight
    vec2 ax2 = mix(ax, aw * (al < 0. ? -lim : lim) + sq * sgn * 0.819, step(lim, abs(al)) * inTrail * (1. - smoothstep(5., 9., dist)));
    ax = ax2 / max(length(ax2), 1e-3); }
  // (the cut is coarser with distance, so a sliver and the gap beside it stay two pixels and more as far as the near field reaches)
  // (at the lens a stem is still a blade, never a slab: the curtain's wide stems and the widened black pass come down to a blade's width inside 3 m)
  float farK = mix(1., smoothstep(1.8, 4.5, dist), inTrail);
  float wide = uWide * (0.75 + 0.5 * aCell.z) * (uPass > 1.5 ? 1. + 0.9 * farK : 1.) * (1. + dist * mix(0.012, 0.026, nearF)) * (1. + 0.95 * wideS * farK + 0.15 * low);
  // distance is paint thinning: black gone by 150 m, teal by 300 m. Every field keeps its three passes until then
  // (a pass is there or it is not: each blade drops it at its own distance, so the last strip under the horizon is flat bands, not speckle)
  // (over the open sea the lens is a metre above the plumes and 150 m is three pixels under the horizon: there the same rule is told
  // nearer, so the three bands can be seen: black between the near blades, white and teal on straw beyond, straw alone to the horizon)
  if (uPass > 1.5) keep *= step(dist, mix(uThin.x, 26., seaK) * (0.55 + 0.45 * fract(aCell.w * 5.71)));
  else if (uPass < 0.5) keep *= step(dist, mix(uThin.y, 80., seaK) * (0.7 + 0.3 * fract(aCell.w * 5.71)));
  // S3: paint arrives. Downwind of each drifting band of mist the stand is still unfinished (teal and straw only, the plumes and the black
  // not yet sprayed); under the band they land, and upwind of it the grass is crisp. vAfter = metres upwind of the band line (0..uMist.x)
  float aftM = fract(1. - mistCoord(vec3(base.x, 0., base.y)) + 0.82) * uMist.x;
  vec2 away = (base - cam) / max(dist, 1e-3);
  float push = 1. - smoothstep(0.6, 2.8, dist);                         // blades lean out of the lens
  keep *= smoothstep(mix(0.7, 1.15, inTrail), mix(1.2, 1.85, inTrail), dist);
  // while she is out, no stem at the lens stands across her: the cone from the lens to her length is kept clear to 5 m (further stems are slivers she is seen through)
  { vec2 sd = uSight.xy - cam; float sl = max(length(sd), 1e-3); vec2 sn = sd / sl; float tp = clamp(dot(base - cam, sn), 0., sl), rr = 0.3 + 2.5 * tp / sl;
    keep *= 1. - uSight.z * inTrail * (1. - smoothstep(rr * 0.75, rr * 1.15, distance(base, cam + sn * tp))) * (1. - smoothstep(5., 8., dist)); }
  vec2 lean = (mix(vec2(0.35, 0.75), vec2(-0.95, -0.3), step(1.5, uSwell) * seaK) * (0.25 + 0.75 * sw) * uSwell + vec2(0.1, 0.05) * sw2 * uSwell) * hgt * 0.22 + away * push * 2.2 * (1. - 0.8 * low);
  lean += ld * low * (0.9 + 1.3 * fract(aCell.w * 71.3));
  float back = uPass < 0.5 ? 0.12 : (uPass > 1.5 ? 0.24 : 0.);
  vec3 wp = vec3(base.x, 0., base.y);
  // each pass hangs behind the one before, off the blade's own face (a pass slid along the blade's plane would lie in it and flicker)
  vec2 nrm = vec2(-ax.y, ax.x); nrm *= dot(nrm, away) < 0. ? -1. : 1.;
  wp.xz += ax * position.x * wide + (away * 0.6 + nrm * 0.5) * back + lean * position.y * position.y;
  wp.y = position.y * hgt * keep + low * (uPass < 0.5 ? 0.01 : (uPass > 1.5 ? 0.045 : 0.08));   // lying blades: the three passes a thumb apart, straw on top
  // the teal pass is the same cut slid to starboard; far off it is slid a whole blade's width, so it is a mark of its own and not a 1 px fringe
  if (uPass < 0.5) wp += vec3(uSlide.x - 0.42 * wide * (1. - nearF) * smoothstep(30., 90., dist), uSlide.y * position.y * (1. - low), 0.);
  // card slip: now and then a whole stand is sprayed again a hand to one side; the passes follow in spraying order
  vec2 cid = floor(base / 2.4); float hs = sHash(cid + 7.3); float per = 6. + 3. * fract(hs * 61.);
  float phs = uTime / per + hs * 37.; float ns = floor(phs);
  float since = (phs - ns) * per - (uPass < 0.5 ? 0. : (uPass > 1.5 ? 0.8 : 0.35));
  wp.x += 0.17 * step(hs, 0.035) * mix(mod(ns + 1., 2.), mod(ns, 2.), smoothstep(0., 0.14, since));
  vAfter = mix(30., aftM, mix(1., smoothstep(6., 34., abs(base.x)), seaK)); vSea = seaK;
  vQ = vec2(position.x, position.y); vH = position.y * hgt; vHgt = hgt; vDist = dist; vTall = low > 0.5 ? -1. : aCell.z; vHash = aCell.w;
  vCard = sHash(vec2(floor(base.x / 2.4) + floor(base.y / 2.4) * 7., 3.7));   // hashed here: a hash taken per pixel from an interpolated id is noise
  gl_Position = keep < 0.03 ? vec4(0., 0., -3., 1.) : projectionMatrix * viewMatrix * vec4(wp, 1.);   // a blade the mask removed is not drawn at all
}`;
const GRASS_FRAG = /* glsl */`
uniform float uPass; uniform vec3 uBodyC, uShadeC, uPlumeC;
varying vec2 vQ; varying float vH, vHgt, vDist, vTall, vCard, vHash, vAfter, vSw, vSea;
void main(){
  float v = vQ.y; float side = vHash > 0.5 ? 1. : -1.;
  float cx = side * (0.30 * v * v - 0.12);                              // a bent, tapering sliver
  float pxQ = max(fwidth(vQ.x), 1e-5), pxH = max(fwidth(vH), 1e-5);     // one pixel, in quad widths and in metres of height
  float low = step(vTall, -0.5);
  float hw = 0.19 * (1. - 0.86 * v * v * v) * smoothstep(0., 0.03, v);
  if (uPass > 1.5) { if (hw < 0.8 * pxQ) discard; }                     // the black pass shows as islands 2 px wide or not at all
  else { if (pxQ > 0.14 && vDist < 15. && low < 0.5) discard;           // near the lens a blade seen along its face is left out (no scratch the height of the frame)
    hw = max(hw, min(0.75 * pxQ, 0.19) * smoothstep(0., 0.03, v)); }    // a sliver never thins below 1.5 px
  // seed heads: a quarter of the blades near the lens; further out they crowd on the swell crests and leave the troughs bare
  float plumeV = 0.84; float plume = step(mix(0.76, mix(0.95, 0.4, vSw), smoothstep(mix(14., 4., vSea), mix(34., 12., vSea), vDist)), vTall) * step(uPass, 1.5) * step(0.5, uPass) * step(vDist, mix(120., 55., vSea) + mix(60., 30., vSea) * fract(vHash * 31.));
  vec3 c = uPass < 0.5 ? uShadeC : (uPass > 1.5 ? uCan[0] : uBodyC);
  float order = uPass < 0.5 ? 0. : (uPass > 1.5 ? 3. : 1.);
  if (plume > 0.5 && v > plumeV) { order = 2.;                                      // seed head: a white island past its own bridge gap
    float t = (v - plumeV) / (1. - plumeV);
    hw = 0.21 * sqrt(max(sin(3.14159 * clamp(t * 1.04 - 0.04, 0., 1.)), 0.)) * step(0.2, t); c = uPlumeC;
  }
  // bridge gaps at heights shared by the whole card: a clean cut 11 cm tall on the blades near enough to show it (3 px or more), absent beyond
  float cardQ = floor(vCard * 255. + 0.5), hc = cardQ / 255.;
  // (three bridges to a card: one low, and two under the plumes where the card is seen from above; each at one height for the whole card)
  float g1 = 1.15 + 0.35 * hc, g2 = 2.80 + 0.22 * hc, g3 = g2 - 0.56; if (hc < 0.07) { g1 = vHgt - g1; g2 = vHgt - g2; g3 = vHgt - g3; }
  if (low > 0.5) { g1 = vHgt * (0.36 + 0.2 * fract(vHash * 23.)); g2 = -9.; g3 = -9.; }   // a lying blade keeps one bridge
  float gw = (low > 0.5 ? 0.02 + 0.06 * vHgt : 0.055) * step(vDist * (0.85 + 0.3 * fract(vHash * 47.)), 13.);
  // (the upper one, just under the plumes, is cut wider with distance and kept to 30 m: from above it is the banding of the card)
  float gw2 = low > 0.5 ? gw : clamp(2.1 * pxH, 0.05, 0.15) * step(vDist * (0.9 + 0.2 * fract(vHash * 47.)), 24.);
  // a blade is islands joined by bridges: each stretch of it narrows toward the bridge that parts it from the next, so no piece is a block
  if (uPass < 1.5 && low < 0.5 && !(plume > 0.5 && v > plumeV)) {
    float dG = min(gw > 0. ? abs(vH - g1) - gw : 9., gw2 > 0. ? min(abs(vH - g2) - gw2, abs(vH - g3) - gw2 * 0.85) : 9.);
    hw *= mix(0.42, 1., smoothstep(0., 0.3, dG));
  }
  if (uPass > 1.5) {                                                    // black: each island a sliver tapering to both its ends, never a block
    float sg = vH / max(0.62 + 0.5 * fract(vHash * 13.), 0.2) * mix(1., 4., low) + vHash * 9.;
    float foot = (1. - smoothstep(0.7, 1.5, vH)) * (1. - low);          // the dark between stems: at the foot of a stand the black is one sliver, wider, not islands
    hw *= mix(0.14 + 0.86 * sqrt(max(sin(3.14159 * clamp((fract(sg) - 0.28) / 0.72, 0., 1.)), 0.)), 1.5, foot);
  }
  if (hw - abs(vQ.x - cx) < 0.) discard;
  // paint arrives: beyond the mist distance a stand is made pass by pass behind each drifting band
  // (the plumes and the black are missing from 11 m downwind of the band line to 5 m upwind of it; each blade at its own edge of that strip)
  float jm = (fract(vHash * 71.3) - 0.5) * 3.;
  if (order > 1.5 && (vAfter + jm < (order > 2.5 ? 5. : 3.) || vAfter + jm > uMist.x - (order > 2.5 ? 11. : 9.)) && vDist > uMist.y * (1. - vSea)) discard;                         // (over the sea the lane runs right under the lens: no ring of finished blades travels with us)
  if (abs(vH - g1) < gw || abs(vH - g2) < gw2 || abs(vH - g3) < gw2 * 0.85) discard;
  if (uPass > 1.5) {                                                    // black: stripe islands, never closing
    float seg = vH / max(0.62 + 0.5 * fract(vHash * 13.), 0.2) * mix(1., 4., low) + vHash * 9.;
    if ((fract(seg) < 0.28 || sHash(vec2(floor(seg), cardQ)) < 0.3) && vH > 1.1 - low) discard;
  }
  vec3 sil = uBodyC * vec3(0.93, 0.88, 0.80);
  c = mix(c, sil, smoothstep(mix(uThin.y, 70., vSea), mix(uThin.z, 130., vSea), vDist) * step(0.5, uPass));
  gl_FragColor = vec4(c, 1.);
}`;

async function buildGrass(ctx, style, geoU, look, scene) {
  const d = ctx.quality?.detail ?? 1, rng = ctx.rng.fork ? ctx.rng.fork('grass') : ctx.rng;
  const quad = new THREE.PlaneGeometry(1, 1); quad.translate(0, 0.5, 0);
  const fields = [
    { n: Math.round(25880 * (0.6 + 0.4 * d)), win: 76, wide: 0.3, reach: 38, inner: 0, passes: [2, 0, 1] },
    { n: Math.round(40000 * d), win: 560, wide: 1.5, reach: 280, inner: 30, passes: [2, 0, 1] },
  ];
  const mats = [], meshes = [];
  for (const f of fields) {
    const cell = new Float32Array(f.n * 4);
    for (let i = 0; i < f.n; i++) {
      cell[i * 4] = rng() * f.win; cell[i * 4 + 1] = rng() * f.win; cell[i * 4 + 2] = rng(); cell[i * 4 + 3] = rng();
      if (i % 3000 === 2999) await ctx.yield();
    }
    const g = new THREE.InstancedBufferGeometry();
    g.index = quad.index; g.setAttribute('position', quad.getAttribute('position'));
    g.setAttribute('aCell', new THREE.InstancedBufferAttribute(cell, 4)); g.instanceCount = f.n;
    for (const pass of f.passes) {
      const m = new THREE.ShaderMaterial({
        uniforms: { ...style.uniforms, ...geoU, uWin: { value: f.win }, uPass: { value: pass }, uWide: { value: f.wide },
          uSwell: { value: look.swell }, uSwK: { value: look.swk }, uReach: { value: f.reach }, uInner: { value: f.inner }, uClump: { value: CLUMPS },
          uBodyC: { value: look.bodyC }, uShadeC: { value: look.shadeC }, uPlumeC: { value: look.plumeC } },
        vertexShader: STYLE_GLSL + GEO_GLSL + GRASS_VERT, fragmentShader: STYLE_GLSL + GRASS_FRAG, side: THREE.DoubleSide });
      const mesh = new THREE.Mesh(g, m); mesh.frustumCulled = false; mesh.renderOrder = pass === 1 ? 2 : pass;
      scene.add(mesh); mats.push(m); meshes.push(mesh);
    }
    await ctx.yield();
  }
  return { mats, meshes, quad };
}

// ---- the cast: every animal, tree and the ring is flat cut cards, one instanced program, moved from update()
const CAST_VERT = /* glsl */`
attribute vec4 aPos;                                                    // xyz, heading
attribute vec4 aDef;                                                    // width, height, kind, flap or pitch angle
attribute vec4 aAnim;                                                   // phase, visibility, pass or can, wing side (0 = body card)
varying vec2 vQ; varying vec4 vI; varying float vDist, vAfter;
void main(){
  float h = aPos.w; vAfter = fract(1. - mistCoord(aPos.xyz) + 0.82); vec3 fwd = vec3(sin(h), 0., cos(h)), right = vec3(cos(h), 0., -sin(h)), up = vec3(0., 1., 0.); vec3 wp;
  if (abs(aAnim.w) > 0.5) {
    vec3 span = right * cos(aDef.w) * aAnim.w + up * sin(aDef.w);
    wp = aPos.xyz + span * (position.x + 0.5) * aDef.x + fwd * position.y * aDef.y;
  } else {
    float c = cos(aDef.w), s = sin(aDef.w); vec2 q = vec2(position.x * aDef.x, position.y * aDef.y);
    q = vec2(c * q.x - s * q.y, s * q.x + c * q.y); wp = aPos.xyz + fwd * q.x + up * q.y;
  }
  wp = mix(aPos.xyz, wp, aAnim.y);
  vQ = position.xy; vI = vec4(aDef.z, aAnim.z, aAnim.x, aAnim.w); vDist = distance(wp, cameraPosition);
  gl_Position = projectionMatrix * viewMatrix * vec4(wp, 1.);
}`;
const CAST_FRAG = /* glsl */`
uniform vec2 uRingIn; uniform vec3 uBodyC;
varying vec2 vQ; varying vec4 vI; varying float vDist, vAfter;
float seg(vec2 p, vec2 a, vec2 b, float r){ vec2 pa = p - a, ba = b - a; float h = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-6), 0., 1.); return r - length(pa - ba * h); }
float ell(vec2 p, vec2 c, vec2 r){ return (1. - length((p - c) / r)) * min(r.x, r.y); }
float tap(vec2 p, vec2 a, vec2 b, float r0, float r1){ vec2 pa = p - a, ba = b - a; float h = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-6), 0., 1.); return mix(r0, r1, h) - length(pa - ba * h); }
vec2 rot2(vec2 p, float a){ float c = cos(a), s = sin(a); return vec2(c * p.x + s * p.y, c * p.y - s * p.x); }
// the drongo, as the cutter drew it: side-on, nose to +x. Body and head one island, a hooked beak, the eye left as a hole with a bridge across
// it, the wing a separate island parted from the body by a gap (lift 0 folded .. 1 raised for balance), two long tail feathers curving apart
float drongoSd(vec2 q, float lift){
  float body = max(ell(rot2(q - vec2(0.05, 0.02), 0.62), vec2(0.), vec2(0.185, 0.105)), ell(q, vec2(0.2, 0.17), vec2(0.088, 0.08)));
  body = max(body, tap(q, vec2(0.265, 0.185), vec2(0.365, 0.155), 0.03, 0.006));                       // the beak
  body = max(body, tap(q, vec2(0.36, 0.158), vec2(0.368, 0.128), 0.009, 0.004));                       // and its hook
  vec2 e = q - vec2(0.225, 0.19); body = min(body, max(length(e) - 0.03, 0.0075 - abs(e.y + e.x * 0.3)));   // the eye: a hole, held by one bridge
  vec2 wq = rot2(q - vec2(0.115, 0.085), mix(0.7, -1.0, lift));                                        // the wing hinges at the shoulder
  float wing = min(0.062 * (1. - wq.x * wq.x / 0.105) - abs(wq.y + 0.05 * wq.x), 0.02 - wq.x) ;
  wing = wq.x > -0.33 ? min(wing, wq.x + 0.33) : -1.;
  body = min(body, 0.022 - wing);                                                                      // the gap that parts it from the body
  float spread = 0.05 * lift;
  float t1 = max(tap(q, vec2(-0.06, -0.06), vec2(-0.25, -0.24 + spread), 0.036, 0.026), tap(q, vec2(-0.25, -0.24 + spread), vec2(-0.455, -0.33 + 2. * spread), 0.026, 0.007));
  float t2 = max(tap(q, vec2(-0.04, -0.08), vec2(-0.19, -0.29 - spread), 0.034, 0.025), tap(q, vec2(-0.19, -0.29 - spread), vec2(-0.265, -0.475 - spread), 0.025, 0.007));
  float feet = max(tap(q, vec2(0.075, -0.07), vec2(0.085, -0.165), 0.012, 0.008), tap(q, vec2(0.125, -0.06), vec2(0.118, -0.165), 0.012, 0.008));
  return max(max(body, wing), max(max(t1, t2), feet));
}
// the stem it rides: one tall cut blade bent over in an arc under the bird, broken by a bridge gap, its plume island hanging past the tip
float stemSd(vec2 q, out float plume){
  float yy = clamp((q.y + 0.5) / 0.9, 0., 1.); float cx = -0.32 + 0.5 * yy * yy * yy, sl = 1.667 * yy * yy;
  float d = (0.0115 - 0.0055 * yy) * sqrt(1. + sl * sl) - abs(q.x - cx);
  d = min(d, min(0.4 - q.y, q.y + 0.5)); d = min(d, abs(q.y + 0.07) - 0.011);
  vec2 pq = rot2(q - vec2(0.262, 0.378), -0.5);
  plume = min(0.021 * sqrt(max(1. - pq.x * pq.x / 0.0049, 0.)) - abs(pq.y), 0.07 - abs(pq.x));
  return max(d, plume);
}
float treeSil(vec2 q){
  float d = seg(q, vec2(0., -0.5), vec2(0., 0.02), 0.03 + 0.07 * smoothstep(-0.3, -0.5, q.y));
  vec2 a = vec2(abs(q.x), q.y);
  d = max(d, seg(a, vec2(0., -0.08), vec2(0.33, 0.1), 0.014)); d = max(d, seg(a, vec2(0., 0.0), vec2(0.23, 0.29), 0.013));
  d = max(d, seg(q, vec2(0., 0.0), vec2(0.05, 0.4), 0.012)); d = max(d, seg(a, vec2(0.16, 0.01), vec2(0.42, 0.2), 0.009));
  return d;
}
float treeCrown(vec2 q){
  float d = max(ell(q, vec2(0., 0.3), vec2(0.3, 0.13)), max(ell(q, vec2(-0.27, 0.15), vec2(0.2, 0.1)), ell(q, vec2(0.28, 0.17), vec2(0.19, 0.1))));
  return min(d, 0.5 * (abs(fract(q.x / 0.15 + 0.2) - 0.5) - 0.06) * 0.15);
}
void main(){
  vec2 q = vQ; float kind = vI.x, pass = vI.y, ph = vI.z; float px = max(length(fwidth(q)) * 0.7, 1e-5);
  float d = -1.; int can = int(pass + 0.5); bool thin = true; vec3 col = vec3(-1.);
  if (kind < 0.5) {                                                     // egret or tern body
    d = max(ell(q, vec2(-0.06, 0.), vec2(0.27, 0.12)), seg(q, vec2(0.14, 0.03), vec2(0.33, 0.2), 0.035));
    d = max(d, max(ell(q, vec2(0.36, 0.21), vec2(0.06, 0.045)), seg(q, vec2(0.4, 0.21), vec2(0.5, 0.19), 0.014)));
    d = max(d, seg(q, vec2(-0.25, -0.03), vec2(-0.5, -0.1), 0.012));
    if (ph > 0.5) {                                                     // standing on a crest: neck up, beak level, two legs
      d = max(ell(q, vec2(-0.02, -0.02), vec2(0.2, 0.105)), tap(q, vec2(0.11, 0.02), vec2(0.165, 0.3), 0.042, 0.03));
      d = max(d, max(ell(q, vec2(0.2, 0.33), vec2(0.06, 0.042)), tap(q, vec2(0.24, 0.335), vec2(0.38, 0.31), 0.018, 0.004)));
      d = max(d, max(tap(q, vec2(-0.03, -0.1), vec2(-0.04, -0.47), 0.022, 0.016), tap(q, vec2(0.05, -0.1), vec2(0.075, -0.47), 0.022, 0.016)));
      d = max(d, tap(q, vec2(-0.16, -0.03), vec2(-0.36, -0.13), 0.04, 0.008));
    }
  } else if (kind < 1.5) {                                              // a hinged wing card
    float xs = q.x + 0.5; d = min(0.44 * (1. - xs * xs) - abs(q.y + 0.25 * xs * xs), 0.5 - abs(xs - 0.5)) * 0.5;
    d = min(d, (abs(xs - 0.3) - 0.03) * 0.5);
  } else if (kind < 2.5) {                                              // dragonfly body
    // (the cutter's dragonfly, laid flat on its card: a head, a thorax, a long thin abdomen in four pieces held by bridges)
    d = max(max(ell(q, vec2(0.14, 0.), vec2(0.115, 0.058)), ell(q, vec2(0.295, 0.), vec2(0.052, 0.05))), min(tap(q, vec2(0.04, 0.), vec2(-0.47, 0.), 0.046, 0.022), (abs(fract(q.x / 0.13 + 0.2) - 0.5) - 0.07) * 0.13));
  } else if (kind < 3.5) {                                              // dragonfly wing island
    d = ell(q, vec2(0.04, 0.), vec2(0.46, 0.2 - 0.09 * smoothstep(0.1, -0.5, q.x)));
    if (ph > 0.5) { vec2 a = vec2(q.x, abs(q.y));                        // the four wings on one card: two pairs of long islands, parted from the body by a gap
      d = max(ell(rot2(a - vec2(0.2, 0.225), 1.3), vec2(0.), vec2(0.17, 0.044)), ell(rot2(a - vec2(0.06, 0.21), 1.95), vec2(0.), vec2(0.16, 0.054)));
      d = min(d, a.y - 0.072); }
  } else if (kind < 4.5) {                                              // spotted deer: orange body, white islands, black legs eye antlers
    // (as the cutter drew it: deep chest, tucked belly, round rump, a long neck carried up, a small head with one ear)
    float torso = max(max(ell(q, vec2(0.11, 0.065), vec2(0.15, 0.1)), ell(q, vec2(-0.17, 0.07), vec2(0.13, 0.095))), ell(q, vec2(-0.03, 0.075), vec2(0.2, 0.075)));
    if (pass < 0.5) { d = max(torso, max(tap(q, vec2(0.2, 0.1), vec2(0.315, 0.31), 0.052, 0.03), ell(rot2(q - vec2(0.36, 0.335), -0.25), vec2(0.), vec2(0.07, 0.036))));
      d = max(d, tap(q, vec2(0.31, 0.355), vec2(0.262, 0.428), 0.02, 0.007)); can = 2; }
    else if (pass < 1.5) {                                              // white: two rows of spot islands along the back, the belly, the scut
      vec2 g = vec2(q.x / 0.075 + 0.5 * floor(q.y / 0.055), q.y / 0.055); vec2 f = fract(g) - 0.5; float hh = sHash(floor(g) + 3.);
      d = (hh > 0.3 && q.y > 0.055 && q.y < 0.165) ? min((0.27 - length(f * vec2(1., 0.75) + (hh - 0.5) * 0.2)) * 0.055, torso - 0.018) : -1.;
      d = max(d, max(ell(q, vec2(0.0, -0.005), vec2(0.19, 0.022)), tap(q, vec2(-0.28, 0.1), vec2(-0.335, 0.165), 0.02, 0.012))); can = 1;
    } else {
      for (int i = 0; i < 4; i++) {
        float fi = float(i); vec2 hip = vec2(i < 2 ? 0.17 : -0.2, -0.02);
        float a = 0.68 * sin(ph + (i < 2 ? 0. : 3.14159) + mod(fi, 2.) * 0.7) + (i < 2 ? 0.25 : -0.25);
        vec2 knee = hip + 0.2 * vec2(sin(a), -cos(a)); vec2 foot = knee + 0.22 * vec2(sin(a * 0.4), -cos(a * 0.4));
        d = max(d, max(tap(q, hip, knee, 0.028, 0.019), seg(q, knee + (foot - knee) * 0.12, foot, 0.016)));
      }
      d = max(d, max(ell(q, vec2(0.368, 0.345), vec2(0.014, 0.014)), ell(q, vec2(0.424, 0.317), vec2(0.016, 0.014))));              // eye, nose
      d = max(d, max(seg(q, vec2(0.34, 0.37), vec2(0.305, 0.5), 0.0095), max(seg(q, vec2(0.322, 0.435), vec2(0.39, 0.495), 0.0085), seg(q, vec2(0.31, 0.47), vec2(0.265, 0.515), 0.008)))); can = 0;   // the antler, three tines
    }
  } else if (kind < 5.5) {                                              // peafowl: teal body, straw train, black barring
    float t = clamp((0.12 - q.x) / 0.62, 0., 1.); float cy = 0.035 * sin(q.x * 15. + ph) * t;
    float train = min(0.012 + 0.085 * sin(3.14159 * sqrt(t)) - abs(q.y - cy), 0.12 - q.x);
    if (pass < 0.5) { d = max(ell(q, vec2(0.2, 0.), vec2(0.125, 0.078)), max(tap(q, vec2(0.27, 0.03), vec2(0.38, 0.225), 0.034, 0.017), ell(q, vec2(0.398, 0.245), vec2(0.042, 0.03))));
      d = max(d, tap(q, vec2(0.43, 0.247), vec2(0.485, 0.232), 0.013, 0.003));                                   // the beak
      d = max(d, max(tap(q, vec2(0.392, 0.27), vec2(0.365, 0.35), 0.006, 0.017), max(tap(q, vec2(0.4, 0.272), vec2(0.405, 0.365), 0.006, 0.017), tap(q, vec2(0.408, 0.27), vec2(0.445, 0.35), 0.006, 0.017))));   // the crest: three quills, club-ended
      can = 4; }
    else if (pass < 1.5) { d = train; can = 3; }
    else { d = max(min(train - 0.012, (0.3 - abs(fract(t * 9.) - 0.5)) * 0.03), ell(q, vec2(0.41, 0.25), vec2(0.011, 0.011))); can = 0; }
  } else if (kind < 7.5) {                                              // drongo: one cut black card (and its teal copy slid to starboard)
    d = drongoSd(q, ph); thin = false;
  } else if (kind > 10.5) {                                             // the bent stem a drongo rides: straw sliver, white plume island
    float pl; d = stemSd(q, pl); can = pass > 3.5 ? 4 : (pl >= d - 1e-5 ? 1 : 3); thin = false;
  } else if (kind < 8.5) {                                              // silk-cotton tree: teal shadow, straw light, black limb islands, orange flower dots
    float own = step(1.5, ph);                                           // (2 + flip: the tree by the course, whose passes update() lays whole)
    vec2 tq = vec2(q.x * (ph - 2. * own > 0.5 ? -1. : 1.), q.y); float sil = treeSil(tq), crown = treeCrown(tq);
    if (pass < 0.5) { d = max(sil, crown); can = 4; }
    else if (pass < 1.5) { d = vDist > 300. ? max(sil, crown) : max(sil - 0.006, crown - 0.03); can = 3; }
    else if (pass < 2.5) { d = min(treeSil(tq + vec2(0.012, 0.)), (abs(fract(tq.y * 9. + tq.x * 4.) - 0.5) - 0.13) * 0.05); can = 0; }
    else { vec2 g = tq / 0.06 + vec2(0., 0.5 * floor(tq.x / 0.06)); vec2 f = fract(g) - 0.5; float hh = sHash(floor(g) + 9.);   // (every other column half a step up: no ruled grid)
      f += (vec2(sHash(floor(g) + 3.), sHash(floor(g) + 5.)) - 0.5) * 0.14;
      d = min((clamp(2.7 * px / 0.06, 0.34, 0.46) - length(f)) * 0.06, crown + 0.03) * step(0.45, hh) - step(hh, 0.45) - step(0.021, px); can = 2; }
    float order = pass < 0.5 ? 0. : (pass < 1.5 ? 1. : (pass < 2.5 ? 3. : 2.));          // still being made behind each mist band
    float made = smoothstep(0.02 + 0.13 * order, 0.05 + 0.13 * order, vAfter) * (1. - smoothstep(0.93, 0.99, vAfter));
    if (own < 0.5 && mix(1., made, smoothstep(uMist.y * 0.7, uMist.y, vDist)) < 0.5) d = -1.;
  } else if (kind > 9.5) {                                              // driftwood snag: a bleached trunk lying on the sand, cut in islands
    thin = false; vec2 a = vec2(q.x * (ph > 0.5 ? -1. : 1.), q.y);
    float w = max(seg(a, vec2(-0.46, -0.14), vec2(0.2, -0.06), 0.045 + 0.03 * smoothstep(0.1, -0.46, a.x)), seg(a, vec2(0.2, -0.06), vec2(0.47, 0.1), 0.026));
    w = max(w, max(seg(a, vec2(-0.12, -0.08), vec2(-0.02, 0.24), 0.022), seg(a, vec2(-0.02, 0.24), vec2(0.1, 0.34), 0.012)));
    w = max(w, max(seg(a, vec2(0.12, -0.06), vec2(0.27, 0.19), 0.017), seg(a, vec2(-0.34, -0.12), vec2(-0.43, 0.06), 0.02)));
    float br = (abs(fract(a.x / 0.21 + 0.37) - 0.5) - 0.045) * 0.21;                      // the bridges that hold the card together
    if (pass < 0.5) { d = w; can = 4; }
    else if (pass < 1.5) { d = min(w, br); can = 0; }
    else { d = min(seg(a - vec2(0., 0.024), vec2(-0.44, -0.14), vec2(0.2, -0.06), 0.017), br); can = 1; }   // light along its sunward edge
  } else {                                                              // the ring: one great card, four arcs held by four bridges
    vec2 m = q * 26.; float r = length(m); thin = false;
    float kf = smoothstep(250., 600., vDist);
    float arcs = min(min(r - 7.6 + 3.4 * kf, 9.4 + 3.3 * kf - r), min(abs(m.x - m.y), abs(m.x + m.y)) * 0.7071 - 0.55 - 1.5 * kf);
    float n = sNoise(m * 0.45 + 3.);
    if (pass < 0.5) { d = arcs; can = 4; }
    else if (pass < 1.5) { d = arcs; can = 2; }
    else if (pass < 2.5) { d = min(arcs, min(0.26 - abs(r - 8.05), m.x * 0.6 + m.y - 1.5)); if (n > uRingIn.x) d = -1.; can = 1; }
    else { d = min(arcs, min(0.24 - abs(r - 9.0), (abs(fract((m.x - m.y) * 0.32) - 0.5) - 0.16) * 2.)); d = min(d, 2. - m.x * 0.6 - m.y); if (n > uRingIn.y) d = -1.; can = 0; }
    d /= 26.;
  }
  if (d / px + 0.5 < 0.5) discard;
  vec4 c = canAt(can, thin ? vDist : 0.);
  if (c.a < 0.5) discard;
  gl_FragColor = vec4(can == 3 ? mix(uBodyC, c.rgb, step(300., vDist)) : c.rgb, 1.);
}`;

const hsh = (n) => { const x = Math.sin(n * 127.1 + 3.7) * 43758.5453; return x - Math.floor(x); };
const DLAG = [0, 0.00022, 0.00045], FLAG = [0, 0.12, 0.25];                 // how far the white and black passes run behind (deer in u, fowl in s)
const jit = (k, s) => (hsh(k) * (1 - s) + hsh(k + 3.1) * s) - 0.5;       // a dart-and-hold wander between two hashed spots
const sstep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

async function buildCast(ctx, style, look, path, ringC, ringT, rare) {
  const rng = ctx.rng.fork ? ctx.rng.fork('cast') : ctx.rng, dens = Math.min(1.3, Math.max(0.7, ctx.vary?.density ?? 1));
  const MAX = 1200, aPos = new Float32Array(MAX * 4), aDef = new Float32Array(MAX * 4), aAnim = new Float32Array(MAX * 4);
  let n = 0; const L = path.length, SWK = look.swk;
  const add = (kind, w, h, pass, side = 0, ph = 0) => { const i = n++; aDef.set([w, h, kind, 0], i * 4); aAnim.set([ph, 1, pass, side], i * 4); return i; };
  const put = (i, x, y, z, hd) => { aPos[i * 4] = x; aPos[i * 4 + 1] = y; aPos[i * 4 + 2] = z; aPos[i * 4 + 3] = hd; };
  const P0 = new THREE.Vector3(), T0 = new THREE.Vector3();
  // silk-cotton trees: three in the entry view, the rest far round; four passes parted half a metre, teal slid to starboard
  // (each visit they stand in their own places and sizes, the cards flipped or not: two days are told apart by the first frame)
  const sd = (ctx.seed % 9973) * 0.731, tj = (k) => hsh(sd + k * 1.7) - 0.5;
  const trees = [[-42 + 20 * tj(1), 24 + 20 * tj(2), 25 + 6 * tj(3)], [75 + 36 * tj(4), 116 + 30 * tj(5), 23 + 6 * tj(6)], [-17 - 5 * hsh(sd + 9.1), 141 + 12 * tj(8), 27 + 4 * tj(9)]];   // the third stands close by the course: half the frame high as we pass it at u 0.25
  const nT = Math.round(8 * dens), course = [], arrival = { due: 0 };
  for (let i = 0; i < nT; i++) { const far = rng.range(140, 620) * (rng() < 0.5 ? -1 : 1), z = rng() < 0.75 ? rng.range(-110, 420) : rng.range(790, 1150); trees.push([far, z, rng.range(18, 26)]); }
  trees.forEach(([x, z, H], k) => {
    const s = H / 0.93, hd = Math.atan2(z - (k < 3 ? -40 : 150), -x), nx = Math.cos(hd), nz = -Math.sin(hd), sg = 1, flip = k < 3 ? (hsh(sd + k * 3.3 + 0.4) < 0.5 ? 0 : 1) : k % 2;   // the card faces the open sea (the first three face the entry)
    for (let p = 0; p < 4; p++) { const o = (p - 1) * 0.5 * sg, i = add(8, s, s, p, 0, flip + (k === 2 || k === 0 ? 2 : 0)); if (k === 2) course.push(i);
      put(i, x + nx * o + (p === 0 ? -1.3 : 0), s / 2 - 0.02 * s + (p === 0 ? -0.7 : 0), z + nz * o, hd); }
  });
  await ctx.yield();
  // the ring: 14 m across inside, four arcs, three passes half a metre apart and a teal shadow ring slid to starboard
  const rh = Math.atan2(ringT.x, ringT.z) + Math.PI / 2;
  for (let p = 0; p < 4; p++) { const o = p === 0 ? 0.6 : -(p - 1) * 0.5, i = add(9, 26, 26, p);
    put(i, ringC.x + ringT.x * o + (p === 0 ? -0.9 : 0), ringC.y + (p === 0 ? -0.6 : 0), ringC.z + ringT.z * o, rh); }
  // A RULE OF THE PLACE: an egret is a body, and a body is kept off the lens by where it is, never by a guard that follows the lens.
  // The route is the built path walked in metres, a point every 0.25 m, made once here. An egret's stage of flight reads nothing but the
  // metres flown (update: ft, from u), so at the route's point of metre m the bird's reach is the bird at the stages of the metres within
  // 5 m either side of m (the stage path between two neighbouring points taken as a straight piece): standing at its berth, along its lift
  // and along its whole line of flight to its last place, as a ball round its place wide enough for the furthest its cards can come from
  // it (the body card's corner at any turn and pitch; a wing card's far corners from its hinge, at any beat; for the first forty-two the
  // teal copy's corner, slid as it hangs; and the sway of the swell while it stands). Where the route comes within 2.0 m of that reach
  // (2.05 here, for the step between two points) the bird is NOT LAID: it keeps every draw and every slot, and its cards are given no size,
  // so no triangle of it has any area. The test reads places in world metres only: no lens, no clock, no seed, no detail, no picture size.
  await ctx.yield();
  const RM = 0.25, nR = Math.ceil(L / RM), route = new Float64Array(nR * 3 + 3); let gs = 0;   // gs: the greatest step between two points of the route
  for (let k = 0; k <= nR; k++) { path.pointAt(Math.min(1, k * RM / L), P0); route[k * 3] = P0.x; route[k * 3 + 1] = P0.y; route[k * 3 + 2] = P0.z;
    if (k) gs = Math.max(gs, Math.hypot(P0.x - route[k * 3 - 3], P0.y - route[k * 3 - 2], P0.z - route[k * 3 - 1])); if (k % 256 === 255) await ctx.yield(); }
  await ctx.yield();
  const clearAir = (e) => { const S = e.size, card = e.sh < 0 ? 0.886 * S : 0.9405 * S + 0.3;   // false: the route comes within the clear air of its reach
    // (R1: the widest the reach ever is; B: the most the bird moves from one stage to the next; V: the most the bird and the route's point of
    // its stage close in one stage. The points within 5 m of metres of a stage are 21 steps from its own point at the most, so a stage found
    // further off than T = R1 + 21 steps + B has none of them inside its reach, and the stages after it are passed over until the two could
    // have closed to T again. A nearer stage is first held against three of its points, fourteen steps apart: every other one is within seven
    // steps of one of the three. The test is the same as walking every stage against every one of its points, in far fewer steps)
    const R1 = 2.4743 + card, B = 40 * RM / L * Math.hypot(5.2 * e.dir, e.vz, 0.55 * e.rise + 2.05), V = gs + B, T = R1 + 21 * gs + B;
    let x = 0, y = 0, z = 0, ax = 0, ay = 0, az = 0, af = 0, far = true; const off = (k) => Math.hypot(x - route[k * 3], y - route[k * 3 + 1], z - route[k * 3 + 2]);
    for (let j = 0; j <= nR; j++) {
      const ft = Math.max(0, Math.min(1, j * RM / L) - e.uL) * 40, fly = sstep(0, 0.5, ft);
      x = e.x + e.dir * 5.2 * ft; y = e.y + e.rise * (1 - Math.exp(-ft * 0.55)) + 0.5 * Math.sin(ft * 1.1 + e.ph) * fly; z = e.z + e.vz * ft;
      const d = off(j); if (d >= T) { j += Math.floor((d - T) / V); far = true; continue; }
      if (far) { ax = x; ay = y; az = z; af = fly; far = false; }
      const R = 2.05 + 0.4243 * (1 - af) + (e.sh < 0 ? S * Math.max(0.7072, 0.04 + 0.846 * (0.35 + 0.65 * fly)) : card);
      if (Math.min(d, off(Math.max(0, j - 14)), off(Math.min(nR, j + 14))) < R + 7 * gs + B) { const ux = x - ax, uy = y - ay, uz = z - az, ul = ux * ux + uy * uy + uz * uz;
        for (let k = Math.max(0, j - 21); k <= Math.min(nR, j + 20); k++) { const qx = route[k * 3] - ax, qy = route[k * 3 + 1] - ay, qz = route[k * 3 + 2] - az, t = ul > 0 ? Math.min(1, Math.max(0, (qx * ux + qy * uy + qz * uz) / ul)) : 0;
          const wx = qx - ux * t, wy = qy - uy * t, wz = qz - uz * t; if (wx * wx + wy * wy + wz * wz < R * R) return false; } }
      ax = x; ay = y; az = z; af = fly; }
    return true; };
  // egrets: one white layer, two hinged wing cards; thirty lift together
  const egrets = [], nE = Math.round(160 * dens);
  for (let i = 0; i < nE; i++) {
    let x, z, dir, uH;
    if (i < 30) { z = rng.range(80, 118); x = rng.range(7, 34); dir = -2.4; uH = (z + 12 + 56) / L; }
    else { uH = rng.range(0.14, 0.94); path.pointAt(uH, P0); const lat = rng.range(5, 75) * (rng() < 0.5 ? -1 : 1); x = P0.x + lat; z = P0.z; dir = lat > 0 ? -1 : 1; if (rng() < 0.45) dir = 0; }
    let size = rng.range(1.15, 1.5) * (i < 30 ? 1.6 : 1), yS = 3.75, rise = 7.5, hdS = 9, vz = 0; const lr = rng.range(0, 14); let uL = uH - (38 + lr) / L;
    if (i < 30) {                                                       // the thirty stand in one patch of the swell to port of our line and lift as we come up to it, one after another:
      // each goes as the lens comes within 12 to 40 m of where it stands, and crosses the nose; the nearer a bird lifts, the faster it goes on ahead
      // of us (we never fly through the flock), and each climbs to a height of its own. One rule from the lens, wherever the patch lies.
      const r2 = lr / 14;
      uL = (z + 56 - (12 + 28 * r2)) / L; vz = 19.2 - 5.6 * r2; rise = 4.5 + 9 * hsh(i * 2.7 + 0.6);
    } else if (i < 42) {                                                // twelve in the entry frame: standing on the swell crests above the plumes, three already in the air to port
      const k = i - 30; z = -12 + 3.2 * k + 2 * hsh(k + 0.3); x = (hsh(k * 7.3 + 1) - 0.5) * 56; if (Math.abs(x + 2) < 5) x += x > -2 ? 6 : -6; dir = x > 0 ? 2.2 : -2.2; rise = 3.5; size *= 2.0; yS = 5.0 + 0.47 * size;   // (they go out to the sides and on ahead of us, never over the lens) uL = (z + 56 - 30 - lr) / L;
        hdS = (hsh(k + 0.9) < 0.5 ? 1 : -1) * (1.5708 + (hsh(k + 0.7) - 0.5) * 0.6);   // side-on to the entry, feet on the plume line
      if (k < 3) { x = 15 + 7 * k; z = -8 + 6 * k; dir = -1; rise = 7.5; uL = -0.03 - 0.008 * k; }
    }
    const sand = z > SAND_Z0 + 16 && z < RIVER_Z0 - 6;
    egrets.push({ x, z, y: sand ? 0.55 : (z > 345 && z < SAND_Z0 + 16 ? 2.6 : yS), dir, uL, rise, vz: vz || 8.5 * (0.4 + 0.6 * Math.abs(dir) + 0.3), ph: rng() * 6.28, size, hd: hdS < 8 ? (rng.range(-1, 1), hdS) : rng.range(-1, 1), sh: i < 42 ? add(0, size, size, CAN.teal) : -1,
      b: add(0, size, size, CAN.white), w1: add(1, size * 0.8, size * 0.55, CAN.white, 1), w2: add(1, size * 0.8, size * 0.55, CAN.white, -1) });
    { const e = egrets[i]; if (!clearAir(e)) for (const c of [e.sh, e.b, e.w1, e.w2]) if (c >= 0) aDef[c * 4] = aDef[c * 4 + 1] = 0; await ctx.yield(); }   // not laid (the rule of the place above): dealt and slotted as ever, drawn as nothing; a hand-back after each bird's test
    if (i % 40 === 39) await ctx.yield();                              // (this function draws from its own fork of the rng)
  }
  await ctx.yield();
  // dragonflies over the trail: teal body, two white wing islands
  const flies = [], nD = Math.round(40 * dens);
  // the first nine hold 4 to 9 m ahead of the lens down the trail, darting on each time we close (S0..S1 in path metres), then let us pass
  const nEsc = Math.min(9, nD), S0 = L * 0.418, S1 = L * 0.548, HOP = 6.5;
  for (let i = 0; i < nD; i++) { path.pointAt(0.43 + (rng.range(0.43, 0.63) - 0.43) * 0.62, P0); /* none over the lie: the hero has that air */ const lat = rng.range(0.5, 2.0) * (rng() < 0.5 ? -1 : 1) * 0.72;
    flies.push({ x: P0.x + lat, y: rng.range(0.8, 2.7), z: P0.z, ph: rng() * 9, sg: Math.sign(lat), hd: rng.range(-1.5, 1.5), lat, esc: i < nEsc, off: (i * HOP * 5 / nEsc) % HOP,
      sz: i < 3 ? 1.05 : 0.7, b: add(2, i < 3 ? 1.05 : 0.7, i < 3 ? 1.05 : 0.7, CAN.teal), w1: add(3, i < 3 ? 1.05 : 0.7, i < 3 ? 1.05 : 0.7, CAN.white, 0, 1), w2: add(3, 0.1, 0.1, CAN.white, -1) }); }
  await ctx.yield();
  // spotted deer: orange body, white islands, black legs a beat behind
  const deer = [], nDeer = Math.max(10, Math.round(14 * dens));
  for (let i = 0; i < nDeer; i++) { const rank = i >> 1, bear = (7 + 19 * (rank + 0.5 * rng()) / Math.ceil(nDeer / 2)) * D2R, dist = [13, 22, 16.5, 26, 12, 20, 15, 24, 14][rank % 9] + rng.range(-0.7, 0.7);
    deer.push({ lead: dist * Math.cos(bear) / L, lat: dist * Math.sin(bear) * (i % 2 ? -1 : 1), ph: rng() * 6, size: rng.range(3.2, 3.9), uTurn: 0.826 + 0.022 * hsh(i * 3.7 + 1),
    id: [add(4, 1, 1, 0), add(4, 1, 1, 1), add(4, 1, 1, 2)] }); }
  for (const dd of deer) dd.lat = Math.sign(dd.lat) * Math.max(2.6, Math.min(Math.abs(dd.lat), (0.62 * dd.lead * L - 2.0) / 1.25));
  // peafowl: teal body, straw train, black barring, two teal wing cards
  const fowl = [];
  // (they go up 14 to 29 m ahead of the lens and hold there, three to port and two to starboard, one crossing the nose from starboard to port)
  const FOWL = [[15, 5.5, 5.5], [14, -4.5, -4.5], [24.5, -3.5, 2.2], [21, -8, -8], [29, 9, 9]];
  for (let i = 0; i < 5; i++) fowl.push({ uGo: 0.688 + i * 0.004 + rng() * 0.002, lead: FOWL[i][0] + rng.range(-0.6, 0.6), lat0: FOWL[i][1], lat1: FOWL[i][2], lat: FOWL[i][2],
    id: [add(5, 3.4, 3.4, 0), add(5, 3.4, 3.4, 1), add(5, 3.4, 3.4, 2)], w1: add(1, 1.25, 0.8, CAN.teal, 1), w2: add(1, 1.25, 0.8, CAN.teal, -1) });
  // two river terns over the sand (white, black cap) and nine drongos riding bent stems
  const terns = [[63, 11.5, 512, 1.2], [29, 12.6, 541, 1.2], [46, 10.2, 476, 1.7], [39.5, 11.4, 481, 1.6]].map(([x, y, z, sz], i) => ({ x, y, z, ph: i * 2.1,
    b: add(0, sz, sz, CAN.white), cap: add(3, 0.2, 0.1, CAN.black), w1: add(1, 1.0, 0.6, CAN.white, 1), w2: add(1, 1.0, 0.6, CAN.white, -1) }));
  // nine drongos, each a cut black card with its teal copy, riding a tall stem bent over under it (the stem and its teal copy are cards too);
  // x, z = where its feet are, yF = how high, hd = the way it faces (the cards are side-on to where we see them from), lift = how far the wing is raised
  const drongos = [], LIFT = [0.3, 0.14, 0.7, 0, 1, 0.5, 0.15, 0.85, 0.4];
  for (let i = 0; i < 9; i++) { const big = i === 1 || i === 3 || i === 4 || i === 5, size = big ? 1.9 : i < 6 ? 0.95 : 1.15;
    const d = { x: rng.range(3.2, 8) * (i % 2 ? -1 : 1), z: -22 + i * 24 + rng.range(-6, 6), yF: 3.8, ph: rng() * 6, size, lift: LIFT[i] };
    d.hd = (d.x > 0 ? -1 : 1) * 1.5708 + (d.ph - 3) * 0.14;
    if (i >= 5) { const uD = [0.4405, 0.479, 0.511, 0.538][i - 5]; path.pointAt(uD, P0); path.tangentAt(uD, T0); const tl = Math.hypot(T0.x, T0.z) || 1, la = i % 2 ? -2.45 : 2.45;   // three ride stems of the trail walls, against the sky
      d.x = P0.x + T0.z / tl * la; d.z = P0.z - T0.x / tl * la; d.yF = i === 5 ? 3.9 : 4.3; d.hd = Math.atan2(T0.x, T0.z) + 1.5708 * (i % 2 ? 1 : -1); }   // side-on to the trail, looking in over it
    d.S = d.yF / 0.828;
    d.st = add(11, d.S, d.S, 4); d.s = add(11, d.S, d.S, 3); d.t = add(7, size, size, CAN.teal, 0, d.lift); d.i = add(7, size, size, CAN.black, 0, d.lift);
    drongos.push(d); }

  // three driftwood snags on the sand: teal shadow slid to starboard, black wood in islands, a white light along the top
  [[42.5, 493, 7.5, 0], [66, 519, 6.5, 1], [29, 541, 8, 0], [48.5, 466.5, 5.8, 1], [47.6, 521, 6.6, 0], [38.6, 441.6, 7.4, 1]].forEach(([x, z, w, flip]) => {
    const hd = Math.atan2(ringT.x, ringT.z) + Math.PI / 2 + (flip ? 0.25 : -0.2);
    for (let p = 0; p < 3; p++) { const o = (p - 1) * 0.16, i = add(10, w, w, p, 0, flip); put(i, x + ringT.x * -o + (p === 0 ? -0.35 : 0), w * 0.2 + (p === 0 ? -0.16 : 0), z + ringT.z * -o, hd); }
  });
  await ctx.yield();
  const quad = new THREE.PlaneGeometry(1, 1), g = new THREE.InstancedBufferGeometry();
  g.index = quad.index; g.setAttribute('position', quad.getAttribute('position'));
  const attrs = [['aPos', aPos], ['aDef', aDef], ['aAnim', aAnim]].map(([name, arr]) => { const a = new THREE.InstancedBufferAttribute(arr, 4); a.setUsage(THREE.DynamicDrawUsage); g.setAttribute(name, a); return a; });
  g.instanceCount = n;
  const mat = new THREE.ShaderMaterial({ uniforms: { ...style.uniforms, uRingIn: { value: new THREE.Vector2(2, 2) }, uBodyC: { value: style.cans[CAN.straw] } },
    vertexShader: STYLE_GLSL + CAST_VERT, fragmentShader: STYLE_GLSL + CAST_FRAG, side: THREE.DoubleSide });
  const mesh = new THREE.Mesh(g, mat); mesh.frustumCulled = false; mesh.renderOrder = 3;
  const setWing = (i, x, y, z, hd, ang, vis) => { put(i, x, y, z, hd); aDef[i * 4 + 3] = ang; aAnim[i * 4 + 1] = vis; };

  // an animal that runs with us is whole inside the frame or well out of it: its place is drawn in to the width of the view (and, for
  // the birds, under its top edge) while it is with us; past u 0.84 the herd is let go to port
  let vX = 0, vZ = 0;
  const inView = (cam, gz, x, z, half, uu) => { const dx = x - cam.x, dz = z - cam.z, d = Math.hypot(dx, dz) || 1; let b = Math.atan2(dx, dz) - gz; b -= 6.2832 * Math.round(b / 6.2832);
    const lim = Math.max(0.12, 0.72 - Math.atan(half / d)) + 3 * sstep(0.84, 0.9, uu), k0 = 0.62 * lim, ab = Math.abs(b); if (ab <= k0) return false;
    const a = gz + Math.sign(b) * (k0 + (lim - k0) * (1 - Math.exp(-(ab - k0) / (lim - k0)))); /* a soft knee: those furthest out stay furthest out */ vX = cam.x + d * Math.sin(a); vZ = cam.z + d * Math.cos(a); return true; };
  function update(time, u, cam, camD) {
    const gz = Math.atan2(camD.x, camD.z);
    for (const e of egrets) {                                           // standing on the swells, lifting ahead of us, crossing the nose
      // (the build's test clearAir, above, walks a second copy of this law of ft, x, z and y and of its clock: change one and the other must be changed with it)
      const ft = Math.max(0, u - e.uL) * 40, fly = sstep(0, 0.5, ft);
      const sw = Math.sin(e.x * SWK.x + e.z * SWK.y - time * SWK.z);
      const x = e.x + e.dir * 5.2 * ft + 0.3 * sw * (1 - fly), z = e.z + e.vz * ft, y = e.y + 0.3 * sw * (1 - fly) + e.rise * (1 - Math.exp(-ft * 0.55)) + 0.5 * Math.sin(ft * 1.1 + e.ph) * fly;
      // in the air the body card is held three-quarter to the lens and never nearer its edge than 55 degrees (a card seen along itself is a
      // scratch); the two wing cards are raised in a V at two different angles, beating between a shallow V and a steep one
      let hd = e.hd, flap = -1.25, flap2 = -1.25;
      if (fly > 0) { const hT = Math.atan2(e.dir * 5.2, e.vz); let dl = Math.atan2(x - cam.x, z - cam.z) - hT; dl -= 6.2832 * Math.round(dl / 6.2832);
        const ad = Math.abs(dl), want = Math.max(0.96, Math.min(3.1416 - 0.96, ad)); hd = hT + (dl < 0 ? -1 : 1) * (ad - want);
        const bt = Math.sin(time * 6.5 + e.ph); flap = 0.5 + 0.28 * (1 + bt); flap2 = 0.24 + 0.2 * (1 + Math.sin(time * 6.5 + e.ph + 0.8)); }
      put(e.b, x, y, z, hd); aDef[e.b * 4 + 3] = fly * 0.25 * Math.exp(-ft * 0.4);
      if (e.sh >= 0) { put(e.sh, x - 0.2 * e.size, y - 0.12 * e.size, z + 0.3, hd); aDef[e.sh * 4 + 3] = aDef[e.b * 4 + 3]; aAnim[e.b * 4] = aAnim[e.sh * 4] = fly < 0.5 ? 1 : 0; }      // its teal shadow, slid to starboard
      const wy = y + 0.04 * e.size; setWing(e.w1, x, wy, z, hd, flap, 0.35 + 0.65 * fly); setWing(e.w2, x, wy, z, hd, flap2, 0.35 + 0.65 * fly);
    }
    for (const f of flies) {                                            // darting and holding; they part from the lens
      const t = time * 0.8 + f.ph, k = Math.floor(t), s = sstep(0, 0.28, t - k), kb = k * 3.1 + f.ph * 17;
      let bx = f.x, bz = f.z;
      if (f.esc) { const kk = Math.min((S1 - S0 - f.off) / HOP, Math.max(0, (u * L - S0 - f.off) / HOP)), n = Math.floor(kk);
        const uf = (S0 + f.off + 3.8 + HOP * (n + sstep(0, 0.14, kk - n))) / L; path.pointAt(uf, P0); path.tangentAt(uf, T0);
        const tl = Math.hypot(T0.x, T0.z) || 1; bx = P0.x + T0.z / tl * f.lat; bz = P0.z - T0.x / tl * f.lat; }
      const near = 1 - sstep(2.5, 7, Math.hypot(bx - cam.x, bz - cam.z));
      const x = bx + jit(kb, s) * (f.esc ? 0.5 : 1.3) + f.sg * near * 2.4, y = f.y + jit(kb + 1, s) * 0.7 + near * 0.3, z = bz + jit(kb + 2, s) * (f.esc ? 0.6 : 2.4);
      // the card is held side-on to the lens: body in profile, the two white wing islands raised over it
      const hd = Math.atan2(x - cam.x, z - cam.z) + f.sg * 1.5708 + jit(kb + 3, s) * 0.9, fl = 0.3 * Math.sin(time * 15 + f.ph), fx = Math.sin(hd) * 0.1, fz = Math.cos(hd) * 0.1;
      const vis = sstep(2.0, 3.4, Math.hypot(x - cam.x, y - cam.y, z - cam.z));   // never a bare rod across the lens: inside 3 m a fly has already darted off
      // (body and wings are one flat card each, turned to the lens like a pinned specimen and tipped a little; the wing card quivers)
      const tilt = 0.2 + 0.35 * jit(kb + 4, s);
      put(f.b, x, y, z, hd); aAnim[f.b * 4 + 1] = vis; aDef[f.b * 4 + 3] = tilt;
      put(f.w1, x, y, z, hd); aAnim[f.w1 * 4 + 1] = vis; aDef[f.w1 * 4 + 3] = tilt; aDef[f.w1 * 4 + 1] = f.sz * (0.88 + 0.12 * Math.sin(time * 11 + f.ph)); aAnim[f.w2 * 4 + 1] = 0;
    }
    for (const dd of deer) for (let p = 0; p < 3; p++) {                // flushed at 26 s, bounding ahead on both sides, wheeling away to port along the water
      const uu = u - DLAG[p], i = dd.id[p], vis = sstep(0.646, 0.664, uu);
      const s = Math.min(0.992, uu + dd.lead + 0.05 * Math.max(0, uu - 0.653)), wheel = sstep(0.808, 0.954, uu);
      path.pointAt(s, P0); path.tangentAt(s, T0); const tl = Math.hypot(T0.x, T0.z) || 1, tx = T0.x / tl, tz = T0.z / tl;
      const lat = dd.lat * (1 + 5 * Math.max(0, uu - 0.662)) + wheel * wheel * (70 + Math.abs(dd.lat) * 2), ph = s * L / 3.4 + dd.ph, b = Math.abs(Math.sin(ph));
      let x = P0.x + tz * lat, z = P0.z - tx * lat; if (vis > 0 && inView(cam, gz, x, z, 0.56 * dd.size, uu)) { x = vX; z = vZ; }
      // the cards are held side-on to the lens (a card seen along its edge is a line): noses out to their own side, then all to port as the herd wheels
      // (the starboard deer swing round in one quick turn between the beats, so no card is ever left standing edge-on)
      const o0 = 1.16 + 0.12 * Math.sin(dd.ph), tn = sstep(dd.uTurn, dd.uTurn + 0.008, uu);
      const hd = Math.atan2(x - cam.x, z - cam.z) + (dd.lat > 0 ? o0 + (1.3 - o0) * wheel : -o0 + (1.3 + o0) * tn), rx = Math.cos(hd), rz = -Math.sin(hd);
      put(i, x + rx * 0.14 * p, (0.5 + 1.1 * b) * dd.size * 0.5 * vis + 0.45 * dd.size * 0.5, z + rz * 0.14 * p, hd);
      aDef[i * 4] = dd.size; aDef[i * 4 + 1] = dd.size; aDef[i * 4 + 3] = 0.2 * Math.sin(2 * ph + 0.6); aAnim[i * 4] = 2 * ph; aAnim[i * 4 + 1] = vis;
    }
    for (const f of fowl) {                                             // rocketing up out of the reeds, trains streaming
      for (let p = 0; p < 3; p++) {
        const uu = u - FLAG[p] * 0.0045, tt = (uu - f.uGo) * 40, i = f.id[p], vis = sstep(0, 0.2, tt), c = Math.max(0, tt);
        const sA = Math.min(0.995, f.uGo + f.lead / L + (uu - f.uGo) * 0.96), off = sstep(0.795, 0.83, uu);   // they keep ahead of us, then sweep away to port with the herd
        path.pointAt(sA, P0); path.tangentAt(sA, T0); const tl = Math.hypot(T0.x, T0.z) || 1, lat = f.lat0 + (f.lat1 - f.lat0) * sstep(0.2, 1.6, c) + Math.sign(f.lat1) * Math.min(0.5 * c, 1.2) + 70 * off;
        let x = P0.x + T0.z / tl * lat, z = P0.z - T0.x / tl * lat, y = Math.max(1.2, P0.y - 2.6) + 4.4 * (1 - Math.exp(-c * 0.7)) + Math.min(0.3 * c, 0.9) + 0.25 * Math.sin(time * 2.3 + f.lead);
        if (vis > 0 && off < 0.02) { if (inView(cam, gz, x, z, 2.1, uu)) { x = vX; z = vZ; } y = Math.min(y, cam.y + Math.hypot(x - cam.x, z - cam.z) * 0.36 - 1.0); }
        // the card is held side-on to the lens (seen along its edge it is a scratch): nose out to its own side and on, the train streaming down behind
        const hd = Math.atan2(x - cam.x, z - cam.z) + Math.sign(f.lat1) * (1.12 + 0.2 * Math.sin(f.lead)), pitch = 0.3 + 0.6 * Math.exp(-c * 0.6), rx = Math.cos(hd), rz = -Math.sin(hd);
        put(i, x + rx * 0.16 * p, y, z + rz * 0.16 * p, hd); aDef[i * 4 + 3] = pitch; aAnim[i * 4] = time * 9; aAnim[i * 4 + 1] = vis;
        if (p === 0) { const fl = 0.25 + 0.85 * Math.sin(time * 15 + f.lead), sx = Math.sin(hd) * 0.7 * Math.cos(pitch), sz = Math.cos(hd) * 0.7 * Math.cos(pitch), sy = 0.7 * Math.sin(pitch) + 0.06;
          setWing(f.w1, x + sx, y + sy, z + sz, hd, fl, vis); setWing(f.w2, x + sx, y + sy, z + sz, hd, fl, vis); }
      }
    }
    for (const t of terns) {                                            // hovering and tilting
      const y = t.y + 0.35 * Math.sin(time * 1.3 + t.ph), x = t.x + 0.6 * Math.sin(time * 0.5 + t.ph), hd = -2.2 + 0.4 * Math.sin(time * 0.4 + t.ph), tilt = -0.35 + 0.25 * Math.sin(time * 0.9 + t.ph);
      put(t.b, x, y, t.z, hd); aDef[t.b * 4 + 3] = tilt; const fl = 0.2 + 0.7 * Math.sin(time * 13 + t.ph);
      put(t.cap, x + Math.sin(hd) * 0.42, y + 0.3 + 0.42 * Math.sin(tilt), t.z + Math.cos(hd) * 0.42, hd); aAnim[t.cap * 4 + 3] = 0;
      setWing(t.w1, x, y + 0.05, t.z, hd, fl, 1); setWing(t.w2, x, y + 0.05, t.z, hd, fl, 1);
    }
    for (const dr of drongos) {                                         // bird and stem swing together with the swell, about the stem's root
      const sw = Math.sin(dr.x * SWK.x + dr.z * SWK.y - time * SWK.z + 0.4), a = 0.085 * sw + 0.02 * Math.sin(time * 2.3 + dr.ph), ca = Math.cos(a), sa = Math.sin(a);
      const S = dr.S, fx = Math.sin(dr.hd), fz = Math.cos(dr.hd), rx = -0.32 * S, ry = -0.5 * S, gx = 0.389 * S, gy = 0.828 * S;
      const Rx = dr.x - fx * gx, Rz = dr.z - fz * gx, Ry = dr.yF - gy;                      // the root, on the ground
      const cp = -(ca * rx - sa * ry), cy = -(sa * rx + ca * ry);                           // the stem card's centre, from the root, in the card's plane
      put(dr.s, Rx + fx * cp, Ry + cy, Rz + fz * cp, dr.hd); aDef[dr.s * 4 + 3] = a;
      const vx = dr.x - cam.x, vz = dr.z - cam.z, vl = Math.hypot(vx, vz) || 1, bx0 = vx / vl * 0.16, bz0 = vz / vl * 0.16;   // the teal copies hang behind, slid to starboard and down
      put(dr.st, Rx + fx * cp - 0.2 + bx0, Ry + cy - 0.13, Rz + fz * cp + bz0, dr.hd); aDef[dr.st * 4 + 3] = a;
      const fpx = ca * gx - sa * gy, fpy = sa * gx + ca * gy, b = 0.6 * a + 0.1 * dr.lift, cb = Math.cos(b), sb = Math.sin(b), ox = 0.1 * dr.size, oy = -0.165 * dr.size;
      const bp = fpx - (cb * ox - sb * oy), by = Ry + fpy - (sb * ox + cb * oy), k = dr.size / 1.9;
      put(dr.i, Rx + fx * bp, by, Rz + fz * bp, dr.hd); aDef[dr.i * 4 + 3] = b;
      put(dr.t, Rx + fx * bp - 0.24 * k + bx0, by - 0.15 * k, Rz + fz * bp + bz0, dr.hd); aDef[dr.t * 4 + 3] = b;
    }
    // the tree by the course is never cut by the mist circle round the lens: its teal pass always stands, and straw, flower dots and black
    // are each laid whole or not at all, by the same mist clock as every far stand until the lens is at TREE_IN, where whatever is still to
    // come lands in spraying order within a quarter of a second (behind the puff the world hangs on it): the tree is finished as the gaze turns to it
    { const mc = (trees[2][0] * WIND[0] + trees[2][1] * WIND[1] - 3 * time) / MIST_S, aft = (((1.82 - (mc - Math.floor(mc))) % 1) + 1) % 1;
      for (let p = 1; p < 4; p++) { const o = p === 1 ? 1 : p === 2 ? 3 : 2; aAnim[course[p] * 4 + 1] = u >= TREE_IN + 0.004 * (o - 2) || (aft >= 0.035 + 0.13 * o && aft <= 0.96) ? 1 : 0; }
      arrival.due = 1 - sstep(0.425, 0.455, aft) * (1 - sstep(0.93, 0.96, aft)); }    // 1 while any pass is still to come by the clock
    for (const a of attrs) a.needsUpdate = true;
  }
  return { mesh, mat, quad, update, trees, arrival };
}

// ---- four small companies, each at a place of the world, in one more instanced mesh drawn with the cast's own material (no new program).
// Each family has a stream of its own made from the world's seed and a name, which draws from no other stream. Nothing here reads the lens:
// what happens at a place is driven by the metres we have flown; what swings, darts, beats or dips runs on the world's clock.
async function buildCompany(ctx, cast, look, path, ringC, ringT) {
  const stream = (name) => ctx.core.makeRng(ctx.core.hashSeed(name + ':' + ctx.seed));
  const dens = Math.min(1.3, Math.max(0.7, ctx.vary?.density ?? 1)), L = path.length, SWK = look.swk;
  const MAX = 96, aPos = new Float32Array(MAX * 4), aDef = new Float32Array(MAX * 4), aAnim = new Float32Array(MAX * 4);
  let n = 0;
  const add = (kind, w, h, pass, side = 0, ph = 0) => { const i = n++; aDef.set([w, h, kind, 0], i * 4); aAnim.set([ph, 1, pass, side], i * 4); return i; };
  const put = (i, x, y, z, hd) => { aPos[i * 4] = x; aPos[i * 4 + 1] = y; aPos[i * 4 + 2] = z; aPos[i * 4 + 3] = hd; };
  const setWing = (i, x, y, z, hd, ang, vis) => { put(i, x, y, z, hd); aDef[i * 4 + 3] = ang; aAnim[i * 4 + 1] = vis; };
  const P0 = new THREE.Vector3(), T0 = new THREE.Vector3();
  // the metres we have flown where the course first crosses a world z (a table of the course, 0.32 m apart)
  const NC = 2000, zC = new Float32Array(NC + 1);
  for (let i = 0; i <= NC; i++) { path.pointAt(i / NC, P0); zC[i] = P0.z; }
  const mAtZ = (zw) => { for (let i = 1; i <= NC; i++) if (zC[i] >= zw) return (i - 1 + (zw - zC[i - 1]) / Math.max(1e-6, zC[i] - zC[i - 1])) / NC * L; return L; };
  // the trail's line at a metre of the course: its point and its level direction
  const line = (m) => { path.pointAt(m / L, P0); path.tangentAt(m / L, T0); const tl = Math.hypot(T0.x, T0.z) || 1; return { x: P0.x, z: P0.z, tx: T0.x / tl, tz: T0.z / tl }; };
  await ctx.yield();

  // (IV a) three drongos on bent stems over the trail, from where its walls first stand full (world z 166) to the middle of the starboard bend
  // (world z 240): one in each third of those metres, on a dealt wall, feet 3.72 m from the trail's line (the least that keeps stem, plume, bird
  // and teal copies 2.0 m clear of the route at every swing: by their place, no guard), the cards across the trail, the bird looking in over it. The size is the largest of the live nine's (1.9 m) and no larger.
  const mWalls = mAtZ(166), mBend = mAtZ(240), third = (mBend - mWalls) / 3, rB = stream('trail-birds'), birds = [];
  for (let k = 0; k < 3; k++) {
    const m = mWalls + (k + rB()) * third, la = rB() < 0.5 ? -3.72 : 3.72, yF = 3.5 + 0.4 * rB(), lift = rB(), ph = rB() * 6, c = line(m);
    const d = { m, x: c.x + c.tz * la, z: c.z - c.tx * la, yF, ph, lift, size: 1.9, S: yF / 0.828, hd: Math.atan2(c.tx, c.tz) + 1.5708 * (la < 0 ? 1 : -1), bx: c.tx * 0.16, bz: c.tz * 0.16 };
    d.st = add(11, d.S, d.S, 4); d.s = add(11, d.S, d.S, 3); d.t = add(7, d.size, d.size, CAN.teal, 0, lift); d.i = add(7, d.size, d.size, CAN.black, 0, lift);
    birds.push(d);
  }

  // (IV b) dragonflies hanging over the mouth of the trail (world z 166 to 212), 0.5 to 1.4 m either side of its line, each at a dealt metre;
  // as the metres we have flown come within 9 m of a fly's own metre it darts to its wall (2.5 to 3 m from the line) and holds there
  const mMouth = mAtZ(212), rF = stream('mouth-flies'), nF = Math.round(12 * dens), flies = [];
  for (let i = 0; i < nF; i++) {
    const m = mWalls + (mMouth - mWalls) * rF(), sg = rF() < 0.5 ? -1 : 1, off = rF(), y = 0.8 + 1.9 * rF(), ph = rF() * 9, hj = (rF() - 0.5) * 0.8, sz = i < 3 ? 1.05 : 0.7, c = line(m);
    flies.push({ m, sg, lat: 0.5 + 0.9 * off, out: 2.5 + 0.5 * off, y, ph, sz, x: c.x, z: c.z, tx: c.tx, tz: c.tz, hd: Math.atan2(c.tx, c.tz) + sg * 1.5708 + hj, b: add(2, sz, sz, CAN.teal), w: add(3, sz, sz, CAN.white, 0, 1) });
  }
  await ctx.yield();

  // (V) five spotted deer at the water's edge either side of the ring, of the herd's own cards and layers (orange body, white islands, black
  // legs, eye and antler) and sizes: three to port and two to starboard, 12.5 to 22.5 m from the ring's axis, 3.5 to 9 m short of the water,
  // each in its own third (to port) or half (to starboard) of those ten metres, the cards along the water. They stand from build; each dips
  // nose-down and lifts again on the world's clock.
  const rD = stream('ring-company'), sideX = ringT.z, sideZ = -ringT.x, STAND = -0.72, deer = [];
  const waterZ = (x) => RIVER_Z0 + 5 * Math.sin(x * 0.021 + 2);
  for (let i = 0; i < 5; i++) {
    const lat = (12.5 + 10 * ((i < 3 ? i : i - 3) + rD()) / (i < 3 ? 3 : 2)) * (i < 3 ? 1 : -1), depth = 3.5 + 5.5 * rD(), size = 3.2 + 0.7 * rD(), fc = rD(), per = 5 + 3 * rD(), ph = rD();
    let t = 20, x = 0, z = 0;
    for (let k = 0; k < 6; k++) { x = ringC.x + ringT.x * t + sideX * lat; z = waterZ(x) - depth; t = (z - ringC.z - sideZ * lat) / ringT.z; }
    x = ringC.x + ringT.x * t + sideX * lat; z = ringC.z + ringT.z * t + sideZ * lat;
    const hd = Math.atan2(1, 0.105 * Math.cos(x * 0.021 + 2)) + (fc < 0.5 ? 0 : Math.PI) + ((fc * 2) % 1 - 0.5) * 0.5;
    let nx = Math.cos(hd), nz = -Math.sin(hd);
    if (nx * ringT.x + nz * ringT.z > 0) { nx = -nx; nz = -nz; }
    deer.push({ x, z, lat, beyond: t, depth, size, hd, nx, nz, per, ph, id: [add(4, size, size, 0, 0, STAND), add(4, size, size, 1, 0, STAND), add(4, size, size, 2, 0, STAND)] });
  }

  // (VI) six egrets standing on the swell to port of the course in the open sea (x 9 to 18 m, world z 34 to 70), as the entry's twelve stand:
  // feet on the plume line, a teal copy slid to starboard, two hinged wing cards. Each lifts by the live rule: its flight runs on how far we
  // have come past its own lifting place, a dealt 14 to 30 m short of where it stands; it goes out to port and on, never over the course.
  const rE = stream('sea-party'), party = [];
  for (let i = 0; i < 6; i++) {
    const x = 9 + 9 * rE(), z = 34 + 36 * rE(), size = 2.3 + 0.7 * rE(), dLift = 14 + 16 * rE(), rise = 3.5 + 4 * rE(), ph = rE() * 6.28, vx = 15, vz = 9 - 3 * (dLift - 14) / 16;
    party.push({ x, z, y: 5.0 + 0.47 * size, size, rise, ph, dLift, uL: (mAtZ(z) - dLift) / L, vx, vz, hdS: 1.5708 + (ph / 6.28 - 0.5) * 0.6, hdF: Math.atan2(vx, vz),
      sh: add(0, size, size, CAN.teal), b: add(0, size, size, CAN.white), w1: add(1, size * 0.8, size * 0.55, CAN.white, 1), w2: add(1, size * 0.8, size * 0.55, CAN.white, -1) });
  }
  await ctx.yield();
  const g = new THREE.InstancedBufferGeometry();
  g.index = cast.quad.index; g.setAttribute('position', cast.quad.getAttribute('position'));
  const attrs = [['aPos', aPos], ['aDef', aDef], ['aAnim', aAnim]].map(([name, arr]) => { const a = new THREE.InstancedBufferAttribute(arr, 4); a.setUsage(THREE.DynamicDrawUsage); g.setAttribute(name, a); return a; });
  g.instanceCount = n;
  const mesh = new THREE.Mesh(g, cast.mat); mesh.frustumCulled = false; mesh.renderOrder = 3;

  function update(time, u) {
    const flown = u * L;
    for (const dr of birds) {
      // bird and stem swing together with the swell about the stem's root, by the live drongos' own formula; the teal copies hang fixed,
      // 0.2 m to starboard and 0.13 m down, a hand further along the trail
      const sw = Math.sin(dr.x * SWK.x + dr.z * SWK.y - time * SWK.z + 0.4), a = 0.085 * sw + 0.02 * Math.sin(time * 2.3 + dr.ph), ca = Math.cos(a), sa = Math.sin(a);
      const S = dr.S, fx = Math.sin(dr.hd), fz = Math.cos(dr.hd), rx = -0.32 * S, ry = -0.5 * S, gx = 0.389 * S, gy = 0.828 * S;
      const Rx = dr.x - fx * gx, Rz = dr.z - fz * gx, Ry = dr.yF - gy;
      const cp = -(ca * rx - sa * ry), cy = -(sa * rx + ca * ry);
      put(dr.s, Rx + fx * cp, Ry + cy, Rz + fz * cp, dr.hd); aDef[dr.s * 4 + 3] = a;
      put(dr.st, Rx + fx * cp - 0.2 + dr.bx, Ry + cy - 0.13, Rz + fz * cp + dr.bz, dr.hd); aDef[dr.st * 4 + 3] = a;
      const fpx = ca * gx - sa * gy, fpy = sa * gx + ca * gy, b = 0.6 * a + 0.1 * dr.lift, cb = Math.cos(b), sb = Math.sin(b), ox = 0.1 * dr.size, oy = -0.165 * dr.size;
      const bp = fpx - (cb * ox - sb * oy), by = Ry + fpy - (sb * ox + cb * oy);
      put(dr.i, Rx + fx * bp, by, Rz + fz * bp, dr.hd); aDef[dr.i * 4 + 3] = b;
      put(dr.t, Rx + fx * bp - 0.2 + dr.bx, by - 0.13, Rz + fz * bp + dr.bz, dr.hd); aDef[dr.t * 4 + 3] = b;
    }
    for (const f of flies) {
      // darting and holding about its place on the world's clock (the live flies' rule); parted to its wall by where we are
      const t = time * 0.8 + f.ph, k = Math.floor(t), s = sstep(0, 0.28, t - k), kb = k * 3.1 + f.ph * 17, part = sstep(9, 6, f.m - flown);
      const lat = f.sg * (f.lat + (f.out - f.lat) * part + jit(kb, s) * 0.5 * (1 - part)), al = jit(kb + 2, s) * 2.4;
      const x = f.x + f.tz * lat + f.tx * al, z = f.z - f.tx * lat + f.tz * al, y = f.y + jit(kb + 1, s) * 0.7;
      const hd = f.hd + jit(kb + 3, s) * 0.6, tilt = 0.2 + 0.35 * jit(kb + 4, s);
      put(f.b, x, y, z, hd); aDef[f.b * 4 + 3] = tilt;
      put(f.w, x, y, z, hd); aDef[f.w * 4 + 3] = tilt; aDef[f.w * 4 + 1] = f.sz * (0.88 + 0.12 * Math.sin(time * 11 + f.ph));
    }
    for (const dd of deer) for (let p = 0; p < 3; p++) {
      // the card turns nose-down about its feet and lifts again, each pass a beat behind the one before (0.12 s white, 0.25 s black);
      // standing, the three lie in register, a hand apart in depth
      const c = (time - FLAG[p]) / dd.per + dd.ph, cyc = c - Math.floor(c), a = -0.3 * sstep(0, 0.14, cyc) * (1 - sstep(0.46, 0.62, cyc));
      const half = 0.475 * dd.size, fwd = -Math.sin(a) * half, i = dd.id[p];
      put(i, dd.x + Math.sin(dd.hd) * fwd + dd.nx * 0.14 * p, Math.cos(a) * half, dd.z + Math.cos(dd.hd) * fwd + dd.nz * 0.14 * p, dd.hd); aDef[i * 4 + 3] = a;
    }
    for (const e of party) {
      // standing on the swell; in the air by how far we have come past its lifting place (the live egrets' rule), wings beating on the clock;
      // the card turns from the way it stood to the heading of its flight as it lifts, and keeps that
      const ft = Math.max(0, u - e.uL) * 40, fly = sstep(0, 0.5, ft);
      const sw = Math.sin(e.x * SWK.x + e.z * SWK.y - time * SWK.z);
      const x = e.x + e.vx * ft + 0.3 * sw * (1 - fly), z = e.z + e.vz * ft, y = e.y + 0.3 * sw * (1 - fly) + e.rise * (1 - Math.exp(-ft * 0.55)) + 0.5 * Math.sin(ft * 1.1 + e.ph) * fly;
      const hd = e.hdS + (e.hdF - e.hdS) * fly;
      let flap = -1.25, flap2 = -1.25;
      if (fly > 0) { flap = 0.5 + 0.28 * (1 + Math.sin(time * 6.5 + e.ph)); flap2 = 0.24 + 0.2 * (1 + Math.sin(time * 6.5 + e.ph + 0.8)); }
      put(e.b, x, y, z, hd); aDef[e.b * 4 + 3] = fly * 0.25 * Math.exp(-ft * 0.4);
      put(e.sh, x - 0.2 * e.size, y - 0.12 * e.size, z + 0.3, hd); aDef[e.sh * 4 + 3] = aDef[e.b * 4 + 3]; aAnim[e.b * 4] = aAnim[e.sh * 4] = fly < 0.5 ? 1 : 0;
      const wy = y + 0.04 * e.size; setWing(e.w1, x, wy, z, hd, flap, 0.35 + 0.65 * fly); setWing(e.w2, x, wy, z, hd, flap2, 0.35 + 0.65 * fly);
    }
    for (const a of attrs) a.needsUpdate = true;
  }
  update(0, 0);
  return { mesh, update };
}

// tall clumps beside the path: four where the deer and peafowl go up (u 0.70 to 0.78), six along the last approach, 7 to 9 m off the course
const CLUMPS = [[18.9, 407.3, 2.0], [9.9, 411.7, 2.2], [28.5, 422.5, 2.0], [18.1, 428.3, 1.8], [64.8, 502.5, 2.2], [50.2, 505.5, 2.0], [57.4, 530, 2.0], [42.8, 526, 2.2], [51.6, 551.4, 1.8], [36.8, 547.6, 2.0], [36.5, 438.5, 2.0], [33, 457.5, 1.8]]
  .map((c) => new THREE.Vector3(c[0], c[1], c[2]));
const WIND = [-0.894, -0.447], MIST_S = 67;                              // downwind (to starboard and a little toward us), metres between mist bands
const TREE_IN = 0.184;                                                   // where the tree stencil by the course is finished (the gaze turns to it from u 0.195)
const STAGE = { x: -8.342, z: 331.73, h: 10 * D2R };                           // the hero's crossing point on the trail, and the trail's heading there

export default {
  id: 'stripes-in-the-grass',
  name: 'Stripes in the Grass',
  category: 'wilderness',
  weirdness: 0.15,
  media: ['air', 'open'],
  async build(ctx) {
    const rng = ctx.rng, vary = ctx.vary || {}, detail = ctx.quality?.detail ?? 1;
    const scene = new THREE.Scene();
    const style = P.makeStyle(P.PALETTE), cans = style.cans;
    style.uniforms.uWind.value.set(WIND[0], WIND[1], 3); style.uniforms.uMist.value.set(MIST_S, 60);   // bands lie slantwise across the course
    // ---- the seeded look: hour re-orders the fade, weather doubles the swells, the cast changes
    const pickHour = rng(), pickWind = rng(), pickCast = rng();
    let hour = vary.hour === 'dawn' ? 1 : vary.hour === 'night' ? 2 : (vary.hour === 'day' || vary.hour === 'golden') ? 0 : (pickHour < 0.46 ? 0 : pickHour < 0.74 ? 1 : 2);
    const deep = (c) => c.clone().multiply(new THREE.Color(0.93, 0.88, 0.80));
    const look = [
      { sky: [CAN.straw, CAN.orange, CAN.teal], spat: [CAN.white, CAN.orange], cloud: [CAN.white, CAN.straw, CAN.teal], bodyC: cans[CAN.straw], shadeC: cans[CAN.teal], plumeC: cans[CAN.white] },
      { sky: [CAN.teal, CAN.straw, CAN.white], spat: [CAN.straw, CAN.teal], cloud: [CAN.white, CAN.straw, CAN.teal], bodyC: cans[CAN.straw], shadeC: cans[CAN.teal], plumeC: cans[CAN.white] },
      { sky: [CAN.teal, CAN.black, CAN.black], spat: [CAN.white, CAN.white], cloud: [CAN.straw, CAN.teal, CAN.black], bodyC: cans[CAN.teal], shadeC: cans[CAN.black], plumeC: cans[CAN.straw] },
    ][hour];
    look.silC = deep(look.bodyC); look.swell = pickWind < 0.3 ? 2 : 1; look.rain = pickWind >= 0.3 && pickWind < 0.46;
    look.swk = new THREE.Vector3(-0.303, -0.175, 2.1).multiplyScalar(look.swell);   // 18 m apart (9 in wind), the crests lying 30 degrees off the course, rolling downwind and toward us at 6 m/s   // swells 32 m apart rolling at 6 m/s; in wind twice as close
    const rare = !!vary.rare, white = rare || pickCast < 0.14;

    // ---- the hero first: its stage decides where the trail runs
    const toW = (lx, lz) => [STAGE.x + Math.cos(STAGE.h) * lx + Math.sin(STAGE.h) * lz, STAGE.z - Math.sin(STAGE.h) * lx + Math.cos(STAGE.h) * lz];
    let hero = null, heroErr = '';
    if (typeof P.buildHero === 'function') {
      try { hero = await P.buildHero(ctx, { style, ground: false, detail, white, cubs: rare, wallYaw: 0.06, crossAngle: 52 * D2R, crossLead: 8.5, stride: 5.5, endAhead: true, hook: 30 * D2R, straight: 2, hookRadius: 4.0, runOn: 1.35, farWallX: 9.81, wallAhead: 22, wallBack: 46 }); } catch (e) { heroErr = String(e && e.message || e); hero = null; }
    }
    if (heroErr) console.error('stripes-in-the-grass: buildHero failed: ' + heroErr);
    await ctx.yield();
    const A = hero?.anchors || {};
    const fly = (A.flyThrough || [[0, 1.7, -52], [0, 1.7, -28], [0, 1.7, -8], [0, 1.7, 14], [0, 1.7, 34]]).filter((p) => p[2] > -57 && p[2] < 40);
    const pts = PATH_PTS.slice(0, 6).concat([[-2, 1.7, 232], [-9.5, 1.7, 252], [-15.5, 1.7, 266]]);
    if (fly[0][2] > -44) fly.unshift([0, 1.7, -52]);
    for (const p of fly) { const w = toW(p[0], p[2]); pts.push([w[0], p[1], w[1]]); }
    pts.push([7, 4.4, 394], [27, 7.4, 432], [47, 8.5, 466], [58.1, 8.5, 497.4], [49.05, 8.5, 531.2], [40, 8.5, 565]);
    const path = makePath(pts), L = path.length;
    await ctx.yield();
    const ringC = path.pointAt(1, new THREE.Vector3()), ringT = path.tangentAt(1, new THREE.Vector3()); ringT.y = 0; ringT.normalize();
    // the act is keyed to where the camera is on the trail (local z), so she lopes 9 m ahead and 8 m to port of the lens,
    // crosses 7.5 m ahead of it, and the cubs (progress past 1) cross ahead of it in their turn
    let stage = null, DUR = 8, Tmid = 5.5;
    if (hero) {
      hero.object.position.set(STAGE.x, 0, STAGE.z); hero.object.rotation.y = STAGE.h; scene.add(hero.object);
      const pw = A.portWall, fw = A.farWall, tr = A.track;
      if (pw && fw && tr) stage = { toW, pw, fw, tr };
      DUR = hero.duration || DUR; Tmid = ((hero.timing || {}).midSecondBound ?? 0.69) * DUR;
    }
    // (she stands whole against the return while the lens goes from 1.2 m short of the crossing line to 1.4 m past it: T 6.75 to 7.1)
    const CAMZ = [[0, -37], [1.5, -27.8], [2.3, -23.2], [3.9, -13.6], [4.6, -10.8], [Tmid, -7.0], [6.4, -3.0], [8, 5.64], [10.5, 16.5], [16, 33]];
    const camZ = (T) => { for (let i = 0; i < CAMZ.length - 1; i++) { const a = CAMZ[i], b = CAMZ[i + 1]; if (T <= b[0]) return a[1] + (b[1] - a[1]) * (T - a[0]) / (b[0] - a[0]); } return 33; };
    // u where the camera stands at local z on the trail (a fine table: nearestXZ is too coarse to drive an animal smoothly)
    const zTab = [], U0 = 0.45, U1 = 0.76, NZ = 640, pv = new THREE.Vector3(), ch = Math.cos(STAGE.h), sh = Math.sin(STAGE.h);
    for (let i = 0; i <= NZ; i++) { path.pointAt(U0 + (U1 - U0) * i / NZ, pv); zTab.push(sh * (pv.x - STAGE.x) + ch * (pv.z - STAGE.z)); if (i % 160 === 159) await ctx.yield(); }
    const uOfZ = (z) => { let lo = 0, hi = NZ; if (z <= zTab[0]) return U0; if (z >= zTab[NZ]) return U1;
      while (hi - lo > 1) { const m = (lo + hi) >> 1; if (zTab[m] <= z) lo = m; else hi = m; }
      return U0 + (U1 - U0) * (lo + (z - zTab[lo]) / Math.max(1e-6, zTab[hi] - zTab[lo])) / NZ; };
    const NT = 128, DT = 0.125, uT = []; for (let i = 0; i <= NT; i++) uT.push(uOfZ(camZ(i * DT)));
    await ctx.yield();
    const prog = (u) => { if (u <= uT[0]) return 0; if (u >= uT[NT]) return 2;
      let lo = 0, hi = NT; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (uT[m] <= u) lo = m; else hi = m; }
      return (lo + (u - uT[lo]) / Math.max(1e-6, uT[hi] - uT[lo])) * DT / DUR; };
    const uAt = (T) => { const x = Math.min(NT - 0.001, Math.max(0, T / DT)), i = Math.floor(x); return uT[i] + (uT[i + 1] - uT[i]) * (x - i); };
    const uMid = uAt(Tmid);
    // the long stalk: from the moment the lie opens (22 m ahead and 8 m to port of the lens) she is already walking the shadow wall, at 0.42 of
    // our own pace, one set of stripes going the wrong way; the act's clock is held at the walk until the lens is 31.5 m short of the crossing
    const zOfU = (u) => { const x = Math.min(NZ - 0.001, Math.max(0, (u - U0) / (U1 - U0) * NZ)), i = Math.floor(x); return zTab[i] + (zTab[i + 1] - zTab[i]) * (x - i); };
    const act = { pr: 0, lead: 0, show: 1 };
    const actAt = (u) => { const z = zOfU(u); act.pr = prog(u); act.lead = 0; act.show = 1;
      if (z < -31.5 && u < 0.6) { act.show = sstep(-67, -61, z); act.lead = 0.8 * (-31.5 - z); act.pr = act.show > 0 ? 0.9 / DUR : 0; }
      return act; };

    // ---- land, sky, grass
    await ctx.yield();
    const mask = buildMask(path, stage, rare);
    await ctx.yield();
    const sightU = { value: new THREE.Vector4(0, 0, 0, 0) }, geoU = { uMask: { value: mask.tex }, uMaskBox: { value: mask.box }, uSight: sightU };
    const groundMat = new THREE.ShaderMaterial({ uniforms: { ...style.uniforms, ...geoU, uBodyC: { value: look.bodyC }, uShadeC: { value: look.shadeC }, uPlumeC: { value: look.plumeC }, uRing: { value: new THREE.Vector2(ringC.x, RIVER_Z0) }, uShadow: { value: new THREE.Vector4(0, -999, 0, 1) } },
      vertexShader: GROUND_VERT, fragmentShader: STYLE_GLSL + GEO_GLSL + GROUND_FRAG });
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(7000, 7000), groundMat); ground.rotation.x = -Math.PI / 2; ground.position.set(0, 0, 400); ground.frustumCulled = false; ground.renderOrder = -5;
    const sky = buildSky(style, look);
    scene.add(ground, sky);
    await ctx.yield();
    const grass = await buildGrass(ctx, style, geoU, look, scene);
    await ctx.yield();
    const cast = await buildCast(ctx, style, look, path, ringC, ringT, rare);
    cast.mat.uniforms.uBodyC.value = look.bodyC; scene.add(cast.mesh);
    const company = await buildCompany(ctx, cast, look, path, ringC, ringT);
    scene.add(company.mesh);
    await ctx.yield();

    // ---- soft quads: drifting mist bands, the ring's halo and ghost square, tree ghosts; and the ring's drips
    const sq = new THREE.PlaneGeometry(1, 1), softs = [];
    const soft = (o, sx, sy, x, y, z, ry, ro = 8) => { const m = new THREE.Mesh(sq, P.sprayMaterial(style, o)); m.scale.set(sx, sy, 1); m.position.set(x, y, z); m.rotation.y = ry; m.renderOrder = ro; m.frustumCulled = false; scene.add(m); softs.push(m); return m; };
    const mist = [];                                                    // two bands in view ahead, four puffs along each, lying on the band line
    for (let i = 0; i < 8; i++) mist.push(soft({ can: i % 4 === 3 ? look.sky[0] : CAN.white, shape: 3, alpha: 0, seed: i * 3.3, near: 16 }, 62, 4.4, 0, 5.1, 100, Math.atan2(-WIND[0], -WIND[1]), 7));
    for (const m of mist) m.material.uniforms.uLane.value.set(6, 34);
    const rh = Math.atan2(-ringT.x, -ringT.z);
    soft({ can: CAN.orange, shape: 0, alpha: 0.16, seed: 2.2 }, 36, 36, ringC.x + ringT.x * 0.9, ringC.y, ringC.z + ringT.z * 0.9, rh, 1);
    // the ring's ghost square stands on the sand: overspray on all four sides, uneven, densest at one top corner; a white pass went through the
    // same card a hand out of place, so where the orange mist lies on orange sky the white one still shows
    soft({ can: CAN.white, shape: 1, alpha: 0.5, seed: 1.0, inner: [0.84, 0.8], floor: 0, soft: 0.03 }, 29, 24.6, ringC.x + ringT.x * 1.3 + ringT.z * 0.45, ringC.y + 2.95, ringC.z + ringT.z * 1.3 - ringT.x * 0.45, rh, 0.9).material.uniforms.uReach.value = 0.45;
    soft({ can: CAN.orange, shape: 1, alpha: 0.6, seed: 5.1, inner: [0.84, 0.8], floor: 0, soft: 0.03 }, 29, 24.6, ringC.x + ringT.x * 1.1, ringC.y + 2.6, ringC.z + ringT.z * 1.1, rh, 1).material.uniforms.uReach.value = 0.45;
    // tree ghosts: only ever seen together with their stencil (they thin to nothing as we come within 40 m)
    const treeGhosts = cast.trees.slice(0, 3).map(([x, z, H], k) => { const s = H / 0.93; return { x, z, m: soft({ can: CAN.teal, shape: 1, alpha: 0.36, seed: k + 1.5, inner: [0.8, 0.84], soft: 0.34 }, s * 1.25, s * 1.2, x, s * 0.5, z + 1.2, Math.PI, 1) }; });
    const side = new THREE.Vector3(ringT.z, 0, -ringT.x), drips = [];
    [[187, 9.38], [196, 9.38], [205, 9.38], [213, 9.38], [220.6, 9.3], [221.2, 8.4], [353, 9.38], [344, 9.38], [335, 9.38], [327, 9.38], [319.4, 9.3], [318.8, 8.4], [226.5, 7.75], [313.5, 7.75]].forEach(([deg, r]) => {
      const a = deg * D2R, cx = Math.cos(a) * r, cy = Math.sin(a) * r;     // the outer edge of the side arcs and the ends the lower bridges left
      drips.push({ at: [ringC.x + side.x * cx - ringT.x * 0.06, ringC.y + cy, ringC.z + side.z * cx - ringT.z * 0.06], tangent: [side.x, 0, side.z], length: Math.min(rng.range(1.2, 3.2), ringC.y + cy - 0.15), phase: rng.range(0.45, 0.85), speed: rng.range(0.9, 1.5) }); });
    // (and two where the can pooled on the inner edge of the ring's square card)
    for (const [cx, cy, len] of [[-12.2, 3.2, 2.6], [12.25, 1.4, 1.7]]) drips.push({ at: [ringC.x + side.x * cx + ringT.x * 1.1, ringC.y + cy, ringC.z + side.z * cx + ringT.z * 1.1], tangent: [side.x, 0, side.z], length: len, phase: 0.6, speed: 1.2 });
    const dripMesh = new THREE.Mesh(P.buildDripGeometry(drips), P.dripMaterial(style, { can: CAN.orange, run: look.rain ? 3 : 1, wide: 5 })); dripMesh.frustumCulled = false; dripMesh.renderOrder = 9; scene.add(dripMesh);
    await ctx.yield();

    // the ring's white and black passes arrive in two drifts of mist as we close
    const drift = [CAN.white, CAN.black].map((can, k) => soft({ can, shape: 3, alpha: 0, seed: 7.7 + k * 2.3 }, 24, 13, ringC.x, ringC.y + 1, ringC.z, rh, 2));
    // wind: ribbons of overspray dust, specks of all five cans, streaming to starboard across the lens (the hero's dust program, fed from update)
    let ribbon = null;
    if (look.swell > 1) { const NR = Math.round(1600 * detail), rp = new Float32Array(NR * 3), rs = new Float32Array(NR * 4), YR = [-1.4, 0.2, 1.3, 2.4];
      for (let i = 0; i < NR; i++) { const r = i % 4, t = hsh(i * 0.37 + 1), ph = t * 6.3 + r * 1.7, al = t * 36 - 18, cr = Math.sin(ph) * 0.5 + (hsh(i + 0.5) - 0.5) * 1.1;
        rp.set([WIND[0] * al - WIND[1] * cr, YR[r] + 0.5 * Math.sin(ph * 0.7 + r) + (hsh(i * 1.3 + 7) - 0.5) * 0.7, WIND[1] * al + WIND[0] * cr], i * 3);
        rs.set([hsh(i * 2.1 + 3), 0.9 + 2.6 * hsh(i * 3.3 + 2) * hsh(i * 3.3 + 2), r, hsh(i * 5.7 + 1)], i * 4); }
      const rg = new THREE.BufferGeometry(); rg.setAttribute('position', new THREE.BufferAttribute(rp, 3)); rg.setAttribute('aSeed', new THREE.BufferAttribute(rs, 4));
      ribbon = new THREE.Points(rg, P.dustMaterial(style)); ribbon.material.uniforms.uThread.value = 0; ribbon.frustumCulled = false; ribbon.renderOrder = 9; scene.add(ribbon); }
    await ctx.yield();
    const camP = new THREE.Vector3(), camD = new THREE.Vector3(), tv = new THREE.Vector3(), tq = new THREE.Vector3();
    const tigerPoi = (time, u) => { const a = actAt(u); let q = hero && hero.tigerAt ? hero.tigerAt(a.pr, tq, a.lead) : null; if (Array.isArray(q)) q = { x: q[0], y: q[1], z: q[2] };
      if (!q) q = { x: 11, y: 1.8, z: -20 + 30 * prog(u) }; const w = toW(q.x, q.z); tv.set(w[0], q.y ?? 1.8, w[1]);
      // when the card has landed on her the gaze is let go slowly: its mark slides from where she stood to the trail ahead over two seconds
      const k = sstep(0.6135, 0.636, u); if (k > 0) { path.pointAt(Math.min(1, u + 20 / L), tq); tv.lerp(tq, k); }
      return tv; };
    const herdV = new THREE.Vector3(), wallV = new THREE.Vector3(), herdW = new THREE.Vector3(), herdT = new THREE.Vector3();
    const wallPoi = (time, u) => { const x = Math.min(NZ - 0.001, Math.max(0, (u - U0) / (U1 - U0) * NZ)), i = Math.floor(x), zc = zTab[i] + (zTab[i + 1] - zTab[i]) * (x - i), w = toW(8.6, zc + 15); return wallV.set(w[0], 2.0, w[1]); };
    return {
      scene, path, duration: 46, ride: 'none', style: 'none', companion: 'none',
      pace: (u) => 1.25 - 0.89 * sstep(0.443, 0.535, u) + 1.04 * sstep(rare ? 0.642 : 0.623, 0.705, u) - 0.4 * sstep(0.817, 0.909, u),
      camera: { fov: 62, near: 0.3, far: 5000, lookAhead: 20, sway: 0.5, bank: 0.2, nearThrough: 0.3 },
      pois: [
        { at: [492, 12, 82], from: 0.04, to: 0.13, fade: 0.5, weight: 0.62 },     // a glance to port: the stencilled sun, its halo and its two drips
        { at: [cast.trees[2][0], 13, cast.trees[2][1]], from: 0.195, to: 0.3, fade: 0.3, weight: 0.4 },         // the tree stencil by the course
        { at: wallPoi, from: 0.492, to: 0.557, fade: 0.3, weight: 0.42 },            // the shadow wall across the lie, as the port side opens
        { at: tigerPoi, from: uAt(0.2), to: 0.642, fade: 0.12, weight: 0.62 },
        { at: tigerPoi, from: uAt(5.9), to: 0.642, fade: 0.2, weight: 0.36 },   // hold her in the middle of the frame while she stops against the wall and stands on as stripes
        { at: tigerPoi, from: uAt(6.0), to: 0.642, fade: 0.22, weight: 0.5 },    // (and again, so the steady camera, which follows at a third, keeps her stop inside the frame)
        { at: (time, u) => { path.pointAt(Math.min(0.99, u + 0.07), herdV); herdV.y = 3; return herdV; }, from: 0.657, to: 0.763, weight: 0.3 },
        { at: [ringC.x, ringC.y - 1.5, ringC.z], from: 0.726, to: 0.936, fade: 0.25, weight: 0.55 },
        // past the tape the herd wheels away to port along the water: the gaze goes with it for a moment, the ring to starboard of centre
        { at: (time, u) => { const s = Math.min(0.992, u + 0.03 + 0.05 * Math.max(0, u - 0.653)), wh = sstep(0.808, 0.954, u), lat = 6 * (1 + 5 * Math.max(0, u - 0.662)) + wh * wh * 82;
          path.pointAt(s, herdW); path.tangentAt(s, herdT); const tl = Math.hypot(herdT.x, herdT.z) || 1; return herdW.set(herdW.x + herdT.z / tl * lat, 2.2, herdW.z - herdT.x / tl * lat); }, from: 0.832, to: 0.912, fade: 0.3, weight: 0.5 },
      ],
      // the opening is one flat can: teal in the afternoon, black at dawn (the low sky is teal then), white at dusk
      portal: { shape: 'circle', radius: 7, color: '#FF5A14', glow: 0, halo: false, veil: P.PALETTE[[CAN.teal, CAN.black, CAN.white][hour]], revealDistance: 260 },
      post: { flat: 1, exposure: 1, bloom: { strength: 0 }, grade: { saturation: 1, contrast: 1, vignette: 0, grain: 0 } },
      update(dt, time, camera, u) {
        style.update(time, ctx.renderer);
        camera.getWorldPosition(camP); camera.getWorldDirection(camD);
        { const dl = Math.hypot(camD.x, camD.z) || 1, dx = camD.x / dl, dz = camD.z / dl;      // our own teal shadow, below the nose and slid to starboard
          groundMat.uniforms.uShadow.value.set(camP.x + dx * 19 - 5.2, camP.z + dz * 19, dx, dz); }
        if (hero) { const a = actAt(u); hero.setProgress(a.pr, a.lead, a.show); hero.update(dt, time, camera, u);
          const tw = tigerPoi(time, u); sightU.value.set(tw.x, tw.z, sstep(0.5, 0.512, u) * (1 - sstep(0.625, 0.64, u)), 0); }
        sky.material.uniforms.uDrip.value = (20 + time) * (look.rain ? 3 : 1);
        for (const g of treeGhosts) g.m.material.uniforms.uAlpha.value = 0.36 * sstep(26, 46, Math.hypot(g.x - camP.x, g.z - camP.z));
        cast.update(time, u, camP, camD);
        company.update(time, u);
        { const kw = sstep(0.812, 0.84, u) * (1 - sstep(0.865, 0.9, u)), kb = sstep(0.895, 0.92, u) * (1 - sstep(0.938, 0.962, u));   // each drift hangs before the ring as its pass lands, then slides off downwind
          drift[0].material.uniforms.uAlpha.value = 0.5 * kw; drift[0].position.x = ringC.x + ringT.x * 1.6 + 5 - 110 * (u - 0.812);
          drift[1].material.uniforms.uAlpha.value = 0.3 * kb; drift[1].position.x = ringC.x + ringT.x * 1.6 + 4 - 130 * (u - 0.895); }
        // over the sea the white drift is the puff that crosses the tree by the course as its last passes land: about a second, sliding downwind,
        // and nothing at all unless a pass is due just then; from the trail on it hangs before the ring as it was made
        if (u < 0.5) { const T = cast.trees[2], s = T[2] / 0.93, d0 = drift[0];
          d0.material.uniforms.uAlpha.value = 0.88 * sstep(0, 1, 1 - Math.abs(u - TREE_IN) / 0.014) * cast.arrival.due;
          d0.position.set(T[0] - 520 * (u - TREE_IN), s * 0.56, T[1] - 3); d0.rotation.y = Math.PI; d0.scale.set(s * 1.5, s * 1.1, 1); }
        else { const d0 = drift[0]; d0.position.y = ringC.y + 1; d0.position.z = ringC.z; d0.rotation.y = rh; d0.scale.set(24, 13, 1); }
        if (ribbon) { const dl = Math.hypot(camD.x, camD.z) || 1, U = ribbon.material.uniforms; ribbon.position.set(camP.x + camD.x / dl * 9.5, camP.y, camP.z + camD.z / dl * 9.5); U.uNow.value = time;
          const kR = ctx.through ? 0 : (1 - sstep(0.54, 0.57, u) * (1 - sstep(0.63, 0.66, u))) * (1 - sstep(0.86, 0.9, u));   // none across her act, none across the ring
          for (let r = 0; r < 4; r++) { const age = (time + r * 0.95) % 3.8; U.uTrail.value[r].set(WIND[0] * (9 * age - 14), WIND[1] * (9 * age - 14), time - age, kR); } }
        cast.mat.uniforms.uRingIn.value.set(-0.1 + 1.3 * sstep(0.817, 0.89, u), -0.1 + 1.3 * sstep(0.9, 0.959, u));
        // mist bands drift downwind at 3 m/s; the puffs sit where arrive() in the shaders says paint is still on its way
        const cw = camP.x * WIND[0] + camP.z * WIND[1], cp = camP.x * -WIND[1] + camP.z * WIND[0];
        const m0 = (((cw - 3 * time - MIST_S * 0.80) % MIST_S) + MIST_S) % MIST_S;
        for (let i = 0; i < 8; i++) {
          const bd = -m0 - (i >> 2) * MIST_S, j = (i & 3) - 1, q = (cp + 2 * bd) / 55, f = q - Math.floor(q), al = 55 * (Math.floor(q) + j), m = mist[i];
          m.position.x = camP.x + bd * WIND[0] - WIND[1] * (al - cp); m.position.z = camP.z + bd * WIND[1] + WIND[0] * (al - cp);
          const dC = Math.hypot(m.position.x - camP.x, m.position.z - camP.z);
          const rx = ringC.x - camP.x, rz = ringC.z - camP.z, rl = Math.hypot(rx, rz) || 1, over = Math.abs((m.position.x - camP.x) * rz - (m.position.z - camP.z) * rx) / rl;   // metres from our line to the ring
          m.material.uniforms.uAlpha.value = 0.86 * (j < 0 ? 1 - f : j > 1 ? f : 1) * sstep(300, 230, dC) * Math.max(sstep(0.05, 0.1, u), sstep(20, 46, over)) * (1 - sstep(0.3, 0.36, u));   // (over the open sea only: the walls of the trail are finished, and nothing white lies across the herd on the sand)
        }
      },
      dispose() { mask.tex.dispose(); sq.dispose(); grass.quad.dispose(); cast.quad.dispose(); if (ribbon) { ribbon.geometry.dispose(); ribbon.material.dispose(); } if (hero && hero.dispose) hero.dispose(); },
      _heroErr: heroErr,
    };
  },
};
