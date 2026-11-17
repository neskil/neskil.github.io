// THE LAST LIT WINDOWS, the Watchers: living hills that crept toward the last house through ages and now hold still
// and look at it. A long humped back, shoulders, a blunt head sunk between them and lifted toward the light; hide like
// weathered rock; one dull wet eye that only reflects the windows. They breathe. Nothing else about them moves.
//
//   buildWatcher(ctx, shared, o)   o: { c: [x, z], f: [fx, fz] (the way it faces), tall, lenK, widK, rings, sectors,
//                                       headSeg, ground(x, z), glow: null | { at: [x, y, z], color: [r, g, b], reach, power, sharp }
//                                       (one or a list; sharp: the light falls with the fourth power of distance past its reach)
//                                       (light baked on it: the red pit under one far Watcher, the blue crown of the other),
//                                       phase, hump, headUp, headTilt (how high the back stands and how the head is carried) }
//   returns { group, eye (world position of the eye on the side of -r), eyeMesh, uniforms, triangles, top, headAt }
// The body is a height surface on a polar grid (summed ellipsoids, ridged noise); the head is its own displaced
// ellipsoid, so the brow overhangs the eye; the eye is a lens whose amber points are a reflection worked out in the shader.
import * as THREE from 'three';
import { NL_GLSL, PYR } from './last-lit-windows.js';

const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const sst = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
// ellipsoids in the frame of the 170 m Watcher: along (toward the head), across, half-length, half-width, height
const BLOBS = [
  [-52, 0, 84, 98, 138], [22, 0, 72, 100, 170], [44, -60, 56, 46, 126], [44, 60, 56, 46, 126], [86, 0, 50, 54, 100],
  [92, -46, 32, 30, 34], [92, 46, 32, 30, 34], [-72, -68, 52, 40, 82], [-72, 68, 52, 40, 82], [-112, 0, 30, 46, 46],
  [102, 0, 38, 50, 78],            // the chest under the head, a fold sunk in the earth drifted against it, ending 15 m behind the muzzle: no limb shows, nothing lies forward along the ground
];
const HEAD = { a: 118, y: 97, ra: 46, ry: 32, rb: 38, tilt: 0.3 };

const BODY_VS = /* glsl */`
uniform float uTime, uPhase;
attribute vec4 aInfo;                  // breath weight, height above the ground, a seed, unused
attribute vec3 aGlow; attribute vec3 aPol;      // aPol: cos and sin of the bearing round the body, distance out from the spine
varying vec3 vW, vN, vGlow, vPol; varying vec4 vInfo;
void main(){
  float br = sin(uTime*0.5712 + uPhase), br2 = sin(uTime*0.5712 + uPhase - 0.9);
  vec3 p = position + normal*(0.8*br*aInfo.x) + vec3(0.0, 0.35*br2*aInfo.x, 0.0);
  vN = normal; vGlow = aGlow; vInfo = aInfo; vPol = aPol;
  vec4 wp = modelMatrix*vec4(p, 1.0); vW = wp.xyz;
  gl_Position = projectionMatrix*viewMatrix*wp;
}`;
const BODY_FS = /* glsl */`
precision highp float;
${NL_GLSL}
uniform float uRimK; uniform vec4 uDome; uniform vec3 uDomeCol;
varying vec3 vW, vN, vGlow, vPol; varying vec4 vInfo;
void main(){
  vec3 P = vW; vec3 toEye = cameraPosition - P; float dist = length(toEye); vec3 V = toEye/max(dist, 1e-3);
  vec3 N = normalize(vN + vec3(0.0, 1e-5, 0.0));
  float px = dist*0.0018;
  // hide: slow blotches, folds that run down the flanks from the spine, a grain close by
  vec2 pol = vPol.xy;
  float n1 = nlN3(P*0.045), n3 = nlN3(P*0.8 + 11.0);
  float n2 = nlN(pol*15.0 + vPol.z*vec2(1.9, -1.3) + 5.0), n2b = nlN(pol*41.0 - vPol.z*vec2(2.3, 3.1) + 17.0);
  float fold = 1.0 - abs(2.0*n2 - 1.0), fine = 1.0 - abs(2.0*n2b - 1.0);
  float kf = 1.0 - smoothstep(0.25, 1.2, px), km = 1.0 - smoothstep(0.6, 3.0, px);
  // close by the hide is in plates, cracked apart, a few metres across: a pattern of the place, not of the flank's run
  float plate = 1.0 - abs(2.0*nlN3(P*0.17 + 5.0) - 1.0), crack = smoothstep(0.84, 0.97, plate)*km;
  float plate2 = 1.0 - abs(2.0*nlN3(P*0.47 + 23.0) - 1.0), crack2 = smoothstep(0.86, 0.97, plate2)*kf;
  float hgt = fold*0.9 + fine*0.3*km + n3*0.3*kf + n1*0.5 - 0.6*crack - 0.3*crack2;
  vec3 dpx = dFdx(P), dpy = dFdy(P); float dhx = dFdx(hgt), dhy = dFdy(hgt);
  vec3 r1 = cross(dpy, N), r2 = cross(N, dpx); float det = dot(dpx, r1);
  vec3 grad = (r1*dhx + r2*dhy)/(abs(det) > 1e-7 ? det : 1e-7);
  vec3 Nb = normalize(N - grad*0.7*(1.0 - smoothstep(1.0, 4.0, px)));
  vec3 alb = mix(vec3(0.06, 0.056, 0.056), vec3(0.15, 0.135, 0.12), n1)*(0.55 + 0.7*fold*fold)*(1.0 - 0.3*crack)*(1.0 - 0.18*crack2);
  // a pale crust that has had an age to grow up the lowest twenty metres
  float crust = (1.0 - smoothstep(9.0, 23.0, vInfo.y + 9.0*(n1 - 0.5)))*smoothstep(0.3, 0.62, nlN3(P*0.19 + 3.0));
  alb = mix(alb, vec3(0.15, 0.155, 0.13)*(0.7 + 0.5*n3), crust*0.85);
  // ash sliding off its back: thin pale streams that creep down the folds
  float lane = smoothstep(0.66, 0.8, nlN(pol*33.0 + 9.0));
  float stream = lane*smoothstep(0.5, 0.85, nlN(vec2(n2*7.0 + pol.x*23.0, vInfo.y*0.06 + uTime*0.3)))*smoothstep(12.0, 40.0, vInfo.y)*(1.0 - vInfo.w);
  alb = mix(alb, vec3(0.24, 0.23, 0.22), stream*0.7);
  // The face is a light miles wide: three places on it are taken (low and near, half-way up, high), so that its amber
  // lies broad on whatever looks toward it or up at it and wraps onto the ridges of the folds. The side turned from it is
  // dark but not void: the cold of the sky's rim is on it, least in the folds. Every edge that turns from us is rimmed
  // amber; the pits redden it from below, far up the flank; the dome throws its cold light up under the jaw.
  vec2 q = clamp(P.xz, vec2(-1150.0), vec2(1150.0)); vec2 tq = normalize(P.xz - q + 1e-3).yx*vec2(1.0, -1.0);
  vec3 L0 = normalize(vec3(q*0.96 + tq*380.0, 140.0).xzy - P), L1 = normalize(vec3(q*0.89 - tq*300.0, 420.0).xzy - P), L2 = normalize(vec3(q*0.78, 800.0).xzy - P);
  float fall = sqrt(clamp(nlKeyFall(P), 0.0, 1.0));
  float ka = 0.5*max(dot(Nb, L0) + 0.3, 0.0)/1.3 + 0.4*max(dot(Nb, L1) + 0.3, 0.0)/1.3 + 0.3*max(dot(Nb, L2) + 0.3, 0.0)/1.3, nlg = max(dot(N, L1), 0.0);
  float fr = 1.0 - max(dot(N, V), 0.0), fr2 = fr*fr;
  vec3 col = alb*(uAmb + vec3(0.15, 0.18, 0.29)*((0.35 + 0.65*(0.5 + 0.5*Nb.y))*(0.4 + 0.6*fold)) + uKeyCol*(ka*fall));
  col += uKeyCol*(fr2*fr2*(0.16 + 0.84*nlg)*(0.25 + 0.75*fold)*0.1*uRimK*fall);
  vec3 dd = uDome.xyz - P; float rd2 = dot(dd, dd);
  col += (alb + 0.02*fr2*fr)*uDomeCol*((0.2 + 0.8*max(dot(Nb, dd)*inversesqrt(rd2 + 1e-3), 0.0))/(1.0 + rd2/(uDome.w*uDome.w)));
  col += nlPales(P, Nb, V, alb*1.6, uRimK) + (alb*2.2 + 0.01)*vGlow;
  gl_FragColor = vec4(nlFog(col, P), 1.0);
}`;
// The rim: the same shape drawn again a little larger, inside out, in the light that reaches round it. Whatever shows
// past the black body is its edge: amber where the edge looks toward the face, faint elsewhere, red near a pit.
const HULL_VS = /* glsl */`
uniform float uTime, uPhase; uniform vec2 uRes;
attribute vec4 aInfo;
varying vec3 vW, vN; varying float vH;
void main(){
  float br = sin(uTime*0.5712 + uPhase), br2 = sin(uTime*0.5712 + uPhase - 0.9);
  vec3 p = position + normal*(0.8*br*aInfo.x) + vec3(0.0, 0.35*br2*aInfo.x, 0.0);
  vec4 wp = modelMatrix*vec4(p, 1.0);
  float pix = length(cameraPosition - wp.xyz)*1.2498/max(uRes.y, 1.0);
  wp.xyz += normalize(normal)*max(0.6, 2.2*pix);
  vW = wp.xyz; vN = normal; vH = aInfo.y;
  gl_Position = projectionMatrix*viewMatrix*wp;
}`;
const HULL_FS = /* glsl */`
precision highp float;
${NL_GLSL}
uniform float uRimK; uniform vec4 uDome; uniform vec3 uDomeCol;
varying vec3 vW, vN; varying float vH;
void main(){
  vec3 N = normalize(vN + vec3(0.0, 1e-5, 0.0)); vec3 L = normalize(uKeyAt - vW);
  float k = 0.07 + 0.93*smoothstep(-0.3, 0.7, dot(N, L));
  // broken along its length, as light is on a rough hide
  k *= 0.55 + 0.9*nlN3(vW*0.21);
  vec3 col = uKeyCol*(0.36*k*uRimK*sqrt(clamp(nlKeyFall(vW), 0.0, 1.0)))*smoothstep(2.0, 16.0, vH);
  for (int i = 0; i < 4; i++) { vec3 dl = uPit[i].xyz - vW; col += uPitCol[i]*(0.22/(1.0 + dot(dl, dl)/(uPit[i].w*uPit[i].w*2.0))); }
  vec3 dd = uDome.xyz - vW; col += uDomeCol*(0.03/(1.0 + dot(dd, dd)/(uDome.w*uDome.w)));
  gl_FragColor = vec4(nlFog(col, vW), 1.0);
}`;
const EYE_FS = /* glsl */`
precision highp float;
${NL_GLSL}
uniform float uTurn, uEr; uniform vec3 uLampC; uniform vec4 uDome; uniform vec3 uDomeCol;
varying vec3 vW, vN, vL;
void main(){
  vec3 toEye = cameraPosition - vW; vec3 V = toEye/max(length(toEye), 1e-3);
  vec3 N = normalize(vN + vec3(0.0, 1e-5, 0.0));
  // a dark wet lens that holds the windows of the last house: a small field of amber points, which slides across it as
  // the eye turns and as we pass (the mirror swings about the vertical with the turn)
  float ca = cos(uTurn), sa = sin(uTurn);
  vec3 Nr = normalize(vec3(N.x*ca + N.z*sa, N.y, -N.x*sa + N.z*ca));
  vec3 R = reflect(-V, Nr);
  vec2 lp = vL.xy/max(uEr, 1e-3);
  vec2 c = lp*4.2 + vec2(R.x - 9.0*uTurn, R.y)*2.6, ci = floor(c), cf = c - ci;
  float towards = 1.0 - smoothstep(-0.35, 0.25, R.z + 0.325*R.y);                    // the part of the lens that looks at the face
  float lit = step(0.38, nlH(ci + 5.0));
  vec2 q = cf - 0.5 - 0.3*(vec2(nlH(ci + 1.3), nlH(ci + 8.1)) - 0.5);
  float pt = exp(-dot(q, q)*30.0)*(0.7 + 0.3*sin(uTime*(1.0 + 2.0*nlH(ci)) + nlH(ci + 2.0)*30.0))*(0.4 + 0.6*nlH(ci + 3.7));
  float rl = length(lp), field = (1.0 - smoothstep(0.55, 0.9, rl))*(0.35 + 0.65*towards);
  float fr = 1.0 - max(dot(N, V), 0.0);
  vec2 cw = fwidth(c); float farK = smoothstep(0.35, 1.2, max(cw.x, cw.y));              // far off the points run together into a dull glint
  // one dim lens: a dull glow of the house's light over the whole of it, deepest at its middle, and the points faint in it
  float body = (1.0 - smoothstep(0.35, 1.0, rl))*(0.5 + 0.5*towards);
  vec3 col = vec3(0.003, 0.003, 0.005) + uLampC*(mix(0.9*pt*lit, 0.1, farK)*field + 0.05*field + 0.1*body);
  col += vec3(0.05, 0.055, 0.07)*fr*fr*fr;                                    // wet
  // the lid's shadow above, a line of cold light along the lower lid from the dome
  col *= 0.3 + 0.7*(1.0 - smoothstep(0.45, 1.0, lp.y + 0.25));
  vec3 dd = uDome.xyz - vW; float rd2 = dot(dd, dd);
  col += uDomeCol*(0.05*pow(max(dot(reflect(-V, N), dd*inversesqrt(rd2 + 1e-3)), 0.0), 24.0) + 0.012*smoothstep(0.6, 0.95, rl))/(1.0 + rd2/(uDome.w*uDome.w));
  col += nlPales(vW, N, V, vec3(0.02), 0.6);
  gl_FragColor = vec4(nlFog(col, vW), 1.0);
}`;

export async function buildWatcher(ctx, shared, o) {
  const noise = ctx.noise, S = o.tall / 170, lk = (o.lenK ?? 1) * S, wk = (o.widK ?? 1) * S;
  const f = o.f, r = [-f[1], f[0]], cx = o.c[0], cz = o.c[1], ns = o.seed ?? 0;
  const blobs = BLOBS.map((b, i) => [b[0] * lk, b[1] * wk, b[2] * lk, b[3] * wk, b[4] * S * (i === 1 ? (o.hump ?? 1) : 1)]);      // hump: how high the back stands
  const smooth = (a, b) => {
    let s = 0;
    for (let i = 0; i < blobs.length; i++) { const B = blobs[i], u = (a - B[0]) / B[2], v = (b - B[1]) / B[3], q = 1 - u * u - v * v; if (q > 0) { const y = B[4] * Math.sqrt(q); const y2 = y * y; s += y2 * y2 * y; } }
    return Math.pow(s, 0.2);
  };
  const NR = o.rings ?? 108, NS = o.sectors ?? 160, Ra = 172 * lk, Rb = 116 * wk;
  const body = (a, b) => {
    const y = smooth(a, b); if (y <= 0) return 0;
    const k = Math.min(1, y / (28 * S));
    // a knuckled spine; great folds that run down the flanks from it like the gullies of a hill; lesser lumps
    const rho = Math.hypot(a / Ra, b / Rb), ca = rho > 1e-4 ? a / Ra / rho : 1, sa = rho > 1e-4 ? b / Rb / rho : 0;
    let d = 7 * S * Math.exp(-((b / (13 * wk)) ** 2)) * sst(60 * S, 120 * S, y) * (0.45 + 0.55 * noise.n2(a / (15 * lk) + ns, 3.3));
    d += (12 * noise.ridged2(ca * 2.7 + rho * 0.45 + ns, sa * 2.7 - rho * 0.3, 2) - 5) * S * k * sst(0.1, 0.42, rho);
    d += (4 * noise.ridged2(a / (44 * lk) + 7 + ns, b / (44 * wk) - 3, 2) + 2.2 * noise.n2(a / (9 * lk), b / (9 * wk) + ns) - 2) * S * k;
    return Math.max(0, y + d);
  };
  const nv = 1 + NR * NS, pos = new Float32Array(nv * 3), info = new Float32Array(nv * 4), glow = new Float32Array(nv * 3), pol = new Float32Array(nv * 3);
  const put = (i, a, b) => {
    const y = body(a, b), x = cx + f[0] * a + r[0] * b, z = cz + f[1] * a + r[1] * b;
    pos[i * 3] = x; pos[i * 3 + 1] = y; pos[i * 3 + 2] = z;
    const hf = y / o.tall, gy = o.ground ? o.ground(x, z) : 0;
    const rho = Math.hypot(a / Ra, b / Rb); pol[i * 3] = rho > 1e-4 ? a / Ra / rho : 1; pol[i * 3 + 1] = rho > 1e-4 ? b / Rb / rho : 0; pol[i * 3 + 2] = rho;
    info[i * 4] = sst(0.08, 0.4, hf) * (1 - 0.6 * sst(60 * lk, 110 * lk, a)); info[i * 4 + 1] = y - gy; info[i * 4 + 2] = (a * 0.37 + b * 0.11) % 1; info[i * 4 + 3] = 0;
  };
  put(0, 0, 0);
  for (let i = 1; i <= NR; i++) {
    const t = i / NR, rho = 1 - Math.pow(1 - t, 1.45);
    for (let j = 0; j < NS; j++) { const th = (j / NS) * Math.PI * 2; put(1 + (i - 1) * NS + j, rho * Ra * Math.cos(th), rho * Rb * Math.sin(th)); }
    if ((i & 3) === 3) await ctx.yield();
  }
  const idx = [];
  for (let j = 0; j < NS; j++) idx.push(0, 1 + (j + 1) % NS, 1 + j);
  for (let i = 1; i < NR; i++) for (let j = 0; j < NS; j++) {
    const a = 1 + (i - 1) * NS + j, b = 1 + (i - 1) * NS + (j + 1) % NS, c = a + NS, d = b + NS;
    if (pos[a * 3 + 1] <= 0 && pos[b * 3 + 1] <= 0 && pos[c * 3 + 1] <= 0 && pos[d * 3 + 1] <= 0) continue;
    idx.push(a, b, c, b, d, c);
    if (j === NS - 1 && (i & 31) === 31) await ctx.yield();
  }
  await ctx.yield();
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setIndex(idx);
  geo.computeVertexNormals();
  await ctx.yield();
  // ---- the head: an ellipsoid with a brow, two sockets and a blunt muzzle, tilted up toward the light
  const hs = o.headSeg ?? 44, hg = new THREE.SphereGeometry(1, hs, Math.round(hs * 0.7));
  const hp = hg.attributes.position, hN = hp.count, hinfo = new Float32Array(hN * 4), hglow = new Float32Array(hN * 3), hpol = new Float32Array(hN * 3);
  const tilt = o.headTilt ?? HEAD.tilt, ct = Math.cos(tilt), st = Math.sin(tilt), hc = [HEAD.a * lk, HEAD.y * S * (o.headUp ?? 1), 0];   // how the head is carried
  const eyeDir = (sgn) => { const v = [0.4, -0.02, 0.92 * sgn], l = Math.hypot(...v); return v.map((q) => q / l); };
  const headPoint = (u, v, w) => {       // unit direction (forward, up, across) -> local (a, y, b)
    let rr = 1;
    for (const sgn of [-1, 1]) { const e = eyeDir(sgn), dt = u * e[0] + v * e[1] + w * e[2], ang = Math.acos(clamp(dt, -1, 1)); rr -= 0.055 * Math.exp(-(ang * ang) / (0.2 * 0.2)); }
    rr += 0.17 * Math.exp(-(((v - 0.42) / 0.15) ** 2)) * sst(-0.3, 0.3, u) * (0.75 + 0.25 * Math.abs(w));   // the brow, heaviest over each eye
    rr -= 0.16 * sst(0.72, 1, u);                                                              // the blunt muzzle
    rr += 0.09 * sst(0.1, -0.5, v) * sst(-0.3, 0.4, u);                                        // the jaw, heavy and slack
    rr -= 0.05 * Math.exp(-(((v + 0.08) / 0.07) ** 2)) * sst(0.25, 0.8, u);                      // the line of the mouth
    rr += 0.12 * noise.ridged2(u * 2.3 + w * 1.7 + ns, v * 2.3 - w, 3) - 0.05 + 0.07 * noise.n3(u * 4.5, v * 4.5, w * 4.5 + ns);      // weathered rock, not a ball
    const a = u * HEAD.ra * lk * rr, y = v * HEAD.ry * S * rr, b = w * HEAD.rb * wk * rr;
    return [hc[0] + a * ct - y * st, hc[1] + a * st + y * ct, hc[2] + b];
  };
  for (let i = 0; i < hN; i++) {
    // the sphere's poles lie fore and aft, so the muzzle is smooth
    const u = hp.getY(i), v = hp.getZ(i), w = hp.getX(i), q = headPoint(u, v, w);
    hp.setXYZ(i, cx + f[0] * q[0] + r[0] * q[2], q[1], cz + f[1] * q[0] + r[1] * q[2]);
    hinfo[i * 4] = 0.15; hinfo[i * 4 + 1] = q[1]; hinfo[i * 4 + 2] = 0.5; hinfo[i * 4 + 3] = 1;
    hpol[i * 3] = u * 0.55 + 0.3 * w + 0.5; hpol[i * 3 + 1] = v * 0.55 - 0.22 * w - 0.3; hpol[i * 3 + 2] = 0.5 + 0.4 * w;
  }
  hg.computeVertexNormals();
  // the winding of the remapped sphere may face inward: make the normals point away from the head's centre
  { const n = hg.attributes.normal, wc = [cx + f[0] * hc[0], hc[1], cz + f[1] * hc[0]]; let flip = 0;
    for (let i = 0; i < hN; i += 7) flip += (hp.getX(i) - wc[0]) * n.getX(i) + (hp.getY(i) - wc[1]) * n.getY(i) + (hp.getZ(i) - wc[2]) * n.getZ(i) < 0 ? 1 : -1;
    if (flip > 0) { for (let i = 0; i < hN; i++) n.setXYZ(i, -n.getX(i), -n.getY(i), -n.getZ(i)); const ix = hg.index.array; for (let i = 0; i < ix.length; i += 3) { const t = ix[i + 1]; ix[i + 1] = ix[i + 2]; ix[i + 2] = t; } } }
  await ctx.yield();
  // light baked on (a far Watcher's red pit or blue crown)
  const bake = (P, Nn, G, n) => {
    if (!o.glow) return;
    for (const gl of [].concat(o.glow)) for (let i = 0; i < n; i++) {
      const dx = gl.at[0] - P[i * 3], dy = gl.at[1] - P[i * 3 + 1], dz = gl.at[2] - P[i * 3 + 2], d2 = dx * dx + dy * dy + dz * dz, d = Math.sqrt(d2) || 1;
      const nl = Math.max(0, (Nn[i * 3] * dx + Nn[i * 3 + 1] * dy + Nn[i * 3 + 2] * dz) / d), q = 1 + d2 / (gl.reach * gl.reach), lowK = gl.low ? Math.max(0, Math.min(1, (gl.low[1] - P[i * 3 + 1]) / (gl.low[1] - gl.low[0]))) : 1, a = gl.power * (gl.low ? nl : 0.12 + 0.88 * nl) / (gl.sharp ? q * q : q) * lowK * lowK;   // (low: a light that reaches the body's lower part only, and only what is turned to it)
      G[i * 3] += gl.color[0] * a; G[i * 3 + 1] += gl.color[1] * a; G[i * 3 + 2] += gl.color[2] * a;
    }
  };
  bake(pos, geo.attributes.normal.array, glow, nv); bake(hp.array, hg.attributes.normal.array, hglow, hN);
  geo.setAttribute('aInfo', new THREE.BufferAttribute(info, 4)); geo.setAttribute('aGlow', new THREE.BufferAttribute(glow, 3)); geo.setAttribute('aPol', new THREE.BufferAttribute(pol, 3));
  hg.setAttribute('aInfo', new THREE.BufferAttribute(hinfo, 4)); hg.setAttribute('aGlow', new THREE.BufferAttribute(hglow, 3)); hg.setAttribute('aPol', new THREE.BufferAttribute(hpol, 3));
  hg.deleteAttribute('uv');
  geo.computeBoundingSphere(); hg.computeBoundingSphere();
  const domeU = { uDome: { value: new THREE.Vector4(...(o.dome ? o.dome.at : [0, -1000, 0]), o.dome ? o.dome.reach : 1) }, uDomeCol: { value: new THREE.Color(...(o.dome ? o.dome.color : [0, 0, 0])) } };
  const uniforms = { ...shared.uniforms, ...domeU, uPhase: { value: o.phase ?? 0 }, uRimK: { value: o.rim ?? 1 } };
  const mat = new THREE.ShaderMaterial({ uniforms, vertexShader: BODY_VS, fragmentShader: BODY_FS });
  const group = new THREE.Group(); group.name = 'watcher';
  const bodyMesh = new THREE.Mesh(geo, mat); bodyMesh.name = 'watcher-body'; group.add(bodyMesh);
  const headMesh = new THREE.Mesh(hg, mat); headMesh.name = 'watcher-head'; group.add(headMesh);
  const hullMat = new THREE.ShaderMaterial({ uniforms, vertexShader: HULL_VS, fragmentShader: HULL_FS, side: THREE.BackSide });
  const hullA = new THREE.Mesh(geo, hullMat); hullA.name = 'watcher-rim'; group.add(hullA);
  const hullB = new THREE.Mesh(hg, hullMat); hullB.name = 'watcher-rim'; group.add(hullB);
  // ---- the eyes: lenses seated in the sockets
  const er = 4.6 * S, eyes = [], eyeU = { ...shared.uniforms, ...domeU, uTurn: { value: 0 }, uEr: { value: er }, uLampC: { value: new THREE.Color('#FFC46B') } };
  const eyeMat = new THREE.ShaderMaterial({ uniforms: eyeU, fragmentShader: EYE_FS,
    vertexShader: /* glsl */`varying vec3 vW, vN, vL; void main(){ vL = position; vN = normalize(mat3(modelMatrix)*normal); vec4 wp = modelMatrix*vec4(position, 1.0); vW = wp.xyz; gl_Position = projectionMatrix*viewMatrix*wp; }` });
  for (const sgn of [-1, 1]) {
    const e = eyeDir(sgn), q = headPoint(e[0], e[1], e[2]), q2 = headPoint(e[0] * 1.0, e[1], e[2]);
    // the lens: a cap of a sphere, flattened, its axis along the socket
    const lg = new THREE.SphereGeometry(1, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2); lg.rotateX(Math.PI / 2); lg.scale(er, er, er * 0.6);
    const m = new THREE.Mesh(lg, eyeMat); m.name = 'watcher-eye';
    const dirL = [e[0] * ct - e[1] * st, e[0] * st + e[1] * ct, e[2]];
    const wd = new THREE.Vector3(f[0] * dirL[0] + r[0] * dirL[2], dirL[1], f[1] * dirL[0] + r[1] * dirL[2]).normalize();
    const wp = new THREE.Vector3(cx + f[0] * q[0] + r[0] * q[2], q[1], cz + f[1] * q[0] + r[1] * q[2]).addScaledVector(wd, 0.04 * er);
    m.position.copy(wp); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), wd);
    group.add(m); eyes.push({ mesh: m, at: wp.clone().addScaledVector(wd, 0.4 * er), dir: wd, sgn, q2 });
  }
  return {
    group, uniforms, eyeUniforms: eyeU, eyes, eye: eyes[0].at, bodyMesh, headMesh,
    headAt: new THREE.Vector3(cx + f[0] * hc[0], hc[1], cz + f[1] * hc[0]), top: o.tall,
    triangles: 2 * (idx.length / 3 + hg.index.count / 3) + 2 * 20 * 10 * 2,
  };
}
