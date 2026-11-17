// Reverse Angle: one October valley, two cameras. A is ours, a homing pigeon's eye on the rail; B is locked at the eyes
// of a child at a hayloft door at the far end, looking back along our path. The picture cuts between them eight times,
// keyed to u, and in B the white point in the sky is us: same instant, same wingbeat. See src/parts/reverse-angle.js.
import * as THREE from 'three';
import { makePath } from '../kit/core.js';
import { makeShared, GLSL_COMMON, litMat, makeCut, makeGlint, makeLooseFeather, makePigeon, makeTips, makeMittens, makeWaiter, makeFalcon, makeSleeveGeometry,
  paint, merge, beatOf, pulseOf, makePail, makeBarnFace, makeWagon, makeStackGeometry } from '../parts/reverse-angle.js';

const gustOf = (u) => 1.3 * (1 - sst(0.2, 0.44, u));   // the wind eases as we come: one function of u, so both cameras see the same lean
const sst = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const lerp = (a, b, t) => a + (b - a) * t;
// the shots: B holds the four gaps between A's five
const B_SHOTS = [[0.183, 0.323], [0.492, 0.576], [0.689, 0.801], [0.911, 0.9287]];
const inB = (u) => { for (const s of B_SHOTS) if (u >= s[0] && u < s[1]) return true; return false; };
const DOOR_Z = -627.6, END_Z = -676, EYE = new THREE.Vector3(0, 14.2, -630), LOFT_Y = 10.9, SILL_Y = 13.6, LINTEL_Y = 16.45;
// flight4: four things, each behind one switch of its own (1 is on; 0 leaves the live world exactly as it was)
const SILL_PAIL = 1;      // the corn pail on the sill: standing until the grip is taken, lying ever after
const BARN_FACE = 1;      // the hay door's leaves thrown open on the gable; the lean-to's end wall with its door, window and verge
const YARD_WAGON = 1;     // a hay wagon left half pitched in the yard, its shafts down
const FIELD_STACKS = 0;   // a three-tier stack of round bales at the foot of each baled field up-valley of the wood

// the route by distance: x (an S of 30 m), y, z. z of every point before the last straight is scaled so the path is 676 m.
const ROUTE = [[0, 79, 0], [4, 79, -45], [44, 66, -140], [62, 49, -225], [40, 40, -285], [12, 39.5, -333], [-8, 33, -385], [-25, 26.5, -432],
  [-28, 23.5, -466], [-22, 15, -485], [-13, 8.6, -505], [-7, 8, -541], [-3, 8, -570], [0, 11.6, -596], [0, 14.7, -616], [0, 14.7, -640], [0, 14.7, END_Z]];
function buildPath() {
  let k = 1, path = null;
  for (let it = 0; it < 5; it++) {
    path = makePath(ROUTE.map((p) => [p[0], p[1], p[2] <= -616 ? p[2] : -616 + (p[2] + 616) * k]));
    k *= 1 + (676 - path.length) / 616;
  }
  return path;
}

export default {
  id: 'reverse-angle',
  name: 'Reverse Angle',
  category: 'wilderness',
  weirdness: 0.45,
  media: ['air', 'open'],
  async build(ctx) {
    const rng = ctx.rng, noise = ctx.noise, detail = ctx.quality?.detail ?? 1, vary = ctx.vary || {};
    const scene = new THREE.Scene(), root = new THREE.Group(); root.name = 'ra-root'; scene.add(root);
    const path = buildPath();
    await ctx.yield();
    // ---- variations by seed: the hour (sun side and height), what we go through, the hunter
    // three looks, plain at a glance from the hayloft: 0 long low gold light from B's left with mist filling the hollow;
    // 1 clear and cold, the sun high on the other side; 2 a broad stubble fire or a bank of river mist where the chimney was
    const lowHour = vary.hour === 'golden' || vary.hour === 'dawn', look = lowHour ? 0 : Math.min(2, Math.floor(rng() * 3)), r1 = rng(), r2 = rng();
    const sunSide = look === 0 ? 1 : look === 1 ? -1 : (r1 < 0.5 ? 1 : -1), sunEl = look === 0 ? 14 : look === 1 ? lerp(25, 30, r1) : lerp(17, 22, r2);
    const through = look === 2 ? (r2 < 0.55 ? 'stubble-fire' : 'mist') : 'chimney';
    const LOOK = [{ sun: [1.62, 1.16, 0.7], fogK: 0.0007, fog: [0.62, 0.55, 0.44], mist: 1.0, sheet: 0.8, haze: 0.66, rim: 1.5, zen: [0.04, 0.15, 0.44], hor: [0.7, 0.65, 0.56] },
      { sun: [1.24, 1.2, 1.16], fogK: 0.0004, fog: [0.6, 0.71, 0.82], mist: 0.12, sheet: 0.16, haze: 0.38, rim: 0.9, zen: [0.016, 0.115, 0.5], hor: [0.42, 0.63, 0.86] },
      { sun: [1.36, 1.24, 1.05], fogK: 0.00062, fog: [0.65, 0.7, 0.74], mist: 0.55, sheet: 0.5, haze: 0.6, rim: 1.1, zen: [0.028, 0.158, 0.515], hor: [0.52, 0.69, 0.84] }][look];
    const heroHouse = through === 'chimney';
    const hunter = rng.pick(['falcon', 'goshawk']);
    const rare = !!vary.rare;
    const el = sunEl * Math.PI / 180, az = 50 * Math.PI / 180;
    const sunDir = new THREE.Vector3(sunSide * Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el));
    const shared = makeShared({ sunDir, fogK: LOOK.fogK });
    shared.uSunCol.value.setRGB(LOOK.sun[0], LOOK.sun[1], LOOK.sun[2]); shared.uFogCol.value.setRGB(LOOK.fog[0], LOOK.fog[1], LOOK.fog[2]);
    await ctx.yield();

    // ---- sky: one clean gradient, kept dark overhead so a white bird stands well above it
    const sky = new THREE.Mesh(new THREE.SphereGeometry(3000, 24, 16), new THREE.ShaderMaterial({
      name: 'ra-sky', side: THREE.BackSide, depthWrite: false, depthTest: false, uniforms: { ...shared, uZen: { value: new THREE.Vector3(...LOOK.zen) }, uHor: { value: new THREE.Vector3(...LOOK.hor) } },
      vertexShader: 'varying vec3 vD; void main(){ vD = position; vec4 p = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.); if (abs(p.w) < 1e-4) p.w = 1e-4; gl_Position = p; }',
      fragmentShader: GLSL_COMMON + /* glsl */`
        varying vec3 vD; uniform vec3 uZen, uHor;
        float fbm4(vec2 p){ return vnoise(p) * 0.5 + vnoise(p * 2.03 + 7.1) * 0.27 + vnoise(p * 4.1 + 3.3) * 0.15 + vnoise(p * 8.3 + 1.7) * 0.08; }
        void main(){
          vec3 d = normalize(vD); float h = max(d.y, 0.);
          vec2 dh = normalize(d.xz + vec2(1e-5, 0.)), sh2 = normalize(uSunDir.xz + vec2(1e-5, 0.));
          float sw = 0.5 + 0.5 * dot(dh, sh2);
          vec3 hor = mix(vec3(0.72, 0.95, 1.3) * dot(uHor, vec3(0.3333)), uHor, smoothstep(0.2, 0.8, sw));
          vec3 c = mix(hor, uZen, 1. - exp(-h * 4.4));
          // the loft's side of the sky, the one camera B holds for seconds on end: a decided gradient of light. Deep clean blue
          // overhead, a band of warm light along the land, and the sun's glow coming in from its own side of the frame
          float ls = smoothstep(-0.2, 0.2, d.z), azl = max(dot(dh, sh2), 0.);
          c = mix(c, c * vec3(0.5, 0.8, 1.22), ls * (1. - exp(-h * 3.2)) * 0.75);
          float gk = 1. - 0.72 * smoothstep(0.03, 0.085, h) * (1. - 0.6 * smoothstep(0.75, 0.95, azl));   // the glow hugs the land: the band of sky where the point lives stays clear and cool
          c += ls * uSunCol * (vec3(0.34, 0.25, 0.13) * exp(-h * 11.) * 0.5 + vec3(0.56, 0.38, 0.17) * azl * azl * azl * exp(-h * 4.6) * 0.6 * gk);
          c = mix(c, uSunCol * vec3(0.78, 0.66, 0.46), ls * azl * azl * (0.25 + 0.75 * azl) * exp(-h * 4.2) * 0.56 * gk);
          float s = max(dot(d, uSunDir), 0.); c += vec3(1., 0.85, 0.6) * (0.10 * s * s * s * s + 0.9 * smoothstep(0.9993, 0.9998, s));
          float az = max(dot(dh, sh2), 0.); az *= az; float az4 = az * az;
          c += uSunCol * vec3(0.6, 0.46, 0.27) * (az4 * 0.42 + az * 0.2) * exp(-h * 6.);            // the bright valley haze under the sun
          c = mix(c, c * vec3(0.68, 0.75, 0.88), ls * smoothstep(0.03, 0.085, h));                    // above the bright band the loft's sky is a cooler, deeper tone: a white point stands well clear of it
          // thin high cirrus, combed one way, a little brighter toward the sun
          vec2 pc = d.xz / (h + 0.3) + vec2(uU * 0.25 + uTime * 0.002, 0.);
          float ci = vnoise(vec2(pc.x * 0.9 + pc.y * 0.7, (pc.y - pc.x * 0.4) * 5.)) * 0.6 + vnoise(vec2(pc.x * 2.1 + pc.y * 1.3, (pc.y - pc.x * 0.5) * 11.)) * 0.4;
          ci = smoothstep(0.45, 0.85, ci) * smoothstep(0.3, 1., vnoise(pc * 0.8 + 5.)) * smoothstep(0.1, 0.34, h) * (1. - smoothstep(-0.25, 0.05, d.z));   // none on the loft's side: that sky is kept for one white thing
          c = mix(c, uSunCol * vec3(0.5, 0.56, 0.68) + vec3(0.25, 0.2, 0.12) * az, ci * 0.3);
          vec2 pl = d.xz / (h + 0.25) + vec2(uU * 0.5 + uTime * 0.003, 0.);
          float cl2 = vnoise(vec2(pl.x * 1.1 + pl.y * 0.5, (pl.y + pl.x * 0.35) * 6.)) * 0.6 + vnoise(vec2(pl.x * 2.7 + pl.y * 1.1, (pl.y + pl.x * 0.4) * 13.)) * 0.4;
          cl2 = smoothstep(0.42, 0.8, cl2) * smoothstep(0.25, 0.9, vnoise(pl * 0.7 + 11.)) * smoothstep(0.3, 0.5, h) * ls;
          c = mix(c, c * 1.35 + vec3(0.035, 0.04, 0.05) + uSunCol * vec3(0.1, 0.07, 0.03) * azl, cl2 * 0.55);
          // banked cumulus over the moors and the far ridges. Down the valley's own axis, as the loft sees it, a lane of
          // clean sky is kept: that is where the white point lives. The seam of the wrap lies square to the valley, out of both lenses.
          float a = atan(d.z, d.x + step(abs(d.x) + abs(d.z), 1e-5)), e = h / max(length(d.xz), 1e-3);
          float loftSide = smoothstep(-0.2, 0.2, d.z), lane = smoothstep(0.56, 0.8, abs(a - 1.5708));
          float drift = uU * 1.5 + uTime * 0.004;
          float top = mix(0.1 + 0.26 * vnoise(vec2(a * 1.7 + 3. + drift * 0.4, 2.)), (0.07 + 0.09 * vnoise(vec2(a * 2.1 + 9. + drift * 0.4, 5.))) * lane, loftSide);
          top *= 1. - smoothstep(2.6, 3.05, abs(a));
          vec2 cq = vec2(a * 5.2 + drift, e * 9. - uU * 0.8);
          float f = fbm4(cq), f2 = fbm4(cq + vec2(0.2 * clamp((sh2.x * dh.y - sh2.y * dh.x) * 5., -1., 1.), 0.22));   // eased through the sun's own azimuth and the one opposite: a sign() here cut the bank along a straight line
          float v = (1. - e / max(top, 0.012)) * 0.75 + (f - 0.5) * 1.25, cover = smoothstep(0.32, 0.46, v) * smoothstep(0.012, 0.03, top) * (1. - smoothstep(2.8, 3.08, abs(a)));   // nothing left of the bank where the wrap closes
          float body = smoothstep(0.3, 0.9, v), sunFace = clamp(0.5 + (f - f2) * 4.5, 0., 1.);
          float lit = clamp(sunFace * (0.45 + 0.55 * smoothstep(0., 1., e / max(top, 0.012))) + 0.2 * (1. - body), 0., 1.);
          vec3 shade = mix(vec3(0.26, 0.32, 0.45), vec3(0.4, 0.4, 0.46), sw) * dot(uSunCol, vec3(0.3333)) * 0.85;
          vec3 cl = mix(shade, uSunCol * mix(vec3(0.6, 0.6, 0.6), vec3(0.66, 0.58, 0.47), sw), lit);
          cl += uSunCol * vec3(0.5, 0.36, 0.2) * az4 * (1. - body) * 0.9;                           // toward the sun the thin edges are lit through
          cl = mix(hor, cl, 0.25 + 0.75 * smoothstep(0., 0.07, e));                                // the far banks sink into the haze
          cl = mix(cl, cl * vec3(0.5, 0.52, 0.6) + hor * 0.22, loftSide);                                 // the loft's low banks are toned, never white
          c = mix(c, cl, cover * 0.94);
          c = mix(c, fogColDir(-d), smoothstep(0.02, -0.06, d.y));
          gl_FragColor = vec4(c, 1.);
        }`,
    }));
    sky.name = 'ra-sky'; sky.frustumCulled = false; sky.renderOrder = -1; root.add(sky);

    // ---- the ground: one heightfield. Side ridges, the village spur, the stubble shoulder, the hollow, the farm's flat.
    const riverX = (z) => -118 + 34 * Math.sin(z * 0.0105 + 1.3) + 14 * Math.sin(z * 0.027);
    const height = (x, z) => {
      const ax = Math.abs(x), n = noise.fbm2(x * 0.006, z * 0.006, 3);
      let h = 45 * sst(150, 262, ax) * (0.8 + 0.35 * n) + 2.2 * n;
      if (ax > 176) h += 7 * sst(176, 250, ax) * noise.ridged2(x * 0.011 + 3, z * 0.011, 3);
      h += 30 * sst(690, 800, -z) + 34 * sst(40, 210, z);                                    // the valley's two ends
      const spur = Math.exp(-Math.pow((z + 288) / 62, 2)) * sst(-150, -20, x);                // village spur, in from the right
      h += 22 * spur;
      const sh = sst(-345, -395, z) * sst(-498, -462, z) * sst(-170, -90, x);                 // the pale stubble shoulder
      h += 11.5 * sh;
      h *= 1 - 0.92 * sst(-540, -585, z) * sst(120, 30, ax);                                  // level under the farm
      const rv = Math.abs(x - riverX(z)); h -= 2.4 * sst(26, 4, rv) * (1 - sst(690, 760, -z));
      const near = path.nearestXZ(x, z); if (near.dist < 40) h = Math.min(h, near.y - 5.5 - 0.5 * near.dist * 0.2);
      return h;
    };
    const NX = 180, NZ = 400, X0 = -290, X1 = 290, Z0 = 230, Z1 = -820;
    const H = new Float32Array((NX + 1) * (NZ + 1)), gpos = new Float32Array(H.length * 3), gnor = new Float32Array(H.length * 3);
    for (let j = 0; j <= NZ; j++) {
      const z = lerp(Z0, Z1, j / NZ);
      for (let i = 0; i <= NX; i++) { const x = lerp(X0, X1, i / NX), k = j * (NX + 1) + i; H[k] = height(x, z); gpos[k * 3] = x; gpos[k * 3 + 1] = H[k]; gpos[k * 3 + 2] = z; }
      if (j % 2 === 1) await ctx.yield();
    }
    const dx = (X1 - X0) / NX, dz = (Z0 - Z1) / NZ, gidx = new Uint32Array(NX * NZ * 6);
    for (let j = 0; j <= NZ; j++) { if (j % 50 === 49) await ctx.yield(); for (let i = 0; i <= NX; i++) {
      const k = j * (NX + 1) + i, hl = H[k - (i > 0 ? 1 : 0)], hr = H[k + (i < NX ? 1 : 0)], hu = H[k - (j > 0 ? NX + 1 : 0)], hd = H[k + (j < NZ ? NX + 1 : 0)];
      const nx = (hl - hr) / (2 * dx), nz = (hd - hu) / (2 * dz), inv = 1 / Math.hypot(nx, 1, nz);
      gnor[k * 3] = nx * inv; gnor[k * 3 + 1] = inv; gnor[k * 3 + 2] = nz * inv;
    } }
    await ctx.yield();
    for (let j = 0, o = 0; j < NZ; j++) { if (j % 80 === 79) await ctx.yield(); for (let i = 0; i < NX; i++) { const a = j * (NX + 1) + i, b = a + 1, c = a + NX + 1, d = c + 1; gidx[o++] = a; gidx[o++] = b; gidx[o++] = c; gidx[o++] = b; gidx[o++] = d; gidx[o++] = c; } }
    await ctx.yield();
    const ggeo = new THREE.BufferGeometry();
    ggeo.setAttribute('position', new THREE.BufferAttribute(gpos, 3)); ggeo.setAttribute('normal', new THREE.BufferAttribute(gnor, 3)); ggeo.setIndex(new THREE.BufferAttribute(gidx, 1));
    await ctx.yield();
    const heightAt = (x, z) => {   // bilinear lookup of the built field
      const fi = Math.min(NX - 1e-3, Math.max(0, (x - X0) / dx)), fj = Math.min(NZ - 1e-3, Math.max(0, (Z0 - z) / dz)), i = fi | 0, j = fj | 0, a = j * (NX + 1) + i;
      return lerp(lerp(H[a], H[a + 1], fi - i), lerp(H[a + NX + 1], H[a + NX + 2], fi - i), fj - j);
    };
    // the strips are cut into fields by cross hedges; each field has its crop: 0 straw stubble, 1 wet plough, 2 green winter corn
    const FIELD_L = 118, stripOff = (cell) => { const f = cell * 0.37; return (f - Math.floor(f)) * FIELD_L; };
    const sxOf = (x, z) => x + 8 * Math.sin(z * 0.0055) + 3 * Math.sin(z * 0.019);
    const cropData = new Uint8Array(32 * 16 * 4), cropAt = (cell, zi) => cropData[(Math.max(0, Math.min(15, zi)) * 32 + Math.max(0, Math.min(31, cell + 16))) * 4];
    for (let zi = 0; zi < 16; zi++) for (let ci = 0; ci < 32; ci++) {
      const cell = ci - 16, hsh = (k) => { const v = Math.sin(cell * 12.9898 + zi * 78.233 + k * 37.719) * 43758.5453; return v - Math.floor(v); };
      let crop = ((cell % 2) + 2) % 2;                                         // straw and plough alternate down the valley, as before
      if (hsh(1) < 0.2) crop = 1 - crop; if (hsh(2) < 0.2) crop = 2;
      if (cell >= -2 && cell <= 0 && zi <= 4) crop = 0;                        // the last fields before the farm are pale stubble
      const o = (zi * 32 + ci) * 4; cropData[o] = crop; cropData[o + 1] = Math.floor(hsh(3) * 255); cropData[o + 2] = Math.floor(hsh(4) * 255); cropData[o + 3] = 255;
    }
    const cropTex = new THREE.DataTexture(cropData, 32, 16, THREE.RGBAFormat, THREE.UnsignedByteType); cropTex.magFilter = cropTex.minFilter = THREE.NearestFilter; cropTex.generateMipmaps = false; cropTex.needsUpdate = true;
    const fieldOf = (x, z) => { const q = sxOf(x, z) / 24, cell = Math.floor(q), zc = (z + 900 + stripOff(cell)) / FIELD_L, zi = Math.floor(zc); return { cell, zi, fx: q - cell, fz: zc - zi, crop: cropAt(cell, zi) }; };
    const groundMat = new THREE.ShaderMaterial({
      name: 'ra-ground', uniforms: { ...shared, uBird: { value: new THREE.Vector4(0, 0, 3, 0) }, uFalc: { value: new THREE.Vector4(0, 0, 1.6, 0) }, uFire: { value: new THREE.Vector3(0, 0, 0) }, uMist: { value: LOOK.mist }, uCrop: { value: cropTex } },
      vertexShader: 'varying vec3 vW, vN; void main(){ vN = normal; vW = position; gl_Position = projectionMatrix * viewMatrix * vec4(position, 1.); }',
      fragmentShader: GLSL_COMMON + /* glsl */`
        uniform vec4 uBird, uFalc; uniform vec3 uFire; uniform float uMist; uniform sampler2D uCrop; varying vec3 vW, vN;
        float riverX(float z){ return -118. + 34. * sin(z * 0.0105 + 1.3) + 14. * sin(z * 0.027); }
        void main(){
          vec3 n = normalize(vN + vec3(0., 1e-5, 0.)); vec3 V = cameraPosition - vW; float dist = length(V); V /= max(dist, 1e-4);
          // strip fields running down the valley: straw stubble and wet plough, 18 to 30 m wide
          float sx = vW.x + 8. * sin(vW.z * 0.0055) + 3. * sin(vW.z * 0.019), q = sx / 24., cell = floor(q), fx = fract(q);
          float hs = hash21(vec2(cell, 3.7)), h2 = hash21(vec2(cell, 9.1)), fw = fwidth(q) + 1e-5;
          float zc = (vW.z + 900. + fract(cell * 0.37) * 118.) / 118., zi = floor(zc), fz = fract(zc);
          vec4 crop = texture2D(uCrop, (vec2(clamp(cell + 16., 0., 31.), clamp(zi, 0., 15.)) + 0.5) / vec2(32., 16.));
          hs = crop.g; h2 = crop.b;
          float cropK = crop.r * 255., plough = step(0.5, cropK) * (1. - step(1.5, cropK)), green = step(1.5, cropK);
          float rw = sx * 7. + 0.9 * vnoise(vW.xz * 0.35), rowsF = clamp(1. - fwidth(rw) * 0.45, 0., 1.), rows = (0.5 + 0.5 * sin(rw)) * rowsF + 0.5 * (1. - rowsF);
          float fineF = clamp(1.25 - dist * 0.0045, 0., 1.), midF = clamp(1.5 - dist * 0.0021, 0., 1.);
          // the combine's swaths, 6 m apart, and the straw lying along them: these carry to the village and beyond
          float sw = sx * 1.0472 + 0.7 * vnoise(vW.xz * 0.07), swF = clamp(1. - fwidth(sw) * 0.55, 0., 1.), swath = (smoothstep(-0.55, 0.55, sin(sw)) - 0.5) * swF;
          float mid = mix(0.5, vnoise(vec2(sx * 1.1, vW.z * 0.5)) * 0.55 + vnoise(vec2(sx * 3.1, vW.z * 1.5 + 7.)) * 0.45, midF);
          float fine = mix(0.5, vnoise(vec2(sx * 15., vW.z * 8.)) * 0.55 + vnoise(vec2(sx * 41., vW.z * 27.)) * 0.45, fineF);
          rows = mix(0.5, rows, 0.35 + 0.65 * vnoise(vec2(sx * 2.3, vW.z * 1.1)));   // the drill rows come and go: straw lies over them
          float blot = vnoise(vW.xz * 0.045) * 0.6 + vnoise(vW.xz * 0.19) * 0.4, lay = vnoise(vec2(sx * 0.5, vW.z * 0.14));
          vec3 straw = mix(vec3(0.74, 0.56, 0.2), vec3(0.68, 0.6, 0.33), h2) * (0.58 + 0.3 * rows + 0.36 * fine) * (0.86 + 0.24 * hs) * (0.85 + 0.3 * lay) * (1. + 0.34 * swath) * (0.72 + 0.56 * mid);
          vec3 umber = mix(vec3(0.11, 0.058, 0.03), vec3(0.14, 0.075, 0.04), h2) * (0.5 + 0.7 * rows + 0.55 * fine) * (0.8 + 0.5 * hs) * (1. + 0.5 * swath) * (0.6 + 0.8 * mid);
          vec3 corn = mix(vec3(0.1, 0.19, 0.05), vec3(0.17, 0.24, 0.07), h2) * (0.62 + 0.5 * rows + 0.3 * fine) * (0.75 + 0.5 * mid);   // young winter corn in its drills
          // under the low run the eye is close enough to see stalks and clods: short, even-grained texture that does not stretch
          float nearF = clamp(1.25 - dist * 0.02, 0., 1.), tuft = vnoise(vW.xz * 2.1) * 0.45 + vnoise(vW.xz * 5.3 + 3.) * 0.33 + vnoise(vW.xz * 13. + 9.) * 0.22;
          straw *= mix(1., 0.6 + 0.85 * tuft, nearF); umber *= mix(1., 0.5 + 1.05 * tuft, nearF); corn *= mix(1., 0.7 + 0.6 * tuft, nearF);
          vec3 alb = mix(mix(straw, umber, plough), corn, green) * (0.8 + 0.4 * blot);
          // cross hedges: hawthorn gone rust and dark green, ragged, with a grass headland either side
          float hz = min(fz, 1. - fz) * 118., hn = vnoise(vec2(sx * 0.33, zi * 7.)) * 0.6 + vnoise(vec2(sx * 1.3, zi * 3.)) * 0.4, hfw = fwidth(vW.z);   // the pixel's width along the valley, from the continuous coordinate (zc carries each strip's own offset and jumps at a baulk)
          float headland = 1. - smoothstep(3.4, 5.2 + hfw, hz), hedge = (1. - smoothstep(0.9 + 1.5 * hn, 1.6 + 1.9 * hn + hfw, hz)) * step(0.16, hn);   // an old laid hedge is 2 to 5 m through
          float hedgeL = 2.4 * uSunDir.z / max(uSunDir.y, 0.15), hedgeSh = (1. - smoothstep(hedgeL * 0.6, hedgeL + 1.6 + hfw, (1. - fz) * 118.)) * step(0.16, hn);   // 2.4 m high: its shadow lies down-valley of it, long in a low sun
          float hk = max(smoothstep(-420., -340., vW.z), smoothstep(45., 70., abs(vW.x))); headland *= hk; hedge *= hk; hedgeSh *= hk * (1. - hedge);   // none under our low run to the farm: paint is not a hedge from ten metres
          alb = mix(alb, vec3(0.12, 0.13, 0.05) * (0.6 + 0.8 * fine), headland * 0.75);
          alb = mix(alb, mix(vec3(0.03, 0.05, 0.025), vec3(0.11, 0.065, 0.025), smoothstep(0.5, 0.75, vnoise(vec2(sx * 0.21, zi * 5. + 2.)))) * (0.5 + 1.0 * vnoise(vW.xz * 0.9)) * mix(0.65, 1.9, step(fz, 0.5)), hedge);   // its sunward half is lit, the other in its own shade
          float tram = (1. - smoothstep(0.012, 0.03, abs(fract(q * 4. + 0.5) - 0.5))) * clamp(1. - fw * 14., 0., 1.); alb *= 1. - 0.22 * tram * (1. - plough);   // wheel lines in the stubble
          float baulk = 1. - smoothstep(0.012, 0.03 + fw, min(fx, 1. - fx)); alb = mix(alb, vec3(0.085, 0.1, 0.04) * (0.6 + 0.8 * fine), baulk * 0.85);
          // about half the baulks between the strips carry a hedge down the valley, 2 to 4 m through, gapped where a gate is:
          // long ragged lines that run to the farm, each lit on its sunward side and laying its shadow on the strip beside it
          float bi = floor(q + 0.5), bx = (q - bi) * 24., bn = vnoise(vec2(bi * 3.7, vW.z * 0.21)) * 0.6 + vnoise(vec2(bi * 9.1, vW.z * 0.9)) * 0.4;
          float lineK = step(0.45, hash21(vec2(bi, 5.3))) * smoothstep(0.2, 0.3, vnoise(vec2(bi * 5.1, vW.z * 0.017))) * hk * (1. - smoothstep(140., 165., abs(vW.x)));
          float sgn = uSunDir.x > 0. ? 1. : -1., lineL = 2.4 * abs(uSunDir.x) / max(uSunDir.y, 0.15);
          float lhedge = (1. - smoothstep(0.7 + 1.1 * bn, 1.2 + 1.4 * bn + fw * 24., abs(bx))) * lineK;
          float lsh = (1. - smoothstep(lineL * 0.6, lineL + 1.4 + fw * 24., -bx * sgn)) * step(0., -bx * sgn) * lineK * (1. - lhedge);
          alb = mix(alb, mix(vec3(0.03, 0.05, 0.025), vec3(0.11, 0.065, 0.025), smoothstep(0.5, 0.75, vnoise(vec2(bi * 2.1, vW.z * 0.21 + 2.)))) * (0.5 + 1.0 * vnoise(vW.xz * 0.9)) * mix(0.65, 1.9, step(0., bx * sgn)), lhedge);
          hedgeSh = max(hedgeSh, lsh);
          float moorN = vnoise(vW.xz * 0.02), moorF = vnoise(vW.xz * 0.11) * 0.6 + vnoise(vW.xz * 0.47) * 0.4;
          float moor = max(smoothstep(150., 205., abs(vW.x) + 30. * moorN - 15.), max(smoothstep(705., 760., -vW.z), smoothstep(40., 120., vW.z)));
          // heather in dark plum-blue beds, bracken in rust tongues running down the slope, bleached moor grass on the knolls, grey rock where it is steep
          vec2 mq = vW.xz + 9. * vec2(vnoise(vW.xz * 0.05 + 3.), vnoise(vW.xz * 0.05 + 8.));
          float mA = vnoise(mq * 0.07) * 0.55 + vnoise(mq * 0.23 + 4.) * 0.3 + vnoise(mq * 0.9) * 0.15, mB = vnoise(mq * 0.35 + 1.) * 0.6 + vnoise(mq * 1.4 + 6.) * 0.4 * midF + 0.2 * (1. - midF);
          vec3 heath = mix(vec3(0.075, 0.06, 0.105), vec3(0.235, 0.115, 0.04), smoothstep(0.47, 0.53, mA + 0.25 * (moorF - 0.5)));
          heath = mix(heath, vec3(0.3, 0.27, 0.14), smoothstep(0.6, 0.66, vnoise(mq * 0.055 + 5.) + 0.2 * (mB - 0.5)) * 0.85);
          heath = mix(heath, vec3(0.2, 0.2, 0.2), (1. - smoothstep(0.8, 0.86, n.y + 0.08 * (mB - 0.5))) * smoothstep(0.55, 0.7, mB) * 0.9);
          heath *= (0.55 + 0.9 * mB) * (0.8 + 0.4 * vnoise(vW.xz * 2.1) * fineF + 0.2 * (1. - fineF));
          // relief: the low sun rakes the tussocks and gullies
          float e0 = vnoise(mq * 0.11) * 0.6 + vnoise(mq * 0.37) * 0.4, ex = vnoise((mq + vec2(1.5, 0.)) * 0.11) * 0.6 + vnoise((mq + vec2(1.5, 0.)) * 0.37) * 0.4, ez = vnoise((mq + vec2(0., 1.5)) * 0.11) * 0.6 + vnoise((mq + vec2(0., 1.5)) * 0.37) * 0.4;
          n = normalize(n + moor * midF * 1.5 * vec3(e0 - ex, 0., e0 - ez));
          alb = mix(alb, heath, moor);
          float yard = 1. - smoothstep(4., 20., length(max(abs(vW.xz - vec2(0., -655.)) - vec2(13., 29.), 0.)) + 6. * blot);
          alb = mix(alb, vec3(0.1, 0.085, 0.05) * (0.6 + 0.8 * fine), yard * 0.85);
          // the cart track from the wood to the hay door: two pale ruts, grass between; and the barn stands in nettles and its own damp shade
          float tx = -2.4 * smoothstep(-622., -585., vW.z), trk = smoothstep(-627., -623., vW.z) * (1. - smoothstep(-582., -572., vW.z));
          float rut = (1. - smoothstep(0.3, 0.75, abs(abs(vW.x - tx) - 1.25))) * trk; alb = mix(alb, vec3(0.3, 0.24, 0.15) * (0.6 + 0.7 * fine), rut * 0.8);
          alb = mix(alb, vec3(0.1, 0.13, 0.05) * (0.6 + 0.8 * fine), (1. - smoothstep(0.2, 0.7, abs(vW.x - tx))) * trk * 0.6);
          float bdist = length(max(abs(vW.xz - vec2(0., -654.8)) - vec2(12., 27.2), 0.));
          alb = mix(alb, vec3(0.05, 0.085, 0.03) * (0.5 + 1.0 * fine), (1. - smoothstep(1.2, 3.6 + 2.5 * blot, bdist)) * 0.85);
          alb *= 0.35 + 0.65 * smoothstep(0., 2.6, bdist);
          float rv = abs(vW.x - riverX(vW.z)), river = (1. - smoothstep(7.5, 9.5, rv)) * (1. - smoothstep(690., 740., -vW.z));
          float bank = (1. - smoothstep(9., 16., rv + 4. * blot)) * 0.8 * (1. - moor);
          alb = mix(alb, vec3(0.07, 0.11, 0.045) * (0.6 + 0.8 * fine), bank);   // the green bank
          float rip = vnoise(vec2(vW.x * 0.6, vW.z * 0.16 - uTime * 0.9)) * 0.6 + vnoise(vec2(vW.x * 1.9, vW.z * 0.5 - uTime * 1.7)) * 0.4;
          float fres = 1. - max(V.y, 0.); fres *= fres;
          alb = mix(alb, mix(vec3(0.07, 0.12, 0.2), vec3(0.8, 0.9, 1.0), fres) * (0.8 + 0.5 * rip), river);
          float fire = 1. - smoothstep(4., 16., distance(vW.xz, uFire.xy)); alb = mix(alb, vec3(0.012), fire * uFire.z);   // burnt stubble
          vec2 wq = vW.xz - vec2(0., -535.5);
          float wood = (1. - smoothstep(168., 180., abs(wq.x))) * (1. - smoothstep(30., 37., abs(wq.y))) * (1. - river);
          vec2 wq2 = wq + uSunDir.xz * 14.; float woodSh = 0.6 * (1. - smoothstep(165., 185., abs(wq2.x))) * (1. - smoothstep(33., 46., abs(wq2.y)));
          // the wood's floor: rust needle litter and moss, and pools of sun where the canopy lets it down
          float litter = vnoise(vW.xz * 0.31 + 5.) * 0.6 + vnoise(vW.xz * 1.3) * 0.4, pool = smoothstep(0.5, 0.68, vnoise(vW.xz * 0.19 + 11.) * 0.62 + vnoise(vW.xz * 0.53 + 3.) * 0.38);
          alb = mix(alb, mix(vec3(0.085, 0.06, 0.035), mix(vec3(0.2, 0.115, 0.045), vec3(0.09, 0.12, 0.04), smoothstep(0.55, 0.75, litter)), 0.75) * (0.6 + 0.8 * fine), wood * 0.9);
          // a hedge's shadow lies only where a hedge stands: the moor, the yard, the river and its bank and the wood's floor
          // are painted over the hedges above, each by its own share, and take the same share of the shadow
          hedgeSh *= (1. - moor) * (1. - 0.85 * yard) * (1. - bank) * (1. - river) * (1. - 0.9 * wood);
          float cs = cloudSun(vW.xz), sh = (0.15 + 0.85 * cs) * (1. - max(wood * (0.8 - 0.62 * pool), 0.72 * woodSh)) * (1. - 0.62 * hedgeSh), bs = 1.;
          // our own shadow, bird-shaped: two swept wings that open and close on the beat, a body, a tail
          vec2 bd = (vW.xz - uBird.xy) / 2.3; float wsp = uBird.z / 3.1;
          float bsh = max(1. - smoothstep(0.7, 1., length(vec2(bd.x / wsp, (bd.y - 0.3 * abs(bd.x) + 0.05) * 3.4))), 1. - smoothstep(0.7, 1., length(vec2(bd.x * 5., (bd.y - 0.12) * 1.7))));
          bs *= 1. - uBird.w * bsh;
          bs *= 1. - uFalc.w * (1. - smoothstep(0.5, 1., length((vW.xz - uFalc.xy) / uFalc.z)));
          float furrow = (rows - 0.5) * rowsF * fineF * 0.5;                                    // the rows catch the low sun
          float ndl = max(dot(n, uSunDir) + furrow * uSunDir.x + 0.17 * swath * (1. - moor), 0.);   // the swaths and the plough's lands are low ridges: the low sun picks out one flank of each
          ndl = mix(ndl, smoothstep(0.02, 0.5, ndl) * 1.05, 0.6 * moor);                                                          // harder modelling on the moor: lit knolls, shadowed gullies
          vec3 skyL = uSkyCol * (0.75 + 0.25 * n.y) * mix(vec3(1., 1., 1.12), vec3(1.05, 0.9, 0.8), plough * (1. - moor)) * mix(mix(vec3(0.86, 0.9, 1.22), vec3(0.98, 0.92, 1.04), plough * (1. - moor)), vec3(1.), cs);   // a cloud's shadow is blue-violet
          vec3 c = alb * (uSunCol * ndl * sh * bs + skyL * (0.45 + 0.55 * bs) * mix(vec3(0.62, 0.72, 1.25), vec3(1.), bs));
          c += mix(uSkyCol, vec3(dot(uSkyCol, vec3(0.3333))), 0.6) * 0.6 * fres * fres * fres * plough * (0.25 + 0.75 * rows) * (0.55 + 0.5 * mid) * (0.2 + 0.8 * cs) * (1. - moor) * (1. - river) * (1. - wood);   // wet plough glistens where it faces the sky
          vec3 hv = normalize(V + uSunDir + vec3(0., 1e-4, 0.)); float sp = max(hv.y, 0.); sp *= sp; sp *= sp; sp *= sp; sp *= sp;
          c += (uSunCol * (0.3 + 0.5 * sp) + uSkyCol * 1.4 * fres) * river * rip * rip * sh;
          float wisp = smoothstep(0.3, 0.75, vnoise(vW.xz * vec2(0.05, 0.016) + vec2(0., uTime * 0.05)) * 0.6 + vnoise(vW.xz * vec2(0.13, 0.04) - vec2(0., uTime * 0.08)) * 0.4);
          float mist = (1. - smoothstep(0.5, 7., vW.y)) * max((1. - smoothstep(8., 34., rv)) * wisp * 0.75 * (1. - 0.5 * max(V.y, 0.)), 0.22 * (0.3 + 0.5 * wisp) * smoothstep(-470., -500., vW.z) * smoothstep(-585., -560., vW.z));
          c = mix(c, vec3(0.7, 0.78, 0.85), mist * uMist);
          gl_FragColor = vec4(foggedDir(c, dist, V), 1.);
        }`,
    });
    const ground = new THREE.Mesh(ggeo, groundMat); ground.name = 'ra-ground'; ground.frustumCulled = false; root.add(ground);
    // far blue moor all round, low: 2 degrees from the loft. Its skyline stands where it stood (so the sky the white point
    // lives in is the same sky); below the skyline it is a hillside that falls TOWARD the valley: the foot lies 100 m nearer
    // to us than the skyline (0.86 and 0.93 of the radius), so the face we see leans back, its normals point up and in to
    // the valley, and the sun lights the flank that faces it and leaves the flank under it in shade. Spurs and combes 300 m
    // apart that the sun models, bracken and heather in beds, scree under the edge, the foot sunk in the haze
    {
      const N = 192, ROWS = 5, W = (N + 1) * (ROWS + 1), rp = new Float32Array(W * 3), rc = new Float32Array(W * 3), ri = [];
      for (let i = 0; i <= N; i++) {
        const a = i / N * Math.PI * 2, sa = Math.sin(a), ca = Math.cos(a), h = 62 + 30 * noise.fbm2(sa * 2.2, ca * 2.2, 3);
        const spur = noise.fbm2(sa * 15 + 4, ca * 15, 3), bed = noise.fbm2(sa * 31 + 9, ca * 31, 2);          // a spur every 300 m of the ring, beds a third of that
        for (let r = 0; r <= ROWS; r++) {
          const v = r / ROWS, k = (i * (ROWS + 1) + r) * 3;
          // the slope runs down 100 m toward us from the skyline (0.93 of the radius) to its foot (0.86); spurs push the middle of it up to 45 m nearer still
          const rad = 1450 * (0.93 - 0.07 * (1 - v)) - 45 * spur * Math.sin(Math.PI * Math.min(1, v * 1.15)) * (0.4 + 0.6 * v);
          rp[k] = sa * rad; rp[k + 1] = -30 + (h + 30) * (v * (1.6 - 0.6 * v)); rp[k + 2] = -300 + ca * rad;
          const t = sst(0.25, 0.8, 0.5 + 0.5 * bed + 0.25 * (v - 0.5)), top = sst(0.75, 1, v);
          rc[k] = lerp(0.2, 0.075, t) * (1 - 0.3 * top); rc[k + 1] = lerp(0.14, 0.085, t) * (1 - 0.25 * top); rc[k + 2] = lerp(0.07, 0.15, t) * (1 - 0.1 * top);   // bracken rust to heather blue; the edge itself darker
          if (i < N && r < ROWS) { const o = i * (ROWS + 1) + r, o2 = o + ROWS + 1; ri.push(o, o + 1, o2, o + 1, o2 + 1, o2); }
        }
        if (i % 48 === 47) await ctx.yield();
      }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(rp, 3)); g.setAttribute('color', new THREE.BufferAttribute(rc, 3)); g.setIndex(ri); g.computeVertexNormals();
      // its own surface: the valley's haze lies low, so the foot of the far hill is sunk in it and the skyline stands clear
      // of it (a third of the haze at 60 m up); cloud shadows cross it as they cross the fields
      const ridgeMat = new THREE.ShaderMaterial({ name: 'ra-ridge', side: THREE.DoubleSide, vertexColors: true, uniforms: { ...shared },
        vertexShader: 'varying vec3 vW, vN, vC; void main(){ vW = position; vN = normal; vC = color; gl_Position = projectionMatrix * viewMatrix * vec4(position, 1.); }',
        fragmentShader: GLSL_COMMON + /* glsl */`
          varying vec3 vW, vN, vC;
          void main(){
            vec3 n = normalize(vN + vec3(0., 1e-5, 0.));   // as built: up and in toward the valley (no flip)
            vec3 V = cameraPosition - vW; float dist = length(V); V /= max(dist, 1e-4);
            float tex = vnoise(vW.xz * 0.02 + vW.y * 0.05) * 0.6 + vnoise(vW.xz * 0.07 + vW.y * 0.13) * 0.4;
            float ndl = smoothstep(-0.05, 0.75, dot(n, uSunDir)) * (0.3 + 0.7 * cloudSoft(vW.xz * 0.4));
            vec3 c = vC * (0.65 + 0.7 * tex) * (uSunCol * ndl * 1.5 + uSkyCol * (0.7 + 0.3 * n.y));
            float hz = uFogK * dist * mix(1., 0.33, smoothstep(-30., 60., vW.y));
            gl_FragColor = vec4(mix(fogColDir(V), c, exp(-hz)), 1.);
          }` });
      const m = new THREE.Mesh(g, ridgeMat); m.frustumCulled = false; m.name = 'ra-ridge'; root.add(m);
    }
    await ctx.yield();

    // ---- the village on the spur: 34 slate-roofed stone houses, five chimneys smoking
    const vr = rng.fork('village'), houses = [], prism = (w, h, d) => { const s = new THREE.Shape(); s.moveTo(-w / 2, 0); s.lineTo(w / 2, 0); s.lineTo(0, h); s.closePath(); return new THREE.ExtrudeGeometry(s, { depth: d, bevelEnabled: false }).translate(0, 0, -d / 2); };
    const chimneys = [], pAt = new THREE.Vector3();
    path.pointAt(0.485, pAt);                                                   // where the frame goes white: the hero plume is exactly here
    const LEAN = new THREE.Vector2(-0.5, 0.12);                                // the smoke leans across the valley, clear of our line as B sees it
    const heroTop = new THREE.Vector3(pAt.x - LEAN.x * 8.5, pAt.y - 8.5, pAt.z - LEAN.y * 8.5);
    if (heroHouse) {   // an ordinary house under the hero plume: find where its chimney must stand for the leaning smoke to cross our path
      let dy = 16;
      for (let it = 0; it < 4; it++) dy = pAt.y - (heightAt(pAt.x - LEAN.x * dy + 2.2, pAt.z - LEAN.y * dy) - 0.5 + 5.6 + 4.5);
      heroTop.set(pAt.x - LEAN.x * dy, pAt.y - dy, pAt.z - LEAN.y * dy);
    }
    for (let i = 0; i < 34; i++) {
      let x, z, tries = 0;
      do { x = (i === 0 && heroHouse) ? heroTop.x + 2.2 : vr.range(-70, 150); z = (i === 0 && heroHouse) ? heroTop.z : vr.range(-360, -236); tries++; }
      while (i > 0 && tries < 20 && (houses.some((h) => Math.hypot(h.x - x, h.z - z) < 13) || Math.hypot(x - heroTop.x, z - heroTop.z) < 16));
      const w0 = vr.range(6, 9), d0 = vr.range(8, 13), w = (i === 0 && heroHouse) ? 9 : w0, d = (i === 0 && heroHouse) ? 13 : d0, hgt = (i === 0 && heroHouse) ? heroTop.y - 4 - heightAt(x, z) : vr.range(4, 6.2), ry = vr.pick([0, Math.PI / 2]) + vr.range(-0.15, 0.15), gy = heightAt(x, z) - 0.5;
      houses.push({ x, z, w, d, hgt });
      // grey rubble, warm sandstone, and a few limewashed: a village, not a row of one stone (the house under the hero plume is a white one)
      const tone = new THREE.Color(['#CDC6B5', '#8D8B86', '#A89A80', '#8D8B86', '#B9AE98', '#97907F'][(i * 5) % 6]).multiplyScalar(vr.range(0.8, 1.1)), parts = [];
      parts.push(paint(new THREE.BoxGeometry(w, hgt + 0.5, d).translate(0, (hgt + 0.5) / 2, 0), tone, 4));
      parts.push(paint(prism(w + 0.8, 3.2 * w / 7.5, d + 0.8).translate(0, hgt + 0.5, 0), '#666A70', 3));
      const cz = (i === 0 && heroHouse) ? 0 : d * 0.3, apex = hgt + 0.5 + 3.2 * w / 7.5;
      parts.push(paint(new THREE.BoxGeometry(0.42, 0.26, d + 1.0).translate(0, apex, 0), '#3E4046'));                                                  // ridge tiles
      for (const pz of [-0.26, 0.26]) parts.push(paint(new THREE.CylinderGeometry(0.17, 0.21, 0.55, 7).translate(-2.2, hgt + 4.82, cz + pz), '#B39A74'));   // chimney pots
      parts.push(paint(new THREE.BoxGeometry(w + 0.5, 0.5, d + 0.5).translate(0, 0.2, 0), '#5F5C57', 4));                                             // a damp footing
      parts.push(paint(new THREE.BoxGeometry(1.1, 2.6, 1.1).translate(-2.2, hgt + 3.2, cz), '#6E655B', 4), paint(new THREE.BoxGeometry(1.35, 0.25, 1.35).translate(-2.2, hgt + 4.45, cz), '#4A443D'));
      for (const sd of [-1, 1]) { for (const wz of [-0.28, 0.28]) parts.push(paint(new THREE.BoxGeometry(0.12, 1.3, 1.0).translate(sd * w / 2, hgt * 0.55, wz * d), '#14171C'), paint(new THREE.BoxGeometry(0.16, 0.22, 1.3).translate(sd * w / 2, hgt * 0.55 + 0.76, wz * d), '#C9C0B0')); }
      parts.push(paint(new THREE.BoxGeometry(1.2, 2.3, 0.12).translate(0.6, 1.6, d / 2), '#2A1E15', 5));
      const hg = merge(parts); hg.rotateY((i === 0 && heroHouse) ? 0 : ry); hg.translate(x, gy, z); houses[i].g = hg;
      if (i < 5) chimneys.push((i === 0 && heroHouse) ? heroTop.clone() : new THREE.Vector3(-2.2, gy + hgt + 4.5, d * 0.3).applyAxisAngle(new THREE.Vector3(0, 1, 0), ry).add(new THREE.Vector3(x, 0, z)).setY(gy + hgt + 4.5));
      if (i % 3 === 2) await ctx.yield();
    }
    await ctx.yield();
    // the low sun lays each house's shadow down the valley: soft dark quads draped on the ground
    const TREES = [[-29, DOOR_Z - 9, 23], [27, DOOR_Z - 24, 27], [-36, DOOR_Z - 40, 19]];
    const FARM_SH = [{ x: 0, z: DOOR_Z - 27, w: 24, d: 54, hgt: 19 }, ...TREES.map(([x, z, H]) => ({ x, z, w: H * 0.55, d: H * 0.55, hgt: H * 0.72 }))];
    { const sp = [], su = [], si = [], sd = new THREE.Vector2(-sunDir.x, -sunDir.z).normalize(), NS = 6;
      for (const h of houses.concat(FARM_SH)) {
        const L = (h.hgt + 2.6) / Math.tan(el), foot = Math.sqrt(h.w * h.d), hwid = foot * 0.56, s0 = -0.3 * foot, s1 = L + 0.35 * foot;
        for (let a = 0; a <= NS; a++) for (let b = 0; b <= 2; b++) {
          const ss = lerp(s0, s1, a / NS), tt = (b - 1) * hwid, x = h.x + sd.x * ss - sd.y * tt, z = h.z + sd.y * ss + sd.x * tt;
          sp.push(x, heightAt(x, z) + 0.22, z); su.push(a / NS, b / 2);
        }
        const o = sp.length / 3 - (NS + 1) * 3;
        for (let a = 0; a < NS; a++) for (let b = 0; b < 2; b++) { const i0 = o + a * 3 + b; si.push(i0, i0 + 1, i0 + 3, i0 + 1, i0 + 4, i0 + 3); }
      }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(sp), 3)); g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(su), 2)); g.setIndex(si);
      const m = new THREE.Mesh(g, new THREE.ShaderMaterial({ name: 'ra-shadow', transparent: true, depthWrite: false, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2, uniforms: { ...shared },
        vertexShader: 'varying vec2 vUv; varying vec3 vW; void main(){ vUv = uv; vW = position; gl_Position = projectionMatrix * viewMatrix * vec4(position, 1.); }',
        fragmentShader: GLSL_COMMON + /* glsl */`
          varying vec2 vUv; varying vec3 vW;
          void main(){
            float a = smoothstep(0., 0.06, vUv.x) * (1. - smoothstep(0.78, 1., vUv.x)) * smoothstep(0., 0.14, vUv.y) * (1. - smoothstep(0.86, 1., vUv.y));
            a *= 0.66 * cloudSun(vW.xz) * exp(-uFogK * distance(vW, cameraPosition));
            gl_FragColor = vec4(0.035, 0.042, 0.085, a);
          }` }));
      m.name = 'ra-house-shadows'; m.frustumCulled = false; m.renderOrder = 5; root.add(m); }
    await ctx.yield();
    const village = new THREE.Mesh(merge(houses.map((h) => h.g)), litMat(shared, { name: '-village', cloud: 1, amb: 0.9 })); village.name = 'ra-village'; root.add(village);
    await ctx.yield();

    // ---- round straw bales standing in rows on the stubble, each with its long blue shadow: they give the fields their scale
    { let sd = 5171; const rnd = () => (sd = (sd * 16807) % 2147483647) / 2147483647, list = [];
      const baled = FIELD_STACKS ? new Set() : null;   // flight4: the fields in which this loop keeps a bale (no draw of rnd is added)
      for (let cell = -6; cell <= 6; cell++) for (let zi = 0; zi <= 9; zi++) {
        const keep = rnd() <= 0.62 || (cell >= -2 && cell <= 0 && zi <= 4); if (cropAt(cell, zi) !== 0 || !keep) continue;
        const z0 = zi * FIELD_L - 900 - stripOff(cell), step = 15 + 6 * rnd();
        for (const fx of [0.27, 0.73]) for (let zz = z0 + 9 + step * rnd(); zz < z0 + FIELD_L - 9; zz += step * (0.8 + 0.4 * rnd())) {
          const x = (cell + fx) * 24 - 8 * Math.sin(zz * 0.0055) - 3 * Math.sin(zz * 0.019) + 2 * (rnd() - 0.5), yaw = 0.5 * (rnd() - 0.5);
          if (zz > 190 || zz < -622 || Math.abs(x) > 142 || (zz < -494 && zz > -578) || Math.abs(x - riverX(zz)) < 17) continue;
          if (houses.some((h) => Math.hypot(h.x - x, h.z - zz) < 13) || path.nearestXZ(x, zz).dist < 4) continue;
          if (baled) baled.add((cell + 6) * 16 + zi);
          if (detail < 0.8 && list.length % 5 > 2 && zz > -380) continue;                 // phones: three in five of the far ones
          list.push([x, heightAt(x, zz), zz, 1 + 0.8 * sst(-430, -560, zz), yaw]);
        }
      }
      await ctx.yield();
      const bg = paint(new THREE.CylinderGeometry(1, 1, 1.5, 14, 1).rotateZ(Math.PI / 2).translate(0, 0.92, 0), '#C9B274', 8);
      const bales = new THREE.InstancedMesh(bg, litMat(shared, { name: '-bales', cloud: 1, amb: 1.1 }), Math.max(1, list.length));
      const shGeo = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), shMat = new THREE.ShaderMaterial({ name: 'ra-bale-shadow', transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2, uniforms: { ...shared },
        vertexShader: 'varying vec2 vUv; varying vec3 vW; void main(){ vUv = uv; vec4 w = instanceMatrix * vec4(position, 1.); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }',
        fragmentShader: GLSL_COMMON + /* glsl */`
          varying vec2 vUv; varying vec3 vW;
          void main(){
            vec2 q = vUv * 2. - 1.; float a = (1. - smoothstep(0.55, 1., abs(q.x))) * (1. - smoothstep(0.6, 1., abs(q.y)));
            a *= 0.7 * cloudSun(vW.xz) * exp(-uFogK * 2. * distance(vW, cameraPosition));
            gl_FragColor = vec4(0.03, 0.04, 0.11, a);
          }` });
      const bsh = new THREE.InstancedMesh(shGeo, shMat, Math.max(1, list.length));
      const M = new THREE.Matrix4(), q = new THREE.Quaternion(), e3 = new THREE.Euler(), pp = new THREE.Vector3(), ss = new THREE.Vector3(), sdir = new THREE.Vector2(-sunDir.x, -sunDir.z).normalize(), sAng = Math.atan2(sdir.x, sdir.y);
      list.forEach(([x, y, z, sc, yaw], i) => {
        e3.set(0, yaw, 0); q.setFromEuler(e3); pp.set(x, y - 0.1 * sc, z); ss.set(sc, sc, sc); M.compose(pp, q, ss); bales.setMatrixAt(i, M);
        const L = Math.min(9, 1.9 / Math.tan(el)) * sc, cx = x + sdir.x * L * 0.5, cz = z + sdir.y * L * 0.5;
        e3.set(0, sAng, 0); q.setFromEuler(e3); pp.set(cx, heightAt(cx, cz) + 0.2, cz); ss.set(2.3 * sc, 1, L + 2.2 * sc); M.compose(pp, q, ss); bsh.setMatrixAt(i, M);
      });
      bales.count = bsh.count = list.length; bales.name = 'ra-bales'; bsh.name = 'ra-bale-shadows'; bales.frustumCulled = bsh.frustumCulled = false; bsh.renderOrder = 5; root.add(bales, bsh);
      // flight4, THING FOUR: the harvest stands in stacks. In every field in which the loop above keeps a bale, and whose foot
      // lies up-valley of the spruce wood (z > -494, the wood's own upper bound above), a stack stands on the headland at the
      // field's farm-ward end, 6 m inside the cross hedge (z0 + 6), in the 9 m the rows leave: three tiers of 9, 8 and 7 of
      // the same bales at the bales' own scale for that z, the row across the strip, slid toward one baulk by a hash of
      // (strip, field) as far as leaves 0.8 m of baulk. The whole row keeps the bales' bounds: 142 m from the valley's
      // axis, 17 m from the river, 13 m from a house's middle. It never reads the path. One long shadow each, in the bales'
      // shadow material, a parallelogram (the row's length by the shadow's throw) tilted to the ground it lies on.
      // Two bounds come from the audit (shots/reverse-angle/flight4.md), each a place in the valley's own metres: (1) none
      // below z -430, where the bales begin to be drawn larger (the scale law above) and the shoulder's brow faces the loft:
      // the one stack there stood with a corner against the loft's sky on one deal; so every stack is at the bales' plain
      // scale, 18 m by 5.46 m; (2) none above z 40, where the height function begins the valley head's rise: a stack on that
      // slope stands higher than all the land between it and the far crest.
      if (FIELD_STACKS) {
        const st = [];
        for (const key of baled) {
          const cell = Math.floor(key / 16) - 6, zi = key % 16, z = zi * FIELD_L - 900 - stripOff(cell) + 6; if (z <= -430 || z > 40) continue;
          const sc = 1 + 0.8 * sst(-430, -560, z), half = 9 * sc, hv = Math.sin(cell * 12.9898 + zi * 78.233 + 7 * 37.719) * 43758.5453, side = hv - Math.floor(hv) < 0.5 ? -1 : 1;
          const xm = (cell + 0.5) * 24 - 8 * Math.sin(z * 0.0055) - 3 * Math.sin(z * 0.019) + side * Math.max(0, 12 - half - 0.8);
          let ok = true; for (let k = -2; k <= 2; k++) { const x = xm + k * half / 2; if (Math.abs(x) > 142 || Math.abs(x - riverX(z)) < 17 || houses.some((h) => Math.hypot(h.x - x, h.z - z) < 13)) ok = false; }
          if (ok) st.push([xm, z, sc, half]);
        }
        await ctx.yield();
        const stacks = new THREE.InstancedMesh(makeStackGeometry(), bales.material, Math.max(1, st.length)), ssh = new THREE.InstancedMesh(shGeo, shMat, Math.max(1, st.length));
        const X = new THREE.Vector3(), Y = new THREE.Vector3(0, 1, 0), Z = new THREE.Vector3();
        st.forEach(([x, z, sc, half], i) => {
          const ya = heightAt(x - half, z), yb = heightAt(x + half, z);   // the row lies along the ground between its two ends
          e3.set(0, 0, Math.atan2(yb - ya, 2 * half)); q.setFromEuler(e3); pp.set(x, (ya + yb) / 2 - 0.15 * sc, z); ss.set(sc, sc, sc); M.compose(pp, q, ss); stacks.setMatrixAt(i, M);
          // the shadow: as wide as the row (the material's soft edge is half gone at 0.775 of the half width), thrown 5.46 m of height; its width axis is turned (hand) so that (X, Y, Z) is right-handed and its face looks up whichever way the shadow is thrown along the valley
          const L = 5.46 * sc / Math.tan(el), wid = 2 * half / 0.775, len = L + 2.2 * sc, cx = x + sdir.x * L * 0.5, cz = z + sdir.y * L * 0.5, hand = sdir.y < 0 ? -1 : 1;
          X.set(hand * wid, hand * (heightAt(cx + wid / 2, cz) - heightAt(cx - wid / 2, cz)), 0); Z.set(sdir.x * len, heightAt(cx + sdir.x * len / 2, cz + sdir.y * len / 2) - heightAt(cx - sdir.x * len / 2, cz - sdir.y * len / 2), sdir.y * len);
          M.makeBasis(X, Y, Z); M.setPosition(cx, heightAt(cx, cz) + 0.3, cz); ssh.setMatrixAt(i, M);
        });
        stacks.count = ssh.count = st.length; stacks.name = 'ra-stacks'; ssh.name = 'ra-stack-shadows'; stacks.frustumCulled = ssh.frustumCulled = false; ssh.renderOrder = 5; root.add(stacks, ssh);
      }
    }
    await ctx.yield();

    // ---- October trees in the valley: along the cross hedges, round the houses, down the river bank. Gold, ochre and dull
    // green crowns (nothing redder than amber), each with its long blue shadow; they sway. One instanced tree, tinted per tree.
    { let sd = 7919; const rnd = () => (sd = (sd * 16807) % 2147483647) / 2147483647, list = [];
      const ok = (x, z, H) => { if (Math.abs(x) > 150 || Math.abs(x - riverX(z)) < 9) return false; const nr = path.nearestXZ(x, z);
        if (nr.dist < 11 || (nr.dist < 22 && heightAt(x, z) + H > nr.y - 7)) return false; return !houses.some((h) => Math.hypot(h.x - x, h.z - z) < 0.5 * Math.max(h.w, h.d) + 2.5); };
      const put = (x, z, H) => { if (ok(x, z, H)) list.push([x, heightAt(x, z) - 0.3, z, H, rnd() * 6.283, rnd()]); };
      houses.forEach((h, i) => { const n = i % 3 === 0 ? 2 : 1; for (let k = 0; k < n; k++) { const a = rnd() * 6.283, r = 7.5 + 5 * rnd(); put(h.x + Math.cos(a) * r, h.z + Math.sin(a) * r, 6.5 + 4 * rnd()); } });
      await ctx.yield();
      for (let cell = -6; cell <= 6; cell++) for (let zi = 2; zi <= 9; zi++) {   // hedgerow trees: where the paint has a hedge, a few stand up out of it
        const z0 = zi * FIELD_L - 900 - stripOff(cell); if (z0 < -415 || z0 > 205) continue;
        const n = 1 + Math.floor(rnd() * 2.6);
        for (let k = 0; k < n; k++) { const fx = 0.1 + 0.8 * rnd(), z = z0 + (rnd() - 0.5) * 2, x = (cell + fx) * 24 - 8 * Math.sin(z * 0.0055) - 3 * Math.sin(z * 0.019);
          if (detail < 0.8 && k > 0) continue; put(x, z, 7 + 5.5 * rnd()); }
      }
      await ctx.yield();
      for (let z = 190; z > -470; z -= 17 + 16 * rnd()) { const side = rnd() < 0.5 ? -1 : 1, x = riverX(z) + side * (12.5 + 4 * rnd()); put(x, z, 8 + 5 * rnd()); }   // willows and alders along the river
      await ctx.yield();
      const tparts = [paint(new THREE.CylinderGeometry(0.022, 0.04, 0.5, 6).translate(0, 0.25, 0), '#33291F', 11)];
      [[0, 0.66, 0, 0.34], [0.2, 0.56, 0.08, 0.24], [-0.19, 0.6, -0.1, 0.25], [0.03, 0.86, -0.05, 0.2], [-0.05, 0.55, 0.2, 0.22]].forEach(([x, y, z, r], k) => {
        const g = new THREE.IcosahedronGeometry(r, 1), q = g.attributes.position;
        for (let i = 0; i < q.count; i++) { const a = q.getX(i), b = q.getY(i), c = q.getZ(i), d = 1 + 0.3 * Math.sin(a * 17 + k * 3.1) * Math.sin(b * 13 + c * 11 + k); q.setXYZ(i, a * d, b * d * 0.85, c * d); }
        g.computeVertexNormals(); tparts.push(paint(g.translate(x, y, z), '#E2D8B4', 14)); });
      const tgeo = merge(tparts), nT = Math.max(1, list.length);
      const vtrees = new THREE.InstancedMesh(tgeo, litMat(shared, { name: '-vtrees', cloud: 0.8, rim: 0.3, amb: 1.05, side: THREE.DoubleSide }), nT);
      const tshMat = new THREE.ShaderMaterial({ name: 'ra-tree-shadow', transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2, uniforms: { ...shared },
        vertexShader: 'varying vec2 vUv; varying vec3 vW; void main(){ vUv = uv; vec4 w = instanceMatrix * vec4(position, 1.); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }',
        fragmentShader: GLSL_COMMON + /* glsl */`
          varying vec2 vUv; varying vec3 vW;
          void main(){
            vec2 q = vUv * 2. - 1.; float crown = 1. - smoothstep(0.35, 1., length(vec2(q.x, (q.y - 0.25) * 1.35))), stem = (1. - smoothstep(0.03, 0.12, abs(q.x))) * step(q.y, 0.3);
            float a = max(crown, stem * 0.8) * 0.6 * cloudSun(vW.xz) * exp(-uFogK * 2. * distance(vW, cameraPosition));
            gl_FragColor = vec4(0.035, 0.045, 0.1, a);
          }` });
      const tsh = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), tshMat, nT);
      const M = new THREE.Matrix4(), q = new THREE.Quaternion(), e3 = new THREE.Euler(), pp = new THREE.Vector3(), ss = new THREE.Vector3(), col = new THREE.Color(), sdir = new THREE.Vector2(-sunDir.x, -sunDir.z).normalize();
      const xv = new THREE.Vector3(), yv = new THREE.Vector3(0, 1, 0), zv = new THREE.Vector3();
      const TINT = [[1.0, 0.74, 0.2], [0.92, 0.6, 0.16], [1.0, 0.86, 0.34], [0.5, 0.56, 0.2], [0.78, 0.66, 0.24], [0.66, 0.44, 0.16]];
      list.forEach(([x, y, z, H, yaw, r], i) => {
        e3.set(0, yaw, 0); q.setFromEuler(e3); pp.set(x, y, z); ss.set(H * (0.9 + 0.3 * r), H, H * (0.9 + 0.3 * r)); M.compose(pp, q, ss); vtrees.setMatrixAt(i, M);
        const t = TINT[Math.floor(r * 5.999)], k = 0.85 + 0.3 * ((r * 7.3) % 1); vtrees.setColorAt(i, col.setRGB(t[0] * k, t[1] * k, t[2] * k));
        const L = Math.min(30, H * 0.9 / Math.tan(el)) + H * 0.5, x1 = x + sdir.x * L, z1 = z + sdir.y * L, h0 = heightAt(x - sdir.x * H * 0.2, z - sdir.y * H * 0.2), h1 = heightAt(x1, z1);
        xv.set(sdir.y * H * 0.85, 0, -sdir.x * H * 0.85); zv.set(-sdir.x * (L + H * 0.2), h0 - h1, -sdir.y * (L + H * 0.2));
        M.makeBasis(xv, yv, zv).setPosition((x - sdir.x * H * 0.2 + x1) / 2, (h0 + h1) / 2 + 0.25, (z - sdir.y * H * 0.2 + z1) / 2); tsh.setMatrixAt(i, M);
      });
      vtrees.count = tsh.count = list.length; vtrees.name = 'ra-valley-trees'; tsh.name = 'ra-tree-shadows'; vtrees.frustumCulled = tsh.frustumCulled = false; tsh.renderOrder = 5; root.add(vtrees, tsh);
    }
    await ctx.yield();

    // ---- smoke: five leaning columns of soft puffs; the hero column stands exactly on our path and keeps the hole we make
    const smokeKind = through === 'stubble-fire' ? 1 : through === 'mist' ? 2 : 0;
    const sBase = [], sP = [], addPlume = (b, n, width, hgt, kind) => { for (let i = 0; i < n; i++) { sBase.push(b.x, b.y, b.z); sP.push((i + rng()) / n, width, hgt, kind); } };
    const heroBase = heroTop.clone(), heroH = smokeKind === 1 ? 62 : smokeKind === 2 ? 9 : 46, heroW = smokeKind === 1 ? 14 : smokeKind === 2 ? 17 : 11;
    if (smokeKind === 1) { const gh = heightAt(pAt.x, pAt.z), dh = pAt.y - gh; heroBase.set(pAt.x - LEAN.x * dh, gh + 0.5, pAt.z - LEAN.y * dh); groundMat.uniforms.uFire.value.set(heroBase.x, heroBase.z, 1); }
    if (smokeKind === 2) heroBase.set(pAt.x - LEAN.x * 4.5, pAt.y - 4.5, pAt.z - LEAN.y * 4.5);
    addPlume(heroBase, 230, heroW, heroH, 1);
    // the white point must be alone in clean sky: a side chimney whose smoke would stand behind the point's track in the first
    // reverse (u 0.183 to 0.323, as the loft sees it) smokes lower, or not at all
    const trackDirs = []; for (let uu = 0.183; uu <= 0.3231; uu += 0.01) { const q = path.pointAt(uu).sub(EYE).normalize(); q.g = gustOf(uu); trackDirs.push(q); }
    const plumeClear = (b, hgt) => {
      const H = hgt * 2.3, q = new THREE.Vector3();
      for (const t of trackDirs) for (let f = 0.02; f < 0.92; f += 0.04) {
        const lf = f + t.g * (0.7 * f + 0.9 * f * f); q.set(b.x + lf * H * LEAN.x - EYE.x, b.y + f * H - EYE.y, b.z + lf * H * LEAN.y - EYE.z);
        const dist = q.length(), rad = 3.2 * 2.3 * ((0.36 + 0.5 * f + 0.2 * f * f) * 1.2 + 0.1 + 0.34 * f);
        if (q.divideScalar(dist).distanceTo(t) < 0.085 + rad / dist) return false;
      }
      return true;
    };
    for (let i = 1; i < 5; i++) { let hgt = 24; while (hgt > 0 && !plumeClear(chimneys[i], hgt)) hgt -= 6; addPlume(chimneys[i], Math.round(26 * Math.max(0.7, detail)), hgt > 0 ? 3.2 : 0, Math.max(hgt, 1), 0); }
    addPlume(pAt, 22, 1, 1, 2);                                                 // the wisps we drag out of the near side
    const sgeo = new THREE.InstancedBufferGeometry().copy(new THREE.PlaneGeometry(2, 2)); sgeo.instanceCount = sP.length / 4;
    sgeo.setAttribute('aBase', new THREE.InstancedBufferAttribute(new Float32Array(sBase), 3)); sgeo.setAttribute('aP', new THREE.InstancedBufferAttribute(new Float32Array(sP), 4));
    const smokeMat = new THREE.ShaderMaterial({
      name: 'ra-smoke', transparent: true, depthWrite: false,
      uniforms: { ...shared, uNotch: { value: pAt.clone() }, uNotchR: { value: 0.01 }, uBirdPos: { value: new THREE.Vector3() }, uTrail: { value: 0 }, uLean: { value: LEAN }, uBig: { value: 1 }, uSmall: { value: 1 }, uTall: { value: 1 }, uClear: { value: 0 }, uGust: { value: 0 }, uSink: { value: 0 }, uThrough: { value: pAt.clone() },
        uLit: { value: new THREE.Color(smokeKind === 1 ? '#CFC6B8' : '#EDEAE2') }, uFlat: { value: smokeKind === 2 ? 0.25 : 1 }, uDark: { value: smokeKind === 2 ? 0.6 : 1 } },
      vertexShader: GLSL_COMMON + /* glsl */`
        attribute vec3 aBase; attribute vec4 aP; uniform vec3 uNotch, uBirdPos; uniform float uTrail, uFlat, uBig, uSmall, uTall, uNotchR, uGust, uSink; uniform vec2 uLean;
        varying vec2 vQ; varying vec3 vW, vBody; varying float vA, vSeed, vHero;
        void main(){
          float seed = aP.x, f = fract(seed + uTime * 0.045), hero = aP.w, size, alpha; vec3 c, axis = aBase; float bodyR = 1.;
          if (hero < 1.5) {
            float big = hero > 0.5 ? uBig : uSmall, H = aP.z * (hero > 0.5 ? uTall : uSmall), wob = aP.y * (0.1 + 0.34 * f) * big;
            float lf = f + uGust * (0.7 * f + 0.9 * f * f);   // in the wind the columns bend over as they climb
            c = aBase + vec3(lf * H * uLean.x + sin(seed * 91. + f * 7.) * wob, f * H, lf * H * uLean.y + cos(seed * 57. + f * 5.) * wob);
            axis = aBase + vec3(lf * H * uLean.x, f * H, lf * H * uLean.y); bodyR = max(aP.y * big * (0.45 + 0.6 * f), 0.5);   // the column's own middle at this height, and its half width there
            if (hero > 0.5) { c.xz += (vec2(hash21(vec2(seed, 1.)), hash21(vec2(seed, 2.))) - 0.5) * aP.y * (1. - uFlat) * vec2(5.5, 1.3); c.y -= uSink; }   // a bank of mist lies across the valley, low at first
            size = aP.y * (0.36 + 0.5 * f + 0.2 * f * f) * (0.7 + 0.5 * hash21(vec2(seed, 5.))) * big; alpha = smoothstep(0., 0.04, f) * (1. - smoothstep(0.55, 1., f)) * 0.92;
            if (hero < 0.5) alpha *= smoothstep(14., 42., distance(c, cameraPosition));   // a side chimney's smoke thins away before it reaches our eye
            else {   // what we pushed aside stands round the hole as a collar
              vec2 dn = c.xy - uNotch.xy; float dl = length(dn), nb = exp(-dl * dl / max(uNotchR * uNotchR * 2.2, 1e-3)) * step(4., uNotchR) * step(abs(c.z - uNotch.z), 40.);
              c.xy += dn / max(dl, 0.5) * nb * uNotchR * 0.5; size *= 1. + 0.45 * nb;
            }
          } else {
            vec3 d = uBirdPos - uNotch; float L = length(d); d /= max(L, 1e-3);
            float s = 1.5 + seed * min(L, 46.);
            c = uNotch + d * s + vec3(sin(seed * 40. + uTime), cos(seed * 31. + uTime * 0.8), 0.) * (0.3 + 0.04 * s) * uBig;
            size = mix(1.5, 0.5, seed) * uBig; alpha = uTrail * (1. - seed) * (uBig > 1.3 ? 0.5 : 0.7) * step(7., L);
          }
          vec3 right = vec3(viewMatrix[0][0], viewMatrix[1][0], viewMatrix[2][0]), up = vec3(viewMatrix[0][1], viewMatrix[1][1], viewMatrix[2][1]);
          vW = c + (right * position.x + up * position.y) * size;
          vQ = position.xy; vA = alpha; vSeed = seed; vHero = hero;   // smooth or equal at all corners
          vBody = hero < 1.5 ? vec3((vW.xz - axis.xz) / bodyR, f) : vec3(0., 0., 0.5);   // where this bit of smoke stands in the column as a whole: across it, and up it
          gl_Position = projectionMatrix * viewMatrix * vec4(vW, 1.);
        }`,
      fragmentShader: GLSL_COMMON + /* glsl */`
        uniform vec3 uNotch, uLit, uBirdPos, uThrough; uniform float uNotchR, uDark, uClear; varying vec2 vQ; varying vec3 vW, vBody; varying float vA, vSeed, vHero;
        void main(){
          float r = length(vQ); vec2 nq = vQ * 1.5 + vSeed * 31.;
          vec2 d1 = vec2(0., -uTime * 0.2), d2 = vec2(3., 3. - uTime * 0.33), ox = vec2(0.34, 0.), oy = vec2(0., 0.34); mat2 rt = mat2(0.8, 0.6, -0.6, 0.8) * 2.1;
          float n = vnoise(nq + d1) * 0.62 + vnoise(rt * nq + d2) * 0.38;
          float nx = vnoise(nq + ox + d1) * 0.62 + vnoise(rt * (nq + ox) + d2) * 0.38, ny = vnoise(nq + oy + d1) * 0.62 + vnoise(rt * (nq + oy) + d2) * 0.38;
          float nf = vnoise(nq * 4.7 - d1 * 2.) * 0.6 + vnoise(rt * nq * 3.1 + d2) * 0.4, ne = n + 0.3 * (nf - 0.5);   // small lumps on the big ones: an edge, not a blur
          float body = 1. - smoothstep(0.32 + 0.42 * ne, 0.58 + 0.36 * ne, r), a = body * vA;
          vec3 hd = (vW - uNotch) * vec3(1., 1., 0.04);                               // the hole is a tunnel along the valley: sky shows through it from the loft
          if (vHero > 0.5 && vHero < 1.5) a *= smoothstep(uNotchR * 0.8, uNotchR * 1.12, length(hd) + (n - 0.5) * uNotchR * 0.3);
          // seen from the loft, the bird has torn its own way out: no smoke hangs between it and the door
          if (vHero > 0.5 && vHero < 1.5 && vW.z < uBirdPos.z + 3.) { float cr = max(uClear, 0.05); a *= mix(1., smoothstep(cr * 0.55, cr, length(vW.xy - uBirdPos.xy) + (n - 0.5) * cr * 0.35), step(0.5, uClear)); }
          if (a < 0.004) discard;
          // every puff is a dome of smaller lumps: lit where they face the sun, blue-grey in the creases and on the far side
          vec3 sv = (viewMatrix * vec4(uSunDir, 0.)).xyz, nn = normalize(vec3(vQ * 0.95 + 2.1 * vec2(n - nx, n - ny), 0.5));
          float lit = clamp(0.3 + 0.85 * dot(nn, sv), 0., 1.) * (0.55 + 0.45 * smoothstep(0.2, 0.7, n)) * (0.8 + 0.4 * nf);
          lit = max(lit, 0.55 * smoothstep(0.1, 0.8, r) * max(-sv.z, 0.));               // the thin outer parts light up against the sun
          vec3 c = mix(vec3(0.2, 0.235, 0.33) * (0.6 + 0.6 * n), uLit * (0.82 + 0.22 * n), lit);
          // seen against the sun (from the loft) a column is a body of smoke with form: the side of the whole column that is
          // turned to the sun, and the top of every billow, are lit warm (the sun's colour on the smoke's own white, never to
          // white); the side turned away and the creases between the lumps are a cool blue-grey shade. But where smoke is
          // thick and we look through it toward the light it stands dark, and the column we go through is thickest where we
          // go through it: within 30 m of that place (uThrough, a point of the valley) its body is the slate one, so the sky
          // seen through the hole is the brightest thing in it; the lit form comes in from there to 44 m, up the column
          vec3 Vd = normalize(vW - cameraPosition + vec3(0., 1e-4, 0.)); float tl = 0.5 + 0.5 * dot(Vd, uSunDir), back = smoothstep(0.5, 0.8, tl);
          float edge = smoothstep(0.45, 0.95, r + 0.4 * (ne - 0.5)) * clamp(0.5 + 0.9 * dot(normalize(vQ + vec2(1e-4, 0.)), sv.xy), 0., 1.);
          float litS = clamp(0.3 + 0.85 * dot(nn, sv), 0., 1.) + 0.5 * (n - 0.5);
          vec3 slate = mix(vec3(0.13, 0.15, 0.22), vec3(0.29, 0.31, 0.39), smoothstep(0.15, 0.8, litS)) * (0.75 + 0.5 * nf);
          vec3 nb = normalize(vec3(vBody.x, 0.5, vBody.y));                                    // the column's own roundness, tipped up a little: smoke is lit from above
          float litB = clamp(0.18 + 0.6 * dot(nn, sv) + 0.62 * dot(nb, uSunDir) + 0.3 * nn.y, 0., 1.) + 0.4 * (n - 0.5) + 0.2 * (nf - 0.5);
          vec3 shadeC = mix(vec3(0.17, 0.2, 0.29), vec3(0.3, 0.34, 0.45), smoothstep(0.1, 0.6, litB)) * (0.8 + 0.4 * nf);
          vec3 formed = mix(shadeC, uSunCol * uLit * (0.6 + 0.2 * n), smoothstep(0.42, 0.95, litB));
          vec3 dark = mix(slate, formed, vHero > 0.5 ? smoothstep(30., 44., distance(vW, uThrough)) : 1.);
          dark += uSunCol * vec3(0.3, 0.24, 0.16) * edge;
          c = mix(c, dark, back * uDark);
          a = mix(a, min(1., a * 1.5), back);
          gl_FragColor = vec4(foggedDir(min(c, vec3(0.92)), distance(vW, cameraPosition), cameraPosition - vW), a);
        }`,
    });
    const smoke = new THREE.Mesh(sgeo, smokeMat); smoke.name = 'ra-smoke'; smoke.frustumCulled = false; smoke.renderOrder = 20; root.add(smoke);
    await ctx.yield();

    // ---- the spruce wood: a black line from the loft that we can drop behind. Crossed cards, and real trunks by the path.
    const woodH = (z) => 8.5 + 5.2 * Math.pow(Math.min(1, Math.max(0, (z + 564) / 54)), 1.2);   // low in front of the loft, tall behind: ranks
    const wr = rng.fork('wood'), nCards = Math.round(1400 * Math.max(0.6, detail)), cardGeo = (() => {
      // one spruce: five drooping skirts of boughs round a stem, each a ragged cone open underneath
      const P = [], Nn = [], Q = [], I = [], SEG = 9;
      for (let k = 0; k < 5; k++) {
        const hb = 0.07 + 0.17 * k, ha = Math.min(1, hb + 0.4), r = 0.5 * (1 - hb * 0.9), o = P.length / 3;
        P.push(0, ha, 0); Nn.push(0, 1, 0); Q.push(0, k, 0);
        for (let j = 0; j < SEG; j++) {
          const a = (j + (k % 2) * 0.5) / SEG * Math.PI * 2, rr = r * (j % 2 ? 0.78 : 1), sl = (ha - hb) / r, il = 1 / Math.hypot(1, sl);
          P.push(Math.cos(a) * rr, hb - (j % 2 ? 0 : 0.035), Math.sin(a) * rr); Nn.push(Math.cos(a) * sl * il, il, Math.sin(a) * sl * il); Q.push(1, k, j / SEG);
          I.push(o, o + 1 + ((j + 1) % SEG), o + 1 + j);
        }
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(P), 3)); g.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(Nn), 3));
      g.setAttribute('aQ', new THREE.BufferAttribute(new Float32Array(Q), 3)); g.setIndex(I); return g;
    })();
    const wgeo = new THREE.InstancedBufferGeometry().copy(cardGeo), wT = new Float32Array((nCards + 80) * 4), wS = new Float32Array((nCards + 80) * 2);
    let wn = 0;
    for (let i = 0; i < nCards * 3 && wn < nCards; i++) {
      const x = wr.range(-175, 175), z = wr.range(-568, -503), nr = path.nearestXZ(x, z), hgt = woodH(z) * (0.74 + 3.0 * (wr.range(0.93, 1.09) - 0.93));   // a ragged skyline: no two leaders level
      if (nr.dist < 9.5 || Math.abs(x - riverX(z)) < 11) continue;
      wT[wn * 4] = x; wT[wn * 4 + 1] = heightAt(x, z) - 0.4; wT[wn * 4 + 2] = z; wT[wn * 4 + 3] = hgt; wS[wn * 2] = wr(); wS[wn * 2 + 1] = wr.range(5.5, 7.5); wn++;
      if (i % 120 === 119) await ctx.yield();
    }
    wgeo.setAttribute('aT', new THREE.InstancedBufferAttribute(wT, 4)); wgeo.setAttribute('aS', new THREE.InstancedBufferAttribute(wS, 2));
    const woodMat = new THREE.ShaderMaterial({
      name: 'ra-spruce', side: THREE.DoubleSide, uniforms: { ...shared, uHaze: { value: LOOK.haze }, uRim: { value: LOOK.rim } },
      vertexShader: GLSL_COMMON + /* glsl */`
        attribute vec4 aT; attribute vec2 aS; attribute vec3 aQ; varying vec3 vW, vN, vQ; varying float vSeed;
        void main(){
          float ca = cos(aS.x * 6.283), sa = sin(aS.x * 6.283); vec3 p = position, n = normal;
          p.xz = vec2(p.x * ca - p.z * sa, p.x * sa + p.z * ca) * aS.y; n.xz = vec2(n.x * ca - n.z * sa, n.x * sa + n.z * ca); p.y *= aT.w;
          float top = position.y * position.y;
          p.xz += (0.3 * sin(uTime * 0.9 + aT.x * 0.05 + aS.x * 6.) + 0.12 * sin(uTime * 2.3 + aS.x * 40.)) * top;          // wind in the tops
          p.y += 0.12 * aQ.x * sin(uTime * 1.7 + aS.x * 30. + aQ.z * 19. + aQ.y * 2.);                                       // boughs lifting
          vW = p + aT.xyz; vN = n; vQ = vec3(aQ.x, aQ.z, position.y); vSeed = aS.x;   // per tree: equal at all corners
          gl_Position = projectionMatrix * viewMatrix * vec4(vW, 1.);
        }`,
      fragmentShader: GLSL_COMMON + /* glsl */`
        varying vec3 vW, vN, vQ; varying float vSeed; uniform float uHaze, uRim;
        void main(){
          float skirt = vQ.x, nz = vnoise(vec2(vQ.y * 54. + vSeed * 9., vW.y * 1.3));
          if (skirt > 0.86 + 0.14 * nz) discard;                                                                             // ragged bough tips
          vec3 n = normalize(vN + vec3(0., 1e-5, 0.)); float dist = distance(vW, cameraPosition);
          float cs = cloudSoft(vW.xz), under = gl_FrontFacing ? 1. : 0.25;
          float needles = 0.55 + 0.9 * vnoise(vec2(vQ.y * 85. + vSeed * 5., skirt * 13. + vW.y * 2.)) * (0.5 + 0.5 * nz);
          float flank = max(dot(n, uSunDir), 0.), lit = flank * (0.25 + 0.75 * cs) * under * (0.25 + 0.75 * skirt);
          vec3 alb = mix(vec3(0.012, 0.034, 0.026), vec3(0.024, 0.05, 0.028), vSeed) * needles;
          // October: a larch here and there along both edges of the wood has turned gold (gold, never red)
          float larch = step(0.9, fract(vSeed * 13.7)) * max(smoothstep(-546., -554., vW.z), smoothstep(-514., -508., vW.z));
          alb = mix(alb, vec3(0.3, 0.215, 0.035) * needles, larch);
          vec3 c = alb * (uSunCol * lit * 3.4 + uSkyCol * (0.3 + 0.7 * skirt) * under * 1.2 * (0.72 + 0.28 * cs));
          // the ride we fly through the wood is an open cut 19 m wide (no spruce stands within 9.5 m of the path): the sky comes
          // down into it and the stubble at both its mouths throws light along it, so with the sun behind the eye the trees
          // beside us are dark green on their shade side, not black. Against the light (the loft's view) they stay a silhouette
          float agl = 0.5 + 0.5 * dot(normalize(vW - cameraPosition + vec3(0., 1e-4, 0.)), uSunDir);
          float rideK = (1. - smoothstep(9., 24., abs(vW.x - (-13. + (-505. - vW.z) * 0.154)))) * (1. - smoothstep(0.5, 0.68, agl));
          c += alb * (uSkyCol * 6. + uSunCol * vec3(1., 0.85, 0.5)) * rideK * (0.35 + 0.65 * skirt) * (0.6 + 0.4 * under);
          float dB0 = clamp((vW.z + 570.) / 62., 0., 1.) * (1. - smoothstep(-592., -562., cameraPosition.z));
          // the sun stands behind the wood for whoever looks up the valley: needles on the sunward flank, the ragged
          // tips of every skirt and the leaders burn; under a cloud they go out
          vec3 V = (cameraPosition - vW) / max(dist, 1e-4); float bl = 0.5 + 0.5 * dot(-V, uSunDir); bl *= bl;
          float fringe = smoothstep(0.68, 0.95, skirt + 0.3 * nz - 0.1), topK = smoothstep(0.5, 1., vQ.z);
          float side = smoothstep(-0.15, 0.55, dot(n.xz, uSunDir.xz));
          float nearK = 1. - 0.85 * dB0;   // the gold rim belongs to the near ranks: behind them the wood goes to blue silhouettes
          c += uSunCol * vec3(0.55, 0.46, 0.12) * (0.12 + 0.88 * cs) * mix(1., needles, 0.45) * uRim * bl * nearK * (side * (0.1 + 0.32 * fringe) + 0.3 * topK * (0.35 + 0.65 * fringe));
          c += uSunCol * vec3(0.5, 0.34, 0.05) * larch * needles * (0.2 + 0.8 * cs) * (0.1 + 0.5 * bl) * (0.4 + 0.6 * skirt);   // larch needles are thin: the sun comes through them
          // each rank behind is paler and bluer; where the sun gets in, the air between them is lit
          // (counted from whichever end of the valley the eye is at: full from the loft, half from the air, none from far off)
          float dB = clamp((vW.z + 570.) / 62., 0., 1.) * (1. - smoothstep(-592., -562., cameraPosition.z)), dA = clamp((-500. - vW.z) / 62., 0., 1.) * smoothstep(-512., -482., cameraPosition.z);
          float rank = (dB * (0.3 + 0.7 * dB) * 0.6 + 0.45 * dA * (1. - smoothstep(110., 260., dist))) * uHaze;   // from the loft the far rank stands 65 m behind the near one: it keeps its body, a slate silhouette darker than the fields beyond
          float fl = dot(uFogCol, vec3(0.3333)); vec3 air = mix(fl * vec3(0.16, 0.27, 0.5), fl * vec3(0.24, 0.35, 0.56) + uSunCol * vec3(0.05, 0.04, 0.02), bl * (0.2 + 0.8 * cs)); rank *= 0.92 * (1. - 0.25 * smoothstep(0.25, 0.9, vQ.z));   // ground mist: the tops stand a little clearer of it
          air *= (0.5 + 0.5 * cs) * (1. - 0.3 * smoothstep(0., 0.2, dB));                                                                                           // under a cloud the wood goes dark and cold
          c = mix(c, air, rank);
          gl_FragColor = vec4(foggedDir(c, dist, V), 1.);
        }`,
    });
    const wood = new THREE.Mesh(wgeo, woodMat); wood.name = 'ra-wood'; wood.frustumCulled = false; root.add(wood);
    // from the loft the wood is one unbroken line: the lane we fly is closed to camera B's eye by spruce drawn only in B's shots
    const lgeo = new THREE.InstancedBufferGeometry().copy(cardGeo), lT = [], lS = [];
    for (let i = 0; i < 46; i++) {
      const z = -506 - (i % 23) * 2.6 - (i > 22 ? 1.3 : 0), c = path.pointAt(path.nearestXZ(-10, z).u), hs = Math.sin(i * 12.9898) * 43758.5453, h1 = hs - Math.floor(hs), hs2 = Math.sin(i * 78.233) * 12543.21, h2 = hs2 - Math.floor(hs2);
      const x = c.x + (h1 - 0.5) * 17, hgt = woodH(z) * (0.93 + 0.16 * h2);
      lT.push(x, heightAt(x, z) - 0.4, z, hgt); lS.push(h2, 5.5 + 2 * h1);
    }
    lgeo.instanceCount = 46; lgeo.setAttribute('aT', new THREE.InstancedBufferAttribute(new Float32Array(lT), 4)); lgeo.setAttribute('aS', new THREE.InstancedBufferAttribute(new Float32Array(lS), 2));
    const lane = new THREE.Mesh(lgeo, woodMat); lane.name = 'ra-lane'; lane.frustumCulled = false; lane.visible = false; root.add(lane);
    await ctx.yield();
    // thin mist standing between the ranks and in the lane: four soft veils across the hollow, lit where the sun gets in.
    // Each rank behind a veil is paler; they drift, and a cloud's shadow puts them out as it crosses.
    { const mp = [], mu = [], mi = [];
      [[-551, 9], [-533, 10.5], [-515, 12], [-496, 13]].forEach(([z, top], k) => {
        const o = mp.length / 3; mp.push(-192, 0, z, 192, 0, z, -192, top, z, 192, top, z); mu.push(0, 0, k, 1, 0, k, 0, 1, k, 1, 1, k); mi.push(o, o + 1, o + 2, o + 1, o + 3, o + 2); });
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(mp), 3)); g.setAttribute('aU', new THREE.BufferAttribute(new Float32Array(mu), 3)); g.setIndex(mi);
      const veilMat = new THREE.ShaderMaterial({ name: 'ra-veils', transparent: true, depthWrite: false, side: THREE.DoubleSide, uniforms: { ...shared, uSheet: { value: LOOK.sheet } },
        vertexShader: 'attribute vec3 aU; varying vec3 vU, vW; void main(){ vU = aU; vW = position; gl_Position = projectionMatrix * viewMatrix * vec4(position, 1.); }',
        fragmentShader: GLSL_COMMON + /* glsl */`
          varying vec3 vU, vW; uniform float uSheet;
          void main(){
            vec3 V = cameraPosition - vW; float dist = length(V); V /= max(dist, 1e-4);
            float n = vnoise(vec2(vW.x * 0.016 + uTime * 0.09 + vU.z * 7.3, vW.y * 0.17 + vU.z * 3.1)) * 0.6 + vnoise(vec2(vW.x * 0.055 - uTime * 0.06, vW.y * 0.33 + vU.z)) * 0.4;
            float body = (1. - smoothstep(0.12, 1., vU.y + 0.5 * (n - 0.5))) * smoothstep(0., 0.06, vU.y);
            float a = body * (0.3 + 0.7 * n) * smoothstep(5., 38., dist) * (1. - smoothstep(165., 190., abs(vW.x))) * uSheet * (0.55 + 0.15 * vU.z);
            a *= (1. - smoothstep(0.1, 0.32, abs(V.y))) * (1. - smoothstep(170., 290., dist));   // mist is only seen along it, and near: from above and from far off there is none
            float bl = 0.5 + 0.5 * dot(-V, uSunDir); bl *= bl;
            // the sun comes down through the tops in slanting shafts: the mist is brighter where a shaft stands in it
            float ray = smoothstep(0.3, 0.75, vnoise(vec2((vW.x - vW.y * uSunDir.x / max(uSunDir.y, 0.15)) * 0.13 + uTime * 0.025, vU.z * 3.7)) * 0.7 + vnoise(vec2((vW.x - vW.y * uSunDir.x / max(uSunDir.y, 0.15)) * 0.41 - uTime * 0.04, vU.z * 5.1)) * 0.3);
            a *= 0.4 + 1.15 * ray;
            float csv = cloudSoft(vW.xz), fl = dot(uFogCol, vec3(0.3333));
            vec3 c = mix(fl * vec3(0.5, 0.66, 0.95), fl * vec3(0.6, 0.66, 0.8) + uSunCol * vec3(0.5, 0.36, 0.16) * (0.35 + 0.9 * ray), bl * (0.12 + 0.88 * csv));   // blue in the shade, gold where a shaft stands in it
            c *= (0.55 + 0.45 * csv) * (0.8 + 0.35 * ray);
            gl_FragColor = vec4(fogged(c, dist), min(a * 0.8, 0.85));
          }` });
      const veils = new THREE.Mesh(g, veilMat); veils.name = 'ra-veils'; veils.frustumCulled = false; veils.renderOrder = 22; root.add(veils); }
    // the sun stands behind the wood for the loft: long shafts slant down through the tops into the air over the last field.
    // Additive sheets across the hollow, bright only against the light (camera A, flying down-sun, never sees them); a cloud puts them out.
    { const rp = [], ru = [], ri = [];
      [[-598, 9], [-584, 10.5], [-570, 12], [-552, 14], [-530, 16]].forEach(([z, top], k) => {
        const o = rp.length / 3; rp.push(-200, 0, z, 200, 0, z, -200, top, z, 200, top, z); ru.push(0, 0, k, 1, 0, k, 0, 1, k, 1, 1, k); ri.push(o, o + 1, o + 2, o + 1, o + 3, o + 2); });
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(rp), 3)); g.setAttribute('aU', new THREE.BufferAttribute(new Float32Array(ru), 3)); g.setIndex(ri);
      const rayMat = new THREE.ShaderMaterial({ name: 'ra-rays', transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, uniforms: { ...shared, uSheet: { value: 0.35 + 0.65 * LOOK.sheet } },
        vertexShader: 'attribute vec3 aU; varying vec3 vU, vW; void main(){ vU = aU; vW = position; gl_Position = projectionMatrix * viewMatrix * vec4(position, 1.); }',
        fragmentShader: GLSL_COMMON + /* glsl */`
          varying vec3 vU, vW; uniform float uSheet;
          void main(){
            vec3 V = cameraPosition - vW; float dist = length(V); V /= max(dist, 1e-4);
            float bl = 0.5 + 0.5 * dot(-V, uSunDir); bl *= bl; bl *= bl;
            float sl = vW.x - vW.y * uSunDir.x / max(uSunDir.y, 0.15);
            float ray = vnoise(vec2(sl * 0.045 + uTime * 0.012, vU.z * 3.7)) * 0.62 + vnoise(vec2(sl * 0.15 - uTime * 0.02, vU.z * 5.1 + 2.)) * 0.38;
            ray = smoothstep(0.56, 0.74, ray);   // separate beams with shade between them: a wash is not a shaft
            float a = ray * smoothstep(0., 0.12, vU.y) * (1. - smoothstep(0.35, 1., vU.y)) * (1. - smoothstep(150., 198., abs(vW.x))) * smoothstep(12., 40., dist) * (1. - smoothstep(190., 300., dist));
            float cs = cloudSoft(vW.xz + uSunDir.xz / max(length(uSunDir.xz), 1e-3) * 45.);   // the light is let through, or not, back at the wood
            a *= bl * cs * cs * uSheet * 0.3;
            gl_FragColor = vec4(uSunCol * vec3(0.6, 0.43, 0.2) * a, 1.);
          }` });
      const rays = new THREE.Mesh(g, rayMat); rays.name = 'ra-rays'; rays.frustumCulled = false; rays.renderOrder = 23; root.add(rays); }
    // river mist, a thing of the valley (flight2), thickest over the river: sheets across the valley at typed stations, places in
    // the world's metres on a lattice of about 9 m (a spruce crown is 5.5 to 7.5 m across). Seven, 9 m apart, z -501.5 to -555.5:
    // the wood's cards are dealt in z -568 to -503, so the first stands 1.5 m outside the wood's up-valley edge and six among the
    // trees; the ground under them is the valley floor (y -4 to +1.6 for x -150 to 150) and each top edge, where the mist has all
    // but thinned away, is at y 2 + 0.8 of the wood's height law there (13.0 down to 9.2). Two up-valley of the wood, tops 19.5
    // and 18 (the height law at that edge is 13.7; a leader is dealt 0.74 to 1.22 of it): z -492 at the stubble shoulder's foot
    // (ground -3.2 to +1.8); and z -474 on the shoulder, not where the hollow is deepest: for x greater than -90 the ground there stands 6.4 to 9.2 m (the shoulder's law gives 8.5), so the lower half of that sheet is under the ground across most of the valley. Seen against the light: gold where the sun passes through it toward the eye, brighter under a shaft, cool and thin in a cloud's shadow and down-sun. It drifts on the chaff's wind
    { const mp = [], mu = [], mi = [], st = [[-474, 18, 2], [-492, 19.5, 2]];
      for (let k = 0; k < 7; k++) { const z = -501.5 - 9 * k; st.push([z, 2 + 0.8 * woodH(z), 1]); }
      st.forEach(([z, top, kind], k) => { const o = mp.length / 3, rx = riverX(z);
        mp.push(-192, 0, z, 192, 0, z, -192, top, z, 192, top, z); mu.push(0, 0, k, rx, 1, 0, k, rx, 0, 1, k, rx, 1, 1, k, rx); mi.push(o, o + 1, o + 2, o + 1, o + 3, o + 2); });
      const kinds = []; st.forEach(([, , kind]) => { for (let c = 0; c < 4; c++) kinds.push(kind); });
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(mp), 3)); g.setAttribute('aU', new THREE.BufferAttribute(new Float32Array(mu), 4));
      g.setAttribute('aKind', new THREE.BufferAttribute(new Float32Array(kinds), 1)); g.setIndex(mi);
      const mistMat = new THREE.ShaderMaterial({ name: 'ra-river-mist', transparent: true, depthWrite: false, side: THREE.DoubleSide,
        uniforms: { ...shared, uMist: { value: 0.45 + 0.55 * LOOK.mist }, uWind: { value: sunSide * 1.6 } },   // every hour has some: most in the long low light (the brief: "more river mist")
        vertexShader: 'attribute vec4 aU; attribute float aKind; varying vec4 vU; varying vec3 vW; varying float vKind; void main(){ vU = aU; vKind = aKind; vW = position; gl_Position = projectionMatrix * viewMatrix * vec4(position, 1.); }',
        fragmentShader: GLSL_COMMON + /* glsl */`
          varying vec4 vU; varying vec3 vW; varying float vKind; uniform float uMist, uWind;
          void main(){
            vec3 V = cameraPosition - vW; float dist = length(V); V /= max(dist, 1e-4);
            float xw = vW.x - uWind * uTime, sd = vU.z * 5.7;
            float n = vnoise(vec2(xw * 0.021 + sd, vW.y * 0.19 + sd * 0.6)) * 0.6 + vnoise(vec2(xw * 0.07 - sd, vW.y * 0.4 + sd)) * 0.4;
            float body = (1. - smoothstep(0.2, 1., vU.y + 0.5 * (n - 0.5))) * smoothstep(0., 0.05, vU.y);                 // thick low, thinning upward, a ragged top
            float dr = (vW.x - vU.w) / 26., river = 1. + 0.7 * exp(-dr * dr);                                             // deepest over the river
            float bl = 0.5 + 0.5 * dot(-V, uSunDir); bl *= bl;
            float sl = vW.x - vW.y * uSunDir.x / max(uSunDir.y, 0.15);                                                    // along the sun's slant: a shaft keeps its place as it comes down
            float ray = smoothstep(0.34, 0.72, vnoise(vec2(sl * 0.11 + uTime * 0.02, sd * 1.3)) * 0.65 + vnoise(vec2(sl * 0.37 - uTime * 0.03, sd * 2.1)) * 0.35);
            float cs = cloudSoft(vW.xz), far = step(1.5, vKind);
            float a = body * (0.4 + 0.6 * n) * river * uMist * mix(0.5, 0.7, far) * (0.2 + 0.8 * bl) * (0.55 + 0.6 * ray * (1. - far))
              * smoothstep(8., 40., dist) * (1. - smoothstep(160., 190., abs(vW.x))) * (1. - smoothstep(0.12, 0.4, abs(V.y)));   // seen along it, not from above
            float fl = dot(uFogCol, vec3(0.3333));
            vec3 cool = fl * vec3(0.52, 0.64, 0.92), warm = uSunCol * vec3(0.64, 0.5, 0.3) * (0.7 + 0.5 * ray);
            vec3 c = mix(cool, warm, bl * (0.15 + 0.85 * cs)) * (0.6 + 0.4 * cs);
            gl_FragColor = vec4(fogged(c, dist), min(a, 0.6));
          }` });
      const rmist = new THREE.Mesh(g, mistMat); rmist.name = 'ra-river-mist'; rmist.frustumCulled = false; rmist.renderOrder = 21; root.add(rmist); }
    await ctx.yield();
    {
      const nT = Math.round(60 * Math.max(0.6, detail)), tg = new THREE.CylinderGeometry(0.3, 0.42, 1, 7).translate(0, 0.5, 0), tm = new THREE.InstancedMesh(paint(tg, '#5C4C40', 11), litMat(shared, { name: '-trunk', cloud: 1 }), nT);
      const M = new THREE.Matrix4(), q = new THREE.Quaternion(), tp = new THREE.Vector3(), ts = new THREE.Vector3();
      for (let i = 0; i < nT; i++) {
        const uu = wr.range(0.742, 0.842), side = wr.chance(0.5) ? 1 : -1, off = wr.range(4.6, 12.5) * side; path.pointAt(uu, tp);
        tp.x += off; tp.y = heightAt(tp.x, tp.z) - 0.3; const th = woodH(tp.z); ts.set(wr.range(0.75, 1.1), th * 0.8, 1); ts.z = ts.x; M.compose(tp, q, ts); tm.setMatrixAt(i, M);
        if (i % 15 === 14) await ctx.yield();
        wT[wn * 4] = tp.x; wT[wn * 4 + 1] = tp.y + th * 0.42; wT[wn * 4 + 2] = tp.z; wT[wn * 4 + 3] = th * wr.range(0.56, 0.68); wS[wn * 2] = wr(); wS[wn * 2 + 1] = wr.range(5.5, 7); wn++;
      }
      tm.name = 'ra-trunks'; tm.frustumCulled = false; root.add(tm); wgeo.instanceCount = wn;
    }
    await ctx.yield();

    // ---- the farm, three times life size: a stone barn gable-on to the valley, the hay door, the dark loft behind it
    const box = (x0, x1, y0, y1, z0, z1, hex, part = 0) => paint(new THREE.BoxGeometry(x1 - x0, y1 - y0, Math.abs(z1 - z0)).translate((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2), hex, part);
    const stone = '#83858A', quoin = '#8F9094', timber = '#3A2A1C', slate = '#56606F', zi = DOOR_Z - 0.8, zb = DOOR_Z - 54, bp = [];
    const SLIT = [[-6.2, 20.6], [6.2, 20.6], [0, 22.4]], slitW = 0.34, slitH = 2.3;                                      // three slits in the gable let the sun in
    // the gable wall, built round the door and the slits
    bp.push(box(-12, -1.75, 0, 18, zi, DOOR_Z, stone, 4), box(1.75, 12, 0, 18, zi, DOOR_Z, stone, 4), box(-1.75, 1.75, 0, LOFT_Y, zi, DOOR_Z, stone, 4), box(-1.75, 1.75, LINTEL_Y, 18, zi, DOOR_Z, stone, 4));
    { const pk = paint(prism(24, 9, 0.8).translate(0, 18, DOOR_Z - 0.4), stone, 4); bp.push(pk); }
    // (no quoins: the corners are the wall's own stones)
    for (const [x, y] of SLIT) bp.push(box(x - slitW, x + slitW, y - slitH / 2, y + slitH / 2, DOOR_Z - 0.05, DOOR_Z + 0.03, '#050403'), box(x - slitW - 0.25, x + slitW + 0.25, y + slitH / 2, y + slitH / 2 + 0.4, DOOR_Z - 0.1, DOOR_Z + 0.12, quoin, 4));
    // a dovecote in the gable's point: four pigeon holes with their landing ledges. Somebody here keeps a bird, and it is out
    for (const [x, y] of [[-1.5, 24.2], [0, 24.2], [1.5, 24.2], [0, 25.75]]) bp.push(box(x - 0.36, x + 0.36, y, y + 0.85, DOOR_Z - 0.05, DOOR_Z + 0.03, '#050403'), box(x - 0.36, x + 0.36, y + 0.85, y + 1.0, DOOR_Z - 0.1, DOOR_Z + 0.1, quoin, 4));
    bp.push(box(-2.5, 2.5, 23.98, 24.2, DOOR_Z - 0.1, DOOR_Z + 0.6, quoin, 4), box(-0.9, 0.9, 25.55, 25.75, DOOR_Z - 0.1, DOOR_Z + 0.5, quoin, 4));
    bp.push(box(-3.0, 3.0, LINTEL_Y + 0.4, LINTEL_Y + 1.3, DOOR_Z - 0.1, DOOR_Z + 0.14, quoin, 4));                       // the stone lintel over the timber one
    bp.push(box(-12.2, 12.2, -3, 1.6, DOOR_Z - 0.2, DOOR_Z + 0.25, '#5A554D', 4), box(-12.1, 12.1, -3, 0.3, zb - 0.9, DOOR_Z, '#5A554D', 4));                                       // plinth
    // side and back walls, the slate roof in two slopes with its overhang, ridge and bargeboards
    bp.push(box(-12, -11.2, 0, 18, zb, zi, stone, 4), box(11.2, 12, 0, 18, zb, zi, stone, 4), box(-12, 12, 0, 18, zb - 0.8, zb, stone, 4));
    const rAng = Math.atan2(9.3, 12.2), rLen = Math.hypot(13.3, 13.3 * 9.3 / 12.2);
    for (const sx of [-1, 1]) {
      bp.push(paint(new THREE.BoxGeometry(rLen, 0.36, 57.2).translate(sx * rLen / 2, 0, 0).rotateZ(-sx * rAng).translate(0, 27.45, DOOR_Z - 27.6), slate, 3));
      bp.push(paint(new THREE.BoxGeometry(rLen, 0.5, 0.22).translate(sx * rLen / 2, -0.25, 0).rotateZ(-sx * rAng).translate(0, 27.4, DOOR_Z + 1.02), timber, 6));   // bargeboard
    }
    bp.push(box(-0.3, 0.3, 27.2, 27.75, DOOR_Z - 56.3, DOOR_Z + 1.1, '#6F6A63', 4));                                     // ridge stones
    // the hay door: the lower leaf shut, the frame, the sill
    const dp = [], frameT = '#5E5B58';
    for (let k = 0; k < 7; k++) dp.push(box(-1.75 + k * 0.5, -1.75 + k * 0.5 + 0.47, LOFT_Y, SILL_Y - 0.12, zi + 0.25, zi + 0.45, k % 2 ? '#4A3828' : '#42311F', 5));
    dp.push(box(-1.75, 1.75, SILL_Y - 0.75, SILL_Y - 0.5, zi + 0.45, zi + 0.55, '#33261A', 6), box(-1.75, 1.75, LOFT_Y + 0.35, LOFT_Y + 0.6, zi + 0.45, zi + 0.55, '#33261A', 6));
    dp.push(box(-2.2, -1.75, LOFT_Y, LINTEL_Y + 0.35, zi - 0.15, DOOR_Z + 0.2, frameT, 5), box(1.75, 2.2, LOFT_Y, LINTEL_Y + 0.35, zi - 0.15, DOOR_Z + 0.2, frameT, 5));
    // iron on the jambs: two strap hinges and a pintle each side, so the dark at the frame's edges is a door's frame and nothing else
    for (const sx of [-1, 1]) for (const hy of [SILL_Y + 0.42, SILL_Y + 2.05]) dp.push(box(sx * 1.75 - 0.035, sx * 1.75 + 0.035, hy, hy + 0.13, zi - 0.1, DOOR_Z + 0.16, '#101114'), box(sx * 1.7 - 0.05, sx * 1.7 + 0.05, hy - 0.06, hy + 0.19, zi + 0.02, zi + 0.12, '#0C0D10'));
    dp.push(box(-2.2, 2.2, LINTEL_Y, LINTEL_Y + 0.4, zi - 0.15, DOOR_Z + 0.2, frameT, 6), box(-1.75, 1.75, SILL_Y - 0.14, SILL_Y, zi - 0.2, DOOR_Z + 0.25, '#5A4632', 6));
    // flight4, THING TWO (a): the two upper leaves, thrown open flat on the gable outside the jambs (which end at 2.2 m): 1.7 m
    // wide each, sill to lintel, 0.12 thick with ledges to 0.2. They go into the door frame's own mesh, with the lower leaf
    const barnFace = BARN_FACE ? makeBarnFace({ doorZ: DOOR_Z, sillY: SILL_Y, lintelY: LINTEL_Y, x0: 2.2, x1: 3.9, wallZ: DOOR_Z - 8, lx0: -19.5, lx1: -12, wallTop: 7.2, roof: { x: -16.2, y: 9.4, z: DOOR_Z - 21, ang: 0.42, len: 27.6, wid: 9.4, thick: 0.3 } }) : null;
    if (barnFace) dp.push(...barnFace.leaves);
    const ringPos = new THREE.Vector3(0, 14.7, END_Z), glowPos = ringPos.clone().add(new THREE.Vector3(0, -0.4, 1.4));
    await ctx.yield();
    const barn = new THREE.Mesh(merge(bp), litMat(shared, { name: '-barn', color: new THREE.Color(1.42, 1.2, 0.95), glow: 1.2, glowPos, glowFall: 0.004, cloud: 0.4, eave: new THREE.Vector4(27.3, 0.762, 2.7, 0.9) })); barn.name = 'ra-barn'; barn.frustumCulled = false; root.add(barn);
    const doorFrame = new THREE.Mesh(merge(dp), litMat(shared, { name: '-doorframe', glow: 1.0, glowPos, glowFall: 0.004, glowMin: 0.45, amb: 3.0, sunK: 0.3, cloud: 1, color: new THREE.Color(0.78, 0.66, 0.54), edge: new THREE.Vector3(DOOR_Z + 0.2, 0.05, 1.5) })); doorFrame.name = 'ra-doorframe'; doorFrame.frustumCulled = false; root.add(doorFrame);
    // the sill's top, where the mittens rest: a worn oak board in the raking sun, the door post's shadow lying slantwise
    // across it, strewn hay, a handful of corn put out for whoever is coming, and the mittens' own long shadows
    const sillMat = new THREE.ShaderMaterial({
      name: 'ra-sill', uniforms: { ...shared, uM0: { value: new THREE.Vector3(0.6, SILL_Y, DOOR_Z) }, uM1: { value: new THREE.Vector3(-0.6, SILL_Y, DOOR_Z) }, uSide: { value: sunSide }, ...(SILL_PAIL ? { uPail: { value: new THREE.Vector4(0, 0, 0.25, 0) }, uHeap: { value: new THREE.Vector4(999, 999, 0.25, 0.15) } } : {}) },
      vertexShader: 'varying vec3 vW; void main(){ vW = position; gl_Position = projectionMatrix * viewMatrix * vec4(position, 1.); }',
      fragmentShader: GLSL_COMMON + /* glsl */`
        varying vec3 vW; uniform vec3 uM0, uM1; uniform float uSide;${SILL_PAIL ? ' uniform vec4 uPail, uHeap;' : ''}
        float strands(vec2 p, float ang, float f){ float c = cos(ang), s = sin(ang); vec2 q = vec2(p.x * c - p.y * s, p.x * s + p.y * c);
          return smoothstep(0.72, 0.9, vnoise(vec2(q.x * f, q.y * f * 0.045))) * smoothstep(0.35, 0.6, vnoise(q * 3.1 + ang * 7.)); }
        float mshadow(vec2 p, vec3 m, vec2 dir, float len){ vec2 d = p - m.xz; float al = dot(d, dir), pe = abs(d.x * dir.y - d.y * dir.x);
          return (1. - smoothstep(0.11, 0.2, pe)) * smoothstep(-0.12, 0.05, al) * (1. - smoothstep(len * 0.6, len, al)) * (1. - smoothstep(0.2, 0.75, m.y - ${SILL_Y.toFixed(2)})); }
        void main(){
          vec3 V = cameraPosition - vW; float dist = length(V); V /= max(dist, 1e-4);
          vec2 p = vW.xz; float zo = ${(DOOR_Z + 0.25).toFixed(2)} - p.y;                                   // metres in from the outer edge
          float gr = vnoise(vec2(p.x * 2.3, p.y * 48.)) * 0.6 + vnoise(vec2(p.x * 9., p.y * 150.)) * 0.4, wear = vnoise(p * vec2(1.1, 3.)) * 0.6 + vnoise(p * vec2(4., 9.)) * 0.4;
          vec3 alb = mix(vec3(0.2, 0.145, 0.09), vec3(0.4, 0.32, 0.22), wear) * (0.55 + 0.75 * gr);
          
          float aa = clamp(1.6 - fwidth(p.y) * 34., 0., 1.), lay = smoothstep(0.3, 0.7, vnoise(p * vec2(1.3, 2.6) + 4.));   // strands only where the lens can hold them
          float hay = max(max(strands(p, 0.3, 42.), strands(p + 3., 1.9, 36.)), max(strands(p + 7., 2.6, 48.), strands(p + 11., 1.1, 30.)));
          alb *= 1. - 0.45 * aa * (1. - smoothstep(0.004, 0.02, abs(fract(zo * 2.4 + 0.2) - 0.5)));                           // joints between the boards
          hay = mix(0.22, hay, aa) * (0.35 + 0.65 * lay + 0.35 * smoothstep(1.1, 1.7, abs(p.x)));
          alb = mix(alb, mix(vec3(0.62, 0.47, 0.2), vec3(0.8, 0.68, 0.36), vnoise(p * 60.)), hay);
          vec2 cg = p / 0.075, ci = floor(cg), cf = fract(cg) - 0.5; float ch = hash21(ci), patchK = 1. - smoothstep(0.25, 0.95, length((p - vec2(0.05, ${(DOOR_Z - 0.3).toFixed(2)})) * vec2(1., 1.8)));
          float corn = step(1. - 0.3 * patchK, ch) * (1. - smoothstep(0.1, 0.2, length(cf - 0.5 * (vec2(hash21(ci + 3.), hash21(ci + 9.)) - 0.5)))); corn = mix(0.07 * patchK, corn, aa);
          alb = mix(alb, vec3(0.86, 0.6, 0.14), corn);
          // the sun stands to one side of the door: the post on that side throws its shadow slantwise over the board
          vec2 sd = uSunDir.xz / max(length(uSunDir.xz), 1e-3); float xh = (p.x + sd.x / max(sd.y, 0.2) * (zo + 0.15)) * uSide;
          float lit = 1. - smoothstep(1.62, 1.8, xh), len = 0.5 / max(uSunDir.y, 0.2) * length(uSunDir.xz);
          lit *= 1. - 0.92 * max(mshadow(p, uM0, -sd, len), mshadow(p, uM1, -sd, len));${SILL_PAIL ? `
          { vec2 pd = p - uPail.xy; float pal = dot(pd, -sd), ppe = abs(pd.y * sd.x - pd.x * sd.y);   // the pail's shadow (uPail: its middle on the board, its half width): as tall as a mitten's (len is 0.5 m of height), so as long
            lit *= 1. - 0.92 * (1. - smoothstep(uPail.z * 0.85, uPail.z * 1.2, ppe)) * smoothstep(-uPail.z, 0., pal) * (1. - smoothstep(len * 0.6, len, pal));
            // the spilt corn's own shadow, the same term: uHeap = the heap's middle on the board, its half width across the sun, its height as a share of the 0.5 m that len is for
            pd = p - uHeap.xy; pal = dot(pd, -sd); ppe = abs(pd.y * sd.x - pd.x * sd.y); float hl = max(len * uHeap.w, 0.02);
            lit *= 1. - 0.92 * (1. - smoothstep(uHeap.z * 0.85, uHeap.z * 1.2, ppe)) * smoothstep(-uHeap.z, 0., pal) * (1. - smoothstep(hl * 0.6, hl, pal)); }` : ''}
          lit *= 0.3 + 0.7 * cloudSoft(vec2(0., ${(DOOR_Z).toFixed(1)}));
          vec3 c = alb * (uSunCol * (uSunDir.y * 1.5 + 0.12 * (gr - 0.5) + 0.25 * hay) * lit + uSkyCol * 1.15);
          gl_FragColor = vec4(fogged(c, dist), 1.);
        }`,
    });
    { const g = new THREE.PlaneGeometry(3.5, 1.45).rotateX(-Math.PI / 2).translate(0, SILL_Y + 0.006, DOOR_Z - 0.475);
      const m = new THREE.Mesh(g, sillMat); m.name = 'ra-sill-top'; m.frustumCulled = false; root.add(m); }
    await ctx.yield();
    // ---- the loft: hay heaped to the walls, dark stone, six timber trusses under the slates, bales stacked behind the ring
    const lp = [], dstone = '#3A3733', beam = '#3B2C1F', roofY = (x) => 26.7 - Math.abs(x) * 0.762, zin = zi - 0.16;
    const hayY = (x, z) => LOFT_Y + 3.4 * sst(5.6, 11.2, Math.abs(x) + 1.3 * noise.n2(z * 0.11, 3.1)) * (0.75 + 0.3 * noise.n2(x * 0.2, z * 0.2)) * sst(zin, zin - 9, z) + 0.12 * noise.n2(x * 0.9, z * 0.9);
    { const g = new THREE.PlaneGeometry(22.4, zin - zb, 28, 54).rotateX(-Math.PI / 2).translate(0, 0, (zin + zb) / 2), q = g.attributes.position;
      for (let k = 0; k < q.count; k++) q.setY(k, hayY(q.getX(k), q.getZ(k)));
      g.computeVertexNormals(); lp.push(paint(g, '#B4A682', 8)); }
    await ctx.yield();
    lp.push(box(-11.25, -11.08, LOFT_Y, 18.2, zb, zin, dstone, 4), box(11.08, 11.25, LOFT_Y, 18.2, zb, zin, dstone, 4), box(-11.2, 11.2, LOFT_Y, 18.2, zb, zb + 0.12, dstone, 4));
    lp.push(paint(prism(22.4, 8.6, 0.1).translate(0, 18.2, zb + 0.07), dstone, 4));
    lp.push(box(-11.2, -2.2, LOFT_Y, 18.2, zin - 0.12, zin, dstone, 4), box(2.2, 11.2, LOFT_Y, 18.2, zin - 0.12, zin, dstone, 4), box(-2.2, 2.2, LINTEL_Y + 0.4, 18.2, zin - 0.12, zin, dstone, 4));
    lp.push(paint(prism(22.4, 8.6, 0.1).translate(0, 18.2, zin - 0.07), dstone, 4));
    for (const sx of [-1, 1]) {
      const L = Math.hypot(11.4, 11.4 * 0.762);
      lp.push(paint(new THREE.BoxGeometry(L, 0.1, zin - zb).translate(sx * L / 2, 0, 0).rotateZ(-sx * Math.atan(0.762)).translate(0, 26.86, (zin + zb) / 2), '#2A2018', 7));   // boards under the slates
      for (const px of [3.8, 7.6]) lp.push(box(sx * px - 0.16, sx * px + 0.16, roofY(px) - 0.42, roofY(px) - 0.1, zb, zin, beam, 7));                                      // purlins
    }
    for (let k = 0; k < 6; k++) {
      await ctx.yield();
      const z = zin - 5.2 - k * 8.6, tieY = 20.9, hx = (26.7 - tieY) / 0.762;
      for (const sx of [-1, 1]) {
        const L = Math.hypot(11.2, 11.2 * 0.762);
        lp.push(paint(new THREE.BoxGeometry(L, 0.42, 0.34).translate(sx * L / 2, 0, 0).rotateZ(-sx * Math.atan(0.762)).translate(0, 26.42, z), beam, 6));                   // principal rafter
        lp.push(box(sx * 8.3 - 0.2, sx * 8.3 + 0.2, LOFT_Y, roofY(8.3) - 0.3, z - 0.2, z + 0.2, beam, 5));                                                              // post
        lp.push(paint(new THREE.BoxGeometry(3.3, 0.26, 0.26).translate(1.65, 0, 0).rotateZ(sx > 0 ? Math.PI - 0.82 : 0.82).translate(sx * 8.3, tieY - 2.4, z), beam, 6));   // brace up to the tie
      }
      lp.push(box(-hx, hx, tieY - 0.2, tieY + 0.2, z - 0.18, z + 0.18, beam, 6), box(-0.18, 0.18, tieY, 26.3, z - 0.16, z + 0.16, beam, 5));                             // tie beam, king post
    }
    // bales stacked against the end wall in steps, with a round-shouldered bay left for the ring; the ring's light pools on them
    const br = rng.fork('bales');
    for (let row = 0; row < 7; row++) { await ctx.yield(); for (let i = -5; i <= 5; i++) {
      const x = i * 2.02 + (row % 2) * 1.0, y = LOFT_Y + 0.55 + row * 1.12, dz = Math.max(0, Math.abs(x) - 3.4) * 0.35 + row * 0.12;
      if (Math.hypot(x, (y - 14.7) * 1.05) < 4.3 && row < 6 || Math.abs(x) > 10.6 || y > roofY(x) - 1.4) continue;
      const jz = Math.sin(row * 7.13 + i * 3.71) * 0.5 + 0.5, g = new THREE.BoxGeometry(1.96, 1.08, 1.5, 2, 1, 1).rotateY(br.range(-0.07, 0.07)).translate(x, y, zb + 1.2 + dz + br.range(0, 0.25) + 0.3 * jz * jz);
      lp.push(paint(g, br.pick(['#B8A77E', '#AC9A70', '#C2B38C']), 13));
    } }
    await ctx.yield();
    const loftMat = litMat(shared, { side: THREE.DoubleSide, name: '-loft', amb: 0.5, sunK: 0, glow: 2.3, glowPos, glowMin: 0.5, glowFall: 0.0017, wrap: 0.5, air: new THREE.Vector3(0.021, zin, 0.2) });
    await ctx.yield();
    const loft = new THREE.Mesh(merge(lp), loftMat); loft.name = 'ra-loft'; loft.frustumCulled = false; root.add(loft);
    await ctx.yield();
    // ---- the sun comes in through the three slits and the open half of the door: sheets of lit dust slanting across the loft
    { const sp = [], su = [], sidx = [], bars = [], dir = sunDir.clone().negate();
      const sheet = (z, x0, h, gain) => {
        const x = sunSide * x0, y = roofY(x0) - 0.3, tf = (y - LOFT_Y - 6.9) / Math.max(0.05, -dir.y), tw = (10.9 + x0) / Math.max(0.05, Math.abs(dir.x)), t = Math.min(tw, tf), o = sp.length / 3;
        for (const [uu, vv] of [[0, 0], [0, 1], [1, 0], [1, 1]]) { sp.push(x + dir.x * t * uu, y + h * (vv - 0.5) + dir.y * t * uu, z + dir.z * t * uu); su.push(uu, vv, t, gain); }
        sidx.push(o, o + 1, o + 2, o + 1, o + 3, o + 2);
        bars.push([x + dir.x * t, z + dir.z * t, h / Math.max(0.2, Math.tan(el))]);
      };
      sheet(zin - 12, 6.6, 1.0, 0.5); sheet(zin - 22, 4.6, 0.85, 0.45); sheet(zin - 31, 6.0, 0.9, 0.4);
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(sp), 3)); g.setAttribute('aU', new THREE.BufferAttribute(new Float32Array(su), 4)); g.setIndex(sidx);
      const shaftMat = new THREE.ShaderMaterial({ name: 'ra-shaft', transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, uniforms: { ...shared },
        vertexShader: 'attribute vec4 aU; varying vec4 vU; varying vec3 vW; void main(){ vU = aU; vW = position; gl_Position = projectionMatrix * viewMatrix * vec4(position, 1.); }',
        fragmentShader: GLSL_COMMON + /* glsl */`
          varying vec4 vU; varying vec3 vW;
          void main(){
            float e = smoothstep(0., 0.5, vU.y) * (1. - smoothstep(0.5, 1., vU.y)), l = vU.x * vU.z;
            float d = vnoise(vec2(l * 0.5 - uTime * 0.12, vU.y * 5.)) * 0.6 + vnoise(vec2(l * 2.3 + uTime * 0.07, vU.y * 17.)) * 0.4;
            float dc = distance(vW, cameraPosition), a = e * e * (1. - vU.x) * (1. - 0.6 * vU.x) * smoothstep(0., 0.05, vU.x) * (0.4 + 0.8 * d) * smoothstep(1.2, 5., dc) * (1. - 0.55 * smoothstep(9., 30., dc));
            gl_FragColor = vec4(vec3(1., 0.78, 0.46) * 0.5 * vU.w * a, 1.);
          }` });
      const shafts = new THREE.Mesh(g, shaftMat); shafts.name = 'ra-shafts'; shafts.frustumCulled = false; shafts.renderOrder = 25; root.add(shafts);
    }
    await ctx.yield();

    // ---- the farm's company: a lean-to, a walled yard, a ladder to the hay door (somebody climbed up to wait), a hoist beam,
    // and three October trees in gold and rust. All of it stands beside or behind the door's plane: camera B never sees it.
    { let sd = 90127; const rnd = () => (sd = (sd * 16807) % 2147483647) / 2147483647, fp = [], tp = [];
      // lean-to against the left wall, slate roof sloping away
      fp.push(box(-19.5, -12, -2, 7.2, DOOR_Z - 34, DOOR_Z - 8, '#7B7C80', 4));
      fp.push(paint(new THREE.BoxGeometry(9.4, 0.3, 27.6).rotateZ(0.42).translate(-16.2, 9.4, DOOR_Z - 21), slate, 3));
      fp.push(box(-19.6, -19.4, 0, 5.2, DOOR_Z - 17, DOOR_Z - 13.4, '#2E2218', 5));
      // dry-stone walls: out from both front corners, then down the field's edge
      const wall = (x0, z0, x1, z1) => { const n = Math.max(1, Math.round(Math.hypot(x1 - x0, z1 - z0) / 5));
        for (let k = 0; k < n; k++) { const xa = lerp(x0, x1, k / n), xb = lerp(x0, x1, (k + 1) / n), za = lerp(z0, z1, k / n), zc = lerp(z0, z1, (k + 1) / n), xm = (xa + xb) / 2, zm = (za + zc) / 2, gy = heightAt(xm, zm);
          fp.push(paint(new THREE.BoxGeometry(Math.hypot(xb - xa, zc - za) + 0.3, 1.9 + 0.3 * rnd(), 0.9).rotateY(-Math.atan2(zc - za, xb - xa)).translate(xm, gy + 0.5, zm), rnd() < 0.5 ? '#66635C' : '#6F6B63', 4)); } };
      wall(12.2, DOOR_Z + 0.6, 52, DOOR_Z + 2.5); wall(-12.2, DOOR_Z + 0.6, -24, DOOR_Z + 1.2); wall(-31, DOOR_Z + 1.6, -58, DOOR_Z + 3.5); wall(52, DOOR_Z + 2.5, 56, DOOR_Z - 44); wall(-58, DOOR_Z + 3.5, -60, DOOR_Z - 50);
      fp.push(box(-25, -24, 0, 3.6, DOOR_Z + 0.7, DOOR_Z + 1.7, '#6F6A63', 4), box(-31, -30, 0, 3.6, DOOR_Z + 1.1, DOOR_Z + 2.1, '#6F6A63', 4));   // gate piers
      // the ladder: two rails and fourteen rungs, from the nettles to just under the sill
      const lz0 = DOOR_Z + 4.4, lz1 = DOOR_Z + 0.5, ly1 = SILL_Y - 1.0, lang = Math.atan2(lz0 - lz1, ly1), llen = Math.hypot(lz0 - lz1, ly1) + 0.45;   // its top stays under camera B's sight line over the sill
      for (const sx of [-1, 1]) fp.push(paint(new THREE.BoxGeometry(0.16, llen, 0.2).translate(0, llen / 2 - 0.3, 0).rotateX(-lang).translate(-1.05 + sx * 0.5, 0, lz0), '#8B7355', 5));
      for (let k = 1; k < 15; k++) { const t = k / 15; fp.push(paint(new THREE.BoxGeometry(1.0, 0.12, 0.14).translate(-1.05, ly1 * t, lerp(lz0, lz1, t)), '#7A6448', 6)); }
      // the hoist beam over the hay door, its iron hook
      fp.push(box(-0.22, 0.22, LINTEL_Y + 2.0, LINTEL_Y + 2.5, DOOR_Z - 0.4, DOOR_Z + 2.6, '#3A2A1C', 7), box(-0.05, 0.05, LINTEL_Y + 1.5, LINTEL_Y + 2.0, DOOR_Z + 2.3, DOOR_Z + 2.4, '#1A1614'));
      // flight4, THING TWO: the hay door's two upper leaves lie open on the gable's outer face from 2.2 m (where the jambs end)
      // to 3.9 m either side of the door's middle, sill to lintel; the lean-to's end wall toward the valley (the box above: x
      // -19.5 to -12, top 7.2, at DOOR_Z - 8; its roof the slab above) is closed up to its roof and given a door, a window, a verge
      if (barnFace) fp.push(...barnFace.lean);
      // flight4, THING THREE: the wagon stands in the yard right of the ladder, side-on to the valley: x +3 to +14, 5 to 9.5 m
      // out from the door's plane, its floor at y 3.2, its top at 7.5 (4 m and more under the loft's sight line over the
      // sill, which is 12.5 m up at 5 m out and 11.5 at 9.5), wheels 3.9 m across on the yard's ground. THE ONE MEND: the top
      // at 7.5 is the top rail of its two end gates and of the side rails between them; the hay's top is 6.75, under them
      if (YARD_WAGON) fp.push(...makeWagon({ x0: 3, x1: 14, z0: DOOR_Z + 5, z1: DOOR_Z + 9.5, ground: heightAt(8.5, DOOR_Z + 7.25), bedY: 3.2, topY: 7.5, load: 6.75, wheel: 3.9 }));
      await ctx.yield();
      const farm = new THREE.Mesh(merge(fp), litMat(shared, { name: '-farm', cloud: 0.6 })); farm.name = 'ra-farm'; farm.frustumCulled = false; root.add(farm);
      await ctx.yield();
      // trees: a forked stem and a crown of ragged leaf masses; part 14 is foliage (mottled, holed, swaying)
      const GOLD = ['#C9982A', '#B98A22', '#D8B03A', '#9C7A24', '#A8962E', '#C8A232'];
      for (const [tx, tz, H] of TREES) {
        const gy = heightAt(tx, tz) - 0.5;
        tp.push(paint(new THREE.CylinderGeometry(H * 0.022, H * 0.04, H * 0.56, 8).translate(tx, gy + H * 0.28, tz), '#4A3D33', 11));
        for (let k = 0; k < 4; k++) { const a = k * 1.7 + rnd() * 2, len = H * (0.28 + 0.1 * rnd()), tilt = 0.5 + 0.35 * rnd();
          tp.push(paint(new THREE.CylinderGeometry(H * 0.008, H * 0.018, len, 6).translate(0, len / 2, 0).rotateZ(tilt).rotateY(a).translate(tx, gy + H * (0.4 + 0.07 * k), tz), '#4A3D33', 11)); }
        for (let k = 0; k < 13; k++) {
          const a = rnd() * 6.283, rr = H * 0.3 * Math.sqrt(rnd()), yy = gy + H * (0.5 + 0.44 * rnd()), r = H * (0.13 + 0.09 * rnd()) * (1 - 0.35 * Math.abs(yy - gy - H * 0.7) / (H * 0.3));
          const g = new THREE.IcosahedronGeometry(r, 2), q = g.attributes.position;
          for (let i = 0; i < q.count; i++) { const x = q.getX(i), y = q.getY(i), z = q.getZ(i), b = 1 + 0.22 * noise.n2(x * 0.5 + k * 7, y * 0.5 + z * 0.5); q.setXYZ(i, x * b, y * b * 0.8, z * b); }
          g.computeVertexNormals(); tp.push(paint(g.translate(tx + Math.cos(a) * rr, yy, tz + Math.sin(a) * rr), GOLD[Math.floor(rnd() * GOLD.length)], 14));
        }
        await ctx.yield();
      }
      const trees = new THREE.Mesh(merge(tp), litMat(shared, { name: '-trees', cloud: 0.7, rim: 0.35, side: THREE.DoubleSide })); trees.name = 'ra-trees'; trees.frustumCulled = false; root.add(trees);
    }
    await ctx.yield();

    // ---- flecks: chaff streaming off the eave across the door, hay dust in the loft (one shader, two boxes)
    const fleckMat = (name, org, bx, vel, size, col, far) => new THREE.ShaderMaterial({
      name, transparent: true, depthWrite: false,
      uniforms: { ...shared, uOrg: { value: org }, uBox: { value: bx }, uVel: { value: vel }, uSize: { value: size }, uCol: { value: col }, uFar: { value: far } },
      vertexShader: GLSL_COMMON + /* glsl */`
        attribute vec3 aSeed; uniform vec3 uOrg, uBox, uVel; uniform float uSize, uFar; varying float vTw, vFar; varying vec2 vQ;
        void main(){
          vec3 f = fract(aSeed + uVel * uTime * (0.7 + 0.6 * aSeed.z)); f.y = fract(f.y + 0.06 * sin(uTime * 1.3 + aSeed.x * 30.));
          vec4 c = projectionMatrix * viewMatrix * vec4(uOrg + f * uBox, 1.);
          float half_ = max(uSize * projectionMatrix[1][1], 1.5 / max(uRes.y, 1.) * c.w), ang = uTime * (2. + 3. * aSeed.y) + aSeed.x * 40., ca = cos(ang), sa = sin(ang);
          vec2 o = vec2(position.x * 3.4, position.y * 0.55); o = vec2(o.x * ca - o.y * sa, o.x * sa + o.y * ca);
          c.xy += o * half_ * vec2(uRes.y / max(uRes.x, 1.), 1.);
          vTw = 0.55 + 0.45 * sin(ang * 1.7); vFar = 1. - smoothstep(uFar * 0.4, uFar, c.w); vQ = position.xy;   // smooth across the quad
          gl_Position = c;
        }`,
      fragmentShader: GLSL_COMMON + 'uniform vec3 uCol; varying float vTw, vFar; varying vec2 vQ; void main(){ float a = (1. - smoothstep(0.3, 1., abs(vQ.x))) * (1. - smoothstep(0.2, 1., abs(vQ.y))); gl_FragColor = vec4(uCol * (0.35 + 0.9 * vTw), a * 0.8 * vFar); }',
    });
    const fleckGeo = (n, fr) => { const g = new THREE.InstancedBufferGeometry().copy(new THREE.PlaneGeometry(2, 2)), s = new Float32Array(n * 3); for (let i = 0; i < n * 3; i++) s[i] = fr(); g.instanceCount = n; g.setAttribute('aSeed', new THREE.InstancedBufferAttribute(s, 3)); return g; };
    const fr = rng.fork('flecks');
    const chaff = new THREE.Mesh(fleckGeo(Math.round(34 * Math.max(0.6, detail)), fr), fleckMat('ra-chaff', new THREE.Vector3(-9, 12.6, DOOR_Z + 0.5), new THREE.Vector3(18, 3.6, 8), new THREE.Vector3(sunSide * 0.11, -0.035, 0.03), 0.0105, new THREE.Color(1.0, 0.66, 0.2), 26));
    const dust = new THREE.Mesh(fleckGeo(Math.round(420 * Math.max(0.6, detail)), fr), fleckMat('ra-dust', new THREE.Vector3(-5, LOFT_Y + 0.3, zb + 1), new THREE.Vector3(10, 7.5, 50), new THREE.Vector3(0.035, 0.05, 0.02), 0.017, new THREE.Color(1.1, 0.78, 0.38), 400));
    const needles = new THREE.Mesh(fleckGeo(Math.round(170 * Math.max(0.6, detail)), fr), fleckMat('ra-needles', new THREE.Vector3(-19, 2.5, -578), new THREE.Vector3(26, 13, 42), new THREE.Vector3(0.02, -0.22, 0.03), 0.022, new THREE.Color(0.42, 0.36, 0.14), 45));
    for (const sx of [-1, 1]) { const lv = new THREE.Mesh(fleckGeo(Math.round(60 * Math.max(0.6, detail)), fr), fleckMat('ra-leaves', new THREE.Vector3(sx > 0 ? 13 : -46, 0.5, DOOR_Z - 44), new THREE.Vector3(33, 24, 52), new THREE.Vector3(sunSide * 0.04, -0.09, 0.02), 0.05, new THREE.Color(1.4, 1.02, 0.2), 130));
      lv.name = 'ra-leaves'; lv.frustumCulled = false; lv.renderOrder = 30; root.add(lv); }
    needles.name = 'ra-needles'; needles.frustumCulled = false; needles.renderOrder = 30; root.add(needles);
    chaff.name = 'ra-chaff'; dust.name = 'ra-dust'; chaff.frustumCulled = dust.frustumCulled = false; chaff.renderOrder = dust.renderOrder = 30; root.add(chaff, dust);
    await ctx.yield();

    // ---- the two ends of the event: camera B and its quad, the bird as B sees it, the tips as A sees them, the waiter
    const cut = makeCut(ctx, { eye: EYE }); scene.add(cut.quad);
    const glint = makeGlint(shared), feather = makeLooseFeather(shared), spark = makeGlint(shared), bird = makePigeon(shared);
    await ctx.yield();
    const falcon = makeFalcon(shared, hunter);
    await ctx.yield();
    spark.mat.uniforms.uFlut.value = 1; spark.mat.uniforms.uDash.value = 0; spark.mat.uniforms.uCol.value.set(1, 0.69, 0.35); spark.setPos(new THREE.Vector3(0, 15.0, DOOR_Z + 0.3)); root.add(spark.mesh);
    // the moment after the strike: a burst of small white feathers hangs where we were, spreads, sinks, and thins to the one that is left
    const burstGeo = new THREE.InstancedBufferGeometry().copy(new THREE.PlaneGeometry(2, 2)); burstGeo.instanceCount = 18;
    { const bs = new Float32Array(54); for (let i = 0; i < 54; i++) { const h = Math.sin(i * 12.9898 + 4.1) * 43758.5453; bs[i] = h - Math.floor(h); } burstGeo.setAttribute('aSeed', new THREE.InstancedBufferAttribute(bs, 3)); }
    const burstMat = new THREE.ShaderMaterial({ name: 'ra-burst', transparent: true, depthWrite: false, side: THREE.DoubleSide,
      uniforms: { ...shared, uPos: { value: new THREE.Vector3() }, uPx: { value: 6 }, uGain: { value: 0 }, uAge: { value: 0 } },
      vertexShader: GLSL_COMMON + /* glsl */`
        attribute vec3 aSeed; uniform vec3 uPos; uniform float uPx, uAge; varying vec2 vQ;
        void main(){
          float an = aSeed.x * 6.2832, rr = (0.25 + 0.75 * aSeed.y) * (1.5 + 9. * (1. - exp(-uAge * 3.)));
          vec3 c = uPos + vec3(cos(an) * rr, sin(an) * rr * 0.7 - uAge * (1.2 + 2. * aSeed.z) + 0.5 * sin(uTime * 1.1 + aSeed.x * 20.), (aSeed.z - 0.5) * 4.);
          vec4 cp = projectionMatrix * viewMatrix * vec4(c, 1.);
          float a = uTime * (1.5 + 2. * aSeed.y) + aSeed.x * 30., flip = 0.3 + 0.7 * abs(cos(uTime * (1.3 + aSeed.z) + aSeed.y * 9.)), ca = cos(a), sa = sin(a);
          vec2 o = vec2(position.x * 0.4 * flip, position.y); o = vec2(o.x * ca - o.y * sa, o.x * sa + o.y * ca);
          cp.xy += o * uPx * (0.6 + 0.6 * aSeed.z) / max(uRes, vec2(1.)) * cp.w * 2.;
          vQ = position.xy; gl_Position = cp;
        }`,
      fragmentShader: GLSL_COMMON + /* glsl */`
        uniform float uGain; varying vec2 vQ;
        void main(){
          float y = vQ.y * 0.5 + 0.5, wd = sqrt(max(sin(3.1416 * clamp(y, 0., 1.)), 0.)) * (0.55 + 0.45 * y);
          gl_FragColor = vec4(vec3(1.2, 1.16, 1.05), (1. - smoothstep(wd * 0.7, max(wd, 1e-6), abs(vQ.x))) * uGain);
        }` });
    const burst = new THREE.Mesh(burstGeo, burstMat); burst.name = 'ra-burst'; burst.frustumCulled = false; burst.renderOrder = 50; burst.visible = false; root.add(burst);
    bird.group.visible = false; falcon.mesh.visible = false;
    if (hunter === 'goshawk') falcon.mesh.material.uniforms.uTint.value.set('#C9B9A6');
    root.add(glint.mesh, feather.mesh, bird.group, falcon.mesh);
    await ctx.yield();
    await ctx.yield();
    const waiter = makeWaiter(shared); waiter.mesh.material.uniforms.uTint.value.setRGB(2.4, 2.4, 2.5); waiter.group.position.set(0, LOFT_Y, EYE.z); root.add(waiter.group);
    const sleeveGeo = makeSleeveGeometry(), sleeveMat = litMat(shared, { name: '-sleeve', color: new THREE.Color(3.3, 3.2, 3.5), amb: 1.5, rim: 0.7, side: THREE.DoubleSide });
    const withSleeves = (m) => { for (const h of [m.L, m.R]) { const s = new THREE.Mesh(sleeveGeo, sleeveMat); s.frustumCulled = false; h.add(s); } return m; };
    const sillMit = withSleeves(makeMittens(shared)), figMit = makeMittens(shared);
    await ctx.yield();
    const carMit = withSleeves(makeMittens(shared, 1.05, { sunK: 0, amb: 0.85, rim: 0.55, glow: 4.6, glowPos, glowFall: 0.002, glowMin: 0.13, wrap: 0.85 })), rareMit = withSleeves(makeMittens(shared, 0.72)), carRare = withSleeves(makeMittens(shared, 0.7, { sunK: 0, amb: 0.85, rim: 0.55, glow: 4.6, glowPos, glowFall: 0.002, glowMin: 0.13, wrap: 0.85 }));
    sillMit.group.visible = false; rareMit.group.visible = false; root.add(sillMit.group, rareMit.group); waiter.group.add(figMit.group);
    // breath: one soft puff every 2.4 s across the bottom of B's frame
    const breathGeo = new THREE.InstancedBufferGeometry().copy(new THREE.PlaneGeometry(2, 2)); breathGeo.instanceCount = 9;
    breathGeo.setAttribute('aI', new THREE.InstancedBufferAttribute(new Float32Array([0, 0.11, 0.22, 0.33, 0.44, 0.55, 0.66, 0.77, 0.88]), 1));
    const breathMat = new THREE.ShaderMaterial({ name: 'ra-breath', transparent: true, depthWrite: false, uniforms: { ...shared, uMouth: { value: new THREE.Vector3(EYE.x, EYE.y - 0.5, EYE.z + 0.35) }, uGain: { value: 1 } },
      vertexShader: GLSL_COMMON + /* glsl */`
        attribute float aI; uniform vec3 uMouth; uniform float uGain; varying vec2 vQ; varying float vA, vS;
        void main(){
          float f = fract(uTime / 2.4 + 0.3), g = clamp(f * 1.7 - aI * 0.5, 0., 1.), h = hash21(vec2(aI, 4.));
          vec3 c = uMouth + vec3((h - 0.5) * 0.7 * g + 0.3 * g * g, -0.2 + 0.08 * h + 0.3 * g * g, 0.6 + 1.3 * sqrt(max(g, 0.)));
          vec4 mv = viewMatrix * vec4(c, 1.); mv.xy += position.xy * (0.1 + 0.3 * g);
          vQ = position.xy; vA = smoothstep(0., 0.15, g) * (1. - g) * (1. - g) * uGain; vS = aI;   // smooth across the quad, one seed per puff
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: GLSL_COMMON + /* glsl */`
        varying vec2 vQ; varying float vA, vS;
        void main(){
          float r = length(vQ), n = vnoise(vQ * 1.8 + vS * 17. + vec2(uTime * 0.2, 0.)) * 0.6 + vnoise(vQ * 4.3 + vS * 5.) * 0.4;
          gl_FragColor = vec4(uSunCol * vec3(0.5, 0.47, 0.42) + vec3(0.22, 0.27, 0.34), (1. - smoothstep(0.05 + 0.3 * n, 1., r)) * vA * 0.2);   // breath against the light
        }` });
    const breath = new THREE.Mesh(breathGeo, breathMat); breath.name = 'ra-breath'; breath.frustumCulled = false; breath.renderOrder = 40; breath.visible = false; root.add(breath);
    // carried with camera A: the two tips, the mittens that catch us, the white of the smoke
    const carried = new THREE.Group(); carried.name = 'ra-carried'; carried.matrixAutoUpdate = false; scene.add(carried);
    await ctx.yield();
    const tips = makeTips(shared, { glowPos, glow: 0, glowFall: 0.002, glowMin: 0.06, wrap: 0.5 }); carried.add(tips.left, tips.right, carMit.group, carRare.group); carMit.group.visible = false; carRare.group.visible = false;
    const veil = new THREE.Mesh(new THREE.PlaneGeometry(6, 4), new THREE.MeshBasicMaterial({ color: new THREE.Color(0.88, 0.87, 0.84), transparent: true, opacity: 0, depthTest: false, depthWrite: false, fog: false }));
    veil.position.z = -0.6; veil.renderOrder = 60; veil.frustumCulled = false; carried.add(veil);
    const entryM = path.frameAt(false, new THREE.Matrix4());
    await ctx.yield();

    // ---- per-frame state
    const P = new THREE.Vector3(), T = new THREE.Vector3(), R = new THREE.Vector3(), camPos = new THREE.Vector3(), buf = new THREE.Vector2(), v = new THREE.Vector3(), v2 = new THREE.Vector3(), v3 = new THREE.Vector3();
    const UP = new THREE.Vector3(0, 1, 0), strike = path.pointAt(0.689), m4 = new THREE.Matrix4(), m4b = new THREE.Matrix4(), qa = new THREE.Quaternion(), eul = new THREE.Euler();
    const renderer = ctx.renderer, gU = groundMat.uniforms, sU = smokeMat.uniforms;
    // our shadow is drawn 30 degrees off the valley's axis, not the sun's true 50, so that it runs inside A's frame (B never sees it)
    const shx = sunSide * 0.5 * Math.cos(el), shz = 0.866 * Math.cos(el);
    const shadowAt = (pos, out) => { let t = (pos.y - heightAt(pos.x, pos.z)) / sunDir.y; for (let k = 0; k < 2; k++) t = (pos.y - heightAt(pos.x - shx * t, pos.z - shz * t)) / sunDir.y; out.set(pos.x - shx * t, pos.z - shz * t); };
    // the loose feather is let go 15 m over the strike and comes down the wind: 2 m/s of wind (the chaff's) on a fall of 2.1 m/s
    feather.mat.uniforms.uTop.value = strike.y + 15; feather.mat.uniforms.uWind.value = sunSide * 0.95;
    const sh2 = new THREE.Vector2(), sillZ = DOOR_Z - 0.35, holeB = smokeKind === 2 ? 12 : 16, Pb = new THREE.Vector3(), Pf = new THREE.Vector3(), Tb = new THREE.Vector3(0, 0, -1);
    const sillPair = [[sillMit.L, 1], [sillMit.R, -1]];   // made once: update() makes no arrays
    // flight4, THING ONE: the corn pail. It stands on the sill board on the hands' own line (sillZ), 1.15 m from the sill's
    // middle on the side away from the rare second pair (that pair stands at x +1.0 to +1.36, so the pail is at -1.15, between
    // the resting hand at -0.62 and the post at -1.75). Lying (THE ONE MEND), it lies where it fell: its foot's end 0.30 m
    // clear of the post's face (x -1.45), its mouth toward the sill's middle; the corn is a heap of kernels before the mouth
    // that stops 0.10 m short of the gripping hand: that hand's wool reaches x -0.74 beside the pail and -0.82 at the board's
    // outer edge, where its knuckles are (shots/reverse-angle/flight4/poses.mjs), and a kernel is 0.025 m by half, so no
    // kernel's middle passes x -0.87 on the board or -0.95 at its outer edge (the rim is 0.25 from sillZ, the outer edge
    // DOOR_Z + 0.25 is 0.6 from it). It is a child of the world, drawn for both
    // cameras. Its sun is the sill's own post-shadow law at its place (the sill shader's `lit`): when the sun stands on
    // the pail's side of the door the post shades it. The corn is the sill shader's own corn colour.
    let pail = null;
    if (SILL_PAIL) {
      const PX = -1.15, zo = DOOR_Z + 0.25 - sillZ, sdx = sunDir.x / Math.hypot(sunDir.x, sunDir.z), sdz = sunDir.z / Math.hypot(sunDir.x, sunDir.z);
      const inSun = 1 - sst(1.62, 1.8, (PX + sdx / Math.max(sdz, 0.2) * (zo + 0.15)) * sunSide);
      const g = makePail({ x: PX, y: SILL_Y + 0.006, z: sillZ, foot: -1.75 + 0.30, stop: -0.74 - 0.10 - 0.03, stop2: -0.82 - 0.10 - 0.03, mid: 1, reach: zo - 0.25, corn: new THREE.Color(0.86, 0.6, 0.14) });
      const mat = litMat(shared, { name: '-pail', cloud: 1, amb: 1.0, rim: 0.3, sunK: inSun });
      const up = new THREE.Mesh(g.up, mat), down = new THREE.Mesh(g.down, mat); up.name = 'ra-pail'; down.name = 'ra-pail-lying'; up.frustumCulled = down.frustumCulled = false; down.visible = false; root.add(up, down);
      // the heap's shadow: half as wide as the heap is across the sun's bearing (its half axes are g.heap[2] along the sill and g.heap[3] across it), as long as its 0.075 m is of the 0.5 m the sill's shadows are drawn for
      const heapW = Math.hypot(g.heap[2] * sdz, g.heap[3] * sdx);
      pail = { up, down, x: PX, lie: g.lie, uni: sillMat.uniforms.uPail.value, heap: sillMat.uniforms.uHeap.value, hx: g.heap[0], hw: heapW, hk: g.heap[4] / 0.5 }; pail.uni.set(PX, sillZ, 0.25, 0);
      await ctx.yield();
    }
    const poseMitten = (m, x, y, z, rx, ry, rz) => { m.position.set(x, y, z); m.rotation.set(rx, ry, rz, 'YXZ'); };
    // a mitten held out toward a point in the sky: fingers along the line to it, the sleeve trailing back to the child
    // level: the hand is held out along the eye's own level line toward the target's bearing (no higher), so that hand and
    // sleeve lie wholly under the eye's horizontal plane, and so under every far skyline (the moor stands 2 to 3.3 degrees above it)
    const pointMitten = (m, k, side, target, level) => {
      if (k <= 0) return;
      v.subVectors(target, EYE); if (level) v.y = 0; v.normalize(); v2.copy(EYE).addScaledVector(v, 2.3); v2.y -= 0.22; v2.x += side * 0.12;   // the fingertip: just under the line to the point
      v.set(EYE.x + side * 0.62, EYE.y - 0.8, EYE.z + 0.25); v.subVectors(v2, v).normalize();                          // the arm: from the child's shoulder to the fingertip
      v2.addScaledVector(v, -0.5);
      m.position.lerp(v2, k); qa.setFromUnitVectors(UP, v); m.quaternion.slerp(qa, k);
    };

    const update = (dt, time, camera, u) => {
      // the beat: one function of the clock for both cameras (the brief: fract(time x 2.5)); nothing of the flight is in it
      const beat = beatOf(time), p = pulseOf(beat), B = u > 0 && inB(u);
      shared.uTime.value = time; shared.uBeat.value = beat; shared.uBrake.value = sst(0.857, 0.925, u);
      shared.uU.value = u;
      shared.uSweep.value.set(lerp(-700, -340, sst(0.7, 0.9, u)), sst(0.705, 0.75, u) * (1 - sst(0.84, 0.9, u)) * 0.92, 0);   // one broad shadow crosses the wood while the sky is empty
      renderer.getDrawingBufferSize(buf); shared.uRes.value.copy(buf);
      path.pointAt(u, P); path.tangentAt(u, T); R.crossVectors(T, UP).normalize();
      camPos.setFromMatrixPosition(camera.matrixWorld);
      const distB = P.distanceTo(EYE);

      // --- what we do to the valley, seen from both ends
      shadowAt(P, sh2); gU.uBird.value.set(sh2.x, sh2.y, 3.1 * (0.7 + 0.3 * Math.cos((beat - 0.25) * Math.PI * 2) ** 2), 0.9 * (1 - sst(0.842, 0.862, u)));
      const open = u >= 0.485, rise = Math.max(0, u - 0.485) * 70;
      path.pointAt(Math.min(Math.max(u, 0.485), 0.535), v);   // the hole is torn the way we went: its middle is dragged part of the way after us, then stays
      sU.uNotchR.value = open ? 3.0 * (1 - sst(0.6, 0.66, u)) + 0.01 : 0.01; sU.uNotch.value.set(pAt.x + rise * LEAN.x + 0.45 * (v.x - pAt.x), pAt.y + rise + 0.45 * (v.y - pAt.y), pAt.z + rise * LEAN.y);
      sU.uBirdPos.value.copy(P); sU.uTrail.value = open ? 1 - sst(0.53, 0.6, u) : 0; sU.uGust.value = gustOf(u); sU.uSink.value = smokeKind === 2 ? 20 * (1 - sst(0.33, 0.45, u)) : 0;   // the mist lies low on the spur, under the point's sky, and lifts into our way as we come
      veil.material.opacity = sst(0.4775, 0.487, u) * (u < 0.492 ? 1 : 0);

      // --- the hunter: into the top of our frame from 0.66, talons at 0.689; then two flecks tangled, falling behind the wood
      const fOn = u > 0.652 && u < 0.725; falcon.mesh.visible = fOn; gU.uFalc.value.w = 0;
      if (fOn) {
        if (u < 0.689) {
          const k = sst(0.655, 0.689, u);
          v.set(lerp(2.4, 0.2, k), lerp(5.6, 0.95, k), lerp(-7, -3.3, k)).applyMatrix4(camera.matrixWorld); falcon.mesh.position.copy(v);   // held in A's frame: it is A's shot
          v2.copy(v).sub(camPos).normalize(); v2.y -= lerp(0.3, 1.1, k); m4.lookAt(v2, v.set(0, 0, 0), UP); falcon.mesh.quaternion.setFromRotationMatrix(m4);
          gU.uFalc.value.set(gU.uBird.value.x + R.x * lerp(11, 0.7, k), gU.uBird.value.y + R.z * lerp(11, 0.7, k) + lerp(6, 0.5, k), 3.6, 0.85 * sst(0.652, 0.662, u));
        } else {
          const a = time * 6.5; falcon.mesh.position.copy(P).addScaledVector(R, Math.cos(a) * 1.4).addScaledVector(UP, 0.9 + Math.sin(a) * 0.9);
          falcon.mesh.rotation.set(a * 0.7, a, 0.6);
        }
      }
      feather.mat.uniforms.uGain.value = 1;   // the plain state of its own shot: the mesh is shown only while the pair is gone (the third return), and for all of it the feather is on in full
      feather.setPos(v.set(strike.x + 5 + Math.sin(time * 0.7) * 3.5, strike.y + 15 - (u - 0.689) * 95 + Math.sin(time * 1.3) * 0.8, strike.z));   // it falls slowly, alone in the blue
      feather.mat.uniforms.uPx.value = Math.max(10, buf.y / 36);
      const dDoor = Math.hypot(camPos.x, camPos.z - DOOR_Z); spark.mat.uniforms.uGain.value = sst(170, 300, dDoor); spark.mat.uniforms.uPx.value = Math.max(buf.y / 110, 4);

      // --- the waiter. A sees a hooded figure in the door; from 0.87 both mittens go up
      const raise = sst(0.87, 0.915, u);
      poseMitten(figMit.L, lerp(0.7, 0.85, raise), lerp(2.62, 4.25, raise), lerp(1.9, 0.75, raise), lerp(0.5, 0, raise), 0, lerp(0, -0.25, raise));
      poseMitten(figMit.R, -lerp(0.7, 0.85, raise), lerp(2.62, 4.25, raise), lerp(1.9, 0.75, raise), lerp(0.5, 0, raise), 0, lerp(0, 0.25, raise));
      waiter.setArm(0, waiter.shoulders[1], figMit.L.position); waiter.setArm(1, waiter.shoulders[0], figMit.R.position);
      // B's own mittens on the sill: point (0.24), point again and hold (the second return), grip (the third), rise for the catch (0.911 on)
      // The grip and the second pointing are each the state of their own shot (B_SHOTS[2], B_SHOTS[1]): a plain step at the
      // cut, 1 while that shot is on screen and 0 otherwise (the sill hands are drawn in camera B's shots only, so a hand that
      // changes between shots is never seen to move). Nothing of the waiter moves inside either shot. The palm-up turn of
      // the catch has no window of its own: it rides the lift's ease (up)
      const grip = u >= B_SHOTS[2][0] && u < B_SHOTS[2][1] ? 1 : 0, up = sst(0.911, 0.926, u), reach = sst(0.918, 0.9287, u);
      const point2 = u >= B_SHOTS[1][0] && u < B_SHOTS[1][1] ? 1 : 0, turn = up;
      const my =SILL_Y - 0.1 + 0.16 * grip + 0.1 * up + 0.06 * reach + 0.012 * Math.sin(time * 1.9) * (1 - grip), mrx = 0.12 + 0.8 * grip + 0.5 * up + 0.25 * reach;
      const mz = sillZ + 0.1 * grip + 0.3 * up + 0.2 * reach, mrz = 0.5 * up + 0.12 * grip;
      for (let hi = 0; hi < 2; hi++) { const m = sillPair[hi][0], sg = sillPair[hi][1];
        // at rest on the sill: backs of the hands to the eye, turned a little toward each other, breathing
        let x = 0.62, y = SILL_Y - 0.1 + 0.012 * Math.sin(time * 1.9 + (sg > 0 ? 0 : 0.7)) * (1 - grip) * (1 - up) * (1 - point2), z = sillZ, rx = 0.2, ry = -0.18, rz = 0.08;
        // the grip: each hand where it was (0.62 m either side, most of a metre of bare sill between them). The forearm lies low
        // over the board, 10 degrees up (rx 1.4 = 90 - 10), the cuff (0.1 m thick) resting on it; the hand is cocked back at the
        // wrist so that its back faces the eye, the knuckles (0.3 m out from the wrist: 0.2 of cuff, then 0.17 of hand at 53
        // degrees) stand over the sill's outer edge (DOOR_Z + 0.25) and the fingers go down over it. The two bends are in the
        // wool's own shader (uGrip); the thumb is folded under the palm
        y = lerp(y, SILL_Y + 0.1, grip); z = lerp(z, DOOR_Z + 0.25 - 0.3, grip); rx = lerp(rx, 1.4, grip); ry = lerp(ry, 0, grip); rz = lerp(rz, 0, grip);
        // one child's two arms, not a pair: the hand on the side away from the second pair's place stays where it rested, 0.62 m
        // from the middle of the sill (the live version's own place for it; the posts stand at 1.75), its sleeve turned 0.2 rad
        // outward; the other has come in to 0.42 from the middle, its elbow dropped (the forearm 10 degrees steeper) and its wrist
        // rolled a quarter of the way over, thumb side up. The two hands are 1.04 m apart on the sill, bare board between them
        x = lerp(x, sg < 0 ? 0.62 : 0.42, grip); rx += (sg < 0 ? 0 : -0.18) * grip; ry += (sg < 0 ? 0.2 : -0.1) * grip; rz += (sg < 0 ? 0 : 0.4) * grip;
        // the catch: two open hands, palm up, lifted from the sill to just under where the bird's feet will be (y 14.75)
        x = lerp(x, 0.36, up); y = lerp(y, 13.9 + 0.12 * reach, up); z = lerp(z, EYE.z + 1.75, up); rx = lerp(rx, 0.95, up); ry = lerp(ry, 0.25, up); rz = lerp(rz, -0.25, up);
        m.position.set(sg * x, y, z); m.rotation.set(rx, sg * ry, sg * rz, 'YXZ'); m.rotateY(sg * Math.PI * turn);
      }
      sillMit.mat.uniforms.uGrip.value = grip;
      // the second return: the right hand points along the line toward the smoke column and holds; the left rests on the sill
      pointMitten(sillMit.R, point2, -1, pAt, true);
      pointMitten(sillMit.R, sst(0.222, 0.246, u) * (1 - sst(0.33, 0.36, u)), -1, P);
      sillMat.uniforms.uM0.value.copy(sillMit.L.position); sillMat.uniforms.uM1.value.copy(sillMit.R.position);
      // the pail belongs to the gripping hand: standing until the grip is taken, lying ever after (the grip's own cut, read by
      // its name; a plain step at a cut, never seen moving). Its shadow on the board is 0.25 m half wide standing, 0.33 lying
      if (pail) { const lying = u >= B_SHOTS[2][0]; pail.up.visible = !lying; pail.down.visible = lying; pail.uni.set(lying ? pail.lie[0] : pail.x, sillZ, lying ? 0.33 : 0.25, 0); pail.heap.set(lying ? pail.hx : 999, lying ? sillZ : 999, pail.hw, pail.hk); }
      if (rare) {
        poseMitten(rareMit.L, 1.36 - 0.12 * grip, my + 0.07, mz, mrx, 0, mrz); poseMitten(rareMit.R, 1.0 + 0.12 * grip, my + 0.07, mz, mrx, 0, -mrz);
        pointMitten(rareMit.R, sst(0.2, 0.225, u) * (1 - sst(0.33, 0.36, u)), 1, P);
      }
      loft.material.uniforms.uGlow.value = 2.3 * (1 + 0.13 * Math.sin(time * 2.1) + 0.07 * Math.sin(time * 5.3));   // the ring's light breathes on the hay
      breathMat.uniforms.uGain.value = 1 - sst(0.695, 0.71, u) * (1 - sst(0.795, 0.805, u));

      // --- carried with A: parked at the entry pose while we are only seen through the previous portal (u = 0)
      carried.matrix.copy(u > 0 ? camera.matrixWorld : entryM); carried.matrixWorldNeedsUpdate = true;
      const e = camera.projectionMatrix.elements, hw = 1 / Math.max(1e-4, e[0]), hh = 1 / Math.max(1e-4, e[5]);
      const hold = sst(0.9287, 0.94, u) * (1 - sst(0.965, 0.99, u)), cOn = u >= 0.9287, pb = p * (1 - hold), ex = Math.min(hw, hh * 1.9);
      // we bank into the valley's turns: the wing on the inside of the turn drops into the frame, the other lifts out of it
      path.tangentAt(Math.min(1, u + 0.02), v2); const bank = Math.max(-1, Math.min(1, (T.x * v2.z - T.z * v2.x) * 9)) * (1 - hold) * (u > 0 ? 1 : 0);
      for (const [tip, s] of [[tips.left, -1], [tips.right, 1]]) {   // beating in the top corners; folded down the sides of the frame while we are held
        m4.makeTranslation(s * (ex + lerp(lerp(0.44, 0.17, pb) - 0.1 * s * bank, 0.24, hold)), lerp(hh + lerp(0.36, 0.15, pb) + 0.16 * s * bank, 0.2 + 0.012 * Math.sin(time * 3.1 + s), hold), -1);
        m4b.makeRotationZ(s * lerp(0.16 * (1 - pb), 0.06, hold) + 0.2 * bank); tip.matrix.copy(m4).multiply(m4b); tip.matrixWorldNeedsUpdate = true;
      }
      tips.mat.uniforms.uAmb.value = lerp(1.2, 0.5, hold); tips.mat.uniforms.uGlow.value = 3.4 * hold;
      tips.mat.uniforms.uStroke.value = 1 - hold;   // the hand works the air while we fly and lies folded while we are held (the same hold that folds the pair above)
      carMit.group.visible = cOn; carRare.group.visible = cOn && rare;
      if (cOn) {   // red wool comes round us from both sides and under: fingers toward the middle, thumbs up
        const w = Math.min(1, hw / 0.92), sink = sst(0.965, 0.99, u), bob = 0.02 * Math.sin(time * 2.1);
        const cx = lerp(1.6, 0.74, hold) * w, cy = lerp(-0.95, -0.5, hold) - 0.5 * sink + bob, rz = lerp(1.1, 1.42, hold);
        poseMitten(carMit.R, cx, cy, -0.82, -0.35, -0.25, rz); poseMitten(carMit.L, -cx, cy, -0.82, -0.35, 0.25, -rz);   // in from the lower corners: fingers to the middle, thumbs on top
        if (rare) { poseMitten(carRare.R, cx + 0.2, cy + 0.0 - 0.25 * (1 - hold), -0.7, -0.3, -0.4, rz - 0.35); poseMitten(carRare.L, -cx - 0.2, cy + 0.0 - 0.25 * (1 - hold), -0.7, -0.3, 0.4, -rz + 0.35); }
      }

      // --- THE CUT
      const birdNear = distB < 330;
      glint.setPos(P); glint.mat.uniforms.uGain.value = sst(80, 200, distB);
      glint.mat.uniforms.uPx.value = Math.max(buf.y / 37, 5, 2.4 / Math.max(1, distB * 2 * Math.tan(cut.camB.fov * Math.PI / 360)) * buf.y);
      if (B) {
        sky.position.copy(EYE);
        root.visible = true; cut.quad.visible = false; carried.visible = false; waiter.group.visible = false;
        // the held empty sky: from the strike the two flecks fall behind the wood, and until the cut back there is no bird to see
        const gone = u >= 0.689 && u < 0.801, kf = Math.min(1, Math.max(0, (u - 0.689) / 0.016)), drop = gone ? 30 * kf * kf : 0;   // let go at the strike, they fall: the drop grows as the square of the ramp, 30 m at its end
        Pf.copy(P); Pf.y -= drop;
        if (gone) { glint.setPos(Pf); glint.mat.uniforms.uGain.value *= 1 - sst(0.702, 0.705, u); falcon.mesh.visible = fOn && u < 0.705; }
        glint.mesh.visible = distB > 80 && !(gone && u >= 0.705); feather.mesh.visible = gone; spark.mesh.visible = false; bird.group.visible = birdNear && (!gone || u < 0.705);
        burst.visible = gone && u < 0.715; burstMat.uniforms.uPos.value.copy(strike); burstMat.uniforms.uAge.value = Math.max(0, u - 0.689) * 35.4;
        burstMat.uniforms.uGain.value = sst(0.689, 0.6905, u) * (1 - sst(0.7035, 0.714, u)); burstMat.uniforms.uPx.value = Math.max(5, buf.y / 60);   // gone by 0.714: the held sky has one feather in it
        lane.visible = true;
        if (u >= 0.911) { const k = Math.min(1, (u - 0.911) / 0.0177); Pb.set(0, 15.02 + 0.7 * (1 - k), EYE.z + 2.3 + 12 * Math.pow(1 - k, 1.8)); bird.place(Pb, Tb); }
        else if (birdNear) { bird.place(Pf, T); bird.group.rotateX(0.7);   // through the long lens it is seen a little from below: the whole spread of both wings, beating
          if (gone) { bird.group.rotateZ(time * 5.3); bird.group.rotateX(0.9); } }   // struck: it tumbles
        const lens0 = Math.max(1, distB * lerp(0.15, 0.085, sst(150, 330, distB)) / 2.4);   // B's lens is long, and the bird grows as it comes: 5 degrees wide out of the smoke, 8.5 at the strike
        const lensHole = holeB * 0.36 * 300 / Math.max(200, distB);   // by the hole it has made the bird is drawn about half as wide as the hole
        const lens = (u < 0.6 ? Math.min(lens0, lensHole) : lens0) * (1 - 0.5 * kf * kf * (gone ? 1 : 0)); bird.group.scale.setScalar(u >= 0.911 ? lerp(1.22, 1.27, Math.min(1, (u - 0.911) / 0.0177)) : lens); falcon.mesh.scale.setScalar(lens * 0.8);   // in the door the bird stays whole between the posts to the cut, wing tips and all
        // flight2: from the loft the hunter is a bird and not a knot. It stands on its stoop over the white bird, nose down, tail up,
        // its back and both wings turned to the door (so the wings' own shape is what is seen), a body's length above it and half
        // a body to one side, rocking on its grip; the white bird tumbles under its feet
        if (gone) { falcon.mesh.position.copy(Pf).addScaledVector(UP, 1.3 * lens).addScaledVector(R, 0.5 * lens);
          v.set(0.12 * Math.sin(time * 3.1), 1, 0.3).normalize(); v2.set(0, 0, -1); v3.crossVectors(v2, v).normalize(); v2.crossVectors(v, v3);
          m4.makeBasis(v3, v2, v); falcon.mesh.quaternion.setFromRotationMatrix(m4); falcon.mesh.rotateZ(0.3 * Math.sin(time * 4.2)); }
        if (birdNear) glint.mat.uniforms.uGain.value = 0;   // B's lens is long: the bird fills the door
        sillMit.group.visible = true; rareMit.group.visible = rare; breath.visible = true;
        sU.uBig.value = u < 0.4 ? (smokeKind === 1 ? 1.2 : smokeKind === 2 ? 1.15 : 0.55) : u < 0.6 ? 2.2 : (smokeKind === 1 ? 1.9 : 1.45); sU.uSmall.value = 2.3; sU.uTall.value = smokeKind === 0 ? 1.6 : 1; sU.uClear.value = open && u < 0.62 ? 1.15 * lens * (1 - sst(0.57, 0.62, u)) + 0.01 : 0; if (open) sU.uNotchR.value = holeB * (1 - sst(0.6, 0.66, u)) + 0.01;
        cut.render(scene);
        root.visible = false; cut.quad.visible = true; cut.place(camera);
      } else {
        sky.position.copy(camPos);
        root.visible = true; cut.quad.visible = false; carried.visible = true; waiter.group.visible = u < 0.9287;
        lane.visible = false; falcon.mesh.scale.setScalar(1);
        sU.uBig.value = lerp(0.58, 1, sst(0.44, 0.476, u)); sU.uSmall.value = 1.4; sU.uTall.value = 1; sU.uClear.value = 0;   // from the air the column is a slim leaning pillar until we are in it
        spark.mesh.visible = dDoor > 170; glint.mesh.visible = feather.mesh.visible = burst.visible = bird.group.visible = sillMit.group.visible = rareMit.group.visible = breath.visible = false;
      }
    };

    return {
      scene, path, duration: 45, title: 'Reverse Angle', ride: 'none', companion: 'none', style: 'none', carried,
      pace: (u) => lerp(1.27, 0.35, sst(0.857, 0.911, u)),
      camera: { fov: 66, near: 0.2, far: 4000, sway: 0.5, bank: 0.6 },
      portal: { shape: 'circle', radius: 2.6, color: '#FFD9A0', glow: 1, revealDistance: 140 },
      post: { exposure: 1, bloom: { strength: 0.3, radius: 0.5, threshold: 0.92 }, grade: { saturation: 1.06, contrast: 1.05, vignette: 0.2, grain: 0.02, aberration: 0 } },
      update,
      dispose() { cut.dispose(); },
    };
  },
};
