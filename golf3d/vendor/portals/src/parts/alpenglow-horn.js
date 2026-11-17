// Hero set piece of "alpenglow-horn": the great rock horn, its summit banner, the hanging glacier's
// serac band and the powder avalanche that falls from it.
//
// LOCAL SPACE: the summit is at (0, H, 0); y = 0 is the level of the glacier at the foot of the face; the
// object is NOT rotated by the world: -X is west, +Z is south (same axes as the world). The sunlit hero
// face is the south-west face (outward normal at azimuth 220); the west ridge (azimuth 265) runs out toward
// the knife ridge the flight starts on. The viewer (_part) orbits it; "front" is roughly -X/+Z.
//
// buildHero(ctx, opts) -> { object, radius, height, center, anchors, uniforms, heightAt(lx, lz), setU(u),
//   frontAt(u, out), setLook(look), update(dt, time, camera), dispose() }
// opts: { look: { sunDir, sunCol, sky, ground, bounce, fogColor, fogDensity, shadowY: [y at u 0, y at u 1], moon, ember, edge (softness of the
//           shadow line, m), glowY: [y0, y1] (where the afterglow sits), moonDir, moonCol (a second, cool key: the risen moon) },
//         timing: { crack, fall, hit, foot } (path fractions of the serac's crack, its fall, its burst and the cloud reaching the foot),
//         floorAt(lx, lz) -> terrain height in the same space (for culling and for the avalanche run-out),
//         rare (second serac + third couloir), foehn (lenticular cap, banner twice as long), detail (0.6..1) }
// Everything scripted is a pure function of u (setU) so any frame can be posed; ambient boil uses time.
// anchors (local): summit, seracBand, burst (where the tower hits the slabs), foot (where the couloirs meet),
//   runout (end of the run-out fan), bannerDir. frontAt(u) gives the centre of the cloud front (for gaze).
import * as THREE from 'three';

export const HORN = { H: 1500, faceAz: [220, 310, 40, 130], faceR: [1050, 950, 900, 1000], pow: 1.22, tc: 400, split: 240 };
const D2R = Math.PI / 180;
const FN = HORN.faceAz.map((a) => [Math.sin(a * D2R), -Math.cos(a * D2R)]);
const T0 = [-FN[0][1], FN[0][0]];   // lateral axis of the SW face (unit, horizontal)
const sat = (x) => Math.min(1, Math.max(0, x));
const sstep = (a, b, x) => { const t = sat((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const mix = (a, b, t) => a + (b - a) * t;
const hs1 = (a) => { const v = Math.sin(a * 91.7 + 13.1) * 43758.5453; return v - Math.floor(v); };

// lateral position of the two couloirs (side -1 / +1) at face coordinate d; they meet at the foot
export const couloirT = (d, side) => HORN.tc + side * HORN.split * (1 - sstep(0.34, 1.0, d));

export function makeHornHeight(noise, rare = false) {
  const { H, faceR, pow } = HORN;
  // returns height; if info is given fills info = { d, face, t, ice, coul }
  return (lx, lz, info) => {
    let d = -1e9, face = 0, d2 = -1e9;
    const r0 = Math.hypot(lx, lz), wk = Math.min(1, r0 / 500) * 70;                      // the plan is warped: no ruler-straight ridges
    const wx = lx + noise.n2(lx * 0.0016 + 9.1, lz * 0.0016) * wk + 46 * Math.exp(-r0 / 260), wz = lz + noise.n2(lx * 0.0016, lz * 0.0016 - 4.7) * wk - 18 * Math.exp(-r0 / 260);
    for (let i = 0; i < 4; i++) { const v = (wx * FN[i][0] + wz * FN[i][1]) / faceR[i]; if (v > d) { d2 = d; d = v; face = i; } else if (v > d2) d2 = v; }
    const ridgeK = Math.exp(-Math.max(0, d - d2) * 18);                                   // 1 on a ridge line
    const e = 1 - d, body = H * Math.sign(e) * Math.pow(Math.abs(e), pow);
    const taper = sat(d * 3.2) * sat((1.25 - d) * 2.2);
    // big facets and buttresses, then ribs running down the fall line
    const tl = face === 0 ? lx * T0[0] + lz * T0[1] : lx * -FN[face][1] + lz * FN[face][0];
    let h = body + noise.fbm2(lx * 0.0019 + 3.1, lz * 0.0019 - 7.7, 3) * 120 * taper;
    h += 70 * Math.exp(-Math.pow((d - 0.3) / 0.07, 2)) * ridgeK - 55 * Math.exp(-Math.pow((d - 0.42) / 0.05, 2)) * ridgeK;   // shoulders and notches on the ridges
    h += ridgeK * noise.n2(lx * 0.011 + 5, lz * 0.011) * 26 * taper;
    const rib = noise.ridged2(tl * 0.0072 + face * 13.7, d * 1.5 + noise.n2(lx * 0.003, lz * 0.003) * 0.25, 3);
    h += (rib - 0.42) * 115 * taper * (1 - 0.5 * ridgeK);
    h += noise.n2(lx * 0.019, lz * 0.019) * 9 * taper;
    let ice = 0, coul = 0;
    // the hanging glacier: a shelf of ice round the whole western half of the horn (both faces seen from the knife ridge), level on
    // top and ending in a cliff of seracs 135 m high, set back block by block, with clefts between the blocks. The shadow line stands
    // at its top as we cross the crest
    const ga = wx * FN[0][0] + wz * FN[0][1], gb = wx * T0[0] + wz * T0[1], phi = Math.atan2(gb - ga, gb + ga), lat = phi * 420;       // phi: 0 on the west ridge
    const blk = Math.floor(lat / 58), bh = hs1(blk), bq = lat / 58 - blk, dj = d + 0.028 * (bh - 0.5) + 0.006 * noise.n2(lat * 0.03, 2.2), azK = 1 - sstep(1.15, 1.5, Math.abs(phi));
    // (a dark notch stands either side of the prow on the west ridge, so the serac tower there is seen apart from the cliff)
    const notch = 1 - 0.8 * Math.exp(-Math.pow((Math.abs(lat) - 108) / 30, 2));
    const glK = sstep(0.25, 0.325, dj) * azK, gl = glK * (1 - sstep(0.347, 0.36, dj)) * (0.8 + 0.2 * bh) * (0.86 + 0.14 * sstep(0.03, 0.14, Math.min(bq, 1 - bq))) * notch;
    h += gl * 135; ice = Math.max(gl, glK * (1 - sstep(0.375, 0.39, dj)) * notch);     // (the cliff's foot is ice too: the whole face is coloured as ice)
    if (face === 0) {
      const t = tl - HORN.tc;
      // two couloirs that meet at the foot
      for (const side of [-1, 1]) {
        const w = (tl - couloirT(d, side)) / 36, g = Math.exp(-w * w) * sstep(0.37, 0.46, d) * (1 - sstep(1.0, 1.12, d));
        h -= g * 42; coul = Math.max(coul, g);
      }
      if (rare) { const w = (t + 470) / 34, g = Math.exp(-w * w) * sstep(0.3, 0.4, d) * (1 - sstep(1.0, 1.12, d)); h -= g * 38; coul = Math.max(coul, g); }
      // avalanche fan at the foot
      const fan = Math.exp(-(t * t) / (170 * 170)) * sstep(0.84, 1.0, d) * (1 - sstep(1.0, 1.3, d));
      h += fan * 16; ice = Math.max(ice, fan * 0.8);
    }
    if (info) { info.d = d; info.face = face; info.t = tl; info.ice = ice; info.coul = coul; info.gl = gl; info.lat = lat; }
    return h;
  };
}

const NOISE_GLSL = /* glsl */`
float hh(vec3 p){ p = fract(p * vec3(.1031, .1030, .0973)); p += dot(p, p.yxz + 33.33); return fract((p.x + p.y) * p.z); }
float vn(vec3 p){ vec3 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(mix(hh(i), hh(i + vec3(1,0,0)), f.x), mix(hh(i + vec3(0,1,0)), hh(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(hh(i + vec3(0,0,1)), hh(i + vec3(1,0,1)), f.x), mix(hh(i + vec3(0,1,1)), hh(i + vec3(1,1,1)), f.x), f.y), f.z); }
float fb(vec3 p){ return vn(p) * .5 + vn(p * 2.13 + 7.1) * .3 + vn(p * 4.71 + 3.3) * .2; }
`;
export const HORN_NOISE_GLSL = NOISE_GLSL;

const DEFAULT_LOOK = { sunDir: [-0.93, 0.03, 0.25], sunCol: [3.2, 0.9, 0.62], sky: [0.07, 0.17, 0.5], ground: [0.02, 0.035, 0.09], bounce: [0.5, 0.2, 0.17],
  fogColor: '#3E5E96', fogDensity: 0.00035, shadowY: [800, 1000], shadowDrop: 0, moon: 0, ember: 0, edge: 16, glowY: [900, 1500], moonDir: [0, 1, 0], moonCol: [0, 0, 0] };

function hornMaterial(U) {
  return new THREE.ShaderMaterial({
    uniforms: U, fog: true,
    vertexShader: /* glsl */`
      attribute vec4 aM;
      varying vec3 vW, vN; varying vec4 vM;
      #include <fog_pars_vertex>
      void main(){
        vec4 wp = modelMatrix * vec4(position, 1.); vW = wp.xyz; vN = normalize(mat3(modelMatrix) * normal); vM = aM;
        vec4 mvPosition = viewMatrix * wp; gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uSunDir, uSunCol, uSky, uGround, uBounce, uMoonDir, uMoonCol; uniform vec2 uGlowY; uniform float uShadowY, uMoon, uEmber, uEdge;
      varying vec3 vW, vN; varying vec4 vM;
      #include <fog_pars_fragment>
      ${NOISE_GLSL}
      void main(){
        vec3 N = normalize(vN);
        float dist = length(vW - cameraPosition), lodK = (1. - smoothstep(500., 2600., dist));
        // rock structure: beds dipping across the face, joints down the fall line, blocky breakup
        vec3 q = vW * .011;
        float n1 = fb(q), n2 = fb(q * 3.7 + 11.), n3 = vn(vW * .16) * lodK;
        float bedC = vW.y * .052 + dot(vW.xz, vec2(.014, .009)) + n1 * 5.;
        float bed = smoothstep(.0, .3, abs(fract(bedC) - .5)) * .5 + .5 * vn(vec3(floor(bedC) * 3.3, 1., 2.));
        float joint = smoothstep(.36, .5, abs(fract(dot(vW.xz, vec2(.021, -.017)) + n2 * .8) - .5) * 2. * .5 + .25 * n3);
        // perturb the normal with the same structure (cheap finite difference of two noises)
        float e = 9.;
        vec3 g = vec3(fb((vW + vec3(e,0,0)) * .011 * 3.7 + 11.) - n2, fb((vW + vec3(0,e,0)) * .011 * 3.7 + 11.) - n2, fb((vW + vec3(0,0,e)) * .011 * 3.7 + 11.) - n2);
        vec3 Nd = normalize(N - g * 2.6 - vec3(0., (bed - .6) * .5, 0.) * (1. - N.y));
        // snow and ice: ledges, snowfields in the hollows, couloirs, the hanging glacier (fine breakup only when near)
        float up = Nd.y + (n1 - .5) * .22 + (n2 - .5) * .3 * lodK;
        float field = smoothstep(.5, .72, fb(vW * .0031 + 4.) + (N.y - .55) * .9);
        float snow = smoothstep(.7, .82, up) * (.55 + .45 * field) + field * smoothstep(.42, .62, N.y) * .85;
        snow = max(snow, smoothstep(.35, .8, vM.y) * .96);
        snow = max(snow, smoothstep(.3, .75, vM.z) * smoothstep(.3, .6, Nd.y + .25));
        snow = clamp(snow, 0., 1.);
        vec3 rock = mix(vec3(.2, .155, .14), vec3(.4, .32, .28), n1) * (.62 + .5 * bed) * (.7 + .3 * joint) * (.85 + .3 * n3);
        rock = mix(rock, rock * vec3(.55, .5, .5), smoothstep(.55, .9, fb(vec3(vW.x * .004, vW.y * .0012, vW.z * .004))) * .7);   // dark water streaks
        vec3 ice = mix(vec3(.52, .6, .72), vec3(.64, .67, .72), n2);
        // the hanging glacier: transverse crevasses open across its back, and its front is a cliff of blue seracs split by dark clefts
        float gla = smoothstep(.3, .8, vM.y);
        float slot = (1. - smoothstep(.06, .2, abs(fract(vM.x * 62. + n1 * 2.2) - .5))) * gla * smoothstep(.5, .8, N.y);
        ice = mix(ice, vec3(.2, .36, .58), slot * .8);
        float cliff = smoothstep(.12, .6, vM.y) * (1. - smoothstep(.5, .82, N.y));
        float flute = vn(vec3(vM.w * .03, vW.y * .011, 3.)) * .7 + vn(vec3(vM.w * .09, vW.y * .03, 5.)) * .3, cleft = smoothstep(.52, .68, flute);
        ice = mix(ice, mix(vec3(.5, .7, .9), vec3(.15, .3, .54), cleft) * (.84 + .3 * n3 + .2 * bed), cliff);
        vec3 alb = mix(rock, ice, snow);
        float iceK = cliff * snow;
        // the level shadow line: above it the low sun, below it only sky and the bounce of the lit wall
        float lit = smoothstep(uShadowY - uEdge, uShadowY + uEdge, vW.y + (n1 - .5) * uEdge);
        float ndl = max(dot(Nd, uSunDir), 0.), wrap = max(dot(Nd, uSunDir) * .5 + .5, 0.);
        float cool = (1. - smoothstep(uShadowY, uShadowY + 220., vW.y));                       // the lowest lit rock is the reddest
        vec3 sunC = uSunCol * mix(vec3(1., 1.08, 1.05), vec3(.9, .6, .66), cool * (1. - uMoon));
        vec3 sun = sunC * (ndl * .92 + wrap * wrap * .08) * mix(lit, 1., uMoon);
        sun += uSunCol * uEmber * smoothstep(uGlowY.x, uGlowY.y, vW.y + (n1 - .5) * 90.) * (.3 + .7 * wrap);   // afterglow: the summit as a dull ember
        vec3 moonL = uMoonCol * (max(dot(Nd, uMoonDir), 0.) * .8 + .2 * max(dot(N, uMoonDir) * .5 + .5, 0.));        // the risen moon: a cool second key
        float hemi = Nd.y * .5 + .5;
        vec3 fill = mix(uGround, uSky, hemi) * (.62 + .3 * N.y);
        vec3 bnc = uBounce * (1. - lit) * max(Nd.y * .7 + .3, 0.) * smoothstep(-100., 500., vW.y) * (1. - uMoon);
        vec3 col = alb * (fill + bnc + moonL) + mix(alb, vec3(.9, .82, .84), iceK * .7) * sun + vec3(.04, .09, .16) * cliff * (uSky.b + uSky.g) * (1. - cleft);   // (ice in the sun glows pale, not purple)
        col += alb * uSunCol * snow * pow(max(dot(reflect(-uSunDir, Nd), normalize(cameraPosition - vW)), 0.), 18.) * .25 * lit;
        gl_FragColor = vec4(col, 1.);
        #include <fog_fragment>
      }`,
  });
}

// one soft noise texture for banner, sprites and cap (tileable value noise, 3 octaves in RGB)
function makeSoftNoise(rng) {
  const S = 128, lat = (n) => { const a = new Float32Array(n * n); for (let i = 0; i < a.length; i++) a[i] = rng(); return a; };
  const L = [lat(8), lat(16), lat(32), lat(64)], data = new Uint8Array(S * S * 4);
  const samp = (a, n, x, y) => { const fx = x * n, fy = y * n, ix = Math.floor(fx), iy = Math.floor(fy); let u = fx - ix, v = fy - iy; u = u * u * (3 - 2 * u); v = v * v * (3 - 2 * v);
    const i0 = ix % n, i1 = (ix + 1) % n, j0 = iy % n, j1 = (iy + 1) % n; return mix(mix(a[j0 * n + i0], a[j0 * n + i1], u), mix(a[j1 * n + i0], a[j1 * n + i1], u), v); };
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    const u = x / S, v = y / S, a = samp(L[0], 8, u, v), b = samp(L[1], 16, u, v), c = samp(L[2], 32, u, v), d = samp(L[3], 64, u, v), k = (y * S + x) * 4;
    data[k] = 255 * (a * 0.5 + b * 0.3 + c * 0.14 + d * 0.06); data[k + 1] = 255 * (b * 0.5 + c * 0.3 + d * 0.2); data[k + 2] = 255 * (c * 0.6 + d * 0.4); data[k + 3] = 255;
  }
  const t = new THREE.DataTexture(data, S, S, THREE.RGBAFormat); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.magFilter = THREE.LinearFilter; t.minFilter = THREE.LinearMipmapLinearFilter; t.generateMipmaps = true; t.needsUpdate = true;
  return t;
}

export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng.fork('horn'), noise = ctx.core.makeNoise(rng.int(1, 1e9));
  const look = { ...DEFAULT_LOOK, ...(opts.look || {}) }, rare = !!opts.rare, foehn = !!opts.foehn, detail = opts.detail ?? 1;
  const H = HORN.H, heightFn = makeHornHeight(noise, rare), floorAt = opts.floorAt || (() => -1e4);
  const group = new THREE.Group();
  const v3 = (a) => (a && a.isVector3 ? a.clone() : a && a.isColor ? new THREE.Vector3(a.r, a.g, a.b) : new THREE.Vector3(a[0], a[1], a[2]));
  const U = {
    ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog),
    uSunDir: { value: v3(look.sunDir).normalize() }, uSunCol: { value: v3(look.sunCol) }, uSky: { value: v3(look.sky) }, uGround: { value: v3(look.ground) },
    uBounce: { value: v3(look.bounce) }, uShadowY: { value: 900 }, uMoon: { value: look.moon || 0 }, uEmber: { value: look.ember || 0 }, uTime: { value: 0 },
    uEdge: { value: look.edge ?? 16 }, uGlowY: { value: new THREE.Vector2(look.glowY[0], look.glowY[1]) }, uMoonDir: { value: v3(look.moonDir).normalize() }, uMoonCol: { value: v3(look.moonCol) },
  };
  const shared = { uSunDir: U.uSunDir, uSunCol: U.uSunCol, uSky: U.uSky, uGround: U.uGround, uBounce: U.uBounce, uShadowY: U.uShadowY, uMoon: U.uMoon, uEmber: U.uEmber, uTime: U.uTime,
    uEdge: U.uEdge, uGlowY: U.uGlowY, uMoonDir: U.uMoonDir, uMoonCol: U.uMoonCol };
  const fogU = () => THREE.UniformsUtils.clone(THREE.UniformsLib.fog);

  // ---------- the horn: a displaced four-sided pyramid on a grid aligned with the hero face ----------
  const A0 = -300, A1 = 1320, B0 = -1050, B1 = 1010, NA = 162, NB = 172, n0 = FN[0];
  const NV = (NA + 1) * (NB + 1), pos = new Float32Array(NV * 3), nor = new Float32Array(NV * 3), aM = new Float32Array(NV * 4), hs = new Float32Array(NV), fl = new Float32Array(NV), info = {};
  for (let j = 0, k = 0; j <= NB; j++) {
    for (let i = 0; i <= NA; i++, k++) {
      const a = A0 + (A1 - A0) * (i / NA), b = B0 + (B1 - B0) * (j / NB), x = n0[0] * a + T0[0] * b, z = n0[1] * a + T0[1] * b;
      const h = heightFn(x, z, info); pos[k * 3] = x; pos[k * 3 + 1] = h; pos[k * 3 + 2] = z; hs[k] = h; fl[k] = floorAt(x, z);
      aM[k * 4] = info.d; aM[k * 4 + 1] = info.ice; aM[k * 4 + 2] = info.coul; aM[k * 4 + 3] = info.lat;
    }
    if ((j & 3) === 3) await ctx.yield();   // four rows at a time
  }
  const da = (A1 - A0) / NA, db = (B1 - B0) / NB, W = NA + 1, tv = new THREE.Vector3();
  for (let j = 0, k = 0; j <= NB; j++) for (let i = 0; i <= NA; i++, k++) {
    const hA = hs[k + (i < NA ? 1 : 0)] - hs[k - (i > 0 ? 1 : 0)], hB = hs[k + (j < NB ? W : 0)] - hs[k - (j > 0 ? W : 0)];
    const ga = hA / (da * (i > 0 && i < NA ? 2 : 1)), gb = hB / (db * (j > 0 && j < NB ? 2 : 1));
    tv.set(-(n0[0] * ga + T0[0] * gb), 1, -(n0[1] * ga + T0[1] * gb)).normalize(); nor[k * 3] = tv.x; nor[k * 3 + 1] = tv.y; nor[k * 3 + 2] = tv.z;
  }
  await ctx.yield();
  const idx = [];
  for (let j = 0; j < NB; j++) for (let i = 0; i < NA; i++) {
    const a = j * W + i, b = a + 1, c = a + W, d = c + 1;
    if (Math.max(hs[a] - fl[a], hs[b] - fl[b], hs[c] - fl[c], hs[d] - fl[d]) < -25) continue;      // buried under the world's terrain
    if (Math.abs(hs[a] - hs[d]) < Math.abs(hs[b] - hs[c])) idx.push(a, d, b, a, c, d); else idx.push(a, c, b, b, c, d);
  }
  await ctx.yield();
  const hg = new THREE.BufferGeometry();
  hg.setAttribute('position', new THREE.BufferAttribute(pos, 3)); hg.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); hg.setAttribute('aM', new THREE.BufferAttribute(aM, 4));
  hg.setIndex(idx); hg.computeBoundingSphere();
  const hornMat = hornMaterial({ ...fogU(), ...shared });
  const horn = new THREE.Mesh(hg, hornMat); horn.frustumCulled = false; group.add(horn);
  await ctx.yield();

  // ---------- summit banner: spindrift streaming north-east off the top (two crossed ribbons) ----------
  const tex = makeSoftNoise(rng.fork('n'));
  await ctx.yield();
  const bLen = foehn ? 820 : 420, bDir = new THREE.Vector3(0.72, 0.1, -0.69).normalize();
  const bannerMat = new THREE.ShaderMaterial({
    uniforms: { ...fogU(), ...shared, tN: { value: tex }, uLen: { value: bLen } }, fog: true, transparent: true, depthWrite: false, side: THREE.DoubleSide,
    blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor,
    vertexShader: /* glsl */`
      uniform float uTime, uLen; varying vec2 vUv; varying vec3 vW;
      #include <fog_pars_vertex>
      void main(){ vUv = uv; vec3 p = position;
        float s = uv.x; p.y += sin(s * 7. - uTime * .9) * 14. * s + sin(s * 17. - uTime * 1.7 + p.z) * 5. * s;
        vec4 wp = modelMatrix * vec4(p, 1.); vW = wp.xyz; vec4 mvPosition = viewMatrix * wp; gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      uniform sampler2D tN; uniform float uTime, uShadowY, uMoon, uEmber; uniform vec3 uSunCol, uSky, uMoonCol; varying vec2 vUv; varying vec3 vW;
      #include <fog_pars_fragment>
      void main(){
        float s = vUv.x, v = vUv.y * 2. - 1.;
        vec2 q = vec2(s * 2.2 - uTime * .085, vUv.y * .9);
        float n = texture2D(tN, q).r * .6 + texture2D(tN, q * 2.3 + vec2(-uTime * .06, .3)).g * .4;
        float env = (1. - smoothstep(.15, 1., abs(v + (n - .5) * .7))) * smoothstep(0., .035, s) * (1. - smoothstep(.45, 1., s));
        float a = clamp(env * smoothstep(.34, .78, n + env * .35) * 1.15, 0., 1.) * (1. - .45 * s);
        float lit = mix(smoothstep(uShadowY - 30., uShadowY + 30., vW.y), 1., uMoon);
        vec3 col = uSunCol * (.3 + .2 * n) * lit + uSky * .9 + uSunCol * uEmber * .4 + uMoonCol * .25;
        #ifdef USE_FOG
        col = mix(col, fogColor, 1. - exp(-fogDensity * fogDensity * vFogDepth * vFogDepth));
        #endif
        gl_FragColor = vec4(col * a, a);
      }`,
  });
  const mkBanner = (roll) => {
    const g = new THREE.PlaneGeometry(1, 1, 36, 4), p = g.attributes.position, up = new THREE.Vector3(0, 1, 0), side = new THREE.Vector3().crossVectors(bDir, up).normalize(), vv = new THREE.Vector3();
    const wd = up.clone().multiplyScalar(Math.cos(roll)).addScaledVector(side, Math.sin(roll));
    for (let i = 0; i < p.count; i++) { const s = p.getX(i) + 0.5, v = p.getY(i) * 2, w = 16 + 150 * Math.pow(s, 0.8) * (foehn ? 1.2 : 1);
      vv.set(0, H - 6 + 40 * s, 0).addScaledVector(bDir, s * bLen - 12).addScaledVector(wd, v * w * 0.5 + w * 0.22 * s); p.setXYZ(i, vv.x, vv.y, vv.z); }
    const m = new THREE.Mesh(g, bannerMat); m.frustumCulled = false; m.renderOrder = 2; return m;
  };
  group.add(mkBanner(0), mkBanner(1.25));
  await ctx.yield();
  // foehn: a lenticular cap standing over the summit
  if (foehn) {
    // a stack of thin, slightly domed plates whose edges feather away: no silhouette, only layered veils
    const cp = [], cu = [], ci = [], SEG = 40, RNG = 6;
    for (const [sc, y0, dome, lay] of [[1, 0, 34, 0], [0.74, 30, 26, 1], [0.5, 54, 18, 2], [0.62, -26, 14, 3]]) { const base = cp.length / 3;
      for (let r = 0; r <= RNG; r++) for (let k = 0; k < SEG; k++) { const rr = r / RNG, an = (k / SEG) * Math.PI * 2, ux = Math.cos(an) * rr, uz = Math.sin(an) * rr;
        cp.push(ux * 780 * sc, y0 * 0.8 + dome * 0.7 * (1 - rr * rr), uz * 270 * sc); cu.push(ux, uz, lay); }
      for (let r = 0; r < RNG; r++) for (let k = 0; k < SEG; k++) { const a0 = base + r * SEG + k, a1 = base + r * SEG + (k + 1) % SEG, b0 = a0 + SEG, b1 = a1 + SEG; ci.push(a0, b0, a1, a1, b0, b1); } }
    const cg = new THREE.BufferGeometry(); cg.setAttribute('position', new THREE.Float32BufferAttribute(cp, 3)); cg.setAttribute('aU', new THREE.Float32BufferAttribute(cu, 3)); cg.setIndex(ci);
    const cap = new THREE.Mesh(cg, new THREE.ShaderMaterial({
      uniforms: { ...fogU(), ...shared, tN: { value: tex } }, fog: true, transparent: true, depthWrite: false, side: THREE.DoubleSide,
      vertexShader: /* glsl */`attribute vec3 aU; varying vec3 vW, vU;
        #include <fog_pars_vertex>
        void main(){ vU = aU; vec4 wp = modelMatrix * vec4(position, 1.); vW = wp.xyz; vec4 mvPosition = viewMatrix * wp; gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
        }`,
      fragmentShader: /* glsl */`uniform sampler2D tN; uniform vec3 uSunCol, uSky; uniform float uTime, uMoon; varying vec3 vW, vU;
        #include <fog_pars_fragment>
        void main(){ float r = length(vU.xy);
          vec2 q = vU.xy * vec2(.42, 1.9) + vec2(uTime * .0035 + vU.z * .37, vU.z * .21);          // streaks drawn out along the wind
          float n = texture2D(tN, q).r * .65 + texture2D(tN, q * 2.7 + .31).g * .35;
          float a = (1. - smoothstep(.16, 1., r + (n - .5) * .75)) * (.4 - .05 * vU.z);
          float under = smoothstep(-40., 60., vW.y - cameraPosition.y);                             // seen from below: the lit belly
          float edge = smoothstep(.25, .95, r);
          vec3 belly = uSunCol * mix(vec3(.62, .3, .27), vec3(1.05, .5, .38), edge) * (.75 + .5 * n);
          vec3 top = uSunCol * vec3(.8, .62, .6) * .6;
          vec3 col = mix(top, belly, under) * (1. - uMoon) + uSky * (.55 + .6 * uMoon) + vec3(.05, .07, .11) * uMoon * (.6 + n);
          gl_FragColor = vec4(col, a);
          #include <fog_fragment>
        }`,
    }));
    cap.position.set(120, H + 170, -90); cap.rotation.y = 0.75; cap.renderOrder = 2; cap.frustumCulled = false; group.add(cap);
    await ctx.yield();
  }

  // ---------- the avalanche ----------
  // Track coordinates: d = face coordinate (0 summit, 1 foot, beyond 1 the run-out across the glacier, 1 unit = R0 metres),
  // side = -1 / +1 couloir (2 = the rare third one), w = -1..1 across the flow. On the glacier the cloud fans out into one
  // lobed wall about 500 m wide whose west flank (w > 0) stops short of the flight line.
  const TM = opts.timing || {}, R0 = HORN.faceR[0], D_SERAC = 0.3, D_BURST = 0.5, D_END = 1.3, U_CRACK = TM.crack ?? 0.16, U_FALL = TM.fall ?? 0.195, U_HIT = TM.hit ?? 0.238, U_FOOT = TM.foot ?? 0.5;
  const fanK = (d) => sstep(0.95, 1.25, d);
  const trackT = (d, side, w) => (side === 2 ? HORN.tc - 470 * (1 - sstep(0.9, 1.0, d)) - 250 * fanK(d) : couloirT(d, side)) + w * (56 + (side === 2 ? 300 : 219) * fanK(d));
  const ND = 76, NW = 13, tabs = [];
  for (const side of rare ? [-1, 1, 2] : [-1, 1]) {
    const tab = new Float32Array(ND * NW * 3);
    for (let i = 0; i < ND; i++) for (let j = 0; j < NW; j++) {
      const d = mix(0.34, D_END, i / (ND - 1)), t = trackT(d, side, (j / (NW - 1)) * 2 - 1), a = d * R0, x = n0[0] * a + T0[0] * t, z = n0[1] * a + T0[1] * t, k = (i * NW + j) * 3;
      tab[k] = x; tab[k + 1] = Math.max(heightFn(x, z), floorAt(x, z)); tab[k + 2] = z;
    }
    tabs.push(tab); await ctx.yield();
  }
  const trackPos = (d, side, w, out) => {
    const tab = tabs[side === 2 ? 2 : side < 0 ? 0 : 1], fi = sat((d - 0.34) / (D_END - 0.34)) * (ND - 1.001), fj = sat(w * 0.5 + 0.5) * (NW - 1.001);
    const i = Math.floor(fi), j = Math.floor(fj), u = fi - i, v = fj - j, k = (i * NW + j) * 3, k2 = k + NW * 3;
    for (let c = 0; c < 3; c++) out[c] = mix(mix(tab[k + c], tab[k + 3 + c], v), mix(tab[k2 + c], tab[k2 + 3 + c], v), u);
    return out;
  };
  // where the front is, as a function of u (eventTime = u x 40 s): crack 0.16, lean, fall 0.195-0.238, burst, down the couloirs
  // (57 m/s) to the foot at 0.5, then the run-out, slowing all the way to the portal
  const frontD = (u) => { if (u <= U_HIT) return D_BURST; if (u < U_FOOT) { const t = (u - U_HIT) / (U_FOOT - U_HIT); return D_BURST + 0.5 * (0.3 * t * t + 0.7 * t); } const v = sat((u - U_FOOT) / (1 - U_FOOT)); return 1.0 + 0.215 * (1 - Math.pow(1 - v, 1.7)); };
  // billows live ON the envelope of the cloud: q 0..1 runs from the foot of the front up its face, over the brow and back along the
  // top; each billow rises up the face, boils, and streams back into the plume. Envelope: front height HF, back length LB.
  const B = [];
  const brng = rng.fork('billows'), sides = rare ? [-1, 1, 2] : [-1, 1];
  const NFRONT = Math.round((rare ? 174 : 150) * (0.6 + 0.4 * detail)), NPLUME = rare ? 102 : 92, NBURST = 12;
  for (let i = 0; i < NFRONT; i++) { const w0 = brng(), w = i % 3 === 0 ? -w0 : Math.pow(w0, 0.8) * (brng() < 0.8 ? 1 : -1);   // most stand on the flank we fly past
    B.push({ kind: 0, side: sides[i % sides.length], w, ph: brng(), rate: brng.range(0.045, 0.085), smax: brng.range(8.5, 16.5), hf: brng.range(0.75, 1.15), seed: brng() * 50, lobe: brng.range(-1, 1) }); }
  for (let i = 0; i < NPLUME; i++) B.push({ kind: 1, side: sides[i % sides.length], w: brng.range(-0.9, 0.9), ph: brng(), rate: brng.range(0.025, 0.045), smax: brng.range(17, 27), hf: brng.range(0.8, 1.5), seed: brng() * 50, lobe: brng.range(-1, 1) });
  for (let i = 0; i < NBURST; i++) B.push({ kind: 2, side: i % 2 ? 1 : -1, w: brng.range(-0.9, 0.9), ph: brng(), rate: 0, smax: brng.range(20, 34), hf: brng.range(0.3, 1), seed: brng() * 50, lobe: 0 });
  const NFINE = NFRONT, NCOARSE = NPLUME + NBURST, NB_ = B.length;
  await ctx.yield();
  const mkBillowGeo = (det, n) => { const ico = new THREE.IcosahedronGeometry(1, det), g = new THREE.InstancedBufferGeometry();
    g.setAttribute('position', ico.attributes.position); g.setAttribute('normal', ico.attributes.normal); if (ico.index) g.setIndex(ico.index);
    const P = new THREE.InstancedBufferAttribute(new Float32Array(n * 4), 4), R = new THREE.InstancedBufferAttribute(new Float32Array(n * 4), 4); P.setUsage(THREE.DynamicDrawUsage); R.setUsage(THREE.DynamicDrawUsage);
    g.setAttribute('aP', P); g.setAttribute('aR', R); g.instanceCount = n; ico.dispose(); return { g, P, R }; };
  const fineG = mkBillowGeo(3, NFINE);
  await ctx.yield();
  const coarseG = mkBillowGeo(2, NCOARSE);
  await ctx.yield();
  const BILLOW_FRAG = /* glsl */`
      uniform vec3 uSunDir, uSunCol, uSky, uGround, uBounce, uMoonDir, uMoonCol; uniform float uShadowY, uMoon; varying vec3 vN, vW, vP; varying float vAo, vSoft; varying vec2 vB;
      #include <fog_pars_fragment>
      ${NOISE_GLSL}
      // cellular lumps: xyz = offset from the nearest lump centre, w = squared distance to it (no lookups, no derivatives)
      vec4 cell(vec3 p){ vec3 b = floor(p - .5); vec4 best = vec4(0., 0., 0., 9.);
        for (int k = 0; k < 8; k++) { float fk = float(k); vec3 g = b + vec3(mod(fk, 2.), mod(floor(fk * .5), 2.), floor(fk * .25));
          vec3 c = g + .5 + (vec3(hh(g), hh(g + 17.3), hh(g + 41.7)) - .5) * .72, d = p - c; float dd = dot(d, d); if (dd < best.w) best = vec4(d, dd); }
        return best; }
      void main(){
        vec4 c1 = cell(vP), c2 = cell(vP * 2.4 + 5.3); float f1 = sqrt(c1.w), f2 = sqrt(c2.w), b3 = vn(vP * 5.7);
        vec3 N = normalize(normalize(vN) + c1.xyz * 1.5 + c2.xyz * .75 + (b3 - .5) * .25), V = normalize(cameraPosition - vW);
        float crease = (.3 + .7 * (1. - smoothstep(.3, .78, f1))) * (.62 + .38 * (1. - smoothstep(.25, .72, f2))) * (.9 + .2 * b3); crease = mix(crease, .56 + .5 * crease, vSoft);     // dark blue creases between the lumps
        float hemi = N.y * .5 + .5, lit = mix(smoothstep(uShadowY - 20., uShadowY + 20., vW.y), 1., uMoon);
        float under = smoothstep(-.12, .6, (vW.y - vB.x) / max(vB.y, 1.));                   // the foot of the cloud stays in its own blue shade
        vec3 fill = mix(uGround * 1.5 + uSky * .14, uSky, smoothstep(.0, 1., hemi)) * mix(.5, 1., under);
        vec3 bnc = uBounce * 1.75 * pow(max(hemi, 0.), 1.5) * (1. - lit) * (1. - uMoon) * under;   // rose from the lit wall on every top
        vec3 sun = uSunCol * (max(dot(N, uSunDir), 0.) * .7 + .2) * lit;                    // the crown that boils up into the sun
        float rim = pow(1. - max(dot(N, V), 0.), 2.5);
        // by moonlight (uMoonCol is black in the other looks) the powder is ghost-white: a wrapped silver key from the moon that stands
        // behind it, a bright rim on every lump's moonward edge, and creases that stay blue instead of going black
        float mk = min(dot(uMoonCol, vec3(.8)), 1.), mwrap = dot(N, uMoonDir) * .5 + .5;
        vec3 moonL = uMoonCol * (mwrap * mwrap * 1.5 + .2) * mix(.75, 1., under);
        float mrim = pow(1. - max(dot(N, V), 0.), 2.) * max(dot(-V, uMoonDir), 0.) * smoothstep(.25, .7, mwrap);
        float shade = vAo * crease; shade = mix(shade, .42 + .58 * shade, mk * .55);
        vec3 col = vec3(.78, .82, .9) * (fill * (1. + .4 * mk) + bnc + sun + moonL) * shade;
        col += (uSky * .28 + uBounce * .4 * hemi) * rim * under * (.4 + .6 * crease) + uMoonCol * mrim * 3. * (.5 + .5 * crease);
        float l = max(col.r, max(col.g, col.b)); col *= 1. / (1. + max(l - .5 - .24 * mk, 0.) * 1.1);     // stays mid-tone: never a white wall behind the portal
        gl_FragColor = vec4(col, 1.);
        #include <fog_fragment>
      }`;
  const billowMat = new THREE.ShaderMaterial({
    uniforms: { ...fogU(), ...shared }, fog: true,
    vertexShader: /* glsl */`
      attribute vec4 aP; attribute vec4 aR; uniform float uTime; varying vec3 vN, vW, vP; varying float vAo, vSoft; varying vec2 vB;
      #include <fog_pars_vertex>
      ${NOISE_GLSL}
      void main(){
        vec3 p = position; float sd = aR.y, t = uTime * .22;
        float n = vn(p * 1.5 + sd + vec3(0., t, t * .6)), n2 = vn(p * 3.6 + sd * 1.7 - vec3(t, 0., t));
        float r = .66 + .5 * n + .26 * n2;                                  // cauliflower lumps that boil
        vec3 q = p * r; vec3 nn = normalize(p * (.55 + n * .9 + n2 * .35) + normal * .2);
        float c = cos(aR.x), s = sin(aR.x);                                 // roll forward and under, about the across-flow axis
        q = vec3(q.x, q.y * c - q.z * s, q.y * s + q.z * c); nn = vec3(nn.x, nn.y * c - nn.z * s, nn.y * s + nn.z * c);
        vAo = .45 + .55 * smoothstep(.72, 1.28, r); vP = q * 2.1 + aR.y; vB = aR.zw; vSoft = 0.;
        vec3 wp = (modelMatrix * vec4(aP.xyz + q * aP.w, 1.)).xyz; vW = wp; vN = normalize(mat3(modelMatrix) * nn);
        vec4 mvPosition = viewMatrix * vec4(wp, 1.); gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: BILLOW_FRAG,
  });
  const billows = new THREE.Mesh(fineG.g, billowMat); billows.frustumCulled = false; group.add(billows);
  const billows2 = new THREE.Mesh(coarseG.g, billowMat); billows2.frustumCulled = false; group.add(billows2);
  await ctx.yield();

  // the body of each tongue: one continuous lobed mound of powder lying in its couloir from the front back up the face, tapering to
  // nothing; the billows boil on it and the sprites feather it, so no rock shows through a tongue
  const NR = 26, NC = 9, NBODY = sides.length, bodyPos = new Float32Array(NBODY * NR * NC * 3), bodyNor = new Float32Array(NBODY * NR * NC * 3), bodyB = new Float32Array(NBODY * NR * NC * 3), bodyIdx = [];
  for (let sI = 0; sI < NBODY; sI++) for (let i = 0; i < NR - 1; i++) for (let j = 0; j < NC - 1; j++) { const q = (sI * NR + i) * NC + j; bodyIdx.push(q, q + NC, q + 1, q + 1, q + NC, q + NC + 1); }
  const bodyG = new THREE.BufferGeometry(), bodyPA = new THREE.BufferAttribute(bodyPos, 3), bodyNA = new THREE.BufferAttribute(bodyNor, 3), bodyBA = new THREE.BufferAttribute(bodyB, 3);
  bodyPA.setUsage(THREE.DynamicDrawUsage); bodyNA.setUsage(THREE.DynamicDrawUsage); bodyBA.setUsage(THREE.DynamicDrawUsage);
  bodyG.setAttribute('position', bodyPA); bodyG.setAttribute('normal', bodyNA); bodyG.setAttribute('aB', bodyBA); bodyG.setIndex(bodyIdx);
  const bodyMat = new THREE.ShaderMaterial({
    uniforms: { ...fogU(), ...shared }, fog: true, side: THREE.DoubleSide,
    vertexShader: /* glsl */`
      attribute vec3 aB; uniform float uTime; varying vec3 vN, vW, vP; varying float vAo, vSoft; varying vec2 vB;
      #include <fog_pars_vertex>
      ${NOISE_GLSL}
      void main(){
        vec3 p = position; float t = uTime * .2;
        float n = vn(p * .03 + vec3(0., t, t * .6)), n2 = vn(p * .075 - vec3(t, 0., t));
        p += normal * ((n - .3) * 44. + (n2 - .5) * 20.) * aB.z;            // lumps that boil
        vAo = .62 + .5 * n; vP = p * .05; vB = aB.xy; vSoft = .4;
        vec4 wp = modelMatrix * vec4(p, 1.); vW = wp.xyz; vN = normalize(mat3(modelMatrix) * normal);
        vec4 mvPosition = viewMatrix * wp; gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: BILLOW_FRAG,
  });
  const bodyMesh = new THREE.Mesh(bodyG, bodyMat); bodyMesh.frustumCulled = false; group.add(bodyMesh);
  const upN = new THREE.Vector3(n0[0] * 0.78, 0.62, n0[1] * 0.78).normalize(), tA = [0, 0, 0], tB = [0, 0, 0], tC = [0, 0, 0], latV = new THREE.Vector3(), alV = new THREE.Vector3(), nrmV = new THREE.Vector3();
  const bodyProf = (f) => sstep(0, 0.08, f) * Math.pow(Math.max(0, 1 - f), 0.5);
  await ctx.yield();

  // soft sprites: dust at the crack and the falling tower, a dust skirt along the foot of the front, haze that fuses the plume
  const NDUST = 48, NS = Math.round((rare ? 170 : 130) * detail) + 24, sP = new Float32Array(NS * 4), sA = new Float32Array(NS * 2), S = [];
  for (let i = 0; i < NS; i++) S.push({ side: sides[i % sides.length], w: brng.range(-1, 1), ph: brng(), rate: brng.range(0.03, 0.07), L: brng.range(0.08, 0.6), size: brng.range(50, 110), rise: brng.range(0.2, 2.2), seed: brng(), skirt: i % 5 < 2 });
  const quad = new THREE.PlaneGeometry(1, 1), sg = new THREE.InstancedBufferGeometry();
  sg.setAttribute('position', quad.attributes.position); sg.setAttribute('uv', quad.attributes.uv); sg.setIndex(quad.index);
  const sPA = new THREE.InstancedBufferAttribute(sP, 4), sAA = new THREE.InstancedBufferAttribute(sA, 2); sPA.setUsage(THREE.DynamicDrawUsage); sAA.setUsage(THREE.DynamicDrawUsage);
  sg.setAttribute('aP', sPA); sg.setAttribute('aA', sAA); sg.instanceCount = NS; quad.dispose();
  const spriteMat = new THREE.ShaderMaterial({
    uniforms: { ...fogU(), ...shared, tN: { value: tex } }, fog: true, transparent: true, depthWrite: false,
    blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor,
    vertexShader: /* glsl */`
      attribute vec4 aP; attribute vec2 aA; varying vec2 vUv; varying vec3 vW; varying vec2 vA;
      #include <fog_pars_vertex>
      void main(){ vUv = uv; vA = aA; vec3 c = (modelMatrix * vec4(aP.xyz, 1.)).xyz;
        vec4 mvPosition = viewMatrix * vec4(c, 1.); float dz = max(-mvPosition.z, 1.); if (aA.x < 1.5) mvPosition.xyz *= max(.5, (dz - 48.) / dz);
        mvPosition.xy += position.xy * aP.w; vW = c + vec3(0., position.y * aP.w, 0.);
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      uniform sampler2D tN; uniform vec3 uSunCol, uSky, uGround, uBounce, uMoonCol; uniform float uShadowY, uTime, uMoon; varying vec2 vUv; varying vec3 vW; varying vec2 vA;
      #include <fog_pars_fragment>
      void main(){
        vec2 c = vUv * 2. - 1.; float r = length(c);
        float n = texture2D(tN, vUv * .7 + vA.y * 7. + vec2(0., -uTime * .012)).r;
        float dust = step(1.5, vA.x), a = (1. - smoothstep(.2, 1., r + (n - .5) * .7)) * (vA.x - 2. * dust);
        float lit = mix(smoothstep(uShadowY - 40., uShadowY + 40., vW.y), 1., uMoon), top = c.y * .5 + .5;   // (alpha > 1 marks the serac's ice dust: whiter)
        vec3 col = mix(vec3(.6, .66, .78), vec3(.9, .93, .98), dust) * (mix(uGround * 1.6 + uSky * .25, uSky, top) * (1. + 1.1 * dust) + uBounce * 1.1 * top * (1. - lit) * (1. - uMoon) + uSunCol * (.3 + .25 * dust) * lit + uMoonCol * (.3 + .55 * top));
        #ifdef USE_FOG
        col = mix(col, fogColor, 1. - exp(-fogDensity * fogDensity * vFogDepth * vFogDepth));
        #endif
        gl_FragColor = vec4(col * a, a);
      }`,
  });
  const sprites = new THREE.Mesh(sg, spriteMat); sprites.frustumCulled = false; sprites.renderOrder = 3; group.add(sprites);
  await ctx.yield();

  // ---------- ice: the serac tower (six blocks) and blocks bounding ahead of the cloud ----------
  const NTOWER = 6, NCHIP = 14, NBLK = 44, NI = NTOWER + NCHIP + NBLK, HT = 252;
  // one shard of ice, used for every piece: a block whose upright edges are cut back, one top corner sheared off, narrower toward its
  // head, every face split and pushed in or out (the shader facets it)
  const bx = new THREE.BoxGeometry(1, 1, 1, 3, 3, 3), bp = bx.attributes.position;
  for (let i = 0; i < bp.count; i++) { const x = bp.getX(i), y = bp.getY(i), z = bp.getZ(i), hsh = (a) => { const s = Math.sin(a * 127.1 + x * 311.7 + y * 74.7 + z * 201.3) * 43758.5453; return s - Math.floor(s) - 0.5; };
    const e = Math.abs(x) * Math.abs(z) * 4, cut = Math.max(0, x * 0.9 + y * 0.8 + z * 0.5 - 0.5), k = (1 - 0.17 * e * e);
    bp.setXYZ(i, x * k * (1 - 0.24 * (y + 0.5)) - cut * 0.9 + 0.17 * hsh(1), y - cut * 0.8 + 0.13 * hsh(2), z * k * (1 - 0.14 * (y + 0.5)) - cut * 0.5 + 0.17 * hsh(3)); }
  const iceMat = new THREE.ShaderMaterial({
    uniforms: { ...fogU(), ...shared }, fog: true,
    vertexShader: /* glsl */`varying vec3 vW; varying float vK;
      #include <fog_pars_vertex>
      void main(){ vec4 wp = modelMatrix * instanceMatrix * vec4(position, 1.); vW = wp.xyz; vK = step(14., length(instanceMatrix[0].xyz));   // the tower is pale; the bounding blocks are dark
      vec4 mvPosition = viewMatrix * wp; gl_Position = projectionMatrix * mvPosition;
      #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`uniform vec3 uSunDir, uSunCol, uSky, uGround, uBounce; uniform float uShadowY, uMoon; varying vec3 vW; varying float vK;
      #include <fog_pars_fragment>
      void main(){ vec3 fx = dFdx(vW), fy = dFdy(vW), c = cross(fx, fy); vec3 N = c / max(length(c), 1e-6);
        float lit = mix(smoothstep(uShadowY - 24., uShadowY + 24., vW.y), 1., uMoon), hemi = N.y * .5 + .5;
        vec3 alb = mix(vec3(.1, .125, .19), vec3(.52, .7, .9) * (.78 + .22 * step(.35, fract(vW.y * .07 + vW.x * .03))), vK);   // blue ice in beds
        vec3 col = alb * (mix(uGround * 1.5, uSky * (1. + .9 * vK * (1. - .7 * lit)), hemi) + uBounce * 1.2 * hemi * (1. - lit) * (1. - uMoon) * vK) + mix(alb, vec3(1., .94, .92), vK * .8) * uSunCol * (max(dot(N, uSunDir), 0.) * .55 + .22) * lit * vec3(1., .86, .74);   // (in the sun the ice glows pale rose)
        gl_FragColor = vec4(col, 1.);
        #include <fog_fragment>
      }`,
  });
  const iceMesh = new THREE.InstancedMesh(bx, iceMat, NI); iceMesh.frustumCulled = false; iceMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage); group.add(iceMesh);
  await ctx.yield();
  const irng = rng.fork('ice'), tower = [], blocks = [], chips = [];
  // the tower is a prow of the ice cliff, on the west ridge where the two faces meet (it faces the knife ridge): its foot is the cliff's
  const outW = new THREE.Vector3(n0[0] + T0[0], 0, n0[1] + T0[1]).normalize();
  const seracBase = (() => { const gi = {}; let r = 0.3, seen = false;
    for (; r < 0.5; r += 0.004) { heightFn((n0[0] * 1050 + T0[0] * 950) * r, (n0[1] * 1050 + T0[1] * 950) * r, gi); if (gi.gl > 0.5) seen = true; else if (seen && gi.gl < 0.02) break; }
    const x = (n0[0] * 1050 + T0[0] * 950) * r + outW.x * 14, z = (n0[1] * 1050 + T0[1] * 950) * r + outW.z * 14; return new THREE.Vector3(x, heightFn(x, z) - 6, z); })();
  await ctx.yield();
  for (let k = 0; k < NTOWER; k++) tower.push({ y: (k + 0.5) * (HT / NTOWER), sx: 112 - k * 10 + irng.range(-6, 6), sy: (HT / NTOWER) * 1.36, sz: 82 - k * 7 + irng.range(-5, 5), ox: irng.range(-5, 5) + (k % 2 ? 7 : -7), oz: irng.range(-6, 6), yaw: (k % 2 ? 0.4 : -0.3) + irng.range(-0.25, 0.25),
    ax: new THREE.Vector3(irng.range(-1, 1), irng.range(-0.4, 0.4), irng.range(-1, 1)).normalize(), spin: irng.range(3, 8), side: k % 2 ? 1 : -1, w: irng.range(-0.6, 0.6) });
  // lesser shards stand out of the tower's faces (so it is no stack of blocks) and scatter from it as it falls
  for (let c = 0; c < NCHIP; c++) { const k = c % NTOWER, T = tower[k], an = irng.range(0, 6.283);
    chips.push({ k, off: new THREE.Vector3(Math.cos(an) * T.sx * 0.42, irng.range(-0.3, 0.45) * T.sy, Math.sin(an) * T.sz * 0.42), sx: irng.range(26, 44), sy: irng.range(36, 68), sz: irng.range(24, 40), yaw: irng.range(0, 6.283), lead: irng.range(0.002, 0.012), fly: irng.range(0.6, 2.2),
      ax: new THREE.Vector3(irng.range(-1, 1), irng.range(-0.4, 0.4), irng.range(-1, 1)).normalize(), spin: irng.range(4, 10) }); }
  for (let i = 0; i < NBLK; i++) blocks.push({ side: sides[i % sides.length], w: Math.pow(irng(), 0.8) * (i % 4 === 0 ? -1 : 1), lead: irng.range(0.01, 0.05), size: irng.range(3.6, 8.5), hop: irng.range(4, 15), sp: irng.range(1.6, 3.2), ph: irng() * 6.28,
    ax: new THREE.Vector3(irng.range(-1, 1), irng.range(-1, 1), irng.range(-1, 1)).normalize() });

  // the look may ask for the shadow line to cross the serac tower as it cracks: its foot in blue shade, its top still in the sun
  if (look.shadowY === 'serac') look.shadowY = [seracBase.y + 122, seracBase.y + 300];
  const sDrop = look.shadowDrop === 'low' ? Math.max(0, look.shadowY[0] - 660) : (look.shadowDrop || 0);
  // ---------- state: a pure function of (u, time) ----------
  const tp = [0, 0, 0], m4 = new THREE.Matrix4(), q4 = new THREE.Quaternion(), q5 = new THREE.Quaternion(), q6 = new THREE.Quaternion(), p4 = new THREE.Vector3(), p5 = new THREE.Vector3(), s4 = new THREE.Vector3(), leanAx = new THREE.Vector3(T0[0] * 0.35 - 0.99 * 0.65, 0, T0[1] * 0.35 + 0.139 * 0.65).normalize(), outDir = outW;
  const burstP = new THREE.Vector3(), UP = new THREE.Vector3(0, 1, 0);
  { const a = trackPos(D_BURST, -1, 0, tp), b = [0, 0, 0]; trackPos(D_BURST, 1, 0, b); burstP.set((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2); }
  let curU = 0, uDriven = false;
  await ctx.yield();
  const towerPos = (k, u, out, quat) => {
    const T = tower[k], lean = sat((u - U_CRACK) / (U_FALL - U_CRACK)), gF = sat((u - U_FALL) / (U_HIT - U_FALL)), f = sat((gF - 0.05 - (NTOWER - 1 - k) * 0.05) / 0.62), ang = 0.5 * Math.pow(lean, 1.5) + 0.55 * gF;
    q6.setFromAxisAngle(leanAx, -ang);                      // the whole tower tips over on its foot, out along the face
    out.set(T.ox, T.y, T.oz).applyQuaternion(q6).add(seracBase).addScaledVector(outDir, 8);
    if (f > 0) { trackPos(D_BURST + 0.01, T.side, T.w, tp); const g = Math.pow(f, 1.15), y0 = out.y; out.x = mix(out.x, tp[0], g); out.z = mix(out.z, tp[2], g); out.y = y0 - (y0 - tp[1] - 6) * f * f; }
    if (quat) { quat.setFromAxisAngle(UP, T.yaw + 0.55).premultiply(q6); if (f > 0) quat.premultiply(q5.setFromAxisAngle(T.ax, f * f * T.spin)); }
    return f;
  };
  // the front stands 150 m tall in the couloirs, swells to 260 m where the two tongues meet at the foot, and runs out as a wall 170 m tall
  const frontH = (d) => mix(150, 170, sstep(0.9, 1.12, d)) + 100 * Math.exp(-Math.pow((d - 1.03) / 0.07, 2));
  const bodyH = (d, fk) => 128 - 64 * fk + 0.85 * (frontH(d) - 150);
  const lobeF = (w) => 0.016 * Math.sin(w * 8.3 + 1.3) + 0.01 * Math.sin(w * 19 + 4);     // the front is lobed, the same for everything that rides it
  function pose(u, time) {
    U.uShadowY.value = mix(look.shadowY[0], look.shadowY[1], u) - sDrop * Math.exp(-u / 0.045); U.uTime.value = time;
    const dF = frontD(u), dF2 = frontD(u - 0.05), on = sstep(U_HIT, U_HIT + 0.03, u), on2 = sstep(U_HIT + 0.05, U_HIT + 0.08, u);
    for (let i = 0; i < NB_; i++) {
      const b = B[i]; let x = 0, y = -9999, z = 0, s = 0, roll = 0, baseY = 0, top = 1;
      if (b.kind === 2) {
        const t = (u - (U_HIT - 0.008)) / 0.1;
        if (t > 0 && t < 1) { trackPos(D_BURST + 0.035 * t * (1 + b.w), b.side, b.w * 0.8, tp); s = b.smax * sstep(0, 0.22, t) * (1 - sstep(0.62, 1, t));
          x = tp[0]; z = tp[2]; baseY = tp[1]; top = 200; y = tp[1] + s * 0.3 + b.hf * 150 * (1 - (1 - t) * (1 - t)); roll = time * 0.7 + b.seed; }
      } else {
        const life = (b.ph + time * b.rate) % 1, dFs = b.side === 2 ? dF2 : dF, o = b.side === 2 ? on2 : on, fk = fanK(dFs), HF = frontH(dFs), dL = dFs - 0.065 * fk * b.w * b.w + lobeF(b.w) * fk;
        const dHead = Math.min(dFs, 1.035) - 0.004, H0 = bodyH(dFs, fk), arch = 0.1 + 0.9 * Math.sqrt(Math.max(0, 1 - b.w * b.w)); let rise = 0;
        if (o > 0) {
          if (b.kind === 0) {
            // in the couloir every billow rides ON the tongue's own surface (the head is a mound of them, overlapping, 110 m long);
            // on the glacier they climb the standing front and stream back over its brow
            const up = sstep(0, 0.55, life), back = sat((life - 0.3) / 0.7), d = dL - (4 + 18 * up + mix(92, 170, fk) * Math.pow(back, 1.3)) / R0;
            if (d > D_BURST - 0.012) { trackPos(d, b.side, b.w, tp);
              s = b.smax * sstep(0, 0.1, life) * (1 - sstep(0.82, 1, life)) * mix(2.0, 1, fk) * o * sstep(D_BURST - 0.012, D_BURST + 0.03, d);
              rise = HF * b.hf * (1 - 0.4 * Math.pow(Math.abs(b.w), 4)) * 0.9 * Math.pow(up, 0.75) * (1 - 0.3 * back);
              rise = mix(H0 * bodyProf((dHead - d) / 0.31) * arch * (0.8 + 0.2 * up) + s * (0.1 + 0.25 * b.hf), rise, fk);
              x = tp[0] + upN.x * rise * (1 - fk); z = tp[2] + upN.z * rise * (1 - fk); baseY = tp[1]; top = HF; y = tp[1] + s * 0.25 * fk + rise * mix(upN.y, 1, fk); roll = time * (0.4 + b.rate * 5) + b.seed; }
          } else {
            const d = dL - 0.03 - Math.pow(life, 1.1) * (0.2 + 0.05 * (1 - fk));
            if (d > D_BURST - 0.012) { trackPos(d, b.side, b.w, tp);
              s = b.smax * mix(0.6 + 0.85 * bodyProf((dHead - d) / 0.31), 1, fk) * sstep(0, 0.15, life) * (1 - sstep(0.7, 1, life)) * o * sstep(D_BURST - 0.012, D_BURST + 0.03, d);
              rise = mix(Math.min(HF * 0.72, H0 * bodyProf((dHead - d) / 0.31) * arch) + s * 0.2 + life * b.hf * 30, HF * 0.72 + life * b.hf * 70, fk);
              x = tp[0] + upN.x * rise * (1 - fk); z = tp[2] + upN.z * rise * (1 - fk); baseY = tp[1]; top = HF * 1.6; y = tp[1] + rise * mix(upN.y, 1, fk); roll = time * (0.3 + b.rate * 5) + b.seed; }
          }
        }
      }
      const G = i < NFINE ? fineG : coarseG, k = i < NFINE ? i : i - NFINE;
      G.P.setXYZW(k, x, y, z, s); G.R.setXYZW(k, roll, b.seed, baseY, top);
    }
    fineG.P.needsUpdate = fineG.R.needsUpdate = coarseG.P.needsUpdate = coarseG.R.needsUpdate = true;
    for (let sI = 0; sI < NBODY; sI++) {
      const side = sides[sI], dFs = side === 2 ? dF2 : dF, o = side === 2 ? on2 : on, fk = fanK(dFs), dHead = Math.min(dFs, 1.035) - 0.004, H0 = bodyH(dFs, fk);
      for (let i = 0; i < NR; i++) {
        const f = i / (NR - 1), d = dHead - f * 0.31, live = o * sstep(D_BURST - 0.012, D_BURST + 0.05, d), hgt = H0 * bodyProf(f) * live, slope = H0 * live * (bodyProf(f + 0.02) - bodyProf(f - 0.02)) / (0.04 * 0.31 * R0);
        trackPos(d, side, -0.98, tA); trackPos(d, side, 0.98, tB); trackPos(d - 0.01, side, 0, tC); latV.set(tB[0] - tA[0], tB[1] - tA[1], tB[2] - tA[2]).normalize();
        alV.set(tC[0] - (tA[0] + tB[0]) * 0.5, tC[1] - (tA[1] + tB[1]) * 0.5, tC[2] - (tA[2] + tB[2]) * 0.5).normalize();   // up the track
        for (let j = 0; j < NC; j++) { const c = (j / (NC - 1)) * 2 - 1, k = ((sI * NR + i) * NC + j) * 3, arch = Math.sqrt(Math.max(0, 1 - c * c)), up = hgt * (0.1 + 0.9 * arch) - 7 * c * c - (hgt < 1 ? 8 : 0), m = (c + 1) * 0.5;
          bodyPos[k] = mix(tA[0], tB[0], m) + upN.x * up; bodyPos[k + 1] = mix(tA[1], tB[1], m) + upN.y * up; bodyPos[k + 2] = mix(tA[2], tB[2], m) + upN.z * up;
          nrmV.copy(upN).multiplyScalar(1.05 - c * c).addScaledVector(latV, c * 1.1).addScaledVector(alV, -slope).normalize();
          bodyNor[k] = nrmV.x; bodyNor[k + 1] = nrmV.y; bodyNor[k + 2] = nrmV.z;
          bodyB[k] = mix(tA[1], tB[1], m); bodyB[k + 1] = Math.max(H0, 1); bodyB[k + 2] = Math.min(1, hgt / 60) * (0.35 + 0.65 * arch); }
      }
    }
    bodyPA.needsUpdate = bodyNA.needsUpdate = bodyBA.needsUpdate = true;
    for (let i = 0; i < NS; i++) {
      const b = S[i]; let x = 0, y = -9999, z = 0, s = 0, a = 0;
      if (i < NDUST) {   // ice dust: a puff at the crack, then a streamer strung out behind every falling piece (alpha + 2 marks it for the shader)
        const t = (u - (U_CRACK - 0.004)) / 0.14, k = i % NTOWER, j = Math.floor(i / NTOWER);   // (eight to a piece)
        if (t > 0 && t < 1) { const fall = sstep(U_FALL, U_FALL + 0.012, u), fNow = towerPos(k, u, p5, null), f = towerPos(k, Math.max(U_FALL, u - 0.0045 * j * fall), p4, null);   // (the dust hangs where the piece has been)
          x = mix(seracBase.x + b.w * 52, p4.x + b.w * 9, fall); y = mix(seracBase.y + 4 + b.rise * 22 + j * 26, p4.y + b.rise * 6, fall); z = mix(seracBase.z + (b.seed - 0.5) * 46, p4.z + (b.seed - 0.5) * 9, fall);
          s = mix(24 + 30 * b.seed, 30 + 5 * j + 14 * b.seed + 26 * f * f, fall); a = 2 + mix(0.2 * (1 - 0.7 * sstep(0.15, 0.7, (u - U_CRACK) / (U_FALL - U_CRACK))), (0.8 - 0.065 * j) * sstep(0, 0.1, fNow) * sstep(0.03, 0.2, f) * (1 - 0.6 * sstep(0.8, 1, f)), fall) * sstep(0, 0.05, t) * (1 - sstep(0.72, 1, t)); }
      } else {
        const life = (b.ph + time * b.rate) % 1, dFs = b.side === 2 ? dF2 : dF, o = b.side === 2 ? on2 : on, fk = fanK(dFs), dL = dFs - 0.065 * fk * b.w * b.w + lobeF(b.w) * fk;
        const d = b.skirt ? dL + 0.008 + 0.02 * life : dL - 0.02 - life * b.L;
        if (o > 0 && d > D_BURST) { trackPos(d, b.side, b.w, tp); s = b.skirt ? b.size * (0.55 + 0.5 * life) : b.size * (0.6 + 0.9 * life) * mix(1.5, 1, fk);
          // the plume's mist stands off the face: over the tongue's back while there is one, 60 to 100 m clear of the rock behind it
          const off = b.skirt ? 0 : (bodyH(dFs, fk) * bodyProf(sat((Math.min(dFs, 1.035) - 0.004 - d) / 0.31)) * 0.85 + (26 + 34 * b.rise) * (0.35 + 0.65 * life)) * (1 - fk);
          x = tp[0] + upN.x * off; z = tp[2] + upN.z * off; y = tp[1] + s * 0.2 + upN.y * off + (b.skirt ? 0 : b.rise * mix(40, 62, fk) * life);
          a = (b.skirt ? 0.36 : mix(0.56, 0.34, fk)) * sstep(0, 0.16, life) * (1 - sstep(0.5, 1, life)) * o * sstep(D_BURST, D_BURST + 0.04, d); }
      }
      sP[i * 4] = x; sP[i * 4 + 1] = y; sP[i * 4 + 2] = z; sP[i * 4 + 3] = s; sA[i * 2] = a; sA[i * 2 + 1] = b.seed;
    }
    sPA.needsUpdate = true; sAA.needsUpdate = true;
    for (let k = 0; k < NTOWER; k++) {
      const T = tower[k], f = towerPos(k, u, p4, q4), sc = f >= 0.97 ? 0 : 1;
      m4.compose(p4, q4, s4.set(T.sx * sc, T.sy * sc, T.sz * sc)); iceMesh.setMatrixAt(k, m4);
    }
    for (let c = 0; c < NCHIP; c++) {   // the lesser shards: part of the tower until it goes, then flung clear of it and tumbling
      const ch = chips[c], f = towerPos(ch.k, u + ch.lead * sstep(U_FALL - 0.01, U_FALL + 0.01, u), p4, q4), sc = f >= 0.97 ? 0 : 1;
      p5.copy(ch.off).multiplyScalar(1 + ch.fly * f).applyQuaternion(q6); p4.add(p5); p4.y -= 40 * f * ch.fly * 0.3;
      q4.multiply(q5.setFromAxisAngle(UP, ch.yaw)); if (f > 0) q4.premultiply(q5.setFromAxisAngle(ch.ax, f * ch.spin));
      m4.compose(p4, q4, s4.set(ch.sx * sc, ch.sy * sc, ch.sz * sc)); iceMesh.setMatrixAt(NTOWER + c, m4);
    }
    for (let i = 0; i < NBLK; i++) {
      const b = blocks[i], uu = b.side === 2 ? u - 0.05 : u, dFs = frontD(uu), fk = fanK(dFs), d = dFs - 0.065 * fk * b.w * b.w + lobeF(b.w) * fk + b.lead, o = sstep(U_HIT + 0.02, U_HIT + 0.06, uu);
      trackPos(d, b.side, b.w, tp); const hop = Math.abs(Math.sin(time * b.sp + b.ph));
      p4.set(tp[0], tp[1] + b.size * 0.4 + hop * b.hop, tp[2]); q4.setFromAxisAngle(b.ax, time * b.sp * 1.3 + b.ph);
      m4.compose(p4, q4, s4.setScalar(b.size * o)); iceMesh.setMatrixAt(NTOWER + NCHIP + i, m4);
    }
    iceMesh.instanceMatrix.needsUpdate = true;
  }
  pose(0, 0);
  const summit = new THREE.Vector3(0, H, 0), tmpA = [0, 0, 0], tmpB = [0, 0, 0];
  // where to look: the tower until it hits, then the front (w picks the place across the wall: 0 centre, +1 the flank by the flight line)
  const frontAt = (u, out = new THREE.Vector3(), w = 0) => {
    if (u < U_HIT) { towerPos(4, u, out, null); }
    else { const dFs = frontD(u), fk = fanK(dFs), d = dFs - 0.065 * fk * w * w - 0.02; trackPos(d, -1, w, tmpA); trackPos(d, 1, w, tmpB); out.set((tmpA[0] + tmpB[0]) / 2, (tmpA[1] + tmpB[1]) / 2 + 50, (tmpA[2] + tmpB[2]) / 2); }
    return out.add(group.position);
  };
  const footP = new THREE.Vector3(), runP = new THREE.Vector3();
  trackPos(1.0, 1, 0, tp); footP.set(tp[0], tp[1], tp[2]); trackPos(D_END - 0.05, 1, 0, tp); runP.set(tp[0], tp[1], tp[2]);
  return {
    object: group, radius: 1100, height: H, center: new THREE.Vector3(-250, 760, 300), ground: true, groundY: 0,
    anchors: { summit, seracBand: seracBase.clone(), burst: burstP.clone(), foot: footP, runout: runP, bannerDir: bDir.clone(), faceNormal: new THREE.Vector3(n0[0], 0, n0[1]), faceLateral: new THREE.Vector3(T0[0], 0, T0[1]) },
    uniforms: U, heightAt: (lx, lz) => heightFn(lx, lz), frontD, frontAt, timing: { crack: U_CRACK, fall: U_FALL, hit: U_HIT, foot: U_FOOT }, seracY: [seracBase.y, seracBase.y + HT],
    setU(u) { uDriven = true; curU = u; },
    update(dt, time) { if (!uDriven) curU = (time * 0.03) % 1; pose(curU, time); },
    dispose() { tex.dispose(); },
  };
}
