// THE COUNTRY WITH NO UP: the hero. A visitor from space, a perfect mirror ball 160 m across, comes down through the
// plane of a two-dimensional country: in the plane it is a blazing circle that grows and slides; from above it is a ball
// carrying the whole country bent round its flanks.
//   sphere      96 x 64. Its shader reflects the view ray: a ray that goes down meets the plane (y 0) analytically and
//               reads a top-down PICTURE OF THE PLANE (uMapTex: one 1024 target, 440 m either way, that the world's figures, houses and the
//               circle's glow are redrawn into each frame by renderMap); a ray that goes up takes space, the hoops as
//               analytic arcs and the one-point country as a star. Never black: a pearl-blue floor and a fresnel rim.
//               Everything below the plane is discarded in the shader, so the cut is exact (no depth fight at the glass).
//   circle      its glow on the glass (one additive quad, also drawn into the picture) and its hard edge (a ribbon)
//   rings       ribbons that face the eye's place, never thinner than 1.3 px: the great hoop the Sphere came from, the
//               afterglow hoops it leaves down its track, the circle's edge, slow rings closing on the portal inside the
//               hoop, and the wake's rings on the track (broad soft bands with a bright inner edge)
// Positions are pure functions of how far the ball has come down its track (setS). Alone in the part viewer (no opts) the ball rests half-way
// through at the origin over a stand-in picture of seeded lights.
import * as THREE from 'three';
import { COMMON, SKY, makeShared, HOOP, HOOP_R, SPHERE_R, REST, TRACK, TRACK_LEN, POINT, circleR, smooth } from './country-with-no-up-glsl.js';

const WAKE_LEN = TRACK_LEN - SPHERE_R;      // the track from the hoop's middle down to the ball's skin where it rests half-way through
const NR = 16;      // rings: 0 hoop, 1..4 afterglows on the Sphere's track, 5 the circle, 6..7 closing on the portal, 8..15 the rings the Sphere left down its track (as many as were dealt)

const SPHERE_VS = COMMON + /* glsl */`
varying vec3 vW, vN;
void main(){
  vN = position; vW = uSphere.xyz + position*uSphere.w;
  gl_Position = projectionMatrix*viewMatrix*vec4(vW.x, vW.y + uLift, vW.z, 1.);
}`;
const SPHERE_FS = COMMON + SKY + /* glsl */`
uniform sampler2D uMapTex, uMapTex2; uniform vec4 uMapRect, uMapRect2;      // centre x, z, half size, gain (2: the fine picture round the circle)
vec2 mapUv(vec2 hit, vec4 r){ return vec2((hit.x - r.x)/(2.*r.z) + 0.5, (r.y - hit.y)/(2.*r.z) + 0.5); }
uniform vec4 uRc[${NR}], uRn[${NR}], uRcol[${NR}];       // rings: centre + radius, normal + width, colour + strength
uniform vec4 uPoint;                                   // the one-point country: xyz, brightness
uniform float uBend;
varying vec3 vW, vN;
void main(){
  if (vW.y < 0.) discard;
  vec3 N = normalize(vN), V = normalize(vW - uEye), R = reflect(V, N);
  float ndv = clamp(-dot(V, N), 0., 1.), om = 1. - ndv, fres = om*om*om*om*om;
  // ---- upward: space, the hoops as arcs, the point as a star
  vec3 sky = skyCol(R)*1.6;
  for (int i = 0; i < ${NR}; i++) {
    if (i >= 5 && i < 8) continue;
    float dn = dot(R, uRn[i].xyz); dn = abs(dn) < 1e-3 ? 1e-3 : dn;
    float t = dot(uRc[i].xyz - vW, uRn[i].xyz)/dn;
    vec3 hp = vW + R*t - uRc[i].xyz;
    float e = abs(length(hp) - uRc[i].w), w = (i == 0 ? 1.7 : 1.2) + 0.005*max(t, 0.);
    sky += uRcol[i].rgb*uRcol[i].w*(i == 0 ? 1.5 : 0.8)*step(0., t)*(exp(-e*e/(w*w)) + 0.02*exp(-e/(6.*w)));
  }
  vec3 pd = uPoint.xyz - vW; pd /= max(length(pd), 1e-3);
  sky += vec3(0.93, 0.92, 0.98)*uPoint.w*(40.*exp(-(1. - dot(R, pd))*9000.) + 1.5*exp(-(1. - dot(R, pd))*500.));
  // ---- downward: the country, read from the picture of the plane
  // (once the ball is sunk in the plane only its upper half shows, and a true mirror there holds nothing but space:
  // the reflection is bent down the flanks, uBend, so the ball carries the country round it as it did coming down)
  float ny2 = N.y*N.y;
  vec3 Rg = normalize(vec3(R.x, R.y - uBend*(1. - ny2*ny2), R.z));
  float ry = min(Rg.y, -1e-3), t = min(vW.y/(-ry), 4000.);
  vec2 hit = vW.xz + Rg.xz*t;
  vec2 uv = mapUv(hit, uMapRect), uv2 = mapUv(hit, uMapRect2);
  vec2 e2 = abs(uv - 0.5), e3 = abs(uv2 - 0.5);
  float inMap = 1. - smoothstep(0.44, 0.5, max(e2.x, e2.y)), inFine = (1. - smoothstep(0.42, 0.49, max(e3.x, e3.y)))*uMapRect2.w;
  // (each picture is read at the level its own footprint on the ball asks for, a little sharper: near things stay crisp)
  vec3 wide = texture2D(uMapTex, clamp(uv, 0.002, 0.998), -0.6).rgb*inMap;
  vec3 fine = texture2D(uMapTex2, clamp(uv2, 0.002, 0.998), -0.6).rgb;
  vec3 ground = max(mix(wide, fine, inFine), 0.)*uMapRect.w;
  ground *= ground/(ground + 0.05);                       // a mirror of black glass: faint pools sink, edges stay
  // beyond the picture the country is its districts' gathered light; under everything the glass holds a little of it
  vec3 tg = townGlow(hit);
  ground += tg*(0.03 + 0.30*(1. - inMap));
  // the circle's own blaze, a hard belt at the waist
  float ce = max(length(hit - uCircle.xy) - uCircle.z, 0.);
  ground += uPal[4]*uCircle.w*0.4*exp(-ce/1.3);
  float flen = min(uFogP.z, vW.y)/(-ry);
  float T = exp(-uFogP.x*flen);
  ground = ground*T + fogLight(hit)*(1. - T);
  float g = smoothstep(0.03, -0.03, Rg.y);
  vec3 col = mix(sky, ground, g);
  // never black: a pearl-blue floor, brighter toward the limb
  vec3 sheen = vec3(0.50, 0.62, 0.95);
  col += sheen*(0.035 + 0.03*N.y*N.y*N.y + 0.26*om*om + 0.36*fres);       // graded: brighter toward the silhouette, so the cap reads round
  // the vermilion square beside the flank: the mirror shows it (a level square of 6.5 m, met by the true reflected ray)
  float ts = (uSq.y - vW.y)/(abs(R.y) < 1e-3 ? 1e-3 : R.y);
  vec2 sq = abs(vW.xz + R.xz*ts - uSq.xz); float sd = max(sq.x, sq.y) - 3.25;
  if (ts > 0. && sd < 0.) col = mix(col, uPal[6]*(sd > -0.9 ? 2.2 : 0.35) + uPal[7], uSq.w*0.85);
  vec4 fg = slabFog(vW);
  gl_FragColor = vec4(col*fg.a + fg.rgb, 1.);
}`;

// camera-facing ribbon round a circle in any plane
const RING_VS = COMMON + /* glsl */`
attribute vec2 aR;             // angle 0..1, side -1 / +1
attribute float aId;
uniform vec4 uRc[${NR}], uRn[${NR}], uRcol[${NR}];
varying vec3 vW; varying vec4 vCol; varying vec2 vS; varying float vIn;
void main(){
  int id = int(aId + 0.5);
  vec3 C = uRc[id].xyz, n = uRn[id].xyz; float rad = uRc[id].w;
  vec3 U = normalize(cross(n, abs(n.x) > 0.9 ? vec3(0., 0., 1.) : vec3(1., 0., 0.))), Wv = cross(n, U);
  float a = aR.x*6.2831853;
  vec3 radial = cos(a)*U + sin(a)*Wv, tang = -sin(a)*U + cos(a)*Wv;
  vec3 P = C + radial*rad;
  vec3 view = P - uEye; float dist = max(length(view), 0.1);
  vec3 side = cross(tang, view/dist); side /= max(length(side), 1e-3);
  float hw = max(uRn[id].w, 1.3*dist/uPx);
  P += side*aR.y*hw*3.0;                                 // the ribbon is three half-widths wide: a hard core in a soft edge
  // a thin far ring gives up light for its width. No ring's light depends on how far the eye is, but for the near
  // thinning of anything we could fly through: the lesser rings thin within 15 m of the eye's place
  float nearK = id == 5 || id == 0 ? 1. : smoothstep(3., 15., dist);
  // +1 on the ribbon's inner edge, -1 on its outer (side.radial is the same all round a ring: it is the eye's place
  // off the ring's plane; near that plane the two edges ease into one another)
  vIn = -clamp(dot(side, radial)*4., -1., 1.)*aR.y;
  vW = P; vCol = vec4(uRcol[id].rgb*uRcol[id].w*nearK*mix(1., uRn[id].w/hw, id == 0 || id == 5 ? 0.5 : 0.85), aId); vS = vec2(aR.y, aR.x);
  gl_Position = projectionMatrix*viewMatrix*vec4(P.x, P.y + uLift, P.z, 1.);
}`;
const RING_FS = COMMON + /* glsl */`
varying vec3 vW; varying vec4 vCol; varying vec2 vS; varying float vIn;
void main(){
  if (vW.y < 0.) discard;
  float s = min(abs(vS.x)*3.0, 3.), core = 1. - smoothstep(0.7, 1.15, s), soft = exp(-s*s*0.9)*0.2;
  float sh = 0.82 + 0.3*cN(vec2(vS.y*150. + vCol.a*17., uTime*1.3)) ;
  vec4 fg = slabFog(vW);
  vec3 col = vCol.rgb*(core + soft);
  if (vCol.a > 7.5) {
    // a ring the Sphere left on its track: a made thing of light, never a hairline. A broad soft band (the whole
    // ribbon, six half-widths across) that swells toward its inner edge, and a bright line along that edge; the
    // country's hues faint in the band
    float t = 0.5 + 0.5*clamp(vIn, -1., 1.), a = vS.y*6.2831853, k = cN(vec2(cos(a), sin(a))*1.6 + vCol.a*3.1 + uTime*0.02);
    float rise = smoothstep(0., 0.8, t), band = 0.30*rise*sqrt(rise)*(1. - smoothstep(0.86, 1., t)), edge = exp(-(t - 0.82)*(t - 0.82)/0.0032);
    float rim = 1. - smoothstep(0.7, 1., abs(vS.x));        // the ribbon's own two borders are always soft (seen from in its plane, too)
    vec3 hue = mix(mix(uPal[0], uPal[2], smoothstep(0.35, 0.5, k)), uPal[1], smoothstep(0.55, 0.7, k));
    col = (vCol.rgb*(band + 0.85*edge) + hue*length(vCol.rgb)*0.16*band)*rim;
    sh = 0.93 + 0.12*cN(vec2(vS.y*40. + vCol.a*17., uTime*0.6));      // a soft band shimmers slowly and broadly: no fringe
  }
  gl_FragColor = vec4(col*sh*fg.a, 0.);
}`;

// a film of light stretched in the great hoop: it shimmers, and slow ripples are drawn in toward the middle
const FILM_VS = COMMON + /* glsl */`
uniform vec4 uRc[${NR}], uRn[${NR}], uRcol[${NR}];
varying vec3 vW; varying vec2 vQ;
void main(){
  vec3 C = uRc[0].xyz, n = uRn[0].xyz;
  vec3 U = normalize(cross(n, abs(n.x) > 0.9 ? vec3(0., 0., 1.) : vec3(1., 0., 0.))), Wv = cross(n, U);
  vec3 P = C + (U*position.x + Wv*position.y)*uRc[0].w;
  vQ = position.xy; vW = P;
  gl_Position = projectionMatrix*viewMatrix*vec4(P.x, P.y + uLift, P.z, 1.);
}`;
const FILM_FS = COMMON + /* glsl */`
uniform vec4 uRcol[${NR}]; uniform float uFilm;
varying vec3 vW; varying vec2 vQ;
void main(){
  float r = length(vQ);
  float n1 = cN(vQ*2.6 + vec2(uTime*0.05, -uTime*0.04)), n2 = cN(vQ*6.7 - vec2(uTime*0.06, uTime*0.03));
  float rip = 0.5 + 0.5*sin(r*30. + 5.*n1 + uTime*0.8); rip *= rip;
  float edge = r*r*(1. - smoothstep(0.90, 0.995, r));
  float film = (0.018 + 0.045*rip*(0.35 + 0.65*n2))*edge + 0.05*exp(-r*r*22.);
  vec3 col = mix(uRcol[0].rgb, vec3(0.42, 0.58, 1.0), 0.45 + 0.3*n1)*film*uRcol[0].w;
  // in the film's place, always: a faint glow of the country's aqua and violet round the hoop's middle
  vec3 glow = mix(uPal[0], uPal[1], 0.35 + 0.5*n1)*(0.05*exp(-r*r*7.) + 0.012*exp(-r*r*1.6))*(0.75 + 0.25*n2);
  gl_FragColor = vec4((col*uFilm + glow)*(1. - smoothstep(0.99, 1.0, r))*smoothstep(3., 15., length(vW - uEye)), 0.);
}`;

// the circle's light on the glass: a blaze at its edge, a wide pool beyond it
const POOL_VS = COMMON + /* glsl */`
varying vec3 vW;
void main(){
  vec2 w = uCircle.xy + position.xy*(uCircle.z + 260.);
  vW = vec3(w.x, 0.55, w.y);
  gl_Position = projectionMatrix*viewMatrix*vec4(vW.x, vW.y + uLift, vW.z, 1.);
}`;
const POOL_FS = COMMON + /* glsl */`
varying vec3 vW;
void main(){
  float r = length(vW.xz - uCircle.xy), e = r - uCircle.z, ae = abs(e);
  float out1 = step(0., e);
  float sh = 0.85 + 0.3*cN(vec2(atan(vW.z - uCircle.y, vW.x - uCircle.x + 1e-4)*14., uTime*1.7));
  float glow = 1.5*exp(-ae/1.3)*sh + out1*(0.16*exp(-ae/4.) + 0.03*exp(-ae/22.) + 0.006*exp(-ae/90.));
  if (uMap > 0.5) glow = 0.45*exp(-ae/1.3)*sh + out1*0.03*exp(-ae/6.);
  glow *= 1. - smoothstep(170., 255., e);
  vec4 fg = slabFog(vW);
  gl_FragColor = vec4(uPal[4]*uCircle.w*glow*fg.a, 0.);
}`;

function standInMap(rng) {
  // seeded lights for the part viewer: specks of the four edge hues, thicker toward the middle
  const n = 256, d = new Uint8Array(n * n * 4), cols = [[73, 214, 198], [169, 139, 255], [242, 178, 78], [237, 235, 250]];
  for (let k = 0; k < 5200; k++) {
    const a = rng() * 6.2832, r = 0.48 * Math.pow(rng(), 0.7), x = Math.floor((0.5 + Math.cos(a) * r) * n), y = Math.floor((0.5 + Math.sin(a) * r) * n), c = cols[Math.floor(rng() * 4)], s = 0.5 + 0.5 * rng();
    for (let j = 0; j < 2; j++) for (let i = 0; i < 2; i++) { const p = (((y + j) % n) * n + ((x + i) % n)) * 4; d[p] = c[0] * s; d[p + 1] = c[1] * s; d[p + 2] = c[2] * s; d[p + 3] = 255; }
  }
  const t = new THREE.DataTexture(d, n, n, THREE.RGBAFormat, THREE.UnsignedByteType);
  t.minFilter = THREE.LinearMipmapLinearFilter; t.magFilter = THREE.LinearFilter; t.generateMipmaps = true; t.needsUpdate = true;
  return t;
}

const ADD = { transparent: true, depthWrite: false, depthTest: true, blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor, side: THREE.DoubleSide };

// opts: { shared (the world's uniforms), mapObjects (meshes to redraw into the picture of the plane), mapCenter [x, z], mapHalf,
//         sway (seeded phases; the first four are used here), standin (a stream for the stand-in picture, used only where there is no renderer) }
export async function buildHero(ctx, opts = {}) {
  const alone = !opts.shared, U = opts.shared || makeShared();
  // alone in the part viewer the hero draws for itself: its two streams, taken here before anything else
  const own = alone ? { standin: ctx.rng.fork('standin'), sway: ctx.rng.fork('sway') } : null;
  const off = alone ? new THREE.Vector3().sub(REST) : new THREE.Vector3();      // alone: the resting place is the origin
  const object = new THREE.Group();
  const v4 = (n) => Array.from({ length: n }, () => new THREE.Vector4());
  const mapC = opts.mapCenter || [REST.x + off.x, REST.z + off.z + (alone ? 0 : 40)], mapHalf = opts.mapHalf || (alone ? 420 : 440);
  const loc = {
    uMapTex: { value: null }, uMapRect: { value: new THREE.Vector4(mapC[0], mapC[1], mapHalf, alone ? 2.2 : 1.0) }, uMapTex2: { value: null }, uMapRect2: { value: new THREE.Vector4(0, 0, 100, 0) },
    uRc: { value: v4(NR) }, uRn: { value: v4(NR) }, uRcol: { value: v4(NR) }, uBend: { value: 0 }, uFilm: { value: 1 }, uPoint: { value: new THREE.Vector4(POINT.x + off.x, POINT.y + off.y, POINT.z + off.z, 1) },
  };
  const mat = (vs, fs, extra = {}) => new THREE.ShaderMaterial({ vertexShader: vs, fragmentShader: fs, uniforms: { ...U, ...loc }, ...extra });
  const put = (m, order) => { m.frustumCulled = false; m.renderOrder = order; m.matrixAutoUpdate = false; object.add(m); return m; };

  // the picture of the plane
  let rt = null, rt2 = null, mapScene = null, mapCam = null, mapCam2 = null;
  if (opts.mapObjects && ctx.renderer) {
    const ext = ctx.renderer.extensions, floatOK = ext && (ext.has('EXT_color_buffer_float') || ext.has('EXT_color_buffer_half_float'));
    const RTN = (ctx.quality?.detail ?? 1) >= 0.8 ? 1024 : 512;         // made once here; never resized
    const mk = () => { const t = new THREE.WebGLRenderTarget(RTN, RTN, { type: floatOK ? THREE.HalfFloatType : THREE.UnsignedByteType, depthBuffer: false, minFilter: THREE.LinearMipmapLinearFilter, magFilter: THREE.LinearFilter, generateMipmaps: true }); t.texture.anisotropy = 4; return t; };
    rt = mk(); rt2 = mk();                                              // the wide picture, and a fine one that keeps round the circle
    mapScene = new THREE.Scene(); mapScene.background = new THREE.Color(0, 0, 0); mapScene.matrixAutoUpdate = false;
    mapCam = new THREE.OrthographicCamera(-mapHalf, mapHalf, mapHalf, -mapHalf, 1, 400);
    mapCam.position.set(mapC[0], 200, mapC[1]); mapCam.up.set(0, 0, -1); mapCam.lookAt(mapC[0], 0, mapC[1]); mapCam.updateMatrixWorld(true);
    mapCam2 = new THREE.OrthographicCamera(-105, 105, 105, -105, 1, 400);
    mapCam2.position.set(mapC[0], 200, mapC[1]); mapCam2.up.set(0, 0, -1); mapCam2.lookAt(mapC[0], 0, mapC[1]); mapCam2.updateMatrixWorld(true);
    for (const m of opts.mapObjects) mapScene.add(m);
    loc.uMapTex.value = rt.texture; loc.uMapTex2.value = rt2.texture;
    try { const prev = ctx.renderer.getRenderTarget(); ctx.renderer.initRenderTarget(rt); ctx.renderer.initRenderTarget(rt2); ctx.renderer.setRenderTarget(prev); } catch (e) { /* made on first use instead */ }
  } else loc.uMapTex.value = loc.uMapTex2.value = standInMap(own ? own.standin : opts.standin);
  // where each shimmer and each slow ring stands in its own cycle (radians): the world hands over seeded ones, alone we draw them here
  // the wake's rings: a wake is not even. Gaps of 28 to 56 m dealt from a named stream of their own, from the hoop
  // down, as many as the track holds short of the resting ball's skin (and of the eight places there are)
  const wakeRng = ctx.core.makeRng(ctx.core.hashSeed('wake:' + ctx.seed)), ringAt = [];
  for (let sk = wakeRng.range(28, 56); sk < WAKE_LEN && ringAt.length < NR - 8; sk += wakeRng.range(28, 56)) ringAt.push(sk);
  const sway = opts.sway || [0, 1, 2, 3].map(() => own.sway.range(0, 6.2832));
  await ctx.yield();

  const sphere = put(new THREE.Mesh(new THREE.SphereGeometry(1, 96, 64), mat(SPHERE_VS, SPHERE_FS)), 0);
  await ctx.yield();
  const pool = put(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat(POOL_VS, POOL_FS, ADD)), 1.5);
  if (mapScene) { const p2 = new THREE.Mesh(pool.geometry, pool.material); p2.frustumCulled = false; p2.matrixAutoUpdate = false; mapScene.add(p2); }
  const SEG = 256, ar = new Float32Array((SEG + 1) * 4), rp = new Float32Array((SEG + 1) * 6), ri = [], ids = new Float32Array(NR);
  for (let i = 0; i <= SEG; i++) { ar[i * 4] = i / SEG; ar[i * 4 + 1] = -1; ar[i * 4 + 2] = i / SEG; ar[i * 4 + 3] = 1; }
  for (let i = 0; i < SEG; i++) ri.push(i * 2, i * 2 + 1, i * 2 + 2, i * 2 + 2, i * 2 + 1, i * 2 + 3);
  for (let i = 0; i < NR; i++) ids[i] = i;
  const rg = new THREE.InstancedBufferGeometry(); rg.setIndex(ri); rg.setAttribute('position', new THREE.BufferAttribute(rp, 3)); rg.setAttribute('aR', new THREE.BufferAttribute(ar, 2));
  rg.setAttribute('aId', new THREE.InstancedBufferAttribute(ids, 1)); rg.instanceCount = NR;
  const rings = put(new THREE.Mesh(rg, mat(RING_VS, RING_FS, ADD)), 5);
  const film = put(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat(FILM_VS, FILM_FS, ADD)), 4.5);
  await ctx.yield();

  const pearl = new THREE.Color('#EDEBFA'), gold = new THREE.Color('#FFE2A8'), wakeTint = new THREE.Color('#EDEBFA').lerp(new THREE.Color('#FFE2A8'), 0.45), c = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0), size = new THREE.Vector2();
  const setRing = (i, cx, cy, cz, rad, n, width, col, strength) => { loc.uRc.value[i].set(cx, cy, cz, rad); loc.uRn.value[i].set(n.x, n.y, n.z, width); loc.uRcol.value[i].set(col.r, col.g, col.b, strength); };
  // everything the Sphere does, from s, the metres it has come down its track (the world tells s from the journey;
  // the clock is only for what shimmers)
  function setS(s, time) {
    c.copy(HOOP).addScaledVector(TRACK, s).add(off);
    U.uSphere.value.set(c.x, c.y, c.z, SPHERE_R);
    const r = circleR(c.y), light = smooth(0, 16, r) * (0.9 + 0.1 * Math.sin(time * 2.1 + sway[0]));
    U.uCircle.value.set(c.x, c.z, r, light);
    loc.uBend.value = 1.1 * (1 - smooth(0, SPHERE_R, c.y));
    // the great hoop has one light for every eye, told by the ball: brightest while the ball is in it and as it
    // leaves (1.8), settling as the ball goes down its track (e-fold 120 m) to 0.95
    setRing(0, HOOP.x + off.x, HOOP.y + off.y, HOOP.z + off.z, HOOP_R, TRACK, 0.9, pearl, 0.95 + 0.85 * Math.exp(-Math.max(s, 0) / 120));
    for (let k = 1; k <= 4; k++) {
      // an afterglow hoop where the Sphere passed: it flares as the ball leaves it, then fades and slowly draws in
      const age = s - 60 * k, on = smooth(0, 30, age) * (1 - smooth(TRACK_LEN - 90, TRACK_LEN + 6, s));       // gone as the ball settles in the glass
      setRing(k, HOOP.x + off.x + TRACK.x * 60 * k, HOOP.y + off.y + TRACK.y * 60 * k, HOOP.z + off.z + TRACK.z * 60 * k, SPHERE_R - 2 - 15 * smooth(0, 420, age) - 2.5 * Math.sin(time * 0.23 + k + sway[1]), TRACK, 0.22, pearl, on * (0.2 + 0.7 * Math.exp(-Math.max(age, 0) / 60)));
    }
    setRing(5, c.x, 0.6, c.z, Math.max(r, 0.01), up, 0.7, gold, 4.0 * light);
    for (let k = 0; k < 2; k++) {
      const ph = (time / 12 + k * 0.5 + sway[2] / 6.2832) % 1, e = Math.sin(Math.PI * ph);
      setRing(6 + k, HOOP.x + off.x, HOOP.y + off.y, HOOP.z + off.z, HOOP_R + (22 - HOOP_R) * ph * ph * (3 - 2 * ph), TRACK, 0.2, pearl, 0.12 * e * e * smooth(40, 200, s));
    }
    // The rings the Sphere left where it passed: on its own track, at the uneven gaps the stream `wake` dealt
    // (ringAt: metres down the track from the hoop's middle), each standing square to the track, smaller the further
    // from the hoop (46 m less 9 m for every 100 m of track). Each lights once the ball's middle has gone by its
    // place (over the next 30 m of the ball's own way) and stays lit. All stand clear of the ball's skin where it rests.
    for (let k = 0; k < NR - 8; k++) {
      const sk = ringAt[k] || 0;
      // (a wake fades with age: the ring nearest the hoop is the oldest, so the faintest and thinnest; the one
      // nearest the plane the youngest and brightest: by each ring's place on the track, w = its share of the way down)
      const w = sk / WAKE_LEN;
      // (its band is 5 to 8 m across: a ribbon half-width of 0.8 to 1.4 m, six of them)
      if (k < ringAt.length) setRing(8 + k, HOOP.x + off.x + TRACK.x * sk, HOOP.y + off.y + TRACK.y * sk, HOOP.z + off.z + TRACK.z * sk, 46 - 0.09 * sk + 1.5 * Math.sin(time * 0.23 + k + sway[1]), TRACK, 0.8 + 0.6 * w, wakeTint, (0.16 + 0.42 * w) * smooth(0, 30, s - sk));
      else setRing(8 + k, 0, -500, 0, 1, up, 1, pearl, 0);
    }
    // the film in the hoop goes out with the Sphere: over the ball's first 160 m down its track (one diameter clear
    // of the hoop), and stays out
    loc.uFilm.value = 1 - smooth(0, 2 * SPHERE_R, s);
    loc.uPoint.value.w = 0.72 + 0.28 * Math.sin(time * 6.2832 / 7 + sway[3]);
  }
  // redraw the picture of the plane (the caller's camera and target are left as they were)
  function renderMap(renderer) {
    if (!rt) return;
    const prev = renderer.getRenderTarget(), ac = renderer.autoClear;
    U.uMap.value = 1; renderer.autoClear = true;
    renderer.setRenderTarget(rt); renderer.render(mapScene, mapCam);
    // the fine picture: the ground round the circle (or under the ball while it is still coming down)
    const cx = U.uCircle.value.x, cz = U.uCircle.value.y, h = Math.max(U.uCircle.value.z, 30) + 75;
    mapCam2.left = -h; mapCam2.right = h; mapCam2.top = h; mapCam2.bottom = -h; mapCam2.updateProjectionMatrix();
    mapCam2.position.set(cx, 200, cz); mapCam2.updateMatrixWorld(true);
    loc.uMapRect2.value.set(cx, cz, h, 1);
    renderer.setRenderTarget(rt2); renderer.render(mapScene, mapCam2); renderer.setRenderTarget(prev);
    renderer.autoClear = ac; U.uMap.value = 0;
  }
  setS(alone ? TRACK_LEN + 8 : 0, 0);
  return {
    object, radius: 100, height: 80, center: new THREE.Vector3(0, 30, 0), ground: true, groundY: 0,
    anchors: { portal: HOOP.clone().add(off), track: TRACK.clone(), rest: REST.clone().add(off) },
    sphere, rings, pool, uniforms: loc, shared: U, setS, renderMap, ringAt,
    update(dt, time, camera) {           // alone in the viewer: the ball rests half-way through
      if (!alone) return;
      U.uTime.value = time; U.uEye.value.setFromMatrixPosition(camera.matrixWorld);
      if (ctx.renderer) { ctx.renderer.getDrawingBufferSize(size); U.uPx.value = 0.5 * size.y * camera.projectionMatrix.elements[5]; }
      setS(TRACK_LEN + 8, time);
    },
    dispose() { if (rt) rt.dispose(); if (rt2) rt2.dispose(); },
  };
}
