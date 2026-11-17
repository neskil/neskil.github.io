// THE LAST LIT WINDOWS, the far things of the Night Land: the silent house on its hill, the smoking cones, the kiln, the
// strata of smoke that hang across the face, and the lights the far Watchers stand by.
//
//   buildHouse(shared, L)             a plain block 30 m high, nine windows of cold white light that never flicker, one
//                                     open black door; it looks toward the pyramid
//   buildCones(ctx, shared, L, rng)   five cinder cones and the smoke that stands over them, lit red from below
//   buildKiln(shared, L)              a ring of broken wall round the kiln fire
//   buildStrata(shared, opts)         flat sheets of smoke at three heights (and low bars over the eastern land), drifting west
//   buildCrown(shared, at, r)         the ring of blue light over a far Watcher: it turns and flickers
//   buildWanderers(shared, rng, L)    a few cold lights that go slowly about the far country, close to the ground
import * as THREE from 'three';
import { NL_GLSL } from './last-lit-windows.js';

const FOG_FS = /* glsl */`precision highp float;
${NL_GLSL}
varying vec3 vCol; varying vec3 vW;
void main(){ gl_FragColor = vec4(nlFog(vCol, vW), 1.0); }`;

// ------------------------------------------------------------------------------------------------ the house
export function buildHouse(shared, L, look = [0, 1400]) {
  const h = L.house, W = 26, H = 30, D = 22;
  const g = new THREE.BoxGeometry(W, H, D).translate(0, H / 2 - 2, 0);
  const yaw = Math.atan2(look[0] - h.x, look[1] - h.z);
  const mat = new THREE.ShaderMaterial({
    uniforms: { ...shared.uniforms, uSize: { value: new THREE.Vector3(W, H, D) } },
    vertexShader: /* glsl */`
      varying vec3 vL; varying vec3 vN; varying vec3 vNw; varying vec3 vW;
      void main(){ vL = position; vN = normal; vNw = normalize(mat3(modelMatrix)*normal); vec4 w = modelMatrix*vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix*viewMatrix*w; }`,
    fragmentShader: /* glsl */`precision highp float;
      ${NL_GLSL}
      uniform vec3 uSize;
      varying vec3 vL; varying vec3 vN; varying vec3 vNw; varying vec3 vW;
      void main(){
        vec3 N = normalize(vNw); vec3 toE = cameraPosition - vW; float dist = max(length(toE), 1e-3); vec3 V = toE/dist;
        vec3 alb = vec3(0.028, 0.029, 0.033)*(0.8 + 0.4*nlN(vL.xy*0.35 + vL.z*0.2));
        vec3 c = nlLight(vW, N, V, alb, 0.6) + alb*vec3(0.03, 0.034, 0.045);
        // the front: three rows of three windows, and the door; the same on the two sides so that it is never blind
        float front = step(0.5, vN.z), side = step(0.5, abs(vN.x));
        vec2 f = mix(vec2(vL.x/uSize.x, 0.0), vec2(vL.z/uSize.z, 0.0), side) + vec2(0.5, (vL.y + 2.0)/uSize.y);
        float px = dist*0.0011;                                          // about one pixel, in metres
        vec2 wsz = vec2(0.055, 0.05) + vec2(px/uSize.x, px/uSize.y)*0.5;     // a far window never falls below a pixel
        vec2 cell = vec2(f.x*3.0, (f.y - 0.3)*3.0/0.62);
        vec2 q = fract(cell) - 0.5; q /= vec2(3.0, 3.0/0.62);
        float inRows = step(0.3, f.y)*step(f.y, 0.92);
        float win = (1.0 - smoothstep(wsz.x*0.8, wsz.x, abs(q.x)))*(1.0 - smoothstep(wsz.y*0.8, wsz.y, abs(q.y)))*inRows*max(front, side*step(0.5, vN.x));
        float door = (1.0 - smoothstep(0.07, 0.075, abs(f.x - 0.5)))*(1.0 - smoothstep(0.2, 0.205, f.y))*front;
        c = mix(c, vec3(0.0), door);
        c += vec3(0.72, 0.83, 1.0)*win*2.6;
        gl_FragColor = vec4(nlFog(c, vW), 1.0);
      }`,
  });
  const mesh = new THREE.Mesh(g, mat); mesh.position.set(h.x, h.y, h.z); mesh.rotation.y = yaw; mesh.name = 'house';
  const front = [h.x + Math.sin(yaw) * (D / 2 + 3), h.y + H * 0.55, h.z + Math.cos(yaw) * (D / 2 + 3)];
  return { mesh, front, triangles: 12 };
}

// ------------------------------------------------------------------------------------------------ the cones
export async function buildCones(ctx, shared, L, rng) {
  const noise = ctx.noise, group = new THREE.Group(); group.name = 'cones';
  const p = [], n = [], col = [], cc = [], idx = [], S = 28, prof = [[1.0, 0.0], [0.72, 0.22], [0.47, 0.5], [0.3, 0.76], [0.2, 0.95], [0.16, 1.0], [0.11, 0.9], [0.05, 0.78]];
  for (const c of L.cones) {
    const b = p.length / 3;
    for (let k = 0; k < prof.length; k++) for (let s = 0; s < S; s++) {
      const a = s / S * 6.2832, lump = 1 + 0.16 * noise.n2(Math.cos(a) * 2 + c.x, Math.sin(a) * 2 + k * 0.7) * (k < 5 ? 1 : 0.3);
      const r = c.r * prof[k][0] * lump, x = c.x + Math.cos(a) * r, z = c.z + Math.sin(a) * r;
      const y = k === 0 ? L.heightAt(x, z) - 2 : c.y + c.h * prof[k][1] * (1 + 0.06 * noise.n2(a * 3, c.z));
      p.push(x, y, z); const inside = k > 5 ? -1 : 1; n.push(Math.cos(a) * 0.75 * inside, 0.66, Math.sin(a) * 0.75 * inside);
      col.push(k > 5 ? (k - 5) / 2 : k === 5 ? 0.25 : 0, prof[k][1], rng()); cc.push(c.x, c.z, k > 5 ? 0 : 1);
    }
    for (let k = 0; k < prof.length - 1; k++) for (let s = 0; s < S; s++) { const a = b + k * S + s, a2 = b + k * S + (s + 1) % S, c2 = a + S, d = a2 + S; idx.push(a, c2, a2, a2, c2, d); }
    await ctx.yield();
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(n, 3)); g.setAttribute('aC', new THREE.Float32BufferAttribute(col, 3)); g.setAttribute('aCc', new THREE.Float32BufferAttribute(cc, 3)); g.setIndex(idx);
  g.computeBoundingSphere();
  const mesh = new THREE.Mesh(g, new THREE.ShaderMaterial({
    uniforms: { ...shared.uniforms }, side: THREE.DoubleSide,
    // polish round 1 (P1d): two threads of fire come down each cone's flank from its lip, on two sides that follow
    // from where the cone stands; each wanders as it comes down, widens, breaks, and is dark before the foot. They
    // carry through the night's air as the ground's firelight does (half its density).
    fragmentShader: /* glsl */`precision highp float;
      ${NL_GLSL}
      varying vec3 vCol; varying vec3 vW; varying vec3 vCc; varying float vHt;
      void main(){
        vec2 dv = vW.xz - vCc.xy; float a = atan(dv.y, dv.x + 1e-5), rr = length(dv), sd = fract(vCc.x*0.0137 + vCc.y*0.0071), em = 0.0;
        for (int i = 0; i < 2; i++) {
          float fi = float(i);
          float a0 = 6.2832*fract(sd + 0.37*fi + 0.11) - 3.1416 + 0.22*sin(vHt*7.0 + sd*40.0 + fi*2.0) + 0.08*sin(vHt*23.0 + fi);
          float da = abs(mod(a - a0 + 3.14159265, 6.2831853) - 3.14159265)*rr, wd = 2.2 + 5.0*(1.0 - vHt);
          em += exp(-da*da/(wd*wd))*smoothstep(0.1 + 0.3*fi, 0.42 + 0.3*fi, vHt)*(0.5 + 0.5*nlN(vec2(vHt*26.0 - uTime*0.15, fi*5.0 + sd*9.0)));
        }
        vec3 fire = vec3(0.95, 0.17, 0.03)*(em*vCc.z);
        gl_FragColor = vec4(nlFog(vCol, vW) + fire*(1.0 - nlFogAmount(vW, uFog.x*0.5)), 1.0);
      }`,
    vertexShader: /* glsl */`
      ${NL_GLSL}
      attribute vec3 aC; attribute vec3 aCc; varying vec3 vCol; varying vec3 vW; varying vec3 vCc; varying float vHt;
      void main(){
        vCc = aCc; vHt = aC.y;
        vec3 N = normalize(normal); vec3 toE = cameraPosition - position; vec3 V = toE/max(length(toE), 1e-3);
        vec3 alb = vec3(0.04, 0.038, 0.042)*(0.7 + 0.6*aC.z);
        float fr = 1.0 - max(dot(N, V), 0.0);
        // the throat glows, and the glow licks the lip
        vCol = nlKey(position, N, V, alb, 0.8) + alb*vec3(0.03, 0.03, 0.045) + vec3(0.62, 0.028, 0.018)*(1.6*aC.x*(0.8 + 0.2*sin(uTime*0.9 + aC.z*20.0)))
          + vec3(0.2, 0.012, 0.008)*smoothstep(0.7, 1.0, aC.y)*fr*0.4;
        vW = position; gl_Position = projectionMatrix*viewMatrix*vec4(position, 1.0);
      }`,
  }));
  mesh.name = 'cone-hills'; group.add(mesh);
  // the smoke: three tall cards a cone, turned to the eye, leaning west; red where it leaves the throat
  const cards = [];
  for (const c of L.cones) for (let i = 0; i < 3; i++) cards.push(c.x, c.y + c.h * 0.9, c.z, c.h * (0.5 + 0.22 * i), c.h * (2.6 + 0.9 * i), rng(), i, 0);
  // the pits and fires of the far country: each stands under its own smoke, red (or blue) where the fire lights it from below
  const hs = (x, z, k) => { const v = Math.sin(x * 12.9898 + z * 78.233 + k * 37.719) * 43758.5453; return v - Math.floor(v); };     // variety from where it stands
  for (const q of L.pits) if (q.x > 200) for (let i = 0; i < 2; i++) cards.push(q.x, q.y + 1, q.z, q.r * (2.6 + 1.2 * i), q.r * (6 + 4 * i), hs(q.x, q.z, i), i, 1 + q.kind);
  for (const q of L.farFires) if (q.r > 3.6) cards.push(q.x, q.y + 1, q.z, q.r * (4.5 + 2.5 * hs(q.x, q.z, 3)), q.r * (7 + 6 * hs(q.x, q.z, 4)), hs(q.x, q.z, 5), 0, 1 + q.kind);
  const cg = new THREE.InstancedBufferGeometry();
  cg.setAttribute('position', new THREE.Float32BufferAttribute([-1, 0, 0, 1, 0, 0, 1, 1, 0, -1, 1, 0], 3)); cg.setIndex([0, 1, 2, 0, 2, 3]);
  const ib = new THREE.InstancedInterleavedBuffer(new Float32Array(cards), 8);
  cg.setAttribute('aAt', new THREE.InterleavedBufferAttribute(ib, 4, 0)); cg.setAttribute('aF', new THREE.InterleavedBufferAttribute(ib, 4, 4));
  cg.instanceCount = cards.length / 8; cg.boundingSphere = new THREE.Sphere(new THREE.Vector3(1500, 100, 2400), 3200);
  const plume = new THREE.Mesh(cg, new THREE.ShaderMaterial({
    uniforms: { ...shared.uniforms }, transparent: true, depthWrite: false, blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor,
    vertexShader: /* glsl */`
      attribute vec4 aAt; attribute vec4 aF;
      varying vec2 vQ; varying vec4 vF; varying vec3 vW;
      void main(){
        vec3 base = aAt.xyz; vec3 toE = cameraPosition - base; toE.y = 0.0;
        vec3 right = normalize(vec3(toE.z, 0.0, -toE.x) + vec3(1e-4, 0.0, 0.0));
        float y = position.y;
        vec3 p = base + right*position.x*aAt.w*(0.55 + 1.5*y) + vec3(0.0, y*aF.x, 0.0);
        p.x -= y*y*aF.x*0.55;
        vQ = vec2(position.x, y); vF = aF; vW = p;
        gl_Position = projectionMatrix*viewMatrix*vec4(p, 1.0);
      }`,
    fragmentShader: /* glsl */`precision highp float;
      ${NL_GLSL}
      varying vec2 vQ; varying vec4 vF; varying vec3 vW;
      void main(){
        float x = vQ.x, y = clamp(vQ.y, 0.0, 1.0), s = vF.y*31.0;
        float n = nlF(vec2(x*1.4 + s, y*3.2 - uTime*0.06*(1.0 + 0.4*vF.z))), n2 = nlF(vec2(x*3.6 - s, y*7.0 - uTime*0.11));
        float body = (1.0 - smoothstep(0.25, 0.95, abs(x) + 0.5*(n - 0.5)))*smoothstep(0.0, 0.05, y)*(1.0 - smoothstep(0.5, 1.0, y));
        float a = clamp(body*(0.35 + 0.9*n2)*0.8, 0.0, 0.9);
        float pit = step(0.5, vF.w), blue = step(1.5, vF.w);
        vec3 fire = mix(vec3(0.4, 0.022, 0.014), vec3(0.04, 0.12, 0.62), blue);
        vec3 c = vec3(0.018, 0.017, 0.022)*(0.6 + 0.8*n) + fire*exp(-y*mix(9.0, 5.0, pit))*(0.6 + 0.6*n2)*(1.0 + 0.8*pit) + fire*0.125*exp(-y*2.5)*(1.0 + 1.6*pit);
        // (polish round 1, P1d: the underside of a cone's smoke takes a dull glow from its throat, carried as above)
        vec3 und = fire*((1.0 - pit)*0.35*exp(-y*5.0)*(0.4 + 0.9*n2));       // (second part, G3c: thinner and lower)
        gl_FragColor = vec4((nlFog(c, vW) + und*(1.0 - nlFogAmount(vW, uFog.x*0.5)))*a, a);
      }`,
  }));
  plume.name = 'cone-smoke'; plume.renderOrder = 2; group.add(plume);
  return { group, triangles: idx.length / 3 + cards.length / 8 * 2 };
}

// ------------------------------------------------------------------------------------------------ the kiln
export function buildKiln(shared, L) {
  const k = L.kiln, p = [], n = [], idx = [], S = 40, R0 = 15;
  // a broken ring of wall: its height falls away to nothing on the side that faces the pyramid, where the fire shows
  for (let s = 0; s <= S; s++) {
    const a = s / S * 6.2832, open = Math.cos(a - Math.atan2(1400 - k.z, 0 - k.x)), hgt = 2 + 7 * Math.max(0, 0.75 - open) + 1.5 * Math.sin(a * 5);
    const cx = Math.cos(a), sz = Math.sin(a);
    for (const [r, y] of [[R0 + 3.5, -1], [R0 + 1, hgt], [R0 - 1, hgt], [R0 - 2, -1]]) { p.push(k.x + cx * r, k.y + y, k.z + sz * r); n.push(cx * (r > R0 ? 1 : -1), 0.5, sz * (r > R0 ? 1 : -1)); }
  }
  for (let s = 0; s < S; s++) for (let j = 0; j < 3; j++) { const a = s * 4 + j, b = a + 4; idx.push(a, a + 1, b, b, a + 1, b + 1); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(n, 3)); g.setIndex(idx); g.computeBoundingSphere();
  const mesh = new THREE.Mesh(g, new THREE.ShaderMaterial({
    uniforms: { ...shared.uniforms, uAt: { value: new THREE.Vector3(k.x, k.y + 3, k.z) } }, fragmentShader: FOG_FS, side: THREE.DoubleSide,
    vertexShader: /* glsl */`
      ${NL_GLSL}
      uniform vec3 uAt; varying vec3 vCol; varying vec3 vW;
      void main(){
        vec3 N = normalize(normal); vec3 toE = cameraPosition - position; vec3 V = toE/max(length(toE), 1e-3);
        vec3 alb = vec3(0.05, 0.047, 0.05);
        vec3 toF = uAt - position; float d = max(length(toF), 1.0);
        vCol = nlKey(position, N, V, alb, 0.6) + alb*vec3(0.62, 0.028, 0.018)*(max(dot(N, toF/d), 0.0)*60.0/(1.0 + d*d*0.02))*(0.85 + 0.15*sin(uTime*2.3));
        vW = position; gl_Position = projectionMatrix*viewMatrix*vec4(position, 1.0);
      }`,
  }));
  mesh.name = 'kiln';
  return { mesh, triangles: idx.length / 3 };
}

// ------------------------------------------------------------------------------------------------ strata
// Each layer: [height, centre x, centre z, half size, density 0..1, kind (0 the three high strata, 1 the low bars)].
export function buildStrata(shared, layers, glowFar) {
  const p = [], s = [], c = [], idx = [];
  layers.forEach((l, i) => {
    const b = p.length / 3, [y, cx, cz, h, den, kind] = l;
    for (const [qx, qz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { p.push(cx + qx * h, y, cz + qz * h); s.push(i * 1.37 + 0.3, den, kind, y); c.push(qx, qz); }
    idx.push(b, b + 2, b + 1, b, b + 3, b + 2);
  });
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3)); g.setAttribute('aS', new THREE.Float32BufferAttribute(s, 4)); g.setAttribute('aC', new THREE.Float32BufferAttribute(c, 2)); g.setIndex(idx);
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 500, 1800), 9000);
  const uniforms = { ...shared.uniforms, uThick: { value: 1 }, uGlowFar: { value: glowFar ? glowFar.tex : null }, uGlowFarBox: { value: new THREE.Vector4(...(glowFar ? glowFar.box : [0, 0, 1, 1])) },
    uGlowWide: { value: glowFar && glowFar.wide ? glowFar.wide : null }, uWideBox: { value: new THREE.Vector4(...(glowFar && glowFar.wide ? glowFar.wideBox : [0, 0, 0, 0])) } };
  const mesh = new THREE.Mesh(g, new THREE.ShaderMaterial({
    uniforms, transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor,
    vertexShader: /* glsl */`
      attribute vec4 aS; attribute vec2 aC; varying vec3 vW; varying vec4 vS; varying vec2 vC;
      void main(){ vW = position; vS = aS; vC = aC; gl_Position = projectionMatrix*viewMatrix*vec4(position, 1.0); }`,
    fragmentShader: /* glsl */`precision highp float;
      ${NL_GLSL}
      uniform float uThick; uniform sampler2D uGlowFar, uGlowWide; uniform vec4 uGlowFarBox, uWideBox;
      varying vec3 vW; varying vec4 vS; varying vec2 vC;
      void main(){
        vec3 toE = cameraPosition - vW; float dist = max(length(toE), 1.0);
        // the fires of the country under it, blurred as wide as the smoke is high
        vec2 fuv = (vW.xz - uGlowFarBox.xy)*uGlowFarBox.zw, fo = vec2(50.0 + 0.4*vS.w)*uGlowFarBox.zw;
        float inBox = step(0.0, fuv.x)*step(fuv.x, 1.0)*step(0.0, fuv.y)*step(fuv.y, 1.0);
        vec3 under = 0.28*texture2D(uGlowFar, clamp(fuv, 0.0, 1.0)).rgb + 0.18*(texture2D(uGlowFar, clamp(fuv + vec2(fo.x, 0.0), 0.0, 1.0)).rgb + texture2D(uGlowFar, clamp(fuv - vec2(fo.x, 0.0), 0.0, 1.0)).rgb
          + texture2D(uGlowFar, clamp(fuv + vec2(0.0, fo.y), 0.0, 1.0)).rgb + texture2D(uGlowFar, clamp(fuv - vec2(0.0, fo.y), 0.0, 1.0)).rgb);
        // long bars lying along the wind, drifting west at 3 m/s
        vec2 q = vW.xz + vec2(uTime*3.0, 0.0);
        float sd = vS.x*17.0;
        float n = nlF(vec2(q.x/1300.0, q.y/300.0) + sd), n2 = nlF(vec2(q.x/340.0, q.y/95.0) - sd), n3 = nlN(vec2(q.x/90.0, q.y/31.0) + sd);
        float d = smoothstep(0.45, 0.74, n*0.62 + n2*0.3 + n3*0.08 + (vS.y - 0.5)*0.36);
        float edge = 1.0 - smoothstep(0.55, 1.0, max(abs(vC.x), abs(vC.y)));
        float fromFace = vW.z - (1200.0 - 0.325*vW.y);
        float off = smoothstep(8.0, 150.0, fromFace);                    // it lies against the face without cutting it
        // seen edge on a sheet is thick, seen from straight below it is thin
        float graze = clamp(dist/max(abs(toE.y), 20.0), 1.0, 5.0);
        // (thin: whatever lies behind a bar shows through it dimmed, never blanked)
        float a = clamp(d*edge*off*smoothstep(60.0, 220.0, dist)*uThick*(0.2 + 0.11*graze), 0.0, 0.5);
        // black against the windows; its edges lit amber on the pyramid's side, dull red from below over the pits
        float thin = d*(1.0 - d)*4.0;
        vec3 c = vec3(0.004, 0.004, 0.0055)*(0.7 + 0.6*n2);
        c += uKeyCol*((0.05*thin + 0.006*(0.4 + 1.2*n3*n2))*exp(-max(fromFace, 0.0)/420.0) + 0.003*exp(-max(fromFace, 0.0)/1500.0))*(1.0 - 0.6*vS.z);
        c += vec3(0.06, 0.0045, 0.0035)*(0.35 + 0.65*thin)*smoothstep(0.35, 0.75, nlF(vW.xz/420.0 + 3.0))*mix(exp(-vS.w/600.0), 1.0, vS.z)*0.6;
        c += min(under, vec3(1.2))*inBox*(0.3 + 0.7*thin)*mix(0.5*exp(-vS.w/500.0), 0.55, vS.z);
        // polish round 1 (P1): the smoke that lies over the fire country takes the country's wide firelight on its
        // underside, less the higher it lies; that glow carries through the night's air as the ground's does
        vec2 quv = (vW.xz - uWideBox.xy)*uWideBox.zw;
        float inW = step(0.0, quv.x)*step(quv.x, 1.0)*step(0.0, quv.y)*step(quv.y, 1.0);
        vec3 w0 = min(texture2D(uGlowWide, clamp(quv, 0.0, 1.0)).rgb, vec3(2.0));
        // (second part, G3c: thinner, and lower: less than half by 60 m of height; where a cold fire lies under the smoke the
        // red gives way to it, so the two never make rose)
        float cold = clamp(6.0*(w0.b - 0.05*w0.r), 0.0, 1.0);
        w0 = mix(w0, vec3(0.05, 0.15, 0.7)*(w0.b/0.7), cold);
        vec3 wu = w0*(inW*(0.25 + 0.75*thin)*mix(0.03*exp(-vS.w/70.0), 0.03, vS.z));
        gl_FragColor = vec4((nlFog(c, vW) + wu*(1.0 - nlFogAmount(vW, uFog.x*0.5)))*a, a);
      }`,
  }));
  mesh.name = 'strata'; mesh.renderOrder = 1;
  return { mesh, uniforms, triangles: layers.length * 2 };
}

// ------------------------------------------------------------------------------------------------ the far Watchers' lights
export function buildCrown(shared, at, r) {
  const g = new THREE.CylinderGeometry(r, r, r * 0.16, 56, 1, true);
  const mesh = new THREE.Mesh(g, new THREE.ShaderMaterial({
    uniforms: { ...shared.uniforms }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    vertexShader: /* glsl */`varying vec2 vU; varying vec3 vW; void main(){ vU = uv; vec4 w = modelMatrix*vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix*viewMatrix*w; }`,
    fragmentShader: /* glsl */`precision highp float;
      ${NL_GLSL}
      varying vec2 vU; varying vec3 vW;
      void main(){
        // a ring of cold fire, blue-white: brighter knots that go slowly round it, and a flicker
        float a = vU.x*6.2831853, band = clamp(1.0 - abs(vU.y*2.0 - 1.0), 0.0, 1.0);
        float knots = 0.45 + 0.55*smoothstep(0.2, 0.9, 0.5 + 0.5*sin(a*5.0 - uTime*0.35)) + 0.5*smoothstep(0.6, 1.0, 0.5 + 0.5*sin(a*2.0 + uTime*0.21));
        float fl = 0.8 + 0.2*sin(uTime*2.7 + a*3.0)*sin(uTime*1.3);
        vec3 c = vec3(0.3, 0.48, 1.0)*(band*band*knots*fl*1.8) + vec3(0.7, 0.82, 1.0)*pow(band, 6.0)*knots*1.1;
        gl_FragColor = vec4(c*(1.0 - nlFogAmount(vW, uFog.x*0.35)), 1.0);
      }`,
  }));
  mesh.position.set(at[0], at[1], at[2]); mesh.rotation.set(0.12, 0, 0.08); mesh.name = 'crown'; mesh.renderOrder = 3;
  return { mesh, triangles: 112 };
}
// ------------------------------------------------------------------------------------------------ the wandering lights
// Cold points of light that go slowly about the far country, a man's height over the ground: nobody knows what carries them.
export function buildWanderers(shared, rng, L, n = 11) {
  const c = [], q = [];
  let guard = 0;
  while (c.length / 4 < n && guard++ < 400) {
    const x = rng.range(420, 2500), z = rng.range(1560, 2700);
    if (L.farIn(x, z, 120) || Math.hypot(x - L.house.x, z - L.house.z) < 220) continue;
    const ra = rng.range(50, 170), sp = rng.range(2.2, 4.5) / ra * (rng.chance(0.5) ? 1 : -1);
    c.push(x, z, ra, ra * rng.range(0.3, 0.8)); q.push(sp, rng() * 6.283, L.heightAt(x, z) + rng.range(5, 9), rng.range(0.9, 1.6));
  }
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3)); g.setIndex([0, 1, 2, 0, 2, 3]);
  g.setAttribute('aC', new THREE.InstancedBufferAttribute(new Float32Array(c), 4)); g.setAttribute('aQ', new THREE.InstancedBufferAttribute(new Float32Array(q), 4));
  g.instanceCount = c.length / 4; g.boundingSphere = new THREE.Sphere(new THREE.Vector3(1400, 0, 2100), 2200);
  const mesh = new THREE.Mesh(g, new THREE.ShaderMaterial({
    uniforms: { ...shared.uniforms }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: /* glsl */`
      uniform float uTime; uniform vec2 uRes;
      attribute vec4 aC; attribute vec4 aQ;      // centre x, z, the two radii of its round; speed, phase, height, size
      varying vec2 vQ; varying vec3 vW; varying float vK;
      void main(){
        float t = uTime*aQ.x + aQ.y;
        vec3 c = vec3(aC.x + aC.z*sin(t), aQ.z + 1.5*sin(t*3.1 + aQ.y), aC.y + aC.w*sin(t*0.63 + aQ.y*3.0));
        vec3 toE = cameraPosition - c; float dist = max(length(toE), 1.0);
        float pix = dist*1.2498/max(uRes.y, 1.0), hw = max(aQ.w, 2.2*pix);
        vec3 right = normalize(vec3(toE.z, 0.0, -toE.x) + vec3(1e-4, 0.0, 0.0));
        vec3 p = c + right*(position.x*hw) + vec3(0.0, position.y*hw, 0.0);
        vK = (aQ.w/hw)*(0.75 + 0.25*sin(uTime*0.9 + aQ.y*7.0)); vQ = position.xy; vW = c;
        gl_Position = projectionMatrix*viewMatrix*vec4(p, 1.0);
      }`,
    fragmentShader: /* glsl */`precision highp float;
      ${NL_GLSL}
      varying vec2 vQ; varying vec3 vW; varying float vK;
      void main(){
        float r2 = dot(vQ, vQ);
        vec3 c = vec3(0.72, 0.83, 1.0)*(2.6*exp(-r2*9.0) + 0.35*exp(-r2*2.2))*(1.0 - smoothstep(0.7, 1.0, r2))*clamp(vK, 0.0, 1.0);
        gl_FragColor = vec4(c*(1.0 - nlFogAmount(vW, uFog.x*0.5)), 1.0);
      }`,
  }));
  mesh.name = 'wanderers'; mesh.renderOrder = 3;
  return { mesh, triangles: 2 * c.length / 4 };
}

// ------------------------------------------------------------------------------------------------ the far Watchers' own glow (polish round 1, P1g)
// The air behind a far Watcher holds the light of its fire (or of the ring over it): a standing sheet of glow on the
// side of it away from the house, so that from the house its bulk is a dark shape against its own light. The sheet
// stands in the world (it does not turn to the eye): upright, square to the line from the Watcher to the house, nine
// tenths of the Watcher's height behind its middle, three heights wide and two high.
export function buildFarGlow(shared, w, color) {
  const bx = w.x - w.f[0] * w.tall * 0.9, bz = w.z - w.f[1] * w.tall * 0.9, rx = -w.f[1], rz = w.f[0], hw = w.tall * 1.6, y0 = -20, y1 = w.tall * 2.1;
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute([bx - rx * hw, y0, bz - rz * hw, bx + rx * hw, y0, bz + rz * hw, bx + rx * hw, y1, bz + rz * hw, bx - rx * hw, y1, bz - rz * hw], 3));
  g.setAttribute('aQ', new THREE.Float32BufferAttribute([-1, 0, 1, 0, 1, 1, -1, 1], 2)); g.setIndex([0, 1, 2, 0, 2, 3]); g.computeBoundingSphere();
  const mesh = new THREE.Mesh(g, new THREE.ShaderMaterial({
    uniforms: { ...shared.uniforms, uCol: { value: new THREE.Color(...color) } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    vertexShader: /* glsl */`attribute vec2 aQ; varying vec2 vQ; varying vec3 vW; void main(){ vQ = aQ; vW = position; gl_Position = projectionMatrix*viewMatrix*vec4(position, 1.0); }`,
    fragmentShader: /* glsl */`precision highp float;
      ${NL_GLSL}
      uniform vec3 uCol; varying vec2 vQ; varying vec3 vW;
      void main(){
        float r2 = vQ.x*vQ.x*1.3 + (vQ.y - 0.3)*(vQ.y - 0.3)*2.4;
        float gl = exp(-r2*3.4)*(0.75 + 0.25*nlN(vec2(vQ.x*3.0 + uTime*0.03, vQ.y*5.0 - uTime*0.05)))*(1.0 - smoothstep(0.8, 1.0, abs(vQ.x)))*(1.0 - smoothstep(0.8, 1.0, vQ.y));
        gl_FragColor = vec4(uCol*(gl*(1.0 - nlFogAmount(vW, uFog.x*0.5))), 1.0);
      }`,
  }));
  mesh.name = 'far-watcher-glow'; mesh.renderOrder = 1;
  return { mesh, triangles: 2 };
}
