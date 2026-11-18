// THE RED WEED, the land and the sky: the dome (rwSky + cirrus bars + the wood's smoke across it), the first stars,
// the FLOOD MAP (one texture that says where the mats lie, how thick, how sick) and the FLOOD SHEET, one mesh at
// y = 0 that is both the dark leads of water and the red mats on them.
//
//   makeDome(U, o)             the sky dome (1 call). Follows the camera it is given every frame.
//   makeStars(U, rng, o)       first stars + one steady reddish point (1 call)
//   makeFloodMap(ctx, L)       async: R = mat (0 open water .. 1 thick), G = sickness, B = hummock (the choked channel,
//                              growth round posts and walls); also returns sampleMat(x, z) / sampleSick(x, z) for placing things
//   makeSheet(U, map, L)       the sheet: mats heave and creep, leads mirror the sky, rings run out from the engine's
//                              feet (uRing), birds leave wakes (uWake), the engine and the bridge are mirrored
//                              analytically in the open water (uJ, uBlob, uArch)
import * as THREE from 'three';
import { RW_GLSL, withShared, clamp, lerp, sstep, DEG } from './the-red-weed-common.js';
import { RINGS_GLSL } from './the-red-weed-growth.js';

// ---------------------------------------------------------------- sky dome
const DOME_VS = /* glsl */`
varying vec3 vD;
void main(){ vD = position; vec4 p = projectionMatrix*viewMatrix*vec4(cameraPosition + position*uR, 1.0); if (abs(p.w) < 1e-4) p.w = 1e-4; gl_Position = p; }`;
const DOME_FS = /* glsl */`
${RW_GLSL}
uniform vec4 uBars[3];        // cirrus: azimuth (rad), elevation (rad), half length (rad), thickness (rad)
uniform vec4 uSmoke;          // the wood's smoke: azimuth where it rises, lean (rad of azimuth it crosses: negative leans it the other way), strength, fire glow
uniform float uRain;          // a far curtain of rain under the cloud (clearing storm)
varying vec3 vD;
void main(){
  vec3 d = normalize(vD);
  vec3 col = rwSky(d);
  float az = atan(d.x + 1e-6, -d.z), el = asin(clamp(d.y, -1.0, 1.0));
  // three long thin bars of cirrus low ahead: rose underneath, grey above
  for (int i = 0; i < 3; i++) {
    vec4 b = uBars[i];
    float da = az - b.x - uTime*0.0006*(1.0 + float(i)*0.4);
    float wob = 0.007*sin(da*2.6 + float(i)*2.1) + 0.012*(rwN(vec2(da*5.0 + float(i)*9.0, 0.5)) - 0.5);
    float de = (el - b.y - wob - da*0.03)/b.w;
    float taper = 1.0 - smoothstep(b.z*0.25, b.z, abs(da));
    float body = (1.0 - smoothstep(0.0, 1.0, abs(de)/max(0.25 + 0.75*taper, 0.05)))*taper;
    float n = rwN(vec2(da*17.0 + float(i)*7.0, de*0.9 + float(i)*3.0));
    float m = body*smoothstep(0.1, 0.75, n*0.7 + 0.3*rwN(vec2(da*70.0 + de*2.0, de*2.5)) + 0.3*body);
    vec3 cc = mix(uSkyRose*0.95 + uSkyAmber*0.2, mix(uSkyMid, uSkyLow, 0.5)*1.25, smoothstep(-0.5, 0.6, de));
    col = mix(col, cc, m*0.62);
  }
  // the smoke of the burning wood leans across the sky from where it rises
  float da = mod(az - uSmoke.x + 3.14159265, 6.2831853) - 3.14159265, lean = abs(uSmoke.y) < 0.05 ? 0.05 : uSmoke.y;
  float t = clamp(da/lean, -0.2, 1.3);
  float line = 0.012 + 0.24*t - 0.07*t*t, wid = 0.022 + 0.085*t;
  float q = (el - line)/wid;
  float sn = rwN(vec2(az*7.0 - uTime*0.004, el*16.0)) *0.6 + 0.4*rwN(vec2(az*19.0 - uTime*0.008, el*37.0 + 3.0));
  float qq = min(q*q, 30.0);
  float sm = exp(-qq*1.6)*smoothstep(-0.08, 0.06, t)*(1.0 - smoothstep(0.75, 1.25, t))*smoothstep(0.2, 0.7, sn + 0.35*exp(-qq))*uSmoke.z*step(0.0, d.y);
  vec3 sc = mix(vec3(0.045, 0.043, 0.055), vec3(0.42, 0.15, 0.045)*uSmoke.w, (1.0 - smoothstep(-1.0, 0.3, q))*(1.0 - smoothstep(0.0, 0.55, t)));
  col = mix(col, sc + 0.25*col, clamp(sm, 0.0, 0.85));
  // far rain: grey streaks hanging from the cloud's edge to the horizon, left of the glow
  float ra = (az - (atan(uGlow.x, -uGlow.z) - 0.75))/0.3;
  float rn = rwN(vec2(az*60.0 + el*14.0, el*3.0 - uTime*0.05));
  col = mix(col, uCloudCol*1.15, uRain*exp(-min(ra*ra, 30.0))*(1.0 - smoothstep(0.0, uCloud.y + 0.06, d.y))*step(0.0, d.y)*(0.45 + 0.4*rn));
  gl_FragColor = vec4(col, 1.0);
}`;
export function makeDome(U, o = {}) {
  const bars = (o.bars || [[-0.42, 0.135, 0.5, 0.012], [0.12, 0.185, 0.42, 0.011], [-0.08, 0.098, 0.3, 0.008]]).map((b) => new THREE.Vector4(...b));
  const u = withShared(U, { uR: { value: o.radius ?? 3000 }, uBars: { value: bars }, uSmoke: { value: new THREE.Vector4(...(o.smoke || [0.27, 1.25, 0.8, 1])) }, uRain: { value: o.rain ?? 0 } });
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(1, 40, 24), new THREE.ShaderMaterial({ uniforms: u, vertexShader: 'uniform float uR;' + DOME_VS, fragmentShader: DOME_FS, side: THREE.BackSide, depthWrite: false, depthTest: false, fog: false }));
  mesh.renderOrder = -1; mesh.frustumCulled = false;
  return { object: mesh, uniforms: u };
}

// ---------------------------------------------------------------- first stars
const STAR_VS = /* glsl */`
uniform float uTime, uPx, uR; attribute vec4 aS;      // direction xyz, seed
attribute vec2 aQ;                                     // size (pixels), steadiness
varying vec2 vUv; varying float vI, vP;
void main(){
  vec4 mv = viewMatrix*vec4(cameraPosition + aS.xyz*uR, 1.0);
  float px = uPx*uR*max(aQ.x, 1.2);
  mv.xy += position.xy*px;
  vUv = position.xy;
  vI = mix(0.55 + 0.45*sin(uTime*(1.7 + 2.3*aS.w) + aS.w*40.0)*sin(uTime*0.9 + aS.w*17.0), 1.0, min(aQ.y, 1.0)); vP = step(1.5, aQ.y);
  gl_Position = projectionMatrix*mv;
}`;
const STAR_FS = /* glsl */`
uniform vec3 uColA, uColB; varying vec2 vUv; varying float vI, vP;
void main(){ float r = dot(vUv, vUv); float a = (1.0 - smoothstep(0.1, 1.0, r)); gl_FragColor = vec4(mix(uColA, uColB, step(0.5, vP))*a*a*clamp(vI, 0.0, 1.0), 1.0); }`;
export function makeStars(U, rng, o = {}) {
  const n = o.count ?? 60, P = [], S = [], Q = [], I = [];
  const glow = o.glowAz ?? 0;
  const push = (dir, seed, size, steady) => { const b = P.length / 3; for (const c of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { P.push(c[0], c[1], 0); S.push(dir.x, dir.y, dir.z, seed); Q.push(size, steady); } I.push(b, b + 1, b + 2, b, b + 2, b + 3); };
  const d = new THREE.Vector3();
  for (let i = 0; i < n; i++) {
    // most of them high and behind: away from the afterglow, where the sky is darkest
    let el, az;
    for (let k = 0; k < 8; k++) { el = Math.asin(Math.pow(rng(), 0.7)); az = rng.range(-Math.PI, Math.PI); const toward = Math.cos(az - glow); if (el > (0.2 + 0.45 * Math.max(0, toward)) && rng() < 0.4 + 0.6 * (1 - 0.5 * (toward + 1)) + (el > 0.9 ? 0.4 : 0)) break; }
    d.set(Math.sin(az) * Math.cos(el), Math.sin(el), -Math.cos(az) * Math.cos(el));
    push(d, rng(), rng.range(1.3, 2.3) * (rng() < 0.12 ? 1.5 : 1), 0);
  }
  if (o.planet !== false) { const az = glow + (o.planetAz ?? 0.62), el = 18 * DEG; d.set(Math.sin(az) * Math.cos(el), Math.sin(el), -Math.cos(az) * Math.cos(el)); push(d, 0.5, 2.1, 2.0); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('aS', new THREE.Float32BufferAttribute(S, 4)); g.setAttribute('aQ', new THREE.Float32BufferAttribute(Q, 2)); g.setIndex(I);
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e6);
  const u = { uTime: U.uTime, uPx: U.uPx, uR: { value: o.radius ?? 2900 }, uColA: { value: new THREE.Color(0.8, 0.9, 1.15).multiplyScalar(o.gain ?? 1.0) }, uColB: { value: new THREE.Color(1.15, 0.42, 0.26) } };
  const mesh = new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms: u, vertexShader: STAR_VS, fragmentShader: STAR_FS, transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending, fog: false }));
  mesh.renderOrder = -0.9; mesh.frustumCulled = false;
  return { object: mesh, uniforms: u };
}

// ---------------------------------------------------------------- the flood map
// L: { box: [x0, z0, x1, z1], size: [w, h], channelX(z), leadX(z), sickAt(x, z) -> -1..1 bias, bumps: [[x, z, r, amount]], holes: [[x, z, r]] }
export async function makeFloodMap(ctx, L) {
  const [x0, z0, x1, z1] = L.box, [W, H] = L.size, n = ctx.noise, data = new Uint8Array(W * H * 4), mat = new Float32Array(W * H);
  const dx = (x1 - x0) / (W - 1), dz = (z1 - z0) / (H - 1);
  const o1 = L.rng.range(-500, 500), o2 = L.rng.range(-500, 500);      // L.rng: the flood's own seeded stream
  await ctx.yield();
  for (let j = 0; j < H; j++) {
    const z = z0 + j * dz, cx = L.channelX(z), lx = L.leadX(z), lw = L.leadW(z);
    for (let i = 0; i < W; i++) {
      const x = x0 + i * dx;
      const wx = x + 13 * n.n2(x / 57 + o1, z / 57), wz = z + 13 * n.n2(x / 57 + 40, z / 57 + o2);
      const base = n.n2(wx / 44 + o2, wz / 44) * 0.62 + n.n2(wx / 17, wz / 17 + o1) * 0.3;
      const r1 = Math.abs(n.n2(wx / 62 + 9 + o1, wz / 105 - 3)), r2 = Math.abs(n.n2(wx / 33 - 20, wz / 41 + 11 + o2));
      const lead = Math.max(1 - r1 / 0.1, 0.85 * (1 - r2 / 0.075), 0);                       // winding leads: the zero lines of two smooth fields
      const ch = Math.exp(-Math.pow((x - cx) / 11, 2));                                      // the old channel: choked to hummocks
      const fl = lw > 0 ? Math.max(0, 1 - Math.abs(x - lx + 3.2 * n.n2(x / 9, z / 9)) / lw) : 0;   // the lead the flight follows (a chain of pools)
      let m = 0.66 + 0.42 * base - 0.62 * Math.min(1, lead * 1.5) + 0.3 * ch - 1.25 * sstep(0.0, 0.75, fl);
      mat[j * W + i] = m;
      const hum = clamp(0.95 * ch * (0.55 + 0.45 * n.n2(x / 7.5, z / 7.5 + 50)) + 0.22 * Math.max(0, base), 0, 1);
      const sick = clamp(0.5 + 0.5 * (L.sickAt(x, z) + 0.75 * n.n2(x / 48 + 70, z / 48 - 30) + 0.3 * n.n2(x / 13, z / 13 + 90)), 0, 1);
      const o = (j * W + i) * 4; data[o + 1] = Math.round(sick * 255); data[o + 2] = Math.round(hum * 255); data[o + 3] = 255;
    }
    if (j % 24 === 23) await ctx.yield();
  }
  // growth is thickest round every post, trunk and wall; holes are kept open (the weir pool, the skiff's reach)
  const splat = (list, sign) => { for (const b of list) { const r = b[2], i0 = Math.max(0, Math.floor((b[0] - r - x0) / dx)), i1 = Math.min(W - 1, Math.ceil((b[0] + r - x0) / dx)), j0 = Math.max(0, Math.floor((b[1] - r - z0) / dz)), j1 = Math.min(H - 1, Math.ceil((b[1] + r - z0) / dz));
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) { const d = Math.hypot(x0 + i * dx - b[0], z0 + j * dz - b[1]) / r; if (d < 1) { const k = (1 - d * d) * (b[3] ?? 0.6); mat[j * W + i] += sign * k; if (sign > 0) data[(j * W + i) * 4 + 2] = Math.min(255, data[(j * W + i) * 4 + 2] + Math.round(170 * k)); } } } };
  splat(L.bumps || [], 1); await ctx.yield(); splat(L.holes || [], -1);
  for (let k = 0; k < W * H; k++) data[k * 4] = Math.round(clamp(mat[k], 0, 1) * 255);
  await ctx.yield();
  const tex = new THREE.DataTexture(data, W, H, THREE.RGBAFormat); tex.magFilter = THREE.LinearFilter; tex.minFilter = THREE.LinearFilter; tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping; tex.needsUpdate = true;
  const samp = (x, z, c) => {
    const fx = clamp((x - x0) / dx, 0, W - 1.001), fz = clamp((z - z0) / dz, 0, H - 1.001), i = Math.floor(fx), j = Math.floor(fz), a = fx - i, b = fz - j, o = (j * W + i) * 4 + c;
    return (lerp(lerp(data[o], data[o + 4], a), lerp(data[o + W * 4], data[o + W * 4 + 4], a), b)) / 255;
  };
  return { texture: tex, box: new THREE.Vector4(x0, z0, 1 / (x1 - x0), 1 / (z1 - z0)), sampleMat: (x, z) => samp(x, z, 0), sampleSick: (x, z) => samp(x, z, 1), sampleHum: (x, z) => samp(x, z, 2) };
}

// ---------------------------------------------------------------- the flood sheet
const SHEET_VS = /* glsl */`
${RW_GLSL}
${RINGS_GLSL}
uniform sampler2D tMap; uniform vec4 uMapBox;
varying vec3 vW; varying vec3 vRing; varying float vHum;
void main(){
  vec3 wp = position;
  vec4 mp = textureLod(tMap, (wp.xz - uMapBox.xy)*uMapBox.zw, 0.0);
  float mat = smoothstep(0.44, 0.62, mp.r);
  // rings from the engine's footfalls: they run out over the swamp and lift the mats as they pass
  vec3 rr = rwRings(wp.xz); float rh = rr.x; vec2 rg = rr.yz;
  float heave = 0.07*sin(uTime*0.55 + wp.x*0.19 + wp.z*0.13) + 0.04*sin(uTime*0.83 - wp.x*0.31 + wp.z*0.27);
  wp.y = mat*(0.16 + 0.85*mp.b + 0.2*mp.r + heave) + rh*(0.45 + 0.55*mat);
  vW = wp; vRing = vec3(rg, abs(rh)); vHum = mp.b;
  gl_Position = projectionMatrix*viewMatrix*vec4(wp, 1.0);
}`;
const SHEET_FS = /* glsl */`
${RW_GLSL}
uniform sampler2D tMap; uniform vec4 uMapBox;
uniform vec3 uJ[12];          // the striding engine: hip, knuckle, knuckle, ankle of each leg
uniform vec4 uBlob[3];        // its body, hood and basket as spheres (xyz, radius; radius 0 = none)
uniform vec4 uArch[5];        // the bridge: centre x, half span, springing y, rise (0 = no arch)
uniform vec4 uBridge;         // z, parapet top y, half length, on
uniform vec4 uWake[8];        // swimming birds: x, z, heading x, heading z
uniform vec4 uWeir;           // x0, x1, z, on
uniform vec3 uDeep;
varying vec3 vW; varying vec3 vRing; varying float vHum;
float capDist(vec3 ro, vec3 rd, vec3 a, vec3 b){
  vec3 ba = b - a, oa = ro - a; float baba = dot(ba, ba), bard = dot(ba, rd), baoa = dot(ba, oa), rdoa = dot(rd, oa);
  float s = clamp((baoa - rdoa*bard)/max(baba - bard*bard, 1e-3), 0.0, 1.0), t = max(bard*s - rdoa, 0.0);
  return length(oa + rd*t - ba*s);
}
float matBump(vec2 p){ float a = rwN(p*0.55), b = rwN(p*1.45 + 11.0), c = rwN(p*3.9 + 23.0); return 0.5*a + 0.33*b*b*1.6 + 0.17*c; }
void main(){
  vec2 P = vW.xz;
  vec3 vv = cameraPosition - vW; float dist = length(vv); vec3 v = vv/max(dist, 1e-3);
  vec2 fw = fwidth(P); float fp = max(max(fw.x, fw.y), 0.02);             // metres one pixel covers on the water
  vec4 mp = texture2D(tMap, (P - uMapBox.xy)*uMapBox.zw);
  float nearK = 1.0 - smoothstep(0.25, 1.6, fp), midK = 1.0 - smoothstep(1.0, 7.0, fp);
  float sick = smoothstep(0.5, 0.62, mp.g + (rwN(P*0.21 + 40.0) - 0.5)*0.28*midK);
  // the mat's edge: lobed, and creeping out over the lead and back in slow pulses
  float lobes = (rwN(P*0.42) - 0.5)*0.2*midK + (rwN(P*1.5 + 7.0) - 0.5)*0.11*nearK;
  float creep = 0.04*sin(uTime*0.42 + rwN(P*0.06)*14.0)*midK;
  // the dying mats rot through: water and mud show in holes (metres across) and along a drowned, frayed edge
  float rotK = smoothstep(0.42, 0.78, rwN(P*0.19 + 61.0))*0.6 + 0.4*rwN(P*0.9 + 3.0);
  float mv = mp.r + lobes + creep - sick*(0.1*rwN(P*0.9 + 3.0) + 0.17*rotK)*midK;
  float ew = (0.02 + min(0.22, fp*0.06))*(1.0 + 1.2*sick);
  float mat = smoothstep(0.5 - ew, 0.5 + ew, mv);
  // ---- the weed: lobed pads lying over one another, bladders among them, lit from the afterglow; each pad has its
  // own red, and the sickness takes them pad by pad
  float padK = 1.0 - smoothstep(0.22, 0.9, fp), padK2 = 1.0 - smoothstep(0.09, 0.4, fp), blK = 1.0 - smoothstep(0.04, 0.16, fp);
  vec2 wob = (vec2(rwN(P*0.33), rwN(P*0.33 + 19.0)) - 0.5)*0.9 + (vec2(rwN(P*2.1 + 5.0), rwN(P*2.1 + 47.0)) - 0.5)*0.26*padK;   // lobed outlines, never straight
  vec4 pd = rwPad(P*0.5 + wob), pe = rwPad(P*1.45 + wob*2.0 + 31.0);                     // great fronds, and smaller pads lying on them
  float padH = smoothstep(0.02, 0.4, pd.z), padE = smoothstep(0.03, 0.38, pe.z);
  vec2 pdir = pd.xy/max(length(pd.xy), 1e-3), edir = pe.xy/max(length(pe.xy), 1e-3);
  vec4 bl = rwPad(P*4.1 + 17.0);
  float blOn = step(0.66, bl.w)*blK, blH = smoothstep(0.03, 0.3, bl.z)*blOn;
  vec2 bdir = bl.xy/max(length(bl.xy), 1e-3);
  float e = 0.3 + fp*0.5;
  float h0 = matBump(P), hx = matBump(P + vec2(e, 0.0)), hz = matBump(P + vec2(0.0, e));
  float rel = (1.5 + 2.0*vHum)*nearK + 0.7*midK;
  vec2 gr = vec2(hx - h0, hz - h0)/e*rel + pdir*(1.0 - padH)*0.9*padK + edir*(1.0 - padE)*1.1*padK2 + bdir*(1.0 - blH)*blOn*1.2;
  vec3 nb = normalize(vec3(-gr.x - vRing.x, 1.0, -gr.y - vRing.y));
  float own = mix(pd.w, pe.w, 0.6*padK2);
  // the dying is a band of metres, pad by pad: living red, then rust, then bleached (never a cut edge)
  float sv = mp.g + (rwN(P*0.21 + 40.0) - 0.5)*0.28*midK + (own - 0.5)*0.34*padK;
  float sickP = smoothstep(0.5, 0.8, sv), rustP = smoothstep(0.38, 0.54, sv)*(1.0 - smoothstep(0.6, 0.84, sv));
  float edge = 1.0 - smoothstep(0.0, 0.2, mv - 0.5);
  float thin = clamp(0.04 + 0.3*edge + 0.16*(1.0 - padE)*padK2 + 0.25*blH, 0.0, 1.0);
  float ao = mix(0.8, 0.42 + 0.78*h0, nearK*0.85)*mix(1.0, 0.7 + 0.3*padH, padK)*mix(1.0, 0.66 + 0.34*padE, padK2)*(0.8 + 0.2*mat)*(1.0 + 0.25*vHum);
  float aged = 0.56 + 0.6*rwN(P*0.075 + 9.0) + 0.3*(rwN(P*0.019 + 3.0) - 0.5);          // the growth is older and darker in places, and in great patches
  vec3 weed = rwWeed(nb, v, thin, sickP, ao)*mix(1.0, 0.76 + 0.48*own, padK*(1.0 - 0.6*sickP))*mix(aged, 1.0, 0.2*sickP);
  // rust: the red goes brown and dull before it goes pale
  weed = mix(weed, weed*vec3(0.84, 0.6, 0.46) + 0.05*uWeedS*vec3(1.0, 0.58, 0.34), rustP*0.85);
  // the bleached growth is a litter of brittle fronds, fallen every way over grey-brown rot: each pad's stalks lie
  // along its own heading, a second fall lies across them, and the rot shows between; it is never the brightest
  // thing on the ground
  float fine = 1.0 - smoothstep(0.05, 0.3, fp);
  // (the heading is the great pad's own fixed number: nothing of the pixel's footprint turns it)
  float lAng = pd.w*6.2832; vec2 lDir = vec2(cos(lAng), sin(lAng)), lDir2 = vec2(0.36, 0.93);
  float lS1 = rwN(vec2(dot(P, lDir)*6.5, dot(P, vec2(-lDir.y, lDir.x))*0.5) + 13.0), lS2 = rwN(vec2(dot(P, lDir2)*4.6, dot(P, vec2(-lDir2.y, lDir2.x))*0.42) + 71.0);
  // windrows of fallen fronds (seen from far), single stalks (seen from near)
  float lC1 = rwN(vec2(dot(P, lDir)*1.7, dot(P, vec2(-lDir.y, lDir.x))*0.2) + 43.0), lC2 = rwN(vec2(dot(P, lDir2)*1.3, dot(P, vec2(-lDir2.y, lDir2.x))*0.16) + 97.0);
  float rows = mix(0.6, smoothstep(0.3, 0.7, max(lC1, 0.92*lC2)), 1.0 - smoothstep(0.25, 1.5, fp));
  float stalks = rows*mix(1.0, 0.5 + 0.62*smoothstep(0.3, 0.72, max(lS1, 0.92*lS2)), fine);
  float lDrift = mix(0.6, smoothstep(0.2, 0.8, rwN(P*0.55 + 27.0)), midK)*(0.62 + 0.5*rwN(P*0.06 + 5.0));
  float cover = clamp(stalks*(0.45 + 0.75*lDrift)*(0.6 + 0.4*padH), 0.0, 1.0);
  vec3 litter = mix(vec3(0.33, 0.26, 0.21), vec3(0.9, 0.85, 0.77), cover);
  weed *= mix(vec3(1.0), litter, sickP);
  // far off the fronds stand in each other's light: toward the glow the swamp carries a little of it
  float toward = clamp(dot(-v, uKeyDir), 0.0, 1.0);
  // the evening lights the swamp from low ahead and there is no sun: looked down on, or seen away from the glow,
  // a mat is a deep wine; it is carmine where the eye skims it toward the afterglow
  weed *= mix(1.0, mix(0.6, 0.74, sickP), smoothstep(0.06, 0.42, clamp(v.y, 0.0, 1.0)))*mix(mix(0.66, 0.8, sickP), 1.0, toward*toward);
  weed = mix(weed, mix(uWeedG, uWeedSG, sickP), 0.07*toward*toward*(1.0 - padK*0.7));
  // wet: a thin sheen of the sky lies on the pads, and the bladders carry a point of it
  vec3 rw = reflect(-v, nb); rw.y = abs(rw.y) + 0.02; rw = normalize(rw);
  float wv = 1.0 - clamp(dot(nb, v), 0.0, 1.0);
  weed += rwSky(rw)*(0.02 + 0.075*wv*wv*wv + 0.25*blH*blH)*(0.5 + 0.5*ao);
  // ---- the water in the leads: still floodwater, a mirror. The far end of every lead is the afterglow, the near
  // end the slate of the high sky; the growth along its far shore stands in it upside down; so do the engine and
  // the bridge. Only where a breath of air touches it (cat's-paws, drifting) is it roughened; fish rings open and
  // widen near us; the engine's footfalls send their rings through it.
  float cats = smoothstep(0.56, 0.8, rwN(P*0.045 + vec2(uTime*0.012, 0.0)))*midK;
  vec2 rp = P*3.1 + vec2(0.35, 0.9)*uTime;
  vec2 sl = (vec2(rwN(rp), rwN(rp + 31.0)) - 0.5)*(0.014 + 0.085*cats)*nearK + (vec2(rwN(P*0.6 + vec2(0.05, 0.12)*uTime), rwN(P*0.6 + 17.0 - vec2(0.04, 0.1)*uTime)) - 0.5)*0.012;
  sl += vRing.xy*1.4;
  // fish rings: now and then a ring opens in a lead and widens
  vec2 cell = floor(P/11.0), cp = (cell + 0.25 + 0.5*vec2(rwH(cell), rwH(cell + 5.3)))*11.0;
  float ft = fract(uTime/5.5 + rwH(cell + 9.1)), fd = length(P - cp) + 1e-3, fr = ft*5.0, fq = min((fd - fr)*(fd - fr)*1.6, 30.0);
  sl += (P - cp)/fd*sin((fd - fr)*5.0)*exp(-fq)*(1.0 - ft)*0.34*step(0.55, rwH(cell + 2.2))*nearK;
  // bird wakes: a V behind each swimmer
  for (int i = 0; i < 8; i++) {
    vec4 wk = uWake[i]; vec2 q = P - wk.xy; float al = -dot(q, wk.zw), la = wk.z*q.y - wk.w*q.x;
    float arm = abs(la) - 0.34*al;
    sl += vec2(-wk.w, wk.z)*sign(la)*exp(-min(arm*arm*9.0, 30.0))*step(0.0, al)*(1.0 - smoothstep(4.0, 16.0, al))*0.22*sin(arm*9.0 + 1.5)*nearK;
  }
  vec3 nw = normalize(vec3(-sl.x, 1.0, -sl.y));
  vec3 r = reflect(-v, nw); r.y = abs(r.y) + 0.004; r = normalize(r);
  vec3 sky = rwSky(r);
  // the far shore in the water: follow the mirrored ray out over the lead and ask the map what stands there and
  // how high (the mat's own lift and the plants on it); near us the reflection is sharp, far off the leads keep the sky
  float rl = max(length(r.xz), 1e-3), climb = r.y/rl, refl = 0.0, reflSick = 0.0; vec2 rdir = r.xz/rl;
  for (int i = 0; i < 4; i++) {
    float fi = float(i), dq = 1.2 + fi*fi*1.15 + fi*0.25;
    vec2 Qp = P + rdir*dq; vec4 mq = textureLod(tMap, (Qp - uMapBox.xy)*uMapBox.zw, 0.0);
    float tall = (0.3 + 1.1*mq.b + 1.5*rwN(Qp*0.45 + 5.0)*smoothstep(0.6, 0.9, mq.r))*smoothstep(0.47, 0.58, mq.r);
    float hit = smoothstep(0.0, 0.2, tall - climb*dq)*(1.0 - refl);
    reflSick += mq.g*hit; refl += hit;
  }
  refl *= 1.0 - smoothstep(40.0, 120.0, dist);
  sky = mix(sky, mix(uWeedD, uWeedSD, smoothstep(0.5, 0.62, reflSick/max(refl, 1e-3)))*0.85 + 0.12*sky, clamp(refl, 0.0, 1.0));
  // the striding engine and the bridge stand in the leads as dark shapes, broken by the ripples
  float shade = 0.0;
  vec3 ro = vec3(vW.x, 0.0, vW.z);
  vec3 bc = uBlob[0].xyz - ro;
  if (uBlob[0].w > 0.0 && dot(bc.xz, bc.xz) < 250.0*250.0) {
    float soft = 0.25 + 0.012*length(bc.xz);
    for (int j = 0; j < 3; j++) {
      vec3 a = uJ[j*4], b = uJ[j*4 + 1], c = uJ[j*4 + 2], d = uJ[j*4 + 3];
      shade = max(shade, 1.0 - smoothstep(0.75, 0.75 + soft, capDist(ro, r, a, b)));
      shade = max(shade, 1.0 - smoothstep(0.65, 0.65 + soft, capDist(ro, r, b, c)));
      shade = max(shade, 1.0 - smoothstep(0.5, 0.5 + soft, capDist(ro, r, c, d)));
      vec3 oc = ro - uBlob[j].xyz; float tb = max(-dot(oc, r), 0.0);
      shade = max(shade, (1.0 - smoothstep(uBlob[j].w, uBlob[j].w + soft, length(oc + r*tb)))*step(0.01, uBlob[j].w));
    }
  }
  float tz = (uBridge.x - vW.z)/min(r.z, -1e-3);
  if (uBridge.w > 0.5 && r.z < -0.01 && tz > 0.0 && tz < 400.0) {
    vec2 hp = ro.xy + r.xy*tz; float solid = step(hp.y, uBridge.y)*step(abs(hp.x), uBridge.z);
    for (int k = 0; k < 5; k++) { vec4 ar = uArch[k]; float dxk = (hp.x - ar.x)/max(ar.y, 0.1); float top = ar.z + ar.w*sqrt(max(1.0 - dxk*dxk, 0.0)); solid *= 1.0 - step(abs(dxk), 1.0)*step(hp.y, top)*step(0.01, ar.w); }
    shade = max(shade, solid*0.92);
  }
  sky = mix(sky, uDeep*0.85, shade);
  float ndv = clamp(dot(nw, v), 0.0, 1.0), om = 1.0 - ndv, om2 = om*om;
  float F = 0.07 + 0.93*om2*om;
  vec3 water = mix(uDeep, sky, F);
  // the weir: a drowned line of white water
  float wx = (P.x - 0.5*(uWeir.x + uWeir.y))/max(0.5*(uWeir.y - uWeir.x), 1.0);
  float wz = P.y - uWeir.z + 1.5*sin(P.x*0.35);
  float wl = (1.0 - smoothstep(0.85, 1.0, abs(wx)))*uWeir.w;
  float foam = wl*((1.0 - smoothstep(0.3, 1.5, abs(wz - 0.2))) + 0.6*(1.0 - smoothstep(0.5, 9.0, wz))*step(0.0, wz)*smoothstep(0.35, 0.75, rwN(vec2(P.x*0.9, wz*0.8 - uTime*1.3))));
  // (white water is soft and broken, never a hard bright streak under the eye)
  water = mix(water, uMistCol*0.85 + 0.2*uSkyRose, clamp(foam, 0.0, 0.34)*(0.4 + 0.6*smoothstep(0.25, 0.7, rwN(vec2(P.x*0.9 + 3.0, P.y*0.8 - uTime*0.7)))));
  mat *= 1.0 - wl*(1.0 - smoothstep(4.0, 14.0, abs(wz)));
  // the waterline: the water is dark under a mat's edge, a thin bright line lies where it climbs the stems, and
  // the edge of the mat itself stands up out of it in shade
  water *= 1.0 - 0.5*smoothstep(0.34, 0.5, mv)*(1.0 - mat);
  float lip = smoothstep(0.5 - 2.6*ew, 0.5 - 1.8*ew, mv)*(1.0 - smoothstep(0.5 - 1.6*ew, 0.5 - 0.9*ew, mv))*midK;
  water += (uSkyLow + 0.4*uSkyRose)*0.13*lip;
  weed *= 1.0 - 0.4*(1.0 - smoothstep(0.0, 0.07, mv - 0.5))*midK;
  weed = mix(weed, uDeep*0.7 + weed*vec3(0.3, 0.24, 0.19), 0.75*sick*(1.0 - smoothstep(0.0, 0.16, mv - 0.5)));
  vec3 col = mix(water, weed, mat);
  gl_FragColor = vec4(rwAir(col, vW, cameraPosition), 1.0);
}`;
// the grid: fine under the route, coarser away from it. L: { z0, z1, dz, centreX(z), cols (per side), first, ratio }
export function makeSheet(U, map, L, own = {}) {
  const rows = Math.round((L.z0 - L.z1) / L.dz), offs = [0]; let st = L.first ?? 0.9;
  for (let k = 0; k < L.cols; k++) { offs.push(offs[offs.length - 1] + st); st *= L.ratio ?? 1.14; }
  const xs = [...offs.slice(1).reverse().map((o) => -o), ...offs], NC = xs.length, P = new Float32Array((rows + 1) * NC * 3), I = [];
  for (let j = 0; j <= rows; j++) { const z = L.z0 - j * L.dz, cx = L.centreX(z); for (let i = 0; i < NC; i++) { const o = (j * NC + i) * 3; P[o] = cx + xs[i]; P[o + 1] = 0; P[o + 2] = z; } }
  for (let j = 0; j < rows; j++) for (let i = 0; i < NC - 1; i++) { const a = j * NC + i, b = a + NC; I.push(a, a + 1, b + 1, a, b + 1, b); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(P, 3)); g.setIndex(I);
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, (L.z0 + L.z1) / 2), 2000);
  const u = withShared(U, { tMap: { value: map.texture }, uMapBox: { value: map.box }, uRing: { value: [0, 1, 2, 3, 4, 5, 6, 7].map(() => new THREE.Vector4(0, 0, -1, 0)) },
    uJ: { value: Array.from({ length: 12 }, () => new THREE.Vector3(0, -100, 0)) }, uBlob: { value: [0, 1, 2].map(() => new THREE.Vector4(0, -100, 0, 0)) },
    uArch: { value: [0, 1, 2, 3, 4].map(() => new THREE.Vector4(0, 1, 0, 0)) }, uBridge: { value: new THREE.Vector4(0, 0, 0, 0) },
    uWake: { value: [0, 1, 2, 3, 4, 5, 6, 7].map(() => new THREE.Vector4(0, 1e5, 0, 1)) }, uWeir: { value: new THREE.Vector4(0, 1, 0, 0) }, uDeep: { value: new THREE.Color(0.008, 0.012, 0.026) }, ...own });
  const mesh = new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms: u, vertexShader: SHEET_VS, fragmentShader: SHEET_FS }));
  mesh.frustumCulled = false;
  return { object: mesh, uniforms: u, triangles: I.length / 3 };
}
